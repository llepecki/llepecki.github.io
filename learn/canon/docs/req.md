# Planet Cannon Game: Requirements

Reference interaction/style baseline: `gravassist/index.html`

Target file: `canon/index.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other learn apps in this folder,
- prefer the existing patterns already visible in files such as `gravassist/index.html`, `gravlens/index.html`, `mzinterferometer/index.html`, `doubleslit/index.html`, `waveinterference/index.html`, `momentum/index.html`, `angularmomentum/index.html`, and `logigate/index.html`,
- if this document leaves a low-level implementation detail unspecified, inherit the established project convention rather than inventing a new one,
- `gamgen/index.html` is explicitly **not** a baseline for code structure or visual style here and should be ignored when choosing conventions for this app.

## 1. Purpose & Educational Goal

This app is a playful projectile-motion game for children. A cannon sits in the lower-left corner of the scene. The user aims it by dragging a launch vector, chooses the world where the shot takes place, adjusts the cannonball mass, and then fires.

The educational goal is to make four ideas visually obvious:

- stronger gravity bends the path downward faster,
- a larger initial speed makes the ball fly higher and farther,
- launch direction changes the tradeoff between height and range,
- mass changes weight, momentum, and kinetic energy, but in the idealized vacuum model it does **not** change the ballistic arc.

The final point is important. Many children expect a heavier cannonball to follow a different path. This app should use that misconception as a teaching moment, not reinforce it.

The app also includes a "Hit the Target" game mode so the child learns by trying, missing, adjusting, and trying again.

## 2. Target Audience

Children aged 8-14 and curious adults. The app assumes no prior knowledge of vectors or projectile equations. The controls must be direct, the visual feedback immediate, and the readouts simple enough that the child can learn mainly by looking and experimenting.

## 3. Scope

A single self-contained HTML file (`canon/index.html`) in the `learn/` directory. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- Canvas-based cannonball simulation
- Five selectable worlds: Moon, Mercury, Venus, Earth, Mars
- Draggable launch vector, using the same direct-manipulation feel as `gravassist/index.html`
- Adjustable cannonball mass
- Live trajectory preview before launch
- Animated cannonball with a ground shadow / projection marker
- Explore mode and Hit the Target game mode
- Readouts for gravity, speed, angle, range, flight time, maximum height, mass, weight, momentum, and kinetic energy
- Child-friendly explanation of why mass does not change the path in the chosen model

Out of scope:

- Air resistance
- Spin, Magnus effect, or bouncing
- Planet rotation, Coriolis effect, or curved planetary surfaces
- Orbital mechanics or escape trajectories
- Destructible terrain
- Multi-file architecture or backend features

## 4. Concept Explanation

### 4.1 What The App Teaches

The cannonball moves because it starts with an initial velocity vector and then gravity continuously pulls it downward.

If the child:

- increases speed, the ball travels farther and usually higher,
- increases the angle, the ball goes more upward and less sideways,
- changes the world, the same shot behaves differently because gravity is different,
- changes only the mass, the path stays the same in this idealized model.

### 4.2 Why Different Worlds Matter

Each world has a different surface gravity. A shot that is short and steep on Earth can become long and floaty on the Moon. Mercury and Mars are close to each other, which is also educational: not all worlds differ dramatically.

### 4.3 Why Mass Is Still Included

Mass matters physically, but not in the way many children first expect.

For the same launch speed and angle:

- a heavier cannonball weighs more,
- a heavier cannonball has more momentum,
- a heavier cannonball has more kinetic energy,
- but the trajectory is the same if air resistance is ignored.

The app should make that "same arc" result visually explicit.

### 4.4 Why A Shadow / Ground Projection Is Included

Children often understand height better when they can compare the ball to the ground directly below it. The app therefore shows a soft shadow / projection marker on the ground at the ball's current horizontal position.

This is a teaching aid, not a full sunlight simulation. Its job is to show where the ball is above the ground, not where the Sun would cast a literal shadow.

### 4.5 Why The Game Mode Matters

Explore mode teaches by free experimentation. Game mode turns the same physics into a challenge: to hit the target, the child must adjust angle and speed intelligently. If the child changes only the mass and expects a different arc, the game should gently reveal that this does not help.

## 5. Physics Model

### 5.1 Coordinate System And Units

Use a 2D Cartesian model:

- `x` increases to the right
- `y` increases upward
- the ground is the line `y = 0`
- the cannon muzzle starts at `(0, h0)`

Recommended fixed muzzle height:

```text
h0 = 2.0 m
```

This avoids the degenerate visual case where a `0 deg` shot fired from ground level would "land" instantly at the cannon.

Units:

- distance: meters
- time: seconds
- speed: meters per second
- mass: kilograms
- gravity: meters per second squared

### 5.2 World Gravity Dataset

Use these approximate surface-gravity values:

| World   | Gravity `g` (m/s^2) | Relative to Earth | Notes |
|---------|----------------------|-------------------|-------|
| Moon    | 1.62                 | 0.165 g           | Very low gravity |
| Mercury | 3.70                 | 0.377 g           | Close to Mars |
| Venus   | 8.87                 | 0.904 g           | Atmosphere ignored on purpose |
| Earth   | 9.81                 | 1.000 g           | Familiar baseline |
| Mars    | 3.71                 | 0.378 g           | Close to Mercury |

Important modeling note:

- Venus really has a thick atmosphere, but this app intentionally ignores drag on all worlds so the child can isolate the role of gravity.

### 5.3 Initial Velocity Vector

The user sets:

- speed magnitude `v0`
- launch angle `theta`

The angle must always stay in:

```text
0 deg <= theta <= 90 deg
```

So the cannon always shoots upward-right or straight up.

Recommended speed range:

```text
10 m/s to 100 m/s
```

Recommended default:

```text
v0 = 50 m/s
theta = 45 deg
```

Decompose the vector into components:

```text
vx0 = v0 cos(theta)
vy0 = v0 sin(theta)
```

### 5.4 Core Equations Of Motion

For a projectile under constant downward gravity and no drag:

```text
x(t) = vx0 t
y(t) = h0 + vy0 t - (1/2) g t^2

