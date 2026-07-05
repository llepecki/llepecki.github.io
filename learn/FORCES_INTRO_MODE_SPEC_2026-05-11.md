# Forces: Intro Mode Spec

## 0. Status Of This Document

This is the canonical spec for adding an `Intro` mode to [`forces.html`](/Users/llepecki/Projects/llepecki.github.io/learn/forces.html).

Its purpose is to give the implementing agent one strict product, science, interaction, and implementation spec for the intro mode.

If the implementing agent and reviewer disagree about intent, this document wins.

This spec is written against the current app state, where:

- `forces.html` already exists
- the app is game-first
- the app currently exposes `Level 1` through `Level 7`
- the board already renders a puck, force arrows, a prediction ring, wedges, and a post-shot resultant card

## 1. Purpose

The intro mode exists to add scientific value before the child enters the game.

The game already trains recognition.

The intro must build understanding.

The intro should help a child answer these questions before they start playing:

1. What does a force arrow mean?
2. Why does arrow length matter?
3. Why does arrow direction matter?
4. How do forces combine when they point the same way?
5. How do forces combine when they point opposite ways?
6. How do angled forces combine?
7. Why can several forces be replaced by one net force in this app?
8. Why does the puck move along the green arrow in this app?
9. What exactly is the player supposed to predict in the game?

The intro is successful if the child enters the game with the right mental model:

- forces are vectors
- the green arrow is the combined push
- the game is about predicting that combined push before it is revealed

## 2. Scientific Foundation

The intro mode must explicitly align with the app’s simplified but honest physics model.

### 2.1 Canonical Model

The intro must teach these claims:

- a force has `size` and `direction`
- forces add as vectors
- the `net force` is the vector sum of all forces
- in this app, all pushes act through the center of the puck
- in this app, the puck starts from rest
- in this app, the forces stay constant during the reveal
- in this app, friction is ignored
- therefore, in this app, the puck first moves along the direction of the net force

### 2.2 Claims The Intro Must Not Make

Do not imply:

- the biggest arrow alone decides the answer
- the net force always tells the direction of velocity for any already-moving object
- any arbitrary force system on any rigid body can always be replaced by one force
- balanced forces mean “there are no forces”

### 2.3 Scientific Dependency On Existing Review

The intro mode must follow the scientific-review direction already identified for `forces.html`.

That means intro rendering must satisfy all of the following:

1. The green `net force` arrow must be drawn to the actual resultant magnitude using the same scale semantics as the input force arrows.
2. The through-center line of action must be visually clear.
3. The wording must match the actual geometry being scored:
   - use `reach the ring first` or `touch the ring first`
   - do not reintroduce `cross the ring` language unless the geometry changes

If normal game mode still violates any of those rules, the intro implementation must at minimum render them correctly in intro scenes, and should preferably factor the corrected behavior back into the shared board primitives.

## 3. Product Direction

The intro should behave much more like `feedbacktank.html` than like a tooltip tour.

That means:

- one dedicated intro panel
- one calm step at a time
- board-first explanation
- small interactions only where they genuinely clarify an idea
- a clear exit into normal play

It must not feel like:

- a wall of text
- a modal covering the board
- a mission checklist
- a quiz before the game

## 4. Non-Negotiable Product Outcomes

The intro is successful only if all of the following are true:

1. The child sees force addition before the game asks them to guess it.
2. The board does most of the teaching work.
3. The intro uses a dedicated intro panel, not the regular panel copy blocks.
4. The intro is fully localised in English and Polish.
5. The intro can be re-opened at any time.
6. The intro auto-opens on first visit and can be skipped immediately.
7. The intro shows same-direction addition, opposite-direction cancellation, and angled addition.
8. The intro explicitly teaches that this app uses a no-friction, from-rest, through-center puck model.
9. The final intro step shows how the real game works.

## 5. Structural Model

### 5.1 Entry

Add a dedicated `Intro` button to the normal UI.

Strict requirement:

- the button must be visible when intro is not active
- the button must remain available after the first visit

Recommended placement:

- inside the existing `Controls` section as the first utility button
- keep it visually aligned with the current icon-only action style

Do not hide Intro in a menu.

### 5.2 First-Visit Behavior

