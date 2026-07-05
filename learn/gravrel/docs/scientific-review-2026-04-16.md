# Scientific Review of `gravrel/index.html`

Date: 2026-04-16

Scope:
- This review was prepared from `gravrel/index.html` only.
- Existing `.md` files in the repo were intentionally not used, per request.
- Public sources were used only to verify core GR formulas and a few catalog facts.

Verdict:
- `gravrel/index.html` is not scientifically solid as currently implemented.
- The page presents the model as if it were close to exact Schwarzschild time dilation with a far-away mission clock, but the actual code is a schematic teaching heuristic driven by pixel geometry.
- The current implementation is good enough for a qualitative toy demo after relabeling. It is not good enough to present as correct physics with meaningful year-by-year outputs.

What is already basically fine:
- The Lorentz factor implementation `gamma = 1 / sqrt(1 - beta^2)` is correct in [gravrel/index.html](gravrel/index.html) around lines 906-907.
- Using `ly` and `yr` so that `c = 1 ly/yr` is a valid unit convention.
- The star-distance table and black-hole catalog entries look broadly reasonable in spot checks; they are not the main scientific problem.

## 1. Blocking finding: the code uses a compressed UI radius as if it were the Schwarzschild radius

Where:
- `computeRh()` at `gravrel/index.html:750-756`
- `updateBlackHoleRadii()` at `gravrel/index.html:758-762`
- `computeEffectiveGravity()` at `gravrel/index.html:1049-1068`
- User-facing explanation at `gravrel/index.html:585-586` and `gravrel/index.html:621-622`

What the code does:
- `Rh` is defined from `log10(M/Msun)` with a floor and a very weak logarithmic scaling:
  - `Rh = max(10, 10 + 1.5 * (logMass - 3))`
- That `Rh` is explicitly described in code comments as “Not a literal Schwarzschild radius”.
- The physics then uses `dCanvas / Rh` as if it were the exact GR ratio `r / r_s`.
- Gravity is also truncated at `Rinf = 6 * Rh` and faded to zero near that ring.

Why this is scientifically wrong:
- The Schwarzschild radius scales linearly with mass, not logarithmically.
- A visual stand-in radius can be useful for drawing, but it cannot also be the physical radius used in the time-dilation formula unless the entire scene has a declared physical scale and `Rh` is tied to real `r_s`.
- In the current code, UI choices directly define the strength of gravity.

Concrete evidence from the current implementation:
- The catalog spans about `6.6 Msun` to `6.6e10 Msun`, a mass ratio of `1e10`.
- The UI radius spans only `10 px` to `21.73 px`, a ratio of only `2.17`.
- The first three black holes:
  - `V616 Mon`
  - `Cygnus X-1`
  - `GW150914 remnant`
  all get exactly the same `Rh = 10 px`, so they produce identical gravity in the model.
- `M87*` is about `1512` times more massive than `Sgr A*`, but the model gives it only about `1.31` times the radius in the physics path.

Why the current wording is incompatible with the code:
- The info panel says each black hole uses the Schwarzschild time-dilation factor, exact for one isolated non-rotating mass.
- The code does not do that. It uses a stylized radius field, not an exact Schwarzschild coordinate radius.

Required fix:
- Do not use `Rh`, `Rsafe`, or `Rinf` in the physics equations.
- Keep `Rh`, `Rsafe`, and `Rinf` only as UI/drawing helpers if needed.
- Introduce an actual physical radius variable:
  - `r_s = 2GM / c^2`
  - or a dimensionless state variable such as `u = r / r_s`
- Any displayed quantity like “`x rh`” must use the real Schwarzschild radius if the app is claiming physics correctness.
- If the scene remains purely schematic with no physical scale, then all claims of “exact Schwarzschild factor” must be removed.

## 2. Blocking finding: `mission time` and `pilot time` are mathematically inconsistent with the stated speed definition

