# Fractions App: Chrome Test Plan

## Purpose

This document defines the manual Chrome test pass the implementing agent must execute before claiming the fractions app is stable.

This is not a light smoke test.

The goal is to catch:
- stale task state,
- incorrect visual representation,
- incorrect mode/level transitions,
- bad interaction timing,
- broken mobile/touch behavior,
- localization regressions,
- console/runtime errors,
- authored-sequence vs free-play bugs,
- board/panel mismatches,
- and subtle math-teaching mistakes that only appear during actual use.

The implementing agent must run these tests in Chrome, not only by reading code and not only by running `npm run code-review`.

---

## Scope

App under test:
- `/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html`

Top-level families:
- `Represent`
- `Calculate`

Represent modes:
- `Build`
- `Compare`
- `Match`
- `Place`
- `Repair`

Calculate modes:
- `Add`
- `Subtract`
- `Multiply`
- `Divide`

Levels:
- `Level 1`
- `Level 2`
- `Level 3`
- `Level 4`
- `Level 5`

Special scenes and flows:
- `Explore`
- `Hint`
- `Next`
- board-level next button
- EN/PL language switch
- authored progression
- free play
- desktop pointer use
- touch/mobile use in Chrome device emulation

---

## Required Test Environment

Use:
- latest stable Chrome
- desktop Chrome window
- Chrome DevTools
- Chrome device emulation

Required setup:
1. Open the app in a fresh Chrome tab.
2. Open DevTools Console before starting.
3. Keep Console visible during the run.
4. Use a fresh session for the first pass.
5. Repeat mobile/touch checks in Chrome device mode.

Recommended device presets:
- `390 x 844` mobile
- `768 x 1024` tablet

Recommended Chrome settings during testing:
- Disable cache while DevTools is open.
- Keep Console set to preserve log.
- Record screenshots for any failure.

---

## Exit Criteria

The implementing agent may only claim the app is stable if all of the following are true:

1. `npm run code-review -- fractions.html` passes.
2. No uncaught Console errors appear during the manual Chrome pass.
3. Every mode works at every level.
4. Every authored activity family is exercised.
5. Free play is exercised for every mode.
6. EN and PL remain correct.
7. Desktop and mobile/touch both work.
8. No stale state, wrong prompt, wrong readout, or orphaned animation remains after switching mode/family/level/language mid-session.
9. No math representation is visually incorrect.

---

## Test Execution Rules

1. Do not skip a test because the code “looks correct”.
2. Do not mark a test passed unless you actually exercised it in Chrome.
3. If a test fails, capture:
   - test ID,
   - steps,
   - expected result,
   - actual result,
   - screenshot,
   - Console output if any.
4. After fixing a bug, rerun:
   - the failing test,
   - neighboring tests in the same area,
   - and the relevant stale-state transition tests.
5. Do not rely only on the happy path.
6. Every mode must be tested with:
   - at least one correct interaction,
   - at least one incorrect interaction,
   - one task transition,
   - and one sequence/free-play transition.

---

## Coverage Matrix

The agent must cover all `9 modes x 5 levels = 45 mode-level cells`.

For every cell in this matrix, execute the following minimum checks:

1. Start the mode at that level and confirm the prompt/board/panel/progress all match.
2. Complete one authored round correctly.
3. Trigger one incorrect interaction and confirm the app recovers cleanly.
4. Use `Hint` once if available in that context.
5. Advance to the next round and confirm the new round is fresh, not stale.
6. Continue until authored sequence is exhausted and complete one free-play round.
7. Confirm no stale visual or state artifacts remain.

Matrix to cover:

### Represent
- `Build` levels `1, 2, 3, 4, 5`
- `Compare` levels `1, 2, 3, 4, 5`
- `Match` levels `1, 2, 3, 4, 5`
- `Place` levels `1, 2, 3, 4, 5`
- `Repair` levels `1, 2, 3, 4, 5`

### Calculate
- `Add` levels `1, 2, 3, 4, 5`
- `Subtract` levels `1, 2, 3, 4, 5`
- `Multiply` levels `1, 2, 3, 4, 5`
- `Divide` levels `1, 2, 3, 4, 5`

---

## Test Pass Order

Run the test plan in this order:

