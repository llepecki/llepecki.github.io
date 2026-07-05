# Scientific Review of `flipandburn.html`

Date: 2026-04-14

Scope:
- Reviewed only `flipandburn.html`.
- Did not use any local `.md` files as source material.
- Used a small set of public NASA/JPL references only to anchor physics claims that matter for correctness.

## Bottom Line

The file contains some mathematically correct building blocks:
- The Kepler solver and 2D heliocentric ellipse propagation are internally consistent.
- The unit conversions `1 g -> AU/yr^2` and `1 AU/yr -> km/s` are correct.
- The symmetric constant-acceleration relation used by the transfer toy, `L = a T^2 / 4`, is correct for a non-relativistic accelerate-half / decelerate-half profile.

But the app as a whole is **not scientifically solid as a planet-to-planet transfer simulator**. The main reasons are structural, not cosmetic:
- The advertised launch-window mechanic does not exist in the actual solver.
- The transfer solver finds a **position intercept**, not a **rendezvous**.
- The displayed `Δv` values are stale reference numbers, not the actual mission values after the player chooses acceleration.
- Crew survivability and solar lethality are gameplay rules, not defensible physics/physiology models.

An AI agent fixing this file must first choose one of two model families:

1. **Minimal-honest fix, recommended if you want to preserve the current straight-line Epstein-drive toy**
- Keep the straight-line continuous-thrust intercept model.
- Remove all launch-window / phase-angle / “window open” claims.
- Stop calling arrival a true capture/rendezvous unless terminal relative velocity is modeled.
- Mark crew and Sun hazards as gameplay abstractions, not science.

2. **Scientific-transfer fix, required if you want the app to be physically correct**
- Replace the current transfer solver with a real state-vector boundary-value / rendezvous model, or switch to a classical orbital-transfer model.
- In that version, departure epoch must matter, position and velocity must both be matched, and `Δv` must be recomputed from the actual trajectory.

There is no parameter-only fix that makes the current code scientifically correct while keeping all current claims.

## What Is Already Sound

### 1. Kepler orbit propagation is mathematically fine for a simplified 2D teaching model

Code:
- `wrapAngle`, `solveKepler`, `helioPosition`, `helioVelocity` in `flipandburn.html:745-796`
- orbital element preprocessing in `flipandburn.html:520-529`

Assessment:
- `solveKepler` uses a standard Newton iteration for `M = E - e sin(E)`.
- `helioPosition` uses the standard orbital-plane coordinates `x' = a(cos E - e)`, `y' = a sqrt(1-e^2) sin E`, then rotates by longitude of perihelion.
- `helioVelocity` is also consistent with the analytic derivative. Numerical spot-checking against finite differences shows the implementation is correct to machine precision for representative planets.

Important limit:
- This is a 2D approximation. Inclinations and nodes are ignored.
- Elements are fixed constants, not time-varying fits.
- That is acceptable only if the UI keeps describing the model as approximate.

### 2. The unit conversions are correct

Code:
- `AU_TO_KMS` at `flipandburn.html:483`
- `G_TO_AUYR2` at `flipandburn.html:485`

Assessment:
- `1 AU/yr = 4.7405 km/s` is correct for a 365.25-day year.
- `1 g = 65283.465095 AU/yr^2` is correct.

### 3. The straight-line flip-and-burn kinematics are correct inside their own simplified frame

Code:
- reference solver in `flipandburn.html:803-876`
- trajectory position in `flipandburn.html:977-999`

Assessment:
- For a trajectory that accelerates with constant magnitude `a` for `T/2` and decelerates with `a` for the remaining `T/2`, total path length is `L = a T^2 / 4`.
- Peak speed is `v_peak = a T / 2`.
- Those relations are used correctly.

Important limit:
- This only validates the internal toy kinematics.
- It does **not** validate the larger mission model built around them.

## Findings That Must Be Fixed

### F1. Blocker: the code claims launch windows, but the actual solver guarantees an intercept for every launch time

Severity: Blocker

