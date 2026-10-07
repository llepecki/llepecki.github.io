# Orbit & Free Fall: Scientific Review

Review date: 2026-10-07.
Status: review complete for the identified snapshot; findings require reconciliation with subsequent edits, then correction or verified closure.
Scope: mathematics, physics, English/Polish terminology, and the explanation of weightlessness in [the implemented app](../index.html).
Related documents: [requirements](req.md), [design and dictionary](design.md), [recorded style decisions](style-drift.md).

Reviewed application SHA-256:

```text
4ba10c0126e4153e34260a855df23c75d47c78634ca22deec42359cb573ce8f7
```

Source locations below refer to that snapshot; use the named functions and translation keys when line numbers change. This document records a review, not completed fixes. No application code was changed during the review.

The application changed again while this document was being prepared. Those later edits have not been scientifically re-reviewed here. Before making fixes, reproduce each finding against the current source and identify any already resolved issues. Preserve newer intentional changes; do not revert to the reviewed snapshot.

## Verdict

The core Newtonian model is sound within its stated approximations. The app needs targeted corrections to explanations, quantity labels, and the teaching interaction, not a physics rewrite.

| Question                                                | Assessment                                                                                                                                          |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Are the mathematics and physics correct?                | The core equations and tested motion are correct. There is a minor classification mismatch at the exact surface-grazing boundary.                   |
| Is the terminology correct?                             | Mostly. The engine readout confuses acceleration with force, and several explanations or announcements do not match the current state.              |
| Does it clearly explain why astronauts feel weightless? | Partly. The correct evidence is present, but the complete causal explanation is hidden and the default engine demonstration is too fast to observe. |

Confidence is high in the mathematical assessment because source inspection, existing tests, and independent numerical checks agree. Teaching recommendations are an expert assessment, not results from a usability study with children.

## Scientific basis and correct behavior to preserve

