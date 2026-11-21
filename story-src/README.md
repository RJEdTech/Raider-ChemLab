# Story pages: source

The four story pages at the top of this repo are built from the files in this folder. Each built page is one self-contained HTML file, so nothing here is loaded by a student's browser.

| Built page | Story file | Words under the stage |
|---|---|---|
| `equilibrium-story.html` | `scenes.js` | `eq.more.html` |
| `pressure-story.html` | `bag.js` | `bag.more.html` |
| `naming-story.html` | `naming.js` | `naming.more.html` |
| `atomic-mass-story.html` | `mass.js` | `mass.more.html` |

Shared by all four: `core.js` (models, the molecule box, drawing helpers), the page controls at the end of `scenes.js` (from the line `page controls` down), `style.css`, `template.html`.

## Build
```
cd story-src
python3 build.py
```
This rewrites the four pages in the repo root. The RJ mark is read from `index.html`.

## Test
`tests/` holds one script per page that drives the page like a student in headless Chrome (Playwright) and checks the numbers. Serve the repo root on port 8766 (`python3 -m http.server 8766`), then run `node tests/walk.js`, `walkbag.js`, `walkname.js`, `walkmass.js`. Screenshots go to `/home/claude/shots/`; change that path if you run them elsewhere.

## To add a page
Copy `naming.js` (no molecule box) or `bag.js` (with one), write its `STEPS`, add a `*.more.html`, and add an entry to `PAGES` in `build.py`.
