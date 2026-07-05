# Scientific Review: `hohmann.html`

Review date: 2026-04-13

Purpose: assess whether the physics and mathematics in `hohmann.html` are scientifically sound, separate correct core orbital mechanics from real implementation defects, and provide a fix-ready handoff document another AI agent can use without repeating the review.

## Executive summary

`hohmann.html` gets the textbook reference formulas right:

- the planetary position solver is a valid 2D Keplerian approximation;
- the Hohmann reference solver uses the correct semi-major-axis, transfer-time, delta-v, and phase-angle equations;
- the displayed Earth->Mars and Earth->Venus reference numbers are consistent with standard two-body Hohmann-transfer math.

The app is **not** scientifically solid overall, because the actual gameplay state propagation breaks those correct formulas in several places.

The most important problems are:

- burn 1 and burn 2 advance simulated time while the spacecraft position stays frozen, so the code mixes position, velocity, and phase from different epochs;
- unbound trajectories are forcibly converted into fake bound ellipses;
- burn 2 is never physically applied, so “capture” is judged by a rubric rather than by orbital mechanics;
- the destination encounter corridor is a coarse heuristic and becomes physically absurd for outer planets;
- the app does not clearly disclose the hybrid model boundary between:
  - planets rendered on eccentric Keplerian ellipses,
  - and transfer scoring based on circular-reference Hohmann formulas.

Bottom line: the **reference solver is good**, but the **mission execution logic is not physically consistent enough** to call the app scientifically correct in its current form.

## Method

- Read `hohmann.html` directly and traced the orbital, burn, arrival, and result code paths.
- Compared the implemented formulas against standard Keplerian two-body and Hohmann-transfer equations.
- Cross-checked the orbital dataset and model choice against JPL/NASA public references.
- Ran local numerical checks for:
  - Earth -> Mars reference transfer,
  - Earth -> Venus reference transfer,
  - phase drift during held burns,
  - state-vector inconsistency caused by burn timing,
  - escape-threshold cases,
  - arrival-corridor size for inner and outer missions.

## Governing model that should be preserved

These are the equations another agent should preserve while fixing the broken mission logic.

### Planet positions and velocities

- Mean motion:
  - `n = 2π / T`
- Mean anomaly:
  - `M0 = L0 - ϖ`
  - `M = M0 + n t`
- Kepler solve:
  - `M = E - e sin(E)`
- Orbital-plane position:
  - `x' = a (cos E - e)`
  - `y' = a sqrt(1 - e^2) sin E`
- Rotation by longitude of perihelion:
  - `x = x' cos ϖ - y' sin ϖ`
  - `y = x' sin ϖ + y' cos ϖ`
- Orbital-plane velocity:
  - `dx'/dt = -a n sin E / (1 - e cos E)`
  - `dy'/dt = a n sqrt(1 - e^2) cos E / (1 - e cos E)`
  - then rotate by `ϖ` into app coordinates

### Hohmann reference transfer

For the teaching/reference transfer between circular Sun-centered orbits:

- `r1 = a_home`
- `r2 = a_destination`
- `a_transfer = (r1 + r2) / 2`
- `v_circ_1 = sqrt(mu_sun / r1)`
- `v_circ_2 = sqrt(mu_sun / r2)`
- `v_trans_1 = sqrt(mu_sun * (2 / r1 - 1 / a_transfer))`
- `v_trans_2 = sqrt(mu_sun * (2 / r2 - 1 / a_transfer))`
- `deltaV1 = abs(v_trans_1 - v_circ_1)`
- `deltaV2 = abs(v_circ_2 - v_trans_2)`
- `t_transfer = pi * sqrt(a_transfer^3 / mu_sun)`
- with `mu_sun = 4π^2 AU^3 / yr^2`, this becomes:
  - `t_transfer = 0.5 * a_transfer^(3/2)` years
- target phase:
  - `phi_target = wrap(pi - n2 * t_transfer)`

### Modeling note that should remain explicit

The project requirements already allow an educational hybrid model:

- planets may be rendered on approximate eccentric heliocentric ellipses for realism;
- the scored transfer may still be based on circular-reference Hohmann formulas using semi-major axes;
- the local parking-orbit inset may be symbolic.

