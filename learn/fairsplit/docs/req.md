# Fair Split: Requirements And Design Specification

Implemented at `fairsplit/index.html`. Validation:
`npm run code-review -- fairsplit/index.html` and
`node tools/fairsplit-rules-check.mjs` (both run from `learn/`).

Style baseline: `CLAUDE.md` light chassis. Use the repo's single-file app,
inline CSS/JS, bilingual `I18N`, and accessibility conventions.

## 0. Implementation Scope

Build `Fair Split` as a simple, two-player, pass-and-play educational game about
the Ultimatum Game.

Required:

- three win modes selected at match start: `Team goal` (default),
  `Checkpoint`, and `Shrinking pot` (owner decision; see 4.7 for why pure
  higher-score-wins scoring was replaced and why each mode adds pressure),
- two children on one shared device,
- 8 short rounds,
- 10 neutral coins per round,
- alternating roles,
- one offer per round,
- accept or no-deal decision,
- individual scoring against the selected win condition,
- final debrief that names the game-theory idea.

Do not implement an AI opponent, variable pot mode, hidden threshold mode,
negotiation, counteroffers, shop/reward systems, avatars, sound settings, or
configurable rule screens. Those additions are more likely to distract from
the bargaining lesson than to help it.

## 1. Learning Goal

Children should discover this idea through play:

```text
A deal needs both players to say yes.
Keeping too much can make the whole pot disappear.
Fairness can be part of a winning strategy.
```

After one match, a child should be able to say:

- `If I offer too little, the other player might say no.`
- `No deal gives both players 0 for that round.`
- `The best offer depends on what the other person will accept.`
- `Fair offers can be smart, not only nice.`

This is not a Prisoner's Dilemma reskin and not a generic cooperation game. The
central mechanism is bargaining with a responder who can reject the proposed
split.

## 2. Research Basis

Keep the research basis concise in the app. The document uses these stable
references for implementation accuracy:

- Güth, Schmittberger, and Schwarze, `An Experimental Analysis of Ultimatum
  Bargaining`, 1982: https://doi.org/10.1016/0167-2681(82)90011-7
- Nowak, Page, and Sigmund, `Fairness Versus Reason in the Ultimatum Game`,
  2000: https://doi.org/10.1126/science.289.5485.1773
- W3C WCAG 2.2 target-size guidance:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

Design implications:

- The Splitter makes one offer.
- The Decider accepts or rejects that exact offer.
- If accepted, both players receive the proposed split.
- If rejected, both players receive `0`.
- There is no counteroffer and no second chance in a round.
- Low offers must be allowed. The reject option is the scientific mechanism.
- The match repeats the one-shot structure for classroom play, but each round
  still resolves as a complete ultimatum.
- Copy must describe choices as strategies, not as moral failures.

Use kid-facing names during active play:

| Kid-facing name | Formal debrief term |
| --- | --- |
| `Splitter` | proposer |
| `Decider` | responder |
| `No deal` | rejected ultimatum |

## 3. Product Concept

Working title: `Fair Split`

One-sentence pitch:

```text
Split a pot of coins, make offers your partner will accept, and learn why fair
deals can beat keeping almost everything.
```

Audience:

- children around ages `8-13`,
- classroom, family, or museum-style settings,
- two players sharing one screen.

Difficulty target:

- explainable in under one minute,
- no algebra, probability, or formal game theory during play,
- all math uses small whole numbers.

Theme:

- light tabletop / classroom feel,
- paper background,
- emoji coin chips (🟡),
- clean ledger-like score area,
- no casino, betting, market, or battle framing; coins are neutral game
  pieces — no currency symbols or denominations.

Preferred object word: `coins` (Polish: `monety`).

## 4. Classic Fair Split Rules

### 4.1 Match Constants

```text
pot = 10 coins
rounds = 8
players = 2
```

Why `10`:

- equal split is visibly `5 / 5`,
- one-away choices like `6 / 4` are easy to compare,
- boundary offers `10 / 0` and `0 / 10` are clear,
- final scores remain small.

### 4.2 Roles

Each round has two roles:

| Role | Action |
| --- | --- |
| `Splitter` | Chooses how many coins to offer the Decider |
| `Decider` | Accepts the offer or says `No deal` |

Roles alternate:

```js
splitterIndex = roundIndex % 2;
deciderIndex = 1 - splitterIndex;
```

For `roundIndex = 0`, Player 1 is the Splitter. In 8 rounds, each player is
Splitter exactly 4 times and Decider exactly 4 times.

### 4.3 Offer

The Splitter chooses an integer offer:

```text
offerToDecider = integer from 0 to 10
keptBySplitter = 10 - offerToDecider
```

All offers from `0` through `10` are legal. Do not block low offers or force a
minimum.

Start each Splitter turn at `5` to make the equal split visible, then allow the
child to change it.

### 4.4 Accept / Reject

If the Decider accepts:

```text
Splitter receives keptBySplitter
Decider receives offerToDecider
```

If the Decider says `No deal`:

```text
Splitter receives 0
Decider receives 0
```

The decision buttons must always carry this reminder as visible sub-lines
inside the buttons themselves:

```text
[ Accept deal            ]   [ No deal                    ]
[ Both players get these ]   [ Both players get 0 this    ]
[ coins.                 ]   [ round.                     ]
```

This prevents the common misunderstanding that the Decider gets the whole pot
after rejecting, without a separate reminder panel.

### 4.5 Scoring

Scores are individual totals:

```text
playerScore += roundPayoffForPlayer
```

After the match the selected mode decides the outcome:

- `Team goal`: if the two totals sum to less than `60`, nobody wins.
  Otherwise every player at or above the `20`-coin floor wins, and the higher
  total among them takes the point win (equal totals show `Balanced table`).
- `Checkpoint`: same `60` bank gate and point winner, plus a mid-match
  checkpoint — the bank must reach `30` after round 4 or the match ends early
  in collective loss.
- `Shrinking pot`: each player independently needs `25`; everyone who reaches
  it wins, and every no-deal shrinks the pot for the rest of the match. There
  is deliberately no point winner in this mode.
- No extra points or badges change the score in any mode.

Final learning stats:

- accepted deals,
- no-deal rounds,
- average offer to the Decider,
- near-middle offers.

### 4.6 Near-Middle Summary

Use `fairZone` only for the final summary. Because the pot can shrink (see
4.7), the fair zone is defined relative to the round's pot:

```js
fairZone = Math.abs(offerToDecider - pot / 2) <= 1;
```

At the full pot of 10 this is `4..6`. UI wording should say `near-middle
offers`, not `good offers`. Do not give bonus points for near-middle offers.

### 4.7 Modes And Targets

Pure higher-score-wins scoring is degenerate: every round is zero-sum between
the players, so a leader can lock in victory by rejecting everything (the gap
never shrinks), and a purely competitive Decider should reject any offer of 5
or less from round one. Worse, a plain shared-goal gate exerts little pressure
because natural play clears it with slack. The three modes each pin the shared
and individual incentives together in a different, better-established way:

```js
MODES = {
  team: { target: 60, floor: 20, strikes: 2 },
  checkpoint: { target: 60, checkpointRound: 4, checkpointBank: 30, strikes: 2 },
  shrink: { goal: 25, shrinkBy: 1, minPot: 5 },
};
```

**Team goal** (dual gate, the semi-cooperative "both objectives" pattern):
bank `60` together AND each player must personally clear a `20`-coin floor to
win. Bank fails → nobody wins. Bank passes → every player above the floor wins;
if greed pushes the partner below the floor, the greedy player can win alone —
but the partner now has a legitimate reason to reject low offers. Because bank
≥ 60 forces the higher scorer to ≥ 30, at least one winner always exists.
Winning **alone** requires ≥ `41`, i.e. beating fair play (40), so the floor
punishes only sustained near-zero exploitation; routine `2`-coin offers against
fair replies still end `52 / 28`, a both-win.

**Checkpoint** (pace track): the shared 60 gate plus a hard mid-match cliff —
the bank must reach `30` after round 4 (exactly one first-half no-deal
tolerated) or the match ends early in collective loss. Converts the end-of-
match slack into visible early pressure.

**Shrinking pot** (discounted bargaining): each player needs `25`, and every
no-deal shrinks the pot by 1 for all remaining rounds, floored at `5`. One
rejection is always survivable (`32 / 31`); two early rejections sink both
players (`24 / 24`); the pot floor keeps the Polish genitive `monet` valid for
every pot value.

Why these numbers: fair symmetric play (all deals accepted, matching offers)
always yields `40 / 40` at full pot, so the shared `60` and personal `25`/`20`
targets sit near 75% of their maxima — reachable through mostly-fair play, and
sunk by spite or extreme greed. Each mode gives the Decider a self-interested
reason to reject unfair offers, and no mode lets a leader lock in a win by
rejection alone.

## 5. Core Screen Flow

Required phases:

```text
intro
setup
splitter_turn
decider_turn
round_reveal
final_result
```

### 5.0 Intro / Tutorial

On the first visit the app opens on a step-by-step tutorial that teaches the
whole loop in a handful of simple, kid-friendly cards (split → decide → no-deal
costs both → be fair). It follows the house intro pattern:

- big emoji + short title + one line of copy per step, with progress dots,
- a full-width primary button (`Next`, becoming `Start playing` on the last
  step) plus subtle `Back` and `Skip` controls,
- keyboard support: `ArrowLeft`/`ArrowRight` step, `Escape` skips; the current
  step is announced to the live region,
- auto-opens only on the first visit, gated by a versioned localStorage key
  `fairsplitIntroSeenV1` (guarded in try/catch); leaving marks it seen,
- a `How to play` button on the setup screen re-opens it at any time.

### 5.1 Setup

Inputs:

- Player 1 name,
- Player 2 name,
- mode picker (`Team goal` / `Checkpoint` / `Shrinking pot`) with a one-line
  summary of the selected win condition; the three buttons share one row on
  desktop and stack vertically below ~480px,
- language toggle,
- start button.

The mode defaults to `Team goal`, is locked once the match starts, and is
kept across `Play again` and `New match`.

