// Aurora Shallows sky-splice gate (BIOME plan §1). Pure logic, CI-safe (no WebGL): the
// curtain block is uniform-branched (off = zero cost + byte-identical shipped sky), the
// authenticity invariants are present in the shader (bottom-anchored border, physics ramp,
// seam-free noise), the JS driver's tier table + phase-wrap are right, the biome channel is
// 0 in every shipped biome, and — critically — the curtain is PROBE-INVISIBLE.
//   node tests/aurora.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
register('../tools/three-resolver.mjs', import.meta.url);
const THREE = await import('three');
globalThis.window = globalThis;
globalThis.location = { search: '', origin: 'http://test', pathname: '/' };
const {
  AURORA_HEAD, AURORA_BODY, auroraUniforms, applyAurora,
  setAuroraEnabled, setAuroraForced, setAuroraQuality, auroraEnabled,
} = await import('../js/auroraSky.js');
const { computeEnv, BIOMES, setForcedBiome } = await import('../js/biomes.js');
const { CONFIG } = await import('../js/config.js');

let pass = 0, fail = 0;
const check = (label, ok) => { if (ok) { pass++; } else { fail++; console.error(`FAIL: ${label}`); } };
const url = (p) => new URL(p, import.meta.url);

// --- 1. the curtain block is UNIFORM-BRANCHED (off = zero cost, not branchless *0) --
check('AURORA_BODY is uniform-branched (if uAuroraMix > eps)', /if\s*\(\s*uAuroraMix\s*>\s*0\.0001\s*\)/.test(AURORA_BODY));
check('aurLum hoisted =0 above the branch (star-attenuation coupling, identity off)', /float\s+aurLum\s*=\s*0\.0;[\s\S]*if\s*\(\s*uAuroraMix/.test(AURORA_BODY));
check('AURORA_HEAD declares the gate + curtain uniforms', /uAuroraMix/.test(AURORA_HEAD) && /uAurPhase/.test(AURORA_HEAD) && /uAurLayers/.test(AURORA_HEAD) && /uAurGreen/.test(AURORA_HEAD));
check('AURORA_HEAD carries SELF-CONTAINED noise (no shared symbol collision)', /float\s+_aHash/.test(AURORA_HEAD) && /float\s+_aNoise/.test(AURORA_HEAD));

// --- 2. the authenticity invariants (the ONE thing: bottom-anchored curtains) -----
check('SEAM-FREE: noise on normalize(d.xz), not an atan azimuth', /normalize\(\s*d\.xz/.test(AURORA_BODY) && !/atan/.test(AURORA_BODY));
check('CRISP border ONSET + a luminous rose SKIRT below (no hard zero → no floating line)',
  /body\s*=\s*smoothstep\(\s*h0/.test(AURORA_BODY) && /skirt\s*=\s*exp\(\s*min\(\s*hy\s*-\s*h0/.test(AURORA_BODY) && /below\s*=\s*max\(\s*body/.test(AURORA_BODY));
check('exp fade UP from the border (nothing symmetric)', /tall\s*=\s*exp\(\s*-max\(\s*hy\s*-\s*h0/.test(AURORA_BODY));
check('PHYSICS RAMP: green OWNS the border (not inverted)', /mix\(\s*uAurFringe\s*,\s*uAurGreen\s*,\s*smoothstep\(\s*h0/.test(AURORA_BODY));
check('BORDER HOT-LINE: two-scale core+feather glow, ×(1+(1.8·hot+0.45·exp(−8·bt))·below)', /hot\s*=\s*exp\([\s\S]*I\s*\*=\s*1\.0\s*\+\s*\(1\.8\s*\*\s*hot\s*\+\s*0\.45\s*\*\s*exp/.test(AURORA_BODY));
check('SPLIT GAIN: diffuse column capped low; hot core OR band knot crosses bloom', /uAuroraMix\s*\*\s*\(0\.55\s*\+\s*0\.45\s*\*\s*max\(hot\s*\*\s*below,\s*knot\)\)/.test(AURORA_BODY) && /knot\s*=\s*clamp\(bprof\s*\*\s*bn\s*\*\s*bn/.test(AURORA_BODY));
check('drapery FOLDS: hoisted fold0 + de-duplicated mid octave (foldOct) + fine detail (fine0)',
  /fold0\s*=\s*_aNoise/.test(AURORA_BODY) && /foldOct\s*=\s*_aNoise/.test(AURORA_BODY) && /fold\s*\+=\s*0\.5\s*\*\s*\(foldOct/.test(AURORA_BODY));
check('SECONDARY layer + height SHEAR present', /u\s*\+=\s*\(hy\s*-\s*h0\)/.test(AURORA_BODY));

// --- 2b. COMPOSITION (Gate-3): centre-stage arc, horizon anchoring, flank dip -------
check('CENTRAL ARC keyed to travel (smoothstep envelope on az⋅uAurFwd — not a fixed azimuth)',
  /smoothstep\(\s*-0\.35\s*,\s*0\.45\s*,\s*dot\(\s*az\s*,\s*uAurFwd/.test(AURORA_BODY));
check('base DROPS at the arc flanks (h0 keyed on envC) so the ends dive to the horizon',
  /envC\s*=\s*clamp\(\s*dot\(\s*az\s*,\s*uAurFwd/.test(AURORA_BODY) && /h0\s*=\s*0\.04\s*\+\s*0\.05\s*\*\s*envC/.test(AURORA_BODY));
check('HORIZON AIRGLOW the curtains rise from (brightest AT the sea-line, abs(hy))',
  /exp\(\s*-abs\(hy\)/.test(AURORA_BODY));
check('AURORA_HEAD declares the travel/secondary azimuth uniforms', /uAurFwd\s*,\s*uAurFwd2/.test(AURORA_HEAD));
check('uAurFwd default points forward (-Z)', auroraUniforms.uAurFwd.value.x === 0 && auroraUniforms.uAurFwd.value.y === -1);
const auroraSrc = readFileSync(url('../js/auroraSky.js'), 'utf8');
check('AURORA_HEAD declares the altitude palette + eruption gate', /uAurTeal/.test(AURORA_HEAD) && /uAurPink/.test(AURORA_HEAD) && /uAurViolet/.test(AURORA_HEAD) && /uAurErupt/.test(AURORA_HEAD));

// --- 2c. PREMIUM art direction (Gate-4): multi-color, value model, translucency, depth ------
check('ALTITUDE COLOR: teal cools the mid column (quiet second hue, always on)', /mix\(\s*aCol\s*,\s*uAurTeal/.test(AURORA_BODY));
check('ERUPTION rainbow: violet base + pink overlap + ADDITIVE red crown, all × uAurErupt',
  /uAurViolet[\s\S]*uAurErupt/.test(AURORA_BODY) && /uAurPink[\s\S]*uAurErupt/.test(AURORA_BODY) && /aCol\s*\+=\s*uAurRed[\s\S]*uAurErupt/.test(AURORA_BODY));
check('VALUE MODEL: low sheet floor (0.06) + steep pow → dark gaps between curtains',
  /0\.06\s*\+\s*0\.94\s*\*\s*pow\(\s*smoothstep/.test(AURORA_BODY));
check('TRANSLUCENCY: stars keyed off local CORE brightness (aurLum += I × hot·below)',
  /aurLum\s*\+=\s*I\s*\*\s*\(0\.25\s*\+\s*0\.75\s*\*\s*hot\s*\*\s*below\)/.test(AURORA_BODY));
check('RAY quality: calm freq (20) + staggered rayTall + de-strobed premium shimmer (φ·1.7 + rn·9)',
  /u\s*\*\s*20\.0\s*\+\s*fold\s*\*\s*4\.0/.test(AURORA_BODY) && /rayTall\s*=\s*exp/.test(AURORA_BODY) && /sin\(\s*uAurPhase\s*\*\s*1\.7\s*\+\s*rn\s*\*\s*9\.0\s*\)/.test(AURORA_BODY));
// Gate-6: THICK bands (the rays are children of them), rays reverted to calm, eruption gutted.
check('IRREGULAR thick RIBBONS: warped field (fanned period + azimuth tilt + height-warp forks), not a parallel sawtooth',
  /bt\s*\*\s*\(3\.4\s*\+\s*1\.6\s*\*\s*\(fold0/.test(AURORA_BODY) && /1\.0\s*\*\s*warpL/.test(AURORA_BODY) && /bandWarp\s*=\s*_aNoise\(vec2\(sAcross/.test(AURORA_BODY) && !/bt\s*\*\s*5\.0\s*-\s*0\.6/.test(AURORA_BODY));
check('secondary is a BROAD diagonal band (not a thin pillar) with a diagonal border',
  /sheet\s*=\s*0\.85\s*\*\s*exp\(\s*-u\s*\*\s*u\s*\*\s*2\.0\s*\)/.test(AURORA_BODY) && /float\(L\)\s*\*\s*\(0\.10\s*\+\s*0\.09\s*\*\s*dot\(az,\s*across\)\)/.test(AURORA_BODY));
check('fine rays REVERTED to calm rn² at freq 20 (no hairline interleave, no rn⁴)',
  /u\s*\*\s*20\.0/.test(AURORA_BODY) && !/hair\s*=/.test(AURORA_BODY) && /float\s+rr\s*=\s*rn\s*\*\s*rn;/.test(AURORA_BODY) && !/rr\s*\*=\s*rr/.test(AURORA_BODY));
check('FULL-STRUCTURE eruption ramp: violet base + pink plateau + crimson crown, each hybrid mix+additive',
  /baseB\s*=\s*max\(\(1\.0\s*-\s*smoothstep\(0\.12,\s*0\.34,\s*v\)\)/.test(AURORA_BODY)   // violet base has AREA in the lit column
  && /pinkB\s*=\s*smoothstep\(0\.30,\s*0\.50,\s*v\)/.test(AURORA_BODY)                     // pink is a plateau band, not a ×0.25 bell
  && /mix\(aCol,\s*uAurRed,\s*0\.75\s*\*\s*crown\s*\*\s*em\)/.test(AURORA_BODY)            // crimson by MIX (hue), not additive-only
  && /float\s+em\s*=\s*min\(uAurErupt,\s*1\.0\)/.test(AURORA_BODY));                       // mix saturates, additive rides the dial
check('eruption peak raised to 1.4 (owner pick) so the full structure shows in natural play',
  /uAurErupt\.value\s*=\s*1\.4\s*\*/.test(readFileSync(url('../js/auroraSky.js'), 'utf8')));
check('violet bluer (0x7a6bff) + pink hotter (0xff7fae) so they read over green', (() => {
  const s = readFileSync(url('../js/auroraSky.js'), 'utf8');
  return /uAurViolet:\s*\{\s*value:\s*new THREE\.Color\(0x7a6bff\)/.test(s) && /uAurPink:\s*\{\s*value:\s*new THREE\.Color\(0xff7fae\)/.test(s);
})());
check('per-ray color STAGGER kept, turn-calm-gated (color blends along each line)', /\(rn\s*-\s*0\.5\)\s*\*\s*0\.3\s*\*\s*rOn\s*\*\s*uAurRayMix/.test(AURORA_BODY));
check('stars burn through the eruption more (attenuation 0.55)', /star\s*\*=\s*1\.0\s*-\s*0\.55\s*\*\s*clamp\(\s*aurLum/.test(readFileSync(url('../js/environment.js'), 'utf8')));
check('DEPTH: a faint ray-less BACK VEIL reusing fold0 (free layered curtain)', /float\s+veil\s*=\s*smoothstep\(\s*0\.55/.test(AURORA_BODY));
check('ERUPTION COLOR WASH: diffuse violet base + red/pink crown glow (reads where rays fade)',
  /if\s*\(\s*uAurErupt\s*>\s*0\.001\s*\)/.test(AURORA_BODY) && /ebase\s*=\s*exp/.test(AURORA_BODY) && /ecrown\s*=\s*smoothstep/.test(AURORA_BODY));
check('fine0 detail octave is TIER0-ONLY (uAurLayers == 2 branch → no tier1/2 cost)', /if\s*\(\s*uAurLayers\s*==\s*2\s*\)\s*fine0\s*=\s*_aNoise/.test(AURORA_BODY));
check('ERUPTION driver: activity → smoothstep eruption envelope (rare full-color)',
  /uAurErupt\.value\s*=\s*1\.4\s*\*\s*\(e\s*\*\s*e\s*\*\s*\(3\.0\s*-\s*2\.0\s*\*\s*e\)\)/.test(readFileSync(url('../js/auroraSky.js'), 'utf8')));
check('?auract debug override wired (quiet-vs-eruption capture)', /setAuroraActOverride/.test(readFileSync(url('../js/main.js'), 'utf8')));
check('?aurerupt debug override wired (pin eruption strength, bypasses the 0.45 cap)',
  /setAuroraEruptOverride/.test(readFileSync(url('../js/main.js'), 'utf8')) && /if\s*\(eruptOverride\s*!=\s*null\)/.test(readFileSync(url('../js/auroraSky.js'), 'utf8')));

check('applyAurora keys off the DAMPED camera forward (weave-lagged, world-anchored)',
  /applyAurora\(env,\s*playerDist,\s*time,\s*camera,\s*dt\)/.test(auroraSrc) && /getWorldDirection/.test(auroraSrc) && /damp\(fwdX/.test(auroraSrc));

// --- 2d. GATE-9: mobile-middle band variation, smooth transitions, premium polish, dreamy run ----
// Loop bound is uAurBands (tier2=1, tier0/1=2), so mobile keeps the crossing diagonal thick band.
check('loop bound is uAurBands (tier2 single arc; tier0/1 keep the second thick band)', /if\s*\(L\s*>=\s*uAurBands\)\s*break/.test(AURORA_BODY));
// The fork mechanism reaches mobile: tier2 gets the REAL 2D height-warp noise, tier1 an analytic one.
check('bandWarp noise runs on tier0 OR tier2 (uAurLayers==2 || uAurRay<0.5) — tier2 earns the fork field',
  /if\s*\(uAurLayers\s*==\s*2\s*\|\|\s*uAurRay\s*<\s*0\.5\)\s*bandWarp\s*=\s*_aNoise/.test(AURORA_BODY));
check('tier1 gets an ANALYTIC height-warp from free noises (sin(hy·4.5), 0 evals) → forks on mobile',
  /uAurLayers\s*<\s*2\s*&&\s*uAurRay\s*>\s*0\.5\)\s*warpF\s*=\s*\(fold0\s*-\s*0\.5\)\s*\*\s*sin\(\s*hy\s*\*\s*4\.5/.test(AURORA_BODY) && /warpL\s*=\s*warpF/.test(AURORA_BODY));
check('tier1/2 knots vary PER-BAND + along-band from bp (sin, floor 0.25 never zero)',
  /bn\s*=\s*0\.25\s*\+\s*0\.75\s*\*\s*\(0\.5\s*\+\s*0\.5\s*\*\s*sin\(bp\s*\*\s*2\.5/.test(AURORA_BODY));
check('tier1 gets the secondary band as a FREE anti-correlated fold remix (ray-less: rOn 0)',
  /rOn\s*=\s*uAurRay\s*\*\s*\(\(L\s*==\s*0\s*\|\|\s*uAurLayers\s*==\s*2\)/.test(AURORA_BODY) && /else\s*fold\s*=\s*0\.5\s*\+\s*\(0\.5\s*-\s*fold0\)/.test(AURORA_BODY));
// Smooth transitions: the fract seam is feathered to zero before the wrap (kills the moving-cliff pop).
check('band profile SEAM-FEATHERED (smoothstep(1.0,0.82,fp)) → no fract-wrap pop as bp drifts',
  /bprof\s*=\s*smoothstep\(0\.0,\s*0\.10,\s*fp\)\s*\*\s*smoothstep\(1\.0,\s*0\.82,\s*fp\)\s*\*\s*exp/.test(AURORA_BODY));
// Rays soften into the sheet during fast yaw (turn-calm) instead of strobing.
check('TURN-CALM envelope: uAurRayMix gates the ray mix (soften during yaw, floor 0.35)',
  /ray\s*=\s*mix\(1\.0,\s*rayShim,\s*rOn\s*\*\s*uAurRayMix\)/.test(AURORA_BODY) && /calm\s*=\s*damp\(calm,\s*slew\s*>\s*0\.15\s*\?\s*0\.35\s*:\s*1\.0/.test(auroraSrc));
// Dreamy run: activity-keyed crawl (quiet=stately, eruption quickens) + breathing horizon airglow.
check('activity-keyed CRAWL accumulator (dt·(0.7+0.6·act), raw dt so frozen shots pin)',
  /_aurPhase\s*=\s*\(_aurPhase\s*\+\s*\(dt\s*\|\|\s*0\)\s*\*\s*\(0\.7\s*\+\s*0\.6\s*\*\s*act\)\)\s*%\s*4096/.test(auroraSrc));
check('horizon airglow BREATHES with uAurBreath (mean unchanged: 0.85+0.30·0.5)',
  /hg\s*\*\s*\(0\.05\s*\+\s*0\.04\s*\*\s*uAurAct\)\s*\*\s*\(0\.85\s*\+\s*0\.30\s*\*\s*uAurBreath\)/.test(AURORA_BODY));
// Runtime tier-flip cover: qualFade dips then recovers, so the curtain doesn't restructure on-screen.
check('tier-flip qualFade cover (dip to 0 on change, damp back to 1 → identity in non-aurora biomes)',
  /if\s*\(prev\s*!==\s*t\s*&&\s*auroraUniforms\.uAuroraMix\.value\s*>\s*0\.0001\)\s*qualFade\s*=\s*0/.test(auroraSrc) && /qualFade\s*=\s*damp\(qualFade,\s*1,\s*3\.5/.test(auroraSrc));

// --- 3. gate: default 0 (shipped); enable/disable/force + per-frame write ---------
check('default mix 0 (byte-identical shipped sky)', auroraUniforms.uAuroraMix.value === 0);
const env = { auroraMix: 0.7 };
setAuroraForced(false);
setAuroraEnabled(false);
applyAurora(env, 1000, 5);
check('disabled → mix held at 0', auroraUniforms.uAuroraMix.value === 0);
setAuroraEnabled(true);
applyAurora(env, 1000, 5);
check('enabled → biome auroraMix written', Math.abs(auroraUniforms.uAuroraMix.value - 0.7) < 1e-6);
check('default night-wash 0 (real gameplay never darkens the sky)', auroraUniforms.uAurNight.value === 0);
setAuroraForced(true);
applyAurora({ auroraMix: 0 }, 1000, 5);
check('forced (?aurora=1) → mix 1 even with no biome channel', auroraUniforms.uAuroraMix.value === 1);
check('forced preview → night wash 1 (aurora needs a dark sky)', auroraUniforms.uAurNight.value === 1);
setAuroraForced(false);
applyAurora({ auroraMix: 0.7 }, 1000, 5); // a real biome declaring aurora: curtain on, but NO night wash
check('real biome aurora → curtain on, night wash 0 (biome supplies its own dark palette)',
  Math.abs(auroraUniforms.uAuroraMix.value - 0.7) < 1e-6 && auroraUniforms.uAurNight.value === 0);
applyAurora({ auroraMix: 0 }, 1000, 5);
check('un-forced + no biome channel → back to 0 (shipped)', auroraUniforms.uAuroraMix.value === 0);

// --- 4. tier truth table (weaker tiers thin the curtain, never delete it) ---------
setAuroraQuality(0);
check('tier0 → 2 curtain layers + rays on + 2 thick bands', auroraUniforms.uAurLayers.value === 2 && auroraUniforms.uAurRay.value === 1 && auroraUniforms.uAurBands.value === 2);
setAuroraQuality(1);
check('tier1 → 1 richness layer, rays on, but KEEPS 2 thick bands (mobile middle variation)', auroraUniforms.uAurLayers.value === 1 && auroraUniforms.uAurRay.value === 1 && auroraUniforms.uAurBands.value === 2);
setAuroraQuality(2);
check('tier2 → 1 layer, rays off, 1 band (a smooth quiet arc — still authentic)', auroraUniforms.uAurLayers.value === 1 && auroraUniforms.uAurRay.value === 0 && auroraUniforms.uAurBands.value === 1);
setAuroraQuality(0);

// --- 5. phases are JS-WRAPPED (float32 precision on endless runs — uCloudDrift lesson)
setAuroraForced(true);
applyAurora({ auroraMix: 0 }, 10_000_000, 5); // ~forever
check('uAurPhase wrapped into [0,4096) (no float32 shimmer)', auroraUniforms.uAurPhase.value >= 0 && auroraUniforms.uAurPhase.value < 4096);
check('uAurBreath stays in [0,1] (two incommensurate sines)', auroraUniforms.uAurBreath.value >= 0 && auroraUniforms.uAurBreath.value <= 1);
check('uAurAct stays in [0,1] (slow form envelope)', auroraUniforms.uAurAct.value >= 0 && auroraUniforms.uAurAct.value <= 1);
setAuroraForced(false);
applyAurora({ auroraMix: 0 }, 5, 5); // leave shipped state

// --- 6. PR-4 THE FLIP: the aurora block (CYCLE index 5 = biome 6) NOW lights the curtain, over a
// wide pre-ramp, with ZERO leak into the upstream biomes. Block layout at L=1500: blocks 0-4 =
// biomes 0-4 (Mire is block 4, [6000,7500)); block 5 = AURORA ([7500,9000)); block 6 = Astral.
const L = CONFIG.biomeLength;
let maxMix = 0;
for (let dist = 0; dist <= 9 * L; dist += 25) maxMix = Math.max(maxMix, computeEnv(dist).auroraMix);
check(`the aurora block lights the curtain → env.auroraMix reaches 1.0 across the course (max ${maxMix.toFixed(3)})`, Math.abs(maxMix - 1.0) < 1e-6);
// NO UPSTREAM LEAK: blocks 0-3 + the first ~900m of Mire stay byte-identically 0 (PR-4b widened the
// ramp-in to 600m, so it starts at L-600 into Mire = dist 6900). Sample up to 4L+850 = 6850, just before.
let leak = 0;
for (let dist = 0; dist <= 4 * L + 850; dist += 25) leak = Math.max(leak, computeEnv(dist).auroraMix);   // Mire = block 4 [6000,7500); ramp-in starts at 6900
check(`no upstream leak → auroraMix 0 through block 3 + early Mire (max ${leak})`, leak === 0);
// RAMP-IN (PR-4b: the WHOLE world dawns over Mire's last 600m): 0 at 6850, rising by 7200, full by ~7450.
const mIn0 = computeEnv(6850).auroraMix, mIn1 = computeEnv(7200).auroraMix, mIn2 = computeEnv(7450).auroraMix;
check('ramp-IN is a smooth dawn (0 at 6850m → partial at 7200m → ~full by 7450m, monotone)',
  mIn0 === 0 && mIn1 > 0.02 && mIn1 < mIn2 && mIn2 > 0.9);
check('aurora block interior is full curtain (auroraMix 1.0 mid-block)', Math.abs(computeEnv(8100).auroraMix - 1.0) < 1e-6);
// RAMP-OUT (PR-4b: 400m die-out): full at 8100, fading by 8850.
const mOut = computeEnv(8850).auroraMix;
check('ramp-OUT hands off to Astral (auroraMix falling by 8850m, < full)', mOut < 0.98 && mOut >= 0);
// PR-4b (issue #2): the SHARED wide ramp — the BACKGROUND (sky/water/star) rides the same 600m window
// as the curtain, so it no longer snaps under the dawning curtain. skyHorizon at 6850 must equal pure
// Mire (ramp not started), but by 7200 must have moved off Mire toward the aurora horizon.
const mireHorizon = BIOMES[4].sky.horizon.getHex();
check('background rides the wide ramp: skyHorizon is pure Mire at 6850m (ramp not yet started)',
  computeEnv(6850).skyHorizon.getHex() === mireHorizon);
check('background rides the wide ramp: skyHorizon has moved off Mire by 7200m (no 150m snap)',
  computeEnv(7200).skyHorizon.getHex() !== mireHorizon && computeEnv(7200).starMix > BIOMES[4].stars);
// EXIT handoff: auroraMix (dying) and whaleMix (rising) now cross in the SAME 400m window.
const eA = computeEnv(8800).auroraMix, eW = computeEnv(8800).whaleMix;
check('exit handoff: curtain dying while whale rising in one window (both mid-transition at 8800m)',
  eA > 0 && eA < 1 && eW > 0 && eW < 1);
// A NON-AURORA seam stays byte-identical (the wide ramp is gated): Wastes(1)→Frozen(2) at dist 2925
// (block 1 [1500,3000), seam at 2925) must equal the inline 150m smoothstep computation.
const dN = 2925, localN = dN - 1500, tN = THREE.MathUtils.smoothstep(localN, 1500 - 150, 1500);
const expHorizonN = BIOMES[1].sky.horizon.clone().lerp(BIOMES[2].sky.horizon, tN).getHex();
check('a NON-aurora seam is byte-identical (wide ramp gated to aurora seams only)',
  computeEnv(dN).skyHorizon.getHex() === expHorizonN);
check('exactly BIOMES[6] declares aurora (the other 6 stay dormant)',
  BIOMES.slice(0, 6).every((b) => !b.aurora) && BIOMES[6] && BIOMES[6].aurora === 1.0);
// ?biome=6 force (ia===ib, t=0) skips the ramp branch → still pins 1.0 for the debug preview.
setForcedBiome(6);
const forcedMix = computeEnv(1000).auroraMix;
setForcedBiome(null);
check('forcing biome 6 still pins the aurora (env.auroraMix 1.0, ramp branch skipped)', Math.abs(forcedMix - 1.0) < 1e-6);

// --- 6b. PR-3: the biome's own LOW ice props + mirror/ground-glow polish -------------
check('BIOMES[6].props are the low ice set (floe/iceFang/berg/skerry/ridge)', JSON.stringify(BIOMES[6].props) === '["floe","iceFang","berg","skerry","ridge"]');
const envSrc0 = readFileSync(url('../js/environment.js'), 'utf8');
// Gate-7 bug: the SPEED-SURGE magenta wash (feverMix) must be suppressed in the aurora biome — a
// SEPARATE effect from the curtain eruption, and the real "color explosion" over the curtain.
check('surge magenta wash suppressed under the aurora curtain (× (1 - uAuroraMix))',
  /col\s*\+=\s*aurora\s*\*\s*curtain\s*\*\s*feverMix\s*\*\s*0\.35\s*\*\s*\(1\.0\s*-\s*uAuroraMix\)/.test(envSrc0));
check('surge GRADIENT shift also suppressed in the aurora biome (both surge magenta sources gated)',
  /feverMix\s*\*\s*0\.8\s*\*\s*\(1\.0\s*-\s*uAuroraMix\)/.test(envSrc0) && /feverMix\s*\*\s*0\.7\s*\*\s*\(1\.0\s*-\s*uAuroraMix\)/.test(envSrc0));
check('all 5 aurora archetypes registered for biome 6 (matIndex 6)',
  ['floe', 'iceFang', 'berg', 'skerry', 'ridge'].every((k) => new RegExp(k + ':\\s*\\{[\\s\\S]*?biomes:\\s*\\[6\\],\\s*matIndex:\\s*6').test(envSrc0)));
check('iceFang is LOW (height cap 2.2–4.6, never a tall spire)', /iceFang:[\s\S]*?h:\s*2\.2\s*\+\s*rnd\(\)\s*\*\s*2\.4/.test(envSrc0));
// The "still not Frozen-at-night" law, in numbers: every NEAR-LANE aurora archetype's max world top
// (h_max, since normalized top ≈ 1) is ≤ 5 (vs crystal 18–50). ridge is the sanctioned distant exception.
check('near-lane ice stays LOW (floe/fang/berg/skerry h_max ≤ 5)', (() => {
  const hmax = { floe: 1.2 + 1.4, iceFang: 2.2 + 2.4, berg: 1.6 + 1.4, skerry: 0.6 + 0.8 };
  return Object.values(hmax).every((h) => h <= 5.0);
})());
check('shape VARIETY: cylinder/icosahedron families added (not just boxes+cones)',
  /floe:[\s\S]*?CylinderGeometry/.test(envSrc0) && /berg:[\s\S]*?IcosahedronGeometry/.test(envSrc0));
check('skerry is the non-glowing rock foil (mat 0 only, foam-less rock)', /skerry:[\s\S]*?IcosahedronGeometry/.test(envSrc0) && /ridge:\s*false/.test(envSrc0));
check('makeMats gains the 7th (aurora ice) primary + accent', /6 aurora night sea-ice/.test(envSrc0) && /6 aurora-caught ice edge/.test(envSrc0));
check('FOAM_CFG has the floe + iceFang water collars', /floe:\s*\{\s*r:\s*0\.72\s*\}/.test(envSrc0) && /iceFang:\s*\{\s*r:\s*0\.62\s*\}/.test(envSrc0));
check('hemi ground-glow pulse driven by auroraPulse (color-space, gated by mix)',
  /auroraPulse\(\)/.test(envSrc0) && /hemi\.color\.lerp\(_AUR_HEMI_GREEN/.test(envSrc0));
const waterSrc = readFileSync(url('../js/water.js'), 'utf8');
check('tier2 water aurora sheen (uAuroraGlow in sharedUniforms + cheap branch, identity at 0)',
  /uAuroraGlow:\s*\{\s*value:\s*0\s*\}/.test(waterSrc) && /refl\s*\+=\s*vec3\([^)]*\)[\s\S]*uAuroraGlow/.test(waterSrc));

// --- 7. spliced into the sky shader (environment.js) with the right couplings ------
const envSrc = readFileSync(url('../js/environment.js'), 'utf8');
check('sky shader splices AURORA_HEAD + AURORA_BODY', /\$\{AURORA_HEAD\}/.test(envSrc) && /\$\{AURORA_BODY\}/.test(envSrc));
check('AURORA_BODY spliced BEFORE the clouds (10km clouds occlude the 100km curtain)',
  envSrc.indexOf('${AURORA_BODY}') < envSrc.indexOf('${CLOUD_BODY}'));
check('stars dimmed behind the curtain (reads aurLum, identity at 0)', /star\s*\*=\s*1\.0\s*-\s*0\.55\s*\*\s*clamp\(\s*aurLum/.test(envSrc));
check('surge night-veil suppressed under the real aurora (× (1 - uAuroraMix))', /aurora\s*\*\s*smoothstep\(0\.2,\s*0\.6,\s*h\)\s*\*\s*starMix\s*\*\s*0\.12\s*\*\s*\(1\.0\s*-\s*uAuroraMix\)/.test(envSrc));
check('tier banding dither gated to the curtain (× uAuroraMix)', /1\.0\s*\/\s*255\.0\)\s*\*\s*uAuroraMix/.test(envSrc));
check('applyAurora driven per-frame near applySkyClouds (with camera+dt for the travel key)', /applyAurora\(env,\s*playerDist,\s*time,\s*camera,\s*dt\)/.test(envSrc));
check('auroraUniforms spread into the skyMat uniforms', /\.\.\.auroraUniforms/.test(envSrc));
// The preview night wash: darken the dome + kill the sun + light the stars, all gated by uAurNight
// (0 in real play → byte-identical). Never over the real biome, which supplies its own night palette.
check('preview darkens the dome before the curtain (× uAurNight)', /col\s*=\s*mix\(\s*col\s*,\s*vec3\([^)]*\)\s*,\s*uAurNight\s*\)/.test(envSrc));
check('preview kills the sun (× (1 - uAurNight))', /sunGlow[\s\S]{0,320}\*\s*\(1\.0\s*-\s*uAurNight\)/.test(envSrc));
check('preview lights the stars (max(starMix, uAurNight..))', /star\s*\*\s*max\(\s*starMix\s*,\s*uAurNight/.test(envSrc));

// --- 8. wired into main.js (the ?aurora=1 hero read + tier switch) -----------------
const mainSrc = readFileSync(url('../js/main.js'), 'utf8');
check('main.js reads ?aurora=1 → setAuroraForced(true)', /getParam?|aurora['"]\)\s*===\s*['"]1['"]/.test(mainSrc) && /setAuroraForced\(true\)/.test(mainSrc));
check('main.js drives setAuroraQuality in applyQuality', /setAuroraQuality\(tier\)/.test(mainSrc));
check('main.js gates god-ray shafts off for the aurora — CONTINUOUS fade, no mid-seam pop (PR-4)',
  /auroraForced\(\)\s*\?\s*0\s*:\s*_camFwd\.dot\(SUN_DIR\)\s*\*\s*\(1\s*-\s*Math\.min\(1,\s*auroraMix\(\)\s*\*\s*2\)\)/.test(mainSrc));

// --- 9. PROBE-EXCLUSION GUARD: skyProbe.js must not know about the aurora ----------
const probeSrc = readFileSync(url('../js/skyProbe.js'), 'utf8');
// The probe deliberately excludes the high-frequency curtain — the only mention of "aurora"
// in skyProbe.js is the comment DOCUMENTING that exclusion; there must be NO aurora uniform
// or code path (that would alias the curtain into SH wobble).
check('skyProbe.js has NO aurora uniform/code (probe-invisible; only the exclusion note)',
  !/uAur/.test(probeSrc) && !/auroraUniforms|applyAurora|AURORA_/.test(probeSrc));

// --- 10. biomes.js carries the channel (default 0, lerped like starMix) ------------
const biomesSrc = readFileSync(url('../js/biomes.js'), 'utf8');
check('computeEnv lerps env.auroraMix from a.aurora/b.aurora (optional channel)', /env\.auroraMix\s*=\s*lerp\(\s*a\.aurora\s*\|\|\s*0\s*,\s*b\.aurora\s*\|\|\s*0/.test(biomesSrc));

setAuroraEnabled(true); setAuroraForced(false); setAuroraQuality(0); // leave shipped state for later imports
console.log(`\naurora: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