Strict requirement:

- on first visit after this feature ships, intro auto-opens
- the child can exit immediately

Persist:

- `forcesIntroSeenV1`

Behavior:

1. if `forcesIntroSeenV1` is absent:
   - open intro automatically after app init
   - set `forcesIntroSeenV1 = "1"` as soon as intro opens
2. if present:
   - do not auto-open
   - allow manual re-entry via the Intro button

Do not auto-open intro again unless the key is version-bumped in a future redesign.

### 5.3 Intro-Active State

When intro is active:

- hide the normal panel sections
- show a dedicated intro panel
- keep the board visible
- suspend normal game progression UI
- hide the floating `playNowBtn`
- hide the normal canvas prompt
- suppress result overlays

Do not show:

- Level buttons
- Mission section
- normal Controls section
- Readouts
- Resultant section
- normal Info text

while intro is open.

### 5.4 Exit Behavior

The intro panel must contain:

- `Back` / `Exit`
- previous step
- next step
- step counter

On exit:

- restore the normal panel
- restore the previously active game state
- return focus to the Intro button if exit was pointer or keyboard driven from the panel

## 6. UI Structure

### 6.1 Dedicated Intro Panel

Mirror the broad structure used in `feedbacktank.html`.

The panel must contain, in this order:

1. intro section label
2. exit/back button
3. intro step title
4. intro commentary paragraph
5. prev / counter / next row
6. intro-specific controls area

Do not reuse the current normal panel sections by mutating their text.

### 6.2 Intro Panel Copy Style

Each step commentary must be:

- short
- concrete
- board-referential
- child-readable

Hard cap:

- maximum `2` short paragraphs or equivalent
- target roughly `1` to `3` sentences per step

Do not dump formulas in the panel.

### 6.3 Board Behavior

The board remains the main teaching surface.

For intro scenes:

- render only the relevant forces and overlays
- dim irrelevant elements
- use authored deterministic scenes
- avoid game randomness

### 6.4 Intro Controls Area

Like `feedbacktank.html`, some steps should expose one tiny control when helpful.

Allowed intro control types:

- two-state scene switch
- `Shuffle order`
- `Replay motion`
- `Start game`

Do not expose full level switching or normal retry/new-round controls during intro.

## 7. Implementation Architecture

### 7.1 Required State

Add:

```js
state.introActive
state.introStep
state.introSeen
state.introReturnState
state.introSceneState
```

Recommended meanings:

- `introActive: boolean`
- `introStep: number`
- `introSeen: boolean`
- `introReturnState`: snapshot of the normal game state to restore on exit
- `introSceneState`: tiny mutable state for intro-only controls and animations

### 7.2 Required Return Snapshot

When entering intro from normal mode, store at least:

```js
{
  level,
  vectorCount,
  roundNumber,
  forces,
  resultant,
  guessAngleDeg,
  phase,
  lastResult,
  lastDelta,
  authoredIndex
}
```

If the current app has additional state needed for exact restoration, include it.

### 7.3 Reveal-State Constraint

Do not allow intro entry during active reveal motion.

Required behavior:

- if `state.phase === "revealing"`, ignore or disable Intro entry

This avoids mixing intro state with in-flight animation state.

### 7.4 Data Model

Create a dedicated `INTRO_STEPS` data structure.

Required shape:

```js
const INTRO_STEPS = [
  {
    id,
    titleKey,
    bodyKey,
    scene,
    controlType,
    controlConfig,
    initialSceneState,
    cta
  }
];
```

Do not bury intro logic in a long hand-written `if (step === 1)` chain for text, visuals, and controls all mixed together.

Small scene branching is acceptable, but the step content itself must be data-driven.

### 7.5 Recommended Functions

Implement or equivalent:

- `enterIntro()`
- `exitIntro()`
- `setIntroStep(n)`
- `renderIntroPanel()`
- `renderIntroControls()`
- `renderIntroBoard()`
- `resetIntroSceneState(step)`

### 7.6 Rendering Branch

Recommended high-level branch:

```js
if (state.introActive) {
  renderIntroBoard();
} else {
  drawNormalGameBoard();
}
```

Do not try to make the intro piggyback entirely on the normal game board render path with dozens of scattered conditionals.

