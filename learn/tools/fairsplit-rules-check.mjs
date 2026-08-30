#!/usr/bin/env node
// Cross-checks the Fair Split (Ultimatum Game) rules embedded in
// fairsplit/index.html. Mirrors tools/dilemma-rules-check.mjs: extracts the
// marker-delimited rules block from the app source and re-verifies it
// independently.
// Run from learn/: node tools/fairsplit-rules-check.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "..", "fairsplit", "index.html");

const RULES_START = "// [rules:start]";
const RULES_END = "// [rules:end]";

function loadRules() {
  const source = readFileSync(htmlPath, "utf8");
  const start = source.indexOf(RULES_START);
  const end = source.indexOf(RULES_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("rules markers not found in fairsplit/index.html");
  }
  const code = source.slice(start + RULES_START.length, end);
  const exportsExpr =
    "({ POT, ROUNDS, MODES, splitterIndex, deciderIndex, potForRound, resolveUltimatumRound, isFairZone, isLowOffer, summarizeMatch, strikesLeft, checkpointFailed, judgeMatch })";
  return vm.runInNewContext(`${code}\n${exportsExpr}`, { Math, Number });
}

let failures = 0;
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
  );
}

function assertThrows(fn, message) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert(threw, `${message} — expected an error to be thrown`);
}

const rules = loadRules();
const { POT, ROUNDS, MODES } = rules;

// --- Constants (req 4.1) ---
assertEqual(POT, 10, "pot is 10 coins");
assertEqual(ROUNDS, 8, "match is 8 rounds");

// --- Role alternation (req 4.2, 13.4) ---
for (let r = 0; r < ROUNDS; r += 1) {
  assertEqual(rules.splitterIndex(r), r % 2, `round ${r}: splitter formula`);
  assertEqual(
    rules.deciderIndex(r),
    1 - (r % 2),
    `round ${r}: decider formula`,
  );
  assert(
    rules.splitterIndex(r) !== rules.deciderIndex(r),
    `round ${r}: roles are distinct`,
  );
}
const splitterCounts = [0, 0];
for (let r = 0; r < ROUNDS; r += 1) {
  splitterCounts[rules.splitterIndex(r)] += 1;
}
assertEqual(splitterCounts, [4, 4], "each player is Splitter exactly 4 times");
for (const oneBased of [1, 3, 5, 7]) {
  assertEqual(
    rules.splitterIndex(oneBased - 1),
    0,
    `round ${oneBased} (1-based): Player 1 is Splitter`,
  );
}
for (const oneBased of [2, 4, 6, 8]) {
  assertEqual(
    rules.splitterIndex(oneBased - 1),
    1,
    `round ${oneBased} (1-based): Player 2 is Splitter`,
  );
}

// --- Boundary offers (req 13.2) ---
assertEqual(
  rules.resolveUltimatumRound({ pot: 10, offerToDecider: 0, accepted: true }),
  {
    keptBySplitter: 10,
    offerToDecider: 0,
    splitterPayoff: 10,
    deciderPayoff: 0,
  },
  "offer 0 accepted",
);
assertEqual(
  rules.resolveUltimatumRound({ pot: 10, offerToDecider: 0, accepted: false }),
  {
    keptBySplitter: 10,
    offerToDecider: 0,
    splitterPayoff: 0,
    deciderPayoff: 0,
  },
  "offer 0 rejected",
);
assertEqual(
  rules.resolveUltimatumRound({ pot: 10, offerToDecider: 10, accepted: true }),
  {
    keptBySplitter: 0,
    offerToDecider: 10,
    splitterPayoff: 0,
    deciderPayoff: 10,
  },
  "offer 10 accepted",
);
assertEqual(
  rules.resolveUltimatumRound({
    pot: 10,
    offerToDecider: 10,
    accepted: false,
  }),
  {
    keptBySplitter: 0,
    offerToDecider: 10,
    splitterPayoff: 0,
    deciderPayoff: 0,
  },
  "offer 10 rejected",
);

