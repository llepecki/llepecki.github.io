#!/usr/bin/env node
// Cross-checks the Yes/No Reflex question bank, cue truth table, session
// generator, and scoring math embedded in yesnoreflex/index.html. Mirrors
// tools/fairsplit-rules-check.mjs: it extracts the marker-delimited rules
// block from the shipped app and re-runs it in a bare sandbox, then verifies
// every session-generation invariant from yesnoreflex/docs/req.md §9 with an
// independent re-implementation (not the app's own validator).
// Run from learn/: node tools/yesnoreflex-rules-check.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "..", "yesnoreflex", "index.html");
const RULES_START = "// [rules:start]";
const RULES_END = "// [rules:end]";

function loadRules() {
  const html = readFileSync(htmlPath, "utf8");
  const start = html.indexOf(RULES_START);
  const end = html.indexOf(RULES_END);
  if (start === -1 || end === -1 || end <= start) {
    console.error("FAIL: rules markers not found in yesnoreflex/index.html");
    process.exit(1);
  }
  const code = html.slice(start + RULES_START.length, end);
  const exportsExpr =
    "({ CATEGORIES, QUESTIONS, validateQuestionBank, mulberry32, randInt, " +
    "shuffleInPlace, clamp, computeInvert, computeExpected, " +
    "LEVELS, buildRuleBlocks, buildInvertSequence, " +
    "buildCategorySequence, buildExpectedSequence, findLongRun, " +
    "selectPlayfulSlots, playfulAvailability, normalizeHistory, " +
    "pushSessionHistory, rankBucket, selectWarmupQuestions, " +
    "violatesHardWindow, HISTORY_HARD_SESSIONS, " +
    "HISTORY_SOFT_LIMIT, CUE_POOLS, pairAllowed, drawAllowedPair, " +
    "rulesToBlocks, pairsDisjoint, generateBlockPairs, freezeBlocks, " +
    "enumerateAllowedPairs, cueSetKey, freezeCueProfile, " +
    "repairExpectedRuns, assignQuestions, materializeTrials, " +
    "validateSession, FALLBACK_SCHEDULES, buildFallbackSession, " +
    "generateSession, computePoints, computeStars, medianOf, " +
    "summarizeResults, pickTipKey })";
  return vm.runInNewContext(code + "\n" + exportsExpr, {
    Math,
    Number,
    Array,
    Object,
    JSON,
  });
}

const R = loadRules();

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
function cloneBank() {
  return JSON.parse(JSON.stringify(R.QUESTIONS));
}

/* ===== 1. Question bank invariants ===== */
assertEqual(R.QUESTIONS.length, 240, "bank has 240 questions");
assertEqual(R.CATEGORIES.length, 8, "bank has 8 categories");
assertEqual(
  R.validateQuestionBank(R.QUESTIONS),
  [],
  "shipped bank passes validateQuestionBank",
);
{
  const perCat = {};
  const perCatTrue = {};
  for (const q of R.QUESTIONS) {
    perCat[q.cat] = (perCat[q.cat] || 0) + 1;
    if (q.truth) perCatTrue[q.cat] = (perCatTrue[q.cat] || 0) + 1;
  }
  const perCatPlayful = {};
  const perCatPlayfulTrue = {};
  for (const q of R.QUESTIONS) {
    if (q.tone !== "playful") continue;
    perCatPlayful[q.cat] = (perCatPlayful[q.cat] || 0) + 1;
    if (q.truth) perCatPlayfulTrue[q.cat] = (perCatPlayfulTrue[q.cat] || 0) + 1;
  }
  for (const cat of R.CATEGORIES) {
    assertEqual(perCat[cat], 30, "category " + cat + " has 30 questions");
    assertEqual(
      perCatTrue[cat],
      15,
      "category " + cat + " has 15 true records",
    );
    assertEqual(
      perCatPlayful[cat],
      6,
      "category " + cat + " has 6 playful records",
    );
    assertEqual(
      perCatPlayfulTrue[cat],
      3,
      "category " + cat + " has 3 playful true records",
    );
  }
  const ids = new Set(R.QUESTIONS.map((q) => q.id));
  assertEqual(ids.size, 240, "ids are unique");
  assert(
    R.QUESTIONS.every((q) => q.enQ.endsWith("?") && q.plQ.endsWith("?")),
    "every question ends with ?",
  );
  assert(
    R.QUESTIONS.every(
      (q) =>
        q.id.length > 0 &&
        q.enQ.length > 0 &&
        q.plQ.length > 0 &&
        q.enFact.length > 0 &&
        q.plFact.length > 0,
    ),
    "every string field is non-empty",
  );
}
{
  // Negative cases: each corruption must be reported.
  const dupId = cloneBank();
  dupId[1].id = dupId[0].id;
  assert(
    R.validateQuestionBank(dupId).some((e) => e.indexOf("duplicate id") !== -1),
    "duplicate id is detected",
  );
  const short = cloneBank().slice(0, 239);
  assert(
    R.validateQuestionBank(short).some((e) => e.indexOf("240") !== -1),
    "wrong record count is detected",
  );
  const flipped = cloneBank();
  flipped[0].truth = !flipped[0].truth;
  assert(
    R.validateQuestionBank(flipped).some(
      (e) => e.indexOf("15 true questions") !== -1,
    ),
    "truth imbalance is detected",
  );
  const noMark = cloneBank();
  noMark[5].plQ = noMark[5].plQ.slice(0, -1);
  assert(
    R.validateQuestionBank(noMark).some(
      (e) => e.indexOf("does not end with ?") !== -1,
    ),
    "missing question mark is detected",
  );
  const emptyFact = cloneBank();
  emptyFact[7].plFact = "";
  assert(
    R.validateQuestionBank(emptyFact).some((e) => e.indexOf("plFact") !== -1),
    "empty fact is detected",
  );
  const badCat = cloneBank();
  badCat[9].cat = "dinosaurs";
  assert(
    R.validateQuestionBank(badCat).some(
      (e) => e.indexOf("unknown category") !== -1,
    ),
    "unknown category is detected",
  );
  const extraPlayful = cloneBank();
  extraPlayful.find((q) => q.id === "ani01").tone = "playful";
  assert(
    R.validateQuestionBank(extraPlayful).some(
      (e) => e.indexOf("6 playful records") !== -1,
    ),
    "broken playful shape is detected",
  );
  const badTone = cloneBank();
  badTone[4].tone = "silly";
  assert(
    R.validateQuestionBank(badTone).some(
      (e) => e.indexOf("invalid tone") !== -1,
    ),
    "invalid tone value is detected",
  );
  const dupEn = cloneBank();
  dupEn[2].enQ = dupEn[3].enQ;
  assert(
    R.validateQuestionBank(dupEn).some(
      (e) => e.indexOf("duplicate English") !== -1,
    ),
    "duplicate English question is detected",
  );
}

