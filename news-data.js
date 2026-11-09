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
