# Negative Feedback Tank: Strict Implementation Review

This review is for the next implementing agent. Read it before touching `feedbacktank.html`.

The current implementation is not a small miss. The architecture is wrong for the concept it is supposed to teach. The visible mechanism is mostly decorative, the desired level has no physical reference mechanism, the drain is not a proportional corrective actuator, and the water flow is not shown in a way a child can read instantly.

Do not patch the current fake mechanism. Replace it.

## Non-Negotiable Diagnosis

If you only:

- make the current valve a bit larger,
- add a second animated pipe,
- keep the current `state.u += K * e * dt` and just draw more linkage around it,
- keep the drain as only a user disturbance slider,
- keep the target as a detached green line with no physical connection,

then the result is still wrong.

The next version must be causally honest:

- the desired level must have a visible mechanical reference element,
- the measured level must have a visible sensing element,
- the controller output must drive the visible linkage,
- the visible linkage must drive the valve openings,
- the valve openings must drive the flow,
- the flow must drive the tank level.

If any of those steps are skipped or faked, the educational value collapses.

## Critical Findings In The Current File

### 1. The visible linkage is fake, not causal

Current refs:

- `feedbacktank.html:1811-1869`
- `feedbacktank.html:2049-2054`

What the code does now:

- the float and lever are animated from `state.h`,
- the valve gate is animated from `state.u`,
- `state.u` is updated directly by hidden controller math,
- the lever geometry does not compute the gate position.

Why this is wrong:

- The child sees a float and expects it to move the valve.
- The code does not actually do that.
- The mechanism is theater.
- That is exactly the kind of dishonest visualization this app must avoid.

What must change:

- Introduce one shared signed control state, for example `state.balance` in `[-1, 1]`.
- This state is the only actuator state.
- Every mechanical part is derived from it.
- Both valve openings are derived from it.
- The rocker position is derived from it.
- The visible linkage never moves independently from it.

Recommended control split:

```js
state.uIn = Math.max(0, state.balance);
state.uOut = Math.max(0, -state.balance);
```

Important:

- `state.balance` is not a decorative render value.
- It is the real control output.

### 2. The desired level has no physical mechanism attached to it

Current refs:

- `feedbacktank.html:1478-1525`
- `feedbacktank.html:2014-2054`

What the code does now:

- the target is just a green line and drag handle,
- the controller uses `state.s`,
- no physical linkage on the board uses that target line.

Why this is wrong:

- The child can see the actual float.
- The child cannot see what the float is being compared against.
- That makes the target feel magical.
- The user correctly pointed this out: the float must have a physical reference for the desired level.

What must change:

- Add a visible, mechanical `reference carriage` or `setpoint collar` on the board.
- That reference element moves when the target changes.
- It must be physically connected to the comparison mechanism.
- The comparison between measured level and desired level must be visible on the board, not only in math.
- The existing green target line may remain as a ruler, but it must move together with the physical reference carriage, not replace it.

Use this design:

- one actual float in the water,
- one dry adjustable reference carriage outside the tank,
- one visible comparison link or spring between them,
- one rocker/control beam that opens the inlet or drain.

Do **not** add a second submerged float unless you can explain exactly what it measures. In this app, one water float is enough. The desired level should be a dry reference mechanism, not another water measurement.

Recommended visible model:

- actual float: orange, on the real water surface,
- reference carriage: green, on a side guide rail at target height,
- comparison link: shows the gap between actual and desired,
- control rocker: moves the valves.

### 3. The drain is not a feedback actuator at all

Current refs:

- `feedbacktank.html:718-732`
- `feedbacktank.html:2016-2018`
- `feedbacktank.html:2444-2446`

What the code does now:

- `state.d` is a user-controlled drain opening,
- outflow depends on that fixed `state.d`,
- when the level is too high, the controller only closes the inlet.

Why this is wrong:

- The requested behavior is: too low -> inlet opens; too high -> drain opens.
- The current file only teaches one side of correction.
- That makes the "negative feedback" story much weaker and less physical.

What must change:

- Split the current drain concept into two separate things:
- `uOut`: controlled drain valve opened by feedback when the tank is too high.
- `leak` or `disturbanceDrain`: user-controlled persistent disturbance.
- The current `Drain Opening` slider should become the disturbance leak control, not the main controlled outlet valve.

If you keep only one `d`, you will blur controller action and disturbance. That is bad design and bad teaching.

Recommended flow model:

```js
const hSafe = Math.max(state.h, 0);
const qIn = Q_IN_MAX * state.uIn;
const qOut =
  (
    Q_BASE +
    Q_CONTROL_DRAIN * state.uOut +
    Q_LEAK_MAX * state.leak
  ) * Math.sqrt(hSafe);

state.h = clamp(state.h + (qIn - qOut + qPour) * dt, 0, 1);
```

Recommended meanings:

- `uIn`: actuator opening for the fill valve,
- `uOut`: actuator opening for the controlled drain valve,
- `leak`: user disturbance slider.

### 4. Delay mode is visually dishonest

Current refs:

- `feedbacktank.html:1811-1834`
- `feedbacktank.html:2037-2047`
- `feedbacktank.html:2049-2054`

What the code does now:

- the visible float and lever follow `state.h`,
- the controller actually uses delayed `state.m`.

Why this is wrong:

- In delay mode, the visible sensor says one thing while the controller uses another invisible value.
- This violates the original requirement and confuses the lesson.

What must change:

- In delay mode, the control linkage must follow `state.m`, not `state.h`.
- The board must show the difference between actual and measured when delay is present.

Recommended approach:

- keep the water surface at `h`,
- keep an actual float on that surface,
- add a measured marker / sensor carriage at `m`,
- attach the comparison mechanism and rocker to `m`.

Minimal honest pattern:

```js
const actualY = TANK_B - state.h * TANK_H;
const measuredY = TANK_B - state.m * TANK_H;
const referenceY = TANK_B - state.s * TANK_H;

actualFloat.setAttribute("cy", actualY);
measuredMarker.setAttribute("cy", measuredY);
referenceCarriage.setAttribute("cy", referenceY);

updateComparator(referenceY, measuredY);
updateRockerFromBalance(state.balance);
```

Do not keep animating the linkage from `state.h` when delay is on. That is wrong.

### 5. The inlet valve is too small and unreadable

Current refs:

- `feedbacktank.html:1527-1554`

What the code does now:

- valve housing is only `28 x 34`,
- the moving gate is only `16 x 14`,
- it is visually buried inside the pipe.

Why this is wrong:

- The valve is one of the main teaching elements.
- Right now it reads like a tiny icon, not a mechanism.
- On smaller screens it becomes even less legible.

What must change:

- Move the inlet valve to the upper part of the board so it reads as the `upper valve`.
- Make it large enough to read instantly.
- Show a body, a stem, a gate, and a nozzle.

Suggested geometry:

```js
const PIPE_INNER = 18;
const VALVE_W = 64;
const VALVE_H = 58;
const STEM_TRAVEL = 30;
const ROCKER_HALF_SPAN = 84;
const ROCKER_MAX_ANGLE = Math.PI / 10;
```

Practical rule:

- the valve body should be about 2.5x to 3x the pipe thickness,
- the gate travel should be obviously visible,
- the user should be able to tell open/half-open/closed without squinting.

### 6. The current "system of leverages" is just one diagonal line

Current refs:

- `feedbacktank.html:1564-1670`

What the code does now:

- one pivot dot,
- one diagonal lever line,
- one float at the end.

Why this is wrong:

- That is not a readable leverage system.
- There is no visible connection from target reference to comparator.
- There is no visible connection from comparator to two valves.
- There is no explicit mechanical reason one side should open inlet and the other side should open drain.

What must change:

- Replace the single diagonal line with a real mechanism layout.

Required visible parts:

- float in tank,
- float rod or sensor rod,
- adjustable reference carriage or setpoint rod,
- comparison element,
- rocker beam,
- left linkage to inlet valve,
- right linkage to drain valve.

Recommended visual arrangement:

```text
water source -> [BIG INLET VALVE]
                  |
                left rod
                  \
                   \____ rocker beam ____ right rod ---- [BIG DRAIN VALVE] -> outlet
                          |
                     comparison link
                       /         \
            reference carriage   measured float rod
```

This does not need to be a perfect CAD-grade mechanism. It does need to be causally honest and geometrically believable.

### 7. Water is not shown pouring through the pipes in a readable way

Current refs:

- `feedbacktank.html:1351-1361`
- `feedbacktank.html:1704-1729`
- `feedbacktank.html:1872-1889`

What the code does now:

- inlet flow is a thin rectangle inside the pipe,
- drain flow is a thin red rectangle inside the pipe,
- the outlet is mostly just a few drips.

Why this is wrong:

- The user explicitly asked to see water pouring from both pipes and flowing through them.
- Children should see water move through the pipe, through the valve, and into or out of the tank.
- Also: outlet water should still look like water. Do not color the liquid red. Color the pipe/valve accent red if needed, but the liquid remains water-colored.

