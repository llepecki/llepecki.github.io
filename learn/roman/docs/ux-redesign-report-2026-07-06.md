# Roman Numerals UX Redesign Report

Audit target: `roman/index.html`

Audit date: 2026-07-06

Purpose: identify the UX problems that make the implemented Roman Numerals app
feel unintuitive, and specify concrete redesign work for the next implementing
agent.

## 1. Executive Summary

The app has the right educational ingredients, but the current interface asks
the learner to understand the app structure before they can start learning
Roman numerals.

The main UX issue is not a missing feature. It is that the app exposes too many
conceptual controls at once:

- seven equal-weight modes,
- five levels,
- a canvas stage,
- a detached tile tray,
- a mission card,
- separate action controls,
- readouts,
- progress counters,
- an About instruction paragraph.

For a child, the first question becomes "what should I press?" instead of
"what does this numeral mean?"

The redesign should make every screen answer these three questions immediately:

1. What am I trying to do?
2. Where do I do it?
3. What happened after I tried?

The app should keep the current educational model, converter, levels, and
single-file architecture. The main work is information architecture,
interaction flow, copy hierarchy, and feedback placement.

## 2. Highest-Priority Fixes

Implement these first. They address the confusion most likely to block a new
user.

### P0. Replace the seven-button mode wall with a guided task launcher

Current problem:

- The first panel section shows seven equal-weight mode buttons: Guided,
  Explore, Read, Write, Repair, Hunt, Sprint.
- Code areas:
  - CSS: `roman/index.html` lines 244-275
  - DOM: `roman/index.html` lines 852-876
  - mode state: `roman/index.html` lines 2190-2218
- A novice cannot infer which mode is recommended, which modes are lessons,
  which are games, and which are advanced.
- "Read", "Write", "Repair", "Hunt", and "Sprint" are labels for app
  mechanics, not learner goals.

Required redesign:

- Replace the first visible control group with one primary task card:
  - title: `Start here`
  - primary button: `Learn with a guide`
  - secondary buttons: `Practice reading`, `Practice writing`
- Move the full mode list into a lower `More modes` section or segmented
  group that appears after the task card.
- Keep all modes available; do not lock them. But do not give all seven equal
  visual priority on first view.
- Rename mode labels to goal-oriented labels:
  - `Guided` -> `Learn`
  - `Explore` -> `Build freely`
  - `Read` -> `Read Roman`
  - `Write` -> `Write Roman`
  - `Repair` -> `Fix mistakes`
  - `Hunt` -> `Find in the world`
  - `Sprint` -> `Quick practice`
- If space is tight, use a select-style "Practice type" control after the
  primary task card instead of a 7-button grid.

Acceptance criteria:

- A first-time user sees one obvious primary action above all other controls.
- The user can start the guided lesson without interpreting all modes.
- Advanced/secondary modes are still reachable but visually secondary.

### P0. Put the current task, input controls, and feedback in one vertical flow

Current problem:

- The task appears in one panel section, tile controls live on top of the
  canvas, Undo/Clear live in another panel section, Check/Hint live elsewhere,
  and feedback is in the readouts section.
- Code areas:
  - tile tray DOM: lines 815-849
  - mission DOM: lines 905-910
  - build/action DOM: lines 912-1020
  - readouts/feedback DOM: lines 1021-1042
  - visibility logic: lines 2244-2263
- The learner has to scan several regions to know what to do.

Required redesign:

- Reorder the panel around a single task flow:
  1. Task card: goal, target, one-line instruction.
  2. Answer controls: choices, number input, or symbol tiles.
  3. Primary action row: Check / Hint / Undo / Clear as relevant.
  4. Immediate feedback card.
  5. Readouts/details collapsed or visually secondary.
- The active answer controls must be directly below the task card.
- The feedback card must appear directly below the active controls, not buried
  after readouts.
- In modes with choice cards, hide `Check`; choosing a card is the answer.
- In modes that build with symbols, show symbol tiles in the answer-control
  section, not only on the canvas.

