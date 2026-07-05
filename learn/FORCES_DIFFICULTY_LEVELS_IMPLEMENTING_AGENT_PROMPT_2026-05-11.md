# Forces: Difficulty Levels Implementing Agent Prompt

Copy-paste the prompt below to the implementing agent.

---

You are revising an existing app, not designing a new one from scratch.

Target file:

- [forces.html](/Users/llepecki/Projects/llepecki.github.io/learn/forces.html)

You must follow these documents:

1. Primary action document:
- [FORCES_GAME_MASTER_HANDOFF_2026-05-11.md](/Users/llepecki/Projects/llepecki.github.io/learn/FORCES_GAME_MASTER_HANDOFF_2026-05-11.md)

2. Existing implementation:
- [forces.html](/Users/llepecki/Projects/llepecki.github.io/learn/forces.html)

3. Structural/style references:
- [momentum.html](/Users/llepecki/Projects/llepecki.github.io/learn/momentum.html)
- [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html)
- [angularmomentum.html](/Users/llepecki/Projects/llepecki.github.io/learn/angularmomentum.html)
- [flipandburn.html](/Users/llepecki/Projects/llepecki.github.io/learn/flipandburn.html)
- [STYLE.md](/Users/llepecki/Projects/llepecki.github.io/learn/STYLE.md)
- [package.json](/Users/llepecki/Projects/llepecki.github.io/learn/package.json)

Priority rule:

- The master handoff remains canonical for science, pedagogy, board model, scoring semantics, result labels, localization, accessibility, and visual direction.
- This prompt overrides only the earlier handoff’s `Level 1 / 2 / 3` progression and fixed `Close / Far` thresholds.

Your job:

- inspect the current `forces.html`
- replace the current `3-level, fixed-threshold` difficulty model with a `6-level, config-driven` difficulty model
- keep the same scientific model and the same core interaction
- verify the result concretely

## Product Intent

The first version of `forces.html` is already viable.

Do not redesign the whole app.

This task is a focused progression redesign:

- difficulty must now be a function of:
  - `number of vectors`
  - `close-hit tolerance`
  - `far-hit tolerance`

Do not introduce new difficulty levers such as:

- hiding labels
- changing the angle grid
- changing force magnitude ranges
- changing the ring size
- changing the perfect-hit threshold
- changing the physics model

## Clarification About The Third Visible Zone

The current board shows three nested visible zones:

- `Perfect hit` zone
- `Close hit` zone
- `Far hit` zone

Anything outside them is `Miss`.

This third visible zone is not a physics requirement.

It exists only because the scoring model still has four outcomes:

- `Perfect hit`
- `Close hit`
- `Far hit`
- `Miss`

That means the outer visible zone is a `UI / scoring` requirement, not a scientific one.

For this task:

- keep the third visible zone because `Far hit` remains a required result category
- do not reinterpret the third zone as a separate scientific concept
- do not remove the third zone unless the scoring model itself is intentionally changed

Out-of-scope note:

- if the product ever collapses scoring to `Perfect / Close / Miss`, then the third visible zone can disappear
- that simplification is not part of this task

## Non-Negotiable Requirements

1. Keep the app game-only.
2. Keep the existing point-mass / puck-from-rest / no-torque model intact.
3. Keep result labels exactly:
   - `Perfect hit`
   - `Close hit`
   - `Far hit`
   - `Miss`
4. Keep `Perfect hit` fixed at `delta <= 4°` across all levels.
5. Replace the current `3` levels with exactly `6` levels.
6. The six levels must be the only child-facing difficulty progression.
7. Difficulty must be driven only by:
   - vector count
   - close tolerance
   - far tolerance
8. The tolerance wedges on the board must visibly shrink as levels increase.
9. Scoring, wedge drawing, result overlay, live-region announcements, and readouts must all use the same per-level tolerance source of truth.
10. English and Polish must both remain correct after the change.

## Exact Difficulty Table

Implement exactly this progression:

| Level | Vector count | Perfect outer bound | Close outer bound | Far outer bound |
| --- | --- | --- | --- | --- |
| 1 | 2 | 4° | 12° | 18° |
| 2 | 2 | 4° | 10° | 16° |
| 3 | 3 | 4° | 9° | 14° |
| 4 | 3 | 4° | 8° | 12° |
| 5 | 4 | 4° | 7° | 10° |
| 6 | 4 | 4° | 6° | 8° |

Interpretation is strict:

- `Perfect hit`: `delta <= 4°`
- `Close hit`: `4° < delta <= closeDeg`
- `Far hit`: `closeDeg < delta <= farDeg`
- `Miss`: `delta > farDeg`

Do not reinterpret `closeDeg` or `farDeg` as band widths.

They are outer angular bounds from the true resultant direction.

## Why This Exact 6-Level Structure Must Be Used

Use `6` levels, not `5`.

