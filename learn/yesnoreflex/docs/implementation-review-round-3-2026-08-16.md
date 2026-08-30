# Yes / No Reflex: Implementation Review, Round 3

> **Remediation status (2026-08-16): IMPLEMENTED — automated gates green,
> human gates open.** All eight findings (R3-1 … R3-8) are applied. The app
> now ships one randomized colored-shape cue system: every session draws two
> session colors and two session shapes, assigns FACT/FLIP roles, teaches the
> mapping in two untimed warm-ups, and switches only between `FOLLOW COLOR`
> and `FOLLOW SHAPE`. The CLASSIC/DYNAMIC selector, `state.dynamic`, the
> saved `dynamic` preference, the semantic question-text colors and their
> tag, `FOLLOW QUESTION COLOR` / `FOLLOW SYMBOL`, the fixed
> blue/gold/triangle/circle mappings, the two competing setup previews, the
> inline switch badge, and every compatibility rendering branch are removed
> from UI, state, storage, copy, help, tutorial, and tests. Practice/Sprint,
> the three difficulty schedules, scoring, localization, and the
> accessibility paths are unchanged, and the question bank is still exactly
> 108 verbatim records.
>
> **Exact final gate totals** (run from `learn/` on 2026-08-16, after the
> last code change):
>
> ```text
> npm run code-review -- yesnoreflex/index.html
> 0 finding(s): 0 high, 0 medium, 0 low
>
> node tools/yesnoreflex-rules-check.mjs
> OK: 10201 checks passed
>
> npm run yesnoreflex-dom-check
> OK: 436 DOM checks passed
>
> npm run yesnoreflex-layout-check
> OK: 276 real-Chrome layout checks passed
> ```
>
> Read the rules-check total as a *changed suite*, not a coverage regression.
> Section 2's historical 18,205 counted the old Dynamic-profile assertions;
> the V2 suite that replaced them asserts five properties per draw across
> 2,000 draws plus the exhaustive fallback and the 18-case
> `isValidCueProfileV2` matrix. Session coverage is unchanged at 10,000
> generated sessions per level (30,000 total), each checked by an independent
> checker AND by the app's own `validateSession`. The DOM suite grew from 222
> to 436 checks and the Chrome suite from 42 to 276.
>
> **Per-finding disposition**
>
> | Finding | Status | How |
> | --- | --- | --- |
> | R3-1 mobile startup viewport | applied | `alignPlayViewport()` runs on `requestAnimationFrame` from the shared `startSession()` path (Start, Play again, tutorial start) and calls `hudRow.scrollIntoView({ block: "start", behavior: "auto" })` at the mobile breakpoint. The Chrome harness now measures VIEWPORT coordinates via `vbox()`, for Level-1 color, Level-1 shape, and Level-2 sessions in both modes. |
> | R3-2 corrupt stored profiles | applied | `isValidCueProfileV2()` is the storage boundary; only `{version: 2, profile: valid}` becomes the previous profile. 12 malformed shapes plus V1 data and a throwing `localStorage` accessor all reach the first warm-up in the DOM suite; 18 reject cases and the accept case are unit-tested in the rules suite. |
> | R3-3 fallback could repeat a cue set | applied | Bounded random attempts, then an enumeration of every legal unordered color pair and shape pair in stable pool order, selecting the first whose color set AND shape set both differ from the valid previous profile. No constant fallback remains. Verified with a constant RNG for no-previous, first-legal-previous, and previous-fallback cases, and across 2,000 consecutive draws. |
> | R3-4 two competing cue systems | applied | Single system per section 3. Setup has Mode, Difficulty, Pace, Start and no cue selector; trials carry semantic `"fact"`/`"flip"` roles resolved through the frozen V2 profile at render time; the question's computed color is the normal stimulus color (`#263238`, asserted live). Guards assert no `qcolor-`, no `FOLLOW QUESTION COLOR`/`FOLLOW SYMBOL`, no legacy `blue`/`gold` token classes, and no stripe vocabulary anywhere in the shipped file. |
> | R3-5 switch salience | applied | Dedicated `switch` phase and a full-viewport neutral dialog with `SWITCH!`, the new rule at 22px, both tokens with localized names and FACT/FLIP meanings, the until-next line, Continue, and the `ENTER / SPACE` hint. Clocks unarmed, background inert, focus trapped, one coherent announcement, dismissal only by Continue/Enter/Space (on keyup) with the event consumed, then focus to `#hudRule` with `preventScroll`. Counts asserted end-to-end: L1 = 0, L2 = 3, L3 = 8. Escape, backdrop, `Y`/`N`, arrows, Pause, and held keys are all rejected. The tutorial's step 5 opens the same dialog with its demo profile. |
> | R3-6 panel typography | applied | `.seg-btn` 13px / 44px, `.seg-btn.star-btn` 15px, `.action-btn` 13px / 48px — asserted as computed styles in Chrome, together with gameplay type staying large (question 34px, answer labels 24px on 76px targets) and English/Polish panel labels neither wrapping nor clipping at 320 and 360px. |
> | R3-7 ambiguous setup example | applied | `Does the Sun shine?` / `Czy Słońce świeci?` in static markup and both I18N tables; `water wet` / `woda jest mokra` appear nowhere. A permanent DOM check compares every static label against its English translation, so no stale pre-translation flash can return. |
> | R3-8 stale evidence | applied | This header carries the exact final totals; the Round-2 header now carries a superseding note; `yesnoreflex/docs/req.md` sections 6, 7.4, 7.5, 8, 9, 11, 12, 13, 15, 16, and 18 describe the shipped unified system, the V2 storage contract, and the switch dialog. |
>
> **Two defects found during this remediation** (both fixed, both now
> permanently guarded): a mid-dialog language switch re-translated only the
> dialog heading and button, leaving the active rule, mapping rows, and
> until-next line in the previous language; and three cue shapes still
> carried the legacy `blue` class from the removed vocabulary. Both were
> found by driving the real app in Chrome, not by the harnesses.
>
> **Still open — human gates. These are NOT automated successes:**
>
> - native-speaker Polish review (all round-3 copy is new: setup points,
>   help text, tutorial steps 2-5, and the whole switch dialog);
> - moderated testing with children in the target age range, including the
>   comprehension of the new switch dialog and whether the two warm-ups are
>   enough to learn a fresh mapping;
> - live screen-reader / browser matrix (the dialog's inert + focus-trap +
>   single-announcement behavior is asserted in jsdom and Chrome geometry,
>   not with a real screen reader);
> - human ambiguity and five-second hierarchy checks on the revised setup
>   screen and the switch dialog.
>
> The original open status and its evidence are preserved below as the
> historical record for this round.
>
> **Totals superseded (2026-08-17) — see
> `yesnoreflex/docs/implementation-review-round-4-2026-08-16.md`.** The
> round-4 review replaced the 108-record six-category question bank with 240
> records in eight categories and replaced the flat 32-ID recent list with a
> two-tier session history, so the rules and DOM totals quoted above (10,201
> and 436) are historical. The round-4 report carries the current totals. Every
> round-3 finding (R3-1 … R3-8) remains applied and is still covered by the
> harnesses. The "108 verbatim records" statements in this document
> (its verdict, R3-7, and Definition of Done item 11) were true for round 3
> and are now historical; the shipped bank is 240 records in eight
> categories.

