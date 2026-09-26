#!/usr/bin/env node
/*
 * jsdom DOM/behavior check for moment/index.html (Moment Lab).
 *
 * Boots the shipped single file in jsdom with a mocked clock, rAF queue,
 * matchMedia, and canvas rects, then drives every surface through the
 * public DOM plus the debug-only window.__momentTest API. Coverage follows
 * spec section 19.2: first/repeat/broken-storage visits, all nine Guide
 * steps in EN and PL, the complete I18N manifest, section 7.4 transitions
 * and focus, Explore/Balance/Predict interaction contracts, the shared
 * reveal, formatting, and full sessions.
 *
 * Run from learn/: npm run moment-dom-check
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(
  path.join(here, "..", "moment", "index.html"),
  "utf8",
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
function eq(actual, expected, msg) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(
      "FAIL: " +
        msg +
        " (got " +
        JSON.stringify(actual) +
        ", want " +
        JSON.stringify(expected) +
        ")",
    );
  }
}

/* ============================ boot factory ============================ */

function boot({
  query = "?debug=1&seed=42",
  introSeen = true,
  lang = "en-US",
  breakStorage = false,
  reducedMotion = false,
} = {}) {
  const consoleErrors = [];
  const vc = new VirtualConsole();
  vc.on("error", (msg) => consoleErrors.push(String(msg)));
  vc.on("jsdomError", () => {});
  const mediaListeners = [];
  const mediaState = { reduce: reducedMotion, narrow: false };
  const dom = new JSDOM(HTML, {
    url: "https://lepecki.com/learn/moment/" + query,
    runScripts: "dangerously",
    virtualConsole: vc,
    beforeParse(window) {
      window.__now = 0;
      window.performance.now = () => window.__now;
      let rafSeq = 0;
      const rafCbs = new Map();
      window.requestAnimationFrame = (cb) => {
        rafSeq += 1;
        rafCbs.set(rafSeq, cb);
        return rafSeq;
      };
      window.cancelAnimationFrame = (id) => {
        rafCbs.delete(id);
      };
      window.__step = (ms) => {
        window.__now += ms;
        const pending = [...rafCbs.values()];
        rafCbs.clear();
        pending.forEach((cb) => cb(window.__now));
      };
      window.matchMedia = (q) => ({
        get matches() {
          return q.indexOf("reduced-motion") !== -1
            ? mediaState.reduce
            : mediaState.narrow;
        },
        media: q,
        addEventListener(type, fn) {
          mediaListeners.push({ media: q, fn });
        },
        removeEventListener() {},
      });
      window.HTMLCanvasElement.prototype.getContext = () => null;
      Object.defineProperty(window.navigator, "language", { get: () => lang });
      try {
        if (introSeen) {
          window.localStorage.setItem("momentIntroSeenV1", "1");
        } else {
          window.localStorage.clear();
        }
      } catch {
        /* ignore */
      }
      if (breakStorage) {
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() {
            throw new Error("storage blocked");
          },
        });
      }
    },
  });
  const w = dom.window;
  const t = {
    dom,
    w,
    d: w.document,
    consoleErrors,
    mediaState,
    mediaListeners,
    dbg: () => w.__momentTest,
    el: (id) => w.document.getElementById(id),
    step: (ms) => w.__step(ms),
    settle: () => {
      for (let i = 0; i < 60; i += 1) {
        w.__step(100);
      }
    },
    active: () => w.document.activeElement,
  };
  return t;
}

function stubBoardRect(t, width, height) {
  const rect = {
    left: 0,
    top: 0,
    x: 0,
    y: 0,
    width,
    height,
    right: width,
    bottom: height,
  };
  t.el("board").getBoundingClientRect = () => rect;
  t.el("canvasWrap").getBoundingClientRect = () => rect;
  t.dbg().resize();
}

function pev(t, type, x, y, opts = {}) {
  const e = new t.w.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    shiftKey: opts.shiftKey === true,
  });
  Object.defineProperties(e, {
    pointerId: { value: opts.pointerId === undefined ? 1 : opts.pointerId },
    isPrimary: { value: opts.isPrimary === undefined ? true : opts.isPrimary },
  });
  t.el("board").dispatchEvent(e);
}

function lostCapture(t, pointerId) {
  const e = new t.w.Event("lostpointercapture", { bubbles: true });
  Object.defineProperty(e, "pointerId", { value: pointerId });
  t.el("board").dispatchEvent(e);
}

