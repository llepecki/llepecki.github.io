# Code Breaker UX Redesign Report

Status: shipped 2026-07-10; kept as the design baseline cited by `req.md`.

Audit target: `codebreak/index.html`

Audit date: 2026-07-10

Purpose: explain why the implemented Code Breaker game feels bloated and
unintuitive, and give the implementing agent a precise roadmap for replacing
the current interaction model with a much simpler, more playable one.

## 1. Executive Summary

The current implementation has a sound puzzle engine, but the UI does not make
the puzzle feel like a game board. It feels like a long control panel attached
to a drawing.

The core problem is architectural:

- the canvas shows the visual clue desk,
- the right panel contains the actual interactive slots, symbol tray, buttons,
  clue list, scratchpad, mode picker, variant picker, level picker, progress,
  glossary, and help,
- the user must constantly move attention and pointer between the main view and
  the side panel,
- the side panel exposes five modes even though most of them are variations of
  the same activity,
- the canvas clue cards are drawn, not DOM objects, so they look like primary
  game objects but cannot be touched, dragged, selected, or rearranged.

Technical checks pass:

- `npm run code-review -- codebreak/index.html` reports `0 finding(s)`.
- `node tools/codebreak-puzzle-check.mjs` passes scoring, fallback, Learn case,
  and sampled generator checks.

Therefore the redesign should keep the puzzle engine and rewrite the user
experience around a single integrated board.

## 2. Non-Negotiable Redesign Direction

Replace the current five-mode, side-panel-heavy interface with exactly two
play modes:

1. **Step By Step**
   - Classic guided solve.
   - The app reveals or focuses one clue/deduction step at a time.
   - The child acts directly on the board: drag/tap symbols into slots, mark
     impossible symbols, then advance.

2. **All Clues**
   - Full puzzle board.
   - All clue cards are visible at once.
   - Each clue card uses concrete examples such as `2 symbols are correct but
     in wrong places` or `1 card is in the right place`.
   - The child solves freely with optional hint highlighting.

Remove these as user-facing modes:

- `Learn Clues`
- `Clue Lab`
- `Quick Practice`
- `Make A Case`

Their useful pieces can be absorbed:

- `Learn Clues` becomes the first Step By Step puzzle.
- `Clue Lab` becomes inline clue examples inside Step By Step.
- `Quick Practice` is postponed or becomes a future compact challenge after
  the core board is good.
- `Make A Case` is postponed; it adds complexity without helping first-play
  usability.

## 3. Highest-Priority Findings

### P0. Move The Actual Game Onto The Main View

Current problem:

- The main board is a canvas at `codebreak/index.html` lines 1006-1012.
- The actual answer slots and symbol tray are in the right panel at lines
  1077-1081.
- The action buttons are also in the right panel at lines 1083-1097.
- The canvas separately draws answer slots at lines 4478-4489, but those slots
  are not interactive.
- This creates a false affordance: the main board looks playable, but the child
  must use controls elsewhere.

Required redesign:

- Add a DOM board inside `.canvas-wrap`, for example:
  - `.game-board`
  - `.code-row`
  - `.clue-board`
  - `.workspace-row`
  - `.board-tray`
  - `.board-actions`
- Move the primary answer slots, symbol/card tray, Check, Hint, Undo, Clear,
  and Next into this board.
- Keep the side panel only for compact settings and optional details.
- The board itself must be enough to solve a puzzle without touching the side
  panel.

Implementation rule:

- Do not draw primary playable objects only on canvas.
- Use real DOM elements for slots, clue cards, symbol cards, and action
  buttons.
- The canvas may remain as a decorative paper/desk background or be removed.

Acceptance criteria:

- A child can solve a full puzzle by interacting only with the main view.
- The right panel can be collapsed or ignored during normal play.
- There is no duplicate noninteractive answer row on canvas.

### P0. Replace Five Modes With Two Modes

Current problem:

- The mode grid exposes five equal-weight modes at lines 1118-1136.
- The mode event binding switches among all five at lines 4627-4630.
- The modes are cognitively expensive and not distinct enough:
  - `Case Files`, `Learn Clues`, `Clue Lab`, `Quick Practice`, and `Make A Case`
    all revolve around clue interpretation.
  - The child must understand the app taxonomy before playing.

Required redesign:

- Replace the mode grid with one compact two-button segmented control:
  - `Step By Step`
  - `All Clues`
- Place the segmented control on the main board header or the first compact
  side-panel section.
- Default first run: `Step By Step`.
- After first solved guided puzzle, default: `All Clues`.

Implementation rule:

- Delete user-facing mode states for `lab`, `sprint`, and `make`.
- Rename current `case` to `allClues`.
- Rename current `learn` to `stepByStep`, but do not keep the long lesson-card
  flow as-is.