Where:
- Speed definition in the info panel at `gravrel/index.html:585`
- Core time integration at `gravrel/index.html:1102-1108`

What the code does now:
- `dsPhysical = star.dist * (dsMap / L0_map)`
- `dtRef = dsPhysical / beta`
- `dPilot = dtRef * invGamma * g`
- with `g = sqrt(1 - r_s / r)` implemented heuristically by `computeEffectiveGravity()`

Why this is inconsistent:
- The page says the speed factor assumes local speed relative to static observers near each hole.
- For Schwarzschild spacetime, if `beta` is the ship speed measured by local static observers and `dl` is local proper spatial distance, then:
  - `d tau_static = dl / (beta c)`
  - `dt_infinity = d tau_static / g = dl / (beta c g)`
  - `d tau_ship = d tau_static / gamma = dl / (beta c gamma)`
  - equivalently `d tau_ship = dt_infinity * g / gamma`
- The current code instead puts the gravitational factor into the traveler time while leaving the far-away reference time independent of gravity.
- That is the opposite of what the stated observer convention implies.

Important consequence:
- If `dsPhysical` is supposed to mean local proper route length, then the current `pilotTime` is wrong.
- If `dsPhysical` is supposed to mean far-away coordinate distance, then the current `missionTime` is wrong.
- There is no interpretation under which the current names, equations, and prose are all simultaneously correct.

Required fix:
- Pick one coherent physical meaning for route arclength.
- Recommended choice:
  - Treat route arclength as local proper distance `dl`.
  - Then compute:
    - `dtRef = dl / (beta * g)` in `c = 1` units
    - `dPilot = dl / (beta * gamma)`
- If a different convention is chosen, rename the UI so it no longer claims “far-away reference clock” and “local speed relative to static observers”.

## 3. Blocking finding: real interstellar distance and compressed local encounter geometry are mixed into one path length, so absolute outputs in years are arbitrary

Where:
- `dsPhysical = star.dist * (dsMap / L0_map)` at `gravrel/index.html:1102`
- `route.lengthPhysical = star.dist * (route.lengthMap / L0_map)` at `gravrel/index.html:1129`
- Explanatory text at `gravrel/index.html:585-586`

What the code is assuming:
- The straight Earth-to-star baseline has a real physical distance from the star table.
- Any extra curve length on the schematic canvas is converted directly into extra physical light-years.

Why this breaks the model:
- The same info panel says the map is schematic and encounter distances are compressed for interactivity.
- That means the local geometry near the black hole is intentionally not on the same scale as the Earth-star baseline.
- But the code still converts that compressed local detour into literal light-years and literal years.
- So the final travel times depend on arbitrary drawing geometry, not on a well-defined physical path.

Practical effect:
- A user can change the reported mission duration by dragging a route through a purely schematic local detour.
- The page then presents that number as if it were a real physical year count.

Required fix:
- Separate the large-scale cruise distance from the local black-hole encounter geometry.
- Do not derive physical `ly` directly from a schematic canvas unless the entire canvas has one declared physical scale.
- Preferred exact approach:
  - Keep the destination-star distance as one physical parameter.
  - Model the black-hole encounter with its own physical parameters such as `r_min / r_s`, turning angle, and local path segment length.
  - Integrate time over that physical encounter segment separately.

## 4. Blocking finding: multi-black-hole mode cannot be described as exact Schwarzschild general relativity

Where:
- Claim in the info panel at `gravrel/index.html:585-586`
- Multi-hole multiplication in `computeEffectiveGravity()` at `gravrel/index.html:1049-1068`

What is true:
- Schwarzschild is exact for one isolated, non-rotating, spherically symmetric mass.
- Multiplying per-hole Schwarzschild factors is not exact GR for multiple nearby black holes.

Current status:
- The info panel does partially admit this is a “teaching heuristic”.
- That admission is good, but it is not strong enough compared with the rest of the page language.
- The overall experience still reads as if the page is physically correct apart from a small caveat.

