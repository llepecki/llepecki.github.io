#!/usr/bin/env node
// Headless behavioral harness for yesnoreflex/index.html (jsdom).
// Drives the real shipped file with a mocked performance.now()/rAF clock:
// tutorial flow, warm-ups, Practice loop, Sprint timing incl. pause/resume
// rebase, timeouts, EN/PL keyboard contract, storage hardening, panel phase
// matrix, result-overlay modal semantics, the unified colored-shape cue
// system, and the full-viewport switch dialog.
// Run from learn/: npm run yesnoreflex-dom-check
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(
  path.join(here, "..", "yesnoreflex", "index.html"),
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
function eq(a, b, msg) {
  ok(
    JSON.stringify(a) === JSON.stringify(b),
    msg + " (got " + JSON.stringify(a) + ", want " + JSON.stringify(b) + ")",
  );
}

const CUE_SHAPE_IDS = [
  "cuePatch",
  "cueTriangle",
  "cueCircle",
  "cueSquare",
  "cuePentagon",
  "cueStar",
];
const SHAPE_EL_ID = {
  circle: "cueCircle",
  triangle: "cueTriangle",
  square: "cueSquare",
  pentagon: "cuePentagon",
  star: "cueStar",
};
const FILL_CLASSES = [
  "fill-yellow",
  "fill-green",
  "fill-blue",
  "fill-purple",
  "fill-orange",
];

// NOTE (audit F21): ?seed fixes the PRNG seed for the page lifetime, so a
// multi-session test on one boot replays the same stream per session start;
// only the evolving history differentiates sessions. Tests that need stream
// variety boot again with a different seed.
function boot({
  query = "?debug=1&seed=42",
  introSeen = true,
  lang = "en-US",
  storage = null,
  breakStorage = false,
} = {}) {
  const dom = new JSDOM(HTML, {
    url: "https://lepecki.com/learn/yesnoreflex/" + query,
    runScripts: "dangerously",
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
        matches: false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
      });
      Object.defineProperty(window.navigator, "language", {
        get: () => lang,
      });
      try {
        if (introSeen) {
          window.localStorage.setItem("yesnoreflexIntroSeenV1", "1");
        } else {
          window.localStorage.clear();
        }
        if (storage) {
          Object.keys(storage).forEach((k) => {
            window.localStorage.setItem(k, storage[k]);
          });
        }
      } catch {
        /* ignore */
      }
      if (breakStorage) {
        // A storage object whose accessors throw: the app must still play.
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
    dbg: () => w.yesnoreflexDebug,
    el: (id) => w.document.getElementById(id),
    key: (key, init) =>
      w.document.dispatchEvent(
        new w.KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
          ...init,
        }),
      ),
    keyUp: (key) =>
      w.document.dispatchEvent(
        new w.KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }),
      ),
  };
  // Count switch-dialog openings through the element's public `hidden`
  // state (jsdom's MutationObserver is async and would miss synchronous
  // assertions).
  t.switchOpens = 0;
  t.dialogTitles = [];
  const overlay = t.el("switchOverlay");
  let hiddenDesc = null;
  for (let proto = Object.getPrototypeOf(overlay); proto; ) {
    hiddenDesc = Object.getOwnPropertyDescriptor(proto, "hidden");
    if (hiddenDesc) break;
    proto = Object.getPrototypeOf(proto);
  }
  Object.defineProperty(overlay, "hidden", {
    configurable: true,
    get() {
      return hiddenDesc.get.call(overlay);
    },
    set(value) {
      if (value === false && hiddenDesc.get.call(overlay) === true) {
        t.switchOpens += 1;
        t.dialogTitles.push(t.el("swTitle").textContent);
      }
      hiddenDesc.set.call(overlay, value);
    },
  });
  t.dialogOpen = () => !overlay.hidden;
  // The same primitive opens every session and every scored rule change, so
  // classify by the heading the child actually reads.
  const OPENING_TITLES = ["NEW GAME!", "NOWA GRA!"];
  const SWITCH_TITLES = ["SWITCH!", "ZMIANA!"];
  t.openings = () =>
    t.dialogTitles.filter((x) => OPENING_TITLES.indexOf(x) !== -1).length;
  t.ruleSwitches = () =>
    t.dialogTitles.filter((x) => SWITCH_TITLES.indexOf(x) !== -1).length;
  // Dismiss the dialog the way a player does, if one is showing.
  t.clearDialog = () => {
    if (!overlay.hidden) t.el("swContinue").click();
  };
  // Answer both warm-ups correctly; both are untimed and Next-gated. Every
  // session opens on the mapping card, so dismiss that first.
  t.finishWarmups = () => {
    const st = t.dbg().state;
    t.clearDialog();
    while (st.inWarmup) {
      const wt = st.warmupTrials[st.warmupIndex];
      (wt.expectedAnswer ? t.el("btnYes") : t.el("btnNo")).click();
      t.el("nextBtn").click();
    }
  };
  return t;
}
function visibleCueIds(t) {
  return CUE_SHAPE_IDS.filter(
    (id) => !t.el(id).classList.contains("cue-hidden"),
  );
}

/* ===== A. Tutorial (fresh visit, stage-based, demo profile) ===== */
{
  const t = boot({ introSeen: false });
  const { w, el, key } = t;
  const st = t.dbg().state;
  eq(st.phase, "intro", "fresh visit auto-opens tutorial");
  ok(!el("tutZone").hidden, "tutorial step zone shown in stage");
  ok(!el("tutNav").hidden, "tutorial nav shown in stage");
  ok(el("sessionSection").hidden, "tutorial hides Session section");
  ok(!el("ruleKeySection").hidden, "tutorial shows the rule key");
  eq(w.document.activeElement.id, "tutStepTitle", "entry focuses step title");
  ok(el("btnTutNext").hidden, "step 1 Next hidden until solved");
  // One generated, non-persisted demonstration profile (R3 §3.4).
  const demo = st.tutorialProfile;
  ok(demo !== null && typeof demo === "object", "tutorial has a demo profile");
  ok(
    demo.colors.fact !== demo.colors.flip &&
      demo.shapes.fact !== demo.shapes.flip,
    "demo profile assigns distinct tokens",
  );
  ok(Object.isFrozen(demo), "demo profile frozen");
  ok(
    w.localStorage.getItem("yesnoreflexProfileV2") === null,
    "tutorial profile is not persisted",
  );
  // wrong answer first: retry allowed, no advance
  el("btnNo").click();
  ok(
    !el("btnYes").disabled && !el("btnNo").disabled,
    "retry keeps answers enabled",
  );
  ok(el("btnTutNext").hidden, "wrong answer keeps Next hidden");
  el("btnYes").click(); // ani01 truth=yes, no signal -> YES
  ok(!el("btnTutNext").hidden, "correct answer reveals Next");
  eq(w.document.activeElement.id, "btnTutNext", "solved step focuses Next");
  el("btnTutNext").click(); // step 2: the color mapping
  eq(t.dbg().tutorial.step, 1, "advanced to step 2");
  eq(
    w.document.activeElement.id,
    "tutStepTitle",
    "step change refocuses title",
  );
  ok(el("btnYes").disabled, "presentational step disables answers");
  ok(!el("btnTutNext").hidden, "presentational step shows Next");
  ok(!el("tutMap").hidden, "mapping step shows the mapping rows");
  eq(el("tutMap").children.length, 2, "mapping step shows both meanings");
  ok(
    el("tutMap").textContent.indexOf(el("kcFactName").textContent) !== -1,
    "color mapping row names the demo FACT color",
  );
  ok(!el("tutRule").hidden, "mapping step shows the active-rule pill");
  key("ArrowRight"); // navigates on non-interactive step
  eq(t.dbg().tutorial.step, 2, "ArrowRight navigates non-interactive step");
  ok(
    el("tutMap").textContent.indexOf(el("ksFactName").textContent) !== -1,
    "shape mapping row names the demo FACT shape",
  );
  key("ArrowLeft");
  eq(t.dbg().tutorial.step, 1, "ArrowLeft navigates back");
  key(" "); // Space advances presentational steps
  eq(t.dbg().tutorial.step, 2, "Space advances non-interactive step");
  el("btnTutNext").click(); // -> step 4 (FLIP color example, FOLLOW COLOR)
  eq(t.dbg().tutorial.step, 3, "at step 4");
  eq(t.switchOpens, 0, "no switch dialog before the switch step");
  // Pair-per-round: the FLIP example is the demo FLIP color on the swatch.
  eq(
    visibleCueIds(t).join(","),
    "cuePatch",
    "the FLIP color example renders the swatch, never a colored shape",
  );
  ok(
    t.el("cuePatch").classList.contains("fill-" + demo.colors.flip),
    "the swatch carries the demo FLIP color",
  );
  key(" "); // Space must NOT advance an unsolved interactive step
  eq(t.dbg().tutorial.step, 3, "Space ignored on unsolved interactive step");
  key("ArrowLeft"); // wrong: bod01 truth=yes under FLIP -> NO
  eq(t.dbg().tutorial.step, 3, "arrows do not navigate on interactive step");
  ok(el("btnTutNext").hidden, "wrong FLIP answer keeps Next hidden");
  key("ArrowRight"); // correct
  ok(!el("btnTutNext").hidden, "step 4 solved via ArrowRight answer");
  el("btnTutNext").click(); // -> step 5: the switch dialog demo
  eq(t.switchOpens, 1, "switch step demonstrates the dialog");
  ok(t.dialogOpen(), "dialog is showing on the switch step");
  eq(el("swMap").children.length, 2, "demo dialog lists both meanings");
  ok(
    el("swRule").textContent.length > 0,
    "demo dialog names the newly active rule",
  );
  el("swContinue").click();
  ok(!t.dialogOpen(), "demo dialog closes on Continue");
  ok(el("btnTutStart").hidden, "Start Sprint hidden before step 5 solved");
  el("btnYes").click(); // wrong: mat01 FLIP -> NO
  ok(el("btnTutStart").hidden, "wrong answer keeps Start Sprint hidden");
  el("btnNo").click();
  ok(!el("btnTutStart").hidden, "Start Sprint appears after step 5 solved");
  eq(w.document.activeElement.id, "btnTutStart", "final solve focuses Start");
  el("btnTutStart").click();
  t.clearDialog(); // every session opens on the mapping card
  eq(t.dbg().state.phase, "question", "Start Sprint enters the first warm-up");
  ok(st.inWarmup, "tutorial start runs the warm-ups");
  eq(t.dbg().state.mode, "sprint", "mode is sprint");
  ok(
    w.localStorage.getItem("yesnoreflexProfileV2") === null,
    "no cue state is persisted (pair-per-round retired the V2 key)",
  );
  eq(
    w.localStorage.getItem("yesnoreflexIntroSeenV1"),
    "1",
    "intro marked seen",
  );
  ok(
    el("tutZone").hidden && el("tutNav").hidden,
    "tutorial chrome hidden in play",
  );
  console.log("ok   tutorial flow");
}

