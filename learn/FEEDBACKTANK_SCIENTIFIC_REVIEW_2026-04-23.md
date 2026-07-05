# Scientific Review: `feedbacktank.html`

Date: 2026-04-23

Scope: scientific and mathematical review of `feedbacktank.html` only. No existing Markdown requirement or review documents were read. Public sources were used only to check the physics/control-theory basis.

Verdict: the tank mass-balance and `sqrt(h)` outflow idea are defensible as a normalized educational model, but the feedback/controller implementation is not scientifically solid for the stated "stable negative feedback mechanism" story. The default state is not an equilibrium, the controller is pure integral action while the UI describes direct mechanical feedback, and the zero-leak case is undamped/marginal rather than settling. There is also a runtime blocker for leak visualization.

## Current Model Extracted From The HTML

Line references are from `feedbacktank.html`.

Constants:

- `Q_IN_MAX = 0.92` (line 676)
- `Q_BASE = 0.08` (line 677)
- `Q_LEAK_MAX = 0.42` (line 678)
- `Q_CONTROL_DRAIN = 0.56` (line 679)
- `SIM_DT = 1 / 120` (line 680)
- `DEF_S = 0.6`, `DEF_H = 0.6`, `DEF_LEAK = 0`, `DEF_K = 1.6`, `DEF_BALANCE = 0.19` (lines 709-713)

State variables:

- `h`: actual normalized water level.
- `s`: target/setpoint normalized water level.
- `m`: measured level, delayed version of `h` when delay is enabled.
- `balance`: signed actuator state. Positive opens fill, negative opens drain.
- `K`: gain used by the integrator.

Implemented equations in `simStep` (lines 2475-2504), in continuous-time notation:

```text
m(t) = h(t - delay)
e(t) = s(t) - m(t)
db/dt = K e(t), with b clamped to [-1, 1]

u_in  = max(0, b)
u_out = max(0, -b)

q_in          = 0.92 u_in
q_leak        = 0 if leak == 0
              = (0.08 + 0.42 leak) sqrt(h) otherwise
q_control_out = 0.56 u_out sqrt(h)
q_out         = q_leak + q_control_out

dh/dt = q_in - q_out, with h clamped to [0, 1]
```

Numerical integration is explicit Euler at 120 Hz.

## Scientific Baseline

For a constant-area tank, conservation of volume/mass gives a level-rate equation proportional to inflow minus outflow. A water-tank review states that the mass balance produces a first-order differential equation for level, and that incompressible-liquid models are often rewritten as volume-conservation state equations. It also notes nonlinear orifice discharge forms for tank outflow. Source: https://www.mdpi.com/2075-1702/10/10/960

The use of `sqrt(h)` for gravity-driven outflow is physically reasonable for a bottom outlet/orifice: Torricelli's theorem follows from Bernoulli's equation and gives exit speed depending on the vertical head; with fixed outlet area this means flow is proportional to `sqrt(head)`. Source: https://openbooks.lib.msu.edu/collegephysics1/chapter/the-most-general-applications-of-bernoullis-equation-2/

For control language, the file needs to distinguish proportional, integral, and derivative action. The University of Michigan process-control reference defines feedback control as measuring the controlled output and adjusting an input, and says proportional output is proportional to error while integral output is proportional to accumulated error. It also notes that integral-only control risks overshoot and is normally paired with proportional control. Source: https://encyclopedia.che.engin.umich.edu/process-control/

Delay can legitimately cause extra overshoot and instability, but delay is not the only source of oscillation in this HTML's current model. Time delays commonly harm closed-loop stability and can make systems unstable as gain increases. Source: https://pages.jh.edu/signals/delay4/index.html

## Findings For A Fixing Agent

### 1. High - The default state is not a physical equilibrium

Evidence:

- Defaults set `h = s = 0.6`, `leak = 0`, and `balance = 0.19` (lines 709-713, 715-734).
- Reset repeats the same values and sets `qIn = Q_IN_MAX * DEF_BALANCE`, `qOut = 0` because `DEF_LEAK = 0` (lines 2579-2596).
- With those values, `qIn = 0.92 * 0.19 = 0.1748` and `qOut = 0`, so `dh/dt = +0.1748`.
- The app labels this as stable/calm (`statusStable`, lines 784-785) even though the tank must immediately rise.

Why this is wrong:

At steady level, `dh/dt` must be zero, so `qIn = qOut`. For zero leak and zero control drain, this requires `balance = 0`, not `0.19`. The current default has a built-in unbalanced inflow.

