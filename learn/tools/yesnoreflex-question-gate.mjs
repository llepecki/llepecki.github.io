#!/usr/bin/env node
// Permanent content gate for the Yes / No Reflex question bank
// (round-4 review §3.2). Extracts the shipped QUESTIONS/CATEGORIES from
// yesnoreflex/index.html, compares them field-for-field with the independent
// fixture in tools/yesnoreflex-bank-fixture.mjs, and enforces every
// structural, length, vocabulary, duplicate, and approval-hash rule.
//
// Automated checks never approve semantics. Named native-English and
// native-Polish reviewer sign-off and the child pilot stay OPEN HUMAN GATES
// and are reported as such — a green run does not close them.
//
// Run from learn/: npm run yesnoreflex-question-gate
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  CATEGORIES as FIXTURE_CATEGORIES,
  QUESTIONS as FIXTURE_QUESTIONS,
} from "./yesnoreflex-bank-fixture.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const learnRoot = path.join(here, "..");
const APP = path.join(learnRoot, "yesnoreflex", "index.html");
const APPROVALS = path.join(
  learnRoot,
  "yesnoreflex",
  "docs",
  "question-gate-approvals.json",
);

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error("FAIL: " + msg);
  }
}

/* ===== Load the shipped bank out of the rules fence ===== */
const html = readFileSync(APP, "utf8");
const start = html.indexOf("// [rules:start]");
const end = html.indexOf("// [rules:end]");
if (start < 0 || end < 0) {
  console.error("FAIL: rules fence not found in " + APP);
  process.exit(1);
}
const sandbox = { Math, Number, Array, Object, JSON, __out: null };
vm.runInNewContext(
  html.slice(start, end) + "\n__out = { CATEGORIES, QUESTIONS };",
  sandbox,
);
const { CATEGORIES, QUESTIONS } = sandbox.__out;

const APPROVED_CATEGORIES = [
  "animals",
  "body",
  "space",
  "nature",
  "science",
  "math",
  "food",
  "everyday",
];
const PREFIX = {
  animals: "ani",
  body: "bod",
  space: "spa",
  nature: "nat",
  science: "sci",
  math: "mat",
  food: "foo",
  everyday: "day",
};
const FIELDS = ["id", "cat", "enQ", "plQ", "enFact", "plFact"];
const BANNED_WORDS = [
  "usually",
  "sometimes",
  "all",
  "every",
  "only",
  "zwykle",
  "czasami",
  "wszystkie",
  "każdy",
  "każda",
  "każde",
  "tylko",
];
const CLAUSE_WORDS = [
  "when",
  "while",
  "if",
  "whenever",
  "gdy",
  "kiedy",
  "jeśli",
  "podczas",
];
const WORD_LIMITS = { enQ: 10, plQ: 12, enFact: 12, plFact: 14 };
const NEAR_DUPLICATE_THRESHOLD = 0.72;

function tokens(text) {
  return text
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}
function normalized(text) {
  return tokens(text).join(" ");
}
function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function hasWholeWord(text, term) {
  return tokens(text).includes(term);
}
function canonicalRecord(q) {
  return JSON.stringify({
    id: q.id,
    cat: q.cat,
    tone: q.tone || "",
    truth: q.truth,
    enQ: q.enQ,
    plQ: q.plQ,
    enFact: q.enFact,
    plFact: q.plFact,
  });
}
function hashRecord(q) {
  return createHash("sha256").update(canonicalRecord(q), "utf8").digest("hex");
}

/* ===== 1. Shape of the bank ===== */
ok(Array.isArray(QUESTIONS), "QUESTIONS is an array");
ok(
  QUESTIONS.length === 240,
  "exactly 240 records (got " + QUESTIONS.length + ")",
);
ok(
  JSON.stringify(CATEGORIES) === JSON.stringify(APPROVED_CATEGORIES),
  "exactly the eight approved categories in order (got " +
    JSON.stringify(CATEGORIES) +
    ")",
);

