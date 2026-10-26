/* 00-sample.js */
BioLab.addPractical({
stoich: {
  hook: 'A pancake recipe needs 2 eggs per cup of mix. You have 6 eggs and 2 cups of mix. How many batches can you make, and what is left over? Chemists ask the same question about molecules, and the answer sets how much product a factory makes.',
  uses: [
    'Car engines: the engine computer meters fuel so there is enough oxygen. With too little air, fuel is left unburned and the exhaust carries carbon monoxide.',
    'Drug manufacturing: chemists add the cheap reactant in excess so the expensive one gets used up completely.',
    'Airbags: the amount of sodium azide sets how much N₂ gas fills the bag, in about 30 milliseconds.'
  ],
  answer: '6 eggs ÷ 2 per cup = 3 cups’ worth, but you only have 2 cups of mix. The mix runs out first, so you make 2 batches and 2 eggs are left over. The mix is the limiting reactant.',
  takeaway: 'The ingredient you run out of first sets how much you can make, even if you started with more of it. Divide what you have by what the recipe needs; the smallest answer wins.',
  tour: ['A balanced equation is a recipe. 2H₂ + O₂ → 2H₂O says 2 hydrogen molecules plus 1 oxygen molecule make 2 water molecules. It is the reaction that runs a hydrogen fuel-cell bus.']
}
});

