(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,axes,legend,serColor}=BioLab.h;
const CL=window.ChemLab;
const TS=[0,10,20,30,40,50,60,70,80,90,100];
/* Solutes. sol: g per 100 g water (CRC). lam: limiting molar conductivity of the ions, S·cm²/mol (25 °C).
   Q: drawn particles per mol in the zoom (so the scale label can be honest). */
const SOLS={
  NaCl:{name:'Table salt',f:'NaCl',kind:'ionic',sol:[35.7,35.8,36.0,36.3,36.6,37.0,37.3,37.8,38.4,39.0,39.8],lam:50.1+76.3,max:60,def:20,Q:26,cap:22,
    cat:{l:'Na⁺',c:'#9b59d0',r:8},an:{l:'Cl⁻',c:'#2fae4e',r:13}},
  sugar:{name:'Table sugar (sucrose)',f:'C12H22O11',kind:'molec',sol:[179,190,204,219,238,260,287,320,362,415,487],max:400,def:100,Q:26,cap:36},
  oil:{name:'Vegetable oil',f:'C57H104O6',kind:'oil',max:30,def:10,Q:26,cap:14},
  ethanol:{name:'Ethanol',f:'C2H5OH',kind:'misc',max:30,def:10,Q:26,cap:30},
  acetic:{name:'Acetic acid (vinegar)',f:'HC2H3O2',kind:'weak',Ka:1.8e-5,lam:349.8+40.9,max:30,def:6.0,Q:200,cap:26,lvl:'honors'},
  HCl:{name:'Hydrogen chloride',f:'HCl',kind:'strong',lam:349.8+76.3,max:10,def:3.6,Q:200,cap:20,lvl:'honors',
    cat:{l:'H₃O⁺',c:'#c2185b',r:9},an:{l:'Cl⁻',c:'#2fae4e',r:13}}};
Object.keys(SOLS).forEach(k=>{const s=SOLS[k];s.M=CL.molarMass(s.f);s.label=CL.fmt(s.f);if(s.sol)s.fn=mkCurve(TS,s.sol);});
const SIZE={crystal:{f:1,l:'One big crystal'},granules:{f:3.5,l:'Granules'},powder:{f:12,l:'Fine powder'}};
const K0=0.2;            // dissolving rate constant, g^(1/3)/s for one crystal, unstirred, 25 °C
function mkCurve(xs,ys){const n=xs.length,d=[],m=new Array(n);for(let i=0;i<n-1;i++)d[i]=(ys[i+1]-ys[i])/(xs[i+1]-xs[i]);
  m[0]=d[0];m[n-1]=d[n-2];for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
  for(let i=0;i<n-1;i++){if(d[i]===0){m[i]=m[i+1]=0;continue;}const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*b*d[i];}}
  return x=>{x=clamp(x,xs[0],xs[n-1]);const h=xs[1]-xs[0];let i=Math.min(n-2,Math.floor((x-xs[0])/h));const t=(x-xs[i])/h,t2=t*t,t3=t2*t;
    return (2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];};}
const SOL=sim=>SOLS[sim.p.solute];
const solid=s=>s.kind==='ionic'||s.kind==='molec';
const limit=sim=>{const s=SOL(sim);return s.fn?s.fn(sim.p.T):s.kind==='oil'?0:Infinity;};
const conc=sim=>sim.st.md/SOL(sim).M/0.100;            // mol/L, taking 100 mL of solution
function alpha(sim){const s=SOL(sim),c=conc(sim);if(s.kind==='ionic'||s.kind==='strong')return c>0?1:0;if(s.kind!=='weak'||c<=0)return 0;
  return (-s.Ka+Math.sqrt(s.Ka*s.Ka+4*s.Ka*c))/(2*c);}
function kappa(sim){const s=SOL(sim),c=conc(sim),tf=1+0.02*(sim.p.T-25);let k=0.0015;   // mS/cm; distilled water open to air
  if(s.kind==='ionic'||s.kind==='strong')k+=c*s.lam*clamp(1-0.33*Math.sqrt(c),0.4,1);
  else if(s.kind==='weak')k+=alpha(sim)*c*s.lam;
  return k*tf;}
const glow=sim=>clamp((Math.log10(kappa(sim))+0.5)/2.2,0,1);
const bulbText=sim=>{const b=glow(sim);return b>0.55?'Bright':b>0.04?'Dim':'Off';};
const elecText=sim=>({ionic:'Strong electrolyte: all ions',strong:'Strong electrolyte: all ions',weak:'Weak electrolyte: few ions',molec:'Nonelectrolyte: whole molecules',misc:'Nonelectrolyte: whole molecules',oil:'Does not dissolve'})[SOL(sim).kind];
const f1=v=>(Math.abs(v)<0.05?0:v).toFixed(1);

function syncRange(sim){const s=SOL(sim),c=sim.def.controls.find(c=>c.id==='mass');c.max=s.max;c.step=s.max<=30?0.1:s.max<=100?0.5:1;
  const inp=document.getElementById('dissolve-mass');if(inp){inp.max=s.max;inp.step=c.step;}}
function fresh(sim){const st=sim.st;if(!st)return;st.md=0;st.t0=st.clock;st.tDone=NaN;st.prevMass=sim.p.mass;sim.vis.free=[];sim.vis.lat=0;sim.vis.key='';}
function settle(sim,secs){const d=sim.def;let t=0;while(t<secs){d.step(sim,0.05);t+=0.05;}}

