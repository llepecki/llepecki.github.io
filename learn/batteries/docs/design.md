# Battery Connection Lab: Design Brief

Reference interaction/style baseline: `logigate/index.html`

Target file: `batteries/index.html`

Project implementation baseline:

- follow the same coding, UI, layout, animation, localization, and single-file architecture conventions used by the other `learn/` apps in this folder,
- use `logigate/index.html` as the closest reference for overall screen structure: compact header, top control bar, one large interactive board, and a concise feedback/status area,
- prefer the same font stack (`Outfit` + `JetBrains Mono`), the same language-toggle/theme-toggle pattern, and the same responsive behavior expectations,
- if this document leaves a low-level detail unspecified, inherit the established project convention rather than inventing a new UI language.

## 1. Purpose & Educational Goal

This app teaches children the difference between three common ways of connecting batteries:

- **Series / szeregowo**: batteries are placed end-to-end, so the **voltage adds up**.
- **Parallel / równolegle**: batteries share the same positive rail and the same negative rail, so the **voltage stays the same** but the pack lasts longer.
- **Mixed / mieszane**: small series chains are connected in parallel, so the pack can provide **higher voltage and longer runtime** at the same time.

The core learning outcome is not memorizing formulas. The child should be able to look at a pack and intuitively answer:

- "Will this make the lamp brighter?"
- "Will this make it last longer?"
- "Why is this connection correct?"
- "Why is this one wrong?"

The app should make those answers visible through play, not only through text.

## 2. Target Audience

Children aged roughly 8-13, plus parents and teachers using the app as a classroom or at-home explainer. The interaction should work even if the child has never seen a schematic diagram before.

Important assumptions:

- the child understands that a battery has a `+` and `-` end,
- the child may not know the words "voltage" or "capacity" yet,
- the child should be able to learn the idea through icons, animation, and short labels before reading any detailed explanation.

## 3. Scope

A single self-contained HTML file (`batteries/index.html`) in the `learn/` directory. Bilingual (English / Polish). No external dependencies beyond Google Fonts.

In scope:

- a tactile battery-pack builder with large snap slots
- guided lessons for `series`, `parallel`, and `mixed`
- challenge mode with replayable generated goals
- a simple sandbox / free-build mode
- animated current/energy flow when the child tests a circuit
- visual meters for pack voltage and battery life
- validation for open circuits, reversed batteries, short circuits, and invalid mixed branches

Out of scope:

- exact electrical engineering simulation
- Ohm's law as a prerequisite
- resistor networks, multiple loads, or breadboard-style free-form electronics
- chemistry differences between alkaline / NiMH / lithium cells
- mains electricity, wall sockets, or any real-world dangerous wiring instructions
- multi-file architecture or backend features

## 4. High-Level Product Concept

The app should feel like a small digital lab bench. The child gets a tray of chunky 1.5 V cells and a board with visible battery sockets. They drag cells onto the board, flip their direction if needed, and press `Test`. The board then animates the energy flow and explains the result in child-friendly terms.

The main teaching idea is:

- **series** makes the "push" stronger,
- **parallel** makes the "battery life" longer,
- **mixed** combines both ideas by grouping cells into equal branches.

This should be taught with direct comparisons, not long paragraphs.

### 4.1 Why A Structured Board Is Better Than Free-Form Wiring

This app should **not** be a circuit CAD tool. The challenge is understanding battery arrangements, not drawing arbitrary wires.

Use predefined board templates with large snap areas:

- a **series rack**: one path with several battery slots,
- a **parallel rack**: two or three branches between common rails,
- a **mixed rack**: two equal series branches in parallel,
- a **repair rack**: a prebuilt wrong circuit that the child must fix.

This keeps the interaction readable on desktop and mobile, and it keeps the implementation realistic for a single-file app.

### 4.2 Main Loop

1. The app shows a goal card, for example: `Make 3.0 V` or `Make 3.0 V and battery life x2`.
2. The child drags batteries from the tray into the board.
3. The child taps a placed battery to flip it if the polarity is wrong.
4. The child presses `Test`.
5. The app animates the flow and shows:
   - resulting voltage,
   - resulting battery-life score,
   - device behavior,
   - and a short verdict.
6. If correct, the child gets a clear success state and can move to the next task.

## 5. Visual Design

### 5.1 Visual Direction

The closest aesthetic match should be `logigate/index.html`, but warmer and more playful:

- dark navy workbench background with a subtle dot-grid or circuit-board pattern,
- glowing copper traces and socket outlines,
- bright yellow/orange battery bodies with clear red `+` caps and dark `-` caps,
- soft neon pulses for current animation,
- friendly device icons: bulb, flashlight, toy motor/fan.

Suggested color language:

- **Series**: amber / orange
- **Parallel**: cyan / teal
- **Mixed**: lime / green-yellow
- **Errors / unsafe**: red
- **Good result**: warm electric green

The goal is to make the board feel like a toy-lab instrument, not a dry school worksheet.

### 5.2 Screen Layout

Follow the broad `logigate/index.html` layout pattern:

```text
[Home] Battery Connection Lab                      [PL] [Theme]
Build battery packs: series, parallel, and mixed.

[Mode: Learn | Challenge | Sandbox]
[Topic: Series | Parallel | Mixed]
[Difficulty] [New Challenge] [Test] [Hint] [Reset]

+------------------------------------------------------+ +----------------------+
| Battery Tray    Interactive Board                    | | Goal Card            |
| [AA] [AA] [AA]  sockets, rails, lamp/load, pulses    | | Need: 3.0 V          |
| [AA] [AA] [AA]                                       | | Life: x2             |
|                                                      | | Voltage meter        |
|                                                      | | Battery-life meter   |
|                                                      | | Tip / explanation    |
+------------------------------------------------------+ +----------------------+

[status text / result bar]
```

Desktop:

- board is the dominant element,
- goal/readout panel sits to the right,
- tray is part of the board area so the relationship is obvious.

Mobile:

- controls wrap into two compact rows,
- board stays first,
- goal/readout panel moves below the board,
- buttons remain large and thumb-friendly.

### 5.3 Main UI Components

Header:

- home icon linking to `/learn/`
- title
- one-line subtitle
- language toggle
- theme toggle

Top control strip:

- mode toggle: `Learn`, `Challenge`, `Sandbox`
- topic toggle: `Series`, `Parallel`, `Mixed`
- optional difficulty selector in challenge mode
- action buttons: `New`, `Test`, `Hint`, `Reset`

Board area:

- battery tray with draggable cells
- structured socket template
- visible `+` and `-` rail markers
- a single load/device on the right side of the board
- animated wires/pulses during testing

Right panel:

- goal card
- live readouts
- concept summary
- short child-friendly explanation of the last result

Bottom status bar:

- one short sentence only
- examples: `Good: 2 cells in series = 3.0 V` or `Wrong: one battery is backwards`

## 6. Interaction Design

### 6.1 Battery Objects

Each battery should be a large, friendly AA-like cell with:

- visible `+` and `-` ends,
- a slight 3D body,
- a label such as `1.5 V`,
- drag state glow,
- tap-to-flip behavior when already placed.

Interaction rules:

- drag from tray to slot on desktop,
- tap battery in tray, then tap slot on mobile if drag feels unreliable,
- tap placed battery to rotate/flip polarity,
- drag out of a slot or tap a small `x` to remove it.

### 6.2 Board Templates

Use a small set of explicit layouts rather than generating arbitrary graphs.

Series template:

- 1 to 4 battery slots on one path
- the load sits at the end of the chain
- teaches `+` to `-` chaining

Parallel template:

- two or three horizontal or vertical branches between common rails
- one slot per branch in early levels
- later levels may allow two slots per branch but still identical branch length

Mixed template:

- two equal branches
- each branch contains 2 series slots
- visually grouped so the child can see "two little chains side by side"

Repair template:

- prefilled with one mistake
- child must flip, move, or remove a battery to make the pack correct

### 6.3 Test Flow

Pressing `Test` should:

1. briefly lock editing,
2. trace the active path(s) with glowing pulses,
3. update the readout panel,
4. animate the device response,
5. display a concise verdict.

Possible verdicts:

- `Correct`
- `Too little voltage`
- `Too much voltage`
- `Need more battery life`
- `Battery backwards`
- `Open circuit`
- `Short circuit`
- `Need both branches`
- `Parallel branches do not match`

The animation should be short and satisfying, similar in spirit to the reveal flow in `logigate/index.html`.

### 6.4 Device Feedback

For `v1`, use a **bulb only**. Its states should be immediately readable:

- off
- dim
- correct
- too bright

Other loads such as a flashlight, toy fan, or motor are future options only and should not be part of the initial implementation.

### 6.5 Hint System

Hints should be progressive:

- first hint: highlight the next relevant slot or wrong battery,
- second hint: show the needed branch shape,
- third hint: show a ghost preview of the correct arrangement.

