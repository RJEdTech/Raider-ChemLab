# Raider Labs Lesson Kit v1

The shared pieces of the Raider Labs lesson model, built from what worked on the Empirical Formula and Stoichiometry lessons (Nov 2026). Every piece works on its own; see them all on `demo.html`.

**Live demo:** https://rjedtech.github.io/Raider-ChemLab/kit/demo.html

## Use it in a lesson
1. Copy the `kit/` folder into the lab's repo (it has no other files it needs).
2. In the lesson page:
   ```html
   <link rel="stylesheet" href="kit/lesson-kit.css?v=1">
   ...
   <script src="kit/lesson-kit.js?v=1"></script>
   <script>LK.setup({site:'PhysLab', page:'kinematics', key:'kinematics-lesson-v1'});</script>
   ```
3. Keep the GoatCounter tag at the bottom of the page. "This confused me" sends `confused/<site>/<page>/<part>/<where>` and `/why-<reason>`.
4. When you change the kit, bump `?v=` and copy the new files to every lab that uses it.

## The pieces
| Piece | What it's for | Call |
|---|---|---|
| Supports | 🔊 Read aloud and Aa Easier reading, shared with every Raider Labs site | `LK.supports('#sup')` |
| Way in | Mystery or just the lesson; the choice is saved | `LK.path(el,{mystery:{title,html},lessonNote})` |
| Help-first "This confused me" | What it's asking, another way, how to start, a Show me action, then an anonymous reason | `LK.confused(el,{where,ask,another,start,actions:[{label,run}]})` |
| Number-only answers | Accepts 35.7, 35,700, 6.02e23, 6.02 x 10^23; rejects letters and formulas with a clear message | `LK.check(value, answer, {rel:.01})`, `LK.checkMsg`, `LK.numAttrs` |
| Road map strip | The problem's own numbers at each station, filling in as steps are solved | `LK.strip(el,{stations,arrows,now,note})` |
| Before/after bars | Show how an amount changes (weight, money, distance) | `LK.bars(el,{rows,unit,note})` |
| Step-through animation | Cause and effect: each step changes the picture and highlights what changed; Play, Next step, reduced motion | `LK.stepper(el,{svg,steps:[{label,caption,tally,set,focus}],onStep})` |
| Why care? | A small, concrete reason right after the hard idea | `LK.whyCare(el,html)` |
| How this changes the world | Big real-world stories, with sources, after the lesson | `LK.world(el,{cards:[{icon,title,html,source}]})` |
| Test yourself | One question at a time, hint and help first, best score saved; warns if the right answer is usually the longest | `LK.test(el,{id,questions:[{q,choices,answer,hint,why}]})` |

## Before anything goes up (checklist)
- [ ] **Jason read it as a non-expert.** Every place he got stuck is fixed, and we named the wrong belief behind it.
- [ ] **One goal per section.** The teacher's lesson comes first; practical material comes after or behind a click.
- [ ] **One real problem with real numbers** teaches it. No letters or variables in the teaching parts.
- [ ] **Question first, vocabulary second.** Every term that's tested is taught, simple words first.
- [ ] **Background named** in one reminder line.
- [ ] **A picture for each step.** Every number in a picture is literally true. No countable stand-ins for huge numbers.
- [ ] **The two things students mix up are both shown, every time** (count and weight; distance and speed; rate and total).
- [ ] **Change is shown as motion,** with the changing thing highlighted.
- [ ] **Why care** sits right after the hard idea; **world stories** come later, with sources.
- [ ] **Answer boxes say what goes in them** and take numbers only.
- [ ] **Problem banks verified** by a script that solves like a student who rounds.
- [ ] **Test yourself:** the right answer is the longest choice in no more than a few questions (`LK.balance`).
- [ ] **Phone check:** no sideways scroll at 390 px; works with reduced motion; no page errors.
- [ ] **GoatCounter tag** on the page; teacher credited if it's their lesson.
