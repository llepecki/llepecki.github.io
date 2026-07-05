# Star Lab: 10 Additional Real-Star Presets

Date: 2026-05-02

Scope: propose ten additional `REAL_STARS` presets for [starlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html), with values that are:

1. engaging for kids,
2. broadly aligned with current astronomy,
3. compatible with the current lifecycle engine in `starlab.html`.

This document is written as a direct handoff for an implementing agent.

## Important model note

`massMsun` in the current app behaves like a lifecycle-track mass, effectively closer to an initial/progenitor mass than a precise present-day measured mass.

That matters for evolved massive stars:

- `Gamma Velorum` is currently a Wolf-Rayet star with a much lower present-day mass than its progenitor, but the app should use a higher `massMsun` to land in `stripped_hot_star`.
- `P Cygni` is a luminous blue variable with uncertain present-day mass estimates; the app should use a track mass that lands in `unstable_massive_star`.

Also note:

- `metallicityMode` in the current app only rescales lifetime. It is not a physically complete metallicity model.
- `binaryMode: "close"` should only be used when the educational story really benefits from showing a close/interacting binary. A wide companion like `Sirius B` should still be `single` in app terms.
- `futureOutcomeId` is currently stored in presets but not used by runtime readouts. Keep it coherent anyway.

## Code touchpoints

The implementing agent will need to update at least these places in [starlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html):

- `REAL_STARS` near line `1598`
- static `<select id="realStarSelect">` options near lines `547-556`
- `blurbKeys` near lines `3565-3568`
- `nameKeys` near lines `3824-3828`
- `I18N.en` and `I18N.pl` name/blurb strings near the existing real-star keys

## Recommended preset set

Recommended dropdown order:

1. Barnard's Star
2. TRAPPIST-1
3. Sirius A
4. Vega
5. Fomalhaut
6. Arcturus
7. Rigel
8. Antares
9. P Cygni
10. Gamma Velorum

## Proposed data block

```js
const REAL_STAR_ADDITIONS = [
  {
    id: "barnard",
    massMsun: 0.16,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 1.0e10,
    ageConfidence: "low",
    distanceLy: 5.96,
    currentStageId: "red_dwarf_main_sequence",
    futureOutcomeId: "he_white_dwarf",
  },
  {
    id: "trappist",
    massMsun: 0.09,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 7.6e9,
    ageConfidence: "low",
    distanceLy: 39.1,
    currentStageId: "red_dwarf_main_sequence",
    futureOutcomeId: "he_white_dwarf",
  },
  {
    id: "sirius",
    massMsun: 2.06,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 2.4e8,
    ageConfidence: "high",
    distanceLy: 8.6,
    currentStageId: "main_sequence",
    futureOutcomeId: "co_white_dwarf",
  },
  {
    id: "vega",
    massMsun: 2.15,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 4.55e8,
    ageConfidence: "low",
    distanceLy: 25.0,
    currentStageId: "main_sequence",
    futureOutcomeId: "co_white_dwarf",
  },
  {
    id: "fomalhaut",
    massMsun: 1.90,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 4.4e8,
    ageConfidence: "low",
    distanceLy: 25.0,
    currentStageId: "main_sequence",
    futureOutcomeId: "co_white_dwarf",
  },
  {
    id: "arcturus",
    massMsun: 1.15,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 6.9e9,
    ageConfidence: "low",
    distanceLy: 36.7,
    currentStageId: "red_giant",
    futureOutcomeId: "co_white_dwarf",
  },
  {
    id: "rigel",
    massMsun: 20.0,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 7.9e6,
    ageConfidence: "low",
    distanceLy: 860,
    currentStageId: "blue_supergiant",
    futureOutcomeId: "black_hole_outcome",
  },
  {
    id: "antares",
    massMsun: 15.0,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 1.15e7,
    ageConfidence: "low",
    distanceLy: 550,
    currentStageId: "red_supergiant",
    futureOutcomeId: "neutron_star_outcome",
  },
  {
    id: "p_cygni",
    massMsun: 50.0,
    metallicityMode: "solar",
    binaryMode: "single",
    ageYears: 3.8e6,
    ageConfidence: "low",
    distanceLy: 5500,
    currentStageId: "unstable_massive_star",
    futureOutcomeId: "black_hole_outcome",
  },
  {
    id: "gamma_velorum",
    massMsun: 30.0,
    metallicityMode: "solar",
    binaryMode: "close",
    ageYears: 5.8e6,
    ageConfidence: "low",
    distanceLy: 1120,
    currentStageId: "stripped_hot_star",
    futureOutcomeId: "black_hole_outcome",
  },
];
```

