// N11 pass-budget gate (GRAPHICS-OVERHAUL.md). Pure logic, CI-safe (no WebGL — the
// Reflector constructs on the CPU; the postfx tier switch is stubbed). Asserts the
// tier truth table that lets tier1 keep the wow:
//   god-rays  — tier0: 40 samples · ×1.0 · mask 0.5 | tier1: 16 · ×0.5 · mask 0.25 | tier2: off
//   reflection— tier0: 768² full-rate | tier1: 384² half-rate | tier2: cheap quad
//   both far-clamped on the reflective tiers; tier0 stays byte-identical (40/×1/0.5/768/full).
//   node tests/passbudget.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);
await import('./shim.mjs'); // browser-API globals (postfx → gameState → save.js touches window)
const THREE = await import('three');
const { createWater, setWaterReflective, updateWater, waterReflState, setWaterReflFar } = await import('../js/water.js');
const { setGodRayMaskScale, godRayMaskScale } = await import('../js/godrays.js');
const { postfx, setPostTier, postTierState } = await import('../js/postfx.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const url = (p) => new URL(p, import.meta.url);
const src = (p) => readFileSync(url(p), 'utf8');

// --- 1. reflection tier table (functional; Reflector builds headless) ---------
const added = [];
const scene = { add: (o) => added.push(o), remove: (o) => { const i = added.indexOf(o); if (i >= 0) added.splice(i, 1); } };
const water = () => added[added.length - 1];

createWater(scene, 0); // tier0
check('tier0 → Reflector 768² full-rate', water().isReflector && water().getRenderTarget().width === 768 && waterReflState().halfRate === false);
const t0mesh = water();

setWaterReflective(1); // tier1 — must REBUILD even though both tiers are reflective
check('tier0→tier1 actually rebuilt (mirrorRes in the seam key)', water() !== t0mesh);
check('tier1 → Reflector 384² half-rate', water().isReflector && water().getRenderTarget().width === 384 && waterReflState().halfRate === true);

setWaterReflective(2); // tier2 — cheap quad, no Reflector
check('tier2 → cheap quad (not a Reflector)', !water().isReflector && waterReflState().reflective === false);

setWaterReflective(0); // back to tier0
check('tier2→tier0 → Reflector 768² again', water().isReflector && water().getRenderTarget().width === 768 && waterReflState().halfRate === false);

// half-rate parity is per PRESENTED frame (updateWater), not per draw; rebuild resets it to 0.
setWaterReflective(1);
check('rebuild resets parity to 0 (fresh RT renders next frame, never presents black)', waterReflState().parity === 0);
updateWater(0.016, 100, 1); const p1 = waterReflState().parity;
updateWater(0.016, 100, 1); const p2 = waterReflState().parity;
check(`updateWater bumps parity each frame (${p1}→${p2}, odd frames skip the mirror)`, p1 === 1 && p2 === 2);

// far-clamp kill-switch is live (no rebuild)
check('reflFar default ON', waterReflState().reflFar === true);
setWaterReflFar(false); check('setWaterReflFar(false) → OFF (kill-switch for the A/B)', waterReflState().reflFar === false);
setWaterReflFar(true);

// --- 2. god-ray tier table (functional; postfx stubbed, no composer) ----------
postfx.supported = true;
postfx.composer = null; // applySize early-outs → no WebGL
postfx.bloomPass = { strength: 0 };
postfx.godRayPass = { enabled: false, uniforms: { uSamples: { value: 40 } } };

setPostTier(0);
check('tier0 god-rays: 40 samples · ×1.0 · mask 0.5 (byte-identical to shipped)',
  postTierState().uSamples === 40 && postTierState().grIntenScale === 1 && godRayMaskScale() === 0.5 && postTierState().grTierOK === true);

setPostTier(1);
check('tier1 god-rays: 16 samples · ×0.5 · mask 0.25 (cheapened, still on)',
  postTierState().uSamples === 16 && postTierState().grIntenScale === 0.5 && godRayMaskScale() === 0.25 && postTierState().grTierOK === true);

setPostTier(2);
check('tier2 → composer off entirely (god-rays irrelevant)', postfx.enabled === false);

// --- 3. mask-scale setter + the small-viewport floor (source) -----------------
setGodRayMaskScale(0.5); check('setGodRayMaskScale(0.5) getter', godRayMaskScale() === 0.5);
setGodRayMaskScale(0.25); check('setGodRayMaskScale(0.25) getter', godRayMaskScale() === 0.25);
check('godrays: 96px/axis floor guards small-viewport quarter-res dropout', /Math\.max\(96,\s*Math\.floor\([^)]*_maskScale\)/.test(src('../js/godrays.js')));

// --- 4. source drift guards ---------------------------------------------------
check('postfx: tier1 shafts scaled by _grIntenScale (halved, not full)', /_grIntensity \* _grIntenScale/.test(src('../js/postfx.js')));
check('postfx: god-rays gated at tier ≤ 1 (_grTierOK), not tier-0-only', /_grTierOK = tier <= 1/.test(src('../js/postfx.js')));
check('main: applyQuality passes the raw tier to setWaterReflective', /setWaterReflective\(tier\)/.test(src('../js/main.js')));
check('water: far-clamp reads the LIVE per-material fogFar (not stale sharedUniforms)', /this\.material\.uniforms\.fogFar/.test(src('../js/water.js')));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