function key(t, k, target, init = {}) {
  (target || t.d).dispatchEvent(
    new t.w.KeyboardEvent("keydown", {
      key: k,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
}

function normalizedText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function referencedText(el, attribute) {
  return normalizedText(
    (el.getAttribute(attribute) || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => el.ownerDocument.getElementById(id))
      .filter(Boolean)
      .map((node) => node.textContent)
      .join(" "),
  );
}

function accessibleButtonText(button) {
  const labelled = referencedText(button, "aria-labelledby");
  const name =
    labelled ||
    normalizedText(button.getAttribute("aria-label")) ||
    normalizedText(button.textContent);
  const description = referencedText(button, "aria-describedby");
  return normalizedText(name + " " + description);
}

function revealedCardValueIsExposed(button, accessibleTextBeforeReveal) {
  const visibleLines = [...button.querySelectorAll(".guide-card-value")]
    .map((node) => normalizedText(node.textContent))
    .filter(Boolean);
  if (visibleLines.length === 0) {
    return false;
  }
  const hasOverridingName =
    normalizedText(button.getAttribute("aria-label")) !== "" ||
    normalizedText(button.getAttribute("aria-labelledby")) !== "";
  if (!hasOverridingName) {
    return true;
  }
  /* With an overriding accessible name, every visible value line must be
     reachable through the computed name+description — a card that shows a
     distance AND a moment must expose both, not just the first line. */
  const exposed = accessibleButtonText(button);
  return (
    exposed !== normalizedText(accessibleTextBeforeReveal) &&
    visibleLines.every((line) => exposed.includes(line))
  );
}

function exposedSelectionState(button) {
  if (button.hasAttribute("aria-pressed")) {
    return button.getAttribute("aria-pressed") === "true";
  }
  if (
    button.getAttribute("role") === "radio" &&
    button.hasAttribute("aria-checked")
  ) {
    return button.getAttribute("aria-checked") === "true";
  }
  if (
    button.getAttribute("role") === "option" &&
    button.hasAttribute("aria-selected")
  ) {
    return button.getAttribute("aria-selected") === "true";
  }
  if (
    button.getAttribute("role") === "tab" &&
    button.hasAttribute("aria-selected")
  ) {
    return button.getAttribute("aria-selected") === "true";
  }
  return null;
}

function expectExclusiveSelection(t, ids, selectedId, msg) {
  eq(
    ids.map((id) => exposedSelectionState(t.el(id))),
    ids.map((id) => id === selectedId),
    msg,
  );
}

function setHidden(t, hidden) {
  Object.defineProperty(t.d, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  t.d.dispatchEvent(new t.w.Event("visibilitychange"));
}

function tailPoint(t, force) {
  const g = t.dbg().geom;
  const px = g.beamPx / 8;
  return { x: g.W / 2 + force.x * px, y: g.beamY };
}

function headPoint(t, force) {
  const g = t.dbg().geom;
  const tail = tailPoint(t, force);
  const rad = (force.angleDeg * Math.PI) / 180;
  return {
    x: tail.x + Math.cos(rad) * force.magnitude * g.forcePxPerN,
    y: tail.y - Math.sin(rad) * force.magnitude * g.forcePxPerN,
  };
}

/* ===== Independent I18N manifest (spec section 16, transcribed) ===== */

const MANIFEST = {
  title: [],
  subtitle: [],
  backLearn: [],
  switchLanguage: [],
  mode: [],
  explore: [],
  game: [],
  guide: [],
  howItWorks: [],
  replayGuide: [],
  exitGuide: [],
  previous: [],
  next: [],
  replay: [],
  guideStep: ["current", "total"],
  forceLabel: [],
  pivotLabel: [],
  nextExample: [],
  startExploring: [],
  startGame: [],
  howToPlay: [],
  keyboardHelp: [],
  guideChooseCw: [],
  guideChooseCcw: [],
  guideWrongCw: [],
  guideWrongCcw: [],
  near: [],
  far: [],
  smallerForce: [],
  largerForce: [],
  guideZeroQuestion: [],
  guideLargestQuestion: [],
  guideWrongZero: [],
  guideWrongLargest: [],
  swapSides: [],
  guideBalancePrompt: [],
  forceControls: [],
  setExactValues: [],
  momentResult: [],
  actionsAndHelp: [],
  forces: [],
  oneForce: [],
  twoForces: [],
  selectedForce: [],
  forceStrength: [],
  position: [],
  positionRight: ["value"],
  positionLeft: ["value"],
  positionPivot: [],
  direction: [],
  directionUp: [],
  directionDown: [],
  directionLeft: [],
  directionRight: [],
  directionUpRight: [],
  directionUpLeft: [],
  directionDownRight: [],
  directionDownLeft: [],
  moment: [],
  momentArm: [],
  ccwTotal: [],
  cwTotal: [],
  netResult: [],
  turnsCcw: [],
  turnsCw: [],
  balancedPivot: [],
  noTurningEffect: [],
  resetExperiment: [],
  moveForceHint: [],
  exploreKeyboardHelp: [],
  gameType: [],
  balanceGame: [],
  predictGame: [],
  difficulty: [],
  balanceDifficulty1Aria: [],
  balanceDifficulty2Aria: [],
  balanceDifficulty3Aria: [],
  predictDifficulty1Aria: [],
  predictDifficulty2Aria: [],
  predictDifficulty3Aria: [],
  balanceDesc: [],
  predictDesc: [],
  balanceHowToPlay: [],
  predictHowToPlay: [],
  balanceKeyboardHelp: [],
  predictKeyboardHelp: [],
  guideKeyboardHelp: [],
  startRounds: [],
  roundOf: ["current", "total"],
  firstTry: ["correct", "answered"],
  leaveGameQuestion: [],
  leaveGame: [],
  stayGame: [],
  balanceMission: [],
  moveForce: [],
  forceDock: [],
  balancePosition: [],
  previousSocket: [],
  nextSocket: [],
  checkBalance: [],
  chooseSocket: [],
  invalidPivot: [],
  occupiedSocket: [],
  invalidDrop: [],
  placementReadout: ["position", "moment", "direction"],
  balancedSuccess: [],
  notBalancedYet: [],
  initialTurnCcw: [],
  initialTurnCw: [],
  sameForceSameDistance: [],
  weakerNeedsFarther: [],
  strongerNeedsCloser: [],
  combinedFixedMoments: [],
  predictMission: [],
  answerCcw: [],
  answerBalanced: [],
  answerCw: [],
  answerCcwAria: [],
  answerBalancedAria: [],
  answerCwAria: [],
  showMomentGuide: [],
  correctPrediction: ["reason"],
  predictionReveal: ["result", "reason"],
  resultCcw: [],
  resultBalanced: [],
  resultCw: [],
  momentTotals: ["ccw", "cw", "net", "result"],
  singleClockwise: [],
  singleCounterclockwise: [],
  throughPivotZero: [],
  alongBeamZero: [],
  equalOpposingMoments: [],
  productBalance: [],
  forceWinsProduct: [],
  distanceWinsProduct: [],
  compareProducts: [],
  addSignedMoments: [],
  sameSideCanOppose: [],
  pivotForceAddsZero: [],
  sessionComplete: [],
  correctFirstTry: ["correct"],
  accuracy: [],
  accuracyValue: ["percent"],
  starsAria: ["count"],
  playAgain: [],
  changeGame: [],
  continueHint: [],
  storageUnavailable: [],
  canvasExploreAria: [],
  canvasBalanceAria: [],
  canvasPredictAria: [],
  canvasForceSummary: [
    "force",
    "forceValue",
    "forceDirection",
    "degrees",
    "position",
    "momentValue",
    "momentDirection",
    "ccwTotal",
    "cwTotal",
    "netMoment",
    "result",
  ],
  canvasForceSummaryZero: [
    "force",
    "forceValue",
    "forceDirection",
    "degrees",
    "position",
    "momentValue",
    "ccwTotal",
    "cwTotal",
    "netMoment",
    "result",
  ],
  debugScenarioError: ["id"],
  tipForceOnly: [],
  tipDirection: [],
  tipLineAction: [],
  tipCombine: [],
  tipCompare: [],
  tipStrong: [],
};
const GUIDE_IDS = [
  "push-can-turn",
  "turn-direction",
  "distance",
  "force-strength",
  "line-of-action",
  "name-and-equation",
  "trade-force-distance",
  "net-moment",
  "how-to-play",
];

function placeholders(text) {
  const found = new Set();
  const re = /\{([a-zA-Z]+)\}/g;
  let m = re.exec(text);
  while (m !== null) {
    found.add(m[1]);
    m = re.exec(text);
  }
  return [...found].sort();
}

/* ===== A. First visit, repeat visit, storage exception ===== */
{
  let t = boot({ introSeen: false });
  ok(t.dbg().state.phase === "intro", "A: first visit opens the Guide");
  eq(t.dbg().guideState.step, 1, "A: first visit starts at step 1");
  ok(
    t.active() === t.el("introStepTitle"),
    "A: Guide heading focused on first visit",
  );
  ok(
    t.dbg().state.introReturn !== null,
    "A: introReturn snapshot exists on first visit",
  );

  t = boot({ introSeen: true });
  ok(t.dbg().state.phase === "explore", "A: repeat visit starts in Explore");
  ok(
    t.active() === t.el("board"),
    "A: repeat visit focuses the Explore canvas",
  );

  t = boot({ breakStorage: true });
  ok(
    t.dbg().state.phase === "intro",
    "A: broken storage still opens the Guide",
  );
  ok(
    !t.el("storageNote").hidden,
    "A: storage notice visible in the Guide panel",
  );
  ok(
    t.el("liveRegion").textContent.indexOf("cannot remember") !== -1,
    "A: storage notice announced once",
  );
  t.el("exitGuideBtn").click();
  ok(
    t.dbg().state.phase === "explore",
    "A: broken storage does not block Guide exit",
  );
  console.log("ok   A. visits and storage");
}

/* ===== B. I18N manifest (independent list) ===== */
{
  const t = boot({});
  const I18N = t.dbg().I18N;
  for (const langCode of ["en", "pl"]) {
    const table = I18N[langCode];
    for (const key of Object.keys(MANIFEST)) {
      ok(
        typeof table[key] === "string" && table[key].length > 0,
        "B: " + langCode + " missing " + key,
      );
      if (typeof table[key] === "string") {
        eq(
          placeholders(table[key]),
          MANIFEST[key].slice().sort(),
          "B: " + langCode + " placeholders for " + key,
        );
      }
    }
    for (const key of Object.keys(table)) {
      ok(
        MANIFEST[key] !== undefined || key === "guideRecords",
        "B: " + langCode + " unknown key " + key,
      );
    }
    const records = table.guideRecords;
    eq(records.length, 9, "B: " + langCode + " nine guide records");
    records.forEach((record, index) => {
      eq(
        record.id,
        GUIDE_IDS[index],
        "B: " + langCode + " guide id order " + index,
      );
      ok(record.title.length > 0, "B: " + langCode + " guide title " + index);
      eq(
        record.commentary.length,
        2,
        "B: " + langCode + " guide commentary " + index,
      );
      ok(
        Array.isArray(record.sceneCopy),
        "B: " + langCode + " sceneCopy array " + index,
      );
    });
    eq(records[5].sceneCopy.length, 2, "B: " + langCode + " step 6 sceneCopy");
  }
  eq(t.dbg().i18nManifestErrors, [], "B: app-side manifest validation clean");
  console.log("ok   B. I18N manifest");
}

/* ===== C. Formatting helpers (spec 16.7) ===== */
{
  const t = boot({});
  const h = t.dbg().helpers;
  const values = [0, 0.5, 1, 1.5, 2, 4, 5, 12, 14, 21, 22, 25, 40];
  const plNewton = {
    0: "0 niutonów",
    0.5: "0,5 niutona",
    1: "1 niuton",
    1.5: "1,5 niutona",
    2: "2 niutony",
    4: "4 niutony",
    5: "5 niutonów",
    12: "12 niutonów",
    14: "14 niutonów",
    21: "21 niutonów",
    22: "22 niutony",
    25: "25 niutonów",
    40: "40 niutonów",
  };
  const enNewton = {
    0: "0 newtons",
    0.5: "0.5 newtons",
    1: "1 newton",
    1.5: "1.5 newtons",
    2: "2 newtons",
    4: "4 newtons",
    5: "5 newtons",
    12: "12 newtons",
    14: "14 newtons",
    21: "21 newtons",
    22: "22 newtons",
    25: "25 newtons",
    40: "40 newtons",
  };
  for (const v of values) {
    eq(
      h.formatSpokenQuantity(v, "newton", "pl"),
      plNewton[v],
      "C: pl newton " + v,
    );
    eq(
      h.formatSpokenQuantity(v, "newton", "en"),
      enNewton[v],
      "C: en newton " + v,
    );
  }
  eq(h.formatSpokenQuantity(2, "metre", "pl"), "2 metry", "C: pl metre 2");
  eq(h.formatSpokenQuantity(5, "metre", "pl"), "5 metrów", "C: pl metre 5");
  eq(
    h.formatSpokenQuantity(1.5, "metre", "pl"),
    "1,5 metra",
    "C: pl metre 1.5",
  );
  eq(
    h.formatSpokenQuantity(2.5, "newtonMetre", "pl"),
    "2,5 niutonometra",
    "C: pl N·m 2.5",
  );
  eq(
    h.formatSpokenQuantity(22, "newtonMetre", "pl"),
    "22 niutonometry",
    "C: pl N·m 22",
  );
  eq(
    h.formatSpokenQuantity(12, "degree", "pl"),
    "12 stopni",
    "C: pl degree 12",
  );
  eq(
    h.formatSpokenQuantity(-3, "newtonMetre", "pl"),
    "minus 3 niutonometry",
    "C: pl negative",
  );
  eq(
    h.formatSpokenQuantity(-3, "newtonMetre", "en"),
    "minus 3 newton metres",
    "C: en negative",
  );
  eq(
    h.formatSpokenQuantity(1, "newtonMetre", "en"),
    "1 newton metre",
    "C: en singular N·m",
  );

  eq(h.formatVisualNumber(1.5, 1, "pl"), "1,5", "C: pl decimal comma");
  eq(h.formatVisualNumber(1.5, 1, "en"), "1.5", "C: en decimal point");
  eq(h.formatVisualNumber(-0, 1, "en"), "0.0", "C: minus zero normalized");
  eq(h.formatVisualNetMoment(6, 0, "en"), "+6", "C: net positive sign");
  eq(h.formatVisualNetMoment(-6, 0, "en"), "−6", "C: net Unicode minus");
  eq(h.formatVisualNetMoment(0, 0, "en"), "0", "C: net unsigned zero");
  eq(h.formatVisualNetMoment(-6.5, 1, "pl"), "−6,5", "C: net pl comma");
  eq(
    h.formatVisualNetMoment(0.04, 1, "en"),
    "+< 0.1",
    "C: tiny net shows < 0.1",
  );
  eq(
    h.formatVisualMomentMagnitude(0.04, 1, "pl"),
    "< 0,1",
    "C: tiny magnitude shows < 0,1",
  );

  eq(h.formatSpokenPosition(0, "en"), "at the pivot", "C: position pivot en");
  eq(
    h.formatSpokenPosition(0, "pl"),
    "w punkcie podparcia",
    "C: position pivot pl",
  );
  eq(
    h.formatSpokenPosition(3, "en"),
    "3 metres right of pivot",
    "C: position right en",
  );
  eq(
    h.formatSpokenPosition(-2.5, "pl"),
    "2,5 metra na lewo od punktu podparcia",
    "C: position left pl",
  );
  eq(
    h.formatSpokenPosition(1, "en"),
    "1 metre right of pivot",
    "C: position singular en",
  );

  eq(h.formatDirection(270, "en").short, "down", "C: direction 270");
  eq(
    h.formatDirection(360, "en").short,
    "right",
    "C: direction 360 normalizes",
  );
  eq(
    h.formatDirection(45, "pl").short,
    "w górę i w prawo",
    "C: direction quadrant pl",
  );
  eq(h.formatDirection(210, "en").short, "down and left", "C: direction 210");
  eq(h.formatDirection(300, "en").short, "down and right", "C: direction 300");
  eq(h.formatDirection(135, "en").short, "up and left", "C: direction 135");
  console.log("ok   C. formatting helpers");
}

/* ===== D. Canvas summaries (spec 15.1/16.6) ===== */
{
  const t = boot({});
  const h = t.dbg().helpers;
  const mk = (x, magnitude, angleDeg) => ({
    id: "f1",
    label: "F1",
    x,
    y: 0,
    magnitude,
    angleDeg,
  });
  const cases = [
    { force: mk(3, 2, 270), zero: false },
    { force: mk(-2, 3, 90), zero: false },
    { force: mk(3, 2, 45), zero: false },
    { force: mk(3, 2, 135), zero: false },
    { force: mk(3, 2, 225), zero: false },
    { force: mk(3, 2, 315), zero: false },
    { force: mk(2.5, 1.5, 210), zero: false },
    { force: mk(3, 2, 180), zero: true },
    { force: mk(0, 5, 270), zero: true },
  ];
  for (const langCode of ["en", "pl"]) {
    for (const item of cases) {
      const forces = [item.force];
      const summary = h.buildCanvasSummary(
        item.force,
        forces,
        { x: 0, y: 0 },
        langCode,
      );
      ok(
        summary.indexOf("{") === -1,
        "D: no unfilled placeholder (" +
          langCode +
          " " +
          item.force.angleDeg +
          ")",
      );
      const template =
        t.dbg().I18N[langCode][
          item.zero ? "canvasForceSummaryZero" : "canvasForceSummary"
        ];
      const head = template.slice(0, template.indexOf("{"));
      ok(
        summary.indexOf(head) === 0 || head === "",
        "D: template head retained",
      );
      const scaffold = h.buildMomentScaffold(forces, { x: 0, y: 0 });
      const ccwSpoken = h.formatSpokenQuantity(
        scaffold.ccwTotal,
        "newtonMetre",
        langCode,
      );
      const cwSpoken = h.formatSpokenQuantity(
        scaffold.cwTotal,
        "newtonMetre",
        langCode,
      );
      ok(
        summary.indexOf(ccwSpoken) !== -1,
        "D: ccw total present (" + langCode + ")",
      );
      ok(
        summary.indexOf(cwSpoken) !== -1,
        "D: cw total present (" + langCode + ")",
      );
      const netCls = h.classifyMoment(scaffold.netMoment);
      const resultKey =
        netCls === "ccw"
          ? "turnsCcw"
          : netCls === "cw"
            ? "turnsCw"
            : "balancedPivot";
      ok(
        summary.indexOf(t.dbg().I18N[langCode][resultKey]) !== -1,
        "D: net result phrase present (" + langCode + ")",
      );
      if (item.zero) {
        ok(
          summary.indexOf(t.dbg().I18N[langCode].cwTotal) ===
            summary.lastIndexOf(t.dbg().I18N[langCode].cwTotal),
          "D: zero template has no moment direction (" + langCode + ")",
        );
      }
    }
  }
  console.log("ok   D. canvas summaries");
}

/* ===== E. Explore controls, clamps, panel/canvas equivalence ===== */
{
  const t = boot({});
  const st = t.dbg().state;
  const a = t.dbg().actions;
  eq(st.forces.length, 1, "E: default one force");
  ok(!t.el("exploreCue").hidden, "E: first-run cue visible at explore boot");
  eq(
    t.el("strengthSlider").getAttribute("aria-valuetext"),
    "2.0 N",
    "E: strength slider exposes a unit-bearing value text",
  );
  eq(
    t.el("positionSlider").getAttribute("aria-valuetext"),
    t.el("positionPhrase").textContent,
    "E: position slider value text is the full localized phrase",
  );
  ok(
    (t.el("directionSlider").getAttribute("aria-valuetext") || "").indexOf(
      "270°",
    ) !== -1,
    "E: direction slider value text carries the angle with degrees",
  );
  eq(
    t.el("exploreCue").textContent,
    t.dbg().I18N.en.moveForceHint,
    "E: cue reuses the moveForceHint copy",
  );
  eq(
    { x: st.forces[0].x, m: st.forces[0].magnitude, a: st.forces[0].angleDeg },
    { x: 3, m: 2, a: 270 },
    "E: default F1",
  );
  t.el("twoForcesBtn").click();
  eq(st.exploreForceCount, 2, "E: two forces enabled");
  eq(
    { x: st.forces[1].x, m: st.forces[1].magnitude, a: st.forces[1].angleDeg },
    { x: -2, m: 3, a: 270 },
    "E: default F2 balances F1",
  );
  eq(
    { x: st.forces[0].x, m: st.forces[0].magnitude },
    { x: 3, m: 2 },
    "E: adding F2 leaves F1 unchanged",
  );
  ok(
    !t.el("forceSelectToggle").hidden,
    "E: F1/F2 selector visible in two-force mode",
  );
  t.el("selForce2Btn").click();
  eq(st.selectedForceId, "f2", "E: F2 selected");
  a.setForceProperty("magnitude", 4.4);
  eq(st.forces[1].magnitude, 4.5, "E: magnitude snaps to 0.5");
  ok(t.el("exploreCue").hidden, "E: cue dismissed on first force change");
  a.setForceProperty("magnitude", 99);
  eq(st.forces[1].magnitude, 5, "E: magnitude clamps to 5");
  a.setForceProperty("magnitude", -3);
  eq(st.forces[1].magnitude, 0.5, "E: magnitude clamps to 0.5");
  a.setForceProperty("x", 9);
  eq(st.forces[1].x, 4, "E: position clamps to +4");
  a.setForceProperty("x", -9);
  eq(st.forces[1].x, -4, "E: position clamps to -4");
  a.setForceProperty("angleDeg", 372);
  eq(st.forces[1].angleDeg, 15, "E: angle snaps and normalizes");
  /* F2 retention rule */
  t.el("oneForceBtn").click();
  eq(st.forces.length, 1, "E: back to one force");
  eq(st.selectedForceId, "f1", "E: selection falls back to F1");
  t.el("twoForcesBtn").click();
  eq(
    { x: st.forces[1].x, m: st.forces[1].magnitude, a: st.forces[1].angleDeg },
    { x: -4, m: 0.5, a: 15 },
    "E: re-enabling F2 restores its last state",
  );
  /* panel slider drives same state */
  t.el("selForce1Btn").click();
  t.el("strengthSlider").value = "3.5";
  t.el("strengthSlider").dispatchEvent(
    new t.w.Event("input", { bubbles: true }),
  );
  eq(st.forces[0].magnitude, 3.5, "E: strength slider updates state");
  t.el("positionSlider").value = "-1.5";
  t.el("positionSlider").dispatchEvent(
    new t.w.Event("input", { bubbles: true }),
  );
  eq(st.forces[0].x, -1.5, "E: position slider updates state");
  t.el("directionSlider").value = "90";
  t.el("directionSlider").dispatchEvent(
    new t.w.Event("input", { bubbles: true }),
  );
  eq(st.forces[0].angleDeg, 90, "E: direction slider updates state");
  ok(
    t.el("positionPhrase").textContent.indexOf("left of pivot") !== -1,
    "E: position phrase uses left/right wording",
  );
  /* keyboard equivalence on canvas */
  t.el("board").focus();
  key(t, "ArrowRight", t.el("board"));
  eq(st.forces[0].x, -1, "E: ArrowRight moves 0.5");
  key(t, "ArrowUp", t.el("board"));
  eq(st.forces[0].magnitude, 4, "E: ArrowUp adds 0.5 N");
  key(t, "[", t.el("board"));
  eq(st.forces[0].angleDeg, 105, "E: bracket rotates 15");
  key(t, "]", t.el("board"));
  eq(st.forces[0].angleDeg, 90, "E: bracket rotates back");
  key(t, "2", t.el("board"));
  eq(st.selectedForceId, "f2", "E: 2 selects F2");
  key(t, "1", t.el("board"));
  eq(st.selectedForceId, "f1", "E: 1 selects F1");
  key(t, "r", t.el("board"));
  eq(st.forces.length, 1, "E: R resets to one force");
  eq(
    { x: st.forces[0].x, m: st.forces[0].magnitude, a: st.forces[0].angleDeg },
    { x: 3, m: 2, a: 270 },
    "E: R restores defaults",
  );
  ok(t.el("exploreCue").hidden, "E: cue stays dismissed for the session");
  /* readouts and pill agree with solver */
  t.el("twoForcesBtn").click();
  ok(t.el("resultPill").textContent.length > 0, "E: result pill populated");
  ok(!t.el("resultPill").hidden, "E: result pill visible in Explore");
  eq(t.el("roNet").textContent, "0.0 N·m", "E: balanced net readout");
  /* live language switch mid-Explore retranslates labels, readouts, and
     slider value text in place */
  t.el("langBtn").click();
  eq(t.d.documentElement.lang, "pl", "E: live switch flips document language");
  eq(
    t.el("lblMode").textContent,
    t.dbg().I18N.pl.mode,
    "E: section labels retranslate in place",
  );
  eq(t.el("roNet").textContent, "0,0 N·m", "E: readouts reformat in Polish");
  eq(
    t.el("strengthSlider").getAttribute("aria-valuetext"),
    "2,0 N",
    "E: slider value text reformats in Polish",
  );
  eq(
    t.el("positionSlider").getAttribute("aria-valuetext"),
    t.el("positionPhrase").textContent,
    "E: Polish position value text matches the phrase",
  );
  t.el("langBtn").click();
  eq(t.d.documentElement.lang, "en", "E: switch back restores English");
  /* Physics subscripts: rendered as a real <sub>, while the spoken and
     accessible-name form stays the flat "F1". */
  const subs = [...t.d.querySelectorAll("#forceSelectToggle sub")];
  eq(subs.length, 2, "E: both force buttons carry a subscript element");
  eq(
    subs.map((n) => n.textContent),
    ["1", "2"],
    "E: the subscript is the force index",
  );
  eq(
    subs.map((n) => n.parentElement.firstChild.nodeValue.trim()),
    ["F", "F"],
    "E: the base glyph stays outside the subscript",
  );
  eq(
    t.el("selForce1Btn").textContent.replace(/\s+/g, ""),
    "F1",
    "E: the accessible name is still F1",
  );
  ok(
    !/[\u2080-\u209c]/u.test(t.d.body.textContent),
    "E: no Unicode subscript codepoint is used (JetBrains Mono has no glyph)",
  );
  console.log("ok   E. explore controls");
}

/* ===== F. Explore pointer drags (spec 9.3) ===== */
{
  const t = boot({});
  stubBoardRect(t, 800, 500);
  const st = t.dbg().state;
  const f1 = () => st.forces[0];
  const g = t.dbg().geom;
  ok(Math.abs(g.forcePxPerN - 31) < 0.001, "F: 800x500 forcePxPerN = 31");
  /* tail drag moves position only */
  let tail = tailPoint(t, f1());
  pev(t, "pointerdown", tail.x, tail.y);
  pev(t, "pointermove", tail.x - g.beamPx / 8, tail.y);
  eq(f1().x, 2, "F: tail drag snaps to 0.5 m grid (3 → 2)");
  eq(f1().angleDeg, 270, "F: tail drag keeps direction");
  eq(f1().magnitude, 2, "F: tail drag keeps magnitude");
  pev(t, "pointerup", tail.x - g.beamPx / 8, tail.y);
  eq(f1().x, 2, "F: tail drag commits on release");
  ok(
    t.el("liveRegion").textContent.indexOf("F1") !== -1,
    "F: release announces the force summary",
  );
  /* head drag: exact polar mapping */
  let head = headPoint(t, f1());
  tail = tailPoint(t, f1());
  pev(t, "pointerdown", head.x, head.y);
  const target45 = {
    x: tail.x + Math.cos(Math.PI / 4) * 3 * g.forcePxPerN,
    y: tail.y - Math.sin(Math.PI / 4) * 3 * g.forcePxPerN,
  };
  pev(t, "pointermove", target45.x, target45.y);
  eq(f1().angleDeg, 45, "F: head drag snaps angle to 15° (45)");
  eq(f1().magnitude, 3, "F: head drag snaps magnitude to 0.5 N (3)");
  eq(f1().x, 2, "F: head drag never moves the application point");
  /* pointer at tail: keep direction, minimum magnitude */
  pev(t, "pointermove", tail.x, tail.y);
  eq(f1().magnitude, 0.5, "F: pointer at tail selects 0.5 N");
  eq(f1().angleDeg, 45, "F: pointer at tail keeps direction");
  /* secondary pointer ignored during drag */
  pev(t, "pointerdown", tail.x + 50, tail.y + 50, {
    pointerId: 2,
    isPrimary: false,
  });
  pev(t, "pointermove", tail.x + 90, tail.y + 90, { pointerId: 2 });
  eq(f1().magnitude, 0.5, "F: secondary pointer cannot steal the drag");
  /* Escape cancels and restores pre-drag state */
  key(t, "Escape", t.el("board"));
  eq(
    { x: f1().x, m: f1().magnitude, a: f1().angleDeg },
    { x: 2, m: 2, a: 270 },
    "F: Escape restores pre-drag committed state",
  );
  /* non-primary pointer cannot start a drag */
  head = headPoint(t, f1());
  pev(t, "pointerdown", head.x, head.y, { pointerId: 3, isPrimary: false });
  pev(t, "pointermove", head.x + 40, head.y, { pointerId: 3 });
  eq(f1().magnitude, 2, "F: non-primary pointer never begins a drag");
  /* pointercancel restores */
  head = headPoint(t, f1());
  pev(t, "pointerdown", head.x, head.y);
  pev(t, "pointermove", head.x, head.y + 31);
  ok(f1().magnitude !== 2, "F: drag in progress changed magnitude");
  pev(t, "pointercancel", head.x, head.y + 31);
  eq(
    { x: f1().x, m: f1().magnitude, a: f1().angleDeg },
    { x: 2, m: 2, a: 270 },
    "F: pointercancel restores pre-drag state",
  );
  /* active lostpointercapture restores */
  head = headPoint(t, f1());
  pev(t, "pointerdown", head.x, head.y);
  pev(t, "pointermove", head.x, head.y + 31);
  lostCapture(t, 1);
  eq(
    { x: f1().x, m: f1().magnitude, a: f1().angleDeg },
    { x: 2, m: 2, a: 270 },
    "F: active lostpointercapture restores pre-drag state",
  );
  /* overlapping targets: nearer centre wins */
  t.el("twoForcesBtn").click();
  t.dbg().actions.selectExploreForce("f2");
  t.dbg().actions.setForceProperty("x", 2.5);
  t.dbg().actions.selectExploreForce("f1");
  const f2 = () => st.forces[1];
  const tail1 = tailPoint(t, f1());
  const tail2 = tailPoint(t, f2());
  const between = { x: (tail1.x + tail2.x) / 2 + 6, y: tail1.y };
  ok(Math.abs(tail1.x - tail2.x) < 48, "F: overlap scenario constructed");
  pev(t, "pointerdown", between.x, between.y);
  eq(st.selectedForceId, "f2", "F: nearer centre selected on overlap");
  pev(t, "pointerup", between.x, between.y);
  /* same-force head/tail overlap (spec 9.3): nearer part wins and an exact
     distance tie selects the head. A 0.5 N force at 0° gives a short arrow
     lying exactly along the beam, so head and tail regions overlap and the
     midpoint is an exact float tie. */
  t.el("oneForceBtn").click();
  t.dbg().actions.setForceProperty("magnitude", 0.5);
  t.dbg().actions.setForceProperty("angleDeg", 0);
  t.dbg().actions.setForceProperty("x", -1);
  const sTail = tailPoint(t, f1());
  const sHead = headPoint(t, f1());
  eq(sHead.y, sTail.y, "F: 0° arrow lies exactly along the beam");
  ok(
    sHead.x - sTail.x > 4 && sHead.x - sTail.x < 46,
    "F: short-arrow overlap scenario constructed",
  );
  /* near the tail: tail drag (position changes on move) */
  pev(t, "pointerdown", sTail.x + 2, sTail.y);
  pev(t, "pointermove", sTail.x + 2 + (t.dbg().geom.beamPx / 8) * 2, sTail.y);
  pev(t, "pointerup", sTail.x + 2 + (t.dbg().geom.beamPx / 8) * 2, sTail.y);
  ok(f1().x !== -1, "F: overlap point nearer the tail starts a tail drag");
  t.dbg().actions.setForceProperty("x", -1);
  /* near the head: head drag (position stays fixed on move) */
  pev(t, "pointerdown", sHead.x - 2, sHead.y);
  pev(t, "pointermove", sHead.x, sHead.y - 120);
  pev(t, "pointerup", sHead.x, sHead.y - 120);
  ok(
    f1().x === -1 && (f1().angleDeg !== 0 || f1().magnitude !== 0.5),
    "F: overlap point nearer the head starts a head drag",
  );
  t.dbg().actions.setForceProperty("magnitude", 0.5);
  t.dbg().actions.setForceProperty("angleDeg", 0);
  /* the exact tie: equidistant from both centres selects the head */
  const mid = { x: sTail.x + (sHead.x - sTail.x) / 2, y: sTail.y };
  eq(
    Math.hypot(mid.x - sTail.x, 0),
    Math.hypot(mid.x - sHead.x, 0),
    "F: tie point is exactly equidistant in float arithmetic",
  );
  pev(t, "pointerdown", mid.x, mid.y);
  pev(t, "pointermove", mid.x, mid.y - 120);
  pev(t, "pointerup", mid.x, mid.y - 120);
  ok(
    f1().x === -1 && (f1().angleDeg !== 0 || f1().magnitude !== 0.5),
    "F: an exact distance tie selects the head",
  );
  /* --- arrow-body grab and relative (no-jump) drag, ported from the
     gravity-assist velocity vector --- */
  t.dbg().actions.setForceProperty("magnitude", 4);
  t.dbg().actions.setForceProperty("angleDeg", 270);
  t.dbg().actions.setForceProperty("x", 2);
  const aTail = tailPoint(t, f1());
  const aHead = headPoint(t, f1());
  const shaftMid = {
    x: (aTail.x + aHead.x) / 2,
    y: (aTail.y + aHead.y) / 2,
  };
  ok(
    Math.hypot(shaftMid.x - aHead.x, shaftMid.y - aHead.y) > 24 &&
      Math.hypot(shaftMid.x - aTail.x, shaftMid.y - aTail.y) > 24,
    "F: shaft midpoint lies outside both endpoint hit circles",
  );
  /* a grab on the shaft with no movement changes nothing (no jump) */
  pev(t, "pointerdown", shaftMid.x, shaftMid.y);
  ok(
    t.el("board").classList.contains("dragging"),
    "F: shaft grab starts an arrow drag",
  );
  /* A browser delivers a move at the grab point; under the old absolute
     mapping that alone snapped the head onto the pointer (4 N -> 2 N). */
  pev(t, "pointermove", shaftMid.x, shaftMid.y);
  eq(
    { m: f1().magnitude, a: f1().angleDeg, x: f1().x },
    { m: 4, a: 270, x: 2 },
    "F: grabbing the shaft does not move the arrow to the pointer",
  );
  /* the head tracks pointer movement one-for-one, well clear of the 5 N clamp */
  t.dbg().actions.setForceProperty("magnitude", 1.5);
  pev(t, "pointerup", shaftMid.x, shaftMid.y);
  const dTail = tailPoint(t, f1());
  const dGrab = { x: dTail.x, y: dTail.y + t.dbg().geom.forcePxPerN };
  pev(t, "pointerdown", dGrab.x, dGrab.y);
  pev(t, "pointermove", dGrab.x, dGrab.y + 2 * t.dbg().geom.forcePxPerN);
  eq(
    f1().magnitude,
    3.5,
    "F: head moves by exactly the pointer delta (1.5 N + 2 N of travel)",
  );
  eq(f1().angleDeg, 270, "F: a straight-down drag keeps the direction");
  eq(f1().x, 2, "F: an arrow drag never moves the application point");
  pev(t, "pointerup", dGrab.x, dGrab.y + 2 * t.dbg().geom.forcePxPerN);
  t.dbg().actions.setForceProperty("magnitude", 4);
  /* Shift scales only new movement: an 8x-slower drag */
  t.dbg().actions.setForceProperty("magnitude", 2);
  t.dbg().actions.setForceProperty("angleDeg", 270);
  const fTail = tailPoint(t, f1());
  const fHead = headPoint(t, f1());
  const fMid = { x: (fTail.x + fHead.x) / 2, y: (fTail.y + fHead.y) / 2 };
  pev(t, "pointerdown", fMid.x, fMid.y, { shiftKey: true });
  pev(t, "pointermove", fMid.x, fMid.y + 8 * t.dbg().geom.forcePxPerN, {
    shiftKey: true,
  });
  eq(
    f1().magnitude,
    3,
    "F: Shift scales the drag to an eighth (8 N of travel gives 1 N)",
  );
  /* Releasing Shift mid-drag must not jump the arrow: the next move applies
     the full scale to NEW movement only, never to what was accumulated. */
  pev(t, "pointermove", fMid.x, fMid.y + 8 * t.dbg().geom.forcePxPerN);
  eq(f1().magnitude, 3, "F: releasing Shift mid-drag does not jump the arrow");
  pev(t, "pointermove", fMid.x, fMid.y + 9 * t.dbg().geom.forcePxPerN);
  eq(f1().magnitude, 4, "F: movement after releasing Shift resumes full scale");
  pev(t, "pointerup", fMid.x, fMid.y + 9 * t.dbg().geom.forcePxPerN);
  /* A Shift keyup that arrives with no drag in flight cannot latch fine mode
     on for the next drag: the pointer event is authoritative. */
  t.d.dispatchEvent(
    new t.w.KeyboardEvent("keydown", { key: "Shift", bubbles: true }),
  );
  t.dbg().actions.setForceProperty("magnitude", 2);
  t.dbg().actions.setForceProperty("angleDeg", 270);
  const sTail2 = tailPoint(t, f1());
  const sMid2 = {
    x: sTail2.x,
    y: sTail2.y + t.dbg().geom.forcePxPerN,
  };
  pev(t, "pointerdown", sMid2.x, sMid2.y);
  pev(t, "pointermove", sMid2.x, sMid2.y + 2 * t.dbg().geom.forcePxPerN);
  eq(
    f1().magnitude,
    4,
    "F: a stale Shift keydown never latches fine mode onto a new drag",
  );
  pev(t, "pointerup", sMid2.x, sMid2.y + 2 * t.dbg().geom.forcePxPerN);
  t.d.dispatchEvent(
    new t.w.KeyboardEvent("keyup", { key: "Shift", bubbles: true }),
  );
  /* the 20px shaft tolerance is normative: just inside grabs, just outside
     does not */
  const tTail = tailPoint(t, f1());
  const tHead = headPoint(t, f1());
  const tMid = { x: (tTail.x + tHead.x) / 2, y: (tTail.y + tHead.y) / 2 };
  pev(t, "pointerdown", tMid.x + 18, tMid.y);
  ok(
    t.el("board").classList.contains("dragging"),
    "F: 18px from the shaft is inside the grab tolerance",
  );
  pev(t, "pointerup", tMid.x + 18, tMid.y);
  pev(t, "pointerdown", tMid.x + 26, tMid.y);
  ok(
    !t.el("board").classList.contains("dragging"),
    "F: 26px from the shaft is outside the grab tolerance",
  );
  pev(t, "pointerup", tMid.x + 26, tMid.y);
  /* endpoint regions still win over the shaft */
  t.dbg().actions.setForceProperty("magnitude", 4);
  const pTail = tailPoint(t, f1());
  pev(t, "pointerdown", pTail.x + 4, pTail.y);
  pev(t, "pointermove", pTail.x + 4 + t.dbg().geom.beamPx / 8, pTail.y);
  ok(f1().x !== 2, "F: a grab inside the tail circle still drags the tail");
  eq(f1().x, 3, "F: the tail moves by the pointer delta, not to the pointer");
  pev(t, "pointerup", pTail.x + 4 + t.dbg().geom.beamPx / 8, pTail.y);
  /* hover cursors: move over the tail, grab over the arrow body */
  t.dbg().actions.setForceProperty("x", 2);
  const hTail = tailPoint(t, f1());
  const hHead = headPoint(t, f1());
  pev(t, "pointermove", hTail.x, hTail.y);
  ok(
    t.el("board").classList.contains("hover-move") &&
      !t.el("board").classList.contains("hover-target"),
    "F: the tail region shows the move cursor",
  );
  pev(t, "pointermove", (hTail.x + hHead.x) / 2, (hTail.y + hHead.y) / 2);
  ok(
    t.el("board").classList.contains("hover-target") &&
      !t.el("board").classList.contains("hover-move"),
    "F: the arrow body shows the grab cursor",
  );
  pev(t, "pointermove", 20, 20);
  ok(
    !t.el("board").classList.contains("hover-target") &&
      !t.el("board").classList.contains("hover-move"),
    "F: empty canvas clears both cursor states",
  );
  console.log("ok   F. explore pointer contract");
}

/* ===== helpers for game flows ===== */

function startGame(t, gameType, difficulty) {
  t.el("modeGameBtn").click();
  t.el(gameType === "balance" ? "balanceBtn" : "predictBtn").click();
  t.el("diff" + difficulty + "Btn").click();
  t.el("startBtn").click();
}

function currentRec(t) {
  const st = t.dbg().state;
  return t
    .dbg()
    .bank.find((r) => r.id === st.sessionScenarioIds[st.roundIndex]);
}

function socketPoint(t, x) {
  const g = t.dbg().geom;
  return { x: g.W / 2 + (x * g.beamPx) / 8, y: g.beamY };
}

function starsOn(t) {
  return t.d.querySelectorAll("#summaryStars .star.on").length;
}

function dockCentre(t) {
  const g = t.dbg().geom;
  const w = Math.max(150, Math.min(240, g.W * 0.4));
  return { x: g.W / 2, y: g.H - 40 - 56 + 28 + 6, w };
}

/* ===== G. Balance placement contract (spec 11.1) ===== */
{
  const t = boot({ query: "?debug=1&scenario=balance-l2-01" });
  stubBoardRect(t, 800, 500);
  const st = t.dbg().state;
  const rec = currentRec(t);
  eq(rec.id, "balance-l2-01", "G: scenario record loaded");
  eq(
    st.balancePlacement,
    { status: "unplaced", socketX: null },
    "G: round starts docked",
  );
  ok(t.el("checkBtn").disabled, "G: Check disabled while docked");
  eq(t.el("moveForceVal").textContent, "2 N", "G: movable force value shown");
  ok(
    t.active() === t.el("board"),
    "G: movable force (canvas) focused at round start",
  );
  /* keyboard from dock: Right chooses nearest legal right socket */
  key(t, "ArrowRight", t.el("board"));
  eq(
    st.balancePlacement,
    { status: "placed", socketX: 1 },
    "G: Right from dock -> +1",
  );
  ok(!t.el("checkBtn").disabled, "G: Check enabled once placed");
  /* traversal skips occupied (-2 is fixed) without wrapping */
  for (let i = 0; i < 4; i += 1) {
    key(t, "ArrowLeft", t.el("board"));
  }
  eq(
    st.balancePlacement.socketX,
    -4,
    "G: traversal reached -4 skipping occupied -2",
  );
  key(t, "ArrowLeft", t.el("board"));
  eq(st.balancePlacement.socketX, -4, "G: no wrap at the left end");
  /* Position buttons perform the same traversal */
  t.el("nextSocketBtn").click();
  eq(st.balancePlacement.socketX, -3, "G: Next spot button traverses right");
  t.el("prevSocketBtn").click();
  eq(st.balancePlacement.socketX, -4, "G: Previous spot button traverses left");
  ok(
    t.el("balancePositionValue").textContent.indexOf("4 m") !== -1,
    "G: localized position shown",
  );
  /* announce readout uses placement template */
  ok(
    t.el("liveRegion").textContent.indexOf("N·m") !== -1,
    "G: placement announcement includes the moment",
  );
  /* pointer drop on a legal socket */
  const tag = { x: socketPoint(t, -4).x, y: t.dbg().geom.beamY + 34 };
  pev(t, "pointerdown", tag.x, tag.y);
  const s3 = socketPoint(t, 3);
  pev(t, "pointermove", s3.x, s3.y);
  pev(t, "pointerup", s3.x, s3.y);
  eq(
    st.balancePlacement,
    { status: "placed", socketX: 3 },
    "G: pointer drop snaps to socket",
  );
  /* pivot dead zone announces invalidPivot and restores */
  const tag3 = { x: s3.x, y: t.dbg().geom.beamY + 34 };
  pev(t, "pointerdown", tag3.x, tag3.y);
  const pivotDrop = socketPoint(t, 0.2);
  pev(t, "pointermove", pivotDrop.x, pivotDrop.y);
  pev(t, "pointerup", pivotDrop.x, pivotDrop.y);
  eq(st.balancePlacement.socketX, 3, "G: pivot drop restores prior socket");
  ok(
    t.el("liveRegion").textContent.indexOf(t.dbg().I18N.en.invalidPivot) !== -1,
    "G: pivot drop announces invalidPivot",
  );
  /* occupied socket announces occupiedSocket */
  pev(t, "pointerdown", tag3.x, tag3.y);
  const occ = socketPoint(t, -2);
  pev(t, "pointermove", occ.x, occ.y);
  pev(t, "pointerup", occ.x, occ.y);
  eq(st.balancePlacement.socketX, 3, "G: occupied drop restores prior socket");
  ok(
    t.el("liveRegion").textContent.indexOf(t.dbg().I18N.en.occupiedSocket) !==
      -1,
    "G: occupied drop announces occupiedSocket",
  );
  /* off-board drop announces invalidDrop */
  pev(t, "pointerdown", tag3.x, tag3.y);
  pev(t, "pointermove", 400, 60);
  pev(t, "pointerup", 400, 60);
  eq(st.balancePlacement.socketX, 3, "G: off-board drop restores prior socket");
  ok(
    t.el("liveRegion").textContent.indexOf(t.dbg().I18N.en.invalidDrop) !== -1,
    "G: off-board drop announces invalidDrop",
  );
  eq(st.attemptCount, 0, "G: invalid drops never record an attempt");
  /* drag cancel path via pointercancel back to dock-free state */
  pev(t, "pointerdown", tag3.x, tag3.y);
  pev(t, "pointermove", 300, 200);
  pev(t, "pointercancel", 300, 200);
  eq(st.balancePlacement.socketX, 3, "G: pointercancel keeps committed socket");
  /* secondary pointer ignored while dragging the tag */
  pev(t, "pointerdown", tag3.x, tag3.y);
  pev(t, "pointerdown", 100, 100, { pointerId: 5, isPrimary: false });
  pev(t, "pointermove", 120, 120, { pointerId: 5 });
  pev(t, "pointerup", tag3.x, tag3.y);
  eq(
    st.balancePlacement.socketX,
    3,
    "G: secondary pointer ignored during tag drag",
  );
  /* live strips at every legal socket, fixed 8 px per N·m */
  const h = t.dbg().helpers;
  for (const socket of h.legalBalanceSockets(rec)) {
    t.dbg().actions.placeMovable(socket);
    const bars = [...t.d.querySelectorAll("#stripRegion .strip-bar")];
    eq(bars.length, 4, "G: two force strips + two totals at socket " + socket);
    const fixedM = Math.abs(h.momentOf({ ...rec.forces[0] }, { x: 0, y: 0 }));
    const movableM = Math.abs(socket * rec.movableMagnitude);
    eq(
      bars[0].style.width,
      fixedM * 8 + "px",
      "G: fixed strip width at " + socket,
    );
    eq(
      bars[1].style.width,
      movableM * 8 + "px",
      "G: movable strip width at " + socket,
    );
    const scaffold = h.buildMomentScaffold(
      [
        rec.forces[0],
        { x: socket, y: 0, magnitude: rec.movableMagnitude, angleDeg: 270 },
      ],
      { x: 0, y: 0 },
    );
    eq(
      bars[2].style.width,
      scaffold.ccwTotal * 8 + "px",
      "G: ccw total width at " + socket,
    );
    eq(
      bars[3].style.width,
      scaffold.cwTotal * 8 + "px",
      "G: cw total width at " + socket,
    );
  }
  /* tap-to-place: a plain press on a spot places without dragging */
  t.dbg().actions.placeMovable(3);
  const tapS = socketPoint(t, -1);
  pev(t, "pointerdown", tapS.x, tapS.y);
  pev(t, "pointerup", tapS.x, tapS.y);
  eq(
    st.balancePlacement,
    { status: "placed", socketX: -1 },
    "G: tap on an empty spot places directly",
  );
  const tapPivot = socketPoint(t, 0.1);
  pev(t, "pointerdown", tapPivot.x, tapPivot.y);
  pev(t, "pointerup", tapPivot.x, tapPivot.y);
  eq(st.balancePlacement.socketX, -1, "G: pivot tap keeps the placement");
  ok(
    t.el("liveRegion").textContent.indexOf(t.dbg().I18N.en.invalidPivot) !== -1,
    "G: pivot tap announces invalidPivot",
  );
  const tapOcc = socketPoint(t, -2);
  pev(t, "pointerdown", tapOcc.x, tapOcc.y);
  pev(t, "pointerup", tapOcc.x, tapOcc.y);
  eq(st.balancePlacement.socketX, -1, "G: occupied tap keeps the placement");
  ok(
    t.el("liveRegion").textContent.indexOf(t.dbg().I18N.en.occupiedSocket) !==
      -1,
    "G: occupied tap announces occupiedSocket",
  );
  eq(st.attemptCount, 0, "G: taps never record an attempt");
  /* Strip rows carry the same composed subscript. */
  const stripSubs = [...t.d.querySelectorAll("#stripRegion .strip-label sub")];
  ok(stripSubs.length >= 1, "G: strip labels carry a subscript element");
  ok(
    stripSubs.every((n) => /^\d+$/.test(n.textContent)),
    "G: strip subscripts are plain digits",
  );
  ok(
    [...t.d.querySelectorAll("#stripRegion .strip-label")].some(
      (n) => n.textContent.replace(/\s+/g, "") === "F1",
    ),
    "G: a strip label still reads F1 as flat text",
  );
  console.log("ok   G. balance placement");
}

/* ===== H. Balance check, reveal states, feedback, retry, tips ===== */
{
  const t = boot({ query: "?debug=1&scenario=balance-l2-01" });
  stubBoardRect(t, 800, 500);
  const st = t.dbg().state;
  const I = t.dbg().I18N.en;
  /* wrong at the mirrored distance -> force-only category */
  t.dbg().actions.placeMovable(2);
  t.el("checkBtn").click();
  eq(st.phase, "gameFeedback", "H: check enters gameFeedback");
  eq(st.balancePlacement.status, "revealingWrong", "H: revealingWrong state");
  ok(t.el("checkBtn").disabled, "H: check locked during reveal");
  ok(
    t.el("prevSocketBtn").disabled,
    "H: position buttons locked during reveal",
  );
  ok(t.el("modeExploreBtn").disabled, "H: mode selector locked during reveal");
  key(t, "ArrowRight", t.el("board"));
  eq(st.balancePlacement.socketX, 2, "H: keyboard locked during reveal");
  t.settle();
  eq(st.phase, "gameRound", "H: wrong reveal returns to gameRound");
  eq(
    st.balancePlacement,
    { status: "placed", socketX: 2 },
    "H: socket preserved after wrong",
  );
  eq(
    st.errorCategory,
    "force-only",
    "H: mirrored-distance error classified force-only",
  );
  eq(st.attemptCount, 1, "H: attempt recorded once");
  ok(
    !t.el("modeExploreBtn").disabled,
    "H: mode selector restored after reveal",
  );
  const blocks = [
    ...t.d.querySelectorAll("#feedbackRegion .feedback-block"),
  ].map((p) => p.textContent);
  eq(blocks.length, 4, "H: incorrect Balance has four blocks");
  ok(
    t.el("stageNextBtn").hidden,
    "H: on-stage Next hidden while showNext is false",
  );
  const scaffold = t.dbg().helpers.buildMomentScaffold(
    [
      { x: -2, y: 0, magnitude: 3, angleDeg: 270 },
      { x: 2, y: 0, magnitude: 2, angleDeg: 270 },
    ],
    { x: 0, y: 0 },
  );
  eq(
    blocks[0],
    t.dbg().helpers.buildMomentTotalsText(scaffold, 0, "en"),
    "H: block 1 is the numeric momentTotals sentence",
  );
  eq(blocks[1], I.notBalancedYet, "H: block 2 is notBalancedYet");
  eq(blocks[2], I.initialTurnCcw, "H: block 3 names the larger direction");
  eq(blocks[3], I.tipForceOnly, "H: block 4 is the recorded-category tip");
  ok(blocks[0].indexOf("+2") !== -1, "H: net moment formatted +2");
  ok(!/\d[.,]\d/.test(blocks[0]), "H: game integers carry no decimal point");
  /* feedback retained until first placement change */
  ok(st.feedback !== null, "H: wrong feedback retained after reveal");
  t.dbg().actions.placeMovable(4);
  ok(st.feedback === null, "H: feedback cleared on first placement change");
  eq(
    st.errorCategory,
    "force-only",
    "H: error category preserved through retry",
  );
  eq(st.attemptCount, 1, "H: attempts preserved through retry");
  /* correct retry does not change first-try score */
  t.dbg().actions.placeMovable(3);
  key(t, "Enter", t.el("board"), { repeat: true });
  eq(st.attemptCount, 1, "H: held Enter (key repeat) never checks the balance");
  key(t, "Enter", t.el("board"));
  eq(
    st.balancePlacement.status,
    "revealingCorrect",
    "H: correct check enters revealingCorrect",
  );
  ok(t.el("checkBtn").disabled, "H: inputs locked during the correct reveal");
  t.settle();
  eq(
    st.balancePlacement.status,
    "revealedCorrect",
    "H: correct retry locks placement",
  );
  eq(st.firstTryCorrect, 0, "H: only the first check affects accuracy");
  const blocks2 = [
    ...t.d.querySelectorAll("#feedbackRegion .feedback-block"),
  ].map((p) => p.textContent);
  eq(blocks2.length, 3, "H: correct Balance has three blocks");
  eq(blocks2[1], I.balancedSuccess, "H: block 2 is balancedSuccess");
  eq(blocks2[2], I.weakerNeedsFarther, "H: block 3 is the record explanation");
  ok(
    blocks2[0].indexOf("Net moment: 0 N·m") !== -1,
    "H: correct shows zero net",
  );
  ok(t.active() === t.el("nextBtn"), "H: Next focused after correct reveal");
  ok(
    !t.el("stageNextBtn").hidden && !t.el("stageNextBtn").disabled,
    "H: on-stage Next mirrors the panel Next",
  );
  key(t, "ArrowRight", t.el("board"));
  eq(
    st.balancePlacement.socketX,
    3,
    "H: placement locked after revealedCorrect",
  );
  t.el("stageNextBtn").click();
  eq(st.roundIndex, 1, "H: on-stage Next advances the round");
  ok(t.el("stageNextBtn").hidden, "H: on-stage Next hidden in the new round");
  eq(st.feedback, null, "H: round fields reset on Next");
  eq(
    st.balancePlacement,
    { status: "unplaced", socketX: null },
    "H: new round starts docked",
  );
  console.log("ok   H. balance check and feedback");
}

/* ===== I. Predict contract (spec 12) ===== */
{
  /* difficulty 1: arrow-only scaffold */
  let t = boot({ query: "?debug=1&scenario=predict-l1-01" });
  stubBoardRect(t, 800, 500);
  eq(
    t.d.querySelectorAll("#stripRegion .strip-row").length,
    0,
    "I: level 1 shows no pre-answer strips",
  );
  ok(t.el("hintBtn").hidden, "I: no moment guide below level 3");
  ok(
    t.active() === t.el("answerCcwBtn"),
    "I: answer group focused at round start",
  );
  eq(
    t.el("answerCcwBtn").textContent.trim(),
    "↶ COUNTERCLOCKWISE",
    "I: full ccw label",
  );
  eq(t.el("answerCwBtn").textContent.trim(), "CLOCKWISE ↷", "I: full cw label");
  eq(
    t.el("answerBalancedBtn").textContent.trim(),
    "BALANCED",
    "I: balanced label",
  );
  /* shortcuts never fire while focus is in a panel control */
  t.el("modeGameBtn").focus();
  key(t, "ArrowDown", t.el("modeGameBtn"));
  key(t, "a", t.el("langBtn"));
  eq(
    t.dbg().state.attemptCount,
    0,
    "I: panel-control focus suppresses answer shortcuts",
  );
  /* keyboard answer registers exactly once; repeats ignored */
  key(t, "d", t.el("board"));
  const st1 = t.dbg().state;
  eq(st1.attemptCount, 1, "I: keyboard answer records one attempt");
  eq(st1.firstTryCorrect, 1, "I: correct answer counted");
  key(t, "d", t.el("board"), { repeat: true });
  key(t, "a", t.el("board"));
  eq(st1.attemptCount, 1, "I: no second answer after reveal");
  t.settle();
  ok(t.el("answerCcwBtn").disabled, "I: answers locked after reveal");
  t.el("answerCwBtn").click();
  eq(st1.attemptCount, 1, "I: pointer cannot answer twice");
  const rows1 = t.d.querySelectorAll("#stripRegion .strip-row").length;
  ok(rows1 >= 3, "I: reveal shows individual contribution and totals");

  /* difficulty 2: strips + factor tiles before answering, no totals */
  t = boot({ query: "?debug=1&scenario=predict-l2-08" });
  stubBoardRect(t, 800, 500);
  let rows = [...t.d.querySelectorAll("#stripRegion .strip-row")];
  eq(rows.length, 2, "I: level 2 shows one strip per force, no totals");
  const tiles = [...t.d.querySelectorAll("#stripRegion .strip-tile")].map(
    (n) => n.textContent,
  );
  eq(tiles, ["1 N × 4 m", "3 N × 2 m"], "I: level 2 factor tiles");
  ok(
    t.el("liveRegion").textContent.indexOf(t.dbg().I18N.en.predictMission) !==
      -1,
    "I: mission announced",
  );
  /* wrong answer via arrow key */
  key(t, "ArrowLeft", t.el("board"));
  t.settle();
  const stw = t.dbg().state;
  eq(stw.firstTryCorrect, 0, "I: wrong answer not counted");
  eq(stw.errorCategory, "force-only", "I: level 2 conflict maps to force-only");
  const fb = [...t.d.querySelectorAll("#feedbackRegion .feedback-block")].map(
    (p) => p.textContent,
  );
  eq(fb.length, 3, "I: predict wrong feedback has three blocks");
  eq(
    fb[2],
    t.dbg().I18N.en.tipForceOnly,
    "I: predict block 3 is the recorded-category tip",
  );
  ok(
    fb[1].indexOf("The correct result is clockwise initial turn.") === 0,
    "I: predictionReveal names the result",
  );
  ok(
    fb[1].indexOf(t.dbg().I18N.en.compareProducts) !== -1,
    "I: predictionReveal includes the reason",
  );
  ok(
    fb[0].indexOf("Net moment: −2 N·m") !== -1,
    "I: integer net with Unicode minus",
  );

  /* difficulty 3: strips + direction icons + optional totals guide */
  t = boot({ query: "?debug=1&scenario=predict-l3-07" });
  stubBoardRect(t, 800, 500);
  rows = [...t.d.querySelectorAll("#stripRegion .strip-row")];
  eq(rows.length, 3, "I: level 3 shows one row per force");
  const zeroMarkers = t.d.querySelectorAll("#stripRegion .strip-zero");
  eq(zeroMarkers.length, 1, "I: pivot force gets the outlined zero marker");
  ok(zeroMarkers[0].textContent.indexOf("0 N·m") === 0, "I: zero marker text");
  ok(!t.el("hintBtn").hidden, "I: level 3 offers the moment guide");
  const st3 = t.dbg().state;
  t.el("hintBtn").click();
  ok(st3.hintShown === true, "I: hint sets hintShown");
  eq(st3.attemptCount, 0, "I: hint records no attempt");
  eq(st3.roundIndex, 0, "I: hint keeps the scenario");
  rows = [...t.d.querySelectorAll("#stripRegion .strip-row")];
  eq(rows.length, 5, "I: guide adds the two directional totals");
  ok(
    [...t.d.querySelectorAll("#feedbackRegion .feedback-block")].length === 0,
    "I: guide reveals no classification",
  );
  t.el("answerCcwBtn").click();
  t.settle();
  eq(st3.firstTryCorrect, 1, "I: hint did not change scoring");
  console.log("ok   I. predict contract");
}

/* ===== J. Shared reveal ordering, locks, reduced motion, hidden tab ===== */
{
  let t = boot({ query: "?debug=1&scenario=predict-l2-01" });
  stubBoardRect(t, 800, 500);
  const st = t.dbg().state;
  t.el("answerBalancedBtn").click();
  ok(
    t.d.querySelectorAll("#feedbackRegion .feedback-block").length === 0,
    "J: numeric feedback hidden while the reveal is running",
  );
  const seen = [st.revealPhase.kind];
  for (let i = 0; i < 40; i += 1) {
    t.step(60);
    const kind = st.revealPhase.kind;
    if (seen[seen.length - 1] !== kind) {
      seen.push(kind);
    }
  }
  eq(
    seen,
    ["force", "totals", "net", "motion", "complete"],
    "J: reveal phase order",
  );
  ok(
    t.d.querySelectorAll("#feedbackRegion .feedback-block").length > 0,
    "J: numeric feedback appears once the reveal completes",
  );
  ok(t.active() === t.el("nextBtn"), "J: Next focused when reveal completes");

  /* hidden tab pauses; visible resumes */
  t = boot({ query: "?debug=1&scenario=predict-l1-02" });
  stubBoardRect(t, 800, 500);
  const st2 = t.dbg().state;
  t.el("answerCcwBtn").click();
  eq(st2.revealPhase.kind, "force", "J: reveal starts in force phase");
  setHidden(t, true);
  for (let i = 0; i < 30; i += 1) {
    t.step(200);
  }
  eq(st2.revealPhase.kind, "force", "J: hidden tab freezes the reveal");
  eq(st2.attemptCount, 1, "J: hidden tab records no extra answer");
  setHidden(t, false);
  t.settle();
  eq(
    st2.revealPhase.kind,
    "complete",
    "J: reveal resumes after visibility returns",
  );

  /* reduced motion: immediate complete state, no waiting */
  t = boot({ query: "?debug=1&scenario=predict-l1-02", reducedMotion: true });
  stubBoardRect(t, 800, 500);
  const st3 = t.dbg().state;
  t.el("answerCcwBtn").click();
  eq(st3.revealPhase.kind, "complete", "J: reduced motion completes instantly");
  ok(!t.el("nextBtn").hidden, "J: reduced motion shows Next immediately");
  ok(
    !t.el("stageNextBtn").hidden,
    "J: reduced motion shows the on-stage Next too",
  );
  ok(
    t.d.querySelectorAll("#feedbackRegion .feedback-block").length === 2,
    "J: reduced motion shows full feedback immediately",
  );
  const rows = t.d.querySelectorAll("#stripRegion .strip-row").length;
  ok(rows >= 3, "J: reduced motion shows the final strips");
  /* resize during a round changes no physics state */
  const beforeResize =
    JSON.stringify(st3.sessionScenarioIds) + st3.attemptCount;
  stubBoardRect(t, 640, 400);
  eq(
    JSON.stringify(st3.sessionScenarioIds) + st3.attemptCount,
    beforeResize,
    "J: resize never changes a force or records an answer",
  );
  console.log("ok   J. reveal choreography");
}

/* ===== K. Section 7.4 transitions, leave confirmation, focus ===== */
{
  const t = boot({});
  const st = t.dbg().state;
  /* explore -> gameSetup preserves explore */
  t.dbg().actions.setForceProperty("x", 1.5);
  t.el("modeGameBtn").click();
  eq(st.phase, "gameSetup", "K: Game opens setup");
  ok(t.active() === t.el("startBtn"), "K: Game Start focused");
  /* gameSetup -> explore clears session, preserves forces */
  t.el("modeExploreBtn").click();
  eq(st.phase, "explore", "K: back to Explore from setup");
  eq(st.forces[0].x, 1.5, "K: Explore forces preserved");
  ok(t.active() === t.el("board"), "K: Explore canvas focused");
  /* start a balance session */
  startGame(t, "balance", 1);
  eq(st.phase, "gameRound", "K: session starts");
  eq(
    t.el("board").getAttribute("aria-label"),
    t.dbg().I18N.en.canvasBalanceAria,
    "K: canvas aria switches to the balance description on session start",
  );
  ok(t.el("gameSetupSection").hidden, "K: setup leaves the visual field");
  ok(!t.el("roundSection").hidden, "K: round section visible");
  /* leave confirmation */
  t.el("modeExploreBtn").click();
  ok(st.leaveConfirmOpen === true, "K: leave confirmation opens");
  eq(st.phase, "gameRound", "K: phase unchanged under confirmation");
  ok(t.active() === t.el("stayBtn"), "K: Stay focused");
  ok(
    t
      .el("liveRegion")
      .textContent.indexOf(t.dbg().I18N.en.leaveGameQuestion) !== -1,
    "K: confirmation question announced",
  );
  eq(
    t.el("stayBtn").getAttribute("aria-describedby"),
    "leaveQuestion",
    "K: Stay describes the question",
  );
  eq(
    t.el("leaveBtn").getAttribute("aria-describedby"),
    "leaveQuestion",
    "K: Leave game describes the question",
  );
  ok(t.el("checkBtn").disabled, "K: round controls inert under confirmation");
  ok(
    t.el("prevSocketBtn").disabled,
    "K: position buttons inert under confirmation",
  );
  key(t, "ArrowRight", t.el("board"));
  eq(
    st.balancePlacement.socketX,
    null,
    "K: round shortcuts suppressed under confirmation",
  );
  /* language switching stays available and retranslates the question */
  t.el("langBtn").click();
  ok(
    st.leaveConfirmOpen === true,
    "K: language switch keeps confirmation open",
  );
  eq(
    t.el("leaveQuestion").textContent,
    t.dbg().I18N.pl.leaveGameQuestion,
    "K: confirmation retranslated",
  );
  t.el("langBtn").click();
  /* Stay restores exact availability */
  t.el("stayBtn").click();
  ok(st.leaveConfirmOpen === false, "K: Stay closes confirmation");
  ok(
    t.active() === t.el("modeExploreBtn"),
    "K: focus returns to the invoking mode control",
  );
  eq(st.attemptCount, 0, "K: no attempt recorded by confirmation");
  key(t, "ArrowRight", t.el("board"));
  eq(st.balancePlacement.socketX, 1, "K: round input restored after Stay");
  /* Escape also stays */
  t.el("modeExploreBtn").click();
  key(t, "Escape");
  ok(st.leaveConfirmOpen === false, "K: Escape closes confirmation");
  eq(st.balancePlacement.socketX, 1, "K: state unchanged after Escape");
  /* Leave clears the session and returns to Explore */
  t.el("modeExploreBtn").click();
  t.el("leaveBtn").click();
  eq(st.phase, "explore", "K: Leave returns to Explore");
  eq(
    t.el("board").getAttribute("aria-label"),
    t.dbg().I18N.en.canvasExploreAria,
    "K: canvas aria returns to the explore description after leaving",
  );
  eq(st.sessionScenarioIds.length, 0, "K: Leave clears the session");
  eq(st.forces[0].x, 1.5, "K: Leave preserves Explore forces");
  ok(t.active() === t.el("board"), "K: Leave focuses the canvas");
  /* returning to Game starts at setup */
  t.el("modeGameBtn").click();
  eq(st.phase, "gameSetup", "K: returning to Game lands on setup");
  console.log("ok   K. transitions and leave confirmation");
}

/* ===== L. Guide steps in EN and PL, interactions, snapshot ===== */
for (const langCode of ["en", "pl"]) {
  const t = boot({
    introSeen: false,
    lang: langCode === "pl" ? "pl-PL" : "en-US",
  });
  stubBoardRect(t, 800, 500);
  const I = t.dbg().I18N[langCode];
  const gs = t.dbg().guideState;
  eq(
    t.dbg().state.lang,
    langCode,
    "L(" + langCode + "): language from navigator",
  );
  if (langCode === "en") {
    /* live language switch inside the Guide retranslates the step in place */
    const titleBefore = t.el("introStepTitle").textContent;
    t.el("langBtn").click();
    eq(t.d.documentElement.lang, "pl", "L: mid-guide switch flips language");
    eq(
      t.el("introStepTitle").textContent,
      t.dbg().I18N.pl.guideRecords[0].title,
      "L: guide title retranslates in place",
    );
    eq(
      t.el("introCommentary1").textContent,
      t.dbg().I18N.pl.guideRecords[0].commentary[0],
      "L: guide commentary retranslates in place",
    );
    t.el("langBtn").click();
    eq(
      t.el("introStepTitle").textContent,
      titleBefore,
      "L: switch back restores the English title",
    );
  }
  for (let stepNo = 1; stepNo <= 9; stepNo += 1) {
    t.dbg().guide.goto(stepNo);
    t.settle();
    const record = I.guideRecords[stepNo - 1];
    eq(
      t.el("introStepTitle").textContent,
      record.title,
      "L(" + langCode + "): title step " + stepNo,
    );
    eq(
      t.el("introCommentary1").textContent,
      record.commentary[0],
      "L(" + langCode + "): commentary 1 step " + stepNo,
    );
    eq(
      t.el("introCommentary2").textContent,
      record.commentary[1],
      "L(" + langCode + "): commentary 2 step " + stepNo,
    );
    ok(
      t.el("introCounter").textContent.indexOf(String(stepNo)) !== -1,
      "L(" + langCode + "): counter step " + stepNo,
    );
  }
  /* step 2: two sequential predictions with direction-specific retry copy */
  t.dbg().guide.goto(2);
  t.settle();
  const findBtn = (text) =>
    [...t.el("guideLayer").querySelectorAll("button")].find(
      (b) => b.textContent === text,
    );
  findBtn(I.guideChooseCcw).click();
  ok(
    t.el("guideLayer").textContent.indexOf(I.guideWrongCw) !== -1,
    "L(" + langCode + "): wrong choice shows clockwise retry copy",
  );
  ok(
    !t.el("introPrevBtn").disabled,
    "L(" + langCode + "): guide errors never block Previous",
  );
  findBtn(I.guideChooseCw).click();
  ok(gs.scene.solved[0] === true, "L(" + langCode + "): first variant solved");
  findBtn(I.nextExample).click();
  eq(gs.scene.variantIndex, 1, "L(" + langCode + "): second variant loads");
  findBtn(I.guideChooseCw).click();
  ok(
    t.el("guideLayer").textContent.indexOf(I.guideWrongCcw) !== -1,
    "L(" + langCode + "): second variant wrong shows ccw retry copy",
  );
  findBtn(I.guideChooseCcw).click();
  ok(gs.scene.solved[1] === true, "L(" + langCode + "): second variant solved");
  /* steps 3 and 4 variant toggles */
  t.dbg().guide.goto(3);
  t.settle();
  findBtn(I.far).click();
  eq(gs.scene.variant, "far", "L(" + langCode + "): far variant");
  t.dbg().guide.goto(4);
  t.settle();
  findBtn(I.largerForce).click();
  eq(gs.scene.variant, "strong", "L(" + langCode + "): strong variant");
  /* step 5 cards */
  t.dbg().guide.goto(5);
  t.settle();
  eq(
    t.el("guideLayer").querySelector(".guide-question").textContent,
    I.guideZeroQuestion,
    "L(" + langCode + "): zero question first",
  );
  const cards = () => [...t.el("guideLayer").querySelectorAll(".guide-card")];
  eq(cards().length, 3, "L(" + langCode + "): three DOM card buttons");
  ok(
    cards().every((c) => c.querySelector("svg") !== null),
    "L(" + langCode + "): cards carry diagrams",
  );
  cards()[1].click();
  ok(
    t.el("guideLayer").textContent.indexOf(I.guideWrongZero) !== -1,
    "L(" + langCode + "): wrong zero answer copy",
  );
  ok(
    t.el("liveRegion").textContent.indexOf(I.guideWrongZero) !== -1,
    "L(" + langCode + "): wrong pick announced through the live region",
  );
  const cardABefore = cards()[0];
  const cardAAccessibleBefore = accessibleButtonText(cardABefore);
  cardABefore.focus();
  cardABefore.click();
  const cardAAfter = cards()[0];
  eq(
    t.el("guideLayer").querySelector(".guide-question").textContent,
    I.guideLargestQuestion,
    "L(" + langCode + "): second question after A",
  );
  ok(
    t.el("liveRegion").textContent.indexOf(I.guideLargestQuestion) !== -1,
    "L(" + langCode + "): question change announced",
  );
  ok(
    t.active() === cardAAfter,
    "L(" + langCode + "): Step 5 keeps focus on card A after its reveal",
  );
  ok(
    revealedCardValueIsExposed(cardAAfter, cardAAccessibleBefore),
    "L(" + langCode + "): card A exposes its revealed distance and moment",
  );
  cards()[1].click();
  ok(
    t.el("guideLayer").textContent.indexOf(I.guideWrongLargest) !== -1,
    "L(" + langCode + "): wrong largest answer copy",
  );
  const cardCBefore = cards()[2];
  const cardCAccessibleBefore = accessibleButtonText(cardCBefore);
  cardCBefore.focus();
  cardCBefore.click();
  const cardCAfter = cards()[2];
  ok(
    gs.scene.revealedAll === true,
    "L(" + langCode + "): full construction revealed",
  );
  ok(
    t.active() === cardCAfter,
    "L(" + langCode + "): Step 5 keeps focus on card C after its reveal",
  );
  ok(
    revealedCardValueIsExposed(cardCAfter, cardCAccessibleBefore),
    "L(" + langCode + "): card C exposes its revealed distance and moment",
  );
  ok(
    cards().every((card) => revealedCardValueIsExposed(card, "")),
    "L(" + langCode + "): every card exposes every revealed value line",
  );
  ok(
    cards().every((c) => !c.disabled),
    "L(" + langCode + "): revealed cards are not dimmed by disabling",
  );
  cards()[1].click();
  ok(
    gs.scene.revealedAll === true &&
      t.el("guideLayer").textContent.indexOf(I.guideWrongLargest) === -1,
    "L(" + langCode + "): cards are inert after the full reveal",
  );
  /* step 6 equations from sceneCopy */
  t.dbg().guide.goto(6);
  t.settle();
  const texts6 = [
    ...t.el("guideLayer").querySelectorAll(".guide-scene-text"),
  ].map((n) => n.textContent);
  eq(
    texts6,
    I.guideRecords[5].sceneCopy,
    "L(" + langCode + "): step 6 equations verbatim",
  );
  /* step 7 swap */
  t.dbg().guide.goto(7);
  t.settle();
  findBtn(I.swapSides).click();
  ok(gs.scene.swapped === true, "L(" + langCode + "): swap sides");
  eq(
    t.d.querySelectorAll("#stripRegion .strip-row").length,
    2,
    "L(" + langCode + "): step 7 shows two moment bars",
  );
  /* step 8 balance interaction */
  t.dbg().guide.goto(8);
  t.settle();
  ok(
    t.el("guideLayer").textContent.indexOf(I.guideBalancePrompt) !== -1,
    "L(" + langCode + "): balance prompt",
  );
  key(t, "ArrowRight", t.el("board"));
  eq(
    gs.balancePlacement.socketX,
    1,
    "L(" + langCode + "): guide balance keyboard placement",
  );
  key(t, "Enter", t.el("board"));
  t.settle();
  eq(
    gs.balancePlacement.status,
    "placed",
    "L(" + langCode + "): wrong guide check unlocks the arrangement",
  );
  ok(
    t.el("guideLayer").textContent.indexOf(I.notBalancedYet) !== -1,
    "L(" + langCode + "): guide wrong feedback shown",
  );
  key(t, "ArrowRight", t.el("board"));
  key(t, "ArrowRight", t.el("board"));
  eq(
    gs.balancePlacement.socketX,
    3,
    "L(" + langCode + "): moved to the solution",
  );
  key(t, "Enter", t.el("board"));
  t.settle();
  eq(
    gs.balancePlacement.status,
    "revealedCorrect",
    "L(" + langCode + "): guide balance solved",
  );
  ok(
    t.el("guideLayer").textContent.indexOf(I.balancedSuccess) !== -1,
    "L(" + langCode + "): guide success feedback",
  );
  /* step 9 runs the shared reveal and offers the final actions */
  t.dbg().guide.goto(9);
  t.settle();
  eq(
    t.dbg().state.revealPhase.kind,
    "complete",
    "L(" + langCode + "): step 9 reveal completes",
  );
  ok(
    t.el("introNextBtn").hidden,
    "L(" + langCode + "): Next replaced on step 9",
  );
  ok(!t.el("introFinal").hidden, "L(" + langCode + "): final actions visible");
  if (langCode === "en") {
    t.el("startGameBtn").click();
    eq(t.dbg().state.phase, "gameSetup", "L(en): Start game lands on setup");
    ok(t.active() === t.el("startBtn"), "L(en): Start focused from guide");
  } else {
    t.el("startExploringBtn").click();
    eq(
      t.dbg().state.phase,
      "explore",
      "L(pl): Start exploring lands in Explore",
    );
    ok(t.active() === t.el("board"), "L(pl): canvas focused from guide");
    eq(
      {
        x: t.dbg().state.forces[0].x,
        m: t.dbg().state.forces[0].magnitude,
        a: t.dbg().state.forces[0].angleDeg,
      },
      { x: 3, m: 2, a: 270 },
      "L(pl): default Explore setup preserved through the guide",
    );
  }
  try {
    eq(
      t.w.localStorage.getItem("momentIntroSeenV1"),
      "1",
      "L(" + langCode + "): seen key written",
    );
  } catch {
    /* ignore */
  }
}
console.log("ok   L. guide steps EN and PL");

/* ===== L2. Guide replay snapshot and keyboard navigation ===== */
{
  const t = boot({});
  stubBoardRect(t, 800, 500);
  const st = t.dbg().state;
  t.dbg().actions.setForceProperty("x", 1);
  t.dbg().actions.setForceProperty("magnitude", 4.5);
  t.el("guideBtn").click();
  eq(st.phase, "intro", "L2: replay opens the guide");
  ok(t.active() === t.el("introStepTitle"), "L2: step heading focused");
  /* arrow navigation when focus is outside guide interaction controls */
  key(t, "ArrowRight");
  eq(t.dbg().guideState.step, 2, "L2: ArrowRight advances");
  key(t, "ArrowLeft");
  eq(t.dbg().guideState.step, 1, "L2: ArrowLeft goes back");
  /* play with a guide interaction, then exit */
  t.dbg().guide.goto(8);
  t.settle();
  t.dbg().actions.placeMovable(2);
  key(t, "Escape");
  eq(st.phase, "explore", "L2: Escape exits to the previous surface");
  eq(st.forces[0].x, 1, "L2: snapshot restored force position");
  eq(st.forces[0].magnitude, 4.5, "L2: snapshot restored magnitude");
  eq(st.introReturn, null, "L2: introReturn cleared");
  ok(t.active() === t.el("guideBtn"), "L2: focus returns to the opener");
  /* replay during a game session snapshot */
  startGame(t, "predict", 1);
  const ids = st.sessionScenarioIds.slice();
  t.el("answerCcwBtn").click();
  t.settle();
  t.el("nextBtn").click();
  eq(st.roundIndex, 1, "L2: round 2 active");
  t.el("modeExploreBtn").click();
  t.el("leaveBtn").click();
  startGame(t, "balance", 1);
  void ids;
  /* The Guide is reachable from every phase and returns the child exactly
     where they were — including mid-round, with the score intact. */
  {
    const g = boot({ query: "?debug=1&scenario=balance-l2-01" });
    stubBoardRect(g, 800, 500);
    const gs = g.dbg().state;
    ok(!g.el("guideBtn").hidden, "L2: Guide reachable during a round");
    g.dbg().actions.placeMovable(3);
    g.el("checkBtn").click();
    g.settle();
    g.el("nextBtn").click();
    g.dbg().actions.placeMovable(2);
    const before = {
      phase: gs.phase,
      round: gs.roundIndex,
      score: gs.firstTryCorrect,
      socket: gs.balancePlacement.socketX,
      ids: gs.sessionScenarioIds.slice(),
    };
    g.el("guideBtn").click();
    eq(gs.phase, "intro", "L2: Guide opens from an active round");
    g.dbg().guide.goto(4);
    g.el("exitGuideBtn").click();
    eq(
      {
        phase: gs.phase,
        round: gs.roundIndex,
        score: gs.firstTryCorrect,
        socket: gs.balancePlacement.socketX,
        ids: gs.sessionScenarioIds.slice(),
      },
      before,
      "L2: leaving the Guide restores the round exactly",
    );
    ok(
      g.active() === g.el("guideBtn"),
      "L2: focus returns to the Guide button",
    );
    /* locked while a reveal plays, like the mode buttons */
    g.el("checkBtn").click();
    ok(g.el("guideBtn").disabled, "L2: Guide locked during a reveal");
    g.settle();
    ok(!g.el("guideBtn").disabled, "L2: Guide unlocked after the reveal");
    /* and reachable from the summary */
    const sum = boot({ query: "?debug=1&seed=11" });
    stubBoardRect(sum, 800, 500);
    startGame(sum, "predict", 1);
    for (let round = 0; round < 8; round += 1) {
      const rec = currentRec(sum);
      sum.dbg().actions.predictAnswer(rec.expectedResult);
      sum.settle();
      sum.el("nextBtn").click();
    }
    sum.dbg().actions.dismissResultWash();
    eq(sum.dbg().state.phase, "gameSummary", "L2: summary reached");
    ok(!sum.el("guideBtn").disabled, "L2: Guide reachable from the summary");
    sum.el("guideBtn").click();
    eq(sum.dbg().state.phase, "intro", "L2: Guide opens from the summary");
    sum.el("exitGuideBtn").click();
    eq(
      sum.dbg().state.phase,
      "gameSummary",
      "L2: leaving the Guide returns to the summary",
    );
    eq(
      sum.dbg().state.firstTryCorrect,
      8,
      "L2: the summary score survives the detour",
    );
  }
  console.log("ok   L2. guide snapshot and navigation");
}

/* ===== M. Language switch during each phase ===== */
{
  const t = boot({ query: "?debug=1&scenario=balance-l1-01" });
  stubBoardRect(t, 800, 500);
  const st = t.dbg().state;
  /* during a round */
  t.el("langBtn").click();
  eq(st.lang, "pl", "M: language switched in round");
  eq(st.phase, "gameRound", "M: phase preserved");
  eq(
    t.el("missionPrompt").textContent,
    t.dbg().I18N.pl.balanceMission,
    "M: mission retranslated",
  );
  eq(t.d.title, t.dbg().I18N.pl.title, "M: document title retranslated");
  eq(t.d.documentElement.lang, "pl", "M: html lang updated");
  eq(
    t.el("board").getAttribute("aria-label"),
    t.dbg().I18N.pl.canvasBalanceAria,
    "M: canvas aria retranslated",
  );
  /* during feedback */
  t.dbg().actions.placeMovable(1);
  t.el("checkBtn").click();
  t.settle();
  const plBlocks = [
    ...t.d.querySelectorAll("#feedbackRegion .feedback-block"),
  ].map((p) => p.textContent);
  ok(
    plBlocks[1] === t.dbg().I18N.pl.balancedSuccess,
    "M: feedback rendered in Polish",
  );
  t.el("langBtn").click();
  const enBlocks = [
    ...t.d.querySelectorAll("#feedbackRegion .feedback-block"),
  ].map((p) => p.textContent);
  ok(
    enBlocks[1] === t.dbg().I18N.en.balancedSuccess,
    "M: feedback retranslates in place",
  );
  eq(st.firstTryCorrect, 1, "M: progress preserved across switches");
  /* summary phase */
  for (let round = 1; round < 8; round += 1) {
    t.el("nextBtn").click();
    const rec = currentRec(t);
    t.dbg().actions.placeMovable(rec.solutionX);
    t.el("checkBtn").click();
    t.settle();
  }
  t.el("nextBtn").click();
  eq(st.phase, "gameSummary", "M: summary reached");
  ok(st.resultWashOpen === true, "M: wash open");
  const wash = t.d.querySelector(".result-overlay");
  ok(wash !== null, "M: wash overlay in DOM");
  ok(wash.className.indexOf("tier-perfect") !== -1, "M: 8/8 wash tier");
  eq(
    wash.getAttribute("aria-label"),
    t.dbg().I18N.en.sessionComplete,
    "M: wash is a named dialog",
  );
  eq(wash.getAttribute("aria-modal"), "true", "M: wash is marked modal");
  const mainEl = t.d.querySelector("main");
  if ("inert" in mainEl) {
    ok(mainEl.inert === true, "M: main is inert while the wash is open");
    ok(
      t.d.querySelector("header").inert === true,
      "M: header is inert while the wash is open",
    );
  }
  const tabEv = new t.w.KeyboardEvent("keydown", {
    key: "Tab",
    bubbles: true,
    cancelable: true,
  });
  const tabNotPrevented = t.d.dispatchEvent(tabEv);
  ok(!tabNotPrevented, "M: Tab is trapped while the wash is open");
  key(t, "Escape");
  ok(st.resultWashOpen === false, "M: Escape dismisses the wash");
  if ("inert" in mainEl) {
    ok(mainEl.inert === false, "M: inert cleared after wash dismissal");
  }
  ok(
    t.active() === t.el("summaryHeading"),
    "M: focus lands on the summary heading",
  );
  eq(
    t.d.querySelectorAll("#summaryStars .star.on").length,
    3,
    "M: 8/8 lights three stars",
  );
  eq(
    t.d.querySelectorAll("#summaryStars .star").length,
    3,
    "M: summary always renders three star slots",
  );
  eq(
    t.el("summaryStars").getAttribute("aria-label"),
    "Stars earned: 3 of 3",
    "M: star tier has a textual equivalent",
  );
  eq(
    t.el("summaryStars").getAttribute("role"),
    "img",
    "M: star row exposed as a labeled image",
  );
  eq(
    t.el("summaryTip").textContent,
    t.dbg().I18N.en.tipStrong,
    "M: strong tip at 8/8",
  );
  eq(t.el("summaryAccuracy").textContent, "100%", "M: accuracy value");
  t.el("langBtn").click();
  eq(
    t.el("summaryHeading").textContent,
    t.dbg().I18N.pl.sessionComplete,
    "M: summary retranslates",
  );
  eq(
    t.el("summaryTip").textContent,
    t.dbg().I18N.pl.tipStrong,
    "M: tip retranslates",
  );
  eq(
    t.el("summaryStars").getAttribute("aria-label"),
    "Zdobyte gwiazdki: 3 z 3",
    "M: star tier label retranslates",
  );
  /* play again draws a fresh session */
  const oldIds = st.sessionScenarioIds.slice();
  t.el("playAgainBtn").click();
  eq(st.phase, "gameRound", "M: play again starts round 1");
  eq(st.roundIndex, 0, "M: play again resets rounds");
  eq(st.firstTryCorrect, 0, "M: play again resets score");
  ok(
    t.active() === t.el("board"),
    "M: play again focuses the movable force (primary interaction)",
  );
  const overlapCount = st.sessionScenarioIds.filter(
    (id) => oldIds.indexOf(id) !== -1,
  ).length;
  ok(
    overlapCount <= 4,
    "M: play again avoids repeating more than four records",
  );
  /* leave the fresh session via the confirmation (summary paths are in O) */
  t.el("modeExploreBtn").click();
  t.el("leaveBtn").click();
  console.log("ok   M. language switching and summary");
}

/* ===== N. Debug scenarios: all 72 ids, invalid id, normal mode ===== */
{
  const probe = boot({});
  const allIds = probe.dbg().bank.map((r) => r.id);
  let scenarioFailures = 0;
  for (const id of allIds) {
    const t = boot({ query: "?debug=1&scenario=" + id });
    const st = t.dbg().state;
    const rec = t.dbg().bank.find((r) => r.id === id);
    if (
      st.phase !== "gameRound" ||
      st.gameType !== rec.game ||
      st.difficulty !== rec.difficulty ||
      st.sessionScenarioIds[0] !== id
    ) {
      scenarioFailures += 1;
      ok(false, "N: scenario " + id + " did not open correctly");
    }
  }
  ok(scenarioFailures === 0, "N: all 72 debug scenarios open");
  const bad = boot({ query: "?debug=1&scenario=nope-99" });
  ok(
    bad.consoleErrors.some((m) => m.indexOf("Unknown debug scenario") !== -1),
    "N: invalid scenario logs a debug-only error",
  );
  eq(
    bad.dbg().state.phase,
    "explore",
    "N: invalid scenario falls back to normal start",
  );
  const normal = boot({ query: "" });
  ok(normal.w.__momentTest === undefined, "N: no debug API in normal mode");
  ok(normal.consoleErrors.length === 0, "N: no console errors in normal mode");
  console.log("ok   N. debug scenarios");
}

/* ===== O. Full sessions, star thresholds, tip mapping ===== */
{
  function playPredictSession(correctRounds, dismiss) {
    const t = boot({ query: "?debug=1&seed=11" });
    startGame(t, "predict", 1);
    const st = t.dbg().state;
    for (let round = 0; round < 8; round += 1) {
      const rec = currentRec(t);
      const wrong = rec.expectedResult === "cw" ? "ccw" : "cw";
      t.dbg().actions.predictAnswer(
        round < correctRounds ? rec.expectedResult : wrong,
      );
      t.settle();
      t.el("nextBtn").click();
    }
    eq(
      st.phase,
      "gameSummary",
      "O: session of " + correctRounds + " ends in summary",
    );
    const wash = t.d.querySelector(".result-overlay");
    if (dismiss === "click") {
      wash.dispatchEvent(new t.w.Event("click", { bubbles: true }));
    } else if (dismiss === "enter") {
      key(t, "Enter", wash);
    } else if (dismiss === "space") {
      key(t, " ", wash);
    } else {
      t.dbg().actions.dismissResultWash();
    }
    return { t, st };
  }
  let r = playPredictSession(8, "click");
  ok(
    r.t.d.querySelector(".result-overlay") === null,
    "O: pointer click dismisses the wash",
  );
  ok(
    r.t.active() === r.t.el("summaryHeading"),
    "O: click dismissal focuses the heading",
  );
  eq(starsOn(r.t), 3, "O: 8/8 three stars");
  r = playPredictSession(6, "enter");
  ok(
    r.t.d.querySelector(".result-overlay") === null,
    "O: Enter dismisses the wash",
  );
  eq(starsOn(r.t), 2, "O: 6/8 two stars");
  eq(
    r.t.el("summaryStars").getAttribute("aria-label"),
    "Stars earned: 2 of 3",
    "O: partial tier labeled textually",
  );
  eq(r.st.firstTryCorrect, 6, "O: first-try count 6");
  r = playPredictSession(5, "space");
  ok(
    r.t.d.querySelector(".result-overlay") === null,
    "O: Space dismisses the wash",
  );
  eq(starsOn(r.t), 1, "O: 5/8 one star");
  r = playPredictSession(0);
  eq(starsOn(r.t), 1, "O: 0/8 one star");
  ok(
    r.t.el("summaryTip").textContent.length > 0,
    "O: misconception tip shown after errors",
  );
  eq(
    r.t.el("hudFirstTry").textContent,
    "First-try correct: 0/8",
    "O: HUD first-try counts recorded rounds",
  );
  /* CHANGE_GAME from the summary: CLEAR_SESSION and focus Game Start */
  r = playPredictSession(8);
  r.t.el("changeGameBtn").click();
  eq(r.st.phase, "gameSetup", "O: Change game lands on setup");
  ok(r.t.active() === r.t.el("startBtn"), "O: Change game focuses Game Start");
  eq(r.st.firstTryCorrect, 0, "O: Change game clears the session");
  /* live language switch during gameSetup retranslates the setup labels */
  r.t.el("langBtn").click();
  eq(
    r.t.el("startBtn").textContent,
    r.t.dbg().I18N.pl.startRounds,
    "O: setup labels retranslate on a live switch",
  );
  r.t.el("langBtn").click();
  /* selecting Explore from the summary switches directly, no confirmation */
  r = playPredictSession(8);
  r.t.el("modeExploreBtn").click();
  eq(r.st.phase, "explore", "O: Explore from summary switches directly");
  ok(
    r.t.el("leaveConfirmSection").hidden,
    "O: no leave confirmation from the summary",
  );
  ok(
    r.t.active() === r.t.el("board"),
    "O: Explore from summary focuses the canvas",
  );
  /* a full balance ★★★ session */
  const t = boot({ query: "?debug=1&seed=5" });
  startGame(t, "balance", 3);
  const st = t.dbg().state;
  for (let round = 0; round < 8; round += 1) {
    const rec = currentRec(t);
    eq(rec.forces.length, 2, "O: level 3 has two fixed forces");
    t.dbg().actions.placeMovable(rec.solutionX);
    t.el("checkBtn").click();
    t.settle();
    t.el("nextBtn").click();
  }
  eq(st.phase, "gameSummary", "O: balance level 3 session completes");
  eq(st.firstTryCorrect, 8, "O: balance level 3 all correct");
  console.log("ok   O. sessions and stars");
}

/* ===== P. Static markup, hidden controls, EN/PL purity ===== */
{
  /* Child-facing copy must have one source of truth: the inline I18N
     object. The house review gate (html/missing-title,
     html/icon-button-missing-label, html/form-control-missing-label)
     requires a non-empty static <title>, static accessible names on
     icon-only buttons, and static labels on form controls, so plain
     absence of static copy cannot pass both gates. The enforced
     invariant is therefore: every child-facing text or accessible-name
     string present in the static markup must be identical to what the
     booted English app renders for the same element, so static copy can
     never drift from I18N. */
  const staticDom = new JSDOM(HTML);
  const sd = staticDom.window.document;
  const enBoot = boot({});
  const technicalText =
    /^(?:EN|PL|F1|F2|F↔|M|N|m|N·m|[\d\s.,+\-−–—×·=⊥↶↷←→↑↓★]+(?:N|m|N·m)?)$/u;
  const staticTextIssues = [];
  if (
    normalizedText(sd.title) &&
    normalizedText(sd.title) !== normalizedText(enBoot.d.title)
  ) {
    staticTextIssues.push(
      "head>title=" + JSON.stringify(normalizedText(sd.title)),
    );
  }
  const comparedText = new Set();
  const walker = sd.createTreeWalker(
    sd.body,
    sd.defaultView.NodeFilter.SHOW_TEXT,
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (
      !parent ||
      ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(parent.tagName)
    ) {
      continue;
    }
    const value = normalizedText(node.nodeValue);
    if (
      !value ||
      !/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/u.test(value) ||
      technicalText.test(value)
    ) {
      continue;
    }
    if (!parent.id) {
      staticTextIssues.push(
        parent.tagName.toLowerCase() +
          " without id carries copy " +
          JSON.stringify(value),
      );
      continue;
    }
    if (comparedText.has(parent.id)) {
      continue;
    }
    comparedText.add(parent.id);
    const live = enBoot.el(parent.id);
    const staticValue = normalizedText(parent.textContent);
    const liveValue = live ? normalizedText(live.textContent) : null;
    if (staticValue !== liveValue) {
      staticTextIssues.push(
        "#" +
          parent.id +
          "=" +
          JSON.stringify(staticValue) +
          " but boot renders " +
          JSON.stringify(liveValue),
      );
    }
  }
  const staticAttributeIssues = [];
  for (const element of sd.body.querySelectorAll(
    "[aria-label], [title], [placeholder]",
  )) {
    for (const attribute of ["aria-label", "title", "placeholder"]) {
      const value = normalizedText(element.getAttribute(attribute));
      if (!value) {
        continue;
      }
      if (!element.id) {
        staticAttributeIssues.push(
          element.tagName.toLowerCase() +
            " without id carries " +
            attribute +
            "=" +
            JSON.stringify(value),
        );
        continue;
      }
      const live = enBoot.el(element.id);
      const liveValue = live
        ? normalizedText(live.getAttribute(attribute))
        : null;
      if (value !== liveValue) {
        staticAttributeIssues.push(
          "#" +
            element.id +
            "[" +
            attribute +
            "]=" +
            JSON.stringify(value) +
            " but boot renders " +
            JSON.stringify(liveValue),
        );
      }
    }
  }
  ok(
    staticTextIssues.length === 0,
    "P: static child-facing prose matches the booted I18N rendering" +
      (staticTextIssues.length
        ? " (found " +
          staticTextIssues.length +
          ": " +
          staticTextIssues.slice(0, 6).join("; ") +
          ")"
        : ""),
  );
  ok(
    staticAttributeIssues.length === 0,
    "P: static accessible-name copy matches the booted I18N rendering" +
      (staticAttributeIssues.length
        ? " (found " +
          staticAttributeIssues.length +
          ": " +
          staticAttributeIssues.slice(0, 6).join("; ") +
          ")"
        : ""),
  );
  /* after switching to PL, translated ids no longer show EN-only strings */
  const t = boot({ lang: "pl-PL" });
  const PL = t.dbg().I18N.pl;
  eq(t.d.title, PL.title, "P: PL boot title");
  eq(t.el("subtitleText").textContent, PL.subtitle, "P: PL subtitle");
  eq(t.el("modeExploreBtn").textContent, PL.explore, "P: PL explore label");
  eq(t.el("resetBtn").textContent, PL.resetExperiment, "P: PL reset label");
  eq(
    t.el("langBtn").getAttribute("aria-label"),
    PL.switchLanguage,
    "P: PL langBtn aria",
  );
  eq(
    t.el("homeLink").getAttribute("aria-label"),
    PL.backLearn,
    "P: PL home aria",
  );
  eq(
    t.el("board").getAttribute("aria-label"),
    PL.canvasExploreAria,
    "P: PL canvas aria",
  );
  eq(
    t.el("diff1Btn").getAttribute("aria-label"),
    PL.balanceDifficulty1Aria,
    "P: PL difficulty aria",
  );
  /* hidden phase controls are marked hidden in explore */
  ok(t.el("roundSection").hidden, "P: round section hidden in Explore");
  ok(t.el("gameSetupSection").hidden, "P: setup hidden in Explore");
  ok(t.el("summarySection").hidden, "P: summary hidden in Explore");
  ok(t.el("leaveConfirmSection").hidden, "P: confirmation hidden in Explore");
  console.log("ok   P. markup and translation hygiene");
}

/* ===== Q. Exposed selection state (WCAG 4.1.2) ===== */
{
  const t = boot({});
  stubBoardRect(t, 800, 500);
  expectExclusiveSelection(
    t,
    ["modeExploreBtn", "modeGameBtn"],
    "modeExploreBtn",
    "Q: Explore/Game exposes the selected mode",
  );
  expectExclusiveSelection(
    t,
    ["oneForceBtn", "twoForcesBtn"],
    "oneForceBtn",
    "Q: one/two-force control exposes the selected count",
  );
  t.el("twoForcesBtn").click();
  expectExclusiveSelection(
    t,
    ["oneForceBtn", "twoForcesBtn"],
    "twoForcesBtn",
    "Q: force-count accessibility state updates",
  );
  expectExclusiveSelection(
    t,
    ["selForce1Btn", "selForce2Btn"],
    "selForce1Btn",
    "Q: selected force is exposed",
  );
  t.el("selForce2Btn").click();
  expectExclusiveSelection(
    t,
    ["selForce1Btn", "selForce2Btn"],
    "selForce2Btn",
    "Q: selected-force accessibility state updates",
  );
  t.el("modeGameBtn").click();
  expectExclusiveSelection(
    t,
    ["modeExploreBtn", "modeGameBtn"],
    "modeGameBtn",
    "Q: Game mode selection is exposed",
  );
  expectExclusiveSelection(
    t,
    ["balanceBtn", "predictBtn"],
    "balanceBtn",
    "Q: selected game type is exposed",
  );
  expectExclusiveSelection(
    t,
    ["diff1Btn", "diff2Btn", "diff3Btn"],
    "diff1Btn",
    "Q: selected difficulty is exposed",
  );
  t.el("predictBtn").click();
  t.el("diff3Btn").click();
  expectExclusiveSelection(
    t,
    ["balanceBtn", "predictBtn"],
    "predictBtn",
    "Q: game-type accessibility state updates",
  );
  expectExclusiveSelection(
    t,
    ["diff1Btn", "diff2Btn", "diff3Btn"],
    "diff3Btn",
    "Q: difficulty accessibility state updates",
  );
  t.el("startBtn").click();
  const record = currentRec(t);
  const answerId = {
    ccw: "answerCcwBtn",
    balanced: "answerBalancedBtn",
    cw: "answerCwBtn",
  }[record.expectedResult];
  t.el(answerId).click();
  expectExclusiveSelection(
    t,
    ["answerCcwBtn", "answerBalancedBtn", "answerCwBtn"],
    answerId,
    "Q: chosen Predict answer is exposed",
  );
  console.log("ok   Q. exposed selection state");
}

if (failures === 0) {
  console.log("OK: " + checks + " DOM checks passed");
  process.exit(0);
} else {
  console.error(failures + " of " + checks + " DOM checks FAILED");
  process.exit(1);
}
