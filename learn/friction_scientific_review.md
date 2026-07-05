# Scientific Review of `friction.html`

Reviewed on 2026-04-22.

Scope:
- I reviewed `friction.html` only, per request.
- I did not use any `.md` files in the repo.
- This document is written to be sufficient for a follow-up agent to fix the scientific issues without needing separate notes.

## Executive Verdict

The core incline-plane model in `friction.html` is mostly the standard introductory Coulomb-friction model, and the main force equations are correct:

- `N = mg cos(theta)`
- `F_parallel = mg sin(theta)`
- `F_s,max = mu_s N`
- `F_k = mu_k N`
- `a = g (sin(theta) - mu_k cos(theta))` once the block is sliding
- `theta_slip = atan(mu_s)` for quasistatic onset of slipping

Those are implemented in:
- `computeForces(...)` at `friction.html:1115-1124`
- `computeAccel(...)` at `friction.html:1133-1136`
- `computeSlipAngle(...)` at `friction.html:1138-1140`

The scientific problems are not in the basic decomposition of forces. They are mainly in:

1. Motion readouts that ignore the brick’s actual position and velocity.
2. A systematic mismatch between the displayed theoretical slip angle and the simulator’s actual onset of sliding.
3. Ambiguous/hypothetical use of kinetic-friction quantities before motion actually starts.
4. Material coefficients being shown as overly precise facts even though the file itself only frames them as approximate teaching values.

## Reconstructed Model From `friction.html`

Constants:
- `G = 9.81 m/s^2` at `friction.html:845`
- `M = 1.0 kg` at `friction.html:846`
- Ramp travel distance `L = 4.0 m` at `friction.html:847`
- Slip classification tolerance `TOLERANCE = 0.05 N` at `friction.html:850`

Static/kinetic regime logic:
- `classifyState(Fpar, FsMax)` returns:
  - `"sliding"` when `Fpar > FsMax + TOLERANCE`
  - `"threshold"` when `|Fpar - FsMax| <= TOLERANCE`
  - `"stuck"` otherwise
- This is at `friction.html:1127-1130`

Motion model:
- When sliding starts, acceleration is frozen as `computeAccel(state.angleDeg, state.muK)` at `friction.html:2252`
- Position and velocity are numerically integrated in `simStep(dt)` at `friction.html:2499-2510`

Displayed kinematics:
- `computeTimeToBottom(a)` uses `sqrt(2L/a)` at `friction.html:1142-1145`
- `computeBottomSpeed(a)` uses `sqrt(2aL)` at `friction.html:1147-1149`

This is only correct for:
- constant acceleration,
- starting from rest,
- over the full ramp distance `L`,
- from the current top/start position.

The app, however, allows the brick to be dragged anywhere on the ramp (`friction.html:2429-2437`), and it also shows these same motion readouts while the brick may already be partway down or already at the bottom.

## Findings

### 1. High Severity: Time-to-bottom and bottom-speed math is wrong whenever the brick is not starting from rest at the top

Relevant code:
- `L = 4.0` at `friction.html:847`
- `computeTimeToBottom(a)` at `friction.html:1142-1145`
- `computeBottomSpeed(a)` at `friction.html:1147-1149`
- Readout usage at `friction.html:2108-2114`
- Speed-chart scaling at `friction.html:1998-2001`
- Brick dragging at `friction.html:2429-2437`

Why this is wrong:
- The formulas `t = sqrt(2L/a)` and `v = sqrt(2aL)` assume:
  - initial speed `v0 = 0`
  - travel distance `s = L`
- In this app, both assumptions are often false:
  - the user can drag the brick to an arbitrary `state.posAlongRamp`
  - the brick can already be moving (`state.velocity > 0`)
  - the brick can already be at the bottom (`state.posAlongRamp = L`)

Consequences:
- `Speed At Bottom` and `Time To Bottom` are only correct at the instant of release from the very top with zero speed.
- They become scientifically wrong if the brick starts from the middle, is already sliding, or is already at the bottom.
- The speed chart’s full-scale label is also wrong for the same reason because it uses the same full-length prediction.

Concrete example:
- With `wood|wood`, `mu_k = 0.25`, at `30°`, the app’s acceleration is:
  - `a = 9.81 * (sin 30° - 0.25 cos 30°) ≈ 2.7811 m/s^2`
- From the full 4.0 m top-to-bottom run:
  - `t ≈ 1.696 s`
  - `v ≈ 4.717 m/s`
- From halfway down the ramp (remaining distance `2.0 m`) starting from rest:
  - `t ≈ 1.199 s`
  - `v ≈ 3.335 m/s`

Current behavior still reports the full-run values, which is wrong by about a factor of `sqrt(2)` in that case.

Required fix:
- Replace the full-length formulas with state-aware formulas using:
  - `s_remaining = max(0, L - state.posAlongRamp)`
