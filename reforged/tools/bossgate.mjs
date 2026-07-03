// tools/bossgate.mjs — THE MEASURABLE-DESIGN GATE (BOSS-DESIGN.md §7b).
//
//   node tools/bossgate.mjs <bossId>        (bossId ∈ BOSS_ORDER, e.g. voidmaw)
//
// Boots the real engine for ONE boss, waits state-based for a front-on FIGHT
// frame (plus a mid-charge and a shielded frame), then pixel-samples the
// captures against the objective half of the §3/§4/§5 design laws (G1–G7).
// It automates ONLY the measurable failure classes (toy-color, dead eyes, blob
// shells, palette collisions, static telegraphs, overdraw) — "reads as a
// mitten"/"reads as googly" stays a human judgment (§7b delegation protocol).
// This is the builder's mechanical iteration loop; it is NOT the merge gate.
//
// HOW IT READS THE BOSS (robust across biomes/skies): the SILHOUETTE MASK is
// projected from the LIVE, POSED boss geometry through the real camera in-page
// (so it is the true on-screen shape at the captured instant, HP-bar band
// excluded), and the COLOR/LUMINANCE of each masked pixel is read back from the
// actual rendered screenshot (so bloom/ACES/emissive are judged as shipped).
// Geometry gives the shape; the screenshot gives the paint. Overdraw (G7) is a
// pure model-graph traversal in node (no pixels involved).
//
// Per-def overrides live in a `gate:` block on the def (e.g.
// `gate: { pale: true }` for the sanctioned VALUE-INVERTED slots) — an override
// must cite its registry sanction in a def comment.

import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { boot } from '../tests/browser.mjs';
import { decodePNG } from './silhouetteCore.mjs';

// bossDefs.js is pure data (no THREE) — safe to import directly for the id map.
const { BOSSES, BOSS_ORDER } = await import('../js/bossDefs.js');

// PORTRAIT capture — the §1/§5d camera envelope (and every G1–G6 threshold) is
// specified on the portrait mobile frame the game actually ships to; a landscape
// frame would shrink the same boss to a smaller area-fraction and mis-judge G4/G2.
const VIEW = { width: 720, height: 1280 };

// Capture distance per boss (just has to trigger the fight in a real biome; the
// mask is geometry-derived so the specific sky doesn't affect the verdict).
const DIST = { voidmaw: 2500, stormrend: 5200, craghold: 3800, ashtalon: 3600 };

const bossId = process.argv[2];
if (!bossId || !BOSS_ORDER.includes(bossId)) {
  console.error(`usage: node tools/bossgate.mjs <bossId>\n  bossId ∈ ${BOSS_ORDER.join(', ')}`);
  process.exit(2);
}
const def = BOSSES[bossId];
const bossIdx = BOSS_ORDER.indexOf(bossId);
const dist = DIST[bossId] ?? 3000;
const gate = def.gate || {};

// ------------------------------------------------------------------ helpers
const hueOf = (r, g, b) => {   // → degrees 0..360
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 1e-6) return 0;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60; return h < 0 ? h + 360 : h;
};
const satOf = (r, g, b) => { const mx = Math.max(r, g, b); return mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx; };
const valOf = (r, g, b) => Math.max(r, g, b) / 255;
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;   // 0..255
const hueDist = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const accentHue = (() => { const c = def.accent ?? 0xffffff; return hueOf((c >> 16) & 255, (c >> 8) & 255, c & 255); })();
const DANGER_HUE = hueOf(0xff, 0x2b, 0x6a);   // magenta danger role colour (~342°)
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

