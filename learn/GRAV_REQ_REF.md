# Gravity Assist Simulator: Refined Requirements

Reference implementation: `gravassist.html`

## 1. Purpose

This document refines the raw requirements for the Gravity Assist Simulator into an implementation-oriented specification for a coding agent.

The current application is an interactive single-file HTML simulator that:

- simulates a spacecraft flyby around a moving planet,
- renders the motion in the Sun frame on a canvas,
- lets the user control planet speed, planet mass, flyby distance, spacecraft speed, and animation speed,
- computes entry speed, exit speed, deflection angle, and speed gain/loss,
- already supports a crash state when the spacecraft intersects the planet.

Important implementation baseline for the future coding agent:

- By the time changes from this document are implemented, the application is expected to already include a feature that lets the user drag the spacecraft’s initial speed vector and set its direction.
- This document should therefore be interpreted against that newer baseline, not only against the current raw `gravassist.html` snapshot.

The goal of the requested work is to extend this simulator with:

- a game mode with a target to hit,
- clearer rendering order,
- improved close-approach visualization and collision rules,
- predefined Solar System planets,
- bilingual UI support matching the translation approach used in `mzinterferometer.html`.

This document describes the expected behavior. It does not prescribe exact code structure except where consistency with existing project patterns matters.

## 2. Scope

Implement changes only in the Gravity Assist Simulator and its directly related UI/content.

In scope:

- UI and UX changes inside `gravassist.html`
- game-mode logic
- target-hit detection
- rendering order fixes
- close-approach visualization improvements
- predefined planet selection
- localization for English and Polish

Out of scope unless needed for implementation:

- changes to unrelated experiments
- extracting the app into multiple files
- backend or storage features

## 3. Summary of Current Behavior

The implementation agent should understand the current baseline before changing it:

- The simulator numerically integrates a flyby trajectory in the planet rest frame and renders it in the Sun frame.
- The spacecraft starts from the upper-right side and approaches from right to left.
- `planetVel` changes the planet orbital motion and therefore changes the gravity-assist gain/loss.
- `impactParam` currently acts as the flyby distance control.
- A crash is currently detected when the simulated trajectory reaches the planet radius.
- The spacecraft is rendered after the trajectory, so at present it is already visually above the trajectory path, but this layering must remain explicitly correct after all changes.
- There is no game mode, no selectable real planets, and no localization system in this file.

Expected near-future baseline before this spec is implemented:

- There will already be a user-facing control for setting the initial spacecraft velocity vector direction.
- The implementing agent should integrate with that feature, not replace it unless the existing implementation is physically incorrect or unusable.

## 4. Functional Requirements

### 4.1 Add Game Mode: "Hit the Target"

The app must support a game/play mode in addition to the normal exploratory mode.

Required behavior:

- The system generates a target point that the spacecraft is supposed to reach after the gravity assist.
- The player must adjust trajectory-related controls to try to make the spacecraft hit that target.
- The raw requirement mentions three parameters:
  - initial velocity vector,
  - flyby distance,
  - spacecraft speed.
- When this specification is implemented, the initial velocity vector control is expected to already exist. The implementation work should therefore use that control as one of the main gameplay inputs.
- The game should be understandable for a child user. The target and success/failure states must be visually obvious.

Mode behavior:

- Exploratory mode should remain available.
- Game mode should introduce target generation and result evaluation.
- Starting a new game should generate a new target and reset any previous result state.
- Replay should replay the current attempt, not generate a new target automatically.
- There should be a separate explicit action for "new target" / "new challenge".

Target rules:

- The target must be placed in a region that is realistically reachable using the simulator controls.
- The target should be evaluated in the same rendered reference frame the user sees during play.
- The target should not be placed inside the planet or in an obviously impossible location.
- The target should remain fixed during a given attempt.

Hit detection:

- Define a clear tolerance radius for a successful hit.
- Success is achieved when the spacecraft trajectory passes within the target tolerance radius.
- If the spacecraft finishes its trajectory without entering that tolerance radius, the attempt is a miss.
- Crash should be treated as failure, not success.

