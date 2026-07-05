# Gravitational Route Time Dilation Simulator: Requirements

Reference interaction/style baseline: `gravassist.html`

Target file: `gravrel.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other learn apps in this folder,
- prefer the existing patterns already visible in files such as `gravassist.html`, `gravlens.html`, `mzinterferometer.html`, `doubleslit.html`, `waveinterference.html`, `momentum.html`, `angularmomentum.html`, and `logigate.html`,
- if this document leaves a low-level implementation detail unspecified, inherit the established project convention rather than inventing a new one,
- `gamgen.html` is explicitly **not** a baseline for code structure or visual style here and should be ignored when choosing conventions for this app.

## 1. Purpose & Educational Goal

This app visualizes how different flight paths through strong gravity can change how much time passes for travelers. Two spacecraft leave Earth for the same real destination star. Both start with the same straight-line route. The user can then reshape each route by grabbing the path and bending it around one to three black holes placed between Earth and the star.

As the spacecraft fly, each pilot's onboard clock accumulates proper time at a rate that depends on:

- the common cruise speed chosen by the user,
- the total route length,
- and most importantly, how close the route passes to each black hole.

The educational goal is to make gravitational time dilation intuitive: a ship that spends more of its trip deeper in strong gravity can arrive having aged less than a ship that stayed farther away.

The key comparison is not "which ship is faster on screen", but "which pilot is younger at the end, and why?"

The global mission clock shown near Earth is a mission reference clock, not a claim that Earth remains an exact inertial observer under arbitrary black-hole placement. The implementation must preserve this interpretation with endpoint keep-out zones that keep black holes well away from Earth and the destination star.

## 2. Target Audience

Children aged 10-16 and curious adults. The app assumes no prior background in general relativity. Controls must be visual and direct, labels short, and the final age comparison obvious without requiring equation-heavy interpretation.

## 3. Scope

A single self-contained HTML file (`gravrel.html`) in the `learn/` directory. Dark theme per `STYLE.md`. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- Canvas-based route-planning and flight animation
- Two spacecraft with independently editable trajectories
- Real destination stars with realistic names and distances
- Configurable black-hole count: 1, 2, or 3
- Draggable black-hole positions
- Adjustable black-hole masses
- Proper-time comparison between the two pilots
- Live and final readouts for mission time and pilot aging
- Educational explanation text

Out of scope:

- Exact geodesic solving in curved spacetime
- Automatic trajectory bending by gravity
- Kerr / rotating black holes, frame dragging, or gravitational waves
- Full astrophysical scale accuracy in the map view
- Backend, persistence, or multi-file architecture

## 4. Concept Explanation

### 4.1 What The App Teaches

Clocks do not always tick at the same rate. In Einstein's relativity:

- moving clocks run slower than stationary clocks,
- and clocks in stronger gravity also run slower.

This app focuses on the second idea. Both spacecraft leave from the same place, head toward the same star, and can pass through regions with different gravitational strength. The pilot whose ship spends more of the trip closer to a black hole can end up younger.

### 4.2 Why The Paths Are User-Drawn

The app is about comparing aging outcomes, not solving orbital mechanics. For that reason, the black holes do not automatically bend the ships' trajectories. Instead, the user manually edits each route and immediately sees how that route changes:

- total distance traveled,
- time spent near each black hole,
- and total pilot aging.

This keeps the experience focused and understandable.

### 4.3 What Happens If The Paths Have Different Lengths

The two ships launch at the same time, but they do not have to arrive at the star at the same moment.

- If one route is longer, that ship takes longer in mission reference time.
- If one route passes deeper through gravity wells, that pilot's onboard time can advance more slowly.

During playback, a ship that reaches the star early should remain parked there while the other continues. The final comparison is shown after both ships have arrived.

### 4.4 Why The Map Is Schematic

The destination star distances must be real, but a literal astronomical map would make black-hole encounter zones far too tiny to see or manipulate. The app therefore uses a teaching-oriented compromise:

- star names and star distances are realistic,
- route-length comparisons are tied to the selected star distance,
- but black-hole encounter zones are visually exaggerated so users can interact with them.

This must be explained in the info text so the app stays honest about the simplification.

## 5. Physics Model

### 5.1 Core Mission Geometry

Let:

- `D` = selected star distance in light-years
- `beta = v / c` = common cruise speed as a fraction of light speed
- `gamma = 1 / sqrt(1 - beta^2)`

The app uses relativistic natural units:

```text
c = 1 light-year per year
```

Each spacecraft path is a user-edited curve between Earth and the selected star.

Define:

- `L0_map` = straight Earth-to-star map length
- `L_map` = actual arc length of the edited path on the map

Then the physical path length is:

```text
L = D * (L_map / L0_map)
```

Mission reference travel time for that spacecraft:

```text
T_ref = L / beta
```

If there were no black holes, the pilot's proper time would reduce to special relativity only:

```text
T_pilot_no_gravity = T_ref / gamma
```

In this document, `T_ref` is the app's global comparison clock. It is rendered next to Earth for convenience, but conceptually it is a far-away mission reference time. To keep that interpretation usable, black holes must not be draggable into protected zones around Earth or the destination star.

### 5.2 Gravitational Time Dilation Per Segment

For a single non-rotating black hole with Schwarzschild radius `r_s` and spacecraft distance `r` from its center, the stationary gravitational time-dilation factor is:

```text
g(r) = sqrt(1 - r_s / r)
```

For educational purposes, the app may combine speed and gravity per small route segment as:

```text
d_tau ~= d_t_ref * (1 / gamma) * g_effective
```

Where:

- `d_t_ref` is mission reference segment time,
- `1 / gamma` is the shared kinematic time-dilation factor,
- `g_effective` is the gravitational factor from the black holes at that segment.

Important modeling note:

- for a single Schwarzschild black hole, the multiplicative split into gravitational and kinematic factors matches the standard stationary-observer interpretation if the ship speed is interpreted locally,
- in this app the map is schematic, distances near black holes are scaled for interaction, and 1-3 black holes can be combined,
- therefore the overall implementation must present this as a hybrid educational approximation, not as an exact GR solver for arbitrary trajectories.

### 5.3 Multiple Black Holes

The app supports 1-3 black holes. Exact multi-body general relativity is out of scope, so the implementation must use a clearly documented approximation.

Recommended educational approximation:

```text
g_effective = product over i of sqrt(max(epsilon, 1 - r_s_i / r_i))
```

Where:

- `r_i` is the current distance to black hole `i`,
- `r_s_i` is that hole's Schwarzschild radius,
- `epsilon` is a small clamp value preventing numerical instability near the forbidden zone.

This approximation is not exact GR. Schwarzschild time dilation is exact only for a single isolated spherically symmetric mass. Combining several holes by multiplying factors is a teaching heuristic. It is acceptable because the app's purpose is comparative intuition, not precision research.

### 5.4 Encounter Scaling Requirement

Because real black-hole radii are too small to manipulate on a multi-light-year map, the implementation must use a deliberate encounter scaling system.

Required behavior:

- changing black-hole mass must visibly change the strength of the time-dilation effect,
- moving a route closer to a black hole must monotonically decrease pilot proper time,
- the user must be able to see safe, close, and forbidden regions around each black hole.

Acceptable implementation approach:

- keep the global Earth-to-star route map schematic,
- render each black hole with labeled influence rings,
- map on-canvas route proximity to a local encounter distance used for `r_i` in the formulas.

Use this default encounter mapping so the implementation does not have to invent one:

- render each black hole with three explicit radii in the local encounter model:
  - event horizon ring: `R_h`
  - safety ring: `R_safe = 1.35 * R_h`
  - outer influence ring: `R_inf = 8 * R_h`
- treat the on-canvas distance from the route sample to the black-hole center as the local encounter distance in this schematic interaction space,
- compute the dimensionless distance as `r / r_s = max(d_canvas / R_h, 1 + delta_safe)`,
- use the same ring geometry for drawing, validation, and time-dilation sampling so the child sees the same proximity model the math is using.

This mapping is still a teaching approximation, but it is concrete, monotonic, and explainable.

It must also be:

- consistent,
- monotonic,
- documented in code comments,
- and briefly explained in the info section.

### 5.5 Forbidden Zone

The path must not be allowed to pass through the event horizon, and it should not be allowed to skim the horizon closely enough to create unstable or misleading behavior.

Required behavior:

- define a safety radius `r_safe = (1 + delta_safe) * r_s`, where `delta_safe` is a small positive buffer chosen for stable UX,
- if any route segment enters `r <= r_safe`, that route is invalid,
- invalid segments glow red,
- each black hole should show both an event-horizon ring and a larger safety ring,
- launch is disabled until both routes are valid.

This keeps the activity focused on comparing successful missions rather than black-hole capture scenarios.

### 5.6 Segment Integration

The implementing agent should numerically integrate along sampled route segments.

Recommended path:

1. Resample each route into a sufficiently dense polyline.
2. For each segment, compute:
   - segment map length,
   - physical segment length,
   - mission reference segment time,
   - local gravitational factor,
   - pilot proper-time increment.
3. Sum over all segments to obtain:
   - route length,
   - mission reference travel time,
   - pilot proper time.

Pseudo-form:

```js
beta = speedFraction;
gamma = 1 / Math.sqrt(1 - beta * beta);

