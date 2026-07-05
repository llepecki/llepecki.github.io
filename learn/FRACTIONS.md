# Fraction Playground: Design Brief

Reference interaction/style baseline: `friction.html`, `momentum.html`

Target file: `fractions.html`

Project implementation baseline:

- follow the same single-file HTML, inline CSS, inline JavaScript, localization, and responsive-layout conventions already used by the other `learn/` apps in this folder,
- use the light-theme family from `STYLE.md`,
- use the same compact header, large left play area, fixed right panel, and mobile stacking behavior visible in `friction.html` and `momentum.html`,
- keep the app tactile and visual first; long explanatory text is secondary,
- if a low-level detail is unspecified here, inherit the established project convention rather than inventing a new UI language.

## 0. Questions And Working Assumptions

These are the main design choices that came out of the brainstorm. They are locked for `v1` unless the product owner changes them later.

1. Should the app feel like a story game or a manipulative?
   Assumption for `v1`: primarily a digital manipulative with a light mission-card wrapper. The math model matters more than lore.

2. Should advanced mode mean middle-school symbolic procedures?
   Assumption for `v1`: no. Advanced means deeper representation links, stronger comparison reasoning, and exact fraction-decimal conversion for friendly cases, still appropriate for children up to age 11.

3. Should decimals be taught as a separate chapter?
   Assumption for `v1`: no. Decimals are presented as another way to name some fractions, especially tenths and hundredths.

4. Should the number line be optional?
   Assumption for `v1`: no. The number line remains visible in all three modes because it is one of the strongest tools for showing fractions as numbers, not only as shaded slices.

5. Should the app rely mainly on pizza or pie visuals?
   Assumption for `v1`: no. `v1` uses bars, strips, number lines, and hundred grids as the main models. Circle models exist, but they are not the dominant representation.

6. Should the child type answers into text boxes?
   Assumption for `v1`: no. Core interactions should be taps, drags, and choice buttons. This keeps the focus on reasoning, not spelling or keyboard accuracy.

## 0.1 Handoff Goal

This document is intended to be fully ready for implementation handoff.

Where a later section is more specific than an earlier section, the later section takes priority. In particular:

- Section `15. Locked V1 Specification` overrides softer earlier wording,
- Section `16. Required EN / PL Strings` defines the minimum string inventory the implementation must include,
- Section `17. Source Links And Design Traceability` explains which outside ideas shaped the product decisions.

## 1. Purpose And Educational Goal

This app teaches children how to think about:

- fractions as equal parts of a whole,
- fractions as positions on a number line,
- numerator as selected parts and denominator as total equal parts,
- equivalent fractions as different names for the same amount,
- mixed numbers as more than one whole,
- decimals as fractions built from tenths and hundredths,
- comparison using size, benchmarks, and location on a line.

The app should not feel like drill software. The main learning should happen through direct manipulation:

- fill a strip,
- split the same strip into more equal parts,
- drag a point on a line,
- shade a hundred grid,
- see the same value update everywhere at once.

The biggest `aha` moments should be:

- `The parts have to be equal.`
- `A fraction is not only a picture. It is also a number with a place on the line.`
- `2/4 and 1/2 can look different but land at the same point.`
- `0.7 is the same amount as 7/10.`
- `1 1/4 is one whole and one more quarter, not two unrelated numbers.`

## 2. Target Audience

Children aged roughly `7-11`, plus parents and teachers using the app as a classroom or at-home explainer.

Important assumptions:

- some children will already know halves and quarters but not formal vocabulary,
- some children will still confuse the denominator with "how big the number is" instead of "how many equal parts there are",
- reading load should stay low,
- the app should remain useful from early fraction exposure through upper-elementary fraction-decimal connections.

The three required difficulty modes should map to this audience like this:

- `Introduction`: first contact with equal parts, unit fractions, simple naming, and tenths,
- `Intermediate`: equivalence, comparison, mixed numbers, tenths and hundredths,
- `Advanced`: exact friendly conversions between common fractions and decimals, tighter benchmark reasoning, and multi-representation repair tasks.

Advanced must still stay within elementary comfort. It should feel deeper, not harsher.

## 3. External Inspiration And Brainstorm Synthesis

### 3.1 External Educational Takeaways

These sources strongly shaped the design:

