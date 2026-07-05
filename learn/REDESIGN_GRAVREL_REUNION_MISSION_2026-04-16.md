# Redesign Brief for `gravrel.html`: Reunion Mission / Twin-Aging Scenario

Date: 2026-04-16

Purpose:
- Replace the current route-bending sandbox with a clearer kid-facing scenario that teaches the intended lesson:
  - two same-age pilots leave Earth,
  - one spends mission time in weak gravity,
  - one spends mission time near a black hole,
  - they reunite on Earth,
  - their ages differ.

This document is written for the implementing agent and is intended to be sufficient for a full redesign of `gravrel.html`.

---

## 1. Primary design decision

The new app should be a **reunion mission** simulator, not a route editor.

Remove the current core interaction:
- no route bending
- no draggable control points
- no multiple black holes
- no route-length competition

Replace it with a fixed story:
- Captain A flies from Earth to a **reference science site** near a selected star
- Captain B flies from Earth to a **science site near a selected black hole**
- both cruise out at the same speed over the same mission distance
- both spend a science phase away from Earth
- both return to Earth at the same speed over the same mission distance
- the app compares their ages at reunion on Earth

This is the correct story shape for the lesson.

---

## 2. Scientific decision on the “science time” challenge

### Default mode: use a fixed Earth-reference science duration

The science phase should be defined by a preset amount of **Earth mission time**, not by a preset amount of each captain’s own proper time.

Example:
- “Mission Control schedules 5.0 Earth years of science at each destination.”

Why this should be the default:
- It keeps the reunion event simple and synchronized.
- It directly teaches the intended lesson:
  - over the same Earth time, a clock deeper in gravity accumulates less proper time.
- It makes the age difference visible in the most intuitive way for children.

### Do **not** make “same captain lab time” the default

If each captain must spend the same amount of **their own** time doing science, then:
- during the science phase, they age by the same amount **by construction**
- the black-hole pilot still ends up younger at reunion only because more Earth time passes before that pilot finishes the same local-duration task
- the other pilot may return earlier and then wait on Earth

That scenario is scientifically valid, but it teaches a different, more subtle lesson:
- “the same local experiment takes longer from Earth’s point of view near a black hole”

That is a good **advanced mode**, but it is not the clearest primary lesson for kids.

### Required product decision

Implement:
- default mode: `Fixed Earth Mission Time`
- optional advanced mode: `Fixed Local Experiment Time`

The advanced mode should be hidden behind an “Advanced” toggle or omitted entirely in the first redesign pass.

---

## 3. Recommended scenario

### Visual story

Canvas layout:
- Earth at left center
- selected star at upper right
- selected black hole at lower right
- two fixed mission tracks of equal length from Earth:
  - Earth -> Star Lab
  - Earth -> Black-Hole Lab

Important:
- the two destination sites must be placed at equal mission distance from Earth on the canvas
- the app must no longer use the real distance from the star list for physics

### What the star selection means

The selected star is **for theme / fun / labeling**, not for the core timing physics.

Recommended interpretation:
- Captain A goes to a **reference lab near the selected star**
- that lab is treated as a weak-gravity reference site with clock rate effectively equal to Earth for this lesson

This keeps the selected star fun and visible without turning the lesson into stellar-gravity modeling.

### What the black-hole selection means

The selected black hole provides:
- name
- fact text
- mass metadata
- visual identity

Important scientific note:
- at fixed `u = r / r_s`, Schwarzschild gravitational time dilation depends on `u`, not directly on black-hole mass
- therefore black-hole choice **alone** should not be presented as the sole control for the age gap

Required control:
- add a separate control for **science-site distance from the black hole**
- express it as `r / r_s`

Recommended UI wording:
- `Science Distance from BH`
- values like `1.3 r_s`, `1.5 r_s`, `2 r_s`, `3 r_s`, `5 r_s`, `10 r_s`

If the product wants black-hole choice itself to affect the age gap visibly:
- use different **default** `r / r_s` presets per black hole
- or later add a tidal-force safety model

Do not imply:
- “bigger black hole always means more time dilation” at the same `r / r_s`

That would be false.

---

## 4. Physics model for the redesign

## 4.1 Overall model choice

Use a **scientifically honest teaching model** with:
- exact special relativity for the cruise legs
- exact single-Schwarzschild black-hole factor for the black-hole science phase
- a weak-gravity reference approximation for the star-side science phase

Do **not** claim the whole app is an exact full-GR mission simulator.

Allowed wording:
- “This lesson uses exact relativistic clock formulas for the simplified mission phases below.”
- “The mission geometry is idealized to isolate the aging effect.”

