/* AP Chemistry free-response practice for Raider ChemLab, merged into each tool by BioLab.addFRQ (format: SCIENCE-FRQ-SPEC.md).
   Long questions are worth 10 points and Short questions 4, as on the AP exam (3 Long and 4 Short in 105 minutes).
   Every number here is recomputed by the build's compute script with ChemLab's constants and cross-checked against the sims. */
BioLab.addFRQ({

/* ===================== AP Unit 1: Atomic structure and properties ===================== */

mole:[
  {id:'mole-1',kind:'ap',type:'Short',title:'Glucose by the gram',minutes:9,
    stem:'<p>A student dissolves 5.00 g of glucose, C₆H₁₂O₆ (molar mass 180.16 g/mol), in water to make a sports drink.</p>',
    parts:[
      {label:'a',kind:'calc',pts:1,q:'Calculate the number of moles of glucose in the 5.00 g sample.',
        num:{ans:0.0278,tol:0.0002,unit:'mol'},
        guide:['For 0.0278 mol, with the work shown (5.00 g ÷ 180.16 g/mol)'],
        model:'n = 5.00 g × (1 mol ÷ 180.16 g) = <b>0.0278 mol</b> of glucose.',
        mistakes:['Multiplying by the molar mass instead of dividing. Write the units into the setup: g × (mol/g) leaves mol.']},
      {label:'b',kind:'calc',pts:1,q:'Calculate the number of carbon atoms in the sample.',
        num:{ans:1.00e23,tol:0.01e23,unit:'atoms'},
        guide:['For 1.00 × 10²³ carbon atoms, using 6 C atoms per glucose molecule and Avogadro’s number'],
        model:'0.02775 mol C₆H₁₂O₆ × (6 mol C ÷ 1 mol C₆H₁₂O₆) × (6.022 × 10²³ atoms/mol) = <b>1.00 × 10²³ C atoms</b>.',
        mistakes:['Stopping at the number of molecules (1.67 × 10²²). Each molecule has 6 carbon atoms, so multiply by 6.','Rounding the moles to 0.03 mol before the next step. Keep extra digits until the final answer.']},
      {label:'c',kind:'explain',pts:2,q:'A second student has 5.00 g of water, H₂O. Identify which sample, the glucose or the water, contains more molecules. Justify your answer.',
        guide:['For identifying the water sample','For a justification based on molar mass: water (18.02 g/mol) has a much smaller molar mass, so the same mass is more moles, and the number of molecules is proportional to the number of moles'],
        model:'The <b>water</b> has more molecules. Water’s molar mass, 18.02 g/mol, is about one tenth of glucose’s, so 5.00 g of water is 0.277 mol, about ten times as many moles as the glucose (0.0278 mol). The number of molecules is moles × Avogadro’s number, so the water has about 10 times as many molecules.',
        mistakes:['Saying the samples are equal because the masses are equal. A mole is a count: compare moles, not grams.','Answering with no reason. “Justify” means you must name the molar mass and connect it to moles.']}
    ],
    lab:{set:{mode:'map',sub:'C6H12O6',from:'g',to:'mol',amt:5},look:'Read <b>Moles</b> for 5.0 g of glucose. Then switch the substance to H₂O and compare.'}}
],

avgmass:[
  {id:'avgmass-1',kind:'ap',type:'Short',title:'Two isotopes of bromine',minutes:9,
    stem:'<p>A mass spectrum of a sample of bromine atoms shows two peaks.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Isotope</th><th scope="col" style="white-space:normal">Mass (amu)</th><th scope="col" style="white-space:normal">Relative abundance</th></tr></thead><tbody><tr><td style="white-space:normal">⁷⁹Br</td><td style="white-space:normal">78.918</td><td style="white-space:normal">50.69%</td></tr><tr><td style="white-space:normal">⁸¹Br</td><td style="white-space:normal">80.916</td><td style="white-space:normal">49.31%</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'calc',pts:2,q:'Calculate the average atomic mass of bromine from these data.',
        num:{ans:79.90,tol:0.01,unit:'amu'},
        guide:['For a weighted average: each isotope’s mass multiplied by its fractional abundance (0.5069 and 0.4931), then added','For 79.90 amu'],
        model:'(78.918 amu)(0.5069) + (80.916 amu)(0.4931) = 40.00 amu + 39.90 amu = <b>79.90 amu</b>.',
        mistakes:['Averaging the two masses without weighting them (79.917 amu). That only works when the abundances are exactly equal.','Multiplying by 50.69 instead of 0.5069. Change percents to fractions first.']},
      {label:'b',kind:'explain',pts:1,q:'No single bromine atom has a mass of 79.90 amu. Explain why.',
        guide:['For explaining that 79.90 amu is an average over a huge number of atoms of two isotopes, and every individual atom has a mass near 79 or near 81 amu'],
        model:'79.90 amu is a <b>weighted average</b> over many atoms. Each real atom is either ⁷⁹Br (78.918 amu) or ⁸¹Br (80.916 amu), so no atom has the average mass.'},
      {label:'c',kind:'explain',pts:1,q:'When Br₂ molecules are analyzed instead of atoms, the spectrum shows three peaks near 158, 160 and 162 amu, and the peak at 160 amu is about twice as tall as each of the others. Explain why there are three peaks and why the middle peak is the tallest.',
        guide:['For identifying the three combinations (⁷⁹Br⁷⁹Br, ⁷⁹Br⁸¹Br and ⁸¹Br⁸¹Br) and explaining that the mixed molecule can form two ways (⁷⁹Br with ⁸¹Br, or ⁸¹Br with ⁷⁹Br), so it is about twice as common'],
        model:'A Br₂ molecule can be ⁷⁹Br–⁷⁹Br (158 amu), ⁷⁹Br–⁸¹Br (160 amu) or ⁸¹Br–⁸¹Br (162 amu). The isotopes are almost 50 : 50, so each pure pair has a probability of about ½ × ½ = ¼, while the mixed pair can happen two ways, ⁷⁹Br first or ⁸¹Br first, for about ½. That makes the 160 peak about twice as tall.',
        mistakes:['Saying the 160 peak is tallest because 160 is “the average”. The height comes from the number of ways to make each combination.']}
    ],
    lab:{set:{mode:'spec',el:'Br'},act:'f10k',look:'Read <b>Average from your spectrum</b> and compare it with the periodic table value. Turn on <b>Diatomic molecules</b> to see the three Br₂ peaks.'}}
],

percentcomp:[
  {id:'percentcomp-1',kind:'ap',type:'Long',title:'Combustion analysis of a solvent',minutes:23,
    stem:'<p>A 0.500 g sample of a liquid solvent that contains only carbon, hydrogen and oxygen is burned completely in excess oxygen. The products pass through two absorbers: one collects all the water and the other collects all the carbon dioxide.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Product</th><th scope="col" style="white-space:normal">Mass collected</th></tr></thead><tbody><tr><td style="white-space:normal">CO₂ (44.01 g/mol)</td><td style="white-space:normal">0.9990 g</td></tr><tr><td style="white-space:normal">H₂O (18.02 g/mol)</td><td style="white-space:normal">0.4089 g</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'calc',pts:2,q:'Calculate the mass, in grams, of carbon in the 0.500 g sample.',
        num:{ans:0.2726,tol:0.0005,unit:'g'},
        guide:['For converting the mass of CO₂ to moles of CO₂ (0.9990 g ÷ 44.01 g/mol = 0.02270 mol), which equals the moles of C','For 0.2726 g of carbon'],
        model:'0.9990 g CO₂ × (1 mol CO₂ ÷ 44.01 g) = 0.02270 mol CO₂. Each CO₂ has one C, so there are 0.02270 mol C. 0.02270 mol × 12.01 g/mol = <b>0.2726 g C</b>.',
        mistakes:['Using the mass of CO₂ as the mass of carbon. Only 12.01 g of every 44.01 g of CO₂ is carbon.']},
      {label:'b',kind:'calc',pts:1,q:'Calculate the mass, in grams, of hydrogen in the sample.',
        num:{ans:0.04575,tol:0.0003,unit:'g'},
        guide:['For 0.04575 g of hydrogen, using 2 mol H for every 1 mol H₂O'],
        model:'0.4089 g H₂O ÷ 18.02 g/mol = 0.02269 mol H₂O. × 2 mol H per mol H₂O = 0.04538 mol H. × 1.008 g/mol = <b>0.04575 g H</b>.',
        mistakes:['Forgetting the 2. Each water molecule carries two hydrogen atoms out of the sample.']},
      {label:'c',kind:'explain',pts:1,q:'Explain why the mass of oxygen in the sample cannot be found from the masses of CO₂ and H₂O collected.',
        guide:['For explaining that some of the oxygen atoms in the CO₂ and H₂O came from the O₂ used to burn the sample, not from the sample itself'],
        model:'The sample burns in excess O₂, so <b>much of the oxygen in the products came from the O₂ gas</b>, not from the sample. Only the C and H in the products must have come from the sample.'},
      {label:'d',kind:'calc',pts:1,q:'Calculate the mass of oxygen in the sample.',
        num:{ans:0.182,tol:0.001,unit:'g'},
        guide:['For 0.182 g of oxygen, found by subtracting the masses of C and H from the 0.500 g sample'],
        model:'m(O) = 0.500 g − 0.2726 g − 0.04575 g = <b>0.182 g O</b>. In a subtraction, the answer keeps the fewest decimal places of the data, here three (0.500 g). Keep the unrounded 0.1816 g as a guard digit for the next step, and round only at the end.'},
      {label:'e',kind:'explain',pts:2,q:'Determine the empirical formula of the compound. Show your work.',
        guide:['For converting each mass to moles: 0.02270 mol C, 0.04538 mol H and 0.01135 mol O','For dividing by the smallest number of moles to get a 2 : 4 : 1 ratio, so the empirical formula is C₂H₄O'],
        model:'C: 0.02270 mol. H: 0.04538 mol. O: 0.1816 g (the guard-digit value) ÷ 16.00 g/mol = 0.01135 mol. Dividing each by 0.01135 gives C 2.00, H 4.00, O 1.00 (to three significant figures). The empirical formula is <b>C₂H₄O</b>.',
        mistakes:['Finding the ratio from the masses instead of the moles. Formulas count atoms, so convert to moles first.','Rounding a ratio like 1.5 to 2. If a ratio is not close to a whole number, multiply every ratio by the same small integer.']},
      {label:'f',kind:'explain',pts:1,q:'In a separate experiment, the molar mass of the compound is found to be 88.1 g/mol. Determine the molecular formula of the compound.',
        guide:['For C₄H₈O₂, because 88.1 g/mol ÷ 44.05 g/mol (the empirical formula mass) = 2.00'],
        model:'The empirical formula mass of C₂H₄O is 44.05 g/mol. 88.1 ÷ 44.05 = 2.00, so the molecular formula is 2 × C₂H₄O = <b>C₄H₈O₂</b>.'},
      {label:'g',kind:'explain',pts:2,q:'Suppose some water vapor passed through the absorber without being collected. Would the calculated mass percent of hydrogen in the compound be too high, too low or unchanged? Justify your answer.',
        guide:['For saying too low','For a justification: less H₂O is weighed, so the calculated mass of H is smaller while the mass of the sample is unchanged'],
        model:'<b>Too low.</b> The mass of H is calculated from the mass of H₂O collected. If some water escapes, the measured H₂O mass is smaller, so the calculated mass of H is smaller. The sample mass (0.500 g) does not change, so mass of H ÷ mass of sample is smaller.',
        mistakes:['Giving the direction with no reason. AP readers award the justification point only when you trace the error through the calculation.']}
    ],
    lab:{set:{mode:'comb',cs:'etac',cmass:0.5},act:'burn',look:'This is Sample 4. Read <b>CO₂ absorbed</b>, <b>H₂O absorbed</b> and <b>Oxygen in the sample (by difference)</b>, then check the empirical formula.'}}
],