- The Math Learning Center `Fractions` app emphasizes open-ended play with bars, circles, labels, and superimposed comparisons. This supports a build-and-see model rather than a quiz-only model.
- The Math Learning Center `Number Frames` app shows the value of structured grids and frames for grouping and seeing benchmarks quickly, which is useful for tenths and hundredths.
- Understood highlights the number line as a strong way to compare fractions and avoid treating them as disconnected whole numbers.
- Illustrative Mathematics uses sub-partitioned number lines to show why equivalent fractions land at the same place, and it treats decimals as values that should also live on number lines.
- NRICH's `Fractional Wall` shows how children can discover equivalence by stacking aligned strips and noticing recurring patterns visually.
- NCTM fraction resources stress that children benefit from more than one model family. If the app uses only one picture type, children can memorize a picture instead of learning the concept.

### 3.2 Brainstormed Interaction Patterns

Possible playful interactions considered:

- fair-sharing tasks where a whole bar must be split equally before any fraction is named,
- a draggable point that must land on the same value as a shaded model,
- a fraction wall that grows by stacking equivalent strips,
- a hundred-grid paint task for decimals,
- mixed-number building with multiple adjacent wholes,
- "repair the mismatch" puzzles where one representation is wrong,
- benchmark missions around `0`, `1/2`, `1`, and `2`,
- composition tasks like "make exactly 1 using these pieces" or "make 1.25",
- compare tasks using `>`, `<`, and `=`,
- light collection/reward loops with stars or stickers after correct missions.

### 3.3 Chosen Product Synthesis

The chosen `v1` design is a light-mode app called `Fraction Playground`.

It combines:

- one large interactive model stage,
- one always-visible number line,
- one right-side mission and readout panel,
- three difficulty modes,
- a small set of strong manipulations reused across many missions.

The chosen core rule is:

`Every important fraction or decimal action must update at least two representations at once.`

This is the single most important product decision in the entire brief.

## 4. High-Level Product Concept

The app should feel like a bright tabletop math studio with paper strips, colored tiles, and a clear measuring line.

The child receives a mission card such as:

- `Show 3/4`
- `Place 0.6 on the line`
- `Make an equivalent name for 1/2`
- `Which is greater: 3/5 or 0.5?`
- `Build 1 3/10`

The child then solves it by touching the models directly.

Main loop:

1. The app shows one mission card and one main visual workspace.
2. The child taps, drags, or shades pieces.
3. The bar, number line, and decimal/fraction readouts update together.
4. The app gives immediate visual feedback and one short sentence of guidance.
5. Success triggers a brief celebration and offers the next mission.

The app should also include `Explore` mode inside each difficulty level so children can play without a success/failure card.

## 5. Scope

A single self-contained HTML file, `fractions.html`, in the `learn/` directory. Bilingual `English / Polish`. No external dependencies beyond Google Fonts.

In scope:

- `Introduction`, `Intermediate`, and `Advanced` modes,
- fraction bar / strip model,
- optional circle model for early sharing tasks,
- hundred grid for tenths and hundredths,
- always-visible number line,
- symbolic fraction card,
- decimal card,
- mixed-number representation,
- equivalent-fraction wall behavior,
- guided missions,
- hint system,
- free explore mode,
- light progress/reward state,
- touch-friendly interaction on desktop and mobile.

Out of scope:

- repeating-decimal conversion such as `1/3 = 0.333...`,
- long division procedure teaching,
- full symbolic fraction arithmetic curriculum,
- negative fractions,
- denominators beyond what the listed mode rules allow,
- accounts, cloud saves, or backend features,
- multiplayer,
- audio narration as a required feature,
- dark theme.

## 6. Visual Design

### 6.1 Visual Direction

Use the same broad light-mode family as `friction.html` and `momentum.html`, but make the learning materials feel more tactile and playful.

Suggested color language:

- background: warm off-white and pale sand gradient,
- board area: soft cream or paper tone,
- neutral text: blue-gray,
- intro accent: teal,
- intermediate accent: sky blue,
- advanced accent: amber-orange,
- success accent: fresh green,
- error/nudge accent: coral-red.

Suggested texture language:

- paper-strip feel for fraction bars,
- sticker-like tiles for numerators,
- faint graph-paper or notebook-grid hints in the board background,
- rounded markers and rails instead of sharp, technical lines.

Avoid:

- overly cute mascot overload,
- neon arcade styling,
- dark backgrounds,
- purple-heavy defaults,
- pizza-only visuals.

### 6.2 Screen Layout

Follow the broad project layout pattern:

```text
[Home] Fraction Playground                          [PL]
Build, compare, and place fractions and decimals.

[Introduction | Intermediate | Advanced]
[Bar | Circle | Grid] [Explore]
[New Mission] [Hint] [Reset]

+------------------------------------------------------+ +----------------------+
| Model Stage                                          | | Mission Card         |
| large interactive strip / circle / grid area         | | prompt               |
| animated partitions and fills                        | | current mode summary |
|                                                      | | fraction readout     |
|                                                      | | decimal readout      |
|                                                      | | mixed / simplified   |
+------------------------------------------------------+ | hint / feedback      |
| Number Line Stage                                    | +----------------------+
| 0 ---- 1/2 ---- 1 ---- 1 1/2 ---- 2                 |
| draggable marker, benchmark labels, zoom in adv.    |
+------------------------------------------------------+

[short status sentence]
```

Desktop:

- the left play area dominates the width,
- the right panel is fixed-width,
- the number line gets its own horizontal band under the model stage,
- the board should feel spacious enough for direct manipulation.

Mobile:

- the control rows wrap cleanly,
- the model stage remains first,
- the right panel moves below the number line,
- touch targets stay large,
- there should be no tiny draggable handles that require precision fingertip control.

### 6.3 Main UI Components

Header:

- home link to `/learn/`,
- title,
- one-line subtitle,
- language toggle.

Top controls:

- mode toggle: `Introduction`, `Intermediate`, `Advanced`,
- model toggle: `Bar`, `Circle`, `Grid`,
- `Explore` toggle,
- action buttons: `New Mission`, `Hint`, `Reset`.

Left board:

- one main model stage,
- one always-visible number line stage,
- contextual overlays for compare tasks, fraction-wall tasks, or zoom tasks.

Right panel:

- mission card,
- live readouts,
- one short concept reminder,
- one short feedback line,
- optional progress strip or star count.

Bottom status line:

- one sentence only,
- should always explain the current learning state in child-friendly terms.

## 7. Core Representation System

### 7.1 Model Families

`v1` should include exactly these visual models:

1. `Bar / Strip`
   - primary model in all modes,
   - best for equal parts, equivalence, mixed numbers, and length comparison.

2. `Circle`
   - available only in `Introduction` and selected `Intermediate` missions,
   - used for fair-sharing intuition,
   - never the only model for a concept.

3. `Hundred Grid`
   - used for tenths and hundredths,
   - primary visual for many decimal missions,
   - should allow clean grouping by rows and columns.

4. `Number Line`
   - always visible,
   - always synchronized,
   - should remain readable even when the main model changes.

5. `Symbol Card`
   - always visible in the right panel,
   - shows the current fraction, simplified fraction, mixed number when applicable, and decimal when allowed.

### 7.2 Synchronization Rule

Whenever the child changes a value in one place, the other active representations must update immediately.

Examples:

- shading `3` parts out of `4` in the bar should move the number-line point to `3/4`,
- dragging the point to `0.6` should fill `6/10` in the strip or grid,
- repartitioning `1/2` into fourths should animate into `2/4` without changing the total amount,
- building `1 1/4` should show one full strip plus one quarter of the next strip and place the point at `1.25`.

### 7.3 Equal-Parts Rule

The app must never allow an unequal partition to count as a valid fraction model.

This is a hard pedagogy rule.

If the mission involves making a denominator:

- the app should create equal partitions automatically, or
- the child should choose among equal-part options only.

The app is not teaching freehand drawing of slices.

### 7.4 Same-Whole Rule

Equivalent fractions or size comparisons must only be presented with a visibly consistent whole.

Implementation consequence:

- equivalent strips must have the same total width,
- comparison tasks should align bars against the same total span,
- if a task intentionally shows different wholes, the app must clearly label that as a warning case and not mark it correct by accident.

### 7.5 Number-Line Rule

The number line is not decorative. It is one of the main teaching tools.

Rules:

- the point should snap cleanly to valid target locations when appropriate,
- equal intervals must look equal,
- tick labels should be sparse and readable,
- benchmark labels such as `0`, `1/2`, `1`, and `2` should appear when useful,
- advanced decimal tasks may zoom one section of the line to show hundredths more clearly.

### 7.6 Decimal Rule

Decimals in `v1` are taught mainly through:

- tenths,
- hundredths,
- exact fraction-decimal pairs with friendly denominators.

The app must reinforce:

- `0.4 = 4/10`,
- `0.25 = 25/100 = 1/4`,
- `1.2 = 1 + 2/10`.

The decimal display should never imply that every fraction in the app must be turned into a terminating decimal.

## 8. Difficulty Modes

### 8.1 Introduction Mode

Main goals:

- understand equal parts,
- name simple fractions,
- link numerator and denominator to the picture,
- treat fractions as values between `0` and `1`,
- meet tenths in a gentle way.

