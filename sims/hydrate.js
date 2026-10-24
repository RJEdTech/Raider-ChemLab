(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* Hydrate lab. The model tracks moles in the crucible: anhydrous salt (nA), bound water (nW) and any oxide made by
   decomposition (nOx). Each 5-minute heating removes a fixed fraction of the water above the "floor" the flame
   temperature allows (from the salt's dehydration steps), so the mass approaches a constant value. Error sources
   change the chemistry, not the arithmetic: spatter throws out crystals, bench cooling lets the salt pull water
   back from the air, a warm crucible reads light on the balance, and red-hot heating decomposes CuSO4 to CuO. */
const MW=CL.molarMass('H2O');
const K_GENTLE=1.4,K_STRONG=2.4,SPATTER=0.05,DECOMP=0.12,HOT=0.012,CONST=0.005,LOWT=200,MAXH=6;
const HYD={
  cu:{anh:'CuSO4',ox:'CuO',x:5,name:'copper(II) sulfate pentahydrate',cat:'Cu',an:'SO4',nan:1,hc:'#2f78d0',ac:'#ddd8cc',hyg:0.05,steps:[[2,95],[2,120],[1,250]],decomp:true},
  mg:{anh:'MgSO4',x:7,name:'magnesium sulfate heptahydrate (Epsom salt)',cat:'Mg',an:'SO4',nan:1,hc:'#e9edf1',ac:'#f8f8f5',hyg:0.04,steps:[[6,150],[1,330]]},
  ba:{anh:'BaCl2',x:2,name:'barium chloride dihydrate',cat:'Ba',an:'Cl',nan:2,hc:'#e9edf1',ac:'#f8f8f5',hyg:0.01,steps:[[1,105],[1,150]],toxic:true},
  co:{anh:'CoCl2',x:6,name:'cobalt(II) chloride hexahydrate',cat:'Co',an:'Cl',nan:2,hc:'#c2185b',ac:'#3566d6',hyg:0.06,steps:[[4,110],[1,145],[1,190]]},
  ua:{anh:'CaSO4',x:2,name:'Unknown A: a calcium sulfate hydrate',cat:'Ca',an:'SO4',nan:1,hc:'#eceeef',ac:'#f8f8f5',hyg:0.02,steps:[[1.5,140],[0.5,190]],unknown:true},
  ub:{anh:'ZnSO4',ox:'ZnO',x:7,name:'Unknown B: a zinc sulfate hydrate',cat:'Zn',an:'SO4',nan:1,hc:'#e9edf1',ac:'#f8f8f5',hyg:0.03,steps:[[1,45],[5,130],[1,280]],unknown:true,decomp:true}
};
Object.values(HYD).forEach(h=>{h.Ma=CL.molarMass(h.anh);h.Mh=h.Ma+h.x*MW;h.Mox=h.ox?CL.molarMass(h.ox):0;h.acc=100*h.x*MW/h.Mh;
  h.floor=h.steps.filter(s=>s[1]>LOWT).reduce((a,s)=>a+s[0],0);});
const hf=h=>h.unknown?CL.fmt(h.anh)+'·xH₂O':CL.fmt(h.anh)+'·'+h.x+'H₂O';
const hh=h=>h.unknown?CL.html(h.anh)+'·<i>x</i>H<sub>2</sub>O':CL.html(h.anh)+'·'+h.x+'H<sub>2</sub>O';
const f3=v=>Number.isFinite(v)?v.toFixed(3):'—';
const STN={burner:[190,281],cool:[420,404],balance:[670,346],bench:[420,404]};

function hexMix(a,b,t){const p=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];const A=p(a),B=p(b);
  return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*clamp(t,0,1)).toString(16).padStart(2,'0')).join('');}
function contents(st){const h=HYD[st.h];if(!h)return 0;return st.nA*h.Ma+st.nW*MW+st.nOx*h.Mox;}
function wFrac(st){const h=HYD[st.h];if(!h||st.nA+st.nOx<=0)return 0;return clamp(st.nW/(h.x*(st.nA+st.nOx)),0,1);}

/* ---------- results from the lab notebook (what a student can calculate) ---------- */
function calc(st){const L=st.log,h=HYD[st.h]||HYD.cu;const e=L.find(r=>r.k==='empty'),f=L.find(r=>r.k==='full');
  const per={};L.forEach(r=>{if(r.k==='heat')per[r.n]=r;});const heated=Object.keys(per).map(Number).sort((a,b)=>a-b).map(n=>per[n]);
  const out={e,f,heated,h,mh:NaN,ma:NaN,mw:NaN,pct:NaN,molW:NaN,molA:NaN,x:NaN,constant:false,drop:NaN};
  if(!e||!f)return out;out.mh=f.m-e.m;const last=heated[heated.length-1];if(!last)return out;
  out.ma=last.m-e.m;out.mw=f.m-last.m;out.pct=100*out.mw/out.mh;out.molW=out.mw/MW;out.molA=out.ma/h.Ma;out.x=out.molW/out.molA;
  if(heated.length>=2){out.drop=heated[heated.length-2].m-last.m;out.constant=Math.abs(out.drop)<=CONST+1e-9;}
  return out;}

/* ---------- the procedure, as a queue of timed steps ---------- */
function enq(sim,...steps){sim.st.q.push(...steps);sim.st.msg='';}
const weighEmptySteps=()=>[{k:'move',to:'balance',d:0.6},{k:'weigh',tag:'empty',d:0.5}];
const addSteps=()=>[{k:'move',to:'balance',d:0.4},{k:'add',d:0.8},{k:'weigh',tag:'full',d:0.5}];
const heatSteps=()=>[{k:'move',to:'burner',d:0.6},{k:'heat',d:1.6}];
const coolSteps=sim=>sim.p.hot?[{k:'move',to:'balance',d:0.6},{k:'weigh',tag:'heat',d:0.5}]:[{k:'move',to:sim.p.cool==='air'?'bench':'cool',d:0.6},{k:'coolwait',d:1.0},{k:'move',to:'balance',d:0.6},{k:'weigh',tag:'heat',d:0.5}];
function busy(st){return !!st.cur||st.q.length>0;}
function plan(st){const k={empty:!!st.log.find(r=>r.k==='empty'),h:!!st.h};st.q.forEach(s=>{if(s.k==='weigh'&&s.tag==='empty')k.empty=true;if(s.k==='add')k.h=true;});return k;}
const ACT={
  weighEmpty(sim){const st=sim.st,k=plan(st);if(k.h){st.msg='There is hydrate in the crucible now. Use “New crucible” to start over.';return;}if(k.empty){st.msg='You already weighed the empty crucible.';return;}enq(sim,...weighEmptySteps());},
  add(sim){const st=sim.st,k=plan(st);if(k.h){st.msg='The hydrate is already in. Heat it next.';return;}if(!k.empty)enq(sim,...weighEmptySteps());enq(sim,...addSteps());},
  heat(sim){const st=sim.st,k=plan(st);if(!k.h){st.msg='Weigh the empty crucible and add the hydrate first.';return;}enq(sim,...heatSteps());},
  cool(sim){const st=sim.st,k=plan(st);if(!k.h){st.msg='Add the hydrate and heat it first.';return;}enq(sim,...coolSteps(sim));},
  auto(sim){const st=sim.st,k=plan(st);st.auto=true;if(!k.empty)enq(sim,...weighEmptySteps());if(!k.h)enq(sim,...addSteps());enq(sim,...heatSteps(),...coolSteps(sim),{k:'check',d:0});}
};
function start(sim,s){const st=sim.st;s.t=0;if(s.k==='move'){s.from=[st.pos[0],st.pos[1]];s.toP=STN[s.to];}
  if(s.k==='heat'){st.loc='burner';sim.vis.heatOn=1;}}