econfig:[
  {id:'econfig-1',kind:'ap',type:'Short',title:'Iron and its ions',minutes:9,
    stem:'<p>Iron is found as Fe²⁺ in hemoglobin and as Fe³⁺ in rust. A sample of an Fe³⁺ compound is pulled toward a strong magnet.</p>',
    parts:[
      {label:'a',kind:'explain',pts:1,q:'Write the complete ground-state electron configuration of a neutral Fe atom.',
        guide:['For 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶ (3d⁶ written before 4s² is also accepted)'],
        model:'Fe has 26 electrons: <b>1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶</b>, or [Ar] 4s² 3d⁶.'},
      {label:'b',kind:'explain',pts:1,q:'Write the ground-state electron configuration of the Fe³⁺ ion.',
        guide:['For 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵, or [Ar] 3d⁵, with both 4s electrons removed'],
        model:'Fe³⁺ has 23 electrons. The 4s electrons are in the highest shell (n = 4), so they are removed first, then one 3d electron: <b>[Ar] 3d⁵</b>.',
        mistakes:['Writing [Ar] 4s² 3d³. Transition metals lose their 4s electrons before their 3d electrons, even though 4s fills first.']},
      {label:'c',kind:'explain',pts:2,q:'Identify the number of unpaired electrons in Fe³⁺. Justify your answer using the way electrons occupy the 3d orbitals.',
        guide:['For 5 unpaired electrons','For applying Hund’s rule: each of the five 3d electrons goes into a separate 3d orbital with the same spin before any orbital gets a second electron'],
        model:'<b>5 unpaired electrons.</b> The 3d sublevel has five orbitals. By Hund’s rule, electrons occupy empty orbitals of equal energy one at a time, with parallel spins, before pairing. Five 3d electrons fill each orbital once, so all five are unpaired. That is why Fe³⁺ is paramagnetic and is attracted to the magnet.',
        mistakes:['Pairing electrons up before every orbital in the sublevel has one.']}
    ],
    lab:{set:{Z:26,charge:3,view:'boxes'},act:'fill',look:'Read <b>Configuration so far</b> and <b>Unpaired electrons placed</b>. Set the ion charge back to 0 to compare with the neutral atom.'}}
],

pes:[
  {id:'pes-1',kind:'ap',type:'Long',title:'Reading a photoelectron spectrum',minutes:23,
    stem:'<p>The photoelectron spectrum of an element X, collected with high-energy X-rays, has five peaks.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Peak</th><th scope="col" style="white-space:normal">Binding energy (MJ/mol)</th><th scope="col" style="white-space:normal">Relative number of electrons</th></tr></thead><tbody><tr><td style="white-space:normal">1</td><td style="white-space:normal">208</td><td style="white-space:normal">2</td></tr><tr><td style="white-space:normal">2</td><td style="white-space:normal">18.7</td><td style="white-space:normal">2</td></tr><tr><td style="white-space:normal">3</td><td style="white-space:normal">13.5</td><td style="white-space:normal">6</td></tr><tr><td style="white-space:normal">4</td><td style="white-space:normal">1.95</td><td style="white-space:normal">2</td></tr><tr><td style="white-space:normal">5</td><td style="white-space:normal">1.01</td><td style="white-space:normal">3</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'explain',pts:1,q:'Identify element X.',
        guide:['For phosphorus, because the relative numbers of electrons add up to 15'],
        model:'2 + 2 + 6 + 2 + 3 = 15 electrons, so X is <b>phosphorus</b> (Z = 15).'},
      {label:'b',kind:'explain',pts:1,q:'Write the ground-state electron configuration of X.',
        guide:['For 1s² 2s² 2p⁶ 3s² 3p³, with the sublevels matching the peaks from highest to lowest binding energy'],
        model:'<b>1s² 2s² 2p⁶ 3s² 3p³</b>. Peak 1 is 1s, peak 2 is 2s, peak 3 is 2p, peak 4 is 3s and peak 5 is 3p.'},
      {label:'c',kind:'explain',pts:1,q:'Explain why peak 3 is three times as tall as peak 2.',
        guide:['For saying peak height is proportional to the number of electrons, and the 2p sublevel holds 6 electrons while the 2s holds 2'],
        model:'The height of a peak shows how many electrons have that binding energy. Peak 3 is the <b>2p sublevel, with 6 electrons</b>, and peak 2 is the 2s sublevel, with 2.'},
      {label:'d',kind:'explain',pts:2,q:'The 1s electrons have a binding energy of 208 MJ/mol, but the 3s electrons have a binding energy of only 1.95 MJ/mol. Explain this difference using Coulomb’s law.',
        guide:['For saying the 1s electrons are much closer to the nucleus than the 3s electrons','For connecting distance to attraction: by Coulomb’s law the attraction to the nucleus is stronger at a smaller distance (and 1s electrons are not shielded by inner electrons), so more energy is needed to remove a 1s electron'],
        model:'Coulomb’s law says the attraction between the nucleus and an electron grows with the charges and falls with the distance between them. The 1s electrons are in the first shell, <b>much closer to the nucleus</b> than 3s electrons, and have no inner electrons shielding them from the 15 protons. They are held far more strongly, so their binding energy is far higher.',
        mistakes:['Saying the 1s electrons “have more energy”. They have a higher binding energy, which means it takes more energy to remove them.','Using “shielding” alone without saying what it changes. Tie it to the attraction to the nucleus.']},
      {label:'e',kind:'explain',pts:1,q:'Explain why peak 5 (3p) has a lower binding energy than peak 4 (3s), even though both are in the third shell.',
        guide:['For saying the 3p electrons are in a higher-energy sublevel and are partly shielded by the 3s electrons, so they are less strongly attracted to the nucleus'],
        model:'The <b>3p sublevel is higher in energy</b>: 3p electrons spend less time near the nucleus than 3s electrons and are partly shielded by them, so they feel a weaker attraction and are easier to remove.'},
      {label:'f',kind:'explain',pts:2,q:'The 1s peak in the spectrum of sulfur is at 239 MJ/mol. Explain why it is higher than the 1s peak of element X.',
        guide:['For saying sulfur has 16 protons and X has 15, so sulfur’s nucleus has the greater charge','For saying the 1s electrons are in the same shell, at about the same distance from the nucleus in both atoms, so the greater nuclear charge gives a stronger Coulombic attraction and a higher binding energy'],
        model:'Sulfur has <b>16 protons</b>, one more than phosphorus. Both 1s peaks come from electrons in the first shell, about the same distance from the nucleus and with no shielding. With a larger nuclear charge at about the same distance, Coulomb’s law gives a stronger attraction, so it takes more energy to remove a 1s electron from sulfur.',
        mistakes:['Naming only the charge, or only the distance. A full Coulomb’s law argument addresses both: here the charge changes and the distance stays about the same.','Saying “sulfur has more electrons”. The binding energy depends on the attraction to the nucleus, so talk about protons.']},
      {label:'g',kind:'calc',pts:1,q:'The sample is then analyzed with a softer X-ray source whose photons have an energy of 143.4 MJ/mol. Calculate the kinetic energy, in MJ/mol, of the electrons ejected from the 2p sublevel.',
        num:{ans:129.9,tol:0.2,unit:'MJ/mol'},
        guide:['For KE = photon energy − binding energy = 143.4 − 13.5 = 129.9 MJ/mol'],
        model:'KE = hν − BE = 143.4 MJ/mol − 13.5 MJ/mol = <b>129.9 MJ/mol</b>.'},
      {label:'h',kind:'explain',pts:1,q:'Explain why the spectrum collected with the 143.4 MJ/mol source has no peak at 208 MJ/mol.',
        guide:['For saying each photon has only 143.4 MJ/mol, less than the 208 MJ/mol needed to remove a 1s electron, so no 1s electrons are ejected'],
        model:'One photon ejects one electron, and only if the photon’s energy is at least the binding energy. <b>143.4 MJ/mol is less than 208 MJ/mol</b>, so these photons can’t remove 1s electrons.'}
    ],
    lab:{set:{el:15,src:'cu',cmp:16},look:'Read each peak’s binding energy and height, and compare with sulfur. Then switch <b>Photon source</b> to Soft X-ray and watch the 1s peak disappear.'}}
],

