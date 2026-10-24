(function(){
'use strict';
const {clamp,rr,txt,pill,atLeast,PAL,FONT,RM,lvText}=BioLab.h;
const CL=window.ChemLab;

/* ---------- substances ----------
   mp in °C (CRC Handbook; sucrose melts with decomposition, graphite sublimes, alloys melt over a range).
   R = resistance between the tester probes (Ω) in each state; Infinity = insulator. */
const INS=1e7;
const SUBS=[
  {id:'NaCl',f:'NaCl',name:'sodium chloride (table salt)',type:'ionic',mp:801,sol:true,R:{solid:INS,melt:12,aq:25},cat:'Na',an:'Cl',q:1,look:'#f4f4f2'},
  {id:'KI',f:'KI',name:'potassium iodide',type:'ionic',mp:681,sol:true,R:{solid:INS,melt:14,aq:22},cat:'K',an:'I',q:1,look:'#f7f3e8'},
  {id:'sugar',f:'C12H22O11',name:'sucrose (table sugar)',type:'molecular',mp:186,sol:true,R:{solid:INS,melt:INS,aq:INS},look:'#fbfaf5',chars:true},
  {id:'wax',f:'C25H52',name:'paraffin wax',type:'molecular',mp:58,sol:false,floats:true,R:{solid:INS,melt:INS,aq:INS},look:'#e8dcb4'},
  {id:'Cu',f:'Cu',name:'copper',type:'metallic',mp:1085,sol:false,R:{solid:0.05,melt:0.1,aq:INS},look:'#c97a3a'},
  {id:'SiO2',f:'SiO2',name:'silicon dioxide (quartz sand)',type:'network',mp:1713,sol:false,R:{solid:INS,melt:INS,aq:INS},look:'#d9c39a'},
  {id:'graphite',f:'C',name:'graphite (pencil lead)',type:'network',mp:3652,sol:false,R:{solid:3,melt:3,aq:INS},look:'#4a4d52',graphite:true,lvl:'honors'},
  {id:'MgO',f:'MgO',name:'magnesium oxide',type:'ionic',mp:2852,sol:false,R:{solid:INS,melt:10,aq:3000},cat:'Mg',an:'O',q:2,look:'#f2f2f0',lvl:'honors'},
  {id:'brass',f:'Cu–Zn',name:'brass (substitutional alloy)',type:'metallic',mp:930,sol:false,R:{solid:0.08,melt:0.15,aq:INS},look:'#c9a640',alloy:'sub',lvl:'ap'},
  {id:'steel',f:'Fe–C',name:'carbon steel (interstitial alloy)',type:'metallic',mp:1450,sol:false,R:{solid:0.12,melt:0.2,aq:INS},look:'#8d939c',alloy:'int',lvl:'ap'}];
const SB={};SUBS.forEach(s=>SB[s.id]=s);
const TYPE={ionic:'Ionic',molecular:'Molecular (covalent)',network:'Network covalent',metallic:'Metallic'};
const TMAX=1500,RBULB=30,VBAT=9,WATER_R=1e5;
const fmtF=s=>s.f.includes('–')?s.f:CL.fmt(s.f);

function stateOf(sim){const p=sim.p,s=SB[p.sub];
  if(p.setup==='heat')return p.temp>=s.mp?'melt':'solid';
  if(p.setup==='water')return s.sol?'aq':s.floats?'float':'under';
  return 'solid';}
function resistance(sim){const s=SB[sim.p.sub],st=stateOf(sim);if(st==='solid')return s.R.solid;if(st==='melt')return s.R.melt;if(st==='aq')return s.R.aq;return s.id==='MgO'?s.R.aq:WATER_R;}
const current=sim=>VBAT/(RBULB+resistance(sim));     // A
const lit=sim=>current(sim)>0.1;
const bright=sim=>clamp(Math.pow(current(sim)/0.3,2),0,1);

/* ---------- lab notebook: filled in as you run each test ---------- */
function nbook(sim){if(!sim.nb)sim.nb={};return sim.nb;}
function observe(sim){const p=sim.p,s=SB[p.sub],nb=nbook(sim),e=nb[s.id]||(nb[s.id]={solid:null,mp:null,melt:null,sol:null,aq:null,order:Object.keys(nb).length});const before=JSON.stringify(e);
  const c=lit(sim);
  if(p.setup==='solid')e.solid=c;
  else if(p.setup==='heat'){if(p.temp>=s.mp){e.mp=s.mp;e.melt=s.chars?false:c;}else if(p.temp>=TMAX){e.mp='>'+TMAX;e.melt='n/a';}}
  else{e.sol=s.sol;e.aq=c;}
  if(JSON.stringify(e)!==before)sim.infoDirty=true;}
const yn=v=>v===null?'<span style="color:var(--muted)">?</span>':v===true?'yes':v===false?'no':v;

/* ---------- particle view ---------- */
const ZX=598,ZY=212,ZR=162;
function buildParts(sim){const s=SB[sim.p.sub],P=[],E=[],W=[];let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  if(s.type==='ionic'){const sp=36;for(let i=0;i<8;i++)for(let j=0;j<8;j++){const cat=(i+j)%2===0;P.push({hx:ZX-126+i*sp,hy:ZY-126+j*sp,k:cat?'c':'a'});}}
  else if(s.id==='sugar'){for(let i=0;i<6;i++)for(let j=0;j<6;j++)P.push({hx:ZX-120+i*48,hy:ZY-120+j*48,k:'m',a:(i+j)%2?0.3:-0.3});}
  else if(s.id==='wax'){for(let i=0;i<3;i++)for(let j=0;j<9;j++)P.push({hx:ZX-100+i*100,hy:ZY-128+j*32,k:'w',a:0});}
  else if(s.type==='network'&&!s.graphite){const sp=46;for(let i=0;i<7;i++)for(let j=0;j<7;j++)P.push({hx:ZX-138+i*sp+(j%2)*sp/2,hy:ZY-138+j*sp*0.87,k:'si'});}
  else if(s.graphite){for(let r=0;r<5;r++)for(let i=0;i<12;i++)P.push({hx:ZX-150+i*26,hy:ZY-110+r*56+((i%2)?8:-8),k:'gc',row:r});for(let n=0;n<26;n++)E.push({x:ZX-140+rnd()*280,row:n%5,v:(rnd()-0.5)*80});}
  else{const sp=38;for(let i=0;i<8;i++)for(let j=0;j<8;j++){let k='mt';if(s.alloy==='sub'&&rnd()<0.3)k='zn';P.push({hx:ZX-133+i*sp,hy:ZY-133+j*sp,k});}
    if(s.alloy==='int')for(let i=0;i<7;i++)for(let j=0;j<7;j++)if(rnd()<0.22)P.push({hx:ZX-114+i*38,hy:ZY-114+j*38,k:'cI'});
    for(let n=0;n<46;n++){const a=rnd()*6.28,r=Math.sqrt(rnd())*ZR;E.push({x:ZX+Math.cos(a)*r,y:ZY+Math.sin(a)*r,vx:(rnd()-0.5)*120,vy:(rnd()-0.5)*120});}}
  P.forEach(q=>{q.x=q.hx;q.y=q.hy;q.vx=(rnd()-0.5)*60;q.vy=(rnd()-0.5)*60;q.ph=rnd()*6.28;q.free=0;});
  for(let n=0;n<26;n++)W.push({x:ZX+(rnd()-0.5)*2*ZR,y:ZY+(rnd()-0.5)*2*ZR,a:rnd()*6.28,vx:(rnd()-0.5)*70,vy:(rnd()-0.5)*70,va:(rnd()-0.5)*3});
  sim.vis.P=P;sim.vis.E=E;sim.vis.W=W;sim.vis.key=s.id;sim.vis.rnd=rnd;}
function moveParts(sim,dt){const v=sim.vis,s=SB[sim.p.sub],st=stateOf(sim),T=sim.p.setup==='heat'?sim.p.temp:25,rnd=v.rnd;
  if(v.key!==s.id)buildParts(sim);const freeTarget=(st==='melt'||st==='aq')&&!(s.type==='network')?1:0;const on=lit(sim);
  const amp=1.2+3.5*Math.min(1,T/Math.max(s.mp,300));
  v.P.forEach(q=>{q.free+=(freeTarget-q.free)*Math.min(1,dt*1.6);q.ph+=dt*(6+T/150);
    if(q.free>0.02){const spd=st==='aq'?70:45;q.vx+=(rnd()-0.5)*spd*4*dt;q.vy+=(rnd()-0.5)*spd*4*dt;if(on&&s.type==='ionic'){q.vx+=(q.k==='c'?-1:1)*30*dt;}q.vx*=0.985;q.vy*=0.985;
      const fx=q.x+q.vx*dt,fy=q.y+q.vy*dt;let x=q.x+(fx-q.x)*q.free+(q.hx-q.x)*(1-q.free)*Math.min(1,dt*3),y=q.y+(fy-q.y)*q.free+(q.hy-q.y)*(1-q.free)*Math.min(1,dt*3);
      // dissolved particles spread through the whole circle; melted ones too, but stay a little closer
      const dx=x-ZX,dy=y-ZY,r=Math.hypot(dx,dy),lim=ZR-14;if(r>lim){x=ZX+dx/r*lim;y=ZY+dy/r*lim;q.vx*=-0.6;q.vy*=-0.6;}q.x=x;q.y=y;}
    else{q.x=q.hx+Math.sin(q.ph)*amp*0.6;q.y=q.hy+Math.cos(q.ph*1.3)*amp*0.6;}});
  if(s.graphite)v.E.forEach(e=>{e.v+=(rnd()-0.5)*200*dt+(on?40*dt:0);e.v*=0.97;e.x+=e.v*dt;if(e.x>ZX+150)e.x=ZX-150;if(e.x<ZX-150)e.x=ZX+150;});
  else v.E.forEach(e=>{e.vx+=(rnd()-0.5)*500*dt+(on?120*dt:0);e.vy+=(rnd()-0.5)*500*dt;e.vx*=0.97;e.vy*=0.97;e.x+=e.vx*dt;e.y+=e.vy*dt;const dx=e.x-ZX,dy=e.y-ZY,r=Math.hypot(dx,dy);if(r>ZR-6){if(on&&dx>0){e.x=ZX-(ZR-12)*0.9;e.y=ZY+dy*0.5;}else{e.x=ZX+dx/r*(ZR-8);e.y=ZY+dy/r*(ZR-8);e.vx*=-0.5;e.vy*=-0.5;}}});
  v.W.forEach(w=>{w.vx+=(rnd()-0.5)*300*dt;w.vy+=(rnd()-0.5)*300*dt;w.vx*=0.97;w.vy*=0.97;w.x+=w.vx*dt;w.y+=w.vy*dt;w.a+=w.va*dt;const dx=w.x-ZX,dy=w.y-ZY,r=Math.hypot(dx,dy);if(r>ZR-8){w.x=ZX+dx/r*(ZR-9);w.y=ZY+dy/r*(ZR-9);w.vx*=-1;w.vy*=-1;}});}

function sync(sim){if(!sim.ui||!sim.ui.sec)return;const el=document.getElementById('bondtypes-temp');if(el){const w=el.closest('.ctl');if(w)w.hidden=sim.p.setup!=='heat';}
  const t=sim.ui.tiles.temp;if(t){const w=t.num.closest('.tile');if(w)w.hidden=sim.p.setup!=='heat';}}

const BT={
  id:'bondtypes',hash:'bondtypes',apUnit:5,order:6,tab:'Properties of solids',kind:'Virtual lab',prereq:['ionic','lewis'],next:['imf','polarity'],
  card:'Melt, dissolve and test the conductivity of salt, sugar, wax, copper, sand and graphite, then use the particle view to classify each solid.',
  title:'Ionic, molecular, network and metallic solids',
  lede:{bio:'Run three tests on each solid: melt it, dissolve it, and check whether it conducts electricity. The pattern tells you what kind of bonding holds it together.',
        honors:'Explain every result with particles: ions that can or cannot move, whole molecules, a covalent network, or a sea of electrons. Graphite and MgO break the easy rules.',
        ap:'Connect properties to structure, including alloys: substitutional brass and interstitial steel.'},
  scale:'Lab bench: a few grams of solid and a 9 V conductivity tester. The particle view zooms in about 50 million times: each circle is one ion, atom or molecule.',
  timeless:true,graph:false,chChange:0.8,chReveal:3,
  controls:[
    {id:'sub',label:'Substance',type:'select',def:'NaCl',lvl:'bio',options:SUBS.map(s=>({v:s.id,l:fmtF(s)+'  '+s.name,lvl:s.lvl}))},
    {id:'setup',label:'Test',type:'seg',def:'solid',lvl:'bio',options:[{v:'solid',l:'Solid at 25 °C'},{v:'heat',l:'Heat it'},{v:'water',l:'Add water'}],onChange:sync},
    {id:'temp',label:'Burner temperature',type:'range',min:25,max:TMAX,step:25,def:25,unit:' °C',lvl:'bio',help:'A Meker burner reaches about 1500 °C.'}
  ],
  actions:[{id:'clearnb',label:'Clear the notebook',lvl:'bio',run(sim){sim.nb={};sim.infoDirty=true;}}],
  init(){return {};},
  metrics:[
    {id:'state',label:'What you see',unit:'',lvl:'bio',text:true,get:s=>{const st=stateOf(s),sb=SB[s.p.sub];return st==='melt'?(sb.chars?'Melts and turns brown':'Melted to a liquid'):st==='aq'?'Dissolved: clear solution':st==='float'?'Floats on the water, undissolved':st==='under'?'Sits in the water, undissolved':'Solid';}},
    {id:'bulb',label:'Tester bulb',unit:'',lvl:'bio',text:true,get:s=>lit(s)?'Lights up':current(s)>0.002?'Very faint glow':'Stays dark'},
    {id:'temp',label:'Temperature',unit:'°C',lvl:'bio',d:0,min:0,max:TMAX,get:s=>s.p.setup==='heat'?s.p.temp:25},
    {id:'I',label:'Current through the tester',unit:'mA',lvl:'honors',d:1,min:0,max:300,get:s=>current(s)*1000},
    {id:'R',label:'Sample resistance',unit:'',lvl:'ap',text:true,get:s=>{const r=resistance(s);return r>=INS?'> 10 MΩ (insulator)':r>=1000?(r/1000).toFixed(0)+' kΩ':r<1?r.toFixed(2)+' Ω':r.toFixed(0)+' Ω';}}
  ],
  infoPanel(sim){const nb=nbook(sim),ids=Object.keys(nb).sort((a,b)=>nb[a].order-nb[b].order),hon=atLeast('honors');
    const rows=ids.map(id=>{const e=nb[id],s=SB[id],done=e.solid!==null&&e.mp!==null&&e.sol!==null;
      return `<tr><td>${s.f.includes('–')?s.f:CL.html(s.f)}</td><td>${e.mp===null?yn(null):typeof e.mp==='number'?e.mp+' °C':'not by 1500 °C'}</td><td>${yn(e.sol)}</td><td>${yn(e.solid)}</td><td>${yn(e.melt)}</td><td>${yn(e.aq)}</td><td>${done?'<b>'+TYPE[s.type]+'</b>':'<span style="color:var(--muted)">run all 3 tests</span>'}</td></tr>`;}).join('');
    let h='<h3>Lab notebook</h3>';
    h+=ids.length?`<div class="tbl-wrap"><table><thead><tr><th>Solid</th><th>Melts at</th><th>Dissolves?</th><th>Conducts: solid</th><th>melted</th><th>in water</th><th>Type</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p>Run a test and the results appear here.</p>';
    h+='<p class="help">Each row fills in as you test. Heat a solid until it melts (or to 1500 °C), and add water, to finish its row. The type appears once all three tests are done.</p>';
    if(hon)h+='<p class="help">Current flows only if charged particles can move: ions in a melt or solution, or delocalized electrons in metals and graphite.</p>';
    return h;},
  narrate(sim){const s=SB[sim.p.sub],st=stateOf(sim),c=lit(sim),hon=atLeast('honors'),T=sim.p.temp,F=fmtF(s);
    if(sim.p.setup==='heat'&&st==='solid'){
      if(T>=TMAX)return F+' is still solid at 1500 °C. '+(s.type==='network'?'Every atom is held by <b>covalent bonds</b> in one giant network, and you would have to break those bonds to melt it.':s.type==='ionic'?'Mg²⁺ and O²⁻ have double charges, so their <b>ionic attraction</b> is about four times stronger than in NaCl. MgO melts at 2852 °C.':'Its metallic bonding holds on past the burner’s limit.');
      return 'At '+T+' °C, '+F+' is still solid. '+(s.type==='ionic'?'The ions vibrate faster but stay locked in the lattice, so the bulb stays dark.':s.type==='metallic'?'The metal ions vibrate, but the electron sea still carries current.':'Keep heating.');}
    if(st==='melt'){if(s.type==='ionic')return F+' melted at '+s.mp+' °C. <b>The ions can now move</b>, so they carry charge between the probes and the bulb lights. Melting needed a high temperature because every ion is attracted to all its neighbors.';
      if(s.type==='molecular')return F+' melted at only '+s.mp+' °C'+(s.chars?' and began to break down (caramelize)':'')+'. Heating only had to overcome the <b>weak forces between molecules</b>; the molecules stay whole and have no charge, so the bulb stays dark.';
      return F+' melted at '+s.mp+' °C. The metal ions slide past each other, and the <b>electron sea still carries current</b>.';}
    if(st==='aq'){if(s.type==='ionic')return F+' dissolves: water pulls the ions apart (they <b>dissociate</b>), and the free ions carry current. The bulb lights.';
      return F+' dissolves, but <b>the molecules stay whole</b>. Dissolving is not the same as breaking into ions, so there is nothing charged to carry current.';}
    if(st==='float'||st==='under'){if(s.id==='MgO')return 'MgO barely dissolves: its double charges hold the lattice together too tightly for water to pull many ions out. With almost no free ions, the bulb stays dark.';
      return F+' does not dissolve'+(st==='float'?' and floats (it is less dense than water)':'')+'. The probes are in nearly pure water, which has very few ions, so the bulb stays dark.';}
    if(s.type==='ionic')return 'Solid '+F+' is made of ions, but they are <b>locked in place</b> in a crystal lattice. Charged particles that cannot move cannot carry current, so the bulb stays dark.';
    if(s.type==='metallic')return 'Solid '+F+' conducts: its valence electrons are <b>delocalized in a sea</b> that flows between the metal ions.'+(s.alloy==='sub'&&hon?' In brass, Zn atoms of similar size replace some Cu atoms.':s.alloy==='int'&&hon?' In steel, small C atoms fill holes between the Fe atoms and stop the layers from sliding, so steel is harder than iron.':'');
    if(s.graphite)return 'Graphite is a network covalent solid, but it <b>conducts</b>: each carbon bonds to only three others, and the fourth electron is delocalized along its layer.';
    if(s.type==='network')return 'Sand is one giant covalent network of Si and O atoms. No ions, no free electrons: it does not conduct.';
    return 'Solid '+F+' is made of neutral molecules. They have no charge and no free electrons, so the bulb stays dark.';},
  tour:[
    {title:'The conductivity tester',text:'A 9 V battery, a bulb and two metal probes. If the sample lets charge flow from one probe to the other, the circuit is complete and the bulb lights.',focus:[10,40,380,400],speed:1,setup(sim){BioLab.setValues(sim,{sub:'NaCl',setup:'solid',temp:25});}},
    {title:'Solid salt: ions locked in place',text:'NaCl is made of Na⁺ and Cl⁻ ions, so it has charged particles. But in the solid they are locked in a lattice and cannot move. The bulb stays dark.',focus:[ZX-ZR-8,ZY-ZR-8,2*ZR+16,2*ZR+16],speed:1},
    {title:'Melt it',text:'Heat NaCl past 801 °C. The lattice breaks apart, the ions slide past each other, and now they carry charge. The bulb lights.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{setup:'heat',temp:850});}},
    {title:'Dissolve it',text:'In water the ions separate (dissociate) and move freely, so salt water conducts too. This is why ionic compounds are electrolytes.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{setup:'water'});}},
    {title:'Sugar dissolves, but…',text:'Sugar dissolves just as easily, yet the bulb stays dark. Sugar molecules stay whole in water: no ions, no current.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{sub:'sugar',setup:'water'});}},
    {title:'Copper: a sea of electrons',text:'Metal atoms share their valence electrons in a sea that moves freely between the metal ions. Copper conducts as a solid.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{sub:'Cu',setup:'solid'});}},
    {title:'Sand: one giant molecule',text:'Quartz is a network of Si–O covalent bonds. Even at 1500 °C it does not melt: you would have to break covalent bonds, not just pull particles apart.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{sub:'SiO2',setup:'heat',temp:1500});}},
    {lvl:'honors',title:'The graphite exception',text:'Graphite is also a covalent network, but each carbon bonds to only three neighbors. The fourth electron moves along the layer, so graphite conducts. That is why pencil lead works as an electrode.',focus:[0,0,800,450],speed:1,setup(sim){BioLab.setValues(sim,{sub:'graphite',setup:'solid',temp:25});}}
  ],
  onTourExit(sim){BioLab.setValues(sim,{sub:'NaCl',setup:'solid',temp:25});},
  onChallenge(sim,ch,phase){if(ch&&ch.instant&&ch.set&&phase==='ask'){BioLab.setValues(sim,ch.set);BioLab.refresh(sim);}},
  challenges:[
    {lvl:'bio',q:'Solid NaCl does not light the bulb. You heat it past its melting point (801 °C). The bulb…',choices:['stays dark: salt never conducts','lights up'],correct:1,
     baseline:{sub:'NaCl',setup:'heat',temp:25},change:{temp:900},changeText:'Heated to 900 °C',
     explain:{bio:'Melting frees the ions to move. Moving charged particles carry current, so the bulb lights. The solid had ions too, but they were locked in place.'}},
    {lvl:'bio',q:'Sugar dissolves in water. Will the sugar water light the bulb?',choices:['Yes: anything dissolved conducts','No: sugar molecules stay whole, so there are no ions'],correct:1,
     baseline:{sub:'sugar',setup:'solid'},change:{setup:'water'},changeText:'Sugar added to water',
     explain:{bio:'Sugar is molecular. Water separates the molecules from each other, but each one stays intact and has no charge. No ions means no current.'}},
    {lvl:'bio',q:'You swap the paraffin wax between the probes for a copper strip. The bulb…',choices:['stays dark','lights up'],correct:1,
     baseline:{sub:'wax',setup:'solid'},change:{sub:'Cu'},changeText:'Wax replaced with copper',
     explain:{bio:'Copper is a metal. Its valence electrons move freely through the solid (a sea of electrons), so charge flows and the bulb lights.'}},
    {lvl:'honors',q:'Graphite, like sand, is a network covalent solid. Does solid graphite conduct?',choices:['No: covalent solids never conduct','Yes: it has delocalized electrons in its layers'],correct:1,
     baseline:{sub:'SiO2',setup:'solid'},change:{sub:'graphite'},changeText:'Sand replaced with graphite',
     explain:{honors:'Each C in graphite bonds to three others in a flat sheet. The fourth valence electron is delocalized across the sheet, so current flows along the layers. Diamond, where each C bonds to four, does not conduct.'}},
    {lvl:'honors',q:'MgO is ionic, like NaCl. If you add water to MgO, the bulb…',choices:['lights, just like salt water','stays dark: MgO barely dissolves'],correct:1,
     baseline:{sub:'NaCl',setup:'water'},change:{sub:'MgO'},changeText:'Salt replaced with MgO',
     explain:{honors:'Not every ionic compound is soluble. Mg²⁺ and O²⁻ attract each other so strongly that water frees very few ions (about 3 mA flows, not enough to light the bulb). Check the solubility rules before predicting conductivity.'}},
    {lvl:'honors',q:'You heat paraffin wax to 100 °C. What happens?',choices:['Nothing: covalent compounds have high melting points','It melts, because only weak forces between molecules hold it together','It breaks apart into carbon and hydrogen'],correct:1,
     baseline:{sub:'wax',setup:'heat',temp:25},change:{temp:100},changeText:'Heated to 100 °C',
     explain:{honors:'Paraffin melts at about 58 °C. Melting a molecular solid only overcomes intermolecular forces; the strong C–C and C–H covalent bonds inside each molecule stay intact.'}},
    {lvl:'ap',instant:true,set:{sub:'steel',setup:'solid'},q:'Which alloy is interstitial?',choices:['Brass: Zn atoms replace Cu atoms','Steel: small C atoms fit in the holes between Fe atoms'],correct:1,
     explain:{ap:'Interstitial alloys form when the added atoms are much smaller (C, 77 pm, vs Fe, 132 pm). Substitutional alloys like brass mix atoms of similar size (Cu 132 pm, Zn 122 pm).'}},
    {lvl:'ap',instant:true,set:{sub:'NaCl',setup:'heat',temp:850},q:'Paraffin molecules (C₂₅H₅₂, 352 g/mol) are much heavier than NaCl units (58 g/mol). Why does NaCl melt so much higher (801 °C vs 58 °C)?',choices:['To melt NaCl you must overcome ionic attractions between every ion and its neighbors; paraffin only needs weak London forces overcome','Covalent bonds are weaker than ionic bonds, so paraffin’s bonds break','Heavier substances always melt at lower temperatures'],correct:0,
     explain:{ap:'Melting paraffin leaves every covalent bond intact. It only separates whole molecules held by London dispersion forces. NaCl’s ions are held by strong Coulomb attractions in all directions.'}},
    {lvl:'ap',instant:true,set:{sub:'steel',setup:'solid'},q:'Why is steel harder and less malleable than pure iron?',choices:['Carbon atoms in the holes keep the layers of Fe atoms from sliding past each other','Carbon adds extra free electrons','Steel is an ionic compound'],correct:0,
     explain:{ap:'Malleability comes from layers of metal ions sliding through the electron sea. Interstitial C atoms pin the layers, so steel resists bending. It still conducts, because the electron sea is unchanged.'}}
  ],
  lab:{bio:'<p><b>Question:</b> How can three simple tests tell you what kind of solid you have?</p><ol><li>Pick a substance. Test the solid, then heat it until it melts (or to 1500 °C), then add water.</li><li>The lab notebook fills in as you go. Repeat for all six substances.</li><li>Group the solids that behave the same way.</li></ol><p>Write one rule for each group, such as “conducts only when melted or dissolved”.</p>',
       honors:'<p><b>Question:</b> Which particles carry the current, and when?</p><ol><li>Finish the notebook for all eight substances.</li><li>Record the current through the tester for NaCl as a solid, melted and dissolved.</li><li>Compare graphite with sand, and MgO with NaCl.</li></ol><p>Explain each exception with a particle-level drawing.</p>',
       ap:'<p><b>Question:</b> How do structure and bonding explain properties?</p><ol><li>Complete the notebook, including brass and steel.</li><li>Rank the melting points and match each to the force that must be overcome.</li></ol><p><b>Claim–evidence–reasoning:</b> Use Coulomb’s law to explain why MgO melts more than 2000 °C higher than NaCl, and use structure to explain why steel is harder than iron but still conducts.</p>'},
  terms:[{t:'Ionic solid',d:'Positive and negative ions in a lattice. High melting point; conducts only when melted or dissolved.'},{t:'Molecular solid',d:'Neutral molecules held by intermolecular forces. Low melting point; never conducts.'},{t:'Network covalent solid',d:'Atoms joined by covalent bonds into one giant structure (quartz, diamond). Very high melting point; usually does not conduct.'},{t:'Metallic solid',d:'Metal ions in a sea of delocalized electrons. Conducts as a solid and a liquid; malleable.'},{t:'Electrolyte',d:'A substance that conducts when dissolved because it releases ions.'},
    {lvl:'honors',t:'Dissociation',d:'Ions separating from each other when an ionic compound dissolves.'},{lvl:'honors',t:'Delocalized electrons',d:'Electrons not tied to one atom or bond, free to move through a metal or along a graphite layer.'},
    {lvl:'ap',t:'Substitutional alloy',d:'Atoms of similar size replace some host atoms (brass: Zn in Cu).'},{lvl:'ap',t:'Interstitial alloy',d:'Much smaller atoms fill the holes between host atoms (steel: C in Fe).'}],
  about:'<p>Melting points are CRC Handbook values (sucrose melts with decomposition at about 186 °C, graphite sublimes near 3650 °C, brass and steel melt over a range). The burner tops out at 1500 °C. The tester is a 9 V battery and a 30 Ω bulb in series with the sample; the bulb lights above 100 mA. Sample resistances between the probes are representative: about 0.05 Ω for a copper strip, 3 Ω for a graphite rod, 12 Ω for molten salt, 25 Ω for a salt solution, and more than 10 MΩ for insulators. Distilled water alone is about 100 kΩ.</p><p>The particle view is schematic: particles are not to scale, there are far fewer of them than in a real sample, and water molecules are drawn only to show the solvent. In the water test the probes sit in the liquid, not on an undissolved solid. Safety: in a real lab, wear goggles, use tongs on hot crucibles, and never heat paraffin over an open flame (it is flammable).</p>',
  initVis(sim){buildParts(sim);},
  draw(sim,ctx,vdt,k,t){const p=sim.p,s=SB[p.sub],st=stateOf(sim),hon=atLeast('honors');observe(sim);moveParts(sim,Math.min(vdt,0.05));
    ctx.fillStyle=PAL['cv-bg'];ctx.fillRect(0,0,800,450);ctx.fillStyle=PAL['cv-bench'];ctx.fillRect(0,404,420,46);
    drawBench(sim,ctx,k,t,s,st);drawZoom(sim,ctx,k,t,s,st);
    txt(ctx,fmtF(s),18,34,{s:22*Math.min(k,1.5),w:800});txt(ctx,s.name,18,34+19*Math.min(k,1.5),{s:13*k,c:PAL['cv-soft']});},
  thumbSetup(sim){sim.p.setup='water';}
};

/* ---------- the bench: tester, sample, burner or beaker ---------- */
function drawBench(sim,ctx,k,t,s,st){const p=sim.p,on=lit(sim),br=bright(sim),hot=p.setup==='heat'?clamp((p.temp-25)/1400,0,1):0;const SX=250;
  // circuit wires
  const pA=[[SX-16,p.setup==='water'?268:p.setup==='heat'?236:318],[SX-16,96],[132,96]],pB=[[SX+16,p.setup==='water'?268:p.setup==='heat'?236:318],[SX+16,82],[300,82],[300,62],[60,62],[60,300]],pC=[[96,140],[96,300]];
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.lineJoin='round';[pA,pB,pC].forEach(pl=>{ctx.beginPath();pl.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();});
  // battery
  ctx.fillStyle='#3a3f47';rr(ctx,40,300,76,44,6);ctx.fill();ctx.fillStyle='#c27a00';ctx.fillRect(40,300,20,44);txt(ctx,'9 V',88,323,{s:14*k,w:800,c:'#fff',a:'center',b:'middle'});
  // bulb
  const bx=110,by=112;if(br>0.02){const g=ctx.createRadialGradient(bx,by,4,bx,by,70);g.addColorStop(0,'rgba(255,214,80,'+(0.75*br).toFixed(2)+')');g.addColorStop(1,'rgba(255,214,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(bx,by,70,0,6.29);ctx.fill();}
  ctx.fillStyle=br>0.02?'rgb(255,'+Math.round(200+40*br)+','+Math.round(90+60*br)+')':PAL['card'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(bx,by,22,0,6.29);ctx.fill();ctx.stroke();
  ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(bx-10,by+20,20,14);ctx.strokeStyle=br>0.02?'#a35a00':PAL['cv-soft'];ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx-6,by+12);ctx.lineTo(bx-3,by-4);ctx.lineTo(bx,by+4);ctx.lineTo(bx+3,by-4);ctx.lineTo(bx+6,by+12);ctx.stroke();
  txt(ctx,on?'bulb lights':current(sim)>0.002?'very faint':'bulb dark',bx,by-34,{s:13*k,w:700,a:'center',c:on?PAL['s4']:PAL['cv-soft']});
  // moving electrons along the wires when current flows
  if(current(sim)>0.002&&!RM){const path=[[60,300],[60,62],[300,62],[300,82],[SX+16,82],[SX+16,pB[0][1]]];const n=10,sp=current(sim)*400;ctx.fillStyle=PAL['cv-e'];
    const seg=[];let L=0;for(let i=1;i<path.length;i++){const l=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);seg.push([path[i-1],path[i],L,l]);L+=l;}
    for(let i=0;i<n;i++){let d=((t*sp+i*L/n)%L+L)%L;for(const [a,b,s0,l] of seg){if(d<=s0+l){const f=(d-s0)/l;ctx.beginPath();ctx.arc(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,3.5,0,6.29);ctx.fill();break;}}}}
  // sample holder
  if(p.setup==='solid'){ctx.fillStyle=PAL['cv-glass'];ctx.globalAlpha=0.45;ctx.beginPath();ctx.ellipse(SX,346,82,14,0,0,6.29);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=PAL['cv-glass'];ctx.lineWidth=2;ctx.stroke();sampleSolid(ctx,s,SX,330,1);}
  else if(p.setup==='heat'){// burner and flame
    ctx.fillStyle=PAL['cv-soft'];ctx.fillRect(SX-12,350,24,54);ctx.fillRect(SX-30,398,60,8);
    const fh=20+70*hot;if(p.temp>25){const g=ctx.createLinearGradient(0,350-fh,0,350);g.addColorStop(0,'rgba(80,140,255,0)');g.addColorStop(0.5,'rgba(80,140,255,0.75)');g.addColorStop(1,'rgba(40,90,220,0.95)');ctx.fillStyle=g;const fl=RM?0:Math.sin(t*20)*3;
      ctx.beginPath();ctx.moveTo(SX-14,350);ctx.quadraticCurveTo(SX-18,350-fh*0.5,SX+fl,350-fh);ctx.quadraticCurveTo(SX+18,350-fh*0.5,SX+14,350);ctx.closePath();ctx.fill();}
    // crucible on a clay triangle
    ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(SX-70,286);ctx.lineTo(SX+70,286);ctx.stroke();
    const glow=hot>0.4?'rgba(255,'+Math.round(140-80*hot)+',40,'+(hot*0.5).toFixed(2)+')':null;
    ctx.fillStyle=glow||PAL['card2'];ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(SX-46,214);ctx.lineTo(SX+46,214);ctx.lineTo(SX+32,284);ctx.lineTo(SX-32,284);ctx.closePath();ctx.fill();ctx.stroke();
    if(st==='melt'){const col=s.type==='metallic'?(hot>0.5?'#ffb040':s.look):s.chars?'#8a4b16':s.id==='wax'?'#e7d9a6':'#f6e6b0';ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(SX-38,252);ctx.lineTo(SX+38,252);ctx.lineTo(SX+32,281);ctx.lineTo(SX-32,281);ctx.closePath();ctx.fill();}
    else sampleSolid(ctx,s,SX,270,0.7);
    pill(ctx,'T = '+p.temp+' °C',SX+118,250,PAL['card'],PAL['cv-ink'],14*k);}
  else{const liq=CL.drawBeaker(ctx,{x:SX-72,y:212,w:144,h:160,fill:0.78,liquid:PAL['cv-water']});
    if(st==='aq'){ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(liq.x+3,liq.y,liq.w-6,liq.h-3);}
    else if(st==='float'){ctx.fillStyle=s.look;rr(ctx,SX-40,liq.y-10,80,16,5);ctx.fill();ctx.strokeStyle='#9c8a55';ctx.lineWidth=1;ctx.stroke();}
    else sampleSolid(ctx,s,SX+26,362,0.55);}
  // probes
  [SX-16,SX+16].forEach(x=>{ctx.fillStyle='#8c939e';ctx.fillRect(x-3,96,6,(p.setup==='water'?268:p.setup==='heat'?236:318)-96);});
  txt(ctx,'probes',SX+28,120,{s:12*k,c:PAL['cv-soft']});}
function sampleSolid(ctx,s,x,y,sc){ctx.save();ctx.translate(x,y);ctx.scale(sc,sc);
  if(s.type==='metallic'){const g=ctx.createLinearGradient(-60,0,60,0);g.addColorStop(0,CL.shade(s.look,-0.25));g.addColorStop(0.5,CL.shade(s.look,0.25));g.addColorStop(1,CL.shade(s.look,-0.25));ctx.fillStyle=g;rr(ctx,-62,-14,124,22,4);ctx.fill();}
  else if(s.graphite){ctx.fillStyle=s.look;rr(ctx,-60,-10,120,16,8);ctx.fill();}
  else if(s.id==='wax'){ctx.fillStyle=s.look;rr(ctx,-50,-26,100,32,6);ctx.fill();ctx.strokeStyle='#9c8a55';ctx.lineWidth=1.5;ctx.stroke();}
  else if(s.id==='SiO2'){for(let i=0;i<40;i++){const a=i*2.4,r=Math.sqrt(i/40)*50;ctx.fillStyle=i%3?s.look:CL.shade(s.look,-0.2);ctx.beginPath();ctx.arc(Math.cos(a)*r*1.4,Math.sin(a)*r*0.25-6,5,0,6.29);ctx.fill();}}
  else{for(let i=0;i<14;i++){const cx=-52+(i%7)*17,cy=-6-(i>=7?14:0);ctx.fillStyle=s.look;ctx.strokeStyle='#9aa0a8';ctx.lineWidth=1;ctx.fillRect(cx,cy,13,13);ctx.strokeRect(cx,cy,13,13);}}
  ctx.restore();}

/* ---------- particle zoom ---------- */
function drawZoom(sim,ctx,k,t,s,st){const v=sim.vis,on=lit(sim),hon=atLeast('honors');
  ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(290,sim.p.setup==='water'?320:sim.p.setup==='heat'?260:330);ctx.lineTo(ZX-ZR*0.92,ZY+ZR*0.4);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.fillStyle=st==='aq'||st==='under'||st==='float'?PAL['cv-water']:PAL['card'];ctx.fill();ctx.clip();
  const water=st==='aq'||st==='under'||st==='float';
  if(water)v.W.forEach(w=>{ctx.globalAlpha=0.7;const ox=w.x,oy=w.y;[0.9,-0.9].forEach(h=>{ctx.fillStyle='#f0f0f0';ctx.beginPath();ctx.arc(ox+Math.cos(w.a+h)*7,oy+Math.sin(w.a+h)*7,3.2,0,6.29);ctx.fill();});ctx.fillStyle='#e0473c';ctx.beginPath();ctx.arc(ox,oy,5,0,6.29);ctx.fill();ctx.globalAlpha=1;});
  const showUndissolved=st==='under'||st==='float';
  if(s.type==='ionic'){const rc=s.q===2?11:s.cat==='K'?13:10,ra=s.an==='I'?18:s.an==='O'?13:15;
    v.P.forEach(q=>{const cat=q.k==='c';const x=showUndissolved?q.hx:q.x,y=showUndissolved?q.hy+(st==='float'?-60:60)*0:q.y;ctx.fillStyle=cat?'#3f6fb0':(s.an==='I'?'#7d3c98':'#c0392b');ctx.beginPath();ctx.arc(x,y,cat?rc:ra,0,6.29);ctx.fill();
      txt(ctx,(s.q===2?'2':'')+(cat?'+':'−'),x,y+1,{s:Math.max(11,12*k*0.85),w:800,c:'#fff',a:'center',b:'middle'});});}
  else if(s.id==='sugar'){v.P.forEach(q=>{ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a+(q.free>0.1?t*0.5:0));ctx.fillStyle='#efe9da';ctx.strokeStyle='#8a7f6a';ctx.lineWidth=1.5;
      [-9,9].forEach(o=>{ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(o+Math.cos(a)*9,Math.sin(a)*9);}ctx.closePath();ctx.fill();ctx.stroke();});ctx.restore();});}
  else if(s.id==='wax'){v.P.forEach(q=>{const x=q.x,y=q.y+(st==='float'?-46:0);ctx.strokeStyle='#8a7440';ctx.lineWidth=5;ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<11;i++){const xx=x-40+i*8,yy=y+(i%2?4:-4)+(q.free>0.1?Math.sin(t*3+i+q.ph)*3:0);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();});}
  else if(s.type==='network'&&!s.graphite){const P=v.P;ctx.strokeStyle='#b23b2e';ctx.lineWidth=3;
    P.forEach((a,i)=>P.forEach((b,j)=>{if(j<=i)return;const d=Math.hypot(a.hx-b.hx,a.hy-b.hy);if(d<50){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle='#d9473a';ctx.beginPath();ctx.arc((a.x+b.x)/2,(a.y+b.y)/2,5.5,0,6.29);ctx.fill();}}));
    P.forEach(a=>{ctx.fillStyle='#c8a46e';ctx.beginPath();ctx.arc(a.x,a.y,9,0,6.29);ctx.fill();});}
  else if(s.graphite){for(let r=0;r<5;r++){const row=v.P.filter(q=>q.row===r);ctx.strokeStyle='#3a3d42';ctx.lineWidth=3;ctx.beginPath();row.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();row.forEach(q=>{ctx.fillStyle='#55595f';ctx.beginPath();ctx.arc(q.x,q.y,6.5,0,6.29);ctx.fill();});}
    ctx.fillStyle=PAL['cv-e'];v.E.forEach(e=>{ctx.beginPath();ctx.arc(e.x,ZY-110+e.row*56-16,3.6,0,6.29);ctx.fill();});}
  else{v.P.forEach(q=>{if(q.k==='cI'){ctx.fillStyle='#3b3b3b';ctx.beginPath();ctx.arc(q.x,q.y,6,0,6.29);ctx.fill();return;}const col=q.k==='zn'?'#8f93c6':s.alloy==='int'?'#9aa1ab':'#c97a3a';ctx.fillStyle=col;ctx.beginPath();ctx.arc(q.x,q.y,14,0,6.29);ctx.fill();
      txt(ctx,'+',q.x,q.y+1,{s:Math.max(11,12*k*0.85),w:800,c:'#fff',a:'center',b:'middle'});});
    ctx.fillStyle=PAL['cv-e'];ctx.strokeStyle=PAL['cv-estroke'];ctx.lineWidth=1;v.E.forEach(e=>{ctx.beginPath();ctx.arc(e.x,e.y,3.6,0,6.29);ctx.fill();ctx.stroke();});}
  ctx.restore();ctx.strokeStyle=PAL['cv-soft'];ctx.lineWidth=2;ctx.beginPath();ctx.arc(ZX,ZY,ZR,0,6.29);ctx.stroke();
  // electrodes at the circle edge when charge is flowing
  if(on){ctx.fillStyle=PAL['s2'];rr(ctx,ZX-ZR-10,ZY-40,10,80,3);ctx.fill();ctx.fillStyle=PAL['s1'];rr(ctx,ZX+ZR,ZY-40,10,80,3);ctx.fill();txt(ctx,'−',ZX-ZR-22,ZY+1,{s:18*k,w:800,a:'center',b:'middle',c:PAL['s2']});txt(ctx,'+',ZX+ZR+22,ZY+1,{s:18*k,w:800,a:'center',b:'middle',c:PAL['s1']});}
  const cap={ionic:st==='melt'||st==='aq'?'free ions carry charge':st==='solid'?'ions locked in a lattice':'ions stay in the solid',molecular:st==='aq'?'whole molecules, no ions':'neutral molecules',network:s.graphite?'delocalized electrons along layers':'one network of Si–O bonds',metallic:s.alloy==='sub'?'Zn swapped in for some Cu':s.alloy==='int'?'C atoms in the holes':'metal ions in a sea of electrons'}[s.type];
  txt(ctx,cap,ZX,ZY+ZR+26,{s:14*k,w:700,a:'center'});}

BT.onLevel=sync;
BioLab.register(BT);
})();
