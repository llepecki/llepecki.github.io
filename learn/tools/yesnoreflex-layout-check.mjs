#!/usr/bin/env node
// Browser-level layout regression checks for yesnoreflex/index.html
// (round-2 review R2-5/R2-9 and round-3 review R3-1/R3-5/R3-6). Drives the
// system Google Chrome through puppeteer-core and asserts real geometry:
//
//   * the Pause control stays compact in every phase and never overlaps the
//     cue, the Practice Next button never balloons, the Yes/No targets do not
//     move between question and feedback, the result overlay covers the
//     viewport, and the page never scrolls horizontally (360/720/1280px);
//   * VIEWPORT-relative first-trial visibility after Start, Play again, and
//     tutorial start, for Level-1 color, Level-1 shape, and Level-2 sessions
//     (document coordinates cannot prove a play element is on screen);
//   * the switch dialog's mapping rows and Continue fit and stay reachable;
//   * panel button computed type and target heights;
//   * English and Polish panel labels neither wrap nor clip at 320/360px;
//   * the critical setup / switch / cue / question / answer surfaces repeat
//     at 200% zoom.
//
// Run from learn/: npm run yesnoreflex-layout-check
// Chrome discovery: $CHROME_PATH, then the standard macOS/Linux locations.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const learnRoot = path.join(here, "..");

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error("FAIL: " + msg);
  }
}

const chromePath = findChrome();
if (!chromePath) {
  console.error(
    "FAIL: no Chrome found. Install Google Chrome or set CHROME_PATH to a " +
      "Chrome/Chromium binary, then re-run npm run yesnoreflex-layout-check.",
  );
  process.exit(2);
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const filePath = path.join(learnRoot, urlPath);
    if (!filePath.startsWith(learnRoot)) throw new Error("traversal");
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = "http://127.0.0.1:" + port + "/yesnoreflex/index.html?debug=1";
const appUrl = (seed) => base + "&seed=" + seed;

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "shell",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function freshPage(width, height, { seed = 42, intro = false } = {}) {
  const page = await browser.newPage();
  // The app pauses on window blur by design, so a page that is not the
  // front tab can be paused by automation focus churn rather than by
  // anything under test. Keep every harness page frontmost.
  await page.bringToFront();
  await page.setViewport({ width, height });
  await page.goto(appUrl(seed), { waitUntil: "domcontentloaded" });
  await page.evaluate((seen) => {
    try {
      localStorage.clear();
      if (seen) localStorage.setItem("yesnoreflexIntroSeenV1", "1");
    } catch {
      /* ignore */
    }
  }, !intro);
  await page.goto(appUrl(seed), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => window.yesnoreflexDebug && window.yesnoreflexDebug.state,
  );
  return page;
}

// Document coordinates: stable across legitimate page scrolling, used for
// movement and overlap checks.
async function box(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      w: r.width,
      h: r.height,
    };
  }, id);
}

// Viewport coordinates: the only geometry that proves a play element is on
// screen (round-3 review R3-1).
async function vbox(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      top: r.top,
      left: r.left,
      right: r.right,
      bottom: r.bottom,
      w: r.width,
      h: r.height,
      vh: window.innerHeight,
      vw: window.innerWidth,
      hidden:
        el.hidden || style.display === "none" || style.visibility === "hidden",
    };
  }, id);
}

async function inViewport(page, id, label) {
  const b = await vbox(page, id);
  if (b === null) {
    ok(false, label + ": #" + id + " exists");
    return;
  }
  if (b.hidden) {
    ok(false, label + ": #" + id + " is rendered");
    return;
  }
  ok(
    b.top >= -0.5 &&
      b.left >= -0.5 &&
      b.bottom <= b.vh + 0.5 &&
      b.right <= b.vw + 0.5 &&
      b.w > 0 &&
      b.h > 0,
    label +
      ": #" +
      id +
      " inside the viewport (top=" +
      b.top.toFixed(0) +
      " bottom=" +
      b.bottom.toFixed(0) +
      " of " +
      b.vh +
      ")",
  );
}