for (const segment of sampledPath) {
  const dsMap = segment.lengthMap;
  const dsPhysical = starDistanceLy * (dsMap / straightMapLength);
  const dtRef = dsPhysical / beta;
  const g = computeEffectiveGravity(segment.midpoint, blackHoles);
  referenceTime += dtRef;
  pilotTime += dtRef * (1 / gamma) * g;
}
```

The clocks must be driven from integrated mission time, not from eased pixel motion.

### 5.7 Simplifications

- Constant cruise speed for both ships
- Non-rotating Schwarzschild black holes only
- No automatic gravity-driven path deflection
- Curved user-drawn routes are allowed, but the app does not model thrust cost, acceleration-dependent effects, or orbital mechanics needed to follow them
- One-way trip only: Earth to destination star
- Schematic encounter scaling rather than literal astronomical map scale

### 5.8 Numerical Stability & Singularity Handling

The future implementation must treat numerical robustness as a first-class requirement. This app will be highly interactive, so it must never generate `NaN`, `Infinity`, frozen animations, or broken paths when the user drags controls aggressively.

Required safeguards:

- **Near-light-speed clamp**: `beta` must remain strictly below `1`. Compute `gamma` with a protected radicand such as `max(epsilon_beta, 1 - beta * beta)`.
- **Event-horizon safety buffer**: route validation must use `r_safe`, not the exact horizon alone, to avoid edge flicker and unstable values of `sqrt(1 - r_s / r)`.
- **True singularity avoidance**: no code path may ever evaluate formulas at `r = 0`. Invalid routes must be rejected long before that point.
- **Negative radicand protection**: if `1 - r_s / r` would become negative, the route is invalid. Do not silently coerce it into a valid time-dilation value.
- **Adaptive route sampling**: sample density must increase near black holes and in high-curvature route sections so horizon crossings or sharp dips are not missed.
- **Spline overshoot checks**: validate the sampled curve, not only the visible control points, because a spline can cross into a forbidden zone between handles.
- **Zero-length segment skip**: repeated or nearly coincident points must not create divide-by-zero or `0 / 0` issues during tangent, length, or timing calculations.
- **Straight-line baseline guard**: assert `L0_map > epsilon_length` before using `L = D * (L_map / L0_map)`.
- **Stable multi-hole multiplication**: compute combined gravitational factors in log space or an equivalently stable way, then clamp the final value to `[g_min, 1]`.
- **Mass-domain guard**: black-hole mass must stay strictly positive. A logarithmic mass slider should be driven by exponent values, never by raw zero-crossing arithmetic.
- **Black-hole placement constraints**: black holes must not overlap each other beyond a defined minimum separation, and must not be draggable into endpoint keep-out zones around Earth or the destination star.
- **State hysteresis**: route validity should use hysteresis so a path dragged near the safety ring does not flicker between valid and invalid every frame.

Recommended protected computation:

```js
const betaClamped = clamp(beta, BETA_MIN, BETA_MAX);
const gamma = 1 / Math.sqrt(Math.max(EPS_BETA, 1 - betaClamped * betaClamped));

