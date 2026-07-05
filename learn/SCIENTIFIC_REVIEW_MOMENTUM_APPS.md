# Scientific Review: `momentum.html` and `angularmomentum.html`

Review date: 2026-04-12

Purpose: assess whether the physics and math used by the two apps are scientifically sound, identify real errors versus acceptable simplifications, and provide a fix-ready document another AI agent can act on without redoing the review.

## Executive summary

`momentum.html` is mostly solid scientifically. Its core 1D collision model is correct for elastic, partially inelastic, and perfectly inelastic collisions in an isolated system. The main issues are instructional and game-rule mismatches, not broken collision math.

`angularmomentum.html` has several important scientific and mathematical problems. The biggest ones are:

- the app displays `omega` in RPM while simultaneously presenting `L = I * omega` and SI-valued `L`, which makes the displayed equation numerically false on screen;
- the total moment of inertia omits the platform/base inertia even though the whole app is framed as a spinning platform demo;
- the game target generator uses ranges that depend on mass changes and zero base inertia, which creates unrealistic target RPM values and makes the instructions mathematically misleading.

## Method

- Read both source files directly.
- Checked implemented equations against standard textbook relations for momentum, angular momentum, moment of inertia, and conservation laws.
- Ran small local calculations to test whether the game generators produce reachable targets under the controls they claim the player should use.

## Governing physics that should be treated as the reference model

Linear momentum:

- `p = m * v`
- In an isolated system, total momentum is conserved.
- For a 1D collision with coefficient of restitution `e`, the final velocities come from combining momentum conservation with the restitution relation.

Angular momentum:

- For a rigidly rotating system, `L = I * omega`, with `omega` in `rad/s`.
- For point masses about a fixed axis, `I = sum(m_i * r_i^2)`.
- If net external torque is negligible, total angular momentum is conserved.
- If a rotating platform plus attached masses is the system, the total inertia must include the platform/base contribution as well as the movable masses.
- If `I` decreases while `L` stays constant, `omega` increases; rotational kinetic energy can also increase because work is done internally while pulling masses inward.

## Findings: `momentum.html`

### What is already correct

1. `momentum.html:399-412`
The collision solver is correct for 1D collisions with restitution `e`.

- `computeCollision(m1, v1, m2, v2, e)` matches the standard solution obtained from momentum conservation plus the restitution relation.
- `e = 1` gives elastic collisions.
- `e = 0` gives a perfectly inelastic/common-velocity result.
- Intermediate `0 < e < 1` values correctly model partially inelastic collisions.

2. `momentum.html:579-642`, `1347-1355`
Momentum readouts and bars use `p = m * v` consistently and total momentum is summed correctly.

3. `momentum.html:690-714`
The center-of-mass marker is computed correctly as the mass-weighted average position.

4. `momentum.html:1097-1127`
The sticky-collision handling is mathematically correct: once `e = 0`, both bodies move afterward with the shared velocity implied by momentum conservation.

### Issues to fix

#### M1. Game instructions are mathematically wrong/incomplete

Severity: Medium

Locations:

- `momentum.html:302-303`
- `momentum.html:323-324`
- `momentum.html:868-879`
- `momentum.html:1268-1293`

What is wrong:

- The English and Polish game text says the player should adjust Object A's velocity so Object B reaches the target speed.
- That is false in two ways:
  - the target object is random; half the time the target is A, not B;
  - the code also allows the player to change the non-target object's mass, and some generated targets require mass changes if the player were limited to velocity only.

Evidence:

- The generator picks `challengeTargetObj` randomly (`momentum.html:1268-1269`).
- When the target is A, object B is the launcher (`momentum.html:1285-1288`), so the fixed instruction text is wrong for that case.
- The player can change the selected non-target object's mass using the plus/minus buttons (`momentum.html:868-879`).
- I exhaustively checked all 800 hidden target-generator combinations (`fixedMass = 3..12`, `solLauncherMass = 3..12`, `solLauncherVel = 2..9`):
  - all are reachable if mass and velocity are both adjustable;
  - 354/800 are not reachable if the player keeps launcher mass fixed at 5 kg and only changes velocity.

Required fix:

- Decide on one rule set and make the code and text match.
- Preferred option: keep the game velocity-only, lock launcher mass during game mode, and generate only targets reachable with the allowed integer speed range.
- Alternative option: keep mass editing enabled and make the instruction dynamic, e.g. "Adjust the launch object's mass and velocity so target object X reaches Y m/s."

Acceptance criteria:

- The instruction text always names the correct launch object and target object.
- Every generated challenge is reachable using exactly the controls described to the player.

#### M2. Collision-type wording is imprecise for teaching purposes

Severity: Low

Locations:

- `momentum.html:288-290`
- `momentum.html:1252-1258`

What is wrong:

- The app labels the slider-controlled case as generic "Inelastic" and the slider as "Elasticity".
- Scientifically, the parameter being set is the coefficient of restitution `e`.
- "Sticky" is the special case `e = 0`, i.e. perfectly inelastic.

Why this matters:

- The implemented math is fine.
- The teaching language is looser than the model actually being used.

Required fix:

- Rename the slider label to `Coefficient of restitution (e)` or equivalent.
- Rename the middle mode to `Partially inelastic`.
- Keep `Elastic` for `e = 1` and `Sticky / perfectly inelastic` for `e = 0`.

Acceptance criteria:

- The UI terminology matches the actual physics parameter used in `computeCollision()`.

## Findings: `angularmomentum.html`

### What is already correct

1. `angularmomentum.html:428-458`
The movable weights are modeled as point masses with `I = sum(m * r^2)`. That is a valid idealization for the weights themselves.

2. `angularmomentum.html:455-458`
The internal conservation step `omega = L / I` is correct for an isolated system with fixed total angular momentum.

3. `angularmomentum.html:1133-1148`
While the weights are being moved inward or outward, the app updates `I` and `omega` continuously in a way that is consistent with angular-momentum conservation.

### Issues to fix

#### A1. The displayed equation `L = I * omega` is numerically false because `omega` is shown in RPM

Severity: High

Locations:

- `angularmomentum.html:237-240`
- `angularmomentum.html:304-317`
- `angularmomentum.html:471-472`
- `angularmomentum.html:680-687`
- `angularmomentum.html:1370-1373`

What is wrong:

- The app text explicitly teaches `L = I * omega`.
- `L` is displayed in `kg*m^2/s`.
- `I` is displayed in `kg*m^2`.
- `omega` is displayed in RPM, not `rad/s`.
- Therefore the numbers shown to the learner do not satisfy the equation as displayed.

Concrete example from the default state:

- Two 2 kg weights at `r = 100 px = 0.5 m` give `I = 2 * (2 * 0.5^2) = 1.0 kg*m^2`.
- The default spin is 30 RPM, which is `pi rad/s`.
- So `L = I * omega = 1.0 * pi = 3.14 kg*m^2/s`.
- The app shows approximately:
  - `I = 1.0 kg*m^2`
  - `omega = 30 RPM`
  - `L = 3.14 kg*m^2/s`
- A learner sees `1.0 * 30 != 3.14`, so the on-screen math is inconsistent.

Required fix:

- Make the displayed `omega` in the equation/readouts use `rad/s`.
- If you want to keep RPM for intuition, show it as a secondary value, e.g. `omega = 3.14 rad/s (30 RPM)`.
- Update all copy so the equation and units are aligned.

Acceptance criteria:

- To displayed precision, the readout satisfies `L ~= I * omega` using the displayed numbers.
- Any place that displays RPM also makes the conversion explicit rather than reusing the bare `L = I * omega` statement.

#### A2. The platform's own inertia is missing from the model

Severity: High

Locations:

- `angularmomentum.html:428-458`
- `angularmomentum.html:500-558`
- `angularmomentum.html:317`

What is wrong:

- The app is explicitly about a spinning platform with weights.
- `totalI()` only sums the movable weights.
- The platform body shown on screen has zero inertia in the model.

Why this is scientifically wrong:

- If the physical system is "platform + weights", the total moment of inertia must include both the platform/base and the weights.
- Omitting the base inertia exaggerates the change in angular speed and allows unrealistically large spin-up.
- The current model is not "conservation of angular momentum of a spinning platform"; it is "conservation of angular momentum of movable point masses only."