## 8. Intro Board Primitives

To keep the implementation manageable, build the intro from a small set of reusable board primitives.

Required reusable primitives:

- `drawIntroPuck()`
- `drawCenterDot()`
- `drawForceArrowScaled()`
- `drawResultantArrowScaled()`
- `drawDashedLineOfAction()`
- `drawHeadToTailInset()`
- `drawIntroRing()`
- `drawIntroGuessMarker()`
- `drawIntroCalloutChip()`
- `drawIntroDimMask()`
- `drawIntroMotionPath()`

You do not have to use these exact names, but the rendering architecture should clearly separate these concerns.

### 8.1 Shared-Scale Requirement

All intro scenes that show a green resultant must use one consistent scale for:

- input force arrows
- resultant arrow

That scale must be based on the largest magnitude shown in the current scene.

### 8.2 Through-Centre Visibility Requirement

All intro scenes must visibly make clear that the line of action passes through the puck center.

Required visual cue:

- a small center dot on the puck in intro mode

Preferred additional cue:

- faint dashed line-of-action extension through the center on the currently highlighted force

## 9. Exact Intro Sequence

Use exactly `9` intro steps.

The ordering is part of the product design and should not be changed casually.

## 10. Exact Step Specs

Each step below is strict.

### Step 1: The Puck

ID:

- `puck`

Title:

- EN: `The Puck`
- PL: `Krążek`

Commentary:

- EN:
  `This app uses a top-down puck. It starts each round at rest.`
  `We ignore friction here so we can focus on how pushes combine.`
- PL:
  `Ta aplikacja pokazuje krążek z góry. W każdej rundzie startuje on ze spoczynku.`
  `Pomijamy tutaj tarcie, żeby skupić się na tym, jak pchnięcia łączą się ze sobą.`

Board scene:

- draw puck at center
- draw small center dot
- no force arrows
- no ring
- no wedges
- no resultant
- background construction lines may remain subtle

Controls:

- none

### Step 2: One Force Arrow

ID:

- `one-force`

Title:

- EN: `One Force Arrow`
- PL: `Jedna Strzałka Siły`

Commentary:

- EN:
  `A force arrow tells you two things: its direction and its size.`
  `The arrow points where the push acts, and a longer arrow means a stronger push.`
- PL:
  `Strzałka siły mówi o dwóch rzeczach: o kierunku i o wielkości siły.`
  `Strzałka pokazuje, w którą stronę działa pchnięcie, a dłuższa strzałka oznacza silniejsze pchnięcie.`

Board scene:

- puck at center
- center dot visible
- one red force `F1`
- exact force:
  - magnitude `4`
  - angle `30°`
- show two callout chips:
  - EN `direction` / PL `kierunek` near arrowhead
  - EN `length = strength` / PL `długość = siła` near shaft
- no ring
- no resultant

Controls:

- none

### Step 3: Through The Centre

ID:

- `through-centre`

Title:

- EN: `Through The Centre`
- PL: `Przez Środek`

Commentary:

- EN:
  `In this app, every push acts through the centre of the puck.`
  `That is why we can ignore spinning here and focus only on the combined push.`
- PL:
  `W tej aplikacji każde pchnięcie działa przez środek krążka.`
  `Dlatego możemy pominąć obrót i skupić się tylko na pchnięciu wypadkowym.`

Board scene:

- puck at center
- center dot visible
- one red force `F1`
- exact force:
  - magnitude `4`
  - angle `0°`
- draw faint dashed extension of the force’s line of action through the puck center
- no ring
- no resultant

Controls:

- none

### Step 4: Same Direction Adds

ID:

- `same-direction`

Title:

- EN: `Same Direction Adds`
- PL: `Ten Sam Kierunek Się Dodaje`

Commentary:

- EN:
  `If two pushes point the same way, they add into one longer push in that same direction.`
  `Here the green arrow is the net force.`
- PL:
  `Jeśli dwa pchnięcia są skierowane tak samo, dodają się do jednej dłuższej strzałki w tym samym kierunku.`
  `Tutaj zielona strzałka to siła wypadkowa.`

Board scene:

- puck at center
- center dot visible
- force set:
  - `F1 = 4 @ 0°`
  - `F2 = 2 @ 0°`