Allowed content:

- values from `0` to `1`,
- denominators: `2, 3, 4, 5, 6, 8, 10`,
- decimal tasks only for tenths.

Preferred mission types:

- `Show the fraction`,
- `Which card matches this model?`,
- `Place the point`,
- `Share the whole fairly`,
- `Show 7/10 as both a strip and a decimal`.

Visual emphasis:

- larger pieces,
- fewer labels at once,
- strong color fill,
- clear spoken-style prompt text.

Example mission prompts:

- `Show one half.`
- `Tap 3 out of 4 equal parts.`
- `Where is 2/3 on the line?`
- `Shade 6/10 and read the decimal.`

### 8.2 Intermediate Mode

Main goals:

- discover equivalent fractions,
- compare two fractions or a fraction and a decimal,
- build mixed numbers,
- connect tenths and hundredths to grids and number lines,
- understand that the same point can have more than one name.

Allowed content:

- values from `0` to `2`,
- common-fraction denominators: `2, 3, 4, 5, 6, 8, 10, 12`,
- grid decimals: tenths and hundredths,
- mixed numbers up to `2`.

Preferred mission types:

- `Make an equivalent fraction`,
- `Which is greater?`,
- `Build 1 and some more`,
- `Shade the hundred grid`,
- `Match common fraction to decimal`,
- `Find the wrong label`.

Visual emphasis:

- aligned fraction-wall layouts,
- side-by-side compare lanes,
- zoomed hundred-grid sections when the denominator is `100`,
- more explicit benchmark labels.

Example mission prompts:

- `Make another name for 1/2 using eighths.`
- `Which is greater: 3/4 or 0.6?`
- `Build 1 3/10.`
- `Shade 37/100 and place 0.37 on the line.`

### 8.3 Advanced Mode

Main goals:

- move flexibly between common fractions and decimals,
- reason with benchmarks instead of only counting shaded pieces,
- spot and repair mismatched representations,
- build exact values above `1`,
- compare values that are close together.

Allowed content:

- values from `0` to `3`,
- exact fraction-decimal conversion set uses denominators `2, 4, 5, 10, 20, 25, 50, 100`,
- mixed numbers up to `3`,
- hundredths on both grid and number line,
- common-fraction comparison may still use simpler benchmark-friendly values, but decimal conversion tasks must stay inside the exact conversion set above.

Preferred mission types:

- `Repair the mismatch`,
- `Build the target value in two different ways`,
- `Place a close decimal on a zoomed line`,
- `Match 3/4, 0.75, and 75/100`,
- `Make exactly 1.25`,
- `Which is closer to 1: 0.95 or 19/20?`

Visual emphasis:

- synchronized line plus grid,
- benchmark callouts,
- simplified-fraction display,
- multiple correct names for the same value shown together.

Important limit:

Advanced should not turn into symbolic worksheet mode. The child should still be dragging, filling, aligning, and spotting relationships visually.

## 9. Mission System

### 9.1 Mission Template Set

Use a small reusable mission deck rather than dozens of one-off mechanics.

| Mission ID | Used In | Child Action | Example Prompt | Why It Helps |
|---|---|---|---|---|
| `build_target` | all modes | fill or place a target value | `Show 3/4.` | ties symbol to model |
| `read_model` | intro, intermediate | choose the correct fraction or decimal card | `Which card matches this strip?` | checks interpretation |
| `place_point` | all modes | drag a point on the number line | `Place 0.6.` | makes fraction a number |
| `make_equivalent` | intermediate, advanced | repartition the same value into a new denominator | `Turn 1/2 into eighths.` | makes equivalence visible |
| `compare_pair` | intermediate, advanced | choose `>`, `<`, or `=` | `Is 3/5 greater than 0.5?` | comparison reasoning |
| `build_mixed` | intermediate, advanced | compose one or more wholes plus a fraction | `Build 1 3/10.` | mixed-number meaning |
| `grid_decimal` | all modes after tenths appear | shade tenths or hundredths | `Shade 37/100.` | decimal place value |
| `repair_mismatch` | advanced | find or fix the wrong representation | `One picture does not match. Fix it.` | deeper synthesis |
| `compose_benchmark` | advanced | make a target such as `1`, `1.5`, or `1.25` from pieces | `Make exactly 1.25.` | composition and benchmark sense |

### 9.2 Mission Flow

Each mission should follow this pattern:

1. show a short prompt,
2. highlight the active model area,
3. let the child manipulate freely,
4. check continuously where appropriate,
5. provide immediate feedback,
6. on success, briefly celebrate and unlock the next card.