Acceptance criteria:

- For every mode, the panel can be read top to bottom as: goal -> act ->
  feedback.
- There is never a screen where the active input is visually separated from the
  instruction by unrelated controls.

### P0. Move or duplicate symbol tiles into the panel answer area

Current problem:

- The visible symbol tiles are absolutely positioned on the canvas at lines
  328-337 and 815-849.
- The panel has a section labeled `Inscription`, but it only contains Undo and
  Clear (lines 912-920).
- There is no visible section label beside the tile tray. `lblSymbols` exists
  in translations but there is no visible panel section for it.
- A user reading the panel sees "Inscription" and only Undo/Clear, so the
  actual input controls look detached from the task.

Required redesign:

- Add a visible `Symbol tiles` panel section directly below the task card for
  build/write/repair/explore modes.
- Put the seven tile buttons in that section.
- Keep optional canvas drag/drop, but make tapping panel tiles the primary
  input path.
- The canvas tile tray may be removed, or it may become a secondary visual
  tray. Do not make the canvas tray the only visible symbol input.
- Disable unavailable symbols only if each disabled tile has a visible reason:
  `Level 1 uses I, V, X. L appears in Level 2.`
- Prefer hiding future symbols behind a small `More symbols later` note for
  Level 1 instead of showing four disabled tiles with no explanation.

Acceptance criteria:

- A child can complete every build/write/repair task using controls located in
  the panel immediately below the task.
- The canvas remains a visual workspace, not the only place where the learner
  discovers the controls.

### P0. Redesign Guided mode as a visible step-by-step lesson, not a paragraph

Current problem:

- Guided mode shows a paragraph, Back, disabled Next, and Skip (lines 889-904).
- The required action is embedded in prose, e.g. "Tap I twice to build II".
- Next is disabled until the action is complete, but the UI does not visually
  say that the user must use the tile controls before Next will unlock.
- Guided success is detected automatically by `guidedBuildCheck` (lines
  3827-3852), but the target is not displayed as a separate goal.

Required redesign:

- Make each Guided step a small lesson card with:
  - `Learn:` one short rule.
  - `Do:` one explicit action.
  - `Goal:` the target Roman or Arabic answer.
  - `Status:` waiting / done.
- Example:
  - Learn: `I means 1.`
  - Do: `Tap I twice.`
  - Goal: `II`
  - Status before action: `Build II to unlock Next.`
- Highlight only the relevant tile(s) for that step.
- Show the target on the canvas near the empty drop zone.
- Replace disabled Next ambiguity with a clear disabled label or note:
  `Next unlocks after you build II.`
- When the step is complete, place the success message in the guided card and
  make the primary button `Next step`.

Acceptance criteria:

- A first-time learner can tell what to do without reading the About section.
- The reason Next is disabled is visible.
- The target answer is shown as a separate visual object, not only inside
  paragraph text.

### P0. Stop full-screen overlays from interrupting wrong-answer learning

Current problem:

- `resolveMission` shows a full-screen result overlay for every resolved
  non-sprint answer, including wrong Read answers (lines 3374-3378).
- The overlay is created at lines 4020-4049.
- Dismissing the overlay automatically starts a new mission for non-guided,
  non-sprint modes (lines 4060-4068).
- In Read mode, a wrong choice ends the mission immediately through
  `checkReadAnswer` (lines 3390-3412).
- This prevents quick correction and separates feedback from the numeral.

Required redesign:

- Use inline feedback for `far` and `miss` results.
- Do not auto-advance after a wrong Read answer.
- Let the learner try again after one wrong answer, unless in Sprint mode.
- Reserve full-screen overlays for:
  - level completion,
  - sprint summary,
  - optional first perfect answer per session.
- For ordinary correct answers, use a compact inline success card and a visible
  `Next` button.
- For wrong answers, keep the current prompt visible and highlight the relevant
  chunk or choice.

Acceptance criteria:

- A wrong answer never causes an immediate full-screen takeover in normal Read,
  Write, Repair, or World modes.