Default names:

- English: `Player 1`, `Player 2`
- Polish: `Gracz 1`, `Gracz 2`

Setup copy:

```text
One player offers a split. The other accepts it or says no deal.
```

Keep setup compact. The first round should teach the rules visually.

### 5.2 Splitter Turn

Visible:

- round number,
- Splitter name,
- Decider name,
- pot size,
- `Keep` pile,
- `Offer` pile,
- give-a-coin buttons flanking the coin row,
- send button.

Suggested layout:

```text
Round 3 of 8
Alex splits 10 coins

Alex keeps 6        Sam gets 4
[+] (oooooo  oooo) [+]

[Send offer]
```

Offer control:

- two large `+` buttons flanking the coin row: the left one gives a coin to
  the Splitter's pile (offer decreases), the right one gives a coin to the
  Decider's pile (offer increases),
- no central numeric readout — the counts live in the keep/get labels above
  the coins,
- clamp silently at `0..10`; keep both buttons enabled at the bounds so
  keyboard focus is never lost,
- update both piles instantly,
- keep `Send offer` enabled because every integer offer is valid.

Do not require dragging. Buttons are more reliable for children and touch
screens. A slider may be added only if the plus buttons remain the primary
control.

### 5.3 Pass Cue (no separate handoff screen)

Nothing in this game is secret, so a dedicated handoff screen adds friction
without information value. Sending the offer moves directly to the Decider
turn. Two mechanisms replace the screen:

- the Decider screen shows a visible pass cue (`Pass to Sam`) above the title,
- a short (~500 ms) input guard after the phase change ignores decision
  activations, so an accidental double tap or double Enter on `Send offer`
  cannot land on `Accept deal`. The buttons stay visually enabled and keep
  focus.

### 5.4 Decider Turn

Visible:

- round number,
- pass cue (`Pass to Sam`),
- offer summary,
- stable split visualization,
- accept and no-deal buttons with consequence sub-lines (see 4.4).

Suggested layout:

```text
Round 3 of 8
Pass to Sam
Sam decides

Alex keeps 6        Sam gets 4
oooooo  oooo

[✔ Accept deal              ] [✖ No deal                  ]
[  Both players get these   ] [  Both players get 0 this  ]
[  coins.                   ] [  round.                   ]
```

Button requirements:

- both buttons are large touch targets,
- `Accept deal` can be primary/positive,
- `No deal` is visible and equal in dignity,
- do not make `No deal` scary, hidden, or red-only.

### 5.5 Round Reveal

Reveal must show:

- accepted or no deal,
- the offered split,
- both players' round payoffs,
- updated totals,
- one short explanation,
- `Next round` or final continuation.

Accepted example:

```text
Deal accepted
Alex gets 6. Sam gets 4.
Both players agreed, so both keep points.
```

No-deal example for a low offer:

```text
No deal
Both players get 0 this round.
A low offer can disappear if the Decider says no.
```

No-deal example for a near-middle offer:

```text
No deal
Both players get 0 this round.
The Decider wanted a different split.
```

Do not say `wrong`, `mean`, `greedy`, or `selfish`.

Mode-specific reveal notes on a no-deal:

- `Shrinking pot`: `The pot shrinks to {pot} coins for the rest of the match.`
  (or `The pot stays at {pot} coins.` once the pot is at its floor of 5).
- `Team goal` / `Checkpoint` when both spare no-deals are used up:
  `No spare no-deals left. Every remaining deal must be accepted to reach 60.`,
  and once the goal is mathematically out of reach:
  `The team goal is out of reach this match.`

### 5.6 Final Result

Final screen must show:

- final scores (with `/ 25` goal context in Shrinking pot mode),
- the mode verdict (see table below),
- a floor note in Team goal mode (both cleared the floor, or who fell below),
- the banked total versus 60 in Team goal / Checkpoint modes,
- accepted/no-deal count,
- average offer,
- near-middle offer count,
- a short game-theory debrief,
- `Play again`,
- `New match`.

Example:

```text
Final result
Alex: 31
Sam: 29

Point winner: Alex

6 of 8 deals were accepted.
Average offer to the Decider: 4.4.
Near-middle offers: 5 of 8.

Game theory idea:
A deal needs both players. Very low offers can be rejected, so fairness can be
part of a winning strategy.
```

Formal terms may appear here:

```text
In game theory, the Splitter is the proposer and the Decider is the responder.
```

Celebration overlay: when the match ends, a full-screen result overlay (the
house `result-overlay` pattern) appears above the final ledger. Verdicts by
mode:

| Mode | Verdict | Overlay |
| --- | --- | --- |
| Team | sum < 60 | red wash, ❌, `Nobody wins`, sub = `Together: {sum} / 60` |
| Team | both ≥ floor | green wash, 🎉, `Point winner: {name}` (tie → blue 🎯 `Balanced table`) |
| Team | one below floor | green wash, 🎉, `Only {name} wins` |
| Checkpoint | checkpoint failed | red wash, ❌, `Nobody wins`, sub = `Together: {sum} / 30` |
| Checkpoint | sum < 60 | red wash, ❌, `Nobody wins`, sub = `Together: {sum} / 60` |
| Checkpoint | higher / equal | green 🎉 `Point winner: {name}` / blue 🎯 `Balanced table` |
| Shrink | both ≥ 25 | green wash, 🎉, `Both reached the goal!` |
| Shrink | one ≥ 25 | green wash, 🎉, `Goal reached: {name}` |
| Shrink | none ≥ 25 | red wash, ❌, `Nobody reached the goal.` |