Review date: `2026-08-16`

Reviewed implementation: `yesnoreflex/index.html`

Related documents and harnesses:

- `yesnoreflex/docs/req.md`
- `yesnoreflex/docs/implementation-review-2026-08-15.md`
- `yesnoreflex/docs/implementation-review-round-2-2026-08-16.md`
- `tools/yesnoreflex-rules-check.mjs`
- `tools/yesnoreflex-dom-check.mjs`
- `tools/yesnoreflex-layout-check.mjs`

## 1. Verdict

The previous round's major interaction corrections are present: the play panel
is phase-specific, answer controls stay in the response zone, keyboard
shortcuts exist, Pause is contained, the result celebration is modal, Dynamic
cues have a warm-up, and the current deterministic gates are green.

The application is nevertheless not ready to close review. Two failures cross
P0 acceptance boundaries: starting a game from the mobile setup panel can
leave the active rule and cue outside the viewport, and valid-but-malformed
stored profile JSON can throw during Dynamic session startup. The emergency
profile fallback also does not uphold the promised game-to-game variation.

More fundamentally, the CLASSIC/DYNAMIC choice exposes two competing mental
models for one game. The required product direction is now one randomized
colored-shape system. Each game chooses two colors and two shapes, keeps that
mapping for the session, and asks the player to follow either color or shape.
Question text is no longer a cue. Practice/Sprint and the three difficulty
levels remain; only the cue-system selector is removed.

