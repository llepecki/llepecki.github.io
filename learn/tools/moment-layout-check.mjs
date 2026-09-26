#!/usr/bin/env node
/*
 * Real-Chrome layout check for moment/index.html (Moment Lab).
 *
 * Serves learn/ over a local HTTP server, launches the system Chrome via
 * puppeteer-core (never downloads a browser), and measures real DOM and
 * canvas geometry across the spec 19.3 viewport matrix: board-scale paper
 * values at 320/360/390, the 720/721 breakpoint pair, measured 48x48px
 * child targets (including canvas hit regions exercised by synthetic
 * pointers), Guide step 5 card geometry, Polish label stacks, feedback
 * stability, and the result overlay.
 *
 * Exit codes: 0 = pass, 1 = assertion failures, 2 = no Chrome found.
 * Run from learn/: npm run moment-layout-check
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const chromePath = findChrome();
if (!chromePath) {
  console.error(
    "FAIL: no Chrome found. Install Google Chrome or set CHROME_PATH to a " +
      "Chrome/Chromium binary, then re-run npm run moment-layout-check.",
  );
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const learnRoot = path.join(here, "..");
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const filePath = path.join(learnRoot, urlPath);
    if (!filePath.startsWith(learnRoot)) {
      throw new Error("traversal");
    }
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
const base = "http://127.0.0.1:" + port + "/moment/index.html";

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error("FAIL: " + msg);
  }
}
function near(actual, expected, tol, msg) {
  ok(
    Math.abs(actual - expected) <= tol,
    msg + " (got " + actual + ", want " + expected + " ±" + tol + ")",
  );
}

function parseCssColor(value) {
  const hex = /^#([0-9a-f]{6})$/i.exec(String(value || "").trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const parts = String(value || "").match(/[\d.]+/g);
  if (!parts || parts.length < 3) {
    throw new Error("Unsupported CSS color: " + value);
  }
  return {
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
    a: parts.length >= 4 ? Number(parts[3]) : 1,
  };
}

function composite(top, bottom) {
  const alpha = top.a + bottom.a * (1 - top.a);
  if (alpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  return {
    r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / alpha,
    g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / alpha,
    b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / alpha,
    a: alpha,
  };
}

function relativeLuminance(color) {
  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b)
  );
}

function colorContrast(first, second) {
  const l1 = relativeLuminance(first);
  const l2 = relativeLuminance(second);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function contrastOn(
  foregroundCss,
  backgroundCss,
  underlayCss = "rgb(255, 255, 255)",
) {
  const underlay = parseCssColor(underlayCss);
  const background = composite(parseCssColor(backgroundCss), underlay);
  const foreground = composite(parseCssColor(foregroundCss), background);
  return colorContrast(foreground, background);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "shell",
  args: ["--no-sandbox", "--disable-gpu"],
});

const debugErrors = [];

async function freshPage(
  width,
  height,
  { query = "?debug=1&seed=42", intro = false, reduce = true } = {},
) {
  const page = await browser.newPage();
  await page.bringToFront();
  await page.setViewport({ width, height });
  page.on("console", (msg) => {
    if (msg.type() === "error" && msg.text().indexOf("[moment debug]") !== -1) {
      debugErrors.push(width + "x" + height + ": " + msg.text());
    }
  });
  if (reduce) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await page.goto(base + query, { waitUntil: "domcontentloaded" });
  await page.evaluate((seen) => {
    try {
      localStorage.clear();
      if (seen) {
        localStorage.setItem("momentIntroSeenV1", "1");
      }
    } catch {
      /* ignore */
    }
  }, !intro);
  await page.goto(base + query, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => window.__momentTest && window.__momentTest.state,
  );
  /* Let web fonts settle so text metrics do not shift between captures. */
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const timer = setTimeout(resolve, 1500);
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            clearTimeout(timer);
            resolve();
          });
        }
      }),
  );
  return page;
}

async function box(page, id) {
  return page.evaluate((elId) => {
    const el = document.getElementById(elId);
    if (!el) {
      return null;
    }
    const r = el.getBoundingClientRect();
    return {
      x: r.x + window.scrollX,
      y: r.y + window.scrollY,
      w: r.width,
      h: r.height,
      hidden: el.hidden || getComputedStyle(el).display === "none",
    };
  }, id);
}

async function noHScroll(page, label) {
  const sw = await page.evaluate(
    () =>
      document.scrollingElement.scrollWidth -
      document.scrollingElement.clientWidth,
  );
  ok(sw <= 1, label + ": no horizontal scroll (overflow " + sw + "px)");
}

async function noPageScroll(page, label) {
  const sh = await page.evaluate(
    () =>
      document.scrollingElement.scrollHeight -
      document.scrollingElement.clientHeight,
  );
  ok(sh <= 1, label + ": no vertical page scroll (overflow " + sh + "px)");
}

async function target48(page, id, label, minW = 48, minH = 48) {
  const b = await box(page, id);
  ok(b !== null && !b.hidden, label + ": " + id + " present");
  if (b && !b.hidden) {
    ok(
      b.w >= minW - 0.5 && b.h >= minH - 0.5,
      label +
        ": " +
        id +
        " target " +
        b.w.toFixed(1) +
        "x" +
        b.h.toFixed(1) +
        " >= " +
        minW +
        "x" +
        minH,
    );
  }
}