async function phase(page) {
  return page.evaluate(() => window.yesnoreflexDebug.state.phase);
}
async function noHScroll(page, label) {
  ok(
    await page.evaluate(
      () =>
        document.scrollingElement.scrollWidth <=
        document.scrollingElement.clientWidth + 1,
    ),
    label + ": no horizontal page scroll",
  );
}
// Dismiss the mapping card every session opens on.
async function dismissOpeningCard(page) {
  await page.evaluate(() => {
    const overlay = document.getElementById("switchOverlay");
    if (!overlay.hidden) document.getElementById("swContinue").click();
  });
}
// Answer both untimed warm-ups correctly, in page.
async function finishWarmups(page) {
  await dismissOpeningCard(page);
  await page.evaluate(() => {
    const st = window.yesnoreflexDebug.state;
    let guard = 0;
    while (st.inWarmup && guard < 20) {
      const wt = st.warmupTrials[st.warmupIndex];
      document.getElementById(wt.expectedAnswer ? "btnYes" : "btnNo").click();
      document.getElementById("nextBtn").click();
      guard += 1;
    }
  });
}
// Play forward (Practice) until the switch dialog appears.
async function advanceToSwitch(page) {
  return page.evaluate(() => {
    const st = window.yesnoreflexDebug.state;
    let guard = 0;
    while (st.phase !== "switch" && st.phase !== "summary" && guard < 40) {
      if (st.phase === "question") {
        const trial = st.trials[st.trialIndex];
        document
          .getElementById(trial.expectedAnswer ? "btnYes" : "btnNo")
          .click();
      } else if (st.phase === "feedback") {
        document.getElementById("nextBtn").click();
      } else {
        break;
      }
      guard += 1;
    }
    return st.phase;
  });
}
// A text element wraps when its rendered box is taller than one line.
async function singleLine(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) return { ok: false, why: "missing" };
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = range.getClientRects().length;
    const clipped = el.scrollWidth > el.clientWidth + 1;
    return { ok: lines <= 1 && !clipped, lines, clipped };
  }, id);
}
async function computed(page, id, prop) {
  return page.evaluate(
    (elId, p) => getComputedStyle(document.getElementById(elId))[p],
    id,
    prop,
  );
}

// Level-1 picks one dimension per session; find a seed for each variant so
// both startup layouts are covered.
const probe = await freshPage(1280, 720);
const L1_SEEDS = await probe.evaluate(() => {
  const d = window.yesnoreflexDebug;
  const found = { color: null, shape: null };
  for (let s = 1; s < 400; s += 1) {
    const session = d.generateSession(1, d.mulberry32(s), [], d.QUESTIONS);
    const rule = session.trials[0].activeRule;
    if (found[rule] === null) found[rule] = s;
    if (found.color !== null && found.shape !== null) break;
  }
  return found;
});
await probe.close();
ok(L1_SEEDS.color !== null, "found a Level-1 color seed");
ok(L1_SEEDS.shape !== null, "found a Level-1 shape seed");

/* ================= 1. Core geometry at three widths ================= */
for (const [width, height] of [
  [360, 640],
  [720, 900],
  [1280, 720],
]) {
  const label = width + "px";

  // ---- Practice: Next button geometry across a feedback cycle ----
  let page = await freshPage(width, height);
  await page.click("#modePracticeBtn");
  await page.click("#startBtn");
  await finishWarmups(page);
  ok((await phase(page)) === "question", label + ": practice question shown");
  const yesQ = await box(page, "btnYes");
  const noQ = await box(page, "btnNo");
  await page.click("#btnYes");
  ok((await phase(page)) === "feedback", label + ": practice feedback shown");
  const nextBox = await box(page, "nextBtn");
  ok(
    nextBox !== null && nextBox.h > 0 && nextBox.h <= 72,
    label +
      ": practice Next stays compact (h=" +
      (nextBox ? nextBox.h.toFixed(1) : "?") +
      "px <= 72)",
  );
  const yesF = await box(page, "btnYes");
  const noF = await box(page, "btnNo");
  ok(
    Math.abs(yesQ.x - yesF.x) < 0.5 &&
      Math.abs(yesQ.y - yesF.y) < 0.5 &&
      Math.abs(noQ.x - noF.x) < 0.5 &&
      Math.abs(noQ.y - noF.y) < 0.5,
    label + ": Yes/No do not move between question and feedback",
  );
  await noHScroll(page, label);
  // complete the session for the overlay coverage check
  await page.evaluate(() => {
    const dbg = window.yesnoreflexDebug;
    let guard = 0;
    document.getElementById("nextBtn").click(); // leave first feedback
    while (dbg.state.phase !== "summary" && guard < 80) {
      if (dbg.state.phase === "switch") {
        document.getElementById("swContinue").click();
      } else if (dbg.state.phase === "question") {
        const trial = dbg.state.trials[dbg.state.trialIndex];
        document
          .getElementById(trial.expectedAnswer ? "btnYes" : "btnNo")
          .click();
      } else if (dbg.state.phase === "feedback") {
        document.getElementById("nextBtn").click();
      }
      guard += 1;
    }
  });
  ok((await phase(page)) === "summary", label + ": practice completes");
  const overlayBox = await page.evaluate(() => {
    const el = document.querySelector(".result-overlay");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  });
  ok(
    overlayBox !== null &&
      overlayBox.w >= width - 1 &&
      overlayBox.h >= height - 1,
    label + ": result overlay covers the viewport",
  );
  await page.close();

  // ---- Sprint: Pause geometry in cue/question and across pause cycles ----
  page = await freshPage(width, height);
  await page.click("#startBtn");
  await finishWarmups(page);
  ok((await phase(page)) === "cue", label + ": sprint cue phase");
  let pauseBox = await box(page, "pauseBtn");
  ok(
    pauseBox !== null && pauseBox.h > 0 && pauseBox.h <= 48,
    label +
      ": Pause compact in cue (h=" +
      (pauseBox ? pauseBox.h.toFixed(1) : "?") +
      "px <= 48)",
  );
  await page.waitForFunction(
    () => window.yesnoreflexDebug.state.phase === "question",
    { timeout: 5000 },
  );
  pauseBox = await box(page, "pauseBtn");
  ok(
    pauseBox !== null && pauseBox.h > 0 && pauseBox.h <= 48,
    label + ": Pause compact in question",
  );
  const cueBox = await box(page, "cueTile");
  ok(
    pauseBox.y + pauseBox.h <= cueBox.y + 1,
    label + ": Pause never overlaps the cue area",
  );
  // two pause/resume cycles must leave the geometry untouched
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await page.keyboard.press("p");
    ok(
      (await phase(page)) === "paused",
      label + ": paused (cycle " + cycle + ")",
    );
    await page.click("#resumeBtn");
    await page.waitForFunction(
      () => window.yesnoreflexDebug.state.phase === "question",
      { timeout: 6000 },
    );
  }
  const pauseAfter = await box(page, "pauseBtn");
  ok(
    Math.abs(pauseAfter.h - pauseBox.h) < 0.5 &&
      Math.abs(pauseAfter.y - pauseBox.y) < 0.5,
    label + ": Pause geometry stable across pause/resume cycles",
  );
  await noHScroll(page, label + " sprint");
  await page.close();
}

