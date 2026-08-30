# Moment Lab: Requirements And Design Specification

Target implementation: `moment/index.html`

Public URL: `https://lepecki.com/learn/moment/`

Hub integration: add one `Classical mechanics` entry to `index.md` when the
app is implemented.

Required validation commands after implementation:

```bash
npm run code-review -- moment/index.html
node tools/moment-rules-check.mjs
node tools/moment-dom-check.mjs
```

This document is the canonical product, science, interaction, content, and
acceptance specification for v1. If an implementation detail conflicts with
this document, this document wins. If this document is silent about a generic
UI or coding convention, inherit the current rule in `CLAUDE.md`; do not copy
legacy drift from a reference app.

Reference patterns:

- use the current light chassis and component rules from `CLAUDE.md`,
- use the calm, board-first, progressive reveal of the introduction in
  `feedbacktank/index.html`, but use the current `hidden` and panel-class
  conventions instead of that app's older inline display manipulation,
- use the restrained visual density, large child-facing controls, stable
  feedback region, and phase-specific panel behavior of
  `yesnoreflex/index.html`,
- use the direct force-arrow manipulation family of `forces/index.html` and
  `momentum/index.html`, corrected where those apps predate current
  accessibility or style rules.

## 0. Locked Decisions And Handoff Goal

The implementing agent must deliver a bilingual, standalone educational app
for children aged approximately 7–10. It teaches the **moment of a force**—the
turning effect of a force about a pivot—through:

1. a nine-step first-visit Guide,
2. an unrestricted Explore mode,
3. a Game mode containing both Balance Missions and Predict Rotation.

Locked identity:

- English title: `Moment Lab`
- Polish title: `Laboratorium Momentu Siły`
- slug: `moment`
- header icon: `⚖️` (`&#x2696;&#xFE0F;`)
- English lead term: `moment of force`, shortened to `moment` after definition
- English synonym introduced once: `torque`
- Polish term: `moment siły`

The app must explicitly say that a moment of force is not momentum. It must
not assume that similarity between the English words means similarity between
the physical quantities.

There are no unresolved product questions. Section 20 records the deliberate
defaults and future considerations; they are not invitations to redesign v1.

## 1. Problem Statement

The existing Learn collection teaches forces, linear momentum, and angular
momentum, but it does not teach why the same force can be more or less
effective at turning an object depending on where and how it acts. Children
commonly focus on the strongest force and overlook distance from the pivot or
the force's line of action.

A scientifically weak app would reinforce that error by teaching only
`force × distance from pivot`, using weights without distinguishing force from
mass, or treating a balanced moment as proof that all forces vanish. Moment Lab
must instead build the idea from visible turning, isolate the relevant
variables, then let children combine them through direct play and feedback.

## 2. Research Basis And Product Consequences

### 2.1 Sources

1. OpenStax, *University Physics Volume 1*, “Torque”:
   https://openstax.org/books/university-physics-volume-1/pages/10-6-torque
2. OpenStax, *College Physics*, “The Second Condition for Equilibrium”:
   https://openstax.org/books/college-physics/pages/9-2-the-second-condition-for-equilibrium
3. Institute of Physics, “Designing levers—turning effects and moments”:
   https://spark.iop.org/designing-levers-turning-effects-and-moments
4. Institute of Physics, “Levers—Teaching and learning issues”:
   https://spark.iop.org/collections/levers-teaching-and-learning-issues
5. Institute of Physics, “Levers—Teaching approaches”:
   https://spark.iop.org/collections/levers-teaching-approaches
6. Siegler and Chen, “Development of rules and strategies: balancing the old
   and the new”:
   https://siegler.tc.columbia.edu/wp-content/uploads/2019/02/siegchen02.pdf
7. Li et al., “The Effect of Feedback and Operational Experience on
   Children's Rule Learning”:
   https://pmc.ncbi.nlm.nih.gov/articles/PMC5390043/
8. PhET Interactive Simulations, *Activity Sheet Design*:
   https://phet.colorado.edu/assets/virtual-workshop/Activity_Sheet_Design.pdf

### 2.2 Scientific Consequences

- A moment is always calculated about a specified pivot or axis.
- The relevant distance is the perpendicular distance from the pivot to the
  force's **line of action**.
- For a fixed force magnitude and application radius, a perpendicular force
  gives the largest moment and a radial force whose line of action passes
  through the pivot gives zero moment.
- Clockwise and counterclockwise moments oppose one another; the signed sum is
  the net moment.
- Zero net moment gives rotational equilibrium about the chosen pivot. It does
  not by itself prove zero net force or unrestricted static equilibrium.

### 2.3 Teaching Consequences

- Begin with a familiar turning action, then identify the pivot and force.
- Isolate direction, distance, and force magnitude one at a time before asking
  the child to integrate them.
- Use force-distance conflict cases because many children initially choose the
  side with the larger force alone.
- Connect physical-looking actions to consistent arrows and labels before
  introducing the equation.
- Keep prose short and let the board carry the explanation.
- Provide immediate, explanatory feedback and allow correction without shame.
- Make the equation visible, but do not make arithmetic or trigonometry a
  prerequisite for progress at the selected age level.

The IOP sources above are written for ages 11–14. They support this document's
scientific representation, terminology, and progression from concrete action
to diagrams and equations; they are not evidence that formal moment
calculations are appropriate for ages 7–10. The younger-child balance-scale
research supports operational feedback, explicit attention to both variables,
and the decision not to assume product-rule mastery.

## 3. Goals And Success Hypotheses

### 3.1 Child Learning Goals

After the Guide and initial play, a child should be able to:

- point to the pivot and force in a diagram,
- predict clockwise, counterclockwise, or zero turning effect from one force,
- explain that a stronger perpendicular force creates a larger moment when
  the application point is unchanged,
- explain that applying the same perpendicular force farther from the pivot
  creates a larger moment,
- recognize that a force whose line of action passes through the pivot has
  zero moment,
- explain that equal opposing moments produce rotational balance about the
  pivot,
- balance a simple lever when the opposing forces are unequal.

### 3.2 Product And Quality Goals

- Every displayed moment must come from the canonical solver in section 6.
- Every authored challenge must have the result recorded in section 13 and
  independently verified by `tools/moment-rules-check.mjs`.
- A child can complete the Guide, Explore, both games, feedback, and summary
  flows by pointer, touch, or keyboard.
- English and Polish contain the same physics, scenarios, and difficulty.
- No normal desktop viewport at `1280×720` or larger requires page scrolling.
- At the mobile breakpoint, the page may scroll but must never scroll
  horizontally.
- `npm run code-review -- moment/index.html` passes.

### 3.3 Pilot Success Hypotheses

These are launch hypotheses, not claims already supported by product data:

- at least 80% of observed 7–10-year-olds predict a single force's turning
  direction after the Guide,
- at least 70% solve a case where the larger force is opposed by a longer
  moment arm,
- at least 70% complete two unequal-force Balance Missions without an adult
  performing the calculation,
- at least 80% explain that both force and perpendicular distance matter,
- no participant leaves a moderated session stating that “the strongest force
  always wins” or that every distance from the pivot is a moment arm.

Measure these through moderated, consented observation only. Do not add
production analytics or retain child identifiers.

## 4. Audience And User Stories

Primary audience: children aged approximately 7–10 who can read short English
or Polish instructions and compare small whole numbers.

Secondary audience: parents and teachers using the app for a short individual
or classroom activity.

User stories, in priority order:

- As a child new to moments, I want to see one idea at a time so that I can
  connect a push with the turn it tends to produce.
- As a child who learns by touching things, I want to move force arrows and
  immediately see the moment change.
- As a player, I want to balance a beam by placing a force so that I discover
  the trade between strength and distance.
- As a player, I want to predict the initial turning direction so that I can
  test whether I understand combined moments.
- As a child who answers incorrectly, I want to see which moments opposed one
  another and try again without losing the session.
- As a Polish- or English-speaking child, I want all instructions, feedback,
  and accessible descriptions in my language.
- As a keyboard-only child, I want equivalent controls for every drag action.
- As a parent or teacher, I want a scientifically constrained model that does
  not confuse moment, momentum, force, mass, or energy.

## 5. Scope And Non-Goals

### 5.1 P0 Scope

- a single `moment/index.html` with inline CSS and JavaScript,
- light-chassis responsive layout,
- bilingual English and Polish interface,
- nine-step Guide,
- one- and two-force Explore mode,
- Balance Missions with three difficulty levels,
- Predict Rotation with three difficulty levels,
- the complete 72-record challenge bank in section 13,
- keyboard, touch, reduced-motion, and screen-reader support,
- rules and DOM validation scripts,
- the Learn hub entry.

### 5.2 Non-Goals For V1

- no formal right-hand-rule instruction or 3D torque vectors,
- no child-facing cross-product notation,
- no trigonometric calculations or sine questions,
- no moment of inertia, angular momentum, or full rotational dynamics,
- no center-of-mass, distributed-load, stability, toppling, pulley, gear, or
  compound-machine problems,
- no claim to simulate a real seesaw's complete motion,
- no use of kilograms as a substitute for force; visible loads are labeled by
  their downward force in newtons,
- no energy or mechanical-advantage lesson,
- no accounts, backend, leaderboard, daily streak, advertising, or analytics,
- no required audio and no timer,
- no user-authored challenge data.

Angled forces are taught and available in Explore. Scored v1 challenges use
perpendicular, upward/downward, radial, or along-beam forces so that a
7–10-year-old never needs trigonometry. Every scored configuration provides
the visual moment scaffolds in sections 11 and 12; multiplication may reinforce
an explanation but is never required to determine an answer.

