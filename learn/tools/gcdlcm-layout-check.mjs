#!/usr/bin/env node
/*
 * Real-Chrome layout check for gcdlcm/index.html (Factor Workshop).
 *
 * Serves learn/ over a local HTTP server, launches the system Chrome via
 * puppeteer-core (never downloads a browser), and measures the redesign
 * gates from docs/design.md §5 and §8: one current flowchart node per work
 * state, the chart fitting the stage at 1280×800 and 1440×900 in both
 * languages, the phone compact card and its toggle, Tab order, text sizes,
 * node contrast, horizontal overflow, reduced motion, one live-region
 * sentence per committed action, the Challenge invariant leak, the tutorial
 * demonstration, and the drag matrix (mouse, touch, pen, short touch,
 * second pointer, cancellation, prime and Shared drops).
 *
 * Exit codes: 0 = pass, 1 = assertion failures, 2 = no Chrome found.
 * Run from learn/: npm run gcdlcm-layout-check
 */
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
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
      "Chrome/Chromium binary, then re-run npm run gcdlcm-layout-check.",
  );
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const learnRoot = path.join(here, "..");
const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/favicon.ico") {
      // The app has no favicon by convention; keep the console clean.
      res.writeHead(204);
      res.end();
      return;
    }
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
const base = "http://127.0.0.1:" + port + "/gcdlcm/index.html";

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error("FAIL: " + msg);
  }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let sectionFailures = 0;
function section(title) {
  const failed = failures - sectionFailures;
  sectionFailures = failures;
  console.log((failed === 0 ? "ok   " : "FAIL ") + title);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "shell",
  args: ["--no-sandbox", "--font-render-hinting=none"],
});
const pageErrors = [];

// ---- page factory and shared probes ----
async function newPage(opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({
    width: opts.width || 1280,
    height: opts.height || 800,
    deviceScaleFactor: opts.dpr || 2,
    hasTouch: !!opts.touch,
    isMobile: !!opts.mobile,
  });
  page.on("console", (m) => {
    if (m.type() === "error") {
      pageErrors.push(m.text());
    }
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  if (opts.reducedMotion) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  const url = base + (opts.query ? "?" + opts.query : "");
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.evaluate((seen) => {
    localStorage.clear();
    if (seen) {
      localStorage.setItem("gcdlcmIntroSeenV2", "1");
    }
  }, opts.seen !== false);
  await page.goto(url, { waitUntil: "networkidle0" });
  const lang = opts.lang || "en";
  if ((await page.evaluate(() => document.documentElement.lang)) !== lang) {
    await page.click("#langBtn");
    await sleep(80);
  }
  return page;
}

const clickIn = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) {
      throw new Error("missing " + sel);
    }
    el.click();
  }, selector);
// Splitting is a two-step tap: pick the prime, then touch the number it
// divides. Drag does the same thing in one gesture.
const clickPrime = async (page, p) => {
  await clickIn(page, '[data-prime="' + p + '"]');
  await sleep(50);
  const hit = await page.evaluate(() => {
    const el = document.querySelector("button.quot-circle");
    if (!el) {
      return false;
    }
    el.click();
    return true;
  });
  await sleep(50);
  return hit;
};
const tileSelector = (page, row, p) =>
  page.evaluate(
    ([row, p]) => {
      const t = Array.from(
        document.querySelectorAll(
          '.rail[data-row="' + row + '"] .tile:not(.paired):not(.added)',
        ),
      ).find((x) => x.textContent.trim() === String(p));
      return t
        ? '[data-tile-id="' + t.getAttribute("data-tile-id") + '"]'
        : null;
    },
    [row, p],
  );
const tapPair = async (page, p) => {
  for (const row of ["A", "B"]) {
    const sel = await tileSelector(page, row, p);
    if (sel) {
      await clickIn(page, sel);
      await sleep(50);
    }
  }
};
const addLeftovers = async (page) => {
  for (let i = 0; i < 4; i += 1) {
    const sel = await page.evaluate(() => {
      const t = document.querySelector(
        ".rail .tile:not(.paired):not(.added):not([disabled])",
      );
      return t
        ? '[data-tile-id="' + t.getAttribute("data-tile-id") + '"]'
        : null;
    });
    if (!sel) {
      break;
    }
    await clickIn(page, sel);
    await sleep(50);
  }
};
const openMore = async (page) => {
  const hidden = await page.evaluate(
    () => document.getElementById("moreBody").hidden,
  );
  if (hidden) {
    await clickIn(page, "#moreBtn");
    await sleep(50);
  }
};
const switchTo = async (page, alg, experience) => {
  await openMore(page);
  await clickIn(page, "#switchAlgBtn");
  await sleep(80);
  await clickIn(page, alg === "gcd" ? "#chooseGcd" : "#chooseLcm");
  await sleep(80);
  if (experience === "challenge") {
    await openMore(page);
    await clickIn(page, "#expChallenge");
    await sleep(80);
  }
};
const chooseAnswer = async (page, n) => {
  await page.evaluate((n) => {
    const b = Array.from(document.querySelectorAll(".choice-num")).find(
      (x) => x.textContent.trim() === String(n),
    );
    b.click();
  }, n);
  await sleep(50);
};
// Contrast maths lives here once; page probes report colours as strings.
const parseRgb = (css) => {
  const m = css.match(/\d+(\.\d+)?/g);
  return m ? m.slice(0, 3).map(Number) : null;
};
const lumOf = (css) => {
  const rgb = parseRgb(css);
  if (!rgb) {
    return null;
  }
  const f = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
};
const ratioOf = (fg, bg) => {
  const a = lumOf(fg);
  const b = lumOf(bg);
  if (a === null || b === null) {
    return 0;
  }
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// The primes a child taps to break n down. The last factor is never tapped:
// once the remainder is prime the row closes itself. A prime n needs one tap.
const tapsFor = (n) => {
  const f = [];
  let m = n;
  for (const q of [2, 3, 5, 7]) {
    while (m % q === 0) {
      f.push(q);
      m /= q;
    }
  }
  return f.length <= 1 ? f : f.slice(0, -1);
};

const centerOf = (page, selector) =>
  page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      l: r.left,
      t: r.top,
      r: r.right,
      b: r.bottom,
    };
  }, selector);
