# CLAUDE.md — Learn apps

This file is the single source for working in `learn/`: a collection of standalone, single-file educational apps for teaching kids STEM concepts, served at `https://lepecki.com/learn/`. The hub page is `index.md` (permalink `/learn/`); every app must be linked from it.

## Commands

```bash
# Serve the whole site locally (run from the repo root; apps are copied verbatim, no build step)
bundle exec jekyll serve

# Quality gates (run from learn/)
npm run code-review -- --all             # review every app
npm run code-review -- <app>             # review one app (or <app>/index.html)
npm run word-quality                     # check bilingual word lists
```

The code-review tool discovers apps as `<dir>/index.html` one level below `learn/` (skipping `docs/`, `tools/`, `node_modules/`) and enforces the single-file-app policy. Some apps have a dedicated physics cross-check script in `tools/`; where one exists, the app's `docs/` says so.

## Structure

```
learn/
├── index.md                  # hub page → /learn/
├── CLAUDE.md                 # this file (excluded from the deployed site)
├── <app>/
│   ├── index.html            # the app → /learn/<app>/
│   └── docs/                 # per-app working docs (excluded from the site)
│       ├── req.md
│       ├── design.md
│       ├── style-drift.md
│       ├── spec-<feature>-<date>.md
│       └── scientific-review[-<scope>][-<date>].md
├── docs/                     # cross-app content docs (excluded from the site)
│   ├── space-objects.md      # shared astronomy reference data
│   └── scientific-review-<scope>.md
├── tools/                    # quality-gate tooling (code review, word lists, cross-checks)
└── package.json              # npm scripts for the tooling
```

## App conventions

- **Single file.** Each app is one self-contained `index.html` with inline CSS and JS. No sidecar `.css`/`.js` files (enforced by the code-review tool), no build step, no Jekyll front matter — Jekyll copies apps verbatim.
- **URLs.** Apps are served at `/learn/<app>/`. The `<link rel="canonical">` and `og:url` tags must use `https://lepecki.com/learn/<app>/`.
- **Style.** Follow the Style reference section below — Outfit + Share Tech Mono fonts, shared CSS variable palettes, one of two theme-paired chassis.
- **Bilingual.** Apps provide English and Polish via an inline `I18N` object and a language toggle.
- **URL stability.** App URLs are permanent — renaming or moving an app breaks inbound links with no server-side redirect available (GitHub Pages hosting). Legacy pre-folder `/learn/<app>.html` URLs intentionally 404.

## Doc conventions

- Per-app docs go in `<app>/docs/`; content docs spanning multiple apps go in `docs/`. Generic working instructions (conventions, style, commands) belong in this file, not in separate docs. App-specific notes — including known gaps and pending updates — belong in that app's `docs/`, never here.
- Filenames are lowercase-hyphenated, type-first, without the app name (the folder provides it), with an ISO date suffix where versioning matters:
  - `req.md` — requirements / product spec
  - `design.md` — living design reference
  - `style-drift.md` — known deviations from the Style reference below (delete entries as they are fixed; delete the file when the app is conformant)
  - `spec-<feature>-<date>.md` — feature spec (kept while it describes shipped behavior)
  - `scientific-review[-<scope>][-<date>].md` — scientific accuracy review (keep only the latest per scope)
- One-time process artifacts (master handoffs, implementing-agent prompts, superseded reviews, completed plans/proposals) are **deleted** once the work ships — git history preserves them.
- Reference apps and docs by learn-relative path (e.g. `<app>/index.html`, `docs/space-objects.md`, `CLAUDE.md`) or doc-relative links (e.g. `../index.html`). Never use absolute filesystem paths.
- All docs directories and this file are excluded from the deployed site in `_config.yml`.

## Adding a new app

1. Create `learn/<app>/index.html` following the Style reference below.
2. Set canonical/`og:url` to `https://lepecki.com/learn/<app>/`.
3. Add the app to `index.md`.
4. Put its spec in `learn/<app>/docs/req.md`.
5. Run `npm run code-review -- <app>/index.html`.

