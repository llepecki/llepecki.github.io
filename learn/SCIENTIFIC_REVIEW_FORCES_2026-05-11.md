# Scientific Review: `forces.html`

Review date: 2026-05-11

Purpose: assess whether `forces.html` is scientifically sound as a children’s teaching app, distinguish real physics/math problems from acceptable simplifications, and provide a fix-ready handoff if changes are needed.

## Executive Summary

`forces.html` is scientifically stronger than many children’s force games. Its core model is defensible:

- forces are treated as vectors
- the net force is computed by component sum
- the puck starts from rest
- the reveal motion follows the direction of the net force
- the app uses a head-to-tail construction to show how multiple vectors reduce to one resultant

The app is therefore broadly fit to teach the intended concept.

However, there is one important scientific/mathematical problem and two meaningful presentation-model mismatches:

1. the main-board green `net force` arrow is not drawn to the actual magnitude of the resultant vector
2. some child-facing copy still says the puck will `cross` the ring, but the current reveal actually stops at first rim contact with the ring
3. the visual force arrows no longer literally originate at the center-of-mass point, which weakens the app’s crucial no-torque simplification

The first issue is the only high-severity one. It should be fixed.

## Method

- Read the current `forces.html` source directly.
- Checked the implemented vector math against standard vector-addition and Newton’s-second-law relations.
- Checked the reveal model against constant-acceleration kinematics.
- Checked the app’s visual framing against torque fundamentals, because the product depends on a translation-only simplification.
- Ran small local calculations to verify fallback resultants and to estimate the range of resultant magnitudes produced by accepted generated rounds.

## Reference Physics Model

These relations should be treated as the scientific baseline for the app:

- Net external force: `F_net = ΣF`
- Newton’s second law: `a = F_net / m`
- Acceleration points in the same direction as net external force
- In a vector diagram, arrow length represents magnitude
- A graphical resultant is formed by head-to-tail vector addition
- With constant acceleration and `v0 = 0`, displacement follows `x = x0 + (1/2) a t^2`, so the motion stays on the same line as the acceleration
- Torque about an origin is `τ = r × F`; if the line of action passes through the center, torque is zero

## What Is Already Scientifically Correct

### 1. Resultant Computation

Locations:

- `forces.html:877-890`

What is correct:

- the app resolves each force into x/y components
- sums the components
- computes resultant magnitude with `hypot`
- computes resultant direction with `atan2`

This is the correct analytical method for 2D vector addition.

### 2. Head-To-Tail Resultant Card

Locations:

- `forces.html:1740-1831`

What is correct:

- the post-shot `Resultant` card constructs a tip-to-tail chain
- the green net arrow runs from the first tail to the last head
- this is a correct graphical resultant construction

This is good science and good pedagogy.

### 3. Motion Direction Model

Locations:

- `forces.html:1166-1187`
- `forces.html:1453-1467`
- `forces.html:1696-1717`

What is correct:

- the puck starts from rest
- the reveal uses a constant-direction acceleration model
- the motion uses an `s ∝ t²` profile, which is the right qualitative form for acceleration from rest under constant force
- the post-shot copy correctly ties the motion direction to the net force and the from-rest condition

This is an acceptable and scientifically honest simplification.

### 4. Difficulty Progression Does Not Distort The Physics

Locations:

- `forces.html:708-718`
- `forces.html:1470-1477`
- `forces.html:2008-2013`

What is correct:

- the `6` levels change vector count and hit tolerance only
- they do not alter the underlying physics model

This is a good separation of gameplay difficulty from scientific content.

## Findings

## 1. Main-Board Net Force Arrow Is Not Drawn To The Actual Resultant Magnitude

Severity: High

Locations:

- `forces.html:1189-1199`
- `forces.html:1440-1450`
- compare with input-force scaling at `forces.html:1319-1337`

What is wrong:

- the red/blue/amber/teal force arrows use length to encode magnitude
- the green `net force` arrow on the main board does not
- instead of using `state.resultant.mag * unitPx`, it is drawn at a nearly fixed long length:
  - `const netLen = arrowMax * 0.95 * growT`

Why this matters scientifically:

- in a vector diagram, arrow length represents magnitude
- the resultant vector is not only a direction; it also has a magnitude
- this app explicitly teaches graphical vector addition, so a not-to-scale resultant is mathematically misleading

Source basis:

- OpenStax’s vector-addition material states that vector arrows are drawn with lengths proportional to magnitude and that the resultant is the sum vector built from that same representation
- Newton’s-second-law examples also treat the net force as a full vector with both magnitude and direction

Concrete evidence from the current app:

- the authored fallback round `4 @ 0°` plus `3 @ 90°` has resultant magnitude `5.0`
- the main-board green arrow should therefore be `5/6` of the max-individual-force scale used for the input arrows
- the app instead draws it at `0.95 * arrowMax`, which is longer than the correct `5 * unitPx`

This gets much worse in weak-resultant rounds:

- the authored four-force fallback `5 @ 60°`, `5 @ 240°`, `4 @ 150°`, `3 @ 0°` has resultant magnitude about `2.053`
- the current green arrow is still drawn almost full-length

I also ran a local sample of `100,000` accepted generated rounds per vector family:

- `2`-vector accepted rounds had resultants from about `2.52` to `6.00`
- `3`-vector accepted rounds had resultants from about `2.00` to `11.59`
- `4`-vector accepted rounds had resultants from about `2.00` to `14.70`

So the current fixed green-arrow length is not a minor visual shortcut. It is a real vector-magnitude misrepresentation.

Required fix:

Choose one of these two scientifically honest options:

1. Preferred:
   use one consistent scale per board state for all arrows, based on the largest of:
   - the largest individual force magnitude
   - the resultant magnitude

   Then draw:
   - each input force to scale
   - the green resultant to scale using that same scale

2. Acceptable fallback:
   if the board must preserve the current input-force scale, explicitly present the green arrow as a `direction-only reveal`, not as a full vector representation

The second option is scientifically weaker and should only be used if the board layout cannot support a shared scale.

Acceptance criteria:

- On the main board, the green resultant arrow length is proportional to the actual resultant magnitude using the same scale semantics as the input arrows.
- For `4 @ 0°` and `3 @ 90°`, the green arrow length matches magnitude `5`.
- For `5 @ 60°`, `5 @ 240°`, `4 @ 150°`, `3 @ 0°`, the green arrow is visibly much shorter than in the previous case.
- No board state implies equal-length resultants for obviously unequal resultant magnitudes.

## 2. Some Copy Still Says The Puck Will “Cross” The Ring, But The Current Geometry Models First Contact

Severity: Medium

Locations:

- `forces.html:14`
- `forces.html:450-451`
- `forces.html:585`
- `forces.html:638`
- compare with current motion geometry at `forces.html:1166-1187` and `forces.html:1453-1457`

What is wrong:

- the app originally used a point-mass framing
- the current reveal now translates a finite-size puck until its rim first reaches the ring
- some copy still says the puck will `cross` the ring

Why this matters scientifically:

- a point mass can cross a ring at a point
- a finite-size puck first touches the ring before its center crosses it
- the current motion geometry is a first-contact model, not a center-crossing model

This is not a fatal physics error, but it is a real model-language mismatch.

What is already correct:

- the mission text `Pick the ring point the puck reaches first.` is much better and already matches the current geometry

Required fix:

Pick one model and make all copy match it.

Preferred option:

- keep the current finite-size puck reveal
- change all remaining `cross the ring` wording to `touch the ring first` or `reach the ring first`

Alternative option:

- if you want true point-mass language, move the puck center to the ring instead of moving the puck rim to the ring

The preferred option is simpler and fits the current visual design better.

