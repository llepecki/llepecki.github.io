# Scientific Review: `gravrel.html`

Review date: 2026-04-13

Purpose: assess whether the physics and mathematics in `gravrel.html` are scientifically sound, separate acceptable teaching simplifications from real scientific defects, and provide a fix-ready handoff document another AI agent can use without repeating the review.

## Executive summary

`gravrel.html` has a defensible educational core:

- the special-relativistic Lorentz factor is computed correctly;
- route length is converted from the schematic map to physical light-year distance in a consistent way;
- the single-black-hole Schwarzschild clock factor is implemented in the correct dimensionless form;
- proper time is numerically integrated along the route in a way that is internally consistent with the app’s constant-speed animation model.

The app is **not scientifically solid overall** in its current form.

The most important problems are:

- the endpoint keep-out rule is too small to preserve the app’s own claim that the mission clock near Earth represents a far-away reference clock;
- the black-hole mass labels (`10^3` to `10^9 M☉`) are not physically tied to the `r_s` model used in the math;
- route validity and minimum-distance calculations are not geometrically reliable because they use midpoint-only checks on fixed samples;
- invalid routes are still given finite time-dilation values by clamping them back to the safety radius;
- the drawn outer influence ring is not actually used by the physics;
- the info text does not clearly disclose which parts of the model are exact single-hole physics and which parts are deliberate approximations.

Bottom line: the app is a good teaching prototype, but it should **not** be described as scientifically correct until the issues below are fixed.

## Method

- Read `gravrel.html` directly and traced the route, timing, black-hole, and readout code paths.
- Compared the implemented formulas against standard Schwarzschild results for stationary clocks and against standard special-relativistic time dilation.
- Cross-checked key GR statements against public institutional sources.
- Ran local numerical sanity checks for:
  - endpoint keep-out at maximum black-hole mass,
  - the actual strength of the factor at the drawn outer influence ring,
  - the mismatch between displayed mass and modeled `r_s`,
  - midpoint-only safety checks versus true segment-circle intersections.

## Governing model that can be kept

These are the parts of the implementation another agent should preserve while fixing the scientific defects.

### 1. Unit and route-length model

The app uses the intended teaching-unit system:

- `c = 1 light-year / year`
- `beta = v / c`
- `gamma = 1 / sqrt(1 - beta^2)`

The route-length conversion is internally consistent with the schematic-map assumption:

- `L = D * (L_map / L0_map)`
- `T_ref = L / beta`

This is acceptable for a teaching app where star distances are real but the map is not.

### 2. Single-hole gravitational factor

For one non-rotating black hole, the implemented factor

- `g(r) = sqrt(1 - r_s / r)`

is the standard Schwarzschild clock factor for a stationary clock outside the horizon.

The current code implements that in dimensionless form as:

- `rOverRs = dCanvas / Rh`
- `g = sqrt(1 - 1 / rOverRs)`

which is scientifically fine **if** `Rh` is treated as the app’s local encounter-scale stand-in for `r_s`.

### 3. Segment integration and animation consistency

The integration pattern in `computeRoutePhysics()` is internally coherent:

- `dsPhysical = star.dist * (dsMap / L0_map)`
- `dtRef = dsPhysical / beta`
- `dPilot = dtRef * (1 / gamma) * g`

Because the app assumes one constant cruise speed, route fraction, reference-time fraction, and arc-length fraction are equivalent. The live animation and live pilot-clock interpolation are therefore consistent with the precomputed route integrals.

### 4. Numerical stability technique for multi-hole multiplication

Using log space in `computeEffectiveGravity()` is a good numerical-stability choice:

- accumulate `0.5 * log(term)` for each hole,
- then exponentiate once at the end,
- then clamp the result.

That is better than multiplying several small factors directly.

## Findings: `gravrel.html`

### What is already correct

#### 1. `computeGamma()` is correct

Locations:

- `gravrel.html:702-705`

Why this is correct:

- It uses the standard Lorentz factor.
- It also protects the radicand as `beta -> 1`, which is numerically sound.

#### 2. The route-length and mission-time formulas match the app’s intended schematic geometry

Locations:

- `gravrel.html:728-755`
- `gravrel.html:776-781`

Why this is correct:

- Physical route length scales from the straight-line star distance by the map-length ratio.
- Reference travel time is then computed as `length / beta`.
- For a constant-speed educational model, this is a coherent simplification.