## 6. Canonical Scientific Model

### 6.1 Coordinate System

Use a two-dimensional Cartesian world:

- pivot `P = (0, 0)`,
- beam lies on the x-axis in its editable state,
- beam endpoints are `x = −4 m` and `x = +4 m`,
- positive x points right,
- positive y points up,
- positive moment is counterclockwise,
- negative moment is clockwise,
- force direction `0°` points right, `90°` up, `180°` left, and `270°` down.

The eight-metre beam is a schematic teaching object. Do not imply that its
screen size is a real-world scale drawing.

### 6.2 Force Representation

Each force record is:

```js
{
  id: "f1",
  x: 3,          // application point in metres; y is 0 in v1
  magnitude: 2,  // newtons
  angleDeg: 270  // mathematical angle from +x
}
```

Compute components without rounding:

```text
Fx = F cos(θ)
Fy = F sin(θ)
```

The visible arrow tail is the point of application. The extended straight line
through the arrow is its line of action.

### 6.3 Individual Moment

For pivot `P`, application point `A`, and force vector `F`:

```text
r = A − P
M = rₓFᵧ − rᵧFₓ
```

In the v1 editable beam, `rᵧ = 0`, so:

```text
M = xFᵧ = xF sin(θ)
```

The magnitude may also be written:

```text
|M| = F d⊥
d⊥ = |M| / F
```

where `d⊥` is the shortest distance from the pivot to the infinite line of
action. This is the definition the child-facing Guide must visualize.

### 6.4 Net Moment And Classification

```text
Mnet = ΣMi
```

Classify using unrounded values:

```text
Mnet > +1e−9 N·m  -> counterclockwise initial tendency
Mnet < −1e−9 N·m  -> clockwise initial tendency
|Mnet| <= 1e−9    -> rotationally balanced about the pivot
```

Game records use integer vertical forces and therefore have exact analytic
results. Explore retains full floating-point precision. Display moments to one
decimal place; if a nonzero magnitude would round to `0.0`, display `< 0.1`
with its direction instead of displaying a contradictory zero.

### 6.5 Force And Moment Balance

The app must use these exact distinctions:

- `net moment = 0` means no angular acceleration about the fixed pivot,
- the pivot can provide an unshown reaction force,
- therefore the beam can be rotationally balanced even when the visible force
  vectors do not sum to zero,
- `balanced` in this app always means **rotationally balanced about the pivot**.

Every Guide and Game scene begins with the beam horizontal and at rest:

```text
initial angular velocity = 0
```

The sign of `Mnet` determines the initial angular acceleration. Because the
beam begins at rest, it also determines the direction of the first visible
rotation in the schematic reveal. Do not generalize that relationship to an
already-rotating object.

Do not write “the forces balance” unless both the force sum and moment sum have
actually been evaluated. Normal v1 child copy should say “the moments balance.”

### 6.6 Initial-Tendency Animation

The app does not integrate angular motion. On a checked, unbalanced game
configuration it may animate a schematic beam tilt of at most `6°` over
`300 ms`, hold for `250 ms`, and return over `250 ms`. Label the feedback as
an `initial turn` / `początkowy obrót` and use clockwise/counterclockwise
wording rather than left/right movement.

The tilt direction comes only from the sign of `Mnet`. Its angle and duration
must not encode a claim about angular acceleration, final speed, or elapsed
physical time. Under reduced motion, replace the tilt with a static curved
direction arrow and text.

### 6.7 Canonical Sanity Cases

The implementation and independent rules check must pin these cases:

| Application and force | Moment | Result |
|---|---:|---|
| `x = +3 m`, `2 N` down | `−6 N·m` | clockwise |
| `x = −3 m`, `2 N` down | `+6 N·m` | counterclockwise |
| `x = +3 m`, `2 N` up | `+6 N·m` | counterclockwise |
| `x = 0`, any force | `0 N·m` | balanced about pivot |
| `x = +3 m`, force along beam | `0 N·m` | line passes through pivot |
| `2 N` at `3 m` down right plus `3 N` at `2 m` down left | `0 N·m` | moments balance |

## 7. Product Structure And State Machine

### 7.1 Top-Level Surfaces

Use these mutually exclusive phases:

```text
intro
explore
gameSetup
gameRound
gameFeedback
gameSummary
```

Normal navigation remains the standard two-button `Explore` / `Game` mode
switch. The Guide is an intro surface, not a third tab or route.

### 7.2 Initial State

- Language starts from `navigator.language` according to `CLAUDE.md`.
- On the first visit, auto-open the Guide.
- If the versioned seen key exists, start in Explore.
- Storage access is always inside `try/catch`; storage failure must not block
  the Guide or app.
- Exiting the Guide before its final step sets the seen key and returns to the
  previously active normal surface.
- Replaying the Guide snapshots and later restores the complete normal state;
  Guide interactions must not alter an Explore setup or active game session.

### 7.3 Required State Shape

Use one central state object containing at least:

```js
{
  lang: "en",
  phase: "intro",
  introStep: 1,
  introReturn: null,
  mode: "explore",
  exploreForceCount: 1,
  selectedForceId: "f1",
  forces: [],
  gameType: "balance",
  difficulty: 1,
  sessionScenarioIds: [],
  roundIndex: 0,
  firstTryCorrect: 0,
  attemptCount: 0,
  feedback: null,
  summaryOpen: false,
  reducedMotion: false
}
```

Do not duplicate physics truth in UI flags. Direction, balance, moment values,
and correct answers are derived from force records by the canonical solver.

## 8. Nine-Step Guide

### 8.1 Shared Guide Behavior

- Auto-open once using `momentIntroSeenV1`.
- Provide a normal-mode `Guide` action inside collapsed `How it works` help.
- Use a dedicated intro panel, not an overlay over the board.
- Show title, two short commentary paragraphs, `Previous`, step counter,
  `Next`, and `Exit`.
- Navigation buttons and every child-facing Guide action are at least
  `48×48px`, with labels at least `18px`.
- Escape exits; ArrowLeft/ArrowRight navigate when focus is not in a Guide
  interaction control.
- Step changes focus the step heading and announce title plus commentary once.
- The final step replaces `Next` with explicit `Start exploring` and
  `Start game` actions.
- Every scene is deterministic and reconstructed from step data; it must not
  inherit random normal-mode state.

### 8.2 Step 1 — A Push Can Turn

ID: `push-can-turn`

Title:

- EN: `A Push Can Turn`
- PL: `Pchnięcie Może Obracać`

Commentary:

- EN: `A force can change how an object moves. If the object is held at a pivot, a force can also make it turn.`
- EN: `The pivot is the fixed point that the object turns around.`
- PL: `Siła może zmienić ruch przedmiotu. Gdy przedmiot jest zamocowany w punkcie podparcia, siła może też go obracać.`
- PL: `Punkt podparcia to nieruchomy punkt, wokół którego obraca się przedmiot.`

Scene:

- show a simple top-view door for the first `1.2 s`, then morph or cross-fade
  to the standard beam and central pivot,
- show one unlabeled perpendicular push, then add labels `force` and `pivot`,
- no values or formula.

Controls: one `Replay` / `Powtórz` action.

### 8.3 Step 2 — Which Way Will It Turn?

ID: `turn-direction`

Title:

- EN: `Which Way Will It Turn?`
- PL: `W Którą Stronę Się Obróci?`

Commentary:

- EN: `The turning direction depends on where the force acts and which way it points.`
- EN: `We describe the turn as clockwise or counterclockwise.`
- PL: `Kierunek obrotu zależy od miejsca działania siły i od tego, w którą stronę jest skierowana.`
- PL: `Obrót opisujemy jako zgodny albo przeciwny do ruchu wskazówek zegara.`

Scene variants:

- `right-down`: `x = +3 m`, `F = 2 N`, `270°`, clockwise,
- `left-down`: `x = −3 m`, `F = 2 N`, `270°`, counterclockwise.

Interaction:

1. Start with `right-down`, hide its turning arc, and ask the child to choose
   `Clockwise ↷` / `Zgodnie ze wskazówkami ↷` or
   `↶ Counterclockwise` / `↶ Przeciwnie do wskazówek`.
2. A correct choice reveals the moment arc and enables `Next example` /
   `Następny przykład`.
3. Show `left-down` and repeat.
4. A wrong choice explains that the force tends to lower one end and raise the
   other, then leaves both choices enabled for an immediate retry.

Guide errors never affect a score or block Exit/Previous.

### 8.4 Step 3 — Farther Has More Effect

ID: `distance`

Title:

- EN: `Farther Has More Effect`
- PL: `Dalej Znaczy Silniejszy Obrót`

Commentary:

- EN: `These pushes have the same strength and point straight down. The push farther from the pivot has the larger turning effect.`
- EN: `This comparison works because only the distance changes.`
- PL: `Te siły mają taką samą wartość i są skierowane pionowo w dół. Siła działająca dalej od punktu podparcia ma większy efekt obrotowy.`
- PL: `To porównanie działa, ponieważ zmienia się tylko odległość.`

Scene variants:

- near: `x = +1 m`, `F = 2 N`, moment `2 N·m` clockwise,
- far: `x = +3 m`, `F = 2 N`, moment `6 N·m` clockwise.

Controls: `Near` / `Blisko` and `Far` / `Daleko`.

### 8.5 Step 4 — A Stronger Force Has More Effect

ID: `force-strength`

Title:

- EN: `A Stronger Force Has More Effect`
- PL: `Większa Siła Obraca Mocniej`

