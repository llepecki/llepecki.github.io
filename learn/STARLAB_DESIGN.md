# Star Lab: Design Brief

Reference interaction/style baseline: `timerel.html`, `gravrel.html`

Target file: `starlab.html`

Project implementation baseline:

- single self-contained HTML file in `learn/`
- bilingual English / Polish
- same general structure as the existing learn apps in this folder
- dark space theme, canvas on the left, control panel on the right, no runtime dependencies beyond Google Fonts
- central visualization must remain readable on desktop and mobile
- no network access at runtime; all science data used by the app must be embedded locally

## 1. Purpose

This app teaches children how stars live and die.

The user should be able to:

- create a custom star by setting scientifically meaningful parameters,
- load a real star preset,
- fast-forward through the star's life,
- watch the star change in size, color, and behavior,
- see when major life stages happen on a time axis at the bottom of the view area,
- learn how the star is likely to end: white dwarf, neutron star, black hole, or (in a binary branch) Type Ia supernova.

The app is not a professional stellar-evolution tool. It is a kid-friendly simulator with scientifically defensible phase ordering, rough timescales, and end-state logic.

## 2. Scientific Decisions To Lock In

These points should drive the implementation.

### 2.1 Which input parameters matter most

The science sources are consistent on this:

- `initial mass` is the main driver of a star's lifetime and end state,
- `metallicity / composition` is a secondary modifier,
- `close companion / binary interaction` can strongly alter the ending for some stars,
- more massive stars live much shorter lives than low-mass stars.

Therefore the app should expose:

1. `Initial mass` as the primary always-visible input.
2. `Metallicity` as an advanced input.
3. `Binary interaction` as an advanced input.

Do not expose surface temperature, radius, or luminosity as primary user inputs. Those should be derived outputs of the selected track.

### 2.2 Important terminology rule

Do not present `red dwarf` as an end-of-life remnant.

A red dwarf is a long-lived low-mass main-sequence star. Its eventual remnant is still a white dwarf. Child-facing copy must say this clearly.

### 2.3 What counts as the "end" of the life in this app

The timeline should end when the star reaches its first long-lived remnant or terminal explosion result:

- white dwarf,
- neutron star,
- black hole,
- Type Ia supernova with no remnant left behind.

Optional epilogue text may mention that white dwarfs cool further toward a theoretical black dwarf, but that should not be the main playable endpoint.

### 2.4 Science simplification policy

Use a `classroom model`, not a research-grade solver.

- The app should use precomputed simplified tracks.
- The app should not solve full stellar structure equations in the browser.
- Near fuzzy thresholds, use child-friendly wording like `likely ending` instead of pretending the boundary is exact.

## 3. Parameters The User Should Be Able To Set

### 3.1 Required visible control: Initial mass

Control:

- logarithmic slider
- range: `0.1` to `100` `Msun`
- default: `1.0 Msun`
- fine-step buttons: `-` / `+`
- quick preset chips:
  - `Tiny red dwarf`
  - `Sun-like`
  - `Bright white star`
  - `Blue giant`
  - `Monster star`

Why:

- the scientific sources consistently identify mass as the dominant factor in stellar lifetime and fate,
- stellar lifetimes span from millions to trillions of years, so a log slider is required for usable control.

Notes:

- Do not allow values below `0.08 Msun` in star mode; below that is brown-dwarf territory, not a true star.
- Use labels like `0.12 Msun`, `1.00 Msun`, `15 Msun`.

### 3.2 Advanced control: Metallicity

Control:

- segmented control, not a free numeric field
- options:
  - `Low metals`
  - `Sun-like`
  - `High metals`
- default: `Sun-like`

Suggested internal mapping:

- `Low metals` -> `[Fe/H] = -1.0`
- `Sun-like` -> `[Fe/H] = 0.0`
- `High metals` -> `[Fe/H] = +0.3`

Why:

- composition affects stellar evolution tracks and lifetime,
- a three-state control is enough for a children's app,
- a raw metallicity slider adds complexity without much educational gain.

Behavior:

- metallicity should gently shift lifetime and the black-hole / neutron-star threshold,
- do not let metallicity overpower mass in the UI narrative.

### 3.3 Advanced control: Binary interaction

Control:

- segmented control
- options:
  - `Single star`
  - `Close binary`
- default: `Single star`

Why:

- nearby companions can exchange mass and radically change the ending,
- the most important alternate branch for this app is the Type Ia white-dwarf supernova path.

