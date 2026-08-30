# Yes / No Reflex: Requirements And Design Specification

Implemented at `yesnoreflex/index.html`. Validation — all four run from
`learn/`:

```bash
npm run code-review -- yesnoreflex/index.html
npm run yesnoreflex-question-gate
node tools/yesnoreflex-rules-check.mjs
npm run yesnoreflex-dom-check
npm run yesnoreflex-layout-check
```

The rules-check script extracts the `// [rules:start]` … `// [rules:end]`
block from the shipped app and re-verifies the question bank, the cue truth
table, 10,000 generated sessions per level against every section 9
constraint, the deterministic fallback schedules, the session cue profiles
(section 7.5), and the scoring/star/tip math. The dom-check harness drives
the real file in jsdom, and the layout-check harness drives it in the system
Chrome; section 18.1 lists what each covers.

**Revision note (2026-08-16).** Sections 6, 7.4, 7.5, 8, 9, 11, 12, 13, 15,
and 18 describe the unified randomized colored-shape cue system adopted in
the round-3 review (`yesnoreflex/docs/implementation-review-round-3-2026-08-16.md`).
It replaces the earlier fixed blue/gold/triangle/circle vocabulary, the
CLASSIC/DYNAMIC selector, and the semantic question-text colors.

**Revision note (2026-08-22, pair-per-round).** Sections 2.2, 6, 7.2, 7.4,
7.5, 8, 9, 11, 12, 13, 15, and 16 describe the pair-per-round cue system: one
fresh pair per rule block, single-token cues, no conflict mechanic, the
★-only panel reference with the ★★/★★★ memory ramp, the pause mapping card,
and no cue persistence. Recorded in the round-4 review's 2026-08-22 addendum.

**Revision note (2026-08-16, round 4).** Sections 7.2, 9, 9.1, 15, 18, and 20
describe the 240-record, eight-category question bank, the two-tier recency
history, and the revised playful and category schedules adopted in the round-4
review (`yesnoreflex/docs/implementation-review-round-4-2026-08-16.md`), whose
Appendix A is the approved source of truth for question content. It replaces
the earlier 108-record, six-category bank and the flat 32-ID recent list.

Canonical URL: `https://lepecki.com/learn/yesnoreflex/`

Project baseline: `CLAUDE.md` light chassis. Where this specification does
not define a low-level convention, inherit `CLAUDE.md` instead of creating a
new interaction pattern.

This document is the complete implementation handoff for a bilingual,
kid-friendly reflex game that combines easy true/false knowledge with
inhibitory control and rule switching. Section 20 contains the complete v1
question database.

## 0. Handoff Goal

Build a complete app in which a child:

1. reads an easy factual yes/no question,
2. notices a visual signal and the currently active rule,
3. decides whether to answer the fact directly or give the opposite answer,
4. responds before time expires in Sprint mode,
5. receives feedback that separately explains the fact and the signal rule.

The app must be:

- a single self-contained `yesnoreflex/index.html`,
- bilingual in English and Polish through one inline localization model,
- playable with mouse, touch, and keyboard,
- usable in an untimed Practice mode as well as a timed Sprint mode,
- aimed primarily at children aged roughly 7–12,
- based on the exact 240-question database in section 20,
- dependency-free except for the established Google Fonts link,
- honest about its purpose: it gives practice in attention, inhibition, and
  rule switching; it does not claim to diagnose or generally improve a
  child's intelligence or executive function.

## 1. Problem Statement

Many reflex games test only motor speed, while many knowledge games test only
recall. The opportunity is a short game in which the facts remain easy but the
response rule changes, so the interesting action is pausing an automatic
answer, attending to the relevant cue, and switching rules accurately.

The design must avoid a central educational hazard: a child must never leave
with the impression that a cue changes whether a fact is true. The interface
and feedback must always distinguish **fact answer** from **game answer**.

## 2. Research Basis And Design Implications

### 2.1 Sources

- Harvard's Center on the Developing Child recommends progressively
  challenging rule-based activities for children. Its activity guide
  specifically describes opposite-response games, switching sorting rules
  between color and shape, and games that combine monitoring with fast
  responses. Source:
  https://developingchild.harvard.edu/wp-content/uploads/2024/10/Enhancing-and-Practicing-Executive-Function-Skills-with-Children-from-Infancy-to-Adolescence-1.pdf
- The Dimensional Change Card Sort literature uses competing dimensions such
  as color and shape to study cognitive flexibility. A meta-analysis found
  that age, explicit labeling, emphasis on rule conflict, and stimulus
  presentation all affect children's ability to switch. Source:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4778090/
- Reviews of executive-control training in school-aged children describe
  task-switching practice as performing simple decisions under two or more
  cued rule sets and comparing switch with repeat trials. Source:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4019883/
- Developmental task-switching work reports larger switch costs in younger
  children and improved performance when the upcoming task can be prepared.
  Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC2751760/
- Speed and accuracy trade off: stronger time pressure predictably increases
  error rates. The app must therefore put accuracy first, use selectable
  pacing, and avoid rewarding blind speed. Source:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4052662/
- W3C guidance says users should be able to disable or adjust content-imposed
  time limits. Source:
  https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- Evidence for computer-based executive-function training is heterogeneous.
  The app should be presented as focused practice, not a clinical or broad
  transfer intervention. Source:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7726355/

### 2.2 Consequences For This App

- Begin with one round for the whole session, then increase the frequency of
  rule switches (pair-per-round redesign, 2026-08-22).
- Cue meanings are stable **within a round** and are always announced before
  they apply: every round opens on a full-view card naming its pair. Nothing
  is ever remapped secretly.
- Owner decision (2026-08-22): the earlier Stroop-style distractor and its
  congruent/conflict trials are removed. Each round shows only its own pair's
  token, so the trained skills are response inhibition (FLIP), rule switching
  between rounds, working-memory maintenance of the current pair (the ★★/★★★
  panel is hidden), and pace. This narrows the DCCS-style conflict training
  the §2.1 sources describe; the trade was made for clarity and is the first
  thing the child pilot should evaluate.
- Show the new rule and pair on the round card before play so the child can
  prepare.
- Use easy, short questions. Trivia difficulty must not dominate the intended
  inhibition and switching task.
- Let Practice remove the timer entirely and wait for manual advancement.
- Increase complexity steadily but keep every difficulty selectable. Do not
  lock content behind performance.
- Treat response time and accuracy as separate results. Stars depend only on
  accuracy; speed contributes a smaller points bonus.

## 3. Goals And Success Criteria

### 3.1 User Goals

- After the tutorial, at least 90% of observed test users can explain, in
  their own words, the difference between the fact answer and game answer.
- At least 80% of observed users aged 7–12 complete a full Level 1 Sprint
  without adult assistance after the tutorial.
- Median session accuracy in age-appropriate moderated tests should fall
  between 70% and 90%; below that range means the design is too hard, while a
  sustained result above it means the selected level may be too easy.
- At least 90% of inputs in testing register once and on the intended answer;
  double taps or focus errors must not create accidental second answers.
- A keyboard-only user can complete the tutorial, every play mode, pause,
  summary, language switch, and replay flow.

### 3.2 Product/Quality Goals

- All 240 authored questions render correctly in both languages and pass the
  content invariants in section 20.2.
- Every generated session meets its truth, cue, round-pair, rule-switch, and
  response-side balance constraints.
- No normal viewport at 1280×720 or larger needs page-level scrolling; at the
  mobile breakpoint the page may scroll according to the light chassis.
- No timer advances while the tab is hidden, the window has lost focus, or
  the game is paused.
- The standard repository review command passes:
  `npm run code-review -- yesnoreflex/index.html`.

These are launch hypotheses and QA targets, not claims that have already been
measured.

### 3.3 Measurement Method

Do not add production analytics. Evaluate the goals through moderated,
consented usability sessions with children and/or classroom pilots. Use an
observer checklist for tutorial explanation, assistance, completion, and input
errors. Session accuracy and timing may be read from the on-device summary or
the debug-only test harness; do not transmit or retain child identifiers.

## 4. Non-Goals

- No open-ended questions, typed answers, voice recognition, or microphone
  access. They add language and privacy complexity unrelated to the core loop.
- No online accounts, leaderboards, multiplayer, sharing, ads, or behavioral
  analytics. The audience is children and the app does not need a backend.
- No random reversal of Yes and No button positions. Stable motor mappings are
  an accessibility requirement; the challenge must stay cognitive.
- No red-versus-green response rule. It conflicts with common success/error
  semantics and excludes users with common color-vision differences.
- No mid-session remapping. Each game draws one cue mapping, teaches it in
  two untimed warm-up examples, and keeps it fixed until the session ends.
- No lives, score deductions, streak multipliers, loot, coins, daily streaks,
  or forced play. A single error must not destroy a run.
- No claim that the app measures intelligence, identifies ADHD, or provides
  clinical cognitive training.
- No audio requirement in v1. Optional sound can be considered later only if
  the full game remains equally understandable without it.
- No user-authored questions in v1 because factual review, translation, and
  safe wording cannot be guaranteed.

## 5. Target Audience

Primary audience: children aged approximately 7–12 who can read short factual
questions in English or Polish.

Secondary audience: parents and teachers using the app for short individual
or classroom warm-up activities.

Assumptions:

- facts should be familiar to a typical primary-school child,
- reading speed, motor speed, and executive-control development vary widely,
- some users will need an untimed experience,
- the app may be used on a shared touchscreen or school laptop,
- errors are expected and should be explained without shame.

### 5.1 User Stories

- As a child practicing attention, I want every round to tell me clearly which
  rule matters so that I can focus on switching instead of guessing the rules.
- As a child who enjoys a speed challenge, I want short timed sessions and
  immediate feedback so that I can practice being both quick and accurate.
- As a child who needs more reading or response time, I want the complete game
  without a timer so that I can solve the same challenges at my own pace.
- As a first-time player, I want interactive examples of FACT, FLIP, and rule
  switching so that I understand why a fact and the required game answer can
  differ.
- As a Polish- or English-speaking player, I want all questions, rules,
  feedback, and accessibility labels in my language so that language switching
  does not change the puzzle.
- As a keyboard-only player, I want stable shortcuts and focus order so that I
  can finish every flow without a pointer.
- As a parent or teacher, I want the app to use reviewed, easy facts and avoid
  manipulative rewards so that a short session remains educational and calm.

## 6. Core Rule System

### 6.1 One Pair Per Round (revised 2026-08-22, owner redesign)

A session is a sequence of **rounds** (rule blocks). Every round draws its
OWN fresh pair for its active dimension — for example: round 1 star/square
(shapes), round 2 green/blue (colors), round 3 circle/pentagon, round 4
purple/yellow. One token of the pair means `FACT`, the other `FLIP`:

| Round dimension | Cue                    | Meaning                          |
| --------------- | ---------------------- | -------------------------------- |
| Color           | the round's FACT color | `FACT`: give the factual answer  |
| Color           | the round's FLIP color | `FLIP`: give the opposite answer |
| Shape           | the round's FACT shape | `FACT`: give the factual answer  |
| Shape           | the round's FLIP shape | `FLIP`: give the opposite answer |

The cue tile shows ONLY the round's token: color rounds render a rectangular
swatch, shape rounds render the shape in a constant neutral fill. There are
no colored-shape combinations, no inactive distractor, and no
congruent/conflict trials (owner decision 2026-08-22; see §2.2 for the
pedagogy trade).

Every round is announced before it starts: the full-view card
(`NEW GAME!` at session start, `SWITCH!` at every rule change) names the
round's rule and both tokens with their meanings. Rounds alternate dimension:

- `FOLLOW COLOR` / `PATRZ NA KOLOR`, or
- `FOLLOW SHAPE` / `PATRZ NA KSZTAŁT`.

Color identity is never carried by hue alone: the two colors of any round are
drawn through a forbidden-pair matrix that bans exactly the pairs whose
CVD-simulated Lab distance falls below 25 for any dichromacy type
(protan/deutan/tritan audit 2026-08-22 — the banned pairs are green+orange,
yellow+orange, blue+purple; every allowed pair clears dE >= 28 under all
three), and screen-reader cue text names every token. Question text always
uses the normal stimulus color; it never carries a rule meaning.

### 6.2 Round Constraints

Within a session, per dimension: no unordered pair repeats, and consecutive
same-dimension rounds share no token (so a switch back to colors always
brings two colors the child has not just been using). Across sessions nothing
is constrained or persisted — freshness is intrinsic to the per-round draw.

### 6.3 Answer Computation

Cues are stored **semantically** as `"fact"`, `"flip"`, or `null`; exactly one
dimension is non-null per trial, and rendering resolves the role through the
trial's round (block). Use booleans internally:

```js
const invert =
  activeRule === "color" ? colorCue === "flip" : shapeCue === "flip";

const expectedAnswer = invert ? !question.truth : question.truth;
```

Equivalent invariant:

```text
expectedAnswer = question.truth XOR invert
```

Examples:

- Fact is Yes + FACT cue → game answer Yes.
- Fact is Yes + FLIP cue → game answer No.
- Fact is No + FACT cue → game answer No.
- Fact is No + FLIP cue → game answer Yes.

The app must never mutate `question.truth` or describe the flipped game answer
as the truth.

## 7. Modes, Difficulty, And Pace

### 7.1 Mode

Use a two-button segmented control:

- **Practice**: no timer, no points, feedback remains until the child presses
  `Next`, and the complete reasoning chain is visible.
- **Sprint**: timed questions, automatic feedback cadence, points and a final
  summary. Sprint is the default after the tutorial.

Practice is the untimed accessibility-equivalent path, not a reduced content
demo. It supports all three difficulty levels and all 240 questions.

### 7.2 Difficulty

Use the established `★` / `★★` / `★★★` segmented difficulty control with
localized aria-labels.

Difficulty scales on three axes (revised 2026-08-22): how often the rule
switches, whether the current pair stays visible (the ★-only panel, §11.2),
and — independently — Sprint pace.

#### Level 1 — One Round

- 12 questions, one round: a single dimension and a single pair all session.
- The panel keeps the round's 2-line mapping visible during play — the
  learning tier's reference.
- Exactly 6 FACT and 6 FLIP trials; no rule switches.
- Category schedule: one record from every category plus one extra record
  from four randomly chosen categories (revised 2026-08-16 per the round-4
  review §4.2 for the eight-category bank).
- Exactly 2 playful questions, in different categories, never consecutive.
- Purpose: learn inhibition with a visible reference.

#### Level 2 — Rule Switch

- 14 questions across four rounds: dimensions alternate over block lengths
  `3, 4, 3, 4` (randomly rotated), each round with its own fresh pair.
- Exactly 3 rule-switch trials; the panel is hidden during play — the child
  holds each round's pair from its card.
- Exactly 7 FACT and 7 FLIP trials according to the active dimension.
- Category schedule: one record from every category plus one extra record
  from six randomly chosen categories.
- Exactly 3 playful questions, in different categories, never consecutive.
- Purpose: switch rules and remember the pair the card announced.

#### Level 3 — Quick Shift

- 18 questions across nine rounds. The block-length multiset is
  `[1, 1, 2, 2, 2, 2, 2, 3, 3]`; shuffle it before use. This creates exactly
  8 switches and never more than 3 repeats.
- Exactly 9 FACT and 9 FLIP trials according to the active dimension; panel
  hidden during play.
- Category schedule: two records from every category plus one extra record
  from two randomly chosen categories.
- Exactly 4 playful questions, in different categories, never consecutive.
- Purpose: frequent switching with a fresh pair to hold every round.

### 7.3 Sprint Pace

Pace is independent of rule difficulty:

| Pace   | Time after question reveal | Label                |
| ------ | -------------------------: | -------------------- |
| Calm   |                   8,000 ms | `CALM` / `SPOKOJNIE` |
| Steady |                   6,000 ms | `STEADY` / `RÓWNO`   |
| Fast   |                   4,000 ms | `FAST` / `SZYBKO`    |

Default: Steady. Pace selection is hidden/disabled in Practice because the
mode is untimed.