## Why these fit the current engine

These are the stage windows in the current `starlab.html` model:

- `0.16 M☉`: `red_dwarf_main_sequence` lasts until `3.221e13 yr`
- `0.09 M☉`: `red_dwarf_main_sequence` lasts until `7.923e13 yr`
- `2.06 M☉`: `main_sequence` lasts until `1.547e9 yr`
- `2.15 M☉`: `main_sequence` lasts until `1.381e9 yr`
- `1.90 M☉`: `main_sequence` lasts until `1.975e9 yr`
- `1.15 M☉`: `red_giant` runs from `6.694e9` to `7.056e9 yr`
- `20 M☉`: `blue_supergiant` runs from `7.355e6` to `8.332e6 yr`
- `15 M☉`: `red_supergiant` runs from `9.570e6` to `1.426e7 yr`
- `50 M☉`: `unstable_massive_star` runs from `3.264e6` to `4.289e6 yr`
- `30 M☉`: `stripped_hot_star` runs from `5.376e6` to `6.133e6 yr`

If the implementing agent uses the proposed `massMsun` and `ageYears`, `loadRealStar()` should not emit a stage-mismatch warning in the console.

## EN/PL name and blurb keys

Suggested keys:

```js
// EN
barnardName: "Barnard's Star",
barnardBlurb:
  "A tiny nearby red dwarf in Ophiuchus, about 6 light-years away. It races across our sky faster than any other known star.",
trappistName: "TRAPPIST-1",
trappistBlurb:
  "An ultracool red dwarf about 39 light-years away with seven Earth-size planets. Three orbit in the habitable zone.",
siriusName: "Sirius A",
siriusBlurb:
  "The brightest star in Earth's night sky, 8.6 light-years away. It has a faint white dwarf companion, Sirius B.",
vegaName: "Vega",
vegaBlurb:
  "A bright white star in Lyra, about 25 light-years away. It is wrapped in a huge dusty debris disk and will be our North Star again in about 12,000 years.",
fomalhautName: "Fomalhaut",
fomalhautBlurb:
  "A young bright star about 25 light-years away, famous for giant debris rings. The once-celebrated 'Fomalhaut b' now looks more like a dust cloud from a collision.",
arcturusName: "Arcturus",
arcturusBlurb:
  "A swollen orange-red giant 36.7 light-years away and the brightest star in the northern celestial hemisphere. It shows a future stage our Sun will one day reach.",
rigelName: "Rigel",
rigelBlurb:
  "The blue-white foot of Orion, roughly 860 light-years away. It is a massive supergiant and a likely future supernova.",
antaresName: "Antares",
antaresBlurb:
  "The red heart of Scorpius, about 550 light-years away. If it replaced our Sun, it would stretch far past Mars's orbit.",
pCygniName: "P Cygni",
pCygniBlurb:
  "A rare unstable giant star in Cygnus, thousands of light-years away. It flared brightly in 1600 and gave astronomers the famous 'P Cygni profile' spectral signature.",
gammaVelName: "Gamma Velorum",
gammaVelBlurb:
  "The closest Wolf-Rayet system, about 1,100 light-years away. Its stripped star is blasting off matter in fierce winds while orbiting a hot massive companion.",

// PL
barnardName: "Gwiazda Barnarda",
barnardBlurb:
  "Mały czerwony karzeł w Wężowniku, około 6 lat świetlnych stąd. Przesuwa się po naszym niebie szybciej niż jakakolwiek inna znana gwiazda.",
trappistName: "TRAPPIST-1",
trappistBlurb:
  "Ultrachłodny czerwony karzeł około 39 lat świetlnych stąd z siedmioma planetami wielkości Ziemi. Trzy krążą w strefie zamieszkiwalnej.",
siriusName: "Syriusz A",
siriusBlurb:
  "Najjaśniejsza gwiazda nocnego nieba, 8,6 roku świetlnego od nas. Ma małego, gorącego towarzysza: białego karła Syriusza B.",
vegaName: "Wega",
vegaBlurb:
  "Jasna biała gwiazda w Lutni, około 25 lat świetlnych stąd. Otacza ją ogromny pyłowy dysk, a za około 12 000 lat stanie się naszą Gwiazdą Polarną.",
fomalhautName: "Fomalhaut",
fomalhautBlurb:
  "Młoda jasna gwiazda około 25 lat świetlnych stąd, słynna z wielkich pierścieni pyłu. Obiekt nazwany kiedyś 'Fomalhaut b' wygląda dziś raczej na chmurę pyłu po zderzeniu.",
arcturusName: "Arktur",
arcturusBlurb:
  "Rozdęty pomarańczowo-czerwony olbrzym oddalony o 36,7 roku świetlnego. To najjaśniejsza gwiazda północnej półkuli niebieskiej i zapowiedź przyszłości naszego Słońca.",
rigelName: "Rigel",
rigelBlurb:
  "Niebiesko-biała stopa Oriona, około 860 lat świetlnych stąd. To masywny nadolbrzym i prawdopodobny przyszły kandydat na supernową.",
antaresName: "Antares",
antaresBlurb:
  "Czerwone serce Skorpiona, około 550 lat świetlnych stąd. Gdyby zastąpił Słońce, sięgałby daleko poza orbitę Marsa.",
pCygniName: "P Cygni",
pCygniBlurb:
  "Rzadka, niestabilna olbrzymia gwiazda w Łabędziu, oddalona o kilka tysięcy lat świetlnych. Rozbłysła w 1600 roku i dała astronomom słynny 'profil P Cygni'.",
gammaVelName: "Gamma Velorum",
gammaVelBlurb:
  "Najbliższy układ z gwiazdą Wolfa-Rayeta, około 1100 lat świetlnych stąd. Ogołocona gwiazda wyrzuca materię potężnym wiatrem, krążąc wokół gorącego masywnego towarzysza.",
```

