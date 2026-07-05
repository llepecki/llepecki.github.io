# Size-Awareness Review of `starlab.html`

Date: 2026-05-01

Scope: This review looks only at the current [`starlab.html`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html) and focuses on one question: does the app help children understand how dramatically a star's size changes over its life?

## Bottom line

The current version is better than the previous one on the physics side: radius values are more coherent, remnants are more sensible, and some lifecycle fixes are already in place.

But the size teaching is still weak.

The main reason is that the app tries to use one heavily compressed on-canvas size mapping for everything from neutron stars to supergiants. That makes the animation readable, but it does not give children a correct intuition for scale. The visual story is still "everything changes a bit," when the physical story is often "the scale changed by factors of 100, 10,000, or millions."

If the goal is to help kids feel the scale, the current star image should stop carrying the full burden alone. The fix is not just "tune the curve." The fix is to add explicit scale-teaching layers: zoom transitions, comparison objects, orbit-status cues, and a truthful size ruler or comparison panel.

## What is already better

Compared with the previous review, the current file has improved several scientific foundations:

- Photospheric luminosity is now derived from radius and temperature via Stefan-Boltzmann, rather than assigned independently: [`starlab.html:1193`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1193)
- Some short-lived stages now use absolute durations instead of being fixed fractions of total lifetime: [`starlab.html:1404`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1404)
- A `blue_dwarf` stage now exists for the lowest-mass track: [`starlab.html:1273`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1273)
- Neutron-star and black-hole radii are more reasonable than before: [`starlab.html:1341`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1341), [`starlab.html:1349`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1349)

Those fixes help the model. The remaining problem is mainly pedagogical and visual.

## Findings

### S1. Critical: the single display-scale curve still teaches the wrong intuition

Location:

- Display mapping: [`starlab.html:1856`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1856)

Problem:

The app maps physical radius to screen radius with one compressed function:

- logarithmic scaling
- plus a large floor
- plus a capped maximum

That keeps everything visible, but it collapses enormous physical differences into small visual differences.

Concrete examples from the current function:

- Neutron star: `1.5e-5 Rsun`
- White dwarf: `0.01 Rsun`
- Sun-like star: `1 Rsun`
- Giant star: `100 Rsun`
- Earth orbit: `215 Rsun`

Using the current normalized mapping inside `physicalToDisplayRadius`, those become approximately:

- neutron star -> `0.458`
- white dwarf -> `0.563`
- Sun-like star -> `0.743`
- giant (`100 Rsun`) -> `0.909`
- Earth orbit -> `0.935`

What that means pedagogically:

- A white dwarf is physically `100x` smaller in radius than the Sun, but the display function puts it in almost the same visual bucket.
- A `100 Rsun` giant is physically `100x` larger than the Sun, but again only slightly larger on screen.
- From neutron-star scale to Earth-orbit scale, the real radius ratio is about `1.4e7`, while the normalized display ratio is only about `2.0`.

This is the core reason the current animation does not give kids the right feeling for scale.

Required fix:

- Do not rely on one star-disc radius alone to teach physical size.
- Keep the current artistic disc if desired, but pair it with at least one truthful scale encoding.
- Recommended: add a dedicated comparison layer, not just a different curve.

### S2. Critical: the `+ 0.001` term wipes out most remnant-size differences

Location:

- Display mapping formula: [`starlab.html:1863`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1863)

Problem:

The mapping uses:

- `log10(radiusRsun + 0.001)`

This means all objects much smaller than `0.001 Rsun` are forced into nearly the same display region.

That includes:

- neutron stars
- stellar-mass black holes
- any very compact remnant

Why this matters:

Kids should come away with the impression that remnants are unbelievably tiny compared with ordinary stars. The current function instead says: "tiny things are still medium-sized dots."

Required fix:

- Remove the large additive offset as the primary way of keeping small objects visible.
- If visibility is needed, handle it explicitly with:
  - magnified inset views
  - a "zoomed in" badge
  - comparison objects like Earth or Manhattan

Do not hide this inflation inside the main scale function.

### S3. High: the orbit overlays are useful, but they are easy to misread

Location:

- Orbit overlay logic: [`starlab.html:2006`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2006)

Problem:

The orbit rings are one of the best current teaching devices, but the implementation has two issues:

1. They only appear after the star exceeds `30%` of the orbit radius:
   - [`starlab.html:2023`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2023)
2. The orbit radii are themselves passed through the same compressed scale function:
   - [`starlab.html:2025`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2025)

Consequences:

- Earth orbit appears before the star actually reaches Earth orbit.
- The gap between a Sun-sized star and Earth orbit is visually much too small.
- Children may learn "the giant almost reaches Earth when the ring appears," even though the code starts that cue at only `0.3 AU-equivalent` of the ring threshold.