#### 3. The single-hole time-dilation factor is encoded in the correct Schwarzschild form

Locations:

- `gravrel.html:707-717`

Why this is correct:

- The code computes `sqrt(1 - 1 / rOverRs)`, which is the correct dimensionless equivalent of `sqrt(1 - r_s / r)`.

#### 4. Live clocks are consistent with the precomputed integrals

Locations:

- `gravrel.html:806-842`
- `gravrel.html:1568-1599`

Why this is correct:

- The ship position is driven by route fraction.
- Pilot time is interpolated from cumulative integrated proper time along the route.
- Because the model assumes constant cruise speed, this matches the integrated timing model rather than inventing a separate animation-only clock.

### Issues to fix

#### G1. Endpoint keep-out is too small to preserve the app’s own reference-clock interpretation

Severity: High

Locations:

- `gravrel.html:346`
- `gravrel.html:570-573`
- `gravrel.html:583-603`
- `gravrel.html:413-416`

What is wrong:

- `KEEPOUT_RADIUS` is a fixed `60 px`, independent of black-hole mass and independent of `Rh`, `Rsafe`, or `Rinf`.
- At maximum mass, the code gives `Rh = 28 px`, so the Earth or destination star can be as close as:
  - `r / r_s = 60 / 28 ≈ 2.14`
- For a stationary clock there, the Schwarzschild factor is:
  - `g = sqrt(1 - 1 / 2.14) ≈ 0.730`

Numerical consequence:

- A “far-away reference clock” visually placed at Earth can therefore sit in a region where a stationary clock would already run about `27%` slow relative to infinity.
- At the default `beta = 0.50`, the moving-ship factor becomes:
  - `(1 / gamma) * g ≈ 0.866 * 0.730 ≈ 0.632`

Why this matters:

- The app’s own concept note says the mission clock near Earth is only a visual placement of a far-away reference clock.
- With the current keep-out rule, black holes can be positioned so close to Earth or the destination star that this interpretation stops being credible.
- It also allows the route to begin or end inside a visually strong black-hole influence region.

Required fix:

- Make endpoint keep-out depend on black-hole size, not a fixed pixel constant.
- The minimum distance from any black-hole center to Earth or the destination star should be at least:
  - `max(endpointKeepoutMin, bh.Rinf + endpointMargin)`
  - or another documented threshold that guarantees “far enough away” in the app’s own schematic model.
- Recompute and enforce this on mass changes and black-hole drags.

Acceptance criteria:

- A maximum-mass black hole cannot be dragged so close that Earth or the destination lies inside or near the outer influence ring.
- The mission clock near Earth remains visually and mathematically compatible with the “far-away reference clock” explanation.

#### G2. Displayed black-hole mass is not physically tied to the `r_s` model used by the math

Severity: High

Locations:

- `gravrel.html:350-351`
- `gravrel.html:483`
- `gravrel.html:566-573`
- `gravrel.html:1459-1462`

What is wrong:

- The Schwarzschild radius is directly proportional to black-hole mass.
- The app labels masses as literal `10^3` to `10^9 M☉`.
- But the modeled horizon scale is:
  - `Rh = RH_MIN + RH_PER_EXP * (massExp - 3)`
  - so `10^3 M☉ -> Rh = 10`
  - and `10^9 M☉ -> Rh = 28`

Numerical evidence:

- Physically, increasing from `10^3 M☉` to `10^9 M☉` multiplies `r_s` by `10^6`.
- In the app, the horizon scale changes only by a factor of:
  - `28 / 10 = 2.8`

Why this matters:

- `Rh` is not just a drawing radius; it is also used in the actual gravity model via `rOverRs = dCanvas / Rh`.
- The readout then reports the minimum pass distance in `r_s`.
- That means the UI presents literal solar-mass labels and literal `r_s` distance units while the model uses an arbitrary linear-in-exponent scale.
- This is scientifically misleading, not merely schematic.

Required fix:

Choose one of these two honest models and apply it consistently:

1. Physical-mass model:
   - compute physical `r_s ∝ M`,
   - then introduce a separate, explicitly documented encounter-scale compression from physical `r_s` to canvas space.

2. Purely schematic model:
   - keep the compressed mapping,
   - but stop labeling it as literal `M☉` and literal `r_s`,
   - rename the controls/readouts to relative gravity-strength units or “local horizon units.”