The current inline switch badge is also too weak for a task whose central skill
is switching. Every real rule change must become a deliberate, full-viewport,
untimed transition that shows the next rule and its complete session mapping
before play can continue.

Priority summary:

| Priority | Count | Meaning                                                   |
| -------- | ----: | --------------------------------------------------------- |
| P0       |     2 | Blocks an acceptance requirement or can block play.       |
| P1       |     5 | Required product, interaction, content, or UI correction. |
| P2       |     1 | Documentation and evidence integrity correction.          |

## 2. Evidence And Review Limits (historical — pre-remediation)

The following checks were rerun against the **pre-remediation** source. They
are the evidence for the findings below, not the current gate totals; the
status header carries those.

```text
npm run code-review -- yesnoreflex/index.html
0 findings: 0 high, 0 medium, 0 low

node tools/yesnoreflex-rules-check.mjs
OK: 18,205 checks passed
L1/L2/L3: 10,000 generated sessions per level
Dynamic profiles: 2,000 seeded draws

npm run yesnoreflex-dom-check
OK: 222 DOM checks passed

npm run yesnoreflex-layout-check
OK: 42 real-Chrome layout checks passed
```

The automated success does not invalidate the findings below. The current
layout checker converts viewport coordinates into document coordinates, which
masks content that is rendered correctly in the document but scrolled outside
the visible viewport. The current profile tests exercise valid generated and
persisted profiles but do not pass malformed, structurally incomplete version-1
objects into session startup. The fallback test verifies legality, not
non-repetition relative to the previous profile.

The 108-question bank still passes its structural and balancing checks. No
question-bank replacement is required in this round. The ambiguous prompt
identified below is setup-preview copy, not a question-bank record.

The following human gates remain open and must not be reported as automated
successes:

- native-speaker Polish review;
- moderated testing with children in the target age range;
- live screen-reader/browser matrix;
- human ambiguity and five-second hierarchy checks.

## 3. Authoritative Cue-System Decision

This section is normative. It supersedes conflicting CLASSIC/DYNAMIC and
question-color requirements in `yesnoreflex/docs/req.md`. The implementation
agent must update that specification in the same change.

### 3.1 One Cue System, Two Play Modes

Keep the **Practice** and **Sprint** play modes:

- Practice remains untimed, unscored, and manually advanced.
- Sprint remains timed and scored.

Remove the **CLASSIC** and **DYNAMIC** cue-system choice. There is exactly one
cue system in every Practice and Sprint game:

1. At session start, select two distinct fill colors and two distinct shapes.
2. Assign one color and one shape to `FACT`; assign the other color and shape
   to `FLIP`.
3. Keep those four meanings fixed until the session ends.
4. On Levels 2 and 3, show one colored shape on each trial. The active rule is
   either `FOLLOW COLOR` or `FOLLOW SHAPE`.
5. The inactive dimension remains a distractor on Levels 2 and 3. Congruent and
   conflict scheduling remains unchanged.
6. Question text always uses the normal question color. It never carries a
   rule meaning.

The allowed pools are the already reviewed Dynamic symbol pools:

- colors: `yellow`, `green`, `blue`, `purple`, `orange`;
- shapes: `circle`, `triangle`, `square`, `pentagon`, `star`.

Continue to enforce the existing forbidden color-pair matrix and dark shape
outlines. Every displayed color cue must include a visible localized color-name
tag near the cue, so applying the color rule never depends on hue perception
alone. Screen-reader cue text must name both the shape and color.

### 3.2 Required Internal Profile Contract

Persist the last used session profile under a new key,
`yesnoreflexProfileV2`, in this exact logical form:

```json
{
  "version": 2,
  "profile": {
    "colors": { "fact": "green", "flip": "purple" },
    "shapes": { "fact": "triangle", "flip": "square" }
  }
}
```

The in-memory profile and all nested objects must be frozen. Trial scheduling
must represent each cue dimension semantically as `fact` or `flip`; rendering
resolves the semantic role through the session profile. The answer rule is:

```js
const invert =
  trial.activeRule === "color"
    ? trial.colorCue === "flip"
    : trial.shapeCue === "flip";

const expectedAnswer = invert ? !question.truth : question.truth;
```

Do not keep physical legacy tokens such as `blue`, `gold`, `triangle`, or
`circle` embedded as permanent meanings in the generated trial contract.

`yesnoreflexProfileV1` is obsolete and must be ignored, not migrated. Keep the
existing preferences key so mode, level, and pace survive; stop reading and
writing its obsolete `dynamic` member. The next preference save naturally
removes that member.

### 3.3 Difficulty Behavior

Preserve the existing session lengths, FACT/FLIP balance, conflict quotas,
playful-question quotas, and switch schedules.

- **Level 1:** select `color` or `shape` once for the session; never switch.
  When color is active, display a rectangular color swatch that is not one of
  the session shapes, plus its visible color-name tag. When shape is active,
  display the selected session shape with a constant neutral fill that is not
  one of the session colors. Do not render an inactive distractor.
- **Level 2:** retain exactly three scored rule switches and the existing
  congruent/conflict balance.
- **Level 3:** retain exactly eight scored rule switches and the existing
  congruent/conflict balance.

### 3.4 Warm-Up, Setup, And Tutorial

Every session now has a fresh mapping, so every session must run two unscored,
untimed warm-up examples before scored play:

1. a congruent FACT example;
2. a congruent FLIP example.

For Levels 2 and 3, each warm-up displays both dimensions: the first uses the
FACT color and FACT shape, and the second uses the FLIP color and FLIP shape.
Both examples use the first scored trial's active dimension, so the warm-up
does not create an artificial rule switch. Level 1 shows only its selected
dimension. The existing wrong-answer reasoning and same-example retry remain.

Replace the setup's two competing previews with one explanation:

- every game draws new colors and shapes;
- two untimed examples teach the new mapping;
- Levels 2 and 3 may switch which dimension counts.

Use the simple preview question `Does the Sun shine?` / `Czy Słońce świeci?`.
Do not color the question. Show a representative colored shape beside it, but
do not imply that the representative setup tokens have permanent meanings.

When the tutorial starts or is replayed, generate one valid, non-persisted
demonstration profile and use it for the whole tutorial. Update all tutorial
steps and copy to teach color, shape, conflict, and the switch overlay defined
in R3-5. The tutorial must not teach fixed blue/gold/triangle/circle meanings.

## 4. P0 Findings

### R3-1. Mobile Session Startup Leaves The Rule And Cue Outside The Viewport

**Evidence:** `yesnoreflex/index.html:5135-5201`,
`tools/yesnoreflex-layout-check.mjs:103-116`, and
`yesnoreflex/docs/req.md:948-950`.

Starting from the setup controls at a 360x640 Chrome viewport retained the
panel's scroll position after the stage changed:

| Cue system observed | `scrollY` | HUD viewport bounds | Accessible color tag |
| ------------------- | --------: | ------------------: | -------------------: |
| Classic             |     426px |    -360px to -293px |       not applicable |
| Dynamic             |     355px |    -289px to -198px |         -18px to 4px |

The question and Yes/No controls were visible, but the active-rule HUD was
entirely above the viewport. In Dynamic play, almost the whole visible
color-name tag was clipped too. This defeats both rule preparation and the
non-color identity of the cue.

The Chrome harness did not catch this because its shared `box()` helper adds
`window.scrollY` and compares document positions. Document geometry is useful
for movement checks but cannot prove viewport visibility.

**Required correction:**

1. Add one `alignPlayViewport()` helper.
2. After the first warm-up or scored trial has rendered, use
   `requestAnimationFrame` and, at the light-chassis mobile breakpoint, call
   `hudRow.scrollIntoView({ block: "start", behavior: "auto" })`.
3. Call the helper from the shared `startSession()` path so it covers Start,
   Play Again, and tutorial-to-Sprint.
4. Do not use smooth scrolling; the game must begin in a stable position and
   reduced-motion behavior must be identical.
5. Do not focus the hidden setup Start button after play begins.

**Acceptance criteria:**

- Immediately after Start at 360x640, the active-rule HUD, active cue and
  non-color cue label, question, Yes, and No are all inside the viewport.
- The same holds for Level-1 color, Level-1 shape, and Level-2 colored-shape
  sessions in both Practice and Sprint.