Commentary:

- EN: `Now the force acts at the same point and in the same direction. The stronger force has the larger turning effect.`
- EN: `This time only the force strength changes.`
- PL: `Teraz siła działa w tym samym miejscu i kierunku. Większa siła ma większy efekt obrotowy.`
- PL: `Tym razem zmienia się tylko wartość siły.`

Scene variants:

- gentle: `x = +3 m`, `F = 1 N`, moment `3 N·m` clockwise,
- strong: `x = +3 m`, `F = 3 N`, moment `9 N·m` clockwise.

Controls: `Gentle` / `Mała` and `Strong` / `Duża`.

### 8.6 Step 5 — The Line Of Action

ID: `line-of-action`

Title:

- EN: `The Line Of Action`
- PL: `Linia Działania Siły`

Commentary:

- EN: `Follow the force arrow as a straight line. The moment uses the shortest, perpendicular distance from the pivot to that line.`
- EN: `A line through the pivot gives zero moment. A perpendicular push gives the largest moment for the same force and point.`
- PL: `Przedłuż strzałkę siły do prostej linii. Moment wykorzystuje najkrótszą, prostopadłą odległość od punktu podparcia do tej linii.`
- PL: `Linia przechodząca przez punkt podparcia daje moment równy zero. Siła prostopadła daje największy moment dla tej samej wartości i miejsca działania.`

Scene uses three compact diagram cards with the same `x = +3 m`, `F = 2 N`:

- card A, radial: `180°`, `d⊥ = 0`, `M = 0`,
- card B, angled: `210°`, `d⊥ = 1.5 m`, `|M| = 3 N·m`,
- card C, perpendicular: `270°`, `d⊥ = 3 m`, `|M| = 6 N·m`.

Before answering, show the force arrows and faint extended lines but hide
`d⊥`, products, moment values, and result words. Ask two questions in order:

1. `Which force makes zero moment?` / `Która siła daje moment równy zero?`
   Correct answer: A.
2. `Which force makes the largest moment?` /
   `Która siła daje największy moment?` Correct answer: C.

Each card is a `96×112px` minimum button on desktop. At narrow widths the
cards remain a three-column row with `88×112px` visible cards inside
`96×120px` hit regions. Correct selection reveals the perpendicular segment,
right-angle marker, `d⊥`, and moment for all three cards. A wrong selection
gives one short explanation and permits retry.

### 8.7 Step 6 — Moment Of Force

ID: `name-and-equation`

Title:

- EN: `Moment Of Force`
- PL: `Moment Siły`

Commentary:

- EN: `The turning effect is called the moment of a force, or torque. It is not momentum.`
- EN: `Moment = force × perpendicular distance. We measure it in newton metres: N·m.`
- PL: `Efekt obrotowy nazywamy momentem siły.`
- PL: `Moment = siła × prostopadła odległość. Mierzymy go w niutonometrach: N·m.`

Scene:

- `x = +3 m`, `F = 2 N` down,
- show `M = F × d⊥`, then substitute `M = 2 N × 3 m = 6 N·m`,
- show a clockwise arc labeled `6 N·m`,
- do not show `τ`, cross-product notation, or sine in child-facing UI.

Controls: none.

### 8.8 Step 7 — Trade Force For Distance

ID: `trade-force-distance`

Title:

- EN: `Trade Force For Distance`
- PL: `Siła I Odległość Mogą Się Zastępować`

Commentary:

- EN: `A smaller force farther away can match a larger force closer to the pivot.`
- EN: `Two newtons at three metres and three newtons at two metres both make a moment of six newton metres.`
- PL: `Mniejsza siła działająca dalej może dorównać większej sile działającej bliżej punktu podparcia.`
- PL: `Dwa niutony w odległości trzech metrów i trzy niutony w odległości dwóch metrów dają moment sześciu niutonometrów.`

Scene:

- left downward force: `x = −2 m`, `F = 3 N`, `M = +6 N·m`,
- right downward force: `x = +3 m`, `F = 2 N`, `M = −6 N·m`,
- show equal-length opposed moment bars and products `3 × 2` and `2 × 3`.

Controls: one `Swap sides` / `Zamień strony` action. Swapping changes which
side uses each force but leaves the moments equal.

### 8.9 Step 8 — When Moments Balance

ID: `net-moment`

Title:

- EN: `When Moments Balance`
- PL: `Gdy Momenty Się Równoważą`

Commentary:

- EN: `Clockwise and counterclockwise moments oppose each other. Equal opposing moments give zero net moment.`
- EN: `The beam is rotationally balanced about its pivot. The pivot may still be pushing on the beam.`
- PL: `Momenty zgodne i przeciwne do ruchu wskazówek zegara działają przeciwnie. Równe przeciwne momenty dają zerowy moment wypadkowy.`
- PL: `Belka jest w równowadze obrotowej względem punktu podparcia. Punkt podparcia może nadal działać siłą na belkę.`

Scene variants:

- fixed force: `D(−2,3)`, moment `+6 N·m`,
- movable force: `2 N` downward, initially in the Guide dock,
- legal whole-metre sockets from `−4` to `+4`, excluding the pivot and fixed
  socket,
- unique balance position: `x = +3 m`.

Interaction:

- Ask the child to place the movable force so the moments balance.
- Use the same dock, drag/drop, keyboard movement, live moment strips, and
  invalid-drop rules as Balance Missions, but do not score the attempt.
- A wrong Check runs the explanatory reveal and unlocks the same arrangement.
- The correct position reveals `6 N·m` against `6 N·m` and the commentary's
  rotational-balance distinction.

### 8.10 Step 9 — Try It Yourself

ID: `how-to-play`

Title:

- EN: `Try It Yourself`
- PL: `Wypróbuj Samodzielnie`

Commentary:

- EN: `In Explore, move forces and watch each moment change.`
- EN: `In Game, balance the beam or predict its initial turning direction.`
- PL: `W Eksperymencie przesuwaj siły i obserwuj, jak zmienia się każdy moment.`
- PL: `W Grze równoważ belkę albo przewiduj kierunek jej początkowego obrotu.`

Scene:

- run the exact shared reveal sequence from section 10.5: highlight the fixed
  force, draw its moment, highlight the movable force, draw its opposing
  moment, fill the directional totals, reveal equality, then settle the pivot,
- use the same `3 N at −2 m` versus `2 N at +3 m` balanced setup as step 8,
- under reduced motion, reveal the complete final state immediately with no
  autoplay delay.

Controls:

- primary `Start exploring` / `Zacznij eksperyment`,
- secondary `Start game` / `Zacznij grę`.

## 9. Explore Mode

### 9.1 Purpose

Explore is an open laboratory, not a scored task. It must let a child discover
how position, magnitude, direction, and a second force change the individual
and net moments.

### 9.2 Default Setup

- one visible force `F1`,
- `F1`: `x = +3 m`, `2 N`, `270°` (down),
- selected force: `F1`,
- beam horizontal and fixed at its central pivot,
- line of action and perpendicular distance visible for the selected force,
- individual moment: `6.0 N·m clockwise`,
- no second force until the child selects `Two forces`.

When enabled, `F2` defaults to `x = −2 m`, `3 N`, `270°`, which exactly
balances the default `F1`.

### 9.3 Direct Manipulation

- Drag a force tail horizontally along the beam to change its application
  position in `0.5 m` increments.
- Drag a force arrowhead to change direction in `15°` increments and magnitude
  in `0.5 N` increments.
- Clamp magnitude to `0.5–5.0 N` and position to `−4.0–+4.0 m`.
- Use `pointerdown/move/up`, pointer capture, and large invisible hit regions.
- The visible tail and head may remain compact, but each uses a circular
  `24 CSS px` hit radius (`48px` diameter). If both hit regions overlap, the
  head wins.
- Selecting any part of an unselected arrow selects it before dragging.
- Do not allow dragging the beam or pivot.

The canvas is never the only means of editing. The panel controls in section
9.4 expose the same discrete state.

### 9.4 Explore Panel

Use exactly four panel sections:

1. `Mode`: the normal Explore/Game selector.
2. `Force controls`: `One force` / `Two forces`; conditional `F1` / `F2`
   selection; force strength, position, and direction slider rows.
3. `Moment result`: selected-force moment, clockwise total,
   counterclockwise total, and net tendency.
4. `Actions and help`: `Reset experiment` and collapsed `How it works`, which
   contains Guide replay and keyboard help.

The three slider rows remain the standard slider + −/+ stepper pattern, but
their steppers and segmented controls are at least `48px` high. Hide the `F2`
selector while one-force mode is active. Do not add separate section headings
for each control row.

Display position as `3.0 m right of pivot`, `2.5 m left of pivot`, or
`at the pivot`; signed values remain internal. Display the localized direction
word and arrow as the primary value and place degrees in smaller secondary
text. The complete four-section panel, including Moment result, must fit
within the `674px` content height available at `1280×720` without panel
scrolling; only the expanded help body may extend below the fold.

Adding `F2` must not change `F1`. Removing `F2` retains its last state in
memory for the current page session so re-enabling it restores the comparison.

### 9.5 Board Annotations

The main board shows only information that explains the current physics:

- beam, minor sockets every `0.5 m`, pivot, and whole-metre labels,
- force arrows labeled `F1` and `F2`, with numeric magnitude near each arrow,
- selected force's line of action,
- selected force's perpendicular moment arm with right-angle marker,
- selected force's `d⊥` value,
- curved clockwise or counterclockwise moment arrow,
- two compact bottom bars labeled with `↶` and `↷`, scaled to the larger
  absolute directional total,
