# Scientific Review: `timerel.html`

Review date: 2026-04-14

Scope: review the scientific accuracy of the time-dilation explanation and the star-description content in `timerel.html`.

## Executive summary

The relativistic core of `timerel.html` is mostly sound. The Lorentz-factor logic and the 1g proper-acceleration model are scientifically defensible teaching simplifications, and the app clearly separates physical distance from the compressed on-screen star layout.

The main scientific problems are in the explanatory layer:

- the text sometimes describes the selected cruise speed and selected `gamma` as if they are physically reached, even when the trip is too short for that in the implemented acceleration model;
- the turnaround text says the clocks are paused, but the live display actually advances both clocks during turnaround at an arbitrary equal rate;
- two astronomy fact cards contain materially false statements;
- several multiple-star entries blur together system-level labels and single-star numerical properties.

## Method

- Read `timerel.html` directly, including the star dataset, explanatory strings, and timing code.
- Checked whether the explanatory text matches the implemented kinematics.
- Checked the astronomy text for obvious factual errors and internal ambiguity.
- Ran local numerical checks for short-trip cases where the ship cannot reach the user-selected top speed.

## Findings

### 1. Selected `gamma` is presented as physically reached even when the model does not reach that speed

Severity: High

Locations:

- `timerel.html:515-516`
- `timerel.html:875-899`
- `timerel.html:1353-1364`
- `timerel.html:1411-1412`

What is wrong:

The idle explanatory text says the rocket accelerates to the selected cruise speed, cruises, then decelerates. That is not always what the implemented model does. In `recalcPhysics()`, if the destination is too close, the ship accelerates only until the midpoint and then immediately decelerates, never reaching the selected `beta`.

The app partly acknowledges this in the idle readout by showing `betaActual` with `(max)` for short trips. But the explanatory copy still talks about the selected `gamma`, and during flight the info text inserts `state.gamma` rather than the actual reached value.

Concrete example:

- For Proxima Centauri at `4.24 ly`, the model can only reach about `0.9495c` with `gamma ~ 3.188` before it must start decelerating.
- That means selecting `0.99c` or `0.9999c` produces the same physically reached peak speed for that route.
- The current text still encourages the learner to interpret the selected `gamma` as the real cruise factor.

Why this matters:

This is not just a simplification. It becomes scientifically false for short routes, because the explanation no longer matches the implemented motion.

Recommended fix:

- Rewrite the explanatory text so it says the ship accelerates up to the selected speed only if there is enough distance.
- When there is not enough distance, say explicitly that the ship reaches a lower maximum speed.
- During animation, display the actual current or actual maximum `gamma`, not the selected target `gamma`, in the live explanatory text.

### 2. The turnaround explanation contradicts the code, and the live turnaround clock behavior is non-physical

Severity: Medium

Locations:

- `timerel.html:517`
- `timerel.html:1377-1380`
- `timerel.html:1661-1689`

What is wrong:

The text says the clocks are paused during turnaround. That is not what the code does. During turnaround, the code increments both `earthElapsed` and `rocketElapsed` by the same arbitrary amount:

- `turnaroundTickRate = 0.02`
- `state.earthElapsed += tickAmount`
- `state.rocketElapsed += tickAmount`

So the display is not paused, and the added time is not derived from the relativistic trip model. It is just decorative equal-rate ticking tied to animation time.

Important nuance:

- This extra turnaround ticking does not survive into the final trip totals, because once the return leg resumes, `updateElapsedFromProgress()` recomputes elapsed time from progress and overwrites it.
- So the defect is mainly in the live display and the scientific honesty of the text, not in the final summary totals.

Why this matters:

The current state tells the learner one thing and shows another. That is a scientific communication defect even if the final totals remain correct.

Recommended fix:

Choose one honest approach:

1. Truly pause both clocks during turnaround.
2. Or keep both clocks ticking equally during a decorative stop, but then say that clearly in the text.

### 3. Proxima Centauri is not "visible only from the Southern Hemisphere"

Severity: Medium

Locations:

- `timerel.html:375`
- `timerel.html:378`

What is wrong:

The Proxima fact card says it is visible only from the Southern Hemisphere. That is false.

Inference from source data:

- Proxima Centauri has declination about `-62 deg` in SIMBAD.
- A star at that declination is visible from latitudes south of about `+27 deg`.
- That includes part of the Northern Hemisphere, not just the Southern Hemisphere.

Recommended fix:

Replace the claim with something like:

- "Best seen from southern latitudes"
- or "Not visible from most of the Northern Hemisphere"

That would be accurate without overcomplicating it for learners.

### 4. The Capella card incorrectly says no telescope on Earth can split the bright pair apart

Severity: Medium

Locations:

- `timerel.html:407`
- `timerel.html:410`

What is wrong:

The Capella card says the two giant stars orbit so closely that no telescope on Earth can split them apart. That is outdated and false. Capella has been resolved from Earth by optical interferometry; it was in fact one of the early showcase targets for this technique.

Why this matters:

This is a direct factual error, not a simplification.

Recommended fix:

Replace the sentence with a version that distinguishes ordinary telescopes from interferometers, for example:

- "The two bright giant stars are too close for ordinary telescopes to separate cleanly, but optical interferometers have resolved them."

### 5. Several multiple-star cards mix system-level labels with single-value properties

Severity: Low

Locations:

- `timerel.html:384`
- `timerel.html:417`
- `timerel.html:439`

What is wrong:

Some cards identify a system with multiple stars, but then present one set of mass, size, temperature, and luminosity values without saying what those numbers refer to.