Shared rules for the overlay:

- sub-line with both names and scores (`/ 25` context in Shrinking pot mode),
- hint line `Tap anywhere to continue`,
- dismissed by tap/click and by Escape/Enter/Space; focus then moves to
  `Play again`,
- the overlay re-translates in place if the language is switched while open.

## 6. UX Requirements

### 6.1 Kid-Friendly Clarity

Use concrete labels:

- `coins`,
- `keep`,
- `offer`,
- `accept`,
- `no deal`.

Avoid during active play:

- `utility`,
- `equilibrium`,
- `reservation value`,
- `punishment`,
- long rules explanations.

The game should never ask children to set preferences, thresholds, player types,
or strategy profiles.

### 6.2 Visual Offer Representation

Use one stable split visualization:

- preferred: one row of 10 emoji coins (🟡) in two groups with a wide visible
  gap at the split point,
- acceptable: one horizontal split bar.

Requirements:

- show numeric labels for both sides,
- show player names next to both sides,
- **fixed player sides and identity color**: Player 1's label and coins are
  always on the left (blue marker), Player 2's always on the right (amber
  marker), regardless of who is Splitter this round — the same player→color
  mapping the scoreboard role tags use, so the markers never switch places.
  Only the `keeps`/`gets` verb follows each player's role. The left give-a-coin
  button always grows Player 1's pile and the right button always grows
  Player 2's.
- do not rely on color alone,
- keep layout stable across pot sizes 5–10 (the coin row keeps constant total
  width; only the gap position and the count of shown coins change).

Recommended display (round with Player 1 as Splitter):

```text
Player 1 keeps 6      Player 2 gets 4
oooooo  oooo
```

### 6.3 Scoreboard And History

Persistent scoreboard:

- Player 1 total,
- Player 2 total,
- round number,
- current roles,
- mode progress:
  - `Team goal` / `Checkpoint`: a `Together: {sum} / 60` line, a progress bar
    (with a 50% checkpoint tick in Checkpoint mode), and two no-deal strike
    slots that turn red as spare no-deals are spent; Team goal also adds a
    `/ 20` floor suffix on each score,
  - `Shrinking pot`: a `/ 25` goal suffix on each score and a `Pot: {pot}`
    chip that tracks the shrinking pot.

Keep the scoreboard small. Do not show final-style rankings during a round.

History is optional. If included, show a compact list of completed rounds:

```text
R3: 6/4 accepted -> +6 / +4
R4: 8/2 no deal -> +0 / +0
```

On mobile, it is fine to show only the last two rounds during play and use the
full final summary at the end.

### 6.4 Timers

No decision countdown is required. The game teaches bargaining, not speed.

The only timing mechanism is the invisible ~500 ms decision input guard after
`Send offer` (see 5.3).

## 7. Visual Design

Use the `CLAUDE.md` light chassis.

Theme direction:

- off-white paper background,
- white panels,
- slate text,
- teal/blue for Splitter,
- amber/green for Decider,
- green check for accepted,
- neutral or red-outline treatment for no deal.

Avoid:

- casino green,
- currency symbols,
- betting language,
- dark mode,
- dramatic alarms,
- adversarial battle language,
- decorative orbs or heavy gradients,
- a one-note purple/blue palette.

Components:

- coins are the 🟡 emoji rendered as text, identical on both sides (ownership
  is shown by grouping and labels); the exact glyph look varies by platform
  and that is accepted,
- the coin row must stay stable and readable,
- decision buttons should have text plus icon when practical,
- result panel should be simple and not nested inside another card.

Use icons only where they clarify actions:

- check for accepted,
- x or ban for no deal,
- rotate/refresh for replay.

If no icon system is already available, text-only buttons are acceptable.

Motion:

- coin row updates instantly (the gap moves, no coin-hop animation),
- accepted reveal: small check pop,
- no-deal reveal: coins fade to `0.35` opacity over `0.3s`,
- final overlay: fade in plus emoji pop (house `overlayFadeIn`/`overlayPop`),
- no shaking animations,
- respect `prefers-reduced-motion: reduce` (covers the coin fade, the check
  pop, and both overlay animations).

## 8. Copy And Localization

All visible strings must live in one inline `I18N` object with `en` and `pl`.

### 8.1 Minimum English Copy

