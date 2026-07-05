# Implementation Spec: Manual Second Burn for `flipandburn/index.html`

Date: 2026-05-01

Scope: this specification is based on the current `flipandburn/index.html` only. It is intended for the implementing agent. Do not use older local Markdown files as design input.

## Goal

Replace the current auto-solved second burn with a real player-controlled braking burn that is:

- scientifically consistent with the corrected single-line transfer model,
- more interactive than the current "tap when the UI tells you" mechanic,
- not gameable through an explicit auto-answer cue,
- consistent across mouse, touch, and keyboard.

## Why this change is needed

The current implementation is physically much better than the previous one, but the second phase is still weak as gameplay:

1. The game now auto-computes `a2` from flip time.
2. The transit UI exposes the live required braking acceleration.
3. The button becomes visually armed when the live requirement enters the green band.
4. The optimal strategy collapses to: wait for the hint, then tap.

That makes the second burn mostly a reaction prompt, not a decision.

## Design Decision

Implement a **manual second burn**.

The player makes two linked decisions:

1. **When to flip** during the outbound acceleration phase.
2. **How much braking acceleration to apply** after the flip.

This creates a real tradeoff:

- early flip -> lower `v_flip`, longer braking window, gentler `a2`, higher timing sensitivity,
- late flip -> higher `v_flip`, shorter braking window, larger required `a2`, greater crew risk,
- wrong `a2` after flip -> real underburn / overburn miss along the same transfer line.

## Non-Negotiable Physics Constraints

These constraints must remain true after the change.

1. The mission uses **one transfer line** from launch to the original planned intercept point.
2. There is **no retargeted second line**.
3. There is **no simulation-time rescaling** during braking.
4. The player-selected second burn must be resolved with exact 1D constant-acceleration kinematics along that same line.
5. Final hit/miss must be based on actual ship position vs actual planet position at the physical arrival time.

## Current Areas To Replace

The implementing agent should treat these parts of the current file as the primary replacement targets.

1. Auto-solved flip in [flipandburn/index.html](../index.html:2570).
2. Transit button/prompt logic in [flipandburn/index.html](../index.html:2896).
3. Transit burn-meter predictor logic in [flipandburn/index.html](../index.html:3010).
4. Transit animation and live `transitReqAccelG` update in [flipandburn/index.html](../index.html:3604).
5. Current flip-to-decel transition in [flipandburn/index.html](../index.html:3672).

## Required Player Flow

### 1. Prelaunch

No change in concept:

- player chooses launch window,
- player holds ENGINE to select first-burn acceleration `a1`,
- release commits the launch burn.

### 2. Outbound Transit

After launch:

- the ship accelerates along the fixed transfer line,
- the player can press/tap ENGINE at any time to initiate the flip,
- the game must not auto-select the braking acceleration.

Behavior:

- ENGINE remains available during transit for all input methods.
- Do **not** disable mouse/touch while keeping keyboard active.
- Do **not** show a direct "now is correct" cue by arming the button only in the success window.

Prompt guidance:

- acceptable: "Tap ENGINE to flip when ready"
- acceptable: "Needed brake now: X g"
- not acceptable: a UI pattern that effectively says "tap exactly now for the right answer"

### 3. Flip

When the player taps ENGINE during transit:

1. Freeze the outbound state at that simulation instant.
2. Record:
   - `tau_flip`
   - `s_flip`
   - `v_flip`
   - `flipPointPos`
3. Play the short flip animation.
4. After the flip animation, enter a **manual brake-selection state**.

Important:

- Freezing simulation during brake selection is allowed as a UI affordance.
- This is acceptable because the first burn already uses the same abstraction.
- Once the second burn is committed, the subsequent flight must return to a single physical sim clock.

### 4. Second Burn Selection

After the flip animation:

- the player holds ENGINE again to choose braking acceleration `a2`,
- release commits the second burn,
- then the ship enters the physical braking phase.

This state should be explicit in the state machine. Use a clear name such as `burn2` or `brakeBurn`.

## Required Physics Model

### 1. Launch solve stays as it is

Keep the corrected first-leg model:

- solve the fixed transfer line at launch,
- target the future intercept point `rdRef`,
- store:
  - `r0`
  - `u`
  - `L`
  - `rdRef`
  - `T_plan`

