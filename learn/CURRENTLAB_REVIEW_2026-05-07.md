# Current Paths Lab: Multi-Step Review

Reviewed on 2026-05-07.

This review covers:

- educational review
- scientific review
- visual / UX review
- Polish translation review

Reviewed artifact:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)

Supporting design spec:

- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)

## Executive Verdict

The app is technically clean and structurally complete enough to run, and `npm run code-review -- currentlab.html` reports no static findings.

That is not the same as saying the product is review-ready.

The main problem is that the implementation still behaves more like a large, well-illustrated quiz than a board-first interactive learning lab.

The highest-risk issues are:

1. too many modes collapse to panel-based multiple choice instead of genuine manipulation,
2. the global `Level 1-5` system feels imposed rather than educationally necessary,
3. `Explore` is effectively non-functional during normal progression,
4. several science phrases are wrong enough to teach misconceptions,
5. Polish mission text is mostly present, but Polish answer options are not implemented at all.

Do not treat this as a copy-polish pass.

Several findings require interaction redesign, not just wording edits.

## Method

This review used:

- direct source inspection of [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)
- scripted checks of mission/task/localization structure
- `npm run code-review -- currentlab.html`
- external educational and technical reference sources listed at the end of this document

Scripted checks found:

- all authored mission/hint/feedback/explanation/scenario text fields have Polish variants
- `230` answer-option labels do not have Polish variants
- `boost`, `pick`, and `build` are each `30 / 30` `choose` tasks

## 1. Educational Review

### 1.1 Critical: `Boost`, `Pick`, and `Build` are still quiz modes, not interaction-led modes

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1074)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10134)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10227)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10252)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9906)

Problem:

Inspection of the authored task data and control logic shows that `boost`, `pick`, and `build` are each `30 / 30` `choose` tasks. The child is usually presented with one or two buttons, then the app checks a selected index against `correctIndex`.

Why this is wrong:

The design spec required these modes to teach through different verbs, not through one repeated quiz verb. This is especially damaging in `Build`, where the product promise is assembly, routing, and conversion placement, but the implementation is a multiple-choice chain selector.

This also clashes with child-learning best practice for electricity topics. Children learn more robustly when they make, compare, test, and explain models, not only when they pick labels.

Required fix:

Replace the current `choose-only` interaction model in these modes with real manipulations.

Minimum required changes:

1. `Boost` must let the child place, activate, or order step-up / step-down / converter blocks on the board.
2. `Pick` must use board-led classification or route reasoning, not only answer buttons. Examples: drag scenario cards into `AC / DC / Hybrid`, tap the cable section that should be `DC`, or place the converter where it belongs.
3. `Build` must become actual chain construction. The child must assemble source, converter, line, and load modules into slots or stages. Do not accept a button press as “build.”
4. Keep authored rounds, hints, and explanations, but move the main verb onto the board.

### 1.2 High: the board is mostly presentational; the panel owns the interaction

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:8397)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10509)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10535)

Problem:

The SVG board is rendered and updated, but the primary answer interactions live in `controlsArea` and toolbar listeners. There are no meaningful board-targeted interaction handlers for the main learning tasks.

Why this is wrong:

For children, the action and the explanation need to happen in the same place. Right now the board shows the idea, but the child acts in the panel. That weakens causality and makes the product feel like a quiz beside an illustration.

Required fix:

Move the primary interaction surface onto the board for all five modes.

Minimum required changes:

1. Keep the panel for meters, hints, progress, and secondary controls.
2. Make the board tappable / draggable for the main decision in each mode.
3. Use panel buttons only where a board action would be materially worse.
4. Add visible affordances on the board itself so a child can tell what is interactive.

### 1.3 High: `Explore` does not support real self-directed experimentation across the app

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9830)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9990)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10024)

Problem:

The design promised `Explore` as a genuine child-controlled lab state. In practice:

- `Explore` only has custom controls for `flow` and `send`
- `boost`, `pick`, and `build` fall back to a static `Explore mode` label
- because `getCurrentStep()` still returns the active mission, the explore branch is not reached during normal progression

Why this is wrong:

The app teaches invisible systems. Children need a place to ask “what if?” without being forced through answer buttons. The current implementation blocks that behavior right where it should be strongest.

Required fix:

1. Decouple `Explore` from `!step`.
2. When the child enters `Explore`, switch to a dedicated free-play state immediately.
3. Implement actual mode-specific explore controls for all five modes, or disable the `Explore` button for modes where it is not yet implemented. Do not keep a misleading active button.
4. In `Boost`, `Pick`, and `Build`, `Explore` must expose real decisions such as converter placement, route type, and source/load combinations.

### 1.4 Medium: prediction is used well in `Flow`, but the stronger predict-observe-explain loop is not carried into later reasoning modes

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1500)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10104)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9452)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9580)

