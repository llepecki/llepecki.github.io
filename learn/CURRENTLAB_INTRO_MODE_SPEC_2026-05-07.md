# Current Paths Lab: Intro Mode Spec

## 0. Purpose

This spec defines an `Intro` mode for [`currentlab.html`](/Users/llepecki/Projects/llepecki.github.io/learn/currentlab.html), inspired by the staged introduction flow in [`feedbacktank.html`](/Users/llepecki/Projects/llepecki.github.io/learn/feedbacktank.html).

The goal is not to copy the water-tank intro mechanically.

The goal is to give `Current Paths Lab` the same strength:

- one calm onboarding surface
- one idea at a time
- visible board-first explanation
- very small, digestible interactions
- a clear bridge into the main app

This app now uses mode-specific stages rather than a global level ladder. The intro must fit that architecture.

It should sit above the regular app, not compete with it.

## 1. Product Goal

The intro should help a child answer these questions before they enter the main app:

1. What is a source, a wire, and a load?
2. What is the difference between `DC` and `AC`?
3. Why does voltage matter for sending power far?
4. Why did transformers help `AC` grids so much?
5. Why do many modern devices still use `DC`?
6. Why is the real-world answer often `Hybrid`?
7. Which mode should I open next if I want to explore more?

The intro is successful if the child can enter the main app with the right mental map.

It is not supposed to finish the whole lesson.

## 2. Structural Model

The intro should behave much more like `feedbacktank.html` than like a normal mission sequence.

### 2.1 Entry

Add a dedicated `Intro` button in the toolbar or header.

Recommended:

- place it in the utility row near `Explore / Hint / Next`
- use a lightbulb or compass-style icon
- label it clearly in EN/PL

### 2.2 Launch Behavior

Recommended behavior:

1. first visit:
   - auto-open intro
   - allow immediate skip
2. later visits:
   - do not auto-open
   - keep `Intro` available as a normal button

Persist:

- `introSeen`

### 2.3 Active Intro State

When intro is active:

- hide or suspend normal mission progression
- hide normal right-panel sections
- show a dedicated intro panel
- keep the main board visible
- render an intro-specific board scene

Do not try to squeeze intro text into the normal mission panel.

### 2.4 Exit

The intro panel should have:

- `Back` / `Exit`
- previous step
- next step
- step counter

On exit:

- restore the normal app state
- return to the previously active family/mode/stage

## 3. UI Structure

### 3.1 Dedicated Intro Panel

Use the same broad layout idea as `feedbacktank.html`:

- intro title
- step title
- short commentary paragraph
- prev / next controls
- small intro-specific controls area

Do not show the normal:

- mission
- controls
- meters
- why-it-works
- progress

while intro is open.

### 3.2 Board Behavior

The board remains the main teaching surface.

For intro:

- use one simplified scene per step
- highlight only the relevant parts
- dim everything else
- avoid busy multi-mode layouts

### 3.3 Intro Controls

Like `feedbacktank.html`, some steps should expose one tiny control when helpful.

Examples:

- toggle `AC / DC`
- drag voltage slider
- toggle `transformer / converter`

Do not expose full app controls during intro.

## 4. Implementation Architecture

### 4.1 State

Add:

- `introActive: boolean`
- `introStep: number`
- `introSeen: boolean`

Optional:

- `introReturnState`

This should preserve:

- `family`
- `mode`
- `stage`
- `scene`

### 4.2 Data Model

Create a dedicated `INTRO_STEPS` data structure.

Each step should specify:

- `id`
- `title`
- `title_pl`
- `commentary`
- `commentary_pl`
- `scene`
- `visibleGroups`
- `controlType`
- `initialState`
- optional `cta`

Do not bury intro text and behavior in a long chain of hard-coded conditionals.

### 4.3 Rendering

Recommended approach:

- add `renderIntroBoard()`
- branch in `renderBoard()`:
  - if `introActive`, render intro board
  - else render normal mode board

This is cleaner than trying to reuse the exact same mission renderers for onboarding.

### 4.4 Controls

Recommended functions:

- `enterIntro()`
- `exitIntro()`
- `setIntroStep(n)`
- `renderIntroControls()`
- `applyIntroTranslations()`

### 4.5 Localization

All intro strings must exist in:

- EN
- PL

Do not ship English-only intro labels.

## 5. Intro Board Primitives

To keep implementation manageable, build the intro from a small set of reusable pieces:

- simple circuit loop
- source block
- load block
- charge markers
- waveform strip
- long-distance route
- heat/loss overlay
- transformer block
- converter block
- home/device mini-chain
- callout label
- dimmed background layer

The intro should reuse the app’s main visual language, not invent a separate one.

## 6. Exact Step Sequence

Use `9` steps.

That is enough to create a proper ramp without becoming a lesson wall.

## 6.1 Step 1: A Simple Circuit

Title:

- `A Loop`

Purpose:

- introduce source, wire, and load

Board:

- one battery
- one lamp
- one complete loop
- no AC/DC comparison yet

Commentary:

- electricity needs a complete path
- the source pushes
- the lamp uses the delivered energy

Controls:

- none

Child takeaway:

- “Electricity needs a loop.”

## 6.2 Step 2: One-Way vs Back-and-Forth

Title:

- `DC And AC`

Purpose:

- show the basic difference

Board:

- split view
- battery circuit on one side
- wall-outlet circuit on the other
- charge markers animated
- waveform strips visible

Commentary:

- `DC` goes one way
- `AC` changes direction

Controls:

- small `Play / Pause` or static step-through if reduced motion

Child takeaway:

- “DC goes one way. AC goes back and forth.”

