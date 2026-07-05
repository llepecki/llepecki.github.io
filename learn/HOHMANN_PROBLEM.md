# Hohmann Transfer Game — Smooth Trajectory Problem

## The Goal
When the player executes a "good" transfer (launches within the window, burns within the green zone), the trail should be a **smooth arc from the home planet to the exact center of the destination planet**. No kinks, no orbit crossings, no visible gaps.

## Current Simplified Mechanics (as of this session)
- Player only controls WHEN to launch (within the transfer window)
- If burn1 is in the green zone, the game auto-corrects to the ideal value (`state.burn1Good = true`)
- Burn2 is automatic (no player interaction) — fires when the SC reaches the destination
- Bad burns (outside green zone) use real physics → diverging orbit → timeout → miss

## The Fundamental Problem

The game uses a **hybrid model**: planets orbit on **eccentric Keplerian ellipses** (realistic), but the Hohmann transfer reference values (`computeHohmannRef`) are computed assuming **circular orbits** (using semi-major axes `home.a`, `dest.a`).

This means:
1. `ref.dv1` targets `dest.a` (e.g., 1.524 AU for Mars), but Mars's actual orbital radius varies from 1.38 to 1.67 AU due to eccentricity (e=0.093)
2. The drawn Mars orbit (red ellipse) has varying radius at each angle
3. Any transfer orbit computed from fixed reference values will mismatch the actual planet orbit geometry

## Approaches Tried and Why They Failed

### Attempt 1: Compute actual dv from real planet radii
- Computed `r1` (home actual radius), `r2` (dest predicted radius at arrival)
- Used `a_T = (r1 + r2) / 2`, `v_dep = sqrt(μ(2/r1 - 1/a_T))`
- **Problem**: The transfer orbit reaches `r2` at its apoapsis angle (launch + 180°), but Mars's orbit at THAT angle has a different radius due to eccentricity. The trail crosses Mars's orbit at intermediate angles.

### Attempt 2: Parametric arc with Hohmann radial profile
- Instead of Keplerian propagation, defined an arc from P1 (launch) to P2 (predicted planet position)
- Used Hohmann-shaped radius profile (`r = a(1 - e·cos(E))`) with angular interpolation
- **Problem**: Same issue — the Hohmann radial profile is symmetric (periapsis→apoapsis), but Mars's orbit has its own eccentric shape at different angles. The arc still crosses Mars's drawn orbit at intermediate angles.

### Attempt 3: Interpolate between actual orbit radii
- At each angle α along the arc: `r = r_home(α) + f · (r_dest(α) - r_home(α))`
- Where `f = (1 - cos(ν)) / 2` (smooth 0→1 sigmoid)
- **Theory**: Cannot cross either orbit by definition since r is always between them
- **Problem**: Still produced visible kinks. Root cause unclear — possibly the closest-approach snap was triggering mid-arc, or the angular interpolation wasn't producing the expected visual.

### Attempt 4: Arc-completion-based snap (no distance detection)
- Changed checkArrival to snap only when `tFrac >= 1` (arc complete)
- Eliminated premature distance-based triggering
- **Result**: Captain reported "same result" — still bad

## Key Observations

1. **The orbit-radius interpolation approach (Attempt 3) should work mathematically**. If it doesn't visually, there may be a bug in the implementation or the angular interpolation is causing issues (e.g., `dAlpha` wrapping, wrong direction).

2. **The timing mismatch** between `ref.tTransfer` (circular) and `arcTT` (actual radii) means the planet's predicted position at arrival is computed using the wrong transfer time. This could place P2 in the wrong position.

3. **No approach that follows a single Keplerian orbit can produce a smooth trail to the planet** because the transfer orbit and the destination orbit are two different ellipses with different orientations — they only coincidentally align in the circular case.

## Current State of the Code

The code has multiple layers of patches:
- `state.burn1Good` flag and auto-correct logic in `endBurn` burn1
- `state.transferArc` parametric arc computation and cruise-phase propagation
- `state.prevDestDist` closest-approach detection (currently unused after switching to tFrac-based)
- Modified `checkArrival` with tFrac completion check
- Modified `getScAngle` with trail-tangent heading for parametric arc
- Modified captured phase with orbit propagation and time-based fade
- `drawSpacecraft` fade guards (`captureAlpha`, `globalAlpha`)

## Recommended Next Steps

1. **Debug the orbit-radius interpolation**: Add console logging to verify `rH`, `rD`, `f`, `arcR`, `arcAlpha` at each frame during cruise. The math should guarantee the trail stays between the two orbits — if it doesn't, there's an implementation bug.

2. **Verify angular interpolation**: Check that `dAlpha` is computed correctly (should be ~π for a half-orbit transfer). Print `alpha1`, `alpha2`, `dAlpha` to verify.

3. **Consider simplifying orbits to circular**: If the eccentric orbit model causes intractable visual issues, making all planet orbits circular (e=0) would eliminate the mismatch entirely. The Hohmann reference values would be exact, and any transfer orbit would naturally reach the destination radius.

4. **Consider a pure visual approach**: Pre-compute the full arc path at burn1 time as an array of (x, y) points from P1 to P2, ensuring it stays between the orbits. Animate along this array. This separates the visual (guaranteed smooth) from the physics (doesn't need to be exact for the game).

## File
All changes are in `learn/hohmann.html` (single-file app with inline CSS and JS).