- Remove `state.sprint`, `state.lab`, and `state.make` from normal render
  visibility. Keep pure puzzle engine functions.

Acceptance criteria:

- Only two mode choices are visible anywhere in the app.
- The initial screen has one primary button: `Start puzzle`.
- The user never has to choose among five modes to begin.

### P0. Make Cards And Tiles Directly Manipulable On The Board

Current problem:

- The implementation does have drag/drop code at lines 3867-4032.
- However, drag sources are the right-panel slot buttons and right-panel symbol
  tray from lines 3240-3319.
- The visible clue cards on the main board are canvas drawings produced by
  `drawClueCards` at lines 4247-4363, so they cannot be dragged, selected, or
  used as interaction anchors.
- In card variant, the playing cards are not available as a main-board card
  tray near the answer slots.

Required redesign:

- Render symbol tiles/cards as DOM objects directly below or beside the answer
  slots on the main board.
- Support both tap-to-place and drag-to-slot from the main board tray.
- For the playing-card variant, cards must look like cards and be draggable
  into answer slots from the board itself.
- Clue cards should be DOM cards. They do not need to be freely draggable for
  v1, but they must be selectable/focusable. Selecting a clue should highlight
  the related symbols and available deduction marks.

Recommended interaction:

- Tap an empty answer slot, then tap a symbol/card.
- Drag a symbol/card from the board tray into a slot.
- Drag an answer slot symbol to another slot to swap.
- Drag an answer slot symbol back to the tray or outside slots to remove.
- Tap a clue card to focus it; focused clue card shows possible marks such as
  absent symbols or impossible positions.

Acceptance criteria:

- In the Cards variant, card objects can be dragged from the main board into
  the answer slots.
- The side panel is not the primary source of draggable objects.
- Clue cards visibly respond to tap/focus and are not inert drawings.

### P0. Put Clue Cards Near The Answer Slots

Current problem:

- The canvas puts hidden code at top, clue cards from y=146 downward, and
  answer slots near the bottom (`answerY = H - answerSize - 30`) at lines
  4475-4490.
- On shorter viewports, clue cards are squeezed into the space between y=146
  and `answerY - 30`, which is exactly where overlap/near-overlap risk appears.
- The right panel duplicates clue cards at lines 1102-1116 and 3491-3523,
  increasing visual noise.

Required redesign:

- Use one board layout, not duplicated clue surfaces:

```text
[mode + level compact chips]                 [new puzzle]

            [ ? ] [ ? ] [ ? ]        hidden code / answer slots

  [symbol/card tray directly under slots]

  [clue card 1] [clue card 2]
  [clue card 3] [clue card 4]
  [clue card 5] [clue card 6]

  [Check] [Hint] [Undo] [Clear]
```

- On mobile:

```text
[slots]
[tray horizontally scrollable if needed]
[clue cards single column]
[actions sticky below board or immediately under slots]
```

Implementation rule:

- Remove the side-panel clue list as a default visible element.
- If a text-only accessible clue list is needed, place it in a collapsed
  details section after the board, not as a second primary clue display.

Acceptance criteria:

- Clue cards and answer slots are visible in the same main-board viewport on
  desktop.
- No clue card is partially hidden behind or visually crowded against answer
  slots.
- There is only one primary clue-card surface.

### P0. Remove The Bloated Always-Visible Control Stack

Current problem:

- The side panel always contains task, answer, actions, feedback, reasoning,
  options, progress, and help sections at lines 1015-1176.
- `renderVisibility` keeps `optionsSection`, `progressSection`, and
  `helpSection` visible during play because it only toggles some internal
  children, not the whole lower stack.
- This makes core actions compete with configuration.

Required redesign:

- Side panel order should be:
  1. compact current puzzle summary,
  2. optional focused clue explanation,
  3. collapsed settings.
- Move Mode, Symbols, Level, Progress, and Help behind one compact `Settings`
  disclosure or gear-like button.
- Keep only these controls visible during normal play:
  - Step By Step / All Clues,
  - New Puzzle,
  - optional variant chip,
  - optional level chip.

Acceptance criteria:

- No five-mode grid is visible during play.
- No four-variant grid is visible during play unless Settings is open.
- Level buttons are not visible during ordinary solving unless Settings is
  open.

## 4. Concrete Target UX

### 4.1 First Screen

Replace the current launcher with:

- title: `Code Breaker`
- one sentence: `Find the hidden three-symbol code from exact clues.`
- primary button: `Start puzzle`
- secondary text link/button: `Settings`

Do not show level, variant, progress, glossary, or help before the child starts.

### 4.2 Step By Step Mode

Purpose: teach classic code-breaking one move at a time.

Board behavior:

- Show one active clue card at a time, with previous clues collapsed as small
  numbered cards.
