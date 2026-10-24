# Raider ChemLab

Interactive chemistry simulations and virtual labs for Regis Jesuit Chemistry, Honors Chemistry and AP Chemistry. Forensic Science has its own site, [Raider ForensicsLab](https://rjedtech.github.io/Raider-ForensicsLab/). It is the chemistry companion to [Raider BioLab](https://rjedtech.github.io/Raider-BioLab/) and [Raider PhysLab](https://rjedtech.github.io/Raider-PhysLab/) and runs on the same engine.

## Browse by course
The home page has a **Browse** switch: **By topic** groups the 56 tools into 15 chemistry topics plus Lab skills and Go further; **Chemistry**, **Honors Chemistry** and **AP Chemistry** list the tools in the order each course teaches them (from the courses' Canvas modules). Link straight to any tool with `#<name>` (e.g. `#stoich`, `#titration`), or to a pathway with `#path-<id>` (e.g. `#path-honors`).

## What every tool has
- **Detail switch** (Big picture / Closer look / Deep dive): the same model, with more named and more math as you go deeper.
- **Three views at once:** the beaker, the particles and the symbols, kept in sync.
- **Walk me through it**, slow motion and Step, a live caption, predict-then-test challenges, an investigation prompt and a data table with CSV export.

## Files
- `index.html`, `biolab.css`, `engine.js` (shared lab bench), `chemdata.js` (element data, formulas, ions, constants), `courses.js` (sections and pathways), `sims/*.js` (one file per tool), `ENGINE.md` (authoring guide).

**Live site:** https://rjedtech.github.io/Raider-ChemLab/

Everything runs in the browser, with no logins and no data collection.
