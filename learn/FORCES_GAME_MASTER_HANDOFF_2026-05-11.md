# Forces Game: Master Handoff

## 0. Status Of This Document

This is the canonical handoff for a new single-file learning app tentatively named `forces.html`.

Its purpose is to give the implementing agent one strict product, science, interaction, visual, and QA spec to follow.

If the implementing agent and reviewer disagree about intent, this document wins.

If the filename changes later, the product intent in this document still stands.

## 1. Handoff Goal

Build a child-friendly, game-only app that teaches one core idea:

- several forces acting on one body can be combined into one `net force`
- that net force sets the direction of the body’s `acceleration`
- if the body starts from rest and the forces stay constant, the body first moves in the direction of that net force

The child’s task is to look at visible force arrows, mentally combine them, and place a prediction point showing where the body will cross a fixed ring around it.

The app must feel like a precise physics toy, not a worksheet.

## 2. Scientific Review Outcome

This section is not optional. It defines what the app may honestly teach.

### 2.1 What The App May Truthfully Claim

- The net external force is the vector sum of all external forces.
- Acceleration points in the same direction as the net external force.
- The order of vector addition does not change the resultant.
- If the object starts from rest and the net force is constant, the object’s displacement from the start stays on the same line as the acceleration, so the first motion is along the resultant direction.

### 2.2 Required Simplification

The raw user idea becomes scientifically safe only under a specific simplification:

- the body must be modeled as a `top-down puck / point mass`
- all visible force arrows must act `through the centre`
- the app must ignore `rotation`
- the app must ignore `friction`
- the body must start each round `from rest`

Reason:

- a general force system on a rigid body is not always reducible to one force for all motion purposes, because `torque` can matter
- by making all forces concurrent through the centre, the app becomes a translation-only problem about net force, not a torque problem

### 2.3 Required Wording Correction

Do not frame the app as:

- “the net force always shows where the body moves”

That statement is too broad.

The child-facing framing must instead mean:

- “the puck starts from rest”
- “these pushes stay on”
- “where will the puck cross the ring first?”

This keeps the statement true inside the model being taught.

### 2.4 Claims The App Must Not Make

- The body moves in the direction of the `largest individual force`.
- Net force always tells the `velocity direction` of any already-moving object.
- Any set of forces on any body can always be replaced by one force with no other consequences.
- No net force means the object stops.

### 2.5 Scientific Design Implications

- Every round must start from rest.
- Every round must use constant forces during the reveal.
- Zero-resultant or near-zero-resultant rounds must be rejected.
- The win condition must be based on `direction`, not travel time.
- The app should reveal the `single green resultant` after the child commits.
- The app should also reveal a `head-to-tail` construction, because that is the clearest visual proof that several forces reduce to one net force.

## 3. Product Direction

The product question is not:

- “Which arrow is strongest?”

The product question is:

- “When all of these pushes act together, where is the one combined push pointing?”

The app must therefore train `graphical vector addition`, not button guessing.

## 4. Non-Negotiable Product Outcomes

The design is successful only if all of the following are true:

1. The child always predicts a `direction`, not a speed.
2. The board always shows a body in the centre with visible force arrows.
3. The app has `game mode only`.
4. `Level 1` uses exactly `2` forces.
5. `Level 2` uses exactly `3` forces.
6. `Level 3` uses exactly `4` forces.
7. The result labels are exactly:
   `Perfect hit`, `Close hit`, `Far hit`, `Miss`
8. The tolerance is shown as nested triangular sectors revealed after the shot.
9. The app reveals the `net force` only after the child commits a guess.
10. English and Polish localization are supported.
11. Mobile layout, keyboard access, and reduced-motion behavior are treated as product requirements.

## 5. Hard Constraints

These are not suggestions.

### 5.1 App Structure Constraint

- follow the existing single-file HTML app pattern used in this repo
- target file: `forces.html`
- use the same implementation workflow note at the top used by other apps, adapted to `forces.html`
- final implementation should be reviewable with `npm run code-review -- forces.html`

### 5.2 Mode Constraint