The implementation uses gravitational acceleration `g(r) = -mu * r / |r|³`, with the circular and escape speeds computed from the actual center distance. Gravity supplies the inward acceleration for a circular orbit; there is no second outward force balancing it in the Earth-centered inertial model. The relationships agree with [OpenStax: Satellite Orbits and Energy](https://openstax.org/books/university-physics-volume-1/pages/13-4-satellite-orbits-and-energy).

Using the app's constants, the initial 400 km altitude gives:

| Quantity                                  |               Verified value |
| ----------------------------------------- | ---------------------------: |
| Local gravitational acceleration          |                8.694250 m/s² |
| Fraction of the model's surface gravity   |                   88.533897% |
| Circular speed                            |             7.672598588 km/s |
| Circular period                           |            92.414252 minutes |
| Escape speed                              |            10.850692982 km/s |
| Lower-ellipse altitude range at 7.64 km/s | Approximately 286.138–400 km |

Weightlessness does not require weak or absent gravity. The station and its freely floating occupants accelerate together under gravity, so the cabin does not need to support them against their fall. This agrees with [NASA: What Is Microgravity?](https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-microgravity-grades-5-8/) and the distinction between gravitational force and apparent weight in [OpenStax: Gravitation Near Earth's Surface](https://openstax.org/books/university-physics-volume-1/pages/13-2-gravitation-near-earths-surface).

Preserve these correct implementation behaviors:

- A freely floating astronaut has zero wall push during circular, elliptical, escape, and direct-fall motion before contact.
- Engines accelerate the station, not the loose astronaut directly. A wall pushes the astronaut only after contact.
- After early engine cutoff, the astronaut retains their relative velocity until contact changes it.
- When an engine stops while an astronaut is supported, sustained wall push becomes zero. Touching a wall does not necessarily mean being pressed against it.
- Gravity persists on escape trajectories. A demonstration endpoint is not an edge where gravity disappears.
- Camera changes do not alter physical state, and Earth and trajectories share an isotropic spatial scale within each view.

The small-cabin approximation treats gravitational acceleration as uniform across the cabin. Omitting tidal gradients, cabin air currents, atmospheric drag, and rotational dynamics is acceptable for this teaching model when those limitations remain disclosed. The fixed-attitude cabin and simplified inelastic contact model must not be presented as a complete ISS or human-body simulation. [ESA's ISS reboost demonstration](https://www.esa.int/ESA_Multimedia/Videos/2022/04/ISS_Reboost_Cosmic_Kiss) provides a real-world comparison for the station moving relative to freely floating occupants.

## Findings and requested corrections

### 1. Make the cabin engine demonstration observable

Priority: high for teaching effectiveness. Type: interaction problem, not an incorrect equation.

Evidence: the default playback rate is 120×, and `startThrust()` preserves it. A centered astronaut reaches the first wall in approximately `sqrt(2 * 1.7 / 0.5) = 2.60768` simulated seconds, or **21.73 milliseconds at 120×**. The interval with an active engine and no wall push is therefore almost invisible. At narrow phone widths, the stacked layout also separates the cabin from the hold-to-fire controls, requiring scrolling away from the result being demonstrated.

Source: `freefall/index.html`, initial state near line 2162, `startThrust()` near line 2960, and the cabin/control layout. The mobile issue was identified through rendered screenshots; it is not a child-user test result.

Requested correction:

- Provide an explicit, readily discoverable way to watch the cabin demonstration at 1×, next to the cabin. Explain why 1× helps.
- Preserve the current hold-to-fire engine interaction and its ability to operate at the selected playback rate. Do not silently restore the superseded four-second pulse or force all existing engine commands to 1×.
- Keep the cabin, relevant state explanation, and wall-force result visible while operating the teaching controls on narrow screens. Local controls or a suitable sticky layout are implementation options; use the smallest change that meets the visibility requirement.
- Keep one physical clock. A 1× teaching action must select 1× for the entire simulation, not slow only the astronaut animation.
- Do not teleport the astronaut or reset the orbit as a hidden side effect. Retain an explicitly labeled astronaut-reset action where needed.

Acceptance: in EN and PL, at 320×568 and 390×844, a learner can start a centered-astronaut demonstration, hold either engine, watch relative motion before contact, and see wall push become nonzero, without releasing the engine to scroll to the cabin. At 1×, the initial fixed-strength contact occurs near 2.608 seconds. Existing selected-rate burns, release-to-stop behavior, and pause/focus-loss safety remain functional.

### 2. Put the complete explanation of weightlessness beside the astronaut

Priority: medium. Type: teaching recommendation.

Evidence: the normal cabin caption is “The station and the astronaut fall together.” This is correct, but the explanation linking shared free fall to the absence of a supporting push is inside collapsed help. The visible 8.69 m/s² and 0.00 N readings are valuable evidence, but children should not have to infer the entire connection from those numbers.

Source: `cabinExplanationKey()` near line 5069; `explainFallingTogether`, `explainGravityPresent`, and `whyBody`.

Requested correction: show a short causal explanation beside the unpowered, freely floating astronaut. Separate the reason for feeling weightless from the reason for avoiding Earth. Candidate bilingual copy:

**English:**

> Gravity still pulls the astronaut toward Earth. The station falls with them, so its floor does not need to hold them up. With no supporting push from the floor, they feel weightless. Moving sideways fast enough keeps both falling around Earth instead of hitting it.

**Polish:**

> Grawitacja nadal przyciąga astronautę ku Ziemi. Stacja spada razem z nim, więc jej podłoga nie musi go podtrzymywać. Bez nacisku podłogi astronauta czuje nieważkość. Dzięki odpowiednio szybkiemu ruchowi w bok stacja i astronauta spadają wokół Ziemi, zamiast w nią uderzyć.

The first three sentences explain weightlessness. Show the final orbit sentence only where appropriate; a direct fall also produces weightlessness but does not avoid impact. During thrust and wall contact, retain explanations matching the actual contact state instead of saying nothing pushes the astronaut.

Acceptance: the default unpowered lesson visibly connects nonzero gravity, shared acceleration, absence of support, and weightlessness without opening help. Direct fall does not claim to miss Earth. Engine-on/free and engine-on/contact states remain distinct. The explanation fits and wraps in both languages at the required viewports.

### 3. Select explanations using the actual trajectory and scenario

Priority: medium. Type: confirmed content defect.

Evidence:

- Selecting **Lower ellipse** correctly produces approximately 286–400 km altitude, but “More physics” displays “More speed here makes a higher oval orbit.” The Polish version has the same error. `updateReadouts()` selects `explainHigherEllipse` for every elliptical classification.
- Selecting **Drop straight down** adds “An escape path has no farthest point from Earth,” because `hintNoApogee` is also selected for radial motion. The statement about escape is true, but it is irrelevant to the current bound direct fall.

Source: `updateReadouts()` near lines 5356–5366; `explainHigherEllipse`, `explainLowerEllipse`, and `hintNoApogee`.

Requested correction: use the initial scenario or a justified orbital comparison for lower/higher explanations. For arbitrary post-burn ellipses, prefer a neutral explanation of varying altitude and speed rather than inferring “more speed here” from the word “elliptical.” Give radial fall its own explanation of unavailable orbital readouts. Do not relabel a negative-energy radial fall as escape.

Acceptance: exercise every preset in EN and PL, plus ellipses created by acceleration and braking. Each explanation must agree with the numeric trajectory. The lower ellipse must never receive the higher-ellipse causal sentence, and radial fall must not receive escape-only help.

### 4. Distinguish force, acceleration, and speed in labels

Priority: medium. Type: terminology defect; the underlying calculations are correct.

Evidence: the engine readout labeled “Engine push” / “Siła od silnika” displays `m/s²`. The Polish wording explicitly calls this a force. The displayed quantity is acceleration, whereas the astronaut's wall-push readout correctly uses newtons. The English HUD also labels a scalar speed value “Velocity,” despite the glossary distinguishing speed from velocity.

Source: `lblEngineAccel` near line 1094, its translation assignment near line 4981, `hudVelocityLabel` near line 897, and `updateReadouts()`.

Requested correction:

- Label the acceleration readout **Engine acceleration** / **Przyspieszenie od silników**.
- Retain **Wall push on astronaut** / **Nacisk ściany na astronautę** for the force in N.
- Label the English HUD scalar **Speed**; Polish **Prędkość** remains appropriate for the numeric control/readout. Preserve the correct glossary distinction.
- Do not rename a velocity-vector legend to speed if it describes the full vector. Split translation keys where numeric readouts and arrow labels have different meanings.
- Check the expanded wall-push value in `g`: it is support acceleration divided by standard gravity, not a force measured in newtons. Label it accordingly rather than implying N and g are the same physical quantity.

Acceptance: inspect the readouts at zero thrust, 0.5 m/s² thrust, wall contact, and after cutoff in both languages. Unit/quantity pairs and accessible names must agree. At initial approximately wall-normal 0.5 m/s² support, a 70 kg astronaut experiences approximately 35 N, equivalent to about 0.051 standard g of support acceleration.

### 5. Correct the engine-cutoff playback announcement

Priority: low. Type: confirmed state-reporting defect.

Evidence: releasing an engine at 120× produces “The engine is off. Playback continues at 1×.” The actual rate remains 120×. The same hard-coded assumption exists in Polish.

Source: `announceEngineCutoff` near lines 1647 and 2027; `stopThrust()` near line 2824.

Requested correction: use the actual playback rate through a localized placeholder, or remove the rate from this announcement. Keep the separate pause/engine-off announcement for operations that stop playback.

Acceptance: release engines at 1×, 120×, and 600× in both languages. The announcement must match the selected rate and running state. Pausing must not announce continued playback.

### 6. State the domain of the circular-orbit equation

Priority: medium. Type: scientific presentation defect.

Evidence: “More physics” displays `v² / r = GM / r²` without an explicit circular-orbit qualification. The equation is correct for an unpowered circular orbit, not for general elliptical or powered motion. The nearby statement that speed stays the same also needs this qualification.

Source: `buildDetails()` near line 4797 and `explainCircleAcceleration`.

Requested correction: add a heading such as **For a circular orbit with engines off** / **Dla orbity kołowej przy wyłączonych silnikach**. Define `r` as distance from Earth's center and make clear that gravity supplies the inward acceleration; this is not a balance between gravity and a second force. Scope the constant-speed statement to the same case.

Acceptance: inspect the notes for circular, elliptical, radial, escape, and powered states. General reference material may remain visible, but it must not assert that the current noncircular trajectory obeys the circular relation or has constant speed.

### 7. Align prediction and collision classification at surface grazing

Priority: low. Type: confirmed numerical boundary defect.

Evidence: an independently computed tangential surface-grazing start at approximately 7.554931770 km/s was classified as an ellipse clearing Earth. Its computed perigee was `6,371,000.000000002 m`, only about two nanometers above the adopted radius. Integration nevertheless reached the surface and stopped at approximately 2650.5006 seconds. This is a floating-point boundary inconsistency, not a meaningful error in the normal orbit calculations.

Source: `classifyState()` near line 2392, the `perigee <= R_EARTH` branch near line 2426, `conicPath()`, and `stepWithSurface()`.

Requested correction: introduce a documented, physically negligible surface tolerance and use compatible boundary semantics for classification, prediction, and event detection. Do not fix this by rounding solver state, moving trajectories, or widening the tolerance enough to consume genuinely nonintersecting paths.

Acceptance: test the analytic grazing speed and clearly intersecting/nonintersecting cases on either side. Equality counts as contact. Forecast and actual flight must agree within the documented spatial/time tolerance. Preserve the existing 7.55 km/s impact and 7.56 km/s surface-clearing cases.

### 8. Identify the exaggerated engine setting clearly

Priority: medium for transparency. Type: model-disclosure recommendation, not an algebraic error.

Evidence: the hold ramp reaches `THRUST_MAX = 300 m/s²` after approximately 9.46 seconds of real holding. This is approximately **30.59 standard g**. An idealized 70 kg occupant supported against that acceleration has a resultant support force of approximately 21,000 N. The general help says the engines do not reproduce ISS hardware, but that limitation should be apparent where the strong setting is used.

Source: engine constants near line 2075, `thrustMagnitude()`, `advanceThrottle()`, and `explainEngineModel`.

Requested correction: visibly identify high-power burns as exaggerated experiment settings, not representative ISS maneuvers. Explain that the ramp follows real holding time while the burn duration follows the selected simulation rate. Preserve the intentional hold/ramp behavior unless a separate change is approved. Do not imply that body response, injury, or station structural behavior is simulated.

Acceptance: long holds at each supported playback rate show an accurate, localized model notice. The gentle 1× teaching path remains readily accessible. No displayed statement promises that a particular real holding duration has the same orbital effect at every playback rate.

## Verification record

These results belong to the review, before fixes:

| Check                                     | Result                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing physics/state suite              | 176/176 passed; rerun on the final reviewed source snapshot                                                                                       |
| Existing browser/layout suite             | 547/547 passed during the review; rendered EN/PL desktop and mobile screenshots inspected                                                         |
| Repository code-review gate               | Zero findings                                                                                                                                     |
| Independent direct-fall solution          | Analytic impact time approximately 300.325775222410 s; numerical result agreed within about 2e-11 s                                               |
| Independent circular quarter-period check | Position error below one micrometer in this test                                                                                                  |
| Independent conservation sampling         | Across seven initial speeds from 7.56 to 12.00 km/s, maximum sampled relative energy drift about 1.3e-12 and angular-momentum drift about 1.9e-14 |
| Independent cabin checks                  | Correct initial relative acceleration, continued drift after cutoff, and zero sustained force after unpowered contact                             |
| Independent content/state checks          | Reproduced lower-ellipse wording in both languages, radial-fall help, and the incorrect cutoff-rate announcement                                  |
| Independent grazing check                 | Reproduced forecast-versus-impact inconsistency described in finding 7                                                                            |

These numerical observations are not universal error bounds. Passing the existing suites does not close the findings: some tests verify the present interaction choices without checking whether they communicate the lesson accurately. A cosmetic source edit occurred during the early review; the final-source hash above identifies the snapshot used for the independent reproductions and repeated physics suite. Rerun browser checks after the fixes.

## Implementation boundaries and completion criteria

- Read this review with the living design, requirements, dictionary, and recorded implementation decisions. Do not restore superseded design paragraphs merely because they describe an older interaction.
- Preserve the self-contained app, its theme, nonrotating camera, astronaut representation, existing presets, hold-to-fire controls, and shared physical clock.
- Reconcile findings 1–8 with the latest source, then address remaining issues through targeted changes. For an already fixed finding, verify and record the evidence instead of applying the fix again. Preserve the correct model behaviors listed above. Raise a substantial change to the physics model or established interactions before implementing it.
- Update both languages, accessible names, announcements, the design dictionary, and affected documentation together. Avoid introducing English-only explanatory strings.
- Extend the existing [physics/state checks](../../tools/freefall-physics-check.mjs) and [browser/layout checks](../../tools/freefall-layout-check.mjs) with regressions for these findings. Do not weaken existing checks simply to obtain a passing result.
- Verify on the existing desktop/mobile viewport matrix, including 320×568 and 390×844, and with keyboard operation. A screenshot or a test-count total alone does not prove that the cabin and controls can be observed together while an engine is held.
- Preserve unrelated work. Do not stage files or create commits.

From `learn/`, run:

```sh
rtk npm run freefall-physics-check
rtk npm run freefall-layout-check
rtk npm run code-review -- freefall/index.html
```

After implementation, append a dated resolution record to this review. For each finding, record the change, evidence, and status; do not erase the original observations or mark a finding resolved before its acceptance checks pass. Report any blocked, failed, or unperformed checks explicitly. No fix or post-fix verification is recorded yet.
