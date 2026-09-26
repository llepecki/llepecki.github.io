# Moment Lab: Requirements And Design Specification

Target implementation: `moment/index.html`

Public URL: `https://lepecki.com/learn/moment/`

Hub integration: add one `Classical mechanics` entry to `index.md` when the
app is implemented.

Required validation commands after implementation:

```bash
npm run code-review -- moment/index.html
npm run moment-rules-check
npm run moment-dom-check
npm run moment-layout-check
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
- Polish title: `Laboratorium momentu siły`
- slug: `moment`
- header icon: `⚖️` (`&#x2696;&#xFE0F;`)
- English lead term: `moment of force`, shortened to `moment` after definition
- English synonym introduced once: `torque`
- Polish term: `moment siły`

The app must explicitly say that a moment of force is neither momentum nor
angular momentum. It must not assume that similarity between the English words
means similarity between the physical quantities.

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
9. Wojskowa Akademia Techniczna, Polish physics text defining `ramię siły`:
   https://www.wtc.wat.edu.pl/wp-content/uploads/2023/09/fizyka4zr.pdf
10. Główny Urząd Miar, Polish SI unit-name guidance:
    https://www.gum.gov.pl/download/2/2863/pxdu021994.pdf
11. Zintegrowana Platforma Edukacyjna, Polish rigid-body equilibrium lesson:
    https://zpe.gov.pl/a/przeczytaj/D3u6Y4Nme

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
- All four required validation commands at the top of this document pass.

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
- rules, DOM, and browser-layout validation scripts,
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
the visual moment scaffolds in section 10.6; multiplication may reinforce
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
action. This distance is the **moment arm** / **ramię siły**. This is the
definition the child-facing Guide must visualize.

The signed `M` above is solver data. Child-facing individual-moment readouts
never show a sign: they show `|M|` followed by its full direction, for example
`6 N·m clockwise` / `6 N·m zgodnie z ruchem wskazówek zegara`. A zero
individual moment shows `0 N·m; no turning effect` / `0 N·m; brak efektu
obrotowego`. Signed values are reserved for the net-moment readout and
technical/debug material.

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

Game records use integer forces and distances and therefore have exact integer
moment results; display Game moments without a decimal point. Explore retains
full floating-point precision and displays moments to one decimal place. If a
nonzero Explore magnitude would round to `0.0`, display `< 0.1` with its
direction instead of displaying a contradictory zero. Net-moment readouts use
`+` for counterclockwise, Unicode minus `−` for clockwise, and unsigned `0`
for balance. Section 16.7 locks visual decimal separators and spoken unit
inflection.

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
  balancePlacement: { status: "unplaced", socketX: null },
  revealPhase: { kind: "idle", forceIndex: null },
  hintShown: false,
  errorCategory: null,
  feedback: null,
  resultWashOpen: false,
  leaveConfirmOpen: false,
  reducedMotion: false
}
```

Do not duplicate physics truth in UI flags. Direction, balance, moment values,
and correct answers are derived from force records by the canonical solver.
Reset `balancePlacement`, `hintShown`, `errorCategory`, `feedback`, and
`revealPhase` at the start of every round. `balancePlacement` follows the five
states in section 11.1. `revealPhase.kind` is exactly `idle`, `force`, `totals`,
`net`, `motion`, or `complete`; `forceIndex` is non-null only during `force`.
`errorCategory` stores only the first checked error in a round and is appended
to the session misconception counts once. None of these fields may duplicate
or override a solver result.

### 7.4 Normative Event Transitions

No controller may invent a transition outside this table. `CLEAR_SESSION`
means clear scenario IDs, round counters, attempts, feedback, reveal state,
placement state, hint state, misconception counts, and result-wash state; it
does not reset Explore forces or language.

| Current phase | Event / condition | Next phase | Required state effect and focus |
|---|---|---|---|
| initialization | Guide key absent or storage read fails | `intro` | Set `introReturn` to the initial Explore snapshot; focus Guide heading. A storage failure also queues the one-time storage notice. |
| initialization | Guide key equals `"1"` | `explore` | Focus Explore canvas. |
| any normal phase | `OPEN_GUIDE` | `intro` | Snapshot the complete normal state in `introReturn`; Guide interaction state is new and deterministic. |
| `intro` | `EXIT_GUIDE` or Escape | restored phase | Set the seen key if possible, restore `introReturn` exactly, and clear `introReturn`. On first visit, restore `explore` and focus its canvas; on replay, focus the control that opened Guide. |
| `intro` | `START_EXPLORING` on step 9 | `explore` | Set the seen key, discard `introReturn`, preserve the normal Explore setup if one existed, set mode Explore, and focus canvas. |
| `intro` | `START_GAME` on step 9 | `gameSetup` | Set the seen key, discard `introReturn`, set mode Game, and focus Game Start. |
| `explore` | select Game | `gameSetup` | Preserve Explore state and focus Game Start. |
| `gameSetup` or `gameSummary` | select Explore | `explore` | `CLEAR_SESSION`, preserve Explore state, and focus canvas. |
| `gameSetup` | `START_SESSION` | `gameRound` | Select eight records, initialize round 1, reset all round fields, and focus the Balance movable force or Predict answer group. |
| `gameRound` | legal Balance Check or Predict answer | `gameFeedback` | Record the attempt once, lock round input, and start section 10.5 with `revealPhase.kind = "force"`. For Balance, calculate the result first and immediately set placement status to `revealingCorrect` or `revealingWrong`; Predict does not use placement status. |
| `gameFeedback` | wrong Balance reveal completes | `gameRound` | Set placement status `placed`, keep its socket and numeric feedback, set `revealPhase.kind = "complete"`, unlock placement, and restore focus to the movable force. |
| `gameRound` | first placement change while wrong feedback is retained | `gameRound` | Clear `feedback`, set `revealPhase` to `{ kind: "idle", forceIndex: null }`, preserve `attemptCount` and the first `errorCategory`, then render new live strips. |
| `gameFeedback` | correct Balance or any Predict reveal completes | `gameFeedback` | Set `revealPhase.kind = "complete"`; for Balance, set placement status `revealedCorrect`. Show feedback and Next, and focus Next; round inputs remain locked. |
| `gameFeedback` | Next before round 8 | `gameRound` | Advance index, reset all per-round fields, and focus the new primary interaction. |
| `gameFeedback` | Next after round 8 | `gameSummary` | Calculate summary, set `resultWashOpen = true`, and focus the wash; summary remains rendered behind it. |
| `gameSummary` | dismiss wash by pointer, Escape, Enter, or Space | `gameSummary` | Set `resultWashOpen = false` and focus the summary heading. |
| `gameSummary` | `PLAY_AGAIN` | `gameRound` | `CLEAR_SESSION`, immediately select a fresh session using section 10.3, initialize round 1, and focus its primary interaction. |
| `gameSummary` | `CHANGE_GAME` | `gameSetup` | `CLEAR_SESSION` and focus Game Start. |
| any non-`intro` phase | `OPEN_GUIDE` | `intro` | Snapshot the full normal state into `introReturn`, open at step 1, focus the step heading. Leaving the Guide restores that snapshot exactly; no progress is lost and no confirmation is shown. Disabled while `revealPhase.kind` is `force`, `totals`, `net`, or `motion`, and while `leaveConfirmOpen` (added 2026-09-01). |
| `gameRound` or `gameFeedback` | request Explore while `revealPhase.kind` is `idle` or `complete` | unchanged | Set `leaveConfirmOpen = true`; do not alter round/reveal state; focus `Stay`, announce `leaveGameQuestion` through the live region, and expose the question as the `aria-describedby` description of both `Stay` and `Leave game` (amended 2026-09-01 — the question was visible but silent for assistive technology). Disable every underlying round control and shortcut; only `LEAVE_GAME`, `STAY`, Escape, and language switching remain enabled. The mode selector is disabled for `force`, `totals`, `net`, and `motion`, so no request can occur during those phases. |
| active game with confirmation | `STAY` or Escape | unchanged | Set `leaveConfirmOpen = false`, derive the prior enabled/disabled controls from the unchanged phase, placement, reveal, and feedback state, and restore focus to the invoking mode control. No round value changes and no attempt is recorded. |
| active game with confirmation | `LEAVE_GAME` | `explore` | Set `leaveConfirmOpen = false`, `CLEAR_SESSION`, preserve Explore forces, set mode Explore, and focus canvas. |

Guide Previous/Next and its internal answers never change `phase`. An invalid
Balance drop, disabled Check activation, repeated Predict keydown, tab
visibility change, or resize also never changes `phase` or records an attempt.

## 8. Nine-Step Guide

### 8.1 Shared Guide Behavior

- Auto-open once using `momentIntroSeenV1`.
- Provide a normal-mode `Guide` action inside collapsed `How it works` help.
- Use a dedicated intro panel for commentary/navigation, not a full-screen
  modal over the board. Step-specific scene controls may use the explicitly
  defined interaction layer inside `.canvas-wrap`.
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

### 8.2 Step 1 — A Push Can Turn an Object

ID: `push-can-turn`

Title:

- EN: `A Push Can Turn an Object`
- PL: `Pchnięcie może obrócić przedmiot`

Commentary:

- EN: `A force can change how an object moves. If the object is held at a pivot, a force can also make it turn.`
- EN: `The pivot is the fixed point that the object turns around.`
- PL: `Siła może zmienić ruch przedmiotu. Gdy przedmiot jest zamocowany w punkcie podparcia, siła może też go obracać.`
- PL: `Punkt podparcia to nieruchomy punkt, wokół którego obraca się przedmiot.`

Scene:

- show a simple top-view door for the first `1.2 s`, then morph or cross-fade
  to the standard beam and central pivot,
- show one unlabeled perpendicular push, then add the normative labels
  `Force` / `Siła` and `Pivot` / `Punkt podparcia`,
- no values or formula.

Controls: one `Replay` / `Powtórz` action.

### 8.3 Step 2 — Which Way Will It Turn?

ID: `turn-direction`

Title:

- EN: `Which Way Will It Turn?`
- PL: `W którą stronę się obróci?`

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
   `Clockwise ↷` / `Zgodnie z ruchem wskazówek zegara ↷` or
   `↶ Counterclockwise` / `↶ Przeciwnie do ruchu wskazówek zegara`.
2. A correct choice reveals the moment arc and enables `Next example` /
   `Następny przykład`.
3. Show `left-down` and repeat.
4. A wrong choice uses the direction-specific normative retry copy in section
   16.1.1, then leaves both choices enabled for an immediate retry.

Guide errors never affect a score or block Exit/Previous.

### 8.4 Step 3 — Farther from the Pivot, Larger Moment

ID: `distance`

Title:

- EN: `Farther from the Pivot, Larger Moment`
- PL: `Dalej od punktu podparcia: większy moment`

Commentary:

- EN: `These pushes have the same strength and point straight down. The push farther from the pivot has the larger turning effect.`
- EN: `This comparison works because only the distance changes.`
- PL: `Te siły mają taką samą wartość i są skierowane pionowo w dół. Siła działająca dalej od punktu podparcia ma większy efekt obrotowy.`
- PL: `To porównanie działa, ponieważ zmienia się tylko odległość.`

Scene variants:

- near: `x = +1 m`, `F = 2 N`, moment `2 N·m` clockwise,
- far: `x = +3 m`, `F = 2 N`, moment `6 N·m` clockwise.

Controls: `Near` / `Blisko` and `Far` / `Daleko`.

### 8.5 Step 4 — Stronger Force, Larger Moment

ID: `force-strength`

Title:

- EN: `Stronger Force, Larger Moment`
- PL: `Większa siła: większy moment`

Commentary:

- EN: `Now the force acts at the same point and in the same direction. The stronger force has the larger turning effect.`
- EN: `This time only the force strength changes.`
- PL: `Teraz siła działa w tym samym miejscu i kierunku. Większa siła ma większy efekt obrotowy.`
- PL: `Tym razem zmienia się tylko wartość siły.`

Scene variants:

- gentle: `x = +3 m`, `F = 1 N`, moment `3 N·m` clockwise,
- strong: `x = +3 m`, `F = 3 N`, moment `9 N·m` clockwise.

Controls: `Smaller force` / `Mniejsza siła` and `Larger force` /
`Większa siła`.

### 8.6 Step 5 — The Line of Action

ID: `line-of-action`

Title:

- EN: `The Line of Action`
- PL: `Linia działania siły`

Commentary:

- EN: `Imagine extending the force arrow in a straight line. This is its line of action. The moment arm is the shortest distance from the pivot to this line, measured at a right angle.`
- EN: `If the force's line of action passes through the pivot, its moment is zero. For the same force and application point, a force perpendicular to the beam makes the largest moment.`
- PL: `Wyobraź sobie prostą biegnącą wzdłuż strzałki siły. To linia działania siły. Ramię siły to najkrótsza odległość od punktu podparcia do tej linii, mierzona pod kątem prostym.`
- PL: `Gdy linia działania siły przechodzi przez punkt podparcia, moment siły wynosi zero. Dla tej samej wartości siły i tego samego punktu przyłożenia siła prostopadła do belki daje największy moment.`

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

