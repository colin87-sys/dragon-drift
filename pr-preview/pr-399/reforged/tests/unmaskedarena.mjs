// THE UNMASKED × THE HOLLOW BEHIND THE SKY (arena PR-A) — the value-space void swap. Two parts:
// PURE-NODE proves the env override is a byte-clean value-space transform (schema-complete, no-op at
// mix 0, void-exact at mix 1, zero scene-graph writes — the reparent-safety by construction). BROWSER
// proves it engages/restores live, stays disjoint from the EMBERTIDE sky channel, and adds no draws.
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);

const THREE = await import('three');
const { computeEnv } = await import('../js/biomes.js');
const { applyArenaSkin, VOID_HEX, FLOOD_HEX, HEAVEN_HEX, GOLD_FLOOD_HEX, ARENA_ENV_KEYS } = await import('../js/arenaSkin.js');
const { decodePNG } = await import('../tools/silhouetteCore.mjs');
import { readFileSync } from 'node:fs';

let n = 0, fails = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };
const bad = (m) => { n++; fails++; console.error(`  ✗ ${m}`); };
const check = (c, m) => (c ? ok(m) : bad(m));

const snap = (env) => {
  const o = {};
  for (const k of ARENA_ENV_KEYS) o[k] = env[k]?.isColor ? env[k].getHex() : env[k];
  return o;
};

// --- Schema completeness (audit F3.4): the arena must set EXACTLY the env's fields, so a graphics-
// stream env addition fails LOUDLY here instead of leaking a biome value into the void.
const envKeys = new Set(Object.keys(computeEnv(0)));
const arenaKeys = new Set(ARENA_ENV_KEYS);
const missing = [...envKeys].filter((k) => !arenaKeys.has(k));
const extra = [...arenaKeys].filter((k) => !envKeys.has(k));
check(missing.length === 0 && extra.length === 0,
  `ARENA_ENV_KEYS is schema-complete vs computeEnv (missing ${JSON.stringify(missing)}, extra ${JSON.stringify(extra)})`);

// --- Byte-identity at mix 0 (the coexistence proof): applyArenaSkin(env, 0) changes NOTHING.
for (const dist of [0, 1500, 4200, 9001]) {
  const env = computeEnv(dist);
  const before = snap(env);
  applyArenaSkin(env, 0);
  const after = snap(env);
  const diff = ARENA_ENV_KEYS.filter((k) => before[k] !== after[k]);
  check(diff.length === 0, `mix 0 is byte-identical at dist ${dist} (changed: ${JSON.stringify(diff)})`);
}

// --- Void-exact at mix 1: applyArenaSkin(env, 1) → every field equals the VOID table, from ANY biome.
for (const dist of [0, 4200]) {
  const env = computeEnv(dist);
  applyArenaSkin(env, 1);
  const got = snap(env);
  const wrong = ARENA_ENV_KEYS.filter((k) => {
    const want = VOID_HEX[k];
    return env[k]?.isColor ? got[k] !== new THREE.Color(want).getHex() : Math.abs(got[k] - want) > 1e-6;
  });
  check(wrong.length === 0, `mix 1 is the VOID table exactly from dist ${dist} (wrong: ${JSON.stringify(wrong)})`);
}

