# Scientific Review of `flipandburn/index.html`

Date: 2026-05-01

Scope: this review is based only on `flipandburn/index.html`, per request. I did not use the older local Markdown documents.

## Bottom line

The planetary ephemeris side is reasonably sound for a simplified teaching model, and the first-leg launch solver is mathematically consistent with the app's stated "straight-line constant-acceleration" assumption.

The new player-controlled second burn is not scientifically correct in its current form.

The deceleration leg currently mixes incompatible models:

- the player commits a braking acceleration `a2`,
- the solver finds a future intercept using `D(T) = a2 T^2 / 4`,
- the actual ship animation then uses a different kinematic relation based on `vPeak`,
- and the planet clock is rescaled during deceleration to force a rendezvous.

That makes the second burn, miss logic, arrival time, and some HUD values physically unreliable even within the app's own simplified straight-line model.

## What is already scientifically sound

1. Planet positions are based on Astronomy Engine heliocentric vectors rotated into the ecliptic plane (`flipandburn/index.html:1383-1403`). For a 2D teaching model, that is a reasonable basis.
2. The acceleration conversion constant is correct: `1 g = 65283.465095 AU/yr^2` (`flipandburn/index.html:932`). I rechecked the unit conversion independently.
3. The first-leg reference solve is correct for the stated simplified model:
   - launch from `r0`,
   - aim at a future destination point `rd(t0 + T)`,
   - accelerate half the trip and decelerate half the trip with equal magnitude,
   - therefore `L = a T^2 / 4`.
   This is exactly what `computeFlipBurnRef()` solves in `flipandburn/index.html:1575-1657`.

## Findings

### 1. The second-leg solver uses the wrong equation and ignores the ship's current speed

Severity: critical

Code:

- `flipandburn/index.html:1659-1730`
- especially `flipandburn/index.html:1680-1685`

Problem:

- `solveDecelIntercept(flipPos, vPeak, a2, ...)` accepts `vPeak`, but the root function never uses it.
- The code solves `D(T2) = a2 T2^2 / 4`.
- That is the rest-to-rest symmetric transfer formula from the first leg, not the formula for a braking leg that starts with nonzero speed `vPeak`.

For a deceleration leg that starts at speed `vPeak` and ends at zero speed under constant braking `a2`, the correct 1D kinematics are:

- `v(t) = vPeak - a2 t`
- `s(t) = vPeak t - 0.5 a2 t^2`
- stopping time: `T_stop = vPeak / a2`
- stopping distance: `L_stop = vPeak^2 / (2 a2)`

If you insist on solving for a future moving-target intercept while braking, the unknown-time equation must depend on `vPeak`. The current equation does not, so it cannot be physically correct.

Concrete counterexample:

- Assume a stationary target 1 AU away.
- Assume `vPeak = 2 AU/yr`.
- To stop exactly at the target, the correct braking acceleration is `a2 = vPeak^2 / (2D) = 2 AU/yr^2`.
- Correct stopping time is `T_stop = vPeak / a2 = 1 yr`.
- Current solver instead solves `1 = a2 T^2 / 4`, giving `T = sqrt(2) = 1.414 yr`.

That is a 41.4% timing error in the simplest possible case.

Required fix:

- Do not use `D(T) = a2 T^2 / 4` for the second leg.
- Preferred fix: remove the retargeting solver entirely and keep a single straight transfer line for the whole mission.
- If you keep a second-leg solver, it must explicitly use `vPeak` and the real braking equation, not a rest-to-rest formula.

### 2. The deceleration phase rescales simulation time to hide the bad solver

Severity: critical

Code:

- `flipandburn/index.html:1671-1673`
- `flipandburn/index.html:2702-2704`
- `flipandburn/index.html:3778-3787`
- `flipandburn/index.html:3277-3285`

Problem:

- `solveDecelIntercept()` returns both `T2_sim` and `T2_traj`.
- During the decel animation, the ship moves according to `T2_traj`, but the planets advance according to `T2_sim / T2_traj`.
- This means the ship and planets are no longer evolving on one physical timeline.

