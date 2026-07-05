# Current Paths Lab: Navigation Redesign Implementing Agent Prompt

Copy-paste the prompt below to the implementing agent.

---

You are revising an existing app, not designing a new one from scratch.

Target file:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)

You must follow these documents:

1. Primary action document:
- [CURRENTLAB_NAV_REDESIGN_2026-05-08.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_NAV_REDESIGN_2026-05-08.md)

2. Existing app review:
- [CURRENTLAB_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_REVIEW_2026-05-07.md)

3. Intro spec:
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)

4. Intro review:
- [CURRENTLAB_INTRO_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_REVIEW_2026-05-07.md)

5. Original master handoff:
- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)

6. Structural/style references:
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html)
- [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html)
- [STYLE.md](/Users/llepecki/Projects/llepecki.github.io/learn/STYLE.md)
- [package.json](/Users/llepecki/Projects/llepecki.github.io/learn/package.json)

Priority rule:

- For this task, the navigation redesign document is the primary action document.
- The review and intro-review documents remain binding for already-identified defects.
- The master handoff remains canonical for science, pedagogy, and visual direction, except where the navigation redesign explicitly overrides layout placement.

Your job:

- inspect the current `currentlab.html` structure
- prepare a strict implementation plan
- then implement the navigation redesign in `currentlab.html`
- preserve app functionality while simplifying the top control stack
- verify the result concretely

Non-negotiable requirements:

1. Do not treat this as a CSS-only pass.
2. Do not just hide existing rows and leave the old information architecture in place.
3. Do not keep four stacked control levels above the board.
4. Do not leave `stageRow` in the top toolbar.
5. Do not leave `Explore`, `Hint`, or `Next` in the top toolbar.
6. Do not leave `Intro` in the play-area toolbar.
7. Do not make investigation switching harder to discover.
8. Do not solve this with a dropdown, hamburger, or hidden overflow menu for children.
9. Do not break intro behavior while moving the controls.
10. Do not break EN/PL localization or keyboard accessibility.

Required workflow:

## Phase 1: Implementation Plan

Before editing files, do this in order:

1. Read [CURRENTLAB_NAV_REDESIGN_2026-05-08.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_NAV_REDESIGN_2026-05-08.md) fully.
2. Read the relevant findings in [CURRENTLAB_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_REVIEW_2026-05-07.md), especially the points about `Level 1-5`, board ownership, and `Explore`.
3. Read the relevant findings in [CURRENTLAB_INTRO_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_REVIEW_2026-05-07.md), especially the intro-state suppression requirements.
4. Inspect the current toolbar, header, panel, and intro DOM in `currentlab.html`.
5. Inspect the navigation render/update functions and event wiring in `currentlab.html`.
6. Inspect `package.json` to confirm verification commands.
7. Inspect git status so you do not overwrite unrelated changes.

Then write a concise but strict plan that includes:

1. how you will reduce the play-area top controls to one workspace nav strip
2. where `Intro` will move in the header
3. how `Learn / Decide` and mode chips will share one navigation strip
4. how the current `stageRow` will be replaced with an in-panel `Investigation` section
5. how progress will be merged into or coordinated with that new section
6. where `Explore`, `Hint`, and `Next` will move in the panel
7. how intro-active state will hide or disable the new normal navigation surfaces
8. how translation wiring will change for moved controls
9. how keyboard and mobile behavior will be preserved
10. what verification you will run for each milestone

Do not stop after the plan unless you hit a real contradiction.

## Phase 2: Implementation

Implement the redesign in this order:

1. Header/global utility restructure
   - move `Intro` into the header utility cluster
   - preserve the language switch
   - keep the header compact

2. Workspace navigation simplification
   - collapse the play-area toolbar to a single workspace nav strip
   - keep only `Learn / Decide` plus mode chips there
   - remove the dedicated top `stageRow`
   - remove the top action-button row

3. Panel investigation section
   - add a new panel section for `Investigation`
   - expose the current stage titles there
   - keep investigation switching direct and obvious
   - regroup progress into this section if feasible

4. Panel action area
   - create a dedicated panel action area for `Explore`, `Hint`, `Next`
   - make `Next` the primary action
   - keep `Explore` readable as a mode/scene toggle

5. Intro-state integration
   - ensure intro mode hides or disables the new normal navigation surfaces
   - ensure intro still owns progression while active
   - do not leave visible competing controls behind the intro

6. Localization/accessibility/mobile pass
   - update EN/PL labels for moved controls
   - update aria labels and focus order
   - ensure mobile does not recreate stacked toolbar clutter

Implementation constraints:

1. Keep the app single-file unless a real blocker forces otherwise.
2. Keep the app runnable after each major milestone.
3. Preserve current family/mode/stage state logic unless the redesign requires a scoped move.
4. Prefer renaming child-facing `stage` UI to `Investigation` while leaving internal state names alone if that is simpler and safer.
5. If you merge or remove the separate progress section, do it intentionally and preserve progress visibility.
6. If you keep any old toolbar container, it must represent only the new single workspace navigation strip.

Specific redesign rules:

1. The top of the play area must contain one navigation strip only.
2. That strip may contain:
   - `Learn / Decide`
   - active family mode chips
3. That strip may not contain:
   - `Intro`
   - stage/investigation chips
   - `Explore`
   - `Hint`
   - `Next`
4. The panel must contain:
   - investigation navigation
   - mission-related actions
5. The header must contain:
   - title cluster
   - `Intro`
   - language switch

Verification requirements:

Before finishing, you must verify all of the following:

1. There is no four-level toolbar stack above the board.
2. `stageRow` no longer exists as a top-toolbar navigation surface.
3. `Intro` is in the header and works there.
4. `Explore`, `Hint`, and `Next` are not in the top toolbar.
5. Investigation switching is available in the panel and is easy to discover.
6. Progress is still visible and coherent after the move.
7. Family switching still works.
8. Mode switching still works.
9. Investigation switching still works.
10. Intro mode suppresses normal navigation competition.
11. EN pass.
12. PL pass.
13. Keyboard pass for moved controls.
14. Narrow mobile-width pass.
15. Run:

`npm run code-review -- currentlab.html`

If that command reports issues, fix them and rerun it.

Progress reporting format:

For each major milestone, report:

1. milestone name
2. files changed
3. what is complete
4. what remains
5. what verification you actually ran
6. any remaining risks

Final response requirements:

Your final response must include:

1. concise summary of the navigation redesign
2. changed file list
3. verification actually run
4. whether `npm run code-review -- currentlab.html` passed
5. any remaining limitations

Stop only if:

- the redesign document conflicts with the codebase in a way that blocks implementation
- there are unexpected conflicting edits in the same navigation areas
- a required change would force a broader product decision not already settled by the redesign doc or reviews

Otherwise, proceed through plan and implementation without waiting.
