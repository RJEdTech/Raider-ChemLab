(function(){
'use strict';
const {clamp,lerp,rng,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor,lvText}=BioLab.h;
const CL=window.ChemLab;

/* Percent composition, the magnesium oxide lab, empirical and molecular formulas, and combustion analysis.
   Every number comes from ChemLab atomic masses. The Mg lab tracks moles of Mg, MgO and Mg₃N₂ in the crucible:
   each heating with the lid cracked burns 85% of the remaining Mg (12% of it to Mg₃N₂, the rest to MgO);
   a closed lid starves it of air; no lid lets MgO smoke escape; the water step turns Mg₃N₂ into MgO. */
const ECOL={H:'#6b7b8c',C:'#3d3d3d',O:'#c0392b',N:'#2e5fb0',Na:'#7d3c98',Cl:'#2d8a4e',Fe:'#b8622a',Ca:'#5d8a3a',P:'#d35400',S:'#9a7d0a',Cu:'#8e4a24',Mg:'#4f7d2a'};
const ec=e=>ECOL[e]||'#6d7a88';
const PIE=[['H2O','water'],['CO2','carbon dioxide'],['NaCl','sodium chloride'],['C6H12O6','glucose'],['NaHCO3','sodium hydrogen carbonate (baking soda)'],['Fe2O3','iron(III) oxide (rust)'],['C2H5OH','ethanol'],['NH4NO3','ammonium nitrate (fertilizer)'],['Ca3(PO4)2','calcium phosphate','honors'],['CuSO4*5H2O','copper(II) sulfate pentahydrate','honors'],['C8H10N4O2','caffeine','honors'],['C9H8O4','aspirin','honors']];
const EMP={glucose:['C6H12O6','Glucose'],benzene:['C6H6','Benzene'],h2o2:['H2O2','Hydrogen peroxide'],butane:['C4H10','Butane'],acetic:['C2H4O2','Acetic acid'],vitc:['C6H8O6','Vitamin C'],caffeine:['C8H10N4O2','Caffeine'],n2o4:['N2O4','Dinitrogen tetroxide'],glycol:['C2H6O2','Ethylene glycol'],fe2o3:['Fe2O3','Iron(III) oxide']};
const COMB={ethanol:['C2H6O','Ethanol'],acetone:['C3H6O','Acetone'],ipa:['C3H8O','Isopropyl alcohol'],etac:['C4H8O2','Ethyl acetate'],octane:['C8H18','Octane'],glucose:['C6H12O6','Glucose'],vitc:['C6H8O6','Vitamin C']};
const Mm=f=>CL.molarMass(f),MMG=Mm('Mg'),MMGO=Mm('MgO'),MN3=Mm('Mg3N2'),MO=CL.el('O').mass,MCO2=Mm('CO2'),MH2O=Mm('H2O');
const K_REACT={cracked:0.85,off:0.85,closed:0.35},NIT=0.12,SMOKE=0.05;
const ORD=['Fe','Mg','C','H','N','O'];

function order(c){return Object.keys(c).sort((a,b)=>(ORD.indexOf(a)<0?9:ORD.indexOf(a))-(ORD.indexOf(b)<0?9:ORD.indexOf(b)));}
function simplest(ratios){for(let m=1;m<=8;m++){if(ratios.every(r=>Math.abs(r*m-Math.round(r*m))<0.1))return {m,ints:ratios.map(r=>Math.round(r*m))};}return {m:1,ints:ratios.map(r=>Math.round(r))};}
function fstr(els,ints){return els.map((e,i)=>e+(ints[i]>1?ints[i]:'')).join('');}
/* empirical analysis from element masses */
function analyze(els,masses){const mol=els.map((e,i)=>masses[i]/CL.el(e).mass),lo=Math.min(...mol),rat=mol.map(m=>m/lo),s=simplest(rat);return {els,masses,mol,rat,m:s.m,ints:s.ints,f:fstr(els,s.ints)};}
function empData(p){const f=EMP[p.unk][0],c=CL.parse(f),els=order(c),pc=CL.percentComp(f);const pct=els.map(e=>Math.round(pc.find(q=>q.sym===e).pct*100)/100);
  const g=p.given==='g'?els.map((e,i)=>Math.round(p.smass*pct[i]/100*1000)/1000):pct.slice();const a=analyze(els,g);const Me=Mm(a.f),Mmol=Mm(f);return {...a,f0:f,pct,g,Me,Mmol,n:Math.round(Mmol/Me)};}
function combData(p){const f=COMB[p.cs][0],c=CL.parse(f),n=p.cmass/Mm(f);const mCO2=Math.round(n*c.C*MCO2*10000)/10000,mH2O=Math.round(n*(c.H/2)*MH2O*10000)/10000;
  const mC=mCO2*CL.el('C').mass/MCO2,mH=mH2O*2*CL.el('H').mass/MH2O,mOx=Math.max(0,p.cmass-mC-mH);const els=mOx>0.002?['C','H','O']:['C','H'];const a=analyze(els,els.map(e=>e==='C'?mC:e==='H'?mH:mOx));return {...a,f0:f,mCO2,mH2O,mC,mH,mOx};}

/* ---------- Mg lab procedure ---------- */
const STN={burner:[180,268],balance:[660,334]};
function contents(st){return st.mg*MMG+st.mgo*MMGO+st.nit*MN3;}
function enq(sim,...s){sim.st.q.push(...s);sim.st.msg='';}
const S_EMPTY=()=>[{k:'move',to:'balance',d:0.5},{k:'weigh',tag:'empty',d:0.5}],S_ADD=()=>[{k:'add',d:0.7},{k:'weigh',tag:'full',d:0.5}],S_HEAT=()=>[{k:'move',to:'burner',d:0.6},{k:'heat',d:1.8}],
  S_WATER=()=>[{k:'water',d:0.8},{k:'heat',d:1.4,dry:true}],S_WEIGH=()=>[{k:'move',to:'balance',d:0.6},{k:'cool',d:0.6},{k:'weigh',tag:'prod',d:0.5}];
function has(st,k){return st.log.some(r=>r.tag===k)||st.q.some(s=>s.tag===k);}
function hasMg(st){return st.mg0>0||st.q.some(s=>s.k==='add');}
const ACT={empty(sim){const st=sim.st;if(has(st,'empty')||hasMg(st)){st.msg='The empty crucible and lid are already weighed. Use “New crucible” to start over.';return;}enq(sim,...S_EMPTY());},
  add(sim){const st=sim.st;if(hasMg(st)){st.msg='The magnesium is already in the crucible.';return;}if(!has(st,'empty'))enq(sim,...S_EMPTY());enq(sim,...S_ADD());},
  heat(sim){const st=sim.st;if(!hasMg(st)){st.msg='Weigh the crucible and add the magnesium first.';return;}enq(sim,...S_HEAT());},
  water(sim){const st=sim.st;if(!st.heats&&!st.q.some(s=>s.k==='heat')){st.msg='Burn the magnesium first, then add water.';return;}enq(sim,...S_WATER());},
  weigh(sim){const st=sim.st;if(!st.heats&&!st.q.some(s=>s.k==='heat')){st.msg='Heat the magnesium before you weigh the product.';return;}enq(sim,...S_WEIGH());},
  auto(sim){const st=sim.st;st.auto=true;if(!has(st,'empty')&&!hasMg(st))enq(sim,...S_EMPTY());if(!hasMg(st))enq(sim,...S_ADD());enq(sim,...S_HEAT(),...S_HEAT(),...S_HEAT());if(sim.p.water)enq(sim,...S_WATER());enq(sim,...S_WEIGH(),{k:'done',d:0});}};
function startStep(sim,s){const st=sim.st;s.t=0;if(s.k==='move'){s.from=st.pos.slice();s.toP=STN[s.to];}}
function finishStep(sim,s){const st=sim.st,p=sim.p;sim.infoDirty=true;
  if(s.k==='move')st.pos=STN[s.to].slice();
  else if(s.k==='add'){const r=rng(st.seed*3+2);st.mg0=Math.max(0.05,p.mgmass+(r()-0.5)*0.02);st.mg=st.mg0/MMG;}
  else if(s.k==='heat'){if(s.dry){const conv=st.hyd;st.mgo+=conv;st.hyd=0;st.notes.water=true;}else{const kr=K_REACT[p.lid];const burned=st.mg*kr;st.mg-=burned;st.nit+=burned*NIT/3;let ox=burned*(1-NIT);
      if(p.lid==='off'){const lost=ox*SMOKE;ox-=lost;st.lost+=lost*MMGO;st.notes.smoke=true;}st.mgo+=ox;st.heats++;}}
  else if(s.k==='water'){st.hyd=3*st.nit;st.nit=0;}
  else if(s.k==='weigh'){const m=Math.round((st.mc+contents(st)+st.hyd*Mm('Mg(OH)2'))*1000)/1000;st.log.push({tag:s.tag,m,n:st.heats,label:s.tag==='empty'?'Crucible + lid':s.tag==='full'?'Crucible + lid + Mg':'After heating'+(st.notes.water?' (water step done)':'')});}
  else if(s.k==='done')st.auto=false;}
function mgCalc(st){const e=st.log.find(r=>r.tag==='empty'),f=st.log.find(r=>r.tag==='full'),pr=st.log.filter(r=>r.tag==='prod').pop();
  const o={e,f,pr,mMg:NaN,mProd:NaN,mO:NaN,nMg:NaN,nO:NaN,ratio:NaN,pctMg:NaN};if(!e||!f)return o;o.mMg=f.m-e.m;o.nMg=o.mMg/MMG;if(!pr)return o;
  o.mProd=pr.m-e.m;o.mO=o.mProd-o.mMg;o.nO=o.mO/MO;o.ratio=o.nO/o.nMg;o.pctMg=100*o.mMg/o.mProd;return o;}

const MODE={pie:{ctl:['cmp','smass'],met:['M','top','share'],act:[]},mgo:{ctl:['mgmass','lid','water'],met:['mMg','mO','ratio','pctMg','err'],act:['empty','add','heat','waterA','weigh','auto','new']},
  emp:{ctl:['unk','given','smass2'],met:['emp','molec'],act:['next','all','back']},comb:{ctl:['cs','cmass'],met:['mco2','mh2o','mox','cemp'],act:['burn']}};
function modeUI(sim){if(!sim.ui||!sim.ui.sec)return;const m=MODE[sim.p.mode],d=sim.def,sec=sim.ui.sec;
  d.controls.forEach(c=>{if(c.id==='mode')return;const e=sec.querySelector('#percentcomp-'+c.id)||sec.querySelector('#percentcomp-'+c.id+'-l');const w=e&&e.closest('.ctl');if(!w)return;let show=atLeast(c.lvl)&&m.ctl.includes(c.id);if(c.id==='smass2')show=show&&sim.p.given==='g';w.hidden=!show;});
  d.metrics.forEach(mm=>{const t=sim.ui.tiles[mm.id];const w=t&&t.num.closest('.tile');if(w)w.hidden=!atLeast(mm.lvl)||!m.met.includes(mm.id);});
  const btns=[...sec.querySelectorAll('.controls .actions button')];d.actions.forEach((a,i)=>{const b=btns[i];if(b)b.hidden=!atLeast(a.lvl)||!m.act.includes(a.id);});}
function changed(sim){if(sim.st)BioLab.reset(sim);modeUI(sim);}

function shape(f){const c=CL.parse(f),heavy=[],H=[];Object.keys(c).forEach(s=>{for(let i=0;i<c[s];i++)(s==='H'?H:heavy).push(s);});
  const out=[],nh=heavy.length,r0=nh<=1?0:nh<=3?9:5+nh*2.3,sc=nh>10?0.62:nh>6?0.8:1;
  heavy.forEach((s,i)=>{const a=i/nh*6.283;out.push([s,Math.cos(a)*r0,Math.sin(a)*r0,(CL.el(s).Z>11?9:7.5)*sc]);});
  H.forEach((s,i)=>{const a=i/Math.max(1,H.length)*6.283+0.4,r=r0+10*sc;out.push(['H',Math.cos(a)*r,Math.sin(a)*r,4.5*sc]);});return out;}
function drawMolecule(ctx,f,x,y,sc,rot,fit){const sh=shape(f);if(fit){const ext=Math.max(...sh.map(a=>Math.hypot(a[1],a[2])+a[3]));sc=Math.min(2.6,fit/ext);}ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.scale(sc,sc);sh.filter(a=>a[0]==='H').forEach(a=>CL.drawAtom(ctx,a[1],a[2],a[3],'H',{label:''}));sh.filter(a=>a[0]!=='H').forEach(a=>CL.drawAtom(ctx,a[1],a[2],a[3],a[0],{label:''}));ctx.restore();}

const SIM={
  id:'percentcomp',hash:'percentcomp',apUnit:8,order:2,tab:'Percent composition and empirical formulas',kind:'Virtual lab',prereq:['mole'],next:['hydrate','stoich'],
  card:'See what fraction of a compound’s mass each element supplies, burn magnesium to find the formula of its oxide, and work out empirical and molecular formulas.',
  title:'Percent composition and empirical formulas',
  lede:{bio:'Every compound has a fixed recipe by mass. Find what percent of its mass comes from each element, then use a lab to work backward from masses to a formula.',
        honors:'Turn percents or grams into moles, find the simplest whole-number ratio (the empirical formula), and use the molar mass to get the molecular formula.',
        ap:'Add combustion analysis: burn a compound of C, H and O, weigh the CO₂ and H₂O it makes, and find its empirical formula with oxygen by difference.'},
  scale:{bio:'Percent composition is the same for a grain of salt and a truckload: it depends only on the formula.',honors:'In the Mg lab, about 0.3 g of ribbon reacts with oxygen from the air. The balance reads to 0.001 g.'},
  aspect:1.6,timeless:true,animated:true,chChange:0.6,chReveal:6,
  controls:[
    {id:'mode',label:'Activity',type:'seg',def:'pie',lvl:'bio',noTrial:true,options:[{v:'pie',l:'Percent composition'},{v:'mgo',l:'Magnesium oxide lab'},{v:'emp',l:'Empirical formula'},{v:'comb',l:'Combustion analysis',lvl:'ap'}],onChange:changed},
    {id:'cmp',label:'Compound',type:'select',def:'H2O',lvl:'bio',options:PIE.map(([f,n,l])=>({v:f,l:CL.fmt(f)+'  '+n,lvl:l})),onChange:changed},
    {id:'smass',label:'Sample mass',type:'range',min:1,max:100,step:1,def:10,unit:' g',lvl:'bio'},
    {id:'mgmass',label:'Magnesium ribbon (about)',type:'range',min:0.1,max:0.6,step:0.01,def:0.3,unit:' g',lvl:'bio',onChange:changed},
    {id:'lid',label:'Crucible lid while heating',type:'seg',def:'cracked',lvl:'bio',options:[{v:'cracked',l:'Slightly open (correct)'},{v:'off',l:'Off'},{v:'closed',l:'Tightly closed'}]},
    {id:'water',label:'Add water and reheat at the end',type:'toggle',def:true,lvl:'honors',help:'Turns magnesium nitride into magnesium oxide'},
    {id:'unk',label:'Mystery compound',type:'select',def:'glucose',lvl:'bio',options:Object.keys(EMP).map((k,i)=>({v:k,l:'Compound '+String.fromCharCode(65+i)})),onChange:changed},
    {id:'given',label:'Data you are given',type:'seg',def:'pct',lvl:'bio',options:[{v:'pct',l:'Percent by mass'},{v:'g',l:'Grams in a sample',lvl:'honors'}],onChange:changed},
    {id:'smass2',label:'Sample analyzed',type:'range',min:0.5,max:10,step:0.5,def:2.5,unit:' g',lvl:'honors',onChange:changed},
    {id:'cs',label:'Compound burned',type:'select',def:'ethanol',lvl:'ap',options:Object.keys(COMB).map((k,i)=>({v:k,l:'Sample '+(i+1)})),onChange:changed},
    {id:'cmass',label:'Sample mass',type:'range',min:0.1,max:1,step:0.01,def:0.5,unit:' g',lvl:'ap',onChange:changed}
  ],
  actions:[
    {id:'empty',label:'Weigh crucible + lid',lvl:'bio',run(sim){ACT.empty(sim);}},
    {id:'add',label:'Add Mg and weigh',lvl:'bio',run(sim){ACT.add(sim);}},
    {id:'heat',label:'Heat 5 minutes',lvl:'bio',run(sim){ACT.heat(sim);}},
    {id:'waterA',label:'Add water and reheat',lvl:'honors',run(sim){ACT.water(sim);}},
    {id:'weigh',label:'Cool and weigh',lvl:'bio',run(sim){ACT.weigh(sim);}},
    {id:'auto',label:'Run the whole lab',lvl:'bio',primary:true,run(sim){ACT.auto(sim);}},
    {id:'new',label:'New crucible',lvl:'bio',run(sim){BioLab.reset(sim);}},
    {id:'next',label:'Next step',lvl:'bio',primary:true,run(sim){sim.st.step=Math.min(maxStep(sim),sim.st.step+1);}},
    {id:'all',label:'Show every step',lvl:'bio',run(sim){sim.st.step=maxStep(sim);}},
    {id:'back',label:'Start over',lvl:'bio',run(sim){sim.st.step=0;}},
    {id:'burn',label:'Burn the sample',lvl:'ap',primary:true,run(sim){if(sim.st.burnT<0)sim.st.burnT=0;}}
  ],
  init(sim){const seed=((sim.st&&sim.st.seed)||0)+1,r=rng(seed*11+3);return {seed,mc:Math.round((24+3*r())*1000)/1000,mg0:0,mg:0,mgo:0,nit:0,hyd:0,lost:0,heats:0,log:[],q:[],cur:null,pos:STN.balance.slice(),msg:'',auto:false,notes:{},step:0,burnT:-1};},
  step(sim,dt){const st=sim.st,sp=st.auto?0.25:1;let left=dt;
    for(let g=0;g<40&&left>0;g++){if(!st.cur){if(!st.q.length)break;st.cur=st.q.shift();startStep(sim,st.cur);}const c=st.cur,need=c.d*sp-c.t;
      if(left>=need){left-=Math.max(0,need);finishStep(sim,c);st.cur=null;}else{c.t+=left;left=0;if(c.k==='move'){const f=clamp(c.t/(c.d*sp),0,1),e=f*f*(3-2*f);st.pos=[lerp(c.from[0],c.toP[0],e),lerp(c.from[1],c.toP[1],e)-Math.sin(Math.PI*e)*40];}}}
    if(st.burnT>=0&&st.burnT<3){st.burnT+=dt;if(st.burnT>=3)sim.infoDirty=true;}},
  metrics:[
    {id:'M',label:'Molar mass',unit:'g/mol',lvl:'bio',min:0,max:null,d:2,get:s=>Mm(s.p.cmp)},
    {id:'top',label:'Biggest share of the mass',unit:'',lvl:'bio',text:true,get:s=>{const pc=CL.percentComp(s.p.cmp).sort((a,b)=>b.pct-a.pct)[0];return pc.sym+': '+pc.pct.toFixed(1)+'%';}},
    {id:'share',label:'Mass of that element in your sample',unit:'g',lvl:'bio',min:0,max:null,d:2,get:s=>{const pc=CL.percentComp(s.p.cmp).sort((a,b)=>b.pct-a.pct)[0];return s.p.smass*pc.pct/100;}},
    {id:'mMg',label:'Mass of magnesium',unit:'g',lvl:'bio',min:0,max:0.6,d:3,get:s=>mgCalc(s.st).mMg},
    {id:'mO',label:'Mass of oxygen gained',unit:'g',lvl:'bio',min:0,max:0.4,d:3,get:s=>mgCalc(s.st).mO},
    {id:'ratio',label:'mol O ÷ mol Mg',unit:'',lvl:'bio',min:0,max:1.5,d:2,get:s=>mgCalc(s.st).ratio},
    {id:'pctMg',label:'Percent Mg in the product',unit:'%',lvl:'honors',min:0,max:100,d:1,get:s=>mgCalc(s.st).pctMg},
    {id:'err',label:'Percent error vs MgO (60.3% Mg)',unit:'%',lvl:'ap',min:0,max:30,d:1,get:s=>{const c=mgCalc(s.st);const acc=100*MMG/MMGO;return Number.isFinite(c.pctMg)?100*Math.abs(c.pctMg-acc)/acc:NaN;}},
    {id:'emp',label:'Empirical formula',unit:'',lvl:'bio',text:true,get:s=>s.st.step>=4?CL.fmt(empData(s.p).f):'Step '+Math.min(4,s.st.step+1)+' of 4 to find it'},
    {id:'molec',label:'Molecular formula',unit:'',lvl:'honors',text:true,get:s=>{const d=empData(s.p);return s.st.step>=5?CL.fmt(fstr(d.els,d.ints.map(v=>v*d.n))):'Molar mass '+d.Mmol.toFixed(1)+' g/mol';}},
    {id:'mco2',label:'CO₂ absorbed',unit:'g',lvl:'ap',min:0,max:null,d:4,get:s=>s.st.burnT>=3?combData(s.p).mCO2:NaN},
    {id:'mh2o',label:'H₂O absorbed',unit:'g',lvl:'ap',min:0,max:null,d:4,get:s=>s.st.burnT>=3?combData(s.p).mH2O:NaN},
    {id:'mox',label:'Oxygen in the sample (by difference)',unit:'g',lvl:'ap',min:0,max:null,d:4,get:s=>s.st.burnT>=3?combData(s.p).mOx:NaN},
    {id:'cemp',label:'Empirical formula',unit:'',lvl:'ap',text:true,get:s=>s.st.burnT>=3?CL.fmt(combData(s.p).f):'Burn the sample first'}
  ],
  graph:false,
  infoPanel(sim){const p=sim.p,st=sim.st,hon=atLeast('honors'),ap=atLeast('ap');
    if(p.mode==='pie'){const pc=CL.percentComp(p.cmp),M=Mm(p.cmp);const rows=pc.map(q=>`<tr><td style="text-align:left">${q.sym}</td><td>${q.count}</td><td>${(q.mass).toFixed(3)}</td><td>${q.pct.toFixed(2)}%</td><td>${(p.smass*q.pct/100).toFixed(2)} g</td></tr>`).join('');
      return `<h3>${CL.html(p.cmp)}: where the mass comes from</h3><div class="tbl-wrap"><table><thead><tr><th style="text-align:left">Element</th><th>Atoms</th><th>g per mol</th><th>% by mass</th><th>In ${p.smass} g</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help">% element = (atoms × atomic mass) ÷ molar mass (${M.toFixed(2)} g/mol) × 100.</p>`;}
    if(p.mode==='mgo'){const c=mgCalc(st);let rows=st.log.map(r=>`<tr><td style="text-align:left">${r.label}</td><td>${r.m.toFixed(3)} g</td></tr>`).join('')||'<tr><td colspan="2" style="text-align:left">No masses yet. Weigh the empty crucible and lid first.</td></tr>';
      let h=`<h3>Lab notebook: magnesium oxide</h3><div class="tbl-wrap"><table><tbody>${rows}</tbody></table></div>`;
      if(Number.isFinite(c.ratio))h+=`<p style="margin-top:10px">Mg: ${c.f.m.toFixed(3)} − ${c.e.m.toFixed(3)} = ${c.mMg.toFixed(3)} g ÷ ${MMG.toFixed(2)} = ${c.nMg.toFixed(5)} mol<br>O: ${c.pr.m.toFixed(3)} − ${c.f.m.toFixed(3)} = ${c.mO.toFixed(3)} g ÷ ${MO.toFixed(2)} = ${c.nO.toFixed(5)} mol<br>Ratio O : Mg = <b>${c.ratio.toFixed(2)} : 1</b>, so the formula is <b>${Math.abs(c.ratio-1)<0.03?'MgO':'MgO'+CL.sub(c.ratio.toFixed(2).replace('.','.'))}</b>${Math.abs(c.ratio-1)<0.03?'':' (it should be 1 : 1)'}.</p>`;
      return h;}
    if(p.mode==='comb'){if(st.burnT<3)return '<h3>Combustion analysis</h3><p>Weigh the sample, press “Burn the sample”, and the absorbers catch every bit of H₂O and CO₂ it makes.</p>';const d=combData(p);
      return `<h3>Finding C, H and O</h3><p>C: ${d.mCO2.toFixed(4)} g CO<sub>2</sub> × (12.011 / 44.009) = ${d.mC.toFixed(4)} g C<br>H: ${d.mH2O.toFixed(4)} g H<sub>2</sub>O × (2.016 / 18.015) = ${d.mH.toFixed(4)} g H<br>O: ${p.cmass.toFixed(4)} − ${d.mC.toFixed(4)} − ${d.mH.toFixed(4)} = ${d.mOx.toFixed(4)} g O</p><p>Empirical formula: <b>${CL.html(d.f)}</b>. The sample really was ${CL.html(d.f0)} (${COMB[p.cs][1].toLowerCase()}).</p>`;}
    const d=empData(p);let h=`<h3>The four steps</h3><ol><li>${p.given==='pct'?'Assume 100 g, so each percent becomes grams.':'Use the grams from your '+p.smass2+' g sample.'}</li><li>Divide each mass by its atomic mass to get moles.</li><li>Divide every mole value by the smallest one.</li><li>If a ratio ends in about .5, .33 or .25, multiply all of them by 2, 3 or 4.</li></ol>`;
    if(hon)h+=`<p>Step 5: molecular formula = (molar mass ÷ empirical formula mass) × empirical formula. Here ${d.Mmol.toFixed(1)} ÷ ${d.Me.toFixed(2)} = ${(d.Mmol/d.Me).toFixed(2)}.</p>`;
    if(st.step>=4)h+=`<p class="help">This was ${EMP[p.unk][1].toLowerCase()}, ${CL.html(d.f0)}.</p>`;return h;},
  narrate(sim){const p=sim.p,st=sim.st,hon=atLeast('honors');
    if(st.msg)return st.msg;
    if(p.mode==='pie'){const pc=CL.percentComp(p.cmp);const tot=pc.reduce((a,q)=>a+q.count,0),top=pc.slice().sort((a,b)=>b.pct-a.pct)[0],most=pc.slice().sort((a,b)=>b.count-a.count)[0];
      let s='<b>'+top.sym+' supplies '+top.pct.toFixed(1)+'% of the mass of '+CL.fmt(p.cmp)+'</b>, in any size sample: '+(p.smass*top.pct/100).toFixed(2)+' g of every '+p.smass+' g.';
      if(most.sym!==top.sym)s+=' Yet '+most.sym+' atoms are '+Math.round(100*most.count/tot)+'% of the atoms. Mass percent depends on how heavy each atom is, not just how many.';return s;}
    if(p.mode==='mgo'){const c=mgCalc(st),cur=st.cur;
      if(cur&&cur.k==='heat'&&!cur.dry)return p.lid==='closed'?'<b>The lid is shut tight,</b> so little oxygen gets in. The magnesium smolders instead of burning.':p.lid==='off'?'<b>Lid off:</b> the magnesium flares and white MgO smoke escapes. That product is lost from the crucible.':'<b>Burning magnesium:</b> 2Mg + O₂ → 2MgO. The slightly open lid lets air in but keeps the white smoke in. The flame is bright enough to hurt your eyes: don’t stare at it.';
      if(cur&&(cur.k==='water'||cur.dry))return 'Some Mg reacted with nitrogen from the air to make Mg₃N₂. Water turns it into Mg(OH)₂, and heating drives off the water, leaving MgO. You can smell the NH₃ that forms.';
      if(!st.log.length&&!st.q.length)return '<b>Weigh the empty crucible and lid first.</b> Goggles on. You will subtract this mass from every later reading.';
      if(Number.isFinite(c.ratio)){const ok=Math.abs(c.ratio-1)<0.03;return (ok?'<b>The ratio is '+c.ratio.toFixed(2)+' mol O : 1 mol Mg, so the formula is MgO.</b>':'<b>The ratio came out '+c.ratio.toFixed(2)+' : 1, not 1 : 1.</b> ')+(st.notes.smoke?' White smoke carried MgO away, so the oxygen mass is too low.':'')+(p.lid==='closed'?' Not enough air got in, so some Mg never reacted.':'')+(!st.notes.water&&st.nit>0?' Some product is still Mg₃N₂, which adds less mass than MgO.':'')+(ok?' The product gained '+c.mO.toFixed(3)+' g of oxygen from the air.':'');}
      if(Number.isFinite(c.mMg))return 'You have '+c.mMg.toFixed(3)+' g of magnesium. When it burns, it combines with oxygen from the air, so the crucible gets heavier.';
      return 'Follow the procedure: weigh, add magnesium, heat with the lid slightly open, cool and weigh.';}
    if(p.mode==='comb'){if(st.burnT<0)return 'A '+p.cmass.toFixed(2)+' g sample of a compound containing C, H and maybe O sits in the furnace. Burning turns all its C into CO₂ and all its H into H₂O. Press <b>Burn the sample</b>.';
      if(st.burnT<3)return 'Hot O₂ burns the sample. The first tube traps the H₂O, the second traps the CO₂, and each tube gains exactly that mass.';
      const d=combData(p);return '<b>Empirical formula: '+CL.fmt(d.f)+'.</b> All the C came from the sample, and so did all the H. The oxygen in the products came partly from the O₂ supply, so the sample’s O has to be found by difference: '+d.mOx.toFixed(4)+' g.';}
    const d=empData(p),s=st.step;
    const msgs=[p.given==='pct'?'<b>Step 1:</b> assume a 100 g sample, so '+d.pct.map((v,i)=>v+'% '+d.els[i]).join(', ')+' become the same numbers in grams.':'<b>Step 1:</b> start from the grams of each element in the sample.',
      '<b>Step 2:</b> grams ÷ atomic mass = moles. Formulas count atoms, so you must compare moles, not grams.','<b>Step 3:</b> divide by the smallest number of moles ('+d.mol.reduce((a,b)=>Math.min(a,b)).toFixed(4)+') to get a ratio.',
      d.m>1?'<b>Step 4:</b> the ratios are not whole numbers, so multiply every one by '+d.m+'.':'<b>Step 4:</b> the ratios are already whole numbers, so they are the subscripts.',
      '<b>Empirical formula: '+CL.fmt(d.f)+'.</b>'+(hon?' Now compare its formula mass ('+d.Me.toFixed(2)+' g/mol) with the molar mass ('+d.Mmol.toFixed(1)+' g/mol).':''),
      '<b>Molecular formula: '+CL.fmt(fstr(d.els,d.ints.map(v=>v*d.n)))+'.</b> '+d.Mmol.toFixed(1)+' ÷ '+d.Me.toFixed(2)+' = '+d.n+', so every subscript is multiplied by '+d.n+'.'];
    return msgs[Math.min(s,msgs.length-1)];},
  tour:[
    {title:'Mass shares',text:'Water is H₂O. Two of its three atoms are hydrogen, but hydrogen is light (1.008 u) and oxygen is heavy (16.00 u). So oxygen supplies 88.8% of the mass.',focus:[150,70,330,330],pause:true,setup(sim){BioLab.setValues(sim,{mode:'pie',cmp:'H2O'});}},
    {title:'The magnesium oxide lab',text:'Weigh an empty crucible and lid, add a coil of magnesium ribbon, and weigh again.',focus:[540,240,240,200],speed:1,setup(sim){BioLab.setValues(sim,{mode:'mgo'});ACT.add(sim);}},
    {title:'Burn it',text:'Heat with the lid slightly open. Mg combines with O₂ from the air: 2Mg + O₂ → 2MgO. The circle shows O atoms joining the Mg.',focus:[[90,190,190,250],[300,50,220,220]],speed:0.5,setup(sim){ACT.heat(sim);}},
    {title:'Weigh the product',text:'After heating, cool and weigh. The crucible is heavier: the extra mass is oxygen. Moles O ÷ moles Mg gives the formula.',focus:[540,240,240,200],speed:1,setup(sim){ACT.heat(sim);ACT.heat(sim);if(sim.p.water)ACT.water(sim);ACT.weigh(sim);}},
    {title:'Empirical formula from percents',text:'Mystery compound A is 40.00% C, 6.71% H and 53.29% O. Assume 100 g, change grams to moles, and divide by the smallest.',focus:[0,40,800,300],pause:true,setup(sim){BioLab.setValues(sim,{mode:'emp',unk:'glucose',given:'pct'});sim.st.step=3;}},
    {title:'The simplest ratio',text:'The ratio is 1 C : 2 H : 1 O, so the empirical formula is CH₂O.',focus:[0,40,800,420],pause:true,setup(sim){sim.st.step=4;}},
    {lvl:'honors',title:'The molecular formula',text:'Compound A’s molar mass is 180.2 g/mol and CH₂O is 30.03 g/mol. 180.2 ÷ 30.03 = 6, so the molecular formula is C₆H₁₂O₆ (glucose).',focus:[0,40,800,420],pause:true,setup(sim){sim.st.step=5;}},
    {lvl:'ap',title:'Combustion analysis',text:'Burn a C, H, O compound in excess O₂. All its carbon ends up in CO₂ and all its hydrogen in H₂O; the oxygen is found by difference.',focus:[0,40,800,420],speed:0.6,setup(sim){BioLab.setValues(sim,{mode:'comb'});sim.st.burnT=0;}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'pie',cmp:'H2O'});BioLab.reset(sim);},
  onLevel(sim){modeUI(sim);},
  challenges:[
    {lvl:'bio',q:'Water is 88.8% oxygen by mass. If you analyze 100 g of water instead of 10 g, the percent oxygen will be…',choices:['10 times bigger','still 88.8%','smaller, because there is more hydrogen too'],correct:1,
     baseline:{mode:'pie',cmp:'H2O',smass:10},change:{smass:100},changeText:'Sample changed from 10 g to 100 g',
     explain:{bio:'The mass of oxygen grows from 8.88 g to 88.8 g, but the percent stays 88.8%. Every sample of a pure compound has the same composition: the law of definite proportions.'}},
    {lvl:'bio',instant:true,q:'Two of the three atoms in H₂O are hydrogen. Which element supplies most of water’s mass?',choices:['Hydrogen, because there are more H atoms','Oxygen','They supply equal mass'],correct:1,
     explain:{bio:'One O atom (16.00 u) outweighs two H atoms (2 × 1.008 = 2.016 u) by about 8 to 1. Oxygen is 88.8% of the mass even though it is only one third of the atoms.'}},
    {lvl:'bio',q:'You heat the magnesium with the lid completely off, and white smoke drifts away. Your ratio of mol O to mol Mg will be…',choices:['too high, like MgO₁.₂','too low, like MgO₀.₉','exactly 1 : 1'],correct:1,
     baseline:{mode:'mgo',lid:'off'},changeAction:'auto',changeText:'Running the lab with the lid off',
     explain:{bio:'The white smoke is MgO. When it escapes, the product you weigh is too light, so the oxygen you calculate is too small and the ratio comes out below 1.'}},
    {lvl:'honors',instant:true,q:'An iron oxide gives a mole ratio of 1.00 Fe : 1.50 O. What is its empirical formula?',choices:['FeO','FeO₂','Fe₂O₃','Fe₃O₂'],correct:2,
     explain:{honors:'1.50 is not close to a whole number, so multiply both by 2: 2 Fe : 3 O, Fe₂O₃. Rounding 1.5 to 2 (FeO₂) is the most common mistake. Try Mystery compound J.'}},
    {lvl:'honors',q:'You skip the step where you add water and reheat. Your ratio of mol O to mol Mg will be…',choices:['too high','too low','unaffected'],correct:1,
     baseline:{mode:'mgo',water:false},changeAction:'auto',changeText:'Running the lab without the water step',
     explain:{honors:'Hot magnesium also reacts with N₂ in air: 3Mg + N₂ → Mg₃N₂. Per Mg, nitride adds only 9.3 g/mol of mass, while oxide adds 16.0, so the “oxygen” mass comes out low. Water and reheating turn Mg₃N₂ into MgO.'}},
    {lvl:'honors',instant:true,q:'A compound is 40.0% C, 6.7% H and 53.3% O, with a molar mass of 180 g/mol. What is its molecular formula?',choices:['CH₂O','C₂H₄O₂','C₆H₁₂O₆','C₆H₆O₆'],correct:2,
     explain:{honors:'Moles in 100 g: C 3.33, H 6.65, O 3.33 → ratio 1 : 2 : 1, CH₂O (30.03 g/mol). 180 ÷ 30.03 = 6, so C₆H₁₂O₆. CH₂O is the empirical formula, not the molecular formula.'}},
    {lvl:'ap',instant:true,q:'In combustion analysis, why is the oxygen in the sample found by difference instead of from the CO₂ and H₂O?',choices:['Some oxygen in the products came from the O₂ used to burn the sample','Oxygen does not end up in the products','The absorbers cannot hold oxygen'],correct:0,
     explain:{ap:'Every C in CO₂ and every H in H₂O came from the sample, but the O atoms came partly from the sample and partly from the O₂ supply. So mass O = sample − mass C − mass H.'}},
    {lvl:'ap',instant:true,q:'Burning 1.000 g of a C, H, O compound gives 1.911 g CO₂ and 1.173 g H₂O. What is its empirical formula?',choices:['CH₃O','C₂H₆O','C₂H₃O','CH₂O'],correct:1,
     explain:{ap:'C: 1.911 × 12.011/44.009 = 0.5215 g = 0.04342 mol. H: 1.173 × 2.016/18.015 = 0.1313 g = 0.1302 mol. O: 1.000 − 0.5215 − 0.1313 = 0.3472 g = 0.02170 mol. Ratio 2.00 : 6.00 : 1.00, C₂H₆O (ethanol, Sample 1).'}},
    {lvl:'ap',q:'You double the sample mass you burn (0.50 g → 1.00 g). The empirical formula you calculate will…',choices:['stay the same','double its subscripts','change unpredictably'],correct:0,
     baseline:{mode:'comb',cs:'acetone',cmass:0.5},change:{cmass:1},changeAction:'burn',changeText:'Burning a 1.00 g sample',
     explain:{ap:'Twice the sample makes twice the CO₂ and H₂O, so every mole value doubles and the ratio is unchanged. The empirical formula depends only on the ratio of moles.'}}
  ],
  lab:{bio:'<p><b>Question:</b> What is the formula of the oxide magnesium forms when it burns?</p><ol><li>Choose Magnesium oxide lab. Weigh the crucible and lid, add about 0.3 g Mg, and weigh again.</li><li>Heat three times with the lid slightly open, then cool and weigh. Record a trial.</li><li>Repeat with 0.2 g and 0.5 g of Mg.</li></ol><p>Find mol O ÷ mol Mg for each trial. Does the ratio depend on how much Mg you start with?</p>',
       honors:'<p><b>Question:</b> How do errors in the MgO lab change the formula you find?</p><ol><li>Run the lab correctly and record a trial.</li><li>Run it with the lid off, then with the lid closed, then without the water step. Record each.</li><li>Work out the empirical and molecular formulas of Mystery compounds A, C and G from grams.</li></ol><p>For each lab error, explain which mass was wrong and why the ratio moved the way it did.</p>',
       ap:'<p><b>Question:</b> Can you identify a compound by combustion analysis?</p><ol><li>Burn each sample and record the CO₂ and H₂O masses.</li><li>Find the empirical formula of each, with oxygen by difference.</li><li>Samples 2 and 3 have molar masses of 58.08 and 60.10 g/mol. Find their molecular formulas.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why two compounds with the same empirical formula cannot be told apart by combustion analysis alone.</p>'},
  terms:[{t:'Percent composition',d:'The percent by mass of each element in a compound.'},{t:'Law of definite proportions',d:'A pure compound always has the same composition by mass, whatever the sample size.'},
    {t:'Empirical formula',d:'The simplest whole-number ratio of atoms in a compound, like CH₂O.'},{t:'Molecular formula',d:'The actual number of each atom in one molecule, like C₆H₁₂O₆.'},
    {lvl:'honors',t:'Empirical formula mass',d:'The sum of the atomic masses in the empirical formula.'},{lvl:'honors',t:'Magnesium nitride',d:'Mg₃N₂, which forms when hot Mg reacts with N₂ in air.'},
    {lvl:'ap',t:'Combustion analysis',d:'Burning a compound and weighing the CO₂ and H₂O it makes to find its C and H content.'},{lvl:'ap',t:'By difference',d:'Finding one part by subtracting the known parts from the total.'}],
  about:'<p>Percent composition uses ChemLab atomic masses: % = atoms × atomic mass ÷ molar mass × 100. The mystery compounds’ percents are their real values rounded to 0.01%.</p><p>Magnesium lab model: each 5-minute heating with the lid slightly open burns 85% of the remaining Mg (35% with the lid closed). Of the Mg that burns, 12% forms Mg₃N₂ and the rest MgO. With the lid off, 5% of the new MgO escapes as smoke. The water step converts all Mg₃N₂ to MgO through Mg(OH)₂. The full lab uses three heatings, which leaves well under 1% of the Mg unburned when the lid is slightly open. A ratio within 0.03 of 1 is reported as MgO.</p><p>Combustion analysis assumes complete combustion and perfect absorbers. Empirical ratios are rounded to whole numbers after multiplying by the smallest factor from 1 to 8 that makes every ratio within 0.1 of a whole number.</p>',
  initVis(sim){sim.vis.ox=[];},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);const m=sim.p.mode;
    if(m==='pie')drawPie(sim,ctx,k,t);else if(m==='mgo')drawMg(sim,ctx,vdt,k,t);else if(m==='emp')drawEmp(sim,ctx,k);else drawComb(sim,ctx,k,t);},
  thumbSetup(sim){}
};
function maxStep(sim){return atLeast('honors')?5:4;}

