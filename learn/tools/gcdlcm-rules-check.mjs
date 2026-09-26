#!/usr/bin/env node
// Cross-checks the Factor Workshop rules core embedded in gcdlcm/index.html.
// Mirrors tools/dilemma-rules-check.mjs: extracts the marker-delimited pure
// rules block (and the locked I18N block) and re-verifies them independently
// of the DOM layer. Design: gcdlcm/docs/design.md §4, §6, §7, §8.
// Run from learn/: node tools/gcdlcm-rules-check.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, "..", "gcdlcm", "index.html");
const source = readFileSync(htmlPath, "utf8");

function sliceBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      `${startMarker} … ${endMarker} not found in gcdlcm/index.html`,
    );
  }
  return source.slice(start + startMarker.length, end);
}

const RULE_EXPORTS = [
  "PRIMES",
  "GUIDED_DECK",
  "CHALLENGE_VALUES",
  "PROOF_RATIO_MAX",
  "LCM_TRACK_MAX",
  "proofFits",
  "CHALLENGE_SLOTS",
  "challengePool",
  "wrongAnswers",
  "challengeChoices",
  "seededRandom",
  "challengeDeck",
  "primeFactors",
  "factorCounts",
  "product",
  "gcd",
  "lcm",
  "taskSpec",
  "makeRecord",
  "derivePhase",
  "activeRow",
  "validPrimes",
  "applySplit",
  "tileById",
  "possiblePairs",
  "hasPossiblePair",
  "leftoverPhase",
  "pendingLeftovers",
  "tileEnabled",
  "selectTile",
  "isMatchable",
  "mateFor",
  "dropTile",
  "dropLeftover",
  "dropPrime",
  "dropOnShared",
  "flowStep",
  "FLOW_NODES",
  "FLOW_KIND",
  "FLOW_EDGES",
  "flowNodesFor",
  "flowEdgesFor",
  "flowNode",
  "flowEdges",
  "splitInvariant",
  "shelfTiles",
  "shelfProduct",
  "incompleteReason",
  "isCompleteShelf",
  "showNoSharedMessage",
  "checkResult",
  "chooseAnswer",
  "submitAnswer",
  "hintTarget",
  "pressHint",
  "applyHintStep",
  "canUndo",
  "undo",
  "resetRecord",
  "createRun",
  "completedCount",
  "solvedCount",
  "independentCount",
  "firstUnsolved",
  "openRun",
  "finishActive",
  "resetActive",
];

const R = vm.runInNewContext(
  `${sliceBetween("// [rules:start]", "// [rules:end]")}\n({ ${RULE_EXPORTS.join(", ")} })`,
  { Math, Object, Number, Array, String },
);
const I18N = vm.runInNewContext(
  `${sliceBetween("// [i18n:start]", "// [i18n:end]")}\nI18N`,
  {},
);

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

// ---- §7 locked copy: exact strings, both locales, every key read somewhere ----
const COPY = {
  title: ["Factor Workshop", "Warsztat czynników pierwszych"],
  subtitle: [
    "Break numbers into prime tiles.",
    "Rozkładaj liczby na czynniki pierwsze.",
  ],
  choose: ["Choose an algorithm.", "Wybierz algorytm."],
  gcdName: [
    "Greatest common divisor (GCD)",
    "Największy wspólny dzielnik (NWD)",
  ],
  lcmName: [
    "Least common multiple (LCM)",
    "Najmniejsza wspólna wielokrotność (NWW)",
  ],
  gcdMeaning: [
    "The largest number that divides both without leftovers.",
    "Największa liczba, przez którą obie liczby dzielą się bez reszty.",
  ],
  lcmMeaning: [
    "The smallest positive number both jump patterns reach.",
    "Najmniejsza dodatnia liczba, do której docierają oba znaczniki.",
  ],
  gcdRule: [
    "Multiply one tile from every matched pair. If nothing matches, the result is 1.",
    "Pomnóż liczby z jednej płytki w każdej połączonej parze. Jeśli nie ma żadnej pary, wynik to 1.",
  ],
  lcmRule: [
    "Multiply one tile from every matched pair and every unmatched tile.",
    "Pomnóż liczby z jednej płytki w każdej parze oraz ze wszystkich niesparowanych płytek.",
  ],
  factorIntro: [
    "A factor helps make a number: 2 × 6 = 12. Drag 2 onto 12, or tap both.",
    "Czynniki to liczby, które mnożymy: 2 × 6 = 12. Przeciągnij 2 na 12 albo dotknij obu.",
  ],
  primeIntro: [
    "2 and 3 are prime: only 1 and the number itself divide them exactly.",
    "2 i 3 to liczby pierwsze: każda z nich dzieli się bez reszty tylko przez 1 i samą siebie.",
  ],
  gcdTutorialPair: [
    "Drag one 2 onto the other, or tap both. Then match the 3s.",
    "Przeciągnij jedną płytkę z 2 na drugą albo dotknij obu. Potem połącz płytki z 3.",
  ],
  gcdTutorialEnd: [
    "The shared tiles make 2 × 3 = 6. Six is the largest group size that fits both with no leftovers.",
    "Wspólne płytki dają 2 × 3 = 6. Sześć to największa liczba, przez którą 12 i 18 dzielą się bez reszty.",
  ],
  lcmTutorialPair: [
    "Drag one 2 onto the other, or tap both.",
    "Przeciągnij jedną płytkę z 2 na drugą albo dotknij obu.",
  ],
  lcmTutorialAdd: [
    "Keep one shared 2. Drag the leftover 2 and 3 to Left over, or tap each tile.",
    "Zostaw jedną wspólną płytkę z 2. Przeciągnij pozostałe płytki z 2 i 3 na półkę Pozostałe albo dotknij każdej z nich.",
  ],
  lcmTutorialEnd: [
    "Both jump patterns first meet at 12.",
    "Oba znaczniki po raz pierwszy spotykają się na polu 12.",
  ],
  learnGcd: ["Learn GCD", "Ucz się NWD"],
  learnLcm: ["Learn LCM", "Ucz się NWW"],
  taskGcd: ["Find the GCD of {a} and {b}.", "Znajdź NWD liczb {a} i {b}."],
  taskLcm: ["Find the LCM of {a} and {b}.", "Znajdź NWW liczb {a} i {b}."],
  contextGcd: [
    "Box A holds {a} counters and box B holds {b}. What is the largest group size that fits both with no leftovers?",
    "Żetony w pudełku A: {a}, w pudełku B: {b}. Podziel każde pudełko na równe grupy tej samej wielkości, aby nic nie zostało. Ile najwięcej żetonów może być w jednej grupie?",
  ],
  contextLcm: [
    "Marker A jumps {a} spaces at a time; marker B jumps {b}. What is their first positive shared landing?",
    "Liczba pól w jednym skoku: znacznik A — {a}, znacznik B — {b}. Na którym polu oba znaczniki spotkają się po raz pierwszy po starcie?",
  ],
  nodeSplitNum: ["Split {n}", "Rozłóż {n}"],
  stepSplitA: ["Split A", "Rozłóż A"],
  stepSplitB: ["Split B", "Rozłóż B"],
  nodeStop: ["All primes now?", "Same pierwsze?"],
  nodeStopNo: ["No: {q} left", "Nie: zostało {q}"],
  nodeMatch: ["Any equal tiles left?", "Są jeszcze takie same płytki?"],
  nodePair: ["Pair them", "Połącz je w parę"],
  nodeLeftovers: ["Add every leftover tile", "Dodaj każdą pozostałą płytkę"],
  nodeMultiply: ["Multiply the result tiles", "Pomnóż płytki wyniku"],
  nodeGiven: ["Given", "Dane"],
  yes: ["Yes", "Tak"],
  no: ["No", "Nie"],
  stepSplitInfo: [
    "Break {n} into prime tiles until 1 is left.",
    "Rozkładaj liczbę {n} na czynniki pierwsze, aż zostanie 1.",
  ],
  stepMatchInfo: [
    "Two equal tiles make a pair: one from A and one from B.",
    "Dwie takie same płytki tworzą parę: jedna z A i jedna z B.",
  ],
  steps: ["Steps", "Kroki"],
  cueSplit: [
    "Which prime divides {n}? Drag it onto {n}, or tap both.",
    "Która liczba pierwsza dzieli {n} bez reszty? Przeciągnij ją na {n} albo dotknij obu.",
  ],
  cuePair: [
    "Drag equal tiles together or onto Shared, or tap both.",
    "Przeciągnij płytkę na taką samą albo dotknij obu.",
  ],
  cueLeftover: [
    "Drag every leftover tile to Left over, or tap it.",
    "Przeciągnij każdą niesparowaną płytkę na półkę Pozostałe albo jej dotknij.",
  ],
  cueCheck: ["Check the result.", "Sprawdź wynik."],
  cueSubmit: [
    "Choose the answer, then submit.",
    "Wybierz odpowiedź i sprawdź.",
  ],
  showChart: ["Show all steps", "Pokaż wszystkie kroki"],
  hideChart: ["Hide steps", "Ukryj kroki"],
  more: ["More", "Więcej"],
  shared: ["Shared", "Wspólne"],
  leftovers: ["Left over", "Pozostałe"],
  noShared: ["No shared tiles", "Brak wspólnych płytek"],
  result: ["Result", "Wynik"],
  guided: ["Guided practice", "Ćwiczenie z podpowiedziami"],
  challenge: ["Challenge", "Wyzwanie"],
  custom: ["Your numbers", "Twoje liczby"],
  customPrompt: ["Pick two numbers: A and B.", "Wybierz dwie liczby: A i B."],
  customRowA: ["Number A", "Liczba A"],
  customRowB: ["Number B", "Liczba B"],
  customNote: [
    "Greyed-out numbers make a pair whose picture would not fit.",
    "Wyszarzone liczby dają parę, której obrazek by się nie zmieścił.",
  ],
  customStart: ["Start", "Zacznij"],
  customNext: ["Pick new numbers", "Wybierz nowe liczby"],
  check: ["Check result", "Sprawdź wynik"],
  submit: ["Submit answer", "Sprawdź odpowiedź"],
  hint: ["Hint", "Podpowiedź"],
  showStep: ["Show one step", "Pokaż jeden krok"],
  undo: ["Undo", "Cofnij"],
  reset: ["Start this pair again", "Zacznij zadanie od nowa"],
  nextPair: ["Next pair", "Następne zadanie"],
  nextChallenge: ["Next challenge", "Następne wyzwanie"],
  switchAlgorithm: ["Switch algorithm", "Zmień algorytm"],
  previous: ["Previous", "Wstecz"],
  next: ["Next", "Dalej"],
  skip: ["Skip tutorial", "Pomiń samouczek"],
  replay: ["Replay tutorial", "Powtórz samouczek"],
  practiceAgain: ["Practice again", "Ćwicz ponownie"],
  tryChallenge: ["Try Challenge", "Spróbuj wyzwania"],
  tryAgain: ["Try again", "Spróbuj ponownie"],
  progress: ["{done} / {total} completed", "Ukończono {done} z {total}"],
  independent: [
    "{count} / 5 solved independently",
    "{count} z 5 rozwiązanych samodzielnie",
  ],
  withHelp: ["Completed with help", "Ukończono z pomocą"],
  independentOne: ["Solved independently", "Rozwiązano samodzielnie"],
  solvedPair: ["Pair solved.", "Zadanie rozwiązane."],
  invalidPrime: [
    "{p} does not divide {n} evenly. Try a prime that leaves no remainder.",
    "Liczba {p} nie dzieli {n} bez reszty. Wybierz liczbę pierwszą, przez którą {n} dzieli się bez reszty.",
  ],
  wrongPair: [
    "Match a {p} with another {p}.",
    "Połącz płytkę z {p} z taką samą płytką w drugim rzędzie.",
  ],
  missingPair: [
    "A matching {p} is still in both rows.",
    "W obu rzędach nadal jest płytka z {p}.",
  ],
  missingLeftover: [
    "The unpaired {p} still belongs in the result.",
    "Niesparowana płytka z {p} też należy do wyniku.",
  ],
  wrongChoice: [
    "Multiply the result tiles again and try another number.",
    "Jeszcze raz pomnóż liczby na płytkach wyniku i wybierz inną odpowiedź.",
  ],
  chooseAnswer: [
    "Choose one number before submitting.",
    "Wybierz liczbę przed sprawdzeniem odpowiedzi.",
  ],
  splitHint1: [
    "Look for a prime that makes equal groups of {n}.",
    "Poszukaj liczby pierwszej, przez którą można podzielić {n} na równe grupy.",
  ],
  splitHint2: [
    "{n} ÷ {p} = {q}. Look at the {p} tile.",
    "{n} ÷ {p} = {q}. Spójrz na płytkę z {p}.",
  ],
  assembleHint1: [
    "Compare the two rows, one prime at a time.",
    "Porównuj oba rzędy, po jednej liczbie pierwszej.",
  ],
  assembleHint2: [
    "Look at the {p} tile in {n}.",
    "Spójrz na płytkę z {p} w liczbie {n}.",
  ],
  leftoverHint1: [
    "No matches remain. Add each unpaired tile once.",
    "Nie ma już par. Dodaj każdą niesparowaną płytkę tylko raz.",
  ],
  leftoverHint2: [
    "Add the unpaired {p} from {n}.",
    "Dodaj niesparowaną płytkę z {p} z liczby {n}.",
  ],
  emptyHint1: [
    "No prime appears in both rows. Check the rule for an empty shelf.",
    "Żadna liczba pierwsza nie występuje w obu rzędach. Sprawdź zasadę dla pustej półki.",
  ],
  emptyHint2: [
    "The shared shelf has no tiles. Check the result or choose an answer.",
    "Na wspólnej półce nie ma płytek. Sprawdź wynik lub wybierz odpowiedź.",
  ],
  gcdProof: [
    "{a} = {qa} × {g}; {b} = {qb} × {g}. No larger group size fits both.",
    "{a} = {qa} × {g}; {b} = {qb} × {g}. Żadna większa liczba nie dzieli bez reszty zarówno {a}, jak i {b}.",
  ],
  lcmProof: [
    "{m} = {ka} × {a} = {kb} × {b}. This is the first positive landing both share.",
    "{m} = {ka} × {a} = {kb} × {b}. To pierwsze pole po starcie, na którym spotykają się oba znaczniki.",
  ],
  tileA: ["A, factor {p}, {status}.", "A, czynnik {p}, {status}."],
  tileB: ["B, factor {p}, {status}.", "B, czynnik {p}, {status}."],
  tileFree: ["not paired", "niesparowany"],
  tilePaired: ["paired", "sparowany"],
  tileSelected: ["selected", "wybrany"],
  tileAdded: ["added to result", "dodany do wyniku"],
  primeChoice: ["Divide {n} by {p}", "Podziel {n} przez {p}"],
  quotTarget: ["Split {q}", "Rozłóż {q}"],
  addTileA: ["A, factor {p}, add to result", "A, czynnik {p}, dodaj do wyniku"],
  addTileB: ["B, factor {p}, add to result", "B, czynnik {p}, dodaj do wyniku"],
  switchLanguage: ["Switch language", "Zmień język"],
  backToLearn: ["Back to Learn", "Wróć do Nauki"],
};

