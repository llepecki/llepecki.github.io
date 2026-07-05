# Fractions App: Interaction Affordance Spec

Target file:
- `/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html`

Related document:
- `/Users/llepecki/Projects/llepecki.github.io/learn/FRACTIONS_PLACE_REPAIR_REDESIGN_2026-05-06.md`

Scope:
- This document defines a cross-app interaction standard for the board area.
- It also captures five concrete usability defects that must be treated as part of the same fix wave.

Priority:
- High.
- This is not a “polish if time permits” document.
- These behaviors affect whether the child understands what is interactive, what action is possible, and what the action will do before they commit.

## 1. Problem Statement

The app currently has a repeated interaction weakness:
- many board elements are clickable or draggable,
- but they do not preview enough of the consequence of interaction,
- and they often do not advertise clearly enough that they are the intended target.

For children, this is a teaching problem, not just a visual polish problem.

The board should not wait until after click to explain itself.

## 2. Core Principle

Every primary interactive board element must have a `pre-commit state`.

That means:
- before the child clicks, taps, or releases,
- the board should already preview what will happen,
- locally, visually, and specifically.

This preview must be stronger than:
- generic cursor changes,
- vague hover glow,
- side-panel hint text,
- or post-click-only feedback.

## 3. What Counts As A Real Fix

A real fix:
- changes board interaction behavior,
- adds explicit preview states,
- improves action targeting,
- and clarifies cause/effect before commitment.

A fake fix:
- only adds CSS hover color to static elements,
- only changes prompt text,
- only increases shadow intensity,
- or only adds generic animation after success.

## 4. Mandatory Backlog Items Included In This Spec

These five current issues are part of this handoff and must not be dropped.

### 4.1 Compare: equality choice is hidden and leaks the answer

Current problem:
- `=` is not presented as a first-class on-board choice.
- It exists as a separate floating button.
- It only appears when the compared values are actually equal.

Why this is bad:
- the UI itself reveals when equality is possible
- the third compare action is not integrated into the same interaction grammar as left/right choice

Required outcome:
- `Compare` must present equality as a normal on-board candidate action
- not as a conditional special button outside the main board logic

### 4.2 Build: ghost target is missing on the main strip

Current problem:
- the main strip does not preview the target amount even though the mode conceptually supports ghost targeting

Why this is bad:
- the child is asked to fill a target while the target is most visible on the number line, not on the strip they are actively manipulating

Required outcome:
- `Build` must restore a clear strip-level ghost target or equivalent live preview

### 4.3 Match: wrong-pair feedback is too weak

Current problem:
- a wrong attempted pair mostly results in deselection plus generic error text

Why this is bad:
- the board does not clearly say “these two do not belong together”
- mistakes feel quiet and under-explained

Required outcome:
- wrong pair attempts must produce clear on-board feedback

### 4.4 Mobile: scenes still mostly shrink instead of reflowing

Current problem:
- responsive CSS changes chrome density, but many board layouts remain desktop-first fixed SVG scenes

Why this is bad:
- touch interactions become small, crowded, and visually compressed

Required outcome:
- board interactions must remain readable and intentional on small screens
- not just smaller

### 4.5 Match: successful pairs are not grouped strongly enough

Current problem:
- matched cards remain in place with mostly border-color distinction

Why this is bad:
- the board does not strongly communicate “these two are now a solved pair”

Required outcome:
- matched relationships must become visually explicit

## 5. Global Affordance Standard

This standard applies to all board activities.

## 5.1 Every interactive element must have 4 states

Every major board interaction target must support:

1. `idle`
2. `hover / preview`
3. `active / selected / dragging`
4. `resolved`

The user must be able to distinguish these states without reading the side panel.

## 5.2 Hover / preview must be local and specific

Required behavior:
- the board previews the exact affected segment, card, gap, drop point, or answer path

Rejected behavior:
- generic card glow with no explanation of what will change
- entire board brightening
- panel text updating while the target itself stays visually unchanged

## 5.3 Coarse-pointer fallback is mandatory

Hover is not enough.

