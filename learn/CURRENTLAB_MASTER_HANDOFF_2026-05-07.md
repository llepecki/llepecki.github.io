# Current Paths Lab: AC/DC Master Handoff

## 0. Status Of This Document

This is the canonical handoff for a new single-file learning app tentatively named `currentlab.html`.

Its purpose is to give the implementing agent one strict product, science, interaction, and QA spec to follow.

If the implementing agent and reviewer disagree about intent, this document wins.

If the filename changes later, the product intent in this document still stands.

## 1. Handoff Goal

Build a child-friendly interactive app that teaches:

1. what alternating current (`AC`) and direct current (`DC`) are
2. why the everyday power grid is mostly built around `AC`
3. why `DC` is still the better choice in batteries, electronics, solar, and some long-distance links
4. how `voltage`, `current`, `power`, and `losses` change the answer

The app must not become a trivia sheet about Edison and Tesla.

It must teach through visible cause and effect.

## 2. Executive Product Direction

The product question is not:

- “Which current is better?”

The product question is:

- “Which current is better for this job, and why?”

The app must therefore teach a hybrid modern answer:

- `AC` is dominant in ordinary generation, transmission, transformation, and wall-outlet distribution
- `DC` is dominant in batteries and most electronics, and can also outperform `AC` in some long-distance and undersea links
- the real world often uses both, with conversion between them

This must be obvious by the end of the experience.

## 3. Non-Negotiable Product Outcomes

The design is successful only if all of the following are true:

1. A child can explain that `AC` changes direction and `DC` goes one way.
2. A child can explain that higher voltage can send the same power with less current.
3. A child can see that line losses rise when current is high.
4. A child can explain why transformers made `AC` especially useful for the grid.
5. A child can explain that many devices around them still use `DC` internally.
6. A child can identify at least three cases where `DC` is the better answer.
7. The app never teaches `AC good / DC bad`.
8. The board carries most of the teaching load; the side panel supports it.
9. The product feels like a real interactive lab, not a worksheet with animated icons.
10. Mobile, localization, and accessibility are handled as product requirements.

## 4. Hard Constraints

These are not suggestions.

### 4.1 Audience Constraint

Target age:

- roughly `8-12`

That means:

- no phasor diagrams
- no reactive-power math
- no three-phase instruction
- no semiconductor detail beyond “converter changes one kind of electricity into another”
- no history-lecture framing

### 4.2 Scientific Honesty Constraint

The app must be simplified, but never false in the core claims.

Allowed simplification:

- “voltage is the electrical push”
- “current is the flow rate of charge”
- “power is how much work can be delivered each moment”
- “loss is wasted energy that heats the wires”

Not allowed:

- “electricity gets used up”
- “current and voltage are the same thing”
- “DC cannot change voltage”
- “all home devices use AC directly”
- “AC is always better”

### 4.3 Visual Constraint

The app should visibly inherit the structure quality of `fractions.html` and `feedbacktank.html`:

- strong top toolbar
- large central board
- compact side panel
- clear readouts
- authored rounds plus `Explore`, `Hint`, and `Next`

### 4.4 Interaction Constraint

Every mode must have a genuine manipulation at its center:

- drag
- choose
- adjust
- compare
- route

Reject any mode that is mostly text plus a confirm button.

### 4.5 Pedagogy Constraint

The child must make predictions before the app explains the answer in the higher levels.

The experience must repeatedly separate:

- `Voltage`
- `Current`
- `Power`
- `Loss`

because learners commonly blur those together.

## 5. Research-Backed Design Foundation

This app design is grounded in stable engineering sources and electricity-education guidance.

### 5.1 Why `AC` Won Most Of The Grid

`AC` became the dominant grid format because changing current made transformers practical for stepping voltage up and down, which made long-distance transmission far more effective.

Design implication:

- the app must make transformer-based voltage change visible, not just mention it in text

### 5.2 Why High Voltage Helps

For the same power, raising voltage lowers current. Lower current means lower resistive wire heating, and wire losses rise roughly with `I²R`.

Design implication:

- the app must let the child hold power demand roughly constant while changing voltage and watching current and losses move

### 5.3 Why `DC` Still Matters

Batteries supply `DC`. Solar cells supply `DC`. Many modern electronics and stored-energy systems run internally on `DC` even when plugged into an `AC` outlet.

Design implication:

- the app must teach that “the wall gives AC” and “the device may still use DC” are both true