/* c1.js */
BioLab.addPractical({
labbench: {
  hook: 'You need exactly 25.00 mL of a solution for a titration. On the bench are a beaker with volume marks, a graduated cylinder and a volumetric pipet. Which one do you grab, and how far off could the beaker be?',
  hookSet: { mode: 'identify', item: 'beaker' },
  answer: 'Grab the volumetric pipet. It delivers 25.00 mL to within ±0.03 mL. A beaker’s marks are only about ±5%, so a “25 mL” pour could be off by more than 1 mL either way. A 50 mL graduated cylinder lands in between, at about ±0.25 mL.',
  uses: [
    'Liquid medicine: pharmacists hand out an oral syringe or dosing cup instead of telling you to use a kitchen spoon, because kitchen spoons vary a lot in how much they hold.',
    'Pool chemicals: the label on muriatic acid says to add acid to water, never water to acid, for the same reason as in the lab. The heat can make it spatter.',
    'Kitchen scale: pressing tare with the empty bowl on it works like taring a lab balance, so the display shows only the flour you add.'
  ],
  takeaway: 'A container with marks is not a measuring tool. Match the tool to the precision you need: a beaker gets you within about 5%, a graduated cylinder within about 1%, and a pipet or buret within a few hundredths of a mL.',
  lede: 'Meet the tools on a chemistry bench: which ones hold things, which ones measure, and which ones take heat. Then pick the right tool for a job and spot the hazards in a lab.',
  tour: [
    'The beaker and the Erlenmeyer flask are for holding, mixing and heating, like a mixing bowl. Their volume marks are rough, about ±5%, so “100 mL” on the side could really be 95 to 105 mL. Do not measure with them.',
    'The graduated cylinder, volumetric flask, buret and volumetric pipet are the measuring tools. A cylinder reads to 0.1 mL; the buret and pipet read to 0.01 mL, a small fraction of one drop.',
    'The Bunsen burner sits under an iron ring clamped to the ring stand. Wire gauze on the ring spreads the flame’s heat across the bottom of the glass, so the glassware does not crack from one hot spot.',
    'For a full, hot flame, use porcelain. Heat a solid in a crucible, boil a solution dry in an evaporating dish, and pick up hot porcelain with crucible tongs, never your fingers.',
    'The electronic balance reads to 0.01 g, a hundred times finer than a typical kitchen scale. The thermometer is marked every 1 °C, so you record it to 0.1 °C by estimating between the marks.',
    'Now find what is unsafe in this lab. Here a student pours water into concentrated acid, which can boil and spatter acid out of the container. Always add acid to water. Click each hazard you can find.'
  ]
},
measure: {
  hook: 'You check a lab balance with a 25.00 g standard mass. Ten readings all fall between 25.5 g and 25.7 g, close to each other but well above 25.00 g. Is the balance accurate, precise, both or neither, and will more readings fix it?',
  hookSet: { mode: 'acc', bias: 0.6, spread: 0.05 },
  answer: 'Precise, not accurate. The readings agree with each other (standard deviation about 0.06 g), but their average is about 25.6 g, roughly 0.6 g too high. That is a systematic error, so more readings just give you the same wrong average. Re-zero or recalibrate the balance, then check the standard again.',
  uses: [
    'Bathroom scale: if it reads 1 kg heavy every morning, it is precise but not accurate. Your day-to-day change is still right, because the same bias is in every reading.',
    'Car speedometer: bigger aftermarket tires make it read low at every speed, a systematic error. Driving the same road again will not reveal it; checking against a phone’s GPS will.',
    'Free throws: shots that all clank off the same spot on the back rim are precise but not accurate. The shooter needs to change aim, not consistency.'
  ],
  takeaway: 'Precise means your readings agree with each other. Accurate means they agree with the true value. Repeating a measurement shrinks random scatter but never removes a steady bias; to catch bias, check the instrument against something you know.',
  lede: 'Read lab instruments the way a scientist does: every digit you are sure of, plus one careful estimate. Then weigh a known mass ten times and see whether your balance is accurate, precise, or both.',
  tour: [
    'This 10 mL cylinder is marked every 0.1 mL, with numbers every 1 mL, about a fifth of a teaspoon between numbers. The zoom circle magnifies the scale right at the water’s surface.',
    'Water creeps up the glass, so its surface curves. That curve is the meniscus. Read the bottom of it with your eye level with the surface; the dashed line shows eye level. Looking from above or below shifts your reading.',
    'The bottom sits between 6.4 and 6.5 mL, a little less than halfway. Record <b>6.43 mL</b>. The 6.4 is certain; the 3 is your best estimate. Writing 6.4 throws away information, and 6.432 claims more than you can see.',
    'A digital balance shows its estimated digit for you. Record every digit shown, even a trailing zero: 36.40 g says the mass is known to a hundredth of a gram, and 36.4 g does not.',
    'Now weigh a 25.00 g standard mass ten times. Systematic error (bias) moves the whole cluster the same way, like a scale that always reads heavy. Random error spreads the readings out, like a breeze or a shaky hand.',
    'Significant figures are the digits that came from measuring. In 0.00450 the leading zeros only place the decimal point, so they don’t count. The trailing zero after the 5 was measured, so it does: 3 significant figures.'
  ]
},
units: {
  hook: 'You want to carry 2.0 L of water on a hike up a Colorado fourteener, and your bottle holds 455 mL. How many liters is one bottle, and how many times do you need to fill it?',
  hookSet: { mode: 'chain', prob: 'mlL' },
  answer: '455 mL × (1 L ÷ 1000 mL) = 0.455 L. The mL cancels, leaving liters. Then 2.0 L ÷ 0.455 L = 4.4 bottles, so you need 5. Four bottles would leave you 0.18 L short.',
  uses: [
    'Mars Climate Orbiter: NASA lost this spacecraft in 1999 because one team’s software used pound-force seconds and another’s used newton-seconds. Nobody carried the units through.',
    'Road trip: at 30 miles per gallon, a 450-mile drive takes 450 mi × (1 gal ÷ 30 mi) = 15 gallons. The miles cancel, so you know the setup is right.',
    'Running: a 5K is 5.00 km. With 1 mi = 1.609 km, that is 3.11 miles, which is why race shirts say 3.1.'
  ],
  takeaway: 'Write every number with its unit, and multiply by factors that equal 1 so the unit you don’t want cancels. If the units come out wrong, the setup is wrong, even before you check the number.',
  lede: 'Change any measurement into the unit you need by multiplying by factors that equal 1. Line up the units so they cross out, and the units tell you when the setup is right.',
  tour: [
    'Start with what you know, written with its unit: 2.50 km, half of a 5K race. Your goal is the same distance in meters.',
    '1 km = 1000 m, so 1000 m / 1 km equals 1. Multiplying by it changes the unit you write, not the distance, the way 4 quarters and $1 are the same money.',
    'In 2.50 km, km is on top, so the factor needs km on the bottom. Then the two km cross out, the same way you cancel a number on the top and bottom of a fraction.',
    '2.50 × 1000 ÷ 1 = 2500. The 1000 is exact by definition, so it does not limit sig figs. Keep the 3 from 2.50 and write 2.50 × 10³ m. Plain 2500 m would look like only 2 sig figs.',
    'Flip the factor and km does not cancel: you get km²/m, a unit that makes no sense for a distance. Wrong units tell you the setup is wrong before you even look at the number.',
    'Hours to seconds takes two steps, h → min → s, like turning a 3.0-hour practice into minutes and then into seconds. Each factor cancels the unit the last one left.',
    'For metric prefixes you can also count steps on the ladder. Kilo to the base unit is 3 steps down, so the decimal moves 3 places right: 4.75 km is 4750 m.'
  ]
},
density: {
  hook: 'You find an unlabeled chunk of gray metal in the shop. It has a mass of 54.2 g and raises the water in a graduated cylinder by 7.6 mL. Is it aluminum, zinc, iron or lead?',
  hookSet: { mode: 'measure', obj: 'A', size: 2 },
  answer: '54.2 g ÷ 7.6 cm³ = 7.1 g/cm³ (the 7.6 mL reading limits you to 2 sig figs). That matches zinc, 7.13 g/cm³. Aluminum (2.70), iron (7.87) and lead (11.34 g/cm³) are too far off. In the sim this chunk is Mystery sample A.',
  uses: [
    'Egg freshness: a fresh egg, about 1.03 g/cm³, sinks in water. An old egg loses water through its shell and its air pocket grows, so it floats.',
    'Gold panning on Clear Creek: gold (19.3 g/cm³) sinks to the bottom of the pan while lighter sand, about 2.7 g/cm³, washes over the edge.',
    'Ice: at 0.917 g/cm³, about 92% of an ice cube sits below the surface of fresh water. That is why most of an iceberg is hidden.'
  ],
  takeaway: 'Density is mass ÷ volume, and it is the same for a small piece or a large piece of one material. That makes it a fingerprint. Anything less dense than a liquid floats in it; anything denser sinks.',
  lede: 'Weigh a sample, find how much space it takes up, and divide. The answer, density, identifies mystery metals and predicts what sinks or floats.',
  tour: [
    'The balance reads to 0.01 g. Mass tells you how much matter is in the sample. This aluminum block comes in near 27 g, about the mass of five nickels.',
    'This block has straight sides, so measure length, width and height to 0.01 cm and multiply: V = l × w × h, in cm³. One cm³ is a cube 1 cm on each side, about as wide as a fingernail.',
    'For any shape, use water displacement. Read the water before and after the sample goes in. The rise is the sample’s volume, the way the water rises when you get into a bathtub. 1 mL = 1 cm³.',
    'D = m ÷ V. Aluminum comes out near 2.70 g/cm³ whether the block is small or large. Double the size and the mass doubles too, so the ratio stays the same.',
    'Density depends on how heavy the atoms are and how tightly they pack. Lead atoms are almost 8 times heavier than aluminum atoms, which is why a lead fishing weight feels so heavy for its size.',
    'Liquids stack by density, the way oil floats on vinegar in salad dressing. Each object settles where the liquid below it is denser than it is.'
  ]
},
classify: {
  hook: 'You boil a pot of salted pasta water until it is dry, and a white crust is left in the pot. Was the salty water a pure substance, and was boiling it a physical or a chemical change?',
  hookSet: { mode: 'sort', sample: 'salt' },
  answer: 'Salt water is a mixture: the zoom shows H₂O molecules plus Na⁺ and Cl⁻ ions, spread evenly, so it is a homogeneous mixture. Boiling is a physical change. The water molecules leave as steam but stay whole H₂O, and the crust is the salt that was dissolved there all along.',
  uses: [
    'Cooking: dissolving sugar in tea is a physical change, since drying the tea leaves the sugar behind. Caramelizing sugar in a pan is chemical: it browns and new flavor compounds form.',
    'Car rust: rusting turns iron into Fe₂O₃, a new substance, so you cannot wipe it back into iron. Road salt on Colorado winter roads speeds it up.',
    'Climbing a fourteener: air is a homogeneous mixture, and at the summit it is still about 21% oxygen. There is just less air in each breath.'
  ],
  takeaway: 'Ask two questions: is there one substance or more, and did a new substance form? Melting, boiling and dissolving move the same molecules around. Burning and rusting make new substances that cooling or drying will not undo.',
  lede: 'Zoom in on everyday samples like water, salt water and air. Sort each one as an element, compound or mixture, then watch what really happens to the particles when ice melts or gas burns.',
  tour: [
    'On the left is what you see in the lab. The big circle zooms in about 100 million times, enough to see single particles. This is pure water, like distilled water: every particle is the same H₂O molecule.',
    'Salt water looks just like pure water from outside. The zoom shows water molecules plus Na⁺ and Cl⁻ ions. Two substances means a mixture, even when you cannot see them apart.',
    'Oxygen gas, the part of air you need to breathe, is made of O₂ molecules. Both atoms in each molecule are oxygen, so oxygen gas is an element, not a compound.',
    'Sand in water settles into a layer you can see. A mixture whose parts you can tell apart is heterogeneous. Salt water and air are the same all through, so they are homogeneous.',
    'Two questions sort any sample. One substance? Then ask: one kind of atom (element) or more (compound)? A mixture? Then ask: the same throughout (homogeneous), like lemonade, or not (heterogeneous), like trail mix?',
    'Melting ice, like an ice cube in a drink: the H₂O molecules leave their fixed spots and slide around, but every molecule stays whole. No new substance forms, so it is a physical change.',
    'Burning methane, the main gas in natural gas for a stove: bonds break and the same atoms regroup into CO₂ and H₂O. New substances mean a chemical change.'
  ]
},
separation: {
  hook: 'A beaker holds 10 g of sand, 5 g of salt and 3 g of iron filings, all mixed together. Which steps, in what order, get each one back, and how much of each will you really recover?',
  answer: 'Magnet first, while it is dry: it pulls out 97% of the iron. Add water to dissolve the salt, filter out the sand (98.8% back), then evaporate the filtrate to get the salt (about 92% back). Some sand rides on the magnet and some salt water soaks into the filter paper, so nothing comes back at 100%.',
  uses: [
    'Recycling centers: big magnets pull steel cans out of mixed recycling. Aluminum cans are not magnetic, so plants sort them out in a separate step.',
    'Coffee: brewing is dissolving plus filtering. Hot water dissolves flavor compounds out of the grounds, and the paper filter holds back the solid grounds.',
    'Sea salt: seawater is about 3.5% salt, so letting 1 L of it evaporate in a shallow pond leaves about 35 g of salt.'
  ],
  takeaway: 'To separate a mixture, find a property each part does not share, like magnetism, dissolving, grain size or boiling point, and use them one at a time. The order matters, and every step loses a little.',
  tour: [
    'The beaker holds 18 g of mixed sand, salt and iron filings. Each one has a property the others lack: iron is magnetic, salt dissolves in water, sand does neither. Each difference is a handle for pulling one out.',
    'Use the magnet first, while the mixture is dry. Only iron is attracted, so the filings lift out of the sand and salt. Once the mixture is wet, the magnet picks up less of the iron.',
    'Add water and stir, like stirring sugar into iced tea. Salt dissolves into ions far too small to see; sand does not. Now the salt is hiding in the water.',
    'Pour it through filter paper, the same idea as a coffee filter. Dissolved ions slip through the paper’s tiny pores. Sand grains are too big, so they stay on the filter.',
    'Heat the salty water that came through the filter. Water boils away at 100 °C and salt crystals stay in the dish, like the crust left in a pot. The thermometer holds at 100 °C while water is boiling.',
    'Every step loses a little: sand clings to the magnet, and salt water soaks into the filter paper. Percent recovery = mass recovered ÷ starting mass × 100. It is how you grade your own technique.'
  ]
},
models: {
  hook: 'You cannot see inside a sealed box, but you can roll marbles through it and watch where they come out. Rutherford did this with atoms. Fire a million alpha particles at thin gold foil. How many bounce back, and what does that tell you is inside?',
  answer: 'If atoms were plum pudding, with their charge spread evenly, none of a million would bounce back past 90°. The nuclear model gives about 38 per million, roughly 1 in 26,000, while nearly all the rest pass almost straight through. So an atom is mostly empty space with a tiny, heavy, positive nucleus at its center.',
  uses: [
    'CT scans: X-rays pass through your body from many angles, and a computer rebuilds the inside from what gets through. Same idea: send in probes, then read the pattern.',
    'Utility locating: before digging, crews can use ground-penetrating radar, bouncing radio waves off buried pipes to map what is underground without opening it.',
    'Particle physics: in 1968 at SLAC in California, electrons fired at protons scattered in ways that revealed smaller particles inside, later called quarks. Rutherford’s method, at higher energy.'
  ],
  takeaway: 'When you cannot see something, send probes at it and study what comes back. Rare surprises carry the most information. A model is only as good as the evidence it explains, and one solid result can overturn it.',
  lede: 'Nobody can see inside an atom, so in 1909 scientists fired tiny particles at gold foil and watched where they went. Run their experiment on both models of the atom and see which one matches.',
  tour: [
    'A radioactive source shoots out alpha particles: helium nuclei, 2 protons and 2 neutrons, moving at about 5% of the speed of light, roughly 15,000 km every second. A lead box with a hole aims them in a narrow beam.',
    'The beam hits gold leaf only 0.4 µm thick, about 1,400 atoms, hundreds of times thinner than a sheet of paper. Gold can be hammered thinner than almost any other metal.',
    'A zinc sulfide screen around the foil gives a tiny flash wherever an alpha lands. Zinc sulfide is also what makes many glow-in-the-dark stickers glow. Geiger and Marsden counted the flashes by eye through a microscope.',
    'If the positive charge is spread through the whole atom like a pudding, with electrons as the raisins, nothing in the foil is solid enough to stop an alpha. Every flash would land within a few degrees of straight ahead. The close-up shows alphas passing through one atom.',
    null,
    'All the positive charge is packed into a nucleus 20,000 times narrower than the atom: if the atom were a stadium 200 m across, the nucleus would be a 1 cm marble. An alpha aimed almost straight at it is pushed back by electric repulsion. Alphas that miss by a little bend a little.',
    null
  ]
},
atombuilder: {
  hook: 'A sports drink label lists sodium, but there is no sodium metal in it; that would fizz and burn in water. It holds Na⁺ ions. Build sodium-23, then make Na⁺. What changes, and is it still sodium?',
  hookSet: { p: 11, neu: 12, e: 11 },
  answer: 'Sodium-23 has 11 protons, 12 neutrons and 11 electrons. Na⁺ has the same 11 protons and 12 neutrons but only 10 electrons, so its charge is 1+. It is still sodium, because the protons set the element. Losing one electron changed the charge, not the element or the mass number.',
  uses: [
    'Carbon dating: carbon-14 has 6 protons and 8 neutrons, so living things take it in like carbon-12. Its nucleus is unstable, and that slow decay dates old bones and wood.',
    'Electrolytes: the sodium and potassium in sports drinks are Na⁺ and K⁺ ions. Their charge is what lets them carry the electrical signals in your nerves and muscles.',
    'Heavy water: deuterium is hydrogen with one neutron. Water made with it is about 10% denser, so a heavy-water ice cube sinks in a glass of ordinary water.'
  ],
  takeaway: 'Count protons to know the element; chemistry never changes that number. Neutrons change only the mass, which gives isotopes. Gaining or losing electrons changes only the charge, which gives ions.',
  tour: [
    'Every carbon atom, in pencil lead or in you, has exactly 6 protons. Change the number of protons and you change the element. The count of protons is the atomic number, Z, the whole number on each periodic table square.',
    'Neutrons sit in the nucleus with the protons and have no charge. Protons + neutrons = mass number A. Add two neutrons to carbon-12 and you get carbon-14, the kind used to date old bones. It is still carbon.',
    'Electrons are negative. When electrons equal protons, the charges cancel. Remove one electron from sodium and you get Na⁺, a cation (positive ion) with a 1+ charge. That is the form of sodium in salt and sweat.',
    'In the Bohr model, electrons fill shells from the inside out: 2 in the first, 8 in the second, 8 in the third, like seats filling from the front row. The outer-shell electrons decide how the atom bonds.',
    'The mass number goes top left, the atomic number bottom left, and the charge top right. This symbol says 23 nucleons (protons plus neutrons), 11 protons, and no charge: neutral sodium.',
    'Drawn to scale, the nucleus disappears. If the nucleus were a marble, the atom would be hundreds of meters across, longer than a few football fields. The atom is mostly empty space, yet almost all its mass is in the nucleus.'
  ]
},
avgmass: {
  hook: 'A coin jar has 1 penny in 4 from before 1982 (3.11 g, mostly copper) and the rest newer (2.50 g, zinc core). What does the average penny weigh, and why does no single penny weigh that much?',
  answer: '0.25 × 3.11 g + 0.75 × 2.50 g = 2.65 g. Every real penny is either 3.11 g or 2.50 g; 2.65 g is the average, pulled toward the common kind. Chlorine works the same way: 75.8% chlorine-35 and 24.2% chlorine-37 average to 35.45 amu, a mass no single chlorine atom has.',
  uses: [
    'Your grade: if tests count 60% and homework 40%, a 90 on tests and a 70 on homework gives 82, not 80. The heavier-weighted part pulls the average toward it.',
    'Coin collecting: 1982 pennies were made both ways, so the date cannot tell you which one you have. A scale can: 3.11 g is copper and 2.50 g is zinc.',
    'Lab recipes: you weigh 58.44 g of NaCl for 1 mol, because 22.99 and 35.45 already average in every natural isotope of sodium and chlorine.'
  ],
  takeaway: 'A weighted average leans toward whatever is most common. The atomic mass on the periodic table is that kind of average, so it is a decimal even though each single atom has a mass close to a whole number.',
  lede: 'The atomic mass on the periodic table is an average of an element’s isotopes, weighted by how common each one is. Sort a bag of pennies to see how that works, then measure real atoms in a mass spectrometer.',
  tour: [
    'Pennies made before 1982 are mostly copper and weigh 3.11 g. Pennies from 1982 on have a zinc core and weigh 2.50 g. They look alike in your hand, just as isotopes of an element look and react alike.',
    'Sorting gives the count of each type. Each count divided by the total is the percent abundance, the same way chemists report how common each isotope is in nature.',
    'Multiply each type’s mass by its fraction of the bag, then add, the way a test worth 60% of your grade counts more than homework. That weighted average equals the whole bag’s mass divided by the count.',
    'Atoms are too small to sort by hand, so chemists use a mass spectrometer. First a beam of electrons knocks one electron off each atom, making a positive ion such as ³⁵Cl⁺.',
    'Charged plates speed every ion up to the same kinetic energy. With the same energy, heavier ions move a little more slowly.',
    'In the magnetic field each ion follows a curve. Heavier ions have more momentum and bend less, the way a loaded truck takes a wider turn, so ³⁷Cl⁺ lands farther from the entrance than ³⁵Cl⁺.',
    'The detector counts the ions at each spot. Peak heights give the abundances, 75.8% chlorine-35 and 24.2% chlorine-37, so the average is 35.45 amu. That is the number printed on the periodic table.'
  ]
},
nuclear: {
  hook: 'Your smoke detector holds a speck of americium-241, which gives off alpha particles. Why is that safe on your ceiling, and what would it take to block beta or gamma radiation instead?',
  hookSet: { mode: 'shield', rad: 'alpha' },
  answer: 'A sheet of paper stops alpha particles, so the detector’s case keeps them inside. Beta from strontium-90 gets through paper (92%), but 3 mm of aluminum lets only about 2% pass. Gamma rays from cobalt-60 get through both, and even 5 cm of lead lets about 4% through.',
  uses: [
    'Smoke detectors: alphas from americium-241 let the air in a small chamber carry a tiny current. Smoke particles block that current, and the drop sets off the alarm.',
    'Radon in Colorado: radon-222 from uranium in the ground seeps into basements. Its alphas cannot get through skin, but breathed in they hit lung tissue directly, so homes are tested for it.',
    'Dental X-rays: X-rays are high-energy light, like gamma rays, so the apron you wear has lead in it to absorb stray rays.'
  ],
  takeaway: 'Alpha is stopped by paper or skin, beta by a few millimeters of metal, and gamma only partly by thick lead or concrete. Outside your body alpha is the least dangerous; breathed or swallowed, it is the most.',
  lede: 'Some atoms have a nucleus that is unstable, so it changes itself by shooting out radiation. See what comes out, what the atom turns into, and what it takes to stop each kind.',
  tour: [
    'Carbon-14 has 6 protons (red) and 8 neutrons (gray). That is too many neutrons for 6 protons, so the nucleus is unstable, which is what radioactive means. Your body holds a little carbon-14 from food.',
    'Beta decay: a neutron turns into a proton and an electron. The electron shoots out as a beta particle. The nucleus now has 7 protons, so it has become nitrogen-14, the same nitrogen that makes up most of the air.',
    'Mass numbers (top) and atomic numbers (bottom) must add up the same on both sides, because no nucleon or charge is lost. 14 = 14 + 0 and 6 = 7 + (−1). The electron counts as ⁰₋₁e.',
    'Uranium-238, found in rocks and soil, is too big to be stable. It throws out an alpha particle, 2 protons and 2 neutrons (a helium-4 nucleus), and becomes thorium-234. A drops by 4 and Z drops by 2.',
    'Technetium-99m is an excited nucleus. It drops to a lower energy by giving off a gamma ray, pure energy with no mass or charge. Hospitals use it for scans because the gamma rays leave the body and reach a camera.',
    'Thorium-234 is radioactive too. Uranium-238 decays 14 times, through radium and radon, before it reaches stable lead-206. The radon along the way is the gas that seeps into some Colorado basements.',
    'Paper stops alpha particles. Beta particles pass paper but stop in a few millimeters of aluminum. Gamma rays need thick lead or concrete, and even then a few get through, which is why radiation-therapy rooms have very thick walls.'
  ]
},
halflife: {
  hook: 'A museum is offered a bison bone said to be from the last Ice Age, over 10,000 years ago. A lab finds it has 25% of the carbon-14 in living bone. Carbon-14’s half-life is 5,730 years. Does the claim hold up?',
  hookSet: { mode: 'date', pct: 25 },
  answer: '100% → 50% → 25% is 2 half-lives: 2 × 5,730 = 11,460 years. So the bone is about 11,500 years old, and the Ice Age claim holds up. Real labs then adjust the age with tree-ring calibration, which can shift it by several hundred years.',
  uses: [
    'PET scans: fluorine-18 has a 110-minute half-life, so after 4 hours less than a quarter is left. Hospitals get it from a nearby cyclotron and use it the same day.',
    'Radon: radon-222’s half-life is 3.82 days, so radon trapped in a basement would fade within weeks, but uranium in the soil keeps making more.',
    'Age of the Earth: uranium-238’s half-life is 4.47 billion years, about the age of Earth, so roughly half the uranium-238 the planet started with is still here.'
  ],
  takeaway: 'Each half-life cuts what is left in half: 50%, 25%, 12.5%. After about 7 half-lives less than 1% remains. You cannot predict when one atom will decay, but you can predict a large sample very well.',
  tour: [
    'Each candy stands for one radioactive atom. Mark side up means it has not decayed yet. The cup of 100 candies is your sample.',
    'Shake and pour. Each candy has a 1 in 2 chance of landing blank side up, like a coin flip. Those have “decayed”, so they come out of the cup.',
    'Shake again. About half of what is left decays each time: 100 → 50 → 25 → 12. The time for half to decay is the half-life: here, 1 shake. Each shake removes fewer candies than the one before.',
    'One run is bumpy, like flipping 10 coins and getting 7 heads. Twenty runs averaged together lie right on the curve N = N₀(½)ⁿ. Real samples hold trillions of atoms, so their decay is perfectly smooth.',
    'Iodine-131, used to treat thyroid disease, has a half-life of 8.02 days. Each step here is one half-life, so the atoms left fall 200 → 100 → 50 → 25 in about 24 days.',
    'A living plant or animal has the same carbon-14 level as the air. After it dies, its carbon-14 decays and is not replaced. A sample with 25% left has passed 2 half-lives: 11,460 years.'
  ]
},
light: {
  hook: 'On a sunny day at a ski area, a few hours outside can give you a sunburn, but a bright red lamp never does. Compare a 300 nm UV-B photon with a 700 nm red one. Why does wavelength matter more than brightness?',
  hookSet: { pre: 'uvb' },
  answer: 'One 300 nm UV-B photon carries 2.33 times the energy of a 700 nm red photon (399 vs 171 kJ/mol), enough to damage molecules such as DNA in skin cells. Brighter red light only sends more weak photons. The sim’s Cl₂ shows the same thing: red light breaks no bonds at any brightness, while 450 nm blue light breaks them.',
  uses: [
    'Skiing in Colorado: fresh snow reflects up to 80% of UV, and there is less air overhead to absorb it, so your face and eyes can burn faster on the slopes.',
    'Germicidal lamps: 254 nm UV-C photons carry enough energy to damage the DNA of bacteria and viruses, so UV-C is used to disinfect drinking water and air.',
    'Microwave ovens: 12.2 cm microwave photons are far too weak to break bonds. They heat food by making water molecules spin and jostle, not by changing them.'
  ],
  takeaway: 'What light can do depends on its wavelength, not its brightness. Shorter wavelength means more energy in each photon. Brighter light just means more photons, so dim UV can damage skin when bright red light never will.',
  lede: 'Radio, light and X-rays are all the same thing at different wavelengths. Slide the wavelength and see why ultraviolet can burn you and break bonds while red light, however bright, cannot.',
  tour: [
    'Radio waves, microwaves, infrared, visible light, ultraviolet, X-rays and gamma rays are all the same thing: light. They differ only in wavelength, from longer than a building down to smaller than an atom. The marker shows where your light sits.',
    'The wavelength λ is the distance from one crest to the next. This red light has longer waves than the green light you just saw: 650 nm, about a hundredth the width of a hair. Watch the bracket.',
    'Now the light is violet, with shorter waves. The crests still move at the same speed, so more of them pass each second. That count is the frequency, the same idea as the number on an FM radio dial.',
    'Each photon of violet light carries almost twice the energy of a red photon. Ultraviolet, shown now, carries even more, which is why it can burn skin and visible light cannot. Shorter waves, more energy per photon.',
    'Turn on photons and light arrives as separate packets. Brightness sets how many packets arrive each second, like more raindrops in a heavier rain. The energy in each packet depends only on the wavelength.',
    'Shine blue light (450 nm, the color of a blue LED) on chlorine molecules. Each photon has more energy than the Cl–Cl bond, so every photon that hits splits a Cl₂ molecule into two Cl atoms.'
  ]
},
spectra: {
  hook: 'A firework bursts deep red. The maker used either a lithium salt or a strontium salt, and both give red flames. How can a spectroscope tell you which one it was?',
  hookSet: { mode: 'flame', salt: 'sr' },
  answer: 'Look at the lines, not the color. Lithium gives one bright red line at 670.8 nm, with faint ones at 610 and 460 nm. Strontium gives a cluster of red and orange lines from 606 to 681 nm plus a blue one near 461 nm. Match the pattern to the reference strips.',
  uses: [
    'Fireworks: strontium salts make red, barium salts green and copper salts blue. Each color comes from that element’s own set of emission lines.',
    'Old streetlights: low-pressure sodium lamps glow almost entirely at 589 nm. Under that single yellow color, you cannot tell a red car from a blue one.',
    'The Sun: in 1868 astronomers saw a yellow line in sunlight that matched no known element. It was helium, found in the Sun before anyone found it on Earth.'
  ],
  takeaway: 'Every element gives off its own set of exact colors when its electrons drop back down. Spread the light out and the pattern of lines identifies the element, even in a star you can never visit.',
  lede: 'Give atoms energy and they glow, each element in its own exact colors. Watch where that light comes from, then use flame tests to identify a metal the way fireworks makers and astronomers do.',
  tour: [
    'Hydrogen, the simplest atom: one proton in the middle, one electron outside. In the Bohr model the electron can only sit on certain levels, n = 1, 2, 3 and so on, like the rungs of a ladder. It cannot sit in between.',
    'Electricity in the tube slams into the atom, as in a neon sign. The electron absorbs that energy and jumps to a higher level. This is an excited state, and it does not last.',
    'The electron falls back down. The energy it loses leaves as one photon of light. A bigger drop gives a photon with more energy, which means a shorter wavelength, toward the blue end.',
    'A spectroscope spreads light out by wavelength, like a prism. Hydrogen does not make a rainbow. It makes a few sharp lines, because only certain drops are possible.',
    null,
    'Heat does the same job as electricity, which is how fireworks get their colors. Each metal ion makes its own colors in a flame. Compare the sample’s lines with the reference strips to identify the metal.'
  ]
},
econfig: {
  hook: 'Sodium is stored under oil because it reacts with moisture in the air, while the neon in a sign reacts with nothing. They differ by one electron. Build neon (10) and sodium (11). Where does that extra electron go, and why does it matter?',
  hookSet: { Z: 10 },
  answer: 'Neon is 1s² 2s² 2p⁶: every sublevel it uses is full, so it has nothing to give or take. Sodium has that same core plus one electron alone in 3s, farther out and in a new level. That lone outer electron is easy to lose, so sodium hands it to almost anything, which is why it reacts.',
  uses: [
    'Welding: argon has every sublevel full, so it reacts with almost nothing. Welders flow it over the hot metal so oxygen in the air cannot react with the weld.',
    'Fridge magnets: iron has 4 unpaired 3d electrons per atom, thanks to Hund’s rule. Their lined-up spins make iron magnetic, while zinc, with every electron paired, is not.',
    'Reading the table: chlorine sits in row 3 of the p block, so it ends in 3p⁵, one electron short of argon. That is why it grabs one electron to make Cl⁻.'
  ],
  takeaway: 'Electrons fill the lowest open spot first, two per orbital, spreading out before they pair. The outermost electrons decide how an atom reacts: a full set means stable, and one extra or one short means very reactive.',
  tour: [
    'Each box is an orbital, a space that holds up to two electrons. Rows are sublevels (1s, 2s, 2p…), and higher rows have higher energy, like higher floors in a building. The arrow at the left points uphill in energy.',
    'Hydrogen’s one electron goes into 1s, the lowest-energy orbital. Electrons always take the lowest spot available, the way water fills a glass from the bottom. This rule is called Aufbau, German for “building up.”',
    'Helium’s second electron joins the first in 1s, spinning the other way (↑↓). That is the Pauli rule: no orbital holds more than two electrons, and the two must have opposite spins.',
    'Nitrogen’s three 2p electrons each take their own orbital, all spinning the same way. This is Hund’s rule. Like passengers on a bus, they take empty seats before sharing.',
    'Potassium’s 19th electron goes into 4s, not 3d. For these atoms 4s is lower in energy, which is why row 4 of the periodic table starts with K and Ca, two very reactive metals.',
    'The blocks of the periodic table match the sublevel being filled: s on the left, d in the middle, p on the right. So an element’s spot on the table tells you where its last electron goes. The yellow dot marks the element you built.'
  ]
},
pes: {
  hook: 'A gas cylinder has lost its label, and it holds a single element. Its PES spectrum shows three peaks, at 84.0, 4.68 and 2.08 MJ/mol, with heights 2, 2 and 6. Which gas is it?',
  answer: 'Heights 2, 2 and 6 mean 1s² 2s² 2p⁶: 10 electrons, so it is neon. The 84.0 MJ/mol peak is the 1s pair, held tightly by 10 protons. Fluorine’s 1s peak sits at only 67.2 MJ/mol, so the peak positions alone would also tell you which element it is.',
  uses: [
    'Computer chips: makers use X-ray photoelectron spectroscopy (XPS), this same method, to check which elements sit on a silicon wafer’s surface, only a few nanometers deep.',
    'Plastics and coatings: carbon, nitrogen and oxygen 1s peaks sit far apart (28.6, 39.6 and 52.6 MJ/mol), so one scan shows which elements a surface contains.',
    'Table salt: sodium’s lone 3s electron takes only about 0.50 MJ/mol to remove, under a hundredth of its 1s value. That is why sodium gives it up to become Na⁺.'
  ],
  takeaway: 'Each PES peak is one sublevel: its position shows how tightly those electrons are held, and its height shows how many there are. Inner electrons are held far more tightly than outer ones, and only the outer ones take part in reactions.',
  lede: 'Knock electrons out of atoms with X-rays and measure how hard each one was held. The pattern of peaks shows how an atom’s electrons are arranged and identifies the element.',
  tour: [
    null,
    'The photon gives all of its energy to one electron, like paying with a bill. Part pays to pull the electron free of the nucleus (the binding energy). The rest is the change: the electron’s kinetic energy.',
    null,
    'You know the photon’s energy and you measured the electron’s, so subtract: binding energy = hν − KE. Bill minus change is the price. The answer tells you how tightly that electron was held.',
    'Sodium is 1s² 2s² 2p⁶ 3s¹, and its spectrum has four peaks, one per sublevel. The 1s peak is far left: those electrons sit closest to the nucleus and need the most energy to remove.',
    'The 2p peak is three times taller than the 2s peak because 2p holds 6 electrons and 2s holds 2. The 3s peak is half the height of 2s: one electron, the one sodium gives away in table salt.'
  ]
},
ptable: {
  hook: 'Gallium is a metal that can melt in your hand. Set the table to body temperature, 37 °C. Which elements are liquid now, compared with room temperature, 25 °C?',
  hookSet: { color: 'state', temp: 37 },
  answer: 'At 25 °C only bromine and mercury are liquid. At 37 °C gallium (melts at 29.76 °C) and cesium (28.44 °C) join them, and so does francium, though its melting point is only an estimate. The same 11 elements are gases at both temperatures.',
  uses: [
    'Thermometers: mercury freezes at −38.8 °C, so thermometers for very cold places use colored alcohol instead.',
    'Balloons: helium and hydrogen are both lighter than air, but helium is a group 18 noble gas and does not burn. The Hindenburg was filled with hydrogen and burned in 1937.',
    'Strontium-90: strontium sits under calcium in group 2, so the body builds it into bones as if it were calcium. That is why strontium-90 from fallout is a health concern.'
  ],
  takeaway: 'Read the table by position. Elements in the same column behave alike, metals sit left of the staircase and nonmetals right, and the atomic number in each square is the proton count that names the element.',
  tour: [
    'Each row is a period. Moving left to right adds one proton at a time. Every element in period 3, from sodium to argon, has electrons in 3 energy levels.',
    'Each column is a group. Elements in a group have the same number of valence electrons, so they react alike, like members of one family. Group 17, the halogens, including the chlorine used in pools, all grab one electron.',
    'The staircase line splits metals (left) from nonmetals (right). Metalloids, like the silicon in computer chips, sit along it. Most elements are metals: shiny, and good at carrying electricity and heat.',
    'Click any square to see its card: atomic number (protons), symbol, name and molar mass. Iron’s symbol is Fe, from its Latin name, ferrum. The mass is an average over the element’s natural isotopes.',
    'At 25 °C, room temperature, most elements are solids, 11 are gases and only bromine and mercury are liquids. Slide the temperature, down to a cold winter night or up to an oven, and watch the states change.'
  ]
},
trends: {
  hook: 'Drop a small piece of sodium in water and it fizzes and skates around. Potassium bursts into flame. Both have one valence electron. Compare them in the sim: why does potassium give its electron up more easily?',
  hookSet: { view: 'atom', el: 'Na', cmp: 'down' },
  answer: 'Potassium’s outer electron is in a fourth shell, so the atom is bigger: radius 203 pm versus 166 pm for sodium. Both outer electrons feel a pull of about +1, because the inner electrons shield the rest, but potassium’s is farther away. It takes 419 kJ/mol to remove versus 496 kJ/mol for sodium, about 16% less.',
  uses: [
    'Chemical storerooms: cesium, near the bottom of group 1, loses its outer electron so easily (376 kJ/mol) that it is sealed in glass ampoules, away from air and water.',
    'Nonstick pans: Teflon’s carbon–fluorine bonds are among the strongest in chemistry. Fluorine, at the top right, has the highest electronegativity of any element, 3.98.',
    'Toothpaste: fluorine grabs electrons so hard that it is never found free in nature, only in compounds such as the sodium fluoride in toothpaste.'
  ],
  takeaway: 'Down a group, atoms get bigger and lose outer electrons more easily, so metals get more reactive going down. Across a period, atoms shrink and hold on tighter. Fluorine, top right, grabs electrons hardest; cesium, bottom left, gives them up most easily.',
  lede: 'See how atoms change size across and down the periodic table, then look inside to see why. The pull of the nucleus on the outer electrons explains which metals react hardest and which elements grab electrons.',
  tour: [
    'Each square is colored by atomic radius, the size of the atom. Dark is big, light is small. The biggest atoms are at the bottom left, the smallest at the top right. Even cesium, the biggest here, has a radius of only 244 pm, a quarter of a nanometer.',
    'The nucleus holds 11 protons. Two shells of inner (core) electrons surround it, and one valence electron, the one sodium gives away in table salt, sits alone in the third shell.',
    'The 10 inner electrons sit between the nucleus and the outer electron and cancel most of its pull. This is shielding. The outer electron feels about +1, not +11.',
    'Magnesium adds one proton and one electron in the same shell. The core is the same, so the outer electrons feel more pull (+2) and move in. The atom shrinks, even though it has more electrons.',
    'Potassium starts a new, fourth shell. The extra protons are shielded by the extra core electrons, so the pull (Zeff) stays about +1, but the outer electron is much farther away, like a magnet held farther from the fridge.',
    'A stronger pull on the outer electrons means more energy to remove one. Ionization energy and electronegativity (how hard an atom pulls on shared electrons) both rise across a period and fall down a group, the opposite of size.'
  ]
},
ionic: {
  hook: 'Before snowstorms, Colorado road crews spray magnesium chloride on highways, and your salt shaker holds sodium chloride. Build both and watch the electrons move. Why is one MgCl₂ while the other is just NaCl?',
  hookSet: { metal: 'Mg', anion: 'Cl' },
  answer: 'Sodium gives away 1 electron to become Na⁺, and chlorine takes 1 to become Cl⁻, so one of each balances: NaCl. Magnesium gives away 2 electrons to become Mg²⁺, but each chlorine takes only 1. It takes two Cl⁻ to cancel one Mg²⁺, so the formula is MgCl₂.',
  uses: [
    'Road deicers: MgCl₂ and CaCl₂ split into 3 ions per formula unit, NaCl into only 2. More dissolved particles lower the freezing point of water more.',
    'Sapphires and rubies: both are aluminum oxide. Al³⁺ and O²⁻ crisscross to Al₂O₃, the same compound that forms a thin protective skin on aluminum foil.',
    'Salt grains: under a magnifying glass, table salt grains are tiny cubes, because Na⁺ and Cl⁻ ions stack in a cubic lattice.'
  ],
  takeaway: 'Metals lose electrons and nonmetals gain them, and the ions combine so the charges add to zero. Find each ion’s charge from its group, then use the fewest ions that cancel: Na⁺ + Cl⁻ is NaCl, Mg²⁺ + 2 Cl⁻ is MgCl₂.',
  tour: [
    'Sodium is a metal with 1 valence (outer) electron. Chlorine is a nonmetal with 7. Each dot is a valence electron. Together these two make table salt.',
    'Sodium holds its one outer electron loosely, and chlorine pulls hard on electrons. So the electron moves from sodium to chlorine.',
    'Sodium now has 11 protons and 10 electrons: Na⁺. Chlorine has 17 protons and 18 electrons: Cl⁻, with a full set of 8 outer electrons (an octet). Notice the sizes: the cation shrinks and the anion grows.',
    'The + and − ions pull together, like opposite poles of two magnets. That electrostatic attraction is the ionic bond, and it is strong: salt has to reach 801 °C before it melts.',
    'Magnesium gives away 2 electrons, but each chlorine takes only 1. So one Mg needs two Cl: MgCl₂, the road deicer.',
    'Shortcut: write each ion’s charge number as the other ion’s subscript, then reduce. Mg²⁺ and Cl⁻ give Mg₁Cl₂ → MgCl₂. Ca²⁺ and O²⁻ give Ca₂O₂, which reduces to CaO, the lime used to make cement.',
    'In a real grain of salt, the ions pack into a lattice. Each Na⁺ is surrounded by Cl⁻ and each Cl⁻ by Na⁺. There are no separate NaCl molecules; the formula is just the ratio.'
  ]
},
naming: {
  hook: 'Rust is iron(III) oxide, but table salt is just sodium chloride, with no Roman numeral. Why does iron’s name need the (III), and what is the formula for rust?',
  hookSet: { types: 'tm' },
  answer: 'Iron can form Fe²⁺ or Fe³⁺, so its name must say which; sodium only ever forms Na⁺. Iron(III) means Fe³⁺, and oxide is O²⁻. Two Fe³⁺ (6+) balance three O²⁻ (6−), so rust is Fe₂O₃. Real rust also holds some water.',
  uses: [
    'Carbon monoxide vs carbon dioxide: one prefix apart. CO, from faulty furnaces and car exhaust, is the poison a home CO alarm watches for. CO₂ is what you breathe out.',
    'Antacids: calcium carbonate is one Ca²⁺ and one CO₃²⁻, so the formula is CaCO₃. The name on the label tells you exactly what is in the tablet.',
    'Car batteries: the acid inside is sulfuric acid, H₂SO₄. The -ic ending tells a chemist it comes from the sulfate ion, SO₄²⁻.'
  ],
  takeaway: 'First decide what kind of compound it is: metal plus nonmetal (ionic) or two nonmetals (molecular). Ionic names use the ion names, with a Roman numeral only for metals that have more than one charge. Molecular names count atoms with prefixes.',
  tour: [
    'Every name starts with one question: is the first part a metal, or the ammonium ion? If yes, the compound is ionic and is named from its ions, the way table salt is named from sodium and chloride. Here, Na is a metal.',
    'Sodium only forms Na⁺, so its name is just “sodium.” The anion Cl⁻ is one atom, so its ending changes to -ide: chloride. Together: sodium chloride, table salt.',
    'Iron can be Fe²⁺ or Fe³⁺, so the name says which. In Fe₂O₃, three O²⁻ make 6−. Two irons share 6+, so each is 3+: iron(III) oxide, the main part of rust.',
    'A group of atoms with one charge, like nitrate NO₃⁻ in fertilizer, keeps its name. More than one of them needs parentheses: Ca(NO₃)₂ is calcium nitrate.',
    'Going from a name to a formula, find each ion’s charge, then use enough of each ion that the charges cancel. Crisscross the charge numbers and reduce: Al³⁺ and O²⁻ give Al₂O₃, the compound in sapphires.',
    'No metal and no acid means a molecular compound. Prefixes count the atoms: N₂O₄, used in rocket engines, is dinitrogen tetroxide. Skip mono- on the first element, and drop a vowel before “oxide.”',
    'Acids are named in water. HCl(aq) has no oxygen, so it is hydro- + chlor + -ic acid: hydrochloric acid, the acid in your stomach. H₂SO₄(aq) comes from sulfate: -ate becomes -ic, so sulfuric acid. Sulfite would give sulfurous acid.'
  ]
}
});

