# Fractions App: Star Reward Spec

## Purpose

Replace the current success celebration icon in task mode with a star-based reward.

Desired behavior:
- correct on first judged attempt -> `3` stars
- correct on second judged attempt -> `2` stars
- correct after two or more wrong judged attempts -> `1` star

This is a reward-system change, not a scoring-system rewrite.

The goal is:
- reward accuracy,
- keep feedback immediate,
- avoid punishing exploratory interactions that are not true submitted answers,
- and preserve the current lesson flow.

---

## Scope

File:
- `../index.html`

Applies to:
- all activity/task modes in `Represent`
- all activity/task modes in `Calculate`

Does not apply to:
- `Explore`
- non-task idle states
- loading states

Current behavior to replace:
- `showSuccessCelebration()` shows a celebration emoji overlay after success

New behavior:
- success shows a star reward overlay instead

---

## Core Rule

Reward stars are derived from the number of judged wrong attempts in the current round.

### Mapping

- `0` wrong attempts before success -> `3` stars
- `1` wrong attempt before success -> `2` stars
- `2+` wrong attempts before success -> `1` star

Equivalent formula:
- `stars = 3` if `wrongAttempts === 0`
- `stars = 2` if `wrongAttempts === 1`
- `stars = 1` if `wrongAttempts >= 2`

There is no `0-star success` state in this feature.

---

## Important Definition: What Counts As An Attempt

This must be implemented strictly.

The reward system must count only judged wrong-answer events.

It must **not** count:
- hover preview
- touch preview
- dragging while deciding
- passive board exploration
- changing language
- switching level/mode/family
- opening hints
- estimate/prediction scaffolds unless the app explicitly treats them as a judged wrong answer
- releasing a dragged token outside the active placement band
- any non-final state that the app does not judge as wrong

This is critical.

The star system must not punish discovery-oriented interaction that is part of learning.

---

## Mode-By-Mode Attempt Semantics

### 1. Build

Current `Build` does not have a discrete “wrong answer verdict” path.

It is a constructive interaction, not a submit-and-check interaction.

For this pass:
- do **not** invent heuristic penalties for intermediate fills
- do **not** count every click/tap as an attempt
- do **not** reduce stars because a child explored multiple segments before landing correctly

Result:
- `Build` will usually award `3` stars on success in the current design

This is acceptable for this pass.

Reason:
- anything else would be arbitrary and would punish exploration
- especially in circle or incremental strip construction

### 2. Compare

Count one wrong attempt when:
- the child chooses the wrong left/right card
- or chooses equality when the values are not equal
- or chooses a side when the values are equal and that side is wrong

Do not count:
- hover/touch-preview taps that only preview and do not commit

### 3. Match

Count one wrong attempt when:
- the child selects an incorrect second card for the currently selected first card

Do not count:
- first-card selection
- deselecting the same card
- hover preview

### 4. Place

Count one wrong attempt when:
- the child releases on an active snapped position
- and that snapped position is incorrect

Do not count:
- dragging
- entering/leaving the active band
- releasing outside the active band
- cancel/bounce-back due to no valid active snap

### 5. Repair

Count one wrong attempt when:
- the child taps the wrong representation during identify phase
- the child chooses the wrong fix option during fix phase

Both phases contribute to the same round-wide wrong-attempt count.

Example:
- wrong identify once, then correct identify, then correct fix -> `2` stars
- correct identify, wrong fix twice, then correct fix -> `1` star

### 6. Add / Subtract / Multiply / Divide

Count one wrong attempt when:
- the child chooses an incorrect judged answer option

Do not count:
- estimate/prediction scaffolds, unless the implementation already defines those as judged wrong answers

For this pass:
- prediction/estimate choices must **not** reduce stars
- the star rating is based on the final scored answer interaction, not the pre-solve estimate scaffold

---

## State Model

Add explicit per-round reward state.

Recommended additions:

```js
state.ui.roundWrongAttempts
state.ui.lastRewardStars
state.ui.rewardVisible
```

Recommended meanings:
- `roundWrongAttempts`: integer for the current round only
- `lastRewardStars`: stars earned on the most recent success
- `rewardVisible`: whether the success star overlay is visible

Alternative naming is allowed if the semantics remain identical.

### Reset Rules

`roundWrongAttempts` must reset when:
- a new step loads
- free-play generates a new step
- the user advances to next round
- mode changes
- family changes
- level changes
- scene switches away from the current task

It must not leak across rounds.

This is non-negotiable.

---

## Required Helpers

The implementation should centralize reward logic.

Recommended helpers:

```js
recordWrongAttempt()
getRewardStarsForCurrentRound()
showSuccessStars(stars)
```

### `recordWrongAttempt()`

Responsibilities:
- increment `roundWrongAttempts` by `1`
- do nothing else

Do not scatter ad-hoc `roundWrongAttempts++` everywhere if avoidable.

### `getRewardStarsForCurrentRound()`

Responsibilities:
- return `3`, `2`, or `1` based on current round state only

### `showSuccessStars(stars)`

Responsibilities:
- render the star reward overlay
- replace the current celebration emoji behavior

---

## Visual Design

### Replace, Do Not Stack

The star reward replaces the celebration emoji.

Do not show:
- emoji plus stars
- confetti plus stars
- two independent reward overlays

There should be exactly one success reward overlay: stars.

### Star Display Rules

Always render a 3-star row.

Meaning:
- earned stars are filled/highlighted
- unearned stars are still visible but subdued