async function mouseDrag(page, from, to, opts = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  const steps = 6;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps,
    );
    if (opts.mid && i === 3) {
      await opts.mid();
    }
  }
  await page.mouse.up();
  await sleep(250);
}
// Drag to the target, read the board while the pointer is still held there,
// then release. mouseDrag's mid-point callback fires in open space, which is
// exactly where nothing is previewed.
async function holdOver(page, from, to, probe) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / 6,
      from.y + ((to.y - from.y) * i) / 6,
    );
  }
  await sleep(60);
  const seen = await probe();
  await page.mouse.up();
  await sleep(250);
  return seen;
}
async function touchDrag(page, from, to) {
  const t = await page.touchscreen.touchStart(from.x, from.y);
  for (let i = 1; i <= 8; i += 1) {
    await t.move(
      from.x + ((to.x - from.x) * i) / 8,
      from.y + ((to.y - from.y) * i) / 8,
    );
  }
  await t.end();
  await sleep(300);
}
async function penDrag(page, from, to) {
  const cdp = await page.createCDPSession();
  const ev = (type, x, y) =>
    cdp.send("Input.dispatchMouseEvent", {
      type,
      x,
      y,
      button: "left",
      clickCount: 1,
      pointerType: "pen",
    });
  await ev("mouseMoved", from.x, from.y);
  await ev("mousePressed", from.x, from.y);
  for (let i = 1; i <= 6; i += 1) {
    await ev(
      "mouseMoved",
      from.x + ((to.x - from.x) * i) / 6,
      from.y + ((to.y - from.y) * i) / 6,
    );
  }
  await ev("mouseReleased", to.x, to.y);
  await sleep(300);
  await cdp.detach();
}
const chartProbe = (page) =>
  page.evaluate(() => {
    const lum = (c) => {
      const m = c.match(/\d+(\.\d+)?/g).map(Number);
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
    };
    const ratio = (a, b) => {
      const l1 = lum(a);
      const l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const stageBg = getComputedStyle(
      document.getElementById("stage"),
    ).backgroundColor;
    const nodes = Array.from(document.querySelectorAll(".node")).map((li) => {
      const st = li.className.split(" ")[2];
      const box = li.querySelector(".hex-inner") || li;
      const label = li.querySelector(".node-label");
      const second = li.querySelector(".node-answer, .node-meta");
      return {
        id: li.getAttribute("data-node"),
        st,
        text: label.textContent,
        second: second ? second.textContent : "",
        contrast: ratio(
          getComputedStyle(label).color,
          getComputedStyle(box).backgroundColor,
        ),
        labelSize: parseFloat(getComputedStyle(label).fontSize),
        secondSize: second
          ? parseFloat(getComputedStyle(second).fontSize)
          : null,
        overflow: label.scrollWidth > label.clientWidth + 1,
        current: li.getAttribute("aria-current") === "step",
      };
    });
    const stage = document.getElementById("stage");
    const chart = document.getElementById("chart");
    const cue = document.getElementById("stageCue");
    const nodeRects = Array.from(document.querySelectorAll(".node")).map((li) =>
      li.getBoundingClientRect(),
    );
    const labels = Array.from(document.querySelectorAll(".edge-label")).map(
      (t) => {
        const r = t.getBoundingClientRect();
        // Label boxes may touch a node edge (sub-pixel) but never enter it.
        const hits = nodeRects.filter(
          (n) =>
            Math.min(r.right, n.right) - Math.max(r.left, n.left) > 0.5 &&
            Math.min(r.bottom, n.bottom) - Math.max(r.top, n.top) > 0.5,
        ).length;
        return {
          text: t.textContent,
          badge: t.classList.contains("badge"),
          size: parseFloat(getComputedStyle(t).fontSize),
          left: r.left - stage.getBoundingClientRect().left,
          inViewport: r.left >= 0 && r.right <= window.innerWidth,
          hits,
          contrast: ratio(getComputedStyle(t).fill, stageBg),
        };
      },
    );
    stage.scrollTop = 0;
    return {
      nodes,
      current: nodes.filter((n) => n.current).map((n) => n.id),
      ariaCount: document.querySelectorAll('[aria-current="step"]').length,
      chartHidden: chart.hidden,
      chartH: chart.offsetHeight,
      chartBottom: chart.getBoundingClientRect().bottom,
      // The chart must fit the stage content box: its height less the
      // stage padding, rather than a fixed allowance picked by hand.
      budget:
        stage.clientHeight -
        parseFloat(getComputedStyle(stage).paddingTop) -
        parseFloat(getComputedStyle(stage).paddingBottom),
      stageScroll: stage.scrollHeight > stage.clientHeight + 1,
      stageOver: stage.scrollHeight - stage.clientHeight,
      pageScroll:
        document.documentElement.scrollHeight > window.innerHeight + 1,
      edges: document.querySelectorAll(".edge").length,
      entry: document.querySelectorAll(".edge.entry").length,
      taken: document.querySelectorAll(".edge.taken").length,
      labels,
      proofCount: document.querySelectorAll(".proof").length,
      cueSize: cue.hidden ? null : parseFloat(getComputedStyle(cue).fontSize),
      cueHidden: cue.hidden,
      eqA: (document.querySelector('.rail[data-row="A"] .rail-eq') || {})
        .textContent
        ? document
            .querySelector('.rail[data-row="A"] .rail-eq')
            .textContent.replace(/\s+/g, " ")
            .trim()
        : "",
      eqSize: (() => {
        const e = document.querySelector(".rail-eq");
        return e ? parseFloat(getComputedStyle(e).fontSize) : null;
      })(),
      product: (document.querySelector(".product") || {}).textContent
        ? document
            .querySelector(".product")
            .textContent.replace(/\s+/g, " ")
            .trim()
        : "",
      feedback: document.getElementById("feedback").hidden
        ? ""
        : document.getElementById("feedback").textContent,
      scrollWidth: document.documentElement.scrollWidth,
      active: (() => {
        const a = document.activeElement;
        return a ? a.id || a.className : null;
      })(),
    };
  });
const byId = (s) => Object.fromEntries(s.nodes.map((n) => [n.id, n]));
const contrastSeen = {};
const record = (s) =>
  s.nodes.forEach((n) => {
    contrastSeen[n.st] = Math.min(contrastSeen[n.st] || 99, n.contrast);
  });

const T = {
  en: {
    noLeft: "No: 9 left",
    yes: "Yes",
    no: "No",
    given: "Given",
    show: "Show all steps",
    hide: "Hide steps",
  },
  pl: {
    noLeft: "Nie: zostało 9",
    yes: "Tak",
    no: "Nie",
    given: "Dane",
    show: "Pokaż wszystkie kroki",
    hide: "Ukryj kroki",
  },
};

// ================= 1. one current node, chart fit, sizes, contrast =================
for (const lang of ["en", "pl"]) {
  for (const [w, h] of [
    [1280, 800],
    [1440, 900],
  ]) {
    const tag = lang + " " + w + "x" + h;
    const page = await newPage({ width: w, height: h, lang });
    let s = await chartProbe(page);
    ok(s.chartHidden, tag + ": choice screen hides the chart");
    await clickIn(page, "#chooseGcd");
    await sleep(80);
    s = await chartProbe(page);
    record(s);
    ok(
      s.current.join() === "splitA" && s.ariaCount === 1 && !s.chartHidden,
      tag + ": Guided GCD opens at splitA current (" + s.current.join() + ")",
    );
    ok(
      s.edges === 9 && s.entry === 0 && s.taken === 0,
      tag + ": the GCD path has nine edges, none taken at start",
    );
    ok(
      s.nodes.every((n) => n.labelSize === 17) && s.cueSize === 28,
      tag + ": node labels 17px and the instruction 28px",
    );
    ok(!s.pageScroll, tag + ": no page scroll");
    ok(
      s.nodes.every((n) => !n.overflow),
      tag + ": no node label overflow",
    );
    ok(
      s.labels.every((l) => l.size === 15 && l.left >= 0 && l.contrast >= 4.5),
      tag + ": edge labels 15px, inside the stage, contrast >= 4.5:1",
    );
    ok(
      s.labels.every((l) => l.hits === 0 && l.inViewport),
      tag + ": edge labels overlap no node and stay inside the viewport",
    );
    // Tab: heading → first prime
    await page.evaluate(() => document.getElementById("taskText").focus());
    await page.keyboard.press("Tab");
    s = await chartProbe(page);
    ok(
      /prime-btn/.test(s.active),
      tag + ": Tab from the task heading reaches a prime (" + s.active + ")",
    );
    // drag 2 onto the amber circle, the part still to be broken down
    const p2 = await centerOf(page, '[data-prime="2"]');
    const quotA = await centerOf(page, '.rail[data-row="A"] .quot-circle');
    await mouseDrag(page, p2, { x: quotA.x, y: quotA.y });
    s = await chartProbe(page);
    record(s);
    let n = byId(s);
    ok(
      n.stopA.st === "looping" &&
        n.stopA.second === T[lang].noLeft &&
        n.stopA.secondSize === 15,
      tag + ": stopA looping with '" + n.stopA.second + "' at 15px",
    );
    ok(
      s.entry === 1 &&
        s.current.join() === "splitA" &&
        s.labels.some((l) => l.text === "2" && l.badge),
      tag + ": loop edge is the entry edge with round badge 2",
    );
    ok(
      s.eqA === "18 = 2 × 9" && s.eqSize === 18,
      tag + ": split invariant line after 18 ÷ 2 (" + s.eqA + ")",
    );
    for (const p of [3, 2, 2, 2]) {
      await clickPrime(page, p);
    }
    s = await chartProbe(page);
    record(s);
    n = byId(s);
    ok(
      s.current.join() === "pair" &&
        n.stopA.second === T[lang].yes &&
        n.stopB.second === T[lang].yes &&
        n.match.st === "looping" &&
        n.splitA.st === "done" &&
        n.splitA.text.startsWith("✓"),
      tag + ": assemble entry: pair current, diamonds answered, splits ticked",
    );
    ok(
      s.proofCount === 0,
      tag + ": Guided assemble explains nothing until a check",
    );
    await tapPair(page, 2);
    await tapPair(page, 3);
    s = await chartProbe(page);
    record(s);
    n = byId(s);
    ok(
      s.current.join() === "multiply" &&
        n.match.second === T[lang].no &&
        !n.leftovers &&
        n.pair.st === "done",
      tag + ": all paired: multiply current, no leftover step on a GCD board",
    );
    await clickIn(page, "#primaryBtn");
    await sleep(400);
    s = await chartProbe(page);
    record(s);
    n = byId(s);
    ok(
      s.ariaCount === 0 &&
        n.multiply.st === "done" &&
        n.multiply.second === "2 × 3 = 6",
      tag + ": result: no current node, multiply shows 2 × 3 = 6",
    );
    ok(
      s.entry === 0 && s.taken === 9,
      tag +
        ": GCD result: no entry edge, ten taken (" +
        s.entry +
        "/" +
        s.taken +
        ")",
    );
    // The proof explains the answer; nothing else on the result screen
    // restates it as arithmetic.
    const withProof = await page.evaluate(() => ({
      inv: document.querySelectorAll(".invariant, .inv-line").length,
      proof: document.querySelectorAll(".proof").length,
      lead: (document.querySelector(".proof-text strong") || {}).textContent || "",
    }));
    ok(
      withProof.inv === 0 &&
        withProof.proof === 1 &&
        withProof.lead.length > 10 &&
        !/^\d/.test(withProof.lead.trim()),
      tag +
        ": the divisibility lines appear at the result, together with the proof (" +
        JSON.stringify(withProof) +
        ")",
    );
    ok(
      s.labels.every((l) => l.hits === 0 && l.inViewport),
      tag + ": GCD result: labels overlap no node",
    );
    // LCM 6,8 to the tallest state
    await switchTo(page, "lcm", "guided");
    for (const p of [2, 2, 2]) {
      await clickPrime(page, p);
    }
    await tapPair(page, 2);
    s = await chartProbe(page);
    record(s);
    n = byId(s);
    ok(
      s.current.join() === "leftovers" && n.match.second === T[lang].no,
      tag + ": LCM leftovers current straight after the match test",
    );
    await addLeftovers(page);
    await clickIn(page, "#primaryBtn");
    await sleep(400);
    s = await chartProbe(page);
    record(s);
    n = byId(s);
    ok(
      s.ariaCount === 0 && n.multiply.second === "2 × 2 × 2 × 3 = 24",
      tag + ": LCM result " + n.multiply.second,
    );
    ok(
      s.entry === 0 && s.taken === 10,
      tag +
        ": LCM result: no entry edge, eleven taken (" +
        s.entry +
        "/" +
        s.taken +
        ")",
    );
    ok(
      s.chartH <= s.budget && s.chartBottom <= h && !s.pageScroll,
      tag +
        ": tallest state: chart fits and the page does not scroll (chart " +
        s.chartH +
        " <= " +
        s.budget +
        ")",
    );
    // The result board is the one screen allowed to run past the stage, and
    // only because the child has finished: what it must never do is push the
    // next action out of sight behind the proof. The allowance is a measured
    // ceiling, not a blanket exemption - 2026-09-26, after the divisibility
    // block left, English fits exactly and only Polish at 1280x800 runs over,
    // by 35px. Anything past 40px means the screen grew again.
    ok(
      s.stageOver <= 40,
      tag +
        ": the result board overruns the stage by at most 40px (" +
        s.stageOver +
        ")",
    );
    const reach = await page.evaluate(() => {
      const b = document.getElementById("primaryBtn");
      const st = document.getElementById("stage");
      if (!b) {
        return null;
      }
      const r = b.getBoundingClientRect();
      const sr = st.getBoundingClientRect();
      return {
        top: Math.round(r.top - sr.top),
        bottom: Math.round(r.bottom - sr.top),
        visible: r.top >= sr.top && r.bottom <= sr.bottom,
        scrolled: st.scrollTop,
      };
    });
    ok(
      reach && reach.visible && reach.scrolled === 0,
      tag +
        ": the next action stays in view without scrolling (" +
        JSON.stringify(reach) +
        ")",
    );
    ok(
      s.nodes.every((n2) => !n2.overflow) &&
        s.labels.every((l) => l.left >= 0 && l.hits === 0 && l.inViewport),
      tag + ": tallest state: no label overflow or collision",
    );
    await page.close();
  }
}
ok(
  Object.keys(contrastSeen).length >= 4 &&
    Object.values(contrastSeen).every((v) => v >= 4.5),
  "node text contrast >= 4.5:1 in every sampled state: " +
    JSON.stringify(contrastSeen),
);
section("1. flowchart: one current node, chart fit, sizes, contrast");

// ================= 2. given boards and the Challenge invariant leak =================
// The deck is drawn per run, so the section reads the task numbers from the
// heading and derives everything else; ?debug=1&seed=3 makes the draw
// replayable.
const gcdOf = (a, b) => (b ? gcdOf(b, a % b) : a);
const factorsOf = (n) => {
  const out = [];
  let m = n;
  for (const p of [2, 3, 5, 7]) {
    while (m % p === 0) {
      out.push(p);
      m /= p;
    }
  }
  return out;
};
const taskNumbers = (page) =>
  page.evaluate(() => {
    const m = document.getElementById("taskText").textContent.match(/\d+/g);
    return m ? m.map(Number) : [];
  });
{
  const page = await newPage({ lang: "en", query: "debug=1&seed=3" });
  await clickIn(page, "#chooseGcd");
  await sleep(80);
  await openMore(page);
  await clickIn(page, "#expChallenge");
  await sleep(80);
  const [a, b] = await taskNumbers(page);
  const g = gcdOf(a, b);
  const shared = factorsOf(g);
  ok(
    a < b && g > 1 && a <= 30 && b <= 30,
    "Challenge task 1 is an ordered pair with a shared prime (" +
      a +
      "," +
      b +
      ")",
  );
  for (const p of tapsFor(a).concat(tapsFor(b))) {
    await clickPrime(page, p);
  }
  let s = await chartProbe(page);
  ok(
    s.proofCount === 0 && s.product === "?",
    "Challenge assemble: nothing explains the answer, slot still ?",
  );
  const choices = await page.$$eval(".choice-num", (els) =>
    els.map((e) => Number(e.textContent.trim())),
  );
  ok(
    choices.length === 3 &&
      choices.includes(g) &&
      choices[0] < choices[1] &&
      choices[1] < choices[2],
    "three ascending choices include the answer (" + choices.join(",") + ")",
  );
  const wrong = choices.find((c) => c !== g);
  await chooseAnswer(page, g);
  await clickIn(page, "#primaryBtn");
  await sleep(120);
  s = await chartProbe(page);
  ok(
    s.proofCount === 0 && s.product === "?" && s.feedback.length > 0,
    "Challenge incomplete submission: no proof, ? stays",
  );
  for (const p of shared) {
    await tapPair(page, p);
  }
  const joined = shared.join(" × ");
  await chooseAnswer(page, wrong);
  await clickIn(page, "#primaryBtn");
  await sleep(120);
  s = await chartProbe(page);
  ok(
    s.proofCount === 0 && s.product === joined + " = ?",
    "Challenge wrong submission: no proof, the ? stays",
  );
  await chooseAnswer(page, g);
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  s = await chartProbe(page);
  const proofText = await page.evaluate(
    () => (document.querySelector(".proof-text") || {}).textContent || "",
  );
  ok(
    s.product === joined + " = " + g &&
      proofText.indexOf(String(a / g)) !== -1 &&
      proofText.indexOf(String(b / g)) !== -1,
    "Challenge correct submission: the answer and its proof appear (" +
      proofText.slice(0, 60) +
      ")",
  );
  ok(s.entry === 0, "Challenge result: no entry edge");
  await clickIn(page, "#primaryBtn");
  await sleep(200);
  s = await chartProbe(page);
  const n = byId(s);
  ok(
    n.splitA.st === "given" &&
      n.stopB.st === "given" &&
      n.splitA.second === "Given" &&
      s.current.join() === "pair" &&
      s.taken === 0,
    "pre-split task 2: split nodes Given, pair current, no split edge taken",
  );
  const [a2, b2] = await taskNumbers(page);
  ok(
    !(a2 === a && b2 === b) && gcdOf(a2, b2) > 1,
    "task 2 is a different shared pair (" + a2 + "," + b2 + ")",
  );
  // task 3 carries the story copy with the drawn numbers filled in
  for (const p of factorsOf(gcdOf(a2, b2))) {
    await tapPair(page, p);
  }
  await chooseAnswer(page, gcdOf(a2, b2));
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  await clickIn(page, "#primaryBtn");
  await sleep(200);
  const story = await page.evaluate(
    () => document.getElementById("taskText").textContent,
  );
  const m = story.match(/^Box A holds (\d+) counters and box B holds (\d+)\./);
  ok(
    !!m && gcdOf(Number(m[1]), Number(m[2])) > 1 && Number(m[1]) < Number(m[2]),
    "task 3 story copy names the drawn pair: " + story,
  );
  await page.close();
  // the same seed replays the same first task; a fresh page without the
  // seed still shows a valid task
  const again = await newPage({ lang: "en", query: "debug=1&seed=3" });
  await clickIn(again, "#chooseGcd");
  await sleep(80);
  await openMore(again);
  await clickIn(again, "#expChallenge");
  await sleep(80);
  const [ra, rb] = await taskNumbers(again);
  ok(ra === a && rb === b, "seed 3 replays the same first task");
  // The rules block predicts the draw: the app's first Challenge run takes
  // seed + 7919 (its first freshSeed call).
  const html = readFileSync(
    path.join(here, "..", "gcdlcm", "index.html"),
    "utf8",
  );
  const R = vm.runInNewContext(
    html.slice(
      html.indexOf("// [rules:start]"),
      html.indexOf("// [rules:end]"),
    ) + "\n({ challengeDeck })",
    { Math, Object, Number, Array, String },
  );
  const predicted = R.challengeDeck("gcd", 3 + 7919)[0].pair;
  ok(
    predicted[0] === a && predicted[1] === b,
    "seed 3 draws the deck the rules block predicts (" +
      predicted.join(",") +
      ")",
  );
  await again.close();
  const clock = await newPage({ lang: "pl" });
  await clickIn(clock, "#chooseLcm");
  await sleep(80);
  await openMore(clock);
  await clickIn(clock, "#expChallenge");
  await sleep(80);
  const [ca, cb] = await taskNumbers(clock);
  ok(
    ca < cb && gcdOf(ca, cb) > 1 && (ca * cb) / gcdOf(ca, cb) <= 72,
    "clock-seeded LCM task 1 shares a prime and fits the track (" +
      ca +
      "," +
      cb +
      ")",
  );
  await clock.close();
  section("2. given boards and the Challenge invariant leak");
}

// ================= 3. phone: compact card, toggle, Tab order, overflow =================
for (const lang of ["en", "pl"]) {
  const tag = lang + " 360";
  const page = await newPage({
    width: 360,
    height: 740,
    touch: true,
    mobile: true,
    lang,
  });
  const probe = () =>
    page.evaluate(() => {
      const vis = (e) => e.getClientRects().length > 0;
      const shown = Array.from(document.querySelectorAll(".node")).filter(vis);
      const t = document.getElementById("chartToggle");
      const r = (id) => document.getElementById(id).getBoundingClientRect();
      return {
        nodes: shown.map(
          (li) =>
            li.getAttribute("data-node") +
            ":" +
            li.className
              .split(" ")
              .filter((c) =>
                [
                  "is-focus",
                  "stub-prev",
                  "stub-next",
                  "glyph-down",
                  "glyph-loop",
                ].includes(c),
              )
              .join("+"),
        ),
        glyphs: shown
          .map((li) => {
            const c = getComputedStyle(li, "::after");
            const t = c.content.replace(/"/g, "");
            // The loop icon is a background image on an empty ::after.
            return t !== "" ? t : c.backgroundImage !== "none" ? "↺" : "none";
          })
          .join(""),
        svgVisible: vis(document.getElementById("chartEdges")),
        collisions: (() => {
          const rects = shown.map((li) => li.getBoundingClientRect());
          return Array.from(document.querySelectorAll(".edge-label")).filter(
            (t) => {
              const r = t.getBoundingClientRect();
              return rects.some(
                (n) =>
                  Math.min(r.right, n.right) - Math.max(r.left, n.left) > 0.5 &&
                  Math.min(r.bottom, n.bottom) - Math.max(r.top, n.top) > 0.5,
              );
            },
          ).length;
        })(),
        labelsOut: Array.from(document.querySelectorAll(".edge-label")).filter(
          (t) => {
            const r = t.getBoundingClientRect();
            return r.left < 0 || r.right > window.innerWidth;
          },
        ).length,
        chartCentred: (() => {
          const c = r("chart");
          const st = r("stage");
          return Math.abs(c.left - st.left - (st.right - c.right)) <= 1;
        })(),
        toggle: {
          text: t.textContent.trim(),
          expanded: t.getAttribute("aria-expanded"),
          h: t.getBoundingClientRect().height,
          fs: parseFloat(getComputedStyle(t).fontSize),
          hidden: t.hidden,
        },
        order:
          r("chart").bottom <= r("stageCue").top &&
          r("stageCue").bottom <= r("chartToggle").top &&
          r("chartToggle").bottom <= r("workbench").top,
        benchTop: r("workbench").top,
        sw: document.documentElement.scrollWidth,
        active: (() => {
          const a = document.activeElement;
          return a ? a.id || a.className : null;
        })(),
        ariaCount: document.querySelectorAll('[aria-current="step"]').length,
      };
    });
  let s = await probe();
  ok(s.toggle.hidden, tag + ": choice screen hides the toggle");
  await clickIn(page, "#chooseGcd");
  await sleep(80);
  s = await probe();
  ok(
    s.nodes.join(" | ") === "splitA:is-focus+glyph-down | stopA:stub-next" &&
      s.glyphs === "↓none",
    tag + ": compact card at start (" + s.nodes.join(" | ") + ")",
  );
  ok(
    !s.svgVisible &&
      s.toggle.text === T[lang].show &&
      s.toggle.expanded === "false" &&
      s.toggle.h >= 48 &&
      s.toggle.fs === 18,
    tag + ": collapsed by default, toggle 18px on >= 48px",
  );
  ok(
    s.order && s.benchTop < 740,
    tag +
      ": card, instruction, toggle, workbench in order and within 740px (" +
      Math.round(s.benchTop) +
      ")",
  );
  ok(s.sw <= 360, tag + ": no horizontal overflow in split");
  await page.evaluate(() => document.getElementById("taskText").focus());
  await page.keyboard.press("Tab");
  s = await probe();
  ok(s.active === "chartToggle", tag + ": Tab from heading reaches the toggle");
  await page.keyboard.press("Tab");
  s = await probe();
  ok(/prime-btn/.test(s.active), tag + ": Tab from the toggle reaches a prime");
  await clickPrime(page, 2);
  s = await probe();
  ok(
    s.nodes.join(" | ") ===
      "splitA:is-focus+glyph-down | stopA:stub-prev+glyph-loop" &&
      s.glyphs === "↓↺",
    tag + ": after a split the answered test loops back (" + s.glyphs + ")",
  );
  await clickIn(page, "#chartToggle");
  await sleep(120);
  s = await probe();
  ok(
    s.nodes.length === 7 &&
      s.svgVisible &&
      s.toggle.text === T[lang].hide &&
      s.toggle.expanded === "true" &&
      s.active === "chartToggle" &&
      s.sw <= 360,
    tag + ": expanded: seven nodes, arrows, focus kept, no overflow",
  );
  await clickIn(page, "#chartToggle");
  await sleep(120);
  for (const p of [3, 2, 2, 2]) {
    await clickPrime(page, p);
  }
  await clickIn(page, "#chartToggle");
  await sleep(120);
  s = await probe();
  ok(
    s.sw <= 360 && s.nodes.length === 7,
    tag + ": expanded assemble: no overflow",
  );
  ok(
    s.collisions === 0 && s.labelsOut === 0 && s.chartCentred,
    tag +
      ": expanded chart centred, labels overlap no node and stay in view (" +
      s.collisions +
      "/" +
      s.labelsOut +
      ")",
  );
  await clickIn(page, "#chartToggle");
  await sleep(120);
  await tapPair(page, 2);
  await tapPair(page, 3);
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  s = await probe();
  ok(
    s.ariaCount === 0 &&
      s.nodes.join(" | ") ===
        "match:stub-prev+glyph-down | multiply:is-focus" &&
      s.glyphs === "↓none",
    tag + ": result card: match then multiply (" + s.nodes.join(" | ") + ")",
  );
  await clickIn(page, "#chartToggle");
  await sleep(120);
  s = await probe();
  ok(s.sw <= 360, tag + ": expanded result: no overflow");
  // touch drag pairs on the phone
  await clickIn(page, "#chartToggle");
  await sleep(80);
  await switchTo(page, "lcm", "guided");
  for (const p of [2, 2, 2]) {
    await clickPrime(page, p);
  }
  const a2 = await centerOf(page, await tileSelector(page, "A", 2));
  const b2 = await centerOf(page, await tileSelector(page, "B", 2));
  await touchDrag(page, a2, b2);
  const paired = await page.evaluate(
    () => document.querySelectorAll(".rail .tile.paired").length / 2,
  );
  ok(paired === 1, tag + ": touch drag pairs the 2s (" + paired + ")");
  await page.close();
}
section("3. phone compact card, toggle, Tab order, overflow, touch drag");

// ================= 3b. 200% zoom (640x400 CSS px): phone layout, reachable action =================
for (const lang of ["en", "pl"]) {
  const tag = lang + " 640x400";
  const page = await newPage({ width: 640, height: 400, lang });
  await clickIn(page, "#chooseLcm");
  await sleep(80);
  const zoomProbe = () =>
    page.evaluate(() => {
      const btn = document.getElementById("primaryBtn");
      if (btn) {
        btn.scrollIntoView({ block: "center" });
      }
      const r = btn ? btn.getBoundingClientRect() : null;
      const toggle = document.getElementById("chartToggle");
      return {
        sw: document.documentElement.scrollWidth,
        vScroll: document.documentElement.scrollHeight > window.innerHeight + 1,
        btnInView:
          !!r && r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0,
        toggleShown: getComputedStyle(toggle).display !== "none",
        nodesShown: Array.from(document.querySelectorAll(".node")).filter(
          (li) => li.getClientRects().length > 0,
        ).length,
      };
    });
  let z = await zoomProbe();
  ok(
    z.sw <= 641 && z.toggleShown && z.nodesShown === 2,
    tag + ": split: compact card, no horizontal overflow (" + z.sw + ")",
  );
  for (const p of [2, 2, 2]) {
    await clickPrime(page, p);
  }
  await tapPair(page, 2);
  await addLeftovers(page);
  z = await zoomProbe();
  ok(
    z.sw <= 641 && z.vScroll && z.btnInView,
    tag + ": shelf complete: vertical scroll only, Check reachable",
  );
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  z = await zoomProbe();
  ok(
    z.sw <= 641 && z.vScroll && z.btnInView,
    tag + ": result: vertical scroll only, Next pair reachable",
  );
  await page.close();
}
section("3b. 200% zoom emulation");

// ================= 4. reduced motion =================
{
  const page = await newPage({ lang: "en", reducedMotion: true });
  await clickIn(page, "#chooseGcd");
  await sleep(80);
  await clickPrime(page, 2);
  let anims = await page.evaluate(() => document.getAnimations().length);
  ok(
    anims === 0,
    "reduced motion: no animations after a split (" + anims + ")",
  );
  for (const p of [3, 2, 2, 2]) {
    await clickPrime(page, p);
  }
  await tapPair(page, 2);
  anims = await page.evaluate(() => document.getAnimations().length);
  ok(anims === 0, "reduced motion: no animations after a pair (" + anims + ")");
  await page.close();
  const tut = await newPage({ lang: "en", reducedMotion: true, seen: false });
  await tut.waitForSelector("#introTitle");
  await clickPrime(tut, 2);
  await sleep(30);
  const s = await chartProbe(tut);
  ok(
    s.current.join() === "pair" && s.eqA === "12 = 2 × 2 × 3",
    "reduced motion: the demo completes synchronously (pair current)",
  );
  await tut.close();
  section("4. reduced motion");
}

// ================= 5. announcements: one per committed action =================
{
  const page = await newPage({ lang: "en" });
  const arm = () =>
    page.evaluate(() => {
      window.__live = [];
      const live = document.getElementById("live");
      new MutationObserver(() => {
        const t = live.textContent;
        if (t) {
          window.__live.push(t);
        }
      }).observe(live, { childList: true, characterData: true, subtree: true });
    });
  await arm();
  const take = () =>
    page.evaluate(() => {
      const l = window.__live.slice();
      window.__live = [];
      return l;
    });
  const one = async (label, expected) => {
    await sleep(120);
    const l = await take();
    ok(
      l.length === 1 && l[0] === expected,
      label + ": one announcement, got " + JSON.stringify(l),
    );
  };
  await clickIn(page, "#chooseGcd");
  await sleep(120);
  await take();
  await clickPrime(page, 2);
  await one("tap split", "18 ÷ 2 = 9. All primes now? No: 9 left. Split A.");
  await clickIn(page, "#undoBtn");
  await one(
    "undo",
    "Split A. Which prime divides 18? Drag it onto 18, or tap both.",
  );
  for (let i = 0; i < 4; i += 1) {
    const shown = await page.evaluate(() => {
      const b = document.getElementById("stepBtn");
      return b && !b.hidden && b.offsetParent !== null;
    });
    if (shown) {
      break;
    }
    await clickIn(page, "#hintBtn");
    await sleep(80);
  }
  await sleep(120);
  await take();
  await clickIn(page, "#stepBtn");
  await one(
    "show one step",
    "18 ÷ 2 = 9. All primes now? No: 9 left. Split A.",
  );
  // 9 ÷ 3 leaves the prime 3, so the row closes itself and both divisions
  // are reported rather than letting the chart claim 1 is left.
  const p3 = await centerOf(page, '[data-prime="3"]');
  const quotA = await centerOf(page, '.rail[data-row="A"] .quot-circle');
  await mouseDrag(page, p3, { x: quotA.x, y: quotA.y });
  await one(
    "drag split closes the row",
    "9 ÷ 3 = 3. 3 ÷ 3 = 1. All primes now? Yes. Split B.",
  );
  for (const p of [2, 2]) {
    await clickPrime(page, p);
    await sleep(60);
  }
  await take();
  await clickPrime(page, 2);
  await one(
    "last split of B",
    "6 ÷ 2 = 3. 3 ÷ 3 = 1. All primes now? Yes. Any equal tiles left? Yes. Pair them.",
  );
  await clickIn(page, await tileSelector(page, "A", 2));
  await sleep(120);
  ok((await take()).length === 0, "selecting a tile is silent");
  await clickIn(page, await tileSelector(page, "A", 2));
  await sleep(120);
  ok((await take()).length === 0, "deselecting a tile is silent");
  await tapPair(page, 2);
  await one("tap pair", "Shared: 2. Any equal tiles left? Yes. Pair them.");
  const a3 = await centerOf(page, await tileSelector(page, "A", 3));
  const b3 = await centerOf(page, await tileSelector(page, "B", 3));
  await mouseDrag(page, a3, b3);
  await one(
    "drag pair",
    "Shared: 2 × 3. Any equal tiles left? No. Multiply the result tiles.",
  );
  await switchTo(page, "lcm", "guided");
  await sleep(120);
  await take();
  for (const p of [2, 2, 2]) {
    await clickPrime(page, p);
    await sleep(60);
  }
  await take();
  await tapPair(page, 2);
  await one(
    "LCM pair",
    "Shared: 2. Any equal tiles left? No. Add every leftover tile.",
  );
  await clickIn(page, await tileSelector(page, "B", 2));
  await one(
    "leftover with one pending",
    "Result: 2 × 2. Add every leftover tile.",
  );
  await page.close();
  // the demo announces once
  const tut = await newPage({ lang: "en", seen: false });
  await tut.waitForSelector("#introTitle");
  await tut.evaluate(() => {
    window.__live = [];
    const live = document.getElementById("live");
    new MutationObserver(() => {
      if (live.textContent) {
        window.__live.push(live.textContent);
      }
    }).observe(live, { childList: true, characterData: true, subtree: true });
  });
  await clickPrime(tut, 2);
  await sleep(150);
  const first = await tut.evaluate(() => {
    const l = window.__live.slice();
    window.__live = [];
    return l;
  });
  ok(
    first.length === 1 &&
      first[0] === "12 ÷ 2 = 6. All primes now? No: 6 left. Split A.",
    "tutorial: the child's split is announced once",
  );
  await tut.waitForFunction(
    () => document.querySelectorAll("#introLines p").length === 3,
    { timeout: 8000 },
  );
  await sleep(150);
  const demo = await tut.evaluate(() => window.__live.slice());
  ok(
    demo.length === 1 &&
      demo[0] ===
        "12 = 2 × 2 × 3. 18 = 2 × 3 × 3. All primes now? Yes. Any equal tiles left? Yes. Pair them.",
    "tutorial: the demo announces once (" + JSON.stringify(demo) + ")",
  );
  await tut.close();
  section("5. one announcement per committed action");
}

// ================= 6. tutorial demo lights the chart =================
{
  const page = await newPage({ lang: "en", seen: false });
  await page.waitForSelector("#introTitle");
  let s = await chartProbe(page);
  ok(
    s.current.join() === "splitA" && s.cueHidden,
    "tutorial scene 1: chart at splitA, stage cue hidden",
  );
  await clickPrime(page, 2);
  const seen = new Set();
  const stops = new Set();
  const t0 = Date.now();
  while (Date.now() - t0 < 8000) {
    const q = await page.evaluate(() => ({
      current: Array.from(
        document.querySelectorAll('[aria-current="step"]'),
      ).map((e) => e.getAttribute("data-node")),
      looping: Array.from(document.querySelectorAll(".node.looping")).map((e) =>
        e.getAttribute("data-node"),
      ),
      lines: document.querySelectorAll("#introLines p").length,
    }));
    q.current.forEach((c) => seen.add(c));
    q.looping.forEach((c) => stops.add(c));
    if (q.lines === 3) {
      break;
    }
    await sleep(60);
  }
  await sleep(150);
  ok(
    seen.size >= 3 &&
      seen.has("splitA") &&
      seen.has("splitB") &&
      seen.has("pair"),
    "demo lit at least three distinct current nodes: " +
      Array.from(seen).join(),
  );
  ok(
    stops.has("stopA") && stops.has("stopB"),
    "both stop diamonds looped during the demo",
  );
  await tapPair(page, 2);
  await tapPair(page, 3);
  await sleep(500);
  s = await chartProbe(page);
  const nextDisabled = await page.evaluate(
    () => document.getElementById("introNext").disabled,
  );
  ok(
    s.ariaCount === 0 && !nextDisabled && byId(s).multiply.st === "done",
    "scene 1 solved: multiply done, Next enabled",
  );
  await clickIn(page, "#introNext");
  await sleep(120);
  s = await chartProbe(page);
  ok(
    s.current.join() === "pair" &&
      byId(s).splitA.st === "given" &&
      byId(s).stopB.st === "given",
    "scene 2: split nodes Given, pair current",
  );
  await tapPair(page, 2);
  await sleep(100);
  s = await chartProbe(page);
  ok(
    s.current.join() === "leftovers" && byId(s).match.st === "done",
    "scene 2 after the pair: leftovers current, match done",
  );
  await page.close();
  section("6. tutorial walk");
}

// ================= 7. drag matrix regression =================
{
  const page = await newPage({ lang: "en", touch: true });
  const probe = () =>
    page.evaluate(() => ({
      paired: document.querySelectorAll(".rail .tile.paired").length / 2,
      selected: Array.from(
        document.querySelectorAll(".rail .tile.selected"),
      ).map((t) => t.closest(".rail").getAttribute("data-row") + t.textContent),
      tiles: Array.from(document.querySelectorAll(".rail .tile"))
        .map((t) => t.closest(".rail").getAttribute("data-row") + t.textContent)
        .join(" "),
      ghost: !!document.querySelector(".drag-ghost"),
      dragging: document.body.classList.contains("is-dragging"),
      targets: Array.from(document.querySelectorAll(".drop-target")).map(
        (e) =>
          e.getAttribute("data-shelf") || e.getAttribute("data-row") || "tile",
      ),
      feedback: document.getElementById("feedback").hidden
        ? ""
        : document.getElementById("feedback").textContent,
      left: Array.from(
        document.querySelectorAll('[data-shelf="leftovers"] .shelf-tile'),
      )
        .map((t) => t.textContent)
        .join("x"),
      pageScroll:
        document.documentElement.scrollHeight > window.innerHeight + 1,
    }));
  await clickIn(page, "#chooseGcd");
  await sleep(80);
  // prime drops
  const p5 = await centerOf(page, '[data-prime="5"]');
  const quotA = await centerOf(page, '.rail[data-row="A"] .quot-circle');
  const quotB = await centerOf(page, '.rail[data-row="B"] .quot-circle');
  await mouseDrag(
    page,
    p5,
    { x: quotA.x, y: quotA.y },
    {
      mid: async () => {
        const m = await probe();
        ok(
          m.ghost && m.dragging && m.targets.join() === "A",
          "prime drag: ghost and the active rail outlined",
        );
      },
    },
  );
  let s = await probe();
  ok(
    s.tiles === "" && s.feedback.startsWith("5 does not divide 18"),
    "5 dropped on the A circle: invalidPrime, no tile",
  );
  const p2 = await centerOf(page, '[data-prime="2"]');
  await mouseDrag(page, p2, { x: quotB.x, y: quotB.y });
  s = await probe();
  ok(s.tiles === "" && !s.ghost, "2 dropped on the inactive B circle cancels");
  await mouseDrag(page, p2, { x: quotA.x, y: quotA.y });
  s = await probe();
  ok(s.tiles === "A2", "2 dropped on the A circle splits 18");
  for (const p of [3, 2, 2, 2]) {
    await clickPrime(page, p);
  }
  // mouse pair, Shared drop, pen pair, Escape cancel, short touch
  let a2 = await centerOf(page, await tileSelector(page, "A", 2));
  let b2 = await centerOf(page, await tileSelector(page, "B", 2));
  await mouseDrag(page, a2, b2);
  s = await probe();
  ok(s.paired === 1, "mouse drag pairs the 2s");
  await clickIn(page, "#undoBtn");
  await sleep(80);
  b2 = await centerOf(page, await tileSelector(page, "B", 2));
  const shared = await centerOf(page, '[data-shelf="shared"]');
  await mouseDrag(page, b2, shared);
  s = await probe();
  ok(s.paired === 1, "B 2 dropped on Shared pairs with A 2");
  const a3 = await centerOf(page, await tileSelector(page, "A", 3));
  const b3 = await centerOf(page, await tileSelector(page, "B", 3));
  await penDrag(page, a3, b3);
  s = await probe();
  ok(s.paired === 2, "pen drag pairs the 3s (" + s.paired + ")");
  await clickIn(page, "#undoBtn");
  await sleep(80);
  await clickIn(page, "#undoBtn");
  await sleep(80);
  a2 = await centerOf(page, await tileSelector(page, "A", 2));
  await page.mouse.move(a2.x, a2.y);
  await page.mouse.down();
  for (let i = 1; i <= 4; i += 1) {
    await page.mouse.move(a2.x, a2.y - i * 10);
  }
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await sleep(300);
  s = await probe();
  ok(
    s.paired === 0 && !s.ghost && s.selected.length === 0,
    "Escape cancels a drag: nothing committed, no ghost, no selection",
  );
  const t = await page.touchscreen.touchStart(a2.x, a2.y);
  await t.move(a2.x + 3, a2.y + 2);
  await t.end();
  await sleep(200);
  s = await probe();
  ok(
    s.selected.length === 1 && !s.ghost,
    "sub-threshold touch acts as a tap (selects the tile)",
  );
  await page.keyboard.press("Escape");
  await sleep(50);
  // second pointer: pen press during an Escape-cancelled mouse drag
  const cdp = await page.createCDPSession();
  a2 = await centerOf(page, await tileSelector(page, "A", 2));
  const a3b = await centerOf(page, await tileSelector(page, "A", 3));
  await page.mouse.move(a2.x, a2.y);
  await page.mouse.down();
  for (let i = 1; i <= 4; i += 1) {
    await page.mouse.move(a2.x, a2.y - i * 10);
  }
  await page.keyboard.press("Escape");
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: a3b.x,
    y: a3b.y,
    button: "left",
    clickCount: 1,
    pointerType: "pen",
  });
  await page.mouse.up();
  await sleep(50);
  s = await probe();
  ok(
    s.paired === 0,
    "a pen press during a cancelled mouse drag commits nothing",
  );
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: a3b.x,
    y: a3b.y,
    button: "left",
    clickCount: 1,
    pointerType: "pen",
  });
  await sleep(300);
  s = await probe();
  ok(s.paired === 0 && !s.ghost, "the pen release afterwards commits nothing");
  await page.keyboard.press("Escape");
  await sleep(50);
  // active mouse drag survives a pen press and commits once
  a2 = await centerOf(page, await tileSelector(page, "A", 2));
  b2 = await centerOf(page, await tileSelector(page, "B", 2));
  await page.mouse.move(a2.x, a2.y);
  await page.mouse.down();
  for (let i = 1; i <= 3; i += 1) {
    await page.mouse.move(
      a2.x + ((b2.x - a2.x) * i) / 5,
      a2.y + ((b2.y - a2.y) * i) / 5,
    );
  }
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: a3b.x,
    y: a3b.y,
    button: "left",
    clickCount: 1,
    pointerType: "pen",
  });
  s = await probe();
  ok(
    s.ghost && s.dragging,
    "a pen press does not disturb the active mouse drag",
  );
  for (let i = 4; i <= 5; i += 1) {
    await page.mouse.move(
      a2.x + ((b2.x - a2.x) * i) / 5,
      a2.y + ((b2.y - a2.y) * i) / 5,
    );
  }
  await page.mouse.up();
  await sleep(50);
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: a3b.x,
    y: a3b.y,
    button: "left",
    clickCount: 1,
    pointerType: "pen",
  });
  await sleep(300);
  s = await probe();
  ok(
    s.paired === 1 && s.selected.length === 0,
    "the mouse drop commits exactly one pair",
  );
  await cdp.detach();
  // LCM leftover drop and no page scroll in the tallest state
  await switchTo(page, "lcm", "guided");
  for (const p of [2, 2, 2]) {
    await clickPrime(page, p);
  }
  await tapPair(page, 2);
  const lo = await centerOf(page, await tileSelector(page, "A", 3));
  const leftShelf = await centerOf(page, '[data-shelf="leftovers"]');
  await mouseDrag(page, lo, leftShelf);
  s = await probe();
  ok(s.left === "3", "A 3 dropped on Left over is added once (" + s.left + ")");
  await addLeftovers(page);
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  s = await probe();
  ok(!s.pageScroll, "no page scroll in the LCM result at 1280x800");
  await page.close();
  section("7. drag matrix regression");
}

