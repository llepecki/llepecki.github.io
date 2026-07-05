# Current Paths Lab: Intro Mode Review

Reviewed on 2026-05-07.

This review covers the implemented intro mode in:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)

Supporting product/design references:

- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)
- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html)

## Executive Verdict

The intro is a real improvement over the earlier version of the app.

It has:

- a dedicated intro state
- a dedicated intro panel
- a 9-step sequence that broadly matches the spec
- EN and PL copy for the step content
- a clean code-review result from `npm run code-review -- currentlab.html`

That is not the same as saying the intro is review-ready.

The strongest problems are:

1. intro mode does not fully suspend or isolate the live app state,
2. the first-visit behavior is not actually first-visit only,
3. several key intro steps are too passive and do not demonstrate the causal ideas they claim to teach,
4. language switching and intro accessibility labels are only partially localized,
5. keyboard and mobile usability are incomplete in the board-led intro interactions.

Do not treat this as a copy-polish pass.

Several fixes require behavior and state changes, not just wording edits.

## Method

This review used:

- direct source inspection of [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)
- comparison against [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)
- structural comparison with [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html)
- `npm run code-review -- currentlab.html`
- external educational and science references listed at the end of this document

## 1. Structural / State Integrity Review

### 1.1 Critical: intro mode does not suspend the live app controls, so hidden mission state can still change underneath the tutorial

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:880)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10010)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11021)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11049)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11599)

Problem:

While intro mode is active, the normal family, mode, stage, `Explore`, `Hint`, and `Next` controls remain visible and active. Their handlers are not guarded against `state.introActive`.

This means a child can still:

- switch family/mode/stage behind the intro,
- toggle `Explore`,
- reveal hidden hints,
- advance a hidden mission if `Next` was already enabled.

Why this is wrong:

The intro spec explicitly requires normal mission progression to be suspended while intro is active. Right now the UI suggests a focused onboarding flow, but the underlying app is still live.

That creates both UX and correctness problems:

- the child sees competing controls during what should be a calm onboarding surface,
- hidden mission state can drift while the intro is open,
- exiting intro may return to a state that no longer matches what the child thinks happened.

Required fix:

1. While intro is active, disable or hide the normal family/mode/stage rows and the `Explore / Hint / Next` action buttons.
2. Add defensive guards in normal app handlers so `setFamily()`, `setMode()`, `setStage()`, `toggleExplore()`, `showHint()`, and `nextRound()` no-op when `state.introActive` is true.
3. Make intro navigation the only progression surface during intro.

### 1.2 Critical: intro controls reuse live mode state instead of intro-local state, so onboarding leaks into real exploration

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9700)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9743)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9980)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11543)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11626)

Problem:

The intro scene writes directly into normal mode state:

- step 3 writes to `state.flow.exploreSource` and `state.flow.exploreCt`
- step 5 reads and writes `state.send.voltage`

Why this is wrong:

The intro spec requires step-specific controls to affect only the intro scene and not permanently mutate the normal mission state.

This is currently violated in concrete ways:

- if the child entered intro from `Flow -> Explore`, step 3 can overwrite their previous source choice,
- if the child entered intro from `Send -> Explore`, step 5 can overwrite their chosen voltage,
- the intro becomes a hidden editor for the live app instead of a separate onboarding layer.

Required fix:

1. Create a dedicated intro-local state bucket, for example:
   - `introSource`
   - `introCurrentType`
   - `introVoltage`
   - `introTransformerView`
   - `introDcView`
   - `introHybridExample`
2. Render all intro scenes exclusively from that intro-local state.
3. Do not read from or write to `state.flow.*`, `state.send.*`, or other live mode state from intro handlers.
4. Reset intro-local defaults on `enterIntro()` or on each step as needed.

### 1.3 High: intro exit does not fully restore the previous UI state

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10018)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10030)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10993)

Problem:

`enterIntro()` hides `whySection`, but `exitIntro()` never restores it. If the child opens intro after completing a round and exposing `Why It Works`, that section stays hidden after exit even though the underlying step may still be complete.

Why this is wrong:

The intro is supposed to return the child to the previously active state, not to a partially reconstructed approximation of it.

Required fix:

1. Save enough return UI state to know whether `whySection` was visible before intro opened.
2. Restore hidden sections through one explicit `restoreFromIntro()` path rather than a partial list of `classList.remove("hidden")` calls.
3. Re-run the normal panel visibility logic after restoring return state so completed-step UI is consistent.

### 1.4 High: `introSeen` is not persisted, so the intro is not really “first visit only”

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:8667)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10032)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11769)

Problem:

`introSeen` exists only in memory. It is set during the session, but it is not persisted anywhere. On reload, it resets to `false`, so the intro auto-opens again.

Why this is wrong:

The intro spec explicitly called for:

- auto-open on first visit,
- no auto-open on later visits,
- persisted `introSeen`.

The current behavior is “every page load is a first visit.”

Required fix:

1. Persist `introSeen` with a stable local-storage key.
2. Read it during init before deciding whether to auto-open.
3. Set it as soon as the child intentionally exits or completes the intro.
4. Fail safely if storage is unavailable, but do not silently drop the persistence requirement in normal browsers.

## 2. Educational Review

### 2.1 High: several key intro steps are still too passive and do not demonstrate the concept through child action

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9742)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9804)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9860)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9881)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9969)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)

Problem:

Only two intro steps currently offer meaningful interaction:

- step 3 source switching
- step 5 voltage slider

The other concept-heavy steps mostly present a static scene and explanatory text:

- step 4 has no slider even though it is the voltage/current distinction step,
- step 6 has no `No transformers / With transformers` comparison,
- step 7 has no `Plain transformer / DC-DC converter` comparison,
- step 8 has no tappable mini-scene switching.

Why this is wrong:

This is weaker than both the intro spec and common elementary/middle-school electricity teaching practice.

The concept set here depends on tiny cause-and-effect comparisons:

- complete loop vs no loop,
- one-way vs alternating,
- more voltage vs less current,
- transformer route vs no-transformer route,
- plain transformer on DC vs proper DC converter,
- AC-only story vs hybrid real-world story.

When those comparisons are only described in text, the child is being told the answer instead of discovering the difference on the board.

Required fix:

1. Step 4:
   - add a small voltage slider,
   - keep a fixed power preset,
   - update `Push`, `Flow`, and `Useful Power` badges live.
2. Step 5:
   - keep the voltage slider,
   - add a visible current badge so the child can see why losses drop.
3. Step 6:
   - add a toggle for `No transformers` vs `With transformers`,
   - visibly compare losses or delivered power.
4. Step 7:
   - add a toggle for `Plain transformer` vs `DC-DC converter`,
   - make the plain-transformer-on-DC view visibly fail or stay inactive.
5. Step 8:
   - add tappable mini-scenes,
   - include at least charger, solar-to-grid, and long-cable/HVDC examples.

### 2.2 Medium: step 1 does not visually label the basic circuit parts strongly enough

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9692)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)

Problem:

The first step shows a battery, wire loop, and lamp, but it does not explicitly label `source`, `wire`, and `load` on the board.

Why this is wrong:

The intro goal is not just “show a loop.” It is also to establish the child’s first vocabulary map for the rest of the app.

Without quick visual callouts, the first step relies too heavily on paragraph text to establish those roles.

Required fix:

1. Add short board labels or callout tags for:
   - `Source`
   - `Wire`
   - `Load`
2. Keep them minimal and only in step 1 so they teach the terms without cluttering later scenes.

## 3. Scientific Review

No major wording-level scientific errors were introduced in the new intro copy.

The main science problems are demonstration gaps, not outright false statements. Two of those gaps are significant enough to require correction.

### 3.1 Medium: the transformer story is stated correctly, but not actually demonstrated as a comparison

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9804)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9860)

Problem:

Step 6 says transformers helped AC grids because they can raise and lower voltage, but the child only sees the successful route. They never see the contrasting case that makes the claim meaningful.

Why this is wrong:

Scientifically, the key idea is causal:

- high voltage helps reduce current for the same delivered power,
- transformers made that high-voltage/low-voltage switching practical in AC grids.

Without a comparison route, the claim becomes a slogan instead of an observed mechanism.

Required fix:

1. Add a `No transformers` view and a `With transformers` view.
2. Keep the same source, line length, and load in both views.
3. Show the consequence through loss, current, or delivery quality so the child can see what changed.

### 3.2 Medium: the hybrid ending is scientifically incomplete because it does not show a concrete long-cable or HVDC case

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9881)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9911)

Problem:

Step 8 says the real world uses both `AC` and `DC`, and that `DC` helps in some long cables, but the board only shows:

- outlet -> charger -> phone
- solar -> inverter -> lamp

There is no concrete long-cable `DC` example.

Why this is wrong:

The whole app is supposed to land on a hybrid conclusion, not an `AC everywhere` conclusion with a verbal footnote.

Without a visible long-link `DC` example, the intro under-teaches where `DC` actually becomes advantageous.

Required fix:

1. Add a third mini-scene in step 8 that visibly represents a long cable or undersea link using `DC`.
2. Keep the label child-readable, for example:
   - `Very long cable`
   - `Undersea link`
   - `Long-distance DC link`
3. Let the child tap between examples so the `AC / DC / hybrid` conclusion is earned visually.

## 4. Visual / UX / Accessibility Review

### 4.1 High: intro board “buttons” are not keyboard-activatable even though they are focusable and announced as buttons

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9708)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9923)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11542)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11736)

Problem:

Step 3 source cards and step 9 mode cards are implemented as focusable SVG groups with `role="button"` and `tabindex="0"`, but there is no keyboard handler that activates them on `Enter` or `Space`.

Why this is wrong:

The UI advertises these elements as interactive controls. Keyboard users can reach them, but cannot operate them. For the intro, that is a functional blocker, not a polish issue.