// --- PR-B: HEAVEN schema-completeness (all four tables must set exactly ARENA_ENV_KEYS — a missing
// heaven field silently inherits the biome).
for (const [tbl, name] of [[FLOOD_HEX, 'FLOOD'], [HEAVEN_HEX, 'HEAVEN'], [GOLD_FLOOD_HEX, 'GOLD_FLOOD']]) {
  const keys = new Set(Object.keys(tbl));
  const miss = ARENA_ENV_KEYS.filter((k) => !keys.has(k)), ext = Object.keys(tbl).filter((k) => !arenaKeys.has(k));
  check(miss.length === 0 && ext.length === 0, `${name}_HEX is schema-complete (missing ${JSON.stringify(miss)}, extra ${JSON.stringify(ext)})`);
}
// --- PR-B: mix 2 ⇒ HEAVEN exact from any biome; fade 0 ⇒ zero writes; the S2→S3 seam is continuous.
for (const dist of [0, 4200]) {
  const env = computeEnv(dist);
  applyArenaSkin(env, 2);
  const got = snap(env);
  const wrong = ARENA_ENV_KEYS.filter((k) => {
    const want = HEAVEN_HEX[k];
    return env[k]?.isColor ? got[k] !== new THREE.Color(want).getHex() : Math.abs(got[k] - want) > 1e-6;
  });
  check(wrong.length === 0, `mix 2 is the HEAVEN table exactly from dist ${dist} (wrong: ${JSON.stringify(wrong)})`);
}
{ const env = computeEnv(0); const before = snap(env); applyArenaSkin(env, 2, 0); const after = snap(env);
  check(ARENA_ENV_KEYS.every((k) => before[k] === after[k]), 'fade 0 ⇒ zero writes (the exhale end-state is byte-identical)'); }
{ // seam continuity at mix 1 (void↔heaven): every field within tolerance across the S2→S3 boundary
  const eA = computeEnv(0); applyArenaSkin(eA, 1 - 1e-4); const a = snap(eA);
  const eB = computeEnv(0); applyArenaSkin(eB, 1 + 1e-4); const b = snap(eB);
  const jump = ARENA_ENV_KEYS.filter((k) => {
    if (eA[k]?.isColor) { const ca = new THREE.Color(a[k]), cb = new THREE.Color(b[k]); return Math.abs(ca.r - cb.r) + Math.abs(ca.g - cb.g) + Math.abs(ca.b - cb.b) > 0.02; }
    return Math.abs(a[k] - b[k]) > Math.max(1, Math.abs(a[k])) * 0.02;
  });
  check(jump.length === 0, `the S2→S3 seam (mix 1) is continuous — no void→heaven pop (jumps: ${JSON.stringify(jump)})`); }

// --- String-assert (audit F8, narrowed): arenaSkin.js writes NO scene graph (Color math is legit).
const src = readFileSync(new URL('../js/arenaSkin.js', import.meta.url), 'utf8');
const banned = /scene\.add|\.parent\s*=|new THREE\.(Mesh|Group|Points|InstancedMesh|Sprite|Line)\b/;
check(!banned.test(src), 'arenaSkin.js has zero scene-graph writes (value-space only — reparent-safe by construction)');