Behavior:

- in `Single star` mode, use ordinary single-star evolution,
- in `Close binary` mode, allow a white-dwarf path to branch into accretion and Type Ia supernova when scientifically appropriate,
- if the selected mass is so high that the binary toggle would not materially change the end state, keep the toggle visible but explain that the primary still dies as a core-collapse object.

### 3.4 Real star preset loading

Control:

- mode toggle: `Custom Star` / `Real Star`
- in `Real Star` mode show a dropdown of bundled presets
- default real-star preset: `Sun`

Required behavior:

- selecting a real star populates mass, current stage, age estimate if known, and notes,
- the user can choose `Start from birth` or `Start from now`,
- when `Start from now` is used, the timeline should show a `Now` marker,
- if the real star age is uncertain, mark it as `approx`.

## 4. End States And Scenario Logic

The app needs both `science-facing logic` and `child-facing labels`.

### 4.1 Child-facing end scenarios to support

The app should be able to show these endings:

- `White dwarf`
- `Planetary nebula + white dwarf`
- `Core-collapse supernova -> neutron star`
- `Core-collapse supernova -> black hole`
- `Type Ia supernova` in close-binary mode

Optional late-epilogue labels:

- `Cooling white dwarf`
- `Theoretical black dwarf far in the future`

Do not make the optional epilogues the main ending scenes.

### 4.2 Recommended classroom mass bins

These bins are acceptable for v1 as long as the UI calls fuzzy cases `likely`.

| Initial mass | Default single-star path | Main child-facing ending | Confidence note |
| --- | --- | --- | --- |
| `0.08-0.25 Msun` | protostar -> red dwarf -> very slow fade | helium-rich white dwarf | very long future, far beyond current universe age |
| `0.25-8 Msun` | protostar -> main sequence -> red giant -> planetary nebula | carbon-oxygen white dwarf | strong |
| `8-10 Msun` | heavy star borderline path | heavy white dwarf or electron-capture supernova | fuzzy, mark as `borderline` |
| `10-20 Msun` | massive star -> supergiant -> core collapse | neutron star | strong enough for classroom use |
| `20-40 Msun` | very massive star -> supergiant / stripped star -> collapse | neutron star or black hole | metallicity and mass loss matter |
| `>40 Msun` | very massive unstable star -> collapse | black hole | use `likely black hole` wording |

### 4.3 Binary branch rule

If `Close binary` is selected and the star's ordinary single-star track would end as a white dwarf:

- the app may show an alternate route where the white dwarf steals matter,
- if the accreted remnant crosses the Chandrasekhar limit, the ending becomes `Type Ia supernova`,
- this branch should end with `no white dwarf remnant left`.

### 4.4 Important uncertainty rule

Do not hard-code a fake certainty in the `8-10 Msun` and `20-40 Msun` bands.

Implementation rule:

- use `likely ending` labels in those bands,
- show a small note that mass loss and composition matter,
- reserve firm wording for the clearly separated low-mass and very-low-mass cases.

## 5. Lifetime Model

### 5.1 Recommended source model

Best approach:

- prepare a small embedded track table derived offline from MIST-like stellar tracks,
- keep only the fields needed by the app,
- embed the reduced JSON directly in `starlab.html`.

Why:

- MIST covers the right mass range,
- it includes metallicity dependence,
- it is far more defensible than inventing arbitrary phase durations in JavaScript.

### 5.2 Fallback if the implementing agent does not precompute tracks

If no offline preprocessing is done, use anchor-point interpolation.

Use log-log interpolation between science-backed anchor lifetimes such as:

- `0.33 Msun -> about 14 trillion years`
- `0.5 Msun -> about 56 billion years`
- `0.8 Msun -> about 17 billion years`
- `1.1 Msun -> about 8 billion years`
- `1.7 Msun -> about 3 billion years`
- `3.5 Msun -> about 440 million years`
- `18 Msun -> about 11 million years`
- `40 Msun -> about 1 million years`

Then allocate phases by class:

- very low mass stars: almost all time in main sequence,
- Sun-like and intermediate stars: most time in main sequence, short giant and asymptotic giant phases,
- massive stars: short main sequence, then fast giant / supergiant evolution,
- terminal events: very short in physical time, but visually expanded in playback.

### 5.3 Stage list to support

Tracks do not all need all stages, but the engine should support these IDs:

- `protostar`
- `main_sequence`
- `red_dwarf_main_sequence`
- `subgiant`
- `red_giant`
- `helium_burning`
- `asymptotic_giant_branch`
- `planetary_nebula`
- `white_dwarf`
- `unstable_massive_star`
- `red_supergiant`
- `blue_supergiant`
- `stripped_hot_star`
- `core_collapse_supernova`
- `type_ia_supernova`
- `neutron_star`
- `black_hole`

## 6. Timeline Design

The bottom time axis is mandatory and must be a core teaching tool, not decoration.

### 6.1 Timeline structure

Place a dedicated timeline band inside the canvas area along the bottom edge.

Requirements:

- height: about `90-110px`
- semi-transparent panel so it reads against the starfield
- colored phase segments
- moving age marker
- stage labels
- exact age labels at major boundaries
- `Now` marker in real-star mode when the age estimate is available

### 6.2 Timeline scale

Do not use a simple linear time axis.

Reason:

- lifetimes range from about `10^6` to more than `10^13` years,
- a linear axis would make late dramatic phases unreadable.

Required solution:

- use a clearly labeled `compressed timeline`,
- give every major stage a minimum visible width,
- distribute the remaining width using log-duration weighting,
- label the actual ages so the user still sees the true timescale.

This is the most practical compromise for a children's app.

### 6.3 Age units

Auto-format ages using:

- `kyr`
- `Myr`
- `Gyr`
- `Tyr`

Tooltip or info text should explain that `Tyr` means trillion years.

### 6.4 Timeline endpoint rule

The endpoint should be the formation of the first stable remnant, not infinite cooling.

Examples:

- Sun-like star: stop when the white dwarf is revealed,
- Betelgeuse-like star: stop when the neutron star is revealed after the supernova,
- monster star: stop when the black hole scene settles,
- Type Ia route: stop after the explosion and debris fade.

## 7. Visual Design

### 7.1 Overall layout

Use the same high-level structure already established in the repo:

- header at top,
- large canvas area on the left,
- `300px` control column on the right,
- mobile layout stacks controls below the canvas.

Suggested title:

- `Star Lab`
- subtitle: `How stars live and die`

### 7.2 Main canvas composition

The star must dominate the center.

Recommended composition:

- star centered around `45%` of canvas width and `42%` of canvas height,
- starfield background,
- subtle science-HUD overlays,
- timeline panel at the bottom,
- data card in a corner,
- optional phase label near the star.

### 7.3 Visual scale rule for the star

This is critical.

True stellar size differences are too extreme for literal rendering. A white dwarf, red giant, neutron star, and black hole cannot all be shown to scale in one viewport and remain legible.

Required rule:

- use `display scale`, not literal physical scale,
- keep the star large enough in every phase to remain readable,
- preserve monotonic growth/shrink behavior,
- explicitly say that the visual size is compressed.

Implementation guidance:

- define a `physicalRadiusRsun`,
- transform it to a `displayRadiusPx` with a non-linear mapping,
- clamp the display radius to a readable min and max.

Suggested mapping behavior:

- minimum visible remnant radius: about `24-30px`,
- ordinary main-sequence stars: about `40-90px`,
- giants / supergiants: may expand toward `25-40%` of canvas height,
- if a red supergiant would exceed the frame, let the edge crop and show orbit reference rings rather than shrinking it too much.

### 7.4 Orbit reference overlays for giant phases

When the star becomes very large:

- overlay orbit rings labeled `Mercury`, `Earth`, `Jupiter` when appropriate,
- fade these in only in giant / supergiant stages,
- this gives children an intuitive sense of scale even when the star itself is visually compressed.

This is especially important for Betelgeuse-like stars.

### 7.5 Remnant rendering rules

White dwarf:

- small bright blue-white core,
- faint residual shell if just after planetary nebula,
- label that the real object is Earth-sized but visually enlarged.

Neutron star:

- very small intense core,
- optional narrow beam sweep or pulse ring,
- label that the real object is city-sized.

Black hole:

- dark central disk,
- bright accretion ring or lensing halo,
- surrounding starfield distortion is fine if subtle,
- label that this is a visualization, not literal visible-light photography.

### 7.6 Explosion rendering rules

Supernova scenes should be short, dramatic, and readable.

- flash and expanding shell,
- slow down playback automatically during the explosion,
- do not leave the canvas as a featureless white screen,
- after the flash, reveal the remnant clearly.

