# Style drift

Known deviations from the Style reference in `../../CLAUDE.md` (dark chassis). Fix on the next touch of the app; delete entries as they are fixed, delete this file when conformant.

- Result overlay: static `.game-overlay` (canonical class name `.result-overlay` — rename optional); children sized in rem (title 2.4rem, subtitle 1.1rem, hint 0.95rem, emoji 6rem; reference: 28/16/12px + 72px); subtitle/hint inherit Outfit (reference: mono); no `overlayFadeIn`; pop 0.45s (reference: 0.4s); close-tier emoji 👀 (reference: 👍). Tier palette, foreground ink, dismissal keys, role/focus/announcer are conformant.
- Steppers are click-only (press-and-hold auto-repeat recommended).
- Reduced motion: CSS block covers only the overlay pair (button transitions stay live); `matchMedia` checked inline without a `change` listener.
- Mode-toggle group has no id (reference: `grpMode`).
- Crash 💥 drawn with `ctx.font = "36px serif"` (reference: mono only in `ctx.font`).

Sanctioned app-specific components (do NOT "fix"): the 1×/3×/10× game-mode warp group, the inline-SVG 3-star rating (panel + overlay), the fuel bar with medal threshold markers and gradient fill, the in-panel game-result card, the 📍 camera-focus glyph with −/Auto/+ zoom group, and the near-invisible `?debug=1` analysis modal.

## Automated checks

Each `house/...` id below suppresses that rule in `npm run code-review`. Delete
the line once the underlying issue is fixed — the gate then enforces it, and any
new occurrence fails the review.

- `house/tiny-css-text` — 1 site: CSS text below the 11px floor (diagram/chart labels — needs per-chart visual checking, not a sweep).
