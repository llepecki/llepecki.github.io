# Style drift

Known deviations from the Style reference in `../../CLAUDE.md` (dark chassis). Fix on the next touch of the app; delete entries as they are fixed, delete this file when conformant.

- Top-of-file review-gate comment cites the stale flat path `hohmann.html` (should be `hohmann/index.html`).
- `<head>`: `<title>` sits after description/author/canonical/og/twitter (reference order: title before description).
- DOM skeleton: a semantic `<main>` wraps BOTH the `<header>` and a `<div class="main">` (reference: `<header>` → `<main class="main">` as siblings).
- Header emoji span uses legacy class `.header-rocket` (reference: `.header-icon`).
- `.type-btn:disabled` opacity 0.3 (reference: 0.4); `touch-action: manipulation` missing on `.type-btn`/`.lang-btn` (only the engine button has it).
- Canvas prompt: `padding: 8px 20px`, 15px, `z-index: 10`, no max-width/ellipsis (reference: `8px 18px`, 14px, `z-index: 5`, ellipsis clamp).
- Result overlay: legacy 3-tier washes `rgba(63,185,80,.88)` / `rgba(88,166,255,.88)` / `rgba(240,180,60,.92)` (reference: 4-tier palette); `.overlay-msg` 24px / `.overlay-sub` 14px (reference: 28/16px); container lacks `padding: 24px; text-align: center`; skin-tone emoji 👍🏻/👎🏻 (reference: no modifiers); click-only dismissal (reference: + Escape/Enter/Space); no `role="dialog"`/focus/`.visually-hidden` announcer.
- No `:focus-visible` outlines on buttons; `.engine-btn` sets `outline: none` with no replacement.
- Reduced motion: global `html *` 0.01ms CSS override (reference: targeted block) and no JS `matchMedia` gate on rAF animation.
- `applyTranslations()` rewrites textContent only — aria-labels and titles stay English in PL mode.
- Visibility toggled via inline `style.display` in places (canvas prompt, step indicator, burn target) — reference prefers `el.hidden` + scoped `[hidden]` guard.
- No `-webkit-tap-highlight-color: transparent` on body.
- DPR resize uses plain `canvas.width = W * dpr` (reference: adds `Math.max(1, Math.round(...))`).

Sanctioned app-specific components (do NOT "fix"): the skeuomorphic hold-to-fire engine dome (`.engine-btn`, radius 20px, Space-bar hold), the burn meter with target zone, the HUD step indicator, the inset mini-canvas, and the live ephemerides data-source widget.

Already conformant despite being common drift elsewhere: canvas CSS has `touch-action: none`; `.lang-btn` carries both `title` and `aria-label`.