Render the cards as three DOM buttons in a centered interaction layer inside
`.canvas-wrap`; they never enter the `320px` intro panel. The layer width is
`min(288px, calc(100% - 32px))`, uses three equal columns with zero CSS gap,
and sits below the question without covering the beam's force arrows. Each
column is a `96×120px` hit region at the `320px` minimum; an `88×112px` visible
card is centered inside it, creating an `8px` visual gap between neighbors.
The commentary and Guide navigation remain in the intro panel. Correctly
choosing A for question 1 reveals only A's
line crossing the pivot, `d⊥ = 0`, and `M = 0`, then advances to question 2;
B and C remain unrevealed. Correctly choosing C for question 2 reveals the
perpendicular segments, right-angle markers, `d⊥`, and moments for all three
cards so they can be compared. A wrong selection uses the question-specific
normative retry copy in section 16.1.1 and permits retry on the same question.

### 8.7 Step 6 — Moment of Force

ID: `name-and-equation`

Title:

- EN: `Moment of Force`
- PL: `Moment siły`

Commentary:

- EN: `The turning effect is called the moment of a force, or torque. It is not momentum or angular momentum.`
- EN: `Moment size = force strength × moment arm. We measure it in newton metres: N·m.`
- PL: `Efekt obrotowy nazywamy momentem siły. Moment siły to nie pęd ani moment pędu.`
- PL: `Wartość momentu siły = wartość siły × ramię siły. Mierzymy ją w niutonometrach: N·m.`

Scene:

- `x = +3 m`, `F = 2 N` down,
- show `Moment size = force strength × moment arm` /
  `Wartość momentu siły = wartość siły × ramię siły`, then substitute
  `Moment size = 2 N × 3 m = 6 N·m` / `Wartość momentu siły = 2 N × 3 m = 6 N·m`,
- show a clockwise arc labeled `6 N·m`,
- do not show `τ`, cross-product notation, or sine in child-facing UI.

Controls: none.

### 8.8 Step 7 — Different Forces Can Make Equal Moments

ID: `trade-force-distance`

Title:

- EN: `Different Forces Can Make Equal Moments`
- PL: `Różne siły mogą dawać równe momenty`

Commentary:

- EN: `A smaller force farther away can make the same moment as a larger force closer to the pivot.`
- EN: `Two newtons at three metres and three newtons at two metres both make a moment of six newton metres.`
- PL: `Mniejsza siła działająca dalej od punktu podparcia może wywołać taki sam moment jak większa siła działająca bliżej.`
- PL: `Dwa niutony w odległości trzech metrów i trzy niutony w odległości dwóch metrów dają moment sześciu niutonometrów.`

Scene:

- left downward force: `x = −2 m`, `F = 3 N`, individual readout
  `6 N·m counterclockwise`,
- right downward force: `x = +3 m`, `F = 2 N`, individual readout
  `6 N·m clockwise`,
- show equal-length opposed moment bars and products `3 × 2` and `2 × 3`.

Controls: one `Swap sides` / `Zamień strony` action. Swapping changes which
side uses each force but leaves the moments equal.

### 8.9 Step 8 — When Moments Balance

ID: `net-moment`

Title:

- EN: `When Moments Balance`
- PL: `Gdy momenty się równoważą`

Commentary:

- EN: `Clockwise and counterclockwise moments oppose each other. Equal opposing moments give zero net moment.`
- EN: `The beam is rotationally balanced about its pivot. The pivot may still be pushing on the beam.`
- PL: `Momenty zgodne i przeciwne do ruchu wskazówek zegara mają przeciwne zwroty. Równe momenty o przeciwnych zwrotach dają zerowy moment wypadkowy.`
- PL: `Belka jest w równowadze obrotowej względem punktu podparcia. Punkt podparcia może nadal działać siłą na belkę.`

Scene variants:

- fixed force: `D(−2,3)`, individual readout `6 N·m counterclockwise`,
- movable force: `2 N` downward, initially in the Guide dock,
- legal whole-metre sockets from `−4` to `+4`, excluding the pivot and fixed
  socket,
- unique balance position: `x = +3 m`.

Interaction:

- Show `guideBalancePrompt` and ask the child to place the movable force.
- Use the same dock, drag/drop, Position buttons, keyboard movement, live
  moment strips, and invalid-drop rules as Balance Missions, but do not score
  the attempt.
- A wrong Check runs the explanatory reveal and unlocks the same arrangement.
- The correct position reveals `6 N·m` against `6 N·m` and the commentary's
  rotational-balance distinction.

### 8.10 Step 9 — Try It Yourself

ID: `how-to-play`

Title:

- EN: `Try It Yourself`
- PL: `Wypróbuj samodzielnie`

Commentary:

- EN: `In Explore, move forces and watch each moment change.`
- EN: `In Game, balance the moments or predict the beam's initial turning direction.`
- PL: `W trybie Eksperyment przesuwaj siły i obserwuj, jak zmienia się każdy moment.`
- PL: `W trybie Gra równoważ momenty albo przewiduj kierunek początkowego obrotu belki.`

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
- perpendicular distance visible for the selected force; the line of action
  appears only while that force is being dragged (amended 2026-09-01),
- individual moment: `6.0 N·m clockwise`,
- no second force until the child selects `Two forces`.

When enabled, `F2` defaults to `x = −2 m`, `3 N`, `270°`, which exactly
balances the default `F1`.

### 9.3 Direct Manipulation

- Drag a force tail horizontally along the beam to change its application
  position in `0.5 m` increments.
- Drag a force arrow — the arrowhead OR anywhere along its shaft — to change
  direction in `15°` increments and magnitude in `0.5 N` increments
  (shaft grabbing added 2026-09-01).
- Clamp magnitude to `0.5–5.0 N` and position to `−4.0–+4.0 m`.
- Use `pointerdown/move/up/cancel`, `lostpointercapture`, pointer capture, and
  large invisible hit regions.
- The visible tail and head may remain compact, but each uses a circular
  `24 CSS px` hit radius (`48px` diameter). If both regions contain the pointer,
  compare screen-space distance to their centres and select the nearer one;
  only an exact tie selects the head. Each endpoint region is the UNION of that
  circle and the `48×48 CSS px` interaction box described in section 14.4,
  which may shift inward near a canvas edge. When neither endpoint region
  contains the pointer, the shaft is hit-tested as a segment with a
  `20 CSS px` tolerance and grabs the arrow, so endpoint selection keeps its
  exact contract (shaft rule added 2026-09-01).
- Selecting any part of an unselected arrow selects it before dragging.
- Do not allow dragging the beam or pivot.

All Explore and Balance canvas drags use one active pointer. Only an event with
`isPrimary === true` may begin a drag; store its `pointerId` and ignore every
additional pointer until that drag ends. Store the pre-drag committed state.
On a successful `pointerup`, commit the snapped value, clear the active pointer
before releasing capture, and then release capture. On `pointercancel`, Escape,
or `lostpointercapture` while the pointer is still active, restore the pre-drag
committed state, clear the active pointer, release capture if still held, and
announce the restored value once. No cancel path records a game attempt.

Arrow dragging is relative, not absolute (amended 2026-09-01 — the arrow
previously jumped so its head sat under the pointer, which made grabbing it
feel like a snatch and made the shaft dead space; this matches the velocity
vector in `gravassist/index.html`). On `pointerdown` store the current head
point, a zeroed movement accumulator, and the pointer position. On every move,
add the pointer's movement since the last move to the accumulator — scaled by
`0.125` while `Shift` is held, so pressing or releasing `Shift` mid-drag never
jumps the arrow — and take the effective head point as the stored head plus the
accumulator. Grabbing any part of the arrow therefore moves the head by exactly
the distance the pointer moves.

Arrow dragging then uses this exact polar mapping on every pointer move, over
that effective head point:

1. calculate the canvas vector from the stored tail centre to the effective
   head point;
2. convert it to world direction by negating canvas `dy`, normalize to
   `0…<360°`, and round to the nearest `15°`;
3. divide the screen-space vector length by the current uniform
   `forcePxPerN`, round to the nearest `0.5 N`, and clamp to `0.5–5.0 N`;
4. update direction and magnitude together from those snapped values.

If the effective head point is exactly at the tail centre or the vector is
shorter than `0.25 × forcePxPerN`, retain the previous direction and select the
minimum `0.5 N` magnitude. Tail dragging changes only position; arrow dragging
never changes application position.

While an arrow drag is in progress, draw two guides in the shared drag-guide
style of section 14: the force's line of action, and a circle centred on the
tail at the current arrow length. Both tighten together while `Shift` is held. Hovering the tail region shows a `move` cursor and
hovering the rest of the arrow shows `grab`; a drag in progress shows
`grabbing`, and both hover states clear when the drag ends (all added
2026-09-01).

`Shift` is read from the pointer event itself on every `pointerdown` and
`pointermove`, never from keyboard state alone, so a `Shift` press or release
the document never saw — pressed before the page had focus, or released under
a context menu — cannot leave a drag stuck in or out of fine control.

Tail dragging uses the same relative accumulator as arrow dragging, seeded
from the tail instead of the head, so grabbing the edge of the `48px` tail
target does not jump the force a whole socket before the child has moved
(2026-09-01). A resize during any drag re-seeds the stored anchor and zeroes
the accumulator, because the frozen pixel frame no longer matches the
rescaled board.

This app deliberately does NOT reproduce gravassist's latched precision
button: fine control is `Shift`-only, and the exact-value affordance for
touch users is the panel's steppers and sliders (section 9.4), which give
discrete values directly and suit this app's audience better than a
precision latch.

The canvas is never the only means of editing. The panel controls in section
9.4 expose the same discrete state.

### 9.4 Explore Panel

Use exactly four panel sections:

1. `Mode`: the Explore/Game selector, plus a `Guide` button.

   Amended 2026-09-01: the Guide must be reachable from EVERY phase. It was
   previously only reachable through `How it works` in Explore and
   `How to play` in game setup, so a child inside a round or on the summary
   had no way back to it. The `Mode` section is the one section never hidden,
   so a single `Guide` button lives there and the two buried `Replay guide`
   copies were removed — one entry point, always in the same place.

   Opening the Guide is a detour, not a mode change: `snapshotNormalState`
   already captures the whole session (game type, difficulty, scenario ids,
   round index, score, attempts, placement, reveal phase, hint, error
   category, feedback), so leaving the Guide restores the round exactly and no
   leave confirmation is required. The button locks while a reveal is playing
   or the leave confirmation is open, matching the mode buttons.
