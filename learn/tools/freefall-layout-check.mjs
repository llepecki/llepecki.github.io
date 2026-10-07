#!/usr/bin/env node
/*
 * Real-Chrome layout, interaction and accessibility check for
 * freefall/index.html (Orbit & Free Fall).
 *
 * Serves learn/ over a local HTTP server, launches the system Chrome via
 * puppeteer-core (never downloads a browser) and measures the design's
 * acceptance matrix (freefall/docs/design.md section 10): no horizontal
 * overflow, the 260/200 px drawing minimums, the 32 px surface gap and 12 px
 * bow at the real drawing width, the inset never covering the station,
 * arrows or comparison endpoints, 48 px core targets with 18 px labels,
 * unclipped button text in EN and PL, keyboard-only operation, reduced
 * motion, blur pausing, and real-time playback rates. Screenshots go to
 * FREEFALL_SHOTS (default: a freefall-shots folder in the OS temp dir).
 *
 * Exit codes: 0 = pass, 1 = assertion failures, 2 = no Chrome found.
 * Run from learn/: npm run freefall-layout-check
 */
import { existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
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
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const chromePath = findChrome();
if (!chromePath) {
  console.error("FAIL: no Chrome found. Set CHROME_PATH to a Chrome/Chromium binary.");
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const learnRoot = path.join(here, "..");
const shotDir = process.env.FREEFALL_SHOTS || path.join(os.tmpdir(), "freefall-shots");
mkdirSync(shotDir, { recursive: true });

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const filePath = path.join(learnRoot, urlPath);
    if (!filePath.startsWith(learnRoot)) throw new Error("traversal");
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": filePath.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = "http://127.0.0.1:" + port + "/freefall/index.html?debug=1";

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error("FAIL: " + msg);
  } else {
    console.log("ok   " + msg);
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "shell",
  args: ["--no-sandbox", "--disable-gpu"],
});
const pageErrors = [];