## 8. Interaction Model

### 8.1 Required controls

Always visible:

- mode toggle: `Custom Star` / `Real Star`
- mass control or real-star dropdown
- play / pause
- `Next phase`
- reset
- playback speed

Advanced collapsible section:

- metallicity
- binary interaction

### 8.2 Playback behavior

The app should not try to play literal time uniformly.

Required behavior:

- long quiet phases are compressed heavily,
- major transitions are slowed so the user can see them,
- `Next phase` jumps to the next important stage boundary,
- `Play` in story mode should complete a full life in about `18-30` real seconds.

Suggested speeds:

- `Story`
- `Fast`
- `Turbo`

`Turbo` may skip smoothly across quiet periods but must still linger on terminal transitions.

### 8.3 Start modes

Custom Star:

- default start point is `birth`

Real Star:

- default start point is `now`
- secondary action: `rewind to birth`

This makes real stars immediately interesting while still allowing the full life story.

## 9. Real Star Presets

### 9.1 Mandatory v1 presets

These should ship in v1 because they cover the main learning cases and are easy to explain.

| Preset | Data to store | Starting scene | Expected ending |
| --- | --- | --- | --- |
| `Sun` | `mass=1.0 Msun`, `age~4.6 Gyr`, `stage=main_sequence`, `metallicity=sun-like` | yellow main-sequence star | red giant -> planetary nebula -> white dwarf |
| `Proxima Centauri` | `mass~0.12 Msun`, `distance~4.24 ly`, `stage=red_dwarf_main_sequence` | dim red dwarf | eventual white dwarf after trillions of years |
| `Betelgeuse` | `mass~15 Msun`, `age~10 Myr`, `distance~700 ly`, `stage=red_supergiant` | giant orange-red swollen star near end | likely core-collapse supernova -> neutron star |
| `Eta Carinae A` | `mass~90 Msun`, `binary=true`, `distance~8000 ly`, `stage=unstable_massive_star` | unstable extremely massive star | likely black-hole-forming collapse |

### 9.2 Optional expansion presets

Good candidates for a larger catalog:

- `Barnard's Star`
- `Sirius A`
- `Vega`
- `Polaris A`
- `Rigel`

These are optional because they require a more carefully curated parameter sheet than the mandatory set above.

### 9.3 Real-star data schema

Each preset should include at least:

```js
{
  id: "sun",
  nameEn: "Sun",
  namePl: "Slonce",
  massMsun: 1.0,
  metallicityMode: "solar",
  binaryMode: "single",
  ageYears: 4.6e9,
  ageConfidence: "high",
  distanceLy: 0,
  currentStageId: "main_sequence",
  futureOutcomeId: "co_white_dwarf",
  blurbEn: "...",
  blurbPl: "...",
  sources: ["..."]
}
```

If `ageYears` is not known well enough:

- set `ageYears: null`,
- keep `currentStageId`,
- hide the exact `Now` pin and use a softer `current stage` marker instead.

## 10. Data Model For The Simulation

### 10.1 Track object

Use embedded track data, not scattered formulas.

```js
{
  id: "solar_like_1p0",
  minMassMsun: 0.9,
  maxMassMsun: 1.1,
  metallicityMode: "solar",
  binaryMode: "single",
  likelyOutcomeId: "co_white_dwarf",
  stages: [
    {
      id: "protostar",
      ageStart: 0,
      ageEnd: 3e7,
      radiusRsunStart: 3.0,
      radiusRsunEnd: 1.2,
      tempKStart: 3500,
      tempKEnd: 5800,
      luminosityLsunStart: 0.5,
      luminosityLsunEnd: 1.0,
      visualMode: "contracting_cloud"
    }
  ]
}
```

### 10.2 Derived values to compute at runtime

For the currently selected time:

- current age
- normalized stage progress
- current phase label
- current radius
- current temperature
- current luminosity
- current display radius
- age remaining to ending
- likely final state

### 10.3 Readouts to show in the UI

Required:

- `Current phase`
- `Current age`
- `Initial mass`
- `Likely ending`
- `Surface temperature`
- `Radius`

Nice to have:

- `Luminosity`
- `Time left`
- `Core fuel now`

## 11. Educational Copy Rules

Keep the tone simple and vivid, but scientifically correct.

Good patterns:

- `Small stars sip their fuel slowly. Big stars burn through it fast.`
- `This star will likely end as a white dwarf.`
- `This ending is uncertain because stars near this mass can lose different amounts of material.`