/* ====== 2. Viewport-relative first-trial visibility (R3-1) ====== */
const PLAY_IDS = ["hudRow", "cueTile", "questionText", "btnYes", "btnNo"];
for (const variant of [
  { name: "L1 color", seed: L1_SEEDS.color, level: 1 },
  { name: "L1 shape", seed: L1_SEEDS.shape, level: 1 },
  { name: "L2 colored shape", seed: 42, level: 2 },
]) {
  for (const mode of ["practice", "sprint"]) {
    const page = await freshPage(360, 640, { seed: variant.seed });
    if (mode === "practice") await page.click("#modePracticeBtn");
    if (variant.level === 2) await page.click("#lvlBtn2");
    await page.click("#startBtn");
    await dismissOpeningCard(page);
    // Start lands on the first warm-up; the alignment helper runs on rAF.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => r())),
    );
    const label = "360px " + variant.name + " " + mode + " Start";
    for (const id of PLAY_IDS) await inViewport(page, id, label);
    await noHScroll(page, label);
    ok(
      await page.evaluate(
        () => document.activeElement !== document.getElementById("startBtn"),
      ),
      label + ": focus does not stay on the hidden setup Start button",
    );
    await page.close();
  }
}
// Play again and tutorial start produce the same alignment.
{
  const page = await freshPage(360, 640, { seed: L1_SEEDS.color });
  await page.click("#modePracticeBtn");
  await page.click("#startBtn");
  await finishWarmups(page);
  await page.evaluate(() => {
    const dbg = window.yesnoreflexDebug;
    let guard = 0;
    while (dbg.state.phase !== "summary" && guard < 80) {
      if (dbg.state.phase === "switch") {
        document.getElementById("swContinue").click();
      } else if (dbg.state.phase === "question") {
        const trial = dbg.state.trials[dbg.state.trialIndex];
        document
          .getElementById(trial.expectedAnswer ? "btnYes" : "btnNo")
          .click();
      } else if (dbg.state.phase === "feedback") {
        document.getElementById("nextBtn").click();
      }
      guard += 1;
    }
    const ov = document.querySelector(".result-overlay");
    if (ov) ov.click();
  });
  ok((await phase(page)) === "summary", "360px: replay session completed");
  await page.click("#playAgainBtn");
  await dismissOpeningCard(page);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r())),
  );
  for (const id of PLAY_IDS) await inViewport(page, id, "360px Play again");
  await page.close();
}
{
  const page = await freshPage(360, 640, { seed: 42, intro: true });
  ok((await phase(page)) === "intro", "360px: fresh visit opens the tutorial");
  for (const id of ["tutStepTitle", "btnYes", "btnNo"]) {
    await inViewport(page, id, "360px tutorial");
  }
  await page.evaluate(() => {
    const d = window.yesnoreflexDebug;
    const steps = [
      () => document.getElementById("btnYes").click(), // ani01: truth yes
      null,
      null,
      // step 4 is a FLIP color example on bod01 (truth yes) -> NO
      () => document.getElementById("btnNo").click(),
      // step 5 is a FLIP shape example on mat01 (truth yes) -> NO
      () => document.getElementById("btnNo").click(),
    ];
    let guard = 0;
    while (d.tutorial.step < 4 && guard < 20) {
      const fn = steps[d.tutorial.step];
      if (fn) fn();
      const next = document.getElementById("btnTutNext");
      if (!next.hidden) next.click();
      const sw = document.getElementById("swContinue");
      if (!document.getElementById("switchOverlay").hidden) sw.click();
      guard += 1;
    }
    if (steps[4]) steps[4]();
  });
  ok(
    await page.evaluate(() => !document.getElementById("btnTutStart").hidden),
    "360px: tutorial reaches its Start control",
  );
  await page.click("#btnTutStart");
  await dismissOpeningCard(page);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r())),
  );
  for (const id of PLAY_IDS) await inViewport(page, id, "360px tutorial start");
  await noHScroll(page, "360px tutorial start");
  await page.close();
}

