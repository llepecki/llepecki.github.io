# Fractions App: Place + Repair Redesign Spec

Target file:
- `../index.html`

Status:
- This document is a strict corrective handoff for two modes only: `Place` and `Repair`.
- It is intended to be used by the implementing agent before further polish work.

Single source of truth for this scope:
- This document overrides the current implementation behavior for `Place` and `Repair`.
- If the existing app behavior conflicts with this spec, follow this spec.

## 1. Why This Exists

Two current problems are real and structural.

### 1.1 Place: the drag object hides the target

Current behavior:
- The dragged token is a full fraction card centered under the pointer.
- The snap preview is a circle drawn on the number line.
- While dragging to the correct location, the card overlaps the line and can cover the preview target.

Why this is a problem:
- The child cannot clearly see the exact landing point at the same moment they are trying to place the value.
- The interaction feels like dragging a large block onto a small target.
- The board is asking for precision while hiding the precision cue.

This is not a small polish issue. It weakens the core teaching mechanic of `Place`.

### 1.2 Repair: the task is not self-explaining

Current behavior:
- The child sees four representations.
- The board prompt is generic.
- The mode expects the child to infer:
  - that all four should represent the same value,
  - that exactly one is wrong,
  - that phase 1 is identification,
  - that phase 2 is correction.

Why this is a problem:
- The task structure is not visually taught by the board.
- The mode depends too much on prior explanation or trial-and-error.
- The fix options appear as a second, separate puzzle instead of the natural continuation of the first one.

This is not just a copy problem. The interaction grammar is under-explained.

## 2. Non-Negotiable Outcomes

After this redesign:

1. `Place` must let the child see the target landing point at all times during drag.
2. `Place` must visually connect the dragged fraction card to the exact point it is trying to claim on the line.
3. `Repair` must explain the goal on the board before the child makes the first tap.
4. `Repair` must clearly communicate that exactly one representation is wrong and that the child must first find it, then fix it.
5. Both modes must feel understandable without needing the right-side panel.

## 3. Affected Current Code

Primary functions that must be changed:
- `renderPlaceBoard()`
- `handlePlaceDown()`
- `handlePlaceMove()`
- `handlePlaceUp()`
- `renderRepairBoard()`
- `handleRepairClick()`
- `updatePanel()` only if needed to support better active-state readouts

Related shared helpers likely affected:
- `renderNumberLine()`
- `renderFractionCard()`
- possibly one or more new helpers for anchored drag cards, pin markers, spotlight states, or phase banners

## 4. Place Redesign

## 4.1 Design Goal

The child should feel:
- “I am placing this value on the line”
- not:
- “I am dragging a rectangle near a hidden target”

The interaction should behave like placing a label with a pin, not dropping a flat tile on top of the axis.

## 4.2 Required New Interaction Model

The dragged token must become an `anchored label`.

Required behavior:
- The fraction/decimal card floats above the number line during drag.
- A visible connector line or stem links the card to a pin on the line.
- The snap target is the pin on the line, not the center of the card.
- The line and snap target remain visible while dragging.

This is mandatory.

Rejected fallback:
- keeping the current flat card drag and only increasing the preview circle size
- moving the preview in front of the card while still letting the card cover the axis
- adding only a shadow or glow without a connector

## 4.3 Board Layout Rules

### Idle state
- Number line remains the main board element.
- Token tray stays below, but the vertical spacing above the line must be reserved for drag labels.

### Drag state
- The dragged card must render above the line, not centered on the pointer.
- The visual anchor point is the bottom center of the card.
- A connector descends from the card to the snap point on the line.
- The snap point must be shown as:
  - a dot or pin head on the line
  - plus a larger halo/ring around it

### Placed state
- A correctly placed token must not disappear into a generic unlabeled dot.
- Each placed token must remain legible as a labeled marker:
  - small label pill or mini fraction card above the line
  - short connector stem to the exact point
  - dot/pin on the line

Reason:
- multi-token rounds need identity retention
- the child should still see which fraction ended up where

## 4.4 Exact Visual Requirements