What must change:

- Show water inside both pipes.
- Show water passing through both valves.
- Show an inlet jet entering the tank.
- Show an outlet jet leaving the tank.
- Tie jet width, opacity, and speed to real flow.

Recommended render pattern:

```js
function setPipeFlow(flowPath, jetPath, flow, time, makeJetPath) {
  const active = flow > 0.01;
  const width = 4 + flow * 10;

  flowPath.setAttribute("opacity", active ? 0.9 : 0);
  flowPath.setAttribute("stroke-width", width);
  flowPath.style.strokeDashoffset = String((-time * 120 * flow) % 24);

  jetPath.setAttribute("opacity", active ? 0.95 : 0);
  jetPath.setAttribute("stroke-width", 3 + flow * 7);
  jetPath.setAttribute("d", makeJetPath(12 + flow * 42));
}
```

Render advice:

- pipe walls: gray,
- valve accents: orange for inlet, warmer red/orange accent for drain hardware,
- actual water: blue on both sides,
- use dash motion or moving highlights to imply direction,
- do not leave the flow as a static filled bar.

### 8. Manual mode is no longer conceptually correct once the mechanism is fixed

Current refs:

- `feedbacktank.html:734-748`
- `feedbacktank.html:824-833`
- `feedbacktank.html:2314-2318`
- `feedbacktank.html:2499-2512`

What the code does now:

- one manual inlet valve slider,
- one singular valve readout,
- no controlled drain readout.

Why this is wrong:

- After the redesign there are two actuated flow paths.
- A singular valve UI will be misleading.
- The current manual mode also breaks the wrong part of the mechanism visually.

What must change:

- Show the feedback break between the sensor/comparator and the control rocker, not randomly across the beam.
- Manual mode should control the same signed actuator state used in auto mode.

Recommended manual control:

- one `Manual Balance` slider from `-100` to `+100`,
- negative = drain side opens,
- positive = inlet side opens.

Recommended manual logic:

```js
if (state.mode === "manual") {
  state.balance = state.manualBalance;
}

state.uIn = Math.max(0, state.balance);
state.uOut = Math.max(0, -state.balance);
```

If you insist on separate manual sliders, only do that if the mechanism is visibly disconnected and the UI clearly says the user is overriding both valves manually. The recommended solution is one signed manual balance control because it matches one rocker.

### 9. Readouts, explanations, and charts still describe the wrong system

Current refs:

- `feedbacktank.html:823-833`
- `feedbacktank.html:969-983`
- `feedbacktank.html:1027-1041`
- `feedbacktank.html:2283-2293`
- `feedbacktank.html:2325-2368`

What the code does now:

- one `Valve Opening` readout,
- status text says "too high, so the valve is closing",
- second chart only shows singular valve history.

Why this is wrong:

- The corrected system has inlet-side and drain-side actuation.
- The explanation must say what happens on both sides.

What must change:

- Replace singular valve copy with either:
- `Inlet Valve` and `Drain Valve`, or
- one signed `Control Balance` readout plus inflow/outflow.

Recommended chart update:

- Keep the level chart.
- Change the second chart to `Control Balance` from `-100%` to `+100%`.
- Positive = inlet side, negative = drain side.

That single signed chart is far more educational than plotting only inlet opening.

## Recommended Redesign: Use This Architecture

Do not improvise a new architecture. Use this one.

### State

```js
const state = {
  lang: "en",
  mode: "auto",
  running: true,

  h: 0.60,
  s: 0.60,
  m: 0.60,

  balance: 0.32,
  manualBalance: 0,

  uIn: 0.32,
  uOut: 0.00,
  leak: 0.35,

  K: 1.6,
  delaySeconds: 0,
  pourRemaining: 0,

  qIn: 0,
  qOut: 0,
};
```

Key point:

- `balance` is the single actuator state.
- `uIn` and `uOut` are derived from it, not independently controlled.

### Control Law

Keep the accumulator behavior from the original requirement. Do not collapse it into a purely proportional direct map unless you are intentionally rewriting the scientific model.

Recommended:

```js
const error = state.s - state.m;

if (state.mode === "auto") {
  state.balance += state.K * error * dt;
  state.balance = clamp(state.balance, -1, 1);
} else {
  state.balance = clamp(state.manualBalance, -1, 1);
}

state.uIn = Math.max(0, state.balance);
state.uOut = Math.max(0, -state.balance);
```

