# Water Tank Negative Feedback Lab: Requirements

Reference interaction/style baseline: `logigate.html`

Target file: `feedbacktank.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other `learn/` apps in this folder,
- use the compact header + top control strip + one large interactive simulation area + short status bar pattern already visible in `logigate.html`,
- use the **light-theme** family from `STYLE.md`, because water, tank walls, level lines, and charts read more clearly on a light background,
- if this document leaves a low-level implementation detail unspecified, inherit established project convention rather than inventing a new interaction language.

## 1. Purpose & Educational Goal

This app teaches the idea of **negative feedback** (`ujemne sprzężenie zwrotne`) using a water tank.

The child should understand:

- the system has a **target level**,
- the tank has an **actual level**,
- the difference between them is the **error**,
- the valve changes in a way that **opposes the error**,
- this is why the system can recover after a disturbance.

The central lesson is:

- if the water level drops below the target, the valve opens more,
- if the water level rises above the target, the valve closes more,
- the response acts **against** the deviation,
- that is why it is called **negative feedback**.

Important honesty requirement:

- the app must explicitly teach that `negative` in `negative feedback` does **not** mean “bad” or “negative output”,
- it means the correction acts in the opposite direction to the error.

Secondary learning goals:

- a loop can be stable or oscillatory,
- stronger correction is not always better,
- delay can make a good loop wobble or overshoot,
- comparing `feedback on` versus `feedback broken` is the clearest way to see what the loop is doing.

## 2. Target Audience

Children aged roughly 10-16, plus parents and teachers. The app assumes no prior knowledge of differential equations, electronics, or formal control theory.

The intended “aha” moments are:

- `The system notices that it is too low and opens the valve.`
- `It notices that it is too high and closes the valve.`
- `Without feedback, the system does not correct itself.`
- `Too much reaction or too much delay can make it slosh around the target.`

## 3. Scope

A single self-contained HTML file (`feedbacktank.html`) in the `learn/` directory. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- one transparent water tank
- one inlet valve
- one outlet drain
- one target-level marker
- `Auto Feedback` and `Manual Valve` comparison modes
- live animation of water level
- live readouts for target, level, error, valve opening, inflow, and outflow
- one history chart for level vs target
- one history chart for valve opening
- disturbance actions: change drain opening and add water
- advanced controls for response strength and sensing delay
- short built-in investigation prompts

Out of scope:

- multiple tanks
- real PLC programming
- electrical control hardware
- full PID parameter editing UI
- symbolic transfer functions or Bode plots
- backend features or multi-file architecture

## 4. Why This System

This app should use a **water tank** because the loop is visually obvious:

- the controlled quantity is water height,
- the target is a horizontal line,
- the actuator is a valve,
- the disturbance is a drain or an extra splash of water,
- the recovery is directly visible.

This is superior to electrical or purely abstract diagrams for a first app because nothing important is invisible.

## 5. High-Level Product Concept

The app should feel like a science-lab demonstrator.

The main view shows a transparent tank with:

- water inside,
- a target level line,
- a float marker at the water surface that also represents the measured level,
- an inlet pipe with a controllable valve,
- an outlet drain with adjustable opening,
- animated flow entering and leaving the tank.

Around or beside the tank, the app must also show the loop concept explicitly:

- `Target`
- `Actual Level`
- `Error`
- `Controller`
- `Valve`
- `Tank`
- `Feedback`

The app should visually combine:

- a **physical water system**,
- and a **simple control-loop explanation**.

Important design choice:

- do **not** make this look like an electronics lesson,
- the roles may be explained abstractly, but the visible system should remain mechanical and hydraulic.

## 6. Core Teaching Flow

The clearest educational sequence is:

1. Start with a stable tank in `Auto Feedback`.
2. Open the drain more.
3. Watch the level drop.
4. Watch the valve open automatically.
5. Watch the level recover toward the target.
6. Break the feedback by switching to `Manual Valve`.
7. Repeat the disturbance.
8. Observe that the system no longer fixes itself.
9. Turn up `Response Strength`.
10. Observe faster correction, then overshoot or wobble if too strong.
11. Add `Delay`.
12. Observe that delayed correction can destabilize the loop.

That sequence should shape both the design and the copy.

## 7. Scientific Model

### 7.1 Variables

Use normalized internal units for clarity and robustness.

State variables:

- `h` = water level, range `[0, 1]`
- `s` = setpoint / target level, range `[0.15, 0.85]`
- `u` = valve opening, range `[0, 1]`
- `d` = drain opening, range `[0, 1]`
- `m` = measured level used by the controller

Derived variables:

- `e = s - m` = error
- `q_in` = inflow
- `q_out` = outflow

Child-facing displays should convert these to percentages where useful:

- level: `0%` to `100%`
- valve opening: `0%` to `100%`
- drain opening: `0%` to `100%`

### 7.2 Tank Dynamics

Use one rectangular tank of constant cross-sectional area.

Recommended normalized model:

```text
q_in  = Q_IN_MAX * u
q_out = (Q_BASE + Q_DRAIN * d) * sqrt(max(h, 0))
dh/dt = q_in - q_out + q_pour
```

Where:

- `Q_IN_MAX = 0.80`
- `Q_BASE = 0.12`
- `Q_DRAIN = 0.60`
- `q_pour` is a temporary positive pulse when the user presses `Add Water`

Behavior goals:

- when the valve is open more, the level rises,
- when the drain is opened more, the level falls,
- as the water level gets higher, the drain flow should become slightly stronger,
- the tank should feel stable and readable, not twitchy.

Numerical safety:

- clamp `h` to `[0, 1]`,
- prevent `NaN` and `Infinity`,
- do not allow negative water level,
- if the tank reaches `0`, outflow should become `0`.

### 7.3 Measurement And Feedback

The controller should not read the true level directly in advanced delayed mode. It should read a measured value `m`.

Two measurement modes:

- `No Delay`: `m = h`
- `Delay`: `m` comes from a time-delayed history buffer of `h`

Delay range:

- `0.0 s` to `2.0 s`
- default: `0.0 s`

Important conceptual requirement:

- the app must clearly show that the controller is reacting to the **measured level**, not magic knowledge of the future.

### 7.4 Controller Model

The app should use a simple, intuitive controller that visibly “keeps nudging the valve” according to the error.

In `Auto Feedback` mode:

```text
e = s - m
du/dt = K * e
u = clamp(u + du/dt * dt, 0, 1)
```

Where:

- `K` is the response-strength parameter,
- higher `K` means stronger correction,
- if `e > 0`, the valve opens further,
- if `e < 0`, the valve closes further,
- if `e = 0`, the valve stops changing.

This model is intentionally simple and child-readable.

Child-facing interpretation:

- `Too low -> open more`
- `Too high -> close more`

Advanced interpretation:

- the valve position is the accumulated result of the correction signal,
- this is enough to show stable settling, overshoot, and oscillation.

### 7.5 Manual Mode

In `Manual Valve` mode:

- the feedback loop is broken,
- the automatic correction is disabled,
- the user directly controls `u` with a valve slider.

This comparison mode is required. It is one of the strongest teaching devices in the app.

### 7.6 Response Strength

Expose one slider:

- label: `Response Strength`
- internal parameter: `K`
- range: `0.4` to `4.0`
- default: `1.6`

Expected behavior:

- low `K`: slow correction
- medium `K`: stable return
- high `K`: overshoot / wobble
- high `K` + delay: obvious oscillation risk

The app does not need to use the term `gain` in the main UI. `Response Strength` is clearer for children.

### 7.7 Disturbances

The app should include two disturbance types.

Persistent disturbance:

- `Drain Opening` slider
- range: `0%` to `100%`
- default: `35%`

Instant disturbance:

- `Add Water` button
- adds a temporary inflow pulse for exactly `0.35 s`

These together teach:

- steady disturbances,
- sudden disturbances,
- recovery behavior.

Exact `Add Water` pulse for `v1`:

```text
q_pour = 0.35
duration = 0.35 s
```

Additional implementation rule:

- if `Add Water` is pressed while a pour pulse is already active, ignore the extra press rather than stacking pulses.

### 7.8 Negative Feedback Definition

The app must explicitly explain:

```text
If the level is below target, the correction pushes the system upward.
If the level is above target, the correction pushes the system downward.
That is negative feedback: the correction opposes the error.
```

### 7.9 What Can Go Wrong

The app should honestly show:

- a loop can be too weak,
- a loop can be too aggressive,
- delay can make it react too late,
- a feedback loop is not automatically perfect.

This is important. The app should not accidentally teach “feedback always fixes everything instantly.”

## 8. Visual Design

### 8.1 Visual Direction

Use a light, clean, mechanical-lab style:

- off-white background
- pale steel / gray tank frame
- bright but readable blue water
- amber/orange for valve and inflow highlights
- red for drain/outflow and warning states
- green for stable-on-target state
- muted chart colors that match the main simulation

The result should feel like a museum science exhibit rather than an industrial SCADA screen.

### 8.2 Main Layout

Follow the project pattern:

```text
[Home] Water Tank Negative Feedback Lab            [PL] [Theme]
Watch a tank correct itself with negative feedback.