### 9.3 Hint System

Hints should come in layers:

- hint 1: remind the child what to look at,
- hint 2: highlight the relevant benchmark or part count,
- hint 3: partially reveal the structure.

Example:

- hint 1: `Count the equal parts.`
- hint 2: `The whole is split into 10 equal pieces.`
- hint 3: `Start by finding 5/10, then move one more part.`

The app should never jump straight from no help to the full answer.

### 9.4 Reward Loop

Keep rewards light and local:

- one star, sticker, or spark burst on success,
- small streak counter,
- progress bar within the current mode.

Do not build a heavy game economy. The manipulations and quick wins are enough.

## 10. Interaction Design

### 10.1 Core Controls

The top control area should include:

- mode toggle,
- model toggle,
- `Explore` toggle,
- `New Mission`,
- `Hint`,
- `Reset`.

Contextual controls may appear inside the board or right panel:

- `>`, `<`, `=` for compare missions,
- denominator selector in explore mode,
- numerator stepper in explore mode,
- zoom control for advanced number-line missions.

### 10.2 Bar Interaction

The fraction bar should support:

- tap a segment to fill or unfill it,
- drag across segments to fill multiple parts quickly,
- animate repartitioning when the denominator changes but the value stays the same,
- show multiple adjacent wholes for mixed numbers.

Important rule:

The bar should fill from left to right by default. This keeps the number-line connection obvious.

### 10.3 Circle Interaction

Circle interaction should be simpler than bar interaction:

- tap equal slices to fill,
- optionally animate fair-sharing division,
- use it mainly for early intuition,
- avoid using circles for dense advanced decimal tasks.

### 10.4 Grid Interaction

The hundred grid should support:

- tap cells,
- drag to shade runs of cells,
- optional row-group shading for tenths,
- automatic row/column grouping cues,
- strong labels for `10/100`, `25/100`, `50/100`, and `75/100`.

Recommended visual rule:

- tenths should emphasize full rows or columns,
- hundredths should still look individually countable without becoming noisy.

### 10.5 Number-Line Interaction

The number line should support:

- drag a marker horizontally,
- snap to mission-valid values when a mission demands exact placement,
- allow free movement in explore mode,
- display benchmark ticks clearly,
- zoom a selected interval for close decimal tasks in advanced mode.

The marker should feel chunky and touch-friendly, not like a tiny pixel handle.

### 10.6 Compare Interaction

For compare missions:

- show two values side by side,
- show the `>`, `<`, `=` buttons as large choice buttons,
- after a choice, briefly animate the larger value or align both onto the line.

### 10.7 Explore Mode

When `Explore` is active:

- the mission card becomes a suggestion card instead of a scored task,
- the child can choose denominator and numerator directly,
- the right panel should still show fraction, simplified fraction, mixed number, and decimal if applicable,
- the child can freely compare, repartition, and drag without success states.

Explore mode is important. It lets the app behave like a manipulable math tool, not only a quiz machine.

## 11. Math And Content Model

### 11.1 Internal Value Representation

Represent values exactly as rational numbers, not as floating-point-first state.

Recommended internal model:

```js
{
  numerator: 3,
  denominator: 4,
  wholeOffset: 0
}
```

Or equivalently:

```js
{
  improperNumerator: 3,
  denominator: 4
}
```

For mixed numbers:

- store one exact rational value,
- derive the mixed-number display from that value,
- do not maintain separate competing states for whole part and fraction part unless there is a clear normalization layer.

### 11.2 Simplification

Use a standard `gcd` reduction for display and equality checks.

Rules:

- `2/4` simplifies to `1/2`,
- `10/100` simplifies to `1/10`,
- the app may still show the unsimplified form when the mission is explicitly about tenths or hundredths,
- the right panel should be able to show both the mission form and the simplified form when that is educationally useful.

### 11.3 Equality And Comparison

All equality and comparison logic should be exact.

Use:

- cross multiplication,
- normalized rational pairs,
- or safe integer math.

Do not rely on approximate float comparison for core correctness.

### 11.4 Decimal Display Rules

Decimal display should appear only when it is exact and instructionally appropriate.

For `v1`, exact decimal conversion tasks must use denominators from this set:

- `2`
- `4`
- `5`
- `10`
- `20`
- `25`
- `50`
- `100`

This allows exact terminating decimals within the app's elementary scope.

Not in scope for `v1` decimal-conversion missions:

- thirds as repeating decimals,
- sevenths,
- arbitrary long decimal expansions.

### 11.5 Number-Line Range Rules