const DS={
  id:'dissolve',hash:'dissolve',apUnit:10,order:1,kind:'Simulation',tab:'Dissolving and electrolytes',
  prereq:['polarity','imf'],next:['molarity','solcurve','colligative','ph'],
  card:'Drop salt, sugar or oil into water, zoom in to watch water molecules pull it apart, and test each solution with a conductivity bulb.',
  title:'Dissolving: what water does to salt, sugar and oil',
  lede:{bio:'Add a solute to water and zoom in. Salt breaks into ions, sugar into whole molecules, and oil does not mix at all. The bulb lights only when ions carry the current.',
        honors:'Polar water molecules surround each ion (hydration): the O end faces Na⁺, the H ends face Cl⁻. Compare strong, weak and nonelectrolytes, and test what changes the rate.',
        ap:'Measure conductivity in mS/cm, find the percent ionization of a weak acid, and see why conductivity does not quite double when the concentration doubles.'},
  scale:{bio:'Beaker: 100 g (100 mL) of water. The circle zooms in about 10 million times, to a box a few nanometers across.',
         honors:'Beaker: 100 g of water. Zoom: a few nanometers across. Ions are drawn to scale with each other (Na⁺ 102 pm, Cl⁻ 181 pm); the number of particles is scaled down.'},
  aspect:1.6,timeScale:1,dtMax:0.05,prewarm:0,sampleDt:0.25,window:60,unit:'s',chChange:2,chReveal:14,
  controls:[
    {id:'solute',label:'Solute',type:'select',def:'NaCl',lvl:'bio',options:Object.keys(SOLS).map(k=>({v:k,l:SOLS[k].name+', '+SOLS[k].label,lvl:SOLS[k].lvl})),
     onChange(sim){syncRange(sim);BioLab.setValues(sim,{mass:SOL(sim).def});fresh(sim);}},
    {id:'mass',label:'Solute added to 100 g water',type:'range',min:0,max:60,step:0.1,def:20,unit:' g',lvl:'bio',help:'Raise it to add more. Lower it to start over with less.'},
    {id:'T',label:'Water temperature',type:'range',min:0,max:100,step:1,def:25,unit:' °C',lvl:'bio'},
    {id:'stir',label:'Stir',type:'toggle',def:false,lvl:'bio',help:'A magnetic stir bar spins in the beaker.'},
    {id:'size',label:'Solid particle size',type:'seg',def:'granules',lvl:'honors',options:Object.keys(SIZE).map(k=>({v:k,l:SIZE[k].l})),onChange(sim){fresh(sim);},help:'Same mass, broken into smaller pieces. Changing it starts a fresh beaker.'}
  ],
  actions:[
    {id:'ff',label:'Skip ahead 2 minutes',lvl:'bio',run(sim){settle(sim,120);}},
    {id:'fresh',label:'Fresh beaker',lvl:'bio',run(sim){fresh(sim);}}
  ],
  init(sim){return {md:0,t0:0,clock:0,tDone:NaN,prevMass:sim.p.mass};},
  step(sim,dt){const p=sim.p,st=sim.st,s=SOL(sim),m=p.mass;st.clock+=dt;
    if(m>st.prevMass+1e-9){st.t0=st.clock;st.tDone=NaN;}
    if(m<st.prevMass-1e-9){st.md=Math.min(st.md,m);}
    st.prevMass=m;
    const tf=Math.exp(0.035*(p.T-25)),sf=p.stir?4:1;
    if(solid(s)){const S=s.fn(p.T),left=m-st.md;
      if(st.md<S&&left>1e-6){const r=K0*SIZE[p.size].f*sf*tf*Math.pow(left,2/3)*(1-st.md/S);st.md+=Math.min(left,r*dt,S-st.md);}
      else if(st.md>S){st.md-=(st.md-S)*(1-Math.exp(-dt/2));}}
    else if(s.kind==='oil'){st.md=0;}
    else{const tau=6/(sf*tf);st.md+=(m-st.md)*(1-Math.exp(-dt/tau));if(m-st.md<0.002)st.md=m;}
    if(!(st.tDone>=0)&&m>0&&(m-st.md)<Math.max(0.01,m*0.002)&&s.kind!=='oil')st.tDone=st.clock-st.t0;},
  metrics:[
    {id:'state',label:'The solution is',unit:'',lvl:'bio',text:true,get:s=>{const k=SOL(s).kind;if(k==='oil')return 'Not a solution: two layers';if(!solid(SOL(s)))return 'Unsaturated (mixes in any amount)';const S=limit(s);return s.st.md>=S-0.05?'Saturated':'Unsaturated';}},
    {id:'dis',label:'Dissolved',unit:'g',lvl:'bio',min:0,max:null,d:1,get:s=>s.st.md},
    {id:'lim',label:'Most that can dissolve',unit:'g per 100 g water',lvl:'bio',min:0,max:null,d:1,get:s=>{const L=limit(s);return Number.isFinite(L)?L:NaN;}},
    {id:'left',label:'Still undissolved',unit:'g',lvl:'bio',min:0,max:null,d:1,get:s=>Math.max(0,s.p.mass-s.st.md)},
    {id:'bulb',label:'Conductivity bulb',unit:'',lvl:'bio',text:true,get:bulbText},
    {id:'elec',label:'Electrolyte type',unit:'',lvl:'honors',text:true,get:elecText},
    {id:'tdis',label:'Time to dissolve',unit:'s',lvl:'honors',min:0,max:null,d:1,get:s=>s.st.tDone},
    {id:'M',label:'Concentration',unit:'M (mol/L)',lvl:'honors',min:0,max:null,d:3,get:conc},
    {id:'kap',label:'Conductivity',unit:'mS/cm',lvl:'ap',min:0,max:null,d:2,get:kappa},
    {id:'ion',label:'Percent ionized',unit:'%',lvl:'ap',min:0,max:100,d:2,get:s=>100*alpha(s)}
  ],
  graphs:[{id:'g1',label:'Dissolved vs most that can dissolve',lvl:'bio',lines:['dis','lim'],yl:'Mass (g per 100 g water)'},{id:'g2',label:'Conductivity',lvl:'ap',lines:['kap']}],
  defaultGraph:'g1',
  narrate(sim){const p=sim.p,st=sim.st,s=SOL(sim),hon=atLeast('honors'),ap=atLeast('ap'),left=Math.max(0,p.mass-st.md);
    if(p.mass<=0)return 'The beaker holds pure water. Water molecules tumble past each other, and with no ions the bulb stays off. <b>Add a solute</b> to begin.';
    if(s.kind==='oil')return p.stir?'Stirring breaks the oil into droplets, but <b>no oil molecule dissolves</b>. Oil is nonpolar; water molecules attract each other far more than they attract oil, so they squeeze the oil out. Stop stirring and the layers separate again.':
      '<b>Oil and water do not mix.</b> Oil molecules are nonpolar, water molecules are polar, and “like dissolves like”. The oil floats on top because it is less dense (0.92 g/mL).';
    if(s.kind==='ionic'){const S=limit(sim);
      if(left>0.05&&st.md>=S-0.05)return '<b>Saturated:</b> 100 g of water at '+p.T+' °C holds only '+f1(S)+' g of NaCl. The other '+f1(left)+' g stays on the bottom. '+(p.stir?'Stirring cannot change that limit; ':'')+(hon?'Ions still leave the crystal, but just as many rejoin it each second: a dynamic balance.':'Ions leave the crystal and rejoin it at the same rate.');
      if(left>0.05)return 'Water molecules pull Na⁺ and Cl⁻ ions off the corners and edges of the crystal. '+(hon?'<b>Each ion gets a shell of water</b>: the O end (δ−) faces Na⁺ and the H ends (δ+) face Cl⁻. ':'Each ion is surrounded by water. ')+(p.stir?'Stirring carries the dissolved ions away, so fresh water reaches the solid faster.':'Stirring, heating or crushing the salt would make this go faster.');
      return 'All '+f1(st.md)+' g of salt has dissolved into separate Na⁺ and Cl⁻ ions. <b>The moving ions carry current, so the bulb lights.</b> NaCl is a strong electrolyte.'+(ap?' Conductivity: '+kappa(sim).toFixed(1)+' mS/cm.':'');}
    if(s.kind==='molec'){const S=limit(sim);
      if(left>0.05&&st.md>=S-0.05)return '<b>Saturated:</b> '+p.T+' °C water holds '+f1(S)+' g of sugar per 100 g. '+f1(left)+' g stays solid. Heating raises this limit a lot for sugar (487 g at 100 °C).';
      return 'Sugar molecules leave the crystal <b>whole</b>: C₁₂H₂₂O₁₁ stays C₁₂H₂₂O₁₁, held in solution by hydrogen bonds to water. '+(left>0.05?'':'No ions form, so <b>the bulb stays off</b>. Sugar is a nonelectrolyte.');}
    if(s.kind==='misc')return 'Ethanol mixes with water in any amount because its O–H group hydrogen-bonds to water. The molecules stay whole, so <b>the bulb stays off</b>: a nonelectrolyte.';
    const a=alpha(sim);
    if(s.kind==='strong')return 'Every HCl molecule gives its H⁺ to a water molecule: HCl + H₂O → H₃O⁺ + Cl⁻. <b>100% ions, a strong electrolyte</b>, so the bulb glows brightly.'+(ap?' κ = '+kappa(sim).toFixed(0)+' mS/cm.':'');
    return 'Acetic acid ionizes only a little: HC₂H₃O₂ + H₂O ⇌ H₃O⁺ + C₂H₃O₂⁻. Only <b>'+(100*a).toFixed(2)+'% of the molecules</b> are ions at '+conc(sim).toFixed(2)+' M, so the bulb glows dimly: a weak electrolyte.'+(ap?' Dilute it and the percent ionized rises.':'');},
  tour:[
    {title:'A salt crystal in water',text:'The circle zooms into the beaker. At the bottom is the NaCl crystal: Na⁺ (purple) and Cl⁻ (green) ions locked in a repeating pattern. Red-and-white V shapes are water molecules.',focus:[372,30,410,420],speed:0.4,setup(sim){BioLab.setValues(sim,{solute:'NaCl',mass:20,T:25,stir:false,size:'crystal'});fresh(sim);}},
    {title:'Water molecules are polar',text:{bio:'The oxygen end of a water molecule is slightly negative and the hydrogen ends are slightly positive. That lets water tug on charged ions.',honors:'O is more electronegative than H, so the O end carries δ− and the H ends δ+. Those partial charges attract the ions at the crystal’s surface.'},focus:[372,30,410,420],speed:0.3},
    {title:'Hydration: ions get pulled off',text:'Ions at corners and edges are held least tightly. Water pulls them off and surrounds each one: oxygen ends face Na⁺, hydrogen ends face Cl⁻. That shell of water is called hydration.',focus:[372,30,410,420],speed:0.3,setup(sim){BioLab.setValues(sim,{stir:true});}},
    {title:'Ions carry current',text:'Dissolved ions are free to move, so the solution conducts electricity and the bulb lights. Dissolved NaCl is a strong electrolyte.',focus:[[40,20,300,190],[372,30,410,420]],speed:0.5,setup(sim){settle(sim,40);}},
    {title:'There is a limit: saturation',text:'Add 50 g. At 25 °C, 100 g of water holds only 36.2 g of NaCl. The rest stays on the bottom no matter how long you stir.',focus:[40,200,320,280],speed:0.6,setup(sim){BioLab.setValues(sim,{mass:50});settle(sim,90);}},
    {title:'Sugar stays in one piece',text:'Sugar dissolves too, but its molecules leave the crystal whole. No ions form, so the bulb stays off: sugar is a nonelectrolyte.',focus:[[40,20,300,190],[372,30,410,420]],speed:0.4,setup(sim){BioLab.setValues(sim,{solute:'sugar',mass:60,stir:true});settle(sim,8);}},
    {title:'Like dissolves like',text:'Oil is nonpolar. Water molecules stick to each other instead, so the oil is pushed out into its own layer. Polar dissolves polar; nonpolar dissolves nonpolar.',focus:[[40,200,320,280],[372,30,410,420]],speed:0.4,setup(sim){BioLab.setValues(sim,{solute:'oil',mass:10,stir:false});}},
    {lvl:'honors',title:'Strong and weak electrolytes',text:'Acetic acid at 1.0 M: only about 0.4% of its molecules ionize, so the bulb glows dimly. HCl at the same concentration ionizes completely and glows brightly.',focus:[[40,20,300,190],[372,30,410,420]],speed:0.4,setup(sim){BioLab.setValues(sim,{solute:'acetic',stir:true});settle(sim,20);}}
  ],
  onTourExit(sim){const base={};DS.controls.forEach(c=>base[c.id]=c.def);BioLab.setValues(sim,base);fresh(sim);},
  challenges:[
    {lvl:'bio',q:'20 g of salt is slowly dissolving in still water. You turn on the stirrer. What changes?',choices:['It dissolves faster','More salt can dissolve in the end','Nothing changes'],correct:0,
     baseline:{solute:'NaCl',mass:20,stir:false},change:{stir:true},changeText:'Stirrer turned on',watch:'g1',reveal:10,
     explain:{bio:'Stirring sweeps the dissolved ions away from the crystal, so fresh water keeps reaching its surface. The salt dissolves about 4 times faster, but the limit (36 g at 25 °C) does not change.'}},
    {lvl:'bio',q:'50 g of salt sat in 100 g of water for two minutes, and about 14 g is still on the bottom. If you stir hard, what happens to that 14 g?',choices:['It all dissolves','None of it dissolves: the water is saturated','Half of it dissolves'],correct:1,
     baseline:{solute:'NaCl',mass:50,stir:false},baselineAction:'ff',change:{stir:true},changeText:'Stirring hard',watch:'g1',reveal:10,
     explain:{bio:'At 25 °C, 100 g of water can hold only 36.2 g of NaCl. It is already holding that much, so it is saturated. Stirring changes how fast salt dissolves, never how much can dissolve.'}},
    {lvl:'bio',q:'You pour 10 g of vegetable oil into water and stir hard. Does the oil dissolve?',choices:['Yes, if you stir long enough','No: it breaks into droplets, and the layers separate again','Yes, but only in hot water'],correct:1,
     baseline:{solute:'oil',mass:10,stir:false},change:{stir:true},changeText:'Stirring hard',watch:'g1',reveal:9,
     explain:{bio:'The Dissolved readout stays at 0.0 g. Oil molecules are nonpolar and water molecules are polar, and water molecules attract each other far more strongly than they attract oil. Like dissolves like.'}},
    {lvl:'bio',q:'50 g of sugar dissolves completely in the water. What does the conductivity bulb do?',choices:['Glows brightly','Glows dimly','Stays off'],correct:2,
     baseline:{solute:'sugar',mass:50,stir:true},changeText:'Watching the bulb as the sugar dissolves',watch:'g1',reveal:10,
     explain:{bio:'Sugar molecules separate from each other but stay whole. Without ions, nothing carries the current. Dissolving is not the same as breaking into ions.'}},
    {lvl:'honors',q:'300 g of sugar in 100 g of water at 20 °C leaves solid sugar on the bottom (saturated). You heat it to 60 °C. What happens?',choices:['It only dissolves faster; the amount stays the same','About 80 g more dissolves','Nothing changes'],correct:1,
     baseline:{solute:'sugar',mass:300,T:20,stir:true},baselineAction:'ff',change:{T:60},changeText:'Heated from 20 °C to 60 °C',watch:'g1',reveal:16,
     explain:{honors:'Temperature is the one factor that changes how much dissolves, not just how fast. Sucrose’s solubility rises from 204 g to 287 g per 100 g of water, so about 83 g more dissolves.'}},
    {lvl:'honors',q:'20 g of NaCl as one crystal versus 20 g as fine powder. Which one dissolves more salt in the end?',choices:['The powder dissolves more','The crystal dissolves more','The same 20 g dissolves; the powder just gets there faster'],correct:2,
     baseline:{solute:'NaCl',mass:20,size:'crystal',stir:false},change:{size:'powder'},changeText:'Same 20 g as fine powder (fresh beaker)',watch:'g1',reveal:12,
     explain:{honors:'Powder has far more surface touching the water, so it dissolves in seconds. Both end with 20.0 g dissolved, because 20 g is below the 36 g limit. Surface area affects the rate, not the amount.'}},
    {lvl:'honors',q:'A 1.0 M HCl solution lights the bulb brightly. You switch to 1.0 M acetic acid. What does the bulb do?',choices:['Just as bright: same concentration','Much dimmer','It goes completely out'],correct:1,
     baseline:{solute:'HCl',mass:3.6,stir:true},change:{solute:'acetic'},changeText:'Switched to 1.0 M acetic acid',watch:'g1',reveal:12,
     explain:{honors:'HCl ionizes completely. Acetic acid is a weak acid: only about 0.4% of its molecules form H₃O⁺ and C₂H₃O₂⁻ ions at 1.0 M, so far fewer ions carry current. A weak electrolyte glows dimly, but it does glow.'}},
    {lvl:'ap',q:'You dilute acetic acid from 1.0 M to 0.10 M. What happens to its percent ionization?',choices:['It stays about 0.42%','It rises to about 1.3%','It falls to about 0.04%'],correct:1,
     baseline:{solute:'acetic',mass:6.0,stir:true},change:{mass:0.6},changeText:'Diluted to 0.10 M',watch:'g2',reveal:10,
     explain:{ap:'For a weak acid, α ≈ √(Ka/C). Cutting C by 10 raises α by √10: from 0.42% to 1.33%. Le Châtelier: dilution favors the side with more dissolved particles (the ions).'}},
    {lvl:'ap',q:'You double the NaCl concentration from 0.10 M to 0.21 M. The conductivity…',choices:['exactly doubles','rises a little less than 2×','quadruples'],correct:1,
     baseline:{solute:'NaCl',mass:0.6,stir:true,size:'powder'},change:{mass:1.2},changeText:'NaCl doubled to 1.2 g',watch:'g2',reveal:12,
     explain:{ap:'κ goes from about 11 to 21 mS/cm, about 1.9×. At higher concentration each ion is surrounded by more oppositely charged ions that drag on it, so molar conductivity falls (Kohlrausch’s law: Λ = Λ° − K√c).'}}
  ],
  lab:{bio:'<p><b>Question:</b> What makes salt dissolve faster, and what changes how much can dissolve?</p><ol><li>Press Fresh beaker with 20 g of salt in still water at 25 °C. Record the dissolved mass after 10 s (use Pause).</li><li>Repeat with stirring on, then at 60 °C.</li><li>Add salt to 50 g and press Skip ahead. Record the most that dissolves at 25 °C and at 80 °C.</li></ol><p>Which factors changed the speed? Which factor changed the amount?</p>',
       honors:'<p><b>Question:</b> How do particle size, stirring and temperature affect the time to dissolve 20 g of NaCl?</p><ol><li>Change one factor at a time: crystal, granules, powder; stirred or still; 10, 25, 60 °C.</li><li>After each change press Fresh beaker and record a trial when Time to dissolve appears.</li><li>Then test each of the six solutes with the bulb and sort them into strong, weak and nonelectrolytes.</li></ol><p>Explain each result with a particle diagram of what water does to the solute.</p>',
       ap:'<p><b>Question:</b> How does conductivity depend on concentration for a strong and a weak electrolyte?</p><ol><li>For NaCl, record κ at 0.3, 0.6, 1.2, 2.4 and 4.8 g in 100 mL.</li><li>Repeat for acetic acid at 0.6, 1.2, 3.0, 6.0 and 12 g, and record percent ionized.</li><li>Plot κ against concentration for both.</li></ol><p><b>Claim–evidence–reasoning:</b> Explain why NaCl’s graph is nearly straight but acetic acid’s rises like √c.</p>'},
  terms:[{t:'Solute',d:'The substance that dissolves (salt, sugar).'},{t:'Solvent',d:'The substance that does the dissolving (water).'},{t:'Solution',d:'A mixture that is the same throughout, with solute particles spread among solvent particles.'},
    {t:'Saturated',d:'Holding as much solute as it can at that temperature. Extra solute stays undissolved.'},{t:'Electrolyte',d:'A substance whose water solution conducts electricity because it contains ions.'},
    {t:'Like dissolves like',d:'Polar solvents dissolve polar and ionic solutes; nonpolar solvents dissolve nonpolar solutes.'},
    {lvl:'honors',t:'Hydration',d:'Water molecules surrounding a dissolved ion, oriented by charge (O toward cations, H toward anions).'},{lvl:'honors',t:'Dissociation',d:'An ionic solid separating into its ions as it dissolves: NaCl(s) → Na⁺(aq) + Cl⁻(aq).'},
    {lvl:'honors',t:'Ionization',d:'A molecular substance reacting with water to form ions: HCl + H₂O → H₃O⁺ + Cl⁻.'},{lvl:'honors',t:'Strong, weak and nonelectrolytes',d:'Strong: nearly all ions. Weak: a few percent ions. Non: no ions.'},
    {lvl:'ap',t:'Percent ionization',d:'Ionized concentration ÷ starting concentration × 100%. For a weak acid, about √(Ka/C) × 100%.'},{lvl:'ap',t:'Conductivity (κ)',d:'How well a solution carries current, in mS/cm. κ ≈ Σ λᵢcᵢ for each ion.'}],
  about:'<p><b>Amounts.</b> NaCl and sucrose solubilities are CRC values (g per 100 g water). Concentration assumes 100 mL of solution. Oil is treated as fully insoluble (real triglyceride solubility is far below 0.1 g/L).</p><p><b>Rate.</b> Dissolving follows dm/dt = k·A·(1 − c/c<sub>sat</sub>), where the surface area A grows with particle size factor (crystal 1, granules 3.5, powder 12) and with (undissolved mass)<sup>2/3</sup>; stirring multiplies k by 4 and k doubles about every 20 °C. These factors are illustrative, not measured.</p><p><b>Conductivity.</b> κ = Σλ°ᵢcᵢ(1 − 0.33√c) using limiting molar conductivities at 25 °C (Na⁺ 50.1, Cl⁻ 76.3, H₃O⁺ 349.8, acetate 40.9 S·cm²/mol), +2% per °C. Acetic acid ionization uses Ka = 1.8 × 10⁻⁵. The bulb brightness follows log κ.</p><p><b>Particle view.</b> Particles are drawn about 26 per mol (200 per mol for the acids), so the zoom shows the right ratios but far fewer particles than are really there. At least one ion pair is drawn whenever acetic acid has ionized at all, even though the real fraction is below 2%. Hydration shells are drawn with 4 waters; Na⁺ really holds about 6.</p>',
  initVis(sim){const v=sim.vis;v.free=[];v.lat=0;v.key='';v.acc=0;v.stirA=0;v.oil=[];
    v.water=[];for(let i=0;i<34;i++)v.water.push({x:ZX+(Math.random()-0.5)*ZR*1.6,y:ZY+(Math.random()-0.5)*ZR*1.6,a:Math.random()*6.28,vx:0,vy:0,w:(Math.random()-0.5)*3});},
  draw(sim,ctx,vdt,k,t){ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,500);drawMacro(sim,ctx,vdt,k,t);drawZoom(sim,ctx,vdt,k,t);},
  thumbSetup(sim){sim.p.size='granules';sim.p.stir=true;settle(sim,3);}
};
const ZX=585,ZY=238,ZR=188;
/* ---------- macroscopic view ---------- */
function drawMacro(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,s=SOL(sim),v=sim.vis,left=Math.max(0,p.mass-st.md);
  const bx=70,by=236,bw=230,bh=200;
  // stir plate
  rr(ctx,bx-20,by+bh+4,bw+40,26,6);ctx.fillStyle=PAL['cv-lamp'];ctx.fill();
  txt(ctx,p.stir?'stirring':'stirrer off',bx+bw/2,by+bh+17,{s:12*k,w:600,c:'#fff',a:'center',b:'middle'});
  const liq=CL.drawBeaker(ctx,{x:bx,y:by,w:bw,h:bh,fill:0.8,liquid:PAL['cv-water']});
  if(p.stir&&!RM)v.stirA+=vdt*14;
  // stir bar
  const sw=Math.abs(Math.cos(v.stirA))*26+6;rr(ctx,bx+bw/2-sw,by+bh-12,sw*2,8,4);ctx.fillStyle=PAL['cv-soft'];ctx.fill();
  // undissolved solid / oil layer
  if(solid(s)&&left>0.02){const sz=p.size;
    if(sz==='crystal'){const e=clamp(10*Math.cbrt(left),5,40);ctx.fillStyle='#f4f6f8';ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;const cx=bx+bw/2+30,cy=by+bh-6;
      ctx.beginPath();ctx.moveTo(cx-e/2,cy);ctx.lineTo(cx+e/2,cy);ctx.lineTo(cx+e/2+e*0.3,cy-e*0.3);ctx.lineTo(cx+e/2+e*0.3,cy-e*1.25);ctx.lineTo(cx-e/2+e*0.3,cy-e*1.25);ctx.lineTo(cx-e/2,cy-e*0.95);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx-e/2,cy-e*0.95);ctx.lineTo(cx+e/2,cy-e*0.95);ctx.lineTo(cx+e/2,cy);ctx.moveTo(cx+e/2,cy-e*0.95);ctx.lineTo(cx+e/2+e*0.3,cy-e*1.25);ctx.stroke();}
    else{const g=sz==='powder'?2.2:4.5,cmax=Math.floor(bw*0.85/(g*2+1)),n=Math.round(clamp(left*(sz==='powder'?4:0.9),1,cmax*cmax/4));let row=0,inRow=0,cap=Math.min(cmax,Math.ceil(2*Math.sqrt(n)));
      for(let i=0;i<n;i++){if(inRow>=cap){row++;inRow=0;cap=Math.max(1,cap-2);}const x=bx+bw/2+(inRow-(cap-1)/2)*(g*2+1)+((i*5)%3)-1,y=by+bh-6-row*(g*1.7);inRow++;
        ctx.fillStyle='#f4f6f8';ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=sz==='powder'?0.5:1;ctx.fillRect(x-g,y-g,g*2,g*2);ctx.strokeRect(x-g,y-g,g*2,g*2);}}}
  if(s.kind==='oil'&&p.mass>0){const th=clamp(p.mass*1.6,4,46);
    if(p.stir){for(let i=0;i<22;i++){const a=v.stirA*0.3+i*2.4,r=20+((i*37)%70);ctx.fillStyle='#e8c33a';ctx.globalAlpha=0.9;ctx.beginPath();ctx.arc(bx+bw/2+Math.cos(a)*r,liq.y+30+((i*53)%(bh*0.6)),3+(i%4)*1.5,0,6.29);ctx.fill();}ctx.globalAlpha=1;
      ctx.fillStyle='#e8c33a';ctx.fillRect(bx+2,liq.y,bw-4,th*0.3);}
    else{ctx.fillStyle='#e8c33a';ctx.fillRect(bx+2,liq.y,bw-4,th);ctx.strokeStyle='#a5861a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx+2,liq.y+th);ctx.lineTo(bx+bw-2,liq.y+th);ctx.stroke();}
    txt(ctx,'oil layer',bx+8,liq.y-8,{s:12*k,w:600,c:PAL['cv-soft']});}
  // conductivity tester: two electrodes, wires to a battery and bulb
  const e1=bx+80,e2=bx+150,ey=by-40,b=glow(sim),blx=(e1+e2)/2,bly=88;
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(e1-3,ey,6,by+bh*0.72-ey);ctx.fillRect(e2-3,ey,6,by+bh*0.72-ey);
  ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e1,ey);ctx.lineTo(e1,bly+40);ctx.lineTo(blx-12,bly+40);ctx.moveTo(e2,ey);ctx.lineTo(e2,bly+40);ctx.lineTo(blx+12,bly+40);ctx.stroke();
  rr(ctx,e2+14,bly+20,34,40,4);ctx.fillStyle=PAL['cv-lamp'];ctx.fill();ctx.fillRect(e2+24,bly+15,14,6);
  if(b>0.01){const gr=ctx.createRadialGradient(blx,bly,4,blx,bly,26+56*b);gr.addColorStop(0,'rgba(255,214,64,'+(0.85*b+0.1)+')');gr.addColorStop(1,'rgba(255,214,64,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(blx,bly,26+56*b,0,6.29);ctx.fill();}
  ctx.beginPath();ctx.arc(blx,bly,18,0,6.29);ctx.fillStyle=b>0.01?'rgb(255,'+Math.round(200+40*b)+','+Math.round(60+100*(1-b))+')':PAL['card'];ctx.fill();ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(blx-9,bly+16,18,14);
  ctx.strokeStyle=b>0.01?'#7a5a00':PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(blx-6,bly+12);ctx.lineTo(blx-3,bly-4);ctx.lineTo(blx,bly+4);ctx.lineTo(blx+3,bly-4);ctx.lineTo(blx+6,bly+12);ctx.stroke();
  pill(ctx,'Bulb: '+bulbText(sim).toLowerCase(),blx,30,b>0.55?PAL['s4']:b>0.04?PAL['s6']:PAL['muted'],'#fff',13*k);
  // thermometer
  const tx=bx+bw+34,ty0=by+10,ty1=by+bh-14;ctx.fillStyle=PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;rr(ctx,tx-6,ty0,12,ty1-ty0,6);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(tx,ty1+6,10,0,6.29);ctx.fillStyle='#d32f2f';ctx.fill();const hy=ty1-(ty1-ty0-8)*clamp(p.T/100,0,1);ctx.fillRect(tx-3,hy,6,ty1-hy+2);
  txt(ctx,p.T+' °C',tx,ty0-10,{s:13*k,w:700,a:'center'});
  // beaker label
  txt(ctx,p.mass>0?f1(p.mass)+' g '+s.label+' + 100 g water':'100 g water',bx+bw/2,by+bh+50,{s:12*k,w:600,c:PAL['cv-soft'],a:'center'});
  // zoom link
  const zx0=bx+bw*0.55,zy0=by+bh*0.62;ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.2;ctx.strokeRect(zx0-10,zy0-10,20,20);ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(zx0+10,zy0-10);ctx.lineTo(ZX-ZR*0.7,ZY-ZR*0.7);ctx.moveTo(zx0+10,zy0+10);ctx.lineTo(ZX-ZR*0.7,ZY+ZR*0.7);ctx.stroke();ctx.setLineDash([]);}
/* ---------- particle view ---------- */
function drawWater(ctx,x,y,a,al){if(al!==undefined)ctx.globalAlpha=al;ctx.fillStyle='#ffffff';ctx.strokeStyle='#8f9aa1';ctx.lineWidth=0.8;
  for(const d of [-0.91,0.91]){const hx=x+Math.cos(a+d)*7,hy=y+Math.sin(a+d)*7;ctx.beginPath();ctx.arc(hx,hy,3.3,0,6.29);ctx.fill();ctx.stroke();}
  ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(x,y,5.6,0,6.29);ctx.fill();ctx.strokeStyle='#9a1f1c';ctx.stroke();ctx.globalAlpha=1;}
function ball(ctx,x,y,o){ctx.fillStyle=o.c;ctx.beginPath();ctx.arc(x,y,o.r,0,6.29);ctx.fill();ctx.strokeStyle=CL.shade(o.c,-0.45);ctx.lineWidth=1.2;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(x-o.r*0.35,y-o.r*0.35,o.r*0.3,0,6.29);ctx.fill();}
function sugarGlyph(ctx,x,y,a){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#e3cfa3';ctx.strokeStyle='#8a6a32';ctx.lineWidth=1.5;
  const poly=(cx,cy,n,r)=>{ctx.beginPath();for(let i=0;i<n;i++){const t=i/n*6.283+0.5;i?ctx.lineTo(cx+Math.cos(t)*r,cy+Math.sin(t)*r):ctx.moveTo(cx+Math.cos(t)*r,cy+Math.sin(t)*r);}ctx.closePath();ctx.fill();ctx.stroke();};
  poly(-8,0,6,9);poly(10,1,5,8);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(3,1);ctx.stroke();ctx.restore();}
function ethGlyph(ctx,x,y,a){const c=Math.cos(a),s=Math.sin(a);ball(ctx,x-c*9,y-s*9,{c:'#555b61',r:6});ball(ctx,x,y,{c:'#555b61',r:6});ball(ctx,x+c*9,y+s*9,{c:'#e53935',r:5.5});ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+c*15,y+s*15-3,3,0,6.29);ctx.fill();}
function aceGlyph(ctx,x,y,a,ion){const c=Math.cos(a),s=Math.sin(a);ball(ctx,x-c*8,y-s*8,{c:'#555b61',r:6});ball(ctx,x+c*3,y+s*3,{c:'#555b61',r:6});ball(ctx,x+c*10-s*7,y+s*10+c*7,{c:'#e53935',r:5.5});ball(ctx,x+c*10+s*7,y+s*10-c*7,{c:'#e53935',r:5.5});
  if(!ion){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+c*16+s*9,y+s*16-c*9,3,0,6.29);ctx.fill();}else{ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x+c*3,y+s*3,19,0,6.29);ctx.stroke();}}
