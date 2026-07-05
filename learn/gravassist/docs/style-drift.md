# Style drift

Known deviations from the Style reference in `../../CLAUDE.md` (dark chassis). Fix on the next touch of the app; delete entries as they are fixed, delete this file when conformant.

- Top-of-file review-gate comment cites the stale flat path `gravassist.html` (should be `gravassist/index.html`).
- `.lang-btn` has `title` but no `aria-label`.
- Canvas CSS lacks `touch-action: none` (drag suppression is JS-only).
- `.type-btn` font-size 12px (reference: 14px).
- No CSS `:disabled` rule for `.type-btn` — JS disables buttons with no visual state (reference: opacity 0.4 + `pointer-events: none`).
- Result overlay: static `.game-overlay` (canonical class name `.result-overlay` — rename optional); children sized in rem (title 2.4rem, subtitle 1.1rem, hint 0.95rem, emoji 6rem; reference: 28/16/12px + 72px); subtitle/hint inherit Outfit (reference: mono); no `overlayFadeIn`; pop 0.45s (reference: 0.4s); close-tier emoji 👀 (reference: 👍). Tier palette, dismissal keys, role/focus/announcer are conformant.
- Steppers are click-only (press-and-hold auto-repeat recommended).
- `T()` lacks the `|| key` fallback.
- Reduced motion: CSS block covers only the overlay pair (button transitions stay live); `matchMedia` checked inline without a `change` listener.
- Mode-toggle group has no id (reference: `grpMode`).
- No `:focus-visible` outlines on buttons (range inputs have the box-shadow ring).
- No `-webkit-tap-highlight-color: transparent` on body.
- Crash 💥 drawn with `ctx.font = "36px serif"` (reference: mono only in `ctx.font`).

Sanctioned app-specific components (do NOT "fix"): the 1×/3×/10× game-mode warp group, the inline-SVG 3-star rating (panel + overlay), the fuel bar with medal threshold markers and gradient fill, the in-panel game-result card, the 📍 camera-focus glyph with −/Auto/+ zoom group, and the near-invisible `?debug=1` analysis modal.