async function freshPage(width, height, { dpr = 1, lang = "en", reduce = false } = {}) {
  const page = await browser.newPage();
  page.on("pageerror", (err) => pageErrors.push(`${width}x${height} ${lang}: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/Failed to load resource/.test(msg.text())) {
      pageErrors.push(`${width}x${height} ${lang} console: ${msg.text()}`);
    }
  });
  page.on("response", (res) => {
    if (res.status() >= 400 && !/favicon\.ico$/.test(res.url())) {
      pageErrors.push(`${width}x${height} ${lang} HTTP ${res.status()} ${res.url()}`);
    }
  });
  await page.setViewport({ width, height, deviceScaleFactor: dpr });
  if (reduce) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  await page.goto(base, { waitUntil: "load" });
  await page.evaluate(async (wanted) => {
    const D = window.freefallDebug;
    if (D.state.lang !== wanted) D.toggleLang();
    try {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    } catch {
      /* fonts are optional */
    }
    D.resizeAll();
    D.updateReadouts();
  }, lang);
  await sleep(120);
  return page;
}

// Labels the close view must always show, and the rule that no placed label
// overlaps another label, the cabin rectangle, the inset or the status block.
const FORBIDDEN_LABELS = ["Velocity", "Gravity", "Station", "Station enlarged", "Prędkość", "Grawitacja", "Stacja", "Stacja w powiększeniu"];
async function labelAudit(page, tag, required) {
  const report = await page.evaluate(() => {
    const D = window.freefallDebug;
    if (!D.state.showComparison) D.toggleComparison();
    D.drawOrbit();
    D.drawOrbit();
    return D.getLabelReport();
  });
  const placed = report.labels.filter((x) => x.placed);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  let collisions = 0;
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) if (overlap(placed[i].box, placed[j].box)) collisions++;
    for (const o of report.obstacles) if (overlap(placed[i].box, o)) collisions++;
  }
  ok(collisions === 0, `${tag}: placed labels never overlap each other, the room, the inset or the status block (${collisions} collisions)`);
  for (const text of required) {
    const hit = report.labels.find((x) => x.text.startsWith(text));
    ok(hit && hit.placed, `${tag}: label "${text}" placed (${hit ? (hit.placed ? "yes" : "skipped") : "not queued"})`);
  }
  const forbidden = report.labels.filter((x) => FORBIDDEN_LABELS.includes(x.text)).map((x) => x.text);
  ok(forbidden.length === 0, `${tag}: no canvas word labels for velocity, gravity or the station (${forbidden.join(", ") || "none"})`);
  const skipped = report.labels.filter((x) => !x.placed).map((x) => x.text);
  if (skipped.length) console.log(`      ${tag}: skipped labels: ${skipped.join(" | ")}`);
}

const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1024, h: 768 },
  { w: 700, h: 900 },
  { w: 390, h: 844 },
  { w: 320, h: 568 },
  { w: 844, h: 390 },
  { w: 640, h: 400, dpr: 2, note: "200% zoom" },
];

for (const vp of VIEWPORTS) {
  for (const lang of ["en", "pl"]) {
    const tag = `${vp.w}x${vp.h}${vp.note ? " (" + vp.note + ")" : ""} ${lang}`;
    const page = await freshPage(vp.w, vp.h, { dpr: vp.dpr || 1, lang });
    const comparisonDefault = await page.evaluate(() => {
      const D = window.freefallDebug;
      D.drawOrbit();
      const labels = D.getLabelReport().labels.map((x) => x.text);
      return { off: !D.state.showComparison, pressed: document.getElementById("comparisonBtn").getAttribute("aria-pressed"), labels };
    });
    ok(comparisonDefault.off && comparisonDefault.pressed === "false" && !comparisonDefault.labels.some((t) => /gravity$/.test(t) || /grawitacj/.test(t)), `${tag}: path comparison is off by default`);
    const m = await page.evaluate(() => {
      const D = window.freefallDebug;
      const size = D.getSize();
      const W = size.orbitW;
      const H = size.orbitH;
      const cam = D.cameraTransform(W, H);
      const st = D.state.station;
      const sp = cam.toScreen(st.x, st.y);
      if (!D.state.showComparison) D.toggleComparison();
      const comp = D.computeComparison(st, 120);
      const endC = comp.curved[comp.curved.length - 1];
      const endS = comp.straight[comp.straight.length - 1];
      const pc = cam.toScreen(endC.x, endC.y);
      const ps = cam.toScreen(endS.x, endS.y);
      const inset = D.insetRect(W, H);
      const geo = D.closeViewGeometry(W, H);
      const rect = (id) => {
        const r = document.getElementById(id).getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      const style = (id, prop) => getComputedStyle(document.getElementById(id))[prop];
      const clipped = (id) => {
        const el = document.getElementById(id);
        return el.scrollWidth > el.clientWidth + 1;
      };
      const ids = ["startBtn", "pinEarthBtn", "pinStationBtn", "vectorsBtn", "showFallBtn", "resetBallBtn", "detailsBtn", "whyBtn", "termsBtn", "sourcesBtn", "zoomAutoBtn"];
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        orbit: { W, H },
        cabin: size.cabinW,
        gapPx: geo.gapPx,
        bowPx: geo.bowPx,
        station: sp,
        endC: pc,
        endS: ps,
        inset,
        surfaceVisible: D.state.surfaceVisible !== false,
        centred: Math.hypot(sp[0] - W / 2, sp[1] - H / 2) < 0.5,
        insetShown: D.insetVisible(),
        statusRect: rect("orbitStatus"),
        hudRect: rect("orbitHud"),
        hudFont: parseFloat(style("hudVelocity", "fontSize")),
        hudLabelFont: parseFloat(style("hudVelocityLabel", "fontSize")),
        hudRows: document.querySelectorAll("#orbitHud .hud-row").length,
        hudText: ["hudAltitude", "hudVelocity", "hudGravity"].map((id) => document.getElementById(id).textContent.trim()).join(" | "),
        wrapRect: rect("orbitWrap"),
        chipRect: rect("vacuumChip"),
        heights: Object.fromEntries(["startBtn", "speedUpBtn", "brakeBtn"].map((id) => [id, rect(id).h])),
        fonts: Object.fromEntries(["startBtn", "lblSpeedUp", "lblBrake", "hintText", "cabinExplain", "valGravity", "orbitSummary", "speedHint", "engineHint", "viewHint"].map((id) => [id, parseFloat(style(id, "fontSize"))])),
        stepper: rect("speedDecBtn"),
        clipped: ids.filter(clipped),
        typeBtnMin: Math.min(...ids.map((id) => rect(id).h)),
        summary: document.getElementById("orbitSummary").textContent,
        lang: document.documentElement.lang,
        title: document.title,
        cabinExplain: document.getElementById("cabinExplain").textContent,
      };
    });
    ok(m.scrollWidth <= m.innerWidth, `${tag}: no horizontal overflow (${m.scrollWidth} <= ${m.innerWidth})`);
    if (m.scrollWidth > m.innerWidth) {
      const wide = await page.evaluate((limit) => {
        const out = [];
        document.querySelectorAll("body *").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.right > limit + 1 && r.width > 0) out.push(`${el.tagName.toLowerCase()}#${el.id} right=${r.right.toFixed(0)}`);
        });
        return out.slice(0, 12);
      }, m.innerWidth);
      console.error("      overflowing: " + wide.join(", "));
    }
    ok(m.orbit.H >= 260, `${tag}: main drawing height ${m.orbit.H.toFixed(0)} >= 260`);
    ok(m.cabin >= 128, `${tag}: cabin canvas ${m.cabin.toFixed(0)} >= 128`);
    ok(m.gapPx >= 32, `${tag}: station-surface gap ${m.gapPx.toFixed(1)} px >= 32`);
    ok(m.bowPx >= 12, `${tag}: surface bow ${m.bowPx.toFixed(1)} px >= 12`);
    ok(m.surfaceVisible, `${tag}: curved surface visible on the initial screen`);
    ok(m.centred && m.insetShown, `${tag}: pinned station at the centre with the inset shown`);
    const hudTopLeft = Math.abs(m.hudRect.x - m.wrapRect.x - 16) <= 0.5 && Math.abs(m.hudRect.y - m.wrapRect.y - 16) <= 0.5;
    const hudClearOfInset = m.hudRect.x + m.hudRect.w - m.wrapRect.x <= m.inset.x - 8;
    ok(hudTopLeft && hudClearOfInset, `${tag}: HUD at the top-left corner, clear of the inset (right edge ${(m.hudRect.x + m.hudRect.w - m.wrapRect.x).toFixed(0)}, inset at ${m.inset.x.toFixed(0)})`);
    ok(m.hudRows === 3 && m.hudFont >= 13 && m.hudLabelFont >= 12, `${tag}: HUD has three rows with ${m.hudFont}px values and ${m.hudLabelFont}px labels`);
    ok(/\bkm\b/.test(m.hudText) && /km\/s/.test(m.hudText) && /m\/s²/.test(m.hudText), `${tag}: HUD shows altitude, speed and gravity (${m.hudText})`);
    const hitsInset = (p, padX, padY) =>
      p[0] + padX > m.inset.x && p[0] < m.inset.x + m.inset.w && p[1] - padY < m.inset.y + m.inset.h && p[1] + padY > m.inset.y;
    ok(!hitsInset(m.station, 160, 40), `${tag}: inset clears the station and its velocity arrow/label`);
    ok(!hitsInset(m.endC, 150, 24) && !hitsInset(m.endS, 150, 24), `${tag}: inset clears the comparison endpoints and labels`);
    ok(m.endC[0] < m.orbit.W && m.endC[1] < m.orbit.H - 60, `${tag}: comparison endpoint inside the drawing (${m.endC[0].toFixed(0)}, ${m.endC[1].toFixed(0)})`);
    const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const inside = (a, b) => a.x >= b.x - 1 && a.y >= b.y - 1 && a.x + a.w <= b.x + b.w + 1 && a.y + a.h <= b.y + b.h + 1;
    ok(inside(m.chipRect, m.statusRect) && !overlap(m.statusRect, m.inset), `${tag}: vacuum label sits inside the status block, clear of the inset`);
    ok(m.statusRect.y > m.hudRect.y + m.hudRect.h, `${tag}: status block below the HUD`);
    for (const [id, h] of Object.entries(m.heights)) ok(h >= 48, `${tag}: ${id} height ${h.toFixed(0)} >= 48`);
    for (const id of ["startBtn", "lblSpeedUp", "lblBrake"]) ok(m.fonts[id] >= 18, `${tag}: ${id} font ${m.fonts[id]} >= 18`);
    ok(["hintText", "cabinExplain", "speedHint", "engineHint", "viewHint"].every((id) => m.fonts[id] >= 15), `${tag}: explanatory and hint text >= 15 px`);
    const hintColor = await page.$eval("#engineHint", (el) => getComputedStyle(el).color);
    ok(hintColor === "rgb(201, 209, 217)", `${tag}: hint text uses --text (${hintColor})`);
    ok(m.fonts.valGravity >= 13 && m.fonts.orbitSummary >= 13, `${tag}: readouts >= 13 px`);
    ok(m.stepper.w >= 48 && m.stepper.h >= 48, `${tag}: stepper hit area ${m.stepper.w}x${m.stepper.h}`);
    ok(m.typeBtnMin >= 44, `${tag}: smallest panel button ${m.typeBtnMin.toFixed(0)} >= 44`);
    ok(m.clipped.length === 0, `${tag}: no clipped button labels (${m.clipped.join(", ") || "none"})`);
    ok(m.lang === lang && m.summary.length > 10, `${tag}: document lang ${m.lang}, summary "${m.summary}"`);
    await labelAudit(page, tag, lang === "pl" ? ["Bez grawitacji", "Z grawitacją"] : ["Without gravity", "With gravity"]);
    await page.screenshot({ path: path.join(shotDir, `freefall-${vp.w}x${vp.h}-${lang}.png`), fullPage: vp.w <= 700 || vp.h <= 560 });
    await page.close();
  }
}