Hints should explain the concept, not only the answer. Example:

- `Series means the batteries push one after another.`
- `Parallel means both branches start at + and end at -.`

## 7. Educational Model & Simplified Physics

### 7.1 Cell Model

Use one simple battery type throughout the app:

- each cell = `1.5 V`
- each cell = `1 battery-life unit`

This is intentionally simplified. The app should not introduce real `mAh` numbers unless they clearly help and do not clutter the interface.

### 7.2 Series Rule

If identical cells are connected in series:

```text
V_total = sum of cell voltages
life_total = 1 life unit
```

Examples:

- 1 cell in series -> `1.5 V`, life `x1`
- 2 cells in series -> `3.0 V`, life `x1`
- 3 cells in series -> `4.5 V`, life `x1`

Child-facing explanation:

- `Series makes a bigger push.`
- `It does not make the pack last longer by itself.`

### 7.3 Parallel Rule

If identical cells are connected in parallel:

```text
V_total = 1.5 V
life_total = number of parallel cells
```

Examples:

- 2 cells in parallel -> `1.5 V`, life `x2`
- 3 cells in parallel -> `1.5 V`, life `x3`

Child-facing explanation:

- `Parallel keeps the same push.`
- `It gives the device more battery life.`

### 7.4 Mixed Rule

For this app, mixed packs should be limited to **equal series branches in parallel**.

Example:

- branch A: 2 cells in series = `3.0 V`, life `x1`
- branch B: 2 cells in series = `3.0 V`, life `x1`
- branches A and B in parallel = `3.0 V`, life `x2`

Simplified rule:

```text
pack voltage = voltage of one branch
pack life = sum of equal branches
```

Important guardrail:

- do not allow branches with different voltages to count as valid mixed packs,
- if one branch has 1 cell and another has 2 cells, show an error instead of trying to simulate it honestly.

### 7.5 Invalid Configurations

The app should detect and clearly explain these states:

- **Open circuit**: no complete path through the load
- **Backwards battery**: one cell reduces or blocks the intended push
- **Short circuit**: positive connected directly to negative without going through the load
- **Mismatched parallel branches**: branches do not represent the same series voltage
- **Overvoltage**: the pack exceeds the device's safe target for the level

These should be treated as teaching moments, not as hidden failure states.

### 7.6 Device Goal Model

Do not simulate arbitrary real loads. Instead, each challenge card defines:

- a target voltage,
- a target battery-life level,
- an optional exact board type.

Examples:

- `Make 3.0 V`
- `Make 1.5 V with battery life x2`
- `Make 3.0 V with battery life x2`

The device response should be derived from these goals rather than from a full electrical model. That keeps the app honest, readable, and easy to maintain.

## 8. Mode Design

### 8.1 Learn Mode

Learn mode is guided and linear. It introduces one concept at a time with a short animation and one interaction challenge.

Suggested lesson flow:

1. One battery powers a bulb.
2. Two batteries in series make the bulb brighter.
3. Two batteries in parallel keep the same brightness but increase life.
4. Compare series vs parallel side by side.
5. Build a mixed pack: two series pairs in parallel.
6. Fix a wrong pack.

Each lesson should end with one sentence of takeaway text, for example:

- `Series adds voltage.`
- `Parallel adds battery life.`
- `Mixed uses both ideas together.`

### 8.2 Challenge Mode

Challenge mode provides replayable tasks. It should feel closest to `logigate/index.html`:

- the child chooses a topic and difficulty,
- the app generates a new target,
- the child builds the pack,
- the app checks the result.

Suggested difficulty curve:

- **Easy**: 1-2 cells, direct series or parallel
- **Medium**: 3-4 cells, repair tasks, simple mixed packs
- **Hard**: extra distractor cells, stricter goals, minimal-cell bonus

Suggested star logic:

- 1 star: correct build
- 1 star: no hints used
- 1 star: minimal number of cells

### 8.3 Sandbox Mode

Sandbox mode removes scoring and lets the child experiment freely.

Sandbox should always show:

- current layout name (`series`, `parallel`, `mixed`)
- live voltage readout
- live battery-life readout
- one sentence explaining what changed after each edit

This mode is important because some children will learn fastest by trial and error rather than by ordered lessons.

## 9. Content & Copy

The copy must be short. Avoid textbook paragraphs inside the main UI.

Good examples:

- `Need: 3.0 V`
- `Life: x2`
- `Too much voltage for this bulb`
- `This branch is backwards`
- `Parallel means both branches share the same + and the same -`