trends:[
  {id:'trends-1',kind:'ap',type:'Short',title:'Ionization energy across period 3',minutes:9,
    stem:'<div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Element</th><th scope="col" style="white-space:normal">First ionization energy (kJ/mol)</th></tr></thead><tbody><tr><td style="white-space:normal">Na</td><td style="white-space:normal">496</td></tr><tr><td style="white-space:normal">Mg</td><td style="white-space:normal">738</td></tr><tr><td style="white-space:normal">Al</td><td style="white-space:normal">578</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'explain',pts:2,q:'Explain why the first ionization energy of Mg is greater than that of Na.',
        guide:['For saying Mg has more protons than Na (12 compared with 11), so it has a greater nuclear charge','For saying the electron removed from each is a 3s electron, in the same shell at about the same distance with the same inner-electron shielding, so the greater nuclear charge gives a stronger Coulombic attraction'],
        model:'Both atoms lose a <b>3s electron</b>, in the same shell, shielded by the same 10 inner electrons and at about the same distance from the nucleus. Mg has <b>12 protons</b> to Na’s 11, so by Coulomb’s law the attraction on that electron is stronger and more energy is needed to remove it.',
        mistakes:['Saying “Mg is closer to a full shell” or “Mg wants to keep its electrons”. Atoms don’t want things: argue with charge and distance.','Saying Mg’s electron is closer without giving the reason, which is the greater nuclear charge.']},
      {label:'b',kind:'explain',pts:2,q:'Explain why the first ionization energy of Al is less than that of Mg, even though Al has more protons.',
        guide:['For identifying that Al’s first electron is removed from the 3p sublevel, while Mg’s comes from the 3s sublevel','For saying the 3p electron is higher in energy and partly shielded by the 3s electrons (and is farther from the nucleus on average), so it is less strongly attracted and easier to remove'],
        model:'Al’s outermost electron is a <b>3p electron</b> ([Ne] 3s² 3p¹), while Mg loses a 3s electron. The 3p sublevel is higher in energy: the 3p electron is partly shielded by the two 3s electrons and is, on average, farther from the nucleus. Its attraction to the nucleus is weaker, so it takes less energy to remove, even with one more proton.'}
    ],
    lab:{set:{view:'map',prop:'ie',el:'Na',cmp:'across'},look:'Press <b>Across →</b> to step from Na to Mg to Al and read <b>1st ionization energy</b>.'}}
],

/* ===================== AP Unit 2: Compound structure and properties ===================== */

ionic:[
  {id:'ionic-1',kind:'ap',type:'Long',title:'Lattice energy and Coulomb’s law',minutes:23,
    stem:'<p>The table gives data for four ionic compounds. The distance is the sum of the cation and anion radii.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Compound</th><th scope="col" style="white-space:normal">Distance between ion centers (pm)</th><th scope="col" style="white-space:normal">Lattice energy (kJ/mol)</th><th scope="col" style="white-space:normal">Melting point (°C)</th></tr></thead><tbody><tr><td style="white-space:normal">NaF</td><td style="white-space:normal">235</td><td style="white-space:normal">923</td><td style="white-space:normal">993</td></tr><tr><td style="white-space:normal">NaCl</td><td style="white-space:normal">283</td><td style="white-space:normal">786</td><td style="white-space:normal">801</td></tr><tr><td style="white-space:normal">KCl</td><td style="white-space:normal">319</td><td style="white-space:normal">715</td><td style="white-space:normal">770</td></tr><tr><td style="white-space:normal">MgO</td><td style="white-space:normal">212</td><td style="white-space:normal">3850</td><td style="white-space:normal">2852</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'explain',pts:2,q:'Explain why the lattice energy of MgO is much greater than that of NaCl. Use Coulomb’s law in your answer.',
        guide:['For saying the ion charges in MgO (2+ and 2−) are larger than in NaCl (1+ and 1−), so the product of the charges is four times as large','For saying the distance between ion centers is smaller in MgO (212 pm compared with 283 pm), which also makes the attraction stronger'],
        model:'By Coulomb’s law, the attraction between ions is proportional to q₊q₋ ÷ d. In MgO, <b>q₊q₋ = 2 × 2 = 4</b>, compared with 1 × 1 = 1 in NaCl, and the ions are <b>closer together (212 pm vs 283 pm)</b>. Both changes strengthen the attraction, so more energy is needed to separate the ions.',
        mistakes:['Mentioning only the charges. Coulomb’s law has two variables: you earn the second point by comparing the distances too.']},
      {label:'b',kind:'explain',pts:2,q:'Explain why the lattice energy of NaCl is greater than that of KCl.',
        guide:['For saying the ion charges are the same (1+ and 1−) in both compounds','For saying K⁺ is larger than Na⁺ because it has an additional occupied electron shell, so the distance between ion centers is greater in KCl and the attraction is weaker'],
        model:'The charges are the same, 1+ and 1−, so the difference comes from distance. <b>K⁺ has one more occupied electron shell</b> than Na⁺, so it is larger and the distance between ion centers is greater (319 pm vs 283 pm). By Coulomb’s law, a greater distance means a weaker attraction and a smaller lattice energy.',
        mistakes:['Saying KCl has a “bigger atom” without saying why. Name the extra electron shell.']},
      {label:'c',kind:'explain',pts:1,q:'Describe the relationship between lattice energy and melting point shown in the data, and explain it at the particle level.',
        guide:['For saying a greater lattice energy goes with a higher melting point, because melting requires overcoming more of the attraction between the oppositely charged ions'],
        model:'The compounds with greater lattice energy have <b>higher melting points</b>. To melt an ionic solid, the ions must move past each other, which means partly overcoming the attractions between oppositely charged ions. Stronger attractions take more energy, so a higher temperature.'},
      {label:'d',kind:'sketch',pts:1,q:'In the space provided, draw a particle diagram of a small region of solid NaCl that shows at least eight ions. Show the relative sizes of the ions.',
        guide:['For Na⁺ and Cl⁻ ions alternating in a regular pattern, each ion next to ions of the opposite charge, with the Cl⁻ ions drawn larger than the Na⁺ ions'],
        model:'A grid of circles in which every Na⁺ is surrounded by Cl⁻ and every Cl⁻ by Na⁺, like a checkerboard. The Cl⁻ circles are clearly larger (about 181 pm) than the Na⁺ circles (about 102 pm), and each ion is labeled with its charge.',
        mistakes:['Drawing NaCl molecules (pairs). An ionic solid is a repeating lattice with no separate molecules.','Drawing Na⁺ as the larger ion. Na⁺ has lost its third shell, so it is smaller than Cl⁻.']},
      {label:'e',kind:'explain',pts:2,q:'Solid NaCl shatters when it is struck with a hammer. Explain why, in terms of the arrangement of the ions.',
        guide:['For saying a blow shifts one layer of ions relative to the next, so ions of the same charge line up next to each other','For saying the like charges repel each other, so the crystal splits apart instead of bending'],
        model:'A blow pushes one layer of ions along the next by about one ion. Then <b>Na⁺ sits next to Na⁺ and Cl⁻ next to Cl⁻</b>. Like charges repel, so the layers push apart and the crystal cracks.'},
      {label:'f',kind:'explain',pts:2,q:'A sodium atom has a radius of about 166 pm, but a Na⁺ ion has a radius of 102 pm. Explain why the ion is smaller.',
        guide:['For saying Na loses its only 3s electron, so Na⁺ has no electrons in the third shell','For saying the remaining electrons are all in shells closer to the nucleus (n = 1 and 2), and the 11 protons now attract only 10 electrons, so the electron cloud is pulled in'],
        model:'Na ([Ne] 3s¹) loses its <b>only electron in the third shell</b>. Na⁺ has the configuration of Ne, with electrons only in the first and second shells, which are much closer to the nucleus. With 11 protons attracting 10 electrons, the remaining electrons are also held a little more tightly, so the ion is much smaller than the atom.'}
    ],
    lab:{set:{view:'energy',metal:'Mg',anion:'O'},look:'Read <b>r₊ + r₋</b>, <b>Coulomb factor</b> and <b>Lattice energy (measured)</b>. Then switch to Na with Cl, and K with Cl.'}}
],