function hclGlyph(ctx,x,y,a){const c=Math.cos(a),s=Math.sin(a);ball(ctx,x+c*4,y+s*4,{c:'#2fae4e',r:11});ctx.fillStyle='#fff';ctx.strokeStyle='#8f9aa1';ctx.beginPath();ctx.arc(x-c*10,y-s*10,4,0,6.29);ctx.fill();ctx.stroke();}
function sites(s){const out=[];const liquidPool=!solid(s);const sp=s.kind==='ionic'||s.kind==='strong'?23:s.kind==='molec'?38:30,rowH=s.kind==='ionic'||s.kind==='strong'?22:s.kind==='molec'?25:24;
  for(let r=0;r<8;r++){const y=liquidPool?ZY-ZR+40+r*rowH:ZY+ZR-24-r*rowH,dy=y-ZY,half=Math.sqrt(Math.max(0,(ZR-14)*(ZR-14)-dy*dy));const n=Math.min(liquidPool?8:10,Math.floor((half*2-6)/sp));
    for(let c=0;c<n;c++)out.push({x:ZX+(c-(n-1)/2)*sp,y,r,c});}return out;}
function drawZoom(sim,ctx,vdt,k,t){const p=sim.p,st=sim.st,s=SOL(sim),v=sim.vis,hon=atLeast('honors');
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=PAL['cv-water'];ctx.fill();ctx.clip();
  const ionic=s.kind==='ionic'||s.kind==='strong',per=ionic?2:1;
  const key=p.solute+'|'+p.size;if(v.key!==key){v.key=key;v.free=[];v.lat=0;}
  const S=sites(s);
  // targets: dissolved units and undissolved units in view
  let tD=Math.round(st.md/s.M*s.Q);if(st.md>1e-4&&s.kind!=='oil')tD=Math.max(1,tD);tD=Math.min(s.cap,tD);
  const left=Math.max(0,p.mass-st.md);let tL=Math.round(left/s.M*s.Q*(solid(s)?3:1));if(left>0.02)tL=Math.max(1,tL);tL=Math.min(Math.floor(S.length/per),tL);
  if(s.kind==='oil'){tD=0;tL=0;}
  v.acc+=vdt;const tick=v.acc>0.07;if(tick)v.acc=0;
  const curD=v.free.length;
  const spawnAt=(x,y,spread)=>{const q={x:x+(spread?(Math.random()-0.5)*ZR:0),y:y+(spread?(Math.random()-0.5)*ZR:0),vx:(Math.random()-0.5)*30,vy:solid(s)?-50:50,a:Math.random()*6.28,
      x2:0,y2:0,vx2:0,vy2:0,ph:Math.random()*6.28,born:t};q.x2=q.x+20;q.y2=q.y+8;v.free.push(q);};
  if(Math.abs(curD-tD)>3||vdt===0){while(v.free.length<tD)spawnAt(ZX,ZY,true);while(v.free.length>tD)v.free.pop();v.lat=tL;}
  else if(tick){
    if(curD<tD){if(v.lat>0){const i=Math.min(S.length-1,(v.lat-1)*per);v.lat--;spawnAt(S[i].x,S[i].y,false);}else spawnAt(ZX,ZY,true);}
    else if(curD>tD){v.free.pop();if(v.lat<tL)v.lat++;}
    else if(v.lat<tL)v.lat++;else if(v.lat>tL)v.lat--;}
  // free waters
  const stirring=p.stir&&!RM;
  v.water.forEach(w=>{move(w,vdt,stirring,ZR-10);drawWater(ctx,w.x,w.y,w.a,0.9);});
  // lattice or liquid pool
  if(ionic&&solid(s)){let nc=0,na=0;const N=v.lat;for(let i=0;i<N*2&&i<S.length;i++){const q=S[i];let cat=(q.r+q.c)%2===0;if(cat&&nc>=N)cat=false;else if(!cat&&na>=N)cat=true;cat?nc++:na++;ball(ctx,q.x,q.y,cat?s.cat:s.an);}}
  else if(s.kind==='molec'){for(let i=0;i<v.lat&&i<S.length;i++)sugarGlyph(ctx,S[i].x,S[i].y,(S[i].r%2)*0.3);}
  else if(s.kind==='strong'){for(let i=0;i<v.lat*2&&i<S.length;i+=2)hclGlyph(ctx,S[i].x+10,S[i].y,0.2);}
  else if(s.kind==='weak'){for(let i=0;i<v.lat&&i<S.length;i++)aceGlyph(ctx,S[i].x,S[i].y,0.4,false);}
  else if(s.kind==='misc'){for(let i=0;i<v.lat&&i<S.length;i++)ethGlyph(ctx,S[i].x,S[i].y,0.3);}
  // dissolved particles
  const latTop=solid(s)&&v.lat>0?S[Math.min(S.length-1,(v.lat*per)-1)].y-22:ZY+ZR;
  const nIon=s.kind==='weak'&&v.free.length?Math.max(1,Math.round(alpha(sim)*v.free.length)):0;
  v.free.forEach((q,i)=>{move(q,vdt,stirring,ZR-26);if(q.y>latTop){q.y=latTop;q.vy=-Math.abs(q.vy);}
    if(ionic){move2(q,vdt,stirring);
      const pa=[[q.x,q.y,s.cat,true],[q.x2,q.y2,s.an,false]];
      pa.forEach(([x,y,o,cat])=>{const n=4,R=o.r+9;for(let j=0;j<n;j++){const ang=q.ph+j*6.283/n+(RM?0:t*0.4);const wx=x+Math.cos(ang)*R,wy=y+Math.sin(ang)*R;drawWater(ctx,wx,wy,cat?ang:ang+Math.PI);}ball(ctx,x,y,o);});}
    else if(s.kind==='molec'){sugarGlyph(ctx,q.x,q.y,q.a);hbWaters(ctx,q,t,22);}
    else if(s.kind==='misc'){ethGlyph(ctx,q.x,q.y,q.a);hbWaters(ctx,q,t,17,1);}
    else if(s.kind==='weak'){if(i<nIon){move2(q,vdt,stirring);aceGlyph(ctx,q.x,q.y,q.a,true);ball(ctx,q.x2,q.y2,{c:'#c2185b',r:9});}else aceGlyph(ctx,q.x,q.y,q.a,false);}});
  if(s.kind==='oil')drawOil(sim,ctx,vdt,t);
  ctx.restore();
  ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=4;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  // legend and scale under the zoom
  const ly=ZY+ZR+22;const items=[];
  if(ionic)items.push([s.cat.l,()=>0,s.cat],[s.an.l,()=>0,s.an]);
  else if(s.kind==='molec')items.push(['C₁₂H₂₂O₁₁','sugar']);else if(s.kind==='misc')items.push(['C₂H₅OH','eth']);else if(s.kind==='weak')items.push(['HC₂H₃O₂','ace'],['H₃O⁺',null,{c:'#c2185b',r:8}],['C₂H₃O₂⁻ (ringed)','acei']);else items.push(['oil molecule','oil']);
  items.push(['H₂O'+(hon&&k<1.3?' (O δ−, H δ+)':''),'water']);
  ctx.font='700 '+(12*k)+'px '+FONT;const ws=items.map(it=>ctx.measureText(it[0]).width+34);const rows=[[]];let rw=0;
  items.forEach((it,i)=>{if(rw+ws[i]>2*ZR+30&&rows[rows.length-1].length){rows.push([]);rw=0;}rows[rows.length-1].push(i);rw+=ws[i];});
  rows.forEach((row,ri)=>{const y=ly+ri*20*k;let x=ZX-row.reduce((a,i)=>a+ws[i],0)/2;row.forEach(i=>{const it=items[i],cx=x+12;
    if(it[1]==='water')drawWater(ctx,cx,y,-1.57);else if(it[1]==='sugar')sugarGlyph(ctx,cx,y,0);else if(it[1]==='eth')ethGlyph(ctx,cx,y,0);else if(it[1]==='ace')aceGlyph(ctx,cx,y,0,false);
    else if(it[1]==='acei'){ctx.strokeStyle=PAL['cv-ink'];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,y,8,0,6.29);ctx.stroke();}
    else if(it[1]==='oil'){ctx.strokeStyle='#d4a017';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx-10,y+3);ctx.lineTo(cx-4,y-3);ctx.lineTo(cx+2,y+3);ctx.lineTo(cx+8,y-3);ctx.stroke();}
    else ball(ctx,cx,y,{c:it[2].c,r:Math.min(9,it[2].r)});
    txt(ctx,it[0],x+26,y,{s:12*k,w:700,b:'middle'});x+=ws[i];});});
  const legRows=rows.length;
  const S2=solid(s)?s.fn(p.T):null;
  let head=s.kind==='oil'?'Oil stays separate':solid(s)?(st.md>=S2-0.05&&left>0.05?'Saturated: ':'Dissolved: ')+f1(st.md)+' of '+f1(S2)+' g possible':'Dissolved: '+f1(st.md)+' g';
  ctx.font='700 '+(13*k)+'px '+FONT;const hw=ctx.measureText(head).width+16*k;pill(ctx,head,Math.min(ZX,796-hw/2),26,PAL['card2'],PAL['cv-ink'],13*k);
  if(s.kind==='weak'&&hon)txt(ctx,'Real: '+(100*alpha(sim)).toFixed(2)+'% ionized; '+nIon+' of '+v.free.length+' drawn',ZX,ly+legRows*20*k+4,{s:12*k,c:PAL['cv-soft'],a:'center'});}