- a stable top-center result pill: `Initial turn: counterclockwise ↶`,
  `Balanced about pivot`, or `Initial turn: clockwise ↷`.

Do not show vector components, sine, or an accumulating trail. Non-selected
force construction lines remain hidden to prevent clutter. On mobile, retain
half-metre sockets as small unlabeled ticks and label only whole metres.

### 9.6 Keyboard Behavior

When canvas focus is on a force:

- Left/Right moves its application point by `0.5 m`,
- Up/Down changes magnitude by `0.5 N`,
- `[` / `]` rotates by `15°`,
- Tab moves to the next normal control,
- `1` selects `F1`; `2` selects `F2` if visible,
- `R` resets Explore unless focus is inside another interactive control.

Panel ranges retain native arrow-key behavior. Do not apply canvas shortcuts
while focus is in a range or button.

## 10. Game Mode: Shared Structure

### 10.1 Setup

Game setup shows:

- game type: `Balance` / `Predict`,
- difficulty: `★`, `★★`, `★★★`,
- one primary `Start 8 rounds` action,
- one concise sentence describing the selected game,
- collapsed `How to play` with Guide replay and keyboard help.

Default game type is Balance and default difficulty is `★`. Do not persist
game settings across browser sessions.

### 10.2 Session Rules

- Exactly `8` rounds.
- No timer.
- Draw from the selected 12-record bank without replacement.
- Track whether each round was correct on its first attempt.
- Show only round count and first-try correct count in the stage HUD.
- Settings leave both the visual field and focus order while a session is
  active.
- Do not award speed bonuses, streaks, lives, coins, or score deductions.
- Losing focus or hiding the tab pauses only active animations; no answer or
  attempt is recorded.

### 10.3 Session Selection

For normal play, use `crypto.getRandomValues` when available and a
`Math.random` fallback. Randomness selects and orders records only; it must not
create physics values.

Selection quotas:

- Balance `★`: four left-fixed and four right-fixed records.
- Balance `★★`: at least two `stronger-closer`, two `weaker-farther`, and one
  from each fixed side; fill remaining slots without replacement.
- Balance `★★★`: at least three `same-side-fixed` and three
  `opposite-side-fixed` records.
- Predict `★`: at least two zero-moment, two clockwise, and two
  counterclockwise records.
- Predict `★★`: at least two balance, two force-dominant, and two
  distance-dominant/conflict records.
- Predict `★★★`: at least two balance, two clockwise, two counterclockwise,
  one same-side-opposing case, and one three-force case.

`?debug=1&seed=<unsigned-integer>` replaces selection randomness with a small,
documented deterministic PRNG. `?debug=1&scenario=<scenario-id>` opens exactly
that record in its appropriate game and difficulty. Invalid debug identifiers
show a debug-only error; they must not affect normal users.

### 10.4 Feedback And Summary

Individual feedback remains inline in a stable-height region:

- correct: name the relationship that made the answer work,
- incorrect: name each opposing moment and the net direction,
- never use `Wrong!`, ridicule, loss language, or a failure sound,
- numbers supplement the visual explanation; they are not the only feedback.

At the end:

- show the standard brief full-screen result wash, dismissible by click,
  Escape, Enter, or Space,
- reveal an in-stage summary with first-try correct count, accuracy, stars, one
  misconception-specific tip, `Play again`, and `Change game`,
- star thresholds: `8 = ★★★`, `6–7 = ★★`, `0–5 = ★`,
- stars measure first-attempt accuracy only.

Do not persist best scores.

## 11. Balance Missions

### 11.1 Core Loop

The board shows one or two fixed downward force tags and one movable downward
force tag. All tags state force in newtons. The child drags the movable force
among legal whole-metre sockets `−4, −3, −2, −1, +1, +2, +3, +4`; the pivot is
not legal and occupied fixed-force sockets are not legal.

Flow:

1. announce the mission and focus the movable force,
2. child places it at a legal socket,
3. child presses `Check balance`, Enter on the canvas, or Space while the
   movable force has canvas focus,
4. calculate all moments through the canonical solver,
5. if exact balance, show equal directional bars and advance on `Next`,
6. if unbalanced, show the initial-tendency feedback and keep the same round
   available for correction.

Only the first check affects first-try accuracy. Later retries remain
educational and unpenalized.

### 11.2 Difficulty

`★ — Match the distance`

- one fixed force and one movable force of equal magnitude,
- solution is the equal distance on the opposite side,
- teaches distance and direction without multiplication.

`★★ — Trade force and distance`

- one fixed and one movable force with unequal magnitudes,
- one unique integer socket balances the moments,
- values stay within `1–4 N` and `1–4 m`.

`★★★ — Balance a combined moment`

- two fixed forces and one movable force,
- fixed forces may act on the same side or opposite sides,
- the child balances their signed combined moment,
- values stay within the authored records; no runtime generation.

### 11.3 Balance Feedback

Correct templates:

- same force: emphasize equal distance on the opposite side,
- weaker movable force: emphasize that it needed to act farther away,
- stronger movable force: emphasize that it could act closer,
- combined fixed forces: show the signed fixed total and matching opposite
  movable moment.

Incorrect feedback must say which directional total is larger and therefore
which initial turn occurs. It must never say merely `too close` or `too far`
when the sign/side is also wrong.

## 12. Predict Rotation

### 12.1 Core Loop

The board shows a fixed authored force diagram. The child chooses one of three
stable buttons:

1. `↶ LEFT` — accessible name `Counterclockwise initial turn`,
2. `BALANCED` — accessible name `Rotationally balanced about the pivot`,
3. `RIGHT ↷` — accessible name `Clockwise initial turn`.

Polish visible labels are `↶ W LEWO`, `RÓWNOWAGA`, `W PRAWO ↷`; accessible
names use the full clockwise/counterclockwise terms from section 16.

An answer locks the three buttons, reveals every individual moment and the net
moment, then shows `Next`. Predict rounds do not accept a second answer because
the correct result has already been revealed. First-attempt accuracy is the
only score.

Keyboard:

- `A` or Left Arrow = counterclockwise,
- `S` or Down Arrow = balanced,
- `D` or Right Arrow = clockwise,
- `1`, `2`, `3` are equivalent,
- Space advances only while feedback and `Next` are visible,
- shortcuts do not fire while focus is in a panel control.

### 12.2 Difficulty

`★ — One force`

- one upward, downward, radial, or along-beam force,
- covers clockwise, counterclockwise, and zero moment,
- requires direction reasoning only.

`★★ — Two downward forces`

- one downward force on each side,
- includes equal, force-dominant, distance-dominant, and exact
  force-distance trade cases,
- deliberately challenges the `strongest force always wins` rule.

`★★★ — Combine signed moments`

- two or three vertical forces,
- forces may point up or down and may share a side,
- includes a pivot force that contributes zero,
- remains arithmetic-light because all arrows are perpendicular to the beam.

## 13. Locked Challenge Bank

### 13.1 Notation And Data Contract

The tables below are normative data, not illustrative examples.

Compact notation:

- `D(x,F)`: downward force at position `x m`, magnitude `F N`, angle `270°`,
- `U(x,F)`: upward force, angle `90°`,
- `R(x,F)`: rightward force, angle `0°`,
- `L(x,F)`: leftward force, angle `180°`.

Each runtime record expands to:

```js
{
  id: "balance-l1-01",
  game: "balance",             // "balance" | "predict"
  difficulty: 1,               // 1 | 2 | 3
  forces: [{ x, magnitude, angleDeg }],
  movableMagnitude: 1,         // balance only
  solutionX: 1,                // balance only
  expectedNetMoment: 0,        // predict uses authored signed result
  expectedResult: "balanced", // "ccw" | "balanced" | "cw"
  category: "same-force",
  explanationKey: "sameForceSameDistance"
}
```

For Balance records, `fixed M` is the sum before the movable force is placed.
The movable solution moment is its exact negative. For Predict records, `Mnet`
is the complete signed result.

The implementation must store expanded numeric records in JavaScript; it must
not parse the compact strings from this Markdown file.

### 13.2 Balance `★` Bank

| ID | Fixed force | Fixed M | Movable F | Solution x | Category | Explanation key |
|---|---|---:|---:|---:|---|---|
| `balance-l1-01` | `D(−1,1)` | `+1` | `1` | `+1` | left-fixed | `sameForceSameDistance` |
| `balance-l1-02` | `D(+1,1)` | `−1` | `1` | `−1` | right-fixed | `sameForceSameDistance` |
| `balance-l1-03` | `D(−2,2)` | `+4` | `2` | `+2` | left-fixed | `sameForceSameDistance` |
| `balance-l1-04` | `D(+2,2)` | `−4` | `2` | `−2` | right-fixed | `sameForceSameDistance` |
| `balance-l1-05` | `D(−3,3)` | `+9` | `3` | `+3` | left-fixed | `sameForceSameDistance` |
| `balance-l1-06` | `D(+3,3)` | `−9` | `3` | `−3` | right-fixed | `sameForceSameDistance` |
| `balance-l1-07` | `D(−4,4)` | `+16` | `4` | `+4` | left-fixed | `sameForceSameDistance` |
| `balance-l1-08` | `D(+4,4)` | `−16` | `4` | `−4` | right-fixed | `sameForceSameDistance` |
| `balance-l1-09` | `D(−4,2)` | `+8` | `2` | `+4` | left-fixed | `sameForceSameDistance` |
| `balance-l1-10` | `D(+4,2)` | `−8` | `2` | `−4` | right-fixed | `sameForceSameDistance` |
| `balance-l1-11` | `D(−2,4)` | `+8` | `4` | `+2` | left-fixed | `sameForceSameDistance` |
| `balance-l1-12` | `D(+2,4)` | `−8` | `4` | `−2` | right-fixed | `sameForceSameDistance` |

