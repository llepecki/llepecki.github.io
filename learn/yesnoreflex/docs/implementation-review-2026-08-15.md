# Yes / No Reflex: Implementation Review

> **Remediation status (2026-08-16).** Applied to `yesnoreflex/index.html`,
> `yesnoreflex/docs/req.md`, and `tools/yesnoreflex-rules-check.mjs`: R1–R6
> (plus additional verified findings from an independent adversarial review:
> modifier-key chord guard, `[hidden]`-vs-flex phantom-element fixes, timeout
> tone recolored off the cue palette, SWITCH badge moved to the neutral accent
> palette, larger reserved feedback height, summary snapshot of the finished
> session's mode, overlay closing on key-up); all 45 in-place record rewrites
> from section 10.7; the 12 playful records from section 9 with the section 7.2
> quotas, adjacency rule, and fallback allocations. Gates: rules checker 155
> checks green (10,000 sessions per level incl. playful invariants), repo
> code-review 0 findings, 132 headless DOM checks green, app/spec bank
> verbatim-identical (108/108). The headless DOM checks cited here are now
> committed as `tools/yesnoreflex-dom-check.mjs` (`npm run
> yesnoreflex-dom-check`), with browser-level layout checks in
> `tools/yesnoreflex-layout-check.mjs`. **Still open (human steps):** fluent-Polish
> content review, child reflex-fit validation (section 10.8), the live manual
> browser matrix in section 8 with a screen reader, and the moderated-testing
> exit criteria in section 11. Delete this file once those complete.

> **Question bank superseded (2026-08-17) — see
> `yesnoreflex/docs/implementation-review-round-4-2026-08-16.md`.** Every
> question-bank total, per-category quota, and question-selection instruction
> in this document describes the retired 108-record, six-category bank. The
> shipped bank is now the 240-record, eight-category bank in that review's
> Appendix A, with a two-tier recency history. Non-content findings in this
> document remain applied.

Review date: `2026-08-15`

Reviewed implementation: `yesnoreflex/index.html`

Design baseline: `yesnoreflex/docs/req.md` and `CLAUDE.md`

Rules checker: `tools/yesnoreflex-rules-check.mjs`

This is a read-only implementation review and change request. No application
code was changed as part of the review.

## 1. Executive Summary

The implementation is substantially complete and its rules foundation is
strong. It is ready for targeted remediation, but it should not be considered
release-ready until the screen-reader cue problem and the response-time
accounting problem are fixed.

Automated evidence (historical — reflects the 96-question bank reviewed on
2026-08-15; superseded by the 108-record bank and the expanded checkers, see
the remediation banner above and the round-2 review):

- `npm run code-review -- yesnoreflex/index.html`: **0 findings**,
- `node tools/yesnoreflex-rules-check.mjs`: **147 checks passed**,
- generator stress coverage: **10,000 valid sessions at each level**,
- the 96 records in `yesnoreflex/index.html` exactly match the question bank in
  `yesnoreflex/docs/req.md`,
- the reflex-fit audit in section 10 reviewed all 96 current records and all 12
  proposed playful records; **45 current records and 9 proposed records must be
  replaced or rewritten** because they introduce avoidable knowledge,
  vocabulary, reasoning, wording, or ambiguity load,
- no `innerHTML`, inline event handlers, external JavaScript, secrets, or
  unsafe user-controlled HTML paths were found.

A live browser pass was attempted but could not be completed because no
browser connection was available in the review environment. The manual matrix
in section 8 remains required after remediation.

## 2. Review Ratings

| Dimension | Rating | Assessment |
|---|---|---|
| Security | Strong | Static, local-only app with no unsafe HTML construction or sensitive data |
| Performance | Strong | Deadline-driven `requestAnimationFrame`; bounded generation; no permanent animation loop |
| Correctness | Needs small fixes | Core rules are verified; pause accounting and best-score presentation are wrong |
| Maintainability | Strong | Required single-file architecture is well sectioned; pure rules are independently tested |
| Accessibility | Not ready | The current signal is unavailable to screen readers and selection state is incomplete |
| Content/design | Needs revision | The bank is balanced and bilingual, but 45 current and 9 proposed records fail the complete reflex-fit standard in section 10 |

## 3. Findings And Recommended Fixes

### R1 — High — The Current Cue Is Unavailable To Screen Readers

Evidence:

- `yesnoreflex/index.html:1339` marks the whole current cue SVG
  `aria-hidden="true"`.
- `yesnoreflex/index.html:4306` announces only the active dimension during the
  cue phase.
- `yesnoreflex/index.html:4335` announces only the question in Sprint.
- Practice announces the active dimension and question, but still does not
  announce whether the current cue means FACT or FLIP.

Impact:

A screen-reader user can hear `FOLLOW SHAPE` and the question but cannot know
whether the visible shape is a triangle or circle. The core decision is
therefore impossible. This violates the P0 requirement that the game be
operable by assistive technology.

Best fix:

1. Keep the SVG itself decorative. Do not expose its internal paths and
   circles as a noisy graphics tree.
2. Add one visually hidden DOM element in the playfield, for example
   `#currentCueDescription`.
3. Add a pure helper that derives the active cue description from the trial:

   ```js
   function activeCueDescription(trial) {
     if (trial.activeRule === "color") {
       return trial.colorCue === "gold"
         ? T("activeGoldFlip")
         : T("activeBlueFact");
     }
     return trial.shapeCue === "circle"
       ? T("activeCircleFlip")
       : T("activeTriangleFact");
   }
   ```

4. Author complete strings in both languages. Examples:

   ```text
   Active color: solid blue — FACT.
   Active shape: circle — FLIP.
   Aktywny kolor: pełny niebieski — FAKT.
   Aktywny kształt: koło — ODWRÓĆ.
   ```

5. On question reveal, announce one complete message:

   ```text
   FOLLOW SHAPE. Active shape: circle — FLIP. Is the Sun a star?
   ```

   A complete single announcement is preferable to two rapid polite-live
   updates because the second update can replace the first before it is read.
6. Use the same helper in Practice and every interactive tutorial step.
7. Update the hidden description on language change without changing the
   trial, cue, timer, or expected answer.

Acceptance tests:

- With the screen hidden, a screen-reader user can determine active dimension,
  active cue, FACT/FLIP action, and question.
- All four mixed cue combinations are announced correctly under both active
  dimensions and both languages.
- A language change during a question updates the description without
  restarting time.
- The visible SVG remains ignored so the cue is not announced twice.

### R2 — Medium — Pause Time Inflates Median Response Time

Evidence:

- `yesnoreflex/index.html:4325` records `questionShownAt` once.
- `yesnoreflex/index.html:4366` computes `responseMs` as current wall time minus
  that original timestamp.
- `yesnoreflex/index.html:4477–4519` freezes and restores the countdown but does
  not remove the pause and three-second resume count-in from `responseMs`.

Impact:

Scoring remains correct because it uses the frozen remaining time, but the
summary median can be inflated by any amount. A child who pauses for one minute
can receive a roughly one-minute response time even though the active response
window was only four to eight seconds.

Best fix:

For Sprint, derive response time from the already authoritative countdown:

```js
const limit = PACES[state.pace];
const remaining = clockRemaining();
const responseMs = clamp(limit - remaining, 0, limit);
```

Capture `remaining` before `cancelClock()`. Continue using wall-clock elapsed
time for untimed Practice, or explicitly omit Practice median if product review
decides it is not meaningful.

This is safer than incrementally adjusting `questionShownAt` because it makes
the response metric and scoring use the same pause-aware clock.

Acceptance tests:

- Answer after 1.5 seconds of active play, with a 30-second pause between: the
  stored response time remains approximately 1.5 seconds.
- The three-second resume count-in is excluded.
- Multiple pause/resume cycles remain excluded.
- Every Sprint `responseMs` is between zero and the selected pace limit.
- Score and timeout behavior remain unchanged.

### R3 — Medium — Tutorial Keyboard Shortcuts Are Suppressed At Initial Focus

Evidence:

- `yesnoreflex/index.html:4825` puts initial focus on the tutorial Exit button,
  inside `.intro-panel`.
- `yesnoreflex/index.html:5181–5188` calls the tutorial shortcut handler only
  when focus is outside that panel, except for Escape.
- Therefore Y/N/T and Left/Right do not answer the first interactive tutorial
  step from the initial focus position.

Impact:

The tutorial remains theoretically reachable through repeated Tab navigation,
but the documented shortcuts fail exactly where a keyboard-only first-time
user needs them. This is an avoidable onboarding barrier.

Best fix:

1. Route tutorial answer shortcuts regardless of whether focus is in the intro
   panel. There are no text inputs whose editing behavior needs protection.
2. Preserve native Enter and Space activation on focused buttons.
3. On entry to an interactive tutorial step, move focus to the Yes button or
   to a focusable stage instruction immediately before the answer row.
4. On non-interactive steps, focus the step title or Next button so the new
   content and available action are clear.
5. Do not move focus on every render; move it only when the tutorial step
   changes.

Acceptance tests:

- From the automatically focused element on tutorial step 1, Y/N and
  Left/Right submit answers.
- In Polish, T/N work; Y does not submit Yes.
- Arrow keys navigate non-interactive tutorial steps.
- Escape exits from every tutorial step.
- Enter/Space continue to activate the focused Exit, Prev, Next, or Start
  button normally.

### R4 — Medium — Mode, Difficulty, And Pace Do Not Expose Selection State

Evidence:

- `yesnoreflex/index.html:1579–1629` implements the three exclusive setting
  groups as ordinary buttons.
- `yesnoreflex/index.html:4568–4578` changes only the visual `.active` class.
- No `aria-pressed`, radio-group semantics, or equivalent selected state is
  present.

Impact:

Screen readers announce each option as a button but cannot tell which mode,
difficulty, or pace is selected. This fails accessible name/role/value
expectations even though pointer and keyboard activation work.

Best fix:

Keep the established segmented-button design and add `aria-pressed`. A shared
helper prevents state drift:

```js
function setPressed(button, pressed) {
  button.classList.toggle("active", pressed);
  button.setAttribute("aria-pressed", pressed ? "true" : "false");
}
```

Use it for all mode, difficulty, and pace buttons in
`renderSessionControls()`. Add correct initial `aria-pressed` values in static
HTML so pre-initialization semantics agree with the initial visual state.

Do not add `role="radio"` unless the implementation also adds a radiogroup,
`aria-checked`, and the expected arrow-key/roving-tabindex behavior.

Acceptance tests:

- Exactly one button in each visible segmented group has
  `aria-pressed="true"`.
- State remains correct after selection, saved-preference load, mode changes,
  and language changes.
- Pace is hidden in Practice and returns with its previous selection in Sprint.

### R5 — Low — The Best Row Shows The Previous Score Instead Of The Best Score

Evidence:

- `yesnoreflex/index.html:4451–4454` loads the old value into `prevBest`, then
  saves a new record without updating the value used for display.
- `yesnoreflex/index.html:4724–4733` displays `prevBest` and appends `new!`.

Impact:

The first completed Sprint renders `— new!`. A later record renders the older,
lower score with `new!`. The persisted value is correct, but the visible
summary is misleading.

Best fix:

Calculate both values explicitly:

```js
const previousBest = loadBest(key);
const currentBest = Math.max(previousBest === null ? 0 : previousBest, state.score);
state.previousBest = previousBest;
state.displayBest = currentBest;
state.newBest = previousBest === null || state.score > previousBest;
if (state.newBest) saveBest(key, currentBest);
```

Render `displayBest` under the existing `Best` label. If the product actually
wants to show the old record, rename the row `Previous best`; displaying the
current best is clearer and matches the existing label.

Acceptance tests:

- First completed Sprint: Best equals Score and carries `new!`.
- New record: Best equals the new Score and carries `new!`.
- Lower later score: Best remains the stored higher value without `new!`.
- Best remains isolated by difficulty and pace.

### R6 — Low — Restricted Storage Skips The First-Run Tutorial

Evidence:

- `yesnoreflex/index.html:4097–4102` returns `true` from `introSeen()` when
  localStorage throws.

Impact:

Users in hardened/private environments can skip the essential first-run
explanation of a non-obvious rule system. The rest of the app correctly treats
storage as optional, so onboarding should degrade consistently.

Best fix:

Return `false` on storage failure:

```js
function introSeen() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.intro) === "1";
  } catch {
    return false;
  }
}
```

The tutorial may reappear on the next page load when storage remains blocked.
That is safer than silently skipping it, and the user can still exit it
immediately.

Acceptance tests:

- Empty storage opens the tutorial.
- Stored value `"1"` opens setup.
- A throwing localStorage getter opens the tutorial and does not crash.
- Exiting the tutorial still reaches setup if the completion marker cannot be
  saved.

## 4. Positive Observations To Preserve

- The implementation correctly separates factual truth, cue inversion, and
  expected game answer.
- Feedback explicitly states all three layers and does not accuse the child of
  not knowing a fact.
- Yes/No positions remain stable.
- Color is reinforced with solid/striped patterns.
- Practice provides the full game without a timer.
- The countdown uses `performance.now()` and freezes the authoritative
  deadline on blur, visibility loss, and pause.
- Answer submission is synchronously guarded against double input.
- Language changes preserve the current trial and timer.
- The generator has bounded retries, deterministic fallback schedules, debug
  seeds, and independent high-volume verification.
- The implementing agent correctly amended an impossible original constraint:
  exact truth and FACT/FLIP balance forces even expected-Yes counts, so Levels
  2–3 must use randomized 8/6 and 10/8 response splits.

## 5. Recommended Remediation Order

1. R1 screen-reader cue description.
2. R2 pause-safe response time.
3. R3 tutorial keyboard flow.
4. R4 segmented-control semantics.
5. R5 best-score display.
6. R6 storage fallback.
7. Replace or rewrite every question rejected by the reflex-fit and clarity
   audit in section 10.
8. Add and verify the revised playful question amendment in section 9.
9. Complete the live manual browser matrix in section 8.

R1–R4 should be fixed before child or accessibility testing. R5–R6 should be
fixed before release.

## 6. Scientific Accuracy Note About Humor

Humor is a sound design direction, but the app and documentation must not claim
that laughing “boosts the hippocampus.” The available evidence does not
establish that causal statement for children:

- A randomized study of 81 elementary-school pupils found that funny videos
  increased positive emotion and improved transfer performance, but it found
  no significant improvement in retention, motivation, or satisfaction:
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9030648/
- A frequently cited humor-and-memory study involved older adults. It discussed
  cortisol and hippocampal damage as background rationale; it did not show
  that laughter enlarged, activated, or otherwise “boosted” the hippocampus in
  children: https://pubmed.ncbi.nlm.nih.gov/24682001/
- Humor comprehension and laughter vary across childhood, and enjoyment should
  not be treated as proof that a child understood the content:
  https://doi.org/10.1016/j.jecp.2019.104709

Defensible design rationale:

> Playful factual incongruity may increase enjoyment, attention, and the
> distinctiveness of individual trials. This app treats those benefits as a
> product hypothesis to validate with children; it makes no neurological or
> therapeutic claim.

## 7. Playful-Question Design Amendment

### 7.1 Decision

Mix playful questions into the six existing categories instead of creating a
visible `Funny` category.

Reasons:

- a visible Funny category could become an unintended clue that an absurd
  question is probably false,
- mixing preserves category variety and surprise,
- one playful Yes and one playful No per category preserves exact category and
  truth balance,
- the current category scheduler can remain structurally unchanged.

Add 12 records, bringing the bank from 96 to 108:

- 18 records per category,
- 9 factual Yes and 9 factual No records per category,
- 54 factual Yes and 54 factual No records overall.

Tag the 12 new records with `tone: "playful"`. Existing records may omit the
field or use `tone: "standard"`.

### 7.2 Session Quota

Guarantee a small amount of humor without letting it dominate:

| Level | Questions | Playful questions |
|---|---:|---:|
| 1 | 12 | exactly 2 |
| 2 | 14 | exactly 2 |
| 3 | 18 | exactly 3 |

Constraints:

- playful questions are never consecutive,
- their truth values, active rule, FACT/FLIP action, and expected answer are
  governed by the ordinary balancing rules,
- do not deliberately pair absurd false questions with FLIP; that correlation
  would become learnable and weaken the cognitive task,
- the `tone` field affects selection only, never scoring, feedback, timing, or
  cue generation,
- recent-question avoidance applies normally and relaxes rather than failing.

Recommended generator change:

1. Build category and truth slots as today.
2. Identify distinct eligible slots whose category/truth pair has a fresh
   playful record.
3. Select the exact level quota with no adjacent slots.
4. Fill those slots from playful buckets and all other slots from standard
   buckets.
5. Retry the session if the playful quota or adjacency rule cannot be met.
6. Add a deterministic valid playful allocation to each fallback schedule.

### 7.3 Humor-Writing Rules

- Use concrete visual absurdity, surprising animal behavior, or a playful
  everyday image.
- Keep one factual proposition and one unambiguous Yes/No answer.
- Prefer jokes that survive translation; avoid puns, rhyme, idioms, and word
  sounds.
- Do not use sarcasm, humiliation, body shame, danger, death, gross-out humor,
  or jokes targeting a person or group.
- Do not use a negative inside the question.
- Keep the authored explanation completely factual and calm.
- The joke must still work when the cue asks for the ordinary answer; humor
  cannot depend exclusively on a FLIP trial.
- Do not add canned laughter, forced sound, or a “laugh now” animation.

## 8. Manual Browser Matrix After Fixes

The implementing agent should verify:

- first visit with normal, empty, blocked, and corrupt localStorage,
- English and Polish tutorial using pointer and keyboard only,
- every active cue under color and shape rules with a screen reader,
- Sprint pause during cue, question, and feedback,
- multiple pause/resume cycles and blur during the resume count-in,
- first record, improved record, and lower subsequent score,
- all three difficulty levels and paces,
- 360×640, the 720px breakpoint, 1280×720, and 200% zoom,
- normal and reduced motion,
- playful-question quotas across at least 1,000 generated sessions per level.

After changes, rerun:

```bash
npm run code-review -- yesnoreflex/index.html
node tools/yesnoreflex-rules-check.mjs
```

The checker must independently assert:

- 108 records,
- 18 records and 9 true records per category,
- all existing truth-table and schedule invariants,
- exact playful quota per level,
- no adjacent playful trials,
- balanced occurrence of playful true/false questions over stress runs,
- fallback schedules meet the same playful constraints.

## 9. Proposed Playful Question Records

These records are implementation-ready proposals. They require the ordinary
English/Polish content review before release.

```js
// Animals — one No, one Yes
{ id: "ani17", cat: "animals", tone: "playful", truth: false,
  enQ: "Can a snake stomp with its back feet?",
  plQ: "Czy wąż może tupać tylnymi nogami?",
  enFact: "Snakes have no feet to stomp with.",
  plFact: "Węże nie mają nóg, którymi mogłyby tupać." },
{ id: "ani18", cat: "animals", tone: "playful", truth: true,
  enQ: "Can a dog chase its own tail?",
  plQ: "Czy pies może gonić własny ogon?",
  enFact: "A dog can chase its own tail.",
  plFact: "Pies może gonić własny ogon." },

// Human body — one No, one Yes
{ id: "bod17", cat: "body", tone: "playful", truth: false,
  enQ: "Can people breathe through their ears?",
  plQ: "Czy ludzie mogą oddychać uszami?",
  enFact: "People breathe through airways connected to the lungs, not through their ears.",
  plFact: "Ludzie oddychają przez drogi oddechowe połączone z płucami, a nie przez uszy." },
{ id: "bod18", cat: "body", tone: "playful", truth: true,
  enQ: "Can people make funny faces?",
  plQ: "Czy ludzie potrafią robić śmieszne miny?",
  enFact: "People can move their faces to make funny expressions.",
  plFact: "Ludzie mogą poruszać twarzą i robić śmieszne miny." },

// Earth and space — one No, one Yes
{ id: "spa17", cat: "space", tone: "playful", truth: false,
  enQ: "Do astronauts ride bicycles to the Moon?",
  plQ: "Czy astronauci jeżdżą na Księżyc rowerami?",
  enFact: "Astronauts travel into space in spacecraft, not on bicycles.",
  plFact: "Astronauci podróżują w kosmos statkami kosmicznymi, a nie rowerami." },
{ id: "spa18", cat: "space", tone: "playful", truth: true,
  enQ: "Do space rockets fly above the clouds?",
  plQ: "Czy rakiety kosmiczne latają ponad chmurami?",
  enFact: "Space rockets fly above the clouds on their way into space.",
  plFact: "Rakiety kosmiczne lecą ponad chmurami w drodze w kosmos." },

// Nature and weather — one No, one Yes
{ id: "nat17", cat: "nature", tone: "playful", truth: false,
  enQ: "Does lemonade fall from clouds?",
  plQ: "Czy z chmur pada lemoniada?",
  enFact: "Clouds can release water as rain, not lemonade.",
  plFact: "Z chmur może padać woda, a nie lemoniada." },
{ id: "nat18", cat: "nature", tone: "playful", truth: true,
  enQ: "Can strong wind turn an umbrella inside out?",
  plQ: "Czy silny wiatr może wywrócić parasol na drugą stronę?",
  enFact: "Strong wind can push an umbrella inside out.",
  plFact: "Silny wiatr może wywrócić parasol na drugą stronę." },

// Everyday science — one No, one Yes
{ id: "sci17", cat: "science", tone: "playful", truth: false,
  enQ: "Is a cheese sandwich a magnet?",
  plQ: "Czy kanapka z serem jest magnesem?",
  enFact: "A cheese sandwich is food, not a magnet.",
  plFact: "Kanapka z serem jest jedzeniem, a nie magnesem." },
{ id: "sci18", cat: "science", tone: "playful", truth: true,
  enQ: "Can a balloon be bigger than your head?",
  plQ: "Czy balon może być większy od twojej głowy?",
  enFact: "Some inflated balloons are bigger than a person's head.",
  plFact: "Niektóre nadmuchane balony są większe od ludzkiej głowy." },

// Math and measures — one No, one Yes
{ id: "mat17", cat: "math", tone: "playful", truth: false,
  enQ: "Does a triangle grow a fourth side on its birthday?",
  plQ: "Czy trójkątowi wyrasta czwarty bok w dniu urodzin?",
  enFact: "A triangle always has three sides.",
  plFact: "Trójkąt zawsze ma trzy boki." },
{ id: "mat18", cat: "math", tone: "playful", truth: true,
  enQ: "Does two plus two equal four when a cat watches?",
  plQ: "Czy dwa plus dwa równa się cztery, gdy patrzy na to kot?",
  enFact: "Two plus two equals four, even when a cat watches.",
  plFact: "Dwa plus dwa równa się cztery, nawet gdy patrzy na to kot." }
```

## 10. Question-Bank Reflex-Fit Audit

### 10.1 Standard

This is not a knowledge quiz. The child should spend their mental effort on
reading the active cue, retrieving the current rule, inhibiting the factual
response when necessary, and pressing the correct button. The factual layer
must therefore be nearly automatic.

A record passes only when the intended age group is likely to answer it in
about one second, before applying the cue rule, without relying on a recently
taught lesson. This timing is a design target, not a validated measurement; it
must be checked with children before release.

Reject a record if it depends on any of these:

- an exact number, ranking, conversion, or ordered list,
- specialist vocabulary or a category definition,
- an exception to a familiar rule or a common misconception,
- a counterintuitive scientific fact,
- a spatial comparison or calculation that competes with the cue task,
- an explanation that is much harder than the question,
- niche trivia that a child could reasonably not know.

Clarity rules apply independently of factual difficulty:

- use the simple present for an ordinary fact: `Does the Sun shine?`, not
  `Can the Sun shine?`,
- reserve `can` for a genuine capability or possibility, such as whether wind
  can turn an umbrella inside out,
- remove words that do not change the proposition,
- reject metaphors that create a defensible second answer; a snail's shell can
  be compared to a backpack, so the backpack question is invalid,
- reject edge cases caused by location, equipment, attached objects, unusual
  materials, or fictional interpretations,
- prefer one short subject–verb–object proposition in both languages.

The fact must still be true and age-appropriate, but factual correctness alone
does not make it suitable. Difficulty belongs in the cue rules, not in fact
retrieval.

### 10.2 Audit Result

The full audit covered **108 records**: 96 currently implemented and 12
proposed in section 9.

| Set | Keep as written | Replace or rewrite | Total |
|---|---:|---:|---:|
| Current implemented bank | 51 | 45 | 96 |
| Proposed playful additions | 3 | 9 | 12 |
| **Total reviewed** | **54** | **54** | **108** |

All 45 current replacements or rewrites below preserve the original record
ID, category, and truth value. Therefore the implemented bank remains 16
records per category, 8 factual Yes and 8 factual No per category, with no
scheduler or balance change. The nine revised proposals in section 9 likewise
preserve their original categories and truth values.

### 10.3 Current Records To Remove Or Rewrite

#### Animals

| ID | Current wording to discard | Why it fails | Replacement |
|---|---|---|---|
| `ani08` | Do bees have six legs? | Requires recalling an exact anatomy fact. | Do bees fly? (**Yes**) |
| `ani09` | Do sharks have skeletons made of bone? | Cartilage anatomy is specialist knowledge. | Do sharks wear shoes? (**No**) |
| `ani10` | Do butterflies grow from caterpillars? | `Grow from` is less direct than naming the visible transformation. | Do caterpillars become butterflies? (**Yes**) |
| `ani11` | Do snails have backbones? | Requires knowing internal animal anatomy. | Do snails have wheels? (**No**) |
| `ani12` | Do polar bears live naturally in Antarctica? | Requires recalling Arctic versus Antarctic geography. | Do polar bears live on the Moon? (**No**) |
| `ani13` | Do koalas mainly eat eucalyptus leaves? | Animal-diet trivia is not reliably automatic. | Do koalas climb trees? (**Yes**) |
| `ani16` | Can all birds fly? | `Can all` is slower and less natural than a direct general statement. | Do all birds fly? (**No**) |

#### Human body

| ID | Current wording to discard | Why it fails | Replacement |
|---|---|---|---|
| `bod03` | Is the skin an organ? | Depends on a category definition, not direct experience. | Do people have skin? (**Yes**) |
| `bod04` | Is the brain protected by the skull? | Passive voice is longer than the same direct fact. | Does the skull protect the brain? (**Yes**) |
| `bod06` | Is human blood blue inside the body? | Tests a misconception caused by blue-looking veins. | Is human blood bright green? (**No**) |
| `bod07` | Are teeth bones? | The tooth-versus-bone distinction is specialist anatomy. | Are human teeth made of chocolate? (**No**) |
| `bod08` | Does an adult human usually have 206 bones? | Requires an exact memorized number. | Do people have bones? (**Yes**) |
| `bod09` | Is the stomach above the heart? | Requires a mental spatial model of internal anatomy. | Is your stomach inside your shoe? (**No**) |
| `bod12` | Are pupils openings that let light into the eyes? | Uses technical anatomy and optics vocabulary. | Do eyes help people see? (**Yes**) |
| `bod16` | Are ears used only for hearing? | Balance is a non-obvious second function; `only` makes it a trick. | Do ears help people smell? (**No**) |

#### Earth and space

| ID | Current wording to discard | Why it fails | Replacement |
|---|---|---|---|
| `spa01` | Is Earth the third planet from the Sun? | Requires ordered planet recall; the updated reflex-first brief supersedes this original example. | Is the Moon in space? (**Yes**) |
| `spa04` | Is Mars known as the Red Planet? | Tests a memorized nickname rather than an immediately visible fact. | Is Mars a planet? (**Yes**) |
| `spa05` | Is Jupiter the largest planet in our solar system? | Requires a memorized ranking. | Does the Sun shine? (**Yes**) |
| `spa06` | Is Saturn the only planet with rings? | Requires knowing exceptions beyond the familiar example. | Does Saturn have square rings? (**No**) |
| `spa07` | Is Venus closer to the Sun than Earth is? | Requires retrieving and comparing planet order. | Is Earth a planet? (**Yes**) |
| `spa08` | Does Earth have one natural moon? | `Natural` is unnecessary vocabulary for this game. | Does Earth have one moon? (**Yes**) |
| `spa10` | Can astronauts breathe in space without special equipment? | `In space` can mean inside a spacecraft, where astronauts do breathe. | Do astronauts live on the Sun? (**No**) |
| `spa11` | Does the Moon make its own light? | Tests a common misconception and reflected-light knowledge. | Is the Moon made of cheese? (**No**) |
| `spa12` | Does Mars have two moons? | Exact astronomy trivia. | Can rockets travel into space? (**Yes**) |
| `spa13` | Is Mercury the hottest planet in the solar system? | Deliberately counterintuitive; tests the Mercury/Venus trap. | Is the Sun made of ice? (**No**) |
| `spa15` | Is Neptune the farthest official planet from the Sun? | Requires ordered recall plus the meaning of `official`. | Does Earth travel around the Sun? (**Yes**) |

#### Nature and weather

| ID | Current wording to discard | Why it fails | Replacement |
|---|---|---|---|
| `nat07` | Are all deserts hot? | Depends on exceptions to a familiar prototype. | Are all flowers blue? (**No**) |
| `nat09` | Are seasons caused mainly by the tilt of Earth's axis? | Requires a taught causal model and technical vocabulary. | Does wind move leaves? (**Yes**) |
| `nat11` | Is melted rock below Earth's surface called magma? | Pure terminology recall. | Does ice become water when it melts? (**Yes**) |
| `nat12` | Can a desert be cold? | Counterintuitive exception and near-duplicate of `nat07`. | Can puddles form after rain? (**Yes**) |
| `nat13` | Do plants get their food by eating soil? | Children can reasonably connect soil nutrients with plant food, so the wording admits competing interpretations. | Are tree leaves made of metal? (**No**) |
| `nat16` | Does air contain more oxygen than nitrogen? | Requires recalling atmospheric composition. | Is air made of orange juice? (**No**) |

#### Everyday science

| ID | Current wording to discard | Why it fails | Replacement |
|---|---|---|---|
| `sci04` | Do batteries store energy in chemicals? | Abstract mechanism and science vocabulary. | Can a battery power a toy? (**Yes**) |
| `sci05` | Is ice less dense than liquid water? | `Density` is technical and the result is counterintuitive. | Can ice float in water? (**Yes**) |
| `sci08` | Is rubber usually an electrical insulator? | `Electrical insulator` is specialist vocabulary. | Can a rubber ball bounce? (**Yes**) |
| `sci09` | Do magnets attract every kind of metal? | Depends on knowing exceptions among metals. | Does a magnet pull a wooden spoon? (**No**) |
| `sci10` | Does a heavy ball fall faster than a light ball in a vacuum? | Counterintuitive physics plus the unfamiliar vacuum condition. | Does a dropped stone fall upward? (**No**) |
| `sci11` | Can sound travel through completely empty space? | Requires knowing that sound needs a medium; it duplicates the rejected `spa17` concept. | Does a shadow make its own sound? (**No**) |
| `sci12` | Is your mass smaller on the Moon than on Earth? | Requires distinguishing mass from weight. | Does a rock turn into a balloon on the Moon? (**No**) |
| `sci14` | Is glass always opaque? | `Opaque` adds vocabulary load and `always` makes it a trap. | Is fire cold? (**No**) |
| `sci16` | Can a battery create energy from nothing? | Tests an abstract conservation law. | Does an empty battery power a toy? (**No**) |

#### Math and measures

| ID | Current wording to discard | Why it fails | Replacement |
|---|---|---|---|
| `mat07` | Is nine a prime number? | `Prime` is curriculum-dependent category knowledge. | Is three bigger than ten? (**No**) |
| `mat09` | Is one metre equal to 100 centimetres? | Requires an exact unit conversion. | Is ten bigger than one? (**Yes**) |
| `mat12` | Does a dozen mean twelve? | Tests vocabulary rather than reflex control. | Is eight bigger than five? (**Yes**) |
| `mat16` | Is 100 centimetres equal to 10 metres? | Requires conversion and calculation under time pressure. | Is one the same number as ten? (**No**) |

### 10.4 Proposed Playful Records That Were Rejected

The following six earlier proposals were wrong for the same reason as the
astronaut-height example: the absurd or surprising surface did not remove the
underlying knowledge load. Section 9 now contains their replacements.

| ID | Rejected proposal | Problem | Replacement now in section 9 |
|---|---|---|---|
| `ani18` | Can penguins slide on their bellies? | A child who has not seen this behavior must know or guess an animal fact. | Can a dog chase its own tail? (**Yes**) |
| `bod18` | Can your belly rumble when you are not hungry? | Counterintuitive physiology; the answer is uncertain without explanation. | Can people make funny faces? (**Yes**) |
| `spa17` | Can a ringing bell be heard across empty space? | Requires knowing that sound needs a medium. | Do astronauts ride bicycles to the Moon? (**No**) |
| `spa18` | Can astronauts become a little taller while in space? | Niche, surprising physiology; it forces retrieval or guessing. | Do space rockets fly above the clouds? (**Yes**) |
| `sci18` | Can static electricity make your hair stand up? | Even after removing the technical wording, the phenomenon is not universally familiar. | Can a balloon be bigger than your head? (**Yes**) |
| `mat18` | Can two odd numbers add up to an even number? | Requires a rule or a mental calculation before cue inversion. | Does two plus two equal four when a cat watches? (**Yes**) |

### 10.5 Additional Playful Wording Corrections

Three playful proposals passed the knowledge-load review but failed the second
clarity pass:

| ID | Earlier wording | Problem | Final wording in section 9 |
|---|---|---|---|
| `ani17` | Can a snake stand on its back legs? | A rearing snake can look as though it is standing, despite having no legs. | Can a snake stomp with its back feet? (**No**) |
| `nat17` | Do clouds rain lemonade? | Using `rain` as a transitive verb is unnatural English. | Does lemonade fall from clouds? (**No**) |
| `sci17` | Does a cheese sandwich stick to a magnet? | `Stick` can mean physical attachment unrelated to magnetism. | Is a cheese sandwich a magnet? (**No**) |

### 10.6 Corrections To Earlier Draft Replacements

The second pass also rejected 12 replacement wordings from the earlier version
of this review. They must not be implemented:

| ID | Discarded draft replacement | Problem | Final replacement |
|---|---|---|---|
| `ani08` | Can bees fly? | `Can` is unnecessary for an ordinary fact. | Do bees fly? (**Yes**) |
| `ani11` | Do snails wear backpacks? | A shell can reasonably be compared to a backpack. | Do snails have wheels? (**No**) |
| `ani13` | Can koalas climb trees? | `Can` is unnecessary for their ordinary behavior. | Do koalas climb trees? (**Yes**) |
| `bod07` | Are teeth made of chocolate? | Could refer to tooth-shaped chocolate rather than human teeth. | Are human teeth made of chocolate? (**No**) |
| `spa05` | Can the Sun shine? | States a possibility instead of the direct fact. | Does the Sun shine? (**Yes**) |
| `nat09` | Can wind move leaves? | States a possibility instead of the ordinary effect. | Does wind move leaves? (**Yes**) |
| `nat11` | Can ice melt into water? | The English is indirect and the Polish construction was unnatural. | Does ice become water when it melts? (**Yes**) |
| `sci10` | Does a dropped ball fall upward? | A buoyant ball can move upward in water. | Does a dropped stone fall upward? (**No**) |
| `sci11` | Can a shadow make its own sound? | `Can` is unnecessary. | Does a shadow make its own sound? (**No**) |
| `sci14` | Can you see through every wall? | `Every` adds a needless quantifier and invites edge cases about transparent walls. | Is fire cold? (**No**) |
| `sci16` | Can an empty battery power a toy forever? | `Can` plus `forever` tests two conditions instead of one. | Does an empty battery power a toy? (**No**) |
| `mat12` | Can two halves make one whole? | Halves of different objects do not necessarily form one whole. | Is eight bigger than five? (**Yes**) |

### 10.7 Implementation-Ready Replacement Records

Replace or rewrite the 45 implemented records in place. Do not add these as
extra questions. The exact IDs and truth values are intentionally unchanged.

```js
// Animals
{ id: "ani08", cat: "animals", truth: true,
  enQ: "Do bees fly?", plQ: "Czy pszczoły latają?",
  enFact: "Bees can fly.", plFact: "Pszczoły potrafią latać." },
{ id: "ani09", cat: "animals", truth: false,
  enQ: "Do sharks wear shoes?", plQ: "Czy rekiny noszą buty?",
  enFact: "Sharks do not wear shoes.", plFact: "Rekiny nie noszą butów." },
{ id: "ani10", cat: "animals", truth: true,
  enQ: "Do caterpillars become butterflies?", plQ: "Czy gąsienice zmieniają się w motyle?",
  enFact: "Caterpillars become butterflies.", plFact: "Gąsienice zmieniają się w motyle." },
{ id: "ani11", cat: "animals", truth: false,
  enQ: "Do snails have wheels?", plQ: "Czy ślimaki mają koła?",
  enFact: "Snails do not have wheels.", plFact: "Ślimaki nie mają kół." },
{ id: "ani12", cat: "animals", truth: false,
  enQ: "Do polar bears live on the Moon?", plQ: "Czy niedźwiedzie polarne mieszkają na Księżycu?",
  enFact: "Polar bears live on Earth, not on the Moon.", plFact: "Niedźwiedzie polarne żyją na Ziemi, a nie na Księżycu." },
{ id: "ani13", cat: "animals", truth: true,
  enQ: "Do koalas climb trees?", plQ: "Czy koale wspinają się na drzewa?",
  enFact: "Koalas can climb trees.", plFact: "Koale potrafią wspinać się na drzewa." },
{ id: "ani16", cat: "animals", truth: false,
  enQ: "Do all birds fly?", plQ: "Czy wszystkie ptaki latają?",
  enFact: "Some birds, including penguins, do not fly.", plFact: "Niektóre ptaki, w tym pingwiny, nie latają." },

// Human body
{ id: "bod03", cat: "body", truth: true,
  enQ: "Do people have skin?", plQ: "Czy ludzie mają skórę?",
  enFact: "People have skin covering their bodies.", plFact: "Ciała ludzi są pokryte skórą." },
{ id: "bod04", cat: "body", truth: true,
  enQ: "Does the skull protect the brain?", plQ: "Czy czaszka chroni mózg?",
  enFact: "The skull protects the brain.", plFact: "Czaszka chroni mózg." },
{ id: "bod06", cat: "body", truth: false,
  enQ: "Is human blood bright green?", plQ: "Czy ludzka krew jest jaskrawozielona?",
  enFact: "Human blood is red, not bright green.", plFact: "Ludzka krew jest czerwona, a nie jaskrawozielona." },
{ id: "bod07", cat: "body", truth: false,
  enQ: "Are human teeth made of chocolate?", plQ: "Czy ludzkie zęby są zrobione z czekolady?",
  enFact: "Human teeth are not made of chocolate.", plFact: "Ludzkie zęby nie są zrobione z czekolady." },
{ id: "bod08", cat: "body", truth: true,
  enQ: "Do people have bones?", plQ: "Czy ludzie mają kości?",
  enFact: "People have bones inside their bodies.", plFact: "Ludzie mają kości wewnątrz ciała." },
{ id: "bod09", cat: "body", truth: false,
  enQ: "Is your stomach inside your shoe?", plQ: "Czy twój żołądek jest w bucie?",
  enFact: "Your stomach is in your body, not in your shoe.", plFact: "Twój żołądek jest w ciele, a nie w bucie." },
{ id: "bod12", cat: "body", truth: true,
  enQ: "Do eyes help people see?", plQ: "Czy oczy pomagają ludziom widzieć?",
  enFact: "Eyes help people see.", plFact: "Oczy pomagają ludziom widzieć." },
{ id: "bod16", cat: "body", truth: false,
  enQ: "Do ears help people smell?", plQ: "Czy uszy pomagają ludziom wąchać?",
  enFact: "People smell with their noses, not their ears.", plFact: "Ludzie wąchają nosem, a nie uszami." },

// Earth and space
{ id: "spa01", cat: "space", truth: true,
  enQ: "Is the Moon in space?", plQ: "Czy Księżyc znajduje się w kosmosie?",
  enFact: "The Moon is in space.", plFact: "Księżyc znajduje się w kosmosie." },
{ id: "spa04", cat: "space", truth: true,
  enQ: "Is Mars a planet?", plQ: "Czy Mars jest planetą?",
  enFact: "Mars is a planet.", plFact: "Mars jest planetą." },
{ id: "spa05", cat: "space", truth: true,
  enQ: "Does the Sun shine?", plQ: "Czy Słońce świeci?",
  enFact: "The Sun shines.", plFact: "Słońce świeci." },
{ id: "spa06", cat: "space", truth: false,
  enQ: "Does Saturn have square rings?", plQ: "Czy Saturn ma kwadratowe pierścienie?",
  enFact: "Saturn's rings are not square.", plFact: "Pierścienie Saturna nie są kwadratowe." },
{ id: "spa07", cat: "space", truth: true,
  enQ: "Is Earth a planet?", plQ: "Czy Ziemia jest planetą?",
  enFact: "Earth is a planet.", plFact: "Ziemia jest planetą." },
{ id: "spa08", cat: "space", truth: true,
  enQ: "Does Earth have one moon?", plQ: "Czy Ziemia ma jeden Księżyc?",
  enFact: "Earth has one moon.", plFact: "Ziemia ma jeden Księżyc." },
{ id: "spa10", cat: "space", truth: false,
  enQ: "Do astronauts live on the Sun?", plQ: "Czy astronauci mieszkają na Słońcu?",
  enFact: "Astronauts do not live on the Sun.", plFact: "Astronauci nie mieszkają na Słońcu." },
{ id: "spa11", cat: "space", truth: false,
  enQ: "Is the Moon made of cheese?", plQ: "Czy Księżyc jest zrobiony z sera?",
  enFact: "The Moon is made of rock, not cheese.", plFact: "Księżyc jest zbudowany ze skał, a nie z sera." },
{ id: "spa12", cat: "space", truth: true,
  enQ: "Can rockets travel into space?", plQ: "Czy rakiety mogą lecieć w kosmos?",
  enFact: "Rockets can travel into space.", plFact: "Rakiety mogą lecieć w kosmos." },
{ id: "spa13", cat: "space", truth: false,
  enQ: "Is the Sun made of ice?", plQ: "Czy Słońce jest zrobione z lodu?",
  enFact: "The Sun is not made of ice.", plFact: "Słońce nie jest zrobione z lodu." },
{ id: "spa15", cat: "space", truth: true,
  enQ: "Does Earth travel around the Sun?", plQ: "Czy Ziemia krąży wokół Słońca?",
  enFact: "Earth travels around the Sun.", plFact: "Ziemia krąży wokół Słońca." },

// Nature and weather
{ id: "nat07", cat: "nature", truth: false,
  enQ: "Are all flowers blue?", plQ: "Czy wszystkie kwiaty są niebieskie?",
  enFact: "Flowers can have many colors; they are not all blue.", plFact: "Kwiaty mogą mieć wiele kolorów; nie wszystkie są niebieskie." },
{ id: "nat09", cat: "nature", truth: true,
  enQ: "Does wind move leaves?", plQ: "Czy wiatr porusza liście?",
  enFact: "Wind can move leaves.", plFact: "Wiatr może poruszać liśćmi." },
{ id: "nat11", cat: "nature", truth: true,
  enQ: "Does ice become water when it melts?", plQ: "Czy lód zamienia się w wodę, gdy topnieje?",
  enFact: "Melting ice becomes liquid water.", plFact: "Topniejący lód zamienia się w ciekłą wodę." },
{ id: "nat12", cat: "nature", truth: true,
  enQ: "Can puddles form after rain?", plQ: "Czy po deszczu mogą powstać kałuże?",
  enFact: "Rainwater can collect in puddles.", plFact: "Woda deszczowa może zbierać się w kałużach." },
{ id: "nat13", cat: "nature", truth: false,
  enQ: "Are tree leaves made of metal?", plQ: "Czy liście drzew są zrobione z metalu?",
  enFact: "Tree leaves are not made of metal.", plFact: "Liście drzew nie są zrobione z metalu." },
{ id: "nat16", cat: "nature", truth: false,
  enQ: "Is air made of orange juice?", plQ: "Czy powietrze jest zrobione z soku pomarańczowego?",
  enFact: "Air is a mixture of gases, not orange juice.", plFact: "Powietrze jest mieszaniną gazów, a nie sokiem pomarańczowym." },

// Everyday science
{ id: "sci04", cat: "science", truth: true,
  enQ: "Can a battery power a toy?", plQ: "Czy bateria może zasilać zabawkę?",
  enFact: "A battery can power a toy.", plFact: "Bateria może zasilać zabawkę." },
{ id: "sci05", cat: "science", truth: true,
  enQ: "Can ice float in water?", plQ: "Czy lód może pływać po wodzie?",
  enFact: "Ice can float in water.", plFact: "Lód może pływać po wodzie." },
{ id: "sci08", cat: "science", truth: true,
  enQ: "Can a rubber ball bounce?", plQ: "Czy gumowa piłka może się odbijać?",
  enFact: "A rubber ball can bounce.", plFact: "Gumowa piłka może się odbijać." },
{ id: "sci09", cat: "science", truth: false,
  enQ: "Does a magnet pull a wooden spoon?", plQ: "Czy magnes przyciąga drewnianą łyżkę?",
  enFact: "A magnet does not attract a wooden spoon.", plFact: "Magnes nie przyciąga drewnianej łyżki." },
{ id: "sci10", cat: "science", truth: false,
  enQ: "Does a dropped stone fall upward?", plQ: "Czy upuszczony kamień spada do góry?",
  enFact: "A dropped stone falls downward, not upward.", plFact: "Upuszczony kamień spada w dół, a nie do góry." },
{ id: "sci11", cat: "science", truth: false,
  enQ: "Does a shadow make its own sound?", plQ: "Czy cień wydaje własny dźwięk?",
  enFact: "A shadow does not make sound.", plFact: "Cień nie wydaje dźwięku." },
{ id: "sci12", cat: "science", truth: false,
  enQ: "Does a rock turn into a balloon on the Moon?", plQ: "Czy kamień zmienia się w balon na Księżycu?",
  enFact: "A rock does not turn into a balloon on the Moon.", plFact: "Kamień nie zmienia się w balon na Księżycu." },
{ id: "sci14", cat: "science", truth: false,
  enQ: "Is fire cold?", plQ: "Czy ogień jest zimny?",
  enFact: "Fire is hot, not cold.", plFact: "Ogień jest gorący, a nie zimny." },
{ id: "sci16", cat: "science", truth: false,
  enQ: "Does an empty battery power a toy?", plQ: "Czy rozładowana bateria zasila zabawkę?",
  enFact: "An empty battery does not power a toy.", plFact: "Rozładowana bateria nie zasila zabawki." },

// Math and measures
{ id: "mat07", cat: "math", truth: false,
  enQ: "Is three bigger than ten?", plQ: "Czy trzy jest większe od dziesięciu?",
  enFact: "Three is smaller than ten.", plFact: "Trzy jest mniejsze od dziesięciu." },
{ id: "mat09", cat: "math", truth: true,
  enQ: "Is ten bigger than one?", plQ: "Czy dziesięć jest większe od jednego?",
  enFact: "Ten is bigger than one.", plFact: "Dziesięć jest większe od jednego." },
{ id: "mat12", cat: "math", truth: true,
  enQ: "Is eight bigger than five?", plQ: "Czy osiem jest większe od pięciu?",
  enFact: "Eight is bigger than five.", plFact: "Osiem jest większe od pięciu." },
{ id: "mat16", cat: "math", truth: false,
  enQ: "Is one the same number as ten?", plQ: "Czy jeden to ta sama liczba co dziesięć?",
  enFact: "One and ten are different numbers.", plFact: "Jeden i dziesięć to różne liczby." }
```

### 10.8 Validation Requirements For The Content Change

Before merging the replacements:

1. Have a fluent Polish reviewer check every Polish question and fact.
2. Ask at least five children spanning the target age range to answer the
   factual questions with no cues and no timer.
3. Flag any question that is not answered confidently within roughly one
   second by at least four of the five children; rewrite and retest it.
4. Confirm that no child interprets a replacement as ambiguous or dependent on
   an unusual edge case.
5. Run the independent checker and assert that the record IDs, category counts,
   truth counts, uniqueness constraints, and non-empty bilingual fields are
   unchanged.
6. Run at least 10,000 generated sessions at every level after the content
   replacement. Content should not affect scheduling, but this guards against
   accidental record or syntax errors.

## 11. Exit Criteria

This review is resolved when:

- R1–R6 acceptance tests pass,
- all 45 implemented records rejected in section 10 have been replaced or
  rewritten in place and have passed the bilingual and child reflex-fit
  review,
- the 12 playful records have received English and Polish content review,
- the app and `yesnoreflex/docs/req.md` both describe the 108-record bank and
  playful quotas,
- the independent checker covers the new invariants and passes,
- the repository code-review gate passes,
- the manual browser matrix has no unresolved P0/P1 defects.

Delete this one-time implementation review after the changes ship and the
living requirements document reflects the final behavior; git history will
preserve it.
