# Scientific Review of `feedbacktank.html` (PID / Physics / Maths)

## Scope

- This review was produced from `feedbacktank.html` only.
- Existing Markdown files in the repo were intentionally ignored because the user marked them as out of date.
- Focus is on the PID controller and the plant model it controls.

## Executive Summary

The core tank model is mostly sound:

- The plant uses a standard mass-balance idea: level changes from inflow minus outflow.
- Gravity-driven outflow proportional to `sqrt(h)` is physically defensible for an idealized orifice discharge model.
- The controller is a defensible parallel-form PID variant:
  - `P` on error
  - `I` on error
  - `D` on measured level, with the correct sign to oppose rapid level change
- The measurement delay implementation is broadly correct for a discrete-time dead-time buffer.

The main scientific/control problem is not the basic PID formula. It is that the anti-windup logic only handles scalar output saturation and does **not** handle cases where the actual actuator state differs from the controller command:

- forced inlet valve
- forced drain valve
- top-level overflow/clamping

That makes the controller integrate against the wrong actuator reality. In control terms, the controller output and plant input are decoupled, but the integrator is not tracking the real actuator state.

There is also one clear physics consistency issue:

- overflow is visualized, but not included in the mass balance or readouts as an explicit flow term

## Governing Equations Actually Implemented

Relevant code:

- Constants: `feedbacktank.html:846-854`
- State defaults: `feedbacktank.html:882-920`
- Main simulation step: `feedbacktank.html:3236-3285`

Implemented normalized state variables:

- `h` = actual tank level in `[0, 1]`
- `s` = setpoint in `[0.15, 0.85]`
- `m` = measured level
- `tau = delaySeconds`

Implemented delayed measurement:

`m(t) = h(t - tau)` using a finite discrete buffer.

Implemented controller:

`e = s - m`

`P = Kp * e`

`I_candidate = I + Ki * e * dt`

`D = -Kd * (m - m_prev) / dt`

`balance = clamp(P + I + D, -1, 1)`

Implemented split-range actuation:

- `uIn = max(0, balance)` unless inlet is forcibly held open
- `uOut = max(0, -balance)` unless drain is forcibly held open
- manual disturbance drain is separate: `uManual`

Implemented plant:

`qIn = Q_IN_MAX * uIn`

`qLeak = Q_LEAK_MAX * uManual * sqrt(h)`

`qControlOut = Q_CONTROL_DRAIN * uOut * sqrt(h)`

`qOut = qLeak + qControlOut`

`h_next = clamp(h + (qIn - qOut) * dt, 0, 1)`

So for `0 < h < 1`, the model is:

`dh/dt = Q_IN_MAX*uIn - sqrt(h)*(Q_LEAK_MAX*uManual + Q_CONTROL_DRAIN*uOut)`

with:

- `Q_IN_MAX = 0.92`
- `Q_LEAK_MAX = 0.42`
- `Q_CONTROL_DRAIN = 0.56`
- `dt = 1/120 s`

## What Is Scientifically Defensible and Should Not Be “Fixed Away”

### 1. The `sqrt(h)` outflow law is reasonable

Relevant code:

- `feedbacktank.html:3277-3280`
- explanatory text at `feedbacktank.html:1010-1013`

For a tank draining through an opening under gravity, Torricelli’s theorem gives efflux speed proportional to `sqrt(h)`. If discharge area and coefficients are absorbed into constants, then volumetric outflow is proportional to `sqrt(h)`. That is consistent with the code.

### 2. Constant inflow is a valid idealization

Relevant code:

- `feedbacktank.html:3277`
- explanatory text at `feedbacktank.html:1011-1013`

Treating the inlet as externally pressurized and approximately independent of tank level is a valid simplified teaching model.

### 3. The derivative sign is correct

Relevant code:

- `feedbacktank.html:3255-3256`

Because `D = -Kd * dm/dt`, a rapidly rising measured level produces a negative D term and a rapidly falling measured level produces a positive D term. That opposes motion in the measured variable, which is the correct damping sign.

### 4. Derivative-on-measurement is a legitimate PID choice

Relevant code:

- `feedbacktank.html:3255-3256`

This is not the classical “differentiate the full error” form. It is a standard practical choice used to avoid derivative kick on setpoint changes. Do **not** change this just because it differs from the textbook `de/dt` form.

## Positive Numerical Cross-Check

Using the exact equations extracted from the file:

- At reset (`h = s = 0.6`, no leak), the equilibrium is correct: both valves can remain shut and `dh/dt = 0`.
- With manual leak slider at 100% and default gains, steady-state should satisfy:
  - `qIn = qLeak`
  - `0.92*uIn = 0.42*sqrt(0.6)`
  - `uIn ≈ 0.3536`
- The implemented model converges to a control balance of about `0.3536`, which matches the equilibrium calculation.

This is strong evidence that the **basic** tank physics plus PI regulation are internally consistent.

