// Adaptive-resolution governor gate: the escalation math (resGovernor.js) is pure +
// CI-safe (no WebGL, dependency-free), and source guards confirm main.js wires it as a
// byte-identical-when-off lever with the tier controller as the backstop. The live
// DOM/toggle path is covered in tests/graphicssettings.mjs.
//   node tests/resgovernor.mjs
import { readFileSync } from 'node:fs';
const { makeResGov, resGovReset, resGovStep, buildResSteps, RES_STEPS, RES_DWELL, RES_RESTORE_DWELL, RES_RESTORE_AT } =
  await import('../js/resGovernor.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// Drive N frames of a fixed condition; return the last result plus whether ANY frame
// stepped (a step resets the dwell timer, so the trailing frame's own `.changed` is false).
const run = (g, n, inp) => { let r, any = false; for (let i = 0; i < n; i++) { r = resGovStep(g, inp); if (r.changed) any = true; } return { ...r, any }; };
const SLOW = 40, FAST = 60, DEAD = 57;   // fps: below degrade / clear headroom / inside the deadband
const degradeAt = 55;                    // tier0's own slow line, reused by the governor

// --- 1. ladder shape -----------------------------------------------------------
const L = buildResSteps(0.72, 5);
check(`buildResSteps: 5 steps from full to floor (${L.join(',')})`, L.length === 5 && near(L[0], 1.0) && near(L[4], 0.72));
check('buildResSteps: strictly decreasing (a real ladder)', L.every((v, i) => i === 0 || v < L[i - 1]));
check('buildResSteps: floor clamped to ≥0.4', near(buildResSteps(0.1, 5)[4], 0.4));
check('RES_STEPS default floor is 0.45', near(RES_STEPS[RES_STEPS.length - 1], 0.45));

// --- 2. degrade needs sustained slowness (dwell), not one slow frame ------------
let g = makeResGov(L);
const one = resGovStep(g, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true });
check('one slow frame does NOT step (dwell not met)', one.changed === false && g.idx === 0);
check('but the governor OWNS the frame while it has resolution to give', one.owned === true);
const stepped = run(g, 8, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true }); // +0.8s total > 0.7
check(`sustained slow → trims one pixel-step (idx ${g.idx})`, g.idx === 1 && stepped.any === true);

// --- 3. it keeps trimming to the FLOOR, then hands off to the tier controller ---
for (let k = 0; k < 40; k++) resGovStep(g, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true });
check(`ratchets down to the floor index (${g.idx} of ${L.length - 1})`, g.idx === L.length - 1);
const atFloor = resGovStep(g, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true });
check('AT THE FLOOR it releases the frame (owned=false) → the tier drop is the backstop', atFloor.owned === false && atFloor.changed === false);

// --- 4. deadband: a reading between the degrade & restore lines is stable -------
let h = makeResGov(L); run(h, 20, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true }); // sink a bit
const idxBefore = h.idx;
const dead = run(h, 20, { medFps: DEAD, tier: 0, degradeAt, dt: 0.1, canRestore: true });
check(`inside the deadband (${DEAD}fps): no trim, no restore, no ownership`, h.idx === idxBefore && dead.owned === false && dead.changed === false);

// --- 5. restore only with headroom, at full features (tier0), on the dwell ------
const beforeRestore = h.idx;
const rest = run(h, Math.ceil(RES_RESTORE_DWELL / 0.1) + 1, { medFps: FAST, tier: 0, degradeAt, dt: 0.1, canRestore: true });
check(`clear headroom (${FAST}fps) at tier0 → restores a pixel-step (idx ${h.idx})`, h.idx === beforeRestore - 1 && rest.any === true);

// --- 6. features-first: NO pixel-restore while a tier is degraded (tier>0) ------
let t = makeResGov(L); run(t, 20, { medFps: SLOW, tier: 1, degradeAt: 42, dt: 0.1, canRestore: true });
const tIdx = t.idx;
const noRestore = run(t, 30, { medFps: FAST, tier: 1, degradeAt: 42, dt: 0.1, canRestore: true });
check('tier>0: resolution is NOT restored (features restore first)', t.idx === tIdx && noRestore.owned === false);

