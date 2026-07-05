# Review of `fractions.html`

Reviewed on 2026-05-05.

Scope:

- I reviewed the current `fractions.html` implementation.
- I focused on mathematical correctness, educational quality, and visual/display issues.
- I did not have a local browser available in this session, so the visual findings below are based on the live layout/math implied by the current code. Several of them are deterministic from the geometry and state logic, not speculative.

## Executive Verdict

The rewrite is a meaningful improvement over the previous version. The app now has distinct top-level activities, authored step data, cleaner exact-fraction helpers, and better broad educational intent.

But the current file is still not review-clean.

The main remaining problems are:

1. intermediate and advanced `Build` / `Explore` layouts are mathematically and visually broken because the board width exceeds the SVG viewport,
2. `Match` advanced is logically impossible to complete,
3. `Repair` still does not actually let the child repair anything,
4. authored decimal/fraction tasks are sometimes mislabeled because the board does not actually show decimals where the lesson says it does,
5. several UI surfaces either show wrong information or no information at all.

Those are not polish details. They directly affect whether the child can correctly read the math and whether some modes can be completed at all.

## Findings

### 1. High: Intermediate and advanced `Build` / `Explore` boards overflow off-canvas, so multi-whole content cannot be read reliably

Relevant code:

- `fractions.html:1569-1570`
- `fractions.html:1836-1845`
- `fractions.html:1891-1919`
- `fractions.html:2639-2649`
- `fractions.html:2675-2687`

What the code does:

- `sameWholeWidth()` returns a fixed `600`.
- `renderBuildBoard()` and `renderExploreBoard()` use:
  - `totalW = stripW * wholes + gap * (wholes - 1)`
  - `startX = (800 - totalW) / 2`
- The SVG viewport width is only `800`.
- `wholes` comes from difficulty:
  - intro = `1`
  - intermediate = `2`
  - advanced = `3`

Why this is a problem:

- Intermediate total width becomes `600 * 2 + 8 = 1208`, so `startX = -204`.
- Advanced total width becomes `600 * 3 + 16 = 1816`, so `startX = -508`.
- That means the strips and number line begin off the visible canvas.
- Because `.board-stage` uses `overflow: hidden`, this is not a cosmetic shift. Significant content is simply clipped.

Why this matters educationally:

- The child cannot cleanly see the full “whole” structure for mixed numbers.
- The number line and strip no longer align as intended.
- Values above `1` are supposed to become clearer in intermediate and advanced, but the geometry makes them harder to read.

Required fix:

- The width of one whole must depend on how many wholes are displayed.
- Do not keep a fixed `600px` whole width when the board can show `2` or `3` wholes.
- Use a dynamic width that keeps all bars and the number line inside the `800px` viewBox with sensible margins.

### 2. High: `Match` advanced is impossible to complete because the matching logic only supports pairs, while the sequence creates triples

Relevant code:

- `fractions.html:1378-1387`
- `fractions.html:2415-2448`
- `fractions.html:2451-2455`
- `fractions.html:2902-2936`

What the code does:

- The advanced `Match` step `tripleRepr` creates `reprTypes: ["fraction", "decimal", "bar"]`.
- `setupMatchCards()` therefore creates `3` cards per value.
- `handleMatchClick()` marks exactly `2` cards as `matched` when they have equal value.

Why this is a problem:

- If the child matches `3/4` with `0.75`, those two cards are consumed.
- The `3/4` bar card is then left without an available partner.
- The same problem happens for the second value.
- `checkMatchComplete()` requires every card to become `matched`, so the round can become unwinnable.

Why this matters educationally:

- This is not just a game-logic bug. It breaks the core teaching promise of “three representations, one value each.”
- The child is asked to reason in groups of three, but the implementation only understands groups of two.

Required fix:

- Either:
  - redesign `Match` so every round is strictly pair-based, or
  - redesign the matching state to support multi-card groups.
- Do not ship triple-representation rounds on pair-only matching logic.

### 3. High: `Repair` still does not allow actual repair; success is awarded immediately after identification

Relevant code:

