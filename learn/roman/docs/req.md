# Roman Numerals: Requirements

Reference implementation file: `roman/index.html`

Reference style baseline: `fractions/index.html` light chassis

This document is the implementation handoff for the Roman Numerals app. It
replaces the earlier scaffold. The implementing agent should extend the
existing `roman/index.html` skeleton rather than starting a new file.

## 0. Handoff Goal

Build a complete single-file educational app that teaches children how to
read, build, validate, and recognize standard modern Roman numerals from
`1` to `3999`.

The app must be:

- a single self-contained `roman/index.html`,
- bilingual English / Polish through an inline `I18N` object,
- light-theme, using the `CLAUDE.md` light chassis,
- dependency-free except for the two established Google Fonts,
- accessible by mouse, touch, and keyboard,
- useful as both a free manipulative and a guided practice game.

Where this spec does not name a low-level CSS, DOM, or event pattern, inherit
the learn-level conventions in `CLAUDE.md`.

## 1. Research Basis

Roman-numeral-specific intervention research is sparse. The app should
therefore combine the best available Roman numeral curriculum expectations
with broader, well-established evidence from mathematics instruction and
learning science.

### 1.1 Curriculum And Domain Sources

- The UK national curriculum introduces Roman numerals first in real-world
  contexts such as clocks (`I` to `XII`), then extends to reading Roman
  numerals to `100`, then to `1000`, while explicitly contrasting the Roman
  system with the Arabic system and the role of zero/place value.
  Source:
  https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study
- Standard modern Roman numerals use the seven Latin letters `I, V, X, L, C,
  D, M`, additive grouping, and the six standard subtractive pairs `IV, IX,
  XL, XC, CD, CM`.
  Source: https://www.britannica.com/topic/Roman-numeral
- Unicode includes Roman numeral compatibility characters, but ordinary text
  should use the Latin letters. The app must store and render Roman numerals
  as `I V X L C D M`, not as Unicode Number Forms such as `Ⅻ`.
  Source: https://www.unicode.org/charts/PDF/U2150.pdf

### 1.2 Learning-Science Sources

- The What Works Clearinghouse elementary math practice guide supports
  explicit, systematic instruction, clear mathematical language, visual
  representations, and regular fluency-building practice.
  Source: https://ies.ed.gov/ncee/wwc/PracticeGuide/26
- Dunlosky et al. identify practice testing/retrieval practice and distributed
  practice as high-utility learning techniques. The app should therefore mix
  quick recall with earlier-level review instead of using one-and-done drills.
  Source: https://journals.sagepub.com/doi/10.1177/1529100612453266
- Hattie and Timperley show that feedback is most useful when it answers what
  the learner did, what rule applies, and what to try next. The app must give
  corrective rule-based feedback, not only "right/wrong" labels.
  Source: https://journals.sagepub.com/doi/10.3102/003465430298487
- Serious-game and simulation-game reviews generally support games when the
  game mechanics are tightly tied to the learning objective. In this app,
  tiles, repairs, hunts, and sprints must all exercise Roman-numeral reasoning
  directly rather than adding unrelated decoration.
  Source: https://doi.org/10.1037/a0031311

### 1.3 Design Implications

The app should use these teaching patterns:

- start from concrete real-world examples: clocks, dates, chapters, labels,
- introduce a few symbols at a time,
- make composition visible as chunks: thousands + hundreds + tens + ones,
- teach subtractive notation as a small legal-pair system, not as "any smaller
  before larger subtracts",
- treat common wrong forms as teachable misconceptions,
- give immediate corrective feedback,
- include spaced review from earlier levels,
- include both free exploration and retrieval-practice rounds.

## 2. Purpose And Learning Goals

This app teaches the structure of standard Roman numerals, not Roman history
as a broad topic.

Core learning goals:

- know the seven symbols and values:
  - `I = 1`
  - `V = 5`
  - `X = 10`
  - `L = 50`
  - `C = 100`
  - `D = 500`
  - `M = 1000`
- understand additive composition:
  - symbols usually go biggest to smallest,
  - values are added left to right,
  - examples: `VI = 6`, `XV = 15`, `LX = 60`.
- understand subtractive notation:
  - a smaller symbol before a larger symbol can mean subtraction only for the
    six legal pairs,
  - legal pairs are exactly `IV, IX, XL, XC, CD, CM`,
  - examples: `IV = 4`, `IX = 9`, `XL = 40`, `CM = 900`.
- understand repetition rules:
  - `I`, `X`, `C`, and `M` repeat up to three times,
  - `V`, `L`, and `D` do not repeat,
  - examples: `III` is valid, `IIII` is nonstandard, `VV` is invalid.
- understand chunk construction:
  - standard numerals are built as thousands + hundreds + tens + ones,
  - zero chunks are omitted,
  - example: `2026 = MM + XX + VI = MMXXVI`.
- understand limits of the standard range:
  - standard app range is `1..3999`,
  - there is no Roman zero,
  - `4000+` requires notation outside this app's scope.
