# Learn Apps Style Reference

All apps share the same font stack and general structure. Choose light or dark based on the simulation's visual needs (dark suits space/circuit themes, light suits physics diagrams).

## Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

- **Body/UI**: `'Outfit', sans-serif`
- **Labels, values, monospace**: `'Share Tech Mono', monospace`

## Light Theme

Used by: doubleslit, mzinterferometer, waveinterference

### CSS Variables

```css
:root {
  --bg: #FAFAF7;
  --panel: #ffffff;
  --panel-border: #E0DDD6;
  --text: #37474F;
  --text-head: #263238;
  --text-dim: #78909C;
  --text-label: #90A4AE;
  --accent: #455A64;
  --accent-light: #ECEFF1;
  --canvas-bg: #f5f3ee;
}
```

### Body

```css
body {
  min-height: 100vh;
  background: linear-gradient(160deg, #FAFAF7 0%, #F0EDE6 100%);
  font-family: 'Outfit', sans-serif;
  color: var(--text);
}
```

### Header

```css
header {
  padding: 6px 28px 5px;
  border-bottom: 1px solid var(--panel-border);
  display: flex; align-items: center; gap: 12px;
}
header h1 {
  font-size: 18px; font-weight: 700; color: var(--text-head);
  display: flex; align-items: center; gap: 8px;
}
header h1 a { color: inherit; text-decoration: none; }
header h1 a:hover { opacity: .7; }
header p { margin-top: 1px; font-size: 12px; color: var(--text-dim); }
```

### Language Button

```css
.lang-btn {
  background: none; border: 1px solid var(--panel-border);
  border-radius: 4px; padding: 3px 8px;
  cursor: pointer; flex-shrink: 0;
  color: var(--text-dim);
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px; font-weight: 700; letter-spacing: 1px;
  transition: border-color 0.15s, color 0.15s;
}
.lang-btn:hover { border-color: var(--accent); color: var(--accent); }
```

### Type Toggle Buttons

```css
.type-toggle { display: flex; gap: 6px; }
.type-btn {
  flex: 1; padding: 8px 4px; border-radius: 8px;
  border: 2px solid transparent;
  background: #FAFAF7; color: #546E7A;
  font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; text-align: center;
  touch-action: manipulation;
}
.type-btn.active {
  border-color: var(--accent); background: var(--accent-light); color: var(--accent);
}
.type-btn:hover { background: #F0EDE6; }
```

### Fire Button (primary action)

```css
.fire-btn {
  padding: 12px 4px; font-size: 14px; font-weight: 600;
  background: var(--text-head); color: #fff; border: none; border-radius: 10px;
}
.fire-btn:hover { background: #37474F; }
.fire-btn:active { transform: scale(0.97); }
```

### Sliders

```css
.slider-row { display: flex; align-items: center; gap: 8px; }
.slider-row input[type=range] {
  flex: 1; -webkit-appearance: none; appearance: none;
  height: 6px; background: #E0DDD6; border-radius: 3px; outline: none;
  touch-action: none;
}
.slider-row input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); cursor: pointer; border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.slider-row input[type=range]::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); cursor: pointer; border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.slider-val {
  min-width: 36px; text-align: right;
  font-family: 'Share Tech Mono', monospace; font-size: 13px;
  font-weight: 700; color: var(--text-head);
}
```

### Control Labels

```css
.ctrl-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px;
  color: var(--text-label);
}
```

### Info Text

```css
.info-text { font-size: 13px; color: #546E7A; line-height: 1.6; }
.info-text a { color: var(--accent); }
```

### Canvas

- CSS background: `var(--canvas-bg)` (`#f5f3ee`)
- JS fill: `ctx.fillStyle = '#f5f3ee'`

### Auto-fire Pulse Animation

```css
@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 2px rgba(38,50,56,0.3); }
  50% { box-shadow: 0 0 0 2px rgba(38,50,56,0.08); }
}
.auto-active { animation: pulse-border 1.2s ease infinite; }
```

---

## Dark Theme

Used by: gravassist, gravlens, logigate

### CSS Variables

```css
:root {
  --bg: #0b0f18;
  --panel: #131825;
  --panel-border: #1e2a3a;
  --text: #c9d1d9;
  --text-dim: #6e7a8a;
  --accent: #58a6ff;
}
```

### Body

```css
body {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'Outfit', sans-serif;
  color: var(--text);
}
```

### Header

```css
header {
  padding: 20px 28px 16px;
  border-bottom: 1px solid var(--panel-border);
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
header h1 { font-size: 22px; font-weight: 700; }
header h1 a { color: inherit; text-decoration: none; }
header h1 a:hover { opacity: .7; }
header p { margin-top: 4px; font-size: 13px; color: var(--text-dim); }
```

### Language Button

```css
.lang-btn {
  background: none; border: 1px solid var(--panel-border);
  border-radius: 4px; padding: 3px 8px;
  cursor: pointer; flex-shrink: 0;
  color: var(--text-dim);
  font-family: 'Share Tech Mono', monospace;
  font-size: 13px; font-weight: 700; letter-spacing: 1px;
  transition: border-color 0.15s, color 0.15s;
}
.lang-btn:hover { border-color: var(--accent); color: var(--accent); }
```

### Type Toggle Buttons

```css
.type-toggle { display: flex; gap: 6px; }
.type-btn {
  padding: 10px 4px; border-radius: 6px;
  border: 1.5px solid var(--panel-border);
  background: var(--panel); color: var(--text-dim);
  font-family: 'Share Tech Mono', monospace; font-size: 12px;
  cursor: pointer; transition: all 0.2s; text-align: center;
  flex: 1;
}
.type-btn:hover { border-color: var(--accent); }
.type-btn.active { border-color: var(--accent); color: var(--accent); }
```

### Step Buttons (+/-)

```css
.step-btn {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1.5px solid var(--panel-border);
  background: var(--panel); color: var(--text-dim);
  font-family: 'Share Tech Mono', monospace; font-size: 16px; line-height: 1;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.step-btn:hover { border-color: var(--accent); color: var(--accent); }
.step-btn:active { background: var(--accent); color: var(--bg); }
```

### Sliders

```css
.slider-row input[type=range] {
  flex: 1; -webkit-appearance: none; appearance: none;
  height: 6px; background: var(--panel-border); border-radius: 3px; outline: none;
}
.slider-row input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); cursor: pointer; border: 2px solid var(--bg);
}
.slider-row input[type=range]::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--accent); cursor: pointer; border: 2px solid var(--bg);
}
.slider-val {
  min-width: 28px; text-align: right;
  font-family: 'Share Tech Mono', monospace; font-size: 13px; color: var(--text);
}
```

### Control Labels

```css
.ctrl-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
  color: var(--text-dim);
}
```

### Info Text

```css
.info-text { font-size: 12px; color: var(--text-dim); line-height: 1.6; }
```

### Canvas

- CSS background: `#080c14`
- JS fill: `ctx.fillStyle = '#080c14'`

---

## Shared Conventions

- Reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
- Controls panel width: `300px`, flex-shrink: 0
- Controls sections: `padding: 20px`, separated by `border-bottom: 1px solid var(--panel-border)`
- Control group gap: `6px` between label and input
- All interactive elements: `cursor: pointer`
- Mobile touch: `touch-action: manipulation` on buttons, `touch-action: none` on sliders
- Simulation-specific variables (e.g. `--photon`, `--d1-color`, `--wave-a`) go after the base set in `:root`
