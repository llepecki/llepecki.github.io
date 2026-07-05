# Fraction Playground vNext: Implementation Order And Milestones

## 0. Purpose

This document translates [FRACTIONS_VNEXT_PLAN_2026-05-06.md](/Users/llepecki/Projects/llepecki.github.io/learn/FRACTIONS_VNEXT_PLAN_2026-05-06.md) into a stricter delivery plan.

It is meant for the implementing agent.

The goal is not to describe the product again. The goal is to define:

- what to build first
- what depends on what
- what must be finished before moving on
- what counts as “done” for each milestone
- what kinds of fake progress are not acceptable

This plan assumes the implementation stays in [`fractions.html`](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html), but the same order still applies if the code is internally refactored.

## 1. Delivery Strategy

The implementation should follow four rules:

1. Keep the app working after every milestone.
2. Build complete vertical slices, not disconnected scaffolding.
3. Finish the level system before building the new calculations family.
4. Do not spend time on polish while the main mathematical interactions are still incomplete.

The biggest risk is building a lot of UI shell and ending up with operation modes that still behave like decorated answer-entry tasks. This plan is designed to prevent that.

## 2. Non-Negotiable Build Principles

1. `Levels 1-5` must become real global progression, not a label swap.
2. `Represent` and `Calculate` must become real top-level families, not hidden sub-states.
3. `Add`, `Subtract`, `Multiply`, and `Divide` must each have their own success logic and board logic.
4. The calculations family must be model-first:
   - strips
   - number lines
   - area models
   - sharing / measurement models
5. `Level 5` must be clearly harder than the current top level before the project is considered complete.
6. Authored sequences come before free play.
7. Mobile layout must be reflowed, not only scaled down.

## 3. Suggested Total Milestone Order

Build in this order:

1. Milestone 0: Baseline, architecture prep, and safety rails
2. Milestone 1: New navigation and `Level 1-5` system
3. Milestone 2: Re-map the existing `Represent` family to the new level system
4. Milestone 3: Shared calculation primitives and sequence engine expansion
5. Milestone 4: `Add` vertical slice
6. Milestone 5: `Subtract` vertical slice
7. Milestone 6: `Multiply` vertical slice
8. Milestone 7: `Divide` vertical slice
9. Milestone 8: Cross-mode balancing, free play, and progression integrity
10. Milestone 9: Mobile, localization, accessibility, and final polish

Do not reorder this.

The main reason:

- Milestones 1-3 create the structural platform.
- Milestones 4-7 build the new value.
- Milestones 8-9 prevent the common failure mode where the app “basically works” but does not hold up as a real product.

## 4. Milestone 0: Baseline, Architecture Prep, And Safety Rails

### Goal

Prepare the current app for expansion without breaking the working baseline.

### Tasks

1. Audit the current state shape and identify which parts are:
   - represent-specific
   - reusable
   - obsolete

2. Introduce or clean up these top-level state sections:

- `app`
- `navigation`
- `level`
- `represent`
- `calculate`
- `sequence`
- `progress`
- `ui`

3. Define the new global navigation model in code, even if the UI does not expose it yet:

- `family: "represent" | "calculate"`
- `mode`
- `level: 1..5`

4. Define the new sequence schema:

- `goal`
- `concept`
- `boardType`
- `predictionPrompt`
- `hint1`
- `hint2`
- `feedbackSuccess`
- `feedbackError`
- `benchmarkFocus`
- `symbolReveal`

5. Preserve all stable math helpers and localization plumbing unless there is a good reason to replace them.

### Do Not Do

- Do not start drawing new operation boards.
- Do not redesign the header yet.
- Do not rewrite everything blindly if the existing helpers are serviceable.

### Exit Criteria

This milestone is done only when:

1. The code has a clear place to store `family`, `mode`, and `level`.
2. The sequence engine can represent both current and future modes.
3. No existing mode is broken by the refactor.

### Hard Rejection

Reject this milestone if:

- the agent claims “prep work” but the state model is still implicitly tied to the old three-difficulty system
- the new navigation concepts exist only in comments or TODOs

## 5. Milestone 1: New Navigation And `Level 1-5`

### Goal

Replace the old difficulty structure in the UI and state model.

### Tasks

1. Replace the difficulty row:

- remove `Introduction`
- remove `Intermediate`
- remove `Advanced`
- add `Level 1`
- add `Level 2`
- add `Level 3`
- add `Level 4`
- add `Level 5`

