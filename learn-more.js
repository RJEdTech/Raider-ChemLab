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
     why:'Too little gas and the bag sags; too much and it bursts. Getting it exactly right means counting molecules, in moles.',
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
     see:'The amounts in the controls are set from 0.031 mol.',
     why:'Baking soda: 0.031 × 84.01 ≈ 2.6 g. Vinegar has about 0.00084 mol of acid per mL, so about 37 mL. Equal moles, since the ratio is 1 : 1.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[['2.6 g NaHCO₃ ↔ 37 mL vinegar',{w:800}],['Both ≈ 0.031 mol',{w:700,c:GREEN}]]);}},
    {key:'mix',title:'Seal and mix',run:mix,speed:0.5,focus:[30,60,430,370],
     see:'The bag is sealed, and the baking soda tips into the vinegar. It fills.',
     why:'CO₂ bubbles out and fills the bag. The sealed bag’s mass doesn’t change: atoms are only rearranged.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'vgas',3),{w:700}],[FL(sim,'full',0),{w:800,c:GREEN}]]);}},
    {key:'extra',title:'Extra baking soda does nothing',set:{soda:5.2},fresh:true,run:mix,speed:0.8,focus:[30,60,430,370],
     see:'Double the baking soda to 5.2 g, keep 37 mL of vinegar, and mix again. The bag fills no more.',
     why:'The vinegar runs out at 0.031 mol: it is the <b>limiting reactant</b>. Extra soda sits unreacted.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'full',0),{w:800}],[FL(sim,'out'),{w:700,c:RED}]]);}},
    {key:'hook',title:'Your question: a gallon bag, 100 mL of vinegar',set:{bag:'gallon',soda:12,vin:100},fresh:true,run:mix,speed:0.8,focus:[30,60,430,370],
     see:'A gallon bag (3.785 L), lots of baking soda, but only 100 mL of vinegar. It ends up about two-thirds full.',
     why:'100 mL of vinegar makes only 0.0837 mol of CO₂, about 2.44 L here. To fill it, use about 149 mL of vinegar.',
     overlay(sim,ctx,LH,k){agCard(ctx,k,LH,[[FL(sim,'vgas',2),{w:700}],[FL(sim,'full',0),{w:800,c:RED}]]);}},
    {key:'sea',lvl:'honors',title:'Same bag at sea level',set:{place:'sea'},fresh:true,run:mix,speed:0.8,focus:[490,270,300,170],
     see:'The exact RJ recipe, run at sea level (1.00 atm). The bag fills only about 83%.',
     why:'Higher pressure squeezes each mole into less space: V = nRT/P. A sea-level recipe would over-fill a bag up here.',
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
     see:'A lamp makes white light. A grating spreads it into a rainbow, and a slit passes one color: green, 526 nm.',
     why:'Each substance absorbs some colors and not others, so you pick one wavelength.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[10,60,250,200],tau);}},
    {key:'photons',title:'Photons meet the solution',speed:0.4,focus:[300,60,250,220],
     see:'Photons cross the cuvette. Each dot is a permanganate ion.',
     why:'A photon that hits an ion is absorbed. More ions, fewer photons get through.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'c',2),{w:700}],[FL(sim,'T',0)]]);}},
    {key:'detect',title:'The detector counts what gets through',speed:0.6,focus:[540,60,250,220],
     see:'The detector reads transmittance T = 25% and absorbance A = 0.60.',
     why:'T is the fraction that arrives; A = −log T. Chemists use A because it grows in a straight line with concentration.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'T',0)],[FL(sim,'A',2),{w:800,c:GREEN}]]);}},
    {key:'double',title:'Twice as many ions',set:{conc:50},speed:0.6,cause:{from:{conc:25},delay:1.5,dur:2,label:'Concentration'},focus:[300,40,490,250],
     see:'The concentration doubles. A goes from 0.60 to 1.20; T drops from 25% to about 6%.',
     why:'Twice the ions, twice the absorbance. T doesn’t halve: each layer removes the same fraction.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:RED}],[FL(sim,'T',1)]]);}},
    {key:'color',title:'Measure with the right color',set:{lam:650},speed:0.6,cause:{from:{lam:526},delay:1.5,dur:2,label:'Wavelength'},focus:[20,300,760,190],
     see:'The slit moves from green (526 nm) to red (650 nm). The absorbance nearly vanishes.',
     why:'Permanganate barely absorbs red. Measure at <b>λmax</b>, where it absorbs most.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',3),{w:800,c:RED}]]);}},
    {key:'look',title:'What color you see',set:{lam:526},speed:0.6,focus:[300,60,250,220],
     see:'Back at green light. Look at the solution’s color.',
     why:'A solution looks like the light it doesn’t absorb. Permanganate absorbs green, so it looks purple.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'look'),{w:700}]]);}},
    {key:'hook',title:'Your question: half and half',set:{solute:'blue1',lam:630,conc:25},fresh:true,speed:0.6,cause:{from:{conc:50},delay:2,dur:2,label:'Concentration (mixed 1 : 1 with water)'},focus:[300,40,490,250],
     see:'A blue sports drink at 630 nm reads about 1.28. Then it is mixed half and half with water.',
     why:'Half the dye, half the absorbance: about 0.65. At 530 nm even full strength reads 0.005, too small to compare drinks.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:GREEN}],[FL(sim,'T',0)]]);}},
    {key:'path',lvl:'honors',title:'A wider cuvette',set:{path:'2.00'},speed:0.6,cause:{from:{path:'1.00'},delay:1.5,dur:0.5,label:'Path length'},focus:[300,40,490,250],
     see:'The same solution in a 2.00 cm cuvette instead of 1.00 cm.',
     why:'Twice the path meets twice the ions, so A doubles. Beer’s law: A = εbc.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'A',2),{w:800,c:RED}]]);}},
    {key:'cal',lvl:'honors',title:'A calibration line',run:tour('beerslaw','Calibration curve'),speed:0.6,focus:[300,40,490,250],
     see:'Four standards of known concentration are measured, then an unknown.',
     why:'The standards fall on a straight line. Read the unknown’s A across to the line and down to its concentration.',
     overlay(sim,ctx,LH,k){blCard(ctx,k,LH,[[FL(sim,'fitC',3),{w:800,c:GREEN}],[FL(sim,'r2',4)]]);}},
    {key:'stray',lvl:'ap',title:'Stray light bends the line',set:{conc:100,stray:1},fresh:true,speed:0.6,focus:[300,40,490,250],
     see:'A strong solution and an instrument with 1% stray light.',
     why:'Almost no light gets through, so stray light dominates and A reads low. Keep standards below A ≈ 1.',
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
   steps:['It shines red and infrared light through the finger.','Hemoglobin with and without oxygen absorbs these differently.','The ratio of absorbances gives the oxygen saturation.']},
  {id:'calread',kind:'test',lvl:'bio',
    q:'<p>An unknown permanganate solution reads A = 0.72. Using the calibration line, what is its concentration?</p><svg viewBox="0 0 420 230" style="display:block;width:100%;max-width:440px;height:auto;margin:10px 0 4px;color:inherit" role="img" aria-label="Calibration line for permanganate: absorbance rises in a straight line through the origin, 0.24 at 10%, 0.48 at 20%, 0.72 at 30%, 0.96 at 40%."><path d="M58 16V180H406" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M58.0 180v4" stroke="currentColor"/><text x="58.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">0</text><path d="M126.4 180v4" stroke="currentColor"/><text x="126.4" y="196" font-size="12" text-anchor="middle" fill="currentColor">10</text><path d="M194.8 180v4" stroke="currentColor"/><text x="194.8" y="196" font-size="12" text-anchor="middle" fill="currentColor">20</text><path d="M263.2 180v4" stroke="currentColor"/><text x="263.2" y="196" font-size="12" text-anchor="middle" fill="currentColor">30</text><path d="M331.6 180v4" stroke="currentColor"/><text x="331.6" y="196" font-size="12" text-anchor="middle" fill="currentColor">40</text><path d="M400.0 180v4" stroke="currentColor"/><text x="400.0" y="196" font-size="12" text-anchor="middle" fill="currentColor">50</text><path d="M54 180.0h4" stroke="currentColor"/><text x="51" y="184.0" font-size="12" text-anchor="end" fill="currentColor">0</text><path d="M54 101.0h4" stroke="currentColor"/><text x="51" y="105.0" font-size="12" text-anchor="end" fill="currentColor">0.60</text><path d="M54 22.0h4" stroke="currentColor"/><text x="51" y="26.0" font-size="12" text-anchor="end" fill="currentColor">1.20</text><text x="229.0" y="216" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Concentration (%)</text><text transform="translate(16 101.0) rotate(-90)" font-size="13" font-weight="700" text-anchor="middle" fill="currentColor">Absorbance</text><path d="M58.0 180.0L59.7 179.2L61.4 178.4L63.1 177.6L64.8 176.8L66.5 176.1L68.3 175.3L70.0 174.5L71.7 173.7L73.4 172.9L75.1 172.1L76.8 171.3L78.5 170.5L80.2 169.7L81.9 168.9L83.7 168.2L85.4 167.4L87.1 166.6L88.8 165.8L90.5 165.0L92.2 164.2L93.9 163.4L95.6 162.6L97.3 161.8L99.0 161.0L100.8 160.2L102.5 159.5L104.2 158.7L105.9 157.9L107.6 157.1L109.3 156.3L111.0 155.5L112.7 154.7L114.4 153.9L116.1 153.1L117.8 152.3L119.6 151.6L121.3 150.8L123.0 150.0L124.7 149.2L126.4 148.4L128.1 147.6L129.8 146.8L131.5 146.0L133.2 145.2L134.9 144.4L136.7 143.7L138.4 142.9L140.1 142.1L141.8 141.3L143.5 140.5L145.2 139.7L146.9 138.9L148.6 138.1L150.3 137.3L152.1 136.5L153.8 135.8L155.5 135.0L157.2 134.2L158.9 133.4L160.6 132.6L162.3 131.8L164.0 131.0L165.7 130.2L167.4 129.4L169.2 128.7L170.9 127.9L172.6 127.1L174.3 126.3L176.0 125.5L177.7 124.7L179.4 123.9L181.1 123.1L182.8 122.3L184.5 121.5L186.2 120.8L188.0 120.0L189.7 119.2L191.4 118.4L193.1 117.6L194.8 116.8L196.5 116.0L198.2 115.2L199.9 114.4L201.6 113.6L203.3 112.8L205.1 112.1L206.8 111.3L208.5 110.5L210.2 109.7L211.9 108.9L213.6 108.1L215.3 107.3L217.0 106.5L218.7 105.7L220.4 104.9L222.2 104.2L223.9 103.4L225.6 102.6L227.3 101.8L229.0 101.0L230.7 100.2L232.4 99.4L234.1 98.6L235.8 97.8L237.6 97.0L239.3 96.3L241.0 95.5L242.7 94.7L244.4 93.9L246.1 93.1L247.8 92.3L249.5 91.5L251.2 90.7L252.9 89.9L254.6 89.2L256.4 88.4L258.1 87.6L259.8 86.8L261.5 86.0L263.2 85.2L264.9 84.4L266.6 83.6L268.3 82.8L270.0 82.0L271.8 81.2L273.5 80.5L275.2 79.7L276.9 78.9L278.6 78.1L280.3 77.3L282.0 76.5L283.7 75.7L285.4 74.9L287.1 74.1L288.9 73.3L290.6 72.6L292.3 71.8L294.0 71.0L295.7 70.2L297.4 69.4L299.1 68.6L300.8 67.8L302.5 67.0L304.2 66.2L305.9 65.5L307.7 64.7L309.4 63.9L311.1 63.1L312.8 62.3L314.5 61.5L316.2 60.7L317.9 59.9L319.6 59.1L321.3 58.3L323.1 57.5L324.8 56.8L326.5 56.0L328.2 55.2L329.9 54.4L331.6 53.6L333.3 52.8L335.0 52.0L336.7 51.2L338.4 50.4L340.1 49.6L341.9 48.9L343.6 48.1L345.3 47.3L347.0 46.5L348.7 45.7L350.4 44.9L352.1 44.1L353.8 43.3L355.5 42.5L357.2 41.7L359.0 41.0L360.7 40.2L362.4 39.4L364.1 38.6L365.8 37.8L367.5 37.0L369.2 36.2L370.9 35.4L372.6 34.6L374.4 33.8L376.1 33.1L377.8 32.3L379.5 31.5L381.2 30.7L382.9 29.9L384.6 29.1L386.3 28.3L388.0 27.5L389.7 26.7L391.4 26.0L393.2 25.2L394.9 24.4L396.6 23.6L398.3 22.8L400.0 22.0" fill="none" stroke="#7b3fb0" stroke-width="3"/><circle cx="126.4" cy="148.4" r="5" fill="#7b3fb0"/><circle cx="194.8" cy="116.8" r="5" fill="#7b3fb0"/><circle cx="263.2" cy="85.2" r="5" fill="#7b3fb0"/><circle cx="331.6" cy="53.6" r="5" fill="#7b3fb0"/></svg>',
    choices:['30%','36%','24%','72%'],correct:0,
    steps:['Find 0.72 on the absorbance axis.','Go across to the line and down to the concentration axis.','The line reaches 0.72 at 30%.']},
  {id:'doubleconc',kind:'test',lvl:'bio',
    q:'<p>A solution has A = 0.40. You make it twice as concentrated. What does it read?</p>',
    choices:['0.80','0.40','0.20','1.60'],correct:0,
    steps:['Beer’s law: A = εbc, so A is proportional to concentration.','Twice the concentration, twice the absorbance.','0.40 × 2 = 0.80.']}
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
     see:'A tall tube with a valve at the bottom, full of 0.100 M NaOH, the <b>titrant</b>.',
     why:'You know its concentration exactly. Reading the bottom of the meniscus before and after tells you how much you added.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2),{w:700}]]);}},
    {key:'flask',title:'The flask',pause:true,focus:[12,300,232,148],
     see:'25.00 mL of unknown HCl from a pipet, with a few drops of phenolphthalein.',
     why:'Phenolphthalein is colorless in acid and turns pink above about pH 8.2, so it signals when the acid is used up.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'pH',2),{w:700}],[FL(sim,'color'),{w:700}]]);}},
    {key:'open',title:'Open the stopcock',run:tour('titration','Open the stopcock'),speed:0.5,focus:[249,84,212,212],
     see:'NaOH streams in. In the zoom, OH⁻ ions meet H₃O⁺ ions.',
     why:'Each OH⁻ takes a proton from H₃O⁺, making two waters. Na⁺ and Cl⁻ just watch: <b>spectator ions</b>.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'pH',2),{w:700}]]);}},
    {key:'flat',title:'Flat at first',run:tour('titration','The curve stays flat'),speed:1,focus:[496,20,300,300],
     see:'Three quarters of the way to the end. The pH curve is still nearly flat.',
     why:'With lots of acid left, each mL of base removes only a small fraction of it, so the pH barely moves.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'pH',2),{w:800,c:GREEN}]]);}},
    {key:'slow',title:'Slow down near the end',run:tour('titration','Slow down near the endpoint'),speed:1,focus:[12,300,232,148],
     see:'A few tenths of a mL from the end. Each drop flashes pink where it lands, then fades.',
     why:'Where a drop lands, base is briefly in excess. Fading flashes mean: switch to single drops now.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2)],[FL(sim,'pH',2),{w:700}],[FL(sim,'color')]]);}},
    {key:'hook',title:'Your question: pink at 22.50 mL',run:tour('titration','Equivalence and endpoint'),pause:true,focus:[496,20,300,300],
     see:'One drop past equivalence, the pink stays. Read the burette and the pH.',
     why:'HCl and NaOH react 1 : 1: M = 0.100 × 22.50 ÷ 25.00 = 0.0900 M. One drop swings the pH from about 4 to 10, so go slowly.',
     overlay(sim,ctx,LH,k){const v=M(sim,'vol');ttCard(ctx,k,LH,[[FL(sim,'vol',2),{w:800}],[FL(sim,'pH',2),{w:700,c:RED}],[isFinite(v)?'This flask: 0.100 × '+v.toFixed(2)+' ÷ 25.00 ≈ '+(0.1*v/25).toFixed(4)+' M':'',{w:700,c:GREEN}]]);}},
    {key:'h2so4',title:'Two H⁺ per acid',set:{type:'sa'},fresh:true,run:tour('titration','Equivalence and endpoint'),pause:true,focus:[496,20,300,300],
     see:'Now the flask holds H₂SO₄, which gives up two H⁺ each. Read where equivalence lands.',
     why:'It takes 2 NaOH per H₂SO₄, so moles of acid are half the moles of base. Use the balanced equation’s ratio.',
     overlay(sim,ctx,LH,k){ttCard(ctx,k,LH,[[FL(sim,'vol',2),{w:800}],['Moles of acid = ½ × moles of NaOH',{w:700,c:GREEN}]]);}},
    {key:'weak',lvl:'honors',title:'A weak acid',run:tour('titration','A weak acid has a buffer region'),pause:true,focus:[496,20,300,300],
     see:'Acetic acid, the acid in vinegar, halfway to equivalence. The curve starts higher and rises gently.',
     why:'That gentle part is a <b>buffer</b> region. Equivalence lands near pH 8.7, because acetate is a weak base.',
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
     see:'Hydrogen’s 1s orbital. Each dot is a place the electron could be found if measured.',
     why:'The electron doesn’t follow a path. The cloud shows where it is likely to be: dense near the nucleus.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'name'),{w:700}],[FL(sim,'rmp',1)]]);}},
    {key:'bigger',title:'Higher n, bigger orbital',set:{orb:'2s'},speed:1,cause:{from:{orb:'1s'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'2s is bigger, with an empty shell inside it.',
     why:'Higher n, more energy, bigger cloud: about 277 pm, five times 1s. The empty shell is a <b>node</b>, where the electron is never found.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'rmp',0),{w:800,c:GREEN}]]);}},
    {key:'p',title:'p orbitals: two lobes',set:{orb:'2pz'},speed:1,cause:{from:{orb:'2s'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'The 2pz orbital spins: two lobes along z, with a flat plane through the nucleus between them.',
     why:'That plane is an angular node. A p orbital looks like a dumbbell.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'name'),{w:700}]]);}},
    {key:'three',title:'Three directions',set:{orb:'2px'},speed:1,cause:{from:{orb:'2pz'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'Now 2px. Picture 2py too, at right angles like the corner of a room.',
     why:'Three p orbitals × 2 electrons = 6: the width of the p block.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[['3 p orbitals × 2 electrons = 6',{w:800,c:GREEN}]]);}},
    {key:'d',title:'d orbitals: four lobes',set:{orb:'3dxy'},speed:1,cause:{from:{orb:'2px'},delay:1.5,dur:0.5,label:'Orbital'},focus:[40,27,400,410],
     see:'3dxy: a four-leaf clover with lobes between the x and y axes.',
     why:'Five d orbitals × 2 electrons = 10: the width of the transition-metal block.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[['5 d orbitals × 2 electrons = 10',{w:800,c:GREEN}]]);}},
    {key:'slice',title:'A slice through the middle',speed:1,focus:[502,20,292,244],
     see:'The panel on the right cuts the cloud in half.',
     why:'Bright areas: electron likely. Dark gaps: nodes. A slice shows the shape plainly.',
     overlay(sim,ctx,LH,k,tau){ring(ctx,k,[502,20,292,244],tau);}},
    {key:'hook',title:'Your question: where do 2, 6 and 10 come from?',set:{orb:'3s'},speed:1,focus:[40,27,400,410],
     run:sim=>{atReset(sim);},
     see:'The third level goes by: 3s, then 3pz, then 3dz².',
     why:'1 s, 3 p and 5 d orbitals, 2 electrons each: s holds 2, p 6, d 10, the widths of the blocks.',
     overlay(sim,ctx,LH,k,tau){atT(sim,tau,3,'p',s=>BioLab.setValues(s,{orb:'3pz'}));atT(sim,tau,6,'d',s=>BioLab.setValues(s,{orb:'3dz2'}));
       obCard(ctx,k,LH,[[FL(sim,'name'),{w:800}],['s: 1 × 2 = 2 · p: 3 × 2 = 6 · d: 5 × 2 = 10',{w:700,c:GREEN}]]);}},
    {key:'qn',lvl:'honors',title:'Quantum numbers set the shape',set:{orb:'3dxy',nodes:true},fresh:true,speed:1,focus:[502,258,292,186],
     see:'3dxy again, with its nodes drawn.',
     why:'n = 3 sets size, ℓ = 2 makes it d, mℓ picks direction. Radial nodes = n − ℓ − 1 = 0; angular nodes = ℓ = 2.',
     overlay(sim,ctx,LH,k){obCard(ctx,k,LH,[[FL(sim,'l')],[FL(sim,'rn')],[FL(sim,'an'),{w:800}]]);}},
    {key:'Z',lvl:'ap',title:'More protons, smaller orbitals',set:{orb:'1s',Z:2,fix:true},fresh:true,speed:1,cause:{from:{Z:1},delay:1.5,dur:1,label:'Nuclear charge Z'},focus:[40,27,400,410],
     see:'He⁺ has one electron, like hydrogen, but two protons. The cloud shrinks.',
     why:'The most probable distance halves, 52.9 to 26.5 pm. That is why orbitals shrink across a row.',
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
   steps:['For a one-electron ion, size scales as 1/Z.','Z doubles from 1 to 2.','52.9 ÷ 2 ≈ 26.5 pm.']},
  {id:'pcount',kind:'test',lvl:'bio',
    q:'<p>How many electrons can one p sublevel hold?</p>',
    choices:['6','2','3','10'],correct:0,
    steps:['A p sublevel has 3 orbitals.','Each orbital holds 2 electrons.','3 × 2 = 6.']},
  {id:'shape',kind:'test',lvl:'bio',
    q:'<p>Which describes an s orbital?</p>',
    choices:['A sphere around the nucleus','A dumbbell with two lobes','A four-leaf clover','A ring around the nucleus'],correct:0,
    steps:['s orbitals are spherical.','p orbitals are dumbbells; most d orbitals are four-leaf clovers.','Orbitals are probability clouds, not rings or paths.']}
  ]};
BioLab.addLearn(L);
Object.keys(R).forEach(id=>{const d=DEF(id);if(d&&d.review&&d.review.questions&&d.review.questions.length)delete R[id];});
BioLab.addReview(R);
})();