function drawPie(sim,ctx,k,t){const p=sim.p,pc=CL.percentComp(p.cmp),M=Mm(p.cmp),name=PIE.find(x=>x[0]===p.cmp)[1];
  txt(ctx,CL.fmt(p.cmp)+'  ·  '+M.toFixed(2)+' g/mol',16,30,{s:15*k,w:800});
  if(k<1.3)txt(ctx,name,16,52,{s:13,c:PAL['cv-soft']});
  rr(ctx,16,70,140,150,12);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1.5;ctx.stroke();
  drawMolecule(ctx,p.cmp,86,138,1,RM?0:t*0.2,56);
  txt(ctx,'one '+(/^(NaCl|Fe2O3|NH4NO3|Ca3|CuSO4|NaHCO3)/.test(p.cmp)?'formula unit':'molecule'),86,208,{s:12*k,a:'center',c:PAL['cv-soft']});
  const cx=320,cy=255,R=128;let a0=-Math.PI/2;
  pc.forEach(q=>{const a1=a0+q.pct/100*6.2832;ctx.fillStyle=ec(q.sym);ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a0,a1);ctx.closePath();ctx.fill();ctx.strokeStyle=PAL['cv-bg'];ctx.lineWidth=2;ctx.stroke();
    const am=(a0+a1)/2;if(q.pct>=9)txt(ctx,q.sym,cx+Math.cos(am)*R*0.62,cy+Math.sin(am)*R*0.62,{s:15*k,w:800,a:'center',b:'middle',c:'#fff'});a0=a1;});
  txt(ctx,'by mass',cx,cy+R+22*Math.max(1,k*0.8),{s:12.5*k,a:'center',c:PAL['cv-soft']});
  // list
  const x=490;let y=96;const lh=30*Math.max(1,k*0.8);
  txt(ctx,'In a '+p.smass+' g sample',x,y-16,{s:13*k,w:700});y+=lh*0.4;
  pc.slice().sort((a,b)=>b.pct-a.pct).forEach(q=>{ctx.fillStyle=ec(q.sym);rr(ctx,x,y-9,18,18,4);ctx.fill();txt(ctx,q.sym,x+26,y,{s:14*k,w:800,b:'middle'});
    txt(ctx,q.pct.toFixed(1)+'%',x+26+44*Math.max(1,k*0.8),y,{s:14*k,w:700,b:'middle'});txt(ctx,(p.smass*q.pct/100).toFixed(2)+' g',784,y,{s:14*k,a:'right',b:'middle',c:PAL['cv-soft']});y+=lh;});
  // atoms vs mass bars
  const tot=pc.reduce((a,q)=>a+q.count,0);const bx=x,bw=294;let by=Math.max(y+14,330);
  [['Share of the atoms',q=>q.count/tot],['Share of the mass',q=>q.pct/100]].forEach(([lab,fn])=>{txt(ctx,lab,bx,by,{s:12.5*k,w:600,c:PAL['cv-soft']});let xx=bx;const yy=by+10;
    pc.forEach(q=>{const w=fn(q)*bw;ctx.fillStyle=ec(q.sym);ctx.fillRect(xx,yy,w,22);if(w>26)txt(ctx,q.sym,xx+w/2,yy+12,{s:12*k,w:800,a:'center',b:'middle',c:'#fff'});xx+=w;});by+=60*Math.max(1,k*0.75);});}