This gives you:

- too low -> balance moves positive -> inlet opens,
- too high -> balance moves negative -> drain opens,
- overshoot -> balance can cross sides,
- delay -> visible oscillation becomes possible.

### Mechanical Reference For Desired Level

Use one actual water float plus one dry adjustable reference carriage.

Do not use two submerged floats unless you have a very good reason. For this app, that is more confusing than helpful.

Recommended board elements:

- `actualFloat`: orange, on real water surface,
- `measuredMarker`: orange or amber, follows `m` if delay is used,
- `referenceCarriage`: green, follows `s`,
- `comparisonSpring` or `comparisonLink`: visually spans `m` to `s`,
- `rocker`: actuator beam driven by `balance`,
- `inletStem`, `drainStem`: move from `uIn` and `uOut`.

Minimum honest relationship:

```js
const actualY = TANK_B - state.h * TANK_H;
const measuredY = TANK_B - state.m * TANK_H;
const referenceY = TANK_B - state.s * TANK_H;

actualFloat.setAttribute("cy", actualY);
measuredMarker.setAttribute("cy", measuredY);
referenceCarriage.setAttribute("cy", referenceY);
comparisonSpring.setAttribute("d", makeSpringPath(measuredY, referenceY));
```

The user must be able to answer this just by looking:

- "This orange thing is where the water really is."
- "This green thing is where we want it to be."
- "This mechanism compares them."

### Rendering The Rocker And Valves

Derive the whole mechanism from `state.balance`, `state.uIn`, and `state.uOut`.

Recommended pattern:

```js
function updateMechanismVisuals() {
  const angle = state.balance * ROCKER_MAX_ANGLE;
  const sinA = Math.sin(angle);

  const leftX = ROCKER_X - ROCKER_HALF_SPAN;
  const rightX = ROCKER_X + ROCKER_HALF_SPAN;
  const leftY = ROCKER_Y + sinA * 18;
  const rightY = ROCKER_Y - sinA * 18;

  rocker.setAttribute("x1", leftX);
  rocker.setAttribute("y1", leftY);
  rocker.setAttribute("x2", rightX);
  rocker.setAttribute("y2", rightY);

  const inStemY = IN_STEM_TOP + (1 - state.uIn) * STEM_TRAVEL;
  const outStemY = OUT_STEM_TOP + (1 - state.uOut) * STEM_TRAVEL;

  inletRod.setAttribute("x1", leftX);
  inletRod.setAttribute("y1", leftY);
  inletRod.setAttribute("x2", IN_STEM_X);
  inletRod.setAttribute("y2", inStemY);

  drainRod.setAttribute("x1", rightX);
  drainRod.setAttribute("y1", rightY);
  drainRod.setAttribute("x2", OUT_STEM_X);
  drainRod.setAttribute("y2", outStemY);

  inletGate.setAttribute("y", IN_GATE_CLOSED_Y - state.uIn * STEM_TRAVEL);
  drainGate.setAttribute("y", OUT_GATE_CLOSED_Y - state.uOut * STEM_TRAVEL);
}
```

Important:

- do not animate the rocker from `state.h`,
- do not animate valve stems directly from target line height,
- do not leave either valve without a visible stem/link.

### Flow Visualization

Each side needs three readable pieces:

- flow inside the pipe,
- flow through the valve throat,
- visible jet outside the pipe.

Suggested inlet:

- top-left source pipe,
- large upper valve,
- visible blue jet entering the tank.

Suggested outlet:

- lower-right drain valve,
- visible blue outflow leaving the tank to the right or downward,
- optional droplets only as a secondary effect, not the main effect.

Minimal honest update pattern:

```js
setPipeFlow(inletPipeWater, inletJet, state.qIn, time, function (len) {
  return `M ${IN_NOZZLE_X} ${IN_NOZZLE_Y} L ${IN_NOZZLE_X} ${IN_NOZZLE_Y + len}`;
});

setPipeFlow(outletPipeWater, outletJet, state.qOut, time, function (len) {
  return `M ${OUT_NOZZLE_X} ${OUT_NOZZLE_Y} L ${OUT_NOZZLE_X + len} ${OUT_NOZZLE_Y}`;
});
```

Again: water is blue on both sides. Do not make outlet water red.

## Component-Level Design Rules

This section exists because the previous implementation simplified the wrong things.

You must keep the visuals simple in shape, but not simple in causality.

Correct rule:

- simplify ornament,
- simplify shading,
- simplify decorative detail,
- do **not** simplify away the parts that explain the control loop.

