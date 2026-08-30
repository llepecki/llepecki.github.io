# Yes / No Reflex: Implementation Review, Round 2

> **Remediation status (2026-08-16).** All ten findings applied:
> R2-1 phase-specific panel (play shows only the rule key; progress lives in
> the HUD; the Last round section is gone); R2-2/R2-7 stage-based tutorial
> with colocated labeled controls, step-heading focus, and one coherent
> announcement per step; R2-3 keyboard contract (Y/N in every language, PL
> adds T, Space = Next with repeat guard, on-control key hints, dashed
> waiting state; the reported EN failure was the Polish auto-init deliberately
> ignoring Y — abolished; the temporary `[INVESTIGATION]` key logging was
> removed after the diagnosis was confirmed); R2-4
> Dynamic cues mode (session-scoped randomized profiles, warm-up examples,
> profile-aware rule card, full colorless playability); R2-5 flex containment
> (growth scoped to `.btn-row`, explicit transitions, Pause moved into the
> HUD) verified by real-Chrome bounding boxes; R2-6 complete modal overlay
> (aria-modal, labelled/described, Continue button, inert/Tab-trap); R2-8
> contrast (secondary text `#5f6f76`, overlay ink `#0b171b`, `CLAUDE.md`
> palette updated); R2-9 committed harnesses (`npm run yesnoreflex-dom-check`,
> 195 checks; `npm run yesnoreflex-layout-check`, 42 real-Chrome checks);
> R2-10 doc counts corrected. Gates: rules checker 12,208 checks green
> (30k sessions + 2k cue profiles), repo code-review 0 findings, app/spec
> bank verbatim-identical. **Still open:** the human gates in section 5
> (Polish review, child testing, live screen-reader matrix, moderated
> testing).
>
> **SUPERSEDED (2026-08-16) — see
> `yesnoreflex/docs/implementation-review-round-3-2026-08-16.md`.** The check
> totals quoted above (195 DOM checks, 42 layout checks, 12,208 rules checks)
> describe the round-2 implementation and are historical, not current; the
> round-3 report carries the current totals. The R2-4 "Dynamic cues mode"
> described above no longer exists as a selectable mode: round 3 replaced the
> CLASSIC/DYNAMIC choice, the semantic question-text colors, and the inline
> switch badge with one randomized colored-shape cue system, a `V2` profile
> contract, and a full-viewport switch dialog. Everything else recorded here
> (R2-1, R2-2/R2-7, R2-3, R2-5, R2-6, R2-8, R2-9, R2-10) still holds.

> **Question bank superseded (2026-08-17) — see
> `yesnoreflex/docs/implementation-review-round-4-2026-08-16.md`.** Every
> question-bank total, per-category quota, and question-selection instruction
> in this document describes the retired 108-record, six-category bank. The
> shipped bank is now the 240-record, eight-category bank in that review's
> Appendix A, with a two-tier recency history. Non-content findings in this
> document remain applied.

Review date: `2026-08-16`

Reviewed implementation: `yesnoreflex/index.html`

Related documents:

- `yesnoreflex/docs/req.md`
- `yesnoreflex/docs/implementation-review-2026-08-15.md`
- `tools/yesnoreflex-rules-check.mjs`

## 1. Verdict

The first review's R1-R6 code findings have been implemented correctly, and
the deterministic rule engine remains strong. The application is nevertheless
not ready to close the implementation review.

The most important remaining problem is no longer the rule engine. It is the
interaction design around it. The permanent control panel is too dense, the
tutorial divides one task between controls on opposite sides of the screen,
the intended keyboard contract is incomplete and reportedly unreliable, and
the Pause control has an intermittent severe layout failure. These defects add
visual search, pointer travel, and interface management to a game whose purpose
is fast rule switching.

There are also unresolved accessibility defects from the second source review:
the result overlay is not a complete modal dialog, tutorial step context is not
announced coherently, and several foreground/background pairs fail WCAG 2.1 AA
contrast.

Priority summary:

| Priority | Count | Meaning                                                      |
| -------- | ----: | ------------------------------------------------------------ |
| P0       |     0 | No data-loss or security blocker found.                      |
| P1       |     8 | Must be corrected before moderated child testing or release. |
| P2       |     2 | Correct before closing the implementation review.            |