/* ===== 2. Exhaustive cue truth table (8 rows, hand-authored) ===== */
// Pair-per-round: exactly one cue dimension exists per trial, so the table
// is 2 truths x 2 dimensions x 2 roles with the inactive cue null.
{
  const T = true;
  const F = false;
  // [truth, activeRule, activeRole, invert, expectedAnswer]
  const TABLE = [
    [T, "color", "fact", F, T],
    [T, "color", "flip", T, F],
    [T, "shape", "fact", F, T],
    [T, "shape", "flip", T, F],
    [F, "color", "fact", F, F],
    [F, "color", "flip", T, T],
    [F, "shape", "fact", F, F],
    [F, "shape", "flip", T, T],
  ];
  for (const row of TABLE) {
    const colorCue = row[1] === "color" ? row[2] : null;
    const shapeCue = row[1] === "shape" ? row[2] : null;
    const invert = R.computeInvert(row[1], colorCue, shapeCue);
    assertEqual(invert, row[3], "invert for " + row.slice(0, 3).join("/"));
    assertEqual(
      R.computeExpected(row[0], invert),
      row[4],
      "expected answer for " + row.slice(0, 3).join("/"),
    );
  }
}

/* ===== 3. Independent session checker (does NOT reuse validateSession) ===== */
const QBYID = {};
for (const q of R.QUESTIONS) QBYID[q.id] = q;

const LEVEL_EXPECT = {
  1: {
    n: 12,
    factCount: 6,
    switchCount: 0,
    single: true,
    blocks: null,
    catMin: 1,
    catMax: 2,
    expDiffMax: 0,
    playful: 2,
  },
  2: {
    n: 14,
    factCount: 7,
    switchCount: 3,
    single: false,
    blocks: [3, 3, 4, 4],
    catMin: 1,
    catMax: 2,
    expDiffMax: 2,
    playful: 3,
  },
  3: {
    n: 18,
    factCount: 9,
    switchCount: 8,
    single: false,
    blocks: [1, 1, 2, 2, 2, 2, 2, 3, 3],
    catMin: 2,
    catMax: 3,
    expDiffMax: 2,
    playful: 4,
  },
};

function checkSessionIndependently(trials, blocks, level, label) {
  const spec = LEVEL_EXPECT[level];
  const errs = [];
  if (trials.length !== spec.n) {
    errs.push("trial count " + trials.length);
    return errs;
  }
  // ---- independent re-implementation of the block-table contract ----
  if (!Array.isArray(blocks) || blocks.length !== spec.switchCount + 1) {
    errs.push("block count " + (blocks && blocks.length));
    return errs;
  }
  const FORBIDDEN = R.CUE_POOLS.colorForbiddenPairs;
  const seenPairs = { color: new Set(), shape: new Set() };
  const prevPair = { color: null, shape: null };
  let cursor = 0;
  blocks.forEach((b, k) => {
    if (k > 0 && blocks[k - 1].dim === b.dim) {
      errs.push("block " + k + " dim does not alternate");
    }
    if (b.start !== cursor) errs.push("block " + k + " start " + b.start);
    cursor += b.length;
    const mapping = b.dim === "color" ? b.colors : b.shapes;
    const inactive = b.dim === "color" ? b.shapes : b.colors;
    if (inactive !== null) errs.push("block " + k + " inactive not null");
    const pool = b.dim === "color" ? R.CUE_POOLS.colors : R.CUE_POOLS.shapes;
    if (
      !mapping ||
      pool.indexOf(mapping.fact) === -1 ||
      pool.indexOf(mapping.flip) === -1 ||
      mapping.fact === mapping.flip
    ) {
      errs.push("block " + k + " bad pair");
      return;
    }
    if (
      b.dim === "color" &&
      FORBIDDEN.some(
        (f) =>
          (f[0] === mapping.fact && f[1] === mapping.flip) ||
          (f[0] === mapping.flip && f[1] === mapping.fact),
      )
    ) {
      errs.push("block " + k + " forbidden color pair");
    }
    const key = [mapping.fact, mapping.flip].sort().join("|");
    if (seenPairs[b.dim].has(key)) errs.push("block " + k + " pair repeats");
    seenPairs[b.dim].add(key);
    const prev = prevPair[b.dim];
    if (
      prev &&
      [mapping.fact, mapping.flip].some(
        (tok) => tok === prev.fact || tok === prev.flip,
      )
    ) {
      errs.push("block " + k + " shares a token with the previous " + b.dim);
    }
    prevPair[b.dim] = mapping;
    if (!Object.isFrozen(b) || !Object.isFrozen(mapping)) {
      errs.push("block " + k + " not frozen");
    }
  });
  if (cursor !== spec.n) errs.push("blocks cover " + cursor);
  let walkBlock = 0;
  const seen = new Set();
  const playfulCats = new Set();
  const catCounts = {};
  let truthYes = 0;
  let fact = 0;
  let switches = 0;
  let expYes = 0;
  let playfulCount = 0;
  let run = 1;
  const blockLens = [];
  let blockLen = 1;
  trials.forEach((t, i) => {
    const q = QBYID[t.questionId];
    if (!q) {
      errs.push("unknown question " + t.questionId);
      return;
    }
    if (seen.has(q.id)) errs.push("repeat " + q.id);
    seen.add(q.id);
    if (q.truth) truthYes += 1;
    catCounts[q.cat] = (catCounts[q.cat] || 0) + 1;
    if (q.tone === "playful") {
      playfulCount += 1;
      if (playfulCats.has(q.cat)) errs.push("playful category repeat at " + i);
      playfulCats.add(q.cat);
    }
    if (i > 0 && QBYID[trials[i - 1].questionId].cat === q.cat) {
      errs.push("adjacent category at " + i);
    }
    if (
      i > 0 &&
      q.tone === "playful" &&
      QBYID[trials[i - 1].questionId].tone === "playful"
    ) {
      errs.push("adjacent playful at " + i);
    }
    // recompute invert straight from the spec's rule definition
    const invert =
      t.activeRule === "color" ? t.colorCue === "flip" : t.shapeCue === "flip";
    if (invert !== t.invert) errs.push("invert mismatch at " + i);
    if (!invert) fact += 1;
    // one dimension per trial, at every level
    const inactiveCue = t.activeRule === "color" ? t.shapeCue : t.colorCue;
    const activeCue = t.activeRule === "color" ? t.colorCue : t.shapeCue;
    if (inactiveCue !== null) errs.push("inactive cue not null at " + i);
    if (activeCue !== "fact" && activeCue !== "flip") {
      errs.push("active cue not a role at " + i);
    }
    const switchNow = i > 0 && trials[i - 1].activeRule !== t.activeRule;
    if (switchNow !== t.isSwitch) errs.push("switch flag mismatch at " + i);
    if (t.isSwitch) switches += 1;
    if (t.isSwitch) walkBlock += 1;
    if (t.blockIndex !== walkBlock) {
      errs.push("blockIndex mismatch at " + i);
    } else {
      const home = blocks[walkBlock];
      if (
        t.activeRule !== home.dim ||
        i < home.start ||
        i >= home.start + home.length
      ) {
        errs.push("trial " + i + " outside its block");
      }
    }
    const expected = invert ? !q.truth : q.truth;
    if (expected !== t.expectedAnswer) {
      errs.push("expectedAnswer XOR violation at " + i);
    }
    if (t.expectedAnswer) expYes += 1;
    if (i > 0) {
      if (t.expectedAnswer === trials[i - 1].expectedAnswer) {
        run += 1;
        if (run > 3) errs.push("expected-answer run > 3 at " + i);
      } else {
        run = 1;
      }
      if (t.activeRule === trials[i - 1].activeRule) {
        blockLen += 1;
      } else {
        blockLens.push(blockLen);
        blockLen = 1;
      }
    }
  });
  blockLens.push(blockLen);
  if (truthYes !== spec.n / 2) errs.push("truth balance " + truthYes);
  if (fact !== spec.factCount) errs.push("FACT quota " + fact);
  if (switches !== spec.switchCount) errs.push("switch quota " + switches);
  if (playfulCount !== spec.playful) errs.push("playful quota " + playfulCount);
  const expDiff = Math.abs(2 * expYes - spec.n);
  if (expDiff > spec.expDiffMax) errs.push("expected imbalance " + expDiff);
  if (level === 1 && expDiff !== 0) errs.push("L1 expected imbalance");
  const counts = R.CATEGORIES.map((c) => catCounts[c] || 0);
  if (Math.min(...counts) < spec.catMin || Math.max(...counts) > spec.catMax) {
    errs.push("category counts " + counts.join(","));
  }
  if (spec.blocks) {
    const got = blockLens.slice().sort((a, b) => a - b);
    if (JSON.stringify(got) !== JSON.stringify(spec.blocks)) {
      errs.push("block multiset " + got.join(","));
    }
  }
  if (errs.length > 0) {
    console.error("FAIL detail (" + label + "): " + errs.join("; "));
  }
  return errs;
}

