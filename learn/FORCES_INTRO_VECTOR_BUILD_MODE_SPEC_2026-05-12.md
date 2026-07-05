# Forces: Intro Vector-Build Mode Spec

## 0. Status Of This Document

This document is the canonical addendum for adding an interactive vector-construction mode to the existing intro in [`forces.html`](/Users/llepecki/Projects/llepecki.github.io/learn/forces.html).

It is written against the current app state as of `2026-05-12`, where:

- `forces.html` already has a working intro mode
- the intro currently uses `9` steps
- the intro already teaches static head-to-tail addition
- the intro already contains a dedicated panel, intro-only state, and intro-only board rendering

This document does not replace the whole intro spec.

It overrides only the parts that are necessary to add the new interactive vector-building experience.

If this document conflicts with:

- [FORCES_INTRO_MODE_SPEC_2026-05-11.md](/Users/llepecki/Projects/llepecki.github.io/learn/FORCES_INTRO_MODE_SPEC_2026-05-11.md)

then this document wins for:

- intro step sequence
- Step `7`
- intro control mapping
- intro input routing
- intro builder rendering and state

## 1. Purpose

The current intro explains vector addition.

The new mode must let the child perform vector addition.

The teaching goal is:

- the child sees that each force arrow can be copied into a construction space
- the child places each new tail on the previous head
- the child sees that the green resultant runs from the first tail to the last head
- the child sees that a different order still gives the same resultant

This is not a quiz.

This is not a scoring activity.

This is not free-play vector drawing.

It is a guided construction tool inside intro mode.

## 2. Scientific Guardrails

The implementing agent must preserve these distinctions exactly.

### 2.1 What The Mode May Teach

The mode may teach:

- a force is a vector with magnitude and direction
- vectors can be added graphically with the head-to-tail method
- the resultant is drawn from the first tail to the last head
- the order of vector addition does not change the resultant
- in this app, the green arrow is the net force

### 2.2 What The Mode Must Clarify

The draggable arrows in the construction space are graphical copies.

They are not new physical forces acting at new places on the puck.

The intro must remain honest about this:

- on the puck, the original forces still act through the center
- in the construction workspace, the child is arranging copies of those vectors to find the sum

### 2.3 What The Mode Must Not Imply

Do not imply:

- that the child is physically dragging the real forces around the puck
- that a force on a rigid body can always be moved anywhere with no consequence
- that head-to-tail construction is a different force law from vector addition
- that the longest arrow automatically wins

### 2.4 Translation Rule For The Builder

The builder mode must teach translation only.

Each draggable vector must keep:

- its length
- its direction
- its label
- its color

The child may slide the vector.

The child may not:

- rotate it
- resize it
- flip it

## 3. Product Decision

Keep the intro at exactly `9` steps.

Do not expand the intro to `10` or more steps.

Instead:

- replace the current static Step `7` with a new interactive step
- keep Steps `1-6` in their existing teaching roles
- keep Steps `8-9` in their existing teaching roles

This keeps the intro compact while adding one hands-on construction moment.

## 4. Updated Intro Sequence

Use this exact step list:

1. `The Puck`
2. `One Force Arrow`
3. `Through The Centre`
4. `Same Direction Adds`
5. `Opposite Directions Cancel`
6. `Angled Forces Add Head-To-Tail`
7. `Build The Net Force`
8. `From Net Force To Motion`
9. `How The Game Works`

Strict change:

- the old Step `7` (`Order Does Not Matter`) is removed as a standalone static scene
- its learning goal is absorbed into the new Step `7` interactive builder

## 5. Exact Step 7 Spec

### 5.1 ID

- `build-resultant`

### 5.2 Title

- EN: `Build the net force`
- PL: `Zbuduj siłę wypadkową`

### 5.3 Commentary

Use this exact copy.

EN:

`Now build the sum yourself. These draggable arrows are copies of the same forces, so you may slide them without turning them or changing their length.`

`Place each tail on the glowing head. When the chain is complete, the green arrow from start to finish is the net force. Reset and try another order: the green answer stays the same.`

PL:

`Teraz zbuduj sumę samodzielnie. Te przeciągane strzałki są kopiami tych samych sił, więc możesz je przesuwać bez obracania i bez zmiany ich długości.`

`Połóż każdy ogon na świecącej głowie. Gdy łańcuch będzie gotowy, zielona strzałka od początku do końca pokaże siłę wypadkową. Ułóż wektory jeszcze raz w innej kolejności: zielona odpowiedź pozostanie taka sama.`

### 5.4 Step Intent

This step must do three jobs at once:

1. let the child perform the head-to-tail method
2. keep the construction visually linked to the puck forces
3. show that order does not matter by letting the child rebuild in another order

### 5.5 Step Behavior

Step `7` is interactive, but it must remain skippable.

Strict requirements:

- `Next` remains available even if the child never completes the builder
- there is no pass/fail overlay
- there is no score
- there is no wrong-result message

If the child drops a vector incorrectly, the vector simply returns to its dock.

## 6. Step 7 Board Structure

Step `7` uses three visible board zones:

1. reference zone
2. construction zone
3. vector dock

Do not collapse these into one ambiguous pile of arrows.

The child must be able to clearly distinguish:

- the original forces on the puck
- the draggable copies used for construction

### 6.1 Reference Zone

Purpose:

- show the original forces on the puck
- preserve the through-center teaching model

Content:

- puck at center of the reference zone
- center dot visible
- authored force set visible on the puck
- no ring
- no motion
- no wedges

Rendering rule:

- reference vectors use the normal intro force colors and labels
- reference vectors are slightly dimmer than the draggable copies
- reference puck scene is not draggable

### 6.2 Construction Zone

Purpose:

- provide the interactive head-to-tail workspace

Content:

- a faint workspace card or framed construction area
- a visible `Start` anchor
- one active open anchor at a time
- placed vector copies
- the green resultant only when the chain is complete

The construction zone must feel larger than the old inset.

Do not implement this as another tiny corner inset.

### 6.3 Vector Dock

Purpose:

- hold the unused draggable vector copies

Content:

- one dock item per vector in the current scenario
- same color, label, direction, and length as its reference vector
- large enough touch hit area around each arrow

Unused vectors live in the dock.

Placed vectors leave the dock and join the chain.

## 7. Step 7 Layout Rules

### 7.1 Desktop / Wide Layout

When the usable canvas width is `>= 760px`:

- reference zone uses roughly the left `34%` of the board
- construction zone uses roughly the right `66%` of the board
- vector dock sits along the lower edge of the construction zone

Construction-zone rule:

- the workspace must be large enough that the child can visually track each head and tail without overlap confusion

### 7.2 Narrow / Mobile Layout

When the usable canvas width is `< 760px`:

- reference zone moves to the top portion of the board
- construction zone fills the middle portion
- vector dock sits below the construction zone

Target vertical split:

- top `30%`: reference zone
- middle `48%`: construction zone
- bottom `22%`: dock

The construction zone must keep priority over the reference zone on small screens.

If space gets tight:

- shrink the reference puck first
- do not shrink the interactive construction zone below usability

## 8. Builder Scenarios

Use exactly `2` authored builder scenarios.

Do not randomize them.

Do not generate new force sets.

### 8.1 Scenario A

ID:

- `builder-two-angle`

Child-facing label:

- EN: `2 vectors`
- PL: `2 siły`

Force set:

- `F1 = 4 @ 0°`
- `F2 = 4 @ 90°`

Resultant:

- magnitude `sqrt(4^2 + 4^2)`
- angle `45°`

Purpose:

- first hands-on diagonal resultant
- simplest successful construction

### 8.2 Scenario B

ID:

- `builder-three-order`

Child-facing label:

- EN: `3 vectors`
- PL: `3 siły`

Force set:

- `F1 = 4 @ 0°`
- `F2 = 4 @ 90°`
- `F3 = 4 @ 180°`

Resultant:

- magnitude `4`
- angle `90°`

Purpose:

- show that the child can build a three-vector chain
- show partial cancellation inside a longer chain
- support the “order does not matter” lesson through repeated rebuilds

### 8.3 Default Scenario

On first entering Step `7`:

- default to Scenario A

When the child switches scenarios:

- reset the chain completely
- clear any built resultant
- repopulate the dock

## 9. Exact Step 7 Interaction Model

### 9.1 What Is Draggable

Only the dock vectors are draggable.

The reference puck scene is never draggable.

The placed chain is not freeform editable after placement.

### 9.2 Placement Model

Use a single-chain model.

There is only one valid open anchor at a time:

- if no vectors have been placed: the `Start` anchor
- otherwise: the head of the last placed vector

This is strict.

Do not allow branching chains.

Do not allow multiple open anchors.

### 9.3 Drop Rule

When the child releases a dragged vector:

- if the vector’s tail is within snap radius of the current open anchor, snap it exactly
- otherwise, animate it back to its dock slot

Snap radius:

- `18` CSS px minimum
- `24` CSS px on touch-dominant small layouts is allowed if needed for usability

### 9.4 Placement Locking

Once a vector is snapped into the chain:

- it is considered placed
- it no longer returns to the dock automatically
- it may not be individually re-dragged

To try a different order, the child must use:

- `Reset chain`

Do not implement mid-chain extraction or branch repair.

That adds complexity with little teaching value.

### 9.5 Completion Rule

When all scenario vectors are placed:

- mark the builder as complete
- draw the green resultant from the first tail to the final head
- show a small board label near the green arrow tip

Board label:

- EN: `net force`
- PL: `siła wypadkowa`

The green resultant must not appear before the chain is complete.

### 9.6 Retry Rule

The child must be able to rebuild easily.

Required behavior:

- `Reset chain` returns every vector to the dock
- `Reset chain` clears the green resultant
- `Reset chain` restores the `Start` anchor as the active anchor

No confirmation dialog.

## 10. Exact Step 7 Controls

Step `7` replaces the old `Shuffle order` control with builder-specific controls.

The intro controls area for Step `7` must contain exactly these visible controls:

1. scenario segmented control
2. reset button
3. keyboard-access fallback buttons row

### 10.1 Scenario Segmented Control

Labels:

- EN: `2 vectors`, `3 vectors`
- PL: `2 siły`, `3 siły`

Behavior:

- changing scenario immediately resets the chain
- current scenario button is visually active

### 10.2 Reset Button

Labels:

- EN: `Reset chain`
- PL: `Ułóż od nowa`

Behavior:

- resets the current builder scenario
- does not change intro step

### 10.3 Keyboard-Access Fallback Buttons

Because canvas dragging is not sufficient accessibility on its own, Step `7` must also expose placement buttons.

Required button labels:

- EN: `Place F1`, `Place F2`, `Place F3`
- PL: `Połóż F1`, `Połóż F2`, `Połóż F3`

Behavior:

- only show buttons for vectors present in the current scenario
- when activated, the chosen unused vector snaps to the current open anchor
- once a vector is already placed, its button becomes disabled

This row is a required fallback, not an optional enhancement.

## 11. Exact Step 7 Visual Rules

### 11.1 Shared Scale

Within a given scenario, the draggable copies and the green resultant must use one consistent scale.

That scale must match the largest magnitude present in the current scenario or its resultant.

### 11.2 Active Anchor

The active open anchor must be visually obvious.

Required appearance:

- small circular target
- subtle glow or pulse
- brighter than inactive joint dots

Under reduced motion:

- show a static highlighted ring
- do not pulse

### 11.3 Joint Dots

Each snapped head-to-tail joint should leave a small dot.

Purpose:

- make the chain structure easy to read

### 11.4 Reference vs Construction Contrast

The child must not confuse the puck arrows with the draggable copies.

Required contrast:

- reference puck arrows: slightly muted opacity
- construction copies: full opacity
- construction zone card: distinct but subtle background

### 11.5 Resultant Styling

When complete:

- the green resultant is thicker than the force copies
- the green resultant starts at the `Start` anchor
- the green resultant ends exactly at the final chain head

Do not offset the green resultant off the chain axis.

## 12. Input Routing

The current intro blocks normal board interaction.

That rule remains true except for Step `7`.

Required routing:

1. if intro is active and current step is `build-resultant`, route canvas pointer events to builder handlers
2. else if intro is active, keep current intro behavior
3. else use normal game input behavior

Do not let Step `7` dragging leak into:

- guess placement
- level switching behavior
- game reveal logic

## 13. State Model Additions

Extend intro scene state with builder-specific fields.

Recommended shape:

```js
state.introSceneState = {
  builderScenarioId,
  builderOrder,
  builderPlaced,
  builderComplete,
  builderDrag,
  replayStart,
  demoStart
}
```

Required meanings:

- `builderScenarioId`: active scenario id
- `builderOrder`: array of vector indices in placed order
- `builderPlaced`: placement data for each snapped vector
- `builderComplete`: whether the chain is complete
- `builderDrag`: transient drag state or `null`

Recommended placement shape:

```js
builderPlaced: {
  [vectorIdx]: {
    tailX,
    tailY,
    headX,
    headY,
    orderSlot
  }
}
```

Do not store builder geometry in scattered globals.

## 14. Data Model Requirements

### 14.1 Step Config

Replace the old Step `7` config entry with:

```js
{
  id: "build-resultant",
  titleKey: "introStep7Title",
  bodyKey: "introStep7Body",
  controlType: "vectorBuilder",
  ringVisible: false,
  hasBuilder: true,
  initialSceneState: {
    builderScenarioId: "builder-two-angle",
    builderOrder: [],
    builderPlaced: {},
    builderComplete: false,
    builderDrag: null
  }
}
```

### 14.2 Scenario Data

Create a dedicated authored scenario table.

Required shape:

```js
const INTRO_VECTOR_BUILDER_SCENARIOS = {
  "builder-two-angle": { ... },
  "builder-three-order": { ... }
};
```

Each scenario entry must contain at least:

- `id`
- `labelKey`
- `forces`
- `resultantAngleDeg`
- `resultantMag`

## 15. Required Functions

Implement or equivalent:

- `resetIntroVectorBuilder()`
- `setIntroVectorBuilderScenario(id)`
- `computeIntroVectorBuilderLayout()`
- `getIntroBuilderActiveAnchor()`
- `hitTestIntroBuilderVector(x, y)`
- `startIntroBuilderDrag(e)`
- `moveIntroBuilderDrag(e)`
- `endIntroBuilderDrag(e)`
- `placeIntroBuilderVector(vectorIdx)`
- `renderIntroVectorBuilderControls()`
- `drawIntroVectorBuilderScene()`

Do not bury Step `7` interaction inside one giant generic intro render block.

## 16. Rendering Rules For Step 7

When Step `7` is active:

1. draw background
2. draw reference zone
3. draw construction zone frame
4. draw start anchor
5. draw already placed chain vectors
6. draw active anchor
7. draw dock vectors
8. draw drag vector on top if dragging
9. draw green resultant only if complete

Rendering order matters.

The dragged vector must always appear above:

- the dock
- the workspace frame
- the reference zone

## 17. Localization Requirements

Update these intro keys:

- `introStep7Title`
- `introStep7Body`

Add these new keys:

- `introBuilderScenario2`
- `introBuilderScenario3`
- `introBuilderReset`
- `introBuilderPlaceF1`
- `introBuilderPlaceF2`
- `introBuilderPlaceF3`
- `introBuilderStart`
- `introBuilderNetLabel`

Exact values:

EN:

- `introBuilderScenario2`: `2 vectors`
- `introBuilderScenario3`: `3 vectors`
- `introBuilderReset`: `Reset chain`
- `introBuilderPlaceF1`: `Place F1`
- `introBuilderPlaceF2`: `Place F2`
- `introBuilderPlaceF3`: `Place F3`
- `introBuilderStart`: `Start`
- `introBuilderNetLabel`: `net force`

PL:

- `introBuilderScenario2`: `2 siły`
- `introBuilderScenario3`: `3 siły`
- `introBuilderReset`: `Ułóż od nowa`
- `introBuilderPlaceF1`: `Połóż F1`
- `introBuilderPlaceF2`: `Połóż F2`
- `introBuilderPlaceF3`: `Połóż F3`
- `introBuilderStart`: `Początek`
- `introBuilderNetLabel`: `siła wypadkowa`