## Style reference

The canonical look-and-feel for every app. There are **two chassis, paired to theme**:

- **Dark chassis** — roomy header, borderless `.ctrl-group` panel stack. Suits space/circuit themes.
- **Light chassis** — slim header, sectioned `.panel-section` card panel. Suits diagrams on paper-like backgrounds.

When updating an app, keep its existing theme and adopt the matching chassis; never flip the theme unless explicitly asked. The shared core (palette structure, fonts, components, canvas, i18n, a11y) is identical across both. Where an existing app is known to deviate from this reference, the deviation is recorded in `<app>/docs/style-drift.md` — fix drift when touching the app and delete fixed entries.

### Theme palettes

Variable naming: short lowercase semantic tokens, ordered background → surfaces → text → accent → semantic. App-specific entity colors (planet/ship/force colors) are appended AFTER the core tokens.

**Dark:**

```css
:root {
  --bg: #0b0f18;
  --panel: #131825;
  --panel-border: #1e2a3a;
  --text: #c9d1d9;
  --text-dim: #6e7a8a;
  --accent: #58a6ff;
  --gain: #3fb950;
  --loss: #f97583;
}
body { background: var(--bg); }
```

Hard-coded companions (used consistently, not variables): canvas clear `#080c14` (darker than `--bg`); accent hover `#79b8ff`; glass card `rgba(19, 24, 37, 0.95)`; HUD pill `rgba(11, 15, 24, 0.88)`; canvas prompt `rgba(11, 15, 24, 0.85)`; overlay backdrop dim `rgba(11, 15, 24, 0.94)`.

**Light:**

```css
:root {
  --bg: #fafaf7;
  --panel: #ffffff;
  --panel-border: #e0ddd6;
  --text: #37474f;
  --text-head: #263238;
  --text-dim: #78909c;
  --text-label: #90a4ae;
  --accent: #455a64;
  --accent-light: #eceff1;
  --canvas-bg: #f5f3ee;
  --perfect: #00c853;
  --close: #1976d2;
  --far: #f9a825;
  --miss: #d32f2f;
}
body { background: linear-gradient(160deg, #fafaf7 0%, #f0ede6 100%); }
```

Hard-coded companions: button bg `#fafaf7`, button hover bg `#f0ede6`, secondary text `#546e7a`, primary-hover `#37474f`, glass pill `rgba(255, 255, 255, 0.92)`.

The light theme has two extra text tiers used systematically: `--text-head` for headings/values, `--text-label` for micro-labels. Do NOT rebrand `--accent` per app (keep `#58a6ff` dark / `#455a64` light); app identity comes from entity colors, not the chrome accent.

### Layout skeleton

DOM order inside `<body>`: `<header>` → `<main class="main">` → (script). Nothing after `</main>`. No page-level scrolling on desktop — the panel is the only scroll container. First CSS rule is always the reset, then `:root`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

**Dark chassis** (`.main` height budget 80px for the roomy header):

```css
.main { display: flex; height: calc(100vh - 80px); }
.canvas-wrap { flex: 1; position: relative; background: #080c14; min-width: 0; }
.controls {
  width: 300px;
  flex-shrink: 0;
  padding: 20px;
  border-left: 1px solid var(--panel-border);
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}
```

Divider = `border-left` on `.controls`. Gap between groups: 18px.

**Light chassis** (46px budget for the slim header):

```css
.main { display: flex; height: calc(100vh - 46px); }
.canvas-wrap {
  flex: 1;
  position: relative;
  min-width: 0;
  background: var(--canvas-bg);
  border-right: 1px solid var(--panel-border);
}
.panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
```

Divider = `border-right` on `.canvas-wrap`.