### 13.3 Balance `★★` Bank

| ID | Fixed force | Fixed M | Movable F | Solution x | Category | Explanation key |
|---|---|---:|---:|---:|---|---|
| `balance-l2-01` | `D(−2,3)` | `+6` | `2` | `+3` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-02` | `D(+2,3)` | `−6` | `2` | `−3` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-03` | `D(−3,2)` | `+6` | `3` | `+2` | stronger-closer | `strongerNeedsCloser` |
| `balance-l2-04` | `D(+3,2)` | `−6` | `3` | `−2` | stronger-closer | `strongerNeedsCloser` |
| `balance-l2-05` | `D(−1,4)` | `+4` | `2` | `+2` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-06` | `D(+1,4)` | `−4` | `2` | `−2` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-07` | `D(−4,1)` | `+4` | `2` | `+2` | stronger-closer | `strongerNeedsCloser` |
| `balance-l2-08` | `D(+4,1)` | `−4` | `2` | `−2` | stronger-closer | `strongerNeedsCloser` |
| `balance-l2-09` | `D(−2,4)` | `+8` | `2` | `+4` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-10` | `D(+2,4)` | `−8` | `2` | `−4` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-11` | `D(−3,4)` | `+12` | `3` | `+4` | weaker-farther | `weakerNeedsFarther` |
| `balance-l2-12` | `D(+3,4)` | `−12` | `3` | `−4` | weaker-farther | `weakerNeedsFarther` |

### 13.4 Balance `★★★` Bank

| ID | Fixed forces | Fixed M | Movable F | Solution x | Category | Explanation key |
|---|---|---:|---:|---:|---|---|
| `balance-l3-01` | `D(−1,2), D(−3,1)` | `+5` | `5` | `+1` | same-side-fixed | `combinedFixedMoments` |
| `balance-l3-02` | `D(+1,2), D(+3,1)` | `−5` | `5` | `−1` | same-side-fixed | `combinedFixedMoments` |
| `balance-l3-03` | `D(−2,2), D(+1,1)` | `+3` | `1` | `+3` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-04` | `D(+2,2), D(−1,1)` | `−3` | `1` | `−3` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-05` | `D(−4,1), D(+1,2)` | `+2` | `1` | `+2` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-06` | `D(+4,1), D(−1,2)` | `−2` | `1` | `−2` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-07` | `D(−3,3), D(+1,1)` | `+8` | `2` | `+4` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-08` | `D(+3,3), D(−1,1)` | `−8` | `2` | `−4` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-09` | `D(−1,4), D(−4,1)` | `+8` | `4` | `+2` | same-side-fixed | `combinedFixedMoments` |
| `balance-l3-10` | `D(+1,4), D(+4,1)` | `−8` | `4` | `−2` | same-side-fixed | `combinedFixedMoments` |
| `balance-l3-11` | `D(−4,2), D(+2,3)` | `+2` | `2` | `+1` | opposite-side-fixed | `combinedFixedMoments` |
| `balance-l3-12` | `D(+4,2), D(−2,3)` | `−2` | `2` | `−1` | opposite-side-fixed | `combinedFixedMoments` |

### 13.5 Predict `★` Bank

| ID | Forces | Mnet | Result | Category | Explanation key |
|---|---|---:|---|---|---|
| `predict-l1-01` | `D(+3,2)` | `−6` | clockwise | single-cw | `singleClockwise` |
| `predict-l1-02` | `D(−3,2)` | `+6` | counterclockwise | single-ccw | `singleCounterclockwise` |
| `predict-l1-03` | `U(+2,3)` | `+6` | counterclockwise | single-ccw | `singleCounterclockwise` |
| `predict-l1-04` | `U(−2,3)` | `−6` | clockwise | single-cw | `singleClockwise` |
| `predict-l1-05` | `D(0,5)` | `0` | balanced | through-pivot | `throughPivotZero` |
| `predict-l1-06` | `U(0,5)` | `0` | balanced | through-pivot | `throughPivotZero` |
| `predict-l1-07` | `R(+4,3)` | `0` | balanced | along-beam | `alongBeamZero` |
| `predict-l1-08` | `L(−4,3)` | `0` | balanced | along-beam | `alongBeamZero` |
| `predict-l1-09` | `D(+1,4)` | `−4` | clockwise | single-cw | `singleClockwise` |
| `predict-l1-10` | `D(−1,4)` | `+4` | counterclockwise | single-ccw | `singleCounterclockwise` |
| `predict-l1-11` | `U(+3,2)` | `+6` | counterclockwise | single-ccw | `singleCounterclockwise` |
| `predict-l1-12` | `U(−3,2)` | `−6` | clockwise | single-cw | `singleClockwise` |

### 13.6 Predict `★★` Bank

| ID | Forces | Mnet | Result | Category | Explanation key |
|---|---|---:|---|---|---|
| `predict-l2-01` | `D(−1,2), D(+1,2)` | `0` | balanced | equal-simple | `equalOpposingMoments` |
| `predict-l2-02` | `D(−2,2), D(+1,4)` | `0` | balanced | conflict-balance | `productBalance` |
| `predict-l2-03` | `D(−1,4), D(+3,1)` | `+1` | counterclockwise | force-dominant | `forceWinsProduct` |
| `predict-l2-04` | `D(+1,4), D(−3,1)` | `−1` | clockwise | force-dominant | `forceWinsProduct` |
| `predict-l2-05` | `D(−1,2), D(+3,1)` | `−1` | clockwise | distance-dominant | `distanceWinsProduct` |
| `predict-l2-06` | `D(+1,2), D(−3,1)` | `+1` | counterclockwise | distance-dominant | `distanceWinsProduct` |
| `predict-l2-07` | `D(−2,3), D(+3,2)` | `0` | balanced | conflict-balance | `productBalance` |
| `predict-l2-08` | `D(−4,1), D(+2,3)` | `−2` | clockwise | force-distance-conflict | `compareProducts` |
| `predict-l2-09` | `D(+4,1), D(−2,3)` | `+2` | counterclockwise | force-distance-conflict | `compareProducts` |
| `predict-l2-10` | `D(−4,2), D(+3,3)` | `−1` | clockwise | close-conflict | `compareProducts` |
| `predict-l2-11` | `D(+4,2), D(−3,3)` | `+1` | counterclockwise | close-conflict | `compareProducts` |
| `predict-l2-12` | `D(−2,4), D(+4,2)` | `0` | balanced | conflict-balance | `productBalance` |

### 13.7 Predict `★★★` Bank

| ID | Forces | Mnet | Result | Category | Explanation key |
|---|---|---:|---|---|---|
| `predict-l3-01` | `D(−3,2), U(+2,1)` | `+8` | counterclockwise | same-direction-moments | `addSignedMoments` |
| `predict-l3-02` | `U(−2,1), D(+3,2)` | `−8` | clockwise | same-direction-moments | `addSignedMoments` |
| `predict-l3-03` | `D(−4,1), U(−1,4)` | `0` | balanced | same-side-opposing | `sameSideCanOppose` |
| `predict-l3-04` | `D(+4,1), U(+1,4)` | `0` | balanced | same-side-opposing | `sameSideCanOppose` |
| `predict-l3-05` | `D(−3,2), D(+2,2), D(+1,1)` | `+1` | counterclockwise | three-force | `addSignedMoments` |
| `predict-l3-06` | `D(+3,2), D(−2,2), D(−1,1)` | `−1` | clockwise | three-force | `addSignedMoments` |
| `predict-l3-07` | `D(−4,1), D(+3,1), D(0,5)` | `+1` | counterclockwise | pivot-plus-two | `pivotForceAddsZero` |
| `predict-l3-08` | `D(+4,1), D(−3,1), D(0,5)` | `−1` | clockwise | pivot-plus-two | `pivotForceAddsZero` |
| `predict-l3-09` | `U(−2,2), U(+2,2), D(+4,1)` | `−4` | clockwise | three-force | `addSignedMoments` |
| `predict-l3-10` | `D(−2,2), D(+2,2), U(+4,1)` | `+4` | counterclockwise | three-force | `addSignedMoments` |
| `predict-l3-11` | `D(−1,5), D(+4,1), U(+2,1)` | `+3` | counterclockwise | three-force | `addSignedMoments` |
| `predict-l3-12` | `D(+1,5), D(−4,1), U(−2,1)` | `−3` | clockwise | three-force | `addSignedMoments` |

### 13.8 Bank Invariants

The rules checker must fail if any invariant is false:

- exactly 72 unique IDs exist,
- exactly 12 records exist for each game/difficulty pair,
- every force position is within `−4…+4 m`,
- every force magnitude is positive and at most `5 N`,
- every Predict `expectedNetMoment` equals the independent solver result,
- every Predict label matches the sign classification,
- every Balance `solutionX` is legal and unoccupied,
- each Balance solution yields zero net moment,
- no other legal socket yields zero net moment,
- Balance `fixed M` and every table value match the independent solver,
- every record has an English and Polish explanation path,
- every selection quota in section 10.3 can be fulfilled from its bank.

## 14. Visual And Interaction Design

### 14.1 Direction

Use the current `CLAUDE.md` light chassis. The app should look like a clean
tabletop mechanics diagram: warm paper background, one strong beam, one pivot,
large force arrows, and sparse technical labels.

