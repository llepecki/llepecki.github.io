# Spec — "The Crossing": dynamic cooperation-under-uncertainty redesign

Status: **built and shipped.** This spec supersedes the shared-target /
threshold approach (design.md Decision 11) for the core game loop. The Phase 0
Monte-Carlo gate passed and the app is live; the sections below remain the
authoritative design reference.

> **Narrative note (2026-07-17).** The player-facing failure story was reframed
> from *the boat sinks* to *the crew runs out of food and starves*. The Store is
> the crew's **food/rations**; the daily weather drain is the crew **eating**
> (storms cost more), not "the sea taking supplies"; Fish = **feed the crew**;
> Dive = the diver eats a ration but brings back no fish, so the Store dips −1.
> This was **copy only** — no mechanic or number changed, and the Monte-Carlo
> gate is unaffected. The internal predicate and i18n keys keep their original
> names (`isSunk`, `sunk`, `sank`, `outcomeSank`, `finalSunkLine`). Throughout
> this doc, read every "sink / sank / drown" as the **`store ≤ 0` failure
> predicate** (the mechanic), not the words shown to players.

## 1. Why this exists

The threshold game is a *known, fixed-length* Prisoner's Dilemma. That is
structurally unfixable by tuning: with a known last round, backward induction
makes "always defect" the rational play (defect on the last round → therefore
the second-to-last → all the way back). Every target number we picked was a
band-aid over that unraveling, and no number both forgives an honest
mutual-betrayal mistake *and* punishes sustained exploitation.

The fix is to change the structure, not the number: an **uncertain end**
(shadow of the future) plus a **changing environment** players read and react
to. This turns the app from a static logic puzzle into a game about
**cooperation under uncertainty** — the durable, real lesson (Axelrod: nice,
retaliatory, forgiving, non-envious strategies win *repeated* games precisely
because the future is uncertain and you meet again).

Owner has greenlit the identity pivot: the app stops being "the Prisoner's
Dilemma" in the textbook sense and becomes a commons / shadow-of-the-future
game.

## 2. Learning goals (the pivot)

A child who plays should be able to say:

- "We never knew which day was the last, so it was smart to keep trusting."
- "Grabbing supplies pays for one day, but a sunk boat pays nobody."
- "In a storm we *had* to work together; on a calm day I could risk grabbing."
- "If my partner kept robbing the stores, I could stop rowing to make them
  stop — but then we both risked drowning."
- "You read the weather and your partner, not a fixed plan."

Retained from the old goals: private cooperate/compete choice, personal score
vs shared outcome, both-defect-is-worst, reputation/retaliation, naming it as
game theory in the debrief.

## 3. Core loop & state model