for (const [key, [en, pl]] of Object.entries(COPY)) {
  assertEqual(I18N.en[key], en, `en.${key} matches design §7`);
  assertEqual(I18N.pl[key], pl, `pl.${key} matches design §7`);
}
assertEqual(
  Object.keys(I18N.en).sort(),
  Object.keys(I18N.pl).sort(),
  "en and pl define the same keys",
);
const extraKeys = Object.keys(I18N.en).filter((k) => !(k in COPY));
assertEqual(
  extraKeys,
  ["stageLabel"],
  "only the workbench aria-label key is added beyond §7",
);
const i18nEnd = source.indexOf("// [i18n:end]");
for (const key of Object.keys(I18N.en)) {
  const readers = (
    source.slice(i18nEnd).match(new RegExp(`["']${key}["']`, "g")) || []
  ).length;
  assert(readers > 0, `I18N key ${key} is read somewhere after the copy block`);
}
assert(
  !/GCD|LCM/.test(Object.values(I18N.pl).join(" ")),
  "Polish copy never uses GCD/LCM",
);
assert(
  !/NWD|NWW/.test(Object.values(I18N.en).join(" ")),
  "English copy never uses NWD/NWW",
);

// ---- math helpers ----
function euclid(a, b) {
  return b === 0 ? a : euclid(b, a % b);
}
for (let n = 1; n <= 72; n += 1) {
  const f = R.primeFactors(n);
  assertEqual(R.product(f), n, `primeFactors(${n}) multiplies back`);
  assert(
    f.every((p, i) => i === 0 || f[i - 1] <= p),
    `primeFactors(${n}) is sorted`,
  );
  assert(
    f.every((p) => R.primeFactors(p).length === 1),
    `primeFactors(${n}) contains only primes`,
  );
}
assertEqual(R.primeFactors(1), [], "1 has no prime tiles");
assertEqual(R.factorCounts([2, 2, 3]), { 2: 2, 3: 1 }, "factorCounts multiset");
for (let a = 1; a <= 30; a += 1) {
  for (let b = 1; b <= 30; b += 1) {
    assertEqual(R.gcd(a, b), euclid(a, b), `gcd(${a},${b}) vs Euclid oracle`);
    assertEqual(
      R.gcd(a, b) * R.lcm(a, b),
      a * b,
      `gcd×lcm = a×b for (${a},${b})`,
    );
  }
}

// ---- §6 locked Guided deck and the Challenge generator ----
const GUIDED_ANSWERS = {
  gcd: [
    [18, 24, 6],
    [8, 12, 4],
    [15, 20, 5],
    [8, 9, 1],
    [12, 12, 12],
    [10, 30, 10],
    [9, 15, 3],
    [12, 18, 6],
  ],
  lcm: [
    [6, 8, 24],
    [9, 12, 36],
    [10, 15, 30],
    [8, 9, 72],
    [12, 12, 12],
    [5, 20, 20],
    [12, 18, 36],
    [4, 6, 12],
  ],
};
// The original ten Challenge tasks stay as a fixture for the scoring and run
// tests; the app draws its decks with challengeDeck().
const CHALLENGE_FIXTURE = {
  gcd: [
    { pair: [6, 10], preSplit: false, choices: [1, 2, 3], context: false },
    { pair: [9, 12], preSplit: true, choices: [2, 3, 6], context: false },
    { pair: [20, 30], preSplit: false, choices: [5, 10, 15], context: true },
    { pair: [4, 9], preSplit: true, choices: [1, 2, 3], context: false },
    { pair: [15, 15], preSplit: false, choices: [3, 5, 15], context: false },
  ],
  lcm: [
    { pair: [6, 10], preSplit: false, choices: [20, 30, 60], context: false },
    { pair: [4, 9], preSplit: true, choices: [18, 36, 72], context: false },
    { pair: [10, 12], preSplit: false, choices: [30, 60, 72], context: true },
    { pair: [3, 5], preSplit: true, choices: [5, 15, 30], context: false },
    { pair: [6, 6], preSplit: false, choices: [6, 12, 18], context: false },
  ],
};
const SLOT_SHAPES = {
  gcd: ["shared", "shared", "shared", "coprime", "equal"],
  lcm: ["shared", "coprime", "shared", "coprime", "equal"],
};
const expectedValues = [];
for (let n = 2; n <= 30; n += 1) {
  if (R.primeFactors(n).every((p) => [2, 3, 5, 7].includes(p))) {
    expectedValues.push(n);
  }
}
assertEqual(R.PRIMES, [2, 3, 5, 7], "prime buttons are 2, 3, 5, 7");
// The tutorial teaches GCD with 12,18 and LCM with 4,6. Neither may be the
// first practice pair: the child proves the method on something new.
assertEqual(
  [R.GUIDED_DECK.gcd[0], R.GUIDED_DECK.lcm[0]],
  [
    [18, 24],
    [6, 8],
  ],
  "neither deck opens with its tutorial pair",
);
assertEqual(
  [
    R.GUIDED_DECK.gcd.indexOf(
      R.GUIDED_DECK.gcd.find((p) => p[0] === 12 && p[1] === 18),
    ),
    R.GUIDED_DECK.lcm.indexOf(
      R.GUIDED_DECK.lcm.find((p) => p[0] === 4 && p[1] === 6),
    ),
  ],
  [7, 7],
  "each tutorial pair closes its deck",
);
// The opener keeps the shape of the pair it replaces, so the first pair's
// cue glow and preview connector behave as before.
for (const [alg, shared, leftA, leftB] of [
  ["gcd", 2, 1, 2],
  ["lcm", 1, 1, 2],
]) {
  const [a, b] = R.GUIDED_DECK[alg][0];
  const fa = R.primeFactors(a);
  const fb = R.primeFactors(b);
  const common = fa.filter((p, i) => fb.indexOf(p) >= 0 && fa.indexOf(p) === i);
  assertEqual(
    [common.length, fa.length - common.length, fb.length - common.length],
    [shared, leftA, leftB],
    `${alg} opener ${a},${b} keeps the deck's opening shape`,
  );
}
assertEqual(
  R.CHALLENGE_VALUES,
  expectedValues,
  "task values are 2..30 with primes 2, 3, 5, 7 only",
);
assertEqual(R.CHALLENGE_VALUES.length, 21, "twenty-one task values");
assertEqual(
  [R.PROOF_RATIO_MAX, R.LCM_TRACK_MAX],
  [9, 72],
  "proof caps: ratio 9, LCM track 72",
);
for (const alg of ["gcd", "lcm"]) {
  const fn = alg === "gcd" ? R.gcd : R.lcm;
  assertEqual(R.GUIDED_DECK[alg].length, 8, `${alg} guided deck has 8 pairs`);
  R.GUIDED_DECK[alg].forEach(([a, b], i) => {
    const [ea, eb, answer] = GUIDED_ANSWERS[alg][i];
    assertEqual([a, b], [ea, eb], `${alg} guided pair ${i + 1} order`);
    assertEqual(fn(a, b), answer, `${alg} guided pair ${i + 1} answer`);
    assert(
      R.proofFits(alg, a, b),
      `${alg} guided pair ${a},${b} fits the proof rule the generator uses`,
    );
  });
  const guidedKeys = new Set(R.GUIDED_DECK[alg].map((p) => p.join(",")));
  CHALLENGE_FIXTURE[alg].forEach((item, i) => {
    const [a, b] = item.pair;
    assert(
      item.choices.includes(fn(a, b)),
      `${alg} fixture ${i + 1} answer is among its choices`,
    );
    assert(
      !guidedKeys.has(item.pair.join(",")),
      `${alg} fixture pair ${item.pair} not in the guided deck`,
    );
    assert(
      R.proofFits(alg, a, b),
      `${alg} fixture pair ${a},${b} fits the proof rule`,
    );
  });
  // slots
  const slots = R.CHALLENGE_SLOTS[alg];
  assertEqual(
    slots.map((x) => x.shape),
    SLOT_SHAPES[alg],
    `${alg} slot shapes`,
  );
  assertEqual(
    slots.map((x) => x.preSplit),
    [false, true, false, true, false],
    `${alg}: slots 2 and 4 are pre-split`,
  );
  assertEqual(
    slots.map((x) => x.context),
    [false, false, true, false, false],
    `${alg}: slot 3 carries the story copy`,
  );
  // pools, exhaustively
  const pools = {};
  for (const shape of ["shared", "coprime", "equal"]) {
    const pool = R.challengePool(alg, shape);
    pools[shape] = pool;
    assert(
      pool.length >= 8,
      `${alg} ${shape} pool holds at least 8 pairs (${pool.length})`,
    );
    const seen = new Set();
    for (const [a, b] of pool) {
      const key = a + "," + b;
      assert(!seen.has(key), `${alg} ${shape} pool: ${key} listed once`);
      seen.add(key);
      assert(
        a <= b && expectedValues.includes(a) && expectedValues.includes(b),
        `${alg} ${shape} pool: ${key} is an ordered pair of task values`,
      );
      assert(!guidedKeys.has(key), `${alg} ${shape} pool: ${key} not guided`);
      const g = R.gcd(a, b);
      assert(
        Math.max(a, b) / g <= 9 && (alg === "gcd" || R.lcm(a, b) <= 72),
        `${alg} ${shape} pool: ${key} within the proof caps`,
      );
      const shapeOk =
        shape === "equal"
          ? a === b && ![2, 3, 5, 7].includes(a)
          : shape === "coprime"
            ? a !== b && g === 1
            : a !== b && g > 1;
      assert(shapeOk, `${alg} ${shape} pool: ${key} has that shape`);
      const answer = fn(a, b);
      const positions = new Set();
      for (let v = 0; v < 3; v += 1) {
        const c = R.challengeChoices(alg, a, b, v);
        assert(
          c.length === 3 &&
            new Set(c).size === 3 &&
            c.every((x) => Number.isInteger(x) && x >= 1) &&
            c[0] < c[1] &&
            c[1] < c[2] &&
            c.includes(answer),
          `${alg} ${key} variant ${v}: three ascending choices, one correct (${c})`,
        );
        positions.add(c.indexOf(answer));
      }
      const below = R.wrongAnswers(alg, a, b, answer).smaller.length;
      assertEqual(
        positions.size,
        Math.min(2, below) + 1,
        `${alg} ${key}: with ${below} wrong value(s) below the answer it takes ${Math.min(2, below) + 1} position(s)`,
      );
    }
  }
  // every valid pair of every shape is in exactly one pool
  let counted = 0;
  for (const a of expectedValues) {
    for (const b of expectedValues) {
      if (a > b || !R.proofFits(alg, a, b) || guidedKeys.has(a + "," + b)) {
        continue;
      }
      if (a === b && [2, 3, 5, 7].includes(a)) {
        continue;
      }
      counted += 1;
    }
  }
  assertEqual(
    pools.shared.length + pools.coprime.length + pools.equal.length,
    counted,
    `${alg}: the pools partition the valid pairs`,
  );
  // decks over many seeds
  const decksSeen = new Set();
  const answerPositions = [0, 0, 0];
  for (let seed = 1; seed <= 300; seed += 1) {
    const deck = R.challengeDeck(alg, seed);
    if (seed <= 5) {
      assertEqual(
        deck,
        R.challengeDeck(alg, seed),
        `${alg} seed ${seed}: the draw is deterministic`,
      );
    }
    assertEqual(deck.length, 5, `${alg} seed ${seed}: five tasks`);
    assertEqual(
      new Set(deck.map((item) => item.pair.join(","))).size,
      5,
      `${alg} seed ${seed}: five distinct pairs`,
    );
    deck.forEach((item, i) => {
      const slot = slots[i];
      assert(
        pools[slot.shape].some(
          (p) => p[0] === item.pair[0] && p[1] === item.pair[1],
        ),
        `${alg} seed ${seed} task ${i + 1}: pair from the ${slot.shape} pool`,
      );
      assertEqual(
        [item.preSplit, item.context],
        [slot.preSplit, slot.context],
        `${alg} seed ${seed} task ${i + 1}: slot flags`,
      );
      assert(
        [0, 1, 2].some(
          (v) =>
            JSON.stringify(
              R.challengeChoices(alg, item.pair[0], item.pair[1], v),
            ) === JSON.stringify(item.choices),
        ),
        `${alg} seed ${seed} task ${i + 1}: choices are one of the variants`,
      );
    });
    answerPositions[deck[0].choices.indexOf(fn(...deck[0].pair))] += 1;
    decksSeen.add(JSON.stringify(deck.map((item) => item.pair)));
  }
  assert(
    decksSeen.size >= 200,
    `${alg}: 300 seeds draw at least 200 distinct decks (${decksSeen.size})`,
  );
  assert(
    answerPositions.every((n) => n >= 30),
    `${alg}: over 300 seeds the first task's answer sits in every position at least 30 times (${answerPositions})`,
  );
  console.log(
    `${alg} pools: shared ${pools.shared.length}, coprime ${pools.coprime.length}, equal ${pools.equal.length}; distinct decks over 300 seeds: ${decksSeen.size}`,
  );
}
// seededRandom: unit interval, deterministic, seed-sensitive
{
  const a = R.seededRandom(42);
  const b = R.seededRandom(42);
  const c = R.seededRandom(43);
  const xs = [];
  for (let i = 0; i < 1000; i += 1) {
    xs.push(a());
  }
  assert(
    xs.every((x) => x >= 0 && x < 1),
    "seededRandom stays within [0, 1)",
  );
  assertEqual(xs.slice(0, 5), [b(), b(), b(), b(), b()], "same seed, same run");
  assert(xs[0] !== c(), "different seed, different first value");
  assertEqual(
    R.challengeDeck("gcd", 7.9).map((i) => i.pair),
    R.challengeDeck("gcd", 7).map((i) => i.pair),
    "a fractional seed truncates",
  );
}