/* ===== B. Practice end-to-end (L1, seeded) ===== */
{
  const t = boot();
  const { w, el } = t;
  const st = t.dbg().state;
  eq(st.phase, "setup", "returning visit lands on setup");
  el("modePracticeBtn").click();
  ok(el("paceGroup").hidden, "pace hidden in practice");
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  ok(st.inWarmup, "practice session starts in warm-up");
  eq(st.warmupTrials.length, 2, "two warm-up examples");
  ok(!st.warmupTrials[0].invert, "warm-up 1 is a FACT example");
  ok(st.warmupTrials[1].invert, "warm-up 2 is a FLIP example");
  eq(
    st.warmupTrials[0].activeRule,
    st.trials[0].activeRule,
    "warm-ups use the first scored trial's rule",
  );
  ok(el("hudCount").textContent.length > 0, "warm-up HUD tag rendered");
  ok(el("timerRow").classList.contains("idle"), "warm-up untimed");
  // wrong warm-up answer retries the same example (R3 §3.4)
  const wu0 = st.warmupTrials[0];
  (wu0.expectedAnswer ? el("btnNo") : el("btnYes")).click();
  eq(st.phase, "question", "wrong warm-up answer stays on the question");
  eq(st.warmupIndex, 0, "wrong warm-up answer does not advance");
  ok(!el("btnYes").disabled, "wrong warm-up answer allows retry");
  ok(el("nextBtn").hidden, "wrong warm-up answer exposes no Next");
  ok(
    el("feedbackTone").textContent.length > 0,
    "warm-up retry explains the mapping",
  );
  (wu0.expectedAnswer ? el("btnYes") : el("btnNo")).click();
  eq(st.results.length, 0, "warm-up answers record no result");
  ok(!el("nextBtn").hidden, "correct warm-up answer reveals Next");
  el("nextBtn").click();
  const wu1 = st.warmupTrials[1];
  (wu1.expectedAnswer ? el("btnYes") : el("btnNo")).click();
  el("nextBtn").click();
  ok(!st.inWarmup, "warm-up complete");
  eq(st.phase, "question", "practice skips the cue phase");
  ok(el("hudScore").hidden, "practice hides score HUD");
  // submit idempotence: double-click one answer
  const trial0 = st.trials[0];
  const btn0 = trial0.expectedAnswer ? el("btnYes") : el("btnNo");
  btn0.click();
  btn0.click();
  eq(st.results.length, 1, "double click produces one result");
  ok(st.results[0].correct, "first practice answer correct");
  ok(!el("nextBtn").hidden, "practice feedback waits for Next");
  ok(el("feedbackChain").textContent.length > 10, "reasoning chain rendered");
  el("nextBtn").click();
  eq(st.trialIndex, 1, "Next advances to trial 2");
  for (let i = 1; i < 12; i += 1) {
    const trial = st.trials[i];
    (trial.expectedAnswer ? el("btnYes") : el("btnNo")).click();
    if (i < 11) el("nextBtn").click();
  }
  el("nextBtn").click();
  eq(st.phase, "summary", "practice session reaches summary");
  eq(t.dbg().state.lastStars, 3, "perfect practice run earns 3 stars");
  eq(t.openings(), 1, "the session opened on the mapping card");
  eq(
    t.ruleSwitches(),
    0,
    "a complete Level-1 session shows zero rule switches",
  );
  ok(el("rowScore").hidden, "practice summary hides score row");
  ok(el("rowBest").hidden, "practice summary hides best row");
  ok(el("rowSwitch").hidden, "L1 summary hides switch row");
  ok(
    el("sumAccuracy").textContent.indexOf("%") !== -1,
    "accuracy rendered as a percentage",
  );
  const overlay = w.document.querySelector(".result-overlay");
  ok(overlay !== null, "result overlay shown");
  ok(overlay.classList.contains("perfect"), "3-star overlay uses perfect tier");
  overlay.click();
  ok(
    w.document.querySelector(".result-overlay") === null,
    "overlay dismissed by click",
  );
  eq(
    w.document.activeElement.id,
    "playAgainBtn",
    "focus returns to Play again",
  );
  // Round-4 review §4.3: history is versioned, session-shaped, and written
  // only when the session completes.
  ok(
    w.localStorage.getItem("yesnoreflexRecentV1") === null,
    "the obsolete V1 recency key is never written",
  );
  const history = JSON.parse(w.localStorage.getItem("yesnoreflexRecentV2"));
  eq(history.version, 2, "history is stored under version 2");
  eq(history.sessions.length, 1, "one completed session recorded");
  eq(
    history.sessions[0].length,
    14,
    "the session array holds every played id (2 warm-ups + 12 scored)",
  );
  eq(new Set(history.sessions[0]).size, 14, "played ids are unique");
  ok(Array.isArray(history.older), "older list exists");
  console.log("ok   practice flow");
}