- `fractions.html:1394-1435`
- `fractions.html:2462-2608`
- `fractions.html:2611-2632`

What the code does:

- The authored data describes “fix wrong fraction label”, “fix wrong decimal”, etc.
- `renderRepairBoard()` shows four quadrants and highlights the wrong one once selected.
- But `handleRepairClick()` only implements the `identify` phase.
- After correct identification, it sets `phase = "fix"` and then automatically transitions to `done` after `600 ms`, calling `onSuccess()` with no child correction step.

Why this is a problem:

- The child never fixes the wrong representation.
- The app tests spotting, not repairing.
- The board prompt says `Fix it!`, but no fixing mechanic exists.

Why this matters educationally:

- Repair tasks are supposed to build deeper understanding because the child must diagnose a contradiction and then correct it.
- Right now the mode teaches only “find the odd one out.”
- That is a weaker and different learning outcome.

Required fix:

- Keep the identify phase.
- Add a real second phase:
  - edit the wrong fraction label,
  - drag the number-line marker,
  - choose the correct decimal,
  - or repaint the bar.
- Success must depend on the child actually restoring consistency.

### 4. High: Several “decimal vs fraction” comparison lessons never display a decimal on the comparison cards

Relevant code:

- `fractions.html:1181-1188`
- `fractions.html:1214-1220`
- `fractions.html:1775-1818`
- `fractions.html:1994-2012`

What the code does:

- The step data contains lessons such as:
  - `Decimal vs fraction`
  - `Decimal vs fraction close`
- But `renderCompareBoard()` passes raw fraction values into `renderFractionCard()`.
- `renderFractionCard()` defaults to `fracFormatMixed(value.n, value.d)` unless a custom label is provided.
- No custom decimal label is provided for compare cards.

Why this is a problem:

- A step intended to compare `0.3` with `1/2` is visually shown as `3/10` versus `1/2`.
- A step intended to compare `0.7` with `3/4` is visually shown as `7/10` versus `3/4`.

Why this matters educationally:

- This removes the representation jump the lesson is supposed to teach.
- The child is no longer comparing a decimal to a fraction.
- The child is comparing two fractions while the text talks about decimals.

Required fix:

- Compare cards need explicit representation metadata.
- For decimal lessons, render one card as `0.3`, `0.7`, `0.25`, etc., not automatically as `3/10`, `7/10`, `1/4`.

### 5. High: `Place`, `Match`, and `Repair` break after the authored sequence because the fallback progression path recurses back into `loadStep()`

Relevant code:

- `fractions.html:2845-2850`
- `fractions.html:2939-2972`
- `fractions.html:2993-3002`

What the code does:

- When the authored sequence is exhausted, `loadStep()` calls `loadRandomStep()`.
- `loadRandomStep()` only has explicit generators for `build` and `compare`.
- For all other activities it falls into:

```js
} else {
  loadStep();
  return;
}
```

Why this is a problem:

- For `place`, `match`, and `repair`, once the sequence ends, `loadStep()` calls `loadRandomStep()`, which calls `loadStep()` again, which calls `loadRandomStep()` again.
- That is an infinite recursion path rather than a real free-play fallback.

Why this matters educationally:

- The app promises authored progression followed by continued play.
- Three of the five modes do not actually have a valid post-sequence path.

Required fix:

- Implement real random/free-play generators for `place`, `match`, and `repair`, or disable `Next` at the end with an explicit completion state.
- Do not recurse back into `loadStep()` for unsupported modes.

### 6. Medium: The panel value readout is wrong or meaningless in every non-build activity

Relevant code:

- `fractions.html:2761-2797`

What the code does:

- `updatePanel()` only assigns `n` and `d` from `state.build.currentValue`, or from explore mode.
- In `compare`, `match`, `place`, and `repair`, it leaves `n = 0`, `d = 1`.

Why this is a problem:

- The right panel keeps showing `0`, simplified `0`, and no useful decimal while the child is actually comparing, matching, placing, or repairing meaningful values.
- The panel is therefore either misleading or dead weight.

Why this matters educationally:

- The panel should reinforce the current task, not contradict it.
- In its current state it weakens the representation links the redesign was supposed to strengthen.

Required fix:

- Make the panel mode-aware.
- Show:
  - active target in `Build`,
  - the compared values in `Compare`,
  - the selected card or current group in `Match`,
  - the dragged token or last placed value in `Place`,
  - the canonical correct value in `Repair`.

### 7. Medium: Proper fractions in intermediate and advanced `Build` are shown with extra empty wholes, which muddies the meaning of “the whole”

Relevant code:

- `fractions.html:1016-1020`
- `fractions.html:1836-1888`
- `fractions.html:2857-2866`

What the code does:

- `Build` always uses `cfg.maxWholes`, not the number of wholes actually needed by the target.
- Intermediate therefore shows `2` wholes even for `5/8`.
- Advanced shows `3` wholes even for `15/20`.

Why this is a problem:

- For a proper fraction like `5/8`, the teaching focus should be one clearly defined whole.
- Showing extra empty wholes changes the visual story from:
  - “5 of 8 equal parts of one whole”
to
  - “some amount across a larger multi-whole board.”

Why this matters educationally:

- Children can confuse denominator meaning when too much unused board appears around a simple proper fraction.
- This is especially risky because the app is for learners still stabilizing the idea of what “the whole” is.

Required fix:

- Use the minimum number of whole bars needed by the current target in `Build`.
- Reserve multi-whole boards for mixed numbers and improper fractions.

### 8. Medium: Most authored step goals and success explanations are never surfaced, so the educational sequence is flatter than the data suggests

Relevant code:

- `fractions.html:1037-1435`
- `fractions.html:2016-2027`
- `fractions.html:2240-2249`
- `fractions.html:2402-2411`
- `fractions.html:2591-2608`
- `fractions.html:2981-2990`

What the code does:

- The sequence data contains rich `goal`, `concept`, `hint1`, `hint2`, and `feedbackSuccess` text.
- In practice:
  - `Compare` uses its step-specific feedback in reveal.
  - `Build`, `Place`, `Match`, and `Repair` mostly use generic mode summaries and generic `Correct`.

Why this is a problem:

- The app has the raw content needed for better instruction.
- But much of it never reaches the child.
- That flattens the difference between easier and harder steps and weakens the sense of progression.

Why this matters educationally:

- Authored sequences are only valuable if the step-specific teaching is visible.
- Otherwise the app regresses toward a generic exercise shell.

Required fix:

- Surface `goal` and/or `concept` on the board or in the panel for each step.
- Use step-specific success feedback in all modes, not only compare.

### 9. Medium: Decimal learning is underrepresented visually because the app has no area/grid model at all

Relevant code:

- `fractions.html:1573-1818`
- `fractions.html:1181-1188`
- `fractions.html:1304-1310`
- `fractions.html:2348-2349`
- `fractions.html:2575-2586`

What the code does:

- The reusable board primitives are strips, number lines, and text cards.
- Decimal content is shown mainly as:
  - decimal text labels,
  - line positions,
  - fraction-decimal equivalence in text.
- There is no hundred-grid or other area model for tenths and hundredths.

Why this is a problem:

- The app nominally teaches decimals, but it mostly does so symbolically.
- It is much weaker at showing why `0.7`, `0.25`, and `0.75` correspond to fractional amounts.

Why this matters educationally:

- For this age group, tenths and hundredths benefit strongly from a structured area model.
- The current implementation leans too heavily on symbolic reading and line placement.

Required fix:

- Reintroduce at least one strong decimal area model, ideally a tenths/hundredths grid, for decimal-heavy tasks.

### 10. Medium: Advanced close-placement tasks are visually harder than they need to be because the board does not zoom or isolate the critical interval

Relevant code:

- `fractions.html:1315-1324`
- `fractions.html:2184-2250`
- `fractions.html:2287-2299`

What the code does:

- The advanced place task uses:
  - `7/8`
  - `0.9`
  - `nlDenom: 40`
- But `renderPlaceBoard()` still renders one full-width number line with no zoomed interval or close-value highlight.