### 5.4 Where `DC` Can Beat `AC`

High-voltage direct current (`HVDC`) can be advantageous for very long point-to-point links, submarine cables, and some grid-to-grid connections.

Design implication:

- the app must include at least one late-level scenario where `DC` is the best route choice even though the destination still ends up on an `AC` local grid

### 5.5 Teaching Risk: Children Mix Up Current, Voltage, And Energy

Electricity education research and teacher guidance repeatedly show that students confuse:

- current with voltage
- current with energy
- “brighter bulb” with “more of every electrical quantity”

Design implication:

- every major board state must show separate meters for `Voltage`, `Current`, `Useful Power`, and `Wire Heat Loss`

### 5.6 Teaching Benefit: Multiple Representations Help

Research-backed teaching guidance supports using more than one representation when children learn invisible processes.

Design implication:

- the app should combine:
  - visible line animation
  - separate numeric readouts
  - simple waveform strip
  - energy-flow bar

## 6. Scientific Model Rules

These rules govern the implementation.

### 6.1 Child-Facing Vocabulary

Use paired labels where possible:

- `Push (Voltage)`
- `Flow (Current)`
- `Useful Power`
- `Wire Heat Loss`
- `Change Direction`
- `One-Way Flow`

Do not hide the scientific term; pair it with the child-facing term.

### 6.2 What The Board May Show

The board may show:

- charge markers moving one way for `DC`
- charge markers oscillating locally for `AC`
- energy glow moving from source toward load
- wire segments heating when losses are high
- transformer coils with a changing magnetic field only when current changes

### 6.3 What The Board Must Not Show

The board must not show:

- one electron leaving a power station and racing all the way into a child’s lamp
- a transformer changing steady `DC` without an explicit converter module
- `AC` and `DC` differing only by a decorative waveform icon

### 6.4 Scientific Claims The App Must Explicitly Make

By the end of the full experience, the app must explicitly communicate:

1. `AC` changes direction repeatedly.
2. `DC` keeps the same direction.
3. Higher voltage can deliver the same power with less current.
4. Lower current reduces resistive line losses.
5. Traditional transformers work directly with changing current, which helped `AC` grids spread.
6. Batteries and many electronics use `DC`.
7. Modern systems often convert between `AC` and `DC`.
8. Some very long or undersea links favor `HVDC`.

### 6.5 Scientific Claims The App Must Never Make

Never state or imply:

1. `DC` cannot change voltage.
2. `AC` has lower losses than `DC` in every case.
3. Home devices are all powered internally by `AC`.
4. Voltage is “how much electricity there is.”
5. Current gets smaller because the device “used it up.”

## 7. Information Architecture

### 7.1 Canonical Target File

Use:

- `currentlab.html`

The implementing agent should follow the existing single-file app pattern used elsewhere in this repo.

### 7.2 Tier 1 Navigation

Top-level family switch:

- `Learn`
- `Decide`

### 7.3 Tier 2 Navigation

Modes inside `Learn`:

- `Flow`
- `Send`
- `Boost`

Modes inside `Decide`:

- `Pick`
- `Build`

### 7.4 Tier 3 Progression

Global level switch:

- `Level 1`
- `Level 2`
- `Level 3`
- `Level 4`
- `Level 5`

### 7.5 Utility Controls

Keep utility actions separate from the progression model:

- `Explore`
- `Hint`
- `Next`
- language toggle

## 8. Core Product Thesis By Family

### 8.1 `Learn`

The child manipulates the physics ideas directly.

This family answers:

- what is different?
- what changes when I send more power?
- why does voltage matter?
- why was `AC` so useful for the grid?

### 8.2 `Decide`

The child applies those ideas to real-life scenarios.

This family answers:

- which kind of current fits this source, route, or device?
- where should conversion happen?
- when is the real answer hybrid?

## 9. Layout And Structural Reference

The app should clearly borrow the proven structural ideas from `fractions.html` and `feedbacktank.html`.

### 9.1 Top Header

Include:

- app title
- short explanatory subtitle
- back-to-learn icon link
- EN/PL language toggle

### 9.2 Main Split

Use a two-column shell:

- large board area on the left
- compact control and readout panel on the right

On narrow screens:

- board first
- panel second
- toolbar rows wrap cleanly

### 9.3 Toolbar

The toolbar should use three stacked rows:

1. family row
2. mode row
3. level plus utility row

This should feel closer to `fractions.html` than to a dense dashboard.

