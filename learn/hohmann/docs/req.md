# Hohmann Transfer Game: Requirements

Reference interaction/style baseline: `gravassist/index.html`

Target file: `hohmann/index.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other learn apps in this folder,
- prefer the existing patterns already visible in files such as `gravassist/index.html`, `gravlens/index.html`, `mzinterferometer/index.html`, `doubleslit/index.html`, `waveinterference/index.html`, `momentum/index.html`, `angularmomentum/index.html`, `logigate/index.html`, and `copernicus/index.html`,
- if this document leaves a low-level implementation detail unspecified, inherit the established project convention rather than inventing a new one,
- `gamgen/index.html` is explicitly **not** a baseline for code structure or visual style here and should be ignored when choosing conventions for this app.

## 1. Purpose & Educational Goal

This app is a timing-and-burn game that teaches the basic idea of a Hohmann transfer. The player chooses a home planet and a destination planet. The spacecraft begins in a visible parking orbit around the home planet. The player must:

- wait until the planets are in the correct launch alignment,
- press and hold the `Engine` button for the correct duration for the departure burn,
- coast along the transfer path,
- then press and hold the same `Engine` button again for the correct circularization burn at the destination.

The goal is not to steer the spacecraft by hand. The burn direction is automatic. The challenge is understanding that a successful transfer depends on:

- launching at the right moment,
- giving the first burn the right amount of delta-v,
- and giving the second burn the right amount of delta-v to enter a stable orbit around the destination.

The educational goal is to make four ideas intuitive:

- a Hohmann transfer uses two main burns,
- the destination planet must be in the right place when you arrive,
- inward and outward transfers need different timing,
- and "close" is not enough: a stable orbit requires a proper capture burn.

## 2. Target Audience

Children aged 10-16 and curious adults. The app assumes no prior knowledge of orbital mechanics, transfer ellipses, or phase angles. The interaction should feel readable through play:

- one obvious main action,
- short labels,
- strong visual feedback,
- and a visible difference between a good transfer, a near miss, and a failed miss.

## 3. Scope

A single self-contained HTML file (`hohmann/index.html`) in the `learn/` directory. Dark theme per `CLAUDE.md`. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- top-down heliocentric 2D view of the selected mission
- approximate real elliptical planetary orbits for visual realism
- home and destination selection across all eight planets, with unplayable extreme pairs disabled
- visible parking-orbit inset around the home or destination planet
- three difficulty levels
- launch-window timing challenge
- hold-to-burn duration challenge for both burns
- child-friendly readouts and hints
- success / close miss / far miss result feedback in the same family as the other learn games

Out of scope:

- exact n-body dynamics
- plane changes or orbital inclination gameplay
- gravity assists
- low-thrust propulsion
- fuel depletion, staging, or rocket mass equations
- exact patched-conics mission design
- a long article-style educational explanation panel; only short in-app prompts are required here
- backend features or multi-file architecture

## 4. Concept Explanation

### 4.1 What The App Teaches

A Hohmann transfer is the classic fuel-efficient way to move between two coplanar or nearly coplanar orbits using two main burns:

- the first burn leaves the original orbit and enters a transfer ellipse,
- the second burn adjusts the spacecraft speed at the far end of that ellipse so the spacecraft matches the destination orbit.

If the player launches too early, too late, or burns for the wrong duration, the spacecraft reaches the wrong place or reaches the right distance with the wrong speed.

### 4.2 Why Launch Timing Matters

The destination planet keeps moving while the spacecraft is in flight. That means the destination cannot simply be "on the other side" when the transfer starts. It must start with the correct angular lead or lag so that it arrives at the transfer-intercept point at the same time as the spacecraft.

This is the app's main timing lesson:

- the engine is not enough,
- the launch window matters.

### 4.3 Why Two Burns Matter

Many children will expect that one strong push should be enough. The app should visibly counter that idea:

- the first burn changes the orbit,
- the second burn makes the spacecraft stay at the destination.

Without the second burn, the spacecraft should pass through the destination region and continue on a wrong orbit rather than magically stopping there.

### 4.4 Why The Parking Orbit Is Shown In An Inset

A parking orbit around a planet is tiny compared with the size of the Solar System. Showing it at literal Solar-System scale would make it invisible. The app should therefore use:

- a main Sun-centered mission view for interplanetary motion,
- and a stylized zoomed local inset for the parking orbit around the current planet.

This inset is a teaching aid, not a literal scale rendering.

### 4.5 Why The Orbits Look Realistic But The Transfer Math Is Still Simplified

The planets should be drawn on approximate real elliptical heliocentric orbits so the Solar System does not look falsely circular. However, the gameplay target is still the textbook Hohmann transfer, which is classically defined between circular coplanar reference orbits.

The implementation must therefore be honest about the compromise:

- planetary motion is rendered on approximate real ellipses,
- but the transfer solution, target phase window, and burn targets are computed from each planet's semi-major axis as the circular teaching reference.

This is acceptable because the app's purpose is to teach the core idea of Hohmann transfers, not to solve arbitrary real-world interplanetary mission design.

Important honesty requirement:

- the app must not present itself as a high-fidelity mission planner,
- and the local parking-orbit departure / capture views must be presented as symbolic teaching views layered on top of the heliocentric transfer game.

## 5. Physics Model

### 5.1 Coordinate System And Units

Use a top-down heliocentric 2D model:

- the Sun is at the origin,
- `x` increases to the right,
- `y` increases upward,
- all interplanetary motion is in one plane.

Use relativistic-free astronomical teaching units:

- distance: astronomical units (`AU`)
- time: years for mission calculations, with child-facing displays free to show days / months / years
- angle: radians internally, degrees only for display

Use the standard Solar gravitational parameter in these units:

```text
mu_sun = 4 * pi^2  AU^3 / year^2
```

This makes Kepler's third law convenient:

```text
T^2 = a^3
```

for orbital period `T` in years and semi-major axis `a` in AU.

### 5.2 Planet Dataset

Use approximate real orbital parameters for the eight planets:

| Planet  | Semi-major axis a (AU) | Eccentricity e | Period T (years) |
|---------|------------------------|----------------|------------------|
| Mercury | 0.3871                 | 0.2056         | 0.2408           |
| Venus   | 0.7233                 | 0.0068         | 0.6152           |
| Earth   | 1.0000                 | 0.0167         | 1.0000           |
| Mars    | 1.5237                 | 0.0934         | 1.8809           |
| Jupiter | 5.2029                 | 0.0484         | 11.862           |
| Saturn  | 9.5367                 | 0.0539         | 29.457           |
| Uranus  | 19.1892                | 0.0473         | 84.01            |
| Neptune | 30.0699                | 0.0086         | 164.8            |

Additional rendering data may include:

- approximate longitude of perihelion for each orbit,
- fixed initial phase offsets,
- planet color / size metadata,
- label names in English and Polish.

Recommended source-of-truth for implementation:

- JPL SSD `Approximate Positions of the Planets` for Keplerian elements such as `a`, `e`, `L`, and longitude of perihelion,
- NASA NSSDCA Planetary Fact Sheet for child-friendly cross-checks of orbital periods and public-facing summary values.

Important startup requirement:

- the initial configuration does not need to match a real calendar date,
- but the planets must not all begin aligned in a straight line,
- and the starting phases should create readable spacing rather than clutter.

### 5.3 Planet Position Computation

Planet positions should use the same general Kepler-solver approach already required in `copernicus/docs/req.md`, extended to all eight planets.

For each planet:

1. Compute mean motion:

```text
n = 2 * pi / T
```

2. Compute mean anomaly:

```text
M = wrap(M0 + n * t)
```

3. Solve Kepler's equation iteratively:

```text
M = E - e * sin(E)
```

4. Compute the orbital-plane position:

```text
x' = a * (cos(E) - e)
y' = a * sqrt(1 - e^2) * sin(E)
```

5. Rotate by the chosen longitude of perihelion if that data is included:

```text
x = x' * cos(varpi) - y' * sin(varpi)
y = x' * sin(varpi) + y' * cos(varpi)
```

This produces approximate real heliocentric ellipses for the visual model.

### 5.4 Valid Mission Pairs

All eight planets should be selectable in the UI, but only neighboring-orbit pairs should be playable. This avoids extreme scale jumps and keeps the missions visually readable.

Required playable pairs:

| Home    | Allowed Destination(s) |
|---------|-------------------------|
| Mercury | Venus                   |
| Venus   | Mercury, Earth          |
| Earth   | Venus, Mars             |
| Mars    | Earth, Jupiter          |
| Jupiter | Mars, Saturn            |
| Saturn  | Jupiter, Uranus         |
| Uranus  | Saturn, Neptune         |
| Neptune | Uranus                  |

The UI may implement this by:

- filtering the destination list based on the current home planet,
- or disabling unplayable destinations with a short explanation.

Same-planet transfers are not allowed.

### 5.5 Hohmann Reference Transfer

For the teaching transfer solution, use the circular-reference orbits defined by the planets' semi-major axes:

```text
r1 = a_home
r2 = a_destination
a_transfer = (r1 + r2) / 2
```

Circular-orbit speeds:

```text
v_circ_1 = sqrt(mu_sun / r1)
v_circ_2 = sqrt(mu_sun / r2)
```

Transfer-ellipse speeds at departure and arrival:

```text
v_trans_1 = sqrt(mu_sun * (2 / r1 - 1 / a_transfer))
v_trans_2 = sqrt(mu_sun * (2 / r2 - 1 / a_transfer))
```

Required burn magnitudes:

```text
deltaV1 = abs(v_trans_1 - v_circ_1)
deltaV2 = abs(v_circ_2 - v_trans_2)
```

Important interpretation note:

- these are **heliocentric reference** delta-v values between ideal circular Sun-centered orbits,
- they are not the full departure-from-planet and capture-into-planet mission delta-v budget of a real patched-conics interplanetary mission.

Transfer time:

```text
t_transfer = pi * sqrt(a_transfer^3 / mu_sun)
```

Equivalent convenient form in these units:

```text
t_transfer = 0.5 * a_transfer^(3/2)   years
```

### 5.6 Phase-Angle Requirement

Let:

```text
n2 = sqrt(mu_sun / r2^3)
```

The ideal initial destination phase relative to the home planet is:

```text
phi_target = wrap(pi - n2 * t_transfer)
```

Interpretation:

- if `phi_target > 0`, the destination starts ahead of the home planet,
- if `phi_target < 0`, the destination starts behind the home planet.

The gameplay must compare:

- the current phase angle between destination and home,
- against the target phase angle for the selected mission pair.

The smallest wrapped angular difference is the phase error.

### 5.7 Burn-Duration Model

The player does not aim the engine. Burn direction is automatic and always correct for the current burn:

- burn 1: tangential prograde or retrograde as needed to enter the transfer ellipse,
- burn 2: tangential prograde or retrograde as needed to circularize at the destination.

Required interaction model:

```text
deltaV_actual = burnRate * holdTime
```

Where:

- `burnRate` is a single gameplay mapping constant or a tightly related pair of constants,
- `holdTime` is the real user press duration measured in seconds,
- `deltaV_actual` is compared with the required `deltaV1` or `deltaV2`.

Design requirement:

- target burn durations for all playable pairs should land in a human-playable range, approximately `0.5 s` to `2.5 s`,
- the mapping must be consistent rather than arbitrary per pair,
- the app may show a meter or target zone depending on difficulty.

### 5.8 Transfer And Capture Outcome Model

The app uses a hybrid educational model:

- the main interplanetary transfer is scored against the heliocentric Hohmann reference defined above,
- the local parking-orbit inset shows departure and capture in a symbolic planet-centered way for readability.

The app does not need exact patched-conics mission design, but it must preserve the correct teaching logic.

Required staged behavior:

1. Prelaunch stage:
   the spacecraft is shown in a circular parking orbit around the home planet in the local inset.

2. Burn 1 stage:
   the player applies a burn duration. The spacecraft enters:
   - the ideal Hohmann-like transfer if the burn is correct,
   - or a wrong heliocentric ellipse if the burn is too short or too long.

3. Cruise stage:
   the spacecraft follows the resulting heliocentric path while the destination planet keeps moving.

4. Arrival stage:
   burn 2 becomes available only once the spacecraft reaches the destination encounter corridor.

5. Capture stage:
   the second burn determines whether the spacecraft:
   - enters a stable circular destination parking orbit,
   - enters a visibly eccentric bound orbit,
   - or escapes / misses and continues away.

Important interpretation note:

- in a strict textbook Hohmann transfer, the second impulse circularizes with respect to the Sun-centered target orbit,
- in this app, burn 2 is presented as an arrival / capture burn in the destination vicinity,
- that capture outcome is a deliberate teaching abstraction rather than a full high-fidelity planet-centered orbital insertion solver.

Implementation requirement:

- a correct first burn but wrong launch timing should visibly miss the destination phase,
- a correct launch timing but wrong first burn should visibly hit the wrong orbit size,
- a good transfer without a good second burn should not count as success.

### 5.9 Difficulty Tolerances

The exact thresholds may be tuned in implementation, but the three difficulties must be meaningfully different.

Recommended starting tolerances:

| Difficulty | Phase success band | Burn success band per burn | Guide level |
|------------|--------------------|----------------------------|-------------|
| Easy       | about +/- 10 deg   | about +/- 15%              | high        |
| Medium     | about +/- 6 deg    | about +/- 9%               | medium      |
| Hard       | about +/- 3 deg    | about +/- 5%               | low         |

Recommended near-miss bands should be noticeably wider than the success bands so the app can distinguish:

- `success`
- `close miss`
- `far miss`

### 5.10 Numerical Stability And Safety

The implementation must never produce `NaN`, `Infinity`, negative transfer times, frozen state transitions, or broken result logic.

Required safeguards:

- clamp wrapped angles to a stable interval such as `[-pi, +pi]`,
- cap animation-frame `dt` so tab sleep does not skip entire mission phases,
- cap Kepler iteration count and use convergence tolerance,
- clamp progress variables to valid ranges,
- never rely on exact floating-point equality for "arrival" or "perfect burn" checks,
- ensure the `Engine` button cleanly ends a burn on pointer release, pointer cancel, or lost focus,
- ensure impossible second-burn states do not appear before the destination encounter is actually reached.

## 6. Functional Requirements

### 6.1 Scene Layout

The app uses the established learn-app layout:

- header with title and language toggle,
- main area with canvas on one side and control panel on the other,
- responsive stack on narrow screens.

Inside the canvas:

- the main view is a Sun-centered top-down mission scene,
- home and destination orbital paths are always visible,
- the Sun is rendered clearly at the center,
- the spacecraft path and spacecraft sprite are visible during the active mission,
- a local parking-orbit inset appears as an anchored overlay within the canvas.

The main view should preserve the selected orbits' visual shape. Do not apply a non-linear radial compression that destroys the apparent ellipse geometry. Instead:

- use a mission-dependent camera scale that frames the selected pair comfortably,
- allow distant non-selected planets to be omitted or strongly de-emphasized,
- keep the local parking orbit entirely in the inset.

### 6.2 Planet Selection

Controls required:

- `Home` dropdown
- `Destination` dropdown
- `Difficulty` segmented control or buttons
- `Reset Mission` button

Selection behavior:

- all eight planets must be present in the home selector,
- the destination selector must update to only show allowed mission pairs,
- changing home or destination immediately recalculates transfer time, phase target, burn targets, and camera framing,
- changing either planet resets the mission to the prelaunch state.

### 6.3 Difficulty Levels

Required levels:

- Easy
- Medium
- Hard

Guide visibility should depend on difficulty.

Easy must show:

- the ideal reference transfer ellipse before launch,
- a clear launch-window indicator,
- burn meters with visible target zones for both burns,
- a visible destination encounter / capture cue,
- wide forgiving tolerances.

Medium should show:

- a phase indicator and basic burn guidance,
- fewer explicit target markings than Easy,
- moderate tolerances.

Hard should show:

- minimal pre-burn hints,
- no full "do exactly this" target bands,
- tight tolerances,
- post-attempt feedback still allowed so the player can learn from misses.

### 6.4 Prelaunch Phase

At mission start:

- the spacecraft is already in a circular parking orbit around the home planet,
- the local inset shows that parking orbit clearly,
- the main view shows the home and destination planets moving around the Sun,
- the player waits for the correct launch window.

Required prelaunch controls:

- `Play / Pause`
- time-warp control such as `x1`, `x10`, `x50`

Behavior requirement:

- prelaunch waiting must be fast enough that the player is not forced to sit through long real-time orbital motion,
- once the player begins burn 1, the app should automatically slow to the normal interaction speed if needed.

### 6.5 First Burn Interaction

The `Engine` button is the main gameplay control.

Required behavior:

- pressing and holding starts burn 1,
- the button must visibly look active while held,
- a burn-progress meter fills while the button is held,
- releasing the button commits the burn and ends burn 1,
- holding too long must overshoot rather than auto-stop at the correct target.

If the player launches:

- too early or too late, the app must show a wrong-intercept transfer,
- with too little burn, the transfer orbit must be too small,
- with too much burn, the transfer orbit must be too large.

### 6.6 Cruise Phase

After burn 1:

- the spacecraft travels along its heliocentric path in the main view,
- the ideal reference path may remain visible on Easy and optionally on Medium,
- if that reference path is shown, it should be clearly associated with the mission-reference semi-major-axis rings, not implied to be the exact minimum-energy path between the currently drawn osculating ellipses,
- the spacecraft should leave a readable trail or highlighted recent path segment,
- the destination planet continues moving during the transfer.

Cruise-time behavior:

- the app may automatically increase time speed during the long coast,
- but it must slow back down before the destination encounter so the player can perform burn 2,
- the transition into the arrival phase must feel readable, not abrupt or confusing.

### 6.7 Arrival And Circularization Burn

When the spacecraft reaches the destination encounter corridor:

- the app arms burn 2,
- the local inset switches to the destination planet,
- the same `Engine` button is reused for circularization.

Required burn-2 behavior:

- the player presses and holds `Engine` again,
- a second burn meter is shown,
- releasing the button commits burn 2,
- a correct burn places the spacecraft into a stable circular parking orbit around the destination in the inset.

If burn 2 is wrong:

- slightly wrong should show an eccentric local orbit or a clear unstable capture,
- badly wrong should show the spacecraft leaving / missing rather than pretending success.

### 6.8 Failure Behavior

The app should not treat failure as a crash-to-black or instant reset. It should let the player see what went wrong.

Required failure states:

- wrong phase: the spacecraft arrives ahead of or behind the destination,
- wrong burn 1 size: the transfer path is visibly too small or too large,
- wrong burn 2 size: the spacecraft fails to circularize,
- no second burn: the spacecraft passes through the destination region and leaves.

After a failed run:

- the app should remain in a readable final state,
- the player should be able to reset immediately,
- a short hint should explain the dominant error in child-friendly language.

### 6.9 Result Feedback

Result presentation should match the family of overlays already used in apps such as `gravassist/index.html`, `momentum/index.html`, and `angularmomentum/index.html`.

Required result categories:

- `success`
- `close miss`
- `far miss`

Recommended hint vocabulary:

- "Too early"
- "Too late"
- "Burn longer"
- "Burn shorter"
- "You reached the planet but did not capture"

The result overlay should appear only after the mission outcome is clear.

### 6.10 Child-Friendly Readouts

The control panel should keep labels short and avoid equation-heavy language.

Recommended live readouts:

- selected route, for example `Earth -> Mars`
- `Window`
- `Burn 1`
- `Trip Time`
- `Burn 2`
- `Status`

Acceptable child-facing status phrases:

- `Waiting`
- `Good window`
- `Too early`
- `Too late`
- `Cruising`
- `Ready to capture`
- `Orbit captured`
- `Missed`

Numeric displays should be simple:

- days or months for shorter transfers,
- years for longer transfers,
- optional percentage error on Medium / Hard only if it is actually helpful.

### 6.11 Local Parking-Orbit Inset

The inset is required, not optional.

It must:

- clearly show the current planet,
- show the parking orbit ring,
- show the spacecraft moving on that ring before launch and after successful capture,
- switch from home-planet view to destination-planet view at arrival.

The inset may also show:

- a highlighted burn point,
- engine flame or thrust arc,
- eccentric failed-capture orbit shapes.

### 6.12 Replay Flow

After any result, the player must be able to:

- reset the same mission quickly,
- keep the same home / destination / difficulty selection,
- and try again without reloading the page.

If the app includes an optional `Random Mission` button, it must respect the playable-pair rules above, but that button is not required.

## 7. UX Requirements

### 7.1 Clarity For Children

- one main action at a time
- large obvious `Engine` button
- short labels
- immediate visual response while the button is held
- phase timing and burn duration kept conceptually separate
- misses explained simply rather than mathematically

### 7.2 One-Button Core Interaction

The game's identity is that the player mainly uses one button well.

The design must therefore avoid diluting the core loop with extra manual controls such as:

- steering direction,
- angle selection,
- manual vector drawing,
- fuel-mixture management,
- or multi-step input dialogs.

### 7.3 Difficulty Readability

The player should understand that higher difficulty removes help rather than changing the physics.

This must be visible through:

- reduced guide overlays,
- tighter timing tolerance,
- more responsibility on the player,
- but the same underlying mission logic.

### 7.4 Time Control Quality

Waiting for a launch window is part of the lesson, but waiting must not become boring.

The time-warp controls should therefore:

- be obvious,
- be safe to use on touch devices,
- and make it easy to slow down again when the window approaches.

### 7.5 Mobile Compatibility

The layout must be responsive:

- desktop: canvas beside control panel
- narrow screens: canvas on top, control panel below

Touch requirements:

- the `Engine` button must be large enough to hold comfortably on mobile,
- time-warp buttons must remain tap-friendly,
- target size should be at least `44 x 44 px`, with the `Engine` button preferably larger.

### 7.6 Accessibility

- do not rely on color alone for result state
- active burn state must be visible through shape, motion, or label change
- important orbit lines must have enough contrast with the background
- labels must remain legible on mobile
- controls must work without hover

## 8. Visual Design

### 8.1 Overall Direction

Visually align with the existing space-focused apps in this folder. The app should feel like part of the same family:

- dark space background,
- glowing planets and Sun,
- readable orbital guides,
- clear game-state overlays,
- no radically different color language or UI structure.

Do not switch to a flat classroom worksheet look. This should still feel like a space game.

### 8.2 Main Scene Direction

Recommended main scene ingredients:

- dark starfield background with varied star brightness
- warm glowing Sun
- thin orbital guide lines
- bright highlighted home and destination planets
- clearly differentiated transfer path color
- small but readable spacecraft sprite with engine flame during burns

The planets should not be to literal size. Readability takes priority over physical scale.

### 8.3 Orbit Art

The planetary orbits should look approximately real:

- Mercury visibly eccentric
- Venus and Earth nearly circular
- Mars slightly eccentric
- the outer planets gently elliptical

This means the app should not draw all orbits as perfect circles just because the Hohmann reference model uses circular teaching radii.

If helpful, Easy mode may also show a thinner circular mission-reference ring at the selected planets' semi-major axes. That reference ring must be visually secondary to the actual orbit art.

### 8.4 Local Inset Direction

The inset should be visually clear and slightly stylized:

- enlarged current planet
- crisp parking orbit ring
- spacecraft icon readable at small size
- obvious difference between circular captured orbit and eccentric failed orbit

The inset should feel like a clean mission diagram, not a literal telescope image.

### 8.5 Motion

Recommended animation polish:

- smooth planetary motion
- gentle camera retargeting when the mission pair changes
- engine flame intensity while the button is held
- a readable transition into the transfer coast
- a satisfying circularization moment on success
- standard learn-app overlay animation for results

## 9. Localization

Bilingual English / Polish, consistent with the existing app pattern:

- `state.lang`
- `I18N` dictionary
- `applyTranslations()` function
- language toggle in the header
- canvas-rendered labels must also respect the selected language

All user-visible text must be translated, including:

- page title and subtitle
- control labels
- difficulty labels
- planet names
- button labels
- status labels
- hint messages
- result overlay messages

Planet names in Polish:

| English | Polish  |
|---------|---------|
| Mercury | Merkury |
| Venus   | Wenus   |
| Earth   | Ziemia  |
| Mars    | Mars    |
| Jupiter | Jowisz  |
| Saturn  | Saturn  |
| Uranus  | Uran    |
| Neptune | Neptun  |

Recommended Polish app title:

- `Transfer Hohmanna`

## 10. Technical Constraints

- single self-contained HTML file with inline CSS and JavaScript
- vanilla JavaScript only
- HTML5 Canvas for all rendering
- Google Fonts: Outfit + Share Tech Mono
- retina / device-pixel-ratio support
- `requestAnimationFrame` for animation
- responsive layout: canvas `flex: 1`, control panel about `300px`
- no external ephemeris service or library

Implementation preference:

- reuse the same orbital-solver pattern already present in `copernicus/index.html`,
- reuse the same overlay / feedback patterns already present in `gravassist/index.html` and related games,
- keep the app state machine explicit so the phases remain debuggable:
  `prelaunch -> burn1 -> cruise -> arrival -> burn2 -> result`

## 11. Open Design Decisions

The implementing agent must resolve:

- the exact global `burnRate` constant
- the exact tuned tolerance values after playtesting
- the exact starting phase offsets for the planets
- whether Easy shows semi-major-axis reference rings continuously or only while selected
- the exact encounter-corridor width that best balances readability and fairness
- the exact time-warp values if `x1 / x10 / x50` needs adjustment in practice
- the exact art treatment of the local parking-orbit inset

## 12. Acceptance Criteria

The app is complete when:

- the user can choose a home and destination from the allowed neighboring-planet mission pairs,
- all eight planets exist in the selection UI,
- the destination selector prevents impossible or intentionally disabled extreme pairs,
- the main view shows approximate real elliptical planetary orbits rather than all-circular art,
- the spacecraft visibly begins in a home-planet parking orbit shown in a local inset,
- the player must wait for a launch window before burn 1,
- the player uses the same `Engine` button for burn 1 and burn 2,
- holding the button too short or too long produces visibly different transfer outcomes,
- a wrong launch time with an otherwise correct burn still produces a miss,
- a good transfer without a good burn 2 does not count as success,
- a successful mission ends in a stable circular destination parking orbit,
- the three difficulty levels differ in guide visibility and tolerance,
- the result feedback uses the same broad interaction language as the other learn games: success / close miss / far miss,
- the layout remains usable on desktop and mobile,
- no allowed interaction produces `NaN`, `Infinity`, frozen state transitions, or impossible burn phases.

Numerical sanity checks for the circular-reference transfer solver:

Using:

```text
mu_sun = 4 * pi^2
```

Expected approximate Earth -> Mars reference values:

- `t_transfer ~= 0.709 years ~= 258.9 days`
- `phi_target ~= +44.3 deg`
- `deltaV1 ~= 2.94 km/s`
- `deltaV2 ~= 2.65 km/s`

Expected approximate Earth -> Venus reference values:

- `t_transfer ~= 0.400 years ~= 146.1 days`
- `phi_target ~= -54.0 deg`
- `deltaV1 ~= 2.50 km/s`
- `deltaV2 ~= 2.71 km/s`

Interpretation check:

- positive phase angle means destination ahead,
- negative phase angle means destination behind.

## 13. Suggested Implementation Order

1. Static layout, dark theme shell, control panel, and localization scaffolding
2. Planet dataset and Kepler-based orbit rendering
3. Mission-pair selection and camera framing
4. Prelaunch state with home-planet parking-orbit inset
5. Hohmann reference solver: transfer time, target phase, burn targets
6. Time-warp controls and launch-window indicator
7. Burn 1 hold interaction and wrong-transfer outcomes
8. Cruise animation and arrival detection
9. Burn 2 hold interaction and capture / miss outcomes
10. Difficulty-based guide system
11. Result overlay, hints, and replay flow
12. Mobile tuning, localization polish, and final testing

## 14. Scientific Review Of The Physics And Mathematics

### 14.1 Review Method

This design was reviewed against publicly available primary sources from NASA and JPL, then checked numerically with the standard two-body equations used by those sources.

Primary references used:

- NASA Science, `Chapter 4: Trajectories`
- NASA Science, `Hohmann Transfer Orbit`
- NASA Science, `Orbits and Kepler's Laws`
- JPL Solar System Dynamics, `Approximate Positions of the Planets`
- NASA NSSDCA, `Planetary Fact Sheet`