// --- Exhaustive resolver sweep over every pot 5..10 (req 9.3 invariants) ---
for (let pot = 5; pot <= 10; pot += 1) {
  for (let offer = 0; offer <= pot; offer += 1) {
    for (const accepted of [true, false]) {
      const result = rules.resolveUltimatumRound({
        pot,
        offerToDecider: offer,
        accepted,
      });
      assert(
        result.keptBySplitter + result.offerToDecider === pot,
        `pot ${pot} offer ${offer}: kept + offer sums to pot`,
      );
      const sum = result.splitterPayoff + result.deciderPayoff;
      if (accepted) {
        assert(sum === pot, `pot ${pot} offer ${offer} accepted: sum to pot`);
        assert(
          result.splitterPayoff === result.keptBySplitter,
          `pot ${pot} offer ${offer} accepted: splitter payoff equals kept`,
        );
        assert(
          result.deciderPayoff === offer,
          `pot ${pot} offer ${offer} accepted: decider payoff equals offer`,
        );
      } else {
        assert(sum === 0, `pot ${pot} offer ${offer} rejected: sum to 0`);
      }
    }
  }
}

// --- Validation errors (req 9.1) ---
assertThrows(
  () =>
    rules.resolveUltimatumRound({
      pot: 10,
      offerToDecider: -1,
      accepted: true,
    }),
  "offer -1 throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({
      pot: 10,
      offerToDecider: 11,
      accepted: true,
    }),
  "offer 11 throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({
      pot: 10,
      offerToDecider: 2.5,
      accepted: true,
    }),
  "fractional offer throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({
      pot: 10,
      offerToDecider: "4",
      accepted: true,
    }),
  "string offer throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({ pot: 0, offerToDecider: 0, accepted: true }),
  "pot 0 throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({ pot: -5, offerToDecider: 0, accepted: true }),
  "negative pot throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({
      pot: 2.5,
      offerToDecider: 1,
      accepted: true,
    }),
  "fractional pot throws",
);
assertThrows(
  () =>
    rules.resolveUltimatumRound({ pot: 7, offerToDecider: 8, accepted: true }),
  "offer 8 exceeds pot 7 throws",
);

// --- Fair zone + low offer tables and partition (req 4.7) ---
const fairTable = {
  10: [4, 5, 6],
  9: [4, 5],
  8: [3, 4, 5],
  7: [3, 4],
  6: [2, 3, 4],
  5: [2, 3],
};
const lowMax = { 10: 3, 9: 3, 8: 2, 7: 2, 6: 1, 5: 1 };
for (let pot = 5; pot <= 10; pot += 1) {
  for (let offer = 0; offer <= pot; offer += 1) {
    const expectFair = fairTable[pot].includes(offer);
    const expectLow = offer <= lowMax[pot];
    const expectHigh = !expectFair && !expectLow;
    assertEqual(
      rules.isFairZone(offer, pot),
      expectFair,
      `isFairZone(${offer}, pot ${pot})`,
    );
    assertEqual(
      rules.isLowOffer(offer, pot),
      expectLow,
      `isLowOffer(${offer}, pot ${pot})`,
    );
    assert(
      [expectLow, expectFair, expectHigh].filter(Boolean).length === 1,
      `pot ${pot} offer ${offer}: exactly one of low/fair/high (expected)`,
    );
    assert(
      !(rules.isLowOffer(offer, pot) && rules.isFairZone(offer, pot)),
      `pot ${pot} offer ${offer}: low and fair are exclusive (actual)`,
    );
  }
}

// --- Near-middle summary sequence (req 13.3), pot 10 ---
const fairZoneOffers = [4, 5, 6, 3, 7, 2, 8, 5];
const fairZoneHistory = fairZoneOffers.map((offer, index) => ({
  offerToDecider: offer,
  pot: 10,
  accepted: index % 3 !== 0,
}));
assertEqual(
  rules.summarizeMatch(fairZoneHistory).fairZoneCount,
  4,
  "req 13.3 sequence has 4 near-middle offers",
);

// --- Mixed-pot fair-zone counting ---
assertEqual(
  rules.summarizeMatch([
    { offerToDecider: 5, pot: 10, accepted: true },
    { offerToDecider: 4, pot: 9, accepted: true },
    { offerToDecider: 3, pot: 8, accepted: true },
  ]).fairZoneCount,
  3,
  "mixed pots [10,9,8] offers [5,4,3] all near-middle",
);
assertEqual(
  rules.summarizeMatch([{ offerToDecider: 6, pot: 8, accepted: true }])
    .fairZoneCount,
  0,
  "offer 6 at pot 8 is not near-middle",
);