- transfer to real-world contexts:
  - clock faces,
  - years and dates,
  - book chapters,
  - movie/title numbers,
  - museum labels,
  - monarch or ruler numbering.

After using the app, a child should be able to say:

- `Roman numerals use letters for values.`
- `Most of the time I add from biggest to smallest.`
- `Only six pairs use subtraction: IV, IX, XL, XC, CD, CM.`
- `I, X, C, and M can repeat, but not more than three times.`
- `V, L, and D do not repeat.`
- `There is no Roman zero. If a place has zero, that chunk is skipped.`
- `To build a big number, I build thousands, hundreds, tens, and ones.`

## 3. Target Audience

Primary audience: children aged roughly `7-12`.

Assumptions:

- the learner can read at least three-digit Arabic numerals,
- the learner may not know place-value vocabulary formally,
- the learner has no prior Roman numeral knowledge,
- reading load should stay low,
- interactions should be mostly tapping, dragging, choosing, and repairing,
  with typed input as an optional path rather than the only path.

Secondary audience:

- parents using the app at home,
- teachers using it as a quick classroom demonstration,
- older learners who need a fast refresher.

## 4. Product Concept

The app should feel like a bright Roman inscription workshop.

The canvas shows a stone tablet with a line where Roman-symbol tiles snap
into place. A side readout shows the Arabic value and a chunk breakdown. The
child can carve/build inscriptions, inspect whether the inscription is
standard, and repair broken inscriptions.

The core loop:

1. The app gives a small task or lets the child explore freely.
2. The child builds, reads, chooses, or repairs a Roman numeral.
3. The tablet and readouts update immediately.
4. Feedback names the rule involved.
5. Success triggers a short laurel-stamp celebration and the next prompt.

The app should avoid worksheet feel. The learning should come from direct
manipulation:

- add/remove symbol tiles,
- see chunks light up,
- compare standard and nonstandard forms,
- watch Arabic and Roman values stay synchronized,
- fix mistakes by moving or replacing tiles.

## 5. Scope

In scope:

- the existing single-file `roman/index.html`,
- English and Polish localization,
- all standard Roman numerals from `1` to `3999`,
- guided first-use teaching path,
- free Explore mode,
- Read Game,
- Write Game,
- Repair Game,
- World Hunt contextual practice,
- Laurel Sprint fluency mode,
- five difficulty levels,
- converter and validator helpers,
- local-only progress,
- full keyboard and touch support,
- reduced-motion support.

Out of scope:

- `0` as a valid Roman numeral,
- negative numbers,
- decimals,
- Roman fractions such as unciae,
- arithmetic with Roman numerals,
- overline/vinculum notation for `4000+`,
- medieval or inscriptional variants as accepted answers,
- accepting clock-face `IIII` as standard,
- accounts, backend storage, sharing, multiplayer,
- audio narration as a required feature,
- external JavaScript/CSS dependencies.

Special historical note:

- `IIII` may appear as a fun fact in World Hunt for clock faces, but it must
  be labeled as a historical/clock variant. It must not be accepted as the
  standard answer for `4` in the core converter, games, or validator.

## 6. App Structure

Use the existing `roman/index.html` skeleton:

- keep the canonical URL `https://lepecki.com/learn/roman/`,
- keep the light theme,
- keep the slim header,
- keep canvas stage left and fixed `320px` panel right on desktop,
- keep mobile stacking behavior,
- keep the home icon link in the header,
- keep all UI strings in the inline `I18N` object.

The current placeholder symbols section may be replaced by interactive mode,
level, mission, controls, and readout sections.

Panel section order (task-first, per the mission-app variant in
`../../CLAUDE.md`):

1. Task card (or the first-run "Start here" launcher, or the guided lesson
   card).
2. Answer controls (symbol tile grid, choice cards, numeric input, Explore
   inputs).
3. Actions (Check/Hint, Undo/Clear, selection toolbar, Next).
4. Inline feedback card (hidden when empty).
5. Details (Roman/Arabic/Standard/Chunks readouts + rule text).
6. Practice options (mode picker).
7. Level selector (level cards + progress line).
8. Collapsed "How to use" help.

The task is first; mode and level configuration are secondary. No page-level
scrolling on desktop. The panel remains the only scroll container.

## 7. Visual Design

### 7.1 Theme

Use the learn-level light chassis from `CLAUDE.md`.

Required base palette:

- warm off-white body background,
- paper/stone canvas background,
- white panel,
- blue-gray text,
- project standard semantic colors:
  - `--perfect`,
  - `--close`,
  - `--far`,
  - `--miss`.

Roman-specific colors may be added after core variables:

- stone tablet: light limestone gray,
- carved text: dark blue-gray,
- tile fill: parchment/off-white,
- tile border: muted bronze,
- active chunk highlight: soft teal,
- warning highlight: amber,
- error marker: red/coral.

Avoid a one-note beige/brown theme. The tablet can be warm and historical,
but the app should still read as a crisp math tool.

### 7.2 Canvas Elements

Canvas should draw:

- a large stone tablet or inscription slab,
- a snap line for the current Roman inscription,
- draggable/clickable visual symbol tiles,
- an Arabic value readout on a small wax-tablet or slate card,
- a four-part chunk strip:
  - thousands,
  - hundreds,
  - tens,
  - ones,
- subtle context art for World Hunt prompts, such as:
  - clock outline,
  - chapter marker,
  - museum date plaque,
  - movie/title placard.

Canvas must stay inspectable:

- no dark blurred backgrounds,
- no decorative orbs/blobs,
- no text overlap,
- no tiny illegible Roman symbols,
- no important information only on canvas if it is not also represented in
  DOM controls/readouts.

### 7.3 Animation

Allowed animations:

- tile snap into the inscription line,
- short tile lift on hover/focus,
- gentle shake on invalid construction,
- chunk highlight when a chunk is correct,
- laurel stamp or small confetti burst on success.

Reduced motion:

- no shaking or confetti when `prefers-reduced-motion: reduce`,
- replace with instant state/color change and live-region text.

## 8. Modes

The app has seven user-facing modes. Keep labels short in the UI; longer
explanations belong in the info text.

### 8.1 Guided Path

Purpose: first-run and structured teaching.

Behavior:

- first visit shows the "Start here" launcher (primary `Learn with a guide`,
  secondary `Practice reading` / `Practice writing`); the primary button
  opens Guided Level 1 step 1,
- shows one small scripted lesson step at a time as a structured card with
  four labeled rows: `Learn` (one short rule), `Do` (one explicit action),
  `Goal` (the target Roman or the numeral to read), `Status` (waiting:
  "Build II to unlock Next." / done: success message),
- the symbol tiles used by the current step pulse gently in the answer grid,
- build steps draw ghost slots for the target on the tablet,
- teaches one rule and asks one immediate mini-task,
- each level has 4-6 steps,
- no long paragraphs,
- the child advances by doing, not only by clicking Next — the Next button
  stays disabled (with the reason visible in Status) until the step is done,
  then becomes the primary `Next step` button.

Examples:

- Level 1: `I means 1. Add two I tiles to make II.`
- Level 1: `V means 5. Put I after V to make VI.`
- Level 1: `Before can mean take away: IV is 4.`
- Level 3: `Build the hundreds chunk, then tens, then ones.`
- Level 5: `A zero chunk is skipped: 2026 has no hundreds chunk.`

Implementation:

- use a panel-level tutorial section, not a full-screen overlay,
- allow `Skip to Explore`,
- store first-visit intro completion in `localStorage` key
  `romanIntroSeenV1` guarded in `try/catch`,
- never lock content behind intro completion.

### 8.2 Explore

Purpose: free manipulative.

Behavior:

- child can tap/click symbol buttons to append tiles,
- child can drag tiles on the tablet if implemented comfortably,
- child can remove the last tile with Undo or Backspace,
- child can Clear,
- child can enter or step an Arabic number and see its canonical Roman form,
- live readouts show:
  - current Roman string,
  - Arabic value if parseable,
  - canonical form,
  - chunk breakdown,
  - rule status.

Important:

- Do not silently block illegal constructions. Let the child build `VX`,
  `IIII`, or `IC`, then explain why the form is not standard.
- When a nonstandard form has the same numeric value as a standard form,
  show both:
  - `IIII has value 4, but standard Roman uses IV.`

### 8.3 Read Game

Purpose: Roman to Arabic retrieval practice.

Behavior:

- show a canonical Roman numeral,
- child answers with:
  - on-screen number pad,
  - typed numeric input,
  - or multiple-choice cards for early levels,
- answer must be an integer in range for the current level,
- feedback reveals chunk breakdown after the attempt.

Examples:

- `VIII` -> `8`
- `XLIX` -> `49`
- `CDXLIV` -> `444`
- `MMXXVI` -> `2026`

### 8.4 Write Game

Purpose: Arabic to Roman construction.

Behavior:

- show an Arabic number,
- child builds the Roman numeral with symbol tiles,
- text entry may be supported as a secondary path,
- Check compares to the canonical output,
- feedback highlights the first wrong chunk.

Examples:

- `24` -> `XXIV`
- `99` -> `XCIX`
- `944` -> `CMXLIV`
- `1776` -> `MDCCLXXVI`

### 8.5 Repair Game

Purpose: misconception-focused practice.

Behavior:

- show a nonstandard or invalid Roman construction,
- child must repair it into the standard canonical form,
- UI should make it easy to edit rather than retype from scratch,
- feedback names the violated rule.

Required misconception families:

- over-repetition: `IIII`, `XXXX`, `CCCC`,
- repeated five-symbols: `VV`, `LL`, `DD`,
- illegal subtractive pairs: `VX`, `IC`, `IL`, `XD`,
- doubled subtraction: `IIV`, `XXC`,
- wrong chunk order: `MCMC`, `XCM`,
- standard-value but nonstandard form: `VIIII`, `LXXXX`.

### 8.6 World Hunt

Purpose: real-world transfer.