2. Add the new family switch:

- `Represent`
- `Calculate`

3. Wire navigation state so that:

- changing family preserves level
- changing level updates the active mode content
- returning to a family preserves its last active mode

4. Update EN/PL strings for:

- family names
- level names
- panel summaries
- aria labels

5. Add a visible product summary that makes sense under the new IA.

### Exit Criteria

This milestone is done only when:

1. The user can intentionally enter `Represent` or `Calculate`.
2. The user can choose `Level 1` through `Level 5`.
3. The app stores and restores those selections consistently.
4. Localization is complete for the new controls.

### Hard Rejection

Reject this milestone if:

- `Level 4` and `Level 5` are visible but internally mapped to the old `Advanced`
- `Calculate` exists in the UI but has no real route or state branch

## 6. Milestone 2: Re-Map The Existing `Represent` Family

### Goal

Make the current `Represent` family coherent under the new five-level progression before adding new calculation modes.

### Tasks

1. Rebuild authored sequences for:

- `Build`
- `Compare`
- `Match`
- `Place`
- `Repair`

across:

- `Level 1`
- `Level 2`
- `Level 3`
- `Level 4`
- `Level 5`

2. Re-define the content boundaries:

- denominators
- decimals
- mixed numbers
- benchmark use
- zoom requirements

3. Ensure `Level 5` representational content is actually harder than the old top level:

- tighter comparisons
- mixed-number placement
- unlike-denominator reasoning
- subtler repair cases
- estimate-first tasks

4. Keep the modes distinct. Do not let them collapse back into one mission engine.

### Recommended Order Inside This Milestone

1. `Compare`
2. `Place`
3. `Repair`
4. `Match`
5. `Build`

Reason:

- `Compare`, `Place`, and `Repair` expose progression quality fastest.
- `Build` is still the most likely place for the agent to hide generic behavior, so it should be fixed last after the progression model is clearer.

### Exit Criteria

This milestone is done only when:

1. Every represent mode has authored sequences for all five levels.
2. `Level 5` represent content is visibly harder than the current highest level.
3. No represent mode is relying on the old three-tier assumptions.

### Hard Rejection

Reject this milestone if:

- the agent maps the old `Intro/Intermediate/Advanced` sets into `1/2`, `3/4`, `5`
- the fifth level is only “bigger denominators”

## 7. Milestone 3: Shared Calculation Primitives And Sequence Engine Expansion

### Goal

Build the reusable primitives that all four operation modes need.

### Tasks

1. Add shared board primitives:

- `renderStripEquation`
- `renderJoinStrip`
- `renderJumpLine`
- `renderGapLine`
- `renderAreaGrid`
- `renderAreaOverlap`
- `renderShareTray`
- `renderPackTrack`
- `renderPredictionPrompt`

2. Add shared interaction helpers:

- snapping to fractional partitions
- selecting a target part
- dragging strips or tokens
- repeated placement
- controlled removal
- group counting

3. Add shared math/formatting helpers for:

- mixed-number display
- converting to common units for authored visuals
- decimal formatting by locale
- friendly benchmark labels

4. Add shared animations:

- join
- split
- pack
- scale
- overlap reveal
- share redistribution

5. Extend the sequence engine so it supports operation-specific step types cleanly.

### Do Not Do

- Do not claim `Add` is started if only the board primitives exist.
- Do not mix operation logic into the shared primitives.

### Exit Criteria

This milestone is done only when:

1. The reusable views exist and can be called independently.
2. There is enough infrastructure to implement `Add` without inventing a new mini-framework mid-milestone.
3. The primitives are visually coherent with the existing app language.

### Hard Rejection

Reject this milestone if:

- “shared primitives” are just old represent renderers renamed
- the calculation boards still need one-off hacks for basic interaction

## 8. Milestone 4: `Add` Vertical Slice

### Goal

Ship a complete `Add` mode across all five levels.

### Required Views

- `Join Strips`
- `Jump Line`
- `Make One / Make Two`

### Required Activities

- direct addition
- missing addend
- target sum
- benchmark completion

### Required Level Coverage

- Level 1: same denominators within one whole
- Level 2: same denominators and tenths beyond one whole
- Level 3: denominators that are multiples of each other
- Level 4: unlike friendly denominators and simple mixed numbers
- Level 5: mixed numbers, estimation, and strategy choice

### Required Educational Behaviors

1. Unlike-denominator addition must visibly convert to common units.
2. Results past `1` must be shown visually, not only textually.
3. `Level 5` must include at least one estimate-first round.

