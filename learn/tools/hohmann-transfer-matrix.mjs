import fs from "fs";
import path from "path";
import vm from "vm";

const TWO_PI = 2 * Math.PI;
const DEG2RAD = Math.PI / 180;
const EASY_TOL_BURN_PCT = 0.15;
const SAMPLE_DELTA = 0.2;

function fail(message) {
  throw new Error(message);
}

function extractLiteral(source, name) {
  const marker = `const ${name} =`;
  const start = source.indexOf(marker);
  if (start < 0) fail(`Could not find ${name} in hohmann.html`);
  const after = start + marker.length;
  const semi = source.indexOf(";", after);
  if (semi < 0) fail(`Could not parse ${name} literal`);
  return source.slice(after, semi).trim();
}

function loadAppConfig() {
  const file = path.resolve("hohmann.html");
  const source = fs.readFileSync(file, "utf8");
  const muLiteral = extractLiteral(source, "MU_SUN");
  const bodiesLiteral = extractLiteral(source, "BODIES");
  const planetKeysLiteral = extractLiteral(source, "PLANET_KEYS");
  const sandbox = { Math };
  const MU_SUN = vm.runInNewContext(muLiteral, sandbox);
  const BODIES = vm.runInNewContext(`(${bodiesLiteral})`, sandbox);
  const PLANET_KEYS = vm.runInNewContext(`(${planetKeysLiteral})`, sandbox);
  return { MU_SUN, BODIES, PLANET_KEYS };
}

function buildBodies(rawBodies) {
  const bodies = {};
  for (const raw of rawBodies) {
    if (raw.key === "sun") continue;
    const body = { ...raw };
    body.pomegaRad = body.pomega * DEG2RAD;
    body.L0rad = body.L0 * DEG2RAD;
    body.n = TWO_PI / body.T;
    body.M0 = body.L0rad - body.pomegaRad;
    body.bSemi = body.a * Math.sqrt(1 - body.e * body.e);
    body.cosPom = Math.cos(body.pomegaRad);
    body.sinPom = Math.sin(body.pomegaRad);
    bodies[body.key] = body;
  }
  return bodies;
}

function wrapAngle(angle) {
  let a = angle % TWO_PI;
  if (a > Math.PI) a -= TWO_PI;
  if (a < -Math.PI) a += TWO_PI;
  return a;
}

function solveKepler(M, e) {
  let m = M % TWO_PI;
  if (m > Math.PI) m -= TWO_PI;
  if (m < -Math.PI) m += TWO_PI;
  let E = m;
  for (let i = 0; i < 20; i += 1) {
    const dE = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-13) break;
  }
  return Number.isFinite(E) ? E : m;
}

function helioPosition(body, t) {
  const M = body.M0 + body.n * t;
  const E = solveKepler(M, body.e);
  const xp = body.a * (Math.cos(E) - body.e);
  const yp = body.bSemi * Math.sin(E);
  return {
    x: xp * body.cosPom - yp * body.sinPom,
    y: xp * body.sinPom + yp * body.cosPom,
  };
}

function helioVelocity(body, t) {
  const M = body.M0 + body.n * t;
  const E = solveKepler(M, body.e);
  const sinE = Math.sin(E);
  const cosE = Math.cos(E);
  const denom = 1 - body.e * cosE;
  const factor = (body.n * body.a) / denom;
  const vxp = -factor * sinE;
  const vyp = factor * (body.bSemi / body.a) * cosE;
  return {
    vx: vxp * body.cosPom - vyp * body.sinPom,
    vy: vxp * body.sinPom + vyp * body.cosPom,
  };
}

function computeHohmannRef(home, dest, MU_SUN) {
  const r1 = home.a;
  const r2 = dest.a;
  const aTransfer = (r1 + r2) / 2;
  const tTransfer = 0.5 * Math.pow(aTransfer, 1.5);
  const vCircHome = Math.sqrt(MU_SUN / r1);
  const vCircDest = Math.sqrt(MU_SUN / r2);
  const vDep = Math.sqrt(MU_SUN * (2 / r1 - 1 / aTransfer));
  const vArr = Math.sqrt(MU_SUN * (2 / r2 - 1 / aTransfer));
  const dv1 = Math.abs(vDep - vCircHome);
  const dv2 = Math.abs(vCircDest - vArr);
  return {
    aTransfer,
    tTransfer,
    dv1,
    dv2,
    vCircHome,
    vCircDest,
    vDep,
    vArr,
    phaseAngle: wrapAngle(Math.PI - dest.n * tTransfer),
    outward: dest.a > home.a,
  };
}