That hybrid model is scientifically acceptable **only if the app says so clearly** and **only if the state propagation stays internally consistent**.

## Findings: `hohmann.html`

### What is already correct

#### 1. The Kepler solver and heliocentric orbit formulas are correct

Locations:

- `hohmann.html:521-560`

Why this is correct:

- `solveKepler()` uses a standard Newton iteration on `M = E - e sin E`.
- `helioPosition()` uses the standard ellipse-in-focus parametrization.
- `helioVelocity()` correctly differentiates that parametrization and rotates the result into the app frame.

This is a scientifically sound 2D Keplerian approximation for an educational simulator.

#### 2. The Hohmann reference solver is mathematically correct

Locations:

- `hohmann.html:567-602`
- `hohmann.html:609-625`

Why this is correct:

- `a_transfer = (r1 + r2) / 2`
- transfer time is correctly computed as half the transfer-ellipse period
- `deltaV1` and `deltaV2` use the correct vis-viva formulas
- the target phase angle `phi = wrap(pi - n2 * t_transfer)` is correct for a circular-reference Hohmann transfer

Local numerical checks with the current constants:

- Earth -> Mars:
  - `t_transfer ≈ 0.70873 years ≈ 258.86 days`
  - `phi_target ≈ +44.35 deg`
  - `deltaV1 ≈ 2.945 km/s`
  - `deltaV2 ≈ 2.649 km/s`
- Earth -> Venus:
  - `t_transfer ≈ 0.39991 years ≈ 146.07 days`
  - `phi_target ≈ -54.02 deg`
  - `deltaV1 ≈ 2.496 km/s`
  - `deltaV2 ≈ 2.707 km/s`

Those values are consistent with standard textbook Hohmann-transfer numbers.

#### 3. The chosen unit system is correct

Locations:

- `hohmann.html:343-346`

Why this is correct:

- `MU_SUN = 4 * π^2` is the correct Solar gravitational parameter in `AU^3 / yr^2`.
- `AU_TO_KMS = 4.7405` is the correct conversion for `1 AU / yr ≈ 4.74047 km/s`.

#### 4. The orbital dataset is acceptable as an educational approximation

Locations:

- `hohmann.html:352-374`

Assessment:

- The semi-major axes, eccentricities, and periods are close to JPL public-reference values.
- The app intentionally uses a fixed-element 2D model rather than a full ephemeris, which is acceptable here.
- The starting longitudes are not tied to a literal calendar date, which is also acceptable for this type of teaching app.

### Issues to fix

#### H1. Burn timing breaks the state vector and phase logic

Severity: Critical

Locations:

- `hohmann.html:1052-1078`
- `hohmann.html:1081-1097`
- `hohmann.html:1574-1582`
- `hohmann.html:1618-1625`

What is wrong:

- Burn magnitude is chosen by real press duration:
  - `deltaV_actual = burnRate * holdTime`
- That implies the actual impulse is committed on release.
- But the code samples key state at **press time**, not at **release time**:
  - `state.resultData.phaseAtLaunch` is stored when burn 1 starts
  - `state.sc.x` and `state.sc.y` are also stored when burn 1 starts
- During the burn hold, `state.simTime` keeps advancing.
- The spacecraft position does **not** advance with the home planet during burn 1, and does **not** advance with the encounter state during burn 2.
- On burn 1 release, the code uses `helioVelocity(home, state.simTime)`, meaning:
  - position is from the earlier epoch,
  - velocity is from the later epoch,
  - scored phase is from the earlier epoch.

This is a direct state-vector inconsistency.

Numerical evidence:

- `SIM_RATE = 1/15 yr per real second`
- A nominal Earth -> Mars departure burn is exactly `2.0 s` in this implementation.
- That advances simulation time by:
  - `2.0 / 15 = 0.13333 yr ≈ 48.7 days`
- During those `48.7` simulated days:
  - Earth moves about `48 deg` around the Sun
  - Earth-Mars relative phase shifts by about `22.48 deg`
