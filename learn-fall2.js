/* Learn it for avgmass, bondtypes, stoich and goldenpenny (Nov 18, 2026, fall-tools session, helper C).
   Same shape as learn-more.js: one BioLab.addLearn block, why questions via addReview for tools that had none,
   and three extra goldenpenny questions appended to the ones in review.js. Loaded after learn-more.js. */
(function(){
/* ---- shared helpers for learn-more.js (copied into each site's file) ---- */
const H=BioLab.h,PAL=H.PAL;
const RED='#b3261e',GREEN='#1b7a3a',BLUE='#1f5fbf',HI='#c8102e';
const DEF=id=>BioLab.defs.find(d=>d.id===id);
/* the tool's own walkthrough steps, captured before Learn it replaces them */
const TOUR={};BioLab.defs.forEach(d=>{TOUR[d.id]=(d.tour||[]).slice();});
const TS=(id,title)=>{const s=(TOUR[id]||[]).find(x=>{const t=typeof x.title==='object'?Object.values(x.title).join('|'):String(x.title||'');return t.indexOf(title)>=0;});return s&&s.setup?s.setup:null;};
const tour=(id,title)=>sim=>{const f=TS(id,title);if(f)f(sim);};
const met=(sim,id)=>(sim.def.metrics||[]).find(m=>m.id===id);
const M=(sim,id)=>{const m=met(sim,id);if(!m)return NaN;try{return m.get(sim);}catch(e){return NaN;}};
const pick=(v)=>{if(v&&typeof v==='object'){const L=H.level||'bio';return v[L]||(L==='ap'&&v.honors)||v.bio||Object.values(v)[0];}return v;};
/* formatted metric: "label: value unit" or just value */
const F=(sim,id,d)=>{const m=met(sim,id);if(!m)return '…';let v;try{v=m.get(sim);}catch(e){return '…';}
  if(v==null)return '…';if(typeof v==='string')return v;if(!isFinite(v))return '…';
  const dd=d!=null?d:(m.d!=null?m.d:1);let s=Math.abs(v)>=1e4&&dd===0?Math.round(v).toLocaleString('en-US'):v.toFixed(dd);
  const u=pick(m.unit);return s+(u&&!/^\(|^of |^\(/.test(u)&&u.length<14?' '+u:'');};
const FL=(sim,id,d)=>{const m=met(sim,id);return (m?pick(m.label):id)+': '+F(sim,id,d);};
/* card: word-wrapped rows. pos: [x,y] top-left, or {x,y,w,up} */
function card(ctx,k,x,y,w,L,o){o=o||{};const kk=Math.min(k,1.35),pad=10*kk,rows=[];
  L.filter(r=>r!==''&&r!=null).forEach(r=>{const t=Array.isArray(r)?r:[r,{}],op=t[1]||{},sz=(op.s||13)*kk;ctx.font=(op.w||600)+' '+sz+'px '+H.FONT;
    const words=String(t[0]).split(' ');let cur='';words.forEach(wd=>{const tr=cur?cur+' '+wd:wd;if(cur&&ctx.measureText(tr).width>w-2*pad){rows.push([cur,op,sz]);cur=wd;}else cur=tr;});if(cur)rows.push([cur,op,sz]);});
  let h=pad*1.6;rows.forEach(r=>h+=r[2]*1.35);if(o.up)y-=h;
  ctx.save();H.rr(ctx,x,y,w,h,9);ctx.fillStyle=PAL['cv-sol']||PAL['card'];ctx.globalAlpha=0.96;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=o.hi===false?1.2:2.5;ctx.strokeStyle=o.hi===false?PAL['cv-soft']:HI;ctx.stroke();
  let yy=y+pad*0.8;rows.forEach(([s,op,sz])=>{yy+=sz*1.1;H.txt(ctx,s,x+pad,yy,{s:sz,w:op.w||600,c:op.c||PAL['cv-ink']});yy+=sz*0.25;});ctx.restore();return h;}
/* red ring around the part of the picture that matters in this step */
function ring(ctx,k,r,tau){if(!r)return;const a=0.55+0.45*Math.sin((tau||0)*4);ctx.save();ctx.globalAlpha=a;ctx.lineWidth=3;ctx.strokeStyle=HI;ctx.setLineDash([7,5]);H.rr(ctx,r[0],r[1],r[2],r[3],10);ctx.stroke();ctx.restore();}
const atT=(sim,tau,t,key,fn)=>{sim._at=sim._at||{};const kk=(sim.lnKey||'')+':'+key;if(tau>=t&&!sim._at[kk]){sim._at[kk]=1;fn(sim);}};
const atReset=sim=>{sim._at={};};
const L={},R={};
const act=(sim,id)=>{const a=(sim.def.actions||[]).find(x=>x.id===id);if(a)a.run(sim);};
/* one-line banner card along the bottom edge */
const banner=(ctx,k,LH,rows,x,w)=>card(ctx,k,x==null?8:x,LH-6,w||784,rows,{up:true});

/* ---------- avgmass ---------- */
const amCard=(ctx,k,rows)=>card(ctx,k,16,62,300,rows);
const fire=(sim,n)=>{act(sim,'clr');act(sim,n>=10000?'f10k':'f100');};
L.avgmass={
  goals:{
    bio:['Why the mass on the periodic table is an average','How percent abundance weights that average','How a mass spectrometer sorts atoms by mass','Why no single atom has the average mass'],
    honors:['How to calculate a weighted average from abundance data','Why a plain average of the isotope masses is wrong'],
    ap:['How to read abundances off a mass spectrum','How to work backward from an average to the abundances','Why Cl₂ shows three peaks in a 9 : 6 : 1 ratio']},
  matters:'Every molar mass you use in a chemistry problem is this weighted average. Labs use mass spectrometers to date rocks, check athletes for banned drugs and find where food came from, all by counting atoms of each mass.',
  steps:[
    {key:'bag',title:'Two kinds of penny',run:tour('avgmass','A bag of pennium'),pause:true,focus:[0,258,480,192],
     see:'A bag of 50 pennies spills on the bench. They look alike, but old ones (before 1982) are copper, 3.11 g, and newer ones have a zinc core, 2.50 g.',
     why:'Isotopes are like this: atoms of one element that act alike but have different masses.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[4,262,472,182],tau);amCard(ctx,k,[['Old: 3.11 g   New: 2.50 g',{w:800}]]);}},
    {key:'sort',title:'Sort and count',run:tour('avgmass','Sort by type'),speed:0.5,focus:[0,258,480,192],
     see:'The pennies slide into two piles, and each pile is counted.',
     why:'Each count ÷ the total is that type’s <b>percent abundance</b>, like the share of each isotope in nature.',
     overlay(sim,ctx,LH,k){amCard(ctx,k,[[FL(sim,'ab'),{w:800}]]);}},
    {key:'weigh',title:'The weighted average',run:tour('avgmass','Weigh and average'),pause:true,focus:[488,16,300,420],
     see:'Each pile is weighed. The panel multiplies each type’s average mass by its fraction of the bag, then adds.',
     why:'Average = Σ(fraction × mass). It matches the whole bag’s mass ÷ the count: two roads to one answer.',
     overlay(sim,ctx,LH,k){amCard(ctx,k,[[FL(sim,'wavg',3),{w:800,c:GREEN}],[FL(sim,'chk',3)]]);}},
    {key:'hook',title:'Your question: 1 penny in 4 is old',pause:true,focus:[0,258,480,192],
     run(sim){sim.def.onChallenge(sim,{instant:true,set:{mode:'pennium',size:100},bag:[0.25,0.75]},'done');},
     see:'A jar of 100 pennies: 25 old ones (3.11 g) and 75 new ones (2.50 g), sorted and weighed.',
     why:'0.25 × 3.11 + 0.75 × 2.50 = 2.65 g. The average leans toward the common kind. No single penny weighs 2.65 g.',
     overlay(sim,ctx,LH,k){amCard(ctx,k,[['Average penny: '+F(sim,'wavg',2),{w:800,c:GREEN}],['Every real penny: 3.11 g or 2.50 g']]);}},
    {key:'simple',lvl:'honors',title:'Why a plain average is wrong',set:{size:100},pause:true,focus:[488,16,300,420],
     run(sim){if(!sim.st.bag||sim.st.bag.phase<2||sim.st.bag.items.length!==100)sim.def.onChallenge(sim,{instant:true,set:{mode:'pennium',size:100},bag:[0.25,0.75]},'done');},
     see:'Same jar. A plain average of 3.11 g and 2.50 g gives about 2.8 g.',
     why:'That counts both kinds as equally common. With three new pennies for every old one, the true average is 2.65 g.',
     overlay(sim,ctx,LH,k){amCard(ctx,k,[[FL(sim,'simple',2),{c:RED,w:700}],[FL(sim,'wavg',2),{w:800,c:GREEN}]]);}},
    {key:'spec',title:'A mass spectrometer',set:{mode:'spec',el:'Cl'},speed:0.3,focus:[0,60,480,390],
     see:'Chlorine atoms enter at the left. Each one loses an electron (1), speeds up (2), curves in a magnet (3) and hits the detector (4).',
     why:'Every ion gets the same push, so the magnet sorts by mass: lighter ³⁵Cl⁺ curves more and lands closer.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[6,64,470,382],tau);}},
    {key:'few',title:'A few atoms: a rough average',set:{mode:'spec',el:'Cl'},speed:1,focus:[488,16,300,420],run:sim=>fire(sim,100),
     see:'Fire 100 chlorine atoms. The bars grow unevenly, and “Your average” is a little off 35.45 amu.',
     why:'A small sample can be off just by luck, like flipping a coin 10 times. Counting more atoms fixes that.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[490,18,298,418],tau);}},
    {key:'many',title:'Your graph: the mass spectrum',set:{mode:'spec',el:'Cl'},speed:1,focus:[488,16,300,420],run:sim=>fire(sim,10000),
     see:'10,000 atoms: two peaks, 75.8% at mass 35 and 24.2% at mass 37. This bar graph is a <b>mass spectrum</b>.',
     why:'Peak heights are the abundances: 0.758 × 34.97 + 0.242 × 36.97 = 35.45 amu, the periodic-table mass.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[490,18,298,418],tau);}},
    {key:'br',title:'Bromine: two equal peaks',set:{mode:'spec',el:'Br'},speed:1,focus:[488,16,300,420],run:sim=>fire(sim,10000),
     see:'Bromine’s two peaks, ⁷⁹Br and ⁸¹Br, are almost the same height.',
     why:'At 50.7% and 49.3%, the weighted average, 79.90 amu, lands almost halfway. It matches a plain average only when the isotopes are equally common.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[490,18,298,418],tau);}},
    {key:'boron',lvl:'ap',title:'Working backward: boron',set:{mode:'spec',el:'B'},speed:1,focus:[488,16,300,420],run:sim=>fire(sim,10000),
     see:'Boron: ¹⁰B is 10.013 amu and ¹¹B is 11.009 amu. The table says 10.81 amu.',
     why:'Let x be the ¹¹B fraction: 11.009x + 10.013(1 − x) = 10.81, so x = 0.80. The spectrum agrees: 80% ¹¹B.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[490,18,298,418],tau);}},
    {key:'cl2',lvl:'ap',title:'Cl₂: three peaks',set:{mode:'spec',el:'Cl',dia:true},speed:1,focus:[488,16,300,420],run:sim=>fire(sim,10000),
     see:'Chlorine gas, Cl₂⁺, shows peaks at mass 70, 72 and 74.',
     why:'Atoms pair at random: 0.758², 2(0.758)(0.242) and 0.242² give 57%, 37% and 6%, about 9 : 6 : 1.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[490,18,298,418],tau);}}
  ],
  useIt:[
    {do:'Work out your grade when tests count more than homework.',why:'A class grade is a weighted average: each score times its weight, added up, just like isotope masses times their abundances.'},
    {do:'Use the molar mass on the periodic table, not a single isotope’s mass, when you weigh out chemicals.',why:'Any real sample is a natural mix of isotopes, so its atoms average out to the table value.'},
    {do:'Expect an “average” that nobody actually has.',why:'Like 2.65 g pennies or 35.45 amu chlorine atoms, an average describes the whole group, not any one member.'}],
  tryIt:[{title:'the penny jar (15 minutes)',steps:['Grab 20 pennies. Sort them into “before 1982” and “1982 or later” by the date.','Count each pile and work out each pile’s percent.','Average = (fraction old × 3.11 g) + (fraction new × 2.50 g). If you have a kitchen scale, weigh all 20 and divide by 20 to check.'],look:'Your average lands between 2.50 g and 3.11 g, closer to whichever kind you have more of.'}]};
R.avgmass={questions:[
  {id:'whyavg',kind:'test',lvl:'bio',q:'Why is chlorine’s mass on the periodic table 35.45 amu instead of a whole number?',choices:['It is a weighted average of ³⁵Cl and ³⁷Cl','Each chlorine atom has 35.45 protons','The mass of ³⁵Cl was rounded up a little','Electrons add 0.45 amu to every atom'],correct:0,
   steps:['Chlorine is a mix of two isotopes, ³⁵Cl and ³⁷Cl.','The table lists the average, weighted by how common each is.','No single atom has a mass of 35.45 amu.']},
  {id:'pennynum',kind:'test',lvl:'bio',q:'A jar is 40% old pennies (3.11 g) and 60% new pennies (2.50 g). What is the average mass of one penny?',num:{ans:2.74,tol:0.01,unit:'g'},
   steps:['Multiply each mass by its fraction: 0.40 × 3.11 = 1.244 g and 0.60 × 2.50 = 1.500 g.','Add them: 1.244 + 1.500 = 2.744 g.','About 2.74 g.']},
  {id:'copper',kind:'test',lvl:'bio',q:'Copper is 69% ⁶³Cu and 31% ⁶⁵Cu. Its average atomic mass is closest to…',choices:['63.6 amu','64.0 amu','64.4 amu','65.0 amu'],correct:0,
   steps:['More than two-thirds of the atoms are the lighter ⁶³Cu.','So the average sits closer to 63 than to 65.','0.69 × 63 + 0.31 × 65 ≈ 63.6 amu (table value 63.55).']},
  {id:'gallium',kind:'test',lvl:'honors',q:'Gallium is 60.1% ⁶⁹Ga (68.926 amu) and 39.9% ⁷¹Ga (70.925 amu). What is its average atomic mass?',num:{ans:69.72,tol:0.02,unit:'amu'},
   steps:['0.601 × 68.926 = 41.42 amu.','0.399 × 70.925 = 28.30 amu.','41.42 + 28.30 = 69.72 amu.']},
  {id:'bend',kind:'test',lvl:'honors',q:'In a mass spectrometer, why does ³⁷Cl⁺ land farther from the entrance than ³⁵Cl⁺?',choices:['It is heavier, so the magnet bends it less','It has more charge, so it is pushed harder','It moves faster, so it travels farther','It has extra electrons that repel the magnet'],correct:0,
   steps:['Both ions get the same charge and the same push.','The heavier ion has more momentum, so the magnetic force turns it less sharply.','A wider curve lands farther away.']},
  {id:'lithium',kind:'test',lvl:'ap',q:'An element has two isotopes, 6.015 amu and 7.016 amu, and an average of 6.94 amu. What percent of its atoms are the heavier isotope?',num:{ans:92.4,tol:0.3,unit:'%'},
   steps:['Let x be the heavier fraction: 7.016x + 6.015(1 − x) = 6.94.','1.001x = 6.94 − 6.015 = 0.925, so x = 0.924.','About 92.4%.']},
  {id:'br2',kind:'test',lvl:'ap',q:'Bromine is about 50.7% ⁷⁹Br and 49.3% ⁸¹Br. In the Br₂⁺ spectrum, the peaks at mass 158, 160 and 162 are in the ratio about…',choices:['1 : 2 : 1','1 : 1 : 1','3 : 1 : 0','9 : 6 : 1'],correct:0,
   steps:['Two atoms pair at random, so the peaks follow (a + b)².','With a ≈ b ≈ 0.5: a² : 2ab : b² = 0.25 : 0.50 : 0.25.','That is 1 : 2 : 1. (9 : 6 : 1 is chlorine, with a 3 : 1 mix.)']}
  ]};

/* ---------- bondtypes ---------- */
const btCard=(ctx,k,LH,txt)=>card(ctx,k,420,3,372,[[txt,{w:800}]]);
const bulb=sim=>{const lit=F(sim,'bulb'),I=M(sim,'I');return 'Bulb: '+String(lit).toLowerCase()+((H.level&&H.level!=='bio'&&isFinite(I)&&I>=1)?' · '+I.toFixed(0)+' mA':'');};
const ZOOM=[598-170,212-170,340,340];
L.bondtypes={
  goals:{
    bio:['How a conductivity tester shows whether charges can move','Why salt conducts melted or dissolved, but not as a solid','Why sugar water does not conduct','How metals and covalent networks behave differently'],
    honors:['How to classify a solid as ionic, molecular, metallic or network covalent from lab tests','Why graphite conducts even though it is a covalent network'],
    ap:['How ion charge and lattice strength set melting point and solubility','Why MgO barely conducts in water']},
  matters:'The same tests sort every solid you meet: why you can’t use a salt-water wire, why pencil lead works in a battery, why sand makes glass only in a furnace, and why salt on winter roads conducts electricity in puddles.',
  steps:[
    {key:'tester',title:'The conductivity tester',run:tour('bondtypes','The conductivity tester'),pause:true,focus:[10,40,380,400],
     see:'A 9 V battery, a bulb and two metal probes touching dry salt crystals. The bulb is dark.',
     why:'The bulb lights only if charge can flow through the sample, from one probe to the other.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[12,42,376,330],tau);btCard(ctx,k,LH,bulb(sim));}},
    {key:'solid',title:'Solid salt: ions locked in place',speed:1,focus:ZOOM,
     see:'The zoom shows sodium ions (+) and chloride ions (−) packed in a grid. They only jiggle in place.',
     why:'Salt is made of charged ions, but in the solid they can’t move, so no charge flows.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,ZOOM,tau);btCard(ctx,k,LH,bulb(sim));}},
    {key:'melt',title:'Melt it: ions on the move',set:{setup:'heat',temp:850},speed:1,focus:[0,0,800,450],
     see:'Heated to 850 °C, past its melting point of 801 °C, the salt is a liquid. The ions slide past each other, and the bulb lights.',
     why:'Moving ions carry charge through the liquid.',
     overlay(sim,ctx,LH,k){btCard(ctx,k,LH,bulb(sim));}},
    {key:'water',title:'Dissolve it',set:{setup:'water'},speed:1,focus:[0,0,800,450],
     see:'Salt in water: the ions drift apart, each one free, and the bulb lights.',
     why:'Water pulls the ions out of the grid (they <b>dissociate</b>). Free ions conduct, so salt is an <b>electrolyte</b>.',
     overlay(sim,ctx,LH,k){btCard(ctx,k,LH,bulb(sim));}},
    {key:'sugar',title:'Sugar dissolves, but stays dark',set:{sub:'sugar',setup:'water'},speed:1,focus:[0,0,800,450],
     see:'Sugar dissolves just as easily. The zoom shows whole sugar molecules, and the bulb stays dark.',
     why:'Sugar is held together by covalent bonds. Its molecules stay whole in water: no ions, so no current.',
     overlay(sim,ctx,LH,k){btCard(ctx,k,LH,bulb(sim));}},
    {key:'hook',title:'Your question: the unlabeled jar',set:{sub:'sugar',setup:'heat',temp:200},speed:1,focus:[0,0,800,450],
     see:'One more clue: at 200 °C sugar melts and turns brown. Salt stays solid until 801 °C.',
     why:'So dissolve some and test it. If the bulb lights (about 160 mA), it’s salt; if it stays dark, sugar. Never taste lab chemicals.',
     overlay(sim,ctx,LH,k){btCard(ctx,k,LH,'Sugar at 200 °C: '+String(F(sim,'state')).toLowerCase());}},
    {key:'cu',title:'Copper: a sea of electrons',set:{sub:'Cu',setup:'solid'},speed:1,focus:ZOOM,
     see:'A solid copper bar lights the bulb. In the zoom, small electrons swarm between the copper ions.',
     why:'Metal atoms share their outer electrons in a moving “sea”. Those electrons carry charge, even in a solid.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,ZOOM,tau);btCard(ctx,k,LH,bulb(sim));}},
    {key:'sand',title:'Sand: one giant molecule',set:{sub:'SiO2',setup:'heat',temp:1500},speed:1,focus:[0,0,800,450],
     see:'Quartz sand in a 1500 °C flame: still solid, and the bulb stays dark.',
     why:'Every atom is covalently bonded into one network. Melting it means breaking those bonds (above 1700 °C), and it has no free charges.',
     overlay(sim,ctx,LH,k){btCard(ctx,k,LH,'At '+F(sim,'temp',0)+': '+String(F(sim,'state')).toLowerCase()+' · '+String(F(sim,'bulb')).toLowerCase());}},
    {key:'graphite',lvl:'honors',title:'The graphite exception',set:{sub:'graphite',setup:'solid'},speed:1,focus:ZOOM,
     see:'Pencil lead (graphite) lights the bulb. The zoom shows flat layers with electrons moving along them.',
     why:'Graphite is a covalent network, but each carbon bonds to only 3 neighbors. The fourth electron is free to move along its layer.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,ZOOM,tau);btCard(ctx,k,LH,bulb(sim));}},
    {key:'table',title:'Your table: four kinds of solid',pause:true,focus:[0,0,800,450],
     see:'The four kinds of solid you tested, side by side.',
     why:'Charges that can move decide conductivity. Bond strength decides melting point. This table is what tests ask you to fill in.',
     overlay(sim,ctx,LH,k){const K=BioLab.lg;K.dim(ctx,LH);const kk=Math.min(k,1.2),cols=[150,300,450,620],x0=24,rows=[
       ['','Ionic (salt)','Molecular (sugar)','Metallic (copper)','Network (sand)'],
       ['Solid conducts?','no','no','yes','no*'],
       ['Melted conducts?','yes','no','yes','—'],
       ['In water conducts?','yes','no','doesn’t dissolve','doesn’t dissolve'],
       ['Melting point','high (801 °C)','low (186 °C)','high (1085 °C)','very high (>1700 °C)']];
       const xs=[x0,x0+170,x0+320,x0+470,x0+620],y0=70,dy=64*Math.min(kk,1.1);
       rows.forEach((r,i)=>{r.forEach((c,j)=>{if(!c)return;const w=j===0||i===0?800:600,col=c==='yes'?GREEN:c==='no'?RED:PAL['cv-ink'];
         const lines=String(c).length>13&&j>0?[c.slice(0,c.indexOf(' ')),c.slice(c.indexOf(' ')+1)]:[c];
         lines.forEach((ln,q)=>H.txt(ctx,ln,xs[j],y0+i*dy+q*16*kk,{s:(i===0?13.5:13)*kk,w:i===0||j===0?800:600,c:i===0?PAL['cv-ink']:col}));});
         if(i<rows.length-1){ctx.save();ctx.strokeStyle=PAL['cv-soft'];ctx.globalAlpha=.4;ctx.beginPath();ctx.moveTo(x0,y0+i*dy+dy*0.62);ctx.lineTo(790,y0+i*dy+dy*0.62);ctx.stroke();ctx.restore();}});
       H.txt(ctx,'*Graphite is the exception: its layers conduct.',x0,y0+rows.length*dy-8,{s:12*kk,c:PAL['cv-soft']});}},
    {key:'mgo',lvl:'ap',title:'MgO: ionic, but barely dissolves',set:{sub:'MgO',setup:'water'},speed:1,focus:[0,0,800,450],
     see:'Magnesium oxide in water gives only a very faint glow, about 3 mA.',
     why:'Mg²⁺ and O²⁻ have double charges, so their attraction is about four times stronger. Few ions break free, and it melts only at 2852 °C.',
     overlay(sim,ctx,LH,k){btCard(ctx,k,LH,bulb(sim));}}
  ],
  useIt:[
    {do:'Never use electrical things near puddles of salty water, like winter slush.',why:'Dissolved salt is full of moving ions, so the water conducts far better than pure water would.'},
    {do:'Use a pencil line as a resistor or electrode in a simple circuit experiment.',why:'Graphite conducts along its layers, unlike most covalent solids.'},
    {do:'Tell salt from sugar without tasting by dissolving a pinch and testing it.',why:'Only the ionic compound makes free ions in water.'}],
  tryIt:[{title:'the salt-water circuit (15 minutes, with an adult)',steps:['Tape two wires to a 9 V battery and a small LED or flashlight bulb, leaving two bare ends free.','Dip the free ends, not touching, into a cup of tap water, then stir in a spoon of salt.','Try a cup of sugar water too.'],look:'Salt water makes the LED glow brighter; sugar water does not. Unplug when done: the wires corrode.'}]};

/* ---------- stoich ---------- */
const stCard=(ctx,k,LH,rows)=>card(ctx,k,540,LH-10,252,rows,{up:true});
L.stoich={
  goals:{
    bio:['How a balanced equation works like a recipe','Why the reactant that runs out first decides how much product forms','What the excess reactant is','Why atoms are rearranged, never made or lost'],
    honors:['Why you compare moles, not grams, to find the limiting reactant','How to find the theoretical and percent yield'],
    ap:['How to use mole ratios when the coefficients aren’t 1','Why total mass stays the same even as moles change']},
  matters:'Factories, pharmacies and kitchens all ask the same question: with what I have, how much can I make, and what is left over? Getting it wrong wastes expensive ingredients or, in medicine, gets a dose wrong.',
  steps:[
    {key:'recipe',title:'The recipe',run:tour('stoich','The recipe'),pause:true,focus:[0,6,800,50],
     see:'Read the equation across the top: 2H₂ + O₂ → 2H₂O.',
     why:'The coefficients count molecules: 2 hydrogen molecules react with 1 oxygen molecule to make 2 water molecules.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[150,6,500,46],tau);}},
    {key:'start',title:'What you start with',pause:true,focus:[536,58,258,380],
     see:'The box holds 6 H₂ (white pairs) and 4 O₂ (red pairs). The bars on the right count them.',
     why:'There is more H₂ than O₂, but the recipe uses H₂ twice as fast.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[536,58,258,380],tau);}},
    {key:'react',title:'Watch them react',speed:0.3,focus:[14,58,512,380],
     see:'Each time 2 H₂ meet 1 O₂, they become 2 H₂O, and the green bar grows.',
     why:'Atoms are only rearranged: 4 H and 2 O go in, and 4 H and 2 O come out.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[FL(sim,'p1',0),{w:800,c:GREEN}]]);}},
    {key:'out',title:'One runs out',speed:1,focus:[536,58,258,380],
     see:'All 6 H₂ are used up. 1 O₂ is left with nothing to react with.',
     why:'H₂ is the <b>limiting reactant</b>: 6 H₂ need only 3 O₂. The leftover O₂ is the <b>excess</b>. The limiting reactant sets the product: 6 H₂O.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[FL(sim,'lim'),{w:800,c:RED}],[FL(sim,'p1',0)]]);}},
    {key:'hook',title:'Your question: 6 eggs, 2 cups of mix',set:{aN:6,bN:2},fresh:true,speed:0.8,focus:[536,58,258,380],
     see:'6 H₂ play the eggs (2 per batch) and 2 O₂ the cups of mix. 4 H₂O form, and 2 H₂ are left.',
     why:'O₂, like the mix, runs out first: 2 batches, with 2 eggs left over. The limiting reactant decides how much you make.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[FL(sim,'lim'),{w:800,c:RED}],[FL(sim,'r1',0)]]);}},
    {key:'graph',title:'Your graph: more O₂, more water, until…',set:{aN:6,bN:4},pause:true,focus:[0,0,800,450],
     see:'Keep 6 H₂ and add O₂ one at a time. The graph shows the water made.',
     why:'Each O₂ makes 2 H₂O until the 6 H₂ are gone, at 3 O₂. After that the line goes flat: extra O₂ is excess.',
     overlay(sim,ctx,LH,k,tau){const K=BioLab.lg,kk=Math.min(k,1.25);K.dim(ctx,LH);const B={x0:120,x1:720,y0:80,y1:360},xr=[0,6],f=Math.min(1,tau/3);
       const w=o=>Math.min(2*o,6);K.axes(ctx,B,k,{xr,xt:[0,1,2,3,4,5,6].map(v=>[v,String(v)]),yt:[0,2,4,6,8].map(v=>[v/8,String(v)]),xl:'O₂ molecules added (with 6 H₂)',yl:'H₂O molecules made'});
       K.curve(ctx,B,xr,o=>w(o)/8,6*f,GREEN);
       if(f>=0.5){K.dot(ctx,K.X(B,xr,3),K.Y(B,6/8),RED,8);K.tagA(ctx,'3 O₂: H₂ runs out',K.X(B,xr,3)+12,K.Y(B,6/8)-30,Math.min(k,1.3),{s:13,hi:true},'l');}
       if(f>=0.67){K.dot(ctx,K.X(B,xr,4),K.Y(B,6/8),PAL['cv-ink'],6);K.tagA(ctx,'Your box: 4 O₂ → 6 H₂O, 1 O₂ left',K.X(B,xr,4)-6,K.Y(B,6/8)+36,Math.min(k,1.3),{s:12.5},'l');}}},
    {key:'grams',lvl:'honors',title:'Grams are not moles',set:{units:'g',aG:4,bG:16},fresh:true,speed:0.6,focus:[536,58,258,380],
     see:'Now 4.0 g of H₂ and 16.0 g of O₂: four times more O₂ by mass, yet O₂ runs out.',
     why:'H₂ is light (2.0 g/mol), so 4.0 g is 2.0 mol. 16.0 g of O₂ (32.0 g/mol) is only 0.50 mol, enough for 1.0 mol of H₂.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[FL(sim,'lim'),{w:800,c:RED}],[FL(sim,'theo',1)]]);}},
    {key:'map',lvl:'honors',title:'The stoichiometry map',set:{units:'g',aG:4,bG:16},pause:true,focus:[0,0,800,450],
     see:'The four boxes trace one reactant, O₂, all the way to grams of water.',
     why:'Grams → moles (÷ molar mass) → moles of product (× mole ratio) → grams (× molar mass). Do it for each reactant; the smaller answer is the <b>theoretical yield</b>.',
     overlay(sim,ctx,LH,k){const K=BioLab.lg,kk=Math.min(k,1.2);K.dim(ctx,LH);const bx=[[20,'16.0 g O₂'],[215,'0.500 mol O₂'],[410,'1.00 mol H₂O'],[605,'18.0 g H₂O']],y=170,w=175,h=70;
       bx.forEach(([x,t],i)=>{ctx.save();H.rr(ctx,x,y,w,h,10);ctx.fillStyle=i===3?'#e7f3ea':PAL['cv-sol']||'#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=i===3?GREEN:PAL['cv-ink'];ctx.stroke();ctx.restore();H.txt(ctx,t,x+w/2,y+h/2,{s:15*kk,w:800,a:'center',b:'middle'});});
       [['÷ 32.0 g/mol',203],['× 2 H₂O / 1 O₂',398],['× 18.0 g/mol',593]].forEach(([t,x])=>{H.txt(ctx,'→',x,y+h/2,{s:20,w:800,a:'center',b:'middle',c:RED});H.txt(ctx,t,x,y+h+28*kk,{s:12.5*kk,w:700,a:'center',c:RED});});
       H.txt(ctx,'From H₂: 4.0 g → 2.0 mol H₂ → 2.0 mol H₂O → 36 g. The smaller answer wins: 18.0 g.',400,y+h+80*kk,{s:13*kk,w:600,a:'center'});}},
    {key:'yield',lvl:'honors',title:'Percent yield',set:{units:'g',aG:4,bG:16},fresh:true,speed:1,focus:[536,58,258,380],
     see:'The reaction finishes, but only 15.3 g of water is collected, not 18.0 g.',
     why:'Percent yield = actual ÷ theoretical × 100 = 15.3 ÷ 18.0 × 100 = 85%. Some product is always lost. Over 100% means it was wet or impure.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[FL(sim,'act',1)],[FL(sim,'pyield',0),{w:800,c:GREEN}]]);}},
    {key:'ch4',lvl:'ap',title:'Methane: a 1 : 2 recipe',set:{rx:'ch4',units:'mol',aM:1,bM:1.5},fresh:true,speed:1,focus:[536,58,258,380],
     see:'1.00 mol of CH₄ and 1.50 mol of O₂ burn: CH₄ + 2O₂ → CO₂ + 2H₂O.',
     why:'1.00 mol CH₄ needs 2.00 mol O₂, so O₂ is limiting. 1.50 mol O₂ × (1 CO₂ / 2 O₂) = 0.75 mol CO₂, with 0.25 mol CH₄ left.',
     overlay(sim,ctx,LH,k){stCard(ctx,k,LH,[[FL(sim,'lim'),{w:800,c:RED}],[FL(sim,'p1',2)],[FL(sim,'mass')]]);}}
  ],
  useIt:[
    {do:'Before you cook, check which ingredient will run out first.',why:'A recipe is a mole ratio. The ingredient you have least of, compared with what the recipe needs, limits how many batches you can make.'},
    {do:'Don’t judge “which runs out” by weight alone.',why:'Light ingredients (or molecules) can be many in number. Compare in the recipe’s own units, like eggs or moles.'},
    {do:'Expect less than the full amount when you make something.',why:'Spills and leftovers mean actual yield is always below theoretical yield; factories track percent yield to save money.'}],
  tryIt:[{title:'the sandwich factory (10 minutes)',steps:['Lay out 7 slices of bread and 5 slices of cheese. Your recipe: 2 bread + 1 cheese → 1 sandwich.','Predict how many sandwiches you can make and what is left over.','Build them (or just stack them) and check.'],look:'3 sandwiches, with 1 bread and 2 cheese left. The bread is the limiting reactant, even though you started with more bread than cheese.'}]};

/* ---------- goldenpenny ---------- */
const gpBanner=(ctx,k,LH,rows)=>banner(ctx,k,LH,[rows.filter(Boolean).join('   ·   ')]);
const HEAT={view:'heat',source:'flame'};
const quenchAtGold=(sim)=>{const st=sim.st;if(!st||st.view!=='heat'||!st.heating)return;const x=M(sim,'xs');if(x>=68&&String(M(sim,'col'))==='gold')act(sim,'quench');};
L.goldenpenny={
  goals:{
    bio:['What is under the copper skin of a modern penny','How a zinc bath turns a penny silver','How heat mixes zinc and copper into brass','How density proves the golden penny is not gold'],
    honors:['Why forming brass is a physical change, not a chemical one','Why too much heat ruins the gold color','How atoms move (diffuse) faster when metal is hot']},
  matters:'Alchemists spent centuries trying to turn cheap metal into gold. This lab shows why color fools people and density doesn’t, the same test jewelers and the U.S. Mint use today.',
  steps:[
    {key:'modern',title:'A modern penny',run:tour('goldenpenny','A modern penny'),pause:true,focus:[430,60,370,330],
     see:'A penny made after 1982. The zoom on the right slices through its surface: a thin copper skin over a zinc core.',
     why:'The copper is only about 10 µm thick, thinner than a hair. Almost all of the penny is zinc.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[432,62,366,326],tau);}},
    {key:'bath',title:'The zinc bath',speed:0.5,focus:[100,180,230,170],
     see:'The penny lies on zinc granules in hot sodium hydroxide at 75 °C. Watch the timer and the zoom.',
     why:'Zinc dissolves from the granules and plates back out as zinc metal wherever the penny touches the zinc.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[100,180,230,170],tau);gpBanner(ctx,k,LH,[FL(sim,'col'),H.level!=='bio'?FL(sim,'zn',2):'']);}},
    {key:'silver',title:'A silver penny',speed:1.5,focus:[430,60,370,330],
     see:'In about a minute the penny looks silver. The zoom shows a new zinc layer, about 1 µm thick, on the copper.',
     why:'Underneath, it is the same penny. Only a thin coat of zinc was added.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[320,50,100,110],tau);gpBanner(ctx,k,LH,[FL(sim,'col'),H.level!=='bio'?FL(sim,'zn',2):'']);}},
    {key:'flame',title:'Into the flame',set:HEAT,speed:0.4,focus:[130,110,200,280],
     see:'The silver penny is held in the outer flame, just above the blue cone. Its temperature climbs.',
     why:'Heat makes atoms move faster. Zinc atoms begin slipping into the copper, and copper atoms into the zinc.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[130,110,200,280],tau);gpBanner(ctx,k,LH,[FL(sim,'T',0),FL(sim,'col')]);}},
    {key:'brass',title:'Brass forms',set:HEAT,speed:0.4,focus:[430,60,370,330],
     see:'In the zoom, the silver zinc layer turns into a yellow layer that grows down into the copper.',
     why:'Copper and zinc mix into <b>brass</b>, an alloy. No new substance forms, so it is a <b>physical change</b>.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[432,62,366,326],tau);gpBanner(ctx,k,LH,[FL(sim,'xs',0),FL(sim,'col')]);}},
    {key:'gold',title:'Gold color: quench it',set:HEAT,fresh:true,speed:1,focus:[320,50,100,110],
     see:'When the surface reaches about 70% copper, the penny turns gold, and it is dunked in cold water.',
     why:'Brass with 60–80% copper looks gold. Quenching stops the atoms from moving, so the color stays.',
     overlay(sim,ctx,LH,k,tau){quenchAtGold(sim);ring(ctx,k,[320,50,100,110],tau);gpBanner(ctx,k,LH,[FL(sim,'xs',0),FL(sim,'col')]);}},
    {key:'hot',lvl:'honors',title:'Too much heat',set:HEAT,fresh:true,speed:1,focus:[430,60,370,330],
     see:'Heated again, but not quenched. The gold fades to bronze.',
     why:'Zinc keeps spreading deeper, so the surface passes 80% copper, and hot metal reacts with oxygen. The zinc core would melt at 420 °C.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[320,50,100,110],tau);gpBanner(ctx,k,LH,[FL(sim,'T',0),FL(sim,'xs',0),FL(sim,'col')]);}},
    {key:'atoms',lvl:'honors',title:'Zoom to the atoms',set:Object.assign({zoom:'atoms'},HEAT),fresh:true,speed:0.5,focus:[430,60,370,330],
     see:'The zoom now shows single atoms near the surface as the penny heats: copper and zinc trading places.',
     why:'Atoms hop into gaps beside them: <b>diffusion</b>. Hotter metal hops far faster, so brass forms in seconds at 400 °C but hardly at all at room temperature.',
     overlay(sim,ctx,LH,k,tau){quenchAtGold(sim);ring(ctx,k,[432,62,366,326],tau);gpBanner(ctx,k,LH,[FL(sim,'T',0),FL(sim,'xs',0)]);}},
    {key:'test',title:'Your question: is it gold?',set:{view:'gold'},pause:true,focus:[430,30,370,370],
     see:'The density bars: gold is 19.30 g/cm³. Your golden penny is 7.18 g/cm³, the same as before it was heated.',
     why:'A penny-sized piece of gold would weigh 6.7 g; this penny still weighs 2.51 g. The flame made brass, not gold.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[432,32,366,366],tau);}}
  ],
  useIt:[
    {do:'Check density, not color, before you believe a metal is gold.',why:'Brass, pyrite (“fool’s gold”) and gold-plated metal can all look gold, but only gold is 19.3 g/cm³.'},
    {do:'Expect brass hardware, keys and instruments to look gold.',why:'They are copper-zinc alloys like your penny’s surface; the copper share sets the shade.'},
    {do:'Quench or cool hot metal quickly when you want to keep how it looks.',why:'Cooling stops atoms from moving, which freezes the alloy the way it is.'}],
  tryIt:[{title:'the density check (15 minutes)',steps:['Weigh 10 pennies from 1983 or later on a kitchen scale (if you have one).','Drop them into a measuring cup of water and read how much the water rises, in mL (1 mL = 1 cm³).','Density = mass ÷ volume.'],look:'About 7 g/cm³, far below gold’s 19.3 g/cm³. Even a gold-colored coin of the same size would weigh almost three times as much if it were gold.'}]};
/* three more why questions for goldenpenny, appended to the four in review.js when the engine assigns d.review */
const GP_EXTRA=[
  {id:'isgold',kind:'test',lvl:'bio',q:'A golden penny has a mass of 2.51 g and a volume of 0.35 cm³. Is it gold (19.3 g/cm³)?',choices:['No: its density is about 7.2 g/cm³','Yes: gold-colored metal is gold','Yes, but only in its surface layer','No: gold would weigh less than 2.51 g'],correct:0,
   steps:['Density = mass ÷ volume = 2.51 ÷ 0.35 ≈ 7.2 g/cm³.','Gold is 19.3 g/cm³, almost three times as dense.','Color fooled you; density doesn’t.']},
  {id:'goldmass',kind:'test',lvl:'honors',q:'The golden penny’s volume is 0.348 cm³. A piece of gold that size (19.3 g/cm³) would weigh how many grams?',num:{ans:6.72,tol:0.05,unit:'g'},
   steps:['Mass = density × volume.','19.3 g/cm³ × 0.348 cm³ = 6.72 g.','The real penny weighs 2.51 g, so it can’t be gold.']},
  {id:'whygold',kind:'test',lvl:'honors',q:'Why does heating the silver penny turn it gold-colored?',choices:['Zinc and copper atoms mix into brass','The flame coats the penny with gold','The zinc layer burns away, leaving gold copper','Oxygen turns the zinc into a gold oxide'],correct:0,
   steps:['Heat lets atoms move between the two metals.','Copper and zinc mix into brass, an alloy.','Brass with 60–80% copper looks gold.']}];
(function(){const d=DEF('goldenpenny');if(!d)return;let rv=d.review;
  Object.defineProperty(d,'review',{configurable:true,enumerable:true,get(){return rv;},set(v){rv=v;if(v&&Array.isArray(v.questions)){const have=new Set(v.questions.map(q=>q.id));GP_EXTRA.forEach(q=>{if(!have.has(q.id))v.questions.push(q);});}}});
  if(rv)d.review=rv;})();

BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
