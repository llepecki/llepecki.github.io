# Style drift — Trust Dilemma

Known deviations from the `CLAUDE.md` style reference. Delete entries as they
are fixed; delete the file when the app is conformant.

- **DOM-based stage, no canvas.** The stage (`.stage-wrap`) renders each game
  phase as plain DOM sections; there is no `<canvas>`. Same precedent as
  `codebreak/index.html`.
- **Hero type sizes outside the shared scale.** 64px countdown numeral, 48px
  choice-card token discs, 20px/700 stage phase headings.
- **Text inputs on the setup screen.** The family baseline defines only selects
  and ranges as native form controls; the two name fields reuse the
  `roman/index.html` input recipe (mono 13px, 1.5px border, accent focus
  border).
- **Stage-local scroll fallback.** `.phase-area` has `overflow-y: auto` so
  short desktop windows scroll the stage content instead of clipping it; the
  panel remains the primary scroll container.
- **localStorage: one key only.** The app persists nothing about a match
  (private, reset-on-refresh) but does use the sanctioned versioned
  intro-seen key `dilemmaIntroSeenV1` (guarded in try/catch) so the tutorial
  auto-shows only on first visit — the house intro pattern.
- **Skin-tone modifier on the header emoji** (`house/skin-tone-emoji`). The
  style reference forbids skin-tone modifiers; the header home link uses 🤝🏻
  (light skin tone) by explicit owner decision (2026-07-13) — the default
  yellow read poorly against the light chrome. Sanctioned, not drift to fix.
