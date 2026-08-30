# Trust Dilemma — Design And Verification Plan

> **SUPERSEDED (2026-07-15) for the game mechanics.** The app was rebuilt as
> **"The Crossing"** — see `spec-crossing-2026-07-15.md` (the authoritative
> current design) and the Monte-Carlo gate in `tools/dilemma-rules-check.mjs`.
> The chrome/decision record below (light chassis, header, i18n/skin system,
> privacy + handoff machinery, board redesign, choice-commit debounce,
> reduced-motion, a11y — Decisions 1–11) is still accurate and was carried
> into the rebuild; the threshold-specific mechanics (§3 rules block, §4.3–4.6
> target/spare/sudden-death, §5 panel payoff matrix) are historical. A full
> rewrite is deferred until the new design settles.

Living design reference for `dilemma/index.html`. Requirements live in `req.md`;
this document records HOW the app is built and verified, and does not restate
WHAT the game is. Where the two disagree, `req.md` rules unless a decision below
explicitly overrides it.

Style baseline: `CLAUDE.md` light chassis. Implementation precedents:
`codebreak/index.html` (DOM-based stage, phase visibility, overlay, i18n) and
`roman/index.html` (text-input recipe, action buttons).

## 1. Decisions Record

Resolved with the project owner on 2026-07-12:

1. **Modes** — v1 ships all three presets: Classic (default, 6 rounds / target
   32), Sprint (4 / 22), Long Game (8 / 43). Pure presets: identical rules and
   screens, only `rounds` and `target` differ. Mode is selectable only on the
   setup screen; changing modes mid-match requires New match.
2. **Handoff countdown** — when the 5-second countdown reaches zero, the screen
   holds on a "tap when ready" button; the next phase never auto-advances. The
   button cannot appear before zero, so the mandatory 5-second privacy window is
   preserved (this is not a skip button).
3. **Final outcome** — house full-screen color-wash overlay announces the
   outcome first (dismiss via click / Escape / Enter / Space); dismissing it
   reveals the in-stage reflection screen with the counterfactual table and
   Play again / New match.
4. **Post-review adjustments** (owner feedback after the v1 build,
   2026-07-12):
   - Handoff countdown is **3 seconds** (overrides req §6.4's 5-second
     default).
   - Only the pass handoff holds on a Ready tap; the **reveal fires
     automatically** when its countdown reaches zero (both players are
     watching, so there is no privacy risk).
   - High-contrast selection state: ✓ corner badge + 4px ring + slight scale
     on the chosen card; the other card dims to 45% opacity.
   - Each player has an identity color (P1 `--p1` blue `#1976d2`, P2 `--p2`
     purple `#8e24aa`): colored score numbers and dots, result-card top
     borders, and a **stacked** shared-target bar whose two segments are the
     players' personal contributions — personal score is a first-class
     visual, not just a number.
   - De-bloat: shorter setup copy and choice-card notes (concrete payoff
     numbers), strategy-note panel section removed, payoff matrix and history
     enlarged to 13px mono with roomier padding.
5. **Post-review cuts and copy fixes** (independent code review + owner
   sign-off, 2026-07-12): the side-panel Mode summary and the mid-game panel
   New match button are removed (mode is fixed at setup; mid-match reset falls
   back to browser refresh). The review's other two suggested cuts were
   **rejected** — the final overlay and all three mode presets stay (Decisions
   1 and 3). Copy fixes from the same review: kid-simpler setup title and
   debrief, an explicit rows/columns explanation on the payoff matrix, the
   unambiguous "one always Black, the other always White" counterfactual
   label, and req §6.4 updated to the 3-second countdown + ready-hold /
   auto-reveal behavior.
6. **Token style setting** (owner feature request, 2026-07-13): the setup
   screen has a Style section with three skins — "⚪⚫ White & Black"
   (default), "🐐🐺 Goat & Wolf", and "🐬🦈 Dolphin & Shark". A skin is pure
   presentation: `state.skin` (`"bw" | "gw" | "ds"`) swaps token visuals
   (CSS discs vs emoji from the `SKIN_EMOJI` map through a shared
   `renderTokenEl` helper) and every choice-dependent string through a `TK()`
   lookup keyed by the `SKIN_SUFFIX` map (`…Gw` / `…Ds` variants) that falls
   back to the base key when no variant exists.
   Polish declension (e.g. "wybierze Wilka") is why the skin uses full string
   variants instead of word substitution. The choice-card backgrounds are
   tinted to match the creatures (owner request): goat cream `--card-goat`,
   wolf slate `--card-wolf`, dolphin sky `--card-dolphin`, shark steel
   `--card-shark` — applied via a `skin-gw`/`skin-ds` class on `#phaseTurn`;
   the light-card = cooperate / dark-card = compete contrast is preserved in
   every skin. The rules engine is untouched —
   choices stay `"white"`/`"black"` internally, so the rules-check needs no
   changes. The skin is selectable only at setup and is not persisted (the
   zero-storage decision stands).
7. **Accessibility & board polish** (code review + owner feedback,
   2026-07-13): tokens rendered by `renderTokenEl` are `aria-hidden`
   decorations; history rows carry a visually-hidden "name: choice, name:
   choice" text plus tooltips on the dots; mode and style pickers expose
   `aria-pressed` via a shared `setToggle` helper; the header emoji is
   desaturated to a neutral white-ish look (`filter: grayscale(1)
   brightness(1.3)`); target-board player rows are a single baseline line
   (18px name, 28px score); emoji tokens enlarged for kids (16/22/28/64px)
   and history tokens bumped to the md size; the pass hold no longer shows a
   `0` — the numeral hides and the title becomes "Now {name}" / "Teraz
   {name}"; and a round-progress dot strip under the shared bar shows
   completed / current / remaining rounds.
8. **Result-card and header polish** (owner feedback, 2026-07-13): result
   items got breathing room (18/20px padding, 12px gap) and the "+5 pts /
   Total: 5" lines were replaced with the KPI stat-block pattern described in
   §4.5; the header emoji is 🤝🏻 with the light skin-tone modifier — an
   explicit owner override of the style reference's no-skin-tone rule,
   recorded in `style-drift.md`.
9. **No End-turn button** (owner decision, 2026-07-13): tapping a choice card
   commits the turn by itself after a 700 ms debounce (`CHOICE_COMMIT_MS`),
   so the player briefly sees the selection; tapping the other card within
   the window switches and resets the timer. The debounce callback guards on
   phase and pending choice, so a stale timer can never fire into another
   phase. Overrides req §6.3's End-turn flow (req updated to match).
