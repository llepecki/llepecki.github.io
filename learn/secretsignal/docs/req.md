# Secret Signal: Requirements And Design Specification

Design-only handoff. Do not infer that `secretsignal/index.html` already exists
from this document. When implementation is requested, build one new single-file
app at `secretsignal/index.html`, then add it to `index.md`.

Reference implementation target: `secretsignal/index.html`

Reference style baseline: `CLAUDE.md` light chassis, consistent with the
single-file apps under this repo.

## 0. Handoff Goal

Build a simple two-player, pass-and-play cooperative signaling game for
children. One player sees a hidden target and sends one limited clue. The other
player sees only that clue and chooses the target. Both players win or miss
together.

This is not a Prisoner's Dilemma reskin:

- no personal score,
- no defection action,
- no deceptive sender,
- no individual winner,
- no payoff conflict between players.

The scientific model is a common-interest signaling game:

```text
hidden state -> sender observes state -> sender chooses signal
signal -> receiver chooses action -> team payoff if action matches state
```

The child-facing learning goal is narrower:

> A clue works only when your partner understands it the same way.

## 1. Research Basis

Keep the research light in the app itself. Use these ideas to guide mechanics
and reflection:

- Lewis signaling game:
  https://en.wikipedia.org/wiki/Lewis_signaling_game
  - A Sender observes the state of the world, sends a signal, and a Receiver
    chooses an action after seeing the signal.
  - In the common-interest version used here, both players prefer the Receiver
    to choose the correct action.

- Signaling game:
  https://en.wikipedia.org/wiki/Signaling_game
  - The implementation must visibly separate private information, signal, and
    receiver action.
  - V1 avoids deception, adversarial types, and hidden incentives.

- Focal point / Schelling point:
  https://en.wikipedia.org/wiki/Focal_point_%28game_theory%29
  - Some clues feel natural to both players. Other clues are true but plausible
    for more than one target.
  - The game should make those shared conventions visible after the reveal.

- Reflection in educational games:
  https://arxiv.org/abs/2006.10793
  - Each reveal and final result should name what happened in the communication,
    not only report whether the answer was right.

- Accessible target sizing:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
  - Cards and primary buttons should be touch-friendly, about `40-44px` or
    larger.

## 2. Product Concept

Working title: `Secret Signal`

Short description:

> A cooperative game where one player sends a tiny clue and the other tries to
> understand it. The team wins by building shared meaning.

Theme:

- light theme,
- paper strategy board / message-card feel,
- friendly symbol cards,
- no spy, war, police, or military framing,
- no individual winner,
- kid-facing terms: `Sender`, `Receiver`, `Target`, `Clue`, `Guess`,
  `Team score`.

The app should feel like teammates passing clue cards, not like a competitive
quiz. The tone is: "we are learning how to understand each other."

## 3. Audience And Learning Goals

Primary audience: children roughly `8-13`, plus parents or teachers facilitating
a short activity.

Assumptions:

- two players share one device,
- players can read short labels,
- players do not know formal game theory,
- players can remember four symbols,
- a match takes about `5-8` minutes.

Round rule for players:

- no talking about the current target or clue until the reveal,
- after the reveal, players may discuss why the clue worked or failed.

Learning goals:

- limited communication can be hard even when both players cooperate,
- a clue can be true but still ambiguous,
- the Sender's meaning and the Receiver's interpretation can differ,
- good clues depend on the partner, not just the target,
- repeated rounds can build a shared convention,
- this is a cooperative signaling / coordination game.

After playing, a child should be able to say:

- `A clue works only if my partner understands it.`
- `Some clues point to more than one target.`
- `The best clue is not just true. It is clear to the other player.`
- `We got better when we learned each other's meanings.`

## 4. V1 Scope

Implement one mode only: `Classic`.

Classic rules:

- `8` curated rounds,
- `4` targets,
- `3` clue choices per round,
- roles alternate every round,
- one team score,
- team target `21`,
- no visible mode selector.