Reason:

- the app only has `3` meaningful vector-count states: `2`, `3`, `4`
- `6` levels gives exactly `2` tolerance tiers per vector-count state
- that creates a smooth progression without inventing new mechanics

The required mapping is:

- Levels `1-2`: `2` vectors
- Levels `3-4`: `3` vectors
- Levels `5-6`: `4` vectors

## Scope Boundaries

You are allowed to change:

- level-button count and layout
- difficulty configuration data structures
- score classification logic
- wedge drawing logic
- round-generation routing so it uses vector count rather than hard-coded level numbers
- localization strings and aria labels required by the new levels
- authored fallback indexing if needed

You are not allowed to change:

- the ring-based prediction mechanic
- the scientific explanation
- the reveal sequence
- result overlay structure
- force-generation physics rules for each vector-count family
- the general light-theme visual language

## Required Design Decisions

Implement all of the following.

### 1. Replace Hard-Coded Threshold Constants

The current global constants:

- `CLOSE_DEG`
- `FAR_DEG`

must stop being global fixed values.

Required shape:

- introduce a single difficulty config object or array keyed by level
- each entry must contain at least:
  - `level`
  - `vectorCount`
  - `closeDeg`
  - `farDeg`

You may keep `PERFECT_DEG = 4` as a global constant.

### 2. Make Vector Count Derived From Difficulty Config

The current `VECTOR_COUNT_BY_LEVEL` style mapping should be replaced or subsumed by the new difficulty config.

The app should derive:

- current vector count
- current close tolerance
- current far tolerance

from one current-level config entry.

### 3. Keep Round Shape Rules By Vector Family

Do not invent six different force-generation families.

Instead:

- `2-vector` rounds should continue to use the existing `Level 1` style generation rules
- `3-vector` rounds should continue to use the existing `Level 2` style generation rules
- `4-vector` rounds should continue to use the existing `Level 3` style generation rules

Refactor the code so generation rules are tied to `vectorCount`, not to the old literal level numbers.

### 4. Update Authored Fallback Handling

The current authored fallback bank may remain conceptually split by vector family.

That means it is acceptable, and preferred, to treat the fallback bank as:

- `2`
- `3`
- `4`

rather than:

- `1`
- `2`
- `3`

If you keep the current bank structure internally, it must still behave correctly for all six levels.

### 5. Expand The Level UI To Six Buttons

The level area must now show six selectable levels:

- `1`
- `2`
- `3`
- `4`
- `5`
- `6`

UI requirements:

- do not replace the level buttons with a dropdown
- do not paginate the levels
- do not hide higher levels in an overflow menu
- keep the panel compact and readable

Preferred layout:

- desktop: one row of six compact buttons if it fits cleanly
- fallback acceptable: a `3 x 2` grid if that reads better in the existing panel width
- mobile: allow wrapping or explicit `3 x 2` grid

The important rule is:

- all six levels must be directly visible and directly tappable

### 6. Keep Child-Facing Label As `Level`

Do not rename the child-facing section to `Difficulty`.

Keep:

- section label: `Level`
- readout label: `Level`

The extra complexity should remain implicit in the wedge size and number of forces.

### 7. Keep The Mission And Core Copy Stable

Do not rewrite the mission or the science copy beyond what is necessary for new aria labels or tiny UI adjustments.

This task is not a copy rewrite.

### 8. Make Wedges Match The Active Level

The three nested revealed wedges must use:

- `PERFECT_DEG`
- `currentLevel.closeDeg`
- `currentLevel.farDeg`

This is not optional.

The visual hit zones must directly communicate the current difficulty.

Remember:

- the outermost visible wedge exists only to visualize the `Far hit` band
- if `Far hit` is still present, that wedge must stay present

### 9. Keep Scoring Semantics Stable

Do not collapse results.

All four result states must remain available at all six levels.

Even at Level 6:

- there must still be a real `Far hit` band
- there must still be a real `Close hit` band

### 10. Keep Readouts Accurate

At minimum, the panel readouts must continue to show correct:

- current level
- current force count
- round number
- last result

`Forces` must update from the new per-level config.

You do not need to add a visible tolerance readout unless it becomes necessary for clarity.

Default preference:

- do not add tolerance numbers to the child-facing panel

## Required Code Structure

You do not have to use these exact names, but the final shape should be equivalent.

Preferred configuration structure:

```js
const PERFECT_DEG = 4;

const DIFFICULTY_LEVELS = {
  1: { level: 1, vectorCount: 2, closeDeg: 12, farDeg: 18 },
  2: { level: 2, vectorCount: 2, closeDeg: 10, farDeg: 16 },
  3: { level: 3, vectorCount: 3, closeDeg: 9, farDeg: 14 },
  4: { level: 4, vectorCount: 3, closeDeg: 8, farDeg: 12 },
  5: { level: 5, vectorCount: 4, closeDeg: 7, farDeg: 10 },
  6: { level: 6, vectorCount: 4, closeDeg: 6, farDeg: 8 },
};
```

