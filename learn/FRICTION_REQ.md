# Friction Ramp Lab: Requirements

Reference interaction/style baseline: `logigate.html`

Target file: `friction.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other `learn/` apps in this folder,
- use the compact header + top control strip + one large interactive simulation area + concise status bar pattern already visible in `logigate.html`,
- use the **light-theme** family from `STYLE.md`, because textured materials, force arrows, and force-vs-angle plots read more clearly on a light background,
- if this document leaves a low-level implementation detail unspecified, inherit established project convention rather than inventing a new interaction language.

## 0. Questions & Working Assumptions

These are the main product questions that came out of the raw idea. To keep implementation moving, this document answers them with `v1` assumptions.

1. Should the app use real engineering friction data or simplified teaching values?
   Assumption for `v1`: use **educational approximate coefficients**, explicitly labeled as approximate.

2. Should the user be able to change the angle while the brick is already moving?
   Assumption for `v1`: **no**. Any change to angle or materials while the brick is moving resets the brick to the top. This keeps the model simple and readable.

3. Should the app teach only “does it slide or not,” or also “how fast does it accelerate once it slides”?
   Assumption for `v1`: teach **both**. Static friction decides whether it starts moving; kinetic friction decides the acceleration after it starts moving.

4. Should the app include many materials or a small curated set?
   Assumption for `v1`: use **4 materials** with distinct textures and a full pair table.

5. Should the app include a guided experiment that finds the slip angle automatically?
   Assumption for `v1`: **yes**. Include a `Tilt Slowly` mode because it is one of the clearest ways to teach static-friction threshold.

These assumptions are locked below unless the product owner changes them later.

## 0.1 Handoff Goal

This document is intended to be **fully ready for implementation handoff**.

Where later sections are more specific than earlier sections, the later more-specific rule takes priority. In particular:

- Section `13. Locked V1 Specification` overrides softer earlier wording,
- Section `14. Required EN / PL Strings` defines the minimum string inventory the implementation must include.

## 1. Purpose & Educational Goal

This app teaches the physics of **friction** on an inclined plane.

The child should understand:

- gravity pulls the brick down the slope,
- friction pushes opposite the motion or attempted motion,
- static friction can keep the brick from moving,
- static friction has a maximum value,
- once the brick is sliding, kinetic friction usually becomes smaller than static friction,
- the angle and material pair together decide whether the brick stays still, starts sliding, or accelerates quickly.

The most important learning outcomes are:

- a steeper slope increases the downhill pull,
- “slippery” means smaller friction coefficients,
- friction belongs to the **pair of materials in contact**, not to one material alone,
- the brick may stay stuck at one angle and slide at another,
- after slipping starts, the motion usually changes because kinetic friction is different from static friction.

Important honesty requirement:

- the app must not imply that “brick material friction” and “ramp material friction” simply add together,
- it must clearly state that the contact pair uses a lookup table of approximate coefficients.

## 2. Target Audience

Children aged roughly 10-16, plus parents and teachers. The app assumes no prior knowledge of trigonometry beyond “steeper means more downhill pull.”

The intended “aha” moments are:

- `At a small angle, the brick does not move at all.`
- `When the slope gets steep enough, the brick suddenly starts slipping.`
- `Different materials slip at different angles.`
- `Once it is sliding, it may speed up because kinetic friction is weaker than static friction.`

## 3. Scope

A single self-contained HTML file (`friction.html`) in the `learn/` directory. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- one adjustable ramp
- one brick at the top of the ramp
- brick-material selection
- ramp-material selection
- angle control
- release/reset flow
- automatic slow-tilt experiment
- live force readouts
- one force-vs-angle chart
- one motion readout block for speed, acceleration, and time to bottom
- clear state labels: `stuck`, `just slipping`, `sliding`

Out of scope:

- rolling objects
- deformable materials
- air resistance
- multiple bricks
- arbitrary user-defined friction coefficients
- full laboratory-grade realism
- backend features or multi-file architecture

## 4. Why This System

An inclined plane with one brick is the cleanest visual setup for friction because:

- the direction of motion is obvious,
- the competing forces are easy to draw,
- the slip threshold is easy to demonstrate,
- material differences are easy to texture and compare.

This is stronger for first teaching than a horizontal push experiment because the user can directly see how **angle** and **material** interact.

## 5. High-Level Product Concept

The app should feel like a tabletop physics demonstrator.

The main view shows:

- a side-view ramp with adjustable tilt,
- a brick resting at the top,
- visible textures on the brick and ramp,
- gravity arrow downward,
- downhill component arrow along the slope,
- friction arrow along the slope in the opposite direction,
- a highlighted state label near the brick.

The main interaction loop:

1. Choose the brick material.
2. Choose the ramp material.
3. Adjust the angle.
4. Observe whether the brick is predicted to stay stuck.
5. Press `Release` or `Tilt Slowly`.
6. Watch how the brick behaves.
7. Compare force values and the slip angle.

The app should visually teach three different situations:

- `stuck`: static friction is strong enough,
- `threshold`: the system is right at the edge of slipping,
- `sliding`: kinetic friction governs the motion.

## 6. Scientific Model

### 6.1 Fixed Brick Model

Use one symbolic brick:

- mass `m = 1.0 kg`
- ramp length along the surface `L = 4.0 m`
- gravitational acceleration `g = 9.81 m/s²`

Important teaching note:

- mass is fixed in `v1` on purpose,
- the app should explain that for this simplified model, the slip condition and acceleration do not depend on mass because both gravity and friction scale with `m`.

### 6.2 Angle Range

Ramp angle `θ`:

- minimum: `0°`
- maximum: `60°`
- default: `20°`
- step: `1°`

The ramp must visibly rotate in the simulation when the angle changes.

### 6.3 Material Pair Model

The friction coefficients depend on the **contact pair**.

Use these 4 materials:

- `Ice`
- `Wood`
- `Steel`
- `Rubber`

For `v1`, use the following symmetric approximate coefficient table:

| Brick / Ramp Pair | `μs` static | `μk` kinetic |
|---|---:|---:|
| Ice / Ice | 0.03 | 0.02 |
| Ice / Wood | 0.05 | 0.04 |
| Ice / Steel | 0.04 | 0.03 |
| Ice / Rubber | 0.12 | 0.08 |
| Wood / Wood | 0.40 | 0.25 |
| Wood / Steel | 0.45 | 0.30 |
| Wood / Rubber | 0.70 | 0.55 |
| Steel / Steel | 0.60 | 0.42 |
| Steel / Rubber | 0.80 | 0.60 |
| Rubber / Rubber | 1.10 | 0.90 |

Rules:

- the table is symmetric, so `Wood / Steel` equals `Steel / Wood`,
- `μk` must always stay below or equal to `μs`,
- the app should label these as `educational approximate values`.

Exact lookup rule:

- store the coefficient table once using normalized pair keys sorted alphabetically,
- for any selected pair `(brickMaterial, rampMaterial)`, compute the lookup key by sorting the two material ids alphabetically,
- all UI readouts and physics must use that same single lookup result,
- there must be no fallback interpolation or per-material averaging.

### 6.4 Forces On The Ramp

For a brick on an incline:

Normal force:

```text
N = m * g * cos(θ)
```

Down-slope gravity component:

```text
F_parallel = m * g * sin(θ)
```

Maximum static friction:

```text
F_static_max = μs * N
```

Kinetic friction magnitude:

```text
F_kinetic = μk * N
```

### 6.5 Static Regime

If the brick is still at rest:

- if `F_parallel < F_static_max`, the brick stays stuck,
- the actual static-friction force equals `F_parallel`,
- acceleration is `0`.

At the threshold:

- if `|F_parallel - F_static_max|` is very small, the app should classify the state as `just slipping`.

Slip-angle formula:

```text
θ_crit = arctan(μs)
```

This must be shown somewhere in the advanced or readout area as the predicted slip angle for the selected material pair.

Displayed predicted slip angle rule:

- compute `θ_crit` from the selected `μs`,
- display it in degrees with one decimal,
- if `θ_crit > 60°`, display `>60°` in the compact readout and the exact value in the details/help text if shown.

### 6.6 Sliding Regime

Once the brick enters an active downhill run, treat it as sliding downhill with kinetic friction:

Net force along ramp:

```text
F_net = m * g * sin(θ) - μk * m * g * cos(θ)
```

Acceleration:

```text
a = g * (sin(θ) - μk * cos(θ))
```

Rules:

- if `a <= 0`, do not simulate reverse uphill motion,
- in `v1`, this case should just be treated as `stays stuck / no downhill slide` because the brick always starts from rest at the top.
- in the exact `v1` interaction model, `just slipping` is also release-capable, so `Release` may enter this downhill-run model from the tolerance band around the threshold.

### 6.7 Motion After Release

If the brick is in a motion-capable regime (`just slipping` or `sliding`) and the user presses `Release`:

- start from rest at the top of the ramp,
- move with constant acceleration `a`,
- stop the animation when the brick reaches the bottom.

Useful derived values:

Time to bottom:

```text
t_bottom = sqrt(2 * L / a)
```

Final speed at the bottom:

```text
v_bottom = sqrt(2 * a * L)
```

If the brick is stuck:

- `t_bottom` and `v_bottom` should display as `—`.

### 6.8 Tilt Slowly Experiment

The app should include an automatic slow-tilt mode:

- start at `0°`,
- increase the angle at `6°/s`,
- stop as soon as the brick crosses out of `stuck`,
- mark that angle as the observed slip angle.

This allows a direct comparison between:

- predicted slip angle `θ_crit`,
- observed slip angle from the simulation.

## 7. Visual Design

### 7.1 Visual Direction

Use a light, workshop / classroom-lab aesthetic:

- off-white background
- pale board or lab-table backdrop
- ramp texture clearly visible
- brick texture clearly visible
- strong force-arrow colors:
  - gravity: blue
  - downhill gravity component: orange
  - friction: red
- stable-state accents: green
- sliding-state accents: amber or red-orange

The app should feel tactile and concrete rather than abstract.

### 7.2 Layout

Follow the broad project pattern:

```text
[Home] Friction Ramp Lab                            [PL] [Theme]
Change the materials and angle to see when the brick slips.