- green resultant visible:
  - `R = 6 @ 0°`
- show a compact head-to-tail inset on the board
- no ring

Controls:

- none

### Step 5: Opposite Directions Cancel

ID:

- `opposite-cancel`

Title:

- EN: `Opposite Directions Cancel`
- PL: `Przeciwne Kierunki Się Znosią`

Commentary:

- EN:
  `Opposite pushes subtract. If they are equal, the net force is zero.`
  `Zero net force does not mean “no forces”. It means the forces balance.`
- PL:
  `Pchnięcia w przeciwnych kierunkach odejmują się od siebie. Jeśli są równe, siła wypadkowa wynosi zero.`
  `Zero siły wypadkowej nie znaczy „brak sił”. To znaczy, że siły się równoważą.`

Board scene:

- puck at center
- center dot visible
- two scene variants

Variant A `partial`:

- `F1 = 5 @ 0°`
- `F2 = 2 @ 180°`
- green resultant visible:
  - `R = 3 @ 0°`

Variant B `balanced`:

- `F1 = 4 @ 0°`
- `F2 = 4 @ 180°`
- no green resultant arrow
- show a small board label:
  - EN `net force = 0`
  - PL `siła wypadkowa = 0`

Controls:

- segmented two-state control in intro controls area
- EN labels:
  - `Partial`
  - `Balanced`
- PL labels:
  - `Częściowo`
  - `Równowaga`

Default variant:

- `partial`

### Step 6: Angled Forces Add Head-To-Tail

ID:

- `angled-addition`

Title:

- EN: `Angled Forces Add Head-To-Tail`
- PL: `Siły Pod Kątem Dodajemy Głowa Do Ogona`

Commentary:

- EN:
  `For angled pushes, slide one arrow so its tail meets the other arrow’s head.`
  `The green arrow from the first tail to the last head is the resultant.`
- PL:
  `Przy pchnięciach pod kątem przesuń jedną strzałkę tak, aby jej ogon spotkał się z głową drugiej.`
  `Zielona strzałka od pierwszego ogona do ostatniej głowy to wypadkowa.`

Board scene:

- puck at center
- center dot visible
- force set:
  - `F1 = 4 @ 0°`
  - `F2 = 4 @ 90°`
- green resultant visible
- large head-to-tail inset visible on the board
- inset must clearly show:
  - red arrow first
  - blue arrow second, tail at red head
  - green resultant from first tail to last head

Controls:

- none

### Step 7: Order Does Not Matter

ID:

- `order-does-not-matter`

Title:

- EN: `Order Does Not Matter`
- PL: `Kolejność Nie Ma Znaczenia`

Commentary:

- EN:
  `You can add the same forces in a different order and still get the same net force.`
  `The chain changes shape, but the green answer stays the same.`
- PL:
  `Te same siły możesz dodać w innej kolejności i nadal otrzymasz tę samą siłę wypadkową.`
  `Łańcuch zmienia kształt, ale zielona odpowiedź pozostaje taka sama.`

Board scene:

- puck at center
- center dot visible
- force set:
  - `F1 = 4 @ 0°`
  - `F2 = 4 @ 90°`
  - `F3 = 4 @ 180°`
- green resultant visible:
  - `R = 4 @ 90°`
- head-to-tail inset visible
- inset must support three fixed order permutations:
  - order A: `F1, F2, F3`
  - order B: `F2, F3, F1`
  - order C: `F3, F1, F2`

Controls:

- one intro control button:
  - EN `Shuffle order`
  - PL `Zmień kolejność`

Behavior:

- each click advances to the next stored permutation
- only the inset order changes
- the forces around the puck do not move
- the green resultant direction and length stay unchanged

### Step 8: From Net Force To Motion

ID:

- `net-to-motion`

Title:

- EN: `From Net Force To Motion`
- PL: `Od Siły Wypadkowej Do Ruchu`

Commentary:

- EN:
  `The green arrow is the net force, so it sets the puck’s acceleration.`
  `Because this puck starts from rest and the pushes stay on, it first moves along the green arrow.`
