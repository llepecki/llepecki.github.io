# Scientific Review of `starlab.html`

Date: 2026-05-01

Scope: This review treats [`starlab.html`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html) as the only source of truth, per request. I did not use any local Markdown files. I only checked the HTML/JS in this file and compared the scientific claims/model choices against public astrophysics sources.

## Bottom line

The current implementation is not scientifically solid enough to present as a physics-based stellar evolution simulator.

The main blockers are:

1. Many displayed `luminosity`, `radius`, and `temperature` values violate the Stefan-Boltzmann relation, so the app often shows mutually inconsistent stellar properties.
2. Several phase durations are wrong by many orders of magnitude because they are hard-coded as fixed fractions of total lifetime.
3. The massive-star lifetime anchors are too short, which breaks the "real star" presets and distorts the whole upper-mass regime.
4. The binary-evolution logic is scientifically misleading: it sends all white-dwarf endings to Type Ia supernovae and gives massive binaries effectively no binary evolution at all.
5. The app labels some end states as uncertain while animating a single deterministic outcome anyway.

If an AI agent is fixing this file, it should treat the current stellar-evolution engine as needing a partial rewrite, not just coefficient tuning.

## Findings

### F1. Critical: displayed `L`, `R`, and `T` are often physically inconsistent

Locations:

- Main property generator: [`starlab.html:1121`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1121)
- Main-sequence scaling: [`starlab.html:1124`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1124)
- Readouts shown to users: [`starlab.html:2654`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2654)

Problem:

The code assigns radius, effective temperature, and luminosity independently for each stage. Those three quantities are not independent for a radiating stellar photosphere. They must satisfy:

`L / Lsun = (R / Rsun)^2 * (T / 5778 K)^4`

The current implementation breaks that relation in many places.

Concrete examples from the current code:

- End of `main_sequence` for a 1 Msun star:
  - code gives `R = 1.4 Rsun`, `T = 4911 K`, `L = 2.5 Lsun`
  - Stefan-Boltzmann with that `R` and `T` gives about `1.02 Lsun`, not `2.5 Lsun`
- `core_collapse_supernova` start:
  - code gives `R = 0.01 Rsun`, `T = 1e9 K`, `L = 1e10 Lsun`
  - Stefan-Boltzmann with that `R` and `T` gives about `9e16 Lsun`
- `planetary_nebula` stage:
  - code values also mismatch by factors of a few to a few tens

Why this matters:

The UI exposes all three numbers to the user as if they were physical outputs. Right now they are often not describing the same object.

Required fix:

- Choose only two independent surface properties at any instant.
- Derive the third from Stefan-Boltzmann.
- Apply that rule consistently for all non-remnant stellar photosphere states.
- If a stage is not well described by a stellar photosphere (`supernova`, `planetary_nebula`, `black_hole`), do not expose the same `temp/radius/luminosity` semantics without stage-specific definitions.

Acceptance test:

- For every displayed state that is meant to represent a stellar surface, require:
  - `abs(log10(L_display / L_SB)) < 0.02`
  - equivalently, within about 5%

### F2. Critical: phase durations are physically wrong because they are fixed fractions of total lifetime

Locations:

- Phase templates: [`starlab.html:833`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:833)
- Duration assignment: [`starlab.html:1351`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1351)

Problem:

Every stage duration is set as `totalLife * frac`. That creates physically impossible timescales for stages whose durations are not roughly fixed fractions of total stellar lifetime.

Examples from the current model:

- `0.12 Msun` protostar:
  - total lifetime from current anchors: about `4.804e13 yr`
  - protostar fraction `0.001`
  - result: protostar lasts about `4.8e10 yr` = `48 billion years`
- `1 Msun` planetary nebula:
  - total lifetime `1e10 yr`
  - PN fraction `0.001`
  - result: PN lasts `1e7 yr` = `10 million years`
- `15 Msun` supernova:
  - total lifetime about `1.427e7 yr`
  - SN fraction `0.003`
  - result: supernova stage lasts about `4.28e4 yr` = `42,800 years`

Why this is wrong:

- Protostar / pre-main-sequence times are much shorter than the main-sequence lifetime and do not scale as a fixed 0.1%-0.3% of total life across the full mass range.
- Planetary nebula visibility is typically about `21,000 +/- 5,000 years`, not millions of years.
- The bright supernova event is observed on timescales of weeks to months, not thousands to tens of thousands of years.

Required fix:

- Replace fixed fractions with stage durations derived from a published stellar-evolution prescription or from a precomputed grid.
- At minimum, separate:
  - pre-main-sequence contraction time
  - core-hydrogen-burning lifetime
  - post-main-sequence burning times
  - transient event durations (`supernova`, `planetary nebula visibility`)
- If the UI needs longer visual dwell time for brief events, keep that purely in playback timing, not in physical age.

Acceptance test:

- `planetary_nebula` physical duration should be in the `~1e4 to few 1e4 yr` regime if the stage means visible nebula.
- `supernova` physical duration should be split:
  - explosion/bright transient: days to years
  - remnant evolution: separate stage with separate semantics
- No protostar stage for a normal star should last longer than the age of the current universe.

### F3. Critical: the high-mass lifetime anchors are too short and break the upper-mass model

Locations:

- Lifetime anchors: [`starlab.html:814`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:814)
- Lifetime interpolation: [`starlab.html:1094`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1094)

Problem:

The anchor table gives:

- `40 Msun -> 1.0e6 yr`
- `100 Msun -> 3.0e5 yr`

Those values are far too short for total stellar lifetimes in the massive-star regime.

Consequences in the current app:

- `90 Msun` total lifetime interpolates to about `3.445e5 yr`
- The Eta Carinae preset uses age `2.5e6 yr` [`starlab.html:969`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:969), which is already far beyond the modeled death time
- So "Start from now" for Eta Carinae is forced to the end of the track instead of an unstable massive-star phase

Why this is wrong:

Modern stellar-evolution models and NASA/ESA educational material place very massive-star lifetimes in the few-million-year range, not a few hundred thousand years.

Required fix:

- Replace the lifetime anchor table with a published mass-lifetime prescription or track interpolation.
- Do not use ad hoc anchors in the massive-star range unless they are rederived from a source.
- Recalibrate all real-star preset ages after the lifetime model is fixed.

Acceptance test:

- No `60-100 Msun` solar-metallicity star should have a total lifetime of only a few `1e5 yr`.
- Eta Carinae "Start from now" must land in a living massive-star state, not in the terminal remnant state.

### F4. High: the app says some endings are uncertain but still animates a single deterministic ending

Locations:

- `8-10 Msun` template: [`starlab.html:878`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:878)
- `20-40 Msun` template: [`starlab.html:904`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:904)
- Uncertainty label in UI: [`starlab.html:2665`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:2665)

Problem:

Two mass ranges are labeled uncertain:

- `8-10 Msun -> "Neutron Star or White Dwarf"`
- `20-40 Msun -> "Neutron Star or Black Hole"`

But the actual tracks are not uncertain:

- `8-10 Msun` always animates `core_collapse_supernova -> neutron_star`
- `20-40 Msun` always animates `core_collapse_supernova -> black_hole`

Why this matters:

The UI claims one thing while the simulation shows another. That is scientifically and pedagogically misleading.

Required fix:

Choose one of these approaches:

1. Deterministic mode:
   - remove the uncertainty wording and commit to a sourced threshold model
2. Explicit uncertainty mode:
   - branch the track into multiple outcomes
   - or keep a single track but stop before the ambiguous remnant and explain that the final fate is model-dependent

Acceptance test:

- If the readout says "uncertain" or "likely", the visualization must not silently show one certain outcome as if it were established.

### F5. High: close-binary white-dwarf logic is scientifically misleading

Locations:

- White-dwarf outcome classes: [`starlab.html:836`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:836), [`starlab.html:846`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:846)
- Binary override: [`starlab.html:1388`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1388)
- Binary info text: [`starlab.html:677`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:677)

Problem:

If `binaryMode === "close"` and the outcome is either `co_white_dwarf` or `he_white_dwarf`, the code always appends a `type_ia_supernova`.

That means:

- every close binary with a CO-white-dwarf ending becomes a Type Ia supernova
- every close binary with a He-white-dwarf ending also becomes a Type Ia supernova

This is not scientifically defensible.

Why this is wrong:

- Type Ia supernovae are not the automatic outcome of "close binary + white dwarf".
- The canonical channels require specific binary configurations and accretion/merger histories.
- The literature treats Type Ia progenitors as special cases, not the default.
- The current code also does not distinguish CO vs He white dwarfs correctly in this branch.

Required fix:

- Do not auto-convert all close-binary WD endpoints into Type Ia.
- At minimum, restrict any Type Ia channel to a separate, explicitly modeled progenitor path.
- If you keep a binary toggle this simple, the honest behavior is:
  - either remove Type Ia from the generic binary toggle
  - or rename the toggle to something like `Type Ia progenitor scenario` so it is no longer pretending to be generic binary evolution