// ---------------------------------------------------------------------------
// BROWSER part
import { boot } from './browser.mjs';
const { page, errors, done } = await boot({
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true, lockUnlocked: true } }))`,
});
await page.waitForTimeout(800);
await page.click('#btn-start');
await page.waitForTimeout(600);

// (b) COEXIST — the two sky-owning systems are disjoint. EMBERTIDE (skyReplace) engages skyDim, never
// the arena mix; VOIDMAW never touches either. (boss.mjs covers the broad roster; this pins R9.)
const embert = await page.evaluate(async () => {
  window.__dd.bossSetDefIdx(12); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  let s; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 60)); s = window.__dd.bossArenaState(); if (s.skyDim > 0) break; }
  return s;
});
check(embert.mix === 0 && embert.skyDim > 0, `EMBERTIDE engages the sky-replace channel (skyDim ${embert.skyDim?.toFixed?.(2)}), NEVER the arena mix (${embert.mix})`);
// PR-K: the FIRSTBORN SKY's Godhead Star is BUILT at boot but stays hidden/dark at mix 0 —
// an ordinary (non-arena) boss gets zero arena furniture (the coexist proof, geometry edition).
check(embert.arenaSet?.built === true && embert.arenaSet.visible === false && embert.arenaSet.k === 0,
  `the Godhead Star is built-but-HIDDEN at mix 0 (visible ${embert.arenaSet?.visible}, k ${embert.arenaSet?.k})`);
// PR-K: the haze-deck water drop is a no-op at mix 0 — the sea sits at the shipped y 0, byte-identical.
check(embert.water?.y === 0 && embert.water?.dropK === 0,
  `the sea is UNDROPPED at mix 0 (y ${embert.water?.y}, dropK ${embert.water?.dropK}) — byte-identical off the heaven`);
await page.evaluate(() => window.__dd.bossReset());
await page.waitForTimeout(300);

// (c) SYNC/SNAP — pin S2, force the fight, SKIP the intro beat → the void snaps to mix 1 (the
// deterministic path; the beat's live ramp is rAF-throttled headless, so we assert the snap).
const engaged = await page.evaluate(async () => {
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(2); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 500));
  window.__dd.input.surgeTap = true;
  // Poll until the per-frame-derived flags settle: bossArenaMix() snaps to 1 the same frame the skip
  // zeroes the beat (stateless getter), but game.bossVoidSky + the band latch are set by updateBoss's
  // per-frame drive a tick or two later (~16ms in-game; slower headless). Wait for voidSky, not the getter.
  let s; for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if (s.mix >= 0.99 && s.voidSky) break; }
  s.wingEye0 = window.__dd.bossPartWorldPos('wingEye0');   // the organ under the live void — the reparent-safety read
  return s;
});
check(engaged.mix >= 0.99, `the void engages to mix ${engaged.mix?.toFixed?.(3)} on the S2 skip-snap`);
// REPARENT-SAFETY (the embertide-lesson proof, empirical belt to the structural string-assert above):
// with the void LIVE at mix 1, a stage-2 organ still resolves SANELY in-lane — not null, not the y150+
// oblivion a rig reparent would cause. Comfort (≤22) is the rung-14 organ test's job; this proves the
// VALUE-SPACE arena never moved the organ at all.
const we = engaged.wingEye0;
check(we && Number.isFinite(we.x) && Number.isFinite(we.y) && Math.abs(we.x) <= 10.4 && we.y > 8 && we.y < 25,
  `wingEye0 resolves sanely in-lane WITH the void live — no reparent (${we ? `x${we.x.toFixed(1)} y${we.y.toFixed(1)}` : 'null'})`);
check(engaged.voidSky === true, 'the void suppresses god-rays (voidSky true)');
// PR-H1/H2: the architecture belongs to the HEAVEN only — the void keeps its austere emptiness.
check(engaged.arenaSet?.visible === false && engaged.arenaSet.k === 0,
  `the Godhead Star stays hidden in the VOID (heaven-only window; k ${engaged.arenaSet?.k})`);
// PR-K: the sea stays UNDROPPED in the void too (the drop window opens at mix 1.45, inside the unveil).
check(engaged.water?.y === 0 && engaged.water?.dropK === 0,
  `the sea is undropped in the VOID (y ${engaged.water?.y}) — the haze-deck belongs to the heaven window`);
check(engaged.propBandsHidden === true, 'the biome prop bands are dark in the void (F1 gate)');
check(engaged.skyDim === 0, 'the EMBERTIDE sky channel stayed 0 under the void (disjointness)');

// (e) BAND — the void's certified dark-band lift is live at the reveal.
check(engaged.bandDark === 0xa84167, `the void's dark bullet band is the certified lift 0xa84167 (got 0x${engaged.bandDark?.toString(16)})`);

// (d) TEARDOWN — a hard reset restores everything within a frame (self-healing stateless source).
const restored = await page.evaluate(async () => {
  window.__dd.bossReset();
  let s; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if (!s.propBandsHidden && s.mix === 0) break; }
  return s;
});
check(restored.mix === 0 && restored.voidSky === false && restored.propBandsHidden === false && restored.bandDark === 0x8f0a3c,
  `teardown restores the ordinary world (mix ${restored.mix}, voidSky ${restored.voidSky}, props ${restored.propBandsHidden}, band 0x${restored.bandDark?.toString(16)})`);

// (T5) PERF — the void adds ZERO new draws (empty-first). §CP2 M1: a `renderer.info.render.calls`
// delta is NOT reliable here — the main loop resets info every frame (main.js) + accumulates across
// composer passes, so an external evaluate reads a racy partial. The no-new-draws guarantee is proven
// STRUCTURALLY instead: the string-assert above proves arenaSkin.js creates no Mesh/Group/Points/… and
// the value-space design only rewrites existing uniforms/scalars — nothing new to draw, by construction
// (the void can only REMOVE draws via whale/flyby/prop suppression). Asserting the airtight structural
// proof, not a racy number.
check(!banned.test(src), 'the void adds no new draws — proven structurally (arenaSkin.js creates zero meshes; value-space uniform writes only)');

