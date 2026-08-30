# Trust Dilemma: Requirements And Design Specification

> **SUPERSEDED (2026-07-15).** The shipped game is no longer the fixed-length
> threshold Prisoner's Dilemma described below — it was rebuilt as **"The
> Crossing"**, a shadow-of-the-future voyage (shared survival Store, uncertain
> end, changing weather). The authoritative current design is
> `spec-crossing-2026-07-15.md`, verified by the Monte-Carlo gate in
> `tools/dilemma-rules-check.mjs`. This document is retained for the research
> basis (§1), audience/goals (§3), and interface/accessibility conventions
> (§7, §11) that still apply; the specific rules, payoffs, targets, modes, and
> flow (§4–§6, §10, §13–§14) are historical. A full rewrite is deferred until
> the new design settles.

Design-only handoff. Do not infer that `dilemma/index.html` should already
exist from this document. When implementation is requested, build a new
single-file app at `dilemma/index.html` and then add it to `index.md`.

Reference implementation target: `dilemma/index.html`

Reference style baseline: `CLAUDE.md` light chassis, with visual density and
interaction simplicity similar to `roman/index.html` and `codebreak/index.html`.

## 0. Handoff Goal

Design a complete two-player pass-and-play educational game about the
iterated Prisoner's Dilemma.

The game should be simple enough for children to play on one shared device, but
rigorous enough that the payoff structure is a real Prisoner's Dilemma:

- each player privately chooses `White` or `Black`,
- `White` means cooperate,
- `Black` means defect,
- both `White` gives both players a good reward,
- one `Black` against one `White` gives the black player the best personal
  payoff and the white player the worst payoff,
- both `Black` gives both players a poor payoff,
- a shared target must be reached or both players lose,
- if the shared target is reached, the higher individual score wins.

The shared target is the design move that turns the activity from a raw
"always defect" demonstration into a kid-friendly repeated-game lesson about
balancing cooperation and competition.

## 1. Research Basis

### 1.1 Sources Used

- Prisoner's Dilemma general form:
  https://en.wikipedia.org/wiki/Prisoner%27s_dilemma
  - Use the standard payoff relationship `T > R > P > S`.
  - For the iterated game, also preserve `2R > T + S` so alternating
    exploitation does not outperform mutual cooperation.
  - The source also explains why defection is individually dominant in the
    one-shot game and why repeated interaction changes the strategic setting.

- Canonical payoff values:
  https://arxiv.org/abs/nlin/0211024
  - Fort's abstract refers to the canonical payoff set `R = 3`, `S = 0`,
    `T = 5`, `P = 1`.
  - Use those values for the default mode because they are compact,
    child-readable, and preserve the Prisoner's Dilemma inequalities.

- Iterated Prisoner's Dilemma research and strategy context:
  https://arxiv.org/abs/1604.00896
  - The Axelrod library paper frames the Iterated Prisoner's Dilemma as a
    standard research setting for repeated strategies and tournaments.

- Evolution of Cooperation / Tit for Tat:
  https://en.wikipedia.org/wiki/The_Evolution_of_Cooperation
  - Axelrod's tournament history is useful for the final debrief: strategies
    that are initially cooperative, responsive, forgiving, and not obsessed
    with beating the other player tend to perform well in repeated settings.

- Reflection in educational games:
  https://arxiv.org/abs/2006.10793
  - The design should not only show final scores. It should include compact
    reflection moments after each reveal and at the final screen, because
    educational games benefit when learners reflect on the process, not only
    the outcome.

- Accessible target sizing:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
  - Choice cards, turn buttons, language toggle, and mode controls should use
    touch-friendly targets around 40-44px or larger.

- Inspiration reference:
  https://ncase.me/trust/
  - Nicky Case's `The Evolution of Trust` is a useful benchmark for approachable
    explanations of repeated trust games. Do not copy its structure or visuals;
    use it only as a quality bar for clarity and teaching tone.

### 1.2 Design Implications

- The game must visibly separate personal score from shared target progress.
- The payoff matrix must remain available, but it should not dominate the first
  screen.
- The private-choice interaction is essential. Player 2 must not see Player 1's
  current-round choice before selecting.
- The reveal screen must explain both the personal payoff and the group-total
  consequence.
- The final screen must compare the actual match against simple counterfactuals
  such as "all White", "all Black", and "one player always Black".