/* ===== 4. Monte Carlo: 10,000 sessions per level ===== */
const SESSIONS_PER_LEVEL = 10000;
for (const level of [1, 2, 3]) {
  let attemptSum = 0;
  let fallbacks = 0;
  let bad = 0;
  let colorStarts = 0;
  let expHigh = 0;
  let expLow = 0;
  let playfulTrue = 0;
  let playfulTotal = 0;
  const catDraws = {};
  const catExtras = {};
  const playfulCatDraws = {};
  R.CATEGORIES.forEach((c) => {
    catDraws[c] = 0;
    catExtras[c] = 0;
    playfulCatDraws[c] = 0;
  });
  for (let i = 0; i < SESSIONS_PER_LEVEL; i += 1) {
    const rng = R.mulberry32(level * 100000 + i);
    const session = R.generateSession(level, rng, null, R.QUESTIONS);
    attemptSum += session.attempts;
    if (session.usedFallback) fallbacks += 1;
    const errs = checkSessionIndependently(
      session.trials,
      session.blocks,
      level,
      "L" + level + " seed " + (level * 100000 + i),
    );
    if (errs.length > 0) bad += 1;
    if (
      R.validateSession(session.trials, session.blocks, level, R.QUESTIONS)
        .length > 0
    ) {
      bad += 1;
      console.error(
        "FAIL detail: app validateSession rejected L" + level + " seed " + i,
      );
    }
    if (session.trials[0].activeRule === "color") colorStarts += 1;
    const perCat = {};
    for (const t of session.trials) {
      const q = QBYID[t.questionId];
      perCat[q.cat] = (perCat[q.cat] || 0) + 1;
      catDraws[q.cat] += 1;
      if (q.tone === "playful") {
        playfulTotal += 1;
        playfulCatDraws[q.cat] += 1;
        if (q.truth) playfulTrue += 1;
      }
    }
    // The "extra" slot is whichever category exceeded the level's base count.
    const base = R.LEVELS[level].catBase;
    R.CATEGORIES.forEach((c) => {
      if ((perCat[c] || 0) > base) catExtras[c] += 1;
    });
    const expYes = session.trials.filter((t) => t.expectedAnswer).length;
    if (2 * expYes > LEVEL_EXPECT[level].n) expHigh += 1;
    else if (2 * expYes < LEVEL_EXPECT[level].n) expLow += 1;
  }
  assertEqual(
    bad,
    0,
    "L" + level + ": all " + SESSIONS_PER_LEVEL + " sessions valid",
  );
  assertEqual(fallbacks, 0, "L" + level + ": no fallback needed");
  assert(
    attemptSum / SESSIONS_PER_LEVEL < 2,
    "L" +
      level +
      ": mean attempts " +
      (attemptSum / SESSIONS_PER_LEVEL).toFixed(3) +
      " < 2",
  );
  assert(
    colorStarts > SESSIONS_PER_LEVEL * 0.4 &&
      colorStarts < SESSIONS_PER_LEVEL * 0.6,
    "L" + level + ": both start dimensions occur (" + colorStarts + " color)",
  );
  assertEqual(
    playfulTotal,
    SESSIONS_PER_LEVEL * LEVEL_EXPECT[level].playful,
    "L" + level + ": exact playful quota across all sessions",
  );
  assert(
    playfulTrue > playfulTotal * 0.2 && playfulTrue < playfulTotal * 0.8,
    "L" +
      level +
      ": playful true/false both occur substantially (" +
      playfulTrue +
      "/" +
      playfulTotal +
      " true)",
  );
  if (level === 1) {
    assertEqual(expHigh + expLow, 0, "L1: expected answers exactly balanced");
  } else {
    assert(
      expHigh > SESSIONS_PER_LEVEL * 0.4 && expLow > SESSIONS_PER_LEVEL * 0.4,
      "L" +
        level +
        ": imbalance side randomized (" +
        expHigh +
        " high / " +
        expLow +
        " low)",
    );
  }
  // Round-4 review §4.2/§5.6: extra-category selection must be balanced,
  // not biased by the fixed order of the CATEGORIES array.
  {
    const extraTotal = R.CATEGORIES.reduce((sum, c) => sum + catExtras[c], 0);
    const expectedExtra = SESSIONS_PER_LEVEL * R.LEVELS[level].catExtra;
    assertEqual(
      extraTotal,
      expectedExtra,
      "L" + level + ": exact number of extra-category slots",
    );
    const fairShare = extraTotal / R.CATEGORIES.length;
    const worst = R.CATEGORIES.reduce(
      (m, c) => Math.max(m, Math.abs(catExtras[c] - fairShare)),
      0,
    );
    assert(
      fairShare === 0 || worst < fairShare * 0.12,
      "L" +
        level +
        ": extra-category slots are order-independent (worst deviation " +
        worst.toFixed(0) +
        " of " +
        fairShare.toFixed(0) +
        ")",
    );
    const drawShare =
      R.CATEGORIES.reduce((sum, c) => sum + catDraws[c], 0) /
      R.CATEGORIES.length;
    const worstDraw = R.CATEGORIES.reduce(
      (m, c) => Math.max(m, Math.abs(catDraws[c] - drawShare)),
      0,
    );
    assert(
      worstDraw < drawShare * 0.05,
      "L" + level + ": every category is drawn within 5% of its fair share",
    );
    const playfulShare =
      R.CATEGORIES.reduce((sum, c) => sum + playfulCatDraws[c], 0) /
      R.CATEGORIES.length;
    const worstPlayful = R.CATEGORIES.reduce(
      (m, c) => Math.max(m, Math.abs(playfulCatDraws[c] - playfulShare)),
      0,
    );
    assert(
      worstPlayful < playfulShare * 0.12,
      "L" + level + ": playful categories are balanced across the batch",
    );
  }
  console.log(
    "ok   L" +
      level +
      ": " +
      SESSIONS_PER_LEVEL +
      " sessions, mean attempts " +
      (attemptSum / SESSIONS_PER_LEVEL).toFixed(3),
  );
}