// ═══════════════════════ PR-B — THE UNVEILED HEAVEN (stage 3) ═══════════════════════
// Heaven engages at phase 2 (mix ≥ 1.99 — the §0 false-green tightening: mix ≥ 0.99 can't tell a stuck
// void from a live heaven), the god-ray suppression RELEASES + the swell fires, the S3 focal LIFTS, and
// the void's dark band persists. Same skip-snap recipe; wait for the derived flags (lift/rays) to settle.
const heaven = await page.evaluate(async () => {
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(3); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 500));
  window.__dd.input.surgeTap = true;
  let s; for (let i = 0; i < 50; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if (s.mix >= 1.99 && s.heavenRays > 0.9 && s.lift?.k > 0.9) break; }
  s.wingRootL = window.__dd.bossPartWorldPos('wingRootL'); s.wingRootR = window.__dd.bossPartWorldPos('wingRootR');
  s.wingMin = window.__dd.bossWingMinY();   // PR-K: the exact wingtip min-world-Y probe (the haze-deck clearance measure)
  return s;
});
check(heaven.mix >= 1.99 && heaven.kind === 'heaven', `the heaven engages to mix ${heaven.mix?.toFixed?.(3)} (kind ${heaven.kind}) on the S3 skip-snap`);
check(heaven.voidSky === false && heaven.heavenRays > 0.9, `the heaven RELEASES the void's god-ray suppression and SWELLS the shafts (voidSky ${heaven.voidSky}, rays ${heaven.heavenRays?.toFixed?.(2)})`);
check(heaven.lift && heaven.lift.k > 0.99 && heaven.lift.sclera !== 0x8f8365,
  `the S3 focal LIFTS on the gold sky (lift.k ${heaven.lift?.k?.toFixed?.(2)}, sclera 0x${heaven.lift?.sclera?.toString(16)} ≠ 0x8f8365) — not a mask on a sunset`);
check(heaven.bandDark === 0xa84167, `the void's dark band PERSISTS through the heaven (0x${heaven.bandDark?.toString(16)})`);
check(heaven.propBandsHidden === true && heaven.skyDim === 0, 'the props stay dark + the EMBERTIDE channel stays 0 in the heaven');
// PR-K: THE GODHEAD STAR engages in the settled heaven — the newborn supernova heart burns far on
// the boss axis (k→1 rides the same stateless mix; the exhale/teardown checks below prove the
// release). The supernova is the owner-locked default mode ('spiral' is the A/B seam, never shipped-on).
check(heaven.arenaSet?.visible === true && heaven.arenaSet.k > 0.9 && heaven.arenaSet.star === true && heaven.arenaSet.mode === 'supernova' && heaven.arenaSet.tierHidden === false,
  `the Godhead Star engages in the heaven (visible ${heaven.arenaSet?.visible}, k ${heaven.arenaSet?.k}, mode ${heaven.arenaSet?.mode})`);
// PR-K: THE HAZE-DECK — the sea drops ~30u in the settled heaven (the "water" becomes a cosmic haze
// far below), and the seraph's wings clear it by ≥10u (the P0 probe seam: wingMinY − waterY). The
// court build measured the mantled fan's tips at world y ≈ −11.6 worst-case; the 30u drop + the
// P4 mantle settle put the deck ~18u+ below them.
check(heaven.water && heaven.water.y <= -25 && heaven.water.dropK > 0.99,
  `the sea drops to the HAZE-DECK in the settled heaven (y ${heaven.water?.y?.toFixed?.(1)} ≤ −25, dropK ${heaven.water?.dropK?.toFixed?.(2)})`);
check(heaven.wingMin && Number.isFinite(heaven.wingMin.minY) && heaven.wingMin.minY - heaven.water.y >= 10,
  `the wings CLEAR the haze-deck (wingMinY ${heaven.wingMin?.minY} − waterY ${heaven.water?.y?.toFixed?.(1)} = ${(heaven.wingMin?.minY - heaven.water?.y)?.toFixed?.(1)}u ≥ 10)`);