/* c2.js */
BioLab.addPractical({
lewis: {
  hookSet: { mol: 'N2' },
  hook: 'Air is 78% nitrogen, N₂, yet you breathe it in and out unchanged, and plants cannot use it directly. Each N atom brings 5 valence electrons. How many bonds must the two atoms share so both end up with 8?',
  answer: 'N₂ has 10 valence electrons. One bond plus three lone pairs on each atom would need 14, so that fails. Three shared pairs (N≡N) plus one lone pair on each atom uses exactly 10 and gives each N 8. That triple bond is one of the strongest bonds known, so N₂ hardly reacts.',
  uses: [
    'Snack bags: chip bags are flushed with N₂ to push out oxygen. N₂ works because its triple bond makes it very unreactive, so it leaves the oils alone.',
    'Fertilizer: to make ammonia, NH₃, factories have to break the N≡N triple bond, which takes an iron catalyst at about 450 °C and 200 atm (the Haber process).',
    'Breathing: O₂ shares two pairs (a double bond) and N₂ shares three. Your body uses the O₂ from each breath and breathes the N₂ back out untouched.'
  ],
  takeaway: 'Count the valence electrons first. If you run out before every atom has 8, share more pairs as double or triple bonds. More shared pairs make a shorter, stronger bond that is harder to break.',
  tour: [
    'Every atom brings its valence electrons, the outer electrons it can share. Carbon brings 4 and each oxygen brings 6, so CO₂ has 4 + 6 + 6 = 16 electrons to place, no more and no less. The panel on the right keeps this budget.',
    'Carbon goes in the middle because it pulls on electrons less than oxygen does (it is the least electronegative). Each single bond is one shared pair, so the two bonds spend 4 of the 16 electrons.',
    'Give each oxygen three lone pairs, pairs it keeps to itself, so it has 8. That spends all 16 electrons, but look at carbon: its ring is not green. Carbon has only 4, and the budget is empty.',
    'The fix is to share more. Move one lone pair from each oxygen into its bond. Each C=O double bond now counts for both atoms, so every atom has 8 using the same 16 electrons.',
    null
  ]
},
vsepr: {
  hookSet: { mode: 'real', mol: 'H2O' },
  hook: 'Water, H₂O, and carbon dioxide, CO₂, both have one central atom holding two others. One molecule is straight and the other is bent, and that difference is why water dissolves salt and CO₂ does not. Which one is bent, and at what angle?',
  answer: 'Water is bent at 104.5°. Its oxygen has 2 bonds plus 2 lone pairs, 4 electron groups that spread out like a tetrahedron, so the two H atoms end up at an angle. CO₂’s carbon has only 2 groups (its two double bonds) and no lone pairs, so they point opposite ways: 180°, a straight line.',
  uses: [
    'Microwave ovens: bent water molecules have a positive end and a negative end, so the oven’s changing electric field twists them back and forth, and that motion heats your food.',
    'Ice: bent water molecules hydrogen-bond into an open, six-sided pattern, so ice is about 9% less dense than liquid water and floats on lakes instead of sinking.',
    'Diamond: every carbon bonds to four others at 109.5°, the tetrahedral angle, building a rigid 3D frame. That is why diamond is the hardest natural material.'
  ],
  takeaway: 'Count the electron groups on the central atom, lone pairs included: 2 make a line, 3 a flat triangle, 4 a tetrahedron. Lone pairs do not show in the shape, but they push the atoms closer together and bend the molecule.',
  tour: [
    'Each stick is a bond to an outer atom. Chemists call each bond an electron domain: a region of negative charge around the central atom, and negative charges push each other away. Drag the molecule, or use the Turn buttons, to look at it from every side.',
    'Four domains do not lie flat at 90°. They point to the corners of a tetrahedron, 109.5° apart, like a camera tripod with a fourth leg pointing straight up. That puts them as far apart as they can get in 3D.',
    'Now one domain is a lone pair (the yellow lobe), a pair of electrons with no atom on the end. There are still 4 domains, but you see only 3 atoms: a <b>trigonal pyramid</b>, like ammonia, NH₃.',
    'With 2 lone pairs and 2 bonds, the atoms form a <b>bent</b> shape, like H₂O. The lone pairs take up more room than bonds, so they squeeze the bond angle down to 104.5°. That bend gives water a positive end and a negative end.',
    null
  ]
},
polarity: {
  hookSet: { mode: 'stream', liquid: 'water', rod: 'neg', dist: 3 },
  hook: 'Rub a balloon on your hair and hold it 3 cm from a thin stream of tap water: the stream bends. Would a stream of hexane, a gasoline ingredient, bend the same way? And does it matter whether the charge is + or −?',
  answer: 'With the rod 3 cm away, the water stream bends about 1.5 cm toward it, and it bends toward a + rod just as well, because water molecules simply turn their opposite end to face it. Hexane bends only about 0.1 cm. Its molecules are nonpolar, so there is no charged end to pull on.',
  uses: [
    'Dish soap: grease is nonpolar, so water alone slides past it. Soap molecules have a polar end that holds on to water and a nonpolar tail that grabs the grease.',
    'Salad dressing: oil is nonpolar and vinegar is mostly polar water, so they separate into layers. Shaking mixes them only for a minute or two.',
    'Car wax: wax is nonpolar, so rainwater cannot spread out on it. The water beads up and rolls off the paint.'
  ],
  takeaway: 'Polar bonds make a polar molecule only when the shape is lopsided, like bent water. Polar mixes with polar and nonpolar with nonpolar, which is why water dissolves salt and sugar but beads up on oil and wax.',
  tour: [
    'Two hydrogen atoms pull on the shared pair (yellow dots) equally, like an even tug-of-war. The electron cloud stays centered, so the bond is nonpolar: neither end is charged.',
    'Chlorine pulls harder on electrons than hydrogen does: its electronegativity is 3.16, hydrogen’s is 2.20. The shared pair shifts toward Cl, so Cl gets a partial negative charge (δ−) and H a partial positive charge (δ+).',
    null,
    'Each O–H bond in water has a dipole arrow pointing toward O, the end that hogs the electrons. Because water is bent, the two arrows add up to a net dipole (purple), like two people pulling a cart at an angle. Water is polar.',
    'CO₂ has two very polar C=O bonds, but they point in exactly opposite directions, like two equal teams in a tug-of-war. They cancel, so CO₂ is nonpolar. Shape decides.',
    null,
    'A charged rod pulls a thin stream of water toward it, whether the rod is + or −: the molecules turn to face it. A balloon rubbed on your hair does the same thing to a faucet stream. Nonpolar hexane barely moves.'
  ]
},
bondtypes: {
  hook: 'A jar in the lab has lost its label. The white crystals inside are either table salt or table sugar, and you never taste lab chemicals. How can a 9 V conductivity tester tell you which one it is?',
  answer: 'Dry crystals of both leave the bulb dark, so dissolve some in water and test again. Salt splits into Na⁺ and Cl⁻ ions that move and carry charge, so the bulb lights (about 160 mA flows). Sugar molecules stay whole, so the bulb stays dark. Heating also works: sugar melts and browns near 186 °C, while salt stays solid until 801 °C.',
  uses: [
    'Bath water and appliances: pure water barely conducts, but tap and bath water carry dissolved ions, which is why a hair dryer dropped in the tub is dangerous.',
    'Road salt: winter salt on Colorado roads makes salty slush that conducts, and that speeds up rust on car bodies. Winter car washes rinse it off.',
    'Phone chargers: the wires inside are copper, whose sea of electrons carries current as a solid, wrapped in plastic, a molecular solid that does not conduct.'
  ],
  takeaway: 'Electricity needs charges that can move. Metals conduct as solids. Ionic compounds conduct only when melted or dissolved, because then their ions can move. Most molecular substances, like sugar and wax, stay as whole molecules and do not conduct.',
  tour: [
    'This is a 9 V battery, a bulb and two metal probes: a simple electricity detector. If the sample lets charge flow from one probe to the other, the circuit is complete and the bulb lights.',
    'NaCl is table salt, made of Na⁺ and Cl⁻ ions, so it is full of charged particles. But in the solid they are locked in a lattice, a fixed grid, and cannot move. The bulb stays dark.',
    'Heat NaCl past 801 °C, far hotter than any kitchen oven. The lattice breaks apart, the ions slide past each other, and moving ions carry charge. The bulb lights.',
    'In water the ions separate (dissociate) and move freely, so salt water conducts too. Compounds like this are electrolytes, the same word you see on a sports drink label.',
    null,
    'In a metal, the atoms share their valence electrons in a sea that flows freely between the metal ions. That is why copper conducts as a solid, and why wires are made of it.',
    'Quartz sand is a network of Si–O covalent bonds, one giant molecule. Even at 1500 °C it does not melt: you would have to break covalent bonds, not just pull particles apart.'
  ]
},
states: {
  hook: 'A pot holds 50 g of ice. On the stove it sits at 0 °C while the ice melts, and later at 100 °C while the water boils away. Which flat stretch takes more heat, and about how many times more?',
  answer: 'Melting 50 g of ice takes 16.7 kJ (334 J per gram). Boiling the same 50 g away takes 113 kJ (2,260 J per gram), almost 7 times as much. Melting only loosens the particles so they can slide; boiling pulls them all the way apart into a gas.',
  uses: [
    'Coolers: a cooler with ice stays near 0 °C until the ice is gone, because every gram that melts soaks up 334 J from your drinks.',
    'Steam burns: steam at 100 °C burns worse than water at 100 °C, because each gram that condenses on skin releases 2,260 J before it even starts to cool.',
    'Sweating: each gram of sweat that evaporates from your skin carries away more than 2,000 J. That is how your body sheds heat on a long run.'
  ],
  takeaway: 'While something melts or boils, its temperature holds steady and the heat goes into pulling particles apart. Boiling water away takes about 7 times the heat needed to melt the same mass of ice.',
  tour: [
    'Each ball is one particle of ice. In a solid the particles sit in a regular pattern and only vibrate in place, like people in assigned seats who fidget. Attractions hold them there.',
    null,
    'At 0 °C the ice melts. The temperature stops rising even though heat keeps flowing in, which is why ice water stays at 0 °C until the ice is gone. The energy breaks particles out of the lattice.',
    null,
    'At 100 °C the water boils. Particles escape the liquid and fly off as a gas. This plateau is the longest because pulling particles fully apart takes the most energy. It is why a pot takes so long to boil dry.',
    null,
    'Turn the heater negative, like a freezer. Gas condenses and liquid freezes, giving back the same energy on the same plateaus. That released heat is why steam can burn you so badly.'
  ]
},
phasediagram: {
  hookSet: { lpw: -0.08 },
  hook: 'Pasta boxes say to bring the water to a boil, and at sea level that means 100 °C. In Denver the air pressure is only about 0.83 atm. At what temperature does water boil there, and why does the pasta take longer?',
  answer: 'Follow the 0.83 atm line to the right: water reaches the boiling line at about 95 °C, 5 °C cooler than at sea level. Boiling water in Denver is simply not as hot, so food cooks more slowly. A pressure cooker at 2 atm does the opposite and pushes the boiling point up to about 121 °C.',
  uses: [
    'Pikes Peak: at the 4,302 m summit the air pressure is about 0.59 atm, so water boils near 86 °C. Hikers’ coffee and noodles never get very hot.',
    'Dry ice: at 1 atm, solid CO₂ skips the liquid and turns straight to gas at −78.5 °C, so it keeps food frozen in shipping without leaving a puddle.',
    'Freeze-dried food: backpacking meals are frozen, then put under very low pressure, below water’s triple point, so the ice turns straight to vapor and leaves the food dry.'
  ],
  takeaway: 'Pressure moves the boiling point: less pressure, lower boiling point. Water in Denver boils near 95 °C, and even lower on a high peak. Raise the pressure, as a pressure cooker does, and water stays liquid well above 100 °C.',
  tour: [
    'Read this like a map. Temperature runs left to right and pressure runs bottom to top (each grid step is 10 times more pressure). Each region of the map is one phase: solid, liquid or gas.',
    'The red point is 25 °C and 1 atm, a normal room at sea level. Water is a liquid there, so the particle window shows molecules touching and flowing.',
    'Follow the dashed 1 atm line to the right, like heating a pot at sea level. The point crosses the boiling line at 100 °C, the normal boiling point, and the liquid turns into gas.',
    null,
    'All three lines meet at the triple point, 0.01 °C and 0.006 atm for water, close to the air pressure on Mars. Below that pressure, liquid water cannot exist: ice turns straight into vapor.',
    'CO₂’s triple point is at 5.1 atm, above room pressure. So at 1 atm, solid CO₂ (dry ice) never melts into a liquid. It sublimes, turning straight into gas, at −78.5 °C.'
  ]
},
imf: {
  hookSet: { mode: 'race', a: 'H2O', b: 'C2H5OH', temp: 25 },
  hook: 'You pour 1 mL of water and 1 mL of ethanol, the alcohol in most hand sanitizers, into two small dishes at 25 °C. Both liquids form hydrogen bonds. Which dish is dry first, and about how many times faster?',
  answer: 'Ethanol. In the model its dish is dry in about 12 minutes, while the water takes about an hour, roughly 5 times longer. Water’s small molecules are held more tightly by hydrogen bonds, so fewer of them break free each second. The same forces explain the boiling points: water 100 °C, ethanol 78.4 °C.',
  uses: [
    'Hand sanitizer: it feels cold on your skin because ethanol evaporates fast, and each molecule that escapes carries a little heat away with it.',
    'Grill tanks: propane has only weak London forces and boils at −42 °C, so it turns to gas the moment you open the valve, even on a winter day.',
    'Water: methane has almost the same mass but boils at −161.5 °C. Without hydrogen bonds, water would boil far below 0 °C and Earth would have no liquid oceans.'
  ],
  takeaway: 'Stronger attractions between molecules mean a higher boiling point and slower evaporation. Hydrogen bonding (H attached to O, N or F) is the strongest of the three forces. Small nonpolar molecules with only London forces are usually gases.',
  tour: [
    'Inside each molecule, atoms are held by covalent bonds. Between molecules there are much weaker attractions, intermolecular forces, a kind of stickiness between neighbors. They decide whether a substance is a gas, a liquid or a solid at room temperature.',
    null,
    null,
    'Water boils at 100 °C; methane, the natural gas burned in a stove, boils at −161.5 °C. Boiling separates the molecules from each other, not the atoms inside them, so stronger forces mean a higher boiling point.',
    'Put 1.00 mL of water and of ethanol (the alcohol in hand sanitizer) in two dishes at 25 °C. Ethanol’s molecules escape faster, because water’s hydrogen bonds hold its small molecules more tightly.'
  ]
},
balance: {
  hookSet: { eq: 'propane' },
  hook: 'A gas grill burns propane, C₃H₈, with oxygen from the air to make carbon dioxide and water. For each propane molecule, how many O₂ molecules does the flame need, and how many CO₂ molecules come out?',
  answer: 'The balanced equation is C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. The 3 carbons become 3 CO₂ and the 8 hydrogens become 4 H₂O. Those products hold 10 oxygen atoms, which takes 5 O₂. Each propane molecule needs five oxygen molecules, which is why a grill needs open vents.',
  uses: [
    'Gasoline: a gallon weighs about 2.8 kg, but burning it makes about 8.9 kg of CO₂. The extra mass is oxygen from the air, and the balanced equation accounts for it.',
    'Losing weight: when your body burns fat, about 84% of the fat’s mass leaves as CO₂ that you breathe out. Balanced equations track where every atom goes.',
    'Furnaces: natural gas, CH₄, needs 2 O₂ per molecule. If a furnace gets too little air, some carbon leaves as poisonous CO instead of CO₂, which is why homes have CO detectors.'
  ],
  takeaway: 'Atoms are never created or destroyed, so balance an equation by changing coefficients, never subscripts. Start with an element that appears in only one compound on each side, and leave elements that appear alone, like O₂, for last.',
  tour: [
    'An equation is a recipe: reactants on the left turn into products on the right. Here hydrogen gas and oxygen gas react to make water, the same reaction that runs a hydrogen fuel cell.',
    null,
    'Each little scale weighs one element: atoms on the left pan, atoms on the right pan. Hydrogen is level (2 and 2). Oxygen tips: 2 on the left, only 1 on the right, as if an oxygen atom vanished. Atoms cannot vanish, so this is not balanced yet.',
    null,
    null,
    'Changing H₂O to H₂O₂ would also fix the oxygen count, but H₂O₂ is hydrogen peroxide, the disinfectant in the brown drugstore bottle. It is a different substance, so only coefficients may change.'
  ]
},
rxntypes: {
  hookSet: { rxn: 'h2o2' },
  hook: 'At station 2 you add a pinch of black MnO₂ to 20 mL of drugstore 3% hydrogen peroxide. It foams, the flask warms, and a glowing splint held above it bursts into flame. What gas formed, and which of the five reaction types is this?',
  answer: 'The gas is oxygen: a glowing splint relights only in O₂. The balanced equation is 2H₂O₂ → 2H₂O + O₂. One compound breaks into two simpler substances, so it is decomposition. MnO₂ is a catalyst: it speeds the reaction up but is not used up, so it does not appear in the equation.',
  uses: [
    'Hydrogen peroxide bottles are brown because light speeds up its decomposition into water and oxygen. An old, often-opened bottle slowly turns into plain water.',
    'Antacid tablets: calcium carbonate reacts with stomach acid, HCl, in a double replacement that makes CaCl₂, water and CO₂ gas. That gas is why antacids can make you burp.',
    'Fireworks: the brilliant white sparks come from burning magnesium or aluminum metal. 2Mg + O₂ → 2MgO is a synthesis: two substances join into one.'
  ],
  takeaway: 'Look for signs of new substances: a gas, a new solid, a color change, heat or light. Then read the pattern: one thing splitting is decomposition, two joining is synthesis, an element swapping in is single replacement, fuel burning in O₂ is combustion.',
  tour: [
    'Station 4 is the RJ aluminum and copper(II) chloride lab: a ball of ordinary aluminum foil dropped into blue CuCl₂ solution.',
    null,
    'A color change, a gas, a new solid, a temperature change or light all suggest new substances formed. Melting ice is not on the list: it is still water. Here three signs appear: color, solid and temperature.',
    null,
    null,
    'An element (Al) pushes another element (Cu) out of a compound and takes its place: A + BC → AC + B. That is single replacement.'
  ]
},
activity: {
  hookSet: { metal: 'Zn', sol: 'H' },
  hook: 'A US penny made after 1982 is 97.5% zinc inside a thin copper skin. If you file through the copper and drop the penny in hydrochloric acid, which metal fizzes away and which one survives?',
  answer: 'The zinc core fizzes away and the copper skin survives. Zinc is above hydrogen in the activity series, so it gives electrons to H⁺ and makes H₂ gas: Zn + 2HCl → ZnCl₂ + H₂. Copper is below hydrogen, so copper in HCl shows no reaction. You end up with a hollow copper shell.',
  uses: [
    'Galvanized nails and fences: steel is coated with zinc, which is more active than iron. The zinc corrodes first and protects the steel underneath for years.',
    'Water heaters: the steel tank has a magnesium or aluminum rod inside. The more active metal corrodes instead of the tank, and plumbers replace the rod when it is used up.',
    'Jewelry: gold and silver sit below hydrogen, so acids like vinegar and lemon juice do not dissolve them. That is part of why they have lasted as jewelry and coins.'
  ],
  takeaway: 'A metal gives its electrons to the ions of any metal below it in the activity series. Metals above hydrogen, like magnesium and zinc, dissolve in acid and fizz; copper, silver and gold do not.',
  tour: [
    'Each row is one metal. Each column is one solution: metal ions dissolved in water, plus hydrochloric acid on the right. Every well is one small test, like a muffin tin full of experiments.',
    null,
    'Each copper atom hands 2 electrons (yellow) to 2 silver ions. The silver ions become silver atoms on the surface, and the copper atom leaves as a blue Cu²⁺ ion. Copper is the more active metal, so it is the one that gives electrons away.',
    null,
    null,
    null
  ]
},
precip: {
  hookSet: { a: 'CuSO4' },
  hook: 'A circuit-board shop’s rinse water is blue with dissolved copper(II) sulfate, and the copper has to come out before the water goes down the drain. Which shelf solution turns the copper into a solid you can filter out: sodium chloride or sodium hydroxide?',
  answer: 'Sodium hydroxide. Cu²⁺ and OH⁻ lock together as light blue Cu(OH)₂, a solid that settles and can be filtered: Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s). Sodium chloride does nothing, because copper chloride is soluble. Na⁺ and SO₄²⁻ are spectator ions and stay dissolved either way.',
  uses: [
    'Kidney stones: the most common kind is calcium oxalate, a precipitate that forms when Ca²⁺ and oxalate ions in urine get concentrated enough to come out as a solid.',
    'Kettles and showerheads: hard water carries Ca²⁺ ions, and heating it makes white CaCO₃ scale that builds up as a crust.',
    'X-rays: barium sulfate is so insoluble that patients can drink a slurry of it for a stomach X-ray, even though dissolved Ba²⁺ ions are toxic.'
  ],
  takeaway: 'When two ionic solutions mix, check each new cation and anion pairing against the solubility rules. An insoluble pairing drops out as a solid; ions that stay dissolved are spectators. Sodium salts and nitrates always stay dissolved.',
  tour: [
    'The beaker holds silver nitrate, AgNO₃(aq). The test tube holds sodium chloride, NaCl(aq), which is just salt water. Both are clear and colorless, so you cannot see what is dissolved.',
    null,
    null,
    'Ag⁺ and Cl⁻ attract so strongly that they lock into a solid lattice: white AgCl. In the beaker the mixture turns cloudy, like a drop of milk in water. A solid that forms this way is a precipitate.',
    'Na⁺ and NO₃⁻ are in solution before and after, like fans in the stands who never play. They are spectator ions. Fading them leaves only the ions that react.',
    null
  ]
},
mole: {
  hookSet: { mode: 'map', sub: 'Au', from: 'g', to: 'n', amt: 31.1 },
  hook: 'A one-ounce gold coin is 31.1 g of gold. How many gold atoms is that, and how many grams of water would hold the same number of molecules?',
  answer: '31.1 g ÷ 196.97 g/mol = 0.158 mol of gold, which is 9.51 × 10²² atoms. The same number of water molecules is 0.158 mol × 18.02 g/mol = 2.84 g of water, about half a teaspoon. Each gold atom is about 11 times heavier than a water molecule.',
  uses: [
    'Water bottle: a 500 mL bottle holds about 500 g of water, which is 27.8 mol, or 1.67 × 10²⁵ molecules.',
    'Diamonds: a 1 carat diamond is 0.200 g of carbon, 0.0167 mol, which is about 1.00 × 10²² carbon atoms.',
    'Lab prep: to get exactly 1 mol of NaCl, you do not count 6.022 × 10²³ formula units. You weigh out 58.44 g on a balance.'
  ],
  takeaway: 'To count particles you cannot see, weigh them: grams ÷ molar mass = moles, and 1 mol is 6.022 × 10²³ particles. Equal moles of anything hold the same number of particles; equal masses usually do not.',
  tour: [
    'A mole is a counting unit, like a dozen, only far bigger: 6.022 × 10²³ particles. Every conversion on the road map goes through moles in the middle, like a train station every route passes through.',
    'To go from grams to moles, divide by the molar mass, the mass of one mole. 36.0 g of water (about 2½ tablespoons) ÷ 18.02 g/mol = 2.00 mol.',
    null,
    null,
    null,
    'A mole of water molecules is only 18 mL, about one big gulp. A mole of pennies stacked up would cross the Milky Way. The number is huge because molecules are so tiny.'
  ]
},
percentcomp: {
  hookSet: { mode: 'pie', cmp: 'NaCl', smass: 10 },
  hook: 'Nutrition labels list sodium, not salt. If a recipe uses 10 g of table salt, NaCl, how many grams of sodium is that? Would 10 g of baking soda, NaHCO₃, add more sodium or less?',
  answer: 'Sodium is 39.3% of table salt’s mass, so 10 g of NaCl holds 3.93 g of sodium. Baking soda is only 27.4% sodium, so 10 g of it holds 2.74 g, less. The rest of baking soda’s formula, HCO₃, is heavier (61.0 u) than chlorine (35.45 u), so sodium gets a smaller share.',
  uses: [
    'Nutrition labels: the Daily Value for sodium is 2,300 mg, about the sodium in one teaspoon of table salt, because salt is only 39% sodium by mass.',
    'Fertilizer bags: the first number on the label is percent nitrogen by mass. Ammonium nitrate, NH₄NO₃, is 35.0% N, so it is sold as 34-0-0.',
    'Iron ore: hematite, Fe₂O₃, is 69.9% iron by mass. Mining companies grade ore by its percent iron to decide whether it is worth digging up.'
  ],
  takeaway: 'Percent by mass = atoms × atomic mass ÷ formula mass × 100. It is the same for a pinch or a truckload. Heavy atoms take a bigger share than their count suggests: water is 2/3 hydrogen by atoms but 88.8% oxygen by mass.',
  tour: [
    'Water is H₂O. Two of its three atoms are hydrogen, but hydrogen is light (1.008 u) and oxygen is heavy (16.00 u), like two ping-pong balls beside a golf ball. So oxygen supplies 88.8% of the mass.',
    null,
    'Heat with the lid slightly open so air can get in. Mg combines with O₂ from the air: 2Mg + O₂ → 2MgO. The circle shows O atoms joining the Mg.',
    'After heating, cool and weigh. The crucible is heavier, even though something burned: the extra mass is oxygen captured from the air. Moles O ÷ moles Mg gives the formula.',
    null,
    null
  ]
},
hydrate: {
  hookSet: { hyd: 'mg' },
  hook: 'Epsom salt from the drugstore is MgSO₄·7H₂O: water is built right into the crystals. If you heat 2.00 g of it until the mass stops changing, how much of it leaves as water?',
  answer: 'About half. One mole of MgSO₄·7H₂O is 246.47 g, and its seven waters are 126.11 g of that, 51.2%. So 2.00 g loses about 1.02 g of water and leaves about 0.98 g of anhydrous MgSO₄. Blue copper(II) sulfate pentahydrate, by comparison, is only 36.1% water.',
  uses: [
    'Drywall: the gypsum in drywall is CaSO₄·2H₂O, about 21% water by mass. In a fire that water has to boil off first, which slows the fire down.',
    'Humidity cards: cobalt(II) chloride is blue when dry and pink as a hydrate, so the cards packed with electronics change color when the air gets damp.',
    'Closet moisture absorbers: calcium chloride pulls water from the air to form a hydrate, then keeps absorbing until it dissolves into a puddle of brine.'
  ],
  takeaway: 'Some crystals are partly water by mass. Heat to constant mass, two weighings in a row that agree, before you trust the result. Stopping early leaves water behind and makes the percent water come out too low.',
  tour: [
    'A hydrate is an ionic solid with water molecules built into its crystal, not just wet on the surface. Copper(II) sulfate pentahydrate, CuSO₄·5H₂O, has five water molecules for every Cu²⁺ and SO₄²⁻. The circle shows the particles.',
    'First weigh the clean, dry crucible, a small porcelain cup that can sit in a flame. Every later reading includes it, so you will subtract it, the way you zero out a bowl on a kitchen scale.',
    null,
    null,
    null,
    'Heat, cool and weigh again. When two weighings in a row agree within 0.005 g, all the water is gone. Chemists call this constant mass. The graph below shows the mass leveling off.',
    null
  ]
},
airbag: {
  hookSet: { bag: 'gallon', soda: 12, vin: 100 },
  hook: 'You have a whole box of baking soda but only 100 mL of vinegar, and you want to fill a gallon zip bag (3.785 L) with CO₂ in an RJ classroom. Can you fill it? If not, how much vinegar do you need?',
  answer: 'No. 100 mL of vinegar holds only 0.0837 mol of acetic acid, so it can make only 0.0837 mol of CO₂, about 2.44 L at RJ. Counting the liquid, the bag ends up about 67% full and floppy, however much baking soda you add. You need about 149 mL of vinegar and 10.5 g of baking soda.',
  uses: [
    'Pancakes: buttermilk’s acid reacts with baking soda to make CO₂ bubbles. Too much baking soda for the acid leaves some unreacted, and the pancakes taste soapy.',
    'Car air bags: an inflator holds a measured charge of propellant. Older designs used sodium azide, which breaks down into sodium and enough N₂ to fill the bag exactly.',
    'Bike tire inflators: a 16 g CO₂ cartridge holds 0.36 mol of gas, enough to fill about 10.6 L at room temperature and Denver’s pressure, squeezed into one small tire.'
  ],
  takeaway: 'Work backward from the gas you need: liters to moles to grams. Then check every reactant, because the one that runs out first sets how much gas you get, and extra of the other one adds nothing.',
  tour: [
    'Your goal: fill this quart bag (0.946 L, the size of a quart of milk) with carbon dioxide, exactly. Too little gas and it sags; too much and it bursts.',
    null,
    'In our classroom (22 °C, 0.83 atm), one mole of gas fills about 29.2 L, about the size of a school backpack. So the bag needs about 0.946 ÷ 29.2 = 0.031 mol of CO₂.',
    '0.031 mol × 84.01 g/mol = about 2.6 g of NaHCO₃, a little over half a teaspoon of baking soda.',
    'Vinegar is 5% acetic acid; the rest is water. Each mL holds about 0.00084 mol, so 0.031 mol needs about 37 mL, about 2½ tablespoons.',
    null,
    null
  ]
},
gaslaws: {
  hook: 'A sealed steel can of air reads 1.00 atm on a 0 °C winter morning. That afternoon it sits on the dashboard of a parked car and warms to 70 °C. What is the pressure inside the can now?',
  answer: 'Change to kelvin first: 0 °C is 273 K and 70 °C is 343 K. In a rigid can, pressure follows kelvin temperature, so P = 1.00 atm × 343 ÷ 273 = 1.26 atm, a 26% rise. It does not go up 70-fold: in kelvin the temperature rose by only about a quarter.',
  uses: [
    'Car tires: tire pressure drops about 1 psi for every 10 °F the air cools, so tires that were fine in fall can read low on the first cold Denver morning.',
    'Hot-air balloons: heating the air inside from 293 K to about 373 K makes it take up about 27% more room, so the envelope holds less air, gets lighter and rises.',
    'Chip bags: a bag sealed at a sea-level factory puffs up in Denver. The outside pressure drops to 0.83 atm, so the trapped air spreads into about 20% more space.'
  ],
  takeaway: 'Gas pressure and volume follow kelvin temperature, not °C. Squeeze a gas into half the space and its pressure doubles. Heat it from 273 K to 546 K in a rigid container and its pressure doubles too.',
  tour: [
    'Each dot is a gas molecule (really, each one stands for 1/100 of a mole). They fly in straight lines until they hit a wall. The box holds 1 mol of gas at 0 °C in 22.4 L, about the size of a backpack.',
    null,
    'Push the piston down to half the volume, like pushing a bike pump with your thumb over the end. The same molecules have half the room, so they hit the walls twice as often. The pressure doubles.',
    'Lock the volume and turn up the heater, like a sealed can sitting in a hot car. Hotter molecules move faster, so they hit the walls harder and more often. The pressure rises.',
    'Now the piston floats, so the pressure stays the same, like the air inside a balloon. Heat the gas and it pushes the piston up: hotter gas takes up more space.',
    null,
    null
  ]
},
kmt: {
  hook: 'A helium party balloon goes soft by the next day, while one blown up with air lasts much longer. At room temperature, 300 K, how fast do helium atoms move compared with the nitrogen molecules that make up most of air?',
  answer: 'At 300 K nitrogen molecules average about 476 m/s, over 1,000 mph. Helium atoms average about 1,260 m/s, about 2.6 times faster. Both gases have the same average kinetic energy at the same temperature, so the much lighter helium atoms must move faster. Fast, tiny atoms find their way through the balloon’s rubber sooner.',
  uses: [
    'Helium voice: sound travels about 2.9 times faster in helium than in air because the light atoms move faster. That shifts the sound of your voice higher.',
    'Smells: perfume molecules move hundreds of meters per second, yet a scent takes a while to cross a room, because each molecule collides with air molecules billions of times per second.',
    'Nuclear fuel: uranium is enriched by letting uranium hexafluoride gas leak through barriers. Molecules with the lighter U-235 move only about 0.4% faster, so the step is repeated many times.'
  ],
  takeaway: 'At the same temperature every gas has the same average kinetic energy, so lighter molecules move faster. Speed goes as 1/√mass: helium (4 g/mol) moves about 2.6 times faster than nitrogen (28 g/mol). Heat any gas and its molecules speed up.',
  tour: [
    null,
    'At any moment some molecules are slow and some are fast, like cars on a highway. The graph on the right counts how many have each speed. Most are near the middle, with a long tail of fast ones.',
    null,
    'Raise the temperature to 900 K, hotter than a pizza oven. The molecules speed up and the curve stretches toward higher speeds. Temperature measures the average kinetic energy, the energy of motion, of the molecules.',
    null,
    null
  ]
},
gasstoich: {
  hook: 'Your eudiometer holds 50 mL of gas. At RJ the barometer reads 630 mmHg and the water is 22 °C. How much magnesium ribbon can you react before the hydrogen overflows the tube, and could you use more at sea level?',
  answer: 'At RJ each gram of Mg makes about 1.24 L of dry H₂, so about 0.040 g of ribbon (about 4 cm) fills the tube; 0.041 g overflows. At sea level (760 mmHg) the same gas is squeezed smaller, so you could use about 0.048 g. Lower air pressure means the same moles of gas take up more room.',
  uses: [
    'High-altitude baking: Denver recipes often cut the baking powder or soda, because at 0.83 atm the same CO₂ puffs up bigger and can make a cake rise and then collapse.',
    'Weather balloons: as the balloon rises, the outside pressure falls and the gas inside expands until the balloon is many times its launch size and bursts.',
    'Lighters: 1 g of butane (0.0172 mol) released at RJ’s pressure and room temperature makes about 0.5 L of gas, which is why a small lighter lasts so long.'
  ],
  takeaway: 'One mole of any gas fills the same space at the same temperature and pressure: 22.4 L at 0 °C and 1 atm, about 29 L in a 22 °C Denver-area room. Lower pressure or higher temperature means more space per mole.',
  tour: [
    'The eudiometer (a long gas-measuring tube) was filled with hydrochloric acid and then water, flipped upside down into a tall tank of water, and stoppered with a coil of magnesium ribbon in a copper cage. Any gas made will collect in the tube.',
    null,
    null,
    'The gas in the tube is mostly hydrogen, with a little water vapor from the water below it, the same way the air just above a lake is humid.',
    null,
    '0.030 g of Mg (about 3 cm of ribbon) is 0.00123 mol, so the tube holds 0.00123 mol of H₂. Divide the volume by the moles: about 30 L/mol here, not 22.4 L, because RJ’s air pressure is low and the room is warmer than 0 °C.',
    null
  ]
}
});

