# Code Breaker: Requirements And Design Specification

Reference implementation file: `codebreak/index.html`

Puzzle engine cross-check: `tools/codebreak-puzzle-check.mjs` — run
`node tools/codebreak-puzzle-check.mjs` from `learn/`. It verifies exact
scoring against an independent scorer, unique solvability of every authored
fallback pattern and of the Learn Clues teaching case, and sampled generator
output for every level and variant.

Reference style baseline: `CLAUDE.md` light chassis, with interaction
patterns borrowed from `roman/docs/req.md`, `roman/docs/ux-redesign-report-2026-07-06.md`,
and `fractions/docs/design.md`.

UX design baseline: `ux-redesign-report-2026-07-10.md` — the board-first
redesign this spec now describes. Known deviations from the learn style
reference are recorded in `style-drift.md`.

This document is the implementation handoff for a kid-friendly code-breaking
logic game inspired by Mastermind-style clue puzzles.

## 0. Handoff Goal

Build a complete single-file educational app that helps children solve exact
logic-clue puzzles with a hidden three-symbol code.

The app must be:

- a single self-contained `codebreak/index.html`,
- bilingual English / Polish through one inline `I18N` object,
- light-theme, using the `CLAUDE.md` light chassis,
- dependency-free except for the established Google Fonts,
- accessible by mouse, touch, and keyboard,
- useful both as a guided teaching path and as a replayable puzzle game,
- playable with numbers, letters, playing cards, and shapes,
- based on exact-count clue semantics.

Where this spec does not name a low-level CSS, DOM, or event pattern, inherit
the learn-level conventions in `CLAUDE.md`.

## 1. Research Basis

This app is primarily an educational logic game. The chosen interaction and
progression model should be justified by broad, well-established learning
science and child-computer-interaction patterns rather than by puzzle-game
fashion.

### 1.1 Sources Used

- The What Works Clearinghouse elementary mathematics practice guide supports
  systematic instruction, clear language, representation-based reasoning, and
  regular practice. These ideas map well to clue cards, scratchpad marks, and
  repeated short cases.
  Source: https://ies.ed.gov/ncee/wwc/PracticeGuide/26
- Dunlosky et al. identify practice testing and distributed practice as
  high-utility learning techniques. The app should therefore include quick
  retrieval rounds and review prompts from previous levels.
  Source: https://journals.sagepub.com/doi/10.1177/1529100612453266
- Hattie and Timperley describe useful feedback as answering where the learner
  is going, how they are going, and what comes next. The app must explain the
  violated clue rule or deduction step instead of only saying right/wrong.
  Source: https://journals.sagepub.com/doi/10.3102/003465430298487
- CAST Universal Design for Learning guidelines support multiple means of
  engagement, representation, and action. The app should provide variants,
  visual clue marks, keyboard/touch input, and optional hints.
  Source: https://udlguidelines.cast.org/
- Self-determination theory emphasizes autonomy and competence as motivation
  supports. The app should let children choose variants and levels while using
  solvable cases and staged hints to preserve competence.
  Source: https://selfdeterminationtheory.org/theory/
- CMU's Decimal Point research project is a useful model for tightly coupling
  educational content to game actions. In Code Breaker, every game action must
  exercise clue interpretation, elimination, or candidate testing directly.
  Source: https://www.cs.cmu.edu/~bmclaren/projects/DecimalPoint/
- WCAG target-size guidance supports large, well-spaced interactive targets.
  The app should use 40-44px minimum touch targets.
  Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

### 1.2 Design Implications

The app should:

- introduce exact clue language explicitly before asking for full solves,
- keep the current task, controls, and feedback in one vertical panel flow,
- make hidden reasoning visible through scratchpad marks,
- use short tasks and staged hints instead of long explanations,
- mix retrieval practice with full puzzle solving,
- include review from earlier levels once the child reaches advanced levels,
- keep all levels selectable, with recommendations rather than locks,
- provide variants for autonomy without changing the underlying logic model,
- reward solved cases lightly, without coins, stores, streak pressure, or
  punitive failure states.

## 2. Purpose And Learning Goals

The app teaches deductive reasoning with exact-count clues.

Core learning goals:

- understand that each clue compares one guess with one hidden code,
- understand that clue counts are exact, not "at least",
- eliminate symbols globally when a clue says nothing is correct,
- mark impossible positions when a clue says a symbol is correct but wrongly
  placed,
