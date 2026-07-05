# Gravassist Game Mode Redesign Handoff

## 0. Status Of This Document

This document is the canonical redesign handoff for the game mode inside [gravassist.html](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html).

Its purpose is to give an implementing agent one strict product, interaction, fairness, and QA spec.

If the implementing agent and reviewer disagree about intent, this document wins.

The scope is `gravassist.html` only.

Explore mode must remain available.

The redesign target is the current `Game` mode.

## 1. Research Outcome

### 1.1 What Was Investigated

- current `Game` mode logic in [gravassist.html](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html)
- current reward pattern in [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html)
- repo requirement/history notes in [GRAV_REQ_REF.md](/Users/llepecki/Projects/llepecki.github.io/learn/GRAV_REQ_REF.md)
- local static review via `npm run code-review -- gravassist.html`

### 1.2 Review Conclusion

The current game mode is not primarily failing because targets are obviously mathematically impossible.

A direct code reading plus lightweight search-based probes suggest this instead:

- most generated targets are probably reachable
- the mode still feels unfair or unclear because the challenge rules are not stable
- the current implementation allows multiple accidental cheats
- the current UI hides the very feedback needed for a fuel-efficiency reward loop

### 1.3 Empirical Notes

These notes are for design context, not as a runtime requirement:

- a local probe of `100` generated hidden trajectories per planet found the generator’s own witness solution still hit the generated target in roughly `98%` to `100%` of sampled cases under the current tolerance logic
- a separate random-control search over sampled `Earth`, `Jupiter`, and `Saturn` challenges found valid hits in all tested samples

Therefore:

- do not treat this redesign as a pure “fix unsolvable levels” task
- do treat it as a fairness, legibility, and progression redesign
- still add hard solvability guarantees, because the current code does not provide them explicitly

## 2. Confirmed Problems

This section is the review result. These are the issues the implementation must resolve.

### 2.1 High Severity

#### A. Win tolerance depends on camera scale and therefore on zoom

Current code:

- [gravassist.html line 1150](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:1150)
- [gravassist.html line 2543](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2543)

Problem:

- `gameTolerance()` is derived from `lastScale`
- `lastScale` changes when the player zooms or changes camera mode
- this means the world-space hit radius changes with view manipulation

Result:

- the player can make the challenge easier or harder by changing the camera
- mission fairness is undefined
- any future star/fuel system would be corrupted by a zoom exploit

Required fix:

- mission hit tolerance must be fixed per mission and must not depend on current zoom, camera mode, or viewport size after mission generation

#### B. The player can drag the target in game mode

Current code:

- [gravassist.html line 2667](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2667)
- [gravassist.html line 2759](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2759)

Problem:

- the challenge target is directly draggable during play

Result:

- the puzzle can be trivialized
- any mission validation or star reward becomes meaningless

Required fix:

- the target must never be draggable in game mode

#### C. The player can drag the spacecraft root freely in game mode

Current code:

- [gravassist.html line 2682](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2682)
- [gravassist.html line 2759](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2759)

Problem:

- the game currently exposes an unconstrained root-translation mechanic
- this is not presented as a formal mission control
- it changes the challenge more radically than a child would expect

Result:

- the same mission has no stable input model
- “starting position” becomes ambiguous
- the puzzle is hard to reason about and impossible to score fairly

Required fix:

- root translation must be disabled in game mode
- game mode must expose flyby altitude as an explicit control instead

#### D. The player can still change planet speed during a mission

Current code:

- [gravassist.html line 1069](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:1069)
- [gravassist.html line 2518](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2518)

Problem:

- game mode resets `planetVel` when it starts
- but the planet-speed slider stays active and continues to mutate the challenge

Result:

- the mission is not fixed
- difficulty and star thresholds cannot be trusted
- the app stops teaching a stable gravity-assist situation

Required fix:

- planet speed must be locked in game mode
- the control must be hidden or disabled there