Problem:

`Flow` uses prediction rounds, which is good. But `Send` and `Boost`, which are the places where prediction is most educationally valuable, rely heavily on choice buttons and after-the-fact explanation.

Why this is wrong:

Electricity misconceptions are persistent. Children benefit when they must commit to a prediction, see the result, and then explain the mismatch. That pattern should be stronger in voltage/loss/transformer content, not weaker.

Required fix:

Add explicit predict-observe-explain structure to later modes.

Minimum required changes:

1. `Send` should ask for a predicted effect before the slider result is checked.
2. `Boost` should ask the child to predict what happens if the transformer is moved, removed, or reversed before showing the result.
3. `Pick` should sometimes ask for both a classification and a reason selection, not only one label.

### 1.5 High: the global `Level 1-5` progression is artificial for this subject and should probably be removed

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:794)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10413)
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html:746)
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html:868)

Problem:

The current app inherits a global `Level 1-5` selector from the fractions product. In `fractions.html`, that kind of progression makes sense because the child repeatedly deepens one mathematical system through a clear increase in symbolic and visual reasoning.

In `currentlab.html`, the content is closer to `feedbacktank.html`: it is scenario-driven, model-driven, and investigation-driven. The child is not really mastering one clean ladder of abstract difficulty. They are moving across different questions:

- what AC and DC are
- why voltage matters
- how transformers help
- when DC wins
- why modern systems are hybrid

Those are not naturally expressed as one global level strip that spans every family and mode.

Why this is wrong:

The global level bar creates the appearance of structure, but not a child-meaningful structure.

`Level 4` in `Flow` and `Level 4` in `Build` are not the same kind of difficulty. They are different scenario bundles wearing the same label.

That creates three problems:

1. the difficulty signal is artificial,
2. mode switching becomes harder to understand,
3. the app inherits complexity from the fractions product without gaining equivalent educational value.

Required fix:

Raise this as a product-architecture change, not as a minor UI tweak.

Recommended direction:

Remove the global `Level 1-5` selector and replace it with mode-specific guided investigations or scenario tracks.

A better structure for this app would be:

1. Keep the top-level families: `Learn` and `Decide`.
2. Keep the mode row: `Flow`, `Send`, `Boost`, `Pick`, `Build`.
3. Replace the global level row with one of these:
   - a per-mode investigation strip
   - a per-mode scenario carousel
   - a per-mode chapter list in the panel
4. Preserve the current authored content by regrouping it into named packs rather than numeric levels.

Concrete replacement proposal:

- `Flow`: `One-Way vs Back-and-Forth` -> `Sources` -> `Converters` -> `Hybrid Chains`
- `Send`: `Power and Push` -> `Voltage vs Current` -> `Distance and Heat` -> `Best Route`
- `Boost`: `Step Up / Step Down` -> `Classic Grid` -> `Why Transformers Matter` -> `DC Needs Different Converters`
- `Pick`: `Everyday Devices` -> `Home and Solar` -> `Long Cables` -> `Modern Hybrid`
- `Build`: `Simple Circuits` -> `Chargers and Inverters` -> `Long-Distance Chains` -> `Hybrid Systems`

How to preserve what currently works:

1. Keep the authored mission inventory.
2. Keep progress tracking, but track it per mode-pack instead of global level.
3. Keep hints, explanations, and the `Next` flow.
4. Keep the best `Flow` and `Send` rounds, but regroup them into named investigations.
5. Keep an `Explore` state per mode as the open-ended destination after the guided investigations.

Implementation rule:

Do not simply rename `Level 1-5` to `Chapter 1-5`.

The point is to stop pretending there is one global difficulty ladder when the app is actually a set of concept investigations.

## 2. Scientific Review

### 2.1 Critical: the app teaches that batteries “store DC,” which is the wrong concept

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:2055)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5481)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5484)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5488)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5494)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5781)

Problem:

The app repeatedly says or implies that batteries “store DC” or “store DC energy.”

Why this is wrong:

That wording reinforces a classic misconception. Batteries store chemical energy. When connected in a circuit, they provide a DC voltage and can drive DC current through a load.

This is not a wording nit. It changes the concept being taught.

Required fix:

Rewrite every battery-storage prompt and explanation so it teaches output type, not stored current.

Use this rule everywhere:

- acceptable: “A battery provides DC output when it powers a circuit.”
- acceptable: “A battery stores chemical energy.”
- unacceptable: “A battery stores DC.”
- unacceptable: “A battery stores DC energy.”

Concrete required rewrites:

1. Replace “What type does the BATTERY store?” with “What type of current does a battery provide when it powers a circuit?”
2. Replace “Batteries store DC.” with “Batteries provide DC output.”
3. Replace “Batteries store DC energy.” with “Batteries store chemical energy and can provide DC output.”
4. Apply the same correction in both EN and PL.

