# Fraction Playground vNext: Levels 1-5 And Calculations Redesign

## 0. Handoff Goal

This document replaces the current difficulty model and expands the product scope.

The next implementation must do two things:

1. Replace the current `Introduction / Intermediate / Advanced` structure with `Level 1` through `Level 5`.
2. Add a substantial new `Calculations` area for fraction addition, subtraction, multiplication, and division.

This is a design-and-pedagogy handoff, not a partial idea dump. The implementing agent should be able to use it as the primary vNext brief.

The target audience remains children up to age 11. `Level 5` must be clearly harder than the current highest level, but it must still feel like upper-primary mathematics, not early secondary symbolic drill.

## 1. Executive Direction

The app should stop being only about recognizing and comparing fractions. It should become a broader fraction playground with two major families of play:

- `Represent`
- `Calculate`

`Represent` keeps the existing conceptual territory: build, compare, match, place, repair.

`Calculate` is new: add, subtract, multiply, divide.

The key product change is not “more questions.” It is a wider set of mathematical verbs with a stronger progression model.

The new difficulty system should work across both families:

- `Level 1`
- `Level 2`
- `Level 3`
- `Level 4`
- `Level 5`

Each level must change the mathematical demand, not just the size of the numbers.

## 2. Non-Negotiable Product Goals

1. `Level 1` should feel close to the current easiest setting: concrete, visible, calm, and confidence-building.
2. `Level 5` must be materially harder than the current highest setting.
3. The new operations area must teach concepts through manipulation first and notation second.
4. The board must carry the explanation. The panel may support, but must not become the main teacher.
5. All operation modes must preserve the `same whole` rule whenever visual comparison is involved.
6. Fractions and decimals must stay connected where the math is developmentally appropriate, especially tenths and hundredths.
7. The app must avoid becoming a worksheet engine. Each operation needs at least two distinct activity patterns, not one generic answer-entry loop.
8. Advanced content must remain age-appropriate:
   - no formal algebra framing
   - no general symbolic `invert and multiply` teaching as the primary path
   - no dense text-heavy word problems as the main interaction

## 3. Research Synthesis

### 3.1 What The External Sources Point Toward

The sources converge on a few strong design principles:

1. Visual fraction models matter most when they preserve a stable whole.
   Math Learning Center emphasizes bars and circles that can be filled, compared, and superimposed, which is exactly why its fraction app works well for elementary learners.

2. Number lines are essential, not optional.
   Illustrative Mathematics repeatedly frames equivalent fractions and decimal comparison through the idea that equal values land on the same point or the same distance from zero.

3. Addition and subtraction should be taught through common units and visible composition/decomposition.
   NCETM’s fraction progression explicitly treats common denominators as the key bridge for adding and subtracting more complex fractions.

4. Multiplication should begin as repeated addition, “fraction of,” and scaling before it becomes a rule.
   NCETM and Illustrative Mathematics both ground multiplication in repeated addition, area, and scaling.

5. Division should be interpreted, not memorized.
   Illustrative Mathematics stresses that fractions can be understood as division and that division situations should be interpreted as equal sharing or quotient relationships. For this age, that is stronger than pushing a symbolic shortcut.

6. Upper-primary challenge is not just harder arithmetic.
   The curriculum guidance points toward mixed numbers, unlike denominators, simple fraction-by-fraction multiplication, proper fraction divided by whole number, decimal equivalents, estimation, and reasonableness checks.

### 3.2 Design Consequences

The app should therefore:

- show operations on bars, number lines, and area models before showing a compact rule
- ask children to predict before revealing the answer
- use benchmark reasoning such as `0`, `1/2`, `1`, and `2`
- make equivalence a tool for solving, not a disconnected mini-lesson
- treat decimals as decimal fractions, especially in tenths and hundredths
- use a mix of continuous models and discrete-sharing contexts

## 4. New Information Architecture

### 4.1 Top-Level Structure

Replace the current single family structure with:

- `Represent`
- `Calculate`

Within `Represent`, keep:

- `Build`
- `Compare`
- `Match`
- `Place`
- `Repair`

Within `Calculate`, add:

- `Add`
- `Subtract`
- `Multiply`
- `Divide`

### 4.2 Difficulty Row

The second row becomes:

- `Level 1`
- `Level 2`
- `Level 3`
- `Level 4`
- `Level 5`

This row applies globally. Changing the level should alter the current mode’s content boundaries, sequence, visuals, and hint style.

### 4.3 Explore

`Explore` should remain available, but it should now live as a utility mode that can inspect either:

- representations
- operation models

Example:

- in `Represent > Explore`, the child can build free-form bars, circles, grids, and number lines
- in `Calculate > Explore`, the child can experiment with joining strips, overlaying area regions, or slicing wholes into equal shares

## 5. Levels 1-5: Exact Pedagogical Meaning

The new level system must reflect developmental stages, not just numeric spread.

### 5.1 Level Summary

#### Level 1

Purpose:
build trust and foundational meaning

Characteristics:

- mostly proper fractions within one whole
- denominators `2, 3, 4, 5, 10`
- obvious visual contrasts
- no multi-step reasoning
- operations grounded in direct joining, taking away, fair sharing, and “fraction of” with strong visuals

#### Level 2

Purpose:
expand fluency without losing visibility

Characteristics:

- denominators `2, 3, 4, 5, 6, 8, 10`
- simple equivalence with related denominators
- tenths and friendly decimals
- first missing-value tasks
- early mixed “whole plus part” ideas in very controlled form

#### Level 3

Purpose:
connect representations, equivalence, and calculation strategies

Characteristics:

- denominators `2, 3, 4, 5, 6, 8, 10, 12`
- improper fractions and mixed numbers appear
- denominators that are multiples of each other
- decimal connections to tenths and hundredths
- operations begin using equivalent fractions as a strategy, not just a fact

#### Level 4

Purpose:
introduce genuinely harder upper-primary reasoning

Characteristics:

- unlike denominators with friendly common denominators
- mixed numbers in all major views
- compare/order across fractions and decimals near `1`
- multiplication as scaling and area
- division as sharing and measurement
- more missing-value and error-repair tasks

#### Level 5

Purpose:
be clearly harder than the current highest level while staying age-appropriate

Characteristics:

- mixed numbers and improper fractions used regularly
- unlike denominators including less-obvious common denominators
- decimals to hundredths where they support reasoning
- multi-step conceptual tasks
- estimate first, then solve
- choose-a-strategy moments
- fraction multiplication in simple pairs
- division of proper fractions by whole numbers
- optional stretch measurement division with unit fractions, only when it stays visually honest

### 5.2 Global Level Boundaries

#### Allowed denominator families

- Level 1: `2, 3, 4, 5, 10`
- Level 2: `2, 3, 4, 5, 6, 8, 10`
- Level 3: `2, 3, 4, 5, 6, 8, 10, 12`
- Level 4: `2, 3, 4, 5, 6, 8, 10, 12`
- Level 5: `2, 3, 4, 5, 6, 8, 10, 12` plus selected friendly composites where needed for authored steps

The implementing agent should not equate “harder” with denominator chaos. Hardness should come from reasoning structure as much as arithmetic.

#### Decimal scope

- Level 1: tenths only, mostly as visual decimal fractions
- Level 2: tenths and some obvious hundredths
- Level 3: hundredths in comparison and placement
- Level 4: hundredths in comparison, ordering, and friendly operations
- Level 5: hundredths in reasoning, estimation, and checking, not as isolated decimal drill

#### Mixed number scope

- Level 1: none
- Level 2: optional preview only in authored examples
- Level 3: controlled introduction
- Level 4: regular use
- Level 5: regular use plus conversion between improper and mixed form when visually supported

## 6. Represent Area Changes Under Levels 1-5

The existing representational modes stay, but their progression must be remapped.

### 6.1 Build