- The game should use short rounds and immediate feedback instead of long
  explanatory prose.

## 2. Product Concept

Working title: `Trust Dilemma`

Short description:

> A two-player pass-and-play game where kids discover why cooperation can be
> strong over time, why betrayal is tempting in one round, and why too much
> betrayal can make everyone lose.

Theme:

- light theme,
- bright paper/game-board feel,
- simple black/white tokens,
- no prison/crime narrative,
- no dark moral framing,
- kid-safe language: `White` / `Black`, `cooperate` / `compete`, `shared
  target`, `personal score`.

The app should not use a jail illustration or police framing. The original
story is useful for adults, but for children the abstract token framing is
cleaner and avoids unnecessary emotional weight.

## 3. Audience And Learning Goals

Primary audience: children roughly `8-13`, plus parents or teachers facilitating
a short activity.

Assumptions:

- two players share one device,
- they can read short instructions,
- they do not know formal game theory,
- they can compare small integer scores,
- they benefit from seeing repeated outcomes build over time.

Learning goals:

- understand a two-choice payoff matrix,
- distinguish personal payoff from group outcome,
- see why `Black` is tempting when the other player chooses `White`,
- see why both players choosing `Black` is worse than both choosing `White`,
- experience how repeated choices create reputation and retaliation,
- understand that "winning" can require keeping the shared system alive first,
- name the core idea: this is a Prisoner's Dilemma / game theory example.

After playing, a child should be able to say:

- `White/White is best for the group.`
- `Black can win one round against White.`
- `Black/Black protects nobody and scores badly.`
- `If we miss the shared target, neither player wins.`
- `In repeated games, my last choice can change what the other player does next.`

## 4. Core Game Rules

### 4.1 Actions

Each round has exactly two private choices:

| Token | Formal action | Kid-facing meaning |
| --- | --- | --- |
| `White` | Cooperate | Build the shared target |
| `Black` | Defect | Try for a higher personal score |

### 4.2 Default Payoff Matrix

Use the canonical payoff values:

| Player 1 / Player 2 | White | Black |
| --- | ---: | ---: |
| White | `3, 3` | `0, 5` |
| Black | `5, 0` | `1, 1` |

Mapping to the user's variables:

- `A = 3` for both playing White,
- `B = 5` for Black against White,
- `C = 0` for White against Black,
- `D = 1` for both playing Black.

Formal labels:

- `R = 3` reward for mutual cooperation,
- `T = 5` temptation to defect,
- `S = 0` sucker's payoff,
- `P = 1` punishment for mutual defection.

The inequalities hold:

- `T > R > P > S` means `5 > 3 > 1 > 0`,
- `2R > T + S` means `6 > 5`.

The second inequality matters because mutual cooperation should produce the
best group total across repeated play.

### 4.3 Shared Target

The match has a shared target. If the sum of both players' scores is below the
target after the final round, both players lose.

If the shared target is reached:

- higher individual score wins,
- if scores are tied, show a shared win.

The target must be high enough that one player cannot simply choose Black every
round against a cooperative player and still satisfy the group objective.

Default target formula:

```text
maxCoopTotal = rounds * (R + R)
alwaysExploitTotal = rounds * (T + S)
target = maxCoopTotal - 2
target must be > alwaysExploitTotal and <= maxCoopTotal
```

Default mode:

```text
rounds = 6
maxCoopTotal = 36
alwaysExploitTotal = 30
target = 34
```

Interpretation:

- all `White/White` succeeds: total `36`,
- the spare budget is `2`: at most two Black-against-White rounds can happen
  in the whole match without making the target unreachable,
- a single `Black/Black` round costs 4 group points and makes the target
  unreachable immediately,
- a lone defector claiming the whole spare budget still wins (two Blacks,
  rest White: `22 / 12`, total exactly `34`) — the dilemma survives as a
  scarcity fight.

The `- 2` is a **constant slack**, not a ratio: every match can waste exactly
two group points — one betrayal plus one payback — and no more. Mode length
therefore controls recovery *time*, not budget. (The original design used
`ceil(maxCoopTotal * 0.88)`, which left an invisible slack of 4 in Classic; a
`0.94` interim formula fixed Classic but gave Sprint a degenerate slack of 1
where the first betrayer always won and the victim could never retaliate. The
constant `- 2` fixes both — Classic 34, Sprint 22, Long 46.)

