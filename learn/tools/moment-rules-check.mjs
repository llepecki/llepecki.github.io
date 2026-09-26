#!/usr/bin/env node
/*
 * Independent rules check for moment/index.html (Moment Lab).
 *
 * Extracts the frozen challenge bank between the [moment-bank] markers and
 * the pure selection/scoring region between the [moment-rules] markers,
 * runs them in a bare vm sandbox, and verifies every invariant in spec
 * section 13.8, the canonical sanity cases in section 6.7, selection-quota
 * feasibility for section 10.3, star thresholds, and summary-tip mapping —
 * against an INDEPENDENT re-implementation of the moment formula, not the
 * app's own helpers.
 *
 * Run from learn/: npm run moment-rules-check
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "..", "moment", "index.html");
const html = readFileSync(htmlPath, "utf8");

function extractRegion(startMarker, endMarker, exportsExpr) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    console.error("FAIL: markers " + startMarker + " not found in moment/index.html");
    process.exit(1);
  }
  const code = html.slice(start + startMarker.length, end);
  return vm.runInNewContext(code + "\n" + exportsExpr, {
    Math,
    Number,
    Array,
    Object,
    JSON,
  });
}

const bankExports = extractRegion(
  "// [moment-bank:start]",
  "// [moment-bank:end]",
  "({ CHALLENGE_BANK })",
);
const BANK = bankExports.CHALLENGE_BANK;

const R = extractRegion(
  "// [moment-rules:start]",
  "// [moment-rules:end]",
  "({ EPS, PIVOT, clamp, forceComponents, momentOf, perpendicularDistance, " +
    "sumMoments, classifyMoment, legalBalanceSockets, checkBalanceRecord, " +
    "classifyBalanceError, buildMomentScaffold, computeBoardScale, mulberry32, " +
    "shuffleInPlace, sessionQuotas, quotaMatches, quotasSatisfied, selectSession, " +
    "computeStars, pickTipKey, predictErrorCategory })",
);

let failures = 0;
let checks = 0;
function assert(condition, message) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error("FAIL: " + message);
  }
}
function assertEqual(actual, expected, message) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(
      "FAIL: " +
        message +
        " — expected " +
        JSON.stringify(expected) +
        ", got " +
        JSON.stringify(actual),
    );
  }
}

/* ===== Independent solver =====
 * Exact integer arithmetic for the four cardinal directions used by the
 * bank; anything non-cardinal in a bank record is itself a failure. */
function indepMoment(force) {
  const a = ((force.angleDeg % 360) + 360) % 360;
  if (a === 270) {
    return -force.x * force.magnitude;
  }
  if (a === 90) {
    return force.x * force.magnitude;
  }
  if (a === 0 || a === 180) {
    return 0;
  }
  return NaN;
}
function indepNet(forces) {
  let total = 0;
  for (const force of forces) {
    total += indepMoment(force);
  }
  return total;
}
function indepClassify(net) {
  if (net > 1e-9) {
    return "ccw";
  }
  if (net < -1e-9) {
    return "cw";
  }
  return "balanced";
}

/* ===== 1. Bank invariants (spec 13.8) ===== */
{
  assertEqual(BANK.length, 72, "bank record count");
  const ids = new Set();
  for (const record of BANK) {
    assert(!ids.has(record.id), record.id + ": duplicate id");
    ids.add(record.id);
  }
  const pairCounts = {};
  for (const record of BANK) {
    assert(
      record.game === "balance" || record.game === "predict",
      record.id + ": bad game " + record.game,
    );
    assert(
      record.difficulty === 1 || record.difficulty === 2 || record.difficulty === 3,
      record.id + ": bad difficulty",
    );
    const key = record.game + record.difficulty;
    pairCounts[key] = (pairCounts[key] || 0) + 1;
    for (const force of record.forces) {
      assert(
        Number.isInteger(force.x) && force.x >= -4 && force.x <= 4,
        record.id + ": force position " + force.x + " out of range",
      );
      assert(
        force.magnitude > 0 && force.magnitude <= 5,
        record.id + ": force magnitude " + force.magnitude + " out of range",
      );
      assert(
        !Number.isNaN(indepMoment(force)),
        record.id + ": non-cardinal angle " + force.angleDeg,
      );
    }
  }
  for (const game of ["balance", "predict"]) {
    for (const difficulty of [1, 2, 3]) {
      assertEqual(pairCounts[game + difficulty], 12, game + " " + difficulty + " bank size");
    }
  }
  console.log("ok   bank shape: 72 unique records, 12 per game/difficulty");
}