Required fix:

- Distinguish three states explicitly:
  - `safe`
  - `touching / near`
  - `engulfed`
- Do not encode all three states with a single "ring appeared" moment.
- Recommended thresholds:
  - show faint comparison ring any time the giant mode is active
  - use color/text when `radius >= 1.0 * orbitRadius`
  - optionally use "approaching" only when `radius >= 0.8 * orbitRadius`

Better child-facing copy:

- "Still smaller than Mercury's orbit"
- "Now reaches Mercury's orbit"
- "Earth would be inside this star"

### S4. High: the app does not explain that the camera should be zooming in and out by huge amounts

Locations:

- Scale note: [`starlab.html:2457`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2457)
- Main scene composition: [`starlab.html:2499`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2499)

Problem:

The only explicit warning is a faint `Visual size compressed` note.

That is not enough for children. They do not need a disclaimer; they need an explanation.

Right now, when a star becomes a white dwarf or neutron star, the app mainly shows "the circle got smaller." What children need to understand is:

- the star did not just get "a bit smaller"
- the camera would need to zoom in enormously to keep it visible

Required fix:

Add explicit zoom storytelling:

- "Zooming in 100x"
- "Zooming in 10,000x"
- "Zooming out to fit Earth's orbit"

Best implementation pattern:

- When crossing a major scale regime, animate a short camera-zoom transition.
- Show a badge or caption for 1-2 seconds with the zoom factor.
- Keep the visual metaphor honest: the object is visible because we changed the zoom, not because it stayed large.

### S5. High: remnants are still drawn as large hero objects without a magnification explanation

Locations:

- Compact remnants: [`starlab.html:2074`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2074)
- Black-hole visualization: [`starlab.html:2131`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2131)

Problem:

The labels help:

- `Real size: about Earth-sized`
- `Real size: about city-sized`
- `Visualization only`

But the visuals still dominate the screen as if these objects were large on the same scale as the earlier star.

For children, the image usually wins over the caption.

Required fix:

For white dwarfs, neutron stars, and black holes, use a two-part presentation:

1. True-scale marker:
   - a near-dot or tiny marker placed on the scale ruler / comparison strip
2. Magnified portrait:
   - the current artistic remnant rendering
   - clearly labeled `magnified`

This keeps the image exciting without teaching the wrong size.

### S6. Medium: the radius readout is scientifically fine, but not child-friendly

Locations:

- Radius formatting: [`starlab.html:1120`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1120)
- Radius readout: [`starlab.html:2878`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2878)

Problem:

The app currently shows radius mainly as:

- `km`
- `Rsun`

Those are correct units, but not great teaching units for children. Most kids do not have intuition for `0.01 Rsun`.

Required fix:

Keep the scientific radius, but add a second child-facing comparison line based on diameter/width, for example:

- `About Earth-sized`
- `About 11 Earths across`
- `About as wide as Jupiter`
- `About 100 Suns across`
- `Big enough to reach Earth's orbit`

Recommended unit rules:

- very small objects: compare to `Earth`
- gas-giant-like objects: compare to `Jupiter`
- ordinary stars: compare to `Sun`
- giants and supergiants: compare to `Mercury orbit`, `Earth orbit`, `Jupiter orbit`

Children usually understand "how wide" better than "radius."

### S7. Medium: the current scene is trying to do two incompatible jobs at once

Problem:

One canvas is being asked to do both:

1. cinematic storytelling
2. truthful scale education

In astronomy, those goals often conflict. A single frame usually cannot show both object size and distance scales honestly at the same time.

This is a known educational problem, not a bug unique to this app.

Required fix:

Split the experience into two visual layers:

1. `Story View`
   - current dramatic star rendering
   - motion, color, phase identity
2. `Scale View` or `Scale Layer`
   - ruler, comparison objects, orbit status, zoom factor

These can coexist on the same screen, but they should not be encoded by the same disc radius alone.

## Recommended redesign

### Best option: hybrid story + truth design

This is the recommended approach.

Keep the current star artwork, but add a second layer dedicated to scale learning.

The minimal successful version would have four new elements:

1. A vertical or horizontal logarithmic size ruler.
2. A child-friendly comparison sentence.
3. Explicit zoom-change callouts.
4. Exact orbit-status cues.

## Concrete implementation suggestions

### 1. Add a persistent scale ruler

Add a ruler that marks familiar scale anchors, for example:

- `city`
- `Earth`
- `Jupiter`
- `Sun`
- `Mercury orbit`
- `Earth orbit`
- `Jupiter orbit`

Then place a moving marker for the current star radius.