### 14.2 Overall Scientific Verdict

The design is scientifically sound as an **educational hybrid model** if it is described honestly.

Scientifically solid core:

- Hohmann transfer as the minimum-propellant two-impulse transfer between circular coplanar orbits
- launch-window timing because the destination keeps moving
- real-looking elliptical planetary orbits in the rendered Solar System
- a Kepler-solver-based visual model for planetary motion

Scientifically important simplifications:

- the scored transfer is based on circular reference radii derived from semi-major axes,
- the local parking-orbit departure and capture views are symbolic,
- the app is a teaching game, not a mission-design tool.

### 14.3 What The Sources Confirm

NASA's `Chapter 4: Trajectories` explicitly supports these design choices:

- a least-propellant Earth-to-outer-planet transfer is treated as a Hohmann transfer with perihelion at Earth's orbit and aphelion at the target orbit,
- inward transfers to Venus require reducing heliocentric orbital energy with a burn opposite Earth's orbital motion,
- getting to the planet itself requires correct timing because the target keeps moving,
- capture into planetary orbit requires an additional arrival deceleration relative to the target planet.

NASA's Dawn FAQ explicitly states that:

- Hohmann transfer orbits are the most propellant-efficient way to move between two circular coplanar orbits,
- two propulsive maneuvers are required,
- the first maneuver leaves the initial orbit and the second circularizes at the target orbit.