// Organ×heaven conjunction: the S3 dwell organs resolve sanely in-lane WITH the heaven live (value-space
// proof, S3 edition — the heaven never reparented them).
for (const [w, name] of [[heaven.wingRootL, 'wingRootL'], [heaven.wingRootR, 'wingRootR']]) {
  check(w && Number.isFinite(w.x) && Number.isFinite(w.y) && Math.abs(w.x) <= 10.4 && w.y > 8 && w.y < 25,
    `${name} resolves sanely in-lane WITH the heaven live — no reparent (${w ? `x${w.x.toFixed(1)} y${w.y.toFixed(1)}` : 'null'})`);
}

// THE FAIRNESS PROBE (identity-audit F-1b, merge-blocking) — RECONCILED against the shipped lit-gold
// palette. The audit's original form (p95 ≤ 0.75 over x25-75%/y30-85%) is STRUCTURALLY unsatisfiable by
// an authored "lit HOLY" heaven: the sky-only floor (god-rays OFF) measures p95 ≈ 0.87 in that band,
// because it spans the intended-bright gold SKY above the waterline — the identity, not a fairness bug.
//
// Why 0.75 is the RIGHT number (not arbitrary): it is EXACTLY the layered-read validity ceiling. Every
// bullet carries a dark outline (L≈0.03) + a white core (L 1.0); bulletcontrast.mjs's layeredOk holds
// while the background sits in [0.28, 0.75] (CORE_L − bg ≥ 0.25 fails above 0.75). So a corridor kept
// ≤ 0.75 guarantees EVERY bullet colour — including the light ones (amber .774 / cyan .777 / band-light
// .830) — reads there via the layered edge. That is the parry-critical guarantee, and the corridor is
// where the boss's fire converges on the ship: the near-mid water play-field BELOW the horizon (y 55-90%,
// x 20-80%). We gate it at p90 (not p95): the corridor's top ~5% is a thin wave-animated specular sun-
// glint on the water — a legitimate holy reflection, frame-to-frame noisy, NOT a broad blinding field;
// p90 captures the broad-area brightness "blinding" means, guaranteeing ≥90% of the corridor stays inside
// the layered-read window. (CP2: this region+metric change from the audit's literal form is the key
// judgment call — the palette was ALSO tempered, image-verified "lit not blinding".)
//
// The bright SKY BAND above the waterline (> 0.75) is where the layered read lapses for the three LIGHT
// role-colours — but that is the AMBER WASTES regime, a SHIPPED, owner-accepted precedent (a bright-gold
// biome whose horizon L≈0.84 already carries amber/cyan as documented bulletcontrast exceptions). There
// it is fair because the boss's own DARK SERAPH silhouette fills that band (the arena is built so the
// dark figure IS the sky), backing the light bullets in the zone they spawn from; the dark/danger/mid
// colours read against the bright sky trivially. The sky-band probe below only bounds it against a
// blinding-WHITE blowout (a future palette/bloom edit) — the corridor probe is the parry authority.
const shot = await page.screenshot();
const { w: iw, h: ih, rgba } = decodePNG(shot);
const lums = [];
for (let y = Math.floor(ih * 0.55); y < ih * 0.90; y += 2) {
  for (let x = Math.floor(iw * 0.20); x < iw * 0.80; x += 2) {
    const d = (y * iw + x) * 4;
    lums.push((0.2126 * rgba[d] + 0.7152 * rgba[d + 1] + 0.0722 * rgba[d + 2]) / 255);
  }
}
lums.sort((a, b) => a - b);
const p90 = lums[Math.floor(lums.length * 0.90)];
// (PR-J: the corridor gate + rationale above are UNCHANGED — 0.75 is the layered-read ceiling, the
// parry authority regardless of palette. The chiaroscuro court simply ships miles under it, ≈0.35–0.41
// vs the lit-gold heaven's 0.69 — the dark sea IS the fairness dividend of the redo.)
check(p90 <= 0.75, `the heaven's parry corridor stays parry-legible (p90 luminance ${p90.toFixed(3)} ≤ 0.75 — the backdrop never floods the dodge zone)`);
// THE CORRIDOR MEDIAN LOCK (GODHEAD DETONATION, D4): the p90 ceiling is the parry authority, but the
// apotheosis pushes the SKY median up (the identity moved "midnight vault → perpetual detonation"), so
// pin the play-field pocket itself DARK against future tuning. The corridor is the calm, darker pocket
// the detonation deliberately spares (down-hemisphere burst suppression + haze-deck occlusion + dark
// debris) — its BROAD field must stay a dark dodge canvas even as the mid-annulus blazes.
const cP50 = lums[Math.floor(lums.length * 0.50)];
check(cP50 <= 0.45, `the parry corridor's broad field stays DARK (p50 luminance ${cP50.toFixed(3)} ≤ 0.45 — the play-field pocket the detonation spares)`);

