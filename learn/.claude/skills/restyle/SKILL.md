---
name: restyle
description: Restyle a learn app to the canonical style in learn/CLAUDE.md (layout chassis, header, panel, components, fonts, overlays, a11y). Use when the user asks to restyle, re-skin, or bring an app up to the house style. Usage - /restyle <app>
argument-hint: <app>
---

# Restyle a learn app to the established style

Bring `learn/<app>/index.html` into conformance with the **Style reference** section of `learn/CLAUDE.md`. This is a restyle, NOT a redesign: zero behavior changes, zero physics/simulation changes, zero content changes.

Target app: `$ARGUMENTS` (if empty, ask which app to restyle; validate that `<app>/index.html` exists).

## Ground rules

1. **The single source of truth is `learn/CLAUDE.md` → "Style reference".** Read that section first. It defines a dark chassis and a light chassis — the app's EXISTING theme decides which applies. Never flip an app's theme unless the user explicitly asks.
2. **Known deviations live next to the app.** If `<app>/docs/style-drift.md` exists, read it: it lists recorded divergences and — critically — the app-specific components that are sanctioned and must NOT be "fixed". The guide is self-contained; if it is genuinely silent on a detail, propose something consistent with its scales and ask the user.
3. **Preserve:** all I18N strings and keys, all simulation/game logic, all element IDs referenced by JS (if you rename a class/ID, update every reference in the same edit), app-specific entity colors (they belong after the core tokens in `:root`), and sanctioned app-specific hero components.
4. **Behavior-affecting changes that ARE in scope** (they're part of the style contract): focus styles, aria-labels/roles, keyboard dismissal of overlays, `touch-action`, reduced-motion gating, i18n of hardcoded UI strings. Anything beyond that list needs the user's go-ahead.
5. Work in verifiable steps: audit → plan → edit → verify. Show the audit before editing large amounts.

## Step 1 — Baseline

From `learn/`:

```bash
npm run code-review -- <app>/index.html   # record finding counts (before)
wc -l <app>/index.html
```

Read the ENTIRE target file (style block, HTML structure, and JS — canvas colors, dynamically built UI, and cursor/overlay logic live in JS), plus `<app>/docs/style-drift.md` if present.

## Step 2 — Audit

Check every category below against the Style reference. Record each divergence as: category → current state (with line numbers) → target state. These are the drift patterns actually observed across this codebase, worst first:

1. **Layout skeleton** — body must be `header → main.main → script`, nothing after `</main>` (no status-bar strips). Fixed height: `calc(100vh - 80px)` dark / `calc(100vh - 46px)` light. Divider: `border-left` on `.controls` (dark) / `border-right` on `.canvas-wrap` (light). Panel width 300px dark / 320px light (drift: 240–260px). No toolbar above the stage — primary navigation moves into the panel. Desktop must not page-scroll.
2. **Panel structure** — dark: borderless `.ctrl-group` stack, gap 18px, NO section hairlines, NO underlined labels. Light: `.panel-section` cards (`padding: 14px 20px; border-bottom: 1px solid var(--panel-border); gap: 10px`). Don't mix. Visibility via `el.hidden` + scoped `[hidden]` guard, not inline `style.display`.
3. **Header** — dark: `20px 28px 16px`, h1 22px, subtitle 13px, `align-items: flex-start`. Light: `6px 28px 5px`, h1 18px, subtitle 12px, centered. Emoji span class `.header-icon` (drift: legacy per-app names); lang button with BOTH `title` and `aria-label`; no extra header actions (theme toggles, intro buttons → relocate or drop per user).
4. **Fonts/typography** — segmented/technical buttons in Share Tech Mono 14px (drift: Outfit 11–15px weight 500 — weight 500 isn't even loaded). Never request Outfit 500 or mono 600/700 anywhere, including `ctx.font`. Labels: mono 11px uppercase, letter-spacing 1px `--text-dim` (dark) / 0.8px `--text-label` (light). Canvas text mono 13–17px — 12px is acceptable only in dense inset panels; anything smaller, or Outfit in `ctx.font`, is drift.
5. **Buttons** — `.type-btn`: radius 6px, `1.5px solid var(--panel-border)` (drift: radius 8px, `2px solid transparent`); dark active = accent border+text NO fill; light active = `--accent-light` fill; never solid per-mode color fills with white text, never fused/joined segmented pills. Primary action = accent fill, weight 700, letter-spacing 1px (drift: `var(--text-head)` near-black, radius 10px, borderless, `filter: brightness()` hover). Disabled: opacity 0.4.
6. **Sliders/steppers** — every slider gets flanking 28×28 round `.step-btn` −/+ (via shared `stepSlider()`), track `var(--panel-border)` (drift: hardcoded `#e0ddd6`), 22px thumb bordered `2px solid var(--bg)` (drift: `#fff` + drop shadow), `.slider-val` 13px mono min-width 28px (drift: 36–52px/700/`--text-head`), aria-labels on ranges.
7. **Readouts** — dark: both sides mono 12px, label `--text-dim`, value `--text`. Light: 11px uppercase `--text-label` labels, 13px/700 `--text-head` values. Empty = `&mdash;` (drift: `'--'` from JS). No ad-hoc `.stat-row` variants.
8. **Playback/difficulty/nav idioms** — time warp = `▶/▶▶/▶▶▶` + `■` glyph row with `▮▮` pause swap (drift: SVG play/pause/stop icon buttons, word buttons Slow/Normal/Fast). Difficulty = `★/★★/★★★` (≤3 tiers) or the 32×40 `.level-btn` grid. Mode switch = first panel group `.type-toggle`.
9. **Result overlay** — `.result-overlay` with 72px emoji / 28px msg / mono sub+hint; 4-tier palette `rgba(0,200,83,.92)` / `rgba(25,118,210,.90)` / `rgba(249,168,37,.92)` / `rgba(211,47,47,.92)` (drift: legacy 3-tier `rgba(63,185,80,.88)`-family, off-palette teal/pink); emoji 🎯🎉/👍/🤔/❌/💥 without skin-tone modifiers; dismiss = click AND Escape/Enter/Space; `role="dialog" aria-live="polite" tabindex="-1"` + focus + `.visually-hidden` announcer. If the file ships overlay CSS that no JS ever uses, ask the user whether to wire it up or delete the dead code.
10. **Theme palette & canvas** — `:root` core tokens exactly match the guide (drift: rebranded `--accent`, invented palettes, `--success/--error` instead of the semantic set); entity colors appended after core; repeated literals replaced by their tokens where a token exists. Canvas JS clear color EXACTLY equals the wrap background (`#080c14` / `#f5f3ee`); DPR-aware resize with `setTransform`; rAF loop with dt clamped to 0.05s (or elapsed-time reveals) + `visibilitychange` pause/rebase; canvas has `aria-label` (+`role="img"` passive / `tabindex="0"` keyboard-interactive).
11. **Scrollbars/overflow** — grep `::-webkit-scrollbar|scrollbar-width|scrollbar-color` → must be empty; only the panel scrolls on desktop.
12. **Animations/reduced motion** — durations within the guide's sanctioned set (0.15/0.2/0.3s, 0.05–0.12s bar fills, 0.4s overlay pop); canonical `overlayFadeIn`/`overlayPop`; CSS reduced-motion block covering ALL keyframes + hover transitions (drift: overlay-only token gestures); JS `matchMedia("(prefers-reduced-motion: reduce)")` gate with change listener on rAF decoration; no infinite pulses on ordinary buttons.
13. **Mobile/touch** — one breakpoint (700px dark fixed-height row-wrap panel / 720px light column); `touch-action: none` on canvas, `manipulation` on buttons; 40–44px targets; `-webkit-tap-highlight-color: transparent`.
14. **Focus/keyboard** — `:focus-visible` accent outline on every button (drift: none at all, or merged into `:hover`); Escape/Enter/Space on overlays; no `outline: none` without replacement.
15. **Head/meta & icons** — author, canonical (`https://lepecki.com/learn/<app>/`), full `og:`, `twitter:` set; exactly one Google Fonts link (Outfit 400/600/700 + Share Tech Mono); review-gate comment says `npm run code-review -- <app>/index.html` (drift: stale `<app>.html`); no favicon/theme-color. Inline SVG icons follow the guide's rules (`viewBox="0 0 24 24"`, `aria-hidden="true"`, `currentColor`, host button labeled).
16. **Script conventions** — IIFE + `"use strict"`, no `innerHTML`, guarded `localStorage`, versioned keys (`<app>IntroSeenV1`), debug features gated behind `?debug=1`, aria-labels re-applied in `applyTranslations()`, no hardcoded untranslated UI strings (drift: English-only overlay detail lines).

Useful greps:

```bash
grep -n 'og:\|canonical\|twitter:\|name="author"' <app>/index.html
grep -n '::-webkit-scrollbar\|scrollbar-width\|scrollbar-color' <app>/index.html
grep -n 'font-weight: 500\|Outfit.*500\|focus-visible\|touch-action\|matchMedia' <app>/index.html
grep -n 'innerHTML\|style.display\|localStorage' <app>/index.html
grep -cn 'aria-' <app>/index.html
```

## Step 3 — Plan and confirm

Present the audit as a categorized table (category, current, target, risk). Flag anything that changes visible layout significantly (panel width, toolbar relocation, header size) and anything you propose to leave alone (sanctioned app-specific components, extra tokens). Get the user's confirmation on the flagged items before editing; proceed directly on the mechanical ones.

## Step 4 — Apply

Edit in category order (palette → skeleton → header → panel → components → overlays → a11y/meta), keeping each edit self-consistent: when a class is renamed or a component replaced, update its CSS, HTML, and every JS reference in the same pass. Match the file's existing formatting (2-space indent inside `<style>`, Prettier-compatible layout — the code-review tool checks Prettier cleanliness).

## Step 5 — Verify

```bash
npm run code-review -- <app>/index.html   # compare against baseline: no new high/medium findings
```

Then:
- Grep-verify the fixed categories (scrollbars, focus-visible, touch-action, meta tags, `&mdash;`).
- Confirm canvas JS clear color(s) equal the CSS wrap background.
- Confirm both languages still render: every `T()` key used in new/edited markup exists in BOTH `I18N.en` and `I18N.pl`.
- Confirm no element ID referenced in JS was orphaned: `grep -o 'getElementById("[^"]*")' <app>/index.html | sort -u` against the markup.
- Ask the user to click through the app locally (`bundle exec jekyll serve` from the repo root) — visual regressions in canvas-heavy apps can't be caught by grep.

## Step 6 — Report

Summarize per category: what changed, what was intentionally left (and why), and any items deferred for the user's decision. Update `<app>/docs/style-drift.md`: delete entries you fixed, add entries for divergences found but deferred (create the file if needed; delete it if the app is now fully conformant). Suggest a commit message of the form `style: Restyle <app> to house style` but do not commit unless asked.