Why this helps:

- The main art can remain expressive.
- The ruler carries the truthful order-of-magnitude lesson.
- Kids can see the marker jump across named landmarks.

This is likely the single highest-value addition.

### 2. Add scale regimes instead of one master curve

Do not try to make one display function cover every scale honestly.

Use piecewise visual regimes:

- `compact regime`
  - remnants
  - compare against Earth / Jupiter
- `stellar regime`
  - main-sequence and modest giant stars
  - compare against the Sun
- `solar-system regime`
  - red giants and supergiants
  - compare against planetary orbits

At each regime switch, tell the user that the camera changed scale.

### 3. Add zoom-change events

When stage changes imply huge radius changes, show a short overlay such as:

- `Zooming out 100x`
- `Zooming out 1,000x`
- `Zooming in 10,000x`

This should happen especially at:

- giant expansion
- planetary-nebula to white-dwarf collapse
- supernova to neutron-star / black-hole remnant

### 4. Add a kid-facing comparison sentence

Add a derived text line near the radius readout, examples:

- `About 100 Earths wide`
- `About as wide as Jupiter`
- `About 2 Suns wide`
- `Would reach past Mercury's orbit`
- `Would engulf Earth`

This should be generated from current `radiusRsun`.

### 5. Make orbit comparisons exact, not approximate

Change the orbit pedagogy from "ring appears at 30%" to explicit status:

- ring visible as a comparison object
- exact crossing state when `radius >= orbitRadius`
- different color/text when engulfed

This is much easier for kids to understand than a generic dashed ring.

### 6. Use a split remnant view

For:

- white dwarfs
- neutron stars
- black holes

show:

- left or background: true-scale marker on ruler / compare strip
- center: magnified artistic view labeled `magnified`

That preserves excitement without sacrificing truth.

### 7. Add a simple "before vs now" size strip

A compact comparison strip could show:

- birth
- now
- final stage

on the same log ruler.

This helps kids see the whole life story at a glance.

## Suggested implementation plan for an AI agent

1. Keep `physicalToDisplayRadius()` only for `Story View`.
2. Add a second size system for `Scale View`, based on a labeled ruler instead of star-disc radius.
3. Add `describeRadiusForKids(radiusRsun)` returning child-facing copy.
4. Add `getOrbitStatus(radiusRsun)` returning `safe`, `near`, `engulfed` for Mercury, Earth, Jupiter.
5. Add `getScaleRegime(radiusRsun)` returning `compact`, `stellar`, `solar_system`.
6. Add `getZoomFactor(prevRadiusRsun, nextRadiusRsun)` for transition overlays.
7. Add remnant inset logic so the central object can be labeled as magnified.

## Example API additions

These are suggestions, not required names:

```js
function getScaleRegime(radiusRsun) {}
function describeRadiusForKids(radiusRsun) {}
function getOrbitStatus(radiusRsun) {}
function drawScaleRuler(cx, top, height, radiusRsun) {}
function drawComparisonStrip(radiusRsun) {}
function drawZoomBadge(factor) {}
```

## Acceptance criteria

The redesign should be considered successful only if all of these are true:

- A white dwarf no longer looks merely "a bit smaller" than a Sun-like star without an explicit magnification explanation.
- A neutron star is presented as dramatically smaller than a white dwarf.
- A red giant clearly communicates that it can reach planetary orbits.
- The app explicitly tells users when the camera scale changed.
- A child can tell, without reading `Rsun`, whether the star is Earth-sized, Jupiter-sized, Sun-sized, or orbit-sized.
- Orbit crossing is communicated as an exact event, not only as an approximate ring appearance.
- The main cinematic star image is no longer the only source of scale information.

## Public sources consulted

- NASA Sun facts: the Sun is about 100 times wider than Earth and about 10 times wider than Jupiter  
  https://science.nasa.gov/sun/facts/

- NASA Solar System Sizes: Earth and Jupiter size anchors; note that planet sizes and distances are often not shown on one scale  
  https://science.nasa.gov/resource/solar-system-sizes/

- NASA Hubble white dwarf page: white dwarfs are smaller than Earth  
  https://science.nasa.gov/missions/hubble/measuring-a-white-dwarf-star/

- NASA Imagine the Universe: neutron stars are about 20 km across, city-sized  
  https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html

- APS Physics summary of astronomy education research: it is hard to show astronomical proportions in one diagram, and students commonly retain scale misconceptions  
  https://physics.aps.org/articles/v11/93

- Kersting et al. (2014), `Conceptualizing astronomical scale`: realistic virtual simulations improve understanding of extreme scales  
  https://www.sciencedirect.com/science/article/pii/S0360131513002534