### 2.2 High: the HVDC explanation is inaccurate

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:4555)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:4563)

Problem:

The app states:

- “This is how HVDC works.”
- “HVDC (High Voltage DC) sends power over hundreds of kilometers using DC-DC or AC-DC converters at each end.”

Why this is wrong:

That conflates two different ideas:

- DC-DC conversion inside DC systems
- HVDC converter stations that typically convert AC to DC at one end and DC to AC at the other when linking AC grids

The current wording is inaccurate enough to leave a wrong mental model of HVDC infrastructure.

Required fix:

Rewrite the HVDC explanation to distinguish:

1. DC-DC converters for DC voltage change inside DC systems
2. HVDC converter stations for AC-grid interconnection

Safe replacement wording:

- “HVDC links usually use converter stations: AC is converted to DC at one end of the link, the cable carries DC, and DC is converted back to AC at the other end when needed.”

If you want to keep a separate DC-DC example, keep it inside battery / solar / local DC routes only. Do not describe typical grid-scale HVDC with “DC-DC or AC-DC at each end.”

### 2.3 High: the EV example is scientifically wrong

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5852)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5855)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5859)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5868)

Problem:

The EV scenario says the car’s “battery and motor use DC” and the success text says the battery powers a “DC motor.”

Why this is wrong:

That is not a safe simplification for a general EV example. Modern EVs commonly store DC in the battery and use power electronics to drive the traction motor, often as AC.

The scenario can still be used to teach a hybrid chain, but not with the current motor wording.

Required fix:

Rewrite the EV example so it teaches this:

- wall charging may start as AC
- the battery stores DC
- onboard power electronics / inverter drive the motor

Safe replacement wording:

- “EVs are hybrid: AC may come in while charging, the battery stores DC, and power electronics drive the motor.”

Do not keep the phrase “DC motor” unless you intentionally narrow the scenario to a specific DC-motor example and explain that choice.

### 2.4 Medium: the train example over-claims direct AC use

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5520)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5528)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5538)

Problem:

The hint says “AC from the line powers the train directly,” but the explanation immediately softens that by saying some trains convert internally.

Why this is wrong:

The current wording first teaches the stronger claim and then partially retracts it. That is not a stable teaching pattern.

Required fix:

Use a consistent statement from the start:

- “The overhead line supplies AC to the train. Onboard systems may control or convert it before the motor uses it.”

Do not use “directly” here.

## 3. Visual / UX Review

### 3.1 Critical: `Explore` visually appears active even when it has not actually switched the app into explore behavior

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9830)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9990)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10024)

Problem:

Clicking `Explore` sets `state.scene = "explore"` and visually activates the button, but the main board / mission / control branches still depend on `getCurrentStep()`. During normal progression, `getCurrentStep()` still returns the authored step, so the UI continues to behave like activity mode.

Why this is wrong:

This is a misleading UI state. The app tells the child “you are exploring” while still showing activity-mode behavior.

Required fix:

1. Entering `Explore` must immediately change what the board, controls, mission text, and meters do.
2. Do not key explore behavior off `!step`.
3. Introduce a real explore-state branch before step-specific rendering.
4. If a mode does not support `Explore` yet, disable the button in that mode and explain why.

### 3.2 High: the meter panel can show stale `Send` values in non-`Send` modes

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10279)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10332)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10356)

Problem:

`updateMetersDisplay()` fully updates `Voltage`, `Current`, `Useful Power`, `Wire Heat Loss`, and `Efficiency` in `send`, but outside `send` it only updates `rdType`, `rdSource`, and `rdLoad`. The remaining meter fields are not reset there.

Why this is wrong:

If the user comes from `Send`, the non-`Send` modes can inherit old power/loss numbers. That is both visually confusing and scientifically misleading.

Required fix:

On every non-`Send` meter update, explicitly reset or replace the extra meter fields.

Two acceptable solutions:

1. reset `Voltage`, `Current`, `Useful Power`, `Wire Heat Loss`, and `Efficiency` to `—`
2. provide mode-appropriate values for those fields if you genuinely compute them

Do not leave stale values in place.

### 3.3 High: the 375px strategy shrinks the UI below child-friendly readability instead of reflowing it

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:637)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:681)

Problem:

At small widths the implementation solves crowding by shrinking buttons and text aggressively:

- family buttons to `10px`
- mode buttons to `10px`
- level buttons down to `26px`
- action buttons to `10px`

Why this is wrong:

This is hostile to the target audience. Children need larger, calmer targets, not denser miniature controls.

Required fix:

1. Keep interactive text at a child-readable minimum size.
2. Preserve at least roughly `36-44px` usable control targets in the primary toolbar.
3. Let rows wrap or stack sooner instead of shrinking typography this far.
4. If necessary, move `Explore / Hint / Next` into a separate stacked row on narrow screens.

### 3.4 Medium: `Pick` and `Build` underuse the board and separate narrative from action

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9652)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:9721)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10227)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10252)

Problem:

`Pick` renders a static board card plus source/load icons, while the actual answer is chosen in the side panel. `Build` shows a finished chain after selection, but the child never constructs it on the board.

Why this is wrong:

Visually, the center of gravity is wrong. The board is where the story is, but not where the decision is made.

Required fix:

1. In `Pick`, move the classification or route choice onto the board.
2. In `Build`, replace the side-panel option list with board slots or stage targets.
3. Keep the panel secondary.

## 4. Polish Translation Review

### 4.1 Critical: Polish answer options are not implemented

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10143)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10168)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10236)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:10260)

Problem:

Mission, hint, feedback, explanation, and scenario text generally have Polish variants. Answer options do not. The controls render `option.label` directly with no locale-aware fallback, and the mission data does not provide `label_pl`.

Scripted count:

- `send`: `32` untranslated option labels
- `boost`: `60` untranslated option labels
- `pick`: `78` untranslated option labels
- `build`: `60` untranslated option labels

Why this is wrong:

Polish mode becomes a mixed-language product precisely where the child must make the answer decision.

Required fix:

1. Add `label_pl` to every task option that contains language.
2. Render option text through a locale-aware helper, not `option.label` directly.
3. Add a verification script or assertion that fails if an option has `label` but no `label_pl`.
4. Re-test all five modes in Polish after the data change.

### 4.2 High: several Polish strings are present but pedagogically wrong or weak

Refs:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:1004)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5484)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5488)
- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html:5860)

Problem:

Some Polish strings exist, but they do not convey the intended teaching cleanly:

- `boost: "Wzmocnienie"` is too abstract for a voltage-transformation / transformer mode
- `Jaki prąd PRZECHOWUJE bateria?` teaches the wrong concept
- `Baterie przechowują DC.` teaches the wrong concept
- the EV line mirrors the incorrect English motor claim

Why this is wrong:

Good translation is not only about presence. It must carry the right child-facing concept.

Required fix:

Rewrite these strings after the English science fixes are made.

Recommended replacements:

1. `boost` -> use a clearer child-facing Polish label such as `Transformatory` or `Zmiana napięcia`
2. battery question -> `Jaki rodzaj prądu bateria dostarcza, gdy zasila obwód?`
3. battery explanation -> `Bateria magazynuje energię chemiczną i może dostarczać prąd stały (DC).`
4. EV wording -> say the car uses AC and DC at different stages, without claiming a `silnik DC` unless that is intentionally narrowed to a specific example

## 5. Final Instruction To The Implementing Agent

Do not answer this review with:

- option-label translation only
- wording-only edits
- one more animation
- one more button
- a claim that the app is “already interactive”

The biggest issues are structural:

1. too many modes are still quizzes,
2. `Explore` is not functioning as promised,
3. some science language is actively misleading,
4. Polish options are missing.

The next revision should fix the science and Polish issues first, then repair the interaction model so the board becomes the actual learning surface.

## 6. Reference Sources

Educational references used for this review:

- Institute of Physics Spark, What Gets Used Up?: https://spark.iop.org/what-gets-used
- Institute of Physics Spark, A Few Students Can Clearly Distinguish Ideas of Electric Current and Potential Difference: https://spark.iop.org/few-students-can-clearly-distinguish-ideas-electric-current-and-potential-difference
- Institute of Physics Spark, Making Loops: https://spark.iop.org/making-loops
- Chiu, M.-H. and Lin, J.-W., Promoting Fourth Graders’ Conceptual Change of Their Understanding of Electric Current via Multiple Analogies: https://scholar.lib.ntnu.edu.tw/en/publications/promoting-fourth-graders-conceptual-change-of-their-understanding-2

Scientific references used for this review:

- U.S. Energy Information Administration, Batteries, Circuits, and Transformers: https://www.eia.gov/energyexplained/electricity/batteries-circuits-and-transformers.php
- U.S. Energy Information Administration, What Is Energy?: https://www.eia.gov/energyexplained/what-is-energy/
- U.S. Department of Energy, War of Currents: AC vs. DC Power: https://www.energy.gov/articles/war-currents-ac-vs-dc-power
- U.S. Department of Energy, Solar Integration: Inverters and Grid Services Basics: https://www.energy.gov/eere/solar/solar-integration-inverters-and-grid-services-basics
- Hitachi Energy, HVDC Classic: https://www.hitachienergy.com/products-and-solutions/hvdc/hvdc-classic
