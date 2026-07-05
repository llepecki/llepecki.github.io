# Scientific Review of `hohmann/index.html`

Date: 2026-04-14

Scope: This review was performed from `hohmann/index.html` only, as requested. Existing Markdown files in the repo were intentionally ignored.

## Verdict

The standard circular-orbit Hohmann reference math in `computeHohmannRef()` is mostly correct.

The live simulation is not physically self-consistent. The biggest problem is that the "good" transfer path is not a Kepler/Hohmann orbit even though the UI and comments present it as one. The second major problem is that the app calls the second heliocentric circularization burn a planetary "capture" burn, which is not what the code actually computes.

## What Is Scientifically Solid

- `hohmann/index.html:403` uses `MU_SUN = 4π²` in `AU^3 / yr^2`, which is the standard normalized heliocentric gravitational parameter.
- `hohmann/index.html:680-688` uses the correct circular-Hohmann structure:
  - transfer semi-major axis `a_t = (r1 + r2) / 2`
  - half-period transfer time `t_t = 0.5 * a_t^(3/2)` in these units
  - departure and arrival speeds from the vis-viva relation
  - impulses `Δv1 = |v_t(r1) - v_circ(r1)|`, `Δv2 = |v_circ(r2) - v_t(r2)|`
- `hohmann/index.html:690-691` uses the standard circular-model phase relation `φ = π - n_dest * t_t`.
- `hohmann/index.html:638-668` and `811-836` implement standard 2D Kepler ellipse position/velocity propagation from eccentric anomaly.

Numerical check:

- Earth -> Mars from the current formulas gives `tTransfer ≈ 258.86 d`, `Δv1 ≈ 2.945 km/s`, `Δv2 ≈ 2.649 km/s`, `phase ≈ 44.35°`.
- These values are consistent with standard teaching examples for a circular Hohmann Earth-Mars transfer.

## Findings

### 1. Critical: the "good" trajectory is not a Keplerian/Hohmann orbit

Relevant code:

- `hohmann/index.html:843-889`
- `hohmann/index.html:891-925`

Why it is wrong:

- `buildTransferArc()` computes a radial law from an ellipse:
  - `aT = (r1 + r2) / 2`
  - `eT = |r2 - r1| / (r1 + r2)`
  - `r(ν) = p / (1 + e cos ν)`
- But it does not place those points on a single fixed ellipse in inertial space.
- Instead, it linearly interpolates the heliocentric polar angle with `alpha = alpha1 + dAlpha * u` at `hohmann/index.html:868`, while the radial distance comes from a different parameter `ν` at `hohmann/index.html:870-871`.
- In a real conic about the Sun, the inertial angle is not an arbitrary linear interpolation. It must be `θ = ω + ν` for one fixed apsidal direction `ω`.

Why this matters:

- The code comment at `hohmann/index.html:858` says "Hohmann transfer ellipse from actual launch/arrival radii", but the generated path is not an ellipse with the Sun at a focus unless the angular sweep is exactly compatible with that ellipse.
- A classical two-impulse Hohmann transfer is half of one ellipse tangent to the two circular orbits. The path geometry and the time law must describe the same conic.

Concrete evidence from the current formulas:

- Earth -> Mars:
  - at an exact zero-phase-error launch in the app's own hybrid model, the launch-to-arrival Sun-centered angle change is about `166.31°`, not `180°`
  - this means the scripted path must "bend" away from a real Hohmann half-ellipse to still hit Mars
- Venus -> Mercury:
  - the corresponding angle change is about `157.26°`
- Because the code accepts these non-180° endpoint separations and still labels the path Hohmann, the flown path is not the conic implied by the reference equations.

Required fix:

- If the app is meant to teach a circular Hohmann transfer, the transfer path must be one actual ellipse with one fixed apsidal line and a `180°` heliocentric sweep.
- Do not interpolate inertial angle independently of the conic.
- Construct the transfer from a real orbital state vector or directly from a fixed transfer ellipse, then propagate that ellipse consistently.