## Findings That Require Changes

## Finding 1: Anti-windup is incomplete when the actual actuator state is overridden

Severity: High

Relevant code:

- conditional integration: `feedbacktank.html:3253-3269`
- forced actuator overrides: `feedbacktank.html:3273-3276`
- pointer forcing of valves: `feedbacktank.html:3474-3504`

### Why this is wrong

The current anti-windup logic only considers whether the scalar controller command would saturate outside `[-1, 1]`.

That is not enough here, because the plant input can differ from the controller output in several cases:

- `inletForced = true`
- `drainForced = true`
- both a forced valve and the opposite controller valve can be active simultaneously
- overflow can pin the level at the upper bound

In those cases, the controller is no longer “seeing” the actuator that the plant actually receives, but the integrator still updates as if it were.

This is exactly the control scenario where simple clamping is insufficient. The controller either needs actuator tracking/back-calculation, or it needs to suspend integral accumulation while manual override breaks the normal actuator path.

### Why this matters in this app

This is not a subtle theory issue. It produces visible, artificial transients.

Local reproduction from the extracted equations:

- Hold the drain valve forced open for `3 s`, with `delay = 1.0 s`
- The level can fall from `0.6` to about `0.168`
- After release, the same model can overshoot all the way to `1.0`
- The integral term grows to about `0.37` while the forced actuator is active

That behavior is dominated by controller/actuator mismatch, not by the intended PID teaching point.

### Required fix

Keep the current controller architecture, but make the integrator aware of manual override.

Recommended implementation target:

1. Preserve the current normal-mode PID law for ordinary operation.
2. When `inletForced` or `drainForced` is true, stop integrating the PID error.
3. Keep `P` and `D` live if you want the opposite valve to remain responsive, but do not allow `I` to wind up while a valve is manually overridden.
4. If you want a more complete fix, replace the freeze with actuator tracking/back-calculation using the **actual applied actuator state**, not the requested scalar `balance`.

For this app, option 2 is the simplest robust fix.

### Important implementation note

Do **not** freeze integral when the disturbance slider (`leak`) is used. The manual drain slider is a plant disturbance, not an actuator override. Integral action should remain active for disturbance rejection.

### Acceptance criteria

- While a valve is held open by pointer, `I` must not continue accumulating in the direction that the override prevents the controller from realizing normally.
- Releasing a forced valve should no longer create large artificial integral-driven rebounds.
- Disturbance rejection through the manual drain slider must still work.

## Finding 2: Overflow is visual only; the mass balance is incomplete at the top boundary

Severity: Medium

Relevant code:

- overflow visualization only: `feedbacktank.html:3222-3233`
- actual state update: `feedbacktank.html:3277-3282`

### Why this is wrong

The app visualizes overflow when `h >= 0.995` and `qIn > qOut`, but the simulation does not introduce an explicit overflow flow term.

Instead, the level is just clamped:

- `h_next = clamp(...)`

This means that at the full-tank boundary:

- the displayed inflow can exceed the displayed outflow
- the level still does not rise
- the missing flow is not accounted for anywhere in the readouts

That breaks explicit conservation in the user-facing model.

### Required fix

Add:

- `qOverflow`

and make the boundary condition explicit.

Recommended implementation target:

1. Compute raw net flow before the level clamp.
2. If the tank is at the top boundary and raw net flow is positive, route the excess into `qOverflow`.
3. Define total outflow as:
   - `qOutTotal = qLeak + qControlOut + qOverflow`
4. Use the same `qOverflow` for both:
   - the overflow stream visualization
   - the readouts / any exposed flow quantity

### Acceptance criteria

- Whenever the tank is visually overflowing and the level is pinned, total displayed outflow must balance inflow.
- Overflow should no longer be only a visual effect.

## Finding 3: One investigation sentence is scientifically inconsistent with the implemented control logic

Severity: Medium

Relevant text:

- `feedbacktank.html:996`
- status text says the opposite at `feedbacktank.html:975-977`

### Why this is wrong

The investigation text says:

- “Watch how the level reacts without feedback control.”

But the implementation does **not** disable feedback control when a valve is held open. The controller still runs, and the opposite valve can still move.

That statement is therefore false under the current model.

### Required fix

Pick one consistent behavior and update both code and text accordingly.

Recommended path:

- Keep the current intended behavior described elsewhere: manual hold forces one valve open, but the controller still runs.
- Update the investigation text so it no longer says “without feedback control.”

Suggested wording concept:

- “Click and hold a valve to force it fully open. Watch how the controller responds when one actuator is manually overridden.”

If instead you want a true open-loop/manual mode, then the code must disable controller action while the valve is held. At the moment it does not.

## Finding 4: The PID math is under-explained for an educational app

Severity: Low but worthwhile

Relevant code:

- gains and sliders: `feedbacktank.html:619-666`, `feedbacktank.html:3343-3358`
- controller math: `feedbacktank.html:3250-3269`