Code evidence:
- The transfer solver solves `L(T) - a T^2 / 4 = 0` in `flipandburn.html:812-833` and again in `flipandburn.html:1561-1577`.
- `isLaunchReady()` is only `state.ref != null && state.missionStarted` in `flipandburn.html:969-971`.
- Prelaunch status becomes “window open” whenever the mission is started, not when any physics condition is met: `flipandburn.html:1825-1827`.
- `phaseError` is computed in `flipandburn.html:852-858` and stored in `flipandburn.html:873-875`, but never used to gate launch.
- `PHASE_TOL_DEG` only affects warp-speed tuning in `flipandburn.html:879-900`.
- `tooEarly`, `tooLate`, `windowOpenSimTime`, `windowWasOpen`, and `phaseAtLaunch` are dead data/UI remnants, not active physics logic.

Why this is mathematically wrong:
- In this file, planets remain on bounded heliocentric orbits, so the straight-line separation `L(T)` between the departure point and the destination planet is bounded above by a finite `L_max`.
- For any positive acceleration `a`, the term `a T^2 / 4` grows without bound.
- Therefore `f(T) = L(T) - a T^2 / 4` satisfies `f(0) > 0` for distinct planets and `f(T) -> -infinity` as `T -> infinity`.
- By continuity, at least one positive root exists for **every** launch epoch.

Meaning:
- Under the current model, there is no discrete “wait for the right planetary alignment or you miss the transfer” mechanic.
- Launch timing can still affect transfer duration, geometry, and solar clearance, but it does not create a yes/no launch window in the Hohmann sense.

What to change:
- Pick exactly one direction:
- Direction A, minimal and honest: remove all “window open”, “waiting for window”, phase-tolerance gating, and “too early / too late” language. Reframe the game as “launch any time, but different departure times change path length and risk.”
- Direction B, physically stronger but much larger rewrite: replace the solver with a model where departure epoch really matters. That requires either a classical orbital-transfer model or a genuine continuous-thrust rendezvous solver with explicit mission constraints.

Acceptance criteria:
- The UI must not claim a launch window unless the code actually rejects launches outside a physically defined window.
- If the straight-line solver stays, the phase-angle readout must be relabeled as advisory geometry only, not as a gate.

### F2. Blocker: the mission model is an intercept-in-position, not a rendezvous

Severity: Blocker

Code evidence:
- The ship is placed at the departure planet position in `flipandburn.html:1520-1525`.
- The path generator `getTransferLinePosition()` in `flipandburn.html:977-999` gives `s(0) = 0` and `s(T) = L`, with zero line-speed at both endpoints.
- That means the spacecraft starts and ends with **zero heliocentric speed along the transfer line**.
- The code never adds the launch planet’s heliocentric velocity to the spacecraft state.
- On arrival, the code immediately declares `captured` once the position endpoint is reached in `flipandburn.html:2241-2247`, without checking terminal relative velocity to the destination planet.

Physics requirement:
- NASA’s rendezvous literature defines rendezvous by matching both position and velocity, not position alone.

Why this matters:
- A spacecraft standing on Earth already has Earth’s heliocentric orbital velocity.
- A spacecraft that truly arrives at Mars must match Mars’s heliocentric velocity at the encounter, not merely pass through Mars’s position at one instant.

Concrete derived example from this file:
- Earth -> Mars at `simTime = 0`, using the file’s own elements and `A_REF = 1.5 g`
- Reference transfer time: about `3.15 days`
- Peak half-burn `Δv` in the file’s toy model: about `2004.8 km/s`
- Earth’s heliocentric speed at departure from the file’s orbit model: about `30.3 km/s`
- Mars’s heliocentric speed at intercept from the file’s orbit model: about `26.3 km/s`

Interpretation:
- The code treats the spacecraft as arriving with zero heliocentric speed while Mars is still moving at about `26.3 km/s`.
- That is not capture or rendezvous. It is a position crossing.

What to change:
- If scientific correctness is the goal, the spacecraft state must include both position and velocity.
- Launch state must inherit the departure planet’s heliocentric velocity.
- Success at destination must require both:
- small relative position error
- small relative velocity error
- If the current toy solver is intentionally kept, the app must stop using words like “transfer”, “arrive”, and “captured” in a physically literal sense and instead call it an “intercept toy.”

Acceptance criteria:
- For a successful arrival, `|r_sc - r_dest|` and `|v_sc - v_dest|` must both be below explicit tolerances.
- If the model remains position-only, the UI must explicitly say “intercept” rather than “capture/rendezvous.”

### F3. High: the displayed `Δv` numbers are stale reference values, not the mission the player actually flew