- Dismissing feedback never silently replaces the mission after a wrong answer.
- The learner can connect the feedback sentence to the visible numeral/chunk.

## 3. Mode-Specific UX Problems And Required Fixes

### 3.1 Explore mode lacks a clear purpose

Current behavior:

- Explore shows the tile tray, Undo/Clear, Arabic number input, Show standard
  form, readouts, progress, and About.
- There is no task card. The canvas prompt says "Drag or tap tiles to carve",
  but the panel does not give a suggested first action.
- `Check` is hidden in Explore by `updateVisibility` line 2258.

UX problem:

- Explore feels like a control board, not a learning surface.
- The Arabic number input and tile input are both active, but the relationship
  between them is not presented as the central idea.
- `Show standard form` is ambiguous. It sounds like it will explain the current
  Roman form, but it actually uses the Arabic input to set tiles.

Required fix:

- Add an Explore task card:
  - title: `Build any number`
  - instruction: `Tap Roman tiles or type an Arabic number. Both views update.`
- Rename `Show standard form` to `Build this number`.
- Add two clear subtabs or rows:
  - `Build with Roman tiles`
  - `Build from Arabic number`
- Add 3 example chips:
  - `Try 4`
  - `Try 9`
  - `Try 2026`
- Hide progress counters in Explore until at least one mission has been
  completed elsewhere.

### 3.2 Read mode uses conflicting answer patterns

Current behavior:

- For levels 1-2, Read mode uses choice buttons.
- For higher levels, it uses typed numeric input.
- The Check button remains visible even when choices are shown.
- Pressing Check without choosing a choice shows "Type or choose a number
  first", although there is no visible text input in choice mode.
- Code areas:
  - answer DOM: lines 955-1000
  - Check behavior: lines 3499-3547
  - choice behavior: lines 3549-3559

UX problem:

- The learner sees both answer choices and Check/Hint, but the primary action
  is not obvious.
- In choice mode, Check is a dead-end control.

Required fix:

- If choices are visible, hide Check and make each choice button the primary
  action.
- Put Hint below choices, not beside a hidden/irrelevant Check workflow.
- After a wrong choice, mark the choice as wrong, show inline feedback, and
  allow another choice.
- After the second wrong choice, show the chunk explanation and a `Next`
  button.
- For typed mode, place the input and Check on the same row:
  `Answer: [input] [Check]`.

### 3.3 Write mode does not make the target-building process visible enough

Current behavior:

- The mission target shows only the Arabic number.
- The tile tray is detached on the canvas.
- Chunk feedback appears mostly in readouts and canvas chunk boxes.

UX problem:

- The child is asked to write Roman numerals but is not guided through the
  thousands/hundreds/tens/ones construction that the app is supposed to teach.

Required fix:

- For Write mode, show a `Build plan` row under the target:
  - thousands
  - hundreds
  - tens
  - ones
- Before checking, show blank slots:
  - `1000s [ ] 100s [ ] 10s [ ] 1s [ ]`
- As tiles are added, fill the literal chunks.
- On Hint, fill only the next relevant chunk.
- On Check, highlight the first wrong chunk and name it in feedback.

### 3.4 Repair mode needs edit affordances, not only tile dragging

Current behavior:

- Repair mode preloads the bad numeral into `state.tiles` at lines 3325-3328.
- The learner can drag/reorder tiles or tap a placed tile, which removes it
  through `dragEnd` lines 4115-4123.
- There is no visible "replace this tile" or "delete" affordance.

UX problem:

- Repair is conceptually about fixing mistakes, but the interaction model is
  hidden. A tap on a placed tile deletes it, which is surprising and risky.

Required fix:

- In Repair mode, make placed tiles selectable.
- Show a small inline edit toolbar when a tile is selected:
  - Delete
  - Replace with I/V/X/L/C/D/M
  - Move left/right
- Keep drag reorder as optional, not required.
- Add an instruction line:
  `Select a wrong tile, delete it, or add the missing standard pair.`
