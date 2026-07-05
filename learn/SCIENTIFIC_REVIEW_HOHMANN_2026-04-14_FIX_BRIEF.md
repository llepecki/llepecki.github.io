# Scientific Review of `hohmann.html`

Date: 2026-04-14

Scope:
- Reviewed only `hohmann.html`.
- Ignored all existing Markdown files as requested.
- Focused on the physics and math of underburn and overburn behavior for Burn 1 and Burn 2, especially whether the resulting animations are physically faithful.

## Executive Conclusion

The circular-orbit Hohmann reference math is basically sound. The two-body propagation used for clearly "bad" burns is also basically sound. The main scientific problems are in the path that is treated as "good" or "close enough":

1. Burns inside the green zone are snapped to ideal motion, so many underburn and overburn cases are not animated physically at all.
2. The nominal transfer animation is not a real Keplerian conic. It is a hand-built arc forced to hit the destination.
3. Arrival-burn miss trajectories on that guided arc use the wrong pre-burn speed.
4. Off-nominal arrival detection uses very large encounter radii, so Burn 2 can start tens of millions of km from the target planet.

Net result:
- The simulation is most physically correct when Burn 1 is clearly wrong.
- The simulation is least physically correct when Burn 1 is nominal or nearly nominal, which is exactly the regime the user is most likely to trust.

## What Is Scientifically Solid

These parts are good and should be preserved:

- `computeHohmannRef()` in `hohmann.html:753-789` uses the standard circular coplanar Hohmann formulas:
  - `a_t = (r1 + r2) / 2`
  - `t_t = pi * sqrt(a_t^3 / mu)` which becomes `0.5 * a_t^(3/2)` in the chosen units because `mu = 4*pi^2`
  - `v = sqrt(mu * (2/r - 1/a))`
  - `dv1 = |v_t1 - v_circ1|`
  - `dv2 = |v_circ2 - v_t2|`
- The phase-angle formula in `hohmann.html:768-769` is correct for a Type-I Hohmann transfer in this simplified heliocentric model:
  - `phi = pi - n_dest * t_transfer`
  - This yields a positive lead for outward transfers and a wrapped negative lag for inward transfers.
- `stateToOrbit()`, `orbitPositionAt()`, and `orbitVelocityAt()` in `hohmann.html:856-923` are a valid two-body state-vector-to-conic implementation for bound heliocentric motion.
- Off-nominal Burn 1 handling in `hohmann.html:1456-1467` is conceptually right:
  - outward transfer: add prograde tangential `dv`
  - inward transfer: add retrograde tangential `dv`
  - then propagate the resulting conic under solar gravity

Within the app's stated simplification, the correct qualitative outcomes are:

- Outward Burn 1 underburn: launch point is perihelion, aphelion stays short of the target orbit.
- Outward Burn 1 overburn: launch point is perihelion, aphelion overshoots the target orbit or escapes if too large.
- Inward Burn 1 underburn: launch point is aphelion, perihelion stays outside the target orbit.
- Inward Burn 1 overburn: launch point is aphelion, perihelion falls inside the target orbit.
- Outward Burn 2 underburn: encounter point should remain aphelion and the craft should fall back inward.
- Outward Burn 2 overburn: encounter point should become perihelion and the craft should head outward, or escape if above local escape speed.
- Inward Burn 2 underburn: encounter point should remain perihelion and the craft should head back outward.
- Inward Burn 2 overburn: encounter point should become aphelion and the craft should fall further inward.

## Physics Basis

Primary public references used to validate the review:

- NASA Basics of Space Flight, Chapter 3:
  - https://science.nasa.gov/learn/basics-of-space-flight/chapter3-4/
  - This supports the apsis-change rules for tangential burns:
    - increase speed at periapsis -> raise apoapsis
    - decrease speed at periapsis -> lower apoapsis
    - increase speed at apoapsis -> raise periapsis
    - decrease speed at apoapsis -> lower periapsis