// ---- helpers to drive a record ----
function rec(alg, a, b, opts = {}) {
  return R.makeRecord({
    algorithm: alg,
    experience: opts.experience || "guided",
    taskIndex: 0,
    a,
    b,
    preSplit: !!opts.preSplit,
    choices: opts.choices || null,
    context: false,
  });
}
function splitAll(r, order) {
  // order: optional explicit prime sequence; default lowest valid prime each time
  let i = 0;
  while (R.activeRow(r) >= 0) {
    const p = order ? order[i] : R.validPrimes(r)[0];
    const ev = R.applySplit(r, p, false);
    if (ev.type !== "split")
      throw new Error(`split ${p} rejected: ${JSON.stringify(ev)}`);
    i += 1;
  }
}
function pairAll(r) {
  for (;;) {
    const pp = R.possiblePairs(r);
    if (pp.length === 0) return;
    R.selectTile(r, pp[0].a);
    const ev = R.selectTile(r, pp[0].b);
    if (ev.type !== "pair")
      throw new Error(`pair failed: ${JSON.stringify(ev)}`);
  }
}
function addAll(r) {
  for (const t of R.pendingLeftovers(r)) {
    const ev = R.selectTile(r, t.id);
    if (ev.type !== "leftover")
      throw new Error(`leftover failed: ${JSON.stringify(ev)}`);
  }
}
function tilesOf(r, row) {
  return r.tiles[row].map((t) => t.p);
}

// ---- every valid split order for 8,12 ends with the same sorted tiles ----
// The taps a child actually makes: a split whose remainder is prime closes
// the row itself, so no sequence ever ends by naming that prime again.
function splitSequences(n) {
  if (n === 1) return [[]];
  const out = [];
  for (const p of [2, 3, 5, 7]) {
    if (n % p === 0) {
      const q = n / p;
      if (q === 1 || R.primeFactors(q).length === 1) {
        out.push([p]);
      } else {
        for (const rest of splitSequences(q)) out.push([p, ...rest]);
      }
    }
  }
  return out;
}
// The line is a record of what the child did, so a tile lands where it was
// made and never moves: each tap's prime, then the remainder the row closes
// itself with.
function issueOrder(n, seq) {
  const out = [];
  let q = n;
  for (const p of seq) {
    out.push(p);
    q /= p;
    if (q !== 1 && R.primeFactors(q).length === 1) {
      out.push(q);
      q = 1;
    }
  }
  return out;
}
{
  let orders = 0;
  for (const sa of splitSequences(8)) {
    for (const sb of splitSequences(12)) {
      const r = rec("gcd", 8, 12);
      splitAll(r, [...sa, ...sb]);
      orders += 1;
      assertEqual(
        tilesOf(r, 0),
        issueOrder(8, sa),
        `8 tiles keep the order the child made them: ${sa}`,
      );
      assertEqual(
        tilesOf(r, 1),
        issueOrder(12, sb),
        `12 tiles keep the order the child made them: ${sb}`,
      );
      assertEqual(
        tilesOf(r, 1).slice().sort((x, y) => x - y),
        [2, 2, 3],
        `12 is still 2 × 2 × 3 whatever the order: ${sb}`,
      );
      assertEqual(R.derivePhase(r), "assemble", "both quotients 1 → assemble");
      pairAll(r);
      assertEqual(R.shelfTiles(r).shared, [2, 2], "8,12 shares two 2s");
      assertEqual(R.checkResult(r).value, 4, "GCD(8,12) = 4");
    }
  }
  assertEqual(orders, 3, "8,12 has 1 × 3 valid split orders");
}

// ---- tutorial examples and the §4.2 worked example ----
{
  const r = rec("gcd", 12, 18, { experience: "tutorial" });
  assertEqual(R.validPrimes(r), [2, 3], "12 accepts 2 or 3");
  assertEqual(R.applySplit(r, 2, false).q, 6, "12 ÷ 2 = 6");
  assertEqual(R.activeRow(r), 0, "A stays active while its quotient > 1");
  splitAll(r);
  assertEqual(
    [tilesOf(r, 0), tilesOf(r, 1)],
    [
      [2, 2, 3],
      [2, 3, 3],
    ],
    "12 and 18 prime tiles",
  );
  assertEqual(
    R.possiblePairs(r).map((p) => p.p),
    [2, 3],
    "possible pairs lowest first",
  );
  pairAll(r);
  assertEqual(
    R.shelfTiles(r),
    { shared: [2, 3], leftovers: [] },
    "12,18 shared shelf 2,3",
  );
  assert(R.isCompleteShelf(r), "GCD shelf complete once every pair is made");
  assertEqual(R.checkResult(r).value, 6, "GCD(12,18) = 6");
  assertEqual(R.derivePhase(r), "result", "solved → result");
  assert(!R.canUndo(r), "undo disabled after success");
  assertEqual(R.undo(r).type, "noop", "undo after success is a no-op");
}
{
  const r = rec("lcm", 12, 18);
  splitAll(r);
  pairAll(r);
  assert(!R.isCompleteShelf(r), "LCM shelf incomplete before leftovers");
  assertEqual(
    R.checkResult(r),
    { type: "incomplete", key: "missingLeftover", vars: { p: 2 } },
    "lowest leftover first",
  );
  assert(R.leftoverPhase(r), "leftover phase once no pair remains");
  const free = R.pendingLeftovers(r);
  assertEqual(
    free.map((t) => [t.p, t.row]),
    [
      [2, 0],
      [3, 1],
    ],
    "leftovers: 2 from A, 3 from B",
  );
  assert(
    R.tileEnabled(r, free[0]) && R.tileEnabled(r, free[1]),
    "leftover tiles are one-tap add buttons",
  );
  assertEqual(R.selectTile(r, free[1].id).type, "leftover", "leftover 3 added");
  assertEqual(
    R.checkResult(r),
    { type: "incomplete", key: "missingLeftover", vars: { p: 2 } },
    "remaining leftover 2",
  );
  assertEqual(
    R.selectTile(r, free[1].id).type,
    "noop",
    "a leftover can be added only once",
  );
  assertEqual(R.selectTile(r, free[0].id).type, "leftover", "leftover 2 added");
  assertEqual(
    R.shelfTiles(r),
    { shared: [2, 3], leftovers: [2, 3] },
    "12,18 LCM shelf",
  );
  assertEqual(R.checkResult(r).value, 36, "LCM(12,18) = 36");
}
{
  const r = rec("lcm", 4, 6, { experience: "tutorial", preSplit: true });
  assertEqual(
    R.derivePhase(r),
    "assemble",
    "tutorial scene 2 starts pre-split",
  );
  assertEqual(
    [tilesOf(r, 0), tilesOf(r, 1)],
    [
      [2, 2],
      [2, 3],
    ],
    "4 = 2 × 2, 6 = 2 × 3",
  );
  pairAll(r);
  addAll(r);
  assertEqual(R.shelfTiles(r), { shared: [2], leftovers: [2, 3] }, "2 × 2 × 3");
  assertEqual(R.checkResult(r).value, 12, "LCM(4,6) = 12");
}

// ---- R1: the "No shared tiles" sentence only when no pair can be made ----
{
  const g = rec("gcd", 6, 10);
  assert(!R.showNoSharedMessage(g), "split phase: no empty-shelf sentence");
  splitAll(g);
  assert(
    !R.showNoSharedMessage(g),
    "6,10 before pairing: sentence absent while a 2 pair remains",
  );
  pairAll(g);
  assert(
    !R.showNoSharedMessage(g),
    "6,10 after pairing: shelf non-empty, sentence absent",
  );
  const h = rec("gcd", 12, 18);
  splitAll(h);
  assert(!R.showNoSharedMessage(h), "12,18 before pairing: sentence absent");
  const c = rec("gcd", 8, 9);
  splitAll(c);
  assert(R.showNoSharedMessage(c), "8,9 coprime: sentence present");
  assertEqual(R.checkResult(c).value, 1, "8,9 empty shelf still checks to 1");
  const l = rec("lcm", 8, 9);
  splitAll(l);
  assert(
    !R.showNoSharedMessage(l),
    "LCM never shows the GCD empty-shelf sentence",
  );
}