### Exit Criteria

This milestone is done only when:

1. `Add` is a real selectable top-level calculation mode.
2. The child can complete an authored sequence in all five levels.
3. The board shows why the answer is true, not only what the answer is.

### Hard Rejection

Reject this milestone if:

- `Add` is mainly a symbolic equation with a decorative strip underneath
- unlike denominators are solved with text hints instead of visible common-unit conversion

## 9. Milestone 5: `Subtract` Vertical Slice

### Goal

Ship a complete `Subtract` mode across all five levels.

### Required Views

- `Take Away Strip`
- `Gap Finder`
- `Repair The Difference`

### Required Activities

- remove a part
- find what is left
- find the gap between two values
- correct a wrong subtraction

### Required Level Coverage

- Level 1: same-denominator subtraction within one whole
- Level 2: subtract from one whole and tenths
- Level 3: related denominators and controlled mixed-number work
- Level 4: unlike friendly denominators
- Level 5: mixed numbers, close gaps, estimate then solve

### Required Educational Behaviors

1. The app must distinguish “removed amount” from “remaining amount.”
2. Gap-based subtraction must be visually different from take-away subtraction.
3. `Level 5` should include at least one near-benchmark comparison such as values around `1`.

### Exit Criteria

This milestone is done only when:

1. `Subtract` feels different from `Add` before reading text.
2. Both take-away and gap interpretations are present.
3. Mixed-number subtraction is visually honest where included.

### Hard Rejection

Reject this milestone if:

- subtraction is just addition with a minus sign and the same board
- all rounds still reduce to “enter the target value”

## 10. Milestone 6: `Multiply` Vertical Slice

### Goal

Ship a complete `Multiply` mode across all five levels.

### Required Views

- `Fraction Of`
- `Repeat The Piece`
- `Scale Machine`
- simple `Area Quilt`

### Required Activities

- find a fraction of a whole or quantity
- repeat a fraction several times
- predict smaller or larger before applying a factor
- overlap two simple fractions

### Required Level Coverage

- Level 1: intuitive halves/quarters of a whole or set
- Level 2: whole number × unit fraction
- Level 3: whole number × non-unit fraction and scaling
- Level 4: simple proper fraction × proper fraction using area
- Level 5: clearly harder fraction multiplication with estimate-first tasks

### Required Educational Behaviors

1. The board must show that multiplying by a proper fraction can shrink a value.
2. Repeated addition and scaling must both appear.
3. Area overlap must be limited to visually clean cases.

### Exit Criteria

This milestone is done only when:

1. `Multiply` has more than one meaning represented in play.
2. `Scale Machine` makes “smaller or larger?” conceptually obvious.
3. `Level 5` is visibly beyond the current app’s ceiling.

### Hard Rejection

Reject this milestone if:

- multiplication is taught only as `numerators times numerators / denominators times denominators`
- there is no visible size transformation

## 11. Milestone 7: `Divide` Vertical Slice

### Goal

Ship a complete `Divide` mode across all five levels.

### Required Views

- `Share Fairly`
- `How Many Fit`
- quotient interpretation cards

### Required Activities

- equal sharing
- pack repeated unit fractions
- connect division notation and fraction notation
- repair wrong quotient logic

### Required Level Coverage

- Level 1: share wholes into equal parts
- Level 2: share simple fractions
- Level 3: whole number divided by unit fraction in concrete settings
- Level 4: proper fraction divided by whole number and quotient interpretation
- Level 5: friendly measurement-division stretch cases, kept fully visual

### Required Educational Behaviors

1. Sharing and measuring must both appear.
2. The mode must avoid shortcut-first teaching.
3. Fraction-as-quotient understanding must be made explicit.

### Exit Criteria

This milestone is done only when:

1. `Divide` is conceptually clear for upper-primary children.
2. The child can see the difference between:
   - how many groups
   - size of each group
3. `Level 5` is harder, but still honest and age-appropriate.

### Hard Rejection

Reject this milestone if:

- the mode leans on “invert and multiply”
- division is mostly text explanation rather than sharing/packing interaction

## 12. Milestone 8: Cross-Mode Balancing, Free Play, And Progression Integrity

### Goal

Make the full app consistent and prevent the common “great scripted demo, weak real product” problem.

### Tasks