## 2. Evidence And Limitations

Checks rerun during this review:

```text
npm run code-review -- yesnoreflex/index.html
0 findings: 0 high, 0 medium, 0 low

node tools/yesnoreflex-rules-check.mjs
OK: 155 checks passed
L1/L2/L3: 10,000 generated sessions per level
```

The app and specification question banks remain verbatim-identical at 108/108
records. The first review's R1-R6 changes were also confirmed in source.

No interactive browser was attached to the review environment. The layout and
keyboard findings therefore combine source inspection with direct user reports.
Where the static source does not explain the reported runtime behavior, this
document labels the cause as unconfirmed and requires investigation rather than
asserting a speculative root cause.

## 3. P1 Findings

### R2-1. The Control Panel Is Too Dense And Competes With The Game

**Evidence:** `yesnoreflex/index.html:1544-1770`,
`yesnoreflex/index.html:4511-4523`, and
`yesnoreflex/index.html:4839-4878`.

The 320px side panel contains all of the following at once:

- the full color and shape rule key;
- mode, difficulty, and pace controls;
- Start;
- progress and points;
- the previous round's reasoning and fact;
- expandable help, keyboard help, and tutorial replay.

During a session, the configuration controls are disabled but remain visible.
This is not harmless decoration. Disabled controls continue to occupy a large
part of the visual field and compete with the cue, question, timer, and stable
Yes/No response area. Progress is also duplicated between the HUD and panel.

For a cognitive-flexibility game, the interface should minimize irrelevant
stimuli. Here, the child must filter interface noise in addition to applying
the intended FACT/FLIP rule.

**Best correction:** make the panel phase-specific through progressive
disclosure.

- **Setup:** show Session settings and Start. Put detailed rules behind one
  compact Help/Tutorial action.
- **Play:** hide Session settings, Start, tutorial replay, and expanded help.
  Keep only a compact active-rule reminder if testing proves it is needed.
  Keep progress and score in the HUD, not in two locations.
- **Feedback:** show the authored fact beside the question in the stage; do not
  require the separate Last round section.
- **Summary:** keep replay and settings actions with the summary.

The preferred play layout is the cue, question, Yes/No controls, immediate
feedback, and a compact HUD. The side panel should not remain a permanent
dashboard merely because desktop width is available.

**Acceptance criteria:**

1. Starting a session removes all configuration controls from the visual and
   keyboard focus order.
2. Play has one progress display and one active-rule display.
3. A five-second observation test makes the cue/question/Yes-No path dominant;
   no panel control competes as a primary action.
4. The same information hierarchy is preserved at 360px width and 200% zoom.

### R2-2. Tutorial Navigation Is Too Far From The Yes/No Controls

**Evidence:** the Yes/No buttons are in the stage at
`yesnoreflex/index.html:1424-1442`, while tutorial Previous/Next controls are
in the side panel at `yesnoreflex/index.html:1752-1821`.

The tutorial asks the child to answer on the main stage, then move attention
and pointer to arrow-only Previous/Next controls in the side panel. On desktop
this creates a long horizontal jump. On mobile, the panel can sit below the
stage and create an even larger vertical separation. The arrows are also only
40x40px, below the 44px minimum used elsewhere for repeatedly activated
controls.

This spatial split disrupts the motor pattern the tutorial is supposed to
teach. The child should learn one response zone and keep using it.

**Best correction:** move the tutorial's step controls into the stage.

- Put the step title/instruction above the cue or question.
- Keep Yes and No in their final game positions.
- After a correct answer, reveal a labeled `Next` button immediately below the
  answer row or replace the feedback action in that same response zone.
- Put a secondary `Previous` action beside the step counter, not on the far
  edge of another panel.
- Prefer text labels (`Previous`, `Next`) with optional arrows over unlabeled
  arrow-only presentation.
- Use at least 44x44px targets; 48x48px is preferable for this audience.

**Acceptance criteria:** a child can complete the tutorial without moving the
pointer between the stage and side panel, and the keyboard focus sequence stays
within the same local task area.

### R2-3. The Keyboard Contract Is Incomplete And Reportedly Does Not Work

**Evidence:** `yesnoreflex/index.html:5260-5290`,
`yesnoreflex/index.html:5523-5582`, and
`yesnoreflex/index.html:1739-1767`.