/* c3.js */
BioLab.addPractical({
dissolve: {
  hook: 'You stir 2 tablespoons of sugar (about 25 g) into a half cup (about 100 g) of iced tea at 5 °C, and some sits on the bottom. Is the tea full of sugar, or is the sugar just slow? Would salt behave the same way?',
  hookSet: { solute: 'sugar', mass: 25, T: 5 },
  answer: 'The sugar is just slow. At 5 °C, 100 g of water can hold about 184 g of sugar, so 25 g is far below the limit. Cold water dissolves it slowly, and stirring makes it about 4 times faster. Salt is different: the same water holds only about 36 g of salt, and even at 100 °C only about 40 g.',
  uses: [
    'Sports drinks: “electrolytes” on the label means dissolved salts like Na⁺ and K⁺, the same ions that light the bulb here.',
    'Pickling brine: about 36 g of salt saturates 100 g of water at room temperature, and heating barely helps, so extra salt just sits on the bottom.',
    'Washing a greasy pan: water alone cannot dissolve oil. Soap molecules have one end that mixes with water and one that mixes with oil, so they carry the grease away.'
  ],
  takeaway: 'Stirring and heat make things dissolve faster, but only temperature changes how much can dissolve, and for salt even that barely matters. Salt splits into ions that carry current, sugar stays whole, and oil does not dissolve in water.',
  tour: [
    'The circle zooms about 10 million times into the beaker. At the bottom is a crystal of NaCl, table salt: Na⁺ (purple) and Cl⁻ (green) ions locked in a repeating pattern. Red-and-white V shapes are water molecules.',
    'The oxygen end of a water molecule is slightly negative and the hydrogen ends are slightly positive. That is what polar means: one molecule with a + end and a − end. Those ends let water tug on charged ions.',
    null,
    'Dissolved ions are free to move, so the solution conducts electricity and the bulb lights. Dissolved NaCl is a strong electrolyte, a substance that splits completely into ions. These are the electrolytes a sports drink label talks about.',
    'Add 50 g. At 25 °C, 100 g of water (about half a cup) holds only about 36 g of NaCl. The rest stays on the bottom no matter how long you stir. The water is saturated: it holds all it can.',
    'Sugar dissolves too, but its molecules leave the crystal whole. No ions form, so the bulb stays off: sugar is a nonelectrolyte. Sugar water tastes sweet, but it cannot carry current the way salt water does.',
    'Oil is nonpolar: it has no + or − ends. Water molecules stick to each other instead, so the oil is pushed out into its own layer, like the oil on top of salad dressing. Polar dissolves polar; nonpolar dissolves nonpolar.'
  ]
},
molarity: {
  hook: 'Hospital IV saline is about 0.15 M salt water. How many moles of NaCl do you need to make 0.500 L of it? And if someone tops the beaker up to 1.000 L with plain water, what is the concentration then?',
  hookSet: { mode: 'beaker', solute: 'NaCl', n: 0.075, V: 0.5 },
  answer: '0.15 mol/L × 0.500 L = 0.075 mol of NaCl, which is about 4.4 g, less than a teaspoon. Topping up to 1.000 L keeps the same 0.075 mol but spreads it out: 0.075 ÷ 1.000 = 0.075 M, half as strong. Adding water never removes solute; it only gives it more room.',
  uses: [
    'Frozen juice concentrate: mixing one can with 3 cans of water spreads the same sugar through 4 times the volume, so the juice is one quarter as concentrated.',
    'Saline for contact lenses and IV bags: both are about 0.9% salt (0.15 M), close to the salt level of blood, so cells neither swell nor shrink.',
    'School chemistry stockroom: teachers keep 6 M HCl and dilute it. One liter of 6 M stock makes 60 L of the 0.1 M acid used in labs.'
  ],
  takeaway: 'Concentration is amount ÷ volume. Adding water removes nothing; it spreads the same amount through more space, so doubling the volume halves the concentration.',
  lede: 'Mix a colored salt into water, then change how much salt and how much water. Watch the color to see what a concentration number means and why adding water weakens a solution.',
  tour: [
    'Molarity is how crowded the solute is: moles per liter. 0.500 mol of copper(II) sulfate in 0.500 L (about two cups) of solution is 0.500 ÷ 0.500 = 1.00 M. The zoom shows a tiny drop: count the Cu²⁺ ions.',
    'Double the solute to 1.00 mol in the same 0.500 L: 2.00 M. Each drop now holds twice as many ions, so more light is absorbed and the blue deepens. Strong coffee looks darker for the same reason.',
    'Back to 0.500 mol, now in 1.000 L. Nothing left the beaker, but each drop holds half as many ions: 0.500 M, and the color fades. This is what adding water to juice concentrate does.',
    'Water can only hold so much. Potassium permanganate saturates near 0.48 M. Try to make 0.80 M and the extra solid just sits on the bottom. Stirring longer will not change that.',
    'When the number has to be exact, use a volumetric flask. Weigh the solid, dissolve it in part of the water, then fill to the etched line. 6.24 g of CuSO₄·5H₂O in 250.00 mL (about one cup) gives 0.100 M.'
  ]
},
solcurve: {
  hook: 'For a crystal project, you dissolve as much table salt as you can in 100 g (about half a cup) of boiling water, then let it cool to 20 °C. How many grams of crystals come out? Would potassium nitrate work better?',
  hookSet: { view: 'solid', solute: 'NaCl', mass: 40, T: 100 },
  answer: 'Salt barely changes: 39.8 g dissolves at 100 °C and 36.0 g stays dissolved at 20 °C, so only about 3.8 g of crystals form. Potassium nitrate has a steep curve: 246 g at 100 °C drops to 31.6 g at 20 °C, so about 214 g crystallizes. To get salt crystals, let the water evaporate instead.',
  uses: [
    'Sea salt: salt makers evaporate seawater in shallow ponds, because cooling salt water brings almost no salt out.',
    'Rock candy: near boiling, water holds more than twice as much sugar as at room temperature, so crystals grow on the string as the syrup cools.',
    'Soda: a warm can holds less dissolved CO₂ than a cold one, so it foams over more when you open it.'
  ],
  takeaway: 'Read the curve before you heat or cool. Most solids dissolve more in hot water, but by very different amounts, and salt barely changes. Gases like O₂ and CO₂ dissolve less as water warms.',
  tour: [
    'Each line is one solute. The height of the line at a temperature is the most that 100 g of water (about half a cup) can hold there. Red is potassium nitrate, KNO₃, a fertilizer salt.',
    '30 g of KNO₃ in 100 g of water at 50 °C, about as hot as tap water gets. The curve says 85.5 g could dissolve, so all 30 g dissolves and the dot sits below the line. The solution is unsaturated: it has room for more.',
    'Add 120 g. Only 85.5 g can dissolve at 50 °C, so the other 34.5 g stays as crystals. The solution is saturated: it holds all it can, and stirring will not change that.',
    'Cool to 20 °C, room temperature. The curve drops to 31.6 g, so 120 − 31.6 = 88.4 g of crystals end up on the bottom. Chemists purify solids this way: dissolve hot, cool, collect the crystals.',
    'NaCl barely changes with temperature, and cerium(III) sulfate gets less soluble when you heat it. Read the curve before you assume hot water helps.',
    'Gases do the opposite: warm water holds less. At 30 °C a lake holds about 7.6 mg/L of O₂, and trout need about 6. That is why fish struggle in warm, still water in late summer.'
  ]
},
colligative: {
  hook: 'Road crews choose between rock salt (NaCl) and calcium chloride (CaCl₂). If each is dissolved at 2 moles per kilogram of melted ice, how cold can the brine get before it refreezes? Which one keeps a −10 °C road clear?',
  hookSet: { view: 'freeze', solute: 'nacl', m: 2 },
  answer: 'Rock salt splits into 2 ions, so 2 m NaCl brine freezes at about −7.4 °C. CaCl₂ splits into 3 ions, so the same molality freezes at about −11.2 °C. On a −10 °C morning the salt brine refreezes and the calcium chloride brine stays liquid. Sugar at 2 m stays in whole molecules and only reaches −3.7 °C.',
  uses: [
    'Car radiator: a 50/50 mix of antifreeze and water stays liquid far below 0 °C and boils above 100 °C, so one coolant works in January and July.',
    'Homemade ice cream: rock salt packed around the ice drops the bath well below 0 °C, cold enough to freeze the cream mix.',
    'Pasta water: a tablespoon of salt (about 17 g) in 4 L of water raises the boiling point by less than 0.1 °C. The salt is for flavor.'
  ],
  takeaway: 'Count particles, not grams. Anything dissolved lowers the freezing point and raises the boiling point, and a salt that splits into more ions does more. The freezing point moves much more than the boiling point.',
  tour: [
    'The test tube holds 1 m salt water: 58 g of salt in each kilogram of water, saltier than the ocean. It sits in an ice–salt bath at −15 °C. A tube of pure water (the dashed line on the graph) cools beside it for comparison.',
    null,
    'Pure water cools and dips a little below 0 °C. That dip is supercooling: liquid briefly colder than its freezing point. Then ice forms, and the temperature holds flat at 0 °C until it is all frozen.',
    'The salt water starts to freeze at about −3.7 °C. Ice is pure water, so the salt stays behind in the liquid. That liquid gets saltier, so the temperature keeps sliding down. Road salt works the same way.',
    'CaCl₂, sold as ice melt, breaks into three ions (Ca²⁺ + 2Cl⁻), while NaCl breaks into two. At the same molality CaCl₂ lowers the freezing point 1.5 times as much. That is why crews use it on the coldest days.',
    'Dissolved particles also raise the boiling point, but only a little: 1 m salt water boils at about 101 °C. Pasta water is far less salty than that, so salt does not make it boil faster.'
  ]
},
beerslaw: {
  hook: 'A cup of blue sports drink reads an absorbance of 1.28 in a spectrophotometer using 630 nm orange-red light. You mix it half and half with water. What should the meter read now, and why would 530 nm green light be a bad choice?',
  hookSet: { solute: 'blue1', conc: 50, lam: 630 },
  answer: 'Half the dye gives half the absorbance: about 0.65, almost exactly half, and the light getting through rises from 5% to 23%. The dye, Blue 1, absorbs orange-red light near 630 nm and barely touches green. At 530 nm even the full-strength drink reads only 0.005, so the meter could not tell one drink from another.',
  uses: [
    'Pulse oximeter: the finger clip shines red and infrared light through you. Oxygen-rich and oxygen-poor hemoglobin absorb them differently, and the ratio gives your blood oxygen level.',
    'Pool test kits: the pink color in a chlorine test gets darker with more chlorine. Matching it to a color chart is Beer’s law done by eye.',
    'Breath-alcohol machines at a police station shine infrared light through a breath sample. The more alcohol in it, the more light is absorbed.'
  ],
  takeaway: 'Darker means more of the colored substance, in proportion: double the concentration and the absorbance doubles. Measure with the color the sample absorbs most, which is roughly the opposite of the color you see.',
  tour: [
    'The lamp makes white light, every color at once, like sunlight. The grating spreads it into a rainbow, and a slit lets through just one wavelength, one color.',
    'That one color crosses the cuvette, a clear tube 1 cm wide. Each dot is a permanganate ion. A photon, one particle of light, that hits one is absorbed; the rest make it through.',
    'The detector measures the fraction of light that gets through. That is transmittance, T. Absorbance is A = −log T, a number that grows as the sample gets darker. Here T = 25%, so A = 0.60.',
    'Double the concentration. Twice the dots stand in the light’s path, and the absorbance doubles to 1.2. T does not halve; it drops to about 6%. That straight-line link is why chemists use absorbance.',
    'The spectrum below shows how much each wavelength is absorbed. Permanganate absorbs green best, at 526 nm (λmax, the peak). Red light at 650 nm passes almost untouched, so a red-light reading would tell you almost nothing.',
    'A solution looks like the light it does not absorb. Permanganate absorbs green and lets red and blue through, so it looks purple. A blue sports drink does the same thing with orange-red light.'
  ]
},
calorimetry: {
  hook: 'You pull a 50 g aluminum block and a 50 g lead fishing weight out of boiling water, both at 100 °C, and drop each into its own cup of 100 g of water at 20 °C. Which one warms its cup more, and by how much?',
  hookSet: { mode: 'metal', metal: 'al', mMetal: 50 },
  answer: 'Aluminum warms its water to about 27.7 °C, a 7.7 °C rise. Lead warms its water only to about 21.2 °C, a 1.2 °C rise. Each gram of aluminum stores about 7 times as much heat per degree (0.897 vs 0.129 J/g·°C), so at the same temperature it has much more heat to give.',
  uses: [
    'Snack labels: a 28 g bag of cheese puffs holds 160 Calories, enough energy to heat 2 L of water from 20 °C to boiling.',
    'Coastal weather: San Diego swings far less between summer and winter than Denver, because the ocean’s water soaks up and gives back huge amounts of heat.',
    'Hot pizza: the watery sauce holds more heat per gram than the dry crust, so at the same temperature the sauce is what burns your mouth.'
  ],
  takeaway: 'At the same temperature, different materials hold very different amounts of heat. Water holds more heat per gram than almost anything, which is why it cools car engines and keeps coastal towns mild.',
  tour: [
    'The copper block hangs in a bath of boiling water. After a few minutes it is at 100 °C, the same as the water around it. Now you know its starting temperature without putting a thermometer in the metal.',
    'Move the hot metal into the foam cup of cool water and put the lid on. Foam works like a cooler: it keeps heat from leaking out, so all the heat the metal loses goes into the water.',
    'Hot means the metal atoms vibrate hard. When they bump the slower water molecules, they pass energy along, like a fast pool ball hitting a slow one. The metal’s vibrations calm down while the water molecules speed up.',
    'Heat flows until the metal and water reach the same temperature, then it stops. That is thermal equilibrium. The copper cooled about 76 °C, but the water warmed only about 3.5 °C, because water takes far more heat per degree.',
    'Now the energy-in-food lab. A cheese puff burns under a can of water. The energy stored in its chemical bonds becomes heat, and the water warms up. Food Calories on a label measure this same stored energy.',
    'Only part of the heat reaches the water, about 28% with an open can. The rest warms the air, the way most of a campfire’s heat goes up instead of into you. That is why your Calories per gram come out lower than the label.'
  ]
},
coldpack: {
  hook: 'You are designing an instant cold pack for a sprained ankle. It holds 100 mL of water at 22 °C, and you want it to reach 5 °C. Does 10 g of ammonium nitrate do it? If not, how much do you need?',
  answer: '10 g only cools the water to about 15 °C. It takes about 28.5 g to reach 5 °C, and 30 g gets to about 4.3 °C. What matters is how much salt dissolves compared with how much water it has to cool: the same 30 g in 200 mL only reaches about 12 °C.',
  uses: [
    'First-aid cold packs: squeezing the pack breaks an inner pouch of water, which mixes with ammonium nitrate or urea and turns cold within seconds.',
    'Ice melt: calcium chloride warms the water as it dissolves, which helps it melt ice faster than rock salt.',
    'Click-to-start gel hand warmers: bending the metal disc makes dissolved sodium acetate crystallize, which releases heat. Boiling the pack dissolves the crystals again for next time.'
  ],
  takeaway: 'Dissolving can absorb or release heat, depending on the salt: ammonium nitrate gets cold, calcium chloride gets hot. For a stronger effect use more salt in less water, because the same heat spread through more water changes the temperature less.',
  tour: [
    'The foam cup holds 100 mL of water, a little under half a cup, at room temperature. A weighing boat of ammonium nitrate, the salt inside many instant cold packs, is about to go in.',
    'In the particle view, water molecules tug ions off the surface of the crystal one at a time. Pulling apart ions that attract each other takes energy, the way pulling two magnets apart takes effort.',
    'Each loose ion gets a shell of water molecules. The partly negative oxygen ends face the + ions, and the partly positive hydrogen ends face the − ions. Forming these attractions releases energy, like magnets snapping together.',
    'For ammonium nitrate, breaking the solid apart takes more energy than the water shells give back. The difference comes out of the water, so it gets colder. That is endothermic: the process takes in heat from its surroundings.',
    'Switch to calcium chloride, the salt in many ice melts. Now the water shells release more energy than breaking the solid takes, so the extra energy heats the water. That is exothermic: heat comes out.'
  ]
},
enthalpy: {
  hook: 'Some websites claim a car can run on water: split it into hydrogen and oxygen, then burn the hydrogen. Is splitting water exothermic or endothermic? Could burning the hydrogen give back more energy than the splitting took?',
  hookSet: { mode: 'bonds', rxn: 'h2o' },
  answer: 'Splitting 2 H₂O breaks four O–H bonds (1852 kJ in) and forms H–H and O=O bonds (1370 kJ out), so it is endothermic: about 482 kJ must go in for every 36 g of water. Burning the hydrogen just runs it backward and gives back the same 482 kJ at best. You can never get out more than you put in.',
  uses: [
    'Gas stove: burning 16 g of methane releases about 802 kJ, because the bonds in CO₂ and H₂O are stronger than the bonds in CH₄ and O₂.',
    'Fertilizer plants: making ammonia from N₂ and H₂ releases heat, but it still needs high temperature to go fast, because the N≡N triple bond is so hard to break.',
    'Car engines and lightning: N₂ + O₂ → 2NO takes in heat, so it only happens at very high temperatures. That NO helps form brown smog.'
  ],
  takeaway: 'Breaking bonds always costs energy, and forming bonds always releases it. A reaction gives off heat when the new bonds are stronger than the old ones. Running a reaction backward costs exactly the energy it released.',
  tour: [
    'Methane (CH₄), the natural gas in a gas stove, and oxygen (O₂) are about to react. Each line between atoms is a bond, the link that holds atoms together. A double line is a double bond.',
    'Every bond that breaks needs energy put in, the way pulling apart two magnets takes effort. Watch the red “Energy in” bar grow and the dot climb on the energy diagram.',
    'Now every bond is broken. The loose atoms sit at the top of the energy diagram, the highest energy on the path. A real flame never takes molecules fully apart like this; it is a way to keep score.',
    'New bonds form to make carbon dioxide and water. Every bond that forms releases energy, so the blue “Energy out” bar grows. The bonds in CO₂ and H₂O are strong, so a lot comes out.',
    'More energy came out than went in, so the reaction gives off heat: exothermic. That leftover energy is what heats the pot on a gas stove or the air from a furnace.'
  ]
},
rates: {
  hook: 'You start a campfire with kindling, not a whole log. Try the same idea with a piece of magnesium in 1 M acid. Which speeds up the fizzing more: grinding the magnesium into powder, or doubling the acid to 2 M? What about both?',
  hookSet: { rxn: 'mg', surf: 'ribbon', cH: 1 },
  answer: 'Powder wins, a little. The ribbon makes about 0.20 H₂ bubbles per second. Powder exposes 24 faces to the acid instead of 10 and makes about 0.48. Doubling the acid gives 0.40. Do both and you get about 0.97, and the metal is gone in about 22 s instead of 74 s. Anything that adds more hard-enough collisions speeds a reaction.',
  uses: [
    'Refrigerator: cold slows the reactions that spoil food, which is why milk keeps far longer in the fridge than on the counter.',
    'Catalytic converter: platinum and palladium in a car’s exhaust give CO and unburned fuel a lower energy hill, so they turn into CO₂ and water before leaving the tailpipe.',
    'Flour mills: flour in a bag barely burns, but flour dust in the air can explode, because every tiny grain is surrounded by oxygen.'
  ],
  takeaway: 'To speed up a reaction, get more particles colliding hard enough: raise the concentration, raise the temperature, break solids into smaller pieces, or add a catalyst. To slow one down, like food spoiling, do the opposite and keep it cold.',
  tour: [
    'You are zoomed in on a tiny drop of solution. Blue balls are A, orange balls are B. They fly around and bounce off the walls and off each other. To react, an A and a B have to collide.',
    'Watch for the rings. A gray ring is a collision that was too gentle, so the particles just bounce. A yellow flash is a collision that worked: A and B join into one AB molecule (a blue-and-orange pair with a purple ring). Most collisions are duds.',
    'To react, particles must hit hard enough to get over an energy hill, like a skateboarder who needs enough speed to get over a ramp. The height of that hill is the activation energy, the energy needed to react.',
    'The curve shows how many particles have each amount of energy. Most are slow and only a few are fast. Only the ones in the shaded tail, past the red line, can climb the hill.',
    'At 450 K (about 177 °C, a baking temperature) the curve flattens and spreads to the right. The shaded tail gets much bigger, so many more collisions work. That is why food cooks faster at higher heat.',
    'A catalyst gives the reaction an easier path with a lower energy hill (dashed green line). More particles make it over, even at the same temperature, and the catalyst is not used up. The enzymes in your body are catalysts.',
    'Now magnesium in hydrochloric acid. The acid can only reach the atoms on the outside of the metal. Grinding the same Mg into powder exposes more atoms, so bubbles of H₂ come faster. Kindling catches before a log for the same reason.'
  ]
},
ratelaw: {
  hook: 'Crystal violet dye fades in a beaker of base, losing half its color in 69 s. If you start with twice as much dye, how long does it take to lose half? And how long until only one eighth of the color is left?',
  hookSet: { mode: 'integrated', rxnG: 'cv', cCV: 10, cOH: 0.05 },
  answer: 'Still 69 s. This reaction is first order: each half-life takes the same time no matter how much dye you start with, 10 µM or 20 µM. One eighth is three half-lives: 3 × 69 = about 208 s, a little under 3.5 minutes. Doubling the OH⁻ instead does matter: the half-life drops to about 35 s.',
  uses: [
    'Caffeine: a typical adult clears about half of it in roughly 5 hours, so 200 mg at 4 pm still leaves about 100 mg in the body at 9 pm.',
    'Carbon-14 dating: half of the carbon-14 in a bone or piece of wood decays every 5,730 years, so measuring what is left tells its age.',
    'Scaling up a reaction: the sulfur clock is zero order in HCl, so adding more acid costs money without making it faster. Chemists measure orders before buying.'
  ],
  takeaway: 'For a first-order process, the half-life is a fixed clock: after each one, half of what was left is gone. After 3 half-lives an eighth remains; after 10, about a thousandth. Starting with more does not shorten the clock.',
  tour: [
    'Thiosulfate reacts with acid to make solid sulfur, in tiny pale yellow grains. You look down through the flask at an X drawn on paper. As sulfur forms, the solution clouds over until the X disappears. Stop the clock then.',
    'The graph shows how much sulfur has formed. The X vanishes when about 2 mM of sulfur is in the flask. A faster reaction reaches that line sooner, so a shorter time means a faster rate.',
    'Now the thiosulfate is cut in half, from 0.100 M to 0.050 M. The reaction is slower, so it takes about twice as long to hide the X: about 61 s instead of 30 s.',
    'Now the thiosulfate is back to 0.100 M and the HCl is doubled to 2.0 M. Watch the time: it stays about 30 s. More of a reactant does not always mean faster, so you have to test each one.',
    'Crystal violet fades. The concentration drops fast at first, then slower. Each half-life takes the same time: half, then a quarter, then an eighth is left. Many medicines leave your body on the same kind of clock.'
  ]
},
equilibrium: {
  hook: 'NO₂ is the brown gas in smog. In a sealed tube, colorless N₂O₄ and brown NO₂ keep turning into each other: N₂O₄ ⇌ 2NO₂. You move the tube from ice water at 0 °C to boiling water at 100 °C. How much browner does it get, and why?',
  hookSet: { sys: 'no2', Tg: 0 },
  answer: 'At 0 °C the tube holds about 0.0051 M of NO₂. At 100 °C it settles at about 0.076 M, roughly 15 times more brown gas. Splitting N₂O₄ absorbs heat, so adding heat pushes the mixture toward NO₂. Cool it again and it shifts back. Nothing is used up; the balance point moves with temperature.',
  uses: [
    'Your blood: hemoglobin picks up O₂ in the lungs, where O₂ is plentiful, and lets it go in working muscles, where O₂ is scarce. Same molecule, opposite direction.',
    'Soda: a sealed bottle keeps CO₂ dissolved under pressure. Open it and CO₂ escapes from the top, so more comes out of the drink until it goes flat.',
    'Ammonia factories: plants cool the gas to pull NH₃ out as a liquid, so the reaction keeps making more to replace it.'
  ],
  takeaway: 'A system at equilibrium pushes back against a change. Add something and it uses some up; remove something and it makes more; heat it and it shifts in the direction that absorbs heat. The reactions never stop; the amounts just settle.',
  lede: 'Watch a colorless gas and a brown gas turn into each other. Heat it, cool it, or add more, and see which way the mixture shifts and where it settles.',
  tour: [
    'N₂O₄ is a colorless gas. Each N₂O₄ molecule can split into two brown NO₂ molecules, the brown gas in smog, and two NO₂ molecules can join back into N₂O₄. The reaction runs both ways.',
    'We started with only N₂O₄. At first only the forward reaction can happen, because there is no NO₂ yet. As NO₂ builds up, the reverse reaction speeds up.',
    'Now the amounts hold steady, but look closely: molecules still split and join. The two reactions run at the same speed, like walking up a down escalator at exactly its speed. Nothing changes overall. That is equilibrium.',
    'Heat the mixture to 80 °C, about as hot as fresh coffee. Splitting N₂O₄ absorbs heat, so heating pushes the reaction toward brown NO₂, and the tube gets browner.',
    'Extra N₂O₄ is added at the left side. The mixture shifts right to use some of it up, making more NO₂. An equilibrium always pushes back against what you change.'
  ]
},
ksp: {
  hook: 'Before a stomach X-ray, patients drink a chalky shake of barium sulfate, even though dissolved barium ions are poisonous. Stir 500 mg of BaSO₄ into 100 mL of water. How much of it actually dissolves?',
  hookSet: { mode: 'dissolve', salt: 'BaSO4', amt: '500' },
  answer: 'About 0.24 mg, less than a twentieth of a percent. The water saturates at [Ba²⁺] = 1.0 × 10⁻⁵ M, and the other 499.8 mg stays solid. Adding 5 mg or 500 mg makes no difference to the dissolved amount. The solid coats the stomach and blocks X-rays while almost none of it dissolves.',
  uses: [
    'Kidney stones: they form when calcium and oxalate in urine pass their solubility limit and calcium oxalate crystallizes. More water dilutes the ions and keeps them below the limit.',
    'Fluoride toothpaste: fluoride turns part of tooth enamel into fluorapatite, which dissolves less in acid than the original enamel does.',
    'Hard water: heating drives CO₂ out of the water, so calcium carbonate passes its limit and crusts kettles and showerheads with white scale.'
  ],
  takeaway: '“Insoluble” really means “dissolves a tiny, fixed amount.” Once water is saturated, adding more solid puts no more in solution; it just piles up on the bottom. Compare salts by how much dissolves, not by how much you add.',
  tour: [
    '5 mg of silver chloride, about as much as 50 grains of table salt, is dropped into 100 mL of water. Almost all of it stays as a white solid at the bottom of the beaker. Chemists call it “insoluble.”',
    'Zoom in: a few Ag⁺ and Cl⁻ ions break away from the crystal surface and drift into the water. Even an “insoluble” salt dissolves a little.',
    'Soon ions leave and rejoin the crystal at the same rate. The solution is saturated: it holds as much AgCl as it can, about 0.0019 g per liter. That is roughly 20 grains of salt’s worth in a whole liter bottle.',
    'Adding 100 mg instead of 5 mg just leaves more solid on the bottom. The concentration of dissolved ions does not change. Saturated water cannot take more, however much you add.',
    'The bar compares the ions in solution with the saturation point, the most the water can hold. Left of the line, more can dissolve. Right of it, solid forms and drops out.'
  ]
},
ph: {
  hook: 'Cola is pH 2.5, black coffee is pH 5.0, and milk is pH 6.7. Tooth enamel starts to dissolve below about pH 5.5. How many times more H₃O⁺ does cola have than coffee, and than milk?',
  hookSet: { mode: 'scale', sol: 'cola' },
  answer: 'Each pH step is 10 times. Cola is 2.5 steps below coffee, so it has 10^2.5, about 320 times more H₃O⁺: 3.2 × 10⁻³ M versus 1.0 × 10⁻⁵ M. It is 4.2 steps below milk, about 16,000 times more. Both cola and coffee are below 5.5, but cola is far past it.',
  uses: [
    'Swimming pools: pool water is kept between about pH 7.2 and 7.8, because outside that range chlorine works poorly and the water stings your eyes.',
    'Colorado gardens: blueberries need acidic soil, around pH 4.5 to 5.5. Much Colorado soil is alkaline, so gardeners add sulfur or grow them in pots.',
    'Your blood: it stays between pH 7.35 and 7.45. A shift of even a few tenths is a medical emergency.'
  ],
  takeaway: 'Each pH step is a factor of 10, so small differences are big: pH 3 is 10 times more acidic than pH 4 and 100 times more than pH 5. At equal concentration, a strong acid lowers pH far more than a weak one.',
  tour: [
    'pH runs from about 0 to 14. Below 7 is acidic, like lemon juice; exactly 7 is neutral, like pure water; above 7 is basic, like soap or bleach. The colors on the bar are the colors of universal indicator.',
    'Lemon juice is pH 2 and coffee is pH 5. Each step is 10×, so three steps means 10 × 10 × 10 = 1,000 times more H₃O⁺, the ion that makes things acidic, in the lemon juice. The bars use a log scale so both fit.',
    'Even bleach has a few H₃O⁺ ions, and even lemon juice has a few OH⁻, the ion that makes things basic. When one goes up, the other goes down, like the two ends of a seesaw.',
    null,
    'Now two beakers at the same concentration, 0.10 M. HCl is a strong acid, the acid in your stomach: every molecule has given its H⁺ to water. In view are 40 H₃O⁺ (pink) and 40 Cl⁻ (green), and no HCl molecules left.',
    'Acetic acid, the acid in vinegar, is weak: almost every molecule is still whole (an orange ball with its small white H). Only about 1 in 75 gives up its H⁺ at any moment, so the pH is higher: 2.88 instead of 1.00.',
    'Dilute both 10×. At 0.010 M, HCl goes from pH 1 to pH 2: one step per 10× dilution. The weak acid’s pH rises by only about half a step, because more of its molecules let go of H⁺ when diluted.'
  ]
},
titration: {
  hook: 'You titrate 25.00 mL of an unknown HCl with 0.100 M NaOH, and the pink color stays for good at 22.50 mL. What is the acid’s concentration? And why do you slow down to single drops near the end?',
  answer: 'Moles of base = moles of acid, so M(acid) = 0.100 × 22.50 ÷ 25.00 = 0.0900 M. Near the end the pH jumps: one drop (0.05 mL) before equivalence the flask is near pH 4, and one drop after it is near pH 10. A fast stream would overshoot and make your answer too high.',
  uses: [
    'Pool and aquarium test kits: you count drops of reagent until the sample changes color. That drop count is a small titration for alkalinity or hardness.',
    'Juice and wine labs: technicians titrate a sample with NaOH to measure its total acidity, which sets how sour it tastes.',
    'Homemade biodiesel: makers titrate used cooking oil first to find out how much extra lye it needs, because old oil contains more acid.'
  ],
  takeaway: 'At the endpoint, moles of base added equal moles of acid in the flask, so M(acid) = M(base) × V(base) ÷ V(acid). Go slowly at the end, because a single drop can swing the pH by several units.',
  tour: [
    'The burette, the tall tube with a valve at the bottom, holds the titrant: a solution whose concentration you know, 0.100 M NaOH. You read the volume at the bottom of the curved surface, the meniscus. It starts at 0.00 mL.',
    'The Erlenmeyer flask holds exactly 25.00 mL of HCl from a pipet, plus a few drops of phenolphthalein, a dye that is colorless in acid and turns pink above pH 8.2. The pH meter reads the pH as you go.',
    'NaOH streams in. In the zoom, each OH⁻ (red O with a white H) finds an H₃O⁺ (pink) and they make two water molecules: H₃O⁺ + OH⁻ → 2 H₂O. Acid and base cancel out. Na⁺ and Cl⁻ (pale) just watch: they are spectator ions.',
    'Three quarters of the way there, the pH has barely moved. While lots of acid is left, each mL of base removes only a small fraction of the H₃O⁺. A flat curve does not mean nothing is happening.',
    'Close to the end, each drop flashes pink where it lands, then the color fades as you swirl. Switch to single drops now. One drop is only about 0.05 mL, but it can decide the result.',
    null
  ]
},
buffers: {
  hook: 'Your blood stays near pH 7.4 because it is buffered. Test the idea: add 1 mL of 1.0 M HCl to 100 mL of pure water and to 100 mL of acetate buffer. How far does each pH move, and how much acid can the buffer take?',
  answer: 'Water drops from pH 7.00 to 2.00, five full steps, or 100,000 times more H₃O⁺. The buffer drops only from 4.75 to 4.57. It keeps soaking up acid through 4 mL (pH 3.80), but by 5 mL its acetate is used up and the pH falls to 2.89. After that it acts like plain water.',
  uses: [
    'Hard exercise: your muscles release acid into the blood, and you breathe faster to blow off CO₂, which keeps the bicarbonate buffer working and the pH near 7.4.',
    'Rocky Mountain lakes: many high lakes sit on granite and carry little dissolved carbonate buffer, so acid rain and snowmelt change their pH more than lakes on limestone.',
    'Eye drops: they are buffered near the pH of tears, about 7.4, so they do not sting.'
  ],
  takeaway: 'A buffer is a weak acid and its partner base together, so it can soak up both added acid and added base. It holds the pH steady only until one partner runs out; after that it behaves like plain water.',
  tour: [
    'On the left is pure water. On the right is a buffer made of acetic acid, the acid in vinegar, and sodium acetate, its partner base. We will add exactly the same acid and base to both.',
    '1 mL of 1.0 M HCl, about 20 drops, goes into the water. The pink H₃O⁺ ions have nothing to react with, so they stay, and the pH crashes from 7 to 2. That is 100,000 times more acidic.',
    'The same H₃O⁺ goes into the buffer. Each one finds an acetate ion (orange, −) and hands it its H⁺: C₂H₃O₂⁻ + H₃O⁺ → HC₂H₃O₂ + H₂O. The H₃O⁺ is gone, so the pH barely moves, from 4.75 to about 4.57.',
    'Now add NaOH twice. Each OH⁻ (red with a white H) takes an H⁺ from an acetic acid molecule: HC₂H₃O₂ + OH⁻ → C₂H₃O₂⁻ + H₂O. The buffer soaks up base as well as acid.',
    'Add 5 mL of HCl, twice. Partway through, the last of the acetate is used up. After that, extra H₃O⁺ stays free and the buffer’s pH drops sharply, like a sponge that is already full. That limit is the buffer capacity.'
  ]
},
gibbs: {
  hook: 'Someone opens a bag of popcorn, and soon the whole room smells like it. Could all the smell molecules ever drift back into one half of the room by chance? Try it with 4 particles, then 40, then 100.',
  answer: 'With 4 particles, all of them land on one side about 1 time in 16. With 40, the chance is 1 in about 1.1 × 10¹², and with 100 it is 1 in about 1.3 × 10³⁰. Even a faint smell is far more than 100 molecules, so it never gathers back. Nothing pushes molecules apart; spread-out arrangements just vastly outnumber bunched ones.',
  uses: [
    'Ice in a drink: above 0 °C, the extra freedom of liquid water outweighs the energy needed to melt the ice, so it melts on its own.',
    'Earbud cords in a pocket: tangled arrangements far outnumber neat ones, so jostling almost always tangles them and almost never untangles them.',
    'Refrigerator: heat spreads from warm to cold on its own, so a fridge must use electricity to pump heat out of the food and into the kitchen.'
  ],
  takeaway: 'Things spread out on their own because spread-out arrangements vastly outnumber bunched-up ones, not because anything pushes them. Undoing the spread, like tidying a room or chilling a fridge, always takes energy.',
  tour: [
    'Forty gas particles are trapped in the left half of the box by a divider. There is exactly one way to have all forty on the left: every single one has to be there.',
    'Each particle moves at random. Nothing pushes them to the right, yet within seconds about half are on each side. This is how a smell fills a room.',
    'The bars show how many ways there are to have each number of particles on the left. Half and half has by far the most ways, so that is what you almost always see. Entropy is a measure of those ways: more ways, more entropy.',
    'With only 4 particles, all 4 land on the left now and then (1 time in 16), as often as flipping 4 heads in a row. With a mole of particles, that never happens in the lifetime of the universe.',
    'In Predict ΔS, compare before and after. Gases are far more spread out than liquids, and liquids more than solids, so boiling water raises its entropy. More moles of gas usually means more entropy.'
  ]
},
galvanic: {
  hook: 'An AA battery pushes 1.5 V. Your zinc and copper cell reads 1.10 V. Which pair of metals in the menu gives the biggest voltage? Can any pair beat the AA battery?',
  answer: 'Magnesium with silver reads 3.17 V, the biggest gap on the list. Magnesium with copper gives 2.71 V, and even zinc with silver gives 1.56 V. The farther apart two metals sit in the table of reduction potentials, the harder the push. Real magnesium has an oxide coating, so a lab cell reads a few tenths of a volt lower.',
  uses: [
    'Galvanized steel: guardrails and nails are coated with zinc, which gives up electrons more easily than iron, so the zinc corrodes first and protects the steel.',
    'Foil and a filling: biting aluminum foil with a metal filling makes a tiny cell in your saliva, and the current gives a sharp jolt.',
    'Car battery: six lead-acid cells of about 2 V each, stacked in a row, add up to the 12 V that starts the engine.'
  ],
  takeaway: 'A battery is two materials that hold electrons differently. Electrons flow from the one that lets go more easily to the one that grabs harder, and the bigger the difference, the higher the voltage. Stack cells to add their voltages.',
  tour: [
    'Left: a zinc strip in zinc nitrate solution. Right: a copper strip in blue copper(II) sulfate. Each beaker is a half-cell. Joined by a wire, the two make a simple battery.',
    'Zoom in on the zinc surface. Zinc atoms give up two electrons each and leave as Zn²⁺ ions: Zn → Zn²⁺ + 2e⁻. Losing electrons is called oxidation. The electrons stay in the metal and head for the wire, and the zinc slowly wears away.',
    'The yellow dots are electrons. They flow from the zinc, through the bulb, to the copper. Zinc gives up electrons more easily than copper, so they flow this way on their own. That flow is the current that lights the bulb.',
    'At the copper surface, Cu²⁺ ions from the solution pick up two electrons and become copper atoms: Cu²⁺ + 2e⁻ → Cu. Gaining electrons is called reduction. The copper strip gains mass and the blue color slowly fades.',
    'Zn²⁺ builds up on the left and Cu²⁺ is used up on the right. Ions from the KNO₃ salt bridge keep the charges balanced so current can keep flowing: NO₃⁻ moves toward the zinc side and K⁺ toward the copper side. No electrons go through the bridge.',
    'The voltmeter measures how hard the electrons are pushed: about 1.10 V for zinc and copper, a bit less than an AA battery’s 1.5 V. Different pairs of metals give different voltages.'
  ]
},
orbitals: {
  hook: 'The periodic table has a block 2 columns wide on the left, one 6 wide on the right, and one 10 wide in the middle. Look through the 3s, 3p and 3d orbitals in the menu. How many of each are there, and where do 2, 6 and 10 come from?',
  answer: 'Each level has 1 s orbital, 3 p orbitals (pointing along x, y and z) and 5 d orbitals. Each orbital holds 2 electrons, so an s sublevel holds 2, a p sublevel 6 and a d sublevel 10. Those are the widths of the s, p and d blocks: each step to the right across a block adds one electron.',
  uses: [
    'Reading the periodic table: chlorine sits in the p block with 5 of its 6 outer p spots filled, so it grabs one more electron and becomes Cl⁻.',
    'Fireworks and neon signs: an element’s orbitals have fixed energies, so electrons jumping between them give off fixed colors, like the red of strontium fireworks.',
    'Water’s shape: oxygen’s electron clouds point in set directions, so a water molecule is bent at about 104.5°. That bend makes water polar enough to dissolve salt.'
  ],
  takeaway: 'An orbital is a cloud showing where an electron is likely to be, not a track. Each holds 2 electrons, and they come in sets of 1 s, 3 p and 5 d. That 2, 6, 10 pattern is the shape of the periodic table.',
  tour: [
    'This is hydrogen’s 1s orbital. Each dot marks a place the electron could be found if you measured it. The electron does not travel a path like a planet; the cloud shows where it is likely to be.',
    'The 2s orbital is also a sphere, but much bigger: its most likely distance is about 277 pm, five times the 1s. Inside it is an empty shell where the electron is never found, called a node.',
    'The 2pz orbital has two lobes along the z axis, like a dumbbell. Between them is a flat plane through the nucleus where the electron is never found.',
    'Every p sublevel has three orbitals pointing along x, y and z, at right angles like the corner of a room. Each holds 2 electrons, so a p sublevel holds 3 × 2 = 6, the width of the p block. This is 2px.',
    'Most d orbitals look like four-leaf clovers. There are five of them, so a d sublevel holds 10 electrons, the width of the transition-metal block. This is 3dxy, with lobes between the x and y axes.',
    null
  ]
}
});