async function geom(page) {
  return page.evaluate(() => ({
    W: window.__momentTest.geom.W,
    H: window.__momentTest.geom.H,
    beamY: window.__momentTest.geom.beamY,
    beamPx: window.__momentTest.geom.beamPx,
    forcePxPerN: window.__momentTest.geom.forcePxPerN,
  }));
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
function expectedScale(W, H) {
  const safeW = W - 32;
  const availableH = H - 72 - 70;
  const horizontalLimit = (safeW * 0.25) / 5;
  const verticalLimit = (availableH / 2 - 24) / 5;
  const forcePxPerN = clamp(Math.min(horizontalLimit, verticalLimit), 14, 34);
  return { forcePxPerN, beamPx: Math.min(760, safeW - 2 * 5 * forcePxPerN) };
}

async function synthPointer(page, type, x, y, pointerId = 1, isPrimary = true) {
  await page.evaluate(
    (t, px, py, pid, prim) => {
      const e = new MouseEvent(t, {
        bubbles: true,
        cancelable: true,
        clientX: px,
        clientY: py,
      });
      Object.defineProperties(e, {
        pointerId: { value: pid },
        isPrimary: { value: prim },
      });
      const rect = document.getElementById("board").getBoundingClientRect();
      Object.defineProperties(e, {
        clientX: { value: rect.left + px },
        clientY: { value: rect.top + py },
      });
      document.getElementById("board").dispatchEvent(e);
    },
    type,
    x,
    y,
    pointerId,
    isPrimary,
  );
}

/* ================= 1. Board-scale paper values (spec 14.4) ================= */
{
  const rows = [
    { vw: 320, vh: 568, cw: 320, ch: 360, forcePxPerN: 14.4, beamPx: 144.0 },
    { vw: 360, vh: 640, cw: 360, ch: 360, forcePxPerN: 16.4, beamPx: 164.0 },
    { vw: 390, vh: 844, cw: 390, ch: 472.64, forcePxPerN: 17.9, beamPx: 179.0 },
  ];
  for (const row of rows) {
    const page = await freshPage(row.vw, row.vh);
    const g = await geom(page);
    const label = row.vw + "x" + row.vh;
    near(g.W, row.cw, 1, label + ": canvas CSS width");
    near(g.H, row.ch, 1, label + ": canvas CSS height");
    near(
      g.forcePxPerN,
      row.forcePxPerN,
      0.1,
      label + ": forcePxPerN paper value",
    );
    near(g.beamPx, row.beamPx, 0.1, label + ": beamPx paper value");
    const exp = expectedScale(g.W, g.H);
    near(
      g.forcePxPerN,
      exp.forcePxPerN,
      0.001,
      label + ": computeBoardScale formula",
    );
    near(g.beamPx, exp.beamPx, 0.001, label + ": beamPx formula");
    /* uniform scale: max 5 N arrows at both beam ends stay inside */
    const leftHead = g.W / 2 - g.beamPx / 2 - 5 * g.forcePxPerN;
    const rightHead = g.W / 2 + g.beamPx / 2 + 5 * g.forcePxPerN;
    const topHead = g.beamY - 5 * g.forcePxPerN;
    const bottomHead = g.beamY + 5 * g.forcePxPerN;
    ok(leftHead >= 16 - 0.1, label + ": left envelope " + leftHead.toFixed(1));
    ok(
      rightHead <= g.W - 16 + 0.1,
      label + ": right envelope " + rightHead.toFixed(1),
    );
    ok(topHead >= 72 - 48.1, label + ": top envelope " + topHead.toFixed(1));
    ok(
      bottomHead <= g.H - 70 + 48.1,
      label + ": bottom envelope " + bottomHead.toFixed(1),
    );
    await noHScroll(page, label);
    await page.close();
  }
  console.log("ok   1. board-scale paper values");
}

/* ================= 2. Breakpoint pair 720 / 721 ================= */
{
  let page = await freshPage(720, 900);
  let canvasB = await box(page, "canvasWrap");
  let panelB = await box(page, "panel");
  ok(canvasB.y + canvasB.h <= panelB.y + 1, "720: canvas precedes the panel");
  near(panelB.w, 720, 1, "720: panel is full width");
  await noHScroll(page, "720");
  await page.close();

  page = await freshPage(721, 900);
  canvasB = await box(page, "canvasWrap");
  panelB = await box(page, "panel");
  ok(
    canvasB.x + canvasB.w <= panelB.x + 1,
    "721: canvas and panel side by side",
  );
  near(panelB.w, 320, 1, "721: panel width 320");
  ok(
    Math.abs(canvasB.y - panelB.y) <= 1,
    "721: canvas and panel share the top row",
  );
  await page.close();
  console.log("ok   2. breakpoint behavior");
}

/* ================= 3. Desktop 1280x720: fit, panel, feedback stability ================= */
{
  /* feedback stability at the desktop size AND every mandated narrow
     viewport (spec 19.3): revealing the longest feedback moves nothing, and
     the Next button that appears after a correct reveal is a 48px target. */
  for (const [vw, vh] of [
    [1280, 720],
    [390, 844],
    [360, 640],
    [320, 568],
  ]) {
    const label = String(vw);
    const page = await freshPage(vw, vh, {
      query: "?debug=1&scenario=balance-l2-11",
    });
    if (vw === 1280) {
      await noPageScroll(page, label);
    }
    await noHScroll(page, label);
    const before = {
      canvas: await box(page, "canvasWrap"),
      prompt: await box(page, "missionPrompt"),
      check: await box(page, "checkBtn"),
      prev: await box(page, "prevSocketBtn"),
    };
    await page.evaluate(() => {
      window.__momentTest.actions.placeMovable(-4);
    });
    await page.click("#checkBtn");
    await page.waitForFunction(
      () => window.__momentTest.state.revealPhase.kind === "complete",
    );
    const after = {
      canvas: await box(page, "canvasWrap"),
      prompt: await box(page, "missionPrompt"),
      check: await box(page, "checkBtn"),
      prev: await box(page, "prevSocketBtn"),
    };
    for (const key of Object.keys(before)) {
      ok(
        Math.abs(before[key].x - after[key].x) < 0.5 &&
          Math.abs(before[key].y - after[key].y) < 0.5 &&
          Math.abs(before[key].w - after[key].w) < 0.5 &&
          Math.abs(before[key].h - after[key].h) < 0.5,
        label + ": " + key + " does not move when feedback appears",
      );
    }
    const fb = await page.evaluate(
      () => document.querySelectorAll("#feedbackRegion .feedback-block").length,
    );
    ok(
      fb === 4,
      label + ": wrong feedback rendered with the misconception tip",
    );
    /* correct retry: the panel Next (and on desktop the on-stage Next) */
    await page.evaluate(() => {
      const t = window.__momentTest;
      const rec = t.bank.find(
        (r) => r.id === t.state.sessionScenarioIds[t.state.roundIndex],
      );
      const correct = t.helpers.legalBalanceSockets(rec).find((x) => {
        const scaffold = t.helpers.buildMomentScaffold(
          [
            ...rec.forces,
            { x, y: 0, magnitude: rec.movableMagnitude, angleDeg: 270 },
          ],
          { x: 0, y: 0 },
        );
        return Math.abs(scaffold.ccwTotal - scaffold.cwTotal) < 1e-9;
      });
      t.actions.placeMovable(correct);
    });
    await page.click("#checkBtn");
    await page.waitForFunction(
      () =>
        window.__momentTest.state.revealPhase.kind === "complete" &&
        !document.getElementById("nextBtn").hidden,
    );
    const nextBox = await box(page, "nextBtn");
    ok(
      nextBox.h >= 48 && nextBox.w >= 48,
      label + ": panel Next is a 48px target when visible",
    );
    if (vw === 1280) {
      const stageNext = await box(page, "stageNextBtn");
      ok(stageNext.h >= 48, label + ": on-stage Next is a 48px target");
      const wrap = await box(page, "canvasWrap");
      ok(
        stageNext.x >= wrap.x &&
          stageNext.x + stageNext.w <= wrap.x + wrap.w &&
          stageNext.y + stageNext.h <= wrap.y + wrap.h,
        label + ": on-stage Next stays inside the stage",
      );
    }
    await page.close();
  }

  /* Explore panel fits without scrolling, two-force mode, help collapsed */
  const page2 = await freshPage(1280, 720);
  await page2.click("#twoForcesBtn");
  const panelFit = await page2.evaluate(() => {
    const panel = document.getElementById("panel");
    return { sh: panel.scrollHeight, ch: panel.clientHeight };
  });
  ok(
    panelFit.sh <= panelFit.ch + 1,
    "1280: four-section Explore panel fits without scrolling (" +
      panelFit.sh +
      " vs " +
      panelFit.ch +
      ")",
  );
  await page2.click("#langBtn");
  const panelFitPl = await page2.evaluate(() => {
    const panel = document.getElementById("panel");
    return { sh: panel.scrollHeight, ch: panel.clientHeight };
  });
  ok(
    panelFitPl.sh <= panelFitPl.ch + 1,
    "1280: Polish Explore panel fits without scrolling (" +
      panelFitPl.sh +
      " vs " +
      panelFitPl.ch +
      ")",
  );
  await page2.close();
  console.log("ok   3. desktop fit and feedback stability");
}

/* ================= 4. 1024x768 explore extremes, no debug errors ================= */
{
  const page = await freshPage(1024, 768);
  await page.evaluate(() => {
    const a = window.__momentTest.actions;
    a.setExploreForceCount(2);
    a.selectExploreForce("f1");
    a.setForceProperty("x", -4);
    a.setForceProperty("magnitude", 5);
    a.setForceProperty("angleDeg", 90);
    a.selectExploreForce("f2");
    a.setForceProperty("x", 4);
    a.setForceProperty("magnitude", 5);
    a.setForceProperty("angleDeg", 270);
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
  const g = await geom(page);
  ok(g.beamPx > 0 && g.forcePxPerN >= 14, "1024: sane board scale");
  await noHScroll(page, "1024");
  await page.close();
  console.log("ok   4. 1024x768 extremes");
}

/* ================= 5. Measured 48px targets across viewports ================= */
{
  for (const [vw, vh] of [
    [1280, 720],
    [390, 844],
    [360, 640],
    [320, 568],
  ]) {
    const label = vw + "px";
    /* explore surface — the exact-value rows are collapsed for a fine
       pointer, so open them before measuring their targets */
    let page = await freshPage(vw, vh);
    await page.click("#adjustToggle");
    for (const id of [
      "langBtn",
      "modeExploreBtn",
      "modeGameBtn",
      "guideBtn",
      "oneForceBtn",
      "twoForcesBtn",
      "adjustToggle",
      "strengthMinus",
      "strengthPlus",
      "positionMinus",
      "positionPlus",
      "directionMinus",
      "directionPlus",
      "resetBtn",
      "helpToggle",
    ]) {
      await target48(page, id, label + " explore");
    }
    await page.close();
    /* game setup + predict answers */
    page = await freshPage(vw, vh, {
      query: "?debug=1&scenario=predict-l3-11",
    });
    await page.evaluate(() => {
      document.getElementById("hintBtn").scrollIntoView({ block: "center" });
    });
    for (const id of [
      "answerCcwBtn",
      "answerBalancedBtn",
      "answerCwBtn",
      "hintBtn",
      "nextBtn",
    ]) {
      if (id === "nextBtn") {
        /* hidden until a reveal completes; measured in check 3's
           feedback-state pass at every mandated viewport */
        continue;
      }
      await target48(page, id, label + " predict");
    }
    await page.close();
    /* balance round */
    page = await freshPage(vw, vh, {
      query: "?debug=1&scenario=balance-l3-01",
    });
    for (const id of [
      "prevSocketBtn",
      "nextSocketBtn",
      "checkBtn",
      "guideBtn",
    ]) {
      await target48(page, id, label + " balance");
    }
    await page.close();
    /* guide */
    page = await freshPage(vw, vh, { intro: true, query: "?debug=1" });
    for (const id of ["exitGuideBtn", "introPrevBtn", "introNextBtn"]) {
      await target48(page, id, label + " guide");
    }
    if (vw === 1280) {
      const exit = await box(page, "exitGuideBtn");
      ok(
        exit !== null && exit.h <= 64,
        label +
          ": Exit guide remains a compact action (height " +
          (exit ? exit.h.toFixed(1) : "missing") +
          "px, maximum 64px)",
      );
    }
    await page.close();
  }
  console.log("ok   5. measured 48px targets");
}

/* ============ 5b. Exact-value rows collapse by default on a mouse ============ */
{
  for (const [vw, vh] of [
    [1280, 720],
    [390, 844],
    [320, 568],
  ]) {
    const page = await freshPage(vw, vh);
    const collapsed = await page.evaluate(() => {
      const panel = document.getElementById("panel");
      return {
        hidden: document.getElementById("adjustBody").hidden,
        expanded: document
          .getElementById("adjustToggle")
          .getAttribute("aria-expanded"),
        slack: panel.clientHeight - panel.scrollHeight,
        forcesH: Math.round(
          document
            .getElementById("exploreForcesSection")
            .getBoundingClientRect().height,
        ),
      };
    });
    const label = vw + " adjust";
    ok(collapsed.hidden === true, label + ": exact-value rows start collapsed");
    ok(
      collapsed.expanded === "false",
      label + ": collapsed state exposed via aria-expanded",
    );
    ok(
      collapsed.slack >= 0,
      label +
        ": collapsed Explore panel fits (" +
        collapsed.slack +
        "px slack)",
    );
    await page.click("#twoForcesBtn");
    const expanded = await page.evaluate(async () => {
      document.getElementById("adjustToggle").click();
      await new Promise((r) => requestAnimationFrame(r));
      const panel = document.getElementById("panel");
      return {
        hidden: document.getElementById("adjustBody").hidden,
        expanded: document
          .getElementById("adjustToggle")
          .getAttribute("aria-expanded"),
        forcesH: Math.round(
          document
            .getElementById("exploreForcesSection")
            .getBoundingClientRect().height,
        ),
        sliderReachable:
          document.getElementById("strengthSlider").getBoundingClientRect()
            .height > 0,
      };
    });
    ok(expanded.hidden === false, label + ": toggle reveals the rows");
    ok(
      expanded.expanded === "true",
      label + ": expanded state exposed via aria-expanded",
    );
    ok(
      expanded.sliderReachable,
      label + ": sliders are measurable once revealed",
    );
    ok(
      expanded.forcesH > collapsed.forcesH,
      label +
        ": collapsing reclaims panel height (" +
        collapsed.forcesH +
        " -> " +
        expanded.forcesH +
        "px)",
    );
    await page.close();
  }
  /* The historically tight case — Polish copy, two forces, every exact-value
     row revealed — must still fit, otherwise collapsing the rows would have
     only hidden a panel that still overflows when opened. */
  for (const [vw, vh] of [
    [1280, 720],
    [1024, 768],
  ]) {
    const page = await freshPage(vw, vh);
    await page.click("#langBtn");
    await page.click("#twoForcesBtn");
    await page.click("#adjustToggle");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
    const fit = await page.evaluate(() => {
      const panel = document.getElementById("panel");
      return { sh: panel.scrollHeight, ch: panel.clientHeight };
    });
    /* Expanded is a deliberate, user-initiated reveal, so the panel may
       scroll there; what must hold is that it scrolls rather than clipping,
       and that the last control stays reachable. The default state's strict
       no-scroll fit is asserted above. */
    const reach = await page.evaluate(() => {
      const panel = document.getElementById("panel");
      panel.scrollTop = panel.scrollHeight;
      const last = document.getElementById("directionPlus");
      const lr = last.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      return {
        overflowY: getComputedStyle(panel).overflowY,
        visible: lr.top >= pr.top - 1 && lr.bottom <= pr.bottom + 1,
        h: Math.round(lr.height),
      };
    });
    ok(
      reach.overflowY === "auto" || reach.overflowY === "scroll",
      vw + ": expanded Polish panel scrolls rather than clipping",
    );
    ok(
      reach.visible && reach.h >= 44,
      vw + ": the last exact-value control is reachable by scrolling",
    );
    await noHScroll(page, vw + " pl expanded");
    await page.close();
  }
  console.log("ok   5b. exact-value disclosure");
}

/* ================= 6. Canvas hit regions via synthetic pointers ================= */
{
  for (const [vw, vh] of [
    [390, 844],
    [360, 640],
    [320, 568],
  ]) {
    const hitLabel = "hit@" + vw;
    const page = await freshPage(vw, vh);
    const g = await geom(page);
    const pxPerMetre = g.beamPx / 8;
    /* force head hit region: pointer 23px from the head centre begins a drag */
    const headX = g.W / 2 + 3 * pxPerMetre;
    const headY = g.beamY + 2 * g.forcePxPerN;
    await synthPointer(page, "pointerdown", headX + 23, headY);
    let dragActive = await page.evaluate(() => {
      return document.getElementById("board").classList.contains("dragging");
    });
    ok(
      dragActive,
      hitLabel + ": head region reaches 23px from centre (48px diameter)",
    );
    /* secondary pointer must not disturb the primary drag */
    await synthPointer(page, "pointerdown", 30, 30, 2, false);
    await synthPointer(page, "pointermove", 60, 60, 2, true);
    const before = await page.evaluate(() =>
      JSON.stringify(window.__momentTest.state.forces[0]),
    );
    await synthPointer(page, "pointermove", 62, 62, 2, true);
    const afterSecondary = await page.evaluate(() =>
      JSON.stringify(window.__momentTest.state.forces[0]),
    );
    ok(
      before === afterSecondary,
      hitLabel + ": secondary pointer ignored during primary drag",
    );
    /* drag then cancel restores the pre-drag geometry */
    await synthPointer(page, "pointermove", headX + 40, headY + 40);
    const during = await page.evaluate(() =>
      JSON.stringify(window.__momentTest.state.forces[0]),
    );
    await synthPointer(page, "pointercancel", headX + 40, headY + 40);
    const restored = await page.evaluate(() =>
      JSON.stringify(window.__momentTest.state.forces[0]),
    );
    ok(
      during !== restored || before === during,
      hitLabel + ": drag changed state while active",
    );
    ok(
      restored === before,
      hitLabel + ": pointercancel restores pre-drag geometry",
    );
    const attempts = await page.evaluate(
      () => window.__momentTest.state.attemptCount,
    );
    ok(attempts === 0, hitLabel + ": cancellation records no attempt");
    /* tail hit region 23px */
    const tailX = g.W / 2 + 3 * pxPerMetre;
    await synthPointer(page, "pointerdown", tailX - 23, g.beamY);
    dragActive = await page.evaluate(() =>
      document.getElementById("board").classList.contains("dragging"),
    );
    ok(dragActive, hitLabel + ": tail region reaches 23px from centre");
    await synthPointer(page, "pointerup", tailX - 23, g.beamY);
    await page.close();

    /* movable tag region in balance */
    const page2 = await freshPage(vw, vh, {
      query: "?debug=1&scenario=balance-l1-01",
    });
    const g2 = await geom(page2);
    const dockY = g2.H - 40 - 56 + 28 + 6;
    await synthPointer(page2, "pointerdown", g2.W / 2 + 20, dockY - 20);
    const tagDrag = await page2.evaluate(() =>
      document.getElementById("board").classList.contains("dragging"),
    );
    ok(
      tagDrag,
      hitLabel + ": movable tag 48x56 region grabbable from its corner",
    );
    await synthPointer(page2, "pointercancel", g2.W / 2, dockY);
    const placement = await page2.evaluate(() =>
      JSON.stringify(window.__momentTest.state.balancePlacement),
    );
    ok(
      placement === JSON.stringify({ status: "unplaced", socketX: null }),
      hitLabel + ": cancelled tag drag restores the dock state",
    );
    await page2.close();
  }
  console.log("ok   6. canvas hit regions and multi-pointer");
}

/* ================= 7. Guide step 5 card geometry ================= */
{
  for (const [vw, vh] of [
    [320, 568],
    [360, 640],
    [390, 844],
  ]) {
    const page = await freshPage(vw, vh, { intro: true, query: "?debug=1" });
    await page.evaluate(() => window.__momentTest.guide.goto(5));
    const label = vw + "px step5";
    const layout = await page.evaluate(() => {
      const wrap = document
        .getElementById("canvasWrap")
        .getBoundingClientRect();
      const layer = document
        .getElementById("guideLayer")
        .getBoundingClientRect();
      const cards = [...document.querySelectorAll(".guide-card")].map((c) => {
        const r = c.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      });
      const grid = document
        .querySelector(".guide-cards")
        .getBoundingClientRect();
      const question = document
        .querySelector(".guide-question")
        .getBoundingClientRect();
      const panel = document
        .getElementById("introPanel")
        .getBoundingClientRect();
      return {
        wrap: { x: wrap.x, y: wrap.y, w: wrap.width, h: wrap.height },
        layer: { x: layer.x, y: layer.y, w: layer.width, h: layer.height },
        cards,
        grid: { x: grid.x, y: grid.y, w: grid.width, h: grid.height },
        question: { y: question.y, h: question.height },
        panel: { y: panel.y },
        vw: document.documentElement.clientWidth,
      };
    });
    ok(layout.cards.length === 3, label + ": three cards");
    ok(
      layout.layer.x >= layout.wrap.x - 0.5 &&
        layout.layer.x + layout.layer.w <= layout.wrap.x + layout.wrap.w + 0.5,
      label + ": interaction layer inside canvas-wrap",
    );
    if (vw === 320) {
      near(layout.grid.w, 288, 0.5, label + ": grid width 288");
      for (const card of layout.cards) {
        near(card.w, 96, 0.5, label + ": card column 96 wide");
        ok(card.h >= 120 - 0.5, label + ": card hit height >= 120");
      }
    }
    for (const card of layout.cards) {
      ok(
        card.x >= -0.5 && card.x + card.w <= layout.vw + 0.5,
        label + ": card inside viewport",
      );
      ok(
        card.y >= layout.question.y + layout.question.h - 1,
        label + ": cards below the question",
      );
      ok(
        card.y + card.h <= layout.panel.y + 1,
        label + ": cards clear of the panel",
      );
    }
    await noHScroll(page, label);
    await page.close();
  }
  console.log("ok   7. guide step 5 cards");
}

/* ================= 8. Polish predict stack, labels visible ================= */
{
  for (const [vw, vh] of [
    [390, 844],
    [360, 640],
    [320, 568],
  ]) {
    const page = await freshPage(vw, vh, {
      query: "?debug=1&scenario=predict-l3-11",
    });
    await page.click("#langBtn");
    const label = vw + "px pl";
    const layout = await page.evaluate(() => {
      const ids = ["answerCcwBtn", "answerBalancedBtn", "answerCwBtn"];
      return ids.map((id) => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return {
          id,
          y: r.y + window.scrollY,
          h: r.height,
          w: r.width,
          clippedX: el.scrollWidth - el.clientWidth,
          clippedY: el.scrollHeight - el.clientHeight,
          text: el.textContent.trim(),
        };
      });
    });
    ok(
      layout[0].y + layout[0].h <= layout[1].y + 1 &&
        layout[1].y + layout[1].h <= layout[2].y + 1,
      label + ": answers stack in ccw/balanced/cw order",
    );
    for (const item of layout) {
      ok(
        item.clippedX <= 1 && item.clippedY <= 1,
        label + ": " + item.id + " label not clipped",
      );
      ok(item.h >= 48, label + ": " + item.id + " >= 48px tall");
    }
    ok(
      layout[0].text.indexOf("PRZECIWNIE DO RUCHU WSKAZÓWEK ZEGARA") !== -1,
      label + ": full Polish ccw label",
    );
    await noHScroll(page, label);
    await page.close();
  }
  console.log("ok   8. Polish predict stack");
}

/* ================= 9. Game start alignment at 390x844 ================= */
{
  const page = await freshPage(390, 844);
  await page.click("#modeGameBtn");
  await page.click("#startBtn");
  await new Promise((resolve) => setTimeout(resolve, 200));
  const layout = await page.evaluate(() => {
    const vh = window.innerHeight;
    const hud = document.getElementById("hudRow").getBoundingClientRect();
    const board = document.getElementById("board").getBoundingClientRect();
    return { vh, hudTop: hud.y, boardTop: board.y, boardBottom: board.bottom };
  });
  ok(
    layout.hudTop >= -1 && layout.hudTop < layout.vh,
    "390: HUD in view after game start",
  );
  ok(
    layout.boardTop >= -1,
    "390: beam canvas aligned to the top after game start",
  );
  ok(
    layout.boardBottom <= layout.vh + 1,
    "390: canvas fits the viewport height",
  );
  await page.close();
  console.log("ok   9. game start alignment");
}

/* ================= 10. Result overlay and summary ================= */
{
  const page = await freshPage(360, 640, { query: "?debug=1&seed=3" });
  await page.click("#modeGameBtn");
  await page.click("#predictBtn");
  await page.click("#startBtn");
  await page.evaluate(() => {
    const t = window.__momentTest;
    for (let round = 0; round < 8; round += 1) {
      const rec = t.bank.find(
        (r) => r.id === t.state.sessionScenarioIds[t.state.roundIndex],
      );
      t.actions.predictAnswer(rec.expectedResult);
      t.actions.nextRound();
    }
  });
  const wash = await page.evaluate(() => {
    const overlay = document.querySelector(".result-overlay");
    if (!overlay) {
      return null;
    }
    const r = overlay.getBoundingClientRect();
    return {
      w: r.width,
      h: r.height,
      vw: window.innerWidth,
      vh: window.innerHeight,
      focused: document.activeElement === overlay,
      cls: overlay.className,
      role: overlay.getAttribute("role"),
      modal: overlay.getAttribute("aria-modal"),
      hasName:
        Boolean((overlay.getAttribute("aria-label") || "").trim()) ||
        (overlay.getAttribute("aria-labelledby") || "")
          .split(/\s+/)
          .filter(Boolean)
          .some((id) => {
            const label = document.getElementById(id);
            return label && label.textContent.trim();
          }),
    };
  });
  ok(wash !== null, "360: result wash present");
  if (wash) {
    ok(
      wash.w >= wash.vw - 1 && wash.h >= wash.vh - 1,
      "360: wash covers the viewport",
    );
    ok(wash.focused, "360: wash focused");
    ok(wash.cls.indexOf("tier-perfect") !== -1, "360: 8/8 perfect tier");
    ok(wash.role === "dialog", "360: result wash exposes dialog role");
    ok(wash.modal === "true", "360: result wash exposes aria-modal=true");
    ok(wash.hasName, "360: result wash has an accessible name");
  }
  await page.keyboard.press("Tab");
  ok(
    await page.evaluate(() => {
      const overlay = document.querySelector(".result-overlay");
      return (
        overlay &&
        (document.activeElement === overlay ||
          overlay.contains(document.activeElement))
      );
    }),
    "360: Tab focus remains inside the open result wash",
  );
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  ok(
    await page.evaluate(() => {
      const overlay = document.querySelector(".result-overlay");
      return (
        overlay &&
        (document.activeElement === overlay ||
          overlay.contains(document.activeElement))
      );
    }),
    "360: Shift+Tab focus remains inside the open result wash",
  );
  await page.keyboard.press("Escape");
  const summary = await page.evaluate(() => ({
    overlayGone: document.querySelector(".result-overlay") === null,
    stars: document.querySelectorAll("#summaryStars .star.on").length,
    headingFocused:
      document.activeElement === document.getElementById("summaryHeading"),
    summaryVisible: !document.getElementById("summarySection").hidden,
  }));
  ok(summary.overlayGone, "360: Escape dismisses the wash");
  ok(summary.stars === 3, "360: summary lights three stars");
  ok(summary.headingFocused, "360: summary heading focused after dismissal");
  ok(summary.summaryVisible, "360: summary visible behind the wash");
  await target48(page, "playAgainBtn", "360 summary");
  await target48(page, "changeGameBtn", "360 summary");
  await page.close();
  console.log("ok   10. result overlay and summary");
}

/* ================= 11. 200% zoom reachability (360px, short viewport) ================= */
{
  const page = await freshPage(360, 320, {
    query: "?debug=1&scenario=predict-l1-01",
  });
  for (const id of [
    "missionPrompt",
    "answerCcwBtn",
    "answerBalancedBtn",
    "answerCwBtn",
    "feedbackRegion",
  ]) {
    const reachable = await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      if (!el) {
        return { present: false };
      }
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return {
        present: true,
        onScreen: r.bottom > 0 && r.top < window.innerHeight,
        fitsWidth: r.width <= window.innerWidth + 1,
      };
    }, id);
    ok(reachable.present, "zoom: " + id + " present");
    ok(
      reachable.onScreen && reachable.fitsWidth,
      "zoom: " + id + " reachable at 200% zoom",
    );
  }
  await noHScroll(page, "zoom");
  await page.close();
  console.log("ok   11. 200% zoom");
}

