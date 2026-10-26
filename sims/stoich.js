(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* Reaction mixer. The model is exact stoichiometry: extent ξ = min(nᵢ/νᵢ) over the reactants (rounded down to whole
   events when you count molecules), every amount after is nᵢ − νᵢξ (reactants) or νⱼξ (products). The particle view
   is built from that answer, so the drawing always conserves atoms: drawn reactants = ν·(drawn events) + drawn leftover. */
const M=f=>CL.molarMass(f);
const RX={
  water:{name:'Water: 2H₂ + O₂ → 2H₂O',re:[{f:'H2',c:2,st:'g'},{f:'O2',c:1,st:'g'}],pr:[{f:'H2O',c:2,st:'g'}],main:0},
  nh3:{name:'Ammonia: N₂ + 3H₂ → 2NH₃',re:[{f:'N2',c:1,st:'g'},{f:'H2',c:3,st:'g'}],pr:[{f:'NH3',c:2,st:'g'}],main:0},
  ch4:{name:'Methane burning: CH₄ + 2O₂ → CO₂ + 2H₂O',re:[{f:'CH4',c:1,st:'g'},{f:'O2',c:2,st:'g'}],pr:[{f:'CO2',c:1,st:'g'},{f:'H2O',c:2,st:'g'}],main:0},
  al:{name:'Aluminum in copper(II) chloride: 2Al + 3CuCl₂ → 2AlCl₃ + 3Cu',re:[{f:'Al',c:2,st:'s'},{f:'CuCl2',c:3,st:'aq'}],pr:[{f:'AlCl3',c:2,st:'aq'},{f:'Cu',c:3,st:'s'}],main:1,word:'particles'},
  c3h8:{name:'Propane burning: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O',lvl:'honors',re:[{f:'C3H8',c:1,st:'g'},{f:'O2',c:5,st:'g'}],pr:[{f:'CO2',c:3,st:'g'},{f:'H2O',c:4,st:'g'}],main:1},
  smores:{name:'S’mores (a recipe analogy)',analogy:true,re:[{f:'Gc',c:2,n:'graham crackers',one:'graham cracker',m:7.5},{f:'Ma',c:1,n:'marshmallows',one:'marshmallow',m:7.0},{f:'Ch',c:3,n:'chocolate pieces',one:'chocolate piece',m:3.6}],
    pr:[{f:'Sm',c:1,n:'s’mores',one:'s’more',m:32.8}],main:0,word:'pieces'}
};
Object.values(RX).forEach(R=>[...R.re,...R.pr].forEach(s=>{s.M=s.m||M(s.f);}));
const NAME={H2:'hydrogen',O2:'oxygen',H2O:'water',N2:'nitrogen',NH3:'ammonia',CH4:'methane',CO2:'carbon dioxide',Al:'aluminum',CuCl2:'copper(II) chloride',AlCl3:'aluminum chloride',Cu:'copper',C3H8:'propane'};
const fm=s=>s.n?s.n:CL.fmt(s.f);const fh=s=>s.n?s.n:CL.html(s.f);const one=s=>s.one||CL.fmt(s.f);
const SH={H2:[['H',-5,0,5],['H',5,0,5]],O2:[['O',-6,0,7],['O',6,0,7]],N2:[['N',-6,0,7],['N',6,0,7]],H2O:[['O',0,-1,7.5],['H',-7.5,4.5,4.5],['H',7.5,4.5,4.5]],
  NH3:[['N',0,1,7.5],['H',-8,5,4.5],['H',8,5,4.5],['H',0,-8,4.5]],CH4:[['C',0,0,7.5],['H',-7.5,-6,4.5],['H',7.5,-6,4.5],['H',-7.5,6,4.5],['H',7.5,6,4.5]],
  CO2:[['O',-11.5,0,6.5],['C',0,0,7.5],['O',11.5,0,6.5]],C3H8:[['C',-10,1,6.5],['C',0,-2,6.5],['C',10,1,6.5],['H',-16,-5,3.8],['H',-16,7,3.8],['H',-4,-10,3.8],['H',4,-10,3.8],['H',16,-5,3.8],['H',16,7,3.8],['H',-3,7,3.8],['H',3,7,3.8]],
  Al:[['Al',0,0,8]],Cu:[['Cu',0,0,8]],CuCl2:[['Cu',0,0,7.5],['Cl',-11,3,6.5],['Cl',11,3,6.5]],AlCl3:[['Al',0,0,7.5],['Cl',-11,4,6.2],['Cl',11,4,6.2],['Cl',0,-11.5,6.2]]};
const T0=1;  // seconds of mixing before the first reaction event
const BOX={x:14,y:58,w:512,h:380};
const SUF={count:'N',mol:'M',g:'G'};
const LET=['a','b','c'];

function unitsOf(p){const R=RX[p.rx];let u=p.units;if(R.analogy&&u==='mol')u='count';return u;}
function model(p){const R=RX[p.rx],u=unitsOf(p),disc=u==='count'||!!R.analogy;
  const nIn=R.re.map((s,i)=>{const v=p[LET[i]+SUF[u]];if(u==='g'){const n=v/s.M;return R.analogy?Math.floor(n+1e-9):n;}return v;});
  const ext=nIn.map((n,i)=>n/R.re[i].c);let xi=Math.min(...ext);if(disc)xi=Math.floor(xi+1e-9);
  const lim=ext.map((e,i)=>e-Math.min(...ext)<1e-9?i:-1).filter(i=>i>=0);
  const left=nIn.map((n,i)=>Math.max(0,n-R.re[i].c*xi));
  let uD=1;if(!disc){const big=Math.max(...nIn,...R.pr.map(s=>s.c*xi),1e-9);uD=[0.01,0.02,0.05,0.1,0.2,0.25,0.5,1,2].find(q=>big/q<=22)||2;}
  const E=disc?xi:Math.round(xi/uD);const L=left.map(l=>disc?Math.round(l):Math.round(l/uD));
  return {R,u,disc,nIn,ext,xi,lim,left,uD,E,L,D:R.re.map((s,i)=>s.c*E+L[i]),dur:clamp(0.32*E,1.5,4)};}
const word=(m)=>m.u==='count'?(m.R.word||'molecules'):m.u==='mol'?'mol':'g';
function inUnit(m,s,n){return m.u==='count'?n:m.u==='mol'?n:n*s.M;}
function fmtU(m,v){if(!Number.isFinite(v))return '—';return m.u==='count'?String(Math.round(v)):m.u==='mol'?v.toFixed(3):v.toFixed(2);}
function frac(sim){const m=sim.st.m;return clamp((sim.t-T0)/m.dur,0,1);}
function amounts(sim,f){const m=sim.st.m,R=m.R;if(f===undefined)f=frac(sim);
  return {re:R.re.map((s,i)=>m.nIn[i]-s.c*m.xi*f),pr:R.pr.map(s=>s.c*m.xi*f)};}
function massTotal(m,a){const R=m.R;let g=0;R.re.forEach((s,i)=>g+=a.re[i]*s.M);R.pr.forEach((s,j)=>g+=a.pr[j]*s.M);return g;}
function yieldG(sim){const m=sim.st.m;if(m.u==='count')return {theo:NaN,act:NaN,pct:NaN};const s=m.R.pr[m.R.main];const theo=s.c*m.xi*s.M;
  let act=theo*(1-sim.p.loss/100);if(sim.p.wet)act+=theo*0.25;return {theo,act,pct:theo>0?100*act/theo:NaN};}

/* ---------- control and tile labels follow the reaction ---------- */
function relabel(sim){if(!sim.ui||!sim.ui.sec)return;const R=RX[sim.p.rx],u=unitsOf(sim.p),sec=sim.ui.sec;
  ['a','b','c'].forEach((l,i)=>{['N','M','G'].forEach(sx=>{const inp=sec.querySelector('#stoich-'+l+sx);if(!inp)return;const w=inp.closest('.ctl');const s=R.re[i];
    if(s){const lb=w.querySelector('label');lb.textContent=sx==='N'?(R.analogy?'Number of ':'Number of ')+(s.n||CL.fmt(s.f)+' '+(R.word||'molecules')):sx==='M'?'Moles of '+CL.fmt(s.f):'Mass of '+fm(s);}
    w.hidden=!s||!atLeast(w.dataset.lvl)||SUF[u]!==sx;});});
  const tile=id=>{const t=sim.ui.tiles[id];return t&&t.num.closest('.tile');};
  const wd=u==='count'?(R.word||'molecules'):u;
  R.re.forEach((s,i)=>{const t=tile('r'+(i+1));if(t){t.querySelector('.t-l').textContent=(s.n?s.n.charAt(0).toUpperCase()+s.n.slice(1):CL.fmt(s.f))+' left';t.querySelector('.u').textContent=wd;}});
  const t3=tile('r3');if(t3)t3.hidden=R.re.length<3||!atLeast('bio');
  const pm=R.pr[R.main],tp=tile('p1');if(tp){tp.querySelector('.t-l').textContent=(pm.n?'S’mores':CL.fmt(pm.f))+' made';tp.querySelector('.u').textContent=wd;}
  const dd=u==='count'?0:u==='mol'?3:2;['r1','r2','r3','p1'].forEach(id=>{const mm=sim.def.metrics.find(x=>x.id===id);mm.d=dd;});}
function changed(sim){if(sim.st)BioLab.reset(sim);relabel(sim);}

function spawn(st,sp,x,y,r){const a=r()*6.283,v=26+r()*30;return {sp,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,rot:r()*6.28,w:(r()-0.5)*1.5,state:'free'};}
function sz(sp){return (sp==='C3H8'?20:sp==='Gc'||sp==='Sm'?18:16)*1.55;}

const SIM={
  id:'stoich',hash:'stoich',apUnit:8,order:4,tab:'Stoichiometry and limiting reactants',kind:'Simulation',prereq:['mole','balance'],next:['airbag','gasstoich','precip'],
  card:'Mix reactants molecule by molecule, watch one run out, and find the limiting reactant, the excess and the theoretical yield.',
  title:'Stoichiometry: limiting reactant, excess and yield',
  lede:{bio:'A balanced equation is a recipe. Mix reactants and watch them combine in the recipe’s ratio until one runs out. That one, the limiting reactant, decides how much product you get.',
        honors:'Work in moles and grams: follow the stoichiometry map g → mol → mol → g, find the limiting reactant from masses, and compare the actual yield with the theoretical yield.',
        ap:'Track every amount with a before-change-after table, find the mass of excess left over, and check that mass is conserved even when moles are not.'},
  scale:{bio:'Each colored ball is one atom, and each cluster is one molecule. In “Count” mode every molecule is drawn.',honors:'Each ball is one atom. In moles or grams, one drawn molecule stands for a set number of moles, shown in the corner of the box; real samples hold about 10²³ molecules.'},
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.1,window:8,unit:'s',chChange:1,chReveal:6.2,
  controls:[
    {id:'rx',label:'Reaction',type:'select',def:'water',lvl:'bio',options:Object.keys(RX).map(k=>({v:k,l:RX[k].name,lvl:RX[k].lvl})),onChange:changed},
    {id:'units',label:'Measure amounts in',type:'seg',def:'count',lvl:'bio',options:[{v:'count',l:'Count'},{v:'mol',l:'Moles',lvl:'honors'},{v:'g',l:'Grams',lvl:'honors'}],onChange:changed},
    {id:'aN',label:'Reactant 1',type:'range',min:0,max:15,step:1,def:6,lvl:'bio',onChange:changed},
    {id:'bN',label:'Reactant 2',type:'range',min:0,max:15,step:1,def:4,lvl:'bio',onChange:changed},
    {id:'cN',label:'Reactant 3',type:'range',min:0,max:15,step:1,def:9,lvl:'bio',onChange:changed},
    {id:'aM',label:'Reactant 1',type:'range',min:0,max:5,step:0.05,def:2,unit:' mol',lvl:'honors',onChange:changed},
    {id:'bM',label:'Reactant 2',type:'range',min:0,max:5,step:0.05,def:0.8,unit:' mol',lvl:'honors',onChange:changed},
    {id:'cM',label:'Reactant 3',type:'range',min:0,max:5,step:0.05,def:1,unit:' mol',lvl:'honors',onChange:changed},
    {id:'aG',label:'Reactant 1',type:'range',min:0,max:80,step:0.5,def:4,unit:' g',lvl:'honors',onChange:changed},
    {id:'bG',label:'Reactant 2',type:'range',min:0,max:80,step:0.5,def:16,unit:' g',lvl:'honors',onChange:changed},
    {id:'cG',label:'Reactant 3',type:'range',min:0,max:80,step:0.5,def:30,unit:' g',lvl:'honors',onChange:changed},
    {id:'loss',label:'Product lost while collecting it',type:'range',min:0,max:40,step:1,def:15,unit:' %',lvl:'honors',help:'Spills, product left on the filter paper, side reactions'},
    {id:'wet',label:'Weigh the product before it is dry',type:'toggle',def:false,lvl:'honors'}
  ],
  game:{label:'Perfect mix',title:'Perfect mix',rounds:6,fireLabel:'Mix',par:300,metrics:[],
  intro:{bio:'Six mixes. Each round gives you one reactant. Use the coefficients to work out how much of the other reactant uses it all up, with nothing left over. Set the slider, then press Mix. A first-try perfect mix scores 3 points.',
         honors:'Six mixes, from molecules to moles to grams. Use the mole ratio (and molar masses) to find the amount that leaves nothing over, set the slider, then press Mix. First-try perfect mixes score 3.'},
  newRound(sim,i){const lv=BioLab.level,pick=a=>a[Math.floor(Math.random()*a.length)],rs=(a,b,st)=>Math.round((a+Math.random()*(b-a))/st)*st;
    const u=lv==='bio'||i<2?'count':i<4?'mol':'g';
    const gPool=lv==='ap'?['al','c3h8']:['water','al'];
    let rx=u==='count'?pick(['water','nh3','ch4','al']):u==='mol'?pick(['water','nh3','ch4']):pick(gPool);
    let R,gi=i%2,ui,cg,cu,sg,su,given,ans,tries=0;
    const setup=()=>{R=RX[rx];ui=1-gi;cg=R.re[gi].c;cu=R.re[ui].c;sg=R.re[gi];su=R.re[ui];};setup();
    /* Grams: both amounts must fit the 0–80 g sliders, with the answer at least 12 g so slider rounding stays under 3%.
       Find the given range that allows that; if a pairing has none (a few grams of H₂ against all the O₂), swap roles, then try the other reaction. */
    let gLo=8,gHi=78;
    if(u==='g'){const opts=[];gPool.forEach(x=>[gi,1-gi].forEach(g=>opts.push([x,g])));opts.sort((a,b)=>(a[0]===rx?0:2)+(a[1]===gi?0:1)-((b[0]===rx?0:2)+(b[1]===gi?0:1)));
      for(const [x,g] of opts){rx=x;gi=g;setup();const f=cu*su.M/(cg*sg.M);gLo=Math.ceil(Math.max(8,12/f)*2)/2;gHi=Math.floor(Math.min(78,78/f)*2)/2;if(gHi>=gLo)break;}}
    do{tries++;if(u==='count'){const k=1+Math.floor(Math.random()*Math.floor(15/Math.max(cg,cu)));given=cg*k;ans=cu*k;}
       else if(u==='mol'){given=rs(1,4,0.05);ans=given*cu/cg;}
       else{given=rs(gLo,gHi,0.5);ans=given/sg.M*cu/cg*su.M;}}
    while(tries<300&&(u==='mol'?(ans<1||ans>5):u==='g'?(ans<12||ans>78):false));
    const suf=SUF[u],gid=LET[gi]+suf,uid=LET[ui]+suf,set={rx,units:u};set[gid]=given;set[uid]=0;if(R.re[2])set[LET[2]+suf]=0;
    BioLab.setValues(sim,set);BioLab.reset(sim);sim.running=false;
    const unit=u==='count'?(R.word||'molecules'):u==='mol'?'mol':'g',show=v=>u==='count'?String(v):u==='mol'?v.toFixed(2):v.toFixed(1);
    const hint=lv==='bio'?` <span class="gm-hint">Hint: the equation says ${cg} ${one(sg)} react${cg===1?'s':''} with ${cu} ${one(su)}. Scale that up.</span>`:
      u==='g'?` <span class="gm-hint">Grams → moles → mole ratio → moles → grams. Molar masses: ${CL.fmt(sg.f)} ${sg.M.toFixed(2)} g/mol, ${CL.fmt(su.f)} ${su.M.toFixed(2)} g/mol.</span>`:'';
    return {rx,u,gi,ui,ans,controls:[uid],
      prompt:`<b>Round ${i+1}: ${R.name}</b><br>You have <b>${show(given)} ${unit} of ${fh(sg)}</b>. How much ${fh(su)} reacts with all of it and leaves <b>nothing</b> left over?`+hint};},
  fire(sim,r){BioLab.reset(sim);sim.running=true;},
  retry(sim,r){BioLab.reset(sim);sim.running=false;},
  poll(sim,r){if(!sim.st||frac(sim)<1)return null;const m=model(sim.p),R=m.R,tol=m.u==='count'?0:0.03;
    const extra=m.left.map((l,k)=>m.nIn[k]>0?l/m.nIn[k]:0);
    if(extra.every(x=>x<=tol+1e-9))return {ok:true,msg:'Perfect mix! Both reactants were used up, with nothing left over.'};
    const k=extra[r.ui]>tol?r.ui:r.gi,s=R.re[k],amt=fmtU(m,inUnit(m,s,m.left[k]));
    return {ok:false,msg:`${amt} ${word(m)} of ${fh(s)} ${m.left[k]===1&&m.u==='count'?'was':'were'} left over, so you used ${k===r.ui?'too much':'too little'} ${fh(R.re[r.ui])}. Check the mole ratio.`};},
  solve(sim,r){const st=r.u==='count'?1:r.u==='mol'?0.05:0.5;const v={};v[LET[r.ui]+SUF[r.u]]=Math.round(r.ans/st)*st;BioLab.setValues(sim,v);}},
  init(sim){const m=model(sim.p),r=rng(7+Math.round(m.nIn.reduce((a,b)=>a+b,0)*13)),st={m,parts:[],done:0,pend:[],fl:[],hist:[],ht:-1};
    m.R.re.forEach((s,i)=>{for(let j=0;j<m.D[i];j++){const q=spawn(st,s.f,BOX.x+30+r()*(BOX.w-60),BOX.y+60+r()*(BOX.h-120),r);q.ri=i;st.parts.push(q);}});
    st.r=r;return st;},
  step(sim,dt){const st=sim.st,m=st.m,R=m.R,f=frac(sim);
    const target=Math.min(m.E,Math.floor(m.E*f+1e-9));
    while(st.done<target){const pick=[];let ok=true;const seed=st.parts.find(q=>q.state==='free'&&q.ri===0);
      R.re.forEach((s,i)=>{const free=st.parts.filter(q=>q.state==='free'&&q.ri===i);if(seed)free.sort((a,b)=>Math.hypot(a.x-seed.x,a.y-seed.y)-Math.hypot(b.x-seed.x,b.y-seed.y));
        if(free.length<s.c)ok=false;pick.push(...free.slice(0,s.c));});
      st.done++;if(!ok)continue;const cx=pick.reduce((a,q)=>a+q.x,0)/pick.length,cy=pick.reduce((a,q)=>a+q.y,0)/pick.length;
      pick.forEach(q=>{q.state='merge';q.tx=cx;q.ty=cy;});st.pend.push({t:0.35,pick,cx,cy});}
    st.pend=st.pend.filter(e=>{e.t-=dt;if(e.t>0)return true;st.parts=st.parts.filter(q=>!e.pick.includes(q));
      R.pr.forEach(s=>{for(let j=0;j<s.c;j++){const q=spawn(st,s.f,e.cx+(st.r()-0.5)*16,e.cy+(st.r()-0.5)*16,st.r);q.pi=1;st.parts.push(q);}});st.fl.push({x:e.cx,y:e.cy,t:0});return false;});
    st.parts.forEach(q=>{if(q.state==='merge'){q.x=lerp(q.x,q.tx,clamp(dt*9,0,1));q.y=lerp(q.y,q.ty,clamp(dt*9,0,1));return;}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.rot+=q.w*dt;const s=sz(q.sp);
      if(q.x<BOX.x+s){q.x=BOX.x+s;q.vx=Math.abs(q.vx);}if(q.x>BOX.x+BOX.w-s){q.x=BOX.x+BOX.w-s;q.vx=-Math.abs(q.vx);}
      if(q.y<BOX.y+s+36){q.y=BOX.y+s+36;q.vy=Math.abs(q.vy);}if(q.y>BOX.y+BOX.h-s-30){q.y=BOX.y+BOX.h-s-30;q.vy=-Math.abs(q.vy);}});
    st.fl=st.fl.filter(e=>{e.t+=dt;return e.t<0.6;});
    if(sim.t-st.ht>=0.099){st.ht=sim.t;const a=amounts(sim,f);st.hist.push({t:sim.t,v:[...a.re.map((n,i)=>inUnit(m,R.re[i],n)),...a.pr.map((n,j)=>inUnit(m,R.pr[j],n))]});if(st.hist.length>400)st.hist.shift();}},
  metrics:[
    {id:'r1',label:'Reactant 1 left',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>{const m=s.st.m;return inUnit(m,m.R.re[0],amounts(s).re[0]);}},
    {id:'r2',label:'Reactant 2 left',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>{const m=s.st.m;return inUnit(m,m.R.re[1],amounts(s).re[1]);}},
    {id:'r3',label:'Reactant 3 left',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>{const m=s.st.m;return m.R.re[2]?inUnit(m,m.R.re[2],amounts(s).re[2]):NaN;}},
    {id:'p1',label:'Product made',unit:'',lvl:'bio',min:0,max:null,d:0,get:s=>{const m=s.st.m,j=m.R.main;return inUnit(m,m.R.pr[j],amounts(s).pr[j]);}},
    {id:'lim',label:'Limiting reactant',unit:'',lvl:'bio',text:true,get:s=>{const m=s.st.m;if(frac(s)<1)return 'Watch which runs out…';if(m.lim.length>1)return 'None: '+m.lim.map(i=>fm(m.R.re[i])).join(' and ')+' run out together';return fm(m.R.re[m.lim[0]]);}},
    {id:'theo',label:'Theoretical yield',unit:'g',lvl:'honors',min:0,max:null,d:2,get:s=>yieldG(s).theo},
    {id:'act',label:'Actual yield (what you weigh)',unit:'g',lvl:'honors',min:0,max:null,d:2,get:s=>frac(s)<1?NaN:yieldG(s).act},
    {id:'pyield',label:'Percent yield',unit:'%',lvl:'honors',min:0,max:120,d:1,get:s=>frac(s)<1?NaN:yieldG(s).pct},
    {id:'mass',label:'Total mass in the box',unit:'',lvl:'ap',text:true,get:s=>{const m=s.st.m,g=massTotal(m,amounts(s,0)),g2=massTotal(m,amounts(s));
      if(m.u==='count')return m.R.analogy?g.toFixed(1)+' g → '+g2.toFixed(1)+' g':g.toFixed(2)+' u → '+g2.toFixed(2)+' u';return g.toFixed(2)+' g → '+g2.toFixed(2)+' g';}}
  ],
  graphs:[{id:'lines',label:'Amounts during the reaction',lvl:'bio',custom:true},{id:'bars',label:'Before and after',lvl:'bio',custom:true}],
  defaultGraph:'lines',
  plot(sim,ctx,box,id){const st=sim.st,m=st.m,R=m.R,sp=[...R.re,...R.pr];const H=st.hist,unit=word(m);
    const before=amounts(sim,0),after=amounts(sim,1);const vb=[...before.re.map((n,i)=>inUnit(m,R.re[i],n)),...before.pr.map((n,j)=>inUnit(m,R.pr[j],n))];
    const va=[...after.re.map((n,i)=>inUnit(m,R.re[i],n)),...after.pr.map((n,j)=>inUnit(m,R.pr[j],n))];const ymax=Math.max(1e-6,...vb,...va)*1.15;
    if(id==='bars'){const ax=axes(ctx,box,{xmin:0,xmax:sp.length,ymin:0,ymax,xcats:sp.map(s=>s.n?s.n.split(' ')[0]:CL.fmt(s.f)),yl:'Amount ('+unit+')',yd:m.u==='count'?0:undefined});
      const w=0.3;sp.forEach((s,i)=>{const x=ax.X(i+0.5);ctx.fillStyle=PAL['muted'];ctx.globalAlpha=0.45;ctx.fillRect(x-ax.X(w)+ax.X(0),ax.Y(vb[i]),ax.X(w)-ax.X(0)-2,ax.Y(0)-ax.Y(vb[i]));ctx.globalAlpha=1;
        ctx.fillStyle=serColor(i);ctx.fillRect(x+2,ax.Y(va[i]),ax.X(w)-ax.X(0)-2,ax.Y(0)-ax.Y(va[i]));
        txt(ctx,fmtU(m,va[i]),x+(ax.X(w)-ax.X(0))/2,ax.Y(va[i])-5,{s:12,c:PAL['fg'],a:'center',w:600});});
      legend(ctx,box.L+10,box.T+8,[{label:'before',color:PAL['muted']},{label:'after (colors)',color:serColor(0)}]);return;}
    const tmax=Math.max(T0+m.dur+1.5,sim.t);const ax=axes(ctx,box,{xmin:0,xmax:tmax,ymin:0,ymax,xl:'Time (s)',yl:'Amount ('+unit+')',yd:m.u==='count'?0:undefined});
    ctx.save();ctx.beginPath();ctx.rect(box.L,box.T,box.W,box.H);ctx.clip();
    sp.forEach((s,i)=>{ctx.strokeStyle=serColor(i);ctx.lineWidth=2.5;ctx.setLineDash(i>=R.re.length?[6,4]:[]);ctx.beginPath();H.forEach((r,j)=>{const X=ax.X(r.t),Y=ax.Y(r.v[i]);j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.stroke();});
    ctx.setLineDash([]);ctx.restore();legend(ctx,box.L+10,box.T+8,sp.map((s,i)=>({label:s.n?s.n:CL.fmt(s.f),color:serColor(i),dash:i>=R.re.length})));},
  infoPanel(sim){const m=sim.st.m,R=m.R,hon=atLeast('honors'),ap=atLeast('ap'),unit=word(m);
    if(!hon||R.analogy&&!ap){const rows=R.re.map((s,i)=>`<tr><td style="text-align:left">${fh(s)}</td><td>${m.nIn[i]}</td><td>${s.c}</td><td>${Math.floor(m.ext[i]+1e-9)}</td></tr>`).join('');
      const L=m.lim.map(i=>fh(R.re[i])).join(' and ');
      return `<h3>Recipe check</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Reactant</th><th>You have</th><th>Recipe uses</th><th>Batches it could make</th></tr></thead><tbody>${rows}</tbody></table></div>
        <p style="margin-top:10px">You can make only <b>${m.xi} ${m.xi===1?'batch':'batches'}</b>, the smallest number in the last column. ${L} ${m.lim.length>1?'run':'runs'} out first, so ${m.lim.length>1?'they are':'it is'} limiting. Each batch makes ${R.pr.map(s=>s.c+' '+(s.n?s.one:CL.html(s.f))).join(' + ')}.</p>`;}
    const sp=[...R.re,...R.pr],a0=amounts(sim,0),a1=amounts(sim,1);const v0=[...a0.re,...a0.pr],v1=[...a1.re,...a1.pr];
    const cell=(s,n)=>fmtU(m,inUnit(m,s,n));
    let h=`<h3>Before, change, after (${unit})</h3><div class="tbl-wrap"><table><thead><tr><th></th>${sp.map(s=>`<th>${fh(s)}</th>`).join('')}</tr></thead><tbody>
      <tr><td style="text-align:left">Before</td>${sp.map((s,i)=>`<td>${cell(s,v0[i])}</td>`).join('')}</tr>
      <tr><td style="text-align:left">Change</td>${sp.map((s,i)=>{const d=v1[i]-v0[i];return `<td>${d>0?'+':d<0?'−':''}${cell(s,Math.abs(d))}</td>`;}).join('')}</tr>
      <tr><td style="text-align:left">After</td>${sp.map((s,i)=>`<td>${cell(s,v1[i])}</td>`).join('')}</tr></tbody></table></div>`;
    const P=R.pr[R.main];
    if(!R.analogy){h+=`<p style="margin-top:10px"><b>Stoichiometry map.</b> Find how much ${CL.html(P.f)} each reactant could make. The smaller answer is the theoretical yield.</p>`;
      R.re.forEach((s,i)=>{const n=m.nIn[i],ratio=P.c/s.c,np=n*ratio;let chain;
        if(m.u==='g')chain=`${(n*s.M).toFixed(2)} g ${CL.html(s.f)} × (1 mol / ${s.M.toFixed(2)} g) × (${P.c} mol ${CL.html(P.f)} / ${s.c} mol ${CL.html(s.f)}) × (${P.M.toFixed(2)} g / 1 mol) = <b>${(np*P.M).toFixed(2)} g ${CL.html(P.f)}</b>`;
        else if(m.u==='mol')chain=`${n.toFixed(3)} mol ${CL.html(s.f)} × (${P.c} mol ${CL.html(P.f)} / ${s.c} mol ${CL.html(s.f)}) = <b>${np.toFixed(3)} mol ${CL.html(P.f)}</b>`;
        else chain=`${n} ${CL.html(s.f)} × (${P.c} ${CL.html(P.f)} / ${s.c} ${CL.html(s.f)}) = <b>${(np).toFixed(np%1?1:0)} ${CL.html(P.f)}</b>${np%1?' (only whole molecules can form)':''}`;
        h+=`<p>${m.lim.includes(i)?'✓ ':''}${chain}</p>`;});}
    if(ap&&m.u!=='count'){const ex=R.re.map((s,i)=>i).filter(i=>!m.lim.includes(i));ex.forEach(i=>{const s=R.re[i];h+=`<p class="help">Excess ${CL.html(s.f)}: ${(m.nIn[i]).toFixed(3)} mol − ${s.c} × ${m.xi.toFixed(3)} mol used = ${m.left[i].toFixed(3)} mol = ${(m.left[i]*s.M).toFixed(2)} g left over.</p>`;});
      const y=yieldG(sim);if(Number.isFinite(y.pct))h+=`<p class="help">Percent yield = actual ÷ theoretical × 100 = ${y.act.toFixed(2)} ÷ ${y.theo.toFixed(2)} × 100 = ${y.pct.toFixed(1)}%.</p>`;}
    return h;},
  narrate(sim){const st=sim.st,m=st.m,R=m.R,f=frac(sim),hon=atLeast('honors');
    if(m.nIn.some(n=>n<=0))return 'One reactant is set to zero, so nothing can react. A reaction needs every reactant in the recipe.';
    const recipe=R.re.map(s=>s.c+' '+(s.n?(s.c>1?s.n:s.one):CL.fmt(s.f))).join(' + ');
    if(f<=0)return 'The recipe is <b>'+recipe+'</b>. Count what you have and predict which reactant will run out first.';
    if(f<1)return 'Every time '+recipe+' come together they make '+R.pr.map(s=>s.c+' '+(s.n?(s.c>1?s.n:s.one):CL.fmt(s.f))).join(' + ')+'. The reactants are used up in that ratio, not one for one.';
    const L=m.lim.map(i=>fm(R.re[i]));
    if(m.lim.length>1)return '<b>Everything was used up.</b> You mixed the reactants in exactly the recipe ratio, so nothing is left over and there is no limiting reactant.';
    const ex=R.re.map((s,i)=>i).filter(i=>!m.lim.includes(i)).map(i=>fmtU(m,inUnit(m,R.re[i],m.left[i]))+' '+(m.u==='count'?'':word(m)+' ')+fm(R.re[i]));
    let s='<b>'+(R.analogy?L[0].charAt(0).toUpperCase()+L[0].slice(1)+' are':L[0]+' is')+' the limiting reactant.</b> It ran out first, so the reaction stopped with '+ex.join(' and ')+' left over as excess.';
    if(hon&&m.u==='g'){const lo=m.lim[0],light=R.re.map((q,i)=>m.nIn[i]*q.M).indexOf(Math.min(...R.re.map((q,i)=>m.nIn[i]*q.M)));if(light!==lo)s+=' Notice that it was not the reactant with the smaller mass: moles and the mole ratio decide.';}
    else if(m.u==='count'){const few=m.nIn.indexOf(Math.min(...m.nIn));if(few!==m.lim[0])s+=' It was not the reactant you had the fewest of. The recipe needs more of it.';}
    return s;},
  tour:[
    {title:'The recipe',text:'A balanced equation is a recipe. 2H₂ + O₂ → 2H₂O means 2 hydrogen molecules react with 1 oxygen molecule to make 2 water molecules.',focus:[0,6,800,50],pause:true},
    {title:'What you start with',text:'The box holds 6 H₂ (white pairs) and 4 O₂ (red pairs). The bars on the right count them.',focus:[[BOX.x,BOX.y,BOX.w,BOX.h],[536,58,258,380]],pause:true},
    {title:'Watch them react',text:'Each time 2 H₂ and 1 O₂ meet, they rearrange into 2 H₂O. Atoms are not created or destroyed, only rearranged.',focus:[BOX.x,BOX.y,BOX.w,BOX.h],speed:0.3},
    {title:'One runs out',text:'H₂ runs out first, even though you started with more H₂ than O₂. The recipe needs twice as much H₂. H₂ is the limiting reactant.',focus:[536,58,258,380],speed:1},
    {title:'Excess',text:'One O₂ is left over with nothing to react with. O₂ is the excess reactant. The amount of product was set by the limiting reactant: 6 H₂ make 6 H₂O.',focus:[536,58,258,380],pause:true},
    {lvl:'honors',title:'Grams are not moles',text:'Now 4.0 g of H₂ and 16.0 g of O₂. The H₂ has less mass but far more molecules (2.0 g/mol vs 32.0 g/mol), so this time O₂ is limiting.',focus:[0,0,800,450],speed:0.5,setup(sim){BioLab.setValues(sim,{units:'g',aG:4,bG:16});BioLab.reset(sim);}},
    {lvl:'honors',title:'The stoichiometry map',text:'In the table below the graph: grams → moles (÷ molar mass) → moles of product (× mole ratio) → grams (× molar mass). Do it for each reactant; the smaller answer is the theoretical yield.',focus:[536,58,258,380],pause:true},
    {lvl:'ap',title:'Percent yield',text:'In a real lab you never collect all of it. Percent yield = actual yield ÷ theoretical yield × 100. Above 100% means the product was wet or impure.',focus:[536,58,258,380],pause:true}
  ],
  onTourExit(sim){BioLab.setValues(sim,{rx:'water',units:'count',aN:6,bN:4});BioLab.reset(sim);},
  onLevel(sim){relabel(sim);},
  challenges:[
    {lvl:'bio',q:'You mix 6 H₂ and 4 O₂ molecules (2H₂ + O₂ → 2H₂O). Which runs out first?',choices:['O₂, because there is less of it','H₂','They run out at the same time'],correct:1,
     baseline:{rx:'water',units:'count',aN:6,bN:4},changeText:'Reactants mixed',watch:'lines',
     explain:{bio:'6 H₂ is enough for only 3 batches (2 per batch), but 4 O₂ is enough for 4 batches. H₂ runs out after 3 batches, leaving 1 O₂. The reactant you have less of is not always the limiting one.'}},
    {lvl:'bio',q:'N₂ + 3H₂ → 2NH₃. You mix 2 N₂ with 9 H₂. How many NH₃ molecules form?',choices:['2','4','6','9'],correct:1,
     baseline:{rx:'nh3',units:'count',aN:2,bN:9},changeText:'Reactants mixed',watch:'bars',
     explain:{bio:'2 N₂ can make 2 batches; 9 H₂ could make 3. N₂ runs out after 2 batches, and each batch makes 2 NH₃, so 4 NH₃ form and 3 H₂ are left.'}},
    {lvl:'bio',instant:true,q:'A s’more takes 2 graham crackers, 1 marshmallow and 3 chocolate pieces. You have 8 graham crackers, 6 marshmallows and 9 chocolate pieces. How many s’mores can you make?',choices:['6','4','3','8'],correct:2,
     explain:{bio:'Crackers: 8 ÷ 2 = 4 s’mores. Marshmallows: 6 ÷ 1 = 6. Chocolate: 9 ÷ 3 = 3. The chocolate runs out first, so you make 3 s’mores. Chocolate is the limiting reactant. Set the S’mores reaction to 8, 6 and 9 to see it.'}},
    {lvl:'honors',q:'You react 4.0 g of H₂ with 16.0 g of O₂. Which is the limiting reactant?',choices:['H₂, because it has the smaller mass','O₂','Neither'],correct:1,
     baseline:{rx:'water',units:'g',aG:4,bG:16},changeText:'Reactants mixed',watch:'lines',
     explain:{honors:'4.0 g ÷ 2.016 g/mol = 1.98 mol H₂, which needs 0.99 mol O₂. You only have 16.0 g ÷ 32.00 g/mol = 0.500 mol O₂. O₂ runs out first even though it has four times the mass. Always compare moles, using the ratio.'}},
    {lvl:'honors',q:'2 mol of H₂ (4.03 g) react completely with 1 mol of O₂ (32.00 g). What mass of water forms?',choices:['18.0 g','36.0 g','54.0 g','4.0 g'],correct:1,
     baseline:{rx:'water',units:'mol',aM:2,bM:1},changeText:'Reactants mixed',
     explain:{honors:'2 mol H₂O × 18.02 g/mol = 36.0 g, the same as 4.03 g + 32.00 g. Mass is conserved because atoms are only rearranged, even though 3 mol of reactants became 2 mol of product.'}},
    {lvl:'honors',instant:true,q:'Your percent yield comes out above 100%. What is the most likely reason?',choices:['You really made more product than the theoretical yield','The product was still wet or impure when you weighed it','You used too much of the excess reactant'],correct:1,
     explain:{honors:'The theoretical yield is the most product the limiting reactant can make. Above 100% means you weighed something extra, usually water or impurities. Turn on “Weigh the product before it is dry” to see it happen.'}},
    {lvl:'ap',q:'You burn 16.0 g of CH₄ in 48.0 g of O₂ (CH₄ + 2O₂ → CO₂ + 2H₂O). What is left over when the reaction stops?',choices:['Nothing: both are used up','About 4.0 g of CH₄','About 16 g of O₂','About 12 g of CH₄'],correct:1,
     baseline:{rx:'ch4',units:'g',aG:16,bG:48},changeText:'Reactants mixed',watch:'bars',
     explain:{ap:'CH₄: 16.0 ÷ 16.04 = 0.998 mol, needs 2.00 mol O₂. O₂: 48.0 ÷ 32.00 = 1.50 mol, so O₂ is limiting and burns 0.750 mol CH₄ (12.0 g). 16.0 − 12.0 = 4.0 g of CH₄ is left. The before-change-after table shows each step.'}},
    {lvl:'ap',q:'N₂ + 3H₂ → 2NH₃ turns 4 mol of gas into 2 mol. What happens to the total mass in the box?',choices:['It halves','It stays the same','It doubles'],correct:1,
     baseline:{rx:'nh3',units:'mol',aM:1,bM:3},changeText:'Reactants mixed',
     explain:{ap:'1.00 mol N₂ (28.01 g) + 3.00 mol H₂ (6.05 g) = 34.06 g, and 2.00 mol NH₃ = 34.06 g. Moles of molecules change when atoms regroup, but every atom is still there, so mass is conserved. Check the “Total mass” tile.'}},
    {lvl:'ap',instant:true,q:'2.70 g of Al is added to a solution containing 0.120 mol CuCl₂ (2Al + 3CuCl₂ → 2AlCl₃ + 3Cu). What is the theoretical mass of copper?',choices:['6.36 g','7.63 g','9.53 g','2.70 g'],correct:1,
     explain:{ap:'Al: 2.70 ÷ 26.98 = 0.100 mol, which would need 0.150 mol CuCl₂. Only 0.120 mol is there, so CuCl₂ is limiting. Cu = 0.120 mol × (3/3) × 63.55 g/mol = 7.63 g. 9.53 g assumes Al is limiting; 6.36 g ignores the mole ratio.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How does the limiting reactant decide how much product you get?</p><ol><li>Use the water reaction. Keep O₂ at 4 and set H₂ to 2, 4, 6, 8 and 10. Record a trial after each reaction stops.</li><li>Plot H₂ (x) against water made (y) on the Trials graph.</li></ol><p>Describe where the graph stops rising, and explain why adding more H₂ after that point makes no more water.</p>',
       honors:'<p><b>Question:</b> Can you predict the limiting reactant and theoretical yield from grams?</p><ol><li>Choose Grams. For the ammonia reaction, set 14.0 g N₂ and try H₂ from 1.0 to 6.0 g.</li><li>Before each run, use the stoichiometry map to predict the limiting reactant and the theoretical yield; then record a trial.</li><li>Set the product loss to 10% and find the percent yield.</li></ol><p>Explain why the smaller mass is not always the limiting reactant.</p>',
       ap:'<p><b>Question:</b> How much excess is left, and is mass conserved?</p><ol><li>Burn propane: set 22.0 g C₃H₈ and vary O₂ from 20 g to 100 g.</li><li>Record the reactant left, the CO₂ made and the total mass for each run.</li><li>Find the O₂ mass where both reactants run out together.</li></ol><p><b>Claim–evidence–reasoning:</b> Use your data to show the exact stoichiometric ratio by mass, and explain why total mass stays constant while total moles change.</p>'},
  terms:[{t:'Balanced equation',d:'A recipe for a reaction: the coefficients give the ratio of particles (and moles) that react.'},{t:'Limiting reactant',d:'The reactant that runs out first. It sets the amount of product.'},
    {t:'Excess reactant',d:'The reactant left over when the reaction stops.'},{t:'Product',d:'A substance made by the reaction.'},
    {lvl:'honors',t:'Mole ratio',d:'The ratio of coefficients, like 2 mol H₂O : 2 mol H₂, used to convert moles of one substance to moles of another.'},{lvl:'honors',t:'Theoretical yield',d:'The most product the limiting reactant can make.'},
    {lvl:'honors',t:'Actual yield',d:'The amount of product you really collect and weigh.'},{lvl:'honors',t:'Percent yield',d:'Actual yield ÷ theoretical yield × 100.'},
    {lvl:'ap',t:'Before-change-after table',d:'A table of amounts before the reaction, the change (set by the mole ratio), and after.'},{lvl:'ap',t:'Conservation of mass',d:'Total mass stays the same in a chemical reaction because atoms are only rearranged.'}],
  about:'<p>The amounts are exact: the reaction extent is the smallest of nᵢ ÷ νᵢ over the reactants, and every amount after the reaction follows from the balanced equation. Molar masses come from ChemLab. When you count molecules, only whole batches can react.</p><p>The particle view is built from that answer. In moles or grams one drawn molecule stands for a fixed amount (shown in the box), and leftovers are rounded to the nearest drawn molecule, so the drawing conserves atoms exactly. The speed of the reaction is not real: every mixture reacts over a few seconds so you can watch it. Real reactions need the right conditions (a spark for H₂ and O₂, a catalyst and high pressure for NH₃). The s’more masses (7.5 g cracker, 7.0 g marshmallow, 3.6 g chocolate piece) are typical values for the analogy. Actual yield is the theoretical yield minus the loss you set, plus 25% extra mass if the product is weighed wet.</p>',
  draw(sim,ctx,vdt,k,t){const st=sim.st,m=st.m,R=m.R,f=frac(sim),hon=atLeast('honors');
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
    drawEq(ctx,R,400,32,Math.min(18*k,R.re.length+R.pr.length>3?16*k:19*k));
    ctx.fillStyle=PAL['cv-bg2'];rr(ctx,BOX.x,BOX.y,BOX.w,BOX.h,12);ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
    txt(ctx,m.disc?'Every '+(R.analogy?'piece':R.word==='particles'?'particle':'molecule')+' is drawn':'1 drawn '+(R.word==='particles'?'particle':'molecule')+' = '+m.uD+' mol',BOX.x+12,BOX.y+BOX.h-12,{s:12.5*k,c:PAL['cv-soft'],w:600});
    st.fl.forEach(e=>{ctx.strokeStyle=PAL['s4'];ctx.globalAlpha=1-e.t/0.6;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,8+e.t*50,0,6.29);ctx.stroke();ctx.globalAlpha=1;});
    st.parts.forEach(q=>drawSp(ctx,q.sp,q.x,q.y,q.rot,1.55));
    if(f>=1&&m.E===0&&m.nIn.every(n=>n>0))pill(ctx,'Not enough for even one batch',BOX.x+BOX.w/2,BOX.y+BOX.h/2,PAL['s4'],'#fff',14*k);
    if(f>=1&&m.nIn.every(v=>v>0)&&m.E>0){const L=m.lim.length>1?'Both ran out together':m.lim.map(i=>fm(R.re[i]))[0]+' ran out: limiting';pill(ctx,L,BOX.x+BOX.w/2,BOX.y+20,m.lim.length>1?PAL['s3']:PAL['s1'],'#fff',13*k);}
    // bars panel
    const sp=[...R.re,...R.pr],n=sp.length,x0=540,x1=792,cw=(x1-x0)/n,top=74+18*k,bot=298,stag=k>1.25&&n>2;
    txt(ctx,'Amount ('+word(m)+')',(x0+x1)/2,70,{s:13*k,w:700,a:'center'});
    const a0=amounts(sim,0),a=amounts(sim,f),a1=amounts(sim,1);const vb=[...a0.re.map((v,i)=>inUnit(m,R.re[i],v)),...R.pr.map((s,j)=>inUnit(m,s,a1.pr[j]))];
    const vn=[...a.re.map((v,i)=>inUnit(m,R.re[i],v)),...a.pr.map((v,j)=>inUnit(m,R.pr[j],v))];const vmax=Math.max(1e-9,...vb);
    ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,bot+0.5);ctx.lineTo(x1,bot+0.5);ctx.stroke();
    const arrowX=x0+cw*R.re.length;ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(arrowX,top+6);ctx.lineTo(arrowX,bot);ctx.stroke();ctx.setLineDash([]);
    sp.forEach((s,i)=>{const cx=x0+cw*(i+0.5),bw=Math.min(34,cw*0.55),H=bot-top-14*k-6,hB=H*vb[i]/vmax,hN=H*vn[i]/vmax;
      if(i<R.re.length){ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.strokeRect(cx-bw/2,bot-hB,bw,hB);ctx.setLineDash([]);}
      ctx.fillStyle=serColor(i);ctx.fillRect(cx-bw/2,bot-hN,bw,hN);
      txt(ctx,fmtU(m,vn[i]),cx,bot-Math.max(hN,i<R.re.length?hB:0)-6,{s:12*k,w:700,a:'center'});
      drawSp(ctx,s.f,cx,bot+24,0,0.9);
      if(!R.analogy)txt(ctx,CL.fmt(s.f),cx,bot+52+(stag&&i%2?24*k:0),{s:12.5*k,w:700,a:'center',b:'middle'});});
  },
  thumbSetup(sim){sim.t=T0+0.5;}
};
function drawEq(ctx,R,cx,y,s){const parts=[];R.re.forEach((q,i)=>{if(i)parts.push([' + ',0]);if(q.c>1)parts.push([String(q.c),1]);parts.push([R.analogy?q.f==='Gc'?'Gc':q.f:CL.fmt(q.f)+(q.st?'('+q.st+')':''),0]);});
  parts.push([' → ',0]);R.pr.forEach((q,i)=>{if(i)parts.push([' + ',0]);if(q.c>1)parts.push([String(q.c),1]);parts.push([R.analogy?q.f:CL.fmt(q.f)+(q.st?'('+q.st+')':''),0]);});
  if(R.analogy){parts.length=0;parts.push(['2',1],[' crackers + ',0],['1',1],[' marshmallow + ',0],['3',1],[' chocolate → ',0],['1',1],[' s’more',0]);}
  ctx.font='700 '+s+'px '+FONT;let W=parts.reduce((a,p)=>a+ctx.measureText(p[0]).width,0);let sc=1;if(W>780){sc=780/W;s*=sc;ctx.font='700 '+s+'px '+FONT;W*=sc;}
  let x=cx-W/2;parts.forEach(p=>{txt(ctx,p[0],x,y,{s,w:700,c:p[1]?PAL['s1']:PAL['cv-ink'],b:'middle'});ctx.font='700 '+s+'px '+FONT;x+=ctx.measureText(p[0]).width;});}
function drawSp(ctx,sp,x,y,rot,sc){if(SH[sp]){ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(sc,sc);SH[sp].forEach(a=>CL.drawAtom(ctx,a[1],a[2],a[3],a[0],{label:''}));ctx.restore();return;}
  ctx.save();ctx.translate(x,y);ctx.rotate((rot||0)*0.2);ctx.scale(sc,sc);
  const cracker=(yy)=>{ctx.fillStyle='#c9924e';rr(ctx,-14,yy-4,28,8,2);ctx.fill();ctx.fillStyle='#8a5a26';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(i*8,yy,1.2,0,6.29);ctx.fill();}};
  const mallow=(yy)=>{ctx.fillStyle='#fbf7ef';ctx.strokeStyle='#b9ad99';ctx.lineWidth=1.2;rr(ctx,-10,yy-6,20,12,5);ctx.fill();ctx.stroke();};
  const choc=(yy)=>{ctx.fillStyle='#5a3220';rr(ctx,-8,yy-4,16,8,1.5);ctx.fill();ctx.strokeStyle='#7a4a33';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,yy-4);ctx.lineTo(0,yy+4);ctx.stroke();};
  if(sp==='Gc')cracker(0);else if(sp==='Ma')mallow(0);else if(sp==='Ch')choc(0);
  else if(sp==='Sm'){cracker(9);choc(3);mallow(-4);cracker(-12);}
  ctx.restore();}

BioLab.register(SIM);
})();
