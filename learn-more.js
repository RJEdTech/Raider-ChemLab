/* Learn it for the last tools without it (Nov 17, 2026, last-tools session).
   One BioLab.addLearn block for this site's tools, plus Test yourself why questions (addReview) for tools that had none.
   Each step reuses the tool's own walkthrough setups (captured below before Learn it replaces the tour) and adds live number cards. */
(function(){
'use strict';
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
/* ---------- airbag ---------- */
const agCard=(ctx,k,LH,rows)=>card(ctx,k,490,64,296,rows);
const mix=sim=>{const a=(sim.def.actions||[]).find(x=>x.id==='mix');if(a)a.run(sim);};
L.airbag={
  goals:{
    bio:['How a balanced equation turns moles of one thing into moles of another','How much space a mole of gas takes up in our classroom','How to work backward from liters of gas to grams and milliliters','Why the reactant that runs out first decides how much gas you get'],
    honors:['How PV = nRT changes the answer at RJ’s altitude (0.83 atm)','Why temperature changes the gas volume'],
    ap:['How to find the limiting reactant from mismatched amounts','How the same steps size a real car air bag']},
  matters:'Pancakes that taste soapy, a bike tire inflated from a CO₂ cartridge and a car air bag that fills in 30 milliseconds are all the same calculation: how many moles of gas, and which ingredient runs out first.',
  startKey:'start',startRun:false,
  steps:[
    {key:'goal',title:'The goal: fill the bag exactly',run:tour('airbag','The goal'),pause:true,focus:[30,60,430,370],
     see:'A quart zip bag (0.946 L), a scoop of baking soda and a cup of vinegar.',
     why:'Too little gas and the bag sags; too much and it bursts. To get it exactly right you have to count molecules, and chemists count molecules in moles.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[30,60,430,370],tau);}},
    {key:'rxn',title:'The balanced equation',pause:true,focus:[0,6,800,48],
     see:'Read the equation across the top.',
     why:'NaHCO₃ + HC₂H₃O₂ → NaC₂H₃O₂ + H₂O + CO₂. Every coefficient is 1, so each mole of baking soda that reacts makes one mole of CO₂, as long as there is acid for it.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[0,6,800,48],tau);}},
    {key:'molv',title:'How much space a mole takes',pause:true,focus:[490,270,300,170],
     see:'Read the molar volume for this room.',
     why:'In our classroom (22 °C, 0.83 atm) one mole of any gas fills about 29.2 L, about the size of a backpack. So the quart bag needs 0.946 ÷ 29.2 ≈ 0.031 mol of CO₂.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'vm',1),{w:800,c:GREEN}],['Bag: 0.946 L → 0.031 mol CO₂']]);}},
    {key:'grams',title:'Moles to grams and milliliters',pause:true,focus:[30,60,430,370],
     see:'The amounts in the controls are set from that 0.031 mol.',
     why:'Baking soda: 0.031 mol × 84.01 g/mol ≈ 2.6 g, about half a teaspoon. Vinegar is 5% acetic acid, about 0.00084 mol per mL, so 0.031 mol needs about 37 mL. Equal moles of each, because the ratio is 1 : 1.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[['2.6 g NaHCO₃ ↔ 37 mL vinegar',{w:800}],['Both ≈ 0.031 mol',{w:700,c:GREEN}]]);}},
    {key:'mix',title:'Seal and mix',run:mix,speed:0.5,focus:[30,60,430,370],
     see:'The bag is sealed and the baking soda tips into the vinegar. Watch it fill.',
     why:'CO₂ bubbles out of the liquid and fills the bag. The mass of the sealed bag doesn’t change: atoms are only rearranged, from a solid and a liquid into a gas.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'vgas',3),{w:700}],[FL(sim,'full',0),{w:800,c:GREEN}]]);}},
    {key:'extra',title:'Extra baking soda does nothing',set:{soda:5.2},fresh:true,run:mix,speed:0.8,focus:[30,60,430,370],
     see:'Double the baking soda to 5.2 g, keep 37 mL of vinegar, and mix again.',
     why:'The vinegar runs out at 0.031 mol, so the gas stops there. The vinegar is the limiting reactant; the extra soda sits unreacted at the bottom. Doubling one ingredient doesn’t double the product.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'full',0),{w:800}],[FL(sim,'out'),{w:700,c:RED}]]);}},
    {key:'hook',title:'Your question: a gallon bag, 100 mL of vinegar',set:{bag:'gallon',soda:12,vin:100},fresh:true,run:mix,speed:0.8,focus:[30,60,430,370],
     see:'A gallon bag (3.785 L), a whole box of baking soda, but only 100 mL of vinegar. Mix and read how full it gets.',
     why:'It can’t fill. 100 mL of vinegar holds only 0.0837 mol of acid, so it makes only 0.0837 mol of CO₂, about 2.44 L here. Counting the liquid, the bag ends up about two-thirds full however much soda you add. To fill it you need about 149 mL of vinegar and 10.5 g of baking soda.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'vgas',2),{w:700}],[FL(sim,'full',0),{w:800,c:RED}]]);}},
    {key:'sea',lvl:'honors',title:'Same bag at sea level',set:{place:'sea'},fresh:true,run:mix,speed:0.8,focus:[490,270,300,170],
     see:'The exact RJ recipe, run at sea level (1.00 atm).',
     why:'At higher pressure each mole of gas is squeezed into less space: V = nRT/P. The same 0.031 mol fills only about 83% of the bag at sea level. So a recipe worked out for sea level would over-fill a bag up here, where the air pressure is lower.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'vm',1)],[FL(sim,'full',0),{w:800,c:RED}]]);}},
    {key:'car',lvl:'ap',title:'A real car air bag',run:tour('airbag','A real car air bag'),pause:true,focus:[0,0,800,450],
     see:'A car air bag: 2NaN₃ → 2Na + 3N₂. Read the moles of N₂ and the mass of sodium azide.',
     why:'Same steps: PV = nRT gives moles of N₂ for the bag’s volume, then the 2 : 3 ratio gives moles of NaN₃, then grams. Calculation only: sodium azide is highly toxic, which is one reason newer inflators use other propellants.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'nN2',2)],[FL(sim,'mAz',0),{w:800}]]);}}
  ],
  useIt:[
    {do:'When a recipe says baking soda, check what acid is in it (buttermilk, yogurt, lemon, vinegar).',why:'Baking soda needs an acid to make CO₂. Extra soda with too little acid stays unreacted and makes food taste soapy or metallic.'},
    {do:'If you use a CO₂ cartridge on a bike tire, use the cartridge size the tire needs.',why:'A 16 g cartridge holds about 0.36 mol of gas, about 10.6 L at Denver’s pressure, squeezed into one small tire.'},
    {do:'Expect sea-level gas amounts to behave differently up here.',why:'At 0.83 atm, a mole of gas takes up about 20% more space than at sea level, from bag-filling labs to how much a balloon or chip bag puffs on the drive up to the mountains.'}],
  tryIt:[{title:'the 1 : 1 balloon (10 minutes)',steps:['Put 1 teaspoon of baking soda in a balloon (use a funnel).','Pour 2 tablespoons of vinegar into a bottle and stretch the balloon over the top without spilling the soda.','Lift the balloon so the soda falls in. Repeat with 2 teaspoons of soda and the same vinegar.'],look:'The second balloon gets only a little bigger, if at all, and leftover powder sits at the bottom. The vinegar ran out: it was the limiting reactant.'}]};

/* ---------- beerslaw ---------- */
const blCard=(ctx,k,LH,rows)=>card(ctx,k,552,LH-12,236,rows,{up:true});
L.beerslaw={
  goals:{
    bio:['Why a darker solution lets less light through','What absorbance is, and why it doubles when concentration doubles','Why you measure with the color a solution absorbs most','How a solution’s color tells you which light it absorbs'],
    honors:['How path length is the second variable in A = εbc','How a calibration line turns an absorbance into a concentration'],
    ap:['Why λmax gives the most sensitive method','Why stray light bends the calibration at high absorbance']},
  matters:'A pulse oximeter on your finger, a pool test kit, a breath-alcohol machine and a hospital blood test all measure concentration with light, using this one idea: the more of something in the light’s path, the more light it absorbs.',
  startKey:'start',startRun:true,
  steps:[
    {key:'white',title:'White light in, one color out',run:tour('beerslaw','White light in'),speed:1,focus:[10,60,250,200],
     see:'A lamp makes white light. A grating spreads it into a rainbow, and a slit lets just one color through.',
     why:'Picking one wavelength matters because each substance absorbs some colors and not others. Here the slit passes green light at 526 nm.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,60,250,200],tau);}},
    {key:'photons',title:'Photons meet the solution',speed:0.4,focus:[300,60,250,220],
     see:'Watch the photons cross the cuvette. Each dot is a permanganate ion.',
     why:'A photon that hits an ion is absorbed; one that slips between the ions makes it through. Crowd in more ions and fewer photons get through.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'c',2),{w:700}],[FL(sim,'T',0)]]);}},
    {key:'detect',title:'The detector counts what gets through',speed:0.6,focus:[540,60,250,220],
     see:'Read transmittance T and absorbance A.',
     why:'Transmittance is the fraction of light that arrives: here 25%. Absorbance A = −log T = 0.60. Absorbance is the number chemists use, because it grows in a straight line with concentration.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'T',0)],[FL(sim,'A',2),{w:800,c:GREEN}]]);}},
    {key:'double',title:'Twice as many ions',set:{conc:50},speed:0.6,cause:{from:{conc:25},delay:1.5,dur:2,label:'Concentration'},focus:[300,40,490,250],
     see:'The concentration doubles. Watch the dots, then A and T.',
     why:'Twice the ions in the light’s path, and the absorbance doubles, from 0.60 to 1.20. T does not halve: it drops from 25% to about 6%, because each layer of solution removes the same fraction of what reaches it.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:RED}],[FL(sim,'T',1)]]);}},
    {key:'color',title:'Measure with the right color',set:{lam:650},speed:0.6,cause:{from:{lam:526},delay:1.5,dur:2,label:'Wavelength'},focus:[20,300,760,190],
     see:'The slit moves from green (526 nm) to red (650 nm). Watch the spectrum and the absorbance.',
     why:'Permanganate absorbs green strongly and red hardly at all. With red light almost everything gets through, so the meter barely notices the solution. Measure at the peak, λmax, where the solution absorbs most.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',3),{w:800,c:RED}]]);}},
    {key:'look',title:'What color you see',set:{lam:526},speed:0.6,focus:[300,60,250,220],
     see:'Back at green light. Look at the color of the solution.',
     why:'A solution looks like the light it does not absorb. Permanganate absorbs green and lets red and blue through, so it looks purple. A blue drink absorbs orange-red and looks blue.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'look'),{w:700}]]);}},
    {key:'hook',title:'Your question: half and half',set:{solute:'blue1',lam:630,conc:25},fresh:true,speed:0.6,cause:{from:{conc:50},delay:2,dur:2,label:'Concentration (mixed 1 : 1 with water)'},focus:[300,40,490,250],
     see:'A blue sports drink at 630 nm reads about 1.28. Then it is mixed half and half with water.',
     why:'Half the dye gives half the absorbance: about 0.65, and the light getting through rises from 5% to 23%. Blue 1 absorbs orange-red near 630 nm and barely touches green: at 530 nm even the full-strength drink reads about 0.005, too small to tell drinks apart.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:GREEN}],[FL(sim,'T',0)]]);}},
    {key:'path',lvl:'honors',title:'A wider cuvette',set:{path:'2.00'},speed:0.6,cause:{from:{path:'1.00'},delay:1.5,dur:0.5,label:'Path length'},focus:[300,40,490,250],
     see:'Same solution, in a cuvette 2.00 cm wide instead of 1.00 cm.',
     why:'Light crossing twice as much solution meets twice as many ions, so A doubles. Path length b is the second variable in Beer’s law, A = εbc.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:RED}]]);}},
    {key:'cal',lvl:'honors',title:'A calibration line',run:tour('beerslaw','Calibration curve'),speed:0.6,focus:[300,40,490,250],
     see:'Four standards of known concentration are measured, then an unknown.',
     why:'Graph A against concentration and the standards fall on a straight line. Read the unknown’s absorbance across to the line and down to its concentration. That is how a lab measures a sample it can’t weigh.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'fitC',3),{w:800,c:GREEN}],[FL(sim,'r2',4)]]);}},
    {key:'stray',lvl:'ap',title:'Stray light bends the line',set:{conc:100,stray:1},fresh:true,speed:0.6,focus:[300,40,490,250],
     see:'A strong solution and an instrument with 1% stray light.',
     why:'At high absorbance almost no light at the chosen wavelength gets through, so the little stray light that leaks around the sample dominates the detector. The measured A falls below the true value, and the calibration curves over. Keep standards below A ≈ 1.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:RED}],['True A would be about 2.4']]);}}
  ],
  useIt:[
    {do:'Next time you or a relative uses a pulse oximeter, keep the hand still and warm.',why:'It measures oxygen by how much red and infrared light the blood absorbs. Movement and cold fingers change the light path and the reading.'},
    {do:'Test a pool or hot tub by matching the color in good daylight.',why:'The test color darkens in proportion to the chemical, Beer’s law done by eye. Colored light makes the match unreliable.'},
    {do:'Read sunscreen labels for “broad spectrum.”',why:'Sunscreens work by absorbing UV light. Broad spectrum means it absorbs across both UVA and UVB wavelengths, not just at one peak.'}],
  tryIt:[{title:'the food-coloring ladder (10 minutes)',steps:['Fill four clear glasses with the same amount of water.','Add 1, 2, 4 and 8 drops of blue food coloring.','Hold a phone flashlight behind each and look at how much light comes through.'],look:'Each doubling dims the light by about the same fraction, not the same amount. That is why absorbance, not brightness, grows in a straight line with drops.'}]};
R.beerslaw={questions:[
  {id:'double',kind:'test',lvl:'bio',q:'A solution has A = 0.40. You double its concentration. What is A now?',num:{ans:0.8,tol:0.02,unit:''},
   steps:['Absorbance is proportional to concentration.','Twice the concentration gives twice the absorbance.','0.40 × 2 = 0.80.']},
  {id:'why',kind:'test',lvl:'bio',q:'Why does a more concentrated solution absorb more light?',choices:['More particles stand in the light’s path','The light slows down in thicker liquids','The solution gets warmer and glows less','The detector reads darker colors as stronger'],correct:0,
   steps:['Each particle can absorb a photon that hits it.','More particles means more photons absorbed.','So less light gets through and A is larger.']},
  {id:'color',kind:'test',lvl:'bio',q:'A solution looks blue. Which color of light does it absorb most?',choices:['Orange-red, the color opposite blue','Blue, the same color you see','Green, since every dye absorbs green','White, since it absorbs all colors equally'],correct:0,
   steps:['You see the light a solution does not absorb.','A blue solution lets blue through.','It absorbs the opposite colors, orange-red.']},
  {id:'lmax',kind:'test',lvl:'bio',q:'Why measure at λmax, the wavelength of the peak?',choices:['The absorbance changes most with concentration there','The lamp is brightest at that wavelength','Every solution has the same λmax','It keeps stray light from ever reaching the detector at all'],correct:0,
   steps:['At λmax the solution absorbs most strongly.','So each change in concentration gives the biggest change in A.','That makes the measurement most sensitive.']},
  {id:'trans',kind:'test',lvl:'honors',q:'A solution transmits 25% of the light (A = 0.60). You double its concentration. About what percent gets through now?',num:{ans:6.25,tol:0.5,unit:'%'},
   steps:['A doubles to 1.20.','T = 10^(−1.20).','≈ 0.063, about 6%, not 12.5%.']},
  {id:'path',kind:'test',lvl:'honors',q:'The same solution moves from a 1.00 cm cuvette to a 2.00 cm one. What happens to A?',choices:['It doubles, since light crosses twice as much solution','It halves, since the light spreads out more','It stays the same, since the concentration is the same','It rises only a little, since most light is already absorbed'],correct:0,
   steps:['A = εbc.','b doubles, ε and c stay the same.','So A doubles.']},
  {id:'oxi',kind:'real',lvl:'honors',q:'How does a pulse oximeter tell how much oxygen is in your blood?',choices:['Oxygenated blood absorbs red and infrared differently','It counts red blood cells by taking a tiny photo','It measures how warm the fingertip is','It listens to the pulse and estimates oxygen from heart rate'],correct:0,
   steps:['It shines red and infrared light through the finger.','Hemoglobin with and without oxygen absorbs these differently.','The ratio of absorbances gives the oxygen saturation.']}
]};

/* ---------- titration ---------- */
const ttCard=(ctx,k,LH,rows)=>card(ctx,k,500,LH-12,292,rows,{up:true});
L.titration={
  goals:{
    bio:['What a burette, a pipet and an indicator each do','Why the pH barely moves at first, then jumps at the end','How the balanced equation turns a volume into a concentration','Why you slow down to single drops near the endpoint'],
    honors:['The difference between the equivalence point and the endpoint','Why a weak acid’s curve has a buffer region','How to pick an indicator that changes at the right pH'],
    ap:['Why pH = pKa at the half-equivalence point','How permanganate works as its own indicator in a redox titration']},
  matters:'Titration is how labs measure the acid in juice, the alkalinity of a pool, the strength of a medicine and how much lye homemade biodiesel needs. A careful drop-by-drop technique is what makes the number right.',
  startKey:'start',startRun:false,
  steps:[
    {key:'burette',title:'The burette',run:tour('titration','The burette'),pause:true,focus:[20,14,190,312],
     see:'A tall tube with a valve at the bottom, full of 0.100 M NaOH, the titrant.',
     why:'You know the titrant’s concentration exactly. Reading the volume at the bottom of the meniscus before and after tells you how much you added, and that is the measurement the whole lab depends on.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2),{w:700}]]);}},
    {key:'flask',title:'The flask',pause:true,focus:[12,300,232,148],
     see:'25.00 mL of an unknown HCl from a pipet, with a few drops of phenolphthalein.',
     why:'The pipet delivers an exact volume of the unknown. Phenolphthalein is colorless in acid and turns pink above about pH 8.2, so it signals when the acid is used up.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'pH',2),{w:700}],[FL(sim,'color'),{w:700}]]);}},
    {key:'open',title:'Open the stopcock',run:tour('titration','Open the stopcock'),speed:0.5,focus:[249,84,212,212],
     see:'NaOH streams in. Watch the zoom: OH⁻ ions meet H₃O⁺ ions.',
     why:'Each OH⁻ grabs a proton from an H₃O⁺ and they make two waters: H₃O⁺ + OH⁻ → 2 H₂O. Acid and base cancel. The Na⁺ and Cl⁻ just watch; they are spectator ions.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'pH',2),{w:700}]]);}},
    {key:'flat',title:'Flat at first',run:tour('titration','The curve stays flat'),speed:1,focus:[496,20,300,300],
     see:'Three quarters of the way to the end. Look at the pH curve.',
     why:'While lots of acid is left, each mL of base removes only a small fraction of the H₃O⁺, so the pH barely moves. A flat curve doesn’t mean nothing is happening; most of the acid is already gone.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'pH',2),{w:800,c:GREEN}]]);}},
    {key:'slow',title:'Slow down near the end',run:tour('titration','Slow down near the endpoint'),speed:1,focus:[12,300,232,148],
     see:'A few tenths of a mL from the end. Watch each drop flash pink where it lands, then fade.',
     why:'Where a drop lands, base is briefly in excess, so the indicator flashes pink until swirling mixes it into the acid. The fading flashes are your warning: switch to single drops now.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'pH',2),{w:700}],[FL(sim,'color')]]);}},
    {key:'hook',title:'Your question: pink at 22.50 mL',run:tour('titration','Equivalence and endpoint'),pause:true,focus:[496,20,300,300],
     see:'One drop past equivalence, the pink stays. Read the burette and the pH.',
     why:'HCl and NaOH react 1 : 1, so moles of base = moles of acid: M = 0.100 × 22.50 ÷ 25.00 = 0.0900 M. One drop (0.05 mL) before the end the flask is near pH 4; one drop after, near pH 10. A fast stream would overshoot and make the answer too high.',
     overlay(sim,ctx,LH,k){const v=M(sim,'vol');ttCard(ctx,k,LH,[[FL(sim,'vol',2),{w:800}],[FL(sim,'pH',2),{w:700,c:RED}],[isFinite(v)?'This flask: 0.100 × '+v.toFixed(2)+' ÷ 25.00 ≈ '+(0.1*v/25).toFixed(4)+' M':'',{w:700,c:GREEN}]]);}},
    {key:'h2so4',title:'Two H⁺ per acid',set:{type:'sa'},fresh:true,run:tour('titration','Equivalence and endpoint'),pause:true,focus:[496,20,300,300],
     see:'Now the flask holds H₂SO₄, which gives up two H⁺ per molecule. Read where equivalence lands.',
     why:'H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O. It takes two NaOH for each H₂SO₄, so moles of acid are half the moles of base. Always use the mole ratio from the balanced equation, not 1 : 1 by habit.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2),{w:800}],['Moles of acid = ½ × moles of NaOH',{w:700,c:GREEN}]]);}},
    {key:'weak',lvl:'honors',title:'A weak acid',run:tour('titration','A weak acid has a buffer region'),pause:true,focus:[496,20,300,300],
     see:'Acetic acid, the acid in vinegar, halfway to equivalence. Look at the shape of the curve.',
     why:'The curve starts higher and rises gently: a buffer region, where acetic acid and acetate together resist pH change. Equivalence lands above pH 7, about 8.7, because acetate is a weak base. Phenolphthalein still works; methyl red would change too early.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'pH',2),{w:800,c:GREEN}],[FL(sim,'species')]]);}},
    {key:'redox',lvl:'ap',title:'Permanganate is its own indicator',run:tour('titration','Redox'),speed:0.5,focus:[[12,14,232,434],[249,84,212,212]],
     see:'Purple MnO₄⁻ drips into hydrogen peroxide. Watch the color where it lands.',
     why:'MnO₄⁻ oxidizes H₂O₂ to O₂ and becomes nearly colorless Mn²⁺. Once the H₂O₂ is gone, the next drop has nothing to react with and the purple stays. The 2 : 5 ratio comes from the balanced redox equation: 2 MnO₄⁻ + 5 H₂O₂ + 6 H⁺ → 2 Mn²⁺ + 5 O₂ + 8 H₂O.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'mno4',3),{w:700}]]);}}
  ],
  useIt:[
    {do:'Count drops slowly near the end of a pool or aquarium test.',why:'Those kits are small titrations. The last drop or two decides the result, just like at the burette.'},
    {do:'Read a test or recipe’s ratio before you double anything.',why:'Like H₂SO₄ needing 2 NaOH, the right amount depends on the balanced ratio, not on matching volumes.'},
    {do:'Take antacid tablets as the label says, not by the handful.',why:'Each tablet neutralizes a fixed amount of stomach acid. More than you need overshoots, like going past the endpoint.'}],
  tryIt:[{title:'red cabbage titration (20 minutes)',steps:['Boil chopped red cabbage in water for 10 minutes and strain it. The purple liquid is an indicator.','Put 2 tablespoons of vinegar and a little cabbage juice in a clear cup.','Add a solution of 1 teaspoon baking soda in ½ cup water, one spoonful at a time, stirring each time.'],look:'The color stays red-pink, then shifts through purple to blue-green as you pass the endpoint. Count the spoonfuls: that is your titration volume.'}]};

/* ---------- orbitals ---------- */
const obCard=(ctx,k,LH,rows)=>card(ctx,k,46,LH-14,300,rows,{up:true});
L.orbitals={
  goals:{
    bio:['Why an orbital is a cloud of likely places, not a track','How s, p and d orbitals differ in shape','Why there are 1 s, 3 p and 5 d orbitals in a set','How that 2, 6, 10 pattern sets the shape of the periodic table'],
    honors:['How n, ℓ and mℓ set size, shape and direction','How to count radial and angular nodes'],
    ap:['How more protons shrink an orbital','How the radial probability graph shows the most likely distance']},
  matters:'The shape of the periodic table, why chlorine grabs an electron, why water is bent and why strontium fireworks are red all come from these clouds. The rules are few, and they explain most of chemistry.',
  startKey:'start',startRun:true,
  steps:[
    {key:'cloud',title:'A cloud, not an orbit',set:{orb:'1s',Z:1,fix:false,nodes:false,spin:true},fresh:true,speed:1,focus:[40,27,400,410],
     see:'Hydrogen’s 1s orbital. Each dot marks a place the electron could be found if you measured it.',
     why:'The electron does not travel a path like a planet. The cloud shows where it is likely to be: dense near the nucleus, thinning outward. Electrons behave like waves, so a probability cloud is the best picture we have.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'name'),{w:700}],[FL(sim,'rmp',1)]]);}},
    {key:'bigger',title:'Higher n, bigger orbital',set:{orb:'2s'},speed:1,cause:{from:{orb:'1s'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'Switch to 2s. Compare its size, and look for an empty shell inside it.',
     why:'A higher n means more energy and a bigger cloud: the most likely distance is about 277 pm, five times the 1s. The empty shell is a node, where the electron’s wave cancels and it is never found.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'rmp',0),{w:800,c:GREEN}]]);}},
    {key:'p',title:'p orbitals: two lobes',set:{orb:'2pz'},speed:1,cause:{from:{orb:'2s'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'The 2pz orbital. Watch it spin.',
     why:'Two lobes along the z axis, like a dumbbell, with a flat plane between them through the nucleus where the electron is never found. That plane is an angular node.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'name'),{w:700}]]);}},
    {key:'three',title:'Three directions',set:{orb:'2px'},speed:1,cause:{from:{orb:'2pz'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'Now 2px. Then picture 2py too.',
     why:'Every p set has three orbitals, along x, y and z, at right angles like the corner of a room. Each holds 2 electrons, so a p sublevel holds 3 × 2 = 6: exactly the width of the p block of the periodic table.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[['3 p orbitals × 2 electrons = 6',{w:800,c:GREEN}]]);}},
    {key:'d',title:'d orbitals: four lobes',set:{orb:'3dxy'},speed:1,cause:{from:{orb:'2px'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'3dxy, a four-leaf clover with lobes between the x and y axes.',
     why:'There are five d orbitals in a set, so a d sublevel holds 5 × 2 = 10 electrons: the width of the transition-metal block in the middle of the table.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[['5 d orbitals × 2 electrons = 10',{w:800,c:GREEN}]]);}},
    {key:'slice',title:'A slice through the middle',speed:1,focus:[502,20,292,244],
     see:'The panel on the right cuts the cloud in half.',
     why:'Bright areas are where the electron is most likely to be; dark gaps are nodes. A slice shows the shape more plainly than the spinning cloud.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[502,20,292,244],tau);}},
    {key:'hook',title:'Your question: where do 2, 6 and 10 come from?',set:{orb:'3s'},speed:1,focus:[40,27,400,410],
     run:sim=>{atReset(sim);},
     see:'Watch the third level go by: 3s, then 3pz, then 3dz².',
     why:'Each level has 1 s orbital, 3 p orbitals and 5 d orbitals, and each orbital holds 2 electrons. So s holds 2, p holds 6 and d holds 10: the widths of the s, p and d blocks. Each step to the right across a block adds one electron.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,3,'p',s=>BioLab.setValues(s,{orb:'3pz'}));atT(sim,tau,6,'d',s=>BioLab.setValues(s,{orb:'3dz2'}));
       obCard(ctx,k,LH,[[FL(sim,'name'),{w:800}],['s: 1 × 2 = 2 · p: 3 × 2 = 6 · d: 5 × 2 = 10',{w:700,c:GREEN}]]);}},
    {key:'qn',lvl:'honors',title:'Quantum numbers set the shape',set:{orb:'3dxy',nodes:true},fresh:true,speed:1,focus:[502,258,292,186],
     see:'Back to 3dxy, with the nodes drawn.',
     why:'n = 3 sets the size and energy, ℓ = 2 makes it a d orbital, and mℓ picks its direction. Radial nodes = n − ℓ − 1 = 0; angular nodes = ℓ = 2, the two flat planes between the lobes.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'l')],[FL(sim,'rn')],[FL(sim,'an'),{w:800}]]);}},
    {key:'Z',lvl:'ap',title:'More protons, smaller orbitals',set:{orb:'1s',Z:2,fix:true},fresh:true,speed:1,cause:{from:{Z:1},delay:1.5,dur:1,label:'Nuclear charge Z'},focus:[40,27,400,410],
     see:'He⁺ has one electron, like hydrogen, but two protons.',
     why:'A stronger pull draws the cloud in: the most probable distance drops from 52.9 pm to 26.5 pm, half as far, and the energy level drops by a factor of Z² = 4. This is why orbitals shrink across a row of the periodic table.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'rmp',1),{w:800,c:GREEN}]]);}}
  ],
  useIt:[
    {do:'Use the block an element sits in to predict its charge.',why:'Chlorine has 5 of its 6 p spots filled, so it grabs one electron (Cl⁻); sodium has one lone s electron to give up (Na⁺).'},
    {do:'Next fireworks show, notice the colors.',why:'Each color comes from electrons jumping between orbitals with fixed energies in one element: red strontium, green barium, blue copper.'},
    {do:'Picture a cloud, not a planet, when you see an atom drawn with circles.',why:'The circle diagram is a useful cartoon for counting electrons, but electrons are found in clouds of likely places.'}],
  tryIt:[{title:'the dart cloud (10 minutes)',steps:['Tape a target on paper. Throw 50 small paper balls or darts at the center from a few steps away.','Mark where each lands.'],look:'The marks form a cloud, dense near the center and thinning out. You can’t say where the next one lands, only where it is likely to. An orbital picture is drawn the same way.'}]};
R.orbitals={questions:[
  {id:'cloud',kind:'test',lvl:'bio',q:'What do the dots in an orbital picture show?',choices:['Places where the electron is likely to be found','The path the electron travels around the nucleus','Separate electrons, one per dot','Protons spread out around the nucleus'],correct:0,
   steps:['Electrons don’t follow paths.','Each dot is a possible measured position.','Dense regions are where it is most likely.']},
  {id:'six',kind:'test',lvl:'bio',q:'Why is the p block of the periodic table 6 columns wide?',choices:['3 p orbitals each hold 2 electrons','p orbitals hold 6 electrons each','There are 6 p orbitals in every level','The p block began with element 6, carbon'],correct:0,
   steps:['A p sublevel has 3 orbitals (x, y, z).','Each orbital holds 2 electrons.','3 × 2 = 6 columns.']},
  {id:'ten',kind:'test',lvl:'bio',q:'How many electrons can a full d sublevel hold?',num:{ans:10,tol:0,unit:'electrons'},
   steps:['A d sublevel has 5 orbitals.','Each holds 2 electrons.','5 × 2 = 10.']},
  {id:'bigger',kind:'test',lvl:'bio',q:'Which orbital is bigger, 1s or 2s?',choices:['2s, because a higher n means a bigger orbital','1s, because it is closest to the nucleus','They are the same size, since both are spheres','It depends on how fast the electron is moving'],correct:0,
   steps:['n sets an orbital’s size and energy.','2s has n = 2, so it is larger.','Its most likely distance is about five times the 1s.']},
  {id:'node',kind:'test',lvl:'bio',q:'Where is an electron in a 2pz orbital never found?',choices:['On the flat plane between the lobes','At the far tips of the two lobes','Inside the lobes, close to their centers','Anywhere along the z axis'],correct:0,
   steps:['A p orbital has two lobes along one axis.','Between them is a plane through the nucleus.','The probability there is zero: an angular node.']},
  {id:'nodes3s',kind:'test',lvl:'honors',q:'How many radial nodes does a 3s orbital have?',num:{ans:2,tol:0,unit:''},
   steps:['Radial nodes = n − ℓ − 1.','For 3s: n = 3, ℓ = 0.','3 − 0 − 1 = 2.']},
  {id:'Z',kind:'test',lvl:'ap',q:'He⁺ has one electron, like H, but Z = 2. How does its 1s most probable distance compare with hydrogen’s 52.9 pm?',num:{ans:26.5,tol:0.3,unit:'pm'},
   steps:['For a one-electron ion, size scales as 1/Z.','Z doubles from 1 to 2.','52.9 ÷ 2 ≈ 26.5 pm.']}
]};
BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