// ================= 8. Your numbers: picker, board, return =================
for (const lang of ["en", "pl"]) {
  const page = await newPage({ lang });
  await clickIn(page, "#chooseLcm");
  await sleep(80);
  await openMore(page);
  const seg = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".seg-btn")).map((b) => ({
      id: b.id,
      h: b.getBoundingClientRect().height,
      fits: b.scrollWidth <= b.clientWidth + 1,
      text: b.textContent.trim(),
    })),
  );
  ok(
    seg.length === 3 &&
      seg[2].id === "expCustom" &&
      seg.every((b) => b.h >= 48 && b.fits),
    lang +
      ": three experience buttons, each >= 48px and unwrapped: " +
      JSON.stringify(seg.map((b) => b.text)),
  );
  await clickIn(page, "#expCustom");
  await sleep(80);
  const pick = () =>
    page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll(".pick-btn"));
      const sizes = btns.map((b) => {
        const r = b.getBoundingClientRect();
        return [r.width, r.height, parseFloat(getComputedStyle(b).fontSize)];
      });
      const start = document.getElementById("pickStart");
      const note = document.querySelector(".pick-note");
      return {
        heading: document.getElementById("taskText").textContent,
        cue: document.getElementById("stageCue").textContent,
        count: btns.length,
        minH: Math.min(...sizes.map((x) => x[1])),
        minW: Math.min(...sizes.map((x) => x[0])),
        minFont: Math.min(...sizes.map((x) => x[2])),
        disabledB: btns.filter((b) => b.dataset.pick[0] === "b" && b.disabled)
          .length,
        disabledA: btns.filter((b) => b.dataset.pick[0] === "a" && b.disabled)
          .length,
        pressed: btns
          .filter((b) => b.getAttribute("aria-pressed") === "true")
          .map((b) => b.dataset.pick),
        startDisabled: !start || start.disabled,
        startText: start ? start.textContent : "",
        noteFont: note ? parseFloat(getComputedStyle(note).fontSize) : 0,
        progressHidden: document.getElementById("progressText").hidden,
        chartHidden: document.getElementById("chart").hidden,
        active: document.activeElement && document.activeElement.id,
        pageScroll:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      };
    });
  let s = await pick();
  const prompt =
    lang === "en"
      ? "Pick two numbers: A and B."
      : "Wybierz dwie liczby: A i B.";
  ok(
    s.heading === prompt && s.cue === prompt && s.chartHidden,
    lang + ": picker shows the prompt as heading and 28px cue, chart hidden",
  );
  ok(
    s.count === 42 && s.minH >= 48 && s.minW >= 44 && s.minFont >= 18,
    lang +
      ": 42 number buttons, >= 48px tall, >= 18px text (" +
      [s.count, s.minH, s.minW, s.minFont].join("/") +
      ")",
  );
  ok(
    s.startDisabled &&
      s.disabledA === 0 &&
      s.disabledB === 0 &&
      s.progressHidden,
    lang +
      ": nothing picked yet: Start disabled, no button greyed, no progress count",
  );
  ok(s.noteFont >= 15, lang + ": note text >= 15px (" + s.noteFont + ")");
  ok(s.active === "taskText", lang + ": focus on the heading after the switch");
  // Tab from the heading reaches the first number button
  await page.keyboard.press("Tab");
  const afterTab = await page.evaluate(
    () => document.activeElement.dataset.pick || document.activeElement.id,
  );
  ok(
    afterTab === "a2",
    lang + ": Tab from the heading reaches Number A 2 (" + afterTab + ")",
  );
  await clickIn(page, '[data-pick="a12"]');
  await sleep(60);
  s = await pick();
  ok(
    s.pressed.join() === "a12" &&
      s.disabledB === 7 &&
      s.disabledA === 0 &&
      s.startDisabled,
    lang + ": A=12 greys seven B values for LCM (" + s.disabledB + " greyed)",
  );
  const greyed = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".pick-btn"))
      .filter((b) => b.disabled)
      .map((b) => b.dataset.pick)
      .join(),
  );
  ok(
    greyed === "b5,b7,b14,b21,b25,b27,b28",
    lang + ": the greyed B values would not fit the picture (" + greyed + ")",
  );
  ok(
    (await page.evaluate(() => document.activeElement.dataset.pick)) === "a12",
    lang + ": focus stays on the pressed number",
  );
  // pressing again releases the pick
  await clickIn(page, '[data-pick="a12"]');
  await sleep(60);
  s = await pick();
  ok(
    s.pressed.length === 0 && s.disabledB === 0,
    lang + ": pressing again releases A",
  );
  await clickIn(page, '[data-pick="a12"]');
  await sleep(60);
  await clickIn(page, '[data-pick="b18"]');
  await sleep(60);
  s = await pick();
  ok(
    s.pressed.join() === "a12,b18" && !s.startDisabled && s.disabledA === 11,
    lang +
      ": A=12 B=18 picked, Start enabled, B=18 greys eleven A values (" +
      s.disabledA +
      ")",
  );
  await clickIn(page, "#pickStart");
  await sleep(120);
  const board = await page.evaluate(() => ({
    heading: document.getElementById("taskText").textContent,
    primes: document.querySelectorAll(".prime-btn").length,
    cue: document.querySelectorAll(".prime-btn.cue").length,
    progressHidden: document.getElementById("progressText").hidden,
    chartHidden: document.getElementById("chart").hidden,
    current: document.querySelectorAll('[aria-current="step"]').length,
    active: document.activeElement.dataset.prime,
  }));
  ok(
    board.heading ===
      (lang === "en"
        ? "Find the LCM of 12 and 18."
        : "Znajdź NWW liczb 12 i 18.") &&
      board.primes === 4 &&
      board.cue === 0 &&
      board.progressHidden &&
      !board.chartHidden &&
      board.current === 1 &&
      board.active === "2",
    lang +
      ": Start opens a Guided-style LCM 12,18 board with the chart, no cue glow, focus on 2",
  );
  for (const p of [2, 2, 2, 3]) {
    await clickPrime(page, p);
  }
  await tapPair(page, 2);
  await tapPair(page, 3);
  await addLeftovers(page);
  const before = await chartProbe(page);
  ok(
    before.proofCount === 0 && before.product.endsWith(" = ?"),
    lang + ": custom assemble explains nothing, answer still ?",
  );
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  const done = await page.evaluate(() => ({
    primary: document.getElementById("primaryBtn").textContent,
    product: document.querySelector(".product").textContent,
    proof: !!document.querySelector(".proof"),
    active: document.activeElement.id,
  }));
  ok(
    done.primary ===
      (lang === "en" ? "Pick new numbers" : "Wybierz nowe liczby") &&
      done.product.endsWith("= 36") &&
      done.proof &&
      done.active === "primaryBtn",
    lang +
      ": result 36 with proof, primary reads Pick new numbers (" +
      done.primary +
      ")",
  );
  await clickIn(page, "#primaryBtn");
  await sleep(120);
  s = await pick();
  ok(
    s.heading === prompt &&
      s.pressed.join() === "a12,b18" &&
      !s.startDisabled &&
      s.active === "taskText",
    lang + ": back on the picker with 12 and 18 still picked and Start enabled",
  );
  // the other experiences are untouched
  await openMore(page);
  await clickIn(page, "#expChallenge");
  await sleep(80);
  const progressOf = () =>
    page.evaluate(() => ({
      hidden: document.getElementById("progressText").hidden,
      text: document.getElementById("progressText").textContent,
      heading: document.getElementById("taskText").textContent,
    }));
  let ch = await progressOf();
  ok(
    !ch.hidden &&
      /\d+/.test(ch.heading) &&
      ch.text === (lang === "en" ? "0 / 5 completed" : "Ukończono 0 z 5"),
    lang +
      ": Challenge after Your numbers shows its own task and 0 / 5 (" +
      ch.text +
      ")",
  );
  await openMore(page);
  await clickIn(page, "#expGuided");
  await sleep(80);
  ch = await progressOf();
  ok(
    !ch.hidden &&
      ch.text === (lang === "en" ? "0 / 8 completed" : "Ukończono 0 z 8"),
    lang + ": Guided count untouched by the custom board (" + ch.text + ")",
  );
  await openMore(page);
  await clickIn(page, "#expCustom");
  await sleep(80);
  s = await pick();
  ok(
    s.heading === prompt && s.pressed.join() === "a12,b18",
    lang + ": the picker keeps its picks across a switch",
  );
  // a second Start replays the same pair
  await clickIn(page, "#pickStart");
  await sleep(120);
  const second = await page.evaluate(() => ({
    heading: document.getElementById("taskText").textContent,
    primes: document.querySelectorAll(".prime-btn").length,
    picks: document.querySelectorAll(".pick-btn").length,
  }));
  ok(
    second.heading ===
      (lang === "en"
        ? "Find the LCM of 12 and 18."
        : "Znajdź NWW liczb 12 i 18.") &&
      second.primes === 4 &&
      second.picks === 0,
    lang + ": a second Start opens a fresh 12,18 board",
  );
  // the choice screen is picker-free and the parked board resumes
  await openMore(page);
  await clickIn(page, "#switchAlgBtn");
  await sleep(80);
  const choice = await page.evaluate(() => ({
    picks: document.querySelectorAll(".pick-btn").length,
    cards: document.querySelectorAll(".stage-card").length,
  }));
  ok(
    choice.picks === 0 && choice.cards === 2,
    lang + ": the choice screen shows the two cards and no picker",
  );
  await clickIn(page, "#chooseLcm");
  await sleep(80);
  await openMore(page);
  await clickIn(page, "#expCustom");
  await sleep(80);
  const resumed = await page.evaluate(() => ({
    heading: document.getElementById("taskText").textContent,
    primes: document.querySelectorAll(".prime-btn").length,
  }));
  ok(
    /12/.test(resumed.heading) && resumed.primes === 4,
    lang + ": the parked custom board resumes after the algorithm choice",
  );
  await page.close();
}
{
  const page = await newPage({
    lang: "en",
    width: 360,
    height: 740,
    mobile: true,
    touch: true,
  });
  await page.evaluate(() => document.getElementById("chooseGcd").click());
  await sleep(80);
  await page.evaluate(() => document.getElementById("moreBtn").click());
  await sleep(50);
  await page.evaluate(() => document.getElementById("expCustom").click());
  await sleep(80);
  const m = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll(".pick-btn"));
    const rects = btns.map((b) => b.getBoundingClientRect());
    return {
      count: btns.length,
      overflow: document.documentElement.scrollWidth > 360,
      maxRight: Math.max(...rects.map((r) => r.right)),
      minH: Math.min(...rects.map((r) => r.height)),
      startRight: document.getElementById("pickStart").getBoundingClientRect()
        .right,
    };
  });
  ok(
    m.count === 42 &&
      !m.overflow &&
      m.maxRight <= 360 &&
      m.minH >= 48 &&
      m.startRight <= 360,
    "360px: picker wraps without horizontal overflow (" + m.maxRight + ")",
  );
  await page.evaluate(() =>
    document.querySelector('[data-pick="a25"]').click(),
  );
  await sleep(60);
  const g = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".pick-btn"))
      .filter((b) => b.disabled)
      .map((b) => b.dataset.pick)
      .join(),
  );
  ok(
    g === "b2,b3,b4,b6,b7,b8,b9,b12,b14,b16,b18,b21,b24,b27,b28",
    "GCD A=25 leaves only multiples of 5 (" + g + ")",
  );
  await page.close();
  section("8. Your numbers: picker, board, return");
}