- NASA Basics of Space Flight, Chapter 4:
  - https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/
  - This supports the Hohmann transfer interpretation:
    - outward transfer: depart tangentially from perihelion, coast to aphelion at target distance
    - inward transfer: depart tangentially from aphelion, coast to perihelion at target distance
- NASA TFAWS orbital mechanics presentation:
  - https://tfaws.nasa.gov/wp-content/uploads/Rickman-Presentation.pdf
  - Supports the vis-viva and transfer-time formulas used above.

## Findings

### Finding 1 — Burns inside the green zone are snapped to perfect physics

Severity: Critical

Affected code:
- `hohmann.html:1446-1455`
- `hohmann.html:1498-1514`
- `hohmann.html:1943-1955`

Observed behavior:
- Burn 1:
  - If the burn is judged "good", line 1451 forcibly sets `state.burn1.dvApplied = state.ref.dv1`.
  - The spacecraft is then moved onto a synthetic perfect transfer arc.
- Burn 2:
  - If the burn is judged "good", lines 1511-1514 forcibly set the spacecraft velocity to the destination planet's heliocentric velocity, regardless of the actual applied `dv`.

Why this is scientifically wrong:
- A real underburn or overburn inside the acceptance band is still an underburn or overburn.
- It should produce a slightly wrong conic, not a perfect transfer or perfect circularization.
- The code erases physically meaningful error exactly where the animation should be most educational.

Why this is worse than it first appears:
- The green-zone half-width is
  - `greenHalfWidth = 0.375 * maxDv * greenFrac`
  - with `maxDv = 2 * idealDv`
  - so at `greenFrac = 1`, accepted "good" burns span `idealDv +/- 0.75 * idealDv`
  - that is 25% to 175% of the ideal burn
- Example: Earth -> Mars
  - Burn 1 ideal is about 2.94 km/s
  - Full-width "good" range is about 0.74 to 5.15 km/s
  - Burn 2 ideal is about 2.65 km/s
  - Full-width "good" range is about 0.66 to 4.64 km/s
- Those are not small deviations. Many large underburn/overburn cases can currently be visualized as perfect burns.

Required fix:
- Never overwrite the applied burn with the reference burn.
- Never snap the spacecraft directly to perfect target velocity just because the burn landed inside a tolerance band.
- Preserve the actual `dvApplied` and propagate the resulting state vector.
- If the product still wants forgiving scoring, keep tolerance only for grading, not for dynamics.

Acceptance criteria:
- A release at 90% of ideal Burn 1 must show a slightly wrong transfer orbit, not a perfect transfer.
- A release at 110% of ideal Burn 2 must show a slightly non-circular post-burn orbit, not a perfect match to the destination orbit.
- The visual trajectory, the stored state vector, and the final scoring inputs must all use the same actual applied `dv`.

### Finding 2 — The "good Burn 1" transfer arc is not a physical conic

Severity: Critical

Affected code:
- `hohmann.html:929-975`
- `hohmann.html:977-1010`
- `hohmann.html:1450-1455`
- `hohmann.html:1620-1638`

Observed behavior:
- `buildTransferArc()` constructs a path by:
  - taking the actual launch position and actual destination position at `tStart + ref.tTransfer`
  - computing `rArc` from an ellipse-like radius formula
  - but linearly interpolating the inertial polar angle from `alpha1` to `alpha2`
- `checkArrival()` then forces the spacecraft to the arc endpoint and starts Burn 2 when that hand-built path finishes.

Why this is scientifically wrong:
- A two-body transfer ellipse around the Sun is fully determined by a state vector or by its orbital elements.
- Its inertial angle is not free to interpolate arbitrarily between actual departure and actual destination angles.
- A true apsis-to-apsis Hohmann half-ellipse spans 180 degrees in true anomaly. This code can span something else entirely because it forces the endpoint to where the planet happens to be.
- Therefore the displayed path is not the orbit of any actual Keplerian conic around the Sun.

