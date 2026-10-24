(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* Colligative properties.
   ΔTf = i·Kf·m and ΔTb = i·Kb·m with real constants (water Kf 1.86, Kb 0.512 °C·kg/mol; lauric acid Kf 3.9 °C·kg/mol).
   Freezing run: the tube loses heat to the bath at a rate k(T − T_bath). It supercools by 0.8 °C, then ice nucleates. While freezing,
   the heat flow freezes solvent: df/dt = k(T − T_bath)/L, with L the latent heat in °C of the liquid's own heat capacity (80 °C for water).
   Ice is pure solvent, so the solution left behind concentrates: T_f(f) = T_f° − i·Kf·m/(1 − f). That is why a solution's cooling curve slopes.
   Boiling run: the same idea with the hot plate and evaporation (L = 540 °C for water).
   Vapor pressure: Raoult's law, P = χ(solvent)·P°, with P° = 23.76 mmHg for water at 25 °C. */
const SOL={sugar:{l:'Sugar (sucrose, C₁₂H₂₂O₁₁)',f:'C₁₂H₂₂O₁₁',M:342.30,i:1,ri:1.0,ions:[{n:'suc',k:1}],sh:'sugar'},
  eg:{l:'Antifreeze (ethylene glycol, C₂H₆O₂)',f:'C₂H₆O₂',M:62.07,i:1,ri:1.0,ions:[{n:'eg',k:1}],sh:'antifreeze'},
  nacl:{l:'Road salt (NaCl)',f:'NaCl',M:58.44,i:2,ri:1.9,ions:[{n:'Na',k:1},{n:'Cl',k:1}],sh:'NaCl'},
  cacl2:{l:'Ice melt (CaCl₂)',f:'CaCl₂',M:110.98,i:3,ri:2.7,ions:[{n:'Ca',k:1},{n:'Cl',k:2}],sh:'CaCl₂'},
  mgso4:{l:'Epsom salt (MgSO₄)',f:'MgSO₄',M:120.37,i:2,ri:1.3,ions:[{n:'Mg',k:1},{n:'SO4',k:1}],sh:'MgSO₄'},
  unk:{l:'Unknown molecular compound X',f:'X',M:128.17,i:1,ri:1.0,ions:[{n:'X',k:1}],sh:'X'}};
const ION={suc:{c:'#8d6e63',r:10,t:'',hex:1},eg:{c:'#78909c',r:6,t:''},Na:{c:'#7e57c2',r:5.5,t:'+'},Cl:{c:'#43a047',r:7.5,t:'−'},Ca:{c:'#ef6c00',r:6.5,t:'2+'},Mg:{c:'#00897b',r:5.5,t:'2+'},SO4:{c:'#c0a000',r:9,t:'2−'},X:{c:'#455a64',r:8.5,t:'X'}};
const SOLV={water:{l:'water',Kf:1.86,Kb:0.512,fp:0,bp:100,bath:-15,start:10,L:80,k:0.5,M:18.02},lauric:{l:'lauric acid',Kf:3.9,Kb:null,fp:43.8,bp:null,bath:25,start:60,L:82,k:0.4,M:200.32}};
const P0=23.76,UNK_SOLV_G=25.0;
const solOf=p=>SOL[p.solute]||SOL.sugar,svOf=p=>(p.view==='freeze'?SOLV[p.solvent]:SOLV.water)||SOLV.water;
const iOf=p=>{const s=solOf(p);return p.realI?s.ri:s.i;};
const mOf=p=>p.solute==='unk'?p.gx/SOL.unk.M/(UNK_SOLV_G/1000):p.m;
const dTf=p=>iOf(p)*svOf(p).Kf*mOf(p),dTb=p=>iOf(p)*SOLV.water.Kb*mOf(p);
const chiW=p=>{const n=1000/SOLV.water.M,np=iOf(p)*mOf(p);return n/(n+np);};

/* ---------- state ---------- */
function newRun(T0){return {T:T0,f:0,ph:'liquid'};}
function build(p){const sv=svOf(p);const st={key:keyOf(p),runS:null,runP:null,zm:[],vap:[],surf:[],evapT:0};
  const T0=p.view==='boil'?25:sv.start;st.runS=newRun(T0);st.runP=newRun(T0);buildZoom(st,p);buildVapor(st,p);return st;}
const keyOf=p=>[p.view,p.solvent].join('|');
const zkey=p=>[p.solute,p.m,p.realI,p.gx,p.view].join('|');
function buildZoom(st,p){const s=solOf(p),m=mOf(p),nfu=Math.round(Math.min(14,6.5*m*(p.solute==='sugar'?0.8:1)));const zm=[];st.zk=zkey(p);
  let rnd=(()=>{let a=12345;return ()=>{a=(a*16807)%2147483647;return a/2147483647;};})();
  for(let i=0;i<62;i++)zm.push({t:'w',x:rnd()*2-1,y:rnd()*2-1,a:rnd()*6.28,g:i});
  const pairFrac=s.i>1?(s.i-iOf(p))/(s.i-1):0;
  for(let j=0;j<nfu;j++){const cx=rnd()*1.6-0.8,cy=rnd()*1.6-0.8;const paired=rnd()<pairFrac;let q=0;
    s.ions.forEach(io=>{for(let c=0;c<io.k;c++){const off=paired?(q*0.13):(q?0.35+rnd()*0.3:0);const a=rnd()*6.28;zm.push({t:io.n,x:cx+Math.cos(a)*off,y:cy+Math.sin(a)*off,a:0,pair:paired?j:null});q++;}});}
  zm.forEach(o=>{const r=Math.hypot(o.x,o.y);if(r>0.88){o.x*=0.88/r;o.y*=0.88/r;}});st.zm=zm;}
function buildVapor(st,p){const s=solOf(p),fs=clamp(6*(1-chiW(p)),0,0.5);const S=18;st.surf=[];let acc=0;
  for(let i=0;i<S;i++){acc+=fs;if(acc>=1){acc-=1;st.surf.push(s.ions[i%s.ions.length].n);}else st.surf.push('w');}
  if(!st.vap.length)for(let i=0;i<14;i++)st.vap.push({x:lerp(80,400,Math.random()),y:lerp(70,260,Math.random()),vx:(Math.random()-0.5)*160,vy:(Math.random()-0.5)*160});}
function ensure(sim){const p=sim.p;if(!sim.st||sim.st.key!==keyOf(p))sim.st=build(p);if(sim.st.zk!==zkey(p)){buildZoom(sim.st,p);buildVapor(sim.st,p);}}

function stepRun(r,dt,mode,Tf0,dT,sv){// Tf0: pure transition temperature; dT: i·K·m (+ for boil means elevation)
  if(mode==='freeze'){const Tb=sv.bath,k=sv.k,L=sv.L;const Tfr=f=>Tf0-dT/Math.max(0.02,1-f);
    if(r.ph==='liquid'){r.T+=-k*(r.T-Tb)*dt;if(r.T<Tfr(0)-0.8){r.ph='freezing';}}
    else if(r.ph==='freezing'){const df=k*(r.T-Tb)/L*dt;r.f=clamp(r.f+df,0,0.985);r.T+=(Tfr(r.f)-r.T)*Math.min(1,dt/0.12);if(dT===0&&r.f>=0.985)r.ph='solid';}
    else{r.T+=-k*0.6*(r.T-Tb)*dt;}}
  else{const Tp=140,k=0.25,L=540;const Tbo=f=>Tf0+dT/Math.max(0.05,1-f);
    if(r.ph==='liquid'){r.T+=k*(Tp-r.T)*dt;if(r.T>=Tbo(0))r.ph='boiling';}
    else{const df=k*(Tp-r.T)/L*dt;r.f=clamp(r.f+df,0,0.6);r.T+=(Tbo(r.f)-r.T)*Math.min(1,dt/0.12);}}}
function stepC(sim,dt){ensure(sim);const p=sim.p,st=sim.st,sv=svOf(p);
  if(p.view==='freeze'){stepRun(st.runS,dt,'freeze',sv.fp,dTf(p),sv);stepRun(st.runP,dt,'freeze',sv.fp,0,sv);}
  else if(p.view==='boil'){stepRun(st.runS,dt,'boil',100,dTb(p),sv);stepRun(st.runP,dt,'boil',100,0,sv);}}

/* ---------- show only what the current view uses ---------- */
function sync(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p;const vis=o=>atLeast(o.lvl)&&(!o.modes||o.modes.includes(p.view))&&(!o.when||o.when(p));
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(m);});}
const rerun=sim=>{sim.t=0;sim.hist=[];sim.lastSample=-1e9;sim.st=null;ensure(sim);};
const ionText=p=>{const s=solOf(p);if(s.i===1)return '1: '+s.f+' molecules stay whole';return s.i+': '+s.ions.map(io=>(io.k>1?io.k:'')+CL.fmt(io.n==='SO4'?'SO4':io.n,io.n==='Cl'?-1:io.n==='Na'?1:io.n==='SO4'?-2:2)).join(' + ');};