function stateToOrbit(x, y, vx, vy, tEpoch, MU_SUN) {
  const r = Math.hypot(x, y);
  const v2 = vx * vx + vy * vy;
  const h = x * vy - y * vx;
  const a = 1 / (2 / r - v2 / MU_SUN);
  if (a <= 0 || !Number.isFinite(a)) {
    return { conicType: "escape", a, e: 2, h, tEpoch };
  }
  const rdot = (x * vx + y * vy) / r;
  const ex = (v2 / MU_SUN - 1 / r) * x - (rdot / MU_SUN) * r * vx;
  const ey = (v2 / MU_SUN - 1 / r) * y - (rdot / MU_SUN) * r * vy;
  const e = Math.hypot(ex, ey);
  if (e >= 1) return { conicType: "escape", a, e, h, tEpoch };
  const pomegaRad = Math.atan2(ey, ex);
  const bSemi = a * Math.sqrt(1 - e * e);
  const cosNu = (ex * x + ey * y) / (e * r + 1e-30);
  const sinNu = (ex * y - ey * x) / (e * r + 1e-30);
  const nu = Math.atan2(sinNu, cosNu);
  const E = Math.atan2(
    Math.sqrt(1 - e * e) * Math.sin(nu),
    e + Math.cos(nu),
  );
  const M0 = E - e * Math.sin(E);
  const n = Math.sqrt(MU_SUN / (a * a * a));
  return {
    conicType: "elliptic",
    a,
    e,
    pomegaRad,
    bSemi,
    cosPom: Math.cos(pomegaRad),
    sinPom: Math.sin(pomegaRad),
    n,
    M0,
    tEpoch,
    h,
  };
}

function orbitPositionAt(orbit, t) {
  const dt = t - orbit.tEpoch;
  const M = orbit.M0 + orbit.n * dt;
  const E = solveKepler(M, orbit.e);
  const xp = orbit.a * (Math.cos(E) - orbit.e);
  const yp = orbit.bSemi * Math.sin(E);
  return {
    x: xp * orbit.cosPom - yp * orbit.sinPom,
    y: xp * orbit.sinPom + yp * orbit.cosPom,
  };
}

function currentPhaseAngle(home, dest, t) {
  const hp = helioPosition(home, t);
  const dp = helioPosition(dest, t);
  return wrapAngle(Math.atan2(dp.y, dp.x) - Math.atan2(hp.y, hp.x));
}

function phaseError(home, dest, ref, t) {
  return wrapAngle(currentPhaseAngle(home, dest, t) - ref.phaseAngle);
}

function findLaunchWindow(home, dest, ref) {
  const synodicRate = Math.abs(home.n - dest.n);
  const synodic = TWO_PI / synodicRate;
  const scanStep = synodic / 20000;
  let prevT = 0;
  let prevErr = phaseError(home, dest, ref, prevT);
  for (let t = scanStep; t <= synodic * 1.5; t += scanStep) {
    const err = phaseError(home, dest, ref, t);
    if (Math.abs(err) < 1e-12) return t;
    if (prevErr === 0 || prevErr * err < 0) {
      let lo = prevT;
      let hi = t;
      let flo = prevErr;
      for (let i = 0; i < 80; i += 1) {
        const mid = (lo + hi) / 2;
        const fmid = phaseError(home, dest, ref, mid);
        if (Math.abs(fmid) < 1e-13) return mid;
        if (flo * fmid <= 0) hi = mid;
        else {
          lo = mid;
          flo = fmid;
        }
      }
      return (lo + hi) / 2;
    }
    prevT = t;
    prevErr = err;
  }
  fail(`Could not find launch window for ${home.key} -> ${dest.key}`);
}

function buildMissOrbit(home, ref, MU_SUN, tLaunch, dvApplied) {
  const hp = helioPosition(home, tLaunch);
  const hv = helioVelocity(home, tLaunch);
  const speed = Math.hypot(hv.vx, hv.vy);
  const px = hv.vx / speed;
  const py = hv.vy / speed;
  const dir = ref.outward ? 1 : -1;
  return stateToOrbit(
    hp.x,
    hp.y,
    hv.vx + dir * dvApplied * px,
    hv.vy + dir * dvApplied * py,
    tLaunch,
    MU_SUN,
  );
}