- That phase drift alone is:
  - `2.25x` the Easy tolerance (`10 deg`)
  - `3.75x` the Medium tolerance (`6 deg`)
  - `7.49x` the Hard tolerance (`3 deg`)

Orbit-shape evidence:

- If the ideal Earth -> Mars burn is applied consistently at one epoch, the resulting orbit is close to the intended reference transfer:
  - `a ≈ 1.26717 AU`
  - `e ≈ 0.22401`
- With the current code path, because position is frozen while velocity is taken from `48.7` days later, the same nominal burn produces:
  - `a ≈ 1.24883 AU`
  - `e ≈ 0.76511`

That is not a small educational approximation. It is a broken state vector.

Why this matters:

- The player can be told they launched at the correct phase while the actual impulse is applied at a later phase.
- A nominally correct burn can generate a grossly wrong transfer orbit for bookkeeping reasons rather than physics.
- Burn 2 suffers the same epoch-desynchronization problem.

Required fix:

Use an **impulsive-burn model** and keep it consistent.

Recommended implementation:

1. Treat held-button time only as input for `deltaV_actual`.
2. Freeze `state.simTime` during burn holds.
3. Keep the spacecraft co-located with the current home/destination handoff state until release.
4. Evaluate launch phase at the actual burn-commit epoch.
5. Apply the burn instantaneously at release to position and velocity from the **same epoch**.

Alternative, not recommended here:

- implement a true finite-burn propagation model where time advances and the spacecraft state is integrated continuously during the burn.

Acceptance criteria:

- During a held burn, position, velocity, and scored phase always refer to the same epoch.
- A perfect-burn Earth -> Mars departure no longer turns into a high-eccentricity orbit just because the button was held for `2 s`.

#### H2. Unbound trajectories are forcibly converted into fake bound ellipses

Severity: Critical

Locations:

- `hohmann.html:632-661`
- `hohmann.html:668-694`

What is wrong:

`stateToOrbit()` contains two nonphysical clamps:

- if `a <= 0`, it replaces `a` with `abs(a)` or `1`
- if `e > 0.999`, it clamps `e` to `0.999`

That means:

- a hyperbolic or parabolic escape state is rewritten as a bound ellipse;
- propagation then continues with elliptic formulas that no longer describe the real conic.

Numerical evidence:

- For Earth -> Mars, the current burn rate is about:
  - `1.472 km/s` per real second
- Solar escape from a circular orbit at `1 AU` requires only about:
  - `12.34 km/s` additional prograde heliocentric delta-v
- In the current UI, that escape threshold is crossed after only about:
  - `8.38 s` of holding the burn

So a user can easily produce an unbound heliocentric trajectory, but the code will reinterpret it as a near-parabolic ellipse with `e = 0.999`.

Why this matters:

- The app can show a returning transfer orbit where the correct physics is escape.
- Miss/capture logic downstream is then built on a false orbit.

Required fix:

`stateToOrbit()` must preserve conic type.

Recommended implementation:

- Return a `conicType` such as:
  - `elliptic`
  - `parabolic_like`
  - `hyperbolic`
- Preserve the true sign of `a` and the true value of `e`.
- Branch propagation accordingly:
  - for `e < 1`, use ellipse formulas;
  - for `e >= 1`, either:
    - implement proper hyperbolic propagation, or
    - explicitly classify the mission as escape/miss and stop pretending the spacecraft remains on a bound transfer.

Acceptance criteria:

- A burn above escape energy can never be propagated as a fake returning ellipse.
- No code path hides an unbound state by taking `abs(a)` or clamping `e` below `1`.

#### H3. Burn 2 is never physically applied, so “capture” is not computed

Severity: Critical

Locations:

- `hohmann.html:1101-1105`
- `hohmann.html:1201-1223`
- `hohmann.html:1000-1016`

What is wrong:

When burn 2 ends, the code does this:

- marks `burn2.committed = true`
- switches to `state.phase = 'result'`
- calls `evaluateResult()`

It does **not** do any of the following:

- apply a delta-v to `state.sc.vx` / `state.sc.vy`
- compute a new post-burn orbit
- compute whether the spacecraft is actually captured
- compute whether the spacecraft circularized, remained eccentric, or escaped