Concrete evidence from the current orbital elements:
- For an Earth -> Mars launch chosen so that the code's phase error is essentially zero, the actual destination angle at `tLaunch + ref.tTransfer` is about 200.6 degrees from the launch radius, not 180 degrees.
- The current arc therefore bends the spacecraft onto a path that no true Hohmann ellipse can follow.

Secondary problem:
- `buildTransferArc()` uses `r1` and `r2` from the actual instantaneous planet radii, but it keeps `tTransfer = state.ref.tTransfer`, which was computed from the planets' semi-major axes, not from those actual instantaneous radii.
- That creates an additional timing inconsistency.
- Example: in one Earth -> Mars near-ideal window, the actual apsis pair implied by the endpoint radii gives a half-period of about 0.6950 yr, while the code still uses 0.7087 yr, a difference of about 5 days.

Required fix:
- Delete the synthetic transfer-arc approach as the source of truth for spacecraft motion.
- For a nominal Burn 1, create the same kind of actual state vector already used for off-nominal Burn 1:
  - `r0 = helioPosition(home, tLaunch)`
  - `v0 = helioVelocity(home, tLaunch) + sign * dvApplied * tangentialUnitVector`
  - `orbit = stateToOrbit(r0, v0, tLaunch)`
- Then propagate that conic with `orbitPositionAt()` and `orbitVelocityAt()` for all Burn 1 outcomes, nominal included.
- If a visual overlay is still desired, draw it from sampled points on the propagated conic, not from a hand-built polar interpolation.

Acceptance criteria:
- Exact-burn trajectories must be actual conic sections derived from the spacecraft state vector.
- Wrong-phase exact burns must miss the planet naturally unless the propagated conic truly intersects the destination state at arrival.
- No code path may force the spacecraft to the destination merely because `t = tLaunch + ref.tTransfer`.

### Finding 3 — Burn 2 miss trajectories on the guided path use the wrong pre-burn speed

Severity: High

Affected code:
- `hohmann.html:1526-1534`

Observed behavior:
- When Burn 1 was "good" and Burn 2 is "bad", the code uses:
  - tangent direction from the synthetic arc
  - speed magnitude `postSpeed = state.ref.vArr + dir2 * state.burn2.dvApplied`

Why this is scientifically wrong:
- `state.ref.vArr` is the circular-reference Hohmann arrival speed at `r = dest.a`.
- It is not the actual current spacecraft speed on the displayed guided arc.
- It is also not the arrival speed for the actual instantaneous radii used by `buildTransferArc()`.

Concrete example:
- In one Earth -> Mars near-ideal window using the current orbital elements, the guided arc endpoints imply:
  - `r1 ~= 1.006 AU`
  - `r2 ~= 1.485 AU`
- A physical half-ellipse through those apsides would arrive at about `4.634 AU/yr`.
- The code instead uses `state.ref.vArr ~= 4.531 AU/yr`.
- Error: about `0.103 AU/yr`, or about `0.485 km/s`.
- So the miss trajectory after Burn 2 is quantitatively wrong even before the off-nominal burn is applied.

Required fix:
- Burn 2 must always start from the actual current spacecraft velocity.
- If the spacecraft is propagated as a real conic, get that velocity from `orbitVelocityAt(state.sc.orbit, state.simTime)`.
- If any auxiliary transfer-arc code remains temporarily, it must store actual `vx, vy` along the arc, not infer speed from `state.ref.vArr`.

Acceptance criteria:
- At Burn 2, the post-burn state must be computed as:
  - `v_post = v_pre + sign * dvApplied * vhat_pre`
- No branch may use a reference speed in place of the current speed.

### Finding 4 — Off-nominal Burn 2 can trigger far from the planet

Severity: High

Affected code:
- `hohmann.html:1595-1601`
- `hohmann.html:1642-1657`

