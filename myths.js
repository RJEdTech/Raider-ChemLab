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

/* Batch 2 (Nov 17, 2026): the rest of ChemLab, in course order. */
BioLab.addMyths({
measure:[
 {k:'zeros',s:'Writing 15.0 mL instead of 15 mL just adds a useless zero.',fact:false,why:'The zero says you measured to the tenth of a milliliter. 15.0 is more precise than 15.'},
 {k:'est',s:'When you read a scale, you record every marked digit plus one estimated digit.',fact:true,why:'That last estimated digit is still significant. It is your best judgment between the marks.'},
 {k:'acc',s:'Precise measurements are always accurate.',fact:false,why:'Precise means your results agree with each other. Accurate means they are close to the true value. A miscalibrated balance can be very precise and still wrong.'}
],
units:[
 {k:'factor',s:'A conversion factor like 1000 mL / 1 L is equal to one.',fact:true,why:'The top and bottom are the same amount written in different units, so multiplying by it changes the units, not the quantity.'},
 {k:'kilo',s:'The prefix kilo- means one thousandth.',fact:false,why:'Kilo- means 1000 times (1 km = 1000 m). Milli- means one thousandth.'},
 {k:'cm3',s:'One cubic centimeter is the same volume as one milliliter.',fact:true,why:'1 cm³ = 1 mL exactly, which is why a 1 cm cube of water holds 1 mL and has a mass of about 1 g.'}
],
labbench:[
 {k:'beaker',s:'A beaker is the best glassware for measuring an exact volume.',fact:false,why:'Beaker marks are rough, often ±5% or worse. Use a graduated cylinder, buret or volumetric flask when the volume matters.'},
 {k:'goggles',s:'You should keep goggles on until everyone in the room is done with chemicals.',fact:true,why:'Splashes can come from someone else’s bench. Goggles stay on until the whole class has cleaned up.'},
 {k:'smell',s:'The safe way to smell a chemical is to put your nose right over the container.',fact:false,why:'Waft: hold it away from your face and wave a little of the vapor toward your nose.'}
],
density:[
 {k:'big',s:'A big log has a higher density than a small chip of the same wood.',fact:false,why:'Density is mass ÷ volume. Cutting a piece smaller lowers both, so the density stays the same.'},
 {k:'float',s:'An object floats in water if its density is less than about 1 g/mL.',fact:true,why:'Water’s density is about 1.00 g/mL. Less dense objects float; denser ones sink.'},
 {k:'heavy',s:'Heavy objects always sink.',fact:false,why:'What matters is density, not weight. A huge steel ship floats because its hull encloses lots of air, so its average density is less than water.'}
],
classify:[
 {k:'air',s:'Air is a compound.',fact:false,why:'Air is a mixture of nitrogen, oxygen, argon and other gases. Each keeps its own properties, and the amounts can change.'},
 {k:'water',s:'Water is a compound because its hydrogen and oxygen are chemically bonded in a fixed ratio.',fact:true,why:'Every water molecule is H₂O. You can only separate it into hydrogen and oxygen with a chemical change, like electrolysis.'},
 {k:'salt',s:'Salt water is a pure substance because it looks the same throughout.',fact:false,why:'It is a homogeneous mixture, a solution. You can change how much salt you add, and boiling off the water gets the salt back.'}
],
separation:[
 {k:'filter',s:'Filtering salt water removes the salt.',fact:false,why:'Dissolved salt passes through filter paper. Evaporation or distillation separates it.'},
 {k:'dist',s:'Distillation separates liquids because they boil at different temperatures.',fact:true,why:'The liquid with the lower boiling point turns to vapor first, then condenses in a separate container.'},
 {k:'chrom',s:'Paper chromatography can show that one black marker contains several dyes.',fact:true,why:'Each dye moves up the paper at its own speed, so they spread into separate bands.'}
],
goldenpenny:[
 {k:'gold',s:'The golden penny is made of gold.',fact:false,why:'Heating zinc-coated copper makes the zinc and copper mix into brass, which looks gold.'},
 {k:'alloy',s:'Brass is an alloy: a mixture of metals.',fact:true,why:'Brass is mostly copper and zinc. It has properties of its own, like its gold color.'},
 {k:'element',s:'The penny’s color changes because a new element is made.',fact:false,why:'No new element forms. Atoms are rearranged, and the same copper and zinc atoms are still there.'}
],
models:[
 {k:'solid',s:'Rutherford found that most of an atom is empty space.',fact:true,why:'Most alpha particles passed straight through gold foil. Only a few bounced back, from a tiny, dense nucleus.'},
 {k:'plum',s:'Thomson’s plum pudding model is still the accepted picture of the atom.',fact:false,why:'The gold foil experiment ruled it out. A spread-out positive “pudding” could not bounce alpha particles straight back.'},
 {k:'orbit',s:'Electrons circle the nucleus in neat paths like planets.',fact:false,why:'That was Bohr’s model. Today electrons are described by orbitals: regions where an electron is likely to be found.'}
],
atombuilder:[
 {k:'id',s:'The number of protons decides which element an atom is.',fact:true,why:'Every carbon atom has 6 protons. Change the proton number and you have a different element.'},
 {k:'iso',s:'Isotopes of an element have different numbers of protons.',fact:false,why:'Isotopes have the same number of protons and different numbers of neutrons, so their masses differ.'},
 {k:'ion',s:'An atom that loses an electron becomes a positive ion.',fact:true,why:'It now has more protons than electrons. Losing negative charge leaves a net positive charge.'}
],
avgmass:[
 {k:'whole',s:'Atomic masses on the periodic table are not whole numbers because they are averages.',fact:true,why:'They are weighted averages of an element’s natural isotopes. Chlorine is 35.45 because about 3/4 is Cl-35 and 1/4 is Cl-37.'},
 {k:'equal',s:'The average atomic mass is the plain average of the isotope masses.',fact:false,why:'It is weighted by how common each isotope is. A rare isotope counts for less.'},
 {k:'exists',s:'Some chlorine atoms have a mass of exactly 35.45 u.',fact:false,why:'No single chlorine atom has that mass. It is the average of Cl-35 and Cl-37 atoms.'}
],
nuclear:[
 {k:'alpha',s:'An alpha particle can be stopped by a sheet of paper.',fact:true,why:'It is a heavy helium nucleus that loses energy quickly. Beta needs aluminum, and gamma needs thick lead or concrete.'},
 {k:'gamma',s:'Gamma decay changes one element into another.',fact:false,why:'Gamma is a burst of energy. The proton number does not change, so the element stays the same. Alpha and beta decay do change it.'},
 {k:'beta',s:'In beta decay, a neutron turns into a proton.',fact:true,why:'The nucleus gives off an electron, and the atomic number goes up by one.'}
],
halflife:[
 {k:'gone',s:'After two half-lives, all of a radioactive sample is gone.',fact:false,why:'Half is left after one half-life and a quarter after two. Each half-life halves what remains.'},
 {k:'which',s:'You can predict exactly when one particular atom will decay.',fact:false,why:'Decay is random for each atom. Half-life describes large numbers of atoms, like coin flips.'},
 {k:'c14',s:'Carbon-14 dating works because living things stop taking in carbon when they die.',fact:true,why:'After death the C-14 decays with a half-life of about 5,730 years and is not replaced, so the remaining amount gives the age.'}
],
light:[
 {k:'red',s:'Red light carries more energy per photon than blue light.',fact:false,why:'Blue has a shorter wavelength and higher frequency, so each photon carries more energy (E = hf).'},
 {k:'speed',s:'All colors of light travel at the same speed in a vacuum.',fact:true,why:'Every color moves at about 3.00 × 10⁸ m/s in a vacuum. They differ in wavelength and frequency.'},
 {k:'uv',s:'Ultraviolet can burn skin while visible light doesn’t because each UV photon has more energy.',fact:true,why:'Higher-frequency photons carry enough energy to damage molecules like DNA.'}
],
spectra:[
 {k:'finger',s:'Each element gives off its own pattern of colored lines.',fact:true,why:'Its electrons can only drop between certain energy levels, so it emits only certain wavelengths, like a fingerprint.'},
 {k:'heat',s:'A flame test color comes from the metal burning.',fact:false,why:'Heat lifts electrons to higher levels. The color is the light they give off as they fall back down.'},
 {k:'sun',s:'Astronomers found helium in the Sun before finding it on Earth.',fact:true,why:'Its spectral lines were seen in sunlight in 1868, about 27 years before helium was isolated on Earth.'}
],
econfig:[
 {k:'order',s:'Electrons fill the 4s orbital before the 3d orbitals.',fact:true,why:'4s is slightly lower in energy for neutral atoms in that row, so it fills first (the Aufbau order).'},
 {k:'pair',s:'Electrons pair up in one orbital before moving into an empty one of the same energy.',fact:false,why:'Hund’s rule: they spread out one per orbital first, then pair.'},
 {k:'two',s:'Each orbital holds at most two electrons.',fact:true,why:'The two must have opposite spins (the Pauli exclusion principle).'}
],
pes:[
 {k:'peak',s:'Each peak in a PES spectrum comes from electrons in one subshell.',fact:true,why:'Electrons in the same subshell need the same energy to remove, so they make one peak; its height shows how many there are.'},
 {k:'inner',s:'Inner electrons take less energy to remove than outer ones.',fact:false,why:'Inner electrons are closer to the nucleus and less shielded, so they need much more energy.'},
 {k:'height',s:'A taller peak means that subshell holds more electrons.',fact:true,why:'Peak height is proportional to the number of electrons in that subshell.'}
],
orbitals:[
 {k:'p',s:'A p orbital is shaped like a dumbbell with two lobes.',fact:true,why:'The three p orbitals point along x, y and z, with a node at the nucleus.'},
 {k:'path',s:'An orbital is the path an electron travels.',fact:false,why:'An orbital is a 3D region where the electron is likely to be found, not a track it follows.'},
 {k:'big',s:'A 2s orbital is larger than a 1s orbital.',fact:true,why:'Higher energy levels reach farther from the nucleus.'}
],
ptable:[
 {k:'group',s:'Elements in the same column tend to react in similar ways.',fact:true,why:'They have the same number of valence electrons, which mostly decides how an element reacts.'},
 {k:'mass',s:'The periodic table is arranged in order of atomic mass.',fact:false,why:'It is ordered by atomic number, the number of protons. That is why tellurium (127.6) comes before iodine (126.9).'},
 {k:'noble',s:'Noble gases rarely react because their outer shells are full.',fact:true,why:'A full valence shell is very stable, so they rarely gain, lose or share electrons.'}
],
trends:[
 {k:'size',s:'Atoms get smaller as you go left to right across a period.',fact:true,why:'More protons pull the same shell of electrons in tighter.'},
 {k:'down',s:'Atoms get smaller as you go down a group.',fact:false,why:'Each row adds a new shell farther from the nucleus, so atoms get bigger going down.'},
 {k:'f',s:'Fluorine is the most electronegative element.',fact:true,why:'It is small with a strong pull from its nucleus, so it attracts shared electrons more than any other atom.'}
],
naming:[
 {k:'roman',s:'In iron(III) oxide, the III tells you there are three oxygen atoms.',fact:false,why:'The Roman numeral is the charge on the iron ion, +3. The formula is Fe₂O₃.'},
 {k:'prefix',s:'Prefixes like di- and tri- are used for molecular compounds, not ionic ones.',fact:true,why:'CO₂ is carbon dioxide, but CaCl₂ is calcium chloride, not calcium dichloride.'},
 {k:'ide',s:'Names ending in -ate mean the ion contains oxygen.',fact:true,why:'Sulfate (SO₄²⁻), nitrate (NO₃⁻) and carbonate (CO₃²⁻) all contain oxygen.'}
],
lewis:[
 {k:'octet',s:'Most atoms in molecules end up with eight valence electrons around them.',fact:true,why:'That is the octet rule. Hydrogen is the big exception: it needs only two.'},
 {k:'lone',s:'Lone pairs don’t matter for a molecule’s shape.',fact:false,why:'Lone pairs repel bonding pairs and push them closer together, which is why water is bent.'},
 {k:'double',s:'A double bond means the atoms share four electrons.',fact:true,why:'Each bond is one shared pair, so a double bond is two pairs, four electrons.'}
],
buildmol:[
 {k:'flat',s:'Methane (CH₄) is flat like a plus sign.',fact:false,why:'Its four bonds spread out in 3D to a tetrahedron, about 109.5° apart.'},
 {k:'iso',s:'Two molecules can have the same formula but different structures.',fact:true,why:'They are called isomers. Butane and isobutane are both C₄H₁₀ but have different shapes and boiling points.'},
 {k:'c4',s:'Carbon usually forms four bonds.',fact:true,why:'It has four valence electrons and needs four more to fill its octet.'}
],
vsepr:[
 {k:'water',s:'A water molecule is straight, with the H atoms on opposite sides.',fact:false,why:'Two lone pairs on oxygen push the bonds into a bent shape, about 104.5°.'},
 {k:'co2',s:'Carbon dioxide is linear.',fact:true,why:'Carbon has two double bonds and no lone pairs, so they spread out to 180°.'},
 {k:'nh3',s:'Ammonia (NH₃) is a trigonal pyramid, not flat.',fact:true,why:'The lone pair on nitrogen pushes the three N–H bonds down, like a short tripod.'}
],
polarity:[
 {k:'polarbond',s:'A molecule with polar bonds is always polar.',fact:false,why:'CO₂ has polar bonds, but they point in opposite directions and cancel. Shape decides.'},
 {k:'oil',s:'Oil and water don’t mix because water is polar and oil is not.',fact:true,why:'Water molecules attract each other more than they attract oil, so they push the oil out. “Like dissolves like.”'},
 {k:'en',s:'Electrons in a polar bond spend more time near the more electronegative atom.',fact:true,why:'That atom gets a slight negative charge, and the other a slight positive charge.'}
],
bondtypes:[
 {k:'salt',s:'Solid table salt conducts electricity.',fact:false,why:'Its ions are locked in place. Melted or dissolved in water, the ions can move and it conducts.'},
 {k:'diamond',s:'Diamond is so hard because every carbon atom is covalently bonded to four others.',fact:true,why:'It is a network solid: one giant molecule, with no weak spots between separate molecules.'},
 {k:'metal',s:'Metals conduct electricity because their electrons can move freely between atoms.',fact:true,why:'Metallic bonding is a lattice of positive ions in a “sea” of shared, mobile electrons.'}
],
imf:[
 {k:'bonds',s:'When water boils, its O–H bonds break.',fact:false,why:'Boiling only pulls whole molecules apart, overcoming forces between them. The bubbles are still H₂O.'},
 {k:'hbond',s:'Hydrogen bonding is why water has an unusually high boiling point for its size.',fact:true,why:'Each water molecule can hydrogen-bond to its neighbors, so it takes more energy to separate them.'},
 {k:'big',s:'Larger nonpolar molecules usually have higher boiling points.',fact:true,why:'More electrons means stronger London dispersion forces. That is why octane is a liquid and methane is a gas.'}
],
states:[
 {k:'temp',s:'While ice is melting, its temperature stays at 0 °C even as you keep heating it.',fact:true,why:'The added energy goes into breaking the hold between molecules, not into speeding them up, until all the ice has melted.'},
 {k:'gas',s:'Particles in a solid don’t move at all.',fact:false,why:'They vibrate in place. Only at absolute zero would that motion be at its minimum.'},
 {k:'steam',s:'Steam at 100 °C can burn you worse than water at 100 °C.',fact:true,why:'Steam releases extra energy, the heat of vaporization, when it condenses on your skin.'}
],
phasediagram:[
 {k:'altitude',s:'Water boils at a lower temperature in Denver than at sea level.',fact:true,why:'Lower air pressure means water reaches boiling sooner, at about 95 °C in Denver.'},
 {k:'dry',s:'Dry ice melts into liquid CO₂ at room pressure.',fact:false,why:'At normal pressure, solid CO₂ sublimes straight to gas. Liquid CO₂ only exists above about 5 atm.'},
 {k:'triple',s:'At the triple point, solid, liquid and gas can all exist together.',fact:true,why:'For water it is 0.01 °C and 0.006 atm.'}
],
gaslaws:[
 {k:'celsius',s:'You can use Celsius temperatures in the gas law formulas.',fact:false,why:'Gas laws need kelvins. At 0 °C a gas still has volume, but at 0 K it would theoretically have none.'},
 {k:'balloon',s:'A balloon shrinks in the cold because the gas inside slows down.',fact:true,why:'Slower particles hit the walls less often and less hard, so the pressure drops and the balloon contracts.'},
 {k:'boyle',s:'Squeezing a gas into half the volume at the same temperature doubles its pressure.',fact:true,why:'Boyle’s law: P × V stays constant, so halving V doubles P.'}
],
kmt:[
 {k:'same',s:'At the same temperature, all gas molecules move at the same speed.',fact:false,why:'They have the same average kinetic energy, so lighter molecules move faster. Hydrogen is much faster than oxygen.'},
 {k:'temp',s:'Temperature measures the average kinetic energy of the particles.',fact:true,why:'Doubling the Kelvin temperature doubles the average kinetic energy.'},
 {k:'spread',s:'In a gas, some molecules move much faster than average and some much slower.',fact:true,why:'Speeds follow a spread (the Maxwell-Boltzmann distribution). Heating shifts and widens it.'}
],
gasstoich:[
 {k:'stp',s:'At STP, one mole of any ideal gas takes up about 22.4 L.',fact:true,why:'At 0 °C and 1 atm, the volume depends on the number of particles, not what they are.'},
 {k:'water',s:'Gas collected over water is pure gas.',fact:false,why:'It is mixed with water vapor. Subtract the vapor pressure of water at that temperature to get the pressure of your gas.'},
 {k:'heavy',s:'A mole of a heavy gas takes up more space than a mole of a light gas at the same conditions.',fact:false,why:'Gas particles are tiny compared with the space between them, so a mole of any ideal gas takes the same volume.'}
],
airbag:[
 {k:'exact',s:'An air bag needs just the right amount of sodium azide, figured with stoichiometry.',fact:true,why:'Too little and the bag doesn’t fill; too much and it hits too hard. Moles of gas come from the balanced equation.'},
 {k:'air',s:'Air bags fill with air from outside the car.',fact:false,why:'A fast chemical reaction makes nitrogen gas inside the bag in a few hundredths of a second.'},
 {k:'pv',s:'You need the gas laws to find how many moles of gas fill the bag.',fact:true,why:'n = PV/RT turns the bag’s volume, pressure and temperature into moles of gas.'}
],
balance:[
 {k:'sub',s:'You can balance an equation by changing subscripts.',fact:false,why:'Changing a subscript changes the substance. H₂O₂ is hydrogen peroxide, not water. Change only coefficients.'},
 {k:'atoms',s:'A balanced equation has the same number of each kind of atom on both sides.',fact:true,why:'Atoms are rearranged, not created or destroyed (conservation of mass).'},
 {k:'molec',s:'A balanced equation has the same number of molecules on both sides.',fact:false,why:'2 H₂ + O₂ → 2 H₂O has 3 molecules on the left and 2 on the right. Only atoms must match.'}
],
rxntypes:[
 {k:'comb',s:'Burning a hydrocarbon in plenty of oxygen makes carbon dioxide and water.',fact:true,why:'That is complete combustion. With too little oxygen, poisonous carbon monoxide can form.'},
 {k:'single',s:'In a single replacement reaction, any metal can replace any other metal.',fact:false,why:'Only a more active metal replaces a less active one. Check the activity series.'},
 {k:'decomp',s:'In a decomposition reaction, one compound breaks into two or more simpler substances.',fact:true,why:'For example, 2 H₂O₂ → 2 H₂O + O₂, the fizz when peroxide hits a cut.'}
],
activity:[
 {k:'cu',s:'Dropping copper into a zinc sulfate solution coats the copper with zinc.',fact:false,why:'Copper is less active than zinc, so nothing happens. Zinc in copper sulfate does react and gets coated with copper.'},
 {k:'gold',s:'Gold is near the bottom of the activity series, which is why it doesn’t rust or tarnish.',fact:true,why:'It gives up electrons very reluctantly, so it stays shiny for thousands of years.'},
 {k:'acid',s:'Metals above hydrogen in the activity series can make hydrogen gas from acids.',fact:true,why:'Zinc and magnesium fizz in hydrochloric acid; copper does not.'}
],
precip:[
 {k:'all',s:'Mixing any two salt solutions makes a solid.',fact:false,why:'Only if a combination of ions is insoluble. Use the solubility rules. Mixing NaCl and KNO₃ gives no precipitate.'},
 {k:'spect',s:'Spectator ions are left out of the net ionic equation.',fact:true,why:'They stay dissolved and unchanged, so they don’t take part in the reaction.'},
 {k:'nitrate',s:'Nearly all nitrate compounds dissolve in water.',fact:true,why:'That is one of the solubility rules, which is why nitrates are handy for making solutions.'}
],
calorimetry:[
 {k:'water',s:'Water heats up quickly because it has a low specific heat.',fact:false,why:'Water has a high specific heat, 4.18 J/(g·°C). It takes a lot of energy to warm, which is why lakes and coasts change temperature slowly.'},
 {k:'cal',s:'A food Calorie with a capital C is 1000 calories.',fact:true,why:'One food Calorie is one kilocalorie, about 4184 J.'},
 {k:'lost',s:'In a calorimeter, the heat lost by the hot object equals the heat gained by the water, if no heat escapes.',fact:true,why:'Energy is conserved. That is how you find the specific heat of a metal.'}
],
coldpack:[
 {k:'cold',s:'A cold pack makes cold.',fact:false,why:'It absorbs heat. Dissolving ammonium nitrate is endothermic, so it pulls heat from your skin.'},
 {k:'hand',s:'Hand warmers work by a reaction that releases heat.',fact:true,why:'Iron powder rusts quickly inside the packet, an exothermic reaction.'},
 {k:'sign',s:'An endothermic process has a positive ΔH.',fact:true,why:'The system gains energy from its surroundings.'}
],
enthalpy:[
 {k:'break',s:'Breaking chemical bonds releases energy.',fact:false,why:'Breaking bonds always takes energy. Energy is released when new bonds form.'},
 {k:'hess',s:'Hess’s law says the total ΔH is the same no matter what steps the reaction takes.',fact:true,why:'Enthalpy is a state function: only the start and the end matter.'},
 {k:'elem',s:'The standard heat of formation of an element in its standard state is zero.',fact:true,why:'Nothing needs to happen to form O₂(g) from O₂(g), so ΔH°f is 0 by definition.'}
],
molarity:[
 {k:'solvent',s:'A 1 M solution is made by adding one mole of solute to 1 L of water.',fact:false,why:'Molarity is moles per liter of solution. Dissolve the solute, then add water up to 1 L total.'},
 {k:'dilute',s:'When you dilute a solution, the moles of solute stay the same.',fact:true,why:'You only add water, so M₁V₁ = M₂V₂.'},
 {k:'acid',s:'When diluting acid, add acid to water, not water to acid.',fact:true,why:'Mixing gives off heat. Adding acid slowly to lots of water keeps it from boiling and spattering.'}
],
dissolve:[
 {k:'gone',s:'When sugar dissolves, it disappears.',fact:false,why:'The sugar molecules spread out among water molecules. The mass is still there, and evaporating the water gets the sugar back.'},
 {k:'ions',s:'Salt dissolves by splitting into Na⁺ and Cl⁻ ions surrounded by water.',fact:true,why:'Water’s partial charges pull the ions out of the crystal and surround them.'},
 {k:'stir',s:'Stirring makes more sugar dissolve in the end.',fact:false,why:'Stirring speeds up dissolving but doesn’t change how much can dissolve. Temperature changes that.'}
],
solcurve:[
 {k:'gas',s:'Gases dissolve better in cold water than in warm water.',fact:true,why:'That is why warm soda goes flat faster and warm lakes hold less oxygen for fish.'},
 {k:'all',s:'Every solid dissolves better in hotter water.',fact:false,why:'Most do, but not all. Some, like cerium sulfate, dissolve less as the water heats.'},
 {k:'super',s:'A supersaturated solution holds more solute than it normally could at that temperature.',fact:true,why:'It is unstable. A seed crystal makes the extra solute come out all at once, as in hot ice (sodium acetate).'}
],
colligative:[
 {k:'salt',s:'Salt on icy roads works because it lowers the freezing point of water.',fact:true,why:'Dissolved particles get in the way of ice forming, so the water stays liquid below 0 °C.'},
 {k:'pasta',s:'Salting pasta water makes it boil noticeably hotter.',fact:false,why:'A spoonful of salt raises the boiling point by only a tiny fraction of a degree. It’s there for flavor.'},
 {k:'count',s:'Colligative properties depend on the number of dissolved particles, not what they are.',fact:true,why:'That’s why NaCl, which splits into two ions, lowers the freezing point about twice as much as the same moles of sugar.'}
],
beerslaw:[
 {k:'dark',s:'A more concentrated colored solution absorbs more light.',fact:true,why:'Absorbance is proportional to concentration (A = εbc), so you can read concentration from a calibration line.'},
 {k:'color',s:'You should measure at the color of light the solution looks.',fact:false,why:'A blue solution looks blue because it absorbs orange light. Measure at the wavelength it absorbs most.'},
 {k:'path',s:'A wider cuvette gives a higher absorbance for the same solution.',fact:true,why:'Light passes through more solution, so more is absorbed (the b in A = εbc).'}
],
equilibrium:[
 {k:'stop',s:'At equilibrium, the reactions stop.',fact:false,why:'The forward and reverse reactions keep going at equal rates, so the amounts stay steady.'},
 {k:'equal',s:'At equilibrium, reactant and product concentrations are equal.',fact:false,why:'They are constant, not equal. K tells you whether products or reactants are favored.'},
 {k:'lech',s:'Adding more reactant shifts the equilibrium toward products.',fact:true,why:'Le Châtelier’s principle: the system partly uses up the added reactant.'}
],
ksp:[
 {k:'small',s:'A very small Ksp means the solid barely dissolves.',fact:true,why:'Silver chloride has Ksp about 1.8 × 10⁻¹⁰, so only a trace dissolves.'},
 {k:'common',s:'Adding a common ion makes a slightly soluble salt dissolve more.',fact:false,why:'It shifts the equilibrium toward the solid, so less dissolves. That is the common-ion effect.'},
 {k:'compare',s:'You can always compare two salts’ solubility by comparing their Ksp values.',fact:false,why:'Only if they split into the same number of ions. Otherwise, calculate the molar solubility.'}
],
ph:[
 {k:'ten',s:'A solution with pH 3 is ten times more acidic than one with pH 4.',fact:true,why:'pH is logarithmic: each step is a factor of 10 in [H⁺].'},
 {k:'strong',s:'A strong acid is the same thing as a concentrated acid.',fact:false,why:'Strong means it ionizes completely. A dilute strong acid and a concentrated weak acid can have the same pH.'},
 {k:'water',s:'Pure water at 25 °C has a pH of 7.',fact:true,why:'[H⁺] = [OH⁻] = 1.0 × 10⁻⁷ M, so it is neutral.'}
],
buffers:[
 {k:'ph7',s:'A buffer always has a pH of 7.',fact:false,why:'A buffer resists pH change at whatever pH it is set to, near the pKa of its weak acid.'},
 {k:'blood',s:'Your blood is buffered to stay near pH 7.4.',fact:true,why:'The carbonic acid–bicarbonate buffer keeps it in a narrow range; small shifts can be dangerous.'},
 {k:'pair',s:'A buffer is made of a weak acid and its conjugate base.',fact:true,why:'The acid neutralizes added base and the base neutralizes added acid.'}
],
galvanic:[
 {k:'bridge',s:'A galvanic cell works fine without a salt bridge.',fact:false,why:'Without it, charge builds up in each beaker and the current stops in moments.'},
 {k:'anode',s:'Oxidation happens at the anode.',fact:true,why:'“An Ox, Red Cat”: anode = oxidation, cathode = reduction.'},
 {k:'battery',s:'A dead battery has run out of electricity.',fact:false,why:'It has run out of the chemicals that react. The electrons were there all along; the reaction pushed them through the circuit.'}
],
gibbs:[
 {k:'fast',s:'A spontaneous reaction happens quickly.',fact:false,why:'Spontaneous only means it can happen without outside energy. Diamond turning to graphite is spontaneous but takes millions of years.'},
 {k:'neg',s:'A negative ΔG means the reaction is thermodynamically favored.',fact:true,why:'ΔG = ΔH − TΔS. When it is negative, the process can proceed on its own.'},
 {k:'ice',s:'Ice melting above 0 °C is driven by an increase in entropy.',fact:true,why:'Melting absorbs heat (ΔH positive), but above 0 °C the TΔS term is larger, so ΔG is negative.'}
]
});