// ---- edge inputs ----
{
  const g = rec("gcd", 8, 9);
  splitAll(g);
  assertEqual(R.derivePhase(g), "assemble", "coprime GCD enters assemble");
  assert(!R.hasPossiblePair(g), "coprime: no possible pair");
  assert(
    g.tiles.every((row) => row.every((t) => !R.tileEnabled(g, t))),
    "coprime GCD tiles are passive",
  );
  assert(R.isCompleteShelf(g), "empty GCD shelf is complete");
  assertEqual(R.shelfProduct(g), 1, "empty product is 1");
  assertEqual(R.checkResult(g).value, 1, "GCD(8,9) = 1");
  const l = rec("lcm", 8, 9);
  splitAll(l);
  assertEqual(
    R.checkResult(l),
    { type: "incomplete", key: "missingLeftover", vars: { p: 2 } },
    "coprime LCM needs all tiles",
  );
  addAll(l);
  assertEqual(
    R.shelfTiles(l),
    { shared: [], leftovers: [2, 2, 2, 3, 3] },
    "all five tiles in the LCM result",
  );
  assertEqual(R.checkResult(l).value, 72, "LCM(8,9) = 72");
}
{
  const g = rec("gcd", 12, 12);
  splitAll(g);
  pairAll(g);
  assertEqual(
    R.shelfTiles(g).shared,
    [2, 2, 3],
    "equal inputs: every tile pairs",
  );
  assertEqual(R.checkResult(g).value, 12, "GCD(12,12) = 12");
  const l = rec("lcm", 12, 12);
  splitAll(l);
  pairAll(l);
  assertEqual(R.pendingLeftovers(l), [], "equal inputs: LCM has no leftovers");
  assert(R.isCompleteShelf(l), "LCM shelf complete with no leftovers");
  assertEqual(R.checkResult(l).value, 12, "LCM(12,12) = 12");
}
{
  const l = rec("lcm", 5, 20);
  assertEqual(R.validPrimes(l), [5], "5 must still be split explicitly");
  splitAll(l);
  pairAll(l);
  addAll(l);
  assertEqual(
    R.shelfTiles(l),
    { shared: [5], leftovers: [2, 2] },
    "5,20 shelf",
  );
  assertEqual(R.checkResult(l).value, 20, "LCM(5,20) = 20");
}

// ---- invalid actions leave state unchanged ----
{
  const r = rec("gcd", 12, 18);
  const before = JSON.stringify(r);
  assertEqual(
    R.applySplit(r, 5, false),
    { type: "invalid", key: "invalidPrime", vars: { p: 5, n: 12 } },
    "5 does not divide 12",
  );
  assertEqual(
    R.applySplit(r, 7, false).type,
    "invalid",
    "non-button primes are rejected",
  );
  assertEqual(JSON.stringify(r), before, "invalid split changes nothing");
  splitAll(r);
  const a2 = r.tiles[0].find((t) => t.p === 2);
  const a3 = r.tiles[0].find((t) => t.p === 3);
  const b3 = r.tiles[1].find((t) => t.p === 3);
  assert(R.tileEnabled(r, b3), "a matchable B tile is tappable first");
  assertEqual(
    R.selectTile(r, b3.id),
    { type: "select", p: 3, tileId: b3.id },
    "B tile can start a pair",
  );
  assertEqual(
    R.selectTile(r, b3.id),
    { type: "deselect", tileId: b3.id },
    "tapping the pending B tile deselects it",
  );
  assertEqual(
    R.selectTile(r, a2.id),
    { type: "select", p: 2, tileId: a2.id },
    "select A 2",
  );
  assert(
    r.tiles[1].every((t) => R.tileEnabled(r, t)),
    "every unpaired B tile is tappable after selecting A",
  );
  assert(
    R.tileEnabled(r, a3),
    "same-row matchable tile stays tappable while A 2 is pending",
  );
  assertEqual(
    R.selectTile(r, b3.id),
    { type: "invalid", key: "wrongPair", vars: { p: 2 }, tileId: b3.id },
    "2 with 3 → wrongPair",
  );
  assertEqual(r.pending, null, "wrong pair clears the pending selection only");
  assertEqual(r.pairs.length, 0, "wrong pair makes no pair");
  assertEqual(
    R.checkResult(r),
    { type: "incomplete", key: "missingPair", vars: { p: 2 } },
    "early check names the lowest unmade pair",
  );
  R.selectTile(r, a3.id);
  assertEqual(R.selectTile(r, b3.id).type, "pair", "3 with 3 pairs");
  assertEqual(
    R.checkResult(r),
    { type: "incomplete", key: "missingPair", vars: { p: 2 } },
    "remaining pair 2 reported",
  );
  assertEqual(R.selectTile(r, a2.id).type, "select", "select A 2 again");
  assertEqual(
    R.selectTile(r, a2.id).type,
    "deselect",
    "tapping the selected tile deselects",
  );
}

// ---- D1: bidirectional tap selection ----
{
  const r = rec("gcd", 12, 18); // A: 2,2,3  B: 2,3,3
  splitAll(r);
  const a2 = r.tiles[0].filter((t) => t.p === 2);
  const a3 = r.tiles[0].find((t) => t.p === 3);
  const b2 = r.tiles[1].find((t) => t.p === 2);
  const b3 = r.tiles[1].filter((t) => t.p === 3);
  assert(
    R.isMatchable(r, b2) && R.isMatchable(r, b3[0]),
    "B tiles are matchable",
  );
  assertEqual(R.selectTile(r, b2.id).type, "select", "B-first: select B 2");
  assertEqual(
    R.hintTarget(r),
    { type: "pair", p: 2, tileId: a2[0].id, row: 0 },
    "hint with a pending B tile points at row A",
  );
  assertEqual(
    R.selectTile(r, b3[0].id).type,
    "select",
    "same-row matchable tap replaces the selection",
  );
  assertEqual(r.pending, b3[0].id, "pending moved to B 3");
  assertEqual(
    R.selectTile(r, a2[0].id),
    { type: "invalid", key: "wrongPair", vars: { p: 3 }, tileId: a2[0].id },
    "B-first wrong prime → wrongPair names the pending prime",
  );
  assertEqual(r.pending, null, "tap wrong pair clears pending");
  R.selectTile(r, b3[0].id);
  const ev = R.selectTile(r, a3.id);
  assertEqual(ev, { type: "pair", p: 3 }, "B-first pair commits");
  assertEqual(
    [r.pairs[0].a, r.pairs[0].b],
    [a3.id, b3[0].id],
    "pair record keeps a = row A, b = row B regardless of tap order",
  );
  assertEqual(
    r.history.length,
    1 + 4,
    "one snapshot per split plus one per pair, and a prime remainder costs no extra split",
  );
  // remaining: A 2,2 vs B 2 (one 2 pair) and B 3 with no A 3 left
  assert(!R.isMatchable(r, b3[1]), "the second B 3 has no mate");
  assert(
    !R.tileEnabled(r, b3[1]),
    "unmatchable B 3 is disabled with nothing pending",
  );
  R.selectTile(r, a2[0].id);
  assert(
    R.tileEnabled(r, b3[1]),
    "with A 2 pending the unmatchable B 3 is tappable (for the wrongPair explanation)",
  );
  assert(
    R.tileEnabled(r, a2[1]) && !R.tileEnabled(r, a3),
    "same-row: matchable stays enabled, paired stays disabled",
  );
  assertEqual(R.undo(r).type, "deselect", "undo clears a pending A selection");
  R.selectTile(r, b2.id);
  assertEqual(
    R.undo(r),
    { type: "deselect", tileId: b2.id },
    "undo clears a pending B selection",
  );
}

// ---- D1: drag drops share the tap transitions ----
{
  const r = rec("gcd", 12, 18);
  splitAll(r);
  const a2 = r.tiles[0].filter((t) => t.p === 2);
  const a3 = r.tiles[0].find((t) => t.p === 3);
  const b2 = r.tiles[1].find((t) => t.p === 2);
  const b3 = r.tiles[1].filter((t) => t.p === 3);
  const snapshot = () =>
    JSON.stringify([
      r.tiles,
      r.pairs,
      r.pending,
      r.assisted,
      r.failedSubmission,
      r.history.length,
    ]);
  const before = snapshot();
  assertEqual(
    R.dropTile(r, a2[0].id, a2[1].id),
    { type: "cancel" },
    "same-row drop cancels",
  );
  assertEqual(
    R.dropTile(r, a2[0].id, "nope"),
    { type: "cancel" },
    "drop with no target cancels",
  );
  assertEqual(
    R.dropLeftover(r, a2[0].id),
    { type: "cancel" },
    "GCD has no leftover shelf drop",
  );
  assertEqual(snapshot(), before, "cancelled drops mutate nothing");
  R.selectTile(r, b2.id); // pending tap selection stays through an invalid drop
  assertEqual(
    R.dropTile(r, a2[0].id, b3[0].id),
    { type: "invalid", key: "wrongPair", vars: { p: 2 }, tileId: a2[0].id },
    "wrong-prime drop → wrongPair with the source prime",
  );
  assertEqual(r.pending, b2.id, "invalid drop keeps the pending tap selection");
  assertEqual(r.pairs.length, 0, "invalid drop commits nothing");
  const h0 = r.history.length;
  assertEqual(
    R.dropTile(r, b3[0].id, a3.id),
    { type: "pair", p: 3 },
    "B→A drag pairs",
  );
  assertEqual(
    [r.pairs[0].a, r.pairs[0].b],
    [a3.id, b3[0].id],
    "drag pair record keeps a = row A",
  );
  assertEqual(r.pending, null, "a committed drag clears the pending selection");
  assertEqual(r.history.length, h0 + 1, "one undo snapshot per drag pair");
  assertEqual(
    R.dropTile(r, b3[0].id, a3.id),
    { type: "cancel" },
    "repeating the same drop is a cancel",
  );
  assertEqual(r.history.length, h0 + 1, "duplicate drop adds no snapshot");
  assertEqual(
    R.dropTile(r, a2[0].id, b2.id),
    { type: "pair", p: 2 },
    "A→B drag pairs",
  );
  assertEqual(R.undo(r).type, "undo", "undo reverts the drag pair");
  assertEqual(r.pairs.length, 1, "one pair left after undo");
  assertEqual(
    R.dropTile(r, b2.id, a2[1].id),
    { type: "pair", p: 2 },
    "redo by dragging the other A 2",
  );
  assertEqual(
    R.dropTile(r, b3[1].id, a2[0].id),
    { type: "cancel" },
    "an unmatchable source cannot be dropped",
  );
  assertEqual(R.checkResult(r).value, 6, "drag-built shelf checks to 6");
  assertEqual(
    [r.assisted, r.failedSubmission],
    [false, false],
    "drags never mark help or failure",
  );
}
{
  const r = rec("lcm", 12, 18);
  splitAll(r);
  const a2 = r.tiles[0].filter((t) => t.p === 2);
  const b3 = r.tiles[1].filter((t) => t.p === 3);
  assertEqual(
    R.dropLeftover(r, a2[0].id),
    { type: "cancel" },
    "leftover drop is inert while a pair remains",
  );
  pairAll(r);
  assert(R.leftoverPhase(r), "leftover phase");
  const lo = R.pendingLeftovers(r);
  assertEqual(
    lo.map((t) => t.p),
    [2, 3],
    "leftovers 2 (A) and 3 (B)",
  );
  const h0 = r.history.length;
  assertEqual(
    R.dropLeftover(r, lo[0].id),
    { type: "leftover", p: 2, row: 0 },
    "drag A 2 to Left over",
  );
  assertEqual(
    R.dropLeftover(r, lo[0].id),
    { type: "cancel" },
    "dropping an added tile again cancels",
  );
  assertEqual(r.history.length, h0 + 1, "one snapshot for the leftover drop");
  assertEqual(
    R.dropTile(r, lo[1].id, a2[0].id),
    { type: "cancel" },
    "no pair drops in the leftover phase",
  );
  assertEqual(
    R.dropLeftover(r, lo[1].id),
    { type: "leftover", p: 3, row: 1 },
    "drag B 3 to Left over",
  );
  assertEqual(R.undo(r).type, "undo", "undo reverts the leftover drop");
  assertEqual(R.pendingLeftovers(r).length, 1, "one leftover pending again");
  const again = R.pendingLeftovers(r)[0];
  assertEqual(
    R.dropLeftover(r, again.id),
    { type: "leftover", p: 3, row: 1 },
    "drag B 3 to Left over again",
  );
  assertEqual([lo[1].p, lo[1].row], [3, 1], "second leftover is B 3");
  assertEqual(R.checkResult(r).value, 36, "LCM 36 via drags");
}
{
  // Challenge: a drag-built board with a first-try correct submission stays independent.
  const r = challenge("gcd", 0); // 6,10 → 2
  splitAll(r);
  const pp = R.possiblePairs(r);
  assertEqual(
    R.dropTile(r, pp[0].b, pp[0].a),
    { type: "pair", p: 2 },
    "B→A drag in Challenge",
  );
  R.chooseAnswer(r, 2);
  const ev = R.submitAnswer(r);
  assertEqual(
    [ev.type, ev.value, ev.independent],
    ["solved", 2, true],
    "drag pair + correct submit → independent",
  );
  assertEqual(
    R.dropTile(r, pp[0].b, pp[0].a),
    { type: "cancel" },
    "no drops after solving",
  );
}

