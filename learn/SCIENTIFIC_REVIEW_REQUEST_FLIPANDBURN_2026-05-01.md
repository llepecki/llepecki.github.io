# Scientific Review Request: `flipandburn.html` — Manual Second Burn

Date: 2026-05-01

Scope: review the current `flipandburn.html` only. Do not use older local Markdown documents as design input.

## What changed since the last review

The previous review (`SCIENTIFIC_REVIEW_FLIPANDBURN_2026-05-01.md`) identified critical issues with the second-leg physics. All of those have been addressed. On top of that, the gameplay mechanic for the second burn was redesigned. The current implementation represents a significant rewrite of the transit, flip, and braking phases.

### Changes made

1. **Single transfer line per mission.** The broken two-line architecture (retargeted second line at flip) has been replaced with a single fixed transfer line from launch to the original planned intercept point `rdRef`. The ship accelerates, flips, and decelerates along the same line.

2. **Correct outbound kinematics.** During transit, the ship position is `s = 0.5 * a1 * tau²` — pure constant-acceleration along the fixed line. No symmetric-formula decel branch kicks in before the player flips.

3. **Manual second burn.** The player now makes two decisions:
   - **When to flip** (tap ENGINE during transit)
   - **How hard to brake** (hold-release ENGINE in a new `burn2` phase after flip)

   Previously, `a2` was auto-computed from flip timing. Now the player controls both `a1` and `a2` independently.

4. **Correct braking kinematics.** After the player commits `a2`:
   - `T_brake = v_flip / a2`
   - `s_stop = s_flip + v_flip² / (2 * a2)`
   - Ship position during braking: `s(tb) = s_flip + v_flip * tb - 0.5 * a2 * tb²`
   - The ship stops at `s_stop`, which may differ from `L` (the planned stop point) depending on `a2`

5. **No simulation-time rescaling.** During decel, ship and planets advance on the same `dtSim`. The `simRatio` / `T2_sim` / `T2_traj` concepts have been removed.

6. **Physics-based hit/miss test.** At commit time:
   - `r_stop = r0 + u * s_stop`
   - `r_planet = helioPosition(dest, launchSimTime + T_arrive)`
   - `missDistance = distance(r_planet, r_stop)`
   - Hit if `missDistance <= captureTol`
   - `captureTol = max(0.01, L * CAPTURE_TOL_FRAC)` where `CAPTURE_TOL_FRAC` is per-difficulty (0.05 easy, 0.03 medium, 0.015 hard)

7. **Physics-based target band in burn2.** The green zone shown on the burn meter during `burn2` is computed by sampling `miss(a2)` across the full meter range (200 log-spaced samples, 0.3g–20g), finding the miss minimum, then binary-searching outward for where `miss(a2) = captureTol`. The band matches the actual hit logic.

8. **Result precedence.** Fatal always overrides miss. Miss subtype (overshoot/undershoot) is based on `a2` vs the best-capture `a2` from the band computation.

9. **Launch window phase gating.** `isLaunchReady()` now checks `|phaseError| <= PHASE_TOL_DEG` (per difficulty). The ENGINE button only arms when the phase angle is within tolerance.

10. **Transit UI.** During transit, a green zone on the burn bar shows the range of `a_req` values that correspond to a capture-compatible flip timing. The ENGINE button does not arm or pulse — the green zone provides information, not an auto-answer. *(Note: this transit band is currently computed using capture-distance tolerance, which produces a band that is too wide on easy difficulty. We are considering switching to a crew-comfort criterion instead — see open question below.)*

### State machine

```
prelaunch → burn → transit → flipping → burn2 → decel → captured → result
```

- `burn`: simTime frozen, player holds ENGINE to choose `a1`
- `transit`: ship accelerates physically, player taps ENGINE to flip
- `flipping`: short orientation animation, no physics advance
- `burn2`: simTime frozen, player holds ENGINE to choose `a2`
- `decel`: ship and planets advance on the same physical clock

### Key functions to review

- `getTransferLinePosition(tau)` — outbound position: `s = 0.5 * a1 * tau²`
- `getDecelPosition(tb)` — braking position: `s = sFlip + vPeak * tb - 0.5 * a2 * tb²`
- `computeBurn2TargetBand()` — samples `miss(a2)` across full meter range, binary-searches for band edges
- `computeTransitBand()` — samples flip times, finds capture-compatible timing range, converts to `a_req`
- `commitBurn2()` — evaluates hit/miss from `s_stop` vs planet position at `T_arrive`
- `isLaunchReady()` — checks phase angle error vs difficulty tolerance

### Key state variables

- `accelFinal1`: committed first-burn acceleration (AU/yr²)
- `accelFinal2`: committed second-burn acceleration (AU/yr²)
- `sFlip`: ship position along transfer line at flip (AU)
- `vPeakAtFlip`: ship speed at flip (AU/yr)
- `a2Target`: exact braking acceleration to stop at rdRef, or -1 if past stop point
- `burn2Band`: `{lo, hi, bestA2}` — the capture band in g for the burn meter
- `transitBand`: `{lo, hi}` — the capture-compatible flip-timing band in g (a_req values)
- `tDecelHalf`: braking duration `= vPeak / a2`
- `tActual`: total mission time `= tAccelHalf + tDecelHalf`

## What to review

1. Are the outbound and braking kinematics correct for the stated single-line constant-acceleration model?
2. Is the hit/miss test in `commitBurn2()` physically valid?
3. Does the `computeBurn2TargetBand()` solver produce a band that matches the actual hit/miss test?
4. Is the `computeTransitBand()` solver correct? Does it answer the right question?
5. Are there any remaining internal inconsistencies between displayed values and actual motion?
6. Is the result precedence (fatal > miss > survivability) correctly implemented?
7. Any other physics issues.

## Open question for the reviewer

The transit green zone is currently computed using the spatial capture tolerance (`captureTol`). For easy difficulty, this produces a band that covers nearly 100% of the meter because the tolerance (5% of L) is large relative to how far the planet moves during the transfer. This makes the transit band uninformative.

We are considering switching the transit band criterion to **crew comfort**: show where `a_req` is in the 1–3g range. This is simpler, always produces a reasonable band width, and matches the burn1 green zone semantics (crew comfort, not capture geometry).

The reviewer's input on this question is welcome:
- Is a crew-comfort transit band scientifically defensible?
- Or should the transit band use a tighter, physics-derived criterion?
- Or should the transit band be removed entirely and left as fill-only?

## Acceptance checks from the previous review

For reference, these are the acceptance checks from the previous scientific review. The reviewer should verify whether they still hold.

1. In a frozen-target thought experiment, `T_stop = vPeak / a2` and `L_stop = vPeak² / (2*a2)` hold exactly.
2. Before flip, ship position is monotonic in `0.5 * a1 * tau²` and never computed from a post-flip equation.
3. The ship never changes to a different transfer line at flip.
4. During decel, planets and ship advance on the same physical simulation clock.
5. A fatal burn remains fatal even if the ship also misses.
6. Displayed braking g, total time, and delta-v values match the quantities actually used in the motion equations.
7. A perfect midpoint flip reproduces the original solved intercept.
8. A deliberately early flip and a deliberately late flip produce opposite miss subtypes.