- Level 1: fill obvious target fractions within one whole
- Level 2: include tenths and simple benchmarks such as `1/2` and `1`
- Level 3: equivalent fractions with related denominators and first mixed numbers
- Level 4: build mixed numbers, improper fractions, and decimal fractions
- Level 5: build and transform between representations, estimate first, then verify exactly

### 6.2 Compare

- Level 1: same denominators, unit fractions, easy benchmarks
- Level 2: related denominators and tenths
- Level 3: fractions versus friendly decimals, close values, first improper values
- Level 4: unlike denominators requiring equivalent-fraction reasoning
- Level 5: close mixed-number comparisons, ordering sets, justify-before-reveal rounds

### 6.3 Match

- Level 1: fraction text to bar
- Level 2: fraction to decimal tenth
- Level 3: fraction to equivalent fraction to number-line point
- Level 4: mixed-number forms and hundredths
- Level 5: strategy-based matching, including “same value, different structure” sets

### 6.4 Place

- Level 1: obvious benchmark locations on `0..1`
- Level 2: tenths and simple related denominators
- Level 3: close values on `0..1` and `0..2`
- Level 4: mixed numbers and hundredths with zoomed windows
- Level 5: deliberately tight intervals with estimate markers and benchmark reasoning

### 6.5 Repair

- Level 1: one clear mismatch
- Level 2: denominators that can fool beginners
- Level 3: decimal-fraction mismatches
- Level 4: mixed-number and unlike-denominator mismatches
- Level 5: subtle but fair contradictions that require checking the same whole, same point, or same amount

## 7. Calculations Area: Product Concept

### 7.1 Core Promise

The new calculations area should answer:

- what does fraction addition look like?
- what does subtraction mean on a bar and on a line?
- what does multiplying by a fraction do to size?
- what does fraction division mean as sharing or measuring?

This should feel like playful sense-making, not a stripped-down worksheet tab.

### 7.2 Mode Names

Use direct math verbs for clarity:

- `Add`
- `Subtract`
- `Multiply`
- `Divide`

The playfulness should come from the board and the activity design, not from vague names.

### 7.3 Shared Design Rules Across All Four Operations

1. Every round begins with a visible situation, not only a symbolic expression.
2. The child should usually make a prediction before solving.
3. The app should reveal the compact equation after or during manipulation.
4. Hints should begin with a model-based nudge before any symbolic instruction.
5. Incorrect attempts should be informative:
   - wrong total length
   - wrong denominator / unit size
   - wrong number of groups
   - wrong overlap region
6. `Level 5` should include estimate-check-refine loops.

## 8. Add Mode

### 8.1 Educational Framing

Addition should be taught as:

- joining lengths
- combining parts of the same whole
- making a target total
- finding missing addends

### 8.2 Primary Views

#### A. Join Strips

Board:

- two or three fraction strips align left to right
- the child drags strips together to form one total strip
- a shared number line below updates live

Use for:

- same-denominator addition
- related-denominator addition
- mixed-number addition at higher levels

Why it works:

- it makes addition feel like combining lengths in common units
- it exposes why unlike denominators need conversion

#### B. Jump Line

Board:

- large number line
- one value already shown
- child adds a jump or sequence of jumps

Use for:

- counting on
- complements to 1 or 2
- decimal fractions in tenths and hundredths

Why it works:

- it turns addition into movement and benchmark reasoning

#### C. Make One / Make Two

Board:

- a target whole or wholes
- piece tray below
- child chooses pieces that exactly compose `1` or `2`

Use for:

- complements
- common denominators
- mental structure rather than procedural addition only

### 8.3 Add Activities

1. `Join The Parts`
   The child combines two visible strips into one total.

2. `Finish The Whole`
   A partial amount is shown; the child finds the missing addend.

3. `Hit The Target Sum`
   A target such as `1`, `1 1/2`, or `2` is shown; the child selects or builds addends.

4. `Choose The Better Strategy`
   At higher levels, the child chooses whether to convert, make a whole first, or use a benchmark.

### 8.4 Add Level Progression