Avoid:

- long definitions,
- engineering jargon without explanation,
- large blocks of instructional text inside the board area.

Bilingual requirement:

- English and Polish should be equally supported,
- concept labels should be extremely clear in both languages,
- mixed mode may use `Mixed` / `Mieszane` or `Series + Parallel` / `Szeregowo + równolegle` if that is clearer in the available space.

## 10. Safety Framing

This app should include a gentle but visible safety note somewhere in the help/tip area:

- `Real batteries can get hot if connected the wrong way. This app is a safe simulation.`

Important safety framing rules:

- never imply that short circuits are a good way to get "more power",
- never mention wall outlets or mains electricity,
- keep all visuals in the familiar low-voltage battery-to-bulb world.

## 11. Accessibility & UX Guardrails

- all interactive elements must be keyboard reachable,
- placed batteries need visible focus states,
- touch targets should be generous,
- color should not be the only signal for correctness,
- readouts should include text and icon states,
- reduced-motion mode should shorten or disable current-flow animation,
- the app must remain usable without audio.

## 12. Technical Implementation Notes

Use SVG rather than canvas for the main board. The reasons are the same as in `logigate/index.html`:

- sharp scalable sockets and rails,
- easy hit-testing with DOM elements,
- easy class-based animation for active paths and error states,
- simpler responsive resizing.

Recommended implementation approach:

- define board templates as small JS objects,
- each template lists slot positions, branch membership, and load terminals,
- evaluate templates directly instead of building a general-purpose circuit solver,
- animate result states by toggling CSS classes on rails, load, and batteries.

Helpful internal model:

```text
template {
  id,
  type,              // series | parallel | mixed | repair
  slots: [...],
  branches: [...],
  targetLoadNode,
}
```

Each slot stores:

- battery present or empty,
- orientation,
- branch membership.

From that data the app can compute:

- branch voltage,
- pack voltage,
- pack battery-life score,
- whether the layout is valid.

## 13. First Implementation Recommendation

For the first version, keep the scope tight:

- one battery style only,
- one main load icon only,
- the fixed template set defined in Section 15,
- guided lessons plus simple challenge generation,
- no free-form wire drawing,
- no multiple devices at once.

That version is already enough to teach the core ideas well. If it works, later versions can add:

- alternate load icons,
- repair-only puzzle packs,
- richer mixed templates,
- comparison mode with two boards side by side.

## 14. Success Criteria

The app is successful if a child can play for a few minutes and then correctly explain:

- `series = more voltage`,
- `parallel = longer battery life`,
- `mixed = equal series groups in parallel`,
- `battery direction matters`,
- `wrong connections can fail or be unsafe`.

If those ideas are obvious from the board interaction and the result animations, the app has achieved its purpose.

## 15. Locked V1 Specification

This section exists to remove interpretation gaps. Where Sections 15-20 are more specific than earlier sections, **Sections 15-20 take priority for `v1` implementation**.

### 15.1 Hard Product Decisions

- `v1` uses **one load only**: a bulb.
- `v1` uses **one battery type only**: an AA-style `1.5 V` cell.
- `v1` ships with **three user-visible modes only**: `Learn`, `Challenge`, `Sandbox`.
- `v1` ships with **three topics only**: `Series`, `Parallel`, `Mixed`.
- `v1` uses **SVG** for the board and tray.
- `v1` defaults to the **dark theme**, with the usual theme toggle available.
- `v1` includes **no audio**.
- all placed batteries are rendered **horizontally** in `v1`; flipping changes left/right polarity only.
- the board uses a fixed internal coordinate system of `viewBox="0 0 960 560"` and scales responsively with CSS.
- the tray always contains identical loose cells; placing a cell consumes one tray item, removing a placed cell returns one tray item.
- editing remains enabled until `Test` is pressed; during the `Test` animation editing is locked for roughly `900-1200 ms`.

### 15.2 Exact Board Geometry

Use this exact internal layout model for `v1`. The implementation may scale it responsively, but should keep the same relative arrangement.

Global board anchors:

- tray rectangle: `x=24 y=112 w=144 h=336`
- playfield rectangle: `x=196 y=96 w=716 h=368`
- bulb center: `x=844 y=280`
- bulb radius: `34`
- normal slot footprint: `118 x 44`
- danger-slot footprint: `118 x 44`, but outlined in red and marked with a lightning icon

Slot orientation and polarity rule:

- every normal branch flows **left to right**,
- a slot in `forward` orientation means battery `-` on the left and `+` on the right,
- a slot in `reverse` orientation means battery `+` on the left and `-` on the right.

