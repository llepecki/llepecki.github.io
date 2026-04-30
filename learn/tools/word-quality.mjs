#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// --- Algorithm (ported from morsegen.html) ---

function fisherYates(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function histogramScore(hist) {
  let sum = 0;
  let cnt = 0;
  for (let i = 0; i < 26; i++) {
    if (hist[i] > 0) {
      sum += hist[i];
      cnt++;
    }
  }
  if (cnt === 0) return 0;
  const mean = sum / cnt;
  let variance = 0;
  for (let i = 0; i < 26; i++) {
    if (hist[i] > 0) {
      const d = hist[i] - mean;
      variance += d * d;
    }
  }
  return Math.sqrt(variance / cnt);
}

function selectWordsFlat(pool, count) {
  if (pool.length === 0) return [];
  if (pool.length <= count) return fisherYates(pool);
  const hist = new Array(26).fill(0);
  const selected = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let bestWord = null;
    let bestScore = Infinity;
    let ties = 0;
    for (const word of pool) {
      if (used.has(word)) continue;
      const trial = hist.slice();
      for (let c = 0; c < word.length; c++) {
        const ci = word.charCodeAt(c) - 65;
        if (ci >= 0 && ci < 26) trial[ci]++;
      }
      const score = histogramScore(trial);
      if (score < bestScore) {
        bestScore = score;
        bestWord = word;
        ties = 1;
      } else if (score === bestScore) {
        ties++;
        if (Math.random() < 1 / ties) bestWord = word;
      }
    }
    if (!bestWord) break;
    selected.push(bestWord);
    used.add(bestWord);
    for (let c = 0; c < bestWord.length; c++) {
      const ci = bestWord.charCodeAt(c) - 65;
      if (ci >= 0 && ci < 26) hist[ci]++;
    }
  }
  return fisherYates(selected);
}

// --- Metrics ---

function computeMetrics(words) {
  const hist = new Array(26).fill(0);
  for (const word of words) {
    for (let c = 0; c < word.length; c++) {
      const ci = word.charCodeAt(c) - 65;
      if (ci >= 0 && ci < 26) hist[ci]++;
    }
  }
  const nonZero = hist.filter((v) => v > 0);
  const distinct = nonZero.length;
  const totalLetters = nonZero.reduce((a, b) => a + b, 0);
  const stddev = histogramScore(hist);
  const minFreq = Math.min(...nonZero);
  const maxFreq = Math.max(...nonZero);
  const minMaxRatio = maxFreq > 0 ? minFreq / maxFreq : 0;
  return { distinct, stddev, minMaxRatio, totalLetters };
}

// --- CLI ---