- use well-placed clues to confirm a symbol and slot,
- use cross-checking to reject candidate codes,
- transfer the same logic between numbers, letters, shapes, and playing cards,
- solve three-symbol puzzles without relying on trial and error.

After using the app, a child should be able to say:

- `Nothing is correct means none of those symbols are in the code.`
- `Well placed means the symbol is in that exact slot.`
- `Wrongly placed means the symbol is in the code but not in that slot.`
- `One correct means exactly one correct. The other shown symbols are absent.`
- `I can test a possible answer against every clue.`

## 3. Target Audience

Primary audience: children aged roughly `7-12`.

Assumptions:

- the learner can read short clue phrases,
- the learner may not know formal logic notation,
- reading load should stay low,
- interactions should be mostly tapping, choosing, and arranging symbols,
- typed input is not required for core play,
- some children will prefer visual symbols to numbers.

Secondary audience:

- parents using the app at home,
- teachers using it as a short classroom logic activity,
- older learners who want a quick puzzle.

## 4. Product Concept

The app should feel like a bright detective desk.

The learner opens a case file. A hidden three-slot code sits at the top of the
desk. Clue cards show previous guesses and exact clue statements. The learner
uses symbol tiles to build an answer, marks a scratchpad, requests hints, and
stamps the case solved.

The core loop:

1. The app presents a uniquely solvable case.
2. The child studies clue cards and fills three answer slots.
3. The app checks the answer against the hidden code.
4. Feedback explains the relevant clue rule or deduction.
5. Success adds a small case stamp and offers the next case.

The app must avoid worksheet feel. The learning should come from direct
manipulation:

- tap symbols into code slots,
- mark symbols absent or impossible in a slot,
- see candidate counts shrink in later levels,
- ask for one deduction at a time,
- compare a proposed answer against every clue.

## 5. Scope

In scope:

- `codebreak/index.html`,
- `codebreak/docs/req.md`,
- English and Polish localization,
- fixed three-symbol code length,
- no repeated symbols in v1 puzzles,
- exact clue semantics,
- exactly two play modes: Step By Step (guided) and All Clues (free solve),
- a DOM game board in the main view that is sufficient to solve a puzzle,
- five difficulty levels,
- Numbers, Letters, Playing Cards, and Shapes variants,
- deterministic puzzle generation with fallback authored puzzles,
- local-only progress,
- full keyboard and touch support,
- reduced-motion support.

Out of scope for v1:

- repeated symbols in hidden codes,
- code lengths other than three,
- multiplayer,
- accounts, cloud saves, or sharing,
- gambling, betting, chips, or poker hand ranking,
- audio narration as a required feature,
- external JavaScript/CSS dependencies,
- procedural animations that distract from the clues.

Postponed (removed as user-facing modes by the 2026-07-10 redesign; their
implementations live in git history):

- Clue Lab micro-practice (its teaching intent is absorbed by Step By Step
  instructions and the glossary),
- Quick Practice sprint (retrieval/review rounds may return as a compact
  challenge once the core board is proven),
- Make A Case creation mode.

## 6. App Structure

Use the learn-level light chassis:

- canonical URL: `https://lepecki.com/learn/codebreak/`,
- slim header,
- DOM game board stage left (no canvas — see `style-drift.md`),
- fixed `320px` panel right on desktop,
- mobile stacking at `max-width: 720px`,
- home link in the header,
- all UI strings in an inline `I18N` object.

The game board owns the gameplay. Board order, top to bottom:

1. Three interactive answer slots (the hidden code being reconstructed,
   with a `?` placeholder — there is no separate non-interactive code row).
2. Symbol/card tray directly under the slots.
3. Clue-card grid (the primary read surface; scrolls internally when short).
4. Compact scratchpad (levels 3+ and Step By Step only).
5. Actions row (Check, Hint, Undo, Clear, Next) with inline feedback.

A child must be able to solve a full puzzle without touching the side panel.

Panel section order:

1. First-run launcher: title, one sentence, primary `Start puzzle`,
   secondary `Settings`.
2. Mode toggle (Step By Step / All Clues) plus `New puzzle`.
3. Current puzzle summary: level/variant chips, the progress line, and (at
   levels that show it) the possible-codes count — the number of codes the
   child's scratchpad marks still allow, so the count visibly shrinks as
   they eliminate.