const SIM={
  id:'colligative',hash:'colligative',apUnit:10,order:4,tab:'Colligative properties',kind:'Simulation',
  prereq:['dissolve','molarity'],next:['phasediagram','solcurve'],
  card:'Dissolve sugar, salt or antifreeze, then freeze and boil the solution to see why road salt melts ice and how particles, not identity, set the change.',
  title:'Colligative properties: freezing point, boiling point and vapor pressure',
  lede:{bio:'Dissolve something in water and it freezes at a lower temperature and boils at a higher one. Salt does more than sugar because each unit of salt breaks into more particles.',
        honors:'Measure ΔTf = i·Kf·m and ΔTb = i·Kb·m from cooling and heating curves, see the van ’t Hoff factor as particles, and watch solute particles lower the vapor pressure (Raoult’s law).',
        ap:'Compare ideal and measured van ’t Hoff factors (ion pairing), and find the molar mass of an unknown from its freezing-point depression in water or lauric acid.'},
  scale:'A test tube with about 10 mL of solution in an ice–salt bath at −15 °C (or a hot plate for boiling). The zoom shows a few nanometers of the liquid; solute particles are drawn about 6× more crowded than they really are at 1 m so you can see them. Time runs about 30× faster than a real lab.',
  timeScale:0.6,dtMax:0.02,prewarm:0,sampleDt:0.05,window:15,unit:'min',chChange:0.5,chReveal:8,
  controls:[
    {id:'view',label:'Experiment',type:'seg',def:'freeze',lvl:'bio',options:[{v:'freeze',l:'Freezing point'},{v:'boil',l:'Boiling point'},{v:'vapor',l:'Vapor pressure',lvl:'honors'}],onChange(sim){sync(sim);rerun(sim);}},
    {id:'solute',label:'Solute',type:'select',def:'nacl',lvl:'bio',options:Object.keys(SOL).map(k=>({v:k,l:SOL[k].l,lvl:k==='mgso4'||k==='unk'?'ap':undefined})),onChange(sim){sync(sim);}},
    {id:'m',label:'Concentration (molality)',type:'range',min:0,max:3,step:0.05,def:1,unit:' m',lvl:'bio',when:p=>p.solute!=='unk',help:'Moles of solute per kilogram of solvent. 1 m NaCl is 58 g of salt in 1 kg of water.'},
    {id:'gx',label:'Mass of unknown X dissolved in 25.0 g of solvent',type:'range',min:0.2,max:3,step:0.05,def:1,unit:' g',lvl:'ap',when:p=>p.solute==='unk'},
    {id:'solvent',label:'Solvent',type:'seg',def:'water',lvl:'ap',modes:['freeze'],options:[{v:'water',l:'Water'},{v:'lauric',l:'Lauric acid'}],help:'Lauric acid freezes at 43.8 °C and has Kf = 3.9 °C·kg/mol.',onChange(sim){rerun(sim);}},
    {id:'realI',label:'Use measured van ’t Hoff factors',type:'toggle',def:false,lvl:'ap',help:'Some ions stick together in pairs, so salts act as fewer particles than their formula says.'}
  ],
  actions:[{id:'again',label:'Run the experiment again',lvl:'bio',run(sim){rerun(sim);}}],
  init(sim){return build(sim.p);},
  step:stepC,
  metrics:[
    {id:'T',label:'Thermometer (solution)',unit:'°C',lvl:'bio',min:-20,max:110,d:1,modes:['freeze','boil'],get:s=>s.p.view==='vapor'?NaN:s.st.runS.T},
    {id:'Tp',label:'Pure solvent, same run',unit:'°C',lvl:'bio',min:-20,max:110,d:1,modes:['freeze','boil'],noTrial:true,get:s=>s.p.view==='vapor'?NaN:s.st.runP.T},
    {id:'fp',label:'Freezing point of the solution',unit:'°C',lvl:'bio',min:-20,max:50,d:2,modes:['freeze'],get:s=>s.p.view==='freeze'?svOf(s.p).fp-dTf(s.p):NaN},
    {id:'bp',label:'Boiling point of the solution',unit:'°C',lvl:'bio',min:90,max:110,d:2,modes:['boil'],get:s=>s.p.view==='boil'?100+dTb(s.p):NaN},
    {id:'iT',label:'Particles from each formula unit (i)',unit:'',lvl:'bio',text:true,get:s=>ionText(s.p)},
    {id:'mm',label:'Molality',unit:'m',lvl:'honors',min:0,max:3,d:3,get:s=>mOf(s.p)},
    {id:'dTf',label:'ΔTf = i·Kf·m',unit:'°C',lvl:'honors',min:0,max:20,d:2,modes:['freeze'],get:s=>s.p.view==='freeze'?dTf(s.p):NaN},
    {id:'dTb',label:'ΔTb = i·Kb·m',unit:'°C',lvl:'honors',min:0,max:5,d:2,modes:['boil'],get:s=>s.p.view==='boil'?dTb(s.p):NaN},
    {id:'frz',label:'Solvent frozen so far',unit:'%',lvl:'honors',min:0,max:100,d:0,modes:['freeze'],get:s=>s.p.view==='freeze'?s.st.runS.f*100:NaN},
    {id:'VP',label:'Vapor pressure at 25 °C',unit:'mmHg',lvl:'honors',min:0,max:24,d:2,modes:['vapor'],get:s=>s.p.view==='vapor'?chiW(s.p)*P0:NaN},
    {id:'chi',label:'Mole fraction of water, χ',unit:'',lvl:'honors',min:0.9,max:1,d:4,modes:['vapor'],get:s=>s.p.view==='vapor'?chiW(s.p):NaN},
    {id:'ieff',label:'van ’t Hoff factor used',unit:'',lvl:'ap',min:0,max:3,d:1,get:s=>iOf(s.p)},
    {id:'K',label:'Constant used',unit:'',lvl:'ap',text:true,get:s=>s.p.view==='boil'?'Kb = 0.512 °C·kg/mol (water)':s.p.view==='vapor'?'P° = 23.76 mmHg (water, 25 °C)':'Kf = '+svOf(s.p).Kf+' °C·kg/mol ('+svOf(s.p).l+')'},
    {id:'Mx',label:'Molar mass of X from ΔTf',unit:'g/mol',lvl:'ap',min:0,max:300,d:1,when:p=>p.solute==='unk'&&p.view==='freeze',get:s=>{const p=s.p;if(p.solute!=='unk'||p.view!=='freeze')return NaN;const dT=Math.round(dTf(p)*100)/100;const m=dT/(1*svOf(p).Kf);return p.gx/(m*UNK_SOLV_G/1000);}}
  ],
  graphs:[{id:'curve',label:'Temperature vs time (solution and pure)',lvl:'bio',lines:['T','Tp']},{id:'dt',label:'Temperature change vs molality',lvl:'bio',custom:true},{id:'vp',label:'Vapor pressure vs mole fraction',lvl:'honors',custom:true}],
  defaultGraph:'curve',
  plot(sim,ctx,box,id){plotC(sim,ctx,box,id);},
  narrate(sim){ensure(sim);return narrC(sim);},
  tour:[
    {title:'A solution in a cold bath',text:'The test tube holds 1 m salt water and sits in an ice–salt bath at −15 °C. A second tube of pure water (the dashed line on the graph) cools beside it for comparison.',focus:[30,40,290,400],speed:1,setup(sim){BioLab.setValues(sim,{view:'freeze',solute:'nacl',m:1,solvent:'water',realI:false});rerun(sim);}},
    {title:'Solute particles in the way',text:{bio:'The zoom shows water molecules and the dissolved Na⁺ and Cl⁻ ions. To freeze, water molecules must line up in an ice crystal. The ions get in the way, so the water has to get colder before it can freeze.',honors:'Each NaCl unit gives two particles (i = 2). Colligative properties depend on the number of dissolved particles, not on what they are.'},focus:[322,48,236,256],speed:1},
    {title:'Pure water freezes at 0 °C',text:'Pure water cools, dips a little below 0 °C (supercooling), then ice forms and the temperature holds flat at 0 °C until it is all frozen.',focus:[560,40,236,250],speed:1.5,setup(sim){if(sim.t<2.5)sim.t=sim.t;}},
    {title:'The solution freezes lower',text:{bio:'The salt water starts to freeze at about −3.7 °C. As ice forms, the salt stays in the liquid, which gets saltier, so the temperature keeps sliding down.',honors:'ΔTf = i·Kf·m = (2)(1.86 °C/m)(1.00 m) = 3.72 °C. The sloping plateau is real: the remaining solution concentrates as pure ice forms.'},focus:[[322,48,236,256],[322,306,470,138]],speed:1.5},
    {title:'Road salt and ice melt',text:'CaCl₂ breaks into three ions (Ca²⁺ + 2Cl⁻), so at the same molality it lowers the freezing point 1.5 times as much as NaCl. That is why it works on colder days.',focus:[[322,48,236,256],[322,306,470,138]],speed:1.5,setup(sim){BioLab.setValues(sim,{solute:'cacl2'});rerun(sim);}},
    {title:'Boiling point goes up',text:{bio:'Dissolved particles also make water boil at a higher temperature, but only a little: 1 m salt water boils at about 101 °C. Salt in pasta water does not make it boil faster.',honors:'ΔTb = i·Kb·m = (2)(0.512)(1.00) = 1.02 °C. Kb is much smaller than Kf, so boiling points change less.'},focus:[30,40,770,400],speed:1.5,setup(sim){BioLab.setValues(sim,{view:'boil',solute:'nacl',m:1});rerun(sim);}},
    {lvl:'honors',title:'Vapor pressure goes down',text:'At the surface, solute particles take up some of the spots where water molecules could escape. Fewer escape, so the vapor pressure drops: P = χ(water) × P°. A lower vapor pressure is why the solution must be heated more to boil.',focus:[40,40,400,400],speed:1,setup(sim){BioLab.setValues(sim,{view:'vapor',solute:'sugar',m:3});rerun(sim);}},
    {lvl:'ap',title:'Find a molar mass',text:'In the AP lab, a weighed unknown dissolves in 25.0 g of lauric acid (Kf = 3.9). Measure ΔTf, find m = ΔTf/(i·Kf), then moles = m × kg of solvent, and M = grams ÷ moles.',focus:[30,40,770,400],speed:1.5,setup(sim){BioLab.setValues(sim,{view:'freeze',solvent:'lauric',solute:'unk',gx:1});rerun(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{view:'freeze',solute:'nacl',m:1,solvent:'water',realI:false,gx:1});rerun(sim);},
  challenges(sim){return CH;},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='done'){BioLab.setValues(sim,ch.set);rerun(sim);}},
  onLevel(sim){sync(sim);},
  lab:{bio:'<p><b>Question:</b> Does salt or sugar lower the freezing point of water more?</p><ol><li>Freezing point, sugar at 1.0 m. Let the run finish (about 10 minutes of lab time) and record a trial.</li><li>Repeat with road salt (NaCl) and ice melt (CaCl₂) at 1.0 m.</li><li>Compare the freezing points.</li></ol><p>Explain your ranking using the number of particles each solute makes. Why do cities spread CaCl₂ on the coldest days?</p>',
       honors:'<p><b>Question:</b> Is the freezing-point depression proportional to molality?</p><ol><li>Choose NaCl. Record the freezing point at 0, 0.5, 1.0, 1.5 and 2.0 m.</li><li>Plot ΔTf against molality (the Temperature change vs molality graph does this too).</li><li>Repeat for sugar.</li></ol><p>Find each slope and divide by Kf = 1.86 °C·kg/mol. What does the result tell you about i?</p>',
       ap:'<p><b>Question:</b> What is the molar mass of unknown X?</p><ol><li>Freezing point, solvent lauric acid, solute unknown X. Record trials with 0.50, 1.00 and 1.50 g of X in 25.0 g of lauric acid.</li><li>For each, find ΔTf, then m = ΔTf/(i·Kf) with Kf = 3.9 °C·kg/mol.</li><li>Moles of X = m × 0.0250 kg; M = grams ÷ moles.</li></ol><p><b>Claim–evidence–reasoning:</b> Report your average molar mass. Then turn on measured van ’t Hoff factors for NaCl and explain why an ionic unknown would give a misleading molar mass.</p>'},
  terms:[{t:'Solute / solvent',d:'The solute dissolves; the solvent does the dissolving (here, water).'},{t:'Freezing-point depression',d:'A solution freezes at a lower temperature than the pure solvent.'},{t:'Boiling-point elevation',d:'A solution boils at a higher temperature than the pure solvent.'},
    {t:'Colligative property',d:'A property that depends on how many solute particles are dissolved, not on what they are.'},{t:'Electrolyte',d:'A solute that breaks into ions in water, like NaCl → Na⁺ + Cl⁻.'},
    {lvl:'honors',t:'Molality (m)',d:'Moles of solute per kilogram of solvent.'},{lvl:'honors',t:'van ’t Hoff factor (i)',d:'The number of particles each formula unit makes: sugar 1, NaCl 2, CaCl₂ 3.'},
    {lvl:'honors',t:'ΔTf = i·Kf·m',d:'Kf = 1.86 °C·kg/mol for water.'},{lvl:'honors',t:'ΔTb = i·Kb·m',d:'Kb = 0.512 °C·kg/mol for water.'},{lvl:'honors',t:'Raoult’s law',d:'P(solution) = χ(solvent) × P°(pure solvent).'},
    {lvl:'ap',t:'Ion pairing',d:'Oppositely charged ions that stay together in solution, so the measured i is smaller than the formula predicts.'}],
  about:'<p><b>Equations and data.</b> ΔTf = i·Kf·m and ΔTb = i·Kb·m with Kf = 1.86 and Kb = 0.512 °C·kg/mol for water and Kf = 3.9 °C·kg/mol for lauric acid (freezing point 43.8 °C). Ideal van ’t Hoff factors come from the formula; measured ones (NaCl 1.9, CaCl₂ 2.7, MgSO₄ 1.3) are typical values for dilute solutions near 0.05 m. Raoult’s law uses P°(water, 25 °C) = 23.76 mmHg, and χ counts every dissolved particle.</p><p><b>The curves.</b> The tube loses heat to a −15 °C ice–salt bath (or a 25 °C water bath for lauric acid) at a rate proportional to the temperature difference. It supercools by 0.8 °C before ice nucleates, a common real effect. While freezing, removed heat turns liquid into crystal, and because the crystal is pure solvent, the leftover solution gets more concentrated and its freezing point keeps falling. Read the freezing point where the plateau starts. Boiling works the same way with a 140 °C hot plate and evaporation.</p><p><b>Simplifications.</b> The equations are for dilute solutions; above about 1 m they become approximate (real 50% antifreeze freezes near −37 °C). Boiling points are for 1 atm: at RJ’s altitude pure water boils near 95 °C. Unknown X is a nonelectrolyte (i = 1). The particle zoom exaggerates the number of solute particles about 6× and shows paired ions when measured factors are on. Time runs about 30× faster than in a real lab.</p>',
  initVis(sim){},
  draw(sim,ctx,vdt,k,t){ensure(sim);drawC(sim,ctx,vdt,k,t);},
  thumbSetup(sim){for(let i=0;i<300;i++){sim.def.step(sim,0.02);sim.t+=0.02;}},thumbFrames:2
};