let logG = 0;
for (const hole of blackHoles) {
  const r = Math.max(segmentDistanceToHole, hole.safeRadius);
  const term = Math.max(EPS_G, 1 - hole.rs / r);
  logG += 0.5 * Math.log(term);
}
const g = clamp(Math.exp(logG), G_MIN, 1);
```

This approach prevents sudden crashes from:

- `beta -> 1`,
- `r -> r_s`,
- `r < r_s`,
- underflow from multiplying several very small factors,
- and geometry glitches in edited paths.

## 6. Functional Requirements

### 6.1 Scene Layout

The canvas shows a horizontal mission scene:

- **Left zone**: Earth with launch point and a small mission-control clock/readout
- **Right zone**: Destination star with label
- **Middle zone**: Route-planning space with starfield background, black holes, and both trajectories
- **Ship A / Ship B**: Two distinct spacecraft traveling on their own paths

Layout pattern should match the existing experiments:

- canvas area: `flex: 1`
- control panel: `300px` to `340px`
- responsive stack on narrow screens

### 6.2 Destination Star Selector

A dropdown control offering real stars with realistic distances.

Recommended dataset:

| Star             | Distance (ly) | Child-friendly note                    |
|------------------|---------------|----------------------------------------|
| Proxima Centauri | 4.24          | Nearest star to the Sun                |
| Barnard's Star   | 5.96          | Nearby red dwarf                       |
| Sirius           | 8.60          | Brightest star in the night sky        |
| Epsilon Eridani  | 10.47         | Sun-like nearby system                 |
| Tau Ceti         | 11.91         | Well-known nearby star                 |
| Altair           | 16.73         | Bright summer star                     |
| Vega             | 25.04         | Bright northern star                   |
| Arcturus         | 36.66         | Bright orange giant                    |

Each dropdown entry should show the star name and distance, for example:

```text
Sirius (8.60 ly)
```

Changing the selected star must immediately update:

- displayed distance,
- route length calculations,
- mission reference travel times,
- pilot proper-time estimates.

### 6.3 Common Speed Control

Use one shared cruise-speed control so the learning focus stays on route choice rather than two independent velocity settings.

Requirements:

- Range: `0.10c` to `0.99c`
- Step: `0.01c`
- Default: `0.50c`
- Live numeric display in monospace font
- `-` / `+` step buttons

As the speed changes, all predicted readouts update live.

### 6.4 Black-Hole Count & Controls

The number of black holes must be user-configurable:

- minimum: `1`
- maximum: `3`
- default: `2`

Each black hole needs:

- draggable on-canvas position,
- visible label (`BH 1`, `BH 2`, `BH 3`),
- mass control,
- mass readout in solar masses,
- visible influence / warning rings.

Default startup state:

- selected star: `Proxima Centauri`
- common speed: `0.50c`
- black-hole count: `2`
- both routes: straight and initially valid
- default black-hole placement: one above and one below the route midline so the initial scene is symmetric and launchable

Placement constraints:

- a black hole may not overlap another black hole's safety region,
- a black hole may not enter the Earth keep-out zone,
- a black hole may not enter the destination-star keep-out zone.

Mass control requirements:

- logarithmic scale is strongly preferred,
- label must be readable as scientific notation or powers of ten,
- changing mass updates predicted times live.

Use this mass range:

```text
10^3 M_sun to 10^9 M_sun
```

Default mass: `10^6 M_sun` per black hole.

### 6.5 Path Editing

This is the core interaction.

Both routes start as straight lines from Earth to the star.

Required editing behavior:

- the user can grab a route at any visible point,
- dragging that point bends the route,
- endpoints remain locked to Earth and the destination star,
- the route updates smoothly in real time while dragging.

Recommended path model:

- editable control points with centripetal Catmull-Rom spline interpolation resampled into a dense polyline for rendering, hit testing, and physics integration,
- on pointer-down near a curve, insert or select a control point at the nearest sampled location,
- drag to reposition,
- optional double-click or remove button to delete non-endpoint handles.

Helpful controls:

- `Straighten A`
- `Straighten B`
- `Clear Extra Points`

Visual requirements:

- Ship A route and handles use one color,
- Ship B route and handles use another,
- the selected handle is highlighted,
- invalid route portions near a black hole are clearly marked.

### 6.6 Pre-Launch Readouts

Before launch, the panel should show live predicted values.

Global readouts:

- Selected star distance
- Shared speed (`beta`)
- Lorentz factor (`gamma`)
- Black-hole count

Per-ship readouts:

- Route length
- Mission reference travel time
- Pilot proper time
- Time difference vs the other ship
- Minimum pass distance to each black hole

If a route is invalid:

- show a warning message,
- indicate which black hole is causing the violation,
- disable the launch button.

### 6.7 Launch, Pause, Reset

Required controls:

- `Launch`
- `Pause` / `Resume`
- `Reset`

Animation states:

1. **Idle**: both ships at Earth; clocks at zero
2. **Flying**: both ships moving along their own paths
3. **Paused**: motion and clocks frozen
4. **Complete**: both ships parked at the star; summary available

Playback rule:

- both ships launch at the same moment,
- each ship advances according to its own computed travel time,
- the first ship to arrive remains visible at the star while the other continues,
- final summary appears only after both have arrived.

### 6.8 Animation Speed Control

Add a playback-speed control:

- Range: `0.5x` to `5x`
- Default: `1x`

This affects only how quickly the animation advances on the user's screen. It must not change:

- computed route length,
- mission reference time,
- pilot proper time,
- or final age difference.

### 6.9 Clock Display

Three time readouts should be visible during the mission:

- **Mission clock**: mission reference time elapsed since launch
- **Ship A clock**: pilot proper time for spacecraft A
- **Ship B clock**: pilot proper time for spacecraft B

Requirements:

- all clocks remain visible during playback,
- ship clocks should be visually attached to or near their spacecraft,
- the first-arriving ship's clock freezes at arrival,
- the mission clock keeps running until the later ship arrives.

Digital readouts are required. Optional analog clock faces may be added if they make the difference more visually obvious.

### 6.10 Final Summary Overlay

After both ships reach the star, show a results summary overlay with:

- Ship A mission reference arrival time
- Ship A pilot time
- Ship B mission reference arrival time
- Ship B pilot time
- Pilot age difference
- Which route passed closer to a black hole

The overlay should include a child-friendly conclusion, for example:

```text
Pilot A aged 0.42 years less by flying deeper through strong gravity.
```

The overlay must be dismissible.

### 6.11 Info Text

The control panel should include a short explanation written for children:

- What is gravitational time dilation?
- Why does a clock run slower near a black hole?
- Why are the routes user-drawn instead of automatically curved?
- Why is the map not drawn to true astronomical scale?
- Why is the global mission clock shown next to Earth only as a reference display?

The explanation must state clearly that this is a simplified teaching model.

## 7. UX Requirements

### 7.1 Clarity For Children

- Large controls
- Short labels
- Strong color separation between the two ships
- Immediate feedback while dragging paths or black holes
- Final age comparison must be the focus of the experience

### 7.2 Direct Manipulation

The app should feel like a route-planning toy, not a form-based calculator.

That means:

- dragging routes is more important than typing numbers,
- black holes should feel movable and tangible,
- readouts should update continuously while the user edits.

### 7.3 Step Buttons

Every slider must have `-` and `+` step buttons, consistent with the UI pattern already used in `gravassist.html`.

### 7.4 Mobile Compatibility

The layout must remain usable on phones and tablets:

- control panel stacks below the canvas,
- touch dragging works for routes and black holes,
- touch targets remain at least 44 by 44 px.

### 7.5 Accessibility

- High contrast for all text and route colors
- Legible canvas labels
- Color choices that remain distinguishable without relying only on hue
- Important warnings also use shape or icon cues, not only red color

## 8. Visual Design

### 8.1 Theme

Use the existing dark theme language from the project:

```css
:root {
  --bg: #0b0f18;
  --panel: #131825;
  --panel-border: #1e2a3a;
  --text: #c9d1d9;
  --text-dim: #6e7a8a;
  --accent: #58a6ff;
}
```

Canvas background: `#080c14`

