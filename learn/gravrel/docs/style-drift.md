# Style drift

Known deviations from the Style reference in `../../CLAUDE.md`. Fix on the next
touch of the app; delete entries as they are fixed, delete this file when the app
is conformant.

## Automated checks

Each `house/...` id below suppresses that rule in `npm run code-review`. Delete
the line once the underlying issue is fixed — the gate then enforces it, and any
new occurrence fails the review.

- `house/inline-style-display` — 2 sites: visibility toggled with inline `style.display` instead of the native `hidden` attribute.