/* ================= 12. Balance level 3 and dock geometry, narrow sizes ================= */
{
  for (const [vw, vh] of [
    [320, 568],
    [360, 640],
    [390, 844],
  ]) {
    const label = String(vw);
    const page = await freshPage(vw, vh, {
      query: "?debug=1&scenario=balance-l3-01",
    });
    const g = await geom(page);
    const info = await page.evaluate(() => {
      const t = window.__momentTest;
      const rec = t.bank.find((r) => r.id === t.state.sessionScenarioIds[0]);
      return { forces: rec.forces.length, movable: rec.movableMagnitude };
    });
    ok(info.forces === 2, label + ": level 3 record with two fixed tags");
    /* tags hang inside the canvas */
    const tagBottom = g.beamY + 11 + 8 + 30;
    ok(
      tagBottom < g.H - 70,
      label + ": hanging tags stay above the strip region",
    );
    /* dock inside the canvas and 56 tall */
    const dockTop = g.H - 40 - 56;
    ok(dockTop > g.beamY + 60, label + ": dock clear of the beam");
    /* strips present for both fixed forces */
    const stripRows = await page.evaluate(
      () => document.querySelectorAll("#stripRegion .strip-row").length,
    );
    ok(stripRows === 4, label + ": two fixed strips plus totals while docked");
    await noHScroll(page, label + " balance");
    await page.close();
  }
  console.log("ok   12. balance level 3 at narrow sizes");
}