/* ===== 5. Deterministic fallback schedules ===== */
for (const level of [1, 2, 3]) {
  const a = R.buildFallbackSession(level, R.mulberry32(1), null, R.QUESTIONS);
  const b = R.buildFallbackSession(level, R.mulberry32(999), null, R.QUESTIONS);
  assert(a.usedFallback === true, "L" + level + " fallback flag set");
  assertEqual(
    checkSessionIndependently(
      a.trials,
      a.blocks,
      level,
      "L" + level + " fallback",
    ),
    [],
    "L" + level + " fallback passes independent checks",
  );
  assertEqual(
    R.validateSession(a.trials, a.blocks, level, R.QUESTIONS),
    [],
    "L" + level + " fallback passes app validateSession",
  );
  const scheduleOf = (s) =>
    s.trials.map((t) => [
      t.activeRule,
      t.colorCue,
      t.shapeCue,
      t.invert,
      t.expectedAnswer,
      t.isSwitch,
      t.blockIndex,
    ]);
  const blocksOf = (s) =>
    s.blocks.map((b) => [
      b.dim,
      b.start,
      b.length,
      JSON.stringify(b.colors),
      JSON.stringify(b.shapes),
    ]);
  assertEqual(
    scheduleOf(a),
    scheduleOf(b),
    "L" + level + " fallback schedule is deterministic across rngs",
  );
  assertEqual(
    blocksOf(a),
    blocksOf(b),
    "L" + level + " fallback block pairs are deterministic across rngs",
  );
  assert(
    JSON.stringify(a.trials.map((t) => t.questionId)) !==
      JSON.stringify(b.trials.map((t) => t.questionId)),
    "L" + level + " fallback questions vary with the rng",
  );
}
{
  // A degenerate constant rng must still yield a fully valid session
  // (either a lucky constructive pass or the deterministic fallback).
  const constRng = () => 0.9999999;
  for (const level of [1, 2, 3]) {
    const s = R.generateSession(level, constRng, null, R.QUESTIONS);
    assertEqual(
      checkSessionIndependently(
        s.trials,
        s.blocks,
        level,
        "L" + level + " const-rng",
      ),
      [],
      "L" +
        level +
        " constant-rng session is valid (fallback=" +
        s.usedFallback +
        ")",
    );
  }
}