- The active clue card is large and located directly under the answer slots.
- The card includes both the guess and one concrete deduction.
- The child performs the deduction on the board before Next unlocks.

Example steps:

1. Show guess `1 2 8`, phrase `Nothing is correct`.
   - Required action: mark `1`, `2`, and `8` as absent.
2. Show guess `7 4 1`, phrase `One symbol is correct but wrongly placed`.
   - Required action: mark `1` absent from previous clue; focus `7`/`4`;
     mark the correct candidate as not in its shown slot once deduced.
3. Show guess `7 9 5`, phrase `One symbol is correct and well placed`.
   - Required action: place the confirmed symbol in its slot.
4. Continue until all three answer slots are filled, then Check.

Implementation:

- Use the existing Learn case if desired, but make it board-first.
- Remove the current Learn card rows from the side panel as the main lesson
  surface. The step instruction should be embedded in the active clue card.
- `Next` is disabled until the required board action is done.

### 4.3 All Clues Mode

Purpose: classic full puzzle.

Board behavior:

- All clue cards are shown at once.
- Cards use concrete, short wording:
  - `0 in the code`
  - `1 right symbol, right place`
  - `1 right symbol, wrong place`
  - `2 right symbols, both wrong places`
  - `2 right symbols: 1 right place, 1 wrong place`
- Use a glossary only as a collapsed reference.
- Hint highlights one clue card and one markable deduction, not a paragraph in
  a remote panel.

Implementation:

- Reuse the current puzzle generator.
- Reuse current feedback text, but render it inline on the board near the
  actions.
- Keep candidate count hidden by default; expose it only in Settings or after a
  hint.

## 5. Layout And Rendering Changes

### 5.1 Replace Canvas-Only Board Objects With DOM

Current canvas drawing functions to retire or downgrade:

- `drawClueCards` lines 4247-4363,
- `drawTileRow` usages for answer slots at lines 4475-4489,
- `drawMiniPad` lines 4365-4406 as the primary scratchpad.

Required replacement:

- `renderBoard()` builds/updates DOM inside `.canvas-wrap`.
- `renderBoardSlots()` renders the answer slots.
- `renderBoardTray()` renders symbol/card tiles.
- `renderBoardClues()` renders clue cards.
- `renderBoardActions()` renders Check/Hint/Undo/Clear/Next.
- `renderBoardMarks()` renders simple deduction marks near each clue or in a
  compact scratchpad adjacent to the clues.

Canvas may still draw:

- paper background,
- subtle desk texture,
- noninteractive decorative stamp/confetti.

### 5.2 Prevent Overlap With Stable Board Geometry

Current overlap risk:

- Hidden code is fixed at y=72.
- Clues start at y=146.
- Answer row is fixed near the bottom.
- The clue area depends on `answerY - 30`.
- The fallback inside `drawClueCards` can still choose a layout that does not
  fit when no attempt fits.

Required board geometry:

- Use CSS grid/flex instead of manually computing y positions.
- Give clue cards explicit min/max heights.
- Use board-local scrolling only for clue cards if the viewport is short.
- Keep answer slots and action buttons sticky within the board.

Recommended desktop CSS shape:

```css
.game-board {
  height: 100%;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 12px;
  padding: 56px 24px 18px;
}
.board-answer { display: flex; justify-content: center; gap: 12px; }
.board-tray { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
.clue-board {
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.board-actions { display: flex; justify-content: center; gap: 8px; }
```

Acceptance criteria:

- At `375x667`, `390x844`, `768x1024`, `1366x768`, and `1440x900`, no text or
  cards overlap.
- The answer row never covers clue cards.
- The clue board may scroll internally if needed, but controls remain visible.

## 6. Interaction Details

### 6.1 Slot And Tile Interaction

Keep the existing drag/drop logic concept from lines 3867-4032, but bind it to
main-board elements.

Required behavior:

- tapping a tile fills the first empty slot or the selected slot,
- dragging a tile to a slot fills that slot,
- dragging from one slot to another swaps,
- dragging a slot tile to the tray removes it,
- duplicate symbols remain impossible in v1,
- all actions update undo stack.

### 6.2 Clue Card Interaction

Each clue card must be:

- a DOM element,
- focusable,
- clickable/tappable,
- visually selected when active,
- reachable by keyboard.

On selected clue:

- highlight its three guessed symbols,
- show the clue meaning in one short line,
- in Step By Step, show the required deduction action,
- in All Clues, offer `Mark from this clue` when a direct mark is available.

Do not make clue cards passive canvas drawings.

### 6.3 Scratchpad Simplification

Current scratchpad:

- occupies the reasoning side panel at lines 1109-1112 and 3340-3451,
- has many small grid controls,
- is powerful but visually heavy.