/* ================= 13b. Force-label placement ================= */
{
  const overlapProbe = `(() => {
    const t = window.__momentTest;
    const labels = t.helpers.labelBoxes();
    const avoid = t.helpers.avoidBoxes();
    const segments = t.helpers.avoidSegments();
    const hit = (a, b) =>
      Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh;
    const segHit = (a, b, box) => {
      let t0 = 0;
      let t1 = 1;
      const d = { x: b.x - a.x, y: b.y - a.y };
      const lim = [
        [-d.x, a.x - (box.x - box.hw)],
        [d.x, box.x + box.hw - a.x],
        [-d.y, a.y - (box.y - box.hh)],
        [d.y, box.y + box.hh - a.y],
      ];
      for (const [p, q] of lim) {
        if (Math.abs(p) < 1e-9) {
          if (q < 0) return false;
        } else {
          const r = q / p;
          if (p < 0) {
            if (r > t1) return false;
            if (r > t0) t0 = r;
          } else {
            if (r < t0) return false;
            if (r < t1) t1 = r;
          }
        }
      }
      return true;
    };
    const labelPairs = [];
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        if (hit(labels[i], labels[j])) {
          labelPairs.push(labels[i].text + " / " + labels[j].text);
        }
      }
    }
    const onAnnotation = labels
      .filter((l) => avoid.some((b) => hit(l, b)))
      .map((l) => l.text);
    const onArrow = labels
      .filter((l) => segments.some((s) => segHit(s.a, s.b, l)))
      .map((l) => l.text);
    return { count: labels.length, labelPairs, onAnnotation, onArrow };
  })()`;
  /* two weak same-direction forces: the case where a shared along-arrow
     anchor used to stack one opaque chip on top of the other */
  for (const [vw, vh] of [
    [1280, 720],
    [390, 844],
    [320, 568],
  ]) {
    const page = await freshPage(vw, vh);
    await page.evaluate(() => {
      const t = window.__momentTest;
      t.actions.setExploreForceCount(2);
      t.actions.selectExploreForce("f1");
      t.actions.setForceProperty("x", 1);
      t.actions.setForceProperty("magnitude", 1);
      t.actions.setForceProperty("angleDeg", 270);
      t.actions.selectExploreForce("f2");
      t.actions.setForceProperty("x", 1.5);
      t.actions.setForceProperty("magnitude", 1.5);
      t.actions.setForceProperty("angleDeg", 270);
    });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
    const res = await page.evaluate(overlapProbe);
    const label = vw + " labels";
    ok(res.count === 2, label + ": both force labels placed");
    ok(
      res.labelPairs.length === 0,
      label +
        ": force labels do not overlap each other (" +
        res.labelPairs.join("; ") +
        ")",
    );
    ok(
      res.onAnnotation.length === 0,
      label +
        ": no force label sits on the beam, pivot, metre numbers, or another chip (" +
        res.onAnnotation.join("; ") +
        ")",
    );
    ok(
      res.onArrow.length === 0,
      label +
        ": no force label covers an arrow (" +
        res.onArrow.join("; ") +
        ")",
    );
    await page.close();
  }
  /* every direction at every strength, on the smallest board */
  const sweep = await freshPage(320, 568);
  let sweepFailures = 0;
  for (const angle of [0, 45, 90, 135, 180, 225, 270, 315]) {
    for (const mag of [0.5, 2, 5]) {
      const res = await sweep.evaluate(
        async (a, m, probeSrc) => {
          const t = window.__momentTest;
          t.actions.setExploreForceCount(1);
          t.actions.setForceProperty("angleDeg", a);
          t.actions.setForceProperty("magnitude", m);
          t.actions.setForceProperty("x", 2);
          await new Promise((r) => requestAnimationFrame(r));
          // eslint-disable-next-line no-eval
          return eval(probeSrc);
        },
        angle,
        mag,
        overlapProbe,
      );
      if (
        res.count !== 1 ||
        res.onAnnotation.length > 0 ||
        res.onArrow.length > 0
      ) {
        sweepFailures += 1;
        ok(
          false,
          "320 sweep: " +
            mag +
            "N at " +
            angle +
            " deg -> " +
            JSON.stringify(res),
        );
      }
    }
  }
  ok(
    sweepFailures === 0,
    "320: label clears annotations at every angle and strength",
  );
  await sweep.close();
  /* the Predict reveal draws moment-arc chips: labels must clear those too */
  const reveal = await freshPage(1280, 720, {
    query: "?debug=1&scenario=predict-l3-07",
  });
  await reveal.click("#answerCcwBtn");
  await reveal.waitForFunction(
    () => window.__momentTest.state.revealPhase.kind === "complete",
  );
  await reveal.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  const revealRes = await reveal.evaluate(overlapProbe);
  ok(
    revealRes.labelPairs.length === 0 &&
      revealRes.onAnnotation.length === 0 &&
      revealRes.onArrow.length === 0,
    "reveal: force labels clear the arc chips, the arrows, and each other (" +
      revealRes.labelPairs
        .concat(revealRes.onAnnotation, revealRes.onArrow)
        .join("; ") +
      ")",
  );
  await reveal.close();
  console.log("ok   13b. force-label placement");
}

