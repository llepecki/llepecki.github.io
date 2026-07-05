# Fraction Playground vNext: Master Handoff

## 0. Status Of This Document

This is the canonical handoff for the next major version of [`fractions.html`](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html).

It consolidates and supersedes:

- [FRACTIONS_VNEXT_PLAN_2026-05-06.md](/Users/llepecki/Projects/llepecki.github.io/learn/FRACTIONS_VNEXT_PLAN_2026-05-06.md)
- [FRACTIONS_VNEXT_IMPLEMENTATION_ORDER_2026-05-06.md](/Users/llepecki/Projects/llepecki.github.io/learn/FRACTIONS_VNEXT_IMPLEMENTATION_ORDER_2026-05-06.md)

If the implementing agent needs one document to follow, it should follow this one.

If the implementing agent and reviewer disagree about intent, this document wins.

## 1. Handoff Goal

The next version of the fractions app must do two major things:

1. Replace the current `Introduction / Intermediate / Advanced` structure with a meaningful `Level 1` through `Level 5` progression.
2. Expand the app beyond representation into a full `Calculations` family covering:
   - fraction addition
   - fraction subtraction
   - fraction multiplication
   - fraction division

The target audience remains children up to age 11.

This must remain an upper-primary learning app, not a symbolic drill tool disguised as one.

## 2. Executive Product Direction

The current app is no longer enough as a fractions product if it only helps children:

- build fractions
- compare fractions
- place fractions
- match representations
- repair mismatches

That work remains useful, but it covers only one side of the topic.

The next version must support two big families of learning:

- `Represent`
- `Calculate`

`Represent` teaches what fractions are.

`Calculate` teaches what children can do with them.

The product must therefore become broader without becoming shallower.

## 3. Non-Negotiable Product Outcomes

The redesign is successful only if all of the following are true:

1. `Level 1` through `Level 5` are visible, stable, and mathematically meaningful across the entire app.
2. `Level 5` is clearly harder than the current highest level.
3. `Represent` and `Calculate` are both real top-level families.
4. `Add`, `Subtract`, `Multiply`, and `Divide` are each real interactive modes, not decorative wrappers around one mission engine.
5. The app still teaches through board interaction first and symbolic notation second.
6. The board carries the main explanation more than the side panel.
7. Mixed numbers, unlike denominators, decimal links, estimation, and strategy choice appear where developmentally appropriate.
8. Mobile, localization, and accessibility are treated as product requirements, not afterthoughts.

## 4. Hard Product Constraints

These are not suggestions.

### 4.1 Age Constraint

The app is for children up to age 11.

That means:

- no secondary-school algebra framing
- no symbolic procedure dumping
- no shortcut-first fraction division teaching
- no dense text-driven lesson flow

### 4.2 Pedagogy Constraint

All four operations must begin with meaning:

- addition as joining or completing
- subtraction as taking away or finding the gap
- multiplication as repeated addition, fraction-of, scaling, or area overlap
- division as sharing or measuring how many fit

### 4.3 Visual Constraint

The app must continue to feel like an intentional interactive learning tool, not a worksheet UI with colorful buttons.

### 4.4 Difficulty Constraint

Harder levels must become harder through reasoning structure, not only through denominator size.

### 4.5 Honesty Constraint

The implementation must not pretend a mode exists when it is really the old `currentValue == target` mechanic wearing a new label.

## 5. Research-Backed Design Foundation

This redesign is based on consistent ideas across major educational sources.

### 5.1 Stable Whole And Visual Manipulation

Math Learning Center’s Fractions app shows why bars and circles work: children can divide a whole into equal parts, fill it, compare it, and superimpose it. That keeps the whole visible and the reasoning grounded.

### 5.2 Number Lines Are Essential

Illustrative Mathematics repeatedly uses number lines to establish that equivalent fractions land on the same point and that decimals and fractions can be compared through position and distance.

### 5.3 Common Units Matter For Add/Subtract

NCETM’s fraction progression makes common denominators the central bridge for meaningful addition and subtraction of more complex fractions.

### 5.4 Multiplication Must Start From Meaning

NCETM and Illustrative Mathematics both frame multiplication through repeated addition, fraction-of, scaling, and area. The symbolic rule is not the starting point.

### 5.5 Division Must Be Interpreted