10. **Target-board redesign** (owner UX review, 2026-07-13): the board's four
    stacked center layers were collapsed into the sports-scoreboard layout
    described in §4.1 — one aligned hero row plus one "18 / 34 · dots"
    caption. This also fixed a fill-attribution bug: both segments used to
    grow from the left, so with P1 at 0 points P2's color sat next to P1's
    name; fills now converge from each player's own side (a one-line
    `justify-content: space-between` change that applies to the panel bar
    too). The "SHARED TARGET" label left the board (panel keeps it); the bar
    gained `role="progressbar"` semantics instead. Owner picked the
    minimal-caption variant from three previewed layouts. Follow-up (same
    review): the board's identity dots were dropped (board only — panel rows
    and result cards keep theirs) and the caption was promoted to 20px/700
    progress text with 14px round dots, since the shared target is the
    lose-together signal. Second follow-up: the panel's Scores & shared
    target section was removed outright — after the board redesign it merely
    duplicated the board — leaving the panel with Payoff matrix and Round
    history; `sharedTarget` survives as the board progressbar's aria-label
    only, and `scoresLabel` was dropped from the i18n inventory.
11. **Shared-goal pressure package** (owner design review, 2026-07-15): the
    game exerted too little pressure toward the shared target — Classic had
    an invisible slack of 4 group points, so four betrayals against a
    cooperator still won. Grounded in threshold public-goods research
    (higher thresholds and common knowledge of the threshold state increase
    cooperation) and semi-co-op design practice (Dead of Winter / CO₂:
    visible doom meter + a live "everyone loses now" ending), the owner
    approved the full package: **(a) tighter targets** — a **constant slack**
    `target = maxCoopTotal - 2` (Classic 34, Sprint 22, Long 46; spare 2 in
    every mode). The `- 2` is exactly the cost of one betrayal plus one
    payback, so the betray → retaliate → reconcile arc the debrief teaches
    fits in every mode while a third betrayal or any mutual betrayal is fatal;
    a lone defector claiming the whole budget still wins (Classic two Blacks →
    22:12 at exactly 34), preserving the dilemma as a scarcity fight. (History
    note: the original `ceil(maxCoop * 0.88)` left an invisible slack of 4 in
    Classic — the "too little pressure" bug; an interim `ceil(maxCoop * 0.94)`
    fixed Classic but gave Sprint slack 1, a degenerate state where the first
    betrayer always won and the victim could never retaliate. The constant
    `- 2` is the tightest threshold that keeps the full PD story playable once
    per match in every mode.) **(b) spare meter** — a "Spare N" /
    "Zapas N" chip in the board caption (neutral ≥ 2, amber at 1, red at 0)
    fed by new pure rules helpers `maxPossible`/`spare`/`isUnreachable`;
    **(c) sudden death** — when the target becomes unreachable the round
    result warns "out of reach", the button becomes Final result, and the
    match ends early with the miss overlay plus an early-end note on the
    reflection screen. Result screens also warn at spare 0 with a skin-aware
    "one more {Black/Wolf/Shark} and nobody can win". req §4.3/§5/§13/§14
    updated to match; the rules-check gained spare/sudden-death assertions
    and a brute-force early-end sweep.

Derived decisions (aligned with family precedent found in `roman/index.html`
and `codebreak/index.html`):

- **No localStorage at all in v1.** Neither reference app persists language;
  `req.md` forbids match persistence and intro overlays. The recommended
  `dilemmaLangV1` key is therefore dropped. If storage is ever added, it must
  use versioned keys in try/catch per `CLAUDE.md`.
- **Fully DOM stage, no canvas** — matches `codebreak` (`.stage-wrap`). The
  shared target board is CSS/DOM only.
- **Round-result feedback is in-stage**; the result overlay is used exclusively
  for the final outcome (req §8.3).
- **New match returns to setup with the previous names prefilled** (editable)
  and the previous mode selected — kid-friendly, nothing hidden is carried over.

## 2. Architecture

One self-contained `dilemma/index.html`: inline CSS, one inline
`(function () { "use strict"; ... })();` script with banner section comments,
no external JS, Google Fonts link identical to the family (Outfit 400/600/700 +
JetBrains Mono). Head conventions per `CLAUDE.md` (canonical + `og:url` =
`https://lepecki.com/learn/dilemma/`, review-gate comment at the top of the
file).

DOM skeleton (order fixed; nothing after `</main>` except the script):

```html
<header>… title / subtitle / .lang-btn …</header>
<main class="main">
  <section class="stage-wrap">
    <div class="target-board" hidden>…</div>
    <div class="visually-hidden" aria-live="polite" id="announcer"></div>
    <section class="phase" id="phaseSetup">…</section>
    <section class="phase" id="phaseTurn" hidden>…</section>
    <section class="phase" id="phaseHandoff" hidden>…</section>
    <section class="phase" id="phaseResult" hidden>…</section>
    <section class="phase" id="phaseFinal" hidden>…</section>
  </section>
  <aside class="panel">
    <div class="panel-section" id="secPayoff">…</div>
    <div class="panel-section grow" id="secHistory">…</div>
  </aside>
</main>
```

Visibility is exclusively the native `hidden` attribute with the scoped guard
`.phase[hidden], .panel-section[hidden], .target-board[hidden] { display: none; }`
— never inline `style.display` (family rule, confirmed in both reference apps).

Layout: light chassis verbatim — `.main { display: flex; height: calc(100vh - 46px); }`,
`.stage-wrap { flex: 1; position: relative; min-width: 0; background: var(--canvas-bg); border-right: 1px solid var(--panel-border); }`,
`.panel { width: 320px; flex-shrink: 0; overflow-y: auto; }`. The stage is a
flex column: `.target-board` pinned at the top, the active `.phase` centered in
the remaining space inside a `max-width: 560px` column. The panel is the only
scroll container on desktop; stage content is designed to fit ≥ 620px viewport
heights.

## 3. State Model And Phase Machine

```js
const state = {
  lang: "en",              // "en" | "pl"
  reduceMotion: false,     // JS gate, mirrors prefers-reduced-motion
  phase: "setup",          // setup | turn | handoff | result | final
  handoffKind: null,       // "pass" (P1 → P2) | "reveal" (P2 → reveal), only in handoff
  mode: "classic",         // classic | sprint | long
  skin: "bw",              // "bw" discs | "gw" goat-vs-wolf | "ds" dolphin-vs-shark
  names: ["Player 1", "Player 2"],
  round: 1,                // 1-based
  activePlayer: 0,         // 0 | 1, only meaningful in turn phase
  choices: [null, null],   // "white" | "black" | null — JS-only, NEVER mirrored to DOM
  scores: [0, 0],
  history: [],             // { round, choices: [c1, c2], points: [a, b], groupPoints, kind }
                           // kind: "coop" | "split" | "defect" — appended ONLY at reveal
  countdown: { remaining: 0, running: false, anchor: 0, done: false }
};
```

Transitions (the only legal edges; every transition goes through one
`setPhase()` that toggles section visibility, moves focus, and updates the
announcer):

