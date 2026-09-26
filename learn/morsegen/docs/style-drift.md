# Style drift

Known deviations from the Style reference in `../../CLAUDE.md`. Fix on the next
touch of the app; delete entries as they are fixed, delete this file when the app
is conformant.

## Automated checks

Each `house/...` id below suppresses that rule in `npm run code-review`. Delete
the line once the underlying issue is fixed — the gate then enforces it, and any
new occurrence fails the review.

- `house/tiny-css-text` — 2 sites: CSS text below the 11px floor (diagram/chart labels — needs per-chart visual checking, not a sweep).