### Why this matters

The implemented controller is not “generic PID” in the vague sense users assume.

It is specifically:

- parallel gain form (`Kp`, `Ki`, `Kd` used directly)
- derivative on measured level
- conditional integration anti-windup
- split-range output to two one-sided valves

That is scientifically fine, but the app currently does not explain it.

Also, since time is in seconds (`delay` is shown in seconds and `dt = 1/120 s`), the gains do not all share the same physical units:

- `Kp` is dimensionless in this normalized model
- `Ki` has units of `1/s`
- `Kd` has units of `s`

Displaying all three as bare unitless numbers makes the implemented equation harder to interpret correctly.

### Recommended fix

Add a compact “implemented controller” note somewhere near the controls or readouts. It only needs to say:

- `e = setpoint - measured`
- `u = Kp*e + I - Kd * d(measured)/dt`
- `I += Ki*e*dt` when not blocked by anti-windup
- positive `u` opens fill, negative `u` opens drain

Also explicitly note:

- the D term acts on the measured level, not on the setpoint step

This is a documentation/scientific-clarity fix, not a change in controller law.

## Finding 5: The derivative term is unfiltered

Severity: Low / optional, depending on product goal

Relevant code:

- `feedbacktank.html:3255-3256`

### Assessment

The current D term is a raw backward difference:

- `D = -Kd * (m - prevM) / dt`

For this app’s noiseless simulation state, that is mathematically acceptable.

However, practical PID implementations usually filter the derivative term. If the app wants to teach “real-world PID” rather than “idealized PID,” adding a first-order derivative filter would make it more realistic.

### Recommendation

This is optional. It is **not** the highest-priority scientific issue.

If you change it:

- add a derivative filter state
- keep derivative on measurement
- update any explanatory text so the controller description remains accurate

## Recommended Patch Order

1. Fix manual-override anti-windup behavior.
2. Fix overflow as an explicit flow term.
3. Fix the inconsistent investigation copy.
4. Add a compact controller-equation explanation.
5. Only then consider filtered derivative as an enhancement.

## Acceptance Test Plan

These checks should pass after the fixes.

### Test A: Baseline equilibrium

- Reset app.
- Expect:
  - `h = s = m = 0.6`
  - inlet and drain valves effectively shut
  - `qIn = 0`, `qOut = 0`
  - level stays constant

### Test B: Disturbance rejection still works

- Set manual drain slider to `100%`.
- Leave default gains.
- Expect:
  - level initially falls
  - controller opens inlet
  - level returns near setpoint
  - steady-state inlet opening is about `0.354` at `h = 0.6`

### Test C: Forced drain should not wind up the integrator

- Start from reset.
- Hold drain valve open for `3 s`.
- Release.
- Expect:
  - `I` does not build up aggressively during the forced-hold interval
  - post-release rebound is materially smaller than in the current build
  - response looks like a controlled recovery, not an integrator-induced slingshot

### Test D: Forced inlet should not wind up the integrator

- Start from reset.
- Hold inlet valve open for `3 s`.
- Release.
- Expect:
  - no large hidden negative integral buildup
  - recovery is smoother than the current version

### Test E: Overflow conservation

- Force inlet open near full tank.
- Expect:
  - if the level remains pinned at the top, an explicit overflow flow accounts for the excess
  - displayed total outflow matches the physics implied by the constant top level

## Primary Sources Used

1. OpenStax, *College Physics for AP Courses 2e*, section “12.3 The Most General Applications of Bernoulli’s Equation / Torricelli’s Theorem”:
   - https://openstax.org/books/college-physics-ap-courses-2e/pages/12-3-the-most-general-applications-of-bernoullis-equation
   - Used for the `v ∝ sqrt(h)` outflow basis.

2. MathWorks, *Proportional-Integral-Derivative (PID) Controllers*:
   - https://www.mathworks.com/help/control/ug/proportional-integral-derivative-pid-controllers.html
   - Used for the parallel PID form and gain interpretation.

3. MathWorks, *Two Degree-of-Freedom PID Control for Setpoint Tracking*:
   - https://www.mathworks.com/help/simulink/slref/two-degree-of-freedom-pid-control-for-setpoint-tracking.html
   - Used to confirm that derivative acting on the measured output is a standard choice to avoid derivative kick.

4. MathWorks, *Anti-Windup Control Using PID Controller Block*:
   - https://www.mathworks.com/help/simulink/slref/anti-windup-control-using-a-pid-controller.html
   - Used for the distinction between simple clamping and cases where actuator tracking is required because the controller output is not the only signal feeding the actuator.

## Bottom Line

If another agent is asked to “fix the science” in `feedbacktank.html`, the key instruction is:

- keep the tank model and derivative sign
- keep derivative on measurement
- fix manual-override anti-windup
- make overflow part of the actual flow accounting
- align the explanatory text with the real closed-loop behavior

Those are the changes that matter most for scientific correctness.