Required simplification:

- For Level 1-2, use automatic visible marks directly on clue cards and symbol
  tiles.
- For Level 3+, use a compact main-board scratchpad, not a side-panel grid.
- Default scratchpad marks:
  - crossed-out tile = absent,
  - small slot badge `not 1`, `not 2`, `not 3` = impossible position,
  - filled answer slot = confirmed.

Acceptance criteria:

- A Level 1 child does not see a large 5x4 or 10x4 scratchpad grid.
- Deductions appear close to the clue that caused them.

## 7. Content And Copy Changes

Current wording is too verbose for the board. Keep the exact meaning but make
the clue labels short.

Use these board labels:

| Current | Board label |
|---|---|
| Nothing is correct | `0 in code` |
| One symbol is correct and well placed | `1 right, right place` |
| One symbol is correct but wrongly placed | `1 right, wrong place` |
| Two symbols are correct but wrongly placed | `2 right, wrong places` |
| Two symbols are correct: one well placed, one wrongly placed | `2 right: 1 placed, 1 moved` |
| All three symbols are correct but all wrongly placed | `3 right, all moved` |

The longer exact sentence can remain in a clue detail area or glossary.

## 8. Files And Code Areas To Change

Primary file:

- `codebreak/index.html`

Major code areas:

- DOM structure: lines 1005-1178.
- Mode/state surface: mode grid lines 1118-1136, mode bindings lines
  4627-4630.
- Learn flow: `LEARN_STEPS` lines 2370-2431 and `loadLearnStep` lines
  2457-2475.
- Current right-panel slots/tray: lines 1077-1081 and render functions
  3240-3319.
- Current side-panel clue list: lines 1102-1116 and render function
  3491-3523.
- Current canvas clue/slot drawing: lines 4247-4499.
- Drag/drop binding: lines 3867-4032, to be reused against main-board DOM
  elements.

Spec file:

- Update `codebreak/docs/req.md` after the redesign to reflect two modes only.
- Remove or mark postponed: Clue Lab, Quick Practice, Make A Case.

## 9. Implementation Plan

1. Preserve engine and tests.
   - Keep `scoreGuess`, candidate enumeration, puzzle generation, fallback
     patterns, and `tools/codebreak-puzzle-check.mjs`.
   - Run the puzzle check before and after UI changes.

2. Replace mode model.
   - Introduce `state.mode = "step" | "all"`.
   - Delete or quarantine `lab`, `sprint`, and `make` render paths.
   - Remove the five-mode grid from the visible UI.

3. Build DOM board in `.canvas-wrap`.
   - Add board slots, tray, clue cards, actions, and feedback inside the main
     view.
   - Move existing slot/tray rendering to target board nodes.

4. Convert clue cards from canvas drawings to DOM.
   - Render all clue cards as `.board-clue-card` elements.
   - Add selected clue state and keyboard focus.
   - Put short clue labels on the card and longer meaning in a detail line.

5. Move direct manipulation to board objects.
   - Rebind existing drag/drop helpers to board tiles and board slots.
   - Keep tap-to-place behavior.
   - Ensure card variant cards are visually card-like and draggable.

6. Simplify the side panel.
   - Keep compact settings and optional details only.
   - Hide level/variant/progress/help behind Settings during play.
   - Remove duplicate clue list from normal view.

7. Rebuild Step By Step.
   - Active clue card drives the step.
   - Required action is visible on the clue card.
   - Next unlocks only after the board action is complete.

8. Rebuild All Clues.
   - All clue cards visible.
   - Hints select/highlight one clue and one deduction.
   - Feedback appears near Check/Hint on the board.

9. Validate layouts.
   - Manually inspect desktop and mobile.
   - Add Playwright screenshot checks if available in the environment.
   - Required viewports: `375x667`, `390x844`, `768x1024`, `1366x768`,
     `1440x900`.

10. Run quality gates.
    - `npm run code-review -- codebreak/index.html`
    - `node tools/codebreak-puzzle-check.mjs`

## 10. Acceptance Criteria

The redesign is acceptable only if all of these are true:

- The game has exactly two visible modes: `Step By Step` and `All Clues`.
- A child can solve a puzzle entirely from the main view.
- Answer slots, symbol/card tray, clue cards, and action buttons are close
  together on the board.
- Playing-card symbols are draggable from the main board into answer slots.
- Clue cards are DOM elements and respond to selection/focus.
- The side panel is not required for normal play.
- Mode/variant/level/progress/help controls do not create a long always-visible
  control stack.
- No clue cards, answer slots, prompts, or actions overlap at the required
  desktop/mobile viewport sizes.
- Wrong answers keep the same puzzle visible and show feedback near the board
  actions.
- The existing puzzle engine checks still pass.

