(function(){
'use strict';
const {clamp,lerp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;

/* Gas stoichiometry lab: collecting a gas over water.
   Lab 1: Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g) in a 50 mL eudiometer (HCl in excess).
   Lab 2: butane from a lighter collected in an inverted 100 mL graduated cylinder.
   The true gas volume comes from PV = nRT for the dry gas: V = n R T / (P_gas − P_water), where P_gas = barometric pressure
   when the water levels inside and outside are equal. Water vapor pressure comes from a standard table (15–30 °C).
   The student-side calculation (what the readouts show) uses the measured numbers, so each error source flows through honestly. */
const R=0.082057,RmmHg=62.364,MMG=24.305,MBU=58.12,STP_VM=22.414;
const PW={15:12.8,16:13.6,17:14.5,18:15.5,19:16.5,20:17.5,21:18.7,22:19.8,23:21.1,24:22.4,25:23.8,26:25.2,27:26.7,28:28.3,29:30.0,30:31.8};
function pw(Tc){const a=Math.floor(clamp(Tc,15,30)),b=Math.min(30,a+1),f=clamp(Tc,15,30)-a;return PW[a]+(PW[b]-PW[a])*f;}
const M0=16.284;          // lighter mass before, g
const RATE=0.035;         // butane released per second of button press, g/s
const CAPM=50,CAPL=100;   // eudiometer and graduated cylinder capacities, mL
const ERRM=[{v:'none',l:'No mistakes'},{v:'vapor',l:'Forgot to subtract water vapor pressure'},{v:'levels',l:'Did not equalize the water levels (inside 12 cm higher)'},{v:'air',l:'Left a 1.5 mL air bubble in the tube'},{v:'oxide',l:'Ribbon had a dull oxide coating (8% MgO)'},{v:'leak',l:'Some H₂ escaped before the tube was sealed (5%)'}];
const ERRL=[{v:'none',l:'No mistakes'},{v:'vapor',l:'Forgot to subtract water vapor pressure'},{v:'wet',l:'Did not dry the lighter before reweighing'},{v:'escape',l:'Some bubbles missed the cylinder (8%)'},{v:'levels',l:'Did not equalize the water levels (inside 12 cm higher)'}];

/* ---------- the experiment, worked out ---------- */
function calc(p){const T=p.Tw+273.15,Pw=pw(p.Tw),mg=p.mode==='mg',err=mg?p.errM:p.errL;
  const dLev=err==='levels'?120/13.6:0;                 // 12 cm of water ≈ 8.8 mmHg
  const Pgas=p.Pbar-dLev,Pdry=Pgas-Pw;                  // real pressure of the collected gas
  const o={T,Pw,mg,err,cap:mg?CAPM:CAPL};
  if(mg){const mMg=p.mgMass,nTrue=mMg*(err==='oxide'?0.92:1)/MMG*(err==='leak'?0.95:1);
    o.mass=mMg;o.nTheo=mMg/MMG;o.Vtrue=nTrue*RmmHg*T/Pdry*1000+(err==='air'?1.5:0);}
  else{const dm=RATE*p.tRel,nTrue=dm/MBU*(err==='escape'?0.92:1);o.m0=M0;o.m1=M0-dm+(err==='wet'?0.030:0);o.dmTrue=dm;o.mass=Math.round((o.m0-o.m1)*1000)/1000;
    o.Vtrue=nTrue*RmmHg*T/Pdry*1000;}
  o.over=o.Vtrue>o.cap;o.Vread=Math.round(Math.min(o.Vtrue,o.cap)*10)/10;
  // what the student calculates from the readings
  o.Pstu=err==='vapor'?p.Pbar:p.Pbar-Pw;
  o.nGas=o.Pstu*o.Vread/1000/(RmmHg*T);
  if(mg){o.VmRoom=o.Vread/1000/o.nTheo;o.Vstp=o.Vread*(o.Pstu/760)*(273.15/T);o.VmSTP=o.Vstp/1000/o.nTheo;o.Rx=(o.Pstu/760)*(o.Vread/1000)/(o.nTheo*T);o.yield=100*o.nGas/o.nTheo;o.errPct=100*(o.VmSTP-STP_VM)/STP_VM;}
  else{o.M=o.mass/o.nGas;o.errPct=100*(o.M-MBU)/MBU;}
  return o;}
const tEnd=p=>p.mode==='mg'?16:p.tRel+3.5;
function prog(sim){const p=sim.p,t=sim.t;if(p.mode==='mg'){if(t<2)return 0;if(t>=14)return 1;const u=(t-2)/12;return 1-Math.pow(1-u,1.6);}
  if(t<1)return 0;return clamp((t-1)/p.tRel,0,1);}
const done=sim=>sim.t>=tEnd(sim.p)-0.01;
const C=sim=>{const s=sim.st;if(!s.c||s.ck!==key(sim.p)){s.c=calc(sim.p);s.ck=key(sim.p);}return s.c;};
const key=p=>[p.mode,p.Tw,p.Pbar,p.mgMass,p.tRel,p.errM,p.errL].join('|');
function Vnow(sim){const c=C(sim);return Math.round(Math.min(c.Vtrue*prog(sim),c.cap)*10)/10;}

/* ---------- show only what the current mode uses ---------- */
function sync(sim){if(!sim.ui||!sim.ui.sec)return;const d=sim.def,p=sim.p;const vis=o=>atLeast(o.lvl)&&(!o.modes||o.modes.includes(p.mode));
  d.controls.forEach(c=>{const cid=d.id+'-'+c.id,e=document.getElementById(cid)||document.getElementById(cid+'-l');if(!e)return;const w=e.closest('.ctl');if(w)w.hidden=!vis(c);});
  d.metrics.forEach(m=>{const t=sim.ui.tiles[m.id];if(!t)return;const w=t.num.closest('.tile');if(w)w.hidden=!vis(m);});}
const fin=(sim,f)=>done(sim)?f(C(sim)):NaN;
/* start the run over without touching the challenge state */
function rerun(sim){sim.t=0;sim.hist=[];sim.lastSample=-1e9;if(sim.vis)sim.vis.bub=[];}

const SIM={
  id:'gasstoich',hash:'gasstoich',apUnit:9,order:3,tab:'Gas stoichiometry lab',kind:'Virtual lab',
  prereq:['gaslaws','stoich'],next:['kmt','airbag'],
  card:'Collect hydrogen from magnesium and butane from a lighter over water, correct for water vapor, and find molar volume, R and molar mass.',
  title:'Gas stoichiometry: collecting a gas over water',
  lede:{bio:'React magnesium with acid and catch the hydrogen gas in an upside-down tube of water. Use the volume of gas to find how much space one mole of gas takes up here, compared with 22.4 L at STP.',
        honors:'The gas you collect over water is a mixture: H₂ plus water vapor. Subtract the water vapor pressure (Dalton’s law), correct to STP, and find the molar mass of butane from a lighter. Then see what each lab mistake does to your answer.',
        ap:'Use your own data to calculate R, percent yield and molar mass, and trace every error source to the direction it moves the result.'},
  scale:'A 50 mL eudiometer (gas-measuring tube) read to 0.1 mL, about 0.03 g of Mg ribbon (3 cm), a 100 mL graduated cylinder and a 0.001 g balance. Time is sped up about 10×. RJ sits about 1650 m above sea level, where the barometer reads near 630 mmHg instead of 760.',
  timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.1,window:20,unit:'s',chChange:0.05,chReveal:17,
  controls:[
    {id:'mode',label:'Lab',type:'seg',def:'mg',lvl:'bio',options:[{v:'mg',l:'Mg + HCl → H₂'},{v:'lighter',l:'Butane lighter'}],onChange(sim){sync(sim);rerun(sim);}},
    {id:'mgMass',label:'Mass of Mg ribbon',type:'range',min:0.010,max:0.050,step:0.001,def:0.030,unit:' g',lvl:'bio',modes:['mg'],help:'About 1 cm of ribbon per 0.01 g. The tube holds 50 mL.',onChange(sim){rerun(sim);}},
    {id:'tRel',label:'Hold the lighter button for',type:'range',min:1,max:6,step:0.5,def:4,unit:' s',lvl:'bio',modes:['lighter'],help:'The cylinder holds 100 mL.',onChange(sim){rerun(sim);}},
    {id:'Tw',label:'Water temperature',type:'range',min:15,max:30,step:0.5,def:22,unit:' °C',lvl:'bio',help:'The gas comes to the temperature of the water.'},
    {id:'Pbar',label:'Barometric pressure',type:'range',min:600,max:780,step:1,def:630,unit:' mmHg',lvl:'bio',help:'Denver-area labs read about 630 mmHg; sea level is 760 mmHg.'},
    {id:'errM',label:'Lab mistake',type:'select',def:'none',lvl:'honors',modes:['mg'],options:ERRM,onChange(sim){rerun(sim);}},
    {id:'errL',label:'Lab mistake',type:'select',def:'none',lvl:'honors',modes:['lighter'],options:ERRL,onChange(sim){rerun(sim);}}
  ],
  init(sim){return {c:null,ck:''};},
  step(sim,dt){},
  metrics:[
    {id:'vol',label:'Gas collected (tube reading)',unit:'mL',lvl:'bio',min:0,max:100,d:1,get:s=>Vnow(s)},
    {id:'mMg',label:'Mass of Mg',unit:'g',lvl:'bio',min:0,max:0.05,d:3,modes:['mg'],get:s=>s.p.mode==='mg'?s.p.mgMass:NaN},
    {id:'nMg',label:'Moles of Mg = moles of H₂ expected',unit:'mol',lvl:'bio',text:true,modes:['mg'],get:s=>s.p.mode==='mg'?CL.sci(s.p.mgMass/MMG,'mol',3):'—'},
    {id:'dm',label:'Mass of butane lost (balance)',unit:'g',lvl:'bio',min:0,max:0.3,d:3,modes:['lighter'],get:s=>s.p.mode==='lighter'?fin(s,c=>c.mass):NaN},
    {id:'VmRoom',label:'Volume of 1 mol of gas here (room T and P)',unit:'L/mol',lvl:'bio',min:0,max:40,d:1,modes:['mg'],get:s=>s.p.mode==='mg'?fin(s,c=>c.VmRoom):NaN},
    {id:'M',label:'Molar mass of butane (your result)',unit:'g/mol',lvl:'bio',min:0,max:100,d:1,modes:['lighter'],get:s=>s.p.mode==='lighter'?fin(s,c=>c.M):NaN},
    {id:'Pw',label:'Water vapor pressure (table)',unit:'mmHg',lvl:'honors',min:0,max:35,d:1,get:s=>pw(s.p.Tw)},
    {id:'Pdry',label:'Pressure of the dry gas you used',unit:'mmHg',lvl:'honors',min:0,max:800,d:1,get:s=>C(s).Pstu},
    {id:'nGas',label:'Moles of gas from PV = nRT',unit:'mol',lvl:'honors',text:true,get:s=>done(s)?CL.sci(C(s).nGas,'mol',3):'—'},
    {id:'VmSTP',label:'Molar volume corrected to STP',unit:'L/mol',lvl:'honors',min:0,max:30,d:2,modes:['mg'],get:s=>s.p.mode==='mg'?fin(s,c=>c.VmSTP):NaN},
    {id:'err',label:'Percent error',unit:'%',lvl:'honors',min:-30,max:30,d:1,get:s=>fin(s,c=>c.errPct)},
    {id:'Rx',label:'R from your data',unit:'L·atm/(mol·K)',lvl:'ap',min:0,max:0.1,d:4,modes:['mg'],get:s=>s.p.mode==='mg'?fin(s,c=>c.Rx):NaN},
    {id:'yield',label:'Percent yield of H₂',unit:'%',lvl:'ap',min:0,max:120,d:1,modes:['mg'],get:s=>s.p.mode==='mg'?fin(s,c=>c.yield):NaN}
  ],
  graphs:[{id:'vol',label:'Gas collected over time',lvl:'bio',lines:['vol']},{id:'cmp',label:'Your result vs the accepted value',lvl:'bio',custom:true}],
  defaultGraph:'vol',
  plot(sim,ctx,box,id){const p=sim.p,c=C(sim);
    if(!done(sim)){txt(ctx,'Let the experiment finish to compare your result.',box.cw/2,box.ch/2,{s:15,c:PAL['muted'],a:'center',b:'middle'});return;}
    const mg=p.mode==='mg';const cats=mg?['22.4 L at STP','Yours at STP','Yours at room']:['Butane (accepted)','Your result'];const vals=mg?[STP_VM,c.VmSTP,c.VmRoom]:[MBU,c.M];
    const ax=axes(ctx,box,{xmin:0,xmax:cats.length,ymin:0,ymax:Math.max(...vals)*1.25,xcats:cats,yl:mg?'Molar volume (L/mol)':'Molar mass (g/mol)'});
    vals.forEach((v,i)=>{ctx.fillStyle=i===0?PAL['muted']:serColor(i);ctx.fillRect(ax.X(i+0.22),ax.Y(v),ax.X(0.56)-ax.X(0),ax.Y(0)-ax.Y(v));txt(ctx,v.toFixed(mg?2:1),ax.X(i+0.5),ax.Y(v)-6,{s:13,w:700,a:'center',c:PAL['fg']});});},
  infoPanel(sim){return panel(sim);},
  narrate(sim){return narr(sim);},
  tour:[
    {title:'The setup',text:'The eudiometer (a long gas-measuring tube) was filled with hydrochloric acid and then water, flipped upside down into a tall tank of water, and stoppered with a coil of magnesium ribbon in a copper cage.',focus:[40,30,300,410],speed:0.5,pause:true,setup(sim){BioLab.setValues(sim,{mode:'mg',mgMass:0.03,Tw:22,Pbar:630,errM:'none'});BioLab.reset(sim);}},
    {title:'The acid sinks',text:'The acid is denser than water, so it sinks down the tube toward the magnesium at the bottom. That is why the reaction waits a moment before it starts.',focus:[130,30,90,390],speed:0.6},
    {title:'Hydrogen bubbles',text:'Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g). Bubbles of hydrogen rise and push water out of the tube. The acid is in excess, so the magnesium decides how much H₂ forms: 1 mol of Mg gives 1 mol of H₂.',focus:[[130,30,90,390],[420,14,375,36]],speed:0.6,setup(sim){if(sim.t<5)sim.t=5;}},
    {title:'The gas is a mixture',text:{bio:'The gas in the tube is mostly hydrogen, with a little water vapor from the water below it.',honors:'Dalton’s law: P_total = P(H₂) + P(H₂O). At 22 °C water vapor adds 19.8 mmHg, so the hydrogen’s own pressure is 630 − 19.8 = 610.2 mmHg.'},focus:[470,45,170,170],speed:0.6},
    {title:'Read the volume',text:'When the bubbling stops, the water inside the tube is set level with the water outside. Then the gas inside is at the same pressure as the room, and you read the volume at the bottom of the meniscus to 0.1 mL.',focus:[[130,30,90,390],[420,232,375,214]],speed:1,setup(sim){if(sim.t<16)sim.t=16;}},
    {title:'From grams to liters per mole',text:{bio:'0.030 g of Mg is 0.00123 mol, so the tube holds 0.00123 mol of H₂. Divide the volume by the moles: about 30 L/mol here, not 22.4 L, because RJ’s air pressure is low and the room is warmer than 0 °C.',honors:'Correct the dry-gas volume to STP with P₁V₁/T₁ = P₂V₂/T₂, then divide by moles of Mg. You should land close to 22.4 L/mol.'},focus:[420,232,375,214],speed:1,pause:true},
    {title:'Lab 2: the butane lighter',text:'Weigh a lighter, release butane underwater into an upside-down graduated cylinder, then dry and reweigh it. Mass lost ÷ moles of gas (from PV = nRT) gives the molar mass of butane, C₄H₁₀ = 58.12 g/mol.',focus:[0,30,800,420],speed:1,setup(sim){BioLab.setValues(sim,{mode:'lighter',tRel:4,errL:'none'});BioLab.reset(sim);}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{mode:'mg',mgMass:0.03,tRel:4,Tw:22,Pbar:630,errM:'none',errL:'none'});BioLab.reset(sim);},
  challenges(sim){return chList();},
  onLevel(sim){sync(sim);},
  lab:{bio:'<p><b>Safety:</b> goggles on. Hydrochloric acid is corrosive, and hydrogen and butane are flammable, so keep flames away.</p><p><b>Question:</b> How much space does one mole of gas take up at RJ’s room conditions?</p><ol><li>Run the Mg + HCl lab with 0.020, 0.030 and 0.040 g of Mg. Record a trial when each finishes.</li><li>For each trial, divide the gas volume (in L) by the moles of Mg.</li><li>Compare your answer with 22.4 L/mol at STP.</li></ol><p>Why is the volume per mole bigger here than at STP? Use the barometer and the temperature in your answer.</p>',
       honors:'<p><b>Safety:</b> goggles on. HCl is corrosive; H₂ and butane are flammable.</p><p><b>Question:</b> Can you find the molar volume at STP and the molar mass of butane from gas collected over water?</p><ol><li>Mg + HCl: record a trial with no mistakes. Subtract the water vapor pressure from the barometric pressure, correct the volume to STP, and divide by moles of Mg.</li><li>Butane lighter: record the mass lost and the gas volume, find moles with PV = nRT, then mass ÷ moles.</li><li>Choose each lab mistake in turn and record a trial.</li></ol><p>For each mistake, say whether it made your result too high or too low, and explain why.</p>',
       ap:'<p><b>Safety:</b> goggles on. HCl is corrosive; H₂ and butane are flammable.</p><p><b>Question:</b> How well does your gas-collection data reproduce R?</p><ol><li>Run Mg + HCl at water temperatures of 16, 20, 24 and 28 °C. Record each trial.</li><li>From each, calculate R = PV/nT using the dry-gas pressure and moles of Mg.</li><li>Repeat one trial with the oxide-coated ribbon.</li></ol><p><b>Claim–evidence–reasoning:</b> Report R with its percent error, and explain how an oxide coating changes the percent yield and the calculated R.</p>'},
  terms:[{t:'Eudiometer',d:'A long, graduated gas-measuring tube, closed at one end, used to collect gas over water.'},{t:'Molar volume',d:'The volume of one mole of gas. 22.4 L at STP (0 °C, 1 atm); larger at room temperature or lower pressure.'},
    {t:'STP',d:'Standard temperature and pressure: 273 K (0 °C) and 1 atm (760 mmHg).'},{t:'Barometric pressure',d:'The air pressure in the room, read from a barometer.'},
    {lvl:'honors',t:'Dalton’s law of partial pressures',d:'The total pressure of a gas mixture is the sum of each gas’s partial pressure.'},{lvl:'honors',t:'Water vapor pressure',d:'The pressure of water vapor in a gas collected over water. It depends only on temperature (19.8 mmHg at 22 °C).'},
    {lvl:'honors',t:'Percent error',d:'(your value − accepted value) ÷ accepted value × 100.'},{lvl:'ap',t:'Percent yield',d:'Actual yield ÷ theoretical yield × 100.'},{lvl:'ap',t:'Ideal gas constant (R)',d:'0.08206 L·atm/(mol·K) = 62.36 L·mmHg/(mol·K) = 8.314 J/(mol·K).'}],
  about:'<p>The model works out the true volume of dry gas from PV = nRT at the water temperature, with the gas pressure equal to the barometric pressure minus the water vapor pressure (from a standard table, 12.8 mmHg at 15 °C to 31.8 mmHg at 30 °C). HCl is in excess, so Mg is the limiting reactant. Butane leaves the lighter at a steady 0.035 g/s. Volumes are read to the nearest 0.1 mL and masses to 0.001 g, and every “your result” readout is calculated from those readings, the way you would in lab.</p><p>Mistakes and what they change: not subtracting vapor pressure raises the pressure you use; a 12 cm water column inside the tube lowers the gas pressure by 120 mm ÷ 13.6 = 8.8 mmHg, so the gas expands; a leftover air bubble adds 1.5 mL; an oxide coating means 8% of the ribbon’s mass is MgO, which makes no H₂; a leak loses 5% of the H₂; a wet lighter keeps 0.030 g of water; missed bubbles lose 8% of the butane. If the gas overflows the tube or cylinder, you can only read the full mark.</p><p>Simplified: gases are ideal, the gas instantly takes the water temperature, and gases do not dissolve in the water (a little butane really does). Lighter fluid is mostly butane and isobutane (both 58.12 g/mol), sometimes with some propane, so real class results often land a bit below 58. Time is sped up about 10×.</p>',
  initVis(sim){sim.vis.bub=[];},
  draw(sim,ctx,vdt,k,t){drawLab(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.t=9;},thumbFrames:4
};

/* ---------- challenges (numbers come from the model) ---------- */
function chList(){const base={Tw:22,Pbar:630,mgMass:0.03,tRel:4,errM:'none',errL:'none'};
  const P=o=>Object.assign({},base,o),c=o=>calc(P(o));
  const a=c({mode:'mg',mgMass:0.02}),b=c({mode:'mg',mgMass:0.04}),cold=c({mode:'mg',Tw:15}),hot=c({mode:'mg',Tw:30});
  const ok=c({mode:'mg'}),vap=c({mode:'mg',errM:'vapor'}),air=c({mode:'mg',errM:'air'}),ox=c({mode:'mg',errM:'oxide'});
  const L4=c({mode:'lighter'}),L6=c({mode:'lighter',tRel:6}),Lw=c({mode:'lighter',errL:'wet'});
  const vm=0.08206*295.15/(630/760);
  return [
  {lvl:'bio',q:'You double the magnesium from 0.020 g to 0.040 g, with the same amount of acid. What happens to the volume of H₂?',choices:['It doubles','It stays the same, because the acid is the same','It becomes four times bigger'],correct:0,
   baseline:P({mode:'mg',mgMass:0.02}),change:{mgMass:0.04},changeText:'Rerun with 0.040 g of Mg',watch:'vol',
   explain:{bio:'The acid is in excess, so the magnesium sets the amount of H₂: 1 mol Mg → 1 mol H₂. Twice the Mg made twice the gas: '+a.Vread.toFixed(1)+' mL became '+b.Vread.toFixed(1)+' mL.'}},
  {lvl:'bio',q:'In RJ’s lab (630 mmHg, 22 °C), how much space does 1 mol of gas take up?',choices:['Exactly 22.4 L, like always','More than 22.4 L, about 29 L','Less than 22.4 L'],correct:1,instant:true,
   explain:{bio:'22.4 L is only true at STP (0 °C and 760 mmHg). RJ’s air pressure is lower and the room is warmer, so the gas spreads out more: V = RT/P = (0.08206)(295 K)/(630/760 atm) = '+vm.toFixed(1)+' L per mole.'}},
  {lvl:'bio',q:'You repeat the Mg lab with the same ribbon mass, but the water is 30 °C instead of 15 °C. What happens to the gas volume?',choices:['It gets bigger','It gets smaller','It stays the same, because the moles are the same'],correct:0,
   baseline:P({mode:'mg',Tw:15}),change:{Tw:30},changeText:'Rerun with 30 °C water',watch:'vol',
   explain:{bio:'Warmer gas takes up more space (Charles’s law), and warmer water adds more water vapor to the tube. The volume grew from '+cold.Vread.toFixed(1)+' mL to '+hot.Vread.toFixed(1)+' mL even though the moles of H₂ did not change.'}},
  {lvl:'honors',q:'You forget to subtract the water vapor pressure. How does your molar volume at STP compare with 22.4 L/mol?',choices:['Too high','Too low','Unaffected'],correct:0,
   baseline:P({mode:'mg'}),change:{errM:'vapor'},changeText:'Calculated without subtracting water vapor',watch:'cmp',
   explain:{honors:'You used 630 mmHg instead of 610.2 mmHg for the hydrogen, so correcting to STP gives too large a volume: '+vap.VmSTP.toFixed(2)+' L/mol instead of '+ok.VmSTP.toFixed(2)+' L/mol ('+vap.errPct.toFixed(1)+'% error).'}},
  {lvl:'honors',q:'You forget to dry the lighter before reweighing it. How does your molar mass of butane come out?',choices:['Too high','Too low','Unaffected, because the gas volume is the same'],correct:1,
   baseline:P({mode:'lighter'}),change:{errL:'wet'},changeText:'Lighter reweighed while still wet',watch:'cmp',
   explain:{honors:'Water clinging to the lighter makes it weigh more at the end, so the mass of butane lost looks smaller ('+Lw.mass.toFixed(3)+' g instead of '+L4.mass.toFixed(3)+' g). Same moles, less mass: '+Lw.M.toFixed(1)+' g/mol instead of '+L4.M.toFixed(1)+' g/mol.'}},
  {lvl:'honors',q:'You hold the lighter button for 6 s instead of 4 s. What happens to your molar mass result?',choices:['Nothing: more gas and more mass, so the ratio is the same','The cylinder overflows, so you miss some gas and the molar mass comes out too high','It comes out too low'],correct:1,
   baseline:P({mode:'lighter',tRel:4}),change:{tRel:6},changeText:'Button held for 6 s',watch:'vol',
   explain:{honors:'6 s releases '+L6.mass.toFixed(3)+' g, enough to make '+L6.Vtrue.toFixed(0)+' mL of gas, but the cylinder holds only 100 mL. The balance counts all the lost mass while you can only measure 100 mL, so moles are too small and M is too big: '+L6.M.toFixed(1)+' g/mol.'}},
  {lvl:'ap',q:'Run with 0.030 g Mg, 22.0 °C, 630 mmHg, and read '+ok.Vread.toFixed(1)+' mL. What value of R do these data give?',choices:[ok.Rx.toFixed(4)+' L·atm/(mol·K)',vap.Rx.toFixed(4)+' L·atm/(mol·K)',(ok.Rx*760).toFixed(1)+' L·atm/(mol·K)'],correct:0,instant:true,
   explain:{ap:'R = PV/nT with P(H₂) = (630 − 19.8)/760 = '+(ok.Pstu/760).toFixed(4)+' atm, V = '+(ok.Vread/1000).toFixed(4)+' L, n = 0.030/24.305 = '+ok.nTheo.toExponential(3)+' mol and T = 295.15 K, giving '+ok.Rx.toFixed(4)+'. '+vap.Rx.toFixed(4)+' comes from skipping the vapor correction; '+(ok.Rx*760).toFixed(1)+' is R in L·mmHg mislabeled as atm.'}},
  {lvl:'ap',q:'Your Mg ribbon was dull and coated with oxide. What happens to the percent yield of H₂?',choices:['Below 100%, because MgO reacts with acid but makes no H₂','Above 100%, because the oxide adds mass','Exactly 100%: Mg is still limiting'],correct:0,
   baseline:P({mode:'mg'}),change:{errM:'oxide'},changeText:'Rerun with oxide-coated ribbon',watch:'cmp',
   explain:{ap:'MgO + 2HCl → MgCl₂ + H₂O makes no gas, but its mass was counted as Mg. Yield fell to '+ox.yield.toFixed(1)+'% and the molar volume at STP to '+ox.VmSTP.toFixed(2)+' L/mol.'}},
  {lvl:'ap',q:'A 1.5 mL air bubble was left in the tube before the reaction. How does your molar volume at STP compare with 22.4 L/mol?',choices:['Too low','Too high','Unaffected, because air is not H₂'],correct:1,
   baseline:P({mode:'mg'}),change:{errM:'air'},changeText:'Rerun with an air bubble trapped in the tube',watch:'cmp',
   explain:{ap:'The bubble adds to the volume you read, but you divide by the same moles of Mg: '+air.VmSTP.toFixed(2)+' L/mol instead of '+ok.VmSTP.toFixed(2)+' L/mol, and the percent yield appears to be '+air.yield.toFixed(1)+'%.'}}];}

/* ---------- narration and the worked-out panel ---------- */
function narr(sim){const p=sim.p,c=C(sim),t=sim.t,hon=atLeast('honors');
  if(p.mode==='mg'){
    if(t<2)return 'The acid is denser than water, so it is sinking down the tube toward the magnesium coil at the bottom.';
    if(t<14)return 'Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g). Each magnesium atom that dissolves releases one H₂ molecule, so the gas volume grows as the ribbon shrinks: <b>'+Vnow(sim).toFixed(1)+' mL</b> so far.'+(c.over&&Vnow(sim)>=CAPM-0.05?' The tube is full and gas is escaping out the bottom.':'');
    if(c.over)return '<b>The tube overflowed.</b> '+c.Vtrue.toFixed(1)+' mL of gas formed, but the eudiometer only holds 50 mL, so some H₂ bubbled away. Use less magnesium.';
    let s='All '+p.mgMass.toFixed(3)+' g of Mg reacted and the tube holds <b>'+c.Vread.toFixed(1)+' mL</b> of gas: about '+c.VmRoom.toFixed(1)+' L per mole at '+p.Pbar+' mmHg and '+p.Tw.toFixed(1)+' °C.';
    if(hon)s+=c.err==='vapor'?' You used the full barometric pressure for the H₂, but part of it is water vapor.':c.err==='levels'?' The water inside is 12 cm higher than outside, so the gas is at '+(p.Pbar-8.8).toFixed(1)+' mmHg, not '+p.Pbar+'.':' Corrected to STP that is '+c.VmSTP.toFixed(2)+' L/mol.';
    return s;}
  const rel=t>=1&&t<1+p.tRel;
  if(t<1)return 'The lighter sits on the balance: '+M0.toFixed(3)+' g. Next it goes under the water, beneath the mouth of the upside-down cylinder.';
  if(rel)return 'Butane bubbles up and pushes water out of the cylinder: <b>'+Vnow(sim).toFixed(1)+' mL</b> so far.'+(Vnow(sim)>=CAPL-0.05?' The cylinder is full and gas is escaping.':'');
  if(!done(sim))return 'The lighter is dried off and weighed again.';
  if(c.over)return '<b>The cylinder overflowed.</b> The balance counts all '+c.mass.toFixed(3)+' g of butane lost, but you can only measure 100 mL of gas, so your molar mass ('+c.M.toFixed(1)+' g/mol) comes out too high.';
  return 'The lighter lost <b>'+c.mass.toFixed(3)+' g</b> and you collected '+c.Vread.toFixed(1)+' mL of gas. Moles from PV = nRT give a molar mass of <b>'+c.M.toFixed(1)+' g/mol</b> (butane, C₄H₁₀, is 58.12).';}
function panel(sim){const p=sim.p,c=C(sim),hon=atLeast('honors'),ap=atLeast('ap'),d=done(sim);
  const row=(a,b)=>`<tr><td style="text-align:left">${a}</td><td>${b}</td></tr>`;let h='<h3>Your calculation</h3>';
  if(!d)return h+'<p class="help">The numbers fill in when the experiment finishes.</p>'+(hon?vaporTable(p):'');
  const T=c.T.toFixed(2),Pst=c.Pstu.toFixed(1);
  let rows='';
  if(p.mode==='mg'){rows+=row('Moles of H₂ expected = moles of Mg',`${p.mgMass.toFixed(3)} g ÷ 24.305 g/mol = ${c.nTheo.toExponential(3)} mol`);
    rows+=row('Gas volume',`${c.Vread.toFixed(1)} mL = ${(c.Vread/1000).toFixed(4)} L`);
    rows+=row('Volume per mole (room)',`${(c.Vread/1000).toFixed(4)} L ÷ ${c.nTheo.toExponential(3)} mol = ${c.VmRoom.toFixed(1)} L/mol`);
    if(hon){rows+=row('P(H₂) = P(bar) − P(H₂O)',c.err==='vapor'?`${p.Pbar} mmHg (vapor not subtracted)`:`${p.Pbar} − ${c.Pw.toFixed(1)} = ${Pst} mmHg`);
      rows+=row('V at STP = V × (P/760) × (273.15/T)',`${c.Vread.toFixed(1)} × (${Pst}/760) × (273.15/${T}) = ${c.Vstp.toFixed(1)} mL`);
      rows+=row('Molar volume at STP',`${c.VmSTP.toFixed(2)} L/mol (${c.errPct>=0?'+':''}${c.errPct.toFixed(1)}%)`);}
    if(ap){rows+=row('R = PV/nT',`${c.Rx.toFixed(4)} L·atm/(mol·K)`);rows+=row('Percent yield',`${c.nGas.toExponential(3)} ÷ ${c.nTheo.toExponential(3)} = ${c.yield.toFixed(1)}%`);}}
  else{rows+=row('Mass lost',`${M0.toFixed(3)} − ${c.m1.toFixed(3)} = ${c.mass.toFixed(3)} g`);rows+=row('Gas volume',`${c.Vread.toFixed(1)} mL`);
    rows+=row(hon?'P(butane) = P(bar) − P(H₂O)':'Pressure of the butane',c.err==='vapor'?`${p.Pbar} mmHg (vapor not subtracted)`:`${p.Pbar} − ${c.Pw.toFixed(1)} = ${Pst} mmHg`);
    rows+=row('n = PV/RT',`(${Pst})(${(c.Vread/1000).toFixed(4)}) ÷ (62.36 × ${T}) = ${c.nGas.toExponential(3)} mol`);
    rows+=row('Molar mass = mass ÷ moles',`${c.M.toFixed(1)} g/mol${hon?' ('+(c.errPct>=0?'+':'')+c.errPct.toFixed(1)+'%)':''}`);}
  h+=`<div class="tbl-wrap"><table><tbody>${rows}</tbody></table></div>`;if(hon)h+=vaporTable(p);return h;}
function vaporTable(p){const a=Math.floor(p.Tw);const rows=[a-1,a,a+1,a+2].filter(x=>x>=15&&x<=30).map(x=>`<tr${x===a?' style="font-weight:700"':''}><td>${x} °C</td><td>${PW[x].toFixed(1)} mmHg</td></tr>`).join('');
  return `<p class="help" style="margin-top:10px">Water vapor pressure table (your water: ${p.Tw.toFixed(1)} °C → ${pw(p.Tw).toFixed(1)} mmHg)</p><div class="tbl-wrap"><table><tbody>${rows}</tbody></table></div>`;}

/* ---------- drawing ---------- */
function zoom(ctx,cx,cy,r,k,kind,t,label){ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.fillStyle=PAL['card'];ctx.fill();ctx.clip();
  const n=kind==='H2'?26:13;for(let i=0;i<n;i++){const a=i*2.399+t*0.25*(i%2?1:-1),rr2=Math.sqrt((i+0.5)/n)*(r-14);const x=cx+Math.cos(a)*rr2,y=cy+Math.sin(a)*rr2,ang=i*1.3+t*(0.6+(i%3)*0.3);
    if(i===7||i===(kind==='H2'?19:11)){CL.drawAtom(ctx,x,y,7,'O',{label:''});CL.drawAtom(ctx,x+Math.cos(ang)*8,y+Math.sin(ang)*8,4.5,'H',{label:''});CL.drawAtom(ctx,x+Math.cos(ang+1.82)*8,y+Math.sin(ang+1.82)*8,4.5,'H',{label:''});}
    else if(kind==='H2'){CL.drawAtom(ctx,x-Math.cos(ang)*3.5,y-Math.sin(ang)*3.5,5,'H',{label:''});CL.drawAtom(ctx,x+Math.cos(ang)*3.5,y+Math.sin(ang)*3.5,5,'H',{label:''});}
    else{for(let j=0;j<4;j++){const ox=(j-1.5)*6,oy=(j%2?3:-3);const c=Math.cos(ang),s=Math.sin(ang);CL.drawAtom(ctx,x+ox*c-oy*s,y+ox*s+oy*c,4.6,'C',{label:''});}}}
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.stroke();
  txt(ctx,label,cx,cy+r+18*k,{s:12.5*k,w:700,a:'center',c:PAL['cv-ink']});}
function notebook(ctx,x,y,w,h,rows,k){rr(ctx,x,y,w,h,10);ctx.fillStyle=PAL['card'];ctx.fill();ctx.strokeStyle=PAL['line'];ctx.lineWidth=1;ctx.stroke();
  txt(ctx,'Lab notebook',x+12,y+20*k,{s:13*k,w:700,c:PAL['cv-ink']});const lh=Math.min(26*k,(h-30*k)/rows.length);
  rows.forEach((r,i)=>{const yy=y+30*k+lh*(i+0.75);txt(ctx,r[0],x+12,yy,{s:12.5*k,c:PAL['cv-soft']});txt(ctx,r[1],x+w-12,yy,{s:12.5*k,w:700,c:PAL['cv-ink'],a:'right'});});}
function tube(ctx,x0,w,yTop,yMouth,pxml,cap,V,k,labEvery,compact){// inverted, graduated from the closed top
  const yIn=yTop+pxml*V;
  ctx.fillStyle=PAL['card'];ctx.fillRect(x0,yTop,w,yIn-yTop);
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(x0,yIn,w,yMouth-yIn);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1;for(let v=0;v<=cap;v+=1){if(cap>60&&v%2)continue;const y=yTop+pxml*v,L=v%labEvery===0?14:v%5===0?9:5;ctx.beginPath();ctx.moveTo(x0+w,y);ctx.lineTo(x0+w-L,y);ctx.stroke();}
  for(let v=0;v<=cap;v+=labEvery*(compact?2:1))txt(ctx,String(v),x0-6,yTop+pxml*v+4,{s:12*k,c:PAL['cv-ink'],a:'right',w:600});
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x0,yMouth);ctx.lineTo(x0,yTop+8);ctx.quadraticCurveTo(x0,yTop-6,x0+w/2,yTop-6);ctx.quadraticCurveTo(x0+w,yTop-6,x0+w,yTop+8);ctx.lineTo(x0+w,yMouth);ctx.stroke();
  // meniscus (curves down at the center when viewed from the side of an upside-down tube's water surface: water wets glass)
  ctx.strokeStyle=PAL['s2'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,yIn-3);ctx.quadraticCurveTo(x0+w/2,yIn+4,x0+w,yIn-3);ctx.stroke();return yIn;}
function bubbles(sim,ctx,x,yFrom,yTo,on,vdt,col){const B=sim.vis.bub||(sim.vis.bub=[]);if(on&&!RM&&Math.random()<vdt*30)B.push({x:x+(Math.random()-0.5)*14,y:yFrom,r:2+Math.random()*3});
  ctx.strokeStyle=col;ctx.lineWidth=1.5;for(const b of B){b.y-=vdt*(90+b.r*20);ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.2832);ctx.stroke();}sim.vis.bub=B.filter(b=>b.y>yTo);}
function drawLab(sim,ctx,vdt,k,t){const p=sim.p,c=C(sim),compact=k>1.3,hon=atLeast('honors'),V=Vnow(sim),d=done(sim);
  ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);const tt=sim.t;
  if(p.mode==='mg'){const x0=150,w=50,yTop=48,px=6.4,yM=400;const yIn=yTop+px*V;const yOut=yIn+(c.err==='levels'&&tt>14?42:0);
    // tank of water, level matched to the tube
    ctx.fillStyle=PAL['cv-water'];ctx.fillRect(56,Math.min(yOut,yM-10),268,436-Math.min(yOut,yM-10));ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(56,30);ctx.lineTo(56,436);ctx.lineTo(324,436);ctx.lineTo(324,30);ctx.stroke();
    tube(ctx,x0,w,yTop,yM,px,CAPM,V,k,10,compact);
    // acid: sinks, then spreads through the tube
    const af=clamp(tt/2,0,1);ctx.fillStyle='rgba(233,30,99,'+(0.18-0.08*af)+')';const ay=lerp(yTop,yIn,0)+(yM-yIn)*af*0.85;ctx.fillRect(x0+2,Math.max(yIn,ay-40-af*200),w-4,Math.min(60+af*260,yM-Math.max(yIn,ay-40-af*200)));
    // stopper, cage and ribbon
    ctx.fillStyle='#5d4037';rr(ctx,x0-6,yM,w+12,22,4);ctx.fill();ctx.strokeStyle='#b87333';ctx.lineWidth=2;ctx.strokeRect(x0+14,yM-40,22,36);
    const left=1-prog(sim)*(c.err==='oxide'?1:1);if(left>0.01){ctx.strokeStyle='#9ea7ad';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<=20;i++){const yy=yM-6-i*1.6*left*1.0;const xx=x0+25+Math.sin(i*1.4)*7*Math.sqrt(left);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();}
    bubbles(sim,ctx,x0+25,yM-40,yIn+4,tt>2&&tt<14,vdt,PAL['cv-bstroke']);
    if(c.err==='levels'&&tt>14){pill(ctx,'levels not equal',255,yOut-16,'#c62828','#fff',12*k);}
    pill(ctx,V.toFixed(1)+' mL',x0+w+48*Math.min(k,1.4),Math.max(yTop+20,yIn),PAL['cv-ink'],PAL['card'],13*k);
    if(c.over&&V>=CAPM-0.05&&tt<14)pill(ctx,'tube full: gas escaping',x0+w/2,yM+40,'#c62828','#fff',12*k);
    // equation, zoom, notebook
    txt(ctx,compact?'Mg + 2HCl → MgCl₂ + H₂':'Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)',430,30,{s:14*k,w:700,c:PAL['cv-ink']});
    ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([4,4]);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0+w,yTop+Math.max(8,(yIn-yTop)/2));ctx.lineTo(486,124);ctx.stroke();ctx.setLineDash([]);
    zoom(ctx,556,124,68,k,'H2',tt,hon?'H₂ + a little H₂O vapor':'Mostly H₂, a little water vapor');
    const rows=[['Mg mass',p.mgMass.toFixed(3)+' g'],['Gas volume',d?c.Vread.toFixed(1)+' mL':'…'],['Water temp',p.Tw.toFixed(1)+' °C'],['Barometer',p.Pbar+' mmHg']];
    if(hon&&!compact)rows.push(['H₂O vapor',c.Pw.toFixed(1)+' mmHg'],['P of dry H₂',c.Pstu.toFixed(1)+' mmHg']);
    notebook(ctx,420,236,370,208,rows,k);return;}
  // ---- butane lighter ----
  const x0=318,w=56,yTop=50,px=3.0,yM=380,rel=tt>=1&&tt<1+p.tRel;const yIn=yTop+px*V;const yOut=yIn+(c.err==='levels'&&d?42:0);
  ctx.fillStyle=PAL['cv-water'];ctx.fillRect(220,Math.min(yOut,yM-10),252,436-Math.min(yOut,yM-10));ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(220,30);ctx.lineTo(220,436);ctx.lineTo(472,436);ctx.lineTo(472,30);ctx.stroke();
  tube(ctx,x0,w,yTop,yM,px,CAPL,V,k,20,compact);
  pill(ctx,V.toFixed(1)+' mL',x0+w+48*Math.min(k,1.4),Math.max(yTop+20,yIn),PAL['cv-ink'],PAL['card'],13*k);
  if(c.err==='levels'&&d)pill(ctx,'levels not equal',400,yOut-16,'#c62828','#fff',12*k);
  // balance
  const bx=36,by=360;ctx.fillStyle='#6d7a88';rr(ctx,bx,by,150,62,8);ctx.fill();rr(ctx,bx+12,by+30,126,24,4);ctx.fillStyle='#1b2a30';ctx.fill();ctx.fillStyle='#9aa3ad';rr(ctx,bx+20,by-8,110,10,3);ctx.fill();
  const shown=tt<1?M0:d?c.m1:null;txt(ctx,shown===null?'- - -':shown.toFixed(3)+' g',bx+75,by+48,{s:15*k,w:700,c:'#8ef0b4',a:'center'});
  // lighter: on the balance before and after, under the cylinder while releasing
  const lx=rel?x0+w/2:bx+75,ly=rel?yM+40:by-36;ctx.fillStyle='#1e88e5';rr(ctx,lx-14,ly-26,28,52,6);ctx.fill();ctx.fillStyle='#b0bec5';ctx.fillRect(lx-12,ly-34,24,10);
  if(d&&c.err==='wet'){ctx.fillStyle=PAL['cv-water'];ctx.strokeStyle=PAL['cv-bstroke'];[[-8,-6],[6,4],[-4,14]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(lx+dx,ly+dy,3,0,6.28);ctx.fill();ctx.stroke();});}
  bubbles(sim,ctx,x0+w/2,yM+10,yIn+4,rel,vdt,PAL['cv-bstroke']);
  if(!compact)txt(ctx,'C₄H₁₀(l) → C₄H₁₀(g)',36,30,{s:14*k,w:700});
  zoom(ctx,620,100,62,k,'bu',tt,hon?'Butane + a little H₂O vapor':'Butane gas, a little water vapor');
  const rows=[['Mass before',M0.toFixed(3)+' g'],['Mass after',d?c.m1.toFixed(3)+' g':'…'],['Gas volume',d?c.Vread.toFixed(1)+' mL':'…'],['Water temp',p.Tw.toFixed(1)+' °C'],['Barometer',p.Pbar+' mmHg']];
  if(hon&&!compact)rows.push(['H₂O vapor',c.Pw.toFixed(1)+' mmHg']);
  notebook(ctx,494,214,296,230,rows,k);}

BioLab.register(SIM);
})();