1. Boot and global UI
2. Navigation and state reset
3. Represent family desktop pass
4. Calculate family desktop pass
5. Sequence/free-play pass
6. Localization pass
7. Mobile/touch pass
8. Stress/random-walk pass
9. Regression rerun of any failed areas

---

## Test Cases

### A. Boot And Global UI

`TC-A01` Fresh load
- Open `fractions.html` in Chrome.
- Expected:
  - app loads without broken layout,
  - first mode renders,
  - Console has no uncaught errors,
  - family/mode/level controls are visible,
  - prompt and board are in sync.

`TC-A02` Hard reload
- Reload the page with DevTools open.
- Expected:
  - no duplicate event behavior,
  - no missing text,
  - no broken board after reload.

`TC-A03` Header and toolbar integrity
- Verify header, family row, mode row, level buttons, action buttons.
- Expected:
  - nothing overlaps,
  - active family/mode/level are obvious,
  - action buttons are readable in current language.

`TC-A04` Console cleanliness during normal use
- Click through 10 rounds across mixed modes.
- Expected:
  - no uncaught exceptions,
  - no runaway warnings caused by repeated rerenders,
  - no obvious resource errors.

`TC-A05` Progress display sanity
- Complete several rounds in one mode, then switch level.
- Expected:
  - progress bar and fraction counter update correctly,
  - progress belongs to the current family/mode/level cell,
  - switching cell does not show unrelated progress.

`TC-A06` Panel readout sanity
- Observe panel at startup, during active interaction, after success, after mode switch.
- Expected:
  - panel never shows stale impossible values,
  - decimal/fraction readouts match board context,
  - placeholder state looks intentional when no current value exists.

`TC-A07` Board next button vs toolbar next button
- Use both ways to advance.
- Expected:
  - both advance the same state,
  - neither leaves stale overlays,
  - neither skips cleanup.

---

### B. Navigation And Stale-State Reset

`TC-B01` Family switch while idle
- Switch `Represent -> Calculate -> Represent`.
- Expected:
  - correct last-mode restoration per family,
  - no stale board from previous family,
  - `Explore` only available in `Represent`.

`TC-B02` Mode switch while idle
- Switch through all modes at one level.
- Expected:
  - board, summary, panel, and progress all update together.

`TC-B03` Level switch while idle
- Click all five levels inside the same mode.
- Expected:
  - new round loads,
  - old state disappears,
  - level-specific content changes.

`TC-B04` Mode switch mid-interaction
- Start an interaction but do not finish it, then switch mode.
- Expected:
  - partial selection/drag/phase state is cleared,
  - new mode starts clean.

`TC-B05` Level switch mid-interaction
- Start an interaction, then switch level.
- Expected:
  - no stale task survives the switch,
  - panel/progress belong to new level only.

`TC-B06` Family switch mid-interaction
- Start a task in one family, switch families immediately.
- Expected:
  - no leftover overlay, hover, prompt, or animation remains.

`TC-B07` Language switch mid-interaction
- Switch EN/PL during partially completed tasks in several modes.
- Expected:
  - all visible UI text updates,
  - board content remains valid,
  - no stale English/Polish fragment remains.

`TC-B08` Hint after wrong attempt
- Make a wrong move, then use `Hint`.
- Expected:
  - hint matches current task,
  - hint is not from previous task,
  - hint does not break progression.

`TC-B09` Next after success
- Complete a task, then advance immediately.
- Expected:
  - success state clears,
  - next task is fresh,
  - board-level preview/selection state is reset.

`TC-B10` Next after unfinished task if available
- Attempt to advance without solving, where the UI permits it.
- Expected:
  - no broken progress accounting,
  - no task/prompt mismatch,
  - if blocked, block is intentional and consistent.

`TC-B11` Resize mid-session
- Resize Chrome window while a mode is active and while a task is partly interacted with.
- Expected:
  - board remains usable,
  - no clipped or misplaced elements,
  - no stale hit zones.

`TC-B12` Re-enter same mode-level after leaving it
- Start a task, leave the mode, then come back.
- Expected:
  - state is correct for current progression,
  - no stale selection/drag persists.

---

### C. Represent Family

#### Build

`TC-C01` Build Level 1 authored happy path
- Complete the first authored `Build` round at Level 1.
- Expected:
  - board matches prompt,
  - candidate preview is clear,
  - final filled value is correct,
  - success transitions correctly.