// ── Interaction and accessibility (desktop, EN) ───────────────────────────
{
  const page = await freshPage(1440, 900, { lang: "en" });
  const D = () => page.evaluate(() => window.freefallDebug.state);
  // Keyboard: preset select
  await page.focus("#presetSelect");
  await page.select("#presetSelect", "tooSlow");
  let s = await D();
  ok(s.preset === "tooSlow" && s.v0 === 6000, "preset select changes the experiment");
  // Keyboard: slider keys
  await page.focus("#speedSlider");
  await page.keyboard.press("ArrowRight");
  s = await D();
  ok(Math.abs(s.v0 - 6010) < 1e-6 && s.preset === "custom", `ArrowRight adds 0.01 km/s (v0=${s.v0})`);
  await page.keyboard.press("PageUp");
  s = await D();
  ok(Math.abs(s.v0 - 6110) < 1e-6, `PageUp adds 0.10 km/s (v0=${s.v0})`);
  await page.keyboard.press("End");
  s = await D();
  ok(s.v0 === 12000 && s.preset === "escape", "End selects 12.00 km/s (escape preset)");
  await page.keyboard.press("Home");
  s = await D();
  ok(s.v0 === 0 && s.preset === "drop", "Home selects 0 km/s (drop preset)");
  const valuetext = await page.$eval("#speedSlider", (el) => el.getAttribute("aria-valuetext"));
  ok(/0\.000/.test(valuetext), `aria-valuetext localized (${valuetext})`);
  // Steppers via keyboard (Enter) and pointer hold
  await page.focus("#speedIncBtn");
  await page.keyboard.press("Enter");
  s = await D();
  ok(Math.abs(s.v0 - 10) < 1e-9, `stepper Enter adds 0.01 km/s (v0=${s.v0})`);
  const inc = await page.$("#speedIncBtn");
  const box = await inc.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await sleep(700);
  await page.mouse.up();
  s = await D();
  ok(s.v0 > 40, `press-and-hold auto-repeats (v0=${s.v0} m/s after 0.7 s)`);
  // Circular preset via keyboard select, Start via Enter
  await page.select("#presetSelect", "circular");
  await page.focus("#startBtn");
  await page.keyboard.press("Enter");
  await sleep(400);
  s = await D();
  ok(s.phase === "running" && s.t > 20 && s.rate === 120, `Enter on Start runs at 120x (t=${s.t.toFixed(1)} s after 0.4 s)`);
  await page.keyboard.press("Space");
  s = await D();
  ok(s.phase === "paused", "Space on the primary button pauses");
  const label = await page.$eval("#startBtn", (el) => el.textContent.trim());
  ok(label === "Continue", `primary label is Continue (${label})`);
  // 600x real-time rate
  await page.click("#rate600Btn");
  const t0 = (await D()).t;
  await sleep(1000);
  const t1 = (await D()).t;
  ok(t1 - t0 > 420 && t1 - t0 < 700, `600x advances ~600 s per real second (${(t1 - t0).toFixed(0)} s)`);
  const glyph = await page.$eval("#rate600Btn .playback-glyph", (el) => el.textContent);
  ok(glyph === "▮▮", "active playback glyph becomes pause bars");
  await page.click("#rate600Btn");
  s = await D();
  ok(s.phase === "paused", "clicking the active rate pauses");
  // Engine pulse via keyboard, Escape cuts thrust
  await page.focus("#speedUpBtn");
  await page.keyboard.down("Space");
  s = await D();
  ok(s.thrust.dir === 1 && s.rate === 600 && s.phase === "running", "holding Space on Speed up fires the engine at the selected 600x");
  const rateEnabled = await page.$eval("#rate120Btn", (el) => !el.disabled);
  ok(rateEnabled, "playback buttons stay enabled during thrust");
  const firing = await page.$eval("#speedUpBtn", (el) => el.classList.contains("firing") && el.getAttribute("aria-pressed") === "true");
  ok(firing, "dome shows the firing state with aria-pressed");
  await sleep(1100);
  s = await D();
  ok(s.t > 0 && s.ball.qx < -0.1 && s.thrust.dir === 1, `after ~1.1 s held the astronaut drifted and the engine is still on (qx=${s.ball.qx.toFixed(2)} m)`);
  await page.keyboard.up("Space");
  s = await D();
  ok(s.thrust.dir === 0 && s.phase === "running" && s.rate === 600, "releasing Space stops the engine and keeps coasting at 600x");
  const watchHint = await page.$eval("#hintText", (el) => el.textContent);
  ok(/1×/.test(watchHint), `hint tells the learner to choose 1x to watch the astronaut (${watchHint})`);
  await page.click("#rate600Btn");
  await page.click("#rate120Btn");
  await page.focus("#speedUpBtn");
  await page.keyboard.down("Space");
  await sleep(3400);
  s = await D();
  ok(s.thrust.dir === 1 && s.thrust.holdReal >= 3 && s.rate === 120, `after 3.4 s of real holding at 120x the throttle is in the ramp (real hold ${s.thrust.holdReal.toFixed(2)} s, push ${s.thrust.accel.toFixed(2)} m/s², delta-v ${s.thrust.deltaV.toFixed(0)} m/s)`);
  await page.keyboard.up("Space");
  s = await D();
  ok(s.thrust.dir === 0 && s.rate === 120 && s.phase === "running", "release keeps 120x and the orbit keeps playing");
  ok(s.classification.apogee - 6771000 > 300e3 || s.classification.unbound, `the burn visibly changed the orbit (apogee ${((s.classification.apogee - 6771000) / 1000).toFixed(0)} km)`);
  await page.click("#rate120Btn");
  s = await D();
  ok(s.phase === "paused", "paused again for the next checks");
  const brakeBox = await (await page.$("#brakeBtn")).boundingBox();
  await page.mouse.move(brakeBox.x + brakeBox.width / 2, brakeBox.y + brakeBox.height / 2);
  await page.mouse.down();
  await sleep(300);
  s = await D();
  ok(s.thrust.dir === -1, "mouse press on Brake fires the brake engine");
  await page.mouse.up();
  s = await D();
  ok(s.thrust.dir === 0, "mouse release stops the brake engine");
  await page.focus("#speedUpBtn");
  await page.keyboard.down("Space");
  await page.keyboard.press("Escape");
  await page.keyboard.up("Space");
  s = await D();
  ok(s.thrust.dir === 0 && s.phase === "paused", "Escape cuts thrust and pauses");
  const focused = await page.evaluate(() => document.activeElement.id);
  ok(focused === "speedUpBtn", `focus stays on the invoking control (${focused})`);
  // Reset astronaut, Show the fall, Next step
  await page.click("#resetBallBtn");
  s = await D();
  ok(s.ball.qx === 0 && s.ball.ux === 0, "Reset astronaut recenters");
  await page.click("#showFallBtn");
  s = await D();
  ok(!!s.inspection, "Show the fall enters inspection");
  const nextVisible = await page.$eval("#nextStepBtn", (el) => !el.hidden);
  ok(nextVisible, "Next step appears during inspection");
  const tBefore = s.t;
  await page.focus("#nextStepBtn");
  await page.keyboard.press("Enter");
  s = await D();
  ok(Math.abs(s.t - tBefore - 120) < 1e-6 && s.inspectionMarkers.length === 2, "Next step advances 120 s and marks the origin");
  const canvasLabel = await page.$eval("#orbitCanvas", (el) => el.getAttribute("aria-label"));
  ok(/Paused comparison/.test(canvasLabel), `canvas description switches for inspection (${canvasLabel.slice(0, 40)}...)`);
  // View switching preserves state
  const snap = await page.evaluate(() => JSON.stringify([window.freefallDebug.state.station, window.freefallDebug.state.t, window.freefallDebug.state.ball]));
  await page.click("#pinEarthBtn");
  s = await D();
  const insetAtAuto = await page.evaluate(() => window.freefallDebug.insetVisible());
  ok(s.pin === "earth" && !s.inspection && insetAtAuto === false, "pinning Earth exits inspection and hides the inset at Auto");
  await page.click("#zoomInBtn");
  const zoomed = await page.evaluate(() => ({ inset: window.freefallDebug.insetVisible(), zoom: window.freefallDebug.camera.zoom.earth }));
  ok(zoomed.inset === true && zoomed.zoom === 1.5, "zooming the Earth pin brings the inset back");
  await page.click("#pinStationBtn");
  const snap2 = await page.evaluate(() => JSON.stringify([window.freefallDebug.state.station, window.freefallDebug.state.t, window.freefallDebug.state.ball]));
  ok(snap === snap2, "view and zoom changes leave the physics state identical");
  // Blur pauses and cuts thrust
  await page.$eval("#brakeBtn", (el) => el.scrollIntoView({ block: "center" }));
  const brakeBox2 = await (await page.$("#brakeBtn")).boundingBox();
  await page.mouse.move(brakeBox2.x + brakeBox2.width / 2, brakeBox2.y + brakeBox2.height / 2);
  await page.mouse.down();
  await sleep(100);
  s = await D();
  ok(s.thrust.dir === -1 && s.phase === "running", "mouse press on Brake fires before the blur test");
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  s = await D();
  ok(s.thrust.dir === 0 && s.phase === "paused" && s.hintKey === "hintTabPaused", "window blur cuts thrust and pauses with the away message");
  await page.mouse.up();
  // Disclosures
  await page.focus("#whyBtn");
  await page.keyboard.press("Enter");
  const expanded = await page.$eval("#whyBtn", (el) => el.getAttribute("aria-expanded"));
  const bodyShown = await page.$eval("#whyBody", (el) => !el.hidden && el.children.length > 5);
  ok(expanded === "true" && bodyShown, "Why disclosure opens by keyboard");
  // Language toggle keeps state
  const before = await page.evaluate(() => JSON.stringify(window.freefallDebug.state.station));
  await page.click("#langBtn");
  const after = await page.evaluate(() => JSON.stringify(window.freefallDebug.state.station));
  const plLabel = await page.$eval("#lblSpeedUp", (el) => el.textContent.trim());
  ok(before === after && plLabel === "Przyspiesz", `language toggle keeps physics and relabels (${plLabel})`);
  // Impact flow: Try again
  await page.click("#langBtn");
  await page.select("#presetSelect", "tooSlow");
  await page.click("#rate600Btn");
  await sleep(1500);
  s = await D();
  ok(s.phase === "impact", `Too slow reaches impact at 600x (phase=${s.phase}, t=${s.t.toFixed(0)} s)`);
  const retry = await page.$eval("#startBtn", (el) => el.textContent.trim());
  const engineDisabled = await page.$eval("#speedUpBtn", (el) => el.disabled);
  ok(retry === "Try again" && engineDisabled, "impact: primary becomes Try again, engines disabled");
  const crash = await page.evaluate(() => {
    const o = document.querySelector(".result-overlay");
    if (!o) return null;
    return {
      role: o.getAttribute("role"),
      focused: document.activeElement === o,
      msg: o.querySelector(".overlay-msg").textContent,
      sub: o.querySelector(".overlay-sub").textContent,
      hintFont: parseFloat(getComputedStyle(o.querySelector(".overlay-hint")).fontSize),
      color: getComputedStyle(o.querySelector(".overlay-msg")).color,
    };
  });
  ok(crash && crash.role === "dialog" && crash.focused && /crashed/.test(crash.msg) && /km\/s/.test(crash.sub) && crash.hintFont >= 15 && crash.color === "rgb(11, 23, 27)", `impact: crash overlay shown, focused, dark ink (${crash ? crash.msg + " | " + crash.sub : "none"})`);
  await sleep(400);
  await page.screenshot({ path: path.join(shotDir, "freefall-impact-en.png") });
  await page.keyboard.press("Escape");
  const afterDismiss = await page.evaluate(() => ({ gone: !document.querySelector(".result-overlay"), focus: document.activeElement && document.activeElement.id }));
  ok(afterDismiss.gone && afterDismiss.focus === "startBtn", `Escape dismisses the overlay and focuses Try again (focus=${afterDismiss.focus})`);
  await page.screenshot({ path: path.join(shotDir, "freefall-impact-dismissed-en.png") });
  await page.click("#startBtn");
  s = await D();
  ok(s.phase === "running" && s.t < 100, "Try again restarts the same experiment");
  await page.close();
}