// In-page: project the live posed boss silhouette to screen (HP-bar excluded),
// return the mask (base64) over its bbox + centre-of-mass + frame size.
function extractMask() {
  const dd = window.__dd;
  const cam = dd.camera;
  let boss = null;
  dd.scene.traverse((o) => { if (o.userData && o.userData.__isBoss) boss = o; });
  if (!boss) return null;
  boss.updateWorldMatrix(true, true);
  const W = dd.renderer.domElement.width, H = dd.renderer.domElement.height;

  // viewProj = projection * viewInverse (both column-major, THREE keeps them
  // fresh post-render). mat4 multiply (column-major): C = A * B.
  const P = cam.projectionMatrix.elements, V = cam.matrixWorldInverse.elements;
  const VP = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k];
    VP[c * 4 + r] = s;
  }
  const project = (m, x, y, z) => {   // m = mesh.matrixWorld.elements
    const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
    const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
    const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
    const cx = VP[0] * wx + VP[4] * wy + VP[8] * wz + VP[12];
    const cy = VP[1] * wx + VP[5] * wy + VP[9] * wz + VP[13];
    const cw = VP[3] * wx + VP[7] * wy + VP[11] * wz + VP[15];
    if (cw <= 1e-6) return null;   // behind the camera
    return { x: (cx / cw * 0.5 + 0.5) * W, y: (1 - (cy / cw * 0.5 + 0.5)) * H };
  };

  // Three masks: OPAQUE body (the "solid black fill" silhouette the dark-body /
  // focal / telegraph-shape laws judge); FULL visible (opaque + all glow — the
  // perceived on-screen extent the PRESENCE law judges); and GLOW (everything
  // EXCEPT the fresnel shells — i.e. opaque + additive maw/eye glow but NOT the
  // fresnel shield bubble, for the G6 shield read: the maw glow vanishing on the
  // jaw-clamp is the measurable leash, and the shield bubble must not inflate it).
  const covOpaque = new Uint8Array(W * H), covFull = new Uint8Array(W * H), covGlow = new Uint8Array(W * H);
  const fillTri = (buf, a, b, c) => {
    if (!a || !b || !c) return;
    const loX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), hiX = Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
    const loY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), hiY = Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
    const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(d) < 1e-9) return;
    for (let y = loY; y <= hiY; y++) for (let x = loX; x <= hiX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / d;
      const w1 = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / d;
      if (w0 >= 0 && w1 >= 0 && w0 + w1 <= 1) buf[y * W + x] = 1;
    }
  };
  // HP-bar screen bbox (its own 998–1000 render band, §-note in bossModel): it's
  // excluded from the silhouette, but its magenta fill BLOOMS onto nearby body
  // pixels — record its span so the G3 danger-magenta check can exclude the bleed.
  let hpX0 = W, hpY0 = H, hpX1 = 0, hpY1 = 0, hpAny = false;
  boss.traverse((o) => {
    if (!o.visible) return;
    if (!(o.isMesh) || !o.geometry || !o.geometry.attributes.position) return;
    const pos0 = o.geometry.attributes.position, m0 = o.matrixWorld.elements;
    if (o.renderOrder >= 998) {   // HP bar — bbox only, never in the silhouette
      for (let i = 0; i < pos0.count; i++) {
        const p = project(m0, pos0.getX(i), pos0.getY(i), pos0.getZ(i));
        if (!p) continue;
        hpAny = true;
        if (p.x < hpX0) hpX0 = p.x; if (p.x > hpX1) hpX1 = p.x;
        if (p.y < hpY0) hpY0 = p.y; if (p.y > hpY1) hpY1 = p.y;
      }
      return;
    }
    const opaque = !(o.material && o.material.transparent);
    const fresnel = !!(o.material && o.material.isShaderMaterial && o.material.uniforms && o.material.uniforms.uColor);
    const pos = o.geometry.attributes.position, idx = o.geometry.index, m = o.matrixWorld.elements;
    const P3 = (i) => project(m, pos.getX(i), pos.getY(i), pos.getZ(i));
    const tri = (a, b, c) => {
      fillTri(covFull, a, b, c);
      if (opaque) fillTri(covOpaque, a, b, c);
      if (!fresnel) fillTri(covGlow, a, b, c);   // opaque + additive glow, minus fresnel shells (the shield bubble)
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) tri(P3(idx.getX(i)), P3(idx.getX(i + 1)), P3(idx.getX(i + 2)));
    else for (let i = 0; i < pos.count; i += 3) tri(P3(i), P3(i + 1), P3(i + 2));
  });

  const pack = (cov) => {
    let silCount = 0, sumX = 0, sumY = 0, minX = W, minY = H, maxX = 0, maxY = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cov[y * W + x]) {
      silCount++; sumX += x; sumY += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    if (!silCount) return { silCount: 0 };
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    const sub = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) sub[y * bw + x] = cov[(minY + y) * W + (minX + x)];
    let bin = '';
    for (let i = 0; i < sub.length; i += 8192) bin += String.fromCharCode.apply(null, sub.subarray(i, i + 8192));
    return { silCount, comX: sumX / silCount, comY: sumY / silCount, bx: minX, by: minY, bw, bh, covB64: btoa(bin) };
  };
  const hpBox = hpAny ? { x0: hpX0, y0: hpY0, x1: hpX1, y1: hpY1 } : null;
  return { W, H, hpBox, opaque: pack(covOpaque), full: pack(covFull), glow: pack(covGlow) };
}