Do not add scenery, characters, confetti during rounds, tool shelves, floating
cards, decorative rulers, or persistent formula panels. The board is the
primary explanation.

Append entity colors after the standard light palette:

```css
--force-1: #c62828;
--force-2: #1565c0;
--force-move: #7b1fa2;
--ccw: #1565c0;
--cw: #ef6c00;
--beam: #8d6e63;
--pivot: #455a64;
```

Color is redundant: arrows carry `F1`, `F2`, or `MOVE`; turning directions
carry `↶`/`↷` plus words; the movable force uses a dashed outer halo as well as
purple.

### 14.2 Header

- icon `⚖️` links to `/learn/` and has a localized accessible name,
- title and one-line subtitle on the left,
- language button is the only right-side action,
- use the exact light-header dimensions from `CLAUDE.md`.

Exact subtitle:

- EN: `See how force and distance make things turn.`
- PL: `Zobacz, jak siła i odległość wprawiają przedmioty w obrót.`

### 14.3 Desktop Layout

```text
+------------------------------------------------------+ +------------------+
| prompt / round HUD                                   | | Explore | Game   |
|                                                      | +------------------+
|       force arrows, line of action, moment arm       | | phase-specific   |
|                                                      | | controls or task |
|  −4  −3  −2  −1          pivot        +1 +2 +3 +4   | |                  |
|  ==========================▲=======================   | | one primary      |
|                                                      | | action visible   |
|        ↶ CCW moment bar     CW moment bar ↷          | |                  |
+------------------------------------------------------+ +------------------+
```

- canvas fills the main `.canvas-wrap`,
- panel width `320px`,
- no page-level desktop scrolling,
- mode selector remains first in normal surfaces,
- while a game round is active, its mission section is immediately below the
  mode selector and all setup controls are removed from display and focus,
- child-facing prompt text is at least `28px`; answer buttons are at least
  `18px` on `48px` targets,
- feedback has reserved height so the beam and controls never shift after an
  answer.

### 14.4 Canvas Geometry

- reserve top `72 CSS px` for the prompt/HUD,
- place the beam near `55%` of available board height,
- map the `−4…+4 m` beam to `70%` of board width, clamped to `420–760 CSS px`,
- if the stage is narrower, use `calc(width − 48px)` without changing world
  coordinates,
- beam visual thickness `22px`,
- triangular pivot height `54px`,
- sockets have visible radius `5px` and pointer hit radius `22px`,
- force arrow drawing scale `34 CSS px/N`, clamped so arrowheads remain inside
  the safe canvas area,
- arrowhead length `14px`; line width `5px`; selected halo `9px`,
- construction lines use at least `2px` stroke and high-contrast dash patterns,
- all canvas text uses JetBrains Mono at `13–17px`.

### 14.5 Mode And Phase Behavior

- Switching from Explore to Game preserves the current Explore setup.
- Switching during `gameSetup` is immediate.
- During an active game session, selecting Explore asks for confirmation in an
  inline panel message with `Leave game` / `Stay`; do not use a browser confirm
  dialog.
- Returning to Game after leaving starts at Game setup, not the abandoned
  round.
- Escape dismisses result overlays or exits the Guide; it does not silently
  discard an active game.

### 14.6 Mobile

Use one breakpoint at `max-width: 720px`:

- canvas appears before panel,
- canvas height `56svh`, minimum `360px`,
- page may scroll vertically,
- panel remains a full-width column,
- Predict answers stay in one row at `390px` and may become a three-row stack
  below `370px`, preserving counterclockwise/balanced/clockwise order,
- after starting a game, call one `alignPlayViewport()` helper on the next
  animation frame so the HUD, beam, and primary interaction fit in view,
- do not use smooth scrolling,
- no horizontal overflow at `320px` CSS width,
- direct-manipulation hit targets stay at least `44px` even when their visible
  symbols are smaller.

## 15. Accessibility Requirements

### 15.1 Semantic Equivalent For Canvas

The canvas has `tabindex="0"`, a localized `aria-label`, and a nearby polite
live region. `applyTranslations()` and every physics change update an
accessible summary without announcing during every pointer-move frame.

Debounce drag announcements until pointer release. A summary must name:

- selected force,
- application side and distance,
- force magnitude and direction,
- individual moment and turning direction,
- total clockwise and counterclockwise moments,
- net result.

Example EN:

`F1: 2 newtons downward, 3 metres right of the pivot. Moment: 6 newton metres clockwise. Net result: clockwise initial turn.`

Example PL:

`F1: 2 niutony w dół, 3 metry na prawo od punktu podparcia. Moment: 6 niutonometrów zgodnie z ruchem wskazówek zegara. Wynik: początkowy obrót zgodny z ruchem wskazówek zegara.`

### 15.2 Input And Focus

- Every canvas drag has an equivalent panel or keyboard action.
- All buttons and ranges have localized labels and visible focus.
- Never bind global shortcuts when Ctrl, Alt, Meta, or an editable control is
  active.
- Ignore repeated answer-key `keydown` events.
- Focus the first meaningful control on phase entry: Guide heading, Explore
  canvas, Game Start, movable force, Predict answer group, feedback Next, or
  summary heading.
- Result overlay restores focus to the summary after dismissal.
- Hidden phase controls are absent from the focus order.

### 15.3 Color, Motion, And Zoom

- Color is never the sole carrier of force identity, direction, selection, or
  correctness.
- At 200% zoom and `360px` CSS width, prompt, beam, force labels, answer
  controls, and feedback remain available without horizontal scrolling.
- Implement both CSS and JavaScript reduced-motion gates from `CLAUDE.md`.
- Reduced motion removes Guide morphs, force pops, beam tilt, and overlay
  animation but preserves immediate final states and explanatory feedback.
- Do not use vibration or sound as required feedback.

## 16. Required EN / PL Interface Strings

All strings live in one inline `I18N` object. The Guide strings in section 8
are also normative and must be included verbatim. Numeric values are inserted
through safe text nodes, never HTML interpolation.

### 16.1 Global And Navigation

| Key | English | Polish |
|---|---|---|
| `title` | Moment Lab | Laboratorium Momentu Siły |
| `subtitle` | See how force and distance make things turn. | Zobacz, jak siła i odległość wprawiają przedmioty w obrót. |
| `backLearn` | Back to Learn | Wróć do Learn |
| `switchLanguage` | Switch language | Zmień język |
| `mode` | Mode | Tryb |
| `explore` | Explore | Eksperyment |
| `game` | Game | Gra |
| `guide` | Guide | Przewodnik |
| `howItWorks` | How it works | Jak to działa |
| `replayGuide` | Replay guide | Powtórz przewodnik |
| `exitGuide` | Exit guide | Zamknij przewodnik |
| `previous` | Previous | Wstecz |
| `next` | Next | Dalej |
| `replay` | Replay | Powtórz |

### 16.2 Explore

| Key | English | Polish |
|---|---|---|
| `forces` | Forces | Siły |
| `oneForce` | One force | Jedna siła |
| `twoForces` | Two forces | Dwie siły |
| `selectedForce` | Selected force | Wybrana siła |
| `forceStrength` | Force strength | Wartość siły |
| `position` | Position | Położenie |
| `direction` | Direction | Kierunek |
| `directionUp` | up | w górę |
| `directionDown` | down | w dół |
| `directionLeft` | left | w lewo |
| `directionRight` | right | w prawo |
| `directionAngled` | angled | pod kątem |
| `moment` | Moment | Moment |
| `momentArm` | Perpendicular distance | Odległość prostopadła |
| `ccwTotal` | Counterclockwise ↶ | Przeciwnie do wskazówek ↶ |
| `cwTotal` | Clockwise ↷ | Zgodnie ze wskazówkami ↷ |
| `netResult` | Net result | Wynik wypadkowy |
| `turnsLeft` | Turns left ↶ | Obraca się w lewo ↶ |
| `turnsRight` | Turns right ↷ | Obraca się w prawo ↷ |
| `balancedPivot` | Balanced about the pivot | Równowaga względem punktu podparcia |
| `resetExperiment` | Reset experiment | Zresetuj eksperyment |
| `moveForceHint` | Drag the tail to move the force. Drag the arrowhead to change it. | Przeciągnij początek, aby przesunąć siłę. Przeciągnij grot, aby ją zmienić. |

### 16.3 Game Setup And HUD

| Key | English | Polish |
|---|---|---|
| `gameType` | Game type | Rodzaj gry |
| `balanceGame` | Balance | Równowaga |
| `predictGame` | Predict | Przewidywanie |
| `difficulty` | Difficulty | Trudność |
| `balanceDesc` | Place the movable force so the moments balance. | Ustaw ruchomą siłę tak, aby momenty się równoważyły. |
| `predictDesc` | Decide the beam's initial turning direction. | Wybierz kierunek początkowego obrotu belki. |
| `startRounds` | Start 8 rounds | Zacznij 8 rund |
| `roundOf` | Round {current} of {total} | Runda {current} z {total} |
| `firstTry` | First try: {correct} | Za pierwszym razem: {correct} |
| `leaveGameQuestion` | Leave this game? Current progress will be lost. | Opuścić tę grę? Bieżący postęp zostanie utracony. |
| `leaveGame` | Leave game | Opuść grę |
| `stayGame` | Stay | Zostań |

### 16.4 Balance Game

