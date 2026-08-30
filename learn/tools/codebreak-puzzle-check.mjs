import fs from "fs";
import path from "path";
import vm from "vm";

// Cross-checks the Code Breaker puzzle engine embedded in
// codebreak/index.html:
//  1. scoreGuess matches an independent scorer exhaustively.
//  2. Every authored fallback pattern instantiates, for every variant, to a
//     puzzle with exactly one solution using only level-vocabulary phrases
//     within the level clue-count range.
//  3. The Learn Clues teaching case has exactly one solution and uses only
//     the six exact clue phrases.
//  4. Sampled generatePuzzle output is unique-solution, vocabulary-legal and
//     within the clue-count range (or explicitly marked as fallback).
//
// Run from learn/:  node tools/codebreak-puzzle-check.mjs
// Pattern search:   node tools/codebreak-puzzle-check.mjs --find-fallbacks

const ENGINE_START = "// [engine:start]";
const ENGINE_END = "// [engine:end]";
const VARIANTS = ["numbers", "letters", "cards", "shapes"];
const GENERATION_SEEDS = 12;

let failures = 0;

function fail(message) {
  failures++;
  console.error(`FAIL ${message}`);
}

function ok(message) {
  console.log(`ok   ${message}`);
}

function loadEngine() {
  const file = path.resolve("codebreak/index.html");
  const source = fs.readFileSync(file, "utf8");
  const start = source.indexOf(ENGINE_START);
  const end = source.indexOf(ENGINE_END);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Could not find engine markers in codebreak/index.html");
  }
  const code = source.slice(start + ENGINE_START.length, end);
  const exportsExpr = `({ SYMBOL_SETS, POOL_SIZES, LEVELS, FALLBACK_PATTERNS,
    LEARN_CASE, createRng, shuffle, getSymbolPool, scoreGuess, sameScore,
    scoreKey, enumerateCodes, filterCandidates, makeClue, codesEqual,
    generatePuzzle, instantiateFallback })`;
  return vm.runInNewContext(`${code}\n${exportsExpr}`, { Math });
}

// Independent re-implementation of exact scoring, written differently on
// purpose: any divergence from the app's scoreGuess is an engine bug.
function scoreRef(code, guess) {
  const codeSet = new Set(code);
  const present = guess.filter((symbol) => codeSet.has(symbol)).length;
  const wellPlaced = guess.filter((symbol, i) => symbol === code[i]).length;
  return { present, wellPlaced, wrongPlaced: present - wellPlaced };
}

const CLUE_KEYS = [
  "clueNothing",
  "clueOneWell",
  "clueOneWrong",
  "clueTwoWrong",
  "clueMixedTwo",
  "clueThreeWrong",
];

function checkScoring(engine) {
  const ids = ["a", "b", "c", "d", "e"];
  const codes = engine.enumerateCodes(ids);
  let compared = 0;
  for (const code of codes) {
    for (const guess of codes) {
      const got = engine.scoreGuess(code, guess);
      const want = scoreRef(code, guess);
      compared++;
      if (
        got.present !== want.present ||
        got.wellPlaced !== want.wellPlaced ||
        got.wrongPlaced !== want.wrongPlaced
      ) {
        fail(
          `scoreGuess mismatch for code=${code} guess=${guess}: ` +
            `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`,
        );
        return;
      }
    }
  }
  ok(`scoreGuess matches independent scorer over ${compared} pairs`);
}