Behavior:

- show a small context card on canvas and in the panel,
- ask the learner to read or write a Roman numeral in that context,
- contexts are lightweight and factual, not a history lecture.

Required context types:

- clock face hours `I-XII`,
- book chapters,
- museum/object date plaques,
- movie or game sequel-style numerals,
- year inscriptions,
- monarch/ruler labels such as `Louis XIV` style examples.

World Hunt should occasionally show `IIII` on a clock only as a note:

- English: `Some clocks use IIII. Standard Roman practice in this app uses IV.`
- Polish: `Niektóre zegary używają IIII. W standardowym zapisie w tej aplikacji używamy IV.`

### 8.7 Laurel Sprint

Purpose: short fluency and retrieval practice.

Behavior:

- 10 quick rounds,
- the idle sprint task card is an intro card (round count, level range,
  included task types, Start button),
- mixed Read/Write/Repair prompts within the selected level,
- soft timer or no timer by default; if timed, never punish with harsh loss,
- auto-advance (~1.3 s) only after correct answers; wrong answers pause with
  an explicit `Next round` button so the child can read the correction,
- show streak/laurel count,
- include 25-35% review from previous levels once the selected level is 3 or
  higher.

Laurel Sprint is optional practice, not the main teaching path.

## 9. Five-Level Progression

All levels are selectable from the start. Progress is motivational, not
locked. Default first run starts at Level 1.

### Level 1: Clock Symbols

Range: `1..12`

Introduced symbols:

- `I`
- `V`
- `X`

Concepts:

- `I = 1`, `V = 5`, `X = 10`,
- additive grouping after `V` and `X`,
- `IV` and `IX` as the first subtractive pairs,
- real-world clock context.

Valid target numerals:

- `I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII`

Example missions:

- build `III`,
- read `VII`,
- match clock hour `XII`,
- repair `IIII` to `IV`,
- write `9` as `IX`.

Success criteria:

- learner can identify `I, V, X`,
- learner can read and write `1..12`,
- learner knows `IV` and `IX` are standard forms for `4` and `9`.

### Level 2: Small Inscriptions

Range: `1..49`

Introduced symbols:

- Level 1 symbols,
- `L`.

Concepts:

- tens and ones chunks,
- `X, XX, XXX`,
- `XL = 40`,
- ones still use `IV` and `IX`,
- repetition limit for `I` and `X`.

Example missions:

- `24 = XXIV`,
- `38 = XXXVIII`,
- `39 = XXXIX`,
- `40 = XL`,
- `44 = XLIV`,
- `49 = XLIX`,
- repair `XXXXIIII` to `XLIV` or `XLVIII` depending target.

Success criteria:

- learner can build tens + ones,
- learner can explain why `XXXX` is not standard for `40`,
- learner can use `XL` and not invent `IL` for `49`.

### Level 3: Hundred Steps

Range: `1..399`

Introduced symbols:

- Level 2 symbols,
- `C`.

Concepts:

- hundreds, tens, and ones chunks,
- `C, CC, CCC`,
- `XC = 90`,
- chunk order from larger to smaller,
- illegal subtraction across chunks such as `IC`.

Example missions:

- `149 = CXLIX`,
- `276 = CCLXXVI`,
- `299 = CCXCIX`,
- `390 = CCCXC`,
- repair `IC` to `XCIX`,
- repair `XXC` to `LXXX`.

Success criteria:

- learner can read and write values to `399`,
- learner can split a numeral into hundreds/tens/ones,
- learner can reject `IC` and explain that `99` is `XCIX`.

### Level 4: Dates To M

Range: `1..1000`

Introduced symbols:

- Level 3 symbols,
- `D`,
- `M`.

Concepts:

- `D = 500`,
- `M = 1000`,
- `CD = 400`,
- `CM = 900`,
- full hundreds pattern,
- date-style reading.

Example missions:

- `400 = CD`,
- `444 = CDXLIV`,
- `707 = DCCVII`,
- `900 = CM`,
- `944 = CMXLIV`,
- `999 = CMXCIX`,
- `1000 = M`.

Success criteria:

- learner can use `D` and `M`,
- learner can build/read all hundreds patterns,
- learner can repair `DCCCC` to `CM` and `CCCC` to `CD`.

### Level 5: Full Standard

Range: `1..3999`

Introduced symbols:

- all symbols.

Concepts:

- thousands chunk `M, MM, MMM`,
- zero chunks are omitted,
- full standard canonical range,
- mixed real-world contexts.

Example missions:

- `1066 = MLXVI`,
- `1776 = MDCCLXXVI`,
- `1999 = MCMXCIX`,
- `2026 = MMXXVI`,
- `2424 = MMCDXXIV`,
- `3999 = MMMCMXCIX`,
- repair `MCMC` to `MCM`,
- explain why `4000` is outside this app's standard range.

Success criteria:

- learner can read and write any standard numeral from `1` to `3999`,
- learner can explain skipped zero chunks,
- learner can distinguish valid, nonstandard, and out-of-scope forms.