Acceptance test:

- A close binary must not imply Type Ia by default.
- A helium-white-dwarf endpoint must not automatically route to the same Ia path as a carbon-oxygen white dwarf.

### F6. High: close binaries have effectively no effect on massive-star evolution

Location:

- Explicit no-op for massive binaries: [`starlab.html:1415`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1415)

Problem:

The code says:

- close binaries matter a lot for white-dwarf endings
- but for `m >= 10`, "Binary doesn't materially change the massive-star outcome"

This is scientifically backwards. Binary interaction is central to massive-star evolution.

Why this is wrong:

For massive stars, mass transfer, stripping, common-envelope phases, mergers, and binary-driven envelope loss can dominate the evolutionary path and remnant type.

Required fix:

If a realistic massive-binary model is out of scope, do one of these:

1. Remove the generic binary toggle from massive stars.
2. Disable it above a stated mass threshold with an explicit explanation.
3. Add a clearly labeled toy approximation, not a silent no-op.

Acceptance test:

- The UI must not imply that "close binary" is a meaningful scientific control for massive stars if the model ignores it.

### F7. High: real-star presets are not synchronized with the evolution model

Locations:

- Preset data: [`starlab.html:934`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:934)
- Loader: [`starlab.html:1608`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1608)

Problem:

The preset objects contain:

- `currentStageId`
- `futureOutcomeId`
- `ageConfidence`
- `distanceLy`

But those fields are not used anywhere outside the preset definitions.

Observable consequence:

- Betelgeuse and Eta Carinae rely entirely on `mass + age` and the broken lifetime model.
- Eta Carinae's current age exceeds the app's own modeled total lifetime, so it starts at the end state.
- `currentStageId` is present but ignored, so presets can silently contradict their own intended stage.

Required fix:

- After the lifetime/stage model is fixed, make each real-star preset internally consistent.
- Either:
  - derive the age from the chosen current stage and model track, or
  - validate that the supplied age lands in the intended stage
- If a preset cannot be represented well by the simplified model, say so in the UI.

Acceptance test:

- For every real-star preset, `start from now` must place the star in the preset's intended current stage.
- No preset may start past its own modeled death.

### F8. Medium: neutron-star size is too small

Locations:

- Neutron-star radius: [`starlab.html:1271`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1271)
- UI note: [`starlab.html:661`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:661)

Problem:

The code uses:

- `rStart = rEnd = 7e-6 Rsun`

That corresponds to about `4.87 km` radius.

Typical neutron stars are about `20 km` across, i.e. about `10 km` radius, so the code is small by about a factor of 2.

Required fix:

- Use a neutron-star radius of roughly `10-14 km` unless you are modeling mass/radius dependence explicitly.

Acceptance test:

- The readout and internal radius should be in the accepted neutron-star size range.

### F9. Medium: black-hole "radius" is tied to progenitor mass, not remnant mass

Location:

- Black-hole radius: [`starlab.html:1280`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1280)

Problem:

The code uses:

- `r = 4.2e-6 * initial_stellar_mass Rsun`

The coefficient is close to the Schwarzschild radius per solar mass, but the multiplier is the initial stellar mass, not the black-hole remnant mass.

Why this matters:

- A `90 Msun` star is not automatically a `90 Msun` black hole.
- The readout is therefore not even internally representing the remnant the animation claims to show.

Required fix:

- If you show a black-hole radius at all, compute it from an estimated remnant mass, not the birth mass.
- Or do not expose a physical radius for black holes in the generic readout.

### F10. Medium: metallicity control is not physically honest in its current form

Locations:

- Metallicity factor: [`starlab.html:831`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:831)
- Lifetime-only use: [`starlab.html:1095`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1095)

Problem:

The "metallicity" control only multiplies total lifetime by:

- low: `1.15`
- solar: `1.0`
- high: `0.9`

It does not change:

- the stage path
- temperatures
- radii
- luminosities
- mass loss
- remnant outcome

Why this is misleading:

Metallicity affects much more than a flat lifetime rescaling, especially for massive stars where winds and stripping matter strongly.

Required fix:

- Either remove/hide the control until it has a model behind it
- or relabel it clearly as a simple toy lifetime modifier

### F11. Medium: the very-low-mass single-star path omits the expected blue-dwarf transition

Location:

- Low-mass template: [`starlab.html:835`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:835)

Problem:

The `0.08-0.25 Msun` path is:

- `protostar -> red_dwarf_main_sequence -> white_dwarf`