/* ===== 2b. The opening mapping card fits at every width ===== */
for (const [width, height] of [
  [360, 640],
  [720, 900],
  [1280, 720],
]) {
  const page = await freshPage(width, height, { seed: 311 });
  const label = width + "px opening card";
  await page.click("#modePracticeBtn");
  await page.click("#lvlBtn2");
  await page.click("#startBtn");
  ok(
    (await phase(page)) === "switch",
    label + ": Start opens the mapping card",
  );
  ok(
    (await page.evaluate(
      () => document.getElementById("swTitle").textContent,
    )) === "NEW GAME!",
    label + ": headed NEW GAME!",
  );
  for (const id of ["swTitle", "swRule", "swMap", "swContinue"]) {
    await inViewport(page, id, label);
  }
  await noHScroll(page, label);
  await page.close();
}

/* ============ 3. Switch dialog fits and stays reachable ============ */
for (const [width, height] of [
  [360, 640],
  [1280, 720],
]) {
  const page = await freshPage(width, height, { seed: 55 });
  await page.click("#modePracticeBtn");
  await page.click("#lvlBtn2");
  await page.click("#startBtn");
  await finishWarmups(page);
  const reached = await advanceToSwitch(page);
  const label = width + "px switch dialog";
  ok(reached === "switch", label + ": reached a scored switch");
  for (const id of ["swTitle", "swRule", "swMap", "swContinue"]) {
    await inViewport(page, id, label);
  }
  const rows = await page.evaluate(() => {
    const map = document.getElementById("swMap");
    return [...map.children].map((row) => {
      const r = row.getBoundingClientRect();
      return {
        top: r.top,
        bottom: r.bottom,
        left: r.left,
        right: r.right,
        text: row.textContent.trim(),
        clipped: row.scrollWidth > row.clientWidth + 1,
      };
    });
  });
  ok(rows.length === 2, label + ": both mapping rows rendered");
  ok(
    rows.every(
      (r) =>
        r.top >= -0.5 &&
        r.left >= -0.5 &&
        r.right <= width + 0.5 &&
        r.bottom <= height + 0.5 &&
        !r.clipped &&
        r.text.length > 2,
    ),
    label + ": mapping rows fit without clipping",
  );
  ok(
    await page.evaluate(() => {
      const b = document.getElementById("swContinue").getBoundingClientRect();
      return b.height >= 44;
    }),
    label + ": Continue keeps a 44px target",
  );
  ok(
    Number((await computed(page, "swRule", "fontSize")).replace("px", "")) >=
      18,
    label + ": the new rule is announced in large type",
  );
  await noHScroll(page, label);
  ok(
    await page.evaluate(
      () => document.activeElement === document.getElementById("swContinue"),
    ),
    label + ": Continue holds focus",
  );
  await page.keyboard.press("Enter");
  ok(
    await page.evaluate(() => document.getElementById("switchOverlay").hidden),
    label + ": Enter dismisses the dialog",
  );
  await page.close();
}