/* ===== 2. Predict records against the independent solver ===== */
{
  for (const record of BANK) {
    if (record.game !== "predict") {
      continue;
    }
    const net = indepNet(record.forces);
    assertEqual(
      net,
      record.expectedNetMoment,
      record.id + ": expectedNetMoment vs independent solver",
    );
    assertEqual(
      indepClassify(net),
      record.expectedResult,
      record.id + ": expectedResult vs sign classification",
    );
  }
  console.log("ok   predict records: authored net moments and labels verified");
}

/* ===== 3. Balance records against the independent solver ===== */
{
  for (const record of BANK) {
    if (record.game !== "balance") {
      continue;
    }
    const occupied = new Set(record.forces.map((force) => force.x));
    assert(
      Number.isInteger(record.solutionX) &&
        record.solutionX >= -4 &&
        record.solutionX <= 4 &&
        record.solutionX !== 0,
      record.id + ": solutionX " + record.solutionX + " not a legal socket",
    );
    assert(!occupied.has(record.solutionX), record.id + ": solutionX occupied by a fixed force");
    assert(
      record.movableMagnitude > 0 && record.movableMagnitude <= 5,
      record.id + ": movable magnitude out of range",
    );
    const fixedM = indepNet(record.forces);
    /* Table column "Fixed M" implies fixedM === movableMagnitude * solutionX
     * because the downward movable force contributes −F·x. */
    assertEqual(
      fixedM,
      record.movableMagnitude * record.solutionX,
      record.id + ": fixed moment vs movable solution moment",
    );
    const zeroSockets = [];
    for (let x = -4; x <= 4; x += 1) {
      if (x === 0 || occupied.has(x)) {
        continue;
      }
      const net = fixedM - record.movableMagnitude * x;
      if (Math.abs(net) <= 1e-9) {
        zeroSockets.push(x);
      }
    }
    assertEqual(zeroSockets, [record.solutionX], record.id + ": unique zero-moment socket");
    assertEqual(record.expectedNetMoment, 0, record.id + ": balance expectedNetMoment");
    assertEqual(record.expectedResult, "balanced", record.id + ": balance expectedResult");
  }
  console.log("ok   balance records: fixed moments, unique solutions verified");
}

/* ===== 4. Explanation keys exist in both languages ===== */
{
  const keys = new Set(BANK.map((record) => record.explanationKey));
  for (const key of keys) {
    const uses = (html.match(new RegExp("\\b" + key + "\\b", "g")) || []).length;
    /* At least: en definition, pl definition, and the bank references. */
    const bankUses = BANK.filter((record) => record.explanationKey === key).length;
    assert(
      uses >= bankUses + 2,
      key + ": expected en+pl I18N definitions, found " + (uses - bankUses) + " non-bank uses",
    );
  }
  console.log("ok   explanation keys present in both language tables");
}

/* ===== 5. Canonical sanity cases (spec 6.7), independent AND app solver ===== */
{
  const cases = [
    { force: { x: 3, y: 0, magnitude: 2, angleDeg: 270 }, moment: -6, result: "cw" },
    { force: { x: -3, y: 0, magnitude: 2, angleDeg: 270 }, moment: 6, result: "ccw" },
    { force: { x: 3, y: 0, magnitude: 2, angleDeg: 90 }, moment: 6, result: "ccw" },
    { force: { x: 0, y: 0, magnitude: 5, angleDeg: 270 }, moment: 0, result: "balanced" },
    { force: { x: 3, y: 0, magnitude: 2, angleDeg: 180 }, moment: 0, result: "balanced" },
  ];
  for (const item of cases) {
    assertEqual(indepMoment(item.force), item.moment, "canonical case (independent)");
    const appMoment = R.momentOf(item.force, R.PIVOT);
    assert(
      Math.abs(appMoment - item.moment) <= 1e-9,
      "canonical case (app solver): got " + appMoment + ", want " + item.moment,
    );
    assertEqual(R.classifyMoment(appMoment), item.result, "canonical case classification");
  }
  const pair = [
    { x: 3, y: 0, magnitude: 2, angleDeg: 270 },
    { x: -2, y: 0, magnitude: 3, angleDeg: 270 },
  ];
  assertEqual(indepNet(pair), 0, "canonical two-force balance (independent)");
  assert(
    Math.abs(R.sumMoments(pair, R.PIVOT)) <= 1e-9,
    "canonical two-force balance (app solver)",
  );
  console.log("ok   canonical sanity cases");
}