Observed behavior:
- For off-nominal orbits, arrival is declared when the spacecraft comes within:
  - `max(0.15, min(0.5, dest.a * 0.08 + dest.a * dest.e * 2))`
- That radius is very large.

Concrete values from current code:
- Venus: 0.150 AU ~= 22.4 million km
- Earth: 0.150 AU ~= 22.4 million km
- Mars: 0.4065 AU ~= 60.8 million km
- Jupiter/Saturn/Uranus/Neptune: 0.500 AU ~= 74.8 million km

Why this is scientifically wrong:
- A heliocentric circularization burn is only meaningful at the actual encounter state.
- Starting Burn 2 tens of millions of km away means the visual "arrival burn" is not tied to any real rendezvous geometry.
- This distorts all underburn/overburn Burn 2 animations, because the burn may happen at the wrong place and wrong time.

Required fix:
- Replace the large encounter radius with a physically meaningful event condition.
- Recommended options:
  - detect an actual local minimum in distance to the destination and only allow Burn 2 if that minimum is below a small threshold
  - or require both small position error and small angular error relative to the destination state
- If gameplay needs a forgiving prompt, use UI assistance, not a physically fake encounter sphere.

Acceptance criteria:
- Burn 2 may only become available when the spacecraft is genuinely near the destination state.
- The threshold must be small enough that showing "arrival burn" remains scientifically defensible.

### Finding 5 — "Captured" can be shown from a non-encounter state

Severity: High

Affected code:
- `hohmann.html:1509-1522`

Observed behavior:
- A "good" Burn 2 sets the spacecraft velocity to the destination planet's heliocentric velocity and immediately enters the `captured` phase.
- The current spacecraft position is not required to match the destination position tightly.

Why this is scientifically wrong:
- Matching only the velocity while allowing a large position error does not mean the spacecraft is on the destination orbit.
- If Burn 2 was enabled far from the planet because of the large encounter radius, the code can display "Orbit matched!" from a state that is not an actual rendezvous.

Required fix:
- Only declare capture if both are true:
  - spacecraft position is within a small spatial tolerance of the destination
  - spacecraft post-burn velocity is within a small velocity tolerance of the destination heliocentric velocity
- Otherwise keep propagating the resulting heliocentric conic and grade it as a miss or close flyby.

Acceptance criteria:
- `captured` must mean actual near-coincidence in both position and velocity, not just copied velocity.

## Recommended Repair Strategy

This is the minimum scientifically consistent refactor:

1. Remove `transferArc` as a dynamics source.
2. Treat every burn, including ideal burns, the same way:
   - compute current `r, v`
   - apply signed tangential `dv`
   - convert to orbital elements with `stateToOrbit()`
   - propagate with `orbitPositionAt()` and `orbitVelocityAt()`
3. Use the Hohmann reference only for:
   - readouts
   - launch-window guidance
   - grading against the ideal solution
4. Gate Burn 2 on a real encounter condition, not a huge synthetic sphere.
5. Grade separately from dynamics:
   - dynamics use actual `dvApplied`
   - score can still be forgiving if desired
   - but never snap the spacecraft to the ideal orbit for visual convenience

If this refactor is done, the underburn/overburn animations will become correct automatically.

## Preserve Current Game Feel

The physics can be fixed without making the product feel more punishing. Use this separation:

- guidance layer:
  - launch-window indicator
  - green burn band
  - countdown and prompts
  - success / close / miss grading
- dynamics layer:
  - actual state vector
  - actual applied `dv`
  - actual propagated conic

Rules:

1. Keep the current readouts and target values.
   - The player should still see the same ideal `dv1`, `dv2`, transfer time, and phase angle targets.

2. Keep the green zone as a score window, not a physics snap window.
   - Landing inside the green should improve the grade.
   - It must not overwrite `dvApplied` or force the spacecraft onto a perfect path.

3. Keep forgiving grading bands if desired.
   - The current game feel comes largely from generous acceptance, not from the fake dynamics.
   - Preserve `success`, `close`, and `miss`, but compute them after propagating the real trajectory.