/* ============ 13c. Canvas palette contrast (spec 14.4) ============ */
{
  /* Nothing used to check canvas colour, which is how a force arrow at
     1.22:1 against the beam shipped. These assertions read the palette the
     app actually paints with, then prove the painted pixels match it. */
  const page = await freshPage(1280, 720);
  const palette = await page.evaluate(() => window.__momentTest.colors);
  const CANVAS = "#f5f3ee";
  const graphical = [
    ["f1", "beam"],
    ["f2", "beam"],
    ["move", "beam"],
    ["f1", null],
    ["f2", null],
    ["move", null],
    ["socket", "beam"],
    ["pivot", null],
  ];
  for (const [fg, bg] of graphical) {
    const background = bg === null ? CANVAS : palette[bg];
    const ratio = colorContrast(
      parseCssColor(palette[fg]),
      parseCssColor(background),
    );
    ok(
      ratio >= 3,
      "13c: " +
        fg +
        " on " +
        (bg || "canvas") +
        " is " +
        ratio.toFixed(2) +
        ":1 (need >= 3)",
    );
  }
  /* The beam is allowed a low-contrast fill because its EDGE carries the
     boundary — the same max(border, fill) rule section 13 applies to
     buttons. */
  const beamBoundary = Math.max(
    colorContrast(parseCssColor(palette.beam), parseCssColor(CANVAS)),
    colorContrast(parseCssColor(palette.beamEdge), parseCssColor(CANVAS)),
  );
  ok(
    beamBoundary >= 3,
    "13c: beam boundary against the canvas is " +
      beamBoundary.toFixed(2) +
      ":1 (need >= 3)",
  );
  /* Canvas text sits on the paper chip, not the raw canvas. */
  const chipInk = contrastOn(palette.text, "rgba(245, 243, 238, 0.94)", CANVAS);
  ok(
    chipInk >= 4.5,
    "13c: chip ink " + chipInk.toFixed(2) + ":1 (need >= 4.5)",
  );
  const metreInk = colorContrast(
    parseCssColor(palette.construction),
    parseCssColor(CANVAS),
  );
  ok(
    metreInk >= 4.5,
    "13c: metre numbers " + metreInk.toFixed(2) + ":1 (need >= 4.5)",
  );
  /* The declared palette must be the painted one: sample the beam between
     two sockets, clear of the pivot and of the default force at +3 m. */
  const painted = await page.evaluate(() => {
    const board = document.getElementById("board");
    const c = board.getContext("2d");
    const g = window.__momentTest.geom;
    const dpr = board.width / g.W;
    /* -1.25 m is a quarter-metre off both the -1 socket dot (r 5) and the
       -1.5 tick, and 8px above the centreline clears both vertically too. */
    const x = Math.round((g.W / 2 - (g.beamPx / 8) * 1.25) * dpr);
    const y = Math.round((g.beamY - 8) * dpr);
    const d = c.getImageData(x, y, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2] };
  });
  const declared = parseCssColor(palette.beam);
  ok(
    Math.abs(painted.r - declared.r) <= 2 &&
      Math.abs(painted.g - declared.g) <= 2 &&
      Math.abs(painted.b - declared.b) <= 2,
    "13c: the painted beam matches the declared palette (painted rgb(" +
      [painted.r, painted.g, painted.b].join(", ") +
      "))",
  );
  /* The :root entity tokens are hand-duplicated from COLORS and pinned by
     spec 14.1; assert they still mirror rather than quietly drift. */
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const read = (name) => cs.getPropertyValue(name).trim().toLowerCase();
    return {
      "force-1": read("--force-1"),
      "force-2": read("--force-2"),
      "force-move": read("--force-move"),
      beam: read("--beam"),
      "beam-edge": read("--beam-edge"),
      socket: read("--socket"),
      pivot: read("--pivot"),
    };
  });
  const mirror = [
    ["force-1", "f1"],
    ["force-2", "f2"],
    ["force-move", "move"],
    ["beam", "beam"],
    ["beam-edge", "beamEdge"],
    ["socket", "socket"],
    ["pivot", "pivot"],
  ];
  for (const [token, key] of mirror) {
    ok(
      tokens[token] === String(palette[key]).toLowerCase(),
      "13c: --" +
        token +
        " mirrors COLORS." +
        key +
        " (" +
        tokens[token] +
        " vs " +
        palette[key] +
        ")",
    );
  }
  await page.close();
  console.log("ok   13c. canvas palette contrast");
}