### 2.2 Medium Severity

#### E. Game mode hides the useful readouts instead of reframing them

Current code:

- [gravassist.html line 609](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:609)
- [gravassist.html line 1069](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:1069)

Problem:

- game mode removes the speed/boost/altitude feedback entirely

Result:

- the mode becomes less educational exactly where it should teach “free speed”
- there is no obvious place to introduce a fuel tank or star thresholds

Required fix:

- game mode must show a compact mission HUD instead of hiding all readouts

#### F. The copy says “Click Launch” but there is no explicit Launch control

Current code:

- [gravassist.html line 680](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:680)
- [gravassist.html line 526](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:526)

Problem:

- the UI presents play icons and time-warp buttons
- the instruction text references a `Launch` action that is not actually labeled

Result:

- first-use comprehension is weaker than it should be

Required fix:

- game mode must expose an explicitly labeled launch affordance

#### G. Success ends immediately, while miss/crash resolve at the end

Current code:

- [gravassist.html line 2317](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2317)
- [gravassist.html line 2340](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:2340)

Problem:

- success is detected mid-flight and stops the run immediately
- miss/crash resolve later

Result:

- result timing is inconsistent
- the child does not get to see the full assist arc on successful runs
- post-run fuel/boost summary becomes less coherent

Required fix:

- record the first hit index if desired, but show the result after the attempt finishes

#### H. Mission generation uses hidden defaults that are not explained to the player

Current code:

- [gravassist.html line 1102](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:1102)
- [gravassist.html line 1131](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:1131)

Problem:

- the generator samples one hidden solution band
- then resets the player to a generic default state
- the reset values are duplicated and partially hard-coded

Result:

- challenge construction is opaque
- per-planet game feel is inconsistent

Required fix:

- replace this with an explicit mission object and explicit player defaults

### 2.3 Low Severity

#### I. `generateTarget()` contains duplicated reset assignments

Current code:

- [gravassist.html line 1131](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html:1131)

Problem:

- `periapsisAlt` and `approachSpeed` are assigned twice

Required fix:

- remove the duplicate assignments during refactor

## 3. Redesign Decision

Do not replace the whole app.

Do not remove explore mode.

Do not turn the app into a level-select worksheet.

The correct product move is:

- keep `Explore` as the free sandbox
- keep the `Game` button label if desired
- redesign the underlying game loop into a fixed `Mission Challenge` model

In this redesign, each mission is a stable puzzle with:

- one planet
- one locked planet speed
- one fixed target
- one fixed hit radius
- one deterministic input model
- one fuel-efficiency reward ladder

## 4. Non-Negotiable Product Outcomes

The implementation is successful only if all of the following are true:

1. Explore mode still works as a free manipulation sandbox.
2. Game mode becomes a fixed mission rather than a loosely editable scene.
3. The target is not draggable in game mode.
4. The spacecraft root is not draggable in game mode.
5. Planet speed is not adjustable in game mode.
6. The player can still control:
   - approach direction
   - launch speed
   - flyby altitude
7. Game mode shows a visible fuel tank.
8. A successful hit awards `1`, `2`, or `3` stars.
9. More stars require less fuel.
10. The star system rewards valid gravity-assist usage, not camera tricks.
11. Mission success is evaluated with a fixed mission-space tolerance.
12. Zooming or changing camera mode does not change whether the player wins.
13. The mission target stays fixed for the entire attempt.
14. The player can retry the same mission cleanly.
15. The player can explicitly request a new mission.
16. The result summary explains fuel use and the gravity-assist benefit.
17. English and Polish remain complete.
18. Mobile layout remains usable.

## 5. Scope Constraints

These are strict.

### 5.1 File Scope

Primary implementation target:

- [gravassist.html](/Users/llepecki/Projects/llepecki.github.io/learn/gravassist.html)

Reference only:

- [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html)
- [GRAV_REQ_REF.md](/Users/llepecki/Projects/llepecki.github.io/learn/GRAV_REQ_REF.md)
- [package.json](/Users/llepecki/Projects/llepecki.github.io/learn/package.json)

### 5.2 Physics Scope

- keep the current corrected constant-velocity planet visualization model
- do not undertake a full solar-system physics rewrite as part of this task
- only change physics logic where required for mission fairness and stable evaluation

### 5.3 Product Scope

- do not add a large authored campaign in this pass
- do not add networking, persistence, or server-side leaderboards
- do not add a second scoring system unrelated to fuel

This pass is about:

- fairness
- clarity
- fuel reward
- mission stability

## 6. Canonical Gameplay Model

### 6.1 Explore Mode

Explore mode keeps the existing freeform spirit.

It may continue to allow:

- arrow-tip drag for direction and speed
- root drag
- planet speed changes
- camera changes

Explore mode is not scored.

### 6.2 Game Mode

Game mode becomes `Mission Challenge`.

A mission is a stable challenge defined by:

- `planetKey`
- `planetSpeed`
- `target.x`
- `target.y`
- `hitRadiusWorld`
- `playerDefaults`
- `fuelThresholds`
- `witnessSolution`
- `result state`

### 6.3 Allowed Game Inputs

The player may change only:

- approach direction
- launch speed
- flyby altitude
- playback speed
- camera zoom and focus

The player may not change:

- target position
- spacecraft root position
- planet speed

### 6.4 New Mission Flow

When the player enters game mode or presses `New Mission`:

1. a new mission is generated for the currently selected planet
2. the mission stores a fixed target and fixed tolerance
3. the player state resets to game defaults for that planet
4. previous result state is cleared
5. the previous-attempt ghost is cleared

Changing planet in game mode is allowed only if it immediately discards the old mission and generates a fresh mission for the newly selected planet.

## 7. Control Redesign

### 7.1 Keep The Velocity Arrow

Keep the arrow-tip drag as the primary direct-manipulation control for:

- approach direction
- launch speed

This is one of the best parts of the current app and should remain the core interaction.

### 7.2 Add An Explicit Flyby-Altitude Control

Game mode must no longer rely on root translation as the way to control flyby altitude.

Implement:

- a visible `Flyby Altitude` slider
- `-` and `+` step buttons
- a numeric readout

Behavior:

- changing this control updates `state.periapsisAlt`
- then calls the normal position/trajectory recompute path
- in game mode this is the only altitude-control mechanism

Explore mode may keep root drag, but the new altitude control should stay synchronized there as well.

### 7.3 Planet Speed Control Visibility

In game mode:

- hide the planet-speed slider group entirely

In explore mode:

- keep it unchanged

### 7.4 Launch Controls

Game mode must present an explicit launch label.

The simplest acceptable implementation is:

- relabel the existing warp buttons in game mode to `Launch`, `Launch x3`, `Launch x10`
- keep their current playback-speed behavior

Do not leave game mode with icon-only launch controls.

## 8. Fuel System

### 8.1 Fuel Definition

Fuel must be based on the powered launch, not on animation time and not on path length.

Use this exact rule:

- `fuelUsed = round(approachSpeed)`

Rationale:

- the only explicit powered action in the current model is the chosen inbound spacecraft speed
- lower launch speed combined with a successful assist is the clearest “less fuel, more gravity assist” teaching outcome

Do not invent hidden penalties for camera movement or drag count.

### 8.2 Fuel Tank HUD

Game mode must show a fuel tank or horizontal fuel bar.

Required contents:

- current planned fuel use before launch
- committed fuel use during flight
- star-threshold markers
- numeric label, for example `Fuel used: 46 / 100`

The tank must update live while the player drags the velocity arrow.

### 8.3 Fuel Threshold Rules

Use `1` star, `2` stars, `3` stars on success only.

Star mapping:

- `3` stars if `fuelUsed <= goldFuel`
- `2` stars if `fuelUsed <= silverFuel`
- `1` star for any other successful hit