## Per-star research notes

### 1. Barnard's Star

- Why include it: one of the best “nearby but tiny” examples for kids; famous for the fastest known proper motion.
- Real-world anchor:
  - red dwarf, spectral type `M4V`
  - distance about `5.96 ly`
  - mass about `0.16 M☉`
  - age usually placed around `7-10 Gyr`, sometimes described as roughly `10 Gyr`
- App fit:
  - `massMsun: 0.16`
  - `ageYears: 1.0e10`
  - `currentStageId: "red_dwarf_main_sequence"`
- Caveat:
  - As of 2026-05-02 there are still moving pieces around planet claims for Barnard's Star. Do not make the blurb depend on any unsettled planet count.

### 2. TRAPPIST-1

- Why include it: probably the most kid-friendly exoplanet host star in the list.
- Real-world anchor:
  - ultracool red dwarf
  - mass about `0.09 M☉`
  - distance about `39-40 ly`
  - age `7.6 ± 2.2 Gyr`
  - seven Earth-size planets
- App fit:
  - `massMsun: 0.09`
  - `ageYears: 7.6e9`
  - `currentStageId: "red_dwarf_main_sequence"`

### 3. Sirius A

- Why include it: brightest star in the night sky; instantly recognizable.
- Real-world anchor:
  - A-type main-sequence star
  - distance `8.6 ly`
  - age about `225-250 Myr`
  - mass commonly modeled around `2.06 M☉`
  - has a white dwarf companion, Sirius B
- App fit:
  - `massMsun: 2.06`
  - `ageYears: 2.4e8`
  - `currentStageId: "main_sequence"`