### 9.4 Right Panel Sections

Use these section blocks:

1. `Mission`
2. `Controls`
3. `Meters`
4. `Why It Works`
5. `Progress`

If space is tight, `Why It Works` and `Progress` may swap order, but both must remain visible without entering a modal.

### 9.5 Desktop Proportions

The desktop layout should feel board-led, not panel-led.

Target proportion:

- board area: roughly `68-74%`
- side panel: roughly `26-32%`

The panel should usually sit in the `300-340px` range.

Reject a layout where the panel grows so wide that the board becomes a secondary element.

### 9.6 Density Rules

The app should stay visually calm.

That means:

- one main board scene at a time
- one primary interaction focus at a time
- no more than `4` simultaneous “hot” accents in the same view
- no wall of explanatory text in the panel
- no stacked mini-cards fighting for attention

The child should always know:

- what to look at
- what to touch
- what quantity just changed

## 10. Visual Direction

### 10.1 Tone

The app should feel like a hands-on electricity lab crossed with a good science-museum exhibit.

It should not feel like:

- a retro “war of currents” poster
- a neon cyberpunk circuit board
- a noisy toy dashboard
- a safety-warning infographic

The emotional tone should be:

- calm
- curious
- tactile
- precise
- slightly mechanical

The board should feel like something the child can inspect and reason about, not just watch.

### 10.2 Typography

Use the established learn-app font stack from [STYLE.md](/Users/llepecki/Projects/llepecki.github.io/learn/STYLE.md):

- UI/body: `Outfit`
- labels/readouts: `Share Tech Mono`

Typography rules:

- title: compact and confident, not oversized
- body copy: short and clear
- labels: uppercase mono only where that improves scan speed
- readout values: mono and slightly larger than labels
- avoid decorative display fonts
- avoid long paragraphs inside the panel

Tone rule:

- the type should feel like an instrument panel sitting inside a child-friendly lab, not like a game HUD

### 10.3 Base Theme

Stay inside the repo’s proven light-theme family rather than inventing a separate visual system.

Use the familiar light-shell foundation:

- warm paper background
- white panel surfaces
- muted slate text
- pale workshop-canvas board background

Recommended base variables:

- `--bg: #FAFAF7`
- `--panel: #FFFFFF`
- `--panel-border: #E0DDD6`
- `--text: #37474F`
- `--text-head: #263238`
- `--text-dim: #78909C`
- `--text-label: #90A4AE`
- `--accent: #455A64`
- `--accent-light: #ECEFF1`
- `--canvas-bg: #F5F3EE`

### 10.4 Color Logic

Use a restrained scientific palette:

- warm sand / paper background
- dark slate text
- `AC` accent in blue-green
- `DC` accent in amber-orange
- loss / heat in red-orange
- useful power in green

Recommended semantic tokens:

- `--ac: #157A8C`
- `--ac-soft: #D9EFF2`
- `--dc: #D98B1F`
- `--dc-soft: #FFF0D8`
- `--power: #43A047`
- `--loss: #E76F51`
- `--heat: #F26B3A`
- `--route-dim: #B0BEC5`

Color behavior rules:

- `AC` and `DC` must never be distinguished by color alone
- heat and error colors must not dominate the scene unless something is genuinely wrong
- green should mean useful delivered power, not “this current type is morally correct”
- converter blocks should stay neutral or steel-toned so they read as utility devices, not as a third current type

### 10.5 Reusable Visual Language

The app needs consistent visual tokens for:

- current type
- voltage level
- current level
- loss severity
- converter type
- source type
- destination type

### 10.6 Shape Language

The app should give `AC` and `DC` different silhouettes as well as different colors.

Use this visual grammar:

- `AC`: rounded corners, arcs, wave trim, alternating arrows
- `DC`: straighter lines, firmer blocks, one-way chevrons, terminal polarity marks where useful
- transformer: paired coils plus a simple core silhouette
- converter / inverter: rectangular module with directional conversion cue
- long-distance line: stretched route with repeated towers or supports
- undersea cable: protected route with seabed context, not just a recolored wire

The shapes should stay chunky and legible.

Avoid tiny technical symbols that only adults can decode.

### 10.7 Surface And Depth

The background should not be flat, but it must stay subtle.

Preferred treatment:

- soft vertical or diagonal paper gradient
- faint engineering-grid or guide-line texture at very low opacity
- slightly raised modules with soft shadows
- route beds under important cables so active paths read immediately