Exact template set:

```text
series_1
  kind: series
  slots:
    s1 (430, 280) branch=main

series_2
  kind: series
  slots:
    s1 (360, 280) branch=main
    s2 (520, 280) branch=main

series_3
  kind: series
  slots:
    s1 (300, 280) branch=main
    s2 (460, 280) branch=main
    s3 (620, 280) branch=main

series_4
  kind: series
  slots:
    s1 (250, 280) branch=main
    s2 (380, 280) branch=main
    s3 (510, 280) branch=main
    s4 (640, 280) branch=main

parallel_2
  kind: parallel
  branches:
    a: a1 (465, 210)
    b: b1 (465, 350)
  left bus x=310 from y=160 to y=400
  right bus x=620 from y=160 to y=400

parallel_3
  kind: parallel
  branches:
    a: a1 (465, 170)
    b: b1 (465, 280)
    c: c1 (465, 390)
  left bus x=310 from y=130 to y=430
  right bus x=620 from y=130 to y=430

mixed_2s2p
  kind: mixed
  branches:
    a: a1 (380, 210), a2 (550, 210)
    b: b1 (380, 350), b2 (550, 350)
  left bus x=290 from y=160 to y=400
  right bus x=640 from y=160 to y=400

repair_short_bypass
  kind: parallel
  branches:
    a: a1 (465, 210)
    b: b1 (465, 350)
  dangerSlots:
    d1 (465, 280) bypass=true
  left bus x=310 from y=160 to y=400
  right bus x=620 from y=160 to y=400
```

Required repair presets:

```text
repair_series_backwards
  template: series_2
  prefilled:
    s1 = forward
    s2 = reverse
  trayCount = 0

repair_parallel_backwards
  template: parallel_2
  prefilled:
    a1 = forward
    b1 = reverse
  trayCount = 0

repair_mixed_missing
  template: mixed_2s2p
  prefilled:
    a1 = forward
    a2 = forward
    b1 = forward
    b2 = empty
  trayCount = 1

repair_short_parallel
  template: repair_short_bypass
  prefilled:
    a1 = forward
    b1 = forward
    d1 = forward
  trayCount = 0
```

### 15.3 Interaction Contract

Exact interaction behavior for `v1`:

- desktop:
  - drag tray battery onto an empty slot to place,
  - click a placed battery to flip it,
  - click the small remove icon on a placed battery to return it to the tray.
- mobile / touch fallback:
  - tap a tray battery to arm placement,
  - tap an empty slot to place the armed battery,
  - tap a placed battery to flip it,
  - tap the small remove icon to remove it.
- a slot never holds more than one battery.
- placing into an occupied slot is not allowed; the user must remove first.
- in repair lessons with `trayCount = 0`, the tray still renders, but in a disabled state.
- `Reset` restores the current lesson/challenge to its initial template state.
- `New` in `Challenge` generates a new mission from the selected topic+difficulty pool.
- `New` in `Learn` restarts the current lesson.
- `New` in `Sandbox` clears the board and restores the default empty template for the selected topic.

### 15.4 Live Readouts Vs Test

Use this exact rule:

- after **every edit**, update the right-panel live readouts:
  - `Current voltage`
  - `Current battery life`
  - `Current structure`
- in `Learn` and `Challenge`, correctness is **only finalized on `Test`**,
- `Test` plays the path animation, updates the bulb state, and shows the bottom verdict bar,
- in `Sandbox`, the right panel updates live exactly the same way, but `Test` is still available to replay the animation.

`Current structure` values:

- `Series`
- `Parallel`
- `Mixed`
- `Incomplete`
- `Invalid`

## 16. Exact Evaluation Rules

### 16.1 Branch Activity Rules

For `v1`, the implementation must evaluate only the fixed templates listed above. Do not implement a general-purpose circuit solver.

Series templates:

- all slots in the `main` branch are required,
- if any slot is empty, the result is `Open circuit`.

Parallel templates:

- each branch is optional,
- a branch is **active** if it contains at least one battery,
- an active branch must have all of its slots filled,
- an empty branch is ignored,
- if all branches are empty, the result is `Open circuit`.

Mixed template:

- each branch is optional,
- a branch is **active** if it contains at least one battery,
- an active branch must have all of its slots filled,
- one active branch alone is not enough for a valid mixed pack,
- a valid mixed pack requires at least **two active branches** with equal branch voltage.

Danger slot rule:

- if any occupied `dangerSlot` exists, the verdict is immediately `Short circuit` and no further electrical comparison is needed.

### 16.2 Validation Precedence

Evaluate verdicts in this exact order:

1. `Short circuit`
2. `Open circuit`
3. `Battery backwards`
4. `Need both branches`
5. `Parallel branches do not match`
6. `Too little voltage`
7. `Too much voltage`
8. `Need more battery life`
9. `Correct`

This precedence is required so the app behaves predictably and the child sees the most important explanation first.

### 16.3 Exact Computation Rules

Cell constants:

- `CELL_VOLTAGE = 1.5`
- `CELL_LIFE = 1`

Branch rules:

- a normal filled slot in `forward` orientation contributes `+1.5 V`,
- a normal filled slot in `reverse` orientation makes the branch invalid and triggers `Battery backwards`,
- do not subtract reverse voltages in `v1`; treat them as a direct orientation error instead.

Series:

- `packVoltage = number_of_filled_slots * 1.5`
- `packLife = 1`

Parallel:

- every active branch must contain exactly one forward cell in `v1`,
- `packVoltage = 1.5`
- `packLife = active_branch_count`

Mixed:

- every active branch must contain exactly two forward cells in `v1`,
- `branchVoltage = 3.0`
- `packVoltage = 3.0`
- `packLife = active_branch_count`
- if active branches are not equal in filled-slot count, verdict = `Parallel branches do not match`
- if only one branch is active, verdict = `Need both branches`

### 16.4 Goal Comparison Rules

Each lesson/challenge defines:

- `targetVoltage`
- `targetLife`
- `expectedStructure`

After a valid pack is computed:

- if `packVoltage < targetVoltage`, verdict = `Too little voltage`
- else if `packVoltage > targetVoltage`, verdict = `Too much voltage`
- else if `packLife < targetLife`, verdict = `Need more battery life`
- else if `currentStructure !== expectedStructure`, verdict = `Need both branches` for mixed or `Parallel branches do not match` when appropriate
- else verdict = `Correct`

## 17. Exact Bulb And Meter States

### 17.1 Bulb State Mapping

Use this exact mapping after `Test`:

- `Short circuit`: bulb off, red warning ring on buses, small red crackle animation around the danger slot
- `Open circuit`: bulb off, no glow
- `Battery backwards`: bulb off, the reversed cell pulses red
- `Need both branches`: bulb dim amber, with missing-branch highlight
- `Parallel branches do not match`: bulb dim amber, mismatched branch outlined red
- `Too little voltage`: bulb dim amber, halo opacity about `0.25`
- `Too much voltage`: bulb very bright yellow-white, plus thin red outer ring
- `Need more battery life`: bulb normal yellow glow, battery-life meter underfilled
- `Correct`: bulb normal yellow glow, no warning ring

### 17.2 Meter Rules

Right-panel meters must show both numeric text and a visual bar.

Voltage meter:

- label: `Voltage`
- text format: `3.0 V`
- bar fill ratio = `min(currentVoltage / max(targetVoltage, 4.5), 1)`

Battery-life meter:

- label: `Battery Life`
- text format: `x2`
- bar fill ratio = `min(currentLife / max(targetLife, 3), 1)`

Sandbox-specific bulb mapping when no target is present:

- invalid or `0 V`: off
- `1.5 V`: dim
- `3.0 V`: good
- `4.5 V` or more: too bright

## 18. Exact Learn Mode Script

Implement these lessons in this exact order for `v1`.

### 18.1 Lesson List

1. `learn_01_single`
   - template: `series_1`
   - topic: `Series`
   - trayCount: `1`
   - targetVoltage: `1.5`
   - targetLife: `1`
   - expectedStructure: `Series`
   - intro: `Place one battery to light the bulb.`
   - takeaway: `One battery gives one small push.`

2. `learn_02_series_two`
   - template: `series_2`
   - topic: `Series`
   - trayCount: `2`
   - targetVoltage: `3.0`
   - targetLife: `1`
   - expectedStructure: `Series`
   - intro: `Build a 3.0 V pack by putting two batteries in series.`
   - takeaway: `Series adds voltage.`

3. `learn_03_series_fix`
   - template: `repair_series_backwards`
   - topic: `Series`
   - trayCount: `0`
   - targetVoltage: `3.0`
   - targetLife: `1`
   - expectedStructure: `Series`
   - intro: `One battery is backwards. Flip it.`
   - takeaway: `Battery direction matters.`