| Key | English | Polish |
|---|---|---|
| `balanceMission` | Balance the moments | Zrównoważ momenty |
| `moveForce` | Movable force | Ruchoma siła |
| `checkBalance` | Check balance | Sprawdź równowagę |
| `chooseSocket` | Place the movable force on an empty socket. | Ustaw ruchomą siłę w pustym punkcie. |
| `balancedSuccess` | The moments balance. | Momenty się równoważą. |
| `notBalancedYet` | Not balanced yet. Adjust the movable force and try again. | Jeszcze nie ma równowagi. Przesuń ruchomą siłę i spróbuj ponownie. |
| `initialTurnCcw` | The counterclockwise moment is larger, so the initial turn is left. | Moment przeciwny do ruchu wskazówek zegara jest większy, więc początkowy obrót jest w lewo. |
| `initialTurnCw` | The clockwise moment is larger, so the initial turn is right. | Moment zgodny z ruchem wskazówek zegara jest większy, więc początkowy obrót jest w prawo. |
| `sameForceSameDistance` | Equal forces balance at equal distances on opposite sides. | Równe siły równoważą się w równych odległościach po przeciwnych stronach. |
| `weakerNeedsFarther` | The weaker force balances by acting farther from the pivot. | Mniejsza siła równoważy układ, gdy działa dalej od punktu podparcia. |
| `strongerNeedsCloser` | The stronger force balances by acting closer to the pivot. | Większa siła równoważy układ, gdy działa bliżej punktu podparcia. |
| `combinedFixedMoments` | The movable moment matches the combined fixed moment in the opposite direction. | Moment ruchomej siły równoważy sumę momentów stałych sił w przeciwnym kierunku. |

### 16.5 Predict Game

| Key | English | Polish |
|---|---|---|
| `predictMission` | What is the initial turn? | Jaki będzie początkowy obrót? |
| `answerCcw` | ↶ LEFT | ↶ W LEWO |
| `answerBalanced` | BALANCED | RÓWNOWAGA |
| `answerCw` | RIGHT ↷ | W PRAWO ↷ |
| `answerCcwAria` | Counterclockwise initial turn | Początkowy obrót przeciwny do ruchu wskazówek zegara |
| `answerBalancedAria` | Rotationally balanced about the pivot | Równowaga obrotowa względem punktu podparcia |
| `answerCwAria` | Clockwise initial turn | Początkowy obrót zgodny z ruchem wskazówek zegara |
| `correctPrediction` | Correct. {reason} | Dobrze. {reason} |
| `predictionReveal` | The initial turn is {result}. {reason} | Początkowy obrót jest {result}. {reason} |
| `singleClockwise` | This force makes a clockwise moment. | Ta siła tworzy moment zgodny z ruchem wskazówek zegara. |
| `singleCounterclockwise` | This force makes a counterclockwise moment. | Ta siła tworzy moment przeciwny do ruchu wskazówek zegara. |
| `throughPivotZero` | The force acts at the pivot, so its moment is zero. | Siła działa w punkcie podparcia, więc jej moment wynosi zero. |
| `alongBeamZero` | The force's line of action passes through the pivot, so its moment is zero. | Linia działania siły przechodzi przez punkt podparcia, więc jej moment wynosi zero. |
| `equalOpposingMoments` | The opposing moments are equal, so the net moment is zero. | Przeciwne momenty są równe, więc moment wypadkowy wynosi zero. |
| `productBalance` | Different forces and distances make equal opposing moments. | Różne siły i odległości tworzą równe przeciwne momenty. |
| `forceWinsProduct` | The larger force also makes the larger force-times-distance product here. | Większa siła tworzy tutaj także większy iloczyn siły i odległości. |
| `distanceWinsProduct` | The smaller force acts far enough away to make the larger moment. | Mniejsza siła działa wystarczająco daleko, aby utworzyć większy moment. |
| `compareProducts` | Compare force × perpendicular distance on both sides. | Porównaj siłę × prostopadłą odległość po obu stronach. |
| `addSignedMoments` | Add counterclockwise moments and subtract clockwise moments. | Dodaj momenty przeciwne do ruchu wskazówek i odejmij momenty zgodne z ich ruchem. |
| `sameSideCanOppose` | Forces on the same side can make opposite moments when they point in opposite directions. | Siły po tej samej stronie mogą tworzyć przeciwne momenty, gdy mają przeciwne kierunki. |
| `pivotForceAddsZero` | The force at the pivot adds zero moment; the other moments decide. | Siła w punkcie podparcia dodaje zerowy moment; decydują pozostałe momenty. |

### 16.6 Summary, Errors, And Accessibility

| Key | English | Polish |
|---|---|---|
| `sessionComplete` | Session complete | Sesja zakończona |
| `correctFirstTry` | Correct on first try | Poprawnie za pierwszym razem |
| `accuracy` | Accuracy | Skuteczność |
| `playAgain` | Play again | Zagraj ponownie |
| `changeGame` | Change game | Zmień grę |
| `continueHint` | Click or press Enter, Space, or Escape to continue. | Kliknij albo naciśnij Enter, spację lub Escape, aby kontynuować. |
| `storageUnavailable` | Progress cannot be saved in this browser. The app still works. | W tej przeglądarce nie można zapisać postępu. Aplikacja nadal działa. |
| `canvasExploreAria` | Interactive moment-of-force experiment | Interaktywny eksperyment z momentem siły |
| `canvasBalanceAria` | Balance mission beam | Belka w misji równowagi |
| `canvasPredictAria` | Rotation prediction beam | Belka do przewidywania obrotu |
| `debugScenarioError` | Unknown debug scenario: {id} | Nieznany scenariusz testowy: {id} |

Required summary tips:

| Key | English | Polish |
|---|---|---|
| `tipForceOnly` | Look at distance as well as force strength. | Sprawdzaj odległość, a nie tylko wartość siły. |
| `tipDirection` | Follow each force to see which way it tends to turn the beam. | Sprawdź, w którą stronę każda siła próbuje obrócić belkę. |
| `tipLineAction` | A force whose line passes through the pivot makes no moment. | Siła, której linia przechodzi przez punkt podparcia, nie tworzy momentu. |
| `tipCombine` | Compare the total clockwise and counterclockwise moments. | Porównaj sumę momentów zgodnych i przeciwnych do ruchu wskazówek zegara. |
| `tipStrong` | You are combining force, distance, and direction well. | Dobrze łączysz siłę, odległość i kierunek. |

## 17. Technical Architecture

### 17.1 Files And Repository Integration

Implementation changes are limited to:

- new `moment/index.html`,
- this `moment/docs/req.md`,
- new `tools/moment-rules-check.mjs`,
- new `tools/moment-dom-check.mjs`,
- `package.json` scripts for the two dedicated checks,
- one new entry in `index.md`.

Do not add sidecar CSS, JavaScript, JSON, image, or audio files. Do not add a
runtime framework or package dependency.

Required hub entry:

```markdown
### [Moment Lab](moment/) `Classical mechanics`

Push near or far from a pivot, change a force's strength and direction, and
see how moments make a beam turn. Explore freely, balance the moments, or
predict the initial rotation.
```

The app head follows `CLAUDE.md` exactly. Canonical and Open Graph URL:
`https://lepecki.com/learn/moment/`.

### 17.2 Script Organization

Use one inline strict IIFE with banner sections in this order:

1. constants and challenge bank,
2. I18N,
3. DOM references,
4. state and storage,
5. pure physics helpers,
6. challenge selection,
7. canvas geometry and drawing,
8. Guide controller,
9. Explore controller,
10. Game controller,
11. accessibility and translation,
12. event wiring,
13. initialization and debug hooks.

No inline event handlers. Use `createElement`, `textContent`, and
`replaceChildren`; never `innerHTML`. Use native `hidden` plus scoped CSS
guards, never inline `style.display` mode switching.

### 17.3 Pure Physics Interface

Keep the following helpers pure and make them available to debug checks only
when `?debug=1` is active:

```js
forceComponents(force) -> { fx, fy }
momentOf(force, pivot) -> signedNumber
perpendicularDistance(force, pivot) -> nonNegativeNumber
sumMoments(forces, pivot) -> signedNumber
classifyMoment(moment) -> "ccw" | "balanced" | "cw"
legalBalanceSockets(record) -> number[]
checkBalanceRecord(record, x) -> { netMoment, result }
```

The production UI, Guide, scenario validation, readouts, and feedback all call
these helpers. Do not maintain separate “visual moment” or game-answer math.

The independent rules check must implement its own formula rather than
trusting these functions.

### 17.4 Rendering

- Use one `<canvas>` for the beam board.
- Use DOM elements for prompts, controls, feedback, Guide prose, equations,
  HUD, and summaries.
- Resize DPR-aware using the current `CLAUDE.md` recipe.
- Draw in CSS-pixel coordinates after setting the DPR transform.
- Render only on state changes except during a brief approved animation.
- Use `requestAnimationFrame` and `performance.now()` for approved animations;
  do not use a continuous idle loop.
- If an animation is active, clamp elapsed frame deltas to `0.05 s` and rebase
  on `visibilitychange`.
- Wait for `document.fonts.ready`, then redraw so canvas labels use JetBrains
  Mono instead of a fallback.

### 17.5 Force Hit Testing And Coordinate Mapping

Maintain explicit functions:

```js
worldToCanvas({ x, y })
canvasToWorld({ x, y })
hitForceTail(pointer)
hitForceHead(pointer)
hitBalanceSocket(pointer)
```

World-to-screen scaling is presentation only and must never affect stored
forces or moment calculations. Pointer movement snaps in world units before
updating state.

### 17.6 Challenge Records And Selection

