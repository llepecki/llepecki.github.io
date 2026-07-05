# Time Dilation Simulator: Requirements

Reference interaction/style baseline: `gravassist/index.html`

Target file: `timerel/index.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other learn apps in this folder,
- prefer the existing patterns already visible in files such as `gravassist/index.html`, `gravlens/index.html`, `mzinterferometer/index.html`, `doubleslit/index.html`, `waveinterference/index.html`, `momentum/index.html`, `angularmomentum/index.html`, and `logigate/index.html`,
- if this document leaves a low-level implementation detail unspecified, inherit the established project convention rather than inventing a new one,
- `gamgen/index.html` is explicitly **not** a baseline for code structure or visual style here and should be ignored when choosing conventions for this app.

## 1. Purpose & Educational Goal

This app visualizes time dilation from Einstein's special relativity through an interactive twin paradox scenario. Two characters — one standing on Earth, the other sitting in a rocket — experience different rates of time passage. The user chooses a real destination star and a travel speed (as a fraction of the speed of light). Upon launch, the rocket animates its journey to the star and back, while both characters' clocks tick at their relativistically correct rates.

The educational goal is to make the counterintuitive phenomenon of time dilation tangible and visual for young learners: at high speeds, time slows down for the traveler relative to the person who stays behind. After the round trip, the rocket traveler has aged less than the person on Earth.

## 2. Target Audience

Children aged 10–16 with curiosity about space and physics. The app assumes no prior knowledge of relativity. All controls must be intuitive, all displayed values clearly labeled, and the visual feedback strong enough that the core phenomenon is understood through observation alone.

## 3. Scope

A single self-contained HTML file (`timerel/index.html`) in the `learn/` directory. Dark theme per `docs/style.md`. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- Canvas-based animated visualization of a rocket round trip
- Real star destinations with correct distances
- Speed selection as a fraction of the speed of light
- Two clocks showing time dilation in real-time during animation
- Readouts for Lorentz factor, Earth time, rocket time
- Educational info section

Out of scope:

- General relativity effects (gravitational time dilation)
- Acceleration / deceleration modeling — constant velocity approximation is used
- Length contraction visualization
- Multi-file architecture or backend features

## 4. Concept Explanation

### 4.1 The Twin Paradox

If one twin stays on Earth and the other travels to a distant star at high speed and returns, the traveling twin will have aged less. This is not just a thought experiment — time dilation itself is a confirmed physical effect, verified with atomic clocks on aircraft, satellites, and other precision-clock experiments.

### 4.2 Why Constant Velocity Is Used

In reality, the rocket would need to accelerate, cruise, decelerate at the star, and reverse. However, for the educational purpose of demonstrating the γ factor, a constant-velocity model is sufficient and far simpler to understand. The rocket instantly reaches the chosen speed, travels at that speed to the star, and returns at the same speed. The turnaround at the star is instantaneous.

Important conceptual note: the app is drawn in the Earth frame. During each cruise leg, the Earth-frame calculation shows the Earth clock accumulating more elapsed time than the rocket clock. The asymmetry in the twin paradox comes from the traveler's change of inertial frame at turnaround. The app does not model that relativity-of-simultaneity jump explicitly; it only shows the correct elapsed times before departure and after reunion.

### 4.3 The Effect in Numbers

For a round trip to Proxima Centauri (4.24 ly) at 0.9c:

- Earth time: 9.42 years
- Lorentz factor γ: 2.29
- Rocket time: 4.11 years
- The Earth twin ages 5.31 years more

At 0.99c, γ = 7.09, and the rocket twin experiences only 1.21 years while 8.57 years pass on Earth.

## 5. Physics Model

### 5.1 Core Formulas

Let `β = v / c`, where `β` is the slider value between `0.10` and `0.99`. In code, this is the cleanest variable to use because it is dimensionless.

All time dilation is derived from the Lorentz factor:

```
γ = 1 / √(1 − β²)
```

Where:

- `v` is the rocket's physical velocity
- `c` is the speed of light
- `β` is the speed as a fraction of `c`
- `γ ≥ 1` always (equals 1 at v = 0, approaches ∞ as v → c)

For a round trip to a star at one-way distance `d` (in light-years) at speed fraction `β`:

If using SI-style units, the Earth-frame round-trip time is:

```
T_earth = 2d / (βc)
```

But for this app the distances are already in light-years and the times are displayed in years, so it is best to use relativistic natural units where:

```
c = 1 light-year per year
```

Then the formulas simplify to:

```
T_leg    = d / β                          (years per leg in Earth frame)
T_earth  = 2d / β                         (years)
T_rocket = T_earth / γ                    (years)
         = 2d √(1 − β²) / β