/* ===== C. Sprint timing, pause, resume, timeout, language (L2) ===== */
{
  const t = boot({ query: "?debug=1&seed=7" });
  const { w, el, key } = t;
  const st = t.dbg().state;
  el("lvlBtn2").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  t.clearDialog();
  eq(st.phase, "cue", "sprint starts with a cue lead after warm-up");
  ok(el("questionText").textContent === "", "question hidden during cue");
  ok(!el("pauseBtn").hidden, "pause button visible in cue");
  w.__step(1101); // first-trial lead 1100
  eq(st.phase, "question", "cue lead reveals question");
  ok(el("questionText").textContent.length > 5, "question text rendered");
  ok(
    !el("questionText").className.includes("qcolor"),
    "question text carries no cue-color class",
  );

  // language switch mid-question keeps phase and deadline
  w.__step(1000);
  const qId = st.trials[0].questionId;
  el("langBtn").click();
  eq(st.phase, "question", "language switch keeps phase");
  eq(st.lang, "pl", "language switched to pl");
  const plQ = t.dbg().QUESTIONS.find((q) => q.id === qId).plQ;
  eq(el("questionText").textContent, plQ, "question re-rendered in Polish");
  el("langBtn").click();
  eq(st.lang, "en", "language switched back");

  // explicit pause via keyboard, then resume with exact rebase
  w.__step(1000); // 2000ms elapsed of 6000
  key("p");
  eq(st.phase, "paused", "P pauses in question phase");
  ok(!el("curtain").hidden, "curtain covers the stage");
  ok(el("questionText").textContent === "", "question hidden while paused");
  el("resumeBtn").click();
  eq(st.pausedStage, "countin", "resume starts count-in");
  ok(!el("countinNum").hidden, "count-in digit visible");
  ok(el("resumeBtn").disabled, "resume disabled during count-in");
  w.__step(3001);
  eq(st.phase, "question", "count-in returns to question");
  w.__step(3998); // 2000 elapsed + 3998 = 5998 < 6000
  eq(st.phase, "question", "timer resumed from frozen remaining");
  w.__step(3); // crosses 6000 total
  eq(st.phase, "feedback", "timeout fires at the rebased deadline");
  ok(st.results[0].timeout, "timeout recorded");
  eq(st.results[0].selectedAnswer, null, "timeout stores null answer");
  eq(st.results[0].responseMs, null, "timeout stores null responseMs");
  eq(st.results[0].points, 0, "timeout earns no points");
  ok(el("feedbackTone").classList.contains("late"), "timeout tone styled");

  // blur during feedback freezes the hold
  w.dispatchEvent(new w.Event("blur"));
  eq(st.phase, "paused", "blur during feedback pauses");
  el("resumeBtn").click();
  w.__step(3001);
  eq(st.phase, "feedback", "resume returns to feedback");
  w.__step(1601);
  ok(st.phase === "cue" || st.phase === "switch", "feedback hold completes");
  eq(st.trialIndex, 1, "advanced to trial 2");

  // finish the sprint answering correctly via keyboard arrows
  for (let i = 1; i < 14; i += 1) {
    const trial = st.trials[i];
    eq(
      st.phase === "switch",
      trial.isSwitch,
      "trial " + (i + 1) + " switch phase matches isSwitch",
    );
    if (trial.isSwitch) {
      // The dialog is untimed: stepping the clock must not advance play.
      w.__step(5000);
      eq(st.phase, "switch", "clock does not run while the dialog is open");
      key(trial.expectedAnswer ? "ArrowLeft" : "ArrowRight");
      eq(st.results.length, i, "arrows cannot answer through the dialog");
      key("Enter");
      ok(t.dialogOpen(), "Enter keydown alone does not close the dialog");
      t.keyUp("Enter");
      ok(!t.dialogOpen(), "Enter keyup closes the dialog");
      eq(st.phase, "cue", "dismissal starts the pending trial");
      eq(
        w.document.activeElement.id,
        "hudRow",
        "focus moves into the play stage",
      );
    }
    w.__step(trial.isSwitch ? 1101 : 651);
    eq(st.phase, "question", "trial " + (i + 1) + " question shown");
    w.__step(500);
    key(trial.expectedAnswer ? "ArrowLeft" : "ArrowRight");
    ok(st.results[i].correct, "trial " + (i + 1) + " keyboard answer correct");
    if (i < 13) w.__step(901);
  }
  w.__step(901);
  eq(st.phase, "summary", "sprint reaches summary");
  eq(t.openings(), 1, "the session opened on the mapping card");
  eq(
    t.ruleSwitches(),
    3,
    "a complete Level-2 session shows exactly three rule switches",
  );
  ok(st.score > 0, "sprint accumulated points");
  eq(st.lastStars, 3, "13/14 with one timeout -> 92.9% -> 3 stars");
  ok(!el("rowScore").hidden, "sprint summary shows score");
  ok(!el("rowSwitch").hidden, "L2 summary shows switch accuracy");
  const best = JSON.parse(w.localStorage.getItem("yesnoreflexBestV1"));
  eq(best.best["2:steady"], st.score, "best stored under level:pace tuple");
  ok(st.newBest, "first sprint marks new best");
  const overlay = w.document.querySelector(".result-overlay");
  ok(overlay !== null, "sprint overlay shown");
  key("Escape"); // capture-phase overlay handler
  ok(
    w.document.querySelector(".result-overlay") === null,
    "overlay closes on Escape",
  );
  console.log("ok   sprint flow");
}

/* ===== D. Sprint letters + visibilitychange + seed reproducibility ===== */
{
  const t = boot({ query: "?debug=1&seed=42" });
  const { w, el } = t;
  const st = t.dbg().state;
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  const scheduleA = st.trials.map((x) => x.questionId).join(",");
  w.__step(1101);
  // letter shortcuts (EN): y / n
  const trial0 = st.trials[0];
  t.key(trial0.expectedAnswer ? "y" : "n");
  ok(
    st.results.length === 1 && st.results[0].correct,
    "EN letter shortcut answers",
  );
  // visibilitychange pause during cue of trial 2
  w.__step(901);
  eq(st.phase, "cue", "trial 2 cue");
  let hidden = true;
  Object.defineProperty(w.document, "hidden", {
    get: () => hidden,
    configurable: true,
  });
  w.document.dispatchEvent(new w.Event("visibilitychange"));
  eq(st.phase, "paused", "hidden tab pauses during cue");
  hidden = false;
  el("resumeBtn").click();
  w.__step(3001);
  eq(st.phase, "cue", "resume returns to cue phase");

  const t2 = boot({ query: "?debug=1&seed=42" });
  t2.el("startBtn").click();
  t2.clearDialog(); // every session opens on the mapping card
  const scheduleB = t2
    .dbg()
    .state.trials.map((x) => x.questionId)
    .join(",");
  eq(scheduleA, scheduleB, "same seed reproduces the same session");

  // PL letters on a Polish boot
  const t3 = boot({ query: "?debug=1&seed=9", lang: "pl-PL" });
  eq(t3.dbg().state.lang, "pl", "Polish browser initializes Polish");
  t3.el("startBtn").click();
  t3.clearDialog(); // every session opens on the mapping card
  t3.finishWarmups();
  t3.w.__step(1101);
  const first = t3.dbg().state.trials[0];
  t3.key(first.expectedAnswer ? "t" : "n");
  ok(
    t3.dbg().state.results.length === 1 && t3.dbg().state.results[0].correct,
    "PL letter shortcut answers",
  );
  console.log("ok   shortcuts, visibility, reproducibility");
}