Why only one mode:

- the target audience benefits from a short, predictable flow,
- settings would distract from the signaling lesson,
- the curated deck is easier to test and explain,
- teachers and parents can start immediately.

Explicitly out of scope for V1:

- extra modes,
- wild clue scoring,
- free text clues,
- typed chat,
- drawing clues,
- online multiplayer,
- AI partner,
- adversarial or deceptive sender,
- individual winner,
- randomized round generation,
- more than two players,
- persistent accounts or leaderboards,
- intro overlay or landing page.

Future variants may be added later, but the first implementation should not
surface them in the UI or data model.

## 5. Core Game Rules

### 5.1 Roles

Each round has two roles:

| Role | Knows target? | Main action |
| --- | --- | --- |
| `Sender` | Yes | chooses one clue |
| `Receiver` | No | chooses one target from the clue |

Roles alternate every round:

- odd rounds: Player 1 Sender, Player 2 Receiver,
- even rounds: Player 2 Sender, Player 1 Receiver.

### 5.2 Round Structure

1. Sender privately sees the hidden target.
2. Sender chooses exactly one clue card from the allowed set.
3. Handoff screen hides the target and unchosen clues.
4. Receiver sees the chosen clue and all target cards.
5. Receiver chooses exactly one target.
6. Reveal shows target, clue, guess, points, score, and one short explanation.

Receiver must never see the target before locking a guess.

### 5.3 Targets

Use exactly four targets in V1.

| ID | English | Polish | Visual |
| --- | --- | --- | --- |
| `sun` | Sun | Słońce | `☀️` |
| `moon` | Moon | Księżyc | `🌙` |
| `tree` | Tree | Drzewo | `🌳` |
| `river` | River | Rzeka | `🌊` |

Target cards must show both icon and text. Do not rely on color alone.

Keep target order stable everywhere:

```text
Sun, Moon, Tree, River
```

### 5.4 Clue Types

Use two clue types in V1:

| Type | Meaning | Example |
| --- | --- | --- |
| `clear` | strongly points to one target | `Water -> River` |
| `shared` | plausible for two targets | `Round -> Sun/Moon` |

Do not include `wild` clues in V1. Ambiguity is already visible with shared
clues, and extra categories make the game feel like a settings puzzle.

Important scoring rule:

- clue type is for explanation and final reflection,
- clue type does not change the points,
- do not reward ambiguous clues with extra points.

Reasoning: in a common-interest signaling game, both players care about the
Receiver choosing the correct action. The lesson is clear shared meaning, not
gambling on a higher-value clue label.

### 5.5 Clue Data

Use these clue ids and labels.

| ID | English | Polish | Type | Plausible targets |
| --- | --- | --- | --- | --- |
| `day` | Day | Dzień | `clear` | `sun` |
| `water` | Water | Woda | `clear` | `river` |
| `night` | Night | Noc | `clear` | `moon` |
| `leaves` | Leaves | Liście | `clear` | `tree` |
| `warm` | Warm | Ciepło | `clear` | `sun` |
| `flow` | Flow | Nurt | `clear` | `river` |
| `green` | Green | Zieleń | `clear` | `tree` |
| `tall` | Tall | Wysokie | `clear` | `tree` |
| `bright` | Bright | Jasne | `shared` | `sun`, `moon` |
| `round` | Round | Okrągłe | `shared` | `sun`, `moon` |
| `quiet` | Quiet | Cicho | `shared` | `moon`, `river` |
| `nature` | Nature | Natura | `shared` | `tree`, `river` |
| `blue` | Blue | Niebieskie | `shared` | `moon`, `river` |

`blue` is intentionally shared, not clear. This avoids teaching children that a
color clue always has only one obvious answer.

### 5.6 Classic Deck

Use this deterministic deck. Do not randomize targets or allowed clues in V1.

