/* Raider Labs: In the News (data for news.html).
   Newest week first. To add a week: put its stories at the TOP of the array.
   Each story: id, week (YYYY-MM-DD, the Sunday it was added), date (event date),
   title, summary, numbers[] (each with its source link and date), concept{title,html},
   hook{prompt, parts[{label, answer, tol, unit, signHint?}], worked}, hides, evidence,
   investigate, related[{href, label}].
   Rules: every number has a source and date; label company-reported figures;
   name agencies and programs, never parties; no em dashes. */
window.RAIDER_NEWS = [
 {
  "id": "us-storage-200-gwh-2026",
  "week": "2026-11-22",
  "date": "2026-11-17",
  "title": "US battery storage passes 200 gigawatt-hours, with a record number of states setting records",
  "summary": "The Solar Energy Industries Association (SEIA) and Benchmark Mineral Intelligence reported that installed US energy storage, almost all of it lithium-ion batteries, has passed 200 gigawatt-hours. Batteries let solar power captured at noon be used after sunset.",
  "numbers": [
   "Installed US energy storage has passed 200 gigawatt-hours (GWh) (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "14.3 GWh was added in July to September 2026: 12.2 GWh utility-scale, 1.3 GWh commercial and industrial, 746 MWh residential (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "48.3 GWh was added in the first nine months of 2026, up 20% from the same months of 2025 (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "The forecast for total US storage in 2030 was raised 3.7% to 708 GWh (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "Top states for utility-scale storage added in Q3: Texas 12.3 GWh, Arizona 7.7 GWh, California 6.8 GWh; eleven states set records (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>). These state totals are as reported and may count a longer period than one quarter.",
   "The EIA expects large US battery power capacity to grow from 28.9 gigawatts (GW) in 2025 to 66 GW by the end of 2026 (<a href=\"https://www.energycentral.com/energy-biz/post/seia-eia-doe-storage-and-solar-soars-coal-contracts-emMzuD4OIqcZ4Kf\" target=\"_blank\" rel=\"noopener\">Energy Central, quoting the EIA Short-Term Energy Outlook, Nov 18, 2026</a>)."
  ],
  "concept": {
   "title": "Energy stored in a battery: charge times voltage",
   "html": "A battery stores energy in a redox reaction. In a lithium iron phosphate (LFP) cell, common in grid batteries, each lithium ion that moves from one electrode to the other is matched by one electron moving through the outside circuit. The energy delivered is <b>E = Q &times; V</b>: charge (coulombs) times voltage (volts). The Faraday constant links charge to moles: 1 mole of electrons carries 96,485 C. So from an amount of energy you can find the moles of electrons, and from those the moles and mass of lithium that had to move. 1 kWh = 3.6 &times; 10<sup>6</sup> J."
  },
  "hook": {
   "prompt": "Assume an LFP cell with a voltage of 3.2 V. Use F = 96,485 C/mol and a lithium molar mass of 6.94 g/mol. One lithium ion moves for each electron.",
   "parts": [
    {
     "label": "(a) How many moles of electrons flow to deliver 1.00 kWh?",
     "answer": 11.66,
     "tol": 0.05,
     "unit": "mol"
    },
    {
     "label": "(b) What mass of lithium must move between electrodes for 1.00 kWh?",
     "answer": 80.9,
     "tol": 0.5,
     "unit": "g"
    },
    {
     "label": "(c) At that rate, how many metric tons of lithium must move to deliver the 14.3 GWh added in Q3? (1 GWh = 10<sup>6</sup> kWh)",
     "answer": 1157,
     "tol": 8,
     "unit": "t"
    }
   ],
   "worked": "(a) Q = E &divide; V = 3.6 &times; 10<sup>6</sup> J &divide; 3.2 V = 1.125 &times; 10<sup>6</sup> C. Moles of electrons = 1.125 &times; 10<sup>6</sup> &divide; 96,485 = <b>11.66 mol</b>. (b) 11.66 mol Li &times; 6.94 g/mol = <b>80.9 g</b>. (c) 14.3 &times; 10<sup>6</sup> kWh &times; 80.9 g = 1.157 &times; 10<sup>9</sup> g = <b>about 1,157 metric tons</b> of lithium shuttled in one full discharge."
  },
  "hides": "The hook gives the minimum lithium that must move; real cells hold more lithium than they cycle, and packs also need iron, phosphate, graphite, copper and aluminum. Mining those materials has its own environmental and community costs. A record in storage capacity (GWh) is not the same as how much energy is actually delivered, which depends on how often the batteries cycle. SEIA is an industry group, and the outlook's falling wholesale prices in Texas and California (42% and 51% since 2021) are an association, not proof that batteries caused the drop.",
  "evidence": "Moderate: an industry market report with an independent analytics firm, read through trade-press coverage, not the report itself. The EIA capacity numbers are federal forecasts.",
  "investigate": "The <a href=\"https://www.eia.gov/electricity/data/browser/\" target=\"_blank\" rel=\"noopener\">EIA Electricity Data Browser</a> shows generation by source for each state. Pick Texas or California and compare solar generation in a summer month of 2021 and 2025. How much did it grow?",
  "related": [
   {
    "href": "index.html#galvanic",
    "label": "Galvanic cells: electricity from redox"
   },
   {
    "href": "index.html#mole",
    "label": "The mole"
   }
  ]
 },
 {
  "id": "battery-history",
  "week": "2026-11-15",
  "date": "2026-04-21",
  "title": "Discovered in Texas, scaled in China: the story of the cheap EV battery",
  "summary": "Lithium iron phosphate (LFP), the chemistry in most Chinese electric-car batteries, was discovered at the University of Texas at Austin in 1995. The first company to sell it was American, but Chinese battery makers turned it into a giant industry. In 2026 they showed LFP batteries that charge from about 10% to nearly full in under 10 minutes, and began mass-producing sodium-ion batteries made from one of the most common elements on Earth.",
  "numbers": [
   "LFP was discovered in 1995 by a team led by John Goodenough at UT Austin. Goodenough later shared the 2019 Nobel Prize in Chemistry for lithium-ion batteries (<a href=\"https://www.autoblog.com/2023/06/11/how-the-u-s-let-ev-battery-tech-born-here-wind-up-in-the-hands-of-china/\" target=\"_blank\" rel=\"noopener\">Bloomberg Businessweek via Autoblog, Jun 11, 2023</a>).",
   "A123 Systems, a 2001 startup from MIT, was the first company to sell LFP batteries. In June 2009 it received a $249 million Department of Energy grant to build two factories in Michigan (<a href=\"https://www.autoblog.com/2023/06/11/how-the-u-s-let-ev-battery-tech-born-here-wind-up-in-the-hands-of-china/\" target=\"_blank\" rel=\"noopener\">Autoblog, Jun 11, 2023</a>).",
   "A123 filed for bankruptcy on October 16, 2012 (<a href=\"https://www.scientificamerican.com/article/pioneering-battery-maker-files-for-bankruptcy/\" target=\"_blank\" rel=\"noopener\">Scientific American, Oct 2012</a>). In 2013 Wanxiang, then China's largest auto parts company, bought it, and most of its patents and technology went to China (<a href=\"https://www.autoblog.com/2023/06/11/how-the-u-s-let-ev-battery-tech-born-here-wind-up-in-the-hands-of-china/\" target=\"_blank\" rel=\"noopener\">Autoblog, Jun 11, 2023</a>).",
   "Average battery pack price: about $1,474 per kWh in 2010, $108 per kWh in 2025, a 93% drop after inflation. LFP packs averaged $81 per kWh; packs in China averaged $84 (<a href=\"https://www.energy-storage.news/li-ion-battery-pack-prices-fell-8-since-last-year-despite-metals-prices-rising-bloombergnef-says/\" target=\"_blank\" rel=\"noopener\">BloombergNEF survey via Energy-Storage.news, Dec 10, 2025</a>).",
   "BYD's second-generation Blade (LFP) battery: 10% to 97% charge in 9 minutes, company-reported, launched March 5, 2026 (<a href=\"https://news.metal.com/newscontent/103870069-catl-vs-byd-battery-tech-peak-clash-and-solid-state-progress\" target=\"_blank\" rel=\"noopener\">SMM, Apr 22, 2026</a>).",
   "CATL's third-generation Shenxing (LFP) battery: 10% to 98% in under 6.5 minutes, company-reported, April 2026 (<a href=\"https://gulfnews.com/auto/news/next-generation-ev-batteries-whos-building-them-what-they-promise-when-they-hit-the-market-1.500628937\" target=\"_blank\" rel=\"noopener\">Gulf News, 2026</a>).",
   "CATL's Naxtra sodium-ion cells store 175 Wh per kg, company-reported, close to LFP (<a href=\"https://www.aol.com/chinese-battery-maker-catl-launches-072613723.html\" target=\"_blank\" rel=\"noopener\">Reuters, Apr 2025</a>). CATL and Changan unveiled the first mass-produced passenger car with sodium-ion batteries in February 2026 (<a href=\"https://cnevpost.com/2026/02/05/catl-sodium-batteries-begin-deployment-in-production-passenger-vehicles/\" target=\"_blank\" rel=\"noopener\">CnEVPost, Feb 5, 2026</a>).",
   "Natron Energy, a U.S. sodium-ion startup from Stanford with a factory in Holland, Michigan, received $19.8 million from the Department of Energy's ARPA-E program and closed on September 3, 2025, citing funding problems (<a href=\"https://spectrum.ieee.org/natron-sodium-ion-battery-failure\" target=\"_blank\" rel=\"noopener\">IEEE Spectrum, Sep 2025</a>)."
  ],
  "concept": {
   "title": "Voltage times charge: why cheaper chemistry can still win",
   "html": "A battery's energy is its voltage times the charge it moves: <b>watt-hours = volts &times; amp-hours</b>. One LFP cell gives about 3.2 V, a little less than the nickel-and-cobalt cells in many phones (about 3.7 V), because iron phosphate grabs electrons a bit less hard. Sodium sits just above lithium on the table of reduction potentials (Na<sup>+</sup>/Na &minus;2.71 V vs Li<sup>+</sup>/Li &minus;3.04 V), so a sodium-ion cell pushes about 3.0 V. Lower voltage means less energy per cell, so these batteries win another way: iron and sodium are cheap and plentiful, the cells are safer and last thousands of charges, and you can stack more cells in a row to reach the voltage a car needs."
  },
  "hook": {
   "prompt": "Use the numbers above. Cells in a row (series) add their voltages.",
   "parts": [
    {
     "label": "(a) An electric car pack needs about 400 V. How many 3.2 V LFP cells must be stacked in a row?",
     "answer": 125,
     "tol": 0.5,
     "unit": "cells"
    },
    {
     "label": "(b) By what percent did the average pack price fall from 2010 ($1,474 per kWh) to 2025 ($108 per kWh)?",
     "answer": 92.7,
     "tol": 0.3,
     "unit": "%"
    },
    {
     "label": "(c) A car needs a 60 kWh pack. How many dollars cheaper is it at the 2025 price than at the 2010 price?",
     "answer": 81960,
     "tol": 100,
     "unit": "$"
    }
   ],
   "worked": "(a) 400 V &divide; 3.2 V per cell = <b>125 cells</b>. (b) (1,474 &minus; 108) &divide; 1,474 = 1,366 &divide; 1,474 = 0.927, so <b>92.7%</b>. (c) 60 kWh &times; ($1,474 &minus; $108) = 60 &times; $1,366 = <b>$81,960</b>. The battery alone once cost more than most cars."
  },
  "hides": "A common version of this story says the U.S. would not fund the battery, so it moved to China. The record is more mixed. A123 did get federal money: a $249 million grant plus a $380 million stock offering in 2009. It failed mainly because it lacked customers: few people were buying electric cars, Chrysler closed its electric-car unit and GM chose LG for the Volt, and a 2012 recall hurt trust until financing dried up. Starting in 2013, China's government built demand: electric city buses, tax breaks for buyers and support for battery companies, while CATL (founded 2011) and BYD spent billions over a decade learning to build cells cheaply. Neither has been accused of copying A123's technology. Funding an invention and building the market and factories for it are different jobs. Also note: the charging times are company claims under ideal conditions with special chargers, and sodium-ion still stores less energy per kilogram than the best lithium cells. Some of the technology is also coming back: Ford's Michigan battery plant uses CATL's LFP technology under license.",
  "evidence": "Strong for the history (bankruptcy records and long investigative reporting by Bloomberg Businessweek). Strong for prices (BloombergNEF's annual survey of 320 data points). Company-reported for the 2026 charging and energy figures, not yet independently tested.",
  "investigate": "Pick one car your family owns or wants. Find out where its battery was made and whether it is LFP or a nickel-based (NMC) battery. Then write one reason a country might pay to create <i>demand</i> (buses, tax breaks) instead of only paying for research, and one reason against it. Then go further in CivicsLab, the math of the common good: <a href=\"https://rjedtech.github.io/raider-civicslab/#builtthere\" target=\"_blank\" rel=\"noopener\">Invented here, built there</a>.",
  "related": [
   {
    "href": "index.html#galvanic",
    "label": "Galvanic cells"
   },
   {
    "href": "index.html#activity",
    "label": "Activity series"
   }
  ]
 },
 {
  "id": "china-co2-q3-2026",
  "week": "2026-11-15",
  "date": "2026-11-06",
  "title": "China's carbon dioxide emissions fell 3.1% in July to September, the largest quarterly drop since 2020",
  "summary": "An analysis for Carbon Brief by Lauri Myllyvirta of the Centre for Research on Energy and Clean Air (CREA) estimates that China's CO<sub>2</sub> emissions fell 3.1% from a year earlier in the third quarter of 2026, as coal and oil use fell and new clean power grew faster than electricity demand.",
  "numbers": [
   "CO<sub>2</sub> down 3.1% year on year in July to September; down about 0.5% for the year so far (estimate) (<a href=\"https://www.carbonbrief.org/analysis-chinas-quarterly-co2-falls-3-in-largest-drop-since-covid\" target=\"_blank\" rel=\"noopener\">Carbon Brief, Nov 6, 2026</a>).",
   "Coal use down 3%; coal-fired power generation down 3.3% (<a href=\"https://www.carbonbrief.org/analysis-chinas-quarterly-co2-falls-3-in-largest-drop-since-covid\" target=\"_blank\" rel=\"noopener\">Carbon Brief, Nov 6, 2026</a>).",
   "Oil use down 4%; oil used for transport down 9% (<a href=\"https://www.carbonbrief.org/analysis-chinas-quarterly-co2-falls-3-in-largest-drop-since-covid\" target=\"_blank\" rel=\"noopener\">Carbon Brief, Nov 6, 2026</a>).",
   "Solar, wind and nuclear generated 110 TWh more electricity than a year earlier (<a href=\"https://www.carbonbrief.org/analysis-chinas-quarterly-co2-falls-3-in-largest-drop-since-covid\" target=\"_blank\" rel=\"noopener\">Carbon Brief, Nov 6, 2026</a>).",
   "Electric vehicles were 67% of passenger car sales and 50% of heavy truck sales in September (<a href=\"https://www.carbonbrief.org/analysis-chinas-quarterly-co2-falls-3-in-largest-drop-since-covid\" target=\"_blank\" rel=\"noopener\">Carbon Brief, Nov 6, 2026</a>)."
  ],
  "concept": {
   "title": "Every carbon atom leaves as CO<sub>2</sub>",
   "html": "When a fuel burns completely, each carbon atom bonds with two oxygen atoms from the air to make CO<sub>2</sub>. That means the mass of CO<sub>2</sub> is <b>bigger</b> than the mass of fuel: C (12.01 g/mol) becomes CO<sub>2</sub> (44.01 g/mol). For octane, 2 C<sub>8</sub>H<sub>18</sub> + 25 O<sub>2</sub> &rarr; 16 CO<sub>2</sub> + 18 H<sub>2</sub>O, so 1 mol of octane (114.23 g) makes 8 mol of CO<sub>2</sub>. Using less coal and oil cuts CO<sub>2</sub> in direct proportion."
  },
  "hook": {
   "prompt": "Use molar masses C = 12.01, H = 1.008, O = 16.00 g/mol.",
   "parts": [
    {
     "label": "(a) How many kg of CO<sub>2</sub> form when 1.00 kg of pure carbon burns completely?",
     "answer": 3.66,
     "tol": 0.02,
     "unit": "kg CO₂"
    },
    {
     "label": "(b) How many kg of CO<sub>2</sub> form when 1.00 kg of octane burns completely?",
     "answer": 3.08,
     "tol": 0.02,
     "unit": "kg CO₂"
    },
    {
     "label": "(c) A truck fleet burned 1,000 kg of fuel (treat it as octane) last year and 9% less this year. How many fewer kg of CO<sub>2</sub>?",
     "answer": 277,
     "tol": 3,
     "unit": "kg CO₂"
    }
   ],
   "worked": "(a) 1.00 kg C &divide; 12.01 g/mol = 83.26 mol C, which makes 83.26 mol CO<sub>2</sub> &times; 44.01 g/mol = 3,664 g, so <b>3.66 kg</b>. Shortcut: 44.01 &divide; 12.01. (b) Octane: 8(12.01) + 18(1.008) = 114.22 g/mol. 1,000 g &divide; 114.22 = 8.755 mol octane &times; 8 = 70.04 mol CO<sub>2</sub> &times; 44.01 = 3,082 g, so <b>3.08 kg</b>. (c) 9% of 1,000 kg = 90 kg less fuel. 90 &times; 3.08 = <b>277 kg</b> less CO<sub>2</sub>."
  },
  "hides": "This is one quarter; for the year so far the drop is only about 0.5%. Not all of it comes from clean energy: the analysis also points to an oil supply disruption that raised prices, mild weather, slower economic growth and less construction. The total is an estimate built from official and commercial data, not a direct measurement of CO<sub>2</sub> in the air, and the page gives percentages, not tonnes.",
  "evidence": "Moderate: an independent analysis by an energy research group, published by a specialist climate news site, not peer-reviewed. China's official annual figures will come later.",
  "investigate": "<a href=\"https://ourworldindata.org/co2-emissions\" target=\"_blank\" rel=\"noopener\">Our World in Data</a> charts CO<sub>2</sub> emissions by country since 1750. Compare China, the United States and India per person. Which is highest per person, and which is highest in total?",
  "related": [
   {
    "href": "index.html#stoich",
    "label": "Stoichiometry"
   },
   {
    "href": "index.html#mole",
    "label": "The mole"
   }
  ]
 },
 {
  "id": "germany-ev-2026",
  "week": "2026-11-08",
  "date": "2026-11-04",
  "title": "Germany's electric car share hits a record 37%",
  "summary": "Germany's federal motor vehicle authority (KBA) released October 2026 registrations. Battery-electric cars outsold gasoline and diesel cars combined for the second month in a row.",
  "numbers": [
   "94,086 battery-electric cars were registered in October 2026, up 79.5% from 52,425 in October 2025 (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>).",
   "Total new cars: 254,492. Gasoline: 38,516 (15.1%). Diesel: 23,882 (9.4%) (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>).",
   "Average new-car CO<sub>2</sub> emissions: 79.4 g/km, down 21.1% from a year earlier (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>).",
   "Context: a new government purchase subsidy of EUR 3,000 for a new battery-electric car (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>)."
  ],
  "concept": {
   "title": "Every carbon atom leaves as CO₂",
   "html": "Gasoline is mostly hydrocarbons. When octane burns: <b>2 C<sub>8</sub>H<sub>18</sub> + 25 O<sub>2</sub> &rarr; 16 CO<sub>2</sub> + 18 H<sub>2</sub>O</b>. Carbon atoms are conserved, so every carbon atom in the fuel ends up in a CO<sub>2</sub> molecule. That is why grams of CO<sub>2</sub> per km track how much fuel a car burns. A battery-electric car burns no fuel in the car, so its tailpipe CO<sub>2</sub> is zero."
  },
  "hook": {
   "prompt": "(a) Check the 37% share: what percent of October's new cars were battery-electric? (b) Average CO₂ fell 21.1% to 79.4 g/km. What was it a year earlier? (c) Use the balanced equation above: how many moles of CO₂ does burning one mole of octane make?",
   "parts": [
    {
     "label": "(a) Battery-electric share of new cars",
     "answer": 37.0,
     "tol": 0.2,
     "unit": "%"
    },
    {
     "label": "(b) Average CO₂ a year earlier",
     "answer": 100.6,
     "tol": 0.3,
     "unit": "g/km"
    },
    {
     "label": "(c) From the balanced equation: moles of CO₂ made per mole of octane burned",
     "answer": 8,
     "tol": 0.01,
     "unit": "mol"
    }
   ],
   "worked": "(a) 94,086 &divide; 254,492 = 0.3697, about <b>37.0%</b>. (b) A 21.1% drop leaves 78.9%, so a year earlier = 79.4 &divide; 0.789 = <b>100.6 g/km</b>. (c) 2 mol of octane make 16 mol of CO<sub>2</sub>, so 16 &divide; 2 = <b>8 mol CO<sub>2</sub> per mol of octane</b>: one for each carbon atom in C<sub>8</sub>H<sub>18</sub>."
  },
  "hides": "Tailpipe CO<sub>2</sub> is not the whole story: an electric car's lifetime emissions depend on how its electricity and battery are made. One record month, partly driven by a new subsidy, is not yet a long-term trend.",
  "evidence": "Strong data, secondhand summary. The numbers are official government registration data, read through a trade-press article; the KBA release itself was not read.",
  "investigate": "The U.S. Department of Energy's <a href=\"https://afdc.energy.gov/data\" target=\"_blank\" rel=\"noopener\">Alternative Fuels Data Center</a> has electric vehicle registrations by state. How does Colorado's share compare with Germany's?",
  "related": [
   {
    "href": "index.html#stoich",
    "label": "Stoichiometry: limiting reactant, excess and yield"
   }
  ]
 }
];