bondtypes:[
  {id:'bondtypes-1',kind:'ap',type:'Short',title:'Four solids on the bench',minutes:9,
    stem:'<p>A student tests four solids, W, X, Y and Z.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Solid</th><th scope="col" style="white-space:normal">Melting point (°C)</th><th scope="col" style="white-space:normal">Conducts as a solid?</th><th scope="col" style="white-space:normal">Conducts as a liquid?</th></tr></thead><tbody><tr><td style="white-space:normal">W</td><td style="white-space:normal">801</td><td style="white-space:normal">No</td><td style="white-space:normal">Yes</td></tr><tr><td style="white-space:normal">X</td><td style="white-space:normal">1085</td><td style="white-space:normal">Yes</td><td style="white-space:normal">Yes</td></tr><tr><td style="white-space:normal">Y</td><td style="white-space:normal">1713</td><td style="white-space:normal">No</td><td style="white-space:normal">No</td></tr><tr><td style="white-space:normal">Z</td><td style="white-space:normal">186</td><td style="white-space:normal">No</td><td style="white-space:normal">No</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'explain',pts:1,q:'Identify the type of solid (ionic, metallic, covalent network or molecular) for each of W, X, Y and Z.',
        guide:['For all four: W ionic, X metallic, Y covalent network, Z molecular'],
        model:'<b>W: ionic. X: metallic. Y: covalent network. Z: molecular.</b>'},
      {label:'b',kind:'explain',pts:1,q:'Explain why W conducts electricity when it is melted but not when it is solid.',
        guide:['For saying W is made of ions that are held in fixed positions in the solid lattice but are free to move in the liquid, so only the liquid has mobile charged particles'],
        model:'W is made of ions. In the solid, the ions are <b>locked in place</b> in the lattice, so they can’t carry charge. When W melts, the ions can move, so the liquid conducts.',
        mistakes:['Saying electrons move through melted W. In an ionic liquid, the ions themselves carry the charge.']},
      {label:'c',kind:'explain',pts:1,q:'Explain why X conducts electricity as a solid.',
        guide:['For saying X has delocalized valence electrons (a “sea” of electrons) that move freely among the metal cations'],
        model:'X is a metal. Its valence electrons are <b>delocalized</b>, shared by all the cations rather than held by one atom, so they move through the solid when a voltage is applied.'},
      {label:'d',kind:'explain',pts:1,q:'Explain why Y melts at a much higher temperature than Z, in terms of what must be overcome when each solid melts.',
        guide:['For saying melting Y requires breaking covalent bonds throughout the network, while melting Z only requires overcoming the much weaker intermolecular forces between its molecules'],
        model:'Y is a covalent network: every atom is joined to its neighbors by covalent bonds, so melting it means <b>breaking covalent bonds</b>. Z is molecular: its molecules stay intact when it melts, and only the <b>intermolecular forces</b> between molecules are overcome. Those are much weaker than covalent bonds.',
        mistakes:['Saying molecular solids melt by breaking covalent bonds. The bonds inside each molecule stay intact.']}
    ],
    lab:{set:{sub:'NaCl',setup:'heat',temp:850},look:'Watch the <b>Tester bulb</b> as the salt melts. Then try copper, silicon dioxide and sucrose.'}}
],

lewis:[
  {id:'lewis-1',kind:'ap',type:'Long',title:'Nitrite and nitrate',minutes:23,
    stem:'<p>The nitrite ion, NO₂⁻, and the nitrate ion, NO₃⁻, both have a nitrogen atom bonded to oxygen atoms. In each ion the nitrogen atom is the central atom.</p>',
    parts:[
      {label:'a',kind:'calc',pts:1,q:'Calculate the total number of valence electrons in the NO₂⁻ ion.',
        num:{ans:18,tol:0,unit:'electrons'},
        guide:['For 18 valence electrons: 5 from N, 6 from each O, and 1 more for the negative charge'],
        model:'5 (N) + 2 × 6 (O) + 1 (for the 1− charge) = <b>18 valence electrons</b>.',
        mistakes:['Forgetting the extra electron for the negative charge. Add one electron for each negative charge, and remove one for each positive charge.']},
      {label:'b',kind:'sketch',pts:2,q:'Draw a complete Lewis electron-dot diagram for NO₂⁻ in which every atom obeys the octet rule. Then draw a second, equivalent resonance structure.',
        guide:['For a correct structure: N in the center with one N=O double bond, one N–O single bond and one lone pair on N, with 18 valence electrons in all and an octet on every atom','For the second resonance structure, with the double bond to the other O atom, and a double-headed arrow between the two structures'],
        model:'Structure 1: O=N–O, with two lone pairs on the double-bonded O, three lone pairs on the single-bonded O and one lone pair on N, all in brackets with a 1− charge. Structure 2 is the same with the double bond on the other side. A double-headed arrow (↔) connects them.',
        mistakes:['Leaving the lone pair off the nitrogen. Count: 18 − 6 (bonding) − 10 (on the O atoms) leaves 2 electrons for N.','Forgetting the brackets and charge on an ion.']},
      {label:'c',kind:'explain',pts:1,q:'Identify the formal charge on each atom in your first structure.',
        guide:['For N: 0, double-bonded O: 0, and single-bonded O: −1, which add up to the −1 charge on the ion'],
        model:'Formal charge = valence electrons − nonbonding electrons − bonds. N: 5 − 2 − 3 = <b>0</b>. Double-bonded O: 6 − 4 − 2 = <b>0</b>. Single-bonded O: 6 − 6 − 1 = <b>−1</b>. The sum is −1, the charge on the ion.'},
      {label:'d',kind:'explain',pts:2,q:'Identify the molecular geometry of NO₂⁻ and estimate the O–N–O bond angle. Justify your answers in terms of the electron domains around the nitrogen atom.',
        guide:['For bent, justified by three electron domains on N (two bonding domains and one lone pair)','For an angle a little less than 120°, because the lone pair repels the bonding domains more strongly than they repel each other'],
        model:'N has <b>three electron domains</b>: two bonding domains (the double bond counts as one domain) and <b>one lone pair</b>. Three domains point toward the corners of a triangle, but only two hold atoms, so the ion is <b>bent</b>. The lone pair spreads out more than a bonding pair and pushes the bonds together, so the angle is a little less than 120° (about 115°).',
        mistakes:['Naming the shape without naming the domains. AP readers want the count of bonding and nonbonding domains on the central atom.','Counting a double bond as two domains. A double bond is one electron domain.']},
      {label:'e',kind:'explain',pts:2,q:'Experiments show that the two N–O bonds in NO₂⁻ are identical in length. Explain why, using your resonance structures.',
        guide:['For saying neither resonance structure alone describes the ion: the real ion is an average (a resonance hybrid), with the π electrons delocalized over both N–O bonds','For saying each N–O bond therefore has a bond order of 1.5, so both bonds are the same length, between that of an N–O single bond and an N=O double bond'],
        model:'The real ion is not switching between the two structures. It is a <b>resonance hybrid</b>: the electrons of the second bond are delocalized over both N–O bonds. Each bond has a <b>bond order of 1.5</b>, so both bonds have the same length, shorter than an N–O single bond and longer than an N=O double bond.',
        mistakes:['Saying the double bond “flips back and forth” between the two positions. The electrons are delocalized all the time.']},
      {label:'f',kind:'explain',pts:2,q:'Predict whether the N–O bonds in NO₃⁻ are longer than, shorter than or the same length as the N–O bonds in NO₂⁻. Justify your prediction.',
        guide:['For predicting that the N–O bonds in NO₃⁻ are longer','For justifying with bond order: NO₃⁻ has three equivalent resonance structures, so each N–O bond has a bond order of 4/3 (about 1.33), lower than 1.5, and a lower bond order means a longer bond'],
        model:'<b>Longer.</b> NO₃⁻ has one N=O double bond and two single bonds, shared among three equivalent resonance structures, so each bond has a bond order of 4 ÷ 3 ≈ 1.33. In NO₂⁻ the bond order is 1.5. Fewer shared electrons per bond means a weaker attraction pulling the atoms together, so the NO₃⁻ bonds are longer.'}
    ],
    lab:{set:{mol:'NO2',fc:true},act:'answer',look:'Compare with your structure, read the <b>Electron domains on the central atom</b>, then press <b>Next resonance structure</b>. Switch to NO₃⁻ to count its resonance structures.'}}
],

vsepr:[
  {id:'vsepr-1',kind:'ap',type:'Short',title:'Same formula pattern, different shapes',minutes:9,
    stem:'<p>Boron trifluoride, BF₃, and ammonia, NH₃, both have a central atom bonded to three other atoms. The central boron atom in BF₃ has no lone pairs; the central nitrogen atom in NH₃ has one lone pair.</p>',
    parts:[
      {label:'a',kind:'explain',pts:2,q:'Identify the molecular geometry of BF₃ and of NH₃. Justify each answer in terms of the electron domains around the central atom.',
        guide:['For BF₃: trigonal planar, because B has three electron domains, all bonding, with no lone pairs','For NH₃: trigonal pyramidal, because N has four electron domains (three bonding and one lone pair)'],
        model:'<b>BF₃ is trigonal planar.</b> B has three bonding domains and no lone pairs, so they spread out to 120° in a plane. <b>NH₃ is trigonal pyramidal.</b> N has four electron domains, three bonding and one lone pair, arranged tetrahedrally. With atoms at only three of the four corners, the shape is a pyramid.',
        mistakes:['Calling NH₃ trigonal planar because it has three atoms around N. The lone pair is a domain too.','Calling NH₃ tetrahedral. That is its electron-domain geometry, not its molecular geometry.']},
      {label:'b',kind:'explain',pts:1,q:'The H–N–H bond angle in NH₃ is about 107°, less than the 109.5° of a perfect tetrahedron. Explain why.',
        guide:['For saying the lone pair repels the bonding pairs more strongly than they repel each other, pushing the N–H bonds closer together'],
        model:'The lone pair is held by only one nucleus, so it spreads out closer to N and <b>repels the bonding pairs more strongly</b> than they repel each other. That squeezes the H–N–H angles below 109.5°.'},
      {label:'c',kind:'explain',pts:1,q:'Identify the hybridization of the central atom in BF₃ and in NH₃.',
        guide:['For sp² on B and sp³ on N'],
        model:'Three electron domains: <b>sp² on B</b>. Four electron domains: <b>sp³ on N</b>.'}
    ],
    lab:{set:{mode:'real',mol:'NH3',angles:true,lps:true,ghost:true},look:'Read <b>Electron domains</b> and <b>Bond angles, measured</b>, and compare with the ideal angles. Then switch to BF₃.'}}
],

