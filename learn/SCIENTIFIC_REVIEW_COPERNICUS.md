# Scientific Review: `copernicus.html`

Review date: 2026-04-12

Purpose: assess whether the physics and mathematics in `copernicus.html` are scientifically sound, separate real problems from acceptable simplifications, and provide a fix-ready handoff document another AI agent can use without repeating the review.

## Executive summary

`copernicus.html` is scientifically solid in its core orbital math.

- The app correctly implements a simplified 2D Keplerian model:
  - mean motion `n = 2π / T`
  - mean anomaly `M = M0 + n t`
  - Kepler solve `M = E - e sin(E)`
  - orbital-plane coordinates `x' = a (cos E - e)`, `y' = a sqrt(1 - e^2) sin E`
  - rotation by longitude of perihelion
  - displayed relative position `r_display = r_body - r_center`
- The orbital constants are good educational approximations to JPL/NASA values.
- The orbital guide ellipses are drawn correctly with the Sun at a focus.
- The numerical solver is robust for all eccentricities used here.

The main scientific problems are conceptual and textual, not algorithmic.

- The current copy blurs the distinction between:
  - top-down relative trajectories in the orbital plane
  - apparent retrograde motion against the background stars in Earth’s sky
- The copy overstates frame equivalence by saying, in effect, that the “physics is identical” and there is “no wrong choice” of frame. That is too strong for accelerating planet-centered frames.
- The history note is not precise enough about the difference between Copernicus’s circular constructions and the later Keplerian ellipse model actually used by the app.
- The app does not explicitly tell the user that this is an approximate 2D fixed-element model, not a full ephemeris or literal sky chart.

Bottom line: the math is good; the scientific framing is not yet clean enough to call the whole app fully rigorous.

## Method

- Read `copernicus.html` directly and traced the orbital and drawing code paths.
- Compared the implemented formulas against JPL Solar System Dynamics guidance for approximate planetary positions.
- Compared the orbital constants against JPL and NASA fact-sheet values.
- Ran local numerical checks for:
  - Kepler-equation residuals across dense samples of `M`
  - consistency with Kepler’s third law via `T^2 / a^3`
  - trail coverage versus the Earth-Mars synodic period

## Governing model that should be preserved

These are the equations another agent should keep.

- Mean motion:
  - `n = 2π / T`
- Mean anomaly:
  - `M0 = L0 - ϖ`
  - `M = M0 + n t`
- Kepler equation:
  - `M = E - e sin(E)`
- Position in the orbital plane:
  - `x' = a (cos E - e)`
  - `y' = a sqrt(1 - e^2) sin E`
- Rotation into the app’s 2D reference axes:
  - `x = x' cos ϖ - y' sin ϖ`
  - `y = x' sin ϖ + y' cos ϖ`
- Displayed position in the selected-body frame:
  - `r_display(P) = r_helio(P) - r_helio(center)`

Important modeling note:

- This is a kinematic coordinate transform of approximate heliocentric positions.
- It is not a full N-body force simulation.
- It is not a literal geocentric sky-coordinate renderer.
- It is intentionally a flattened 2D common-plane model.

## Findings: `copernicus.html`

### What is already correct

#### 1. The core Kepler solver and orbit-position formulas are correct

Locations:

- `copernicus.html:447-470`

Why this is correct:

- `solveKepler()` uses Newton-Raphson iteration on the standard Kepler equation.
- `helioPosition()` uses the standard ellipse-in-focus parametrization.
- `displayPosition()` performs the correct relative-position subtraction for the chosen origin.

Local numerical check:

- Dense sampling of the current solver over all four planet eccentricities gave a maximum residual of about `4.44e-16` in the solved equation, which is far below any visible or educational threshold.
- With the current constants:
  - Mercury: `T^2 / a^3 ≈ 0.99964`
  - Venus: `T^2 / a^3 ≈ 1.00018`
  - Earth: `1.00000`
  - Mars: `1.00008`

That is exactly what a good approximate educational dataset should look like.

#### 2. The orbital constants are scientifically reasonable

Locations:

- `copernicus.html:334-340`

Assessment:

- The values are close to JPL/NASA public-reference values for the inner planets.
- Differences are at the expected rounding level for an educational simulator.
- Earth is effectively treated with Earth-Moon-barycenter-style orbital elements, which is acceptable at this scale.

Representative comparison against JPL Table 1 values:

- Mercury:
  - `a`: difference about `7.3e-7 AU`
  - `e`: difference about `3.6e-5`
- Venus:
  - `a`: difference about `3.6e-5 AU`
  - `e`: difference about `2.3e-5`
- Earth:
  - `a`: difference about `2.6e-6 AU`
  - `e`: difference about `1.1e-5`
- Mars:
  - `a`: difference about `1.0e-5 AU`
  - `e`: difference about `5.9e-6`

No orbital-constant rewrite is required for scientific integrity.

#### 3. The orbital guide ellipses are drawn correctly

Locations:

- `copernicus.html:530-544`

Why this is correct:

- The ellipse center is offset from the Sun by `c = a e` opposite perihelion.
- The semi-minor axis is `b = a sqrt(1 - e^2)`.
- The guides appear only in Sun-centered mode, where they are meaningful.

This matches the geometry of an ellipse with the Sun at a focus.

#### 4. The relative-position transform is mathematically correct for the displayed kinematics

Locations:

- `copernicus.html:473-476`

Why this is correct:

- For a translated, non-rotating frame, the displayed position is simply the vector difference between two heliocentric positions.
- The app correctly does not rotate the axes when switching center.

Important caveat:

- This is correct for displayed relative positions.
- It does not mean all selected-body frames are inertial frames for force-law calculations.

#### 5. The trail/time discretization is numerically reasonable

Locations:

- `copernicus.html:316-319`
- `copernicus.html:647-658`

Assessment:

- `TRAIL_SAMPLE_INTERVAL = 0.0005 years` and `MAX_TRAIL_POINTS = 10000` give `5 years` of trail coverage.
- The Earth-Mars synodic period from the current orbital periods is about `2.1352 years`, comfortably below that buffer.
- The sub-stepped trail recording also prevents Mercury’s path from becoming visibly under-sampled at higher speed multipliers.

This is a sound numerical choice for the educational goal.

### Issues to fix

#### C1. The copy currently conflates top-down relative paths with apparent retrograde motion on the sky

Severity: High

Locations:

- `copernicus.html:6-17`
- `copernicus.html:223`
- `copernicus.html:384-387`
- `copernicus.html:401-404`

What is wrong:

- The canvas is plotting relative `x/y` positions in a top-down orbital-plane view.
- The copy currently presents the Earth-centered loops too directly as “the famous retrograde loops.”
- That wording is incomplete scientifically.
- What ancient observers saw was angular motion against distant background stars in the sky.
- The current app shows the relative-motion geometry behind retrograde, not the literal apparent sky track.

Why this matters:

- A user can leave with the false picture that Mars literally draws looping paths around Earth in physical space.
- `COPERNICUS_REQ.md:60` explicitly says the app is not a literal sky-position map and that this caveat should be stated.

Required fix:

- Add an explicit note in both languages that this is:
  - a top-down ecliptic-plane view
  - of relative motion
  - not a literal sky chart
- Rephrase the retrograde explanation so it says the loops are the geometry behind retrograde behavior, not the exact observed sky path.
- Update metadata/subtitle wording so it does not imply the app is simply toggling between literal heliocentric and geocentric sky views.

Acceptance criteria:

- No user-facing copy implies the drawn loops are the literal observed tracks of planets against the stars.
- The info section explicitly distinguishes:
  - relative orbital-plane loops
  - retrograde motion on the sky

#### C2. The current wording overstates frame equivalence and is too strong dynamically

Severity: Medium

Locations:

- `copernicus.html:384-387`
- `copernicus.html:401-404`

What is wrong:

- The current text says there is no “wrong” reference-frame choice and that “the physics is identical — only the viewpoint changed.”
- For pure coordinate description of positions, that is mostly fine.
- For dynamics, it is too strong.
- Earth-, Mercury-, Venus-, and Mars-centered frames in this app are accelerating frames.
- If one tried to write Newtonian equations of motion in those frames, inertial/fictitious-force terms would appear.
- The code does not model those force laws; it only re-expresses positions.