ΔT       = T_earth − T_rocket             (years)
```

### 5.2 Proper Time Interpretation

The rocket clock shows the traveler's proper time `τ`. For constant speed:

```
dτ = dt / γ = dt √(1 − β²)
```

So if the simulation advances by a small Earth-frame time step `dt`, the rocket clock must advance by `dt / γ`.

Because the app uses the same constant speed on the outbound and return legs, `γ` is the same on both legs. The rocket clock therefore always accumulates time more slowly by the same factor during both cruise segments.

### 5.3 Speed Representation

Speed is expressed as a fraction of c (e.g., 0.50c, 0.90c, 0.99c). This is standard in relativity and avoids unwieldy km/s numbers.

### 5.4 Simplifications

- Constant velocity — the rocket instantaneously reaches cruise speed.
- Flat spacetime — no gravitational effects.
- The turnaround at the star is instantaneous.
- No length contraction visualization.

### 5.5 Implementation Notes For Correct Timing

The simplest correct code path is:

```js
beta = clamp(speedFraction, BETA_MIN, BETA_MAX); // dimensionless speed fraction, e.g. 0.90
gamma = 1 / Math.sqrt(Math.max(EPS_BETA, 1 - beta * beta));
earthTotalYears = 2 * distanceLy / beta;
rocketTotalYears = earthTotalYears / gamma;
earthLegYears = distanceLy / beta;
rocketLegYears = earthLegYears / gamma;
```

If `p` is the normalized physical journey progress from `0` to `1`, excluding any decorative pause at the destination star, then:

```js
earthElapsedYears = p * earthTotalYears;
rocketElapsedYears = p * rocketTotalYears;
timeDifferenceYears = earthElapsedYears - rocketElapsedYears;
```

This means the clock values must be driven from simulation time or normalized physics progress, not from eased pixel position. The canvas distance scaling and any visual easing are presentation choices only and must not change the elapsed-time formulas.

### 5.6 Numerical Stability & Input Safety

The implementation must never produce `NaN`, `Infinity`, negative elapsed time, or runaway progress because of slider drift, floating-point edge cases, or large animation frame delays.

Required safeguards:

- `β` must always remain strictly greater than `0` and strictly less than `1`, even internally.
- Lorentz-factor calculation must protect the square-root radicand:

```js
beta = clamp(speedFraction, BETA_MIN, BETA_MAX);
gamma = 1 / Math.sqrt(Math.max(EPS_BETA, 1 - beta * beta));
```

- Time calculations must use the clamped `beta`, not the raw slider value.
- Normalized physical journey progress `p` must be clamped to `[0, 1]`.
- If the app uses accumulated simulation time, each animation frame should cap or smooth excessively large `dt` values so resuming after tab sleep or a lag spike does not skip through major portions of the trip.
- The decorative pause at the destination must never affect physical elapsed time.
- Any analog clock rendering should derive hand angle from a wrapped display value, not from an ever-growing raw angle, so very large trips do not create visual glitches.

These are not physics changes; they are implementation requirements needed to keep the physics display reliable.

## 6. Functional Requirements

### 6.1 Scene Layout

The canvas shows a horizontal scene:

- **Left zone**: Earth, represented as a blue-green sphere. A standing human figure next to it. A clock display above or beside the figure.
- **Right zone**: The destination star, represented as a glowing point with its name labeled. Position scaled to represent distance (not to true astronomical scale, but further stars should appear further right).
- **Middle**: A starfield background — random small dots of varying brightness, same approach as `gravassist/index.html`.
- **Rocket**: Initially positioned at Earth. After launch, animates rightward to the star, pauses briefly, then animates leftward back to Earth. A seated human figure is visible with or near the rocket. A clock display accompanies the rocket.

The canvas must fill the available space beside the control panel, consistent with the existing app layout pattern (canvas `flex: 1`, control panel `300px`).

Distance-placement requirement:

- the six listed stars span from `4.24 ly` to `2,600 ly`, so literal linear placement would not be usable on one canvas,
- use a monotonic compressed x-mapping such as logarithmic placement so farther stars still appear farther right,
- all elapsed-time calculations must continue to use the true physical distance from the dataset, not the compressed screen position.

### 6.2 Star Selection

A dropdown control offering the following real star destinations:

| Star              | Distance (ly) | Notes for child-friendly label           |
|-------------------|---------------|------------------------------------------|
| Proxima Centauri  | 4.24          | Nearest star to the Sun                  |
| Sirius            | 8.6           | Brightest star in the night sky          |
| Vega              | 25            | One of the brightest northern stars      |
| Polaris           | 430           | The North Star                           |
| Betelgeuse        | 700           | Red supergiant in Orion                  |
| Deneb             | 2,600         | Distant bright star in Cygnus            |

Each entry in the dropdown should show the star name and distance, e.g., "Proxima Centauri (4.24 ly)".

When the user changes the star, the scene updates to show the new destination. All readouts recalculate immediately.

Default selection: `Proxima Centauri`.

### 6.3 Speed Control

A slider controlling the rocket speed as a fraction of c:

- Range: 0.10c to 0.99c
- Step: 0.01c
- Default: 0.50c
- Display: current value shown in monospace font, e.g., "0.50 c"
- Step buttons (`−` / `+`) for fine adjustment

As the user moves the slider, readouts (γ, expected Earth time, expected rocket time) update live, even before launch.

### 6.4 Launch & Animation

**Launch button**: Starts the animation. Labeled "Launch" (EN) / "Start" (PL).

**Animation states:**

1. **Idle**: Rocket on Earth. Clocks at 0:00. User adjusts controls.
2. **Outbound**: Rocket moves rightward toward the star. Both clocks tick. Earth clock ticks faster than rocket clock — the rate ratio is γ : 1 in accumulated Earth time vs rocket time.
3. **Turnaround**: Rocket reaches the star. Brief visual pause (0.5–1 second real time). This pause is visual only and must not add any extra Earth or rocket elapsed years.
4. **Return**: Rocket moves leftward back to Earth. Clocks continue ticking at the same rate ratio.
5. **Landed**: Rocket returns to Earth. Animation stops. Final time values displayed prominently. A summary overlay or highlight shows the time difference.

**Animation speed control**: A slider (0.5× to 5×) controlling how fast the animation plays. This controls the visual playback speed, not the physics. It changes how quickly real milliseconds are converted into simulation progress, but it must not change `γ`, the total Earth time, or the total rocket time for a given star and speed.

Default playback speed: `1×`.

**During animation**: The launch button changes to a "Pause" button. Pausing freezes both clocks and the rocket position. Resuming continues from where it left off.

Both the decorative turnaround pause and the user-triggered pause must freeze physics completely. They must never change the final elapsed Earth time or rocket proper time.

**Reset button**: Returns to idle state. Clocks reset to zero. Rocket returns to Earth.

### 6.5 Clock Display

Two clocks must be visible at all times during the animation:

**Earth clock**: Associated with the Earth figure. Shows elapsed Earth time.

**Rocket clock**: Moves with the rocket. Shows elapsed rocket (proper) time.

Clock representation:

- Digital display showing years (e.g., "4.11 y" or "4.11 years").
- Optionally, an analog-style clock face where the hand speed visually differs between the two clocks, making the rate difference immediately apparent.

The key visual requirement: **the rate difference must be obvious**. When γ = 2, the Earth clock should tick approximately twice as fast as the rocket clock. Children must be able to see and understand this difference just by watching.

### 6.6 Readouts & Information

The control panel should display:

**Pre-launch readouts** (update live with slider changes):

- Distance to star: `XX.X ly`
- Speed: `0.XXc`
- Lorentz factor: `γ = X.XX`
- Expected Earth time: `XX.X years`
- Expected rocket time: `XX.X years`
- Expected time difference: `XX.X years`

**During and after animation**:

- Current Earth time elapsed
- Current rocket time elapsed
- Current time difference
- Journey phase: Outbound / Returning / Complete

**Info text section**: A brief explanation written for children:

- What is time dilation?
- Why does the rocket clock tick slower?
- Why does the traveler end up younger after coming back?
- Is this real? (Yes — confirmed by experiments with atomic clocks on aircraft and GPS satellites.)

The explanation should include one short conceptual sentence clarifying the asymmetry, for example:

- "During each straight part of the trip, each observer sees the other's moving clock run slow, but the traveler turns around and comes back, so the two do not stay in equivalent situations for the whole journey."

### 6.7 Summary Overlay

When the rocket returns to Earth, display a results summary:

- Earth time elapsed
- Rocket time elapsed
- Time difference
- A child-friendly message, e.g., "The traveler aged X.X years less than the person on Earth!"

The overlay must be dismissible (close button or click-away).

## 7. UX Requirements

### 7.1 Clarity for Children

- Large, obvious controls
- Clear visual distinction between the two clocks
- Color coding: Earth clock in Earth color (blue), rocket clock in rocket color (amber/orange)
- Short labels
- Immediate visual feedback when changing speed or star
- The time difference must be the focal point of the experience

### 7.2 Step Buttons

Every slider must have `−` and `+` buttons for fine stepping, consistent with the dark-theme step button pattern in `docs/style.md`.

### 7.3 Mobile Compatibility

The layout must be responsive. On narrow screens, the control panel stacks below the canvas, consistent with the existing app pattern.

### 7.4 Accessibility

- Canvas text rendered at legible sizes
- Sufficient contrast for all readouts
- Touch-friendly button sizes (minimum 44×44 touch targets)

## 8. Visual Design

### 8.1 Theme

Dark theme per `docs/style.md`:

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
  --earth-color: #4db8ff;     /* Earth, Earth clock, Earth figure */
  --rocket-color: #ffb347;    /* Rocket, rocket clock, rocket figure */
  --star-glow: #fff8e1;       /* Destination star glow */
  --star-dim: #6e7a8a;        /* Background starfield dots */
}
```

