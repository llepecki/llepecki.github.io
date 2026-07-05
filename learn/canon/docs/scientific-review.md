# Scientific Review: `canon/index.html`

Review date: 2026-04-12

Purpose: assess whether the physics and mathematics in `canon/index.html` are scientifically sound, identify real errors versus acceptable simplifications, and provide a fix-ready handoff document another AI agent can act on without redoing the review.

## Executive summary

`canon/index.html` is scientifically solid in its core projectile solver. The app uses the standard constant-gravity, no-drag parametric equations, decomposes launch speed into horizontal and vertical components correctly, computes flight time/range/apex correctly, and correctly keeps mass out of the trajectory while still letting mass affect weight, momentum, and kinetic energy.

The main scientific problems are not in the ballistic equations themselves. They are in target-mode game logic:

- hit detection is not using a single well-defined physical target model;
- the code can award hits after the projectile has already landed because collision checks are done on a post-impact sampled state with `y` clamped to ground;
- the rendered target size and the collision tolerance are expressed in different coordinate systems, so hit fairness changes with world/zoom;
- the miss hints are heuristic and can recommend the opposite of the physically correct angle change;
- mass-related readouts can stop referring to the projectile actually in flight because mass controls remain active during the shot.

Bottom line: the projectile physics is good, but target mode is not yet mathematically rigorous enough to call the whole app fully scientifically clean.

## Method

- Read `canon/index.html` directly and traced the physics/gameplay code paths.
- Checked the implemented equations against standard textbook projectile-motion formulas and Newton’s second law.
- Compared the world gravity constants to NASA planetary fact-sheet values.
- Ran local numerical checks for:
  - the default Earth/Moon examples,
  - the max-range scan used for target generation,
  - frame-step edge cases in target hit detection,
  - hint-logic counterexamples.

## Governing physics that should be treated as the reference model

For an ideal projectile launched from height `h0` with no drag and constant downward gravity `g`:

- `vx0 = v0 * cos(theta)`
- `vy0 = v0 * sin(theta)`
- `x(t) = vx0 * t`
- `y(t) = h0 + vy0 * t - 0.5 * g * t^2`
- `vx(t) = vx0`
- `vy(t) = vy0 - g * t`
- `t_apex = vy0 / g`
- `y_max = h0 + vy0^2 / (2g)`
- `t_hit = (vy0 + sqrt(vy0^2 + 2gh0)) / g`
- `range = vx0 * t_hit`

Mass interpretation in this model:

- `weight = m * g`
- `momentum magnitude = m * v0`
- `kinetic energy = 0.5 * m * v0^2`
- trajectory, flight time, maximum height, and range are independent of mass as long as:
  - drag is ignored,
  - the world is fixed,
  - `v0` and `theta` are fixed.

These are the equations another agent should preserve while fixing the issues below.

## Findings: `canon/index.html`

### What is already correct

1. `canon/index.html:514-542`, `559-578`
The core projectile equations are correct.

- `computeForecast()` uses the standard parametric constant-gravity model.
- `getBallPos()` and `getLaunchTHit()` use the same model again for animation and impact timing.
- The solver avoids dividing by `vx0`, `tan(theta)`, or `cos(theta)^2`, so `0 deg` and `90 deg` remain numerically stable.

Spot check using the current code’s model with `h0 = 2 m`, `v0 = 50 m/s`, `theta = 45 deg`:

- Earth (`g = 9.81`): `t_hit = 7.264152 s`, `range = 256.8265 m`, `y_max = 65.7105 m`
- Moon (`g = 1.62`): `t_hit = 43.705062 s`, `range = 1545.2073 m`, `y_max = 387.8025 m`

Those numbers are consistent with the standard equations.

2. `canon/index.html:431-437`
The gravity dataset is scientifically reasonable for a child-friendly constant-`g` simulator.

- Moon `1.62`
- Mercury `3.70`
- Venus `8.87`
- Earth `9.81`
- Mars `3.71`

These are acceptable approximations to standard published surface-gravity values.

3. `canon/index.html:537-542`, `1596-1624`, `1658-1679`
Mass is treated correctly in the underlying physics model.

- Trajectory points depend on `v0`, `theta`, `g`, and `h0`, not on mass.
- Weight, momentum, and kinetic energy correctly depend on mass.
- The ghost-arc behavior on mass change is scientifically helpful because it reinforces the correct “same arc in vacuum” lesson.

4. `canon/index.html:545-557`, `594-599`
The target generator’s max-range scan is scientifically defensible and safely conservative.

- Because `h0 > 0`, the exact max-range angle is slightly below `45 deg`.
- The code numerically scans angles from `0` to `90 deg` in `0.5 deg` increments instead of hard-coding `45 deg`.
- I checked this against a much finer scan and found the coarse scan underestimates the true max range by less than `0.002 m` at `V_MAX = 100 m/s` for all five worlds.
- Since targets are then generated only inside the `15%` to `85%` band, this scan is more than safe enough.