/* ===== 6. App solver agrees with the independent solver on every record ===== */
{
  for (const record of BANK) {
    for (const force of record.forces) {
      const app = R.momentOf(force, R.PIVOT);
      const indep = indepMoment(force);
      assert(
        Math.abs(app - indep) <= 1e-9,
        record.id + ": app momentOf disagrees (" + app + " vs " + indep + ")",
      );
    }
    if (record.game === "balance") {
      const outcome = R.checkBalanceRecord(record, record.solutionX);
      assertEqual(outcome.result, "balanced", record.id + ": app checkBalanceRecord at solution");
    }
  }
  assertEqual(R.classifyMoment(1e-10), "balanced", "classify threshold +");
  assertEqual(R.classifyMoment(-1e-10), "balanced", "classify threshold -");
  assertEqual(R.classifyMoment(2e-9), "ccw", "classify above threshold");
  assertEqual(R.classifyMoment(-2e-9), "cw", "classify below threshold");
  console.log("ok   app solver cross-check");
}

/* ===== 7. Selection quotas (spec 10.3), independent interpretation ===== */
function indepQuotaCheck(records, game, difficulty) {
  const errs = [];
  const count = (predicate) => records.filter(predicate).length;
  if (records.length !== 8) {
    errs.push("session size " + records.length);
  }
  if (new Set(records.map((record) => record.id)).size !== records.length) {
    errs.push("duplicate draw");
  }
  for (const record of records) {
    if (record.game !== game || record.difficulty !== difficulty) {
      errs.push("wrong bank record " + record.id);
    }
  }
  if (game === "balance" && difficulty === 1) {
    if (count((r) => r.category === "left-fixed") !== 4) errs.push("left-fixed quota");
    if (count((r) => r.category === "right-fixed") !== 4) errs.push("right-fixed quota");
  } else if (game === "balance" && difficulty === 2) {
    if (count((r) => r.category === "stronger-closer") < 2) errs.push("stronger-closer quota");
    if (count((r) => r.category === "weaker-farther") < 2) errs.push("weaker-farther quota");
    if (count((r) => r.forces[0].x < 0) < 1) errs.push("left-side quota");
    if (count((r) => r.forces[0].x > 0) < 1) errs.push("right-side quota");
  } else if (game === "balance" && difficulty === 3) {
    if (count((r) => r.category === "same-side-fixed") < 3) errs.push("same-side quota");
    if (count((r) => r.category === "opposite-side-fixed") < 3) errs.push("opposite-side quota");
  } else if (game === "predict" && difficulty === 1) {
    if (count((r) => r.expectedResult === "balanced") < 2) errs.push("zero quota");
    if (count((r) => r.expectedResult === "cw") < 2) errs.push("cw quota");
    if (count((r) => r.expectedResult === "ccw") < 2) errs.push("ccw quota");
  } else if (game === "predict" && difficulty === 2) {
    if (count((r) => r.expectedResult === "balanced") < 2) errs.push("balance quota");
    if (count((r) => r.category === "force-dominant") < 2) errs.push("force-dominant quota");
    if (
      count(
        (r) =>
          r.category === "distance-dominant" ||
          r.category === "force-distance-conflict" ||
          r.category === "close-conflict",
      ) < 2
    ) {
      errs.push("distance/conflict quota");
    }
  } else {
    if (count((r) => r.expectedResult === "balanced") < 2) errs.push("balance quota");
    if (count((r) => r.expectedResult === "cw") < 2) errs.push("cw quota");
    if (count((r) => r.expectedResult === "ccw") < 2) errs.push("ccw quota");
    if (count((r) => r.category === "same-side-opposing") < 1) errs.push("same-side-opposing quota");
    if (count((r) => r.forces.length === 3) < 1) errs.push("three-force quota");
  }
  return errs;
}

{
  const byId = new Map(BANK.map((record) => [record.id, record]));
  for (const game of ["balance", "predict"]) {
    for (const difficulty of [1, 2, 3]) {
      let overlapViolations = 0;
      let previous = [];
      for (let i = 0; i < 400; i += 1) {
        const rng = R.mulberry32(game === "balance" ? i * 2 + difficulty : i * 2 + 100 + difficulty);
        const ids = R.selectSession(BANK, game, difficulty, rng, previous);
        const records = ids.map((id) => byId.get(id));
        const errs = indepQuotaCheck(records, game, difficulty);
        if (errs.length > 0) {
          assert(false, game + " " + difficulty + " seed " + i + ": " + errs.join("; "));
          break;
        }
        const overlap = ids.filter((id) => previous.indexOf(id) !== -1).length;
        if (previous.length > 0 && overlap > 4) {
          overlapViolations += 1;
        }
        previous = ids;
      }
      assert(
        overlapViolations === 0,
        game + " " + difficulty + ": " + overlapViolations + " sessions repeat more than 4 ids",
      );
      checks += 1; /* count the sweep itself */
    }
  }
  console.log("ok   selection: 400 sessions per config meet quotas, repeats capped");
}