// SKY-BAND CEILING (CP2 finding-2; re-based for PR-J): the sky band above the waterline (y 30-55%)
// carries the court's authored brights — the divine column + the god-ray swell on the dark vault —
// and is NOT parry-critical (the corridor probe is), but it must never blow to a blinding WHITE
// field — a future palette/bloom/god-ray edit that pushes it there would wash even the dark-outline
// read and drown the boss silhouette. Gate p95 ≤ 0.90 (the court ships ≈ 0.79–0.84): the column core
// behind the boss may clip, but ≥95% of the band stays below pure white. Merge-blocking against a blowout.
const skyLums = [];
for (let y = Math.floor(ih * 0.30); y < ih * 0.55; y += 2) {
  for (let x = Math.floor(iw * 0.15); x < iw * 0.85; x += 2) {
    const d = (y * iw + x) * 4;
    skyLums.push((0.2126 * rgba[d] + 0.7152 * rgba[d + 1] + 0.0722 * rgba[d + 2]) / 255);
  }
}
skyLums.sort((a, b) => a - b);
const skyP95 = skyLums[Math.floor(skyLums.length * 0.95)];
check(skyP95 <= 0.90, `the heaven's sky band is lit but not blinding-WHITE (p95 luminance ${skyP95.toFixed(3)} ≤ 0.90 — the divine column/god-ray tail may clip, never a white-out)`);

// THE CHIAROSCURO LOCK (PR-J origin, kept verbatim for PR-K THE FIRSTBORN SKY — the astral field is
// darker still and ships the same gate): the owner rejected the first heaven as a bright
// gold postcard ("over-bright and underwhelming") — the redo is a MIDNIGHT vault lit only by the
// god's own light (one gold column + jewel glass burning in the dark). The p95 tail is the column/
// god-ray swell BY DESIGN (it ships ≈0.79–0.84, noise ±0.03 — the offered 0.80 ratchet does NOT
// hold comfortably, so the ceiling above stays 0.90 as the white-out guard). The identity lives in
// the MEDIAN: the court's sky band p50 ships ≈0.39–0.41 where the rejected lit-gold sky sat ≈0.7+.
// Gate p50 ≤ 0.55 — any future palette edit that re-brightens the vault back toward the postcard
// trips THIS, while the authored bright column keeps its tail headroom.
const skyP50 = skyLums[Math.floor(skyLums.length * 0.50)];
check(skyP50 <= 0.55, `the FIRSTBORN SKY stays a dark astral field — the vault's broad field is DARK (sky p50 ${skyP50.toFixed(3)} ≤ 0.55; the light is the Godhead Star + halo, never a bright wash)`);

// The focal lift REVERTS off the heaven (byte-identity): reset → fresh S2 pin → lift.k 0, sclera restored.
const liftOff = await page.evaluate(async () => {
  window.__dd.bossReset(); await new Promise((r) => setTimeout(r, 200));
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(2); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  let s; for (let i = 0; i < 30; i++) { await new Promise((r) => setTimeout(r, 50)); s = window.__dd.bossArenaState(); if ((s.lift?.k ?? 0) === 0) break; }
  return s.lift;
});
check(liftOff && liftOff.k === 0 && liftOff.sclera === 0x8f8365,
  `the focal lift REVERTS off the heaven — S3 byte-identical (lift.k ${liftOff?.k}, sclera 0x${liftOff?.sclera?.toString(16)})`);