4. Keep the Burn 2 timing challenge, but trigger it from a real approach event.
   - Recommended: arm Burn 2 when the spacecraft is approaching a predicted closest-approach point to the destination and is already within a much smaller physical corridor.
   - Then keep the same short real-time reaction window and the same shrinking/bouncing meter behavior.

5. If the stricter encounter condition makes Burn 2 harder to read, add visual help instead of faking the orbit.
   - Draw a faint reference Hohmann arc as a guide only.
   - Draw the actual spacecraft path separately.
   - Show a small predicted closest-approach marker on the destination orbit.
   - Tint the UI as the closest-approach event nears.

6. Preserve the current “hold to burn” mechanic.
   - The player input model can remain unchanged.
   - Only the post-burn state calculation should change.

7. Preserve easy / medium / hard by changing scoring pressure, not orbital truth.
   - Easy: wider success tolerances, stronger prompts, larger visual guidance.
   - Medium: current timing pressure, moderate score tolerance.
   - Hard: narrow tolerances, bounce/shrink effects, minimal guidance.
   - In all modes, the spacecraft trajectory should remain physically derived from the actual burn.

8. Keep the result overlay language, but make the hint reflect the real miss mode.
   - Examples:
     - “Burn 1 too short: aphelion stayed inside Mars’ orbit.”
     - “Burn 2 too long: you left on a larger heliocentric ellipse.”
     - “Burn 2 too short: you fell back inward after encounter.”

Recommended UX implementation:

- Always propagate the actual conic after Burn 1.
- Always compute Burn 2 from the actual pre-burn velocity.
- Keep a separate ideal reference solution in memory for:
  - meter centering
  - readouts
  - scoring
  - optional ghost arc
- If the actual trajectory is near the ideal one, the player will still feel like they “nailed it,” but the animation will remain honest.

Acceptance criteria for preserving game feel:

1. A casual player can still complete Earth -> Mars on easy mode without needing orbital-mechanics expertise.
2. The UI still clearly communicates when to launch and when to perform Burn 2.
3. Near-perfect burns still look smooth and satisfying.
4. Slight underburns and overburns remain visibly close to the target, but no longer collapse into a perfect orbit.
5. Difficulty differences come from guidance and scoring pressure, not from changing the underlying physics.

## Acceptance Tests For The Fix Agent

Use these as non-negotiable scientific checks:

1. Outward Burn 1 underburn:
   - spacecraft stays on an ellipse with departure point at perihelion
   - aphelion remains inside the target orbit
2. Outward Burn 1 overburn:
   - departure point stays perihelion
   - aphelion exceeds the target orbit or the craft escapes if above local escape speed
3. Inward Burn 1 underburn:
   - departure point stays aphelion
   - perihelion remains outside the target orbit
4. Inward Burn 1 overburn:
   - departure point stays aphelion
   - perihelion drops inside the target orbit
5. Outward Burn 2 underburn:
   - encounter point is aphelion
   - craft falls back inward after the burn
6. Outward Burn 2 overburn:
   - encounter point is perihelion
   - craft moves outward after the burn, or escapes if speed exceeds `sqrt(2 * mu / r)`
7. Inward Burn 2 underburn:
   - encounter point is perihelion
   - craft moves back outward after the burn
8. Inward Burn 2 overburn:
   - encounter point is aphelion
   - craft falls further inward after the burn
9. Burns that are numerically under or over the ideal value must remain under or over in the actual animation, even if they are still inside a generous scoring tolerance.
10. No branch may teleport the spacecraft to the destination or overwrite the actual applied `dv` with the reference `dv`.

## Bottom Line

The formulas for the ideal Hohmann reference are fine. The scientific problems are caused by mixing those correct formulas with non-physical animation shortcuts. The current code teaches the right equations but often shows the wrong trajectory, especially for near-nominal underburn and overburn cases and for Burn 2 after any guided arrival.