The result logic is purely rubric-based:

- phase error at burn-1 start
- relative error in burn-1 magnitude versus reference
- relative error in burn-2 magnitude versus reference

The inset after burn 2 is also heuristic:

- it draws a circular orbit or a stylized eccentric ellipse based only on burn-2 error size
- it is not the orbit resulting from the spacecraft state

Why this matters:

- The app can show `Orbit captured!` without ever computing a capture.
- A good burn-2 duration can be rewarded even if the arrival geometry was wrong.
- A wrong arrival state can still be rendered as a success if the rubric thresholds pass.

Required fix:

Burn 2 must modify the state vector and the outcome must be computed from the post-burn state.

Two acceptable ways to repair this:

1. Heliocentric-reference fix:
   - apply burn 2 tangentially at the actual encounter state
   - compute the post-burn heliocentric orbit
   - score success by how closely that orbit matches the target circular-reference orbit at `r2`

2. Hybrid symbolic-capture fix:
   - compute the actual encounter state first
   - derive local arrival speed relative to the destination-handoff frame
   - apply burn 2 there
   - classify the result as circular capture / eccentric capture / escape from the computed post-burn relative energy

In either case:

- burn 2 must change the spacecraft state;
- the inset must visualize that computed result, not a burn-error heuristic.

Acceptance criteria:

- Burn 2 changes the state vector.
- Omitting burn 2 can never still produce `captured`.
- A result labeled `captured` must come from an actually computed captured/bound outcome.

#### H4. The arrival/capture corridor is a coarse heuristic and physically enormous

Severity: High

Locations:

- `hohmann.html:1141-1172`
- `hohmann.html:1175-1185`

What is wrong:

Arrival is armed when both of these are true:

- `|r_sc - a_dest| < 0.06 * a_dest`
- spacecraft-to-planet distance `< 0.15 * a_dest`

Those thresholds scale directly with orbital radius, not with:

- the encounter geometry of the transfer,
- any local planet-centered capture scale,
- or any explicit symbolic handoff model.

Numerical evidence:

- Earth -> Mars:
  - radial threshold `≈ 13.68 million km`
  - proximity threshold `≈ 34.19 million km`
- Mars -> Jupiter:
  - radial threshold `≈ 46.71 million km`
  - proximity threshold `≈ 116.76 million km`
- Uranus -> Neptune:
  - radial threshold `≈ 269.90 million km`
  - proximity threshold `≈ 674.74 million km`

These are not scientifically credible “ready to capture” regions.

Why this matters:

- Burn 2 can become available far from the destination planet.
- The app’s stated story about destination capture is no longer tied to a physically defined encounter.
- The problem gets worse for outer planets.

Required fix:

Define one explicit encounter model and use it consistently.

Recommended options:

1. Reference-node option:
   - arm burn 2 only near the intended transfer-arrival node
   - require both:
     - near-correct transfer true anomaly / time of flight,
     - and a narrow actual spacecraft-to-destination proximity threshold

2. Symbolic-handoff option:
   - define one documented symbolic encounter radius in AU or in a destination-scaled but bounded scheme
   - use that same radius for:
     - UI messaging,
     - burn-2 arming,
     - arrival timeout logic,
     - and result interpretation

Whichever model is chosen, it must **not** grow linearly to hundreds of millions of kilometers for outer planets.

Acceptance criteria:

- Burn 2 cannot arm absurdly far from outer planets.
- The arrival corridor is explicitly defined and consistent with the capture model.

#### H5. The app does not clearly disclose the hybrid “reference transfer” model

Severity: Medium

Locations:

- `hohmann.html:6`
- `hohmann.html:10`
- `hohmann.html:17`
- `hohmann.html:235`
- `hohmann.html:433`
- `hohmann.html:476`
- `hohmann.html:819-858`
- `hohmann.html:1346-1368`

What is wrong:

The app currently implies a single exact story:

- planets are shown on real-looking eccentric orbits
- the transfer is presented as “the” minimum-energy Hohmann orbit
- the second burn is labeled as capture