polarity:[
  {id:'polarity-1',kind:'ap',type:'Short',title:'Two triatomic molecules',minutes:9,
    stem:'<p>Carbon dioxide, CO₂, and sulfur dioxide, SO₂, each have a central atom bonded to two oxygen atoms. Electronegativities: C 2.55, S 2.58, O 3.44.</p>',
    parts:[
      {label:'a',kind:'explain',pts:2,q:'CO₂ is a nonpolar molecule, even though its bonds are polar. Explain why.',
        guide:['For saying each C=O bond is polar because O is more electronegative than C, so the electrons are pulled toward O','For saying CO₂ is linear (two electron domains on C and no lone pairs), so the two equal bond dipoles point in opposite directions and cancel'],
        model:'O is more electronegative than C (3.44 vs 2.55), so <b>each C=O bond is polar</b>, with δ− on O. But C has two electron domains and no lone pairs, so CO₂ is <b>linear</b>. The two equal bond dipoles point in opposite directions and cancel, so there is no net dipole.',
        mistakes:['Saying CO₂ is nonpolar because its bonds are nonpolar. They are polar; the shape makes them cancel.']},
      {label:'b',kind:'explain',pts:2,q:'SO₂ is a polar molecule. Explain why, in terms of its molecular geometry.',
        guide:['For saying S has three electron domains, two bonding and one lone pair, so SO₂ is bent','For saying the two S–O bond dipoles are not opposite each other, so they do not cancel and the molecule has a net dipole'],
        model:'S has <b>three electron domains, including a lone pair</b>, so SO₂ is <b>bent</b> (about 119°). The S–O bond dipoles both point partly in the same direction, toward the O side, so they do not cancel. The molecule has a net dipole, with the O end partially negative.',
        mistakes:['Leaving out the lone pair. It is the lone pair on S that makes SO₂ bent while CO₂ is linear.']}
    ],
    lab:{set:{mode:'mol',mol:'SO2',bdip:true,field:true},look:'Watch whether the molecule lines up in the electric field and read <b>The molecule is</b>. Then switch to CO₂.'}}
],

/* ===================== AP Unit 3: Properties of substances and mixtures ===================== */

imf:[
  {id:'imf-1',kind:'ap',type:'Long',title:'Three compounds with 26 electrons',minutes:23,
    stem:'<p>Ethanol, dimethyl ether and propane all have 26 electrons per molecule.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Compound</th><th scope="col" style="white-space:normal">Molar mass (g/mol)</th><th scope="col" style="white-space:normal">Normal boiling point (°C)</th></tr></thead><tbody><tr><td style="white-space:normal">Ethanol,<br>CH₃CH₂OH</td><td style="white-space:normal">46.07</td><td style="white-space:normal">78.4</td></tr><tr><td style="white-space:normal">Dimethyl ether,<br>CH₃OCH₃</td><td style="white-space:normal">46.07</td><td style="white-space:normal">−24.8</td></tr><tr><td style="white-space:normal">Propane,<br>CH₃CH₂CH₃</td><td style="white-space:normal">44.10</td><td style="white-space:normal">−42.1</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'explain',pts:2,q:'Ethanol and dimethyl ether have the same molecular formula, C₂H₆O, but ethanol boils more than 100 °C higher. Explain this difference in terms of the intermolecular forces between molecules of each substance.',
        guide:['For saying ethanol molecules hydrogen bond to each other: the H on the O of one molecule is attracted to a lone pair on the O of another molecule','For saying dimethyl ether has no H bonded to O, so it cannot hydrogen bond to itself; its strongest forces are weaker dipole–dipole forces, so less energy is needed to separate its molecules'],
        model:'An ethanol molecule has an O–H group, so <b>hydrogen bonds form between ethanol molecules</b>: the partially positive H on one molecule’s O is attracted to a lone pair on another molecule’s O. In dimethyl ether every H is bonded to C, so there are <b>no hydrogen bonds between its molecules</b>, only dipole–dipole and dispersion forces. These are weaker, so less energy is needed to separate dimethyl ether molecules, and it boils at a lower temperature.',
        mistakes:['Saying ethanol has “stronger bonds”. Boiling separates molecules; it never breaks the covalent bonds inside them.','Saying “ethanol has hydrogen bonding” without saying between which particles. Name the force and the particles: hydrogen bonds between ethanol molecules.']},
      {label:'b',kind:'explain',pts:2,q:'Explain why dimethyl ether boils at a higher temperature than propane.',
        guide:['For saying both have 26 electrons and similar molar masses, so their London dispersion forces are about the same strength','For saying dimethyl ether is polar (a bent C–O–C with polar C–O bonds), so it has dipole–dipole forces between its molecules in addition, while propane is essentially nonpolar'],
        model:'With the same number of electrons and nearly the same size, the two have <b>London dispersion forces of about the same strength</b>. Dimethyl ether is also <b>polar</b>: its C–O bonds are polar and the C–O–C shape is bent, so there are dipole–dipole attractions between its molecules too. Propane has almost none. The extra attractions raise dimethyl ether’s boiling point.',
        mistakes:['Comparing only molar masses. They are nearly equal here, so the polarity is what differs.']},
      {label:'c',kind:'sketch',pts:1,q:'In the space provided, draw two ethanol molecules and use a dashed line to show one hydrogen bond between them.',
        guide:['For a dashed line between the H of the O–H group on one molecule and an O atom on the other molecule (not to an H bonded to C)'],
        model:'Two CH₃CH₂–O–H molecules. A dashed line runs from the H on the first molecule’s O to a lone pair on the second molecule’s O, with O–H···O roughly in a line.',
        mistakes:['Drawing the dashed line between the O and H inside one molecule. That is a covalent bond; a hydrogen bond is between molecules.','Drawing a hydrogen bond to an H on a carbon. C–H hydrogens are not partially positive enough.']},
      {label:'d',kind:'explain',pts:2,q:'At −50 °C, all three substances are liquids. Rank them in order of increasing vapor pressure at −50 °C, and justify your ranking.',
        guide:['For the order ethanol < dimethyl ether < propane','For saying that at the same temperature, weaker intermolecular forces let a larger fraction of molecules escape from the surface into the vapor, so the substance with the weakest forces has the highest vapor pressure'],
        model:'<b>Ethanol &lt; dimethyl ether &lt; propane.</b> At the same temperature the molecules of all three have the same average kinetic energy. The weaker the attractions holding molecules in the liquid, the larger the fraction that have enough energy to escape, so the vapor pressure is higher. Propane has the weakest forces (dispersion only) and ethanol the strongest (hydrogen bonding).'},
      {label:'e',kind:'explain',pts:2,q:'Ethanol mixes with water in all proportions, but propane barely dissolves in water. Explain this difference in terms of intermolecular forces.',
        guide:['For saying ethanol forms hydrogen bonds with water molecules, so the attractions in the mixture are similar in strength to those in the pure liquids','For saying propane can form only weak dispersion attractions with water molecules, which cannot make up for the hydrogen bonds between water molecules that would have to be broken'],
        model:'Ethanol molecules can <b>hydrogen bond with water molecules</b>, so mixing replaces ethanol–ethanol and water–water hydrogen bonds with ethanol–water hydrogen bonds of similar strength. Propane is nonpolar: it can only form <b>weak dispersion attractions with water</b>. To dissolve, it would have to break water’s hydrogen bonds without forming anything as strong, so it stays separate.'},
      {label:'f',kind:'explain',pts:1,q:'Identify which of the three substances has the greatest molar enthalpy of vaporization, ΔH°vap. Justify your answer.',
        guide:['For ethanol, because it has the strongest intermolecular forces (hydrogen bonding), so the most energy is needed per mole to separate its molecules'],
        model:'<b>Ethanol.</b> ΔH°vap is the energy needed to separate a mole of molecules from the liquid. Ethanol’s hydrogen bonds are the strongest attractions of the three, so it needs the most energy (38.6 kJ/mol, compared with 21.5 kJ/mol for dimethyl ether and 19.0 kJ/mol for propane).'}
    ],
    lab:{set:{mode:'pair',a:'C2H5OH',b:'CH3OCH3',all:true},look:'Read each <b>strongest force</b>, <b>boiling point</b> and <b>ΔHvap</b>. Then set substance B to propane (C₃H₈).'}}
],