// --- Scripted match summary math (pot 10) ---
const scriptedOffers = [4, 2, 5, 10, 0, 6, 3, 5];
const scriptedAccepted = [true, false, true, true, true, false, false, true];
const scriptedHistory = scriptedOffers.map((offer, index) => ({
  offerToDecider: offer,
  pot: 10,
  accepted: scriptedAccepted[index],
}));
const summary = rules.summarizeMatch(scriptedHistory);
assertEqual(summary.acceptedCount, 5, "scripted match: accepted count");
assertEqual(summary.rejectedCount, 3, "scripted match: rejected count");
assertEqual(summary.fairZoneCount, 4, "scripted match: fair-zone count");
assert(
  Math.abs(summary.averageOffer - 35 / 8) < 1e-12,
  "scripted match: average offer is 4.375",
);

// --- Full-match reconstruction (req 13.1, 9.3) ---
// Tracks the running rejection count and the per-round pot so shrink-mode
// replays are exact. Non-shrink modes keep pot at 10 every round.
function playMatch(mode, offers, decisions) {
  const scores = [0, 0];
  const history = [];
  let rejections = 0;
  for (let r = 0; r < offers.length; r += 1) {
    const s = rules.splitterIndex(r);
    const d = rules.deciderIndex(r);
    const pot = rules.potForRound(mode, rejections);
    const result = rules.resolveUltimatumRound({
      pot,
      offerToDecider: offers[r],
      accepted: decisions[r],
    });
    const payoff = [0, 0];
    payoff[s] = result.splitterPayoff;
    payoff[d] = result.deciderPayoff;
    scores[0] += payoff[0];
    scores[1] += payoff[1];
    history.push({
      round: r + 1,
      pot,
      offerToDecider: result.offerToDecider,
      keptBySplitter: result.keptBySplitter,
      accepted: decisions[r],
      payoff,
    });
    if (!decisions[r]) rejections += 1;
  }
  return { scores, history };
}

const match = playMatch("team", scriptedOffers, scriptedAccepted);
assertEqual(
  match.history[0].payoff,
  [6, 4],
  "round 1: P1 splits, offer 4 accepted, payoff [6, 4]",
);
assertEqual(
  match.history[1].payoff,
  [0, 0],
  "round 2: P2 splits, offer 2 rejected, payoff [0, 0]",
);
assertEqual(
  match.history[3].payoff,
  [10, 0],
  "round 4: P2 splits, offer 10 accepted, P1 gets the pot",
);
assertEqual(
  match.history[4].payoff,
  [10, 0],
  "round 5: P1 splits, offer 0 accepted, P1 keeps the pot",
);
const replayTotals = match.history.reduce(
  (totals, entry) => [totals[0] + entry.payoff[0], totals[1] + entry.payoff[1]],
  [0, 0],
);
assertEqual(
  match.scores,
  replayTotals,
  "final scores equal the sum of history payoffs",
);
assertEqual(match.scores, [36, 14], "scripted match: hand-computed totals");
for (const entry of match.history) {
  const sum = entry.payoff[0] + entry.payoff[1];
  assertEqual(
    sum,
    entry.accepted ? entry.pot : 0,
    `round ${entry.round}: payoffs sum to ${entry.accepted ? "pot" : "0"}`,
  );
}

// --- Per-round exhaustive: payoffs land on the right player ---
for (let r = 0; r < ROUNDS; r += 1) {
  const s = rules.splitterIndex(r);
  const d = rules.deciderIndex(r);
  for (let offer = 0; offer <= POT; offer += 1) {
    for (const accepted of [true, false]) {
      const result = rules.resolveUltimatumRound({
        pot: POT,
        offerToDecider: offer,
        accepted,
      });
      const payoff = [0, 0];
      payoff[s] = result.splitterPayoff;
      payoff[d] = result.deciderPayoff;
      const sum = payoff[0] + payoff[1];
      if (sum !== (accepted ? POT : 0)) {
        assert(false, `round ${r} offer ${offer}: payoff vector sum`);
      }
      if (accepted && payoff[s] !== result.keptBySplitter) {
        assert(false, `round ${r} offer ${offer}: splitter payoff placement`);
      }
    }
  }
  checks += 1;
}
console.log(`swept ${ROUNDS * (POT + 1) * 2} role-indexed round resolutions`);

