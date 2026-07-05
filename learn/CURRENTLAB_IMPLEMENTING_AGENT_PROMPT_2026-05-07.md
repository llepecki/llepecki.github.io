# Current Paths Lab: Implementing Agent Prompt

Copy-paste the prompt below to the implementing agent.

---

You are the implementing agent for a new single-file learning app in this repo.

Your canonical product/design specification is:

- [CURRENTLAB_MASTER_HANDOFF_2026-05-07.md](/Users/llepecki/Projects/llepecki.github.io/learn/CURRENTLAB_MASTER_HANDOFF_2026-05-07.md)

You must also use these local references:

- [fractions.html](/Users/llepecki/Projects/llepecki.github.io/learn/fractions.html)
- [feedbacktank.html](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html)
- [STYLE.md](/Users/llepecki/Projects/llepecki.github.io/learn/STYLE.md)
- [package.json](/Users/llepecki/Projects/llepecki.github.io/learn/package.json)

Follow the master handoff exactly. Do not reinterpret the product direction. Do not weaken the scientific claims. Do not collapse the app into a quiz, a text lesson, or a decorative animation.

## 1. Non-Negotiable Rules

1. The master handoff is the source of truth.
2. If you find tension between your preference and the handoff, the handoff wins.
3. If you believe the handoff is internally inconsistent or scientifically risky, stop, identify the exact section, and ask before changing intent.
4. Do not start by coding blindly. Read the handoff and references first.
5. Do not implement placeholder modes, fake progression, or shallow wrappers that only rename the same mechanic.
6. The final product must be a single-file app named `currentlab.html` unless the user explicitly changes the filename.
7. The app must follow the repo’s single-file pattern: HTML + inline CSS + inline JavaScript in an IIFE.
8. The board must do most of the teaching. The panel supports it.
9. The app must preserve scientific honesty:
   - never teach that `DC` cannot change voltage
   - never teach that `AC` is always better
   - never blur `Voltage`, `Current`, `Power`, and `Loss`
10. The final implementation must include:
   - `Learn` and `Decide`
   - `Flow`, `Send`, `Boost`, `Pick`, `Build`
   - `Level 1-5`
   - `Explore`, `Hint`, `Next`
   - EN/PL localization
   - mobile reflow
   - reduced-motion behavior
   - keyboard accessibility
11. Every `mode x level` slice must contain real authored content, not just free play.
12. Hints must be two-stage only.
13. The visual style must follow the master handoff’s sections `10.1` through `10.12`. Do not drift into generic “tech app” styling.

## 2. Required Working Method

Work in two phases:

1. implementation plan
2. implementation

You must complete phase 1 before phase 2.

Unless blocked by ambiguity that the repo cannot answer, do not stop after the plan. Present the plan, then proceed directly into implementation.

## 3. Phase 1: Implementation Plan

Before editing files, do the following in order:

1. Read the master handoff.
2. Read the structural references in `fractions.html` and `feedbacktank.html`.
3. Read `STYLE.md`.
4. Inspect `package.json` so you know the available verification command.
5. Inspect the current git status so you do not overwrite unrelated work.

Then produce a concise but strict implementation plan that includes all of the following:

### 3.1 Plan Structure

- target file list
- top-level app architecture
- top-level state shape
- rendering primitives
- authored-content data model
- localization structure
- milestone order
- verification strategy
- known risks

### 3.2 Required Plan Content

Your plan must explicitly state:

1. how `currentlab.html` will be structured
2. how you will encode `family`, `mode`, `level`, `scene`, `mission`, `explore`, `sim`, `ui`, and `locale`
3. how the five modes will avoid sharing one fake underlying mechanic
4. how the board primitives will be reused across modes
5. how authored scenarios will be stored data-first rather than buried in conditionals
6. how EN/PL strings will be organized
7. how reduced motion will preserve meaning
8. how mobile reflow will work at `375px`
9. how you will enforce the scientific constraints during implementation
10. how you will verify each milestone against the handoff’s rejection conditions

### 3.3 Plan Format

Your plan must be organized by milestone and must map back to the handoff.

Use this exact milestone order unless you find a concrete repo-level reason you cannot:

1. shell, layout, and state model
2. `Learn` family and level system
3. `Flow`
4. `Send`
5. `Boost`
6. `Decide` family shell
7. `Pick`
8. `Build`
9. `Explore`
10. mobile, localization, accessibility, and polish

### 3.4 Planning Constraints

- Do not write vague statements like “set up the structure.”
- Do not say “polish later” unless you precisely name what is deferred.
- Do not claim a mode is done until its authored rounds, hints, readouts, and feedback logic are actually present.
- Do not move mobile, localization, or accessibility out of scope.

## 4. Phase 2: Implementation

After presenting the plan, implement it.