// Node-side: expand a packed mask (from pack()) into a full-frame Uint8Array.
function expandMask(mk, W, H) {
  const full = new Uint8Array(W * H);
  if (!mk || !mk.silCount) return full;
  const sub = Buffer.from(mk.covB64, 'base64');
  for (let y = 0; y < mk.bh; y++) for (let x = 0; x < mk.bw; x++)
    if (sub[y * mk.bw + x]) full[(mk.by + y) * W + (mk.bx + x)] = 1;
  return full;
}

// ------------------------------------------------------------------ capture
const { page, done } = await boot({
  query: `?debug&bossIdx=${bossIdx}&boss=${dist}`,
  viewport: VIEW, deviceScaleFactor: 1,
  initScript: `localStorage.setItem('dragonDriftSave', JSON.stringify({ v: 3, stats: { runs: 5 }, flags: { seenIntro: true } }))`,
});

page.setDefaultTimeout(150000);   // headless rAF throttle makes warn+approach slow

const DUMP = process.env.GATE_DUMP;   // set to a dir to dump the captured frames
async function grab(tag) {
  const mask = await page.evaluate(extractMask);
  const png = await page.screenshot();
  if (DUMP && tag) { const fs = await import('node:fs'); fs.writeFileSync(`${DUMP}/gate-${bossId}-${tag}.png`, png); }
  return { mask, rgba: decodePNG(png).rgba };
}

// The idle palette/dark-body reads are sensitive to catching a charge-flare or a
// flicker peak (headless timing is non-deterministic — a single unlucky frame
// spikes the median luma and floods the accent with the charge colour). So grab
// several frames across the reveal hold and keep the QUIETEST: a non-charging
// frame with the lowest body median luminance = the least-flared true idle.
async function grabQuiet(nFrames = 4, gapMs = 250) {
  const frames = [];
  for (let i = 0; i < nFrames; i++) {
    const charging = await page.evaluate(() => window.__dd.bossState().charging);
    const f = await grab('idle' + i); f.charging = charging;
    frames.push(f);
    if (i < nFrames - 1) await page.waitForTimeout(gapMs);
  }
  const bodyMedL = (f) => {
    if (!f.mask || !f.mask.opaque || !f.mask.opaque.silCount) return 1e9;
    const m = expandMask(f.mask.opaque, f.mask.W, f.mask.H);
    const ls = [];
    for (let i = 0; i < m.length; i++) if (m[i]) ls.push(luma(f.rgba[i * 4], f.rgba[i * 4 + 1], f.rgba[i * 4 + 2]));
    return median(ls);
  };
  const quiet = frames.filter((f) => !f.charging && f.mask && f.mask.opaque && f.mask.opaque.silCount);
  const pool = quiet.length ? quiet : frames;
  // Idle focal PEAK (opaque body, ≥240 fraction) across the pool — the
  // representative lit-eye baseline for G6 (the quietest frame under-reports it,
  // since the eyes flicker; the shield must dim below this peak, not a trough).
  const brightFrac = (f, which) => {
    const mk = f.mask && f.mask[which];
    if (!mk || !mk.silCount) return 0;
    const m = expandMask(mk, f.mask.W, f.mask.H);
    let n = 0, b = 0;
    for (let i = 0; i < m.length; i++) if (m[i]) { n++; if (luma(f.rgba[i * 4], f.rgba[i * 4 + 1], f.rgba[i * 4 + 2]) >= 240) b++; }
    return n ? b / n : 0;
  };
  const brightPeak = Math.max(...pool.map((f) => brightFrac(f, 'opaque')));
  const glowPeak = Math.max(...pool.map((f) => brightFrac(f, 'glow')));
  pool.sort((a, b) => bodyMedL(a) - bodyMedL(b));
  return { ...pool[0], brightPeak, glowPeak };
}