// --- Mode constants and derivations (req 4.7) ---
assertEqual(
  MODES.team,
  { target: 60, floor: 20, strikes: 2 },
  "team mode constants",
);
assertEqual(
  MODES.checkpoint,
  { target: 60, checkpointRound: 4, checkpointBank: 30, strikes: 2 },
  "checkpoint mode constants",
);
assertEqual(
  MODES.shrink,
  { goal: 25, shrinkBy: 1, minPot: 5 },
  "shrink mode constants",
);
assert(
  MODES.team.floor <= MODES.team.target / 2,
  "team floor <= target/2 (guarantees a winner exists once the gate passes)",
);
assertEqual(
  MODES.checkpoint.checkpointBank * 2,
  MODES.checkpoint.target,
  "checkpoint bank is exactly half the target (pins the 50% bar tick)",
);
assertEqual(
  MODES.checkpoint.checkpointRound * POT - MODES.checkpoint.checkpointBank,
  POT,
  "checkpoint tolerates exactly one first-half no-deal",
);
for (const m of ["team", "checkpoint"]) {
  assertEqual(
    (ROUNDS * POT - MODES[m].target) / POT,
    MODES[m].strikes,
    `${m}: strike budget = (max bank - target) / pot`,
  );
}
assertEqual(
  MODES.shrink.goal,
  5 * Math.round(POT / 2),
  "shrink goal equals 5 fair full-pot rounds",
);
assertEqual(MODES.shrink.minPot, 5, "shrink pot floor keeps Polish genitive");

// --- potForRound tables ---
for (let r = 0; r <= 7; r += 1) {
  assertEqual(rules.potForRound("team", r), 10, `team pot flat at ${r} rej`);
  assertEqual(
    rules.potForRound("checkpoint", r),
    10,
    `checkpoint pot flat at ${r} rej`,
  );
}
assertEqual(
  [0, 1, 2, 3, 4, 5, 6, 7].map((r) => rules.potForRound("shrink", r)),
  [10, 9, 8, 7, 6, 5, 5, 5],
  "shrink pot schedule floors at 5",
);

// --- strikesLeft table ---
for (const m of ["team", "checkpoint"]) {
  assertEqual(
    [0, 1, 2, 3, 5].map((n) => rules.strikesLeft(m, n)),
    [2, 1, 0, 0, 0],
    `${m}: strikes remaining never goes negative`,
  );
}
assertEqual(
  rules.strikesLeft("shrink", 0),
  null,
  "shrink has no strike budget",
);

// --- checkpointFailed boundaries ---
assertEqual(rules.checkpointFailed([15, 14]), true, "bank 29 fails checkpoint");
assertEqual(rules.checkpointFailed([15, 15]), false, "bank 30 passes");
assertEqual(rules.checkpointFailed([0, 29]), true, "bank 29 fails (lopsided)");
assertEqual(rules.checkpointFailed([30, 0]), false, "bank 30 passes (lopsided)");

// --- Team judge: boundaries, sweep, and the floor-impossibility proof ---
assertEqual(rules.judgeMatch("team", [39, 20]), "miss", "sum 59 is a miss");
assertEqual(rules.judgeMatch("team", [40, 20]), "bothP1", "40/20 both, P1 lead");
assertEqual(rules.judgeMatch("team", [41, 19]), "p1Only", "41/19 P1 wins alone");
assertEqual(rules.judgeMatch("team", [19, 41]), "p2Only", "19/41 P2 wins alone");
assertEqual(rules.judgeMatch("team", [20, 40]), "bothP2", "20/40 both, P2 lead");
assertEqual(rules.judgeMatch("team", [30, 30]), "tie", "60 even is a tie");
assertEqual(rules.judgeMatch("team", [60, 0]), "p1Only", "60/0 P1 wins alone");
{
  let sweptTeam = 0;
  for (let s1 = 0; s1 <= 90; s1 += 1) {
    for (let s2 = 0; s2 <= 90; s2 += 1) {
      const verdict = rules.judgeMatch("team", [s1, s2]);
      let expected;
      if (s1 + s2 < 60) expected = "miss";
      else if (s1 >= 20 && s2 < 20) expected = "p1Only";
      else if (s1 < 20 && s2 >= 20) expected = "p2Only";
      else if (s1 > s2) expected = "bothP1";
      else if (s2 > s1) expected = "bothP2";
      else expected = "tie";
      if (verdict !== expected) {
        assert(false, `team judge mismatch for [${s1}, ${s2}]`);
      }
      // Impossibility proof: gate passing forces at least one winner
      // (max >= sum/2 >= 30 > floor 19), so "both below floor" is unreachable.
      if (s1 + s2 >= 60) {
        assert(
          s1 >= MODES.team.floor || s2 >= MODES.team.floor,
          `team: bank >= 60 must leave someone above floor [${s1}, ${s2}]`,
        );
      }
      sweptTeam += 1;
    }
  }
  checks += 1;
  console.log(`swept ${sweptTeam} team-mode judgements`);
}