// ================= 9. choice screen: the cards are the buttons =================
for (const lang of ["en", "pl"]) {
  const page = await newPage({ lang });
  const c = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".stage-card"));
    const title = (card) => card.querySelector(".stage-card-title");
    return {
      count: cards.length,
      tags: cards.map((x) => x.tagName),
      ids: cards.map((x) => x.id),
      cursor: cards.map((x) => getComputedStyle(x).cursor),
      titleFont: cards.map((x) =>
        parseFloat(getComputedStyle(title(x)).fontSize),
      ),
      titles: cards.map((x) => title(x).textContent),
      described: cards.map(
        (x) => !!document.getElementById(x.getAttribute("aria-describedby")),
      ),
      minH: Math.min(...cards.map((x) => x.getBoundingClientRect().height)),
      cueHidden: document.getElementById("stageCue").hidden,
      panelButtons: document.querySelectorAll("#choiceButtons, .choice-btn")
        .length,
      heading: document.getElementById("introTitle").textContent,
      prompts: Array.from(document.querySelectorAll("h2, .stage-cue"))
        .filter((x) => !x.hidden && x.getClientRects().length > 0)
        .map((x) => x.textContent.trim()),
    };
  });
  const learn =
    lang === "en" ? ["Learn GCD", "Learn LCM"] : ["Ucz się NWD", "Ucz się NWW"];
  ok(
    c.count === 2 &&
      c.tags.join() === "BUTTON,BUTTON" &&
      c.ids.join() === "chooseGcd,chooseLcm" &&
      c.cursor.every((x) => x === "pointer") &&
      c.described.every(Boolean),
    lang + ": the two stage cards are the algorithm buttons with descriptions",
  );
  ok(
    c.titles.join() === learn.join() &&
      c.titleFont.every((f) => f >= 18) &&
      c.minH >= 48,
    lang +
      ": card labels read Learn GCD / Learn LCM at >= 18px (" +
      c.titles.join(" | ") +
      ")",
  );
  ok(
    c.cueHidden && c.panelButtons === 0 && c.prompts.length === 1,
    lang +
      ": the prompt appears once, no panel duplicates (" +
      c.prompts.join(" | ") +
      ")",
  );
  // Tab order: heading → GCD card → LCM card → Replay tutorial
  await page.focus("#introTitle");
  const order = [];
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press("Tab");
    order.push(await page.evaluate(() => document.activeElement.id));
  }
  ok(
    order.join() === "chooseGcd,chooseLcm,introReplay",
    lang +
      ": Tab from the heading reaches GCD card, LCM card, Replay tutorial (" +
      order.join() +
      ")",
  );
  // Enter on the focused card starts Guided
  await page.focus("#chooseLcm");
  await page.keyboard.press("Enter");
  await sleep(120);
  const opened = await page.evaluate(() => ({
    heading: document.getElementById("taskText").textContent,
    active: document.activeElement.dataset.prime,
  }));
  ok(
    /6/.test(opened.heading) &&
      /8/.test(opened.heading) &&
      opened.active === "2",
    lang + ": Enter on the LCM card opens Guided 6,8 with focus on 2",
  );
  // Switch algorithm returns to the same screen
  await openMore(page);
  await clickIn(page, "#switchAlgBtn");
  await sleep(80);
  const back = await page.evaluate(() => ({
    cards: document.querySelectorAll("button.stage-card").length,
    cueHidden: document.getElementById("stageCue").hidden,
    active: document.activeElement.id,
  }));
  ok(
    back.cards === 2 && back.cueHidden && back.active === "introTitle",
    lang +
      ": Switch algorithm returns to the card buttons with focus on the heading",
  );
  await page.close();
}
section("9. choice screen: the cards are the buttons");