## 10. Mission Generation

Use a small set of reusable mission templates rather than dozens of bespoke
interactions.

Mission object shape:

```js
{
  id: "read-l2-49-a",
  mode: "read",
  level: 2,
  type: "read_value",
  promptKey: "missionReadValue",
  value: 49,
  roman: "XLIX",
  context: null,
  invalidRoman: null,
  choices: [39, 44, 49, 59],
}
```

Required mission fields:

- `id`: stable string for progress tracking,
- `mode`: `guided`, `explore`, `read`, `write`, `repair`, `world`, `sprint`,
- `level`: `1..5`,
- `type`: mission mechanic,
- `value`: target Arabic value where applicable,
- `roman`: canonical Roman value where applicable,
- `invalidRoman`: broken form for repair missions,
- `context`: optional world context,
- `choices`: optional answer cards.

Recommended mission types:

- `build_value`: given Arabic, build Roman,
- `read_value`: given Roman, answer Arabic,
- `repair_form`: repair invalid/nonstandard Roman,
- `match_clock`: match clock hour,
- `choose_canonical`: choose standard form among distractors,
- `chunk_build`: build thousands/hundreds/tens/ones chunks,
- `world_read`: read contextual Roman numeral,
- `world_write`: write contextual Roman numeral.

Random generation rules:

- Level 1 uses mostly fixed hand-authored prompts.
- Levels 2-5 may generate values from level ranges.
- Always include edge values more often than uniform random would:
  - `4, 9, 14, 19, 39, 40, 44, 49, 90, 99, 400, 444, 900, 944, 999, 1000,
    1066, 1776, 1999, 2026, 3999`.
- Once Level 3 or above is selected, include 25-35% review prompts from
  earlier levels.
- Avoid showing the exact same target twice in a row unless the second prompt
  is a deliberate repair/retry.

## 11. Roman Numeral Model

### 11.1 Canonical Tables

Use table-based conversion, not ad hoc string manipulation.

```js
const ROMAN_ONES = [
  "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX",
];

const ROMAN_TENS = [
  "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
];

const ROMAN_HUNDREDS = [
  "", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
];

const ROMAN_THOUSANDS = ["", "M", "MM", "MMM"];
```

`toRoman(n)`:

- accepts integer `1..3999`,
- rejects anything else,
- returns `thousands + hundreds + tens + ones`.

### 11.2 Parsing And Validation

Implement:

```js
function analyzeRoman(raw) {
  return {
    input: "XLIX",
    normalized: "XLIX",
    valid: true,
    canonical: "XLIX",
    value: 49,
    issues: [],
    chunks: [
      { place: "thousands", roman: "", value: 0 },
      { place: "hundreds", roman: "", value: 0 },
      { place: "tens", roman: "XL", value: 40 },
      { place: "ones", roman: "IX", value: 9 },
    ],
  };
}
```

Normalization:

- trim whitespace,
- uppercase Latin letters,
- allow only `I, V, X, L, C, D, M`,
- reject Unicode Number Forms such as `Ⅻ` with a friendly message asking for
  Latin letters.

Validation:

- legal subtractive pairs are exactly `IV, IX, XL, XC, CD, CM`,
- `I`, `X`, `C`, `M` may repeat at most three times,
- `V`, `L`, `D` may not repeat,
- total parsed value must be `1..3999`,
- canonical `toRoman(value)` must exactly match the normalized input for
  `valid: true`.

Nonstandard-but-parseable:

- If an input can be valued but differs from its canonical form, return
  `valid: false`, the computed value, canonical form, and a specific issue.
- Example: `IIII` returns value `4`, canonical `IV`, issue
  `tooManyRepeats`.

Invalid:

- unknown characters,
- blank input,
- `0`,
- negative values,
- decimals,
- illegal subtractive pairs,
- impossible orderings that cannot be safely valued.

Do not accept "almost Roman" forms as correct in game modes. They may receive
`close` feedback if the value is recoverable and the mistake is educational.

### 11.3 Chunking

Implement:

```js
function chunkArabic(n) {
  return {
    thousands: { digit: 2, value: 2000, roman: "MM" },
    hundreds: { digit: 0, value: 0, roman: "" },
    tens: { digit: 2, value: 20, roman: "XX" },
    ones: { digit: 6, value: 6, roman: "VI" },
  };
}
```

Use chunking for:

- canvas chunk strip,
- Guided Path explanations,
- feedback,
- hints,
- first-wrong-chunk detection.

Chunk display for zero:

- English: `no hundreds chunk`
- Polish: `brak setek`

Do not display zero as a Roman symbol.

## 12. Feedback And Scoring

Use the shared four-tier result palette.

### 12.1 Result Types

`perfect`:

- exact canonical answer,
- first attempt,
- no hint used.

`close`:

- correct value but noncanonical form,
- or one chunk wrong while the rest is correct,
- or answer is off by a common subtractive mistake such as `VIIII` for `IX`.

`far`:

- recognizable Roman-symbol work but wrong value,
- multiple chunk errors,
- selected a plausible distractor.