The comment in the code is explicit: the app scales `simTime` so the planet reaches the intercept point when the ship does.

That is not a physically valid simulation. It is a timing fudge.

Impact:

- Reported mission duration is not the same thing as the ship's actual braking duration.
- A "successful" arrival can be manufactured by changing the planet clock instead of using correct spacecraft kinematics.
- HUD values can look plausible while the underlying motion is inconsistent.

Required fix:

- Remove `T2_sim`, `T2_traj`, and `simRatio` from the braking physics path.
- During decel, both ship and planets must advance on the same `dtSim`.
- The only allowed timescale is the physically computed one for the current mission state.

### 3. Before the player flips, the ship stops following an accelerating trajectory after the nominal midpoint

Severity: critical

Code:

- `flipandburn/index.html:1917-1938`
- used during transit at `flipandburn/index.html:3697-3699`

Problem:

- `getTransferLinePosition(tau)` uses the symmetric rest-to-rest formula with an implied flip at `T/2`.
- During the `"transit"` phase, the ship is supposed to keep accelerating until the player taps.
- But once `tau > T/2`, the function switches to the deceleration branch anyway.

So the code says:

- velocity still grows as `v = a * tau` (`flipandburn/index.html:3726`),
- but position is computed as if braking had already begun.

That is an internal contradiction.

Concrete counterexample:

- Let `a = 1`, total planned transfer time `T = 2`, so `L = a T^2 / 4 = 1`.
- If the player has not flipped by `tau = 1.5`, correct still-accelerating position is:
  `s = 0.5 * a * tau^2 = 1.125`
- The current code returns:
  `s = L - 0.5 * a * (T - tau)^2 = 0.875`

Those are not close. The current code moves the ship backward relative to the true accelerating solution and prevents a physically correct late-flip state from ever existing.

Required fix:

- Split outbound and inbound kinematics.
- Before the player flips, use only:
  - `s_out(t) = 0.5 * a1 * t^2`
  - `v_out(t) = a1 * t`
- Do not reuse the symmetric rest-to-rest whole-trip equation during the pre-flip outbound phase.
- Do not clamp outbound `s` to `ref.L`; a too-late flip must be allowed to become a real miss state.

### 4. The current implementation bends the trajectory at flip, which violates the stated straight-line model

Severity: high

Code:

- `flipandburn/index.html:1701-1728`
- `flipandburn/index.html:2290-2325`
- `flipandburn/index.html:2355-2362`
- `flipandburn/index.html:2695-2702`

Problem:

- The first leg uses one line from launch point to the original planned intercept.
- At flip, the code creates a new line from the current ship position to a new future intercept point.
- The drawn transfer path is therefore piecewise linear with a corner at the flip point.

But the app text says the ship follows a straight-line flip-and-burn profile.

A pure flip-and-burn maneuver reverses thrust direction; it does not instantaneously add an unmodeled sideways velocity component. If the second leg uses a different line, that implies an extra steering impulse or continuous lateral steering that is not modeled anywhere.

Required fix:

- Preferred fix: one mission = one transfer line chosen at launch. No line change at flip.
- If you intentionally want a broken-line path, then you must explicitly model cross-track steering and state that the ship is no longer following a straight-line transfer.

### 5. The miss logic is arbitrary, and `miss` can incorrectly overwrite `fatal`

Severity: high

Code:

- `flipandburn/index.html:944`
- `flipandburn/index.html:2713-2727`
- `flipandburn/index.html:2003-2007`

Problem A: miss criterion is not derived from actual miss geometry

- Current miss classification is based on `MISS_RATIO = 5` and
  `max(aEff / a2, a2 / aEff)`.
- That is a game threshold, not a physical hit/miss test.
- The code can declare a "hit" even when the actual braking solution is wrong, because the miss rule is disconnected from actual spatial separation at arrival.

Problem B: fatal outcome can be lost

