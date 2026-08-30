# Style drift

Known deviations from the Style reference in `../../CLAUDE.md` (light chassis). Fix on the next touch of the app; delete entries as they are fixed, delete this file when conformant.

- Top-of-file review-gate comment cites the stale flat path `forces.html` (should be `forces/index.html`).
- `<head>` is missing `meta author`, `rel=canonical`, the entire `og:` set, and the `twitter:` tags.
- Header emoji span uses legacy class `.header-emoji` (reference: `.header-icon`).
- `.lang-btn` `aria-label` is added only at runtime by `applyTranslations()` (reference: present in the markup too).
- Canvas id is `board` (reference `canvas` — rename optional).
- App entity tokens (`--f1`…`--f4`) sit mid-`:root` between core tokens (reference: appended after the core set).
- `.action-btn.primary` is defined but never used in the markup (dead CSS — the floating `.play-now` button is the game's real primary action).
- Reduced motion: CSS block covers overlay/prompt only — button hover transitions (`all 0.15s`) stay live. (The JS `matchMedia` gate with change listener is conformant.)
- Result overlay lacks `role="dialog"`/`aria-live`/`tabindex="-1"`/focus on open (the `.sr-only` announcer and Escape/Enter/Space dismissal are conformant).
- Some canvas text off-reference: Outfit strings in `ctx.font` and mono at 12/18px (reference: mono 13–17px).

Sanctioned app-specific components (do NOT "fix"): the floating on-canvas `.play-now` action button (44×44, positioned at the guess marker), the SVG resultant-diagram card in the panel, elapsed-time reveal animation (rebased on `visibilitychange`), and the intro-mode game-state snapshot/restore.

## Automated checks

Each `house/...` id below suppresses that rule in `npm run code-review`. Delete
the line once the underlying issue is fixed — the gate then enforces it, and any
new occurrence fails the review.

- `house/inline-style-display` — 4 sites: visibility toggled with inline `style.display` instead of the native `hidden` attribute.