Illustrative Mathematics and curriculum guidance treat fractions as quotients and division situations as share/measure relationships. That is stronger for this age than shortcut-driven procedures.

### 5.6 Curriculum Fit

The official upper-primary curriculum expectations support:

- same-denominator and unlike-denominator addition/subtraction
- mixed numbers and improper fractions
- decimal fractions and hundredths
- multiplication of proper fractions and mixed numbers by whole numbers
- simple fraction multiplication
- division of proper fractions by whole numbers

The redesign should challenge upper-primary learners strongly, but stay inside that conceptual envelope.

## 6. Information Architecture

### 6.1 Tier 1 Navigation

Top-level family switch:

- `Represent`
- `Calculate`

### 6.2 Tier 2 Navigation

Mode selection inside the family.

For `Represent`:

- `Build`
- `Compare`
- `Match`
- `Place`
- `Repair`

For `Calculate`:

- `Add`
- `Subtract`
- `Multiply`
- `Divide`

### 6.3 Tier 3 Progression

Global level switch:

- `Level 1`
- `Level 2`
- `Level 3`
- `Level 4`
- `Level 5`

### 6.4 Utility Controls

Keep utility actions separate from the core progression model:

- `Explore`
- `Hint`
- `Reset`
- language toggle

## 7. Levels 1-5: Exact Meaning

### 7.1 Level 1

Purpose:
confidence and meaning

Characteristics:

- mostly proper fractions within one whole
- denominators `2, 3, 4, 5, 10`
- obvious visual cases
- no symbolic compression pressure
- calm pacing

### 7.2 Level 2

Purpose:
early fluency with slightly richer structures

Characteristics:

- denominators `2, 3, 4, 5, 6, 8, 10`
- simple equivalence
- tenths and easy decimal links
- first “finish the whole” and missing-value tasks

### 7.3 Level 3

Purpose:
connect equivalence, notation, and calculation strategy

Characteristics:

- denominators `2, 3, 4, 5, 6, 8, 10, 12`
- improper fractions and mixed numbers begin
- denominators that are multiples of each other
- hundredths appear in controlled ways

### 7.4 Level 4

Purpose:
real upper-primary reasoning

Characteristics:

- unlike denominators with friendly common denominators
- mixed numbers in multiple modes
- decimal/fraction comparison near benchmarks
- multiplication as scaling and area
- division as sharing and measurement

### 7.5 Level 5

Purpose:
clearly harder than the current highest level while staying age-appropriate

Characteristics:

- mixed numbers and improper fractions used regularly
- unlike denominators that require genuine planning
- estimate-first and strategy-choice tasks
- tighter comparisons and placements
- fraction multiplication in simple pairs
- proper fraction divided by whole number
- friendly measurement division stretch cases
- decimal-hundredth reasoning when it helps, not as random difficulty

### 7.6 Global Level Boundaries

#### Denominators

- Level 1: `2, 3, 4, 5, 10`
- Level 2: `2, 3, 4, 5, 6, 8, 10`
- Level 3: `2, 3, 4, 5, 6, 8, 10, 12`
- Level 4: `2, 3, 4, 5, 6, 8, 10, 12`
- Level 5: same core set plus a few friendly composites when justified by authored content

#### Decimals

- Level 1: tenths only
- Level 2: tenths and selected obvious hundredths
- Level 3: hundredths in placement/comparison
- Level 4: hundredths in reasoning and checking
- Level 5: hundredths in genuine challenge settings, not isolated decimal drill

#### Mixed Numbers

- Level 1: none
- Level 2: only preview if needed
- Level 3: introduction
- Level 4: regular use
- Level 5: regular and intentional use

## 8. Represent Family Under The New Levels

The existing represent family stays, but its progression must be rebuilt.

### 8.1 Build

- Level 1: obvious target fractions within one whole
- Level 2: tenths and benchmark filling
- Level 3: equivalent fractions with related denominators and first mixed numbers
- Level 4: mixed numbers, improper fractions, decimal fractions
- Level 5: estimate first, then build and transform

### 8.2 Compare

- Level 1: same denominators, unit fractions, obvious benchmarks
- Level 2: related denominators and tenths
- Level 3: fractions versus friendly decimals, close values
- Level 4: unlike denominators with equivalent-fraction reasoning
- Level 5: close mixed values, order sets, justify before reveal

### 8.3 Match