// ================= 10. the count is visible and a correct answer is acknowledged =================
for (const lang of ["en", "pl"]) {
  const page = await newPage({ lang });
  await clickIn(page, "#chooseGcd");
  await sleep(100);
  const readPanel = () =>
    page.evaluate(() => {
      const p = document.getElementById("progressText");
      const fb = document.getElementById("feedback");
      const more = document.getElementById("moreBody");
      const multiply = document.querySelector('[data-node="multiply"]');
      return {
        hidden: p.hidden,
        text: p.textContent,
        inMore: more.contains(p),
        inTask: document.getElementById("taskSection").contains(p),
        visible: p.getClientRects().length > 0,
        font: parseFloat(getComputedStyle(p).fontSize),
        moreClosed: more.hidden,
        fbHidden: fb.hidden,
        fbText: fb.textContent,
        fbSuccess: fb.classList.contains("success"),
        multiply: multiply ? multiply.textContent : "",
      };
    });
  let p = await readPanel();
  const done0 = lang === "en" ? "0 / 8 completed" : "Ukończono 0 z 8";
  const done1 = lang === "en" ? "1 / 8 completed" : "Ukończono 1 z 8";
  ok(
    !p.hidden &&
      p.visible &&
      p.inTask &&
      !p.inMore &&
      p.moreClosed &&
      p.text === done0,
    lang +
      ": the count is visible with the task, not inside More (" +
      p.text +
      ")",
  );
  ok(p.font >= 13, lang + ": count text >= 13px (" + p.font + ")");
  ok(
    p.multiply.indexOf(lang === "en" ? "shelf" : "półki") < 0 &&
      p.multiply.indexOf(lang === "en" ? "result tiles" : "wyniku") >= 0,
    lang +
      ": the multiply node names the result tiles, not a shelf (" +
      p.multiply.trim() +
      ")",
  );
  for (const n of [2, 3, 2, 2, 2]) {
    await clickPrime(page, n);
  }
  await tapPair(page, 2);
  await tapPair(page, 3);
  p = await readPanel();
  ok(
    p.text === done0 && p.fbHidden,
    lang +
      ": nothing counted and nothing announced before the check (" +
      p.text +
      ")",
  );
  await clickIn(page, "#primaryBtn");
  await sleep(400);
  p = await readPanel();
  const solved = lang === "en" ? "Pair solved." : "Zadanie rozwiązane.";
  ok(
    p.text === done1,
    lang +
      ": the count ticks on the correct check, before Next pair (" +
      p.text +
      ")",
  );
  ok(
    !p.fbHidden && p.fbSuccess && p.fbText === solved,
    lang + ": a correct pair is acknowledged in the panel (" + p.fbText + ")",
  );
  await clickIn(page, "#primaryBtn");
  await sleep(150);
  p = await readPanel();
  ok(
    p.text === done1 && p.fbHidden,
    lang +
      ": Next pair does not count it twice and clears the line (" +
      p.text +
      ")",
  );
  // Start this pair again takes the point back
  await clickIn(page, "#primaryBtn").catch(() => {});
  await openMore(page);
  await clickIn(page, "#resetBtn");
  await sleep(120);
  p = await readPanel();
  ok(
    p.text === done1,
    lang +
      ": starting an unsolved pair again leaves the count alone (" +
      p.text +
      ")",
  );
  // the summary states the count itself, so the line is hidden there
  await page.evaluate(() => {
    document.getElementById("moreBody").hidden = true;
  });
  await page.close();
}
section("10. visible count and a correct-answer acknowledgement");