/* ========== 4. Panel typography and targets (R3-6) ========== */
{
  const page = await freshPage(360, 640);
  const segFont = await computed(page, "modeSprintBtn", "fontSize");
  const segMin = await computed(page, "modeSprintBtn", "minHeight");
  const starFont = await computed(page, "lvlBtn2", "fontSize");
  const actFont = await computed(page, "startBtn", "fontSize");
  const actMin = await computed(page, "startBtn", "minHeight");
  ok(
    segFont === "13px",
    "panel: .seg-btn font-size is 13px (got " + segFont + ")",
  );
  ok(
    segMin === "44px",
    "panel: .seg-btn min-height is 44px (got " + segMin + ")",
  );
  ok(
    starFont === "15px",
    "panel: .seg-btn.star-btn font-size is 15px (got " + starFont + ")",
  );
  ok(
    actFont === "13px",
    "panel: .action-btn font-size is 13px (got " + actFont + ")",
  );
  ok(
    actMin === "48px",
    "panel: .action-btn min-height is 48px (got " + actMin + ")",
  );
  // Gameplay type stays on the child-facing scale.
  await page.click("#startBtn");
  await dismissOpeningCard(page);
  const qFont = Number(
    (await computed(page, "questionText", "fontSize")).replace("px", ""),
  );
  const aFont = Number(
    (await computed(page, "btnYesLabel", "fontSize")).replace("px", ""),
  );
  const aBox = await box(page, "btnYes");
  ok(qFont >= 26, "gameplay: question stays large (got " + qFont + "px)");
  ok(aFont >= 18, "gameplay: answer label stays large (got " + aFont + "px)");
  ok(aBox.h >= 48, "gameplay: answer target >= 48px (got " + aBox.h + "px)");
  await page.close();
}

/* ===== 5. English and Polish panel labels do not wrap or clip ===== */
for (const width of [320, 360]) {
  for (const lang of ["en", "pl"]) {
    const page = await freshPage(width, 720);
    if (lang === "pl") await page.click("#langBtn");
    const label = width + "px " + lang;
    const ids = [
      "lblMode",
      "modePracticeBtn",
      "modeSprintBtn",
      "lblLevel",
      "lblPace",
      "paceCalmBtn",
      "paceSteadyBtn",
      "paceFastBtn",
      "startBtn",
      "lblHelp",
    ];
    for (const id of ids) {
      const r = await singleLine(page, id);
      ok(
        r.ok,
        label + ": #" + id + " neither wraps nor clips (" + r.lines + " lines)",
      );
    }
    await page.click("#helpToggle");
    for (const id of ["replayTutorialBtn"]) {
      const r = await singleLine(page, id);
      ok(r.ok, label + ": #" + id + " neither wraps nor clips");
    }
    await noHScroll(page, label + " setup");
    // summary actions
    await page.click("#helpToggle");
    await page.click("#modePracticeBtn");
    await page.click("#startBtn");
    await finishWarmups(page);
    await page.evaluate(() => {
      const dbg = window.yesnoreflexDebug;
      let guard = 0;
      while (dbg.state.phase !== "summary" && guard < 80) {
        if (dbg.state.phase === "switch") {
          document.getElementById("swContinue").click();
        } else if (dbg.state.phase === "question") {
          const trial = dbg.state.trials[dbg.state.trialIndex];
          document
            .getElementById(trial.expectedAnswer ? "btnYes" : "btnNo")
            .click();
        } else if (dbg.state.phase === "feedback") {
          document.getElementById("nextBtn").click();
        }
        guard += 1;
      }
      const ov = document.querySelector(".result-overlay");
      if (ov) ov.click();
    });
    for (const id of ["playAgainBtn", "changeSettingsBtn"]) {
      const r = await singleLine(page, id);
      ok(r.ok, label + ": #" + id + " neither wraps nor clips");
    }
    await noHScroll(page, label + " summary");
    await page.close();
  }
}