// ---- review additions: mateFor invariant, hints with a pending B tile, mixed tap/drag ----
{
  const r = rec("gcd", 12, 18); // A: 2,2,3  B: 2,3,3
  splitAll(r);
  const a2 = r.tiles[0].filter((t) => t.p === 2);
  const a3 = r.tiles[0].find((t) => t.p === 3);
  const b2 = r.tiles[1].find((t) => t.p === 2);
  const b3 = r.tiles[1].filter((t) => t.p === 3);
  // hint tiers with a pending B tile on a repeated-prime board
  R.selectTile(r, b3[1].id);
  assertEqual(R.pressHint(r).key, "assembleHint1", "tier 1 with pending B 3");
  assertEqual(
    R.pressHint(r),
    {
      type: "hint",
      tier: 2,
      key: "assembleHint2",
      vars: { p: 3, n: 12 },
      target: { type: "pair", p: 3, tileId: a3.id, row: 0 },
    },
    "tier 2 with pending B 3 points at the A 3 and names 12",
  );
  assertEqual(R.pressHint(r).tier, 3, "tier 3 unlocks the step");
  assertEqual(
    R.applyHintStep(r),
    { type: "pair", p: 3 },
    "show one step pairs the pending B 3 with A 3",
  );
  assertEqual(
    [r.pairs[0].a, r.pairs[0].b, r.pending, r.hintTier],
    [a3.id, b3[1].id, null, 0],
    "step keeps a = row A, clears pending and the hint tier",
  );
  assert(r.assisted, "hints mark the record as assisted");
  // mateFor invariant
  assertEqual(
    R.mateFor(r, b3[0]),
    undefined,
    "mateFor is undefined for the now-unmatchable B 3",
  );
  assert(
    !R.isMatchable(r, b3[0]) && !R.tileEnabled(r, b3[0]),
    "unmatchable tile is neither matchable nor enabled",
  );
  // mixed tap then drag, both directions, on the repeated 2s
  assertEqual(R.selectTile(r, a2[0].id).type, "select", "tap A 2 (first)");
  assertEqual(
    R.dropTile(r, b2.id, a2[1].id),
    { type: "pair", p: 2 },
    "drag B 2 onto the OTHER A 2 while the first is pending",
  );
  assertEqual(
    [r.pairs[1].a, r.pairs[1].b, r.pending],
    [a2[1].id, b2.id, null],
    "drag pair used the drop target and cleared the pending tap",
  );
  assertEqual(R.undo(r).type, "undo", "undo the drag pair");
  assertEqual(R.selectTile(r, b2.id).type, "select", "tap B 2");
  assertEqual(
    R.dropTile(r, a2[0].id, b2.id),
    { type: "pair", p: 2 },
    "drag A 2 onto the pending B 2",
  );
  assertEqual(
    [r.pairs[1].a, r.pairs[1].b, r.pending],
    [a2[0].id, b2.id, null],
    "A→B drag onto the pending tile commits once",
  );
  assertEqual(R.checkResult(r).value, 6, "12,18 → 6 via mixed input");
}

// ---- review additions: empty-shelf sentence across pair/undo ----
{
  const r = rec("gcd", 6, 10);
  splitAll(r);
  assert(!R.showNoSharedMessage(r), "6,10: absent before pairing");
  const pp = R.possiblePairs(r);
  R.dropTile(r, pp[0].b, pp[0].a);
  assert(!R.showNoSharedMessage(r), "6,10: absent with the pair on the shelf");
  R.undo(r);
  assert(
    !R.showNoSharedMessage(r) && R.hasPossiblePair(r),
    "6,10: still absent after undo (pair possible again)",
  );
  const c = rec("gcd", 8, 9);
  splitAll(c);
  assert(R.showNoSharedMessage(c), "8,9: present");
  R.undo(c);
  assert(
    !R.showNoSharedMessage(c),
    "8,9: absent again once the split is undone",
  );
}

// ---- review additions: LCM Challenge entirely by drops, with a cancelled drop before submit ----
{
  const r = challenge("lcm", 0); // 6,10 → 30
  splitAll(r);
  const pp = R.possiblePairs(r);
  assertEqual(
    R.dropTile(r, pp[0].a, pp[0].a),
    { type: "cancel" },
    "self-drop cancels",
  );
  assertEqual(
    R.dropTile(r, pp[0].b, pp[0].a),
    { type: "pair", p: 2 },
    "B→A drop pairs the 2s",
  );
  assertEqual(
    R.dropLeftover(r, pp[0].a),
    { type: "cancel" },
    "paired tile cannot be a leftover",
  );
  const lo = R.pendingLeftovers(r);
  assertEqual(
    lo.map((t) => t.p),
    [3, 5],
    "leftovers 3 and 5",
  );
  assertEqual(R.dropLeftover(r, lo[0].id).type, "leftover", "drop 3");
  assertEqual(
    R.dropLeftover(r, lo[0].id),
    { type: "cancel" },
    "dropping 3 again cancels",
  );
  assertEqual(R.dropLeftover(r, lo[1].id).type, "leftover", "drop 5");
  assertEqual(R.chooseAnswer(r, 30).type, "choice", "choose 30");
  const ev = R.submitAnswer(r);
  assertEqual(
    [ev.type, ev.value, ev.independent, r.assisted, r.failedSubmission],
    ["solved", 30, true, false, false],
    "LCM Challenge by drops scores as independent",
  );
}

// ---- second revision: prime drops, Shared-shelf drops, flow step ----
{
  const r = rec("gcd", 12, 18);
  const before = JSON.stringify(r);
  assertEqual(R.flowStep(r), 0, "fresh board: Split A");
  assertEqual(
    R.dropPrime(r, 2, 1),
    { type: "cancel" },
    "prime dropped on the inactive B rail cancels",
  );
  assertEqual(
    R.dropPrime(r, 5, 0),
    { type: "invalid", key: "invalidPrime", vars: { p: 5, n: 12 } },
    "non-dividing prime on the active rail → invalidPrime",
  );
  assertEqual(
    JSON.stringify(r),
    before,
    "cancelled and invalid prime drops mutate nothing",
  );
  const ev = R.dropPrime(r, 2, 0);
  assertEqual(
    [ev.type, ev.n, ev.p, ev.q, r.history.length],
    ["split", 12, 2, 6, 1],
    "prime drop on the active rail splits with one snapshot",
  );
  assertEqual(R.flowStep(r), 0, "still Split A while A's quotient is above 1");
  R.dropPrime(r, 2, 0);
  R.dropPrime(r, 3, 0);
  assertEqual([R.activeRow(r), R.flowStep(r)], [1, 1], "A done: Split B");
  assertEqual(
    R.dropPrime(r, 2, 0),
    { type: "cancel" },
    "A's rail is inactive once A is split",
  );
  splitAll(r);
  assertEqual(R.flowStep(r), 2, "pairs possible: Match");
  assertEqual(
    R.dropPrime(r, 2, 0),
    { type: "cancel" },
    "no prime drops outside split",
  );
  // Shared-shelf drops
  const a2 = r.tiles[0].filter((t) => t.p === 2);
  const b2 = r.tiles[1].find((t) => t.p === 2);
  const b3 = r.tiles[1].filter((t) => t.p === 3);
  R.selectTile(r, b3[0].id); // pending tap in the opposite row survives nothing: a shared drop commits and clears it
  const h0 = r.history.length;
  assertEqual(
    R.dropOnShared(r, a2[1].id),
    { type: "pair", p: 2 },
    "second A 2 dropped on Shared pairs with B 2",
  );
  assertEqual(
    [r.pairs[0].a, r.pairs[0].b, r.pending, r.history.length],
    [a2[1].id, b2.id, null, h0 + 1],
    "shared drop used the mate, cleared pending, one snapshot",
  );
  assertEqual(
    R.dropOnShared(r, a2[0].id),
    { type: "cancel" },
    "the remaining A 2 has no mate: shared drop cancels",
  );
  assertEqual(
    R.dropOnShared(r, b3[0].id),
    { type: "pair", p: 3 },
    "B 3 dropped on Shared pairs with A 3",
  );
  assertEqual(R.flowStep(r), 3, "no pair left: Multiply");
  assertEqual(
    R.dropOnShared(r, b3[1].id),
    { type: "cancel" },
    "no shared drops once no pair is possible",
  );
  assertEqual(R.checkResult(r).value, 6, "12,18 → 6");
  assertEqual(R.flowStep(r), 4, "result: Result block");
}
{
  const c = rec("gcd", 8, 9);
  splitAll(c);
  assertEqual(R.flowStep(c), 3, "coprime 8,9 jumps from Split B to Multiply");
  const e = rec("lcm", 12, 12);
  splitAll(e);
  assertEqual(R.flowStep(e), 2, "12,12: Match");
  pairAll(e);
  assertEqual(
    [R.flowStep(e), R.pendingLeftovers(e).length],
    [3, 0],
    "12,12 LCM: Multiply with no leftovers",
  );
  const l = rec("lcm", 4, 6);
  splitAll(l);
  pairAll(l);
  assertEqual(
    R.flowStep(l),
    3,
    "LCM leftover phase sits in the Multiply block",
  );
  const lo = R.pendingLeftovers(l);
  assertEqual(
    R.dropOnShared(l, lo[0].id),
    { type: "cancel" },
    "leftovers never drop on Shared",
  );
  addAll(l);
  assertEqual(R.flowStep(l), 3, "complete shelf: still Multiply until checked");
  R.checkResult(l);
  assertEqual(R.flowStep(l), 4, "checked: Result");
}
{
  const t = R.makeRecord(
    R.taskSpec("gcd", "challenge", 1, CHALLENGE_FIXTURE.gcd),
  ); // 9,12 pre-split
  assertEqual(R.flowStep(t), 2, "pre-split Challenge opens at Match");
  assertEqual(
    R.dropPrime(t, 3, 0),
    { type: "cancel" },
    "no prime drop on a pre-split board",
  );
}