function hbWaters(ctx,q,t,R,n){n=n||2;for(let j=0;j<n;j++){const ang=q.ph+j*Math.PI+(RM?0:t*0.3);const wx=q.x+Math.cos(ang)*R,wy=q.y+Math.sin(ang)*R;
  ctx.strokeStyle=PAL['cv-soft'];ctx.setLineDash([2,3]);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(q.x+Math.cos(ang)*(R-12),q.y+Math.sin(ang)*(R-12));ctx.lineTo(wx-Math.cos(ang)*6,wy-Math.sin(ang)*6);ctx.stroke();ctx.setLineDash([]);
  drawWater(ctx,wx,wy,ang+Math.PI);}}
function move(q,dt,stir,lim){if(dt<=0||RM)return;q.vx+=(Math.random()-0.5)*1500*dt;q.vy+=(Math.random()-0.5)*1500*dt;const dm=Math.pow(0.2,dt);q.vx*=dm;q.vy*=dm;
  if(stir){const dx=q.x-ZX,dy=q.y-ZY;q.vx+=-dy*1.6*dt;q.vy+=dx*1.6*dt;}
  q.x+=q.vx*dt;q.y+=q.vy*dt;if(q.w!==undefined)q.a+=q.w*dt;else q.a+=(Math.random()-0.5)*4*dt;
  const dx=q.x-ZX,dy=q.y-ZY,d=Math.hypot(dx,dy);if(d>lim){q.x=ZX+dx/d*lim;q.y=ZY+dy/d*lim;const vn=(q.vx*dx+q.vy*dy)/d;if(vn>0){q.vx-=2*vn*dx/d;q.vy-=2*vn*dy/d;}}}