vx(t) = vx0
vy(t) = vy0 - g t
```

Instantaneous speed:

```text
v(t) = sqrt(vx(t)^2 + vy(t)^2)
```

These equations are the correct core model for the app.

### 5.5 Derived Readouts

Time to apex:

```text
t_apex = vy0 / g
```

Maximum height:

```text
y_max = h0 + vy0^2 / (2g)
```

Ground-impact time uses the positive root of `y(t) = 0`:

```text
t_hit = (vy0 + sqrt(vy0^2 + 2gh0)) / g
```

Range:

```text
R = vx0 * t_hit
```

These readouts should update live before launch.

### 5.6 Mass Interpretation

Mass must affect these quantities:

```text
weight W = m g
momentum p = m v0
kinetic energy K = (1/2) m v0^2
```

Mass must **not** affect the trajectory if the app's stated assumptions remain:

- same world,
- same `v0`,
- same `theta`,
- no drag.

This comes directly from Newton's second law:

```text
F = m a
gravity force = m g
therefore a = F / m = g
```

The `m` cancels. That is a core scientific requirement, not an optional interpretation.

### 5.7 Recommended Computational Form

The implementation should use the parametric time form above for both prediction and animation.

Do **not** make the `y(x)` parabola form the primary simulation path:

```text
y(x) = h0 + x tan(theta) - g x^2 / (2 v0^2 cos^2(theta))
```

That formula is mathematically correct away from vertical launch, but it becomes numerically awkward near `theta = 90 deg` because of the `cos(theta)^2` denominator.

The robust approach is:

1. compute `vx0` and `vy0`,
2. compute `t_hit`,
3. sample `t` from `0` to `t_hit`,
4. evaluate `x(t)` and `y(t)`.

### 5.8 Shadow / Ground Projection Model

The shadow marker should sit at:

```text
(x(t), 0)
```

Recommended behavior:

- soft oval on the ground,
- darker and tighter when the ball is near the ground,
- lighter and broader when the ball is high.

This is intentionally a vertical ground projection, not a true Sun-angle shadow.

### 5.9 Target-Mode Reachability

The game mode must only generate reachable targets.

Required logic:

- compute the maximum reachable horizontal distance for the current world using the same physics code path as the shot solver,
- generate target positions only within a safe interior band of that reachable range,
- reserve keep-out space near the cannon and near the extreme edge of the range.

Recommended spawn band:

```text
15% to 85% of max reachable range
```

Important note:

- because `h0 > 0`, the exact angle for maximum range is slightly below `45 deg`,
- therefore target generation should not hard-code `45 deg` unless the implementation also verifies it numerically,
- the cleanest approach is to numerically scan or optimize the same trajectory function used elsewhere.

### 5.10 Numerical Stability And Singularity Guards

The implementation must never produce `NaN`, `Infinity`, broken camera scaling, stuck animations, or unreachable targets caused by edge cases.

Required safeguards:

- `theta` must always be clamped to `[0, pi/2]`
- `v0` must always be clamped to `[V_MIN, V_MAX]`
- mass must always be clamped to `[MASS_MIN, MASS_MAX]` with `MASS_MIN > 0`
- gravity must come only from the fixed world table and therefore always remain positive
- the simulation must use the time-parametric form, not divide by `vx0`, `tan(theta)`, or `cos(theta)^2`
- the discriminant `vy0^2 + 2gh0` must be protected with `max(0, ...)` before square root
- very large animation-frame `dt` values must be capped so tab sleep or lag does not skip across the shot
- the active shot parameters should freeze at launch; changing controls mid-flight should affect the next forecast, not mutate the current projectile
- camera width and height must have minimum world extents so a vertical shot or tiny hop does not collapse the view to zero
- target generation must be rerun if the selected world changes or if a target becomes unreachable under the allowed control range
- hit detection should use finite tolerances and sampled segments, not exact floating-point equality
- if any intermediate value is non-finite anyway, the app must cancel the shot safely and fall back to the last valid idle state instead of crashing

Recommended protected computation:

```js
const theta = clamp(rawTheta, 0, Math.PI / 2);
const speed = clamp(rawSpeed, V_MIN, V_MAX);
const mass = clamp(rawMass, MASS_MIN, MASS_MAX);
const g = WORLD_G[selectedWorld];