On touch devices, each interaction must still have a preview strategy:
- touch-down preview
- press-and-hold preview
- first-tap select, second-tap confirm where appropriate
- active-state highlight while dragging

Do not design affordance assuming mouse-only hover.

## 5.4 Board-first feedback rule

If the child interacts with the board, the first useful feedback must appear on the board.

The right panel may reinforce it.
It must not be the primary explanation.

## 5.5 Action target visibility rule

A child must never have to place, compare, or select against a target that is hidden by the draggable or clickable object itself.

This applies directly to `Place`, and conceptually to all other modes.

## 6. Shared Implementation Requirements

## 6.1 Add shared interaction-preview state

Introduce a shared board interaction layer or equivalent mode-specific state.

Examples of needed fields:
- `hoverTarget`
- `hoverKind`
- `previewRange`
- `previewValue`
- `selectedCandidate`
- `dragAnchorX`
- `dragAnchorY`

Do not try to solve all preview behavior with CSS alone.

## 6.2 Add reusable preview helpers

The app should gain reusable primitives for:
- preview highlight band
- hover ring / halo
- candidate connector line
- temporary pair connection
- selected focus frame
- invalid-attempt shake or flash

These should be light-weight and SVG-native.

## 6.3 Avoid raw redraws that erase interaction context

Where possible:
- preserve preview state through rerender
- do not instantly drop from “candidate” to “nothing happened”

Children need a readable causal chain.

## 7. Mode-Specific Requirements

## 7.1 Build

### Problem
- clickable strip segments do not clearly preview how far the fill will extend before click

### Required behavior
- hovering or touch-previewing a segment must preview the fill through that segment
- the preview should tint all segments that would become active
- the currently previewed final segment should be slightly emphasized

### Required target assistance
- restore a visible ghost target on the strip itself
- the child should see:
  - current fill
  - hovered candidate fill
  - target fill

These three states must remain distinguishable.

### Rejection condition
- if the child still only sees the final result after click, `Build` is not fixed

## 7.2 Compare

### Problem 1
- compare cards are interactive, but preview is weak

### Problem 2
- equality exists as a hidden conditional button and leaks the answer

### Required behavior
- hovering a compare card should:
  - lift it slightly
  - intensify its border
  - dim the opposite card slightly
  - make the hovered card feel like the candidate answer

### Equality redesign requirement
- equality must be a first-class on-board choice
- not a special floating control that only appears when equality is true

Acceptable directions:
- third center card
- center pill between cards
- explicit compare ribbon with three visible choices

Strict rule:
- `Equal` must be visible whenever the compare mode expects a relational decision
- it may be disabled or visually secondary in some authored sequences only if that does not leak the answer

### Rejection condition
- if the equality choice still appears only on actual equal rounds, `Compare` is not fixed

## 7.3 Match

### Problem 1
- hover/selection is weak before commitment

### Problem 2
- wrong-pair feedback is too weak

### Problem 3
- matched pairs are not grouped strongly enough

### Required behavior: first selection
- hovering a card should make it clearly tappable
- selecting the first card should put it into a strong selected state

### Required behavior: second-card preview
- when one card is selected and the child hovers another card:
  - show a temporary connection or pairing preview
  - preview color should communicate candidate state

### Wrong-pair behavior
- on wrong attempted pair:
  - preserve the attempted relationship briefly
  - show visual rejection on the board
  - examples: red connection flash, brief shake, mismatch cross-mark

Do not revert instantly to neutral.

### Correct-pair behavior
- on correct pair:
  - cards must become visually grouped
  - acceptable methods:
    - cards slide toward each other
    - connecting line locks in
    - pair background band appears
    - paired cards shrink into a solved pair zone

Border color alone is not enough.

### Rejection conditions
- wrong attempts that only show side-panel text
- correct pairs that are only distinguished by border color

## 7.4 Place

This mode must also follow:
- `/Users/llepecki/Projects/llepecki.github.io/learn/FRACTIONS_PLACE_REPAIR_REDESIGN_2026-05-06.md`

Additional affordance rule for this spec:
- during drag, the child must always see:
  - the current candidate landing point
  - the connector
  - the relationship between card and point

