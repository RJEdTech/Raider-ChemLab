/* Learn it for the spring 2027 ChemLab tools (added Nov 14, 2026): calorimetry, cold packs, enthalpy,
   equilibrium and Ksp. Same format as learn.js (see BioLab learn.js for the field reference). */
(function(){
'use strict';
const H=BioLab.h,PAL=H.PAL;
const RED='#c8102e',BLU='#1f5fbf',GRN='#1e7d3a';
/* a text card; lines are strings or [text, weight, size, color] */
function card(ctx,k,lines,x,y,w){
  const L=lines.map(l=>{const o=typeof l==='string'?[l]:l;const base=o[2]||12.5,wt=o[1]||500;let sz=base*Math.min(k,1.4);ctx.font=wt+' '+sz+'px '+H.FONT;const tw=ctx.measureText(o[0]).width;if(tw>w-18)sz=Math.max(base*Math.min(k,1.0)*0.8,sz*(w-18)/tw);return {t:o[0],sz,wt,c:o[3]||PAL['cv-ink']};});
  const lh=Math.max(...L.map(o=>o.sz))*1.38,h=8+L.length*lh;
  ctx.save();ctx.globalAlpha=0.97;H.rr(ctx,x,y,w,h,8);ctx.fillStyle=PAL['cv-sol'];ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=1.3;ctx.strokeStyle=PAL['cv-soft'];ctx.stroke();ctx.restore();
  L.forEach((o,j)=>H.txt(ctx,o.t,x+9,y+4+lh*0.78+j*lh,{s:o.sz,w:o.wt,c:o.c}));return h;}
const met=(sim,id)=>{const m=sim.def.metrics.find(x=>x.id===id);return m?m.get(sim):NaN;};
const f1=v=>Number.isFinite(v)?v.toFixed(1):'—',f2=v=>Number.isFinite(v)?v.toFixed(2):'—',f0=v=>Number.isFinite(v)?Math.round(v).toLocaleString('en-US'):'—';
/* run one of the tool's own action buttons, once per step, after `at` seconds */
function actAt(sim,tau,id,at){const key='_ls_'+id;if(sim[key]===sim.lnT0)return;if(tau<(at||0))return;sim[key]=sim.lnT0;const a=(sim.def.actions||[]).find(z=>z.id===id);if(a)a.run(sim);}
const CAL=(ctx,k,L)=>card(ctx,k,L,500,46,288);
const eqd=sim=>Number.isFinite(met(sim,'cData'))&&Math.abs(met(sim,'Tm')-met(sim,'Tw'))<0.3;
const CP=(ctx,k,L)=>card(ctx,k,L,14,58,262);
const EN=(ctx,k,L)=>card(ctx,k,L,486,60,302);
const EQ=(ctx,k,L)=>card(ctx,k,L,324,58,172);
const KS=(ctx,k,L)=>card(ctx,k,L,30,96,214);

BioLab.addLearn({
calorimetry: {
  goals: {
    bio: ['Heat always flows from hot to cold until the temperatures match', 'Why the same heat changes a metal’s temperature far more than water’s', 'How burning a snack under a can measures the energy in food'],
    honors: ['q = mcΔT, and heat lost by the metal = heat gained by the water', 'Finding a metal’s specific heat from your data', 'Why a soda-can calorimeter reads low, and how to make it better'],
    ap: ['Including the calorimeter’s own heat capacity, C_cal', 'Bomb calorimetry: q = C_cal·ΔT and ΔH_comb per gram', 'Sign conventions: q_rxn = −q_water']
  },
  matters: 'Every Calorie on a nutrition label, every hand warmer and every pot of pasta water runs on one rule: heat moves from hot to cold, and how much the temperature changes depends on what is soaking it up.',
  question: 'A 50 g copper block at 100 °C goes into 100 g of water at 20 °C. Where does the temperature end up: halfway at 60 °C, or somewhere else?',
  startKey: 'bath', startRun: false,
  steps: [
    { key: 'bath', title: 'Hot metal, cool water', set: { mode: 'metal', metal: 'cu', mMetal: 50 }, fresh: true, pause: true,
      see: 'A 50 g copper block sits in boiling water at 100 °C. In a moment it moves into a foam cup holding 100 g of water at 20 °C.',
      why: 'Temperature tells you how hard the particles are moving. The copper atoms are vibrating hard; the water molecules are moving more slowly. The foam cup keeps heat from leaking out, so we can track every joule.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['Before the drop',700,14],'Copper: '+f1(met(sim,'Tm'))+' °C','Water: '+f1(met(sim,'Tw'))+' °C']);} },
    { key: 'flow', title: 'Heat flows from hot to cold', set: { mode: 'metal', metal: 'cu', mMetal: 50 }, speed: 0.5, focus: [578,156,204,204],
      see: 'The block drops in. In the zoomed circle, the vibrating copper atoms bump the water molecules and pass them energy. Watch the two thermometer readings move toward each other.',
      why: 'Heat is energy moving from a hotter object to a cooler one because of the temperature difference. Each collision hands a little energy from the fast copper atoms to the slower water molecules.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['Heat is flowing',700,14,RED],'Copper now: '+f1(met(sim,'Tm'))+' °C','Water now: '+f1(met(sim,'Tw'))+' °C']);} },
    { key: 'equal', title: 'Thermal equilibrium', set: { mode: 'metal', metal: 'cu', mMetal: 50 }, speed: 3,
      see: 'The two temperatures meet at about 23.5 °C and stop. The copper fell about 76 °C, but the water rose only about 3.5 °C.',
      why: { bio: 'Heat stops flowing when the temperatures match. The water barely warmed because water soaks up a lot of heat for each degree. It is not an average: the final temperature sits close to the water’s start.', honors: 'Both lost and gained the same heat, about 1470 J. Copper’s heat capacity is 50 g × 0.385 = 19 J/°C; the water’s is 100 g × 4.184 = 418 J/°C. The same 1470 J moves the copper 22 times as many degrees.' },
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['Both at '+f1(met(sim,'Tw'))+' °C',700,14,GRN],'Copper changed '+f1(met(sim,'Tw')-100)+' °C','Water changed +'+f1(met(sim,'Tw')-20)+' °C']);} },
    { key: 'lead', title: 'Same mass of lead', set: { mode: 'metal', metal: 'pb', mMetal: 50 }, fresh: true, speed: 1.2,
      cause: { from: { metal: 'cu' }, delay: 1, label: 'Metal', ring: [150, 300, 60] },
      see: 'The copper is swapped for 50 g of lead, also at 100 °C. This time the water ends at only about 21.2 °C.',
      why: 'Lead’s specific heat is 0.129 J/g·°C, a third of copper’s. Each gram of lead stores less heat per degree, so it has less to give the water.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['50 g lead at 100 °C',700,14],'Water now: '+f1(met(sim,'Tw'))+' °C','(copper took it to 23.5 °C)']);} },
    { key: 'al', title: 'Same mass of aluminum', set: { mode: 'metal', metal: 'al', mMetal: 50 }, fresh: true, speed: 3,
      cause: { from: { metal: 'pb' }, delay: 1, label: 'Metal', ring: [150, 300, 60] },
      see: 'Now 50 g of aluminum. The water climbs to about 27.7 °C, much warmer than with copper or lead.',
      why: 'Aluminum’s specific heat is 0.897, the highest of these metals, so it carries the most heat into the cup. Even so, water (4.184) holds almost five times as much per gram.',
      so: 'That is why a metal pan heats up in seconds while the water in it takes minutes.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['50 g aluminum at 100 °C',700,14],'Water now: '+f1(met(sim,'Tw'))+' °C',['Al 0.897 · Cu 0.385 · Pb 0.129 J/g·°C',500,11.5]]);} },
    { key: 'q', lvl: 'honors', title: 'q = mcΔT', set: { mode: 'metal', metal: 'al', mMetal: 50 }, fresh: true, speed: 3, pause: false,
      see: 'Same aluminum drop. The card works the calculation from the thermometer readings as they settle.',
      why: 'q_water = m·c·ΔT = 100 g × 4.184 × 7.7 °C ≈ 3220 J. The metal lost the same heat, so c_metal = 3220 ÷ (50 g × 72.3 °C) ≈ 0.89 J/g·°C: aluminum.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['q_water = 100 × 4.184 × '+f1(met(sim,'Tw')-20),700,13],'= '+f0(met(sim,'qw'))+' J',['c_metal: '+(eqd(sim)?met(sim,'cData').toFixed(3)+' J/g·°C':'wait for equilibrium…'),700,13,RED]]);} },
    { key: 'cup', lvl: 'ap', title: 'The cup takes some heat too', set: { mode: 'metal', metal: 'al', mMetal: 50, Ccal: 40 }, fresh: true, speed: 3,
      cause: { from: { Ccal: 0 }, delay: 1, dur: 1.5, label: 'Cup heat capacity' },
      see: 'The cup now absorbs 40 J for every degree it warms. The water rises a little less, and c from the water alone drops to about 0.82.',
      why: 'The metal’s heat went into the water and the cup. Counting only the water undercounts q. Adding C_cal·ΔT (the “cup included” readout) recovers 0.897 J/g·°C.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['C_cal = 40 J/°C',700,14],'c from water only: '+(eqd(sim)?met(sim,'cData').toFixed(3):'wait…'),['c with cup: '+(eqd(sim)?met(sim,'cCup').toFixed(3):'wait…'),700,13,GRN]]);} },
    { key: 'snack', title: 'Burn a snack', set: { mode: 'food', snack: 'puff', mSnack: 1.2 }, fresh: true, speed: 2,
      see: 'A 1.20 g cheese puff burns under a soda can holding 100 g of water. The water warms as the puff shrinks to char.',
      why: 'Food stores energy in chemical bonds. Burning breaks those bonds and forms CO₂ and water, releasing heat, the same energy your body gets more slowly by digesting it.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['Cheese puff, 1.20 g',700,14],'Burned so far: '+f2(met(sim,'mBurn'))+' g','Water rise: +'+f1(met(sim,'dTw'))+' °C']);} },
    { key: 'lost', title: 'Where did the energy go?', set: { mode: 'food', snack: 'puff', mSnack: 1.2 }, speed: 4,
      see: 'The flame is out. The data give about 1.6 Calories per gram. The bag says 5.7.',
      why: { bio: 'Only the heat that reaches the water gets counted. Most of the flame’s heat warmed the air around the can. A soda-can calorimeter always reads low, never high.', honors: 'Only about 28% of the heat reached the water here. Heat lost to the air, heat that warmed the can, and char that never burned all make the result low.' },
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['Your result: '+f2(met(sim,'cpg'))+' Cal/g',700,14,RED],'Label: 5.71 Cal/g','Captured: about '+f0(met(sim,'pct'))+'%']);} },
    { key: 'shield', lvl: 'honors', title: 'Block the drafts', set: { mode: 'food', snack: 'puff', mSnack: 1.2, setup: 'shield' }, fresh: true, speed: 4,
      cause: { from: { setup: 'open' }, delay: 1, label: 'Can setup' },
      see: 'A foil draft shield wraps the can. The same puff now gives about 2.6 Cal/g, about 45% of the label.',
      why: 'The shield keeps hot gas around the can longer, so more heat reaches the water. Better, but heat still escapes, so the result is still low.',
      overlay(sim,ctx,LH,k){CAL(ctx,k,[['With a foil shield',700,14],'Result: '+f2(met(sim,'cpg'))+' Cal/g',['Captured: about '+f0(met(sim,'pct'))+'%',700,13,GRN]]);} },
    { key: 'bomb', lvl: 'ap', title: 'The bomb calorimeter', set: { mode: 'bomb', snack: 'puff', mSnack: 1.2 }, fresh: true, speed: 3,
      see: 'The same 1.20 g burns in pure oxygen inside a sealed steel bomb in 2 kg of water. The water rises only about 2.87 °C.',
      why: 'Almost no heat escapes, and C_cal = 10.00 kJ/°C, so q = 10.00 × 2.87 = 28.7 kJ, or 23.9 kJ/g: the label value. ΔH_comb = −23.9 kJ/g, negative because the reaction released the heat.',
      overlay(sim,ctx,LH,k){card(ctx,k,[['Bomb: ΔT = '+(Number.isFinite(met(sim,'dTB'))?met(sim,'dTB').toFixed(3):'…')+' °C',700,13],'q = '+f2(met(sim,'qB'))+' kJ',['ΔH_comb ≈ '+f2(met(sim,'dHc'))+' kJ/g',700,13,RED]],500,30,288);} }
  ],
  useIt: [
    { do: 'Let a pot of pasta water cool before you pour it out, and handle the metal pot with a holder even when the water seems only warm.',
      why: 'Water holds about 10 times as much heat per gram as steel, so it stays hot a long time. Metal heats up and burns you fast.' },
    { do: 'Read the Calories on a snack label as energy you can use.',
      why: 'A 160-Calorie bag of chips is 670 kJ, roughly the energy a teen uses walking about two miles. The number was set by burning food in a calorimeter and adjusting for what your body can digest.' },
    { do: 'When you run a soda-can lab, shield the can, stir, and use the mass that actually burned.', lvl: 'honors',
      why: 'Each of those changes cuts the biggest sources of error: heat lost to the air and char counted as burned.' }
  ],
  tryIt: [
    { title: 'the coin-and-cup test (10 minutes)',
      steps: ['Fill two mugs with the same amount of hot tap water.', 'Drop a big handful of room-temperature coins (or several steel spoons) into one mug. Leave the other alone.', 'After two minutes, feel the coins and dip a finger in each mug, or use a kitchen thermometer.'],
      look: 'The coins got much warmer, but the water in their mug cooled only a little compared with the other mug. Water’s high specific heat means it barely changes temperature for the heat it gives up.' }
  ]
},
coldpack: {
  goals: {
    bio: ['Why some salts make water colder and others make it warmer', 'Endothermic vs exothermic in a cup', 'How to design a cold pack or hand warmer'],
    honors: ['ΔH_soln from q = mcΔT and moles of salt', 'Breaking the solid apart vs water surrounding the ions', 'Why ΔT depends on concentration, not volume, in a neutralization'],
    ap: ['Lattice energy vs hydration energy', 'Limiting reactant in a neutralization', 'Why an endothermic process can still happen on its own (entropy)']
  },
  matters: 'Instant cold packs in a first-aid kit, hand warmers at a Broncos game and the calcium chloride spread on icy sidewalks all depend on how much energy a salt takes or gives back when it dissolves.',
  question: 'Why does ammonium nitrate make water cold, while calcium chloride makes it hot?',
  startKey: 'cold', startRun: false,
  steps: [
    { key: 'cold', title: 'A salt that cools the water', set: { mode: 'pack', salt: 'nh4no3', mass: 10, water: 100 }, fresh: true, speed: 1,
      see: '10 g of ammonium nitrate goes into 100 mL of water at 22 °C. As it dissolves, the thermometer falls to about 15 °C.',
      why: 'Pulling the ions out of the solid takes energy. For this salt, water gives back less than that when it surrounds the ions, so the difference comes out of the water’s own heat. Nothing adds “cold”; heat is taken away.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['NH₄NO₃: endothermic',700,14,BLU],'Solution: '+f1(met(sim,'T'))+' °C','ΔT so far: '+f1(met(sim,'dT'))+' °C']);} },
    { key: 'diagram', title: 'Energy in, energy out', set: { mode: 'pack', salt: 'nh4no3', mass: 10, water: 100 }, speed: 2, focus: [540,60,250,300],
      see: 'On the energy diagram, the red “in” arrow (breaking the solid apart) is taller than the blue “out” arrow (water surrounding the ions). The dissolved ions end up higher than the solid.',
      why: 'The gap between the two arrows is ΔH_soln: +25.7 kJ per mole of NH₄NO₃. Positive means energy was absorbed: endothermic.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['In > out',700,14,RED],'ΔH_soln = +25.7 kJ/mol','Heat comes from the water']);} },
    { key: 'hot', title: 'A salt that warms the water', set: { mode: 'pack', salt: 'cacl2', mass: 10, water: 100 }, fresh: true, speed: 1.5,
      cause: { from: { salt: 'nh4no3' }, delay: 1, label: 'Salt' },
      see: '10 g of calcium chloride instead. The thermometer climbs about 16 °C, to about 38 °C. On the diagram the “out” arrow is now the taller one.',
      why: 'Small, doubly charged Ca²⁺ ions pull water molecules in very strongly, so hydration releases more energy than breaking the solid took. The extra warms the water: exothermic, ΔH_soln = −81.3 kJ/mol.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['CaCl₂: exothermic',700,14,RED],'Solution: '+f1(met(sim,'T'))+' °C','ΔT: +'+f1(met(sim,'dT'))+' °C']);} },
    { key: 'salt', title: 'Table salt barely changes it', set: { mode: 'pack', salt: 'nacl', mass: 10, water: 100 }, fresh: true, speed: 1.5,
      cause: { from: { salt: 'cacl2' }, delay: 1, label: 'Salt' },
      see: 'Same 10 g, now table salt. The temperature drops only about 1.4 °C.',
      why: 'For NaCl the two energy steps almost cancel (ΔH_soln = +3.9 kJ/mol). The sign and size depend on the particular ions, so you can’t tell by looking at a salt.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['NaCl: nearly even',700,14],'ΔT: '+f1(met(sim,'dT'))+' °C']);} },
    { key: 'more', title: 'More salt, bigger change', set: { mode: 'pack', salt: 'nh4no3', mass: 20, water: 100 }, fresh: true, speed: 1.5,
      cause: { from: { mass: 10 }, delay: 1, dur: 1.5, label: 'Mass of salt' },
      see: 'Back to ammonium nitrate, but 20 g. The drop is now about 12.8 °C instead of 7.',
      why: 'Twice the salt absorbs twice the heat. The drop is a little less than double because the extra salt also adds mass to the solution.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['20 g NH₄NO₃',700,14],'ΔT: '+f1(met(sim,'dT'))+' °C',['(10 g gave −6.9 °C)',500,11.5]]);} },
    { key: 'dh', lvl: 'honors', title: 'ΔH_soln from your data', set: { mode: 'pack', salt: 'nh4no3', mass: 10, water: 100 }, fresh: true, speed: 2,
      see: 'One more 10 g run. The card turns the temperature change into kJ per mole.',
      why: 'q_solution = (110 g)(4.18)(−6.9 °C) ≈ −3160 J, so the salt absorbed +3160 J. Moles = 10.0 ÷ 80.04 = 0.125. ΔH_soln = +3.16 kJ ÷ 0.125 mol ≈ +25.7 kJ/mol.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['q_solution = '+f0(met(sim,'q'))+' J',700,13],'Dissolved: '+(Number.isFinite(met(sim,'nd'))?met(sim,'nd').toFixed(3):'—')+' mol',['ΔH_soln = '+f1(met(sim,'dH'))+' kJ/mol',700,13,RED]]);} },
    { key: 'design', lvl: 'honors', title: 'Design a cold pack', set: { mode: 'pack', salt: 'nh4no3', mass: 28.5, water: 100, target: 'cold' }, fresh: true, speed: 2,
      cause: { from: { mass: 10 }, delay: 1, dur: 2, label: 'Mass of salt' },
      see: 'Goal: 5 °C or colder. 28.5 g of NH₄NO₃ in 100 mL brings the solution to about 5.0 °C.',
      why: 'Set heat absorbed equal to heat lost: (m ÷ 80.04) × 25 700 J = (100 + m) × 4.18 × 17. Solving gives about 28 g. Real cold packs use about this ratio.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['Goal: 5 °C or colder',700,14],'Solution: '+f1(met(sim,'T'))+' °C',String(met(sim,'goal')||'')]);} },
    { key: 'neut', lvl: 'honors', title: 'Acid + base releases heat', set: { mode: 'neut', vA: 50, vB: 50, cA: 1, cB: 1 }, fresh: true, speed: 2,
      see: '50 mL of 1.0 M HCl meets 50 mL of 1.0 M NaOH. The mixture warms about 6.8 °C.',
      why: 'H₃O⁺ + OH⁻ → 2H₂O releases about 57 kJ per mole of water. 0.050 mol of water forms, so about 2.86 kJ warms 100 g of solution.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['HCl + NaOH',700,14],'ΔT: +'+f1(met(sim,'dT'))+' °C',['ΔH_neut ≈ '+f1(met(sim,'dHn'))+' kJ/mol',700,13,RED]]);} },
    { key: 'limit', lvl: 'ap', title: 'Extra base doesn’t help', set: { mode: 'neut', vA: 50, vB: 50, cA: 1, cB: 2 }, fresh: true, speed: 2,
      cause: { from: { cB: 1 }, delay: 1, dur: 1.5, label: 'NaOH concentration' },
      see: 'The NaOH doubles to 2.0 M. The temperature still rises only about 6.8 °C.',
      why: 'HCl is now limiting: only 0.050 mol of H₃O⁺ is there, so only 0.050 mol of water can form. Same heat, same mass of solution, same ΔT.',
      overlay(sim,ctx,LH,k){CP(ctx,k,[['NaOH doubled',700,14],'ΔT: +'+f1(met(sim,'dT'))+' °C',String(met(sim,'lim')||'')]);} }
  ],
  useIt: [
    { do: 'Squeeze an instant cold pack hard enough to break the inner pouch, then shake it so the salt dissolves fast.',
      why: 'The pack only cools while the salt is dissolving. Shaking spreads the salt through the water so it dissolves, and absorbs heat, all at once.' },
    { do: 'Wear gloves when you spread calcium chloride ice melt.',
      why: 'It releases heat as it dissolves in the moisture on your skin and can irritate or burn it. The same heat helps melt ice on sidewalks.' },
    { do: 'Never mix leftover lab acids and bases in a closed container.', lvl: 'honors',
      why: 'Neutralization releases about 57 kJ per mole of water formed. Concentrated solutions can boil and spatter.' }
  ],
  tryIt: [
    { title: 'the dissolving temperature test (10 minutes)',
      steps: ['Put the same amount of room-temperature water in three cups and check each with a kitchen thermometer.', 'Stir 2 tablespoons of table salt into one, 2 tablespoons of sugar into another, and 2 tablespoons of Epsom salt into the third.', 'Read each temperature after a minute of stirring.'],
      look: 'Epsom salt (magnesium sulfate heptahydrate) cools the water a little, salt and sugar barely change it. Every substance has its own heat of solution.' }
  ]
},
enthalpy: {
  goals: {
    bio: ['Breaking bonds always takes energy; forming bonds always releases it', 'Why burning releases heat', 'Endothermic vs exothermic on an energy diagram'],
    honors: ['Estimating ΔH from bond enthalpies: broken − formed', 'Hess’s law: flipping and scaling equations', 'Why ΔH depends on the amounts in the equation'],
    ap: ['ΔH°rxn = ΣnΔH°f(products) − ΣnΔH°f(reactants)', 'Why elements in their standard states have ΔH°f = 0', 'How the state of water changes ΔH']
  },
  matters: 'Every gas stove, car engine and campfire releases energy because forming the bonds in CO₂ and water gives back more than breaking the fuel’s bonds costs. The same accounting tells engineers which fuels pack the most energy.',
  question: 'Burning methane releases about 802 kJ per mole. Where does that energy come from, if breaking bonds always takes energy?',
  startKey: 'reactants', startRun: false,
  steps: [
    { key: 'reactants', title: 'The reactants', set: { mode: 'bonds', rxn: 'ch4' }, fresh: true, run(sim){actAt(sim,99,'r',0);},
      see: 'One methane molecule (CH₄) and two oxygen molecules (O₂): the fuel and air in a gas stove flame.',
      why: 'To burn, all of these bonds must break: 4 C–H bonds and 2 O=O double bonds. Then the atoms rearrange into CO₂ and H₂O.',
      overlay(sim,ctx,LH,k){EN(ctx,k,[['CH₄ + 2O₂ → CO₂ + 2H₂O',700,13.5],'Bonds to break: 4 C–H, 2 O=O','Bonds to form: 2 C=O, 4 O–H']);} },
    { key: 'break', title: 'Breaking bonds costs energy', set: { mode: 'bonds', rxn: 'ch4' }, speed: 0.6,
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'b',0.8);EN(ctx,k,[['Breaking: energy IN',700,14,RED],'4 × 413 + 2 × 498','= '+f0(met(sim,'ein'))+' kJ absorbed']);},
      see: 'The bonds pull apart one by one and the red “Energy in” bar grows to 2648 kJ. On the diagram, the atoms climb to the top level.',
      why: 'Atoms in a bond attract each other, so pulling them apart takes work, like pulling two magnets apart. Breaking a bond never releases energy.' },
    { key: 'form', title: 'Forming bonds releases energy', set: { mode: 'bonds', rxn: 'ch4' }, speed: 0.6,
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'f',0.8);EN(ctx,k,[['Forming: energy OUT',700,14,BLU],'2 × 799 + 4 × 463','= '+f0(met(sim,'eout'))+' kJ released']);},
      see: 'New bonds snap together: two C=O and four O–H. The blue “Energy out” bar grows to 3450 kJ, longer than the red one.',
      why: 'When atoms that attract each other come together, energy is released. The bonds in CO₂ and water are strong, so a lot comes out.' },
    { key: 'net', title: 'The difference is ΔH', set: { mode: 'bonds', rxn: 'ch4' }, pause: true,
      see: 'Energy out (3450 kJ) beats energy in (2648 kJ). The products sit 802 kJ below the reactants on the diagram.',
      why: { bio: 'More energy comes out than went in, so the extra, about 802 kJ per mole of methane, is released as heat. That makes burning exothermic.', honors: 'ΔH ≈ Σ(broken) − Σ(formed) = 2648 − 3450 = −802 kJ. Negative ΔH means exothermic. The accepted value is −802.3 kJ.' },
      overlay(sim,ctx,LH,k){EN(ctx,k,[['ΔH ≈ in − out',700,14],f0(met(sim,'ein'))+' − '+f0(met(sim,'eout')),['= '+f0(met(sim,'est'))+' kJ: exothermic',700,14,RED]]);} },
    { key: 'water', title: 'Splitting water goes uphill', set: { mode: 'bonds', rxn: 'h2o' }, fresh: true, speed: 0.6,
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'b',0.5);actAt(sim,tau,'f',4);EN(ctx,k,[['2H₂O → 2H₂ + O₂',700,13.5],'In: '+f0(met(sim,'ein'))+' kJ   Out: '+f0(met(sim,'eout'))+' kJ',['ΔH ≈ +'+f0(met(sim,'est'))+' kJ: endothermic',700,13,BLU]]);},
      see: 'Now the reverse kind of reaction: splitting water into hydrogen and oxygen. The red bar ends up longer than the blue one, and the products sit above the reactants.',
      why: 'Breaking four strong O–H bonds costs more than forming the H–H and O=O bonds gives back. That is why splitting water needs an energy source, like electricity from solar panels to make hydrogen fuel.' },
    { key: 'hcl', lvl: 'honors', title: 'Estimate it yourself', set: { mode: 'bonds', rxn: 'hcl' }, fresh: true, speed: 0.6,
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'b',0.5);actAt(sim,tau,'f',3.5);EN(ctx,k,[['H₂ + Cl₂ → 2HCl',700,13.5],'(436 + 242) − 2(431)',['= '+f0(met(sim,'est'))+' kJ',700,14,RED]]);},
      see: 'H₂ + Cl₂ → 2HCl. Watch the bars: 678 kJ in, 862 kJ out.',
      why: 'Count every bond: one H–H (436) and one Cl–Cl (242) break; two H–Cl (2 × 431) form. ΔH ≈ 678 − 862 = −184 kJ. Forgetting the 2 is the most common mistake.' },
    { key: 'hess', lvl: 'honors', title: 'Hess’s law: add equations', set: { mode: 'hess', puz: 'co', m1: 1, m2: -1, m3: 0 }, fresh: true, pause: true,
      cause: { from: { m2: 1 }, delay: 1.2, label: 'Equation 2' },
      see: 'Target: C + ½O₂ → CO. Equation 2 flips (× −1). CO₂ and ½O₂ cancel, and the sum matches the target.',
      why: 'ΔH is a state function: it depends only on start and finish. So you can add known reactions like puzzle pieces. Flipping changes ΔH’s sign; scaling multiplies it. −393.5 + 283.0 = −110.5 kJ.',
      overlay(sim,ctx,LH,k){card(ctx,k,[['Equation 2 × −1',700,14],'ΔH of the sum: '+f1(met(sim,'hsum'))+' kJ',String(met(sim,'hok')||'')],14,330,330);} },
    { key: 'hf', lvl: 'ap', title: 'Heats of formation', set: { mode: 'form', fr: 'ch4', ws: 'g' }, fresh: true, pause: true,
      see: 'The table lists ΔH°f for each substance. Products add to −877.1 kJ; reactants to −74.8 kJ (O₂ is 0).',
      why: 'ΔH°rxn = ΣnΔH°f(products) − ΣnΔH°f(reactants) = −877.1 − (−74.8) = −802.3 kJ. An element in its standard state has ΔH°f = 0 by definition.',
      overlay(sim,ctx,LH,k){EN(ctx,k,[['Products: '+f1(met(sim,'sP'))+' kJ',600,13],'Reactants: '+f1(met(sim,'sR'))+' kJ',['ΔH°rxn = '+f1(met(sim,'dHr'))+' kJ',700,14,RED]]);} },
    { key: 'liquid', lvl: 'ap', title: 'Liquid water releases more', set: { mode: 'form', fr: 'ch4', ws: 'l' }, fresh: true, pause: true,
      cause: { from: { ws: 'g' }, delay: 1.2, label: 'Water forms as' },
      see: 'Switch the water product from gas to liquid. ΔH°rxn drops from −802.3 to −890.3 kJ.',
      why: 'Condensing water releases heat (44.0 kJ/mol). Two moles of liquid water make the reaction 88.0 kJ more exothermic. High-efficiency furnaces capture that extra heat by condensing the water in their exhaust.',
      overlay(sim,ctx,LH,k){EN(ctx,k,[['Water as a liquid',700,14],['ΔH°rxn = '+f1(met(sim,'dHr'))+' kJ',700,14,RED],'(as a gas: −802.3 kJ)']);} }
  ],
  useIt: [
    { do: 'Never run a gas grill, generator or car in a closed garage.',
      why: 'A starved flame can’t form CO₂ completely and makes carbon monoxide instead, which is deadly. The full energy release (and safe products) needs plenty of oxygen.' },
    { do: 'Compare fuels by energy per gram.',
      why: 'Propane releases about 50 kJ/g, wood about 15–20 kJ/g. That is why a small propane tank cooks as much as a big pile of firewood.' },
    { do: 'Look for “condensing” on a furnace or water heater label.', lvl: 'ap',
      why: 'Condensing units cool their exhaust until the water vapor turns to liquid, capturing the extra heat of condensation: over 90% efficient instead of about 80%.' }
  ],
  tryIt: [
    { title: 'the hand-warmer packet (5 minutes)',
      steps: ['Open a disposable hand warmer and feel it warm up over a few minutes.', 'Read the ingredients on the back.', 'Seal it in a zip bag with the air squeezed out, then open the bag again later.'],
      look: 'It warms only with air. Iron powder reacts with oxygen to form iron oxide, forming strong Fe–O bonds and releasing heat. Sealed away from air, it cools down; opened again, it warms back up.' }
  ]
},
equilibrium: {
  goals: {
    bio: ['A reversible reaction runs both ways at once', 'At equilibrium the amounts stop changing, but the reactions keep going', 'Le Châtelier: a system shifts to undo a change'],
    honors: ['Comparing Q with K to predict the shift', 'Effects of concentration, volume and temperature', 'Why a catalyst doesn’t change the equilibrium amounts'],
    ap: ['Writing and using K expressions', 'K changes only with temperature (van ’t Hoff)', 'ICE tables and the Haber process trade-off']
  },
  matters: 'Fertilizer factories, the oxygen your blood carries, the fizz in a soda and the color of a sealed tube of NO₂ all depend on reactions that run both ways and settle where the two directions balance.',
  question: 'A sealed tube of brown NO₂ gas turns darker in hot water and paler in ice water, over and over. Nothing gets in or out. What is going on inside?',
  startKey: 'both', startRun: true,
  steps: [
    { key: 'both', title: 'Both directions at once', set: { sys: 'no2', Tg: 25 }, fresh: true, speed: 0.3,
      see: 'Colorless N₂O₄ molecules split into two brown NO₂ molecules, and NO₂ molecules pair back up into N₂O₄. Glowing rings mark each event.',
      why: 'The reaction N₂O₄ ⇌ 2NO₂ is reversible. Any molecule that splits can later rejoin, so both reactions run in the same box at the same time.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['N₂O₄ ⇌ 2NO₂',700,13.5],'[N₂O₄] '+(met(sim,'N2O4')||0).toFixed(3)+' M','[NO₂] '+(met(sim,'NO2')||0).toFixed(4)+' M']);} },
    { key: 'dynamic', title: 'Equilibrium is not stopped', set: { sys: 'no2', Tg: 25 }, speed: 0.6, focus: [500,240,290,145],
      see: 'The amounts settle at 0.043 M N₂O₄ and 0.014 M NO₂. The forward and reverse rate bars are equal, and neither is zero.',
      why: 'At equilibrium, molecules split and join at the same rate, so the totals stay the same. It is like a busy store where as many people walk in as walk out: the crowd inside stays the same size.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['At equilibrium',700,14,GRN],'Forward = reverse','Both still running']);} },
    { key: 'add', title: 'Add more reactant', set: { sys: 'no2', Tg: 25 }, speed: 0.6,
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'addR',1.2);EQ(ctx,k,[[tau<1.2?'Adding N₂O₄…':'N₂O₄ added',700,13.5],'[N₂O₄] '+(met(sim,'N2O4')||0).toFixed(3)+' M','[NO₂] '+(met(sim,'NO2')||0).toFixed(4)+' M',String(met(sim,'shift')||'')]);},
      see: 'Extra N₂O₄ goes in. The forward rate jumps, more NO₂ forms, and the mixture settles at new amounts: about 0.062 M N₂O₄ and 0.017 M NO₂.',
      why: { bio: 'More N₂O₄ means more splits each second, so the reaction shifts toward NO₂ until the two rates match again. This is Le Châtelier’s principle: the system shifts to use up some of what you added.', honors: 'Adding N₂O₄ makes Q = [NO₂]²/[N₂O₄] smaller than K, so the reaction runs forward until Q = K again. K itself never changed.' } },
    { key: 'heat', title: 'Heat it up', set: { sys: 'no2', Tg: 80 }, fresh: true, speed: 0.6,
      cause: { from: { Tg: 25 }, delay: 1.2, dur: 2.5, label: 'Temperature', ring: [748, 112, 46] },
      see: 'The tube heats from 25 °C to 80 °C and turns dark brown. [NO₂] climbs from 0.014 M to about 0.059 M.',
      why: { bio: 'Splitting N₂O₄ absorbs heat. Heating the tube favors the direction that uses heat up, so more molecules split into brown NO₂.', honors: 'The forward reaction is endothermic (ΔH° = +57.2 kJ/mol), so heating raises K: from 0.0046 at 25 °C to 0.17 at 80 °C. Temperature is the only change that alters K.' },
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['Now '+Math.round(sim.p.Tg)+' °C',700,14,RED],'[NO₂] '+(met(sim,'NO2')||0).toFixed(4)+' M',['(at 25 °C: 0.0141 M)',500,11.5]]);} },
    { key: 'cold', title: 'Cool it down', set: { sys: 'no2', Tg: 0 }, fresh: true, speed: 0.6,
      cause: { from: { Tg: 25 }, delay: 1.2, dur: 2.5, label: 'Temperature', ring: [748, 112, 46] },
      see: 'Now into ice water at 0 °C. The tube turns pale as [NO₂] falls to about 0.005 M.',
      why: 'Cooling removes heat, so the reaction shifts toward the side that releases heat: NO₂ pairs back up into colorless N₂O₄.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['Now '+Math.round(sim.p.Tg)+' °C',700,14,BLU],'[NO₂] '+(met(sim,'NO2')||0).toFixed(4)+' M']);} },
    { key: 'squeeze', lvl: 'honors', title: 'Squeeze the container', set: { sys: 'no2', Tg: 25, V: 0.5 }, fresh: true, speed: 0.6,
      cause: { from: { V: 1 }, delay: 1.2, dur: 2, label: 'Volume', ring: [326, 215, 44] },
      see: 'The volume halves from 1.0 L to 0.5 L. Both gases crowd together, then the mixture shifts toward N₂O₄.',
      why: 'Halving V doubles every concentration, but Q = [NO₂]²/[N₂O₄] doubles, so Q > K. Shifting left turns 2 NO₂ into 1 N₂O₄, fewer gas molecules, which lowers the pressure.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['V = '+sim.p.V.toFixed(1)+' L',700,14],'[N₂O₄] '+(met(sim,'N2O4')||0).toFixed(3)+' M','Pressure: '+f2(met(sim,'P'))+' atm']);} },
    { key: 'haber', lvl: 'honors', title: 'Making ammonia', set: { sys: 'haber', Th: 450 }, fresh: true, speed: 0.6,
      see: 'The Haber process: N₂ + 3H₂ ⇌ 2NH₃ at 450 °C. About 24% of the gas is ammonia at equilibrium.',
      why: 'This reaction makes the nitrogen fertilizer that grows about half the world’s food. Four gas molecules become two, and it releases heat, so engineers push the conditions to favor ammonia.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['Haber, 450 °C',700,13.5],'NH₃: '+f1(met(sim,'yield'))+'% of the gas']);} },
    { key: 'cat', lvl: 'honors', title: 'A catalyst: faster, not more', set: { sys: 'haber', Th: 450, cat: true }, fresh: true, speed: 0.6,
      see: 'Iron catalyst added. Both rate bars jump, but the ammonia share settles at the same 24%.',
      why: 'A catalyst lowers the energy hill for the forward and reverse reactions equally. Equilibrium arrives sooner, but K and the amounts don’t change. Factories use iron because time is money.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['With catalyst',700,14,GRN],'NH₃: '+f1(met(sim,'yield'))+'% (same)']);} },
    { key: 'hot', lvl: 'ap', title: 'The temperature trade-off', set: { sys: 'haber', Th: 550 }, fresh: true, speed: 0.6,
      cause: { from: { Th: 450 }, delay: 1.2, dur: 2, label: 'Temperature' },
      see: 'Heating from 450 °C to 550 °C drops K from 0.16 to 0.025, and ammonia falls to about 14%.',
      why: 'The forward reaction is exothermic (ΔH° = −92 kJ), so K falls as T rises. But at low temperatures the reaction is far too slow. Industry compromises around 400–450 °C, high pressure and a catalyst, and recycles unreacted gas.',
      overlay(sim,ctx,LH,k){EQ(ctx,k,[['Now '+Math.round(sim.p.Th)+' °C',700,14,RED],'K = '+String(met(sim,'K')),'NH₃: '+f1(met(sim,'yield'))+'%']);} }
  ],
  useIt: [
    { do: 'Keep soda cold and capped tightly.',
      why: 'CO₂(g) ⇌ CO₂(aq) is an equilibrium. Cold and pressure both push it toward dissolved CO₂; warm and open, the gas escapes and the drink goes flat.' },
    { do: 'Breathe slowly into a bag only if a medical provider tells you to; otherwise, slow your breathing.',
      why: 'Your blood’s pH is set by CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻. Breathing too fast removes CO₂ and shifts that equilibrium, which is why hyperventilating makes your hands tingle.' },
    { do: 'Know why a fertilizer plant runs hot and high-pressure.', lvl: 'honors',
      why: 'Every bag of nitrogen fertilizer comes from balancing equilibrium (low T and high P favor ammonia) against rate (high T is faster). About half the nitrogen in your body passed through a Haber reactor.' }
  ],
  tryIt: [
    { title: 'the red cabbage color shift (15 minutes)',
      steps: ['Chop a few leaves of red cabbage, cover them with hot tap water and let them soak 10 minutes. Strain out the purple liquid.', 'Pour a little into three clear cups. Add a spoon of vinegar to one and a pinch of baking soda to another.', 'Now add baking soda to the vinegar cup, a pinch at a time.'],
      look: 'The pigment exists in an acid form and a base form in equilibrium. Vinegar pushes it to pink, baking soda to green-blue, and adding the opposite pushes it back: the same shift you saw with NO₂.' }
  ]
},
ksp: {
  goals: {
    bio: ['“Insoluble” salts dissolve a tiny bit', 'Saturated means dissolving and re-forming at the same rate', 'Extra solid just sits on the bottom'],
    honors: ['Ksp, molar solubility and the ion product Q', 'The common-ion effect', 'Predicting a precipitate when two solutions mix'],
    ap: ['Ksp = 4s³ and other ion ratios', 'Why only same-ratio salts can be compared by Ksp alone', 'How pH changes the solubility of hydroxides']
  },
  matters: 'Kidney stones, the white crust on a shower head, tooth enamel and the barium drink doctors use for X-rays all depend on how much of a “insoluble” salt actually dissolves.',
  question: 'Silver chloride is called insoluble. If you stir 5 mg into 100 mL of water, does any of it dissolve?',
  startKey: 'dissolve', startRun: true,
  steps: [
    { key: 'dissolve', title: 'A little dissolves', set: { mode: 'dissolve', salt: 'AgCl', amt: '5' }, fresh: true, speed: 0.6,
      see: '5 mg of AgCl sits in 100 mL of water. In the zoomed view, Ag⁺ and Cl⁻ ions break off the crystal and drift into the water.',
      why: 'Even an “insoluble” ionic solid loses a few ions to water. Every salt dissolves at least a tiny bit.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['AgCl in water',700,14],String(met(sim,'state')||''),'Solid left: '+f2(met(sim,'solid'))+' mg']);} },
    { key: 'sat', title: 'Saturated: a two-way street', set: { mode: 'dissolve', salt: 'AgCl', amt: '5' }, speed: 0.6, focus: [270,60,240,330],
      see: 'Ions keep leaving the crystal, and other ions land back on it. About 0.19 mg dissolves, and 4.81 mg stays solid.',
      why: 'Once the water holds as many ions as it can, ions rejoin the crystal as fast as they leave. That balance is a saturated solution, an equilibrium: AgCl(s) ⇌ Ag⁺ + Cl⁻.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['Saturated',700,14,GRN],'Dissolved: '+f2(met(sim,'gL'))+' mg per 100 mL','Solid: '+f2(met(sim,'solid'))+' mg']);} },
    { key: 'more', title: 'More solid, same ions', set: { mode: 'dissolve', salt: 'AgCl', amt: '100' }, fresh: true, speed: 0.6,
      cause: { from: { amt: '5' }, delay: 1, label: 'Solid added' },
      see: 'Now 100 mg of AgCl. The pile on the bottom is bigger, but the ions in solution are exactly the same: 1.33 × 10⁻⁵ M.',
      why: 'The water can only hold so much at this temperature. Extra solid adds to the pile, not to the dissolved amount.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['100 mg added',700,14],'Dissolved: '+f2(met(sim,'gL'))+' mg (same)','Solid: '+f2(met(sim,'solid'))+' mg']);} },
    { key: 'little', title: 'Less than the limit: all of it dissolves', set: { mode: 'dissolve', salt: 'AgCl', amt: '0.1' }, fresh: true, speed: 0.6,
      cause: { from: { amt: '5' }, delay: 1, label: 'Solid added' },
      see: 'Only 0.1 mg this time. It all dissolves and nothing is left on the bottom.',
      why: '0.1 mg is less than the 0.19 mg that 100 mL can hold, so the solution is unsaturated.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['0.1 mg added',700,14],String(met(sim,'state')||'')]);} },
    { key: 'pbi2', title: 'Different salts, different limits', set: { mode: 'dissolve', salt: 'PbI2', amt: '100' }, fresh: true, speed: 0.6,
      see: 'Lead(II) iodide: bright yellow, and about 62 mg dissolves in 100 mL, over 300 times as much as AgCl.',
      why: 'Each salt has its own balance between the ions’ pull on each other and water’s pull on the ions. Chemists summarize it with one number per salt: Ksp.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['PbI₂',700,14],'Dissolved: '+f1(met(sim,'gL'))+' mg per 100 mL']);} },
    { key: 'kspexpr', lvl: 'honors', title: 'Ksp = [Ag⁺][Cl⁻]', set: { mode: 'dissolve', salt: 'AgCl', amt: '5' }, fresh: true, speed: 0.6, focus: [586,46,206,320],
      see: 'Back to AgCl. The key panel shows Q, the product of the ion concentrations, sitting exactly on Ksp = 1.77 × 10⁻¹⁰.',
      why: 'At saturation [Ag⁺] = [Cl⁻] = s, so Ksp = s² and s = √(1.77 × 10⁻¹⁰) = 1.33 × 10⁻⁵ M. The solid itself doesn’t appear in the expression.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['s = '+String(met(sim,'s')),700,13.5],'Q = '+String(met(sim,'Q')),'Ksp = '+String(met(sim,'Ksp'))]);} },
    { key: 'common', lvl: 'honors', title: 'The common-ion effect', set: { mode: 'dissolve', salt: 'AgCl', amt: '5', common: '0.01' }, fresh: true, speed: 0.6,
      cause: { from: { common: '0' }, delay: 1.2, label: 'Extra Cl⁻' },
      see: 'NaCl is added so [Cl⁻] = 0.010 M. Silver ions get pushed back onto the crystal: [Ag⁺] drops to 1.8 × 10⁻⁸ M, about 750 times less.',
      why: 'Ksp = [Ag⁺][Cl⁻] stays fixed. With [Cl⁻] held high, [Ag⁺] must be tiny. Extra Cl⁻ shifts AgCl(s) ⇌ Ag⁺ + Cl⁻ to the left.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['[Cl⁻] = 0.010 M',700,14],'s = '+String(met(sim,'s')),['(pure water: 1.33 × 10⁻⁵ M)',500,11.5]]);} },
    { key: 'mix', lvl: 'honors', title: 'Will a precipitate form?', set: { mode: 'mix', salt: 'AgCl', m1: '0.0001', m2: '0.0001' }, fresh: true, speed: 0.6,
      cause: { from: { m1: '0.00001', m2: '0.00001' }, delay: 1.2, label: 'Concentrations' },
      see: 'Two very dilute solutions mix. At 10⁻⁵ M each, nothing forms. At 10⁻⁴ M each, a white haze of AgCl appears.',
      why: 'After mixing, Q = [Ag⁺][Cl⁻]. At 10⁻⁴ M each, Q = (5 × 10⁻⁵)² = 2.5 × 10⁻⁹, bigger than Ksp, so solid comes out until Q = Ksp. Q < Ksp: stays clear.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['Q vs Ksp',700,14],String(met(sim,'state')||''),'Solid: '+f2(met(sim,'solid'))+' mg']);} },
    { key: 'cube', lvl: 'ap', title: 'PbI₂: Ksp = 4s³', set: { mode: 'dissolve', salt: 'PbI2', amt: '100' }, fresh: true, speed: 0.6,
      see: 'Each PbI₂ that dissolves gives one Pb²⁺ and two I⁻. The readouts show [I⁻] is exactly twice [Pb²⁺].',
      why: '[Pb²⁺] = s and [I⁻] = 2s, so Ksp = s(2s)² = 4s³. With Ksp = 9.8 × 10⁻⁹, s = 1.35 × 10⁻³ M. Compare Ksp values directly only for salts with the same ion ratio.',
      overlay(sim,ctx,LH,k){KS(ctx,k,[['PbI₂ ⇌ Pb²⁺ + 2I⁻',700,13.5],'s = '+String(met(sim,'s')),['Ksp = 4s³',700,13,RED]]);} }
  ],
  useIt: [
    { do: 'Drink plenty of water, especially in hot weather or after sports.',
      why: 'Kidney stones form when urine holds more calcium oxalate than its solubility limit. More water keeps the ions dilute, below saturation.' },
    { do: 'Soak a crusty shower head in vinegar overnight.',
      why: 'The white crust is calcium carbonate from hard water. Acid removes carbonate ions, so Q drops below Ksp and the crust dissolves.' },
    { do: 'Use fluoride toothpaste.', lvl: 'honors',
      why: 'Fluoride helps rebuild enamel as fluorapatite, which is less soluble in acid than the original enamel. Acid from bacteria then dissolves less of your teeth.' }
  ],
  tryIt: [
    { title: 'the saturated salt jar (20 minutes)',
      steps: ['Stir table salt into a half cup of room-temperature water a teaspoon at a time, stirring a full minute each time.', 'Stop when some salt stays on the bottom no matter how long you stir.', 'Add one more teaspoon and stir again.'],
      look: 'Once salt stays on the bottom, the water is saturated (about 36 g per 100 mL). The extra teaspoon just adds to the pile, just like extra AgCl in the lab.' }
  ]
}
});
})();