The reported behavior is that keyboard answering does not work and Space does
not advance. Static inspection shows that keyboard support is present, but it
does not match the expected contract:

- English accepts `Y` and `N` during the question phase.
- Polish changes the affirmative shortcut from `Y` to `T`; `Y` is ignored.
- Space has no explicit application-level `Next` behavior. In Practice it only
  works incidentally because focus is moved to the native Next button.
- Keyboard help is inside a collapsed panel, so even working shortcuts are not
  discoverable during play.
- Input is intentionally ignored during cue and feedback phases, which can look
  like a broken shortcut if the active state is not obvious.

The source therefore disproves a literal claim that no keyboard handlers exist,
but it confirms an inconsistent and fragile user-facing keyboard contract. It
does not explain a failure of `Y/N` during an English question; that runtime
symptom must be reproduced before assigning a root cause.

**Best correction:**

1. Make `Y = Yes` and `N = No` stable in every language. Polish may additionally
   accept `T = Tak`, but changing the physical reflex keys with language is a
   poor fit for this game.
2. During Practice feedback and eligible tutorial steps, make Space an explicit
   `Next` shortcut. Call `preventDefault()`, ignore repeated keydown events, and
   ensure one press advances at most once.
3. Show compact key hints on the relevant controls, for example `YES  Y`,
   `NO  N`, and `NEXT  SPACE`, rather than hiding the entire contract in Help.
4. Do not accept answers before the question phase. Make the disabled/waiting
   state visually obvious so ignored early presses do not appear broken.
5. Add automated key-event tests for English and Polish, every game phase,
   tutorial interactive/non-interactive steps, focus on each relevant control,
   modifier chords, and key repeat.

Because the reported English failure is not explained by the source, begin with
targeted temporary logs prefixed `[INVESTIGATION]`. Capture `event.key`,
`event.code`, current phase, language, focused element, modifiers, repeat state,
and the selected handler branch. Reproduce the failure, identify the exact
branch, then remove the investigation logs before release.

### R2-4. The Game Lacks A Randomized Question-Color And Symbol Mode

**Evidence:** the question text always uses the fixed foreground at
`yesnoreflex/index.html:434-443`. The rule engine hard-codes blue/gold and
triangle/circle meanings at `yesnoreflex/index.html:2999-3020`, and the
localized rule descriptions repeat those fixed mappings at
`yesnoreflex/index.html:3723-3726` and `:3850-3853`.

The requested cognitive-flexibility mode is missing. In that mode, the color of
the question itself must be capable of saying FACT or FLIP, just as a displayed
colored symbol can. Both parts of the symbol vocabulary must change between
sessions: its shape and its fill color. A child should not be able to turn
`gold = FLIP`, `circle = FLIP`, or a particular colored shape into a permanent
habit.

The current implementation varies the sequence of cue values, but not their
identity or meaning:

- blue always means FACT;
- gold always means FLIP;
- triangle always means FACT;
- circle always means FLIP;
- the question text never participates in the rule.

That trains a fixed stimulus-response association. It does not provide the
requested remapping challenge from one game to the next.

**Best correction:** add a setup-only **Dynamic cues** mode. Do not add another
permanent control to the already crowded play panel.

At the start of each session, generate an immutable cue profile such as:

```js
{
  questionColors: { fact: "purple", flip: "teal" },
  symbols: {
    fact: { shape: "triangle", color: "yellow" },
    flip: { shape: "pentagon", color: "purple" }
  }
}
```

The names above are examples, not fixed mappings. Generate the profile from
approved pools and apply these rules:

1. Select two clearly distinguishable question-text colors without replacement.
2. Randomly assign one selected color to FACT and the other to FLIP.
3. Select two clearly distinguishable shapes without replacement.
4. Select two clearly distinguishable symbol-fill colors without replacement.
5. Randomly pair the selected shapes and colors to create compound symbol
   tokens, for example yellow triangle and purple pentagon.
6. Randomly assign one compound symbol token to FACT and the other to FLIP.
7. Keep the resulting profile stable for the whole session.
8. Generate a different profile for the next session. Reject an exact repeat of
   the immediately preceding profile when enough alternatives exist.
9. Do not correlate question truth, expected answer, category, or playful tone
   with a specific color or symbol.

