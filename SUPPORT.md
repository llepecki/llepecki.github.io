# Support / Tip Jar — Parked Plan

This document holds the implementation plan for adding a "Buy me a coffee" tip
jar to the gravity assist simulator. The plan is parked, not active. When ready
to implement, follow the steps below.

---

## Overview

A small ☕ icon button in the simulator's header (next to the language flag)
opens a modal overlay containing a QR code that takes supporters to the
project owner's Buy Me a Coffee page. The QR-overlay approach lets desktop
users scan with their phone *or* click the QR (which is wrapped in an anchor)
to open the BMC page directly. Mobile users tap the icon, see the QR, and can
either long-press to save it or hit the underlying anchor to navigate.

No external scripts, no tracking, no nag — just a discoverable affordance for
users who want to send a thank-you.

## Approach

1. **Coffee button in the header**, immediately to the left of the language
   flag. Plain `<button>` with the ☕ glyph, styled to match `.lang-btn`.
2. **`showCoffeeOverlay()` JS function** that creates a full-screen modal
   overlay containing the QR image (wrapped in an anchor to the BMC URL),
   a short caption, and a click-to-dismiss hint. Mirrors the existing
   `showGameOverlay()` pattern so the dismiss UX feels consistent.
3. **CSS reuses the existing `.result-overlay` skeleton** with a new
   `.coffee-overlay` class for the lighter background tint.
4. **The QR image** is a static asset in the project. Path: `learn/coffee-qr.png`.

## Critical files

- `learn/gravassist.html` (single-file simulator)
  - **Header HTML** (around lines 221–229) — insert the new coffee button
    before `langBtn`
  - **CSS** — add `.coffee-btn` rule next to `.lang-btn`, plus `.coffee-overlay`
    and inner element styles next to `.result-overlay`
  - **I18N en/pl** — add `coffeeTip` (button tooltip) and `coffeeCaption`
    (overlay caption) keys
  - **`applyTranslations()`** — wire `coffeeBtn.title`
  - **JS** — new `showCoffeeOverlay()` function near `showGameOverlay()`

- `learn/coffee-qr.png` — **needs to be provided separately.** Square PNG,
  ~300×300 px or larger, with sufficient quiet-zone padding so the QR scans
  cleanly. Must already encode the BMC URL.

## Implementation steps

### Step 1 — Coffee button CSS

Add next to the existing `.lang-btn` rule:

```css
.coffee-btn {
  background: none; border: 1px solid var(--panel-border);
  border-radius: 4px; padding: 3px 7px;
  cursor: pointer; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-dim);
  font-size: 16px; line-height: 1;
  transition: border-color 0.15s, color 0.15s;
}
.coffee-btn:hover { border-color: var(--accent); color: var(--accent); }
```

### Step 2 — Header HTML

Insert immediately before `langBtn`:

```html
<button class="coffee-btn" id="coffeeBtn" onclick="showCoffeeOverlay()" title="Buy me a coffee">&#x2615;</button>
```

`&#x2615;` is the hot beverage glyph ☕.

### Step 3 — Overlay CSS

Add next to the existing `.result-overlay` rules:

```css
.coffee-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: pointer;
  background: rgba(11,15,24,0.88);
  animation: overlayFadeIn 0.3s ease;
}
.coffee-qr {
  width: 280px; height: 280px;
  background: #fff; padding: 12px; border-radius: 12px;
  display: block;
}
.coffee-qr img {
  width: 100%; height: 100%; display: block;
}
.coffee-caption {
  font-family: 'Outfit', sans-serif;
  font-size: 18px; font-weight: 600;
  margin-top: 18px; color: #fff;
}
.coffee-hint {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px; margin-top: 6px; color: rgba(255,255,255,0.6);
}
```

The QR sits on a white background with padding so the dark space-themed page
doesn't break the QR's contrast (some scanners struggle with inverted QR codes).

### Step 4 — `showCoffeeOverlay()` JS

Add near `showGameOverlay()`:

```js
function showCoffeeOverlay() {
  var existing = document.querySelector('.coffee-overlay, .result-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'coffee-overlay';
  overlay.innerHTML =
    '<a class="coffee-qr" href="https://www.buymeacoffee.com/llepecki" target="_blank" rel="noopener noreferrer">' +
      '<img src="coffee-qr.png" alt="Buy me a coffee QR code">' +
    '</a>' +
    '<div class="coffee-caption">' + T('coffeeCaption') + '</div>' +
    '<div class="coffee-hint">' + T('clickToDismiss') + '</div>';

  // Click outside the QR (anywhere on the dim background) dismisses; clicking
  // the QR follows the anchor and opens BMC in a new tab.
  overlay.addEventListener('click', function(e) {
    if (!e.target.closest('.coffee-qr')) overlay.remove();
  });
  document.body.appendChild(overlay);
}
```

The dismiss handler skips clicks on the QR itself so the anchor's default
behavior (open BMC) wins.

### Step 5 — I18N keys

Add to en:

```js
coffeeTip: 'Buy me a coffee',
coffeeCaption: 'Scan or click to support',
```

Add to pl:

```js
coffeeTip: 'Postaw mi kaw\u0119',
coffeeCaption: 'Zeskanuj lub kliknij, aby wesprze\u0107',
```

Reuse the existing `clickToDismiss` key for the dismiss hint.

### Step 6 — Wire tooltip in `applyTranslations()`

```js
document.getElementById('coffeeBtn').title = l.coffeeTip;
```

The overlay caption is read fresh from `T()` each time `showCoffeeOverlay()`
is called, so no DOM update needed for the overlay itself unless it's
currently visible during a language toggle.

## What needs to be provided when implementing

1. **The QR code image file** as `learn/coffee-qr.png`. Square, 300×300 px or
   larger, with the standard QR quiet-zone padding around the data. The image
   must already encode the BMC URL.
2. **The actual BMC URL** to put in the anchor's `href`. The plan uses
   `https://www.buymeacoffee.com/llepecki` as a placeholder — change if the
   handle differs.

If the URL is correct as-is and the QR file is dropped at `learn/coffee-qr.png`,
no further edits are needed.

## Verification steps

1. **Page loads** — small ☕ button appears in the header to the left of the
   language flag.
2. **Hover** — border and icon turn accent blue.
3. **Click** — full-screen overlay appears with the QR code on a white card,
   caption "Scan or click to support" below, and "Click to continue" hint at
   the bottom.
4. **Click the QR card** — opens BMC page in a new tab. Overlay stays open in
   the original tab.
5. **Click anywhere outside the QR** — overlay dismisses. The simulator
   returns to its previous state.
6. **Toggle language** — coffee button tooltip updates immediately. If the
   overlay is open, its caption is captured at creation time and won't update
   until the next open.
7. **Mobile** — header still shows both buttons cleanly. The QR overlay is
   centered, the QR image is touch-tappable to navigate, and the dim
   background tap dismisses.

## What this is NOT

- Not loading any third-party JavaScript (BMC's official widget script is
  intentionally avoided for privacy and offline-friendliness).
- Not a paywall, popup-on-load, or interstitial. The user must explicitly
  click ☕ to see it.
- Not blocking any existing functionality. Game mode, animation, drag — all
  unaffected.
