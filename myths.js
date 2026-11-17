/* Myth or fact (idea from Dr. Sandy Robertson's ENSO Explorer, Nov 17, 2026).
   BioLab.addMyths({toolId:[{k,s,fact,why,lvl}]}): students pick Myth or Fact, one graded try, then read why.
   Mix in real facts so students can't just answer "myth" every time. Keep each statement one sentence. */
BioLab.addMyths({
mole:[
 {k:'count',s:'A mole is a number, like a dozen, only much bigger.',fact:true,why:'A mole is 6.022 × 10²³ of anything, just as a dozen is 12 of anything. Chemists use it because atoms are too small to count one by one.'},
 {k:'mass',s:'One mole of every element has the same mass.',fact:false,why:'One mole always has the same <i>number</i> of atoms, not the same mass. A mole of carbon is 12.01 g; a mole of gold is 196.97 g, because each gold atom is heavier.'},
 {k:'gram',s:'The molar mass in grams is the same number as the atomic mass on the periodic table.',fact:true,why:'Carbon’s average atom is 12.01 u, so a mole of carbon is 12.01 g. That match is why the periodic table is your conversion chart.'},
 {k:'bigger',s:'20 g of gold holds more atoms than 20 g of carbon because gold is heavier.',fact:false,why:'Heavier atoms mean fewer of them fit in the same mass. 20 g of carbon is about 1.7 mol; 20 g of gold is about 0.10 mol, so carbon has about 16 times as many atoms.'}
],
molesteps:[
 {k:'setup',s:'If the units cancel to the unit you want, your setup is probably right.',fact:true,why:'Units are a built-in check. If grams cancel and moles are left when you wanted moles, the factor is right side up. If you get g²/mol, flip it.'},
 {k:'ee',s:'Typing 6.022 × 10^23 with the × and ^ keys is the same as using the EE key.',fact:false,why:'It is the same number, but dividing by it without parentheses divides by 6.022 and then multiplies by 10²³. The EE (or E) key keeps it one number. Or put the whole thing in parentheses.'},
 {k:'small',s:'Dividing always makes the answer smaller, so you divide whenever the answer should be small.',fact:false,why:'Choose multiply or divide from the units, not from a feeling about size. Grams ÷ (g/mol) gives moles; moles × (g/mol) gives grams.'},
 {k:'sf',s:'Your answer should have about as many significant figures as your least precise measurement.',fact:true,why:'For × and ÷, keep the fewest significant figures in your data. Avogadro’s number and molar masses usually have more, so your measured mass decides.'}
],
percentcomp:[
 {k:'heavy',s:'In water, hydrogen makes up two thirds of the mass because there are two H for every O.',fact:false,why:'Two thirds of the <i>atoms</i> are hydrogen, but each H is light (1.008) and O is 16.00. Hydrogen is only about 11% of water’s mass.'},
 {k:'same',s:'Pure table salt has the same percent sodium no matter how big the sample is.',fact:true,why:'Percent composition is a property of the compound. A pinch or a truckload of NaCl is 39.3% sodium by mass.'},
 {k:'emp',s:'The empirical formula is always the same as the molecular formula.',fact:false,why:'The empirical formula is the simplest ratio. Glucose is C₆H₁₂O₆, but its empirical formula is CH₂O. You need the molar mass to find the real one.'},
 {k:'100',s:'You can treat percent data as if you had a 100 g sample.',fact:true,why:'That trick turns 40.0% carbon into 40.0 g of carbon, ready to change into moles. Any sample size gives the same ratio.'}
],
hydrate:[
 {k:'dry',s:'A hydrate looks wet because it has water in it.',fact:false,why:'The water is locked into the crystal in a fixed ratio. Blue CuSO₄·5H₂O is a dry solid; heating drives the water off and it turns white.'},
 {k:'const',s:'You heat to constant mass so you know all the water is gone.',fact:true,why:'If two weighings in a row match, no more water is leaving. If the mass is still dropping, keep heating.'},
 {k:'spill',s:'If some solid spatters out of the crucible, your value of x comes out too high.',fact:true,why:'Lost solid looks like lost water, so the water seems bigger than it is and x comes out too high.'},
 {k:'under',s:'Heating too little makes x come out too high.',fact:false,why:'Water left behind is counted as anhydrous salt, so the water seems smaller and x comes out too low.'}
],
ionic:[
 {k:'cross',s:'Crisscross works because the charges swap places.',fact:false,why:'The formula comes from electrons lost = electrons gained. Al loses 3 and O gains 2, so 6 electrons move: 2 Al and 3 O. Crisscross is just a shortcut that lands on the same numbers.'},
 {k:'neutral',s:'Every ionic compound has a total charge of zero.',fact:true,why:'The positive charges from the metal ions exactly cancel the negative charges from the nonmetal ions. That is how you check a formula.'},
 {k:'molecule',s:'A grain of salt is made of separate NaCl molecules.',fact:false,why:'Salt is a crystal lattice of Na⁺ and Cl⁻ ions, each surrounded by ions of the other charge. NaCl is the ratio, called a formula unit, not a molecule.'},
 {k:'lowest',s:'Ionic formulas are written in the lowest whole-number ratio.',fact:true,why:'Mg²⁺ and O²⁻ make MgO, not Mg₂O₂. The formula gives the ratio of ions in the crystal.'}
],
titration:[
 {k:'equal',s:'At the equivalence point, moles of acid always equal moles of base.',fact:false,why:'They match the ratio in the balanced equation. H₂SO₄ + 2 NaOH needs twice as many moles of base as acid.'},
 {k:'seven',s:'The pH at equivalence is always 7.',fact:false,why:'Only for a strong acid with a strong base. A weak acid with NaOH ends above 7; a weak base with HCl ends below 7.'},
 {k:'indic',s:'An indicator should change color close to the pH at the equivalence point.',fact:true,why:'That is why phenolphthalein (about pH 8 to 10) suits a weak acid with NaOH, and methyl orange suits a weak base with a strong acid.'},
 {k:'rinse',s:'Rinsing the buret with water just before filling it makes your answer more accurate.',fact:false,why:'Leftover water dilutes the titrant, so you need more of it and your concentration comes out wrong. Rinse with the titrant itself.'}
],
rates:[
 {k:'temp',s:'Heating a reaction mostly speeds it up because particles collide more often.',fact:false,why:'More collisions help a little, but the big effect is that a larger share of collisions now have enough energy to get over the activation energy.'},
 {k:'cat',s:'A catalyst is not used up by the reaction.',fact:true,why:'It offers a path with a lower activation energy and comes out unchanged, so a small amount keeps working.'},
 {k:'yield',s:'A catalyst makes more product.',fact:false,why:'It makes the reaction reach the same amount of product faster. It speeds up the forward and reverse reactions equally, so the equilibrium amount does not change.'},
 {k:'area',s:'Powdered sugar can burn faster than a sugar cube because more surface is exposed.',fact:true,why:'Only particles on the surface can collide with oxygen. Grinding a solid exposes far more surface, which is why grain dust can explode.'}
],
ratelaw:[
 {k:'coef',s:'You can read the rate law’s exponents straight off the balanced equation.',fact:false,why:'Orders come from experiments (initial rates) unless the reaction is a single elementary step. The slowest step in the mechanism sets the rate law.'},
 {k:'half',s:'For a first-order reaction, the half-life does not depend on how much you start with.',fact:true,why:'t½ = 0.693/k, with no concentration in it. That is why radioactive decay has a fixed half-life.'},
 {k:'k',s:'The rate constant k changes when you change the concentration.',fact:false,why:'k stays the same at a set temperature. Changing concentration changes the rate, not k. Changing temperature or adding a catalyst changes k.'},
 {k:'zero',s:'For a zero-order reactant, doubling its concentration does not change the rate.',fact:true,why:'Rate = k[A]⁰ = k. Something else, like the surface of a catalyst, is the limit.'}
],
stoich:[
 {k:'grams',s:'In a balanced equation, the coefficients tell you the ratio of grams.',fact:false,why:'Coefficients give the ratio of particles, and so of moles. Change grams to moles first, use the mole ratio, then change back.'},
 {k:'limit',s:'The limiting reactant is the one you start with less mass of.',fact:false,why:'It is the one that runs out first, counted in moles and adjusted by the mole ratio. You can have fewer grams of the reactant that is in excess.'},
 {k:'yield',s:'Real labs almost always make less product than the theoretical yield.',fact:true,why:'Side reactions, product left on glassware and incomplete reactions all cut the actual yield. Percent yield = actual ÷ theoretical × 100.'},
 {k:'mass',s:'The total mass of the reactants equals the total mass of the products.',fact:true,why:'Atoms are rearranged, not created or destroyed. If a gas escapes, it only seems to break this rule.'}
]
});
