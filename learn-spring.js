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
const GL=(ctx,k,L)=>card(ctx,k,L,388,236,200);

BioLab.addLearn({
gaslaws: {
  goals: {
    bio: ['Gas pressure is molecules hitting the walls', 'Heating a sealed gas raises its pressure; squeezing it does too', 'At steady pressure, a warmer gas takes up more room'],
    honors: ['Boyle’s, Charles’s and Gay-Lussac’s laws, always in kelvins', 'Avogadro’s law: pressure goes with the amount of gas', 'PV = nRT ties them together'],
    ap: ['R from your own readings', 'When real gases stop acting ideal (Z ≠ 1)', 'Explaining each law with molecular speed and collision rate']
  },
  matters: 'Car tires going soft on the first cold morning, a bag of chips puffing up on the drive to the mountains, and a pressure cooker all follow the same few rules about how gas molecules move.',
  question: 'A sealed, rigid box of gas goes from 0 °C to 273 °C. Does the pressure go up 273 times, double, or stay the same?',
  startKey: 'hits', startRun: true,
  steps: [
    { key: 'hits', title: 'Pressure is molecules hitting walls', set: { mode: 'box', hold: 'V', vol: 22.4, T: 273, mol: 1 }, fresh: true, speed: 0.4,
      see: 'One mole of gas locked in 22.4 L at 273 K (0 °C). Each orange flash on a wall is a molecule bouncing off it. The gauge reads about 1.0 atm.',
      why: 'Every bounce pushes on the wall. Billions of bounces each second add up to a steady push on every square centimeter: that is pressure.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['Wall hits',700,14],f0(met(sim,'hits'))+' per second (dots shown)','Pressure: '+f2(met(sim,'P'))+' atm']);} },
    { key: 'heat', title: 'Heat it: same box, more pressure', set: { mode: 'box', hold: 'V', vol: 22.4, T: 546, mol: 1 }, speed: 0.4,
      cause: { from: { T: 273 }, delay: 1, dur: 3, label: 'Temperature', ring: [200, 438, 70] },
      see: 'The heater takes the gas from 273 K to 546 K. The molecules speed up, the wall flashes come faster, and the pressure climbs to about 2.0 atm.',
      why: { bio: 'Faster molecules hit the walls more often and harder. Double the kelvin temperature and the pressure doubles. That is why tire pressure drops on a cold morning.', honors: 'Gay-Lussac’s law: at constant V and n, P ∝ T in kelvins. 273 → 546 K doubles T, so P doubles. In °C (0 → 273) the ratio makes no sense, which is why gas laws use kelvins.' },
      overlay(sim,ctx,LH,k){GL(ctx,k,[['Gas: '+f0(met(sim,'TK'))+' K (started at 273)',700,13.5,RED],'Pressure: '+f2(met(sim,'P'))+' atm','Wall hits: '+f0(met(sim,'hits'))+' per second']);} },
    { key: 'squeeze', title: 'Squeeze it: half the space', set: { mode: 'box', hold: 'V', vol: 11.2, T: 273, mol: 1 }, fresh: true, speed: 0.4,
      cause: { from: { vol: 22.4 }, delay: 1, dur: 3, label: 'Volume', ring: [200, 210, 60] },
      see: 'Back to 273 K. The piston pushes down from 22.4 L to 11.2 L. The same molecules, at the same speed, now hit the walls about twice as often. The pressure doubles to about 2.0 atm.',
      why: 'Half the space means each molecule reaches a wall twice as often. Boyle’s law: at constant temperature, P × V stays the same, so halving V doubles P.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['V = '+f1(met(sim,'V'))+' L',700,14],'Pressure: '+f2(met(sim,'P'))+' atm','Wall hits: '+f0(met(sim,'hits'))+' per second']);} },
    { key: 'float', title: 'Let the piston float', set: { mode: 'box', hold: 'P', vol: 22.4, T: 546, mol: 1 }, fresh: true, speed: 0.4,
      cause: { from: { T: 273 }, delay: 1, dur: 3, label: 'Temperature', ring: [200, 438, 70] },
      see: 'Now the piston is free to move. As the gas heats to 546 K, it pushes the piston up until the volume doubles to 44.8 L. The pressure stays at 1.0 atm.',
      why: 'Faster molecules push harder, so the piston rises until the wall hits spread over more space and the pressure matches the outside again. Charles’s law: at constant P, V ∝ T in kelvins.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['Gas: '+f0(met(sim,'TK'))+' K',700,14,RED],'V = '+f1(met(sim,'V'))+' L','Pressure: '+f2(met(sim,'P'))+' atm']);} },
    { key: 'balloon', title: 'A balloon in hot and cold water', set: { mode: 'balloon', bath: 'boil' }, fresh: true, speed: 0.6,
      cause: { from: { bath: 'ice' }, delay: 2.5, label: 'Water bath' },
      see: 'A balloon goes from ice water (273 K) into boiling water (373 K). It shrinks to about 1.85 L in the ice, then swells to about 2.53 L in the boiling water.',
      why: 'The rubber keeps the pressure inside close to the air outside, so the balloon behaves like the floating piston: the volume follows the kelvin temperature. 373 ÷ 273 = 1.37, and 2.53 ÷ 1.85 = 1.37.',
      overlay(sim,ctx,LH,k){card(ctx,k,[['Balloon: '+f2(met(sim,'V'))+' L',700,14],'Gas at '+f0(met(sim,'TK'))+' K'],600,20,188);} },
    { key: 'syringe', lvl: 'honors', title: 'Boyle’s law with a syringe', set: { mode: 'syringe', syr: 5 }, fresh: true, speed: 0.6,
      cause: { from: { syr: 10 }, delay: 1, dur: 3, label: 'Plunger position' },
      see: 'A sealed syringe with 10 mL of air at 1.0 atm. The plunger pushes in to 5 mL, and the pressure rises to about 2.0 atm.',
      why: 'P₁V₁ = P₂V₂: (1.0 atm)(10 mL) = P₂(5 mL), so P₂ = 2.0 atm. You can feel it: the further you push, the harder the air pushes back.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['V = '+f1(met(sim,'Vml'))+' mL',700,14],'Pressure: '+f2(met(sim,'P'))+' atm','P × V ≈ '+f1(met(sim,'P')*met(sim,'Vml'))+' atm·mL']);} },
    { key: 'amount', lvl: 'honors', title: 'Less gas, less pressure', set: { mode: 'box', hold: 'V', vol: 22.4, T: 273, mol: 0.5 }, fresh: true, speed: 0.4,
      cause: { from: { mol: 1 }, delay: 1, dur: 2.5, label: 'Amount of gas' },
      see: 'Half the gas is let out of the locked 22.4 L box at 273 K. Fewer molecules means fewer wall hits, and the pressure falls to about 0.5 atm.',
      why: 'Avogadro’s law: at the same T and V, pressure is proportional to the number of molecules. Together, the laws make PV = nRT.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['n = '+String(met(sim,'nmol'))+' mol',700,14],'Pressure: '+f2(met(sim,'P'))+' atm']);} },
    { key: 'r', lvl: 'ap', title: 'Measure R yourself', set: { mode: 'box', hold: 'V', vol: 22.4, T: 546, mol: 1 }, fresh: true, speed: 0.4,
      see: 'Same 1 mol in 22.4 L, now at 546 K. Divide your readings: PV ÷ nT.',
      why: 'R = PV ÷ nT = (2.0 atm)(22.4 L) ÷ (1 mol)(546 K) ≈ 0.0821 L·atm/(mol·K). Any ideal gas, any conditions, gives the same R.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['R from your readings',700,13.5],f2(met(sim,'P'))+' × 22.4 ÷ (1 × '+f0(met(sim,'TK'))+')',['= '+(Number.isFinite(met(sim,'Rx'))?met(sim,'Rx').toFixed(4):'—'),700,13.5,RED]]);} },
    { key: 'real', lvl: 'ap', title: 'When gases stop acting ideal', set: { mode: 'box', hold: 'V', vol: 2, T: 300, mol: 1.5, gas: 'CO2' }, fresh: true, speed: 0.4,
      cause: { from: { gas: 'ideal' }, delay: 1, label: 'Gas' },
      see: '1.5 mol of CO₂ squeezed into 2 L. The real pressure comes out below what PV = nRT predicts: Z = PV ÷ nRT drops below 1.',
      why: 'Crowded together, real CO₂ molecules attract each other, so they hit the walls a little less hard. Ideal gases have no attractions and no size; real gases act ideal only when molecules are far apart.',
      overlay(sim,ctx,LH,k){GL(ctx,k,[['CO₂, crowded',700,14],'Pressure: '+f2(met(sim,'P'))+' atm',['Z = '+(Number.isFinite(met(sim,'Z'))?met(sim,'Z').toFixed(3):'—'),700,13.5,RED]]);} }
  ],
  useIt: [
    { do: 'Check tire pressure with the tires cold, and top them up when the weather turns cold.',
      why: 'A drop from 70 °F to 20 °F lowers the pressure by about 10%. Underinflated tires grip worse, wear faster and waste gas.' },
    { do: 'Open a sealed bag of chips slowly after driving up to the mountains.',
      why: 'The bag was sealed at lower altitude. Outside pressure falls as you climb, so the gas inside expands and the bag puffs up (Boyle’s law).' },
    { do: 'Never heat a sealed can or bottle, or throw an aerosol can in a fire.', lvl: 'honors',
      why: 'At constant volume, pressure rises with kelvin temperature until the container bursts.' }
  ],
  tryIt: [
    { title: 'the bottle in the freezer (15 minutes)',
      steps: ['Take an empty plastic water bottle, squeeze nothing out, and cap it tightly at room temperature.', 'Put it in the freezer for 10–15 minutes.', 'Take it out and leave it on the counter.'],
      look: 'The bottle crumples in the cold as the air inside loses pressure, then slowly fills back out as it warms. Same air, same amount: only the temperature changed.' }
  ]
},
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
/* ---- Feb–Mar units: kinetic molecular theory, states, phase diagrams, gas stoichiometry (added Nov 14, 2026) ---- */
const KM=(ctx,k,L)=>card(ctx,k,L,526,256,266);
const KR=(ctx,k,L)=>card(ctx,k,L,330,40,300);
const STT=(ctx,k,L)=>card(ctx,k,L,430,388,350);
const PDC=(ctx,k,L)=>card(ctx,k,L,530,384,262);
const GSM=(ctx,k,L)=>card(ctx,k,L,632,40,160);
const GSB=(ctx,k,L)=>card(ctx,k,L,20,60,190);
const doAct=(sim,id)=>{const a=(sim.def.actions||[]).find(z=>z.id===id);if(a)a.run(sim);};
const txt=(sim,id)=>{const v=met(sim,id);return v==null||v!==v?'—':String(v);};

BioLab.addLearn({
kmt: {
  goals: {
    bio: ['Gas molecules are always moving, at many different speeds', 'Hotter means faster', 'Light molecules move faster than heavy ones at the same temperature'],
    honors: ['Temperature measures average kinetic energy', 'Graham’s law: rate ∝ 1/√M', 'Partial pressures add up (Dalton’s law)'],
    ap: ['The Maxwell–Boltzmann distribution', 'u_rms = √(3RT/M)', 'Why KE depends only on T, not on the gas']
  },
  matters: 'Why you can smell cookies from across the house, why helium balloons go flat overnight, and why tires look low on a cold morning all come down to how fast gas molecules move.',
  question: 'At room temperature, which moves faster: a helium atom or a heavy xenon atom? And do they carry the same energy?',
  startKey: 'box', startRun: true,
  steps: [
    { key: 'box', title: 'Molecules in a box', set: { mode: 'dist', gasA: 'N2', T: 300, gasB: 'none' }, fresh: true, speed: 1,
      see: 'Nitrogen at 300 K. The molecules zip around and bounce off the walls and each other. The bar chart shows how many have each speed.',
      why: 'No two molecules have the same speed for long, because collisions trade energy. The average is about 470 m/s, faster than a jet airliner.',
      overlay(sim,ctx,LH,k){KM(ctx,k,[['N₂ at '+f0(sim.p.T)+' K',700,14],'Average speed: '+f0(met(sim,'vA'))+' m/s','Average energy: '+f2(met(sim,'keA'))+' kJ/mol']);} },
    { key: 'hot', title: 'Heat it up', set: { mode: 'dist', gasA: 'N2', T: 600, gasB: 'none' }, fresh: true, speed: 1,
      cause: { from: { T: 300 }, delay: 0.8, dur: 2, label: 'Temperature' },
      see: 'Double the temperature to 600 K. The average energy doubles, and the speed rises by about 40%.',
      why: { bio: 'Temperature is a measure of how much the molecules jiggle. Hotter gas means faster molecules.', honors: 'Average kinetic energy ∝ T, so it doubles. KE = ½mv², so speed goes as √T: √2 ≈ 1.41 times faster.' },
      overlay(sim,ctx,LH,k){KM(ctx,k,[['N₂ at '+f0(sim.p.T)+' K',700,14],'Average speed: '+f0(met(sim,'vA'))+' m/s','Average energy: '+f2(met(sim,'keA'))+' kJ/mol']);} },
    { key: 'he', title: 'A lighter gas', set: { mode: 'dist', gasA: 'He', T: 300, gasB: 'none' }, fresh: true, speed: 1,
      see: 'Helium at 300 K averages about 1,250 m/s. Its average energy is the same 3.7 kJ/mol as nitrogen.',
      why: 'Same temperature, same average kinetic energy. A light molecule has to move faster to carry the same energy.',
      overlay(sim,ctx,LH,k){KM(ctx,k,[['He at 300 K',700,14],'Average speed: '+f0(met(sim,'vA'))+' m/s',['Average energy: '+f2(met(sim,'keA'))+' kJ/mol',700,13,GRN]]);} },
    { key: 'xe', title: 'A heavy gas', set: { mode: 'dist', gasA: 'Xe', T: 300, gasB: 'none' }, fresh: true, speed: 1,
      see: 'Xenon (131 g/mol) crawls along at about 220 m/s, with the same 3.7 kJ/mol of energy.',
      why: 'Mass and speed trade off: KE = ½mv². Heavier molecules move slower at the same temperature.',
      overlay(sim,ctx,LH,k){KM(ctx,k,[['Xe at 300 K',700,14],'Average speed: '+f0(met(sim,'vA'))+' m/s',['Average energy: '+f2(met(sim,'keA'))+' kJ/mol',700,13,GRN]]);} },
    { key: 'mix', lvl: 'honors', title: 'A mixture', set: { mode: 'dist', gasA: 'N2', T: 300, gasB: 'He', nA: 100, nB: 50 }, fresh: true, speed: 1,
      see: 'Add 50 helium atoms to the 100 nitrogen molecules. Each gas pushes on the walls on its own, and the pressures add up.',
      why: 'Dalton’s law: P_total = P_N₂ + P_He. Each gas’s share of the pressure matches its share of the molecules, here 2/3 and 1/3.',
      overlay(sim,ctx,LH,k){KM(ctx,k,[['N₂ + He',700,14],'P(N₂) '+f2(met(sim,'PA'))+' + P(He) '+f2(met(sim,'PB'))+' atm','Total: '+f2(met(sim,'Pt'))+' atm']);} },
    { key: 'race', title: 'The diffusion race', set: { mode: 'race', pair: 'hcl' }, fresh: true, speed: 1,
      see: 'NH₃ starts at the left end of the tube and HCl at the right. Where they meet, a white ring of NH₄Cl forms, closer to the HCl end.',
      why: { bio: 'Ammonia molecules are lighter (17 g/mol vs. 36.5 g/mol), so they travel farther in the same time.', honors: 'Graham’s law: rate ratio = √(36.46 ÷ 17.03) = 1.46. The NH₃ travels 1.46 times as far.' },
      overlay(sim,ctx,LH,k){KR(ctx,k,[['NH₃ + HCl',700,14],'NH₃: '+f1(met(sim,'dA'))+' cm   HCl: '+f1(met(sim,'dB'))+' cm','Ratio: '+f2(met(sim,'dr'))]);} },
    { key: 'hbr', lvl: 'honors', title: 'A heavier acid', set: { mode: 'race', pair: 'hbr' }, fresh: true, speed: 1,
      see: 'Swap HCl for HBr (80.9 g/mol). The ring forms even closer to the acid end.',
      why: 'The heavier the acid, the slower it travels: √(80.91 ÷ 17.03) = 2.18.',
      overlay(sim,ctx,LH,k){KR(ctx,k,[['NH₃ + HBr',700,14],'NH₃: '+f1(met(sim,'dA'))+' cm   HBr: '+f1(met(sim,'dB'))+' cm','Ratio: '+f2(met(sim,'dr'))]);} },
    { key: 'rms', lvl: 'ap', title: 'The speed formula', set: { mode: 'dist', gasA: 'N2', T: 300, gasB: 'none' }, fresh: true, speed: 1,
      see: 'Compare the measured rms speed with u_rms = √(3RT/M) and the most probable speed at the peak of the curve.',
      why: '√(3 × 8.314 × 300 ÷ 0.0280) = 517 m/s. The curve’s peak (most probable) sits below the average, which sits below u_rms, because the long tail of fast molecules pulls the averages up.',
      overlay(sim,ctx,LH,k){KM(ctx,k,[['N₂ at 300 K',700,14],'√(3RT/M) = '+f0(met(sim,'rmsT'))+' m/s','Most probable: '+f0(met(sim,'vmp'))+' m/s']);} }
  ],
  useIt: [
    { do: 'Check tire pressure on a cold morning before you add air.',
      why: 'Cold air molecules move slower and hit the tire walls less hard, so the gauge reads low. It rises again as the tires warm.' },
    { do: 'Notice helium balloons go flat faster than air-filled ones.', lvl: 'honors',
      why: 'Light, fast helium atoms escape through tiny gaps in the rubber about 2.6 times faster than air.' }
  ],
  tryIt: [
    { title: 'perfume across the room (5 minutes, with a partner)',
      steps: ['Stand at opposite ends of a room.', 'One person opens a perfume or vanilla bottle; the other starts a timer.', 'Stop when the smell arrives.'],
      look: 'It takes many seconds, even though molecules move hundreds of meters per second. They collide with air billions of times a second and wander, so diffusion is slow.' }
  ]
},
states: {
  goals: {
    bio: ['Solid, liquid and gas: what the particles are doing', 'Why the temperature stops rising while ice melts or water boils', 'Heating and cooling curves'],
    honors: ['q = mcΔT on the slopes, q = mΔH on the plateaus', 'Why boiling takes much more energy than melting', 'Reading a heating curve'],
    ap: ['Phase changes break attractions, not raise kinetic energy', 'Boiling point depends on pressure', 'Intermolecular forces and ΔH_vap']
  },
  matters: 'A pot of water on the stove sits at 100 °C until it boils dry. Ice keeps a drink at 0 °C until it melts. Sweat cools you because evaporating takes energy.',
  question: 'You heat ice steadily. Does the temperature rise at a steady rate all the way to steam?',
  startKey: 'ice', startRun: true,
  steps: [
    { key: 'ice', title: 'Warming the ice', set: { sub: 'water', start: 'solid', power: 50, mass: 50, P: 1 }, fresh: true, speed: 1,
      see: 'A 100 W heater warms 50 g of ice from −40 °C. The particles vibrate faster in place and the temperature climbs.',
      why: 'In a solid the particles are locked in place but jiggle. Adding heat makes them jiggle faster, which is a higher temperature.',
      overlay(sim,ctx,LH,k){STT(ctx,k,[[f1(met(sim,'T'))+' °C · '+txt(sim,'phase'),700,14],'Heat added: '+f1(met(sim,'q'))+' kJ']);} },
    { key: 'melt', title: 'Melting: the flat part', set: { sub: 'water', start: 'solid', power: 50, mass: 50, P: 1 }, speed: 1,
      see: 'At 0 °C the temperature stops rising even though the heater stays on. The ice melts bit by bit.',
      why: 'The heat now goes into breaking the ice’s hydrogen-bond framework, not into making particles move faster. The temperature waits until all the ice has melted.',
      overlay(sim,ctx,LH,k){STT(ctx,k,[[f1(met(sim,'T'))+' °C · '+txt(sim,'phase'),700,14],'Heat added: '+f1(met(sim,'q'))+' kJ']);} },
    { key: 'liq', title: 'Warming the water', set: { sub: 'water', start: 'liquid', power: 50, mass: 50, P: 1 }, fresh: true, speed: 1,
      see: 'Liquid water warms from 0 °C toward 100 °C. The slope is less steep than for ice.',
      why: 'Water’s specific heat (4.18 J/g·°C) is about twice ice’s, so the same heater warms it about half as fast.',
      overlay(sim,ctx,LH,k){STT(ctx,k,[[f1(met(sim,'T'))+' °C · '+txt(sim,'phase'),700,14],'Heat added: '+f1(met(sim,'q'))+' kJ']);} },
    { key: 'boil', title: 'Boiling: the long flat part', set: { sub: 'water', start: 'liquid', power: 50, mass: 50, P: 1 }, speed: 4,
      see: 'At 100 °C the temperature stops again. Boiling takes much longer than melting did.',
      why: { bio: 'Turning liquid into gas pulls the molecules completely apart, which takes a lot of energy.', honors: 'ΔH_vap = 2260 J/g vs. ΔH_fus = 334 J/g: boiling 50 g takes 113 kJ, almost 7 times the 16.7 kJ to melt it.' },
      overlay(sim,ctx,LH,k){STT(ctx,k,[[f1(met(sim,'T'))+' °C · '+txt(sim,'phase'),700,14],'Heat added: '+f1(met(sim,'q'))+' kJ']);} },
    { key: 'cool', title: 'A cooling curve', set: { sub: 'water', start: 'gas', power: -50, mass: 50, P: 1 }, fresh: true, speed: 2,
      see: 'Run it backward: cool steam. The temperature falls to 100 °C and stays there while the steam condenses.',
      why: 'Condensing gives back the same 2260 J/g that boiling took. That released heat is why a steam burn is worse than a hot-water burn.',
      overlay(sim,ctx,LH,k){STT(ctx,k,[[f1(met(sim,'T'))+' °C · '+txt(sim,'phase'),700,14],'Heat flow: '+f0(met(sim,'W'))+' W']);} },
    { key: 'press', lvl: 'ap', title: 'Boiling in Aurora', set: { sub: 'water', start: 'liquid', power: 100, mass: 50, P: 0.83 }, fresh: true, speed: 2,
      see: 'At 0.83 atm, about the air pressure in Aurora, water boils at about 95 °C.',
      why: 'Water boils when its vapor pressure equals the pressure pushing down on it. Less air pressure means it reaches that point at a lower temperature, so pasta cooks a little slower here.',
      overlay(sim,ctx,LH,k){STT(ctx,k,[[f1(met(sim,'T'))+' °C · '+txt(sim,'phase'),700,14],'Boiling point at '+f2(sim.p.P)+' atm: '+f1(met(sim,'tb'))+' °C']);} }
  ],
  useIt: [
    { do: 'Put ice in a cooler instead of just cold drinks.',
      why: 'Melting ice soaks up 334 J for every gram while staying at 0 °C. Cold drinks alone warm up much faster.' },
    { do: 'Be careful with steam from a kettle or a microwaved bag.', lvl: 'honors',
      why: 'Steam releases 2260 J/g as it condenses on your skin, on top of the heat from cooling. That’s far more than the same mass of 100 °C water.' }
  ],
  tryIt: [
    { title: 'watch the plateau (15 minutes)',
      steps: ['Put a kitchen thermometer in a glass of crushed ice and a little water.', 'Read it every minute as the ice melts on the counter.', 'Keep going until all the ice is gone.'],
      look: 'It stays near 0 °C the whole time ice remains, then starts climbing. That flat stretch is the melting plateau.' }
  ]
},
phasediagram: {
  goals: {
    bio: ['A phase diagram shows the state at every temperature and pressure', 'Crossing a line means a phase change', 'Why water boils at a lower temperature in Colorado'],
    honors: ['Triple point and critical point', 'Why ice melts under pressure (water’s odd melting line)', 'Sublimation: dry ice and freeze-drying'],
    ap: ['Supercritical fluids', 'Reading slopes: the Clapeyron relation', 'Comparing water and CO₂']
  },
  matters: 'Pressure cookers, freeze-dried astronaut food, dry ice and decaf coffee all depend on pushing a substance across a line on its phase diagram.',
  question: 'Water boils at 100 °C at sea level. Does it boil at the same temperature in Aurora?',
  startKey: 'read', startRun: true,
  steps: [
    { key: 'read', title: 'Reading the map', set: { sub: 'water', Tw: 25, lpw: 0 }, fresh: true, pause: true,
      see: 'The red dot is water at 25 °C and 1 atm. It sits in the liquid region. The lines are where two phases can exist together.',
      why: 'Temperature runs left to right and pressure bottom to top (on a log scale). Solid is cold and squeezed, gas is hot and spread out.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'heat', title: 'Heat it', set: { sub: 'water', Tw: 25, lpw: 0 }, fresh: true, speed: 1, run(sim){doAct(sim,'heat');},
      see: 'Heat at 1 atm. The dot moves right, stops on the boiling line at 100 °C, then crosses into gas.',
      why: 'Crossing a line is a phase change. At 1 atm, water’s boiling line sits at 100 °C.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'aurora', title: 'Heat it in Aurora', set: { sub: 'water', Tw: 25, lpw: -0.08 }, fresh: true, speed: 1, run(sim){doAct(sim,'heat');},
      see: 'Start at 0.83 atm, the air pressure here. The dot hits the boiling line at about 95 °C.',
      why: 'The boiling line slopes up: lower pressure, lower boiling point. Water in Aurora boils about 5 °C cooler than at sea level.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'cooker', lvl: 'honors', title: 'A pressure cooker', set: { scene: 'cooker' }, fresh: true, speed: 1, run(sim){doAct(sim,'go');},
      see: 'At 2.0 atm inside a pressure cooker, water doesn’t boil until about 121 °C.',
      why: 'Higher pressure pushes the boiling point up. Hotter water cooks food much faster, which is why pressure cookers are popular at altitude.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'skate', lvl: 'honors', title: 'Ice under a skate', set: { scene: 'skate' }, fresh: true, speed: 1, run(sim){doAct(sim,'go');},
      see: 'Squeeze ice at −5 °C. Unlike most substances, it moves toward liquid.',
      why: 'Water’s melting line tilts left, because liquid water is denser than ice. Squeezing favors the denser phase. (The thin water layer under real skates comes mostly from friction, though.)',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'dry', title: 'Dry ice', set: { scene: 'dryice' }, fresh: true, speed: 1, run(sim){doAct(sim,'go');},
      see: 'Switch to CO₂. Solid dry ice warming at 1 atm turns straight into gas at −78.5 °C, with no liquid.',
      why: 'CO₂’s triple point is at 5.1 atm. Below that pressure there is no liquid region, so the solid sublimes.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'freeze', lvl: 'honors', title: 'Freeze-drying', set: { scene: 'freeze' }, fresh: true, speed: 1, run(sim){doAct(sim,'go');},
      see: 'Frozen food at −20 °C in a vacuum chamber. The ice turns straight to vapor.',
      why: 'Below water’s triple-point pressure (0.006 atm) ice sublimes. The food dries without ever thawing, so it keeps its shape.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} },
    { key: 'scf', lvl: 'ap', title: 'Supercritical CO₂', set: { scene: 'scf' }, fresh: true, speed: 1, run(sim){doAct(sim,'go');},
      see: 'Heat CO₂ at 100 atm past 31 °C. It becomes a supercritical fluid, neither liquid nor gas.',
      why: 'Above the critical point there is no boiling line to cross. Supercritical CO₂ flows like a gas but dissolves like a liquid, which is how coffee is decaffeinated.',
      overlay(sim,ctx,LH,k){PDC(ctx,k,[[txt(sim,'ph'),700,14],f1(met(sim,'T'))+' °C, '+txt(sim,'P')+' atm']);} }
  ],
  useIt: [
    { do: 'Follow the high-altitude directions on a box of cake or pasta.',
      why: 'Water boils at about 95 °C here, so food cooks slower and liquids evaporate faster.' },
    { do: 'Handle dry ice with gloves and keep it in a vented cooler.', lvl: 'honors',
      why: 'It sits at −78.5 °C and sublimes into CO₂ gas, which can build up pressure in a sealed container.' }
  ],
  tryIt: [
    { title: 'boil water in a syringe (5 minutes, with an adult)',
      steps: ['Pull some warm (not boiling) tap water into a plastic syringe, about a third full.', 'Cap the tip with your finger and pull the plunger back hard.'],
      look: 'The water bubbles even though it is only warm. Lowering the pressure lowered its boiling point below its temperature.' }
  ]
},
gasstoich: {
  goals: {
    bio: ['Collecting a gas made in a reaction', 'One mole of any gas takes up the same volume at the same T and P', 'Using the gas volume to find moles'],
    honors: ['Dalton’s law: subtract water vapor pressure', 'PV = nRT, and correcting to STP', 'How lab mistakes change your answer'],
    ap: ['Finding R from your own data', 'Finding a molar mass from a gas (butane)', 'Propagating errors']
  },
  matters: 'Car airbags, baking soda in bread and the oxygen masks on airplanes all depend on knowing how much gas a reaction will make.',
  question: 'A tiny 0.030 g piece of magnesium dissolves in acid. How much hydrogen gas will it make?',
  startKey: 'react', startRun: true,
  steps: [
    { key: 'react', title: 'Mg + HCl → H₂', set: { mode: 'mg', mgMass: 0.03, Tw: 22, Pbar: 630, errM: 'none' }, fresh: true, speed: 1,
      see: 'A 0.030 g magnesium ribbon reacts with acid in an upside-down tube of water. Hydrogen bubbles push the water down: 37.2 mL.',
      why: 'Mg + 2HCl → MgCl₂ + H₂. One mole of Mg makes one mole of H₂, and the acid is in excess, so the ribbon decides how much gas forms.',
      overlay(sim,ctx,LH,k){GSM(ctx,k,[['Mg + HCl',700,14],'Gas: '+f1(met(sim,'vol'))+' mL']);} },
    { key: 'moles', title: 'Moles of hydrogen', set: { mode: 'mg', mgMass: 0.03, Tw: 22, Pbar: 630, errM: 'none' }, speed: 2,
      see: 'Moles of Mg = 0.030 g ÷ 24.31 g/mol = 1.23 × 10⁻³ mol, so the tube holds 1.23 × 10⁻³ mol of H₂.',
      why: { bio: 'Divide the volume by the moles: 37.2 mL ÷ 0.00123 mol ≈ 30 L per mole. That is the volume of one mole of gas here in Aurora.', honors: 'Molar volume at room conditions = V ÷ n ≈ 30.1 L/mol, bigger than 22.4 L at STP because it is warmer and the air pressure is lower.' },
      overlay(sim,ctx,LH,k){GSM(ctx,k,[['n = '+txt(sim,'nMg'),700,12.5],'V = '+f1(met(sim,'vol'))+' mL','1 mol here: '+f1(met(sim,'VmRoom'))+' L']);} },
    { key: 'vapor', lvl: 'honors', title: 'Subtract the water vapor', set: { mode: 'mg', mgMass: 0.03, Tw: 22, Pbar: 630, errM: 'none' }, speed: 2,
      see: 'The gas in the tube is hydrogen plus water vapor. At 22 °C the vapor pushes 19.8 mmHg, so the hydrogen alone is at 610.2 mmHg.',
      why: 'Dalton’s law: P_total = P_H₂ + P_H₂O. Use only the dry hydrogen’s pressure in PV = nRT.',
      overlay(sim,ctx,LH,k){GSM(ctx,k,[['Dry H₂',700,13.5],'630 − '+f1(met(sim,'Pw'))+' = '+f1(met(sim,'Pdry'))+' mmHg']);} },
    { key: 'stp', lvl: 'honors', title: 'Correct to STP', set: { mode: 'mg', mgMass: 0.03, Tw: 22, Pbar: 630, errM: 'none' }, speed: 2,
      see: 'Correcting the dry gas to 0 °C and 1 atm gives 22.4 L per mole, within 0.1% of the accepted value.',
      why: 'V_STP = V × (P/760) × (273.15/T). Every gas behaves nearly the same, so one mole fills about 22.4 L at STP whatever gas it is.',
      overlay(sim,ctx,LH,k){GSM(ctx,k,[['At STP',700,13.5],f2(met(sim,'VmSTP'))+' L/mol','Error: '+f1(met(sim,'err'))+'%']);} },
    { key: 'oops', lvl: 'honors', title: 'A lab mistake', set: { mode: 'mg', mgMass: 0.03, Tw: 22, Pbar: 630, errM: 'oxide' }, fresh: true, speed: 2,
      see: 'This ribbon had a dull oxide coating. Only 34.3 mL of gas forms, and the molar volume comes out 7.9% low.',
      why: 'MgO reacts with acid but makes no H₂. You weighed 0.030 g as if it were all Mg, so you expected more gas than you got. Sand the ribbon shiny first.',
      overlay(sim,ctx,LH,k){GSM(ctx,k,[['Oxide coating',700,13.5],'Gas: '+f1(met(sim,'vol'))+' mL',['Error: '+f1(met(sim,'err'))+'%',700,12.5,RED]]);} },
    { key: 'butane', title: 'Weigh a gas: butane', set: { mode: 'lighter', tRel: 4, Tw: 22, Pbar: 630, errL: 'none' }, fresh: true, speed: 1,
      see: 'Release butane from a lighter under water into a tube. The lighter loses 0.14 g and the tube collects 72.7 mL.',
      why: { bio: 'Moles of gas from its volume, mass from the balance: molar mass = grams ÷ moles = 58 g/mol, which matches C₄H₁₀.', honors: 'n = PV/RT with the dry pressure = 2.41 × 10⁻³ mol. M = 0.140 g ÷ 0.00241 mol = 58.1 g/mol.' },
      overlay(sim,ctx,LH,k){GSB(ctx,k,[['Butane lighter',700,14],'Mass lost: '+f2(met(sim,'dm'))+' g','Gas: '+f1(met(sim,'vol'))+' mL','Molar mass: '+f1(met(sim,'M'))+' g/mol']);} },
    { key: 'wet', lvl: 'honors', title: 'Forgot to dry the lighter', set: { mode: 'lighter', tRel: 4, Tw: 22, Pbar: 630, errL: 'wet' }, fresh: true, speed: 1,
      see: 'Water left on the lighter makes it seem to lose only 0.11 g. The molar mass comes out 21% low.',
      why: 'The trapped water adds mass back on the second weighing, so the mass lost looks too small. Always dry the lighter before reweighing.',
      overlay(sim,ctx,LH,k){GSB(ctx,k,[['Wet lighter',700,14],'Mass lost: '+f2(met(sim,'dm'))+' g',['Molar mass: '+f1(met(sim,'M'))+' g/mol',700,12.5,RED]]);} },
    { key: 'R', lvl: 'ap', title: 'Find R yourself', set: { mode: 'mg', mgMass: 0.03, Tw: 22, Pbar: 630, errM: 'none' }, fresh: true, speed: 2,
      see: 'With moles from the Mg, and P, V and T measured, you can solve PV = nRT for R.',
      why: 'R = PV/nT = (610.2/760 atm)(0.0372 L) ÷ (1.23 × 10⁻³ mol × 295.15 K) ≈ 0.0820 L·atm/(mol·K), within 0.1% of 0.08206.',
      overlay(sim,ctx,LH,k){GSM(ctx,k,[['R from your data',700,13.5],Number.isFinite(met(sim,'Rx'))?met(sim,'Rx').toFixed(4)+' L·atm/(mol·K)':'reacting…']);} }
  ],
  useIt: [
    { do: 'Expect bread and cake to rise more at altitude.',
      why: 'Lower air pressure lets the same moles of CO₂ from baking soda or yeast take up more volume. High-altitude recipes use less leavening.' },
    { do: 'Leave room in a sealed bag of chips on a drive up to the mountains.', lvl: 'honors',
      why: 'Same moles of gas, lower outside pressure: the bag puffs up and can pop.' }
  ],
  tryIt: [
    { title: 'a balloon of CO₂ (10 minutes)',
      steps: ['Put 1 tablespoon (about 14 g) of baking soda in a deflated balloon.', 'Pour vinegar into a bottle and stretch the balloon over the top.', 'Tip the soda in and watch the balloon fill.'],
      look: 'Each mole of baking soda can make one mole of CO₂. 14 g is about 0.17 mol, which would fill about 5 L at Aurora’s pressure if the vinegar has enough acid.' }
  ]
}
});
/* ---- Feb–Mar units: solutions (added Nov 14, 2026) ---- */
const DSC=(ctx,k,L)=>card(ctx,k,L,694,36,100);
const MB=(ctx,k,L)=>card(ctx,k,L,582,8,210);
const MF=(ctx,k,L)=>card(ctx,k,L,14,180,240);
const MD=(ctx,k,L)=>card(ctx,k,L,206,70,124);
const SC=(ctx,k,L)=>card(ctx,k,L,92,118,240);
const SG=(ctx,k,L)=>card(ctx,k,L,300,62,170);
const CLG=(ctx,k,L)=>card(ctx,k,L,232,4,300);

BioLab.addLearn({
dissolve: {
  goals: {
    bio: ['Water pulls salt apart into ions but leaves oil alone', 'Saturated means no more will dissolve', 'Stirring, heat and small pieces speed dissolving up'],
    honors: ['Like dissolves like: polar and nonpolar', 'Strong, weak and nonelectrolytes', 'Rate of dissolving vs. how much can dissolve'],
    ap: ['Percent ionization and conductivity', 'Ion–dipole and hydrogen-bond attractions', 'Why HCl ionizes fully and acetic acid barely']
  },
  matters: 'Salt on icy roads, sports drinks with electrolytes, and why oil-based stains need soap all come down to what water can and can’t pull apart.',
  question: 'Salt and sugar both disappear in water. Do they dissolve the same way?',
  startKey: 'salt', startRun: true,
  steps: [
    { key: 'salt', title: 'Salt in water', set: { solute: 'NaCl', mass: 20, T: 25, stir: false }, fresh: true, speed: 1,
      see: 'Water molecules surround the Na⁺ and Cl⁻ ions at the crystal’s surface and carry them off one by one. The bulb lights up.',
      why: 'Water is polar: its O end is slightly negative and its H ends slightly positive. Each end grabs the opposite ion. Loose ions carry current, so salt water conducts.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[['NaCl',700,13],f1(met(sim,'dis'))+' g in','Bulb: '+txt(sim,'bulb')]);} },
    { key: 'stir', title: 'Stir it', set: { solute: 'NaCl', mass: 20, T: 25, stir: true }, fresh: true, speed: 1,
      see: 'With the stirrer on, the same 20 g dissolves about 4 times faster.',
      why: 'Stirring carries the salty water away from the crystal and brings fresh water in. It changes how fast salt dissolves, not how much can.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[['Stirred',700,13],f1(met(sim,'dis'))+' g in']);} },
    { key: 'sat', title: 'Too much salt', set: { solute: 'NaCl', mass: 50, T: 25, stir: true }, fresh: true, speed: 1,
      see: 'Add 50 g. Only about 36 g dissolves; about 14 g stays on the bottom. The solution is saturated.',
      why: 'At 25 °C, 100 g of water can hold at most 36 g of salt. Past that, ions leave the crystal and rejoin it at the same rate.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[[txt(sim,'state'),700,12],f1(met(sim,'dis'))+' g in',f1(met(sim,'left'))+' g left']);} },
    { key: 'sugar', title: 'Sugar', set: { solute: 'sugar', mass: 20, T: 25, stir: true }, fresh: true, speed: 1,
      see: 'Sugar dissolves too, but the bulb stays off.',
      why: 'Water pulls whole sugar molecules away by hydrogen bonding, but they don’t break into ions. No ions, no current: sugar is a nonelectrolyte.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[['Sugar',700,13],f1(met(sim,'dis'))+' g in','Bulb: '+txt(sim,'bulb')]);} },
    { key: 'oil', title: 'Oil', set: { solute: 'oil', mass: 20, T: 25, stir: true }, fresh: true, speed: 1,
      see: 'Oil floats in a separate layer, even with stirring.',
      why: 'Oil molecules are nonpolar. Water molecules stick to each other more strongly than to oil, so they squeeze the oil out. Like dissolves like.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[['Oil',700,13],'Two layers']);} },
    { key: 'weak', lvl: 'honors', title: 'Strong and weak', set: { solute: 'acetic', mass: 20, T: 25, stir: true }, fresh: true, speed: 1,
      see: 'Vinegar’s acetic acid mixes in completely, but the bulb is only dim. HCl (try it) lights it brightly.',
      why: 'HCl breaks into ions 100% of the time: a strong electrolyte. Only a fraction of a percent of acetic acid molecules ionize: a weak electrolyte.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[['Acetic acid',700,12],'Bulb: '+txt(sim,'bulb'),f2(met(sim,'ion'))+'% ions']);} },
    { key: 'hot', lvl: 'honors', title: 'Hot water and sugar', set: { solute: 'sugar', mass: 60, T: 80, stir: true }, fresh: true, speed: 1,
      see: 'At 80 °C water can hold about 360 g of sugar per 100 g, almost twice as much as at 25 °C.',
      why: 'For most solids, solubility rises with temperature. That is how candy makers and rock-candy kits make supersaturated syrups.',
      overlay(sim,ctx,LH,k){DSC(ctx,k,[['Sugar, 80 °C',700,12],'Max: '+f0(met(sim,'lim'))+' g']);} }
  ],
  useIt: [
    { do: 'Use dish soap, not just water, on greasy pans.',
      why: 'Soap molecules have a nonpolar tail that grabs grease and a polar head that grabs water, so the grease rinses away.' },
    { do: 'Stir or crush to dissolve something faster.', lvl: 'honors',
      why: 'More surface and fresh water at the surface speed dissolving. They don’t raise the most that can dissolve; only temperature (for solids) does that.' }
  ],
  tryIt: [
    { title: 'salt, sugar, oil (5 minutes)',
      steps: ['Fill three clear glasses with warm water.', 'Add a spoon of salt to one, sugar to another, and cooking oil to the third.', 'Stir each for 30 seconds.'],
      look: 'Salt and sugar disappear; oil floats in a layer. Taste is not a lab test, but salt water and sugar water would taste different because different particles are spread through them.' }
  ]
},
molarity: {
  goals: {
    bio: ['Molarity = moles of solute ÷ liters of solution', 'More solute or less water makes a solution more concentrated', 'Using a volumetric flask to make an exact solution'],
    honors: ['Converting grams to moles to molarity', 'Dilution: M₁V₁ = M₂V₂', 'Why you fill to the mark after dissolving'],
    ap: ['Molality, mass percent, ppm and mole fraction', 'Hydrates: include the water in the molar mass', 'Saturation limits']
  },
  matters: 'Medicine doses, IV bags, pool chemicals and the concentration of a sports drink all use concentration. A nurse diluting a drug uses the same M₁V₁ = M₂V₂ you’ll use here.',
  question: 'You dissolve the same amount of copper sulfate in twice as much water. Is the solution half as concentrated?',
  startKey: 'mix', startRun: false,
  steps: [
    { key: 'mix', title: 'Moles per liter', set: { mode: 'beaker', solute: 'CuSO4', n: 0.5, V: 0.5 }, fresh: true, pause: true,
      see: '0.500 mol of copper sulfate in 0.500 L of solution: 1.00 M. The blue color shows how concentrated it is.',
      why: 'Molarity counts particles (moles) per liter of the final solution. 0.5 mol ÷ 0.5 L = 1.0 mol/L.',
      overlay(sim,ctx,LH,k){MB(ctx,k,[['n = '+f2(sim.p.n)+' mol, V = '+f2(sim.p.V)+' L',700,14],'M = '+f2(met(sim,'M'))+' M']);} },
    { key: 'water', title: 'Add water', set: { mode: 'beaker', solute: 'CuSO4', n: 0.5, V: 1 }, fresh: true,
      cause: { from: { V: 0.5 }, delay: 0.6, dur: 2.5, label: 'Solution volume' },
      see: 'Fill to 1.0 L with the same 0.5 mol. The concentration halves to 0.50 M and the blue gets paler.',
      why: 'Same number of copper ions spread through twice the volume. The moles didn’t change; only the volume did.',
      overlay(sim,ctx,LH,k){MB(ctx,k,[['n = '+f2(sim.p.n)+' mol, V = '+f2(sim.p.V)+' L',700,14],'M = '+f2(met(sim,'M'))+' M']);} },
    { key: 'more', title: 'Add solute', set: { mode: 'beaker', solute: 'CuSO4', n: 1, V: 1 }, fresh: true,
      cause: { from: { n: 0.5 }, delay: 0.6, dur: 2.5, label: 'Solute amount' },
      see: 'Keep the 1.0 L and add a second 0.5 mol. The concentration doubles to 1.00 M and the blue deepens.',
      why: 'Twice the moles in the same volume, twice the concentration. Grams of solute = moles × molar mass (249.7 g/mol for the blue hydrate). There is a limit, though: past about 1.4 M, extra copper sulfate won’t dissolve.',
      overlay(sim,ctx,LH,k){MB(ctx,k,[['n = '+f2(sim.p.n)+' mol, V = '+f2(sim.p.V)+' L',700,14],'M = '+f2(met(sim,'M'))+' M','Mass: '+f1(met(sim,'g'))+' g']);} },
    { key: 'flask', title: 'Make it exactly', set: { mode: 'flask', solute: 'CuSO4', fl: '250', mg: 6.24 }, fresh: true, speed: 1,
      see: 'The real way: weigh 6.24 g, transfer it to a 250.00 mL flask, dissolve in some water, fill to the mark, then mix.',
      why: '6.24 g ÷ 249.68 g/mol = 0.0250 mol. Filling to the mark after dissolving makes the solution exactly 0.250 L, so M = 0.0250 ÷ 0.250 = 0.100 M.',
      overlay(sim,ctx,LH,k,tau){[2,4,6,8].forEach((t,i)=>{if(tau>=t&&sim['_fl'+i]!==sim.lnT0){sim['_fl'+i]=sim.lnT0;doAct(sim,'next');}});MF(ctx,k,[[txt(sim,'stepT'),700,12.5],'Moles: '+f2(met(sim,'mol')*1000)+' mmol','M = '+(Number.isFinite(met(sim,'M'))?met(sim,'M').toFixed(3)+' M':'not yet')]);} },
    { key: 'dilute', lvl: 'honors', title: 'Dilute a stock', set: { mode: 'dilute', M1: 1, V1: '10', V2: '100' }, fresh: true, speed: 1, run(sim){doAct(sim,'skip');},
      see: 'Pipet 10.00 mL of 1.00 M stock into a 100.00 mL flask and fill to the mark: 0.100 M.',
      why: 'The moles you pipetted don’t change when you add water: M₁V₁ = M₂V₂. 1.00 × 10.00 = M₂ × 100.00, so M₂ = 0.100 M, a tenfold dilution.',
      overlay(sim,ctx,LH,k){MD(ctx,k,[['M₁V₁ = M₂V₂',700,13],'Factor: '+f0(met(sim,'fac'))+'×','M₂ = '+f2(met(sim,'M2'))+' M']);} },
    { key: 'other', lvl: 'ap', title: 'Other units', set: { mode: 'beaker', solute: 'CuSO4', n: 0.5, V: 0.5 }, fresh: true, pause: true,
      see: 'The same 1.00 M solution in other units: molality, mass percent and mole fraction.',
      why: 'Molality uses kilograms of water, not liters of solution, so it doesn’t change with temperature. That is why colligative properties use it.',
      overlay(sim,ctx,LH,k){MB(ctx,k,[['1.00 M CuSO₄',700,14],'Molality: '+f2(met(sim,'molal'))+' m','Mass percent: '+f1(met(sim,'wp'))+'%']);} }
  ],
  useIt: [
    { do: 'Follow mixing directions for drink powders and cleaners exactly.',
      why: 'The directions set the concentration. Too much water makes a weak solution; too little can make it too strong or unsafe.' },
    { do: 'Use M₁V₁ = M₂V₂ any time you dilute something.', lvl: 'honors',
      why: 'Diluting bleach, juice concentrate or a stock solution in lab is the same math.' }
  ],
  tryIt: [
    { title: 'food-coloring dilutions (10 minutes)',
      steps: ['Put 10 drops of food coloring in a cup with 100 mL of water.', 'Pour 10 mL of it into a second cup and add 90 mL of water.', 'Repeat once more into a third cup.'],
      look: 'Each cup is ten times paler: a 1 : 10 dilution each time. The third cup is 1/100 as concentrated as the first.' }
  ]
},
solcurve: {
  goals: {
    bio: ['Reading a solubility curve', 'Saturated, unsaturated and supersaturated', 'Most solids dissolve better hot; gases dissolve better cold'],
    honors: ['Crystals that form on cooling', 'Supersaturated solutions and seed crystals', 'Why warm water holds less oxygen'],
    ap: ['Recrystallization and percent recovery', 'Henry’s law for gases', 'Compounds whose solubility drops with heat']
  },
  matters: 'Rock candy, purifying a drug by recrystallization, and fish kills in warm summer lakes all follow from how solubility changes with temperature.',
  question: 'You dissolve 80 g of potassium nitrate in hot water, then let it cool. What happens to the dissolved salt?',
  startKey: 'read', startRun: true,
  steps: [
    { key: 'read', title: 'Reading the curve', set: { view: 'solid', solute: 'KNO3', mass: 80, T: 40 }, fresh: true, speed: 1,
      see: '80 g of KNO₃ in 100 g of water at 40 °C. The curve says only 63.9 g can dissolve, so 16.1 g stays as crystals.',
      why: 'The curve is the saturation limit at each temperature. Above the line you can’t dissolve more; the extra stays solid.',
      overlay(sim,ctx,LH,k){SC(ctx,k,[[txt(sim,'state'),700,14],'Dissolved: '+f1(met(sim,'md'))+' g','Crystals: '+f1(met(sim,'mc'))+' g']);} },
    { key: 'warm', title: 'Warm it', set: { view: 'solid', solute: 'KNO3', mass: 80, T: 60 }, fresh: true, speed: 1,
      cause: { from: { T: 40 }, delay: 0.6, dur: 2.5, label: 'Temperature' },
      see: 'At 60 °C the limit jumps to 110 g. All 80 g dissolves, with room for 30 g more.',
      why: 'For KNO₃ the curve rises steeply. Hot water can hold far more.',
      overlay(sim,ctx,LH,k){SC(ctx,k,[[txt(sim,'state'),700,14],'Limit: '+f1(met(sim,'S'))+' g','Dissolved: '+f1(met(sim,'md'))+' g']);} },
    { key: 'cool', title: 'Cool it', set: { view: 'solid', solute: 'KNO3', mass: 80, T: 20 }, fresh: true, speed: 1,
      cause: { from: { T: 60 }, delay: 0.6, dur: 3, label: 'Temperature' },
      see: 'Cool to 20 °C. Crystals rain out: only 31.6 g can stay dissolved, so 48.4 g comes back out as solid.',
      why: 'As the limit drops below 80 g, the extra has nowhere to go. That is crystallization, the way chemists purify solids.',
      overlay(sim,ctx,LH,k){SC(ctx,k,[[txt(sim,'state'),700,14],'Dissolved: '+f1(met(sim,'md'))+' g','Crystals: '+f1(met(sim,'mc'))+' g']);} },
    { key: 'nacl', title: 'Salt barely changes', set: { view: 'solid', solute: 'NaCl', mass: 40, T: 100 }, fresh: true, speed: 1,
      cause: { from: { T: 20 }, delay: 0.6, dur: 3, label: 'Temperature' },
      see: 'Table salt’s curve is almost flat: about 36 g at room temperature and only 40 g at 100 °C.',
      why: 'Every compound has its own curve. Heating salt water won’t dissolve much more salt.',
      overlay(sim,ctx,LH,k){SC(ctx,k,[['NaCl',700,14],'Limit: '+f1(met(sim,'S'))+' g at '+f0(sim.p.T)+' °C']);} },
    { key: 'super', lvl: 'honors', title: 'Supersaturated', set: { view: 'solid', solute: 'KNO3', mass: 80, T: 40 }, fresh: true, speed: 1,
      run(sim){doAct(sim,'super');},
      see: 'Dissolve all 80 g hot, then cool it gently without disturbing it. At 40 °C it still holds 80 g, more than the 63.9 g limit. A seed crystal drops in after 4 s.',
      why: 'A supersaturated solution is unstable: the extra solute needs a surface to start crystals. The seed gives it one, and 16 g crashes out at once. Hand warmers work the same way.',
      overlay(sim,ctx,LH,k,tau){actAt(sim,tau,'seed',4);SC(ctx,k,[[txt(sim,'state'),700,14],'Dissolved: '+f1(met(sim,'md'))+' g','Limit: '+f1(met(sim,'S'))+' g']);} },
    { key: 'gas', title: 'Oxygen in a lake', set: { view: 'gas', T: 30, P: 'sea' }, fresh: true, speed: 1,
      cause: { from: { T: 10 }, delay: 1, dur: 3, label: 'Temperature' },
      see: 'Cold 10 °C water holds about 11 mg of O₂ per liter. Warm the lake to 30 °C and it drops to about 7.6 mg/L as oxygen escapes.',
      why: 'Gases dissolve better in cold water, the opposite of most solids. Warm summer water, and water warmed by power plants, can leave fish short of oxygen.',
      overlay(sim,ctx,LH,k){SG(ctx,k,[['Lake at '+f0(sim.p.T)+' °C',700,13.5],'O₂: '+f1(met(sim,'o2'))+' mg/L',txt(sim,'fish')]);} },
    { key: 'denver', lvl: 'honors', title: 'A mountain lake', set: { view: 'gas', T: 40, P: 'denver' }, fresh: true, speed: 1,
      see: 'At Denver’s air pressure the same 40 °C water holds only 5.3 mg/L instead of 6.4 at sea level.',
      why: 'Henry’s law: dissolved gas is proportional to the gas’s pressure above the water. Less air pressure, less oxygen dissolved.',
      overlay(sim,ctx,LH,k){SG(ctx,k,[['Denver, 40 °C',700,13.5],'O₂: '+f1(met(sim,'o2'))+' mg/L',txt(sim,'fish')]);} }
  ],
  useIt: [
    { do: 'Store soda cold if you want it to stay fizzy.',
      why: 'CO₂, like oxygen, dissolves better in cold liquid. Warm soda loses its gas faster.' },
    { do: 'Make rock candy by cooling a hot, very sweet syrup slowly around a string.', lvl: 'honors',
      why: 'As the syrup cools the sugar limit drops, and the string gives crystals a place to grow.' }
  ],
  tryIt: [
    { title: 'how much salt vs. sugar (15 minutes)',
      steps: ['Measure 100 mL of room-temperature water into each of two cups.', 'Stir in salt one teaspoon at a time into one, and sugar into the other, until no more dissolves.', 'Count the teaspoons.'],
      look: 'Sugar dissolves several times more than salt by mass. Repeat with hot water: sugar gains a lot, salt barely changes, just like the curves.' }
  ]
},
colligative: {
  goals: {
    bio: ['Dissolving something lowers the freezing point and raises the boiling point', 'Why salt melts ice on roads', 'More particles, bigger effect'],
    honors: ['ΔTf = i·Kf·m and ΔTb = i·Kb·m', 'The van ’t Hoff factor i', 'Vapor pressure lowering'],
    ap: ['Measured vs. ideal van ’t Hoff factors', 'Finding a molar mass from ΔTf', 'Why it depends on number of particles, not their identity']
  },
  matters: 'Road salt, antifreeze in car radiators, and ice cream makers all use the same trick: dissolved particles keep water from freezing.',
  question: 'Salt and sugar at the same concentration: which one lowers water’s freezing point more?',
  startKey: 'salt', startRun: true,
  steps: [
    { key: 'salt', title: 'Salt water freezes colder', set: { view: 'freeze', solute: 'nacl', m: 1, realI: false }, fresh: true, speed: 4,
      see: 'Pure water and 1 m salt water cool in an ice–salt bath. The salt water doesn’t start freezing until −3.72 °C.',
      why: 'To freeze, water molecules must line up in a crystal. Dissolved ions get in the way, so it has to be colder before ice can form.',
      overlay(sim,ctx,LH,k){CLG(ctx,k,[['NaCl, 1 m: freezes at '+f2(met(sim,'fp'))+' °C',700,13.5],'Thermometer: '+f1(met(sim,'T'))+' °C']);} },
    { key: 'sugar', title: 'Sugar: half the effect', set: { view: 'freeze', solute: 'sugar', m: 1, realI: false }, fresh: true, speed: 4,
      see: 'At the same 1 m concentration, sugar water freezes at −1.86 °C, half as far below zero.',
      why: { bio: 'Each NaCl splits into two ions, Na⁺ and Cl⁻. Each sugar stays one molecule. The effect depends on how many particles are dissolved, not what they are.', honors: 'i = 2 for NaCl, i = 1 for sugar. ΔTf = i·Kf·m = 1 × 1.86 × 1 = 1.86 °C.' },
      overlay(sim,ctx,LH,k){CLG(ctx,k,[['Sugar, 1 m: freezes at '+f2(met(sim,'fp'))+' °C',700,13.5],'Particles per unit: 1']);} },
    { key: 'cacl2', title: 'Calcium chloride', set: { view: 'freeze', solute: 'cacl2', m: 1, realI: false }, fresh: true, speed: 4,
      see: 'CaCl₂ ice melt: −5.58 °C, three times the sugar effect.',
      why: 'CaCl₂ breaks into three ions: Ca²⁺ and two Cl⁻. That is why it works in colder weather than rock salt.',
      overlay(sim,ctx,LH,k){CLG(ctx,k,[['CaCl₂, 1 m: freezes at '+f2(met(sim,'fp'))+' °C',700,13.5],'i = 3']);} },
    { key: 'boil', title: 'Boiling point goes up', set: { view: 'boil', solute: 'nacl', m: 1, realI: false }, fresh: true, speed: 4,
      see: '1 m salt water boils at about 101.0 °C, about 1 °C above pure water.',
      why: { bio: 'Dissolved particles also make it harder for water molecules to escape as vapor, so you have to heat it a bit more. The effect is small: salting pasta water doesn’t make it noticeably hotter.', honors: 'ΔTb = i·Kb·m = 2 × 0.512 × 1 = 1.02 °C.' },
      overlay(sim,ctx,LH,k){CLG(ctx,k,[['NaCl, 1 m: boils at '+f2(met(sim,'bp'))+' °C',700,13.5],'Thermometer: '+f1(met(sim,'T'))+' °C']);} },
    { key: 'conc', lvl: 'honors', title: 'Double the concentration', set: { view: 'freeze', solute: 'nacl', m: 2, realI: false }, fresh: true, speed: 4,
      see: '2 m salt water freezes at −7.44 °C: twice as far below zero.',
      why: 'ΔTf is proportional to molality. Double m, double ΔTf.',
      overlay(sim,ctx,LH,k){CLG(ctx,k,[['NaCl, 2 m: freezes at '+f2(met(sim,'fp'))+' °C',700,13.5],'ΔTf = '+f2(met(sim,'dTf'))+' °C']);} },
    { key: 'real', lvl: 'ap', title: 'Real ions stick together', set: { view: 'freeze', solute: 'nacl', m: 1, realI: true }, fresh: true, speed: 4,
      see: 'With measured van ’t Hoff factors, 1 m NaCl freezes at −3.53 °C, not −3.72 °C.',
      why: 'Some Na⁺ and Cl⁻ ions pair up in solution and act as one particle, so the real i is about 1.9 instead of 2. The more concentrated the solution, the more ion pairing.',
      overlay(sim,ctx,LH,k){CLG(ctx,k,[['Measured i: '+f2(met(sim,'ieff')),700,13.5],'Freezes at '+f2(met(sim,'fp'))+' °C']);} }
  ],
  useIt: [
    { do: 'Use rock salt only down to about −10 °C; switch to calcium chloride when it’s colder.',
      why: 'Salt can’t melt ice below the coldest freezing point its brine can reach. CaCl₂ makes three ions and works at much lower temperatures.' },
    { do: 'Use a 50/50 antifreeze mix in a car, not pure antifreeze.', lvl: 'honors',
      why: 'The water–glycol mixture both freezes lower and boils higher than plain water, protecting the engine in winter and summer.' }
  ],
  tryIt: [
    { title: 'ice cream in a bag (15 minutes)',
      steps: ['Put ½ cup milk, 1 tablespoon sugar and a little vanilla in a small zip bag.', 'Put it inside a big bag with ice and ⅓ cup of salt.', 'Shake for 5–10 minutes, wearing gloves.'],
      look: 'The salt makes the ice water colder than 0 °C, cold enough to freeze the milk. A thermometer in the ice bath reads well below zero.' }
  ]
}
});
})();