/* ---------- challenges ---------- */
const fx=(p)=>{const q=Object.assign({view:'freeze',solute:'nacl',m:1,solvent:'water',realI:false,gx:1},p);return q;};
const lauM=(()=>{const dT=Math.round(3.9*(1/128.17/0.025)*100)/100;return {dT,M:1/(dT/3.9*0.025),Mbad1:1/(dT/3.9*25),Mbad2:1/(dT/1.86*0.025)};})();
const CH=[
  {lvl:'bio',q:'The tube holds 1.0 m sugar water. You switch to 1.0 m road salt (NaCl). What happens to the freezing point?',choices:['It drops about twice as far, because each NaCl splits into two ions','It stays the same, because the molality is the same','It drops less, because salt molecules are smaller than sugar'],correct:0,
   baseline:fx({solute:'sugar'}),change:{solute:'nacl'},changeText:'Sugar replaced by the same molality of NaCl',watch:'curve',
   explain:{bio:'Sugar stays as whole molecules, so 1 m sugar freezes at −1.86 °C. NaCl breaks into Na⁺ and Cl⁻, twice as many particles, so it freezes at −3.72 °C. What counts is the number of particles.',honors:'ΔTf = i·Kf·m: sugar (1)(1.86)(1.0) = 1.86 °C; NaCl (2)(1.86)(1.0) = 3.72 °C.'}},
  {lvl:'bio',q:'Pure water boils at 100 °C. You add enough salt to make 1.0 m NaCl. What happens?',choices:['It boils at a lower temperature, so pasta cooks sooner','It boils about 1 °C hotter','It boils about 10 °C hotter'],correct:1,
   baseline:fx({view:'boil',m:0}),change:{m:1},changeText:'Salt added: 1.0 m NaCl',watch:'curve',
   explain:{bio:'Dissolved particles raise the boiling point, but only a little: 1 m salt water boils at about 101.0 °C. A pinch of salt in a pot of pasta water changes it by far less than 1 °C.',honors:'ΔTb = i·Kb·m = (2)(0.512)(1.0) = 1.02 °C.'}},
  {lvl:'bio',q:'Road salt (NaCl) and ice melt (CaCl₂) are used at the same molality, 1.0 m. Which one keeps water liquid at a colder temperature?',choices:['NaCl, because it is the more common salt','CaCl₂, because each unit makes three ions','They work the same, because the molality is the same'],correct:1,
   baseline:fx({solute:'nacl'}),change:{solute:'cacl2'},changeText:'NaCl replaced by CaCl₂',watch:'curve',
   explain:{bio:'CaCl₂ → Ca²⁺ + 2Cl⁻ gives three particles per unit, so 1 m CaCl₂ freezes at about −5.6 °C, lower than −3.7 °C for NaCl. CaCl₂ also releases heat as it dissolves, which helps on icy roads.'}},
  {lvl:'honors',q:'Which solution has the lowest freezing point: 1.0 m sugar, 0.50 m NaCl, or 0.40 m CaCl₂?',choices:['1.0 m sugar, because it has the highest molality','0.50 m NaCl','0.40 m CaCl₂'],correct:2,instant:true,set:fx({solute:'cacl2',m:0.4}),
   explain:{honors:'Count particles: sugar 1 × 1.0 = 1.0 m of particles; NaCl 2 × 0.50 = 1.0 m; CaCl₂ 3 × 0.40 = 1.2 m. CaCl₂ wins: ΔTf = (3)(1.86)(0.40) = 2.23 °C, freezing point −2.23 °C. The model is now set to 0.40 m CaCl₂ so you can check.'}},
  {lvl:'honors',q:'A closed flask holds pure water at 25 °C. You dissolve sugar to make 3.0 m. What happens to the vapor pressure?',choices:['It rises, because sugar molecules push water out','It drops, because solute particles block water molecules from escaping','It stays the same, because sugar does not evaporate'],correct:1,
   baseline:fx({view:'vapor',solute:'sugar',m:0}),change:{m:3},changeText:'Sugar dissolved: 3.0 m',watch:'vp',
   explain:{honors:'χ(water) = 55.5/(55.5 + 3.0) = 0.949, so P = 0.949 × 23.76 = '+(23.76*55.51/58.51).toFixed(2)+' mmHg. Fewer water molecules at the surface means fewer escape each second.'}},
  {lvl:'honors',q:'Pure water stays flat at 0 °C while it freezes. What does the 1.0 m NaCl solution do while it freezes?',choices:['It also stays perfectly flat, just lower','Its temperature keeps sliding down as it freezes','It warms up as it freezes'],correct:1,
   baseline:fx({solute:'nacl',m:1}),at:0.1,reveal:9,changeText:'Watch the solid line after ice starts to form',watch:'curve',
   explain:{honors:'Ice crystals are pure water, so the salt stays behind in less and less liquid. The remaining solution gets more concentrated and its freezing point keeps falling, so the plateau slopes down. Read the freezing point where freezing begins (−3.72 °C here).'}},
  {lvl:'ap',q:'You switch NaCl from the ideal factor (i = 2) to the measured factor. How does the freezing point change?',choices:['It rises a little, because some Na⁺ and Cl⁻ stay paired (i ≈ 1.9)','It drops further, because the measured i is larger','Nothing changes'],correct:0,
   baseline:fx({solute:'nacl',m:1,realI:false}),change:{realI:true},changeText:'Measured van ’t Hoff factor turned on',watch:'dt',
   explain:{ap:'Opposite ions attract, and some stay together as ion pairs, so 1 unit of NaCl acts like about 1.9 particles. ΔTf falls from 3.72 °C to 3.53 °C, and the freezing point rises from −3.72 to −3.53 °C. The effect is much bigger for MgSO₄ (2+ and 2− ions): i ≈ 1.3.'}},
  {lvl:'ap',q:'1.00 g of unknown X (a nonelectrolyte) in 25.0 g of lauric acid lowers its freezing point by '+lauM.dT.toFixed(2)+' °C. Kf = 3.9 °C·kg/mol. What is the molar mass of X?',choices:[lauM.M.toFixed(0)+' g/mol',lauM.Mbad1.toFixed(3)+' g/mol',lauM.Mbad2.toFixed(1)+' g/mol'],correct:0,instant:true,set:fx({solvent:'lauric',solute:'unk',gx:1}),
   explain:{ap:'m = ΔTf/(i·Kf) = '+lauM.dT.toFixed(2)+'/3.9 = '+(lauM.dT/3.9).toFixed(4)+' mol/kg. Moles = '+(lauM.dT/3.9).toFixed(4)+' × 0.0250 kg = '+(lauM.dT/3.9*0.025).toExponential(3)+' mol. M = 1.00 g ÷ moles = '+lauM.M.toFixed(0)+' g/mol. The other answers come from forgetting to convert 25.0 g to kg, or using water’s Kf. The model is now set to this experiment.'}},
  {lvl:'ap',q:'Why is the measured van ’t Hoff factor of MgSO₄ (about 1.3) so far below its ideal value of 2?',choices:['Mg²⁺ and SO₄²⁻ attract strongly, so many stay together as ion pairs','MgSO₄ barely dissolves in water','Sulfate breaks apart into more ions'],correct:0,instant:true,set:fx({solute:'mgso4',m:1,realI:true}),
   explain:{ap:'The attraction between ions grows with the product of their charges, so 2+/2− pairs hold together far more than 1+/1− pairs. MgSO₄ is very soluble; its ions just do not all act independently. With measured i on, 1 m MgSO₄ freezes at '+(-(1.3*1.86)).toFixed(2)+' °C instead of '+(-(2*1.86)).toFixed(2)+' °C.'}}
];