The actual question should use one color across the entire sentence. Coloring
individual words differently would introduce visual parsing time and undermine
the reflex-first goal.

Use independent approved pools of familiar shapes and safe fill colors. Example
session tokens include a yellow triangle, purple pentagon, green square, or blue
circle. The examples are possible combinations, not permanent pairings. A
triangle must be able to appear with different colors in different sessions,
and the same colored triangle must be able to take either FACT or FLIP meaning
across the generated-session population.

The shape pool may include circle, triangle, square, pentagon, and star. Do not
use check marks, crosses, thumbs, or arrows: they carry pre-existing Yes/No,
success/failure, or direction meanings. Avoid near-duplicate pairs such as
square/diamond or circle/oval in the same session.

Treat a colored symbol as one **atomic cue token** by default. `Yellow triangle`
has one meaning as a pair; yellow alone and triangle alone do not silently carry
separate meanings. Making both properties independently meaningful without an
explicit active-rule instruction would create an ambiguous trial. If a future
advanced variant intentionally separates them, its badge must say exactly
`FOLLOW SYMBOL COLOR` or `FOLLOW SYMBOL SHAPE`, and the scheduler must apply the
same conflict-balancing rules used for other dimensions.

If the product specifically uses **symbol present = FLIP, no symbol = FACT**,
reserve a fixed symbol slot so the question and buttons never move, and announce
the absence explicitly to assistive technology. Two explicit symbols are still
the preferred design because absence is a weaker, easier-to-miss stimulus.

#### Session And Difficulty Behavior

- Before the first scored question, show the session's mapping in one compact
  rule card and run two unscored examples: one FACT and one FLIP.
- In the basic variant, the question-text color is the only active dimension.
- In the mixed variant, both question color and a colored symbol are visible and
  the active-rule badge says `FOLLOW QUESTION COLOR` or `FOLLOW SYMBOL`.
- Higher difficulty may switch the active dimension during the session, using
  the existing switch scheduling and conflict balancing.
- The mapping must never change in the middle of a session. Mid-session token
  remapping would turn trained inhibition into arbitrary guessing.

#### Accessibility And Visual Constraints

Question color and symbol color are functional information, so arbitrary CSS
colors are not acceptable. Build prevalidated text-color and symbol-fill
palettes. Every question-text color must:

- have at least 4.5:1 contrast against the question background;
- remain distinguishable from its paired color under common color-vision
  deficiencies;
- not be reused for correct/wrong feedback, timer urgency, or disabled state;
- have a redundant non-color marker or textual legend.

Every colored symbol must have a dark, high-contrast outline and at least 3:1
graphical-object contrast against its background. Its shape provides redundant
information for the fill color, but the complete colored token and meaning must
also be available in the rule card and accessible name.

Never randomly pair red and green as the only distinction. The non-color marker
may be a matching underline/pattern token or an explicitly labeled swatch in the
rule card. Screen-reader announcements should state one complete rule, for
example: `Follow symbol. Yellow triangle means FLIP. Question: ...`.

#### Data And Test Requirements

- Store the generated cue profile with the session schedule so rendering,
  scoring, feedback, debug output, and announcements use the same immutable
  mapping.
- Replace hard-coded checks such as `gold` and `circle` with meaning lookup
  through the session profile.
- Extend deterministic generation tests to prove that every approved question
  color, shape, symbol-fill color, and allowed compound symbol can appear in
  both FACT and FLIP roles across sessions.
- Generate at least 10,000 sessions per difficulty and assert balance, switch,
  conflict, run-length, and no-repeat constraints still hold.
- Add tests for exact-profile rejection, shape/color re-pairing, storage
  failure, seeded deterministic fallback, text and graphical contrast,
  color-vision pair restrictions, bilingual rule announcements, and replay
  with a newly generated profile.

**Acceptance criteria:** consecutive sessions visibly use different valid cue
profiles; symbol shapes and their colors are reselected and re-paired between
games; neither a question color, symbol shape, symbol-fill color, nor compound
colored symbol has a permanent meaning; the mapping is learned before scoring
and remains stable during that session; and the mode remains fully playable
without color perception.

### R2-5. Pause Can Intermittently Grow To Full-Screen Height

**Evidence:** direct user observation plus the shared flex rules at
`yesnoreflex/index.html:685-723` and the Pause overrides at
`yesnoreflex/index.html:525-540`.