- PL:
  `Zielona strzałka to siła wypadkowa, więc wyznacza przyspieszenie krążka.`
  `Ponieważ ten krążek startuje ze spoczynku, a pchnięcia cały czas działają, najpierw porusza się wzdłuż zielonej strzałki.`

Board scene:

- puck at center
- center dot visible
- ring visible
- force set:
  - `F1 = 4 @ 0°`
  - `F2 = 4 @ 90°`
- green resultant visible
- motion demo visible
- dashed path visible
- actual ring-reach point visible
- no wedges
- no guess marker

Controls:

- one intro control button:
  - EN `Replay motion`
  - PL `Powtórz ruch`

Behavior:

- replay the intro motion from rest
- motion should use the same constant-force / no-friction / from-rest visual model as the main game

### Step 9: How The Game Works

ID:

- `how-to-play`

Title:

- EN: `How The Game Works`
- PL: `Jak Działa Gra`

Commentary:

- EN:
  `In the game, you will see only the colored force arrows first.`
  `Your job is to predict where the puck will reach the ring first. Then the app reveals the green net force and the real path.`
- PL:
  `W grze najpierw zobaczysz tylko kolorowe strzałki sił.`
  `Twoim zadaniem jest przewidzieć, gdzie krążek dotrze do pierścienia najpierw. Potem aplikacja pokaże zieloną siłę wypadkową i prawdziwy tor ruchu.`

Board scene:

- ring visible
- puck at center
- force set:
  - `F1 = 4 @ 0°`
  - `F2 = 3 @ 120°`
  - `F3 = 2 @ 240°`
- blue guess marker visible on ring
- autoplay scripted mini-demo loop

Scripted loop timeline:

1. phase A, `0.0s - 1.2s`
   - force arrows only
   - blue guess marker shown
   - no green resultant
2. phase B, `1.2s - 2.1s`
   - green resultant appears
   - puck begins motion
3. phase C, `2.1s - 3.0s`
   - dashed path shown
   - real ring-reach point shown
   - wedges shown
4. phase D, `3.0s - 3.6s`
   - hold final state briefly
5. then loop

Controls:

- one primary intro control button:
  - EN `Start game`
  - PL `Zacznij grę`

Behavior:

- exits intro
- restores normal panel
- leaves the app in normal game mode
- keeps the current normal game round intact

## 11. Intro-Specific Board Layout Rules

### 11.1 Inset Placement

For steps that use head-to-tail construction:

- place a dedicated inset card inside the board area
- preferred placement: lower-right quadrant of the canvas
- inset must not overlap the main puck

### 11.2 Callout Chips

Callout chips are allowed only on steps 2 and 3.

Keep them:

- short
- subtle
- high-contrast

Do not turn the board into a poster full of labels.

### 11.3 Ring Visibility

The ring must be hidden on steps 1 through 7.

The ring must appear on steps 8 and 9 only.

Reason:

- before step 8 the intro is about force addition
- from step 8 onward the intro bridges into the game mechanic

## 12. Interaction Rules

### 12.1 Navigation

Prev/next buttons must:

- move one step at a time
- disable at the ends
- update the step counter

### 12.2 Intro Controls

The intro controls area must only show the controls relevant to the current step.

Required mapping:

- steps 1, 2, 3, 4, 6: no controls
- step 5: partial/balanced switch
- step 7: shuffle-order button
- step 8: replay-motion button
- step 9: start-game button

### 12.3 Keyboard

While intro is active:

- `Left Arrow`: previous step
- `Right Arrow`: next step
- `Escape`: exit intro
- `Enter` / `Space`: activate the currently focused intro button

Normal game keyboard shortcuts must not compete while intro is active.

### 12.4 Pointer

During intro:

- normal guess placement is disabled
- normal game dragging is disabled
- only intro controls are interactive

Exception:

- Step 9’s autoplay demo is passive, not child-controlled

## 13. Rendering Rules

### 13.1 Deterministic Scenes

Every intro scene must be deterministic.

Do not use random round generation in intro mode.

### 13.2 Animation Policy

Animation should be purposeful, not decorative.

Allowed:

- one-time scene entrance fade
- motion replay on step 8
- looping game demo on step 9
- very brief order-change transition in step 7

Not allowed:

- bouncing labels
- celebratory effects
- result overlays inside intro mode