[Brick Material] [Ramp Material] [Angle slider] [Angle +/-]
[Release] [Tilt Slowly] [Pause/Run] [Reset]

+------------------------------------------------------+ +----------------------+
| Ramp simulation board                               | | Readouts             |
| textured ramp, textured brick, force arrows         | | Pair                |
| state label, angle marker, motion animation         | | μs / μk             |
|                                                      | | Slip Angle          |
|                                                      | | F_parallel          |
|                                                      | | F_static_max        |
|                                                      | | Actual Friction     |
|                                                      | | F_kinetic          |
|                                                      | | Acceleration        |
+------------------------------------------------------+ +----------------------+

[Force-vs-angle chart]
[status text]
```

Desktop:

- simulation board dominates the width,
- readouts sit in a fixed-width right panel,
- chart sits below the main row.

Mobile:

- controls wrap into compact rows,
- simulation board remains first,
- readouts move below the board,
- chart stacks below the readouts.

### 7.3 Main Simulation Board

The board should show:

- one side-view ramp pivoted from the bottom
- one brick resting on the upper part of the ramp
- material textures on both surfaces
- current angle arc marker with degree label
- gravity arrow straight down from the brick
- downhill gravity-component arrow along the ramp
- friction arrow along the ramp opposite the potential or actual motion
- optional normal-force arrow for advanced mode or details toggle

Required labels near the brick:

- `Stuck`
- `Just Slipping`
- `Sliding`

### 7.4 Motion Cues

The board should make behavior differences obvious:

- in `stuck`, the brick stays perfectly still,
- in `just slipping`, the state label pulses and the force arrows nearly match,
- in `sliding`, the brick visibly accelerates,
- the motion should feel noticeably different for low-friction vs high-friction pairs.

Exact visual-state rule:

- `stuck` and `just slipping` both keep the brick motionless until the user explicitly presses `Release`,
- only `sliding` allows automatic downhill motion during an active slide run.

## 8. Interaction Design

### 8.1 Material Selection

The user must choose:

- brick material
- ramp material

Use one control group for each.

Recommended `v1` UI:

- 4 material buttons or compact cards for each selector,
- each button shows a texture swatch and material name.

Changing either material must immediately update:

- `μs`
- `μk`
- predicted slip angle
- state classification at the current angle
- observed slip angle validity

If the brick is already moving:

- changing materials resets the simulation to the top.

Exact material-change reset rule:

- stop any active slide or tilt experiment,
- keep the current angle if the user changed only materials,
- recompute coefficients and state immediately,
- clear `observedSlipAngle` because it belongs to the previous material pair and setup,
- set brick position to the top and speed to `0`.

### 8.2 Angle Control

Use:

- one slider
- `-` and `+` step buttons

The angle readout should update live.

Rules:

- changing angle updates the predicted state immediately,
- if the brick is moving, changing angle resets the simulation to the top,
- if `Tilt Slowly` is active and the user touches the angle controls, cancel the tilt experiment.

Exact angle-change rule:

- if mode is `sliding`, changing the angle stops the slide, resets the brick to the top, sets speed to `0`, and applies the new angle,
- if mode is `tilting`, changing the angle stops the tilt experiment, clears the active tilt motion, keeps the manually chosen angle, and resets the brick to the top,
- any manual angle change clears `observedSlipAngle` because it belongs to the previous setup,
- if mode is `idle`, the angle change never moves the brick automatically.

### 8.3 Release Flow

Use one `Release` button.

Behavior:

- if the brick is stuck, pressing `Release` should show a short “does not move” response rather than doing nothing silently,
- if the brick is in the `just slipping` or `sliding` regime, pressing `Release` starts the downhill animation,
- while sliding, `Release` becomes disabled.

Exact release-start rule:

- on `Release`, sample the current coefficients and angle once and hold them constant for that run,
- the run always starts from `positionAlongRamp = 0` and `velocity = 0`,
- if state is `stuck`, do not start motion,
- if state is `just slipping`, start motion using the kinetic-friction acceleration model,
- if state is `sliding`, start motion using the same kinetic-friction acceleration model.

Exact no-motion response when stuck:

- pulse the `Stuck` label once for about `500 ms`,
- briefly flash the friction arrow,
- keep the brick position unchanged,
- keep the mode as `idle`.

### 8.4 Tilt Slowly Flow

Use one `Tilt Slowly` button.

Behavior:

- resets the ramp to `0°`,
- places the brick at the top,
- slowly increases the angle,
- stops once the state first leaves `stuck`,
- stores and displays the observed slip angle,
- enables `Release` immediately afterward if the user wants to run the downhill slide from that angle.

Exact observed-slip-angle rule:

- store the angle at the first simulation step where the state leaves `stuck`,
- round the displayed observed slip angle to one decimal,
- keep the ramp at that exact angle after the experiment stops,
- keep the brick at the top with speed `0` after the experiment stops.

### 8.5 Reset

Reset must restore:

- angle
- brick position
- speed
- selected materials to defaults
- observed slip angle
- chart state
- status text

Reset must also restore:

- mode to `idle`
- paused/running state to default idle display
- any cached run-specific acceleration

## 9. Readouts & Chart

### 9.1 Always-Visible Readouts

The right panel must show:

- brick material
- ramp material
- `μs`
- `μk`
- predicted slip angle `θ_crit`
- current angle `θ`
- `F_parallel`
- `F_static_max`
- actual friction now
- `F_kinetic`
- acceleration `a`
- bottom speed `v_bottom`
- time to bottom `t_bottom`

Readout formatting:

- force in `N` with one decimal,
- acceleration in `m/s²` with two decimals,
- angles in degrees with one decimal when needed.

Exact readout rules:

- `Actual Friction` displays the friction force acting in the currently shown situation,
- if state is `stuck` or `just slipping`, `Actual Friction = F_parallel`,
- if mode is `sliding`, `Actual Friction = F_kinetic`,
- if mode is `idle` and state is `sliding`, `Actual Friction` must display `—` because no active downhill run is happening yet,
- `F_kinetic` always displays the magnitude `μk N`, even when the brick is not currently sliding,
- `Acceleration` displays the predicted downhill acceleration whenever the current classified state is `sliding`,
- if state is `stuck`, `Acceleration` must display exactly `0.00 m/s²`,
- if state is `just slipping`, `Acceleration` must display exactly `0.00 m/s²`,
- `v_bottom` and `t_bottom` must be computed from the current selected pair and angle, not from stale values from a previous run.

### 9.2 State-Specific Readout Rules

If stuck:

- show `actual friction = F_parallel`,
- show `acceleration = 0`,
- show `v_bottom = —`,
- show `t_bottom = —`.

If just slipping:

- show `actual friction = F_parallel`,
- still show `acceleration = 0`,
- highlight that the system is at the edge of motion.

If sliding:

- if motion is active, show `actual friction = μk N`,
- if motion is not active yet, show `actual friction = —`,
- show positive acceleration,
- show `v_bottom` and `t_bottom`.

### 9.3 Force-vs-Angle Chart

The chart must show:

- `F_parallel(θ) = m g sin θ`
- `F_static_max(θ) = μs m g cos θ`

Requirements:

- x-axis: angle from `0°` to `60°`
- y-axis: force in `N`
- vertical marker for the current angle
- intersection point visually indicates the predicted slip angle

Exact chart rules:

- fixed y-axis range: `0 N` to `10 N`,
- sample each plotted function at `0.5°` increments,
- use the currently selected material pair only,
- update immediately whenever materials change,
- the chart does not persist run history; it is always a live analytical chart.

This chart is important because it explains **why** the slip threshold exists.

## 10. Guided Investigations

The app should include short built-in prompt cards or a help drawer with these exact investigation ideas:

1. `Which material pair slips first as you increase the angle?`
2. `Can you find a pair that still stays stuck at 40°?`
3. `Compare Wood on Wood and Ice on Steel at the same angle.`
4. `Why does the brick stay still even though gravity is pulling it down?`
5. `What changes after the brick starts sliding: static friction or kinetic friction?`
6. `Use Tilt Slowly and compare the observed slip angle to the predicted one.`

These prompts should be dismissible and reopenable.

These prompt cards are bilingual UI content and must come from the string inventory in Section `14`.

## 11. Accessibility & UX Guardrails

- all controls must be keyboard reachable,
- the angle slider must also have `-` and `+` step buttons,
- material selectors must have strong focus states,
- color must not be the only signal; state labels and numbers must reinforce the meaning,
- reduced-motion mode should shorten or simplify the slide animation but keep the physics unchanged,
- the app must remain usable without sound,
- advanced formulas should be optional or compact rather than overwhelming the main UI.

## 12. Technical Implementation Notes

### 12.1 Rendering

Use SVG for the main ramp board.

Reasons:

- crisp rotating ramp,
- easy brick positioning and rotation,
- easy force-arrow labeling,
- easy texture fills or SVG patterns for material swatches.

Use DOM for:

- controls,
- readouts,
- status text,
- prompt cards.

Use SVG or `<canvas>` for the force-vs-angle chart.

### 12.2 State Model

Suggested state:

```text
state {
  running,
  mode,              // idle | tilting | sliding
  angleDeg,
  brickMaterial,
  rampMaterial,
  muStatic,
  muKinetic,
  positionAlongRamp, // 0..L, distance traveled by the brick center from the top start center to the bottom end center
  velocity,
  acceleration,
  observedSlipAngle,
  chartMarkerAngle,
}
```

### 12.3 Simulation Rules

Recommended fixed-step simulation:

- simulation step: `1/120 s`
- render at browser frame rate
- catch up safely with step caps if frames are delayed

While `tilting`:

- increase `angleDeg` at `6°/s`,
- recompute friction regime each step,
- stop exactly when the state first leaves `stuck`.

While `sliding`:

- use constant acceleration from the current angle and selected `μk`,
- integrate position and velocity,
- clamp the brick at the bottom.

End-of-run rules:

- when `sliding` reaches the bottom, clamp `positionAlongRamp = L`,
- set `velocity = 0`,
- set mode to `idle`,
- disable `Pause/Run`,
- keep the brick visibly resting at the bottom until the user changes inputs, presses `Reset`, or presses `Release` again.

- when `tilting` stops because the state first leaves `stuck`, set mode to `idle`,
- keep the ramp at the observed angle,
- keep the brick at the top with `velocity = 0`.

Pause behavior:

- `Pause/Run` pauses only an active `tilting` or `sliding` run,
- while paused, the brick, timer, and tilt angle stop advancing,
- while paused, material selectors and angle controls stay disabled,
- pressing `Run` resumes the paused run from the current state.

### 12.4 Robustness Requirements

The app must never produce:

- negative time-to-bottom,
- imaginary speeds due to negative square roots,
- `NaN` or `Infinity`,
- brick motion beyond the bottom of the ramp,
- stale coefficient values after material changes,
- frozen animation after rapid slider changes or resets.

## 13. Locked V1 Specification

This section removes ambiguity. Where Section 13 is more specific than earlier guidance, Section 13 takes priority for `v1`.

### 13.1 Hard Product Decisions

- `v1` includes exactly one brick.
- `v1` includes exactly one ramp.
- `v1` includes exactly 4 materials: `Ice`, `Wood`, `Steel`, `Rubber`.
- `v1` includes exactly two experiment actions: `Release` and `Tilt Slowly`.
- `v1` includes exactly one chart: `Force vs Angle`.
- `v1` includes no user-editable coefficient mode.

### 13.2 Exact Defaults

- brick material = `Wood`
- ramp material = `Wood`
- angle = `20°`
- brick at top
- speed = `0`
- acceleration cache = `0`
- observed slip angle = none
- mode = `idle`

At startup, the brick should be clearly stuck.

### 13.3 Exact Control Set

Top-row controls:

- brick-material selector
- ramp-material selector
- angle slider
- angle `-`
- angle `+`

Action buttons:

- `Release`
- `Tilt Slowly`
- `Pause/Run`
- `Reset`

`Pause/Run` is only active while `tilting` or `sliding`.

Exact button-label rule:

- while an experiment is actively advancing, show `Pause`,
- while a `tilting` or `sliding` experiment is paused, show `Run`,
- while idle, show `Run` but keep the button disabled.

Disabled-control rules:

- while `sliding`, disable material selectors, angle slider, angle step buttons, `Release`, and `Tilt Slowly`,
- while `tilting`, disable material selectors, manual angle controls, and `Release`,
- while `idle`, `Pause/Run` is disabled.

### 13.4 Exact Board Geometry

Use this exact internal layout target:

- main simulation board logical size: `920 x 520`
- ramp pivot point: `x=180 y=390`
- ramp length on screen: `520 px`
- brick size on board: `74 px` along ramp by `46 px` normal to ramp
- top start center point for the brick on screen: `483 px` from the pivot toward the top
- bottom end center point for the brick on screen: `37 px` from the pivot toward the top
- map `positionAlongRamp = 0` to the top start center point and `positionAlongRamp = L` to the bottom end center point
- angle arc and degree label near the pivot
- readout panel arranged to the right of the board

### 13.5 Exact State Classification

Use these exact rules:

- `stuck` if `F_parallel < F_static_max - 0.05 N`
- `just slipping` if `|F_parallel - F_static_max| <= 0.05 N`
- `sliding` if `F_parallel > F_static_max + 0.05 N`

These rules are for child-facing state labels and UI stability, not for high-precision physics claims.

Exact motion-transition rule:

- state classification is based on the current selected angle and pair only,
- automatic motion begins only after `Release` or the stop point of `Tilt Slowly`,
- `just slipping` is treated as motion-capable for release, but not as auto-motion while idle.

### 13.6 Exact Status Logic

Use this exact status precedence:

1. if mode is `tilting`: `The ramp is tilting upward. Watch for the slip point.`
2. else if mode is `sliding`: `The brick is sliding. Kinetic friction is acting now.`
3. else if state is `sliding`: `At this angle, the brick will slide when released.`
4. else if state is `just slipping`: `The brick is at the edge of slipping.`
5. else: `The brick is stuck because static friction is strong enough.`

Observed-angle status add-on:

- if `observedSlipAngle` exists and mode is `idle`, append `Observed slip angle: {value}.` to the status line in a secondary sentence.

Exact near-brick label rule:

- the near-brick state label always reflects the classification state (`stuck`, `just slipping`, `sliding`), not whether motion is currently running,
- therefore if mode is `idle` and state is `sliding`, the near-brick label still shows `Sliding`,
- the status line, not the near-brick label, is responsible for explaining whether the brick is moving now or would move on `Release`.

### 13.7 Exact Texture Mapping

Use this exact visual mapping in `v1`:

- `Ice`: pale blue with subtle white streaks
- `Wood`: warm tan with horizontal grain lines
- `Steel`: cool gray with faint brushed-metal bands
- `Rubber`: dark charcoal with dotted or crosshatch grip pattern

The same material should use the same texture style in both selectors and the simulation board.

### 13.8 Exact Chart And Readout Determinism

- force chart y-axis is fixed at `0..10 N`
- force chart x-axis is fixed at `0..60°`
- force chart updates immediately on material or angle changes
- readouts update immediately on material or angle changes
- `observedSlipAngle` is produced only by a completed tilt experiment
- any material change, any manual angle change, and `Reset` must clear `observedSlipAngle` immediately

## 14. Required EN / PL Strings

The implementation must include at least these UI strings.

| Key | English | Polish |
|---|---|---|
| `title` | Friction Ramp Lab | Laboratorium Tarcia Na Równi |
| `subtitle` | Change the materials and angle to see when the brick slips. | Zmieniaj materiały i kąt, aby zobaczyć, kiedy cegła zaczyna się ślizgać. |
| `brickMaterial` | Brick Material | Materiał Cegły |
| `rampMaterial` | Ramp Material | Materiał Równi |
| `angle` | Angle | Kąt |
| `release` | Release | Puść |
| `tiltSlowly` | Tilt Slowly | Przechylaj Powoli |
| `pause` | Pause | Pauza |
| `run` | Run | Start |
| `reset` | Reset | Reset |
| `ice` | Ice | Lód |
| `wood` | Wood | Drewno |
| `steel` | Steel | Stal |
| `rubber` | Rubber | Guma |
| `stateStuck` | Stuck | Trzyma Się |
| `stateThreshold` | Just Slipping | Prawie Się Ślizga |
| `stateSliding` | Sliding | Ślizga Się |
| `muStatic` | Static Friction `μs` | Tarcie Statyczne `μs` |
| `muKinetic` | Kinetic Friction `μk` | Tarcie Kinetyczne `μk` |
| `slipAngle` | Slip Angle | Kąt Poślizgu |
| `observedSlipAngle` | Observed Slip Angle | Zaobserwowany Kąt Poślizgu |
| `downhillForce` | Downhill Force | Siła W Dół Równi |
| `maxStatic` | Max Static Friction | Maks. Tarcie Statyczne |
| `actualFriction` | Actual Friction | Rzeczywiste Tarcie |
| `kineticForce` | Kinetic Friction | Tarcie Kinetyczne |
| `acceleration` | Acceleration | Przyspieszenie |
| `bottomSpeed` | Speed At Bottom | Prędkość Na Dole |
| `timeToBottom` | Time To Bottom | Czas Do Dołu |
| `statusTilting` | The ramp is tilting upward. Watch for the slip point. | Równia przechyla się coraz bardziej. Wypatruj momentu poślizgu. |
| `statusSliding` | The brick is sliding. Kinetic friction is acting now. | Cegła się ślizga. Teraz działa tarcie kinetyczne. |
| `statusWillSlide` | At this angle, the brick will slide when released. | Przy tym kącie cegła zacznie się ślizgać po puszczeniu. |
| `statusThreshold` | The brick is at the edge of slipping. | Cegła jest na granicy poślizgu. |
| `statusStuck` | The brick is stuck because static friction is strong enough. | Cegła trzyma się, bo tarcie statyczne jest wystarczająco duże. |
| `statusObservedSlip` | Observed slip angle: {value}. | Zaobserwowany kąt poślizgu: {value}. |
| `approxValues` | These friction values are approximate teaching values. | Te wartości tarcia są przybliżonymi wartościami do nauki. |
| `pairRule` | Friction depends on the pair of materials in contact. | Tarcie zależy od pary stykających się materiałów. |
| `prompt1` | Which material pair slips first as you increase the angle? | Która para materiałów zaczyna ślizgać się jako pierwsza, gdy zwiększasz kąt? |
| `prompt2` | Can you find a pair that still stays stuck at 40°? | Czy znajdziesz parę, która nadal się trzyma przy 40°? |
| `prompt3` | Compare Wood on Wood and Ice on Steel at the same angle. | Porównaj Drewno na Drewnie i Lód na Stali przy tym samym kącie. |
| `prompt4` | Why does the brick stay still even though gravity is pulling it down? | Dlaczego cegła stoi w miejscu, choć grawitacja ciągnie ją w dół? |
| `prompt5` | What changes after the brick starts sliding: static friction or kinetic friction? | Które tarcie rządzi ruchem, gdy cegła już się ślizga: statyczne czy kinetyczne? |
| `prompt6` | Use Tilt Slowly and compare the observed slip angle to the predicted one. | Użyj Przechylaj Powoli i porównaj zaobserwowany kąt poślizgu z przewidywanym. |

## 15. Success Criteria

The app is successful if, after a few minutes, a child can correctly explain:

- `A steeper ramp makes the downhill pull larger.`
- `Different material pairs have different friction.`
- `Static friction can stop the brick completely.`
- `Once sliding begins, kinetic friction controls the motion.`
- `The slip angle depends on the material pair.`

If those ideas are visually obvious from the ramp, brick, materials, and motion, the app has achieved its purpose.