// ---- flowchart rules: graph shape, sandbox hygiene ----
{
  const rulesSource = sliceBetween("// [rules:start]", "// [rules:end]");
  assert(
    !/\bnew (Set|Map)\b|\bJSON\.|\bDate\./.test(rulesSource),
    "rules block uses no Set, Map, JSON or Date (sandbox has none)",
  );
  assert(R.FLOW_NODES.length <= 8, "at most eight nodes");
  assertEqual(R.FLOW_EDGES.length, 11, "eleven edges");
  assert(
    !R.FLOW_NODES.includes("branch"),
    "no node asks which algorithm is running",
  );
  for (const e of R.FLOW_EDGES) {
    assert(
      R.FLOW_NODES.includes(e.from) && R.FLOW_NODES.includes(e.to),
      `edge ${e.from}>${e.to} joins known nodes`,
    );
  }
  // Each algorithm is one path: numbers in, steps, result.
  for (const alg of ["gcd", "lcm"]) {
    const nodes = R.flowNodesFor(alg);
    const edges = R.flowEdgesFor(alg);
    assertEqual(
      nodes,
      alg === "lcm"
        ? [
            "splitA",
            "stopA",
            "splitB",
            "stopB",
            "match",
            "pair",
            "leftovers",
            "multiply",
          ]
        : ["splitA", "stopA", "splitB", "stopB", "match", "pair", "multiply"],
      `${alg} path`,
    );
    for (const e of edges) {
      assert(
        nodes.includes(e.from) && nodes.includes(e.to),
        `${alg} edge ${e.from}>${e.to} stays on its own path`,
      );
    }
    for (const id of nodes) {
      const out = edges.filter((e) => e.from === id);
      if (R.FLOW_KIND[id] === "decision") {
        assertEqual(out.length, 2, `${alg} decision ${id} has two edges`);
        assert(
          out[0].answer !== out[1].answer,
          `${alg} decision ${id} answers differ`,
        );
      } else if (id === "multiply") {
        assertEqual(out.length, 0, `${alg}: multiply is the output node`);
      } else {
        assertEqual(out.length, 1, `${alg} action ${id} has one edge`);
      }
    }
    const seen = ["splitA"];
    for (let i = 0; i < seen.length; i += 1) {
      for (const e of edges) {
        if (e.from === seen[i] && !seen.includes(e.to)) seen.push(e.to);
      }
    }
    assertEqual(seen.length, nodes.length, `${alg}: every node reachable`);
  }
}

// ---- flowchart walk over every deck task and every split order ----
function flowSnap(r) {
  return JSON.stringify([R.flowNode(r), R.flowEdges(r)]);
}
// The app no longer renders the divisibility lines, so the checker owns the
// rule: a shelf that claims to be the GCD must divide both inputs, and one
// that claims to be the LCM must be divisible by both. Computing it here
// rather than calling the app's own helper makes this a real cross-check of
// the answer instead of the app agreeing with itself.
function divisibility(r) {
  const value = R.shelfProduct(r);
  const lines = [r.a, r.b].map((n) =>
    r.algorithm === "gcd"
      ? { left: n, right: value, quotient: n / value, holds: n % value === 0 }
      : { left: value, right: n, quotient: value / n, holds: value % n === 0 },
  );
  return { value, lines, holds: lines.every((l) => l.holds) };
}

function assertFlowState(r, label) {
  const info = R.flowNode(r);
  const phase = R.derivePhase(r);
  const currents = R.FLOW_NODES.filter((id) => info.states[id] === "current");
  assertEqual(
    currents.length,
    phase === "result" ? 0 : 1,
    `${label}: one current node (${currents.join()})`,
  );
  if (phase !== "result")
    assertEqual(
      info.states[info.node],
      "current",
      `${label}: node is the current one`,
    );
  else
    assertEqual(
      [info.node, info.states.multiply, info.next],
      ["multiply", "done", null],
      `${label}: result shows multiply done`,
    );
  assert(
    R.splitInvariant(r, 0).holds && R.splitInvariant(r, 1).holds,
    `${label}: split invariants hold`,
  );
  const mi = divisibility(r);
  const expectHolds = r.algorithm === "gcd" ? true : R.isCompleteShelf(r);
  assertEqual(
    mi.holds,
    expectHolds,
    `${label}: match invariant (${r.algorithm}) ${mi.value}`,
  );
  if (r.algorithm === "gcd")
    assert(
      mi.lines.every((l) => Number.isInteger(l.quotient)),
      `${label}: GCD quotients are whole`,
    );
  // taken edges form a walk from the start to the displayed node
  const edges = R.flowEdges(r);
  const start = r.preSplit ? "match" : "splitA";
  const reach = [start];
  for (let i = 0; i < reach.length; i += 1) {
    for (const e of edges)
      if (e.taken && e.from === reach[i] && !reach.includes(e.to))
        reach.push(e.to);
  }
  const target =
    info.node === "multiply" && phase !== "result" && !R.isCompleteShelf(r)
      ? null
      : info.node;
  if (target && (phase === "result" || info.prev !== null))
    assert(
      reach.includes(target) || info.prev === null,
      `${label}: ${target} reachable over taken edges`,
    );
  for (const e of edges)
    if (e.taken)
      assert(
        reach.includes(e.from),
        `${label}: taken edge ${e.from}>${e.to} hangs off the walk`,
      );
  assertEqual(
    edges.filter((e) => e.entry).length,
    info.prev === null || phase === "result" ? 0 : 1,
    `${label}: exactly one entry edge, none in result`,
  );
  return info;
}
function roundTrip(r, label, act) {
  const before = flowSnap(r);
  const ev = act();
  const after = flowSnap(r);
  assertEqual(R.undo(r).type, "undo", `${label}: undo`);
  assertEqual(flowSnap(r), before, `${label}: undo restores the chart exactly`);
  const ev2 = act();
  assertEqual(flowSnap(r), after, `${label}: redo reaches the same chart`);
  assertEqual(ev2.type, ev.type, `${label}: redo event type`);
  return ev;
}
let walks = 0;
function walk(alg, exp, deck, label, index, orderA, orderB, useDrops) {
  walks += 1;
  const spec = R.taskSpec(alg, exp, index, deck);
  const r = R.makeRecord(spec);
  const tag = `${alg}/${label}/${index} ${spec.a},${spec.b} [${orderA.join("")}|${orderB.join("")}]`;
  const given = r.preSplit;
  let info = assertFlowState(r, `${tag} start`);
  if (!given) {
    for (let i = 0; i < orderA.length; i += 1) {
      assertEqual(
        [info.node, info.round],
        ["splitA", i + 1],
        `${tag}: split A round ${i + 1}`,
      );
      assertEqual(
        info.via,
        i === 0 ? null : { node: "stopA", answer: "no", q: r.quotients[0] },
        `${tag}: split A via`,
      );
      const p = orderA[i];
      roundTrip(r, `${tag} A${i}`, () =>
        useDrops ? R.dropPrime(r, p, 0) : R.applySplit(r, p, false),
      );
      info = assertFlowState(r, `${tag} after A${i}`);
    }
    for (let j = 0; j < orderB.length; j += 1) {
      assertEqual(
        [info.node, info.round],
        ["splitB", j + 1],
        `${tag}: split B round ${j + 1}`,
      );
      assertEqual(
        info.via,
        j === 0
          ? { node: "stopA", answer: "yes" }
          : { node: "stopB", answer: "no", q: r.quotients[1] },
        `${tag}: split B via`,
      );
      const p = orderB[j];
      roundTrip(r, `${tag} B${j}`, () =>
        useDrops ? R.dropPrime(r, p, 1) : R.applySplit(r, p, false),
      );
      info = assertFlowState(r, `${tag} after B${j}`);
    }
  } else {
    assert(
      ["splitA", "stopA", "splitB", "stopB"].every(
        (id) => info.states[id] === "given",
      ),
      `${tag}: split nodes given`,
    );
    assert(
      R.flowEdges(r)
        .slice(0, 6)
        .every((e) => !e.taken),
      `${tag}: no split edge taken on a given board`,
    );
  }
  let k = 0;
  while (R.hasPossiblePair(r)) {
    assertEqual(
      [info.node, info.round, info.via],
      ["pair", k + 1, { node: "match", answer: "yes" }],
      `${tag}: pair round ${k + 1}`,
    );
    const pp = R.possiblePairs(r)[0];
    const mode = (k + index) % 3;
    roundTrip(r, `${tag} pair${k}`, () => {
      if (mode === 0) {
        R.selectTile(r, pp.a);
        return R.selectTile(r, pp.b);
      }
      if (mode === 1) return R.dropTile(r, pp.b, pp.a);
      return R.dropOnShared(r, pp.a);
    });
    k += 1;
    info = assertFlowState(r, `${tag} after pair${k}`);
  }
  if (alg === "lcm") {
    let m = 0;
    while (R.pendingLeftovers(r).length > 0) {
      assertEqual(
        [info.node, info.round, info.via],
        ["leftovers", m + 1, { node: "match", answer: "no" }],
        `${tag}: leftover round ${m + 1}`,
      );
      const t = R.pendingLeftovers(r)[0];
      roundTrip(r, `${tag} lo${m}`, () =>
        m % 2 ? R.dropLeftover(r, t.id) : R.selectTile(r, t.id),
      );
      m += 1;
      info = assertFlowState(r, `${tag} after lo${m}`);
    }
  }
  assertEqual(
    [info.node, info.states.multiply, info.via],
    [
      "multiply",
      "current",
      alg === "lcm" ? null : { node: "match", answer: "no" },
    ],
    `${tag}: multiply current`,
  );
  assertEqual(
    info.prev,
    alg === "lcm" ? "leftovers" : "match",
    `${tag}: multiply prev`,
  );
  // selection / choice never move the chart
  const snap = flowSnap(r);
  if (exp === "challenge") {
    const answer =
      alg === "gcd" ? R.gcd(spec.a, spec.b) : R.lcm(spec.a, spec.b);
    R.chooseAnswer(
      r,
      spec.choices.find((c) => c !== answer),
    );
    assertEqual(flowSnap(r), snap, `${tag}: choice leaves the chart`);
    assertEqual(
      R.submitAnswer(r).type,
      "wrong",
      `${tag}: a wrong choice on the complete shelf is refused`,
    );
    assertEqual(
      flowSnap(r),
      snap,
      `${tag}: a refused submission leaves the chart`,
    );
    R.chooseAnswer(r, answer);
    assertEqual(R.submitAnswer(r).type, "solved", `${tag}: submit solves`);
  } else {
    assertEqual(R.checkResult(r).type, "solved", `${tag}: check solves`);
  }
  info = assertFlowState(r, `${tag} result`);
  assertEqual(
    divisibility(r).value,
    alg === "gcd" ? R.gcd(spec.a, spec.b) : R.lcm(spec.a, spec.b),
    `${tag}: final shelf value`,
  );
}
{
  // Guided decks, the Challenge fixture and eight drawn Challenge decks.
  const decks = [
    ["gcd", "guided", null, "guided", R.GUIDED_DECK.gcd.length],
    ["lcm", "guided", null, "guided", R.GUIDED_DECK.lcm.length],
    ["gcd", "challenge", CHALLENGE_FIXTURE.gcd, "fixture", 5],
    ["lcm", "challenge", CHALLENGE_FIXTURE.lcm, "fixture", 5],
  ];
  for (const seed of [1, 2, 3, 4]) {
    for (const alg of ["gcd", "lcm"]) {
      decks.push([
        alg,
        "challenge",
        R.challengeDeck(alg, seed),
        `seed${seed}`,
        5,
      ]);
    }
  }
  // Every pool pair, raw and pre-split, so no drawable board goes unwalked.
  for (const alg of ["gcd", "lcm"]) {
    const items = [];
    for (const shape of ["shared", "coprime", "equal"]) {
      for (const pair of R.challengePool(alg, shape)) {
        items.push({
          pair,
          preSplit: false,
          choices: R.challengeChoices(alg, pair[0], pair[1], 0),
          context: false,
        });
        items.push({
          pair,
          preSplit: true,
          choices: R.challengeChoices(alg, pair[0], pair[1], 1),
          context: shape === "shared",
        });
      }
    }
    decks.push([alg, "challenge", items, "pool", items.length]);
  }
  let expectedWalks = 0;
  for (const [alg, exp, deck, label, n] of decks) {
    for (let i = 0; i < n; i += 1) {
      const spec = R.taskSpec(alg, exp, i, deck);
      const ordersA = spec.preSplit ? [[]] : splitSequences(spec.a);
      const ordersB = spec.preSplit ? [[]] : splitSequences(spec.b);
      let w = 0;
      for (const oa of ordersA)
        for (const ob of ordersB) {
          walk(alg, exp, deck, label, i, oa, ob, w % 2 === 1);
          w += 1;
        }
      expectedWalks += w;
    }
  }
  assertEqual(walks, expectedWalks, "walk count computed from the decks");
  console.log(`walks: ${walks}`);
}
// A pre-split LCM board with pairs and leftovers: the decks' pre-split LCM
// tasks are coprime, so the given-node path match → pair → leftovers is
// exercised here on a synthetic board (not counted in walks).
{
  const tag = "lcm/12,18 pre-split";
  const r = rec("lcm", 12, 18, { preSplit: true });
  let info = assertFlowState(r, `${tag} start`);
  assert(
    ["splitA", "stopA", "splitB", "stopB"].every(
      (id) => info.states[id] === "given",
    ),
    `${tag}: split nodes given`,
  );
  assertEqual(
    [info.node, info.round, R.derivePhase(r)],
    ["pair", 1, "assemble"],
    `${tag}: opens at pair round 1 in assemble`,
  );
  assert(
    R.flowEdges(r)
      .slice(0, 6)
      .every((e) => !e.taken),
    `${tag}: no split edge taken`,
  );
  // three pair paths: tap, tile drop (B onto A), Shared drop
  const pairs = R.possiblePairs(r);
  assertEqual(pairs.length, 2, `${tag}: two possible pairs (2 and 3)`);
  const p2 = pairs.find((pp) => pp.p === 2);
  const p3 = pairs.find((pp) => pp.p === 3);
  roundTrip(r, `${tag} pair by tap`, () => {
    R.selectTile(r, p2.a);
    return R.selectTile(r, p2.b);
  });
  info = assertFlowState(r, `${tag} after tap pair`);
  assertEqual(
    [info.node, info.round, info.states.match],
    ["pair", 2, "looping"],
    `${tag}: still pairing after the first pair`,
  );
  assertEqual(R.undo(r).type, "undo", `${tag}: undo the tap pair`);
  roundTrip(r, `${tag} pair by drop B onto A`, () => R.dropTile(r, p2.b, p2.a));
  assertEqual(R.undo(r).type, "undo", `${tag}: undo the drop pair`);
  roundTrip(r, `${tag} pair by drop A onto B`, () => R.dropTile(r, p2.a, p2.b));
  roundTrip(r, `${tag} pair by Shared drop`, () => R.dropOnShared(r, p3.a));
  info = assertFlowState(r, `${tag} after both pairs`);
  assertEqual(
    [info.node, info.round, info.via, info.states.match],
    ["leftovers", 1, { node: "match", answer: "no" }, "done"],
    `${tag}: leftovers current after the pairs`,
  );
  // both leftover paths
  const lo = R.pendingLeftovers(r);
  assertEqual(lo.length, 2, `${tag}: two leftovers (2 and 3)`);
  roundTrip(r, `${tag} leftover by tap`, () => R.selectTile(r, lo[0].id));
  roundTrip(r, `${tag} leftover by drop`, () => R.dropLeftover(r, lo[1].id));
  info = assertFlowState(r, `${tag} shelf complete`);
  assertEqual(
    [info.node, info.states.leftovers, info.prev],
    ["multiply", "done", "leftovers"],
    `${tag}: multiply current with the shelf complete`,
  );
  assert(
    divisibility(r).holds,
    `${tag}: LCM lines hold on the complete shelf`,
  );
  assertEqual(R.checkResult(r).type, "solved", `${tag}: check solves`);
  info = assertFlowState(r, `${tag} result`);
  assertEqual(divisibility(r).value, 36, `${tag}: result is 36`);
  const taken = R.flowEdges(r)
    .filter((e) => e.taken)
    .map((e) => e.from + ">" + e.to)
    .sort();
  assertEqual(
    taken,
    ["leftovers>multiply", "match>leftovers", "match>pair", "pair>match"],
    `${tag}: taken edges in result`,
  );
  assertEqual(
    R.flowEdges(r).filter((e) => e.entry).length,
    0,
    `${tag}: no entry edge in result`,
  );
  console.log("extra board: " + tag);
}
// selection never moves the chart (guided board)
{
  const r = rec("gcd", 12, 18);
  splitAll(r);
  const snap = flowSnap(r);
  const b3 = r.tiles[1].find((t) => t.p === 3);
  R.selectTile(r, b3.id);
  assertEqual(flowSnap(r), snap, "pending B selection leaves the chart");
  R.selectTile(r, b3.id);
  R.pressHint(r);
  assertEqual(flowSnap(r), snap, "hint tier leaves the chart");
}
// special boards
{
  const c = rec("gcd", 8, 9);
  splitAll(c);
  const info = R.flowNode(c);
  assertEqual(
    [
      info.node,
      info.states.match,
      info.states.pair,
      info.states.leftovers,
      info.states.multiply,
    ],
    ["multiply", "done", "skipped", "skipped", "current"],
    "coprime GCD: multiply current at assemble entry",
  );
  assertEqual(
    divisibility(c).lines.map((l) => l.quotient),
    [8, 9],
    "coprime GCD invariant: 8 ÷ 1 and 9 ÷ 1",
  );
  const l = rec("lcm", 8, 9);
  splitAll(l);
  const li = R.flowNode(l);
  assertEqual(
    [li.node, li.round, li.states.pair],
    ["leftovers", 1, "skipped"],
    "coprime LCM: leftovers round 1, pair skipped",
  );
  const e = rec("lcm", 12, 12);
  splitAll(e);
  pairAll(e);
  const ei = R.flowNode(e);
  assertEqual(
    [ei.node, ei.states.leftovers, ei.prev],
    ["multiply", "skipped", "leftovers"],
    "12,12 LCM: leftovers skipped, multiply current",
  );
  const g = R.makeRecord(
    R.taskSpec("gcd", "challenge", 1, CHALLENGE_FIXTURE.gcd),
  );
  const gi = R.flowNode(g);
  assertEqual(
    [gi.node, gi.states.splitA, gi.states.stopB, gi.round],
    ["pair", "given", "given", 1],
    "pre-split 9,12 opens at pair round 1 with given splits",
  );
  const s = rec("gcd", 12, 18);
  R.applySplit(s, 3, false);
  assertEqual(
    R.splitInvariant(s, 0),
    { orig: 12, factors: [3], quotient: 4, terms: [3, 4], holds: true },
    "split invariant after 12 ÷ 3",
  );
  R.applySplit(s, 2, false);
  assertEqual(
    [R.splitInvariant(s, 0).terms, s.quotients[0]],
    [[3, 2, 2], 1],
    "a prime remainder closes the row in place: 12 ÷ 3 ÷ 2 reads 3 × 2 × 2",
  );
  // 24 keeps a composite remainder for three passes, so the loop is visible
  const t = rec("gcd", 24, 18);
  R.applySplit(t, 2, false);
  R.applySplit(t, 2, false);
  const fi = R.flowNode(t);
  assertEqual(
    [fi.node, fi.round, fi.via, fi.states.stopA],
    ["splitA", 3, { node: "stopA", answer: "no", q: 6 }, "looping"],
    "third round of split A after a No",
  );
  assert(
    R.flowEdges(t).find((e) => e.from === "stopA" && e.to === "splitA").taken,
    "loop edge taken after the first No",
  );
  assert(
    R.flowEdges(t).find((e) => e.from === "stopA" && e.to === "splitA").entry,
    "loop edge is the entry edge",
  );
}