Required fix:

- Introduce a nonzero `baseI` term for the platform and any rigidly attached person/platform structure.
- Replace:
  - `I = sum(weights)`
- With:
  - `I = baseI + sum(weights) [+ optional self-inertia of each weight if modeled as extended objects]`
- Recompute all challenge ranges and visual scales using the new total `I`.

Implementation note:

- If you do not want to expose platform mass in the UI, a fixed pedagogical constant is still much better than `0`.
- If you keep the drawn platform radius as the implied physical radius, pick a plausible base inertia and document that it represents the platform plus rider.

Acceptance criteria:

- Pulling weights inward still increases angular speed, but by a factor consistent with a nonzero base inertia.
- The app can no longer produce absurd spin increases from a visually large platform with supposedly zero rotational inertia.

#### A3. The game target generator is based on the wrong reachable-state space and produces unrealistic targets

Severity: High

Locations:

- `angularmomentum.html:317-318`
- `angularmomentum.html:1258-1312`
- `angularmomentum.html:1325-1328`

What is wrong:

- The game text says: "Drag the weights to make the platform spin at the target angular velocity."
- The generator does not use the reachable range from dragging the current masses radially.
- Instead it assumes every free weight can vary anywhere from 1 kg to 20 kg and from `r_min` to `r_max`:
  - `IfreeMin = numFree * 1 * rMin^2`
  - `IfreeMax = numFree * 20 * rMax^2`

Consequences:

- The stated puzzle is often not solvable by dragging alone.
- The target RPM can become extremely large because:
  - base/platform inertia is zero;
  - free masses are allowed to shrink to 1 kg in the target-range calculation even if the displayed current masses are much larger.

Local check:

- I simulated 20,000 random generated challenges using the current generator.
- About 58.5% of them were not reachable by radial dragging alone with the masses held fixed at their currently displayed values.
- I also sampled 50,000 generated targets:
  - median target about 225 RPM
  - 95th percentile about 4369 RPM
  - maximum sampled target about 19,208 RPM

Those values are not appropriate for a teaching app depicting a human-scale rotating platform.

Required fix:

- Choose the intended game mechanic and generate targets from that mechanic only.

Option 1: radial-only game (recommended)

- Lock mass changes in game mode.
- Compute reachable `I` using the actual free-weight masses:
  - `IfreeMin = sum(m_i * rMin^2 for free weights)`
  - `IfreeMax = sum(m_i * rMax^2 for free weights)`
- Include `baseI` in both bounds.
- Generate targets only from the resulting actual `omega` range.
- Update the text to say "Drag the free weights inward/outward."

Option 2: radius+mass game

- Keep mass editing available.
- Make mass controls explicit in the instructions.
- Still include `baseI`.
- Add a realistic cap on target RPM to keep scenarios human-scale.

Acceptance criteria:

- Every generated target is reachable using exactly the controls described in the UI.
- Target RPM stays within a plausible pedagogical range after the base inertia fix.

#### A4. Mass changes are treated as if they preserve angular momentum

Severity: Medium

Locations:

- `angularmomentum.html:932-937`

What is wrong:

- When the user clicks plus/minus on a weight, the code changes the mass and then immediately calls `conserveL()`.
- That models arbitrary mass addition/removal as though it were an internal redistribution that must preserve `L`.
- That is not the same physical process as pulling existing masses inward on a frictionless rotating stool.

Why this matters:

- Radial repositioning of existing masses is a classic angular-momentum-conservation demo.
- Changing the masses themselves is a different process and should not silently reuse the same conservation step unless the app gives a very explicit idealization for how the mass change occurs.

Required fix:

- Treat mass editing as a pre-run configuration change, not as a live conservation event.
- When mass changes:
  - either disable it in the live demo/game entirely;
  - or recompute the scenario from the chosen initial angular speed using `initPhysics()` rather than preserving the previous `L`.

Acceptance criteria:

- Changing a weight's mass does not masquerade as the same physical process as moving a weight radially inward.

#### A5. `resetSim()` destroys the current challenge/scenario definition

Severity: Medium

Locations:

- `angularmomentum.html:1222-1234`

What is wrong:

- Reset rebuilds all weights as identical free weights with mass `state.weightMass`.
- It drops per-weight masses and removes any `fixed` flags.
- In game mode this can invalidate the very challenge that was generated.

Why this matters scientifically:

- After reset, the displayed target is no longer tied to the scenario from which it was generated.
- That breaks the mathematical integrity of the challenge.

Required fix:

- Preserve the full generated scenario on reset, including:
  - all masses
  - all radii
  - fixed/free flags
  - initial angular speed
- Or, if reset is meant to start a new challenge, call `generateTarget()` explicitly instead of silently rebuilding a different system under the same target.

Acceptance criteria:

- Reset never leaves the user with a target that was computed for a different physical configuration.

#### A6. The green `L` bar is not scaled to the actual numerical angular momentum

Severity: Low

Locations:

- `angularmomentum.html:727-739`

What is wrong:

- The `L` bar width is hard-coded to a constant:
  - `const lBarW = BAR_MAX_W * 0.7`
- So the green bar does not represent magnitude across scenarios.

Why this matters:

- Within a single run, it visually communicates constancy.
- Across different masses and initial spin settings, it is misleading because the bar stays the same length even when the numeric `L` changes.

Required fix:

- Either scale the `L` bar from the actual numeric value, or clearly relabel it as a constant/reference indicator rather than a magnitude bar.

Acceptance criteria:

- The bar chart semantics are consistent across all three quantities.

## Recommended implementation order

1. Fix `angularmomentum.html` unit consistency first.
2. Add nonzero platform/base inertia and propagate it through `totalI()`, `initPhysics()`, `conserveL()`, and the game target generator.
3. Decide whether angular game mode is radial-only or radial+mass, then make generator logic and text match.
4. Remove or redesign live mass edits in `angularmomentum.html`.
5. Fix `resetSim()` in `angularmomentum.html`.
6. Fix `momentum.html` game instructions and, if desired, improve collision terminology.

## Acceptance tests another agent should run after the fixes

For `momentum.html`:

- Verify that elastic, partially inelastic, and sticky collisions still conserve total momentum to within display rounding.
- Verify that every generated game target is reachable with the controls the UI says the player should use.
- Verify that the instructions name the correct launch object and target object for both target-A and target-B cases.

For `angularmomentum.html`:

- Verify that the displayed numbers satisfy `L ~= I * omega` using displayed units.
- Verify that moving weights inward with fixed mass increases `omega` according to
  - `(I_base + sum(m_i * r_i_before^2)) * omega_before`
  - `=`
  - `(I_base + sum(m_i * r_i_after^2)) * omega_after`
- Verify that target generation never produces an unreachable target under the allowed controls.
- Verify that reset preserves the generated challenge scenario or intentionally creates a fresh one.
- Verify that target RPM values remain pedagogically plausible after the base inertia fix.

## Sources consulted

- OpenStax Physics, "8.2 Conservation of Momentum"
  - https://openstax.org/books/physics/pages/8-2-conservation-of-momentum
- OpenStax College Physics 2e, Chapter 8 outline for elastic and inelastic one-dimensional collisions
  - https://openstax.org/books/college-physics-2e/pages/8-introduction-to-linear-momentum-and-collisions
- OpenStax University Physics Volume 1, "10.4 Moment of Inertia and Rotational Kinetic Energy"
  - https://openstax.org/books/university-physics-volume-1/pages/10-4-moment-of-inertia-and-rotational-kinetic-energy
- OpenStax University Physics Volume 1, "11.3 Conservation of Angular Momentum"
  - https://openstax.org/books/university-physics-volume-1/pages/11-3-conservation-of-angular-momentum
- OpenStax College Physics 2e, "10.5 Angular Momentum and Its Conservation"
  - https://openstax.org/books/college-physics-2e/pages/10-5-angular-momentum-and-its-conservation

## Bottom line

- `momentum.html`: the collision physics is good; fix the game instructions/rules so they match the actual solvable space.
- `angularmomentum.html`: do not ship as scientifically solid until the unit mismatch, missing platform inertia, and target-generator/model inconsistencies are fixed.