/* ===== 8. Star thresholds (spec 10.4) ===== */
{
  const expected = [1, 1, 1, 1, 1, 1, 2, 2, 3];
  for (let correct = 0; correct <= 8; correct += 1) {
    assertEqual(R.computeStars(correct), expected[correct], "stars for " + correct + "/8");
  }
  console.log("ok   star thresholds");
}

/* ===== 9. Summary-tip mapping (spec 17.7, 11.3) ===== */
{
  assertEqual(R.pickTipKey({}, 8), "tipStrong", "tip 8/8");
  assertEqual(R.pickTipKey({ combine: 1 }, 7), "tipStrong", "tip 7/8");
  assertEqual(R.pickTipKey({ direction: 2, "line-of-action": 2 }, 4), "tipLineAction", "tip tie priority line-of-action");
  assertEqual(R.pickTipKey({ compare: 3, combine: 3 }, 2), "tipCombine", "tip tie priority combine");
  assertEqual(R.pickTipKey({ "force-only": 2, compare: 1 }, 5), "tipForceOnly", "tip force-only majority");
  assertEqual(R.pickTipKey({ direction: 3 }, 5), "tipDirection", "tip direction majority");
  assertEqual(R.pickTipKey({ compare: 2 }, 6), "tipCompare", "tip compare");

  const byId = new Map(BANK.map((record) => [record.id, record]));
  const l2 = byId.get("balance-l2-01"); /* fixed D(−2,3), movable 2, solution +3 */
  assertEqual(R.classifyBalanceError(l2, -3), "direction", "balance error: wrong side");
  assertEqual(R.classifyBalanceError(l2, 2), "force-only", "balance error: mirrored distance");
  assertEqual(R.classifyBalanceError(l2, 1), "combine", "balance error: wrong product");
  const l1 = byId.get("balance-l1-01"); /* solution +1 */
  assertEqual(R.classifyBalanceError(l1, 3), "compare", "balance error: level 1 same side");
  assertEqual(R.classifyBalanceError(l1, -2), "direction", "balance error: level 1 wrong side");
  const l3 = byId.get("balance-l3-03"); /* solution +3 */
  assertEqual(R.classifyBalanceError(l3, 2), "combine", "balance error: level 3");
  assertEqual(R.classifyBalanceError(l3, -2), "direction", "balance error: level 3 wrong side");

  assertEqual(R.predictErrorCategory(byId.get("predict-l1-05")), "line-of-action", "predict tip: pivot");
  assertEqual(R.predictErrorCategory(byId.get("predict-l1-07")), "line-of-action", "predict tip: along beam");
  assertEqual(R.predictErrorCategory(byId.get("predict-l1-01")), "direction", "predict tip: single force");
  assertEqual(R.predictErrorCategory(byId.get("predict-l3-01")), "combine", "predict tip: level 3");
  assertEqual(R.predictErrorCategory(byId.get("predict-l2-05")), "force-only", "predict tip: distance-dominant");
  assertEqual(R.predictErrorCategory(byId.get("predict-l2-08")), "force-only", "predict tip: conflict");
  assertEqual(R.predictErrorCategory(byId.get("predict-l2-03")), "compare", "predict tip: force-dominant");
  assertEqual(R.predictErrorCategory(byId.get("predict-l2-01")), "compare", "predict tip: equal");
  console.log("ok   summary-tip mapping");
}

/* ===== 10. Board-scale formula spot checks (spec 14.4 paper values) ===== */
{
  const rows = [
    { w: 320, h: 360, forcePxPerN: 14.4, beamPx: 144.0 },
    { w: 360, h: 360, forcePxPerN: 16.4, beamPx: 164.0 },
    { w: 390, h: 472.64, forcePxPerN: 17.9, beamPx: 179.0 },
  ];
  for (const row of rows) {
    const scale = R.computeBoardScale(row.w, row.h, 5);
    assert(
      Math.abs(scale.forcePxPerN - row.forcePxPerN) <= 0.1,
      row.w + "x" + row.h + ": forcePxPerN " + scale.forcePxPerN,
    );
    assert(
      Math.abs(scale.beamPx - row.beamPx) <= 0.1,
      row.w + "x" + row.h + ": beamPx " + scale.beamPx,
    );
  }
  console.log("ok   board scale paper checks");
}

if (failures === 0) {
  console.log("OK: " + checks + " checks passed");
  process.exit(0);
} else {
  console.error(failures + " of " + checks + " checks FAILED");
  process.exit(1);
}