### Dragged token geometry
- Card width can remain close to current size on desktop, but the dragged card must be vertically offset above the axis.
- Recommended geometry:
  - number line at current `y`
  - dragged card bottom at least `48px` above the line center
  - connector from card bottom center to snap point

### Connector
- Must be visually stable and obvious.
- Can be:
  - straight stem
  - slightly curved tether
- Simpler is better. Use a straight or slightly curved path, not a decorative squiggle.
- Connector color should match `Place` accent.

### Snap preview
- The preview target must include three layers:
  - outer halo
  - line-level pin/dot
  - optional tiny vertical tick

### Z-order
- Required front-to-back order during drag:
  1. number line base
  2. existing placed markers
  3. snap halo
  4. connector
  5. dragged card

The snap cue must never be fully hidden by the dragged card.

## 4.5 Pointer Model

The pointer should control the `pin`, not the card body.

Implementation rule:
- compute `hoverSnapValue` and `hoverSnapX` continuously during drag
- render the card from that anchor, not from raw `dragX / dragY`

Recommended behavior:
- horizontal movement controls exact snap preview
- vertical movement decides whether the user is still “placing” versus cancelling by moving away
- the card itself should stay in a controlled band above the line

Do not let the dragged card freely cover the axis again.

## 4.6 Placement Logic Changes

Current logic is tolerance-based against raw pointer position.

Replace with anchor-based logic:
- while dragging, compute snapped candidate value from pointer x
- on release within active placement band:
  - compare candidate snapped value to token value
  - if exact match, place the token at that snapped value
  - if not, reject and animate token back

Required change:
- the accepted placement should be based on the visible pin target
- not on an invisible tolerance around the pointer center

This makes the feedback more honest:
- “the pin landed on the wrong tick”
- not:
- “you were close enough / not close enough”

## 4.7 New State Shape for Place

Extend `state.place` with explicit drag-preview state.

Add fields like:
- `dragToken`
- `dragPointerX`
- `dragPointerY`
- `hoverSnapValue`
- `hoverSnapX`
- `hoverActive`

Each token should also store placed anchor info:
- `placed`
- `placedValue`
- `placedX`

Do not recompute everything from generic `placed: true` only.

## 4.8 Level Behavior for Place

The interaction model stays the same across levels. Complexity changes through content only.

### Level 1-2
- large spacing
- clear benchmark ticks
- one or two tokens
- snapped values on simple denominators

### Level 3-4
- closer values
- more tokens
- more mixed fraction/decimal labeling

### Level 5
- exact placement of close values still allowed
- but the anchored-pin interaction must remain stable
- no return to raw rectangle overlap behavior

## 4.9 Copy and On-Board Instruction

Replace vague instruction-only behavior with direct board copy.

Required top prompt:
- EN: `Drag the card so its pin lands on the right spot.`
- PL: `Przeciągnij kartę tak, aby pinezka trafiła we właściwe miejsce.`

Optional secondary line:
- EN: `Watch the glowing tick on the line.`
- PL: `Obserwuj świecący znacznik na osi.`

## 4.10 Animation / Feedback

Required:
- dragged card lifts on pickup
- wrong drop returns card to tray with a short bounce-back
- correct drop snaps pin to exact point, then label settles above it

Do not:
- instantly replace the card with a plain dot

## 4.11 Acceptance Criteria for Place

1. While dragging, the child can always see the target snap point on the line.
2. The dragged token is visually connected to the line by a connector or stem.
3. The accepted drop position corresponds to the visible pin position, not a hidden rectangle center.
4. Correctly placed tokens remain identifiable after placement.
5. On multi-token rounds, the board remains readable and each placed token can still be distinguished.

## 4.12 Rejection Conditions for Place

Reject the implementation if any of the following is true:

1. The dragged card can still cover the active drop target on the number line.
2. The connector is missing or so faint that it does not clearly explain the relationship.
3. A correct placement still collapses into an unlabeled same-color dot only.
4. The new version is only a larger preview circle with no anchor redesign.
5. The card still follows raw pointer center directly over the axis.

## 5. Repair Redesign

## 5.1 Design Goal

The first screen of `Repair` must answer three questions immediately:

1. What is wrong here?
2. What am I supposed to do first?
3. What happens after I find it?

Right now the mode does not answer those questions strongly enough.