- Caveat:
  - keep `binaryMode: "single"` because the current app's close-binary switch implies mass interaction, which is not the educational story here.

### 4. Vega

- Why include it: bright Summer Triangle star, debris disk, future Pole Star.
- Real-world anchor:
  - A-type main-sequence star
  - distance about `25 ly`
  - age about `450-455 Myr`
  - mass about `2.14-2.16 M☉`
  - surrounded by a large debris disk
- App fit:
  - `massMsun: 2.15`
  - `ageYears: 4.55e8`
  - `currentStageId: "main_sequence"`

### 5. Fomalhaut

- Why include it: famous debris rings and a good lesson that science updates itself.
- Real-world anchor:
  - young A-type main-sequence star
  - distance about `25 ly`
  - system age about `440 ± 40 Myr`
  - mass about `1.92 M☉`
  - the object once called `Fomalhaut b` is now usually treated as a dust cloud/collision product rather than a secure planet
- App fit:
  - `massMsun: 1.90`
  - `ageYears: 4.4e8`
  - `currentStageId: "main_sequence"`

### 6. Arcturus

- Why include it: bright orange giant and a strong “future Sun” teaching example.
- Real-world anchor:
  - red giant
  - distance `36.7 ly`
  - mass `1.08 ± 0.06 M☉`
  - age `7.1 +1.5/-1.2 Gyr`
  - about `170` times the Sun's brightness
- App fit:
  - `massMsun: 1.15`
  - `ageYears: 6.9e9`
  - `currentStageId: "red_giant"`
- Caveat:
  - `1.15 M☉` is a model-tuning choice so the app lands in `red_giant` at the chosen age. It stays close to the literature mass but is not identical.

### 7. Rigel

- Why include it: iconic blue star in Orion and a clean `blue_supergiant` preset.
- Real-world anchor:
  - blue supergiant, spectral type `B8 Ia`
  - distance about `860 ly` (`0.26 ± 0.02 kpc` class of estimate in recent distance work)
  - literature often places it around `~20 M☉`
  - widely treated as a nearby future Type II supernova progenitor
- App fit:
  - `massMsun: 20.0`
  - `ageYears: 7.9e6`
  - `currentStageId: "blue_supergiant"`
- Caveat:
  - exact mass/luminosity estimates for Rigel vary materially with distance assumptions, so keep `ageConfidence: "low"`.
  - the current app model maps `20-40 M☉` to `black_hole_outcome`; the real remnant is less settled than that.

### 8. Antares

- Why include it: one of the most recognizable red supergiants in the sky.
- Real-world anchor:
  - red supergiant
  - distance about `550 ly`
  - mass estimates commonly cluster around `~13-16 M☉`
  - age usually in the `~11-17 Myr` range depending on the track
  - famous as the “heart of the Scorpion”
- App fit:
  - `massMsun: 15.0`
  - `ageYears: 1.15e7`
  - `currentStageId: "red_supergiant"`

### 9. P Cygni

- Why include it: historically dramatic and educationally unique.
- Real-world anchor:
  - luminous blue variable
  - distance estimates are still messy; for kid-facing UI a rounded `~5.5 kly` is defensible
  - present-day mass estimates vary, and literature also discusses larger progenitor-scale masses
  - famous 1600 eruption and the spectral `P Cygni profile`
- App fit:
  - `massMsun: 50.0`
  - `ageYears: 3.8e6`
  - `currentStageId: "unstable_massive_star"`
- Caveat:
  - do not oversell binarity. There are binary ideas in the literature, but it is not the stable, simple teaching fact here.

### 10. Gamma Velorum

- Why include it: best `Wolf-Rayet / stripped hot star` addition.
- Real-world anchor:
  - closest Wolf-Rayet system to the Sun
  - close WR+O binary
  - age `5.5 ± 1 Myr`
  - current WR-star mass about `9 M☉`
  - O-star companion about `28.5 M☉`
  - distance in the `~330-340 pc` range, about `1,100 ly`
- App fit:
  - `massMsun: 30.0`
  - `binaryMode: "close"`
  - `ageYears: 5.8e6`
  - `currentStageId: "stripped_hot_star"`