### 7.4 Cue Lead And The Rule-Switch Dialog

In Sprint, each trial begins with a cue-only preparation phase before the
question appears:

- repeat trial: 650 ms,
- switch trial: 1,100 ms,
- first trial: 1,100 ms.

The response timer begins only when the question is revealed and the answer
buttons become enabled. Cue-lead time is never included in response time.
At every cue entry the tile replays a brief pop (`cuePop`, 0.25s), because
within a round consecutive trials can carry the identical token and a static
lead read as a freeze (owner feedback 2026-08-22); reduced motion omits it.

In Practice, render the cue, question, and answers together.

**Switch dialog** (revised 2026-08-16 per the round-3 review R3-5 — the
earlier inline `SWITCH!` badge was too easy to miss for a task whose central
skill is switching). Every session start AND every scored trial with
`isSwitch === true` enters a dedicated `switch` phase before its cue lead or
Practice reveal:

- a full-viewport, neutral, high-contrast dialog — the same primitive family
  as the result celebration, deliberately distinct from its green/blue/amber
  tiers, and with no celebration emoji;
- the mapping card is the dialog's focal content: 40px shape/colour tokens
  and 22px mono names, sized so a child reads the new meanings at a glance
  (amended 2026-08-17);
- contents, four blocks and no more (amended 2026-08-17 per owner feedback —
  the earlier build boxed the rule in a bordered pill, repeated it as a
  `Follow color until the next switch.` sentence, and put the key hint on its
  own line, which is three ways of saying what the heading and the button
  already say): localized `SWITCH!` / `ZMIANA!`; the new `FOLLOW COLOR` /
  `FOLLOW SHAPE` directly beneath it as plain accent type; both tokens of the
  newly active dimension with their localized names and explicit
  `FACT`/`FLIP` meanings; one `Continue` button carrying its `ENTER / SPACE`
  key hint the way the Yes/No controls carry theirs;
- every clock is cancelled or left unarmed: switch time is never response
  time, and score cannot change while it is open;
- the application behind it is inert and focus is trapped inside it;
- Continue is focused on open and one polite announcement carries the
  heading, the active rule, and both mappings;
- it is dismissed only by the Continue button, Enter, or Space, and the
  dismissal event is consumed so it cannot answer the next trial; auto-dismiss,
  backdrop clicks, `Y`/`N`, arrows, Pause, and Escape are all rejected;
- a keyup may dismiss the dialog **only if this dialog instance saw the
  matching keydown** (added 2026-08-21). A `<button>` activates on Enter
  keydown, so the keystroke that opens a card is still down when the card's
  listeners are installed; without the latch that same keystroke's keyup
  closed the card instantly. The result celebration carries the identical
  latch for the Enter that ends a Practice session. This is browser-native
  behaviour that jsdom does not reproduce, so it is covered in the real-Chrome
  harness only;
- on dismissal, inert state is removed, focus moves into the play stage (the
  HUD row) with `preventScroll`, and the pending trial begins exactly once.

**Opening card (added 2026-08-21 per owner request).** The same dialog opens
every session, before the first warm-up, so the freshly drawn meanings are
read rather than inferred from the warm-ups. It is identical in every respect
except its heading, which is `NEW GAME!` / `NOWA GRA!` rather than
`SWITCH!` / `ZMIANA!` — nothing has switched when the game begins. It names
the rule the warm-ups and the first scored trial use (`trials[0].activeRule`),
so entering scored play is never an unannounced change. Level 1 never
switches, so this is its only card. `Play again` opens a new one for the new
session's mapping.

Counts per session: **one** opening card always, plus zero scored rule
switches at Level 1, exactly three at Level 2, and exactly eight at Level 3.
Warm-up examples never get a switch card of their own. Under reduced motion
the dialog appears without fade/pop animation.

### 7.5 Round Pairs (revised 2026-08-22, owner redesign)

There is no cue-system selector and no session-wide profile. Session
generation derives the round skeleton from the rule blocks and gives every
round its own pair:

- **Pools.** Colors `yellow`, `green`, `blue`, `purple`, `orange` with the
  CVD-audited forbidden-pair matrix (`green+orange`, `yellow+orange`,
  `blue+purple` — see §6.1); shapes `circle`, `triangle`, `square`,
  `pentagon`, `star`. Every shape keeps a dark outline.
- **Assignment.** Within each round's pair, one token becomes `FACT` and the
  other `FLIP`, at random (the deterministic fallback schedule uses
  `fact = first token`).
- **Constraints** (§6.2): per dimension, no unordered pair repeats within the
  session, and consecutive same-dimension rounds are token-disjoint.
- **Generation.** Random candidate-filtered sampling first (never dead-ends
  on the shipped pools — proven by exhaustive search; mean attempts 1.000).
  If sampling fails, a stable-order BACKTRACKING search runs at escalating
  relaxation levels: strict → consecutive-disjoint relaxed to
  merely-different-pair → pair reuse permitted (never the immediately
  previous same-dimension pair). The relaxation ladder only exists for
  hypothetical future forbidden-matrix changes; on the shipped pools the
  strict level always succeeds, and the harness asserts `relaxLevel === 0`
  across seeded batches while adversarial injected pools exercise the ladder.
- **The block table.** `generateSession` returns `blocks[]` alongside the
  trials: each frozen block is `{dim, start, length, colors|shapes:
{fact, flip}}` with the inactive dimension `null`. Every renderer (cue
  tile, panel key, round card, pause card, SR text) resolves roles through
  `blocks[trial.blockIndex]` — one structure, no divergence.
- **No persistence.** Nothing about cues is stored across sessions. The
  retired `yesnoreflexProfileV1`/`yesnoreflexProfileV2` keys are ignored and
  never written; whatever they contain cannot block play.

#### Warm-Up (every session)

Every session runs two unscored, untimed warm-up examples before scored play:

1. a `FACT` example,
2. a `FLIP` example,

both on round 1's dimension and pair (`blockIndex: 0`), so the transition
into scored play is never an unannounced change. Warm-ups never touch
results, score, or bests; they ARE played, so their question IDs join the
completed session's recency record (§9.1). They are always advanced by an
explicit `Next`, and a wrong response shows the full reasoning chain and
retries the same example.

## 8. Core Game Loop And Phase Machine

### 8.1 Phases

```text
intro -> setup
setup --Start--> 2 untimed warm-ups --> scored play
scored trial --isSwitch--> switch --Continue/Enter/Space--> cue/question
scored trial --repeat--> cue (Sprint) / question (Practice)
cue --lead elapsed--> question
question --answer or timeout--> feedback
feedback --hold elapsed--> cue/question             (Sprint, rounds remain)
feedback --Next--> cue/question                      (Practice, rounds remain)
feedback --hold/Next--> summary                      (last round)
summary --Play again--> cue/question                 (same settings, new session)
summary --Change settings--> setup
question/cue --Pause/Escape/visibility loss--> paused
paused --Resume--> 3-2-1 count-in --> previous phase
```

Use one `setPhase()` function to control visibility, focus, announcements, and
timer ownership. Native `hidden` attributes are the only visibility mechanism.

### 8.2 One Trial

1. On a switch trial, block on the full-viewport round card (section 7.4)
   with every clock unarmed.