- If the readout is meant to be “from the current state”, use:
  - `v_bottom = sqrt(max(0, v0^2 + 2 a s_remaining))`
  - `t_bottom = (-v0 + sqrt(max(0, v0^2 + 2 a s_remaining))) / a` when `a > 0`
- Here `v0` should be the current along-ramp speed (`state.velocity`) if already sliding, otherwise `0`.

Acceptance checks:
- Drag the brick halfway down the ramp and hold angle/materials fixed:
  - `Time To Bottom` and `Speed At Bottom` must decrease to the correct remaining-distance values.
- Put the brick at the bottom:
  - either show `0 s` and `0 m/s`, or show a clear non-applicable state such as `—`
  - do not show full-run values
- While the brick is sliding mid-ramp:
  - the predicted bottom values must use current `state.velocity` and remaining distance, not a fresh start from rest

### 2. High Severity: The displayed slip angle and the actual onset of sliding do not use the same criterion

Relevant code:
- `TOLERANCE = 0.05` at `friction.html:850`
- `classifyState(...)` at `friction.html:1127-1130`
- `computeSlipAngle(muS)` at `friction.html:1138-1140`
- Angle slider uses integer steps at `friction.html:714-721`
- Angle change rounds to whole degrees at `friction.html:2442`

Why this is wrong:
- The displayed “Slip Angle” uses the continuous theoretical formula:
  - `theta_slip = atan(mu_s)`
- But actual simulation onset uses a different rule:
  - integer-degree angle control
  - plus an extra force threshold `F_parallel > F_s,max + 0.05 N`

That means the simulator’s actual slip onset is systematically later than the displayed theoretical slip angle.

Concrete example:
- Default pair `wood|wood` uses `mu_s = 0.40` (`friction.html:901`)
- Displayed theoretical slip angle:
  - `atan(0.40) ≈ 21.80°`
- At `22°`:
  - `F_parallel ≈ 3.675 N`
  - `F_s,max ≈ 3.638 N`
  - difference `≈ 0.037 N`
  - this is below the extra `0.05 N` tolerance, so the app does **not** classify it as sliding
- At `23°`:
  - difference `≈ 0.221 N`
  - now it does slide

So the app teaches “slip angle = 21.8°” while the simulation actually waits until `23°`.

This is not isolated to one pair. With the current coefficient table, the onset delay is typically about `0.7°` to `1.3°`.

Required fix:
- Use one consistent rule for both:
  - either make the simulation onset match the theoretical continuous criterion
  - or make the displayed slip angle reflect the simulator’s discrete criterion
- Best fix:
  - keep internal angle as a float
  - remove the arbitrary `0.05 N` physical tolerance from the physics decision
  - use only a very small numerical epsilon if needed
- If integer-degree UI is retained, explicitly display a second value such as:
  - “Predicted slip angle”
  - “Simulator slip angle”

Acceptance checks:
- For `wood|wood`, the displayed slip angle and the actual onset should agree within the chosen UI resolution.
- If the UI remains 1°-quantized, the app should not imply 0.1° predictive accuracy.

### 3. Medium Severity: The app shows kinetic-friction behavior in some states before the brick is actually sliding

Relevant code:
- Force-arrow logic at `friction.html:1750-1755`
- Force-chart regime logic at `friction.html:1879-1919`
- Readout logic at `friction.html:2091-2114`
- Auto-slide trigger at `friction.html:2243-2259`
- Drag suppression of auto-slide via `if (dragInfo) return;` at `friction.html:2243-2244`

Why this is scientifically ambiguous:
- While the user is still dragging the ramp, the app can be in a state where:
  - the block is not yet moving,
  - but `classifyState(...) === "sliding"`
  - and auto-slide is temporarily suppressed because dragging is active
- In that state, the board friction arrow uses `F_k`, and the chart also switches to the kinetic-friction emphasis.

That mixes:
- the current physical state (block not yet moving),
- with the hypothetical post-release state (block would slide if released).

That is not clearly labeled, so it is easy for a learner to read it as “kinetic friction is acting now” even before motion starts.

Required fix:
- Separate “actual current state” from “predicted-on-release state”.
- Use kinetic friction only when `state.mode === "sliding"`.
- If you want predictive values before release, label them explicitly as hypothetical, e.g.:
  - “If released now”
  - “Predicted after release”

Acceptance checks:
- While still dragging the ramp above the threshold, the visuals should not imply that kinetic friction is already acting unless the UI says it is predictive/hypothetical.

### 4. Medium Severity: The coefficient table is scientifically under-specified and displayed with false precision

Relevant code:
- Coefficient table at `friction.html:873-902`
- Approximation note at `friction.html:816-821`
- Coefficients shown to two decimals at `friction.html:2074-2075`
- Slip angle shown to one decimal at `friction.html:2077-2079`