- no `Explore` mode
- no free manipulation of vector magnitudes or directions by the child
- no hidden second ruleset

This app is a pure prediction game.

### 5.3 Physics Scope Constraint

- no torque mode
- no spinning body
- no off-centre force application
- no friction or drag
- no nonzero initial velocity
- no curved trajectory

### 5.4 Fairness Constraint

The child must not be allowed to place the guess at arbitrary radius.

Reason:

- free-radius placement changes the absolute hit width and makes the task easier or harder depending on where the child taps

Required solution:

- use a fixed `prediction ring`
- the child may tap anywhere, but the actual stored guess must snap to the ring at that angle

### 5.5 Pedagogy Constraint

- the child should mostly learn from the `board`
- the side panel should support, not replace, the board explanation
- the post-shot reveal must make the answer visually understandable, not merely score it

## 6. Canonical References Inside This Repo

The implementing agent should visually and structurally reference:

- [momentum.html](/Users/llepecki/Projects/llepecki.github.io/learn/momentum.html)
- [flipandburn.html](/Users/llepecki/Projects/llepecki.github.io/learn/flipandburn.html)
- [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html)
- [angularmomentum.html](/Users/llepecki/Projects/llepecki.github.io/learn/angularmomentum.html)
- [STYLE.md](/Users/llepecki/Projects/llepecki.github.io/learn/STYLE.md)

Reference usage is strict:

- use the `light theme` family from `momentum.html` and `fractions.html`
- use `fractions.html` as the reference for the `Level 1 / 2 / 3` button pattern
- use `flipandburn.html` as the reference for the full-screen `result overlay` structure and feel
- use `angularmomentum.html` as the reference for the `central circular body` styling language

Do not inherit `flipandburn.html`’s dark space theme.

## 7. Canonical Target Experience

### 7.1 Child-Facing Summary

The child sees:

- a puck in the middle
- several colored arrows pushing it
- a faint ring around it

The child does:

- place one prediction point on the ring
- press `Test path`

The app then does:

- reveal the single green net force
- move the puck along that direction
- show where it really crosses the ring
- score the guess

### 7.2 Why The Ring Matters

The ring turns the abstract question:

- “Which way will it move?”

into the concrete question:

- “Where will it cross this ring first?”

That is clearer for children and much easier to score fairly.

## 8. Information Architecture

### 8.1 Header

Use the same general header pattern as the light-theme physics apps:

- back link to `/learn/`
- app title
- one-line subtitle
- `PL` / `EN` language button

Canonical English title and subtitle:

- Title: `Forces`
- Subtitle: `Add the pushes in your head and pick where the puck will cross the ring.`

### 8.2 Main Layout

Use a two-column layout:

- left: large board / canvas area
- right: fixed side panel

Desktop target:

- board fills remaining width
- panel width approximately `300px`

Mobile target:

- board stacked above panel
- board remains the dominant area

### 8.3 Side Panel Groups

The panel must contain these groups in this order:

1. `Level`
2. `Mission`
3. `Controls`
4. `Readouts`
5. `Resultant`
6. `Info`

## 9. Board Specification

### 9.1 Core Board Elements

The board must show all of the following:

- central puck
- visible input force arrows `F1` to `F4` as needed
- fixed prediction ring
- small ring tick marks
- child’s prediction marker on the ring after input
- actual motion ray after reveal
- actual ring-cross point after reveal
- nested tolerance wedges after reveal

### 9.2 Central Puck

The puck must:

- sit exactly at the centre of the board
- visually echo the circular object language of `angularmomentum.html`
- feel like a physical disc or puck, not a flat emoji
- remain stationary before the reveal

### 9.3 Prediction Ring

The prediction ring is required.

Behavior:

- it is visible before and after the shot
- it is the only scoring radius
- the child’s guess snaps to this ring
- the real trajectory is judged by where it crosses this ring

Sizing:

- ring radius should scale with viewport
- it must remain comfortably outside the longest force arrow
- it must remain well inside the board edge on both desktop and mobile

Implementation requirement:

- ring radius should be based on the smaller canvas dimension and clamped to a safe minimum and maximum

### 9.4 Force Arrows

Each force arrow must:

- start at the puck centre
- point outward
- have a distinct color by index
- have a visible arrowhead
- show a short label near the tip

Canonical force colors:

- `F1`: red
- `F2`: blue
- `F3`: amber
- `F4`: teal
- `Net`: green

Each force label should be simple:

- `F1`
- `F2`
- `F3`
- `F4`

If the implementing agent wants to also show magnitudes, that is allowed, but the board must stay visually clean.

### 9.5 Board Prompt

Use a subtle in-canvas prompt pattern similar in spirit to `flipandburn.html`.

Canonical states:

- before guess: `Tap anywhere to place your guess on the ring.`
- after guess, before test: `Drag around the ring, then test the path.`
- after reveal: `The green arrow is the net force.`

## 10. Side Panel Specification

### 10.1 Level Group

Use `fractions.html`’s compact level-button style.

Buttons:

- `1`
- `2`
- `3`

Behavior:

- selecting a level immediately starts a fresh round for that level
- active level button is visually highlighted

Mapping:

- Level 1 = `2` forces
- Level 2 = `3` forces
- Level 3 = `4` forces

### 10.2 Mission Group

This group must contain one prominent mission line.

Canonical English mission:

- `Pick the ring point the puck reaches first.`

This is better than a vague direction-only sentence because it matches the real scoring model.

### 10.3 Controls Group

Required buttons:

- `Test path`
- `Retry same forces`
- `New round`

Behavior:

- `Test path` is disabled until a guess exists
- `Retry same forces` clears the guess and hides the answer, but keeps the same forces
- `New round` generates a new challenge in the current level

### 10.4 Readouts Group

Keep readouts compact and minimal.

Required rows:

- `Level`
- `Forces`
- `Round`
- `Last result`

Before any result, `Last result` should show `—`.

### 10.5 Resultant Group

This group is required and is part of the teaching model.

Before the shot:

- show a placeholder such as `Test the path to reveal the net force.`

After the shot:

- show a small head-to-tail construction card
- show the same colored force arrows arranged tip-to-tail
- show one thicker green resultant from first tail to last head

This group is the visual proof that the arrows reduce to one force.

### 10.6 Info Group

Use short dynamic copy, not long paragraphs.

Canonical pre-shot info:

- `All arrows push through the centre. The puck starts from rest.`

Canonical post-shot info:

- `Because the puck started from rest, it first moved along the net force.`

## 11. Canonical State Model

The implementing agent does not have to use these exact property names, but the app should clearly support this state model:

```js
state = {
  lang: "en" | "pl",
  level: 1 | 2 | 3,
  vectorCount: 2 | 3 | 4,
  roundNumber: number,
  forces: [{ mag, angleDeg, x, y, color, label }],
  resultant: { x, y, mag, angleDeg },
  guessAngleDeg: number | null,
  guessPoint: { x, y } | null,
  phase: "aim" | "revealing" | "resolved",
  lastResult: "perfect" | "close" | "far" | "miss" | null
}
```

## 12. Physics And Math Rules

### 12.1 Force Model

For each round:

- each visible force is a 2D vector
- net force is `R = ΣF`
- the puck’s acceleration direction is the direction of `R`

### 12.2 Coordinate Model

The implementing agent may use internal math coordinates or canvas coordinates, but the result must be consistent.

Required outcome:

- every rendered arrow direction
- every guess angle
- every scoring angle
- every reveal angle

must refer to the same directional system.

### 12.3 Resultant Computation

Use vector addition by components:

- `Rx = Σ(Fi * cos θi)`
- `Ry = Σ(Fi * sin θi)`
- `|R| = hypot(Rx, Ry)`
- `angle = atan2(Ry, Rx)`

### 12.4 Order Independence

The answer must not depend on arrow order.

This means:

- force list order may define color labels and reveal order
- force list order must never change the physics

### 12.5 Zero-Net-Force Rule

Do not generate rounds with:

- zero resultant
- effectively zero resultant

Reason:

- the core challenge is directional prediction
- equilibrium rounds produce no ring crossing and do not match the game brief

### 12.6 Motion Reveal Rule

The puck’s reveal motion must:

- start from rest visually
- remain on a straight ray
- accelerate rather than jump to constant speed immediately

Required implementation behavior:

- use an `ease-in` motion that visually matches `s ∝ t²`

The reveal does not need to preserve exact travel time differences by magnitude, but it must preserve the correct straight-line direction and the feeling of acceleration from rest.

## 13. Prediction Input Model

### 13.1 Pointer Input

Pointer behavior must be:

1. Child taps or clicks anywhere on the board.
2. The app computes the angle from board centre to pointer.
3. The app places the guess marker on the prediction ring at that angle.
4. If the child drags, the marker updates continuously around the ring.

### 13.2 Why Snap To Ring

This is required, not optional.

It keeps:

- the task purely directional
- the tolerance fair
- the scoring simple
- the board uncluttered

### 13.3 Keyboard Input

Keyboard support is required.

Canonical keyboard behavior:

- `Left Arrow`: rotate guess marker counterclockwise by `2°`
- `Right Arrow`: rotate guess marker clockwise by `2°`
- `Shift + Arrow`: fine adjustment by `0.5°`
- `Enter` or `Space`: test path
- `R`: retry same forces
- `N`: new round
- `1`, `2`, `3`: switch levels

If no guess exists yet and the board has keyboard focus:

- first arrow press should create a default guess at `0°` and then rotate from there

## 14. Round Generation Rules

This section must be followed closely.

### 14.1 Global Generation Rules

All generated rounds must obey:

- force magnitudes are whole-number values from `2` to `6`
- force directions come from a `30°` grid:
  `0, 30, 60, ..., 330`
- no duplicate force directions in the same round
- no resultant magnitude below `1.8`
- no round where all forces lie in the same `90°` sector

### 14.2 Level 1 Rules

Level 1 is about learning how two arrows combine.

Exact rules:

- use exactly `2` forces
- the smallest circular separation between the two directions must be between `60°` and `150°`
- do not allow exact opposites
- resultant magnitude must be at least `2.5`

Intent:

- teach clear diagonal joining and partial cancellation
- avoid trivial same-direction addition
- avoid near-stalled results

### 14.3 Level 2 Rules

Level 2 introduces a third vector and one stronger cancellation idea.

Exact rules:

- use exactly `3` forces
- at least one pair must have a smallest circular separation between `120°` and `180°`
- resultant magnitude must be at least `2.0`
- reject rounds where the resultant lies within `8°` of any one individual force direction

Intent:

- the answer should not usually look like “just follow the biggest arrow”

### 14.4 Level 3 Rules

Level 3 must feel meaningfully harder because four vectors can nearly balance.

Exact rules:

- use exactly `4` forces
- at least one pair must have a smallest circular separation between `150°` and `180°`
- that near-opposition pair should have magnitudes differing by at most `1`
- at least one remaining vector must sit at least `30°` off that pair’s axis
- resultant magnitude must be at least `2.0`

Intent:

- create cases where two arrows almost cancel and the leftover direction is determined by the remaining pair

### 14.5 Generator Implementation Requirement

Use rejection sampling with a hard cap on attempts.

Required attempt cap:

- `200` attempts per new round before falling back to an authored set

If a valid random round is not found after the attempt cap:

- fall back to a small authored round bank for that level

That is better than allowing a weak or ambiguous round.

## 15. Authored Fallback / QA Vector Sets

These sets are also mandatory QA cases.

### 15.1 Level 1 Validation Set

- `4 @ 0°`
- `3 @ 90°`

Expected resultant:

- magnitude `5.0`
- direction `36.87°`

### 15.2 Level 2 Validation Set

- `6 @ 0°`
- `4 @ 120°`
- `2 @ 240°`

Expected resultant:

- magnitude `3.464`
- direction `30.0°`

### 15.3 Level 3 Validation Set