Result feedback:

- On success, show a celebration overlay.
- On failure by missing the target, show a miss overlay with a waving hand.
- On crash, preserve or extend the existing crash feedback. Crash must remain distinct from ordinary miss.
- Overlays should appear after the animation reaches the end state, not before.
- The user must be able to dismiss or reset the result state and try again.

### 4.2 Controls for Game Mode

The agent should expose the minimum set of controls needed for the game to match the raw requirement while staying consistent with the existing app.

Required adjustable gameplay controls:

- initial velocity vector or equivalent direction control,
- flyby distance,
- spacecraft speed.

Recommended interpretation:

- Reuse the already-implemented draggable initial velocity vector control.
- Keep the spacecraft speed control unless that capability has been folded directly into the vector control in a clear and child-friendly way.
- Keep the flyby distance control, but rename or reinterpret it if needed for physical correctness.

The implementation should avoid requiring the player to directly edit Cartesian vector components unless the UX remains simple.

### 4.3 Rendering Order

The spacecraft drawing layer must remain above vector/trajectory layers.

Acceptance requirement:

- At every animation frame, the spacecraft icon/sprite is visually rendered on top of the faint trajectory, bright trail, and velocity arrows.
- Any new game overlays or target markers must not accidentally obscure the spacecraft during normal flight unless this is intentional and clearly beneficial.

### 4.4 Improve Visualization for Very Small Flyby Distances

The raw issue is that at small distances the animation can appear as if the spacecraft passes through the planet even when the underlying parameters represent a valid gravity assist.

The implementation must improve the visual and/or physical handling of close approaches so that:

- a valid non-crashing assist does not visually look like a planet intersection,
- an actual crash remains possible and visually distinct,
- close approaches remain intuitive rather than misleading.

Required outcome:

- The UI must not allow a "safe" trajectory to be displayed as if it goes through the visible body of the planet.
- Crash visualization must remain supported as a separate case.

Acceptable implementation strategies:

- tie collision detection and safe-minimum flyby distance to the visible planet radius,
- enlarge the physical collision radius to match the rendered planet body,
- clamp or reject impossible/visually invalid near-surface flyby values,
- add a minimum safe-altitude model around the planet and expose crash only when that boundary is crossed,
- adjust camera, scaling, interpolation, and/or path smoothing if the issue is partly visual rather than purely physical.

Implementation constraint:

- The agent must not "solve" this by disabling crash behavior entirely.
- The final behavior must preserve two separate outcomes:
  - safe flyby,
  - crash.

### 4.5 Predefined Solar System Planets

The user must be able to select from predefined Solar System planets.

Required planet list:

- Mercury
- Venus
- Earth
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune

Behavior:

- Selecting a planet updates the simulation parameters associated with that planet.
- At minimum, the selected planet must change:
  - mass,
  - rendered size.

Data requirement:

- Planet masses and radii should be based on real-world relative values.
- The implementation does not need astrophysically exact real-scale simulation units, but the selected planets must be internally proportional to reality.
- "Proportional to reality" means larger/more massive planets should remain consistently larger/more massive than smaller terrestrial planets, and the ratios should not be arbitrary.

Practical scaling requirement:

- Because true astronomical ratios may be too extreme for this UI, the implementation may apply a monotonic visual scaling transform.
- If transformed scaling is used, the relative ordering and rough proportions must remain grounded in real data.
- The spec should be implemented with a clearly defined planet dataset rather than hardcoded ad hoc slider defaults.

UI expectations:

- Planet selection should be more prominent than the old free mass slider.
- If both a planet selector and manual mass override are kept, the relationship must be explicit.
- Preferred behavior: predefined planet selection replaces free mass editing in normal use.

### 4.6 Localization

Add translation support to the Gravity Assist Simulator in the same style as the project’s translated experiments, specifically following the approach used in `mzinterferometer.html`.

Required languages:

- English
- Polish

Required implementation pattern:

- Keep translations in-file in a structured `I18N` object or equivalent dictionary.
- Maintain current language in state.
- Provide a language toggle in the header area, consistent with the Mach-Zehnder experiment.
- Apply translations through a dedicated function that updates all text-bearing DOM elements.