Do not use:

- glossy skeuomorphism
- heavy drop shadows
- chrome-like metallic gradients
- dark neon glows

### 10.8 Motion System

Motion must explain electricity, not decorate it.

Allowed motion:

- steady one-way `DC` drift
- back-and-forth `AC` oscillation
- transformer pulse when current is changing
- heat shimmer when losses are high
- route highlight when power is successfully delivered
- gentle scene transitions

Animation rules:

- keep transitions short and meaningful
- avoid constant idle bobbing
- avoid celebratory effects like confetti
- never animate every element at once

Reduced-motion requirement:

- replace oscillation with stepped arrows, blinking direction markers, or meter updates
- preserve all scientific meaning without requiring continuous motion

### 10.9 Board Primitives

Build the board out of reusable primitives:

- source module
- load module
- straight wire segment
- long-distance line segment
- undersea cable segment
- transformer block
- converter / inverter block
- charge markers
- energy glow
- heat shimmer
- waveform strip
- meter badge

### 10.10 Control Styling

Controls should visually follow the established patterns from `fractions.html` and `feedbacktank.html`.

Guidance:

- family buttons: broad and calm, clearly top-level
- mode buttons: compact but still thumb-friendly
- level buttons: simple numeric chips, not badges with extra ornament
- utility actions: neutral and readable, not rainbow-coded
- sliders: thick enough for touch, with clear live values
- readouts: mono, aligned, and stable as values update

The right panel should feel like a concise instrument cluster.

It should not feel like a settings menu.

### 10.11 Mode-Specific Visual Identity

Each mode should feel distinct even before the child reads the text.

Visual emphasis by mode:

- `Flow`: clean split view, minimal clutter, strongest directional animation
- `Send`: long route emphasis, strongest heat/loss cues
- `Boost`: infrastructure tableau, strongest before/after voltage staging
- `Pick`: scenario-card framing plus live mini-scene
- `Build`: tray-and-route composition with assembly affordances

Distinct does not mean disconnected.

All modes must still look like members of the same product family.

### 10.12 Visual Anti-Patterns

Reject the visual design if it drifts into any of the following:

- generic stock “electricity” art
- busy circuit-board wallpaper
- purple-gradient tech branding
- warning-sign red everywhere
- photorealistic plugs and sockets next to flat vector modules
- too many gauges competing at once
- tiny labels placed directly on moving objects
- decorative sparks used as a substitute for explanation

## 11. Modes: Exact Purpose And Interaction

### 11.1 `Flow`

Purpose:
teach the directional difference between `AC` and `DC`

Board:

- split-screen loop with two simple circuits
- left or top can show `DC`
- right or bottom can show `AC`
- source, wires, and a lamp or motor load remain visible
- waveform strip appears near each source

Primary interaction:

- toggle source type
- toggle current type
- adjust speed / frequency in `Explore`
- choose which current fits the shown source or outlet

Core learning:

- `DC` keeps the same direction
- `AC` reverses direction
- both still need a complete path

Must include:

- at least one battery example
- at least one wall-outlet example
- at least one “charger converts AC to DC” example

Reject if:

- the mode teaches only “wave vs straight line”

### 11.2 `Send`

Purpose:
teach power transfer, voltage, current, and line losses

Board:

- source on the left
- route in the middle
- town, house, or device load on the right
- visible heat glow on the wire
- energy bar showing source power, useful power, and wasted heat

Primary interaction:

- adjust `Voltage`
- adjust `Power Demand`
- adjust `Distance`
- optionally adjust `Wire Thickness` or `Line Quality`
- compare two routes side by side in higher levels

Core learning:

- same useful power can be sent in different voltage/current combinations
- high current makes wires heat more
- higher voltage can reduce current and losses

Must include:

- one fixed-power comparison
- one fixed-distance comparison
- one “make the town bright without overheating the line” challenge

Reject if:

- losses are shown only as a number without a visible board consequence

### 11.3 `Boost`

Purpose:
teach why voltage conversion mattered so much

Board:

- generator, transformer station, long line, neighborhood transformer, homes
- alternate setup with battery or solar plus converter / inverter
- transformer coils visibly respond only to changing current

Primary interaction:

- add or remove transformer / converter blocks
- choose where to step voltage up or down
- choose `AC` or `DC` route in authored scenarios

Core learning:

- simple transformers work directly with changing current
- stepping voltage up before a long trip reduces current
- stepping voltage down near use makes power practical and safer for devices
- `DC` can also be converted, but not with a plain transformer alone

Must include:

- one classic grid scene where `AC` is clearly the simpler answer
- one solar or battery scene where `DC` conversion is necessary
- one late scene where extra conversion cost makes the choice non-trivial

Reject if:

- the mode says “transformers only work with AC” without clarifying that modern converters can also change `DC` voltage

### 11.4 `Pick`

Purpose:
teach job-based current choice

Board:

- scenario card plus live mini-scene
- examples: flashlight, phone, home outlet, rooftop solar, train motor, offshore wind, island cable, remote town

Primary interaction:

- choose `AC`, `DC`, or `Hybrid`
- when needed, choose the converter location
- justify the choice by matching one of a few visible reasons

Core learning:

- batteries favor `DC`
- outlets and ordinary distribution favor `AC`
- some long or undersea routes favor `DC`
- real systems often mix both

Must include:

- at least three easy daily-life scenarios
- at least three medium scenarios with conversion
- at least two late scenarios where `Hybrid` is the only fully correct answer

Reject if:

- the right answer is always a single current type with no conversion

### 11.5 `Build`

Purpose:
integrate the full chain from source to use

Board:

- module tray
- route canvas
- source, converters, line, local distribution, and load slots
- live run after assembly

Primary interaction:

- place or select modules in sequence
- run the build
- inspect delivered power, loss, and correctness

Core learning:

- electricity systems are chains, not isolated objects
- conversion has a reason and a cost
- the best design depends on source, distance, and device

Must include:

- one house-powered-from-grid build
- one phone-charging build
- one solar-home build
- one long-link build
- one challenge where an incorrect build still “lights something” but wastes too much energy

Reject if:

- success is binary without showing the quality of the route

## 12. Level 1-5: Exact Meaning

### 12.1 Level 1

Purpose:
recognition and confidence

Characteristics:

- short routes
- obvious sources
- no formulas
- mostly `battery`, `wall outlet`, `lamp`, `phone`
- vocabulary support visible at all times

### 12.2 Level 2

Purpose:
early comparison

Characteristics:

- first source-to-device matching
- first simple converter examples
- first use of `Voltage`, `Current`, `Power`, `Loss` labels together
- no long-distance tradeoff yet

### 12.3 Level 3

Purpose:
power transfer reasoning

Characteristics:

- fixed-power comparisons
- visible loss tradeoffs
- first step-up / step-down transformer missions
- first prediction-before-run prompts

### 12.4 Level 4

Purpose:
real system thinking

Characteristics:

- grid plus device chains
- hybrid `AC`/`DC` routes
- undersea or remote-link cases
- late-introduction of simple equation chips:
  - `Power = Voltage × Current`
  - `Loss rises with current²`

### 12.5 Level 5

Purpose:
tradeoff judgment, not just fact recall

Characteristics:

- multiple plausible routes
- conversion placement matters
- efficiency and simplicity may conflict
- one route may favor `AC` locally and `DC` in the middle
- child must explain why a choice works, not just click it

### 12.6 Global Difficulty Rule

Higher levels must become harder through reasoning structure, not only through more sliders or more text.

Reject any level system where `Level 5` is mostly `Level 2` plus larger numbers.

## 13. Mode-By-Level Content Matrix

This section defines the minimum authored-content shape.

Each `mode x level` slice must contain at least `6` authored rounds before `Explore` becomes the main activity.

### 13.1 `Flow`

- `Level 1`: battery vs outlet, one-way vs back-and-forth, complete path recognition
- `Level 2`: battery, solar, wall outlet, charger output, motor toy matching
- `Level 3`: predict lamp behavior before run, identify which direction pattern matches `AC` or `DC`
- `Level 4`: charger chain, inverter chain, source-to-device direction changes
- `Level 5`: explain hybrid examples where the source begins `DC`, travels or converts, and ends differently

### 13.2 `Send`

- `Level 1`: short-line brightness and heat with simple presets
- `Level 2`: low-voltage vs high-voltage comparison with friendly numbers
- `Level 3`: fixed-power mission, current-loss tradeoff
- `Level 4`: line quality and distance tradeoffs
- `Level 5`: choose the best of two or three strategies with similar delivered power but different losses

### 13.3 `Boost`