- Start, Play Again, and tutorial start produce the same viewport alignment.
- No new horizontal scroll appears at 360, 720, or 1280px.

### R3-2. Structurally Corrupt Stored Profiles Can Block Session Startup

**Evidence:** `yesnoreflex/index.html:3919-3957`,
`yesnoreflex/index.html:4867-4874`, and
`yesnoreflex/index.html:5172-5181`.

`loadJson()` catches unavailable storage and invalid JSON, but the version-1
profile boundary accepts any parsed object. `profileTooSimilar()` immediately
dereferences `previous.questionColors.fact` and nested symbol fields. Values
such as the following throw a `TypeError` when Dynamic Start is pressed:

```json
{ "version": 1, "profile": {} }
```

```json
{ "version": 1, "profile": { "questionColors": {}, "symbols": {} } }
```

This violates the explicit requirement that storage failure or corruption
cannot block the app.

**Required correction:** implement `isValidCueProfileV2(value)` before any
stored profile reaches comparison or generation logic. It must verify:

- the outer object, `colors`, and `shapes` are non-null objects;
- all four `fact`/`flip` members are strings from the correct pools;
- the two colors and two shapes are distinct;
- the color pair passes the forbidden-pair matrix;
- no missing, array, primitive, or unknown-token value is accepted.

Only `{ version: 2, profile: validProfile }` may become the previous profile.
Treat every other stored value as absent and continue with a new profile. A
successful session start may overwrite malformed V2 data with the valid new
profile. Storage exceptions remain caught.

**Acceptance criteria:** invalid JSON, `{}`, missing nested objects, arrays,
wrong primitive types, equal tokens, forbidden color pairs, unknown tokens,
V1 data, unavailable storage, and throwing storage getters all allow the game
to reach its first warm-up. The produced profile is valid and frozen.

## 5. P1 Findings

### R3-3. The Emergency Fallback Can Repeat A Previous Cue Set

**Evidence:** `yesnoreflex/index.html:3959-4002` and
`tools/yesnoreflex-rules-check.mjs:805-813`.

After 20 rejected random profiles, generation returns `null` and session start
substitutes one constant profile without comparing it with the previous
session. A deterministic `rng = () => 0` demonstrates a repeated color set.
The current test proves only that the constant fallback's question-color pair
is legal.

The new single cue system still needs a failure path, but that path must satisfy
the same variability contract as ordinary generation.

**Required correction:**

1. Keep the bounded randomized attempts.
2. If they fail, enumerate all legal unordered color pairs and all unordered
   shape pairs in stable pool order.
3. Select the first combination for which both the color set and shape set
   differ from the valid previous profile.
4. Assign FACT/FLIP roles deterministically, construct the V2 profile, and
   deep-freeze it.
5. If there is no previous profile, select the first legal combination.
6. Do not fall back to a constant profile after this search.

**Acceptance criteria:** constant RNG, a previous profile equal to the first
legal pair, a previous fallback-produced profile, and 2,000 consecutive seeded
draws all produce valid profiles with no consecutive color-set or shape-set
reuse.

### R3-4. CLASSIC And DYNAMIC Are Two Competing Versions Of One Game

**Evidence:** `yesnoreflex/index.html:1937-1955`,
`yesnoreflex/index.html:4162-4182`, and
`yesnoreflex/docs/req.md:352-390`.

CLASSIC teaches fixed fill/shape meanings and switches between color and
shape. DYNAMIC changes the ontology: question color competes with an atomic
colored-symbol token. The setup therefore asks a child to choose between two
different rule systems before understanding either one. It also leaves the
stronger randomized system looking optional.

**Required correction:** implement the complete single-system decision in
section 3. This is a replacement, not a third mode.

Remove all of the following from UI, state, storage, copy, rendering, help,
tutorial, and tests:

- the CLASSIC/DYNAMIC segmented control;
- `state.dynamic` and saved `dynamic` preference behavior;
- conditional classic/dynamic setup previews;
- semantic question-text colors and their question-color rule tag;
- `FOLLOW QUESTION COLOR` and `FOLLOW SYMBOL` as active-rule names;
- fixed blue/gold/triangle/circle gameplay mappings;
- dead rendering and legend branches retained only for compatibility.

