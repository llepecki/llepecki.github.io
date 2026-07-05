# Bug Hill Work Lab: Requirements

Reference interaction/style baseline: `logigate/index.html`

Reference route-editor interaction baseline: custom pattern mode in `gamgen/index.html`

Target file: `bughill/index.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other `learn/` apps in this folder,
- use the compact header + control strip + one large interactive surface + concise status bar pattern already visible in `logigate/index.html`,
- reuse the **guided custom-drawing interaction family** from `gamgen/index.html` for route construction: visible snap grid, highlighted legal next targets, one-step-at-a-time path building, and undo/clear affordances,
- use the **light-theme** family from `CLAUDE.md`, because terrain, contour lines, and route sketches read more clearly on a light background,
- if this document leaves a low-level implementation detail unspecified, inherit established project convention rather than inventing a new interaction language.

## 1. Purpose & Educational Goal

This app teaches children the difference between:

- **height gained**,
- **distance traveled**,
- **force needed right now**,
- and **total work done to reach the top**.

The user controls how steep the hill is, then draws a route for a cartoon bug from the bottom to the peak. The route may be direct, diagonal, zigzagging, or even include wasteful downhill detours. The app then animates the bug and explains what changed physically.

The central learning goals are:

- a steeper direct route is shorter, but it requires a larger uphill push,
- a diagonal or switchback route feels gentler because the needed force along the path is smaller,
- in the **ideal no-friction model**, all non-descending routes to the same summit require the same net work against gravity,
- extra down-and-up detours increase total positive climbing work,
- if an optional friction model is enabled, longer routes really do cost extra total work.

Important conceptual requirement:

- the app must **not** teach that a `45°` route has a universal minimum-work property,
- instead, it should show that a `45° switchback` can reduce **force**, not ideal net work,
- this distinction is one of the main educational payoffs of the app.

## 2. Target Audience

Children aged roughly 10-16, plus parents and teachers. The app assumes no prior knowledge of vectors, line integrals, or conservative forces.

The user should come away able to say:

- `Going sideways can make the climb feel easier.`
- `The top is still the same height.`
- `Same height means the same ideal gravity work if I never go back down.`
- `Extra detours can waste effort.`

## 3. Scope

A single self-contained HTML file (`bughill/index.html`) in the `learn/` directory. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- adjustable hill slope angle
- custom uphill-route drawing on a visible snap grid from bottom start to top summit
- animated bug crawling along the route
- live route metrics
- preset comparison routes
- explanation of force vs work
- optional advanced friction mode
- comparison table for the current route and up to 3 saved routes
- a small cumulative-work chart

Out of scope:

- arbitrary 3D terrain
- multi-peak mountains
- realistic insect biomechanics
- differential-geometry formalism or university-level notation
- backend features or multi-file architecture

## 4. High-Level Product Concept

The app should feel like a topographic notebook page mixed with a toy science lab.

The user sees a rectangular hill surface from above:

- the bottom edge is low elevation,
- the top edge is the summit ridge,
- contour lines show equal-height bands,
- the bug starts near the bottom center,
- a summit flag sits near the top center.

The user builds a route across the sloped surface point by point on a visible hill grid. After pressing `Run`, the bug crawls along that route. As it moves, the app highlights:

- current height,
- current uphill force,
- accumulated work,
- and the final summary once the summit is reached.

This should be an **interactive misconception-checker**:

- many users will expect that a diagonal or `45°` route requires less total work,
- the app should let them test that idea directly,
- then explain the correct result with minimal but clear language.

## 5. Core Scientific Model

### 5.1 Hill Geometry

Model the hill as a single inclined plane with constant slope.

Use a surface coordinate system:

- `x`: sideways across the hill
- `y`: uphill along the direction of steepest ascent

Fixed physical dimensions for `v1`:

- surface width: `10 m` (`x` from `-5 m` to `+5 m`)
- uphill surface length: `12 m` (`y` from `0 m` to `12 m`)

The hill angle `α` is adjustable:

- minimum: `5°`
- maximum: `60°`
- default: `30°`
- step: `1°`

Summit height above the base:

```text
H = 12 * sin(α)
```

### 5.2 Bug Physics Constants

Use a symbolic teaching bug rather than a biologically realistic one.

- mass `m = 1.0 kg`
- gravity `g = 9.81 m/s²`

This keeps the displayed work in readable Joules instead of tiny fractions. The app should not pretend the bug is literally 1 kilogram; it is a scaled teaching model.

### 5.3 Route Representation

The drawn route is a polyline on the hill surface, built on a fixed snap grid:

```text
P0, P1, P2, ... , Pn
```

Each point is stored in hill-surface coordinates `(x, y)`.

Requirements:

- use a fixed integer grid:
  - `x ∈ {-5, -4, ..., +5}`
  - `y ∈ {0, 1, ..., 12}`
- route starts at the start node `(0, 0)`,
- route ends at the summit node `(0, 12)`,
- each new point is chosen by clicking/tapping one highlighted legal next node,
- every segment connects adjacent grid nodes only,
- route must stay within the hill rectangle,
- self-crossing is allowed,
- revisiting earlier nodes is allowed,
- maximum segment count for `v1`: `48`.

### 5.4 Segment Quantities

For each segment `i` from `Pi` to `Pi+1`:

```text
dx = x(i+1) - x(i)
dy = y(i+1) - y(i)
ds = sqrt(dx² + dy²)
dh = dy * sin(α)
```

Where:

- `ds` is distance traveled along the hill surface,
- `dh` is change in vertical height.

### 5.5 Key Metrics

Display these metrics clearly:

Surface distance:

```text
S_total = Σ ds
```

Net height gained:

```text
H_net = (y_end - y_start) * sin(α)
```

Total positive climb:

```text
H_up = Σ max(dh, 0)
```

Ideal net work against gravity:

```text
W_net = m * g * H_net
```

Total positive climbing work:

```text
W_up = m * g * H_up
```

Important interpretation:

- if the route always keeps moving uphill, then `W_up = W_net`,
- if the route goes downhill and then climbs back up, then `W_up > W_net`.

### 5.6 Force Along The Path

For a segment moving uphill at some sideways angle, the component of gravity opposing the motion is:

```text
F_ideal = m * g * sin(α) * max(0, dy / ds)
```

This gives the push needed from the bug along that segment in the ideal model.

Interpretation:

- direct uphill segment: larger `F_ideal`
- diagonal segment: smaller `F_ideal`
- perfectly sideways contour segment: `F_ideal = 0`

This is the quantity that should make zigzags feel gentler.

### 5.7 Optional Friction Mode

The app should include an advanced toggle:

- `Ideal`
- `With Friction`

When friction is enabled, use a simple isotropic model:

- friction coefficient `μ`, adjustable from `0.00` to `0.50`
- default friction value: `0.15`

Friction loss:

```text
W_friction = μ * m * g * cos(α) * S_total
```

Displayed total work in friction mode:

```text
W_total = W_up + W_friction
```

This mode exists to show that:

- in real-world-like motion, longer routes can cost extra energy,
- but that extra cost comes from friction / distance, not from getting a free gravitational discount.

### 5.8 Scientific Honesty Requirement

The app must explicitly distinguish:

- `force needed right now`
- `ideal net work against gravity`
- `total positive climb`
- and `extra friction loss`

Do not blur these into one number.

## 6. Visual Design

### 6.1 Visual Direction

Use a light, sketchbook-like scientific style:

- cream / pale paper background
- hill area colored with a soft green-to-brown elevation gradient
- contour lines in muted gray-green
- route strokes in saturated accent colors
- summit flag in warm red
- bug icon in dark charcoal with tiny animated legs

The overall tone should feel playful but precise, like a clean children’s science workbook rather than a game HUD.

### 6.2 Layout

Follow the broad project pattern:

```text
[Home] Bug Hill Work Lab                           [PL] [Theme]
Draw a route uphill and compare force, distance, and work.