### 2. Critical: the second burn is heliocentric circularization / velocity matching, not planetary capture

Relevant code:

- `hohmann/index.html:371-376`
- `hohmann/index.html:479-505`
- `hohmann/index.html:508`
- `hohmann/index.html:683-688`
- `hohmann/index.html:1398-1403`
- `hohmann/index.html:403`

Why it is wrong:

- The app labels burn 2 as "Capture Δv", "Hold ENGINE for capture burn!", and "Orbit captured!".
- But `computeHohmannRef()` computes `Δv2 = |v_circ(r2) - v_arr|`, which is the second impulse of a heliocentric Hohmann transfer: circularization onto the target solar orbit.
- On a "good" second burn, the spacecraft velocity is simply set equal to the destination planet's heliocentric velocity at `hohmann/index.html:1400-1403`.
- There is only one gravitational parameter in the whole file: `MU_SUN` at `hohmann/index.html:403`. There is no planetary `μ`, no sphere-of-influence model, no planetocentric hyperbola, and no parking-orbit insertion calculation.

Why this matters:

- Matching the planet's heliocentric velocity is a rendezvous-like heliocentric condition.
- It is not capture into orbit around the planet.
- A true capture burn depends on the spacecraft's hyperbolic excess speed relative to the planet, the planet's gravitational parameter, and the desired parking-orbit radius or capture ellipse.

Required fix:

- Pick one of these two directions and make the whole file consistent:
- Recommended low-scope fix: rename burn 2 everywhere to something like `Arrival Δv`, `Orbit-match Δv`, or `Circularization Δv`, and remove all text implying a true planet-centered orbit insertion.
- High-scope physics fix: implement patched-conic arrival and true planetary orbit insertion. That requires adding per-planet gravity data and computing insertion from `v∞` relative to the destination planet.

### 3. High: launch-window logic mixes two different models

Relevant code:

- `hohmann/index.html:508`
- `hohmann/index.html:675-710`
- `hohmann/index.html:747-763`
- `hohmann/index.html:1054-1083`

Why it is wrong:

- The info text explicitly says the reference `Δv` and phase values use circular-orbit Hohmann formulas based on semi-major axes.
- But the actual launch-window test uses `currentPhaseAngle()` from the planets' eccentric Keplerian positions, not from the circular reference orbits.
- That means the code compares:
  - circular-Hohmann target phase from semi-major axes
  - against true-longitude phase of eccentric moving planets
- Those are not the same model.

Why this matters:

- The launch window shown to the player is therefore not the launch window of the same circular Hohmann transfer whose `Δv` and transfer time are displayed.
- This is the root cause of the non-180° endpoint separations noted above.

Required fix:

- If the product intent is a circular Hohmann teaching model:
  - compute phase from circularized planetary angles on circles of radius `a`
  - draw the launch guide on those same circles
  - keep the eccentric ellipses, if desired, as clearly decorative only
- If the product intent is "actual current positions on eccentric orbits":
  - replace the circular Hohmann window logic with a transfer solver that uses the actual departure and arrival states
  - the simplest physically correct route is a Lambert-style heliocentric transfer solver plus a separate arrival model

### 4. High: the scripted good path uses endpoint radii from one ellipse but the time-of-flight from another ellipse

Relevant code:

- `hohmann/index.html:859-863`
- `hohmann/index.html:883`
- `hohmann/index.html:892-899`

Why it is wrong:

- `buildTransferArc()` derives `r1`, `r2`, `aT`, and `eT` from the actual launch and arrival radii.
- But it then stores `tTransfer: state.ref.tTransfer`, which comes from the semi-major-axis circular reference, not from the just-computed `aT`.
- For a Kepler ellipse with semi-major axis `aT`, the half-orbit time must be `0.5 * aT^(3/2)` in this unit system.

Concrete evidence from the current formulas:

- Earth -> Mars:
  - the actual endpoint radii chosen by the app imply `tTransfer ≈ 0.6516 yr`
  - the app forces `0.7087 yr`
  - mismatch: about `20.9 days`