Severity: High

Code evidence:
- `dvDepart` and `dvArrive` are set from the reference 1.5 g solution in `flipandburn.html:841-870`.
- After the player releases the burn and the code re-solves for the chosen acceleration in `flipandburn.html:1545-1601`, it updates geometry and timing but does **not** update `ref.dvDepart` or `ref.dvArrive`.
- The UI readout still displays `ref.dvDepart` and `ref.dvArrive` in `flipandburn.html:1812-1813`.

Why this is wrong:
- Even inside the current simplified toy, once the player chooses a new acceleration, the half-burn `Δv` changes to `a_actual * T_actual / 2`.
- The code keeps showing the old `A_REF` values instead.

Concrete derived example from this file:
- Earth -> Mars at `simTime = 0`
- If the player chooses `20 g`, the toy model’s actual half-burn `Δv` is about `7354.9 km/s`
- The readout still shows the original `1.5 g` reference value, about `2004.8 km/s`

Additional issue:
- Even if this stale-value bug is fixed, these two displayed values are still not a full rendezvous budget, because the current model ignores the required terminal velocity match to the destination planet.

What to change:
- Minimum fix inside the current toy:
- recompute and display the actual mission half-burn values after release
- label them clearly as “half-burn thrust Δv in the toy model”
- If the app is upgraded to a real rendezvous model:
- replace the readout with quantities that actually match the trajectory definition, including terminal relative velocity matching or capture burn if modeled

Acceptance criteria:
- Changing the chosen acceleration changes the displayed `Δv` values immediately after burn commit.
- The labels must match the physics actually being displayed.

### F4. High: the crew-survival model is not a scientific physiology model

Severity: High

Code evidence:
- “safe” and “dead” thresholds are hard-coded at `1 g` and `10 g` in `flipandburn.html:487-493`
- `crewSurvivalChance()` uses only instantaneous acceleration magnitude in `flipandburn.html:957-963`
- `evaluateAccelResult()` then maps this into `success`, `close`, `slow`, or `fatal` in `flipandburn.html:1005-1035`

Why this is not defensible science:
- Human acceleration tolerance depends strongly on direction (`+Gx`, `+Gz`, etc.), posture, restraint, countermeasures, health, and duration.
- This file makes survival a function of `g` alone.
- It ignores how long the acceleration is sustained.

Concrete contradiction in the current file:
- The green zone is `1 g` to `3 g`.
- Earth -> Mars at `3 g` in the current solver takes about `2.23 days`.
- The code treats that as automatic success, but sustained multi-day `3 g` exposure is not a validated “crew safe” regime.

External support:
- NASA’s Artemis sustained translational acceleration review states that acceleration tolerance depends on posture and that existing sustained limits in NASA-STD-3001 apply only to seated crew.

What to change:
- Pick exactly one direction:
- Direction A, minimal and honest: explicitly label this as a gameplay scoring rule and remove scientific language about survival probability.
- Direction B, scientific: replace it with an exposure model that depends at least on acceleration vector/orientation and duration.

Acceptance criteria:
- The app must not imply that `1–3 g` is a generally correct sustained-human “safe zone” unless a cited model justifies it.
- If the gameplay rule remains, it must be labeled as a game rule, not a science result.

### F5. Medium: the solar lethality rule is an arbitrary game hazard, not a physical thermal model

Severity: Medium

Code evidence:
- `SOLAR_KILL_RADIUS = 0.18 AU` and `SOLAR_SAFE_RADIUS = 0.22 AU` in `flipandburn.html:494-495`
- `SOLAR_SAFE_RADIUS` is never used
- solar-clearance geometry is computed in `flipandburn.html:844-851` and `flipandburn.html:1590-1597`
- actual mission failure happens as an instantaneous threshold crossing in `flipandburn.html:2232-2238`

Why this is not a scientific survival model:
- Solar irradiance scales roughly as `1 / r^2`.
- NASA gives modern total solar irradiance near Earth as about `1361.6 W/m^2`.
- At `0.18 AU`, that implies roughly `42,000 W/m^2`.
- That is an extreme thermal environment, but whether it is survivable depends on spacecraft shielding, orientation, emissivity, cooling, exposure time, and mission design.
- The file treats it as universal instant death for any ship and crew.

