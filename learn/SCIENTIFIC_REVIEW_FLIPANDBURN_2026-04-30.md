# Scientific Review of `flipandburn.html` (2026-04-30)

Scope:
- This review used `flipandburn.html` as the only local source of truth.
- I did not read any local Markdown documents.
- Public sources were used only to validate core kinematics and spaceflight statements.

## Executive Verdict

The first-leg "accelerate halfway, then flip" math is mostly self-consistent inside the app's stated simplification: a 2D heliocentric straight-line teaching model with constant thrust and no gravity acting on the ship.

The new second-burn implementation is **not** scientifically solid. The ship does not actually brake using the player-selected second acceleration except in explicit miss cases. Successful second-leg trajectories use a hidden substitute acceleration, the second-leg timing equation is wrong for a braking leg, and the ship is allowed to retarget onto a new line at flip without paying the required change in direction.

The launch-window / phase-angle system is also not implemented as physics or gameplay logic. It is cosmetic only.

## What Is Acceptable As A Deliberate Simplification

These are simplifications, not bugs, as long as they are clearly disclosed:

- Planet positions come from Astronomy Engine and are projected into the ecliptic plane. That is fine for a 2D teaching model.
- The spacecraft ignores solar gravity and flies a straight heliocentric line under continuous thrust. That is a very large simplification, but the info text already describes the app as a simplified teaching model.
- The first leg uses correct constant-acceleration midpoint math for the simplified model:
  - From rest, with constant acceleration `a` for half the trip and constant deceleration `a` for the second half:
  - `L = a T^2 / 4`
  - `t_half = T / 2`
  - `v_peak = a t_half`

Inside the model the first-leg solver at `flipandburn.html:1585-1667` and the first-burn re-solve at `flipandburn.html:2729-2785` are mathematically coherent.

## Critical Findings

### 1. Second-leg hit physics is wrong, and the player-selected braking acceleration is ignored on successful arrivals

Locations:
- `flipandburn.html:1669-1740`
- `flipandburn.html:1954-1970`
- `flipandburn.html:2804-2826`
- `flipandburn.html:3860-3879`

What the code does now:
- At flip, it solves a second intercept with `D(T) = a2 * T^2 / 4`.
- It then computes a hidden `aEff = vPeak^2 / (2L)`.
- On non-miss outcomes, `getDecelPosition()` uses `aEff`, not the player-selected `a2`.
- Sim time is also rescaled with `T2_sim / T2_traj` so the planet meets the ship at the new endpoint.

Why this is wrong:
- `D = a T^2 / 4` is the midpoint formula for a full accelerate-then-decelerate transfer that starts and ends at zero speed.
- The second leg in this app does **not** start from zero speed. It starts at the flip point with `vPeak > 0`.
- The correct 1D braking-leg equations are:
  - `v(t) = vPeak - a2 * t`
  - `s(t) = vPeak * t - 0.5 * a2 * t^2`
  - `t_stop = vPeak / a2`
  - `s_stop = vPeak^2 / (2 * a2)`
- The current implementation only uses the real player-selected `a2` when `resultType === "miss"`. On a "hit", the ship actually flies with `aEff`, a different acceleration that the player never selected.

Concrete contradiction:
- If the player uses the same braking acceleration as the first burn, the symmetric case should give `tDecelHalf == tAccelHalf`.
- The current solver cannot do that, because it uses the wrong second-leg root equation. Even the symmetric case is stretched by the wrong formula.

Required fix:
- Remove the hidden hit-path substitution with `aEff`.
- Remove `T2_sim`, `T2_traj`, and the `simRatio` rescaling trick for the second leg.
- The flown second-leg motion must always use the actual player-selected `a2`.

### 2. The ship illegally changes trajectory direction at flip

Locations:
- `flipandburn.html:1711-1737`
- `flipandburn.html:1954-1968`

What the code does now:
- After the first half, the ship has velocity along the first-leg unit vector `state.transfer.u`.
- The code then builds a brand-new second-leg line from `flipPointPos` to a different future destination point and moves the ship along that new `transfer2.u`.

Why this is wrong:
- A 180 degree flip only reverses the thrust direction relative to the current velocity vector.
- It does not magically rotate the velocity vector onto a brand-new line to the target.
- If the post-flip line is not collinear with the pre-flip line, then a pure 1D "flip and brake" model is no longer valid.
- The current code therefore mixes two incompatible models:
  - a 1D scalar braking equation, and
  - a 2D retarget to an arbitrary new line.

Required fix:
- Pick one model and stay consistent.

Recommended model for this app:
- Keep a **single fixed transfer line** from launch through the entire mission.
- After the flip, continue on that same line only.
- Let the second burn change only:
  - stop time,
  - stop distance,
  - whether the ship stops short, hits, or overshoots.

Do not create a new `transfer2.u` unless you also implement a real retarget maneuver with full vector kinematics and revised UI text. A simple "flip" is not enough.