- `5 @ 0°`
- `4 @ 90°`
- `3 @ 180°`
- `2 @ 270°`

Expected resultant:

- magnitude `2.828`
- direction `45.0°`

## 16. Scoring Rules

### 16.1 Scoring Radius

Score only at the prediction ring.

Required computation:

- compute the true ring-cross point from the resultant angle
- compute the child’s guessed ring point from the guess angle
- compare the angular difference, not free-space nearest distance

### 16.2 Angular Error Formula

Use the smallest absolute angular difference around the circle.

Equivalent implementation logic:

```js
delta = Math.abs((((guess - actual + 540) % 360) - 180));
```

### 16.3 Exact Result Thresholds

These thresholds are mandatory:

- `Perfect hit`: `delta <= 4°`
- `Close hit`: `4° < delta <= 8°`
- `Far hit`: `8° < delta <= 12°`
- `Miss`: `delta > 12°`

Do not vary these thresholds by level.

Difficulty should come from vector count, not from secretly changing the tolerance.

### 16.4 Visual Wedge Requirement

After the shot, reveal three nested triangular sectors centered on the true resultant direction:

- inner sector = perfect
- middle sector = close
- outer sector = far

The child’s marker should visibly land:

- inside one of those sectors
- or outside them all in a miss

This visual wedge is a direct requirement from the product brief.

## 17. Reveal Sequence

The reveal sequence should be consistent every round.

### 17.1 Required Order

1. Lock input.
2. Grow the green net-force arrow from the centre.
3. Start the puck motion.
4. Show the actual path ray.
5. Mark the real ring-cross point.
6. Show the tolerance wedges.
7. Update the side-panel resultant card.
8. Show the full-screen result overlay.

### 17.2 Motion Style

The reveal should feel crisp and physical.

Required qualities:

- no laggy easing
- no cartoon bounce
- no path wobble
- visible acceleration from rest

### 17.3 Persisted Post-Shot Board

After the overlay is dismissed:

- keep the resolved board visible
- keep the green resultant visible
- keep the head-to-tail card visible

Reason:

- the child should be able to study why the answer was right

## 18. Result Overlay Specification

Use the same general overlay pattern as `flipandburn.html`:

- full-screen
- colour-washed background
- big central icon or emoji
- strong result line
- smaller supporting line
- click or tap to dismiss

### 18.1 Canonical Result Text

Use these exact English result titles:

- `Perfect hit`
- `Close hit`
- `Far hit`
- `Miss`

### 18.2 Overlay Supporting Text

The overlay should also show:

- `Off by X°`

Example:

- `Off by 6°`

This is the most compact and meaningful supporting metric.

### 18.3 Overlay Colours

Use the existing app language:

- perfect = green
- close = blue
- far = amber
- miss = red

### 18.4 Overlay Dismiss Behavior

After dismiss:

- return to the resolved board state
- do not silently generate a new round

The child or teacher must remain able to study the answer before choosing `Retry same forces` or `New round`.

## 19. Visual Design Direction

### 19.1 Theme

Use the repo’s light physics-lab family:

- warm paper background
- compact scientific side panel
- crisp line art
- restrained but saturated force colors

### 19.2 Typography

Use the standard repo font pair:

- `Outfit`
- `Share Tech Mono`

### 19.3 Board Feel

The board should feel:

- calm
- precise
- diagrammatic
- intentional

It must not feel:

- toy-store neon
- clip-art heavy
- worksheet-like
- space-game dark

### 19.4 Visual Details That Should Appear

- faint ring tick marks
- subtle radial or geometric construction background
- soft shadow or edge treatment on the puck
- clear arrowheads
- readable labels
- obvious green resultant after reveal

### 19.5 Visual Details That Must Not Appear

- Cartesian axis labels dominating the board
- long formulas on the main board
- fake 3D perspective
- decorative explosions
- unrelated mascot graphics

## 20. Canonical English Copy

The implementing agent may refine punctuation, but the wording intent should stay very close.

Required labels:

- `Level`
- `Mission`
- `Controls`
- `Readouts`
- `Resultant`
- `Info`
- `Forces`
- `Round`
- `Last result`

