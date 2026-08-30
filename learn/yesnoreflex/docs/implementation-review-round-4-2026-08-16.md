# Yes / No Reflex: Question Review, Round 4

> **Remediation status (2026-08-17): IMPLEMENTED — automated gates green,
> human gates open.** Appendix A ships verbatim: 240 records in eight
> categories, 30 per category, 15 true and 15 false, 6 playful (3 true, 3
> false). No question was added, reworded, translated, or removed during
> implementation; the shipped bank, the independent fixture in
> `tools/yesnoreflex-bank-fixture.mjs`, and `yesnoreflex/docs/req.md` §20.3
> were all generated from Appendix A and verified field-for-field identical.
>
> **Exact final gate totals** (run from `learn/` on 2026-08-22, after the
> pair-per-round redesign described in the addendum below):
>
> ```text
> npm run code-review -- yesnoreflex/index.html
> 0 finding(s): 0 high, 0 medium, 0 low
>
> npm run yesnoreflex-question-gate
> OK: 10601 question-gate checks passed
>
> node tools/yesnoreflex-rules-check.mjs
> OK: 65278 checks passed
>
> npm run yesnoreflex-dom-check
> OK: 535 DOM checks passed
>
> npm run yesnoreflex-layout-check
> OK: 310 real-Chrome layout checks passed
> ```
>
> (2026-08-21 totals, before the redesign: 12,074 / 508 / 295.)
>
> (Totals on 2026-08-17, when this round's content work landed, were 12,055 /
> 477 / 276. The growth is the opening-card and hard-window regression tests
> added since; question-gate and code-review are unchanged.)
>
> **Per-section disposition**
>
> | Section | Status | How |
> | --- | --- | --- |
> | §2 49 replaced wordings | applied | Every listed ID keeps its category, truth, and tone and carries the Appendix A replacement. The 59 retained wordings and all normalized feedback facts come from Appendix A too, so the whole bank has one source. |
> | §3.1 editorial gate | recorded, human | Documented verbatim in `req.md` §20.2 as a permanent authoring rule. It is a human judgement and is NOT claimed as passed. |
> | §3.2 automated gate | applied | `tools/yesnoreflex-question-gate.mjs`, exposed as `npm run yesnoreflex-question-gate`. Enforces the record count and category set, per-category quotas, ID scheme, single terminal `?`, no newline, the four word limits, whole-word ambiguity and irrelevant-clause vocabulary, normalized duplicate detection, Jaccard ≥ 0.72 near-duplicate reporting with mandatory disposition (currently zero pairs), app↔fixture field-for-field equality, and per-record SHA-256 hashes in `yesnoreflex/docs/question-gate-approvals.json` over the canonical field order. |
> | §4.1 playful selection | applied | `playfulByPair` replaced by per-`cat:truth` arrays. Quotas are 2/3/4 at Levels 1/2/3, slots sit in DIFFERENT categories, never adjacent, and are only placed where an unused, non-hard-excluded playful record exists (`playfulAvailability()`), so the quota cannot force a repeat. `validateSession()` and the independent checker both assert the distinct-category rule. |
> | §4.2 eight-category schedule | applied | `catBase`/`catExtra` are now 1+4 (L1), 1+6 (L2), 2+2 (L3). The no-adjacent-category repair is unchanged. Extra-category selection is asserted order-independent across 10,000 sessions per level (worst deviation < 12% of fair share; per-category draw share < 5%). |
> | §4.3 versioned history | applied | `yesnoreflexRecentV2` with a four-session hard window and a 96-ID soft-avoid list. `normalizeHistory()` rejects every malformed shape without throwing; `rankBucket()` orders unseen → soft → hard; `pushSessionHistory()` caps both tiers. History is written only in `finishSession()` and includes both warm-up IDs, so an abandoned session consumes nothing. Legacy `…RecentV1` is never read or written. |
> | §5 acceptance checks | applied | 1: gate green with zero undispositioned near-duplicate pairs. 2/3: 10,000 sequential sessions per level and 10,000 mixed-level, carrying history forward — zero IDs repeated inside the four-session window, zero fallbacks. 4: exact 2/3/4 playful, no adjacency, distinct categories, no duplicate IDs. 5: every prior truth, expected-answer, FACT/FLIP, conflict, category-adjacency, switch-count, and run-length assertion retained. 6: balance assertions above. 7: 15 malformed history payloads through startup and generation in the rules suite plus 7 through the real DOM. 8: a realistic four-session hard window plus a full 96-ID soft list keeps every invariant. 9: selection is a pure function of seed and history; language changes copy only. |
>
> **One documented deviation.** §5.8 as literally written ("fill the soft
> history with 96 valid IDs") is satisfied with a *realistic* history: four
> actually-played sessions form the hard window and 96 further IDs fill the
> soft list. An adversarial fixture that hard-excludes two entire categories
> is also tested, but only for graceful degradation — the category schedule
> requires every category, so that history is unsatisfiable by construction
> and relaxation is correct, not a defect. Both cases are permanent tests.
>
> **Still open — human gates. These are NOT automated successes:**
>
> - **native English reviewer:** 0 of 240 records approved. The manifest
>   records `approvedByEnglishReviewer: null` for every record and the gate
>   prints the count on every run.
> - **native Polish reviewer:** 0 of 240 records approved, same mechanism.
>   132 of the 240 records are new Polish text.
> - **child pilot:** every base proposition must be piloted with children in
>   the target age range, recording whether it was answered correctly and
>   quickly before cue inversion. Not started.
> - Release remains blocked on all three. A green
>   `npm run yesnoreflex-question-gate` proves mechanical conformance only.
>
> **Defect found and fixed after remediation (2026-08-21).** The §4.3 hard
> window could be violated. `rankBucket()` appended hard-excluded records
> after the fresh and soft tiers, and `assignQuestions()` only failed on a
> fully EMPTY pool, so a bucket whose eligible records all sat inside the
> four-session window silently returned one with `usedFallback === false`. The
> §5.2/§5.3 sequential suite missed it because it stored only the scored
> questions, while production stores warm-ups and scored questions together —
> the simulated window was two IDs per session too small to reach exhaustion.
>
> Reproduced deterministically by spreading one `(category, truth)` bucket
> across the four hard sessions: **177 of 300 Level-2 sessions** returned a
> hard-excluded ID, none of them via the fallback.
>
> Fix: hard-excluded records are absent from normal buckets rather than ranked
> last; an exhausted bucket fails the attempt and the category/truth schedule
> is rebuilt; every returned schedule is re-checked against the normalized
> hard window; warm-up selection moved into the rules module so the harness
> and production share one code path; and relaxation survives only on the
> explicit `allowHard` last-resort fallback. The sequential suite now stores
> warm-ups, and the exhausted-bucket case plus a hard-exclude-the-entire-bank
> case are permanent regression tests. Rules-check total: 12,058 → 12,074.
>
> **Second defect found and fixed (2026-08-21, adversarial audit).** Any card
> opened by pressing **Enter** on a button was dismissed by that same
> keystroke. Chrome activates a `<button>` on Enter *keydown*, so
> `openSwitchDialog()` ran while the key was still down and installed a
> capture-phase `keyup` listener that closed on the very next keyup — the
> matching one. Reproduced in real Chrome on four paths: Enter on Start (the
> NEW GAME! card never seen), Enter on Next during Practice feedback (**all 8**
> scored SWITCH! cards of a Level-3 session flashed and vanished), tutorial
> step 5, and Enter on Play again. `showResultOverlay()` carried the identical
> defect, so the Enter that finished a Practice session also dismissed the
> star celebration. Space was unaffected, because buttons activate on Space
> *keyup*.
>
> Fix: a per-dialog keydown latch — a keyup may close only if that dialog
> instance observed the matching keydown — on both the switch/opening card and
> the result overlay, plus removal of the `#swContinue` click listener leak on
> keyboard dismissal.
>
> No harness could have caught it: jsdom performs no native Enter activation,
> so the DOM suite could only ever synthesize key events *after* a dialog was
> already open. The regression now lives in the real-Chrome harness and was
> verified to fail (3 checks) with the latch removed and pass with it restored.
> Layout-check total: 285 → 295.
>
> **Pair-per-round redesign + full audit sweep (2026-08-22).** Owner
> redesign: the session-wide cue profile is replaced by **one pair per
> round** — every rule block draws its own fresh pair (e.g. star/square →
> green/blue → circle/pentagon → purple/yellow). The cue tile shows only the
> round's token (swatch or neutral shape); the colored-shape distractor and
> the whole congruent/conflict mechanic are removed (owner decision, recorded
> with its pedagogy trade in req.md §2.2). The panel rule key is a 2-line
> current-pair reference visible during play at ★ only; ★★/★★★ hide the
> panel entirely (memory ramp). Pause now shows the current round's mapping
> card (owner request) — the priced recovery path. Cue persistence is retired
> entirely (`yesnoreflexProfileV2` joins V1: ignored, never written).
> Within-session constraints: no pair repeats per dimension; consecutive
> same-dimension rounds are token-disjoint (proven never to dead-end on the
> shipped pools; a backtracking fallback with a tested relaxation ladder
> covers adversarial forbidden matrices down to 4 legal color pairs).
> Warm-ups teach round 1's pair; every round card (`NEW GAME!` / `SWITCH!`)
> names its pair. Engine, app, all four harnesses, and req.md §§2.2, 6, 7.2,
> 7.4, 7.5, 8, 9, 11, 12, 13, 15, 16 were reworked together. Mutation-tested:
> rendering any stale block (index 0 forever, or previous-block card) fails
> the DOM suite.
>
> **Exact totals after the redesign (2026-08-22):** code-review 0 findings ·
> question-gate 10,601 · rules-check **65,278** · dom-check **535** ·
> real-Chrome layout **310**. Production-faithful sequential simulation:
> 40,000 sessions, 0 hard-window violations, 0 fallbacks, 0 invalid, mean
> attempts 1.001.
>
> **Owner play-test follow-up (2026-08-22).** The owner reported a short
> perceived freeze between Sprint questions. Cause: under pair-per-round,
> consecutive trials in a round can carry the IDENTICAL cue token, so the
> 650ms cue lead showed a completely static screen. Fix: the cue tile replays
> a 0.25s `cuePop` at every cue entry (rAF-restarted so back-to-back
> identical tokens still visibly re-enter; disabled under reduced motion).
> Verified in jsdom (§N3) and live Chrome; recorded in req.md §7.4.
> Timing is unchanged — the lead still precedes the response timer.
>
> **Audit findings disposition (the 39 unverified findings of 2026-08-21;
> F-numbers match the audit list).**
>
> | # | Finding | Disposition |
> | --- | --- | --- |
> | F1/F32 | card key hint never localised | fixed — `enterSpaceHint` i18n key (`ENTER / SPACJA`) |
> | F2 | PL tutorial masculine "widziałeś" | fixed — tutorial copy rewritten gender-neutral |
> | F3 | live region keeps previous language | fixed — cleared on language switch |
> | F4 | decimal separator not localised | fixed — `0,0 s` in Polish |
> | F5 | spa17 wrong verb of motion | confirmed ("jeżdżą"/"nie jadą" aspect mismatch) — bank+fixture+hash updated, reviewer fields left null |
> | F8 | colour rule unusable without hue | partially refuted by measurement: CVD simulation (protan/deutan/tritan, Lab dE) shows the three banned pairs are exactly those with dE < 25 and every allowed pair clears dE >= 28; matrix unchanged and now documented. Remaining risk shifts to the colour-vision human gate |
> | F9 | Sprint answer strands focus | fixed — feedback parks focus on the HUD row |
> | F10/F29 | Resume disabled while focused | fixed — count-in focuses the curtain, completion/cancel restore focus |
> | F11 | key hints at 1.39:1 on accent | fixed — light ink on primary/Continue |
> | F12 | announcements clobbered by focus | fixed — focus first, announce second (feedback, tutorial, summary) |
> | F13/F38/F39 | reduced-motion broken | fixed — CSS block covers the real transitions/animations; the write-only JS gate removed with rationale |
> | F14/F15/F22/F23 | harness assertions unfailable/too-small | refuted by the audit's own verifiers |
> | F16 | abandoned-session test clicks hidden control | fixed — asserts the control is hidden and reads storage directly |
> | F17 | geometry only measured on ?debug=1 DOM | fixed — production-DOM pass (no debug flag, driven blind) added to the Chrome harness |
> | F19 | sim RNG position diverges | resolved by the redesign — production order is generateSession→warm-ups with one rng, and the sim calls the same two functions in the same order |
> | F20/F23 | soft-history fixture under-fills | fixed — fixture stores warm-ups via `playedIdsFor` |
> | F21 | fixed seed per page lifetime | documented at the boot helper; multi-stream tests boot per seed |
> | F24 | prototype names as known ids | fixed — `Object.create(null)` in both id maps |
> | F25 | warm-up selection can relax silently | documented in req.md §9.1 as the second explicit last resort, with its test |
> | F26/F33 | req.md 7.5 vs 9.1 recency contradiction | fixed — §7.5 now states warm-ups join the recency record |
> | F30/F37 | dialog listener leaks | F37 fixed earlier (Continue click handler removed in close); F30 refuted — close() removes all three listeners on every path |
> | F31 | Sprint warm-up feedback reserve | fixed — the larger reserve applies whenever `inWarmup` |
> | F34 | req.md 8.2 orders the removed badge | fixed |
> | F35/F40 | stale comments | F35 fixed; F40 refuted — the comment matches the round-4 code |
> | F36 | dead --cue-blue/--cue-gold props | fixed — removed |
> | F41 | switch announced twice | fixed — revealQuestion no longer prefixes SWITCH! |
> | F42/F43/F44/F46/F47 | req.md stale (legend/tag, mobile rule, type range, stable-meanings, tutorial titles) | fixed in the §§ sweep |
> | F45 | dead ids / [hidden] CSS | re-scanned: the flagged preview ids are live; genuinely dead residues (tokenName, SHAPE_GENDER_PL, cueTokenDesc keys, gendered colour forms) removed with the redesign; orphan scan clean |
>
> The original implementation-required status is preserved below as the
> historical record for this round.

Review date: `2026-08-16`

Reviewed implementation: `yesnoreflex/index.html`

Supersedes the question-bank totals and question-selection instructions in:

- `yesnoreflex/docs/req.md`
- `yesnoreflex/docs/implementation-review-2026-08-15.md`
- `yesnoreflex/docs/implementation-review-round-2-2026-08-16.md`
- `yesnoreflex/docs/implementation-review-round-3-2026-08-16.md`

## 1. Verdict

The current 108-question bank is too small for a reflex game. Repetition is
especially visible because the generator has only one playful question for
each category/truth pair and the playful quota overrides the 32-question recent
list. In a deterministic 10,000-session simulation of the current generator,
the next session shared at least one question with the immediately preceding
session in approximately 32.3% of Level 1 sessions, 32.0% of Level 2 sessions,
and 61.6% of Level 3 sessions. Nearly every immediate overlap was a playful
record.

The content also still contains taxonomy tests, specialist facts, exact
measurements, ambiguous quantifiers, and joke clauses that do not change the
answer. Those prompts interrupt the intended response-flip task by asking the
child to retrieve knowledge or interpret an edge case first.

The required correction is one coordinated content-system change:

1. Replace the 108 records with the exact 240-record bank in Appendix A.
2. Add the permanent Good Question Gate in section 3.
3. Replace the current one-record playful selection and 32-ID recent list with
   the selection and history system in section 4.
4. Add the deterministic and content checks in section 5.

The final bank has eight categories with 30 records each. Every category has
15 true and 15 false propositions, including six playful records split three
true and three false. The full bank therefore contains 120 true, 120 false, 48
playful, and 192 standard records.

## 2. Current Questions To Remove

Remove the following **49 wordings**. Preserve each listed ID, category, truth
value, and (where present) `tone`, but replace its English question, Polish
question, and both feedback facts with the Appendix A record carrying that ID.
The remaining 59 current question wordings are retained. Appendix A normalizes
their feedback facts and adds 132 new IDs, producing 240 records in total.

| ID      | Current English wording to remove                   | Why it fails                                    | Approved replacement (English / Polish)                                                         |
| ------- | --------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `ani02` | Are spiders insects?                                | Taxonomy trap.                                  | Do cats have feathers? / Czy koty mają pióra?                                                   |
| `ani03` | Are whales mammals?                                 | Taxonomy recall.                                | Do ducks have beaks? / Czy kaczki mają dzioby?                                                  |
| `ani04` | Are frogs reptiles?                                 | Taxonomy trap.                                  | Do horses have six legs? / Czy konie mają sześć nóg?                                            |
| `ani05` | Are bats mammals?                                   | Taxonomy recall.                                | Do dogs have noses? / Czy psy mają nosy?                                                        |
| `ani10` | Do caterpillars become butterflies?                 | Ambiguous: many caterpillars become moths.      | Do cows moo? / Czy krowy muczą?                                                                 |
| `ani13` | Do koalas climb trees?                              | Animal-specific knowledge.                      | Do rabbits have ears? / Czy króliki mają uszy?                                                  |
| `ani14` | Do dolphins breathe air?                            | Animal anatomy recall.                          | Do elephants have trunks? / Czy słonie mają trąby?                                              |
| `ani16` | Do all birds fly?                                   | Universal quantifier and exception search.      | Do fish bark? / Czy ryby szczekają?                                                             |
| `bod11` | Are muscles found only in arms and legs?            | `Only` forces an exception search.              | Are your elbows on your feet? / Czy łokcie są na stopach?                                       |
| `bod14` | Do bones help protect organs?                       | Anatomy knowledge and vague `help`.             | Do knees bend? / Czy kolana się zginają?                                                        |
| `bod15` | Are fingernails made of bone?                       | Requires material/anatomy knowledge.            | Are fingernails made of glass? / Czy paznokcie są zrobione ze szkła?                            |
| `bod17` | Can people breathe through their ears?              | Feedback requires airway anatomy.               | Does your nose walk away at night? / Czy twój nos odchodzi nocą?                                |
| `bod18` | Can people make funny faces?                        | `Funny` is subjective.                          | Can people stick out their tongues? / Czy ludzie mogą wystawić język?                           |
| `spa03` | Is the Moon a planet?                               | Classification recall.                          | Is the Moon the Sun? / Czy Księżyc jest Słońcem?                                                |
| `spa08` | Does Earth have one moon?                           | Exact astronomy fact.                           | Does the Moon appear in our sky? / Czy Księżyc pojawia się na naszym niebie?                    |
| `spa09` | Does Earth orbit the Moon?                          | Orbital-model recall.                           | Is the Sun inside Earth? / Czy Słońce jest wewnątrz Ziemi?                                      |
| `spa14` | Is the Sun smaller than Earth?                      | Relative-size knowledge.                        | Is Earth square? / Czy Ziemia jest kwadratowa?                                                  |
| `spa16` | Is one year on Earth shorter than one day?          | Measurement comparison.                         | Is the Moon inside Earth? / Czy Księżyc jest wewnątrz Ziemi?                                    |
| `spa18` | Do space rockets fly above the clouds?              | Flight-path knowledge; not playful.             | Can astronauts float inside a spacecraft? / Czy astronauci mogą unosić się w statku kosmicznym? |
| `nat03` | Do we usually see lightning before hearing thunder? | `Usually` plus science reasoning.               | Does rain make the ground wet? / Czy deszcz moczy ziemię?                                       |
| `nat04` | Can sunlight and water drops make a rainbow?        | Multi-part causal knowledge.                    | Does sunshine make things brighter? / Czy światło słoneczne rozjaśnia rzeczy?                   |
| `nat06` | Does thunder cause lightning?                       | Causal science recall.                          | Does snow fall upward? / Czy śnieg spada do góry?                                               |
| `nat07` | Are all flowers blue?                               | Universal quantifier.                           | Is grass bright purple? / Czy trawa jest jaskrawofioletowa?                                     |
| `nat08` | Is ocean water fresh water?                         | Vocabulary and environment knowledge.           | Is rain made of milk? / Czy deszcz jest zrobiony z mleka?                                       |
| `nat10` | Do rivers usually flow downhill?                    | `Usually` plus gravity reasoning.               | Do trees grow from the ground? / Czy drzewa rosną z ziemi?                                      |
| `nat11` | Does ice become water when it melts?                | Avoidable `when` clause slows parsing.          | Does melting ice become water? / Czy topniejący lód zmienia się w wodę?                         |
| `nat14` | Is wind moving water?                               | Definition recall.                              | Is wind a solid wall? / Czy wiatr jest twardą ścianą?                                           |
| `nat15` | Does every cloud bring rain?                        | Universal quantifier and exception search.      | Is grass made of glass? / Czy trawa jest zrobiona ze szkła?                                     |
| `sci01` | Does light travel faster than sound?                | Counterintuitive science fact.                  | Does a lit lamp give light? / Czy zapalona lampa daje światło?                                  |
| `sci02` | Can friction slow a sliding object?                 | Specialist vocabulary.                          | Can wheels turn? / Czy koła mogą się obracać?                                                   |
| `sci03` | Does a shadow form when light is blocked?           | Conditional clause and causal reasoning.        | Can a shadow appear on a wall? / Czy cień może pojawić się na ścianie?                          |
| `sci04` | Can a battery power a toy?                          | Device knowledge.                               | Can a toy car roll? / Czy samochodzik może się toczyć?                                          |
| `sci05` | Can ice float in water?                             | Counterintuitive material fact.                 | Does ice feel cold? / Czy lód jest zimny w dotyku?                                              |
| `sci06` | Does every bar magnet have two poles?               | Universal quantifier and specialist vocabulary. | Can a rubber band stretch? / Czy gumka recepturka może się rozciągać?                           |
| `sci07` | Is sound produced by vibrations?                    | Abstract science definition.                    | Can a bell make a sound? / Czy dzwonek może wydawać dźwięk?                                     |
| `sci09` | Does a magnet pull a wooden spoon?                  | Material/magnetism knowledge.                   | Is a wooden spoon made of metal? / Czy drewniana łyżka jest zrobiona z metalu?                  |
| `sci12` | Does a rock turn into a balloon on the Moon?        | The Moon clause is irrelevant to the answer.    | Is a rock a balloon? / Czy kamień jest balonem?                                                 |
| `sci13` | Does a mirror make its own light?                   | Optics knowledge.                               | Is a mirror a lamp? / Czy lustro jest lampą?                                                    |
| `sci18` | Can a balloon be bigger than your head?             | Depends on balloon and child size.              | Can a rubber duck float in water? / Czy gumowa kaczka może pływać po wodzie?                    |
| `mat02` | Is seven an even number?                            | Math vocabulary recall.                         | Does one plus one equal three? / Czy jeden plus jeden równa się trzy?                           |
| `mat05` | Does a rectangle have four right angles?            | Geometry vocabulary recall.                     | Does one plus one equal two? / Czy jeden plus jeden równa się dwa?                              |
| `mat06` | Is five half of ten?                                | Fraction/operation step.                        | Is four bigger than two? / Czy cztery jest większe od dwóch?                                    |
| `mat10` | Does one hour have 60 minutes?                      | Memorized conversion.                           | Does a square have four sides? / Czy kwadrat ma cztery boki?                                    |
| `mat12` | Is eight bigger than five?                          | Slower number comparison than needed.           | Does three come after two? / Czy trzy jest po dwóch?                                            |
| `mat13` | Is zero greater than one?                           | Formal comparison vocabulary.                   | Is zero bigger than five? / Czy zero jest większe od pięciu?                                    |
| `mat14` | Does four times three equal twelve?                 | Multi-step arithmetic for the target age.       | Does two times two equal four? / Czy dwa razy dwa równa się cztery?                             |
| `mat15` | Is fifteen less than ten?                           | Two-digit comparison and formal vocabulary.     | Is ten smaller than five? / Czy dziesięć jest mniejsze od pięciu?                               |
| `mat17` | Does a triangle grow a fourth side on its birthday? | Birthday clause is irrelevant to the answer.    | Does a triangle have a belly button? / Czy trójkąt ma pępek?                                    |
| `mat18` | Does two plus two equal four when a cat watches?    | Cat clause is irrelevant to the answer.         | Can two socks make a pair? / Czy dwie skarpetki mogą tworzyć parę?                              |

## 3. Permanent Good Question Gate

Every current and future question must pass **all** checks below in both
languages. A record that fails one item does not enter the app. Do not waive a
failure because a question is educational, scientifically interesting, or
intended as a joke; this is a reflex and cognitive-flexibility game, not a
knowledge quiz.

### 3.1 Editorial gate

The content reviewer must answer `yes` to every item:

1. **One literal proposition:** there is exactly one claim and exactly one
   immediate yes/no answer.
2. **One-second retrieval:** a child in the target age range can answer from
   ordinary experience or the most basic shared facts, without calculation,
   taxonomy, specialist vocabulary, causal reasoning, or exception search.
3. **Context-independent truth:** the marked answer does not change with an
   unstated time, location, specimen, size, material, or unusual edge case.
4. **Direct grammar:** use present tense, active voice, concrete nouns, and the
   shortest natural form. Prefer `Does the Sun shine?` over `Can the Sun
shine?` when the proposition is a stable fact.
5. **No ambiguity triggers:** reject `usually`, `sometimes`, `all`, `every`,
   `only`, double negatives, metaphors, subjective adjectives, vague pronouns,
   and irrelevant conditional, observer, birthday, or location clauses.
6. **Controlled `can`:** use `can` only for a genuine, familiar capability
   whose answer does not depend on hidden circumstances.
7. **Equivalent translations:** English and Polish must ask the same
   proposition naturally; neither may be a word-for-word translation that
   sounds unnatural to a native speaker.
8. **No content duplicates:** the proposition must not duplicate or closely
   paraphrase another record, even if the subject or answer direction changes.
9. **Short feedback:** each fact states the answer directly and is no harder
   than the question. It must not introduce new terminology needed to justify
   the marked answer.
10. **Intrinsic humor:** a playful prompt must create a clear visual absurdity
    or familiar physical comedy in the proposition itself. An unrelated cat,
    birthday, watcher, weekday, or place must never be appended to an otherwise
    ordinary fact. The playful prompt remains literal, unambiguous, and
    factually stable.

### 3.2 Required automated gate

Add `tools/yesnoreflex-question-gate.mjs` and expose it as:

```text
npm run yesnoreflex-question-gate
```

The command must fail non-zero and print the offending IDs when any of these
conditions is false:

- exactly 240 records and exactly the eight approved categories;
- exactly 30 records, 15 true records, six playful records, and three playful
  true records in every category;
- unique ID, normalized English question, and normalized Polish question;
- IDs match `ani|bod|spa|nat|sci|mat|foo|day` plus two digits `01` through `30`
  and match their category;
- `id`, `cat`, `enQ`, `plQ`, `enFact`, and `plFact` are non-empty
  strings; `truth` is a boolean; `tone`, when present, is exactly
  `playful`;
- every question has one terminal `?`, no other question mark, and no newline;
- English questions contain at most 10 whitespace-delimited words; Polish
  questions contain at most 12; English facts contain at most 12; Polish facts
  contain at most 14;
- questions reject case-insensitive whole-word forms of `usually`, `sometimes`,
  `all`, `every`, `only`, `zwykle`, `czasami`, `wszystkie`, `każdy`, `każda`,
  `każde`, and `tylko`;
- questions reject the irrelevant-clause patterns `when`, `while`, `if`,
  `whenever`, `gdy`, `kiedy`, `jeśli`, and `podczas` unless a future human
  approval explicitly changes the gate itself;
- normalized exact duplicates are absent, and token/Jaccard or equivalent
  near-duplicate reporting flags pairs at `>= 0.72` similarity for mandatory
  human disposition;
- the `QUESTIONS` array extracted from the application and the expected bank
  embedded in the rules-check fixture are field-for-field identical;
- each record's canonical content hash matches
  `yesnoreflex/docs/question-gate-approvals.json`.

Canonicalize the hash input as UTF-8 JSON containing fields in this order:
`id`, `cat`, `tone` (empty string when omitted), `truth`, `enQ`, `plQ`,
`enFact`, `plFact`. Store lowercase SHA-256 values. Populate the initial
manifest from Appendix A only after both native-language reviewers approve it.
A wording, truth, category, tone, or feedback edit must therefore fail CI until
the edited record is reviewed and its hash is deliberately replaced.

Automated checks do not approve semantics. Record these two named human
approvals in the manifest for every hash:

- a native English reviewer: literal meaning, reading speed, ambiguity, and
  truth;
- a native Polish reviewer: natural Polish, semantic equivalence, reading
  speed, ambiguity, and truth.

Before content review closes, pilot every initial question with children in the
target age range. Record whether the base proposition was answered correctly
and quickly before cue inversion. Reword or remove any prompt that repeatedly
causes base-question hesitation. This child pilot remains an explicit open
human gate; it must not be represented as passed by static checks.

## 4. Repetition And Session-Selection Fix

Implement these rules as one change. Do not merely raise `RECENT_LIMIT`.

### 4.1 Playful selection

Replace the single `playfulByPair[category][truth]` record with arrays of all
matching records. Select playful slots before standard slots, subject to the
session's truth and category requirements.

- Level 1 uses exactly two playful records; Level 2 uses exactly three; Level
  3 uses exactly four.
- Use different playful categories within a session.
- Never place two playful questions next to each other.
- Choose records not present in the four-session hard exclusion window first.
- A playful quota must never force a repeated question while any compatible,
  unused playful record elsewhere can satisfy the remaining category schedule.
- Never repeat an ID inside one session.

### 4.2 Category schedule for eight categories

Replace the six-category `catBase` assumptions with these exact schedules:

- Level 1 (`n=12`): one record from every category plus one extra record from
  four randomly chosen categories.
- Level 2 (`n=14`): one record from every category plus one extra record from
  six randomly chosen categories.
- Level 3 (`n=18`): two records from every category plus one extra record from
  two randomly chosen categories.

Keep the existing no-adjacent-category repair. Across a deterministic batch,
extra-category selection must be statistically balanced rather than biased by
array order.

### 4.3 Versioned recency history

Replace the current flat recent-ID list with `yesnoreflexRecentV2`. Store only
completed scored/practice sessions, newest first, in this logical shape:

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

The sample arrays are abbreviated; stored session arrays contain all played
question IDs. Apply these rules:

1. Hard-exclude every ID from the previous four completed sessions.
2. Keep up to 96 additional older unique IDs as a soft-avoid list. Prefer an
   ID outside this list; use an older ID only when needed to satisfy an
   invariant.
3. Store at most the four full session arrays plus 96 older unique IDs.
4. Ignore malformed data, unknown IDs, duplicates, non-string values, and all
   legacy recency keys without throwing.
5. Persist history only after the session completes. Abandoned sessions do not
   consume the hard-exclusion window.
6. If a legal schedule cannot be made with the hard window, retry schedule
   construction across compatible categories/truth values before relaxing
   anything. With this 240-record bank, the deterministic acceptance suite must
   never require hard-window relaxation.

Preserve all existing session-length, FACT/FLIP, expected YES/NO, cue-conflict,
run-length, rule-switch, and no-adjacent-category invariants.

## 5. Acceptance Checks

The implementing agent must update `validateQuestionBank`, the rules-check
fixture, and all stale documentation totals from 108/six categories to the
240/eight-category contract. Add these tests to the normal Yes/No Reflex gate:

1. Run `npm run yesnoreflex-question-gate` and report zero failures plus zero
   undispositioned near-duplicate pairs.
2. Generate 10,000 sequential sessions for each level while carrying recency
   state forward. Assert no ID appears in any of the previous four sessions.
3. Generate 10,000 sequential mixed-level sessions with the same assertion.
4. Assert exactly 2/3/4 playful records at Levels 1/2/3, no adjacent playful
   positions, no duplicate IDs, and distinct playful categories per session.
5. Retain and re-run every existing truth, expected-answer, FACT/FLIP,
   conflict, category-adjacency, switch-count, and run-length assertion.
6. Over the deterministic batch, assert each category and truth direction is
   selected within the documented tolerance and no extra-category position is
   biased by fixed source order.
7. Pass missing, truncated, wrong-version, wrong-type, duplicate-filled, and
   unknown-ID recency payloads through startup and session generation; assert
   no exception and a valid session.
8. Fill the soft history with 96 valid IDs and confirm selection still obeys
   the four-session hard exclusion and every gameplay invariant.
9. Confirm English and Polish modes use the same selected IDs and truth values;
   language changes copy only.

Release remains blocked until the native English review, native Polish review,
and child pilot in section 3 are recorded. Automated green checks are
necessary but do not close those human gates.

## Appendix A. Approved 240-Question Bank

Replace the current `CATEGORIES` and `QUESTIONS` values with the exact values
below. Preserve Unicode characters verbatim. Standard records intentionally
omit `tone`; playful records use `tone: "playful"`.

```js
const CATEGORIES = [
  "animals",
  "body",
  "space",
  "nature",
  "science",
  "math",
  "food",
  "everyday",
];

const QUESTIONS = [
  // Animals
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
    tone: "playful",
    truth: false,
    enQ: "Can a snake stomp with its back feet?",
    plQ: "Czy wąż może tupać tylnymi nogami?",
    enFact: "Snakes have no feet for stomping.",
    plFact: "Węże nie mają nóg do tupania.",
  },
  {
    id: "ani18",
    cat: "animals",
    tone: "playful",
    truth: true,
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
    tone: "playful",
    truth: true,
    enQ: "Do ducks waddle?",
    plQ: "Czy kaczki chodzą, kołysząc się na boki?",
    enFact: "Ducks waddle as they walk.",
    plFact: "Kaczki kołyszą się podczas chodzenia.",
  },
  {
    id: "ani28",
    cat: "animals",
    tone: "playful",
    truth: false,
    enQ: "Does a cow sleep in a teacup?",
    plQ: "Czy krowa śpi w filiżance?",
    enFact: "A cow does not sleep in a teacup.",
    plFact: "Krowa nie śpi w filiżance.",
  },
  {
    id: "ani29",
    cat: "animals",
    tone: "playful",
    truth: true,
    enQ: "Can a puppy chase a bouncing ball?",
    plQ: "Czy szczeniak może gonić odbijającą się piłkę?",
    enFact: "A puppy can chase a ball.",
    plFact: "Szczeniak może gonić piłkę.",
  },
  {
    id: "ani30",
    cat: "animals",
    tone: "playful",
    truth: false,
    enQ: "Can a fish knit a scarf?",
    plQ: "Czy ryba może zrobić szalik na drutach?",
    enFact: "A fish cannot knit a scarf.",
    plFact: "Ryba nie potrafi robić na drutach.",
  },

  // Human body
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
    tone: "playful",
    truth: false,
    enQ: "Does your nose walk away at night?",
    plQ: "Czy twój nos odchodzi nocą?",
    enFact: "Your nose stays on your face.",
    plFact: "Twój nos zostaje na twarzy.",
  },
  {
    id: "bod18",
    cat: "body",
    tone: "playful",
    truth: true,
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
    tone: "playful",
    truth: true,
    enQ: "Can your stomach rumble?",
    plQ: "Czy w brzuchu może burczeć?",
    enFact: "A stomach can rumble.",
    plFact: "W brzuchu może burczeć.",
  },
  {
    id: "bod28",
    cat: "body",
    tone: "playful",
    truth: false,
    enQ: "Can a belly button bark?",
    plQ: "Czy pępek może szczekać?",
    enFact: "A belly button cannot bark.",
    plFact: "Pępek nie potrafi szczekać.",
  },
  {
    id: "bod29",
    cat: "body",
    tone: "playful",
    truth: true,
    enQ: "Can people clap their hands?",
    plQ: "Czy ludzie mogą klaskać w dłonie?",
    enFact: "People can clap their hands.",
    plFact: "Ludzie mogą klaskać w dłonie.",
  },
  {
    id: "bod30",
    cat: "body",
    tone: "playful",
    truth: false,
    enQ: "Does a knee have a nose?",
    plQ: "Czy kolano ma nos?",
    enFact: "A knee does not have a nose.",
    plFact: "Kolano nie ma nosa.",
  },

  // Earth and space
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
    tone: "playful",
    truth: false,
    enQ: "Do astronauts ride bicycles to the Moon?",
    plQ: "Czy astronauci jeżdżą na Księżyc rowerami?",
    enFact: "Astronauts do not bicycle to the Moon.",
    plFact: "Astronauci nie jadą na Księżyc rowerami.",
  },
  {
    id: "spa18",
    cat: "space",
    tone: "playful",
    truth: true,
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
    tone: "playful",
    truth: true,
    enQ: "Can a rocket make a loud noise?",
    plQ: "Czy rakieta może robić dużo hałasu?",
    enFact: "A rocket can make a loud noise.",
    plFact: "Rakieta może robić dużo hałasu.",
  },
  {
    id: "spa28",
    cat: "space",
    tone: "playful",
    truth: false,
    enQ: "Do astronauts row boats through space?",
    plQ: "Czy astronauci wiosłują łodziami w kosmosie?",
    enFact: "Astronauts do not row boats through space.",
    plFact: "Astronauci nie wiosłują łodziami w kosmosie.",
  },
  {
    id: "spa29",
    cat: "space",
    tone: "playful",
    truth: true,
    enQ: "Can moonlight shine through a window?",
    plQ: "Czy światło Księżyca może świecić przez okno?",
    enFact: "Moonlight can shine through a window.",
    plFact: "Światło Księżyca może świecić przez okno.",
  },
  {
    id: "spa30",
    cat: "space",
    tone: "playful",
    truth: false,
    enQ: "Does the Moon need an umbrella?",
    plQ: "Czy Księżyc potrzebuje parasola?",
    enFact: "The Moon does not need an umbrella.",
    plFact: "Księżyc nie potrzebuje parasola.",
  },

  // Nature and weather
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
    tone: "playful",
    truth: false,
    enQ: "Does lemonade fall from clouds?",
    plQ: "Czy z chmur pada lemoniada?",
    enFact: "Lemonade does not fall from clouds.",
    plFact: "Z chmur nie pada lemoniada.",
  },
  {
    id: "nat18",
    cat: "nature",
    tone: "playful",
    truth: true,
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
    tone: "playful",
    truth: true,
    enQ: "Can boots splash in a puddle?",
    plQ: "Czy buty mogą chlapać w kałuży?",
    enFact: "Boots can splash in a puddle.",
    plFact: "Buty mogą chlapać w kałuży.",
  },
  {
    id: "nat28",
    cat: "nature",
    tone: "playful",
    truth: false,
    enQ: "Can a raindrop carry a suitcase?",
    plQ: "Czy kropla deszczu może nieść walizkę?",
    enFact: "A raindrop cannot carry a suitcase.",
    plFact: "Kropla deszczu nie może nieść walizki.",
  },
  {
    id: "nat29",
    cat: "nature",
    tone: "playful",
    truth: true,
    enQ: "Can a snowball roll downhill?",
    plQ: "Czy śnieżka może stoczyć się z górki?",
    enFact: "A snowball can roll downhill.",
    plFact: "Śnieżka może stoczyć się z górki.",
  },
  {
    id: "nat30",
    cat: "nature",
    tone: "playful",
    truth: false,
    enQ: "Can thunder brush its teeth?",
    plQ: "Czy grzmot może myć zęby?",
    enFact: "Thunder cannot brush teeth.",
    plFact: "Grzmot nie może myć zębów.",
  },

  // Everyday science
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
    tone: "playful",
    truth: false,
    enQ: "Is a cheese sandwich a magnet?",
    plQ: "Czy kanapka z serem jest magnesem?",
    enFact: "A cheese sandwich is not a magnet.",
    plFact: "Kanapka z serem nie jest magnesem.",
  },
  {
    id: "sci18",
    cat: "science",
    tone: "playful",
    truth: true,
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
    tone: "playful",
    truth: true,
    enQ: "Can popcorn pop?",
    plQ: "Czy popcorn może strzelać?",
    enFact: "Popcorn can pop.",
    plFact: "Popcorn może strzelać.",
  },
  {
    id: "sci28",
    cat: "science",
    tone: "playful",
    truth: false,
    enQ: "Does a shadow need breakfast?",
    plQ: "Czy cień potrzebuje śniadania?",
    enFact: "A shadow does not need breakfast.",
    plFact: "Cień nie potrzebuje śniadania.",
  },
  {
    id: "sci29",
    cat: "science",
    tone: "playful",
    truth: true,
    enQ: "Can a soap bubble wobble?",
    plQ: "Czy bańka mydlana może się chwiać?",
    enFact: "A soap bubble can wobble.",
    plFact: "Bańka mydlana może się chwiać.",
  },
  {
    id: "sci30",
    cat: "science",
    tone: "playful",
    truth: false,
    enQ: "Can a spoon run away?",
    plQ: "Czy łyżka może uciec?",
    enFact: "A spoon cannot run away.",
    plFact: "Łyżka nie może uciec.",
  },

  // Math and measures
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
    tone: "playful",
    truth: false,
    enQ: "Does a triangle have a belly button?",
    plQ: "Czy trójkąt ma pępek?",
    enFact: "A triangle does not have a belly button.",
    plFact: "Trójkąt nie ma pępka.",
  },
  {
    id: "mat18",
    cat: "math",
    tone: "playful",
    truth: true,
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
    tone: "playful",
    truth: true,
    enQ: "Is half a cookie smaller than a whole cookie?",
    plQ: "Czy pół ciastka jest mniejsze od całego ciastka?",
    enFact: "Half a cookie is smaller than a whole cookie.",
    plFact: "Pół ciastka jest mniejsze od całego ciastka.",
  },
  {
    id: "mat28",
    cat: "math",
    tone: "playful",
    truth: false,
    enQ: "Can zero cookies fill a jar?",
    plQ: "Czy zero ciastek może napełnić słoik?",
    enFact: "Zero cookies cannot fill a jar.",
    plFact: "Zero ciastek nie napełni słoika.",
  },
  {
    id: "mat29",
    cat: "math",
    tone: "playful",
    truth: true,
    enQ: "Can three toy ducks make one row?",
    plQ: "Czy trzy kaczuszki mogą utworzyć jeden rząd?",
    enFact: "Three toy ducks can make one row.",
    plFact: "Trzy kaczuszki mogą utworzyć jeden rząd.",
  },
  {
    id: "mat30",
    cat: "math",
    tone: "playful",
    truth: false,
    enQ: "Can a square sing a song?",
    plQ: "Czy kwadrat może zaśpiewać piosenkę?",
    enFact: "A square cannot sing a song.",
    plFact: "Kwadrat nie może śpiewać.",
  },

  // Food
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
    tone: "playful",
    truth: true,
    enQ: "Can spaghetti dangle from a fork?",
    plQ: "Czy spaghetti może zwisać z widelca?",
    enFact: "Spaghetti can dangle from a fork.",
    plFact: "Spaghetti może zwisać z widelca.",
  },
  {
    id: "foo26",
    cat: "food",
    tone: "playful",
    truth: false,
    enQ: "Can a sandwich sing opera?",
    plQ: "Czy kanapka może śpiewać operę?",
    enFact: "A sandwich cannot sing opera.",
    plFact: "Kanapka nie może śpiewać opery.",
  },
  {
    id: "foo27",
    cat: "food",
    tone: "playful",
    truth: true,
    enQ: "Can peas roll off a plate?",
    plQ: "Czy groszek może stoczyć się z talerza?",
    enFact: "Peas can roll off a plate.",
    plFact: "Groszek może stoczyć się z talerza.",
  },
  {
    id: "foo28",
    cat: "food",
    tone: "playful",
    truth: false,
    enQ: "Can a banana answer a phone?",
    plQ: "Czy banan może odebrać telefon?",
    enFact: "A banana cannot answer a phone.",
    plFact: "Banan nie może odebrać telefonu.",
  },
  {
    id: "foo29",
    cat: "food",
    tone: "playful",
    truth: true,
    enQ: "Can jelly wobble on a plate?",
    plQ: "Czy galaretka może trząść się na talerzu?",
    enFact: "Jelly can wobble on a plate.",
    plFact: "Galaretka może trząść się na talerzu.",
  },
  {
    id: "foo30",
    cat: "food",
    tone: "playful",
    truth: false,
    enQ: "Can a carrot drive a bus?",
    plQ: "Czy marchewka może prowadzić autobus?",
    enFact: "A carrot cannot drive a bus.",
    plFact: "Marchewka nie może prowadzić autobusu.",
  },

  // Everyday objects and actions
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
    tone: "playful",
    truth: true,
    enQ: "Can a sock cover your hand?",
    plQ: "Czy skarpetka może zakryć dłoń?",
    enFact: "A sock can cover a hand.",
    plFact: "Skarpetka może zakryć dłoń.",
  },
  {
    id: "day26",
    cat: "everyday",
    tone: "playful",
    truth: false,
    enQ: "Can a toothbrush tell jokes?",
    plQ: "Czy szczoteczka może opowiadać dowcipy?",
    enFact: "A toothbrush cannot tell jokes.",
    plFact: "Szczoteczka nie opowiada dowcipów.",
  },
  {
    id: "day27",
    cat: "everyday",
    tone: "playful",
    truth: true,
    enQ: "Can a hat cover your head?",
    plQ: "Czy kapelusz może zakryć głowę?",
    enFact: "A hat can cover your head.",
    plFact: "Kapelusz może zakryć głowę.",
  },
  {
    id: "day28",
    cat: "everyday",
    tone: "playful",
    truth: false,
    enQ: "Can a chair eat lunch?",
    plQ: "Czy krzesło może jeść obiad?",
    enFact: "A chair cannot eat lunch.",
    plFact: "Krzesło nie może jeść obiadu.",
  },
  {
    id: "day29",
    cat: "everyday",
    tone: "playful",
    truth: true,
    enQ: "Can a paper airplane glide?",
    plQ: "Czy papierowy samolot może szybować?",
    enFact: "A paper airplane can glide.",
    plFact: "Papierowy samolot może szybować.",
  },
  {
    id: "day30",
    cat: "everyday",
    tone: "playful",
    truth: false,
    enQ: "Can a sock drive a bus?",
    plQ: "Czy skarpetka może prowadzić autobus?",
    enFact: "A sock cannot drive a bus.",
    plFact: "Skarpetka nie może prowadzić autobusu.",
  },
];
```