Why this is a problem:

- The content is about close distinctions.
- The visual support does not focus the learner on the tiny interval near `1`.
- The task risks becoming motor accuracy plus visual squinting rather than reasoning.

Required fix:

- Add a zoomed local window for close-placement tasks.
- Highlight the interval between `0.8` and `1.0`, or otherwise isolate the useful region.

### 11. Medium: The `Next` button allows the child to skip the authored sequence without mastery

Relevant code:

- `fractions.html:729-736`
- `fractions.html:2993-3002`

What the code does:

- `Next` is always available.
- `nextRound()` simply advances `currentStep` without checking whether the child completed the task.

Why this is a problem:

- The app claims to use authored progression.
- But progression is optional in practice because the child can bypass any difficult step immediately.

Why this matters educationally:

- This weakens the value of the authored sequence.
- It makes progress tracking closer to “slides viewed” than “concepts completed.”

Required fix:

- Either:
  - disable `Next` until success in authored mode, or
  - clearly relabel it as `Skip` and treat it separately from normal progress.

### 12. Medium: The promised conceptual animation system is effectively unused

Relevant code:

- `fractions.html:1535-1556`
- `fractions.html:2981-2990`

What the code does:

- The file defines an animation helper.
- In practice, the only visible animation is a short success pulse.

Why this is a problem:

- The redesign specifically needed conceptual motion:
  - repartitioning,
  - alignment reveal,
  - correction confirmation,
  - placement snap.
- Most boards still swap states abruptly.

Why this matters educationally:

- Fractions benefit from seeing amount preserved through transformation.
- Static state swaps reduce the “same value, new name” insight.

Required fix:

- Use the animation engine for actual math transformations, not just success polish.

### 13. Low: Several visible UI elements are empty, inconsistent, or out of sync with the current product

Relevant code:

- `fractions.html:657`
- `fractions.html:837-838`
- `fractions.html:852`
- `fractions.html:2539-2573`

Specific issues:

- The subtitle still says `Build, compare, and place fractions and decimals.` even though the app also has `Match` and `Repair`.
- The bottom status bar exists in the DOM but is never updated.
- The `BAR` and `NUMBER LINE` labels in `Repair` are hard-coded English strings.

Why this matters:

- These are not mathematical defects, but they make the interface feel unfinished.
- Dead or stale UI reduces trust in the more important teaching surfaces.

### 14. Low: Compare reveal uses inconsistent color mapping between cards and representations

Relevant code:

- `fractions.html:1994-2012`
- `fractions.html:2048-2086`

What the code does:

- In choose phase, both compare cards are neutral gray.
- In reveal phase, both cards turn the same compare-blue.
- But the revealed bars and number-line dots use teal for one value and amber for the other.

Why this is a problem:

- The child loses a stable visual mapping between:
  - left card,
  - right card,
  - bar A,
  - bar B,
  - dot A,
  - dot B.

Required fix:

- Keep left/right representation colors consistent through the whole compare interaction.

## Open Questions / Assumptions

1. I could not visually inspect the rendered page in a live browser in this session.
   Even so, Finding 1 is not guesswork. The off-canvas geometry follows directly from the current board dimensions.

2. I am assuming the intended product still wants decimal understanding to be built visually, not only symbolically.
   If that assumption changes, Finding 9 becomes less severe. With the current stated goals, it remains valid.

## Change Summary

The file is directionally better than the previous implementation, but it still has:

- one severe board-layout bug,
- two severe mode-logic bugs,
- one severe progression bug,
- and several educational/display regressions where the authored design intent is not actually expressed on screen.

The next pass should fix the hard logic and geometry failures first:

1. `Build` / `Explore` width logic
2. `Match` triple-representation completion logic
3. `Repair` true fix phase
4. `loadRandomStep()` recursion bug for non-build / non-compare modes

After that, the main product quality gains will come from:

5. truthful decimal displays in compare tasks
6. mode-aware panel readouts
7. surfacing step-specific teaching text
8. adding stronger decimal visuals and close-placement zoom support