[Angle slider] [Ideal/Friction] [μ slider if shown] [Speed]
[Preset: Direct] [45° Switchback] [Wide Zigzag] [Wasteful Dip]
[Undo] [Clear] [Run] [Save A] [Save B] [Save C]

+------------------------------------------------------+ +----------------------+
| Hill drawing board                                  | | Metrics              |
| start pad, summit flag, contour lines, route        | | Angle                |
| bug animation, current force arrow                  | | Height               |
|                                                      | | Distance             |
|                                                      | | Peak force           |
|                                                      | | W_net / W_up         |
|                                                      | | Friction loss        |
|                                                      | | Explanation          |
+------------------------------------------------------+ +----------------------+

[comparison table / cumulative-work chart]
[status text]
```

Desktop:

- board dominates the layout,
- metrics sit in a fixed-width right panel,
- comparison strip sits below the main row.

Mobile:

- controls wrap into compact rows,
- board stays first,
- metrics move below the board,
- comparison table becomes stacked route cards.

### 6.3 Main Board

The board should show:

- the rectangular hill surface,
- horizontal contour lines,
- a visible snap grid of route nodes,
- height labels on selected contours,
- start pad labeled `START`,
- summit marker labeled `PEAK`,
- currently drawn path,
- highlighted legal next nodes during route construction,
- optional saved paths as faint overlays,
- animated bug traveling along the active path,
- a small side-profile inset in one corner.

The side-profile inset should show:

- a simple triangular hill profile,
- current bug height,
- current vertical position on the climb.

## 7. Interaction Design

### 7.1 Drawing A Route

Route drawing must use the same interaction family as the custom editor in `gamgen/index.html`: a guided, step-by-step node picker rather than freehand scribbling.

Desktop and touch:

- the user begins from the fixed `START` node,
- the board highlights all legal next nodes,
- each click/tap appends exactly one new route point,
- after each click/tap the highlight moves to the next legal node set,
- the route is complete once the user reaches the `PEAK` node.

Rules:

- drawing always starts at the `START` node,
- the route must finish on the `PEAK` node to count as complete,
- until the route is complete, `Run` stays disabled,
- `Undo` removes only the most recent step,
- `Clear` removes only the current unsaved route.

### 7.2 Legal Move Rules

The legal move system should mirror `gamgen/index.html` conceptually: the board should make the next valid choices obvious instead of accepting arbitrary input and validating later.

From the current node `(x, y)`, legal next nodes are any adjacent nodes that satisfy:

- `|Δx| <= 1`
- `|Δy| <= 1`
- not both zero
- the target remains inside the hill grid

This allows:

- straight uphill,
- diagonal uphill,
- sideways contour motion,
- and downhill detours.

Rendering requirement:

- legal next nodes should get a visible highlight ring,
- each highlighted node should have a larger invisible hit target for touch interaction,
- the current endpoint should be visibly emphasized.

### 7.3 Editing Behavior

The route editor should include:

- `Undo` for one-step rollback,
- `Clear` for full reset,
- preset loading that replaces the current unsaved route,
- saved overlays that remain read-only until replaced.

The app does not need drag editing, point dragging, or freehand smoothing in `v1`.

### 7.4 Running The Animation

Pressing `Run` should:

1. lock drawing temporarily,
2. animate the bug along the route,
3. update the current-force indicator continuously,
4. fill the cumulative-work chart in sync with progress,
5. reveal the final summary.

Animation speed:

- slow, normal, fast
- default: normal

### 7.5 Saved Comparison Routes

The user can store the current route into slots:

- `A`
- `B`
- `C`

Each saved route stores:

- the polyline
- the hill angle used at the time
- the friction mode and friction value
- all measured metrics
- a route label

Saved routes should remain visible as faint overlays until replaced or cleared.

## 8. Preset Routes

The app should ship with these exact preset route shapes, defined in surface coordinates.

Important preset-loading rule:

- the coordinate lists below are **waypoint shorthand**, not sparse long-jump segments,
- when a preset is loaded, each waypoint pair must be expanded into adjacent grid-node steps before the route is stored or animated,
- use this deterministic expansion rule for every pair `A -> B`:
  - while current point is not `B`,
  - step `x` by `sign(Bx - x)` if `x != Bx`,
  - step `y` by `sign(By - y)` if `y != By`,
  - append the new adjacent node,
- this means the preset path always moves by legal 8-neighbor grid steps, using diagonal steps whenever both axes still differ.

### 8.1 Direct

```text
(0,0) -> (0,12)
```

Meaning:

- shortest monotone route
- highest push force
- same ideal net work as any other monotone route

### 8.2 45° Switchback

```text
(0,0) -> (3,3) -> (0,6) -> (-3,9) -> (0,12)
```

Meaning:

- repeated 45°-style diagonal segments
- lower force on each diagonal segment
- longer distance
- same ideal net work as `Direct`

### 8.3 Wide Zigzag

```text
(0,0) -> (4,2) -> (-4,4) -> (4,6) -> (-4,8) -> (4,10) -> (0,12)
```

Meaning:

- very gentle local heading
- much longer route
- low force per segment
- same ideal net work as `Direct` if the route never loses height

### 8.4 Wasteful Dip

```text
(0,0) -> (2,4) -> (0,3) -> (-2,7) -> (0,12)
```

Meaning:

- includes one downhill detour
- `W_up` becomes larger than `W_net`
- useful for teaching the difference between final height and total climbing done

## 9. Readouts & Explanation

### 9.1 Always-Visible Readouts

The right panel must always show:

- hill angle
- summit height
- route distance
- peak uphill force
- ideal net work `W_net`
- total positive climb work `W_up`

When friction mode is enabled, also show:

- friction loss
- total work `W_total`

### 9.2 Explanation Card

A short explanation card should summarize the current result in plain language.

Example messages:

- `This route is longer, but it reaches the same height. Ideal net work stays the same.`
- `This zigzag feels gentler because the bug pushes less hard at each moment.`
- `This route goes downhill once, so the bug has to climb extra height later.`
- `With friction on, longer paths waste extra energy.`

### 9.3 Cumulative-Work Chart

Below the main board, include a small chart:

- x-axis: route progress from `0%` to `100%`
- y-axis: accumulated work in Joules

At minimum the chart should show:

- current route `W_net` accumulation
- current route `W_up` accumulation

If the route is monotone uphill:

- the two lines finish at the same value

If the route contains downhill parts:

- `W_up` keeps increasing or plateauing,
- `W_net` can flatten or decrease during downhill sections.

This chart is a key teaching device and should not be omitted.

## 10. Guided Investigations

The app does not need a full game mode, but it should include a lightweight sequence of built-in prompts.

Suggested prompt cards:

1. `Load Direct, then load 45° Switchback. Which route has the bigger peak force?`
2. `Do they finish with the same ideal net work?`
3. `Load Wide Zigzag. What changed: distance, force, or net work?`
4. `Load Wasteful Dip. Why is total climb work now larger?`
5. `Turn on friction. Which route now costs the most total work?`

The user should be able to dismiss or reopen these prompts.

## 11. Accessibility & UX Guardrails

- all controls must be keyboard reachable,
- drawing area must have clear focus treatment,
- a non-drawing fallback should exist through preset buttons,
- color must not be the only signal; use labels and icons too,
- reduced-motion mode should shorten the crawl animation and disable decorative leg jitter,
- the app must remain usable without sound,
- formulas should be optional or tucked into a help/details panel rather than forced on every child.

## 12. Technical Implementation Notes

### 12.1 Rendering Stack

Do not use a pure freehand canvas editor for `v1`.

Use the `gamgen/index.html` custom-pattern approach as the model for route editing:

- SVG or a DOM-addressable overlay for snap nodes,
- explicit highlighted legal targets,
- large invisible hit areas for touch,
- incremental polyline construction point by point.

Recommended rendering split:

- main hill background and contour fill: `<canvas>` or static SVG,
- interactive route layer and hit targets: SVG overlay,
- metrics panel and chart: normal DOM plus optional secondary canvas/SVG.

Reasons:

- the route editor must behave like a guided construction tool, not a sketch pad,
- node hit-testing and next-step highlighting are simpler and more reliable in SVG/DOM,
- this lets the implementing agent reuse the same interaction ideas already proven in `gamgen/index.html`.

Use normal DOM for:

- controls,
- metrics panel,
- comparison table,
- chart labels and status text.

The cumulative-work chart may be a second small `<canvas>` or SVG.

### 12.2 Internal Data Model

Suggested route model:

```text
route {
  id,
  label,
  points: [{ x, y }, ...],
  angleDeg,
  frictionEnabled,
  mu,
  metrics: {
    distance,
    summitHeight,
    peakForce,
    netWork,
    climbWork,
    frictionWork,
    totalWork,
    monotone,
  }
}
```

### 12.3 Validity Rules

The route is valid if:

- first point is the exact start node `(0,0)`,
- last point is the exact summit node `(0,12)`,
- all points stay on valid hill-grid nodes,
- every consecutive pair is an adjacent-node move,
- total segment count is between `1` and `48`.

If invalid, show a concise error:

- `Start from the bottom pad.`
- `Finish on the summit.`
- `Keep the route on the hill.`
- `Choose one highlighted next point.`

## 13. Locked V1 Specification

This section removes ambiguity for the implementing agent. Where Section 13 is more specific than earlier guidance, Section 13 takes priority for `v1`.

### 13.1 Hard Product Decisions

- `v1` includes one main free-draw mode with preset investigations; there is no separate challenge mode.
- `v1` includes the advanced friction toggle.
- `v1` uses the light theme by default.
- `v1` uses one symbolic bug mass only: `1.0 kg`.
- `v1` includes exactly 3 save slots: `A`, `B`, `C`.
- `v1` includes exactly 4 presets: `Direct`, `45° Switchback`, `Wide Zigzag`, `Wasteful Dip`.
- `v1` includes exactly 1 hill shape: a constant-slope plane.
- `v1` uses a guided snap-grid route editor, not freehand drawing.

### 13.2 Exact Board Geometry

Use this exact internal layout:

- app board canvas logical size: `960 x 620`
- hill drawing rectangle: `x=70 y=70 w=560 h=500`
- right panel width target: `250 px`
- start pad center: bottom-center of hill rectangle
- summit pad center: top-center of hill rectangle
- contour lines: 7 evenly spaced horizontal contour bands across the hill rectangle
- route grid: `11 x 13` nodes, aligned to `x=-5..+5` and `y=0..12`
- side-profile inset: `180 x 110`, placed in the lower-right corner of the hill board

Screen-to-surface mapping:

- surface `x=-5` maps to left edge of the hill rectangle
- surface `x=+5` maps to right edge of the hill rectangle
- surface `y=0` maps to bottom edge of the hill rectangle
- surface `y=12` maps to top edge of the hill rectangle

### 13.3 Exact Control Set

Top row controls:

- angle slider
- ideal/friction segmented toggle
- friction slider, visible only in friction mode
- speed segmented toggle

Second row controls:

- preset buttons: `Direct`, `45° Switchback`, `Wide Zigzag`, `Wasteful Dip`
- `Undo`
- `Clear`
- `Run`
- `Save A`
- `Save B`
- `Save C`

### 13.4 Exact Defaults

- angle = `30°`
- mode = `Ideal`
- friction coefficient = `0.15`
- speed = `Normal`
- on first load, preset `Direct` is auto-loaded

### 13.5 Exact Status Logic

While drawing:

- `Draw from START to PEAK.`

Valid route, before run:

- `Route ready. Press Run to watch the bug climb.`

After monotone uphill run:

- `Same summit, same ideal work. Only the force and distance changed.`

After downhill-detour run:

- `This route drops once, so the bug must climb extra height later.`

After friction-mode run:

- `With friction on, longer routes waste extra energy.`

## 14. Required EN / PL Strings

The implementation must include at least these UI strings.

| Key | English | Polish |
|---|---|---|
| `title` | Bug Hill Work Lab | Laboratorium Pracy Na Wzgórzu |
| `subtitle` | Draw a route uphill and compare force, distance, and work. | Narysuj drogę pod górę i porównaj siłę, drogę i pracę. |
| `angle` | Hill Angle | Kąt Wzgórza |
| `ideal` | Ideal | Idealnie |
| `withFriction` | With Friction | Z Tarciem |
| `friction` | Friction | Tarcie |
| `speed` | Speed | Prędkość |
| `slow` | Slow | Wolno |
| `normal` | Normal | Normalnie |
| `fast` | Fast | Szybko |
| `direct` | Direct | Prosto |
| `switchback45` | 45° Switchback | Zakosy 45° |
| `wideZigzag` | Wide Zigzag | Szeroki Zygzak |
| `wastefulDip` | Wasteful Dip | Niepotrzebny Spadek |
| `undo` | Undo | Cofnij |
| `clear` | Clear | Wyczyść |
| `run` | Run | Start |
| `saveA` | Save A | Zapisz A |
| `saveB` | Save B | Zapisz B |
| `saveC` | Save C | Zapisz C |
| `start` | START | START |
| `peak` | PEAK | SZCZYT |
| `height` | Height | Wysokość |
| `distance` | Distance | Droga |
| `peakForce` | Peak Force | Maks. Siła |
| `netWork` | Net Work | Praca Netto |
| `climbWork` | Total Climb Work | Całkowita Praca Wspinania |
| `frictionLoss` | Friction Loss | Strata Na Tarcie |
| `totalWork` | Total Work | Praca Całkowita |
| `sameSummit` | Same summit, same ideal work. | Ten sam szczyt, ta sama idealna praca. |
| `gentlerForce` | Gentler route, smaller force. | Łagodniejsza droga, mniejsza siła. |
| `extraClimb` | This route climbs extra height. | Ta droga wymaga dodatkowego wspinania. |
| `startFromPad` | Start from the bottom pad. | Zacznij od dolnego pola. |
| `finishOnPeak` | Finish on the summit. | Zakończ na szczycie. |
| `stayOnHill` | Keep the route on the hill. | Trzymaj drogę na wzgórzu. |
| `chooseHighlighted` | Choose one highlighted next point. | Wybierz jeden z podświetlonych następnych punktów. |
| `statusDraw` | Draw from START to PEAK. | Narysuj drogę od START do SZCZYTU. |
| `statusReady` | Route ready. Press Run to watch the bug climb. | Droga gotowa. Naciśnij Start, aby obejrzeć wspinaczkę robaka. |
| `statusSameWork` | Same summit, same ideal work. Only the force and distance changed. | Ten sam szczyt, ta sama idealna praca. Zmieniły się tylko siła i droga. |
| `statusExtraClimb` | This route drops once, so the bug must climb extra height later. | Ta droga raz opada, więc robak musi później odrobić dodatkową wysokość. |
| `statusFriction` | With friction on, longer routes waste extra energy. | Gdy tarcie jest włączone, dłuższe drogi tracą więcej energii. |

## 15. Success Criteria

The app is successful if a child can use it for a few minutes and then correctly explain:

- `A zigzag can need less force at each step.`
- `That does not automatically mean less ideal work.`
- `Same final height means the same ideal gravity work.`
- `Going downhill and back up wastes climb effort.`
- `Friction makes longer paths cost more.`

If those ideas become visually obvious through route drawing, animation, and comparison, the app has achieved its goal.