> **Diegetic choice update (2026-07-17).** The per-round choice is expressed as
> **🎣 Fish** (= cooperate: Store +3, you +1 — feed the shared boat) vs **🤿
> Dive** (= compete: you +3, Store −1 — hunt personal treasure, using up
> supplies while you're down). This is a pure re-theme: the engine, numbers,
> and Monte-Carlo gate are unchanged (the gate re-run reports the identical
> leaderboard). The abstract cooperate/compete skin system (White/Black,
> Goat/Wolf, Dolphin/Shark) was **removed** — Fish/Dive carries the meaning
> and the setup screen lost its style picker. Internally the choice values are
> `"fish"`/`"dive"`; `roundKind` returns `fishBoth`/`diveBoth`/`split`.

Two players share one boat crossing an uncertain sea. Fish to keep it
afloat; dive for personal treasure; nobody knows which day is the last.

```js
state = {
  ...,                    // lang, names, phase machine — reused as-is
  store: 8,              // shared survival resource; ≤ 0 → sink, both lose
  treasure: [0, 0],      // personal score (individual race)
  distance: 0,           // leagues sailed; ≥ HARBOR → arrive
  day: 1,                // round counter (was `round`)
  weather: "calm",      // this day's forecast: calm | rough | storm
  choices: [null, null],// cooperate | compete — private, unchanged privacy model
  history: [ /* per day: weather, choices, storeDelta, sail, treasureDelta */ ]
};
```

Per day:
1. **Forecast** — the day's weather is drawn and shown to *both* before they
   choose (telegraphed; see §7).
2. **Private choice** — each player taps Cooperate or Compete (existing
   private-choice + handoff + reveal machinery, unchanged — §8).
3. **Reveal & resolve** — apply Store and treasure deltas, subtract the
   weather's demand, then the sea advances the boat.
4. **Sink check** — if `store ≤ 0` → the boat is lost, **both lose**, match
   ends (regardless of treasure).
5. **Arrival check** — else if `distance ≥ HARBOR` → land: the survivor with
   more treasure wins; tie → shared win.
6. Otherwise the next day begins.

## 4. Exact numbers (validated by the Phase 0 gate, 2026-07-15)

These constants **passed all six incentive properties** in the Monte-Carlo
gate (§9 — config "D", full results below). They are the confirmed model, not
a guess.

**Choice deltas** (each player, independently):

| Choice | Store | Treasure (you) |
| --- | ---: | ---: |
| Cooperate | +3 | +1 |
| Compete | **−1** | +3 |

Cooperating adds to the shared stores; **competing *raids* them** — you grab
+3 for your own chest and spill/damage 1 from the common pool. That the raid
*damages* the shared stores (not merely fails to add) is the lever that makes
exploitation structurally bleed the boat — it's what makes greed a losing
gamble. A day contributes to the Store: both-cooperate **+6**, split **+2**,
both-compete **−2**, before the sea's demand.

**Weather demand** (subtracted from the Store after contributions):

| Weather | Demand | Both-cooperate net | Split net | Both-compete net |
| --- | ---: | ---: | ---: | ---: |
| ☀️ Calm | −3 | +3 | −1 | −5 |
| 🌊 Rough | −5 | +1 | −3 | −7 |
| ⛈️ Storm | −6 | 0 | −4 | −8 |

Key property, by construction: **mutual cooperation never sinks the boat** —
even an all-storm voyage holds the Store at its start (+6 − 6 = 0). Every
sinking is *caused by a Compete*, never by the weather alone. This is the
fairness spine (§7).

**Store:** starts `S0 = 8`. Sink at `store ≤ 0`.

### Phase 0 result (config D, 4000 seeds/pairing)

All six properties hold. Strategy leaderboard (avg win-payoff across the whole
field; win = 1, shared = 0.5, sink = 0):

| Rank | Strategy | Payoff |
| --- | --- | ---: |
| 1 | greedy-in-calm (cooperate, but steal when Store is flush & calm) | 0.421 |
| 2 | random | 0.400 |
| 3 | tit-for-tat | 0.314 |
| 4 | always-cooperate (pure doormat) | 0.215 |
| 5 | **always-compete (naked greed)** | **0.048** |

Naked greed is dead last; the nuanced state-reader tops the board; the pure
doormat also loses (you get exploited). A pure exploiter against a pure
cooperator survives to win only **11.3%** of the time — greed occasionally
gets lucky ("that's life") but is a clearly losing bet, and far worse against
any retaliating partner. Cooperators never sink; mutual greed drowns 100%.
An alternative config "E" (Store 6, demand 2/4/6) lets greed pay ~28% if a
more greed-forgiving feel is wanted.

**Uncertain end (distance track):**
- `HARBOR = 24` leagues.
- Each day, after the reveal, the sea advances the boat `sail = rng(3..7)`
  leagues (independent of choices — the sea carries you; a "cooperation rows
  faster" variant is noted in §12 as an optional lever).
- Voyage length is therefore **4–8 days**, typically 5–6, and the exact last
  day is never certain more than a big-sail swing ahead.
- **"Land in sight"** flag shows once `distance ≥ 17` (within one large sail of
  harbor): the endgame is telegraphed as *near* without revealing *which* day
  is last — shadow of the future preserved, panic avoided.

**Weather deck:** weighted so calm dominates early and storms rise late,
raising tension as the voyage drags (and reinforcing "don't get greedy near the
end"). Seed weighting, per day index, to be confirmed by the gate:

| Day | Calm | Rough | Storm |
| --- | ---: | ---: | ---: |
| 1–2 | 70% | 25% | 5% |
| 3–4 | 45% | 35% | 20% |
| 5+ | 25% | 40% | 35% |

**Win conditions:**
- `store ≤ 0` at any reveal → **sink, both lose** (treasure irrelevant).
- `distance ≥ HARBOR` with `store > 0` → **arrive**: higher treasure wins;
  equal treasure → shared win.

## 5. Worked voyage (shows the tension is real)

Ala & Ola, `S0 = 8`. (Weather is the forecast shown before each choice.)

| Day | Weather | Ala | Ola | Store after | Treasure A/O | Dist |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 1 | ☀️ Calm −3 | Coop | Coop | 8 + 6 − 3 = **11** | 1 / 1 | 5 |
| 2 | ☀️ Calm −3 | **Compete** | Coop | 11 − 1 + 3 − 3 = **10** | 4 / 2 | 9 |
| 3 | 🌊 Rough −5 | Coop | **Compete** | 10 + 3 − 1 − 5 = **7** | 5 / 5 | 14 |
| 4 | ⛈️ Storm −6 | Coop | Coop | 7 + 6 − 6 = **7** | 6 / 6 | 18 → *land in sight* |
| 5 | ⛈️ Storm −6 | **Compete** | Coop | 7 − 1 + 3 − 6 = **3** | 9 / 7 | 25 → **arrive** |

Ala grabbed on the safe calm day (2) and gambled a grab on the final approach
(5) — arriving with 9 vs 7, a **win**, because the boat stayed healthy. Had Ola
retaliated on day 4's storm (both Compete → 7 − 2 − 6 = **−1**), the boat
**sinks on the spot** and Ala's treasure drowns with it. The
threat of retaliation is what keeps Ala's greed in check — and because day 5's
arrival wasn't guaranteed, Ala's final grab was a real gamble, not a safe
last-round defection.

## 6. Incentive analysis — why greed doesn't dominate

The dilemma moves from a per-round payoff matrix to a **commons under an
uncertain horizon**:

- Competing always pays *you* more *this day* (+3 vs +1) — the temptation is
  intact and, per-round, Compete personally dominates.
- But the Store only trends **up** under mutual cooperation (+2/day avg vs
  −1/day for a lone cooperator bankrolling a competitor). Sustained survival
  *requires* mutual cooperation; a saint cannot indefinitely fund an
  always-competer — the boat trends down and storms finish it.
- So **always-Compete is dominated**: it sinks the boat (both lose) against
  another competer, and against a cooperator it's a race between arrival and
  sinking that storms usually win — a bad gamble in expectation.
- The rational play is **cooperate most days, steal occasionally when the Store
  is flush and the weather calm** — i.e. read the state and your partner. That
  nuanced, dynamic behavior is exactly the lesson.
- **Retaliation has teeth**: a victim stops rowing (Compete), which crashes the
  Store in ~2 days — a credible "keep robbing and we both drown" deterrent that
  an uncertain end makes un-ignorable.

The Phase 0 gate turns these claims into asserted, tuned properties (§9).

## 7. Fairness — telegraphed, not luck

The make-or-break craft rule: **randomness is shown before it bites.**

- The day's **weather is revealed before the choice** — it's a condition to
  respond to, never a surprise punishment.
- **"Land in sight"** flags the approaching end so nobody is blindsided by an
  early arrival; only the exact day stays uncertain.
- **Weather alone never sinks a cooperating boat** (§4) — every sinking traces
  to a Compete, so the lesson stays causal ("we sank because of a choice"),
  never "we lost to the dice." Luck in a kids' game teaches them to blame the
  dice; this design forbids it.
- Deciding under *known odds* (the forecast, the rising storm weighting) is
  itself a worthwhile thing to teach.

## 8. Privacy & accessibility (preserved)

- **Pass-and-play privacy** is unchanged: private choice → pass handoff (ready
  hold) → second private choice → reveal-handoff (auto-reveal). The Store,
  distance, treasure, and history all update **only at reveal**, so nothing
  leaks a hidden current choice — same guarantee as today.
- **a11y**: the weather forecast, Store level, sink, and arrival each announce
  via the existing polite live region; the Store meter and distance gauge get
  `role="progressbar"` with translated labels; tokens stay `aria-hidden`
  decorations with textual choice labels; reduced-motion honored.

## 9. Verification — the Monte-Carlo gate (the centerpiece)

The old check verified arithmetic. A stochastic game needs its *incentives*
verified. `tools/dilemma-rules-check.mjs` is extended:

1. **Seeded RNG in the engine block.** Add `createRng(seed)` (mirroring
   codebreak) so weather draws and daily sail are deterministic per seed. The
   engine block (deck weights, `resolveDay` → Store/treasure/sail deltas, sink
   & arrival predicates) stays inside the `[rules:start]/[rules:end]` markers
   and is extracted via `vm.runInNewContext` as today.

2. **Deterministic unit checks** (no RNG): Store and treasure deltas correct
   for all 4 choice combos × 3 weathers; sink predicate `store ≤ 0`; arrival
   predicate `distance ≥ HARBOR`; mutual-cooperation net ≥ 0 in every weather
   (the "cooperators never sink" invariant).

3. **Strategy round-robin, N ≈ 5000 seeds** each pairing. Strategies:
   `alwaysCooperate`, `alwaysCompete`, `titForTat`, `greedyInCalm`
   (compete only when Store is high and weather calm), `random`.
   Collect per pairing: sink rate, arrival-day distribution, win rate,
   E[treasure], both-lose rate.

4. **Asserted properties** (these tune the constants until they hold):
   - **Termination:** every match ends by day 8 (hard distance cap) — no
     infinite games.
   - **Cooperators never sink:** `alwaysCooperate` vs `alwaysCooperate` sink
     rate == 0.
   - **Mutual greed drowns:** `alwaysCompete` vs `alwaysCompete` sink rate ≈ 1
     (both lose almost always).
   - **Greed is dominated:** `E[alwaysCompete]` (over the round-robin, counting
     both-lose as 0) `< E[titForTat]`.
   - **Exploitation is a bad gamble, not free money:**
     `alwaysCompete` vs `alwaysCooperate` — the competer's expected payoff
     (net of sinks) `<` the mutual-cooperation payoff. You cannot reliably get
     rich robbing a saint.
   - **No degenerate dominance:** `titForTat` and `greedyInCalm` beat *both*
     pure strategies in the round-robin — proving there is no single
     state-independent best move (the property the old fixed game lacked).

5. **Visible tuning:** the gate prints the round-robin table (sink/win/E rates)
   so constant changes are legible. Tuning knobs: `S0`, weather demands, deck
   weights, `HARBOR`, sail range.

This is how we *prove the design works before building the UI* — and it is
Phase 0.

## 10. End-of-voyage reflection & debrief

- **Counterfactuals** recomputed dynamically for the actual weather sequence:
  "If you'd both rowed all voyage" (survive, treasure split evenly), "If you'd
  both grabbed" (sank on day X), "the actual crossing". Same teach-by-contrast
  as the old reflection table, now voyage-specific.
- **Debrief** rewritten to the new lesson: shadow of the future + cooperation
  under uncertainty + save-for-storms. Names it as game theory. Skin-aware,
  EN/PL.

## 11. Theme & skins — RESOLVED (2026-07-17)

The nautical framing (Store = provisions, Sky/distance = the crossing, weather)
is the chrome that makes the randomness read as *fair forecast*. The abstract
choice skins (White/Black, Goat/Wolf, Dolphin/Shark) were **removed** in favour
of a diegetic choice: **🎣 Fish** (cooperate — feed the shared Store) vs **🤿
Dive** (compete — hunt personal treasure, spending supplies). The theme now
carries the mechanic, so no skin picker is needed; the setup screen is just
names + Set sail. Fish card = light sea-green (`--card-fish`), Dive card = deep
navy (`--card-dive`) — the light-calm vs deep-dark contrast keeps Dive reading
as the deeper, riskier, solo choice.

## 12. Build plan (phased — do not build blind)

- **Phase 0 — model only, no UI.** Implement the engine block + the
  Monte-Carlo gate; tune `S0`/demands/deck/sail until every §9 property passes.
  This validates the design mathematically first. *Deliverable: a passing gate
  and a printed round-robin table the owner reviews.*
- **Phase 1 — state & flow.** New state model + phase machine (day, Store,
  distance, weather, sink/arrival). Reuse the existing turn/handoff/reveal/
  privacy machinery verbatim.
- **Phase 2 — board & screens.** Add the Store meter + distance/Sky gauge +
  weather forecast to the board; result screen shows the day's Store delta and
  sink/arrival; final screen new counterfactuals + debrief.
- **Phase 3 — i18n / a11y / motion.** New EN/PL strings (weather, Store, sink,
  arrival, debrief) with skin variants; announcements; reduced-motion.
- **Phase 4 — docs & verification.** Rewrite req.md core rules and design.md
  (new decision + sections); update the hub blurb from "Prisoner's Dilemma" to
  the new framing; full gate + code-review + live Jekyll playtest.

Optional levers to evaluate during Phase 0 (kept out of the base model to limit
cognitive load): cooperation speeds the boat (Compete strands you at sea longer
= extra structural punishment for greed); a third "mutiny" shock card; Store
visible as discrete crates rather than a bar.

## 13. Open questions for the owner

1. **Cognitive load:** three shared displays (Store, Sky, Weather) is near the
   ceiling for an 8-year-old. Acceptable, or cut/merge one? (First cut
   candidate: fold the Sky gauge into a simple "Land in sight!" flag.)
2. **Theme/skins** reconciliation (§11).
3. **Exploiter tolerance:** how hard should greed be punished — should an
   occasional lucky exploiter *ever* win (realistic, teaches that greed
   sometimes pays), or should the gate force E[greed] strictly worst
   (cleaner moral, less realistic)?
4. **Framing:** keep the "Trust Dilemma" title, or rename to match the pivot?