```text
setup --Start (valid names)--> turn(P1)
turn(P1) --card tap (700 ms debounce)--> handoff(pass)   [3s countdown, then "Now {name}" hold]
handoff(pass) --Ready tap--> turn(P2)
turn(P2) --card tap (700 ms debounce)--> handoff(reveal) [3s countdown]
handoff(reveal) --auto at zero--> result [round resolved, history appended]
result --Next round--> turn(P1), round += 1        (while round < rounds)
result --Final result--> final + outcome overlay   (after last round)
final --Play again--> turn(P1)  [scores/history/round reset; names+mode+skin kept]
final --New match--> setup      [names prefilled, mode+skin kept, match reset]
```

Rules block — pure, DOM-free, delimited with `// [rules:start]` /
`// [rules:end]` markers so `tools/dilemma-rules-check.mjs` can extract it via
`vm.runInNewContext` exactly like `tools/codebreak-puzzle-check.mjs` does:

```js
// [rules:start]
const PAYOFF = { R: 3, T: 5, S: 0, P: 1 };
const MODES = {
  classic: { rounds: 6, target: 34 },  // target = maxCoopTotal - 2 (constant slack)
  sprint:  { rounds: 4, target: 22 },
  long:    { rounds: 8, target: 46 }
};
function resolveRound(c1, c2) { /* → [p1Points, p2Points] per req §4.2 */ }
function roundKind(c1, c2)   { /* → "coop" | "split" | "defect" */ }
function judgeMatch(scores, target) { /* → "miss" | "p1" | "p2" | "tie" (>= target reaches) */ }
function counterfactuals(modeKey) {
  // { allWhite: rounds*2R, oneBlack: rounds*(T+S), allBlack: rounds*2P }
}
function maxPossible(total, playedRounds, modeKey) { /* total + 2R * remaining */ }
function spare(total, playedRounds, modeKey) { /* maxPossible − target */ }
function isUnreachable(total, playedRounds, modeKey) { /* spare < 0 → sudden death */ }
// [rules:end]
```

Rendering follows the `codebreak` modular pipeline: `renderVisibility()`,
`renderTargetBoard()`, `renderTurn()`, `renderHandoff()`, `renderResult()`,
`renderFinal()`, `renderScores()`, `renderPayoff()`, `renderHistory()`, plus
`applyTranslations()` re-running all of them on language switch.

## 4. Stage Design By Phase

### 4.1 Shared target board (visible in turn / result / final; hidden in setup / handoff)

```text
┌────────────────────────────────────────────────────┐
│ Ala  9  ▐███▌░░░░░░░░░░░░░░░▐██▌  9  Ola           │
│           18 / 34  ·  ●●●○○○  ·  Spare 2           │
└────────────────────────────────────────────────────┘
```