4. Collapsed `Settings` disclosure: variant grid, level grid, per-level
   progress, clue glossary, help.

No five-mode grid, no always-visible option stack during play.

## 7. Visual Design

### 7.1 Theme

Use a light detective desk theme:

- warm off-white body background,
- paper desk canvas background,
- white panel,
- blue-gray text,
- manila clue cards,
- muted teal highlights for confirmed symbols,
- amber highlights for "wrong place",
- red/coral marks for absent or incorrect choices,
- graphite/ink marks for scratchpad annotations.

Avoid:

- dark noir visuals,
- casino styling,
- one-note beige/brown palettes,
- decorative orbs/blobs,
- heavy mascots,
- tiny clue text,
- text overlapping clue cards or slots.

### 7.2 Board Elements

The stage is a DOM game board on the plain light canvas tone. Board
objects are real elements:

- three interactive answer slots (buttons),
- the symbol/card tray (buttons; draggable),
- clue cards (manila cards with a numbered mono tag, the guess symbols as
  mini tiles, and a short exact label such as `1 right, wrong place`),
- a compact scratchpad strip,
- action buttons and the inline feedback card,
- a rotated `SOLVED` stamp badge on the answer row when the case closes.

Clue cards are the primary read surface and are never inert: each card is
focusable and selectable. Selecting a card shows the full exact clue
sentence and, when the clue yields direct deductions, a
`Mark from this clue` button. Cards get a brief staggered pop-in on a new
case (skipped under reduced motion), a teal ring while active in Step By
Step, and a red ring when a checked answer violates them.

### 7.3 Animation

Allowed animations:

- clue-card pop-in on a new case (staggered, ~60 ms per card),
- short highlight pulse on a newly marked deduction,
- solved-case stamp pop and the full-screen result overlay.

Reduced motion:

- no pop-ins, stamp animation, or overlay animation when
  `prefers-reduced-motion: reduce`,
- use instant color/state changes and live-region text.

## 8. Rule Model

V1 uses fixed three-symbol codes with no repeated symbols.

Given:

```js
code = ["7", "9", "5"];
guess = ["7", "1", "2"];
```

Score:

```js
wellPlaced = count(i where guess[i] === code[i]);
present = count(symbol in guess where code includes symbol);
wrongPlaced = present - wellPlaced;
absent = 3 - present;
```

All clues are exact. If a clue says one symbol is correct, exactly one of the
three guessed symbols is in the hidden code.

Core clue phrases:

- `Nothing is correct`: `present = 0`.
- `One is correct and well placed`: `present = 1`, `wellPlaced = 1`.
- `One is correct but wrongly placed`: `present = 1`, `wrongPlaced = 1`.
- `Two are correct but wrongly placed`: `present = 2`, `wrongPlaced = 2`.
- `Two are correct: one well placed, one wrongly placed`: `present = 2`,
  `wellPlaced = 1`, `wrongPlaced = 1`.
- `Three are correct but all wrongly placed`: `present = 3`, `wrongPlaced = 3`.

## 9. Data Model

Recommended implementation shapes:

```js
const SymbolSet = {
  id: "numbers",
  termSingularKey: "termNumber",
  termPluralKey: "termNumbers",
  symbols: [
    { id: "1", label: "1", shortLabel: "1", ariaKey: "symbol1" },
  ],
};
```

```js
const Puzzle = {
  id: "numbers-l2-004",
  seed: 12345,
  level: 2,
  variant: "numbers",
  code: ["1", "4", "6"],
  clues: [
    {
      guess: ["1", "2", "3"],
      score: { present: 1, wellPlaced: 1, wrongPlaced: 0 },
      phraseKey: "clueOneWell",
    },
  ],
  solution: ["1", "4", "6"],
};
```

```js
const Progress = {
  introSeen: false,
  currentLevel: 1,
  currentVariant: "numbers",
  solvedByLevel: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  perfectByLevel: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  guidedDone: false,
};
```

`guidedDone` back-compat: payloads written before the field existed belong
to players who already solved cases — on load, `guidedDone` is true when the
stored flag is true OR any `solvedByLevel` count is positive, so returning
players are never demoted into the guided tutorial.

