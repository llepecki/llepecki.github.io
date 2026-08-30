# Style drift

Known deviations from the Style reference in `../../CLAUDE.md` (dark chassis). Fix on the next touch of the app; delete entries as they are fixed, delete this file when conformant.

- Top-of-file review-gate comment cites the stale flat path `timerel.html` (should be `timerel/index.html`).
- `.lang-btn` has `title` but no `aria-label`.
- `.controls` gap 22px (reference: 18px).
- `:root` omits `--gain`/`--loss`; result colors are hard-coded JS literals, two off-palette (`#7ce88f`, `#f0b43c`).
- `.step-btn` selector is reused for a grid-choice bar component (not the canonical round −/+ stepper); the actual steppers are `.speed-bar-btn`. Rename to avoid the collision.
- `.type-btn`: hover recolors text as well as border (reference: border only), hover not scoped `:not(:disabled)`; generic `.full-width` utility instead of `.type-btn.full-width`.
- `.info-text` carries a `border-top` divider + `padding-top: 12px` (reference: separation by panel gap alone).
- Warp buttons never swap to the `▮▮` pause glyph while playing.
- Result overlay: fixed dim CSS backdrop `rgba(11,15,24,0.94)` with scrollable detail layout (reference: full-screen tier color wash); title 36px / emoji 48px (reference: 28px msg / 72px emoji); 💀 is outside the reference emoji set; click + Escape only (reference adds Enter/Space); no `role="dialog"`/focus/announcer; no `overlayPop` keyframe.
- No `cursor: not-allowed` on disabled controls.
- Reduced motion: CSS-only, no JS `matchMedia` gate.
- Mobile: panel stays a column and the page scrolls, padding `14px 16px` (dark-chassis reference: fixed height, row-wrap panel, `12px 16px`).
- `touch-action: manipulation` only on `.speed-bar-btn` (missing on `.type-btn`, `.step-btn`, `.lang-btn`).
- Off-scale details: `.speed-bar-val` letter-spacing 0.5px; `.readout-val` 13px inside a 12px row.

Sanctioned app-specific components (do NOT "fix"): the `.speed-bar` compound drag widget with embedded −/+ buttons and red danger glow, the `.step-bar` grid choice bar, the dashed-border callout card, the interactive name-input HUD panels (glass cards that accept input), and per-entity readout color classes.

## Automated checks

Each `house/...` id below suppresses that rule in `npm run code-review`. Delete
the line once the underlying issue is fixed — the gate then enforces it, and any
new occurrence fails the review.

- `house/inline-style-display` — 4 sites: visibility toggled with inline `style.display` instead of the native `hidden` attribute.