Keep Practice/Sprint. Do not interpret this finding as permission to remove
the untimed accessibility-equivalent mode.

**Acceptance criteria:**

- Setup contains Mode, Difficulty, Pace when applicable, and Start, but no cue
  system selector.
- Every new session generates exactly two session colors and two session
  shapes before warm-up.
- Levels 2 and 3 switch only between `FOLLOW COLOR` and `FOLLOW SHAPE`.
- The question's computed color is always the normal stimulus color.
- Searching shipped UI/I18N for CLASSIC, DYNAMIC, FOLLOW QUESTION COLOR, and
  FOLLOW SYMBOL finds no obsolete player-facing path.
- Existing saved preferences still restore Practice/Sprint, level, and pace.

### R3-5. A Small Inline Badge Does Not Make A Rule Switch Salient Enough

**Evidence:** `yesnoreflex/index.html:431-449`,
`yesnoreflex/index.html:1505-1508`,
`yesnoreflex/index.html:5828-5837`, and
`yesnoreflex/docs/req.md:337-350`.

The active rule currently changes inside the normal cue/question layout. A
small `SWITCH! FOLLOW ...` badge appears in a reserved slot. This is easy to
miss, especially when the child is maintaining a stable Yes/No motor pattern.
It also does not restate the newly relevant session mapping.

**Required correction:** add a dedicated `switch` phase and a reusable
full-viewport dialog primitive shared with, but visually distinct from, the
result celebration.

For every scored trial where `trial.isSwitch === true`:

1. Enter `switch` before starting the trial's cue lead or revealing Practice.
2. Cancel or leave unarmed every clock. Switch time is never response time.
3. Inert the application behind the overlay and trap focus inside it.
4. Show a neutral, high-contrast overlay containing:
   - localized `SWITCH!` / `ZMIANA!`;
   - localized `FOLLOW COLOR` or `FOLLOW SHAPE`;
   - the two tokens for that newly active dimension;
   - each token's localized name and explicit `FACT`/`FLIP` meaning;
   - a short line equivalent to `Use COLOR/SHAPE until the next switch`;
   - one localized `Continue` button and `ENTER / SPACE` hint.
5. Focus Continue and announce the heading, active rule, and both mappings as
   one coherent message.
6. Continue only from the button, Enter, or Space. Do not auto-dismiss, dismiss
   on backdrop click, accept Y/N, or close on Escape.
7. Consume the dismissal event so it cannot answer or advance the next view.
8. On dismissal, remove inert state, move focus to the play-stage rule heading
   with `preventScroll`, and begin the pending trial exactly once.
9. Sprint then uses its existing switch-trial cue lead. Practice reveals the
   complete untimed trial.

**Amended 2026-08-17 by the owner.** Four clauses of this finding and one of
§3.1 are superseded:

1. The HUD no longer shows the active rule after the dialog closes, and the
   in-stage legend that duplicated the panel rule key is gone. A permanent
   on-stage rule reminder removes the rule-maintenance load the game is built
   to train; the switch dialog states the new rule and the panel rule key
   keeps an accent-rail reference.
2. Focus on dismissal moves into the play-stage HUD row rather than a rule
   heading, because that heading no longer exists.
3. The `Use COLOR/SHAPE until the next switch` line is removed. It restated
   the dialog's own `FOLLOW COLOR` / `FOLLOW SHAPE` heading, and the rule's
   bordered pill and the separate `ENTER / SPACE` line went with it: the rule
   is now plain accent type and the key hint rides inside the Continue button,
   matching the Yes/No controls. The dialog is exactly four blocks.
4. §3.1's "every displayed color cue must include a visible localized
   color-name tag near the cue" no longer holds for the STAGE. The tag is
   removed from the play surface. Colorless playability now rests on the
   forbidden-pair matrix (CVD-risky color pairs are never drawn together), the
   two always-different session shapes, the named panel rule key, and the
   screen-reader cue description, which still names shape and color on every
   trial. This is an owner decision recorded as a deliberate narrowing of the
   round-3 requirement, not an oversight, and it is the item most worth
   re-checking in the child pilot and the color-vision simulation pass.

Everything else in R3-5 stands: the dedicated `switch` phase, unarmed clocks,
inert background, focus trap, single coherent announcement, the accepted and
rejected dismissal inputs, and exactly-once trial start.