The Pause button has reportedly expanded to nearly the full height of the game
area. That is a severe interaction and layout failure because it obscures play
and turns a secondary control into an accidental dominant target.

The exact trigger is not established by static inspection. The current CSS has
`.action-btn { flex: 1; }` as a global base rule and later tries to neutralize it
with `.pause-btn { flex: none; }`. The override should normally win, so this is
not sufficient evidence to claim it is the proven root cause. It is nevertheless
a fragile cascade: a generic button class should not impose parent-specific flex
growth that every special placement must undo.

**Best correction:**

1. Reproduce across phase changes, pause/resume cycles, language changes,
   360/720/1280px widths, short viewport heights, and 100%/200% zoom.
2. Add temporary `[INVESTIGATION]` logging when Pause becomes visible. Record
   its `getBoundingClientRect()` and computed `display`, `height`, `flex-grow`,
   `flex-basis`, `align-self`, and parent dimensions.
3. Remove `flex: 1` from the generic `.action-btn`. Apply equal growth only
   where it is intended, such as `.btn-row > .action-btn { flex: 1; }`.
4. Give the Pause container and button explicit non-growing geometry, for
   example `flex: 0 0 auto`, a bounded block size, and `align-self: flex-end`.
5. Prefer moving Pause into the compact HUD beside the timer/score. This removes
   the separate stage footer and makes the secondary action stable.
6. Replace `transition: all` on controls with explicit color/background/border
   transitions so layout properties cannot animate unexpectedly.
7. Add a visual/layout regression test that asserts the Pause bounding box
   remains within its specified size after repeated show/hide and pause/resume
   transitions.

**Acceptance criteria:** Pause remains a compact 44-48px-high action in all
tested phases and viewports, never overlaps the cue/question, and never changes
the size or position of Yes/No.

### R2-6. Result Overlay Is Not A Complete Modal Dialog

**Evidence:** `yesnoreflex/index.html:5055-5110`.

The overlay receives focus and `role="dialog"`, but has no accessible name, no
`aria-modal`, and no focus containment. Tab can move focus to invisible controls
behind the full-screen overlay. The overlay also has `aria-live="polite"` while
the central live region announces the same summary, risking duplicated speech.

**Best correction:**

- connect the message using `aria-labelledby` and details using
  `aria-describedby`;
- set `aria-modal="true"`;
- provide and focus a real Continue/Dismiss button;
- make the application behind it `inert` until dismissal, or trap focus;
- remove the overlay live region and use the existing centralized announcer;
- retain Escape, Enter, Space, click dismissal, and focus restoration.

### R2-7. Tutorial Step Changes Lack Screen-Reader Context

**Evidence:** `yesnoreflex/index.html:5145-5225`.

On a step change, focus moves directly to Yes, Next, or Start. The new step
title, instruction, active rule, cue meaning, and question are not exposed as
one coherent description of the focused action. The visually hidden cue text
is populated but is not associated with those controls.

**Best correction:** place the tutorial in the stage as proposed in R2-2, then
give each step a programmatically focusable heading or associate the complete
step context with the initially focused action using `aria-describedby`. Test
every step, wrong-answer retry, solved-step transition, and both languages.

### R2-8. Secondary And Overlay Text Fails WCAG 2.1 AA Contrast

**Evidence:** `yesnoreflex/index.html:57-58` and
`yesnoreflex/index.html:1022-1051`.

Measured normal-text contrast includes:

| Combination                    | Approximate ratio |                 Required |
| ------------------------------ | ----------------: | -----------------------: |
| `#78909c` on white             |            3.35:1 |                    4.5:1 |
| `#90a4ae` on white             |            2.59:1 |                    4.5:1 |
| white on perfect green overlay |            2.16:1 | 4.5:1 normal / 3:1 large |
| white on close blue overlay    |            3.94:1 |             4.5:1 normal |
| white on far yellow overlay    |            1.89:1 | 4.5:1 normal / 3:1 large |

The 85%-opacity overlay hint has still lower contrast. These colors come from
the shared design instructions in `CLAUDE.md:109-110` and `CLAUDE.md:606-608`,
so an isolated app override would leave the repository standard incorrect.