Must explain:

- blue stars are hotter than red stars,
- big stars usually live shorter lives,
- planetary nebulae have nothing to do with planets,
- white dwarfs are still stellar remnants, not normal shining stars,
- red dwarfs are long-lived small stars, not the final remnant.

## 12. UX Details Worth Keeping

These details will make the app feel consistent with the rest of the repo.

- use `Outfit` for UI and `Share Tech Mono` for values and labels
- dark background, strong glow effects, restrained UI chrome
- no generic flat background; use layered starfield and soft nebula gradients
- the app should feel like a lab instrument, not a toy dashboard
- hover is optional only; all interactions must work on touch

## 13. What Not To Do

- Do not use a linear lifetime axis.
- Do not render stars at true size across all phases.
- Do not teach that `red dwarf` is the ending.
- Do not make metallicity a bigger factor than mass in the interface.
- Do not promise exact outcomes in fuzzy threshold bands.
- Do not fetch live science data at runtime.
- Do not force the user to wait through a realistic main-sequence timescale.

## 14. Acceptance Criteria

The implementation is good enough when all of these are true.

### Science acceptance

- Increasing initial mass always shortens the star's lifetime.
- The Sun track ends as a white dwarf, not a supernova.
- Proxima Centauri stays a red dwarf for an extremely long time and does not explode.
- Betelgeuse starts near the end of its life and ends in a core-collapse scene.
- Very massive stars can end as black holes.
- Binary mode can create a Type Ia path for white-dwarf-ending stars.

### UX acceptance

- The star always stays readable in the center during every phase.
- The time axis is always visible at the bottom of the view area.
- The user can jump between phases without losing context.
- A real star can be loaded from a preset with one action.
- The app remains usable on a narrow mobile screen.

### Communication acceptance

- The app explicitly labels uncertain endings as `likely`.
- The app explicitly labels the timeline as compressed.
- The app explicitly distinguishes current star type from final remnant.

## 15. Recommended Source Use In The Codebase

The final app should include a short `Sources` or `Scientific model` text block in the info panel or at the bottom of the file comments, but it does not need to show long citations on screen.

The real-star dataset objects should include their source URLs so future revisions can audit them.

## 16. Scientific References Used For This Design

Primary and near-primary references used to shape this brief:

- NASA Science, `Types of Stars`  
  https://science.nasa.gov/universe/stars/types/
- NASA Science, `Types of Black Holes`  
  https://science.nasa.gov/universe/black-holes/types/
- NASA Science, `Stellar Explosions`  
  https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-stellar-explosions/
- NASA Science, `What is Betelgeuse? Inside the Strange, Volatile Star`  
  https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/
- NASA Science, `Proxima Centauri`  
  https://science.nasa.gov/asset/hubble/proxima-centauri
- NASA Science, `Eta Carinae Homunculus Nebula (High Mass-Loss Rate)`  
  https://science.nasa.gov/3d-resources/eta-carinae-homunculus-nebula-high-mass-loss-rate/
- ESA Science & Technology, `Stellar Processes and Evolution`  
  https://sci.esa.int/web/education/-/36828-stellar-processes-and-evolution
- ESA Science & Technology, `Stellar evolution`  
  https://sci.esa.int/web/integral/-/60031-stellar-evolution
- OpenStax Astronomy, `22.4 Further Evolution of Stars`  
  https://openstax.org/books/astronomy/pages/22-4-further-evolution-of-stars
- OpenStax Astronomy, `23.5 The Evolution of Binary Star Systems`  
  https://openstax.org/books/astronomy/pages/23-5-the-evolution-of-binary-star-systems
- OpenStax Astronomy 2e, `23.2 Evolution of Massive Stars: An Explosive Finish`  
  https://openstax.org/books/astronomy-2e/pages/23-2-evolution-of-massive-stars-an-explosive-finish
- MIST, `MESA Isochrones & Stellar Tracks`  
  https://mist.science/

## 17. Final Implementation Direction

If the implementing agent needs one short instruction, it is this:

Build `starlab.html` as a single-file, bilingual, dark-themed star-lifecycle simulator whose core input is initial mass, whose advanced inputs are metallicity and binary interaction, whose central star is always visually legible through compressed display scaling, and whose bottom compressed timeline makes true stellar ages and endings understandable for children without faking exact certainty where astronomy itself is fuzzy.