/* ===== 2. Per-category quotas ===== */
{
  const stat = {};
  APPROVED_CATEGORIES.forEach((c) => {
    stat[c] = { n: 0, truth: 0, playful: 0, playfulTrue: 0 };
  });
  for (const q of QUESTIONS) {
    if (!stat[q.cat]) continue;
    stat[q.cat].n += 1;
    if (q.truth === true) stat[q.cat].truth += 1;
    if (q.tone === "playful") {
      stat[q.cat].playful += 1;
      if (q.truth === true) stat[q.cat].playfulTrue += 1;
    }
  }
  for (const c of APPROVED_CATEGORIES) {
    const s = stat[c];
    ok(s.n === 30, c + ": 30 records (got " + s.n + ")");
    ok(s.truth === 15, c + ": 15 true records (got " + s.truth + ")");
    ok(s.playful === 6, c + ": 6 playful records (got " + s.playful + ")");
    ok(
      s.playfulTrue === 3,
      c + ": 3 playful true records (got " + s.playfulTrue + ")",
    );
  }
}

/* ===== 3. Per-record structure, IDs, punctuation, length, vocabulary ===== */
{
  const seenId = new Map();
  const seenEn = new Map();
  const seenPl = new Map();
  for (const q of QUESTIONS) {
    const label = q && q.id ? q.id : "<unknown>";
    if (!q || typeof q !== "object") {
      ok(false, label + ": not an object");
      continue;
    }
    for (const f of FIELDS) {
      ok(
        typeof q[f] === "string" && q[f].trim().length > 0,
        label + ": " + f + " is a non-empty string",
      );
    }
    ok(typeof q.truth === "boolean", label + ": truth is a boolean");
    ok(
      q.tone === undefined || q.tone === "playful",
      label + ": tone is absent or exactly 'playful'",
    );
    ok(
      APPROVED_CATEGORIES.indexOf(q.cat) !== -1,
      label + ": known category (got " + q.cat + ")",
    );
    const prefix = PREFIX[q.cat];
    ok(
      typeof prefix === "string" &&
        new RegExp("^" + prefix + "(0[1-9]|[12][0-9]|30)$").test(q.id),
      label + ": id matches its category prefix and 01-30",
    );
    if (seenId.has(q.id)) ok(false, label + ": duplicate id");
    seenId.set(q.id, true);

    for (const f of ["enQ", "plQ"]) {
      const text = String(q[f] || "");
      ok(text.endsWith("?"), label + ": " + f + " ends with '?'");
      ok(
        (text.match(/\?/g) || []).length === 1,
        label + ": " + f + " has exactly one question mark",
      );
      ok(!/\n/.test(text), label + ": " + f + " has no newline");
    }
    for (const f of Object.keys(WORD_LIMITS)) {
      const n = wordCount(String(q[f] || ""));
      ok(
        n <= WORD_LIMITS[f],
        label +
          ": " +
          f +
          " has <= " +
          WORD_LIMITS[f] +
          " words (got " +
          n +
          ")",
      );
    }
    for (const term of BANNED_WORDS) {
      ok(
        !hasWholeWord(q.enQ, term) && !hasWholeWord(q.plQ, term),
        label + ": no ambiguity trigger '" + term + "'",
      );
    }
    for (const term of CLAUSE_WORDS) {
      ok(
        !hasWholeWord(q.enQ, term) && !hasWholeWord(q.plQ, term),
        label + ": no irrelevant-clause word '" + term + "'",
      );
    }
    const en = normalized(q.enQ);
    const pl = normalized(q.plQ);
    ok(
      !seenEn.has(en),
      label +
        ": English question is unique (clashes with " +
        seenEn.get(en) +
        ")",
    );
    ok(
      !seenPl.has(pl),
      label +
        ": Polish question is unique (clashes with " +
        seenPl.get(pl) +
        ")",
    );
    seenEn.set(en, q.id);
    seenPl.set(pl, q.id);
  }
}