// ---- undo across the split → assemble boundary, and reset ----
{
  const r = rec("gcd", 8, 12);
  assert(!R.canUndo(r), "nothing to undo on a fresh board");
  splitAll(r);
  assertEqual(R.derivePhase(r), "assemble", "fully split");
  const a = r.tiles[0][0];
  R.selectTile(r, a.id);
  assert(R.canUndo(r), "a pending selection is undoable");
  assertEqual(
    R.undo(r).type,
    "deselect",
    "undo cancels the pending selection first",
  );
  assertEqual(r.pending, null, "pending cleared");
  pairAll(r);
  assertEqual(r.pairs.length, 2, "two pairs made");
  assertEqual(R.undo(r).type, "undo", "undo reverts the last pair");
  assertEqual(r.pairs.length, 1, "one pair left");
  assert(
    r.tiles.every((row) => row.filter((t) => t.pair !== null).length === 1),
    "tile paired flags restored",
  );
  R.undo(r);
  assertEqual(r.pairs.length, 0, "no pairs left");
  assertEqual(R.undo(r).type, "undo", "undo reverts the last split");
  assertEqual(
    R.derivePhase(r),
    "split",
    "phase returns to split when factorization is incomplete",
  );
  assertEqual(
    r.quotients,
    [1, 6],
    "one undo reverts the whole split, the auto-closed prime included",
  );
  assertEqual(
    tilesOf(r, 1),
    [2],
    "both tiles of the auto-closed split are removed together",
  );
  r.hintTier = 2;
  r.assisted = true;
  R.undo(r);
  assertEqual(r.hintTier, 0, "undo resets the hint tier");
  assert(r.assisted, "undo never clears the assisted flag");
  const fresh = R.resetRecord(r);
  assertEqual(
    [fresh.quotients, fresh.tiles, fresh.pairs, fresh.history],
    [[8, 12], [[], []], [], []],
    "reset gives a fresh split board",
  );
  assert(fresh.assisted, "reset retains the assisted flag");
}

// ---- challenge scoring ----
function challenge(alg, index) {
  return R.makeRecord(
    R.taskSpec(alg, "challenge", index, CHALLENGE_FIXTURE[alg]),
  );
}
{
  const r = challenge("gcd", 0); // 6,10 raw, choices 1,2,3, answer 2
  assertEqual(R.derivePhase(r), "split", "raw challenge starts at split");
  splitAll(r);
  assertEqual(
    R.submitAnswer(r),
    { type: "invalid", counted: false, key: "chooseAnswer", vars: {} },
    "submit without a choice",
  );
  assertEqual(
    r.failedSubmission,
    false,
    "uncounted submission leaves scoring untouched",
  );
  assertEqual(
    R.chooseAnswer(r, 7).type,
    "noop",
    "only the three listed choices are selectable",
  );
  assertEqual(R.chooseAnswer(r, 2).type, "choice", "select 2");
  assertEqual(
    R.submitAnswer(r),
    { type: "incomplete", counted: true, key: "missingPair", vars: { p: 2 } },
    "incomplete shelf names the missing category",
  );
  assertEqual(
    [r.failedSubmission, r.choice, r.solved],
    [true, 2, false],
    "incomplete submission counts, keeps the choice, stays unsolved",
  );
  pairAll(r);
  R.chooseAnswer(r, 3);
  assertEqual(
    R.submitAnswer(r),
    { type: "wrong", counted: true, key: "wrongChoice", vars: {} },
    "wrong number",
  );
  assertEqual(r.choice, 3, "wrong choice remains selected");
  R.chooseAnswer(r, 2);
  const ev = R.submitAnswer(r);
  assertEqual(
    [ev.type, ev.value, ev.independent],
    ["solved", 2, false],
    "correct after failures completes with help",
  );
}
{
  const r = challenge("gcd", 1); // 9,12 pre-split
  assertEqual(
    R.derivePhase(r),
    "assemble",
    "pre-split enters assemble directly",
  );
  assertEqual(
    [tilesOf(r, 0), tilesOf(r, 1)],
    [
      [3, 3],
      [2, 2, 3],
    ],
    "pre-split rows are the correct factorizations",
  );
  assert(!R.canUndo(r), "nothing to undo on a pre-split board");
  pairAll(r);
  R.chooseAnswer(r, 3);
  const ev = R.submitAnswer(r);
  assertEqual(
    [ev.type, ev.value, ev.independent],
    ["solved", 3, true],
    "first-try unassisted → independent",
  );
  const again = R.resetRecord(challenge("gcd", 1));
  assertEqual(
    R.derivePhase(again),
    "assemble",
    "reset of a pre-split task returns to pre-split, not raw",
  );
}
{
  const r = challenge("gcd", 3); // 4,9 pre-split coprime, answer 1
  assert(
    !R.hasPossiblePair(r) && R.isCompleteShelf(r),
    "coprime challenge is complete from the start",
  );
  assertEqual(
    R.hintTarget(r),
    { type: "primary", empty: true },
    "hint target is the primary action",
  );
  assertEqual(
    R.pressHint(r),
    {
      type: "hint",
      tier: 1,
      key: "emptyHint1",
      vars: {},
      target: { type: "primary", empty: true },
    },
    "empty shelf hint 1",
  );
  assertEqual(R.pressHint(r).key, "emptyHint2", "empty shelf hint 2");
  assertEqual(R.pressHint(r).tier, 2, "no third tier when no action remains");
  assertEqual(R.applyHintStep(r).type, "noop", "no step to show");
  R.chooseAnswer(r, 1);
  const ev = R.submitAnswer(r);
  assertEqual(
    [ev.value, ev.independent],
    [1, false],
    "hint use removes independent status",
  );
}
{
  const r = challenge("lcm", 4); // 6,6 raw, answer 6
  splitAll(r);
  pairAll(r);
  R.chooseAnswer(r, 12);
  assertEqual(R.submitAnswer(r).type, "wrong", "12 is not LCM(6,6)");
  const reset = R.resetRecord(r);
  assert(reset.failedSubmission, "reset cannot restore independent status");
  splitAll(reset);
  pairAll(reset);
  R.chooseAnswer(reset, 6);
  assertEqual(
    R.submitAnswer(reset).independent,
    false,
    "solved after reset is still with help",
  );
}