There is no `0-star success`.

Crash or miss gives no stars.

### 8.4 Threshold Source

Thresholds must not be arbitrary global constants.

They must be derived from validated solutions for the current mission.

At minimum the mission generator must find:

- one successful low-fuel solution for `goldFuel`
- one successful medium-fuel solution for `silverFuel`
- one successful witness solution proving the mission is winnable

Mission acceptance rule:

- reject a generated mission unless all three of the above exist
- reject a mission unless `goldFuel < silverFuel`
- reject a mission unless the low-fuel solution actually performs a real assist, meaning it reaches the target after periapsis on the outbound portion of the trajectory

The exact search algorithm is up to the implementer, but the validation guarantee is not optional.

## 9. Mission Generation Rules

### 9.1 Core Rule

The current `generateTarget()` function must be replaced by a mission generator that produces a complete, validated mission object.

Recommended helper names:

- `generateMission(planetKey)`
- `buildMissionCandidate(planetKey)`
- `validateMission(candidate)`
- `findMissionFuelThresholds(candidate)`

### 9.2 Target Placement Rule

Place the target exactly on a validated witness trajectory.

Do not add a random world-space offset the way the current implementation does.

Variation should come from:

- which witness trajectory is chosen
- where along the outbound leg the target sits

This keeps the mission readable and fair.

### 9.3 Outbound Placement Rule

The target must be placed on the outbound post-flyby part of the path.

Required placement window:

- after closest approach
- not too close to periapsis
- not at the very last sample

The current `60%..80%` outbound-window idea is acceptable as a starting point.

### 9.4 Fixed Hit Radius Rule

When the mission is created:

- compute and store `hitRadiusWorld`

After that:

- never derive hit radius from current camera scale
- never derive it from zoom level
- never derive it from viewport size during gameplay

The marker may still be rendered visually at whatever on-screen size the camera implies, but the hit test must use the stored world-space radius only.

### 9.5 Determinism Rule

For a single mission:

- same controls must always produce the same result
- replay must replay the same mission
- retry must not regenerate the target

`New Mission` is the only action that should replace the mission.

## 10. Result Flow

### 10.1 Attempt End Timing

Do not stop successful flights the instant the target is crossed.

Instead:

- record the first hit sample index if needed
- continue the animation to the normal end
- show the final result overlay after the attempt resolves

### 10.2 Result Summary Content

On success the overlay must include:

- star count
- fuel used
- speed boost or exit speed benefit
- retry action cue

On miss the overlay must include:

- miss message
- fuel used
- retry action cue

On crash the overlay must include:

- crash message
- fuel used
- retry action cue

### 10.3 Star Presentation

Use [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html) as the visual and behavioral reference for the `3 / 2 / 1` star reward language.

Reuse the conceptual pattern, not necessarily the exact SVG implementation.

Requirements:

- `3`, `2`, and `1` stars must be visually distinct
- announce the reward accessibly
- preserve reduced-motion behavior

## 11. HUD Redesign

### 11.1 Do Not Hide Everything

The current “hide all readouts in game mode” behavior must be removed.

Instead:

- replace it with a compact game HUD

### 11.2 Required Game HUD Contents

Game HUD must show:

- fuel tank
- current fuel number
- target/mode label
- current flyby altitude
- post-run speed boost summary after a completed attempt

Optional but recommended:

- best stars earned this session for the current mission
- last attempt fuel

### 11.3 Explore Readouts

The existing readouts can stay in explore mode.

Do not force the full explore readout block into game mode unchanged.

Game mode needs a cleaner summary surface.

## 12. State Model

The current scattered game fields should be consolidated.

Recommended state shape:

```js
state.game = {
  mission: null,
  launched: false,
  result: null,
  ghost: null,
  hitIndex: -1,
  fuelUsed: 0,
  lastAttemptFuelUsed: 0,
  lastAttemptBoost: 0,
  lastAttemptStars: 0,
}
```