**Best correction:** darken secondary text to `#5f6f76` or darker, use tested
opaque overlay foregrounds (for example `#0b171b` passes against all three
current composites), and update the canonical palette in `CLAUDE.md` at the
same time.

## 4. P2 Findings

### R2-9. The Claimed DOM/Timer/Storage Checks Cannot Be Reproduced

**Evidence:** the remediation banner in
`yesnoreflex/docs/implementation-review-2026-08-15.md:13` claims 132 headless
DOM checks, but there is no checked-in harness or package script for them.
`tools/yesnoreflex-rules-check.mjs` verifies the pure rules engine, not focus,
keyboard dispatch, Pause layout, synthetic time, event idempotence, or storage
failure.

**Best correction:** commit the headless harness as a repository tool, add an
npm command, and cover R2-1 through R2-8 as well as the original R1-R6
behavior. Layout-sensitive cases should have browser-level visual/bounding-box
checks.

### R2-10. Requirements And Review Evidence Still Use Stale Counts

**Evidence:** `yesnoreflex/docs/req.md:39`, `:128`, `:282`, `:863`, and `:936`
still say 96 questions, while the shipped and normative section 20 banks contain 108. The first review body also retains historical 96-question and 147-check
statements beneath a 108-question/155-check remediation banner.

**Best correction:** change all normative requirements to 108 and clearly mark
historical review evidence as superseded. Do not delete the first review until
its still-open human gates are complete.

## 5. Question-Bank Status And Human Release Gates

No additional question was identified with sufficient confidence for another
static discard list. That is not evidence that the bank has passed its core
reflex-fit requirement. The previous review still requires:

1. a fluent Polish review of every question and fact;
2. testing with at least five children across the target age range;
3. rewriting any item not answered confidently within roughly one second by
   at least four of the five children;
4. checking that children do not find an item ambiguous or dependent on an
   unusual edge case;
5. the live browser and screen-reader matrix;
6. the moderated-testing exit criteria.

These gates are explicitly still open in
`yesnoreflex/docs/implementation-review-2026-08-15.md:14-17` and
`:919-932`. The statement that all review points have been addressed is
therefore not accurate yet.

## 6. Dimension Ratings

| Dimension               | Rating                  | Assessment                                                                                                                                             |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core rule correctness   | Strong for current mode | Truth inversion, balancing, scheduling, scoring, and question-bank invariants pass deterministic checks; dynamic session mappings are not implemented. |
| Interaction correctness | Needs work              | Keyboard behavior is inconsistent and Pause has an unresolved severe layout failure.                                                                   |
| Usability and hierarchy | Needs redesign          | Permanent controls and split tutorial navigation interfere with the core response loop.                                                                |
| Accessibility           | Not release-ready       | Modal semantics, tutorial context, focus behavior, and contrast require correction.                                                                    |
| Performance             | Strong                  | No hot-path or unbounded-runtime problem was found.                                                                                                    |
| Security and privacy    | Strong                  | Static local app, no backend, no analytics, no sensitive-data path found.                                                                              |
| Maintainability         | Needs work              | Generic flex styling is fragile; interaction checks are not reproducible; documentation is internally inconsistent.                                    |

## 7. What Is Working Well

- The FACT/FLIP truth model is clean and independently checkable.
- Session generation passed 30,000 seeded sessions across three levels.
- The 108-question bank is structurally balanced and synchronized with the
  specification.
- The previous pause-aware response-time, storage fallback, best-score, and
  state semantics fixes are present.
- Yes/No locations are stable within the stage itself.
- Feedback explains both the authored fact and the rule inversion instead of
  treating an inverted response as misinformation.

## 8. Recommended Remediation Order

1. Simplify phase-specific layout and colocate tutorial actions (R2-1, R2-2).
2. Establish and test the keyboard contract (R2-3).
3. Design and implement session-scoped randomized cue profiles (R2-4).
4. Reproduce, instrument, and contain the Pause layout defect (R2-5).
5. Correct modal, tutorial, and contrast accessibility (R2-6 to R2-8).
6. Check in the interaction test harness and clean documentation (R2-9,
   R2-10).
7. Run the human question, Polish, browser, screen-reader, and moderated-child
   validation gates.
8. Rerun both existing automated checks and the new interaction/layout suite.
9. Delete both one-time implementation review documents only after every P1,
   P2, and human gate is closed.