Storage keys:

- `codebreakIntroSeenV1`,
- `codebreakProgressV1`.

All `localStorage` access must be wrapped in `try/catch`.

## 10. Modes

Exactly two play modes, selected by a two-button toggle in the panel.
Default on first run: Step By Step. After the first solved guided puzzle
(`guidedDone`), the default becomes All Clues.

### 10.1 Step By Step

Purpose: guided classic solving, one clue at a time.

Behavior:

- clues are revealed one at a time; unrevealed cards are hidden, past cards
  collapse to their numbered tag (tap to expand),
- the active clue card is highlighted and carries an instruction line,
- when the active clue yields derivable direct marks, the child is asked to
  apply them — via the card's `Mark from this clue` button or by making the
  same marks on the scratchpad,
- only the guided tutorial locks `Next` behind those marks (its lesson copy
  builds on them); on generated puzzles `Next` stays active and flips to
  the primary (ready) style once the marks are down — moving on without
  marking is the child's choice,
- derivable marks are exactly: `nothing is correct` → all three symbols
  absent; any zero-well-placed clue with present symbols → each shown
  symbol impossible in its shown slot,
- a symbol already marked absent counts as covered for any per-slot
  requirement (the stronger fact subsumes it) — the gate never demands a
  redundant mark, and `Mark from this clue` applies only the missing ones,
- clues with no certain single-clue deduction (`one well placed`, the mixed
  clue) need no marks and show the ready style on reveal,
- `Check` unlocks only after every clue is on the desk,
- `Hint` is hidden (the active card is the hint),
- the first Step By Step puzzle is the authored teaching case (numbers,
  pool of six, code 4-6-5) with authored per-clue lesson copy; solving it
  sets `guidedDone` and does not count toward progress,
- the guided case only loads while the default numbers/level-1 selection is
  active — changing variant or level deliberately switches to generated
  step-mode puzzles (the guide re-offers on returning to the defaults until
  it is solved),
- every later Step By Step puzzle is generated for the selected level and
  variant with generic per-phrase instructions, and counts normally.

### 10.2 All Clues

Purpose: main replayable game.

Behavior:

- generate one uniquely solvable case and show every clue card at once,
- cards carry short exact labels (`0 in code`, `1 right, wrong place`, …);
  the full sentence lives in the selected-card detail and the glossary,
- selecting a card highlights its guess symbols in the tray and offers
  `Mark from this clue` when a direct mark is derivable,
- child fills three answer slots by tap, drag, or keyboard,
- Check compares the answer to the solution,
- wrong answers show inline feedback near the actions, keep the same case,
  and ring the violated clue card,
- correct answers show the solved stamp, the result overlay, and `New case`,
- staged hints select the clue they derive from and apply one mark.

## 11. Variants

All variants use the same rule model.

### 11.1 Numbers

Symbols:

- Level 1: `1, 2, 3, 4, 5`
- Level 2: `1, 2, 3, 4, 5, 6`
- Level 3: `1..8`
- Level 4: `0..9`
- Level 5: `0..9`

### 11.2 Letters

Symbols:

- Level 1: `A, B, C, D, E`
- Level 2: `A..F`
- Level 3: `A..H`
- Level 4: `A..J`
- Level 5: `A..L`

### 11.3 Playing Cards

Playing cards are symbol identities, not poker hands.

Allowed visual set:

- early levels use ranks `A, 2, 3, 4, 5` across simple suit colors,
- later levels may use up to 12 distinct rank+suit cards,
- card identity is full rank+suit, e.g. `A hearts`, `7 spades`,
- cards render as miniature playing cards (white rounded card, corner rank,
  centered suit pip, red/black suit colors) in the tray, answer slots, and
  clue cards.

Forbidden:

- betting,
- chips,
- casino table language,
- poker-hand scoring.

### 11.4 Shapes

Shapes support younger and lower-reading learners.

Suggested symbols:

- circle,
- square,
- triangle,
- star,
- diamond,
- hexagon,
- pentagon,
- cross,
- heart,
- bolt,
- flower,
- shield.

Use text labels and `aria-label`s for every shape.

## 12. Five-Level Progression

All levels are selectable from the start. The recommended level is the lowest
unstamped level. Progress is motivational, not locked.

### Level 1: First Clues