// ---- hints ----
{
  const r = rec("gcd", 12, 18);
  assertEqual(
    R.pressHint(r),
    {
      type: "hint",
      tier: 1,
      key: "splitHint1",
      vars: { n: 12 },
      target: { type: "split", row: 0, n: 12, p: 2, q: 6 },
    },
    "split hint 1",
  );
  assertEqual(R.pressHint(r).key, "splitHint2", "split hint 2");
  assertEqual(R.pressHint(r).tier, 3, "third press reveals Show one step");
  assertEqual(
    R.applyHintStep(r),
    { type: "split", row: 0, n: 12, p: 2, q: 6, tileId: "A0" },
    "show one step commits 12 ÷ 2",
  );
  assertEqual(r.hintTier, 0, "hint tier resets after the assisted move");
  assert(r.assisted, "assisted flag retained");
  splitAll(r);
  assertEqual(R.pressHint(r).key, "assembleHint1", "assemble hint 1");
  assertEqual(
    R.pressHint(r),
    {
      type: "hint",
      tier: 2,
      key: "assembleHint2",
      vars: { p: 2, n: 12 },
      target: { type: "pair", p: 2, tileId: "A0", row: 0 },
    },
    "assemble hint 2 points at row A and names its number",
  );
  const a2 = r.tiles[0].find((t) => t.p === 2);
  R.selectTile(r, a2.id);
  assertEqual(
    R.hintTarget(r).row,
    1,
    "with a pending A tile the hint points at row B",
  );
  R.pressHint(r);
  assertEqual(
    R.applyHintStep(r).type,
    "pair",
    "show one step completes the pending pair",
  );
  assertEqual(r.pairs[0].p, 2, "pair 2 made");
  R.pressHint(r);
  R.pressHint(r);
  R.pressHint(r);
  assertEqual(
    R.applyHintStep(r).type,
    "pair",
    "show one step makes the 3 pair",
  );
  assertEqual(
    R.pressHint(r).key,
    "gcdRule",
    "complete non-empty shelf: rule sentence",
  );
  assertEqual(
    R.pressHint(r),
    {
      type: "hint",
      tier: 2,
      key: "gcdRule",
      vars: {},
      target: { type: "primary", empty: false },
    },
    "tier 2 highlights the primary action",
  );
  const l = rec("lcm", 8, 9);
  splitAll(l);
  assertEqual(R.pressHint(l).key, "leftoverHint1", "leftover hint 1");
  assertEqual(
    R.pressHint(l).vars,
    { p: 2, n: 8 },
    "leftover hint 2 names the lowest leftover and its number",
  );
  R.pressHint(l);
  assertEqual(
    R.applyHintStep(l).type,
    "leftover",
    "show one step adds the leftover",
  );
}

// ---- runs: parking, resuming, summary, per-algorithm reset ----
{
  const run = R.createRun(5, CHALLENGE_FIXTURE.gcd);
  assertEqual(
    [R.createRun(8).deck, run.deck === CHALLENGE_FIXTURE.gcd],
    [null, true],
    "a guided run has no deck; a Challenge run keeps its own",
  );
  const v1 = R.openRun(run, "gcd", "challenge");
  assertEqual(
    [v1.view, v1.fresh, v1.record.taskIndex],
    ["task", true, 0],
    "first open starts task 1",
  );
  R.applySplit(v1.record, 2, false);
  const v2 = R.openRun(run, "gcd", "challenge");
  assert(
    v2.record === v1.record && !v2.fresh,
    "reopening resumes the parked record",
  );
  assertEqual(v2.record.quotients, [1, 10], "parked board kept");
  assert(!R.finishActive(run), "cannot finish an unsolved task");
  splitAll(v1.record);
  pairAll(v1.record);
  R.chooseAnswer(v1.record, 2);
  R.submitAnswer(v1.record);
  assert(R.finishActive(run), "finish the solved task");
  assertEqual(
    [R.completedCount(run), R.independentCount(run)],
    [1, 1],
    "one independent completion",
  );
  for (let i = 1; i < 5; i += 1) {
    const v = R.openRun(run, "gcd", "challenge");
    assertEqual(v.record.taskIndex, i, `task ${i + 1} opens next`);
    if (R.derivePhase(v.record) === "split") splitAll(v.record);
    if (i === 2) R.pressHint(v.record);
    pairAll(v.record);
    R.chooseAnswer(v.record, R.gcd(v.record.a, v.record.b));
    R.submitAnswer(v.record);
    R.finishActive(run);
  }
  assertEqual(
    [R.completedCount(run), R.independentCount(run)],
    [5, 4],
    "5 completed, 4 independent",
  );
  assertEqual(
    R.openRun(run, "gcd", "challenge").view,
    "summary",
    "all done → summary",
  );
  assertEqual(R.firstUnsolved(run), -1, "no unsolved task left");
  const other = R.createRun(8);
  assertEqual(
    R.openRun(other, "gcd", "guided").record.a,
    18,
    "guided run unaffected by the challenge run",
  );
  const fresh = R.createRun(5, R.challengeDeck("gcd", 21));
  const freshView = R.openRun(fresh, "gcd", "challenge");
  assertEqual(
    [
      R.completedCount(fresh),
      freshView.record.taskIndex,
      [freshView.record.a, freshView.record.b],
      freshView.record.choices,
    ],
    [0, 0, fresh.deck[0].pair, fresh.deck[0].choices],
    "Try again starts a new five-task draw from its own deck",
  );
  // a drawn deck plays through: every task solvable, pre-split where the slot says so
  for (const alg of ["gcd", "lcm"]) {
    const drawn = R.createRun(5, R.challengeDeck(alg, 99));
    for (let i = 0; i < 5; i += 1) {
      const v = R.openRun(drawn, alg, "challenge");
      assertEqual(
        [v.record.taskIndex, v.record.preSplit, v.record.context],
        [
          i,
          R.CHALLENGE_SLOTS[alg][i].preSplit,
          R.CHALLENGE_SLOTS[alg][i].context,
        ],
        `${alg} drawn task ${i + 1}: index and slot flags`,
      );
      assertEqual(
        R.derivePhase(v.record),
        v.record.preSplit ? "assemble" : "split",
        `${alg} drawn task ${i + 1}: opens at the slot's phase`,
      );
      if (R.derivePhase(v.record) === "split") splitAll(v.record);
      pairAll(v.record);
      if (alg === "lcm") addAll(v.record);
      const answer = (alg === "gcd" ? R.gcd : R.lcm)(v.record.a, v.record.b);
      R.chooseAnswer(v.record, answer);
      assertEqual(
        R.submitAnswer(v.record).type,
        "solved",
        `${alg} drawn task ${i + 1}: solvable with its listed answer`,
      );
      R.finishActive(drawn);
    }
    assertEqual(
      [R.completedCount(drawn), R.openRun(drawn, alg, "challenge").view],
      [5, "summary"],
      `${alg} drawn deck: five completed, then summary`,
    );
  }
  const active = R.openRun(other, "gcd", "guided").record;
  R.applySplit(active, 2, false);
  const reset = R.resetActive(other);
  assertEqual(
    reset.quotients,
    [18, 24],
    "resetActive replaces the parked record with a fresh board",
  );
}

// ---- proof caps and the "Your numbers" run ----
{
  const cases = [
    ["gcd", 12, 18, true],
    ["gcd", 8, 9, true],
    ["gcd", 2, 27, false],
    ["gcd", 3, 30, false],
    ["gcd", 25, 30, true],
    ["lcm", 8, 9, true],
    ["lcm", 12, 25, false],
    ["lcm", 12, 27, false],
    ["lcm", 5, 12, false],
    ["lcm", 12, 18, true],
    ["lcm", 30, 30, true],
  ];
  for (const [alg, a, b, fits] of cases) {
    assertEqual(
      [R.proofFits(alg, a, b), R.proofFits(alg, b, a)],
      [fits, fits],
      `proofFits ${alg} ${a},${b} is ${fits} in both orders`,
    );
  }
  // every custom pair that fits is solvable Guided-style with a null choice list
  let solvable = 0;
  for (const alg of ["gcd", "lcm"]) {
    for (const a of R.CHALLENGE_VALUES) {
      for (const b of R.CHALLENGE_VALUES) {
        if (!R.proofFits(alg, a, b)) continue;
        const run = R.createRun(1, [
          { pair: [a, b], preSplit: false, choices: null, context: false },
        ]);
        const v = R.openRun(run, alg, "custom");
        const r = v.record;
        if (
          r.experience !== "custom" ||
          r.a !== a ||
          r.b !== b ||
          r.choices !== null ||
          r.context ||
          R.derivePhase(r) !== "split"
        ) {
          assert(false, `custom ${alg} ${a},${b}: record shape`);
          continue;
        }
        splitAll(r);
        pairAll(r);
        if (alg === "lcm") addAll(r);
        const ev = R.checkResult(r);
        const expected = (alg === "gcd" ? R.gcd : R.lcm)(a, b);
        if (
          ev.type === "solved" &&
          ev.value === expected &&
          R.finishActive(run)
        ) {
          solvable += 1;
        } else {
          assert(false, `custom ${alg} ${a},${b}: check solves to ${expected}`);
        }
        assertEqual(
          R.openRun(run, alg, "custom").view,
          "summary",
          `custom ${alg} ${a},${b}: after the task the run is at its summary (the picker)`,
        );
      }
    }
  }
  assert(solvable >= 2 * 100, `custom boards solvable: ${solvable}`);
  console.log(`custom boards: ${solvable}`);
  const empty = R.createRun(0, []);
  assertEqual(
    [
      R.openRun(empty, "gcd", "custom").view,
      R.firstUnsolved(empty),
      empty.deck,
    ],
    ["summary", -1, []],
    "an empty custom run opens at its summary (the picker) with no task",
  );
}

// ---- the visible count ticks on the correct answer, not on Next ----
{
  const run = R.createRun(8);
  assertEqual(
    [R.solvedCount(run), R.completedCount(run)],
    [0, 0],
    "a fresh run has nothing solved",
  );
  const rec = R.openRun(run, "gcd", "guided").record;
  assertEqual(R.solvedCount(run), 0, "an open unsolved task counts nothing");
  splitAll(rec);
  pairAll(rec);
  assertEqual(
    R.solvedCount(run),
    0,
    "a complete shelf still counts nothing before the check",
  );
  assertEqual(
    R.checkResult(rec).type,
    "solved",
    "the first guided pair solves",
  );
  assertEqual(
    [R.solvedCount(run), R.completedCount(run)],
    [1, 0],
    "the solved task counts at once, before Next pair",
  );
  assert(R.finishActive(run), "Next pair finishes it");
  assertEqual(
    [R.solvedCount(run), R.completedCount(run)],
    [1, 1],
    "Next pair does not count it twice",
  );
  const next = R.openRun(run, "gcd", "guided").record;
  assertEqual(
    [R.solvedCount(run), next.taskIndex],
    [1, 1],
    "opening the next task leaves the count alone",
  );
  // a reset of a solved task takes the count back
  splitAll(next);
  pairAll(next);
  R.checkResult(next);
  assertEqual(R.solvedCount(run), 2, "the second solved task counts");
  R.resetActive(run);
  assertEqual(
    [R.solvedCount(run), R.completedCount(run)],
    [1, 1],
    "starting the pair again takes its point back",
  );
  // Challenge counts the same way
  const ch = R.createRun(5, CHALLENGE_FIXTURE.gcd);
  const c = R.openRun(ch, "gcd", "challenge").record;
  splitAll(c);
  pairAll(c);
  R.chooseAnswer(c, R.gcd(c.a, c.b));
  assertEqual(R.submitAnswer(c).type, "solved", "the challenge task solves");
  assertEqual(
    [R.solvedCount(ch), R.completedCount(ch)],
    [1, 0],
    "a submitted challenge task counts at once",
  );
}

console.log(
  failures === 0
    ? `OK: ${checks} checks passed`
    : `${failures} of ${checks} checks FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