**Extended 2026-08-21 by the owner.** The same dialog now also opens every
session, before the first warm-up, headed `NEW GAME!` / `NOWA GRA!` instead of
`SWITCH!` / `ZMIANA!`. R3-5's per-level counts therefore read: one opening
card per session, plus 0 / 3 / 8 scored rule switches at Levels 1 / 2 / 3. The
harnesses classify the two by heading, so the scored-switch contract stays
verifiable exactly as this finding specified.

Use a neutral overlay surface, not the green/blue/yellow result tiers and not a
celebration emoji. Under reduced motion, omit fade/pop animation. Keep the
result celebration's existing dismissal contract unchanged.

The full-screen dialog replaces the small in-stage switch slot and badge. The
HUD continues to show the active rule after the dialog closes. The first trial
is not a switch and receives no switch dialog. Warm-ups do not receive one;
they use the first scored rule as specified in section 3.4.

**Acceptance criteria:**

- A complete Level-1 session shows zero scored switch dialogs.
- A complete Level-2 session shows exactly three.
- A complete Level-3 session shows exactly eight.
- No repeat trial shows a dialog and no switch trial skips it.
- Timer, response time, and score do not change while the dialog is open.
- Y/N, arrows, Pause, backdrop clicks, repeated keydown, and Escape cannot
  bypass the dialog.
- Continue click, Enter, and Space each start the pending trial once.
- At 360px width and 200% zoom, both mapping rows and Continue remain readable
  and reachable without horizontal scrolling.
- The tutorial's switch step demonstrates the same dialog behavior.

### R3-6. Panel Button Typography Has Grown Beyond The Chassis Scale

**Evidence:** `yesnoreflex/index.html:797-840` and the light-chassis type scale
in `CLAUDE.md`.

Panel segmented buttons are now 15px, difficulty buttons 17px, and general
panel actions 15px. These controls visually dominate their section labels and
make the panel feel dense again. The increase is not needed for accessibility:
target size and label size are separate concerns, and the large Yes/No gameplay
controls already use the child-facing scale.

**Required correction:** use these exact panel values:

```css
.seg-btn {
  font-size: 13px;
  min-height: 44px;
}
.seg-btn.star-btn {
  font-size: 15px;
}
.action-btn {
  font-size: 13px;
  min-height: 48px;
}
```

Keep `JetBrains Mono` on segmented/value controls and `Outfit` 600 on action
buttons. Do not shrink answer labels, questions, tutorial prose, feedback,
switch-dialog mappings, or overlay Continue. Do not reduce hit targets merely
because the panel type becomes smaller.

**Acceptance criteria:** computed styles match the three values above;
English and Polish Mode, Difficulty, Pace, Start, help, and summary actions do
not wrap or clip at 320/360px; focus outlines and 44/48px targets remain.

### R3-7. `Is Water Wet?` Is An Ambiguous Setup Example

**Evidence:** `yesnoreflex/index.html:1455-1462`,
`yesnoreflex/index.html:4109`, and `yesnoreflex/index.html:4265`.

`Is water wet?` / `Czy woda jest mokra?` is a commonly disputed semantic
question. Even though it is currently preview copy rather than a scored bank
item, it models exactly the hesitation the game is designed to avoid.

**Required correction:** replace it everywhere with:

- English: `Does the Sun shine?`
- Polish: `Czy Słońce świeci?`

Update both initial static markup and I18N so there is no untranslated or stale
flash before translations run. In the unified preview, keep the question in
the normal text color; the adjacent colored shape demonstrates the cue system.

**Acceptance criteria:** neither language contains `water wet` / `woda jest
mokra`; the preview and question bank remain structurally separate; all 108
question-bank records remain verbatim unchanged.

## 6. P2 Finding

### R3-8. Active Review Evidence Reports Stale Check Totals

**Evidence:** the remediation header in
`yesnoreflex/docs/implementation-review-round-2-2026-08-16.md:18-23` reports
195 DOM checks and 12,208 rules checks. The reviewed implementation currently
passes 222 DOM checks and 18,205 rules checks.

Outdated green totals make it impossible to tell whether the documented gates
describe the current implementation.

**Required correction:**

1. Keep the pre-remediation evidence in section 2 of this review as historical
   evidence for this round.