/* ===== 6. Two-tier recency history (round-4 review §4.3, §5.2, §5.3) ===== */
{
  const ID_SET = new Set(R.QUESTIONS.map((q) => q.id));
  assertEqual(R.HISTORY_HARD_SESSIONS, 4, "hard window is four sessions");
  assertEqual(R.HISTORY_SOFT_LIMIT, 96, "soft list holds 96 older ids");

  // --- normalizeHistory rejects every malformed shape without throwing ---
  const MALFORMED = [
    null,
    undefined,
    0,
    "history",
    true,
    [],
    {},
    { version: 2 },
    { version: 2, sessions: null, older: null },
    { version: 2, sessions: "ani01", older: "bod01" },
    { version: 2, sessions: [null, 7, "x"], older: [null, 7, {}] },
    { version: 2, sessions: [["ani01", "ani01", 5, null]], older: ["ani01"] },
    { version: 2, sessions: [["nope99"]], older: ["nope98"] },
    { version: 1, ids: ["ani01", "ani02"] },
    { sessions: [["ani01"]] },
  ];
  MALFORMED.forEach((value, i) => {
    let out = null;
    let threw = false;
    try {
      out = R.normalizeHistory(value, R.QUESTIONS);
    } catch {
      threw = true;
    }
    assert(!threw, "normalizeHistory case " + i + " does not throw");
    assert(
      out !== null &&
        typeof out.hard === "object" &&
        typeof out.soft === "object",
      "normalizeHistory case " + i + " returns two id maps",
    );
    if (out) {
      assert(
        Object.keys(out.hard).every((id) => ID_SET.has(id)) &&
          Object.keys(out.soft).every((id) => ID_SET.has(id)),
        "normalizeHistory case " + i + " drops unknown ids",
      );
    }
    for (const level of [1, 2, 3]) {
      const s = R.generateSession(
        level,
        R.mulberry32(500 + i),
        value,
        R.QUESTIONS,
      );
      assertEqual(
        checkSessionIndependently(
          s.trials,
          s.blocks,
          level,
          "L" + level + " malformed history " + i,
        ),
        [],
        "L" +
          level +
          ": malformed history " +
          i +
          " still yields a valid session",
      );
    }
  });

  // --- a flat legacy array degrades to soft-avoid only ---
  {
    const flat = R.QUESTIONS.slice(0, 40).map((q) => q.id);
    const norm = R.normalizeHistory(flat, R.QUESTIONS);
    assertEqual(
      Object.keys(norm.hard).length,
      0,
      "a flat legacy list creates no hard exclusions",
    );
    assertEqual(
      Object.keys(norm.soft).length,
      40,
      "a flat legacy list becomes the soft-avoid list",
    );
  }

  // --- the hard window wins over the soft list ---
  {
    const value = {
      version: 2,
      sessions: [["ani01"], ["ani02"]],
      older: ["ani01", "ani03"],
    };
    const norm = R.normalizeHistory(value, R.QUESTIONS);
    assert(norm.hard.ani01 && norm.hard.ani02, "session ids are hard-excluded");
    assert(!norm.soft.ani01, "an id cannot be both hard and soft");
    assert(norm.soft.ani03, "older ids are soft-avoided");
    // A fifth stored session degrades to soft rather than extending the window.
    const deep = {
      version: 2,
      sessions: [["ani01"], ["ani02"], ["ani03"], ["ani04"], ["ani05"]],
      older: [],
    };
    const dnorm = R.normalizeHistory(deep, R.QUESTIONS);
    assert(!dnorm.hard.ani05, "only four sessions form the hard window");
    assert(dnorm.soft.ani05, "the fifth session degrades to soft-avoid");
  }

  // --- rankBucket orders unseen, then soft, then hard ---
  {
    const bucket = R.QUESTIONS.filter(
      (q) => q.cat === "animals" && q.truth && q.tone !== "playful",
    );
    const history = {
      hard: { [bucket[0].id]: true },
      soft: { [bucket[1].id]: true },
    };
    const ranked = R.rankBucket(bucket.slice(), history, R.mulberry32(3));
    assertEqual(
      ranked.length,
      bucket.length - 1,
      "a hard-excluded record is absent from a normal bucket, not last",
    );
    assert(
      ranked.every((q) => q.id !== bucket[0].id),
      "a hard-excluded record never appears in a normal bucket",
    );
    assertEqual(
      ranked[ranked.length - 1].id,
      bucket[1].id,
      "a soft-avoided record ranks last among the eligible records",
    );
    // The last-resort path is the only one allowed to relax.
    const relaxed = R.rankBucket(
      bucket.slice(),
      history,
      R.mulberry32(3),
      true,
    );
    assertEqual(
      relaxed.length,
      bucket.length,
      "allowHard restores the hard-excluded record",
    );
    assertEqual(
      relaxed[relaxed.length - 1].id,
      bucket[0].id,
      "allowHard ranks the hard-excluded record last",
    );
  }

  // --- pushSessionHistory keeps 4 sessions plus 96 older unique ids ---
  {
    let stored = null;
    const played = [];
    for (let i = 0; i < 12; i += 1) {
      const ids = R.QUESTIONS.slice(i * 18, i * 18 + 18).map((q) => q.id);
      played.push(ids);
      stored = R.pushSessionHistory(stored, ids, R.QUESTIONS);
      assert(
        stored.sessions.length <= R.HISTORY_HARD_SESSIONS,
        "history keeps at most four session arrays",
      );
      assert(
        stored.older.length <= R.HISTORY_SOFT_LIMIT,
        "history keeps at most 96 older ids",
      );
      assertEqual(stored.version, 2, "history is stored under version 2");
      assertEqual(
        stored.sessions[0],
        ids,
        "the newest session is stored first",
      );
    }
    const olderSet = new Set(stored.older);
    assertEqual(olderSet.size, stored.older.length, "older ids are unique");
    const hardIds = new Set(stored.sessions.flat());
    assert(
      stored.older.every((id) => !hardIds.has(id)) ||
        stored.older.every((id) => ID_SET.has(id)),
      "older ids are known ids",
    );
    // Corrupt input on the way in is also cleaned.
    const dirty = R.pushSessionHistory(
      {
        version: 2,
        sessions: [["nope"], 5, null],
        older: [7, "nope", "ani01"],
      },
      ["ani02", "ani02", 9, "nope"],
      R.QUESTIONS,
    );
    assertEqual(dirty.sessions[0], ["ani02"], "pushed ids are cleaned");
    assert(
      dirty.older.every((id) => ID_SET.has(id)),
      "older ids are cleaned on write",
    );
  }

  // --- §5.2 / §5.3: sequential play must never reuse the last four sessions ---
  // Production stores warm-ups AND scored questions in one session record
  // (finishSession), and picks warm-ups with the same ranked selection. The
  // simulation must do both or it under-fills the hard window and misses
  // exactly the bucket exhaustion this suite exists to catch.
  function playedIdsFor(session, rng, stored) {
    const pair = R.selectWarmupQuestions(
      session.trials.map((t) => t.questionId),
      rng,
      R.normalizeHistory(stored, R.QUESTIONS),
      R.QUESTIONS,
    );
    return [pair[0].id, pair[1].id].concat(
      session.trials.map((t) => t.questionId),
    );
  }
  function sequentialRun(levels, label) {
    let stored = null;
    const window = [];
    let violations = 0;
    let fallbacks = 0;
    let playfulViolations = 0;
    for (let i = 0; i < 10000; i += 1) {
      const level = levels[i % levels.length];
      const rng = R.mulberry32(0x51ed + i * 7919);
      const session = R.generateSession(level, rng, stored, R.QUESTIONS);
      if (session.usedFallback) fallbacks += 1;
      const scored = session.trials.map((t) => t.questionId);
      const ids = playedIdsFor(session, rng, stored);
      const hard = new Set(window.flat());
      for (const id of ids) if (hard.has(id)) violations += 1;
      if (new Set(ids).size !== ids.length) violations += 1;
      const playful = scored.filter((id) => QBYID[id].tone === "playful");
      if (playful.length !== LEVEL_EXPECT[level].playful)
        playfulViolations += 1;
      if (new Set(playful.map((id) => QBYID[id].cat)).size !== playful.length) {
        playfulViolations += 1;
      }
      for (let k = 1; k < scored.length; k += 1) {
        if (
          QBYID[scored[k]].tone === "playful" &&
          QBYID[scored[k - 1]].tone === "playful"
        ) {
          playfulViolations += 1;
        }
      }
      window.unshift(ids);
      if (window.length > R.HISTORY_HARD_SESSIONS) window.pop();
      stored = R.pushSessionHistory(stored, ids, R.QUESTIONS);
    }
    assertEqual(
      violations,
      0,
      label + ": no played id repeats within four sessions (warm-ups included)",
    );
    assertEqual(
      playfulViolations,
      0,
      label + ": exact playful quota, distinct categories, never adjacent",
    );
    assertEqual(
      fallbacks,
      0,
      label + ": the hard window never forces the fallback schedule",
    );
    console.log("ok   " + label + ": 10000 sequential sessions");
  }
  sequentialRun([1], "L1 sequential recency");
  sequentialRun([2], "L2 sequential recency");
  sequentialRun([3], "L3 sequential recency");
  sequentialRun([1, 2, 3], "mixed-level sequential recency");

  // --- REGRESSION: an exhausted bucket must never leak a hard-excluded id ---
  // Before 2026-08-21 `rankBucket()` appended hard-excluded records after the
  // fresh and soft tiers, and `assignQuestions()` only failed on a fully
  // EMPTY pool, so a bucket whose eligible records were all inside the
  // four-session window silently handed one back with usedFallback=false.
  // Reported against yesnoreflex/index.html rankBucket/assignQuestions.
  {
    const bucket = R.QUESTIONS.filter(
      (q) => q.cat === "animals" && q.truth === true && q.tone !== "playful",
    ).map((q) => q.id);
    assert(bucket.length > 0, "regression fixture: bucket is non-empty");
    // Spread the whole bucket across the four hard sessions.
    const sessions = [[], [], [], []];
    bucket.forEach((id, i) => sessions[i % 4].push(id));
    const history = { version: 2, sessions, older: [] };
    const hard = new Set(bucket);
    let leaked = 0;
    let fallbacks = 0;
    let invalid = 0;
    for (let level of [1, 2, 3]) {
      for (let i = 0; i < 300; i += 1) {
        const session = R.generateSession(
          level,
          R.mulberry32(9000 + i),
          history,
          R.QUESTIONS,
        );
        if (session.usedFallback) fallbacks += 1;
        const ids = session.trials.map((t) => t.questionId);
        if (ids.some((id) => hard.has(id))) leaked += 1;
        if (
          checkSessionIndependently(
            session.trials,
            session.blocks,
            level,
            "L" + level + " exhausted-bucket",
          ).length > 0
        ) {
          invalid += 1;
        }
        // Warm-ups are played too, so they obey the same window.
        const pair = R.selectWarmupQuestions(
          ids,
          R.mulberry32(9000 + i),
          R.normalizeHistory(history, R.QUESTIONS),
          R.QUESTIONS,
        );
        if (hard.has(pair[0].id) || hard.has(pair[1].id)) leaked += 1;
      }
    }
    assertEqual(
      leaked,
      0,
      "an exhausted bucket never returns a hard-excluded question",
    );
    assertEqual(
      invalid,
      0,
      "routing around an exhausted bucket keeps every gameplay invariant",
    );
    assertEqual(
      fallbacks,
      0,
      "an exhausted bucket is solved by rescheduling, not by the fallback",
    );
    console.log("ok   exhausted-bucket regression");
  }

  // --- the last-resort path is the ONLY one allowed to relax ---
  {
    // Hard-exclude the entire bank: no legal schedule exists at all.
    const everything = R.QUESTIONS.map((q) => q.id);
    const sessions = [[], [], [], []];
    everything.forEach((id, i) => sessions[i % 4].push(id));
    const impossible = { version: 2, sessions, older: [] };
    for (const level of [1, 2, 3]) {
      const session = R.generateSession(
        level,
        R.mulberry32(4242),
        impossible,
        R.QUESTIONS,
      );
      assert(
        session.usedFallback === true,
        "L" + level + ": an impossible history reaches the last-resort path",
      );
      assertEqual(
        checkSessionIndependently(
          session.trials,
          session.blocks,
          level,
          "L" + level + " impossible-history",
        ),
        [],
        "L" + level + ": the last-resort schedule is still fully valid",
      );
      const pair = R.selectWarmupQuestions(
        session.trials.map((t) => t.questionId),
        R.mulberry32(4242),
        R.normalizeHistory(impossible, R.QUESTIONS),
        R.QUESTIONS,
      );
      assert(
        pair[0] && pair[1] && pair[0].id !== pair[1].id,
        "L" + level + ": warm-ups still exist under an impossible history",
      );
    }
    // violatesHardWindow is the final guard and must actually detect a leak.
    const norm = R.normalizeHistory(impossible, R.QUESTIONS);
    assert(
      R.violatesHardWindow([everything[0]], norm),
      "violatesHardWindow detects a hard-excluded id",
    );
    assert(
      !R.violatesHardWindow([], norm),
      "violatesHardWindow accepts an empty schedule",
    );
    assert(
      !R.violatesHardWindow(["ani01"], R.normalizeHistory(null, R.QUESTIONS)),
      "violatesHardWindow accepts everything with no history",
    );
    console.log("ok   last-resort relaxation is explicit and valid");
  }

  // --- §5.8: a full 96-id soft list must not break any invariant ---
  {
    // A realistic history: four actually-played sessions form the hard
    // window, and 96 older ids fill the soft list to its cap.
    let stored = null;
    for (let i = 0; i < 4; i += 1) {
      const rng = R.mulberry32(3100 + i);
      const s = R.generateSession(3, rng, stored, R.QUESTIONS);
      // Warm-ups included, as production stores them (F20).
      stored = R.pushSessionHistory(
        stored,
        playedIdsFor(s, rng, stored),
        R.QUESTIONS,
      );
    }
    const played = new Set(stored.sessions.flat());
    const filler = R.QUESTIONS.map((q) => q.id)
      .filter((id) => !played.has(id))
      .slice(0, R.HISTORY_SOFT_LIMIT);
    assertEqual(filler.length, 96, "soft fixture holds 96 ids");
    const value = { version: 2, sessions: stored.sessions, older: filler };
    const norm = R.normalizeHistory(value, R.QUESTIONS);
    assertEqual(
      Object.keys(norm.soft).length,
      96,
      "the soft list is at its documented cap",
    );
    for (const level of [1, 2, 3]) {
      for (let i = 0; i < 200; i += 1) {
        const s = R.generateSession(
          level,
          R.mulberry32(9000 + i),
          value,
          R.QUESTIONS,
        );
        const ids = s.trials.map((t) => t.questionId);
        assert(
          ids.every((id) => !played.has(id)),
          "L" + level + ": full soft history still honours the hard window",
        );
        assertEqual(
          checkSessionIndependently(
            s.trials,
            s.blocks,
            level,
            "L" + level + " soft-full",
          ),
          [],
          "L" + level + ": full soft history keeps every gameplay invariant",
        );
      }
    }
    console.log("ok   full 96-id soft history");
  }

  // --- degenerate history: two whole categories excluded ---
  // The category schedule needs every category, so relaxation is forced.
  // The contract is that the game still produces a fully valid session.
  {
    const brutal = {
      version: 2,
      sessions: [
        R.QUESTIONS.filter((q) => q.cat === "animals").map((q) => q.id),
        R.QUESTIONS.filter((q) => q.cat === "body").map((q) => q.id),
      ],
      older: R.QUESTIONS.filter((q) => q.cat === "space").map((q) => q.id),
    };
    for (const level of [1, 2, 3]) {
      for (let i = 0; i < 50; i += 1) {
        const s = R.generateSession(
          level,
          R.mulberry32(9500 + i),
          brutal,
          R.QUESTIONS,
        );
        assertEqual(
          checkSessionIndependently(
            s.trials,
            s.blocks,
            level,
            "L" + level + " brutal-history",
          ),
          [],
          "L" +
            level +
            ": an impossible hard window still yields a valid session",
        );
      }
    }
    console.log("ok   degenerate history relaxes without breaking play");
  }

  // --- §5.9: language never changes selection ---
  {
    for (const level of [1, 2, 3]) {
      const a = R.generateSession(level, R.mulberry32(1234), null, R.QUESTIONS);
      const b = R.generateSession(level, R.mulberry32(1234), null, R.QUESTIONS);
      assertEqual(
        a.trials.map((t) => t.questionId),
        b.trials.map((t) => t.questionId),
        "L" + level + ": selection is a pure function of seed and history",
      );
      assertEqual(
        a.trials.map((t) => QBYID[t.questionId].truth),
        b.trials.map((t) => QBYID[t.questionId].truth),
        "L" + level + ": truth values are identical across runs",
      );
    }
  }

  // --- playful availability drives slot placement, never a repeat ---
  {
    const avail = R.playfulAvailability(R.QUESTIONS, { hard: {}, soft: {} });
    assertEqual(
      Object.keys(avail).length,
      16,
      "16 playful category/truth buckets exist",
    );
    assert(
      Object.values(avail).every((n) => n === 3),
      "every playful bucket holds three records",
    );
    // Exclude every playful animals-true record: no slot may land there.
    const blocked = R.QUESTIONS.filter(
      (q) => q.tone === "playful" && q.cat === "animals" && q.truth,
    ).map((q) => q.id);
    assertEqual(blocked.length, 3, "three playful animals-true records exist");
    const hardValue = { version: 2, sessions: [blocked], older: [] };
    for (let i = 0; i < 300; i += 1) {
      const s = R.generateSession(
        2,
        R.mulberry32(7000 + i),
        hardValue,
        R.QUESTIONS,
      );
      const ids = s.trials.map((t) => t.questionId);
      assert(
        ids.every((id) => blocked.indexOf(id) === -1),
        "an exhausted playful bucket never forces a hard-excluded repeat",
      );
    }
    console.log("ok   playful availability and exclusion");
  }
}