Shared rules:
- `canvas { display: block; width: 100%; height: 100%; touch-action: none; }`
- Display-only HUD chips/pills get `pointer-events: none`; HUD z-index 5–15; full-screen result overlays `position: fixed; inset: 0; z-index: 9999`.
- Visibility: prefer the native `hidden` attribute from JS (`el.hidden = true/false`) with a scoped guard for flex elements (`.thing[hidden] { display: none; }`); never toggle inline `style.display`.
- `.type-btn.full-width { flex: none; width: 100%; }` for a full-width segmented button.

### Fonts & typography

Exactly two Google Fonts, one stylesheet link in `<head>`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Share+Tech+Mono&display=swap"
  rel="stylesheet"
/>
```

- **Outfit** (`body` font) — prose: title, subtitle, mission text, info paragraphs, overlay messages. Weights 400/600/700 only — never request Outfit 500 or mono 600/700 (not loaded; Share Tech Mono has a single weight).
- **Share Tech Mono** — technical UI: section labels, segmented buttons, selects, readouts, HUD clocks, counters, the language button, and all canvas-drawn text.
- Light-chassis exception: verb/action buttons (`.action-btn`, intro nav) use Outfit 13px/600; value-like controls (`.level-btn`) stay mono.

Type scale (px; D = dark chassis, L = light chassis where they differ):

| Size | Use |
|---|---|
| 11px | `.ctrl-label`/`.section-label` captions; L readout labels (uppercase) |
| 12px | D readout rows, D `.info-text`, selects; L subtitle |
| 13px | D subtitle, `.lang-btn`, `.slider-val`; L readout values (700), L `.info-text`, L action buttons |
| 14px | `.type-btn`, canvas prompt |
| 13–17px | canvas text (mono, via `ctx.font`) |
| 15px | level-grid buttons (mono, 600) |
| 16px | stepper glyphs, `.overlay-sub` |
| 17–19px | glass-card inner headings (Outfit 700) |
| 18px | header emoji, HUD clock; L `h1` |
| 20px | hero stat value (mono, 700) |
| 22px | D `h1` (700) |
| 28px | overlay message (Outfit 700) |
| 72px | overlay emoji |

Info text: dark `.info-text { font-size: 12px; color: var(--text-dim); line-height: 1.6; }`; light `13px; color: #546e7a; line-height: 1.5`.

letter-spacing: 1px on `.lang-btn`, dark `.ctrl-label`, primary action; 0.8px on light `.section-label`; 2px on HUD clocks. `text-transform: uppercase` only on section/readout labels.

### Spacing, radii, borders

No spacing variables — a common literal rhythm: **2 / 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 28 px**, with 1/3/5px appearing only in compact chrome (language-button padding, slim-header padding, hairline margins).

- Gaps: 6px within a control group; 8px icon/step rows; 10px within light `.panel-section`; 12px header gap; 18px between dark control groups.
- Paddings: 20px dark panel; `14px 20px` light sections; `20px 28px 16px` dark header; `6px 28px 5px` light header; `10px 4px` segmented buttons; `8px 10px` selects; `8px 18px` HUD pills / canvas prompt; `14px 16px` glass cards; `3px 8px` language button; 24px overlays.
- Border-radius: 4px language button; 2–4px thin bars and slider tracks; 6px interactive controls; 8px surface cards, HUD pills, modals; 50% dots, steppers, slider thumbs. (App-specific hero components may deviate.)
- Border widths: 1px structural hairlines and the language button; 1.5px interactive control borders; 2px slider-thumb border and focus outlines.

### Header

App-emoji home link + h1 + one-line subtitle left, language button right — the ONLY right-side action. Emoji is app-themed and links to the hub.

```html
<header>
  <div class="header-text">
    <h1>
      <a href="/learn/"><span class="header-icon">&#x1F680;</span></a>
      <span id="titleText">App Title</span>
    </h1>
    <p id="subtitleText">One-line subtitle.</p>
  </div>
  <button type="button" class="lang-btn" id="langBtn" title="Switch language" aria-label="Switch language">PL</button>
</header>
```

Emoji span class: `.header-icon` (older apps use legacy names — normalize when touching them). `titleText`/`subtitleText` spans exist so i18n can rewrite them.