Translate all user-visible text, including:

- page title,
- header title and subtitle,
- control labels,
- button labels,
- readout labels,
- status/info text,
- game mode labels,
- overlay messages,
- target/miss/success/crash messages,
- any new helper instructions.

Canvas-rendered labels must also respect the selected language.

Non-requirements:

- No need for URL-based locale routing.
- No need for browser-language auto-detection unless the implementation agent finds it trivial and non-invasive.

## 5. UX Requirements

### 5.1 Clarity for Children

The game variant is intended for a child user. The implementation should therefore prefer:

- obvious controls,
- short labels,
- strong visual success/failure feedback,
- minimal ambiguity around what the task is.

Additional control usability requirement:

- Every slider-based control must also provide explicit `-` and `+` buttons for stepping the value down or up.
- These buttons are required because the application will be operated by children and must remain easy to use on both desktop and touch devices.
- The buttons should be visually clear, large enough to tap comfortably, and should stay synchronized with the slider value and any numeric readout.

### 5.2 Preserve Educational Value

The existing simulator explains gravity assist as a physical phenomenon. The new design should preserve that educational value.

Required outcome:

- Exploratory mode should still let the user see how the planet’s motion changes the spacecraft speed.
- Game mode should feel like an extension of the same concept, not a separate unrelated mini-game.

### 5.3 Mobile Compatibility

The app is already responsive. New controls, overlays, and planet selection must remain usable on narrow screens.

## 6. Physics Review of the Current Implementation

This section documents the current physics model in `gravassist.html`, what is acceptable as a simplification, what is physically wrong, and how the implementation agent should correct it.

### 6.1 What the Current Physics Gets Basically Right

The current simulator already contains a usable core idea:

- It models the local flyby as two-body motion around a planet using an inverse-square gravitational acceleration.
- It integrates the spacecraft trajectory in the planet frame.
- It then converts the result to a Sun-frame visualization by combining the planet-frame spacecraft velocity with the planet motion.

That overall approach is a valid educational approximation if implemented consistently. It is essentially a patched-conic style local flyby model.

The implementation agent does not need to replace this with a full n-body solar-system integrator unless it is clearly beneficial. A corrected local flyby model is sufficient.

### 6.2 External Physics Basis Used for This Review

The review below is based on standard gravity-assist mechanics and was cross-checked against NASA sources:

- NASA Basics of Spaceflight: A Gravity Assist Primer
  - https://science.nasa.gov/learn/basics-of-space-flight/primer/
- NASA Cassini gravity assists overview
  - https://science.nasa.gov/mission/cassini/gravity-assists/

Key physical principle from those sources:

- In the planet-centered flyby, the spacecraft velocity vector is rotated by the planet’s gravity, but the far-away relative speed with respect to the planet remains the same before and after the encounter.
- The heliocentric gain/loss comes from vector addition with the planet’s own heliocentric velocity, not from creating or destroying energy in the planet frame.

### 6.3 Physics Mistakes That Must Be Corrected

#### 6.3.1 The Sun-frame motion is not dynamically self-consistent

Current behavior:

- The trajectory is integrated in a planet rest frame.
- After that, the planet is made to move on a curved circular arc using `orbitAngle()` and `planetPos()`.
- The Sun-frame spacecraft velocity is then computed by adding a rotating planet velocity vector in `toSunFrame()`.

Why this is wrong:

- A local patched-conic flyby assumes the planet frame is approximately inertial during the encounter.
- The current code does not keep the planet inertial in the Sun frame. It curves the planet trajectory after the fact.
- That means the app mixes two incompatible models:
  - planet-frame integration around a stationary planet,
  - Sun-frame reconstruction using a rotating planet velocity and curved orbit.
- Because of this mismatch, the displayed Sun-frame speed change depends partly on the arbitrary visualization choice `ORBIT_R = 1500`, not just on the flyby physics.

Observed consequence:

- Even if gravity is effectively removed, the Sun-frame speed changes because the app rotates the planet velocity direction over time.
- This is a real physics bug, not just a visual issue.