- Level 1: fraction text to bar
- Level 2: fraction to decimal tenth
- Level 3: equivalent fractions and number-line points
- Level 4: mixed forms and hundredths
- Level 5: subtle same-value, different-structure sets

### 8.4 Place

- Level 1: obvious benchmark positions on `0..1`
- Level 2: tenths and simple related denominators
- Level 3: close values on `0..1` and `0..2`
- Level 4: mixed numbers and hundredths with zoomed windows
- Level 5: tight placements with estimate markers and benchmark logic

### 8.5 Repair

- Level 1: one clear mismatch
- Level 2: beginner-confusing denominator cases
- Level 3: decimal-fraction mismatches
- Level 4: mixed-number and unlike-denominator mismatches
- Level 5: subtle but fair contradictions about same whole, same point, or same amount

## 9. Calculations Family: Overall Contract

This is the main new product area.

It must not be implemented as:

- a row of symbolic equations
- an input box with hints
- the old mission system with operation labels

It must be implemented as model-first, interaction-first learning.

### 9.1 Shared Rules Across All Four Operations

1. Each round begins from a visible situation.
2. Prediction comes before full symbolic reveal when possible.
3. Hints start with a model nudge before any compact rule.
4. Wrong answers should fail for intelligible reasons.
5. The same whole must remain visually honest.
6. Free play must preserve each level’s pedagogy after authored sequences end.

## 10. Add Mode

### 10.1 Core Meanings

Addition must be taught as:

- joining lengths
- combining parts of one whole
- making a target total
- finding a missing addend

### 10.2 Required Board Types

- `Join Strips`
- `Jump Line`
- `Make One / Make Two`

### 10.3 Required Activities

- direct sum
- missing addend
- target sum
- benchmark completion

### 10.4 Level Progression

- Level 1: same denominators within one whole
- Level 2: same denominators beyond one whole and simple tenths
- Level 3: denominators that are multiples of each other
- Level 4: unlike friendly denominators and simple mixed numbers
- Level 5: mixed numbers, estimate first, strategy choice

### 10.5 Non-Negotiable Behavior

Unlike-denominator addition must visibly convert to common units. It is not enough to tell the child the denominator changed.

## 11. Subtract Mode

### 11.1 Core Meanings

Subtraction must be taught as:

- taking away
- finding what is left
- finding the gap
- comparing two amounts by distance

### 11.2 Required Board Types

- `Take Away Strip`
- `Gap Finder`
- `Repair The Difference`

### 11.3 Required Activities

- remove a part
- find the remainder
- find the gap
- fix a wrong subtraction

### 11.4 Level Progression

- Level 1: same-denominator subtraction within one whole
- Level 2: subtract from one whole and from tenths
- Level 3: related denominators and controlled mixed-number work
- Level 4: unlike friendly denominators
- Level 5: mixed numbers, near-benchmark gaps, estimate then solve

### 11.5 Non-Negotiable Behavior

Gap-based subtraction must feel different from take-away subtraction before the child reads any instructions.

## 12. Multiply Mode

### 12.1 Core Meanings

Multiplication must be taught as:

- repeated addition
- fraction of
- scaling
- area overlap

### 12.2 Required Board Types

- `Fraction Of`
- `Repeat The Piece`
- `Scale Machine`
- `Area Quilt`

### 12.3 Required Activities

- find a fraction of a whole or set
- repeat a fraction
- predict smaller or larger
- overlap two fractions in simple area cases

### 12.4 Level Progression

- Level 1: intuitive halves/quarters of a whole or set
- Level 2: whole number × unit fraction
- Level 3: whole number × non-unit fraction and scaling
- Level 4: simple proper fraction × proper fraction using area
- Level 5: clearly harder fraction multiplication with estimate-first tasks

### 12.5 Non-Negotiable Behavior

The app must show that multiplying by a proper fraction can make a quantity smaller.

If that idea is not visually obvious, the multiply mode is not done.

## 13. Divide Mode

### 13.1 Core Meanings

Division must be taught as:

- equal sharing
- how many groups fit
- quotient interpretation

### 13.2 Required Board Types

- `Share Fairly`
- `How Many Fit`
- quotient interpretation cards

### 13.3 Required Activities

- equal sharing
- packing repeated unit fractions
- translating division situations into fractions
- repairing wrong quotient logic

### 13.4 Level Progression