If removing a visual detail makes it harder to answer "what moved what?", then you removed the wrong thing.

### Tank Scale And Board Priority

The tank must remain large. Do not shrink it to make room for extra mechanism.

Minimum requirement:

- keep the tank at least as large as the current implementation,
- do not go below roughly `220 x 320` for the visible inner tank area,
- preferably make it slightly larger if the new linkage needs more breathing room.

Recommended geometry:

```js
const TANK_W = 240;
const TANK_H = 330;
const PIPE_INNER = 18;
const FLOAT_R = 18;
const REF_CARRIAGE_H = 26;
const VALVE_W = 64;
const VALVE_H = 58;
```

Practical layout rule:

- the tank is still the main object,
- the inlet valve and drain valve must be readable without reducing the tank to a toy,
- the board should read first as "large tank with visible mechanism", not "many tiny widgets around a small tank".

### Pipe Design Rules

The pipes must show moving water clearly at both low flow and high flow.

Required pipe layers:

- pipe wall / housing,
- clear interior bore,
- moving water core,
- visible jet outside the pipe.

Do not draw only a thin filled rectangle and call that flow.

At low flow the user should see:

- a narrow stream,
- shorter jet,
- lighter opacity,
- slower-looking dash or highlight motion.

At high flow the user should see:

- a thicker stream,
- fuller pipe occupancy,
- longer jet,
- stronger opacity,
- faster-looking movement.

Do not encode flow only with opacity. Use at least:

- thickness,
- jet length,
- motion pattern.

Recommended mapping:

```js
function flowVisual(flow, flowMax) {
  const n = clamp(flow / flowMax, 0, 1);
  return {
    coreWidth: 3 + n * 11,
    jetWidth: 2 + n * 8,
    jetLength: 10 + n * 46,
    opacity: 0.15 + n * 0.8,
    dash: 14 - n * 6,
    speed: 30 + n * 90,
  };
}
```

Recommended rendering behavior:

```js
const vis = flowVisual(state.qIn, Q_IN_MAX);
inletPipeWater.setAttribute("stroke-width", vis.coreWidth);
inletPipeWater.setAttribute("opacity", vis.opacity);
inletPipeWater.setAttribute("stroke-dasharray", `${vis.dash} ${vis.dash * 0.8}`);
inletPipeWater.style.strokeDashoffset = String((-time * vis.speed) % 40);
inletJet.setAttribute("stroke-width", vis.jetWidth);
inletJet.setAttribute("d", makeInletJetPath(vis.jetLength));
```

Visual rules:

- inlet pipe should enter from upper-left or upper side,
- drain pipe should leave from lower-right or lower side,
- water remains blue in both pipes,
- pipe metal can differ by function, but the fluid does not change color.

### Floaters, Markers, And Reference Mechanism

The floating/sensing elements must be big and legible enough to reason about the control.

Use this family of components:

- `actualFloat`: the real wet float on the water surface,
- `referenceCarriage`: the desired-level mechanism on a dry rail,
- `measuredMarker`: optional delayed sensor marker when delay is active.

Rules for the actual float:

- it must visibly touch the water surface,
- it must look buoyant, not like a random circle,
- it must be attached to a rod, arm, or guide,
- it must be large enough to read on mobile.

Rules for the reference carriage:

- it must move with the target setpoint,
- it must sit on a visible guide rail,
- it must be physically connected to the comparator,
- it may look float-like for symmetry, but it is **not** another water float.

Rules for measured marker in delay mode:

- it should be visibly different from the actual float,
- it should be simpler and smaller than the main float,
- it must follow `state.m`, not `state.h`,
- when delay is `0`, it may merge visually with the actual sensor linkage.

Do not do any of these:

- two identical wet floaters in the tank,
- one floating ball with no rod or guide,
- one magical target line with no mechanism,
- a delayed controller with no visible delayed marker.

Recommended proportions:

```js
const FLOAT_R = 18;
const FLOAT_STEM_W = 4;
const GUIDE_RAIL_W = 6;
const REF_CARRIAGE_W = 28;
const REF_CARRIAGE_H = 26;
const MEASURED_MARKER_R = 10;
```

Design rule:

- if a child cannot point at the screen and say "this is actual water level" and "this is desired level," the component design failed.

### Valve Design Rules

Both valves must be large, simple, and mechanically readable.

Each valve needs:

- body,
- throat/opening,
- stem,
- moving gate or plug,
- nozzle connection to the pipe,
- visible rod/link connection to the rocker.