- Level 1: same denominators within one whole
- Level 2: same denominators beyond one whole and simple tenths
- Level 3: denominators that are multiples of each other
- Level 4: unlike friendly denominators and mixed numbers
- Level 5: mixed numbers, estimate first, multiple valid strategies, reasonableness checks

### 8.5 Add Misconceptions To Surface

- adding denominators as well as numerators
- forgetting the same whole
- not noticing a result passes `1`
- treating `1/4 + 1/2` as visually balanced without common units

## 9. Subtract Mode

### 9.1 Educational Framing

Subtraction should be taught as:

- taking away
- finding the gap
- comparing lengths
- removing part from a whole or mixed amount

### 9.2 Primary Views

#### A. Take Away Strip

Board:

- a filled strip or mixed strip is shown
- the child removes the indicated part
- the remaining amount becomes the answer

Use for:

- same-denominator subtraction
- subtracting from one whole
- mixed-number subtraction in later levels

#### B. Gap Finder

Board:

- two points on a number line
- child builds the gap between them

Use for:

- comparison subtraction
- complements
- close decimal/fraction values

Why it works:

- it teaches subtraction as distance, not just “crossing out”

#### C. Repair The Difference

Board:

- an expression and a wrong visual result are shown
- child must correct the removed part or the remainder

Use for:

- misconception diagnosis
- higher-level checking

### 9.3 Subtract Activities

1. `Take Away`
   Remove the shown fraction from a whole or mixed amount.

2. `Find The Gap`
   Determine how far one value is from another.

3. `How Much Is Left?`
   Concrete remainder tasks with visual support.

4. `Fix The Subtraction`
   Spot and correct a subtraction mistake.

### 9.4 Subtract Level Progression

- Level 1: same denominators within one whole
- Level 2: subtract from one whole and from simple tenths
- Level 3: related denominators and first mixed-number remainders
- Level 4: unlike friendly denominators and gap reasoning
- Level 5: mixed numbers, compare-nearby values, estimate then solve

### 9.5 Subtract Misconceptions To Surface

- subtracting denominators
- not converting the whole before subtracting
- losing track of the unit size
- treating the answer as the removed part rather than the remainder

## 10. Multiply Mode

### 10.1 Educational Framing

For this age, multiplication with fractions should be introduced through:

- repeated addition
- “fraction of”
- scaling
- area overlap

The product must feel like a transformation of size or a selected part of a part.

### 10.2 Primary Views

#### A. Fraction Of A Whole

Board:

- a whole bar, shape, or set
- the child first partitions into the denominator
- then selects the numerator

Use for:

- `1/2 of 8`
- `3/4 of 12`
- `2/3 of a strip`

Why it works:

- it ties multiplication to quantities children already understand

#### B. Repeat The Fraction

Board:

- a unit fraction or non-unit fraction piece
- a repeat tray or lane
- child copies it `n` times

Use for:

- whole number × fraction
- repeated addition as multiplication

#### C. Scale Machine

Board:

- a strip goes into a “scale machine”
- the machine applies `1/2`, `3/2`, `2`, `3/4`, etc.
- the output strip changes length visibly

Use for:

- understanding that multiplying by a proper fraction makes a quantity smaller
- understanding that multiplying by a value greater than `1` makes it larger

#### D. Area Quilt

Board:

- rectangle shaded one way for one fraction and the other way for another
- overlap region is the product

Use for:

- simple fraction × fraction
- only at the higher levels

This must be limited to friendly, visually clean cases.

### 10.3 Multiply Activities

1. `Find A Fraction Of`
   Find a fraction of a whole, strip, or set.

2. `Repeat The Piece`
   Build repeated addition rounds that collapse into multiplication.

3. `Shrink Or Stretch`
   Predict whether the result will be smaller, equal, or larger before applying the factor.

4. `Overlap To Multiply`
   Use an area model for simple fraction-by-fraction multiplication.

### 10.4 Multiply Level Progression