### 8.2 App-Specific Colors

```css
:root {
  --earth-color: #4db8ff;
  --ship-a: #ffb347;
  --ship-b: #66d9c2;
  --star-color: #fff1a8;
  --hole-core: #05070c;
  --hole-ring: #ff7a59;
  --danger: #f97583;
}
```

### 8.3 Scene Elements

- **Earth**: blue-green sphere with subtle glow
- **Destination star**: bright glowing point with label
- **Black holes**: dark core with lensing halo and orbit-like warning rings
- **Routes**: smooth colored curves with visible handles when selected
- **Ships**: simple icons or triangular spacecraft markers
- **Starfield**: same random-dot approach as `gravassist.html`

### 8.4 Animation Effects

- route highlight that pulses gently while a ship is traveling it
- subtle clock ticking animation
- arrival glow when a ship reaches the star
- summary overlay with fade-in animation

## 9. Localization

Bilingual English / Polish, following the project pattern used in translated experiments.

Required implementation pattern:

- `state.lang`
- `I18N` dictionary
- `applyTranslations()` function
- language toggle button in the header
- canvas text must also respect the current language

Translate all user-visible text, including:

- title and subtitle
- control labels
- button labels
- warnings
- readout labels
- info text
- summary overlay text
- black-hole labels
- journey status labels