/* ---------- narration ---------- */
function narrC(sim){const p=sim.p,st=sim.st,s=solOf(p),sv=svOf(p),hon=atLeast('honors'),i=iOf(p),m=mOf(p);
  const parts=s.i===1?'whole '+s.f+' molecules':s.ions.map(io=>(io.k>1?io.k+' ':'')+CL.fmt(io.n,io.n==='Cl'?-1:io.n==='Na'?1:io.n==='SO4'?-2:2)).join(' and ')+' ions';
  if(p.view==='vapor'){const P=chiW(p)*P0;if(m<=0)return 'Pure water: every spot at the surface is a water molecule, so molecules escape as fast as they can at 25 °C. The vapor pressure is <b>23.76 mmHg</b>.';
    return 'Dissolved '+parts+' take up some spots at the surface, so fewer water molecules escape each second. The vapor pressure drops to <b>'+P.toFixed(2)+' mmHg</b>'+(hon?' (χ = '+chiW(p).toFixed(4)+').':'.');}
  const r=st.runS,rp=st.runP;
  if(m<=0)return 'This is pure '+sv.l+'. Add a solute to compare its '+(p.view==='boil'?'boiling':'freezing')+' point with the pure solvent.';
  if(p.view==='boil'){const bp=100+dTb(p);if(r.ph==='liquid')return 'The hot plate heats the solution. Dissolved '+parts+' hold water molecules back from escaping, so the solution has to get hotter than pure water before it boils: <b>'+bp.toFixed(2)+' °C</b>.';
    return 'The solution is boiling at '+r.T.toFixed(2)+' °C while pure water boils at 100.00 °C. As water boils away the solution gets more concentrated, so its boiling point creeps up.';}
  const fp=sv.fp-dTf(p);
  if(r.ph==='liquid')return 'The '+(sv===SOLV.water?'solution':'lauric acid solution')+' is cooling toward its freezing point. To freeze, solvent molecules must line up in a crystal, and the dissolved '+parts+' get in the way, so it must get colder than pure '+sv.l+': <b>'+fp.toFixed(2)+' °C</b>.';
  return 'Crystals of pure '+sv.l+' are forming ('+Math.round(r.f*100)+'% frozen). The solute stays in the liquid, which gets more concentrated, so the temperature keeps sliding below the starting freezing point of <b>'+fp.toFixed(2)+' °C</b>'+(hon?' (ΔTf = '+i.toFixed(1)+' × '+sv.Kf+' × '+m.toFixed(2)+' = '+dTf(p).toFixed(2)+' °C).':'.');}