- Level 1: share wholes into equal parts
- Level 2: share simple fractions
- Level 3: whole number divided by unit fraction in concrete settings
- Level 4: proper fraction divided by whole number and quotient meaning
- Level 5: friendly stretch cases such as measurement division with unit fractions

### 13.5 Scope Guardrail

Do not turn this into general symbolic `fraction ÷ fraction` drill.

Allowed as core:

- unit fraction ÷ whole number
- whole number ÷ unit fraction
- proper fraction ÷ whole number
- very limited fully visual stretch cases

Not allowed as the main mode identity:

- invert-and-multiply-first teaching
- broad `a/b ÷ c/d` symbolic practice

## 14. New View Inventory

The implementing agent should treat these as the main board vocabulary for the next version:

- `Join Strips`
- `Jump Line`
- `Make One`
- `Take Away Strip`
- `Gap Finder`
- `Fraction Of`
- `Repeat The Piece`
- `Scale Machine`
- `Area Quilt`
- `Share Fairly`
- `How Many Fit`

These are not all top-level tabs. They are board systems used inside the four operation modes.

## 15. Authored Progression Contract

Random generation comes later.

First build authored sequences for every:

- family
- mode
- level

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

### 15.1 Minimum Authored Sequence Size

Every `mode × level` combination should have roughly `6-10` authored steps before free play begins.

### 15.2 Free Play Rule

Free play is only acceptable after:

1. the authored sequence is complete
2. the free-play generator respects the same level boundaries
3. advanced levels do not collapse into easier generic cases

## 16. Visual Design Direction

The calculation family must look intentional, not bolted onto the existing app.

### 16.1 Operation Color Direction

Recommended accents:

- `Add`: green / teal-green
- `Subtract`: berry red / coral
- `Multiply`: deep blue
- `Divide`: amber / orange

### 16.2 Visual Motion Rules

Animation should teach mathematics:

- joining pieces into a longer total
- pulling a removed segment away
- revealing a gap
- shrinking or stretching under a scale factor
- filling only the overlap region
- splitting equal shares
- packing repeated unit fractions until no more fit

### 16.3 Explicit Design Warning

Do not fill the new area with abstract cards and text prompts while the actual board becomes passive.

If the board is not the main explainer, the design has failed.

## 17. Mobile And Accessibility Contract

### 17.1 Mobile

The current app has already shown the failure mode of “desktop SVG scaled down.” The new work must not repeat that.

Every operation board needs a real small-screen layout.

Required:

1. readable labels at `375px`
2. finger-sized interaction targets
3. fewer simultaneous objects when necessary
4. reflowed scenes, not just scaled scenes

### 17.2 Accessibility

Required:

1. color is not the only signal
2. keyboard paths for at least core interactions
3. reduced-motion alternative that keeps the math visible
4. localized aria labels and status text

## 18. Technical Architecture Contract

The implementation may remain in one file, but it must not turn into sludge.

Recommended internal sections:

- shared math helpers
- shared formatting and localization helpers
- shared animation helpers
- board primitives
- represent controllers/renderers
- calculate controllers/renderers
- authored sequences
- free-play generators
- accessibility wiring

Recommended reusable primitives:

- `renderStrip`
- `renderStripEquation`
- `renderNumberLine`
- `renderAreaGrid`
- `renderAreaOverlap`
- `renderPieceTray`
- `renderShareTray`
- `renderPackTrack`
- `animateJoin`
- `animateSplit`
- `animateScale`
- `animatePack`
- `animateOverlap`

## 19. Delivery Order

Build in this order only:

1. baseline architecture prep
2. new IA and `Level 1-5`
3. represent-family remap
4. calculation primitives
5. `Add`
6. `Subtract`
7. `Multiply`
8. `Divide`
9. free play and balancing
10. mobile / localization / accessibility / polish

The reason is simple:

- the platform must exist before the new family
- addition/subtraction are the safest first operation slices
- multiplication/division are the easiest places to cheat pedagogically
- free play and polish are dangerous distractions if the core interaction logic is still weak

## 20. Milestones

### 20.1 Milestone 0: Baseline And Safety Rails

Must achieve:

- clean top-level state sections for family/mode/level
- sequence engine that can represent future operations
- no regression in current working features

Reject if:

- the agent says “the structure is ready” but the old three-difficulty assumptions still govern the data model