### 8.3 Scene Elements

- **Earth**: Circular, blue-green with subtle radial gradient and atmosphere glow. Does not need to be detailed — a recognizable circle with color is sufficient.
- **Destination star**: A bright point with radial glow. Size and color may vary by star type:
  - Proxima Centauri: small, reddish
  - Sirius: bright, white-blue
  - Vega: bright, white
  - Polaris: medium, yellowish-white
  - Betelgeuse: large, distinctly red-orange
  - Deneb: bright, blue-white
- **Rocket**: A simple triangular or rocket-shaped icon, pointed right when outbound, left when returning. Subtle engine glow or trail when moving.
- **Human figures**: Simplified stick figures or silhouettes. One standing (Earth), one seated (rocket). These are visual anchors for the clocks, not detailed illustrations.
- **Starfield**: Random dots of varying brightness, redrawn on resize. Same technique as `gravassist/index.html`.

### 8.4 Animation Effects

- Rocket engine glow or trailing particles when in motion
- Clock digits ticking — should feel alive, not static
- Subtle star parallax during rocket motion (optional enhancement)
- Return summary overlay with fade-in animation, consistent with `gravassist/index.html` game overlay style

## 9. Localization

Bilingual English / Polish, following the `mzinterferometer/index.html` pattern:

- `state.lang` variable
- `I18N` dictionary object with all translatable strings
- `applyTranslations()` function
- Header language toggle button (PL / EN)
- Canvas-rendered text must also respect the selected language

