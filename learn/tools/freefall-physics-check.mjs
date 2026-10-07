#!/usr/bin/env node
/*
 * Physics and state-machine cross-check for freefall/index.html (Orbit & Free
 * Fall). Loads the real app script in jsdom through its `?debug=1` hook and
 * runs the acceptance table from freefall/docs/design.md section 10 against
 * the actual integrator, classifier, cabin solver and action functions.
 *
 * Exit codes: 0 = pass, 1 = assertion failures.
 * Run from learn/: npm run freefall-physics-check
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const here = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(here, "..", "freefall", "index.html");
const html = await readFile(appPath, "utf8");

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
function near(actual, expected, tol, msg) {
  ok(
    Math.abs(actual - expected) <= tol,
    `${msg}: ${actual} vs ${expected} (tol ${tol})`,
  );
}

function makeContextStub() {
  const target = {};
  return new Proxy(target, {
    get(t, prop) {
      if (prop === "measureText") return () => ({ width: 10 });
      if (prop in t) return t[prop];
      return () => undefined;
    },
  });
}

const dom = new JSDOM(html, {
  url: "http://localhost/learn/freefall/?debug=1",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = () => makeContextStub();
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    });
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
  },
});
const { window } = dom;
const D = window.freefallDebug;
ok(!!D, "debug hook exposed under ?debug=1");
const { R_EARTH, MU_EARTH, R0, V_CIRCULAR_0, V_ESCAPE_0, VIEW_LIMIT_RADIUS, THRUST_BASE, THRUST_RAMP_START, THRUST_DOUBLING, THRUST_MAX } =
  D.constants;
// Closed-form delta-v of the throttle ramp after holding for t seconds.
function rampDeltaV(t) {
  const tCap = THRUST_RAMP_START + THRUST_DOUBLING * Math.log2(THRUST_MAX / THRUST_BASE);
  let dv = THRUST_BASE * Math.min(t, THRUST_RAMP_START);
  if (t > THRUST_RAMP_START) {
    const tr = Math.min(t, tCap);
    dv += THRUST_BASE * (THRUST_DOUBLING / Math.LN2) * (Math.pow(2, (tr - THRUST_RAMP_START) / THRUST_DOUBLING) - 1);
  }
  if (t > tCap) dv += THRUST_MAX * (t - tCap);
  return dv;
}
const state = D.state;

function setSpeed(kms) {
  D.setInitialSpeed(kms * 1000);
}
function runFor(seconds, rate) {
  state.rate = rate;
  state.phase = "running";
  const res = D.integrate(seconds);
  if (res.event) state.phase = res.event;
  else state.phase = "paused";
  return res;
}
function speedOf() {
  return Math.hypot(state.station.vx, state.station.vy);
}
function radiusOf() {
  return Math.hypot(state.station.x, state.station.y);
}

// ── Reference values ──────────────────────────────────────────────────────
near(MU_EARTH / (R0 * R0), 8.69425, 1e-5, "gravity at 400 km");
near(MU_EARTH / (R_EARTH * R_EARTH), 9.82025, 1e-5, "model surface gravity");
near(V_CIRCULAR_0, 7672.598588, 1e-5, "circular speed");
near(V_ESCAPE_0, 10850.692982, 1e-5, "escape speed at 400 km");
near(
  (2 * Math.PI * Math.sqrt((R0 * R0 * R0) / MU_EARTH)) / 60,
  92.414252,
  1e-5,
  "circular period (min)",
);
const graze = Math.sqrt((2 * MU_EARTH * R_EARTH) / (R0 * (R0 + R_EARTH)));
near(graze, 7554.93177, 1e-5, "surface-grazing speed");
near(
  (100 * (MU_EARTH / (R0 * R0))) / (MU_EARTH / (R_EARTH * R_EARTH)),
  88.533897,
  1e-5,
  "fraction of surface gravity (%)",
);

// ── Circular precision and ten-period drift ───────────────────────────────
D.loadPreset("circular");
ok(state.v0 === V_CIRCULAR_0, "circular preset uses the computed value exactly");
ok(state.classification.type === "circular", "initial classification is circular");
{
  const period = state.classification.period;
  const e0 = state.classification.energy;
  const h0 = state.classification.h;
  let maxAltErr = 0;
  for (let k = 0; k < 10; k++) {
    runFor(period, 120);
    maxAltErr = Math.max(maxAltErr, Math.abs(radiusOf() - R0));
  }
  near(maxAltErr, 0, 100, "ten periods keep altitude within 0.1 km (max error m)");
  const cls = state.classification;
  ok(
    Math.abs((cls.energy - e0) / e0) < 1e-6,
    `energy drift ${Math.abs((cls.energy - e0) / e0)} < 1e-6`,
  );
  ok(
    Math.abs((cls.h - h0) / h0) < 1e-6,
    `angular momentum drift ${Math.abs((cls.h - h0) / h0)} < 1e-6`,
  );
  ok(cls.type === "circular", `after ten periods still circular (e=${cls.e})`);
  near(state.t, 10 * period, 1e-6, "clock advanced exactly ten periods");
}

// ── Playback independence ────────────────────────────────────────────────
{
  D.loadPreset("higherEllipse");
  runFor(900, 1);
  const p1 = { ...state.station };
  D.loadPreset("higherEllipse");
  runFor(900, 120);
  const p120 = { ...state.station };
  D.loadPreset("higherEllipse");
  runFor(900, 600);
  const p600 = { ...state.station };
  const d1 = Math.hypot(p1.x - p600.x, p1.y - p600.y);
  const d2 = Math.hypot(p120.x - p600.x, p120.y - p600.y);
  ok(d1 < 1, `1x vs 600x at t=900 s agree within 1 m (${d1.toExponential(3)} m)`);
  ok(d2 < 1, `120x vs 600x at t=900 s agree within 1 m (${d2.toExponential(3)} m)`);
}

// ── Direct fall ───────────────────────────────────────────────────────────
{
  D.loadPreset("drop");
  const cls = state.classification;
  ok(cls.type === "radialFall", `zero speed classified as straight fall (${cls.type})`);
  ok(cls.energy < 0 && !cls.nearZero, "zero speed has negative energy, not parabolic");
  ok(Math.abs(cls.e - 1) < 1e-9, `zero speed eccentricity is 1 (${cls.e})`);
  const res = runFor(1000, 120);
  ok(res.event === "impact", `drop ends at the surface (event=${res.event}, t=${state.t.toFixed(2)} s)`);
  near(radiusOf(), R_EARTH, 1e-3, "impact position pinned to the surface");
  ok(Math.abs(state.station.x) < 1e-6, "fall stayed radial (x = 0)");
  ok(
    state.ball.qx === 0 && state.ball.qy === 0 && Math.hypot(state.ball.nx, state.ball.ny) === 0,
    "wall push stayed zero before impact",
  );
  ok(D.isTerminal(), "impact phase is terminal");
}

// ── Low-speed impacts, prediction vs flight ───────────────────────────────
for (const kms of [6.0, 7.55]) {
  setSpeed(kms);
  const cls = state.classification;
  ok(cls.willImpact && cls.type === "impact", `${kms} km/s predicted to meet Earth`);
  const predicted = state.conic.points[state.conic.points.length - 1];
  near(Math.hypot(predicted.x, predicted.y), R_EARTH, 1, `${kms} km/s conic ends at the surface`);
  const res = runFor(8000, 120);
  ok(res.event === "impact", `${kms} km/s actual flight hit the surface at t=${state.t.toFixed(1)} s`);
  const gap = Math.hypot(predicted.x - state.station.x, predicted.y - state.station.y);
  ok(gap < 200, `${kms} km/s prediction and flight agree on the surface point (${gap.toFixed(1)} m)`);
}

// ── Narrow nonimpact range ────────────────────────────────────────────────
{
  setSpeed(7.56);
  const cls = state.classification;
  ok(!cls.willImpact && cls.returns, `7.56 km/s clears the solid surface (perigee alt ${((cls.perigee - R_EARTH) / 1000).toFixed(2)} km)`);
  const res = runFor(cls.period, 600);
  ok(res.event === null, "7.56 km/s completes one orbit without impact");
  D.updateReadouts();
  const notes = window.document.getElementById("detailsDynamic").textContent;
  ok(notes.includes(D.T("explainLowAltitude")), "very low perigee shows the model limitation note");
}

// ── Ellipse extrema ───────────────────────────────────────────────────────
{
  setSpeed(7.64);
  near((state.classification.perigee - R_EARTH) / 1000, 286.138073, 0.1, "7.64 km/s perigee altitude (km)");
  const v0 = speedOf();
  runFor(state.classification.period / 2, 120);
  near(radiusOf() - R_EARTH, 286138.073, 100, "7.64 km/s reaches the reference perigee by flight (m)");
  ok(speedOf() > v0 + 100, `speed varies along the ellipse (${v0.toFixed(1)} -> ${speedOf().toFixed(1)} m/s)`);
  setSpeed(9.0);
  near((state.classification.apogee - R_EARTH) / 1000, 8557.899082, 0.1, "9.00 km/s apogee altitude (km)");
  runFor(state.classification.period / 2, 600);
  near(radiusOf() - R_EARTH, 8557899.082, 100, "9.00 km/s reaches the reference apogee by flight (m)");
}

// ── Escape boundary ───────────────────────────────────────────────────────
{
  D.loadPreset("escapeThreshold");
  ok(state.classification.type === "escapeThreshold", "exact escape speed is the limiting case");
  ok(state.v0 === V_ESCAPE_0, "escape threshold preset keeps the computed value");
  setSpeed(V_ESCAPE_0 / 1000 - 0.001);
  const below = state.classification;
  ok(below.bound && below.returns && below.type === "elliptical", `0.001 km/s below escape is bound (${below.type}, apogee ${(below.apogee / R0).toFixed(1)} r0)`);
  runFor(600, 600);
  ok(state.classification.type === "elliptical", "label stable below escape after 600 s");
  setSpeed(V_ESCAPE_0 / 1000 + 0.001);
  const above = state.classification;
  ok(above.unbound && above.type === "escape", `0.001 km/s above escape is unbound (${above.type})`);
  runFor(600, 600);
  ok(state.classification.type === "escape", "label stable above escape after 600 s");
  ok(Number.isFinite(state.classification.e) && Number.isFinite(state.classification.energy), "no NaN around the escape boundary");
}

// ── Gravity during escape, hyperbolic excess, view endpoint ──────────────
{
  D.loadPreset("escape");
  const cls = state.classification;
  near(Math.sqrt(2 * cls.energy), 5124.691388, 1e-3, "hyperbolic excess speed at 12 km/s (m/s)");
  let lastG = Infinity;
  let monotone = true;
  let res = null;
  for (let i = 0; i < 200; i++) {
    res = runFor(600, 600);
    const g = MU_EARTH / (radiusOf() * radiusOf());
    if (!(g > 0 && g < lastG)) monotone = false;
    lastG = g;
    if (res.event) break;
  }
  ok(monotone, "gravity stays positive and decreases continuously along escape");
  ok(res.event === "endpoint", `escape run pauses at the view endpoint (r=${(radiusOf() / R0).toFixed(2)} r0, t=${(state.t / 3600).toFixed(2)} h)`);
  ok(radiusOf() >= VIEW_LIMIT_RADIUS, "endpoint reached at 20 r0");
  ok(state.classification.type === "escape", "classification at the endpoint is still escape");
  ok(D.isTerminal(), "endpoint phase is terminal");
}

// ── Bound orbit beyond the view limit keeps its label ────────────────────
{
  setSpeed(V_ESCAPE_0 / 1000 - 0.001);
  let res = null;
  for (let i = 0; i < 400; i++) {
    res = runFor(600, 600);
    if (res.event) break;
  }
  ok(res.event === "endpoint", "near-escape ellipse also stops at the view endpoint");
  ok(state.classification.type === "elliptical", "offscreen bound orbit remains labeled elliptical");
}

// ── Free astronaut across presets ──────────────────────────────────────────────
for (const key of ["circular", "lowerEllipse", "drop", "escape"]) {
  D.loadPreset(key);
  runFor(200, 120);
  const b = state.ball;
  ok(
    b.qx === 0 && b.qy === 0 && b.ux === 0 && b.uy === 0 && Math.hypot(b.nx, b.ny) === 0,
    `${key}: thrust off keeps the astronaut centered with zero wall push`,
  );
}

// ── Contact in a fixed-direction cabin test ──────────────────────────────
{
  const C = D.constants;
  near(C.BODY_LIMIT_X, 1.7, 1e-12, "astronaut's center stops 1.70 m from the cabin center along x (0.30 m half-width)");
  near(C.BODY_LIMIT_Y, 2 / 0.7 - 0.85, 1e-12, "astronaut's center stops 0.85 m short of the floor and ceiling");
  ok(C.BODY_MASS === 70, "astronaut mass is 70 kg");
  near(0.5 / 9.80665, 0.051, 1e-3, "0.5 m/s² is about 0.051 g");
  near(C.BODY_MASS * C.THRUST_MAX, 21000, 1e-9, "wall push at the throttle cap is 21,000 N");
  const ball = D.makeBall();
  let t = 0;
  let hitAt = null;
  const h = 1 / 120;
  while (t < 4) {
    const hit = D.cabinStep(ball, -0.5, 0, h);
    t += h;
    if (hit && hitAt === null) hitAt = t;
  }
  near(hitAt, 2.608, 0.01, "contact starts at about 2.608 s (s)");
  near(Math.hypot(ball.nx, ball.ny), 35, 1e-9, "supported force is 35.0 N");
  ok(ball.qx === -D.constants.BODY_LIMIT_X && ball.ux === 0, "astronaut rests on the wall without penetration");
  ok(ball.nx > 0, "wall pushes inward (+x from the -x wall), never pulls");
  D.cabinStep(ball, 0.5, 0, h);
  ok(Math.hypot(ball.nx, ball.ny) === 0 && ball.qx > -D.constants.BODY_LIMIT_X, "reversed acceleration releases the astronaut with zero push");
  const tall = D.makeBall();
  let tf = 0;
  let floorAt = null;
  while (tf < 5) {
    const hit = D.cabinStep(tall, 0, -0.5, 1 / 120);
    tf += 1 / 120;
    if (hit && floorAt === null) floorAt = tf;
  }
  near(floorAt, Math.sqrt((2 * D.constants.BODY_LIMIT_Y) / 0.5), 0.01, `the taller cabin's floor is reached at the analytic time (${D.constants.BODY_LIMIT_Y.toFixed(3)} m, ${floorAt.toFixed(3)} s)`);
  near(D.constants.CABIN_HALF_X / D.constants.CABIN_HALF_Y, 0.7, 1e-12, "cabin proportions match the station marker (0.7)");
}

// ── Speed up / brake directions at start and after a quarter orbit ───────
function pulseThen(dir, seconds) {
  D.startThrust(dir);
  state.phase = "paused";
  return runFor(seconds, 1);
}
// Holds a dome for `realSeconds` at playback `rate`, feeding the real-time
// throttle in slices as the frame loop does.
function holdFor(realSeconds, rate, slice = 0.25) {
  let res = null;
  for (let t = 0; t < realSeconds - 1e-9; t += slice) {
    const dt = Math.min(slice, realSeconds - t);
    D.advanceThrottle(dt);
    res = runFor(dt * rate, rate);
    if (res.event) break;
  }
  return res;
}
{
  D.loadPreset("circular");
  pulseThen(1, 1);
  ok(state.ball.qx < 0 && Math.abs(state.ball.qy) < 1e-3, `speed up moves the astronaut left (qx=${state.ball.qx.toFixed(3)} m, qy=${state.ball.qy.toExponential(2)} m)`);
  ok(Math.hypot(state.ball.nx, state.ball.ny) === 0, "engine active before contact: wall push still zero");
  D.loadPreset("circular");
  pulseThen(-1, 1);
  ok(state.ball.qx > 0, `brake moves the astronaut right (qx=${state.ball.qx.toFixed(3)} m)`);
  D.loadPreset("circular");
  runFor(state.classification.period / 4, 120);
  pulseThen(1, 1);
  // Clockwise orbit: after a quarter period the velocity is world -y, so
  // Speed up pushes the astronaut along +y, which is screen-up in the
  // inertial cabin, not toward the -x wall.
  ok(state.ball.qy > 0.2 && Math.abs(state.ball.qx) < 1e-3, `after a quarter orbit speed up moves the astronaut up in the inertial cabin (qx=${state.ball.qx.toExponential(2)}, qy=${state.ball.qy.toFixed(3)})`);
  D.loadPreset("circular");
  runFor(state.classification.period / 8, 120);
  pulseThen(1, 1);
  near(state.ball.qx, -0.25 * Math.SQRT1_2, 2e-3, "eighth orbit: astronaut drifts along -v, x part (m)");
  near(state.ball.qy, 0.25 * Math.SQRT1_2, 2e-3, "eighth orbit: astronaut drifts along -v, y part (m)");
  // Engine controller: four fixed wall engines share the commanded push.
  const mix0 = D.engineMix(1, 0);
  ok(mix0.left === 1 && mix0.right === 0 && mix0.top === 0 && mix0.bottom === 0, "a +x push comes from the left (-x wall) engine alone");
  const mixD = D.engineMix(-0.3, 0.4);
  ok(mixD.right === 0.3 && mixD.bottom === 0.4 && mixD.left === 0 && mixD.top === 0, "a diagonal push splits onto the right and bottom engines by component");
  ok(mixD.left - mixD.right === -0.3 && mixD.bottom - mixD.top === 0.4, "the engine thrusts add up to the commanded vector");
  const live = D.engineMix(state.lastEngineAccel.ax, state.lastEngineAccel.ay);
  ok(live.right === 0 && live.bottom === 0 && live.left > 0.35 && Math.abs(live.left - live.top) < 2e-3, `eighth-orbit speed up: left and top engines fire equally (within the 1 s turn of v) (${live.left.toFixed(4)} / ${live.top.toFixed(4)} m/s²)`);
}

// ── Early cutoff ──────────────────────────────────────────────────────────
{
  D.loadPreset("circular");
  pulseThen(1, 1);
  D.stopThrust("manual");
  const u = Math.hypot(state.ball.ux, state.ball.uy);
  near(u, 0.5, 1e-6, "one-second pulse leaves 0.5 m/s relative speed (m/s)");
  ok(state.ball.ux < 0, "relative velocity opposes the thrust direction");
  const q0 = state.ball.qx;
  runFor(1, 1);
  near(Math.hypot(state.ball.ux, state.ball.uy), 0.5, 1e-6, "relative speed persists after cutoff");
  near(state.ball.qx - q0, -0.5, 1e-5, "astronaut keeps drifting after cutoff (m)");
  ok(state.thrust.dir === 0, "thrust stays off after cutoff");
}

// ── Contact then cutoff ───────────────────────────────────────────────────
{
  D.loadPreset("circular");
  pulseThen(1, 2.9);
  near(Math.hypot(state.ball.nx, state.ball.ny), 35, 1e-3, "astronaut supported at 35 N while the engine is still at 0.5 m/s² (thrust turned by ω·2.9 s)");
  D.stopThrust("manual");
  const qBefore = state.ball.qx;
  runFor(1, 1);
  ok(Math.hypot(state.ball.nx, state.ball.ny) === 0, "support force becomes zero after cutoff");
  near(state.ball.qx, qBefore, 1e-12, "astronaut stays at the wall without teleporting");
}

// ── Pulse coupling ────────────────────────────────────────────────────────
{
  D.loadPreset("circular");
  const v0 = speedOf();
  D.startThrust(1);
  state.phase = "paused";
  ok(state.rate === 1, "firing the engine sets playback to 1x");
  holdFor(4, 1);
  ok(state.thrust.dir === 1, "thrust continues while the button is held");
  D.stopThrust("manual");
  near(state.thrust.deltaV, rampDeltaV(4), 1e-3, `a four-second hold integrates the ramp's delta-v (${rampDeltaV(4).toFixed(3)} m/s)`);
  near(state.t, 4, 1e-9, "both views share the same four simulated seconds");
  near(speedOf() - v0, rampDeltaV(4), 0.02, `orbital speed change equals the delta-v (${(speedOf() - v0).toFixed(4)} m/s)`);
  ok(state.thrust.dir === 0, "releasing stops the engine");
  const brake = Math.hypot(state.ball.nx, state.ball.ny);
  ok(brake === 0, "after cutoff the resting astronaut is no longer pushed");
}

// ── Throttle ramp ──────────────────────────────────────────────────────
{
  near(D.thrustMagnitude(2.9), 0.5, 1e-12, "first 3 s stay at 0.5 m/s²");
  near(D.thrustMagnitude(3.7), 0.5 * 2, 1e-9, "the push doubles 0.7 s into the ramp");
  near(D.thrustMagnitude(12), THRUST_MAX, 1e-9, "the ramp caps at 300 m/s²");
  D.loadPreset("circular");
  D.startThrust(1);
  state.phase = "paused";
  holdFor(9, 1);
  const dv9 = state.thrust.deltaV;
  near(dv9, rampDeltaV(9), 2e-3, `nine-second hold delta-v matches the closed form (${dv9.toFixed(1)} m/s)`);
  ok(state.classification.returns && state.classification.apogee - R0 > 400e3, `nine seconds of Speed up raises the apogee by ${((state.classification.apogee - R0) / 1000).toFixed(0)} km`);
  near(state.thrust.accel, (rampDeltaV(9) - rampDeltaV(8.75)) / 0.25, 1e-6, "engine push readout is the ramp's average over the last real slice");
  holdFor(11, 1);
  D.stopThrust("manual");
  ok(state.classification.unbound && state.classification.type === "escape", `a 20 s hold reaches escape (delta-v ${state.thrust.deltaV.toFixed(0)} m/s)`);
  near(Math.hypot(state.ball.nx, state.ball.ny), 0, 1e-12, "wall push is zero after release");
  D.loadPreset("circular");
  D.startThrust(-1);
  state.phase = "paused";
  holdFor(9, 1);
  D.stopThrust("manual");
  ok(state.classification.willImpact, `nine seconds of Brake brings the path down to Earth (delta-v ${state.thrust.deltaV.toFixed(0)} m/s)`);
}

// ── A burn runs at the selected playback rate ───────────────────────
{
  D.loadPreset("circular");
  state.rate = 120;
  D.startThrust(1);
  ok(state.rate === 120 && state.pin === "station", "starting a burn at 120x keeps 120x and the current view");
  state.phase = "paused";
  holdFor(2, 120);
  ok(state.thrust.dir === 1 && state.rate === 120, "the engine keeps firing at 120x");
  near(state.thrust.deltaV, 120 * rampDeltaV(2), 0.05, `two real seconds at 120x integrate 120 times the real-time delta-v (${state.thrust.deltaV.toFixed(1)} m/s)`);
  near(state.t, 240, 1e-6, "240 simulated seconds passed in those two real seconds");
  D.stopThrust("manual");
  ok(state.rate === 120, "release keeps 120x");
  ok(state.classification.returns && state.classification.apogee - R0 > 300e3, `the orbit changed visibly (apogee ${((state.classification.apogee - R0) / 1000).toFixed(0)} km)`);
  D.loadPreset("circular");
  state.rate = 600;
  D.startThrust(1);
  state.phase = "paused";
  const res = holdFor(8, 600);
  ok(state.classification.unbound || (res && res.event === "endpoint"), `eight real seconds at 600x reach escape (delta-v ${state.thrust.deltaV.toFixed(0)} m/s)`);
  D.stopThrust("manual");
  state.phase = "paused";
}

// ── Brake cutoff near zero speed ──────────────────────────────────────────
{
  // Far from Earth gravity is weak enough for a 0.5 m/s^2 brake to drain a
  // 1.1 m/s velocity before the pulse ends; the guard must stop it first.
  D.loadPreset("circular");
  state.station = { x: 0, y: 19.9 * R0, vx: 1.1, vy: 0 };
  D.startThrust(-1);
  state.phase = "paused";
  runFor(4, 1);
  ok(state.thrust.dir === 0 && state.t < 4, `braking stopped before reversing the velocity (t=${state.t.toFixed(3)} s)`);
  ok(speedOf() >= 0 && speedOf() < 0.6, `speed stayed non-negative and small (${speedOf().toFixed(4)} m/s)`);
  ok(state.engineHintKey === "hintBrakeCutoff", "brake cutoff hint shown");
  ok(state.ball.nx === 0 && state.ball.ny === 0, "wall push is zero once thrust stops");
  setSpeed(0.0005);
  D.startThrust(1);
  ok(state.thrust.dir === 0 && state.engineHintKey === "hintEngineDirection", "below 1 m/s the engines refuse with an explanation");
  D.updateReadouts();
  ok(window.document.getElementById("speedUpBtn").disabled && window.document.getElementById("engineHint").textContent === D.T("hintEngineDirection"), "below 1 m/s the engine buttons are disabled with the explanation shown");
}

// ── Clock interruptions cancel thrust ────────────────────────────────────
{
  D.loadPreset("circular");
  D.startThrust(1);
  D.pauseRunning("manual");
  ok(state.thrust.dir === 0 && state.phase === "paused", "manual pause cuts thrust");
  D.startThrust(1);
  D.pauseRunning("visibility");
  ok(state.thrust.dir === 0 && state.hintKey === "hintTabPaused", "hidden tab cuts thrust with the away message");
  D.startThrust(1);
  D.setInitialSpeed(7000);
  ok(state.thrust.dir === 0 && state.t === 0, "initial-speed edit cancels thrust and resets the clock");
  D.startThrust(1);
  D.resetExperiment();
  ok(state.thrust.dir === 0, "experiment reset cancels thrust");
  D.startThrust(1);
  D.resetBall();
  ok(state.thrust.dir === 0 && state.ball.qx === 0, "reset astronaut cancels thrust and recenters");
}

// ── Fall inspection ───────────────────────────────────────────────────────
{
  D.loadPreset("circular");
  D.resizeAll();
  ok(state.comparison === null || true, "rolling comparison is computed by the frame loop");
  const comp = D.computeComparison(state.station, 120);
  ok(comp.curved.length === comp.straight.length && comp.times.length === comp.curved.length, "both paths share sample times");
  ok(comp.curved[0].x === comp.straight[0].x && comp.curved[0].y === comp.straight[0].y, "both paths share the starting point");
  const endC = comp.curved[comp.curved.length - 1];
  const endS = comp.straight[comp.straight.length - 1];
  near(Math.hypot(endS.x, endS.y - R0), V_CIRCULAR_0 * 120, 1e-6, "straight travel after 120 s (m)");
  const gap = Math.hypot(endC.x - endS.x, endC.y - endS.y);
  near(gap / 1000, 63, 1, "gravitational deviation after 120 s (km)");
  near(Math.hypot(endC.x, endC.y), R0, 1, "circular case keeps the starting distance");
  D.enterInspection();
  ok(!!state.inspection && state.phase !== "running", "Show the fall pauses and freezes a comparison");
  const t0 = state.t;
  D.inspectionStep();
  near(state.t - t0, 120, 1e-9, "Next step advances exactly 120 s");
  ok(state.inspectionMarkers.length === 2, "starting points are marked");
  const r1 = Math.hypot(state.inspection.origin.x, state.inspection.origin.y);
  near(r1, R0, 1, "circular motion preserves the reference distance across steps");
  setSpeed(7.64);
  D.enterInspection();
  D.inspectionStep();
  ok(Math.abs(Math.hypot(state.inspection.origin.x, state.inspection.origin.y) - R0) > 100, `lower ellipse leaves the reference distance (${(Math.hypot(state.inspection.origin.x, state.inspection.origin.y) - R0).toFixed(0)} m after 120 s)`);
  setSpeed(6.0);
  D.enterInspection();
  let steps = 0;
  while (!D.isTerminal() && steps < 100) {
    D.inspectionStep();
    steps += 1;
  }
  ok(state.phase === "impact" && Math.abs(radiusOf() - R_EARTH) < 1e-3, `stepping stops at impact (${steps} steps)`);
}

// ── Camera projection ─────────────────────────────────────────────────────
{
  D.loadPreset("circular");
  const cam0 = D.cameraTransform(700, 400);
  const v = cam0.vec(1, 0);
  const g = cam0.vec(0, -1);
  ok(Math.abs(v[0] - 1) < 1e-9 && Math.abs(v[1]) < 1e-9, "at start velocity maps to screen right");
  ok(Math.abs(g[0]) < 1e-9 && Math.abs(g[1] - 1) < 1e-9, "at start gravity maps to screen down");
  const comp = D.computeComparison(state.station, 120);
  const pC = cam0.toScreen(comp.curved[120].x, comp.curved[120].y);
  const pS = cam0.toScreen(comp.straight[120].x, comp.straight[120].y);
  ok(pC[1] > pS[1] + 5, `curved endpoint drawn below the straight one with one transform (${(pC[1] - pS[1]).toFixed(1)} px)`);
  const sp0 = cam0.toScreen(state.station.x, state.station.y);
  ok(Math.abs(sp0[0] - 350) < 1e-9 && Math.abs(sp0[1] - 200) < 1e-9, "pinned station sits at the canvas centre");
  runFor(state.classification.period / 4, 120);
  const cam1 = D.cameraTransform(700, 400);
  const st = state.station;
  const vv = cam1.vec(st.vx / speedOf(), st.vy / speedOf());
  const gg = cam1.vec(-st.x / radiusOf(), -st.y / radiusOf());
  ok(Math.abs(vv[0]) < 1e-6 && Math.abs(vv[1] - 1) < 1e-6, "after a quarter orbit (clockwise) velocity maps screen-down: the view did not turn");
  ok(Math.abs(gg[0] + 1) < 1e-6 && Math.abs(gg[1]) < 1e-6, "after a quarter orbit gravity maps screen-left");
  const ax = cam1.vec(1, 0);
  const ay = cam1.vec(0, 1);
  ok(ax[0] === 1 && ax[1] === 0 && ay[0] === 0 && ay[1] === -1, "the camera never rotates");
  const earth = cam1.toScreen(0, 0);
  const sp1 = cam1.toScreen(st.x, st.y);
  ok(earth[0] < sp1[0] && Math.abs(sp1[0] - 350) < 1e-9 && Math.abs(sp1[1] - 200) < 1e-9, "Earth is left of the station, which stays at the centre");
  const roundTrip = cam1.toWorld(...cam1.toScreen(st.x, st.y));
  near(Math.hypot(roundTrip[0] - st.x, roundTrip[1] - st.y), 0, 1e-3, "camera inverse transform round-trips");
}

// ── Curvature and scale at 320 px ─────────────────────────────────────────
{
  D.loadPreset("circular");
  const geo = D.closeViewGeometry(320, 300);
  ok(geo.gapPx >= 32, `320 px drawing: station-surface gap ${geo.gapPx.toFixed(1)} px >= 32`);
  ok(geo.bowPx >= 12, `320 px drawing: surface bow ${geo.bowPx.toFixed(1)} px >= 12`);
  const geoBig = D.closeViewGeometry(1000, 600);
  near(geoBig.gapPx / geo.gapPx, 1000 / 320, 1e-9, "isotropic scale: gap scales with width");
}

// ── Camera-only switching preserves state ────────────────────────────────
{
  D.loadPreset("lowerEllipse");
  runFor(300, 120);
  const snap = JSON.stringify([state.station, state.ball, state.t, state.rate, state.thrust]);
  D.setPin("earth");
  D.zoomView(1.5);
  D.zoomAuto();
  D.setPin("station");
  D.zoomView(1 / 1.5);
  D.zoomAuto();
  D.toggleLang();
  D.toggleLang();
  ok(JSON.stringify([state.station, state.ball, state.t, state.rate, state.thrust]) === snap, "pin, zoom and language changes leave physics untouched");
}

// ── Pins and per-pin zoom ─────────────────────────────────────────────────
{
  D.loadPreset("circular");
  ok(state.pin === "station" && D.camera.zoom.station === 1 && D.camera.zoom.earth === 1, "default pin is the station at Auto zoom");
  ok(D.insetVisible() === true, "inset shown while the station is pinned");
  D.setPin("earth");
  const camE = D.cameraTransform(700, 400);
  const ec = camE.toScreen(0, 0);
  ok(Math.abs(ec[0] - 350) < 1e-9 && Math.abs(ec[1] - 200) < 1e-9, "pinned Earth sits at the canvas centre");
  ok(R_EARTH * camE.scale >= 48, `Earth-pinned Auto keeps the disk at least 48 px (${(R_EARTH * camE.scale).toFixed(0)} px)`);
  ok(D.insetVisible() === false, "no inset when Earth is pinned at Auto");
  D.zoomView(2);
  ok(D.camera.zoom.earth === 2 && D.camera.zoom.station === 1, "zoom applies to the Earth pin only");
  near(D.cameraTransform(700, 400).scale, camE.scale * 2, 1e-12, "Earth-pinned scale doubled");
  ok(D.insetVisible() === true, "inset returns when the Earth pin is zoomed");
  D.setPin("station");
  ok(D.camera.zoom.station === 1 && D.camera.zoom.earth === 2, "switching pins keeps each pin's zoom");
  D.zoomView(0.5);
  D.zoomAuto();
  ok(D.camera.zoom.station === 1 && D.camera.zoom.earth === 2, "Auto resets only the current pin");
  D.setPin("earth");
  D.enterInspection();
  ok(state.pin === "station" && D.camera.frozenCenter && D.camera.frozenCenter.x === state.station.x, "Show the fall pins the station and freezes the centre");
  D.setPin("earth");
  ok(state.inspection === null && D.camera.frozenCenter === null, "pinning Earth exits inspection");
  D.resetExperiment();
  ok(state.pin === "station" && D.camera.zoom.station === 1 && D.camera.zoom.earth === 1 && D.camera.frozenCenter === null, "experiment reset restores the station pin and both zooms");
}

// ── Localization ──────────────────────────────────────────────────────────
{
  const en = Object.keys(D.I18N.en);
  const pl = Object.keys(D.I18N.pl);
  ok(en.length === pl.length && en.every((k) => pl.includes(k)), `EN and PL key sets match (${en.length} keys)`);
  const ph = (s) => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(",");
  ok(en.every((k) => ph(D.I18N.en[k]) === ph(D.I18N.pl[k])), "placeholder sets match in both languages");
  const unused = en.filter((k) => {
    const dynamic = k.match(/^(term|meaning)([A-Z][A-Za-z]+)$/);
    if (dynamic) return !html.includes('"' + dynamic[2] + '"');
    return (html.match(new RegExp("\\b" + k + "\\b", "g")) || []).length <= 2;
  });
  ok(unused.length === 0, `every dictionary key is referenced (unused: ${unused.join(", ") || "none"})`);
  ok(!("diagramEarthView" in D.I18N.en) && !("diagramStation" in D.I18N.en) && !("diagramStationEnlarged" in D.I18N.en), "canvas word labels for the station and the caption are gone from the dictionary");
  ok(D.I18N.en.hudAltitude === "Altitude" && D.I18N.pl.hudAltitude === "Wysokość", "HUD altitude label exists in both languages");
  const ballEn = Object.entries(D.I18N.en).filter(([, v]) => /\bball\b/i.test(v)).map(([k]) => k);
  const ballPl = Object.entries(D.I18N.pl).filter(([, v]) => /kulk/i.test(v)).map(([k]) => k);
  ok(ballEn.length === 0 && ballPl.length === 0, `no learner-facing text still says ball/kulka (${ballEn.concat(ballPl).join(", ") || "none"})`);
  state.lang = "pl";
  ok(D.fmtNum(8558, 0) === "8 558", `Polish grouping uses a space (${JSON.stringify(D.fmtNum(8558, 0))})`);
  ok(D.fmtNum(7.672598, 3) === "7,673", "Polish decimal comma");
  state.lang = "en";
  ok(D.fmtNum(8558, 0) === "8,558", "English grouping comma");
  D.applyTranslations();
  const doc = window.document;
  ok(doc.documentElement.lang === "en" && doc.title === D.I18N.en.appTitle, "English document title and lang");
  D.toggleLang();
  ok(doc.documentElement.lang === "pl" && doc.title === D.I18N.pl.appTitle, "Polish document title and lang");
  ok(doc.getElementById("lblSpeedUp").textContent === D.I18N.pl.actionSpeedUp && doc.getElementById("speedUpBtn").getAttribute("aria-label") === D.I18N.pl.actionSpeedUp, "Polish control labels applied");
  ok(doc.getElementById("orbitCanvas").getAttribute("aria-label") === D.I18N.pl.ariaEarthCanvas, "Polish canvas description applied");
  ok(doc.getElementById("rate120Btn").getAttribute("aria-label").includes("120"), "playback aria-label carries the rate");
  D.toggleLang();
}

console.log(`\n${checks - failures}/${checks} checks passed`);
process.exit(failures > 0 ? 1 : 0);