But the implemented model is actually hybrid:

- planetary motion is rendered on approximate eccentric Keplerian ellipses;
- transfer time, target phase, and burn targets are computed from circular-reference radii using semi-major axes;
- the local inset is symbolic rather than literal scale.

That hybrid model is scientifically defensible, but the current wording does not make the boundary clear enough.

Numerical evidence of the mismatch:

- Even if burn timing is repaired, applying the Earth -> Mars reference `deltaV1` to the actual rendered same-epoch Earth state produces an orbit close to, but not identical to, the circular-reference transfer:
  - resulting `a ≈ 1.26717 AU`, `e ≈ 0.22401`
  - reference transfer `a = 1.26185 AU`, `e ≈ 0.20751`

That difference is acceptable for a teaching hybrid, but not if the app implies exact fidelity.

Required fix:

Make the model boundary explicit in the UI copy and labels.

Recommended wording changes:

- refer to the guide path as a `reference transfer`
- explain that:
  - planets are rendered on approximate eccentric heliocentric ellipses,
  - but the scored Hohmann values are circular-reference teaching values based on semi-major axis,
  - and the local inset is symbolic
- avoid implying that the drawn guide is the exact optimal path between the currently rendered osculating ellipses
- avoid implying that the shown `deltaV1` / `deltaV2` are full real mission budgets for departure from and capture into planetary parking orbits

Acceptance criteria:

- User-facing text explicitly says this is an approximate 2D hybrid teaching model.
- The guide transfer is labeled or explained as a reference transfer if it is not literally the propagated spacecraft orbit.

## Recommended implementation order

1. Fix burn timing and epoch consistency first.
2. Add proper conic-type handling for escape/unbound cases.
3. Apply burn 2 physically and base result classification on the post-burn state.
4. Replace the current arrival corridor with an explicitly defined encounter model.
5. Update the copy so the hybrid reference model is stated honestly.
6. Re-run the numerical sanity checks below.

## Acceptance tests another agent should run after the fixes

- Verify that the reference solver still returns approximately:
  - Earth -> Mars:
    - `258.9 days`
    - `+44.3 deg`
    - `2.94 km/s`
    - `2.65 km/s`
  - Earth -> Venus:
    - `146.1 days`
    - `-54.0 deg`
    - `2.50 km/s`
    - `2.71 km/s`
- Verify that a held burn does not desynchronize position, velocity, and scored phase.
- Verify that a nominally correct Earth -> Mars departure no longer produces a broken high-eccentricity orbit because of burn-hold timing.
- Verify that an overlong Earth -> Mars burn above about `8.4 s` is treated as escape/unbound rather than as a fake bound ellipse.
- Verify that burn 2 changes the state vector and that omitting burn 2 cannot still yield `captured`.
- Verify that the arrival corridor for outer planets is no longer hundreds of millions of kilometers wide.
- Verify that the info text now states:
  - approximate 2D model
  - eccentric orbit rendering
  - circular-reference Hohmann scoring
  - symbolic local inset / capture abstraction if retained

## Sources consulted

- NASA Science, `Chapter 4: Trajectories`
  - https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/
- NASA Science, `Orbits and Kepler's Laws`
  - https://science.nasa.gov/solar-system/orbits-and-keplers-laws/
- NASA Science, `Hohmann Transfer Orbit`
  - https://science.nasa.gov/resource/hohmann-transfer-orbit/
- JPL Solar System Dynamics, `Approximate Positions of the Planets`
  - https://ssd.jpl.nasa.gov/planets/approx_pos.html
- NASA NSSDC, `Planetary Fact Sheets`
  - https://nssdc.gsfc.nasa.gov/planetary/planetfact.html
- Local project requirements:
  - `TRANSFER_REQ.md`

## Bottom line

- The reference orbital mechanics in `hohmann.html` are good.
- The mission-execution physics are not yet sound.
- Another agent fixing this file should preserve the correct Kepler/Hohmann formulas, then repair:
  - burn epoch consistency,
  - unbound-orbit handling,
  - actual burn-2 dynamics,
  - arrival-corridor definition,
  - and the explanatory wording around the hybrid model.