Use these ranges:

- `Introduction`: default line `0..1`,
- `Intermediate`: default line `0..2`,
- `Advanced`: default line `0..3`, with optional zoom windows.

Mixed-number tasks should visually show why values greater than `1` keep moving to the right instead of resetting.

### 11.6 Allowed Denominator Sets By Mode

Use these exact mode sets:

- `Introduction`: `2, 3, 4, 5, 6, 8, 10`
- `Intermediate`: `2, 3, 4, 5, 6, 8, 10, 12, 100`
- `Advanced conversion set`: `2, 4, 5, 10, 20, 25, 50, 100`

Important implementation note:

- advanced comparison missions may use values derived from simpler benchmark-friendly fractions,
- advanced decimal-conversion missions must stay inside the `Advanced conversion set`.

### 11.7 Mixed-Number Rules

Mixed-number tasks should:

- use adjacent whole bars,
- show the full first whole clearly,
- place the number-line point beyond `1`,
- display both mixed-number form and improper fraction form when useful in advanced mode.

Keep values modest:

- up to `2` in `Intermediate`,
- up to `3` in `Advanced`.

## 12. Feedback, Misconceptions, And Pedagogy Guardrails

The app should actively guard against common misunderstandings.

### 12.1 Count Spaces, Not Just Tick Marks

If a child misplaces a number-line point:

- the hint should talk about intervals or equal jumps,
- not only "pick the third line."

### 12.2 Bigger Denominator Does Not Mean Bigger Fraction

For compare missions such as `1/3` versus `1/5`:

- use aligned visual models,
- let the child see that more parts means smaller parts when the whole stays fixed.

### 12.3 Same Value, Different Name

Equivalent-fraction missions should animate subdivision rather than swap in a totally new object.

Example:

- `1/2` should visibly split into `2/4` and then `4/8`,
- the filled amount must stay constant during the animation.

### 12.4 Decimals Belong On The Same Line

The decimal display should never feel detached.

If the child builds `0.75`:

- the number line should show the point,
- the grid should show `75/100`,
- the bar should be able to show `3/4`,
- the right panel should show the names together.

### 12.5 More Than One Whole

Improper fractions and mixed numbers must not be presented as strange exceptions.

The child should be able to see:

- one full whole,
- then extra parts of the next whole,
- and the matching point to the right of `1`.

### 12.6 Feedback Tone

Feedback should be specific, short, and calm.

Good examples:

- `That is 3 out of 5 equal parts.`
- `These two land at the same point.`
- `Look at the whole. Are the bars the same size?`
- `Try using tenths first, then hundredths.`

Bad examples:

- `Incorrect.`
- `Try again.` with no useful guidance.

## 13. Localization And Accessibility

### 13.1 Localization

Bilingual English / Polish, following the existing project pattern:

- `state.lang`,
- one `I18N` dictionary,
- `applyTranslations()` function,
- language toggle in the header,
- canvas- or SVG-rendered text must respect the current language too.

All visible text must be translated, including:

- title and subtitle,
- mode labels,
- model labels,
- prompts,
- hints,
- status text,
- feedback text,
- compare symbols if wrapped in words,
- progress text.

### 13.2 Accessibility

Required accessibility behaviors:

- color is never the only success signal,
- segments and cells should also differ by outline, fill, or label state,
- keyboard support should allow moving the active number-line marker and selecting compare buttons,
- reduced-motion users should still get clear feedback without fast celebratory bursts,
- touch targets should remain comfortably tappable on mobile,
- text should stay large enough for children without zooming.

## 14. Technical Constraints And Suggested Architecture

- single self-contained HTML file,
- vanilla JavaScript only,
- no external libraries,
- Google Fonts only,
- responsive flex layout consistent with the rest of the repo,
- recommended panel width: about `300px`,
- recommended main board implementation: `SVG` for crisp, tappable shapes and easy label alignment,
- small decorative effects may use CSS animation or canvas, but the math models themselves should stay easy to inspect and update.

Recommended state shape:

```js
{
  lang: "en",
  mode: "intro",
  scene: "mission", // or "explore"
  model: "bar",
  currentValue: { improperNumerator: 1, denominator: 2 },
  targetMission: {...},
  progress: {...},
  ui: {...}
}
```

Suggested implementation order:

1. static layout and light-theme styling,
2. localization scaffold,
3. exact rational math helpers,
4. bar model plus right-panel readouts,
5. number line synchronization,
6. intro mission deck,
7. grid model and decimal support,
8. intermediate equivalence / mixed-number features,
9. advanced repair and zoom-line tasks,
10. reward polish and accessibility checks.