function drawMg(sim,ctx,vdt,k,t){const st=sim.st,p=sim.p,cur=st.cur,heating=cur&&cur.k==='heat';
  txt(ctx,'2Mg(s) + O₂(g) → 2MgO(s)',16,30,{s:15*k,w:800});
  ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,455,800,45);
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(50,445,90,10);ctx.fillRect(82,200,7,247);ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(89,288);ctx.lineTo(138,288);ctx.stroke();ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(180,289,42,7,0,0,6.29);ctx.stroke();
  // burner
  const x=180;ctx.fillStyle='#5b6470';ctx.beginPath();ctx.moveTo(x-40,455);ctx.lineTo(x+40,455);ctx.lineTo(x+30,440);ctx.lineTo(x-30,440);ctx.closePath();ctx.fill();ctx.fillStyle='#9aa1a9';ctx.fillRect(x-9,335,18,106);
  if(heating){const H=46,fl=RM?0:Math.sin(t*23)*2;ctx.fillStyle='rgba(70,120,255,.6)';ctx.beginPath();ctx.moveTo(x-13,335);ctx.quadraticCurveTo(x-13,335-H*0.6,x+fl,335-H);ctx.quadraticCurveTo(x+13,335-H*0.6,x+13,335);ctx.closePath();ctx.fill();}
  // balance
  const bx=660;ctx.fillStyle='#59616b';rr(ctx,bx-100,380,200,62,10);ctx.fill();ctx.fillStyle='#8b939c';ctx.fillRect(bx-6,360,12,22);ctx.fillStyle='#b8bec6';ctx.beginPath();ctx.ellipse(bx,358,58,7,0,0,6.29);ctx.fill();
  const on=Math.hypot(st.pos[0]-STN.balance[0],st.pos[1]-STN.balance[1])<3&&(!cur||cur.k!=='move');const rd=on?Math.round((st.mc+contents(st)+st.hyd*Mm('Mg(OH)2'))*1000)/1000:0;
  const fs=17*k,str=rd.toFixed(3)+' g';ctx.font='700 '+fs+'px '+FONT;const lw=Math.min(190,ctx.measureText(str).width+20);ctx.fillStyle='#16241b';rr(ctx,bx-lw/2,411-fs/2-1,lw,fs+10,5);ctx.fill();txt(ctx,str,bx,416,{s:fs,w:700,c:'#9cf59c',a:'center',b:'middle'});
  // crucible with lid
  const [cx,cy]=st.pos;const glow=heating&&!cur.dry&&st.mg>1e-5&&p.lid!=='closed';
  if(glow&&!RM){const g=ctx.createRadialGradient(cx,cy-24,3,cx,cy-24,70);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(0.3,'rgba(255,255,230,.6)');g.addColorStop(1,'rgba(255,255,230,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy-24,70,0,6.29);ctx.fill();}
  ctx.fillStyle='#ece8df';ctx.strokeStyle='#8d877b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-32,cy-22);ctx.lineTo(cx+32,cy-22);ctx.lineTo(cx+20,cy+22);ctx.lineTo(cx-20,cy+22);ctx.closePath();ctx.fill();ctx.stroke();
  if(st.mg0>0){const fr=st.mg/(st.mg0/MMG);ctx.strokeStyle='#8d949c';ctx.lineWidth=3;ctx.globalAlpha=clamp(fr*1.2,0,1);ctx.beginPath();for(let i=0;i<=30;i++){const a=i*0.7;const xx=cx-18+i*1.2,yy=cy-26+Math.sin(a)*4;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();ctx.globalAlpha=1;
    if(fr<0.98){ctx.fillStyle='#f6f5f0';ctx.strokeStyle='#b5b0a5';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy-24,26*(1-fr*0.6),5,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();}}
  const lidOpen=p.lid==='off'&&(heating||cur&&cur.k==='move')?null:p.lid==='cracked'&&heating?0.25:0;
  if(lidOpen!==null){ctx.save();ctx.translate(cx+(lidOpen?8:0),cy-26);ctx.rotate(lidOpen);ctx.fillStyle='#e2ddd2';ctx.strokeStyle='#8d877b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,35,6,0,0,6.29);ctx.fill();ctx.stroke();ctx.fillRect(-5,-9,10,5);ctx.restore();}
  else if(p.lid==='off'){ctx.save();ctx.fillStyle='#e2ddd2';ctx.strokeStyle='#8d877b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(300,450,35,6,0,0,6.29);ctx.fill();ctx.stroke();ctx.restore();}
  if(heating&&p.lid==='off'&&!RM){for(let i=0;i<8;i++){const ph=(t*0.7+i/8)%1;ctx.fillStyle='#f1f1ec';ctx.globalAlpha=0.6*(1-ph);ctx.beginPath();ctx.arc(cx-10+i*3+Math.sin(t*2+i)*10,cy-40-ph*120,6+ph*12,0,6.29);ctx.fill();}ctx.globalAlpha=1;}
  // zoom
  const zx=410,zy=160,zr=92;ctx.save();ctx.fillStyle=PAL['card'];ctx.beginPath();ctx.arc(zx,zy,zr,0,6.29);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.stroke();ctx.clip();
  const tot=st.mg0>0?st.mg0/MMG:1,fO=st.mg0>0?st.mgo/tot:0,fN=st.mg0>0?(st.nit*3+st.hyd)/tot:0;const n=20;
  for(let i=0;i<n;i++){const col=i%5,row=Math.floor(i/5),ax=zx-64+col*32,ay=zy-48+row*32,j=RM?0:Math.sin(t*(heating?14:4)+i)*(heating?1.6:0.5);
    CL.drawAtom(ctx,ax+j,ay,11,'Mg',{label:''});if(i<Math.round(n*fO))CL.drawAtom(ctx,ax+13+j,ay+11,8,'O',{label:''});else if(i>=n-Math.round(n*fN))CL.drawAtom(ctx,ax+13+j,ay+11,7,'N',{label:''});}
  if(heating&&!cur.dry&&!RM)for(let i=0;i<4;i++){const ph=(t*0.8+i/4)%1;const ox=zx-80+ph*120,oy=zy-zr+12+i*40;CL.drawAtom(ctx,ox-6,oy,7,'O',{label:''});CL.drawAtom(ctx,ox+6,oy,7,'O',{label:''});}
  ctx.restore();
  const items=[['Mg','Mg²⁺ / Mg'],['O','O²⁻'],['N','N³⁻ (in Mg₃N₂)']];let ly=zy-30;items.forEach(([s,l])=>{CL.drawAtom(ctx,zx+zr+22,ly,7,s,{label:''});txt(ctx,l,zx+zr+36,ly,{s:12*k,b:'middle',w:600});ly+=24*Math.max(1,k*0.85);});
  txt(ctx,'Bunsen burner',180,484,{s:12.5*k,a:'center',w:600});txt(ctx,'Balance ±0.001 g',660,484,{s:12.5*k,a:'center',w:600});}

function drawTable(ctx,head,rows,show,k,y0){const n=head.length,lw=k>1.3?190:210,cw=(780-lw)/(n-1);const rh=34*Math.max(1,k*0.85);let y=y0;
  head.forEach((h,i)=>txt(ctx,h,i?lw+cw*(i-0.5)+10:16,y,{s:14*k,w:800,a:i?'center':'left',c:i?ec(h):PAL['cv-ink']}));y+=rh*0.5;
  ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(784,y);ctx.stroke();y+=rh*0.55;
  rows.forEach((r,ri)=>{const vis=ri<show;txt(ctx,r[0],16,y,{s:12.5*k,w:600,c:vis?PAL['cv-ink']:PAL['cv-soft'],b:'middle'});
    r.slice(1).forEach((v,i)=>txt(ctx,vis?v:'·',lw+cw*(i+0.5)+10,y,{s:(ri===rows.length-1?15:13.5)*k,w:ri===rows.length-1?800:600,a:'center',b:'middle',c:vis?PAL['cv-ink']:PAL['cv-soft']}));
    if(ri===show-1&&ri<rows.length){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=2.5;rr(ctx,10,y-rh/2+2,776,rh-4,8);ctx.stroke();}y+=rh;});return y;}
function drawEmp(sim,ctx,k){const p=sim.p,st=sim.st,d=empData(p),hon=atLeast('honors'),idx=Object.keys(EMP).indexOf(p.unk);
  txt(ctx,'Mystery compound '+String.fromCharCode(65+idx)+(hon?'  ·  molar mass '+d.Mmol.toFixed(1)+' g/mol':''),16,30,{s:15*k,w:800});
  const rows=[[p.given==='pct'?'Grams (in 100 g)':'Grams (in '+p.smass2+' g)',...d.g.map(v=>p.given==='pct'?v.toFixed(2):v.toFixed(3))],['Moles (÷ atomic mass)',...d.mol.map(v=>v.toFixed(4))],['÷ smallest',...d.rat.map(v=>v.toFixed(2))],['× '+d.m+' → whole numbers',...d.ints.map(String)]];
  const y=drawTable(ctx,['Element',...d.els],rows,st.step,k,74);
  const yy=Math.max(y+20,330);
  if(st.step>=4){pill(ctx,'Empirical formula: '+CL.fmt(d.f),200,yy,PAL['s1'],'#fff',16*k);
    if(hon)txt(ctx,'formula mass '+d.Me.toFixed(2)+' g/mol',200,yy+30*k,{s:12.5*k,a:'center',c:PAL['cv-soft']});}
  if(st.step>=5){const mf=fstr(d.els,d.ints.map(v=>v*d.n));pill(ctx,'Molecular: '+CL.fmt(mf),590,yy,PAL['s2'],'#fff',16*k);txt(ctx,d.Mmol.toFixed(1)+' ÷ '+d.Me.toFixed(2)+' = '+d.n,590,yy+30*k,{s:12.5*k,a:'center',c:PAL['cv-soft']});
    drawMolecule(ctx,mf,590,yy+90*Math.max(1,k*0.8),k>1.3?0.9:1.1,0);}
  else if(st.step>=4)drawMolecule(ctx,d.f,200,yy+90*Math.max(1,k*0.8),1.1,0);
  if(st.step<4)txt(ctx,'Press Next step to work through it',400,yy,{s:13*k,a:'center',c:PAL['cv-soft']});}
function drawComb(sim,ctx,k,t){const p=sim.p,st=sim.st,d=combData(p),f=clamp(st.burnT<0?0:st.burnT/3,0,1);
  txt(ctx,'Sample '+(Object.keys(COMB).indexOf(p.cs)+1)+': '+p.cmass.toFixed(2)+' g of CₓHᵧO_z + O₂ → CO₂ + H₂O',16,30,{s:14*k,w:800});
  const y=118;ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.25;rr(ctx,40,y-24,300,48,22);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;rr(ctx,40,y-24,300,48,22);ctx.stroke();
  ctx.fillStyle=st.burnT>=0&&f<1?'rgba(255,120,40,.35)':PAL['cv-bg2'];rr(ctx,150,y-40,120,80,10);ctx.fill();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;rr(ctx,150,y-40,120,80,10);ctx.stroke();
  ctx.fillStyle='#d9d4c8';rr(ctx,185,y+4,50,10,3);ctx.fill();if(f<1){ctx.fillStyle='#f3efe2';ctx.fillRect(195,y-2+6*f,30,6*(1-f));}
  txt(ctx,'furnace',210,y+58,{s:12*k,a:'center',c:PAL['cv-soft']});txt(ctx,'O₂ in →',46,y-34,{s:12.5*k,w:700,c:PAL['s2']});
  [[410,'H₂O absorber',d.mH2O,'Mg(ClO₄)₂'],[600,'CO₂ absorber',d.mCO2,'NaOH']].forEach(([x,l,m,chem],i)=>{ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(i?x-90:340,y);ctx.lineTo(x-40,y);ctx.stroke();
    ctx.fillStyle=i?'#c9d3dc':'#d7d0e8';rr(ctx,x-40,y-26,80,52,10);ctx.fill();ctx.strokeStyle=PAL['cv-glass'];rr(ctx,x-40,y-26,80,52,10);ctx.stroke();txt(ctx,chem,x,y+1,{s:12*k,a:'center',b:'middle',w:700,c:'#33363c'});
    txt(ctx,l,x,y-36,{s:12.5*k,a:'center',w:700});txt(ctx,'+'+(m*f).toFixed(4)+' g',x,y+46*Math.max(1,k*0.8),{s:13.5*k,a:'center',w:800,c:i?PAL['s2']:PAL['s5']});});
  if(st.burnT>=0&&f<1&&!RM)for(let i=0;i<6;i++){const ph=(t*0.9+i/6)%1,xx=230+ph*420;const isC=i%2;ctx.fillStyle=isC?PAL['s2']:PAL['s5'];ctx.beginPath();ctx.arc(xx,y+(isC?-6:6),4,0,6.29);ctx.fill();}
  if(f>=1){const rows=[['Mass of element (g)',...d.masses.map(v=>v.toFixed(4))],['Moles',...d.mol.map(v=>v.toFixed(5))],['÷ smallest',...d.rat.map(v=>v.toFixed(2))],['Whole numbers',...d.ints.map(String)]];
    const yy=drawTable(ctx,['Element',...d.els],rows,4,k,206);pill(ctx,'Empirical formula: '+CL.fmt(d.f),400,Math.min(476,yy+10),PAL['s1'],'#fff',15*k);}
  else txt(ctx,st.burnT<0?'Press Burn the sample':'Burning…',400,300,{s:14*k,a:'center',c:PAL['cv-soft']});}

BioLab.register(SIM);
})();