Fix:

- If the default leak remains 0%, set `DEF_BALANCE = 0`, `state.uIn = 0`, `state.qIn = 0`, and initial static readouts consistently show inflow/outflow as 0.
- If the intent is to show a tank holding level against a leak, set `DEF_LEAK` to the value balanced by `DEF_BALANCE`, or compute `DEF_BALANCE` from the default leak and target:

```text
b_star = ((Q_BASE + Q_LEAK_MAX * leak) * sqrt(s)) / Q_IN_MAX
```

For the current `DEF_BALANCE = 0.19` and `s = 0.6`, the matching leak slider value is about `0.3468` or `34.7%`.

Acceptance test:

- After reset and 30 simulated seconds with delay 0, target 60%, and leak 0%, level remains 60% if no user action occurs.
- If a nonzero default leak is chosen, reset must start with `abs(qIn - qOut) < 0.001`.

### 2. High - The controller is pure integral action, but the visual explanation describes direct mechanical feedback

Evidence:

- `state.balance = clamp(state.balance + state.K * error * dt, -1, 1)` (line 2490).
- Valve openings come from the signed integrated balance, not directly from current error (lines 2492-2493).
- UI text says "rocker opens" a fill/drain valve based on the measured level being below/above target (lines 786-801), and "Response Strength" suggests an immediate response gain (lines 548-560).

Why this is wrong:

The implemented controller is:

```text
db/dt = K (s - m)
```

That is integral control. A visible mechanical comparator/rocker would normally be closer to proportional action:

```text
u proportional to (s - m)
```

Integral-only control can remove steady-state error, but it is slow, overshoot-prone, and normally combined with proportional control. This mismatch is a scientific/pedagogical problem, not just a naming issue.

Fix:

Use a PI controller if the goal is "mechanism reacts immediately, but can still hold exact level against a leak":

```text
error = s - m
integral += Ki * error * dt, with anti-windup
command = Kp * error + integral

u_in  = clamp(command, 0, 1)
u_out = clamp(-command, 0, 1)
```

Keep `integral = 0` at reset when leak is 0. With leak present, the integral term can settle to the valve opening needed to balance the leak. The visual rocker should be driven mostly by the proportional component, and the "Control Balance" readout should either be renamed to "Valve Command" or clearly represent the signed command.

If the app intentionally teaches integral-only control, then update the visible text to say it is an integral controller and remove "mechanical rocker" claims that imply direct proportional linkage.

Acceptance test:

- A target step from 60% to 70% should move the fill command immediately, not only after the integrated state accumulates.
- With delay 0 and leak 0, the level should settle back to target after a small add/remove-water disturbance rather than continuing a persistent wobble.

### 3. High - With zero leak, the current loop is undamped and does not asymptotically settle

Evidence:

For delay 0, leak 0, and small positive `balance`, the implemented model linearizes to:

```text
x = h - s
dx/dt = Q_IN_MAX b
db/dt = -K x
```

Therefore:

```text
d2x/dt2 = -Q_IN_MAX K x
```

This is the equation for an undamped oscillator. For negative `balance`, the drain coefficient changes, but the same undamped second-order structure remains.

I reproduced the HTML equations directly. Starting from the current reset values for 80 s gave a level range of about `0.4667` to `0.7441`, and even in the final 10 s the level still ranged from about `0.5266` to `0.6765`; it did not settle.

Why this is wrong:

The educational text claims the tank can be "near the target and calm" and that after disturbances the level "settles" (lines 784-811). The zero-leak model lacks a damping mechanism, so settling is not guaranteed by the equations.

Fix:

- Add proportional feedback as described in Finding 2.
- Keep a continuous physical outlet/leak term if the desired plant should have natural damping, but do not rely on a nonzero leak to make the default model stable.

With a PI controller and positive `Kp`, the zero-delay local model has positive damping. Around an inlet-side equilibrium:

```text
x' = -(Q_IN_MAX Kp + q_leak'(s)) x + Q_IN_MAX i
i' = -Ki x
```

The characteristic equation is:

```text
lambda^2 + (Q_IN_MAX Kp + q_leak'(s)) lambda + Q_IN_MAX Ki = 0
```

Positive `Kp` and `Ki` give positive coefficients and a stable local second-order loop in the unsaturated region.

Acceptance test:

- With leak 0, delay 0, and response at its default value, a 5% perturbation in `h` should decay to within 1% of target and remain there.
- Oscillation classification should not appear for the default no-delay reset state.