NASA's `Orbits and Kepler's Laws` and JPL's `Approximate Positions of the Planets` support:

- rendering planets on ellipses with the Sun at a focus,
- using Keplerian elements,
- solving Kepler's equation iteratively,
- and deriving positions from `a`, `e`, `L`, and longitude of perihelion.

### 14.4 The Main Scientific Caveat In This Design

The most important caveat is that a textbook heliocentric Hohmann transfer and a full planet-to-planet parking-orbit mission are not the same thing.

Specifically:

- the standard Hohmann `deltaV1` and `deltaV2` formulas describe velocity changes between ideal Sun-centered circular orbits,
- they do **not** by themselves include escape from a home-planet parking orbit or capture into a destination-planet parking orbit,
- real interplanetary missions therefore use patched-conics and planet-centered insertion logic on top of the heliocentric transfer.

For this app, the scientifically acceptable compromise is:

- keep the main scored transfer heliocentric and textbook,
- keep the home / destination parking-orbit inset as a symbolic teaching view,
- do not present the displayed burn values as full real mission budgets.

### 14.5 Review Of The Realistic-Orbit Choice

Using realistically shaped planetary ellipses for the art is scientifically defensible and visually valuable. However, the ideal transfer guide must be labeled by implication as a **reference** transfer, not as the exact minimum-energy path for the currently drawn osculating ellipses.

That means:

- the actual orbit art may be elliptical,
- the transfer scoring may still be based on circular semi-major-axis reference rings,
- the UI should never imply that these are identical mathematical objects.

### 14.6 Numerical Review

Using:

```text
mu_sun = 4 * pi^2  AU^3 / year^2
```

and JPL semi-major axes, the reference-transfer sanity checks are consistent with the values already given in this document.

Earth -> Mars reference transfer:

- `t_transfer ~= 0.7087 years ~= 258.9 days`
- `phi_target ~= +44.35 deg`
- `deltaV1 ~= 2.945 km/s`
- `deltaV2 ~= 2.649 km/s`

Earth -> Venus reference transfer:

- `t_transfer ~= 0.3999 years ~= 146.1 days`
- `phi_target ~= -54.03 deg`
- `deltaV1 ~= 2.495 km/s`
- `deltaV2 ~= 2.707 km/s`

These agree with the acceptance-section values to normal educational rounding.

### 14.7 Required Wording Guardrails

To stay scientifically honest, the implementation and any visible explanatory text should avoid these misleading claims:

- do not call the app an exact mission planner,
- do not describe `deltaV1` and `deltaV2` as the full real-world planet-to-planet mission delta-v,
- do not imply that the parking-orbit inset is shown at physical scale,
- do not imply that the drawn reference transfer is the exact optimal path between the currently rendered elliptical orbits.

Preferred wording:

- `reference transfer`
- `arrival / capture burn`
- `symbolic parking orbit view`
- `teaching model`

### 14.8 Final Scientific Conclusion

This design is educationally strong and scientifically defensible once the above caveat is made explicit.

Its strongest scientific features are:

- the correct emphasis on launch timing,
- the correct two-burn structure,
- a real-looking but computationally manageable Solar System,
- and a clear distinction between a good transfer, a timing error, and a failed capture.

The key condition is honesty about the model:

- heliocentric Hohmann reference for the main game,
- symbolic local parking-orbit presentation for readability,
- no claim of high-fidelity real mission design.