## 18. Accessibility Requirements

### 18.1 Keyboard

Step `7` must be usable without pointer dragging.

Required path:

- scenario toggle reachable by keyboard
- reset button reachable by keyboard
- placement buttons reachable by keyboard

The fallback path must allow a keyboard user to:

1. choose a scenario
2. place all vectors in any order
3. complete the chain
4. reset and try again

### 18.2 Screen Reader

Add a polite live announcement for builder completion.

Exact messages:

- EN: `Net force built.`
- PL: `Zbudowano siłę wypadkową.`

Optional additional announcements are acceptable, but this completion message is required.

### 18.3 Focus

Do not move focus into the canvas automatically when Step `7` loads.

Keep the normal intro panel focus model.

## 19. Reduced Motion Requirements

When reduced motion is active:

- invalid drops return immediately or with a minimal fade only
- active anchor does not pulse
- green resultant appears immediately on completion
- no decorative bounce on dock vectors

The builder must stay understandable without motion.

## 20. Out Of Scope

Do not add:

- numeric vector-entry fields
- free rotation handles
- drawing arbitrary custom vectors
- scoring or stars for the builder
- failure overlays
- extra intro steps
- random builder problems
- formulas panel

This is an intro construction tool, not a full vector-lab app.

## 21. Acceptance Criteria

The implementation is acceptable only if all of the following are true:

1. Intro still has exactly `9` steps.
2. Step `7` is now an interactive builder, not the old static shuffle-order scene.
3. Step `7` shows a fixed puck-reference zone and a separate construction zone.
4. The child can drag vectors from the dock into a head-to-tail chain.
5. Dragging translates vectors only; it does not rotate or resize them.
6. Only one open snap anchor exists at a time.
7. Invalid drops return the vector to the dock.
8. The green resultant appears only after all scenario vectors are placed.
9. `Reset chain` fully clears the current construction.
10. Scenario switching resets the current construction.
11. Scenario A uses exactly `4 @ 0°` and `4 @ 90°`.
12. Scenario B uses exactly `4 @ 0°`, `4 @ 90°`, and `4 @ 180°`.
13. Step `7` commentary explicitly says the draggable arrows are copies of the same forces.
14. The child can rebuild Scenario B in a different order and still see the same green resultant.
15. EN pass.
16. PL pass.
17. Keyboard fallback pass.
18. Reduced-motion pass.
19. Mobile pass.
20. Normal gameplay still works unchanged outside intro.

## 22. Verification Suggestions For The Implementing Agent

Minimum verification:

1. open intro
2. go to Step `7`
3. complete Scenario A by drag
4. reset Scenario A
5. complete Scenario A with keyboard fallback buttons
6. switch to Scenario B
7. complete Scenario B in one order
8. reset Scenario B
9. complete Scenario B in a different order
10. verify the same green resultant appears
11. switch language to Polish and repeat Step `7`
12. verify reduced-motion behavior
13. verify narrow-screen layout
14. verify Step `8` and Step `9` still behave correctly after leaving Step `7`
15. run:

`npm run code-review -- forces.html`

## 23. Scientific Sources

These sources support the science claims behind this builder mode:

- OpenStax, `5.1 Vector Addition and Subtraction: Graphical Methods`
  https://openstax.org/books/physics/pages/5-1-vector-addition-and-subtraction-graphical-methods
- OpenStax, `5.3 Newton’s Second Law`
  https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law
- OpenStax, `5.7 Drawing Free-Body Diagrams`
  https://openstax.org/books/university-physics-volume-1/pages/5-7-drawing-free-body-diagrams

## 24. Source-Derived Claims Used In This Spec

Directly supported:

- vectors may be added graphically head-to-tail
- the resultant runs from the first tail to the final head
- vector addition is order-independent
- net force determines acceleration direction

Required implementation inference:

- because this app shows forces on a puck through the center but uses a separate construction area for vector copies, the builder may honestly let the child slide copied vectors in the workspace without claiming that the child is physically moving the real forces on the puck