Pool size: `5`

Puzzle shape:

- 4 clue cards,
- only `nothing`, `one well placed`, and `one wrongly placed`,
- high rate of elimination clues,
- auto-scratchpad marks.

Learner should be able to:

- eliminate absent symbols,
- place one confirmed symbol,
- solve with a visible guided scratchpad.

### Level 2: Wrong-Place Moves

Pool size: `6`

Puzzle shape:

- 4-5 clue cards,
- adds `two correct but wrongly placed`,
- scratchpad still auto-marks impossible slots.

Learner should be able to:

- move symbols away from wrong slots,
- combine two wrong-place clues,
- explain that "wrong place" still means present.

### Level 3: Cross-Check Cases

Pool size: `8`

Puzzle shape:

- 5 clue cards,
- adds mixed `one well, one wrong`,
- possible-codes count visible,
- hints mark one deduction at a time.

Learner should be able to:

- test candidate answers against all clues,
- reject a candidate because it creates too many correct symbols,
- use exact counts consistently.

### Level 4: Themed Decks

Pool size: `10`

Puzzle shape:

- 5-6 clue cards,
- all variants available,
- fewer easy zero clues,
- scratchpad mostly manual.

Learner should be able to:

- transfer the same logic across numbers, letters, cards, and shapes,
- solve with less automatic marking,
- use review prompts from earlier levels.

### Level 5: Master Board

Pool size: `10-12`

Puzzle shape:

- 6 clue cards,
- full clue vocabulary,
- no auto-marking by default,
- staged hints remain available.

Learner should be able to:

- solve independently,
- reason through candidate sets.

## 13. Puzzle Generation

Generate puzzles by enumeration, not by guessing clue validity informally.

Algorithm:

1. Build the symbol pool for selected level and variant.
2. Enumerate every valid no-repeat 3-symbol code from the pool.
3. Pick a hidden solution.
4. Generate candidate guesses with no repeated symbols.
5. Score each guess against the solution.
6. Prefer clue sets matching the current level's clue vocabulary.
7. After adding each clue, filter all candidate codes by exact score.
8. Accept when exactly one candidate remains and the clue count matches the
   level range.
9. If bounded generation fails, load an authored fallback puzzle.

Fallback puzzles must exist for every level and variant family. They can reuse
the same structural patterns with different symbols.

Never generate:

- repeated symbols in a code,
- repeated symbols in a guess,
- a case with multiple valid solutions,
- a clue phrase that describes "at least" semantics,
- a card puzzle that depends on poker rules.

## 14. Feedback And Hints

Use four result tiers:

- `perfect`: exact correct answer, no hint used,
- `close`: all right symbols but one or more wrong slots,
- `far`: some right symbols, wrong answer,
- `miss`: blank, duplicate, invalid, or no meaningful match.

Feedback copy pattern:

1. What happened?
2. What rule applies?
3. What to try next?

Examples:

- Perfect: `Solved. Your code matches every clue exactly.`
- Close: `These are the right symbols, but one is in the wrong slot. Check the wrongly placed clue again.`
- Far: `That answer makes two symbols correct for the first clue, but the clue says exactly one.`
- Miss: `A code cannot repeat a symbol in this version. Use three different symbols.`

Hints are staged:

1. Identify a `nothing is correct` clue and mark absent symbols.
2. Mark one impossible position from a wrong-place clue.
3. Confirm one well-placed symbol.
4. Show how many codes the child's marks still allow.
5. Reveal the next slot only after repeated struggle.

Hints should teach a deduction, not simply give the final code. A hint that
derives from a specific clue selects that clue card so the child sees where
the deduction came from. Feedback renders inline on the board next to the
actions; a wrong Check also rings the first violated clue card.

## 15. Accessibility

Requirements:

- all controls are real `<button>` or labeled form controls,
- all icon-only controls have `aria-label` and `title`,
- the game board container has an `aria-label`,
- clue cards are focusable buttons with `aria-expanded` mirroring selection,
- current feedback is announced through an `aria-live` region,
- selected answer slots can be changed with keyboard,
- symbol buttons fill the active slot,
- Backspace or Delete clears the active slot,
- ArrowLeft/ArrowRight moves between slots,
- Enter checks when all slots are filled,
- Escape cancels an active drag, else deselects the clue card, else
  dismisses overlays,