Use a simple valve type. A gate or plug valve with vertical stem travel is preferred because it is easy to read.

Do not use:

- tiny embedded blocks inside the pipe,
- handwheel-only symbols,
- abstract icons with no visible opening motion,
- a valve that changes only color but not geometry.

Required readable states:

- closed,
- slightly open,
- half open,
- mostly open.

Those states must be distinguishable even if the readout panel is hidden.

Recommended geometry:

```js
const VALVE_W = 64;
const VALVE_H = 58;
const VALVE_THROAT_W = 20;
const STEM_W = 5;
const STEM_TRAVEL = 30;
const GATE_H = 18;
```

Recommended mapping:

```js
function setValveVisual(stem, gate, opening, stemTop, gateClosedY) {
  const u = clamp(opening, 0, 1);
  const stemY = stemTop + (1 - u) * STEM_TRAVEL;
  stem.setAttribute("y2", stemY);
  gate.setAttribute("y", gateClosedY - u * STEM_TRAVEL);
}
```

Important behavior rule:

- the inlet valve responds to positive control balance,
- the drain valve responds to negative control balance,
- the same rocker must explain why one side opens as the other side takes over.

Do not animate them as unrelated widgets.

### Interaction Choreography

The interaction between components must follow a readable order.

When the user changes the target:

- the reference carriage moves immediately,
- the comparator gap changes immediately,
- the rocker shifts immediately,
- valve stems move immediately,
- pipe flow changes immediately,
- the water level changes gradually after that,
- the actual float follows the water level,
- the error shrinks over time.

When the user increases the disturbance leak:

- outlet disturbance increases immediately,
- the water level begins falling,
- the actual float falls with the water,
- the measured marker follows with delay if delay is enabled,
- the rocker tilts toward the fill side,
- the inlet valve opens more,
- the system settles or oscillates depending on `K` and delay.

When the tank overshoots above target:

- the control balance must cross through neutral,
- the inlet side must reduce or close,
- the drain side must take over visibly,
- if the controller is aggressive or delayed, the rocker may switch sides repeatedly before settling.

This "switch back and forth until stable" behavior is correct only if it comes from the same signed control state. Do not fake it by manually toggling valve graphics.

### Big Enough To Reason About

Everything that directly affects control and feedback must be oversized relative to decorative detail.

That means:

- float: large,
- reference carriage: large,
- rocker: thick and obvious,
- valve bodies: large,
- stems and rods: clearly visible,
- jets: visible from normal viewing distance.

Things that may stay understated:

- glass reflections,
- tank tick marks,
- panel borders,
- decorative highlights.

If a controlled part is smaller than a decorative part, your priorities are wrong.

## One Float Or Two?

The user asked the right question. Here is the answer you should implement:

- One actual water float is enough.
- The second thing is not another water float.
- The second thing is the adjustable desired-level reference mechanism.

That means:

- one wet sensor float in the tank,
- one dry reference carriage on a guide rail,
- both physically tied into the comparison/control system.

That is much clearer than putting two actual floaters in the water.

## Acceptance Checklist

Your implementation is not done until all of these are true:

- When the tank is below target, the upper inlet valve visibly opens more in proportion to the error.
- When the tank is above target, the drain valve visibly opens more in proportion to the error.
- The target has a visible mechanical reference element connected to the comparator.
- In delay mode, the linkage follows the measured value, not the true level invisibly.
- The inlet valve is large and easy to read.
- The drain valve is also visibly actuated, not just a fixed hole.
- Water is visibly flowing inside both pipes.
- Water is visibly pouring into the tank from the inlet.
- Water is visibly leaving through the drain outlet.
- Low flow and high flow look different even without reading numbers.
- The actual float, reference carriage, and delayed measured marker are visually distinguishable.
- The tank is not smaller than the current version.
- A target change can be understood by eye as a physical change in the reference mechanism.
- The same control state drives rocker position, valve openings, and control chart.
- Manual mode breaks the feedback connection at the sensor/comparator side and lets the user drive the actuator manually.
- The explanation text says both halves of the correction: too low -> fill more; too high -> drain more.

## Final Instruction

Do not "improve" the current fake diagonal lever and tiny gate. Delete that design and rebuild the mechanism around:

- actual float,
- desired-level reference carriage,
- visible comparator,
- one signed control balance,
- big inlet valve,
- big drain valve,
- visible blue water flow through both pipes,
- component sizes chosen so the control logic is easy to read.

That is the minimum redesign that will stop this app from looking stupid and make it actually teach something.