- Caveat:
  - the app mass is intentionally progenitor-like, not the present-day stripped WR mass.

## Acceptance checks

After implementation:

1. Each new preset should load without a console warning from `loadRealStar()` about `expected stage` versus `computed stage`.
2. `Start from now` should place the star in the intended phase card and timeline segment.
3. `Start from birth` should still run through the star's full simplified track cleanly.
4. Massive stars with wide companions should not use `binaryMode: "close"` just to mention a companion.
5. `Gamma Velorum` should visibly land in the Wolf-Rayet-like `stripped_hot_star` phase, not in `blue_supergiant`.

## Sources

Barnard's Star

- NASA Barnard's Star page: https://science.nasa.gov/exoplanets/star-catalog/barnards-star/
- MNRAS stellar activity analysis: https://academic.oup.com/mnras/article/488/4/5145/5539724
- NASA/Chandra habitability release: https://chandra.harvard.edu/press/20_releases/press_103020.html

TRAPPIST-1

- NASA “TRAPPIST-1 is Older Than Our Solar System”: https://science.nasa.gov/universe/exoplanets/trappist-1-is-older-than-our-solar-system/
- NASA Webb TRAPPIST-1 page: https://science.nasa.gov/universe/exoplanets/webb-measures-the-temperature-of-a-trappist-1-exoplanet/
- Age paper abstract via OSTI: https://www.osti.gov/biblio/22875907

Sirius A

- NASA Hubble Sirius page: https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/
- Sirius age / structure paper: https://www.aanda.org/articles/aa/full_html/2011/10/aa16999-11/aa16999-11.html
- Sirius binary age paper summary: https://www.researchgate.net/publication/1752936_The_Age_and_Progenitor_Mass_of_Sirius_B

Vega

- NASA Hubble/Webb Vega page: https://science.nasa.gov/missions/hubble/nasas-hubble-webb-probe-surprisingly-smooth-disk-around-vega/
- Vega mass/age paper summary: https://www.osti.gov/biblio/21392508

Fomalhaut

- NASA Hubble Fomalhaut page: https://science.nasa.gov/universe/exoplanets/hubble-directly-observes-planet-orbiting-fomalhaut/
- NASA Webb Fomalhaut page: https://science.nasa.gov/missions/webb/webb-looks-for-fomalhauts-asteroid-belt-and-finds-much-more
- Fomalhaut age/mass discussion citing Mamajek result: https://academic.oup.com/mnras/article/442/1/142/1238782

Arcturus

- NASA skywatching page with Arcturus summary: https://science.nasa.gov/solar-system/skywatching/the-next-full-moon-will-be-the-last-of-four-consecutive-supermoons/
- Arcturus parameters paper summary: https://www.iac.es/en/science-and-technology/publications/fundamental-parameters-and-chemical-composition-arcturus

Rigel

- Rigel distance paper: https://academic.oup.com/mnras/article/515/1/1/6608892
- Rigel supernova-progenitor study: https://www.researchgate.net/publication/51978311_Asteroseismology_of_the_nearby_SN-II_Progenitor_Rigel_I_The_MOST_High-precision_Photometry_and_Radial_Velocity_Monitoring

Antares

- Nature Antares imaging paper: https://www.nature.com/articles/nature23445
- Antares mass/age constraint discussion: https://doi.org/10.1093/mnras/stac1969

P Cygni

- P Cygni LBV variability paper: https://academic.oup.com/mnras/article/509/3/4246/6413574
- P Cygni shell / distance paper: https://academic.oup.com/mnras/article/283/3/L69/1013611
- P Cygni mass-interpretation discussion: https://academic.oup.com/mnras/article/405/3/1924/966978

Gamma Velorum

- Gamma Velorum age paper: https://academic.oup.com/mnrasl/article/400/1/L20/1015315
- Gamma Velorum mass / distance discussion: https://academic.oup.com/mnras/article/471/3/2715/3964540
- Gamma Velorum updated distance / WR-star context: https://academic.oup.com/mnras/article/525/2/3195/7244728