gaslaws:[
  {id:'gaslaws-1',kind:'ap',type:'Long',title:'Carbon dioxide in a steel tank',minutes:23,
    stem:'<p>A rigid 4.00 L steel container holds 0.750 mol of CO₂(g) at 300. K. Use R = 0.08206 L·atm/(mol·K).</p>',
    parts:[
      {label:'a',kind:'calc',pts:2,q:'Calculate the pressure, in atm, of the CO₂ in the container, assuming it behaves as an ideal gas.',
        num:{ans:4.62,tol:0.02,unit:'atm'},
        guide:['For using PV = nRT with R = 0.08206 L·atm/(mol·K) and T in kelvins','For 4.62 atm, with units and three significant figures'],
        model:'P = nRT ÷ V = (0.750 mol)(0.08206 L·atm/(mol·K))(300. K) ÷ 4.00 L = <b>4.62 atm</b>.',
        mistakes:['Using R = 8.314 with liters and atm. Match R to your units: 0.08206 L·atm/(mol·K).','Reporting 4.615875 atm. The data have three significant figures, so the answer does too.']},
      {label:'b',kind:'explain',pts:2,q:'The measured pressure in the container is 4.52 atm, lower than the value in part (a). Explain why, in terms of the interactions between CO₂ molecules.',
        guide:['For saying CO₂ molecules attract each other through London dispersion forces, which an ideal gas does not have','For saying these attractions pull molecules back toward each other as they approach a wall, so they strike the walls with less force, which lowers the pressure'],
        model:'An ideal gas has no attractions between particles, but real <b>CO₂ molecules attract each other through London dispersion forces</b>. A molecule about to hit the wall is pulled back slightly by the molecules behind it, so it <b>strikes the wall with less force</b>. Less force per collision means a lower pressure than PV = nRT predicts.',
        mistakes:['Blaming the size of the molecules. Molecular volume makes the real pressure higher, not lower; the attractions explain a lower pressure.']},
      {label:'c',kind:'explain',pts:2,q:'The container is emptied and refilled with 0.750 mol of helium at 300. K. Identify whether the helium or the CO₂ behaves more like an ideal gas under these conditions, and justify your answer.',
        guide:['For identifying helium','For saying a He atom has only 2 electrons, so its electron cloud is much less polarizable than that of CO₂ (22 electrons), so its dispersion forces are much weaker (He atoms are also smaller)'],
        model:'<b>Helium.</b> A He atom has only 2 electrons, held tightly in a small cloud that is hard to polarize, so its London dispersion forces are much weaker than those between CO₂ molecules, which have 22 electrons. Helium atoms are also smaller, so they take up less of the container’s volume.',
        mistakes:['Saying helium is ideal because it is a noble gas. Give the reason: few electrons, weak dispersion forces.']},
      {label:'d',kind:'calc',pts:2,q:'The container of CO₂ is heated to 450. K. Calculate the new pressure, assuming ideal behavior.',
        num:{ans:6.92,tol:0.03,unit:'atm'},
        guide:['For using P₁ ÷ T₁ = P₂ ÷ T₂ with both temperatures in kelvins (or PV = nRT again)','For 6.92 atm'],
        model:'At constant n and V, P₂ = P₁ × (T₂ ÷ T₁) = 4.616 atm × (450. K ÷ 300. K) = <b>6.92 atm</b>. (Starting from the rounded 4.62 atm gives 6.93 atm, which also earns the point. Carry an extra digit to avoid that rounding drift.)',
        mistakes:['Using Celsius temperatures. Gas law ratios only work in kelvins.']},
      {label:'e',kind:'explain',pts:2,q:'Use kinetic molecular theory to explain why the pressure increases when the gas is heated at constant volume.',
        guide:['For saying the average kinetic energy, and so the average speed, of the molecules increases with temperature','For saying faster molecules strike the walls more often and with more force, so the pressure increases'],
        model:'Raising the temperature <b>raises the average kinetic energy</b> of the molecules, so they move faster on average. Faster molecules hit the walls <b>more often and with more force</b> per collision. With the same wall area, that means a greater pressure.'}
    ],
    lab:{set:{mode:'box',hold:'V',vol:4,T:300,mol:0.75,gas:'CO2',punit:'atm'},look:'Read <b>Pressure (gauge)</b>, <b>Pressure from PV = nRT</b> and <b>Compressibility Z</b>. Switch the gas to helium, then raise the temperature to 450 K.'}}
],

kmt:[
  {id:'kmt-1',kind:'ap',type:'Short',title:'Two gases at the same temperature',minutes:9,
    stem:'<p>A container holds equal numbers of N₂ molecules (28.01 g/mol) and CO₂ molecules (44.01 g/mol) at 300 K.</p>',
    parts:[
      {label:'a',kind:'explain',pts:1,q:'Compare the average kinetic energy of the N₂ molecules with that of the CO₂ molecules. Justify your answer.',
        guide:['For saying they are equal, because the average kinetic energy of gas particles depends only on the temperature, and both gases are at 300 K'],
        model:'They are <b>equal</b>. The average kinetic energy of the particles in a gas depends only on temperature, and both gases are at 300 K.',
        mistakes:['Saying the heavier CO₂ molecules have more kinetic energy. At the same temperature they move more slowly, so ½mv² comes out the same.']},
      {label:'b',kind:'explain',pts:1,q:'Identify which gas has the greater average molecular speed. Justify your answer.',
        guide:['For N₂, because both gases have the same average kinetic energy (½mv²), so the molecules with the smaller mass must move faster on average'],
        model:'<b>N₂.</b> Both gases have the same average kinetic energy, ½mv². An N₂ molecule has less mass than a CO₂ molecule, so to have the same kinetic energy it must move faster on average.',
        mistakes:['Saying CO₂ is faster because it is bigger or “has more energy”. At the same temperature, lighter means faster.']},
      {label:'c',kind:'sketch',pts:2,q:'On a graph of number of molecules (y-axis) against molecular speed (x-axis), sketch the distribution of speeds for N₂ at 300 K. On the same axes, sketch and label the distribution for CO₂ at 300 K.',
        guide:['For a CO₂ curve whose peak is at a lower speed than the N₂ curve','For a CO₂ curve that is taller and narrower than the N₂ curve, so the areas under the two curves are equal (the same number of molecules)'],
        model:'Both curves start at zero, rise to a peak and tail off to the right. The <b>CO₂ curve peaks at a lower speed</b> (its most probable speed is about 337 m/s, compared with about 422 m/s for N₂) and is <b>taller and narrower</b>, because the same number of molecules is packed into a narrower range of speeds.',
        mistakes:['Drawing the CO₂ curve shorter as well as shifted left. The areas must match, so a narrower curve has to be taller.']}
    ],
    lab:{set:{mode:'dist',gasA:'N2',gasB:'CO2',T:300,nA:50,nB:50},look:'Compare the <b>Average speed</b> of the two gases. Their <b>Average kinetic energy</b> comes out about the same; it wobbles a little because only 100 molecules are counted. Watch the two speed distributions.'}}
],

phasediagram:[
  {id:'phasediagram-1',kind:'ap',type:'Short',title:'Boiling water in Aurora',minutes:9,
    stem:'<p>In Aurora, Colorado, the air pressure is about 0.83 atm. A pot of water heated there boils at about 94.9 °C, while at sea level (1.00 atm) water boils at 100.0 °C.</p>',
    parts:[
      {label:'a',kind:'explain',pts:2,q:'Explain why water boils at a lower temperature in Aurora than at sea level. Your answer should refer to the vapor pressure of the water.',
        guide:['For saying a liquid boils when its vapor pressure equals the pressure of the air above it','For saying vapor pressure increases with temperature, so water’s vapor pressure reaches 0.83 atm at a lower temperature than it takes to reach 1.00 atm'],
        model:'A liquid boils when its <b>vapor pressure equals the external pressure</b>. Water’s vapor pressure rises as it gets hotter, because more molecules have enough energy to escape the liquid. In Aurora it only has to reach 0.83 atm, which happens at about 94.9 °C, <b>before</b> it reaches 1.00 atm at 100.0 °C.',
        mistakes:['Saying there is “less oxygen” or “thinner air” in the water. The air pressure on the surface is what matters.','Saying boiling happens when the water reaches 100 °C. That is only true at 1.00 atm.']},
      {label:'b',kind:'explain',pts:1,q:'Describe how the arrangement and motion of water molecules in the liquid differ from those in the steam above it, both at 94.9 °C.',
        guide:['For saying molecules in the liquid are close together, in contact and held near each other by hydrogen bonds while they move past one another, while molecules in the gas are far apart and move freely with almost no attractions between them'],
        model:'In the <b>liquid</b>, the molecules are close together and touching, constantly moving past one another but held near each other by hydrogen bonds. In the <b>steam</b>, the molecules are far apart, moving freely in straight lines between collisions, and the attractions between them are negligible.'},
      {label:'c',kind:'explain',pts:1,q:'While the water is boiling, its temperature stays at 94.9 °C even though the burner keeps adding energy. Explain where the energy goes.',
        guide:['For saying the energy is used to overcome the hydrogen bonds (intermolecular forces) between water molecules as they leave the liquid, not to increase their average kinetic energy, so the temperature stays the same'],
        model:'Temperature measures the <b>average kinetic energy</b> of the molecules. During boiling, the added energy goes into <b>overcoming the hydrogen bonds</b> that hold molecules in the liquid, so molecules escape into the gas without moving faster on average. The temperature stays at the boiling point until the liquid is gone.',
        mistakes:['Saying the energy breaks the O–H bonds in the water molecules. Boiling separates whole molecules; the covalent bonds stay intact.']}
    ],
    lab:{set:{sub:'water',scene:'denver'},act:'go',look:'Watch the point move right at 0.83 atm and read <b>Boiling point at this pressure</b>. Then choose the pressure cooker (2.0 atm) and run it again.'}}
],