- Saturn -> Uranus:
  - mismatch is about `434 days`

Why this matters:

- Even if the geometry bug in Finding 1 did not exist, this would still make the "good" path non-Keplerian.
- The code is forcing arrival at a scripted time rather than allowing the transfer time to emerge from the same ellipse used for the geometry.

Required fix:

- Never mix `r1/r2` from one ellipse with `tTransfer` from another.
- Use one self-consistent transfer definition:
  - either the canonical circular-Hohmann ellipse based on `home.a` and `dest.a`
  - or an actual departure/arrival transfer computed from the instantaneous states

### 5. Medium: encounter / capture threshold is physically arbitrary and extremely large

Relevant code:

- `hohmann/index.html:1478-1485`
- `hohmann/index.html:1525-1541`

Why it is wrong:

- `getEncounterRadius()` returns `max(0.15, min(0.5, dest.a * 0.08 + dest.a * dest.e * 2))` AU.
- For Mars this evaluates to about `0.406 AU`.
- For Saturn and beyond it clamps at `0.5 AU`.
- These are enormous heliocentric distances for something the UI treats as an encounter/capture opportunity.

Why this matters:

- The app can enter the approach/capture phase even when the spacecraft is tens of millions of kilometers from the planet.
- This is not a physically meaningful encounter criterion.

Required fix:

- If keeping the low-scope circular teaching model, only enter the arrival phase on the intentionally computed transfer endpoint, not on a giant fallback distance.
- If implementing a more physical model, use a planet-centered criterion with a defensible scale, such as a fraction of the Hill sphere or a true sphere-of-influence style threshold.

### 6. Low: explanatory wording is too broad for the actual assumptions

Relevant code:

- `hohmann/index.html:6`
- `hohmann/index.html:10`
- `hohmann/index.html:17`
- `hohmann/index.html:286`
- `hohmann/index.html:456`
- `hohmann/index.html:508`

Why it should be tightened:

- "minimum-energy Hohmann orbit" and "most fuel-efficient way to move between two circular orbits using two engine burns" are close, but scientifically incomplete.
- The standard statement should explicitly say this is the minimum-`Δv` two-impulse transfer between coplanar circular orbits around the same central body.

Required fix:

- Tighten the wording so the text matches the model exactly.
- If burn 2 remains heliocentric circularization, the text must not suggest true planetary orbit insertion.

## Recommended Resolution Path

Recommendation: keep this as a clean teaching model rather than a half-physical hybrid.

Use this low-scope, internally consistent version:

1. Keep the game explicitly heliocentric and 2D.
2. Use circular planetary orbits of radius `a` for all gameplay calculations:
   - phase angle
   - launch window guide
   - transfer geometry
   - transfer timing
   - scoring
3. Generate the transfer as one actual Hohmann ellipse with a fixed apsidal direction and a `180°` heliocentric sweep.
4. Propagate that ellipse with one consistent Kepler model.
5. Rename burn 2 and all related text from `capture` to `arrival circularization`, `orbit match`, or equivalent.
6. Keep the eccentric planetary ellipses only if they are explicitly cosmetic, or remove them entirely from gameplay.

Only choose the higher-scope alternative if true planetary arrival physics is required:

1. Keep the eccentric planetary positions.
2. Replace the launch-window logic and "good path" with a physically computed transfer from the instantaneous states.
3. Add destination-planet gravity and a patched-conic arrival/insertion model.

## Source Links

- NASA Science, *Basics of Space Flight*, Chapter 4: Trajectories  
  https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/

- NASA Science, *Dawn FAQ*  
  https://science.nasa.gov/mission/dawn/faq/

- NASA JPL Education, *Let's Go to Mars! Calculating Launch Windows*  
  https://www.jpl.nasa.gov/edu/teach/activity/lets-go-to-mars-calculating-launch-windows/

- NASA Science, *Saturn Arrival: A Guide to Saturn Orbit Insertion*  
  https://science.nasa.gov/resource/saturn-arrival-a-guide-to-saturn-orbit-insertion/
