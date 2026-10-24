/* Raider ChemLab: topic sections and course pathways.
   Course order comes from RJ's Canvas courses (Fall 2026 shells for first semester; Spring 2026 / Fall 2025 shells for second).
   Tool ids that are not built yet are skipped automatically. */
BioLab.setSections({
  units: { 1: 'Matter and its properties', 2: 'Atomic structure and nuclear chemistry', 3: 'Electrons and light', 4: 'The periodic table',
           5: 'Bonding and naming', 6: 'States of matter and intermolecular forces', 7: 'Chemical reactions', 8: 'The mole and stoichiometry',
           9: 'Gases', 10: 'Solutions', 11: 'Thermochemistry', 12: 'Kinetics', 13: 'Equilibrium', 14: 'Acids and bases',
           15: 'Thermodynamics and electrochemistry' },
  extra: { 0: 'Lab skills and measurement', 16: 'Forensic chemistry', 18: 'Digital forensics', 17: 'Go further' },
  order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 17],
  further: 17,
  unitPrefix: ''
});

BioLab.COURSES = [
  { id: 'chem', name: 'Chemistry',
    blurb: 'Tools in the order Chemistry covers them, unit by unit. Ms. Glugoski’s sections number these Units 1–9 and skip nuclear chemistry; the order is the same.',
    units: [
      { n: 'Unit 0', t: 'Intro to chemistry and lab safety', ids: ['labbench'] },
      { n: 'Unit 1', t: 'Classifying matter and atomic structure', ids: ['classify', 'separation', 'models', 'atombuilder', 'avgmass', 'nuclear', 'halflife'] },
      { n: 'Unit 2', t: 'Chemical nomenclature', ids: ['ptable', 'ionic', 'naming'] },
      { n: 'Unit 3', t: 'Chemical reactions', ids: ['balance', 'rxntypes', 'activity', 'precip'] },
      { n: 'Unit 4', t: 'Measurement', ids: ['measure', 'units', 'density'] },
      { n: 'Unit 5', t: 'The mole', ids: ['mole', 'percentcomp', 'hydrate'] },
      { n: 'Unit 5b', t: 'Stoichiometry', ids: ['stoich', 'airbag'] },
      { n: 'Unit 6', t: 'Solids, liquids and gases', ids: ['states', 'phasediagram', 'gaslaws', 'kmt'] },
      { n: 'Unit 7', t: 'Thermochemistry', ids: ['calorimetry', 'coldpack'] },
      { n: 'Unit 8', t: 'Electrons', ids: ['light', 'spectra', 'econfig', 'trends'] }
    ],
    further: ['lewis', 'vsepr', 'orbitals', 'rates'] },
  { id: 'honors', name: 'Honors Chemistry',
    blurb: 'Tools in the order Honors Chemistry covers them: first semester, then second. Mr. Jackson’s sections start with measurement and teach electrons and the periodic table before naming; every tool is still here.',
    units: [
      { n: 'Unit 0', t: 'Intro and lab safety', ids: ['labbench'] },
      { n: 'Unit 1', t: 'Classifying matter, the atom and nuclear chemistry', ids: ['classify', 'separation', 'models', 'atombuilder', 'avgmass', 'nuclear', 'halflife'] },
      { n: 'Unit 2', t: 'Nomenclature', ids: ['ptable', 'ionic', 'naming'] },
      { n: 'Unit 3', t: 'Chemical reactions and net ionic equations', ids: ['balance', 'rxntypes', 'activity', 'precip'] },
      { n: 'Unit 4', t: 'Scientific measurement', ids: ['measure', 'units', 'density'] },
      { n: 'Unit 5a', t: 'Chemical quantities: the mole', ids: ['mole', 'percentcomp'] },
      { n: 'Unit 5b', t: 'Hydrates and stoichiometry', ids: ['hydrate', 'stoich', 'airbag'] },
      { n: 'Unit 6', t: 'States of matter and gases', ids: ['states', 'phasediagram', 'gaslaws', 'kmt', 'gasstoich'] },
      { n: 'Unit 7', t: 'Solutions', ids: ['dissolve', 'molarity', 'solcurve', 'colligative', 'titration'] },
      { n: 'Unit 8', t: 'Electrons, bonding and molecular shape', ids: ['light', 'spectra', 'econfig', 'trends', 'lewis', 'vsepr', 'polarity', 'imf', 'bondtypes'] },
      { n: 'Unit 9', t: 'Thermochemistry and kinetics', ids: ['calorimetry', 'coldpack', 'enthalpy', 'rates'] }
    ],
    further: ['pes', 'equilibrium', 'beerslaw', 'orbitals'] },
  { id: 'ap', name: 'AP Chemistry',
    blurb: 'Tools grouped by the nine AP Chemistry units. Both sections teach Units 1–5 and the first half of Unit 7 in the fall, then thermochemistry, solubility equilibrium, acids and bases, and Unit 9 in the spring.',
    units: [
      { n: 'Unit 1', t: 'Atomic structure and properties', ids: ['mole', 'avgmass', 'percentcomp', 'econfig', 'pes', 'trends'] },
      { n: 'Unit 2', t: 'Compound structure and properties', ids: ['ionic', 'bondtypes', 'lewis', 'vsepr', 'polarity'] },
      { n: 'Unit 3', t: 'Properties of substances and mixtures', ids: ['imf', 'phasediagram', 'gaslaws', 'kmt', 'dissolve', 'molarity', 'separation', 'beerslaw', 'light', 'spectra'] },
      { n: 'Unit 4', t: 'Chemical reactions', ids: ['balance', 'precip', 'stoich', 'activity', 'titration'] },
      { n: 'Unit 5', t: 'Kinetics', ids: ['rates', 'ratelaw'] },
      { n: 'Unit 6', t: 'Thermochemistry', ids: ['calorimetry', 'coldpack', 'enthalpy'] },
      { n: 'Unit 7', t: 'Equilibrium', ids: ['equilibrium', 'ksp'] },
      { n: 'Unit 8', t: 'Acids and bases', ids: ['ph', 'titration', 'buffers'] },
      { n: 'Unit 9', t: 'Thermodynamics and electrochemistry', ids: ['gibbs', 'galvanic'] }
    ],
    further: ['orbitals', 'spectroscopy', 'nuclear'] },
  { id: 'forensic', name: 'Forensic Science',
    blurb: 'Chemistry tools in the order Forensic Science covers them, then a digital forensics unit that ends in a full case to solve.',
    units: [
      { n: 'Unit', t: 'Fingerprinting', ids: ['fingerprints'] },
      { n: 'Unit', t: 'Poisons and toxicology', ids: ['toxicology', 'spottest'] },
      { n: 'Unit', t: 'Death, decomposition and time of death', ids: ['timeofdeath'] },
      { n: 'Unit', t: 'Questioned documents and trace evidence', ids: ['chromatography', 'spectroscopy'] },
      { n: 'Digital', t: 'Digital evidence: preserving and examining it', ids: ['hashing', 'filesig', 'metadata', 'recovery'] },
      { n: 'Digital', t: 'Digital crime: how attacks leave clues', ids: ['passwords', 'phishing', 'stego'] },
      { n: 'Case', t: 'Digital case file: put it all together', ids: ['casefile'] }
    ],
    further: ['halflife', 'separation', 'ph'] }
];