Shared-pressure rules (owner decision, 2026-07-15; see `design.md` decisions
record):

- the interface shows the remaining spare budget at all times during play,
- the round result warns when the spare budget reaches zero,
- if the target becomes mathematically unreachable, the match ends
  immediately after that round's reveal and both players lose (sudden death).

## 5. Recommended Game Modes

The implementation should prioritize `Classic`. Additional modes are allowed
only if they remain simple presets, not separate rule systems.

### 5.1 Classic - Required

Purpose: the main classroom version.

Rules:

- `6` rounds,
- shared target `34`,
- payoffs `5/3/1/0`,
- known final round.

Why this mode:

- short enough for children,
- long enough for retaliation, forgiveness, and trust patterns to appear,
- target blocks the simplistic "always exploit" lesson.

### 5.2 Sprint - Optional

Purpose: a fast variant with less room for recovery.

Rules:

- `4` rounds,
- shared target `22`,
- same payoffs.

Teaching note:

- shows that early choices matter more when the future is short,
- useful for a quick replay.

### 5.3 Long Game - Optional

Purpose: a more forgiving repeated-game variant.

Rules:

- `8` rounds,
- shared target `46`,
- same payoffs.

Teaching note:

- gives players more room to repair after one Black choice,
- makes strategy patterns easier to observe.

### 5.4 Explicitly Out Of Scope For V1

Do not include these in the first implementation:

- configurable payoff sliders,
- online multiplayer,
- AI opponent,
- more than two players,
- random noise / mistaken choices,
- chat between players,
- hidden or random final round,
- accounts or persistent leaderboards.

These are good later extensions, but they would distract from the first
learning objective.

## 6. User Flow

### 6.1 Phase Diagram

```text
setup
  -> player_1_turn
  -> handoff_to_player_2_countdown
  -> player_2_turn
  -> reveal_countdown
  -> round_result
  -> next round or final_result
```

### 6.2 Setup Phase

Required content:

- app title,
- one-line premise,
- Player 1 name input,
- Player 2 name input,
- mode selector if optional modes are implemented,
- visible shared target for selected mode,
- Start button.

Validation:

- blank names may fall back to `Player 1` and `Player 2`,
- identical names should show inline feedback: `Use two different names.`,
- starting a match resets all scores and history.

The first screen must not be a marketing landing page. It is the playable setup
surface.

### 6.3 Player Turn Phase

For each active player:

- show current round number,
- show active player's name,
- show two large choice cards: `White` and `Black`,
- show a compact reminder of what each choice means,
- keep previous current-round choices hidden,
- tapping a token selects it and commits the turn automatically after a short
  debounce (owner decision; there is no separate End-turn button — see
  `design.md` decisions record).

Choice card requirements:

- `White` card should be visually white/light,
- `Black` card should be visually black/dark,
- selected card gets a clear active border,
- cards must be at least 44px touch targets; in practice they should be much
  larger because they are the main action.

Important privacy rule:

- once Player 1's choice commits, the screen must immediately hide Player 1's
  choice before the device is handed to Player 2,
- Player 2 must not see Player 1's current choice anywhere in the stage or
  side panel.

### 6.4 Handoff Countdown

After each `End turn`, show a full-stage handoff screen.

Player 1 to Player 2:

- title: `Pass to {Player 2}`,
- large countdown: `3`, `2`, `1`,
- note: `The previous choice is hidden.`

Player 2 to reveal:

- title: `Reveal in`,
- large countdown,
- note: `Both choices are locked.`

Countdown behavior:

- default duration `3` seconds (changed from `5` by owner decision after the
  first playtest; see `design.md` decisions record),
- no need for a skip button in v1,
- after the pass countdown reaches zero, the game holds until the next player
  taps a ready button; the reveal countdown resolves the round automatically
  at zero,
- if the tab loses visibility, pause or restart the countdown on return; do not
  jump unexpectedly,
- countdown should use a `role="timer"` or equivalent accessible live text.

### 6.5 Round Result Phase

After both choices are made, reveal:

- Player 1 choice,
- Player 2 choice,
- points gained by each player this round,
- updated individual scores,
- updated shared target progress,
- one concise strategic explanation.

Result explanations:

`White / White`

> Both chose White. Each gained 3, and the group added the full 6 toward the
> target.

`Black / White`

> {Black player} chose Black while {White player} chose White. {Black player}
> gained 5, but the group added only 5 instead of 6.

`Black / Black`

> Both chose Black. Nobody was exploited, but the group added only 2.

Actions:

- if more rounds remain: `Next round`,
- if the final round is complete: `Final result`.

### 6.6 Final Result Phase

Show one of three outcomes:

Target missed:

- title: `The target was missed`,
- message: `The group total stayed below the shared target, so both players
  lose this match.`,
- use the miss color.

Target reached, one player ahead:

- title: `{name} wins`,
- message: `The shared target was reached. The higher personal score decides
  the winner.`,
- show both final scores and group target margin.

Target reached, tied scores:

- title: `Shared win`,
- message: `The target was reached and the scores are tied.`,

Final reflection should include a compact comparison table:

| Scenario | Group total in Classic |
| --- | ---: |
| Actual match | computed |
| All White | `36` |
| One player always Black | `30` |
| All Black | `12` |

For other modes, compute the values from the round count.

Final actions:

- `Play again` keeps names and mode,
- `New match` returns to setup.

## 7. Interface Architecture

Use the light chassis from `CLAUDE.md`.

DOM shape when implemented:

```html
<header>...</header>
<main class="main">
  <section class="stage-wrap">...</section>
  <aside class="panel">...</aside>
</main>
<script>...</script>
```

Desktop:

- stage fills the left side,
- right panel width `320px`,
- no page-level scrolling; panel scrolls natively,
- stage contains the primary task surface.

Mobile:

- single breakpoint at `max-width: 720px`,
- stage stacks above panel,
- page may scroll,
- no horizontal overflow.

### 7.1 Header

Header should match the light apps:

- slim height,
- home link emoji or glyph on the left,
- title `Trust Dilemma`,
- subtitle `A two-player game theory challenge`,
- language toggle on the right.

Use bilingual English/Polish strings through one inline `I18N` object.

### 7.2 Stage

The stage is the primary play area. It should not be a decorative hero.

Stage responsibilities by phase:

- setup: name inputs and start,
- turn: private choice cards and end-turn action,
- handoff: countdown,
- result: reveal and next action,
- final: final outcome and reflection comparison.

The stage should include a consistent visual "shared target" board:

- Player 1 token / avatar,
- Player 2 token / avatar,
- central shared target meter,
- total score over target.

This visual should be CSS/DOM or inline SVG. Do not use an external image.

### 7.3 Panel

Panel order:

1. Scores and shared target progress.
2. Payoff matrix.
3. Mode selector or mode summary.
4. Round history.
5. Strategy note.
6. New match action after the game starts.

The payoff matrix must be visible before and during play, but it should be
compact.

Round history:

- one row per completed round,
- round number,
- two small black/white tokens,
- group points added that round.

During Player 2's turn, history can show previous completed rounds, but never
the current hidden Player 1 choice.

## 8. Visual Design

### 8.1 Tone

The app should feel like a clean paper strategy board, not a casino, prison, or
corporate dashboard.

Use:

- warm off-white background,
- white panels,
- neutral ink text,
- teal for shared progress,
- amber for caution / mixed outcome,
- red for missed target,
- black and white tokens as the main visual identity.

Avoid:

- dark theme,
- heavy gradients,
- one-note purple/blue palette,
- gambling chips,
- prison bars or handcuffs,
- oversized marketing hero blocks,
- decorative orbs or bokeh backgrounds.

### 8.2 Components

Choice cards:

- two side-by-side cards on desktop,
- stacked on mobile,
- card radius `8px` or less,
- `White` has light background and dark text,
- `Black` has black/dark background and white text,
- selected state uses a clear border and/or inner ring.

Countdown:

- large circular timer or large mono number,
- centered in stage,
- no animated complexity required,
- must be readable from a short distance.

Shared target meter:

- thin progress bar or vault-style meter,
- label `Shared target`,
- numeric text like `18 / 34`.

Result cards:

- two repeated player result items,
- each shows name, token, round points, total score,
- do not place cards inside heavy outer cards; keep the surface flat.

### 8.3 Motion

Use motion sparingly:

- selected card micro-transition: `0.15s`,
- progress fill: `0.12s`,
- result reveal pop: `0.3s`,
- overlay pop only for final outcome.

Respect `prefers-reduced-motion: reduce`.

## 9. Copy And Localization

All visible strings must be in one inline `I18N` object with `en` and `pl`.

Minimum English copy:

| Key | English |
| --- | --- |
| `title` | Trust Dilemma |
| `subtitle` | A two-player game theory challenge |
| `setupTitle` | White grows the group. Black can win the round. |
| `setupCopy` | Both players need the shared target. If the group misses it, nobody wins. If the target is reached, the higher score wins. |
| `playerOneName` | Player 1 name |
| `playerTwoName` | Player 2 name |
| `start` | Start match |
| `white` | White |
| `black` | Black |
| `cooperate` | Cooperate |
| `defect` | Compete |
| `whiteNote` | Strongest group score when both players choose it. |
| `blackNote` | Best personal score only if the other player chooses White. |
| `endTurn` | End turn |
| `passTo` | Pass to {name} |
| `revealIn` | Reveal in |
| `sharedTarget` | Shared target |
| `finalResult` | Final result |

Minimum Polish copy:

| Key | Polish |
| --- | --- |
| `title` | Dylemat Zaufania |
| `subtitle` | Dwuosobowe wyzwanie z teorii gier |
| `setupTitle` | Białe wzmacnia grupę. Czarne może wygrać rundę. |
| `setupCopy` | Oboje potrzebujecie wspólnego celu. Jeśli grupa go nie osiągnie, nikt nie wygrywa. Jeśli cel jest osiągnięty, wygrywa wyższy wynik. |
| `playerOneName` | Imię gracza 1 |
| `playerTwoName` | Imię gracza 2 |
| `start` | Rozpocznij mecz |
| `white` | Białe |
| `black` | Czarne |
| `cooperate` | Współpraca |
| `defect` | Rywalizacja |
| `whiteNote` | Najmocniejszy wynik grupy, gdy oboje wybiorą to samo. |
| `blackNote` | Najlepszy wynik osobisty tylko wtedy, gdy druga osoba wybierze Białe. |
| `endTurn` | Koniec tury |
| `passTo` | Przekaż do: {name} |
| `revealIn` | Odkrycie za |
| `sharedTarget` | Wspólny cel |
| `finalResult` | Wynik końcowy |

Tone rules:

- keep sentences short,
- avoid formal terms until the final reflection,
- use `cooperate` and `compete` in UI,
- mention `Prisoner's Dilemma` and `game theory` in final/debrief text, not on
  every turn.

## 10. State Model

Suggested state:

```js
state = {
  lang: "en",
  phase: "setup", // setup | turn | handoff | result | final
  mode: "classic",
  names: ["Player 1", "Player 2"],
  round: 1,
  activePlayer: 0,
  choices: [null, null], // "white" | "black" | null
  scores: [0, 0],
  history: [
    {
      round: 1,
      choices: ["white", "black"],
      points: [0, 5],
      groupPoints: 5,
      kind: "split"
    }
  ],
  countdown: 5
};
```

Suggested constants:

```js
PAYOFF = {
  whiteWhite: [3, 3],
  whiteBlack: [0, 5],
  blackWhite: [5, 0],
  blackBlack: [1, 1]
};

MODES = {
  classic: { rounds: 6, target: 32 },
  sprint: { rounds: 4, target: 22 },
  long: { rounds: 8, target: 43 }
};
```

Round resolution:

```js
function resolveRound(p1, p2) {
  if (p1 === "white" && p2 === "white") return [3, 3];
  if (p1 === "white" && p2 === "black") return [0, 5];
  if (p1 === "black" && p2 === "white") return [5, 0];
  return [1, 1];
}
```

Final result:

```js
const groupTotal = scores[0] + scores[1];
const targetReached = groupTotal >= target;

if (!targetReached) bothLose();
else if (scores[0] > scores[1]) playerOneWins();
else if (scores[1] > scores[0]) playerTwoWins();
else sharedWin();
```

## 11. Accessibility Requirements

- All buttons must be real `<button type="button">` elements.
- Name inputs need labels.
- The countdown needs accessible timer text.
- Current phase changes should update an `aria-live="polite"` region.
- Choice cards need labels such as `Choose White` and `Choose Black`.
- Final overlay, if used, must be dismissible by click, `Escape`, `Enter`, and
  `Space`.