**Dark chassis:**

```css
header {
  padding: 20px 28px 16px;
  border-bottom: 1px solid var(--panel-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.header-text { flex: 1; }
header h1 { font-size: 22px; font-weight: 700; }
header h1 a { color: inherit; text-decoration: none; }
header h1 a:hover { opacity: 0.7; }
header p { margin-top: 4px; font-size: 13px; color: var(--text-dim); }
.header-icon { font-size: 18px; line-height: 1; }
```

**Light chassis:** `padding: 6px 28px 5px; align-items: center;`, `h1 { font-size: 18px; color: var(--text-head); display: flex; align-items: center; gap: 8px; }`, `header p { margin-top: 1px; font-size: 12px; }`. Same anatomy otherwise.

### Controls panel & menu conventions

**Dark chassis** — plain vertical stack of `.ctrl-group` blocks separated only by the panel's flex gap. No per-section card backgrounds, no dividers, no underlined labels:

```css
.ctrl-group { display: flex; flex-direction: column; gap: 6px; }
.ctrl-label {
  font-family: "Share Tech Mono", monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
}
```

```html
<div class="ctrl-group">
  <span class="ctrl-label" id="lblThing">Thing</span>
  <!-- widget(s) -->
</div>
```

**Light chassis** — hairline-sectioned cards:

```css
.panel-section {
  padding: 14px 20px;
  border-bottom: 1px solid var(--panel-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.panel-section.grow { flex: 1; }
.section-label {
  font-family: "Share Tech Mono", monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-label);
}
```

Do not mix the chassis (no hairlines inside a `.ctrl-group` stack; no double-bordered labels). Panel order: mode toggle first (if the app has modes) → primary inputs → time-warp/playback → primary action → readouts → info text last. Mode-conditional groups default to `display: none` in CSS (no flash before JS runs). Primary navigation lives in the panel — never in a toolbar above the stage.

**Scrollbars: never styled.** No `::-webkit-scrollbar`, `scrollbar-width`, or `scrollbar-color` anywhere. The panel scrolls natively (`overflow-y: auto`); nothing else scrolls on desktop.

Native selects (the only native form control besides ranges):

```css
.planet-select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1.5px solid var(--panel-border);
  background: var(--panel);
  color: var(--text);
  font-family: "Share Tech Mono", monospace;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}
.planet-select:focus { border-color: var(--accent); }
.planet-select option { background: var(--panel); color: var(--text); }
```

(Class name varies per app — the recipe is what matters.)

### Nav & mode selection

No tabs, no routes, no back buttons — the header emoji link is the only "back".

1. **Mode switch (Explore/Game)** — the first panel group, a two-button `.type-toggle` (`modeExploreBtn`/`modeGameBtn`); JS toggles `.active` and shows/hides mode-specific groups.
2. **Difficulty** — ≤3 tiers: star glyphs `★`/`★★`/`★★★` (`&#x2605;`) in a `.type-toggle`, aria-labels Easy/Medium/Hard. Many levels: a level grid:

```css
.level-row { display: flex; gap: 8px; flex-wrap: wrap; }
.level-btn {
  width: 32px;
  height: 40px;
  border-radius: 6px;
  border: 1.5px solid var(--panel-border);
  background: #fafaf7;
  color: #546e7a;
  font-family: "Share Tech Mono", monospace;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  touch-action: manipulation;
  padding: 0;
}
.level-btn:hover { background: #f0ede6; }
.level-btn.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
.level-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

3. **Time warp / playback** — `.type-toggle` row of `▶` / `▶▶` / `▶▶▶` (`&#x25b6;`) plus a `■` (`&#x25a0;`) stop/reset button. The active warp button's glyph swaps to `▮▮` while playing (JS swaps the glyph); warp buttons get `disabled` when locked. Never word-buttons (Slow/Normal/Fast) or SVG play/pause icons.
4. **Intro/tutorial mode** — a panel-level class swap, not an overlay:

```css
.panel.intro-mode > .panel-section { display: none; }
.panel.intro-mode > .intro-panel { display: flex; }
```

Full-width back button, step title + commentary, prev/counter/next nav (40×40 chevron buttons, mono `1 / 9` counter), Escape exits, ArrowLeft/Right steps, auto-open on first visit via a **versioned** localStorage key `<app>IntroSeenV1` guarded in try/catch.

### Component library

**Language button** (identical everywhere):

```css
.lang-btn {
  background: none;
  border: 1px solid var(--panel-border);
  border-radius: 4px;
  padding: 3px 8px;
  cursor: pointer;
  flex-shrink: 0;
  color: var(--text-dim);
  font-family: "Share Tech Mono", monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: border-color 0.15s, color 0.15s;
}
.lang-btn:hover { border-color: var(--accent); color: var(--accent); }
```

Behavior: label shows the OTHER language (`state.lang === "en" ? "PL" : "EN"`); initial language `(navigator.language || "").startsWith("pl") ? "pl" : "en"`; all strings in one `I18N = { en: {...}, pl: {...} }` with `function T(key) { return I18N[state.lang][key] || key; }`; `applyTranslations()` rewrites `document.title`, `document.documentElement.lang`, labeled textContent, aria-labels, and titles.

**Segmented buttons** (`.type-toggle`/`.type-btn` — the universal dark-chassis control):

```css
.type-toggle { display: flex; gap: 6px; }
.type-btn {
  padding: 10px 4px;
  border-radius: 6px;
  border: 1.5px solid var(--panel-border);
  background: var(--panel);
  color: var(--text-dim);
  font-family: "Share Tech Mono", monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  flex: 1;
}
.type-btn:hover:not(:disabled) { border-color: var(--accent); }
.type-btn.active { border-color: var(--accent); color: var(--accent); }
.type-btn:disabled { opacity: 0.4; pointer-events: none; }
```

Dark active state = accent border + accent text, **no fill**. Light chassis (`.level-btn`/`.intro-seg-btn`): active adds `background: var(--accent-light)` fill — sanctioned for light only. Never a solid accent fill with white text, never per-mode fill colors, never `border: 2px solid transparent`. All buttons are `<button type="button">`; icon-only buttons carry `aria-label` + `title`. Radio-like exclusivity via `classList.toggle("active", …)` in JS. No checkboxes, radios, or switch components anywhere — a latching toggle is a single full-width `.type-btn` with `.active`.

**Light action buttons:**

```css
.btn-row { display: flex; gap: 8px; }
.action-btn {
  flex: 1;
  padding: 10px 8px;
  border-radius: 6px;
  border: 1.5px solid var(--panel-border);
  background: #fafaf7;
  color: var(--text);
  font-family: "Outfit", sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  touch-action: manipulation;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-btn:hover:not(:disabled) { background: #f0ede6; border-color: var(--accent); color: var(--accent); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.action-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

**Primary action** — accent-filled, full-width, weight 700, letter-spacing 1px (dark — `.launch-btn`-style, stacked on `.type-btn.full-width`):

```css
.launch-btn {
  padding: 12px 4px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}
.launch-btn:hover { background: #79b8ff; border-color: #79b8ff; }
.launch-btn.is-retry { background: var(--panel); color: var(--accent); }
```

Light: `.action-btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }` hover `#37474f`. Never `var(--text-head)` near-black fills, never `filter: brightness()` hovers.

**Step buttons** (−/+ steppers):

```css
.step-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--panel-border);
  background: var(--panel);
  color: var(--text-dim);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  touch-action: manipulation;
}
.step-btn:hover { border-color: var(--accent); color: var(--accent); }
.step-btn:active { background: var(--accent); color: var(--bg); }
```

Glyphs are text: `&minus;` and `+`. Press feedback = inverted fill (accent bg, `var(--bg)` text — not `#fff`). Steps dispatch through a shared `stepSlider(sliderId, delta)` that clamps to min/max, rounds to step, and fires `slider.dispatchEvent(new Event("input"))`. Press-and-hold auto-repeat (~300ms delay, then fast interval) is recommended.