Why this matters:

- The current copy risks teaching that all frames are equally simple not only geometrically but dynamically.
- The educational point should be about simplicity of description, not about all frames being physically interchangeable without qualification.

Required fix:

- Replace “There’s no wrong choice” with wording like:
  - “Any body can be chosen as the coordinate center, but some choices make the motion much simpler to describe.”
- Replace “The physics is identical — only the viewpoint changed” with wording like:
  - “The same planetary motion is being described in different coordinates; Sun-centered coordinates make the pattern simplest.”
- Keep the explanation child-friendly; do not add a long pseudo-force lecture unless the user asks for it.

Acceptance criteria:

- No copy claims full physical equivalence of the Sun-centered inertial description and the accelerated planet-centered descriptions.
- The framing is about coordinates and simplicity of description, not “identical physics” in every sense.

#### C3. The history note is not precise enough about Copernicus versus the later Keplerian model used here

Severity: Medium

Locations:

- `copernicus.html:386`
- `copernicus.html:403`

What is wrong:

- The current text can be read as:
  - Ptolemy used epicycles
  - Copernicus put the Sun at the center and made everything simple
  - Kepler later showed ellipses
- That misses an important scientific-historical distinction.
- The app actually renders a later Keplerian ellipse model.
- Copernicus’s own model still used circular constructions.
- `COPERNICUS_REQ.md:52` states this distinction explicitly and the current app copy should match it.

Why this matters:

- Without this clarification, the app can incorrectly attribute the ellipse model to Copernicus or imply he eliminated circular complexity completely.

Required fix:

- Revise the history paragraph so it explicitly says:
  - Copernicus moved Earth from the center and simplified the overall picture
  - his own model still used circles
  - Kepler later supplied the ellipse model used in this app

Acceptance criteria:

- The copy no longer implies that the exact ellipses drawn in the app are Copernicus’s original orbital model.

#### C4. The app does not explicitly state its model boundaries

Severity: Low to Medium

Locations:

- `copernicus.html:384-387`
- `copernicus.html:401-404`
- optional code-comment locations near `copernicus.html:461-476`

What is wrong:

- The implemented model is scientifically acceptable, but its scope is not made explicit.
- The app currently does not tell the user that it is:
  - approximate
  - 2D
  - common-plane
  - fixed-element
  - independent-ellipse
  - not a full ephemeris

Why this matters:

- Without a model note, users can over-read the display as more literal or precise than it is.
- Another agent trying to “fix” the app might waste effort replacing a mathematically correct teaching model that only needs better scientific framing.

Required fix:

- Add one short model note in the info text, for example:
  - “This is an approximate 2D model of inner-planet motion in the ecliptic plane using fixed Keplerian ellipses.”
- Optionally add a succinct developer comment near `helioPosition()` or `displayPosition()` stating the same boundary.

Acceptance criteria:

- The user-facing copy states that the app is an approximate 2D Keplerian model.
- A future maintainer can tell, from the file itself, that full 3D ephemeris realism is intentionally out of scope.

## Suggested replacement copy

Another agent can use this directly or adapt it.

### Suggested English subtitle

`Choose a reference body to compare simple Sun-centered ellipses with more complex relative paths.`

### Suggested Polish subtitle

`Wybierz ciało odniesienia i porównaj proste elipsy heliocentryczne z bardziej złożonymi torami względnymi.`

### Suggested English info text

`<b>What is a reference frame?</b> It is a coordinate choice: you decide which body stays at the center while the others are described relative to it. Any body can be chosen, but some choices make the motion much simpler to describe.`  
`<br><br><b>What you are seeing:</b> This is an approximate top-down 2D model of the planets in the ecliptic plane. The planets move on independent Keplerian ellipses with fixed orbital elements. This is not a literal map of how planets move against the background stars in the sky.`  
`<br><br><b>Try this:</b> Start with the Sun at the center and turn on trails. You will see clean ellipses. Switch to Earth and Mars will draw looping relative paths. Those loops are not Mars literally circling Earth in space; they show the relative-motion geometry behind retrograde motion as Earth overtakes Mars.`  
`<br><br><b>Historical idea:</b> Ptolemy described the planets from Earth using epicycles. Copernicus moved Earth from the center and made the overall pattern easier to understand, although his own model still used circles. Kepler later showed that planetary orbits are ellipses, and that later Keplerian model is what this app uses.`  
`<br><br>Trails are cleared when you switch center because each trail only makes sense in the current reference frame.`