/* ===== 7. Scoring, stars, median ===== */
assertEqual(R.computePoints(0, 6000), 100, "points at zero remaining");
assertEqual(R.computePoints(6000, 6000), 150, "points at full remaining");
assertEqual(R.computePoints(3000, 6000), 125, "points at half remaining");
assertEqual(R.computePoints(-500, 6000), 100, "points clamp below");
assertEqual(R.computePoints(9000, 6000), 150, "points clamp above");
assertEqual(R.computePoints(1000, 6000), 108, "points floor behavior");
assertEqual(R.computeStars(12, 12), 3, "stars 100%");
assertEqual(R.computeStars(11, 12), 3, "stars 91.7% -> 3");
assertEqual(R.computeStars(9, 12), 2, "stars exactly 75% -> 2");
assertEqual(R.computeStars(10, 14), 1, "stars 71.4% -> 1");
assertEqual(R.computeStars(0, 12), 1, "stars never 0");
assertEqual(R.computeStars(17, 18), 3, "stars 94.4% -> 3");
assertEqual(R.computeStars(16, 18), 2, "stars 88.9% -> 2");
assertEqual(R.medianOf([3, 1, 2]), 2, "median odd");
assertEqual(R.medianOf([4, 1, 3, 2]), 2.5, "median even");
assertEqual(R.medianOf([7]), 7, "median single");
assertEqual(R.medianOf([]), null, "median empty");
assertEqual(R.medianOf([900, 100, 500, 300]), 400, "median unsorted");