- Highlight the suspected issue from `analyzeRoman` on load:
  - e.g. in `IIII`, highlight the fourth `I`;
  - in `VX`, highlight the pair.

### 3.5 World Hunt has unclear visual roles

Current behavior:

- World missions can be read or write.
- In write missions, context art is drawn with a `?` on canvas, while the panel
  target shows an Arabic value.
- The same generic tile tray and Check workflow is used.

UX problem:

- The context art is decorative more than instructional. The learner still
  solves a generic write/read task.

Required fix:

- Make context determine the answer slot:
  - clock: empty hour marker on the clock face,
  - chapter: blank chapter label,
  - plaque: blank exhibit plaque,
  - movie: `PART ____`,
  - year: blank cornerstone year,
  - monarch: `Name ____`.
- Put the answer slot on both canvas and panel.
- In Read context, keep the Roman label visible and ask for Arabic.
- In Write context, keep the Arabic target visible and ask the child to fill
  the Roman label.
- Keep the fun fact about `IIII` only in clock missions where it is directly
  relevant.

### 3.6 Sprint mode should not inherit normal mission ambiguity

Current behavior:

- Sprint starts from a separate button and then uses mixed mission generation.
- It auto-advances after 1300 ms through `sprintRoundDone` lines 3932-3945.

UX problem:

- Sprint is a fluency mode, but if the base modes are not obvious, Sprint feels
  abrupt. Auto-advance can also move before the learner finishes reading the
  explanation.

Required fix:

- Show a sprint intro card with:
  - `10 rounds`
  - current level range,
  - included task types,
  - `Start`
- During sprint, keep the task card extremely compact:
  - round count,
  - task,
  - answer controls,
  - one-line feedback.
- Auto-advance only after correct answers.
- For wrong answers, pause and show `Next round` so the child can read the
  correction.

## 4. Canvas And Visual Workspace Problems

### 4.1 Empty drop target is too subtle

Current behavior:

- Empty inscription state draws only a small dashed rectangle on the tablet
  (lines 2658-2668).

UX problem:

- The empty drop zone does not look like a place where the user should act.
- On first use, the canvas appears mostly decorative.

Required fix:

- Draw a labeled drop lane:
  - `Build here`
  - a long inscription baseline,
  - plus ghost slots for the current target length in Guided/Write/Repair.
- In Guided step 1, draw two ghost `I` slots for target `II`.
- In Write mode, draw chunk slots instead of one generic dashed box.

### 4.2 Chunk strip lacks explanatory labels

Current behavior:

- The chunk strip uses numeric labels `1000`, `100`, `10`, `1` at lines
  2713-2764.

UX problem:

- `1000 / 100 / 10 / 1` does not immediately explain that these are
  thousands/hundreds/tens/ones chunks.
- For kids who do not already understand place value deeply, this can be
  cryptic.

Required fix:

- Label each chunk with both words and values in the panel and/or canvas:
  - `thousands (1000)`
  - `hundreds (100)`
  - `tens (10)`
  - `ones (1)`
- In Level 1, simplify the strip to only `tens` and `ones`, or hide chunk
  categories that are not useful yet.
- Introduce the full four-chunk strip in Level 3 or when values exceed 99.

### 4.3 Canvas prompt is overloaded and not mode-specific enough

Current behavior:

- `updatePrompt` chooses short strings such as `Follow the guided step in the
  panel` or `Read the inscription on the tablet` (lines 2459-2471).

UX problem:

- The prompt often tells the user where to look, not what to do.
- It competes with the panel mission text and can be missed.

Required fix:

- Use the canvas prompt only for action-specific hints tied to the workspace:
  - `Tap I twice`
  - `Drop tiles on the tablet`
  - `Choose the Arabic value in the panel`
  - `Select a tile to repair it`
- Do not use generic prompts such as `Follow the guided step in the panel`.
- The panel task card remains the source of truth; canvas prompt reinforces
  the next action.

## 5. Information Architecture Problems

### 5.1 Level selector is too abstract

Current behavior:

- Level buttons are just `1 2 3 4 5` with a short description below
  (lines 878-887).

UX problem:

- The learner has to select a level before understanding what level means.
- The description is too small and detached from the buttons.

Required fix:

- Use wider level cards or a select row with labels:
  - `1 Clock 1-12`
  - `2 Small 1-49`
  - `3 Hundreds 1-399`
  - `4 Dates 1-1000`
  - `5 Full 1-3999`
- Add a "recommended" marker for the next unfinished level.
- Keep all levels selectable.

### 5.2 Progress appears before it has meaning

Current behavior:

- The `Progress` section is always visible with Laurels and Completed counters
  (lines 1044-1056).

UX problem:

- On first use it adds dead information: `0` and `0`.
- It competes with the learning task.

Required fix:

- Hide Progress until there is nonzero progress.
- When shown, collapse it to one compact line:
  - `Level 1: 3 laurels, 5 completed`
- Do not show progress in Guided step 1.

### 5.3 About text is doing UI instruction work

Current behavior:

- The About section contains the full operating instructions and keyboard
  shortcuts.
- It appears at the bottom of the panel (lines 1057-1060; strings around
  1269-1271 and 1471-1473).

UX problem:

- Users should not need to read a paragraph to learn how to operate the first
  task.
- The copy is too dense for a child-facing first-run interface.

Required fix:

- Replace the About paragraph with contextual microcopy near controls.
- Keep a small `How to use` disclosure at the bottom for keyboard shortcuts.
- The visible first-use interface must explain itself without the About text.

## 6. Interaction Problems

### 6.1 Tap and drag have surprising side effects

Current behavior:

- A pointerdown/up on an existing canvas tile with no drag removes that tile
  (lines 4115-4123).
- Dragging a placed tile off the tablet also removes it.

UX problem:

- Tapping a tile commonly means select/edit, not delete.
- Accidental deletion is likely, especially on touch screens.

Required fix:

- Change tap on placed tile to select.
- Show selected state and available actions.
- Keep delete behind an explicit Delete action.
- If drag-off-to-delete remains, show a visible trash/drop zone while dragging.

### 6.2 Disabled symbols are unexplained

Current behavior:

- `renderSymbols` disables symbols not available at the current level
  (lines 2286-2290).

UX problem:

- Disabled tiles look broken or unavailable for unknown reasons.
- This is especially confusing because Explore allows all symbols regardless
  of level through `allowedSymbols` lines 2114-2117.

Required fix:

- Add a visible "available now" caption:
  - `Level 1 uses I, V, X.`
- Add a "later" caption for locked-looking symbols if they stay visible.
- Or hide future symbols from the primary tile row and show them in a smaller
  reference row.
- Keep Explore behavior explicit:
  - `Explore lets you use all symbols.`

### 6.3 Global keyboard shortcuts are invisible and focus order is poor

Current behavior:

- Keyboard shortcuts exist globally at lines 4254-4308.
- The tile tray appears in DOM before the panel controls (lines 806-849 before
  851 onward), so keyboard tab order reaches symbol tiles before the task,
  mode, level, mission, and feedback controls.

UX problem:

- Keyboard support exists technically, but the tab order does not match the
  visual/task flow.
- A keyboard user encounters controls before knowing what task they apply to.

Required fix:

- Reorder DOM or relocate tile controls so tab order follows:
  1. mode/task launcher,
  2. level,
  3. current mission,
  4. answer controls,
  5. actions,
  6. feedback/readouts.
- Keep shortcuts, but show them only in a collapsed help section or tooltip.
- Do not rely on global shortcuts for primary usability.

### 6.4 State changes erase work without a clear transition

Current behavior:

- Changing mode calls `setMode`, clears mission/attempt state, and often
  generates a new mission (lines 2190-2218).
- Changing level similarly resets the current task (lines 2221-2241).

UX problem:

- A child can lose the current task by exploring controls.
- Because modes and levels are prominent, accidental switching is likely.

Required fix:

- If a mission has unsolved user work, changing mode/level should either:
  - preserve the current build when moving into Explore, or
  - ask a lightweight confirmation: `Start a new task?`
- For Guided mode, changing level should show the first step of that level
  clearly, not feel like the app reset unexpectedly.

## 7. Feedback And Error-Recovery Problems

### 7.1 Feedback is too far from the error source

Current behavior:

- Feedback text is rendered in the readouts section (lines 1041-1042 and
  2431-2439).
- Errors may also shake the entire tablet.

UX problem:

- The user sees a sentence but must map it back to a tile, chunk, or choice.
- Shaking the whole tablet says "wrong" but not "where".

Required fix:

- Add error markers on the exact relevant part:
  - wrong choice button,
  - wrong tile or illegal pair,
  - first wrong chunk box.
- Put a compact feedback card immediately under the active controls.
- Keep detailed chunk readouts below as secondary explanation.

### 7.2 Wrong answers can become terminal too early

Current behavior:

- Read mode wrong answer resolves the mission with `far` and overlay.
- Correct-value but noncanonical write answers resolve with `close` and
  advance after overlay.

UX problem:

- A near miss often ends the learning moment before the child fixes it.

Required fix:

- In normal practice modes, do not resolve on `close` unless the answer is
  accepted as correct for the learning goal.
- For noncanonical but correct-value answers, show:
  - `Good value. Now make it standard: IV.`
  - keep the mission active,
  - provide a `Use standard form` button or let the child repair it.
- Reserve `close` as a final score only when the learner then presses Next or
  after a second support step.

## 8. Mobile Problems

### 8.1 The first action can be below the fold or visually disconnected

Current behavior:

- On mobile, `.canvas-wrap` is `56vh` with a minimum height of `360px`
  (lines 766-775).
- The panel sits below the canvas.
- The tile tray is absolute at the top of the canvas, while the mission card
  is below the canvas.

UX problem:

- A child may see the canvas and tiles before the task, or the task after
  scrolling past the workspace.
- The instruction and input are not visible together.

Required fix:

- On mobile, put the task card above the canvas or make it sticky at the top of
  the panel.
- Put tile controls in the panel directly below the task card.
- Reduce canvas height in task modes to leave the task and controls visible:
  - suggested: `42vh`, min `260px`, except Explore can keep a larger canvas.
- Avoid requiring drag from a canvas-top tray to a canvas-middle tablet on
  small screens.

### 8.2 Tile tray can overflow narrow screens

Current behavior:

- Tile tray uses fixed `42px` tiles, `gap: 6px`, no wrapping, and
  `max-width: calc(100% - 16px)` (lines 328-337 and 343-354).
- Seven tiles require about `330px` plus borders, which can exceed common
  mobile widths after margins.

UX problem:

- Tiles may crowd, clip, or become hard to tap.

Required fix:

- If tiles remain on canvas, allow wrapping or scale tile width at narrow
  widths.
- Better: move primary tiles to a panel grid:
  - `grid-template-columns: repeat(4, 1fr)` on mobile,
  - minimum tap target `44px`.

## 9. Polish And Text-Fit Problems

Current problem:

- Several Polish labels are longer than English labels:
  - `Podpowiedz` / `Podpowiedź`
  - `Rozpocznij sprint`
  - `Pomin - Odkrywaj` / `Pomin -- Odkrywaj`
  - `zapis standardowy`
- Mode buttons are only `12px` with minimal horizontal padding (lines
  250-264).

UX problem:

- Text may wrap awkwardly inside compact controls, especially in the mode grid.
- Wrapped labels make controls look inconsistent and harder to scan.

Required fix:

- Avoid seven compact mode buttons.
- Use fewer visible primary controls and longer labels only in task cards.
- Verify Polish at `320px`, `375px`, `720px`, and desktop widths.
- For compact controls, prefer one-word Polish labels:
  - `Nauka`
  - `Buduj`
  - `Czytaj`
  - `Pisz`
  - `Napraw`
  - `Świat`
  - `Sprint`