/* ---------- drawing ---------- */
function water(ctx,x,y,a,s){const c=Math.cos(a),sn=Math.sin(a);ctx.fillStyle='#f5f5f5';ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=0.8;
  [[-0.6,0.55],[0.6,0.55]].forEach(([dx,dy])=>{const hx=x+(dx*c-dy*sn)*7*s,hy=y+(dx*sn+dy*c)*7*s;ctx.beginPath();ctx.arc(hx,hy,3.2*s,0,6.2832);ctx.fill();ctx.stroke();});
  ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(x,y,5.2*s,0,6.2832);ctx.fill();ctx.stroke();}
function ion(ctx,x,y,t,s,k){const o=ION[t];if(!o)return;ctx.fillStyle=o.c;ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=1;
  if(o.hex){ctx.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3;ctx.lineTo(x+Math.cos(a)*o.r*s,y+Math.sin(a)*o.r*s);}ctx.closePath();ctx.fill();ctx.stroke();return;}
  ctx.beginPath();ctx.arc(x,y,o.r*s,0,6.2832);ctx.fill();ctx.stroke();if(o.t)txt(ctx,o.t,x,y+1,{s:Math.max(9,o.r*s*1.15),w:800,c:'#fff',a:'center',b:'middle'});}
function zoomC(sim,ctx,cx,cy,R,k,t,vdt){const p=sim.p,st=sim.st,frz=p.view==='freeze'?st.runS.f:0,edge=-1+2*clamp(frz,0,1),s=R/110;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,6.2832);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  if(frz>0.01){ctx.fillStyle='rgba(225,240,255,0.55)';ctx.fillRect(cx-R,cy-R,(edge+1)*R,2*R);}
  const jig=RM?0:1;
  st.zm.forEach((o,i)=>{if(vdt>0&&jig){o.x+=(Math.random()-0.5)*0.03;o.y+=(Math.random()-0.5)*0.03;o.a+=(Math.random()-0.5)*0.4;const r=Math.hypot(o.x,o.y);if(r>0.9){o.x*=0.9/r;o.y*=0.9/r;}}
    if(o.t!=='w'&&frz>0.01&&o.x<edge+0.12)o.x=Math.min(0.88,edge+0.12+Math.random()*0.05);});
  // ice lattice for frozen water molecules
  st.zm.forEach((o,i)=>{if(o.t!=='w')return;let x=o.x,y=o.y,a=o.a;if(frz>0.01&&x<edge){const gx=Math.round(x/0.2)*0.2,gy=Math.round((y+((Math.round(x/0.2))%2?0.1:0))/0.2)*0.2-((Math.round(x/0.2))%2?0.1:0);x=gx;y=gy;a=0.5;}
    water(ctx,cx+x*R,cy+y*R,a,s);});
  st.zm.forEach(o=>{if(o.t==='w')return;ion(ctx,cx+o.x*R,cy+o.y*R,o.t,s,k);});
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,R,0,6.2832);ctx.stroke();}
function scaleBar(sim,ctx,x,y0,y1,k,compact){const p=sim.p,sv=svOf(p),boil=p.view==='boil';const ref=boil?100:sv.fp,d=boil?dTb(p):dTf(p),val=boil?ref+d:ref-d;
  const span=boil?4:Math.max(8,Math.ceil((d+2)/4)*4),top=boil?ref+span*0.75:ref+span*0.25,bot=top-span,Y=v=>y0+(top-v)/(top-bot)*(y1-y0);
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y1);ctx.stroke();
  const step=span<=4?1:span<=8?2:span<=16?4:5;for(let v=Math.ceil(bot/step)*step;v<=top;v+=step){ctx.beginPath();ctx.moveTo(x-5,Y(v));ctx.lineTo(x+5,Y(v));ctx.stroke();if(!compact)txt(ctx,v.toFixed(0),x-9,Y(v)+4,{s:12*k,c:PAL['cv-soft'],a:'right'});}
  const lab=(v,c,s2)=>{ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-12,Y(v));ctx.lineTo(x+40,Y(v));ctx.stroke();txt(ctx,s2,x+46,Y(v)+5,{s:12.5*k,w:700,c});};
  lab(ref,PAL['cv-ink'],(boil?'pure: ':'pure: ')+ref.toFixed(1)+' °C');lab(val,PAL['s1'],'solution: '+val.toFixed(2)+' °C');
  if(d>0.05){ctx.strokeStyle=PAL['s1'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+22,Y(ref));ctx.lineTo(x+22,Y(val));ctx.stroke();}
  txt(ctx,boil?'Boiling point':'Freezing point',x-10,y0-14,{s:13*k,w:700,c:PAL['cv-ink']});}