Repo workflow note for the implementing agent:

- once `fractions.html` exists, run `npm run code-review -- fractions.html` before considering the implementation finished.

## 15. Locked V1 Specification

This section removes ambiguity. Where Section 15 is more specific than earlier guidance, Section 15 takes priority for `v1`.

### 15.1 Hard Product Decisions

- `v1` includes exactly three difficulty modes: `Introduction`, `Intermediate`, `Advanced`.
- `v1` includes exactly three model buttons: `Bar`, `Circle`, `Grid`.
- `Circle` is disabled in `Advanced`.
- `Grid` is disabled until a task uses tenths or hundredths.
- the number line is always visible.
- `Explore` exists as a toggle inside the app, not as a fourth difficulty mode.
- `v1` uses no required typed-input answers.
- `v1` uses no dark theme.
- `v1` includes light reward feedback only; no coins, store, avatars, or unlock economy.

### 15.2 Exact Defaults

- language = `English`
- mode = `Introduction`
- scene = `mission`
- model = `Bar`
- first mission = `Show 1/2`
- number-line range = `0..1`
- labels visible where helpful
- hint level = `0`
- progress = `0`

At startup, the child should immediately understand what to touch.

### 15.3 Exact Control Set

Top control row:

- mode toggle: `Introduction`, `Intermediate`, `Advanced`
- model toggle: `Bar`, `Circle`, `Grid`
- `Explore` toggle

Action buttons:

- `New Mission`
- `Hint`
- `Reset`

Contextual controls:

- `>`, `<`, `=` buttons only during compare missions,
- zoom control only during advanced close-placement missions,
- simple numerator / denominator steppers only in explore mode if needed.

### 15.4 Exact Readout Set

The right panel must be able to show these readouts:

- target prompt,
- current fraction,
- simplified fraction,
- decimal value if exact and relevant,
- mixed number if value is greater than `1`,
- one short concept reminder,
- one short feedback or hint sentence,
- current mode progress.

### 15.5 Exact Mission Coverage

`Introduction` must include at least:

- `build_target`
- `read_model`
- `place_point`
- `grid_decimal` with tenths only

`Intermediate` must additionally include:

- `make_equivalent`
- `compare_pair`
- `build_mixed`
- `grid_decimal` with hundredths

`Advanced` must additionally include:

- `repair_mismatch`
- `compose_benchmark`
- close-placement decimal tasks on a zoomed line

### 15.6 Exact Decimal Boundaries

- intro decimal tasks use tenths only,
- intermediate decimal tasks use tenths and hundredths,
- advanced decimal conversion tasks must stay inside the exact conversion set:
  - `2, 4, 5, 10, 20, 25, 50, 100`
- no repeating-decimal teaching in `v1`.

### 15.7 Exact Mixed-Number Boundaries

- mixed numbers do not appear in `Introduction`,
- mixed numbers up to `2` appear in `Intermediate`,
- mixed numbers up to `3` appear in `Advanced`.

### 15.8 Exact Board Behavior

- bar fill goes left to right,
- equivalent-fraction animations preserve the filled amount visually,
- the number-line marker always reflects the current value,
- the current value is represented exactly, not approximately,
- wrong answers trigger one helpful cue, not a harsh error state,
- success celebration should stay below one second and never block the next action.

## 16. Required EN / PL Strings

The implementation must include at least these UI strings.