4. `learn_04_parallel_two`
   - template: `parallel_2`
   - topic: `Parallel`
   - trayCount: `2`
   - targetVoltage: `1.5`
   - targetLife: `2`
   - expectedStructure: `Parallel`
   - intro: `Build a pack that stays at 1.5 V but lasts twice as long.`
   - takeaway: `Parallel adds battery life.`

5. `learn_05_parallel_fix`
   - template: `repair_parallel_backwards`
   - topic: `Parallel`
   - trayCount: `0`
   - targetVoltage: `1.5`
   - targetLife: `2`
   - expectedStructure: `Parallel`
   - intro: `Both branches must point the same way. Fix the pack.`
   - takeaway: `Parallel branches share the same + and the same -.`

6. `learn_06_mixed_build`
   - template: `mixed_2s2p`
   - topic: `Mixed`
   - trayCount: `4`
   - targetVoltage: `3.0`
   - targetLife: `2`
   - expectedStructure: `Mixed`
   - intro: `Build two equal 3.0 V branches side by side.`
   - takeaway: `Mixed uses series inside parallel.`

7. `learn_07_mixed_fix`
   - template: `repair_mixed_missing`
   - topic: `Mixed`
   - trayCount: `1`
   - targetVoltage: `3.0`
   - targetLife: `2`
   - expectedStructure: `Mixed`
   - intro: `This mixed pack is missing one battery. Finish the second branch.`
   - takeaway: `Mixed branches must match.`

8. `learn_08_short_warning`
   - template: `repair_short_parallel`
   - topic: `Parallel`
   - trayCount: `0`
   - targetVoltage: `1.5`
   - targetLife: `2`
   - expectedStructure: `Parallel`
   - intro: `Remove the dangerous battery that connects + straight to -.`
   - takeaway: `A short circuit is unsafe and does not help the bulb.`

### 18.2 Learn Mode Gating

- only the current lesson is interactive,
- a `Next` button appears only after a `Correct` result,
- the app remembers the highest unlocked lesson in `localStorage`,
- switching language or theme must not reset lesson progress,
- `Reset` restarts the current lesson only.

## 19. Exact Challenge Pools And Scoring

### 19.1 Challenge Mission Pools

Use these exact challenge pools.

Series:

```text
Easy:
  series_1  -> target 1.5 V, life x1, tray 1, minimalCells 1
  series_2  -> target 3.0 V, life x1, tray 2, minimalCells 2
  series_3  -> target 4.5 V, life x1, tray 3, minimalCells 3

Medium:
  repair_series_backwards -> target 3.0 V, life x1, tray 0, minimalCells 2
  series_4               -> target 6.0 V, life x1, tray 4, minimalCells 4

Hard:
  series_4               -> target 6.0 V, life x1, tray 5, minimalCells 4
  repair_series_backwards -> target 3.0 V, life x1, tray 1, minimalCells 2
```

Parallel:

```text
Easy:
  parallel_2 -> target 1.5 V, life x2, tray 2, minimalCells 2
  parallel_3 -> target 1.5 V, life x3, tray 3, minimalCells 3

Medium:
  repair_parallel_backwards -> target 1.5 V, life x2, tray 0, minimalCells 2
  parallel_3                -> target 1.5 V, life x2, tray 3, minimalCells 2

Hard:
  repair_short_parallel -> target 1.5 V, life x2, tray 0, minimalCells 2
  parallel_3            -> target 1.5 V, life x2, tray 4, minimalCells 2
```

Mixed:

```text
Easy:
  no mixed missions on Easy

Medium:
  mixed_2s2p          -> target 3.0 V, life x2, tray 4, minimalCells 4
  repair_mixed_missing -> target 3.0 V, life x2, tray 1, minimalCells 4

Hard:
  mixed_2s2p          -> target 3.0 V, life x2, tray 5, minimalCells 4
  repair_mixed_missing -> target 3.0 V, life x2, tray 2, minimalCells 4
```

### 19.2 Challenge Generation Rules

- when the user presses `New`, randomly select one mission from the currently active topic+difficulty pool,
- if the pool contains more than one mission, do not repeat the current mission when rerolling,
- if the active pool is empty, render a disabled state and show `Mixed starts at Medium`.

### 19.3 Star Rules

Award stars exactly as follows:

- star 1: mission result is `Correct`
- star 2: mission result is `Correct` and `hintsUsed === 0`
- star 3: mission result is `Correct` and `placedCellCount <= minimalCells`

Persist best star count per mission id in `localStorage`.

## 20. Required EN / PL String Inventory

