# Current Paths Lab: Top Navigation Redesign

Reviewed and specified on 2026-05-08.

Target artifact:

- [currentlab.html](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html)

Related documents:

- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)
- [CURRENTLAB_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_REVIEW_2026-05-07.md)
- [CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_MODE_SPEC_2026-05-07.md)
- [CURRENTLAB_INTRO_REVIEW_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_INTRO_REVIEW_2026-05-07.md)

## 0. Status Of This Document

This document is a focused architecture override for the top navigation and high-level control placement in `currentlab.html`.

It does not replace the product science or teaching goals from the master handoff.

It does override the current navigation layout.

If the existing implementation, an older prompt, or a previous structural assumption conflicts with this document on navigation placement, this document wins.

## 1. Problem Statement

The current app exposes four stacked control levels above the board:

1. `Learn / Decide`
2. mode row
3. stage row
4. utility action row with `Intro / Explore / Hint / Next`

This is too much persistent navigation for a child-facing app.

It creates three problems:

1. too many things look equally important,
2. global navigation and local lesson actions are mixed together,
3. the board starts too far below a large control stack.

This is not just a visual issue.

It is an information-architecture issue.

## 2. Design Decision

The top of the app must show only app-scope navigation.

Everything else must move closer to the content it controls.

That means:

1. top navigation is only for:
   - family
   - mode
   - global utilities
2. investigation selection is not top navigation
3. `Explore`, `Hint`, and `Next` are not top navigation
4. intro-active state must suppress normal navigation competition

## 3. Non-Negotiable Outcome

After this redesign:

1. the play area must not have four stacked toolbar rows
2. the top app navigation inside the play area must be one strip only
3. the stage selector must leave the top toolbar completely
4. `Explore`, `Hint`, and `Next` must leave the top toolbar completely
5. the intro button must leave the play-area toolbar completely
6. the child must still be able to discover and switch investigations easily
7. mobile must not reintroduce the same complexity through wrapped multi-row bars

## 4. Scope Model

The redesign must separate controls by scope.

### 4.1 Global App Scope

These are app-wide controls:

- back to `/learn/`
- app title
- language switch
- intro entry

These belong in the header.

### 4.2 Workspace Scope

These answer:

- which family am I in?
- which mode am I in?

These belong in one compact workspace navigation strip above the board.

Allowed controls here:

- `Learn / Decide`
- current family’s mode chips

Not allowed here:

- stage chips
- `Explore`
- `Hint`
- `Next`
- intro step controls

### 4.3 Mode / Investigation Scope

These answer:

- which investigation within this mode am I doing?

This belongs inside the right panel, above the mission body.

Use the term `Investigation` in the UI, not `Level`.

Implementation note:

- the code can still use `stage` internally
- the child-facing label should be `Investigation`

### 4.4 Round / Scene Scope

These answer:

- do I want guided play or explore?
- do I need a hint?
- can I move to the next round?

These belong in a dedicated action area inside the panel, not in the top toolbar.

## 5. Exact Layout

## 5.1 Header

Keep the existing page header, but make it the home for global utilities.

Required header structure:

1. left:
   - back link
   - title
   - subtitle
2. right:
   - `Intro`
   - language toggle

Rules:

1. `Intro` moves here from the play-area toolbar.
2. `Intro` is a global utility, not a lesson action.
3. Header utilities must stay compact and secondary to the title.

## 5.2 Workspace Navigation Strip

Inside the play area, keep exactly one navigation strip above the board.

Required contents:

1. `Learn / Decide` segmented control
2. mode chips for the active family

Structure guidance:

- one visual strip
- one scope
- no second or third toolbar row

Desktop behavior:

- family control on the left
- mode chips on the right or center
- single horizontal band

Mobile behavior:

- still one navigation block
- mode chips may horizontally scroll
- do not create stacked permanent bars for family, modes, and actions

## 5.3 Investigation Section

Create a new panel section at the top of the right panel.

This replaces the top `stageRow`.

Required contents:

1. section label:
   - `Investigation`
2. current investigation title
3. compact investigation chooser
4. progress summary for the current mode

Allowed chooser forms:

1. compact chip rail
2. small horizontal card rail
3. previous / next arrows plus a compact chooser

Preferred form:

- compact chip rail using current stage titles

Rules:

1. this section must stay in the panel
2. it must be visually grouped with mission content, not with app navigation
3. the child must be able to switch investigations directly
4. do not hide investigations behind a dropdown or hamburger

## 5.4 Panel Action Area

Create a dedicated action area in the panel for:

- `Explore`
- `Hint`
- `Next`

This replaces the top utility row.

Required placement:

- bottom of the panel
- sticky or anchored so it stays easy to reach

Required order:

1. `Explore`
2. `Hint`
3. `Next`

Required emphasis:

1. `Next` is the primary action
2. `Hint` is secondary
3. `Explore` reads as a mode/scene toggle, not as a primary submit action

Rules:

1. these actions must not appear in the top toolbar
2. they must stay near mission/feedback content
3. they must remain reachable on mobile without long scrolling

## 5.5 Progress Placement

The separate panel progress block may remain only if it still serves a clear purpose after the new investigation section is added.

Preferred direction:

- merge progress into the new `Investigation` section

Reason:

- progress belongs to the current mode’s investigation flow
- it should not consume a separate full panel section unless necessary

## 6. Intro State Rules

The intro review already established that intro must suppress normal navigation competition.

This redesign must make that explicit.

While intro is active:

1. the workspace navigation strip must be hidden or inert
2. the panel investigation section must be hidden
3. the panel action area must be hidden
4. only intro navigation and intro-specific controls remain active

Do not leave normal app controls visible and clickable behind the intro.

## 7. Mobile Rules

This redesign is not complete unless it improves mobile information density too.

Required mobile behavior:

1. header utilities stay compact
2. the workspace navigation strip does not explode into many permanent rows
3. mode chips may scroll horizontally
4. investigation chips may scroll horizontally inside the panel
5. panel action area stays visible and operable at narrow widths

Rejected mobile outcome:

- the desktop simplification is undone by wrapping into three or four stacked bars on small screens

## 8. Accessibility And Localization Rules

Required:

1. all moved controls must preserve keyboard accessibility
2. focus order must still make sense after relocation
3. visible focus states must remain clear
4. EN and PL labels must remain complete after relocation
5. moved buttons must keep correct aria labels

Additional rule:

- do not leave stale translation wiring that still assumes the old toolbar structure

## 9. Implementation Mapping

The implementing agent should treat the current layout as a placement problem, not a visual polish problem.

Minimum structural changes:

1. remove `stageRow` from the play-area toolbar
2. remove the action-button row from the play-area toolbar
3. move `introBtn` into the page header utility cluster
4. add a new panel section for `Investigation`
5. move `Explore`, `Hint`, and `Next` into a dedicated panel action area
6. update intro enter/exit logic to manage the new navigation sections
7. update translation wiring for all moved controls
8. update mobile CSS so the simplified hierarchy survives narrow widths

Important:

- do not merely hide rows with CSS and keep the old information architecture underneath
- the DOM structure, translation wiring, and intro-state logic must reflect the new architecture

## 10. Explicit Rejection Conditions

Reject the implementation if any of the following remain true:

1. there are still four stacked toolbar rows above the board
2. `stageRow` still exists in the top toolbar
3. `Explore`, `Hint`, or `Next` still live in the top toolbar
4. `Intro` still lives in the play-area toolbar
5. intro mode still leaves normal navigation visibly active behind it
6. mobile recreates multi-row toolbar clutter
7. investigation switching becomes harder to find than before
8. the redesign is achieved only by hiding controls instead of re-scoping them

## 11. Acceptance Checklist

The redesign is correct only if all answers are `yes`:

1. Does the top of the play area show only workspace navigation?
2. Is there exactly one play-area nav strip above the board?
3. Is `Intro` in the header instead of the play-area toolbar?
4. Are investigations selected in the panel instead of the top toolbar?
5. Are `Explore`, `Hint`, and `Next` in a dedicated panel action area?
6. Is progress grouped with investigations or otherwise simplified?
7. Does intro suppress normal navigation competition?
8. Does the layout remain clear at mobile width?
9. Are EN/PL labels still complete after the move?
10. Does the app feel simpler at a glance before the child even interacts?

## 12. Final Instruction

Do not treat this as a styling pass.

This is a navigation architecture correction.

The child should see:

1. where they are in the app,
2. what investigation they are on,
3. what action they can take next,

and each of those must live in a different, appropriate place.