### Suggested Polish info text

`<b>Czym jest układ odniesienia?</b> To wybór współrzędnych: decydujesz, które ciało pozostaje w centrum, a ruch pozostałych opisujesz względem niego. Można wybrać dowolne ciało, ale niektóre wybory dają znacznie prostszy opis ruchu.`  
`<br><br><b>Co tu widać:</b> To przybliżony, dwuwymiarowy model z góry, w płaszczyźnie ekliptyki. Planety poruszają się po niezależnych elipsach Keplerowskich o stałych elementach orbitalnych. To nie jest dosłowna mapa tego, jak planety przesuwają się na niebie względem gwiazd tła.`  
`<br><br><b>Spróbuj:</b> Zacznij ze Słońcem w centrum i włącz ślady. Zobaczysz czyste elipsy. Przełącz na Ziemię, a Mars zacznie rysować zapętlone tory względne. Te pętle nie oznaczają, że Mars naprawdę krąży wokół Ziemi; pokazują geometrię ruchu względnego, która prowadzi do retrogradacji, gdy Ziemia wyprzedza Marsa.`  
`<br><br><b>Idea historyczna:</b> Ptolemeusz opisywał planety z perspektywy Ziemi za pomocą epicykli. Kopernik usunął Ziemię z centrum i dzięki temu ogólny obraz stał się prostszy, choć jego własny model nadal używał okręgów. Dopiero Kepler pokazał, że orbity planet są elipsami, i to właśnie tego późniejszego modelu Keplerowskiego używa ta aplikacja.`  
`<br><br>Ślady są czyszczone po zmianie centrum, bo każda ścieżka ma sens tylko w bieżącym układzie odniesienia.`

## Recommended implementation order

1. Fix the explanatory copy in `I18N.en.info`, `I18N.pl.info`, and the subtitle/meta strings first.
2. Add the explicit top-down/relative-motion caveat.
3. Remove the “identical physics” overclaim and replace it with coordinate-language wording.
4. Add the model-boundary note.
5. Leave the core orbit solver and relative-position math unchanged.

## Acceptance tests another agent should run after the fixes

- Verify that the orbital equations in `solveKepler()`, `helioPosition()`, and `displayPosition()` are unchanged unless the user explicitly asks for a new physical model.
- Verify that the info text in both languages now states:
  - top-down view
  - approximate 2D model
  - relative motion rather than literal sky tracks
  - Copernicus-versus-Kepler distinction
- Verify that no user-facing string still says:
  - “the physics is identical”
  - or the equivalent Polish wording claiming identical physics
- Verify that the subtitle/meta description no longer imply the app is only a literal heliocentric/geocentric sky-view toggle.
- Smoke-test the current app to confirm:
  - Sun-centered view still shows clean ellipses
  - Earth-centered view still shows Mars loops
  - trails still clear on center change

## Sources consulted

- JPL Solar System Dynamics, `Approximate Positions of the Planets`
  - https://ssd.jpl.nasa.gov/planets/approx_pos.html
- NASA NSSDC, `Planetary Fact Sheet - Metric`
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- NASA NSSDC, `Mars Fact Sheet`
  - https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- NASA APOD, `Retrograde Mars`
  - https://apod.nasa.gov/apod/ap031216.html
- NASA, `Accelerated Frames of Reference: Inertial Forces`
  - https://pwg.gsfc.nasa.gov/stargaze/Sframes2.htm
- JPL NAIF, `Reference Frames`
  - https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/FORTRAN/req/frames.html
- Local project requirements:
  - `COPERNICUS_REQ.md`

## Bottom line

- The orbital math in `copernicus.html` is good.
- The main fixes are to scientific wording, not to the solver.
- Another agent should treat the current model as a correct approximate 2D Keplerian teaching model and focus on making the explanatory text scientifically precise.
