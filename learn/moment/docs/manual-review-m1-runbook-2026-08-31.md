# M1 runbook — screen-reader traversal

Companion to `implementation-review-2026-08-31.md`, finding M1. A sighted
operator runs this with a real screen reader and records the outcome in the
results tables at the bottom. The automated gates must be green before this
session starts (`npm run code-review -- moment/index.html`,
`npm run moment-rules-check`, `npm run moment-dom-check`,
`npm run moment-layout-check`).

Expected-announcement strings below are quoted verbatim from the app's I18N
tables so the operator can tell a wording mismatch from ordinary screen-reader
verbosity. A screen reader may add role and state words ("button", "pressed",
"dialog") and may voice glyphs; that is not a failure. A failure is: missing
content, doubled content, mixed-language content, focus landing on covered or
hidden controls, or a flow that cannot be finished without a pointer.

## Setup

1. Serve the site locally (`bundle exec jekyll serve` from the repo root) or
   any static server over `learn/`; open `/learn/moment/` in the test browser.
2. Screen reader on (VoiceOver: Cmd+F5 with Safari; or NVDA with
   Chrome/Firefox on Windows).
3. Fresh first-visit state: clear site data, or run once in a private window.
4. Run the full pass twice: once with the browser language English, once after
   switching the app to Polish with the PL/EN button (top right).
5. Keyboard only — do not touch the pointer except where a step says so.

## Known voicing watch-list (log verbosity, judge disruption)