- Store the 72 expanded records as frozen data.
- Validate records once during initialization in debug builds.
- Normal builds must not expose a scenario editor.
- The selection algorithm works from immutable arrays and returns record IDs.
- `Play again` draws a fresh selection; immediate repetition of more than four
  record IDs from the just-completed session should be avoided when the quota
  constraints permit.
- No challenge state is persisted after page reload.

### 17.7 Summary Tip Selection

Track first-attempt errors by misconception category. Select the summary tip
for the most frequent category using this deterministic priority for ties:

```text
line-of-action -> direction -> force-only -> combine -> strong
```

- `through-pivot` and `along-beam` errors map to `tipLineAction`.
- wrong single-force directions map to `tipDirection`.
- Predict `★★` force-distance conflict errors map to `tipForceOnly`.
- Balance `★★★` and Predict `★★★` errors map to `tipCombine`.
- If first-try accuracy is `7/8` or `8/8`, use `tipStrong`.

### 17.8 Local Storage And Privacy

The only persistent key is:

```text
momentIntroSeenV1 = "1"
```

Do not store language, force arrangements, scenario history, scores, input
timing, or identifiers. Storage failure is nonfatal and announced at most once
per page session.

## 18. P0 Acceptance Criteria

The app is not ready to ship unless every item passes.

### 18.1 Science

- [ ] Every force moment uses `rₓFᵧ − rᵧFₓ` internally.
- [ ] The line-of-action and perpendicular-distance construction is correct
  for radial, angled, and perpendicular Guide cases.
- [ ] A force through the pivot and a force along the beam both show zero
  moment.
- [ ] Clockwise and counterclockwise signs match section 6.
- [ ] All 72 records match section 13 exactly.
- [ ] Every Balance record has one and only one legal solution.
- [ ] The app says moments, not necessarily forces, balance.
- [ ] No child-facing claim equates moment with momentum, work, energy, or full
  rotational motion.
- [ ] The schematic tilt is described as initial tendency only.

### 18.2 Guide

- [ ] First visit opens step 1; later visits start in Explore.
- [ ] Storage denial does not prevent entry, exit, or replay.
- [ ] All nine exact EN and PL step titles, copy, scenes, and interactions are
  present.
- [ ] Prev, Next, Exit, keyboard navigation, and final destination actions
  work.
- [ ] Guide replay preserves and restores the normal state snapshot.
- [ ] Step 5 visibly distinguishes application distance from perpendicular
  distance.
- [ ] Step 8 states rotational balance about the pivot without claiming zero
  visible force.

### 18.3 Explore

- [ ] One/two-force selection, force selection, magnitude, position,
  direction, and reset all work.
- [ ] Canvas dragging and panel controls update the same state.
- [ ] All values snap, clamp, and render according to section 9.
- [ ] The selected line of action, moment arm, individual moment, directional
  bars, and net tendency stay synchronized.
- [ ] Keyboard-only users can reproduce every pointer manipulation.
- [ ] Adding/removing `F2` follows the retention rule in section 9.4.

### 18.4 Balance Missions

- [ ] All three difficulty banks start and complete eight-round sessions.
- [ ] Only empty legal sockets accept the movable force.
- [ ] Incorrect placement gives directionally correct feedback and permits a
  retry.
- [ ] Only the first check affects session accuracy.
- [ ] Correct placement shows equal opposing moment totals.
- [ ] Quota-based selection works without duplicates or impossible fallbacks.

### 18.5 Predict Rotation

- [ ] Answer order never changes.
- [ ] All pointer and keyboard answer methods register exactly once.
- [ ] An answer reveals each individual contribution and the net moment.
- [ ] All three difficulty banks start and complete eight-round sessions.
- [ ] Zero-moment radial, pivot, along-beam, and cancellation cases are
  explained distinctly.
- [ ] Predict feedback cannot be answered a second time after reveal.

### 18.6 Localization And Accessibility

- [ ] All visible text, canvas descriptions, titles, and ARIA labels switch
  between EN and PL without resetting progress.
- [ ] No mixed-language child-facing state remains after switching.
- [ ] Focus is visible and phase transitions place it intentionally.
- [ ] The complete app is keyboard operable.
- [ ] Drag changes are announced on release, not every frame.
- [ ] Color is redundant in every required distinction.
- [ ] CSS and JavaScript reduced-motion gates both work.
- [ ] At 200% zoom and `360px` CSS width, no required content is clipped or
  horizontally scrolled.

### 18.7 Repository And Robustness

- [ ] `moment/index.html` is the only runtime app file.
- [ ] Head metadata and hub link are correct.
- [ ] App works without localStorage, `crypto.getRandomValues`, or font network
  completion.
- [ ] Hidden-tab and resize behavior never change a force or record an answer.
- [ ] Normal UI contains no debug controls.
- [ ] All mandated automated and manual checks pass.

## 19. Validation Plan

### 19.1 Independent Rules Check

Create `tools/moment-rules-check.mjs`. It must extract the challenge bank from
`moment/index.html` using explicit source markers:

```js
// [moment-bank:start]
// ... frozen records ...
// [moment-bank:end]
```

The checker independently calculates force components and signed moments. It
must verify all invariants in section 13.8, all canonical cases in section
6.7, selection-quota feasibility, star thresholds, and summary-tip mapping.

It must exit nonzero on any failure and print a concise record ID plus expected
and actual result.

### 19.2 DOM Check

Create `tools/moment-dom-check.mjs` using jsdom. Expose a debug-only test API
under `window.__momentTest` and delete/omit it in normal mode.

The check must cover:

- first visit, repeat visit, and storage exception,
- all nine Guide steps in EN and PL,
- Guide state snapshot restoration,
- one/two-force Explore controls and boundary clamps,
- panel/canvas-equivalent state actions,
- mode-switch confirmation during an active game,
- all debug scenario IDs,
- Balance incorrect retry then correct completion,
- Predict button and keyboard answers,
- full sessions and all star thresholds,
- language switch during each phase,
- focus destinations and overlay dismissal,
- hidden-tab animation rebase,
- absence of debug DOM in normal mode.

### 19.3 Browser And Layout Matrix

Manually verify in current Chrome/Chromium and Firefox:

| Viewport | Required checks |
|---|---|
| `1280×720` | no page scroll; complete beam and panel; no feedback shift |
| `1024×768` | arrows and Guide construction labels remain separated |
| `768×1024` | breakpoint behavior and full-width panel |
| `390×844` | game start aligns HUD, beam, and primary controls |
| `360×640` | no clipping or horizontal scroll; Predict stack allowed |
| `320×568` | functional minimum; page scroll allowed |
| 200% zoom | no lost prompt, answers, feedback, or focus target |

For each size test:

- Guide steps 5, 7, and 9,
- Explore with two maximum-length forces at opposing angles,
- Balance `★★★` with three force tags,
- Predict `★★★` with three arrows,
- longest Polish labels and feedback,
- result overlay and summary.

### 19.4 Input And Accessibility Matrix

- mouse drag and click,
- touch drag, tap, and accidental multi-touch,
- keyboard-only Guide, Explore, Balance, Predict, summary, and language change,
- screen-reader pass through all phase headings and live announcements,
- color-vision simulation confirming labels/patterns retain meaning,
- reduced-motion OS preference toggled before and during the session,
- browser visibility loss during Guide and tilt animation,
- rapid double click/tap and held answer key,
- font load failure and localStorage exception.

### 19.5 Scientific Review Checklist

Before shipment, a reviewer separate from the implementer must confirm:

1. the moment formula and sign convention,
2. all Guide numeric examples,
3. line-of-action geometry at different canvas aspect ratios,
4. all authored bank values against an independent calculation,
5. every zero-moment explanation,
6. every balance statement's scope,
7. the absence of mass/force and moment/energy confusion,
8. the absence of claims about full rotational trajectories.

Record that review in `moment/docs/scientific-review-YYYY-MM-DD.md` if any
finding requires discussion. If the review passes without findings, a concise
section in the implementation handoff is sufficient; do not create an empty
review file.

## 20. Priority, Future Considerations, And Delivery

### 20.1 P0

Everything named in sections 5.1 and 18 is P0. The Guide, both games, exact
challenge bank, independent rules check, bilingual content, and accessible
non-pointer controls cannot be cut without changing the approved product.

### 20.2 P1 Fast Follows

P1 items must not delay v1 and are not implied implementation work:

- optional printable teacher prompt sheet,
- optional `Copy setup link` containing only non-personal Explore parameters,
- a fourth “mixed angled forces” practice set after child testing confirms the
  angle representation is understood,
- optional nonverbal sound effects, off by default and never required.

### 20.3 P2

- full angular dynamics with moment of inertia,
- center-of-mass and distributed-weight problems,
- noncentral or movable pivots,
- 3D torque and the right-hand rule,
- compound levers, gears, pulleys, and mechanical advantage,
- teacher-authored challenges.

These topics should become separate scoped work, not hidden complexity in this
app.

### 20.4 Timeline And Dependencies

There is no external deadline and no service dependency. Recommended delivery
gates:

1. implement pure solver, challenge records, and independent rules check,
2. implement responsive board and Explore equivalence controls,
3. implement and review the exact Guide,
4. implement both game state machines and DOM checks,
5. complete localization, accessibility, layout, and scientific review,
6. add the hub entry only when all gates pass.

Do not publish an `Under development` hub entry unless the owner explicitly
requests a staged release.

### 20.5 Open Questions

None are blocking. Product identity, audience, mathematical depth, game types,
scenario model, visual chassis, persistence, and validation are all locked by
this document.