That skips the expected late blue-dwarf-like phase usually discussed for the long-term evolution of the lowest-mass hydrogen-burning stars.

Why this matters:

For a simulator explicitly about how stars live and die, this is one of the few genuinely distinctive outcomes in the very-low-mass regime.

Required fix:

- Add an intermediate late-stage low-mass branch before the white-dwarf remnant
- or explicitly disclose that this part is collapsed into a simplified end-stage

## Recommended repair strategy

Do the fixes in this order:

1. Replace the lifetime/stage engine.
2. Make stage durations physically meaningful in absolute years.
3. Make `L`, `R`, `T` self-consistent.
4. Repair real-star presets against the new model.
5. Redesign or narrow the binary toggle.
6. Revisit remnant sizes and readout semantics.

## Strong recommendation for the replacement model

The easiest scientifically defensible path is:

1. Use a published rapid stellar-evolution prescription or published track table interpolation as the one source for:
   - lifetime
   - stage boundaries
   - remnant outcome
   - mass/metallicity dependence
2. Keep the current canvas/UX, but treat the physics engine as data-driven.
3. Derive user-visible properties from the model consistently.

Good sources to base the rewrite on are in the references section below.

## Minimal acceptance checklist for the fixing agent

- The Sun preset at `4.6 Gyr` is on the main sequence.
- Proxima Centauri at `4.85 Gyr` is not a protostar.
- Betelgeuse "start from now" is in a late massive-star phase, not the main sequence unless justified by the model.
- Eta Carinae "start from now" is a living unstable massive star, not already a black hole.
- No user-visible `supernova` phase lasts thousands of years unless relabeled as remnant evolution.
- No `planetary_nebula` phase lasts millions of years.
- Every stellar-surface state satisfies Stefan-Boltzmann within tolerance.
- "Uncertain" endings are not visualized as certain endings.
- Massive-star binary mode is either modeled honestly or disabled honestly.

## Public sources consulted

These are the external sources used to evaluate the physics/model choices:

- Hurley, Pols, Tout (2000), "Comprehensive analytic formulae for stellar evolution as a function of mass and metallicity"  
  https://academic.oup.com/mnras/article/315/3/543/972062

- Tout, Pols, Eggleton, Han (1996), "Zero-age main-sequence radii and luminosities as analytic functions of mass and metallicity"  
  https://academic.oup.com/mnras/article/281/1/257/1066409

- Eker et al. (2018), "Interrelated main-sequence mass-luminosity, mass-radius, and mass-effective temperature relations"  
  https://academic.oup.com/mnras/article-abstract/479/4/5491/5056185

- Ekstrom et al. (2012), Geneva rotating stellar models at solar metallicity  
  https://www.aanda.org/articles/aa/full_html/2012/01/aa17751-11/aa17751-11.html

- Jacob, Schonberner, Steffen (2013), planetary-nebula visibility times  
  https://www.aanda.org/articles/aa/full_html/2013/10/aa21532-13/aa21532-13.html

- Sana et al. (2012), "Binary interaction dominates the evolution of massive stars"  
  https://pubmed.ncbi.nlm.nih.gov/22837522/

- Piersanti, Tornambe, Yungelson (2014), He-accreting white dwarfs: accretion regimes and final outcomes  
  https://academic.oup.com/mnras/article/445/3/3239/1041977

- Wang, Podsiadlowski, Han (2017), He-accreting CO white dwarfs and Type Ia supernovae  
  https://academic.oup.com/mnras/article/472/2/1593/4094897

- NASA Science, "Stars"  
  https://science.nasa.gov/universe/stars/

- NASA Science, AG Carinae / luminous blue variable lifetime context  
  https://science.nasa.gov/image-detail/ag-carinae/

- NASA Science, Type Ia supernovae overview  
  https://science.nasa.gov/mission/roman-space-telescope/type-ia-supernovae/

- NASA Hubble, SN 1006 remnant page for observed supernova visibility timescale  
  https://science.nasa.gov/asset/hubble/sn-1006-supernova-remnant-hubble/

- NASA Imagine the Universe, neutron-star size overview  
  https://imagine.gsfc.nasa.gov/science/objects/neutron_stars1.html

- MNRAS snippet on helium-core white dwarfs in binaries / isolated low-mass evolution exceeding a Hubble time  
  https://academic.oup.com/mnras/article/382/2/779/1029674

- ESO Supernova educational page on low-mass-star evolution (blue-dwarf path for the lowest masses)  
  https://supernova.eso.org/exhibition/images/0409-evolution-of-stars-individual-paths-4/