| Key | English |
| --- | --- |
| `title` | Fair Split |
| `subtitle` | A bargaining game about offers and fairness |
| `setupTitle` | Divide the pot. Make a deal. |
| `setupCopy` | One player offers a split. The other accepts it or says no deal. |
| `playerOneName` | Player 1 name |
| `playerTwoName` | Player 2 name |
| `start` | Start match |
| `modeLabel` | Mode |
| `modeTeam` | Team goal |
| `modeCheckpoint` | Checkpoint |
| `modeShrink` | Shrinking pot |
| `modeSummaryTeam` | Bank {target} coins together, and each of you needs {floor}. Higher score takes the win. |
| `modeSummaryCheckpoint` | Bank {target} coins together. Have {bank} after round {round}, or the match ends early. |
| `modeSummaryShrink` | Collect {goal} coins for yourself. Every no-deal shrinks the pot. |
| `roundOf` | Round {round} of {total} |
| `splitter` | Splitter |
| `decider` | Decider |
| `splitsPot` | {name} splits {pot} coins |
| `keeps` | {name} keeps |
| `gets` | {name} gets |
| `offerTo` | Offer to {name} |
| `giveCoinTo` | Give a coin to {name} |
| `sendOffer` | Send offer |
| `passTo` | Pass to {name} |
| `decides` | {name} decides |
| `acceptSub` | Both players get these coins. |
| `acceptDeal` | Accept deal |
| `noDeal` | No deal |
| `dealAccepted` | Deal accepted |
| `dealRejected` | No deal |
| `bothZero` | Both players get 0 this round. |
| `acceptedNote` | Both players agreed, so both keep points. |
| `rejectedLowNote` | A low offer can disappear if the Decider says no. |
| `rejectedNeutralNote` | The Decider wanted a different split. |
| `roundPoints` | Round points |
| `totalScore` | Total score |
| `nextRound` | Next round |
| `finalResult` | Final result |
| `pointWinner` | Point winner: {name} |
| `balancedTable` | Balanced table |
| `aloneWin` | Only {name} wins |
| `bankLine` | Together: {sum} / {target} |
| `nobodyWins` | Nobody wins |
| `sharedMissed` | The shared goal was missed — nobody wins. |
| `checkpointMissed` | Checkpoint missed — the match ends early. Nobody wins. |
| `bothReached` | Both reached the goal! |
| `goalReached` | Goal reached: {name} |
| `noneReached` | Nobody reached the goal. |
| `bothAboveFloor` | Both players cleared the {floor}-coin floor. |
| `belowFloorLine` | {name}: below the {floor}-coin floor. |
| `potChip` | Pot: {pot} |
| `strikesLeftLabel` | No-deals left: {count} |
| `potShrinksNote` | The pot shrinks to {pot} coins for the rest of the match. |
| `potFloorNote` | The pot stays at {pot} coins. |
| `noDealShrinkSub` | Both players get 0 and the pot shrinks. |
| `strikesGoneNote` | No spare no-deals left. Every remaining deal must be accepted to reach {target}. |
| `goalOutOfReachNote` | The team goal is out of reach this match. |
| `dealsAccepted` | {accepted} of {total} deals were accepted. |
| `dealsRejected` | No-deal rounds: {rejected} of {total}. |
| `averageOffer` | Average offer to the Decider: {value}. |
| `fairZoneCount` | Near-middle offers: {count} of {total}. |
| `gameTheoryIdea` | Game theory idea |
| `formalTerms` | In game theory, the Splitter is the proposer and the Decider is the responder. |
| `debriefClassic` | A deal needs both players. Very low offers can be rejected, so fairness can be part of a winning strategy. |
| `playAgain` | Play again |
| `newMatch` | New match |
| `overlayHint` | Tap anywhere to continue |

### 8.2 Minimum Polish Copy