Recommended Polish star-name labels:

| English            | Polish             |
|--------------------|--------------------|
| Proxima Centauri   | Proxima Centauri   |
| Barnard's Star     | Gwiazda Barnarda   |
| Sirius             | Syriusz            |
| Epsilon Eridani    | Epsilon Eridani    |
| Tau Ceti           | Tau Ceti           |
| Altair             | Altair             |
| Vega               | Wega               |
| Arcturus           | Arktur             |

## 10. Technical Constraints

- Single self-contained HTML file with inline CSS and JavaScript
- Vanilla JavaScript only
- HTML5 Canvas for the main visualization
- Google Fonts only
- `requestAnimationFrame` for animation
- Pointer events for dragging paths and black holes
- Device pixel ratio handling for crisp canvas rendering
- Responsive layout consistent with the existing experiments

Recommended implementation details:

- sample each editable path into a cached polyline for hit testing and integration,
- rebuild samples only when the user edits a route or changes black-hole settings,
- separate physics data from visual easing or decorative animation.

## 11. Open Design Decisions

The implementing agent must resolve:

- whether to insert a control point automatically on every drag or only when needed
- how many path samples are sufficient for smooth physics integration
- whether to show a local zoom inset for the currently selected black hole
- whether to show a separate breakdown of kinematic vs gravitational contributions in the summary
- exact warning UI for invalid routes near an event horizon
- exact values for `delta_safe`, `EPS_BETA`, `EPS_G`, and minimum black-hole separation