- `Level 1`: step-up and step-down as simple visual actions
- `Level 2`: which side of the journey should be high voltage
- `Level 3`: classic generator to town with two transformer stations
- `Level 4`: solar or battery scene requiring explicit conversion
- `Level 5`: mixed-route optimization with conversion count and efficiency tradeoff

### 13.4 `Pick`

- `Level 1`: flashlight, toy car, home socket
- `Level 2`: phone charger, laptop charger, solar garden light
- `Level 3`: rooftop solar, battery backup, train motor
- `Level 4`: offshore wind to city, island cable, data-center backup
- `Level 5`: choose between `AC`, `DC`, and `Hybrid` with two-step reasoning

### 13.5 `Build`

- `Level 1`: source to lamp with one necessary choice
- `Level 2`: source to phone with charger placement
- `Level 3`: long route with step-up and step-down
- `Level 4`: home plus device branch with conversion
- `Level 5`: multi-stage route with long link and local conversion

## 14. Side Panel: Exact Readouts

The panel must keep the main quantities separate.

### 14.1 Always-Visible Readouts

Show all of these in every mode where they apply:

- `Current Type`
- `Source`
- `Load`
- `Push (Voltage)`
- `Flow (Current)`
- `Useful Power`
- `Wire Heat Loss`
- `Efficiency`

### 14.2 Conditional Readouts

Show when relevant:

- `Frequency`
- `Distance`
- `Conversions`
- `Route Type`
- `Why This Choice Wins`

### 14.3 Readout Behavior

Readouts must update continuously during simulation.

Do not wait until the child presses a check button.

## 15. Explore Mode

`Explore` is required, but must not replace authored teaching.

### 15.1 Explore Purpose

It exists so the child can ask:

- what if I raise voltage?
- what if I make the line longer?
- what if I remove the transformer?
- what if the route becomes undersea?

### 15.2 Explore Controls

At minimum, expose:

- current type where valid
- voltage
- power demand
- distance
- route type
- converter presence

### 15.3 Explore Safety Rails

In `Explore`, the app must still:

- keep quantities physically consistent
- preserve the visible effect of losses
- prevent impossible transformer behavior

## 16. Hint System

Hints must be staged like the stronger learning apps in this repo.

Use exactly two hint levels:

1. direction hint
2. reasoning hint

Examples:

- hint 1: “Try keeping the same power but raising the voltage.”
- hint 2: “If voltage goes up, the same power needs less current, and the line wastes less heat.”

Do not give away the final route immediately in hint 1.

## 17. Mission And Feedback Rules

### 17.1 Success Feedback

Success should report:

- what the child chose
- why it worked
- what quantity changed most

### 17.2 Failure Feedback

Failure must be diagnostic, not generic.

Examples:

- “The house still lights, but the line overheats because the current stayed too high.”
- “The phone needs `DC` after the charger.”
- “This transformer cannot change steady `DC` by itself.”

### 17.3 Score Model

Do not use a gamey score as the main learning loop.

Light progress indicators are fine:

- completed rounds
- scenario streak
- efficiency badge

But the main reward is understanding visible cause and effect.

## 18. Mobile, Accessibility, And Localization

### 18.1 Mobile

Must pass at `375px` width.

Requirements:

- toolbar rows wrap without clipping
- board stays readable without microscopic labels
- drag interactions have tap alternatives
- right panel becomes stacked sections below the board
- touch targets stay at least roughly `44px` in the primary control areas
- readout rows do not collapse into illegible multi-column clutter

### 18.2 Accessibility

Must include:

- keyboard reachability for all controls
- visible focus states
- meaningful `aria-label`s
- reduced-motion behavior

Reduced-motion behavior must:

- reduce oscillation and decorative movement
- preserve the information content through arrows, color, and meter change

### 18.3 Localization

Full EN and PL support is required.

Do not hard-code English strings inside scenario data.

## 19. Implementation Guidance

### 19.1 Architecture

Follow the established repo pattern:

- one HTML file
- inline CSS
- inline JavaScript in an IIFE

Suggested state slices:

- `family`
- `mode`
- `level`
- `scene`
- `locale`
- `mission`
- `explore`
- `sim`
- `ui`

### 19.2 Required Rendering Primitives

Implement reusable helpers for:

- source / load icons
- wire drawing
- charge markers
- waveform strip
- heat overlay
- meter badges
- transformer / converter blocks
- scenario cards

### 19.3 Content Authoring Structure

Keep authored content data-driven.

Do not bury mission logic in large `if` chains.