Proceed milestone by milestone in the exact order above.

At each milestone:

1. make the smallest complete set of changes that produces a real vertical slice
2. keep the app runnable
3. verify the milestone against the handoff before moving on

## 5. Required Implementation Constraints

### 5.1 Architecture

- Build `currentlab.html` as a single-file app.
- Use inline CSS and inline JavaScript in an IIFE.
- Keep state explicit and centralized.
- Keep authored content data-driven.
- Prefer reusable render helpers over duplicated per-mode drawing code.

### 5.2 Interaction Integrity

- Every mode must have its own real interaction model.
- `Flow` cannot be only a waveform view.
- `Send` must visibly separate `Voltage`, `Current`, `Useful Power`, and `Wire Heat Loss`.
- `Boost` must visibly teach why voltage conversion mattered.
- `Pick` must include correct `DC` and `Hybrid` answers.
- `Build` must evaluate route quality, not only whether a load turns on.

### 5.3 Scientific Integrity

You must preserve all scientific rules in the master handoff.

In particular:

- simple transformers work directly with changing current
- higher voltage can reduce current for the same power
- lower current reduces resistive line loss
- batteries and many electronics use `DC`
- long or undersea links can favor `HVDC`

You must not encode logic or text that implies:

- `DC` cannot change voltage
- all plugged-in devices internally use `AC`
- `AC` is universally superior

### 5.4 Product Integrity

- The board must remain the primary teaching surface.
- The side panel must not leak answers too early.
- `Explore` must be valuable but must not replace authored teaching.
- `Level 5` must become harder through reasoning, not just more numbers.

### 5.5 Visual Integrity

Follow the visual direction in the master handoff, especially:

- calm lab tone
- light-theme base
- distinct `AC` and `DC` color plus shape language
- subtle depth
- meaningful motion
- no noisy electricity clichés

Do not improvise a different art direction.

### 5.6 Accessibility And Localization

- All interactive controls must be keyboard reachable.
- Focus states must be visible.
- Motion reductions must preserve meaning.
- EN and PL must both be complete.
- Do not hard-code English strings into authored content.

## 6. Self-Correction Gates

Before calling any milestone complete, compare your work against these questions:

1. Did I implement a real new interaction, or just rename an old one?
2. Is the board teaching the idea, or is the panel explaining around a weak board?
3. Are `Voltage`, `Current`, `Power`, and `Loss` visibly separate?
4. Did I accidentally imply `AC` always wins?
5. Did I accidentally imply `DC` cannot change voltage?
6. Is the mode’s Level 5 genuinely more demanding because of reasoning?
7. Is mobile still functional?
8. Are EN and PL both still complete in the changed area?
9. Does reduced motion still communicate the same concept?
10. Would a reviewer reject this milestone under the master handoff’s rejection rules?

If the answer to any of the above is “yes, maybe, or not sure,” fix it before proceeding.

## 7. Mandatory Verification

You must run concrete checks during the work, not only at the end.

### 7.1 Minimum Verification During Implementation

After each major milestone, verify the relevant handoff gates.

At minimum, this means:

- switching families
- switching modes
- switching levels
- checking a representative authored round
- checking a representative hint flow
- checking one EN and one PL render in the changed area
- checking one mobile-width render when layout changes

### 7.2 Final Verification

Before declaring the work complete, you must:

1. run the full release-readiness checks from the master handoff
2. run:

```bash
npm run code-review -- currentlab.html
```

If the code-review command reports issues, fix them and rerun it before finishing.

## 8. Progress Reporting Format

When you report progress, use this strict format:

1. milestone number and title
2. files changed
3. what is complete
4. what is intentionally incomplete
5. what verification you actually ran
6. what risks remain

Do not report with vague phrases like:

- “the structure is there”
- “most of it is done”
- “the rest is polish”

## 9. Final Response Format

When the implementation is complete, your final response must include:

1. a concise summary of the delivered app
2. the changed file list
3. the verification you actually ran
4. any remaining limitations, if any
5. a direct statement whether `npm run code-review -- currentlab.html` passed

## 10. Stop Conditions

Stop and ask before proceeding only if one of these is true:

1. the master handoff is internally contradictory in a way that blocks implementation
2. the repo contains unexpected conflicting edits in the same target area
3. the required single-file approach becomes impossible for a concrete technical reason
4. a scientific simplification in the handoff appears unsafe to implement as written

Otherwise, continue through plan and implementation without waiting.

## 11. Final Instruction

Do not optimize for speed, superficial breadth, or flashy visuals.

Optimize for:

- faithful execution of the master handoff
- real interaction integrity
- scientific honesty
- visible causal learning
- strong progression
- disciplined verification

Your job is not to invent a different app.

Your job is to implement the app described in the master handoff and prove that it satisfies the handoff’s gates.

---