### 13.3 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- disable looping motion animation
- replace step 8 replay with immediate final-state reveal plus optional short fade
- replace step 9 loop with static storyboard final frame and an explicit small note in commentary if needed

## 14. Localization

All intro strings must exist in:

- English
- Polish

Required keys:

- `intro`
- `introTitle`
- `introExit`
- `introBack`
- `introPrev`
- `introNext`
- `introStartGame`
- `introReplayMotion`
- `introShuffleOrder`
- `introPartial`
- `introBalanced`
- `introStep1Title` through `introStep9Title`
- `introStep1` through `introStep9`

Do not ship with English-only intro controls or aria labels.

## 15. Accessibility

### 15.1 Panel Accessibility

The intro panel must be keyboard reachable and screen-reader legible.

Required:

- title
- step title
- commentary
- step counter
- prev / next / exit labels

### 15.2 Board Accessibility

The intro board itself may remain primarily visual, but its meaning must be mirrored by the step commentary.

The commentary for each step must explicitly say the key idea that the board is demonstrating.

### 15.3 Focus Management

On entering intro:

- focus the intro panel or the exit button

On step change:

- do not forcibly reset focus unless necessary

On exit:

- restore focus to the Intro button

## 16. Integration With Current Normal UI

### 16.1 Required New Normal-Mode Button

Add a normal `Intro` button.

Recommended specifics:

- icon button with lightbulb symbol, consistent with `feedbacktank.html`
- place inside the `Controls` section before retry/new-round

### 16.2 Normal Mode When Intro Is Closed

The intro feature must not change:

- level selection
- scoring
- readouts
- result overlays
- game-state logic

outside intro mode, except for any shared scientific rendering fixes adopted from the intro implementation.

## 17. Acceptance Criteria

The intro is acceptable only if all of the following are true:

1. First visit auto-opens intro.
2. Later visits do not auto-open intro.
3. Intro can be reopened manually.
4. Intro hides the normal panel and shows a dedicated intro panel.
5. Step counter, prev, next, and exit work.
6. All `9` steps render the exact intended scene families.
7. Step 5 supports `Partial` and `Balanced`.
8. Step 7 changes vector order without changing the resultant.
9. Step 8 shows motion from rest along the net force.
10. Step 9 clearly demonstrates the game loop: guess first, answer after.
11. Intro scenes render the green resultant to correct relative magnitude.
12. Through-center force action is visually clear in intro scenes.
13. EN pass.
14. PL pass.
15. Keyboard pass.
16. Reduced-motion pass.
17. Mobile pass.

## 18. Verification Suggestions For The Implementing Agent

Minimum verification:

1. enter intro on first launch
2. exit intro immediately
3. reopen intro manually
4. step through all `9` steps in EN
5. step through all `9` steps in PL
6. verify step 5 variant switching
7. verify step 7 order shuffling
8. verify step 8 motion replay
9. verify step 9 autoplay loop and start-game exit
10. verify normal gameplay still works after intro exit
11. run:

`npm run code-review -- forces.html`

## 19. Scientific Sources

These sources define the science claims the intro is allowed to teach:

- OpenStax, `5.1 Vector Addition and Subtraction: Graphical Methods`
  https://openstax.org/books/physics/pages/5-1-vector-addition-and-subtraction-graphical-methods
- OpenStax, `5.3 Newton’s Second Law`
  https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law
- OpenStax, `5.7 Drawing Free-Body Diagrams`
  https://openstax.org/books/university-physics-volume-1/pages/5-7-drawing-free-body-diagrams
- OpenStax, `2.2 Coordinate Systems and Components of a Vector`
  https://openstax.org/books/university-physics-volume-1/pages/2-2-coordinate-systems-and-components-of-a-vector

## 20. Source-Derived Claims Used In This Spec

Directly supported by sources:

- force is a vector with magnitude and direction
- vectors add head-to-tail
- the resultant is the sum vector
- acceleration points in the same direction as net external force
- free-body diagrams treat the body as a point or center and show external forces acting on it

Inference intentionally used by this app and intro:

- because this app uses a top-down puck that starts from rest, ignores friction, and treats all visible pushes as acting through the center, the intro may honestly teach that the puck first moves along the net-force direction