Required fix:
- If scientific correctness is the goal, the exact mode should support one black hole only.
- If two or three black holes must remain, the app must stop calling the physics exact.
- If multi-BH mode stays, use explicitly weak-field language and enforce large minimum distances from each hole so the approximation is honest.

Recommended product split:
- `Exact single-BH Schwarzschild mode`
- `Approximate multi-BH teaching mode`

## 5. Major finding: the gravity field has a hidden hard cutoff and hand-tuned fade that are not part of Schwarzschild physics

Where:
- Constants at `gravrel/index.html:427-429`
- Cutoff/fade at `gravrel/index.html:1057-1065`

What the code does:
- No gravitational contribution is applied outside `Rinf = 6 * Rh`.
- The contribution is manually faded to zero between `0.8 * Rinf` and `Rinf`.

Why this is wrong:
- Real gravitational redshift does not vanish at a finite radius.
- The fade exists only to make the drawn ring match the physics halo.
- That means the drawn halo is dictating the equations.

Required fix:
- In exact mode, remove the cutoff and fade from the physics entirely.
- In approximate mode, document the cutoff clearly and stop describing the factor as exact Schwarzschild.

## 6. Major finding: ship animation assumes uniform advance by arc length, which is incompatible with a corrected reference-time model

Where:
- `updateShipProgress()` at `gravrel/index.html:2055-2064`
- `interpolateRoute()` at `gravrel/index.html:1165-1180`
- `interpolatePilotTime()` at `gravrel/index.html:1182-1197`

What the code does now:
- `ship.progress = refTimeElapsed / route.refTime`
- Position is then interpolated by route-length fraction, not by cumulative reference time.

Why this matters:
- In the current simplified model, reference time is proportional to route length, so this happens to be self-consistent.
- In a physically corrected model, far-away reference time is not uniform along the route when gravity varies.
- A ship near a black hole should advance more slowly in the far-away mission clock than a ship far away, even at the same local speed.

Required fix:
- Store `cumRefTime` per sample, not only `cumPilotTime`.
- Determine ship position by inverting cumulative reference time, not by using raw arc-length fraction.
- Interpolate both ship position and pilot clock from cumulative time arrays.

## 7. Major finding: user-facing summary text overclaims the cause of the age difference

Where:
- Default info text at `gravrel/index.html:585`
- Summary strings at `gravrel/index.html:582-583` and `gravrel/index.html:618-619`
- Summary generation at `gravrel/index.html:2109-2115`

What the page says:
- “The pilot whose ship flies closer to a black hole ages less…”
- “Pilot X aged less by flying deeper through strong gravity.”

Why this is too strong:
- Total proper time depends on the full worldline, not only on minimum distance to the hole.
- Route length matters.
- Speed convention matters.
- In the current app, the path can be longer or shorter in arbitrary schematic ways, so the conclusion cannot honestly be attributed to gravity alone.

Required fix:
- Rephrase to something like:
  - “In this model, stronger gravitational time dilation tends to reduce elapsed pilot time, but total aging also depends on route length and speed.”
- The summary should attribute the result to the modeled proper-time integral, not only to “flying deeper”.

## 8. Medium finding: the `x rh` readout is mislabeled physics

Where:
- `updateShipReadout()` at `gravrel/index.html:1921-1929`
- `computeRh()` comment at `gravrel/index.html:750-756`

What is wrong:
- The readout shows `minDist / Rh` as `xrh`.
- But `Rh` is explicitly not a literal Schwarzschild radius.
- This makes the readout look like a physical `r / r_s` quantity when it is only a visual-radius ratio.

Required fix:
- In exact mode, replace it with a real `r_min / r_s`.
- In approximate mode, rename it to something non-physical like `visual-radius units`, or remove it.

## Recommended implementation path

If the goal is true scientific correctness:
- Restrict the exact model to one black hole.
- Keep the canvas schematic, but stop using canvas radii in physics.
- Add explicit physical encounter parameters for the black hole pass, for example:
  - black-hole mass `M`
  - closest approach `r_min / r_s`
  - encounter geometry or arclength in physical units
  - route segment definition in physical coordinates