2. `Force controls`: `One force` / `Two forces` and conditional `F1` / `F2`
   selection, always visible; then a `Set exact values` disclosure holding the
   force strength, position, and direction slider rows.

   Amended 2026-09-01: the slider rows moved behind a disclosure. Dragging the
   arrow is now the primary way to change a force, and the three rows were
   `268px` — 45% of a panel that fit its viewport with zero slack in both
   languages, which is why Polish copy had already overflowed it once. The
   rows are NOT removed: they remain the only precise input on touch (Shift
   fine control is keyboard-only), the only widgets that announce a value on
   focus without changing it, and the visible statement that a force has a
   strength, a position and a direction.

   The disclosure starts collapsed for a fine pointer and open when
   `(pointer: coarse)` matches, because that is exactly where dragging is
   imprecise — a finger covers the arrow it is dragging. The state is
   per-session and never persisted (see 17.8).

   Rejected alternative (measured, 2026-09-01): dropping the range tracks and
   keeping bare steppers. It saves `0px` — the `48px` row height comes from
   the stepper touch targets, not the track — while removing the range
   widgets' value-on-focus announcement and their only fast path (`Home`,
   `End`, `PageUp`/`PageDown`); reaching `90°` from `270°` would become
   twelve button presses.

   Panel fit: the DEFAULT (collapsed) Explore panel must fit its viewport
   without scrolling in both languages at every supported size — the state
   the child actually meets. With the rows revealed, the panel may scroll:
   the disclosure toggle costs `48px` of its own, so Polish with two forces
   and every row open runs about `39px` past a `720px` viewport. That is a
   deliberate, user-initiated reveal in a container that scrolls natively, so
   the test asserts that it scrolls rather than clips and that the last
   control stays reachable. Collapsing still turns a default panel that fit
   with ZERO slack in both languages into one with roughly `180px` to spare,
   which is the fragility this change was made to remove.
3. `Moments`: selected-force moment, clockwise total,
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
text. The complete four-section panel, including Moments, must fit
within the `674px` content height available at `1280×720` without panel
scrolling; only the expanded help body may extend below the fold.

Adding `F2` must not change `F1`. Removing `F2` retains its last state in
memory for the current page session so re-enabling it restores the comparison.

### 9.5 Board Annotations

The main board shows only information that explains the current physics:

- beam, minor sockets every `0.5 m`, pivot, and whole-metre labels. No socket
  mark is drawn at the pivot or at the `±4 m` ends, where it would sit on the
  beam's rounded cap and read as a chip out of the edge rather than a marker
  (amended 2026-09-03); the metre numbers still name those positions and
  Balance still rings them while placing,
- force arrows labeled `F1` and `F2`, with numeric magnitude near each arrow.
  The label sits beside the MIDDLE of its arrow, centred, offset along the
  arrow's perpendicular, following the velocity-vector label in
  `gravassist/index.html` (amended 2026-09-01; it previously sat at the
  arrowhead, where it crowded the head). Two adaptations are required and
  intentional, because this app draws an OPAQUE chip on a light canvas over a
  `5px` shaft where gravassist draws bare text over a `3px` one (the shaft was
  `9px` while it carried a casing; the rule survives the casing's removal —
  only the number changed, 2026-09-03):
  - the perpendicular step is sized from the chip's own silhouette — the
    distance from the chip's centre to its boundary along that direction, plus
    a fixed gap — so the chip's EDGE clears the arrow by the same gap at every
    angle, rather than the chip's centre sitting a fixed distance away;
  - the perpendicular is the mirror of gravassist's (a `−90°` screen rotation
    of the arrow direction rather than `+90°`), so the chip drifts away from
    the pivot and its moment-arc labels instead of into them.

  Labels are placed last, above every other annotation, and a label whose chip
  would cover the beam, the pivot, a metre number, another chip, or another
  force's label is moved to the nearest position that clears them all —
  sliding along the arrow, then stepping further out perpendicular, then to
  the mirrored side. This replaced a fixed minimum along-arrow anchor
  (2026-09-01), which pinned every force below about `2.35 N` to the same
  offset and let one opaque chip completely cover another in two-force
  Explore,
- selected force's line of action, drawn ONLY while that force is being
  dragged on the canvas (amended 2026-09-01: at rest the full-canvas dashed
  line dominated the board without being acted on). The Guide construction
  steps and the zero-moment reveal still draw it unconditionally, because
  there it IS the thing being taught,
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
- incorrect: name each directional total, the signed net moment, and the
  initial turning direction,
- never use `Wrong!`, ridicule, loss language, or a failure sound,
- numbers supplement the visual explanation; they are not the only feedback.

Every checked game result uses this numeric sentence before its authored
reason. Placeholder values come from the canonical solver, not challenge
copy:

- EN: `Counterclockwise total: {ccw} N·m. Clockwise total: {cw} N·m. Net moment: {net} N·m. Result: {result}.`
- PL: `Suma momentów przeciwnych do ruchu wskazówek zegara: {ccw} N·m. Suma momentów zgodnych z ruchem wskazówek zegara: {cw} N·m. Moment wypadkowy: {net} N·m. Wynik: {result}.`

`{result}` is exactly one of `resultCcw`, `resultBalanced`, or `resultCw` from
section 16.5; no other phrase is accepted. Game values are integers and are
displayed without a decimal point: `{ccw}` and `{cw}` are unsigned totals,
while `{net}` is `0`, has a leading `+` when counterclockwise, or uses the
Unicode minus sign `−` when clockwise. `{position}` expands to the localized whole-metre
left/right-of-pivot phrase, never a bare signed coordinate. Explore retains the
one-decimal and `< 0.1` rules in section 6.4. The feedback region reserves the
height of the longest Polish message at the current breakpoint before a round
begins; revealing feedback must not move the beam, answer controls, or primary
action.

Feedback composition is normative and uses one text node or adjacent block per
listed key in this exact order:

| Outcome | Block 1 | Block 2 | Block 3 | Block 4 |
|---|---|---|---|---|
| Correct Balance | `momentTotals` | `balancedSuccess` | record `explanationKey` | none |
| Incorrect Balance | `momentTotals` | `notBalancedYet` | `initialTurnCcw` or `initialTurnCw` | tip key mapped from the round's recorded `errorCategory` (17.7 mapping) |
| Correct Predict | `momentTotals` | `correctPrediction` with `{reason}` from record `explanationKey` | none | none |
| Incorrect Predict | `momentTotals` | `predictionReveal` with `{result}` and `{reason}` | tip key mapped from the round's recorded `errorCategory` (17.7 mapping) | none |

Amendment (2026-08-31, owner-approved): incorrect outcomes append the
misconception tip for the recorded first-error category as one extra block,
so the relevant guidance reaches the child during the round as well as at
the summary. The tip block appears only when an `errorCategory` has been
recorded for the round.

Never concatenate translated fragments outside these complete templates.

At the end:

- show the standard brief full-screen result wash, dismissible by click,
  Escape, Enter, or Space,
- reveal an in-stage summary with first-try correct count, accuracy, stars, one
  misconception-specific tip, `Play again`, and `Change game`,
- star thresholds: `8 = ★★★`, `6–7 = ★★`, `0–5 = ★`,
- stars measure first-attempt accuracy only.

Do not persist best scores.

### 10.5 Shared Reveal Sequence

Guide step 9, every Balance check, and every Predict answer use one reveal
controller and this exact order:

1. lock all round input immediately;
2. for each force in stable left-to-right order, highlight the force and draw
   its direction arc with an unsigned magnitude for `180 ms`; zero-moment
   forces receive a pivot/line-of-action pulse instead of a false direction
   arc;
3. fill the counterclockwise and clockwise total strips together over
   `220 ms`;
4. reveal the signed net moment and its classification over `180 ms`;
5. if unbalanced, tilt the beam at most `6°` for `300 ms`, hold `250 ms`, and
   return for `250 ms`; if balanced, bring the two total-strip ends to the
   same guide and give the restrained pivot a `400 ms` settle/glow;
6. reveal numeric feedback and either `Next` or, after an incorrect Balance
   placement, unlock the same round for correction.

The sequence does not imply that these events occur separately in the physical
system; it is explanatory choreography. All durations are elapsed-time targets,
not per-frame increments. With reduced motion, render the complete final state,
feedback, and appropriate action immediately in one state transition with no
artificial wait. `revealPhase` is the sole animation phase source; CSS and
canvas code must not run independent reveal timelines.

### 10.6 Required Learning Scaffolds

The games assess visual moment reasoning, not unaided multiplication:

- All Balance levels show a live moment strip for every placed force and live
  counterclockwise/clockwise total strips while the movable force is moved.
  Fixed-force strips remain visible while the movable force is in its dock.
  The net number, classification word, and success state stay hidden until
  `Check balance`; equality is discoverable visually but never auto-submitted.
- Predict `★` shows force arrows only before the answer; these cases require
  direction or line-of-action reasoning.
- Predict `★★` always shows, before the answer, one proportional moment strip
  per force plus a compact `force strength × moment arm` tile such as
  `2 N × 3 m`. It does not show the product, directional totals, net moment, or
  classification until reveal.
- Predict `★★★` shows each individual proportional strip and a `↶` or `↷`
  direction icon. A `Show moment guide` / `Pokaż pomoc z momentami` button,
  at least `48px` high, groups those strips into the two directional totals
  without showing the net number or classification. Using it sets
  `hintShown = true` but never changes score, attempt count, or scenario.
- A zero individual moment uses an outlined `0 N·m` marker and a
  line-through-pivot symbol instead of a zero-width invisible strip or a false
  direction icon.

All game moment strips use the fixed scale `8 CSS px per N·m`; do not normalize
each diagram independently. Thus close authored cases such as `8 N·m` versus
`9 N·m` remain visibly different. If the available row is narrower than the
combined strips, keep each direction on its own fixed-scale row; never shrink
or normalize the scale. Product notation is explanatory and multiplication is
optional: every required decision remains possible by comparing the visible
strips and direction icons.

## 11. Balance Missions

### 11.1 Core Loop

The board shows one or two fixed downward force tags and one movable downward
force tag. All tags state force in newtons. The movable tag starts in a labeled
dock below the beam, not at a guessed socket. The dock and tag each expose at
least a `48×56px` hit region. Legal empty whole-metre sockets
`−4, −3, −2, −1, +1, +2, +3, +4` highlight when the tag is grabbed or has
canvas focus; the pivot and occupied fixed-force sockets never highlight and
are never legal.

Flow:

1. announce the mission and focus the movable force,
2. child drags or moves it from the dock to a legal socket; a legal drop snaps
   exactly to that socket,
3. child presses `Check balance`, Enter on the canvas, or Space while the
   movable force has canvas focus,
4. calculate all moments through the canonical solver,
5. run the shared reveal in section 10.5,
6. if exact balance, keep the placement locked and advance only on `Next`,
7. if unbalanced, preserve the placed position, show diagnostic feedback, and
   unlock the same round for correction after the reveal.

Only the first check affects first-try accuracy. Later retries remain
educational and unpenalized.

`Check balance` is disabled while the movable force is in the dock. An invalid
or occupied drop returns the tag to its previous legal socket, or to the dock
if it has never been placed, and announces the specific reason in the polite
live region. Invalid drops do not count as checks or attempts.

Keyboard contract while the movable tag has canvas focus:

- from the dock, Left selects the nearest legal socket left of the pivot and
  Right selects the nearest legal socket right of the pivot;
- once placed, Left/Right traverses legal sockets in spatial order, skipping
  the pivot and occupied sockets without wrapping;
- Enter or Space runs `Check balance` only from a legal placed state;
- Escape during a drag cancels it and restores the prior legal state.