Acceptance criteria:

- The displayed mass and displayed distance units have a documented, defensible relation to the actual computation.
- No UI element says literal `r_s` unless the computation behind it uses a physically defensible `r_s` mapping.

#### G3. Route validation and minimum-distance calculations are not geometrically sound

Severity: High

Locations:

- `gravrel.html:361-364`
- `gravrel.html:657-690`
- `gravrel.html:744-767`

What is wrong:

- The route is resampled at a fixed density only.
- For each consecutive pair of samples, the code checks only the midpoint against each black hole.
- The true minimum distance from a line segment to a circle is not, in general, the midpoint distance.
- The defined hysteresis constants:
  - `HYSTERESIS_ENTER`
  - `HYSTERESIS_EXIT`
  are never actually used.

Constructed geometry proof:

- With `r_safe = 1.35`, the segment from
  - `(3.914, 3.987)` to `(-1.066, -0.923)`
  has:
  - midpoint distance `≈ 2.092 > 1.35`
  - true minimum distance `≈ 0.091 < 1.35`
- A midpoint-only test marks that segment safe even though it cuts deep into the forbidden zone.

Why this matters:

- A Catmull-Rom route can overshoot between control points.
- Fixed sampling plus midpoint-only checks can miss actual safety-zone crossings.
- The displayed minimum pass distance can also be wrong for the same reason.
- Near the safety boundary, lack of hysteresis can create validity flicker during dragging.

Required fix:

- After resampling, validate each polyline segment against each black hole using the true minimum segment-circle distance.
- Compute `route.minDist` from the same true segment-circle minimum, not from midpoint distance.
- Add adaptive refinement in high-curvature sections and near black holes, or use an analytically safe enough polyline density guarantee.
- Implement actual validity hysteresis using separate enter and exit thresholds.

Acceptance criteria:

- If any polyline segment intersects `r_safe`, the route is invalid regardless of where the midpoint lies.
- The minimum-distance readout agrees with the true segment-circle minimum to within display tolerance.
- Dragging near the safety ring does not cause single-frame valid/invalid flicker.

#### G4. Invalid routes are silently coerced back to a finite gravitational factor

Severity: Medium

Locations:

- `gravrel.html:707-717`
- `gravrel.html:751-779`

What is wrong:

- `computeEffectiveGravity()` clamps
  - `rOverRs = max(dCanvas / Rh, 1 + DELTA_SAFE)`
- So once a segment enters the forbidden zone, the code still computes a finite `g` as if that segment were sitting exactly on the safety radius.
- Only afterward does `computeRoutePhysics()` mark the route invalid.
- `route.pilotTime` and per-sample cumulative pilot times are still accumulated for the invalid route.

Why this matters:

- The app turns an invalid region into a pseudo-valid time-dilation value.
- That conflicts with the intended rule that paths inside the safety radius are not physically admissible for this simulator.
- It also makes the invalid-route numbers dangerously reusable by future code as if they had physical meaning.

Required fix:

- Determine segment validity first from the true minimum distance.
- If a route violates `r_safe`, either:
  - stop the physics accumulation and set `pilotTime` / `refTime` to `null` for that route,
  - or keep a clearly separated invalid-preview path that is never displayed as physical timing data.
- Do not use the safety-radius clamp as a substitute for valid physics.

Acceptance criteria:

- No invalid route returns a physical pilot-time value.
- No segment inside `r_safe` contributes a time-dilation factor that is later treated as part of a valid calculation.

#### G5. The drawn outer influence ring is cosmetic; the physics does not use it

Severity: Medium

Locations:

- `gravrel.html:349`
- `gravrel.html:570-573`
- `gravrel.html:707-717`
- `gravrel.html:882-895`

What is wrong:

- `Rinf = 8 * Rh` is drawn as the outer influence ring.
- But `computeEffectiveGravity()` does not use `Rinf` at all.
- Every black hole contributes to the time-dilation factor everywhere on the map with no cutoff or taper.

Numerical evidence:

- At `d = Rinf = 8 Rh`, a single-hole factor is:
  - `sqrt(1 - 1/8) ≈ 0.935`
- For two identical holes it becomes:
  - `0.935^2 = 0.875`
- For three identical holes it becomes:
  - `0.935^3 ≈ 0.818`

Why this matters:

- The outer ring looks like a meaningful boundary or at least a clear “effect zone.”
- In fact, the code gives substantial slowing even exactly on that ring, and still nonzero slowing outside it.
- The child therefore does not see the same proximity model the math is using.

Required fix:

Choose one of these:

1. Make `Rinf` part of the actual physics:
   - taper `g -> 1` smoothly by or before `Rinf`,
   - and use the same ring geometry in the readouts and explanation text.

2. Keep gravity global but relabel the ring honestly:
   - present it as a guide ring rather than an influence boundary,
   - and explain in the info text that the effect extends beyond it.

Option 1 is the cleaner teaching model.

Acceptance criteria:

- The visible ring system and the actual time-dilation model tell the same story.
- A user can infer from the display where the mathematically important zone begins and ends.

#### G6. The app does not clearly disclose the hybrid GR approximation it is using

Severity: Medium

Locations:

- `gravrel.html:413-416`
- `gravrel.html:447-450`
- `gravrel.html:707-755`

What is wrong:

- The info text says only that the map is schematic, the mission clock is a far-away reference clock, and the routes are drawn by hand.
- It does **not** explain that:
  - `sqrt(1 - r_s / r)` is the exact Schwarzschild factor only for stationary clocks outside one isolated non-rotating mass;
  - multiplying several such factors is a teaching heuristic, not exact multi-body GR;
  - the extra `1 / gamma` factor is exact only if `beta` is interpreted as a local speed relative to static shell observers.

Inference from sources:

- MIT’s Schwarzschild notes explicitly describe shell clocks at fixed `r` and their slowdown relative to a far-away clock.
- The statement about the product `g / gamma` being exact only for local shell-frame speed is the standard local-inertial-frame inference from that shell-clock relation plus special relativity. It is not stated in the code today.

Why this matters:

- The current wording makes the model sound more exact than it is.
- For an educational relativity app, that is a scientific-honesty issue, not just a UX issue.

Required fix:

- Expand the bilingual info text so it explicitly states:
  - real star distances, schematic encounter map;
  - Schwarzschild-like single-hole time-dilation factor;
  - special-relativistic speed factor;
  - multi-hole factor multiplication as a heuristic;
  - whether the displayed `r_s` and mass units are literal or schematic after G2 is fixed.

Acceptance criteria:

- A scientifically literate reader can tell from the in-app text alone which parts are exact single-hole physics and which parts are teaching approximations.
- The app no longer implies exact GR for multiple black holes or arbitrary hand-drawn trajectories.

## Recommended implementation order

1. Fix the mass/unit model and endpoint keep-out together, because those two issues are conceptually linked.
2. Replace midpoint-only route checks with true segment-circle distance checks and real hysteresis.
3. Stop returning physical timing data for invalid routes.
4. Make the outer influence ring match the actual physics model or relabel it honestly.
5. Rewrite the bilingual info text so the hybrid approximation is explicit.
6. Re-run the sanity checks below.

## Acceptance tests another agent should run after the fixes

- Verify that increasing displayed black-hole mass has a documented and defensible effect on the modeled `r_s` scale.
- Verify that a maximum-mass black hole cannot be dragged close enough to place Earth or the destination inside the app’s intended strong-gravity neighborhood.
- Verify that if a route segment intersects `r_safe`, the route is always marked invalid even when the segment midpoint lies outside the safety circle.
- Verify that the minimum-distance readout matches the true minimum segment-circle distance, not the midpoint distance.
- Verify that invalid routes do not display or retain physical mission/pilot times.
- Verify that the visible outer influence ring means what the math says it means.
- Verify that with a black hole placed far from both routes, pilot times approach the special-relativistic baseline `T_ref / gamma`.
- Verify that at fixed speed and valid geometry, moving a route monotonically closer to a black hole monotonically decreases pilot proper time.
- Verify that the English and Polish info text explicitly states the hybrid teaching-model boundary.

## Sources consulted

- MIT OpenCourseWare, `Schwarzschild metric & black holes` lecture notes
  - https://ocw.mit.edu/courses/8-033-relativity-fall-2006/resources/schwarzschild/
- Einstein Online, `Schwarzschild radius`
  - https://www.einstein-online.info/en/explandict/schwarzschild-radius/

## Bottom line

- The single-hole core formula and the constant-speed route integration are good enough for a teaching app.
- The current app is not scientifically solid because its endpoint assumptions, unit labeling, route-validity math, and approximation disclosure are not yet rigorous enough.