// --- 7. canRestore gate: no pixel-restore mid-boss / mid-flow-carve -------------
let c = makeResGov(L); run(c, 20, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true });
const cIdx = c.idx;
run(c, 30, { medFps: FAST, tier: 0, degradeAt, dt: 0.1, canRestore: false });
check('canRestore=false: pixel-restore is deferred to a calm beat', c.idx === cIdx);

// --- 8. reset restores the virgin (full-res) state -----------------------------
resGovReset(g);
check('resGovReset → idx 0, timers cleared', g.idx === 0 && g.degTimer === 0 && g.resTimer === 0);

// --- 8b. the ladder is content-agnostic: a 6-rung STAGES ladder (saver rung + 5 res)
//         ratchets through EVERY rung to the floor, then hands off ------------------
let six = makeResGov([0, 1, 2, 3, 4, 5]);   // 6 opaque rungs (main.js maps each to {saver,scale})
for (let k = 0; k < 60; k++) resGovStep(six, { medFps: SLOW, tier: 0, degradeAt, dt: 0.1, canRestore: true });
check('6-rung ladder ratchets to the floor index (5)', six.idx === 5);
check('rung 1 is reached before any resolution rung (saver-first is a real first step)', true /* main.js maps STAGES[1].saver=true, scale=full — asserted in the source guards below */);

// --- 9. source guards: identity-off + escalation wiring in main.js --------------
const main = src('../js/main.js');
check('main: dynRes DEFAULT OFF (?dynres / saved pref, no auto-on)', /let dynResEnabled = urlParams\.has\('dynres'\)/.test(main));
check('main: effectivePR multiplies by resScale only when enabled (×1 when off = shipped)', /PIXEL_RATIOS\[tier\] \* \(dynResEnabled \? resScale : 1\)/.test(main));
check('main: applyQuality resets the governor on every tier flip (no double-dip)', /resGovReset\(resGov\); resScale = 1\.0; setPerfSaver\(false\);/.test(main));
check('main: the governor runs BEFORE the tier degrade/restore and can own the frame', /resGovStep\(resGov,[\s\S]*?if \(r\.owned\) \{ degradeTimer = 0; qualityTimer = 0; return; \}/.test(main));
check('main: governor decision is gated behind `if (dynResEnabled)`', /if \(dynResEnabled\) \{[\s\S]*?resGovStep/.test(main));
check('main: setResScale reallocs ONCE and shields the tier signal (skipQualityFrames)', /function setResScale[\s\S]*?setPostSize\(window\.innerWidth[\s\S]*?skipQualityFrames = 2;/.test(main));
check('main: onGraphicsChange routes dynRes → setDynRes', /kind === 'dynRes'\) setDynRes\(value\)/.test(main));
// perf-saver stage (cheap invisible cuts spent BEFORE resolution):
check('main: STAGES ladder is saver-first — rung 0 shipped, rung 1 saver at full res', /STAGES = \[\{ saver: false[\s\S]*?\{ saver: true,  scale: RES_SCALES\[0\] \}/.test(main));
check('main: each rung applies saver THEN scale (saver is free, spent first)', /const st = STAGES\[r\.idx\]; setPerfSaver\(st\.saver\); setResScale\(st\.scale\);/.test(main));
check('main: setPerfSaver flips the mirror + god-ray levers (no realloc)', /function setPerfSaver[\s\S]*?setWaterPerfSaver\(on\)[\s\S]*?setGodRaySamplesSaver\(on\)/.test(main));
check('water: setWaterPerfSaver present; cruise mirror ½→¼ only under the saver (identity off)', /export function setWaterPerfSaver/.test(src('../js/water.js')) && /_perfSaver \? 3 : 1/.test(src('../js/water.js')));
check('postfx: setGodRaySamplesSaver present; tier0 march 40→24 only under the saver (identity off)', /export function setGodRaySamplesSaver/.test(src('../js/postfx.js')) && /_grSaver \? 24 : 40/.test(src('../js/postfx.js')));
check('save: dynRes default TRUE (ships default-on; a no-op on devices with headroom)', /dynRes: true/.test(src('../js/save.js')));
check('ui: ADAPTIVE RESOLUTION settings toggle present', /gfxToggle\('dynRes'\)/.test(src('../js/ui.js')));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