/* ===== 5b. The play surface never moves when feedback appears ===== */
// Owner report 2026-08-17: the cue and the Yes/No buttons jumped upward the
// moment the comment appeared. Root cause was the Pause button leaving the
// HUD row on every Sprint feedback phase, which resized everything below it.
async function playAnchors(page) {
  return page.evaluate(() => {
    // DOCUMENT coordinates: this check asks whether the LAYOUT moved, so it
    // must be immune to the page scrolling that puppeteer's click performs
    // at the mobile breakpoint.
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return [
        +(b.top + window.scrollY).toFixed(1),
        +(b.left + window.scrollX).toFixed(1),
        +b.height.toFixed(1),
      ];
    };
    return {
      hud: r("#hudRow"),
      cue: r(".cue-tile"),
      question: r("#questionText"),
      yes: r("#btnYes"),
      no: r("#btnNo"),
    };
  });
}
for (const [width, height] of [
  [360, 640],
  [720, 900],
  [1280, 720],
]) {
  for (const mode of ["practice", "sprint"]) {
    const page = await freshPage(width, height, { seed: 1234 });
    const label = width + "px " + mode + " feedback";
    if (mode === "practice") await page.click("#modePracticeBtn");
    await page.click("#lvlBtn3");
    await page.click("#startBtn");
    await finishWarmups(page);
    if (mode === "sprint") {
      await page.waitForFunction(
        () => window.yesnoreflexDebug.state.phase === "question",
        { timeout: 5000 },
      );
    }
    // Sample several trials, answering correctly and incorrectly in turn so
    // both the short and the long feedback shapes are covered.
    let worst = 0;
    for (let i = 0; i < 6; i += 1) {
      const phaseNow = await phase(page);
      if (phaseNow === "switch") {
        await page.click("#swContinue");
        if (mode === "sprint") {
          await page.waitForFunction(
            () => window.yesnoreflexDebug.state.phase === "question",
            { timeout: 5000 },
          );
        }
      }
      if ((await phase(page)) !== "question") break;
      const before = await playAnchors(page);
      const yes = await page.evaluate(
        (wrong) => {
          const st = window.yesnoreflexDebug.state;
          const tr = st.trials[st.trialIndex];
          return wrong ? !tr.expectedAnswer : tr.expectedAnswer;
        },
        i % 2 === 1,
      );
      await page.click(yes ? "#btnYes" : "#btnNo");
      const after = await playAnchors(page);
      for (const key of Object.keys(before)) {
        if (!before[key] || !after[key]) continue;
        const dy = Math.abs(after[key][0] - before[key][0]);
        const dx = Math.abs(after[key][1] - before[key][1]);
        worst = Math.max(worst, dy, dx);
      }
      if (mode === "practice") {
        await page.click("#nextBtn");
      } else {
        await page.waitForFunction(
          () =>
            window.yesnoreflexDebug.state.phase === "cue" ||
            window.yesnoreflexDebug.state.phase === "switch" ||
            window.yesnoreflexDebug.state.phase === "summary",
          { timeout: 4000 },
        );
        if ((await phase(page)) === "summary") break;
        if ((await phase(page)) === "cue") {
          await page.waitForFunction(
            () => window.yesnoreflexDebug.state.phase === "question",
            { timeout: 5000 },
          );
        }
      }
    }
    ok(
      worst < 0.5,
      label +
        ": HUD, cue, question and answers do not move (worst " +
        worst.toFixed(1) +
        "px)",
    );
    await noHScroll(page, label);
    await page.close();
  }
}

/* ===== 5c. A card is never closed by the keystroke that opened it ===== */
// Chrome activates a <button> on Enter KEYDOWN, so a dialog opened from a
// click handler is created while that key is still down; its keyup listener
// would otherwise dismiss it before the child reads anything. jsdom performs
// no native Enter activation, so this can only be caught in a real browser.
{
  const overlayState = (page) =>
    page.evaluate(() => ({
      phase: window.yesnoreflexDebug.state.phase,
      cardOpen: !document.getElementById("switchOverlay").hidden,
      title: document.getElementById("swTitle").textContent,
      celebration: !!document.querySelector(".result-overlay"),
    }));

  // --- opening card, reached by Enter on Start ---
  {
    const page = await freshPage(1280, 800, { seed: 311 });
    await page.click("#modePracticeBtn");
    await page.click("#lvlBtn3");
    await page.focus("#startBtn");
    await page.keyboard.down("Enter");
    const held = await overlayState(page);
    await page.keyboard.up("Enter");
    const released = await overlayState(page);
    ok(held.cardOpen, "Enter on Start opens the mapping card");
    ok(
      released.cardOpen,
      "the Enter that opened the card does not also close it",
    );
    ok(released.title === "NEW GAME!", "the card still reads NEW GAME!");
    // A fresh, complete keystroke does dismiss it.
    await page.keyboard.press("Enter");
    const after = await overlayState(page);
    ok(!after.cardOpen, "a later Enter dismisses the card");
    ok(after.phase === "question", "dismissal starts the first warm-up");
    await page.close();
  }

  // --- Space keeps working (buttons activate on Space keyup) ---
  {
    const page = await freshPage(1280, 800, { seed: 311 });
    await page.click("#modePracticeBtn");
    await page.focus("#startBtn");
    await page.keyboard.press("Space");
    const st = await overlayState(page);
    ok(st.cardOpen, "Space on Start also opens the card and leaves it open");
    await page.keyboard.press("Space");
    ok(
      !(await overlayState(page)).cardOpen,
      "a later Space dismisses the card",
    );
    await page.close();
  }

  // --- switch cards reached by Enter on Next, plus the celebration ---
  {
    const page = await freshPage(1280, 800, { seed: 42 });
    await page.click("#modePracticeBtn");
    await page.click("#lvlBtn3");
    await page.click("#startBtn");
    await dismissOpeningCard(page);
    await finishWarmups(page);
    let switchesSeen = 0;
    let flashed = 0;
    let celebrationSurvived = null;
    for (let guard = 0; guard < 80; guard += 1) {
      const st = await overlayState(page);
      if (st.celebration) {
        celebrationSurvived = true;
        break;
      }
      if (st.cardOpen) {
        switchesSeen += 1;
        await page.click("#swContinue");
        continue;
      }
      const phaseNow = await phase(page);
      if (phaseNow === "summary") break;
      if (phaseNow === "question") {
        const yes = await page.evaluate(() => {
          const s = window.yesnoreflexDebug.state;
          return s.trials[s.trialIndex].expectedAnswer;
        });
        await page.click(yes ? "#btnYes" : "#btnNo");
        continue;
      }
      if (phaseNow === "feedback") {
        // Practice focuses Next; press Enter the way a keyboard child does.
        await page.keyboard.down("Enter");
        await page.keyboard.up("Enter");
        const post = await overlayState(page);
        if (post.phase === "switch" && !post.cardOpen) flashed += 1;
        if (post.celebration === false && post.phase === "summary") {
          celebrationSurvived = false;
        }
        continue;
      }
      break;
    }
    ok(switchesSeen > 0, "the run reached at least one scored switch card");
    ok(
      flashed === 0,
      "no switch card is opened and closed by the same Enter (" +
        flashed +
        " flashed)",
    );
    ok(
      celebrationSurvived !== false,
      "the Enter that ends the session does not also dismiss the celebration",
    );
    await page.close();
  }
}