At minimum, authored mission objects should specify:

- family
- mode
- level
- scenario id
- initial conditions
- allowed controls
- success condition
- hint 1
- hint 2
- explanation

## 20. Delivery Order

Build in this order only:

1. shell, layout, and state model
2. `Learn` family and level system
3. `Flow`
4. `Send`
5. `Boost`
6. `Decide` family shell
7. `Pick`
8. `Build`
9. `Explore`
10. mobile, localization, accessibility, and polish

The reason is simple:

- the science model must be stable before the scenario layer
- `Send` and `Boost` carry the most important explanation for why the grid used `AC`
- `Pick` and `Build` are where the product can easily become shallow or misleading

## 21. Milestones

### 21.1 Milestone 0: Baseline And Safety Rails

Must achieve:

- top-level shell
- stable family / mode / level state
- persistent UI structure
- no dependence on placeholder text for the teaching

Reject if:

- the implementation still behaves like a single-scene toy with relabeled buttons

### 21.2 Milestone 1: `Learn` Family Skeleton

Must achieve:

- visible `Learn`
- visible `Flow`, `Send`, `Boost`
- visible `Level 1-5`
- readout system in place

Reject if:

- levels exist visually but do not change real content

### 21.3 Milestone 2: `Flow`

Must achieve:

- authored rounds across all levels
- complete-circuit reasoning
- clear `AC` vs `DC` directional difference
- charger conversion example

Reject if:

- `Flow` is only a waveform lesson

### 21.4 Milestone 3: `Send`

Must achieve:

- voltage/current/power/loss separation
- fixed-power comparison
- visible line heating
- higher-voltage lower-current logic

Reject if:

- the mode never makes the child hold one variable steady while changing another

### 21.5 Milestone 4: `Boost`

Must achieve:

- transformer story is visible
- step-up and step-down are both meaningful
- classic `AC` grid explanation works
- `DC` conversion nuance is present

Reject if:

- the app teaches “DC cannot change voltage”

### 21.6 Milestone 5: `Decide` Family Skeleton

Must achieve:

- visible `Decide`
- visible `Pick` and `Build`
- shared scenario routing and feedback model

Reject if:

- the family is only a shallow quiz wrapper

### 21.7 Milestone 6: `Pick`

Must achieve:

- daily-life scenarios
- at least one undersea or very long-distance `DC` win
- at least one `Hybrid` win

Reject if:

- `AC` wins almost every scenario because the dataset is biased

### 21.8 Milestone 7: `Build`

Must achieve:

- end-to-end route construction
- visible conversion cost
- non-binary quality feedback

Reject if:

- any chain that “turns the load on” counts as equally correct

### 21.9 Milestone 8: Release Readiness

Must achieve:

- complete authored content
- complete explore mode
- EN / PL
- mobile pass
- reduced-motion pass
- keyboard pass
- visual cohesion pass

Reject if:

- the app still depends on desktop-only dragging or partially translated strings

## 22. Explicit Rejection Conditions

Reject the implementation if any of the following are true:

1. `AC` is presented as universally superior.
2. `DC` is presented as incapable of voltage conversion.
3. Voltage, current, power, and loss are not visibly separated.
4. The main reason for `AC` grid dominance is not made visible through transformers and transmission loss reduction.
5. The app ignores the fact that many plugged-in devices still convert to `DC`.
6. `HVDC` never appears as a justified exception.
7. Authored levels are thin and `Explore` does most of the teaching.
8. `Level 5` is mostly harder because of more numbers rather than deeper decisions.
9. The board does not show line heating or conversion consequences.
10. Mobile reflow is weak or inaccessible.
11. The visual design collapses into generic “tech app” styling and loses the calm lab identity.

## 23. Verification Gates

The implementing agent should not self-certify without concrete checks.

### 23.1 After Shell

- switch families
- switch modes
- switch levels
- confirm state persistence

### 23.2 After `Flow`

- complete one round at every level
- confirm one battery example
- confirm one outlet example
- confirm one charger conversion example

### 23.3 After `Send`

- run one fixed-power comparison
- confirm higher voltage lowers current
- confirm lower current lowers heat loss
- confirm all four main meters move separately

### 23.4 After `Boost`

- run one `AC` transformer route
- run one battery or solar conversion route
- confirm plain transformer does not alter steady `DC` without converter logic

### 23.5 After `Pick`

