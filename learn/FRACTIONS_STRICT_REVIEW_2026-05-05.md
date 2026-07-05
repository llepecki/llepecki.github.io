# Fraction Playground: Strict Implementation Review

Reviewed on 2026-05-05.

This review is for the next implementing agent. Read it before touching `fractions.html`.

The current implementation is not a small polish miss. It is structurally underdesigned. The file is technically functional, but it does not deliver the intended product: an attractive, engaging fractions app for children. It delivers a generic mission shell with thin interactions and almost no authored play modes.

Do not treat this as a color-tuning task.

## Executive Verdict

The current app has three superficial strengths:

- it is clean and readable,
- the rational-math core is mostly sensible,
- the light-theme baseline is technically aligned with the repo.

Those strengths do not rescue the product.

The actual problems are:

1. the app has difficulty labels, not real activity modes,
2. most missions collapse to the same exact-value entry mechanic,
3. the board is visually generic and emotionally flat,
4. several named mission types are not implemented honestly,
5. feedback, pacing, and rewards are too weak to feel playful,
6. the mission generator is randomized rather than authored,
7. the UI hierarchy prioritizes controls and panel text over play.

If you only:

- tweak colors,
- add a few icons,
- increase button radius,
- add one more pulse animation,
- keep the same `generateMission()` structure,
- keep the same `set currentValue until it equals target` loop,
- or keep `Introduction / Intermediate / Advanced` as the only top-level mode choice,

then the result is still wrong.

The next version must introduce real activity modes, stronger board-first interaction, and visible transformation moments.

## Non-Negotiable Diagnosis

The current file behaves like a worksheet engine, not like a playful learning app.

The key mistake is this:

`The app confuses content difficulty with interaction mode.`

That is the central design failure.

Children feel variety through different verbs and different rhythms:

- choose,
- drag,
- compare,
- sort,
- repair,
- match,
- place,
- compose.

The current app mostly offers one verb:

- set the current value until it equals the target.

That is why it feels flat even when the math is technically valid.

## Critical Findings In `fractions.html`

### 1. The difficulty buttons are not real gameplay modes

Current refs:

- `fractions.html:660-695`
- `fractions.html:1095-1102`
- `fractions.html:2450-2492`

What the code does now:

- The top row exposes `Introduction`, `Intermediate`, and `Advanced`.
- Internally, `state.mode` mostly changes:
  - allowed denominators,
  - maximum wholes,
  - number-line range,
  - active fill color.
- Then `setMode()` immediately feeds back into the same generic mission generator.

Why this is wrong:

- These are difficulty presets, not activity modes.
- The child is not choosing a different kind of play.
- The child is choosing a different random-content pool inside the same shell.
- That is not enough for engagement.

What must change:

- Introduce real top-level activity modes.
- Recommended `v2` structure:
  - `Build`
  - `Compare`
  - `Match`
  - `Place`
  - `Repair`
- Keep `Introduction / Intermediate / Advanced` as difficulty within each activity mode, not as the only main interaction choice.

Non-negotiable rule:

- A child must be able to intentionally enter a dedicated compare experience without waiting for random mission selection.

### 2. The app only has two real scenes: mission and explore

Current refs:

- `fractions.html:1100-1101`
- `fractions.html:2513-2538`

What the code does now:

- `state.scene` is only `mission` or `explore`.
- `Explore` is the only true alternative to the generic mission loop.

Why this is wrong:

- `Explore` is useful, but it is not a substitute for multiple game/activity modes.
- This leaves the whole app with only one authored experience and one free-play tool state.

What must change:

- `Explore` may remain.
- But it must sit alongside several proper activity scenes, not replace them.

### 3. Most mission types collapse to the same value-entry mechanic

Current refs:

- `fractions.html:1857-2025`
- `fractions.html:2123-2149`
- `fractions.html:2327-2383`
- `fractions.html:2424-2432`

What the code does now:

- Mission prompts vary.
- But completion is usually just `fracEqual(state.currentValue, target)`.
- The child interacts by:
  - filling segments,
  - toggling grid cells,
  - or dragging one number-line marker.

Why this is wrong:

- Prompt variety is not the same as mechanic variety.
- The app says:
  - build,
  - place,
  - repair,
  - compose,
  - compare.
- But many of those are still the same exact-value input task wearing different text.

What must change:

- Each activity mode needs its own primary verb and its own board behavior.

Required distinction:

- `Build` mode: construct a shown target value.
- `Compare` mode: choose larger/smaller/equal values quickly and visually.
- `Match` mode: connect or pair representations.
- `Place` mode: drag cards or markers to precise number-line positions.
- `Repair` mode: identify a false representation and correct it.

If all of them still reduce to “edit one value until it matches a hidden target,” the redesign has failed.

### 4. Compare exists only as a buried random mission, not as a mode

Current refs:

- `fractions.html:723-748`
- `fractions.html:1869-1888`
- `fractions.html:1967-1983`
- `fractions.html:2082-2090`
- `fractions.html:2171-2186`

What the code does now:

- `compare_pair` is one random mission type among many.
- It shows a prompt like `Which is greater? a vs b`.
- It reveals large `< = >` buttons.
- The child answers once, then the app returns to the generic mission flow.

Why this is wrong:

- This is exactly the kind of interaction that should be a full mode:
  - `Pick the bigger fraction`
  - `Pick the smaller decimal`
  - `Are these equal?`
- Instead, it is a minor branch inside the same shell.

What must change:

- Build a dedicated `Compare` mode.
- It should support repeated rounds with escalating pacing and clarity.
- Example core loop:
  - show two large cards,
  - child taps the bigger value directly,
  - the app reveals the reason with aligned bars or number-line placement,
  - next round starts quickly.

Required example support:

- The app must comfortably handle tasks like:
  - `Select the bigger fraction: 4/5 vs 2/3`
  - `Which is closer to 1: 0.9 or 7/8?`
  - `Are 3/4 and 0.75 equal?`

### 5. `make_equivalent` is not implemented as a transformation

Current refs:

- `fractions.html:1957-1966`
- `fractions.html:2027-2041`
- `fractions.html:2077-2081`
- `fractions.html:2132-2136`

What the code does now:

- The mission says: `Make another name for {value}.`
- Internally, it stores an original fraction and a required new denominator.
- But the player is simply placed into a new denominator context and asked to hit an equal value.

Why this is wrong:

- Equivalent fractions should be one of the most visual and satisfying transformations in the entire app.
- The current version does not show:
  - the original fraction on the board,
  - the repartitioning process,
  - preserved filled area,
  - or a side-by-side “same amount, different name” reveal.
- It behaves like another target-entry task.

What must change:

- Start from the original fraction visibly.
- Show the same whole.
- Animate or interactively repartition the same shape into the required denominator.
- Preserve the filled amount during the transformation.

Required effect:

- `1/2 -> 2/4 -> 4/8` must feel like the same amount being renamed, not a hidden equality check.

### 6. `repair_mismatch` is fake

Current refs:

- `fractions.html:2003-2009`
- `fractions.html:2103-2105`
- `fractions.html:2141-2142`

What the code does now:

- The prompt says: `One picture does not match. Fix it.`
- The mission state only stores a target fraction.
- There is no actual mismatched picture generated.
- There is no broken representation to inspect.
- Completion is still just `fracEqual(state.currentValue, target)`.

Why this is wrong:

- The mission name promises diagnosis and repair.
- The implementation provides neither.
- This is not an incomplete flourish. It is a false product claim.

What must change:

- A repair task must visibly contain a contradiction.
- Examples:
  - bar shows `3/4`, label says `2/4`,
  - number-line point is at `0.6`, card says `7/10`,
  - grid shows `25/100`, decimal card says `0.35`.
- The child must fix one specific broken representation, not rebuild a hidden target from scratch.

If the next version still uses `repair_mismatch` as a renamed build task, reject it.

### 7. `compose_benchmark` is also fake

Current refs:

- `fractions.html:2010-2024`
- `fractions.html:2106-2111`
- `fractions.html:2143-2144`

What the code does now:

- The prompt says: `Make exactly {value}.`
- Internally, it assigns a target fraction.
- Completion is still just exact equality against `state.currentValue`.

Why this is wrong:

- Benchmark composition should feel different from ordinary build tasks.
- It should teach:
  - making exactly `1`,
  - making exactly `1.5`,
  - building `1.25` from wholes and parts,
  - composing from available pieces.
- Right now it is another plain target build.

What must change:

- Use a composition board or piece tray.
- Require the child to assemble a target using multiple visible chunks.
- Highlight benchmark anchors such as `1/2`, `1`, `1 1/2`, `2`.

### 8. The visual design is too generic and too close to the raw repo shell

Current refs:

- `fractions.html:29-46`
- `fractions.html:57-203`
- `fractions.html:1190-1772`

What the code does now:

- Uses a standard repo light theme.
- Uses standard buttons, separators, and panel boxes.
- The board models are plain shapes with minimal texture or atmosphere.

Why this is wrong:

- The repo baseline is only a starting point.
- This app needed its own identity.
- Right now it looks like:
  - standard shell,
  - standard panel,
  - generic SVG diagrams.
- There is no strong visual hook for children.

What must change:

- Give the board a tactile studio feel.
- Add:
  - paper-strip styling,
  - benchmark stickers,
  - ghost targets,
  - clearer mode-specific color language,
  - fraction-wall layering,
  - more deliberate spacing and focal hierarchy.

Non-negotiable rule:

- The next version must look intentionally designed for fractions, not like a generic white-label teaching widget.

### 9. The play surface is too sparse and the panel is too dominant

Current refs:

- `fractions.html:658-715`
- `fractions.html:717-835`
- `fractions.html:205-236`

What the code does now:

- The left stage is mostly empty around a centered model.
- The right panel carries mission prompt, value card, feedback, progress, and summary.

Why this is wrong:

- The board should be the star.
- The board should teach through overlays, targets, alignment aids, and transformation cues.
- Right now the eye goes to the panel because that is where the structure and meaning live.

What must change:

- Move more meaning onto the stage itself:
  - current target markers,
  - comparison callouts,
  - benchmark labels,
  - “same point” overlays,
  - repair highlights,
  - ghost previews of the desired state.

### 10. Interaction richness is below the brief

Current refs:

- `fractions.html:2296-2383`
- `fractions.html:2424-2432`

What the code does now:

- Bar interaction is click-based and index-based.
- Grid interaction is click-based.
- Number-line interaction is a single marker drag.
- There is no real drag-fill across strips.
- There is no direct sort or match interaction.
- There is no piece composition tray.

Why this is wrong:

- Kids engage through tactile verbs.
- The current interactions are serviceable, but they are too thin and too repetitive.

What must change:

- Add richer direct manipulation where the mode requires it.
- Examples:
  - drag across strip parts to paint a value,
  - tap one of two big compare cards directly,
  - drag a decimal card onto a number-line location,
  - connect matching representations,
  - fix a wrong label by moving the right card into place.

### 11. There is almost no meaningful motion or transformation

Current refs:

- `fractions.html:564-577`
- `fractions.html:1191`
- `fractions.html:1476`
- `fractions.html:1614`
- `fractions.html:2152-2165`

What the code does now:

- Re-renders the board immediately.
- Uses a short success pulse.
- Does not animate conceptual changes in a meaningful way.

Why this is wrong:

- This is especially damaging for fractions.
- One of the clearest teaching opportunities is to show the same amount becoming another name.
- That transformation currently has no visual life.

What must change:

- Add small but meaningful animations:
  - repartitioning,
  - marker glide on the number line,
  - reveal lines connecting equivalent forms,
  - compare result alignment,
  - repair correction confirmation.

Important:

- Do not add empty sparkle effects first.
- Add conceptual motion first.

### 12. Feedback is too generic and too weak

Current refs:

- `fractions.html:367-380`
- `fractions.html:2152-2168`
- `fractions.html:2212-2228`
- `fractions.html:2268-2289`

What the code does now:

- Success is mainly `Correct!`.
- Error is mainly `Not quite. Try again!`
- Hints are generic and mostly shared.
- Status text repeats the same small set of phrases.

Why this is wrong:

- Feedback should help the child see why.
- Strong educational feedback is specific and visual.
- Strong product feedback is rewarding and fast.

What must change:

- Feedback must become mode-aware and value-aware.
- Examples:
  - `4/5 is bigger because it lands farther right than 2/3.`
  - `You made 2/4. That lands at the same point as 1/2.`
  - `This grid shows 25/100, not 35/100. Count the shaded rows.`

### 13. The progression is randomized, not taught

Current refs:

- `fractions.html:1857-1901`
- `fractions.html:2260-2265`

What the code does now:

- Uses random mission type selection with shallow repeat suppression.
- Progress is just `0 / 10` per difficulty label.

Why this is wrong:

- A fractions app for children should lead the child through discoveries.
- Randomness can be useful after the core concept is learned.
- It is a poor primary structure for the first-run experience.

What must change:

- Use authored micro-sequences inside each activity mode.
- Example compare sequence:
  1. obvious visual size differences,
  2. same denominator comparisons,
  3. different denominators with aligned bars,
  4. fraction vs decimal,
  5. close benchmark comparisons.

