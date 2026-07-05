# Copernican Reference Frame Simulator: Requirements

Reference interaction/style baseline: `gravassist/index.html`

Target file: `copernicus/index.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other learn apps in this folder,
- prefer the existing patterns already visible in files such as `gravassist/index.html`, `gravlens/index.html`, `mzinterferometer/index.html`, `doubleslit/index.html`, `waveinterference/index.html`, `momentum/index.html`, `angularmomentum/index.html`, and `logigate/index.html`,
- if this document leaves a low-level implementation detail unspecified, inherit the established project convention rather than inventing a new one,
- `gamgen/index.html` is explicitly **not** a baseline for code structure or visual style here and should be ignored when choosing conventions for this app.

## 1. Purpose & Educational Goal

This app demonstrates the central insight of Copernicus: not that Earth orbits the Sun (this idea was proposed earlier by Aristarchus of Samos), but that choosing the Sun as the reference point for the Solar System **dramatically simplifies the description of planetary motion**.

The app visualizes the inner Solar System (Sun, Mercury, Venus, Earth, Mars) and allows the user to select any body as the center of the reference frame. When the Sun is selected, planets trace clean elliptical orbits. When Earth is selected, the same planets trace complex looping relative paths with retrograde sections. These paths are epicycle-like and help explain why older geocentric descriptions became so complicated. Switching between these views provides the key "aha moment": the underlying physics is identical, but the description becomes radically simpler from one particular reference frame.

## 2. Target Audience

Children aged 10–16 with an interest in astronomy, history of science, or visual mathematics. The app assumes no knowledge of orbital mechanics, reference frames, or Kepler's laws. The visual transformation when switching reference frames should be self-explanatory — the child sees the complex loops simplify into clean ellipses and understands why the heliocentric model was a breakthrough.

## 3. Scope

A single self-contained HTML file (`copernicus/index.html`) in the `learn/` directory. Dark theme per `CLAUDE.md`. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- Canvas-based animated top-down view of the inner Solar System
- Five bodies: Sun, Mercury, Venus, Earth, Mars
- Elliptical orbits using approximate real orbital parameters in a 2D common-plane Keplerian model
- Reference frame selection — any of the 5 bodies
- Trail system showing orbital paths from the selected reference frame's perspective
- Animation speed control, pause, reset

Out of scope:

- Outer planets (Jupiter–Neptune) — excluded to avoid scale problems; the inner system covers the most educational content
- Moons (including Earth's Moon)
- Asteroid belt
- 3D visualization — this is a 2D top-down view of the ecliptic plane
- Gravitational interactions between planets — orbits are independent Keplerian ellipses
- Multi-file architecture or backend features

## 4. Concept Explanation

### 4.1 Historical Context

For over a thousand years, Western astronomy placed Earth at the center of the universe. The Ptolemaic geocentric model described planetary motions using a complex system of epicycles — small circles upon larger circles — to explain the apparent retrograde motion of planets like Mars, which periodically appears to reverse direction in the sky as seen from Earth.

Copernicus proposed the heliocentric model in 1543: if we place the Sun near the center of the planetary system, the broad pattern of planetary motion becomes dramatically simpler. Copernicus still used circular constructions, while Kepler later showed that the orbits are ellipses. This app uses the later Keplerian description because it is both more accurate and still simple enough for children to understand. The core historical lesson remains the same: **a different reference frame produces a far simpler description of the same physical reality**.

### 4.2 What This App Shows

When the Sun is the reference frame center, each planet traces a clean elliptical orbit. When the user switches to Earth as the reference frame center, the Sun and other planets trace complex looping paths. Mars, in particular, creates the famous retrograde loops that puzzled ancient astronomers for centuries.

The app lets the user see this transformation happen in real-time. The same physical system, viewed from different centers, looks radically different. The child discovers for themselves why the heliocentric model was such an advance.

Important educational note: the canvas is a top-down orbital-plane view, not a literal map of the planets' apparent positions against the background stars. The looping curves shown in Earth-centered mode are a geometric model of the relative motion that produces retrograde behavior in the sky.

### 4.3 Why Inner Planets Only

The inner Solar System (Mercury through Mars) is used because:

- The scale is manageable — Mars is only 1.52× Earth's distance from the Sun, so all orbits fit comfortably on screen.
- Mars retrograde from Earth's perspective is the most famous and visually dramatic example of the reference-frame effect.
- The orbital periods are short enough (Mercury ~88 days, Mars ~687 days) that multiple orbits complete within a reasonable animation time, allowing trails to show full patterns.
- Including outer planets would require either a logarithmic scale (distorting relative distances) or zooming so far out that inner planets become invisible dots.

## 5. Physics Model

### 5.1 Keplerian Orbits

Each planet follows an independent elliptical orbit around the Sun, governed by Kepler's laws:

**Kepler's First Law**: Orbits are ellipses with the Sun at one focus.

**Kepler's Second Law**: A line from the Sun to the planet sweeps equal areas in equal times. Planets move faster near perihelion (closest approach to the Sun) and slower near aphelion (farthest point).

**Kepler's Third Law**: T² ∝ a³. The square of the orbital period is proportional to the cube of the semi-major axis.

### 5.2 Orbital Parameters

Approximate J2000-style orbital values for the inner planets, suitable for a 2D educational model:

| Body    | Semi-major axis (AU) | Eccentricity | Period (years) | Longitude of perihelion (°) | Mean longitude at epoch (°) |
|---------|---------------------|--------------|----------------|-----------------------------|-----------------------------|
| Mercury | 0.3871              | 0.2056       | 0.2408         | 77.46                       | 252.25                      |
| Venus   | 0.7233              | 0.0068       | 0.6152         | 131.77                      | 181.98                      |
| Earth*  | 1.0000              | 0.0167       | 1.0000         | 102.93                      | 100.47                      |
| Mars    | 1.5237              | 0.0934       | 1.8809         | 336.08                      | 355.43                      |

The Sun has no orbit — its position is the origin in the heliocentric frame.

`*` Earth may be represented using the Earth-Moon barycenter approximation. For this app, that difference is negligible.

Notable eccentricities:

- **Mercury** (e = 0.206): Noticeably eccentric. The orbit should be visibly non-circular.
- **Venus** (e = 0.007) and **Earth** (e = 0.017): Nearly circular. Visually indistinguishable from circles.
- **Mars** (e = 0.093): Slightly eccentric. The deviation from circular should be subtly visible.

### 5.3 Position Computation

For each planet at simulation time `t`:

1. Compute mean motion and mean anomaly:
   ```
   n  = 2π / T
   M0 = L0 − ϖ
   M  = wrap(M0 + n × t)
   ```

   Where:

   - `L0` is the planet's mean longitude at the chosen epoch
   - `ϖ` is the longitude of perihelion
   - `wrap(...)` normalizes the angle to a stable range such as `[-π, +π]`

   Important requirement: the planets must not all start with `M = 0` at `t = 0`. Use the mean longitudes in the table above as the default J2000-style startup configuration. In other words, `t = 0` should correspond to those listed phase offsets, not to a made-up "all planets lined up" teaching pose.

2. Solve Kepler's equation iteratively for eccentric anomaly `E`:
   ```
   M = E − e × sin(E)
   ```

3. Compute position in the orbital plane:
   ```
   x' = a × (cos(E) − e)
   y' = a × √(1 − e²) × sin(E)
   ```

4. Rotate by longitude of perihelion `ϖ` for the app's 2D common-plane model:
   ```
   x = x' × cos(ϖ) − y' × sin(ϖ)
   y = x' × sin(ϖ) + y' × cos(ϖ)
   ```

This produces heliocentric `(x, y)` coordinates for each planet at any time `t`.

Modeling note:

- a full J2000 treatment would also include inclination `I` and node `Ω`,
- this app intentionally uses a flattened 2D ecliptic-plane model because the small orbital inclinations are not central to the educational goal,
- if the implementing agent later chooses to include `I` and `Ω`, the top-down projection should still preserve the same reference-frame lesson.

### 5.4 Kepler's Equation Solver

Kepler's equation `M = E − e × sin(E)` must be solved numerically. Newton-Raphson iteration is standard and efficient:

```
E₀ = M
Eₙ₊₁ = Eₙ − (Eₙ − e × sin(Eₙ) − M) / (1 − e × cos(Eₙ))
```

5-10 iterations are sufficient for all eccentricities in this dataset. For Mercury (`e = 0.206`), convergence is still fast.

However, the implementation must still include basic numerical safety:

- normalize `M` before iteration,
- cap the maximum number of iterations,
- stop early once the update falls below a small tolerance,
- if convergence is unexpectedly poor, fall back to the last iterate rather than freezing or producing `NaN`.

There are no true physical singularities in this model, but these guardrails are required to keep the animation robust.

### 5.5 Reference Frame Transformation

When body `B` is selected as the reference frame center, the displayed position of every body `P` is:

```
position_displayed(P) = position_heliocentric(P) − position_heliocentric(B)
```

For the Sun, when `B` is not the Sun:

```
position_displayed(Sun) = (0, 0) − position_heliocentric(B) = −position_heliocentric(B)
```

This simple vector subtraction is all that is needed. The beauty of this app is that this trivial mathematical operation transforms clean ellipses into complex looping relative paths (and vice versa).

Important frame-definition requirement:

- the selected-body view is a translated but non-rotating frame,
- the x/y axes must remain parallel to the heliocentric axes,
- the implementation must not subtract any extra orientation angle or rotate the canvas basis when switching center body.

### 5.6 What Creates the Loops

When Earth is the reference frame center and we observe Mars:

```
position_displayed(Mars) = position_helio(Mars) − position_helio(Earth)
```

Because Mars orbits slower than Earth, Earth periodically "overtakes" Mars. During the overtaking, Mars appears to move backward (retrograde) in the Earth-centered frame. The combination of two different orbital frequencies creates an epicycle-like looping relative path. In the top-down app view this is not literally the same thing as plotting Mars against the background stars on the sky, but it captures the same geometric cause of retrograde behavior.

This is the central educational content of the app.

## 6. Functional Requirements

### 6.1 Scene Layout

The canvas shows a top-down view of the inner Solar System:

- **Center**: The selected reference body, rendered stationary at the canvas center.
- **Orbiting bodies**: All other bodies (including the Sun, when not centered) move relative to the center.
- **Background**: Dark starfield — random dots of varying brightness, same approach as `gravassist/index.html`.
- **Scale**: The default view should comfortably fit the maximum extent of any body's apparent path from any reference frame. In this simplified 2D model, Mars viewed from Earth can extend to roughly `2.7 AU` from the center in the widest configurations. The canvas scale should therefore budget for at least that radius plus margin for labels and glow.

### 6.2 Reference Frame Selection

The user selects which body is the center of the coordinate system.

Available options:

- Sun (Słońce)
- Mercury (Merkury)
- Venus (Wenus)
- Earth (Ziemia)
- Mars (Mars)

**UI**: A row of toggle buttons (one per body), consistent with the type-toggle pattern in `CLAUDE.md`. The active body is highlighted with `--accent`. Each button may use a small color dot or icon matching the body's render color for easy identification.

**Behavior when switching**:

- The selected body immediately becomes the center of the canvas and stops moving.
- All other bodies' positions are recalculated relative to the new center.
- Existing trails are cleared — trails from the old reference frame have no meaning in the new one.
- The transition should feel immediate and dramatic, emphasizing the visual transformation.

Default startup state:

- reference frame center: `Sun`
- trails: `off`
- orbital guides: visible in Sun-centered view

### 6.3 Trail System

Each body (except the reference frame center) can leave a visible trail on the canvas, showing its path from the perspective of the current reference frame.

**Trail toggle**: A single on/off toggle that enables or disables trail rendering for all bodies simultaneously.

Default trail state: `off`.

**Trail behavior**:

- When enabled, each body's path is drawn as a colored line accumulating over time.
- Trail length should show at least one Mars synodic period of motion, about 780 days (`~2.14 Earth-years`), so a full retrograde loop can be visible regardless of starting phase.
- Older trail segments should fade gradually — newer parts at full opacity, oldest parts fading to ~10% opacity.

**Clear trails button**: Erases all existing trails without changing the toggle state. Useful for starting a clean observation.

**Switching reference frame clears trails automatically**: Trails from the previous frame are meaningless in the new one.

### 6.4 Planet Rendering

Each body is rendered as a colored circle with a glow effect:

| Body    | Color                | Visual size  |
|---------|----------------------|--------------|
| Sun     | Yellow (#FFD700)     | Largest — noticeably bigger than planets (but not to real scale) |
| Mercury | Gray (#A0A0A0)       | Smallest     |
| Venus   | Pale yellow (#F5DEB3)| Medium-small |
| Earth   | Blue (#4db8ff)       | Medium       |
| Mars    | Red-orange (#E05030) | Medium-small |

Planet sizes should be exaggerated relative to orbital distances — real sizes would be invisible at this scale. A reasonable visual radius is 4–8 px for planets and 10–14 px for the Sun.

Each body should have:

- A subtle glow or halo effect (radial gradient falloff matching its color)
- A name label rendered nearby
- The reference frame center body should have a distinct visual indicator — e.g., a thin ring, crosshair, or "pinned" marker in `var(--accent)` at low opacity — to communicate "this is the fixed point"

### 6.5 Orbital Path Guides

When the Sun is the reference frame center, faint elliptical orbit guides should be shown for each planet. These represent the actual Keplerian orbits and help the child see the clean elliptical structure.

Guide-drawing requirement:

- the Sun must lie at one focus of each guide ellipse, not at the geometric center,
- for a planet with semi-major axis `a` and eccentricity `e`, use `b = a × sqrt(1 - e^2)` and `c = a × e`,
- the ellipse center should be offset from the Sun by `c` opposite the perihelion direction before drawing the rotated ellipse.

These guides should not be shown in non-Sun reference frames, where orbits are not ellipses and the guides would be misleading.

### 6.6 Animation Controls

**Play / Pause button**: Toggles animation. Default state: playing.

**Animation speed slider**:

- Range: 0.5× to 10×
- Default: 1× (where 1× means Earth completes one orbit in approximately 15 seconds of real time)
- Step buttons (`−` / `+`)
- Value display in monospace font

High-speed sampling requirement:

- trail points must not be recorded only once per render frame at high playback speeds,
- the implementation should sample trails at fixed simulated-time intervals or substep when `dt_sim` becomes large, so Mercury's orbit does not become visibly polygonal or skip loop detail at `10×`.

**Reset button**: Returns all planets to their initial positions, clears trails, and resets the time counter.

Default playback speed: `1×`.

### 6.7 Time Display

Show the current simulation time in Earth years:

- Format: `T = X.XX years`
- Placed in the readouts section of the control panel
- Helps the user understand orbital periods and anticipate retrograde events

### 6.8 Info Text

The control panel should include a short child-friendly explanation covering:

- what a reference frame is,
- why the Sun-centered view looks simpler,
- what retrograde motion means in this top-down model,
- why trails are cleared when switching center body.

The info section should include a brief historical note connecting Ptolemy, Copernicus, and Kepler without turning the app into a long history lesson.

## 7. UX Requirements

### 7.1 Clarity for Children

- Reference frame buttons should use planet colors as accents for instant identification
- Switching reference frames must feel instantaneous and dramatic — the visual transformation is the core of the app
- Trail colors must match planet colors for easy tracking
- The info text should explain what retrograde motion is and why it appears

### 7.2 Suggested Educational Flow

The info section should guide the child through a discovery sequence:

1. Start with Sun as center — observe the clean elliptical orbits
2. Turn on trails — see the neat orbital paths
3. Switch to Earth as center — watch how Mars begins making loops
4. _"These loops help explain what ancient astronomers were trying to describe from Earth."_
5. Switch back to Sun — _"Copernicus showed that from here it's all much simpler."_

This narrative should be written into the info text in a child-friendly tone.

### 7.3 Step Buttons

Every slider must have `−` and `+` buttons consistent with the dark-theme step button pattern in `CLAUDE.md`.

### 7.4 Mobile Compatibility

Responsive layout. On narrow screens, the control panel stacks below the canvas, consistent with the existing app pattern.

### 7.5 Accessibility

- readable labels at small planetary sizes,
- strong contrast between body glows, trails, and background,
- reference-frame center indicator visible without relying on color alone,
- controls usable on touch screens without hover.

## 8. Visual Design

### 8.1 Theme

Dark theme per `CLAUDE.md`:

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

### 8.2 App-specific Colors

```css
:root {
  --sun-color: #FFD700;
  --mercury-color: #A0A0A0;
  --venus-color: #F5DEB3;
  --earth-color: #4db8ff;
  --mars-color: #E05030;
}
```

### 8.3 Trail Rendering

- Each trail uses the body's color with decreasing opacity for older segments
- Trail line width: 1.5–2 px
- Use either a dense polyline or a smoothing method that does not visibly alter retrograde cusps or loop shapes; scientific fidelity matters more than cosmetic smoothing here
- Newer segments at full opacity, oldest segments at ~10% opacity
- Trail point storage should be capped at a reasonable limit per body (e.g., 10,000 points) to prevent memory issues over long runs

### 8.4 Reference Frame Center Indicator

The centered body should have a visual "pinned" indicator:

- A thin circular ring or crosshair behind the body
- Color: `var(--accent)` at low opacity (e.g., 0.3 alpha)
- This communicates "this body is the fixed reference point"

### 8.5 Orbital Guide Rendering (Sun-centered only)

- Faint dashed or solid ellipses for each planet's orbit
- Color: the planet's color at ~15–20% opacity
- Line width: 1 px
- Only rendered when the Sun is the reference frame center

## 9. Localization

Same bilingual pattern as all other apps:

- `state.lang` variable, `I18N` dictionary, `applyTranslations()`, header toggle button
- All UI text and canvas-rendered labels translated

Key translations:

| English          | Polish             |
|------------------|--------------------|
| Sun              | Słońce             |
| Mercury          | Merkury            |
| Venus            | Wenus              |
| Earth            | Ziemia             |
| Mars             | Mars               |
| Reference Frame  | Układ odniesienia   |
| Trails           | Ślady              |
| Clear Trails     | Wyczyść ślady      |
| Speed            | Prędkość           |
| Time             | Czas               |
| years            | lat                |
| Play             | Odtwórz            |
| Pause            | Pauza              |
| Reset            | Reset              |

## 10. Technical Constraints

Same as all learn apps:

- Single HTML file, inline CSS and JavaScript
- Vanilla JavaScript, no frameworks or external libraries
- HTML5 Canvas for all rendering
- Google Fonts: Outfit + Share Tech Mono
- DPR-aware rendering for retina displays
- `requestAnimationFrame` animation loop
- Responsive layout: canvas `flex: 1` + `300px` control panel

### 10.1 Performance Considerations

With trails enabled and 4 orbiting bodies, the app accumulates trail points over time. The implementation should:

- Cap trail history at a reasonable length per body (e.g., 10,000 points)
- Use efficient rendering — skip subpixel segments, batch path drawing
- Decimate trail points if the buffer fills up (remove oldest points)
- Sample or substep trail generation in simulated time, not only per render frame, so fast bodies remain smooth at high playback speed

### 10.2 Kepler's Equation Convergence & Numerical Safety

Newton-Raphson converges within 5-10 iterations for all inner-planet eccentricities in this dataset. Mercury's eccentricity (`0.206`) is the highest and still converges quickly.

Even so, the implementation must include:

- angle wrapping for `M`,
- an iteration cap,
- a small convergence tolerance,
- protection against `NaN` from degree/radian mixups or unexpected bad state,
- wrapped angular state or epoch-relative time so very long runs do not accumulate unstable huge angles.

These protections are implementation requirements, not optional refinements.

## 11. Open Design Decisions

The implementing agent must resolve:

- Planet label positioning strategy — always visible at a fixed offset, or repositioned to avoid overlap
- Exact trail fade algorithm — linear alpha decay over age, or exponential
- Whether to include zoom or pan controls — the inner solar system should fit comfortably at fixed scale, but some flexibility may improve the experience
- How to render the "pinned" reference center indicator (ring vs. crosshair vs. subtle highlight)

## 12. Acceptance Criteria

The app is complete when:

- Five bodies are displayed: Sun, Mercury, Venus, Earth, Mars
- Default startup is Sun-centered with trails off
- Each body orbits with its correct real period and eccentricity:
  - Mercury ~88 days (0.24 years)
  - Venus ~225 days (0.62 years)
  - Earth ~365 days (1.00 years)
  - Mars ~687 days (1.88 years)
- Planet starting positions use per-body phase offsets; they are not all initialized at perihelion at the same time
- Mercury's orbit is visibly eccentric; Venus and Earth orbits are nearly circular; Mars is slightly eccentric
- The user can select any of the 5 bodies as the reference frame center
- Switching to Sun-centered view shows clean elliptical orbits
- Switching to Earth-centered view shows complex looping relative paths, with Mars clearly exhibiting retrograde loops
- Switching to any other planet as center produces correspondingly complex paths
- Trails can be toggled on and off
- Trails can be cleared manually
- Trails from a previous reference frame are automatically cleared when switching
- Orbital guide ellipses are shown in Sun-centered view
- Animation speed is adjustable (0.5× to 10×)
- Current simulation time is displayed in Earth years
- Animation can be paused and resumed
- Long runs and frame-switching do not produce `NaN`, frozen planets, or broken trails
- All text is available in English and Polish
- Dark theme matches `CLAUDE.md`
- Mobile layout is responsive and usable

## 13. Suggested Implementation Order

1. Static layout: canvas + control panel + header with dark theme
2. Starfield background rendering
3. Kepler orbit solver and heliocentric position computation
4. Planet rendering at computed positions (Sun-centered, no animation)
5. Animation loop with time advancement
6. Reference frame switching (vector subtraction)
7. Trail system (accumulation, rendering, fading, clearing)
8. Orbital guide ellipses (Sun-centered view)
9. Animation controls (speed slider, pause/play, reset)
10. Time display
11. Localization scaffolding (I18N + toggle)
12. Mobile responsive layout
13. Polish and final testing