function drawC(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,compact=k>1.3,hon=atLeast('honors'),sv=svOf(p);ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);
  if(p.view==='vapor')return drawVapor(sim,ctx,vdt,k,compact);
  const boil=p.view==='boil',r=st.runS;
  // bath or hot plate
  if(!boil){ctx.fillStyle=sv===SOLV.water?PAL['cv-water']:PAL['cv-water'];ctx.fillRect(44,170,252,262);
    if(sv===SOLV.water){[[70,186],[110,200],[240,190],[268,214],[84,300],[262,330],[90,390],[250,396]].forEach(([x,y])=>{rr(ctx,x-13,y-11,26,22,4);ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=1.2;ctx.stroke();});}
    ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(44,150);ctx.lineTo(44,432);ctx.lineTo(296,432);ctx.lineTo(296,150);ctx.stroke();
    txt(ctx,sv===SOLV.water?'Ice–salt bath −15 °C':'Water bath 25 °C',170,442,{s:12.5*k,w:700,a:'center',c:PAL['cv-soft']});}
  else{rr(ctx,60,404,220,30,6);ctx.fillStyle='#c62828';ctx.fill();txt(ctx,'Hot plate',170,424,{s:12.5*k,w:700,a:'center',c:'#fff'});}
  // test tube
  const tx=140,tw=60,ty=60,tb=boil?396:400,ly=ty+90;
  const liq=boil?PAL['cv-water']:sv===SOLV.water?PAL['cv-water']:'rgba(240,220,150,0.6)';
  ctx.fillStyle=liq;ctx.beginPath();ctx.moveTo(tx,ly);ctx.lineTo(tx,tb-30);ctx.quadraticCurveTo(tx,tb,tx+tw/2,tb);ctx.quadraticCurveTo(tx+tw,tb,tx+tw,tb-30);ctx.lineTo(tx+tw,ly);ctx.closePath();ctx.fill();
  if(!boil&&r.f>0.005){ctx.save();ctx.clip();ctx.fillStyle='rgba(255,255,255,0.75)';const th=r.f*tw*0.5;ctx.fillRect(tx,ly,th,tb-ly);ctx.fillRect(tx+tw-th,ly,th,tb-ly);ctx.fillRect(tx,tb-th*1.4,tw,th*1.4);ctx.restore();}
  if(boil&&r.ph==='boiling'&&!RM){ctx.strokeStyle=PAL['cv-bstroke'];ctx.lineWidth=1.5;for(let i=0;i<9;i++){const ph=((t*0.9+i*0.31)%1);ctx.beginPath();ctx.arc(tx+10+(i*17)%42,tb-14-ph*(tb-ly-24),2+ph*3,0,6.2832);ctx.stroke();}}
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx,tb-30);ctx.quadraticCurveTo(tx,tb,tx+tw/2,tb);ctx.quadraticCurveTo(tx+tw,tb,tx+tw,tb-30);ctx.lineTo(tx+tw,ty);ctx.stroke();
  // probe
  ctx.fillStyle='#78909c';ctx.fillRect(tx+tw/2-3,40,6,tb-60-40);pill(ctx,r.T.toFixed(1)+' °C',tx+tw/2,30,PAL['cv-ink'],PAL['card'],14*k);
  // zoom from the tube
  const zx=440,zy=150,zr=100;ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(tx+tw,ly+60);ctx.lineTo(zx-zr*0.9,zy+zr*0.4);ctx.stroke();ctx.setLineDash([]);
  zoomC(sim,ctx,zx,zy,zr,k,t,vdt);if(!compact)txt(ctx,(r.f>0.01&&!boil?'Ice crystal (left) pushes the solute out':'Water molecules and '+solOf(p).sh+(solOf(p).i>1?' ions':' molecules')),zx,zy+zr+20,{s:12.5*k,w:600,a:'center',c:PAL['cv-ink']});
  scaleBar(sim,ctx,630,70,280,k,compact);
  // equation card
  const d=boil?dTb(p):dTf(p),K=boil?0.512:sv.Kf,i=iOf(p),m=mOf(p);rr(ctx,330,316,460,124,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  const L1=hon?(boil?'ΔTb = i·Kb·m':'ΔTf = i·Kf·m'):(boil?'More particles → higher boiling point':'More particles → lower freezing point');
  const L2=hon?'= ('+i.toFixed(1)+')('+K+')('+m.toFixed(2)+') = '+d.toFixed(2)+' °C':(solOf(p).i===1?'Each unit stays whole: i = 1':'Each unit splits into '+solOf(p).i+' ions: i = '+solOf(p).i);
  txt(ctx,L1,346,346+4*(k-1),{s:15*k,w:700});txt(ctx,L2,346,378+12*(k-1),{s:13.5*k,c:PAL['cv-soft']});
  if(!compact)txt(ctx,(boil?'Boils at ':'Starts to freeze at ')+(boil?100+d:sv.fp-d).toFixed(2)+' °C ('+(boil?'+':'−')+d.toFixed(2)+' °C)',346,412,{s:13*k,w:600,c:PAL['s1']});}