Where:

- `T_plan` is the original symmetric arrival time,
- `L = a1 * T_plan^2 / 4`

### 2. Outbound motion before flip

For elapsed outbound sim time `tau`:

- `s_out(tau) = 0.5 * a1 * tau^2`
- `v_out(tau) = a1 * tau`

Ship position:

- `r_ship(tau) = r0 + u * s_out(tau)`

Do not clamp `s_out` to `L`.

If the player waits too long, they must be allowed to create a real late-flip scenario.

### 3. State recorded at flip

At flip time:

- `tau_flip = state.tauSim`
- `s_flip = 0.5 * a1 * tau_flip^2`
- `v_flip = a1 * tau_flip`

Also compute the exact braking acceleration that would stop at the original intercept point:

- `remaining_ref = L - s_flip`
- if `remaining_ref <= 0`, the player has already gone past the reference stop point
- otherwise:
  - `a2_target = v_flip^2 / (2 * remaining_ref)`

`a2_target` is guidance only. It is not auto-committed.

### 4. Manual braking physics after the player picks `a2`

Once the player commits `a2`:

- braking time:
  - `T_brake = v_flip / a2`
- stopping distance from launch along the same line:
  - `s_stop = s_flip + v_flip^2 / (2 * a2)`
- stop point in world coordinates:
  - `r_stop = r0 + u * s_stop`
- physical arrival time:
  - `T_arrive = tau_flip + T_brake`

During braking for elapsed decel time `tb`:

- `s(tb) = s_flip + v_flip * tb - 0.5 * a2 * tb^2`
- `v(tb) = v_flip - a2 * tb`

Ship world position during braking:

- `r_ship(tb) = r0 + u * s(tb)`

Braking ends when:

- `tb >= T_brake`

### 5. Hit / miss evaluation

At committed `a2`, evaluate the destination planet at the actual arrival time:

- `r_planet_arrive = helioPosition(dest, launchSimTime + T_arrive)`

Miss vector:

- `m = r_planet_arrive - r_stop`

Miss distance:

- `missDistance = hypot(m.x, m.y)`

Capture rule:

- keep the current tolerance model as the first implementation pass:
  - `captureTol = max(0.01, 0.02 * L)`
- mission hits only if:
  - `missDistance <= captureTol`

Miss subtype:

- compute against the exact required braking acceleration at flip:
  - `a2_target = v_flip^2 / (2 * (L - s_flip))` when `L - s_flip > 0`
- if `a2 < a2_target`, subtype = `overshoot` / "too gentle"
- if `a2 > a2_target`, subtype = `undershoot` / "too hard"
- if `L - s_flip <= 0`, force a late-flip miss path

This subtype rule is better than basing it only on `T_arrive` relative to `T_plan`.

## Required State Machine

The resulting state machine should be:

- `prelaunch`
- `burn`
- `transit`
- `flipping`
- `burn2` (or equivalent explicit brake-selection state)
- `decel`
- `captured`
- `coasting`
- `result`

Required semantics:

1. `transit`
   - ship accelerates physically
   - player may trigger flip
2. `flipping`
   - short orientation animation
   - no physics advance
3. `burn2`
   - ship and planets remain frozen in sim time
   - player chooses braking acceleration
4. `decel`
   - ship and planets advance on the same physical sim clock

## UI / HUD Requirements

### 1. Transit phase

Keep a live predictor, but do not make it an auto-answer.

Required transit behavior:

- show the current required braking acceleration if the player flipped now:
  - `a_req_now = v_out^2 / (2 * (L - s_out))`
- it may appear on the burn meter or in text
- do not auto-arm the button only when `a_req_now` is in the "good" region
- do not disable click/tap if `a_req_now > METER_MAX_G`

If the current required braking exceeds the meter range:

- still allow flip,
- the subsequent brake selection may simply have no valid capture solution in range.

That is important for fairness and consistency across input methods.

### 2. Second-burn selection meter

The burn meter must become player-controlled again in `burn2`.

Required contents:

- fill = player-selected `a2`
- a narrow target band = braking accelerations that produce a hit within `captureTol`
- fill color continues to indicate crew stress / survivability risk

Important:

- the target band in `burn2` must match the actual hit test,
- do not use a heuristic approximation for the displayed band if the actual pass/fail test is different.

### 3. How to compute the second-burn target band

Use actual physics, not a proxy.

For the fixed `tau_flip`, define:

- `T_arrive(a2) = tau_flip + v_flip / a2`
- `s_stop(a2) = s_flip + v_flip^2 / (2 * a2)`
- `r_stop(a2) = r0 + u * s_stop(a2)`
- `r_planet(a2) = helioPosition(dest, launchSimTime + T_arrive(a2))`
- `miss(a2) = hypot(r_planet(a2) - r_stop(a2))`

Then numerically find the contiguous interval(s) in the burn-meter range where:

- `miss(a2) <= captureTol`

Implementation guidance:

- center the search around `a2_target`,
- search downward and upward for roots of:
  - `miss(a2) - captureTol = 0`
- clip the visible band to the meter's allowed `a2` range
- if no in-range solution exists, show no target band

This is the correct replacement for the current transit miss-marker approximation.

### 4. Prompt text

Recommended prompts:

- transit: "Tap ENGINE to flip when ready"
- burn2: "Hold ENGINE — release on target to brake"
- if no valid capture band exists inside the meter range:
  - "No safe capture burn — best effort only"

Do not keep the current strong answer-reveal pattern where the UI effectively says "tap now."

## Difficulty Tuning

Difficulty should affect execution pressure, not physics.

Recommended:

1. First burn keeps its current difficulty behavior.
2. Second burn uses the real physical target band computed above.
3. Difficulty may change:
   - second-burn fill speed,
   - visual clutter,
   - whether the target band is wide and obvious or narrow and subtle.
4. Difficulty must not move or distort the physical target band itself.

Suggested first pass:

- easy: `burn2` fill speed similar to first burn
- medium: somewhat faster
- hard: clearly faster

## Result Precedence

Keep the corrected precedence logic:

1. If either burn is fatal, final result is `fatal`.
2. Else if `missDistance > captureTol`, final result is `miss`.
3. Else use the burn survivability / speed classification.

`miss` must never overwrite `fatal`.

## Input Consistency Requirements

Mouse, touch, and keyboard must follow the same rules.

Required:

1. If the transit ENGINE action is allowed for keyboard, it must also be allowed for mouse/touch.
2. If the transit ENGINE action is blocked, it must be blocked uniformly for all input methods.
3. The second burn hold/release interaction must work the same way across mouse, touch, and space bar.

## Implementation Notes

These are not optional.

1. Restore an explicit `burn2`-style state object for second-burn input.
2. Do not reintroduce:
   - a second transfer line,
   - `simRatio`,
   - a retargeted decel solver,
   - a heuristic displayed success window that disagrees with the actual hit test.
3. Keep the existing corrected outbound and decel equations as the basis.
4. Keep `dv1` and `dv2` based on actual committed mission values:
   - `dv1 = v_flip`
   - `dv2 = v_flip` for a full stop burn

## Acceptance Criteria

The change is complete only if all of the following are true.

1. A midpoint flip plus `a2 = a1` reproduces the original symmetric solution and yields a hit.
2. For fixed `tau_flip`, choosing `a2 = a2_target` yields `s_stop = L` exactly.
3. For fixed `tau_flip`, `a2 < a2_target` produces `s_stop > L` and miss subtype `overshoot`.
4. For fixed `tau_flip`, `a2 > a2_target` produces `s_stop < L` and miss subtype `undershoot`.
5. During `burn2`, simulation time is frozen.
6. During `decel`, the ship and planets advance on one shared sim clock with no time rescaling.
7. The target band shown in `burn2` matches the real hit logic:
   - inside the band -> `missDistance <= captureTol`
   - outside the band on either side -> miss outcome or boundary condition
8. Mouse/touch and keyboard do not have different hidden access to the flip action.
9. In transit, the UI no longer collapses to an explicit "press now for the answer" mechanic.
10. `npm run code-review -- flipandburn/index.html` passes after the change.

## Out of Scope

This spec does not require redesigning the launch-window system in this iteration.

If the implementing agent touches that area incidentally, they should avoid making it more misleading, but the main goal here is the second-burn mechanic.