/* ===== 8. summarizeResults ===== */
{
  const mk = (correct, timeout, responseMs, invert, isSwitch) => ({
    correct,
    timeout,
    responseMs,
    invert,
    isSwitch,
  });
  const results = [
    mk(true, false, 1000, false, false),
    mk(true, false, 3000, true, true),
    mk(false, false, 2000, true, false),
    mk(false, true, null, false, true),
  ];
  const s = R.summarizeResults(results);
  assertEqual(s.total, 4, "summary total");
  assertEqual(s.correct, 2, "summary correct");
  assertEqual(s.accuracy, 50, "summary accuracy");
  assertEqual(s.medianMs, 2000, "summary median over correct non-timeouts");
  assertEqual(s.factAcc, 50, "summary FACT accuracy");
  assertEqual(s.flipAcc, 50, "summary FLIP accuracy");
  assertEqual(s.switchAcc, 50, "summary switch accuracy");
  assertEqual(s.repeatAcc, 50, "summary repeat accuracy");
  const none = R.summarizeResults([]);
  assertEqual(none.medianMs, null, "empty summary median null");
  assertEqual(none.factAcc, null, "empty summary factAcc null");
}

/* ===== 9. Adaptive tip cascade ===== */
{
  const tip = (factAcc, flipAcc, switchAcc, repeatAcc) =>
    R.pickTipKey({ factAcc, flipAcc, switchAcc, repeatAcc });
  assertEqual(tip(50, 80, 70, 60), "tipFact", "rule 1: fact lowest");
  assertEqual(tip(50, 60, 90, 70), "tipFact", "rule 1 precedence over rule 2");
  assertEqual(tip(80, 65, null, 80), "tipFlip", "rule 2: flip 15 below fact");
  assertEqual(
    tip(80, 65.01, null, 80),
    "tipDefault",
    "rule 2 boundary: 14.99pp does not fire",
  );
  assertEqual(
    tip(90, 85, 70, 88),
    "tipSwitch",
    "rule 3: switch 15 below repeat",
  );
  assertEqual(
    tip(90, 85, 73.5, 88),
    "tipDefault",
    "rule 3 boundary: 14.5pp does not fire",
  );
  assertEqual(tip(80, 80, 80, 80), "tipDefault", "rule 4: all equal");
  assertEqual(tip(80, 80, null, 80), "tipDefault", "L1: null switchAcc");
  assertEqual(tip(100, 100, null, 100), "tipDefault", "perfect run");
}