| Key | Polish |
| --- | --- |
| `title` | Sprawiedliwy Podział |
| `subtitle` | Gra o ofertach i sprawiedliwości |
| `setupTitle` | Podziel pulę. Zawrzyjcie umowę. |
| `setupCopy` | Jedna osoba proponuje podział. Druga przyjmuje go albo mówi: brak umowy. |
| `playerOneName` | Imię gracza 1 |
| `playerTwoName` | Imię gracza 2 |
| `start` | Rozpocznij mecz |
| `modeLabel` | Tryb |
| `modeTeam` | Cel drużynowy |
| `modeCheckpoint` | Punkt kontrolny |
| `modeShrink` | Malejąca pula |
| `modeSummaryTeam` | Uzbierajcie razem {target} monet, a każde z was potrzebuje {floor}. Wyższy wynik zwycięża. |
| `modeSummaryCheckpoint` | Uzbierajcie razem {target} monet. Miejcie {bank} po rundzie {round}, inaczej mecz skończy się wcześniej. |
| `modeSummaryShrink` | Zbierz {goal} monet dla siebie. Każdy brak umowy zmniejsza pulę. |
| `roundOf` | Runda {round} z {total} |
| `splitter` | Osoba dzieląca |
| `decider` | Osoba decydująca |
| `splitsPot` | {name} dzieli {pot} monet |
| `keeps` | {name} zatrzymuje |
| `gets` | {name} dostaje |
| `offerTo` | Oferta dla {name} |
| `giveCoinTo` | Daj monetę graczowi: {name} |
| `sendOffer` | Wyślij ofertę |
| `passTo` | Przekaż do: {name} |
| `decides` | {name} decyduje |
| `acceptSub` | Obie osoby dostają te monety. |
| `acceptDeal` | Przyjmij ofertę |
| `noDeal` | Brak umowy |
| `dealAccepted` | Oferta przyjęta |
| `dealRejected` | Brak umowy |
| `bothZero` | Obie osoby dostają 0 w tej rundzie. |
| `acceptedNote` | Obie osoby się zgodziły, więc obie zachowują punkty. |
| `rejectedLowNote` | Niska oferta może zniknąć, gdy osoba decydująca mówi: brak umowy. |
| `rejectedNeutralNote` | Osoba decydująca chciała innego podziału. |
| `roundPoints` | Punkty w rundzie |
| `totalScore` | Wynik łączny |
| `nextRound` | Następna runda |
| `finalResult` | Wynik końcowy |
| `pointWinner` | Zwycięzca punktowy: {name} |
| `balancedTable` | Równy stół |
| `aloneWin` | Wygrywa tylko {name} |
| `bankLine` | Razem: {sum} / {target} |
| `nobodyWins` | Nikt nie wygrywa |
| `sharedMissed` | Wspólny cel nieosiągnięty — nikt nie wygrywa. |
| `checkpointMissed` | Punkt kontrolny nieosiągnięty — mecz kończy się wcześniej. Nikt nie wygrywa. |
| `bothReached` | Obie osoby osiągnęły cel! |
| `goalReached` | Cel osiągnięty: {name} |
| `noneReached` | Nikt nie osiągnął celu. |
| `bothAboveFloor` | Obie osoby są powyżej progu {floor} monet. |
| `belowFloorLine` | {name}: poniżej progu {floor} monet. |
| `potChip` | Pula: {pot} |
| `strikesLeftLabel` | Zapas braków umowy: {count} |
| `potShrinksNote` | Pula kurczy się do {pot} monet do końca meczu. |
| `potFloorNote` | Pula zostaje na poziomie {pot} monet. |
| `noDealShrinkSub` | Obie osoby dostają 0, a pula się kurczy. |
| `strikesGoneNote` | Zapas braków umowy wyczerpany. Każda kolejna oferta musi zostać przyjęta, aby uzbierać {target}. |
| `goalOutOfReachNote` | Wspólny cel jest już poza zasięgiem w tym meczu. |
| `dealsAccepted` | Przyjęte umowy: {accepted} z {total}. |
| `dealsRejected` | Rundy bez umowy: {rejected} z {total}. |
| `averageOffer` | Średnia oferta dla osoby decydującej: {value}. |
| `fairZoneCount` | Oferty blisko środka: {count} z {total}. |
| `gameTheoryIdea` | Pomysł z teorii gier |
| `formalTerms` | W teorii gier osoba dzieląca to proponujący, a osoba decydująca to odpowiadający. |
| `debriefClassic` | Umowa potrzebuje zgody obu osób. Bardzo niskie oferty mogą zostać odrzucone, więc sprawiedliwość może być częścią dobrej strategii. |
| `playAgain` | Zagraj ponownie |
| `newMatch` | Nowy mecz |
| `overlayHint` | Dotknij, aby kontynuować |

Note on `{pot}` grammar: the pot ranges 5–10, and every value in that range
takes the Polish genitive plural `monet`, so `{pot} monet` is always correct.
A generic `coins` suffix key is deliberately absent — outside the fixed 5–10
range Polish numeral agreement would be a grammar trap.

Tone rules:

- keep sentences short,
- use `coins` / `monety`; never currency symbols or real-money framing,
- use `No deal` / `Brak umowy`, not `punish`,
- avoid `greedy`, `selfish`, `bad offer`, and `wrong choice`,
- use formal terms only in the final debrief or hidden implementation comments.

## 9. State And Engine

Suggested state:

```js
state = {
  lang: "en",
  phase: "setup",
  mode: "team", // "team" | "checkpoint" | "shrink"
  names: ["Player 1", "Player 2"],
  roundIndex: 0,
  pot: 10, // current round pot (shrinks in Shrinking pot mode)
  currentOfferToDecider: 5,
  scores: [0, 0],
  history: [],
  checkpointFailed: false // set true when Checkpoint ends early
};
```

The pot for a round is `potForRound(mode, rejectionsSoFar)` — always 10 except
in Shrinking pot mode, where it is `max(5, 10 − rejectionsSoFar)`. Each round's
start offer is `Math.round(pot / 2)`.

History entry:

```js
{
  round: 1,
  pot: 10,
  splitter: 0,
  decider: 1,
  offerToDecider: 4,
  keptBySplitter: 6,
  accepted: true,
  payoff: [6, 4]
}
```

`payoff` is player-indexed, not role-indexed. For a resolved round:

```js
const payoff = [0, 0];
payoff[splitter] = result.splitterPayoff;
payoff[decider] = result.deciderPayoff;
```

### 9.1 Core Resolver

Use one pure function for scoring:

```js
function resolveUltimatumRound({ pot, offerToDecider, accepted }) {
  if (!Number.isInteger(pot) || pot <= 0) {
    throw new Error("Pot must be a positive integer.");
  }
  if (!Number.isInteger(offerToDecider)) {
    throw new Error("Offer must be an integer.");
  }
  if (offerToDecider < 0 || offerToDecider > pot) {
    throw new Error("Offer must be between 0 and pot.");
  }

  const keptBySplitter = pot - offerToDecider;

  if (!accepted) {
    return {
      keptBySplitter,
      offerToDecider,
      splitterPayoff: 0,
      deciderPayoff: 0
    };
  }

  return {
    keptBySplitter,
    offerToDecider,
    splitterPayoff: keptBySplitter,
    deciderPayoff: offerToDecider
  };
}
```

### 9.2 Summary Helpers

```js
function isFairZone(offerToDecider, pot) {
  return Math.abs(offerToDecider - pot / 2) <= 1;
}

function summarizeMatch(history) {
  const acceptedCount = history.filter((round) => round.accepted).length;
  const offerTotal = history.reduce(
    (sum, round) => sum + round.offerToDecider,
    0
  );

  return {
    acceptedCount,
    rejectedCount: history.length - acceptedCount,
    fairZoneCount: history.filter((round) =>
      isFairZone(round.offerToDecider, round.pot)
    ).length,
    averageOffer: offerTotal / history.length
  };
}
```

Display average offer with one decimal when needed. Because the pot can shrink,
the "of 10" denominator is dropped:

```text
4.4
```

The match verdict comes from one pure function (see 4.7 for `MODES`):

```js
function judgeMatch(mode, scores) {
  if (mode === "shrink") {
    const r1 = scores[0] >= MODES.shrink.goal;
    const r2 = scores[1] >= MODES.shrink.goal;
    if (r1 && r2) return "both";
    if (r1) return "p1";
    if (r2) return "p2";
    return "none";
  }
  if (scores[0] + scores[1] < MODES[mode].target) return "miss";
  if (mode === "team") {
    const a1 = scores[0] >= MODES.team.floor;
    const a2 = scores[1] >= MODES.team.floor;
    if (a1 && !a2) return "p1Only";
    if (!a1 && a2) return "p2Only";
    if (scores[0] > scores[1]) return "bothP1";
    if (scores[1] > scores[0]) return "bothP2";
    return "tie";
  }
  if (scores[0] > scores[1]) return "p1";
  if (scores[1] > scores[0]) return "p2";
  return "tie";
}
```

The Checkpoint early-end is decided by a separate helper, called by the flow
after round 4 (kept out of `judgeMatch` to keep its signature pure):

```js
function checkpointFailed(scores) {
  return scores[0] + scores[1] < MODES.checkpoint.checkpointBank;
}
```

### 9.3 Engine Invariants

The implementation must preserve these invariants:

- `0 <= offerToDecider <= pot`,
- `keptBySplitter + offerToDecider === pot`,
- `pot === potForRound(mode, rejectionsBefore)`, with `5 <= pot <= 10`,
- accepted round payoffs sum to the round's `pot`, rejected to `0`,
- no round can be scored twice,
- scores equal the sum of history payoffs,
- each player is Splitter exactly `4` times and Decider `4` times
  (in a full 8-round match),
- Checkpoint ends early iff the bank is below `30` after round 4,
- a Team-goal bank of `60` forces the higher scorer to `>= 30`, so a passing
  gate always leaves at least one winner above the `20` floor,
- final result appears only after the last reveal (or the checkpoint failure).

## 10. Accessibility Requirements

- All controls must be real `<button type="button">` elements unless they are
  text inputs.
- Name inputs need visible labels.
- Offer controls need an accessible name, such as `Give a coin to Sam`; the
  control group carries `Offer to Sam`.
- The coin row must not be the only way to read the offer.
- Accept and no-deal buttons must include the consequence as visible sub-lines
  inside the buttons.
- Current phase changes should update an `aria-live="polite"` region.
- Focus should move to the main actionable control when phases change:
  - setup -> first name field or start button,
  - Splitter phase -> left give-a-coin button,
  - Decider phase -> `Accept deal` (activation ignored during the ~500 ms
    input guard),
  - reveal -> `Next round`,
  - final -> celebration overlay, then `Play again` on dismissal.
- Do not rely on color alone:
  - accepted uses text + icon + color,
  - no deal uses text + icon + color,
  - selected offer uses text and a visible border.
- Tap targets should be at least `40px`; prefer `44px` for primary controls.
- The app must work at mobile widths around `360px`.
- Buttons and score chips must not resize when values change from one to two
  digits.

## 11. Safe Cuts

These can be dropped without harming the core game:

- round context labels,
- animated coin movement,
- full history list during the match,
- strategy badges,
- confetti,
- sound effects,
- avatars,
- custom icons,
- optional slider.

These must not be dropped:

- name setup,
- bilingual English/Polish support,
- Classic 8-round match,
- role alternation,
- one offer per round,
- Decider accept/no-deal choice,
- visible no-deal consequence,
- rejected deal gives both players `0`,
- individual scoring,
- final debrief explaining the ultimatum bargaining lesson.

## 12. Implementation Notes