### 20.2 Milestone 1: New IA And Level System

Must achieve:

- visible `Represent / Calculate`
- visible `Level 1-5`
- consistent routing and state persistence
- EN/PL strings updated

Reject if:

- `Level 4` and `Level 5` are just relabeled `Advanced`

### 20.3 Milestone 2: Represent Family Remap

Must achieve:

- authored level sequences for all represent modes
- visible level progression quality
- genuinely harder Level 5 content

Reject if:

- the fifth level differs mainly by larger denominators

### 20.4 Milestone 3: Shared Calculation Primitives

Must achieve:

- reusable board types for strips, lines, area, sharing, and packing
- shared interaction helpers
- shared animation helpers

Reject if:

- the agent is only renaming old represent renderers

### 20.5 Milestone 4: `Add`

Must achieve:

- complete add mode across Levels 1-5
- same-denominator and unlike-denominator visual logic
- benchmark and missing-addend activities

Reject if:

- `Add` is mostly equations with decorative visuals

### 20.6 Milestone 5: `Subtract`

Must achieve:

- complete subtract mode across Levels 1-5
- both take-away and gap interpretation
- visible mixed-number honesty where used

Reject if:

- subtraction feels like addition with a minus sign pasted in

### 20.7 Milestone 6: `Multiply`

Must achieve:

- repeated addition
- fraction-of
- scaling
- area overlap in simple cases

Reject if:

- the mode teaches only the numeric rule

### 20.8 Milestone 7: `Divide`

Must achieve:

- sharing
- measurement / “how many fit?”
- quotient meaning

Reject if:

- the mode leans on `invert and multiply`

### 20.9 Milestone 8: Progression Integrity

Must achieve:

- free play for all new modes
- level-respecting free play
- no answer leakage in panel summaries
- no collapse of advanced content after authored sequences end

Reject if:

- the app is strong only during the scripted intro rounds

### 20.10 Milestone 9: Release Readiness

Must achieve:

- real mobile reflow
- complete localization
- accessibility pass
- visual cohesion

Reject if:

- the app still reads as shrunken desktop SVG on mobile

## 21. Reporting Requirements For The Implementing Agent

At the end of each milestone, the implementing agent must report:

1. the milestone number
2. which files changed
3. which modes and levels are complete
4. what is intentionally incomplete
5. what verification was actually run

Do not accept vague progress language such as:

- “most of it is done”
- “the structure is there”
- “the rest is just polish”

unless the milestone exit criteria are already satisfied.

## 22. Explicit Rejection Conditions

Reject the implementation if any of the following are true:

1. `Level 4` and `Level 5` mostly differ through larger denominators rather than deeper reasoning.
2. `Calculate` modes are mainly symbolic equations with decorative visuals.
3. `Add` and `Subtract` do not visibly rely on common units when denominators differ.
4. `Multiply` does not visibly show shrinking/scaling.
5. `Divide` is mainly shortcut teaching.
6. Authored sequences are thin and free play carries most of the experience.
7. Free play downgrades advanced content.
8. Mobile is still a scaled desktop layout.
9. Translation is partial or inconsistent in the new family.
10. The board does not carry the main teaching work.

## 23. Verification Gates

The implementing agent should not self-certify without concrete checks.

### 23.1 After IA And Levels

- switch between `Represent` and `Calculate`
- switch between `Level 1-5`
- confirm state persistence

### 23.2 After Represent Remap

- complete one authored round in each represent mode at Level 1 and Level 5
- confirm Level 5 is visibly harder

### 23.3 After Calculation Primitives

- render each shared board type in isolation
- confirm locale-safe decimal rendering still works

### 23.4 After Add

- complete add mode at every level
- confirm one unlike-denominator visual conversion round

### 23.5 After Subtract

- complete subtract mode at every level
- confirm both take-away and gap interpretation

### 23.6 After Multiply

- complete multiply mode at every level
- confirm repeated addition, scaling, and area overlap

### 23.7 After Divide

- complete divide mode at every level
- confirm sharing and measurement are both present

### 23.8 After Progression Integrity

- exhaust authored sequences
- confirm advanced free play remains advanced

### 23.9 After Release Readiness

- desktop pass
- `375px` pass
- EN pass
- PL pass
- reduced-motion pass
- at least one keyboard-accessibility pass in each family

## 24. Reviewer Checklist