**Sliders** — `.slider-row` = step-btn − → range → step-btn + → `.slider-val`:

```css
.slider-row { display: flex; align-items: center; gap: 6px; }
.slider-row input[type="range"] {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--panel-border);
  border-radius: 3px;
  outline: none;
  box-shadow: 0 0 0 2px transparent;
}
.slider-row input[type="range"]:focus-visible { box-shadow: 0 0 0 2px var(--accent); }
/* thumbs — ::-webkit-slider-thumb and ::-moz-range-thumb, identical: */
/* width: 22px; height: 22px; border-radius: 50%; background: var(--accent); cursor: pointer; border: 2px solid var(--bg); */
.slider-val {
  min-width: 28px;
  text-align: right;
  font-family: "Share Tech Mono", monospace;
  font-size: 13px;
  color: var(--text);
}
```

Track uses `var(--panel-border)` (never hard-coded `#e0ddd6`); thumb border is `var(--bg)` with no drop shadow. Range inputs carry aria-labels.

**Readouts** — label-left / value-right mono rows; empty values are `&mdash;` (never `--`):

Dark:

```css
.readouts { gap: 6px; }
.readout-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: "Share Tech Mono", monospace;
  font-size: 12px;
}
.readout-label { color: var(--text-dim); }
.readout-val { color: var(--text); }
```

Light: `.readout-section { gap: 4px }`, rows `align-items: baseline`, labels mono 11px uppercase letter-spacing 0.5px `var(--text-label)`, values mono 13px/700 `var(--text-head)` with semantic classes (`.perfect/.close/.far/.miss` → the semantic vars).

Hero stat: space-between row, `padding: 10px 0`, top+bottom 1px `var(--panel-border)` hairlines, 11px uppercase mono label, 20px mono-bold value. Thin progress/gauge bars: 4–14px tall, `background: var(--panel-border)`, radius 2–4px, `overflow: hidden`, accent or semantic fill (`transition: width 0.12s ease-out`); larger app-specific gauges are fine.

**HUD pill on canvas** (mission clocks, counters): `padding: 8px 18px; border-radius: 8px; background: rgba(11, 15, 24, 0.88); border: 1px solid var(--panel-border);` mono, `pointer-events: none`.

**Canvas prompt** — top-center instruction pill inside `.canvas-wrap`:

```css
.canvas-prompt {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;              /* Outfit */
  color: var(--text-dim);
  border: 1px solid var(--panel-border);
  pointer-events: none;
  white-space: nowrap;
  z-index: 5;
  max-width: calc(100% - 40px);
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s, border-color 0.3s, background 0.3s;
}
```

Background: dark `rgba(11, 15, 24, 0.85)`, light `rgba(255, 255, 255, 0.92)`. State classes recolor text+border (`.active` accent, `.highlight` green).

**Glass tooltip/info card** (dark) — hover tooltips, name panels, entity facts: `position: absolute; z-index: 5–15; background: rgba(19, 24, 37, 0.95); border: 1px solid var(--panel-border); border-radius: 8px; padding: 14px 16px;`. Display-only cards get `pointer-events: none`; interactive HUD panels may accept input. Shown via `:hover`/`:focus-within` or an opacity fade with `.visible` (`transition: opacity 0.15s ease`). Inner heading Outfit 17–19px/700; stat rows reuse the readout pattern. No toasts, no `<dialog>`, no popover libraries; simple tooltips are native `title` attributes kept in sync with `aria-label`.

**Result overlay** — full-screen color wash, content directly on it (no dialog card):

```css
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: overlayFadeIn 0.3s ease;
  padding: 24px;
  text-align: center;
}
.overlay-emoji { font-size: 72px; animation: overlayPop 0.4s ease; }
```