`miss`:

- blank answer,
- out-of-range answer,
- unknown characters,
- invalid construction with no recoverable value,
- repeated failed attempts after guidance.

### 12.2 Feedback Copy Pattern

Every feedback message should answer three questions:

1. What happened?
2. What rule applies?
3. What should the learner try next?

Examples:

- Perfect:
  - `Yes. XLIX is 40 + 9, so it is 49.`
- Close:
  - `IIII has the value 4, but standard Roman uses IV. Put I before V to show one less than five.`
- Far:
  - `XC is 90, not 110. X before C means subtract ten from one hundred.`
- Miss:
  - `VX is not a standard subtractive pair. Only I before V or X, X before L or C, and C before D or M can subtract.`

Feedback must be shown:

- visually in the panel (a tier-colored inline feedback card directly below
  the actions; the card section is hidden while empty),
- visually on the tablet/chunk strip and, for build missions, in the
  panel build-plan chunk slots (the first wrong chunk is marked),
- through an `aria-live` region.

Full-screen result overlays follow the shared four-tier pattern (emoji +
color wash: 🎉/👍/🤔/❌) and appear when a mission is **resolved** at any
tier, plus guided-path level completion and the sprint summary (sprint
rounds themselves stay inline). Dismissing an overlay never replaces the
mission: the task, inline feedback card, and chunk details stay visible,
and the learner advances with the explicit `Next` button. Retry support
steps never show an overlay.

Error recovery:

- a wrong Read answer does not end the mission: the wrong choice is marked
  and disabled (typed answers get a try-again message), and only a second
  wrong answer resolves the mission with the chunk explanation,
- a correct-value but noncanonical build (e.g. `IIII` for 4) does not end
  the mission: the child is told the standard form and can repair the build,
- sprint rounds remain single-try.

### 12.3 Hints

Hints are staged:

1. remind the relevant rule,
2. reveal the chunk affected,
3. show the canonical chunk.

Example for `944`:

1. `Start with the hundreds chunk. 900 uses one hundred before one thousand.`
2. `The hundreds chunk is CM.`
3. `944 is CM + XL + IV.`

Hints reduce result from `perfect` to `close` at best, but they should not be
framed as a penalty in the UI.

## 13. Controls And Interactions

### 13.1 Mode Selector

The mode grid lives in the lower "Practice" section — the task card is
always first. Labels are goal-oriented and short enough for the compact
grid (EN / PL):

- Learn / Nauka (guided)
- Build / Buduj (explore)
- Read / Czytaj
- Write / Pisz
- Fix / Napraw (repair)
- World / Świat (hunt)
- Sprint / Sprint

First-run users instead see the "Start here" launcher in the task section
(see 8.1). Do not place primary mode navigation above the canvas.

### 13.2 Level Selector

Five level cards (number + level name), each showing:

- a tiny laurel mark when the level has laurels,
- a small star marker on the recommended next level (lowest level with no
  completed missions),
- the active level's name and range in the description line below,
- a compact one-line progress summary under the description, hidden until
  progress exists.

Levels must remain selectable even without progress.

### 13.3 Symbol Tiles

DOM buttons for:

- `I`
- `V`
- `X`
- `L`
- `C`
- `D`
- `M`

Behavior:

- the primary input is a symbol tile grid in the panel answer section,
  directly below the task card; tapping a grid tile appends the symbol,
- a secondary draggable tray sits at the top of the stage (pointer-only:
  `aria-hidden`, `tabindex="-1"` — keyboard and screen-reader users use the
  panel grid); drag from the tray inserts the tile at any position on the
  inscription line (a caret shows the insertion point),
- tapping a placed tile on the tablet selects it (selection ring); a
  selection toolbar appears in the panel with Delete, move left, move
  right; tapping a panel symbol tile while a tile is selected replaces it,
- drag a placed tile to reorder it; deleting by drag requires dropping it
  on the trash zone that appears while dragging — dropping elsewhere off
  the line is a no-op,
- in Repair missions the suspected wrong tile(s) are highlighted from the
  analyzer's issue position,