- Compute:
  - `r_s = 2GM / c^2`
  - `g(r) = sqrt(1 - r_s / r)`
  - `gamma = 1 / sqrt(1 - beta^2)`
  - `dtRef = dl / (beta * g)` if `beta` is local speed and `dl` is local proper length
  - `dPilot = dl / (beta * gamma)`
- Drive animation from cumulative reference time, not from length fraction.
- Rewrite the info panel and summary so they match the actual model.

If the goal is to preserve the current UI with multiple holes:
- Keep it as a teaching toy, not an exact simulator.
- Remove every use of “exact Schwarzschild” and every readout that looks like literal `r / r_s`.
- Rename the outputs so they are clearly model-dependent proxies rather than real travel-year predictions.
- Enforce a clearly weak-field regime if multiple holes remain in the physics.

## Acceptance criteria for a scientifically solid fix

- No physics equation may depend directly on `Rh`, `Rsafe`, `Rinf`, or raw canvas pixels.
- The meaning of every physical quantity must be declared:
  - `M`
  - `r_s`
  - `r`
  - `dl`
  - `dtRef`
  - `dPilot`
  - `beta`
- The observer convention must be explicit and consistent across code and UI text.
- `Mission time` must match the same observer definition used in the equations.
- Displayed ratios such as `r / r_s` must use the true Schwarzschild radius, not a UI proxy.
- Exact wording must be reserved for the single isolated Schwarzschild case only.
- Multi-BH mode, if kept, must be labeled approximate.

## Formula appendix for the fixing agent

For one isolated non-rotating mass in Schwarzschild spacetime:

- `r_s = 2GM / c^2`
- `g(r) = sqrt(1 - r_s / r)` for a static clock at radius `r`
- In the equatorial plane, the local proper spatial element is:
  - `dl^2 = dr^2 / (1 - r_s / r) + r^2 dphi^2`
- If the ship’s speed `beta = v/c` is measured by local static observers, then:
  - `gamma = 1 / sqrt(1 - beta^2)`
  - `d tau_static = dl / (beta c)`
  - `dt_infinity = d tau_static / g = dl / (beta c g)`
  - `d tau_ship = d tau_static / gamma = dl / (beta c gamma)`
  - equivalently `d tau_ship = dt_infinity * g / gamma`

In `ly` and `yr` units you can set `c = 1`.

## Sources used

- Einstein Online glossary, on Schwarzschild solution and Schwarzschild radius:
  - https://www.einstein-online.info/en/essentials/dictionary/
- Einstein Online glossary, on gravitational redshift and its relation to time dilation:
  - https://www.einstein-online.info/en/explandict/redshift-gravitational/
- Piotr T. Chruściel, *The Schwarzschild Metric*:
  - https://link.springer.com/chapter/10.1007/978-3-030-28416-9_3
- LIGO source properties for GW150914:
  - https://dcc.ligo.org/LIGO-P1500218/public
- NASA Science, general black-hole facts including TON 618:
  - https://science.nasa.gov/universe/black-holes/
- NASA Science, HLX-1 estimate:
  - https://science.nasa.gov/asset/hubble/black-hole-eso-243-49-hlx-1/
- NASA / IXPE note for Cygnus X-1 at about 21 solar masses:
  - https://www.nasa.gov/mission_pages/ixpe/news/2022/nasa-s-ixpe-reveals-shape-orientation-of-hot-matter-around-black-hole.html
- NSF note for Sagittarius A* at about 4.3 million solar masses:
  - https://www.nsf.gov/news/astronomers-confront-massive-black-hole-heart
- NASA JPL education note for Sgr A* and M87* masses:
  - https://www.jpl.nasa.gov/edu/resources/teachable-moment/how-scientists-captured-the-first-image-of-a-black-hole/