2. Render the cue tile (the round's swatch or neutral shape). There is no
   on-stage rule badge — the card and, at ★, the panel key carry the rule
   (F34 correction 2026-08-22).
3. In Sprint, wait for the cue-lead duration.
4. Render the question and enable stable Yes/No controls.
5. Start timing from `performance.now()`.
6. Accept the first valid pointer or keyboard answer only; disable both answer
   controls synchronously before any feedback work.
7. If time reaches zero first, record a timeout with `selectedAnswer = null`.
8. Stop the timer and compute correctness.
9. Show feedback that states fact answer, active cue meaning, and game answer.
10. Continue according to the current mode.

No response is interpreted as No. A timeout is its own result.

### 8.3 Feedback

Feedback uses this exact conceptual template:

```text
The fact is YES. This signal says FLIP. The game answer is NO.
Fakt: TAK. Ten sygnał mówi ODWRÓĆ. Odpowiedź w grze: NIE.
```

Also show the question's authored fact sentence from section 20. Tone:

- correct: `Correct — good signal reading.` / `Dobrze — sygnał odczytany.`
- incorrect: `Not this time — follow the rule step by step.` /
  `Tym razem nie — przejdź po kolei przez regułę.`
- timeout: `Time is up — here is how it works.` /
  `Czas minął — zobacz, jak to działa.`

Do not say the child “did not know the fact,” because the response does not
prove why the error happened. Do not use sarcastic, punitive, or escalating
failure text.

Sprint feedback duration:

- correct: 900 ms,
- incorrect or timeout: 1,600 ms.

Practice feedback waits for a manual `Next` press. (Amended 2026-08-16 per
the round-2 review R2-1: the earlier persistent `Last round` panel section is
removed — the full reasoning chain and authored fact live in the stage's
feedback zone, and the panel stays minimal during play.)

## 9. Session Generation

Generate the whole session before the first trial. Store each final trial as:

```js
{
  (questionId,
    activeRule, // "color" | "shape"
    colorCue, // "fact" | "flip" | null — exactly one dimension non-null
    shapeCue, // "fact" | "flip" | null — exactly one dimension non-null
    invert,
    expectedAnswer,
    isSwitch,
    blockIndex); // index into the session's blocks[] (round table)
}
```

Generation constraints, all P0:

- no repeated question in one session,
- truth values differ by at most one; with current even round counts they are
  exactly balanced,
- categories differ by at most one and the same category never appears on
  consecutive trials,
- active FACT/FLIP trials meet the exact level quota,
- expected Yes/No answers are as balanced as parity allows: exactly 6/6 at
  Level 1; at Levels 2–3 the exact truth balance and exact FACT/FLIP quotas
  force the expected-Yes count to be even, so the closest achievable splits
  are 8/6 (Level 2) and 10/8 (Level 3), with the leading side randomized per
  session (amended 2026-08-15: the original "differ by at most one" is
  mathematically unsatisfiable at Levels 2–3 given the other two exact
  constraints),
- no more than 3 identical expected answers in a row,
- level-specific switch quotas are exact,
- a switch trial is trial `i > 0` where `activeRule[i] !== activeRule[i - 1]`,
- `blockIndex` starts at 0, increments exactly at switch trials, and every
  trial's `activeRule` equals its block's `dim`; the block table satisfies
  §6.2's pair constraints,
- playful-question quotas are exact (revised 2026-08-16 per the round-4
  review §4.1): exactly 2 playful trials at Level 1, 3 at Level 2, and 4 at
  Level 3; playful trials sit in DIFFERENT categories and are never
  consecutive; their truth values, active rule, FACT/FLIP action, and expected
  answer follow the ordinary balancing rules; the `tone` field affects question
  selection only — never scoring, feedback, timing, or cue generation. Playful
  slots are chosen before standard slots and only where an unused,
  non-hard-excluded playful record exists, so the quota can never force a
  repeat while another category could satisfy it (each category owns six
  playful records, three true and three false).

Use constrained shuffle plus validation. Allow up to 200 generation attempts;
if all fail, use a deterministic known-valid fallback schedule and shuffled
questions. Never start a session whose invariants fail.

Recommended construction order:

1. Build the active-rule blocks from the selected level.
2. Create an exactly balanced FACT/FLIP sequence and assign it to active-rule
   slots.
3. Build a category sequence with balanced counts and no adjacent duplicate.
4. Select an exactly balanced truth sequence, pair questions to its slots, and
   compute expected answers.
5. Reject or locally swap truth-compatible question slots until expected
   Yes/No balance and the maximum response run both pass.
6. Materialize immutable trial objects, draw the round pairs (§7.5), validate
   all invariants including the block table, then begin.

Do not generate a cue after showing its question; the entire schedule must be
fixed before play so timing and outcome cannot influence later trials.

### 9.1 Recency History (revised 2026-08-16 per the round-4 review §4.3)

Maintain a versioned two-tier history under `yesnoreflexRecentV2`:

```json
{
  "version": 2,
  "sessions": [
    ["ani01", "bod03", "spa11"],
    ["foo07", "day13", "nat05"]
  ],
  "older": ["sci08", "mat21"]
}
```

- `sessions` holds at most the four most recent completed sessions, newest
  first; every ID in them is **hard-excluded** from the next session.
- `older` holds up to 96 additional unique IDs as a **soft-avoid** list;
  prefer an ID outside it, use one only when an invariant needs it.
- Selection ranks each candidate bucket unseen → soft-avoided. Hard-excluded
  records are **absent from the bucket**, not ranked last (corrected
  2026-08-21: ranking them last meant an exhausted bucket silently handed one
  back with `usedFallback === false`, violating the four-session guarantee).
  An exhausted bucket fails the attempt, and generation rebuilds the
  category/truth schedule to route around it. Before a schedule is returned,
  every selected ID is re-checked against the normalized hard window.
- Warm-up questions are chosen by the same ranked selection
  (`selectWarmupQuestions`, shared with the harnesses), because they are
  played and are stored in history. It carries its own explicit last resort
  (F25, documented 2026-08-22): if a corrupted history hard-excludes so much
  of the bank that fewer than two eligible warm-up questions remain, it
  relaxes to hard-excluded records rather than leave the player without
  examples — covered by the impossible-history test.
- For SCORED questions, relaxation exists only on one explicit last-resort
  path: after the bounded
  attempts fail, the deterministic fallback schedule may reuse hard-excluded
  records rather than leave the player with no session. It is the only caller
  permitted to do so, it sets `usedFallback`, and it is covered by a test that
  hard-excludes the entire bank.
- Malformed data, unknown IDs, duplicates, non-string values, and every legacy
  recency key are ignored without throwing.
- History is persisted **only when a session completes**, and the stored array
  contains every played ID including the two warm-up examples. An abandoned
  session never consumes the hard-exclusion window. Any simulation of this
  rule must store warm-ups too: storing only the scored questions under-fills
  the window and hides bucket exhaustion (the 2026-08-21 defect went unseen
  for exactly this reason).
- If a legal schedule cannot be built inside the hard window, retry schedule
  construction across compatible categories and truth values before relaxing
  anything.

Storage failure must not prevent play.

For reproducible QA, `?debug=1&seed=<integer>` may replace random selection
with a seeded PRNG and expose the generated schedule in a debug-only panel.
The debug DOM must not exist without `?debug=1`.

## 10. Scoring And Summary

### 10.1 Sprint Points

Accuracy is primary. Each correct trial earns:

```js
const speedFraction = clamp(remainingMs / limitMs, 0, 1);
const points = 100 + Math.floor(50 * speedFraction);
```

Incorrect answers and timeouts earn 0 points. There are no deductions and no
streak multiplier. Practice has no points.

### 10.2 Stars

Stars depend only on accuracy:

- 3 stars: at least 90%,
- 2 stars: at least 75%,
- 1 star: below 75% after completing the session.

Never show 0 stars for a completed session.

### 10.3 Summary Content

The summary stage shows:

- large 1–3 star result,
- correct count and total,
- accuracy percentage,
- Sprint score and previous best for the exact difficulty/pace pair,
- median response time over correct, non-timeout trials,
- FACT-trial accuracy,
- FLIP-trial accuracy,
- switch-trial accuracy for Levels 2–3,
- one short adaptive tip based on the weakest category of trial,
- `Play again` primary action and `Change settings` secondary action.

Adaptive tip rules:

1. if fact/straight accuracy is lowest: `Read the fact first, then check the signal.`
2. if FLIP accuracy is at least 15 percentage points below FACT accuracy:
   `On FLIP, say the fact in your head, then choose the other answer.`
3. if switch accuracy is at least 15 points below repeat accuracy:
   `When SWITCH appears, name the new rule before reading the question.`
4. otherwise: `Keep accuracy first; speed will follow with practice.`

Use localized equivalents. Do not make clinical interpretations.

## 11. Visual And Interaction Design

### 11.1 Direction

Use the `CLAUDE.md` light chassis. The visual concept is a clean, playful
signal console on a pale desk: large cue tile, one short question, two large
answers, minimal decoration.

Append the five cue-color fills after the standard light palette, as
`.fill-*` classes shared by the cue tile, the rule-key chips, the round card,
and the pause card (F42 correction 2026-08-22 — the in-stage legend no longer
exists):

```css
.fill-yellow {
  fill: #fbc02d;
}
.fill-green {
  fill: #2e7d32;
}
.fill-blue {
  fill: #1e88e5;
}
.fill-purple {
  fill: #8e24aa;
}
.fill-orange {
  fill: #ef6c00;
}
```

Every cue shape keeps a dark outline, and a Level-1 shape session uses a
constant neutral fill. Do not use session colors for correct/incorrect
feedback. Feedback uses the standard semantic palette.

Header:

- icon: `⚡` (`&#x26A1;`) linking to `/learn/`,
- English title: `Yes / No Reflex`,
- Polish title: `Refleks Tak / Nie`,
- English subtitle: `Read the fact. Follow the signal. Answer fast.`,
- Polish subtitle: `Przeczytaj fakt. Odczytaj sygnał. Odpowiedz szybko.`,
- language button is the only right-side header action.

### 11.2 Desktop Layout

Use a DOM stage, not canvas:

```text
+--------------------------------------------------+ +----------------------+
| Q 4 / 14                          620 pts       | | Rule key             |
| [================ timer ================       ] | | Color                |
|                                                  | |  [chip] green  FACT  |
|                 [ cue tile ]                     | |  [chip] purple FLIP  |
|                  green  (tag)                    | | Shape                |
|          Do birds have feathers?                 | |  [tri] triangle FACT |
|                                                  | |  [sq]  square   FLIP |
|        [ YES / TAK ]   [ NO / NIE ]              | +----------------------+
|                                                  | | Session              |
|            stable feedback zone                  | | mode / level / pace  |
+--------------------------------------------------+ +----------------------+
```

Stage requirements:

- top HUD is one compact row with question count and score. It carries NO
  active-rule badge (amended 2026-08-17 per owner feedback): the switch dialog
  announces every rule change and the child is meant to hold the rule in mind;
  a permanent on-stage reminder removes exactly the rule-maintenance load the
  game trains. The panel rule key marks the active dimension with an accent
  rail for reference;
- timer bar sits directly below the HUD and has a stable layout;
- playfield is centered in the remaining stage area, max width `720px`;
- cue tile is `136×136px` desktop and `104×104px` mobile;
- shape is visually dominant inside the tile;
- question text is Outfit 34px desktop, 27px mobile, maximum two lines
  (corrected 2026-08-22 to the shipped scale — F44);
- answer controls are side by side, fixed order **Yes left / No right**;
- each answer target is at least `160×64px` desktop and `44px` high mobile;
- reserve feedback height so messages do not shift the answers. The reserve
  is measured, not guessed (amended 2026-08-17): it exceeds the tallest
  feedback the 240-record bank can render in either language at 320px, with a
  larger reserve in Practice because the `Next` control sits inside the zone.
  The `Pause` control keeps its box when hidden (`visibility: hidden`, never
  `display: none`) for the same reason — it leaves the HUD row on every
  feedback phase, and removing its box resized everything below it. A
  permanent real-Chrome check asserts the HUD, cue, question and both answers
  hold their document positions across an answer in both modes;
- no decorative motion behind the question.

Panel behavior (amended 2026-08-16 per the round-2 review R2-1 — the panel
is phase-specific, never a permanent dashboard):

- **Setup and summary:** `Session` controls (Practice/Sprint, difficulty,
  pace when applicable, primary Start) plus the collapsed `How to play` help
  with keyboard reference and tutorial replay. There is no cue-system
  selector.
- **Play and tutorial:** the `Rule key` only, showing the session's generated
  mapping and highlighting the active dimension. On Level 1 it shows only the
  session's single dimension. All configuration controls leave both the visual
  field and the keyboard focus order.
- Progress (question counter and score) lives only in the stage HUD.
- The stage feedback zone carries the reasoning chain and authored fact; there
  is no separate panel copy.

Settings remain disabled while a session or the tutorial is active. `Pause`
is a compact labeled action inside the stage HUD row (amended 2026-08-16 per
R2-5). Panel button typography follows the light chassis exactly (amended
2026-08-16 per the round-3 review R3-6): `.seg-btn` 13px / 44px minimum
height, `.seg-btn.star-btn` 15px, `.action-btn` 13px / 48px minimum height.
Panel type is chrome; gameplay type (question, answers, feedback, tutorial
prose, switch-dialog mappings, overlay Continue) keeps the child-facing scale
and its 48px+ targets.

### 11.3 Setup And Summary

On setup, the stage shows the sentence
`The fact stays true. The signal changes the game answer.` and one short
explanation of the game — not a cue reference table. (Revised 2026-08-16 per
the round-3 review §3.4 and owner feedback that the earlier four-combination
matrix, and then the two competing CLASSIC/DYNAMIC previews, read as
difficult.) The explanation is exactly three teaching points:

1. every game draws new colors and shapes,
2. two untimed examples teach the new mapping first,
3. on `★★` and `★★★` the game may switch which one counts.

Below them sits one worked example: the unambiguous question
`Does the Sun shine?` / `Czy Słońce świeci?` in the normal text color beside a
representative colored shape and `= one round`. The setup tokens are
illustrative only and carry no permanent meaning. The primary Start button
remains in the first actionable panel section.

The final result uses the established full-screen result overlay only for the
brief star celebration. It must dismiss by click, Escape, Enter, or Space and
reveal the full in-stage summary underneath. Under reduced motion it appears
without fade/pop animation.

### 11.4 Mobile

Use one light-chassis breakpoint at `max-width: 720px`.

- stage appears before panel,
- stage minimum height `520px` and height `calc(100svh - 46px)`, capped only
  where necessary to prevent content clipping,
- HUD may wrap into two rows,
- answer buttons stay side by side down to 360px viewport width,
- page scrolling is allowed; no internal horizontal scroll,
- starting a session realigns the viewport (added 2026-08-16 per the round-3
  review R3-1): one `alignPlayViewport()` helper runs on `requestAnimationFrame`
  from the shared `startSession()` path — covering Start, Play again, and
  tutorial start — and at the mobile breakpoint calls
  `hudRow.scrollIntoView({ block: "start", behavior: "auto" })`. Immediately
  after Start at 360×640 the HUD row, the cue, the question, and both answers
  are inside the viewport. Scrolling is never
  smooth, reduced-motion behavior is identical, and focus never stays on the
  hidden setup Start button,
- the stage carries no legend and no color-name tag (removed 2026-08-17 per
  owner feedback: the legend repeated the panel verbatim and both crowded the
  space between the cue and the question). During a trial the stage shows the
  cue, the question and the answers only; the mapping lives in the panel rule
  key,
- support pointer events and `touch-action: manipulation` on all buttons.

## 12. Tutorial And Onboarding

Auto-open a five-step tutorial on first visit using
`yesnoreflexIntroSeenV1` in try/catch. It is not a modal overlay. It remains
available from `How to play`. (Amended 2026-08-16 per the round-2 review
R2-2/R2-7: the tutorial lives in the stage, not the side panel — the step
title and instruction render above the cue, the Yes/No controls stay in their
final game positions, and the labeled `Previous`/`Next`/`Start Sprint`
controls (≥44px targets) sit directly below the answer row beside the step
counter. Step changes focus the step heading and announce one coherent
description: title, instruction, active rule, cue meaning, and question.)

Steps:

1. **Answer the fact** — untimed plain question, no cue. Teach that the fact
   has its own Yes/No answer.
2. **Every round has a pair** — show the demo color pair with its names and
   `FACT`/`FLIP` meanings under `FOLLOW COLOR`.
3. **Shape rounds work the same** — show the demo shape pair with its names
   and `FACT`/`FLIP` meanings under `FOLLOW SHAPE`.
4. **Try a FLIP answer** — a color round whose visible color means `FLIP`;
   the child finds the true answer, then presses the opposite one.
5. **Every round starts with a card** — open the real round card
   (section 7.4) with the demo shape pair, then let the child try one final
   example under the new rule before `Start Sprint`.

Shipped step titles must match this list verbatim in both languages
(F47 correction 2026-08-22). The tutorial draws one demonstration color pair
and one demonstration shape pair when it opens or is replayed and uses them
for every step; nothing is persisted, and the Polish copy addresses the child
gender-neutrally (F2).

Tutorial examples may reuse database questions but do not update recency,
scores, or bests. Each interactive step waits for the correct response; a
wrong response reveals the reasoning and lets the child retry without a
failure animation.

Escape exits the tutorial. ArrowLeft/ArrowRight navigate non-interactive
steps. Interactive answer steps reserve those arrows for Yes/No; their panel
navigation uses explicit Prev/Next buttons.

## 13. Accessibility

- Color is never the only carrier of meaning: the forbidden-pair matrix
  excludes CVD-risky color pairs, the session's two shapes always differ, and
  the panel rule key names both tokens in words beside their swatches. The
  screen-reader cue description names the shape AND the color on every trial
  (`purple square — FACT`), which is the assistive equivalent of the removed
  on-stage color label. The active dimension is stated by the switch dialog in
  words and marked on the panel rule key; it is never repeated as a permanent
  stage badge.
- Yes and No button positions never move and never depend on color.
- Practice provides the complete game with no time limit.
- Sprint has a labeled pause action. Pause hides the cue and question behind
  a neutral in-stage curtain so pause does not become extra solving time. The
  curtain DOES show the current round's mapping card, and the pause
  announcement names it (owner request 2026-08-22): with the ★★/★★★ panel
  hidden, Pause is the deliberate "I forgot the pair" recovery, priced at the
  3-2-1 resume count-in.
- Losing focus or receiving `visibilitychange` pauses immediately. Resume
  uses a visible `3, 2, 1` count-in, then rebases timer anchors.
- Use `requestAnimationFrame` and `performance.now()` for the timer; never
  decrement state with `setInterval`.
- Timer bar uses `role="progressbar"`; its numeric label is not an assertive
  live region and must not announce every frame.
- One polite live region announces the active rule, question, answer result,
  timeout, pause, and summary. Do not announce decorative cue details twice.
- Answer buttons have complete localized accessible names such as
  `Answer Yes` / `Odpowiedz Tak`.
- Keyboard during a question (amended 2026-08-16 per the round-2 review
  R2-3 — the physical reflex keys never change with language):
  - ArrowLeft = Yes, ArrowRight = No in both languages,
  - `Y` = Yes and `N` = No in every language; Polish additionally accepts
    `T` = Tak,
  - Space = explicit `Next` during Practice feedback, warm-up feedback, and
    eligible tutorial steps (single-press, repeat-guarded),
  - `P` or Escape = pause in Sprint,
  - Enter/Space activates focused controls normally,
  - compact key hints are shown on the Yes/No/Next controls themselves.
- Do not bind bare arrow shortcuts while focus is inside any segmented
  setting control.
- All controls have visible `:focus-visible` styles and minimum 44px touch
  targets where repeatedly tapped.
- Implement both CSS and JS reduced-motion gates from `CLAUDE.md`. Disable
  cue pops, timer pulses, result animation, and decorative transitions.
- At 200% zoom and 360px CSS width, no question, answer, or active rule is
  clipped.
- Facts and questions are text in the DOM, never text drawn on canvas.

## 14. Localization And Copy Model

Use one `I18N` object for interface strings and the per-question bilingual
fields in `QUESTIONS`. `applyTranslations()` must update:

- document title and `<html lang>`,
- header title/subtitle,
- controls, help, feedback, tips, and summary,
- aria-labels and titles,
- the currently visible question and fact,
- live-region phrasing,
- the displayed rule key without changing game state or restarting timers.

Language initializes from `navigator.language` exactly as in `CLAUDE.md`.
Switching language during an active question keeps the same question, cue,
phase, response time, and expected answer. It must not reset the timer.

Required semantic labels:

| Key         | English      | Polish           |
| ----------- | ------------ | ---------------- |
| fact        | FACT         | FAKT             |
| flip        | FLIP         | ODWRÓĆ           |
| followColor | FOLLOW COLOR | PATRZ NA KOLOR   |
| followShape | FOLLOW SHAPE | PATRZ NA KSZTAŁT |
| switch      | SWITCH!      | ZMIANA!          |
| yes         | YES          | TAK              |
| no          | NO           | NIE              |
| practice    | PRACTICE     | TRENING          |
| sprint      | SPRINT       | SPRINT           |

Avoid translating `FLIP` as a negation of the fact. `ODWRÓĆ` communicates an
instruction to reverse the response.

## 15. State And Technical Architecture

### 15.1 State

```js
const state = {
  lang: "en",
  reduceMotion: false,
  // intro|setup|switch|cue|question|feedback|paused|summary
  phase: "intro",
  resumePhase: null,
  mode: "sprint", // practice|sprint
  level: 1, // 1|2|3
  pace: "steady", // calm|steady|fast
  blocks: null, // frozen round table for the running session (§7.5)
  tutorialProfile: null, // frozen demo pairs, never persisted
  inWarmup: false,
  warmupIndex: 0,
  warmupTrials: [], // two unscored, untimed examples
  warmupRetry: false,
  trials: [],
  trialIndex: 0,
  selectedAnswer: null,
  results: [], // one immutable result per completed trial
  score: 0,
  timer: {
    limitMs: 6000,
    startedAt: 0,
    pausedAt: 0,
    pausedTotalMs: 0,
    remainingMs: 6000,
    rafId: 0,
  },
};
```

Each result stores:

```js
{
  (questionId,
    selectedAnswer, // true|false|null
    expectedAnswer,
    correct,
    timeout,
    responseMs, // null on timeout if preferred, otherwise limitMs
    points,
    activeRule,
    invert,
    isSwitch);
}
```

### 15.2 Architecture

- One inline `<style>` and one inline script wrapped in
  `(function () { "use strict"; ... })();`.
- One DOM stage plus the standard light `.panel`; no canvas and no external
  JavaScript.
- Banner-comment code sections: constants/data, state, storage, session
  generation, phase/timer, rendering, localization, events, initialization.
- DOM references are cached once. Rendering functions set `textContent`,
  attributes, and classes; never use `innerHTML`.
- Use event listeners only, no inline handlers.
- Build result overlay nodes with `createElement`/`textContent` or keep a
  static hidden overlay.
- Timer callback checks `state.phase === "question"` and a monotonically
  increasing trial token before mutating state. Stale callbacks must be inert.
- Cue leads, feedback holds, and resume count-ins use the same
  `performance.now()`-based, pause-aware deadline model. Do not use naked
  `setTimeout` callbacks that can advance a hidden or paused game.
- `submitAnswer()` is guarded so only the first answer for a trial can create
  a result.
- Storage keys, all guarded with try/catch:
  - `yesnoreflexIntroSeenV1`,
  - `yesnoreflexPrefsV1` (mode, level, pace — no cue-system member),
  - `yesnoreflexBestV1`,
  - `yesnoreflexRecentV2` (section 9.1; `…RecentV1` is ignored, never
    migrated, never written),
  - `yesnoreflexProfileV2` (section 7.5; `…ProfileV1` is ignored, never
    migrated, never written).
- Every stored value crosses a structural validation boundary before it is
  used. Corrupt, foreign-shaped, or unavailable storage can never block play.
- Best-score key is the tuple `<level>:<pace>`; Practice has no best score.
- Changing stored schema requires a versioned key, not in-place assumptions.

### 15.3 Head And Repository Integration

Follow `CLAUDE.md` head order exactly. Required metadata includes:

- review comment: `npm run code-review -- yesnoreflex/index.html`,
- author `Łukasz Łepecki`,
- canonical and `og:url`
  `https://lepecki.com/learn/yesnoreflex/`,
- full required Open Graph and Twitter summary metadata,
- exactly the established Outfit + JetBrains Mono Google Fonts request,
- no Jekyll front matter.

Implementation also adds one hub entry to `index.md` under the most suitable
`Logic` grouping. Suggested copy:

```markdown
### [Yes / No Reflex](yesnoreflex/) `Logic`

Answer easy yes-or-no questions, but watch the signal: sometimes the rule says
to flip your answer. Switch between color and shape cues while the clock tests
your attention, inhibition, and reflexes.
```

## 16. P0 Requirements And Acceptance Criteria

### 16.1 Core Play

- Given any question and cue, when the child responds, then correctness is
  computed by the boolean rule in section 6.3.
- Given any trial, exactly one cue dimension exists and it matches the
  round's rule; the removed distractor can never reappear.
- Given an answer or timeout, when feedback appears, then fact answer, cue
  action, and game answer are all shown separately.
- Given a submitted answer, when another pointer/key event arrives, then no
  second result or score change occurs.
- Given any session, when Start is pressed, then two untimed warm-up examples
  teach the session mapping and a wrong warm-up answer retries the same
  example instead of advancing.
- Given a scored rule switch, when the trial begins, then the full-viewport
  switch dialog blocks play with every clock unarmed and only Continue,
  Enter, or Space starts the pending trial, exactly once.

### 16.2 Modes And Timing

- Given Practice, no response timer starts and feedback waits for Next.
- Given Sprint, timing starts only after question reveal and ends on the first
  response or at zero.
- Given pause, blur, or hidden tab, timing stops and the question is covered.
- Given resume, the timer continues from the exact prior remaining duration
  after a 3-second count-in.
- Given a timeout, selected answer is null and no answer button is treated as
  selected.

### 16.3 Generation And Content

- Every generated session passes every invariant in section 9 before play.
- All 240 questions are present, unique, localized, and balanced as specified
  in section 20.2.
- No session repeats a question.
- Every session generates two session colors and two session shapes before
  its warm-up, and neither set repeats the previous session's.
- Failure to read or write localStorage cannot block the app, and no stored
  value — including corrupt, foreign-shaped, or version-1 data — can prevent
  the first warm-up from starting.

### 16.4 Accessibility And Localization

- The active rule and cue semantics are understandable without color: the
  color pair passes the forbidden-pair matrix, the two session shapes always
  differ, the panel rule key names both tokens, and screen-reader cue text
  names shape and color.
- Every flow is completable by keyboard.
- Switching language changes copy only and preserves active game state.
- Reduced motion disables all nonessential movement.
- Practice offers all content without timing.

### 16.5 Responsive Design

- Desktop follows the light chassis and keeps the main play surface visible.
- Mobile preserves visible question, cue, and both answers without horizontal
  scrolling. The active rule is not permanently displayed anywhere
  (F43 correction 2026-08-22): each round's card states it, ★ keeps the
  panel pair as reference, and Pause re-shows the current mapping.
- Touch targets and focus indicators meet section 13.

## 17. P1 And P2

### P1 — Valuable Fast Follows

- Optional sound effects with a visible mute toggle and no audio-only cues.
- A teacher-facing local summary export containing aggregate session results
  only, with no name or identifier.
- A category selector for focused fact practice, provided mixed categories
  remain the default.
- An adaptive recommendation that suggests—not automatically changes—the next
  pace or difficulty after two sessions.

### P2 — Future Considerations

- Carefully reviewed additional language packs.
- A non-reading picture-fact pack with equally reviewed semantics.
- User-selectable alternative accessible cue palettes/pattern sets.
- A local two-player pass-and-play comparison mode with no online leaderboard.

None of these may delay v1.

## 18. Validation And QA Plan

### 18.1 Automated/Deterministic Checks

- Validate question database invariants on initialization in `?debug=1` and
  fail visibly in debug if any assertion breaks.
- Generate at least 10,000 sessions per level in an implementation-time test
  harness and assert every section 9 constraint.
- Exhaustively test the 2 fact values × 2 active dimensions × 2 color roles ×
  2 shape roles truth table.
- Generate at least 2,000 consecutive cue profiles and assert allowed and
  distinct tokens, per-dimension non-repetition, full FACT/FLIP role coverage
  of both pools, and deep-frozen structure; exercise the exhaustive fallback
  under a constant RNG with no previous profile, with the first legal pair,
  and with a previous fallback profile; unit-test every accepted and rejected
  `isValidCueProfileV2` shape.
- Test timer behavior with synthetic timestamps; do not rely on wall-clock
  sleeps.
- Test submit idempotence with pointer and key events in the same task.
- Test stored-data corruption, unavailable storage, and old/missing keys.
- Run `npm run code-review -- yesnoreflex/index.html`.
- Run `npm run yesnoreflex-question-gate` — the permanent content gate
  (bank shape and quotas, ID scheme, punctuation, word limits, banned
  vocabulary, duplicate and near-duplicate detection, app↔fixture equality,
  and per-record approval hashes). It also prints the open human gates it
  cannot close.
- Generate 10,000 sequential sessions per level and 10,000 mixed-level
  sessions while carrying recency state forward; assert no ID appears in any
  of the previous four sessions, the playful quota is exact with distinct
  categories and no adjacency, and the hard window never forces the fallback
  schedule.
- Pass missing, truncated, wrong-version, wrong-type, duplicate-filled, and
  unknown-ID recency payloads through startup and session generation; assert
  no exception and a valid session.
- Assert category and extra-slot selection is statistically balanced rather
  than biased by the order of the `CATEGORIES` array.
- Run `node tools/yesnoreflex-rules-check.mjs` — the permanent pure-rules
  harness over the fenced, DOM-free rules module.
- Run `npm run yesnoreflex-dom-check` — the permanent jsdom behavioral
  harness (tutorial and its demo profile, warm-ups, keyboard contract,
  phases, pause/resume, storage hardening, panel matrix, result-overlay modal
  semantics, unified cue rendering, Level-1 single dimension, switch-dialog
  counts/content/focus/rejected inputs/idempotence/timer exclusion, and
  static-markup/translation parity).
- Run `npm run yesnoreflex-layout-check` — the permanent real-Chrome
  bounding-box harness (Pause/Next geometry, answer-button stability, overlay
  coverage, no horizontal scroll at 360/720/1280 px; viewport-relative
  first-trial visibility for Level-1 color, Level-1 shape, and Level-2
  sessions after Start, Play again, and tutorial start; switch-dialog fit;
  panel computed type and target heights; English and Polish labels at
  320/360 px; and the critical surfaces repeated at 200% zoom).

### 18.2 Manual Matrix

- English and Polish.
- Practice and Sprint.
- all 3 levels and 3 paces.
- 360×640 touch viewport, 720px breakpoint, 1280×720 desktop, 200% zoom.
- mouse, touch, keyboard only, and representative screen reader smoke test.
- normal and reduced motion.
- hidden tab, window blur, pause/resume, language switch mid-question.
- correct, incorrect, timeout, final question, replay, settings change.
- color-vision simulation/grayscale: patterns and shape/rule text must remain
  sufficient.

### 18.3 Content Review

Before shipping, one English-proficient and one Polish-proficient reviewer
must inspect all 240 question/fact pairs. Review specifically for:

- one unambiguous binary answer,
- no double negatives,
- no time-sensitive or culturally disputed facts,
- no scientific overstatement,
- age-appropriate reading level,
- translation equivalence rather than word-for-word awkwardness.

## 19. Open Questions And Timeline

There are no blocking product questions for implementation. The following are
non-blocking validation items:

- **Design/owner:** after a playable prototype, confirm whether the header
  icon should remain `⚡` or use another identity glyph.
- **User testing:** confirm that `ODWRÓĆ` is immediately understood by Polish
  children; keep it unless testing shows a clearer short imperative.
- **User testing:** verify that 6 seconds is a suitable default pace; change
  the default only from evidence, while retaining all three choices.

Suggested build order:

1. data model, truth table, generator, and debug validation,
2. static responsive stage and phase machine,
3. Practice flow and reasoning feedback,
4. Sprint timer, pause/resume, scoring, and summary,
5. tutorial, localization, storage, and accessibility pass,
6. repository integration, automated stress checks, and full quality gate.

## 20. Complete V1 Question Database

### 20.1 Data Contract

Copy the following records into a top-level `QUESTIONS` constant. Fields are:

- `id`: stable lowercase identifier,
- `cat`: one of the eight category keys,
- `truth`: factual Yes (`true`) or No (`false`),
- `enQ` / `plQ`: localized question,
- `enFact` / `plFact`: short localized factual explanation shown after the
  response,
- `tone` (optional): `"playful"` marks a humor record. Standard records omit
  the field entirely. The field affects selection quotas only. A playful
  prompt must be intrinsically absurd — an unrelated cat, birthday, watcher,
  weekday, or place is never appended to an otherwise ordinary fact.

Facts must not be generated by simply removing question punctuation; authored
fact strings are required because false questions need corrective context.

### 20.2 Bank Invariants

Revised 2026-08-16 per the round-4 review: the bank grew from 108 records in
six categories to 240 records in eight, 49 wordings were replaced, the
remaining 59 were retained, and every feedback fact was normalized. The
round-4 review's Appendix A is the approved source of truth.

- exactly 240 records in exactly eight categories,
- exactly 30 per category,
- exactly 15 true and 15 false records per category,
- exactly 6 playful (`tone: "playful"`) records per category, 3 true and 3
  false — 48 playful records overall,
- IDs match `ani|bod|spa|nat|sci|mat|foo|day` plus `01`–`30` and agree with
  their category,
- unique IDs, English questions, and Polish questions; no normalized exact
  duplicates and no undispositioned near-duplicate pair at Jaccard ≥ 0.72,
- every question ends with exactly one `?` and contains no newline,
- English questions ≤ 10 words, Polish ≤ 12, English facts ≤ 12, Polish ≤ 14,
- no ambiguity triggers (`usually`, `sometimes`, `all`, `every`, `only`,
  `zwykle`, `czasami`, `wszystkie`, `każdy/każda/każde`, `tylko`) and no
  irrelevant-clause words (`when`, `while`, `if`, `whenever`, `gdy`, `kiedy`,
  `jeśli`, `podczas`),
- every string is non-empty,
- no double-negative questions,
- order in source is not gameplay order.

Every current and future record must also pass the editorial Good Question
Gate in the round-4 review §3.1: one literal proposition, one-second
retrieval, context-independent truth, direct grammar, no ambiguity triggers,
controlled `can`, equivalent (not word-for-word) translations, no content
duplicates, short feedback, and intrinsic humor for playful records.

`npm run yesnoreflex-question-gate` enforces every mechanical item above,
compares the shipped bank field-for-field with the independent fixture in
`tools/yesnoreflex-bank-fixture.mjs`, and checks each record's SHA-256 content
hash against `yesnoreflex/docs/question-gate-approvals.json`. A wording,
truth, category, tone, or feedback edit therefore fails the gate until the
edited record is reviewed and its hash is deliberately replaced.

Category labels:

| Key      | English            | Polish             |
| -------- | ------------------ | ------------------ |
| animals  | Animals            | Zwierzęta          |
| body     | Human body         | Ciało człowieka    |
| space    | Earth and space    | Ziemia i kosmos    |
| nature   | Nature and weather | Przyroda i pogoda  |
| science  | Everyday science   | Nauka na co dzień  |
| math     | Math and measures  | Matematyka i miary |
| food     | Food and drink     | Jedzenie i picie   |
| everyday | Everyday things    | Rzeczy codzienne   |

### 20.3 Records

```js
const QUESTIONS = [
  // Animals: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "ani01",
    cat: "animals",
    truth: true,
    enQ: "Do birds have feathers?",
    plQ: "Czy ptaki mają pióra?",
    enFact: "Birds have feathers.",
    plFact: "Ptaki mają pióra.",
  },
  {
    id: "ani02",
    cat: "animals",
    truth: false,
    enQ: "Do cats have feathers?",
    plQ: "Czy koty mają pióra?",
    enFact: "Cats do not have feathers.",
    plFact: "Koty nie mają piór.",
  },
  {
    id: "ani03",
    cat: "animals",
    truth: true,
    enQ: "Do ducks have beaks?",
    plQ: "Czy kaczki mają dzioby?",
    enFact: "Ducks have beaks.",
    plFact: "Kaczki mają dzioby.",
  },
  {
    id: "ani04",
    cat: "animals",
    truth: false,
    enQ: "Do horses have six legs?",
    plQ: "Czy konie mają sześć nóg?",
    enFact: "Horses do not have six legs.",
    plFact: "Konie nie mają sześciu nóg.",
  },
  {
    id: "ani05",
    cat: "animals",
    truth: true,
    enQ: "Do dogs have noses?",
    plQ: "Czy psy mają nosy?",
    enFact: "Dogs have noses.",
    plFact: "Psy mają nosy.",
  },
  {
    id: "ani06",
    cat: "animals",
    truth: true,
    enQ: "Does an octopus have eight arms?",
    plQ: "Czy ośmiornica ma osiem ramion?",
    enFact: "An octopus has eight arms.",
    plFact: "Ośmiornica ma osiem ramion.",
  },
  {
    id: "ani07",
    cat: "animals",
    truth: false,
    enQ: "Can penguins fly?",
    plQ: "Czy pingwiny potrafią latać?",
    enFact: "Penguins cannot fly.",
    plFact: "Pingwiny nie potrafią latać.",
  },
  {
    id: "ani08",
    cat: "animals",
    truth: true,
    enQ: "Do bees fly?",
    plQ: "Czy pszczoły latają?",
    enFact: "Bees can fly.",
    plFact: "Pszczoły potrafią latać.",
  },
  {
    id: "ani09",
    cat: "animals",
    truth: false,
    enQ: "Do sharks wear shoes?",
    plQ: "Czy rekiny noszą buty?",
    enFact: "Sharks do not wear shoes.",
    plFact: "Rekiny nie noszą butów.",
  },
  {
    id: "ani10",
    cat: "animals",
    truth: true,
    enQ: "Do cows moo?",
    plQ: "Czy krowy muczą?",
    enFact: "Cows moo.",
    plFact: "Krowy muczą.",
  },
  {
    id: "ani11",
    cat: "animals",
    truth: false,
    enQ: "Do snails have wheels?",
    plQ: "Czy ślimaki mają koła?",
    enFact: "Snails do not have wheels.",
    plFact: "Ślimaki nie mają kół.",
  },
  {
    id: "ani12",
    cat: "animals",
    truth: false,
    enQ: "Do polar bears live on the Moon?",
    plQ: "Czy niedźwiedzie polarne mieszkają na Księżycu?",
    enFact: "Polar bears live on Earth.",
    plFact: "Niedźwiedzie polarne żyją na Ziemi.",
  },
  {
    id: "ani13",
    cat: "animals",
    truth: true,
    enQ: "Do rabbits have ears?",
    plQ: "Czy króliki mają uszy?",
    enFact: "Rabbits have ears.",
    plFact: "Króliki mają uszy.",
  },
  {
    id: "ani14",
    cat: "animals",
    truth: true,
    enQ: "Do elephants have trunks?",
    plQ: "Czy słonie mają trąby?",
    enFact: "Elephants have trunks.",
    plFact: "Słonie mają trąby.",
  },
  {
    id: "ani15",
    cat: "animals",
    truth: false,
    enQ: "Do crocodiles have fur?",
    plQ: "Czy krokodyle mają futro?",
    enFact: "Crocodiles do not have fur.",
    plFact: "Krokodyle nie mają futra.",
  },
  {
    id: "ani16",
    cat: "animals",
    truth: false,
    enQ: "Do fish bark?",
    plQ: "Czy ryby szczekają?",
    enFact: "Fish do not bark.",
    plFact: "Ryby nie szczekają.",
  },
  {
    id: "ani17",
    cat: "animals",
    truth: false,
    tone: "playful",
    enQ: "Can a snake stomp with its back feet?",
    plQ: "Czy wąż może tupać tylnymi nogami?",
    enFact: "Snakes have no feet for stomping.",
    plFact: "Węże nie mają nóg do tupania.",
  },
  {
    id: "ani18",
    cat: "animals",
    truth: true,
    tone: "playful",
    enQ: "Can a dog chase its own tail?",
    plQ: "Czy pies może gonić własny ogon?",
    enFact: "A dog can chase its tail.",
    plFact: "Pies może gonić swój ogon.",
  },
  {
    id: "ani19",
    cat: "animals",
    truth: true,
    enQ: "Do cows have legs?",
    plQ: "Czy krowy mają nogi?",
    enFact: "Cows have legs.",
    plFact: "Krowy mają nogi.",
  },
  {
    id: "ani20",
    cat: "animals",
    truth: false,
    enQ: "Do chickens have hands?",
    plQ: "Czy kury mają dłonie?",
    enFact: "Chickens do not have hands.",
    plFact: "Kury nie mają dłoni.",
  },
  {
    id: "ani21",
    cat: "animals",
    truth: true,
    enQ: "Do frogs jump?",
    plQ: "Czy żaby skaczą?",
    enFact: "Frogs can jump.",
    plFact: "Żaby potrafią skakać.",
  },
  {
    id: "ani22",
    cat: "animals",
    truth: false,
    enQ: "Do turtles have wings?",
    plQ: "Czy żółwie mają skrzydła?",
    enFact: "Turtles do not have wings.",
    plFact: "Żółwie nie mają skrzydeł.",
  },
  {
    id: "ani23",
    cat: "animals",
    truth: true,
    enQ: "Do sheep have wool?",
    plQ: "Czy owce mają wełnę?",
    enFact: "Sheep have wool.",
    plFact: "Owce mają wełnę.",
  },
  {
    id: "ani24",
    cat: "animals",
    truth: false,
    enQ: "Do rabbits have fins?",
    plQ: "Czy króliki mają płetwy?",
    enFact: "Rabbits do not have fins.",
    plFact: "Króliki nie mają płetw.",
  },
  {
    id: "ani25",
    cat: "animals",
    truth: true,
    enQ: "Can monkeys climb?",
    plQ: "Czy małpy potrafią się wspinać?",
    enFact: "Monkeys can climb.",
    plFact: "Małpy potrafią się wspinać.",
  },
  {
    id: "ani26",
    cat: "animals",
    truth: false,
    enQ: "Do dogs have beaks?",
    plQ: "Czy psy mają dzioby?",
    enFact: "Dogs do not have beaks.",
    plFact: "Psy nie mają dziobów.",
  },
  {
    id: "ani27",
    cat: "animals",
    truth: true,
    tone: "playful",
    enQ: "Do ducks waddle?",
    plQ: "Czy kaczki chodzą, kołysząc się na boki?",
    enFact: "Ducks waddle as they walk.",
    plFact: "Kaczki kołyszą się podczas chodzenia.",
  },
  {
    id: "ani28",
    cat: "animals",
    truth: false,
    tone: "playful",
    enQ: "Does a cow sleep in a teacup?",
    plQ: "Czy krowa śpi w filiżance?",
    enFact: "A cow does not sleep in a teacup.",
    plFact: "Krowa nie śpi w filiżance.",
  },
  {
    id: "ani29",
    cat: "animals",
    truth: true,
    tone: "playful",
    enQ: "Can a puppy chase a bouncing ball?",
    plQ: "Czy szczeniak może gonić odbijającą się piłkę?",
    enFact: "A puppy can chase a ball.",
    plFact: "Szczeniak może gonić piłkę.",
  },
  {
    id: "ani30",
    cat: "animals",
    truth: false,
    tone: "playful",
    enQ: "Can a fish knit a scarf?",
    plQ: "Czy ryba może zrobić szalik na drutach?",
    enFact: "A fish cannot knit a scarf.",
    plFact: "Ryba nie potrafi robić na drutach.",
  },
  // Body: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "bod01",
    cat: "body",
    truth: true,
    enQ: "Does the heart pump blood?",
    plQ: "Czy serce pompuje krew?",
    enFact: "The heart pumps blood.",
    plFact: "Serce pompuje krew.",
  },
  {
    id: "bod02",
    cat: "body",
    truth: false,
    enQ: "Do the lungs digest food?",
    plQ: "Czy płuca trawią pokarm?",
    enFact: "The lungs do not digest food.",
    plFact: "Płuca nie trawią pokarmu.",
  },
  {
    id: "bod03",
    cat: "body",
    truth: true,
    enQ: "Do people have skin?",
    plQ: "Czy ludzie mają skórę?",
    enFact: "People have skin.",
    plFact: "Ludzie mają skórę.",
  },
  {
    id: "bod04",
    cat: "body",
    truth: true,
    enQ: "Does the skull protect the brain?",
    plQ: "Czy czaszka chroni mózg?",
    enFact: "The skull protects the brain.",
    plFact: "Czaszka chroni mózg.",
  },
  {
    id: "bod05",
    cat: "body",
    truth: true,
    enQ: "Do people use lungs to breathe?",
    plQ: "Czy ludzie używają płuc do oddychania?",
    enFact: "People breathe with their lungs.",
    plFact: "Ludzie oddychają za pomocą płuc.",
  },
  {
    id: "bod06",
    cat: "body",
    truth: false,
    enQ: "Is human blood bright green?",
    plQ: "Czy ludzka krew jest jaskrawozielona?",
    enFact: "Human blood is not bright green.",
    plFact: "Ludzka krew nie jest jaskrawozielona.",
  },
  {
    id: "bod07",
    cat: "body",
    truth: false,
    enQ: "Are human teeth made of chocolate?",
    plQ: "Czy ludzkie zęby są zrobione z czekolady?",
    enFact: "Human teeth are not chocolate.",
    plFact: "Ludzkie zęby nie są z czekolady.",
  },
  {
    id: "bod08",
    cat: "body",
    truth: true,
    enQ: "Do people have bones?",
    plQ: "Czy ludzie mają kości?",
    enFact: "People have bones.",
    plFact: "Ludzie mają kości.",
  },
  {
    id: "bod09",
    cat: "body",
    truth: false,
    enQ: "Is your stomach inside your shoe?",
    plQ: "Czy twój żołądek jest w bucie?",
    enFact: "Your stomach is not in your shoe.",
    plFact: "Twój żołądek nie jest w bucie.",
  },
  {
    id: "bod10",
    cat: "body",
    truth: true,
    enQ: "Does the tongue help us taste?",
    plQ: "Czy język pomaga nam odczuwać smak?",
    enFact: "The tongue helps us taste.",
    plFact: "Język pomaga nam odczuwać smak.",
  },
  {
    id: "bod11",
    cat: "body",
    truth: false,
    enQ: "Are your elbows on your feet?",
    plQ: "Czy łokcie są na stopach?",
    enFact: "Elbows are not on feet.",
    plFact: "Łokcie nie są na stopach.",
  },
  {
    id: "bod12",
    cat: "body",
    truth: true,
    enQ: "Do eyes help people see?",
    plQ: "Czy oczy pomagają ludziom widzieć?",
    enFact: "Eyes help people see.",
    plFact: "Oczy pomagają ludziom widzieć.",
  },
  {
    id: "bod13",
    cat: "body",
    truth: false,
    enQ: "Is the knee part of the arm?",
    plQ: "Czy kolano jest częścią ręki?",
    enFact: "The knee is part of the leg.",
    plFact: "Kolano jest częścią nogi.",
  },
  {
    id: "bod14",
    cat: "body",
    truth: true,
    enQ: "Do knees bend?",
    plQ: "Czy kolana się zginają?",
    enFact: "Knees bend.",
    plFact: "Kolana się zginają.",
  },
  {
    id: "bod15",
    cat: "body",
    truth: false,
    enQ: "Are fingernails made of glass?",
    plQ: "Czy paznokcie są zrobione ze szkła?",
    enFact: "Fingernails are not glass.",
    plFact: "Paznokcie nie są ze szkła.",
  },
  {
    id: "bod16",
    cat: "body",
    truth: false,
    enQ: "Do ears help people smell?",
    plQ: "Czy uszy pomagają ludziom wąchać?",
    enFact: "People smell with their noses.",
    plFact: "Ludzie wąchają nosem.",
  },
  {
    id: "bod17",
    cat: "body",
    truth: false,
    tone: "playful",
    enQ: "Does your nose walk away at night?",
    plQ: "Czy twój nos odchodzi nocą?",
    enFact: "Your nose stays on your face.",
    plFact: "Twój nos zostaje na twarzy.",
  },
  {
    id: "bod18",
    cat: "body",
    truth: true,
    tone: "playful",
    enQ: "Can people stick out their tongues?",
    plQ: "Czy ludzie mogą wystawić język?",
    enFact: "People can stick out their tongues.",
    plFact: "Ludzie mogą wystawić język.",
  },
  {
    id: "bod19",
    cat: "body",
    truth: true,
    enQ: "Do hands have fingers?",
    plQ: "Czy dłonie mają palce?",
    enFact: "Hands have fingers.",
    plFact: "Dłonie mają palce.",
  },
  {
    id: "bod20",
    cat: "body",
    truth: false,
    enQ: "Is your nose on your knee?",
    plQ: "Czy nos jest na kolanie?",
    enFact: "Your nose is not on your knee.",
    plFact: "Nos nie jest na kolanie.",
  },
  {
    id: "bod21",
    cat: "body",
    truth: true,
    enQ: "Do feet have toes?",
    plQ: "Czy stopy mają palce?",
    enFact: "Feet have toes.",
    plFact: "Stopy mają palce.",
  },
  {
    id: "bod22",
    cat: "body",
    truth: false,
    enQ: "Can people hear with their elbows?",
    plQ: "Czy ludzie mogą słyszeć łokciami?",
    enFact: "People do not hear with elbows.",
    plFact: "Ludzie nie słyszą łokciami.",
  },
  {
    id: "bod23",
    cat: "body",
    truth: true,
    enQ: "Can people open their mouths?",
    plQ: "Czy ludzie mogą otwierać usta?",
    enFact: "People can open their mouths.",
    plFact: "Ludzie mogą otwierać usta.",
  },
  {
    id: "bod24",
    cat: "body",
    truth: false,
    enQ: "Are your eyes behind your heels?",
    plQ: "Czy oczy są za piętami?",
    enFact: "Your eyes are not behind your heels.",
    plFact: "Oczy nie są za piętami.",
  },
  {
    id: "bod25",
    cat: "body",
    truth: true,
    enQ: "Do people blink?",
    plQ: "Czy ludzie mrugają?",
    enFact: "People blink.",
    plFact: "Ludzie mrugają.",
  },
  {
    id: "bod26",
    cat: "body",
    truth: false,
    enQ: "Does hair grow from shoes?",
    plQ: "Czy włosy rosną z butów?",
    enFact: "Hair does not grow from shoes.",
    plFact: "Włosy nie rosną z butów.",
  },
  {
    id: "bod27",
    cat: "body",
    truth: true,
    tone: "playful",
    enQ: "Can your stomach rumble?",
    plQ: "Czy w brzuchu może burczeć?",
    enFact: "A stomach can rumble.",
    plFact: "W brzuchu może burczeć.",
  },
  {
    id: "bod28",
    cat: "body",
    truth: false,
    tone: "playful",
    enQ: "Can a belly button bark?",
    plQ: "Czy pępek może szczekać?",
    enFact: "A belly button cannot bark.",
    plFact: "Pępek nie potrafi szczekać.",
  },
  {
    id: "bod29",
    cat: "body",
    truth: true,
    tone: "playful",
    enQ: "Can people clap their hands?",
    plQ: "Czy ludzie mogą klaskać w dłonie?",
    enFact: "People can clap their hands.",
    plFact: "Ludzie mogą klaskać w dłonie.",
  },
  {
    id: "bod30",
    cat: "body",
    truth: false,
    tone: "playful",
    enQ: "Does a knee have a nose?",
    plQ: "Czy kolano ma nos?",
    enFact: "A knee does not have a nose.",
    plFact: "Kolano nie ma nosa.",
  },
  // Space: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "spa01",
    cat: "space",
    truth: true,
    enQ: "Is the Moon in space?",
    plQ: "Czy Księżyc znajduje się w kosmosie?",
    enFact: "The Moon is in space.",
    plFact: "Księżyc znajduje się w kosmosie.",
  },
  {
    id: "spa02",
    cat: "space",
    truth: true,
    enQ: "Is the Sun a star?",
    plQ: "Czy Słońce jest gwiazdą?",
    enFact: "The Sun is a star.",
    plFact: "Słońce jest gwiazdą.",
  },
  {
    id: "spa03",
    cat: "space",
    truth: false,
    enQ: "Is the Moon the Sun?",
    plQ: "Czy Księżyc jest Słońcem?",
    enFact: "The Moon is not the Sun.",
    plFact: "Księżyc nie jest Słońcem.",
  },
  {
    id: "spa04",
    cat: "space",
    truth: true,
    enQ: "Is Mars a planet?",
    plQ: "Czy Mars jest planetą?",
    enFact: "Mars is a planet.",
    plFact: "Mars jest planetą.",
  },
  {
    id: "spa05",
    cat: "space",
    truth: true,
    enQ: "Does the Sun shine?",
    plQ: "Czy Słońce świeci?",
    enFact: "The Sun shines.",
    plFact: "Słońce świeci.",
  },
  {
    id: "spa06",
    cat: "space",
    truth: false,
    enQ: "Does Saturn have square rings?",
    plQ: "Czy Saturn ma kwadratowe pierścienie?",
    enFact: "Saturn does not have square rings.",
    plFact: "Saturn nie ma kwadratowych pierścieni.",
  },
  {
    id: "spa07",
    cat: "space",
    truth: true,
    enQ: "Is Earth a planet?",
    plQ: "Czy Ziemia jest planetą?",
    enFact: "Earth is a planet.",
    plFact: "Ziemia jest planetą.",
  },
  {
    id: "spa08",
    cat: "space",
    truth: true,
    enQ: "Does the Moon appear in our sky?",
    plQ: "Czy Księżyc pojawia się na naszym niebie?",
    enFact: "The Moon appears in Earth's sky.",
    plFact: "Księżyc pojawia się na ziemskim niebie.",
  },
  {
    id: "spa09",
    cat: "space",
    truth: false,
    enQ: "Is the Sun inside Earth?",
    plQ: "Czy Słońce jest wewnątrz Ziemi?",
    enFact: "The Sun is not inside Earth.",
    plFact: "Słońce nie jest wewnątrz Ziemi.",
  },
  {
    id: "spa10",
    cat: "space",
    truth: false,
    enQ: "Do astronauts live on the Sun?",
    plQ: "Czy astronauci mieszkają na Słońcu?",
    enFact: "Astronauts do not live on the Sun.",
    plFact: "Astronauci nie mieszkają na Słońcu.",
  },
  {
    id: "spa11",
    cat: "space",
    truth: false,
    enQ: "Is the Moon made of cheese?",
    plQ: "Czy Księżyc jest zrobiony z sera?",
    enFact: "The Moon is not made of cheese.",
    plFact: "Księżyc nie jest z sera.",
  },
  {
    id: "spa12",
    cat: "space",
    truth: true,
    enQ: "Can rockets travel into space?",
    plQ: "Czy rakiety mogą lecieć w kosmos?",
    enFact: "Rockets can travel into space.",
    plFact: "Rakiety mogą lecieć w kosmos.",
  },
  {
    id: "spa13",
    cat: "space",
    truth: false,
    enQ: "Is the Sun made of ice?",
    plQ: "Czy Słońce jest zrobione z lodu?",
    enFact: "The Sun is not made of ice.",
    plFact: "Słońce nie jest z lodu.",
  },
  {
    id: "spa14",
    cat: "space",
    truth: false,
    enQ: "Is Earth square?",
    plQ: "Czy Ziemia jest kwadratowa?",
    enFact: "Earth is not square.",
    plFact: "Ziemia nie jest kwadratowa.",
  },
  {
    id: "spa15",
    cat: "space",
    truth: true,
    enQ: "Does Earth travel around the Sun?",
    plQ: "Czy Ziemia krąży wokół Słońca?",
    enFact: "Earth travels around the Sun.",
    plFact: "Ziemia krąży wokół Słońca.",
  },
  {
    id: "spa16",
    cat: "space",
    truth: false,
    enQ: "Is the Moon inside Earth?",
    plQ: "Czy Księżyc jest wewnątrz Ziemi?",
    enFact: "The Moon is not inside Earth.",
    plFact: "Księżyc nie jest wewnątrz Ziemi.",
  },
  {
    id: "spa17",
    cat: "space",
    truth: false,
    tone: "playful",
    enQ: "Do astronauts ride bicycles to the Moon?",
    plQ: "Czy astronauci jeżdżą na Księżyc rowerami?",
    enFact: "Astronauts do not bicycle to the Moon.",
    plFact: "Astronauci nie jeżdżą na Księżyc rowerami.",
  },
  {
    id: "spa18",
    cat: "space",
    truth: true,
    tone: "playful",
    enQ: "Can astronauts float inside a spacecraft?",
    plQ: "Czy astronauci mogą unosić się w statku kosmicznym?",
    enFact: "Astronauts can float inside a spacecraft.",
    plFact: "Astronauci mogą unosić się w statku kosmicznym.",
  },
  {
    id: "spa19",
    cat: "space",
    truth: true,
    enQ: "Is the Moon shaped like a ball?",
    plQ: "Czy Księżyc ma kształt kuli?",
    enFact: "The Moon is shaped like a ball.",
    plFact: "Księżyc ma kształt kuli.",
  },
  {
    id: "spa20",
    cat: "space",
    truth: false,
    enQ: "Do rockets grow on trees?",
    plQ: "Czy rakiety rosną na drzewach?",
    enFact: "Rockets do not grow on trees.",
    plFact: "Rakiety nie rosną na drzewach.",
  },
  {
    id: "spa21",
    cat: "space",
    truth: true,
    enQ: "Can rockets leave Earth?",
    plQ: "Czy rakiety mogą opuścić Ziemię?",
    enFact: "Rockets can leave Earth.",
    plFact: "Rakiety mogą opuścić Ziemię.",
  },
  {
    id: "spa22",
    cat: "space",
    truth: false,
    enQ: "Do stars live in fish tanks?",
    plQ: "Czy gwiazdy mieszkają w akwariach?",
    enFact: "Stars do not live in fish tanks.",
    plFact: "Gwiazdy nie mieszkają w akwariach.",
  },
  {
    id: "spa23",
    cat: "space",
    truth: true,
    enQ: "Can astronauts wear spacesuits?",
    plQ: "Czy astronauci mogą nosić skafandry?",
    enFact: "Astronauts can wear spacesuits.",
    plFact: "Astronauci mogą nosić skafandry.",
  },
  {
    id: "spa24",
    cat: "space",
    truth: false,
    enQ: "Do planets fit inside pockets?",
    plQ: "Czy planety mieszczą się w kieszeniach?",
    enFact: "Planets do not fit inside pockets.",
    plFact: "Planety nie mieszczą się w kieszeniach.",
  },
  {
    id: "spa25",
    cat: "space",
    truth: true,
    enQ: "Do stars shine?",
    plQ: "Czy gwiazdy świecą?",
    enFact: "Stars shine.",
    plFact: "Gwiazdy świecą.",
  },
  {
    id: "spa26",
    cat: "space",
    truth: false,
    enQ: "Is the Sun cold?",
    plQ: "Czy Słońce jest zimne?",
    enFact: "The Sun is not cold.",
    plFact: "Słońce nie jest zimne.",
  },
  {
    id: "spa27",
    cat: "space",
    truth: true,
    tone: "playful",
    enQ: "Can a rocket make a loud noise?",
    plQ: "Czy rakieta może robić dużo hałasu?",
    enFact: "A rocket can make a loud noise.",
    plFact: "Rakieta może robić dużo hałasu.",
  },
  {
    id: "spa28",
    cat: "space",
    truth: false,
    tone: "playful",
    enQ: "Do astronauts row boats through space?",
    plQ: "Czy astronauci wiosłują łodziami w kosmosie?",
    enFact: "Astronauts do not row boats through space.",
    plFact: "Astronauci nie wiosłują łodziami w kosmosie.",
  },
  {
    id: "spa29",
    cat: "space",
    truth: true,
    tone: "playful",
    enQ: "Can moonlight shine through a window?",
    plQ: "Czy światło Księżyca może świecić przez okno?",
    enFact: "Moonlight can shine through a window.",
    plFact: "Światło Księżyca może świecić przez okno.",
  },
  {
    id: "spa30",
    cat: "space",
    truth: false,
    tone: "playful",
    enQ: "Does the Moon need an umbrella?",
    plQ: "Czy Księżyc potrzebuje parasola?",
    enFact: "The Moon does not need an umbrella.",
    plFact: "Księżyc nie potrzebuje parasola.",
  },
  // Nature: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "nat01",
    cat: "nature",
    truth: true,
    enQ: "Does rain fall from clouds?",
    plQ: "Czy deszcz spada z chmur?",
    enFact: "Rain falls from clouds.",
    plFact: "Deszcz spada z chmur.",
  },
  {
    id: "nat02",
    cat: "nature",
    truth: true,
    enQ: "Is snow made of frozen water?",
    plQ: "Czy śnieg jest zbudowany z zamarzniętej wody?",
    enFact: "Snow is made of frozen water.",
    plFact: "Śnieg jest z zamarzniętej wody.",
  },
  {
    id: "nat03",
    cat: "nature",
    truth: true,
    enQ: "Does rain make the ground wet?",
    plQ: "Czy deszcz moczy ziemię?",
    enFact: "Rain makes the ground wet.",
    plFact: "Deszcz moczy ziemię.",
  },
  {
    id: "nat04",
    cat: "nature",
    truth: true,
    enQ: "Does sunshine make things brighter?",
    plQ: "Czy światło słoneczne rozjaśnia rzeczy?",
    enFact: "Sunshine makes things brighter.",
    plFact: "Światło słoneczne rozjaśnia rzeczy.",
  },
  {
    id: "nat05",
    cat: "nature",
    truth: false,
    enQ: "Are clouds made of cotton?",
    plQ: "Czy chmury są zrobione z bawełny?",
    enFact: "Clouds are not made of cotton.",
    plFact: "Chmury nie są z bawełny.",
  },
  {
    id: "nat06",
    cat: "nature",
    truth: false,
    enQ: "Does snow fall upward?",
    plQ: "Czy śnieg spada do góry?",
    enFact: "Snow does not fall upward.",
    plFact: "Śnieg nie spada do góry.",
  },
  {
    id: "nat07",
    cat: "nature",
    truth: false,
    enQ: "Is grass bright purple?",
    plQ: "Czy trawa jest jaskrawofioletowa?",
    enFact: "Grass is not bright purple.",
    plFact: "Trawa nie jest jaskrawofioletowa.",
  },
  {
    id: "nat08",
    cat: "nature",
    truth: false,
    enQ: "Is rain made of milk?",
    plQ: "Czy deszcz jest zrobiony z mleka?",
    enFact: "Rain is not made of milk.",
    plFact: "Deszcz nie jest z mleka.",
  },
  {
    id: "nat09",
    cat: "nature",
    truth: true,
    enQ: "Does wind move leaves?",
    plQ: "Czy wiatr porusza liście?",
    enFact: "Wind can move leaves.",
    plFact: "Wiatr może poruszać liście.",
  },
  {
    id: "nat10",
    cat: "nature",
    truth: true,
    enQ: "Do trees grow from the ground?",
    plQ: "Czy drzewa rosną z ziemi?",
    enFact: "Trees grow from the ground.",
    plFact: "Drzewa rosną z ziemi.",
  },
  {
    id: "nat11",
    cat: "nature",
    truth: true,
    enQ: "Does melting ice become water?",
    plQ: "Czy topniejący lód zmienia się w wodę?",
    enFact: "Melting ice becomes water.",
    plFact: "Topniejący lód zmienia się w wodę.",
  },
  {
    id: "nat12",
    cat: "nature",
    truth: true,
    enQ: "Can puddles form after rain?",
    plQ: "Czy po deszczu mogą powstać kałuże?",
    enFact: "Puddles can form after rain.",
    plFact: "Po deszczu mogą powstać kałuże.",
  },
  {
    id: "nat13",
    cat: "nature",
    truth: false,
    enQ: "Are tree leaves made of metal?",
    plQ: "Czy liście drzew są zrobione z metalu?",
    enFact: "Tree leaves are not metal.",
    plFact: "Liście drzew nie są z metalu.",
  },
  {
    id: "nat14",
    cat: "nature",
    truth: false,
    enQ: "Is wind a solid wall?",
    plQ: "Czy wiatr jest twardą ścianą?",
    enFact: "Wind is not a solid wall.",
    plFact: "Wiatr nie jest twardą ścianą.",
  },
  {
    id: "nat15",
    cat: "nature",
    truth: false,
    enQ: "Is grass made of glass?",
    plQ: "Czy trawa jest zrobiona ze szkła?",
    enFact: "Grass is not made of glass.",
    plFact: "Trawa nie jest ze szkła.",
  },
  {
    id: "nat16",
    cat: "nature",
    truth: false,
    enQ: "Is air made of orange juice?",
    plQ: "Czy powietrze jest zrobione z soku pomarańczowego?",
    enFact: "Air is not orange juice.",
    plFact: "Powietrze nie jest sokiem pomarańczowym.",
  },
  {
    id: "nat17",
    cat: "nature",
    truth: false,
    tone: "playful",
    enQ: "Does lemonade fall from clouds?",
    plQ: "Czy z chmur pada lemoniada?",
    enFact: "Lemonade does not fall from clouds.",
    plFact: "Z chmur nie pada lemoniada.",
  },
  {
    id: "nat18",
    cat: "nature",
    truth: true,
    tone: "playful",
    enQ: "Can strong wind turn an umbrella inside out?",
    plQ: "Czy silny wiatr może wywrócić parasol na drugą stronę?",
    enFact: "Strong wind can turn an umbrella inside out.",
    plFact: "Silny wiatr może wywrócić parasol na drugą stronę.",
  },
  {
    id: "nat19",
    cat: "nature",
    truth: true,
    enQ: "Do clouds move across the sky?",
    plQ: "Czy chmury przesuwają się po niebie?",
    enFact: "Clouds move across the sky.",
    plFact: "Chmury przesuwają się po niebie.",
  },
  {
    id: "nat20",
    cat: "nature",
    truth: false,
    enQ: "Is snow hot?",
    plQ: "Czy śnieg jest gorący?",
    enFact: "Snow is not hot.",
    plFact: "Śnieg nie jest gorący.",
  },
  {
    id: "nat21",
    cat: "nature",
    truth: true,
    enQ: "Can seeds grow into plants?",
    plQ: "Czy z nasion mogą wyrosnąć rośliny?",
    enFact: "Seeds can grow into plants.",
    plFact: "Z nasion mogą wyrosnąć rośliny.",
  },
  {
    id: "nat22",
    cat: "nature",
    truth: false,
    enQ: "Do rocks grow leaves?",
    plQ: "Czy kamienie wypuszczają liście?",
    enFact: "Rocks do not grow leaves.",
    plFact: "Kamienie nie wypuszczają liści.",
  },
  {
    id: "nat23",
    cat: "nature",
    truth: true,
    enQ: "Does sunlight warm the ground?",
    plQ: "Czy światło słoneczne ogrzewa ziemię?",
    enFact: "Sunlight warms the ground.",
    plFact: "Światło słoneczne ogrzewa ziemię.",
  },
  {
    id: "nat24",
    cat: "nature",
    truth: false,
    enQ: "Are tree trunks made of jelly?",
    plQ: "Czy pnie drzew są z galaretki?",
    enFact: "Tree trunks are not jelly.",
    plFact: "Pnie drzew nie są z galaretki.",
  },
  {
    id: "nat25",
    cat: "nature",
    truth: true,
    enQ: "Do flowers grow on plants?",
    plQ: "Czy kwiaty rosną na roślinach?",
    enFact: "Flowers grow on plants.",
    plFact: "Kwiaty rosną na roślinach.",
  },
  {
    id: "nat26",
    cat: "nature",
    truth: false,
    enQ: "Does rain fall from the floor?",
    plQ: "Czy deszcz spada z podłogi?",
    enFact: "Rain does not fall from the floor.",
    plFact: "Deszcz nie spada z podłogi.",
  },
  {
    id: "nat27",
    cat: "nature",
    truth: true,
    tone: "playful",
    enQ: "Can boots splash in a puddle?",
    plQ: "Czy buty mogą chlapać w kałuży?",
    enFact: "Boots can splash in a puddle.",
    plFact: "Buty mogą chlapać w kałuży.",
  },
  {
    id: "nat28",
    cat: "nature",
    truth: false,
    tone: "playful",
    enQ: "Can a raindrop carry a suitcase?",
    plQ: "Czy kropla deszczu może nieść walizkę?",
    enFact: "A raindrop cannot carry a suitcase.",
    plFact: "Kropla deszczu nie może nieść walizki.",
  },
  {
    id: "nat29",
    cat: "nature",
    truth: true,
    tone: "playful",
    enQ: "Can a snowball roll downhill?",
    plQ: "Czy śnieżka może stoczyć się z górki?",
    enFact: "A snowball can roll downhill.",
    plFact: "Śnieżka może stoczyć się z górki.",
  },
  {
    id: "nat30",
    cat: "nature",
    truth: false,
    tone: "playful",
    enQ: "Can thunder brush its teeth?",
    plQ: "Czy grzmot może myć zęby?",
    enFact: "Thunder cannot brush teeth.",
    plFact: "Grzmot nie może myć zębów.",
  },
  // Science: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "sci01",
    cat: "science",
    truth: true,
    enQ: "Does a lit lamp give light?",
    plQ: "Czy zapalona lampa daje światło?",
    enFact: "A lit lamp gives light.",
    plFact: "Zapalona lampa daje światło.",
  },
  {
    id: "sci02",
    cat: "science",
    truth: true,
    enQ: "Can wheels turn?",
    plQ: "Czy koła mogą się obracać?",
    enFact: "Wheels can turn.",
    plFact: "Koła mogą się obracać.",
  },
  {
    id: "sci03",
    cat: "science",
    truth: true,
    enQ: "Can a shadow appear on a wall?",
    plQ: "Czy cień może pojawić się na ścianie?",
    enFact: "A shadow can appear on a wall.",
    plFact: "Cień może pojawić się na ścianie.",
  },
  {
    id: "sci04",
    cat: "science",
    truth: true,
    enQ: "Can a toy car roll?",
    plQ: "Czy samochodzik może się toczyć?",
    enFact: "A toy car can roll.",
    plFact: "Samochodzik może się toczyć.",
  },
  {
    id: "sci05",
    cat: "science",
    truth: true,
    enQ: "Does ice feel cold?",
    plQ: "Czy lód jest zimny w dotyku?",
    enFact: "Ice feels cold.",
    plFact: "Lód jest zimny w dotyku.",
  },
  {
    id: "sci06",
    cat: "science",
    truth: true,
    enQ: "Can a rubber band stretch?",
    plQ: "Czy gumka recepturka może się rozciągać?",
    enFact: "A rubber band can stretch.",
    plFact: "Gumka recepturka może się rozciągać.",
  },
  {
    id: "sci07",
    cat: "science",
    truth: true,
    enQ: "Can a bell make a sound?",
    plQ: "Czy dzwonek może wydawać dźwięk?",
    enFact: "A bell can make a sound.",
    plFact: "Dzwonek może wydawać dźwięk.",
  },
  {
    id: "sci08",
    cat: "science",
    truth: true,
    enQ: "Can a rubber ball bounce?",
    plQ: "Czy gumowa piłka może się odbijać?",
    enFact: "A rubber ball can bounce.",
    plFact: "Gumowa piłka może się odbijać.",
  },
  {
    id: "sci09",
    cat: "science",
    truth: false,
    enQ: "Is a wooden spoon made of metal?",
    plQ: "Czy drewniana łyżka jest zrobiona z metalu?",
    enFact: "A wooden spoon is not metal.",
    plFact: "Drewniana łyżka nie jest z metalu.",
  },
  {
    id: "sci10",
    cat: "science",
    truth: false,
    enQ: "Does a dropped stone fall upward?",
    plQ: "Czy upuszczony kamień spada do góry?",
    enFact: "A dropped stone does not fall upward.",
    plFact: "Upuszczony kamień nie spada do góry.",
  },
  {
    id: "sci11",
    cat: "science",
    truth: false,
    enQ: "Does a shadow make its own sound?",
    plQ: "Czy cień wydaje własny dźwięk?",
    enFact: "A shadow does not make a sound.",
    plFact: "Cień nie wydaje dźwięku.",
  },
  {
    id: "sci12",
    cat: "science",
    truth: false,
    enQ: "Is a rock a balloon?",
    plQ: "Czy kamień jest balonem?",
    enFact: "A rock is not a balloon.",
    plFact: "Kamień nie jest balonem.",
  },
  {
    id: "sci13",
    cat: "science",
    truth: false,
    enQ: "Is a mirror a lamp?",
    plQ: "Czy lustro jest lampą?",
    enFact: "A mirror is not a lamp.",
    plFact: "Lustro nie jest lampą.",
  },
  {
    id: "sci14",
    cat: "science",
    truth: false,
    enQ: "Is fire cold?",
    plQ: "Czy ogień jest zimny?",
    enFact: "Fire is not cold.",
    plFact: "Ogień nie jest zimny.",
  },
  {
    id: "sci15",
    cat: "science",
    truth: false,
    enQ: "Is ice hotter than boiling water?",
    plQ: "Czy lód jest gorętszy od wrzącej wody?",
    enFact: "Ice is not hotter than boiling water.",
    plFact: "Lód nie jest gorętszy od wrzącej wody.",
  },
  {
    id: "sci16",
    cat: "science",
    truth: false,
    enQ: "Does an empty battery power a toy?",
    plQ: "Czy rozładowana bateria zasila zabawkę?",
    enFact: "An empty battery does not power a toy.",
    plFact: "Rozładowana bateria nie zasila zabawki.",
  },
  {
    id: "sci17",
    cat: "science",
    truth: false,
    tone: "playful",
    enQ: "Is a cheese sandwich a magnet?",
    plQ: "Czy kanapka z serem jest magnesem?",
    enFact: "A cheese sandwich is not a magnet.",
    plFact: "Kanapka z serem nie jest magnesem.",
  },
  {
    id: "sci18",
    cat: "science",
    truth: true,
    tone: "playful",
    enQ: "Can a rubber duck float in water?",
    plQ: "Czy gumowa kaczka może pływać po wodzie?",
    enFact: "A rubber duck can float in water.",
    plFact: "Gumowa kaczka może pływać po wodzie.",
  },
  {
    id: "sci19",
    cat: "science",
    truth: true,
    enQ: "Can a ball roll down a ramp?",
    plQ: "Czy piłka może stoczyć się po pochylni?",
    enFact: "A ball can roll down a ramp.",
    plFact: "Piłka może stoczyć się po pochylni.",
  },
  {
    id: "sci20",
    cat: "science",
    truth: false,
    enQ: "Can you pick up a shadow?",
    plQ: "Czy można podnieść cień?",
    enFact: "You cannot pick up a shadow.",
    plFact: "Nie można podnieść cienia.",
  },
  {
    id: "sci21",
    cat: "science",
    truth: true,
    enQ: "Can water freeze into ice?",
    plQ: "Czy woda może zamarznąć w lód?",
    enFact: "Water can freeze into ice.",
    plFact: "Woda może zamarznąć w lód.",
  },
  {
    id: "sci22",
    cat: "science",
    truth: false,
    enQ: "Is a brick softer than a pillow?",
    plQ: "Czy cegła jest miększa od poduszki?",
    enFact: "A brick is not softer than a pillow.",
    plFact: "Cegła nie jest miększa od poduszki.",
  },
  {
    id: "sci23",
    cat: "science",
    truth: true,
    enQ: "Can paper tear?",
    plQ: "Czy papier może się podrzeć?",
    enFact: "Paper can tear.",
    plFact: "Papier może się podrzeć.",
  },
  {
    id: "sci24",
    cat: "science",
    truth: false,
    enQ: "Is steam made of sand?",
    plQ: "Czy para jest zrobiona z piasku?",
    enFact: "Steam is not made of sand.",
    plFact: "Para nie jest z piasku.",
  },
  {
    id: "sci25",
    cat: "science",
    truth: true,
    enQ: "Can a magnet lift a paper clip?",
    plQ: "Czy magnes może podnieść spinacz?",
    enFact: "A magnet can lift a paper clip.",
    plFact: "Magnes może podnieść spinacz.",
  },
  {
    id: "sci26",
    cat: "science",
    truth: false,
    enQ: "Is ice made of paper?",
    plQ: "Czy lód jest zrobiony z papieru?",
    enFact: "Ice is not made of paper.",
    plFact: "Lód nie jest z papieru.",
  },
  {
    id: "sci27",
    cat: "science",
    truth: true,
    tone: "playful",
    enQ: "Can popcorn pop?",
    plQ: "Czy popcorn może strzelać?",
    enFact: "Popcorn can pop.",
    plFact: "Popcorn może strzelać.",
  },
  {
    id: "sci28",
    cat: "science",
    truth: false,
    tone: "playful",
    enQ: "Does a shadow need breakfast?",
    plQ: "Czy cień potrzebuje śniadania?",
    enFact: "A shadow does not need breakfast.",
    plFact: "Cień nie potrzebuje śniadania.",
  },
  {
    id: "sci29",
    cat: "science",
    truth: true,
    tone: "playful",
    enQ: "Can a soap bubble wobble?",
    plQ: "Czy bańka mydlana może się chwiać?",
    enFact: "A soap bubble can wobble.",
    plFact: "Bańka mydlana może się chwiać.",
  },
  {
    id: "sci30",
    cat: "science",
    truth: false,
    tone: "playful",
    enQ: "Can a spoon run away?",
    plQ: "Czy łyżka może uciec?",
    enFact: "A spoon cannot run away.",
    plFact: "Łyżka nie może uciec.",
  },
  // Math: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "mat01",
    cat: "math",
    truth: true,
    enQ: "Does two plus three equal five?",
    plQ: "Czy dwa plus trzy równa się pięć?",
    enFact: "Two plus three equals five.",
    plFact: "Dwa plus trzy równa się pięć.",
  },
  {
    id: "mat02",
    cat: "math",
    truth: false,
    enQ: "Does one plus one equal three?",
    plQ: "Czy jeden plus jeden równa się trzy?",
    enFact: "One plus one does not equal three.",
    plFact: "Jeden plus jeden nie równa się trzy.",
  },
  {
    id: "mat03",
    cat: "math",
    truth: true,
    enQ: "Does a triangle have three sides?",
    plQ: "Czy trójkąt ma trzy boki?",
    enFact: "A triangle has three sides.",
    plFact: "Trójkąt ma trzy boki.",
  },
  {
    id: "mat04",
    cat: "math",
    truth: false,
    enQ: "Does a square have five sides?",
    plQ: "Czy kwadrat ma pięć boków?",
    enFact: "A square does not have five sides.",
    plFact: "Kwadrat nie ma pięciu boków.",
  },
  {
    id: "mat05",
    cat: "math",
    truth: true,
    enQ: "Does one plus one equal two?",
    plQ: "Czy jeden plus jeden równa się dwa?",
    enFact: "One plus one equals two.",
    plFact: "Jeden plus jeden równa się dwa.",
  },
  {
    id: "mat06",
    cat: "math",
    truth: true,
    enQ: "Is four bigger than two?",
    plQ: "Czy cztery jest większe od dwóch?",
    enFact: "Four is bigger than two.",
    plFact: "Cztery jest większe od dwóch.",
  },
  {
    id: "mat07",
    cat: "math",
    truth: false,
    enQ: "Is three bigger than ten?",
    plQ: "Czy trzy jest większe od dziesięciu?",
    enFact: "Three is not bigger than ten.",
    plFact: "Trzy nie jest większe od dziesięciu.",
  },
  {
    id: "mat08",
    cat: "math",
    truth: false,
    enQ: "Does a circle have corners?",
    plQ: "Czy koło ma rogi?",
    enFact: "A circle has no corners.",
    plFact: "Koło nie ma rogów.",
  },
  {
    id: "mat09",
    cat: "math",
    truth: true,
    enQ: "Is ten bigger than one?",
    plQ: "Czy dziesięć jest większe od jednego?",
    enFact: "Ten is bigger than one.",
    plFact: "Dziesięć jest większe od jednego.",
  },
  {
    id: "mat10",
    cat: "math",
    truth: true,
    enQ: "Does a square have four sides?",
    plQ: "Czy kwadrat ma cztery boki?",
    enFact: "A square has four sides.",
    plFact: "Kwadrat ma cztery boki.",
  },
  {
    id: "mat11",
    cat: "math",
    truth: false,
    enQ: "Does one week have eight days?",
    plQ: "Czy tydzień ma osiem dni?",
    enFact: "A week does not have eight days.",
    plFact: "Tydzień nie ma ośmiu dni.",
  },
  {
    id: "mat12",
    cat: "math",
    truth: true,
    enQ: "Does three come after two?",
    plQ: "Czy trzy jest po dwóch?",
    enFact: "Three comes after two.",
    plFact: "Trzy jest po dwóch.",
  },
  {
    id: "mat13",
    cat: "math",
    truth: false,
    enQ: "Is zero bigger than five?",
    plQ: "Czy zero jest większe od pięciu?",
    enFact: "Zero is not bigger than five.",
    plFact: "Zero nie jest większe od pięciu.",
  },
  {
    id: "mat14",
    cat: "math",
    truth: true,
    enQ: "Does two times two equal four?",
    plQ: "Czy dwa razy dwa równa się cztery?",
    enFact: "Two times two equals four.",
    plFact: "Dwa razy dwa równa się cztery.",
  },
  {
    id: "mat15",
    cat: "math",
    truth: false,
    enQ: "Is ten smaller than five?",
    plQ: "Czy dziesięć jest mniejsze od pięciu?",
    enFact: "Ten is not smaller than five.",
    plFact: "Dziesięć nie jest mniejsze od pięciu.",
  },
  {
    id: "mat16",
    cat: "math",
    truth: false,
    enQ: "Is one the same number as ten?",
    plQ: "Czy jeden to ta sama liczba co dziesięć?",
    enFact: "One and ten are different numbers.",
    plFact: "Jeden i dziesięć to różne liczby.",
  },
  {
    id: "mat17",
    cat: "math",
    truth: false,
    tone: "playful",
    enQ: "Does a triangle have a belly button?",
    plQ: "Czy trójkąt ma pępek?",
    enFact: "A triangle does not have a belly button.",
    plFact: "Trójkąt nie ma pępka.",
  },
  {
    id: "mat18",
    cat: "math",
    truth: true,
    tone: "playful",
    enQ: "Can two socks make a pair?",
    plQ: "Czy dwie skarpetki mogą tworzyć parę?",
    enFact: "Two socks can make a pair.",
    plFact: "Dwie skarpetki mogą tworzyć parę.",
  },
  {
    id: "mat19",
    cat: "math",
    truth: true,
    enQ: "Does zero come before one?",
    plQ: "Czy zero jest przed jedynką?",
    enFact: "Zero comes before one.",
    plFact: "Zero jest przed jedynką.",
  },
  {
    id: "mat20",
    cat: "math",
    truth: false,
    enQ: "Is a circle a square?",
    plQ: "Czy koło jest kwadratem?",
    enFact: "A circle is not a square.",
    plFact: "Koło nie jest kwadratem.",
  },
  {
    id: "mat21",
    cat: "math",
    truth: true,
    enQ: "Does a pair mean two?",
    plQ: "Czy para oznacza dwa?",
    enFact: "A pair means two.",
    plFact: "Para oznacza dwa.",
  },
  {
    id: "mat22",
    cat: "math",
    truth: false,
    enQ: "Does zero mean ten?",
    plQ: "Czy zero oznacza dziesięć?",
    enFact: "Zero does not mean ten.",
    plFact: "Zero nie oznacza dziesięciu.",
  },
  {
    id: "mat23",
    cat: "math",
    truth: true,
    enQ: "Can a square be split into two parts?",
    plQ: "Czy kwadrat można podzielić na dwie części?",
    enFact: "A square can be split into two parts.",
    plFact: "Kwadrat można podzielić na dwie części.",
  },
  {
    id: "mat24",
    cat: "math",
    truth: false,
    enQ: "Does a triangle have round sides?",
    plQ: "Czy trójkąt ma okrągłe boki?",
    enFact: "A triangle does not have round sides.",
    plFact: "Trójkąt nie ma okrągłych boków.",
  },
  {
    id: "mat25",
    cat: "math",
    truth: true,
    enQ: "Is ten bigger than nine?",
    plQ: "Czy dziesięć jest większe od dziewięciu?",
    enFact: "Ten is bigger than nine.",
    plFact: "Dziesięć jest większe od dziewięciu.",
  },
  {
    id: "mat26",
    cat: "math",
    truth: false,
    enQ: "Is nine smaller than four?",
    plQ: "Czy dziewięć jest mniejsze od czterech?",
    enFact: "Nine is not smaller than four.",
    plFact: "Dziewięć nie jest mniejsze od czterech.",
  },
  {
    id: "mat27",
    cat: "math",
    truth: true,
    tone: "playful",
    enQ: "Is half a cookie smaller than a whole cookie?",
    plQ: "Czy pół ciastka jest mniejsze od całego ciastka?",
    enFact: "Half a cookie is smaller than a whole cookie.",
    plFact: "Pół ciastka jest mniejsze od całego ciastka.",
  },
  {
    id: "mat28",
    cat: "math",
    truth: false,
    tone: "playful",
    enQ: "Can zero cookies fill a jar?",
    plQ: "Czy zero ciastek może napełnić słoik?",
    enFact: "Zero cookies cannot fill a jar.",
    plFact: "Zero ciastek nie napełni słoika.",
  },
  {
    id: "mat29",
    cat: "math",
    truth: true,
    tone: "playful",
    enQ: "Can three toy ducks make one row?",
    plQ: "Czy trzy kaczuszki mogą utworzyć jeden rząd?",
    enFact: "Three toy ducks can make one row.",
    plFact: "Trzy kaczuszki mogą utworzyć jeden rząd.",
  },
  {
    id: "mat30",
    cat: "math",
    truth: false,
    tone: "playful",
    enQ: "Can a square sing a song?",
    plQ: "Czy kwadrat może zaśpiewać piosenkę?",
    enFact: "A square cannot sing a song.",
    plFact: "Kwadrat nie może śpiewać.",
  },
  // Food: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "foo01",
    cat: "food",
    truth: true,
    enQ: "Are apples food?",
    plQ: "Czy jabłka są jedzeniem?",
    enFact: "Apples are food.",
    plFact: "Jabłka są jedzeniem.",
  },
  {
    id: "foo02",
    cat: "food",
    truth: false,
    enQ: "Is milk made of rocks?",
    plQ: "Czy mleko jest zrobione z kamieni?",
    enFact: "Milk is not made of rocks.",
    plFact: "Mleko nie jest z kamieni.",
  },
  {
    id: "foo03",
    cat: "food",
    truth: true,
    enQ: "Can ice cream be cold?",
    plQ: "Czy lody mogą być zimne?",
    enFact: "Ice cream can be cold.",
    plFact: "Lody mogą być zimne.",
  },
  {
    id: "foo04",
    cat: "food",
    truth: false,
    enQ: "Is toast a drink?",
    plQ: "Czy tost jest napojem?",
    enFact: "Toast is not a drink.",
    plFact: "Tost nie jest napojem.",
  },
  {
    id: "foo05",
    cat: "food",
    truth: true,
    enQ: "Do bananas have peels?",
    plQ: "Czy banany mają skórki?",
    enFact: "Bananas have peels.",
    plFact: "Banany mają skórki.",
  },
  {
    id: "foo06",
    cat: "food",
    truth: false,
    enQ: "Does soup grow on trees?",
    plQ: "Czy zupa rośnie na drzewach?",
    enFact: "Soup does not grow on trees.",
    plFact: "Zupa nie rośnie na drzewach.",
  },
  {
    id: "foo07",
    cat: "food",
    truth: true,
    enQ: "Can bread be sliced?",
    plQ: "Czy chleb można kroić?",
    enFact: "Bread can be sliced.",
    plFact: "Chleb można kroić.",
  },
  {
    id: "foo08",
    cat: "food",
    truth: false,
    enQ: "Is a carrot made of chocolate?",
    plQ: "Czy marchewka jest z czekolady?",
    enFact: "A carrot is not chocolate.",
    plFact: "Marchewka nie jest z czekolady.",
  },
  {
    id: "foo09",
    cat: "food",
    truth: true,
    enQ: "Do people drink water?",
    plQ: "Czy ludzie piją wodę?",
    enFact: "People drink water.",
    plFact: "Ludzie piją wodę.",
  },
  {
    id: "foo10",
    cat: "food",
    truth: false,
    enQ: "Do lemons bark?",
    plQ: "Czy cytryny szczekają?",
    enFact: "Lemons do not bark.",
    plFact: "Cytryny nie szczekają.",
  },
  {
    id: "foo11",
    cat: "food",
    truth: true,
    enQ: "Can cereal go in a bowl?",
    plQ: "Czy płatki można wsypać do miski?",
    enFact: "Cereal can go in a bowl.",
    plFact: "Płatki można wsypać do miski.",
  },
  {
    id: "foo12",
    cat: "food",
    truth: false,
    enQ: "Is cheese a shoe?",
    plQ: "Czy ser jest butem?",
    enFact: "Cheese is not a shoe.",
    plFact: "Ser nie jest butem.",
  },
  {
    id: "foo13",
    cat: "food",
    truth: true,
    enQ: "Are eggs food?",
    plQ: "Czy jajka są jedzeniem?",
    enFact: "Eggs are food.",
    plFact: "Jajka są jedzeniem.",
  },
  {
    id: "foo14",
    cat: "food",
    truth: false,
    enQ: "Is ketchup a pencil?",
    plQ: "Czy ketchup jest ołówkiem?",
    enFact: "Ketchup is not a pencil.",
    plFact: "Ketchup nie jest ołówkiem.",
  },
  {
    id: "foo15",
    cat: "food",
    truth: true,
    enQ: "Can people eat popcorn?",
    plQ: "Czy ludzie mogą jeść popcorn?",
    enFact: "People can eat popcorn.",
    plFact: "Ludzie mogą jeść popcorn.",
  },
  {
    id: "foo16",
    cat: "food",
    truth: false,
    enQ: "Do onions have wheels?",
    plQ: "Czy cebule mają koła?",
    enFact: "Onions do not have wheels.",
    plFact: "Cebule nie mają kół.",
  },
  {
    id: "foo17",
    cat: "food",
    truth: true,
    enQ: "Can soup be warm?",
    plQ: "Czy zupa może być ciepła?",
    enFact: "Soup can be warm.",
    plFact: "Zupa może być ciepła.",
  },
  {
    id: "foo18",
    cat: "food",
    truth: false,
    enQ: "Is a sandwich a planet?",
    plQ: "Czy kanapka jest planetą?",
    enFact: "A sandwich is not a planet.",
    plFact: "Kanapka nie jest planetą.",
  },
  {
    id: "foo19",
    cat: "food",
    truth: true,
    enQ: "Do oranges contain juice?",
    plQ: "Czy pomarańcze zawierają sok?",
    enFact: "Oranges contain juice.",
    plFact: "Pomarańcze zawierają sok.",
  },
  {
    id: "foo20",
    cat: "food",
    truth: false,
    enQ: "Is sugar salty?",
    plQ: "Czy cukier jest słony?",
    enFact: "Sugar is not salty.",
    plFact: "Cukier nie jest słony.",
  },
  {
    id: "foo21",
    cat: "food",
    truth: true,
    enQ: "Can butter melt?",
    plQ: "Czy masło może się stopić?",
    enFact: "Butter can melt.",
    plFact: "Masło może się stopić.",
  },
  {
    id: "foo22",
    cat: "food",
    truth: false,
    enQ: "Is a potato a book?",
    plQ: "Czy ziemniak jest książką?",
    enFact: "A potato is not a book.",
    plFact: "Ziemniak nie jest książką.",
  },
  {
    id: "foo23",
    cat: "food",
    truth: true,
    enQ: "Can cooked noodles bend?",
    plQ: "Czy ugotowany makaron może się zginać?",
    enFact: "Cooked noodles can bend.",
    plFact: "Ugotowany makaron może się zginać.",
  },
  {
    id: "foo24",
    cat: "food",
    truth: false,
    enQ: "Does juice wear socks?",
    plQ: "Czy sok nosi skarpetki?",
    enFact: "Juice does not wear socks.",
    plFact: "Sok nie nosi skarpetek.",
  },
  {
    id: "foo25",
    cat: "food",
    truth: true,
    tone: "playful",
    enQ: "Can spaghetti dangle from a fork?",
    plQ: "Czy spaghetti może zwisać z widelca?",
    enFact: "Spaghetti can dangle from a fork.",
    plFact: "Spaghetti może zwisać z widelca.",
  },
  {
    id: "foo26",
    cat: "food",
    truth: false,
    tone: "playful",
    enQ: "Can a sandwich sing opera?",
    plQ: "Czy kanapka może śpiewać operę?",
    enFact: "A sandwich cannot sing opera.",
    plFact: "Kanapka nie może śpiewać opery.",
  },
  {
    id: "foo27",
    cat: "food",
    truth: true,
    tone: "playful",
    enQ: "Can peas roll off a plate?",
    plQ: "Czy groszek może stoczyć się z talerza?",
    enFact: "Peas can roll off a plate.",
    plFact: "Groszek może stoczyć się z talerza.",
  },
  {
    id: "foo28",
    cat: "food",
    truth: false,
    tone: "playful",
    enQ: "Can a banana answer a phone?",
    plQ: "Czy banan może odebrać telefon?",
    enFact: "A banana cannot answer a phone.",
    plFact: "Banan nie może odebrać telefonu.",
  },
  {
    id: "foo29",
    cat: "food",
    truth: true,
    tone: "playful",
    enQ: "Can jelly wobble on a plate?",
    plQ: "Czy galaretka może trząść się na talerzu?",
    enFact: "Jelly can wobble on a plate.",
    plFact: "Galaretka może trząść się na talerzu.",
  },
  {
    id: "foo30",
    cat: "food",
    truth: false,
    tone: "playful",
    enQ: "Can a carrot drive a bus?",
    plQ: "Czy marchewka może prowadzić autobus?",
    enFact: "A carrot cannot drive a bus.",
    plFact: "Marchewka nie może prowadzić autobusu.",
  },
  // Everyday: 30 records (15 Yes, 15 No, 6 playful)
  {
    id: "day01",
    cat: "everyday",
    truth: true,
    enQ: "Do people wear shoes on their feet?",
    plQ: "Czy ludzie noszą buty na stopach?",
    enFact: "People wear shoes on their feet.",
    plFact: "Ludzie noszą buty na stopach.",
  },
  {
    id: "day02",
    cat: "everyday",
    truth: false,
    enQ: "Is a chair a toothbrush?",
    plQ: "Czy krzesło jest szczoteczką do zębów?",
    enFact: "A chair is not a toothbrush.",
    plFact: "Krzesło nie jest szczoteczką do zębów.",
  },
  {
    id: "day03",
    cat: "everyday",
    truth: true,
    enQ: "Can a door open?",
    plQ: "Czy drzwi mogą się otworzyć?",
    enFact: "A door can open.",
    plFact: "Drzwi mogą się otworzyć.",
  },
  {
    id: "day04",
    cat: "everyday",
    truth: false,
    enQ: "Do pencils have toes?",
    plQ: "Czy ołówki mają palce u nóg?",
    enFact: "Pencils do not have toes.",
    plFact: "Ołówki nie mają palców u nóg.",
  },
  {
    id: "day05",
    cat: "everyday",
    truth: true,
    enQ: "Do clocks show time?",
    plQ: "Czy zegary pokazują czas?",
    enFact: "Clocks show time.",
    plFact: "Zegary pokazują czas.",
  },
  {
    id: "day06",
    cat: "everyday",
    truth: false,
    enQ: "Is a pillow a pencil?",
    plQ: "Czy poduszka jest ołówkiem?",
    enFact: "A pillow is not a pencil.",
    plFact: "Poduszka nie jest ołówkiem.",
  },
  {
    id: "day07",
    cat: "everyday",
    truth: true,
    enQ: "Can a zipper close a jacket?",
    plQ: "Czy zamek może zapiąć kurtkę?",
    enFact: "A zipper can close a jacket.",
    plFact: "Zamek może zapiąć kurtkę.",
  },
  {
    id: "day08",
    cat: "everyday",
    truth: false,
    enQ: "Do spoons have elbows?",
    plQ: "Czy łyżki mają łokcie?",
    enFact: "Spoons do not have elbows.",
    plFact: "Łyżki nie mają łokci.",
  },
  {
    id: "day09",
    cat: "everyday",
    truth: true,
    enQ: "Do bicycles have wheels?",
    plQ: "Czy rowery mają koła?",
    enFact: "Bicycles have wheels.",
    plFact: "Rowery mają koła.",
  },
  {
    id: "day10",
    cat: "everyday",
    truth: false,
    enQ: "Is a window a shoe?",
    plQ: "Czy okno jest butem?",
    enFact: "A window is not a shoe.",
    plFact: "Okno nie jest butem.",
  },
  {
    id: "day11",
    cat: "everyday",
    truth: true,
    enQ: "Can a key open a lock?",
    plQ: "Czy klucz może otworzyć zamek?",
    enFact: "A key can open a lock.",
    plFact: "Klucz może otworzyć zamek.",
  },
  {
    id: "day12",
    cat: "everyday",
    truth: false,
    enQ: "Can a bed drive on roads?",
    plQ: "Czy łóżko może jeździć po drogach?",
    enFact: "A bed cannot drive on roads.",
    plFact: "Łóżko nie może jeździć po drogach.",
  },
  {
    id: "day13",
    cat: "everyday",
    truth: true,
    enQ: "Do people sit on chairs?",
    plQ: "Czy ludzie siedzą na krzesłach?",
    enFact: "People sit on chairs.",
    plFact: "Ludzie siedzą na krzesłach.",
  },
  {
    id: "day14",
    cat: "everyday",
    truth: false,
    enQ: "Is a sock a refrigerator?",
    plQ: "Czy skarpetka jest lodówką?",
    enFact: "A sock is not a refrigerator.",
    plFact: "Skarpetka nie jest lodówką.",
  },
  {
    id: "day15",
    cat: "everyday",
    truth: true,
    enQ: "Can an umbrella block rain?",
    plQ: "Czy parasol może chronić przed deszczem?",
    enFact: "An umbrella can block rain.",
    plFact: "Parasol może chronić przed deszczem.",
  },
  {
    id: "day16",
    cat: "everyday",
    truth: false,
    enQ: "Can a book brush teeth?",
    plQ: "Czy książka może myć zęby?",
    enFact: "A book cannot brush teeth.",
    plFact: "Książka nie może myć zębów.",
  },
  {
    id: "day17",
    cat: "everyday",
    truth: true,
    enQ: "Can a towel dry wet hands?",
    plQ: "Czy ręcznik może osuszyć mokre dłonie?",
    enFact: "A towel can dry wet hands.",
    plFact: "Ręcznik może osuszyć mokre dłonie.",
  },
  {
    id: "day18",
    cat: "everyday",
    truth: false,
    enQ: "Are towels made of metal?",
    plQ: "Czy ręczniki są zrobione z metalu?",
    enFact: "Towels are not made of metal.",
    plFact: "Ręczniki nie są z metalu.",
  },
  {
    id: "day19",
    cat: "everyday",
    truth: true,
    enQ: "Can a swing move back and forth?",
    plQ: "Czy huśtawka może poruszać się w przód i w tył?",
    enFact: "A swing can move back and forth.",
    plFact: "Huśtawka może poruszać się w przód i w tył.",
  },
  {
    id: "day20",
    cat: "everyday",
    truth: false,
    enQ: "Can scissors drink water?",
    plQ: "Czy nożyczki mogą pić wodę?",
    enFact: "Scissors cannot drink water.",
    plFact: "Nożyczki nie mogą pić wody.",
  },
  {
    id: "day21",
    cat: "everyday",
    truth: true,
    enQ: "Can buses carry people?",
    plQ: "Czy autobusy mogą wozić ludzi?",
    enFact: "Buses can carry people.",
    plFact: "Autobusy mogą wozić ludzi.",
  },
  {
    id: "day22",
    cat: "everyday",
    truth: false,
    enQ: "Is a blanket a bicycle?",
    plQ: "Czy koc jest rowerem?",
    enFact: "A blanket is not a bicycle.",
    plFact: "Koc nie jest rowerem.",
  },
  {
    id: "day23",
    cat: "everyday",
    truth: true,
    enQ: "Can a backpack carry books?",
    plQ: "Czy plecak może nosić książki?",
    enFact: "A backpack can carry books.",
    plFact: "Plecak może nosić książki.",
  },
  {
    id: "day24",
    cat: "everyday",
    truth: false,
    enQ: "Do cups have knees?",
    plQ: "Czy kubki mają kolana?",
    enFact: "Cups do not have knees.",
    plFact: "Kubki nie mają kolan.",
  },
  {
    id: "day25",
    cat: "everyday",
    truth: true,
    tone: "playful",
    enQ: "Can a sock cover your hand?",
    plQ: "Czy skarpetka może zakryć dłoń?",
    enFact: "A sock can cover a hand.",
    plFact: "Skarpetka może zakryć dłoń.",
  },
  {
    id: "day26",
    cat: "everyday",
    truth: false,
    tone: "playful",
    enQ: "Can a toothbrush tell jokes?",
    plQ: "Czy szczoteczka może opowiadać dowcipy?",
    enFact: "A toothbrush cannot tell jokes.",
    plFact: "Szczoteczka nie opowiada dowcipów.",
  },
  {
    id: "day27",
    cat: "everyday",
    truth: true,
    tone: "playful",
    enQ: "Can a hat cover your head?",
    plQ: "Czy kapelusz może zakryć głowę?",
    enFact: "A hat can cover your head.",
    plFact: "Kapelusz może zakryć głowę.",
  },
  {
    id: "day28",
    cat: "everyday",
    truth: false,
    tone: "playful",
    enQ: "Can a chair eat lunch?",
    plQ: "Czy krzesło może jeść obiad?",
    enFact: "A chair cannot eat lunch.",
    plFact: "Krzesło nie może jeść obiadu.",
  },
  {
    id: "day29",
    cat: "everyday",
    truth: true,
    tone: "playful",
    enQ: "Can a paper airplane glide?",
    plQ: "Czy papierowy samolot może szybować?",
    enFact: "A paper airplane can glide.",
    plFact: "Papierowy samolot może szybować.",
  },
  {
    id: "day30",
    cat: "everyday",
    truth: false,
    tone: "playful",
    enQ: "Can a sock drive a bus?",
    plQ: "Czy skarpetka może prowadzić autobus?",
    enFact: "A sock cannot drive a bus.",
    plFact: "Skarpetka nie może prowadzić autobusu.",
  },
];
```

### 20.4 Required Content Assertions

The implementation must include a pure `validateQuestionBank(questions)`
function that checks section 20.2 and returns an array of human-readable
errors. In production, a validation failure must prevent Start and show a
generic localized load error; detailed errors appear only under `?debug=1`.

The implementation agent must not silently edit factual meaning or translation
while copying the database. Any proposed content correction should update this
document and the implementation together so the handoff remains the source of
truth until release.

```

```