- Focus order must follow the visible flow.
- Do not rely on color alone. Token labels must be textual too.
- Minimum touch target: 40-44px.
- Support keyboard play:
  - `Tab` reaches choice cards and End Turn,
  - `Enter` / `Space` activates controls.

## 12. Technical Constraints

When implementation is requested:

- create exactly one self-contained `dilemma/index.html`,
- no sidecar CSS or JS files,
- no build step,
- no external JavaScript dependencies,
- Google Fonts may match the existing apps,
- inline CSS and JS only,
- use `textContent` / DOM creation in JS, not `innerHTML`,
- guard all `localStorage` access in `try/catch`,
- do not persist match history unless explicitly requested,
- add the app to `index.md` only once the app exists,
- run `npm run code-review -- dilemma/index.html`.

Recommended localStorage keys if needed:

- `dilemmaLangV1`
- `dilemmaIntroSeenV1` only if an intro is later added.

Do not add an intro overlay in v1. The setup screen is sufficient.

## 13. Acceptance Criteria

### Rules

- The default payoff matrix is exactly `3/3`, `5/0`, `0/5`, `1/1`.
- `A = 3`, `B = 5`, `C = 0`, `D = 1` are visible or inferable from the payoff
  matrix.
- Classic mode has `6` rounds and shared target `34`.
- If total score is below target after the final round, both players lose.
- If total score reaches target, the higher individual score wins.
- Equal scores after reaching target produce a shared win.

### Flow

- First step asks for both player names.
- Start button begins the match.
- Player 1 chooses privately (the tap commits after a short debounce).
- A countdown hides Player 1's choice.
- Player 2 chooses privately (the tap commits after a short debounce).
- A countdown hides Player 2's choice before reveal.
- Round result screen reveals both choices and points.
- The next round starts only after the result action.

### Privacy

- Player 2 cannot see Player 1's current-round choice before choosing.
- The panel history never leaks an incomplete round.
- Browser refresh may reset the match; no persistence requirement.

### UX

- The first screen is setup, not a landing page.
- The main choices are large and visually clear.
- The shared target is always visible during play.
- Result explanations are short and tied directly to the round outcome.
- Final reflection compares actual play with all-White, all-Black, and
  one-player-always-Black totals.

### Visual

- Light theme matches `roman` / `codebreak` family.
- Black and white tokens are the primary visual language.
- No prison/crime imagery.
- Mobile layout has no horizontal overflow.
- Text does not overlap controls at common desktop and mobile sizes.

## 14. Manual Test Plan For Implementing Agent

Run through these cases after implementation:

1. Classic, all White:
   - six rounds of `White/White`,
   - final scores `18 / 18`,
   - group total `36`,
   - target reached,
   - shared win.

2. Classic, Player 1 always Black and Player 2 always White:
   - after round 3 the group total is `15` and the target becomes
     unreachable,
   - the match ends early (sudden death) with scores `15 / 0`,
   - both lose.

3. Classic, all Black:
   - the first `Black/Black` round makes the target unreachable,
   - the match ends after round 1 with scores `1 / 1`,
   - both lose.

4. Classic, one Black by Player 1 and all other choices White:
   - final scores `20 / 15`,
   - group total `35`,
   - target reached,
   - Player 1 wins.

5. Privacy:
   - after Player 1 ends turn, verify no current choice appears on stage or
     panel,
   - after Player 2 ends turn, verify reveal only happens after countdown.

6. Mobile:
   - names screen fits,
   - choice cards stack,
   - countdown is readable,
   - payoff matrix remains usable,
   - no horizontal scroll.

7. Accessibility:
   - complete one round with keyboard only,
   - language toggle updates labels,
   - countdown has accessible text,
   - result/final overlay can be dismissed with keyboard if used.

## 15. Future Extensions

Only consider these after the core two-player game works well:

- unknown final round to demonstrate the "shadow of the future",
- optional "strategy cards" after the match: nice, retaliating, forgiving,
  not envious,
- AI opponent with simple strategies: always White, always Black, tit for tat,
- class discussion mode that hides individual winner and focuses on group
  totals,
- configurable payoff lab for older learners.

Do not include these in the first implementation unless the user explicitly
asks for them.