Do not use:
- “exact simulator”
- “exact general relativity model” for the whole app

## 4.2 Mission phases

Default mission timeline:

1. Outbound cruise
- both captains leave Earth at the same moment
- same cruise speed `beta`
- same one-way mission distance `D`

2. Science phase
- Captain A stays at the Star Lab for `T_science_earth`
- Captain B stays at the Black-Hole Lab for the same `T_science_earth`

3. Return cruise
- same cruise speed `beta`
- same one-way mission distance `D`

4. Reunion on Earth
- compare:
  - Earth elapsed time
  - Captain A elapsed time
  - Captain B elapsed time
  - age difference

## 4.3 Cruise physics

Use identical cruise physics for both captains.

In units where `c = 1 ly/yr`:
- `gamma = 1 / sqrt(1 - beta^2)`
- one-way Earth-frame cruise time:
  - `t_cruise = D / beta`
- one-way captain proper cruise time:
  - `tau_cruise = t_cruise / gamma`

Because both captains have the same cruise speed and same cruise distance:
- the cruise contribution is equal for both
- the age difference comes from the science phase

This is deliberate and good for teaching.

## 4.4 Science-phase physics: default mode

### Captain A: Star Lab

Treat the Star Lab as a weak-gravity reference site.

Default approximation:
- `d tau_A / dt = 1`

This means:
- Captain A ages at essentially the Earth rate during the science phase

This approximation is acceptable because:
- the star side is not the focus of the lesson
- the selected star is for theme/fun
- the lesson is about strong-field gravitational time dilation near a black hole

### Captain B: Black-Hole Lab

Default recommendation:
- use a **hover / station-keeping science platform** at fixed Schwarzschild radius `r`
- define `u = r / r_s`
- require `u > 1`

Then:
- `g(u) = sqrt(1 - 1/u)`
- `d tau_B / dt = g(u)`

This is the cleanest way to teach the core gravitational effect.

Important copy requirement:
- explicitly say the Black-Hole Lab is held in place with engines / station-keeping
- do not describe this as free orbit

Recommended safe UI range for hover mode:
- `u_min = 1.3`
- `u_max = 10`

This gives a clear visible effect while staying outside the horizon.

## 4.5 Total elapsed times in default mode

Earth total:
- `T_earth_total = 2 * t_cruise + T_science_earth`

Captain A total:
- `T_A_total = 2 * tau_cruise + T_science_earth`

Captain B total:
- `T_B_total = 2 * tau_cruise + T_science_earth * g(u)`

Age difference at reunion:
- `Delta_age = T_A_total - T_B_total`
- therefore:
  - `Delta_age = T_science_earth * (1 - g(u))`

This is excellent pedagogically:
- same cruise
- same Earth science window
- only the black-hole station rate changes the age gap

## 4.6 Optional advanced mode: fixed local experiment time

Only implement this if there is time after the default redesign is done.

Input:
- `T_science_local`

Then:
- Captain A science Earth time:
  - `t_A_science = T_science_local`
- Captain B science Earth time:
  - `t_B_science = T_science_local / g(u)`

If both captains leave as soon as their own local science timer finishes:
- Captain A returns to Earth earlier
- Captain A then waits on Earth until Captain B returns
- that extra waiting time is part of Captain A’s aging before the reunion event

This mode is valid, but it teaches:
- “the same local task takes longer from Earth’s point of view near a black hole”

It should not be the default.

---

## 5. Should the app show loops around the star / black hole?

### Default answer: no real loops in the primary mode

Do not make “same number of loops” part of the model.

Reason:
- equal loop count is not a fair physical requirement
- loop period depends on radius and gravity
- it confuses the lesson

### What to do instead

In the default mode:
- Captain A docks or hovers at the Star Lab
- Captain B hovers at the Black-Hole Lab
- show animated scanning beams, rotating lab rings, or instrument pulses
- make the science phase visually rich without making orbital count the governing variable

### If orbit visuals are still desired

You may animate small motion around each lab for visual interest, but:
- do not claim that the number of loops is what defines the mission
- do not tie mission fairness to equal loop count

### Optional future advanced mode: real circular orbit

If a later version wants true orbits:
- orbit mode must be separate from hover mode
- for a Schwarzschild circular geodesic around the black hole:
  - only allow `u >= 3`
  - stable orbits require `u >= 3`
  - proper-time rate relative to Earth coordinate time:
    - `d tau / dt = sqrt(1 - 3/(2u))`

This mode is more complex and usually gives a weaker, less intuitive effect than hover mode.

Recommendation:
- do not implement orbit mode in the first redesign pass

---

## 6. UI redesign requirements

