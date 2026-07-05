# Learn — educational STEM apps

A collection of standalone, single-file educational apps for teaching kids STEM concepts, served at `https://lepecki.com/learn/`. The hub page is `index.md` (permalink `/learn/`); every app must be linked from it.

## Structure

```
learn/
├── index.md                  # hub page → /learn/
├── README.md                 # this file (excluded from the deployed site)
├── <app>/
│   ├── index.html            # the app → /learn/<app>/
│   └── docs/                 # per-app working docs (excluded from the site)
│       ├── req.md
│       ├── design.md
│       ├── spec-<feature>-<date>.md
│       └── scientific-review[-<scope>][-<date>].md
├── docs/                     # cross-app docs (excluded from the site)
│   ├── style.md              # shared design system: fonts, themes, CSS variables
│   └── space-objects.md      # shared astronomy reference data
├── tools/                    # quality-gate tooling (code review, word lists)
└── package.json              # npm scripts for the tooling
```

## App conventions

- **Single file.** Each app is one self-contained `index.html` with inline CSS and JS. No sidecar `.css`/`.js` files (enforced by the code-review tool), no build step, no Jekyll front matter — Jekyll copies apps verbatim.
- **URLs.** Apps are served at `/learn/<app>/`. The `<link rel="canonical">` and `og:url` tags must use `https://lepecki.com/learn/<app>/`.
- **Style.** Follow `docs/style.md` — Outfit + Share Tech Mono fonts, shared CSS variable palette, light/dark theme conventions.
- **Bilingual.** Apps provide English and Polish via an inline `I18N` object and a language toggle.
- **Redirects.** Legacy `/learn/<app>.html` URLs 301-redirect to `/learn/<app>/` via the repo-root `_redirects` file. If an app URL ever changes, add a rule there.

## Doc conventions

- Per-app docs go in `<app>/docs/`; docs spanning multiple apps go in `docs/`.
- Filenames are lowercase-hyphenated, type-first, without the app name (the folder provides it), with an ISO date suffix where versioning matters:
  - `req.md` — requirements / product spec
  - `design.md` — living design reference
  - `spec-<feature>-<date>.md` — feature spec (kept while it describes shipped behavior)
  - `scientific-review[-<scope>][-<date>].md` — scientific accuracy review (keep only the latest per scope)
- One-time process artifacts (master handoffs, implementing-agent prompts, superseded reviews, completed plans/proposals) are **deleted** once the work ships — git history preserves them.
- Reference apps and docs by learn-relative path (e.g. `starlab/index.html`, `docs/style.md`) or doc-relative links (e.g. `../index.html`). Never use absolute filesystem paths.
- All docs directories and this README are excluded from the deployed site in `_config.yml`.

## Tooling

```bash
cd learn
npm run code-review -- --all             # review every app
npm run code-review -- <app>/index.html  # review one app
npm run word-quality                     # check bilingual word lists
node tools/hohmann-transfer-matrix.mjs   # hohmann physics cross-check
```

The code-review tool discovers apps as `<dir>/index.html` one level below `learn/` (skipping `docs/`, `tools/`, `node_modules/`) and enforces the single-file-app policy.

## Adding a new app

1. Create `learn/<app>/index.html` following `docs/style.md` and an existing app as baseline.
2. Set canonical/`og:url` to `https://lepecki.com/learn/<app>/`.
3. Add the app to `index.md`.
4. Put its spec in `learn/<app>/docs/req.md`.
5. Run `npm run code-review -- <app>/index.html`.