When implementation is requested:

- create exactly one self-contained `fairsplit/index.html`,
- use inline CSS and JS,
- include `I18N` with English and Polish,
- add `Fair Split` to `index.md`,
- use canonical URL `https://lepecki.com/learn/fairsplit/`,
- follow the light chassis in `CLAUDE.md`,
- keep the first screen as playable setup, not a marketing landing page,
- do not create sidecar `.css` or `.js` files.

Recommended implementation order:

1. Build static setup and Classic play layout.
2. Implement phase state machine.
3. Implement give-a-coin buttons and the coin-row visualization.
4. Implement resolver, scoring, and history.
5. Add reveal and final summaries.
6. Add Polish translations.
7. Add focus management and live-region announcements.
8. Polish responsive layout and reduced-motion behavior.

Validation command after implementation:

```bash
npm run code-review -- fairsplit/index.html
```

## 13. Manual Test Plan

### 13.1 Classic Rules

1. Start with default names.
2. Verify round 1 has Player 1 as Splitter and Player 2 as Decider.
3. Set offer to `4`.
4. Accept.
5. Verify Player 1 gets `6` and Player 2 gets `4`.
6. Verify round 2 has Player 2 as Splitter and Player 1 as Decider.
7. Set offer to `2`.
8. Choose `No deal`.
9. Verify both players get `0`.
10. Continue to round 8.
11. Verify final scores equal the sum of reveal payoffs.

### 13.1a Modes

Team goal:

1. Start in `Team goal` (default); verify the scoreboard shows a progress bar,
   `Together: 0 / 60`, two strike slots, and `/ 20` floor suffixes.
2. All-fair match (40/40) -> `Point winner` / `Balanced table` with both above
   the floor.
3. Lopsided accepted splits (64/16) -> `Only {name} wins`; the final floor note
   names the player below the floor.
4. Three no-deals (bank 50) -> red overlay `Nobody wins`.

Checkpoint:

1. Pick `Checkpoint`; verify the bar shows a 50% tick.
2. Reject rounds 2 and 3 -> after the round-4 reveal the button reads
   `Final result` and advancing shows a red early-end overlay
   (`Checkpoint missed`), with round dots 5–8 left empty.
3. One first-half no-deal (bank 30 after round 4) -> the match continues.

Shrinking pot:

1. Pick `Shrinking pot`; verify each score shows `/ 25` and a `Pot: 10` chip,
   with no bank line or strikes.
2. Reject round 1 -> reveal note says the pot shrinks to 9; the next splitter
   screen shows `Pot: 9` and a 9-coin row.
3. Two early no-deals (24/24) -> red overlay `Nobody reached the goal.`;
   one crossing the goal -> `Goal reached: {name}`.

All modes: the picker is inert after the match starts; `Play again` keeps the
mode; Player 1 stays on the left and Player 2 on the right across role
alternation; boundary checks (team floor 19/20, checkpoint 29/30, shrink 24/25)
are covered by the engine cross-check.

### 13.2 Boundary Offers

Test all boundary offers:

- offer `0`, accept -> Splitter gets `10`, Decider gets `0`,
- offer `0`, no deal -> both get `0`,
- offer `10`, accept -> Splitter gets `0`, Decider gets `10`,
- offer `10`, no deal -> both get `0`.

### 13.3 Near-Middle Summary

Use offers:

```text
4, 5, 6, 3, 7, 2, 8, 5
```

Verify near-middle count is `4`:

- `4`,
- `5`,
- `6`,
- `5`.

### 13.4 Role Alternation

For Classic:

- rounds `1, 3, 5, 7`: Player 1 Splitter,
- rounds `2, 4, 6, 8`: Player 2 Splitter.

### 13.5 Language

Switch English -> Polish:

- setup labels update,
- role names update,
- accept/no-deal consequence text updates,
- reveal text updates,
- final debrief updates.

Switch Polish -> English during a match:

- state remains unchanged,
- current phase is not reset,
- scores remain unchanged.

### 13.6 Accessibility

Keyboard-only:

- tab through setup,
- start match,
- change offer with buttons,
- send offer,
- accept or choose no deal,
- advance rounds,
- finish match.

Screen-reader sanity:

- offer control announces who receives the offer,
- accept and no-deal buttons are distinguishable,
- reveal result is announced,
- final result is announced.

## 14. Go / No-Go Criteria

The design is ready for implementation if:

- each mode alone teaches the Ultimatum Game,
- each mode gives the Decider a self-interested reason to reject unfair offers,
- no mode lets a leading player lock in victory through rejection alone,
- the no-deal consequence is visible before every Decider action,
- low offers are allowed,
- there is exactly one offer per round,
- no counteroffer exists,
- final debrief explains fairness without moralizing,
- English and Polish copy are short enough for children,
- engine rules can be tested with pure functions.

Do not proceed to implementation if the design drifts into:

- a Prisoner's Dilemma game,
- a negotiation game with counteroffers,
- a casino or money simulator,
- a moral judgment game,
- a single-player puzzle,
- a settings-heavy simulation,
- a lesson page without playable decisions.