function drawVapor(sim,ctx,vdt,k,compact){const p=sim.p,st=sim.st,chi=chiW(p),hon=atLeast('honors');
  const x0=60,x1=420,y0=56,sy=290,y1=430,S=st.surf.length,sw=(x1-x0)/S;
  ctx.fillStyle=PAL['cv-bg2'];ctx.fillRect(x0,y0,x1-x0,sy-y0);ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0,sy,x1-x0,y1-sy);
  // liquid interior: a sprinkle of molecules
  for(let i=0;i<24;i++){const x=x0+18+((i*73)%(x1-x0-36)),y=sy+40+((i*41)%(y1-sy-60));water(ctx,x,y,i*0.7,0.9);}
  // surface slots
  st.surf.forEach((t2,i)=>{const x=x0+sw*(i+0.5);if(t2==='w')water(ctx,x,sy+10,i*0.9,1);else ion(ctx,x,sy+12,t2,1,k);});
  // vapor molecules: evaporate from water slots, condense when they hit the surface
  if(vdt>0){const nw=st.surf.filter(q=>q==='w').length;st.evapT+=vdt*nw*0.55;while(st.evapT>=1){st.evapT-=1;const ws=st.surf.map((q,i)=>q==='w'?i:-1).filter(i=>i>=0);if(!ws.length)break;const j=ws[Math.floor(Math.random()*ws.length)];st.vap.push({x:x0+sw*(j+0.5),y:sy-4,vx:(Math.random()-0.5)*160,vy:-60-Math.random()*120});}
    st.vap.forEach(v=>{v.x+=v.vx*vdt;v.y+=v.vy*vdt;if(v.x<x0+6){v.x=x0+6;v.vx=Math.abs(v.vx);}if(v.x>x1-6){v.x=x1-6;v.vx=-Math.abs(v.vx);}if(v.y<y0+6){v.y=y0+6;v.vy=Math.abs(v.vy);}if(v.y>sy-4)v.dead=Math.random()<0.6;if(v.y>sy-4&&!v.dead){v.y=sy-5;v.vy=-Math.abs(v.vy);}});
    st.vap=st.vap.filter(v=>!v.dead);}
  st.vap.forEach((v,i)=>water(ctx,v.x,v.y,i,0.9));
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.strokeRect(x0,y0,x1-x0,y1-y0);txt(ctx,'Closed flask at 25 °C (zoomed in on the surface)',x0,y0-12,{s:12.5*k,w:700,c:PAL['cv-ink']});
  // bars
  const bx=480,bw=90,by=380,bh=260,P=chi*P0;const bar=(x,v,c,l)=>{const h=v/P0*bh;ctx.fillStyle=c;rr(ctx,x,by-h,bw,h,4);ctx.fill();txt(ctx,v.toFixed(2),x+bw/2,by-h-8,{s:13*k,w:700,a:'center',c:PAL['cv-ink']});txt(ctx,l,x+bw/2,by+20*k,{s:12.5*k,w:700,a:'center',c:PAL['cv-ink']});};
  bar(bx,P0,'#5c8fd6','pure water');bar(bx+bw+40,P,'#c0392b','solution');txt(ctx,'Vapor pressure (mmHg)',bx,62,{s:13*k,w:700,c:PAL['cv-ink']});
  if(hon&&!compact)txt(ctx,'P = χ·P° = '+chi.toFixed(4)+' × 23.76',bx,90,{s:12.5*k,c:PAL['cv-soft']});}

