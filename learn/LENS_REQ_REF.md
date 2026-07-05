# Gravitational Lens Simulator: Refined Requirements

Reference implementation: `gravlens.html`

## 1. Purpose

This document refines the raw requirements from `LENS_REQ` into an implementation-oriented specification for a coding agent.

The current application is a single-file HTML simulator that:

- shows a side-view diagram with an observer, a lens plane, a source star, and optional ray paths,
- shows an observer-facing circular render of the lensed source,
- supports two lens types: `blackhole` and `star`,
- lets the user change lens mass, source size, source vertical offset, and ray visibility,
- has a separate `Lens ON/OFF` toggle that disables all lensing effects without changing mass.

The requested change is a simplification of the simulator model and UI:

- keep only the black hole as the lens type,
- remove the explicit lens on/off control,
- interpret `mass = 0` as "no black hole / no lensing".

The goal is to make the app conceptually simpler while preserving the current educational interaction pattern.

## 2. Scope

In scope:

- changes inside `gravlens.html`
- UI simplification related to lens selection and lens toggling
- state-model simplification so lens presence is derived from mass
- updated rendering and explanatory text for the zero-mass case

Out of scope unless needed for implementation:

- adding new physics features
- changing the overall page layout beyond what is required by the removed controls
- restructuring the app into multiple files

## 3. Current Baseline

The implementation agent should understand the current behavior before making changes.

### 3.1 Current UI

The control panel currently contains:

- a lens type toggle with `Black hole` and `Star`,
- a `Mass` slider with range `1..50`,
- a `Source size` slider,
- a `Lens ON` toggle button,
- a `Rays` toggle button,
- an info text area.

### 3.2 Current State Model

The current `state` object includes:

- `lensType`
- `mass`
- `sourceY`
- `sourceSize`
- `lensOn`
- `showRays`

The current implementation uses both `lensType` and `lensOn` to decide what to render and how physics behaves.

### 3.3 Current Physics/Rendering Dependence

The current lensing behavior depends on:

- `einsteinRadius()`, which returns `0` when `lensOn` is false and otherwise scales as `sqrt(mass)`,
- side-view rendering, which conditionally draws the Einstein-radius guide, lens body, and ray deflection,
- observer-view rendering, which conditionally draws the black hole or star and applies deflection,
- `updateInfo()`, which shows "No lens" when `lensOn` is false and otherwise describes alignment/lensing regimes.

## 4. Functional Requirements

### 4.1 Remove the Star Lens Type

The simulator must no longer expose or support `star` as a selectable lens type.

Required outcomes:

- Remove the `Star` button from the UI.
- Remove the `Black hole / Star` toggle group from the control panel entirely if only one fixed lens type remains.
- Treat the simulator conceptually as a black-hole lens simulator only.
- Remove star-specific rendering branches from both the side view and observer view.
- Remove state and helper logic that exists only to support multiple lens types.

Implementation guidance:

- `lensType` should be removed from state unless the implementing agent has a strong code-structure reason to keep it as a fixed internal constant.
- If kept internally, it must not remain user-configurable and must behave as permanently `blackhole`.

### 4.2 Remove the Separate Lens ON/OFF Control

The dedicated `Lens ON/OFF` button must be removed from the UI.

Required outcomes:

- Remove the `Lens ON` / `Lens OFF` toggle button from the control panel.
- Remove the independent `lensOn` user interaction.
- Remove state-update logic tied to `toggleLens()`.

Behavioral replacement:

- Lens presence must be derived entirely from the mass value.
- `mass > 0` means the black hole exists and lensing is active.
- `mass = 0` means there is no black hole and no lensing effect.

Implementation guidance:

- The implementation should not maintain a second independent boolean that can disagree with mass.
- Any helper that currently checks `state.lensOn` should be refactored to check an equivalent derived condition such as `state.mass > 0`.

### 4.3 Mass Slider Must Support the Zero-Mass State

The mass control must allow the user to set mass to zero.

Required outcomes:

- Change the mass slider minimum from `1` to `0`.
- Ensure the visible mass readout also displays `0`.
- Ensure the zero-mass state is reachable through the existing UI on both desktop and touch devices.

Behavior at `mass = 0`:

- Einstein radius must evaluate to zero.
- No gravitational deflection must be applied.
- The black hole body must not be drawn.
- Any black-hole-specific glow/shadow/accretion visual must not be drawn.
- The observer must see the direct unlensed source image.
- The side-view diagram must show the source without a lens object.
- If rays are enabled, they should appear as straight non-deflected rays or otherwise behave consistently with the existing no-lens logic.

### 4.4 Zero Mass Is the New "Lens Off" Case

The previous conceptual case "`Lens OFF`" must now be represented by `mass = 0`.

Required outcome:

- All behavior that previously depended on `lensOn = false` must now occur when `mass = 0`.

This includes at minimum:

- `einsteinRadius()` returning `0`,
- no deflection in the observer view,
- no lens body in the side view,
- no lens body in the observer view,
- no Einstein-radius guide ring,
- informational text equivalent to the current "No lens" state.

Implementation note:

- The raw requirement says: if the user sets mass to `0`, the black hole disappears and that corresponds to the old `Lens off` case.
- The implementation should therefore preserve the no-lens educational behavior, but without a separate toggle.

### 4.5 Update Informational and Explanatory Text

User-facing text must stay consistent with the simplified model.

Required outcomes:

- Remove text that implies multiple lens types if such text is added or currently present in controls.
- Update info/status logic so the no-lens message is driven by `mass = 0`, not by a removed `lensOn` toggle.
- Keep the alignment/lensing descriptions for nonzero mass.

Recommended text behavior:

- For `mass = 0`: show a direct-view / no-lens message.
- For very small but nonzero mass: keep the existing "negligible mass" style message or equivalent.
- For alignment cases with nonzero mass: preserve the Einstein ring / arcs / multiple images messaging.

### 4.6 Preserve Existing Interactions Not Mentioned in the Raw Requirement

The following features should remain unless they need minor UI adjustment because of the removed controls:

- dragging the source star vertically in the side view,
- the `Source size` slider,
- the `Rays` toggle,
- the side-view and observer-view dual visualization,
- the current black-hole lensing model and visual style.

The implementing agent should not treat this requirement as a request for a broader redesign.

## 5. State and Logic Refactoring Requirements

The app should be simplified so the UI model and the simulation model cannot drift apart.

Required refactoring direction:

- Remove `toggleLens()` and its event binding.
- Remove `setLensType()` and its event binding if lens type is no longer selectable.
- Remove `lensOn` from state.
- Remove `lensType` from state unless retained as a fixed constant for code readability.

Recommended derived helper:

- introduce a single derived condition such as `hasLens = state.mass > 0`.

All rendering, physics, and info-text branches should use that derived condition consistently.

## 6. UI and Layout Expectations

Removing controls will change the control column layout. The implementation should keep the panel visually balanced.

Required outcomes:

- No empty placeholder space where the removed lens-type and lens-on/off controls used to be.
- Remaining controls should continue to look intentional on desktop and mobile.
- The responsive layout must still work at the current mobile breakpoint.

Non-requirement:

- There is no need to redesign the whole page just because the control panel becomes shorter.

## 7. Acceptance Criteria

The implementation should be considered complete only if all of the following are true:

- There is no visible UI for choosing `Star`.
- There is no visible `Lens ON/OFF` button.
- The mass slider can be set to `0`.
- At `mass = 0`, no black hole is rendered in either view.
- At `mass = 0`, no lensing distortion is visible in the observer view.
- At `mass = 0`, the info text communicates the no-lens/direct-view state.
- At any `mass > 0`, black-hole lensing still works and the current core educational behaviors remain visible.
- Rays mode still works after the refactor.
- Dragging the source still works after the refactor.
- No obsolete star-specific or independent-lens-toggle behavior remains reachable.

## 8. Non-Goals

This requirements set does not ask for:

- new astrophysics,
- new controls,
- localization,
- content changes in `index.md`,
- broader visual redesign beyond what is necessary after removing controls.

## 9. Physics Review of the Current Implementation

This section documents what the current `gravlens.html` physics gets basically right, what is merely simplified, and what is actually misleading or incorrect enough that an implementation agent should correct it.

The review below is based on the current code structure in:

- `einsteinRadius()`
- `deflect(ox, oy, thetaE)`
- `drawSideView()`
- `drawObserverView()`
- `updateInfo()`

### 9.1 External Physics Basis Used for This Review

The review was cross-checked against standard point-mass gravitational lensing references and black-hole explanatory material:

- Swinburne COSMOS, "Schwarzschild Lens"
  - https://astronomy.swin.edu.au/cosmos/Schwarzschild+Lens
- NASA Science, "Hubble's Gravitational Lenses"
  - https://science.nasa.gov/mission/hubble/science/universe-uncovered/hubbles-gravitational-lenses/
- NASA Science, "Black Hole Anatomy"
  - https://science.nasa.gov/universe/black-holes/anatomy/
- NASA Imagine the Universe, black hole overview
  - https://imagine.gsfc.nasa.gov/science/objects/black_holes1.html

Relevant physical facts from those sources:

- A point-mass lens is well approximated by the Schwarzschild lens model.
- In dimensionless form, the lens equation is `y = x - 1/x`.
- A point-mass lens produces two images for an off-axis source, and an Einstein ring for perfect alignment.
- The Einstein radius scales as `sqrt(M * D_ls / (D_l * D_s))`, not with mass alone in isolation.
- A black hole's event horizon and its shadow are not the same thing as a generic Einstein ring from a distant background source.

### 9.2 What the Current App Gets Basically Right

The observer-view core is a reasonable educational thin-lens model for a point-mass lens.

What is basically correct:

- The app uses an inverse ray-tracing approach from image plane to source plane.
- The deflection law implemented in `deflect()` is the standard dimensionless point-mass lens mapping:
  - `beta = theta - theta_E^2 * theta / |theta|^2`
- Perfect alignment produces a ring.
- Small source offsets produce arcs or nearly circular images.
- Larger source offsets produce two separated images.
- Using a finite source disc instead of a point source is a good educational choice because it naturally turns the two point images into arcs/rings with finite thickness.

Conclusion:

- The app is not using completely wrong lensing physics.
- The main observer-view lens equation is close to the standard Schwarzschild point-lens model.

### 9.3 Acceptable Simplifications

The following are simplified, but acceptable if clearly understood as educational approximations:

- The app omits explicit lens and source distances and treats them as fixed implicit constants.
- The app uses arbitrary screen-space units instead of physical angular units.
- The app uses a toy finite source with uniform brightness and simple limb darkening.
- The side view uses a thin-lens style "bend at the lens plane" diagram instead of tracing full null geodesics through curved spacetime.

These are acceptable for a child-friendly simulator if the implementation remains internally consistent.

### 9.4 Physics Mistakes or Misleading Behaviors That Should Be Corrected

#### 9.4.1 The app conflates point-mass gravitational lensing with direct black-hole imaging

Current behavior:

- The observer view ray-traces a background source through a point-mass lens.
- After that, the app draws a central black-hole visual and glow in the observer view.
- The side view also draws a visible black hole body and orange glow as if the lens itself is directly seen.

Why this is a problem:

- For the current educational scenario, the lensing problem is "distant source behind a compact mass."
- In that problem, the lens is best modeled as a transparent point mass that bends light.
- A black hole's event horizon shadow is a different phenomenon from the ordinary Einstein ring of a distant background source.
- NASA's black-hole anatomy material distinguishes:
  - the event horizon,
  - the shadow,
  - lensing of light from surrounding accretion structures.
- The current app visually merges these ideas into one picture.

Observed consequence:

- The user can read the central black disk as if the lens itself is always visibly blocking the source.
- The app suggests that a normal gravitational-lensing view of a distant source should include a visible black central object and glow.
- The inner lensed image can be hidden or visually suppressed by the drawn black disk even though the point-lens model itself would still produce image structure there.

Required correction:

- The implementation should choose one model and present it consistently.

Preferred correction for this app:

- Keep the simulator as a point-mass gravitational lens simulator.
- In the observer view, do not draw an opaque black-hole body by default.
- Treat the lens as invisible except for optional subtle guides such as the center marker or Einstein-radius guide.

Alternative acceptable correction:

- Keep the central black-hole visual only as an explicitly non-physical diagram marker.
- If this path is chosen, it should not obscure the lensed source image and should be visually labeled as schematic.

Strong recommendation:

- Do not combine strong-lensing background-source imagery with a pseudo-EHT-style black-hole shadow unless the app is intentionally redesigned into a different simulation mode.

#### 9.4.2 The current black-hole shadow size scaling is physically wrong

Current behavior:

- The observer view computes a visual "Schwarzschild radius" as `sqrt(state.mass) * 2.5`.
- The side view uses a fixed black-hole body radius of `12`, independent of mass.