function checkPuzzle(engine, puzzle, label, requireRange) {
  const cfg = engine.LEVELS[puzzle.level];
  const poolIds = engine
    .getSymbolPool(puzzle.variant, puzzle.level)
    .map((s) => s.id);
  const unique = new Set(puzzle.code);
  if (puzzle.code.length !== 3 || unique.size !== 3) {
    fail(`${label}: code is not three distinct symbols`);
    return;
  }
  for (const clue of puzzle.clues) {
    if (new Set(clue.guess).size !== 3) {
      fail(`${label}: clue guess has repeated symbols`);
      return;
    }
    if (!clue.phraseKey || !CLUE_KEYS.includes(clue.phraseKey)) {
      fail(`${label}: clue phrase ${clue.phraseKey} is not an exact phrase`);
      return;
    }
    if (!cfg.keys.includes(clue.phraseKey)) {
      fail(
        `${label}: clue phrase ${clue.phraseKey} is outside level ` +
          `${puzzle.level} vocabulary`,
      );
      return;
    }
    const want = scoreRef(puzzle.code, clue.guess);
    if (!engine.sameScore(clue.score, want)) {
      fail(`${label}: recorded clue score does not match the code`);
      return;
    }
  }
  if (
    requireRange &&
    (puzzle.clues.length < cfg.minClues || puzzle.clues.length > cfg.maxClues)
  ) {
    fail(
      `${label}: ${puzzle.clues.length} clues outside range ` +
        `${cfg.minClues}-${cfg.maxClues}`,
    );
    return;
  }
  const remaining = engine.filterCandidates(
    engine.enumerateCodes(poolIds),
    puzzle.clues,
  );
  if (remaining.length !== 1) {
    fail(`${label}: ${remaining.length} solutions remain, want exactly 1`);
    return;
  }
  if (!engine.codesEqual(remaining[0], puzzle.code)) {
    fail(`${label}: surviving candidate differs from the recorded code`);
  }
}

function checkFallbacks(engine) {
  for (const level of Object.keys(engine.FALLBACK_PATTERNS)) {
    for (const variant of VARIANTS) {
      const puzzle = engine.instantiateFallback(Number(level), variant);
      checkPuzzle(engine, puzzle, `fallback L${level}/${variant}`, true);
    }
  }
  ok("authored fallback patterns verified for every level and variant");
}

function checkLearnCase(engine) {
  const { pool, code, guesses } = engine.LEARN_CASE;
  const clues = guesses.map((guess) => engine.makeClue(code, guess));
  for (const clue of clues) {
    if (!CLUE_KEYS.includes(clue.phraseKey)) {
      fail(`learn case: clue phrase ${clue.phraseKey} is not exact`);
      return;
    }
  }
  const remaining = engine.filterCandidates(
    engine.enumerateCodes(pool),
    clues,
  );
  if (remaining.length !== 1 || !engine.codesEqual(remaining[0], code)) {
    fail(`learn case: expected a unique solution equal to ${code}`);
    return;
  }
  ok("learn clues teaching case has exactly one solution");
}

function checkGeneration(engine) {
  let fallbacks = 0;
  let total = 0;
  for (const level of [1, 2, 3, 4, 5]) {
    for (const variant of VARIANTS) {
      for (let seed = 1; seed <= GENERATION_SEEDS; seed++) {
        total++;
        const puzzle = engine.generatePuzzle(level, variant, seed * 7919);
        if (puzzle.fallback) {
          fallbacks++;
          continue;
        }
        checkPuzzle(
          engine,
          puzzle,
          `generated L${level}/${variant} seed ${seed * 7919}`,
          true,
        );
      }
    }
  }
  ok(
    `generation sampled ${total} puzzles (${fallbacks} fell back to ` +
      "authored patterns)",
  );
  if (fallbacks > total / 2) {
    fail(
      `generator fell back ${fallbacks}/${total} times; ` +
        "clue-count ranges look unreachable",
    );
  }
}

function findFallbacks(engine) {
  // Search for authored-pattern candidates: generate on the numbers pool
  // (the smallest pool at every level) and convert symbols to pool indices.
  for (const level of [1, 2, 3, 4, 5]) {
    const poolIds = engine.getSymbolPool("numbers", level).map((s) => s.id);
    let found = null;
    for (let seed = 1; seed <= 4000 && !found; seed++) {
      const puzzle = engine.generatePuzzle(level, "numbers", seed);
      if (puzzle.fallback) continue;
      found = {
        seed,
        code: puzzle.code.map((id) => poolIds.indexOf(id)),
        clues: puzzle.clues.map((clue) => ({
          guess: clue.guess.map((id) => poolIds.indexOf(id)),
        })),
      };
    }
    if (!found) {
      console.error(`level ${level}: no pattern found`);
      continue;
    }
    console.log(`level ${level} (seed ${found.seed}):`);
    console.log(JSON.stringify({ code: found.code, clues: found.clues }));
  }
}

const engine = loadEngine();
if (process.argv.includes("--find-fallbacks")) {
  findFallbacks(engine);
} else {
  checkScoring(engine);
  checkFallbacks(engine);
  checkLearnCase(engine);
  checkGeneration(engine);
  if (failures > 0) {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("All codebreak puzzle checks passed.");
}
