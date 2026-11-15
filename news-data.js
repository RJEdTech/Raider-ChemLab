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