## 6.1 New title and framing

Recommended page title:
- `Black Hole Reunion Mission`
- or
- `Twin Mission: Gravity and Aging`

Subtitle:
- “Two captains leave Earth together. One works near a black hole. Who is younger when they reunite?”

## 6.2 Controls to keep

Keep:
- captain names
- ship names if desired
- launch / pause / reset
- speed control
- language toggle

## 6.3 Controls to remove

Remove:
- route dragging
- route straighten buttons
- clear control points
- black-hole count selector
- route warnings
- route length readouts
- minimum-distance-to-BH readouts

## 6.4 New controls to add

Required:
- `Reference Star`
  - selected from the existing star list
  - name/fact only
- `Black Hole`
  - selected from the black-hole catalog
- `Cruise Speed`
  - `beta`
- `Mission Distance`
  - one-way distance `D`
  - same for both captains
- `Science Time (Earth)`
  - `T_science_earth`
- `BH Science Distance`
  - `u = r / r_s`

Optional advanced:
- `Science Timing Mode`
  - `Fixed Earth Mission Time` (default)
  - `Fixed Local Experiment Time` (advanced)
- `Science Phase Type`
  - `Hover / Station-Keeping` (default)
  - `Orbit` (advanced, later)

## 6.5 Readouts

Primary readouts:
- `Earth elapsed`
- `Captain A elapsed`
- `Captain B elapsed`
- `Age difference at reunion`

Secondary readouts:
- `Cruise gamma`
- `BH clock rate g`
- `BH science distance: u = r / r_s`
- `Mission phase: Outbound / Science / Return / Reunion`

Kid-facing live sentence:
- “For every 1.00 year on Earth, Captain B experiences 0.58 years at this black-hole station.”

## 6.6 Map / scene

Required visual layout:
- Earth at left center
- Star Lab at upper right
- Black-Hole Lab at lower right
- symmetric mission geometry

Map note:
- canvas is schematic, not to scale
- do not display star distance in light-years from the current star list
- if `Mission Distance` is displayed, it is the lesson’s chosen one-way cruise distance, equal for both pilots

---

## 7. Copy requirements

## 7.1 Core explanatory text

The app should explicitly say:
- both captains leave Earth together
- both cruise the same distance at the same speed
- both return the same way
- the difference comes from how fast their clocks run during the science phase

Recommended default text:

> Both captains start the same age on Earth. They fly the same distance at the same speed. Captain A works at a reference lab in weak gravity. Captain B works near a black hole, where clocks run more slowly. When they come back to Earth, Captain B has aged less.

## 7.2 Hover-mode honesty text

Required:

> The black-hole lab is held at a fixed distance by station-keeping engines. This is not a free orbit.

## 7.3 Star-side honesty text

Required:

> The selected star is used as a weak-gravity reference stop for comparison. Its own time-dilation effect is neglected in this lesson.

## 7.4 Timing-mode text

Default mode:

> Science time is scheduled by Earth mission control. Both captains work away from Earth for the same Earth-measured duration.

Advanced mode:

> In this mode, each captain performs the same amount of local lab time. Near the black hole, that same local lab time takes longer from Earth’s point of view.

---

## 8. Recommended implementation architecture

## 8.1 Replace route physics with phase physics

The current app computes timings by integrating along hand-drawn routes.

Replace that with a fixed timeline model.

Suggested state shape:

```javascript
state = {
  lang: 'en' | 'pl',
  phase: 'idle' | 'outbound' | 'science' | 'return' | 'complete' | 'paused',

  starIndex: 0,
  blackHoleIndex: 0,

  betaCruise: 0.5,
  missionDistance: 4.0,        // one-way ly, same for both
  scienceDurationEarth: 5.0,   // default mode input
  scienceDurationLocal: 5.0,   // advanced mode input
  scienceTimingMode: 'earth',  // 'earth' | 'local'
  scienceMode: 'hover',        // default; optional later 'orbit'
  uBh: 1.5,                    // r / r_s

  timeline: null,

  earthElapsed: 0,
  captainAElapsed: 0,
  captainBElapsed: 0,
}
```

## 8.2 Build a mission timeline once per parameter change

When inputs change:
- compute all phase durations
- compute all proper-time rates
- build a timeline object

Suggested derived quantities:

```javascript
gamma = 1 / Math.sqrt(1 - betaCruise * betaCruise)
tCruise = missionDistance / betaCruise
tauCruise = tCruise / gamma
gBh = Math.sqrt(1 - 1 / uBh)
```

Default mode totals:

```javascript
earthTotal = 2 * tCruise + scienceDurationEarth
aTotal = 2 * tauCruise + scienceDurationEarth
bTotal = 2 * tauCruise + scienceDurationEarth * gBh
```

## 8.3 Animate by phase, not by route integral

Animation should be piecewise:

Outbound:
- both ships move from Earth to their destinations
- both clocks advance at `1 / gamma` relative to Earth

Science:
- ships remain at destination labs
- Captain A clock advances at `1`
- Captain B clock advances at `gBh`

Return:
- both ships move back to Earth
- both clocks advance at `1 / gamma`

Complete:
- stop movement
- show reunion summary

## 8.4 Reuse from current file

Can be reused:
- canvas setup
- background starfield
- captain/ship naming panel
- speed bar widget
- language toggling infrastructure
- overlay summary pattern
- black-hole catalog and fact display
- star list for names

Should be removed or replaced:
- Catmull-Rom spline route system
- route control points
- route resampling
- route-integral timing code
- route invalidation / safety logic
- multi-BH logic
- “mission route length” UI

---

## 9. Numerical sanity-check example

Use this to verify the implementation.

Parameters:
- `beta = 0.50`
- `D = 4.0 ly` one way
- `T_science_earth = 5.0 yr`
- `u = 1.5`

Then:
- `gamma = 1.154700538...`
- `g = sqrt(1 - 1/1.5) = 0.577350269...`
- `t_cruise = 4.0 / 0.5 = 8.0 yr`
- `tau_cruise = 8.0 / gamma = 6.928203230... yr`

Totals:
- `Earth total = 2*8.0 + 5.0 = 21.0 yr`
- `Captain A total = 2*6.928203230 + 5.0 = 18.856406461 yr`
- `Captain B total = 2*6.928203230 + 5.0*0.577350269 = 16.743157806 yr`
- `Age difference = 2.113248654 yr`

Expected interpretation:
- both captains lost the same amount of time during cruise because their cruise legs were identical
- Captain B lost additional time during the science phase because the black-hole clock rate was slower

If the implementation does not reproduce these numbers to normal UI precision, the phase formulas are wrong.

---

## 10. Optional advanced mode example

This is for the optional `Fixed Local Experiment Time` mode.

Parameters:
- same `beta = 0.50`
- same `D = 4.0 ly`
- `T_science_local = 5.0 yr`
- same `u = 1.5`

Then:
- `g = 0.577350269...`
- Captain A science Earth time:
  - `t_A_science = 5.0 yr`
- Captain B science Earth time:
  - `t_B_science = 5.0 / g = 8.660254038 yr`

If the reunion comparison is done when Captain B finally returns:
- Captain A returns earlier and then waits on Earth
- that waiting time contributes to Captain A’s final age at reunion

Result:
- this mode is valid
- but it teaches a more advanced lesson
- therefore it must not replace the default mode

---

## 11. Acceptance criteria for the redesign

The redesign is acceptable when all of the following are true:

1. The primary story is a reunion-on-Earth comparison, not a route race.
2. The default lesson uses a fixed Earth-reference science duration.
3. Route bending and multiple black holes are gone.
4. The star selection is clearly framed as theme / reference stop, not literal mission-distance physics.
5. The black-hole science effect is controlled by `r / r_s`, not by misleading visual radii.
6. The app does not claim that black-hole mass alone determines stronger time dilation at the same `r / r_s`.
7. Hover mode explicitly states station-keeping / not free orbit.
8. If orbit mode is later added, it is advanced, separate, and not based on “same number of loops”.
9. The main output is:
   - Earth elapsed
   - Captain A elapsed
   - Captain B elapsed
   - age difference at reunion
10. The numerical sanity-check example in Section 9 matches.

---

## 12. Recommended product wording

Use this as the design intent:

> This app is about reunion aging, not path drawing. The child should immediately understand that both captains started equal, lived through different gravitational environments, and came back different ages.

If there is a tradeoff between:
- preserving old route-editing mechanics
- and making the aging lesson obvious

choose the second.

---

## 13. Sources / scientific basis

Core formulas and concepts are based on standard Schwarzschild time-dilation results:

- Einstein Online glossary:
  - https://www.einstein-online.info/en/essentials/dictionary/
- Einstein Online on gravitational redshift / clock rates:
  - https://www.einstein-online.info/en/explandict/redshift-gravitational/
- Piotr T. Chruściel, *The Schwarzschild Metric*:
  - https://link.springer.com/chapter/10.1007/978-3-030-28416-9_3

The redesign intentionally uses:
- exact SR cruise timing
- exact single-BH Schwarzschild clock-rate formulas for the simplified science phase
- explicit teaching idealizations for mission geometry

---

End of brief.