2. After implementing R3-1 through R3-7, run all four permanent gates.
3. Add the exact final totals and date to this document's status header.
4. Mark each R3 finding applied or explicitly unresolved.
5. Update the Round-2 remediation header or add a superseding note pointing to
   this Round-3 report; do not leave its old totals presented as current.
6. Update `yesnoreflex/docs/req.md` to remove the obsolete cue-system design
   and describe the final unified behavior, storage V2 contract, and switch
   dialog.

## 7. Mandatory Automated Regression Matrix

The implementation is incomplete until all tests below are permanent. Tests
must exercise public DOM behavior or exported pure rules rather than duplicating
the implementation under test.

### 7.1 Pure Rules And Profiles

- Generate at least 10,000 sessions per level and retain every existing
  session-length, answer-balance, conflict, switch, playful-question, and
  recency assertion.
- Generate at least 2,000 consecutive V2 profiles and assert:
  - allowed, distinct color and shape tokens;
  - both unordered sets differ from the previous session;
  - every pool token appears in FACT and FLIP roles;
  - profile and nested objects are frozen.
- Exhaust the 2 fact values x 2 active dimensions x 2 color roles x 2 shape
  roles answer table.
- Exercise constant RNG and exhaustive fallback with no previous profile, the
  first legal previous pair, and a previous fallback profile.
- Unit-test every accepted and rejected V2 storage shape listed in R3-2.

### 7.2 DOM And State Machine

- Assert setup has no CLASSIC/DYNAMIC control and preferences no longer save
  `dynamic`.
- Assert each session enters two warm-ups before scored play and wrong warm-up
  answers retry the same example.
- Assert Level 1 chooses one active dimension, never switches, and never
  renders the inactive dimension.
- Assert Levels 2 and 3 resolve semantic cue roles through the session profile
  and render both dimensions together.
- Assert question text never receives a cue-color class.
- Assert V1, invalid JSON, malformed V2, and unavailable storage cannot block
  Start.
- Assert switch-dialog counts, content, focus, inert state, announcements,
  accepted dismissal inputs, rejected inputs, idempotence, and timer exclusion.
- Assert result-celebration behavior remains independent and unchanged.
- Assert English and Polish Y/T/N/Space shortcuts retain their existing
  contracts outside a switch dialog.
- Assert the tutorial uses one generated demo profile and demonstrates the
  switch dialog.

### 7.3 Real-Chrome Layout

At 360x640, 720x900, and 1280x720:

- retain current Pause, Next, answer-position, overlay-coverage, and horizontal
  scroll checks;
- add viewport-relative, not document-relative, first-trial visibility checks;
- test Level-1 color, Level-1 shape, and Level-2 colored-shape startup;
- test Start, Play Again, and tutorial-start viewport alignment;
- verify switch-dialog mapping rows and Continue fit;
- verify panel computed font sizes and target heights;
- verify English and Polish labels do not wrap or clip.

Repeat the critical setup, switch-dialog, cue, question, and answer checks at
200% browser zoom. Do not treat ordinary document scrolling as proof that a
required play element is visible.

### 7.4 Required Commands

Run from `learn/`:

```bash
npm run code-review -- yesnoreflex/index.html
node tools/yesnoreflex-rules-check.mjs
npm run yesnoreflex-dom-check
npm run yesnoreflex-layout-check
```

Record the actual final totals. Do not copy the pre-change totals into the
remediation report.

## 8. Definition Of Done

Round 3 can be marked implemented only when all of the following are true:

1. R3-1 through R3-7 pass their acceptance criteria.
2. The app and `yesnoreflex/docs/req.md` describe the same one-system behavior.
3. Every game generates two colors and two shapes; no player-facing
   CLASSIC/DYNAMIC choice or semantic question color remains.
4. Level 1 has no switches, Level 2 has three, and Level 3 has eight.
5. Every scored switch blocks on the full-screen mapping dialog before timing
   or response begins.
6. Malformed or unavailable storage never prevents warm-up from starting.
7. The profile fallback cannot repeat either previous cue set.
8. Mobile Start reveals the complete rule/cue/question/answer path immediately.
9. Panel button typography matches the required light-chassis values.
10. The four automated gates are green and their exact totals are recorded.
11. The question bank remains exactly 108 verbatim records.
12. Remaining Polish, child-testing, and screen-reader gates are explicitly
    reported as open until humans complete them.