/* the partner ion of a dissociated unit wanders on its own but stays in the circle */
function move2(q,dt,stir){const o={x:q.x2,y:q.y2,vx:q.vx2,vy:q.vy2,a:0,w:0};move(o,dt,stir,ZR-26);
  const dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy);if(d<44&&d>0){o.x=q.x+dx/d*44;o.y=q.y+dy/d*44;}if(dt>0&&d>150){o.vx-=dx*0.5*dt;o.vy-=dy*0.5*dt;}
  q.x2=o.x;q.y2=o.y;q.vx2=o.vx;q.vy2=o.vy;}
function drawOil(sim,ctx,vdt,t){const p=sim.p,v=sim.vis,n=Math.round(clamp(p.mass*1.3,0,14));
  while(v.oil.length<n)v.oil.push({x:ZX+(Math.random()-0.5)*200,y:ZY-ZR+30,a:(Math.random()-0.5)*0.4,drop:Math.floor(Math.random()*3)});while(v.oil.length>n)v.oil.pop();
  const drops=[[ZX-70,ZY+20],[ZX+60,ZY-30],[ZX+10,ZY+90]];
  v.oil.forEach((o,i)=>{let tx,ty;if(p.stir){const d=drops[o.drop],a=i*2.1+t*0.6;tx=d[0]+Math.cos(a)*18;ty=d[1]+Math.sin(a)*14;}
    else{const row=Math.floor(i/5),col=i%5;tx=ZX-96+col*48+(row%2)*20;ty=ZY-ZR+34+row*15;}
    const r=vdt>0?Math.min(1,vdt*(p.stir?3:0.8)):0;o.x+=(tx-o.x)*r;o.y+=(ty-o.y)*r;
    ctx.strokeStyle='#d4a017';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let j=0;j<8;j++){const x=o.x-21+j*6,y=o.y+(j%2?-3:3);j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.lineCap='butt';});
  if(!p.stir&&n){ctx.strokeStyle=PAL['cv-ink'];ctx.globalAlpha=0.4;ctx.setLineDash([6,5]);ctx.lineWidth=1.5;const y=ZY-ZR+34+Math.ceil(n/5)*15;ctx.beginPath();ctx.moveTo(ZX-ZR,y);ctx.lineTo(ZX+ZR,y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}}
DS.onLevel=function(sim){syncRange(sim);};
BioLab.register(DS);
})();