Why this is wrong:

- For a fixed observing geometry, a black hole's horizon scale is proportional to mass, not to `sqrt(mass)`.
- NASA's black-hole material describes the event horizon radius as the Schwarzschild radius, which is directly tied to the mass.
- By contrast, the Einstein radius of a point lens scales with `sqrt(mass)` when the lens-source geometry is fixed.
- The current code incorrectly makes the black-hole shadow follow the Einstein-radius scaling.
- The side view and observer view also disagree with each other about how black-hole size depends on mass.

Observed consequence:

- Increasing mass changes the lensed image size and the black center in the same `sqrt(mass)` way, which incorrectly suggests they are the same physical scale.
- The fixed-radius side-view black hole and variable observer-view shadow produce inconsistent mass behavior across the two views.

Required correction:

- If the observer view keeps a physically motivated black-hole shadow, its angular size must be parameterized separately from the Einstein radius.
- That shadow scale must not be derived from `theta_E`.
- If distances remain implicit, the implementation must still preserve the distinction:
  - Einstein radius: scales as `sqrt(M)` for fixed geometry,
  - horizon/shadow scale: scales as `M` for fixed geometry.

Preferred practical correction:

- Remove the black-hole shadow from the observer view entirely.
- Keep the app focused on point-mass lensing, where the key visible structure is the lensed background source.

#### 9.4.3 The side-view ray diagram is only schematic, but is presented as if it were the actual light-path solution

Current behavior:

- `drawSideView()` draws about 50 rays connecting source -> lens plane -> observer.
- Rays are sampled across many impact parameters.
- Brightness is increased for rays whose outgoing segment lands closer to the observer position.

Why this is physically misleading:

- A point-mass lens does not send a continuous fan of equally relevant image-forming rays to the observer.
- For an off-axis source, the point-lens equation gives two image directions, `x_+` and `x_-`.
- For perfect alignment, those directions merge into a ring.
- The current side view is therefore not showing "the actual rays the observer sees"; it is showing a schematic family of trial rays.

Observed consequence:

- The user may infer that many distinct rays from many impact parameters are all simultaneously observed.
- The diagram visually suggests a broad continuum of equally valid bent paths instead of the discrete image solutions of the thin-lens equation.

Required correction:

- The implementation should make the side-view physics more faithful.

Preferred correction:

- Compute the actual image solutions from the point-lens equation for the current source offset.
- Draw only the corresponding physical light paths that reach the observer.
- In the aligned case, render a symmetric family or a ring-equivalent representation to communicate the Einstein ring.

Alternative acceptable correction:

- Keep the fan of sampled rays, but explicitly label it as a schematic visualization of bending, not as the literal set of observed image paths.

#### 9.4.4 The automatic observer-view zoom hides the real dependence of image separation on mass

Current behavior:

- `drawObserverView()` computes an adaptive `fov`.
- When the outer image would otherwise extend too far, the app zooms out automatically.
- The Einstein-radius guide and the lensed image are both then drawn after dividing by `fov`.

Why this is a problem:

- In real lensing, changing lens mass changes the angular separation of the images on the sky.
- The current auto-zoom keeps the result visually contained, but also hides part of that relationship from the user.
- This is not a pure rendering detail; it changes the educational message of the mass slider.

Observed consequence:

- Large mass does not always look like a much larger Einstein ring on screen because the camera rescales to fit it.
- The user may conclude that mass mostly changes shape or brightness, rather than image separation.

Required correction:

- The default observer view should use a fixed angular scale so that image separation visibly grows with lens strength.

Acceptable enhancement:

- A manual zoom control can be added later if needed.
- If any automatic fit behavior is retained, it should be optional or clearly indicated to the user.

#### 9.4.5 The singularity guard in `deflect()` is mathematically wrong

Current behavior:

- When `r2 < 0.01`, `deflect()` returns the input point unchanged.

Why this is wrong:

- The point-mass lens equation is singular at the exact center.
- Mapping the center region to "no deflection" is not a physical limit of the lens equation.
- It is only a numerical escape hatch.

Observed consequence:

- The code can create an artificial unlensed region at the center of the image plane.
- In some configurations this may suppress or distort the expected central behavior.
- The problem is partly hidden by the app's black-hole disk overlay, but it remains a model defect.

Required correction:

- Replace the identity fallback with a numerically safe but physically motivated handling strategy.