Acceptance criteria:

- No child-facing English or Polish copy says the puck will `cross` the ring unless the motion geometry is changed to a point-mass crossing model.
- Subtitle, meta description, and any future onboarding text all match the same geometric event being scored.

## 3. The No-Torque Simplification Is Claimed In Text But Is No Longer Maximally Clear In The Drawing

Severity: Medium-Low

Locations:

- `forces.html:570`
- `forces.html:602-605`
- `forces.html:657-660`
- `forces.html:1325-1333`

What is wrong:

- the app tells the child that all arrows push through the center
- but the visible force arrows start at the puck rim rather than visibly emanating from a center-of-mass point

The current code comment argues that the line of action still passes through the center, and mathematically that is true. However, for a children’s teaching app, the visual is now weaker than the scientific claim it supports.

Why this matters scientifically:

- the whole translation-only model depends on eliminating torque
- torque depends on lever arm and line of action
- if a learner visually reads the arrows as edge pushes rather than through-center pushes, the reason the puck does not spin becomes less clear

Source basis:

- OpenStax’s free-body-diagram treatment places force vectors from the center-of-mass dot
- OpenStax’s torque treatment makes the lever arm and line of action central to whether a force produces rotation

This is therefore not merely a style preference. It affects how honestly the simplification is communicated.

Required fix:

Use one of these visual fixes:

1. Preferred:
   draw each force from the center, with the puck rendered over the innermost shaft segment

2. Also acceptable:
   keep the current rim start, but add a visible center dot and faint line-of-action stems through the center so it is unmistakable that each force acts through the center

Acceptance criteria:

- A learner can see without inference that all force lines of action pass through the center.
- The board no longer risks being read as “off-center pushes that somehow do not spin the puck.”

## Minor Notes

These are lower priority than the findings above.

### M1. Caption Could Be Slightly Sharpened

Location:

- `forces.html:607`
- `forces.html:662`

Current wording:

- `Net force = sum of all pushes`

This is acceptable for children because the graphical card itself shows vector addition correctly.

Still, a slightly better wording would be:

- `Net force = vector sum of all pushes`

or a child-friendly paired version such as:

- `Net force = combined push (vector sum)`

This is not a required fix if the major issues are addressed.

## Overall Verdict

`forces.html` is scientifically close to production quality for its intended audience.

The core physics model is sound:

- vector addition is implemented correctly
- the motion reveal is honest within its from-rest, constant-force simplification
- the head-to-tail explanation card is good

The app does not need a conceptual rewrite.

It does need at least one real correction:

- the main-board green resultant arrow must stop misrepresenting vector magnitude

The wording/visual consistency fixes should also be made so the teaching model stays crisp and honest.

## Sources

Primary sources used for this review:

- OpenStax, `5.3 Newton’s Second Law`
  https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law
- OpenStax, `5.1 Vector Addition and Subtraction: Graphical Methods`
  https://openstax.org/books/physics/pages/5-1-vector-addition-and-subtraction-graphical-methods
- OpenStax, `3.4 Motion with Constant Acceleration`
  https://openstax.org/books/university-physics-volume-1/pages/3-4-motion-with-constant-acceleration
- OpenStax, `10.6 Torque`
  https://openstax.org/books/university-physics-volume-1/pages/10-6-torque

## Source-Derived Claims Used Here

Directly supported by sources:

- net force is the vector sum of the external forces
- acceleration is in the same direction as the net external force
- vector diagrams use arrow length to represent magnitude
- head-to-tail construction yields the resultant vector
- with constant acceleration and `v0 = 0`, displacement follows the acceleration line through the `1/2 a t^2` relation
- torque depends on lever arm and force direction, and is zero when the line of action removes the lever arm

Inference applied in this review:

- because the app intentionally teaches a no-torque, translation-only puck model, the visual presentation should make through-center force application explicit enough that children do not misread the arrows as off-center pushes