| Round | Target | Allowed clues | Intended lesson |
| ---: | --- | --- | --- |
| 1 | Sun | `Day`, `Bright`, `Round` | obvious first success |
| 2 | River | `Water`, `Blue`, `Flow` | clear clue baseline |
| 3 | Moon | `Night`, `Bright`, `Round` | same clue can mean Sun/Moon |
| 4 | Tree | `Leaves`, `Green`, `Tall` | direct natural feature |
| 5 | Sun | `Warm`, `Bright`, `Round` | true clues differ in clarity |
| 6 | River | `Flow`, `Nature`, `Quiet` | learn partner's convention |
| 7 | Moon | `Quiet`, `Night`, `Round` | ambiguous vs clear tradeoff |
| 8 | Tree | `Tall`, `Green`, `Nature` | final role-swap review |

For each round:

- Sender sees the target and the three allowed clues,
- Receiver sees only the sent clue and the four targets,
- clue order should match the deck order,
- target order should remain stable.

### 5.7 Scoring

Team score only:

- correct guess: `+3`,
- incorrect guess: `0`.

Classic target:

```text
rounds = 8
maxScore = 24
teamTarget = 21
```

Why `21`:

- seven correct matches out of eight reaches the team target,
- one miss is recoverable,
- every correct match has the same value,
- the score stays small enough for children.

No individual score in V1. If role balance is shown, keep it neutral:

- `Maja sent 4 clues`,
- `Olek sent 4 clues`.

## 6. User Flow

### 6.1 Phase Diagram

```text
setup
  -> sender_turn
  -> handoff_to_receiver
  -> receiver_turn
  -> reveal_result
  -> next round or final_result
```

### 6.2 Setup Phase

Required content:

- title,
- one-line premise,
- one-line play rule: `No talking about the clue until the reveal.`,
- Player 1 name input,
- Player 2 name input,
- visible team target `21`,
- Start button.

Do not show a mode selector in V1.

Validation:

- blank names fall back to `Player 1` and `Player 2`,
- identical names show inline feedback: `Use two different names.`,
- starting a match resets score, history, and round state.

Suggested setup copy:

> Send tiny clues. Match the hidden target. Build a shared code together.

### 6.3 Sender Phase

Sender sees:

- round number,
- role label: `{name} sends`,
- hidden target card,
- three clue card choices,
- `Send clue` button disabled until a clue is selected.

Sender does not choose the target. The deck assigns it.

Sender copy:

> Pick one clue your partner will understand.

Privacy rule:

- after Sender clicks `Send clue`, the target and unchosen clue cards must be
  hidden before the device is passed.

### 6.4 Handoff Phase

After Sender sends:

- show a full-stage neutral handoff screen,
- title: `Pass to {Receiver}`,
- note: `The target is hidden.`,
- primary button: `{Receiver}, ready to guess`.

Do not show target, unchosen clues, or target-specific hints on this screen.

An animated `3, 2, 1` countdown is optional. If implemented, it must remain on
the neutral handoff screen and must not reveal the Receiver phase
automatically before the ready button is pressed.

### 6.5 Receiver Phase

Receiver sees:

- round number,
- role label: `{name} guesses`,
- the clue sent by Sender,
- all four target cards,
- `Lock guess` button disabled until a target is selected.

Receiver must not see:

- the hidden target before locking,
- the full Sender clue set,
- clue type labels or plausible-target metadata.

Receiver copy:

> What target did your partner mean?

### 6.6 Reveal Phase

Reveal shows:

- target,
- clue,
- Receiver guess,
- points gained,
- updated team score,
- one short explanation.

Reveal explanations should teach the signaling idea:

Correct + clear clue:

> Clear signal. `{clue}` pointed strongly to `{target}`.

Correct + shared clue:

> Team code. `{clue}` could mean more than one target, but you understood it the
> same way.

Miss + shared clue:

> Mixed signal. `{clue}` could fit more than one target. Sender meant
> `{target}`, Receiver heard `{guess}`.

Miss + clear clue:

> Mixed signal. Sender meant `{target}`, but Receiver heard `{guess}`. Talk
> after the reveal and build a clearer code.