Children: `.overlay-emoji` (72px) → `.overlay-msg` (Outfit 28px/700, `#fff`) → `.overlay-sub` (mono 16px) → `.overlay-hint` (mono 12px). Built by JS (`createElement`, appended to body) or static HTML toggled via the `hidden` attribute — both fine. Tier backgrounds from the shared 4-tier palette (CSS modifier classes preferred, inline from JS acceptable):

- perfect/success `rgba(0, 200, 83, 0.92)`
- close `rgba(25, 118, 210, 0.90)`
- far `rgba(249, 168, 37, 0.92)`
- miss `rgba(211, 47, 47, 0.92)`

Emoji set: 🎯 or 🎉 success, 👍 close, 🤔 far, ❌ miss, 💥 crash. **No skin-tone modifiers.** Shown after the result animation settles; dismissed by click anywhere AND Escape/Enter/Space; overlay gets `role="dialog" aria-live="polite" tabindex="-1"` + focus on open, plus a `.visually-hidden` clip-pattern `aria-live="polite"` announcer.

### Icons

**No icon fonts. Default: Unicode glyphs and emoji as text.**

| Glyph | Entity | Use |
|---|---|---|
| 🚀 / app emoji | `&#x1F680;` | header home link |
| ★ | `&#x2605;` | difficulty (×1–3) |
| ▶ | `&#x25b6;` | time warp (×1–3) |
| ▮▮ | `▮▮` | pause (JS-swapped onto active warp button) |
| ■ | `&#x25a0;` | stop / reset |
| − / + | `&minus;` / `+` | steppers |
| — | `&mdash;` | empty readout values |
| × | `&times;` | multipliers, close |
| 🎯 🎉 👍 🤔 ❌ 💥 | — | result emoji, 72px |

Inline SVG is permitted where a glyph can't express the graphic (reward stars, diagram cards, richer control icons). SVG rules: `viewBox="0 0 24 24"`, explicit width/height, `aria-hidden="true"`, `currentColor` (filled, or `stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`), `svg { display: block; }` on the host button, and `aria-label` + `title` on the button itself.

### Canvas conventions

- Markup: `<canvas id="canvas" aria-label="…"></canvas>` (`role="img"` for passive canvases, `tabindex="0"` for keyboard-interactive ones). No border or radius; fills `.canvas-wrap`.
- Clear color matches the wrap background EXACTLY, refilled every frame: `ctx.fillStyle = "#080c14"` dark / `"#f5f3ee"` light (`clearRect` first is optional when the fill is opaque).
- DPR-aware sizing:

```js
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  W = rect.width;
  H = rect.height;
  canvas.width = Math.max(1, Math.round(W * dpr));
  canvas.height = Math.max(1, Math.round(H * dpr));
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
```

All drawing uses CSS-pixel coordinates W/H.
- Animation: continuous sims use `requestAnimationFrame` with dt clamped to **0.05s max**; event-driven reveals may use elapsed time from `performance.now()`. Either way, handle `visibilitychange` by pausing/rebasing so hidden tabs don't produce a giant dt.
- Canvas text: Share Tech Mono via `ctx.font`, 13–17px (12px only in dense inset panels); no fake mono weights.
- Dark space apps: decorative starfield of ~200 procedural stars in `rgba(200, 210, 220, α)`.
- Cursor state machine from JS hit-testing — inline `canvas.style.cursor` or classes (e.g. `canvas.aiming/.hover-marker/.dragging` → crosshair/grab/grabbing).
- Onboarding hints may be canvas-drawn rounded-rect tooltips (fill `rgba(11,15,24,0.94)`, r=6, 13px mono) that vanish permanently on first interaction.

### Animations & reduced motion

Duration scale: **0.15s** micro-hover (lang-btn, tooltip fades, all light-chassis buttons); **0.2s** dark `.type-btn` and steppers; **0.3s** state/HUD changes (canvas prompt, step dots); **0.05–0.12s ease-out** live bar fills; **0.4s** overlay pop.

```css
@keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes overlayPop {
  0% { transform: scale(0.3); }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
```