BioLab.TOPIC_ORDER = {
  0: ['labbench', 'measure', 'units', 'density'],
  1: ['classify', 'separation'],
  2: ['models', 'atombuilder', 'avgmass', 'nuclear', 'halflife'],
  3: ['light', 'spectra', 'econfig', 'pes'],
  4: ['ptable', 'trends'],
  5: ['ionic', 'naming', 'lewis', 'vsepr', 'polarity', 'bondtypes'],
  6: ['states', 'phasediagram', 'imf'],
  7: ['balance', 'rxntypes', 'activity', 'precip'],
  8: ['mole', 'percentcomp', 'hydrate', 'stoich', 'airbag'],
  9: ['gaslaws', 'kmt', 'gasstoich'],
  10: ['dissolve', 'molarity', 'solcurve', 'colligative', 'beerslaw'],
  11: ['calorimetry', 'coldpack', 'enthalpy'],
  12: ['rates', 'ratelaw'],
  13: ['equilibrium', 'ksp'],
  14: ['ph', 'titration', 'buffers'],
  15: ['gibbs', 'galvanic'],
  16: ['fingerprints', 'toxicology', 'spottest', 'timeofdeath', 'chromatography', 'spectroscopy'],
  17: ['orbitals'],
  18: ['hashing', 'filesig', 'metadata', 'recovery', 'passwords', 'phishing', 'stego', 'casefile']
};