/* ================= 13. WCAG text and component contrast ================= */
{
  const page = await freshPage(1280, 720);
  const colors = await page.evaluate(() => {
    const pill = document.getElementById("resultPill");
    const net = document.getElementById("roNet");
    const style = (element) => {
      const computed = getComputedStyle(element);
      return {
        color: computed.color,
        background: computed.backgroundColor,
        border: computed.borderTopColor,
      };
    };
    pill.hidden = false;
    pill.className = "canvas-prompt turning-cw";
    const promptCw = style(pill);
    pill.className = "canvas-prompt balanced";
    const promptBalanced = style(pill);
    net.className = "readout-val dir-cw";
    const readoutCw = style(net);
    net.className = "readout-val dir-balanced";
    const readoutBalanced = style(net);
    return {
      panel: style(document.getElementById("panel")),
      canvas: style(document.getElementById("canvasWrap")),
      promptCw,
      promptBalanced,
      readoutCw,
      readoutBalanced,
      segmented: style(document.getElementById("modeGameBtn")),
      action: style(document.getElementById("resetBtn")),
      range: style(document.getElementById("strengthSlider")),
    };
  });
  const promptCwRatio = contrastOn(
    colors.promptCw.color,
    colors.promptCw.background,
    colors.canvas.background,
  );
  const promptBalancedRatio = contrastOn(
    colors.promptBalanced.color,
    colors.promptBalanced.background,
    colors.canvas.background,
  );
  const readoutCwRatio = contrastOn(
    colors.readoutCw.color,
    colors.panel.background,
  );
  const readoutBalancedRatio = contrastOn(
    colors.readoutBalanced.color,
    colors.panel.background,
  );
  ok(
    promptCwRatio >= 4.5,
    "contrast: clockwise prompt text >= 4.5:1 (got " +
      promptCwRatio.toFixed(2) +
      ":1)",
  );
  ok(
    promptBalancedRatio >= 4.5,
    "contrast: balanced prompt text >= 4.5:1 (got " +
      promptBalancedRatio.toFixed(2) +
      ":1)",
  );
  ok(
    readoutCwRatio >= 4.5,
    "contrast: clockwise readout text >= 4.5:1 (got " +
      readoutCwRatio.toFixed(2) +
      ":1)",
  );
  ok(
    readoutBalancedRatio >= 4.5,
    "contrast: balanced readout text >= 4.5:1 (got " +
      readoutBalancedRatio.toFixed(2) +
      ":1)",
  );
  for (const [name, control] of [
    ["segmented button", colors.segmented],
    ["action button", colors.action],
  ]) {
    const borderRatio = contrastOn(control.border, colors.panel.background);
    const fillRatio = contrastOn(control.background, colors.panel.background);
    const boundaryRatio = Math.max(borderRatio, fillRatio);
    ok(
      boundaryRatio >= 3,
      "contrast: " +
        name +
        " boundary >= 3:1 (got " +
        boundaryRatio.toFixed(2) +
        ":1)",
    );
  }
  const rangeRatio = contrastOn(
    colors.range.background,
    colors.panel.background,
  );
  ok(
    rangeRatio >= 3,
    "contrast: range track >= 3:1 (got " + rangeRatio.toFixed(2) + ":1)",
  );
  await page.close();
  console.log("ok   13. WCAG contrast");
}

ok(
  debugErrors.length === 0,
  "no in-app debug bound violations: " + debugErrors.join(" | "),
);

await browser.close();
server.close();

if (failures === 0) {
  console.log("OK: " + checks + " real-Chrome layout checks passed");
  process.exit(0);
} else {
  console.error(failures + " of " + checks + " layout checks FAILED");
  process.exit(1);
}