Preferred helper style:

```js
function getDifficulty(level) {
  return DIFFICULTY_LEVELS[level];
}
```

From there, all of the following should be derived:

- vector count
- round-generation validator choice
- authored fallback family
- close-hit threshold
- far-hit threshold
- wedge half-angles
- aria copy if needed

## Required Localization Changes

Update all level-related accessibility strings for six levels.

At minimum, add localized aria labels equivalent to:

- `Level 1, two forces`
- `Level 2, two forces, tighter hit zone`
- `Level 3, three forces`
- `Level 4, three forces, tighter hit zone`
- `Level 5, four forces`
- `Level 6, four forces, tightest hit zone`

You may refine the English and Polish wording slightly, but the intent must stay clear.

Do not leave stale `ariaLevel1..3` logic behind.

## Required Workflow

Before editing files, do this in order:

1. Read [FORCES_GAME_MASTER_HANDOFF_2026-05-11.md](/Users/llepecki/Projects/llepecki.github.io/learn/FORCES_GAME_MASTER_HANDOFF_2026-05-11.md) to confirm the unchanged constraints.
2. Inspect the current `forces.html` level UI, constants, round generation, wedge drawing, scoring, translations, and event wiring.
3. Inspect `package.json` to confirm verification commands.
4. Inspect git status so you do not overwrite unrelated changes.

Then write a concise implementation plan that includes:

1. the new level config structure
2. how old `1/2/3` generation logic will be remapped to `2/3/4` vector families
3. how the six-button level UI will fit in the existing panel
4. which functions will stop reading fixed threshold constants
5. how EN/PL aria strings will be extended
6. what verification you will run

Do not stop after the plan unless you hit a real contradiction.

## Implementation Order

Implement in this order:

1. Difficulty config and state derivation
   - add the six-level config
   - derive current vector count and thresholds from config

2. Round generation refactor
   - route validators and fallback banks by vector count
   - preserve the current generation rules per vector family

3. Scoring and wedge refactor
   - replace fixed close/far thresholds everywhere
   - ensure wedges and classification read from the active level config

4. UI expansion
   - expand level buttons from `3` to `6`
   - update styles so the layout remains clean

5. Localization and aria
   - update strings and button labels
   - update any live-region or overlay text paths affected by the new config

6. Verification
   - run code review
   - manually verify all level mappings and threshold boundaries

## Exact Verification Requirements

Before finishing, verify all of the following.

### A. Level Mapping Verification

1. Level `1` generates `2` forces and uses `close <= 12`, `far <= 18`.
2. Level `2` generates `2` forces and uses `close <= 10`, `far <= 16`.
3. Level `3` generates `3` forces and uses `close <= 9`, `far <= 14`.
4. Level `4` generates `3` forces and uses `close <= 8`, `far <= 12`.
5. Level `5` generates `4` forces and uses `close <= 7`, `far <= 10`.
6. Level `6` generates `4` forces and uses `close <= 6`, `far <= 8`.

### B. Classification Boundary Verification

For every level:

1. `delta = 4°` must classify as `Perfect hit`.
2. `delta = closeDeg` must classify as `Close hit`.
3. `delta = closeDeg + 1°` must classify as `Far hit`.
4. `delta = farDeg` must classify as `Far hit`.
5. `delta = farDeg + 1°` must classify as `Miss`.

### C. Wedge Verification

At each level:

1. The green perfect wedge stays the same width.
2. The blue close wedge matches the current `closeDeg`.
3. The amber far wedge matches the current `farDeg`.
4. Wedges shrink monotonically from Level `1` to Level `6`.

### D. UI Verification

1. All six level buttons are directly visible.
2. The level area remains readable at desktop width.
3. The level area remains readable at narrow mobile width.
4. The current active level is clearly highlighted.
5. `Forces` readout matches the selected level.

### E. Localization Verification

1. EN pass.
2. PL pass.
3. New level aria labels are present for all six buttons.

### F. Final Tool Verification

Run:

`npm run code-review -- forces.html`

If that reports issues, fix them and rerun it.

## Progress Reporting Format

For each major milestone, report:

1. milestone name
2. files changed
3. what is complete
4. what remains
5. what verification you actually ran
6. any remaining risks

## Final Response Requirements

Your final response must include:

1. concise summary of the difficulty progression redesign
2. changed file list
3. verification actually run
4. whether `npm run code-review -- forces.html` passed
5. any remaining limitations

Stop only if:

- the current `forces.html` structure conflicts with the required six-level progression in a way that cannot be resolved cleanly
- there are unexpected conflicting edits in the same level/scoring areas
- a required change would force a broader product decision outside this prompt

Otherwise, proceed through plan and implementation without waiting.
