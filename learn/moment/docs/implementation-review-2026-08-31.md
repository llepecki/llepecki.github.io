# Moment Lab implementation review — manual verification

Date: 2026-08-31  
Status: release hold until the checks below are completed

## Purpose

This document contains only findings that cannot be established reliably by
the automated Moment Lab quality gates. Deterministic audit findings have been
encoded directly in `tools/moment-dom-check.mjs` and
`tools/moment-layout-check.mjs`; they are intentionally not duplicated here.

Run the complete automated suite before starting this review:

```bash
npm run code-review -- moment/index.html
npm run moment-rules-check
npm run moment-dom-check
npm run moment-layout-check
```

Do not treat an automated accessibility pass as a substitute for the checks
below.

## M1. Real screen-reader traversal has not been completed

### Why this remains manual

DOM assertions can verify names, roles, states, focus targets, and live-region
content. They cannot prove how the complete interaction sequence is announced
by an actual screen reader and browser combination.

### Required review

Test with keyboard only and at least one current desktop screen-reader/browser
combination. VoiceOver with Safari on macOS is acceptable; NVDA with Chrome or
Firefox on Windows is also acceptable. Repeat the language-sensitive parts in
both English and Polish.

Traverse these flows:

1. Guide steps 1, 5, 8, and 9, including both Step 5 reveals.
2. Explore with one force, then two forces, including force selection and every
   slider/stepper.
3. One incorrect and one correct Balance attempt.
4. One Predict answer and its reveal.
5. The result wash, dismissal, summary, and language switching.

Pass only if:

- every control announces an understandable name, role, and current state;
- revealed distance, moment, feedback, and score changes are announced once;
- focus never moves to hidden or visually covered content;
- the result wash is announced as one named modal interaction and traps focus
  until dismissal;
- English and Polish announcements contain no mixed-language fragments;
- the user can finish every flow without pointer input.

Record the screen reader, browser, operating-system versions, language, and any
failed step in the implementation handoff.

## M2. Child comprehension and interface simplicity have not been validated

### Why this remains manual

Layout measurements can prevent clipping, undersized targets, and known cases
of oversized controls. They cannot establish whether a child notices the
scientific relationship, understands the wording, or is distracted by the
interface.

### Required review

Run short, non-leading sessions with at least three children from the target
age range of 7–10. Include both the 7–8 and 9–10 ranges; include at least one
English and one Polish session when both audiences are available.

Ask each child to:

1. Complete the Guide without being told which control to choose.
2. Explain what changes the turning effect of a force.
3. Identify the pivot and the perpendicular distance in Guide Step 5.
4. Solve one Balance mission and one Predict mission.
5. Freely change a force in Explore and explain the observed result.

Use neutral prompts such as “What do you think this does?” Do not teach the
answer during the observation.

Pass only if children can find the primary actions, distinguish moment of force
from force and momentum, and use force strength plus perpendicular distance in
their explanations. Treat any repeated navigation blockage, misleading term,
or attention drawn primarily to interface chrome as a design finding. If the
same problem occurs for two participants, revise the design or wording before
release and repeat the affected task.