`TC-C02` Build incorrect then correct
- Intentionally choose the wrong fill, then correct it.
- Expected:
  - app allows recovery cleanly,
  - panel and board resync,
  - no stale preview remains.

`TC-C03` Build over-one / multi-whole strip
- Use a Level 3-5 round that crosses one whole.
- Expected:
  - whole boundaries are visible,
  - filled amount matches the stated fraction,
  - no clipping or denominator distortion.

`TC-C04` Build circle model
- Exercise a round using the circle model.
- Expected:
  - preview wedge matches the selected segment,
  - final filled amount matches the prompt.

`TC-C05` Build repartition / equivalent transformation
- Exercise a round with `sourceValue`.
- Expected:
  - source and target relationship is mathematically correct,
  - animation preserves amount,
  - no stale source/target overlay remains after success.

`TC-C06` Build touch preview
- In Chrome device mode, first tap a segment, then tap again to commit.
- Expected:
  - first tap previews only,
  - second tap commits,
  - tapping a different segment moves the preview instead of committing instantly.

`TC-C07` Build no answer leak
- Start a fresh `Build` round and inspect the strip before acting.
- Expected:
  - the main strip does not already draw the final answer,
  - the child still has to reason about where to fill.

`TC-C08` Build sequence reset
- Advance to next round after previewing but before committing.
- Expected:
  - no hover/touch preview survives into the next task.

#### Compare

`TC-C09` Compare left larger
- Solve a round where the left value is larger.
- Expected:
  - left choice works,
  - reveal is correct,
  - number line and aligned bars agree.

`TC-C10` Compare right larger
- Solve a round where the right value is larger.
- Expected:
  - right choice works,
  - reveal is correct.

`TC-C11` Compare equal case
- Solve an equal round using the equality choice.
- Expected:
  - equality is available before knowing the answer,
  - prompt wording fits the three-choice interaction,
  - equal reveal is correct.

`TC-C12` Compare decimal display
- Exercise rounds with decimal rendering on one side and on both sides if available.
- Expected:
  - displayed decimal value matches the fraction exactly,
  - reveal compares equal wholes.

`TC-C13` Compare wrong answer recovery
- Intentionally choose the wrong card or `=?`.
- Expected:
  - feedback is correct,
  - reveal teaches the right result,
  - next round starts clean.

`TC-C14` Compare touch preview
- In Chrome device mode, first tap previews a choice, second tap commits.
- Expected:
  - touch preview is visible,
  - no accidental instant commit on first touch for compare.

#### Match

`TC-C15` Match fraction-bar pair
- Exercise a `fraction + bar` round.
- Expected:
  - correct pairs match,
  - wrong pairs visibly reject,
  - matched pairs are clearly grouped on the board.

`TC-C16` Match fraction-decimal pair
- Exercise a `fraction + decimal` round.
- Expected:
  - decimal value is mathematically correct,
  - matched pair grouping remains clear.

`TC-C17` Match equivalent-fraction pair
- Exercise a `fraction + equivalent` round.
- Expected:
  - card display shows true equivalent fractions, not duplicates of the same canonical form,
  - matching logic uses value equivalence correctly.

`TC-C18` Match wrong-pair feedback
- Select one card, then choose an incorrect second card.
- Expected:
  - rejection is obvious on the board,
  - selection clears cleanly after feedback,
  - no stale connection line remains.

`TC-C19` Match completion state
- Finish a full match round.
- Expected:
  - all pairs remain visually understandable,
  - next round starts clean.

#### Place

`TC-C20` Place one-token round
- Complete a single-token place task.
- Expected:
  - pin/halo is visible,
  - dragged card is clearly connected to the line,
  - correct placement works.

`TC-C21` Place two-token round
- Complete a multi-token round.
- Expected:
  - placed markers remain individually identifiable,
  - overlap handling/staggering stays readable.

`TC-C22` Place decimal token
- Exercise a token shown as decimal.
- Expected:
  - token label matches the correct location,
  - final placed marker label remains readable.

`TC-C23` Place improper fraction
- Exercise a value above `1`.
- Expected:
  - location on the line is correct,
  - no clipping or off-by-one placement error.

`TC-C24` Place wrong drop
- Drop on the wrong tick.
- Expected:
  - bounce-back begins from the visible position,
  - no teleport,
  - token returns to tray cleanly.