Actions:

- if more rounds remain: `Next round`,
- if final round is complete: `Final result`.

### 6.7 Final Result Phase

If team score reaches `21`:

- title: `Signal found`,
- message: `You built a shared code.`,
- use success color.

If team score is below `21`:

- title: `Signal fuzzy`,
- message: `Some clues meant different things. Try again and make a clearer
  code together.`,
- use miss/far color depending on score distance.

Final stats:

- team score / `21`,
- matches / `8`,
- misses,
- clear clue matches,
- shared clue matches,
- shared clue misses,
- best team-code clue: a correct shared clue, or `No shared match yet`,
- most confusing clue: a missed clue, preferring missed shared clues, or
  `No misses`.

Final debrief:

> This was a signaling game. One player knew the target and sent a signal. The
> other player had to choose what it meant. Good signals are not just true. They
> must be clear to your partner.

Final actions:

- `Play again` keeps names,
- `New match` returns to setup.

## 7. Interface Architecture

Use the light chassis from `CLAUDE.md`.

DOM shape when implemented:

```html
<header>...</header>
<main class="main">
  <section class="canvas-wrap stage">...</section>
  <aside class="panel">...</aside>
</main>
<script>...</script>
```

The `canvas-wrap` class is the light-chassis left stage area. This app may use
DOM cards instead of an actual `<canvas>`.

Desktop:

- stage fills the left side,
- right panel width `320px`,
- no page-level scrolling,
- panel scrolls natively,
- stage contains the active role task.

Mobile:

- single breakpoint at `max-width: 720px`,
- stage stacks above panel,
- page may scroll,
- no horizontal overflow.

### 7.1 Header

Header should match the light apps:

- home link on the left,
- title `Secret Signal`,
- subtitle `A cooperative signaling game`,
- language toggle on the right.

Use bilingual English/Polish strings through one inline `I18N` object.

### 7.2 Stage

The stage is the primary play area.

Stage responsibilities by phase:

- setup: names and start,
- sender: target plus clue choices,
- handoff: neutral pass screen,
- receiver: clue plus target choices,
- reveal: target/clue/guess/result,
- final: outcome and reflection.

Use a consistent visual board:

- round number,
- role indicator,
- team score meter,
- target/clue/guess cards.

### 7.3 Panel

Keep the panel useful but quiet. Do not overload children with extra systems.

Panel order during active play:

1. Team score and target progress.
2. Current roles.
3. Round history.
4. New match action, if needed.

Round history:

- one row per completed round,
- round number,
- Sender initials,
- clue,
- guess result,
- points.

Privacy:

- history only renders completed rounds,
- history must not reveal the current hidden target during Sender, handoff, or
  Receiver phases.

Do not show a signal map or target-to-clue glossary during active play. That
would turn the Receiver task into lookup instead of interpretation.

After the final result, the panel may show a compact reflection map:

- each target,
- clues used for it,
- whether the team matched or missed.

## 8. Visual Design

### 8.1 Tone

The app should feel like a clean cooperative clue board.

Use:

- warm off-white background,
- white panels,
- neutral ink text,
- teal for team progress,
- blue/purple only for player identity,
- amber for shared or ambiguous clues after reveal,
- green for matches,
- red for misses.

Avoid:

- dark theme,
- spy, military, police, or hacking visuals,
- adversarial "trick" language,
- heavy gradients,
- one-note purple/blue palette,
- decorative orbs or bokeh backgrounds.

### 8.2 Components

Target cards:

- repeated cards for Sun/Moon/Tree/River,
- label plus icon/emoji,
- large enough for touch,
- selected state uses border plus check badge, not color alone.

Clue cards:

- text-first cards,
- no clue type marker during Sender choice,
- type marker may appear only after reveal.

Team meter:

- thin progress bar,
- label `Team target`,
- numeric text like `15 / 21`.

Reveal cards:

- `Target`,
- `Clue`,
- `Guess`,
- result line,
- explanation.