// ================= 11. a refused action flashes where the child touched =================
for (const reduced of [false, true]) {
  const tag = reduced ? "reduced motion" : "normal motion";
  const page = await newPage({ lang: "en", reducedMotion: reduced });
  await clickIn(page, "#chooseGcd");
  await sleep(120);
  const wrong = () =>
    page.evaluate(() => {
      const n = document.querySelector(".is-wrong");
      if (!n) {
        return { none: true };
      }
      const cs = getComputedStyle(n);
      return {
        none: false,
        tag: n.tagName,
        which:
          n.dataset.prime ||
          n.dataset.tileId ||
          n.dataset.choice ||
          n.getAttribute("data-row") ||
          n.id ||
          n.className,
        ring: cs.boxShadow,
        animated: document.getAnimations().length > 0,
      };
    });
  // a prime that does not divide the active row
  await clickPrime(page, 5);
  await sleep(200);
  let w = await wrong();
  const fbShown = await page.evaluate(
    () => !document.getElementById("feedback").hidden,
  );
  ok(
    !w.none && w.which === "5" && w.ring.indexOf("211, 47, 47") >= 0,
    tag +
      ": a prime that does not divide flashes the button the child pressed (" +
      JSON.stringify(w) +
      ")",
  );
  ok(fbShown, tag + ": the panel still carries the sentence");
  ok(
    reduced ? !w.animated : w.animated,
    tag + ": the shake runs only when motion is allowed (" + w.animated + ")",
  );
  await sleep(750);
  ok((await wrong()).none, tag + ": the flash clears itself");
  // a prime dropped on the inactive rail
  const railB = await centerOf(page, '.rail[data-row="B"] .quot-circle');
  const prime2 = await centerOf(page, '[data-prime="2"]');
  await mouseDrag(page, prime2, railB);
  await sleep(60);
  w = await wrong();
  ok(
    !w.none && w.which === "B",
    tag +
      ": a drop the inactive circle refuses flashes it (" +
      JSON.stringify(w) +
      ")",
  );
  await sleep(750);
  // a mismatched pair
  for (const n of [2, 3, 2, 2, 2]) {
    await clickPrime(page, n);
  }
  const a3 = await tileSelector(page, "A", 3);
  const b2 = await tileSelector(page, "B", 2);
  await clickIn(page, a3);
  await sleep(60);
  await clickIn(page, b2);
  await sleep(80);
  w = await wrong();
  ok(
    !w.none && w.tag === "BUTTON",
    tag + ": a mismatched pair flashes the tile (" + JSON.stringify(w) + ")",
  );
  await sleep(750);
  // a check the shelf is not ready for
  await clickIn(page, "#primaryBtn");
  await sleep(80);
  w = await wrong();
  ok(
    !w.none && w.which === "primaryBtn",
    tag +
      ": an early check flashes the button pressed (" +
      JSON.stringify(w) +
      ")",
  );
  await sleep(750);
  ok((await wrong()).none, tag + ": no flash is left behind");
  await page.close();
}
section("11. a refused action flashes where the child touched");