/* ===== 5d. Panel memory ramp: ★ shows the pair, ★★/★★★ hide the panel ===== */
{
  // ★: the panel stays as a 2-line reference of the current pair.
  const page = await freshPage(1280, 800, { seed: 55 });
  await page.click("#modePracticeBtn");
  await page.click("#startBtn");
  await dismissOpeningCard(page);
  const l1 = await page.evaluate(() => {
    const panel = document.getElementById("panel");
    const stage = document.querySelector(".stage-wrap");
    const st = window.yesnoreflexDebug.state;
    const dim = st.blocks[0].dim;
    const group = document.getElementById(
      dim === "color" ? "kgColor" : "kgShape",
    );
    const other = document.getElementById(
      dim === "color" ? "kgShape" : "kgColor",
    );
    return {
      panelHidden: panel.hidden,
      panelW: panel.getBoundingClientRect().width,
      stageW: stage.getBoundingClientRect().width,
      groupVisible: !group.hidden,
      otherHidden: other.hidden,
      rows: group.querySelectorAll(".key-word").length,
    };
  });
  ok(!l1.panelHidden && l1.panelW > 200, "★ play keeps the panel");
  ok(l1.groupVisible && l1.otherHidden, "★ panel shows only the current pair");
  ok(l1.rows === 2, "★ panel key is two lines");
  await page.close();

  // ★★: the panel is gone and the stage takes the full width. Sprint, so
  // the pause path below is available (Practice has no Pause).
  const page2 = await freshPage(1280, 800, { seed: 55 });
  await page2.click("#lvlBtn2");
  await page2.click("#startBtn");
  await dismissOpeningCard(page2);
  const l2 = await page2.evaluate(() => ({
    panelHidden: document.getElementById("panel").hidden,
    stageW: document.querySelector(".stage-wrap").getBoundingClientRect().width,
    mainW: document.querySelector(".main").getBoundingClientRect().width,
  }));
  ok(l2.panelHidden, "★★ play hides the panel");
  ok(
    Math.abs(l2.stageW - l2.mainW) < 2,
    "★★ stage takes the full width (" + l2.stageW + " of " + l2.mainW + ")",
  );
  // Pause: the curtain's mapping card is inside the viewport.
  await finishWarmups(page2);
  await page2.waitForFunction(
    () => window.yesnoreflexDebug.state.phase === "question",
    { timeout: 5000 },
  );
  await page2.keyboard.press("p");
  await inViewport(page2, "curtainMap", "1280px pause mapping card");
  ok(
    await page2.evaluate(
      () => document.getElementById("curtainMap").children.length === 2,
    ),
    "pause card holds both mapping rows",
  );
  await page2.close();
}