### 8.3 Motion

Use motion sparingly:

- selected card transition: `0.15s`,
- progress fill: `0.12s`,
- reveal pop: `0.3s`,
- final overlay pop only for final outcome.

Respect `prefers-reduced-motion: reduce`.

## 9. Copy And Localization

All visible strings must be in one inline `I18N` object with `en` and `pl`.

Minimum English copy:

| Key | English |
| --- | --- |
| `title` | Secret Signal |
| `subtitle` | A cooperative signaling game |
| `setupTitle` | Send tiny clues. Build a shared code. |
| `setupCopy` | One player sees the target. One clue must help the other player guess it. |
| `playRule` | No talking about the clue until the reveal. |
| `playerOneName` | Player 1 name |
| `playerTwoName` | Player 2 name |
| `nameError` | Use two different names. |
| `start` | Start match |
| `teamTarget` | Team target |
| `round` | Round |
| `sender` | Sender |
| `receiver` | Receiver |
| `sendClue` | Send clue |
| `lockGuess` | Lock guess |
| `passTo` | Pass to {name} |
| `targetHidden` | The target is hidden. |
| `readyToGuess` | {name}, ready to guess |
| `nextRound` | Next round |
| `finalResult` | Final result |
| `signalFound` | Signal found |
| `signalFuzzy` | Signal fuzzy |
| `playAgain` | Play again |
| `newMatch` | New match |

Minimum Polish copy:

| Key | Polish |
| --- | --- |
| `title` | Tajny Sygnał |
| `subtitle` | Kooperacyjna gra o sygnałach |
| `setupTitle` | Wysyłaj krótkie wskazówki. Zbudujcie wspólny kod. |
| `setupCopy` | Jedna osoba widzi cel. Jedna wskazówka ma pomóc drugiej osobie go odgadnąć. |
| `playRule` | Nie rozmawiajcie o wskazówce aż do odkrycia wyniku. |
| `playerOneName` | Imię gracza 1 |
| `playerTwoName` | Imię gracza 2 |
| `nameError` | Wpiszcie dwa różne imiona. |
| `start` | Rozpocznij mecz |
| `teamTarget` | Cel drużyny |
| `round` | Runda |
| `sender` | Nadawca |
| `receiver` | Odbiorca |
| `sendClue` | Wyślij wskazówkę |
| `lockGuess` | Zatwierdź odpowiedź |
| `passTo` | Przekaż do: {name} |
| `targetHidden` | Cel jest ukryty. |
| `readyToGuess` | {name}, gotowe do zgadywania |
| `nextRound` | Następna runda |
| `finalResult` | Wynik końcowy |
| `signalFound` | Sygnał odnaleziony |
| `signalFuzzy` | Sygnał był niejasny |
| `playAgain` | Zagraj ponownie |
| `newMatch` | Nowy mecz |

Tone rules:

- keep sentences short,
- use `clue` / `wskazówka` more often than formal `signal` / `sygnał` during
  play,
- reserve `signaling game`, `coordination`, and `focal point` for the final
  debrief,
- avoid blame language after misses.

Target and clue label keys:

| Key | English | Polish |
| --- | --- | --- |
| `targetSun` | Sun | Słońce |
| `targetMoon` | Moon | Księżyc |
| `targetTree` | Tree | Drzewo |
| `targetRiver` | River | Rzeka |
| `clueDay` | Day | Dzień |
| `clueWater` | Water | Woda |
| `clueNight` | Night | Noc |
| `clueLeaves` | Leaves | Liście |
| `clueWarm` | Warm | Ciepło |
| `clueFlow` | Flow | Nurt |
| `clueGreen` | Green | Zieleń |
| `clueTall` | Tall | Wysokie |
| `clueBright` | Bright | Jasne |
| `clueRound` | Round | Okrągłe |
| `clueQuiet` | Quiet | Cicho |
| `clueNature` | Nature | Natura |
| `clueBlue` | Blue | Niebieskie |