`TC-C25` Place correct-drop settle
- Make a correct placement and watch the transition carefully.
- Expected:
  - the label does not cut instantly,
  - settle motion is readable,
  - placed marker state is visually connected to the drag state.

`TC-C26` Place below-axis layout
- Inspect active drag and final placed state.
- Expected:
  - card/label is below the axis,
  - connector goes upward to the line,
  - tray does not collide with placed markers.

`TC-C27` Place cancel outside band
- Drag outside the active band and release.
- Expected:
  - cancel path is stable,
  - no stuck drag state,
  - no orphaned marker remains.

#### Repair

`TC-C28` Repair identify-to-fix flow
- Complete one repair round normally.
- Expected:
  - objective is obvious,
  - identify phase and fix phase are distinct,
  - final all-match state resolves clearly.

`TC-C29` Repair wrong identify tap
- Tap a correct representation during identify phase.
- Expected:
  - wrong tap feedback is visible,
  - board remains in identify phase,
  - no stray fix UI appears.

`TC-C30` Repair wrongRepr coverage
- Exercise rounds where each wrong representation appears:
  - `fraction`
  - `numberLine`
  - `bar`
  - `decimal`
- Expected:
  - each wrong representation is visibly wrong,
  - each can be fixed correctly.

`TC-C31` Repair fix options anchoring
- Enter fix phase and inspect option placement.
- Expected:
  - options feel attached to the selected wrong card,
  - options do not overlap other cards,
  - selected wrong card remains the visual focus.

`TC-C32` Repair onboarding behavior
- Verify onboarding appears only once per fresh session.
- Expected:
  - it appears on first entry,
  - it does not repeat annoyingly in the same session,
  - it does not break the board.

#### Explore

`TC-C33` Explore availability
- Verify `Explore` is usable in `Represent` and disabled or unavailable in `Calculate`.

`TC-C34` Explore controls
- Change model/values in explore.
- Expected:
  - controls affect the explore board,
  - exiting explore returns to activity mode cleanly.

---

### D. Calculate Family

#### Add

`TC-D01` Add `joinStrips`
- Complete an authored `joinStrips` round.
- Expected:
  - bar model is mathematically correct,
  - total matches prompt and result.

`TC-D02` Add `jumpLine`
- Complete an authored `jumpLine` round.
- Expected:
  - jumps and total position are correct,
  - reveal is consistent with the sum.

`TC-D03` Add `makeOne`
- Complete a `makeOne` or complement-style round.
- Expected:
  - missing addend logic is correct,
  - board teaches complement, not hidden target guessing.

`TC-D04` Add estimate-first round
- Exercise a Level 5 prediction round.
- Expected:
  - estimate prompt matches the actual task,
  - prediction feedback belongs to the current round only,
  - reveal does not reuse stale prediction state.

`TC-D05` Add over-one result
- Exercise an authored or free-play round whose sum exceeds one whole.
- Expected:
  - strips and labels preserve whole boundaries,
  - result value is not visually clamped or misleading.

#### Subtract

`TC-D06` Subtract `takeAwayStrip`
- Complete a take-away round.
- Expected:
  - board clearly shows what is removed and what remains,
  - result is correct.

`TC-D07` Subtract `gapFinder`
- Complete a gap-finding round.
- Expected:
  - missing gap is the thing being solved,
  - result and board align.

`TC-D08` Subtract `repairDifference`
- Complete a repair-difference round.
- Expected:
  - this board type feels distinct,
  - correction logic is mathematically correct.

`TC-D09` Subtract estimate-first
- Exercise a prediction round.
- Expected:
  - estimate benchmark text matches the step,
  - no stale prediction feedback leaks into later rounds.

`TC-D10` Subtract mixed/over-one
- Use a harder round with mixed values or multiple wholes.
- Expected:
  - visuals remain mathematically honest,
  - no clipping or wrong whole boundary.

#### Multiply

`TC-D11` Multiply `fractionOf`
- Complete a fraction-of round.
- Expected:
  - selected part-of-whole is correct.

`TC-D12` Multiply `repeatPiece`
- Complete a repeat-piece round.
- Expected:
  - repeated fraction amount is shown correctly,
  - whole-number times fraction is not misrepresented.

`TC-D13` Multiply `areaQuilt`
- Complete an area model round.
- Expected:
  - overlap/product region is correct,
  - partitioning is consistent.