Examples:

- Sirius is labeled as "Blue-white main sequence + white dwarf".
- Algol is labeled as an eclipsing binary.
- Polaris is labeled as a three-star system.

But each still shows a single numerical block, which a learner could reasonably read as describing the whole system rather than the main visible star.

Why this matters:

This is not a hard factual error if the values were intended for the primary star, but the presentation is scientifically ambiguous.

Recommended fix:

- Label the values explicitly as belonging to the primary star.
- Or provide obviously system-level quantities only when the whole system is being described.

## Presentation and scientific communication remarks

These are not mechanics bugs, but they are included because they affect scientific clarity and what learners are likely to understand incorrectly.

### P1. The app does not clearly distinguish apparent brightness from intrinsic luminosity

Severity: Medium

Locations:

- `timerel.html:382`
- `timerel.html:459-462`
- `timerel.html:511`
- `timerel.html:1752`

What is wrong:

The cards mix statements about how bright a star looks in our sky with a stat labeled `Luminosity`, but the difference is never explained.

Examples:

- Sirius is described as the brightest star in the night sky.
- Deneb is described as extremely distant yet still very bright.
- The stat panel separately shows `Luminosity`, which is an intrinsic property, not the same thing as how bright a star appears to us.

Why this matters:

A learner can easily leave with the false intuition that the brightest-looking star must also produce the most total light. In reality, distance is part of that story.

Recommended fix:

- Rename the stat to something more explicit, such as `Luminosity (energy output)`.
- Add one short note somewhere in the star facts UI that apparent brightness depends on both luminosity and distance.

## What appears scientifically sound

The following parts did not show a scientific problem in this review:

- The Lorentz-factor formula in `timerel.html:876`.
- The proper-acceleration relations used in `timerel.html:878-905`.
- The piecewise elapsed-time update in `timerel.html:908-949`.
- The use of true star distances for timing while compressing only the visual x-position in `timerel.html:957-963`.

In short: the current issues are mostly in scientific wording, state-dependent explanation, and a few astronomy fact claims, not in the main relativity math.

## Additional presentation issues that affect scientific understanding

### P2. `Size` is too vague for a science-facing stat label

Severity: Low

Locations:

- `timerel.html:511`
- `timerel.html:556`
- `timerel.html:1750`

What is wrong:

The overlay presents stellar `size` in units of the Sun, but does not say whether this means radius or diameter.

Why this matters:

For a child-facing educational app, a vague label creates avoidable confusion. In astronomy, radius is the standard comparison here, so the label should say that.

Recommended fix:

- Change `Size` to `Radius`.
- If desired, use `Radius (Sun = 1)` or equivalent bilingual wording.

### P3. The `Find it` instructions are presented too universally

Severity: Low

Locations:

- `timerel.html:386`
- `timerel.html:397`
- `timerel.html:430`
- `timerel.html:441`
- `timerel.html:452`
- `timerel.html:463`

What is wrong:

The `Find it` text often assumes a season, hemisphere, and viewing orientation without saying so. Phrases like `downward and to the left` are especially frame-dependent.

Why this matters:

These are not scientific falsehoods in the same sense as the Proxima and Capella issues, but they are weak observational guidance because they silently assume a viewing context.

Recommended fix:

- Prefer descriptions tied to constellations and season.
- Avoid left/right directions unless the viewing orientation is stated.
- When relevant, mention northern or southern visibility explicitly.

### P4. Uncertainty and approximation are communicated inconsistently

Severity: Low

Locations:

- `timerel.html:373`
- `timerel.html:395`
- `timerel.html:428`
- `timerel.html:450`
- `timerel.html:461`
- `timerel.html:1128`

What is wrong:

Some values are presented with `~`, some as ranges, and some as apparently exact values. The visual language of certainty is not very consistent across the star dataset.

Why this matters:

That inconsistency teaches the wrong epistemic lesson: it makes some uncertain astrophysical quantities look more settled than they really are, while others are visibly marked as approximate.

Recommended fix:

- Apply one consistent convention for uncertain stellar properties.
- Use `~` or short ranges wherever the app is intentionally simplifying or where the public values vary substantially by source.

### P5. The star-facts overlay weakens the link between the astronomy card and the relativity lesson

Severity: Low

Locations:

- `timerel.html:1128`
- `timerel.html:1745-1755`

What is wrong:

The main scene shows the star distance, but the educational overlay does not repeat it. The overlay focuses on star facts while omitting the one quantity that actually drives the time-dilation result in this simulator.

Why this matters:

The app’s teaching goal is not just astronomy trivia. It is the connection between real star distance and relativistic travel time. Omitting distance from the fact overlay weakens that connection.

Recommended fix:

- Include distance inside the star-facts overlay.
- If the distance is approximate, mark it there too, not only on the canvas label.

## Recommended priority order

1. Fix the short-route speed and `gamma` explanation.
2. Fix the turnaround text and turnaround live-clock behavior so they agree.
3. Correct the Proxima and Capella fact cards.
4. Clarify brightness vs luminosity and which properties refer to a primary star versus an entire system.
5. Improve stat labels, uncertainty language, and the observational guidance in the star cards.

## External references used

- Proxima Centauri SIMBAD entry:
  - https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Proxima+Centauri&submit=submit+id
- COAST / Capella interferometric imaging:
  - https://lambda.gsfc.nasa.gov/product/websites/AMI/mrao.cam.ac.uk/telescopes/coast/coast.first.html
