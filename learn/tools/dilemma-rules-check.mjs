#!/usr/bin/env node
// Cross-checks the Trust Dilemma ("The Crossing") engine embedded in
// dilemma/index.html. Mirrors tools/codebreak-puzzle-check.mjs: extracts the
// marker-delimited rules block and re-verifies it independently — here with a
// seeded Monte-Carlo gate that asserts the *incentive* properties, not just
// arithmetic. Design: dilemma/docs/spec-crossing-2026-07-15.md.
// Run from learn/: node tools/dilemma-rules-check.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "..", "dilemma", "index.html");

const RULES_START = "// [rules:start]";
const RULES_END = "// [rules:end]";

function loadRules() {
  const source = readFileSync(htmlPath, "utf8");
  const start = source.indexOf(RULES_START);
  const end = source.indexOf(RULES_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("rules markers not found in dilemma/index.html");
  }
  const code = source.slice(start + RULES_START.length, end);
  const exportsExpr =
    "({ RULES, createRng, rngInt, weatherForDay, storeContribution, treasureGain, resolveStore, roundKind, isSunk, isArrived })";
  return vm.runInNewContext(`${code}\n${exportsExpr}`, { Math });
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

const E = loadRules();
const { RULES } = E;

// ---- deterministic unit checks (no RNG) ----
const C = "fish";
const K = "dive";
assertEqual(E.storeContribution(C), 3, "fish adds +3 to the store");
assertEqual(E.storeContribution(K), -1, "dive costs −1 from the store");
assertEqual(E.treasureGain(C), 1, "fish treasure +1");
assertEqual(E.treasureGain(K), 3, "dive treasure +3");
assertEqual(E.roundKind(C, C), "fishBoth", "both fish -> fishBoth");
assertEqual(E.roundKind(K, K), "diveBoth", "both dive -> diveBoth");
assertEqual(E.roundKind(C, K), "split", "mixed -> split");
assertEqual(E.roundKind(K, C), "split", "mixed -> split");
assert(E.isSunk(0) && E.isSunk(-1) && !E.isSunk(1), "sink iff store <= 0");
assert(
  E.isArrived(RULES.HARBOR) && !E.isArrived(RULES.HARBOR - 1),
  "arrive iff distance >= HARBOR",
);
// store resolution across every combo x weather
for (const w of ["calm", "rough", "storm"]) {
  const d = RULES.DEMAND[w];
  assertEqual(
    E.resolveStore(8, C, C, w),
    8 + 6 - d,
    `both-fish store math (${w})`,
  );
  assertEqual(E.resolveStore(8, C, K, w), 8 + 2 - d, `split store math (${w})`);
  assertEqual(
    E.resolveStore(8, K, K, w),
    8 - 2 - d,
    `both-dive store math (${w})`,
  );
}
// fairness invariant: mutual cooperation never sinks in any weather
const coopNeverSinks = ["calm", "rough", "storm"].every(
  (w) => 2 * RULES.COOP_STORE - RULES.DEMAND[w] >= 0,
);
assert(coopNeverSinks, "mutual cooperation nets >= 0 in every weather");

// ---- match driver (independent of the app's flow code) ----
function playMatch(seed, s1, s2) {
  const rng = E.createRng(seed);
  const stratRng = E.createRng((seed ^ 0x9e3779b9) >>> 0);
  let store = RULES.S0;
  let dist = 0;
  const treasure = [0, 0];
  const history = [];
  let day = 1;
  for (;;) {
    if (day > 40) throw new Error("non-termination");
    const weather = E.weatherForDay(day, rng);
    const base = {
      day,
      store,
      weather,
      distance: dist,
      landInSight: dist >= RULES.LAND,
      history,
      stratRng,
      hi: RULES.S0 + 2,
    };
    const c1 = s1.fn({ ...base, me: 0 });
    const c2 = s2.fn({ ...base, me: 1 });
    store = E.resolveStore(store, c1, c2, weather);
    treasure[0] += E.treasureGain(c1);
    treasure[1] += E.treasureGain(c2);
    history.push({ day, weather, choices: [c1, c2] });
    if (E.isSunk(store)) return { sank: true, day, winner: null };
    dist += E.rngInt(rng, RULES.SAIL_LO, RULES.SAIL_HI);
    if (E.isArrived(dist)) {
      const winner =
        treasure[0] > treasure[1]
          ? 0
          : treasure[1] > treasure[0]
            ? 1
            : "shared";
      return { sank: false, day, winner };
    }
    day += 1;
  }
}

// ---- strategies (functions of observable state) ----
const STRAT = [
  { name: "always-fish", fn: () => "fish" },
  { name: "always-dive", fn: () => "dive" },
  {
    name: "tit-for-tat",
    fn: (v) =>
      v.day === 1 ? "fish" : v.history[v.history.length - 1].choices[1 - v.me],
  },
  {
    name: "greedy-in-calm",
    fn: (v) => (v.weather === "calm" && v.store >= v.hi ? "dive" : "fish"),
  },
  { name: "random", fn: (v) => (v.stratRng() < 0.5 ? "fish" : "dive") },
];
const payoff = (r, me) =>
  r.sank ? 0 : r.winner === me ? 1 : r.winner === "shared" ? 0.5 : 0;

// ---- round-robin ----
const N = 4000;
const ev = {};
STRAT.forEach((s) => (ev[s.name] = { sum: 0, n: 0 }));
const pair = {};
let maxDay = 0;
for (let i = 0; i < STRAT.length; i++) {
  for (let j = 0; j < STRAT.length; j++) {
    let sank = 0;
    let p0survive = 0;
    for (let k = 0; k < N; k++) {
      const res = playMatch(
        9000000 + i * 900000 + j * 4000 + k,
        STRAT[i],
        STRAT[j],
      );
      maxDay = Math.max(maxDay, res.day);
      if (res.sank) sank++;
      else if (res.winner === 0 || res.winner === "shared") p0survive += 0;
      if (!res.sank) p0survive += 1;
      ev[STRAT[i].name].sum += payoff(res, 0);
      ev[STRAT[i].name].n += 1;
      ev[STRAT[j].name].sum += payoff(res, 1);
      ev[STRAT[j].name].n += 1;
    }
    pair[`${STRAT[i].name}|${STRAT[j].name}`] = {
      sink: sank / N,
      survive: p0survive / N,
    };
  }
}
const Eof = (name) => ev[name].sum / ev[name].n;
const acVac = pair["always-fish|always-fish"];
const akVak = pair["always-dive|always-dive"];
const akVac = pair["always-dive|always-fish"];

// ---- incentive property assertions ----
assert(
  maxDay <= 8,
  `termination: every match ends by day 8 (max was ${maxDay})`,
);
assert(acVac.sink === 0, "fishers never sink (fish-vs-fish sink == 0)");
assert(
  akVak.sink >= 0.95,
  `mutual greed drowns (dive-vs-dive sink ${(akVak.sink * 100).toFixed(1)}%)`,
);
assert(
  Eof("always-dive") < Eof("tit-for-tat"),
  `greed dominated (E[always-dive]=${Eof("always-dive").toFixed(3)} < E[tit-for-tat]=${Eof("tit-for-tat").toFixed(3)})`,
);
assert(
  akVac.survive > 0.02 && akVac.survive < 0.5,
  `exploiting a saint is a losing gamble but wins sometimes (survive ${(akVac.survive * 100).toFixed(1)}%, want 2%..50%)`,
);
assert(
  Eof("tit-for-tat") > Eof("always-fish") &&
    Eof("tit-for-tat") > Eof("always-dive") &&
    Eof("greedy-in-calm") > Eof("always-fish") &&
    Eof("greedy-in-calm") > Eof("always-dive"),
  "state-readers (tit-for-tat, greedy-in-calm) beat both pure strategies",
);

// ---- report ----
const board = Object.entries(ev)
  .map(([name, s]) => [name, s.sum / s.n])
  .sort((a, b) => b[1] - a[1]);
console.log("Strategy leaderboard (avg win-payoff across the field):");
board.forEach(([name, x], r) =>
  console.log(`  ${r + 1}. ${name.padEnd(16)} ${x.toFixed(3)}`),
);
console.log(
  `fish-vs-fish sink ${(acVac.sink * 100).toFixed(0)}% | dive-vs-dive sink ${(akVak.sink * 100).toFixed(0)}% | exploit-a-saint survive ${(akVac.survive * 100).toFixed(0)}%`,
);
console.log(
  failures === 0
    ? `OK: ${checks} checks passed (${N} seeds/pairing)`
    : `${failures} of ${checks} checks FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