dissolve:[
  {id:'dissolve-1',kind:'ap',type:'Short',title:'Salt and sugar in water',minutes:9,
    stem:'<p>A student dissolves 20 g of NaCl in 100 g of water in one beaker and 20 g of sucrose, C₁₂H₂₂O₁₁, in 100 g of water in another. Both solids dissolve completely.</p>',
    parts:[
      {label:'a',kind:'sketch',pts:2,q:'In the space provided, draw a particle diagram of one Na⁺ ion and one Cl⁻ ion in the solution. Show at least three water molecules around each ion, drawn with the correct orientation.',
        guide:['For water molecules around Na⁺ with their O atoms (the partially negative end) pointed toward the ion','For water molecules around Cl⁻ with their H atoms (the partially positive end) pointed toward the ion'],
        model:'Na⁺ is surrounded by water molecules whose <b>O atoms face the ion</b>, with the H atoms pointing away. Cl⁻ is surrounded by water molecules turned the other way, with <b>one H atom of each molecule pointing at the ion</b>. The two ions are separate, not touching.',
        mistakes:['Drawing water with its O toward Cl⁻. The negative ion attracts the partially positive H end.','Drawing Na⁺ and Cl⁻ still paired. In solution the ions are separated and each is surrounded by water.']},
      {label:'b',kind:'explain',pts:1,q:'Identify the type of attraction between the ions and the water molecules.',
        guide:['For ion–dipole attractions'],
        model:'<b>Ion–dipole</b> attractions, between each ion and the oppositely charged end of the polar water molecules.'},
      {label:'c',kind:'explain',pts:1,q:'The NaCl solution conducts electricity, but the sucrose solution does not. Explain this difference in terms of the particles in each solution.',
        guide:['For saying NaCl dissociates into mobile Na⁺ and Cl⁻ ions that carry charge, while sucrose dissolves as neutral molecules, so its solution has no ions to carry current'],
        model:'NaCl <b>dissociates into Na⁺ and Cl⁻ ions</b> that move through the solution and carry charge. Sucrose dissolves as <b>whole, neutral molecules</b>, so there are no charged particles to carry a current.',
        mistakes:['Saying the NaCl solution conducts because electrons move through it. In solutions, ions carry the charge.']}
    ],
    lab:{set:{solute:'NaCl',mass:20,T:25,stir:true},act:'ff',look:'Watch the zoom-in circle and the <b>Conductivity bulb</b>. Then switch the solute to sugar.'}}
],

molarity:[
  {id:'molarity-1',kind:'ap',type:'Short',title:'Making a copper(II) sulfate solution',minutes:9,
    stem:'<p>A student makes 250.00 mL of 0.1000 M CuSO₄ solution in a volumetric flask, using solid copper(II) sulfate pentahydrate, CuSO₄·5H₂O (molar mass 249.68 g/mol).</p>',
    parts:[
      {label:'a',kind:'calc',pts:2,q:'Calculate the mass of CuSO₄·5H₂O the student must weigh out.',
        num:{ans:6.242,tol:0.005,unit:'g'},
        guide:['For moles of solute = 0.1000 mol/L × 0.25000 L = 0.02500 mol','For 6.242 g, using the molar mass of the hydrate (249.68 g/mol)'],
        model:'n = M × V = (0.1000 mol/L)(0.25000 L) = 0.02500 mol. Each mole of the hydrate gives one mole of CuSO₄, so mass = 0.02500 mol × 249.68 g/mol = <b>6.242 g</b>.',
        mistakes:['Using the molar mass of anhydrous CuSO₄ (159.60 g/mol). You weigh the hydrate, water and all.','Using 250.00 mL instead of 0.25000 L. Molarity is moles per liter.']},
      {label:'b',kind:'calc',pts:1,q:'The student uses a volumetric pipet to transfer 10.00 mL of this solution into a 100.00 mL volumetric flask and fills it to the mark with water. Calculate the concentration of the diluted solution.',
        num:{ans:0.01000,tol:0.0001,unit:'M'},
        guide:['For M₂ = M₁V₁ ÷ V₂ = (0.1000 M)(10.00 mL) ÷ 100.00 mL = 0.01000 M'],
        model:'M₁V₁ = M₂V₂, so M₂ = (0.1000 M)(10.00 mL) ÷ (100.00 mL) = <b>0.01000 M</b>.'},
      {label:'c',kind:'explain',pts:1,q:'While making the first solution, the student accidentally adds water above the 250.00 mL mark on the flask. Would the concentration of the solution be higher than, lower than or equal to 0.1000 M? Justify your answer.',
        guide:['For saying lower, because the same number of moles of solute is now in a larger volume of solution'],
        model:'<b>Lower.</b> The moles of CuSO₄ are fixed by the mass weighed. Extra water makes the volume of solution greater than 0.25000 L, and M = mol ÷ L, so the concentration is less than 0.1000 M.'}
    ],
    lab:{set:{mode:'flask',solute:'CuSO4',fl:'250',mg:6.24},act:'skip',look:'Read <b>Concentration (molarity)</b>. Then switch the setup to <b>Dilute a stock</b> with a 10.00 mL pipet and a 100.00 mL flask.'}}
],

separation:[
  {id:'separation-1',kind:'ap',type:'Short',title:'Paper chromatography of marker ink',minutes:9,
    stem:'<p>A spot of black marker ink is placed near the bottom of a strip of chromatography paper, and the strip is stood in water. In this setup, a dye travels farther when its attractions to the moving water are stronger compared with its attractions to the paper. When the water has moved 8.00 cm, the ink has split into three spots.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">Dye</th><th scope="col" style="white-space:normal">Distance from the starting line (cm)</th></tr></thead><tbody><tr><td style="white-space:normal">Yellow</td><td style="white-space:normal">6.96</td></tr><tr><td style="white-space:normal">Magenta</td><td style="white-space:normal">4.72</td></tr><tr><td style="white-space:normal">Blue</td><td style="white-space:normal">2.80</td></tr></tbody></table></div>',
    parts:[
      {label:'a',kind:'calc',pts:1,q:'Calculate the R<sub>f</sub> value of the blue dye.',
        num:{ans:0.350,tol:0.005,unit:''},
        guide:['For Rf = 2.80 cm ÷ 8.00 cm = 0.350'],
        model:'R<sub>f</sub> = distance moved by the dye ÷ distance moved by the solvent = 2.80 cm ÷ 8.00 cm = <b>0.350</b>.',
        mistakes:['Dividing the solvent distance by the dye distance. Rf is always between 0 and 1.']},
      {label:'b',kind:'explain',pts:2,q:'Identify the most polar dye. Justify your answer in terms of the intermolecular forces between the dye and water.',
        guide:['For identifying the yellow dye','For saying the most polar dye has the strongest attractions (dipole–dipole forces or hydrogen bonds) to the polar water molecules, so it spends more time dissolved in the moving water and travels farthest'],
        model:'<b>Yellow</b>, the dye with the highest R<sub>f</sub> (0.870). Water is polar, so the most polar dye forms the <b>strongest dipole–dipole attractions or hydrogen bonds with water molecules</b>. It spends the most time dissolved in the moving water instead of sticking to the paper, so it travels the farthest.',
        mistakes:['Saying the yellow dye is “lighter” or “smaller”. Explain with intermolecular forces between the dye and the solvent.']},
      {label:'c',kind:'explain',pts:1,q:'The experiment is repeated with isopropanol, a less polar solvent, in place of water. Predict which dye will travel farthest, and justify your prediction.',
        guide:['For predicting blue, because the least polar dye is attracted most strongly to the less polar solvent (its dispersion attractions to isopropanol are the most favorable relative to its attractions to the paper)'],
        model:'<b>Blue should now travel farthest.</b> The blue dye is the least polar. With a less polar solvent, the least polar dye should be the one most attracted to the moving liquid relative to the paper, so the order of the spots should reverse.'}
    ],
    lab:{set:{mix:'ink',solv:'water'},act:'chrom',look:'Read <b>Rf values</b> once the solvent front has moved. Then switch the solvent to isopropanol and run it again.'}}
],