### 4. Medium - Leak physics has a discontinuity at 0%

Evidence:

The leak equation is:

```js
state.qLeak = state.leak > 0
  ? (Q_BASE + Q_LEAK_MAX * state.leak) * Math.sqrt(hSafe)
  : 0;
```

This is line 2496.

Why this is questionable:

Moving the leak slider from 0% to 1% does not create 1% of maximum leak. It instantly adds `Q_BASE * sqrt(h)` plus a small increment. At `h = 0.6`, that base jump is about `0.062` normalized level/s before the 1% term. A slider labelled "Leak Disturbance" is expected to vary continuously from no leak to max leak unless the UI explicitly says there is a threshold leak that appears once opened.

Fix options:

- Recommended simple fix:

```text
q_leak = Q_LEAK_MAX * leak * sqrt(h)
```

- If a base process drain is desired, model it continuously and name it separately:

```text
q_process_out = Q_PROCESS_BASE * sqrt(h)       // always present
q_disturbance = Q_LEAK_MAX * leak * sqrt(h)    // slider-controlled
q_out = q_process_out + q_disturbance + q_control_out
```

If a base drain is always present, recompute the reset equilibrium command so the default state is balanced.

Acceptance test:

- The leak readout/behavior changes continuously when the slider moves from 0% to 1%.
- At 0% leak, `qLeak` is either exactly 0 or a separately labelled always-on process drain.

### 5. Medium - The app attributes oscillation to delay even when delay is not the cause

Evidence:

- `classifyStability()` detects crossings in actual error (lines 2169-2200).
- `updateStatus()` maps any `state.stabilityLabel === "oscillating"` to `explainDelay` (lines 2242-2245).
- Current no-delay, zero-leak dynamics can oscillate because of pure integral action, not because of delay.

Why this is wrong:

Delay does make closed-loop stability worse, but the current controller can wobble without delay. The explanation should not imply delay caused every oscillation.

Fix:

- First fix the controller dynamics.
- Then make status text conditional:

```text
if oscillating and delaySeconds > 0: explain delay-induced phase lag
if oscillating and delaySeconds == 0: explain excessive gain / underdamped controller
```

Acceptance test:

- With delay 0, any oscillation message mentions gain/tuning or underdamping, not measurement lag.
- With delay > 0, the message may mention measured-marker lag.

### 6. Medium - UI text mentions controls/features that are absent

Evidence:

- Translations include mode, manual override, manual balance, Add Water, and investigations telling the user to switch to manual override or press Add Water (lines 741-749, 806-811, 817-825, 882-887).
- The actual controls only include target, leak, response, delay, pause, and reset (lines 516-583).
- Momentary pointer forcing exists on SVG valves (lines 2672-2691), but that is not the same as a visible "manual override" mode or "Add Water" button.

Why this matters scientifically:

The investigation prompts make claims about experiments that cannot be performed. A future reader cannot validate the described disturbances or manual feedback break from the current UI.

Fix:

- Either implement the missing controls fully, with equations and state behavior matching the prompts, or remove/replace those investigation cards.
- If keeping manual valve forcing, explain it as momentary valve forcing, not a broken feedback loop, unless the model actually disconnects feedback.

Acceptance test:

- Every investigation card corresponds to an available UI action.
- If text says feedback is disconnected, the control equation actually stops using `error` to update the actuator.

### 7. Medium - Leak scenario currently has a runtime blocker

Evidence:

- `updateBoard()` calls `renderDrips(...)` when `leakN > 0.02` (lines 2459-2468).
- No `renderDrips` function is defined anywhere in the file.
- `npm run code-review -- feedbacktank.html` reports: `[HIGH] js/no-undef (line 2461) 'renderDrips' is not defined.`

Why this matters scientifically:

The leak disturbance is one of the central experiments. As soon as a nonzero leak tries to render drips, the animation can throw a `ReferenceError`, preventing users from observing the disturbance and response.

Fix:

- Define `renderDrips` in the single HTML file, or remove the call and replace it with a simpler SVG update.
- Run `npm run code-review -- feedbacktank.html` after the fix.

Acceptance test:

- Leak slider at 1%, 50%, and 100% runs for 30 seconds without console errors.
- `npm run code-review -- feedbacktank.html` has no high findings.

### 8. Low/Medium - Measurement-delay visualization is internally inconsistent

Evidence:

- The controller uses delayed `state.m` when `delaySeconds > 0` (lines 2478-2487).
- The delayed measured marker is drawn at `state.m` (lines 2404-2412).
- The "level sensor" beam still points at the real water surface `waterTop`, not the delayed measured level (lines 2399-2402).
- Text says the controller reacts to the amber measured marker instead of the real float (lines 804-805).

Why this is confusing:

If the sensor beam is the measured signal path, it should align with what the controller receives, or the UI should clearly separate "real sensor sees current water" from "controller receives delayed signal".

Fix:

- In delay mode, either point the signal/beam used by the controller to `measuredY`, or draw two clearly distinct elements: real physical water level and delayed controller input.
- Keep the controller error display based on `s - m`.

Acceptance test:

- In delay mode, a user can visually identify which level the controller is using.

### 9. Low - Units are implicit

Evidence:

- Readouts show `Inflow` and `Outflow` as bare decimals (lines 625-630, 2234-2235).
- Constants are normalized rates, not SI volumetric flows.

Why this matters:

The math is acceptable if all flows mean "tank-height fraction per second" after absorbing tank area into the constants. It is less clear if the UI calls them physical flow rates.

Fix:

- Label readouts as normalized rates, for example `Inflow (tank/s)` and `Outflow (tank/s)`, or add a short explanation in the document/tooltip if the app has one.

Acceptance test:

- The UI no longer implies SI flow units where none exist.

## Preferred Fix Plan For The Implementing Agent

This section removes the remaining product/design ambiguity. Use these choices unless they conflict with a newer user instruction. The aim is to preserve the current single-file app and visual metaphor while making the physics/control behavior correct enough for an educational negative-feedback simulation.

1. Keep one automatic feedback mode. Do not implement new Manual Override or Add Water controls in this pass.

- Remove or rewrite investigation prompts `inv5` and `inv6` so they no longer mention unavailable controls.
- Keep the existing click-and-hold valve forcing only as a hidden/direct manipulation affordance if desired, but do not call it "Manual Override" or "feedback broken" unless a real mode is implemented.

2. Use the current normalized units, but label them.

- Treat `h`, `s`, and `m` as fractions of usable tank height.
- Treat `qIn`, `qOut`, `qLeak`, and `qControlOut` as normalized tank-height fractions per second.
- Rename readout labels to `Inflow (tank/s)` and `Outflow (tank/s)` in English, with equivalent Polish labels.

3. Make the default reset state a true equilibrium.

- Use zero disturbance as the default: `DEF_LEAK = 0`.
- Set `DEF_BALANCE = 0`.
- At reset, set `state.integral = 0`, `state.balance = 0`, `state.uIn = 0`, `state.uOut = 0`, `state.qIn = 0`, `state.qLeak = 0`, `state.qControlOut = 0`, and `state.qOut = 0`.
- The initial readouts should show target 60%, actual 60%, measured 60%, error 0%, control balance 0%, inlet valve 0%, drain valve 0%, inflow 0.00, outflow 0.00.

4. Replace the leak discontinuity with continuous leak physics.

```text
dh/dt = q_in - q_leak - q_control_out
q_in = Q_IN_MAX * u_in
q_leak = Q_LEAK_MAX * leak * sqrt(h)
q_control_out = Q_CONTROL_DRAIN * u_out * sqrt(h)
```

Do not keep the current `Q_BASE` jump for the slider-controlled leak. Either remove `Q_BASE` or leave it unused only if the code-review gate permits it. The preferred implementation is to delete `Q_BASE`.

5. Replace pure integral control with PI control.

Add `state.integral`, and make `state.balance` the final signed command:

```text
error = s - m
state.integral = clamp(state.integral + Ki * error * dt, -1, 1)
rawCommand = Kp * error + state.integral
state.balance = clamp(rawCommand, -1, 1)
u_in = clamp(state.balance, 0, 1)
u_out = clamp(-state.balance, 0, 1)
```

Use simple conditional anti-windup:

```text
candidateIntegral = state.integral + Ki * error * dt
candidateCommand = Kp * error + candidateIntegral
if candidateCommand is inside [-1, 1], accept candidateIntegral
else if candidateCommand > 1 and error < 0, accept candidateIntegral
else if candidateCommand < -1 and error > 0, accept candidateIntegral
else keep the previous integral
```

This prevents the integral term from winding farther into saturation while still allowing it to unwind.

6. Map the existing Response Strength slider to deterministic gains.

Keep the slider range and displayed value as currently implemented: slider 4..40 maps to response `R = value / 10`, so `R` is 0.4..4.0 and default is 1.6.

Use these starting gains:

```text
Kp = 0.60 * R
Ki = 0.28 * R
```

At default `R = 1.6`, this gives:

```text
Kp = 0.96
Ki = 0.448
```

Rationale: proportional action adds real damping to the double-integrator-like zero-leak case, while integral action remains strong enough to remove steady-state error under leak. If tuning is needed after implementation, change only the numeric multipliers and preserve the PI structure.

7. Keep the existing delay buffer, but make the visualization internally consistent.

- Continue computing control error from `s - m`.
- In delay mode, draw the amber measured marker at `m`.
- Also point the signal/beam that represents the value received by the controller to `measuredY`, or draw a second clearly distinct real-water marker/beam. Preferred minimal fix: in delay mode set the controller-facing water beam endpoint to `measuredY`; in no-delay mode keep it at `waterTop`.

8. Update copy to match the PI model.

- Replace "rocker" phrasing if no visible rocker exists.
- Explain that response strength changes how strongly the controller reacts to error.
- Explain that under a steady leak, the controller learns/accumulates a small fill command to balance the leak.
- Keep delay copy only for delay-specific oscillations; for no-delay oscillation, mention excessive response/underdamping.

9. Fix the missing leak renderer.

- Define `renderDrips` in the HTML, or replace the drip rendering with simpler inline SVG updates.
- The chosen fix must not throw when leak is nonzero.

10. Remove dead constants and pass the project gate.

- Delete unused constants such as `IN_VALVE_CX`, `IN_STEM_TOP`, `OUT_VALVE_CX`, and `OUT_STEM_TOP` unless they become used.
- Run `npm run code-review -- feedbacktank.html`.
- Format as required by the code-review output.

## Deterministic Acceptance Tests

The fixing agent should verify these against `feedbacktank.html` after implementation. Automated tests are not required, but the behavior must be reproducible by running the same equations or using the app.

1. Default equilibrium:

- Reset the app.
- With target 60%, leak 0%, response 1.6, delay 0.0 s, simulate/run for 30 s.
- Required: actual level stays within 59.5%..60.5%, inlet valve stays at 0%, drain valve stays at 0%, inflow and outflow remain 0.00.

2. Target step without delay:

- Reset, then set target from 60% to 75%.
- Required: fill command becomes positive immediately on the next simulation update.
- Required: actual level reaches 74%..76% and remains inside that band after settling.
- Required: no persistent oscillation larger than +/-2% after 45 s.

3. Leak rejection:

- Reset, then set leak disturbance to 50%, target 60%, response 1.6, delay 0.0 s.
- Expected steady fill command from the continuous leak model is approximately:

```text
u_in_star = (Q_LEAK_MAX * 0.5 * sqrt(0.6)) / Q_IN_MAX
          = (0.42 * 0.5 * 0.7746) / 0.92
          ~= 0.177
```

- Required: after settling, actual level is 59%..61%, inlet valve is roughly 15%..21%, and drain valve is 0%.

4. Add/remove water equivalent:

- If no Add Water button is implemented, this can be tested by temporarily perturbing `state.h` in the console or by using any existing direct disturbance path.
- With leak 0%, delay 0.0 s, response 1.6, and target 60%, set actual level to 65%.
- Required: drain command becomes positive, then level returns to 59%..61% without persistent oscillation larger than +/-2%.

5. Delay behavior:

- Reset, set response high, for example 3.2, set delay to 2.0 s, then make a target step.
- Required: amber measured marker visibly lags actual water level.
- Required: if oscillation appears, the status text attributes it to delay/lag only when `delaySeconds > 0`.

6. Nonzero leak rendering:

- Set leak to 1%, 50%, and 100%.
- Required: no console `ReferenceError`, no stopped animation, and no `renderDrips` undefined error.

7. Investigation prompts:

- Read every investigation card.
- Required: each prompt references only controls/actions that exist in the current UI.

8. Code-review gate:

- Run `npm run code-review -- feedbacktank.html`.
- Required: no high findings. Preferred: no findings.

## Verification Checklist

Run these after implementation:

- `npm run code-review -- feedbacktank.html`
- Browser/manual checks:
  - Reset at default holds 60% for at least 30 s.
  - Leak 50%, delay 0 settles near the target with a nonzero fill command.
  - Target step 60% -> 75% rises and settles without persistent no-delay oscillation.
  - Delay 2.0 s visibly separates actual and measured levels, and high response can wobble for delay-specific reasons.
  - Leak slider > 0 produces no console error.
  - Every investigation card maps to an actual control.