- The rotation phrases embed arrow glyphs: "Clockwise ↷", "↶ Counterclockwise"
  ("Zgodnie z ruchem wskazówek zegara ↷", "↶ Przeciwnie do ruchu wskazówek
  zegara"). Readers may voice the arrow or skip it. Fail only if it obscures
  the words.
- Stepper names end in a sign: "Force strength −", "Force strength +",
  "Position −/+", "Direction −/+". "minus"/"plus" voicing is expected.
- Guide step 5 card values are two short lines per card, e.g. "d⊥ = 1.5 m"
  then "3 N·m" (card A: "d⊥ = 0" then "M = 0"); both lines are part of the
  card's description. Note how "⊥" and "·" are voiced; log a finding if the
  values become unintelligible.
- The Polish placement readout embeds a capitalized direction phrase
  mid-sentence ("… Jej moment wynosi 2 N·m, Zgodnie z ruchem wskazówek zegara
  ↷."). The capital is inaudible; fail only on real confusion.

## Flow 1 — Guide steps 1, 5, 8, 9

Focus topology (matters for every step below): in DOM order the beam canvas
and the on-stage Guide controls (Replay, the answer cards, the step-8 spot
and check buttons) come BEFORE the panel, and the panel's "Exit guide" /
"Zamknij przewodnik" button comes before the step heading. So from the step
heading, Shift+Tab moves to "Exit guide" and then into the on-stage controls;
Tab moves forward to the "Previous"/"Next" ("Wstecz"/"Dalej") step buttons.
Arrow Left/Right step navigation is deliberately inactive while focus is on
an on-stage Guide control, and on step 8 the arrows move the balance
placement while the canvas has focus. Every step change moves focus to the
new step's heading — from there plain Arrow Right/Left steps again, so the
pattern for advancing out of an on-stage control is: Tab to the "Next" /
"Dalej" step button, activate it once, then use Arrow Right from the heading
for the remaining steps.

1. First visit: the Guide opens itself; focus is on the step heading.
   Expect (EN): "A Push Can Turn an Object." then both commentary sentences.
   Expect (PL): "Pchnięcie może obrócić przedmiot." then both sentences.
2. Shift+Tab twice from the heading — the first stop is "Exit guide" /
   "Zamknij przewodnik", the second is "Replay" / "Powtórz" — and activate
   Replay; nothing else should be announced beyond the scene replaying.
3. Focus is still on the on-stage Replay control, so arrow-step navigation
   is inactive here by design. Tab forward to the "Next" / "Dalej" step
   button and activate it once — focus moves to the step 2 heading — then
   press Arrow Right three times to reach step 5 (each step announces its
   title and two commentary sentences once).
4. Step 5, question 1 — expect "Which force makes zero moment?" / "Która siła
   daje moment równy zero?". The cards sit on the stage BEFORE the heading in
   DOM order: Shift+Tab past "Exit guide" reaches them in reverse order —
   card C first, then B, then A — each announcing as "Force A" / "Force B" /
   "Force C" ("Siła A/B/C"), role button.
5. Pick card B (wrong). The retry copy is announced once through the live
   region: "This force's line does not pass through the pivot. Look for the
   line that crosses the pivot." / "Linia działania tej siły nie przechodzi
   przez punkt podparcia. Znajdź linię, która przechodzi przez ten punkt."
   Focus must stay in the cards.
6. Pick card A (correct). The new question is announced once: "Which force
   makes the largest moment?" / "Która siła daje największy moment?"; focus
   stays on card A; card A now also describes its revealed values — the description carries
   both lines: "d⊥ = 0" and "M = 0".
7. Pick card C. All three cards now describe their d⊥ and moment values —
   both lines each; verify card C's description contains "d⊥ = 3.0 m" AND
   "6 N·m" (a description that stops after the distance is a failure).
8. Focus is on card C (an on-stage control), so Tab forward to the "Next" /
   "Dalej" step button, activate it once (focus moves to the step 6
   heading), then press Arrow Right twice to reach step 8. Expect the prompt "Place the movable
   force so the clockwise and counterclockwise moments are equal." / "Ustaw
   ruchomą siłę tak, aby momenty zgodne i przeciwne do ruchu wskazówek zegara
   były równe."
9. Shift+Tab from the step heading past "Exit guide" and the two spot
   buttons ("Next spot", "Previous spot") to the beam canvas — four stops,
   because "Check balance" / "Sprawdź równowagę" is disabled (and skipped)
   until a placement exists — then press Right Arrow once. Expect the
   placement readout once: "Movable force placed 1 metre right of pivot. Its
   moment is 2 N·m Clockwise ↷." / "Ruchoma siła jest ustawiona 1 metr na
   prawo od punktu podparcia. Jej moment wynosi 2 N·m, Zgodnie z ruchem
   wskazówek zegara ↷."
10. Press Enter (wrong placement). After the reveal, expect exactly one
    feedback announcement containing, in order: "Counterclockwise total: 6
    N·m. Clockwise total: 2 N·m. Net moment: +4 N·m. Result:
    counterclockwise initial turn." then "Not balanced yet. Adjust the
    movable force and try again." then "The counterclockwise moment is
    larger, so the initial turn is counterclockwise." (PL equivalents from
    the same keys.)
11. Right Arrow twice (to +3), Enter. Expect the totals sentence with "6 N·m"
    on both sides and "The moments balance." / "Momenty się równoważą."
12. Focus is on the canvas, where arrows move the placement on step 8, so
    Tab forward to the "Next" / "Dalej" step button and activate it to reach
    step 9; after the reveal settles, Tab to
    "Start exploring" / "Zacznij eksperyment" and "Start game" /
    "Zacznij grę". Activate "Start exploring" — focus lands on the
    experiment canvas.

## Flow 2 — Explore, one and two forces

1. With focus on the canvas, press Right Arrow once. Within about half a
   second expect one full summary, exactly this text (EN):
   "F1. Force strength: 2 newtons. Direction: down (270 degrees).
   Application point: 3.5 metres right of pivot. Moment size: 7 newton
   metres; direction: Clockwise ↷. Counterclockwise total: 0 newton metres.
   Clockwise total: 7 newton metres. Net moment: minus 7 newton metres.
   Initial turn: clockwise ↷."
   (PL): "F1. Wartość siły: 2 niutony. Kierunek: w dół (270 stopni). Punkt
   przyłożenia: 3,5 metra na prawo od punktu podparcia. Wartość momentu tej
   siły: 7 niutonometrów; zwrot: Zgodnie z ruchem wskazówek zegara ↷. …"
   It must be announced once, not twice.
2. Press Left Arrow to return to 3 m and confirm a single updated summary
   ("6 newton metres" / "6 niutonometrów").
3. Tab through the panel: "One force" / "Two forces" buttons must report a
   pressed/selected state; activate "Two forces" and confirm the state flips.
4. F1/F2 selector: both buttons report state; select F2.
5. Visit each slider ("Force strength", "Position", "Direction" /
   "Wartość siły", "Położenie", "Kierunek") — name, role slider, and current
   value must be announced; adjust each with arrows and hear the value change.
6. Visit one stepper pair and activate both; each press updates the value and
   later yields a single summary announcement.
7. "Reset experiment" / "Zresetuj eksperyment" resets and announces the
   restored summary once.

## Flow 3 — Balance mission (one wrong, one correct attempt)

1. Panel → "Game" (state exposed), then "Start 8 rounds" / "Zacznij 8 rund".
2. Expect the mission announcement: "Balance the moments" + "Place the
   movable force on an empty highlighted spot." / "Zrównoważ momenty" +
   "Ustaw ruchomą siłę w pustym podświetlonym miejscu." Focus is on the beam.
3. Place with Left/Right arrows (each placement announces the readout once),
   deliberately wrong, press Enter. One feedback announcement: numeric totals
   sentence, "Not balanced yet…", and the larger-direction sentence, matching
   the visible feedback text exactly.
4. Correct the placement (Position row buttons "Previous spot" /
   "Next spot" — names must be announced), press "Check balance" /
   "Sprawdź równowagę". Expect totals + "The moments balance." + the
   relationship sentence; focus lands on "Next" / "Dalej".
5. Confirm the round HUD ("Round 2 of 8…" / "Runda 2 z 8…") is reachable.

## Flow 4 — Predict answer and reveal

1. Leave the game (mode "Explore" → the confirmation question "Leave this
   game? Current progress will be lost." is announced once through the live
   region and repeated as the description of the focused "Stay" button →
   choose "Leave game"), then Game → "Predict" → Start.
2. Focus lands on the first answer. The three answers must announce their
   full accessible names: "Counterclockwise initial turn", "Rotationally
   balanced about the pivot", "Clockwise initial turn" (PL: "Początkowy obrót
   przeciwny do ruchu wskazówek zegara", "Równowaga obrotowa względem punktu
   podparcia", "Początkowy obrót zgodny z ruchem wskazówek zegara").
3. Activate one answer with Enter. During the reveal nothing is announced;
   when it completes, one feedback announcement (totals sentence + "Correct.
   …" / "The correct result is … ." — "Dobrze. …" / "Poprawny wynik to … .").
   The chosen answer reports a pressed state; all three are disabled.
4. Confirm a second answer cannot be given; "Next" is focused.

## Flow 5 — Wash, summary, language

1. Finish the remaining rounds (any answers). After round 8, the result wash
   appears: it must announce as a dialog named "Game complete" /
   "Koniec gry" with the score line and the continue hint.
2. Press Tab and Shift+Tab several times: focus must stay on the wash; no
   background control may be reached.
3. Press Escape. Focus lands on the "Game complete" / "Koniec gry" heading;
   read the summary rows (first-try count, accuracy, tip) and reach
   "Play again" / "Zagraj ponownie" and "Change game" / "Zmień grę".
4. Activate the language button (announced "Switch language" /
   "Zmień język", showing the other language code). Every summary string
   re-reads in the new language with no mixed-language fragments; the score
   is unchanged.

## Results

Record one row per session:

| Date | Screen reader + version | Browser + version | OS + version | Language | Result |
| ---- | ----------------------- | ----------------- | ------------ | -------- | ------ |
|      |                         |                   |              | EN       |        |
|      |                         |                   |              | PL       |        |

For each failed step record: flow number, step number, what was announced (or
not), and what was expected. File the failures back into the implementation
handoff; the M1 hold lifts only when both language passes complete with no
open failures.