const vx0 = speed * Math.cos(theta);
const vy0 = speed * Math.sin(theta);
const disc = Math.max(0, vy0 * vy0 + 2 * g * H_MUZZLE);
const tHit = (vy0 + Math.sqrt(disc)) / g;
```

## 6. Functional Requirements

### 6.1 Scene Layout

The scene should feel like a toy laboratory on another world.

Required composition:

- cannon anchored in the lower-left corner
- flat ground line extending to the right
- target area on the right side
- large open sky / space above the ground
- live projectile and its ground shadow
- control panel beside the canvas on desktop, stacked below on narrow screens

The cannon itself should remain visually fixed near the lower-left even when the world scale changes.

### 6.2 Camera And World-To-Screen Scaling

The app should auto-fit the predicted arc and the target so the child can actually see what is happening on every world.

Required behavior:

- keep the cannon visually near the lower-left anchor position,
- scale the world so the current predicted apex and landing zone are visible with margin,
- include minimum width and height guards so nearly vertical or nearly horizontal shots still render cleanly,
- animate scale transitions smoothly enough that world changes do not feel jarring.

Important requirement:

- display scaling is a presentation choice only and must not change the physics.

### 6.3 App Modes

The app has two modes:

1. **Explore**
2. **Hit the Target**

Explore mode:

- free adjustment of world, mass, speed, and angle,
- always shows live forecast and readouts,
- emphasizes understanding over scoring.

Default startup mode: `Explore`.

Hit the Target mode:

- places a reachable target,
- tracks whether the shot hits,
- offers a "New Target" button,
- celebrates success with a kid-friendly animation and message.

The physics must be identical in both modes.

### 6.4 World Selection

The child selects one of five worlds:

- Moon
- Mercury
- Venus
- Earth
- Mars

The selector should use buttons or a segmented control, not a buried menu.

Default world: `Earth`.

When the world changes, the app updates immediately:

- gravity value,
- background art and palette,
- trajectory preview,
- readouts,
- target placement rules in game mode.

### 6.5 Launch Vector Control

The primary interaction should reuse the feel of the draggable velocity vector in `gravassist/index.html`.

Required behavior:

- the vector root is fixed at the cannon muzzle,
- the child drags the tip of the vector,
- angle is encoded by vector direction,
- speed is encoded by vector length,
- the vector may rotate only between `0 deg` and `90 deg`,
- the vector may grow or shrink only within the chosen speed range.

Helpful UI details:

- show a dotted radius guide while dragging,
- show live numeric labels such as `50 m/s` and `45 deg`,
- support a precision-drag mode for fine adjustment,
- support touch dragging as a first-class interaction.

For accessibility and precision, also include `-` / `+` step controls for:

- speed
- angle

### 6.6 Mass Control

Add a separate mass control.

Recommended range:

```text
0.5 kg to 20.0 kg
```

Recommended step:

```text
0.5 kg
```

Recommended default:

```text
5.0 kg
```

Required behavior:

- changing mass updates weight, momentum, and kinetic-energy readouts immediately,
- changing mass alone must not move the forecast arc,
- the UI should highlight this with a subtle note such as "Same path in vacuum."

Strongly recommended comparison aid:

- keep the previous forecast as a faint ghost line when the user changes only mass, so the unchanged trajectory becomes visually obvious.

### 6.7 Pre-Launch Forecast

Before launch, show a complete forecast:

- dotted or glowing trajectory arc,
- apex marker,
- landing marker,
- projected ground shadow path,
- target position if in game mode.

Readouts should update live:

- world gravity
- mass
- launch speed
- launch angle
- horizontal speed `vx0`
- vertical speed `vy0`
- time to apex
- total flight time
- maximum height
- range
- weight
- momentum
- kinetic energy

### 6.8 Launch, Animation, Pause, Reset

Required controls:

- `Launch`
- `Pause` / `Resume`
- `Reset`

Animation states:

1. **Idle**: forecast visible, no active projectile
2. **Flying**: cannonball moves along the sampled path, shadow updates continuously
3. **Paused**: projectile and readouts freeze
4. **Resolved**: the shot either lands or hits the target, and the result is shown

During the shot:

- the ball should be easy to track,
- the shadow must stay directly below the ball,
- a short landing effect such as dust or a bounce-free puff may play at impact,
- the next shot should return cleanly to a stable idle state.

### 6.9 Hit Detection

The target should be a cheerful object on or just above the ground line: for example a flag, crate, robot, or round bullseye marker.

Required hit logic:

- give the target a finite width and height,
- detect intersection between the projectile path and the target hitbox,
- use tolerant segment-based checks, not exact equality.

Gameplay requirements:

- a successful hit triggers a celebratory overlay,
- a miss triggers a short hint such as "Try a steeper angle" or "Mass changed the thump, not the path",
- the game should allow immediate replay with the same target,
- `New Target` should create another reachable challenge.

### 6.10 Teaching Text And Explanatory Prompts

The app should include a short child-friendly explanation:

- gravity pulls down all the time,
- speed gives the ball more forward and upward motion,
- angle changes how the speed is split between horizontal and vertical parts,
- mass changes weight and impact quantities, but not the path in this simplified model.

Recommended short prompts:

- "Moon shots float longer."
- "Venus pulls almost as hard as Earth."
- "Changing mass does not change the arc here."
- "To hit the target, change speed or angle."

## 7. UX Requirements

### 7.1 Clarity For Children

- large obvious controls
- short labels
- immediate visual feedback
- one main action at a time
- forecast arc clearly separated from the actual flying shot
- target and shadow easy to distinguish from the ball itself

### 7.2 Direct Manipulation

The vector drag must feel smooth and trustworthy. The child should not need to type numbers to use the app well.

The direct-manipulation rule is:

- drag first,
- read numbers second.

### 7.3 Step Buttons

Every slider-like quantity should also have `-` and `+` step controls:

- speed
- angle
- mass

This matches the interaction quality expected in the other apps.

### 7.4 Mobile Compatibility

The layout must be responsive:

- desktop: canvas beside control panel
- narrow screens: canvas on top, control panel below

Touch targets should be at least `44 x 44 px`.

### 7.5 Accessibility

- readable canvas labels
- strong contrast between ball, forecast, target, and shadow
- color should not be the only indicator of hit / miss / current mode
- controls must remain usable without hover

## 8. Visual Design

### 8.1 Theme

Use the light-theme structure from `CLAUDE.md` for the UI, but let the canvas art change per world.

Recommended base UI palette:

```css
:root {
  --bg: #faf7f0;
  --panel: #ffffff;
  --panel-border: #e7dcc9;
  --text: #39434d;
  --text-head: #25313b;
  --text-dim: #6e7d8c;
  --text-label: #92a0ad;
  --accent: #e76f51;
  --accent-light: #fff1ec;
}
```

### 8.2 App-Specific Colors

```css
:root {
  --cannon-color: #264653;
  --arc-color: #3a86ff;
  --arc-ghost: rgba(58, 134, 255, 0.18);
  --ball-color: #ffb703;
  --ball-stroke: #8d5b00;
  --shadow-color: rgba(32, 40, 52, 0.22);
  --target-color: #ef476f;
  --success-color: #2a9d8f;
}
```

### 8.3 World-Specific Scene Direction

Each world should have its own atmosphere even though the mechanics stay consistent:

| World   | Sky / Background Direction | Ground Direction |
|---------|----------------------------|------------------|
| Moon    | black sky, stars, pale glow | gray dust and craters |
| Mercury | very dark sky, harsh sunlight | rocky ash-brown ground |
| Venus   | warm yellow haze | soft ochre ground |
| Earth   | blue sky with playful clouds | green-brown field |
| Mars    | pink-orange sky | red dusty terrain |

The app should feel rich and playful, not sterile.

### 8.4 Scene Elements

- a cartoon-styled cannon with clear barrel direction
- a bright, readable projectile
- a soft animated ground shadow
- a target with personality
- subtle launch smoke and landing dust
- small environment details that support each world without cluttering the physics

### 8.5 Motion

Recommended animation polish:

- cannon recoil at launch
- a small muzzle flash or smoke puff
- smooth shadow motion
- celebratory hit animation in game mode
- gentle camera rescale transitions after control changes

## 9. Localization

Bilingual English / Polish, consistent with the existing app pattern:

- `state.lang`
- `I18N` dictionary
- `applyTranslations()` function
- language toggle in the header
- canvas-rendered labels must also respect the selected language

All user-visible text must be translated, including:

- page title and subtitle
- mode labels
- control labels
- world names
- button labels
- readout labels and units
- instructional text
- hit / miss messages

World names in Polish:

| English | Polish   |
|---------|----------|
| Moon    | Ksiezyc  |
| Mercury | Merkury  |
| Venus   | Wenus    |
| Earth   | Ziemia   |
| Mars    | Mars     |

## 10. Technical Constraints

- single self-contained HTML file with inline CSS and JavaScript
- vanilla JavaScript only
- HTML5 Canvas for all rendering
- Google Fonts: Outfit + Share Tech Mono
- retina / device-pixel-ratio support
- `requestAnimationFrame` for animation
- responsive layout: canvas `flex: 1`, control panel about `300px`

## 11. Open Design Decisions

The implementing agent must resolve:

- exact target art style
- exact success / miss overlay design
- whether the previous-shot ghost is always visible or optional
- exact speed-to-arrow-length mapping
- exact camera padding and transition easing
- whether to show component arrows for `vx` and `vy`
- exact mass range if playtesting suggests a clearer range

## 12. Acceptance Criteria

The app is complete when:

- the user can choose Moon, Mercury, Venus, Earth, and Mars
- the user can drag a launch vector anchored at the cannon muzzle
- the launch angle cannot leave the `0 deg` to `90 deg` range
- the user can adjust mass independently of angle and speed
- a live forecast arc updates before launch
- the moving cannonball shows a ground shadow / projection marker
- Explore mode and Hit the Target mode both work
- target mode never spawns an impossible target
- changing only mass changes weight / momentum / kinetic energy readouts but not the predicted arc
- the app remains stable at `0 deg`, `90 deg`, low-speed, high-speed, and very small-range shots
- no allowed interaction produces `NaN`, `Infinity`, frozen camera scaling, or broken controls

Numerical sanity checks for the reference setup:

```text
h0 = 2.0 m
v0 = 50.0 m/s
theta = 45 deg
mass = 10.0 kg
```

Expected approximate results:

- Earth (`g = 9.81`): `t_hit ~= 7.264 s`, `range ~= 256.8 m`, `max height ~= 65.7 m`, `weight ~= 98.1 N`
- Moon (`g = 1.62`): `t_hit ~= 43.705 s`, `range ~= 1545.2 m`, `max height ~= 387.8 m`, `weight ~= 16.2 N`
- Mercury (`g = 3.70`): `range ~= 677.7 m`
- Venus (`g = 8.87`): `range ~= 283.8 m`
- Mars (`g = 3.71`): `range ~= 675.8 m`

Mass-independence check:

- for the same world, `v0`, and `theta`, changing mass from `1 kg` to `10 kg` must leave `t_hit`, `range`, and `max height` unchanged
- on Earth at `10 kg` and `50 m/s`, `K = 12,500 J` and `p = 500 kg*m/s`

Edge-case checks:

- Earth, `v0 = 50 m/s`, `theta = 0 deg`, `h0 = 2 m`: `t_hit ~= 0.639 s`, `range ~= 31.9 m`
- Earth, `v0 = 50 m/s`, `theta = 90 deg`, `h0 = 2 m`: range should be effectively `0`, with no divide-by-zero or rendering failure

## 13. Suggested Implementation Order

1. Static layout: header, canvas, control panel, mode switch
2. World selector and scene palettes
3. Cannon rendering and fixed lower-left anchor
4. Draggable launch vector interaction
5. Physics readouts and live trajectory forecast
6. Ball animation and ground shadow
7. Hit-the-target mode and reachability-safe target spawning
8. Success / miss overlays and polish
9. Localization scaffolding
10. Mobile layout and final testing

## 14. Scientific Review Of The Physics And Mathematics

### 14.1 Overall Scientific Verdict

This is a scientifically sound educational app **if** it is presented honestly as an idealized vacuum projectile simulator with constant local gravity.

That simplification is appropriate for the learning goal. It isolates the effect of:

- gravity strength,
- initial speed,
- launch angle,
- and mass-dependent quantities such as weight and momentum.

### 14.2 What Is Scientifically Correct Here

These choices are correct and defensible:

- using constant downward acceleration `g` for each world,
- modeling motion in 2D,
- decomposing the launch vector into horizontal and vertical components,
- using `x(t)` and `y(t)` parametric equations,
- showing that mass does not change the trajectory under the stated assumptions,
- using a shadow / ground projection as a visual aid.

### 14.3 The Most Important Physics Constraint

The app must not imply that heavier cannonballs follow different arcs when:

- the world is fixed,
- the launch speed is fixed,
- the launch angle is fixed,
- drag is absent.

If the implementation makes mass alter the path under those assumptions, the app becomes scientifically wrong.

Mass **should** alter:

- weight,
- momentum,
- kinetic energy.

Mass should **not** alter:

- time of flight,
- maximum height,
- horizontal range,
- trajectory shape.

### 14.4 Why Constant Gravity Is A Good Approximation

For the intended scale of this app, the flight heights are tiny compared with planetary radii. Even the Moon shots in this toy simulator remain extremely close to the surface compared with the Moon's radius. That means treating `g` as constant is an excellent approximation for educational use.

This also keeps the model readable for children. Using inverse-square gravity would add complexity while providing little visible educational benefit at this scale.

### 14.5 Honest Simplifications The App Must State

The app should state, at least briefly, that it ignores:

- air resistance,
- spin,
- atmospheric lift,
- terrain shape,
- planetary curvature,
- rotation and Coriolis deflection.

This matters especially for Venus. In real life, Venus's atmosphere would dominate the motion of a cannonball. The app is allowed to ignore that, but it should say so.

### 14.6 Best Mathematical Representation

For a robust implementation, the best mathematical form is the time-parametric one:

```text
x(t) = vx0 t
y(t) = h0 + vy0 t - (1/2) g t^2
```

This representation remains well-behaved at both extreme allowed angles:

- `theta = 0 deg`
- `theta = 90 deg`

By contrast, formulas that divide by `cos(theta)` or `vx0` are fragile near vertical launch.

Recommendation:

- use parametric equations for prediction,
- use the same equations for animation,
- use the same equations again for target generation and hit checks.

One physics model, one code path, fewer mismatches.

### 14.7 Mathematical Review Of The Target Game

The target game is scientifically valid if the target is generated from the same motion model as the shot.

The safest rule is:

1. compute the reachable envelope from the actual solver,
2. place the target inside that envelope,
3. detect hits against the same sampled path used for rendering.

This avoids a common bug where the UI previews one path but the game judges another.

### 14.8 Singularity And Weird-State Review

The app has a few mathematically sensitive corners. They are manageable if the design explicitly guards them.

Required guards:

- **Vertical-launch guard**: never divide by `vx0` or `cos(theta)` when `theta` can equal `90 deg`
- **Horizontal-launch guard**: `theta = 0 deg` must still be treated as a valid shot, not a broken one
- **Positive-mass guard**: never allow `m <= 0`
- **Positive-gravity guard**: never allow `g <= 0`
- **Square-root guard**: clamp the impact-time discriminant before `sqrt`
- **Finite-camera guard**: impose minimum world width and height for auto-scaling
- **Target-reachability guard**: never spawn targets outside the solver's reachable band
- **Large-dt guard**: cap animation time steps after tab sleep or lag spikes
- **State-freeze guard**: once fired, a shot should keep its launch parameters until it resolves
- **Non-finite fallback guard**: if a non-finite number appears anyway, abort to a safe idle state rather than crash

### 14.9 Final Scientific Conclusion

This app can be both fun and scientifically clean.

Its strongest educational feature is not only that children can see trajectories change across worlds, but that they can discover a real physics surprise:

- gravity matters,
- speed matters,
- direction matters,
- mass changes some quantities,
- but in ideal projectile motion mass does not change the arc.

That is a strong and honest lesson, and the proposed design supports it well.