This section is for whoever reviews the implementation after handoff.

### 24.1 Navigation And Structure

- Is `Represent` a real family?
- Is `Calculate` a real family?
- Are `Level 1-5` visible and stable?
- Does the app preserve the last chosen family/mode/level sensibly?

### 24.2 Represent Family

- Is `Level 5` in `Compare` harder than the old highest level?
- Is `Level 5` in `Place` tighter and more reasoning-heavy?
- Is `Level 5` in `Repair` subtler but fair?
- Do all represent modes still feel different?

### 24.3 Add

- Does the mode visually teach joining?
- Are missing-addend rounds present?
- Do unlike denominators visibly convert to common units?
- Does the child see results beyond one whole honestly?

### 24.4 Subtract

- Does the mode visually teach both taking away and finding the gap?
- Is subtracting from one whole handled correctly?
- Are mixed-number rounds visually honest?
- Are wrong subtraction ideas surfaced and corrected?

### 24.5 Multiply

- Is repeated addition present?
- Is fraction-of present?
- Is scaling present?
- Is area overlap used only where visually clear?
- Is “multiplying by a proper fraction can shrink” made obvious?

### 24.6 Divide

- Is equal sharing present?
- Is measurement division present?
- Is fraction-as-quotient present?
- Does the mode avoid leaning on symbolic shortcuts?

### 24.7 Progression Quality

- Is Level 1 calm and confidence-building?
- Is Level 3 clearly more strategic than Level 2?
- Is Level 5 clearly more demanding than the current top level?
- Do higher levels add reasoning, not just bigger numbers?

### 24.8 Product Quality

- Does the board do most of the teaching?
- Does the panel avoid leaking answers?
- Does free play preserve advanced content?
- Does mobile reflow correctly?
- Is Polish translation complete and correct?
- Does reduced motion still preserve the mathematical meaning?

## 25. Final Acceptance Standard

The implementation should only be considered ready for a serious review if all of the following are true:

1. `Represent` and `Calculate` are both real and complete families.
2. `Level 1-5` is real across the entire app.
3. `Level 5` is clearly harder than the current highest level.
4. `Add`, `Subtract`, `Multiply`, and `Divide` all teach through interaction more than through notation.
5. Free play does not collapse the pedagogy.
6. Mobile, localization, and accessibility are solid enough to review as product work.

Until then, the agent is still implementing, not polishing.

## 26. Source Links

Primary sources used in the redesign:

- Math Learning Center Fractions: https://www.mathlearningcenter.org/apps/fractions
- Illustrative Mathematics, Fractions on Number Lines: https://im.kendallhunt.com/k5/teachers/grade-4/unit-2/lesson-5/preparation.html
- Illustrative Mathematics, Grade 5 Unit 2, Fractions as Quotients and Fraction Multiplication: https://im.kendallhunt.com/k5/teachers/grade-5/unit-2/practice.html
- Illustrative Mathematics, Grade 5 Unit 3, Multiplying and Dividing Fractions: https://curriculum.illustrativemathematics.org/k5/teachers/grade-5/unit-3/practice.html
- Illustrative Mathematics, Relate Division and Fractions: https://curriculum.illustrativemathematics.org/k5/teachers/grade-5/unit-2/lesson-5/preparation.html
- NCETM, Adding and subtracting within one whole: https://www.ncetm.org.uk/classroom-resources/primm-304-adding-and-subtracting-within-one-whole/
- NCETM, Common denomination: more adding and subtracting: https://www.ncetm.org.uk/classroom-resources/primm-308-common-denomination-more-adding-and-subtracting/
- NCETM, Multiplying whole numbers and fractions: https://www.ncetm.org.uk/classroom-resources/primm-306-multiplying-whole-numbers-and-fractions/
- NCETM, Multiplying fractions and dividing fractions by a whole number: https://www.ncetm.org.uk/classroom-resources/primm-309-multiplying-fractions-and-dividing-fractions-by-a-whole-number/
- GOV.UK, National curriculum in England: mathematics programmes of study: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study

## 27. Final Instruction To The Implementing Agent

Do not optimize for the appearance of breadth.

Optimize for:

- mathematically honest interaction
- real five-level progression
- genuinely different operation modes
- board-first teaching
- age-appropriate challenge

If a choice must be made between:

- one more screen
- or one existing screen becoming more conceptually correct

choose correctness.