Recommended mission shape:

```js
{
  id,
  planetKey,
  planetSpeed,
  target: { x, y },
  hitRadiusWorld,
  defaults: {
    approachAngle,
    approachSpeed,
    periapsisAlt,
  },
  thresholds: {
    goldFuel,
    silverFuel,
  },
  witness: {
    angle,
    speed,
    periapsisAlt,
  },
}
```

You may use different names, but the semantics must remain equivalent.

## 13. Implementation Sequence

Implement in this exact order.

### 13.1 Milestone 1: State And UI Shell

- add the new game HUD DOM
- add flyby-altitude controls
- add game-specific labels in EN and PL
- introduce `state.game` and mission object scaffolding
- keep the app runnable

### 13.2 Milestone 2: Game Input Rules

- disable target drag in game mode
- disable root drag in game mode
- hide/disable planet-speed control in game mode
- add the flyby-altitude slider logic
- relabel launch controls in game mode

### 13.3 Milestone 3: Mission Generator

- replace `generateTarget()` with mission generation
- store fixed mission target and fixed hit radius
- ensure retry does not regenerate
- ensure new mission does regenerate

### 13.4 Milestone 4: Fixed Hit Testing

- remove camera-scale tolerance from game win detection
- use mission-stored hit radius everywhere
- ensure zoom cannot change result

### 13.5 Milestone 5: Fuel And Stars

- compute `fuelUsed`
- compute mission thresholds from validated solutions
- add live fuel tank markers
- implement success star award logic
- add accessible star announcement

### 13.6 Milestone 6: Result Flow

- stop resolving success mid-flight
- move all result overlays to post-run summary
- include fuel and boost details

### 13.7 Milestone 7: Polish And QA

- mobile cleanup
- localization pass
- reduced-motion pass
- replay/retry edge cases
- code review run

## 14. Hard Rejection Conditions

The work is incorrect if any of the following remain true:

1. Zoom level can still change win/loss.
2. The target can still be dragged in game mode.
3. The spacecraft root can still be dragged in game mode.
4. Planet speed can still be adjusted in game mode without regenerating the mission.
5. Game mode still has no visible fuel display.
6. Success stars are based on anything other than fuel.
7. A successful hit can receive `0` stars.
8. Retry regenerates the mission.
9. Success still terminates immediately on first contact.
10. The game still hides all useful feedback after the redesign.

## 15. Verification Requirements

### 15.1 Automated

Run:

```bash
npm run code-review -- gravassist.html
```

### 15.2 Manual Functional Checks

Verify all of the following:

1. Enter game mode, zoom in, launch, then retry the same mission at a different zoom. The win/loss result must not change if the controls are identical.
2. In game mode, clicking the target does nothing except normal interaction feedback. The target must not move.
3. In game mode, dragging the spacecraft root does nothing. Only the arrow tip and flyby-altitude control may change the setup.
4. In game mode, the planet-speed control is unavailable.
5. `New Mission` changes the target. `Retry` does not.
6. Hitting the target with lower launch speed produces more stars than hitting it with higher launch speed on the same mission.
7. Missing the target gives no stars.
8. Crash gives no stars.
9. Success overlay appears after the run resolves, not immediately at contact.
10. Explore mode still supports the old sandbox behavior.

### 15.3 Manual UX Checks

Verify:

1. A first-time user can identify the `Launch` action without guessing.
2. The fuel tank updates while dragging the arrow.
3. The flyby-altitude control is understandable on touch.
4. The game HUD remains readable at mobile width.
5. English and Polish both fit without obvious clipping.

## 16. Notes For The Implementing Agent

Keep this redesign pragmatic.

The main value is not a huge new feature count.

The main value is:

- a stable mission rule set
- a child-readable launch loop
- meaningful fuel-based stars
- removal of accidental cheats

Do not spend the budget on a giant content system before these basics are solid.
