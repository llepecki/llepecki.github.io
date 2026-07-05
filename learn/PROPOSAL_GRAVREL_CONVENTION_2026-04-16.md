# Proposal: Adopt Convention B with relabeled UI for `gravrel.html`

Date: 2026-04-16
Author: implementation team (in response to `SCIENTIFIC_REVIEW_GRAVREL_2026-04-16.md`)
Reviewer ask: sign-off on the proposed physics convention, or redirect.

---

## 1. Context

We implemented the fixes recommended in your review. All eight findings were accepted. Six were resolved without controversy (F1, F3, F4, F5, F7, F8 via prose + label corrections; F6 via an animation rewrite keyed to cumulative reference time).

**F2 is where we are requesting your sign-off on a refinement.**

In the first-round fix, we adopted the convention your §2 Required fix recommended:

```
dtRef  = dl / (β · g)        # Earth-frame coord time (gravity enters here)
dPilot = dl / (β · γ)        # ship proper time (no direct g)
```

with `β` interpreted as local speed measured by static observers and `dl` as local proper path length. This is mathematically clean and internally consistent.

On review of the resulting pedagogy, we identified a regression: the app's primary educational comparison — *pilot A's proper time vs pilot B's proper time* — becomes identical for any two routes of equal `dl` at equal `β`, regardless of gravitational depth. The pilot-vs-pilot drama collapses to zero.

The Interstellar-style effect is still present in the pilot-vs-mission-time ratio per ship (that ratio is `g/γ` under either convention, as it must be). But the app's headline UI surfaces the A-vs-B comparison, and under this convention that comparison no longer conveys gravitational time dilation at the pilot level — it conveys only route length and speed.

## 2. Proposal

Revert the segment equations to:

```
dtRef  = dl / β              # Earth-frame coord time along the segment
dPilot = dl · g / (β · γ)    # pilot proper time along the segment
```

and relabel the observer convention in the UI text to:

> *β is the ship's speed expressed in light-speed units along the canvas path, interpreted as an Earth-frame coordinate speed under a weak-field approximation. The ratio dPilot/dtRef = g·√(1−β²) = g/γ is the standard Schwarzschild proper-time factor for a tangentially moving clock at radial coordinate r.*

Your §2 Required fix explicitly permits this path:

> *"If a different convention is chosen, rename the UI so it no longer claims 'far-away reference clock' and 'local speed relative to static observers'."*

We are invoking that allowance.

## 3. Physics statement (exact)

For a timelike worldline at radial Schwarzschild coordinate `r`, with tangential coordinate speed `v`, the proper-time factor is:

```
dτ/dt = √( (1 − r_s/r) − v² / (1 − r_s/r) )
```

In the weak-field / moderate-velocity regime where the `v²` term is small compared to `(1 − r_s/r)`, this factors to:

```
dτ/dt ≈ √(1 − r_s/r) · √(1 − v²) = g · √(1 − β²) = g/γ
```

Setting `β ≡ v` (weak-field identification of coordinate and local speed) and `dl ≡ v · dt = β · dt`, we get:

```
dt   = dl / β
dτ   = (g/γ) · dt = dl · g / (β · γ)
```

These are the Convention B segment equations. They are standard textbook results for Schwarzschild time dilation of a moving clock in the weak-field approximation (MTW §25.5; Schutz ch. 11).

**Accuracy regime.** The factorization `√(g² − β²/g) ≈ g·√(1−β²)` introduces a fractional error of order `β² · (1−g²)/g²`. For the parameter ranges exercised by this app (β ≤ 0.99, g ≥ 0.1 inside the influence ring), this is a teaching-grade approximation, not a precision result. The app already declares year counts as "illustrative, not literal interstellar travel predictions" (your F3 fix, kept).

**Limitations we will continue to declare explicitly:**
- The schematic canvas has no declared physical scale except the Earth-star baseline; the model is a teaching heuristic, not an exact simulator.
- Multi-BH fields are approximated by multiplying per-hole Schwarzschild factors — pedagogical shortcut, not GR.
- Each hole's influence is cut to zero beyond a finite ring (isolated-mass approximation).
- Rh remains a visual-scale stand-in, not a physical Schwarzschild radius.
- The `r_s/r` inside `g = √(1 − r_s/r)` is evaluated using the canvas-space ratio `dCanvas/Rh`, which is a visual proxy, not a physical coordinate ratio. (This is the same tradeoff your F1 flagged; it stays under Convention B too, addressed by honest labeling.)

## 4. Pedagogical rationale

The app's interactive loop is: *drag routes past different black holes, watch two pilot clocks diverge, ask which pilot aged less.* Under Convention B:

- A deep-gravity pass at equal route length produces a pilot-time reduction of roughly factor `g`, ranging from ~0.5 at `r = 1.35·Rh` down to ~0.1 near the influence ring cutoff.
- That reduction is directly visible in the A-vs-B pilot-time comparison, which is the app's central visual affordance.
- The mission-time readout remains available for the Interstellar-style pilot-vs-Earth comparison, now expressed as `dtRef/dPilot = γ/g` per ship.

Under Convention A (our first implementation), the pilot-vs-pilot comparison is flat for equal-length routes, and the Interstellar effect is only visible if the user mentally contrasts pilot time against mission time per ship — a subtler ask for the target audience (children).

## 5. What stays fixed from your original review

The following remain in place unchanged from the first-round implementation:

| Finding | Status |
|---|---|
| F1 (Rh not r_s) | ✅ UI text rewritten to declare Rh as visual-scale stand-in; no "exact Schwarzschild" claims |
| F3 (mixed real + compressed scales) | ✅ Year counts declared illustrative; route length declared a map measure |
| F4 (multi-BH not exact GR) | ✅ Declared pedagogical shortcut |
| F5 (hidden cutoff/fade) | ✅ Fade taper removed; cutoff kept and declared as isolated-mass approximation |
| F6 (animation by arc-length) | ✅ `cumRefTime` tracked per sample; ref-time interpolators in place (degenerates under Convention B since `dtRef ∝ dl`, but code remains general) |
| F7 (summary overclaim) | ✅ Rewritten to attribute outcome to combined length/speed/gravity integral |
| F8 (×rh readout) | ✅ Renamed to "×visual" (EN) / "×wizualne" (PL), new I18N key `lblVisualUnits` |

The only thing we are asking to adjust relative to the first-round fix is the F2 convention — from (A) to (B) — with the corresponding UI relabel you explicitly permitted.

## 6. Exact patch we would apply

In `computeRoutePhysics` segment loop:

```javascript
// Before (Convention A)
var dtRef  = dsPhysical / (beta * Math.max(g, G_MIN));
var dPilot = dsPhysical * invGamma / beta;

// After (Convention B)
var dtRef  = dsPhysical / beta;
var dPilot = dsPhysical * g * invGamma / beta;
```

In the info-text convention bullet:

```
Before: β is treated as the ship's speed measured by local static observers.
        Earth-frame time per segment: dl/(β·g). Pilot proper time: dl/(β·γ).

After:  β is the ship's speed in light-speed units along the canvas path,
        interpreted as an Earth-frame coordinate speed under a weak-field
        approximation. Earth-frame time per segment: dl/β. Pilot proper
        time: dl·g/(β·γ), combining the Schwarzschild factor g = √(1−r_s/r)
        with the Lorentz factor γ = 1/√(1−β²).
```

Symmetric change to the Polish (PL) dictionary.

No other code or prose changes.

## 7. Acceptance criteria we would meet with Convention B

Re-stating your §"Acceptance criteria" with our status:

- ☑ No physics equation depends directly on `Rh`, `Rsafe`, `Rinf`, or raw canvas pixels **as if they were physical**. They remain in the equations as *declared visual proxies*, per your F1 allowance in PATH B.
- ☑ The meaning of every physical quantity is declared in-text: β (Earth-frame coord speed, weak field), dl (map route length mapped to ly via baseline), g (Schwarzschild factor at canvas-proxy radius), γ (Lorentz).
- ☑ Observer convention is explicit and consistent across code and UI.
- ☑ Mission time matches the observer definition (far-away / Earth-frame coord time).
- ☑ Displayed ratios such as `× visual` are clearly labeled as map-scale, not physical `r/r_s`.
- ☑ "Exact" wording absent from the single-hole case and everywhere else.
- ☑ Multi-BH mode explicitly labeled approximate.

## 8. Specific questions for you

1. **Is Convention B acceptable under the weak-field framing stated in §3**, given that the app is already declared a teaching model with illustrative outputs and visual-scale radii?

2. **Is the factorization `dτ/dt ≈ g/γ` acceptable as a stated approximation** for the ship's proper-time rate, with the error bound of order `β²·(1−g²)/g²` noted in a code comment?

3. **If (1) or (2) is not acceptable**, would you instead recommend:
   - (a) staying with Convention A and restructuring the app's primary UI to surface the pilot-vs-Earth ratio per ship (rather than pilot-A-vs-pilot-B) as the headline comparison?
   - (b) a third convention we have not considered?

4. **Any residual language** in the current info-text or summary prose that still reads as overclaim under Convention B, that you would like tightened further?

We would prefer to apply this patch only after your sign-off. If you flag any of the above as unacceptable, we will revert to Convention A and restructure the headline comparison per your guidance instead.

---

*End of proposal.*