- complete one easy, one medium, and one late scenario
- confirm at least one correct answer is `DC`
- confirm at least one correct answer is `Hybrid`

### 23.6 After `Build`

- complete one grid-to-home build
- complete one phone-charging build
- complete one long-link build
- confirm inefficient but functioning builds receive partial-quality feedback

### 23.7 After Release Readiness

- desktop pass
- `375px` pass
- EN pass
- PL pass
- reduced-motion pass
- keyboard-only pass in both families
- style pass against Sections `10.1` through `10.12`
- `npm run code-review -- currentlab.html`

## 24. Reviewer Checklist

### 24.1 Science

- Does the app clearly distinguish `AC` from `DC`?
- Does it clearly distinguish voltage from current?
- Does it show power and losses separately?
- Does it explain why high voltage helps transmission?
- Does it explain why transformers helped `AC` grids?
- Does it acknowledge modern `DC` conversion and `HVDC` cases?

### 24.2 Product

- Does the board do most of the teaching?
- Are the modes genuinely different?
- Does `Decide` feel like application, not trivia?
- Does `Build` reveal route quality, not just route completion?

### 24.3 Progression

- Is `Level 1` calm and concrete?
- Is `Level 3` the first real tradeoff level?
- Is `Level 5` clearly about judgment and explanation?
- Do higher levels deepen reasoning instead of adding clutter?

### 24.4 Quality

- Does mobile work?
- Is EN / PL complete?
- Are focus states visible?
- Does reduced motion still preserve meaning?

### 24.5 Visual Quality

- Does the app feel like a calm lab rather than a generic tech toy?
- Are `AC` and `DC` distinct through shape as well as color?
- Is the board clearly dominant over the panel?
- Are motion and glow used to explain, not decorate?
- Do the five modes feel visually distinct but still related?
- Does the app avoid noisy electricity cliches?

## 25. Final Acceptance Standard

The implementation should only be considered ready for serious review if all of the following are true:

1. `Learn` and `Decide` are both real families.
2. `Flow`, `Send`, `Boost`, `Pick`, and `Build` are all real interactive modes.
3. The child can visibly learn why the grid widely used `AC`.
4. The child can visibly learn where `DC` is better.
5. The app teaches `voltage`, `current`, `power`, and `loss` as separate ideas.
6. The product reaches a modern hybrid conclusion rather than a simplistic winner-loser conclusion.
7. Mobile, localization, and accessibility are solid enough to review as product work.

Until then, the agent is still implementing, not polishing.

## 26. Source Links

Primary technical sources and teacher-facing educational sources used in this handoff, accessed on `May 7, 2026`:

- U.S. Energy Information Administration, Electricity Explained, Batteries, Circuits, and Transformers: https://www.eia.gov/energyexplained/electricity/batteries-circuits-and-transformers.php
- U.S. Department of Energy, War of Currents: AC vs. DC Power: https://www.energy.gov/articles/war-currents-ac-vs-dc-power
- Hitachi Energy, HVDC Classic (official technical overview): https://www.hitachienergy.com/products-and-solutions/hvdc/hvdc-classic
- U.S. Department of Energy, Solar Integration: Inverters and Grid Services Basics: https://www.energy.gov/eere/solar/solar-integration-inverters-and-grid-services-basics
- OpenStax, University Physics Volume 2, Alternating Current: https://openstax.org/books/university-physics-volume-2/pages/15-5-alternating-current
- OpenStax, University Physics Volume 2, Transformers: https://openstax.org/books/university-physics-volume-2/pages/15-6-transformers
- Institute of Physics Spark, A Few Students Can Clearly Distinguish Ideas of Electric Current and Potential Difference: https://spark.iop.org/few-students-can-clearly-distinguish-ideas-electric-current-and-potential-difference
- Institute of Physics Spark, What Gets Used Up?: https://spark.iop.org/what-gets-used
- Chiu, M.-H. and Lin, J.-W., Promoting Fourth Graders’ Conceptual Change of Their Understanding of Electric Current via Multiple Analogies, Journal of Research in Science Teaching: https://scholar.lib.ntnu.edu.tw/en/publications/promoting-fourth-graders-conceptual-change-of-their-understanding-2

## 27. Final Instruction To The Implementing Agent

Do not optimize for flashy electricity aesthetics alone.

Optimize for:

- scientific honesty
- visible causality
- real route tradeoffs
- clear separation of core electrical quantities
- a modern hybrid understanding of `AC` and `DC`