// --- Checkpoint judge (shared-goal semantics: gate + point winner) ---
assertEqual(rules.judgeMatch("checkpoint", [30, 29]), "miss", "sum 59 miss");
assertEqual(rules.judgeMatch("checkpoint", [30, 30]), "tie", "sum 60 tie");
assertEqual(rules.judgeMatch("checkpoint", [31, 29]), "p1", "sum 60 P1 leads");
assertEqual(rules.judgeMatch("checkpoint", [29, 31]), "p2", "sum 60 P2 leads");
{
  let sweptCheckpoint = 0;
  for (let s1 = 0; s1 <= 90; s1 += 1) {
    for (let s2 = 0; s2 <= 90; s2 += 1) {
      const verdict = rules.judgeMatch("checkpoint", [s1, s2]);
      let expected;
      if (s1 + s2 < 60) expected = "miss";
      else if (s1 > s2) expected = "p1";
      else if (s2 > s1) expected = "p2";
      else expected = "tie";
      if (verdict !== expected) {
        assert(false, `checkpoint judge mismatch for [${s1}, ${s2}]`);
      }
      sweptCheckpoint += 1;
    }
  }
  checks += 1;
  console.log(`swept ${sweptCheckpoint} checkpoint-mode judgements`);
}

// --- Shrink judge: personal goal 25 ---
assertEqual(rules.judgeMatch("shrink", [24, 24]), "none", "24/24 both lose");
assertEqual(rules.judgeMatch("shrink", [25, 24]), "p1", "25/24 P1 only");
assertEqual(rules.judgeMatch("shrink", [24, 25]), "p2", "24/25 P2 only");
assertEqual(rules.judgeMatch("shrink", [25, 25]), "both", "25/25 both win");
assertEqual(rules.judgeMatch("shrink", [40, 40]), "both", "40/40 both win");
{
  let sweptShrink = 0;
  for (let s1 = 0; s1 <= 90; s1 += 1) {
    for (let s2 = 0; s2 <= 90; s2 += 1) {
      const verdict = rules.judgeMatch("shrink", [s1, s2]);
      const r1 = s1 >= 25;
      const r2 = s2 >= 25;
      const expected = r1 && r2 ? "both" : r1 ? "p1" : r2 ? "p2" : "none";
      if (verdict !== expected) {
        assert(false, `shrink judge mismatch for [${s1}, ${s2}]`);
      }
      sweptShrink += 1;
    }
  }
  checks += 1;
  console.log(`swept ${sweptShrink} shrink-mode judgements`);
}

// --- Reachability replays (req 4.7) ---
const T8 = [true, true, true, true, true, true, true, true];
const teamFair = playMatch("team", [5, 5, 5, 5, 5, 5, 5, 5], T8);
assertEqual(teamFair.scores, [40, 40], "team all-fair scores 40/40");
assertEqual(rules.judgeMatch("team", teamFair.scores), "tie", "team fair tie");

const teamLopsided = playMatch("team", [2, 8, 2, 8, 2, 8, 2, 8], T8);
assertEqual(teamLopsided.scores, [64, 16], "team lopsided scores 64/16");
assertEqual(
  rules.judgeMatch("team", teamLopsided.scores),
  "p1Only",
  "team lopsided: the exploited player misses the floor",
);

const teamMild = playMatch("team", [2, 5, 2, 5, 2, 5, 2, 5], T8);
assertEqual(teamMild.scores, [52, 28], "team mild lowballing scores 52/28");
assertEqual(
  rules.judgeMatch("team", teamMild.scores),
  "bothP1",
  "team mild lowballing still clears the floor for both",
);