[Mode: Auto Feedback | Manual Valve]
[Setpoint slider] [Drain slider] [Response Strength] [Delay]
[Add Water] [Pause/Run] [Reset]

+------------------------------------------------------+ +----------------------+
| Tank simulation board                               | | Readouts             |
| tank, target line, float, pipes, valve, drain       | | Target               |
| animated water, loop arrows, error indicator        | | Actual Level         |
|                                                      | | Error                |
|                                                      | | Valve Opening        |
|                                                      | | Inflow / Outflow     |
|                                                      | | Explanation Card     |
+------------------------------------------------------+ +----------------------+

[Level history chart]
[Valve history chart]
[status text]
```

Desktop:

- tank board dominates the width,
- readouts sit in a fixed-width right panel,
- charts span below the main row.

Mobile:

- controls wrap into compact rows,
- simulation board remains first,
- readouts move below the board,
- charts stack below readouts.

### 8.3 Main Simulation Board

The board should show:

- one transparent rectangular tank
- animated water fill
- target line across the tank
- current water-surface line
- one float marker at the water surface
- inlet pipe entering from the upper left
- controllable valve on the inlet
- outlet drain on the lower right
- a small explicit feedback diagram or arrow chain around the tank

Required overlay labels:

- `Target`
- `Actual`
- `Error`
- `Valve`
- `Tank`
- `Feedback`

Important symbol:

- the error/comparison element must visually show a **minus sign** or some explicit “difference” marker,
- otherwise the phrase `negative feedback` is too easy to misread as a mood or value judgment.

### 8.4 Dynamic Visual Cues

The simulation should make the loop activity visually obvious:

- if the tank is below target, the error indicator glows in a “needs more” direction,
- the inlet valve opens more visibly,
- inflow animation strengthens,
- if the tank is above target, the valve closes and the correction cue reverses,
- when the level is near target and stable, the board should calm down.

Optional but recommended:

- a tiny arrow showing “correction direction”
- a soft green stability halo when the system is settled

## 9. Interaction Design

### 9.1 Setpoint Control

The user must be able to move the target level directly.

Use both:

- a top slider
- and a draggable target line on the tank

Rules:

- dragging the line and moving the slider must stay synchronized,
- setpoint range must remain between `15%` and `85%`,
- changing the setpoint should immediately affect the controller in `Auto Feedback`.

### 9.2 Mode Toggle

Provide a segmented control:

- `Auto Feedback`
- `Manual Valve`

In `Auto Feedback`:

- the manual valve slider is hidden or disabled,
- the controller sets the valve.

In `Manual Valve`:

- response-strength and delay controls remain visible but disabled,
- the user controls valve opening directly.

Exact mode-switch behavior:

- switching from `Auto Feedback` to `Manual Valve` freezes the current valve opening and seeds the manual slider with that exact value,
- switching from `Manual Valve` to `Auto Feedback` keeps the current valve opening as the controller's starting point,
- switching modes must not reset the tank level, charts, setpoint, drain, or delay history,
- the setpoint control remains active in both modes so the user can still compare target versus actual level in manual mode.

### 9.3 Drain Control

Use one slider:

- label: `Drain Opening`
- range: `0%` to `100%`

Changing the drain should immediately disturb the system.

### 9.4 Add Water

Use one large button:

- label: `Add Water`

Effect:

- briefly adds extra inflow,
- raises the water level,
- lets the user watch the loop close the valve afterward.

The button should be temporarily disabled while the `0.35 s` pour pulse is active.

### 9.5 Playback Controls

Use:

- `Pause/Run`
- `Reset`

Reset must restore:

- level
- setpoint
- drain
- valve opening
- delay
- response strength
- chart history
- status text

## 10. Readouts & Charts

### 10.1 Always-Visible Readouts

The right panel must show:

- target level
- actual level
- measured level in `Auto Feedback` mode
- error
- valve opening
- inflow
- outflow
- response mode

Format:

- percentages with whole numbers where possible
- one decimal only if needed for smoothness

Exact readout rules:

- `Actual Level` always displays `h`,
- `Measured Level` displays `m` and is visible only in `Auto Feedback`,
- `Error` always means `s - m`,
- in `Manual Valve`, hide the `Measured Level` row and display `Error` as `s - h` for child-facing clarity since the controller is inactive.

### 10.2 Explanation Card

A short explanation card should summarize the current behavior in child-friendly language.

Examples:

- `The tank is too low, so the valve is opening more.`
- `The tank is too high, so the valve is closing.`
- `The loop is close to the target and has nearly settled down.`
- `The feedback is reacting too strongly and the level is wobbling.`
- `Delay makes the correction arrive too late.`
- `In manual mode, nothing corrects the level automatically.`

### 10.3 Level History Chart

The first chart must show:

- target level trace
- actual level trace
- measured level trace when mode is `Auto Feedback`

Time window:

- last `20 s`

This chart is essential for seeing:

- recovery,
- overshoot,
- settling,
- oscillation.

Exact chart rules:

- fixed y-axis range: `0%` to `100%`,
- fixed x-axis window: `20 s`,
- sample history at exactly `10 Hz`,
- prefill the full chart history on reset with the default steady-state values so the charts start calm instead of empty,
- target line should be dashed,
- actual level should be the main solid trace,
- measured level should be a thinner secondary trace that is visible only in `Auto Feedback`.

### 10.4 Valve History Chart

The second chart must show:

- valve opening over time

This chart is required because negative feedback is about the controller changing the actuator in response to error. Without a valve-history plot, that mechanism is less clear.

Exact chart rules:

- fixed y-axis range: `0%` to `100%`,
- fixed x-axis window: `20 s`,
- sample history at exactly `10 Hz`,
- prefill the full chart history on reset with the default valve value.

## 11. Guided Investigations

The app should include short built-in prompt cards or a help drawer with these exact investigation ideas:

1. `Open the drain while Auto Feedback is on. What does the valve do?`
2. `Switch to Manual Valve. Can the tank fix itself now?`
3. `Raise the target level. What changes first: level or valve?`
4. `Turn up Response Strength. Does the tank recover faster?`
5. `Turn up Delay. When does the level start to wobble?`
6. `Press Add Water. How does the controller respond after the splash?`

These prompts should be dismissible and reopenable.

## 12. Accessibility & UX Guardrails

- all controls must be keyboard reachable,
- the draggable target line must also be operable through the slider,
- color must not be the only cue; use labels and numbers too,
- reduced-motion mode should reduce water shimmer and pipe-flow animation while keeping the physics intact,
- charts must remain readable on narrow screens,
- the app must remain usable without sound,
- do not force advanced terminology in the main UI.

## 13. Technical Implementation Notes

### 13.1 Rendering

Use SVG for the main tank board.

Reasons:

- crisp tank walls and target line,
- easy animation of water height with masks or clipped rectangles,
- simple labeling of loop components,
- easy pointer interaction for dragging the target line.

Use DOM for:

- controls,
- readouts,
- explanation card,
- status text.

Use either SVG or `<canvas>` for the history charts.

### 13.2 State Model

Suggested state:

```text
state {
  mode,              // auto | manual
  running,
  level,             // h
  measuredLevel,     // m
  setpoint,          // s
  valveOpen,         // u
  drainOpen,         // d
  responseStrength,  // K
  delaySeconds,
  pourPulse,
  history: {
    time: [],
    level: [],
    measured: [],
    target: [],
    valve: [],
  }
}
```

Recommended extra state:

```text
pourRemaining,
historySampleAccumulator,
stabilityLabel,
manualValveSeed
```

### 13.3 Update Loop

Recommended fixed-step simulation:

- simulation step: `1/120 s`
- render at browser frame rate
- catch up safely with step caps if frames are delayed
- append chart samples every `0.1 s`

Delay implementation:

- use a small ring buffer of past `level` samples,
- read from `delaySeconds` in the past,
- if delay is `0`, use the current level.

Startup-history rule:

- on reset, prefill the delay buffer and chart histories with the exact default steady-state values so toggling delay does not create a fake transient at startup.

### 13.4 Robustness Requirements

The app must never produce:

- negative tank height,
- valve opening below `0%` or above `100%`,
- broken charts after long pauses,
- unstable numbers because of tab throttling or frame spikes,
- `NaN`, `Infinity`, or frozen animations after rapid slider movement.

## 14. Locked V1 Specification

This section removes ambiguity. Where Section 14 is more specific than earlier guidance, Section 14 takes priority for `v1`.

### 14.1 Hard Product Decisions

- `v1` includes exactly one tank.
- `v1` includes exactly two modes: `Auto Feedback` and `Manual Valve`.
- `v1` includes exactly two disturbances: `Drain Opening` and `Add Water`.
- `v1` includes exactly one advanced stability control pair: `Response Strength` and `Delay`.
- `v1` includes exactly two charts: `Level History` and `Valve History`.
- `v1` includes no separate lesson mode; guided prompt cards are sufficient.

### 14.2 Exact Defaults

- mode = `Auto Feedback`
- running = `true`
- setpoint = `60%`
- level = `60%`
- measured level = `60%`
- drain opening = `35%`
- valve opening auto default = `31.95%` internally, displayed as `32%`
- manual valve opening default = `31.95%` internally, displayed as `32%`
- response strength = `1.6`
- delay = `0.0 s`

These defaults should create a calm near-equilibrium starting state.

Equilibrium note:

- these defaults are chosen so `q_in ≈ q_out` at startup under the stated physics model,
- the implementing agent must preserve that equilibrium rather than rounding the internal default to a different value.

### 14.3 Exact Control Set

Top-row controls:

- mode toggle: `Auto Feedback | Manual Valve`
- setpoint slider
- drain slider
- response-strength slider
- delay slider

Action buttons:

- `Add Water`
- `Pause/Run`
- `Reset`

Manual-only control:

- `Valve Opening` slider, visible only in `Manual Valve`

Disabled-control rule in `Manual Valve`:

- `Response Strength` and `Delay` remain visible but disabled and visually dimmed,
- this keeps the layout stable while making it clear that these controls belong to automatic feedback.

### 14.4 Exact Board Geometry

Use this exact internal layout target:

- main simulation board logical size: `920 x 520`
- tank body: `x=250 y=70 w=220 h=340`
- inlet valve center: `x=190 y=120`
- drain outlet center: `x=500 y=360`
- target line spans full tank width
- feedback labels arranged around the tank, not inside the water area

### 14.5 Exact Status Logic

Use this exact status precedence:

1. if mode is `Manual Valve`: `Feedback is off. The valve will not correct itself.`
2. else if stability label is `oscillating`: `The loop is wobbling around the target.`
3. else if `delay >= 0.4 s` and stability label is `overshoot` or `recovering`: `The controller is reacting late because of delay.`
4. else if `h < s - 0.02`: `The tank is below target, so the valve is opening.`
5. else if `h > s + 0.02`: `The tank is above target, so the valve is closing.`
6. else: `The level is close to the target.`

### 14.6 Exact Stability Heuristic

Use the actual-level error:

```text
ea(t) = h(t) - s(t)
```

Maintain a rolling `6 s` error history sampled at `10 Hz`.

Define a zero crossing only when consecutive error samples change sign and both have magnitude at least `0.5%`.

Classify state using this exact order:

1. `manual`
   - if mode is `Manual Valve`
2. `oscillating`
   - at least `3` zero crossings in the last `6 s`
   - and error amplitude over the last `3 s` is at least `4%`
3. `overshoot`
   - not oscillating
   - and at least `1` zero crossing in the last `1.5 s`
   - and max absolute error over the last `2 s` is at least `5%`
4. `stable`
   - absolute current error is below `2%`
   - and error amplitude over the last `3 s` is below `3%`
5. `recovering`
   - all remaining auto-feedback cases

This heuristic is intentionally simple and deterministic.

### 14.7 Exact History Rules

- history duration = `20 s`
- history sample rate = `10 Hz`
- store exactly `200` samples per trace in a ring buffer
- level chart traces: `target`, `actual`, and `measured` when auto mode is active
- valve chart trace: `valve opening`
- when switching modes, keep existing history and continue sampling without clearing
- only `Reset` clears and re-prefills the histories

## 15. Required EN / PL Strings

The implementation must include at least these UI strings.

| Key | English | Polish |
|---|---|---|
| `title` | Water Tank Negative Feedback Lab | Laboratorium Ujemnego Sprzężenia Zwrotnego |
| `subtitle` | Watch a tank correct itself with negative feedback. | Zobacz, jak zbiornik sam koryguje się dzięki ujemnemu sprzężeniu zwrotnemu. |
| `autoFeedback` | Auto Feedback | Auto Sprzężenie |
| `manualValve` | Manual Valve | Ręczny Zawór |
| `setpoint` | Target Level | Poziom Docelowy |
| `actualLevel` | Actual Level | Poziom Rzeczywisty |
| `measuredLevel` | Measured Level | Poziom Mierzony |
| `error` | Error | Błąd |
| `valveOpening` | Valve Opening | Otwarcie Zaworu |
| `drainOpening` | Drain Opening | Otwarcie Odpływu |
| `responseStrength` | Response Strength | Siła Reakcji |
| `delay` | Delay | Opóźnienie |
| `addWater` | Add Water | Dolej Wody |
| `pause` | Pause | Pauza |
| `run` | Run | Start |
| `reset` | Reset | Reset |
| `inflow` | Inflow | Dopływ |
| `outflow` | Outflow | Odpływ |
| `target` | Target | Cel |
| `feedback` | Feedback | Sprzężenie |
| `controller` | Controller | Sterowanie |
| `valve` | Valve | Zawór |
| `tank` | Tank | Zbiornik |
| `levelHistory` | Level History | Historia Poziomu |
| `valveHistory` | Valve History | Historia Zaworu |
| `stable` | Stable | Stabilny |
| `recovering` | Recovering | Wraca Do Celu |
| `overshoot` | Overshoot | Przeregulowanie |
| `oscillating` | Oscillating | Oscyluje |
| `statusNear` | The level is close to the target. | Poziom jest blisko celu. |
| `statusLow` | The tank is below target, so the valve is opening. | Zbiornik jest poniżej celu, więc zawór się otwiera. |
| `statusHigh` | The tank is above target, so the valve is closing. | Zbiornik jest powyżej celu, więc zawór się zamyka. |
| `statusManual` | Feedback is off. The valve will not correct itself. | Sprzężenie jest wyłączone. Zawór sam się nie skoryguje. |
| `statusOsc` | The loop is wobbling around the target. | Pętla kołysze się wokół celu. |
| `statusDelay` | The controller is reacting late because of delay. | Sterowanie reaguje za późno z powodu opóźnienia. |
| `explainLow` | The tank is too low, so the controller opens the valve more. | Zbiornik jest za niski, więc sterowanie bardziej otwiera zawór. |
| `explainHigh` | The tank is too high, so the controller closes the valve more. | Zbiornik jest za wysoki, więc sterowanie bardziej zamyka zawór. |
| `explainManual` | Without feedback, the system does not fix the level by itself. | Bez sprzężenia układ sam nie naprawia poziomu. |
| `explainDelay` | Delay makes the correction arrive too late. | Opóźnienie sprawia, że korekta przychodzi za późno. |
| `negativeMeans` | Negative feedback means the correction opposes the error. | Ujemne sprzężenie zwrotne oznacza, że korekta działa przeciwnie do błędu. |

## 16. Success Criteria

The app is successful if, after a few minutes, a child can correctly explain:

- `If the level falls, the valve opens more.`
- `If the level rises, the valve closes more.`
- `That is negative feedback, because the correction opposes the error.`
- `Without feedback, the system does not self-correct.`
- `Too much reaction or too much delay can make the level wobble.`

If those ideas are obvious from the simulation, the app has achieved its purpose.
