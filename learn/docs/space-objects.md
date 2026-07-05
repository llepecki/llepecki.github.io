# Curated Distance-Matched Reference Objects For `gravrel/index.html`

Date: 2026-04-16

## Recommendation

Use a `15%` distance-match tolerance, defined as:

`|d_ref - d_bh| / mean(d_ref, d_bh) <= 0.15`

Why `15%`:

- It is loose enough to survive real-world distance uncertainties for stars, binaries, and nearby galaxies.
- It is still tight enough that the two captains are plainly taking "same-distance" missions in a teaching app.
- For UI purposes, I would label matches as:
  - `tight` for `<= 5%`
  - `acceptable` for `> 5%` and `<= 15%`
  - `too loose` for `> 15%`

## Extragalactic Policy

For extragalactic black holes, the most scientifically honest solution is **option (b)**:

- keep the nearby-Galactic rows as true `reference star` vs `black hole` comparisons;
- switch the far rows to `reference object` vs `black hole`, where the reference object is the host galaxy itself.

Reason:

- once the black hole is in another galaxy, there is usually no single well-known, app-friendly ordinary star with equally clean distance, class, and kid-safe story value;
- the host galaxy is undeniably at the same distance as its central black hole or off-nuclear BH system;
- this keeps the "same trip length, different gravity environment" idea honest.

I would **drop `TON 618` and the `GW150914` remnant** from this app. They push the concept into cosmological-distance and localization territory where the simple curated-pair model stops being clean.

## Notes

- Distances below are given in light-years, with `1 pc = 3.26156 ly`.
- For the 19 Cephei row, the distance is **inferred from the Gaia DR3 parallax** listed in SIMBAD; that inference is explicit because the catalog gives parallax, not the distance in ly directly.
- For extragalactic rows, the "reference star" field is replaced by `reference object`, and "spectral type / stellar class" is replaced by `galaxy morphology / class`.

## Summary Table

| Pair | Reference object | Black hole | Distance match | Comment |
| --- | --- | --- | ---: | --- |
| 1 | 19 Cephei | V616 Monocerotis (A0620-00) | 8.0% | Acceptable; the only clean Milky Way star-vs-BH pair in this set |
| 2 | M33 (Triangulum Galaxy) | M33 X-7 | 0.0% | Exact host-galaxy match |
| 3 | ESO 243-49 | HLX-1 | 0.0% | Exact host-galaxy match |
| 4 | M31 (Andromeda Galaxy) | M31* | 0.0% | Exact host-galaxy match |
| 5 | M87 | M87* | 0.0% | Exact host-galaxy match |

## Pair 1: 19 Cephei + V616 Monocerotis

### 1. Reference star

- Name: `19 Cephei`
- Distance: `3,191 ly`, inferred from Gaia DR3 parallax `1.0221 +/- 0.0652 mas` listed in [SIMBAD](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=19+Cephei) and sourced to Gaia DR3 (`2020yCat.1350....0G`)
- Spectral type / stellar class: `O9 Ib` blue supergiant ([SIMBAD](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=19+Cephei))
- Constellation: `Cepheus`
- Fun fact: This star is so hot that it shines blue-white, much hotter than our Sun. If you lived on a planet around it, your daylight would look fierce and icy-blue.

### 2. Black hole