Required fix:

1. Add delegated keyboard activation for intro board controls.
2. Support both `Enter` and `Space`.
3. Prefer real HTML buttons over SVG groups if that is simpler and more robust.
4. Verify both step 3 and step 9 by keyboard after the fix.

### 4.2 Medium: the full toolbar still competes visually with the intro, so the onboarding surface is less calm than the reference pattern

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:880)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:928)
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html:3164)

Problem:

The intro panel correctly replaces the normal right-panel sections, but the left-side toolbar remains fully present and visually active.

Why this is wrong:

This weakens the “one idea at a time” effect that the intro is supposed to inherit from `feedbacktank.html`. Even before the state bugs are fixed, the visual hierarchy is still telling the child that the whole app is active at once.

Required fix:

1. While intro is active, visually mute or collapse the normal toolbar controls.
2. Leave only the `Intro` identity and intro-specific navigation visually prominent.
3. If controls stay visible for layout reasons, they must look inactive and be non-interactive.

### 4.3 Medium: the final mode cards are too dense for the current fixed SVG layout, especially in Polish and on narrow screens

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9912)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9953)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1326)

Problem:

Step 9 packs five fixed-width cards across a 900px SVG and renders each blurb as a single SVG text node. SVG text does not wrap automatically.

That is risky in both cases that matter here:

- longer Polish blurbs,
- small-screen scaling where the entire board shrinks.

Why this is wrong:

This is the final handoff step. If the cards become hard to read or hard to tap, the intro fails at the exact moment it is supposed to launch the child into the rest of the app.

Required fix:

1. Replace single-line SVG blurbs with wrapped text using explicit `tspan` lines, or move the cards to HTML overlay buttons with normal CSS wrapping.
2. Reflow the card layout for narrow widths. Two rows is acceptable.
3. Re-test tap targets in EN and PL on a narrow mobile width.

## 5. Polish Translation Review

### 5.1 High: switching language during intro leaves the intro panel in the old language

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10001)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10025)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11477)

Problem:

`applyTranslations()` updates general app labels and re-renders the board, but it does not refresh:

- `lblIntroTitle`
- `lblIntroBack`
- `introStepTitle`
- `introCommentary`

when intro mode is already active.

Why this is wrong:

If the child switches from EN to PL or PL to EN during intro, the UI becomes mixed-language:

- board labels update,
- panel copy stays stale.

That is a visible localization defect.

Required fix:

1. Add an intro-specific translation refresh path inside `applyTranslations()`.
2. When `state.introActive` is true, update:
   - intro title
   - intro back label
   - intro step title
   - intro commentary
   - intro nav aria labels
3. Re-render intro controls after language switch if they contain text labels.

### 5.2 Medium: intro-specific accessibility labels are hardcoded in English

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:902)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:940)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:949)

Problem:

These intro labels are hardcoded in English in the HTML:

- `Introduction`
- `Previous step`
- `Next step`

They are not updated through the translation system.

Why this is wrong:

The visible interface can be Polish while screen-reader labels remain English. That is inconsistent and avoidable.

Required fix:

1. Add translation keys for intro-specific aria labels.
2. Set them in `applyTranslations()`.
3. Review all intro-only controls for the same issue, not just these three.

## 6. Implementation Review

### 6.1 Medium: the intro is hard-coded step-by-step instead of using the spec’s intended step model

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9686)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9969)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)

Problem:

Intro rendering is currently spread across large `if / else` branches in `renderIntroBoard()` and `renderIntroControls()`. There is no dedicated `INTRO_STEPS` structure even though the spec called for it.

Why this matters:

The missing fixes above are not isolated one-liners. They require:

- intro-local state
- per-step controls
- extra hybrid scenes
- translation refresh
- cleaner restore logic

Trying to patch all of that into the current branch-heavy structure will increase regression risk.

Required fix:

1. Introduce a dedicated `INTRO_STEPS` data structure.
2. Store, per step:
   - id
   - title keys
   - commentary keys
   - scene kind
   - control type
   - intro-local defaults
   - optional CTA metadata
3. Refactor `setIntroStep()`, `renderIntroBoard()`, and `renderIntroControls()` to read from that model.
4. Land the behavioral fixes on top of that structure, not as more conditionals.

## Sources

Local sources inspected:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)
- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html)

External references used:

- IOPSpark, “Models of electric circuits”:
  https://spark.iop.org/models-electric-circuits
- IOPSpark, “Separating current and voltage measurements”:
  https://spark.iop.org/separating-current-and-voltage-measurements
- NSTA, “Batteries, Bulbs, and Wires”:
  https://www.nsta.org/lesson-plan/batteries-bulbs-and-wires
- OpenStax, “15.1 AC Sources”:
  https://openstax.org/books/university-physics-volume-2/pages/15-1-ac-sources
- OpenStax, “Chapter 15 Introduction”:
  https://openstax.org/books/university-physics-volume-2/pages/15-introduction
