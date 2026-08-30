# Scientific review — 2026-08-26

Scope: the side-view ray diagram and the observer-view inverse ray trace in
`../index.html`. Triggered by a code review flagging the schematic ray fan.

## Finding: the ray fan applied the reduced deflection instead of the true deflection

**Status: fixed in this pass.**

### Conventions

The side view works in screen pixels with small-angle approximations:

| Symbol | Meaning | Code |
|---|---|---|
| `Dl` | observer → lens | `xLens - xObs` |
| `Dls` | lens → source | `xSrc - xLens` |
| `Ds` | observer → source | `xSrc - xObs` |
| `θ` | image angle | `b / Dl` |
| `β` | source angle | `ySource / Ds` |
| `θ_E` | angular Einstein radius | `einsteinRadius() / Dl` |

`einsteinRadius()` returns the Einstein radius as a **length in the lens
plane** (`R_E = θ_E·Dl`); that is the radius the dashed guide circle is drawn
at, and `solveImageAngles()` is fed `thetaEAng = einsteinRadius() / Dl`.

### The defect

For a point mass the **reduced** deflection is `α(θ) = θ_E²/θ` and the lens
equation is `β = θ − α`. The **true** geometric bend at the lens plane is
`α̂ = α·Ds/Dls` — that is the angle by which the ray path actually turns.

The fan applied `hatAlpha = eRad²/(b·Dl)`. Substituting `eRad = θ_E·Dl` and
`b = |θ|·Dl` gives `hatAlpha = θ_E²/|θ|` — the reduced deflection, despite the
variable name. Propagating that bend through the fan's own construction:

```
y_o = b + [(b − y_s)/Dls − sign(b)·A]·Dl = 0
  ⟹  Ds·(θ − β)/Dls = sign(b)·A
  ⟹  β = θ − A·(Dls/Ds)
```

With `A = θ_E²/|θ|` the fan therefore solved

```
β = θ − (Dls/Ds)·θ_E²/θ        instead of        β = θ − θ_E²/θ
```

so it applied only `Dls/Ds` of the required bend. At the app's fixed geometry
(`sideW = 1000` → `Dl = 390`, `Dls = 470`, `Ds = 860`) that is 54.7 %.

**Visible symptom.** For an on-axis source the fan converged where
`θ² = (Dls/Ds)·θ_E²`, i.e. at `θ_E·√(Dls/Ds) ≈ 0.739·θ_E` — about 26 % inside
the dashed Einstein radius. The bold image-forming rays, which come from
`solveImageAngles()` and are correct, touch the circle exactly. In an app whose
subject is the Einstein radius, the two ray families visibly disagreed with each
other and with the guide circle.

(An earlier review characterised this as a linear `b·Dls/Ds ≈ 0.55·b` offset,
i.e. "~45 % inside". That is wrong — the factor enters quadratically for the
ring radius. The defect is real; the magnitude is ~26 %.)

### The fix

Multiply by `Ds/Dls` so the applied bend is the true deflection:

```js
const hatAlpha = ((eRad * eRad) / (bAbs * distObsLens)) * (g.Ds / g.Dls);
```

Verification: with `A = (Ds/Dls)·θ_E²/|θ|` the derivation above collapses to
`θ − β = θ_E²/θ`, exactly the lens equation `solveImageAngles()` solves. The
fan's brightest rays now land on the solved image positions, and for `β = 0`
they cross the lens plane precisely at the drawn Einstein radius.

## Checked and found correct

- **Observer view** (`deflect()`): implements `β = θ − θ_E²·θ/|θ|²`, the
  standard point-mass inverse ray trace, with `θ_E` scaled consistently into the
  view's pixel units. No change.
- **`solveImageAngles()`**: `θ = ½(β ± √(β² + 4θ_E²))` — the correct pair of
  solutions to the point-mass lens equation.
- **Einstein-radius circle** and `thetaEAng = einsteinRadius()/Dl` are mutually
  consistent.

## Known modelling simplifications (intentional, not defects)

- `θ_E = √(mass)·12` is a visual scaling, not a physical value in arcseconds;
  the observer/lens/source distances are fixed and the mass slider varies only
  the lens mass within that geometry. The panel says so.
- Point-mass (Schwarzschild) lens only — no extended mass profile, shear, or
  multiple planes.