/* ===== 5e. Production DOM pass: geometry without ?debug=1 (F17) ===== */
{
  // Every other assertion runs against a ?debug=1 DOM that injects a debug
  // panel section production never renders. Re-check the core play geometry
  // once against the exact production DOM (no debug flag, no dbg handle —
  // driven blind through the UI).
  const page = await browser.newPage();
  await page.bringToFront();
  await page.setViewport({ width: 360, height: 640 });
  const prodUrl = "http://127.0.0.1:" + port + "/yesnoreflex/index.html";
  await page.goto(prodUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      localStorage.setItem("yesnoreflexIntroSeenV1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(prodUrl, { waitUntil: "domcontentloaded" });
  ok(
    await page.evaluate(() => !window.yesnoreflexDebug),
    "production DOM has no debug handle",
  );
  await page.click("#modePracticeBtn");
  await page.click("#startBtn");
  await page.evaluate(() => {
    const sw = document.getElementById("swContinue");
    if (!document.getElementById("switchOverlay").hidden) sw.click();
  });
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r())),
  );
  for (const id of ["hudRow", "cueTile", "questionText", "btnYes", "btnNo"]) {
    await inViewport(page, id, "360px production DOM");
  }
  await noHScroll(page, "360px production DOM");
  // Answer blind (right or wrong, geometry must hold either way).
  const before = await page.evaluate(() => {
    const r = (id) => {
      const b = document.getElementById(id).getBoundingClientRect();
      return [
        +(b.top + window.scrollY).toFixed(1),
        +(b.left + window.scrollX).toFixed(1),
      ];
    };
    return { yes: r("btnYes"), q: r("questionText") };
  });
  await page.click("#btnYes");
  const after = await page.evaluate(() => {
    const r = (id) => {
      const b = document.getElementById(id).getBoundingClientRect();
      return [
        +(b.top + window.scrollY).toFixed(1),
        +(b.left + window.scrollX).toFixed(1),
      ];
    };
    return { yes: r("btnYes"), q: r("questionText") };
  });
  ok(
    JSON.stringify(before) === JSON.stringify(after),
    "production DOM: answering moves nothing",
  );
  await page.close();
}

/* ============ 6. Critical surfaces repeat at 200% zoom ============ */
// Browser zoom enlarges the CSS pixel, so a 360x640 device viewport at 200%
// exposes a 180x320 CSS viewport. Content taller than that may legitimately
// need vertical scrolling; it must never need horizontal scrolling and must
// always be reachable.
async function reachable(page, id, label) {
  const result = await page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) return null;
    const style = getComputedStyle(el);
    if (
      el.hidden ||
      style.display === "none" ||
      style.visibility === "hidden"
    ) {
      return { rendered: false };
    }
    el.scrollIntoView({ block: "center", behavior: "auto" });
    const r = el.getBoundingClientRect();
    return {
      rendered: true,
      fitsWidth: r.width <= window.innerWidth + 0.5,
      onScreen:
        r.bottom > 0 &&
        r.top < window.innerHeight &&
        r.left >= -0.5 &&
        r.right <= window.innerWidth + 0.5,
      fontSize: parseFloat(style.fontSize),
    };
  }, id);
  ok(result !== null && result.rendered, label + ": #" + id + " is rendered");
  if (!result || !result.rendered) return;
  ok(result.fitsWidth, label + ": #" + id + " fits the viewport width");
  ok(result.onScreen, label + ": #" + id + " is reachable by scrolling");
  ok(result.fontSize >= 11, label + ": #" + id + " stays legible");
}
{
  const page = await freshPage(180, 320, { seed: 55 });
  await reachable(page, "setupTitle", "200% zoom setup");
  await reachable(page, "setupPoint1", "200% zoom setup");
  await reachable(page, "startBtn", "200% zoom setup");
  await noHScroll(page, "200% zoom setup");
  await page.click("#modePracticeBtn");
  await page.click("#lvlBtn2");
  await page.click("#startBtn");
  await dismissOpeningCard(page);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => r())),
  );
  for (const id of ["hudRow", "cueTile", "questionText", "btnYes", "btnNo"]) {
    await reachable(page, id, "200% zoom play");
  }
  await noHScroll(page, "200% zoom play");
  await finishWarmups(page);
  const reached = await advanceToSwitch(page);
  ok(reached === "switch", "200% zoom: reached a scored switch");
  for (const id of ["swTitle", "swRule", "swMap", "swContinue"]) {
    await reachable(page, id, "200% zoom switch dialog");
  }
  await noHScroll(page, "200% zoom switch dialog");
  ok(
    await page.evaluate(() => {
      const map = document.getElementById("swMap");
      return [...map.children].every(
        (row) => row.scrollWidth <= row.clientWidth + 1,
      );
    }),
    "200% zoom switch dialog: mapping rows are not clipped",
  );
  await page.keyboard.press("Enter");
  ok(
    await page.evaluate(() => document.getElementById("switchOverlay").hidden),
    "200% zoom switch dialog: Enter dismisses",
  );
  await page.close();
}

await browser.close();
server.close();

if (failures === 0) {
  console.log("OK: " + checks + " real-Chrome layout checks passed");
  process.exit(0);
} else {
  console.error(failures + " of " + checks + " layout checks FAILED");
  process.exit(1);
}