### 3. Miss detection is not physically based, and the UI miss zones do not match the actual logic

Locations:
- UI bands: `flipandburn.html:3830-3840`, `flipandburn.html:3150-3161`
- Actual miss test: `flipandburn.html:2839-2850`

What the code does now:
- At the end of the flip animation it computes a miss band from the destination's **current** distance from the flip point:
  - `aEffRef = vp^2 / (2D_now)`
  - `missLow = aEffRef / 5`
  - `missHigh = aEffRef * 5`
- After the player commits the second burn, the actual miss logic compares `a2` to a different quantity:
  - `decelSolution.aEff`
- Burns are accepted as "hit" unless the mismatch exceeds a factor of `5`.

Why this is wrong:
- The displayed miss zones are not derived from the same quantity used by the actual miss classification.
- A factor-of-5 tolerance is arbitrary and extremely large. A braking acceleration that is off by 400% should not still count as a successful zero-relative-speed arrival.
- Because successful paths use `aEff` instead of the chosen `a2`, the miss logic is not testing the real flown trajectory anyway.

Required fix:
- Use one physically meaningful target quantity for both UI and logic.
- The UI guidance, success check, and miss classification must all be based on the same actual trajectory model.
- Replace the factor-of-5 rule with a geometric tolerance:
  - define a capture radius in AU or km,
  - simulate the ship with the chosen `a2`,
  - compare ship position and destination position at stop time,
  - classify:
    - success if separation <= capture radius,
    - overshoot if ship's along-track stop point is beyond the target,
    - undershoot if it is short of the target,
    - lateral miss if the destination is off the fixed transfer line by more than the capture radius.

### 4. "Time your launch" is not implemented

Locations:
- Phase math exists: `flipandburn.html:1643-1649`, `flipandburn.html:1777-1794`
- Readiness logic ignores it: `flipandburn.html:1922-1923`
- Engine/UI ignore it: `flipandburn.html:2995-2998`, `flipandburn.html:3209-3212`
- Strings imply a window system: `flipandburn.html:1109-1140`

What the code does now:
- `computeFlipBurnRef()` calculates `phaseCurrent`, `phaseRequired`, and `phaseError`.
- `computeWarpLevels()` calculates a `windowDur`.
- None of those values affect launch readiness, mission legality, or result scoring.
- `isLaunchReady()` only returns `state.ref != null && state.missionStarted`.
- The UI says "Waiting for window" or "Window open — fire!" based only on whether the player has started time warp.

Why this is wrong:
- The file claims the player should "time your launch".
- The actual code makes launch timing physically irrelevant inside the gameplay loop, because the first-burn solver always re-solves a fresh intercept for the chosen acceleration and current time.
- The window text is therefore misleading.

Required fix:
- Choose one of these two directions:

Option A, recommended if keeping current simplified physics:
- Remove or rewrite the launch-window language.
- Make the app about choosing burn magnitudes and seeing whether the target geometry works out.

Option B, if you want real launch-timing gameplay:
- Make `phaseError` and the configured tolerance matter.
- A launch should only be marked "window open" when the actual criterion is satisfied.
- Early/late result hints should only appear if they are actually reachable from code.

## Important Secondary Findings

### 5. Displayed delta-v and time readouts stop matching the flown trajectory after the player commits burns

Locations:
- Reference values created once: `flipandburn.html:1658-1661`
- Transfer geometry updated but delta-vs not updated: `flipandburn.html:2767-2785`
- UI still shows stale values: `flipandburn.html:3193-3196`
- Second-leg time display conflicts with flown model: `flipandburn.html:3314-3336`

Problems:
- `dv1Val` and `dv2Val` are taken from the original reference solution and are not recomputed after the player picks `a1` or `a2`.
- During the second leg, the UI shows the player's `a2`, but the flown hit trajectory uses `aEff`.
- `tActual` on successful second burns uses `T2_sim`, not the real braking time `vPeak / a2`.

Required fix:
- After first-burn commit, recompute and store the true flown values.
- After second-burn commit, the displayed time and acceleration must match the actual propagated trajectory.
- In a correct fixed-line braking model:
  - second-leg duration is `vPeak / a2`,
  - arrival delta-v to stop is `vPeak`,
  - if `a2 == a1` in the symmetric case, first-half and second-half durations match.

### 6. The online ephemeris sync does not query the same epoch as the simulation state

Locations:
- `flipandburn.html:1483-1521`

Problem:
- The code stores `const t = state.simTime`, but the actual IMCCE query timestamp is `new Date().toISOString()`, not the date corresponding to `t`.
- That means the fetched "online" coordinates are for wall-clock now, while the local Astronomy Engine comparison is for `state.simTime`.
- After time-warping or dragging planets in prelaunch, the offset is no longer scientifically tied to the displayed simulation epoch.

