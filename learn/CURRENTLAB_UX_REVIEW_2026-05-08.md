# Current Paths Lab: UX Review

Reviewed on 2026-05-08.

Reviewed artifact:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)

Related local documents:

- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)
- [CURRENTLAB_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_REVIEW_2026-05-07.md)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)
- [CURRENTLAB_INTRO_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_REVIEW_2026-05-07.md)
- [CURRENTLAB_NAV_REDESIGN_2026-05-08.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_NAV_REDESIGN_2026-05-08.md)

## Executive Verdict

The app is visually coherent, technically organized, and significantly better than the earlier top-heavy layout. `npm run code-review -- currentlab.html` reports `0` findings.

That does not mean the UX is ready for a child audience.

The strongest UX problem is structural:

the app still exposes too much of its internal implementation model to the child.

Children are still asked to parse separate boxes for:

- investigation
- mission
- controls
- meters
- explanation
- progress
- actions

That is not how children experience a learning task.

They experience one loop:

1. what am I trying to do,
2. what can I touch,
3. what changed,
4. what does that mean,
5. what do I do next.

The current implementation still makes that loop too fragmented.

The highest-priority UX issues are:

1. the panel is organized by developer sections instead of one child-readable learning flow,
2. interaction and consequence are too far apart,
3. `Explore` still does not support real agency across all modes,
4. mode and investigation wayfinding are weaker than they should be,
5. mobile/touch ergonomics and localization are still not strong enough for a child-ready release.

Do not treat this as a polish pass.

Several findings require layout, state, and interaction changes.

## Method

This review used:

- direct source inspection of [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)
- existing local design and review docs listed above
- `npm run code-review -- currentlab.html`
- a scripted localization check of answer-option labels
- external child-UX, learning-science, and accessibility references listed at the end of this document

Scripted localization check found:

- `52` unique answer-option labels still have no Polish label or fallback mapping

## Research-Backed UX Criteria

The review criteria below come from a mix of child-centered design guidance, multimedia-learning research, simulation-feedback research, and accessibility guidance.

For this app, the most relevant patterns are:

1. design with the child’s task flow, not the developer’s component structure
2. segment information into small, meaningful steps
3. pre-train unfamiliar words before expecting the child to reason with them
4. keep action and consequence close together
5. give timely, specific feedback
6. support autonomy and competence without fake choices
7. keep touch targets large and reachable
8. localize all child-facing choices completely

Those principles matter here because the app teaches invisible systems. If the child has to spend too much effort on navigation, label decoding, or UI hunting, that effort is no longer available for understanding `AC`, `DC`, `voltage`, `current`, and `loss`.

## 1. Information Architecture And Wayfinding

### 1.1 Critical: the right panel is still organized around implementation sections instead of one child-readable learning loop

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:964)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:972)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:977)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:982)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1024)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1029)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1034)

Problem:

The panel is split into many equally weighted sections:

- `Investigation`
- `Mission`
- `Controls`
- `Meters`
- `Why It Works`
- `Progress`
- action buttons

This reflects how the code is organized, not how a child experiences a task.

Why this is wrong:

Research on multimedia learning consistently favors coherence, signaling, and segmentation. Children learn better when the interface groups information by meaning and timing, not by implementation category.

Right now the child must visually search for:

- the current task,
- the thing they can touch,
- the result,
- the explanation,
- the next action.

That produces unnecessary scanning and working-memory load.

Required fix:

Rebuild the panel around a child task flow.

Minimum required structure:

1. `Investigation`
   - current investigation name
   - investigation chooser
   - progress for this mode
2. `Mission Coach`
   - mission prompt
   - hint / retry / success feedback
   - explanation reveal
3. `Tools And Readouts`
   - only the controls and readouts needed for the current mode/step
4. sticky action bar
   - `Explore`
   - `Hint`
   - `Next`

Additional rule:

- do not leave empty sections visible after a round is complete

### 1.2 High: the app uses a section called `Progress` to show hints and correctness feedback

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:967)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1029)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1031)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11620)

Problem:

Actual progress already appears in the `Investigation` section as a bar and count.

But the separate section labeled `Progress` contains `hintText`, which is used for:

- hints
- try-again feedback
- success feedback

Why this is wrong:

This is a signaling failure.

Children should not have to reinterpret a section label on every state change. A box labeled `Progress` should show progress, not coaching.

Required fix:

1. Delete the child-facing idea that this box is `Progress`.
2. Rename the section to one of:
   - `Coach`
   - `Hint And Feedback`
   - `Try And Learn`
3. Reserve `Progress` for actual investigation completion only.
4. Update EN/PL strings accordingly.

### 1.3 High: mode switching resets the child to the first investigation instead of preserving where they left off

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:8659)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:8663)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11645)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11655)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11665)

Problem:

The app remembers the last mode per family, but it does not remember the last investigation per mode.

When the child changes mode, `setMode()` resets `state.stage` to `MODE_STAGES[m][0]`.

Why this is wrong:

For children, preserving place is part of preserving competence. Resetting them to the first investigation makes exploration feel like losing progress.

Required fix:

1. Add `lastStageByMode`.
2. Restore the previous investigation when re-entering a mode.
3. Only reset to the first investigation when:
   - the child is entering the mode for the first time, or
   - a product rule explicitly requires a fresh start
4. Keep the investigation chooser highlight and progress consistent with the restored state.

### 1.4 Medium: mode names are too abstract without persistent micro-explanations

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:964)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11684)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11693)

Problem:

`Flow`, `Send`, `Boost`, `Pick`, and `Build` are short and clean, but not all of them are self-explanatory for an `8-12` audience once the intro is gone.

The current interface shows the mode name, but not a persistent reminder of what that mode is for.

Why this is wrong:

Pre-training helps learners when a system has multiple new labels and each label maps to a different kind of reasoning.

Required fix:

1. Add a one-line mode descriptor in the `Investigation` section.
2. Reuse or adapt the intro blurbs where appropriate.
3. Add a current investigation title above the chip rail so the active content is not communicated by chip highlight alone.

## 2. Learning Loop And Feedback

### 2.1 Critical: interaction, consequence, and explanation are still too far apart

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:925)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:977)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:982)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11325)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11527)

Problem:

In several modes, the child:

1. manipulates a control in the panel,
2. looks left to the board,
3. looks down to readouts,
4. looks further down for hint or success feedback.

This is especially strong in `Flow` and `Send`.

Why this is wrong:

Research on multimedia learning favors keeping related information close in space and time. Research on simulation learning also shows that feedback and scaffolding need to be timely and usable, not merely present.

Right now the app often teaches the right idea with the wrong spatial pattern.

Required fix:

1. Move the primary manipulation closer to the board for every mode.
2. For `Send`, show a compact live consequence strip adjacent to the voltage slider:
   - `Push`
   - `Flow`
   - `Loss`
3. For `Flow`, prefer on-board source/type switching over a detached side-panel toggle.
4. When a board object is selected, show immediate local visual response on that object before or while using the coach area.
5. Keep the coach area for summary feedback, not as the only place where the result becomes visible.

### 2.2 High: the app still asks the child to use a button called `Check` too often, especially after a board choice

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11428)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11436)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11503)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11791)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11807)

Problem:

The child often selects something visually, but then must move to another part of the panel to press `Check`.

Why this is wrong:

Timely feedback is strongest when it is close to the attempted action. A distant generic `Check` button makes the learning loop feel bureaucratic instead of responsive.

Required fix:

1. For reversible single-step choices, consider immediate evaluation.
2. If a confirm step is still needed, colocate it with the selected board object or the relevant control cluster.
3. Do not require the child to tap the board and then hunt for a general-purpose `Check` button elsewhere.

### 2.3 High: `Explore` still fails the autonomy test in three of the five modes

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11291)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11328)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11396)

Problem:

`Flow` and `Send` have real explore controls.

`Boost`, `Pick`, and `Build` still fall back to a static `Explore mode` label.

Why this is wrong:

Child-focused digital learning should support autonomy and competence. A button that promises experimentation but opens a mostly empty state teaches the child not to trust the app’s invitations.

Required fix:

1. Implement mode-specific `Explore` states for `Boost`, `Pick`, and `Build`.
2. If any mode still lacks a real explore surface, disable `Explore` in that mode honestly.
3. Do not show the same active button treatment for meaningful and non-meaningful explore states.

## 3. Mobile And Input Ergonomics

### 3.1 High: the top workspace navigation still wraps vertically on narrow screens instead of behaving like one compact strip

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:151)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:160)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:907)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:922)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:722)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:761)

Problem:

The play-area navigation is still a column with a separate family row and mode row, and the rows wrap.

That is better than four stacked rows, but it is still not the stable one-strip hierarchy the app needs.

Why this is wrong:

On mobile, wrapped navigation increases chrome height and pushes the board farther down the screen. That is especially costly in a board-first educational app.

Required fix:

1. Convert the workspace navigation to a single horizontal strip.
2. Keep the family segmented control fixed.
3. Make the mode rail horizontally scrollable on narrow widths.
4. Do not allow multi-line wrapping of mode chips.

### 3.2 High: the panel action area is not sticky, so the primary next action can drift off-screen

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:348)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:354)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:696)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:706)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1034)

Problem:

The panel scrolls independently, but the action row is just another section in that scroll.

After reading explanations or using controls, the child may need to scroll just to find `Next`.

Why this is wrong:

Children benefit from stable action placement. If the primary action moves out of reach, the app feels harder than the concept.

Required fix:

1. Make the action bar sticky to the bottom of the panel.
2. Keep it visible in normal mode and hidden in intro mode.
3. Add a top divider or subtle shadow so the sticky region reads as intentional.

### 3.3 Medium: touch targets are still too inconsistent for child use

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:295)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:702)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:786)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:847)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:887)

Problem:

Coarse-pointer rules enlarge some controls:

- mode buttons
- stage buttons
- type buttons
- fire buttons

But not all of them:

- `Intro`
- language switch
- `Explore`
- `Hint`

On narrow widths, several of these remain visually and physically small.

Why this is wrong:

W3C target-size guidance sets a floor for touch accessibility. For a child audience, the design target should be more generous, not less.

Required fix:

1. Give every tappable control a minimum target of at least `44 x 44` CSS px.
2. Apply this to:
   - header buttons
   - action buttons
   - intro nav
   - investigation chips
3. Add enough spacing to avoid accidental taps between adjacent controls.

## 4. Localization And Inclusion

### 4.1 High: Polish answer-option localization is still incomplete

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:8726)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:8860)

Problem:

The current fallback mapping for Polish answer labels is incomplete.

A scripted check found `52` unique option labels with no `label_pl` and no `LABEL_PL` mapping.

Examples include:

- numeric answer labels
- voltage-distance labels
- several chain descriptions
- several hybrid-route descriptions

Why this is wrong:

In an educational app, mixed-language answer options are not cosmetic errors. They directly undermine comprehension and fairness.

Required fix:

1. Ensure every authored option has one of:
   - `label_pl`
   - a guaranteed complete mapping in `LABEL_PL`
2. Prefer `label_pl` on the authored option object for long or contextual labels.
3. Add a verification script or build-time check that fails if any option label is missing Polish coverage.

### 4.2 Medium: intro and navigation translations should be treated as one system, not as separate patches

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11719)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:11761)

Problem:

Translation handling has improved, but the current architecture still relies on multiple one-off updates for normal and intro UI.

Why this is wrong:

Child-facing bilingual products need predictable language behavior. The more translation updates are patched per surface, the easier it becomes to miss a control or leave mixed-language UI behind.

Required fix:

1. Centralize normal and intro translation refresh logic.
2. Treat moved navigation and panel elements as first-class translated surfaces.
3. Add a UX verification pass for:
   - normal mode EN
   - normal mode PL
   - intro EN
   - intro PL

## 5. Release Process Requirement

### 5.1 Medium: do not consider the UX complete without moderated child testing

Problem:

This code review can identify structural UX risks, but it cannot replace observing real children using the app.

Why this is wrong:

Child-centered design guidance consistently recommends designing with users, not only for them. This is especially important in educational software where adult assumptions about difficulty and clarity are often wrong.

Required fix:

Before UX signoff:

1. run moderated testing with at least `5-8` children in the target age range or a close classroom proxy
2. test these tasks:
   - enter and exit intro
   - switch family
   - switch mode
   - switch investigation
   - use `Explore`
   - complete one `Send` task
   - change language
3. record:
   - where children hesitate
   - where they read labels aloud incorrectly
   - where they tap the wrong thing first
   - where they lose track of what changed
4. do not call the UX complete until those observations are resolved or consciously accepted

## Sources

Local sources inspected:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)
- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)
- [CURRENTLAB_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_REVIEW_2026-05-07.md)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)
- [CURRENTLAB_INTRO_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_REVIEW_2026-05-07.md)
- [CURRENTLAB_NAV_REDESIGN_2026-05-08.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_NAV_REDESIGN_2026-05-08.md)

External references used:

- UNICEF Innovation, Human-Centred Design:
  https://www.unicef.org/innovation/hcd
- RITEC, The 8 priorities for children’s digital well-being:
  https://www.5rightsfoundation.com/uploads/1/1/6/1/116154607/ritec-8priorities.pdf
- Cambridge University Press, Principles for reducing extraneous processing in multimedia learning:
  https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/C98AB3A6CE760DD63C048936EA0B3B44/9780511816819c12_p183-200_CBO.pdf/principles_for_reducing_extraneous_processing_in_multimedia_learning_coherence_signaling_redundancy_spatial_contiguity_and_temporal_contiguity_principles.pdf
- Cambridge University Press, Principles for managing essential processing in multimedia learning:
  https://resolve.cambridge.org/core/services/aop-cambridge-core/content/view/DD24C2F48B9B1277CE59F78276110258/9781139547369c13_p316-344_CBO.pdf/principles_for_managing_essential_processing_in_multimedia_learning_segmenting_pretraining_and_modality_principles.pdf
- Springer, Effective support for learning from simulations:
  https://stemeducationjournal.springeropen.com/articles/10.1186/s40594-024-00490-7
- W3C WCAG 2.2, Target Size:
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