All user-visible text must be translated, including:

- Page title and subtitle
- Control labels
- Button labels (Launch, Pause, Reset)
- Star names
- Readout labels and units
- Info text
- Summary overlay text
- Journey phase labels

Polish star names:

| English            | Polish              |
|--------------------|---------------------|
| Proxima Centauri   | Proxima Centauri    |
| Sirius             | Syriusz             |
| Vega               | Wega                |
| Polaris            | Gwiazda Polarna     |
| Betelgeuse         | Betelgeza           |
| Deneb              | Deneb               |

## 10. Technical Constraints

- Single self-contained HTML file with inline CSS and JavaScript
- Vanilla JavaScript, no external libraries or frameworks
- HTML5 Canvas for all rendering
- Google Fonts: Outfit + Share Tech Mono
- Device pixel ratio handling for retina displays
- `requestAnimationFrame` for the animation loop
- Responsive layout: canvas `flex: 1` + `300px` control panel

## 11. Open Design Decisions

The implementing agent must resolve:

- Exact clock visual design — analog face, digital counter, or both
- How to represent the human figures — stick figures, silhouettes, or minimalist icons
- Exact star rendering per star type — color, size, glow radius
- Whether rocket motion is linear across the canvas or uses easing for launch and landing. If easing is used, it must be visual only; the clock math must still come from linear simulation time.
- Whether to show the formula `γ = 1/√(1 − v²/c²)` directly on the canvas or only in the info section
- Exact summary overlay design and dismiss behavior
- Whether to include a real-world analogy (e.g., "In Earth time, X generations would have passed")
- Exact values for `EPS_BETA` and any per-frame `dt` cap