function sampleRadialReach(orbit, tLaunch, outward) {
  if (orbit.conicType !== "elliptic") {
    return outward ? Infinity : 0;
  }
  const halfPeriod = Math.PI / orbit.n;
  const samples = 3000;
  let reach = outward ? -Infinity : Infinity;
  for (let i = 0; i <= samples; i += 1) {
    const t = tLaunch + (halfPeriod * i) / samples;
    const pos = orbitPositionAt(orbit, t);
    const r = Math.hypot(pos.x, pos.y);
    if (outward) reach = Math.max(reach, r);
    else reach = Math.min(reach, r);
  }
  return reach;
}

function apses(orbit) {
  if (orbit.conicType !== "elliptic") return { peri: NaN, apo: Infinity };
  return {
    peri: orbit.a * (1 - orbit.e),
    apo: orbit.a * (1 + orbit.e),
  };
}

function classifyExpectation(ref) {
  if (ref.outward) {
    return {
      direction: "outward",
      underburn: "falls short; max radius stays inside the nominal arrival radius",
      nominal: "reaches the nominal arrival radius",
      overburn: "overshoots; max radius extends beyond the nominal arrival radius",
      metric: "maxRadiusFirstHalf",
      inequality: "under < target < over",
    };
  }
  return {
    direction: "inward",
    underburn: "does not drop inward enough; min radius stays outside the nominal arrival radius",
    nominal: "reaches the nominal arrival radius",
    overburn: "dives too far inward; min radius goes inside the nominal arrival radius",
    metric: "minRadiusFirstHalf",
    inequality: "under > target > over",
  };
}

function isGuidedBurn1(dvApplied, refDv1) {
  const low = refDv1 * (1 - EASY_TOL_BURN_PCT);
  const high = refDv1 * (1 + EASY_TOL_BURN_PCT);
  return dvApplied >= low && dvApplied <= high;
}

function analyzeTransfer(home, dest, MU_SUN) {
  const ref = computeHohmannRef(home, dest, MU_SUN);
  const tLaunch = findLaunchWindow(home, dest, ref);
  const nominalArrivalRadius = Math.hypot(
    helioPosition(dest, tLaunch + ref.tTransfer).x,
    helioPosition(dest, tLaunch + ref.tTransfer).y,
  );
  const underDv = ref.dv1 * (1 - SAMPLE_DELTA);
  const nominalDv = ref.dv1;
  const overDv = ref.dv1 * (1 + SAMPLE_DELTA);
  const underOrbit = buildMissOrbit(home, ref, MU_SUN, tLaunch, underDv);
  const nominalOrbit = buildMissOrbit(home, ref, MU_SUN, tLaunch, nominalDv);
  const overOrbit = buildMissOrbit(home, ref, MU_SUN, tLaunch, overDv);
  const underReach = sampleRadialReach(underOrbit, tLaunch, ref.outward);
  const nominalReach = sampleRadialReach(nominalOrbit, tLaunch, ref.outward);
  const overReach = sampleRadialReach(overOrbit, tLaunch, ref.outward);
  const underPasses = ref.outward
    ? underReach < nominalArrivalRadius
    : underReach > nominalArrivalRadius;
  const nominalPasses = ref.outward
    ? Math.abs(nominalReach - nominalArrivalRadius) / nominalArrivalRadius < 0.06
    : Math.abs(nominalReach - nominalArrivalRadius) / nominalArrivalRadius < 0.06;
  const overPasses = ref.outward
    ? overReach > nominalArrivalRadius
    : overReach < nominalArrivalRadius;
  const orderingPasses = ref.outward
    ? underReach < nominalReach && nominalReach <= overReach
    : underReach > nominalReach && nominalReach > overReach;
  const guidedStraddlePasses = underPasses && overPasses;
  const physicsDirectionPasses =
    orderingPasses && !isGuidedBurn1(underDv, ref.dv1) && !isGuidedBurn1(overDv, ref.dv1);
  return {
    home: home.key,
    dest: dest.key,
    ref,
    expectation: classifyExpectation(ref),
    tLaunch,
    nominalArrivalRadius,
    under: {
      multiplier: 1 - SAMPLE_DELTA,
      dv: underDv,
      guided: isGuidedBurn1(underDv, ref.dv1),
      orbit: underOrbit,
      apses: apses(underOrbit),
      reach: underReach,
      passes: underPasses,
    },
    nominal: {
      multiplier: 1,
      dv: nominalDv,
      guided: isGuidedBurn1(nominalDv, ref.dv1),
      orbit: nominalOrbit,
      apses: apses(nominalOrbit),
      reach: nominalReach,
      passes: nominalPasses,
    },
    over: {
      multiplier: 1 + SAMPLE_DELTA,
      dv: overDv,
      guided: isGuidedBurn1(overDv, ref.dv1),
      orbit: overOrbit,
      apses: apses(overOrbit),
      reach: overReach,
      passes: overPasses,
    },
    orderingPasses,
    guidedStraddlePasses,
    physicsDirectionPasses,
  };
}