/* ===== E. Settings lock + prefs + summary actions (L3) ===== */
{
  const t = boot({ query: "?debug=1&seed=5" });
  const { el } = t;
  const st = t.dbg().state;
  el("lvlBtn3").click();
  el("paceFastBtn").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  ok(el("startBtn").disabled, "settings locked during session");
  ok(el("lvlBtn1").disabled, "level locked during session");
  ok(el("replayTutorialBtn").disabled, "tutorial locked during session");
  const prefs = JSON.parse(t.w.localStorage.getItem("yesnoreflexPrefsV1"));
  eq(prefs.level, 3, "level pref saved");
  eq(prefs.pace, "fast", "pace pref saved");
  eq(
    Object.prototype.hasOwnProperty.call(prefs, "dynamic"),
    false,
    "preferences no longer save a cue-system member",
  );
  t.finishWarmups();
  // finish quickly: answer every trial correct
  for (let i = 0; i < 18; i += 1) {
    t.clearDialog();
    t.w.__step(st.trials[i].isSwitch || i === 0 ? 1101 : 651);
    (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    t.w.__step(901);
  }
  eq(st.phase, "summary", "L3 fast sprint completes");
  eq(t.openings(), 1, "the session opened on the mapping card");
  eq(
    t.ruleSwitches(),
    8,
    "a complete Level-3 session shows exactly eight rule switches",
  );
  ok(!el("startBtn").disabled, "settings unlocked at summary");
  t.w.document.querySelector(".result-overlay").click();
  el("changeSettingsBtn").click();
  eq(st.phase, "setup", "change settings returns to setup");
  console.log("ok   settings lock, prefs, L3 switch count");
}

/* ===== F. Review remediation regressions ===== */
{
  // R2: responseMs excludes paused time and the count-in exactly.
  const t = boot({ query: "?debug=1&seed=11" });
  const { w, el, key } = t;
  const st = t.dbg().state;
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  w.__step(1101);
  w.__step(1000); // 1000ms of active question time
  key("p");
  eq(st.phase, "paused", "paused for responseMs test");
  el("resumeBtn").click();
  w.__step(3001); // count-in
  w.__step(500); // 500ms more active time
  const trial0 = st.trials[0];
  (trial0.expectedAnswer ? el("btnYes") : el("btnNo")).click();
  eq(st.results[0].responseMs, 1500, "responseMs excludes pause and count-in");
  ok(st.results[0].correct, "post-pause answer recorded correctly");

  // R4: aria-pressed reflects selection.
  eq(
    el("modeSprintBtn").getAttribute("aria-pressed"),
    "true",
    "sprint aria-pressed true",
  );
  eq(
    el("modePracticeBtn").getAttribute("aria-pressed"),
    "false",
    "practice aria-pressed false",
  );

  // Finish the sprint to test R5 best display.
  w.__step(901); // trial 0 feedback hold
  for (let i = 1; i < 12; i += 1) {
    const trial = st.trials[i];
    w.__step(trial.isSwitch ? 1101 : 651);
    (trial.expectedAnswer ? el("btnYes") : el("btnNo")).click();
    w.__step(901);
  }
  eq(st.phase, "summary", "remediation sprint completes");
  eq(st.displayBest, st.score, "first sprint displayBest equals score");
  ok(
    el("sumBest").textContent.indexOf(String(st.score)) !== -1,
    "Best row shows the current best, not the previous",
  );
  console.log("ok   responseMs, aria-pressed, best display");
}

/* ===== G. Tutorial shortcuts from any focus position (R2-3) ===== */
{
  const t = boot({ introSeen: false });
  const { w, el } = t;
  eq(
    w.document.activeElement.id,
    "tutStepTitle",
    "tutorial entry focuses the step heading",
  );
  // Dispatch ArrowLeft with focus explicitly on a tutorial nav button.
  el("btnTutSkip").focus();
  el("btnTutSkip").dispatchEvent(
    new w.KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    }),
  );
  ok(
    t.dbg().tutorial.solved[0],
    "ArrowLeft answers from nav-button focus (ani01 yes)",
  );
  eq(
    w.document.activeElement.id,
    "btnTutNext",
    "solved step hands focus to Next",
  );
  // Modifier chords are ignored (Alt+ArrowRight must not navigate/answer).
  el("btnTutNext").click(); // step 2
  const stepBefore = t.dbg().tutorial.step;
  w.document.dispatchEvent(
    new w.KeyboardEvent("keydown", {
      key: "ArrowRight",
      altKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  eq(t.dbg().tutorial.step, stepBefore, "Alt+ArrowRight ignored in tutorial");
  // Escape exits via keyboard; Skip button also exists for pointer users.
  t.key("Escape");
  eq(t.dbg().state.phase, "setup", "Escape exits the tutorial");
  console.log("ok   tutorial focus and modifier guard");
}

/* ===== H. Modifier chords ignored during Sprint question ===== */
{
  const t = boot({ query: "?debug=1&seed=13" });
  const { w, el } = t;
  const st = t.dbg().state;
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  w.__step(1101);
  eq(st.phase, "question", "question shown for chord test");
  w.document.dispatchEvent(
    new w.KeyboardEvent("keydown", {
      key: "ArrowLeft",
      altKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  w.document.dispatchEvent(
    new w.KeyboardEvent("keydown", {
      key: "t",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  eq(st.results.length, 0, "Alt+Arrow and Cmd+letter do not answer");
  w.document.dispatchEvent(
    new w.KeyboardEvent("keydown", {
      key: "p",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  eq(st.phase, "question", "Ctrl+P does not pause");
  console.log("ok   modifier chords inert in sprint");
}

/* ===== I. Phase-specific panel matrix + unified setup (R2-1, R3-4) ===== */
{
  const t = boot({ query: "?debug=1&seed=21" });
  const { w, el } = t;
  ok(!el("sessionSection").hidden, "setup shows Session section");
  ok(!el("previewExample").hidden, "setup shows the worked example");
  ok(
    el("setupPoint1").textContent.length > 5,
    "setup teaching points rendered",
  );
  ok(
    el("pvExQ").textContent.indexOf("Sun") !== -1,
    "setup uses the unambiguous Sun example",
  );
  ok(!el("helpSection").hidden, "setup shows Help section");
  ok(el("ruleKeySection").hidden, "setup hides the rule key");
  // R3-4: no cue-system selector anywhere.
  ok(
    w.document.getElementById("cuesClassicBtn") === null &&
      w.document.getElementById("cuesDynamicBtn") === null,
    "setup contains no cue-system selector",
  );
  ok(
    w.document.getElementById("dynPreviewGrid") === null &&
      w.document.getElementById("previewGrid") === null,
    "the two competing setup previews are gone",
  );
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  ok(el("sessionSection").hidden, "play hides Session section");
  ok(el("helpSection").hidden, "play hides Help section");
  ok(!el("ruleKeySection").hidden, "play shows the rule key");
  ok(
    w.document.getElementById("progressSection") === null,
    "progress panel section no longer exists",
  );
  ok(
    w.document.getElementById("lastRoundSection") === null,
    "last-round panel section no longer exists",
  );
  // finish quickly to reach summary
  const st = t.dbg().state;
  t.finishWarmups();
  for (let i = 0; i < 12; i += 1) {
    t.clearDialog();
    w.__step(st.trials[i].isSwitch || i === 0 ? 1101 : 651);
    (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    w.__step(901);
  }
  eq(st.phase, "summary", "panel-matrix sprint completes");
  ok(!el("sessionSection").hidden, "summary shows Session section");
  ok(!el("helpSection").hidden, "summary shows Help section");
  ok(el("ruleKeySection").hidden, "summary hides the rule key");
  console.log("ok   panel phase matrix and unified setup");
}

/* ===== J. Result-overlay modal semantics stay independent (R2-6) ===== */
{
  const t = boot({ query: "?debug=1&seed=33" });
  const { w, el } = t;
  const st = t.dbg().state;
  el("modePracticeBtn").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  for (let i = 0; i < 12; i += 1) {
    (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    el("nextBtn").click();
  }
  eq(st.phase, "summary", "modal-test session completes");
  const overlay = w.document.querySelector(".result-overlay");
  ok(overlay !== null, "overlay present");
  eq(overlay.getAttribute("aria-modal"), "true", "overlay is aria-modal");
  eq(
    overlay.getAttribute("aria-labelledby"),
    "overlayMsg",
    "overlay labelled by its message",
  );
  eq(
    overlay.getAttribute("aria-describedby"),
    "overlaySub",
    "overlay described by its subtitle",
  );
  ok(overlay.getAttribute("aria-live") === null, "overlay has no live region");
  ok(
    w.document.getElementById("overlayMsg").textContent.length > 0,
    "labelledby target has text",
  );
  ok(
    overlay.querySelector(".overlay-emoji").textContent.length > 0,
    "result celebration keeps its emoji",
  );
  const cont = overlay.querySelector(".overlay-continue");
  ok(cont !== null, "real Continue button exists");
  eq(w.document.activeElement, cont, "Continue is focused on open");
  // Tab trap fallback (jsdom has no inert): focus must stay on Continue
  t.key("Tab");
  eq(w.document.activeElement, cont, "Tab keeps focus inside the dialog");
  cont.click();
  ok(w.document.querySelector(".result-overlay") === null, "Continue closes");
  eq(w.document.activeElement.id, "playAgainBtn", "focus restored");
  console.log("ok   result overlay modal semantics");
}

/* ===== K. Pair-per-round: blocks, rendering, no persistence ===== */
{
  const t = boot({
    query: "?debug=1&seed=99",
    storage: {
      // Stale keys from the retired session-profile system must be ignored
      // and never rewritten.
      yesnoreflexProfileV2: JSON.stringify({ version: 2, profile: {} }),
      yesnoreflexProfileV1: "garbage",
    },
  });
  const { w, el } = t;
  const st = t.dbg().state;
  el("modePracticeBtn").click();
  el("lvlBtn2").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  const blocks = st.blocks;
  ok(Array.isArray(blocks) && blocks.length === 4, "L2 session has 4 blocks");
  ok(
    Object.isFrozen(blocks) &&
      blocks.every(
        (b) => Object.isFrozen(b) && Object.isFrozen(b.colors || b.shapes),
      ),
    "block table deep-frozen",
  );
  // per-dimension constraints
  const key = (m) => [m.fact, m.flip].sort().join("|");
  const byDim = { color: [], shape: [] };
  blocks.forEach((b) => byDim[b.dim].push(b.colors || b.shapes));
  for (const dim of ["color", "shape"]) {
    const keys = byDim[dim].map(key);
    eq(
      new Set(keys).size,
      keys.length,
      dim + " pairs never repeat within the session",
    );
    for (let i = 1; i < byDim[dim].length; i += 1) {
      const prev = byDim[dim][i - 1];
      const cur = byDim[dim][i];
      ok(
        [cur.fact, cur.flip].every(
          (tok) => tok !== prev.fact && tok !== prev.flip,
        ),
        dim + " block " + i + " shares no token with its predecessor",
      );
    }
  }
  eq(
    w.localStorage.getItem("yesnoreflexProfileV2"),
    JSON.stringify({ version: 2, profile: {} }),
    "the stale V2 key is left untouched and never rewritten",
  );
  ok(st.inWarmup, "session starts with warm-up");
  // Warm-ups resolve block 0's pair on block 0's dimension.
  const b0 = blocks[0];
  const wu0 = st.warmupTrials[0];
  eq(wu0.activeRule, b0.dim, "warm-up 1 uses block 0's dimension");
  eq(wu0.blockIndex, 0, "warm-up 1 belongs to block 0");
  const wu0role = b0.dim === "color" ? wu0.colorCue : wu0.shapeCue;
  eq(wu0role, "fact", "warm-up 1 is the FACT example");
  const shown = visibleCueIds(t);
  eq(shown.length, 1, "exactly one cue element visible");
  const m0 = b0.colors || b0.shapes;
  if (b0.dim === "color") {
    eq(shown[0], "cuePatch", "color round renders the swatch");
    ok(
      t.el("cuePatch").classList.contains("fill-" + m0.fact),
      "swatch carries block 0's FACT color",
    );
  } else {
    eq(shown[0], SHAPE_EL_ID[m0.fact], "shape round renders block 0's shape");
    ok(
      t.el(shown[0]).classList.contains("neutral"),
      "shape round uses the neutral fill",
    );
  }
  ok(
    el("cueDescription").textContent.length > 0,
    "warm-up cue described for assistive technology",
  );
  (wu0.expectedAnswer ? el("btnYes") : el("btnNo")).click();
  el("nextBtn").click();
  const wu1 = st.warmupTrials[1];
  const wu1role = b0.dim === "color" ? wu1.colorCue : wu1.shapeCue;
  eq(wu1role, "flip", "warm-up 2 is the FLIP example");
  (wu1.expectedAnswer ? el("btnYes") : el("btnNo")).click();
  el("nextBtn").click();
  ok(!st.inWarmup, "warm-up complete");
  ok(el("hudCount").textContent.indexOf("Q 1") === 0, "scored trial 1 begins");
  // Every scored trial: rendered token === its block's pair for its role,
  // never anything else, across every switch (the riskiest surface of the
  // redesign — a stale block here is a wrong-answer trap).
  for (let i = 0; i < 14; i += 1) {
    t.clearDialog();
    const trial = st.trials[i];
    const block = blocks[trial.blockIndex];
    eq(
      trial.activeRule,
      block.dim,
      "trial " + (i + 1) + " matches its block's dimension",
    );
    const mapping = block.colors || block.shapes;
    const role = trial.activeRule === "color" ? trial.colorCue : trial.shapeCue;
    const ids = visibleCueIds(t);
    eq(ids.length, 1, "trial " + (i + 1) + " shows exactly one cue");
    if (block.dim === "color") {
      eq(ids[0], "cuePatch", "trial " + (i + 1) + " color round = swatch");
      ok(
        t.el("cuePatch").classList.contains("fill-" + mapping[role]),
        "trial " + (i + 1) + " swatch resolves through its block",
      );
    } else {
      eq(
        ids[0],
        SHAPE_EL_ID[mapping[role]],
        "trial " + (i + 1) + " shape resolves through its block",
      );
      ok(
        t.el(ids[0]).classList.contains("neutral"),
        "trial " + (i + 1) + " shape keeps the neutral fill",
      );
      ok(
        FILL_CLASSES.every((c) => !t.el(ids[0]).classList.contains(c)),
        "trial " + (i + 1) + " shape carries no session color",
      );
    }
    ok(
      !el("questionText").className.includes("qcolor"),
      "trial " + (i + 1) + " question is never cue-colored",
    );
    (trial.expectedAnswer ? el("btnYes") : el("btnNo")).click();
    el("nextBtn").click();
  }
  eq(st.phase, "summary", "pair-per-round practice completes");
  ok(st.blocks === null, "blocks cleared after the session");
  ok(
    w.localStorage.getItem("yesnoreflexProfileV2"),
    "stale key still untouched after the session",
  );
  w.document.querySelector(".result-overlay").click();
  el("playAgainBtn").click();
  ok(t.dialogOpen(), "replay opens the new session's card");
  ok(
    Array.isArray(t.dbg().state.blocks) && t.dbg().state.blocks.length === 4,
    "replay draws a fresh block table",
  );
  console.log("ok   pair-per-round blocks and rendering");
}

/* ===== L. Level 1: one dimension, no switch, no distractor (R3 §3.3) ===== */
{
  // Level 1 picks color or shape per session; both variants must be covered.
  const seen = { color: null, shape: null };
  for (const seed of [42, 101, 7, 13, 21, 33, 5, 77, 99, 55, 3, 8]) {
    const t = boot({ query: "?debug=1&seed=" + seed });
    t.el("modePracticeBtn").click();
    t.el("startBtn").click();
    t.clearDialog(); // every session opens on the mapping card
    const st = t.dbg().state;
    const rule = st.trials[0].activeRule;
    if (!seen[rule]) seen[rule] = t;
    if (seen.color && seen.shape) break;
  }
  ok(seen.color !== null, "a Level-1 color session was produced");
  ok(seen.shape !== null, "a Level-1 shape session was produced");
  Object.keys(seen).forEach((rule) => {
    const t = seen[rule];
    if (!t) return;
    const { el } = t;
    const st = t.dbg().state;
    const b0 = st.blocks[0];
    const prof = { colors: b0.colors, shapes: b0.shapes };
    eq(st.blocks.length, 1, "L1 " + rule + ": a single block");
    // ★ memory ramp: the panel stays visible with the 2-line current pair.
    ok(!t.el("panel").hidden, "L1 " + rule + ": panel visible during play");
    ok(
      !t.el("ruleKeySection").hidden,
      "L1 " + rule + ": rule key visible during play",
    );
    ok(
      st.trials.every((x) => x.activeRule === rule),
      "L1 " + rule + ": one dimension for the whole session",
    );
    ok(
      st.trials.every((x) => !x.isSwitch),
      "L1 " + rule + ": never switches",
    );
    const ids = visibleCueIds(t);
    eq(ids.length, 1, "L1 " + rule + ": exactly one cue element visible");
    if (rule === "color") {
      eq(ids[0], "cuePatch", "L1 color: renders the neutral swatch");
      ok(
        t.el("cuePatch").classList.contains("fill-" + prof.colors.fact),
        "L1 color: swatch carries the session FACT color",
      );
      ok(
        el("cueDescription").textContent.length > 0,
        "L1 color: the cue is described for assistive technology",
      );
      ok(!el("kgColor").hidden, "L1 color: color key shown");
      ok(el("kgShape").hidden, "L1 color: shape key hidden (no distractor)");
      ok(
        el("kgColor").classList.contains("active"),
        "L1 color: the panel marks colour as the active dimension",
      );
    } else {
      eq(
        ids[0],
        SHAPE_EL_ID[prof.shapes.fact],
        "L1 shape: renders the session FACT shape",
      );
      ok(
        t.el(ids[0]).classList.contains("neutral"),
        "L1 shape: constant neutral fill, never a session color",
      );
      ok(
        FILL_CLASSES.every((c) => !t.el(ids[0]).classList.contains(c)),
        "L1 shape: no session color on the shape",
      );
      ok(
        el("cueDescription").textContent.length > 0,
        "L1 shape: the cue is described for assistive technology",
      );
      ok(el("kgColor").hidden, "L1 shape: color key hidden (no distractor)");
      ok(!el("kgShape").hidden, "L1 shape: shape key shown");
      ok(
        el("kgShape").classList.contains("active"),
        "L1 shape: the panel marks shape as the active dimension",
      );
    }
    eq(t.ruleSwitches(), 0, "L1 " + rule + ": no rule-switch dialog");
    eq(t.openings(), 1, "L1 " + rule + ": one opening mapping card");
  });
  console.log("ok   level 1 single dimension");
}

/* ===== M. Switch dialog contract (R3-5) ===== */
{
  const t = boot({ query: "?debug=1&seed=55" });
  const { w, el, key } = t;
  const st = t.dbg().state;
  el("modePracticeBtn").click();
  el("lvlBtn2").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  eq(t.ruleSwitches(), 0, "warm-ups receive no rule-switch dialog");
  eq(t.openings(), 1, "the session opened on the mapping card before warm-up");
  ok(!t.dialogOpen(), "the first scored trial is not a switch");
  // advance to the first scored switch
  let i = 0;
  while (!st.trials[i].isSwitch) {
    (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    el("nextBtn").click();
    i += 1;
  }
  eq(st.phase, "switch", "a scored switch enters the switch phase");
  ok(t.dialogOpen(), "the full-viewport dialog is showing");
  eq(t.ruleSwitches(), 1, "one dialog per switch trial");
  const rule = st.trials[i].activeRule;
  // The dialog must name the UPCOMING block's pair (EN names equal token
  // ids for both dimensions).
  const upcoming = st.blocks[st.trials[i].blockIndex];
  const mapping = upcoming.colors || upcoming.shapes;
  eq(upcoming.dim, rule, "the upcoming block owns the new rule");
  eq(
    el("swRule").textContent,
    rule === "color" ? "FOLLOW COLOR" : "FOLLOW SHAPE",
    "dialog names the newly active rule",
  );
  ok(el("swTitle").textContent.length > 0, "dialog shows the SWITCH heading");
  eq(el("swMap").children.length, 2, "dialog shows both tokens");
  // ★★/★★★ memory ramp: no panel reference exists behind the dialog.
  ok(t.el("panel").hidden, "the panel is hidden during ★★ play");
  const mapText = el("swMap").textContent;
  const expectedFact = mapping.fact;
  const expectedFlip = mapping.flip;
  ok(
    mapText.indexOf(expectedFact) !== -1,
    "dialog names the upcoming FACT token",
  );
  ok(
    mapText.indexOf(expectedFlip) !== -1,
    "dialog names the upcoming FLIP token",
  );
  ok(mapText.indexOf("FACT") !== -1, "dialog states the FACT meaning");
  ok(mapText.indexOf("FLIP") !== -1, "dialog states the FLIP meaning");
  ok(
    w.document.getElementById("swUntil") === null,
    "the redundant until-next line is gone",
  );
  ok(
    el("swHint").textContent.indexOf("ENTER") !== -1,
    "the key hint rides inside the Continue button",
  );
  ok(
    el("swContinue").contains(el("swHint")),
    "the key hint is part of the Continue control, not a separate line",
  );
  eq(
    el("switchOverlay").children.length,
    4,
    "the dialog is four blocks: heading, rule, mapping, Continue",
  );
  eq(
    el("switchOverlay").getAttribute("aria-modal"),
    "true",
    "dialog is aria-modal",
  );
  eq(w.document.activeElement.id, "swContinue", "Continue is focused on open");
  ok(
    el("liveRegion").textContent.indexOf(expectedFact) !== -1,
    "announcement carries the mapping",
  );
  ok(
    mapping[
      st.trials[i].activeRule === "color"
        ? st.trials[i].colorCue
        : st.trials[i].shapeCue
    ] !== undefined,
    "the pending trial resolves through its block",
  );
  // rejected inputs
  key("Tab");
  eq(w.document.activeElement.id, "swContinue", "Tab is trapped in the dialog");
  key("Escape");
  ok(t.dialogOpen(), "Escape cannot dismiss the dialog");
  key("y");
  key("n");
  key("ArrowLeft");
  key("ArrowRight");
  key("p");
  ok(t.dialogOpen(), "Y/N/arrows/Pause cannot bypass the dialog");
  eq(st.results.length, i, "no answer was recorded through the dialog");
  eq(st.phase, "switch", "phase unchanged by rejected input");
  el("switchOverlay").click(); // backdrop
  ok(t.dialogOpen(), "backdrop click cannot dismiss the dialog");
  // A language switch while the dialog is open must rewrite EVERY surface,
  // not just the heading (found live in Chrome).
  const enTitle = el("swTitle").textContent;
  const enRule = el("swRule").textContent;
  const enMap = el("swMap").textContent;
  const enCont = el("swContinueLabel").textContent;
  el("langBtn").click();
  ok(t.dialogOpen(), "language switch keeps the dialog open");
  ok(el("swTitle").textContent !== enTitle, "PL rewrites the dialog heading");
  ok(el("swRule").textContent !== enRule, "PL rewrites the active rule");
  ok(el("swMap").textContent !== enMap, "PL rewrites the mapping rows");
  ok(el("swContinueLabel").textContent !== enCont, "PL rewrites Continue");
  eq(el("swMap").children.length, 2, "PL keeps both mapping rows");
  el("langBtn").click();
  eq(el("swRule").textContent, enRule, "switching back restores English");
  eq(el("swMap").textContent, enMap, "switching back restores the mapping");
  // repeated keydown must not leak into the next view
  key("Enter", { repeat: true });
  ok(t.dialogOpen(), "held Enter keydown does not dismiss");
  t.keyUp("Enter");
  ok(!t.dialogOpen(), "Enter keyup dismisses");
  eq(st.phase, "question", "Practice reveals the complete trial at once");
  eq(st.results.length, i, "dismissal did not answer the pending trial");
  eq(
    w.document.activeElement.id,
    "hudRow",
    "focus moves into the play stage on dismissal",
  );
  eq(t.ruleSwitches(), 1, "dismissal does not reopen the dialog");
  // Space closes an equivalent dialog exactly once
  (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
  el("nextBtn").click();
  let j = i + 1;
  while (!st.trials[j].isSwitch) {
    (st.trials[j].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    el("nextBtn").click();
    j += 1;
  }
  ok(t.dialogOpen(), "second switch opens the dialog");
  // Successive same-dimension switch cards must name DIFFERENT pairs.
  const later = st.blocks[st.trials[j].blockIndex];
  if (later.dim === upcoming.dim) {
    const m2 = later.colors || later.shapes;
    ok(
      [m2.fact, m2.flip].sort().join("|") !==
        [mapping.fact, mapping.flip].sort().join("|"),
      "successive same-dimension cards name different pairs",
    );
  }
  const opensBefore = t.switchOpens;
  key(" ");
  t.keyUp(" ");
  ok(!t.dialogOpen(), "Space dismisses the dialog");
  eq(t.switchOpens, opensBefore, "Space starts the pending trial exactly once");
  eq(st.phase, "question", "trial started once after Space");
  console.log("ok   switch dialog contract");
}

/* ===== M2. Opening mapping card (owner request 2026-08-21) ===== */
{
  const t = boot({ query: "?debug=1&seed=311" });
  const { w, el, key } = t;
  const st = t.dbg().state;
  el("modePracticeBtn").click();
  el("lvlBtn2").click();
  el("startBtn").click();
  // The card blocks before the first warm-up, not after it.
  eq(st.phase, "switch", "Start enters the switch phase before any warm-up");
  ok(t.dialogOpen(), "the mapping card is showing at game start");
  eq(t.openings(), 1, "exactly one opening card");
  eq(t.ruleSwitches(), 0, "the opening card is not counted as a rule switch");
  eq(
    el("swTitle").textContent,
    "NEW GAME!",
    "opening card is headed NEW GAME!",
  );
  eq(
    el("swRule").textContent,
    st.trials[0].activeRule === "color" ? "FOLLOW COLOR" : "FOLLOW SHAPE",
    "opening card names the rule the warm-ups and first trial use",
  );
  eq(el("swMap").children.length, 2, "opening card shows both meanings");
  eq(w.document.activeElement.id, "swContinue", "Continue is focused on open");
  ok(
    el("liveRegion").textContent.indexOf("NEW GAME!") === 0,
    "announcement opens with the new-game heading",
  );
  ok(st.inWarmup, "the session is in warm-up behind the card");
  eq(st.results.length, 0, "nothing is scored while the card is open");
  // Rejected inputs behave exactly as they do for a rule switch.
  key("Escape");
  key("y");
  key("ArrowLeft");
  ok(t.dialogOpen(), "Escape, Y and arrows cannot bypass the opening card");
  el("switchOverlay").click();
  ok(t.dialogOpen(), "backdrop click cannot bypass the opening card");
  // Language switch rewrites the opening card too.
  el("langBtn").click();
  eq(el("swTitle").textContent, "NOWA GRA!", "PL rewrites the opening heading");
  el("langBtn").click();
  eq(el("swTitle").textContent, "NEW GAME!", "switching back restores English");
  el("swContinue").click();
  ok(!t.dialogOpen(), "Continue dismisses the opening card");
  eq(st.phase, "question", "dismissal reveals the first warm-up");
  eq(
    w.document.activeElement.id,
    "hudRow",
    "focus moves into the play stage on dismissal",
  );
  // A scored switch later in the same session still says SWITCH!
  t.finishWarmups();
  let i = 0;
  while (!st.trials[i].isSwitch) {
    (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    el("nextBtn").click();
    i += 1;
  }
  eq(el("swTitle").textContent, "SWITCH!", "a rule change still says SWITCH!");
  eq(t.openings(), 1, "no second opening card inside the session");
  console.log("ok   opening mapping card");
}
{
  // Play again opens a fresh card for the new session's mapping.
  const t = boot({ query: "?debug=1&seed=312" });
  const { el } = t;
  const st = t.dbg().state;
  el("modePracticeBtn").click();
  el("startBtn").click();
  t.clearDialog();
  t.finishWarmups();
  for (let i = 0; i < 12; i += 1) {
    t.clearDialog();
    (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
    el("nextBtn").click();
  }
  eq(st.phase, "summary", "replay-test session completes");
  eq(t.openings(), 1, "one opening card for the first session");
  t.w.document.querySelector(".result-overlay").click();
  el("playAgainBtn").click();
  ok(t.dialogOpen(), "Play again opens the new session's mapping card");
  eq(t.openings(), 2, "one opening card per session");
  eq(
    el("swTitle").textContent,
    "NEW GAME!",
    "the replay card is headed NEW GAME!",
  );
  console.log("ok   opening card per session");
}

/* ===== N. Storage hardening: retired keys and broken storage ===== */
{
  // The pair-per-round redesign retired both profile keys. Whatever they
  // contain — valid old data, garbage, wrong versions — the app must ignore
  // them, never rewrite them, and start normally.
  const CASES = [
    ["not json at all", "invalid JSON"],
    ["{}", "empty object"],
    ['{"version":1,"profile":{}}', "V1 shell"],
    [
      JSON.stringify({
        version: 2,
        profile: {
          colors: { fact: "green", flip: "purple" },
          shapes: { fact: "triangle", flip: "square" },
        },
      }),
      "well-formed V2 data",
    ],
    [JSON.stringify({ version: 2, profile: [] }), "V2 with an array profile"],
  ];
  CASES.forEach(([raw, label], idx) => {
    const t = boot({
      query: "?debug=1&seed=" + (200 + idx),
      storage: { yesnoreflexProfileV2: raw, yesnoreflexProfileV1: raw },
    });
    t.el("startBtn").click();
    t.clearDialog();
    const st = t.dbg().state;
    ok(
      st.inWarmup && st.phase === "question",
      label + " still reaches warm-up",
    );
    ok(Array.isArray(st.blocks), label + " produces a block table");
    eq(
      t.w.localStorage.getItem("yesnoreflexProfileV2"),
      raw,
      label + ": the retired V2 key is never rewritten",
    );
    eq(
      t.w.localStorage.getItem("yesnoreflexProfileV1"),
      raw,
      label + ": the retired V1 key is never rewritten",
    );
  });
  // Unavailable storage (throwing accessor) must not block play. The
  // intro-seen flag cannot be read either, so the tutorial opens first.
  const t3 = boot({ query: "?debug=1&seed=302", breakStorage: true });
  eq(t3.dbg().state.phase, "intro", "unreadable storage opens the tutorial");
  t3.key("Escape");
  eq(t3.dbg().state.phase, "setup", "tutorial still exits without storage");
  t3.el("startBtn").click();
  t3.clearDialog(); // every session opens on the mapping card
  ok(t3.dbg().state.inWarmup, "throwing storage still reaches warm-up");
  ok(
    Array.isArray(t3.dbg().state.blocks),
    "throwing storage still draws a block table",
  );
  console.log("ok   storage hardening");
}

/* ===== N2. Pause shows the current round's mapping (owner 2026-08-22) ===== */
{
  const t = boot({ query: "?debug=1&seed=7" });
  const { w, el, key } = t;
  const st = t.dbg().state;
  el("lvlBtn2").click();
  el("startBtn").click();
  t.clearDialog();
  t.finishWarmups();
  w.__step(1101);
  eq(st.phase, "question", "question shown before pause");
  key("p");
  eq(st.phase, "paused", "paused");
  const block = st.blocks[st.trials[st.trialIndex].blockIndex];
  const mapping = block.colors || block.shapes;
  ok(!el("curtainMap").hidden, "pause curtain shows the mapping card");
  eq(el("curtainMap").children.length, 2, "curtain card has both rows");
  const text = el("curtainMap").textContent;
  ok(
    text.indexOf(mapping.fact) !== -1 && text.indexOf(mapping.flip) !== -1,
    "curtain card names the current round's pair",
  );
  ok(
    el("liveRegion").textContent.indexOf(mapping.fact) !== -1,
    "pause announcement names the mapping",
  );
  el("resumeBtn").click();
  ok(!el("curtainMap").hidden, "mapping stays visible through the count-in");
  w.__step(3001);
  eq(st.phase, "question", "resumed");
  console.log("ok   pause mapping card");
}

/* ===== N3. The cue lead pops on every trial (owner feedback 2026-08-22) ===== */
{
  // Within a round consecutive trials can show the identical token; the pop
  // restarts at every cue entry so the lead never reads as a frozen screen.
  const t = boot({ query: "?debug=1&seed=42" });
  const { w, el } = t;
  const st = t.dbg().state;
  el("startBtn").click();
  t.clearDialog();
  t.finishWarmups();
  eq(st.phase, "cue", "sprint enters the cue lead");
  w.__step(1); // the restart is one rAF away
  ok(
    el("cueTile").classList.contains("pop"),
    "cue entry arms the attention pop",
  );
  w.__step(1100);
  eq(st.phase, "question", "question revealed");
  (st.trials[0].expectedAnswer ? el("btnYes") : el("btnNo")).click();
  w.__step(901); // feedback hold
  if (st.phase === "switch") t.clearDialog();
  eq(st.phase, "cue", "second trial cue lead");
  w.__step(1);
  ok(
    el("cueTile").classList.contains("pop"),
    "the pop restarts on the next trial too",
  );
  console.log("ok   cue lead pop");
}

/* ===== O. Universal Y in Polish sessions (R3-6, round 2) ===== */
{
  const t = boot({ query: "?debug=1&seed=77", lang: "pl-PL" });
  const { el, key } = t;
  const st = t.dbg().state;
  eq(st.lang, "pl", "Polish boot");
  eq(el("hintYes").textContent, "Y / T", "Polish Yes hint shows Y / T");
  el("modePracticeBtn").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  const trial = st.trials[0];
  key(trial.expectedAnswer ? "y" : "n"); // universal Y, not T
  eq(st.results.length, 1, "Y answers in a Polish session");
  ok(st.results[0].correct, "Y mapped to Yes in Polish");
  // Polish copy is complete for the new surfaces.
  ok(el("setupPoint1").textContent.length > 5, "Polish setup points rendered");
  ok(
    el("pvExQ").textContent.indexOf("Słońce") !== -1,
    "Polish setup uses the Sun example",
  );
  console.log("ok   universal Y and Polish copy");
}

/* ===== Q. Round-4 bank and recency history (§4.3, §5.7) ===== */
{
  const t = boot({ query: "?debug=1&seed=61" });
  const { w, el } = t;
  const st = t.dbg().state;
  eq(t.dbg().QUESTIONS.length, 240, "app ships the 240-record bank");
  eq(t.dbg().LEVELS[1].playfulCount, 2, "L1 playful quota is 2");
  eq(t.dbg().LEVELS[2].playfulCount, 3, "L2 playful quota is 3");
  eq(t.dbg().LEVELS[3].playfulCount, 4, "L3 playful quota is 4");
  eq(st.bankErrors, [], "the shipped bank passes its own validator");
  // An abandoned session must not consume the hard-exclusion window.
  el("modePracticeBtn").click();
  el("startBtn").click();
  t.clearDialog(); // every session opens on the mapping card
  t.finishWarmups();
  (st.trials[0].expectedAnswer ? el("btnYes") : el("btnNo")).click();
  ok(
    w.localStorage.getItem("yesnoreflexRecentV2") === null,
    "an in-progress session writes no history",
  );
  // The real abandon path is leaving the page mid-session: nothing runs
  // finishSession, so nothing persists. Simulate it faithfully by reading
  // storage as-is instead of clicking a control the player cannot see
  // (audit F16 — changeSettingsBtn is hidden during play).
  ok(
    !el("changeSettingsBtn").offsetParent === false ||
      el("changeSettingsBtn").closest("[hidden]") !== null,
    "the settings control is genuinely hidden mid-session",
  );
  ok(
    w.localStorage.getItem("yesnoreflexRecentV2") === null,
    "an abandoned session leaves no history behind",
  );
  console.log("ok   bank size and abandoned-session history");
}
{
  // Malformed, legacy, and foreign history payloads cannot block Start.
  const CASES = [
    ["not json", "invalid JSON history"],
    ["{}", "empty history object"],
    ['{"version":1,"ids":["ani01","bod01"]}', "legacy V1 history"],
    ['{"version":2}', "V2 with no sessions"],
    ['{"version":2,"sessions":"ani01","older":7}', "V2 with wrong types"],
    ['{"version":2,"sessions":[["nope99"]],"older":["nope98"]}', "unknown ids"],
    [
      '{"version":2,"sessions":[null,5,["ani01","ani01"]],"older":[null,5]}',
      "dirty arrays",
    ],
  ];
  CASES.forEach(([raw, label], i) => {
    const t = boot({
      query: "?debug=1&seed=" + (620 + i),
      storage: { yesnoreflexRecentV2: raw },
    });
    t.el("startBtn").click();
    t.clearDialog(); // every session opens on the mapping card
    const st = t.dbg().state;
    ok(
      st.inWarmup && st.phase === "question",
      label + " still reaches warm-up",
    );
    eq(st.trials.length, 12, label + " yields a full L1 schedule");
    eq(
      new Set(st.trials.map((x) => x.questionId)).size,
      12,
      label + " yields unique questions",
    );
  });
  // A leftover V1 key is ignored, not migrated.
  const t2 = boot({
    query: "?debug=1&seed=640",
    storage: {
      yesnoreflexRecentV1: JSON.stringify({ version: 1, ids: ["ani01"] }),
    },
  });
  t2.el("startBtn").click();
  t2.clearDialog(); // every session opens on the mapping card
  ok(t2.dbg().state.inWarmup, "a leftover V1 recency key does not block Start");
  ok(
    t2.w.localStorage.getItem("yesnoreflexRecentV2") === null,
    "V1 data is not migrated into V2",
  );
  console.log("ok   history payload hardening");
}
{
  // Consecutive completed sessions must not repeat a question.
  const t = boot({ query: "?debug=1&seed=71" });
  const { w, el } = t;
  const played = [];
  for (let round = 0; round < 3; round += 1) {
    const st = t.dbg().state;
    if (round === 0) el("modePracticeBtn").click();
    el(round === 0 ? "startBtn" : "playAgainBtn").click();
    t.finishWarmups();
    for (let i = 0; i < 12; i += 1) {
      t.clearDialog();
      (st.trials[i].expectedAnswer ? el("btnYes") : el("btnNo")).click();
      el("nextBtn").click();
    }
    eq(st.phase, "summary", "round " + (round + 1) + " completes");
    const ids = st.warmupTrials
      .map((x) => x.questionId)
      .concat(st.trials.map((x) => x.questionId));
    played.push(ids);
    w.document.querySelector(".result-overlay").click();
  }
  const history = JSON.parse(w.localStorage.getItem("yesnoreflexRecentV2"));
  eq(history.sessions.length, 3, "three completed sessions recorded");
  eq(
    history.sessions[0],
    played[2],
    "the newest completed session is stored first",
  );
  const seen = new Set();
  let repeats = 0;
  played.flat().forEach((id) => {
    if (seen.has(id)) repeats += 1;
    seen.add(id);
  });
  eq(repeats, 0, "three consecutive sessions share no question");
  console.log("ok   consecutive sessions never repeat a question");
}

/* ===== P. Static markup matches the EN translations (no stale flash) ===== */
{
  const live = boot({ query: "?debug=1&seed=1" });
  const staticDom = new JSDOM(HTML);
  const sd = staticDom.window.document;
  const ld = live.w.document;
  const skip = new Set([
    "langBtn",
    "hudCount",
    "hudScore",
    "questionText",
    "cueDescription",
    "liveRegion",
    "tutCounter",
    "tutStepTitle",
    "tutStepBody",
    "swMap",
    "tutMap",
  ]);
  let mismatches = [];
  [...HTML.matchAll(/\sid="([A-Za-z0-9_]+)"/g)]
    .map((m) => m[1])
    .forEach((id) => {
      if (skip.has(id)) return;
      const a = sd.getElementById(id);
      const b = ld.getElementById(id);
      if (!a || !b || a.children.length > 0 || b.children.length > 0) return;
      const s = (a.textContent || "").replace(/\s+/g, " ").trim();
      const l = (b.textContent || "").replace(/\s+/g, " ").trim();
      if (s !== l) mismatches.push(id);
    });
  eq(mismatches, [], "static markup matches the English translations");
  console.log("ok   no untranslated flash");
}

if (failures === 0) {
  console.log("OK: " + checks + " DOM checks passed");
  process.exit(0);
} else {
  console.error(failures + " of " + checks + " checks FAILED");
  process.exit(1);
}