/* ---------- graphs ---------- */
function plotC(sim,ctx,box,id){const p=sim.p,sv=svOf(p);
  if(id==='dt'){const boil=p.view==='boil';const K=boil?0.512:sv.Kf;const keys=['sugar','nacl','cacl2'];const ymax=Math.max(4,3*K*3)*1.05;
    const ax=axes(ctx,box,{xmin:0,xmax:3,ymin:0,ymax:3*K*3*1.05,xl:'Molality (m)',yl:(boil?'ΔTb':'ΔTf')+' (°C)'});const items=[];
    keys.forEach((kk,j)=>{const s=SOL[kk],ii=p.realI?s.ri:s.i;ctx.strokeStyle=serColor(j+1);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0),ax.Y(0));ctx.lineTo(ax.X(3),ax.Y(ii*K*3));ctx.stroke();items.push({label:s.f+' (i = '+ii+')',color:serColor(j+1)});});
    const m=mOf(p),d=iOf(p)*K*m;ctx.strokeStyle=PAL['fg'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(ax.X(Math.min(m,3)),ax.Y(d),8,0,6.29);ctx.stroke();legend(ctx,box.L+12,box.T+10,items);return;}
  if(id==='vp'){const ax=axes(ctx,box,{xmin:0.85,xmax:1,ymin:0,ymax:25,xl:'Mole fraction of water, χ',yl:'Vapor pressure (mmHg)'});ctx.strokeStyle=serColor(1);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax.X(0.85),ax.Y(0.85*P0));ctx.lineTo(ax.X(1),ax.Y(P0));ctx.stroke();
    const c=chiW(p);ctx.strokeStyle=PAL['fg'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(ax.X(Math.max(0.85,c)),ax.Y(c*P0),8,0,6.29);ctx.stroke();legend(ctx,box.L+12,box.T+10,[{label:'Raoult’s law: P = χ × 23.76 mmHg',color:serColor(1)}]);}}

BioLab.register(SIM);
})();
