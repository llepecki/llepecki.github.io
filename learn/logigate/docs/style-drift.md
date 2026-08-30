# Style drift — logigate

Deliberate deviations from the Style reference in `../../CLAUDE.md`, kept after the
2026-07-12 restyle to the dark chassis.

- **Entity-colored gate-type toggles.** The four `GATES` segmented buttons use each
  gate's entity color for the `.active` border/text (`--not-color`, `--and-color`,
  `--or-color`, `--xor-color`) instead of the uniform accent. The colors match the
  gate strokes on the stage, so the toggle doubles as a legend — pedagogically
  intentional. There is no fill, so the "no per-mode fill colors" rule is respected.
- **Dot-grid stage texture.** `.canvas-wrap::before` draws a faint radial dot grid
  (`--dot-color`), the circuit-paper analogue of the sanctioned starfield for space
  apps. Decorative only, `pointer-events: none`, sits under the SVG.
- **SVG stage instead of `<canvas>`.** The circuit is a dagre-laid-out SVG that fills
  `.canvas-wrap`; the canvas conventions (clear color, DPR resize, rAF) don't apply.
  Stage background comes from the `.canvas-wrap` CSS (`#080c14`). The SVG root
  carries a translated `aria-label`; inputs and guess buttons are focusable
  (`role="button"`, Enter/Space).
- **Mono status line in the panel.** `#statusText` is JetBrains Mono 12px (readout
  typography) rather than Outfit info-text, because it doubles as the live
  `Output = HIGH/LOW` readout after a reveal.