function finish(sim,s){const st=sim.st,p=sim.p;sim.infoDirty=true;
  if(s.k==='move'){st.loc=s.to;st.pos=STN[s.to].slice();}
  else if(s.k==='add'){const h=HYD[p.hyd];st.h=p.hyd;const r=rng(st.seed*7+3);st.sample=Math.max(0.5,p.mass+(r()-0.5)*0.04);
    st.nA=st.sample/h.Mh;st.nW=h.x*st.nA;st.nA0=st.nA;st.nOx=0;st.lost=0;}
  else if(s.k==='heat'){const h=HYD[st.h],first=st.heats===0,tech=p.tech;
    if(tech==='strong'&&first){const l=SPATTER;st.lost+=l*(st.nA*h.Ma+st.nW*MW);st.nA*=1-l;st.nW*=1-l;st.notes.spatter=true;}
    const k=tech==='low'||(tech==='proper'&&first)?K_GENTLE:K_STRONG;const floor=tech==='low'?h.floor*st.nA:0;
    if(st.nW>floor)st.nW=floor+(st.nW-floor)*Math.exp(-k);
    if(tech==='over'&&h.decomp&&st.nW<0.1*h.x*st.nA){const d=DECOMP*st.nA;st.nA-=d;st.nOx+=d;st.notes.decomp=true;}
    st.heats++;st.hot=true;sim.vis.heatOn=0;}
  else if(s.k==='coolwait'){const h=HYD[st.h];if(p.cool==='air'){st.nW+=h.hyg*(h.x*st.nA-st.nW);st.notes.rehyd=true;}st.hot=false;}
  else if(s.k==='weigh'){const m=Math.round((st.mc+contents(st)-(st.hot?HOT:0))*1000)/1000;st.reading=m;
    st.log.push({k:s.tag,n:st.heats,m,hot:st.hot,label:s.tag==='empty'?'Empty crucible':s.tag==='full'?'Crucible + hydrate':'After heating '+st.heats+(st.hot?' (still warm)':'')});
    if(s.tag==='heat'&&st.hot)st.notes.hotw=true;}
  else if(s.k==='check'){const c=calc(st);if(c.constant||st.heats>=MAXH){st.auto=false;if(!c.constant)st.msg='Stopped after '+MAXH+' heatings: the mass is still dropping.';}
    else st.q.push(...heatSteps(),...coolSteps(sim),{k:'check',d:0});}}

/* ---------- TGA curve: percent of the starting mass vs temperature ---------- */
const sig=z=>1/(1+Math.exp(-z));
function tgaPct(h,T){let w=h.x;h.steps.forEach(s=>{w-=s[0]*sig((T-s[1])/9);});const D=h.decomp?sig((T-690)/28):0;
  return 100*((1-D)*h.Ma+D*h.Mox+w*MW)/h.Mh;}