const teamTwoRej = playMatch(
  "team",
  [5, 5, 5, 5, 5, 5, 5, 5],
  [true, false, true, false, true, true, true, true],
);
assertEqual(teamTwoRej.scores, [30, 30], "team two rejections scores 30/30");
assertEqual(rules.judgeMatch("team", teamTwoRej.scores), "tie", "team 30/30 tie");
assertEqual(
  rules.strikesLeft("team", teamTwoRej.history.filter((e) => !e.accepted).length),
  0,
  "team: both strikes spent",
);

// --- Checkpoint round-4 prefixes ---
const cpFail = playMatch(
  "checkpoint",
  [5, 5, 5, 5],
  [true, false, false, true],
);
assertEqual(cpFail.scores, [10, 10], "checkpoint two early no-deals bank 20");
assertEqual(
  rules.checkpointFailed(cpFail.scores),
  true,
  "bank 20 after round 4 fails the checkpoint",
);
const cpPass = playMatch("checkpoint", [5, 5, 5, 5], [true, false, true, true]);
assertEqual(cpPass.scores, [15, 15], "checkpoint one early no-deal banks 30");
assertEqual(
  rules.checkpointFailed(cpPass.scores),
  false,
  "bank 30 after round 4 passes the checkpoint",
);

// --- Shrink replays with exact per-round pots ---
const shrinkS1 = playMatch(
  "shrink",
  [5, 5, 5, 5, 5, 5, 5, 5],
  [false, true, true, true, true, true, true, true],
);
assertEqual(
  shrinkS1.history.map((e) => e.pot),
  [10, 9, 9, 9, 9, 9, 9, 9],
  "shrink S1: one early no-deal locks the pot at 9",
);
assertEqual(shrinkS1.scores, [32, 31], "shrink S1 scores 32/31");
assertEqual(rules.judgeMatch("shrink", shrinkS1.scores), "both", "S1 both win");

const shrinkS2 = playMatch(
  "shrink",
  [5, 5, 4, 4, 4, 4, 4, 4],
  [false, false, true, true, true, true, true, true],
);
assertEqual(shrinkS2.scores, [24, 24], "shrink S2 two early no-deals -> 24/24");
assertEqual(
  rules.judgeMatch("shrink", shrinkS2.scores),
  "none",
  "S2 both fall one short of the goal (validates 25 over 24)",
);

const shrinkS3 = playMatch(
  "shrink",
  [5, 5, 5, 5, 5, 5, 5, 4],
  [true, true, true, true, true, false, false, false],
);
assertEqual(shrinkS3.scores, [25, 25], "shrink S3 late no-deals -> 25/25");
assertEqual(rules.judgeMatch("shrink", shrinkS3.scores), "both", "S3 both win");

const shrinkS4 = playMatch(
  "shrink",
  [5, 5, 5, 5, 5, 5, 5, 5],
  [true, true, true, false, true, true, true, true],
);
assertEqual(
  shrinkS4.history.map((e) => e.pot),
  [10, 10, 10, 10, 9, 9, 9, 9],
  "shrink S4: mid-match no-deal drops the pot to 9",
);
assertEqual(shrinkS4.scores, [33, 33], "shrink S4 scores 33/33");
assertEqual(rules.judgeMatch("shrink", shrinkS4.scores), "both", "S4 both win");

const shrinkS5 = playMatch(
  "shrink",
  [5, 5, 4, 4, 3, 3, 3, 3],
  [false, false, false, false, false, false, true, true],
);
assertEqual(
  shrinkS5.history.map((e) => e.pot),
  [10, 9, 8, 7, 6, 5, 5, 5],
  "shrink S5: six no-deals drive the pot to the floor",
);
assertEqual(shrinkS5.scores, [5, 5], "shrink S5 scores 5/5");
assertEqual(rules.judgeMatch("shrink", shrinkS5.scores), "none", "S5 both lose");

const shrinkS6 = playMatch(
  "shrink",
  [5, 5, 5, 4, 4, 4, 4, 4],
  [false, true, false, true, true, true, true, true],
);
assertEqual(shrinkS6.scores, [25, 24], "shrink S6 mixed -> 25/24");
assertEqual(
  rules.judgeMatch("shrink", shrinkS6.scores),
  "p1",
  "S6: P1 lands exactly on the goal, P2 one short",
);

console.log(
  failures === 0
    ? `OK: ${checks} checks passed`
    : `${failures} of ${checks} checks FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