## 5.2 Required New Mental Model

The board must explicitly teach:
- `All four pictures should mean the same amount.`
- `One of them does not match.`
- `Tap the wrong one, then fix it.`

This logic must be on the board itself, not implied.

## 5.3 Required New Phase Framing

`Repair` must become an explicit two-step mode.

Required phase banner:
- Step 1: `Find the one that does not match`
- Step 2: `Fix the highlighted one`

Visual treatment:
- a two-step progress strip at the top of the board
- current step highlighted
- second step visible but inactive during identification

This is mandatory.

Rejected fallback:
- keeping the same board and only changing one prompt string
- relying on the tiny step-goal text as the main instruction

## 5.4 Board Narrative Structure

Add a short “rule card” or central statement near the top:

- EN: `These 4 should show the same value. One is wrong.`
- PL: `Te 4 obrazki powinny pokazywać tę samą wartość. Jeden jest błędny.`

This is the missing conceptual bridge in the current mode.

The child must not need to infer the equality rule.

## 5.5 Layout Changes

Keep four representations, but change how the board explains them.

Required layout elements:
- top phase strip
- rule statement
- four representation cards
- stronger grouping between cards

Recommended grouping device:
- a central soft badge reading `Same value`
- thin neutral connector lines from the center to the four cards

Reason:
- this visually communicates that the four cards are supposed to agree
- without revealing which one is wrong

Do not leave the four cards as isolated rectangles with only a generic title.

## 5.6 Identify Phase Requirements

During phase 1:
- all four cards remain visible
- all four are equally tappable
- the board instruction must explicitly say:
  - EN: `Tap the one that does not match the others.`
  - PL: `Stuknij ten, który nie pasuje do pozostałych.`

Interaction rules:
- wrong tap: selected card shakes briefly, board keeps phase 1
- correct tap: board transitions to phase 2

Important:
- phase 1 must not feel like “guess which box is interactive”
- the whole board must clearly read as an odd-one-out puzzle

## 5.7 Fix Phase Requirements

Current problem:
- fix options appear below, but the relationship between selected wrong card and the options is too weak

Required new behavior:
- once the wrong card is found, it becomes the `focus card`
- the other three cards are visually confirmed as correct references
- the focus card is highlighted more strongly than before
- fix options appear as the direct replacement choices for that one card

Required visual changes in phase 2:
- dim the three correct cards slightly
- keep them readable
- spotlight the wrong card
- show a clear prompt:
  - EN: `Now choose the value that fixes this card.`
  - PL: `Teraz wybierz wartość, która naprawi tę kartę.`

Optional but recommended:
- draw a callout line from the prompt or option tray to the selected card

## 5.8 Fix Interaction by Representation Type

The fix phase must still feel tied to the selected representation.

### Fraction wrong
- options may remain fraction options
- but the wrong fraction card should visually look editable or awaiting replacement

### Decimal wrong
- decimal options are fine
- the selected decimal card should remain in focus while options are shown

### Number line wrong
- current multiple-choice options are acceptable only if the board makes it obvious they are replacing the selected number-line value
- better version:
  - show 3 candidate markers directly within the number-line card
  - or show the candidate values in a small anchored tray directly below that card

### Bar wrong
- options may remain value options
- but the selected bar card should preview the corrected fill after selection, before final success if feasible

Strict requirement:
- fix choices must feel local to the chosen wrong card
- not like a detached quiz row at the bottom

## 5.9 Success State

After a correct fix:
- all four cards must visibly resolve into agreement
- all borders turn success green
- central rule badge can change to:
  - EN: `Now they all match`
  - PL: `Teraz wszystkie się zgadzają`

If possible:
- animate the selected wrong card into its corrected state
- then animate or fade in the green confirmation lines

Do not jump straight from option click to generic success with minimal contextual closure.

## 5.10 New State Shape for Repair

Extend `state.repair` with more explicit phase UX fields.

Add fields like:
- `phase`
- `selectedRepr`
- `focusRepr`
- `fixOptions`
- `showRuleCard`
- `showPhaseGuide`

Optionally:
- `wrongReasonKey`
- `stepInstructionKey`