This is preferred over rendering only 1 or 2 star icons, because it makes the score legible at a glance.

### Recommended appearance

- centered on the board in the same general reward region as the current emoji
- 3 stars in a horizontal row
- earned stars:
  - warm gold fill
  - slightly stronger scale/pop
- unearned stars:
  - pale/desaturated fill
  - lower opacity

### Recommended timing

- appear immediately after success
- stay readable for about `900ms` to `1200ms`
- fade out cleanly

### Motion

If reduced motion is **not** requested:
- subtle staggered pop is good
- do not make the reward slower or heavier than the current emoji overlay

If `prefers-reduced-motion: reduce`:
- render stars statically
- fade or remove without flourish

### Pointer behavior

Reward overlay must not block the board.

Use:
- `pointer-events: none`

---

## Accessibility / Localization

### Accessibility

The reward should be understandable beyond pure visuals.

Recommended implementation:
- add a small hidden `aria-live="polite"` reward announcer
- announce:
  - `3 stars!`
  - `2 stars!`
  - `1 star!`

This should not replace the existing pedagogic success feedback text.

### Localization

Add EN/PL keys for reward announcement strings if an announcer is implemented.

Recommended keys:
- `reward3`
- `reward2`
- `reward1`

Example text:
- EN:
  - `3 stars!`
  - `2 stars!`
  - `1 star!`
- PL:
  - `3 gwiazdki!`
  - `2 gwiazdki!`
  - `1 gwiazdka!`

Visible on-board stars themselves do not require visible text labels.

---

## Integration With Existing Success Flow

Current success path:
- round completes
- `onSuccess()` updates progress and feedback
- `showSuccessCelebration()` renders emoji overlay

New required behavior:
- `onSuccess()` computes stars from `roundWrongAttempts`
- `onSuccess()` stores the result
- `onSuccess()` calls star overlay renderer instead of emoji renderer

The existing success feedback text should remain.

Do not weaken:
- step-specific feedback
- progress updates
- next-button enablement

---

## Required Incorrect-Path Wiring

The implementing agent must wire `recordWrongAttempt()` into all current judged-wrong paths.

At minimum verify wiring in:
- `Compare`
- `Match`
- `Place`
- `Repair`
- `Add`
- `Subtract`
- `Multiply`
- `Divide`

Do not wire it into:
- hover handlers
- touch-preview handlers
- drag move handlers
- passive scene changes
- `Build` constructive clicks in current architecture

---

## Acceptance Criteria

1. Correct on first judged try shows `3` highlighted stars.
2. One wrong judged try before success shows `2` highlighted stars.
3. Two or more wrong judged tries before success show `1` highlighted star.
4. Reward replaces the celebration emoji.
5. Reward does not stack with old emoji or confetti.
6. Wrong-attempt count resets cleanly on every new round.
7. Wrong-attempt count does not leak across levels, modes, families, or scenes.
8. `Build` does not get unfairly downgraded for constructive exploration.
9. `Place` wrong-drop counts as wrong attempt, but cancel/outside-band release does not.
10. `Repair` wrong identify and wrong fix both count.
11. Prediction/estimate scaffolds do not reduce stars in this pass.
12. Reward overlay does not block interaction.
13. EN/PL remain complete if accessibility strings are added.

---

## Rejection Conditions

Reject the implementation if any of the following are true:

1. The old celebration emoji still appears.
2. Stars and emoji both appear.
3. Wrong-attempt count leaks into the next round.
4. Hover, drag, or touch-preview increments attempt count.
5. `Build` loses stars because the child clicked intermediate constructive states.
6. `Place` cancel/outside-band release reduces stars.
7. Estimate/prediction screens reduce stars.
8. A correct first judged answer can show fewer than `3` stars.
9. The app sometimes shows only 1 or 2 star icons instead of a consistent 3-star row with earned/unearned states.
10. Reward overlay blocks taps/clicks.

---

## Required Verification

The implementing agent must verify at minimum:

### Global

1. `npm run code-review -- fractions/index.html`
2. no Console errors during reward flow

### Reward mapping

3. first judged-correct try -> `3` stars
4. one judged wrong before success -> `2` stars
5. two judged wrongs before success -> `1` star

### Mode checks

6. `Compare`: wrong choice then correct choice -> `2` stars
7. `Match`: wrong pair then correct completion -> downgraded stars
8. `Place`: wrong drop then correct drop -> downgraded stars
9. `Place`: cancel outside band then correct drop -> still `3` stars
10. `Repair`: wrong identify or wrong fix lowers stars correctly
11. `Add` / `Subtract` / `Multiply` / `Divide`: wrong answer then correct answer lowers stars correctly
12. `Build`: normal constructive solve still gives `3` stars unless a future explicit judged-wrong path is introduced

### Reset checks

13. next round resets star state
14. mode switch resets star state
15. level switch resets star state
16. family switch resets star state

### Reduced motion

17. reward remains legible with reduced motion enabled

---

## Implementation Order

Recommended order:

1. add round reward state
2. add helper(s) for wrong-attempt tracking and star mapping
3. replace celebration emoji overlay with star overlay
4. wire wrong-attempt recording into judged-wrong handlers
5. reset reward state correctly on new round / navigation
6. verify representative modes

---

## Summary

This feature is simple in appearance but easy to get wrong semantically.

The central rule is:
- stars reflect **judged wrong attempts before success**
- not raw clicks
- not exploration
- not hover
- not prediction scaffolds

That rule must stay intact across the entire app.