Sports-scoreboard pattern (Decision 10): one baseline-aligned hero row —
name (Outfit 18/600) + score (mono 28/700 in the player's color) on each
side, scores hugging the ends of a central 14px bar (`flex: 1`). No identity
dots on the board (the colored score and the fill growing from the player's
own side carry the color association; the panel rows and result cards keep
their dots as the legend). The bar's fills **converge**: `justify-content: space-between`
anchors the `--p1` segment to the left end and the `--p2` segment to the
right, each sized `score / target` (`w2` clamped to `100 − w1`), so every
player's color grows from their own side and the fills meet when the target
is reached. The bar is a real `role="progressbar"`
(`aria-valuemin/now/max`, `aria-label` = `sharedTarget`, re-applied per
language). Below, one centered caption line: mono `18 / 34` at 20px/700, the
round-progress dot strip with 14px dots (`role="img"` with a "Round X of
Y" aria-label; filled = played, ring = current), and the spare chip
(`Spare N` / `Zapas N`, mono 14/700 — neutral while spare ≥ 2, `--far` amber
at 1, `--miss` red at 0; Decision 11) — deliberately prominent, because
missing the shared target loses the match for both players, making this line
as decision-relevant as the personal scores. The "SHARED TARGET"
words appear only in the side panel. Scores and the meter reflect **completed
rounds only** — they update at reveal, never mid-round, so the board leaks
nothing.

### 4.2 Setup

```text
        White grows the group. Black can win the round.
   Both players need the shared target. If the group misses it,
   nobody wins. If the target is reached, the higher score wins.

   Player 1 name  [____________]     Player 2 name  [____________]

   MODE   [ Classic ] [ Sprint ] [ Long Game ]
          6 rounds · shared target 34

                        [  Start match  ]
```

- Name inputs use the `roman` `.num-input` recipe generalized (`.name-input`):
  `padding: 8px 10px; border-radius: 6px; border: 1.5px solid var(--panel-border); background: var(--panel); font-family: "JetBrains Mono"; font-size: 13px; outline: none;`
  focus → accent border; `text-align: left`, `maxlength="14"`,
  `autocomplete="off"`, visible `<label>` above each (`.section-label` style),
  placeholder = the default name.
- Mode picker: three segmented mono buttons (level-btn active treatment:
  accent border + `--accent-light` fill), each ≥ 44px tall; a summary line
  below re-renders per selection: "{rounds} rounds · shared target {target}".
- Style picker (Decision 6): a second segmented row below the mode picker —
  "⚪⚫ White & Black" / "🐐🐺 Goat & Wolf" / "🐬🦈 Dolphin & Shark" —
  selecting the token skin. Like the mode, it is only interactive during
  setup.
- Start = `.action-btn.primary`, full column width.
- Validation on Start: trim both names; blank → `Player 1` / `Player 2`
  defaults; identical after trim + case-fold → inline error `sameNames` under
  the inputs (12px, `--miss` color, `role="alert"`-free — announced via the
  polite announcer), match does not start.
- Starting resets scores, history, round, choices.

### 4.3 Turn (private choice)

```text
                       ROUND 3 OF 6
                 Ala, choose in private

   ┌──────────────────┐        ┌──────────────────┐
   │        ◯          │        │        ●         │
   │      White        │        │      Black       │
   │    Cooperate      │        │     Compete      │
   │  Strongest group  │        │  Best personal   │
   │  score when both  │        │  score only if   │
   │  players choose it│        │  the other picks │
   │                   │        │  White.          │
   │     Selected ✓    │        │                  │
   └──────────────────┘        └──────────────────┘

                    [    End turn    ]
```

- Round indicator: mono 14px uppercase, `--text-dim` (bumped from the 11px
  caption scale by owner request — it must be legible at pass-and-play
  distance). Heading: Outfit 20/700 `--text-head`. The phase area carries
  extra bottom padding (120px) so content sits slightly above vertical
  center.
- Choice cards are `<button type="button" class="choice-card">`: radius 8px,
  border 1.5px `--panel-border`, min-height 180px desktop, flex column,
  centered. White card: `--token-white` background, `--text-head` text. Black
  card: `--token-black` background, `#f5f3ee` text, note text at 70% opacity.
  Token disc: 48px CSS circle (white disc gets a 1.5px `--text-head` border so
  it reads on the white card).
- Selected state (post-review, Decision 4): accent border + 4px ring +
  drop shadow + `scale(1.02)`, a 30px ✓ corner badge appears (inverted colors
  on the black card), and the unselected card dims to 45% opacity — never
  color-only (the badge is a shape cue). `aria-pressed` mirrors selection;
  `aria-label` = `chooseWhite` / `chooseBlack` strings.
- No End-turn button (Decision 9): tapping a card selects it and commits the
  turn automatically after a 700 ms debounce (`CHOICE_COMMIT_MS`) — long
  enough to see the selection. Tapping the other card within the window
  switches the selection and resets the timer (radio-like exclusivity via
  `classList.toggle`).

### 4.4 Handoff (full-stage; target board hidden)

```text
                    Pass to Ola                    |            Reveal in
                                                   |
                         4                         |                2
                                                   |
          The previous choice is hidden.           |      Both choices are locked.
                                                   |
        (at zero)  [ Ola, tap to start ]           |     (at zero: auto-reveal)
```

- Title Outfit 22/700; numeral JetBrains Mono 64px `--text-head` (sanctioned
  hero-size deviation, recorded in style-drift); note 13px `--text-dim`.
- The numeral container carries `role="timer"` with `aria-live="off"` (no
  per-second screen-reader spam); the polite announcer speaks the phase intent
  once at start ("Pass the device to Ola") and once at zero ("Ola, tap to
  start") — this satisfies req §6.4's "role=timer or equivalent accessible live
  text".
- Pass handoff: the Ready button is hidden until the countdown hits zero; it
  is then unhidden, auto-focused, and is the only actionable element. ≥ 44px
  target, `.action-btn.primary`.
- Reveal handoff (Decision 4): no button — when the countdown reaches zero the
  round resolves automatically and the result phase appears.
- `handoffKind: "pass"` → title `passTo`, note `passNote`, button `readyBtn`.
  `handoffKind: "reveal"` → title `revealIn`, note `revealNote`, auto-reveal
  at zero.

### 4.5 Round result (in-stage)

```text
                      ROUND 3 RESULT

   ┌── Ala ──────────────┐   ┌── Ola ──────────────┐
   │  ● Black    +5 pts  │   │  ◯ White    +0 pts  │
   │  Total: 14          │   │  Total: 9           │
   └─────────────────────┘   └─────────────────────┘

          Group added +5   →   23 / 34

   Ala chose Black while Ola chose White. Ala gained 5,
   but the group added only 5 instead of 6.

                    [   Next round   ]
```

- Two flat player result items (no heavy nesting per req §8.2), roomy for
  kids (18/20px padding, 12px gap): dot + name, token + choice word, then a
  hairline-separated stat row in the classic KPI pattern — two stat blocks
  ("This round" → `+5`, "Total" → running total), 11px uppercase mono labels
  over 24px mono-bold values, the total colored in the player's identity
  color to echo the scoreboard.
- Group line: points colored by kind — coop `--shared`, split `--far` amber,
  defect `--miss` red; the target-board meter animates to the new value.
- Explanation: one of three templates (req §6.5); the split template is
  parameterized with `{blackName}` / `{whiteName}`.
- The matching payoff-matrix cell in the panel is highlighted
  (`--accent-light` background) during this phase only.
- A red warning line under the explanation (Decision 11): at spare 0 the
  skin-aware `warnNoSpare` ("one more {Black/Wolf/Shark} and nobody can
  win"); when the target is unreachable, `warnUnreachable` — and the action
  button becomes Final result, routing `onNext()` straight to the final
  phase (sudden death). Both warnings are appended to the reveal
  announcement.
- Action: `Next round`, or `Final result` after the last round
  (`.action-btn.primary`, auto-focused).
- Reveal pop: 0.3s ease pop-in on the two result items (skipped under reduced
  motion).

### 4.6 Final overlay + reflection

Overlay (house `.result-overlay` pattern, built with `createElement`, appended
to body, `role="dialog"`, `tabindex="-1"`, focused on open, dismiss via click /
Escape / Enter / Space, focus returned to the reflection's primary button):

| Outcome | Tier wash | Emoji | Title | Sub |
| --- | --- | --- | --- | --- |
| Target missed | miss `rgba(211,47,47,0.92)` | ❌ | `finalMissTitle` | group total vs target |
| One player ahead | success `rgba(0,200,83,0.92)` | 🎉 | `finalWinTitle` ({name} wins) | both scores |
| Tied, target reached | success `rgba(0,200,83,0.92)` | 🎯 | `finalTieTitle` (Shared win) | both scores |

Reflection screen (in stage after dismissal):

```text
                     Ala wins
   The shared target was reached. The higher personal
   score decides the winner.

   Group total  34 / 34  — target reached
   Ala 20   ·   Ola 14

   HOW IT COULD HAVE GONE
   ┌────────────────────────────┬───────┬──────────┐
   │ Actual match               │  34   │ reached  │
   │ All White                  │  36   │ reached  │
   │ One player always Black    │  30   │ missed   │
   │ All Black                  │  12   │ missed   │
   └────────────────────────────┴───────┴──────────┘

   This was a Prisoner's Dilemma — a famous game theory
   puzzle. In repeated games, the strong strategies start
   friendly, answer betrayal, forgive quickly, and don't
   envy the other player's score.

        [  Play again  ]      [  New match  ]
```

- Counterfactual totals come from `counterfactuals(mode)` — never hard-coded in
  the UI layer, so Sprint (24/20/8) and Long (48/40/16) are automatically
  correct.
- reached/missed cells are textual + colored (`--perfect` / `--miss`).
- The debrief paragraph is the only place the formal terms appear (req §9 tone
  rules).

## 5. Panel Design

Order (req §7.3), all `.panel-section`:

1. **Payoff matrix** (`secPayoff`) — a real `<table>` (semantically tabular):
   3×3, header row/column = 10px token dot + White/Black word, cells mono 12px
   `p1 / p2` (`3 / 3`, `0 / 5`, `5 / 0`, `1 / 1`), 4–6px cell padding, hairline
   borders. Caption line (11px, `--text-label`): "Each cell: Player 1 / Player
   2". Result-phase cell highlight per §4.5. Visible in every phase, compact
   (req: present but not dominating).
2. **Round history** (`secHistory`, `grow`) — one row per **completed** round:
   round number (mono), two 14px token dots in P1/P2 order, `+N` group points
   colored by kind (teal/amber/red). Empty state: `—`. Never renders the
   in-progress round (it can't: it renders `state.history`, appended only at
   reveal).

The req §7.3 items "scores and shared target progress", "mode selector or
mode summary", "strategy note", and "new match action" are intentionally
absent from the panel (Decisions 4, 5, and 10): scores/progress live entirely
on the redesigned target board (the panel section became a pure duplicate),
mode is fixed at setup, the strategy tip moved into the final debrief, and
mid-match reset falls back to a browser refresh (nothing persists).

## 6. Visual System

Core light palette verbatim from `CLAUDE.md` (`--bg` `#fafaf7` …
`--miss` `#d32f2f`), body gradient included. `--accent` stays `#455a64` —
identity comes from entity colors, appended after core tokens:

```css
--token-white: #ffffff;
--token-black: #16181d;
--shared: #00897b;      /* teal — coop group points */
--p1: #1976d2;          /* Player 1 identity: score, dot, bar segment */
--p2: #8e24aa;          /* Player 2 identity: score, dot, bar segment */
```

Amber caution reuses `--far` (#f9a825); missed target reuses `--miss`. No new
fonts, no icon fonts; tokens are CSS circles (or, in the emoji skins, 🐐/🐺
and 🐬/🦈 rendered as text via `.tok-emoji` at 12/14/20/44px matching the
disc sizes), result emoji from the sanctioned set (🎉 🎯 ❌). Radii: 8px cards/overlum surfaces, 6px controls, 50% token
discs. Focus: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`
on every button and both inputs (inputs also get the accent-border `:focus`
treatment).

## 7. Privacy Engineering

The privacy rule (req §6.3) is enforced structurally, then double-checked:

1. `state.choices` lives only in JS. It is never written to a DOM attribute,
   class, or dataset — the only DOM trace of a current-round choice is the
   selected card during the chooser's own turn.
2. `commitTurn()` (fired by the 700 ms post-tap debounce) executes
   synchronously in one task: record choice → clear both cards'
   `.active`/`aria-pressed`/check badge → hide `#phaseTurn` → show
   `#phaseHandoff` → move focus to the handoff container. No repaint can
   occur between those steps, so the selection is never visible once the turn
   ends.
3. Scores, target meter, and history render exclusively from completed-round
   data (`state.history`, `state.scores` updated at reveal). During P2's turn
   everything on screen is identical regardless of P1's hidden choice.
4. The announcer may say "White selected" only during the chooser's own turn;
   handoff/reveal announcements never mention a choice. `aria-live` content is
   cleared when the handoff phase starts.
5. The Ready-tap hold (Decision 2) guarantees the next private screen cannot
   appear while the device is mid-pass.
6. The payoff-matrix highlight and result explanations render only in the
   result phase.
7. Refresh wipes everything (no persistence) — acceptable per req §13.

## 8. Countdown Behavior

- Duration constant `HANDOFF_SECONDS = 3` (Decision 4; overrides req §6.4).
- Implementation: `performance.now()`-anchored deadline, `setInterval` at
  200ms computing `secondsLeft = Math.ceil(remaining / 1000)`; DOM updates only
  when the displayed second changes.
- `visibilitychange` → hidden: stop the interval, store remaining ms; visible:
  re-anchor and resume from the stored remainder (req §6.4: "pause …; do not
  jump unexpectedly"). Full seconds only, so no visible jitter.
- At zero: interval cleared, numeral shows `0`. Pass handoff: the Ready button
  appears and receives focus, the announcer speaks the hold message, and
  nothing advances without the tap (Decision 2). Reveal handoff: the round
  resolves immediately and the result phase renders (Decision 4).
- Language toggle mid-countdown re-renders strings but does not touch the
  deadline.
- Reduced motion: the countdown is plain text updates — unaffected, remains
  functional.

## 9. i18n

One inline `I18N = { en: {…}, pl: {…} }`; `T(key, vars)` with `{name}`-style
substitution via split/join (exact `codebreak`/`roman` helper — no innerHTML).
Initial language `(navigator.language || "").startsWith("pl") ? "pl" : "en"`;
not persisted. `applyTranslations()` rewrites `document.title`,
`document.documentElement.lang`, all labeled textContent, `aria-label`s,
`title`s, and input placeholders, then re-runs the render pipeline.

Polish plural note: round counts are 4/6/8, so a tiny helper
`roundsWord(n)` → `"rundy"` (n = 4) / `"rund"` (n = 6, 8) feeds `modeSummary`
and `roundOf`. Split-outcome verb uses the kid-safe combined form "wybrał(a)".

Full string inventory (EN authoritative; PL draft to be reviewed at
implementation):

| Key | English | Polish |
| --- | --- | --- |
| `docTitle` | Trust Dilemma | Dylemat Zaufania |
| `title` | Trust Dilemma | Dylemat Zaufania |
| `subtitle` | A two-player game theory challenge | Dwuosobowe wyzwanie z teorii gier |
| `langSwitch` | Switch language | Przełącz język |
| `overlayHint` | Tap anywhere to continue | Dotknij, aby kontynuować |
| `setupTitle` | White helps the shared score. Black can win one round. | Białe pomaga wspólnemu wynikowi. Czarne może wygrać jedną rundę. |
| `setupCopy` | Miss the shared target and nobody wins. Reach it and the higher score wins. | Jeśli nie osiągniecie wspólnego celu, nikt nie wygrywa. Jeśli osiągniecie — wygrywa wyższy wynik. |
| `playerOneName` | Player 1 name | Imię gracza 1 |
| `playerTwoName` | Player 2 name | Imię gracza 2 |
| `playerOneDefault` | Player 1 | Gracz 1 |
| `playerTwoDefault` | Player 2 | Gracz 2 |
| `sameNames` | Use two different names. | Użyjcie dwóch różnych imion. |
| `start` | Start match | Rozpocznij mecz |
| `modeLabel` | Mode | Tryb |
| `modeClassic` | Classic | Klasyczny |
| `modeSprint` | Sprint | Sprint |
| `modeLong` | Long Game | Długa gra |
| `modeSummary` | {rounds} rounds · shared target {target} | {rounds} {roundsWord} · wspólny cel {target} |
| `roundOf` | Round {round} of {rounds} | Runda {round} z {rounds} |
| `turnTitle` | {name}, choose in private | {name}, wybierz w tajemnicy |
| `white` | White | Białe |
| `black` | Black | Czarne |
| `cooperate` | Cooperate | Współpraca |
| `defect` | Compete | Rywalizacja |
| `whiteNote` | +3 each if you both pick it. | Daje wam po 3 punkty, jeśli oboje wybierzecie Białe. |
| `blackNote` | +5 for you only if they pick White. | Daje ci 5 punktów tylko wtedy, gdy druga osoba wybierze Białe. |
| `selected` | Selected | Wybrane |
| `chooseWhite` | Choose White — cooperate | Wybierz Białe — współpraca |
| `chooseBlack` | Choose Black — compete | Wybierz Czarne — rywalizacja |
| `passTo` | Pass to {name} | Przekaż do: {name} |
| `passNote` | The previous choice is hidden. | Poprzedni wybór jest ukryty. |
| `revealIn` | Reveal in | Odkrycie za |
| `revealNote` | Both choices are locked. | Oba wybory są zablokowane. |
| `readyBtn` | {name}, tap to start | {name}, dotknij, aby zacząć |
| `timerLabel` | Countdown | Odliczanie |
| `announcePass` | Pass the device to {name}. | Przekażcie urządzenie: {name}. |
| `announceReady` | {name}, tap to start. | {name}, dotknij, aby zacząć. |
| `nowPlayer` | Now {name} | Teraz {name} |
| `roundResult` | Round {round} result | Wynik rundy {round} |
| `roundPointsLabel` | This round | Ta runda |
| `totalScore` | Total | Razem |
| `groupAdded` | Group added +{points} | Grupa dodała +{points} |
| `spareLabel` | Spare | Zapas |
| `warnNoSpare` | No spare points left — one more Black and nobody can win. | Nie ma już zapasu — jeszcze jedno Czarne i nikt nie wygra. |
| `warnNoSpareGw` | No spare points left — one more Wolf and nobody can win. | Nie ma już zapasu — jeszcze jeden Wilk i nikt nie wygra. |
| `warnNoSpareDs` | No spare points left — one more Shark and nobody can win. | Nie ma już zapasu — jeszcze jeden Rekin i nikt nie wygra. |
| `warnUnreachable` | The shared target is out of reach. | Wspólny cel jest już poza zasięgiem. |
| `earlyEndMsg` | The target could no longer be reached, so the match ended after round {round}. | Celu nie dało się już osiągnąć, więc mecz zakończył się po rundzie {round}. |
| `explainCoop` | Both chose White. Each gained 3, and the group added the full 6 toward the target. | Oboje wybrali Białe. Każdy gracz zdobywa 3 punkty, a grupa dodaje pełne 6 do celu. |
| `explainSplit` | {blackName} chose Black while {whiteName} chose White. {blackName} gained 5, but the group added only 5 instead of 6. | {blackName} wybrał(a) Czarne, a {whiteName} Białe. {blackName} zyskał(a) 5, ale grupa dodała tylko 5 zamiast 6. |
| `explainDefect` | Both chose Black. Nobody was exploited, but the group added only 2. | Oboje wybrali Czarne. Nikt nie dostał przewagi, ale grupa dodała tylko 2. |
| `nextRound` | Next round | Następna runda |
| `finalResult` | Final result | Wynik końcowy |
| `finalMissTitle` | The target was missed | Cel nieosiągnięty |
| `finalMissMsg` | The group total stayed below the shared target, so both players lose this match. | Suma grupy została poniżej wspólnego celu, więc oboje przegrywacie ten mecz. |
| `finalWinTitle` | {name} wins | Wygrywa {name} |
| `finalWinMsg` | The shared target was reached. The higher personal score decides the winner. | Wspólny cel osiągnięty. O zwycięstwie decyduje wyższy wynik osobisty. |
| `finalTieTitle` | Shared win | Wspólna wygrana |
| `finalTieMsg` | The target was reached and the scores are tied. | Cel osiągnięty, a wyniki są równe. |
| `groupTotal` | Group total | Suma grupy |
| `targetReached` | target reached | cel osiągnięty |
| `targetMissed` | target missed | cel nieosiągnięty |
| `reflectTitle` | How it could have gone | Jak mogło pójść |
| `rowActual` | Actual match | Wasz mecz |
| `rowAllWhite` | All White | Same Białe |
| `rowOneBlack` | One always Black, the other always White | Jedna osoba zawsze Czarne, druga zawsze Białe |
| `rowAllBlack` | All Black | Same Czarne |
| `debrief` | This was a Prisoner's Dilemma — a famous game theory puzzle. Start with White. If someone picks Black, protect yourself next time. Then try White again. | To był dylemat więźnia, czyli przykład z teorii gier. Dobra strategia często zaczyna od Białego, reaguje na Czarne, a potem daje drugiej osobie szansę wrócić do współpracy. |
| `styleLabel` | Style | Wygląd |
| `skinBW` | ⚪⚫ White & Black | ⚪⚫ Białe i Czarne |
| `skinGW` | 🐐🐺 Goat & Wolf | 🐐🐺 Koza i Wilk |
| `whiteGw` | Goat | Koza |
| `blackGw` | Wolf | Wilk |
| `chooseWhiteGw` | Choose Goat — cooperate | Wybierz Kozę — współpraca |
| `chooseBlackGw` | Choose Wolf — compete | Wybierz Wilka — rywalizacja |
| `setupTitleGw` | Goat helps the shared score. Wolf can win one round. | Koza pomaga wspólnemu wynikowi. Wilk może wygrać jedną rundę. |
| `whiteNoteGw` | +3 each if you both pick it. | Daje wam po 3 punkty, jeśli oboje wybierzecie Kozę. |
| `blackNoteGw` | +5 for you only if they pick Goat. | Daje ci 5 punktów tylko wtedy, gdy druga osoba wybierze Kozę. |
| `explainCoopGw` | Both chose Goat. Each gained 3, and the group added the full 6 toward the target. | Oboje wybrali Kozę. Każdy gracz zdobywa 3 punkty, a grupa dodaje pełne 6 do celu. |
| `explainSplitGw` | {blackName} chose Wolf while {whiteName} chose Goat. {blackName} gained 5, but the group added only 5 instead of 6. | {blackName} wybrał(a) Wilka, a {whiteName} Kozę. {blackName} zyskał(a) 5, ale grupa dodała tylko 5 zamiast 6. |
| `explainDefectGw` | Both chose Wolf. Nobody was exploited, but the group added only 2. | Oboje wybrali Wilka. Nikt nie dostał przewagi, ale grupa dodała tylko 2. |
| `rowAllWhiteGw` | All Goats | Same Kozy |
| `rowOneBlackGw` | One always Wolf, the other always Goat | Jedna osoba zawsze Wilk, druga zawsze Koza |
| `rowAllBlackGw` | All Wolves | Same Wilki |
| `debriefGw` | This was a Prisoner's Dilemma — a famous game theory puzzle. Start with Goat. If someone picks Wolf, protect yourself next time. Then try Goat again. | To był dylemat więźnia, czyli przykład z teorii gier. Dobra strategia często zaczyna od Kozy, reaguje na Wilka, a potem daje drugiej osobie szansę wrócić do współpracy. |
| `skinDS` | 🐬🦈 Dolphin & Shark | 🐬🦈 Delfin i Rekin |
| `whiteDs` | Dolphin | Delfin |
| `blackDs` | Shark | Rekin |
| `chooseWhiteDs` | Choose Dolphin — cooperate | Wybierz Delfina — współpraca |
| `chooseBlackDs` | Choose Shark — compete | Wybierz Rekina — rywalizacja |
| `setupTitleDs` | Dolphin helps the shared score. Shark can win one round. | Delfin pomaga wspólnemu wynikowi. Rekin może wygrać jedną rundę. |
| `whiteNoteDs` | +3 each if you both pick it. | Daje wam po 3 punkty, jeśli oboje wybierzecie Delfina. |
| `blackNoteDs` | +5 for you only if they pick Dolphin. | Daje ci 5 punktów tylko wtedy, gdy druga osoba wybierze Delfina. |
| `explainCoopDs` | Both chose Dolphin. Each gained 3, and the group added the full 6 toward the target. | Oboje wybrali Delfina. Każdy gracz zdobywa 3 punkty, a grupa dodaje pełne 6 do celu. |
| `explainSplitDs` | {blackName} chose Shark while {whiteName} chose Dolphin. {blackName} gained 5, but the group added only 5 instead of 6. | {blackName} wybrał(a) Rekina, a {whiteName} Delfina. {blackName} zyskał(a) 5, ale grupa dodała tylko 5 zamiast 6. |
| `explainDefectDs` | Both chose Shark. Nobody was exploited, but the group added only 2. | Oboje wybrali Rekina. Nikt nie dostał przewagi, ale grupa dodała tylko 2. |
| `rowAllWhiteDs` | All Dolphins | Same Delfiny |
| `rowOneBlackDs` | One always Shark, the other always Dolphin | Jedna osoba zawsze Rekin, druga zawsze Delfin |
| `rowAllBlackDs` | All Sharks | Same Rekiny |
| `debriefDs` | This was a Prisoner's Dilemma — a famous game theory puzzle. Start with Dolphin. If someone picks Shark, protect yourself next time. Then try Dolphin again. | To był dylemat więźnia, czyli przykład z teorii gier. Dobra strategia często zaczyna od Delfina, reaguje na Rekina, a potem daje drugiej osobie szansę wrócić do współpracy. |
| `playAgain` | Play again | Zagraj ponownie |
| `newMatch` | New match | Nowy mecz |
| `sharedTarget` | Shared target | Wspólny cel |
| `payoffLabel` | Payoff matrix | Tabela punktów |
| `payoffHint` | Rows: Player 1's choice. Columns: Player 2's choice. Each cell: Player 1 / Player 2 points. | Wiersze: wybór gracza 1. Kolumny: wybór gracza 2. W komórce: punkty gracza 1 / gracza 2. |
| `historyLabel` | Round history | Historia rund |

## 10. Accessibility

- Every control is `<button type="button">`; both name inputs have visible
  `<label for>` elements.
- One `.visually-hidden` `aria-live="polite"` announcer (clip pattern), spoken
  on: phase changes, setup validation error, countdown start/zero, round result
  summary, final outcome.
- Countdown: `role="timer"` container, no per-second announcements (§8).
- Choice cards: `aria-label` (`chooseWhite`/`chooseBlack`) + `aria-pressed`;
  selection also textual (`Selected`).
- Final overlay: `role="dialog"`, `aria-live="polite"`, `tabindex="-1"`,
  focused on open; dismiss via click, Escape, Enter, Space; focus lands on the
  reflection's Play again button after dismissal.
- Focus management per phase transition: turn → first choice card (after
  Ready tap), handoff-zero → Ready button, result → Next-round button,
  reflection → Play again. Tab order matches visual order; nothing focusable is
  hidden without `hidden`.
- Never color-only: outcome kinds carry words (reached/missed, Selected,
  choice names) alongside teal/amber/red.
- Touch targets ≥ 44px on cards, End turn, Ready/Reveal, Start, mode buttons,
  final actions; `touch-action: manipulation` on all tappables;
  `-webkit-tap-highlight-color: transparent` on body.
- Keyboard-only play is a first-class path (verified in M15).

## 11. Motion And Reduced Motion

House duration scale: 0.15s control hovers/selection, 0.12s ease-out meter
fills, 0.3s result-item pop and overlay fade, 0.4s overlay emoji pop. No
infinite pulses anywhere. Both layers per `CLAUDE.md`:

- CSS `@media (prefers-reduced-motion: reduce)` disabling the overlay pair,
  result pop, and all hover/selection transitions (full selector list, not just
  the overlay).
- JS `matchMedia` gate with `change` listener → `state.reduceMotion`; gates the
  result pop-in class and the meter transition (value still updates
  instantly).

## 12. Mobile (single breakpoint, `max-width: 720px`)

- `.main { height: auto; flex-direction: column; }` — page scrolls;
  `.stage-wrap` loses `border-right`, gains `border-bottom`; `.panel { width: 100%; }`.
- Stage height is content-driven (`height: auto`, `min-height: 360px`) — this
  is a DOM stage, not a canvas, so no `56vh` lock.
- Choice cards stack vertically, full width, `min-height: 120px`.
- Target board compresses to two lines (names+scores row, meter row).
- Countdown numeral stays 64px (readable at arm's length, req §8.2).
- Payoff matrix stays a table; at 320px viewport it fits (12px mono, tight
  padding) — verified in M18.
- No horizontal overflow at 320–720px widths (M18 gate).

## 13. Edge Cases

| Case | Behavior |
| --- | --- |
| Double-activation of End turn / Ready / Start / Next | Handlers guard on current phase and disable the button on first fire; transitions are idempotent. |
| Tab hidden during countdown | Pause; resume from remaining time on return (§8). |
| Language toggle mid-phase | Strings and aria re-render; state, countdown deadline, and focus untouched. |
| Names: blank / whitespace | Trim → default names. |
| Names: identical (case-insensitive after trim) | Inline `sameNames` error, match doesn't start. |
| Names: 14-char max via `maxlength` | Layout verified with widest strings (M12). |
| Browser refresh mid-match | Full reset to setup — no persistence, per req §13. |
| New match tapped mid-countdown | Countdown interval cleared before phase switch (single `clearCountdown()` in `setPhase`). |
| Resize / rotation mid-phase | Pure CSS reflow; no JS layout math to invalidate. |
| `?debug=1` | Optional: exposes a state dump helper for the manual privacy audit; the code path is absent from the DOM otherwise, per family convention. |

## 14. Implementation Order

1. Static skeleton: head, palette, chassis, header, panel sections, empty
   phases; `npm run code-review -- dilemma/index.html` early to catch policy
   issues.
2. Rules block (`// [rules:start]…`) + `tools/dilemma-rules-check.mjs` — the
   math gate exists before any UI consumes it.
3. Setup phase + validation.
4. Turn phase + choice cards + privacy-critical `endTurn()`.
5. Handoff phase + countdown + visibility pause + Ready hold.
6. Result phase + history/scores/meter updates + matrix highlight.
7. Final overlay + reflection + counterfactual table + Play again / New match.
8. i18n completion + `applyTranslations()` sweep.
9. Accessibility pass (focus map, announcer, keyboard path).
10. Mobile + reduced-motion pass.
11. Full verification plan (§15), then add the app to `index.md` and write
    `style-drift.md` (§16).

## 15. Verification Plan

### 15.1 Automated gates

1. **`npm run code-review -- dilemma/index.html`** — single-file policy +
   review findings resolved.
2. **`node tools/dilemma-rules-check.mjs`** (new; mirrors
   `tools/codebreak-puzzle-check.mjs` and, like it, is invoked directly with
   `node` from `learn/` — not via a package.json script): extracts the
   `[rules:start]`/`[rules:end]` block via
   `vm.runInNewContext` and asserts:
   - Payoff inequalities: `T > R > P > S` and `2R > T + S`.
   - `resolveRound` matches the req §4.2 matrix for all four combinations, and
     `roundKind` classifies them correctly.
   - For every mode: `target === rounds * 2R - 2` (constant slack),
     `target > rounds * (T + S)`, `target <= rounds * 2R` (req §4.3).
   - Spare/sudden-death literals: initial spare 2 in every mode; Classic spare
     1 after one betrayal round, 0 after two (still winnable), unreachable
     after a third or after any mutual-betrayal round.
   - `counterfactuals` returns `rounds*2R / rounds*(T+S) / rounds*2P` per mode
     (Classic 36/30/12, Sprint 24/20/8, Long 48/40/16).
   - Scripted matches replayed through `resolveRound` + `judgeMatch`:
     req §14 cases, a symmetric-defection tie (17/17, total exactly 34 —
     shared win at the boundary), and a lone defector claiming the whole
     spare budget (two Blacks then White → 22/12, total exactly 34, P1
     wins).
   - Exhaustive sweep: all `4^rounds` choice sequences per mode (4096 for
     Classic — cheap); asserts score totals equal summed round points, judge
     verdicts are consistent with totals, "always Black vs always White"
     never reaches the target, and — per round of every sequence — that
     `isUnreachable` agrees with a brute-force sudden-death computation.

### 15.2 Manual test matrix

Run against `bundle exec jekyll serve` (desktop Chrome + one mobile viewport).

| # | Case | Expected |
| --- | --- | --- |
| M1 | Classic, all White | 18/18, total 36 ≥ 34, 🎯 green Shared win overlay, reflection rows 36/36/30/12 |
| M2 | Classic, P1 always Black vs White | Sudden death after round 3 (total 15, target unreachable): 15/0, early miss overlay + early-end note |
| M3 | Classic, all Black | First Black/Black round is fatal: match ends after round 1 at 1/1, both lose |
| M4 | Classic, P1 Black once (R1), rest White | 20/15, total 35 ≥ 34, 🎉 P1 wins |
| M5 | Symmetric defections (P1 Black R1, P2 Black R2, rest White) | 17/17, total exactly 34 → Shared win at the boundary |
| M6 | Lone defector claims the budget: P1 Black R1–R2, rest White | 22/12, total exactly 34 → reached, P1 wins |
| M7 | Sprint preset | 4 rounds, target 22, spare starts at 2 (neutral); reflection 24/20/8 |
| M8 | Long preset | 8 rounds, target 46, spare starts at 2; reflection 48/40/16 |
| M9 | Privacy audit | After P1 End turn: no token, text, class, or attribute anywhere reveals the choice (inspect DOM); history/scores/meter unchanged during P2's turn; identical screens regardless of P1's pick |
| M10 | Countdown discipline | Pass: Ready button absent until 0; at 0 the numeral hides, the title becomes "Now {name}", the button appears with focus, and nothing auto-advances. Reveal: auto-resolves at 0 with no button. Tab-switch mid-count pauses and resumes without jumping |
| M11 | Double-activation | Rapid taps across both cards reset the debounce — last tap wins and exactly one transition fires; double-click on Ready / Start / Next causes exactly one transition |
| M12 | Name validation | Blank/whitespace → defaults; "ala" vs "ALA" → inline error, no start; 14-char names don't break layout |
| M13 | Reset semantics | Play again keeps names+mode, zeroes everything else; New match → setup prefilled; refresh → clean setup |
| M14 | Language toggle in every phase (incl. mid-countdown, on overlay) | All strings, placeholders, aria-labels, `document.title`, `<html lang>` swap; no state loss |
| M15 | Keyboard-only full match | Tab order follows visual flow; cards toggle with Enter/Space; overlay dismisses with Escape/Enter/Space; focus lands per §10 map |
| M16 | Screen-reader spot check (VoiceOver) | Announcer speaks phase changes and results; countdown does not announce every second; no choice leaked in announcements after End turn |
| M17 | Reduced motion (OS setting) | No pops/washes/transitions; countdown and meters still update |
| M18 | Mobile 375×667, 390×844, 320px width, 720px boundary | Cards stack, no horizontal scroll, all targets ≥ 44px, matrix usable, countdown readable |
| M19 | Matrix highlight | Correct cell per outcome (incl. both split orientations); cleared when the next round starts |
| M20 | Overlay tiers | ❌/red miss, 🎉/green win, 🎯/green shared win; sub shows scores/total correctly |
| M21 | Desktop short window (e.g. 900×620) | No page scroll; every phase fits; panel scrolls internally if needed |
| M22 | Emoji skins (Goat & Wolf, Dolphin & Shark) | Style picker swaps setup title, card tokens/names (🐐/🐺, 🐬/🦈), matrix headers, result words, history dots, reflection labels, and debrief in both languages (Polish declension correct per skin); scores/verdicts identical to the default skin; picker inert outside setup |
| M23 | Spare meter | Chip starts at the mode's slack (Classic "Spare 2", neutral), drops to 1 → amber, 0 → red plus the skin-aware result warning; PL shows "Zapas" |
| M24 | Sudden death | A round that makes the target unreachable shows "out of reach" on the result, the button reads Final result, the red miss overlay fires, and the reflection shows the early-end note with the round number |

### 15.3 Style and convention audit

Checklist against `CLAUDE.md` before sign-off: reset-first CSS + `:root`
palette order; Outfit 400/600/700 + JetBrains Mono only; light-chassis header
recipe; `hidden`-attribute visibility with scoped guards; no `innerHTML`; IIFE
+ `"use strict"` + banner comments; no styled scrollbars; `:focus-visible`
recipes intact; no checkboxes/radios/selects beyond the sanctioned set (this
app: two text inputs, buttons only); head conventions (canonical, og/twitter
set, author, review-gate comment, no favicon/theme-color); em-dash empty
readouts.

### 15.4 Sign-off checklist

- [ ] 15.1 gates green (code-review + rules-check).
- [ ] M1–M21 executed and passing.
- [ ] 15.3 audit clean.
- [ ] `index.md` hub entry added (only now — app exists).
- [ ] `docs/style-drift.md` written or confirmed unnecessary (§16).
- [ ] Every req §13 acceptance criterion cross-checked line by line.

## 16. Anticipated style-drift entries

To be recorded in `style-drift.md` at ship time if they hold (mirroring how
`codebreak/docs/style-drift.md` documents its sanctioned deviations):

- DOM-based stage (`.stage-wrap`), no canvas.
- Hero type sizes outside the shared scale: 64px countdown numeral, 48px token
  discs, 20/700 stage headings.
- Text inputs on the setup screen (family baseline defines only selects and
  ranges as native controls; recipe borrowed from `roman/index.html`).
- Zero localStorage (family apps persist progress; this app intentionally
  persists nothing).