### Issues to fix

#### C1. Target hits can be awarded after the projectile has already landed

Severity: High

Locations:

- `canon/index.html:559-568`
- `canon/index.html:609-640`
- `canon/index.html:1287-1307`

What is wrong:

- `animate()` advances `state.simTime` before checking collisions.
- `checkHitDuringFlight()` then calls `getBallPos(state.simTime)`.
- `getBallPos()` clamps `y` with `Math.max(0, ...)`, but it does not clamp `x` at impact.
- On the frame after the true physical landing time, the code can therefore test a state where:
  - `y = 0` because of the clamp,
  - `x > true_range` because time has overshot impact.
- That allows the target check to succeed for a shot that never actually reaches the target in the physical model.

Concrete reproduction:

- Use Earth, `v0 = 50 m/s`, `theta = 45 deg`, `h0 = 2 m`.
- The true impact time is `7.2641516 s`.
- The true range is `256.8265436 m`.
- Set the target to `x = 263.8265436 m`, which is `7.0 m` beyond the true landing point.
- With the current `dt` cap of `0.05 s`, the animation can step from:
  - `t = 7.25 s`, where the projectile is still above ground,
  - to `t = 7.30 s`, where the code evaluates `x = 258.094 m`, `y = 0`.
- Because `|258.094 - 263.827| = 5.73 < HIT_TOL (6)`, the code can register a hit even though the target lies beyond the actual range.

Why this matters:

- This is not just a UI glitch. It is a direct mathematical contradiction of the very projectile model the app otherwise teaches correctly.
- A user can be rewarded for an impossible shot.

Required fix:

- Separate rendering clamping from physics/collision math.
- Keep an unclamped analytic position function for collision logic.
- Store both the previous simulation time and the new simulation time each frame.
- Collision-check only the segment from:
  - `t0 = previousSimTime`
  - to `t1 = min(state.simTime, t_hit)`
- Resolve landing before any post-impact collision test can occur.
- Never let target-hit logic inspect a time later than `t_hit`.

Acceptance criteria:

- No target strictly beyond the true physical range by more than the target’s half-width can ever register as a hit.
- Re-running the same shot at different frame rates produces the same hit/miss result.

#### C2. The visible target and the collision test are not defined in the same coordinate system

Severity: High

Locations:

- `canon/index.html:449-450`
- `canon/index.html:1013-1040`
- `canon/index.html:609-640`

What is wrong:

- The target art is drawn in fixed pixel dimensions.
  - The bullseye circles use fixed radii in pixels.
  - The flag pole and flag also use fixed pixel lengths.
- The collision test uses fixed world-space thresholds:
  - `|x - targetX| < 6`
  - `y < 12`
- Because camera scale changes with world/range, the same visible target corresponds to very different physical sizes in meters from one scenario to another.

Concrete evidence:

- For a `900 x 600` viewport with the default Earth shot, the current camera scale is about `2.71 px/m`.
  - A `15 px` bullseye radius is about `5.54 m`.
  - A `28 px` pole height is about `10.34 m`.
- For the default Moon shot, the camera scale is about `0.45 px/m`.
  - The same `15 px` radius is about `33.32 m`.
  - The same `28 px` height is about `62.19 m`.
- The collision test still uses `6 m` horizontal and `12 m` vertical tolerances in both cases.

Consequences:

- On Earth, the collision tolerance roughly matches the visible target.
- On the Moon, much of the visible target can be crossed without counting as a hit.
- Target difficulty changes with scale in a way that is unrelated to the projectile physics.
- The app is not using a single mathematically defined target object.

Implementation note:

- `TARGET_HALF_W = 5` exists, but it is not actually used to define a complete rendered-and-collidable target model.

Required fix:

- Choose one target definition and use it everywhere.

Preferred option:

- Define target dimensions in world units, for example:
  - `targetWidthM`
  - `targetHeightM`
  - optional bullseye radius in meters
- Draw the target by scaling those world dimensions through the same camera transform used for the projectile.
- Perform collision against the same world-space hitbox using segment-vs-shape intersection.

Alternative option:

- Keep the target purely screen-space, but then collision must also be performed in screen space against the exact rendered geometry.

Acceptance criteria:

- The object the player sees is the same object the code collides with.
- Changing world or zoom does not change hit fairness except through explicitly chosen target dimensions.

#### C3. Miss hints are not derived from the actual range function and can recommend the wrong angle change

Severity: Medium

Locations:

- `canon/index.html:616-633`

What is wrong:

- The miss-hint logic uses coarse rules such as:
  - short miss => “shallower angle”
  - long miss => “steeper angle”
- That is not generally valid.
- For projectile motion from nonzero launch height, range as a function of angle is not monotonic on `[0 deg, 90 deg]`.
- The correct advice depends on the current angle, the current speed, and the actual solver.