1. Add free-play generators for all new calculation modes.
2. Ensure free play respects level-specific pedagogy.
3. Make hints mode-specific and level-specific.
4. Tune pacing so higher levels are harder because of reasoning, not only speed.
5. Check that the panel never leaks answers or shows nonsense state.
6. Check that every mode-family-level combination has coherent summaries.

### Required Audit

Review every combination of:

- family
- mode
- level

for:

- mathematical correctness
- progression coherence
- display correctness
- localization
- feedback quality

### Exit Criteria

This milestone is done only when:

1. Free play does not collapse advanced content back into simpler generic tasks.
2. `Level 5` remains meaningfully advanced after authored sequences end.
3. Hints and feedback are mode-aware.

### Hard Rejection

Reject this milestone if:

- free play downgrades `Level 5` to mostly Level 2-3 content
- the app is only strong during the first few scripted rounds

## 13. Milestone 9: Mobile, Localization, Accessibility, And Final Polish

### Goal

Make the product hold up as a real release rather than a desktop prototype.

### Tasks

1. Reflow small-screen layouts for:

- represent boards
- add boards
- subtract boards
- multiply boards
- divide boards

2. Check touch target size, label readability, and card density at `375px`.
3. Complete EN/PL localization for:

- navigation
- level summaries
- authored sequences
- hints
- feedback
- aria labels
- metadata

4. Ensure reduced-motion behavior preserves the math.
5. Make sure color is not the only correctness signal.
6. Tighten the visual design so the new calculation family feels intentional, not bolted on.

### Exit Criteria

This milestone is done only when:

1. Mobile is reflowed, not only scaled.
2. Polish applies to both families, not only the new one.
3. The app feels like one product with a broader scope, not two stitched-together mini-apps.

### Hard Rejection

Reject this milestone if:

- mobile still looks like desktop SVG shrunk to fit
- some new calculation states remain untranslated or partially translated

## 14. Verification Gate By Milestone

The implementing agent should not self-certify with vague statements. It should verify concrete outcomes after each milestone.

### After Milestone 1

- switch between `Represent` and `Calculate`
- switch between `Level 1` to `Level 5`
- confirm state persists correctly

### After Milestone 2

- complete one authored round in every represent mode at `Level 1` and `Level 5`
- confirm `Level 5` is visibly harder

### After Milestone 3

- render each shared calculation primitive in isolation
- confirm locale-safe decimal rendering still works

### After Milestone 4

- complete `Add` at every level
- test at least one unlike-denominator round visually

### After Milestone 5

- complete `Subtract` at every level
- test both take-away and gap interpretation

### After Milestone 6

- complete `Multiply` at every level
- test repeated addition, scaling, and area overlap

### After Milestone 7

- complete `Divide` at every level
- test both sharing and measurement

### After Milestone 8

- exhaust authored sequences and confirm free play stays level-appropriate

### After Milestone 9

- test desktop and `375px`
- test EN/PL
- test reduced motion
- test keyboard interaction for at least one mode in each family

## 15. Recommended Agent Workflow

The implementing agent should work like this:

1. Finish Milestone 0 and 1 before touching calculations.
2. Finish Milestone 2 before claiming the new level system is done.
3. Build one operation mode completely before starting the next.
4. Keep `Add` and `Subtract` ahead of `Multiply` and `Divide`.
5. Leave free-play balancing until the authored calculation slices are complete.
6. Leave visual polish until the math interaction contracts are stable.

This is the correct order because:

- addition and subtraction reuse the existing fraction foundations most directly
- multiplication and division are more likely to go wrong pedagogically
- free-play generation is easy to fake and should not be trusted until the scripted core is strong

## 16. What To Ask From The Implementing Agent At Each Handoff

When the agent reports progress, require:

1. The exact milestone number.
2. Which files changed.
3. Which modes and levels are fully working.
4. What is still intentionally incomplete.
5. What verification was actually run.

Do not accept:

- “the structure is in place”
- “most of it is done”
- “the rest is just polish”

unless the exit criteria for that milestone are already satisfied.

## 17. Final Acceptance Standard

The project is only ready for a serious review when all of the following are true:

1. `Represent` and `Calculate` both exist as real families.
2. `Level 1-5` are real across the entire app.
3. `Level 5` is clearly harder than the current top level.
4. `Add`, `Subtract`, `Multiply`, and `Divide` all teach through interaction, not only notation.
5. Free play does not degrade the progression.
6. Mobile, localization, and accessibility are complete enough to review as product work rather than prototype work.

Until then, the agent should be treated as still in implementation, not in polish.