- Put full explanations in the task card, not inside button labels.

## 10. Recommended Redesign Structure

Use this structure for v2 implementation.

### 10.1 Desktop panel order

1. `Task` section:
   - mode/task title,
   - current level/range,
   - one-line instruction,
   - target value or Roman numeral.
2. `Answer` section:
   - choices, number input, or symbol tile grid.
3. `Actions` section:
   - only controls relevant to the current task.
4. `Feedback` section:
   - inline feedback card,
   - first wrong chunk/tile note.
5. `Details` section:
   - Roman,
   - Arabic,
   - chunks,
   - standard form.
6. `Practice options` section:
   - mode picker,
   - level picker,
   - progress.

Important: mode and level selection should not be the first thing a new user
has to parse. The task is first; configuration is secondary.

### 10.2 First-run screen

First-run should show:

- primary title in panel: `Start with I`
- rule: `I means 1.`
- instruction: `Tap I twice to build II.`
- visible tile row with only active tiles:
  - `I`, `V`, `X`
- canvas with two ghost slots:
  - `[I] [I]`
- disabled Next note:
  - `Build II to unlock Next.`

Do not show:

- progress counters,
- all seven mode buttons,
- all five level buttons as the topmost interaction,
- long About text.

### 10.3 Normal practice screen

For Read mode:

- Task: `Read this Roman numeral`
- Target: `XLIX`
- Answer: choice cards or numeric input
- Feedback: inline under choices/input
- Details: reveal chunks after answer or hint

For Write mode:

- Task: `Write 49 in Roman numerals`
- Target: `49`
- Answer: symbol tile grid
- Workspace: tablet with chunk slots
- Actions: Hint, Undo, Clear, Check
- Feedback: inline under actions

For Repair mode:

- Task: `Fix this inscription`
- Target: `IIII should mean 4`
- Answer: editable tiles
- Feedback: highlight illegal repetition and explain `IV`

## 11. Implementation Checklist

Use this as the concrete work list.

- Replace `.mode-grid` first-screen prominence with a task launcher and
  secondary practice-mode selector.
- Add a panel `Symbol tiles` answer section and move/duplicate tile buttons
  into it.
- Reorder panel sections to task -> answer -> actions -> feedback -> details.
- Change Guided card copy and layout to separate Learn / Do / Goal / Status.
- Add visible target/ghost slots to the canvas for Guided and Write.
- Hide irrelevant controls per mode:
  - no Check in choice mode,
  - no progress on first Guided screen,
  - no Undo/Clear when no build is possible,
  - no tile tray in Read mode.
- Replace ordinary full-screen result overlays with inline feedback.
- Keep overlays only for level completion and sprint summary.
- Let wrong Read answers retry before moving on.
- Make noncanonical but correct-value answers repairable instead of
  immediately ending the round.
- Add exact wrong-location highlights for choices, chunks, and tile pairs.
- Change tap on placed tile from delete to select.
- Add explicit delete/replace/move controls for Repair.
- Improve chunk labels from numeric-only to word + value.
- Add mobile layout where task and answer controls are visible together.
- Hide or compact progress until it has nonzero value.
- Replace About instruction dump with contextual microcopy and collapsed help.
- Re-test EN and PL labels at mobile and desktop sizes.

## 12. Acceptance Criteria For The Redesign

The redesign is successful when:

- A first-time child can complete Guided step 1 without reading the About
  paragraph.
- The first visible panel action is a learning task, not a seven-mode
  configuration grid.
- In every mode, the active answer controls appear directly below the task.
- Wrong answers keep the current task visible and explain what to fix.
- Choice-card Read mode has no redundant Check button.
- Build/write/repair modes can be completed without using canvas drag.
- Repair mode has explicit edit controls.
- Progress and secondary modes do not compete with the first task.
- Mobile shows task, answer controls, and workspace without forcing the user to
  search across separated screen regions.
- Keyboard tab order follows the same flow as the visual layout.
- English and Polish labels fit without awkward wrapping.