The round panel also exposes a compact `Position` row with `previousSocket`
(`Previous spot`) and `nextSocket` (`Next spot`) buttons, each at least
`48×48px`, plus the localized current position. Polish labels resolve only
through I18N. The buttons perform the same traversal as Left/Right;
from the dock, Previous chooses the nearest legal left socket and Next chooses
the nearest legal right socket. This row is the precise touch/click alternative
when narrow-canvas socket spacing is less than `48px`.

Pointer drop selection uses the nearest socket centre within the beam's
vertical drop band, with boundaries halfway between adjacent socket centres.
The band is at least `56px` high. A projection satisfying
`−0.5 m ≤ x ≤ +0.5 m` is the inclusive pivot dead zone and announces
`invalidPivot`; the adjacent socket regions begin only outside those
boundaries. A point outside the band or beyond the beam is an invalid drop.
Occupied sockets retain their region so
dropping on one announces `occupiedSocket` rather than silently selecting a
neighbor. Socket regions may
be narrower than `48px` at the minimum viewport because they are destinations
for a `48×56px` dragged tag, not the sole discrete controls; the 48px Position
buttons provide exact selection without fine pointing.

The normative placement states are:

| `balancePlacement.status` | Input | Check | Required rendering / transition |
|---|---|---|---|
| `unplaced` | dock drag and Left/Right enabled | disabled | tag in dock; fixed strips/totals visible |
| `placed` | drag and Left/Right enabled | enabled | tag snapped to legal socket; all live strips/totals update |
| `revealingWrong` | locked | disabled | run section 10.5, preserve socket, then return to `placed` with feedback |
| `revealingCorrect` | locked | disabled | run section 10.5, preserve socket, then enter `revealedCorrect` |
| `revealedCorrect` | locked | disabled | balanced final state and feedback persist; `Next` is the only round action |

There is no transient free-floating stored position: pointer coordinates are
used only during drag rendering, and state commits only a dock or legal socket.

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
- the child balances the fixed forces' combined net moment,
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

Classify the first checked Balance error deterministically in the following
first-match order for the session tip:

- `Math.sign(x) !== Math.sign(record.solutionX)` -> `direction`;
- in `★★`, `x === -record.forces[0].x` (the unequal movable force was placed at
  the fixed force's mirrored equal distance) -> `force-only`;
- in `★★`, correct side but any other wrong force-distance product ->
  `combine`;
- every wrong `★★★` check -> `combine`;
- any remaining wrong check -> `compare` (neutral visual-comparison tip).

The visual and numeric feedback may be identical for multiple categories;
`errorCategory` exists only to select a relevant end-of-session tip.

## 12. Predict Rotation

### 12.1 Core Loop

The board shows a fixed authored force diagram. The child chooses one of three
stable buttons:

1. `↶ COUNTERCLOCKWISE` — accessible name `Counterclockwise initial turn`,
2. `BALANCED` — accessible name `Rotationally balanced about the pivot`,
3. `CLOCKWISE ↷` — accessible name `Clockwise initial turn`.

Polish visible labels are
`↶ PRZECIWNIE DO RUCHU WSKAZÓWEK ZEGARA`, `RÓWNOWAGA`, and
`ZGODNIE Z RUCHEM WSKAZÓWEK ZEGARA ↷`. Never abbreviate these choices to
left/right: that wording can be mistaken for translation of the beam.

An answer locks the three buttons, reveals every individual moment and the net
moment, then shows `Next`. Predict rounds do not accept a second answer because
the correct result has already been revealed. First-attempt accuracy is the
only score.

Keyboard:

- `A` or Left Arrow selects counterclockwise,
- `S` or Down Arrow = balanced,
- `D` or Right Arrow selects clockwise,
- `1`, `2`, `3` are equivalent,
- Space advances only while feedback and `Next` are visible,
- shortcuts do not fire while focus is in a panel control.

### 12.2 Difficulty

`★ — One force`

- one upward, downward, radial, or along-beam force,
- covers clockwise, counterclockwise, and zero moment,
- requires direction reasoning only and uses the arrow-only scaffold in
  section 10.6.

`★★ — Two downward forces`

- one downward force on each side,
- includes equal, force-dominant, distance-dominant, and exact
  force-distance trade cases,
- deliberately challenges the `strongest force always wins` rule,
- always shows the individual pre-answer strips and factor tiles specified in
  section 10.6.

`★★★ — Combine moments`

- two or three vertical forces,
- forces may point up or down and may share a side,
- includes a pivot force that contributes zero,
- remains arithmetic-light because all arrows are perpendicular to the beam,
- supplies the optional, unpenalized moment guide specified in section 10.6.

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

Color is redundant: arrows carry `F1`, `F2`, or the language-neutral `F↔` for
the movable force; turning directions
carry `↶`/`↷` plus words; the movable force uses a dashed outer halo as well as
purple.

Force names render with a physics subscript — `F₁`, `F₂` — which is
**composed** from a base glyph plus a smaller, lowered digit run, never taken
from a Unicode subscript codepoint: JetBrains Mono ships no `U+2081`/`U+2082`
glyphs and they silently fall back to another face, the same defect already
documented for Polish glyphs. The subscript run is `round(0.7 × base)` px at
the base weight, dropped about `0.19em`. The spoken and accessible-name form
stays exactly `F1` / `F2`, so the canvas summary and the panel buttons still
announce them unchanged (amended 2026-09-03).

### 14.2 Header

- icon `⚖️` links to `/learn/` and has a localized accessible name,
- title and one-line subtitle on the left,
- language button is the only right-side action,
- use the exact light-header dimensions from `CLAUDE.md`.

Exact subtitle:

- EN: `See how a force's strength, where it acts, and its direction change its turning effect.`
- PL: `Zobacz, jak wartość siły, miejsce jej przyłożenia i jej kierunek zmieniają efekt obrotowy.`

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
- child-facing prompt text is at least `28px`; Guide prose and feedback are at
  least `16px`; child-facing action labels are at least `18px`,
- the language and mode controls, Guide choices/navigation, help disclosures,
  Game answers, Start/Check/Next actions, Explore steppers and segmented
  controls, force heads/tails, the Balance dock/tag, and the Balance Position
  buttons each expose a hit target of at least `48×48 CSS px`,
- feedback has reserved height so the beam and controls never shift after an
  answer.

### 14.4 Canvas Geometry

Use one uniform scale for the complete beam-and-force scene. Never clamp an
individual arrow independently because that would make equal forces look
unequal. With canvas CSS width `W`, CSS height `H`, and `MAX_FORCE = 5`, compute:

```js
const safeW = W - 32;
const topSafe = 72;
const bottomSafe = 70;
const availableH = H - topSafe - bottomSafe;
const beamY = topSafe + availableH / 2;
const horizontalLimit = (safeW * 0.25) / MAX_FORCE;
const verticalLimit = (availableH / 2 - 24) / MAX_FORCE;
const forcePxPerN = clamp(
  Math.min(horizontalLimit, verticalLimit),
  14,
  34
);
const beamPx = Math.min(
  760,
  safeW - 2 * MAX_FORCE * forcePxPerN
);
```

`clamp(value, min, max)` uses that exact argument order. `H` is never less
than the mobile canvas minimum of `360px`, so the `14px/N` lower bound fits at
the required `320px` viewport. Center `beamPx` horizontally and map world
positions `−4…+4 m` linearly across it. The remaining width and height are the
force-arrow safety envelope. Before drawing, assert in debug mode that the
beam, every arrow shaft/head at `5 N`, and its label box remain within the
`16px` horizontal, `topSafe`, and `bottomSafe` drawing bounds. Also assert that
each interaction box remains inside the canvas and measures at least
`48×48px`; an arrowhead box near an edge may extend asymmetrically inward so
the visible head remains inside the target without clipping the target.

The remaining exact dimensions are:

- beam visual thickness `22px`,
- triangular pivot height `54px`,
- sockets have visible radius `5px` at whole metres `−3…+3` only, in `--socket`
  ink; half metres are `2×10px` ticks in the same ink; Balance drop selection
  uses the normative
  nearest-centre regions and vertical band in section 11.1,
- force arrow length uses the shared `forcePxPerN`; no per-arrow clamping,
- arrowhead length `14px`; line width `5px`; the reveal highlight draws a
  `9px` halo (amended 2026-09-01: the selected force no longer draws one — its
  moment arm, `d⊥` chip and arc already identify it, and a coloured band under
  the arrow only thickened it). Arrows are drawn UNCASED and the tail disc
  (`r 6`) has no backing ring; the drag-preview pin has none either (amended
  2026-09-03: all three were `#f5f3ee` knock-outs that existed only to lift a
  1.22:1 arrow off the old brown beam, and read as white halos once the beam
  went light),
- construction lines use at least `2px` stroke and high-contrast dash patterns.
  The two transient drag guides — the direction line and the radius circle —
  are exempt and share one style: `1px`, dash `[3, 5]`, force colour at `0.25`
  alpha, tightening to `[2, 4]` at `0.4` while `Shift` is held (amended
  2026-09-01). They exist only while the child holds the arrow, alongside the
  arrow itself, so they read as one light construction rather than competing
  with it; every construction line that teaches on its own — the Guide steps
  and the zero-moment reveal — keeps the heavier style,
- all canvas text uses JetBrains Mono at `13–17px`; a force label's width is
  the SUM of its run advances, and the width used to measure the chip must come
  from the same function that draws it,
- canvas contrast is normative (added 2026-09-03, asserted by layout-check
  section 13c): every force colour ≥ `3:1` against both the beam fill and the
  canvas; socket ink ≥ `3:1` against the beam; the beam's boundary — the better
  of its edge and its fill — ≥ `3:1` against the canvas; canvas text ≥ `4.5:1`
  against its plate. The section also samples a painted beam pixel and mirrors
  the `:root` entity tokens against the JS palette, so a hard-coded colour or a
  drifted token fails,
- whole metres receive numeric labels; half metres are minor unlabeled ticks.

Paper-check values for the required full-width mobile canvases are normative
tolerances for the layout test (`±0.1px` before DPR rounding):

| Viewport / canvas | `forcePxPerN` | `beamPx` | Maximum-force drawing envelope |
|---|---:|---:|---|
| `320×568` / `320×360` | `14.4` | `144.0` | `x 16…304`, `y 109…253` |
| `360×640` / `360×360` | `16.4` | `164.0` | `x 16…344`, `y 99…263` |
| `390×844` / `390×472.64` | `17.9` | `179.0` | `x 16…374`, `y 147.82…326.82` |

The envelope is the union of a maximum arrow extending outward horizontally
from either beam end and a maximum arrow extending vertically from the beam.
Labels are placed inward when needed; they do not expand this envelope.

### 14.5 Mode And Phase Behavior

- Switching from Explore to Game preserves the current Explore setup.
- Switching during `gameSetup` is immediate.
- During an active game session, selecting Explore asks for confirmation in an
  inline panel message with `Leave game` / `Stay`; do not use a browser confirm
  dialog.
- While that confirmation is open, make the underlying round controls inert
  and suppress every round shortcut. Only `Leave game`, `Stay`, Escape, and
  language switching operate. A language change retranslates the confirmation
  without closing it or changing the preserved round. `Stay` restores the
  exact interaction availability derived from that unchanged round state.
- While `revealPhase.kind` is `force`, `totals`, `net`, or `motion`, disable
  the mode selector. Re-enable it only after the reveal reaches `complete`.
  This prevents a leave confirmation from competing with reveal-completion
  focus. `idle` and `complete` are the only active-session phases from which
  the confirmation can open.
- Returning to Game after leaving starts at Game setup, not the abandoned
  round.
- Escape dismisses result overlays or exits the Guide; it does not silently
  discard an active game.

### 14.6 Mobile

Use the primary layout breakpoint at `max-width: 720px`:

- canvas appears before panel,
- canvas height `56svh`, minimum `360px`,
- page may scroll vertically,
- panel remains a full-width column,
- Predict answers use a three-row stack below `600px`, preserving
  counterclockwise/balanced/clockwise order and the full direction words,
- Guide step 2's two direction choices also stack below `600px` and retain
  their full words,
- after starting a game, call one `alignPlayViewport()` helper on the next
  animation frame so the HUD, beam, and primary interaction fit in view,
- do not use smooth scrolling,
- no horizontal overflow at `320px` CSS width,
- every child-used interaction target remains at least `48×48px` even when its
  visible symbol is smaller. Only passive, noninteractive annotations may be
  smaller.

## 15. Accessibility Requirements

### 15.1 Semantic Equivalent For Canvas

The canvas has `tabindex="0"`, a localized `aria-label`, and a nearby polite
live region. `applyTranslations()` and every physics change update an
accessible summary without announcing during every pointer-move frame.

Debounce drag announcements until pointer release. Use exactly
`canvasForceSummary` or `canvasForceSummaryZero` from section 16.6. A summary
must name:

- selected force,
- application side and distance,
- force magnitude and direction,
- individual moment and turning direction,
- total clockwise and counterclockwise moments,
- net result.

`forceDirection` is a cardinal or quadrant phrase from section 16.2 followed
by the exact snapped degrees. `forceValue`, `position`, `momentValue`, both
totals, and the net moment use the spoken quantity formatter in section 16.7.
The zero template omits a false moment direction. No shorter alternate summary
is permitted.

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

All strings live in one inline `I18N` object. This section is the complete key
manifest. The Guide titles, commentary, and unique step-specific scene copy in
section 8 are also normative and must be stored under matching `guide` records
verbatim. Common Guide actions, prompts, labels, and errors resolve to the keys
below. Every other quoted child-visible phrase in sections 8–15 also resolves
to a key below; quoted state names and code identifiers are technical rather
than UI copy. Numeric values are inserted through safe text nodes, never HTML
interpolation. Implementers may not translate fragments or invent alternate
copy.

Each localized `guide` record has exactly `id`, `title`, `commentary`, and
`sceneCopy`. `commentary` is the ordered paragraph array from section 8;
`sceneCopy` is an ordered array containing only the following unique strings.
Shared strings must be referenced by key and must not be copied into a record:

| Step | `sceneCopy` contents | Shared key references |
|---|---|---|
| 1 | none | `forceLabel`, `pivotLabel`, `replay` |
| 2 | none | `guideChooseCw`, `guideChooseCcw`, `guideWrongCw`, `guideWrongCcw`, `nextExample` |
| 3 | none | `near`, `far` |
| 4 | none | `smallerForce`, `largerForce` |
| 5 | none | `guideZeroQuestion`, `guideLargestQuestion`, `guideWrongZero`, `guideWrongLargest` |
| 6 | the equation and substituted equation in section 8.7, in that order | none |
| 7 | none; products and moment values are generated numeric notation | `swapSides` |
| 8 | none | `guideBalancePrompt` and the section 16.4 Balance interaction keys |
| 9 | none | `startExploring`, `startGame` |

Amendment (2026-09-01): step 5 card picks announce their outcome through the
shared live region — a wrong pick announces its retry copy (`guideWrongZero`
or `guideWrongLargest`) and the correct first answer announces the follow-up
question (`guideLargestQuestion`). Without this the retry copy and question
change were visible but silent, since the guide layer is not a live region
and focus stays on the picked card.

### 16.1 Global And Navigation

| Key | English | Polish |
|---|---|---|
| `title` | Moment Lab | Laboratorium momentu siły |
| `subtitle` | See how a force's strength, where it acts, and its direction change its turning effect. | Zobacz, jak wartość siły, miejsce jej przyłożenia i jej kierunek zmieniają efekt obrotowy. |
| `backLearn` | Back to Learn | Wróć do Learn |
| `switchLanguage` | Switch language | Zmień język |
| `mode` | Mode | Tryb |
| `explore` | Explore | Eksperyment |
| `game` | Game | Gra |
| `guide` | Guide | Przewodnik |
| `howItWorks` | How it works | Jak to działa |
| `replayGuide` | Replay guide | Powtórz przewodnik |

Amendment (2026-09-01): `replayGuide` is no longer applied to any control.
The Guide is opened by the always-visible `Guide` button, which uses the
existing `guide` key. The row is kept because the key remains in the closed
manifest.
| `exitGuide` | Exit guide | Zamknij przewodnik |
| `previous` | Previous | Wstecz |
| `next` | Next | Dalej |
| `replay` | Replay | Powtórz |
| `guideStep` | Step {current} of {total} | Krok {current} z {total} |
| `forceLabel` | Force | Siła |
| `pivotLabel` | Pivot | Punkt podparcia |
| `nextExample` | Next example | Następny przykład |
| `startExploring` | Start exploring | Zacznij eksperyment |
| `startGame` | Start game | Zacznij grę |
| `howToPlay` | How to play | Jak grać |
| `keyboardHelp` | Keyboard help | Pomoc klawiatury |

### 16.1.1 Guide Interaction Copy

Section 8 supplies each step's title and commentary. The remaining Guide copy
is exactly:

| Key | English | Polish |
|---|---|---|
| `guideChooseCw` | Clockwise ↷ | Zgodnie z ruchem wskazówek zegara ↷ |
| `guideChooseCcw` | ↶ Counterclockwise | ↶ Przeciwnie do ruchu wskazówek zegara |
| `guideWrongCw` | The force pushes the right end down, so the beam initially turns clockwise. Try again. | Siła pcha prawy koniec belki w dół, więc początkowy obrót jest zgodny z ruchem wskazówek zegara. Spróbuj ponownie. |
| `guideWrongCcw` | The force pushes the left end down, so the beam initially turns counterclockwise. Try again. | Siła pcha lewy koniec belki w dół, więc początkowy obrót jest przeciwny do ruchu wskazówek zegara. Spróbuj ponownie. |
| `near` | Near | Blisko |
| `far` | Far | Daleko |
| `smallerForce` | Smaller force | Mniejsza siła |
| `largerForce` | Larger force | Większa siła |
| `guideZeroQuestion` | Which force makes zero moment? | Która siła daje moment równy zero? |
| `guideLargestQuestion` | Which force makes the largest moment? | Która siła daje największy moment? |
| `guideWrongZero` | This force's line does not pass through the pivot. Look for the line that crosses the pivot. | Linia działania tej siły nie przechodzi przez punkt podparcia. Znajdź linię, która przechodzi przez ten punkt. |
| `guideWrongLargest` | This force is not perpendicular to the beam. For the same force and application point, the perpendicular force makes the largest moment. | Ta siła nie jest prostopadła do belki. Dla tej samej wartości siły i tego samego punktu przyłożenia siła prostopadła daje największy moment. |
| `swapSides` | Swap sides | Zamień strony |
| `guideBalancePrompt` | Place the movable force so the clockwise and counterclockwise moments are equal. | Ustaw ruchomą siłę tak, aby momenty zgodne i przeciwne do ruchu wskazówek zegara były równe. |

### 16.2 Explore

| Key | English | Polish |
|---|---|---|
| `forceControls` | Force controls | Sterowanie siłami |
| `momentResult` | Moments | Momenty |
| `actionsAndHelp` | Actions and help | Działania i pomoc |
| `forces` | Forces | Siły |
| `oneForce` | One force | Jedna siła |
| `twoForces` | Two forces | Dwie siły |
| `selectedForce` | Selected force | Wybrana siła |
| `forceStrength` | Force strength | Wartość siły |
| `position` | Position | Położenie |
| `positionRight` | {value} m right of pivot | {value} m na prawo od punktu podparcia |
| `positionLeft` | {value} m left of pivot | {value} m na lewo od punktu podparcia |
| `positionPivot` | at the pivot | w punkcie podparcia |
| `direction` | Direction | Kierunek |
| `directionUp` | up | w górę |
| `directionDown` | down | w dół |
| `directionLeft` | left | w lewo |
| `directionRight` | right | w prawo |
| `directionUpRight` | up and right | w górę i w prawo |
| `directionUpLeft` | up and left | w górę i w lewo |
| `directionDownRight` | down and right | w dół i w prawo |
| `directionDownLeft` | down and left | w dół i w lewo |
| `moment` | Moment | Moment |
| `momentArm` | Moment arm (perpendicular distance) | Ramię siły (odległość prostopadła) |
| `ccwTotal` | Counterclockwise ↶ | Przeciwnie do ruchu wskazówek zegara ↶ |
| `cwTotal` | Clockwise ↷ | Zgodnie z ruchem wskazówek zegara ↷ |
| `netResult` | Net moment | Moment wypadkowy |
| `turnsCcw` | Initial turn: counterclockwise ↶ | Początkowy obrót: przeciwnie do ruchu wskazówek zegara ↶ |
| `turnsCw` | Initial turn: clockwise ↷ | Początkowy obrót: zgodnie z ruchem wskazówek zegara ↷ |
| `balancedPivot` | Balanced about the pivot | Równowaga względem punktu podparcia |
| `noTurningEffect` | No turning effect | Brak efektu obrotowego |
| `resetExperiment` | Reset experiment | Zresetuj eksperyment |
| `moveForceHint` | Drag the tail to move the force. Drag anywhere on the arrow to change its strength and direction; hold Shift for fine control. | Przeciągnij początek strzałki, aby przesunąć siłę. Przeciągnij strzałkę w dowolnym miejscu, aby zmienić jej wartość i kierunek; przytrzymaj Shift, aby regulować precyzyjnie. |

Amendment (2026-09-01): `moveForceHint` was reworded from "Drag the
arrowhead…" when the whole arrow became grabbable and `Shift` fine control
was added.
| `exploreKeyboardHelp` | With a force focused, Left or Right moves it, Up or Down changes its strength, left or right bracket changes its direction, and R resets the experiment. | Gdy siła jest zaznaczona, strzałka w lewo lub w prawo ją przesuwa, strzałka w górę lub w dół zmienia jej wartość, lewy lub prawy nawias kwadratowy zmienia kierunek, a R resetuje eksperyment. |

### 16.3 Game Setup And HUD

| Key | English | Polish |
|---|---|---|
| `gameType` | Game type | Rodzaj gry |
| `balanceGame` | Balance | Równowaga |
| `predictGame` | Predict | Przewidywanie |
| `difficulty` | Difficulty | Trudność |
| `balanceDifficulty1Aria` | One star, easy: match the distance | Jedna gwiazdka, poziom łatwy: dopasuj odległość |
| `balanceDifficulty2Aria` | Two stars, medium: balance moments made by unequal forces | Dwie gwiazdki, poziom średni: zrównoważ momenty sił o różnych wartościach |
| `balanceDifficulty3Aria` | Three stars, hard: balance combined moments | Trzy gwiazdki, poziom trudny: zrównoważ sumę momentów |
| `predictDifficulty1Aria` | One star, easy: one force | Jedna gwiazdka, poziom łatwy: jedna siła |
| `predictDifficulty2Aria` | Two stars, medium: compare two moments | Dwie gwiazdki, poziom średni: porównaj dwa momenty |
| `predictDifficulty3Aria` | Three stars, hard: combine moments | Trzy gwiazdki, poziom trudny: połącz momenty |
| `balanceDesc` | Place the movable force so the moments balance. | Ustaw ruchomą siłę tak, aby momenty się równoważyły. |
| `predictDesc` | Decide the beam's initial turning direction. | Wybierz kierunek początkowego obrotu belki. |
| `balanceHowToPlay` | Move the purple force to a highlighted spot. Compare the two moment bars, then choose Check balance. | Przesuń fioletową siłę do podświetlonego miejsca. Porównaj dwa paski momentów, a następnie wybierz Sprawdź równowagę. |
| `predictHowToPlay` | Look at each force, then choose the beam's initial turning direction. Higher levels also show moment bars. | Przyjrzyj się każdej sile, a następnie wybierz kierunek początkowego obrotu belki. Na wyższych poziomach zobaczysz też paski momentów. |
| `balanceKeyboardHelp` | With the movable force focused, Left or Right chooses a spot. Enter or Space checks the balance. | Gdy ruchoma siła jest zaznaczona, strzałka w lewo lub w prawo wybiera miejsce. Enter lub spacja sprawdza równowagę. |
| `predictKeyboardHelp` | Press A or Left Arrow for counterclockwise, S or Down Arrow for balanced, and D or Right Arrow for clockwise. | Naciśnij A lub strzałkę w lewo dla obrotu przeciwnego do ruchu wskazówek zegara, S lub strzałkę w dół dla równowagi oraz D lub strzałkę w prawo dla obrotu zgodnego z ruchem wskazówek zegara. |
| `guideKeyboardHelp` | Use Previous and Next to change steps. Press Escape to leave the guide. | Użyj przycisków Wstecz i Dalej, aby zmieniać kroki. Naciśnij Escape, aby zamknąć przewodnik. |
| `startRounds` | Start 8 rounds | Zacznij 8 rund |
| `roundOf` | Round {current} of {total} | Runda {current} z {total} |
| `firstTry` | First-try correct: {correct}/{answered} | Poprawne za pierwszym razem: {correct}/{answered} |
| `leaveGameQuestion` | Leave this game? Current progress will be lost. | Opuścić tę grę? Bieżący postęp zostanie utracony. |
| `leaveGame` | Leave game | Opuść grę |
| `stayGame` | Stay | Zostań |

### 16.4 Balance Game

| Key | English | Polish |
|---|---|---|
| `balanceMission` | Balance the moments | Zrównoważ momenty |
| `moveForce` | Movable force | Ruchoma siła |
| `forceDock` | Starting area for the movable force | Miejsce startowe ruchomej siły |
| `balancePosition` | Position | Położenie |
| `previousSocket` | Previous spot | Poprzednie miejsce |
| `nextSocket` | Next spot | Następne miejsce |
| `checkBalance` | Check balance | Sprawdź równowagę |
| `chooseSocket` | Place the movable force on an empty highlighted spot. | Ustaw ruchomą siłę w pustym podświetlonym miejscu. |
| `invalidPivot` | The pivot is not a place for this force. Choose a highlighted spot. | Punkt podparcia nie jest miejscem dla tej siły. Wybierz podświetlone miejsce. |
| `occupiedSocket` | A fixed force already acts there. Choose another highlighted spot. | W tym miejscu działa już stała siła. Wybierz inne podświetlone miejsce. |
| `invalidDrop` | Place the force on a highlighted spot on the beam. | Ustaw siłę w podświetlonym miejscu na belce. |
| `placementReadout` | Movable force placed {position}. Its moment is {moment} N·m {direction}. | Ruchoma siła jest ustawiona {position}. Jej moment wynosi {moment} N·m, {direction}. |
| `balancedSuccess` | The moments balance. | Momenty się równoważą. |
| `notBalancedYet` | Not balanced yet. Adjust the movable force and try again. | Jeszcze nie ma równowagi. Przesuń ruchomą siłę i spróbuj ponownie. |
| `initialTurnCcw` | The counterclockwise moment is larger, so the initial turn is counterclockwise. | Moment przeciwny do ruchu wskazówek zegara jest większy, więc początkowy obrót jest przeciwny do ruchu wskazówek zegara. |
| `initialTurnCw` | The clockwise moment is larger, so the initial turn is clockwise. | Moment zgodny z ruchem wskazówek zegara jest większy, więc początkowy obrót jest zgodny z ruchem wskazówek zegara. |
| `sameForceSameDistance` | Equal forces at equal distances on opposite sides make equal moments in opposite directions. | Równe siły działające w równych odległościach po przeciwnych stronach dają równe momenty o przeciwnych zwrotach. |
| `weakerNeedsFarther` | The weaker force acts farther from the pivot to make an equal opposing moment. | Mniejsza siła działa dalej od punktu podparcia, aby wywołać równy moment o przeciwnym zwrocie. |
| `strongerNeedsCloser` | The stronger force can act closer to the pivot and still make an equal opposing moment. | Większa siła może działać bliżej punktu podparcia i nadal wywołać równy moment o przeciwnym zwrocie. |
| `combinedFixedMoments` | The movable force makes a moment equal to the combined fixed moments and opposite in direction. | Ruchoma siła wywołuje moment równy sumie momentów stałych sił i o zwrocie przeciwnym do zwrotu tej sumy. |

### 16.5 Predict Game

| Key | English | Polish |
|---|---|---|
| `predictMission` | What is the initial turn? | Jaki będzie początkowy obrót? |
| `answerCcw` | ↶ COUNTERCLOCKWISE | ↶ PRZECIWNIE DO RUCHU WSKAZÓWEK ZEGARA |
| `answerBalanced` | BALANCED | RÓWNOWAGA |
| `answerCw` | CLOCKWISE ↷ | ZGODNIE Z RUCHEM WSKAZÓWEK ZEGARA ↷ |
| `answerCcwAria` | Counterclockwise initial turn | Początkowy obrót przeciwny do ruchu wskazówek zegara |
| `answerBalancedAria` | Rotationally balanced about the pivot | Równowaga obrotowa względem punktu podparcia |
| `answerCwAria` | Clockwise initial turn | Początkowy obrót zgodny z ruchem wskazówek zegara |
| `showMomentGuide` | Show moment guide | Pokaż podpowiedź z momentami |
| `correctPrediction` | Correct. {reason} | Dobrze. {reason} |
| `predictionReveal` | The correct result is {result}. {reason} | Poprawny wynik to {result}. {reason} |
| `resultCcw` | counterclockwise initial turn | początkowy obrót przeciwny do ruchu wskazówek zegara |
| `resultBalanced` | balanced about the pivot | równowaga względem punktu podparcia |
| `resultCw` | clockwise initial turn | początkowy obrót zgodny z ruchem wskazówek zegara |
| `momentTotals` | Counterclockwise total: {ccw} N·m. Clockwise total: {cw} N·m. Net moment: {net} N·m. Result: {result}. | Suma momentów przeciwnych do ruchu wskazówek zegara: {ccw} N·m. Suma momentów zgodnych z ruchem wskazówek zegara: {cw} N·m. Moment wypadkowy: {net} N·m. Wynik: {result}. |
| `singleClockwise` | This force produces a clockwise moment. | Ta siła wywołuje moment zgodny z ruchem wskazówek zegara. |
| `singleCounterclockwise` | This force produces a counterclockwise moment. | Ta siła wywołuje moment przeciwny do ruchu wskazówek zegara. |
| `throughPivotZero` | The force acts at the pivot, so its moment is zero. | Siła działa w punkcie podparcia, więc jej moment wynosi zero. |
| `alongBeamZero` | The force's line of action passes through the pivot, so its moment is zero. | Linia działania siły przechodzi przez punkt podparcia, więc jej moment wynosi zero. |
| `equalOpposingMoments` | The moments in opposite directions are equal, so the net moment is zero. | Momenty o przeciwnych zwrotach są równe, więc moment wypadkowy wynosi zero. |
| `productBalance` | Different force strengths and moment arms can make equal moments in opposite directions. | Różne wartości sił i różne ramiona sił mogą dawać równe momenty o przeciwnych zwrotach. |
| `forceWinsProduct` | Here the larger force also gives the larger force-strength × moment-arm product. | Tutaj większa siła daje również większy iloczyn wartości siły i ramienia siły. |
| `distanceWinsProduct` | The smaller force acts far enough from the pivot to make the larger moment. | Mniejsza siła działa wystarczająco daleko od punktu podparcia, aby wywołać większy moment. |
| `compareProducts` | Compare the products on both sides: force strength × moment arm. | Porównaj po obu stronach iloczyny: wartość siły × ramię siły. |
| `addSignedMoments` | Add the moments in each direction separately, then compare the totals. | Zsumuj osobno momenty w obu kierunkach, a potem porównaj te sumy. |
| `sameSideCanOppose` | Forces on the same side can produce moments in opposite directions when the forces point in opposite directions. | Siły po tej samej stronie mogą wywoływać momenty o przeciwnych zwrotach, gdy same siły mają przeciwne kierunki. |
| `pivotForceAddsZero` | The force applied at the pivot has zero moment; the other moments decide. | Siła przyłożona w punkcie podparcia ma moment równy zero; decydują pozostałe momenty. |

### 16.6 Summary, Errors, And Accessibility

| Key | English | Polish |
|---|---|---|
| `sessionComplete` | Game complete | Koniec gry |
| `correctFirstTry` | Correct on first try: {correct}/8 | Poprawne za pierwszym razem: {correct}/8 |
| `accuracy` | Accuracy | Skuteczność |
| `accuracyValue` | {percent}% | {percent}% |
| `starsAria` | Stars earned: {count} of 3 | Zdobyte gwiazdki: {count} z 3 |

Amendment (2026-09-01): `starsAria` added so the earned-star tier shown in
the game summary has a textual equivalent for assistive technology (the star
row itself is decorative glyphs). It is applied as the `aria-label` of the
star row, which is exposed as `role="img"`.
| `playAgain` | Play again | Zagraj ponownie |
| `changeGame` | Change game | Zmień grę |
| `continueHint` | Tap, click, or press Enter, Space, or Escape to continue. | Dotknij ekranu, kliknij albo naciśnij Enter, spację lub Escape, aby kontynuować. |
| `storageUnavailable` | This browser cannot remember that you have seen the guide. The app still works. | Ta przeglądarka nie może zapamiętać, że przewodnik został już wyświetlony. Aplikacja nadal działa. |
| `canvasExploreAria` | Interactive moment-of-force experiment | Interaktywny eksperyment z momentem siły |
| `canvasBalanceAria` | Balance mission beam | Belka w misji równowagi |
| `canvasPredictAria` | Rotation prediction beam | Belka do przewidywania obrotu |
| `canvasForceSummary` | {force}. Force strength: {forceValue}. Direction: {forceDirection} ({degrees} degrees). Application point: {position}. Moment size: {momentValue}; direction: {momentDirection}. Counterclockwise total: {ccwTotal}. Clockwise total: {cwTotal}. Net moment: {netMoment}. {result}. | {force}. Wartość siły: {forceValue}. Kierunek: {forceDirection} ({degrees} stopni). Punkt przyłożenia: {position}. Wartość momentu tej siły: {momentValue}; zwrot: {momentDirection}. Suma momentów przeciwnych do ruchu wskazówek zegara: {ccwTotal}. Suma momentów zgodnych z ruchem wskazówek zegara: {cwTotal}. Moment wypadkowy: {netMoment}. {result}. |
| `canvasForceSummaryZero` | {force}. Force strength: {forceValue}. Direction: {forceDirection} ({degrees} degrees). Application point: {position}. Moment: {momentValue}; no turning effect. Counterclockwise total: {ccwTotal}. Clockwise total: {cwTotal}. Net moment: {netMoment}. {result}. | {force}. Wartość siły: {forceValue}. Kierunek: {forceDirection} ({degrees} stopni). Punkt przyłożenia: {position}. Moment tej siły: {momentValue}; brak efektu obrotowego. Suma momentów przeciwnych do ruchu wskazówek zegara: {ccwTotal}. Suma momentów zgodnych z ruchem wskazówek zegara: {cwTotal}. Moment wypadkowy: {netMoment}. {result}. |
| `debugScenarioError` | Unknown debug scenario: {id} | Nieznany scenariusz testowy: {id} |

Required summary tips:

| Key | English | Polish |
|---|---|---|
| `tipForceOnly` | Look at distance as well as force strength. | Sprawdzaj odległość, a nie tylko wartość siły. |
| `tipDirection` | Follow each force to see which way it tends to turn the beam. | Sprawdź, w którą stronę każda siła próbuje obrócić belkę. |
| `tipLineAction` | A force whose line of action passes through the pivot has zero moment. | Siła, której linia działania przechodzi przez punkt podparcia, ma moment równy zero. |
| `tipCombine` | Compare the clockwise total with the counterclockwise total. | Porównaj sumę momentów zgodnych z ruchem wskazówek zegara z sumą momentów przeciwnych do jego ruchu. |
| `tipCompare` | Compare the two total-moment bars; the longer bar gives the initial turning direction. | Kierunek z dłuższym paskiem sumy momentów wyznacza początkowy obrót. |
| `tipStrong` | You are combining force, distance, and direction well. | Dobrze łączysz siłę, odległość i kierunek. |

### 16.7 Number, Unit, And Placeholder Contract

Maintain these pure presentation helpers; none may affect solver values:

```js
formatVisualNumber(value, decimals, lang) -> string
formatVisualNetMoment(value, decimals, lang) -> string
formatSpokenQuantity(value, unit, lang) -> string
formatSpokenPosition(x, lang) -> string
formatDirection(angleDeg, lang) -> { short, spoken }
buildCanvasSummary(force, forces, pivot, lang) -> string
```

Visual formatting rules:

- normalize floating-point `−0` to `0` before formatting,
- retain the requested fixed decimal count in Explore; Game uses zero decimals,
- use `.` in English and `,` in Polish,
- compact quantities use uninflected symbols `N`, `m`, and `N·m`,
- an individual moment passes `Math.abs(M)` to `formatVisualNumber` and adds a
  direction word separately,
- a net moment uses `+` for positive, Unicode minus `−` for negative, and no
  sign for zero,
- summary accuracy is `Math.round(100 * firstTryCorrect / 8)` and is inserted
  into `accuracyValue`; HUD `{answered}` is the count of rounds whose first
  attempt has been recorded, including a Balance round still open for retry.

Spoken English uses the singular only when `abs(value) === 1`; every other
value uses the plural. Spoken Polish selects forms from this table:

| Unit | Singular `1` | Integer ending `2–4`, except `12–14` | Other integers including `0` | Fractional value |
|---|---|---|---|---|
| newton | `niuton` | `niutony` | `niutonów` | `niutona` |
| metre | `metr` | `metry` | `metrów` | `metra` |
| newton metre | `niutonometr` | `niutonometry` | `niutonometrów` | `niutonometra` |
| degree | `stopień` | `stopnie` | `stopni` | `stopnia` |

Evaluate Polish integer endings from `abs(value)`: `12`, `13`, and `14` always
use the `Other integers` form; otherwise final digits `2`, `3`, and `4` use the
second column. Prefix negative spoken values with `minus` in both languages.
Fractional Polish values use a comma and the final column, for example
`0,5 niutona`, `1,5 metra`, and `2,5 niutonometra`. Do not inflect compact
symbol readouts.

`formatDirection` returns the exact cardinal or quadrant phrase in section
16.2. Cardinal angles are `0°` right, `90°` up, `180°` left, and `270°` down.
Angles strictly between `0°–90°` use up-right, `90°–180°` up-left,
`180°–270°` down-left, and `270°–360°` down-right. Normalize `360°` to `0°`.
`spoken` appends the formatted degree quantity. `formatSpokenPosition` returns
`at the pivot` / `w punkcie podparcia` for zero; otherwise it produces the full
localized left/right phrase with an inflected absolute metre quantity and never
exposes a signed coordinate.

The canvas-summary templates receive `forceDirection = short` and
`degrees = formatVisualNumber(normalizedAngle, 0, lang)`; all allowed angles
are multiples of `15°`, so the fixed spoken suffixes `degrees` and `stopni` are
grammatically valid. Other announcements may use `formatDirection().spoken`.

Placeholder domains are exact and English/Polish sets must match:

| Keys | Required placeholders |
|---|---|
| `guideStep`, `roundOf` | `{current}`, `{total}` |
| `positionRight`, `positionLeft` | `{value}` |
| `firstTry` | `{correct}`, `{answered}` |
| `placementReadout` | `{position}`, `{moment}`, `{direction}` |
| `correctPrediction` | `{reason}` |
| `predictionReveal` | `{result}`, `{reason}` |
| `momentTotals` | `{ccw}`, `{cw}`, `{net}`, `{result}` |
| `correctFirstTry` | `{correct}` |
| `accuracyValue` | `{percent}` |
| `starsAria` | `{count}` |
| `canvasForceSummary` | `{force}`, `{forceValue}`, `{forceDirection}`, `{degrees}`, `{position}`, `{momentValue}`, `{momentDirection}`, `{ccwTotal}`, `{cwTotal}`, `{netMoment}`, `{result}` |
| `canvasForceSummaryZero` | `{force}`, `{forceValue}`, `{forceDirection}`, `{degrees}`, `{position}`, `{momentValue}`, `{ccwTotal}`, `{cwTotal}`, `{netMoment}`, `{result}` |
| `debugScenarioError` | `{id}` |

`buildCanvasSummary` must use `canvasForceSummaryZero` exactly when the selected
individual moment classifies as zero and `canvasForceSummary` otherwise. It
fills every quantity with the spoken formatters above and every result with a
complete localized result key. In `placementReadout`, `{moment}` is unsigned and
`{direction}` is exactly the full clockwise or counterclockwise phrase; it is
never a signed number or left/right movement phrase. In debug mode,
initialization fails with a
concise console error if a manifest key is missing, an unknown key is present,
or either language has a different placeholder set.

## 17. Technical Architecture

### 17.1 Files And Repository Integration

Implementation changes are limited to:

- new `moment/index.html`,
- this `moment/docs/req.md`,
- new `tools/moment-rules-check.mjs`,
- new `tools/moment-dom-check.mjs`,
- new `tools/moment-layout-check.mjs`,
- `package.json` scripts for the three dedicated checks,
- one new entry in `index.md`.

Do not add sidecar CSS, JavaScript, JSON, image, or audio files. Do not add a
runtime framework or package dependency. The layout check uses the existing
`puppeteer-core` dependency and the repository's existing Chromium discovery
pattern; it must not download a browser.

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
classifyBalanceError(record, x) -> "direction" | "force-only" | "combine" | "compare"
buildMomentScaffold(forces, pivot) -> {
  contributions, ccwTotal, cwTotal, netMoment
}
computeBoardScale(width, height, maxForce) -> {
  beamY, beamPx, forcePxPerN
}
formatVisualNumber(value, decimals, lang) -> string
formatVisualNetMoment(value, decimals, lang) -> string
formatSpokenQuantity(value, unit, lang) -> string
formatSpokenPosition(x, lang) -> string
formatDirection(angleDeg, lang) -> { short, spoken }
buildCanvasSummary(force, forces, pivot, lang) -> string
```

The production UI, Guide, scenario validation, readouts, and feedback all call
these helpers. Do not maintain separate “visual moment” or game-answer math.
`buildMomentScaffold` must derive every strip from `momentOf`; it is a view
model, not an alternative solver. `classifyBalanceError` implements section
11.3 exactly. `computeBoardScale` implements section 14.4 exactly and has no
viewport-specific exceptions. The formatting and summary helpers implement
section 16.7 exactly and never round or mutate solver inputs.

The independent rules check must implement its own formula rather than
trusting these functions.

### 17.4 Rendering

- Use one `<canvas>` for the beam board.
- Use DOM elements for prompts, controls, feedback, Guide prose, equations,
  HUD, and summaries.
- Resize DPR-aware using the current `CLAUDE.md` recipe.
- Draw in CSS-pixel coordinates after setting the DPR transform.
- Render only on state changes except during a brief approved animation.
- Drive the section 10.5 choreography from `state.revealPhase`; the Guide and
  both games call the same controller.
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

Track only first-attempt errors by misconception category. Select the summary
tip for the most frequent category using this deterministic priority for ties:

```text
line-of-action -> direction -> force-only -> combine -> compare
```

- `through-pivot` and `along-beam` errors map to `tipLineAction`.
- wrong single-force directions map to `tipDirection`.
- Predict `★★` force-distance conflict errors map to `tipForceOnly`.
- Balance mappings follow section 11.3; Balance `★★★` and Predict `★★★`
  errors map to `tipCombine`.
- uncategorized wrong configurations map to `tipCompare`; never infer a more
  specific misconception without evidence from the chosen answer/placement.
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
- [ ] Individual child readouts show unsigned moment size plus direction;
  signed numbers appear only for net moment and technical/debug material.
- [ ] The app says moments, not visible forces, balance unless both sums were
  explicitly evaluated; `sameForceSameDistance` uses the exact safe wording in
  section 16.4.
- [ ] `moment arm` / `ramię siły` always means the perpendicular distance from
  the pivot to the force's line of action.
- [ ] No child-facing claim equates moment with momentum, work, energy, or full
  rotational motion.
- [ ] Every Guide/Game beam begins horizontal and at rest; the signed net
  moment is used only for initial angular acceleration and the first schematic
  turn.
- [ ] The schematic tilt is described as initial tendency only and never as a
  complete trajectory.
- [ ] Clockwise/counterclockwise are written in full wherever the child makes
  or receives a direction decision; left/right is reserved for position about
  the pivot.

### 18.2 Guide

- [ ] First visit opens step 1; later visits start in Explore.
- [ ] Storage denial does not prevent entry, exit, or replay.
- [ ] All nine exact EN and PL step titles, copy, scenes, and interactions are
  present.
- [ ] Prev, Next, Exit, keyboard navigation, and final destination actions
  work.
- [ ] Guide replay preserves and restores the normal state snapshot.
- [ ] The Polish Guide includes the explicit moment-versus-momentum/angular-
  momentum distinction and uses every sentence-case title in section 8.
- [ ] Step 2 requires and validates two sequential direction predictions.
- [ ] Step 5 visibly distinguishes application distance from perpendicular
  distance through both required card questions and their construction reveal.
- [ ] Step 5's three DOM card buttons use the canvas interaction layer and fit
  the exact `288px` grid at the `320px` viewport without entering the panel.
- [ ] Step 8 requires a movable-force placement and Check, follows the Balance
  interaction contract, and states rotational balance about the pivot without
  claiming zero visible force.
- [ ] Step 9 uses the same reveal controller and phase order as both games.

### 18.3 Explore

- [ ] One/two-force selection, force selection, magnitude, position,
  direction, and reset all work.
- [ ] Canvas dragging and panel controls update the same state.
- [ ] Overlapping force targets select the nearer centre; the shaft is
  grabbable outside both endpoint regions; and arrow dragging is relative —
  the effective head point follows the accumulator rules and then the exact
  polar snap, clamp, and at-tail rules in section 9.3 (updated 2026-09-01).
- [ ] A drag belongs to one primary pointer; additional pointers are ignored,
  successful release commits once, and every cancellation path restores the
  pre-drag state.
- [ ] All values snap, clamp, and render according to section 9.
- [ ] The selected line of action, moment arm, individual moment, directional
  bars, and net tendency stay synchronized.
- [ ] Keyboard-only users can reproduce every pointer manipulation.
- [ ] Adding/removing `F2` follows the retention rule in section 9.4.
- [ ] The panel contains exactly the four sections in 9.4 and fits without
  panel scrolling at `1280×720` when help is collapsed.

### 18.4 Balance Missions

- [ ] All three difficulty banks start and complete eight-round sessions.
- [ ] Every round starts with the movable tag in its labeled dock and Check
  disabled.
- [ ] Legal pointer and keyboard placements snap; pivot/occupied/invalid drops
  restore the prior state and announce the exact reason without an attempt.
- [ ] Balance dragging follows the one-primary-pointer and cancellation
  contract in section 9.3 without recording a check.
- [ ] The 48px Position buttons reproduce spatial keyboard traversal and allow
  exact selection at the minimum viewport without precise socket tapping.
- [ ] The five normative placement states and their lock/unlock transitions
  match section 11.1 exactly.
- [ ] Incorrect Check preserves the chosen socket, gives numeric and
  directionally correct feedback, then permits a retry.
- [ ] Wrong feedback remains paired with its checked placement, then clears on
  the first placement change while attempts and error category remain intact.
- [ ] Only the first check affects session accuracy.
- [ ] Correct placement shows equal opposing moment totals.
- [ ] Live individual and directional strips update at the fixed `8px/N·m`
  scale throughout placement.
- [ ] First-error diagnostic categories match the placement facts and select
  the specified summary tip.
- [ ] Quota-based selection works without duplicates or impossible fallbacks.

### 18.5 Predict Rotation

- [ ] Answer order never changes.
- [ ] Answer labels use full clockwise/counterclockwise terms in both languages
  and stack below `600px` without truncation.
- [ ] All pointer and keyboard answer methods register exactly once.
- [ ] An answer reveals each individual contribution and the net moment.
- [ ] All three difficulty banks start and complete eight-round sessions.
- [ ] Zero-moment radial, pivot, along-beam, and cancellation cases are
  explained distinctly.
- [ ] Predict feedback cannot be answered a second time after reveal.
- [ ] `★`, `★★`, and `★★★` expose exactly their specified pre-answer
  scaffolds; the `★★★` guide groups totals without revealing classification.
- [ ] Using the `★★★` guide changes neither attempts nor first-try scoring.

### 18.6 Localization And Accessibility

- [ ] All visible text, canvas descriptions, titles, and ARIA labels switch
  between EN and PL without resetting progress.
- [ ] Every section 16 manifest/Guide key exists in both languages, placeholder
  sets match exactly, and no child-visible string bypasses I18N.
- [ ] Visual decimal separators, net signs, English unit plurality, and every
  Polish unit form match section 16.7.
- [ ] Cardinal, quadrant, arbitrary-angle, and zero-moment canvas summaries use
  the exact complete templates and include both directional totals plus net
  result.
- [ ] No mixed-language child-facing state remains after switching.
- [ ] Focus is visible and phase transitions place it intentionally.
- [ ] The complete app is keyboard operable.
- [ ] Drag changes are announced on release, not every frame.
- [ ] Color is redundant in every required distinction.
- [ ] CSS and JavaScript reduced-motion gates both work.
- [ ] Every child-used target named in section 14 is at least `48×48 CSS px`;
  this is measured rather than inferred from padding rules.
- [ ] At 200% zoom and `360px` CSS width, no required content is clipped or
  horizontally scrolled.
- [ ] At `320×568`, the uniform scene formula keeps every maximum force, label,
  and usable target inside the canvas without per-arrow scaling.

### 18.7 Repository And Robustness

- [ ] `moment/index.html` is the only runtime app file.
- [ ] Head metadata and hub link are correct.
- [ ] App works without localStorage, `crypto.getRandomValues`, or font network
  completion.
- [ ] Hidden-tab and resize behavior never change a force or record an answer.
- [ ] Every event, phase, cleanup action, and focus destination follows section
  7.4; `resultWashOpen` and `leaveConfirmOpen` never duplicate phase truth.
- [ ] The mode selector cannot open Leave confirmation during an active reveal
  and is restored when the reveal reaches `complete`.
- [ ] While Leave confirmation is open, underlying round controls and
  shortcuts are inert; Stay and Escape restore the unchanged round's exact
  interaction availability without recording an attempt.
- [ ] Reduced motion skips all reveal waits but preserves the complete numeric
  and visual final state.
- [ ] Normal UI contains no debug controls.
- [ ] Rules, DOM, layout, code-review, and mandated manual checks all pass.
- [ ] A fresh independent bilingual wording and handoff-clarity review records
  PASS before implementation handoff; unresolved P0/P1 findings block
  shipment.

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
- every I18N manifest key and Guide record in both languages, with no missing
  or unknown key and exactly matching placeholder sets,
- child-visible copy discipline: every child-facing DOM, canvas, title, ARIA,
  feedback, help, and live-region string in the booted app must be produced
  from the I18N tables, and any child-facing text or accessible-name string
  present in the static markup — wherever it appears — must be exactly
  identical to the booted English rendering of the same element, so static
  copy can never drift from I18N; the DOM check enforces this equality over
  all id-bearing static copy. (Amended 2026-08-31, reworded 2026-09-01: the
  original wording demanded absence of all static copy, which conflicts
  with the repository-wide review gate's non-suppressible requirements for
  a non-empty static `<title>` and static accessible names on icon-only
  controls; a first rewording permitted static copy only in those
  gate-required spots, which neither the checker enforced nor the shipped
  markup obeyed. Equality-with-booted-English over ALL static copy is the
  enforceable form of the single-source-of-truth intent and is exactly what
  the DOM check's markup-hygiene section implements.),
- Guide state snapshot restoration,
- every transition and focus destination in section 7.4, including Guide final
  actions, Play again, Change game, result-wash dismissal, Leave, and Stay,
- one/two-force Explore controls and boundary clamps,
- panel/canvas-equivalent state actions,
- overlapping head/tail selection, shaft grabbing and its tolerance, the
  relative (accumulator) drag for both the arrow and the tail including
  Shift's fine scale and the no-jump rule when Shift changes mid-drag, the
  exact polar mapping over the effective head point, and the at-tail
  minimum-magnitude rule (updated 2026-09-01),
- one-primary-pointer ownership, ignored secondary pointers, successful
  pointer commit, and state restoration on Escape, `pointercancel`, and active
  `lostpointercapture`,
- mode-switch confirmation during an active game, including inert underlying
  round controls, allowed language switching, and exact state/input restoration
  after Stay or Escape,
- all debug scenario IDs,
- Balance dock start, disabled Check, pointer/keyboard legal placement,
  Position-button equivalence, occupied/pivot/off-board rejection, and all
  five placement states,
- Balance incorrect reveal lock, preserved-socket retry, correct lock, and
  completion,
- live Balance scaffold values at every legal socket and fixed `8px/N·m`
  strip widths,
- Predict button and keyboard answers using full direction labels,
- each Predict difficulty's exact pre-answer scaffold, including a `★★★`
  hint that changes only `hintShown`,
- shared reveal phase ordering, input locks, and reduced-motion immediate
  final state (reserved feedback geometry is a geometric property that jsdom
  cannot measure; it is asserted by the layout check's feedback-stability
  pass at 1280x720 and at all three mandated narrow viewports — moved
  from this list 2026-09-01),
- wrong-Balance feedback retained at reveal completion and cleared on the
  first changed placement without clearing attempts or error category,
- integer numeric feedback, localized placeholders, and Balance diagnostic-tip
  mapping,
- visual and spoken formatting for `0`, `0.5`, `1`, `1.5`, `2`, `4`, `5`,
  `12`, `14`, `21`, `22`, `25`, and `40`, plus positive and negative net
  moments, in both languages,
- nonzero and zero canvas-summary templates for cardinal, all four diagonal,
  and representative arbitrary-angle forces, including both directional
  totals and the net result,
- exact correct/incorrect Balance and Predict feedback composition from
  section 10.4,
- full sessions and all star thresholds,
- language switch during each phase,
- focus destinations and overlay dismissal,
- hidden-tab animation rebase,
- absence of debug DOM in normal mode.

### 19.3 Browser And Layout Matrix

Create `tools/moment-layout-check.mjs` using `puppeteer-core`. Follow the
existing Yes/No Reflex harness for local HTTP serving and Chrome discovery:
`CHROME_PATH`, then standard macOS/Linux Chrome and Chromium paths. Launch the
system browser headlessly; do not download one. Run it through
`npm run moment-layout-check`. Missing Chrome exits `2` with an actionable
message; an assertion failure exits `1`; a complete pass exits `0` and prints
the check count.

The automated script enters deterministic debug scenarios through the public
debug hooks, measures real DOM/canvas geometry, and performs every automated
assertion listed below. Manually verify the same matrix in current
Chrome/Chromium and Firefox:

| Viewport | Required checks |
|---|---|
| `1280×720` | no page scroll; complete beam and panel; no feedback shift |
| `1024×768` | arrows and Guide construction labels remain separated |
| `720×1024` | breakpoint behavior and full-width panel |
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

In `tools/moment-layout-check.mjs`, use Puppeteer to run the narrow-viewport
assertions at `320×568`, `360×640`, and `390×844`, and run the breakpoint
assertions separately at widths `720px` and `721px`:

- `computeBoardScale` matches section 14.4 and one uniform force scale is used,
- Guide step 5's interaction layer is inside `.canvas-wrap`; its three hit
  columns total `288px` at `320px` and neither overlap commentary/navigation
  nor leave the viewport,
- maximum `5 N` arrows at both beam ends, arrowhead/label bounds, and Balance
  tags remain within the visible canvas,
- every required child-used target has a measured bounding box of at least
  `48×48px`, including force-head/tail and movable-tag invisible canvas hit
  regions exercised by synthetic pointer coordinates,
- synthetic multi-pointer input leaves the primary drag in sole control, and
  `pointercancel` restores the pre-drag geometry without recording an attempt,
- the full Polish Predict labels are visible in the three-row stack,
- revealing the longest feedback changes neither beam nor primary-control
  bounding boxes.

The separate breakpoint assertions require that at `720px` the canvas precedes
a full-width panel, while at `721px` the canvas and `320px` panel are side by
side. All assertions in this subsection use Puppeteer; Playwright is neither
required nor permitted for this check.

### 19.4 Input And Accessibility Matrix

- mouse drag and click,
- touch drag and tap; a secondary touch is ignored while the primary drag
  continues, and primary `pointercancel` restores the pre-drag state,
- keyboard-only Guide, Explore, Balance, Predict, summary, and language change,
- screen-reader pass through all phase headings and live announcements,
- color-vision simulation confirming labels/patterns retain meaning,
- reduced-motion OS preference toggled before and during the session,
- browser visibility loss during Guide and tilt animation,
- rapid double click/tap and held answer key,
- font load failure and localStorage exception.

### 19.5 Independent Design And Scientific Review

Before the document is handed to the implementing agent, and again before
shipment, a reviewer separate from the author/implementer must record PASS or
HOLD for design, science, child-facing wording/localization, and handoff
clarity. HOLD in any gate blocks handoff/shipment. The review must confirm:

1. the moment formula and sign convention,
2. all Guide numeric examples,
3. line-of-action geometry at different canvas aspect ratios,
4. all authored bank values against an independent calculation,
5. every zero-moment explanation,
6. every balance statement's scope,
7. the absence of mass/force and moment/energy confusion,
8. the absence of claims about full rotational trajectories,
9. one clear learning action and one clear primary action at each phase,
10. progressive concept order across all nine Guide steps,
11. Balance and Predict play without required mental multiplication,
12. all five Balance placement states, invalid-drop behavior, and keyboard
    behavior are unambiguous,
13. full direction words and numeric feedback are consistent in EN and PL,
14. measured `48×48px` targets and responsive scene bounds at the three narrow
    test viewports,
15. signed net moment and unsigned individual moment size are never mixed in
    child copy,
16. Polish uses natural grammar, sentence case, `ramię siły`, correct decimal
    separators, and correct inflection for every generated quantity,
17. every child-visible and accessible string has an exact bilingual manifest
    entry with matching placeholders,
18. the transition table, stale-feedback clearing, drag mapping, Guide card
    container, breakpoint, and automated-check contracts leave no material
    implementation choice.

Record each review in `moment/docs/design-science-review-YYYY-MM-DD.md` if any
finding requires discussion. If a review passes without findings, a concise
signed/date-stamped section in the relevant handoff is sufficient; do not
create an empty review file.

## 20. Priority, Future Considerations, And Delivery

### 20.1 P0

Everything named in sections 5.1 and 18 is P0. The Guide, both games, exact
challenge bank, all three dedicated checks, bilingual content, and accessible
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