- Level 1: intuitive “half of,” “quarter of,” and repeated unit fractions without heavy notation
- Level 2: whole number × unit fraction; unit fraction of a quantity
- Level 3: whole number × non-unit fraction; fraction of a quantity; scaling with obvious cases
- Level 4: proper fraction × proper fraction with simple area models; mixed “smaller or larger?” reasoning
- Level 5: simple pairs of proper fractions, mixed number by whole number in visual settings, estimate before compute

### 10.5 Multiply Misconceptions To Surface

- expecting multiplication always to make numbers bigger
- counting parts without respecting the whole
- confusing repeated addition with fraction-of
- not understanding the overlap region in area models

## 11. Divide Mode

### 11.1 Educational Framing

Division should be introduced through two meanings:

- equal sharing
- how many groups fit

For this audience, division with fractions must stay concrete and interpretable.

### 11.2 Primary Views

#### A. Share Fairly

Board:

- one or more wholes or fractional amounts
- several characters, bowls, or trays
- the child shares equally

Use for:

- fraction as quotient
- unit fraction divided by whole number
- proper fraction divided by whole number

This should feel like fair sharing, not symbol pushing.

#### B. How Many Fit?

Board:

- a target strip or container
- repeatable unit fraction scoop or segment
- child packs as many copies as fit

Use for:

- whole number divided by unit fraction
- stretch cases like `3/4 ÷ 1/4`

This is the cleanest path to measurement division.

#### C. Quotient Cards

Board:

- short visual situation on one side
- candidate quotients on the other
- child chooses the meaningfully correct quotient

Use for:

- connecting fraction notation with division notation
- interpreting `a / b` as equal shares

### 11.3 Divide Activities

1. `Share The Fraction`
   Divide a whole or fractional amount equally.

2. `How Many Scoops Fit?`
   Measure how many unit fractions fit inside a larger amount.

3. `Write The Fraction From Sharing`
   Convert a sharing situation into fraction notation.

4. `Fix The Fair Share`
   Repair an unfair or mathematically incorrect division result.

### 11.4 Divide Level Progression

- Level 1: share one whole equally into `2`, `3`, or `4` parts
- Level 2: share simple fractions and connect the result to unit fractions
- Level 3: whole number divided by unit fraction in concrete “how many fit?” settings
- Level 4: proper fraction divided by whole number; fraction as quotient; relation between multiplication and division
- Level 5: harder visual sharing and measurement cases, including friendly stretch problems such as `3/4 ÷ 1/4`, but only with very clear models

### 11.5 Divide Misconceptions To Surface

- dividing makes things “always smaller” without considering the divisor
- confusing number of groups with size of each group
- reading `a / b` as two separate numbers rather than a quotient
- assuming the answer must be a fraction in every division situation

### 11.6 Explicit Scope Guardrail

Do not make `general fraction ÷ fraction` symbolic procedures a main Level 5 target.

Allowed:

- unit fraction divided by whole number
- whole number divided by unit fraction
- proper fraction divided by whole number
- a few measurement-based friendly unit-fraction cases if they are fully visual

Not allowed as core content:

- broad symbolic `a/b ÷ c/d` drill
- “flip and multiply” as a memorization-first mechanic

## 12. New View And Activity Inventory

The app now needs a larger set of board-first views. These are the recommended named views:

- `Join Strips`
- `Jump Line`
- `Make One`
- `Take Away Strip`
- `Gap Finder`
- `Fraction Of`
- `Scale Machine`
- `Area Quilt`
- `Share Fairly`
- `How Many Fit`

These are not all separate top-level tabs. They are reusable board types inside the four operation modes.

## 13. Authored Progression Model

Randomization should only happen after authored learning sequences.

Each `mode × level` should have an authored sequence of roughly `6-10` steps.

Each step object should include:

- `goal`
- `concept`
- `boardType`
- `values`
- `predictionPrompt`
- `hint1`
- `hint2`
- `feedbackSuccess`
- `feedbackError`
- `benchmarkFocus`
- `sameWholeRule`
- `symbolReveal`

### 13.1 Example Add Sequence Arc

Level 1:

1. `1/4 + 2/4`
2. `1/5 + 3/5`
3. `2/10 + 5/10`
4. missing addend to make `1`
5. choose the pair that makes `1`
6. add visually, then reveal notation

Level 5:

1. estimate whether the sum is less than or greater than `1`
2. solve `2/3 + 1/4` by converting units
3. solve a mixed-number join
4. choose between two strategies
5. repair a wrong common denominator
6. justify the result on a number line

### 13.2 Example Divide Sequence Arc

Level 1:

1. share `1` cake between `2`
2. share `1` cake between `4`
3. share `2` cakes between `4`
4. connect the share to `1/2` or `1/4`
5. choose the correct equal-share picture
6. explain which share is fair

Level 5:

1. how many `1/4` scoops fit in `1`
2. how many `1/4` scoops fit in `3/4`
3. divide `2/3` equally between `2`
4. compare sharing and measuring interpretations
5. repair a wrong quotient
6. predict whether the quotient will be more or less than `1`

## 14. Engagement Design

The new operations area should feel playful without becoming noisy.

### 14.1 Good Engagement Patterns

- prediction before reveal
- drag, split, snap, pack, pour, share
- visible transformations
- “beat the misconception” repair rounds
- streaks only where pacing helps, mainly in compare and certain calculation drills
- short authored arcs with mini-discoveries

### 14.2 Do Not Do This

- giant blocks of instructional text
- answer-box-first tasks
- algorithm cards with no manipulative support
- flashy rewards that drown out the mathematical transformation
- fake diversity where all tasks still reduce to typing an answer

## 15. Visual Design Guidance For The New Area

The calculations family should feel related to the current app, but with distinct visual identities by operation.

Recommended accents:

- `Add`: fresh green or teal-green
- `Subtract`: berry red or coral
- `Multiply`: deep blue or indigo-blue
- `Divide`: amber or orange

The board should visually suggest the operation:

- addition joins pieces
- subtraction removes or reveals the gap
- multiplication transforms or overlaps
- division shares or packs repeated units

The animation work should be mathematical:

- strip segments join into one length
- a gap grows or closes
- a scale transformation visibly shrinks or stretches
- equal shares split cleanly
- packed unit fractions count themselves into the container

## 16. Mobile And Accessibility Requirements

Because the app already risks “desktop SVG scaled down,” the new views must be planned mobile-first.

### 16.1 Mobile Rules

1. Every operation view needs a small-screen layout, not just a scaled desktop scene.
2. No mini-cards with unreadable fractions below `375px`.
3. If a board would become too dense, use fewer active objects and more rounds.
4. Drag targets must remain finger-sized.
5. Labels must not rely on tiny monospace text.

### 16.2 Accessibility Rules

1. Color is supportive, not the only signal.
2. Wrong/correct states also need shape, border, pattern, or motion cues.
3. Keyboard alternatives should exist for token movement and selection.
4. Reduced-motion mode must preserve meaning even when transformations are simplified.

## 17. Technical And Architecture Guidance

This plan will increase scope. The implementation must stay modular even if it remains in one HTML file.

Recommended internal structure:

- shared math helpers
- shared formatting and localization helpers
- shared animation helpers
- shared board primitives
- represent mode controllers
- calculate mode controllers
- authored sequences
- free-play generators
- accessibility and localization wiring

Suggested reusable board primitives:

- `renderStrip`
- `renderNumberLine`
- `renderAreaGrid`
- `renderAreaOverlap`
- `renderPieceTray`
- `renderShareTray`
- `renderToken`
- `animateRepartition`
- `animateJoin`
- `animateSplit`
- `animatePack`

## 18. Implementation Phasing

### Phase 1

Refactor navigation and progression:

- add `Represent / Calculate`
- replace `3` difficulties with `5` levels
- update state shape and sequence registries

### Phase 2

Remap all existing represent modes to `Level 1-5`.

### Phase 3

Implement `Add` and `Subtract`:

- `Join Strips`
- `Jump Line`
- `Take Away Strip`
- `Gap Finder`

### Phase 4

Implement `Multiply`:

- `Fraction Of`
- `Repeat The Piece`
- `Scale Machine`
- simple `Area Quilt`

### Phase 5

Implement `Divide`:

- `Share Fairly`
- `How Many Fit`
- quotient interpretation tasks

### Phase 6

Polish:

- mobile layouts
- animation quality
- full EN/PL localization
- accessibility
- progression balancing

## 19. Acceptance Criteria

The redesign is only acceptable if all of the following are true:

1. The UI exposes `Level 1` through `Level 5`, and they are meaningfully different.
2. `Level 5` is clearly harder than the current highest level in both representation and calculation.
3. The app has a visible `Calculate` family with `Add`, `Subtract`, `Multiply`, and `Divide`.
4. Each operation mode has at least two different activity patterns.
5. Addition and subtraction visibly rely on common units when denominators differ.
6. Multiplication visibly teaches “fraction of,” scaling, or area overlap before symbolic rule compression.
7. Division visibly teaches sharing or “how many fit?” before symbolic shortcuts.
8. Fractions and decimals remain connected where developmentally appropriate.
9. Mixed numbers are introduced and used intentionally in higher levels.
10. The board, not the side panel, carries the main mathematical explanation.
11. The mobile layout is reflowed, not only scaled down.
12. The app still feels like a children’s interactive tool, not a fraction worksheet tab set.

## 20. Explicit Rejection Conditions

Reject the implementation if any of these are true:

1. `Level 4` and `Level 5` mostly differ only by larger denominators.
2. The calculation modes reduce to answer-entry forms with thin decoration.
3. `Multiply` teaches only the numeric rule with no model-first interaction.
4. `Divide` relies mainly on “invert and multiply.”
5. Unlike-denominator addition/subtraction is presented without visual common-unit conversion.
6. The operation views are only new labels on reused mission logic.
7. Mobile still reads as a shrunken desktop SVG.

## 21. Source Links And Traceability

Primary sources used for this redesign:

- Math Learning Center Fractions app: https://www.mathlearningcenter.org/apps/fractions
- Illustrative Mathematics, Fractions on Number Lines: https://im.kendallhunt.com/k5/teachers/grade-4/unit-2/lesson-5/preparation.html
- Illustrative Mathematics, Grade 5 Unit 2, Fractions as Quotients and Fraction Multiplication: https://im.kendallhunt.com/k5/teachers/grade-5/unit-2/practice.html
- Illustrative Mathematics, Grade 5 Unit 3, Multiplying and Dividing Fractions: https://curriculum.illustrativemathematics.org/k5/teachers/grade-5/unit-3/practice.html
- Illustrative Mathematics, Relate Division and Fractions: https://curriculum.illustrativemathematics.org/k5/teachers/grade-5/unit-2/lesson-5/preparation.html
- NCETM, Adding and subtracting within one whole: https://www.ncetm.org.uk/classroom-resources/primm-304-adding-and-subtracting-within-one-whole/
- NCETM, Common denomination: more adding and subtracting: https://www.ncetm.org.uk/classroom-resources/primm-308-common-denomination-more-adding-and-subtracting/
- NCETM, Multiplying whole numbers and fractions: https://www.ncetm.org.uk/classroom-resources/primm-306-multiplying-whole-numbers-and-fractions/
- NCETM, Multiplying fractions and dividing fractions by a whole number: https://www.ncetm.org.uk/classroom-resources/primm-309-multiplying-fractions-and-dividing-fractions-by-a-whole-number/
- GOV.UK, National curriculum in England: mathematics programmes of study: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study

Traceability summary:

- stable whole, visual manipulation, superimposed comparison: Math Learning Center
- equivalent fractions as same point on the number line: Illustrative Mathematics
- fraction as quotient and division meaning: Illustrative Mathematics
- common denominators as the bridge for add/subtract: NCETM and GOV.UK curriculum guidance
- repeated addition, scaling, and area for multiplication: NCETM and Illustrative Mathematics
- fraction division limited to developmentally appropriate cases: NCETM, Illustrative Mathematics, and curriculum expectations