The implementation must include at least these keys. Exact wording should match this table unless a local layout issue forces a shorter equivalent.

| Key | English | Polish |
|---|---|---|
| `title` | Battery Connection Lab | Laboratorium Łączenia Baterii |
| `subtitle` | Build packs in series, parallel, and mixed. | Buduj pakiety szeregowe, równoległe i mieszane. |
| `mode` | Mode | Tryb |
| `topic` | Topic | Typ |
| `difficulty` | Difficulty | Poziom |
| `learn` | Learn | Nauka |
| `challenge` | Challenge | Wyzwanie |
| `sandbox` | Sandbox | Piaskownica |
| `series` | Series | Szeregowo |
| `parallel` | Parallel | Równolegle |
| `mixed` | Mixed | Mieszane |
| `easy` | Easy | Łatwy |
| `medium` | Medium | Średni |
| `hard` | Hard | Trudny |
| `new` | New | Nowe |
| `test` | Test | Sprawdź |
| `hint` | Hint | Podpowiedź |
| `reset` | Reset | Reset |
| `next` | Next | Dalej |
| `goal` | Goal | Cel |
| `needVoltage` | Need | Potrzeba |
| `needLife` | Battery Life | Czas pracy |
| `currentVoltage` | Voltage | Napięcie |
| `currentLife` | Battery Life | Czas pracy |
| `currentStructure` | Structure | Układ |
| `statusReady` | Build your pack and press Test. | Zbuduj pakiet i naciśnij Sprawdź. |
| `statusSandbox` | Try ideas and watch what changes. | Próbuj pomysłów i patrz, co się zmienia. |
| `correct` | Correct | Dobrze |
| `tooLittleVoltage` | Too little voltage | Za małe napięcie |
| `tooMuchVoltage` | Too much voltage | Za duże napięcie |
| `needMoreLife` | Need more battery life | Potrzeba dłuższego czasu pracy |
| `batteryBackwards` | Battery backwards | Bateria jest odwrotnie |
| `openCircuit` | Open circuit | Obwód jest przerwany |
| `shortCircuit` | Short circuit | Zwarcie |
| `needBothBranches` | Need both branches | Potrzebne są obie gałęzie |
| `branchesMismatch` | Parallel branches do not match | Gałęzie równoległe nie pasują do siebie |
| `structureSeries` | Series | Szeregowy |
| `structureParallel` | Parallel | Równoległy |
| `structureMixed` | Mixed | Mieszany |
| `structureIncomplete` | Incomplete | Niepełny |
| `structureInvalid` | Invalid | Błędny |
| `bulbOff` | Bulb is off | Żarówka nie świeci |
| `bulbDim` | Bulb is dim | Żarówka świeci słabo |
| `bulbGood` | Bulb is bright enough | Żarówka świeci dobrze |
| `bulbTooBright` | Bulb is too bright | Żarówka świeci za mocno |
| `safetyNote` | Real batteries can get hot if connected the wrong way. This app is a safe simulation. | Prawdziwe baterie mogą się nagrzewać, gdy są źle połączone. Ta aplikacja to bezpieczna symulacja. |
| `hintSeries1` | Series means one battery pushes after another. | Szeregowo oznacza, że jedna bateria pcha za drugą. |
| `hintParallel1` | Parallel means every branch starts at + and ends at -. | Równolegle oznacza, że każda gałąź zaczyna się przy + i kończy przy -. |
| `hintMixed1` | Mixed means equal series branches placed in parallel. | Mieszane oznacza równe szeregi połączone równolegle. |
| `hintShort1` | Remove the battery that connects + straight to -. | Usuń baterię, która łączy + prosto z -. |
| `mixedStartsAtMedium` | Mixed starts at Medium. | Mieszane zaczyna się od poziomu Średni. |

Required lesson titles:

| Key | English | Polish |
|---|---|---|
| `lesson01Title` | One Battery | Jedna Bateria |
| `lesson02Title` | Two In Series | Dwie Szeregowo |
| `lesson03Title` | Fix The Direction | Popraw Kierunek |
| `lesson04Title` | Two In Parallel | Dwie Równolegle |
| `lesson05Title` | Match The Branches | Ustaw Takie Same Gałęzie |
| `lesson06Title` | Build A Mixed Pack | Zbuduj Pakiet Mieszany |
| `lesson07Title` | Finish The Second Branch | Dokończ Drugą Gałąź |
| `lesson08Title` | Remove The Short Circuit | Usuń Zwarcie |