- `resultType` is first computed from burn survivability.
- Then a miss check unconditionally overwrites it with `"miss"`.
- Therefore an obviously lethal second burn can become a nonfatal miss result.

This is wrong both scientifically and logically.

Required fix:

- Compute miss from actual arrival geometry and timing, not from an arbitrary acceleration ratio.
- Final result precedence should be:
  - `fatal` overrides everything,
  - otherwise `miss` overrides `success/slow/close`,
  - otherwise keep the survivability result.

### 6. Several HUD readouts are stale or internally inconsistent

Severity: medium

Code:

- `flipandburn/index.html:1649-1651`
- `flipandburn/index.html:2792-2810`
- `flipandburn/index.html:3141-3167`
- `flipandburn/index.html:3275-3285`
- `flipandburn/index.html:1945-1950`

Problems:

1. `dv1Val` and `dv2Val` always use `ref.dvDepart` and `ref.dvArrive`, which were computed from the original reference solve, not from the player's actual mission.
2. In the non-miss decel path, the ship motion uses `transfer2.aEff`, but the HUD displays `accelFinal2`.
3. `state.tActual` in the hit case is based on `T2_sim`, while the ship path duration is based on `T2_traj`.

Impact:

- The displayed braking g, transfer time, and delta-v can disagree with the actual motion shown on screen.

Required fix:

- After first burn commitment, recompute and store the actual mission quantities, not only the reference ones.
- In a scientifically consistent model there should be only one braking acceleration and one braking duration, so the HUD should simply display those.
- `dv_depart_actual` should be the actual speed at flip.
- `dv_arrive_actual` should be the actual braking delta-v applied on the second leg; for a full stop it equals the speed at flip.

### 7. The launch-window / phase-angle system is unfinished and currently misleading

Severity: medium

Code:

- `flipandburn/index.html:1762-1785`
- `flipandburn/index.html:1909-1910`
- `flipandburn/index.html:3178-3183`
- unused/dead indicators around `flipandburn/index.html:1360-1362`
- unused strings around `flipandburn/index.html:1116-1117`, `1137-1139`

Problem:

- The code computes phase-related quantities and even defines difficulty-dependent phase tolerances.
- But `isLaunchReady()` only checks `state.ref != null && state.missionStarted`.
- Status text says "Window open — fire!" whenever the mission has started, regardless of actual phase error.
- Early/late launch strings appear to be dead.

This is scientifically misleading because the UI claims a launch-window evaluation that is not actually implemented.

Required fix:

- Either implement real phase-window gating using the already computed `phaseError` and the difficulty tolerance,
- or remove the "window open" language and present phase as informational only.

### 8. Crew survival is modeled as a random roll, not deterministic physics

Severity: low

Code:

- `flipandburn/index.html:1897-1902`
- `flipandburn/index.html:1978-1985`

Problem:

- For the same acceleration, the mission can alternate between `"close"` and `"fatal"` because of `Math.random()`.
- That is not a physics model; it is a game mechanic.

This is acceptable only if explicitly presented as such. For a scientific teaching tool, deterministic output is usually better.

Required fix:

- Preferred: make survivability deterministic and threshold-based or duration-based.
- Acceptable fallback: keep it random but label it clearly as a gameplay simplification, not a scientific result.

## Recommended repair model

This is the cleanest way to fix the current issues without changing the app's stated concept.

Use one transfer line per mission.

1. Keep the current first-leg solve.
   - At launch, solve for the straight-line intercept point `rdRef` and total symmetric mission time `T_plan` using `L = a1 T_plan^2 / 4`.
   - Store:
     - `r0`
     - `u`
     - `L`
     - `T_plan`
     - `shipStopPoint = rdRef`

2. Outbound leg before flip:
   - elapsed time since launch: `tau`
   - position along line: `s = 0.5 * a1 * tau^2`
   - speed: `v = a1 * tau`
   - ship world position: `r = r0 + u * s`