- color is never the only feedback signal.

Touch:

- tap targets must be at least 40px high, preferably 44px,
- symbol tiles work by tapping AND by dragging: tray to slot, slot to slot
  (move or swap), and dragging off the slots clears that slot; Escape cancels
  an active drag,
- tap remains the primary input; the keyboard map is unchanged,
- no critical action should require precision dragging.

Reduced motion:

- disable card pop-ins, stamp animation, and mark pulses,
- keep stamp/feedback as static state changes.

## 16. Required UI Strings

The implementation must include at least:

- title,
- subtitle,
- startPuzzle,
- settings,
- newPuzzle,
- modeStep,
- modeAll,
- mode,
- variant,
- level,
- check,
- hint,
- undo,
- clear,
- next,
- newCase,
- clueNothing,
- clueOneWell,
- clueOneWrong,
- clueTwoWrong,
- clueMixedTwo,
- clueThreeWrong,
- shortNothing,
- shortOneWell,
- shortOneWrong,
- shortTwoWrong,
- shortMixedTwo,
- shortThreeWrong,
- clueTag,
- markFromClue,
- stepMarkAbsent,
- stepMarkSlots,
- stepReadOn,
- stepFinal,
- stepDone,
- guidedClue1 through guidedClue5,
- numbers,
- letters,
- cards,
- shapes,
- progress.

Short clue labels map one-to-one onto the exact phrases:

| Exact phrase key | Short board label |
|---|---|
| clueNothing | `0 in code` |
| clueOneWell | `1 right, right place` |
| clueOneWrong | `1 right, wrong place` |
| clueTwoWrong | `2 right, wrong places` |
| clueMixedTwo | `2 right: 1 placed, 1 moved` |
| clueThreeWrong | `3 right, all moved` |

Polish strings may use ASCII transliteration if that is consistent with the
rest of the file, but natural Polish is preferred where practical.

## 17. Acceptance Criteria

Functional:

- the app loads at `/learn/codebreak/`,
- the game has exactly two visible modes: Step By Step and All Clues,
- the first screen has one obvious primary action (`Start puzzle`),
- a child can solve a full puzzle by interacting only with the main view;
  the side panel is not required for normal play,
- answer slots, tray, clue cards, and action buttons sit together on the
  board; there is no duplicate non-interactive answer row,
- clue cards are DOM elements that respond to selection and focus,
- playing-card symbols are draggable from the board tray into the slots,
- mode/variant/level/progress/help never form an always-visible control
  stack: variant, level, progress detail, glossary, and help live behind
  the collapsed Settings disclosure,
- every level and variant can generate a playable case,
- every generated case has exactly one solution,
- all clue phrases are exact,
- wrong answers keep the same case and show feedback near the board actions,
- hints are staged and visible,
- progress (including `guidedDone`) persists locally; pre-`guidedDone`
  payloads with solves default to All Clues,
- language switching updates labels, cards, and feedback,
- the engine between the `[engine:start]`/`[engine:end]` markers passes
  `node tools/codebreak-puzzle-check.mjs` unchanged.

Educational:

- Step By Step teaches elimination, wrong-place constraints, exact counts,
  and cross-checking one clue at a time, gating on derivable deductions,
- All Clues exercises full deduction with staged, mark-applying hints.

Quality:

- run `npm run code-review -- codebreak/index.html`,
- no sidecar CSS or JS files,
- no page-level scrolling on desktop (the clue board scrolls internally;
  see `style-drift.md` for the sanctioned board-local scroll surfaces),
- no overlap between slots, tray, clue cards, and actions at 375x667,
  390x844, 768x1024, 1366x768, and 1440x900,
- no console errors during normal play,
- reduced-motion mode remains usable.

## 18. Implementation Order

Recommended order:

1. Static light-chassis layout and localization scaffold.
2. Symbol sets, state, and storage helpers.
3. Exact scoring and candidate enumeration.
4. Puzzle generation plus fallback puzzles.
5. DOM game board: slots, tray, clue cards, actions, scratchpad.
6. All Clues mode with hints and feedback.
7. Step By Step mode: reveal/gate flow and the guided first puzzle.
8. Panel: launcher, mode toggle, summary, Settings disclosure.
9. Polish copy, accessibility, reduced motion, and code-review fixes.