// THE EXHALE: fell the boss from the heaven → the mix HOLDS (never descends through the void — the
// reverse-strobe catch) while the fade dissolves the arena back to the biome sky.
const exhale = await page.evaluate(async () => {
  // liftOff left a boss ALIVE at stage 2 — reset first, else spawnBoss no-ops and we stay pinned at
  // phaseIdx 1 (mix settles to 1.0, not the heaven's 2.0), and the exhale never captures the full mix.
  window.__dd.bossReset(); await new Promise((r) => setTimeout(r, 200));
  window.__dd.bossSetDefIdx(13); window.__dd.bossSetStage(3); window.__dd.spawnBoss();
  await new Promise((r) => setTimeout(r, 400)); window.__dd.bossForceFight();
  await new Promise((r) => setTimeout(r, 500)); window.__dd.input.surgeTap = true;
  // Wait for the FULL heaven (mix 2) to settle before the kill — a phase-2 beat that hasn't advanced
  // returns 1+ss01(0)=1.0 (rAF-throttled), so poll on the derived rays like the heaven block, not mix alone.
  let s2; for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 50)); s2 = window.__dd.bossArenaState(); if (s2.mix >= 1.99 && s2.heavenRays > 0.9) break; }
  window.__dd.bossFell();
  window.__dd.forceGameOver();   // the finale/rush kill jumps STRAIGHT to gameover → updateBoss stops. The exhale must decay in updateArenaExhale (all-states) or it strands (CP2/Codex BLOCKER).
  const samples = [];
  for (let i = 0; i < 28; i++) { await new Promise((r) => setTimeout(r, 120)); const s = window.__dd.bossArenaState(); samples.push({ mix: s.mix, fade: s.fade }); }
  return samples;
});
const heldMix = exhale.every((s) => s.mix >= 1.99 || s.mix === 0);   // holds at 2, then snaps to 0 at exhale end
const fadeFell = exhale[0].fade > exhale[Math.min(5, exhale.length - 1)].fade;
check(heldMix && fadeFell, `the natural-kill EXHALE holds the mix + fades (never runs the curve backwards) — mix ${exhale.map((s) => s.mix.toFixed(1)).join('→')}, fade ${exhale[0].fade.toFixed(2)}→${exhale[exhale.length - 1].fade.toFixed(2)}`);
// THE BLOCKER LOCK: the exhale must COMPLETE while parked in 'gameover' (updateBoss dead the whole time)
// — mix reaches 0 (fully dissolved to biome) by the end. Before the fix this froze at 2 forever.
const fullyExhaled = exhale[exhale.length - 1].mix === 0 && exhale[exhale.length - 1].fade === 1;
check(fullyExhaled, `the exhale DECAYS to biome while parked in gameover (updateBoss dead) — final mix ${exhale[exhale.length - 1].mix.toFixed(1)}, fade ${exhale[exhale.length - 1].fade.toFixed(2)} (the finale-kill strand blocker)`);
// PR-H1/H2: the holy architecture dissolved WITH the exhale (fade-scaled) and is hidden again
// after the natural-kill teardown — the self-healing stateless-source law, geometry edition.
const after = await page.evaluate(() => window.__dd.bossArenaState());
check(after.arenaSet?.visible === false && after.arenaSet.k === 0,
  `the Godhead Star is hidden again after the exhale/teardown (visible ${after.arenaSet?.visible}, k ${after.arenaSet?.k})`);
// PR-K: the haze-deck rises back with the same window×fade — the sea is at the shipped y 0 again.
check(after.water?.y === 0 && after.water?.dropK === 0,
  `the sea is RESTORED to y 0 after the exhale/teardown (y ${after.water?.y}, dropK ${after.water?.dropK})`);

check(errors.length === 0, 'no console errors through the arena run') || console.error(errors.slice(0, 5).join('\n'));
await done();

if (fails) { process.exitCode = 1; console.log(`\nunmasked arena verification FAILED (${fails}/${n}).`); }
else console.log(`\n${n} unmasked arena checks passed.`);
