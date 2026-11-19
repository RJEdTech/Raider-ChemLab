/* Where science meets philosophy + How exact does it need to be? (Nov 19, 2026; follows the BioLab/PhysLab pilot of Nov 17)
   One entry per tool. Rendered by the engine below the stage in Full lab and at the end of Learn it.
   Standard: teach, don't preach. Name each thinker's view fairly, state definitive Church teaching as the Church's teaching,
   and leave open questions open (no answer key). Every number has a source and a year. */
BioLab.addBorder({
models: {
  q: 'Is the atom a picture we draw, or a real thing?',
  saw: 'Most alpha particles went straight through the gold, and a few bounced back. The nuclear model predicted that. The plum-pudding model could not.',
  assumes: [
    'Things too small to see can be known by what they do: how they deflect, what colors they give off, how much they weigh.',
    'When a model predicts a result nobody expected, that is a sign it has hold of something real.',
    'Detectors report what really happened, not what we hoped to see.'
  ],
  stops: 'Chemistry shows which model fits the evidence, and each model so far (Dalton, Thomson, Rutherford, Bohr) was replaced by a better one. Whether today’s quantum model shows what an atom really is, or is just our best tool for predicting, is a question in the philosophy of science.',
  church: 'The Church teaches that truth is one: what is really discovered about nature cannot contradict what faith holds, because both come from the same God (Vatican II, <i>Gaudium et Spes</i> 36; John Paul II, <i>Fides et Ratio</i> 34, 1998). The Church leaves the structure of the atom to science. It asks that the search be honest and done in line with moral norms, and it has no quarrel with models that change when the evidence does.',
  faith: { items: [
    { who: 'Fr. Pierre Gassendi', when: 'French priest and scientist, 1640s–1650s', says: 'He revived the ancient Greek idea of atoms, arguing that God created the atoms and their motions, so atomism did not have to mean a world without God. He helped make atoms respectable in modern science.' },
    { who: 'Fr. Roger Boscovich', when: 'Croatian Jesuit, 1758', says: 'He pictured matter as points that pull and push on each other depending on distance, pushing back hard when very close. Faraday and Kelvin later took his idea seriously, and it looks a lot like how atoms really interact.' }
  ] },
  views: [
    { who: 'Democritus', when: 'about 400 BC', says: 'Everything is made of tiny, uncuttable pieces moving through empty space. He reasoned his way there with no experiment at all.' },
    { who: 'Ernst Mach', when: '1890s', says: 'Atoms are a handy way to calculate, not things anyone has shown to exist. Science should stick to what we can observe and measure.' },
    { who: 'Jean Perrin', when: '1908; Nobel Prize 1926', says: 'He counted atoms in more than a dozen independent ways, and they all gave about the same number. That agreement convinced him, and nearly every skeptic, that atoms are real.' },
    { who: 'Pierre Duhem', when: 'Catholic physicist, 1906', says: 'A theory sums up and predicts what we observe. It does not have to claim to show the hidden reality behind it, and it may one day be replaced.' },
    { who: 'Niels Bohr', when: '1920s', says: 'Physics is about what we can say about nature, not what nature is in itself. Pictures of the atom are tools for describing experiments.' }
  ],
  margin: {
    lead: 'Atoms are too small to see, yet some numbers about them are known to many digits, and one is exact by choice.',
    rows: [
      { what: 'Avogadro’s number', value: '6.02214076 × 10²³ per mole', range: 'Exact, by definition, since 2019', how: 'Fixed when the mole was redefined. Before that it was measured, most precisely by counting atoms in a nearly perfect silicon sphere.', enough: 'All of chemistry. The exactness is a choice we made, not a measurement.' },
      { what: 'Perrin’s estimates, 1908–1913', value: 'Roughly 6 to 8 × 10²³', range: 'His different methods disagreed by about 20%', how: 'Brownian motion, settling particles, radioactivity, the blue sky and more', enough: 'Showing atoms are real. Not for precise chemistry.' },
      { what: 'Gold atom vs. its nucleus', value: 'Atom about 290 pm across; nucleus about 14 fm across', range: 'The nucleus is about 20,000 times smaller', how: 'X-ray spacing in gold crystals; scattering experiments like Rutherford’s', enough: 'Seeing why almost every alpha particle misses.' }
    ],
    note: 'Many independent methods landing on the same number is how science comes to trust something it cannot see.'
  }
}
});