// ── Reduced motion and offline-font independence ─────────────────────────
{
  const page = await freshPage(1024, 768, { lang: "en", reduce: true });
  const reduced = await page.evaluate(() => window.freefallDebug.getReducedMotion());
  ok(reduced === true, "reduced-motion preference detected by the JS gate");
  await page.close();
  const offline = await browser.newPage();
  await offline.setRequestInterception(true);
  offline.on("request", (req) => {
    if (/fonts\.g(oogleapis|static)\.com/.test(req.url())) req.abort();
    else req.continue();
  });
  await offline.setViewport({ width: 1024, height: 768 });
  await offline.goto(base, { waitUntil: "load" });
  const works = await offline.evaluate(() => {
    const D = window.freefallDebug;
    D.loadPreset("circular");
    D.state.rate = 120;
    D.state.phase = "running";
    const res = D.integrate(60);
    return !!D && res.done === 60 && document.getElementById("startBtn").textContent.trim().length > 0;
  });
  ok(works, "app runs with Google Fonts blocked");
  await offline.close();
}

// ── Distant view, escape, higher ellipse apogee screenshots ──────────────
{
  const page = await freshPage(1440, 900, { lang: "en" });
  await page.evaluate(() => {
    const D = window.freefallDebug;
    D.loadPreset("higherEllipse");
    D.state.rate = 600;
    D.state.phase = "running";
    D.integrate(D.state.classification.period / 2);
    D.state.phase = "paused";
    D.updateReadouts();
  });
  await sleep(150);
  const earthInView = () => page.evaluate(() => {
    const D = window.freefallDebug;
    const size = D.getSize();
    const cam = D.cameraTransform(size.orbitW, size.orbitH);
    const c = cam.toScreen(0, 0);
    const rPx = D.constants.R_EARTH * cam.scale;
    const sp = cam.toScreen(D.state.station.x, D.state.station.y);
    return {
      surface: D.state.surfaceVisible,
      msg: document.getElementById("orbitMessage").textContent,
      label: document.getElementById("orbitCanvas").getAttribute("aria-label"),
      type: document.getElementById("valOrbitType").textContent,
      diskBottom: c[1] + rPx,
      diskTop: c[1] - rPx,
      diskInside: c[0] - rPx >= 0 && c[0] + rPx <= size.orbitW && c[1] - rPx >= 0 && c[1] + rPx <= size.orbitH,
      stationOutsideDisk: Math.hypot(c[0] - sp[0], c[1] - sp[1]) > rPx,
      earthRadiusPx: rPx,
      H: size.orbitH,
      stationY: sp[1],
      scale: cam.scale,
    };
  });
  const distant = await earthInView();
  ok(distant.surface === true && distant.msg === "", `apogee: camera pulled back so the surface stays in view (msg "${distant.msg}")`);
  ok(distant.diskInside && distant.stationOutsideDisk, `apogee: whole Earth disk inside the drawing, clear of the station (radius ${distant.earthRadiusPx.toFixed(0)} px)`);
  ok(/curved Earth/.test(distant.label), "apogee: standard close-view description used");
  ok(distant.type === "Elliptical orbit", `apogee: path type stays ${distant.type}`);
  const lowScale = await page.evaluate(() => { const D = window.freefallDebug; D.loadPreset("circular"); const s = D.getSize(); return D.cameraTransform(s.orbitW, s.orbitH).scale * 3e6 / s.orbitW; });
  ok(Math.abs(lowScale - 1) < 1e-9, `circular start keeps the default 3,000 km span (ratio ${lowScale.toFixed(3)})`);
  await page.evaluate(() => { const D = window.freefallDebug; D.loadPreset("higherEllipse"); D.state.rate = 600; D.state.phase = "running"; D.integrate(D.state.classification.period / 2); D.state.phase = "paused"; D.updateReadouts(); });
  await labelAudit(page, "apogee close view", ["Earth"]);
  await page.screenshot({ path: path.join(shotDir, "freefall-apogee-en.png") });
  await page.click("#pinEarthBtn");
  await sleep(150);
  await labelAudit(page, "apogee Earth pinned", ["Earth"]);
  const legend = await page.evaluate(() => {
    const D = window.freefallDebug;
    const hud = document.getElementById("orbitHud").getBoundingClientRect();
    const wrap = document.getElementById("orbitWrap").getBoundingClientRect();
    const hudBox = { x: hud.x - wrap.x, y: hud.y - wrap.y, w: hud.width, h: hud.height };
    const report = D.getLabelReport();
    const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const clash = report.obstacles.filter((o) => overlap(o, hudBox) && !(Math.abs(o.x - hudBox.x) < 1 && Math.abs(o.y - hudBox.y) < 1));
    return { clash: clash.length, obstacles: report.obstacles.length };
  });
  ok(legend.clash === 0 && legend.obstacles >= 4, `apogee Earth pinned: legend and labels sit clear of the HUD (${legend.clash} clashes, ${legend.obstacles} obstacles)`);
  await page.screenshot({ path: path.join(shotDir, "freefall-apogee-map-en.png") });
  await page.evaluate(() => {
    const D = window.freefallDebug;
    D.loadPreset("escape");
    D.state.rate = 600;
    D.state.phase = "running";
    D.integrate(3000);
    D.state.phase = "paused";
    D.updateReadouts();
  });
  await sleep(150);
  await page.screenshot({ path: path.join(shotDir, "freefall-escape-map-en.png") });
  await page.evaluate(() => { window.freefallDebug.setPin("station"); window.freefallDebug.updateReadouts(); });
  await sleep(150);
  const escapeView = await earthInView();
  ok(escapeView.surface === true && escapeView.diskInside && escapeView.earthRadiusPx >= 6, `escape: Earth stays in view as a ${escapeView.earthRadiusPx.toFixed(0)} px disk`);
  await page.screenshot({ path: path.join(shotDir, "freefall-escape-close-en.png") });
  const bye = await page.evaluate(() => {
    const D = window.freefallDebug;
    D.state.phase = "running";
    const res = D.integrate(200000);
    D.applyIntegrationEvent(res.event);
    D.updateReadouts();
    const o = document.querySelector(".result-overlay");
    return {
      event: res.event,
      phase: D.state.phase,
      kind: o ? o.className : null,
      msg: o ? o.querySelector(".overlay-msg").textContent : null,
      sub: o ? o.querySelector(".overlay-sub").textContent : null,
      focused: o ? document.activeElement === o : false,
    };
  });
  ok(bye.event === "endpoint" && bye.phase === "endpoint" && bye.kind === "result-overlay is-escape" && /Bye/.test(bye.msg) && /km\b/.test(bye.sub) && bye.focused, `escape endpoint: goodbye overlay shown and focused (${bye.msg} | ${bye.sub})`);
  await sleep(400);
  await page.screenshot({ path: path.join(shotDir, "freefall-escape-bye-en.png") });
  await page.keyboard.press("Enter");
  const byeGone = await page.evaluate(() => !document.querySelector(".result-overlay"));
  ok(byeGone, "Enter dismisses the goodbye overlay");
  const boundEnd = await page.evaluate(() => {
    const D = window.freefallDebug;
    D.loadPreset("circular");
    D.state.v0 = 10.8e3;
    D.resetExperiment();
    D.state.rate = 600;
    D.state.phase = "running";
    const res = D.integrate(400000);
    D.applyIntegrationEvent(res.event);
    return { type: D.state.classification.type, event: res.event, overlay: !!document.querySelector(".result-overlay") };
  });
  ok(boundEnd.type === "elliptical" && boundEnd.event === "endpoint" && !boundEnd.overlay, `a bound ellipse reaching the view endpoint shows no goodbye (type ${boundEnd.type}, event ${boundEnd.event})`);
  await page.evaluate(() => {
    const D = window.freefallDebug;
    D.setPin("station");
    D.loadPreset("circular");
    D.state.rate = 1;
    D.startThrust(1);
    D.state.phase = "running";
    D.integrate(2.9);
    D.state.phase = "paused";
    D.updateReadouts();
  });
  await sleep(150);
  const contact = await page.evaluate(() => ({
    pushColor: getComputedStyle(document.getElementById("valWallPush")).color,
    push: document.getElementById("valWallPush").textContent,
    explain: document.getElementById("cabinExplain").textContent,
    state: document.getElementById("cabinState").textContent,
  }));
  ok(/35\.00/.test(contact.push), `wall contact readout shows 35.00 N (${contact.push})`);
  ok(contact.pushColor === "rgb(255, 255, 255)", `wall-push readout uses the white contact colour (${contact.pushColor})`);
  ok(/wall now pushes/.test(contact.explain), `contact explanation shown (${contact.explain})`);
  await labelAudit(page, "engine contact", ["Engine push", "Path if engines stop now"]);
  const plCaption = await page.evaluate(() => { const D = window.freefallDebug; D.toggleLang(); const t = document.getElementById("lblSpeedUp").textContent + "|" + document.getElementById("speedUpBtn").getAttribute("aria-label"); D.toggleLang(); return t; });
  ok(plCaption === "Przyspiesz|Przyspiesz", `engine caption and accessible name follow the language (${plCaption})`);
  await page.screenshot({ path: path.join(shotDir, "freefall-contact-en.png") });
  const twoEngines = await page.evaluate(() => {
    const D = window.freefallDebug;
    D.stopThrust("manual");
    D.loadPreset("circular");
    D.state.rate = 120;
    D.state.phase = "running";
    D.integrate(D.state.classification.period / 8);
    D.state.rate = 1;
    D.startThrust(1);
    D.integrate(1);
    D.state.phase = "paused";
    D.updateReadouts();
    D.drawCabin();
    const a = D.state.lastEngineAccel;
    return { m: D.engineMix(a.ax, a.ay), labels: D.getLabelReport().labels.map((l) => l.text + ":" + l.placed) };
  });
  const firing = Object.entries(twoEngines.m).filter(([, v]) => v > 0).map(([k]) => k).sort();
  ok(firing.join("+") === "left+top" && Math.abs(twoEngines.m.left - twoEngines.m.top) < 2e-3, `eighth-orbit burn: left and top engines share the push equally (${firing.join("+")})`);
  ok(!twoEngines.labels.some((l) => l.startsWith("Engine push")), `no engine-push label in the cabin; the flames carry the burn (${twoEngines.labels.join(", ") || "none"})`);
  await page.screenshot({ path: path.join(shotDir, "freefall-engines-en.png") });
  await page.evaluate(() => { window.freefallDebug.stopThrust("manual"); });
  for (const frac of [0.25, 0.75]) {
    await page.evaluate((f) => {
      const D = window.freefallDebug;
      D.loadPreset("circular");
      D.state.rate = 120;
      D.state.phase = "running";
      D.integrate(D.state.classification.period * f);
      D.state.phase = "paused";
      D.updateReadouts();
    }, frac);
    await sleep(150);
    const turned = await page.evaluate(() => {
      const D = window.freefallDebug;
      const size = D.getSize();
      const cam = D.cameraTransform(size.orbitW, size.orbitH);
      const st = D.state.station;
      const sp = cam.toScreen(st.x, st.y);
      const ec = cam.toScreen(0, 0);
      return { centred: Math.hypot(sp[0] - size.orbitW / 2, sp[1] - size.orbitH / 2) < 0.5, earthDx: ec[0] - sp[0], surface: D.state.surfaceVisible };
    });
    ok(turned.centred && turned.surface && (frac === 0.25 ? turned.earthDx < -100 : turned.earthDx > 100), `${frac * 100}% orbit: station centred, surface visible, Earth to the ${frac === 0.25 ? "left" : "right"} (dx ${turned.earthDx.toFixed(0)})`);
    // The 120 s comparison runs out of the drawing when the path is vertical,
    // so its endpoint labels are not required here; collisions still are.
    await labelAudit(page, `${frac * 100}% orbit, station pinned`, ["Earth"]);
    await page.screenshot({ path: path.join(shotDir, `freefall-orbit-${frac * 100}-en.png`) });
  }
  await page.evaluate(() => {
    const D = window.freefallDebug;
    D.loadPreset("circular");
    D.enterInspection();
    D.inspectionStep();
    D.updateReadouts();
  });
  await sleep(150);
  await labelAudit(page, "fall inspection", ["Without gravity", "With gravity", "Change caused by gravity", "Starting distance"]);
  await page.screenshot({ path: path.join(shotDir, "freefall-inspection-en.png") });
  await page.close();
}

ok(pageErrors.length === 0, `no page errors (${pageErrors.join(" | ") || "none"})`);
await browser.close();
server.close();
console.log(`\n${checks - failures}/${checks} checks passed; screenshots in ${shotDir}`);
process.exit(failures > 0 ? 1 : 0);