- Name: `V616 Monocerotis` (`A0620-00`)
- Distance: `3,457 ly`, from `d = 1.06 +/- 0.12 kpc` in [Cantrell et al. 2010, ApJ 710, 1127](https://authors.library.caltech.edu/records/k0xx3-cxn16)
- Mass: `6.6 +/- 0.25 M_sun` ([Cantrell et al. 2010](https://authors.library.caltech.edu/records/k0xx3-cxn16))
- Type: `stellar`
- Constellation: `Monoceros`
- Fact: V616 Mon was one of the first quiet stellar black holes that astronomers could weigh by watching its companion star wobble. It is also one of the closest well-measured black holes known.

### 3. Distance match

- `|d_star - d_bh| / mean = 8.0%`
- Comment: `acceptable` under the proposed `15%` rule

### 4. Pair rationale

This is the strongest honest Milky Way `star vs stellar black hole` pair I found with catalog-grade distances. It is pedagogically useful because both trips are only a few thousand light-years long, so the comparison feels like a fair head-to-head mission rather than a deep-cosmos jump.

## Pair 2: M33 + M33 X-7

### 1. Reference object

- Name: `M33` (`Triangulum Galaxy`)
- Distance: `3,144,144 ly`, from `964 +/- 54 kpc` in [Bonanos et al. 2006, ApJ 652, 313](https://publications-cnrc.canada.ca/eng/view/object/?id=81292608-1fff-4eb8-80c8-0c5986ead58c)
- Galaxy morphology / class: `SA(s)cd` spiral galaxy
- Constellation: `Triangulum`
- Fun fact: M33 contains `NGC 604`, one of the largest star-forming regions in the Local Group. It is like a giant cosmic nursery where many hot young stars are being born.

### 2. Black hole

- Name: `M33 X-7`
- Distance: `3,144,144 ly`, same host-galaxy distance as M33 above
- Mass: `15.65 +/- 1.45 M_sun` from [Orosz et al. 2007, Nature 449, 872](https://www.nature.com/articles/nature06218)
- Type: `stellar`
- Host galaxy: `M33 / Triangulum`
- Fact: M33 X-7 was the first black hole known in an eclipsing binary, which made it unusually good for precise weighing. Its companion star is enormous and whips around the black hole in only a few days.

### 3. Distance match

- `|d_ref - d_bh| / mean = 0.0%`
- Comment: `tight` and effectively exact

### 4. Pair rationale

This row keeps a stellar-mass black hole in the catalog while moving beyond the Milky Way. It is scientifically clean because the reference object and the BH system are in the same galaxy, so the distance match is exact by construction.

## Pair 3: ESO 243-49 + HLX-1

### 1. Reference object

- Name: `ESO 243-49`
- Distance: `290 million ly`, from NASA Hubble's object summary for [ESO 243-49](https://science.nasa.gov/asset/hubble/edge-on-spiral-galaxy-eso-243-49/)
- Galaxy morphology / class: edge-on `S0/a` galaxy
- Constellation: `Phoenix`
- Fun fact: This galaxy may have torn apart a smaller neighbor long ago. Astronomers think HLX-1 could be one of the leftovers from that cosmic wrecking event.

### 2. Black hole

- Name: `HLX-1` (`ESO 243-49 HLX-1`)
- Distance: `290 million ly`, same host-galaxy distance as ESO 243-49 above
- Mass: `~20,000 M_sun` as a commonly used estimate in NASA Hubble's [HLX-1 summary](https://science.nasa.gov/asset/hubble/black-hole-eso-243-49-hlx-1/); the discovery paper gives a conservative lower limit of `> 500 M_sun` in [Farrell et al. 2009, Nature 460, 73](https://www.nature.com/articles/nature08083)
- Type: `intermediate-mass candidate`
- Host galaxy: `ESO 243-49 / Phoenix`
- Fact: HLX-1 sits away from the center of its galaxy, which is unusual for a black hole of this scale. That odd location is one reason astronomers suspect it may be the stripped core of a much smaller galaxy.

### 3. Distance match

- `|d_ref - d_bh| / mean = 0.0%`
- Comment: `tight` and effectively exact

### 4. Pair rationale

This is the cleanest pedagogical bridge into the intermediate-mass range. It lets the app span from stellar black holes up to the disputed-but-important `10^3-10^5 M_sun` regime without pretending that a random Milky Way star is a fair same-distance control.

## Pair 4: M31 + M31*

### 1. Reference object

- Name: `M31` (`Andromeda Galaxy`)
- Distance: `2,426,601 ly`, from `744 +/- 33 kpc` in [Vilardell et al. 2010, A&A 509, A70](https://www.aanda.org/articles/aa/full_html/2010/01/aa13299-09/aa13299-09.html)
- Galaxy morphology / class: `SA(s)b` spiral galaxy
- Constellation: `Andromeda`
- Fun fact: Andromeda is the nearest giant spiral galaxy to us, and on a dark night you can see it without a telescope. The light reaching your eyes left before human civilization invented writing.

### 2. Black hole

- Name: `M31*`
- Distance: `2,426,601 ly`, same host-galaxy distance as M31 above
- Mass: best-fit `1.4 x 10^8 M_sun`, with `1 sigma` range `(1.1-2.3) x 10^8 M_sun`, from [Bender et al. 2005, ApJ 631, 280](https://doi.org/10.1086/432434)
- Type: `supermassive`
- Host galaxy: `M31 / Andromeda`
- Fact: Hubble found a strange tight disk of blue stars packed around Andromeda's central black hole. That makes its nucleus look more like a tiny crowded star city than a simple glowing dot.

### 3. Distance match

- `|d_ref - d_bh| / mean = 0.0%`
- Comment: `tight` and effectively exact

### 4. Pair rationale

This is the nearest clean extragalactic supermassive-black-hole example, which makes it excellent for a kids' app. The host galaxy is famous, easy to visualize, and exactly distance-matched to its central black hole.

## Pair 5: M87 + M87*

### 1. Reference object

- Name: `M87`
- Distance: `54,794,208 ly`, from `16.8(+0.8/-0.7) Mpc` in [Event Horizon Telescope Collaboration 2019, ApJL 875, L6](https://sdoeleman.hsites.harvard.edu/publications/first-m87-event-horizon-telescope-results-vi-shadow-and-mass-central-black)
- Galaxy morphology / class: giant elliptical galaxy
- Constellation: `Virgo`
- Fun fact: M87 shoots out a gigantic jet of energetic matter from its core. That jet is so large that it stretches for thousands of light-years into space.

### 2. Black hole

- Name: `M87*`
- Distance: `54,794,208 ly`, same host-galaxy distance as M87 above
- Mass: `6.5 +/- 0.7 x 10^9 M_sun` from [Event Horizon Telescope Collaboration 2019, ApJL 875, L1/L6](https://sdoeleman.hsites.harvard.edu/publications/first-m87-event-horizon-telescope-results-vi-shadow-and-mass-central-black)
- Type: `supermassive`
- Host galaxy: `M87 / Virgo`
- Fact: M87* became the first black hole whose shadow humanity ever imaged. That orange ring picture from 2019 was assembled from telescopes spread across Earth.

### 3. Distance match

- `|d_ref - d_bh| / mean = 0.0%`
- Comment: `tight` and effectively exact

### 4. Pair rationale

This is the flagship very-massive-SMBH row. It gives the app a dramatic top-end black hole without sacrificing honesty, because the comparison object is simply the same galaxy that contains the black hole.

## Implementation Advice

If this catalog is wired into the app, I would recommend:

- keeping the nearby row labeled `reference star`;
- labeling the far rows `reference object`;
- adding a short tooltip such as: `For distant galaxies, the comparison object is the host galaxy itself, because there is no equally well-known single star at the same distance.`