## 12. Acceptance Criteria

The app is complete when:

- the user can select from real star destinations with correct distances
- the default scene is immediately launchable with two valid straight routes
- the user can choose 1, 2, or 3 black holes
- each black hole can be dragged and its mass adjusted
- both spacecraft begin with straight Earth-to-star routes
- the user can bend each route by grabbing the line at any point
- pre-launch readouts update live as paths, masses, star, or speed change
- launching starts both ships at the same time
- each ship follows its own route and can arrive earlier or later than the other
- the mission clock and both pilot clocks update correctly during animation
- moving a route closer to a black hole decreases that ship's predicted proper time
- increasing a black hole's mass decreases the proper time for routes that pass nearby
- invalid routes that cross an event horizon are clearly marked and cannot be launched
- paths that enter the safety buffer are also invalid, to prevent unstable near-horizon behavior
- black holes cannot overlap or be dragged into protected endpoint zones
- if both routes are identical, both ships produce identical times
- with black holes placed far from both routes, the app approaches the special-relativity baseline
- allowed extreme settings do not produce `NaN`, `Infinity`, stuck animations, or validity flicker during dragging

Numerical baseline check:

- For Proxima Centauri (`4.24 ly`) at `0.80c`, with both routes straight and black-hole influence effectively negligible:
  - Mission reference travel time for each ship should be about `5.30 years`
  - Pilot proper time for each ship should be about `3.18 years`
  - `gamma` should be about `1.67`

- final overlay clearly states which pilot aged less and by how much
- all text is available in English and Polish
- the dark theme matches project conventions
- the mobile layout is usable

## 13. Suggested Implementation Order

1. Static layout: header, canvas, control panel, dark theme
2. Destination-star dataset and readouts
3. Two-route editing model with handles and hit testing
4. Black-hole objects with dragging and mass controls
5. Route sampling and pre-launch time calculations
6. Mission animation with independent ship progress
7. Live clocks and final summary overlay
8. Localization scaffolding
9. Mobile polish and final testing