This will help authored content stay meaningful instead of generic.

## 5.11 Authored Content Changes Required

Current repair steps have `goal`, `hint1`, `hint2`, `feedbackSuccess`.

Add repair-specific authored guidance fields:
- `identifyPrompt`
- `identifyPrompt_pl`
- `fixPrompt`
- `fixPrompt_pl`
- `whyWrong`
- `whyWrong_pl`

Purpose:
- some repair rounds are about counting bar parts
- some are about number-line position
- some are about decimal equivalence

The board should be able to say the right thing for the current mismatch type.

Example:
- `fraction denominator trap`
- `decimal benchmark mismatch`
- `marker too far left`

Do not keep one generic instruction string for every repair round.

## 5.12 Onboarding Requirement

`Repair` needs a lightweight first-time explanation.

Mandatory onboarding behavior:
- first time entering `Repair` in a session, show a short board overlay or callout:
  - EN: `All four should match. Find the wrong one first, then fix it.`
  - PL: `Wszystkie cztery powinny się zgadzać. Najpierw znajdź błędne, potem je popraw.`

This can dismiss on first tap.

Reason:
- `Repair` is conceptually denser than `Build` or `Compare`
- one small onboarding assist is justified

## 5.13 Repair Visual Hierarchy Rules

Required:
- headers for each representation must be larger and clearer than current tiny labels
- phase banner must be visually stronger than the current small summary line
- selected/focus card states must be unmistakable

Do not:
- rely on `goal` text at the very top as the main explanation
- rely on similar-looking card borders for all phases

## 5.14 Acceptance Criteria for Repair

1. A first-time child can understand the basic rule from the board: all four should represent the same value.
2. The board clearly states that one representation is wrong.
3. The board clearly distinguishes phase 1 and phase 2.
4. After selecting the wrong card, the fix step feels directly tied to that card.
5. After the correct fix, the board visibly resolves into a matching set.

## 5.15 Rejection Conditions for Repair

Reject the implementation if any of the following is true:

1. The first screen is still essentially “four cards plus a vague prompt”.
2. The mode still depends on the child inferring the two-step flow.
3. The fix options still appear as a detached generic row with little connection to the selected representation.
4. The only change is stronger copy with no phase structure or hierarchy change.
5. The board still does not explicitly say that all four should show the same value.

## 6. Implementation Order

This scope should be implemented in this order.

### Phase A: Place interaction model
- add hover snap state
- redesign dragged token as anchored label with stem
- change placement logic to use snapped anchor
- preserve placed-token identity on the line

### Phase B: Place polish and readability
- tune z-order
- tune label sizes for one-token and multi-token rounds
- test overlap and mobile spacing

### Phase C: Repair phase framing
- add phase banner
- add rule statement
- add improved prompt hierarchy

### Phase D: Repair focus/fix redesign
- spotlight selected wrong card
- dim correct references
- anchor fix choices to the selected card more clearly
- add stronger success resolution

### Phase E: Content + I18N pass
- add the new strings
- add repair-specific authored prompts/reasons where needed
- verify EN/PL parity

## 7. Verification Checklist

Use this checklist before claiming the redesign is complete.

### Place
1. Dragging a token never hides the active snap point.
2. The dragged token always shows a visible connector to the line.
3. Releasing near the line places based on the visible pin position.
4. A correct placement leaves a readable labeled marker on the line.
5. Two-token rounds remain readable after both are placed.
6. Mobile width still keeps connector and label readable.

### Repair
1. The initial board explicitly says that all four should show the same value.
2. The initial board explicitly instructs the child to find the wrong one first.
3. After a correct identification, the board clearly changes to a fix phase.
4. The selected wrong representation is visually in focus during fixing.
5. The fix options feel attached to the selected wrong card.
6. The final success state visibly resolves all four into agreement.
7. EN and PL both have complete strings for new prompts and guidance.

## 8. Final Standard

The correct result is not:
- a prettier `Place`
- a better-worded `Repair`

The correct result is:
- `Place` becomes an anchored placement interaction where the target remains visible
- `Repair` becomes a self-explaining two-step reasoning activity

If the implementation does not achieve those two changes at interaction level, it should be considered incomplete.