## 10. State And Data Model

Suggested state:

```js
state = {
  lang: "en",
  phase: "setup", // setup | sender | handoff | receiver | reveal | final
  names: ["Player 1", "Player 2"],
  roundIndex: 0,
  senderIndex: 0,
  selectedClue: null,
  selectedGuess: null,
  score: 0,
  history: [
    {
      round: 1,
      sender: 0,
      receiver: 1,
      target: "sun",
      clue: "bright",
      clueType: "shared",
      guess: "moon",
      points: 0,
      result: "miss"
    }
  ]
};
```

Suggested constants:

```js
const TEAM_TARGET = 21;
const POINTS_PER_MATCH = 3;

const TARGET_ORDER = ["sun", "moon", "tree", "river"];

const TARGETS = {
  sun: { labelKey: "targetSun", icon: "☀️" },
  moon: { labelKey: "targetMoon", icon: "🌙" },
  tree: { labelKey: "targetTree", icon: "🌳" },
  river: { labelKey: "targetRiver", icon: "🌊" }
};

const CLUES = {
  day: { labelKey: "clueDay", type: "clear", targets: ["sun"] },
  water: { labelKey: "clueWater", type: "clear", targets: ["river"] },
  night: { labelKey: "clueNight", type: "clear", targets: ["moon"] },
  leaves: { labelKey: "clueLeaves", type: "clear", targets: ["tree"] },
  warm: { labelKey: "clueWarm", type: "clear", targets: ["sun"] },
  flow: { labelKey: "clueFlow", type: "clear", targets: ["river"] },
  green: { labelKey: "clueGreen", type: "clear", targets: ["tree"] },
  tall: { labelKey: "clueTall", type: "clear", targets: ["tree"] },
  bright: { labelKey: "clueBright", type: "shared", targets: ["sun", "moon"] },
  round: { labelKey: "clueRound", type: "shared", targets: ["sun", "moon"] },
  quiet: { labelKey: "clueQuiet", type: "shared", targets: ["moon", "river"] },
  nature: { labelKey: "clueNature", type: "shared", targets: ["tree", "river"] },
  blue: { labelKey: "clueBlue", type: "shared", targets: ["moon", "river"] }
};

const CLASSIC_DECK = [
  { target: "sun", clues: ["day", "bright", "round"] },
  { target: "river", clues: ["water", "blue", "flow"] },
  { target: "moon", clues: ["night", "bright", "round"] },
  { target: "tree", clues: ["leaves", "green", "tall"] },
  { target: "sun", clues: ["warm", "bright", "round"] },
  { target: "river", clues: ["flow", "nature", "quiet"] },
  { target: "moon", clues: ["quiet", "night", "round"] },
  { target: "tree", clues: ["tall", "green", "nature"] }
];
```

Round scoring:

```js
function scoreRound(target, guess) {
  return guess === target ? POINTS_PER_MATCH : 0;
}
```

Final result:

```js
const targetReached = state.score >= TEAM_TARGET;
```

## 11. Accessibility Requirements

- All controls must be real `<button type="button">` elements.
- Name inputs need visible labels.
- Target cards and clue cards need accessible names.
- Sender target text must not remain visible in the DOM during Receiver phase.
- Handoff phase needs accessible status text.
- Current phase changes should update an `aria-live="polite"` region.
- Final overlay, if used, must be dismissible by click, `Escape`, `Enter`, and
  `Space`.
- Focus order must follow the visible flow.
- Do not rely on color alone:
  - target icons have labels,
  - result uses words like `match` / `miss`,
  - clue type is textual after reveal.
- Minimum touch target: `40-44px`.
- Keyboard support:
  - `Tab` reaches clue/target cards and actions,
  - `Enter` / `Space` activates selected controls.

## 12. Technical Constraints

When implementation is requested:

- create exactly one self-contained `secretsignal/index.html`,
- do not create sidecar CSS or JS files,
- do not add a build step,
- do not use external JavaScript dependencies,
- Google Fonts may match `CLAUDE.md`,
- inline CSS and JS only,
- use `textContent` and DOM creation in JS, not `innerHTML`,
- prefer the native `hidden` attribute over inline `style.display`,
- guard any `localStorage` access in `try/catch`,
- persist only language preference unless explicitly requested,
- add the app to `index.md` only once the app exists,
- run `npm run code-review -- secretsignal/index.html`.

Recommended localStorage key:

- `secretSignalLangV1`

Do not add an intro overlay in V1. The setup screen is sufficient.

## 13. Acceptance Criteria

### Rules

- Classic has exactly `8` rounds.
- Team target is `21`.
- Roles alternate every round.
- Sender sees the target and clue choices.
- Receiver sees the sent clue and target choices, but not the target.
- Correct guesses score `3`.
- Incorrect guesses score `0`.
- Clue type does not change points.
- There is no individual winner.
- Final outcome depends only on team score vs team target.

### Flow

- First screen is setup, not a landing page.
- Setup asks for both player names.
- Start button begins round 1.
- Sender picks exactly one clue.
- Handoff hides the target before Receiver phase.
- Receiver picks exactly one target.
- Reveal shows target, clue, guess, points, and team score.
- Roles swap next round.
- Final screen appears after round 8.

### Privacy

- Receiver cannot see the hidden target before guessing.
- Handoff screen shows no target-specific information.
- Round history never leaks an incomplete round.
- Browser refresh may reset the match.

### UX

- Sender and Receiver phases are visually distinct.
- Team target is visible during active play except handoff if needed for
  privacy.
- Miss explanations avoid blame.
- Final reflection explains why clarity matters.
- No visible settings or modes appear in V1.

### Visual

- Light theme matches the repo style.
- Target and clue cards are the primary visual language.
- No adversarial spy, military, police, or hacking imagery.
- Mobile layout has no horizontal overflow.
- Text does not overlap controls at common desktop and mobile sizes.

## 14. Manual Test Plan For Implementing Agent

Run through these cases after implementation:

1. Classic, all guesses correct:
   - final score is `24`,
   - final outcome is `Signal found`.

2. Classic, one miss and seven correct guesses:
   - final score is `21`,
   - final outcome is `Signal found`.

3. Classic, two misses and six correct guesses:
   - final score is `18`,
   - final outcome is `Signal fuzzy`.

4. Sender privacy:
   - after Sender sends a clue, verify target and unchosen clue cards are hidden,
   - Receiver phase shows clue and target choices only.

5. History privacy:
   - during Sender, handoff, and Receiver phases, history shows only completed
     rounds.

6. Role alternation:
   - Player 1 sends rounds 1, 3, 5, 7,
   - Player 2 sends rounds 2, 4, 6, 8.

7. Scoring:
   - clear correct = `+3`,
   - shared correct = `+3`,
   - any wrong guess = `0`.

8. Ambiguity explanation:
   - choose `Bright` for Sun and guess Moon,
   - reveal explains that the clue could fit more than one target.

9. Mobile:
   - setup fits,
   - clue cards and target cards stack cleanly,
   - handoff screen is readable,
   - no horizontal scroll.

10. Accessibility:
   - complete one round with keyboard only,
   - language toggle updates labels,
   - handoff has accessible status text,
   - final overlay can be dismissed with keyboard if used.

11. Polish:
   - target and clue names fit inside cards,
   - phase instructions remain short,
   - miss feedback sounds cooperative, not blaming.

## 15. Future Extensions

Only consider these after the core cooperative game works well:

- class mode with more targets,
- optional harder deck,
- player-created clue decks,
- drawing clues with strict teacher-controlled mode,
- AI partner with simple conventions,
- focal-point challenge where both players choose without a sender,
- noisy signal variant where one clue may be blurred or lost,
- adversarial/deceptive sender as an older-learner extension.

Do not include these in the first implementation unless the user explicitly
asks for them.