`TC-D14` Multiply `scaleMachine`
- Complete a scale-machine round.
- Expected:
  - scaling effect is visually correct,
  - product is not double-scaled or otherwise distorted.

`TC-D15` Multiply estimate-first
- Exercise a prediction round.
- Expected:
  - benchmark logic and reveal match,
  - no stale estimate state survives into next rounds.

#### Divide

`TC-D16` Divide `shareFairly`
- Complete a share-fairly round.
- Expected:
  - quotient as share size is clear,
  - board and numeric result agree.

`TC-D17` Divide `howManyFit`
- Complete a measurement-division round.
- Expected:
  - repeated fitting is correct,
  - board type matches the mathematical story.

`TC-D18` Divide estimate-first
- Exercise a prediction round.
- Expected:
  - prediction prompt matches the actual quotient task,
  - no stale prediction feedback leaks.

`TC-D19` Divide fraction ÷ whole
- Exercise a sharing round with fractional dividend.
- Expected:
  - result is correct and visible on the board.

`TC-D20` Divide whole ÷ unit fraction
- Exercise a measurement round such as whole divided by quarter/third/etc.
- Expected:
  - board does not accidentally switch to the wrong division model.

---

### E. Sequence And Free-Play Integrity

`TC-E01` Authored progression exhaustion per mode
- For each mode, continue until authored sequence ends and free play starts.
- Expected:
  - no recursion/error,
  - free play starts cleanly,
  - no blank round.

`TC-E02` Free-play difficulty integrity
- At Levels 4-5, inspect free-play content after authored sequence ends.
- Expected:
  - free play remains level-appropriate,
  - it does not collapse into obviously easier generic rounds only.

`TC-E03` Progress tracking after free play
- Complete free-play rounds after authored sequence ends.
- Expected:
  - no broken progress display,
  - no sequence index errors,
  - next/board-next continue to work.

`TC-E04` Task freshness after repeated next transitions
- Advance through many rounds in the same mode.
- Expected:
  - no stale prompt, stale highlight, stale selection, stale fix options, stale prediction, or stale drag state appears.

---

### F. Localization

`TC-F01` Global EN/PL switch
- Switch languages from multiple modes and phases.
- Expected:
  - all visible chrome text updates.

`TC-F02` Dynamic step text
- Confirm step-level goal/hint/feedback text switches correctly.

`TC-F03` Compare labels and equality wording
- Verify compare prompt and equality label in both languages.

`TC-F04` Place and Repair new strings
- Verify all new strings in both languages:
  - place prompt,
  - watch prompt,
  - repair phase labels,
  - repair instructions,
  - onboarding.

`TC-F05` Decimal formatting in Polish
- In PL, verify decimal comma is used everywhere it should be:
  - panel,
  - cards,
  - placed markers,
  - repair decimal,
  - compare decimal.

`TC-F06` Accessibility labels in current language
- Inspect main interactive buttons and relevant controls.
- Expected:
  - title/aria labels are not stuck in the wrong language.

`TC-F07` No mixed-language artifacts
- Switch languages repeatedly while advancing rounds.
- Expected:
  - no stale English prompt in Polish mode or vice versa.

---

### G. Mobile And Touch In Chrome

Run these in Chrome device emulation at minimum:
- `390 x 844`
- `768 x 1024`

`TC-G01` Mobile overall layout
- Open the app in device mode.
- Expected:
  - toolbar, board, and panel stack cleanly,
  - no clipped controls.

`TC-G02` Compare mobile layout
- Inspect compare scene on mobile width.
- Expected:
  - choice cards and equality choice remain readable and tappable,
  - scene feels intentionally laid out, not just shrunk.

`TC-G03` Match mobile layout
- Inspect match scene on mobile width.
- Expected:
  - cards remain readable,
  - touch targets are usable,
  - connection lines still make sense.

`TC-G04` Place mobile layout
- Inspect place scene on mobile width.
- Expected:
  - line, tray, dragged card, and placed labels all fit,
  - below-axis markers do not collide with tray.

`TC-G05` Repair mobile layout
- Inspect repair scene on mobile width.
- Expected:
  - four-part logic remains readable,
  - options do not overlap cards,
  - phase instruction remains clear.