Randomization should come after competence, not replace instruction.

### 14. The model toggle is overexposed and pedagogically misplaced

Current refs:

- `fractions.html:673-680`
- `fractions.html:2495-2511`

What the code does now:

- The user can choose `Bar`, `Circle`, or `Grid` globally from the top toolbar.

Why this is wrong:

- Representation choice is treated like the main mode choice.
- But model family is not the same thing as play mode.
- This makes the UI hierarchy backwards.

What must change:

- In mission-based play, the app should choose the most appropriate model for the concept.
- Let the child switch models mainly in `Explore`, or in clearly marked multi-representation tasks.

The top-level choice should be about activity, not drawing primitive.

## Required Redesign Direction

The next implementation must be reorganized around distinct activity modes.

Recommended product structure:

### A. Top-Level Activity Modes

Use a top-level activity switch such as:

- `Build`
- `Compare`
- `Match`
- `Place`
- `Repair`

Each one must have a different core interaction loop.

### B. Difficulty As Secondary Structure

Within each activity mode, keep:

- `Introduction`
- `Intermediate`
- `Advanced`

Difficulty should change:

- content complexity,
- denominator set,
- decimal range,
- benchmark subtlety.

Difficulty should not be the only visible promise of variety.

### C. Model Choice Should Be Contextual

Rules:

- `Explore`: child may choose bar/circle/grid freely.
- `Build`: use the strongest model for the target concept.
- `Compare`: often show two cards plus aligned bars or line.
- `Place`: prioritize the number line.
- `Repair`: show multiple linked representations together.

### D. Stronger Board-First Teaching

The next board must do more teaching visually.

Required board features across the redesign:

- benchmark callouts,
- side-by-side comparison lanes,
- visible target ghosts,
- aligned wholes,
- equivalence overlays,
- correction highlights in repair tasks,
- more tactile strip and grid styling.

## Mode-by-Mode Guidance

### 1. Build Mode

Purpose:

- connect symbol to model,
- teach numerator/denominator,
- build mixed numbers.

Core interaction:

- fill strips or grids directly,
- see line point move live,
- see exact readouts update live.

### 2. Compare Mode

Purpose:

- answer “which is bigger?” quickly and confidently.

Core interaction:

- tap the bigger card directly,
- or choose `<`, `>`, `=` when truly useful,
- reveal the reasoning visually after the choice.

Minimum required experiences:

- fraction vs fraction,
- fraction vs decimal,
- close-to-benchmark comparisons.

### 3. Match Mode

Purpose:

- connect fraction, decimal, strip, grid, and number-line point.

Core interaction:

- pair cards,
- drag one representation onto its match,
- immediate visual lock-in when correct.

### 4. Place Mode

Purpose:

- make fractions and decimals feel like numbers with location.

Core interaction:

- drag fraction or decimal tokens onto a number line,
- sometimes use zoom for close advanced placements,
- show benchmark anchors clearly.

### 5. Repair Mode

Purpose:

- develop deeper representation checking.

Core interaction:

- inspect a wrong display,
- identify the bad representation,
- fix it directly.

This mode is especially important because it demands real understanding, not just reproduction.

## Acceptance Criteria For The Next Version

Reject the next implementation unless all of the following are true:

1. A child can intentionally enter a dedicated `Compare` mode without waiting for random mission generation.
2. The app can run a sustained “pick the bigger fraction” loop, including examples such as `4/5 vs 2/3`.
3. `make equivalent` visibly transforms one representation into another while preserving amount.
4. `repair mismatch` shows a real mismatch on screen before the child fixes it.
5. `compose benchmark` uses actual composition or benchmark reasoning, not just another hidden target equality check.
6. The board carries more of the teaching load than the right panel.
7. The redesign introduces meaningful conceptual motion, not only celebratory pulse effects.
8. Activity modes feel different even before the child reads the mission text.
9. The app looks intentionally designed for fractions, not like a generic repo shell with new labels.
10. `Explore` remains useful, but it no longer has to carry the burden of being the only alternate play state.

## Final Instruction To The Next Implementing Agent

Do not patch this file cosmetically and call it done.

The redesign must change:

- the information architecture,
- the activity structure,
- the board behavior,
- the visual identity,
- and the emotional rhythm of the app.

If the next version still feels like:

- one generic mission engine,
- one generic play surface,
- one generic right panel,
- and many prompts that all reduce to the same answer mechanic,

then the work has not addressed the actual problem.