Acceptable strategies:

- clamp to a minimum radius epsilon while preserving the correct deflection direction,
- analytically treat the center pixel as unresolved/saturated rather than unlensed,
- if a separate non-physical center marker is retained, skip rendering inside that marker instead of claiming zero deflection there.

Recommendation:

- Use `r = max(r, epsilon)` in the denominator rather than returning the original coordinates.

#### 9.4.6 The mass slider is presented as literal mass, but the geometry dependence of the Einstein radius is hidden

Current behavior:

- `einsteinRadius()` depends only on `sqrt(mass)`.
- The app exposes a `Mass` slider but no source/lens distance controls or stated fixed geometry.

Why this is only partly wrong:

- If the simulator is understood as "vary mass while keeping all distances fixed," then `theta_E ∝ sqrt(M)` is a valid simplification.
- However, the current UI does not communicate that these distances are being held fixed implicitly.
- That makes it easy for a user or future coder to misread the control as a fully physical mass parameter.

Observed consequence:

- The mass control can be interpreted too literally.
- Users are not told that the Einstein radius also depends on observer-lens-source geometry.

Required correction:

- The implementation should make the simplification explicit.

Acceptable approaches:

- keep the control but clarify in UI/help text that geometry is fixed and the slider changes lens mass only within that fixed setup,
- or rename the control to something like `Lens strength`.

Recommendation:

- If the project wants to stay educationally honest without adding more controls, add a short explanatory note rather than expanding the simulator geometry.

### 9.5 Issues That Are Not Necessarily Bugs

The following should not automatically be treated as mistakes:

- The use of arbitrary screen units instead of arcseconds.
- The use of only one source-position degree of freedom (`sourceY`) because the setup is rotationally symmetric around the optical axis.
- The omission of relativistic higher-order photon-ring images near the black hole.
- The use of a finite circular source with soft edges instead of a realistic stellar intensity model.

These are reasonable simplifications for the app's scope.

### 9.6 Recommended Correct Physics Model for This App

To keep the simulator educational, simple, and internally consistent, the preferred implementation target is:

1. Keep a thin-lens point-mass model for the observer view.
2. Treat the lens as an invisible compact mass in the observer view.
3. Use the standard point-lens equation consistently for rendering and explanatory text.
4. Use a fixed observer-view angular scale by default so mass visibly changes image separation.
5. Replace the side-view sampled-ray fan with either:
   - true image-forming rays derived from the lens equation, or
   - a clearly labeled schematic version.
6. If any black-hole icon remains, treat it as a diagram marker rather than as an occulting physical object.
7. If a visible black-hole shadow is retained, parameterize it independently from the Einstein radius and make clear that it represents a different physical phenomenon.

### 9.7 Priority of Physics Corrections

Highest-priority corrections:

- stop obscuring the lensed image with a pseudo-physical black-hole shadow,
- remove or fix the incorrect shadow scaling,
- eliminate the misleading auto-zoom as the default educational view,
- replace the singularity identity fallback.

Medium-priority correction:

- make the side-view rays represent actual image solutions or explicitly label them as schematic.

Low-priority correction:

- clarify in UI copy that the lens-source geometry is fixed implicitly if the control continues to be called `Mass`.

## 10. Side-View Physics Audit and Implementation Guidance

This section reviews the current side-view diagram specifically and gives an implementation-ready path for correcting it.

## 10.1 What the Current Side View Is Doing

The current side view is not derived from the same solved image geometry as the observer view.

Current implementation summary:

- The observer is placed at a fixed left position.
- The lens plane is placed at a fixed middle position.
- The source is placed at a fixed right position with vertical offset controlled by `state.sourceY`.
- When `showRays` is enabled, the app samples many trial rays across the lens plane.
- For each sampled ray:
  - it draws a straight incoming segment from source to lens plane,
  - applies a deflection "kick" at the lens plane,
  - draws a straight outgoing segment toward the observer side.
- Rays are made brighter when they happen to arrive closer to the observer’s vertical position.

This is a schematic thin-lens illustration, not a true rendering of the actual image-forming solutions.

## 10.2 What Is Physically Wrong or Misleading in the Current Side View

### 10.2.1 It draws trial rays instead of the actual observed rays

In the thin-lens model, the relevant side-view paths are the image solutions that satisfy the lens equation.

For a point-mass lens:

- an off-axis source produces two image angles,
- a perfectly aligned source produces a degenerate Einstein ring,
- those image directions are the actual observer-visible solutions.

The current fan-of-rays display instead samples many impact parameters and then highlights near-misses. That is useful as a rough intuition aid, but it is not the same thing as the image solution.

Problem for the future implementation agent:

- The observer view already computes the point-lens mapping correctly enough to show two images/arcs/rings.
- The side view should not contradict that by implying that the observer simultaneously receives a broad continuum of equally valid path families.

### 10.2.2 The deflection in the side view is not derived from the actual thin-lens image positions

Current behavior:

- the ray fan uses a sampled lens-plane height `b`,
- it computes a deflection proportional to `theta_E^2 / (bAbs * distObsLens)`,
- it then builds an outgoing line from that deflected slope.

Why this is not the best formulation:

- It is built around arbitrary screen distances and arbitrary sampled intercepts.
- It does not explicitly solve the lens equation for the current source position.
- Therefore the side view is not guaranteed to remain consistent with the observer-view images if the observer-view implementation evolves.

### 10.2.3 The side view hides the fact that a point-mass lens has discrete image solutions

For a source at angular offset `beta`, the point-lens solutions are:

- `theta_+ = 0.5 * (beta + sqrt(beta^2 + 4 * theta_E^2))`
- `theta_- = 0.5 * (beta - sqrt(beta^2 + 4 * theta_E^2))`

These correspond to two image directions on opposite sides of the lens.

The current side view does not expose that structure clearly. Instead, it suggests "more rays" rather than "two image branches."

### 10.2.4 The current diagram can mis-teach where the Einstein ring comes from

For perfect alignment:

- the two image solutions merge at `|theta| = theta_E`,
- by axial symmetry this becomes a ring in the observer’s 2D sky.

The current side-view fan may suggest that the ring comes from many arbitrary bright rays crossing the lens plane, rather than from the degeneracy of the two point-lens solutions under rotational symmetry.

That is a pedagogy problem, not just a rendering issue.

## 10.3 Recommended Correct Side-View Model

The preferred side view should be derived from the same thin-lens geometry as the observer view.

Recommended conceptual model:

1. Treat the side view as a 2D meridional cross-section through the axis.
2. Represent only the physically relevant image branches.
3. Compute image angles from the point-lens equation.
4. Convert those image angles into line intersections with the lens plane.
5. Draw one incoming and one outgoing segment for each image solution.

Important interpretation note:

- A 2D side view cannot literally show the full Einstein ring.
- In the aligned case it should show the ring as a special symmetric limit, not as a random dense fan of rays.

## 10.4 Recommended Geometry and Formulas

Keep the current screen layout idea:

- observer at `x = xObs`
- lens plane at `x = xLens`
- source plane at `x = xSrc`
- optical axis at `y = yAxis`

Define:

- `D_l = xLens - xObs`
- `D_ls = xSrc - xLens`
- `D_s = xSrc - xObs`

Let the source-plane vertical offset in screen units be:

- `ySource = state.sourceY * sourceOffsetScale`

Define the source angle relative to the observer:

- `beta = ySource / D_s`

Let `thetaE` be the current Einstein angular scale in screen-angle units.

The physically relevant image angles are then:

- `thetaPlus = 0.5 * (beta + sqrt(beta*beta + 4*thetaE*thetaE))`
- `thetaMinus = 0.5 * (beta - sqrt(beta*beta + 4*thetaE*thetaE))`

From each image angle, derive the corresponding lens-plane intercept:

- `yLensPlus = yAxis + thetaPlus * D_l`
- `yLensMinus = yAxis + thetaMinus * D_l`

For the source location at the source plane:

- `ySrcScreen = yAxis + ySource`

Then draw, for each image branch:

- outgoing segment: observer -> `(xLens, yLens±)`
- incoming segment: `(xLens, yLens±)` -> `(xSrc, ySrcScreen)`

This creates a side-view path that is consistent with the solved image direction.

## 10.5 How to Handle Source Size in the Side View

The current observer view supports a finite source radius. The side view does not need to ray-trace the full extended source to be useful.

Preferred approach:

- Use the source center to compute the two principal image branches.
- Render those as the canonical rays.
- Optionally add a faint thickness band or a small family of neighboring rays sampled across the source radius.

Important constraint:

- If neighboring rays are added to show finite source size, they must be generated around the actual solved image branches.
- They must not revert to the old unrestricted fan of arbitrary trial rays.

## 10.6 How to Handle the Perfect-Alignment Case

When `beta ≈ 0`, the usual two-branch picture becomes degenerate.

In the observer view:

- this should still appear as an Einstein ring.

In the side view:

- do not pretend the ring is a single ordinary ray.
- instead show a special alignment representation.

Preferred options:

- show two symmetric branch rays at `theta = +theta_E` and `theta = -theta_E`,
- add a label or subtle annotation indicating that these represent a ring in the full 2D observer view,
- keep the Einstein-radius guide circle in the observer view as the main visualization of the ring itself.

This is the most honest way to use a 2D cross-section for a rotationally symmetric 3D effect.

## 10.7 How to Keep the Side View Consistent with the Observer View

The side view and observer view should be driven from the same solved quantities.

Required guidance:

- Do not compute side-view ray geometry with an independent ad hoc formula if the observer view is using the point-lens equation.
- Derive both views from the same:
  - source offset `beta`
  - Einstein scale `theta_E`
  - image solution angles `theta_+`, `theta_-`

This avoids drift between:

- what the observer view claims is visible,
- and what the side-view rays imply physically.

## 10.8 Implementation Pseudocode

The following pseudocode describes the preferred side-view replacement.

```js
function hasLens() {
  return state.mass > 0;
}

function getLensGeometry() {
  const xObs = 60;
  const xLens = sideW * 0.45;
  const xSrc = sideW - 80;
  const yAxis = sideH / 2;

  const Dl = xLens - xObs;
  const Dls = xSrc - xLens;
  const Ds = xSrc - xObs;

  const ySource = state.sourceY * (sideH * 0.4);
  const ySrcScreen = yAxis + ySource;

  return { xObs, xLens, xSrc, yAxis, Dl, Dls, Ds, ySource, ySrcScreen };
}

function solveImageAngles(beta, thetaE) {
  if (thetaE <= 0) return [];

  const disc = Math.sqrt(beta * beta + 4 * thetaE * thetaE);
  return [
    0.5 * (beta + disc),
    0.5 * (beta - disc),
  ];
}

function drawPhysicalSideRays(ctx) {
  const g = getLensGeometry();

  if (!hasLens()) {
    drawDirectUnlensedPath(ctx, g);
    return;
  }

  const thetaE = einsteinRadiusAngular(); // angular or angle-like quantity
  const beta = g.ySource / g.Ds;
  const imageAngles = solveImageAngles(beta, thetaE);

  for (const theta of imageAngles) {
    const yLens = g.yAxis + theta * g.Dl;

    drawSegment(ctx, g.xObs, g.yAxis, g.xLens, yLens);
    drawSegment(ctx, g.xLens, yLens, g.xSrc, g.ySrcScreen);
  }

  if (Math.abs(beta) < alignmentThreshold) {
    drawAlignmentAnnotation(ctx, g, thetaE);
  }
}
```

Implementation note:

- `einsteinRadiusAngular()` should be an angular or normalized-angle quantity used consistently in both views.
- If the current `einsteinRadius()` remains in pixel-radius units for the observer canvas, the implementation agent should refactor that into a view-independent lens-strength quantity and derive each view's pixel scaling from it.

## 10.9 If the Existing Fan-of-Rays Visualization Is Kept

If the project wants to keep the fan of rays for educational style reasons, it must be reframed explicitly as a schematic.

Minimum requirements in that case:

- do not describe those sampled rays as the actual observed image paths,
- visually distinguish them from the true image-forming rays,
- also draw the two solved physical image rays prominently on top,
- update the info/help text to say that the faint fan is only illustrating how gravity bends nearby paths.

This is less preferred than replacing the fan entirely, but it would still be a major improvement over the current ambiguous presentation.

## 10.10 Side-View Acceptance Criteria

The side-view correction should be considered complete only if:

- the side view is derived from the same point-lens solution as the observer view,
- an off-axis source produces two explicit image-ray branches,
- near alignment produces a symmetric special case that is explained as the 2D cross-section of an Einstein ring,
- the no-lens case shows a direct path with no deflection,
- the side view no longer implies that the observer receives a broad arbitrary continuum of equally valid image rays,
- any retained schematic ray fan is clearly secondary and clearly labeled as schematic.