function buildPairs(planetKeys, neighborsOnly) {
  const pairs = [];
  for (let i = 0; i < planetKeys.length; i += 1) {
    for (let j = 0; j < planetKeys.length; j += 1) {
      if (i === j) continue;
      if (neighborsOnly && Math.abs(i - j) !== 1) continue;
      pairs.push([planetKeys[i], planetKeys[j]]);
    }
  }
  return pairs;
}

function formatNum(value, digits = 4) {
  if (!Number.isFinite(value)) return String(value);
  return value.toFixed(digits);
}

function printTextReport(results, neighborsOnly) {
  const total = results.length;
  const physicsFailures = results.filter((result) => !result.physicsDirectionPasses);
  const guidedTargetFailures = results.filter(
    (result) => !result.guidedStraddlePasses || !result.nominal.passes,
  );
  console.log(
    `Scope: ${neighborsOnly ? "neighboring ordered pairs" : "all ordered pairs"}`,
  );
  console.log(`Pairs tested: ${total}`);
  console.log(`Physics-direction failures: ${physicsFailures.length}`);
  console.log(`Guided-target mismatches: ${guidedTargetFailures.length}`);
  console.log("");
  if (results[0]) {
    console.log("Expectation model:");
    console.log(
      "- Outward: underburn => maxRadiusFirstHalf < target < overburn maxRadiusFirstHalf",
    );
    console.log(
      "- Inward: underburn => minRadiusFirstHalf > target > overburn minRadiusFirstHalf",
    );
    console.log(
      "- target = destination orbital radius at the app's nominal guided-arrival time",
    );
    console.log(
      "- Separate check: underburn/nominal/overburn should be ordered around the physical nominal miss orbit even if the app's guided target is elsewhere",
    );
    console.log("");
  }
  for (const result of results) {
    const guidedTargetPass = result.guidedStraddlePasses && result.nominal.passes;
    console.log(
      `${result.physicsDirectionPasses ? "PHYS" : "FAIL"} ${result.home} -> ${result.dest} (${result.expectation.direction})`,
    );
    console.log(
      `  target=${formatNum(result.nominalArrivalRadius)} AU, metric=${result.expectation.metric}, launch=${formatNum(result.tLaunch * 365.25, 1)} d`,
    );
    console.log(
      `  under x${formatNum(result.under.multiplier, 2)}: reach=${formatNum(result.under.reach)} AU, guided=${result.under.guided}, pass=${result.under.passes}`,
    );
    console.log(
      `  nominal x1.00: reach=${formatNum(result.nominal.reach)} AU, pass=${result.nominal.passes}`,
    );
    console.log(
      `  over  x${formatNum(result.over.multiplier, 2)}: reach=${formatNum(result.over.reach)} AU, guided=${result.over.guided}, pass=${result.over.passes}`,
    );
    console.log(
      `  physicsDirection=${result.physicsDirectionPasses}, ordering=${result.orderingPasses}, guidedTarget=${guidedTargetPass}`,
    );
    console.log(
      `  apses under=[${formatNum(result.under.apses.peri)}, ${formatNum(result.under.apses.apo)}], nominal=[${formatNum(result.nominal.apses.peri)}, ${formatNum(result.nominal.apses.apo)}], over=[${formatNum(result.over.apses.peri)}, ${formatNum(result.over.apses.apo)}]`,
    );
  }
}

function main() {
  const neighborsOnly = process.argv.includes("--neighbors-only");
  const json = process.argv.includes("--json");
  const { MU_SUN, BODIES, PLANET_KEYS } = loadAppConfig();
  const bodies = buildBodies(BODIES);
  const pairs = buildPairs(PLANET_KEYS, neighborsOnly);
  const results = pairs.map(([homeKey, destKey]) =>
    analyzeTransfer(bodies[homeKey], bodies[destKey], MU_SUN),
  );
  if (json) {
    console.log(
      JSON.stringify(
        {
          scope: neighborsOnly ? "neighbors-only" : "all-ordered-pairs",
          sampleDelta: SAMPLE_DELTA,
          easyTolerance: EASY_TOL_BURN_PCT,
          results,
        },
        null,
        2,
      ),
    );
    return;
  }
  printTextReport(results, neighborsOnly);
}

main();