## 6.3 Step 3: Sources Decide The Type

Title:

- `Look At The Source`

Purpose:

- connect current type to source type

Board:

- source strip or mini-cards:
  - battery
  - wall outlet
  - solar panel
  - generator
- one active circuit preview

Commentary:

- batteries and solar panels naturally give `DC`
- wall outlets and spinning generators commonly give `AC`

Controls:

- tap a source card to swap the active source

Child takeaway:

- “The source usually tells me which kind of current I am looking at.”

## 6.4 Step 4: Push, Flow, And Power

Title:

- `Push And Flow`

Purpose:

- separate voltage from current

Board:

- one source
- one lamp
- simple meter badges:
  - `Push (Voltage)`
  - `Flow (Current)`
  - `Useful Power`

Commentary:

- voltage is the push
- current is the flow
- power depends on both

Controls:

- small voltage slider with one locked power preset

Implementation note:

- keep the math extremely simple here
- the step should teach distinction, not optimization

Child takeaway:

- “Voltage and current are different things.”

## 6.5 Step 5: Why High Voltage Helps

Title:

- `Sending Power Far`

Purpose:

- show losses on a long wire

Board:

- generator on the left
- town or lamp on the right
- long line between them
- heat glow on the wire
- useful/lost energy bar

Commentary:

- if the same power travels with too much current, the wire heats up
- higher voltage can lower current for the same power

Controls:

- one voltage slider

Board reaction:

- current meter drops as voltage rises
- heat/loss visibly drops

Child takeaway:

- “Higher voltage can help power travel farther with less waste.”

## 6.6 Step 6: Transformers And AC

Title:

- `Step Up, Step Down`

Purpose:

- show why `AC` helped grids

Board:

- generator
- step-up transformer
- long line
- step-down transformer
- homes

Commentary:

- transformers can raise or lower voltage
- that made long-distance AC transmission practical

Controls:

- toggle:
  - `No transformers`
  - `With transformers`

Optional:

- step highlight button that emphasizes each segment in order

Child takeaway:

- “Transformers made AC grids very useful.”

## 6.7 Step 7: DC Can Change Too

Title:

- `Converters For DC`

Purpose:

- prevent the wrong conclusion that `DC` cannot change voltage

Board:

- battery or solar source
- DC-DC converter
- DC line
- load
- alternate mini-chain with inverter

Commentary:

- a plain transformer needs changing current
- but modern converters can also change `DC`

Controls:

- toggle:
  - `Plain transformer`
  - `DC-DC converter`
  - optional `Inverter`

Child takeaway:

- “DC can change too, just with different devices.”

## 6.8 Step 8: The Real World Is Hybrid

Title:

- `Both Together`

Purpose:

- show the modern mixed answer

Board:

- one home mini-scene
- one phone charger chain
- one solar-to-grid chain
- one undersea HVDC mini-link

Commentary:

- many real systems use both `AC` and `DC`
- the best answer depends on the job

Controls:

- tap mini-scenes to switch between examples

Child takeaway:

- “AC and DC often work together.”

## 6.9 Step 9: Where To Go Next

Title:

- `Choose Your Path`

Purpose:

- bridge into the main app

Board:

- five large mode cards or callouts:
  - `Flow`
  - `Send`
  - `Boost`
  - `Pick`
  - `Build`

Commentary:

- each mode explores one part of the bigger story

Controls:

- tap a card to exit intro and open that mode

Recommended short blurbs:

- `Flow`: see AC and DC move
- `Send`: watch voltage, current, and losses
- `Boost`: learn transformers and converters
- `Pick`: choose the right type for each job
- `Build`: assemble full electricity routes

Child takeaway:

- “I know what each part of the app is for.”

## 7. Intro Copy Style

Use the same discipline as `feedbacktank.html`:

- short title
- one compact paragraph
- one core idea per step

Do not write textbook mini-essays.

Each step commentary should be:

- `2-4` short sentences
- plain language
- scientifically correct

## 8. Behavioral Rules

### 8.1 Normal App Suspension

While intro is active:

- no mission progress should advance
- `Hint` and `Next` should not operate on mission state
- intro prev/next should be the only progression controls

### 8.2 Intro Controls Scope

Step-specific controls should affect only the intro scene.

They must not permanently mutate the normal mission state.

### 8.3 Reduced Motion

If reduced motion is enabled:

- replace smooth charge animation with arrows or stepped markers
- preserve the meaning of `AC` vs `DC`

## 9. Relationship To Existing Stage Structure

The intro should not replace the stage-based architecture already present in `currentlab.html`.

It should prepare the child for it.

The hierarchy should become:

1. `Intro` optional onboarding
2. `Learn / Decide`
3. mode choice
4. mode-specific stages
5. guided rounds and `Explore`

This is better than forcing the intro to behave like another stage.

## 10. Reviewer Checklist

The intro is correct only if:

1. it explains one idea at a time
2. the board does most of the teaching
3. it does not become a text slideshow
4. it distinguishes `AC` from `DC` clearly
5. it distinguishes voltage from current clearly
6. it explains why high voltage helps transmission
7. it explains that transformers helped `AC`
8. it explains that `DC` can also change voltage with converters
9. it lands on a hybrid modern answer
10. it cleanly hands the child into the main app

## 11. Final Instruction To The Implementing Agent

Do not copy `feedbacktank.html` literally.

Copy its strengths:

- calm step-by-step onboarding
- controlled visual reveal
- simple navigation
- small step-specific interactions
- one strong mental model at a time

But adapt the content to the structure of `Current Paths Lab`, which is:

- multi-mode
- concept-driven
- stage-based
- hybrid in its final message