/* ===== 4. App bank equals the independent fixture, field for field ===== */
{
  ok(
    JSON.stringify(CATEGORIES) === JSON.stringify(FIXTURE_CATEGORIES),
    "app categories equal the fixture categories",
  );
  ok(
    QUESTIONS.length === FIXTURE_QUESTIONS.length,
    "app and fixture record counts match (" +
      QUESTIONS.length +
      " vs " +
      FIXTURE_QUESTIONS.length +
      ")",
  );
  const fixtureById = new Map(FIXTURE_QUESTIONS.map((q) => [q.id, q]));
  for (const q of QUESTIONS) {
    const f = fixtureById.get(q.id);
    if (!f) {
      ok(false, q.id + ": present in the app but missing from the fixture");
      continue;
    }
    ok(
      canonicalRecord(q) === canonicalRecord(f),
      q.id + ": app record is field-for-field identical to the fixture",
    );
    fixtureById.delete(q.id);
  }
  ok(
    fixtureById.size === 0,
    "no fixture-only records (" + [...fixtureById.keys()].join(",") + ")",
  );
}

/* ===== 5. Near-duplicate reporting and mandatory disposition ===== */
let approvals = null;
try {
  approvals = JSON.parse(readFileSync(APPROVALS, "utf8"));
} catch (err) {
  ok(false, "approvals manifest is readable JSON (" + err.message + ")");
}
{
  const jaccard = (a, b) => {
    const A = new Set(a);
    const B = new Set(b);
    let inter = 0;
    for (const x of A) if (B.has(x)) inter += 1;
    return inter / (A.size + B.size - inter);
  };
  const dispositioned = new Set(
    ((approvals && approvals.nearDuplicateDispositions) || []).map((d) =>
      [d.field, d.a, d.b].join("|"),
    ),
  );
  const undispositioned = [];
  for (const field of ["enQ", "plQ"]) {
    const toks = QUESTIONS.map((q) => tokens(q[field]));
    for (let i = 0; i < QUESTIONS.length; i += 1) {
      for (let j = i + 1; j < QUESTIONS.length; j += 1) {
        const sim = jaccard(toks[i], toks[j]);
        if (sim < NEAR_DUPLICATE_THRESHOLD) continue;
        const key = [field, QUESTIONS[i].id, QUESTIONS[j].id].join("|");
        if (dispositioned.has(key)) continue;
        undispositioned.push(
          key +
            " (" +
            sim.toFixed(3) +
            "): " +
            QUESTIONS[i][field] +
            " || " +
            QUESTIONS[j][field],
        );
      }
    }
  }
  ok(
    undispositioned.length === 0,
    "zero undispositioned near-duplicate pairs at >= " +
      NEAR_DUPLICATE_THRESHOLD +
      (undispositioned.length
        ? "\n        " + undispositioned.join("\n        ")
        : ""),
  );
}

/* ===== 6. Approval hashes ===== */
const pendingEnglish = [];
const pendingPolish = [];
if (approvals) {
  ok(
    approvals.hashAlgorithm === "sha256",
    "manifest declares the sha256 hash algorithm",
  );
  const records = approvals.records || {};
  const manifestIds = new Set(Object.keys(records));
  for (const q of QUESTIONS) {
    const entry = records[q.id];
    if (!entry) {
      ok(false, q.id + ": missing from the approvals manifest");
      continue;
    }
    ok(
      entry.hash === hashRecord(q),
      q.id + ": content hash matches the approvals manifest",
    );
    if (!entry.approvedByEnglishReviewer) pendingEnglish.push(q.id);
    if (!entry.approvedByPolishReviewer) pendingPolish.push(q.id);
    manifestIds.delete(q.id);
  }
  ok(
    manifestIds.size === 0,
    "no stale manifest entries (" + [...manifestIds].join(",") + ")",
  );
}

/* ===== Result ===== */
console.log("");
if (failures === 0) {
  console.log("OK: " + checks + " question-gate checks passed");
} else {
  console.error(failures + " of " + checks + " question-gate checks FAILED");
}
console.log("");
console.log("OPEN HUMAN GATES (not closed by this run):");
console.log(
  "  native English reviewer: " +
    (pendingEnglish.length === 0
      ? "recorded for all records"
      : pendingEnglish.length +
        " of " +
        QUESTIONS.length +
        " records unapproved"),
);
console.log(
  "  native Polish reviewer:  " +
    (pendingPolish.length === 0
      ? "recorded for all records"
      : pendingPolish.length +
        " of " +
        QUESTIONS.length +
        " records unapproved"),
);
console.log(
  "  child pilot of every base proposition: never automatable; must be run and recorded separately",
);

process.exit(failures === 0 ? 0 : 1);