Concrete reproducible evidence from the current algorithm:

- If the same reconstruction logic is evaluated with gravity effectively removed, the reported Sun-frame speed still changes between the beginning and end of the encounter purely because the planet velocity vector rotates during the animation.
- Therefore part of the displayed "gravity assist" can come from presentation geometry rather than from gravity.

Required correction:

- If the app keeps the local patched-conic model, the planet’s heliocentric velocity vector must remain constant during the encounter.
- In that model:
  - planet position in the Sun frame should be `R_planet(t) = R0 + V_planet * t`,
  - spacecraft Sun-frame position should be `R_sc(t) = R_planet(t) + r_rel(t)`,
  - spacecraft Sun-frame velocity should be `V_sc(t) = V_planet + v_rel(t)`.
- Do not rotate the planet velocity vector during the local encounter unless solar gravity is also included consistently in the dynamics.

Alternative acceptable correction:

- Implement a full inertial heliocentric model including the Sun’s gravity and the planet’s orbital motion.
- This is acceptable but likely unnecessary for the educational scope. The simpler and preferred correction is a straight-line constant-velocity planet during the encounter.

#### 6.3.2 The displayed "speed in" and "speed out" are not asymptotic encounter speeds

Current behavior:

- `computeResults()` uses the very first stored point and the very last stored point of the integrated path.
- Those points are still at finite distance from the planet.
- The integration also stops early once the spacecraft is only back to roughly `0.9 * START_DIST`, not truly far away.

Why this is wrong:

- In a proper two-body flyby, the incoming and outgoing relative speeds at infinity, `|v∞,in|` and `|v∞,out|`, must be equal.
- The current readouts are taken while the spacecraft is still inside the planet’s gravitational well, so they include local gravitational potential effects.
- As a result, the app reports a nonzero speed change even in cases where the physics says the speed should be unchanged in the stationary-planet case.

Observed consequence:

- With the current default stationary-planet configuration, the app’s underlying model yields a positive difference between the finite-distance entry and exit speeds instead of zero.
- This directly contradicts the explanatory text that says a stationary planet only changes direction.

Concrete reproducible evidence from the current default setup:

- With `planetVel = 0`, `planetMass = 25`, `approachSpeed = 5`, and `impactParam = 80`, the current algorithm yields a finite-sample speed increase of about `+0.216` in its internal units even though a stationary planet should not provide a net speed boost.
- This error comes from reading speeds too close to the planet rather than from true asymptotic before/after states.

Required correction:

- Compute readouts from asymptotic states, not from arbitrary finite-distance samples.
- Acceptable approaches:
  - integrate much farther out until the planet’s influence is negligible,
  - or derive the asymptotic incoming/outgoing states from orbital energy and direction,
  - or explicitly store and use the incoming/outgoing hyperbolic-excess vectors `v∞,in` and `v∞,out`.

Recommended implementation:

- Treat the user-controlled pre-encounter state as an asymptotic incoming state.
- Compute the outgoing asymptotic state from the integrated orbit or from the hyperbola geometry.
- Display:
  - asymptotic Sun-frame speed before encounter,
  - asymptotic Sun-frame speed after encounter,
  - and their difference.

#### 6.3.3 The "flyby distance" slider is not actually flyby distance

Current behavior:

- The control labeled "Flyby Distance" is assigned directly to `impactParam`.
- In the code, this value is used as the initial vertical offset `y = -b` at finite start position `x = START_DIST`.

Why this is wrong:

- That quantity is not the actual closest-approach distance.
- It is also not the true hyperbolic impact parameter at infinity.
- It is only a finite-distance initial offset.
- Therefore the label is physically misleading.

Observed consequence:

- Changing mass or speed changes the actual closest approach for the same slider value.
- For example, a slider value of `80` does not mean the spacecraft passes `80` units from the planet center.

Concrete reproducible evidence:

- In one representative run of the current algorithm, a slider value of `80` produced a minimum radial distance of roughly `32.6` in the stationary-planet default case.
- This is strong evidence that the control is not representing actual flyby distance.