// ================= 12. board chrome: circles, borders, contrast =================
{
  const page = await newPage({ lang: "en" });
  await clickIn(page, "#chooseLcm");
  await sleep(120);
  const chrome = () =>
    page.evaluate(() => {
      const box = (sel) => {
        const n = document.querySelector(sel);
        if (!n) {
          return null;
        }
        const r = n.getBoundingClientRect();
        const cs = getComputedStyle(n);
        return {
          w: r.width,
          h: r.height,
          radius: cs.borderRadius,
          fill: cs.backgroundColor,
          ink: cs.color,
          font: parseFloat(cs.fontSize),
          borderW: parseFloat(cs.borderTopWidth),
          borderStyle: cs.borderTopStyle,
          borderColor: cs.borderTopColor,
        };
      };
      return {
        ball: box('.rail[data-row="A"] .num-ball'),
        unsplit: box('.rail[data-row="A"] .quot-circle'),
        ballB: box('.rail[data-row="B"] .num-ball'),
        prime: box(".rail .tile:not(.paired):not(.added)"),
        paired: box(".rail .tile.paired"),
        added: box(".rail .tile.added"),
        rail: box(".rail"),
        shelf: box('[data-shelf="shared"]'),
        lines: document.querySelectorAll(".pair-line").length,
      };
    });
  const isCircle = (b) =>
    b &&
    (b.radius.indexOf("%") >= 0
      ? parseFloat(b.radius) >= 50
      : parseFloat(b.radius) >= b.w / 2 - 1);
  // a fresh row already shows its amber circle
  let c = await chrome();
  ok(
    c.ball && c.unsplit && c.unsplit.w >= 44,
    "a fresh row shows the ball and the amber circle (" +
      (c.unsplit ? c.unsplit.w : "none") +
      ")",
  );
  ok(
    isCircle(c.ball) && c.ball.w >= 56 && c.ball.font >= 24,
    "the number ball is a circle of >= 56px with a >= 24px digit (" +
      c.ball.w +
      "/" +
      c.ball.font +
      ")",
  );
  ok(
    ratioOf(c.ball.ink, c.ball.fill) >= 4.5 &&
      ratioOf(c.ballB.ink, c.ballB.fill) >= 4.5,
    "both balls clear 4.5:1 (" +
      ratioOf(c.ball.ink, c.ball.fill).toFixed(2) +
      " / " +
      ratioOf(c.ballB.ink, c.ballB.fill).toFixed(2) +
      ")",
  );
  ok(
    c.rail.borderW >= 1 && c.rail.borderStyle !== "none",
    "the rail carries a visible border (" + c.rail.borderW + "px)",
  );
  ok(
    c.rail.fill === "rgba(0, 0, 0, 0)",
    "the rail stays transparent so pair connectors show through (" +
      c.rail.fill +
      ")",
  );
  // split to the end: every tile is now an unpaired prime circle
  for (const n of [2, 2, 2]) {
    await clickPrime(page, n);
  }
  const split = await chrome();
  // then pair and add, which gives the other two states
  await tapPair(page, 2);
  await addLeftovers(page);
  c = await chrome();
  const states = [
    ["prime", split.prime],
    ["paired", c.paired],
    ["added", c.added],
  ];
  ok(
    states.every(([, b]) => b && isCircle(b) && b.w >= 44),
    "every factor circle is a circle of >= 44px: " +
      JSON.stringify(states.map(([k, b]) => k + " " + (b ? b.w : "none"))),
  );
  const ratios = {};
  states.forEach(([k, b]) => {
    ratios[k] = Number(ratioOf(b.ink, b.fill).toFixed(2));
  });
  ok(
    Object.values(ratios).every((v) => v >= 4.5),
    "prime, paired and added digits clear 4.5:1: " + JSON.stringify(ratios),
  );
  // Four meanings, four hues. Paired and added deliberately share the blue
  // and are told apart by outline versus fill, so that pair is checked, not
  // counted as a clash. The values are printed so the palette can be judged.
  const hues = {
    numberA: c.ball.fill,
    numberB: c.ballB.fill,
    prime: split.prime.borderColor,
    shared: c.paired.borderColor,
  };
  ok(
    new Set(Object.values(hues)).size === 4 &&
      c.added.fill === c.paired.borderColor &&
      c.paired.fill !== c.added.fill,
    "four distinct board colours, paired and added sharing one as outline and fill: " +
      JSON.stringify(hues),
  );
  ok(
    c.shelf.borderW >= 1 && c.shelf.borderStyle !== "none",
    "the shelf carries a visible border",
  );
  ok(c.lines >= 1, "a pair connector is drawn between the rails");
  // Every chart block keeps an edge against its own fill, finished ones too.
  const edges = await page.evaluate(() => {
    const seen = {};
    document.querySelectorAll(".node").forEach((n) => {
      const st = n.className.split(" ")[2];
      const hex = n.querySelector(".hex-outer");
      const cs = getComputedStyle(hex || n);
      const edge = hex ? cs.backgroundColor : cs.borderTopColor;
      const fill = getComputedStyle(
        n.querySelector(".hex-inner") || n,
      ).backgroundColor;
      const canvas = getComputedStyle(
        document.getElementById("stage"),
      ).backgroundColor;
      // A block reads as a block if its edge differs from its fill, or if the
      // fill itself stands off the stage: the current node is solid on purpose.
      seen[st] = { edge, fill, ok: edge !== fill || fill !== canvas };
    });
    return seen;
  });
  ok(
    Object.keys(edges).length >= 2 && Object.values(edges).every((v) => v.ok),
    "every chart block reads as a block: " + JSON.stringify(edges),
  );
  const stack = await page.evaluate(() => {
    const z = (sel) =>
      Number(getComputedStyle(document.querySelector(sel)).zIndex);
    return { line: z(".connectors"), rail: z(".rail"), shelf: z(".shelf") };
  });
  ok(
    stack.line > stack.rail && stack.line > stack.shelf,
    "pair lines paint above the rails, so they cross the circle borders (" +
      JSON.stringify(stack) +
      ")",
  );
  await page.close();
}
// the widened line must not overflow the narrow viewports
for (const [w, h, tag] of [
  [360, 740, "360x740"],
  [640, 400, "640x400 (200% zoom)"],
]) {
  const page = await newPage({ lang: "pl", width: w, height: h });
  await clickIn(page, "#chooseLcm");
  await sleep(120);
  for (const n of [2, 2, 2]) {
    await clickPrime(page, n);
  }
  await tapPair(page, 2);
  await addLeftovers(page);
  const m = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    railRight: Math.max(
      ...Array.from(document.querySelectorAll(".rail")).map(
        (r) => r.getBoundingClientRect().right,
      ),
    ),
  }));
  ok(
    m.sw <= w && m.railRight <= w,
    tag + ": the number line wraps without horizontal overflow (" + m.sw + ")",
  );
  await page.close();
}
// the numbers hold their place through every message of a working phase
for (const lang of ["en", "pl"]) {
  const page = await newPage({ lang });
  await clickIn(page, "#chooseLcm");
  await sleep(140);
  const benchTop = () =>
    page.evaluate(() =>
      Math.round(
        document.getElementById("workbench").getBoundingClientRect().top,
      ),
    );
  const tops = [await benchTop()];
  for (const n of [2, 2, 2]) {
    await clickPrime(page, n);
    tops.push(await benchTop());
  }
  await tapPair(page, 2);
  tops.push(await benchTop());
  await addLeftovers(page);
  tops.push(await benchTop());
  ok(
    new Set(tops).size === 1,
    lang +
      ": the numbers stay anchored as the message changes (" +
      tops.join(",") +
      ")",
  );
  await page.close();
}
section("12. board chrome: circles, borders, contrast");