Why this matters:
- The file correctly notes that these are “approximate teaching values”.
- But the UI then presents them as exact pair constants and derives a precise slip angle from them.
- That presentation is stronger than the underlying science supports.

Important nuance:
- Using a simplified Coulomb-friction model is fine for a teaching simulation.
- The problem is not “you must model full tribology”.
- The problem is presenting unsourced, condition-free values with more precision than they deserve.

Recommended fix:
- Keep the teaching model, but make the epistemic status honest.
- At minimum do one of these:
  - state the assumed conditions, e.g. “dry / clean / room-temperature teaching values”
  - cite the source family used for the table
  - reduce displayed precision
  - use ranges where appropriate
  - if using a textbook-style table, align overlapping pairs to one consistent published table

Practical UI change:
- Consider displaying:
  - `mu_s ≈ 0.4`
  - `mu_k ≈ 0.25`
  - `Predicted slip angle ≈ 22°`
- That is more scientifically honest than `0.40`, `0.25`, and `21.8°` without provenance/conditions.

### 5. Low Severity: The force chart clips at least one valid force curve

Relevant code:
- Fixed y-scaling `ty(n) = pad.top + ph - (n / 10) * ph` at `friction.html:1837-1839`
- Axis labels hard-coded `0..10 N` at `friction.html:1849-1866`

Why this is wrong:
- With `M = 1 kg`, the maximum possible static-friction curve value at `0°` is `mu_s * mg`.
- For `rubber|rubber`, `mu_s = 1.1` (`friction.html:892`), so:
  - `F_s,max = 1.1 * 9.81 ≈ 10.79 N`
- The chart only goes to `10 N`, so it clips part of that curve.

Required fix:
- Set chart y-max dynamically from the maximum of:
  - `mg sin(60°)`
  - `mu_s mg`
  - `mu_k mg`
- Or at least raise the fixed maximum above `10.79 N`.

## What Is Scientifically Solid

These parts are fine under the intended simplified model:

- Force decomposition on the incline:
  - `friction.html:1115-1124`
- Kinetic-acceleration formula after the block is sliding:
  - `friction.html:1133-1136`
- Static slip-angle formula under the Coulomb model:
  - `friction.html:1138-1140`
- The general idea that static friction is responsive up to a maximum:
  - implemented in readouts as actual friction matching `F_parallel` when stuck/threshold at `friction.html:2091-2095`

## External Sources Used

These sources were used to validate the physics model and the limits of the coefficient table:

1. OpenStax, *Physics*, “5.4 Inclined Planes”
   - https://openstax.org/books/physics/pages/5-4-inclined-planes
   - Confirms the standard incline-plane decomposition:
     - `mg sin(theta)` parallel to the plane
     - `mg cos(theta)` perpendicular to the plane
   - Confirms static vs kinetic friction treatment.

2. OpenStax, *College Physics 2e*, “5.1 Friction”
   - https://openstax.org/books/college-physics-2e/pages/5-1-friction
   - Confirms:
     - `f_s <= mu_s N`
     - `f_s,max = mu_s N`
     - `f_k = mu_k N`
   - Provides a standard intro-physics table of approximate coefficients for some overlapping material pairs.

3. Ben-David and Fineberg, “Static Friction Coefficient Is Not a Material Constant,” *Physical Review Letters* 106, 254301 (2011)
   - DOI: https://doi.org/10.1103/PhysRevLett.106.254301
   - Supports the review conclusion that exact static-friction coefficients should not be presented as immutable material constants without conditions/provenance.

4. Allan Mills, “The coefficient of friction, particularly of ice,” *Physics Education* 43(4), 392 (2008)
   - DOI: https://doi.org/10.1088/0031-9120/43/4/006
   - Supports the point that friction involving ice is especially condition-sensitive.

## Recommended Fix Order

1. Fix the motion readouts and speed-chart math to use current position and velocity.
2. Unify the displayed slip-angle logic with the actual onset logic.
3. Cleanly separate actual current-state friction from predicted post-release motion.
4. Reduce false precision and add provenance/condition framing for coefficient values.
5. Make the force chart y-axis large enough for all configured pairs.

## Post-Fix Validation Checklist

- `wood|wood`, brick at top, `20°`:
  - stuck
  - actual friction equals downhill component
  - acceleration `0`
- `wood|wood`, brick at top, onset angle:
  - displayed slip angle matches actual onset within the app’s stated resolution
- `wood|wood`, `30°`, brick halfway down:
  - motion readouts use remaining distance, not full `4.0 m`
- Any pair, brick at bottom:
  - no nonzero “time to bottom” from a zero remaining distance
- `rubber|rubber`, low angle:
  - force chart does not clip the static-friction curve