The dragged card must not obscure the action target.

## 7.5 Repair

This mode must also follow:
- `/Users/llepecki/Projects/llepecki.github.io/learn/FRACTIONS_PLACE_REPAIR_REDESIGN_2026-05-06.md`

Additional affordance rule for this spec:
- before selection, each representation must read as a suspect candidate
- on hover or touch-preview, a quadrant should visually say:
  - “you can inspect/select me”
  - not:
  - “I am a passive content panel”

## 7.6 Add / Subtract / Multiply / Divide

These modes also need the same affordance standard.

At minimum:
- answer options must visibly respond before click
- target rows, trays, or regions must preview meaning before commitment
- estimate-first screens must make the benchmark relationship legible on hover / focus

Required examples:
- hovered answer option lifts or brightens clearly
- relevant model segment or region is highlighted when possible
- prediction choices feel like real choices, not flat buttons under text

This document does not require a full redesign of all calculation modes now, but new work must follow this standard.

## 8. Mobile / Touch Requirements

## 8.1 Reflow rule

If a board interaction depends on close reading of multiple small targets, the scene must reflow on narrow screens.

Do not ship a “desktop scene but smaller” solution.

## 8.2 Touch targets

Primary interactive board elements must remain comfortably targetable on coarse pointers.

That includes:
- compare choices
- match cards
- place markers / labels
- repair quadrants
- answer options

## 8.3 Preview fallback

On touch:
- preview can occur on touch-down before release
- preview can occur on first selection in a two-step interaction
- but the app must still provide a visible pre-commit cue

## 9. Copy Requirements

The language must reinforce the interaction, not replace it.

Examples of improved guidance style:
- `Tap the card you want to compare.`
- `Hover to preview the fill.`
- `Select one card, then choose its match.`
- `Drag until the pin sits on the right tick.`
- `Tap the one that does not match.`

But copy alone does not count as a fix.

## 10. Implementation Order

Implement in this order:

### Phase 1: shared affordance primitives
- hover/preview state model
- reusable SVG preview helpers
- coarse-pointer fallback rules

### Phase 2: represent-family fixes
- `Build`
- `Compare`
- `Match`
- integrate with `Place` / `Repair` redesign work

### Phase 3: mobile and touch pass
- reflow where required
- touch preview validation

### Phase 4: calculation-family alignment
- ensure new or existing calculate modes follow the same affordance standard

## 11. Verification Checklist

### Global
1. Every primary board interaction has a visible pre-commit state.
2. Hover states are not merely decorative.
3. Touch devices still get an equivalent preview state.
4. The board, not the side panel, carries the first useful feedback.

### Build
5. Hovering a strip segment previews the fill result before click.
6. The strip itself shows the target or target-equivalent preview.

### Compare
7. Cards visibly behave like candidate choices before click.
8. Equality is a first-class visible choice and does not leak the answer.

### Match
9. Selecting one card makes the next action obvious.
10. Wrong pair attempts produce visible on-board rejection.
11. Correct pairs become visibly grouped.

### Place
12. Drag target remains visible throughout placement.
13. Connector / anchor relationship is obvious.

### Repair
14. Quadrants read as selectable suspects before tap.
15. Phase transitions remain visually clear.

### Mobile
16. The board does not merely shrink; dense interactions reflow appropriately.

## 12. Rejection Conditions

Reject the implementation if any of the following is true:

1. The “affordance pass” is mostly CSS hover color changes.
2. `Compare` still hides equality as a special floating conditional control.
3. `Build` still lacks a strip-level target preview.
4. `Match` wrong-pair feedback still mostly lives in the side panel.
5. Matched pairs still only differ by border color.
6. Mobile remains primarily a scaled-down desktop scene.
7. Touch devices do not get meaningful preview states.

## 13. Final Standard

The desired result is not:
- prettier hover
- more glow
- more animation after success

The desired result is:
- the child can tell what is interactive,
- what it will do,
- and where the action will land,
- before committing.

If that is not true on the board itself, this spec has not been satisfied.