Required buttons:

- `Test path`
- `Retry same forces`
- `New round`

Required info lines:

- `All arrows push through the centre. The puck starts from rest.`
- `Because the puck started from rest, it first moved along the net force.`

## 21. Localization Requirements

- English and Polish are required
- use the same single-button language toggle pattern as the other apps
- all child-facing strings, labels, prompts, buttons, overlay text, and accessibility text must be localized
- angle formatting may stay numeric in both languages

## 22. Accessibility Requirements

### 22.1 Input Access

- full pointer support
- full keyboard support
- obvious focus states

### 22.2 Non-Color Cues

Color must not be the only cue.

Required redundant cues:

- arrow labels `F1`, `F2`, `F3`, `F4`
- text result labels
- visible marker and wedge geometry

### 22.3 Screen Reader Support

Minimum accessible labels:

- board
- level buttons
- control buttons
- language button

After a result, announce a compact summary such as:

- `Close hit. Your guess was 7 degrees away from the net force.`

### 22.4 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- remove overlay pop animation
- remove nonessential motion effects
- keep the reveal understandable with short fades or immediate state changes

## 23. Mobile Requirements

Under small widths:

- board must remain first
- panel must stack below
- touch targets should be at least approximately `40px`
- the prediction ring and puck must stay visually comfortable and not cramped
- side panel groups may wrap, but the board must remain the star of the page

Do not let the mobile layout collapse into a narrow list with a tiny board.

## 24. Explicit Non-Goals

The first implementation should not include:

- draggable force creation
- editable magnitudes by the child
- explore mode
- torque lessons
- friction lessons
- score-gated campaign progression
- leaderboards
- sound effects

## 25. QA Acceptance Tests

### 25.1 Scientific Acceptance

The app fails review if any of the following are false:

- all force arrows act through the centre
- the puck starts from rest every round
- the revealed motion is a straight ray along the resultant
- the answer is derived from vector addition, not from largest-arrow heuristics

### 25.2 Scoring Acceptance Using The Level 1 Validation Set

Given:

- actual angle `36.87°`

Expected results:

- guess `40°` -> `Perfect hit`
- guess `44°` -> `Close hit`
- guess `48°` -> `Far hit`
- guess `50°` -> `Miss`

### 25.3 Scoring Acceptance Using The Level 3 Validation Set

Given:

- actual angle `45.0°`

Expected results:

- guess `48°` -> `Perfect hit`
- guess `52°` -> `Close hit`
- guess `56°` -> `Far hit`
- guess `60°` -> `Miss`

### 25.4 UX Acceptance

The app fails review if:

- the child can test with no guess placed
- the app hides the correct answer immediately after overlay dismiss
- the board becomes unreadable on mobile
- the level buttons do not clearly map to `2 / 3 / 4` vectors

## 26. Source Links

These sources were used to lock the scientific model behind this handoff.

- OpenStax, `Newton’s Second Law`: https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law
- OpenStax, `Motion Equations for Constant Acceleration in One Dimension`: https://openstax.org/books/college-physics-2e/pages/2-5-motion-equations-for-constant-acceleration-in-one-dimension
- OpenStax, `Vector Addition and Subtraction: Graphical Methods`: https://openstax.org/books/physics/pages/5-1-vector-addition-and-subtraction-graphical-methods
- NASA Glenn Research Center, `Equilibrium`: https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/equilibrium/
- OpenStax, `Torque`: https://openstax.org/books/university-physics-volume-1/pages/10-6-torque

### 26.1 Source-Derived Conclusions Used Here

Directly supported by sources:

- net force is the vector sum of external forces
- acceleration points in the direction of net force
- head-to-tail vector addition yields the resultant
- torque matters when force application is not purely concurrent

Inference used by this spec:

- because this app starts the puck from rest and keeps the net force constant during the reveal, the initial motion path may be shown as a straight ray along the resultant direction

That inference is the correct simplification for this product and is why the app must not allow nonzero initial velocity or off-centre forces.
