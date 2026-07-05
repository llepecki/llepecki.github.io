# Scientific Review of the Educational Phase Cards in `starlab.html`

Date: 2026-05-02

Scope: This review examines the educational phase/transition cards currently implemented in [`starlab.html`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html). I reviewed the English card content directly and checked the underlying card logic. The Polish card text appears to be a close translation of the English text, so the scientific fixes below should be applied in both languages.

## Bottom line

The cards are a real improvement to the learning experience.

What is working well:

- Many of the main phase descriptions are short, vivid, and age-appropriate.
- The cards usually explain the "big idea" of each phase correctly.
- Several facts are strong and memorable for kids, especially for red dwarfs, red giants, planetary nebulae, neutron stars, and black holes.

What is not yet solid:

1. The generic stat block is scientifically misleading for several non-stellar-surface phases.
2. A few facts are overstated or phrased in ways that are technically shaky.
3. Some cards jump from child-friendly language into specialist jargon without enough scaffolding.

Overall judgment:

- The cards are promising and mostly informative.
- They are not yet fully reliable as a kid-facing scientific teaching layer.
- The biggest problems are not the headline descriptions; they are the card stats and a handful of specific fact lines.

## Findings

### F1. Critical: the generic card stats become scientifically wrong for several phases

Locations:

- Generic stat rendering for all phase cards: [`starlab.html:3856`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:3856)
- Planetary-nebula physical values: [`starlab.html:1265`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1265)
- Core-collapse supernova physical values: [`starlab.html:1323`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1323)
- Type Ia supernova physical values: [`starlab.html:1332`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1332)
- Black-hole physical values: [`starlab.html:1349`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1349)
- Absolute durations for remnant stages: [`starlab.html:1404`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1404)

Problem:

Every phase card shows the same three stats:

- duration
- temperature
- size range

That works reasonably well for ordinary stellar photosphere phases. It breaks badly for some late phases because those numbers no longer mean what kids will assume they mean.

Concrete examples from the current code:

- `white_dwarf` duration displays as `10.0 kyr`, but the card text says it cools for billions of years.
- `neutron_star` duration also displays as `10.0 kyr`, even though neutron stars obviously persist far longer.
- `black_hole` duration displays as `10.0 kyr`, which is not a meaningful physical lifetime.
- `black_hole` temperature displays as `0 K -> 0 K`, which is scientifically misleading and pedagogically wrong.
- `planetary_nebula` size displays as `2.50 R☉ -> 0.0400 R☉`, even though the description says the star has blown off a glowing shell. Kids will read this as "the nebula is only a few solar radii wide and shrinking," which is the opposite of what the picture and text imply.
- `core_collapse_supernova` size displays as `0.0100 R☉ -> 0.0100 R☉`, even though the description says the outer layers are blasting outward in an explosion.

Why this matters:

The card body may be correct while the stats directly underneath it teach the wrong thing.

Required fix:

- Do not use one generic stat block for all phases.
- Use phase-specific stats.

Recommended rules:

- Photospheric star phases:
  - keep `temperature`, `size`, `duration`
- Planetary nebula:
  - show `nebula expansion`, `hot core temperature`, `visibility time`
- Supernova:
  - show `peak brightness duration`, maybe `explosion type`, maybe `remnant`
- Black hole:
  - remove temperature entirely
  - if size is shown, label it explicitly as `event horizon radius`
- White dwarf / neutron star:
  - if duration is shown, make it `cooling for billions of years` / `persists indefinitely on human timescales`, not `10 kyr`

Acceptance test:

- No phase card may show a stat value that contradicts the plain-language description immediately above it.

### F2. High: the protostar card says the star has not started "shining on its own yet," which is misleading

Location:

- Protostar description: [`starlab.html:823`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:823)

Current text:

- "The star hasn't started shining on its own yet."

Problem:

This is not the best wording scientifically. Protostars do radiate energy before hydrogen fusion begins. Their energy comes mainly from gravitational contraction, not core hydrogen fusion.

Why this matters for kids:

- It creates a false binary: "dark before fusion, bright after fusion."
- The real distinction is not whether the object emits light, but whether nuclear fusion has started in the core.

Better wording:

- "It has not started nuclear fusion in its core yet."
- or: "It is glowing because it is collapsing and heating up, but it is not yet powered by hydrogen fusion."

Supporting sources:

- NASA says that at first most of a protostar's energy comes from heat released by its initial collapse, and later fusion begins.

### F3. High: the black-hole "wow fact" is too advanced, frame-dependent, and likely to confuse kids

Location:

- Black-hole wow fact: [`starlab.html:893`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:893)

Current text:

- "If you could watch someone fall into a black hole, you would see them slow down and fade away — but they would see the universe speed up around them!"

Problem:

This is not a good child-facing fact.

Why:

- It depends on observer frame and general-relativistic subtleties.
- It is likely to be remembered as a literal simple rule rather than a perspective-dependent effect.
- It is harder to understand than the main black-hole idea and distracts from the core concept.

Clarity judgment:

- Too abstract for kids.
- Not the right "wow fact" for this phase.

Recommended replacement:

Use a simpler, sturdier fact, for example:

- "Black holes are invisible by themselves. Astronomers find them by watching how nearby gas and stars move."
- or:
- "A black hole with the Sun's mass would fit inside a city."

### F4. Medium: the Wolf-Rayet wind fact is probably overstated and is not phrased carefully enough

Location:

- Wolf-Rayet wow fact: [`starlab.html:877`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:877)

Current text:

- "Wolf-Rayet winds blast outward at up to 9 million km/h — fast enough to cross the Earth's orbit in just a few hours!"

Problem:

The first clause is plausible for the upper end of Wolf-Rayet wind speeds. The second clause is the weak point.

Why:

- Review literature commonly gives Wolf-Rayet terminal wind speeds of roughly `1000-3000 km/s`, i.e. about `3.6-10.8 million km/h`.
- But crossing `1 AU` still takes many hours to around a day, depending on the exact speed and what "cross Earth's orbit" means.
- "In just a few hours" reads as stronger and cleaner than the underlying physics supports.

Recommended fix:

- Keep the speed idea, remove the orbit-crossing claim.

Safer replacement:

- "Wolf-Rayet winds can race outward at several million kilometers per hour."

### F5. Medium: the protostar-to-main-sequence transition uses a Sun-like ignition temperature as if it were universal

Location:

- Transition description: [`starlab.html:907`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:907)

Current text:

- "The core has reached about 15 million degrees..."

Problem:

That number is too specific for a generic card used across a wide mass range.

Why:

- It is a reasonable Sun-like benchmark.
- But the card is not limited to Sun-like stars.
- For kid education, "millions of degrees" is more robust and easier to understand.

Recommended fix:

- Replace with:
  - "The core has become hot enough — millions of degrees — for hydrogen fusion to begin."
- If a number is kept:
  - use `about 10 million degrees or more`, not a single fixed value for all stars.

### F6. Medium: the supernova energy fact is impressive, but the wording is too absolute

Location:

- Core-collapse supernova wow fact: [`starlab.html:881`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:881)

Current text:

- "A supernova releases more energy in seconds than our Sun will produce in its entire 10-billion-year lifetime!"

Problem:

This needs nuance.

Why:

- If the statement is about total explosion energy including neutrinos, it can be defended.
- If a child reads it as "the visible explosion light does this in seconds," it is overstated.
- NASA's kid-facing and Hubble-facing material more commonly phrases this as:
  - the supernova can briefly outshine an entire galaxy
  - during its bright interval it can radiate as much energy as the Sun emits over its life

Recommended fix:

- Prefer a less ambiguous version:
  - "For a short time, a supernova can outshine an entire galaxy."
- Or:
  - "In weeks or months, a supernova can radiate about as much visible energy as the Sun does in its whole life."

### F7. Medium: several cards are scientifically acceptable, but the language level jumps too quickly for kids

Locations:

- AGB description: [`starlab.html:847`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:847)
- Helium-flash transition: [`starlab.html:916`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:916)
- Wolf-Rayet description: [`starlab.html:875`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:875)
- Blue-supergiant to stripped-star transition: [`starlab.html:947`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:947)
- Unstable-massive-star transition: [`starlab.html:959`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:959)

Problem:

Some cards are written in plain language. Others suddenly rely on specialist terms:

- AGB
- helium flash
- radiation-driven winds
- hydrogen envelope
- Wolf-Rayet
- neutron pressure

This is not a scientific error, but it reduces child readability.

Recommended fix:

Use one of these two patterns consistently:

1. Plain-language first, term second:
   - "A Wolf-Rayet star is a stripped, super-hot massive star."
2. Plain-language body + optional glossary chip:
   - main sentence stays simple
   - technical term is available on demand

Example rewrite:

- Current:
  - "Fierce radiation-driven winds peel away the star's outer hydrogen envelope..."
- Better for kids:
  - "Powerful stellar winds blow away the star's outer hydrogen layers, exposing the much hotter core underneath."

### F8. Medium: the white-dwarf, neutron-star, and black-hole cards need time language that matches how kids think

Locations:

- White-dwarf description: [`starlab.html:859`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:859)
- Neutron-star description: [`starlab.html:887`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:887)
- Black-hole description: [`starlab.html:891`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:891)
- Remnant durations in model: [`starlab.html:1419`](/Users/llepecki/Projects/llepecki.github.io/learn/starlab.html:1419)

Problem:

The text reads as if these are stable long-lived remnants, which is correct. But the stat block uses a modeled segment duration of `10 kyr`.

For kids, that looks like:

- "white dwarfs last 10,000 years"
- "neutron stars last 10,000 years"
- "black holes last 10,000 years"

That is a strong misconception.

Recommended fix:

- Do not show a normal `Duration` stat for remnant phases.
- Replace it with something like:
  - `Next change: very slow cooling`
  - `Timescale: billions of years`
  - `Long-lived remnant`

## Positive notes

These cards are already strong and should largely be kept:

- `main_sequence` card: clear and age-appropriate
- `red_dwarf_main_sequence` card: good and consistent with current knowledge
- `red_giant` card: clear, memorable, and kid-friendly
- `planetary_nebula` naming note: excellent
- `blue_dwarf` theoretical note: strong and scientifically honest
- `type_ia_supernova` standard-candle note: good
- `neutron_star` main description: strong
- `black_hole` main description: strong

## Recommended repair strategy

Do the fixes in this order:

1. Make the stat block phase-specific.
2. Remove scientifically misleading stats from black holes, supernovae, and planetary nebulae.
3. Fix the protostar wording.
4. Replace the black-hole wow fact.
5. Soften or correct the Wolf-Rayet and supernova hyperbole.
6. Simplify the most technical transition wording for kid readability.

## Minimal acceptance checklist

- No card may show a duration that contradicts the text on the same card.
- No black-hole card may display `0 K`.
- No supernova card may display a tiny fixed stellar radius as if that were the expanding explosion.
- No planetary-nebula card may display the hot core radius as if it were the nebula size.
- Protostar text must distinguish `not yet fusing hydrogen` from `not emitting light`.
- The black-hole wow fact must be understandable without relativity background.
- A child reading the cards should not need prior knowledge of terms like `AGB`, `Wolf-Rayet`, or `helium flash` to follow the main idea.

## Public sources consulted

- NASA Science, `Stars`: protostars radiate from collapse before fusion starts; main sequence lifetime overview  
  https://science.nasa.gov/astrophysics/focus-areas/how-do-stars-form-and-evolve

- NASA Science, `Stars in an Exoplanet World`: protostar stage, white dwarfs fade over many billions of years  
  https://science.nasa.gov/exoplanets/stars/

- NASA Science, `Types of Stars`: red dwarfs are the most common stars; the Sun has about 5 billion years of main-sequence life left  
  https://science.nasa.gov/universe/stars/types/

- NASA Science, `What is Betelgeuse?`: Betelgeuse would stretch past Jupiter's orbit if placed at the Sun  
  https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/

- NASA Science, `Measuring a White Dwarf Star`: Sirius B is smaller than Earth and nearly as massive as the Sun  
  https://science.nasa.gov/missions/hubble/measuring-a-white-dwarf-star/

- NASA Science, `White Dwarf Cool Fact`: teaspoon of white dwarf matter around 5.5 tons  
  https://imagine.gsfc.nasa.gov/science/toolbox/cool_dwarf_fact2.html

- NASA Science, `Type Ia Supernovae`: similar peak brightness, standard candles  
  https://science.nasa.gov/mission/roman-space-telescope/type-ia-supernovae/

- NASA Science, `What Is a Black Hole?` and `Black Holes`: nothing, not even light, escapes the event horizon  
  https://www.nasa.gov/universe/what-are-black-holes/  
  https://science.nasa.gov/universe/black-holes/

- NASA Science / Hubble, `Pulsars`: neutron stars can spin hundreds of times per second  
  https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-pulsars/

- NASA Science, `NASA Researchers Probe Tangled Magnetospheres of Merging Neutron Stars`: neutron stars are about city-sized  
  https://science.nasa.gov/science-research/nasa-researchers-probe-tangled-magnetospheres-of-merging-neutron-stars/

- NASA Hubble, `Supernova Explosion Animation`: supernovae can briefly outshine a galaxy and radiate roughly a Sun-lifetime of energy over the bright interval  
  https://science.nasa.gov/asset/hubble/supernova-explosion-animation

- HEASARC, `Introduction to Supernova Remnants`: most core-collapse supernova energy is carried by neutrinos  
  https://heasarc.gsfc.nasa.gov/docs/objects/snrs/snrstext.html

- Dougherty & Williams (2000), MNRAS: Wolf-Rayet wind speeds roughly `1000-3000 km/s`  
  https://academic.oup.com/mnras/article/319/4/1005/977542