`TC-G06` Build touch interaction
- In mobile device mode, test first-tap preview and second-tap commit.

`TC-G07` Compare touch interaction
- In mobile device mode, test preview tap then commit tap.

`TC-G08` Place drag with touch
- Drag token to the line using device mode touch simulation.
- Expected:
  - drag remains anchored,
  - drop logic is stable,
  - release works consistently.

`TC-G09` Repair touch selection
- Tap identify and fix choices via touch emulation.
- Expected:
  - no accidental double-activation,
  - no missed taps due to small targets.

`TC-G10` Calculate mobile readability
- Open each calculate mode once on mobile width.
- Expected:
  - main board remains interpretable,
  - answer options are tappable,
  - no text is tiny or overlapped.

`TC-G11` Rotate-equivalent resize
- Change from narrow to wider device width during an active task.
- Expected:
  - board remains stable,
  - no stale hit zone or visual misplacement appears.

---

### H. Visual And Mathematical Invariants

These are cross-cutting checks. Apply them whenever relevant.

`TC-H01` Same whole rule
- In compare and related views, verify both values are compared against the same whole unless the lesson explicitly says otherwise.

`TC-H02` Number line exactness
- Markers and dots must land exactly where the displayed value belongs.

`TC-H03` Whole boundaries
- Any value above one whole must preserve visible whole boundaries.

`TC-H04` Equivalent naming correctness
- Equivalent fractions must show different names for the same amount, not duplicate canonical labels.

`TC-H05` Decimal correctness
- Friendly decimal representations must be numerically exact and visually consistent.

`TC-H06` Mixed number formatting
- Mixed number display must agree with the represented value.

`TC-H07` No overlapping board elements
- Cards, prompts, fix trays, labels, stems, markers, and lines must not overlap in confusing ways.

`TC-H08` No off-canvas/clipped math
- No strip, card, option, or label should be clipped or drawn off the visible board.

`TC-H09` Reveal honesty
- Reveal animations must not show values that disagree with the actual logic.

`TC-H10` Panel/board agreement
- Side-panel value, simplified form, and decimal must agree with the board context when a value is supposed to be active.

---

### I. Stress And Random Walk

`TC-I01` 15-minute random walk
- Use the app continuously for 15 minutes:
  - switch families,
  - switch modes,
  - switch levels,
  - solve some rounds,
  - fail some rounds,
  - use hints,
  - toggle language.
- Expected:
  - no stale tasks,
  - no broken layouts,
  - no console errors.

`TC-I02` 50-round progression run
- Advance through 50 rounds spread across families.
- Expected:
  - no sequence corruption,
  - no progress corruption,
  - no stale overlays or old prompts.

`TC-I03` Rapid language toggling
- Toggle EN/PL repeatedly during active use.
- Expected:
  - no mixed-language UI fragments,
  - no broken board state.

`TC-I04` Rapid mode/level switching
- Quickly change modes and levels several times.
- Expected:
  - no race-condition artifacts,
  - no broken selection or animation leftovers.

`TC-I05` Drag/release edge behavior
- In `Place`, drag, leave the board area, re-enter, release, then start another drag.
- Expected:
  - drag state always resolves cleanly.

---

## Required Result Reporting

The implementing agent must report:

1. Which test IDs were executed.
2. Which mode-level cells were covered.
3. Which board subtypes were covered:
   - `joinStrips`
   - `jumpLine`
   - `makeOne`
   - `takeAwayStrip`
   - `gapFinder`
   - `repairDifference`
   - `fractionOf`
   - `repeatPiece`
   - `areaQuilt`
   - `scaleMachine`
   - `shareFairly`
   - `howManyFit`
4. Which tests failed.
5. For each failure:
   - test ID,
   - reproduction steps,
   - expected,
   - actual,
   - screenshot note,
   - Console note.

Do not report:
- “tested thoroughly”
- “looks good”
- “no obvious issues”

Report concrete coverage only.

---

## Minimum Acceptable Final Run

Before sign-off, at minimum the implementing agent must honestly be able to say:

1. I ran Chrome manually.
2. I tested all 45 mode-level cells.
3. I exhausted authored sequence into free play for every mode at least once.
4. I tested desktop and mobile/touch.
5. I checked Console throughout.
6. I specifically stressed stale-state transitions.
7. I either found and fixed bugs or can point to the exact test evidence that the app passed.