/* ===== 10. Round cue pairs (pair-per-round redesign, 2026-08-22) ===== */
{
  const key = (pair) => pair.slice().sort().join("|");
  const L3_DIMS_A = [
    "shape",
    "color",
    "shape",
    "color",
    "shape",
    "color",
    "shape",
    "color",
    "shape",
  ];
  const L3_DIMS_B = [
    "color",
    "shape",
    "color",
    "shape",
    "color",
    "shape",
    "color",
    "shape",
    "color",
  ];

  // Pool sanity.
  assert(
    R.enumerateAllowedPairs(R.CUE_POOLS.colors, R.CUE_POOLS.colorForbiddenPairs)
      .length >= 4,
    "at least four legal color pairs exist",
  );
  assertEqual(
    R.enumerateAllowedPairs(R.CUE_POOLS.shapes, []).length,
    10,
    "ten shape pairs exist",
  );

  function checkSequence(dims, out, label, requireDisjoint, poolsIn) {
    const pools = poolsIn || R.CUE_POOLS;
    const seen = { color: new Set(), shape: new Set() };
    const prev = { color: null, shape: null };
    out.pairs.forEach((pair, i) => {
      const dim = dims[i];
      const pool = dim === "color" ? pools.colors : pools.shapes;
      assert(
        pool.indexOf(pair[0]) !== -1 &&
          pool.indexOf(pair[1]) !== -1 &&
          pair[0] !== pair[1],
        label + ": pair " + i + " legal tokens",
      );
      if (dim === "color") {
        assert(
          R.pairAllowed(pair[0], pair[1], pools.colorForbiddenPairs),
          label + ": pair " + i + " passes the forbidden matrix",
        );
      }
      if (requireDisjoint) {
        assert(!seen[dim].has(key(pair)), label + ": pair " + i + " unused");
        if (prev[dim]) {
          assert(
            R.pairsDisjoint(pair, prev[dim]),
            label + ": pair " + i + " disjoint from previous " + dim,
          );
        }
      } else if (prev[dim]) {
        assert(
          key(pair) !== key(prev[dim]),
          label + ": pair " + i + " differs from previous " + dim,
        );
      }
      seen[dim].add(key(pair));
      prev[dim] = pair;
    });
  }

  // 2,000 seeded draws over the L3 shape-heavy demand: full constraints,
  // relaxLevel 0, and complete role coverage via freezeBlocks orientation.
  const roles = { color: {}, shape: {} };
  const pairCoverage = { color: new Set(), shape: new Set() };
  const rng = R.mulberry32(424242);
  for (let i = 0; i < 2000; i += 1) {
    const dims = i % 2 === 0 ? L3_DIMS_A : L3_DIMS_B;
    const out = R.generateBlockPairs(dims, rng, R.CUE_POOLS);
    assertEqual(out.relaxLevel, 0, "draw " + i + " needs no relaxation");
    checkSequence(dims, out, "draw " + i, true);
    const skeleton = dims.map((dim, k) => ({ dim, start: k, length: 1 }));
    const blocks = R.freezeBlocks(skeleton, out.pairs, rng);
    assert(
      Object.isFrozen(blocks) &&
        blocks.every(
          (b) => Object.isFrozen(b) && Object.isFrozen(b.colors || b.shapes),
        ),
      "draw " + i + " deep-frozen",
    );
    blocks.forEach((b) => {
      const m = b.colors || b.shapes;
      roles[b.dim][m.fact + ":fact"] = true;
      roles[b.dim][m.flip + ":flip"] = true;
      pairCoverage[b.dim].add(key([m.fact, m.flip]));
    });
  }
  for (const id of R.CUE_POOLS.colors) {
    assert(roles.color[id + ":fact"], "color " + id + " plays FACT");
    assert(roles.color[id + ":flip"], "color " + id + " plays FLIP");
  }
  for (const id of R.CUE_POOLS.shapes) {
    assert(roles.shape[id + ":fact"], "shape " + id + " plays FACT");
    assert(roles.shape[id + ":flip"], "shape " + id + " plays FLIP");
  }
  assertEqual(
    pairCoverage.color.size,
    7,
    "every legal color pair occurs across the batch",
  );
  assertEqual(
    pairCoverage.shape.size,
    10,
    "every shape pair occurs across the batch",
  );

  // Constant rng exercises the deterministic backtracking path and still
  // satisfies the full constraints on the shipped pools.
  {
    const constRng = () => 0.999999;
    const out = R.generateBlockPairs(L3_DIMS_A, constRng, R.CUE_POOLS);
    assertEqual(out.relaxLevel, 0, "constant-rng draw stays at level 0");
    checkSequence(L3_DIMS_A, out, "constant-rng", true);
    // rng null (the fallback-schedule path) is fully deterministic.
    const d1 = R.generateBlockPairs(L3_DIMS_A, null, R.CUE_POOLS);
    const d2 = R.generateBlockPairs(L3_DIMS_A, null, R.CUE_POOLS);
    assertEqual(d1.pairs, d2.pairs, "null-rng pair sequence is deterministic");
    checkSequence(L3_DIMS_A, d1, "null-rng", true);
  }

  // Adversarial injected pools: 4-pair forbidden structures. The sequential
  // sampler can dead-end here; the ladder must degrade exactly as predicted
  // by the feasibility analysis (path P5 solves k=4 strictly; star/C4/
  // triangle+edge need level 1; any 5-block color demand needs level 2).
  {
    const C = R.CUE_POOLS.colors; // [yellow, green, blue, purple, orange]
    const allPairs = R.enumerateAllowedPairs(C, []);
    function forbidAllBut(keep) {
      return allPairs
        .filter((p) => !keep.some((k) => key(k) === key(p)))
        .map((p) => p.slice());
    }
    const path4 = [
      [C[0], C[1]],
      [C[1], C[2]],
      [C[2], C[3]],
      [C[3], C[4]],
    ];
    const star4 = [
      [C[0], C[1]],
      [C[0], C[2]],
      [C[0], C[3]],
      [C[0], C[4]],
    ];
    const cycle4 = [
      [C[0], C[1]],
      [C[1], C[2]],
      [C[2], C[3]],
      [C[3], C[0]],
    ];
    const triEdge = [
      [C[0], C[1]],
      [C[1], C[2]],
      [C[0], C[2]],
      [C[3], C[4]],
    ];
    const K4_DIMS = [
      "color",
      "shape",
      "color",
      "shape",
      "color",
      "shape",
      "color",
      "shape",
    ];
    const K5_DIMS = [
      "color",
      "shape",
      "color",
      "shape",
      "color",
      "shape",
      "color",
      "shape",
      "color",
    ];
    const cases = [
      { name: "P5 path", keep: path4, k4Level: 0 },
      { name: "star", keep: star4, k4Level: 1 },
      { name: "C4 cycle", keep: cycle4, k4Level: 1 },
      { name: "triangle+edge", keep: triEdge, k4Level: 1 },
    ];
    for (const c of cases) {
      const pools = {
        colors: C,
        colorForbiddenPairs: forbidAllBut(c.keep),
        shapes: R.CUE_POOLS.shapes,
      };
      const out4 = R.generateBlockPairs(K4_DIMS, null, pools);
      assertEqual(
        out4.relaxLevel,
        c.k4Level,
        c.name + ": 4 color blocks relax to level " + c.k4Level,
      );
      checkSequence(
        K4_DIMS,
        out4,
        c.name + " k4",
        out4.relaxLevel === 0,
        pools,
      );
      const out5 = R.generateBlockPairs(K5_DIMS, null, pools);
      assertEqual(
        out5.relaxLevel,
        2,
        c.name + ": 5 color blocks from 4 pairs need pair reuse",
      );
      checkSequence(K5_DIMS, out5, c.name + " k5", false, pools);
      out5.pairs.forEach((pair, i) => {
        if (K5_DIMS[i] === "color") {
          assert(
            R.pairAllowed(pair[0], pair[1], pools.colorForbiddenPairs),
            c.name + " k5: reused pair " + i + " still legal",
          );
        }
      });
    }
  }

  // Monte Carlo: pair drawing inside real sessions never inflates attempts.
  for (const level of [1, 2, 3]) {
    let attempts = 0;
    for (let i = 0; i < 10000; i += 1) {
      const session = R.generateSession(
        level,
        R.mulberry32(level * 900000 + i),
        null,
        R.QUESTIONS,
      );
      attempts += session.attempts;
    }
    assert(
      attempts / 10000 < 2,
      "L" +
        level +
        ": mean session attempts " +
        (attempts / 10000).toFixed(3) +
        " < 2",
    );
  }
  console.log("ok   round pairs: 2000 draws + adversarial pools + fallback");
}

/* ===== Result ===== */
if (failures === 0) {
  console.log("OK: " + checks + " checks passed");
  process.exit(0);
} else {
  console.error(failures + " of " + checks + " checks FAILED");
  process.exit(1);
}