Required fix:
- Build the IMCCE query timestamp from `state.simTime` using the same epoch conversion used by `astroPosition()`.
- Or label the sync as an initial-now calibration only and stop applying the resulting offset as if it were valid for arbitrary sim times.

## Recommended Repair Strategy

This is the simplest scientifically coherent path that preserves the current app structure.

### Keep the first leg as-is

The first-leg solver is acceptable inside the current simplified model:
- launch from the home planet's current heliocentric position,
- solve a straight-line intercept for the chosen first-burn acceleration,
- fly half the total distance,
- reach the flip point with `vPeak = a1 * tAccelHalf`.

### Replace the second leg with a fixed-line braking model

At flip:
- Keep `u = state.transfer.u`.
- Keep `flipPos = state.flipPointPos`.
- Keep `vPeak = state.accelFinal1 * state.tAccelHalf`.

For a chosen second-burn acceleration `a2`:
- `tStop = vPeak / a2`
- `s(t) = vPeak * t - 0.5 * a2 * t^2`
- `sStop = vPeak^2 / (2 * a2)`
- `shipPos(t) = flipPos + u * s(t)`
- `shipStop = flipPos + u * sStop`
- `destStop = helioPosition(dest, simTimeAtFlip + tStop)`

Then classify the result from geometry:
- `along = dot(destStop - flipPos, u)`
- `cross = abs(cross2d(destStop - flipPos, u))`
- `shipAlong = sStop`

Suggested interpretation:
- success if `distance(shipStop, destStop) <= captureRadius`
- undershoot if `shipAlong < along - captureRadius`
- overshoot if `shipAlong > along + captureRadius`
- lateral miss if `cross > captureRadius`

This fixes three problems at once:
- the player's actual braking acceleration is what flies the ship,
- miss/undershoot/overshoot become physically meaningful,
- the app no longer performs a free retarget at flip.

### If you still want a second-burn "ideal zone"

Do not base it on the current distance `D_now`.

Instead, derive it from the same model used for success/miss:
- search over future times `t > 0`,
- compare `dest(t)` to `flipPos + u * (0.5 * vPeak * t)` because a stop-to-rest burn over time `t` has average speed `vPeak / 2`,
- find the `t` that minimizes separation,
- define `a_req = vPeak / t_best`,
- use that same `a_req` for:
  - the green target zone,
  - displayed guidance,
  - success tolerance,
  - overshoot / undershoot messaging.

If there is no close crossing, tell the player there is no good braking solution from this launch geometry.

## Verification Checklist For The Fixing Agent

The next agent should treat these as pass/fail checks.

1. If `a2 == a1` and the geometry is symmetric, the second-half duration equals the first-half duration.
2. A successful second-leg arrival must be flown with the exact acceleration chosen by the player, not a hidden substitute.
3. The post-flip ship path must stay on the original transfer line unless the app explicitly adds a retarget maneuver with new physics and UI wording.
4. The same quantity that drives the second-burn UI target must also drive hit/miss classification.
5. Burns that are substantially too weak must overshoot; burns that are substantially too strong must undershoot. This must follow from the geometry, not from an arbitrary factor-of-5 threshold.
6. "Window open" must either be a real condition derived from code, or the wording must be removed.
7. `dv1`, `dv2`, acceleration, and total time readouts must match the actual propagated trajectory after the player commits each burn.
8. If online ephemeris sync remains enabled, its timestamp must match the current simulation epoch.

## Notes On Broader Realism

The app still contains major simplifications even after the fixes above:
- It ignores the spacecraft's inherited heliocentric velocity from the departure planet.
- It ignores solar gravity on the spacecraft.
- It treats the motion as a straight line in a 2D plane.

Those are acceptable if the copy states clearly that the game is a teaching toy, not a mission-design simulator.

If you want to document one of those simplifications more clearly, the biggest one is the launch state: NASA explicitly notes that a spacecraft on the launch pad is already orbiting the Sun along with Earth, so a fully realistic heliocentric transfer would not start from Sun-frame rest.

## Public Sources Used

These were used only to validate the underlying physics statements above:

- OpenStax Physics, "Ch. 3 Key Equations"  
  https://openstax.org/books/physics/pages/3-key-equations  
  Used for the constant-acceleration relations:
  - `x = x0 + v0 t + 0.5 a t^2`
  - `v = v0 + a t`
  - `v^2 = v0^2 + 2 a (x - x0)`

- NASA Science, "Basics of Space Flight: Chapter 13 - Navigation"  
  https://science.nasa.gov/learn/basics-of-space-flight/chapter13-1/  
  Used for the statement that a spacecraft on the launch pad is already orbiting the Sun along with Earth.

- NASA Science, "Basics of Space Flight: Chapter 14 - Launch"  
  https://science.nasa.gov/learn/basics-of-space-flight/chapter14-1/  
  Used for the statement that interplanetary launch windows are tied to target geometry and arrival timing.