Concrete counterexample:

- Use Earth, `v0 = 50 m/s`, `h0 = 2 m`, `theta = 10 deg`.
- The current range is about `97.32 m`.
- Suppose the target is at `117.32 m`.
- The current code chooses `hintAngleDown` because the shot is short but not by a factor of two.
- But the actual solver says:
  - `5 deg` gives range about `60.87 m` and makes the miss worse.
  - `15 deg` gives range about `134.49 m` and moves toward the target.
- So the app recommends the opposite of the physically helpful angle change.

Why this matters:

- This is instructional content, not just cosmetic UX.
- The app can teach a wrong relationship between launch angle and range.

Required fix:

- Generate hints from the same solver used for the projectile.
- At minimum:
  - compare the current shot to one step shallower and one step steeper,
  - compare the current speed to one step faster and one step slower,
  - choose the hint that actually moves the landing point toward the target.
- Do not use hard-coded ratio heuristics as a substitute for the physics model.

Acceptance criteria:

- No hint tells the user to decrease angle when doing so makes the miss larger for the current world/speed.
- Hint direction is consistent with the actual solver within the UI step size.

#### C4. Mass readouts can stop referring to the projectile that is actually in flight

Severity: Medium

Locations:

- `canon/index.html:271-275`
- `canon/index.html:1336-1343`
- `canon/index.html:1405-1422`
- `canon/index.html:1573-1624`
- `canon/index.html:1658-1679`

What is wrong:

- `launch()` correctly freezes:
  - `launchSpeed`
  - `launchAngle`
  - `launchGravity`
  - `launchMass`
- But `updateButtons()` disables only speed/angle/world controls.
- The mass slider and mass step buttons remain active during `flying` and `paused`.
- That means the user can change mass during the shot.
- The ball on screen still uses `launchMass`, but the readouts update to `state.mass`.

Why this matters:

- The underlying trajectory physics is still okay because `launchMass` is frozen.
- The problem is scientific labeling: the UI stops clearly describing the projectile that is actually in the air.
- Weight, momentum, and kinetic-energy readouts can silently become “next-shot” values while the screen still shows the previous shot.

Required fix:

Preferred option:

- Disable mass controls during `flying` and `paused`, just like speed/angle/world controls.

Alternative option:

- Keep mass editable mid-flight, but split the readouts explicitly into:
  - current shot
  - next shot

Acceptance criteria:

- During an active shot, every displayed mass-related quantity refers either to the launched projectile or is explicitly labeled as a next-shot configuration.

## Recommended implementation order

1. Fix target collision math first:
   - remove post-impact false positives,
   - use segment-based collision over `[t0, t1]`,
   - stop using the clamped render position for physics decisions.
2. Define a single target model in one coordinate system and make both drawing and collisions use it.
3. Replace the heuristic hint rules with solver-based advice.
4. Freeze mass controls during active flight or clearly separate current-shot vs next-shot readouts.
5. Re-run the numerical sanity checks listed below.

## Acceptance tests another agent should run after the fixes

- Verify the default Earth setup still gives approximately:
  - `t_hit = 7.264 s`
  - `range = 256.8 m`
  - `y_max = 65.7 m`
- Verify the default Moon setup still gives approximately:
  - `t_hit = 43.705 s`
  - `range = 1545.2 m`
  - `y_max = 387.8 m`
- Verify that changing mass alone leaves:
  - trajectory shape,
  - flight time,
  - range,
  - max height
  unchanged to within display rounding.
- Verify that `0 deg` and `90 deg` launches remain finite and render correctly.
- Verify that a target placed beyond the true range cannot ever be counted as hit due to frame overshoot.
- Verify that hit/miss results are unchanged if the animation frame rate changes.
- Verify that the visible target and the collidable target coincide on Earth, Moon, and Mars.
- Verify that miss hints are locally correct by comparing the current shot to one UI step up/down in angle and speed.
- Verify that mass-related readouts during flight refer to the launched ball, or are explicitly labeled otherwise.

## Sources consulted

- OpenStax University Physics Volume 1, "4.3 Projectile Motion"
  - https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion
- OpenStax Physics, "5.3 Projectile Motion"
  - https://openstax.org/books/physics/pages/5-3-projectile-motion
- OpenStax College Physics for AP Courses, "4.3 Newton's Second Law of Motion: Concept of a System"
  - https://openstax.org/books/college-physics-ap-courses/pages/4-3-newtons-second-law-of-motion-concept-of-a-system
- NASA NSSDC, "Planetary Fact Sheet - Metric"
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/index.html

## Bottom line

- The projectile-motion math in `canon/index.html` is good.
- The gravity constants and mass-independence lesson are good.
- The app should not be treated as fully scientifically rigorous until target-mode collision math and solver-based hinting are fixed.