function parseArgs(argv) {
  const args = {
    file: null,
    count: 6,
    min: 3,
    max: 10,
    trials: 1000,
    prompt: false,
    suggest: 20,
  };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--count") {
      args.count = parseInt(argv[++i], 10);
    } else if (arg === "--min") {
      args.min = parseInt(argv[++i], 10);
    } else if (arg === "--max") {
      args.max = parseInt(argv[++i], 10);
    } else if (arg === "--trials") {
      args.trials = parseInt(argv[++i], 10);
    } else if (arg === "--prompt") {
      args.prompt = true;
    } else if (arg === "--suggest") {
      args.suggest = parseInt(argv[++i], 10);
    } else if (!arg.startsWith("--")) {
      args.file = arg;
    }
    i++;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    console.error(
      "Usage: node word-quality.mjs <words-file> [--count N] [--min N] [--max N] [--trials N] [--prompt] [--suggest N]"
    );
    process.exit(1);
  }

  const filePath = resolve(args.file);
  const allWords = readFileSync(filePath, "utf-8")
    .split("\n")
    .map((l) => l.trim().toUpperCase())
    .filter((l) => l.length > 0);

  const pool = allWords.filter(
    (w) => w.length >= args.min && w.length <= args.max
  );

  console.log(`File:     ${args.file}`);
  console.log(`Words:    ${allWords.length} total, ${pool.length} in pool`);
  console.log(
    `Params:   count=${args.count}  min=${args.min}  max=${args.max}  trials=${args.trials}`
  );
  console.log("");

  if (pool.length === 0) {
    console.error("No words match the length filter.");
    process.exit(1);
  }

  const results = {
    distinct: [],
    stddev: [],
    minMaxRatio: [],
    totalLetters: [],
  };
  const letterSums = new Array(26).fill(0);

  for (let t = 0; t < args.trials; t++) {
    const selected = selectWordsFlat(pool, args.count);
    const m = computeMetrics(selected);
    results.distinct.push(m.distinct);
    results.stddev.push(m.stddev);
    results.minMaxRatio.push(m.minMaxRatio);
    results.totalLetters.push(m.totalLetters);
    for (const word of selected) {
      for (let c = 0; c < word.length; c++) {
        const ci = word.charCodeAt(c) - 65;
        if (ci >= 0 && ci < 26) letterSums[ci]++;
      }
    }
  }

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const fmt = (n, d = 3) => n.toFixed(d);

  console.log("Metric                 Value");
  console.log("─────────────────────  ──────");
  console.log(`Pool size              ${pool.length}`);
  console.log(`Distinct letters       ${fmt(mean(results.distinct), 1)}`);
  console.log(`Total letters          ${fmt(mean(results.totalLetters), 1)}`);
  console.log(`Stddev (mean)          ${fmt(mean(results.stddev))}`);
  console.log(
    `Stddev (best/worst)    ${fmt(Math.min(...results.stddev))} / ${fmt(Math.max(...results.stddev))}`
  );
  console.log(`Min/max ratio (mean)   ${fmt(mean(results.minMaxRatio))}`);

  // Per-letter breakdown
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letterMeans = letterSums.map((s) => s / args.trials);
  const nonZeroMeans = letterMeans.filter((v) => v > 0);
  const idealMean =
    nonZeroMeans.length > 0
      ? nonZeroMeans.reduce((a, b) => a + b, 0) / nonZeroMeans.length
      : 0;

  const letters = ALPHA.split("").map((ch, i) => ({
    letter: ch,
    mean: letterMeans[i],
    dev: idealMean > 0 ? ((letterMeans[i] - idealMean) / idealMean) * 100 : 0,
  }));

  // Sort by deviation ascending (most underrepresented first)
  letters.sort((a, b) => a.dev - b.dev);

  console.log("");
  console.log(
    `Per-letter frequency (ideal mean: ${fmt(idealMean, 2)}, sorted by deviation)`
  );
  console.log("Letter  Mean   Dev%    Status");
  console.log("──────  ─────  ──────  ──────────");
  for (const l of letters) {
    let status = "";
    if (l.mean === 0) status = "MISSING";
    else if (l.dev < -40) status = "VERY LOW";
    else if (l.dev < -20) status = "LOW";
    else if (l.dev > 40) status = "VERY HIGH";
    else if (l.dev > 20) status = "HIGH";
    const devStr = (l.dev >= 0 ? "+" : "") + fmt(l.dev, 1) + "%";
    console.log(
      `  ${l.letter}     ${fmt(l.mean, 2).padStart(5)}  ${devStr.padStart(7)}  ${status}`
    );
  }

  if (!args.prompt) return;

  // Generate research agent prompt
  const langName = args.file.includes("pl") ? "Polish" : "English";
  const isPl = langName === "Polish";
  const needLetters = letters
    .filter((l) => l.dev < -20)
    .map((l) => l.letter);
  const avoidLetters = letters
    .filter((l) => l.dev > 20)
    .map((l) => l.letter);
  const existingWords = pool.join(", ");

  const promptLines = [
    "═".repeat(72),
    "RESEARCH PROMPT — paste this into a research agent",
    "═".repeat(72),
    "",
    `## Context`,
    "",
    `I'm building an educational Morse code practice app for kids (ages 8–12).`,
    `The app selects ${args.count} ${langName.toLowerCase()} words and generates printable`,
    `practice sheets where one child transmits words in Morse code and another`,
    `decodes them. The word selection algorithm tries to maximize letter diversity`,
    `— it picks words so that the combined letter frequency across all selected`,
    `words is as flat/even as possible.`,
    "",
    `## Constraints`,
    "",
    `- Language: ${langName}`,
    `- Word length: ${args.min} to ${args.max} characters`,
    `- Characters: only basic Latin A–Z (uppercase)`,
    isPl
      ? `- CRITICAL: Polish words must NOT contain any Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) in their standard spelling`
      : `- Standard English words only`,
    `- Words should be common, concrete, and recognizable by children aged 8–12`,
    `- No offensive, violent, or inappropriate words`,
    "",
    `## Problem`,
    "",
    `The current word list has an uneven letter distribution when the selection`,
    `algorithm picks ${args.count} words (length ${args.min}–${args.max}). After ${args.trials} Monte Carlo trials:`,
    `- Mean stddev: ${fmt(mean(results.stddev))} (lower is better, 0 = perfectly flat)`,
    `- Distinct letters used: ${fmt(mean(results.distinct), 1)} out of 26`,
    "",
    needLetters.length > 0
      ? `Underrepresented letters (need MORE words containing these): ${needLetters.join(", ")}`
      : `No severely underrepresented letters.`,
    avoidLetters.length > 0
      ? `Overrepresented letters (AVOID words heavy in these): ${avoidLetters.join(", ")}`
      : `No severely overrepresented letters.`,
    "",
    `## Current word list (${pool.length} words in the ${args.min}–${args.max} range)`,
    "",
    existingWords,
    "",
    `## Task`,
    "",
    `Suggest ${args.suggest} new ${langName.toLowerCase()} words that will improve the letter distribution.`,
    `Each word must:`,
    `1. Be ${args.min}–${args.max} characters long, A–Z only`,
    isPl
      ? `2. Be a valid Polish word with NO diacritics in its standard spelling`
      : `2. Be a common English word`,
    `3. Be appropriate and recognizable for children aged 8–12`,
    `4. Contain at least one of the underrepresented letters: ${needLetters.join(", ") || "N/A"}`,
    `5. Avoid being heavy in overrepresented letters: ${avoidLetters.join(", ") || "N/A"}`,
    `6. NOT duplicate any word already in the list above`,
    "",
    `Output the words as a plain list, one word per line, uppercase.`,
    `For each word, briefly note which underrepresented letters it covers.`,
  ];

  console.log("\n" + promptLines.join("\n"));
}

main();