beerslaw:[
  {id:'beerslaw-1',kind:'ap',type:'Long',title:'Copper in a brass sample',minutes:23,
    stem:'<p>A 0.500 g sample of brass, an alloy of copper and zinc, is dissolved in nitric acid. The solution is diluted with water to exactly 100.00 mL in a volumetric flask. All the copper is now present as Cu²⁺(aq), which is blue; Zn²⁺(aq) is colorless. A student measures the absorbance of four Cu²⁺ standard solutions at 805 nm in a cuvette with a path length of 1.00 cm.</p><div class="fq-tw"><table class="fq-data"><thead><tr><th scope="col" style="white-space:normal">[Cu²⁺] (M)</th><th scope="col" style="white-space:normal">Absorbance at 805 nm</th></tr></thead><tbody><tr><td style="white-space:normal">0.0200</td><td style="white-space:normal">0.240</td></tr><tr><td style="white-space:normal">0.0400</td><td style="white-space:normal">0.480</td></tr><tr><td style="white-space:normal">0.0600</td><td style="white-space:normal">0.720</td></tr><tr><td style="white-space:normal">0.0800</td><td style="white-space:normal">0.960</td></tr></tbody></table></div><p>The absorbance of the brass solution at 805 nm is 0.661.</p>',
    parts:[
      {label:'a',kind:'explain',pts:1,q:'The absorbance spectrum of Cu²⁺(aq) has its maximum at 805 nm. Justify the student’s choice of 805 nm for the measurements.',
        guide:['For saying 805 nm is the wavelength of maximum absorbance (λmax), so the absorbance changes the most for a given change in concentration, which makes the measurement most sensitive'],
        model:'At λ<sub>max</sub>, Cu²⁺ absorbs the most light, so <b>each change in concentration gives the largest change in absorbance</b>. That makes the measurement as sensitive and precise as possible.'},
      {label:'b',kind:'calc',pts:2,q:'Use the data for the standards to calculate the molar absorptivity, ε, of Cu²⁺ at 805 nm. Include units.',
        num:{ans:12.0,tol:0.1,unit:'M⁻¹ cm⁻¹'},
        guide:['For using A = εbc with the slope of the standards (or with one standard): ε = A ÷ (bc)','For 12.0 M⁻¹ cm⁻¹, with units'],
        model:'The absorbance rises 0.240 for every 0.0200 M, so the slope is 0.240 ÷ 0.0200 M = 12.0 M⁻¹. Slope = εb, so ε = 12.0 M⁻¹ ÷ 1.00 cm = <b>12.0 M⁻¹ cm⁻¹</b>.',
        mistakes:['Leaving out the units. ε must make A = εbc unitless, so its units are M⁻¹ cm⁻¹.']},
      {label:'c',kind:'calc',pts:2,q:'Calculate the concentration of Cu²⁺ in the brass solution.',
        num:{ans:0.0551,tol:0.0003,unit:'M'},
        guide:['For c = A ÷ (εb) = 0.661 ÷ (12.0 M⁻¹ cm⁻¹ × 1.00 cm)','For 0.0551 M, with three significant figures'],
        model:'c = A ÷ (εb) = 0.661 ÷ (12.0 M⁻¹ cm⁻¹ × 1.00 cm) = <b>0.0551 M</b>.',
        mistakes:['Writing 0.05508333 M. Three significant figures in the data means three in the answer.']},
      {label:'d',kind:'calc',pts:2,q:'Calculate the percent by mass of copper in the brass sample.',
        num:{ans:70.0,tol:0.3,unit:'%'},
        guide:['For moles of Cu = 0.0551 mol/L × 0.10000 L = 5.51 × 10⁻³ mol, and mass of Cu = 5.51 × 10⁻³ mol × 63.55 g/mol = 0.350 g','For 70.0% copper by mass'],
        model:'mol Cu²⁺ = 0.0551 mol/L × 0.10000 L = 5.51 × 10⁻³ mol. Mass of Cu = 5.51 × 10⁻³ mol × 63.55 g/mol = 0.350 g. Percent Cu = 0.350 g ÷ 0.500 g × 100 = <b>70.0%</b>.',
        mistakes:['Forgetting the volume. Concentration × volume gives moles; 0.0551 M is not 0.0551 mol.']},
      {label:'e',kind:'explain',pts:2,q:'Before measuring the brass solution, the student rinsed the cuvette with distilled water and did not dry it or rinse it with the brass solution. Would the calculated percent of copper be too high, too low or unaffected? Justify your answer.',
        guide:['For saying too low','For saying the leftover water dilutes the brass solution in the cuvette, so its absorbance reads lower, which gives a lower calculated [Cu²⁺] and a lower mass of copper'],
        model:'<b>Too low.</b> Water left in the cuvette dilutes the brass solution, so fewer Cu²⁺ ions are in the light path and the <b>absorbance reads low</b>. A lower absorbance gives a lower calculated [Cu²⁺], fewer moles of Cu and a lower mass percent.',
        mistakes:['Stopping at “the absorbance changes”. Follow the error all the way to the final answer: absorbance, then concentration, then percent Cu.']},
      {label:'f',kind:'explain',pts:1,q:'Explain why a solution of Cu²⁺(aq) looks blue, in terms of the light it absorbs.',
        guide:['For saying Cu²⁺ absorbs red (and near-infrared) light, around its λmax at 805 nm, so the light that passes through is mostly blue'],
        model:'Cu²⁺ absorbs most strongly at the red end of the spectrum and beyond it. White light passing through <b>loses its red and orange light</b>, so what reaches your eye is mostly blue.'}
    ],
    lab:{set:{mode:'brass',lam:805,path:'1.00',stray:0,bm:0.5,cuv:'unk'},look:'Read <b>Absorbance A</b> for the brass sample. Then switch to Standard, save standards at 0.0200, 0.0400, 0.0600 and 0.0800 M, switch back to the unknown, and read <b>Percent copper in the brass</b>.'}}
],

light:[
  {id:'light-1',kind:'ap',type:'Short',title:'Breaking chlorine with light',minutes:9,
    stem:'<p>Light can split Cl₂ molecules into chlorine atoms if each photon has enough energy. The Cl–Cl bond energy is 242 kJ/mol. Use h = 6.626 × 10⁻³⁴ J·s, c = 2.998 × 10⁸ m/s and Avogadro’s number 6.022 × 10²³ mol⁻¹.</p>',
    parts:[
      {label:'a',kind:'calc',pts:2,q:'Calculate the longest wavelength of light, in nm, that can break a single Cl–Cl bond.',
        num:{ans:494,tol:2,unit:'nm'},
        guide:['For converting the bond energy to the energy of one bond: 242,000 J/mol ÷ 6.022 × 10²³ mol⁻¹ = 4.02 × 10⁻¹⁹ J','For λ = hc ÷ E = 4.94 × 10⁻⁷ m = 494 nm'],
        model:'E per bond = 242,000 J/mol ÷ 6.022 × 10²³ mol⁻¹ = 4.02 × 10⁻¹⁹ J. λ = hc ÷ E = (6.626 × 10⁻³⁴ J·s)(2.998 × 10⁸ m/s) ÷ 4.02 × 10⁻¹⁹ J = 4.94 × 10⁻⁷ m = <b>494 nm</b>.',
        mistakes:['Using 242 J instead of 242,000 J. Convert kJ to J first.','Using the energy per mole in E = hc/λ. That equation is for one photon, so divide by Avogadro’s number.']},
      {label:'b',kind:'calc',pts:1,q:'Calculate the energy of one photon of red light with a wavelength of 650 nm.',
        num:{ans:3.06e-19,tol:0.02e-19,unit:'J'},
        guide:['For E = hc ÷ λ = 3.06 × 10⁻¹⁹ J'],
        model:'E = hc ÷ λ = (6.626 × 10⁻³⁴ J·s)(2.998 × 10⁸ m/s) ÷ (650 × 10⁻⁹ m) = <b>3.06 × 10⁻¹⁹ J</b>.'},
      {label:'c',kind:'explain',pts:1,q:'A student claims that a bright enough red laser (650 nm) will eventually break Cl–Cl bonds. Explain why the student is wrong.',
        guide:['For saying a brighter laser sends more photons per second, but each photon still has only 3.06 × 10⁻¹⁹ J, less than the 4.02 × 10⁻¹⁹ J needed, and one photon breaks at most one bond, so no bonds break'],
        model:'Brightness changes the <b>number of photons</b>, not the energy of each one. Each 650 nm photon carries 3.06 × 10⁻¹⁹ J, less than the 4.02 × 10⁻¹⁹ J one bond needs, and a single photon is absorbed by a single bond. So no matter how bright the laser, no Cl–Cl bonds break.'}
    ],
    lab:{set:{target:'bond',bond:'cl2',pre:'red',ph:true},look:'Watch the Cl₂ molecules under red light. Then jump to the blue LED (450 nm) and compare <b>Bonds broken</b>.'}}
],

spectra:[
  {id:'spectra-1',kind:'ap',type:'Short',title:'The red line of hydrogen',minutes:9,
    stem:'<p>The energy of the electron in a hydrogen atom is E<sub>n</sub> = −2.178 × 10⁻¹⁸ J ÷ n², where n is the energy level. Use h = 6.626 × 10⁻³⁴ J·s and c = 2.998 × 10⁸ m/s.</p>',
    parts:[
      {label:'a',kind:'explain',pts:1,q:'When hydrogen gas glows in a discharge tube, its spectrum is a set of separate bright lines rather than a continuous rainbow. Explain why.',
        guide:['For saying the electron can only have certain energies (quantized energy levels), so each emitted photon has an energy equal to the difference between two allowed levels, which gives only certain wavelengths'],
        model:'The electron in hydrogen can only have <b>certain energies</b>. When it drops from a higher level to a lower one, it emits one photon whose energy equals the difference between the two levels. Only a few differences are possible, so only a few wavelengths appear.'},
      {label:'b',kind:'calc',pts:2,q:'Calculate the wavelength, in nm, of the photon emitted when the electron drops from n = 3 to n = 2.',
        num:{ans:657,tol:1,unit:'nm'},
        guide:['For ΔE = 2.178 × 10⁻¹⁸ J × (1/2² − 1/3²) = 3.025 × 10⁻¹⁹ J','For λ = hc ÷ ΔE = 6.57 × 10⁻⁷ m = 657 nm'],
        model:'ΔE = 2.178 × 10⁻¹⁸ J × (1/4 − 1/9) = 3.025 × 10⁻¹⁹ J. λ = hc ÷ ΔE = (6.626 × 10⁻³⁴ J·s)(2.998 × 10⁸ m/s) ÷ 3.025 × 10⁻¹⁹ J = 6.57 × 10⁻⁷ m = <b>657 nm</b>, the red line.',
        mistakes:['Getting a negative wavelength. Use the size of the energy change; the minus sign only says the atom lost energy.','Forgetting to convert meters to nanometers (1 nm = 10⁻⁹ m).']},
      {label:'c',kind:'explain',pts:1,q:'Predict whether the photon emitted when the electron drops from n = 4 to n = 2 has a longer or shorter wavelength than the photon in part (b). Justify your prediction.',
        guide:['For shorter, because the energy gap from n = 4 to n = 2 is larger than from n = 3 to n = 2, and wavelength is inversely proportional to photon energy (λ = hc/ΔE)'],
        model:'<b>Shorter.</b> n = 4 is higher in energy than n = 3, so the drop to n = 2 releases more energy. Since λ = hc ÷ ΔE, a larger energy means a shorter wavelength. (It is the blue-green line at 486 nm.)'}
    ],
    lab:{set:{mode:'hydrogen',nhi:3,spec:'emission'},look:'Read <b>Last line λ</b> and <b>Energy of that photon</b>. Then raise the level to 4 and look for the new line.'}}
]
});