## 12. Acceptance Criteria

The app is complete when:

- The user can select from 6 real star destinations with correct distances
- The user can set speed from 0.10c to 0.99c with a slider and step buttons
- Pre-launch readouts update live as controls change
- Launching starts the animation: rocket flies to the star and back
- Two clocks tick at visibly different rates, with the correct γ ratio
- The Earth clock always shows more elapsed time than the rocket clock
- Allowed inputs and animation edge cases do not produce `NaN`, `Infinity`, negative elapsed times, or progress overshoot
- Decorative turnaround pause and user pause do not alter the final elapsed Earth time or rocket proper time
- Numerical verification at known values:
  - At 0.99c to Proxima Centauri: Earth time ≈ 8.57 years, rocket time ≈ 1.21 years (γ ≈ 7.09)
  - At 0.50c to Proxima Centauri: Earth time ≈ 16.96 years, rocket time ≈ 14.69 years (γ ≈ 1.155)
- A summary overlay shows the time difference after the round trip completes
- Animation can be paused, resumed, and reset
- Animation speed control works independently of the physics
- All text is available in English and Polish
- Dark theme matches `docs/style.md`
- Mobile layout is responsive and usable

## 13. Suggested Implementation Order

1. Static layout: canvas + control panel + header with dark theme
2. Starfield background rendering
3. Scene elements: Earth, star, rocket, human figures
4. Readout calculations (γ, times) reactive to control changes
5. Launch animation with rocket motion
6. Clock display and ticking at different rates
7. Summary overlay on journey completion
8. Animation speed control, pause / resume, reset
9. Localization scaffolding (I18N + toggle)
10. Mobile responsive layout
11. Polish and final testing