const SIM={
  id:'hydrate',hash:'hydrate',apUnit:8,order:3,tab:'Hydrate lab',kind:'Virtual lab',prereq:['mole','percentcomp'],next:['stoich'],
  card:'Heat blue copper(II) sulfate crystals to constant mass, find the percent water and the x in CuSO₄·xH₂O, and see what each lab mistake does.',
  title:'Hydrate lab: percent water and the formula of a hydrate',
  lede:{bio:'A hydrate has water molecules locked inside its crystals. Heat it until the mass stops changing, and the mass you lost tells you how much of the crystal was water.',
        honors:'Turn your masses into moles to find x, the number of water molecules per formula unit, and test how each common mistake pushes your answer high or low.',
        ap:'Treat it as gravimetric analysis: track uncertainty, use the thermogravimetric curve to see why constant mass is not always proof the water is gone, and explain every systematic error.'},
  scale:'A 30 mL porcelain crucible with about 2 g of crystals. The balance reads to 0.001 g. The circle zooms in about 100 million times: each ball is an ion or a water molecule a few tenths of a nanometer across.',
  aspect:1.6,timeless:true,animated:true,chChange:0.6,chReveal:8,
  controls:[
    {id:'hyd',label:'Hydrate',type:'select',def:'cu',lvl:'bio',options:[{v:'cu',l:'Copper(II) sulfate pentahydrate'},{v:'mg',l:'Magnesium sulfate heptahydrate (Epsom salt)'},{v:'ba',l:'Barium chloride dihydrate',lvl:'honors'},{v:'co',l:'Cobalt(II) chloride hexahydrate',lvl:'honors'},{v:'ua',l:'Unknown A (a calcium sulfate hydrate)',lvl:'honors'},{v:'ub',l:'Unknown B (a zinc sulfate hydrate)',lvl:'honors'}],
     help:'Changing the hydrate starts a new crucible.',onChange(sim){if(sim.st)BioLab.reset(sim);}},
    {id:'mass',label:'Hydrate to add (about)',type:'range',min:1,max:3,step:0.05,def:2,unit:' g',d:2,lvl:'bio',help:'You scoop roughly this much; the balance tells you exactly how much.'},
    {id:'tech',label:'Heating technique',type:'select',def:'proper',lvl:'honors',options:[{v:'proper',l:'Gentle first, then strong (correct)'},{v:'strong',l:'Strong flame from the start'},{v:'over',l:'Red-hot for a long time'},{v:'low',l:'Low flame only (about 200 °C)',lvl:'ap'}]},
    {id:'cool',label:'Cool the crucible',type:'seg',def:'desic',lvl:'honors',options:[{v:'desic',l:'In a desiccator'},{v:'air',l:'On the bench, uncovered'}]},
    {id:'hot',label:'Weigh it while still warm',type:'toggle',def:false,lvl:'honors',help:'A real mistake when you are short on time'}
  ],
  actions:[
    {id:'weighEmpty',label:'Weigh empty crucible',lvl:'bio',run(sim){ACT.weighEmpty(sim);}},
    {id:'add',label:'Add hydrate and weigh',lvl:'bio',run(sim){ACT.add(sim);}},
    {id:'heat',label:'Heat 5 minutes',lvl:'bio',run(sim){ACT.heat(sim);}},
    {id:'cool',label:'Cool and weigh',lvl:'bio',run(sim){ACT.cool(sim);}},
    {id:'auto',label:'Heat to constant mass',lvl:'bio',primary:true,run(sim){ACT.auto(sim);}},
    {id:'new',label:'New crucible',lvl:'bio',run(sim){BioLab.reset(sim);}}
  ],
  init(sim){const seed=((sim.st&&sim.st.seed)||0)+1,r=rng(seed*13+5);
    return {seed,mc:Math.round((18+4*r())*1000)/1000,h:null,nA:0,nW:0,nA0:0,nOx:0,lost:0,sample:0,heats:0,log:[],hot:false,q:[],cur:null,
      pos:STN.balance.slice(),loc:'balance',reading:null,msg:'',auto:false,notes:{}};},
  step(sim,dt){const st=sim.st,sp=st.auto?0.2:1;let left=dt;
    for(let guard=0;guard<40&&left>0;guard++){if(!st.cur){if(!st.q.length)break;st.cur=st.q.shift();start(sim,st.cur);}
      const c=st.cur,need=c.d*sp-c.t;if(left>=need){left-=Math.max(0,need);c.t=c.d*sp;finish(sim,c);st.cur=null;}else{c.t+=left;left=0;}
      if(c.k==='move'&&st.cur){const f=clamp(c.t/(c.d*sp),0,1),e=f*f*(3-2*f);st.pos=[lerp(c.from[0],c.toP[0],e),lerp(c.from[1],c.toP[1],e)-Math.sin(Math.PI*e)*40];}}},
  metrics:[
    {id:'mh',label:'Mass of hydrate',unit:'g',lvl:'bio',min:0,max:3,d:3,get:s=>calc(s.st).mh},
    {id:'mw',label:'Mass of water driven off',unit:'g',lvl:'bio',min:0,max:1.6,d:3,get:s=>calc(s.st).mw},
    {id:'pct',label:'Percent water by mass',unit:'%',lvl:'bio',min:0,max:60,d:1,get:s=>calc(s.st).pct},
    {id:'heats',label:'Heatings so far',unit:'',lvl:'bio',min:0,max:MAXH,d:0,get:s=>s.st.heats},
    {id:'const',label:'Constant mass?',unit:'',lvl:'bio',text:true,get:s=>{const c=calc(s.st);if(c.heated.length<2)return 'Heat and weigh at least twice';return c.constant?'Yes: last two agree within 0.005 g':'Not yet: dropped '+c.drop.toFixed(3)+' g';}},
    {id:'molw',label:'Moles of water',unit:'mol',lvl:'honors',min:0,max:0.08,d:4,get:s=>calc(s.st).molW},
    {id:'mola',label:'Moles of anhydrous salt',unit:'mol',lvl:'honors',min:0,max:0.02,d:4,get:s=>calc(s.st).molA},
    {id:'x',label:'x = mol H₂O ÷ mol salt',unit:'',lvl:'honors',min:0,max:8,d:2,get:s=>calc(s.st).x},
    {id:'acc',label:'Accepted percent water',unit:'%',lvl:'ap',min:0,max:60,d:1,get:s=>{const c=calc(s.st),h=HYD[s.st.h||s.p.hyd];return h.unknown&&!c.constant?NaN:h.acc;}},
    {id:'err',label:'Percent error',unit:'%',lvl:'ap',min:0,max:20,d:1,get:s=>{const c=calc(s.st),h=HYD[s.st.h||s.p.hyd];if(h.unknown&&!c.constant)return NaN;return 100*Math.abs(c.pct-h.acc)/h.acc;}}
  ],
  graphs:[{id:'mass',label:'Mass at each weighing',lvl:'bio',custom:true},{id:'tga',label:'TGA: mass vs temperature',lvl:'ap',custom:true}],
  defaultGraph:'mass',
  plot(sim,ctx,box,id){const st=sim.st;
    if(id==='tga'){const h=HYD[st.h||sim.p.hyd];const ax=axes(ctx,box,{xmin:25,xmax:800,ymin:25,ymax:102,xl:'Temperature (°C)',yl:'% of starting mass'});
      [[LOWT,'low flame'],[520,'strong flame'],[750,'red-hot']].forEach(([T,l],i)=>{ctx.strokeStyle=PAL['muted'];ctx.setLineDash([3,4]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax.X(T),box.T);ctx.lineTo(ax.X(T),box.T+box.H);ctx.stroke();ctx.setLineDash([]);
        txt(ctx,l,ax.X(T)+(i===2?-4:4),box.T+14+i*16,{s:12,c:PAL['muted'],a:i===2?'right':'left'});});
      ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();ctx.strokeStyle=serColor(1);ctx.lineWidth=2.5;ctx.beginPath();
      for(let T=25;T<=800;T+=3){const y=ax.Y(tgaPct(h,T));T===25?ctx.moveTo(ax.X(T),y):ctx.lineTo(ax.X(T),y);}ctx.stroke();
      const anh=100*h.Ma/h.Mh;ctx.setLineDash([6,4]);ctx.strokeStyle=serColor(2);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(box.L,ax.Y(anh));ctx.lineTo(box.L+box.W,ax.Y(anh));ctx.stroke();ctx.setLineDash([]);ctx.restore();
      legend(ctx,box.L+150,box.T+box.H-14,[{label:hf(h),color:serColor(1)},{label:'all water gone',color:serColor(2),dash:true}]);return;}
    const L=st.log;if(!L.length){txt(ctx,'Weigh the empty crucible to start your data.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const ms=L.map(r=>r.m),c=calc(st);const lo=Math.min(...ms),hi=Math.max(...ms),pad=Math.max(0.1,(hi-lo)*0.12);
    const n=Math.max(L.length,4);const ax=axes(ctx,box,{xmin:0,xmax:n,ymin:lo-pad,ymax:hi+pad,xticks:false,yl:'Balance reading (g)',yd:hi-lo>2?1:2});
    L.forEach((r,i)=>txt(ctx,r.k==='empty'?'empty':r.k==='full'?'+ hydrate':'heat '+r.n,ax.X(i+0.5),box.T+box.H+16,{s:12,c:PAL['g-axis'],a:'center'}));
    if(c.e){ctx.setLineDash([5,4]);ctx.strokeStyle=PAL['muted'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(box.L,ax.Y(c.e.m));ctx.lineTo(box.L+box.W,ax.Y(c.e.m));ctx.stroke();ctx.setLineDash([]);txt(ctx,'empty crucible',box.L+box.W-4,ax.Y(c.e.m)-6,{s:12,c:PAL['muted'],a:'right'});}
    const pts=L.map((r,i)=>[ax.X(i+0.5),ax.Y(r.m)]).filter((q,i)=>L[i].k!=='empty');
    ctx.strokeStyle=serColor(0);ctx.lineWidth=2.5;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();
    L.forEach((r,i)=>{ctx.fillStyle=r.k==='empty'?PAL['muted']:serColor(0);ctx.beginPath();ctx.arc(ax.X(i+0.5),ax.Y(r.m),5,0,6.29);ctx.fill();});
    if(c.constant){const q=pts[pts.length-1];txt(ctx,'constant mass',q[0],q[1]-12,{s:13,w:700,c:PAL['s3'],a:'center'});}},
  infoPanel(sim){const st=sim.st,c=calc(st),h=HYD[st.h||sim.p.hyd],hon=atLeast('honors'),ap=atLeast('ap');
    let rows=st.log.map(r=>`<tr><td style="text-align:left">${r.label}</td><td>${r.m.toFixed(3)} g</td></tr>`).join('');
    if(!rows)rows='<tr><td style="text-align:left" colspan="2">No masses yet. Start by weighing the empty crucible.</td></tr>';
    let out=`<h3>Lab notebook: ${hh(h)}</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Measurement</th><th>Mass</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if(Number.isFinite(c.mw)){out+=`<p style="margin-top:10px"><b>Hydrate:</b> ${f3(c.f.m)} − ${f3(c.e.m)} = ${f3(c.mh)} g<br><b>Water lost:</b> ${f3(c.f.m)} − ${f3(c.heated[c.heated.length-1].m)} = ${f3(c.mw)} g<br><b>% water</b> = ${f3(c.mw)} ÷ ${f3(c.mh)} × 100 = <b>${c.pct.toFixed(1)}%</b></p>`;
      if(hon)out+=`<p><b>mol H<sub>2</sub>O</b> = ${f3(c.mw)} g ÷ ${MW.toFixed(2)} g/mol = ${c.molW.toFixed(4)} mol<br><b>mol ${CL.html(h.anh)}</b> = ${f3(c.ma)} g ÷ ${h.Ma.toFixed(2)} g/mol = ${c.molA.toFixed(4)} mol<br><b>x</b> = ${c.molW.toFixed(4)} ÷ ${c.molA.toFixed(4)} = <b>${c.x.toFixed(2)}</b>${c.constant?`, so the formula is ${CL.html(h.anh)}·${Math.max(0,Math.round(c.x))}H<sub>2</sub>O`:''}</p>`;
      if(ap&&(!h.unknown||c.constant))out+=`<p class="help">Accepted: ${h.acc.toFixed(1)}% water, x = ${h.x}. Each mass has ±0.001 g uncertainty, so the water mass is good to about ±0.002 g (±${(100*0.002/Math.max(0.01,c.mw)).toFixed(1)}%).</p>`;}
    if(!c.constant&&c.heated.length)out+='<p class="help">Keep heating, cooling and weighing until two masses in a row agree within 0.005 g.</p>';
    return out;},
  narrate(sim){const st=sim.st,p=sim.p,h=HYD[st.h||p.hyd],c=calc(st),cur=st.cur,hon=atLeast('honors');
    if(st.msg)return st.msg;
    if(cur&&cur.k==='heat'){if(p.tech==='strong'&&st.heats===0)return '<b>Too hot, too fast.</b> Water boils inside the crystals and pops bits of solid out of the crucible. That lost solid will be counted as “water”.';
      if(p.tech==='over'&&h.decomp&&wFrac(st)<0.1)return '<b>The dry solid is breaking down.</b> Red-hot '+CL.fmt(h.anh)+' decomposes into '+CL.fmt(h.ox)+' and SO₃ gas, so it keeps losing mass that is not water.';
      if(p.tech==='low'&&st.nW<=h.floor*st.nA*1.05&&h.floor>0)return '<b>The low flame has stalled.</b> At about 200 °C the last '+(h.floor===1?'water molecule':'water molecules')+' per formula unit stay in the crystal. The mass stops changing even though water is still there.';
      return '<b>Heat breaks the attractions holding water in the crystal.</b> Water molecules escape as vapor and leave the ions behind'+(st.h==='cu'?', so the blue crystals fade to a pale gray-white powder.':st.h==='co'?', and the cobalt(II) chloride turns from pink to blue.':'.');}
    if(cur&&cur.k==='coolwait')return p.cool==='air'?'<b>Cooling uncovered.</b> The dry salt is hygroscopic: it pulls water vapor back out of the air, so it gains mass while it cools.':'<b>Cooling in a desiccator.</b> The drying agent keeps the air dry, so the salt cannot pick water back up while it cools to room temperature.';
    if(cur&&cur.k==='add')return 'Adding about '+p.mass.toFixed(2)+' g of '+hf(h)+'. The balance will tell you exactly how much went in.';
    if(!st.log.length&&!busy(st))return '<b>Start by weighing the empty crucible.</b> You will subtract its mass from every later reading. Goggles on, and use crucible tongs: a hot crucible looks exactly like a cold one.'+(h.toxic?' Barium compounds are toxic; wash your hands after the lab.':'');
    if(!st.h&&!busy(st))return 'The empty crucible weighs '+st.log[0].m.toFixed(3)+' g. Now add the hydrate and weigh again.';
    if(st.h&&!c.heated.length&&!busy(st))return 'You have '+f3(c.mh)+' g of '+hf(h)+'. Its crystal holds water molecules bonded to the ions. Heat it to drive the water out.';
    if(c.heated.length===1&&!busy(st))return 'After one heating the mass dropped by '+f3(c.mh-(c.heated[0].m-c.e.m))+' g. You cannot be sure all the water is gone until the mass stops changing, so heat and weigh again.';
    if(c.constant){let s='<b>Constant mass.</b> Two weighings agree within 0.005 g, so no more is leaving. Water lost: '+f3(c.mw)+' g, which is '+c.pct.toFixed(1)+'% of the hydrate'+(hon?', and x = '+c.x.toFixed(2)+'.':'.');
      if(st.notes.rehyd&&hon)s+=' The bench cooling put some water back each time, so this value is low.';
      if(p.tech==='low'&&h.floor>0)s+=' But constant mass does not prove the water is gone: the low flame never got hot enough.';
      if(st.notes.hotw)s+=' Warm crucibles read light, so the water looks larger than it is.';
      if(st.notes.spatter)s+=' Spattered solid made the mass loss too big.';return s;}
    if(st.notes.decomp)return '<b>The mass keeps dropping and the solid is turning black.</b> The water is long gone; now '+CL.fmt(h.anh)+' itself is decomposing, which you would wrongly count as water.';
    if(c.heated.length>=2)return 'The mass dropped another '+c.drop.toFixed(3)+' g, so water was still leaving. Heat, cool and weigh again until two masses agree within 0.005 g.';
    return 'Follow the procedure: weigh, add, heat, cool, weigh, and repeat until the mass is constant.';},
  tour:[
    {title:'Water inside a crystal',text:'A hydrate is an ionic solid with water molecules built into its crystal. Copper(II) sulfate pentahydrate, CuSO₄·5H₂O, has five water molecules for every Cu²⁺ and SO₄²⁻. The circle shows the particles.',focus:[325,60,195,195],pause:true},
    {title:'Weigh the empty crucible',text:'First weigh the clean, dry crucible. Every later reading includes it, so you will subtract it.',focus:[560,300,220,160],speed:1,setup(sim){ACT.weighEmpty(sim);}},
    {title:'Add the hydrate and weigh',text:'Add about 2 g of blue crystals and weigh again. The difference is the exact mass of hydrate.',focus:[560,300,220,160],speed:1,setup(sim){ACT.add(sim);}},
    {title:'Heat it',text:'Heat gently at first, then strongly. In the circle, water molecules break away from the ions and leave as vapor. The ions stay in the crucible.',focus:[[90,230,200,230],[325,60,195,195]],speed:0.5,setup(sim){ACT.heat(sim);}},
    {title:'Cool, then weigh',text:'Let the crucible cool in a desiccator so it cannot pick water back up from the air, then weigh it. It is lighter because water left.',focus:[[340,320,160,140],[560,300,220,160]],speed:0.7,setup(sim){ACT.cool(sim);}},
    {title:'Repeat until constant mass',text:'Heat, cool and weigh again. When two weighings in a row agree within 0.005 g, all the water is gone. The graph below shows the mass leveling off.',focus:[0,0,800,500],speed:1,setup(sim){ACT.auto(sim);}},
    {title:'Percent water',text:'% water = mass of water lost ÷ mass of hydrate × 100. Your lab notebook, beside the graph, shows every subtraction.',focus:[560,300,220,160],pause:true},
    {lvl:'honors',title:'Find x',text:'Turn both masses into moles. x = mol H₂O ÷ mol CuSO₄, rounded to a whole number. Try the error settings in Variables to see which way each mistake pushes x.',focus:[325,60,195,195],pause:true}
  ],
  onTourExit(sim){BioLab.reset(sim);},
  challenges:[
    {lvl:'bio',q:'You heat the hydrate, cool it and weigh it, over and over. What happens to the mass?',choices:['It drops by the same amount every time','It drops a lot at first, then stops changing','It keeps dropping until almost nothing is left'],correct:1,
     baseline:{hyd:'cu'},changeAction:'auto',changeText:'Heating to constant mass',watch:'mass',
     explain:{bio:'Most of the water leaves in the first heating, a little more in the second, then almost none. Once the water is gone, the anhydrous salt stays behind, so the mass levels off. That level is “constant mass”.'}},
    {lvl:'bio',q:'Blue CuSO₄·5H₂O is heated to constant mass. What color is the solid that is left?',choices:['Still bright blue','A pale gray-white powder','Black'],correct:1,
     baseline:{hyd:'cu'},changeAction:'auto',changeText:'Heating to constant mass',
     explain:{bio:'The blue color comes from water molecules bonded to the Cu²⁺ ions. Remove the water and the anhydrous CuSO₄ is almost white. Black means you overheated it and it decomposed to CuO.'}},
    {lvl:'bio',instant:true,q:'A student heats the hydrate once, weighs it and stops, without checking for constant mass. Their percent water will be…',choices:['too high','too low','correct'],correct:1,
     explain:{bio:'Some water is still in the crystal, so the mass lost is smaller than the real mass of water. In this model one heating leaves about a quarter of the water behind, so the result comes out low.'}},
    {lvl:'honors',q:'This time the crucible cools on the bench, uncovered, before each weighing. Compared with the accepted 36.1% water, your result will come out…',choices:['too high','too low','right on'],correct:1,
     baseline:{hyd:'cu',cool:'air'},changeAction:'auto',changeText:'Running the lab with bench cooling',watch:'mass',
     explain:{honors:'Anhydrous CuSO₄ is hygroscopic. While it cools in open air it pulls water vapor back in, so each weighing is too heavy. The water you calculate is too small, so % water and x both come out low (x ≈ 4.6 instead of 5).'}},
    {lvl:'honors',q:'You use a strong flame from the very start, and you hear popping. Your percent water will be…',choices:['too high','too low','unaffected'],correct:0,
     baseline:{hyd:'cu',tech:'strong'},changeAction:'auto',changeText:'Running the lab with a strong flame from the start',
     explain:{honors:'Water boiling inside the crystals spatters solid out of the crucible. That solid is lost too, but you count all the lost mass as water. % water and x come out too high.'}},
    {lvl:'honors',instant:true,q:'A 2.000 g sample of MgSO₄·xH₂O leaves 0.977 g of anhydrous MgSO₄. What is x?',choices:['5','6','7','8'],correct:2,
     explain:{honors:'Water = 2.000 − 0.977 = 1.023 g ÷ 18.02 g/mol = 0.05679 mol. MgSO₄ = 0.977 g ÷ 120.36 g/mol = 0.008117 mol. x = 0.05679 ÷ 0.008117 = 7.00, so MgSO₄·7H₂O (Epsom salt).'}},
    {lvl:'ap',q:'You weigh the crucible while it is still warm after each heating. Your value of x will be…',choices:['too high','too low','unaffected'],correct:0,
     baseline:{hyd:'cu',hot:true},changeAction:'auto',changeText:'Weighing the crucible while warm',
     explain:{ap:'Warm air rising around a hot crucible pushes up on the pan, so it reads about 0.01 g light. The empty crucible was weighed cold, so the extra “loss” gets counted as water: x comes out too high.'}},
    {lvl:'ap',q:'With only a low flame (about 200 °C), copper(II) sulfate reaches constant mass. Your value of x will be…',choices:['about 5, because constant mass means all the water is gone','well below 5 (about 3.6), because water is still trapped in the crystal','above 5'],correct:1,
     baseline:{hyd:'cu',tech:'low'},changeAction:'auto',changeText:'Heating with a low flame only',watch:'tga',
     explain:{ap:'The thermogravimetric curve shows CuSO₄ loses its last water near 250 °C. At 200 °C the mass levels off at CuSO₄·H₂O. You count only 4 waters as lost, and your “anhydrous” mass still holds the fifth, so x ≈ 3.6. Constant mass only proves nothing more leaves at that temperature.'}},
    {lvl:'ap',q:'You heat copper(II) sulfate red-hot for a long time and parts of it turn black. Your value of x will be…',choices:['too high','too low','unaffected'],correct:0,
     baseline:{hyd:'cu',tech:'over'},changeAction:'auto',changeText:'Heating red-hot for a long time',
     explain:{ap:'Above about 650 °C, CuSO₄(s) → CuO(s) + SO₃(g). The escaping SO₃ adds to the mass loss you blame on water, and the mass never settles. x comes out too high.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What percent of a hydrate’s mass is water?</p><ol><li>Weigh the empty crucible, add about 2 g of copper(II) sulfate pentahydrate, and weigh again.</li><li>Heat 5 minutes, cool, and weigh. Repeat until two masses agree within 0.005 g.</li><li>Calculate % water = water lost ÷ hydrate × 100, and record a trial.</li><li>Repeat with Epsom salt.</li></ol><p>Compare with the accepted values (36.1% and 51.2%). Explain why you must heat to constant mass.</p>',
       honors:'<p><b>Question:</b> What is the formula of each hydrate, and how do lab mistakes change it?</p><ol><li>Find x for copper(II) sulfate and for Unknown A. Record a trial for each.</li><li>Repeat the copper(II) sulfate lab three times, changing one thing each time: strong flame from the start, cooling on the bench, weighing while warm.</li><li>For each, note whether % water came out high or low.</li></ol><p>For every error, explain in one sentence what happened to the particles and why it pushed x up or down.</p>',
       ap:'<p><b>Question:</b> Is constant mass proof that all the water is gone?</p><ol><li>Run copper(II) sulfate with the correct technique, then with “Low flame only”. Record both.</li><li>Open the thermogravimetric curve graph and find the temperature of each water-loss step.</li><li>Run Unknown B and find x.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain when constant mass is good evidence of complete dehydration, and estimate the uncertainty in your x from the ±0.001 g balance.</p>'},
  terms:[{t:'Hydrate',d:'An ionic compound with water molecules built into its crystal, written with a dot: CuSO₄·5H₂O.'},{t:'Anhydrous',d:'“Without water”: the salt left after the water of hydration is driven off.'},
    {t:'Water of hydration',d:'The water molecules held in a hydrate’s crystal.'},{t:'Constant mass',d:'Heating until two weighings in a row agree (here, within 0.005 g), which shows no more is leaving.'},
    {t:'Percent water',d:'Mass of water lost ÷ mass of hydrate × 100.'},{t:'Desiccator',d:'A sealed jar with a drying agent where hot samples cool without absorbing moisture.'},
    {lvl:'honors',t:'x in ·xH₂O',d:'Moles of water ÷ moles of anhydrous salt, rounded to a whole number.'},{lvl:'honors',t:'Hygroscopic',d:'Able to pull water vapor out of the air.'},{lvl:'honors',t:'Spattering',d:'Solid thrown out of the crucible when water boils inside the crystals.'},
    {lvl:'ap',t:'Thermogravimetric analysis (TGA)',d:'Measuring mass continuously while temperature rises, which shows each loss step.'},{lvl:'ap',t:'Decomposition',d:'A compound breaking into simpler substances, like CuSO₄ → CuO + SO₃ when red-hot.'},{lvl:'ap',t:'Systematic error',d:'An error that pushes every result the same direction, like weighing a warm crucible.'}],
  about:'<p>The model tracks moles of anhydrous salt and water in the crucible. Each 5-minute heating removes a fixed fraction of the water the flame can remove: about 75% with a gentle flame and 91% with a strong flame. The formulas, molar masses and accepted percent water come from ChemLab’s atomic masses.</p><p>Errors: a strong flame on wet crystals spatters out 5% of the solid. Cooling uncovered lets the salt absorb back part of the water it lost (5% of its capacity for CuSO₄, less for less hygroscopic salts). A warm crucible reads 0.012 g light because of rising warm air. Red-hot heating decomposes 12% of the remaining CuSO₄ (or ZnSO₄) per heating once it is dry.</p><p>The thermogravimetric curve uses approximate step temperatures from published studies (for CuSO₄·5H₂O: 2 H₂O near 95 °C, 2 near 120 °C, the last near 250 °C; decomposition above about 650 °C). Real temperatures depend on heating rate. A “low flame” is taken as about 200 °C, which leaves water that needs a higher temperature. The particle view shows six formula units; real crystals have about 10²¹ of them.</p>',
  initVis(sim){sim.vis.esc=[];sim.vis.prevB=null;sim.vis.heatOn=0;},
  draw(sim,ctx,vdt,k,t){const st=sim.st,p=sim.p,v=sim.vis,h=HYD[st.h||p.hyd],hon=atLeast('honors'),c=calc(st);
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);
    ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,455,800,45);
    const heating=st.cur&&st.cur.k==='heat';const strong=heating&&!(p.tech==='low'||(p.tech==='proper'&&st.heats===0));
    // ring stand and burner
    ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(60,445,90,10);ctx.fillRect(92,215,7,232);
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(99,300);ctx.lineTo(148,300);ctx.stroke();
    ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(190,301,42,7,0,0,6.29);ctx.stroke();
    drawBurner(ctx,190,t,heating,strong);
    // cooling station
    if(p.cool==='air'){ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.5;rr(ctx,360,422,120,10,3);ctx.fill();ctx.globalAlpha=1;}
    else drawDesiccator(ctx,420,k,0);
    // balance
    drawBalance(ctx,670,st,k);
    // crucible
    drawCrucible(ctx,st.pos[0],st.pos[1],st,h,t,heating&&strong);
    if(p.cool!=='air')drawDesiccator(ctx,420,k,1);
    // steam
    if(heating&&!RM&&wFrac(st)>0.02)for(let i=0;i<6;i++){const ph=(t*0.9+i/6)%1;ctx.fillStyle=PAL['cv-soft'];ctx.globalAlpha=0.35*(1-ph);ctx.beginPath();ctx.arc(st.pos[0]-14+i*6+Math.sin(t*3+i)*6,st.pos[1]-26-ph*60,4+ph*7,0,6.29);ctx.fill();}
    ctx.globalAlpha=1;
    // zoom circle
    drawZoom(sim,ctx,420,160,98,vdt,k,t,c);drawSteps(ctx,st,c,k);
    // header: equation + status
    const eq=hf(h)+'(s) → '+CL.fmt(h.anh)+'(s) + '+(h.unknown?'x':h.x)+'H₂O(g)';
    txt(ctx,eq,16,30,{s:15*k,w:700});
    let status=busy(st)?(st.cur&&st.cur.k==='heat'?'Heating '+(st.heats+1):st.cur&&st.cur.k==='coolwait'?'Cooling':st.cur&&st.cur.k==='weigh'?'Weighing':st.cur&&st.cur.k==='add'?'Adding hydrate':'Moving with tongs'):c.constant?'Constant mass ✓':st.heats?st.heats+(st.heats===1?' heating':' heatings'):'';
    if(status){ctx.font='700 '+13*k+'px '+FONT;const pw=ctx.measureText(status).width+13*k*1.1;pill(ctx,status,16+pw/2,30+24*k,c.constant&&!busy(st)?PAL['s3']:PAL['card2'],c.constant&&!busy(st)?'#fff':PAL['cv-ink'],13*k);}
    // station labels
    txt(ctx,'Bunsen burner',190,484,{s:12.5*k,a:'center',c:PAL['cv-ink'],w:600});
    txt(ctx,p.cool==='air'?'Bench (uncovered)':'Desiccator',420,484,{s:12.5*k,a:'center',c:PAL['cv-ink'],w:600});
    txt(ctx,'Balance ±0.001 g',670,484,{s:12.5*k,a:'center',c:PAL['cv-ink'],w:600});
  },
  thumbSetup(sim){const st=sim.st,h=HYD.cu;st.h='cu';st.nA=2/h.Mh;st.nW=h.x*st.nA*0.55;st.log=[{k:'empty',m:st.mc,n:0},{k:'full',m:st.mc+2,n:0}];st.pos=STN.burner.slice();st.cur={k:'heat',t:0,d:99};}
};

function drawBurner(ctx,x,t,on,strong){ctx.fillStyle='#5b6470';ctx.beginPath();ctx.moveTo(x-40,455);ctx.lineTo(x+40,455);ctx.lineTo(x+30,440);ctx.lineTo(x-30,440);ctx.closePath();ctx.fill();
  const g=ctx.createLinearGradient(x-9,0,x+9,0);g.addColorStop(0,'#7d858f');g.addColorStop(0.5,'#c9ced4');g.addColorStop(1,'#7d858f');ctx.fillStyle=g;ctx.fillRect(x-9,345,18,96);
  ctx.fillStyle='#4a525c';ctx.fillRect(x-11,410,22,8);
  if(!on)return;const H=strong?52:30,w=strong?13:11,fl=RM?0:Math.sin(t*23)*2;
  ctx.fillStyle=strong?'rgba(70,120,255,.55)':'rgba(255,170,60,.55)';ctx.beginPath();ctx.moveTo(x-w,345);ctx.quadraticCurveTo(x-w,345-H*0.6,x+fl,345-H);ctx.quadraticCurveTo(x+w,345-H*0.6,x+w,345);ctx.closePath();ctx.fill();
  ctx.fillStyle=strong?'rgba(40,80,230,.85)':'rgba(90,140,255,.6)';ctx.beginPath();ctx.moveTo(x-5,345);ctx.quadraticCurveTo(x-5,345-H*0.35,x,345-H*0.5);ctx.quadraticCurveTo(x+5,345-H*0.35,x+5,345);ctx.closePath();ctx.fill();}
function drawDesiccator(ctx,x,k,front){if(!front){ctx.fillStyle='#2f6fd6';for(let i=0;i<22;i++){ctx.beginPath();ctx.arc(x-52+(i%11)*10.5,442-Math.floor(i/11)*7,3.6,0,6.29);ctx.fill();}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-58,428);ctx.lineTo(x+58,428);ctx.stroke();return;}
  ctx.fillStyle=PAL['cv-water'];ctx.globalAlpha=0.18;rr(ctx,x-64,346,128,106,16);ctx.fill();ctx.globalAlpha=1;
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;rr(ctx,x-64,346,128,106,16);ctx.stroke();
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-70,344);ctx.quadraticCurveTo(x,318,x+70,344);ctx.stroke();ctx.fillStyle=PAL['cv-glass'];rr(ctx,x-10,320,20,10,4);ctx.fill();}
function drawBalance(ctx,x,st,k){ctx.fillStyle='#59616b';rr(ctx,x-100,392,200,60,10);ctx.fill();ctx.fillStyle='#6e7781';rr(ctx,x-100,392,200,14,8);ctx.fill();
  ctx.fillStyle='#8b939c';ctx.fillRect(x-6,374,12,20);ctx.fillStyle='#b8bec6';ctx.beginPath();ctx.ellipse(x,372,58,7,0,0,6.29);ctx.fill();
  const on=Math.hypot(st.pos[0]-STN.balance[0],st.pos[1]-STN.balance[1])<3;const r=on?(st.reading!==null&&!st.cur?st.reading:Math.round((st.mc+contents(st)-(st.hot?HOT:0))*1000)/1000):0;
  const s=17*k,str=r.toFixed(3)+' g';ctx.font='700 '+s+'px '+FONT;const w=Math.min(190,ctx.measureText(str).width+20),hh=s+10;
  ctx.fillStyle='#16241b';rr(ctx,x-w/2,422-hh/2+4,w,hh,5);ctx.fill();txt(ctx,str,x,426+4,{s,w:700,c:'#9cf59c',a:'center',b:'middle'});}
function drawCrucible(ctx,x,y,st,h,t,glow){const wf=wFrac(st),ox=st.nOx/Math.max(1e-9,st.nA+st.nOx);
  if(glow){const g=ctx.createRadialGradient(x,y+18,4,x,y+18,40);g.addColorStop(0,'rgba(255,120,40,.55)');g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y+18,40,0,6.29);ctx.fill();}
  ctx.fillStyle='#ece8df';ctx.strokeStyle='#8d877b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-32,y-22);ctx.lineTo(x+32,y-22);ctx.lineTo(x+20,y+22);ctx.lineTo(x-20,y+22);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(x,y-22,32,6,0,0,6.29);ctx.fillStyle='#d9d4c8';ctx.fill();ctx.stroke();
  if(!st.h)return;let col=hexMix(h.ac,h.hc,wf);if(ox>0)col=hexMix(col,'#2a2522',clamp(ox*2.2,0,0.9));
  const amt=clamp((st.nA+st.nOx)/Math.max(1e-9,st.nA0||st.nA),0.5,1);const r=rng(st.seed*5+1);
  ctx.save();ctx.beginPath();ctx.ellipse(x,y-22,30,5,0,0,6.29);ctx.clip();ctx.fillStyle=col;ctx.fillRect(x-31,y-30,62,12);ctx.restore();
  const n=Math.round(10*amt),big=2.5+3.5*wf;for(let i=0;i<n;i++){const cx=x-22+r()*44,cy=y-26+r()*5-4*amt;ctx.fillStyle=hexMix(col,'#000000',0.08+0.1*r());ctx.strokeStyle=hexMix(col,'#000000',0.35);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx-big,cy);ctx.lineTo(cx,cy-big*1.2);ctx.lineTo(cx+big,cy);ctx.lineTo(cx,cy+big*0.7);ctx.closePath();ctx.fill();ctx.stroke();}}
function drawZoom(sim,ctx,cx,cy,R,vdt,k,t,c){const st=sim.st,v=sim.vis,h=HYD[st.h||sim.p.hyd];
  ctx.save();ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(cx,cy,R,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();
  // connector to the crucible
  const dx=st.pos[0]-cx,dy=st.pos[1]-22-cy,d=Math.hypot(dx,dy);if(d>R+10){const a=Math.atan2(dy,dx);ctx.setLineDash([4,4]);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.lineTo(st.pos[0],st.pos[1]-26);ctx.stroke();ctx.setLineDash([]);}
  ctx.beginPath();ctx.arc(cx,cy,R-1,0,6.29);ctx.clip();
  const hide=h.unknown&&!c.constant;const units=6,heat=st.cur&&st.cur.k==='heat'?1:0,jig=RM?0:(0.6+2.2*heat);
  const totalW=st.h?Math.round(units*h.x*wFrac(st)):units*h.x;const oxU=st.h?Math.round(units*st.nOx/Math.max(1e-9,st.nA+st.nOx)):0;
  if(v.prevB!==null&&totalW<v.prevB&&!hide){for(let i=totalW;i<v.prevB;i++){const u=i%units,col=u%3,row=Math.floor(u/3);v.esc.push({x:cx-60+col*60,y:cy-26+row*56,vx:(Math.random()-0.5)*30,vy:-40-Math.random()*40,life:1.6});}}
  v.prevB=totalW;
  for(let u=0;u<units;u++){const col=u%3,row=Math.floor(u/3),ux=cx-60+col*60,uy=cy-26+row*56;const ph=u*1.7;
    const j=a=>Math.sin(t*9+ph+a)*jig;
    const nw=Math.floor(totalW/units)+(u<totalW%units?1:0);
    const isOx=u<oxU;
    ChemLab.drawAtom(ctx,ux+j(0),uy+j(1),10,h.cat,{color:isOx?'#3b3330':'#3f6fb0',label:''});
    if(isOx)ChemLab.drawAtom(ctx,ux+13+j(2),uy-6+j(3),6,'O',{label:''});
    else if(h.an==='SO4')ChemLab.drawAtom(ctx,ux+(hide?14:0)+j(2),uy+19+j(3),8,'S',{color:'#d4a017',label:''});
    else{ChemLab.drawAtom(ctx,ux-15+j(2),uy+15+j(3),7,'Cl',{label:''});ChemLab.drawAtom(ctx,ux+15+j(4),uy+15+j(5),7,'Cl',{label:''});}
    if(h.an==='SO4'&&!isOx)for(let i=0;i<4;i++){const a=i*Math.PI/2+0.6;ChemLab.drawAtom(ctx,ux+(hide?14:0)+Math.cos(a)*9+j(2),uy+19+Math.sin(a)*7+j(3),4,'O',{label:''});}
    if(!hide)for(let i=0;i<nw;i++){const a=-Math.PI*0.95+i*(Math.PI*1.3/Math.max(1,h.x-1));const r=20;drawWater(ctx,ux+Math.cos(a)*r+j(i+6),uy+Math.sin(a)*r*0.85+j(i+7),a);}}
  v.esc=v.esc.filter(e=>{e.life-=vdt;e.x+=e.vx*vdt;e.y+=e.vy*vdt;if(e.life>0){ctx.globalAlpha=clamp(e.life,0,1);drawWater(ctx,e.x,e.y,e.life*3);ctx.globalAlpha=1;}return e.life>0&&e.y>cy-R-20;});
  if(hide){ctx.fillStyle=PAL['card'];ctx.globalAlpha=0.82;ctx.fillRect(cx-R,cy-R,2*R,2*R);ctx.globalAlpha=1;txt(ctx,'Unknown: find x',cx,cy-6,{s:14*k,w:700,a:'center',b:'middle'});txt(ctx,'from your data',cx,cy+14*k,{s:12*k,a:'center',b:'middle',c:PAL['cv-soft']});}
  ctx.restore();
  // legend to the right of the circle
  const lx=cx-R-16;let ly=cy-34;const items=[[h.cat+'²⁺','#3f6fb0'],[h.an==='SO4'?'SO₄²⁻':'Cl⁻',h.an==='SO4'?'#d4a017':ChemLab.cpk('Cl')],['H₂O','w']];
  items.forEach(([l,col])=>{if(col==='w')drawWater(ctx,lx-6,ly,0);else{ctx.fillStyle=col;ctx.beginPath();ctx.arc(lx-6,ly,6,0,6.29);ctx.fill();}txt(ctx,l,lx-18,ly,{s:12.5*k,b:'middle',w:600,a:'right'});ly+=24*Math.max(1,k*0.85);});
  if(!st.h)txt(ctx,'Inside the crystals you will add',cx,cy+R+16*k,{s:12*k,a:'center',c:PAL['cv-soft']});}
function drawSteps(ctx,st,c,k){const x=578;let y=86;const lh=26*Math.max(1,k*0.85);
  const done=[!!c.e,!!c.f,st.heats>0,c.heated.length>0,c.constant];const L=['Weigh empty','Add + weigh','Heat','Cool + weigh','Constant mass'];
  const now=done.indexOf(false);txt(ctx,'Procedure',x,y-4,{s:12.5*k,w:700,c:PAL['cv-soft']});y+=lh*0.9;
  L.forEach((l,i)=>{const ok=done[i];ctx.strokeStyle=ok?PAL['s3']:PAL['cv-soft'];ctx.lineWidth=2;rr(ctx,x,y-7*k,14*k,14*k,3);ctx.stroke();
    if(ok){ctx.strokeStyle=PAL['s3'];ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(x+3*k,y);ctx.lineTo(x+6*k,y+4*k);ctx.lineTo(x+11*k,y-4*k);ctx.stroke();}
    txt(ctx,(i+1)+'. '+l,x+22*k,y,{s:12.5*k,b:'middle',w:i===now?700:500,c:ok?PAL['cv-soft']:PAL['cv-ink']});y+=lh;});}
function drawWater(ctx,x,y,a){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(0,0,4.6,0,6.29);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.strokeStyle='#8a8a8a';ctx.lineWidth=0.8;[[-4.5,3.6],[4.5,3.6]].forEach(q=>{ctx.beginPath();ctx.arc(q[0],q[1],2.8,0,6.29);ctx.fill();ctx.stroke();});ctx.restore();}

BioLab.register(SIM);
})();