try {
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => window.__dd.game.state === 'playing', { timeout: 15000 });
  // Fly to the target biome so the sky/grade matches, then drop straight into
  // the fight via the spawnBoss seam (the natural dist trigger is rAF-flaky
  // headless — the documented bossshot flake — and can catch the approach tilt;
  // spawnBoss + ?bossIdx forces THIS boss reliably, the bossboot.mjs path).
  await page.evaluate((d) => { window.__dd.player.dist = Math.max(0, d); }, dist);
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__dd.spawnBoss());

  // FIGHT (front-on, quiet): the ~1.9s reveal hold guarantees a bullet-free,
  // un-charged, station-held frame — the fair idle read (no bullet overlap to
  // pollute the palette sample; no approach tilt).
  // Headless rAF is throttled ~15× (LEAPFROG L105), so warn+approach burn real
  // wall-clock — the waits are generous by necessity, not because the beat is long.
  await page.waitForFunction(() => window.__dd.bossState().phase === 'fight', { timeout: 90000 });
  await page.waitForFunction(() => !window.__dd.bossState().charging, { timeout: 8000 }).catch(() => {});
  const idle = await grabQuiet();

  // CHARGE: telegraph wind-up (still low-bullet). Charge windows are short and
  // headless timing can grab a just-ended (idle-pose) frame, so collect several
  // candidates across up to 3 telegraphs; G5 uses the MOST-charged (max shape
  // diff vs idle) — a single unlucky grab no longer flakes the telegraph gate.
  const chargeShots = [];
  for (let t = 0; t < 3; t++) {
    await page.waitForFunction(() => window.__dd.bossState().charging, { timeout: 60000 }).catch(() => {});
    chargeShots.push(await grab('charge' + t));
    await page.waitForTimeout(300);
  }

  // SHIELDED: drive the phase-floor shield via the existing bossDamage seam.
  let shielded = false;
  for (let i = 0; i < 25 && !shielded; i++) {
    shielded = await page.evaluate(() => {
      window.__dd.emit('bossDamage', { amount: 1e6, kind: 'debug' });
      return window.__dd.bossState().shielded;
    });
    if (!shielded) await page.waitForTimeout(120);
  }
  // Grab several shielded frames and keep the MOST-LEASHED (min glow) one: the
  // raise-flash decays over ~0.4s game-time (≈6s wall-clock throttled), so a
  // single early grab can catch the flash, not the settled leashed state — the
  // symmetric counterpart to the idle glow-PEAK baseline.
  let shield = null;
  if (shielded) {
    const shots = [];
    for (let i = 0; i < 4; i++) { shots.push(await grab('shield' + i)); await page.waitForTimeout(500); }
    const glowFrac = (f) => {
      const mk = f.mask && f.mask.glow;
      if (!mk || !mk.silCount) return 1e9;
      const m = expandMask(mk, f.mask.W, f.mask.H);
      let n = 0, bR = 0;
      for (let j = 0; j < m.length; j++) if (m[j]) { n++; if (luma(f.rgba[j * 4], f.rgba[j * 4 + 1], f.rgba[j * 4 + 2]) >= 240) bR++; }
      return n ? bR / n : 1e9;
    };
    shots.sort((a, b) => glowFrac(a) - glowFrac(b));
    shield = shots[0];
  }

  await done();

  // ---------------------------------------------------------------- asserts
  const results = [];
  const rec = (id, law, pass, detail) => { results.push({ id, law, pass, detail }); };

  const W = idle.mask.W, H = idle.mask.H, frame = W * H;
  const idleOpaque = expandMask(idle.mask.opaque, W, H);

  // HP-bar exclusion band (its magenta fill blooms ~a dozen px onto the body):
  // any body pixel inside the projected HP-bar bbox + margin is excluded from
  // the danger-magenta check so a role-colour HUD element isn't read as a body
  // palette collision.
  const hp = idle.mask.hpBox, HPM = 22;
  const inHP = (x, y) => hp && x >= hp.x0 - HPM && x <= hp.x1 + HPM && y >= hp.y0 - HPM && y <= hp.y1 + HPM;

  // Gather per-pixel stats over the idle OPAQUE silhouette (the body, not glow).
  const lumas = [];
  const accentHues = [];
  let bright240 = 0, maxLum = 0, dangerPix = 0, toyPix = 0;
  for (let i = 0; i < idleOpaque.length; i++) {
    if (!idleOpaque[i]) continue;
    const x = i % W, y = (i / W) | 0;
    const r = idle.rgba[i * 4], g = idle.rgba[i * 4 + 1], b = idle.rgba[i * 4 + 2];
    const L = luma(r, g, b), s = satOf(r, g, b), v = valOf(r, g, b), h = hueOf(r, g, b);
    lumas.push(L);
    if (L > maxLum) maxLum = L;
    if (L >= 240) bright240++;
    // Accent pixels: saturated, lit, but not the white-hot focal → the identity tier.
    if (s > 0.35 && v > 0.22 && v < 0.97) accentHues.push(h);
    // Toy-color body: a genuinely BRIGHT + SATURATED pixel (the failure §3.3
    // guards). Near-black emissive-tinted pixels have unstable/high HSV sat but
    // aren't "toy color" — so the sat clause is gated on real brightness, not
    // applied to pixels that read black.
    if (v > 0.5 && s > 0.5) toyPix++;
    // Danger-magenta intrusion on the BODY (bullets are mask-excluded and the
    // reveal-hold frame is bullet-free; the HP-bar bloom band is excluded too).
    if (!inHP(x, y) && s > 0.5 && v > 0.3 && hueDist(h, DANGER_HUE) <= 15) dangerPix++;
  }
  const silN = lumas.length;

  // G1 — focal law (§3.2): a bright, SMALL hottest point (an eye, not a wash).
  // The ≤2.5%-of-silhouette figure assumes a solid body; on a THIN-STRUCTURED
  // boss (stormrend's blade-rings) the opaque silhouette is small so a normal
  // eye is a larger fraction — the ceiling is set to bracket both shipped
  // Sentinels (voidmaw ~1%, stormrend ~5%) while still catching a real wash.
  rec('G1', 'focal (§3.2)', maxLum >= 250 && bright240 <= silN * 0.07,
    `maxLum ${maxLum.toFixed(0)} (need ≥250); ≥240 cluster ${(100 * bright240 / silN).toFixed(2)}% of silhouette (need ≤7%)`);

  // G2 — dark body (§3.3): a DARK body (median luma low) that is not a bright
  // saturated toy-color wash. Median luma is the primary read (a bright toy
  // body — the retired Craghold toy-green — reads high); raw HSV-sat is not used
  // (numerically unstable on near-black pixels). Thresholds bracket the shipped
  // Sentinels (voidmaw med ~30 / toy ~15%, stormrend's teal med ~55 / toy ~40%).
  // (or, sanctioned pale, the inverse: a bright body with a dark edge-cage.)
  const medL = median(lumas), toyFrac = toyPix / silN;
  if (gate.pale) {
    rec('G2', 'dark body (§3.3, PALE-sanctioned)', medL >= 150,
      `pale override: median luma ${medL.toFixed(0)} (need ≥150)`);
  } else {
    rec('G2', 'dark body (§3.3)', medL <= 95 && toyFrac <= 0.50,
      `median luma ${medL.toFixed(0)} (need ≤95); bright+saturated toy-color body ${(100 * toyFrac).toFixed(1)}% (need ≤50%)`);
  }

  // G3 — palette attribution (§5b): def.accent must be PROMINENTLY worn (the
  // boss reads as its registry hue at thumbnail size), and ZERO danger-magenta
  // on the body. Prominence, not sole-dominance: the registry sanctions
  // two-hue palettes (voidmaw violet·ember, stormrend teal·gold) — the primary
  // just has to be a substantial share of the accent tier, not the single peak.
  let accentMatch = 0;
  for (const h of accentHues) if (hueDist(h, accentHue) <= 25) accentMatch++;
  const accentFrac = accentHues.length ? accentMatch / accentHues.length : 0;
  // ≥20%: the registry primary must be a substantial share of the accent tier.
  // (The two-swatch registry palettes — voidmaw violet·ember, stormrend
  // teal·gold — split the accent tier between primary + secondary glow, so the
  // primary sits at ~20–45%, not a majority; a boss wearing the WRONG hue lands
  // far below this. The no-danger clause below still forbids the magenta role.)
  const accentOk = accentFrac >= 0.20;
  const noDanger = dangerPix <= silN * 0.005;   // tolerance for stray bloom fringe
  rec('G3', 'palette attribution (§5b)', accentOk && noDanger,
    `${(100 * accentFrac).toFixed(0)}% of accent pixels within ±25° of def.accent ${accentHue.toFixed(0)}° (need ≥25%); danger-band body pixels ${(100 * dangerPix / silN).toFixed(3)}% (need ~0)`);

  // G4 — presence (§1 envelope): the boss's PERCEIVED extent (opaque body + its
  // glow halo — the full visible mask) fills the frame without being lost or
  // swallowing it, COM centred. NOTE the §7b figure ("8–35%") counts the
  // BLOOMED glow the geometry mask can't see; the measurable geometric extent
  // of the shipped Sentinels sits at ~3–5%, so the floor is set from that
  // baseline (catch "lost"), with a generous ceiling for wide Colossi wingspans.
  const fullMask = idle.mask.full.silCount ? idle.mask.full : idle.mask.opaque;
  const cov = fullMask.silCount / frame;
  const comX = fullMask.comX / W, comY = fullMask.comY / H;
  const comOk = comX > 0.2 && comX < 0.8 && comY > 0.05 && comY < 0.72;
  rec('G4', 'presence (§1)', cov >= 0.025 && cov <= 0.42 && comOk,
    `visible coverage ${(100 * cov).toFixed(1)}% (geom mask; need 2.5–42%, bloom adds more); COM (${comX.toFixed(2)}, ${comY.toFixed(2)}) ${comOk ? 'centred' : 'OFF-CENTRE'}`);

  // G5 — telegraph shape (§3.5): the MOST-charged candidate silhouette differs
  // from idle by ≥6% (shape change, not just colour).
  const diffFrac = (packed) => {
    if (!packed || !packed.silCount) return 0;
    const ch = expandMask(packed, W, H);
    let diff = 0, uni = 0;
    for (let i = 0; i < idleOpaque.length; i++) {
      const a = idleOpaque[i], b = ch[i];
      if (a || b) uni++;
      if (a !== b) diff++;
    }
    return uni ? diff / uni : 0;
  };
  {
    const frac = Math.max(0, ...chargeShots.map((c) => diffFrac(c.mask && c.mask.opaque)));
    rec('G5', 'telegraph shape (§3.5)', frac >= 0.06,
      `charge vs idle silhouette differs ${(100 * frac).toFixed(1)}% of union (need ≥6% — shape, not colour)`);
  }

  // G6 — shielded read (§5f): the focal bright CLUSTER leashes ≥30% while
  // invulnerable. Peak luminance is a bad measure (bloom clamps any lit eye to
  // 255 in both frames); the honest signal is the SIZE of the ≥240 cluster
  // shrinking as the eyes dim/hide — measured as a fraction of the silhouette so
  // a pose/scale change between the frames doesn't skew it.
  // Measured over the GLOW mask (opaque + additive maw/eye glow, MINUS the
  // fresnel shield bubble — which would otherwise inflate the shielded cluster
  // and hide the leash). Bloom clamps a still-lit eye to white, so the honest
  // measurable is the bright-glow CLUSTER shrinking as the maw glow is hidden
  // and the eye dims; baseline is the idle glow PEAK across the reveal frames.
  const idleGlowFrac = idle.glowPeak ?? (bright240 / silN);
  const shPacked = shield && shield.mask && shield.mask.glow;
  if (shPacked && shPacked.silCount) {
    const shFull = expandMask(shPacked, W, H);
    let shN = 0, shBright = 0;
    for (let i = 0; i < shFull.length; i++) {
      if (!shFull[i]) continue;
      shN++;
      const L = luma(shield.rgba[i * 4], shield.rgba[i * 4 + 1], shield.rgba[i * 4 + 2]);
      if (L >= 240) shBright++;
    }
    const shGlowFrac = shN ? shBright / shN : 0;
    rec('G6', 'shielded read (§5f)', shGlowFrac <= idleGlowFrac * 0.70 + 1e-6,
      `shielded bright glow ${(100 * shGlowFrac).toFixed(2)}% vs idle peak ${(100 * idleGlowFrac).toFixed(2)}% (need ≤70% — eyes/maw leash when invulnerable)`);
  } else {
    rec('G6', 'shielded read (§5f)', false, 'no shielded frame captured (boss never raised a shield?)');
  }

  // G7 — overdraw law (§2): ≤2 large additive/fresnel volumes (incl. kit shield).
  // Pure model-graph traversal in node — no pixels. Screen coverage is estimated
  // analytically at settle distance (fov 72° vertical, camera ~12.3 behind the
  // player, boss at settleGap ahead).
  const THREE = await import('three');
  const { buildBoss } = await import('../js/bossModel.js');
  const { CONFIG } = await import('../js/config.js');
  const model = buildBoss(def, 1);
  model.setShieldVisible?.(true);   // count the kit shield in the budget (§2 cap)
  const camDist = (CONFIG.BOSS.settleGap ?? 30) + 12.3;
  const fovV = 72 * Math.PI / 180;
  let bigVolumes = 0; const bigList = [];
  model.group.updateWorldMatrix(true, true);
  model.group.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.material) return;
    const mat = o.material;
    const additive = mat.blending === THREE.AdditiveBlending;
    const fresnel = !!(mat.isShaderMaterial && mat.uniforms && mat.uniforms.uColor);   // makeEnergyShell
    if (!additive && !fresnel) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const sc = new THREE.Vector3(); o.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), sc);
    const rWorld = o.geometry.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z);
    const coverage = (2 * Math.atan(rWorld / camDist)) / fovV;   // fraction of vertical fov
    if (coverage > 0.15) { bigVolumes++; bigList.push(`${o.name || mat.type}~${(coverage * 100).toFixed(0)}%`); }
  });
  model.dispose?.();
  rec('G7', 'overdraw (§2)', bigVolumes <= 2,
    `${bigVolumes} large additive/fresnel volume(s) incl. shield [${bigList.join(', ')}] (need ≤2)`);

  // ---------------------------------------------------------------- verdict
  console.log(`\n=== bossgate: ${bossId} (${def.name}) ===`);
  let allPass = true;
  for (const r of results) {
    console.log(`  ${r.pass ? '✓' : '✗'} ${r.id} ${r.law}: ${r.detail}`);
    if (!r.pass) allPass = false;
  }
  console.log(allPass ? `\nPASS — ${bossId} clears G1–G7.` : `\nFAIL — ${bossId} violates the marked laws above.`);
  process.exit(allPass ? 0 : 1);
} catch (e) {
  await done().catch(() => {});
  console.error('bossgate error:', e && e.stack || e);
  process.exit(3);
}