| Key | English | Polish |
|---|---|---|
| `title` | Fraction Playground | Plac Zabaw Z Ulamkami |
| `subtitle` | Build, compare, and place fractions and decimals. | Buduj, porownuj i ustawiaj ulamki oraz liczby dziesietne. |
| `modeIntro` | Introduction | Wprowadzenie |
| `modeIntermediate` | Intermediate | Sredni |
| `modeAdvanced` | Advanced | Zaawansowany |
| `modelBar` | Bar | Pasek |
| `modelCircle` | Circle | Kolo |
| `modelGrid` | Grid | Siatka |
| `explore` | Explore | Odkrywaj |
| `newMission` | New Mission | Nowe Zadanie |
| `hint` | Hint | Podpowiedz |
| `reset` | Reset | Reset |
| `mission` | Mission | Zadanie |
| `currentValue` | Current Value | Biezaca Wartosc |
| `fraction` | Fraction | Ulamek |
| `simplified` | Simplified | Uproszczony |
| `decimal` | Decimal | Dziesietny |
| `mixedNumber` | Mixed Number | Ulamek Mieszany |
| `progress` | Progress | Postep |
| `showHalf` | Show 1/2. | Pokaz 1/2. |
| `showFraction` | Show {value}. | Pokaz {value}. |
| `placePoint` | Place {value} on the line. | Ustaw {value} na osi. |
| `makeEquivalent` | Make another name for {value}. | Zrob inna nazwe dla {value}. |
| `whichGreater` | Which is greater? | Co jest wieksze? |
| `buildMixed` | Build {value}. | Zbuduj {value}. |
| `repairMismatch` | One picture does not match. Fix it. | Jeden obrazek nie pasuje. Napraw go. |
| `composeTarget` | Make exactly {value}. | Zrob dokladnie {value}. |
| `statusCountParts` | Count the equal parts. | Policz rowne czesci. |
| `statusSameWhole` | Check whether the whole is the same size. | Sprawdz, czy cala figura ma ten sam rozmiar. |
| `statusSamePoint` | These names land at the same point. | Te nazwy laduja w tym samym punkcie. |
| `statusTenths` | Try using tenths first. | Sprobuj najpierw dziesiatych. |
| `statusHundredths` | Now zoom in to hundredths. | Teraz przybliz setne. |
| `statusMixed` | One whole and some more. | Jedna cala i jeszcze troche. |
| `correct` | Correct | Dobrze |
| `tryBenchmark` | Try a benchmark like 1/2 or 1. | Uzyj punktu odniesienia, na przyklad 1/2 albo 1. |
| `greaterThan` | Greater Than | Wieksze Niz |
| `lessThan` | Less Than | Mniejsze Niz |
| `equalTo` | Equal To | Rowne |
| `introSummary` | Equal parts, simple fractions, and tenths. | Rowne czesci, proste ulamki i dziesiate. |
| `intermediateSummary` | Equivalence, comparison, mixed numbers, and hundredths. | Rownowaznosc, porownywanie, ulamki mieszane i setne. |
| `advancedSummary` | Benchmarks, exact conversions, and repair puzzles. | Punkty odniesienia, dokladne zamiany i zagadki naprawcze. |
| `exploreSummary` | Free play: change the value and watch every model update. | Swobodna zabawa: zmieniaj wartosc i patrz, jak wszystkie modele sie aktualizuja. |

Note:

- ASCII-only Polish is acceptable in `v1` if that matches the rest of the repo's current practice,
- if the implementing agent chooses full Polish diacritics, it should use them consistently.

## 17. Source Links And Design Traceability

These sources informed the product direction. The app does not need to mirror any single source exactly.

| Source | Link | Design consequence in this brief |
|---|---|---|
| Math Learning Center: Fractions | https://www.mathlearningcenter.org/apps/fractions | open-ended bars/circles plus label control inspired the manipulate-first approach |
| Math Learning Center: Number Frames | https://www.mathlearningcenter.org/apps/number-frames | structured grids informed tenths/hundredths interaction and benchmark grouping |
| Understood: Number lines help kids compare fractions | https://www.understood.org/en/articles/number-lines-help-kids-compare-fractions | reinforced the decision to keep the number line always visible |
| Illustrative Mathematics: Equivalent fractions on number lines | https://curriculum.illustrativemathematics.org/k5/teachers/grade-4/unit-2/lesson-8/preparation.html | informed the animate-subpartition approach for equivalence |
| Illustrative Mathematics: Decimals on number lines | https://curriculum.illustrativemathematics.org/k8/teachers/grade-4/unit-6/lesson-11/preparation.html | informed benchmark and zoom behavior for decimal placement |
| NRICH: Fractional Wall | https://nrich.maths.org/articles/fractional-wall | informed stacked-strip equivalence and pattern discovery |
| NCTM fraction model resources | https://www.nctm.org/Search/?q=fraction%20models | reinforced the need for multiple model families instead of one dominant picture type |

## 18. Success Criteria

The app is successful if, after a few minutes of use, a child can correctly explain at least most of the following:

- `Fractions are made from equal parts.`
- `The denominator tells how many equal parts make the whole.`
- `The numerator tells how many of those parts are selected.`
- `Fractions can be placed on a number line.`
- `Different fractions can name the same amount.`
- `Decimals such as 0.4 or 0.25 are also fractions.`
- `Values greater than 1 keep going to the right on the line.`

The app is implementation-ready when:

- all three modes exist,
- the number line stays synchronized,
- the main missions listed in Section 15 are playable,
- fraction-decimal links are exact and visually clear,
- English and Polish strings are present,
- the layout works on desktop and mobile,
- the app still feels playful rather than worksheet-like.