// ---- 13. splitting is a gesture, and it shows its outcome first ----
{
  const page = await newPage({ lang: "en" });
  await clickIn(page, "#chooseGcd");
  await sleep(140);
  const readRow = () =>
    page.evaluate(() => {
      const rail = document.querySelector('.rail[data-row="A"]');
      return {
        eq: rail.querySelector(".rail-eq").textContent.replace(/\s+/g, " ").trim(),
        tiles: rail.querySelectorAll(".tile").length,
        selected: document.querySelectorAll(".prime-btn.selected").length,
      };
    });
  const before = await readRow();
  await clickIn(page, '[data-prime="2"]');
  await sleep(80);
  const picked = await readRow();
  ok(
    picked.eq === before.eq && picked.tiles === before.tiles,
    "picking a prime commits nothing on its own (" + picked.eq + ")",
  );
  ok(picked.selected === 1, "the picked prime shows as picked");
  await clickIn(page, '[data-prime="2"]');
  await sleep(80);
  ok(
    (await readRow()).selected === 0,
    "picking the same prime again drops the pick",
  );
  await clickIn(page, '[data-prime="2"]');
  await sleep(80);
  await clickIn(page, "button.quot-circle");
  await sleep(120);
  const done = await readRow();
  ok(
    done.tiles === before.tiles + 1 && done.selected === 0,
    "touching the number is what splits it (" + done.eq + ")",
  );
  await page.close();
}
for (const lang of ["en", "pl"]) {
  const page = await newPage({ lang });
  await clickIn(page, "#chooseGcd");
  await sleep(140);
  const p3 = await centerOf(page, '[data-prime="3"]');
  const quotA = await centerOf(page, '.rail[data-row="A"] .quot-circle');
  const quotB = await centerOf(page, '.rail[data-row="B"] .quot-circle');
  const probe = () =>
    page.evaluate(() => {
      const rail = document.querySelector('.rail[data-row="A"]');
      const circles = Array.from(rail.querySelectorAll(".quot-circle"));
      const ghost = circles.filter((c) => c.classList.contains("preview"));
      return {
        text: circles.map((c) => c.textContent),
        faded: ghost.every((c) => Number(getComputedStyle(c).opacity) < 0.7),
        ghosts: ghost.length,
        tiles: rail.querySelectorAll(".tile").length,
        eq: rail.querySelector(".rail-eq").textContent.replace(/\s+/g, " ").trim(),
      };
    });
  const held = await holdOver(page, p3, quotA, probe);
  ok(
    held && held.ghosts === 2 && held.text.join(",") === "3,6",
    lang + ": holding 3 over 18 previews 3 and 6 (" + JSON.stringify(held) + ")",
  );
  ok(held && held.faded, lang + ": the preview is faded, not committed work");
  ok(
    held && held.tiles === 0,
    lang + ": no tile is issued while the prime is only held over the number",
  );
  const after = await probe();
  ok(
    after.ghosts === 0 && after.tiles === 1,
    lang + ": the drop replaces the preview with the real split (" + after.eq + ")",
  );
  // A prime held over the number it cannot divide, and over the other row,
  // must promise nothing.
  const p2 = await centerOf(page, '[data-prime="2"]');
  const wrong = await holdOver(page, p2, quotB, probe);
  ok(
    wrong && wrong.ghosts === 0,
    lang + ": the other row shows no preview (" + JSON.stringify(wrong) + ")",
  );
  await page.close();
}
section("13. splitting by gesture, with the outcome previewed");

ok(
  pageErrors.length === 0,
  "no console or page errors: " + pageErrors.join(" | "),
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