What to change:
- Minimum honest fix:
- label the Sun hazard as a gameplay exclusion zone
- remove the implication that `0.18 AU` is a general physical death radius
- Scientific fix:
- model incident flux, absorbed power, and an explicit vehicle thermal limit
- then use `SOLAR_SAFE_RADIUS` only if it emerges from that model or remove it

Acceptance criteria:
- The UI must not present `0.18 AU = certain death` as a universal scientific fact unless a vehicle thermal model supports it.

## Secondary Issues

### S1. The phase-angle display is only cosmetic under the current solver

Code:
- phase values are computed in `flipandburn.html:852-858`
- displayed in `flipandburn.html:1815-1819`

Assessment:
- With the current straight-line continuous-thrust solver, phase angle is not a hard launch criterion.
- It can still be a useful descriptive number, but it should not be presented as if it defines an actual go/no-go window.

### S2. The burn HUD’s live projected transfer time is only approximate

Code:
- `projT = 2 * sqrt(L / accel)` in `flipandburn.html:1899-1903`

Assessment:
- During the hold, the displayed projected time uses `state.transfer.L` from the reference geometry already locked at `A_REF`.
- The actual code later re-solves the intercept against the destination’s new future position for the chosen acceleration.
- So the live transfer-time estimate shown during the hold is not the same mission the solver finally flies.

### S3. The finite flip animation is visual only

Code:
- flip animation timing in `flipandburn.html:2215-2229`

Assessment:
- The physics switches from acceleration to deceleration at the exact midpoint in the kinematic equations.
- The finite 180-degree rotation takes wall-clock time visually, but no thrustless coast is inserted into the physics.
- This is acceptable as a visual simplification if disclosed, but it is not a literal simulation of a finite-duration flip.

## Recommended Fix Order

If the goal is **scientific honesty with minimum rewrite**, do this first:

1. Remove launch-window claims and all “too early / too late / waiting for window / window open” language.
2. Relabel the mission as a straight-line continuous-thrust intercept toy, not a literal rendezvous.
3. Fix the stale `Δv` readouts so they reflect the actually chosen acceleration and transfer time.
4. Relabel crew and Sun outcomes as gameplay abstractions.
5. Keep the current Kepler planet model and current unit conversions.

If the goal is **scientific correctness**, do this instead:

1. Replace the transfer solver with a state-vector model that includes both spacecraft position and velocity.
2. Require success to satisfy both relative position and relative velocity conditions at the destination.
3. Recompute `Δv` from the actual flown trajectory, not from a fixed reference.
4. Either remove crew physiology entirely or replace it with an explicit cited model.
5. Either remove the Sun death rule or replace it with a thermal model tied to spacecraft assumptions.

## References

These are the only external references used in this review.

1. JPL Solar System Dynamics, “Approximate Positions of the Planets”
- https://ssd.jpl.nasa.gov/planets/approx_pos.html
- Relevant points:
- JPL describes these as lower-accuracy Keplerian formulae for approximate planetary positions.
- Standard formulas are given for `M`, Kepler’s equation, and orbital-plane coordinates `x'`, `y'`.

2. NASA Technical Note, “Trajectory Control in Rendezvous Problems Using Proportional Navigation”
- https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20040005909.pdf
- Relevant point:
- NASA explicitly distinguishes interception from rendezvous; rendezvous requires matching both position and velocity.

3. NASA Technical Memorandum, “Artemis Sustained Translational Acceleration Limits: Human Tolerance Evidence from Apollo to International Space Station”
- https://ntrs.nasa.gov/api/citations/20205008196/downloads/TM-20205008196.pdf
- Relevant points:
- sustained acceleration tolerance depends on posture/orientation
- NASA notes current sustained translational acceleration requirements apply only to seated posture

4. NASA Goddard Earth Sciences, “Solar Irradiance Science”
- https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science
- Relevant point:
- NASA gives current total solar irradiance near Earth as about `1361.6 W/m^2`, which is enough to estimate the flux scaling used in this review.

## Final Verdict

`flipandburn.html` is **partly correct at the equation level** but **not scientifically correct at the mission-model level**.

Preserve:
- Kepler orbit propagation structure
- unit conversions
- symmetric constant-acceleration kinematics

Do not trust without redesign or relabeling:
- launch windows
- phase-angle gating
- “capture” at destination
- `Δv` readouts
- crew survivability
- hard solar death radius