3. When the player flips:
   - Use the current outbound state only. Do not create a new transfer line.
   - Remaining distance to the original stop point:
     - `remaining = L - s_flip`
   - If `remaining <= 0`, the player flipped too late. That is already a miss/overshoot state.
   - Otherwise the required braking acceleration to stop at the original stop point is:
     - `a2 = v_flip^2 / (2 * remaining)`
   - Braking time:
     - `T_brake = v_flip / a2`
   - Total arrival time after launch:
     - `T_arrive = tau_flip + T_brake`

4. Inbound leg after flip:
   - braking elapsed time since flip: `tb`
   - position along the same line:
     - `s = s_flip + v_flip * tb - 0.5 * a2 * tb^2`
   - speed:
     - `v = v_flip - a2 * tb`
   - stop when `tb >= T_brake`

5. Miss test:
   - Evaluate the destination planet at physical arrival time:
     - `r_dest_arrive = helioPosition(dest, launchSimTime + T_arrive)`
   - Ship stop point is the original `rdRef` on the same line.
   - Compute:
     - `missVector = r_dest_arrive - rdRef`
     - `missDistance = hypot(missVector.x, missVector.y)`
   - Use a small explicit capture tolerance if needed for gameplay.
   - Underburn vs overburn can be classified from the sign of `T_arrive - T_plan`:
     - `T_arrive > T_plan` = too gentle / too early flip / planet has moved ahead
     - `T_arrive < T_plan` = too hard / too late flip / ship arrives before the planet

6. Time evolution:
   - Remove all `simRatio` logic.
   - The same `dtSim` must advance both ship and planets.

7. Result precedence:
   - If either burn is fatal, final outcome is `fatal`.
   - Else if `missDistance` exceeds tolerance, final outcome is `miss`.
   - Else use the survivability/speed classification.

## Minimum code changes that should happen

1. Delete or completely rewrite `solveDecelIntercept()` (`flipandburn/index.html:1659-1730`).
2. Replace `getTransferLinePosition()` with an outbound-only function (`flipandburn/index.html:1917-1938`).
3. Replace `getDecelPosition()` so it always uses the real committed second-leg acceleration and the same transfer line (`flipandburn/index.html:1941-1957`).
4. Rewrite the `"transit"` branch in `startBurn()` so it does not retarget a new intercept line (`flipandburn/index.html:2682-2738`).
5. Remove `simRatio` and dual braking times from the `"decel"` animation branch (`flipandburn/index.html:3756-3837`).
6. Fix final result precedence so `fatal` cannot be overwritten by `miss` (`flipandburn/index.html:2713-2727`).
7. Recompute actual `dv` and time readouts from committed mission values, not from the original reference solve (`flipandburn/index.html:3141-3167`, `3275-3285`).

## Acceptance checks for the fixing agent

The implementation should not be considered correct until all of these are true.

1. In a frozen-target thought experiment, the braking leg obeys:
   - `T_stop = vPeak / a2`
   - `L_stop = vPeak^2 / (2 a2)`
   exactly.
2. During outbound flight before flip, the ship position is monotonic in `0.5 * a1 * tau^2` and is never computed from a post-flip equation.
3. The ship never changes to a different transfer line at flip unless extra steering physics has been explicitly added and documented.
4. During decel, planets and ship advance on the same physical simulation clock. There is no time-rescaling fudge factor.
5. A fatal burn remains fatal even if the ship also misses.
6. Displayed braking g, total time, and delta-v values match the quantities actually used in the motion equations.
7. A perfect midpoint flip reproduces the original solved intercept.
8. A deliberately early flip and a deliberately late flip produce opposite miss subtypes for the same mission setup.

## Public sources used

1. NASA Glenn Research Center, "Airplane Motion" - constant-acceleration kinematics:
   https://www.grc.nasa.gov/www/k-12/VirtualAero/BottleRocket/airplane/motion.html

2. Astronomy Engine documentation on heliocentric vectors and coordinate systems:
   https://pypi.org/project/astronomy-engine/

3. Astronomy Engine project overview and stated accuracy:
   https://github.com/cosinekitty/astronomy