Required correction:

- If the control is meant to be "flyby distance", it must map to a physically meaningful quantity:
  - periapsis distance from the planet center,
  - or periapsis altitude above the planet surface.
- The preferred child-friendly interpretation is altitude above the surface.

Recommended implementation options:

- Use the desired periapsis altitude as the user input and derive the needed initial asymptotic geometry from it.
- Or, if the implementation keeps a more abstract control, rename it honestly to something like "incoming offset". This is less preferred because the raw requirement explicitly calls for flyby distance.

Strong recommendation:

- Replace the current parameterization with one based on:
  - incoming asymptotic velocity vector,
  - planet gravitational parameter,
  - desired periapsis altitude or periapsis radius.

#### 6.3.4 The collision boundary is inconsistent and causes penetration into the planet

Current behavior:

- The loop breaks only when `r < PLANET_RADIUS * 0.5`.
- Crash is later reported if the final stored point satisfies `lastR < PLANET_RADIUS`.

Why this is wrong:

- The simulation allows the spacecraft to move well inside the visible planet before stopping.
- The logic uses two different collision radii:
  - `0.5 * PLANET_RADIUS` for stopping,
  - `1.0 * PLANET_RADIUS` for the crash decision.
- This inconsistency is the direct reason the spacecraft can appear to pass through the planet even when the state is already considered a crash.

Required correction:

- Use one collision radius consistently for:
  - physical collision detection,
  - trajectory termination,
  - and rendered planet size or safe boundary.
- Detect impact when the trajectory crosses the collision radius, not after it has already moved deep inside.
- Interpolate the crossing point so the path ends at the surface instead of inside the planet.

If an atmosphere or safety buffer is introduced:

- It must be explicit and consistently applied.
- In that case define separate radii clearly:
  - rendered body radius,
  - solid-surface radius,
  - optional atmosphere or minimum-safe-altitude radius.

#### 6.3.5 Mass and radius are physically decoupled in a way that becomes wrong once real planets are introduced

Current behavior:

- Mass changes the gravitational parameter.
- The rendered planet radius is fixed as `PLANET_RADIUS = 12`.

Why this is wrong:

- Once predefined Solar System planets are added, radius and mass can no longer vary independently in an arbitrary way.
- A planet’s gravity, collision boundary, and visible size must be tied to the selected planet dataset.

Required correction:

- Each predefined planet must define at least:
  - gravitational parameter or mass,
  - physical radius,
  - rendered radius mapping.
- Collision checks and safe-flyby rules must use that planet-specific radius or an explicitly derived gameplay radius.

#### 6.3.6 The current relative-velocity formula is too narrow and must be updated to work with the already-implemented vector control

Current behavior:

- The code uses `vInfPlanet = vScSun + vp`.

Why this is only conditionally correct:

- It works only for the current hardcoded geometry where:
  - the spacecraft initially moves left,
  - the planet initially moves right,
  - and both are aligned along one axis.
- It is not a general gravity-assist formula.
- Once the user can set the initial velocity vector direction, this scalar addition is no longer physically correct.

Required correction:

- Use vector subtraction:
  - `v_rel,in = V_sc,in - V_planet`
- The integrated planet-frame state must be built from that vector, not from a scalar sum.
- The implementation agent should treat this as a required integration point with the already-existing drag-to-set-velocity feature.

### 6.4 Recommended Correct Physics Model for This App

To stay aligned with the educational purpose and avoid unnecessary complexity, the preferred implementation is:

1. Use a local patched-conic flyby in the planet frame.
2. Treat the planet as stationary in that local frame.
3. Treat the planet’s heliocentric velocity as constant over the short encounter.
4. Define the incoming spacecraft state using a real vector in the heliocentric frame.
5. Convert that to the planet frame with vector subtraction.
6. Parameterize the flyby using a meaningful quantity such as periapsis altitude, not finite-start offset.
7. Measure results using asymptotic incoming/outgoing states.

In that corrected model:

- the planet-frame incoming and outgoing `|v∞|` magnitudes are equal,
- the flyby changes direction in the planet frame,
- the heliocentric speed change comes from vector addition with the constant planet velocity,
- and a stationary planet produces no net heliocentric speed gain.

### 6.5 Optional Useful Formulas for the Implementing Agent

These formulas are provided as implementation guidance based on standard hyperbolic flyby mechanics.

Definitions:

- `mu`: planet gravitational parameter
- `rp`: periapsis radius from planet center
- `Rplanet`: planet radius
- `h`: periapsis altitude above the surface, so `rp = Rplanet + h`
- `vInf`: magnitude of incoming hyperbolic excess speed in the planet frame
- `b`: impact parameter at infinity
- `delta`: turn angle

Useful relations:

- `e = 1 + (rp * vInf^2) / mu`
- `delta = 2 * asin(1 / e)`
- `b = rp * sqrt(1 + (2 * mu) / (rp * vInf^2))`

These relations are useful if the UI is defined in terms of periapsis altitude but the integration still starts from a large finite distance.

### 6.6 Acceptance Criteria for the Physics Correction

The corrected implementation should satisfy all of the following:

- In the planet frame, the asymptotic incoming and outgoing speed magnitudes are equal for every non-crash flyby.
- In a stationary-planet case, the reported heliocentric speed gain is zero to within numerical tolerance.
- If the spacecraft barely misses the planet, the path stays outside the rendered collision boundary.
- If the spacecraft hits the planet, the path ends at the impact boundary rather than continuing inside it.
- The control labeled as flyby distance or closest approach corresponds to an actual closest-approach quantity, not to an arbitrary initial offset.
- With the already-implemented initial-direction control, the relative velocity is computed by vector subtraction, not scalar addition.

## 7. Technical Guidance for the Implementing Agent

These are guidance requirements, not rigid prescriptions:

- Keep the app as a single self-contained HTML file unless a strong reason emerges not to.
- Reuse the current simulation model where possible.
- Prefer extending current state and recomputation flow rather than rewriting the entire app.
- Keep replay behavior deterministic for the same inputs and same target.
- Ensure new UI state changes trigger recomputation or rerender only when needed.
- For game mode, evaluate success against the actual flown trajectory in the rendered frame, not against a simplified approximation if avoidable.

For localization, mirror the `mzinterferometer.html` pattern:

- `state.lang`
- `I18N` dictionary
- `applyTranslations()`
- header language toggle button

## 8. Open Design Decisions the Implementing Agent Must Resolve

The raw requirements do not define these precisely, so the implementation agent must make reasonable choices:

- exact UI for switching between exploratory mode and game mode,
- exact target placement algorithm,
- exact success tolerance radius,
- exact content/design of celebration and waving-hand overlays,
- whether to keep or remove the free mass slider after adding planet presets,
- exact visual/physics strategy for fixing near-surface flyby rendering.

Any chosen solution must satisfy the functional requirements above and remain simple to use.

## 9. Acceptance Criteria

The work is complete when all of the following are true:

- The app has a playable game mode with a generated target and clear success/failure evaluation.
- The player can influence the attempt with:
  - trajectory direction/vector control,
  - flyby distance,
  - spacecraft speed.
- Success shows a celebration overlay.
- Missing the target shows a waving-hand miss overlay.
- Crash remains a separate failure outcome.
- The spacecraft is always rendered above trajectory/vector layers.
- Safe close flybys no longer visually look like flying through the planet.
- The user can choose among predefined Solar System planets.
- Changing the selected planet changes mass and visible size using reality-based proportional data.
- The UI supports both English and Polish.
- All visible UI text and canvas labels are translated.
- The app remains usable on desktop and mobile layouts.

## 10. Suggested Implementation Order

Recommended order for the coding agent:

1. Add localization scaffolding.
2. Introduce planet dataset and planet selector.
3. Integrate the already-implemented initial velocity vector control into the corrected physics model.
4. Resolve close-approach/collision visualization rules.
5. Add game mode state, target generation, and hit detection.
6. Add success/miss overlays and final UI polish.
7. Verify mobile layout and translated canvas labels.