- Undo and Clear remain in the panel,
- symbols beyond the selected level are hidden, with a caption explaining
  what the level uses and which symbol appears next ("Level 1 uses I, V, X.
  L appears in Level 2."); Explore shows all seven with its own caption,
- each tile shows its value, such as `I = 1`.

Keyboard:

- pressing `I`, `V`, `X`, `L`, `C`, `D`, `M` appends that symbol if allowed,
- lowercase keys work,
- Backspace removes the last symbol,
- Delete clears if focus is not in a text input,
- Enter checks the answer or advances after a result,
- Escape closes overlays.

### 13.4 Actions

Required action buttons:

- Check (hidden in choice-card missions — choosing a card is the answer;
  typed Read missions get an inline Check beside the input),
- Hint (below the choices in choice mode),
- Undo / Clear (only when building is possible),
- Next (appears only once the mission is resolved; nothing auto-advances
  outside sprint).

Mode-specific:

- Guided Path: Back, Next step, Skip lessons.
- Sprint: Start, Next round (after wrong answers), summary overlay.
- Explore: `Build this number` for the current Arabic input, plus example
  chips (Try 4 / Try 9 / Try 2026).
- Repair/build selection: Delete, move left, move right.

Use text buttons for these commands. Do not use custom SVG icons unless they
already exist in the app; this project has no icon dependency.

### 13.5 Arabic Input

In Explore and Read Game:

- support a numeric input or on-screen number pad,
- clamp/validate by selected level range,
- never silently coerce invalid values,
- show friendly out-of-range feedback.

For early Level 1 and Level 2 Read Game:

- answer cards are preferred over typing,
- typing remains acceptable if implemented.

## 14. Panel Readouts

Minimum readouts:

- Current Roman
- Arabic value
- Standard form
- Chunk breakdown
- Rule status
- Current level progress

Readout examples:

```text
Roman: MMXXVI
Arabic: 2026
Standard: yes
Chunks: MM + no hundreds + XX + VI
Rule: All chunks are in standard order.
```

For invalid/nonstandard input:

```text
Roman: IIII
Arabic: 4
Standard: IV
Rule: I repeats at most three times.
```

When value is unknown:

```text
Roman: VX
Arabic: -
Standard: -
Rule: VX is not a standard subtractive pair.
```

## 15. Progress And Rewards

Progress should be light and local.

Use `localStorage` with `try/catch`:

- `romanIntroSeenV1`
- `romanProgressV1`

Suggested progress shape:

```js
{
  version: 1,
  bestByLevelMode: {
    "1:read": { perfect: 8, close: 2, completed: 10 },
    "2:write": { perfect: 4, close: 3, completed: 7 },
  },
  laurels: {
    "level-1": 12,
    "level-2": 5,
  },
  lastLevel: 2,
  lastMode: "write",
}
```

Rules:

- app works fully if storage fails,
- no account or cloud sync,
- no content locking,
- no leaderboard,
- rewards are small laurel marks/streak counters,
- progress is shown as one compact line in the level section, hidden until
  it is nonzero and never on the first guided step,
- avoid over-celebrating basic clicks.

## 16. Localization

All user-facing strings must live in the inline `I18N` object.

Roman numerals and Arabic numerals are language-neutral. Labels, prompts, and
feedback translate.

Required English terms:

- Roman numerals
- Arabic number
- standard form
- chunk
- thousands
- hundreds
- tens
- ones
- subtractive pair
- no zero
- out of range

Required Polish terms:

- `liczby rzymskie`
- `liczba arabska`
- `zapis standardowy`
- `część` or `fragment` for chunk; use one consistently
- `tysiące`
- `setki`
- `dziesiątki`
- `jedności`
- `para odejmująca`
- `brak zera`
- `poza zakresem`

Recommended Polish guidance:

- Prefer natural descriptive sentences over literal grammar labels when
  needed.
- For subtractive notation, use `para odejmująca` for the UI label and
  explain in sentences such as:
  - `I przed V oznacza o jeden mniej niż pięć.`
- The app should still receive human Polish review before ship.

Minimum string keys to include:

```js
{
  modeGuided,
  modeExplore,
  modeRead,
  modeWrite,
  modeRepair,
  modeHunt,
  modeSprint,
  levelClock,
  levelSmall,
  levelHundreds,
  levelDates,
  levelFull,
  actionCheck,
  actionHint,
  actionUndo,
  actionClear,
  actionNext,
  readoutRoman,
  readoutArabic,
  readoutStandard,
  readoutChunks,
  readoutRule,
  resultPerfect,
  resultClose,
  resultFar,
  resultMiss,
  noRomanZero,
  outOfRange,
  invalidSymbol,
  invalidPair,
  tooManyRepeats,
  fiveSymbolsDoNotRepeat,
}
```

## 17. Accessibility

Accessibility is not optional because the canvas alone is not accessible.

Required:

- all core interactions have DOM controls,
- canvas has a translated `aria-label`,
- result text is announced through a visually hidden `aria-live` region,
- focus-visible styles on all controls,
- keyboard operation for building, checking, undoing, clearing, and advancing,
- no color-only feedback,
- reduced-motion behavior in CSS and JS,
- overlays/dialogs, if used, have role, focus management, and keyboard
  dismissal per `CLAUDE.md`.

Screen reader behavior:

- Announce the current built numeral as spaced letters:
  - `M M X X V I`
- Announce value and status:
  - `Current Roman numeral M M X X V I, value 2026, standard form.`
- For invalid input:
  - `V X is not standard. V before X is not a legal subtractive pair.`

Do not rely on the canvas inscription as the only representation of the
current answer. Keep a DOM text readout synchronized.

## 18. Edge Cases

Arabic input:

- blank: show no value and ask for a number,
- `0`: explain Roman numerals in this app have no zero,
- negative: out of scope,
- decimal: ask for a whole number,
- `4000+`: out of standard range for this app,
- non-numeric: ask for digits.

Roman input:

- blank: ask for a numeral,
- lowercase: normalize to uppercase,
- spaces between symbols: either remove spaces or show a friendly note; choose
  one behavior and keep it consistent,
- Unicode Number Forms: reject with a friendly message,
- punctuation: invalid symbol,
- invalid pair: name the pair and list legal pairs when useful,
- nonstandard but valuably parseable: show value plus canonical form.

Level constraints:

- if a child enters a valid numeral above the selected level range in Explore,
  show the value and note that it belongs to a later level,
- in scored modes, treat above-level answers as out of mission range unless
  the mission explicitly asks for full-range practice.

## 19. Required Test Cases

### 19.1 Converter Tests

`toRoman` must pass:

| Arabic | Roman |
|---:|---|
| 1 | I |
| 2 | II |
| 3 | III |
| 4 | IV |
| 5 | V |
| 8 | VIII |
| 9 | IX |
| 12 | XII |
| 14 | XIV |
| 19 | XIX |
| 24 | XXIV |
| 39 | XXXIX |
| 40 | XL |
| 44 | XLIV |
| 49 | XLIX |
| 90 | XC |
| 99 | XCIX |
| 149 | CXLIX |
| 276 | CCLXXVI |
| 399 | CCCXCIX |
| 400 | CD |
| 444 | CDXLIV |
| 707 | DCCVII |
| 900 | CM |
| 944 | CMXLIV |
| 999 | CMXCIX |
| 1000 | M |
| 1066 | MLXVI |
| 1776 | MDCCLXXVI |
| 1999 | MCMXCIX |
| 2026 | MMXXVI |
| 3999 | MMMCMXCIX |

### 19.2 Rejection And Nonstandard Tests

These must not be accepted as correct canonical answers:

| Input | Expected issue |
|---|---|
| empty string | blank |
| 0 | no Roman zero |
| MMMM | out of range / too many M |
| IIII | nonstandard, use IV |
| VIIII | nonstandard, use IX |
| VV | V does not repeat |
| LL | L does not repeat |
| DD | D does not repeat |
| IC | illegal subtractive pair |
| IL | illegal subtractive pair |
| VX | illegal subtractive pair |
| XD | illegal subtractive pair |
| IIV | doubled subtraction |
| XXC | doubled subtraction |
| MCMC | nonstandard order / use MCM |
| XLXL | repeated subtractive chunk |
| Ⅻ | use Latin letters XII |

### 19.3 Manual App Scenarios

Before ship, manually verify:

- first visit shows the "Start here" launcher; its primary button opens
  Guided Path Level 1 step 1 with the Learn/Do/Goal/Status card,
- user can skip the lessons and enter free building,
- one task in every mode is playable,
- one task in every level is playable,
- a wrong Read answer keeps the mission active (marked choice, inline
  feedback, no overlay); only the second wrong answer resolves it,
- resolved missions show the shared tier overlay; dismissing it keeps the
  mission and feedback visible and never silently starts a new mission,
- a noncanonical correct-value build stays active and can be repaired,
- sprint pauses on wrong answers with a `Next round` button,
- tapping a placed tile selects it; delete requires the toolbar or the
  trash zone,
- English/Polish switch updates labels, aria labels, and current feedback,
- mobile layout works at `320px` and `375px` width in both languages,
- desktop panel is the only scroll container,
- keyboard-only user can complete a Read and Write mission using only the
  panel controls,
- `prefers-reduced-motion` removes shake/confetti and the guided tile pulse,
- storage failure does not break the app,
- invalid forms are explained, not silently blocked,
- `IIII` is not accepted as standard except as a labeled clock fun fact.

### 19.4 Quality Gate

Run from `learn/` after implementing the app:

```bash
npm run code-review -- roman/index.html
```

The app is not done until this passes.

## 20. Implementation Milestones

Recommended order for the coding agent:

1. Keep skeleton metadata and light chassis; replace placeholder panel with
   mode/level/mission controls.
2. Implement converter, chunker, and validator with tests or debug assertions.
3. Build Explore mode and synchronized readouts.
4. Add canvas tablet/tile drawing and pointer hit-testing.
5. Add Guided Path for Level 1, then extend to all five levels.
6. Add Read and Write games.
7. Add Repair Game.
8. Add World Hunt contexts.
9. Add Laurel Sprint and local progress.
10. Complete i18n, accessibility, reduced motion, responsive polish, and final
    code review.

## 21. Definition Of Done

- `roman/index.html` is a complete single-file app.
- All seven modes exist and are usable.
- All five levels exist with the ranges and concepts in this document.
- The converter and validator pass the listed cases.
- English and Polish UI strings exist for all visible text.
- Core interactions work with pointer, touch, and keyboard.
- Feedback is rule-based and visible in both canvas and panel.
- Progress is local-only and failure-tolerant.
- Out-of-scope forms are explained clearly.
- `npm run code-review -- roman/index.html` passes.
- `index.md` keeps a single Roman Numerals entry; remove `Under development`
  only when the app itself ships.