Applied as `overlayFadeIn 0.3s ease` on the overlay, `overlayPop 0.4s ease` on the emoji. Attention pulses: 1–1.5s `ease-in-out infinite` border/box-shadow glow — never infinite pulses on ordinary action buttons. Press feedback: `:active:not(:disabled) { transform: scale(0.96); }` on hero buttons. Everything else animates in JS inside the rAF loop (sine pulses, ease-out-cubic pop-ins).

Reduced motion — both layers required:
- CSS `@media (prefers-reduced-motion: reduce)` block disabling the app's keyframe animations AND hover transitions (not just the overlay pair).
- JS gate `window.matchMedia("(prefers-reduced-motion: reduce)")` with a `change` listener, applied to rAF-driven decorative motion.

### Mobile & touch

One breakpoint per app. **Dark chassis** — `@media (max-width: 700px)`, layout stays fixed-height, panel becomes a wrapping row:

```css
@media (max-width: 700px) {
  .main { flex-direction: column; }
  .canvas-wrap { min-height: 350px; flex: 1; }
  .controls {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    border-left: none;
    border-top: 1px solid var(--panel-border);
    padding: 12px 16px;
    gap: 12px;
  }
  .ctrl-group { min-width: 140px; flex: 1; }
}
```

**Light chassis** — `@media (max-width: 720px)`: `.main { height: auto; }` (page scrolls), `.canvas-wrap { min-height: 360px; height: 56vh; border-right: none; border-bottom: 1px solid var(--panel-border); }`, `.panel { width: 100%; }` stays a column.

Touch rules (both chassis):
- `touch-action: none` on the interactive canvas; `touch-action: manipulation` on every tappable button/stepper.
- Prefer `pointerdown/move/up` + `setPointerCapture` for new drag code; legacy mouse+touch pairs with `{ passive: false }` + `preventDefault()` and `e.touches ? e.touches[0] : e` extraction are acceptable.
- Minimum touch targets 40–44px on tap-heavy buttons.
- `user-select: none; -webkit-user-select: none;` only on press-and-hold/drag widgets.
- `-webkit-tap-highlight-color: transparent` on body.
- Viewport meta: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.

### Focus, accessibility & script conventions

**Focus**: buttons `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` (never suppress UA outlines on buttons without a replacement); selects/text inputs `outline: none` + `:focus { border-color: var(--accent); }`; ranges use the transparent-box-shadow trick above; focusable canvas `canvas:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }`. Never merge focus styles into `:hover` selectors.

**Cursor**: `pointer` on all interactive controls and the result overlay; `not-allowed` on disabled buttons (where pointer-events allow); canvas cursor driven by JS state.

**Script**: one inline `<script>` wrapped in `(function () { "use strict"; … })();` with banner section comments. No inline event handlers (addEventListener only). DOM built with `createElement`/`textContent` — never `innerHTML`. `localStorage` always in try/catch; storage keys versioned (`<app>IntroSeenV1`). Debug features gated behind `?debug=1` and removed from the DOM otherwise. Keyboard support throughout: Escape/Enter/Space on overlays, arrows where meaningful, documented shortcuts. `aria-label` on canvases, SVG stages, icon-only buttons, and inputs — re-applied per language by `applyTranslations()`. `.visually-hidden`/`.sr-only` clip-pattern utility class (not `style.cssText`) for live regions.

### Head conventions

`<!doctype html>`, `<html lang="en">` (rewritten at runtime), then in order: charset UTF-8, viewport, `<title>`, `meta description`, `<meta name="author" content="Łukasz Łepecki" />`, `<link rel="canonical" href="https://lepecki.com/learn/<app>/" />`, full `og:` set (title / description / type=website / url / site_name / image=avatar.webp), `twitter:card=summary` + title + description, then the single Google Fonts link. NO `theme-color` meta, NO favicon link. Top-of-file HTML comment documenting the review gate: `npm run code-review -- <app>/index.html`. External libraries (rare) load from jsdelivr with SRI `integrity` + `crossorigin="anonymous"`.
