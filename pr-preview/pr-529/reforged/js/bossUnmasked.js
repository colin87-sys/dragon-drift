import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { mulberry32 } from './util.js';
import { createBossCommon, stripForMerge } from './bossKit.js';
import { buildAngelWing } from './angelWing.js';   // the owner's merged, signed-off angel wing (do NOT rebuild)

// The seraph's 8 wings each merge their static feathers per material (13 draws/wing → ~3) — the single
// biggest draw-call lever here, and it pays off AGAIN in every full-scene aux pass (water mirror +
// god-ray mask re-draw the wings too). Feathers never animate individually (only the wing group
// breathes/unfurls) and dissolve rides the shared material, so the merge is visually byte-identical.
// `?wingedit` keeps the wings UNMERGED (every feather a separate object) for design iteration on
// eye/feather placement — the merge is a build-time collapse, so the design params are edited the same
// either way; this flag just lets you grab individual feathers while tweaking.
const WING_MERGE = !(typeof location !== 'undefined' && new URLSearchParams(location.search || '').has('wingedit'));
// ?wingparts — DIAGNOSTIC: paint each wing anatomical part a distinct flat colour (angelWing
// debugParts) so a capture identifies exactly which geometry renders as a given on-screen shape.
const WING_DEBUG_PARTS = (typeof location !== 'undefined' && new URLSearchParams(location.search || '').has('wingparts'));

// THE UNMASKED — slot 14, the APEX / FINALE (BOSS-DESIGN.md §5b row 14, §5c APEX).
// "The second sun that cracks open into a biblically-accurate angel." Three STAGES
// dissolve-swap between sub-rigs: STAGE 1 the ECLIPSE-EYE (this file) → STAGE 2 the
// OPHANIM → STAGE 3 the unveiling. STAGED BUILD: renders STAGE 1 only; stages 2/3,
// THE MEDLEY, STAR PIPS, the relics, the surge-chase, the second-sun landmark +
// handoff() are CP2. Def-gated + inert for other bosses.
//
// ── STAGE 1 SHEET (§3b, Fable-signed-off; revised post owner-review 2026-07) ──
// Reads as: a second sun — a FLAT black DISC ringed by a soft luminous white CORONA
// RING, under ONE HEAVY HOODED LID that peels back to reveal a giant white almond
// EYE. Owner-review revision: (1) the corona is a SOFT GLOWING RING (low-frequency
// asymmetric lobes + breathe, NEVER hard radial spikes = cartoon sun, NEVER a
// perfect even annulus = portal); (2) ONE HEAVY HOODED lid (a thick dome with mass +
// a gold lash-line, hinged near the almond top, always keeps a hood) — NOT thin flat
// crescents, NOT a closed loop around the eye (= a framed icon); (3) the almond EYE
// DOMINATES the disc (~0.77× disc diameter, wider than the lane) — the black disc is
// its rim, and the dark pupil-seed tracks WITHIN it so the player's stick drags the
// gaze (the §5j "Don't Move" beat). Anti-reads: NOT sun/moon, NOT Voidmaw (clean disc
// until the S1→S2 CRACK), NOT UFO/portal, NOT a spiky cartoon sun, NOT Eye-of-Sauron
// (cold white, horizontal lid, no fire, no vertical slit).
//
// NOTE (owner review): the rounded-square "frame" the owner saw around the eye is the
// GAME's LANCE lock-on reticle (reticle.js — two nested squares) snapping to the
// `focalEye` weak-point, NOT boss geometry. CP2 task: suppress it during the frozen-cam
// *Don't Move* reveal (lockLayer.js has entrance-suppression precedent). The heavy hood
// below makes the eye read as a giant eye regardless.
//
// ── §4b CHARISMA (stage 1: lid aperture + pupil-seed) ── GAZE = the pupil-seed live-
// tracks the stick within the almond, ~0.35s wet lag. BLINK = aperture contract/dilate.
// CHARGE-TELL = seed constricts + corona swells + hood lifts to WRATH. EXPRESSION =
// heavy-lidded / watching / wrath (hood position). FLINCH = seed skitters + hood twitch.
// NOTICE = hood PEELS + a saccade snaps the seed dead-centre. DEATH = kit fade (the
// CRACK rite lands at the CP2 seam).
//
// CONTRACT: boss.js `placeGroup` stomps `group.rotation`; `kit.setDissolve` owns
// `group.scale` — all animated parts live on `rig`/pivots.

export function buildUnmasked(def, quality = 1) {
  const accent = def.accent ?? 0xf0e0a0;   // gold (lash-line + motes; identity accent, emissive only)
  const glow = def.glow ?? 0xffffff;       // white corona (the reserved glow-shape, from slot 1)
  const lowQ = quality < 0.75;
  const TAU = Math.PI * 2;

  const kit = createBossCommon(def, quality, { shieldRadius: 5.6, hpBarY: 7.8 });
  const { group, track } = kit;
  group.userData.archetype = 'unmasked';

  const rig = new THREE.Group();
  group.add(rig);
  const stage1 = new THREE.Group();
  stage1.name = 'stage1Rig';
  rig.add(stage1);

  const rnd = mulberry32(0x14a9e1105);

  const DISC_R = 4.7;
  const DISC_Z = 0.0;
  const EYE_Z = 0.4;
  const LID_Z = 0.95;

  // ── THE FLAT BLACK DISC — pure void-black, opaque, matte, FLAT; clean until the
  // scripted S1→S2 CRACK (CP2). MeshBasic → true black on the front-lit rail. ──
  const discSeg = lowQ ? 44 : 80;
  const discMat = track(new THREE.MeshBasicMaterial({ color: 0x000000 }));
  const discGeo = new THREE.CircleGeometry(DISC_R, discSeg);
  discGeo.translate(0, 0, DISC_Z);
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.name = 'eclipseDisc';
  stage1.add(disc);

  // ── THE CORONA — a SOFT LUMINOUS RING (the reserved glow-shape). Built as an
  // additive annulus with RADIAL FALLOFF via vertex colour (bright white inner edge →
  // BLACK outer, so additive blending dissolves it to nothing — no hard outer edge =
  // no portal rim). ASYMMETRIC via LOW-FREQUENCY lobes only (period > 90°): the outer
  // extent + inner brightness vary in 2–3 broad lobes with one dominant bright quadrant
  // (authored §3.6, not noise) — a glowing ring that, on a look, has no two matching
  // arcs. NO hard radial lines (= cartoon sun), NO spin (breathe only, §3.7). ──
  const CN = lowQ ? 60 : 108;
  const BRIGHT_DIR = 1.15;                 // the dominant bright quadrant (radians)
  const coronaPos = [], coronaCol = [], coronaIdx = [];
  const HOT = 1.5;
  // THREE radial loops (inner bright → mid → black) for a SMOOTH, wide falloff — so the
  // outer edge stays soft even on a PALE biome sky (additive white on pale washes a
  // 2-loop gradient into a hard rim; the mid loop keeps it gradual). Owner-review polish #1.
  for (let i = 0; i <= CN; i++) {
    const a = (i / CN) * TAU;
    // Low-frequency, broad lobes — outer falloff extent varies ±~35% (soft plumes, not spikes).
    const lobe = 1 + 0.34 * Math.sin(a * 2 + 0.7) + 0.17 * Math.sin(a * 3 - 1.2);
    // One dominant bright quadrant + a gentle floor so the ring never fully dies.
    const bq = 0.5 + 0.5 * Math.max(0, Math.cos(a - BRIGHT_DIR));
    const cx = Math.cos(a), cy = Math.sin(a);
    const rIn = DISC_R * 0.985;
    const rMid = DISC_R + DISC_R * 0.07 * lobe;
    const rOut = DISC_R + DISC_R * 0.22 * lobe;       // wider band → a gentler outer edge
    coronaPos.push(cx * rIn, cy * rIn, DISC_Z - 0.02, cx * rMid, cy * rMid, DISC_Z - 0.02, cx * rOut, cy * rOut, DISC_Z - 0.02);
    const hot = HOT * bq;
    coronaCol.push(hot, hot, hot, hot * 0.42, hot * 0.42, hot * 0.42, 0, 0, 0);   // bright → mid → BLACK
  }
  for (let i = 0; i < CN; i++) {
    const a = i * 3, b = a + 3;
    coronaIdx.push(a, a + 1, b + 1, a, b + 1, b);           // inner → mid strip
    coronaIdx.push(a + 1, a + 2, b + 2, a + 1, b + 2, b + 1); // mid → outer strip
  }
  const coronaGeo = new THREE.BufferGeometry();
  coronaGeo.setAttribute('position', new THREE.Float32BufferAttribute(coronaPos, 3));
  coronaGeo.setAttribute('color', new THREE.Float32BufferAttribute(coronaCol, 3));
  coronaGeo.setIndex(coronaIdx);
  const coronaMat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  coronaMat.toneMapped = false;   // .color multiplies the vertex colours → the breathe/charge dimmer
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  corona.name = 'corona';
  stage1.add(corona);

  // A thin DARK separation halo just outside the rim (behind the corona) so the ring +
  // disc read as shape on a PALE biome sky (persistence). Invisible on the dark sky.
  const haloMat = track(new THREE.MeshBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide,
  }));
  const haloGeo = new THREE.RingGeometry(DISC_R * 0.99, DISC_R * 1.14, lowQ ? 40 : 72);
  haloGeo.translate(0, 0, DISC_Z - 0.05);
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.name = 'coronaHalo';
  stage1.add(halo);

  // ── THE CRACK SEAMS (S1→S2 transition): jagged hot fractures that spider across the black
  // disc as the mask breaks open — the "it made the masks" rite (the Voidmaw rhyme). Additive
  // gold-white polylines from near the pupil to the rim, HOT at the core → dark at the tip so
  // they read as splitting light bleeding through, not drawn lines. Hidden (opacity 0) until
  // setStageMorph drives them; they ride `stage1`, so they collapse away with the mask. ──
  // Built as TAPERED QUADS (not LineSegments — WebGL draws lines at a fixed 1px, too thin to
  // glow at fight distance): each bolt segment is a ribbon that is WIDE + hot at the core and
  // narrows + darkens to the rim, so additive blending reads it as splitting light.
  const crackMat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  crackMat.toneMapped = false;
  const crackHot = new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.5);
  // SEPARATE RNG stream (determinism): the crack jitter must NOT consume the main `rnd`
  // stream, or every seeded draw built after it (the stage-2 pupil biases, the scar) shifts —
  // adding this geometry would silently move the shipped seraph. A private seed keeps `rnd`
  // (and therefore stage 2) byte-for-byte unchanged.
  const crnd = mulberry32(0x1ceb00d);
  const crackPos = [], crackCol = [], crackIdx = [];
  const NCRACKS = lowQ ? 6 : 9;
  let cv = 0;   // running vertex count
  for (let c = 0; c < NCRACKS; c++) {
    let ang = (c / NCRACKS) * TAU + (crnd() - 0.5) * 0.5;
    let r = 0.3, px = Math.cos(ang) * r, py = Math.sin(ang) * r, pb = 1;
    const segs = 3 + (crnd() * 3 | 0);
    for (let s = 0; s < segs; s++) {
      ang += (crnd() - 0.5) * 0.9;                                  // jitter the heading → a forked bolt
      r = Math.min(DISC_R * 0.98, r + (DISC_R - 0.3) / segs * (0.7 + crnd() * 0.6));
      const nx = Math.cos(ang) * r, ny = Math.sin(ang) * r, nb = Math.max(0, 1 - r / DISC_R);
      const dx = nx - px, dy = ny - py, dl = Math.hypot(dx, dy) || 1;
      const ox = -dy / dl, oy = dx / dl;                            // unit perpendicular to the segment
      const wp = 0.05 + 0.10 * (1 - pb), wn = 0.05 + 0.10 * (1 - nb);   // fatter toward the VISIBLE rim (inverted — the roots hide behind the eye)
      crackPos.push(px + ox * wp, py + oy * wp, DISC_Z + 0.22, px - ox * wp, py - oy * wp, DISC_Z + 0.22,
        nx + ox * wn, ny + oy * wn, DISC_Z + 0.22, nx - ox * wn, ny - oy * wn, DISC_Z + 0.22);
      // INVERTED brightness: HOT where the crack reaches the exposed rim/lune (r→DISC_R), dark at
      // the root behind the eye — so the light that survives to the visible band is the bright end.
      for (const b of [pb, pb, nb, nb]) { const rb = 1 - b; crackCol.push(crackHot.r * rb, crackHot.g * rb, crackHot.b * rb); }
      crackIdx.push(cv, cv + 1, cv + 2, cv + 1, cv + 3, cv + 2);
      cv += 4;
      px = nx; py = ny; pb = nb;
    }
  }
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute('position', new THREE.Float32BufferAttribute(crackPos, 3));
  crackGeo.setAttribute('color', new THREE.Float32BufferAttribute(crackCol, 3));
  crackGeo.setIndex(crackIdx);
  const cracks = new THREE.Mesh(crackGeo, crackMat);
  cracks.name = 'crackSeams';
  stage1.add(cracks);

  // ── LANCE ORGANS (rung 14): the two paintable WOUND anchors on the crack seams (§lance CP1).
  // Empty Object3Ds seated at INNER crack-fork points (r≈1.9, well inside the DISC_R·0.98≈4.6 rim)
  // so at scale 2.4 they stay comfort-legal — world |x|≤~9.4, y≈14 across the station sway (the
  // rim tips at r 4.3 would fly the reticle to |x|>10.4). They ride `stage1`, so they collapse away
  // with the mask at the S1→S2 crack (phase-gated to [0] in the def; painted only in stage 1). The
  // brand pop + shimmer render on them; the cracks read as the wound the lance splits wider. ──
  const crackSeamL = new THREE.Object3D();
  crackSeamL.name = 'crackSeamL'; crackSeamL.position.set(-1.85, 0.55, DISC_Z + 0.06); stage1.add(crackSeamL);
  const crackSeamR = new THREE.Object3D();
  crackSeamR.name = 'crackSeamR'; crackSeamR.position.set(1.85, 0.55, DISC_Z + 0.06); stage1.add(crackSeamR);

  // ── THE HERO SCLERA-FISSURE (S1→S2, the owner's literal complaint: "a crack in the EYE") ──
  // A single jagged fault that splits ACROSS the great white eye — not hidden on the disc rim.
  // Rendering physics the shipped cracks ignored: additive light is INVISIBLE on the HDR-white
  // sclera, so over the eye the crack must be a DARK opaque core (dark-on-white reads); over the
  // black disc that core vanishes and a wider GOLD additive underglow carries it (light-on-black).
  // Two co-located strips give both for ~2 draws. Rides `stage1` (collapses with the mask); driven
  // to opacity 0 at rest → the eye is byte-identical until the crack drives it. Authored polyline
  // (§3.6 asymmetric reveal-scar), not random — determinism-free (consumes no RNG stream). ──
  const fissurePath = [
    [-4.2, -2.7], [-2.7, -1.6], [-1.3, -0.5], [0.2, 0.6], [1.6, 1.5], [3.0, 2.3], [4.1, 3.0],
  ];
  const buildFissure = (halfBase, halfMid, z) => {
    const pos = [], idx = []; let vc = 0; const N = fissurePath.length;
    for (let i = 0; i < N - 1; i++) {
      const [ax, ay] = fissurePath[i], [bx, by] = fissurePath[i + 1];
      const ta = i / (N - 1), tb = (i + 1) / (N - 1);
      const wa = halfBase + (halfMid - halfBase) * Math.sin(ta * Math.PI);   // widest mid-span (over the eye)
      const wb = halfBase + (halfMid - halfBase) * Math.sin(tb * Math.PI);
      const dx = bx - ax, dy = by - ay, dl = Math.hypot(dx, dy) || 1;
      const ox = -dy / dl, oy = dx / dl;
      pos.push(ax + ox * wa, ay + oy * wa, z, ax - ox * wa, ay - oy * wa, z,
        bx + ox * wb, by + oy * wb, z, bx - ox * wb, by - oy * wb, z);
      idx.push(vc, vc + 1, vc + 2, vc + 1, vc + 3, vc + 2); vc += 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return g;
  };
  const fissureGlowMat = track(new THREE.MeshBasicMaterial({ color: crackHot, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  fissureGlowMat.toneMapped = false;
  const fissureDarkMat = track(new THREE.MeshBasicMaterial({ color: 0x040302, transparent: true, opacity: 0, depthWrite: false }));
  fissureDarkMat.toneMapped = false;
  const fissureGlow = new THREE.Mesh(buildFissure(0.16, 0.52, EYE_Z + 0.95), fissureGlowMat);   // z 1.35 — a WIDE gold bleed on the black disc (bold at fight distance)
  fissureGlow.name = 'heroFissureGlow';
  const fissureDark = new THREE.Mesh(buildFissure(0.09, 0.30, EYE_Z + 1.05), fissureDarkMat);    // z 1.45 — in FRONT of the eye front-face (~1.3): a BOLD dark split across the sclera
  fissureDark.name = 'heroFissure';
  // A SECOND forked branch off the main fault (a crack SPLINTERS, not one clean line) — a shorter
  // diagonal crossing the eye the other way, so the read is unmistakably "the eye is cracking".
  const branchPath = [[-0.6, 2.4], [-0.2, 1.0], [0.4, -0.2], [1.1, -1.6], [1.8, -2.9]];
  const buildBranch = (hw, z) => {
    const pos = [], idx = []; let vc = 0;
    for (let i = 0; i < branchPath.length - 1; i++) {
      const [ax, ay] = branchPath[i], [bx, by] = branchPath[i + 1];
      const t = 1 - i / (branchPath.length - 1), w = hw * (0.35 + 0.65 * t);   // widest at the root, tapering to the tip
      const dx = bx - ax, dy = by - ay, dl = Math.hypot(dx, dy) || 1, ox = -dy / dl * w, oy = dx / dl * w;
      pos.push(ax + ox, ay + oy, z, ax - ox, ay - oy, z, bx + ox, by + oy, z, bx - ox, by - oy, z);
      idx.push(vc, vc + 1, vc + 2, vc + 1, vc + 3, vc + 2); vc += 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  };
  const branchGlow = new THREE.Mesh(buildBranch(0.34, EYE_Z + 0.95), fissureGlowMat);
  const branchDark = new THREE.Mesh(buildBranch(0.20, EYE_Z + 1.05), fissureDarkMat);
  stage1.add(fissureGlow); stage1.add(fissureDark); stage1.add(branchGlow); stage1.add(branchDark);

  // ── THE SHATTER BACKLIGHT (S1→S2): at the shatter, white light FLOODS from behind the
  // silhouette — ONE bounded additive disc STRICTLY behind the silhouette plane (§2: backlight
  // discs behind the plane are lawful; bloom does the flooding, never a screen-filling plane).
  // Radial vertex-colour falloff (hot core → black rim → no hard edge). Parented to `rig` (not
  // stage1 which collapses, not stage2 which blooms); hidden + opacity-scaled off at rest. ──
  const backSeg = lowQ ? 40 : 72;
  const backPos = [0, 0, 0], backCol = [1, 1, 1], backIdx = [];
  for (let i = 0; i <= backSeg; i++) {
    const a = (i / backSeg) * TAU;
    backPos.push(Math.cos(a) * DISC_R * 1.45, Math.sin(a) * DISC_R * 1.45, 0);
    backCol.push(0, 0, 0);
  }
  for (let i = 1; i <= backSeg; i++) backIdx.push(0, i, i + 1);
  const backGeo = new THREE.BufferGeometry();
  backGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPos, 3));
  backGeo.setAttribute('color', new THREE.Float32BufferAttribute(backCol, 3));
  backGeo.setIndex(backIdx);
  const backMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  backMat.toneMapped = false; backMat.color.setScalar(0);
  const backlight = new THREE.Mesh(backGeo, backMat);
  backlight.name = 'shatterBacklight';
  backlight.position.set(0, 0, -1.2); backlight.visible = false;
  rig.add(backlight);

  // ── THE VOID BACKGLOW MANDORLA (PR-V2): in THE HOLLOW the seraph is a dark silhouette against a
  // near-black sky (no sun rakes its camera-facing front). ONE additive VIOLET disc STRICTLY behind the
  // silhouette plane makes the body read as dark-on-glow — the Radiance inversion: the void itself
  // luminesces faintly around the shadow. Same lawful backlight-disc mechanism as the shatter backlight;
  // radial vertex falloff (violet core → black rim, no hard edge). Opacity driven by voidK; hidden at
  // rest (byte-identical off-void). ~1 draw, tier-cheap. ──
  const vgSeg = lowQ ? 40 : 72;
  const vgPos = [0, 0, 0], vgCol = [0.30, 0.24, 0.56], vgIdx = [];
  for (let i = 0; i <= vgSeg; i++) {
    const a = (i / vgSeg) * TAU;
    vgPos.push(Math.cos(a) * DISC_R * 1.6, Math.sin(a) * DISC_R * 1.6, 0);
    vgCol.push(0, 0, 0);
  }
  for (let i = 1; i <= vgSeg; i++) vgIdx.push(0, i, i + 1);
  const vgGeo = new THREE.BufferGeometry();
  vgGeo.setAttribute('position', new THREE.Float32BufferAttribute(vgPos, 3));
  vgGeo.setAttribute('color', new THREE.Float32BufferAttribute(vgCol, 3));
  vgGeo.setIndex(vgIdx);
  const vgMat = track(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  vgMat.toneMapped = false;
  const voidGlow = new THREE.Mesh(vgGeo, vgMat);
  voidGlow.name = 'voidGlow';
  voidGlow.position.set(0, 0, -1.8); voidGlow.visible = false;
  rig.add(voidGlow);

  // ── THE IGNITE AURA MANDORLA (GODHEAD DETONATION P3): the heaven-side sibling of voidGlow — the
  // seraph catches fire from its own verdict. A radial-falloff disc STRICTLY behind the silhouette
  // plane, white-gold core → gold-rose → S2 VIOLET outer ring → black (owner D2a+ hybrid: gold fire,
  // violet-cold edge), ROILING with outward-scrolling noise (owner §1.3 — the aura is alive from P3,
  // not only once the wisps land). HARD radius cap DISC_R × 1.8 (the void one was shrunk 2.3→1.6 for
  // a headless fill-rate tax — do not regrow it); shipped at ×1.65. Sibling of voidGlow so voidK/
  // igniteK stay independent (+1 draw). Opacity driven by igniteK; hidden at rest (byte-identical). ──
  const igSeg = lowQ ? 40 : 72, IG_R = DISC_R * 1.65;
  const igPos = [0, 0, 0], igR = [0], igPh = [0], igIdx = [];   // aR = radial 0..1 · aPh = rim angle (roil phase)
  for (let i = 0; i <= igSeg; i++) {
    const a = (i / igSeg) * TAU;
    igPos.push(Math.cos(a) * IG_R, Math.sin(a) * IG_R, 0); igR.push(1); igPh.push(a);
  }
  for (let i = 1; i <= igSeg; i++) igIdx.push(0, i, i + 1);
  const igGeo = new THREE.BufferGeometry();
  igGeo.setAttribute('position', new THREE.Float32BufferAttribute(igPos, 3));
  igGeo.setAttribute('aR', new THREE.Float32BufferAttribute(igR, 1));
  igGeo.setAttribute('aPh', new THREE.Float32BufferAttribute(igPh, 1));
  igGeo.setIndex(igIdx);
  const igMat = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `
      attribute float aR; attribute float aPh;
      varying float vR; varying float vPh;
      void main(){ vR = aR; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uOpacity;
      varying float vR; varying float vPh;
      void main(){
        vec3 cCore = vec3(1.00, 0.94, 0.78);   // white-gold heart
        vec3 cMid  = vec3(0.85, 0.54, 0.39);   // gold-rose (the nebula key)
        vec3 cRim  = vec3(0.42, 0.36, 0.66);   // S2 void-violet outer ring (the cold edge)
        vec3 col = vR < 0.5 ? mix(cCore, cMid, vR / 0.5) : mix(cMid, cRim, (vR - 0.5) / 0.5);
        float ang = sin(vPh) * 3.0 + sin(2.0 * vPh + 1.3) * 2.0;   // seam-continuous angular variation
        float roil = 0.65 + 0.35 * sin(vR * 10.0 - uTime * 2.0 + ang);   // flame tongues scroll OUTWARD, forever
        float falloff = pow(max(0.0, 1.0 - vR), 1.4);   // soft to black at the rim (no hard edge)
        gl_FragColor = vec4(col * falloff * roil * uOpacity, 1.0);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  igMat.toneMapped = false;
  const igniteGlow = new THREE.Mesh(igGeo, igMat);
  igniteGlow.name = 'igniteGlow';
  igniteGlow.position.set(0, 0, -1.9); igniteGlow.visible = false;   // just behind voidGlow, behind the silhouette plane
  igniteGlow.layers.set(1);   // out of the god-ray occlusion mask (gotcha 1): unlike voidGlow, the ignite aura runs in the HEAVEN where the rays SWELL — a layer-0 additive disc would punch a hole in them. Also out of the water mirror.
  rig.add(igniteGlow);

  // ── THE LIVING WISPS (GODHEAD DETONATION P5, owner §1.3): ~14 small tapered flame-tongues licking
  // off the crown + upper-wing perimeter, IN FRONT of the silhouette plane, merged to ONE additive
  // draw, vertex-faded to black at every edge/tip (no hard rim). Continuously animated — scrolling
  // tendrils + a SLOW per-wisp flicker (living flame, never a strobe), gold-rose → violet tip. Placed
  // on the UPPER arc only (crown + wingtips) — never the down/corridor column. Gated on igniteK (rises
  // with the wreath). Layer 1 (additive in the heaven — out of the ray mask + mirror). ──
  const WISP_N = 14, WISP_RB = DISC_R * 1.28;
  const wPos = [], wCol = [], wUv = [], wPh = [];
  const wpush = (p, c, u, ph) => { wPos.push(p[0], p[1], p[2]); wCol.push(c[0], c[1], c[2]); wUv.push(u[0], u[1]); wPh.push(ph); };
  const W_GOLD = [1.0, 0.62, 0.42], W_VIO = [0.46, 0.38, 0.64];   // gold-rose base → S2 violet tip
  const wgrad = (t) => [W_GOLD[0] + (W_VIO[0] - W_GOLD[0]) * t, W_GOLD[1] + (W_VIO[1] - W_GOLD[1]) * t, W_GOLD[2] + (W_VIO[2] - W_GOLD[2]) * t];
  for (let i = 0; i < WISP_N; i++) {
    const a = Math.PI * (0.03 + 0.94 * (i / (WISP_N - 1)));       // upper arc 5°→175° (right wingtip → crown → left wingtip)
    const wob = 0.10 * Math.sin(i * 2.7);                          // slight per-wisp lean (deterministic)
    const dir = a + wob, len = DISC_R * (0.5 + 0.32 * (0.5 + 0.5 * Math.sin(i * 2.3)));
    const ex = Math.cos(dir), ey = Math.sin(dir), nx = Math.cos(dir + Math.PI / 2), ny = Math.sin(dir + Math.PI / 2);
    const bx = Math.cos(a) * WISP_RB, by = Math.sin(a) * WISP_RB, ph = i * 1.7;
    const SEG = 3, W0 = DISC_R * 0.085;
    for (let j = 0; j < SEG; j++) {
      const t0 = j / SEG, t1 = (j + 1) / SEG;
      const r0 = t0 * len, r1 = t1 * len, w0 = W0 * (1 - t0), w1 = W0 * (1 - t1);
      const c0 = wgrad(t0), c1 = wgrad(t1);
      const L0 = [bx + ex * r0 + nx * w0, by + ey * r0 + ny * w0, 0.2], R0 = [bx + ex * r0 - nx * w0, by + ey * r0 - ny * w0, 0.2];
      const L1 = [bx + ex * r1 + nx * w1, by + ey * r1 + ny * w1, 0.2], R1 = [bx + ex * r1 - nx * w1, by + ey * r1 - ny * w1, 0.2];
      wpush(L0, c0, [t0, 0], ph); wpush(R0, c0, [t0, 1], ph); wpush(R1, c1, [t1, 1], ph);
      wpush(L0, c0, [t0, 0], ph); wpush(R1, c1, [t1, 1], ph); wpush(L1, c1, [t1, 0], ph);
    }
  }
  const wGeo = new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
  wGeo.setAttribute('aCol', new THREE.Float32BufferAttribute(wCol, 3));
  wGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wUv, 2));
  wGeo.setAttribute('aPh', new THREE.Float32BufferAttribute(wPh, 1));
  const wMat = track(new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `
      attribute vec3 aCol; attribute float aPh;
      varying vec3 vCol; varying vec2 vUv; varying float vPh;
      void main(){ vCol = aCol; vUv = uv; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uOpacity;
      varying vec3 vCol; varying vec2 vUv; varying float vPh;
      void main(){
        float t = vUv.x;
        float prof = smoothstep(0.0, 0.18, t) * pow(max(0.0, 1.0 - t), 0.7);   // emerges from the wing, dies to black at the tip
        float edge = pow(max(0.0, 1.0 - abs(2.0 * vUv.y - 1.0)), 1.2);          // soft sides (clamp: no NaN at the edge)
        float flow = 0.5 + 0.5 * sin(t * 12.0 - uTime * 3.0 + vPh);            // tendril scrolls outward
        float flick = 0.72 + 0.28 * sin(uTime * 0.8 + vPh * 2.3);              // SLOW flicker, never a strobe
        gl_FragColor = vec4(vCol * prof * edge * flow * flick * uOpacity, 1.0);
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  wMat.toneMapped = false;
  const wisps = new THREE.Mesh(wGeo, wMat);
  wisps.name = 'igniteWisps';
  wisps.frustumCulled = false; wisps.visible = false;
  wisps.layers.set(1);   // additive in the heaven — out of the ray mask + water mirror
  rig.add(wisps);

  // ── SHATTER SHARDS (S1→S2): a dozen dark disc-fragments fling radially in-plane at the
  // shatter, silhouetted against the backlight (opaque near-black → overdraw-free, unlike an
  // additive chip). Parented to `rig`; a PRIVATE seed keeps the main `rnd` stream untouched (the
  // seraph stays byte-identical). Driven as a pure function of the morph in setStageMorph. ──
  const shrnd = mulberry32(0x51a2d0f);
  const NSHARD = lowQ ? 10 : 16;
  const shardMat = track(new THREE.MeshStandardMaterial({ color: 0x060507, roughness: 1.0, metalness: 0.0, flatShading: true }));
  const shardGeo = stripForMerge(new THREE.TetrahedronGeometry(0.82, 0));
  const shards = [];
  for (let i = 0; i < NSHARD; i++) {
    const sh = new THREE.Mesh(shardGeo, shardMat);
    sh.visible = false;
    sh.userData = { ang: (i / NSHARD) * TAU + (shrnd() - 0.5) * 0.4, spin: (shrnd() - 0.5) * 6, dist: 6 + shrnd() * 6, r0: 0.8 + shrnd() * 1.4, s0: 0.6 + shrnd() * 0.7 };
    rig.add(sh);
    shards.push(sh);
  }

  // ── THE EYE — a BIG HDR white almond that DOMINATES the disc (~0.77× disc diameter,
  // wider than the 26u lane, §5j). Named `focalEye`. The black disc is its rim. White-
  // hot, toneMapped=false ×HOT so it blooms. ──
  const EYE_HOT = 1.7;   // bright + blooms, but NOT fully blown — so the dark iris reads against it
  const EYE_BASE = new THREE.Color(0xfff4e6);
  const A_HALF_W = DISC_R * 0.77;                 // almond half-width target sets the read
  const ALMOND = [A_HALF_W / 2.4, (DISC_R * 0.45) / 2.4, 0.9 / 2.4];   // scale on a base r=2.4 sphere
  const almondSeg = lowQ ? [16, 12] : [26, 16];
  const eyeMat = track(new THREE.MeshBasicMaterial({ color: 0xfff4e6 }));
  eyeMat.toneMapped = false;
  eyeMat.color.copy(EYE_BASE).multiplyScalar(EYE_HOT);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(2.4, almondSeg[0], almondSeg[1]), eyeMat);
  eye.name = 'focalEye';
  eye.scale.set(...ALMOND);
  eye.position.set(0, 0, EYE_Z);
  stage1.add(eye);
  const A_W = 2.4 * ALMOND[0];                    // almond half-width in world units (~3.6)
  const A_H = 2.4 * ALMOND[1];                    // almond half-height (~2.1)

  // The dark IRIS/pupil — a prominent dark disc on the white sclera that TRACKS within
  // the almond, so the player's stick visibly drags the gaze (the §5j "Don't Move" beat).
  // The dark-in-brightness focal: the eye reads as a real eye (white sclera, dark pupil).
  const seedMat = track(new THREE.MeshBasicMaterial({ color: 0x040302 }));   // near-black: reads unambiguously on the bright sclera (owner-review polish #3)
  seedMat.toneMapped = false;
  const SEED_R = 0.95;
  const seed = new THREE.Mesh(new THREE.SphereGeometry(SEED_R, lowQ ? 14 : 20, 14), seedMat);
  seed.name = 'pupilSeed';
  seed.scale.set(1, 1, 0.4);
  seed.position.set(0, 0, EYE_Z + 0.5);
  stage1.add(seed);

  // ── THE HEAVY HOODED LID — ONE thick brow-dome with MASS (extruded + bevelled), a
  // dim gold LASH-LINE along its curved lower margin (organic curve, never a level
  // chord). Hinged near the almond TOP (`lidPivot`); peels back on aperture but ALWAYS
  // keeps a hood over the eye (the ancient heavy-lidded read). It OVERLAPS/occludes the
  // almond, never outlines it (a closed loop = the framed-icon read, forbidden). ──
  const lidMat = track(new THREE.MeshStandardMaterial({
    color: 0x0b0a0c, emissive: 0x000000, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));
  // ONE heavy upper hood (a thick brow-dome), authored almond-centred. Its lower margin
  // (lash) is a gentle ⌒ (bow UP at centre) so the visible eye-opening below it is an
  // ALMOND, not a smile. It SLIDES vertically on `lidPivot` (a real upper eyelid): DOWN
  // covers the eye (heavy-lidded), UP peels it open — far more predictable than a hinge,
  // and it never sweeps like a frame edge. Corners sit at the almond canthi (eye corners).
  const HOOD_HW = A_W * 1.0;
  const HOOD_LASH_CTRL = A_H * 0.35;         // lash ⌒ (deeper curve — a clear almond, never a level line). Owner-review polish #2.
  const hoodShape = () => {
    const s = new THREE.Shape();
    s.moveTo(-HOOD_HW, 0);
    s.quadraticCurveTo(0, A_H * 2.0, HOOD_HW, 0);          // brow: a heavy dome up to ~the almond top
    s.quadraticCurveTo(0, HOOD_LASH_CTRL, -HOOD_HW, 0);    // lash: gentle ⌒ (curved, never a level chord)
    s.closePath();
    return s;
  };
  const hoodGeo = stripForMerge(new THREE.ExtrudeGeometry(hoodShape(), {
    depth: 0.6, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 1, steps: 1, curveSegments: lowQ ? 8 : 14,
  }));
  hoodGeo.translate(0, 0, -0.3);
  const lidPivot = new THREE.Object3D();
  lidPivot.position.set(0, 0, LID_Z);
  lidPivot.name = 'lidPivot';
  const hood = new THREE.Mesh(hoodGeo, lidMat);
  lidPivot.add(hood);
  stage1.add(lidPivot);
  const SLIDE_MAX = 2.0;                      // full-open slide (brow stays inside the disc rim)

  // The gold LASH-LINE: a dim additive curve tracing the hood's lower margin (rides the
  // hood so it reads as the lid's lit edge, the one organic line). Sampled off the lash.
  const lashPts = [];
  {
    const N = lowQ ? 14 : 22;
    const p0x = HOOD_HW, p0y = 0, cpx = 0, cpy = HOOD_LASH_CTRL, p1x = -HOOD_HW, p1y = 0;
    for (let i = 0; i <= N; i++) {
      const t = i / N, it = 1 - t;
      const x = it * it * p0x + 2 * it * t * cpx + t * t * p1x;
      const y = it * it * p0y + 2 * it * t * cpy + t * t * p1y;
      lashPts.push(x, y, 0.4);
    }
  }
  const lashGeo = new THREE.BufferGeometry();
  lashGeo.setAttribute('position', new THREE.Float32BufferAttribute(lashPts, 3));
  const lashMat = track(new THREE.LineBasicMaterial({
    color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  lashMat.toneMapped = false;
  const lash = new THREE.Line(lashGeo, lashMat);
  lash.name = 'lashLine';
  lidPivot.add(lash);

  // aperture 0 = hood fully down (near-shut), 1 = peeled back (a hood always remains).
  // aperture → the hood's vertical SLIDE: low = slid down (heavy-lidded), high = slid up (open).
  const lidSlide = (aperture) => Math.max(-0.4, Math.min(SLIDE_MAX, aperture * 2.3 - 0.3));

  // ── ATTENDANT MOTES — dim dark satellites (§3 law 8) + the orbiter contract (≥2). ──
  const orbiters = [];
  const moteN = lowQ ? 2 : 3;
  const moteMat = track(new THREE.MeshStandardMaterial({
    color: 0x080705, emissive: accent, emissiveIntensity: 0.05, roughness: 1.0, metalness: 0.0, flatShading: true,
  }));
  const moteGeo = stripForMerge(new THREE.IcosahedronGeometry(0.12, 0));
  for (let i = 0; i < moteN; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { ang: (i / moteN) * TAU, radius: DISC_R * (1.08 + rnd() * 0.16), speed: 0.13 + rnd() * 0.1, baseY: (rnd() - 0.5) * 2.2, tilt: rnd() * TAU };
    stage1.add(m);
    orbiters.push(m);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 — THE SERAPH (the hero stage). SIX dark feathered wings in a VERTICAL
  // BILATERAL FAN (a pointed mandorla), COVERED IN EYES, roots converging on ONE great
  // central eye. NOT the retired Ophanim wheels (no rings/spokes/rotation): feathers,
  // bilateral pairs, breathing not spinning. Built as a sibling sub-rig, hidden by
  // default; the CP2 stage system dissolve-swaps to it. Anti-reads: NOT gear/chandelier
  // (no closed ring but the faint gold HALO behind), NOT bird (open top+bottom notch, no
  // beak/tail), NOT Ashtalon×3 (NO ember — gold only; feathers not scythes; 6 still wings
  // vs 2 hunting). The eyes are the ONLY emissive family; feathers paint VALUE, not light.
  // ══════════════════════════════════════════════════════════════════════════
  const stage2 = new THREE.Group();
  stage2.name = 'stage2Rig';
  stage2.visible = false;
  rig.add(stage2);

  const mergeParts = (parts, label) => {
    const g = mergeGeometries(parts, false);
    if (!g) throw new Error(`buildUnmasked: ${label} mergeGeometries returned null (attribute mismatch)`);
    return g;
  };

  // ── FEATHER MATERIALS — a near-black VALUE LADDER + a painted moon-rim (Fable polish pass). ──
  // The eight wings share one flat near-black material read as ONE blob on the night sky (the
  // z-stagger was invisible). Fix: a per-wing base VALUE LADDER — the nearest/upper wing a step
  // lighter, the deepest a step darker (atmospheric depth faked in value) — so the shingled fan
  // reads. And a PAINTED MOON-RIM: the flight feathers (outer fan / leading edge) get a lighter
  // cool-steel value so the near-black silhouette + feather separation read on a dark sky, WITHOUT
  // a real back-light (which can't rim a flat card facing the camera). Interiors stay near-black →
  // no ominousness lost; the eyes are still the only emissive family. All tracked for dissolve.
  // BOSS-VISUAL-AUDIT (dual-judge consensus): the wings still read as flat slate-blue PLANKS at
  // the fight frame — value a step too light + one flat value per feather. Two coupled fixes:
  // (1) the ladder is pulled ~15% darker and DE-BLUED toward neutral char (the registry near-black
  // law — the blue tint read plastic under the night hemisphere light); (2) vertexColors on, so the
  // angelWing valueBand ramp (root-dark → tip-lit per feather) multiplies in — every feather draws
  // its own gradient and the fan stops reading as cut card. Ranks stay distinct via the ladder.
  // OWNER PLAYTEST FIX (the "still-black wing roots + black bumpy covert mass"): the wing INTERIOR
  // (coverts/arm/under-lens = the baseMat) rendered as pure VOID under the dark boss-fight light —
  // the covert faces angle away from the sun and receive almost no light, so a near-black DIFFUSE
  // (even ×1.4 warm-lifted by the valueBand) crushes to 0. Diffuse tints CANNOT lift a shadow;
  // only EMISSIVE adds regardless of light (L105 — dark PBR bodies die in bloom/ACES without an
  // emissive floor). Fix: a warm-slate emissive FLOOR on the covert ladder so the inner wing reads
  // as dark FEATHERED MASS (luma ~30), never a black hole — still near-black, still ominous, still
  // well under the eye + the G2 dark-body cap. The ladder albedo is nudged up a hair to match.
  const LADDER = { upper: 0x44434c, uppermid: 0x3e3d47, upmid: 0x3e3d47, middle: 0x37353f, lowermid: 0x312f39, lower: 0x2c2b35 };
  const baseMats = {};
  for (const k of Object.keys(LADDER)) baseMats[k] = track(new THREE.MeshStandardMaterial({ color: LADDER[k], emissive: 0x2b2531, emissiveIntensity: 0.85, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide, vertexColors: true }));
  const rimMat = track(new THREE.MeshStandardMaterial({ color: 0x545b66, emissive: 0x20242c, emissiveIntensity: 0.5, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide, vertexColors: true }));   // cool moonlit steel — the leading-edge rim (+ a small floor so back-angled flight feathers never crush)
  const rimMatB = track(new THREE.MeshStandardMaterial({ color: 0x40454f, emissive: 0x1e222a, emissiveIntensity: 0.5, roughness: 0.98, metalness: 0.0, side: THREE.DoubleSide, vertexColors: true }));  // a step DARKER — the alternate primary + secondary rank, so the outer fan reads as separate fingers (Fable P5, interior feather-rank shading)
  // The gold RACHIS quill-shafts on the leading primaries (angelWing rachisMaterial): a DRAWN
  // line, not a light source — plain tone-mapped gold (never blooms, T7-safe), dim enough that
  // the eyes stay the only emissive family while the shafts etch the fan's structure in the dark.
  const rachisMat = track(new THREE.MeshBasicMaterial({ color: 0x6e5a2c, side: THREE.DoubleSide }));   // dimmed (art-director #4) — a quiet drawn quill, not a bright spoke

  // ── THE CENTRAL STARBURST is RESERVED FOR STAGE 3 (owner: "use this type of eye for the third
  // form"). Stage 2 goes back to the ORIGINAL focal almond eye (below) — no radiant star here.
  // The small-almond + gold-starburst "star-eye" belongs to the unveiling (S3), not this form. ──

  // ── ~20 TRACKING EYES — THE IDENTITY ("a thing covered in eyes") + the screenshot.
  // THE L142 REAL-EYE RECIPE (the bulb killer): CONTRAST, not brightness. Every prior
  // pass made these emissive white orbs that bloomed into fairy-lights with no pupil.
  // The fix, seated strictly PROUD front-to-back per eye:
  //   recessed dark SOCKET (0x030302) → flattened DIM SCLERA (0x4a4436, ×1.0 TONE-MAPPED,
  //   never blooms) → thin dim dark-gold IRIS → BIG DARK PUPIL (0x040302, ~0.7×size radius,
  //   ~60% of sclera width) → a TINY white CATCHLIGHT (×7, toneMapped=false — the ONLY hot
  //   pixel in the whole eye), offset up-left, proudest.
  // Statics merge per material (4 draws total); pupils stay separate (they track, with
  // independent per-eye lag + a small resting bias so the field reads as living eyes that
  // look every which way — until the all-snap zeroes them to the player, CP2). ──
  // The eyes read as EYES, not grommets, via CONTRAST: a PALE bone sclera (the lightest
  // value on the body besides catchlights — tone-mapped, matte, never a bloom) around a
  // GOLD iris ring around a distinct DARK pupil, thin dark socket for depth, a proud white
  // catchlight. The stranger test read the old dark-rim + dark-pupil as a metal ring with a
  // hole; a pale eyeball with a gold iris and a smaller pupil reads unmistakably as an eye.
  const socketMat = track(new THREE.MeshBasicMaterial({ color: 0x050403 }));   // thin recessed rim (eyelid shadow)
  const s2scleraMat = track(new THREE.MeshBasicMaterial({ color: 0x8f8365 })); // eyeball value: light enough to frame the pupil, dim enough NOT to bloom (tone-mapped)
  const irisMat = track(new THREE.MeshBasicMaterial({ color: 0x7a5c26 }));      // GOLD iris (lifted so it survives fight distance + rhymes with the focal eye → sets up S3)
  const s2pupilMat = track(new THREE.MeshBasicMaterial({ color: 0x040302 }));   // DARK pupil (smaller — the eyeball shows around it)
  s2pupilMat.toneMapped = false;
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xfff6e6 }));     // a small proud glint (NOT a headlight — a hair over white so it reads wet without blooming)
  catchMat.toneMapped = false;
  catchMat.color.multiplyScalar(2.4);
  const sockets = [], sclerae = [], irises = [], catchlights = [], pupils = [];
  const eyePlace = (local, size, lid = 0) => {
    // HALF-LID = a SQUINT, not a cap. A dark lid-cap on a dark feather just read as a floating
    // blob (no "skin" behind it to be the lid). Instead a lidded eye is a FLATTER eyeball — the
    // whole eye (sclera/iris/pupil) squashes vertically by `openF` — which reads as heavy-lidded
    // without any added geometry. lid 0 → openF 1 → the full round eye, unchanged.
    const openF = 1 - lid * 0.85;
    // socket (thin recessed rim, pushed back — just enough to seat the eye). Lean segment
    // counts: the eyes are small at fight distance + there are ~20 of them (tri budget).
    const sk = new THREE.SphereGeometry(size * 1.1, lowQ ? 6 : 9, lowQ ? 4 : 6);
    sk.scale(1.2, 0.96 * openF, 0.34); sk.translate(local.x, local.y, local.z - size * 0.22);
    sockets.push(stripForMerge(sk));
    // sclera (flattened PALE eyeball)
    const sc = new THREE.SphereGeometry(size, lowQ ? 7 : 10, lowQ ? 5 : 7);
    sc.scale(1.4, 0.72 * openF, 0.42); sc.translate(local.x, local.y, local.z);   // wider + flatter → an ALMOND/lens; openF squints a lidded eye
    sclerae.push(stripForMerge(sc));
    // iris (a gold ring showing around the pupil, on the pale sclera) — widened so the gold
    // survives fight distance (Fable: the wing eyes read as bone-almonds with a black dot).
    const ir = new THREE.CircleGeometry(size * 0.66, lowQ ? 9 : 13);
    ir.scale(1, openF, 1); ir.translate(local.x, local.y, local.z + size * 0.3);
    irises.push(stripForMerge(ir));
    // catchlight (small proud glint, up-left) — sits where the pupil rests at the snap
    const cl = new THREE.SphereGeometry(size * 0.1, 5, 4);
    cl.translate(local.x - size * 0.28, local.y + size * 0.32 * openF, local.z + size * 0.6);
    catchlights.push(stripForMerge(cl));
    // pupil (tracks; smaller so the eyeball reads around it — not a hole)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(size * 0.5, lowQ ? 6 : 8, lowQ ? 5 : 6), s2pupilMat);
    pupil.scale.set(1, openF, 0.55);
    const bx = (rnd() - 0.5) * 0.55, by = (rnd() - 0.5) * 0.45;
    pupil.userData = { base: local.clone(), size, biasX: bx, biasY: by, lag: 0.2 + rnd() * 0.6, gx: bx, gy: by, openF };
    pupil.position.set(local.x + bx * size * 0.4, local.y + by * size * 0.4 * openF, local.z + size * 0.62);
    stage2.add(pupil);
    pupils.push(pupil);
  };
  // ── THE SIX WINGS — three MIRROR PAIRS of the owner's merged angel wing (buildAngelWing),
  // rooted near the central eye: UPPER pair swept UP, MIDDLE pair swept OUT (largest), LOWER
  // pair swept DOWN — the canonical seraph six (§5b/§5d). BILATERAL mirror via scale.x=-1,
  // NEVER radial (a radial ring read as a wheel — the original failure). The wing is built in
  // its own XY plane sweeping up-and-out; each pair's shoulder pivot rotates it to its sweep
  // and roots it beside the eye. ──
  // EMBLEM ARRANGEMENT (A/B variant, owner ref IMG_7411): all six wings EMANATE FROM ONE small
  // central HUB (0,0) — three mirror pairs fanning out: UPPER up (tallest), MIDDLE out (widest),
  // LOWER down-and-out. Big + overlapping → a dense heart/mandorla filling the frame. Bilateral
  // mirror (scale.x flip). The old spider read is avoided by a TINY central jewel-eye (not a
  // body) + dense overlap, not by banning the hub. Each pair carries its root-eye ring position.
  // FIVE pairs (10 wings) for a DENSE mandorla — the first palm-tree read came from FOUR
  // sickles fanned as spokes with a wide (~0.9 rad) angular gap between the middle and the
  // drooping lower pair. TWO fill pairs (uppermid + lowermid) close those gaps so the wings
  // OVERLAP into ONE cohesive heart, not a radial star. Angular spacing tightened to ~0.5 rad
  // and the lower pair un-drooped (−0.95, not −1.55) so the bottom of the mandorla is FULL,
  // not a thin droop. Scale bumped so adjacent wings overlap; z compressed for a flat shingled
  // emblem. Root eyes only on the three canonical pairs (upper/middle/lower) → 6 root + 1
  // central = 7 eyes clustered tight at the core (the two fill pairs carry no eye).
  // ── BILATERAL 4-WINGS-PER-SIDE (8 total), a MIRRORED CARD-FAN — NOT a radial rosette (owner
  // r-spec). Each side is a hand of four wings graduated from near-vertical to drooping-down,
  // ALL rooted inside ONE tight central knot (radius ≈1 vs a ≈10-unit wingspan). Feather
  // outbound direction φ (from horizontal, +=up) ≈ 60° + rotZ·57°:
  //   wing 1 (upper)  φ≈78°  — longest, curling outboard at the tip
  //   wing 2 (upmid)  φ≈45°  — slightly shorter
  //   wing 3 (middle) φ≈12°  — shorter still
  //   wing 4 (lower)  φ≈−20° — droops down-and-out, shortest
  // ROOTS march up a short vertical shoulder-stack inside the knot (`off`: wing 4 lowest → wing 1
  // highest, all within radius ~1), so they don't pin to one pixel but stay a tight knot — the
  // knot is the body. Z-STAGGER ~0.15/wing (`z`): the upper wing is NEAREST, each overlaps and
  // occludes the one below → reads LAYERED, not flat-splayed. Mirror the whole side via scale.x
  // flip (left tips up-left, right tips up-right). ONE root eye per wing (`rootEye`), placed just
  // OUTBOARD of the knot on the wing membrane (marching up the fan, NOT pooled at the bottom).
  // FAN ROTATED ~18° OUTWARD about the hub (owner r-spec): the right side clockwise, the left
  // mirrors it — so a clear VERTICAL CHANNEL of empty space runs up the top-centre AND down the
  // bottom-centre, with the star-hub sitting ALONE in that channel. Acceptance rule enforced by
  // the outbound directions φ (≈ 60° + rotZ·57°): topmost φ≈60° (leans AWAY from vertical, ≥15°
  // clear of straight-up), lowest φ≈−38° (out-and-down, ≥40° clear of straight-down — never
  // straight down across the centreline). Every wing stays in its own side's hemisphere (shoulder
  // x>0), biased up-and-out; the shoulder-stack is pushed outboard (x≈0.45) to widen the channel.
  const WING_PAIRS = [
    { key: 'upper',  rotZ: -0.12, scale: 1.72, z: -0.20, phase: 0.0, amp: 0.026, off: { x: 0.45, y: 0.35 } },  // slid DOWN a touch — the top pair sat a bit high vs the others (owner)
    { key: 'upmid',  rotZ: -0.57, scale: 1.52, z: -0.35, phase: 0.7, amp: 0.030, off: { x: 0.45, y: 0.26 } },  // φ≈27°
    { key: 'middle', rotZ: -0.88, scale: 1.32, z: -0.50, phase: 1.4, amp: 0.036, off: { x: 0.45, y: 0.02 } }, // out, ~horizontal — lifted so it stays DISTINCT from the lowest wing
    { key: 'lower',  rotZ: -1.20, scale: 1.12, z: -0.65, phase: 2.1, amp: 0.030, off: { x: 0.48, y: -0.42 } },// out-and-slightly-down (~−25°) — the distinct lowest wing (original angle; water clearance is solved by boss height / water level, NOT by tucking the angle — owner)
  ];
  // CHARGE MANTLE-FLARE sign per wing (right-side convention; ×side in the tick mirrors it): on
  // charge the fan OPENS — the upper pair lifts toward vertical (+), the lower pair sweeps
  // down-and-out (−), the middle holds — so the mandorla WIDENS as the wrath gathers, then
  // settles back at rest (charge 0 → zero flare → the signed-off idle is byte-identical).
  const FLARE_SIGN = { upper: 1.0, upmid: 0.45, middle: -0.3, lower: -1.0 };   // original — the fan OPENS on charge/mantle (upper lifts, lower sweeps down-and-out)
  // S1→S2 UNFURL: the seraph blooms from a folded BUD — all wings swept near-vertical + stacked —
  // and cascades open (upper first → lower last) with a small overshoot-settle. foldZ is the delta
  // from each wing's shipped angle to the tight bud angle (near-vertical for its side); foldOrder
  // sequences the cascade. At unfurlK=1 every wing returns to baseRotZ exactly (byte-identical idle).
  const FOLD_ORDER = { upper: 0, upmid: 1, middle: 2, lower: 3 };
  const shoulders = [];
  // DE-CLUMP: no two eye SCLERAS may overlap at front-on (a figure-8 / double-pupil blob reads
  // as a rendering bug). Nudge each new eye out of any earlier eye it overlaps IN THE SAME
  // Z-BAND (eyes at clearly different depths may overlap — they read as stacked, not fused).
  const placedEyes = [];
  const declump = (pos, r) => {
    for (let it = 0; it < 8; it++) {
      let moved = false;
      for (const p of placedEyes) {
        if (Math.abs(pos.z - p.z) > 0.55) continue;
        const dx = pos.x - p.x, dy = pos.y - p.y;
        const d = Math.hypot(dx, dy), min = (r + p.r) * 1.08;
        if (d < min) {
          const push = (min - d) + 0.04;
          const nx = d > 1e-3 ? dx / d : 1, ny = d > 1e-3 ? dy / d : 0.3;
          pos.x += nx * push; pos.y += ny * push; moved = true;
        }
      }
      if (!moved) break;
    }
    placedEyes.push({ x: pos.x, y: pos.y, z: pos.z, r });
    return pos;
  };
  for (const P of WING_PAIRS) {
    for (const side of [1, -1]) {
      const pivot = new THREE.Object3D();
      pivot.name = `wing_${P.key}_${side > 0 ? 'R' : 'L'}`;
      // THE ONE SCAR WING (§3.6): the lower-LEFT hangs a touch off its mirror.
      const scar = (P.key === 'lower' && side < 0) ? 0.09 : 0;
      const baseRotZ = (side > 0 ? P.rotZ : -P.rotZ) + (side < 0 ? scar : 0);
      pivot.rotation.z = baseRotZ;
      pivot.scale.set(side > 0 ? P.scale : -P.scale, P.scale, P.scale);   // bilateral mirror (scale.x flip)
      pivot.position.set(side > 0 ? P.off.x : -P.off.x, P.off.y, P.z);   // shoulder on a small central RING → open core
      // Wings at REDUCED quality (×6 full-detail wings blow the tri budget). ×0.45 scales the
      // feather curve segments down (and with boss quality → q0.5 halves again).
      pivot.add(buildAngelWing({ quality: quality * 0.40, material: baseMats[P.key] || baseMats.middle, rimMaterial: rimMat, rimMaterialB: rimMatB, blade: 0.78, merge: WING_MERGE, valueBand: 1, rachisMaterial: rachisMat, shape: { primBow: 1.35, armBow: 0.2, elbow: 0.45 }, debugParts: WING_DEBUG_PARTS }).group);   // per-wing value ladder + moon-rim + per-feather band + rachis; CURVED quills+arm (art-director #4 — bows the covert column so its edges stop reading as straight radial bars); merge = 13 draws/wing → ~3
      stage2.add(pivot);
      pivot.updateMatrix();
      shoulders.push({ obj: pivot, baseRotZ, phase: P.phase + (side < 0 ? 0.6 : 0), amp: P.amp, flareZ: side * (FLARE_SIGN[P.key] || 0),
        foldZ: (side > 0 ? 0.12 : -0.12) - baseRotZ, foldOrder: FOLD_ORDER[P.key] ?? 2 });   // bud = near-vertical (±0.12); delta from the shipped splay
      // ONE small almond eye per wing — 4 per side, 8 total (+ central = 9). Seated OUT at the
      // wing's ELBOW / where the primary fan starts (on the leading edge) — NOT pooled at the
      // central root cord (owner r-fix). The wing-local elbow point is pushed through THIS wing's
      // own transform (scale → rotate → offset) so each eye rides its own wing out to the elbow.
      // A couple are half-lidded (the upmid pair + the lower-left) so the field varies.
      {
        const ELx = 0.7, ELy = 3.5;                                   // wing-local: the wrist/elbow, base of the primary fan
        const sx = (side > 0 ? P.scale : -P.scale) * ELx, sy = P.scale * ELy;
        const c = Math.cos(baseRotZ), s = Math.sin(baseRotZ);
        const p = new THREE.Vector3(
          (side > 0 ? P.off.x : -P.off.x) + c * sx - s * sy,
          P.off.y + s * sx + c * sy,
          0.7,
        );
        declump(p, 0.40);
        const lid = (P.key === 'upmid') ? 0.42 : (P.key === 'lower' && side < 0) ? 0.32 : 0;
        eyePlace(p, 0.28, lid);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2 LANCE ORGANS (rung 14) — SIX CURATED WATCHER EYES + FIVE RELICS + wingRoots.
  // §lance CP1: the eight VISIBLE wing eyes sit at the wing ELBOWS (wing-local (0.7,3.5)),
  // which at scale 2.4 land OUT of the comfort lane (upper pair world-Y ~28; lower/middle
  // |x|>10.4 even at zero sway) — the ONEWING out-of-lane trap across a whole organ family.
  // The fix is AUTHORING, not curation: six NEW inner-covert eyes at comfort-legal stage2-local
  // seeds (three mirror pairs), parented to `stage2` DIRECTLY (not the wing pivots — a pivot child
  // would drift off its eye under the breath/mantle-flare). Verified world worst-case (station
  // sway ±5.2, roll-wobble y→x coupling): |x|≤~9.5, y 11.4..19.3 — all inside 10.4 / 22. They ride
  // the all-snap for free (eyePlace registers each pupil in `pupils[]`). ──
  const wingEyeSeeds = [
    { x: 1.57, y: 2.27, lid: 0.0 },   // upper pair
    { x: 1.72, y: 0.56, lid: 0.0 },   // middle pair
    { x: 1.65, y: -0.33, lid: 0.30 }, // lower pair (a squint — the field varies)
  ];
  const wingEyeAnchors = [];
  let weN = 0;
  for (const seed of wingEyeSeeds) {
    for (const side of [1, -1]) {
      const p = new THREE.Vector3(side * seed.x, seed.y, 0.72);   // just proud of the wing membrane (z≈0.7 like the elbow eyes)
      eyePlace(p, 0.30, seed.lid);   // a curated watcher eye — a hair larger than the elbow eyes so the six read
      const a = new THREE.Object3D();
      a.name = `wingEye${weN}`;
      a.position.copy(p);
      stage2.add(a);
      wingEyeAnchors.push(a);
      weN++;
    }
  }

  // ── THE FIVE RELICS — every earlier scar worn as a trophy, wired at the reliquary knot below
  // the great eye (the KARNVOW trophy lesson; §5b row 14 "every prior scar worn as a relic").
  // Small dark trophies with the SOURCE boss's palette in emissive only (§3 law 8 — satellites
  // stay dark; the palette is the attribution, not a bulb). They are comfort-trivial (clustered at
  // stage2-local |x|≤1.8, y∈[−1.9,−0.2] → world well inside the lane). Paintable lockParts (phase
  // [1]); branding one flashes its palette (setBrandedRelics / the RECKONING). Their names ARE the
  // partWorldPos anchors — no separate empty. NON-destructible (they are anchors, not cracking
  // organs) so THE RECKONING can never be locked out by a relic dying unbranded (§CP1 finding 2).
  const relicSpecs = [
    { name: 'relicHorn',  boss: 'VOIDMAW',    palette: 0x9a6cff, pos: [-1.45, -1.15, 0.5] },  // the broken horn (violet)
    { name: 'relicBlade', boss: 'ASHTALON',   palette: 0xff6a30, pos: [1.45, -1.15, 0.5] },   // the snapped scythe-blade (ember)
    { name: 'relicLink',  boss: 'BRINEHOLM',  palette: 0x6fd0c0, pos: [-1.75, -0.15, 0.45] }, // the chain link (abalone)
    { name: 'relicSpool', boss: 'WEFTWITCH',  palette: 0xe6d79a, pos: [1.75, -0.15, 0.45] },  // the thread spool (pale gold)
    { name: 'relicShard', boss: 'KNELLGRAVE', palette: 0xd8862e, pos: [0.0, -1.85, 0.55] },   // the bell shard (patina copper)
  ];
  const relicBodyMat = () => track(new THREE.MeshStandardMaterial({ color: 0x0d0c10, roughness: 1.0, metalness: 0.0, flatShading: true }));
  const relicGlowMat = (palette) => {
    const m = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(palette) }));
    m.toneMapped = false;
    return m;
  };
  // Per-relic minimal trophy silhouette (recognizable at the reliquary, detail-tier near centre).
  // §3-LAW-8 SANCTIONED EXCEPTION (§CP2 finding 3): satellites normally stay dark (emissive ≤0.25),
  // but the five relics are the RECKONING's COLLECTIBLES — they must self-present as findable trophies
  // precisely because they are shimmerExclude'd from the organ pick-menu (else stage 2's 12 paintables
  // starve the 8-slot pool). Kept SMALL, NON-additive (no overdraw), and dim enough that the great eye
  // stays the one focal; the owner judges the bulb-field risk on the preview. Their palettes are the
  // source bosses' (attribution), all clear of the reserved role colours (danger magenta, parry amber).
  const buildRelic = (spec, idx) => {
    const g = new THREE.Group();
    g.name = spec.name;
    g.position.set(...spec.pos);
    // BOSS-VISUAL-AUDIT (independent-audit correction on the Karnvow trophy law): at rel 30 the
    // relics were sub-10px clutter — unreadable attribution. Scaled up in place (anchors + count
    // unchanged — they are RECKONING lockParts; comfort re-check: cluster stays |x|≲2.4 local).
    g.scale.setScalar(1.4);
    const body = relicBodyMat();
    const glow = relicGlowMat(spec.palette);
    let shape, accent;
    if (spec.name === 'relicHorn') {           // a curved broken horn
      shape = new THREE.Mesh(stripForMerge(new THREE.ConeGeometry(0.16, 0.7, lowQ ? 5 : 7)), body);
      shape.rotation.z = 0.5; shape.scale.set(1, 1, 0.7);
      accent = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), glow); accent.position.set(0.08, 0.34, 0.06);   // the ember at the break
    } else if (spec.name === 'relicBlade') {   // a thin snapped scythe-blade
      shape = new THREE.Mesh(stripForMerge(new THREE.ConeGeometry(0.13, 0.72, 3)), body);
      shape.rotation.z = -0.9; shape.scale.set(0.5, 1, 0.32);
      accent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.02), glow); accent.rotation.z = -0.9; accent.position.set(0, 0.02, 0.08);  // the molten edge-slit
    } else if (spec.name === 'relicLink') {    // a chain link
      shape = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, lowQ ? 5 : 7, lowQ ? 10 : 14), body);
      shape.scale.set(0.8, 1, 0.5);
      accent = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, lowQ ? 10 : 14), glow); accent.scale.set(0.8, 1, 0.5);
    } else if (spec.name === 'relicSpool') {   // a thread spool
      shape = new THREE.Mesh(stripForMerge(new THREE.CylinderGeometry(0.14, 0.14, 0.34, lowQ ? 7 : 10)), body);
      shape.scale.set(1, 1, 0.7);
      accent = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.06, lowQ ? 7 : 10), glow); accent.scale.set(1, 1, 0.7);  // the wound thread band
    } else {                                    // relicShard — a jagged bell shard
      shape = new THREE.Mesh(stripForMerge(new THREE.TetrahedronGeometry(0.32, 0)), body);
      shape.scale.set(0.8, 1.1, 0.4); shape.rotation.set(0.4, 0.6, 0.3);
      accent = new THREE.Mesh(new THREE.TetrahedronGeometry(0.13, 0), glow); accent.position.set(0.04, 0.08, 0.1);   // the candle-glint through the crack
    }
    g.add(shape); g.add(accent);
    stage2.add(g);
    // baseHot 0.45 (a dim trophy glow, not a headlight); phase = the relic index so the five pulses
    // stagger cleanly (§CP2 finding 6 — a frozen weN made two pairs nearly sync).
    return { name: spec.name, group: g, glow, palette: new THREE.Color(spec.palette), baseHot: 0.45, flash: 0, branded: false, phase: idx * 1.3 };
  };
  const relics = relicSpecs.map((spec, i) => buildRelic(spec, i));

  // ── wingRootL/R — the STAGE 3 relic-root paint anchors (§5b "wired to the wing-roots"). Empties
  // on `stage2` (which stays visible in stage 3 — the mantled seraph) just off the central knot,
  // comfort-trivial. They are the stage-3 dwell organs (phase-gated [2]); the star-eye / halo stay
  // PURE PRESENTATION (they sit at the centre, coincident with the virtual focalEye aim anchor —
  // painting them would double a target on one pixel; §CP1 finding 7). ──
  const wingRootL = new THREE.Object3D();
  wingRootL.name = 'wingRootL'; wingRootL.position.set(-1.25, -0.55, 0.2); stage2.add(wingRootL);
  const wingRootR = new THREE.Object3D();
  wingRootR.name = 'wingRootR'; wingRootR.position.set(1.25, -0.55, 0.2); stage2.add(wingRootR);

  // ── THE RELIQUARY KNOT (art-director #2) — the convergence BODY, no longer a void. Warm umber
  // with a dim ember floor (a LIT body from below, NOT a bright orb — luma ceiling ≪ the eye so
  // the focal is never contested). Bigger + flatter so it fills the central pinch behind the ruff.
  // emissive base warm-gold; intensity idles LOW (0.55 — a dim ember behind the great eye in S2)
  // and is driven UP in stage 3 (setStage3) where the great eye retires and the knot becomes the
  // lit CORE the small star-eye sits on (critic checkpoint: S3's focal was the dimmest thing —
  // this restores core→bloom→dark at the S3 centre). Emissive on the existing mesh, zero shells.
  const knotMat = track(new THREE.MeshStandardMaterial({ color: 0x3a2a1e, emissive: 0x6a4a20, emissiveIntensity: 0.55, roughness: 0.9, metalness: 0.0 }));
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.92, lowQ ? 8 : 12, lowQ ? 6 : 9), knotMat);
  knot.scale.set(1.35, 1.5, 0.55); knot.position.set(0, 0, -0.28);   // flattened, seated among the wing roots
  knot.name = 'knotBody'; stage2.add(knot);

  // ── THE RELIQUARY RUFF (art-director #2) — a feathered collar of warm covert tufts ringing the
  // great eye, IN FRONT of every wing plane (z −0.05 > deepest wing −0.65) so every wing-root cord,
  // arm-edge, and rachis inner end terminates HIDDEN BEHIND it: the lines now radiate OUT FROM
  // BEHIND a lit mass, never meet at a naked black point (the spoke-killer). Two jittered concentric
  // arcs (NOT evenly spaced = no picket fence), thinned at 12 and 6 o'clock (the owner's vertical
  // channel). Warm, 2 steps above the feather ladder. Merged per material (2 draws), opaque — no
  // additive, no new light. ──
  const ruffInnerMat = track(new THREE.MeshStandardMaterial({ color: 0x40332a, roughness: 1.0, metalness: 0.0, flatShading: true }));
  const ruffOuterMat = track(new THREE.MeshStandardMaterial({ color: 0x352a22, roughness: 1.0, metalness: 0.0, flatShading: true }));
  const ruffInnerParts = [], ruffOuterParts = [];
  const RUFF_N = lowQ ? 9 : 13;
  const rhash = (n) => { const s = Math.sin(n * 21.17) * 9973.13; return s - Math.floor(s); };
  for (let ring = 0; ring < 2; ring++) {
    const rBase = ring === 0 ? 1.0 : 1.45, tuftLen = ring === 0 ? 0.85 : 1.05, tuftR = ring === 0 ? 0.19 : 0.16;
    for (let i = 0; i < RUFF_N; i++) {
      const a = (i / RUFF_N) * TAU + ring * 0.24 + (rhash(i + ring * 40) - 0.5) * 0.24;   // jittered + ring offset
      if (Math.abs(Math.sin(a)) > 0.955) continue;   // keep the vertical channel clear (±~18° of straight up/down)
      const cx = Math.cos(a), cy = Math.sin(a);
      const g = stripForMerge(new THREE.ConeGeometry(tuftR, tuftLen, 5));
      g.rotateZ(a - Math.PI / 2);   // cone points +y by default → rotate to radial
      g.scale(1, 1, 0.4);           // flatten in z — a feather tuft, not a spike
      g.translate(cx * (rBase + tuftLen * 0.4), cy * (rBase + tuftLen * 0.4), -0.05);
      (ring === 0 ? ruffInnerParts : ruffOuterParts).push(g);
    }
  }
  let ruffInnerMesh = null, ruffOuterMesh = null;
  if (ruffInnerParts.length) { ruffInnerMesh = new THREE.Mesh(mergeParts(ruffInnerParts, 'ruffInner'), ruffInnerMat); ruffInnerMesh.name = 'ruffInner'; stage2.add(ruffInnerMesh); }
  if (ruffOuterParts.length) { ruffOuterMesh = new THREE.Mesh(mergeParts(ruffOuterParts, 'ruffOuter'), ruffOuterMat); ruffOuterMesh.name = 'ruffOuter'; stage2.add(ruffOuterMesh); }

  // ── THE STAGE-2 NIMBUS (BOSS-VISUAL-AUDIT §14): the reserved gold corona, present as a FAINT
  // halo ring behind the seraph in its hero stage — the money frame (s2 idle/charge/all-snap)
  // shipped with no halo at all; the stage-3 nimbus never appears in it. A thin additive ring
  // STRICTLY behind every wing plane (z −1.05 < deepest wing −0.65; §2 backlight-behind-the-
  // silhouette is lawful, and a thin ring is ~5% fill — far off the overdraw cliff). Idles at a
  // whisper, breathes, swells with the wrath charge, FLARES on the all-snap, and yields to the
  // stage-3 halo as k3 rises (never two nimbi at once). Seated slightly HIGH (crown-side) so it
  // reads as a saint's nimbus, not a ring-around-the-body. ──
  // Registry tell #5 guard: a uniform ring is an "onion ring" — the band must be an ALPHA
  // FALLOFF. Three radial loops (transparent inner edge → bright mid → transparent outer) with
  // additive blending dissolve both edges to nothing; the material colour scales the whole band
  // (the tick's dimmer), exactly the corona's proven idiom.
  const halo2Mat = track(new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  halo2Mat.toneMapped = false;
  // Seated HIGH (crown-side) as a saint's nimbus BEHIND the head, not a ring on the hub — a
  // low-centred ring whose top the wings occlude reads as a wheel rim (art-director #5).
  const H2N = lowQ ? 40 : 72, H2Y = 1.6, H2Z = -1.05;
  const h2Pos = [], h2Col = [], h2Idx = [];
  const h2Accent = new THREE.Color(accent);
  for (let i = 0; i <= H2N; i++) {
    const a = (i / H2N) * TAU, cx = Math.cos(a), cy = Math.sin(a);
    h2Pos.push(cx * 2.9, cy * 2.9 + H2Y, H2Z, cx * 3.25, cy * 3.25 + H2Y, H2Z, cx * 3.7, cy * 3.7 + H2Y, H2Z);
    h2Col.push(0, 0, 0, h2Accent.r, h2Accent.g, h2Accent.b, 0, 0, 0);   // soft in → gold mid → soft out
  }
  for (let i = 0; i < H2N; i++) {
    const a = i * 3, b = a + 3;
    h2Idx.push(a, a + 1, b + 1, a, b + 1, b, a + 1, a + 2, b + 2, a + 1, b + 2, b + 1);
  }
  const halo2Geo = new THREE.BufferGeometry();
  halo2Geo.setAttribute('position', new THREE.Float32BufferAttribute(h2Pos, 3));
  halo2Geo.setAttribute('color', new THREE.Float32BufferAttribute(h2Col, 3));
  halo2Geo.setIndex(h2Idx);
  const halo2 = new THREE.Mesh(halo2Geo, halo2Mat);
  halo2.name = 'halo2'; stage2.add(halo2);
  halo2Mat.color.setScalar(0);   // dark until the tick drives it

  // ── THE FOCAL EYE — the ORIGINAL great almond (owner: "go back to the original eye for this
  // form"): the L142 real-eye rig at focal scale — pale sclera, gold iris, dark pupil, proud
  // catchlight. Sized to COVER the wing-root convergence so the central pinch is hidden behind
  // it (owner: all wings sit behind the eye). It renders in front (z≥0); every wing is at z<0. ──
  // Focal almond GROWN to win the centre (art-director #3) + pushed FORWARD (GZ) so it caps the
  // ruff + convergence and every wing sits clearly behind it. GF = the front-face z AFTER the push
  // (feeds the build AND the per-frame pupil tracker — keep them one constant).
  const GW = 1.25, GH = 0.85, GD = 0.4;
  const GZ = 0.3;                          // forward push
  const GF = GZ + GD;                      // sclera front-face z after the push
  const GEY = 0.0;                         // ON the centreline AT the knot — the single focal, wrapped in the starburst
  // Dedicated focal materials (T7): sclera pale but UNDER the bloom knee, iris a brighter gold —
  // the eye wins by VALUE + HUE, not by clipping to white. Shared with the S3 star-eye (#6).
  const focalScleraMat = track(new THREE.MeshBasicMaterial({ color: 0xa89a74 }));   // lifted pale eyeball (luma ~150, well under the knee)
  const focalIrisMat = track(new THREE.MeshBasicMaterial({ color: 0xa87c2a }));     // brighter gold iris — the hue the focal reads by
  const greatScleraMat = focalScleraMat;   // (name kept — SCLERA_BASE + star-eye reference it)
  const greatSocket = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 10 : 14, lowQ ? 7 : 9), socketMat);
  greatSocket.scale.set(GW * 1.24, GH * 1.3, 0.5); greatSocket.position.set(0, GEY, GZ - 0.18);
  greatSocket.name = 'greatSocket'; stage2.add(greatSocket);
  const greatEye = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 12 : 16, lowQ ? 8 : 10), greatScleraMat);
  greatEye.scale.set(GW, GH, GD); greatEye.position.set(0, GEY, GZ);
  greatEye.name = 'greatEye'; stage2.add(greatEye);
  const greatIris = new THREE.Mesh(new THREE.CircleGeometry(1, lowQ ? 12 : 16), focalIrisMat);
  greatIris.scale.set(GW * 0.50, GH * 0.60, 1); greatIris.position.set(0, GEY, GF + 0.03);   // wider gold ring — the sclera ring widens with the eye, the pupil hole does not
  greatIris.name = 'greatIris'; stage2.add(greatIris);
  const greatPupil = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 10 : 14, lowQ ? 7 : 9), s2pupilMat);
  greatPupil.scale.set(GW * 0.38, GH * 0.44, 0.5); greatPupil.position.set(0, GEY, GF + 0.08);   // dark pupil — smaller so the PALE sclera rings it (an almond eye, not a black hole)
  greatPupil.name = 'greatPupil'; stage2.add(greatPupil);
  const greatCatch = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), catchMat);
  greatCatch.position.set(-GW * 0.2, GEY + GH * 0.28, GF + 0.35);
  greatCatch.name = 'greatCatch'; stage2.add(greatCatch);

  const socketMesh = new THREE.Mesh(mergeParts(sockets, 'eyeSockets'), socketMat);
  socketMesh.name = 'eyeSockets';
  stage2.add(socketMesh);
  const scleraMesh = new THREE.Mesh(mergeParts(sclerae, 'eyeScleras'), s2scleraMat);
  scleraMesh.name = 'eyeScleras';
  stage2.add(scleraMesh);
  const irisMesh = new THREE.Mesh(mergeParts(irises, 'eyeIrises'), irisMat);
  irisMesh.name = 'eyeIrises';
  stage2.add(irisMesh);
  const catchMesh = new THREE.Mesh(mergeParts(catchlights, 'eyeCatchlights'), catchMat);
  catchMesh.name = 'eyeCatchlights';
  stage2.add(catchMesh);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 3 — THE UNVEILING (the third form). The seraph's wings MANTLE FULLY OPEN and the
  // veiled core UNVEILS: the plain focal almond gives way to the reserved STAR-EYE (a small
  // almond wrapped in a radiant GOLD STARBURST) with a saint's HALO behind. Tri-lean: it REUSES
  // stage 2's wings + eye-field (they don't duplicate — stage 3 shows the SAME seraph, mantled)
  // and only adds these cheap central motifs, swapping the focal eye for the star-eye. Hidden
  // until setStage3 drives it; the whole group rides `stage3`. ──
  const stage3 = new THREE.Group();
  stage3.name = 'stage3Rig';
  stage3.visible = false;
  rig.add(stage3);

  // THE HALO — a saint's gold nimbus behind the core (the reserved corona glow-shape). Rebuilt as
  // the halo2 3-LOOP VERTEX-FALLOFF idiom (art-director #6): the old uniform RingGeometry was an
  // onion-ring tell (registry #5) with a hard edge. Vertex colours carry a grayscale radial
  // falloff (soft in → white mid → soft out); the material colour (tick) carries accent×dimmer,
  // opacity (setStage3) the reveal envelope. Seated at the SAME crown position as halo2 (y1.6,
  // radii 2.9/3.7) so the S2→S3 nimbus hand-off is a cross-fade in place, not a jump.
  const halo3Mat = track(new THREE.MeshBasicMaterial({
    color: accent, vertexColors: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  halo3Mat.toneMapped = false;
  const H3N = lowQ ? 40 : 72, H3Y = 1.6, H3Z = -0.9;
  const h3Pos = [], h3Col = [], h3Idx = [];
  for (let i = 0; i <= H3N; i++) {
    const a = (i / H3N) * TAU, cx = Math.cos(a), cy = Math.sin(a);
    h3Pos.push(cx * 2.9, cy * 2.9 + H3Y, H3Z, cx * 3.25, cy * 3.25 + H3Y, H3Z, cx * 3.7, cy * 3.7 + H3Y, H3Z);
    h3Col.push(0, 0, 0, 1, 1, 1, 0, 0, 0);   // grayscale falloff — accent lives in material.color (the tick dimmer)
  }
  for (let i = 0; i < H3N; i++) {
    const a = i * 3, b = a + 3;
    h3Idx.push(a, a + 1, b + 1, a, b + 1, b, a + 1, a + 2, b + 2, a + 1, b + 2, b + 1);
  }
  const halo3Geo = new THREE.BufferGeometry();
  halo3Geo.setAttribute('position', new THREE.Float32BufferAttribute(h3Pos, 3));
  halo3Geo.setAttribute('color', new THREE.Float32BufferAttribute(h3Col, 3));
  halo3Geo.setIndex(h3Idx);
  const halo3 = new THREE.Mesh(halo3Geo, halo3Mat);
  halo3.name = 'halo'; stage3.add(halo3);

  // THE STARBURST — a radiant GOLD sunburst of alternating long/short spikes around the star-
  // eye (the reserved emblem). Additive tapered triangles, HOT at the core → dark at the tip so
  // they bloom into rays, not solid blades. `starPivot` spins slowly + pulses in the tick.
  const starPivot = new THREE.Object3D();
  starPivot.name = 'starburst';
  stage3.add(starPivot);
  const burstMat = track(new THREE.MeshBasicMaterial({
    color: accent, vertexColors: true, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  burstMat.toneMapped = false;
  const NSPIKE = lowQ ? 10 : 14;
  const burstPos = [], burstCol = [], burstIdx = [];
  const burstHot = new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.35);
  const bhash = (n) => { const s = Math.sin(n * 33.71) * 7411.19; return s - Math.floor(s); };
  let bv = 0;
  for (let i = 0; i < NSPIKE; i++) {
    // Deterministic angle + length jitter (art-director #6): a strict alternating 5.6/2.7 metronome
    // read as a mechanical star; jittered rays (no two adjacent longs within ~6% length) read as
    // living radiance. Rays start OUTBOARD (r0 0.62) so their bases hide behind the reliquary ruff.
    const a = (i / NSPIKE) * TAU + (bhash(i) - 0.5) * 0.09;
    const len = (i % 2 === 0 ? 5.6 * (0.85 + 0.30 * bhash(i + 5)) : 2.7 * (0.80 + 0.40 * bhash(i + 9)));
    const w = 0.16;                                     // rays with body (survive fight distance) — still a sunburst, not fat blades
    const r0 = 0.62;                                    // spikes start just outside the star-eye, behind the ruff
    const tx = Math.cos(a) * (r0 + len), ty = Math.sin(a) * (r0 + len);
    const bax = Math.cos(a - w) * r0, bay = Math.sin(a - w) * r0;
    const bbx = Math.cos(a + w) * r0, bby = Math.sin(a + w) * r0;
    burstPos.push(bax, bay, -0.35, bbx, bby, -0.35, tx, ty, -0.35);
    burstCol.push(burstHot.r, burstHot.g, burstHot.b, burstHot.r, burstHot.g, burstHot.b, 0, 0, 0);   // hot base → black tip
    burstIdx.push(bv, bv + 1, bv + 2); bv += 3;
  }
  const burstGeo = new THREE.BufferGeometry();
  burstGeo.setAttribute('position', new THREE.Float32BufferAttribute(burstPos, 3));
  burstGeo.setAttribute('color', new THREE.Float32BufferAttribute(burstCol, 3));
  burstGeo.setIndex(burstIdx);
  starPivot.add(new THREE.Mesh(burstGeo, burstMat));

  // THE STAR-EYE — a SMALL almond at the very centre (the L142 real-eye rig, reusing the eye-
  // field materials so it adds no draws): pale sclera, gold iris, dark pupil (tracks), catchlight.
  const SW = 0.72, SH = 0.48, SD = 0.22;   // grown (art-director #6) to match the S2 focal eye's new scale
  const starSocket = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 8 : 12, lowQ ? 6 : 8), socketMat);
  starSocket.scale.set(SW * 1.3, SH * 1.35, 0.4); starSocket.position.set(0, 0, -0.12);
  stage3.add(starSocket);
  const starEye = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 10 : 14, lowQ ? 7 : 9), greatScleraMat);
  starEye.scale.set(SW, SH, SD); starEye.position.set(0, 0, 0.05);
  starEye.name = 'starEye'; stage3.add(starEye);
  const starIris = new THREE.Mesh(new THREE.CircleGeometry(1, lowQ ? 12 : 16), focalIrisMat);   // matches the S2 focal iris (art-director #6)
  starIris.scale.set(SW * 0.5, SH * 0.6, 1); starIris.position.set(0, 0, SD + 0.06);
  stage3.add(starIris);
  const starPupil = new THREE.Mesh(new THREE.SphereGeometry(1, lowQ ? 8 : 12, lowQ ? 6 : 8), s2pupilMat);
  starPupil.scale.set(SW * 0.42, SH * 0.5, 0.4); starPupil.position.set(0, 0, SD + 0.1);
  stage3.add(starPupil);
  const starCatch = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), catchMat);
  starCatch.position.set(-SW * 0.22, SH * 0.3, SD + 0.24);
  stage3.add(starCatch);
  // The stage-2 focal-eye parts that the star-eye REPLACES at the unveiling (hidden by setStage3).
  const focalParts = [greatSocket, greatEye, greatIris, greatPupil, greatCatch];

  // ── RELICS (§8) are RESERVED FOR CP2 — the placeholder gold quill-glints read as stray
  // hairline slivers near the centre (Fable polish). CP2 builds the real 5-trophies-+-1-empty
  // destructible relics with their per-relic palette + destroy→sag behaviour; no seed here. ──

  kit.flashBind(lidMat, 0.0);
  kit.finalize();

  // ── THE S1→S2 CRACK TRANSITION ── the eclipse mask CRACKS open and the seraph BLOOMS out
  // of the collapsing sun. One eased driver `setStageMorph(k)`: k 0 = full stage 1 (the second
  // sun) → k 1 = full stage 2 (the seraph). Both sub-rigs live during the morph; the read is
  // coherent because each rig scales as a WHOLE (no per-part detachment — the eyes ride their
  // stage-2 group as it blooms, the cracks/corona ride stage-1 as it collapses). At k 0 and
  // k 1 every driven value returns to the shipped pose byte-for-byte (verified). CP2 drives k
  // over the phase seam; the studio 'morph' dial + the stage selector drive it for playtest. ──
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let coronaFlare = 0;   // corona destabilises (flares) as the sun cracks, read in tickBody
  let coronaDeath = 0;   // corona forced dark by the shatter flash (read in tickBody)
  let crackGlowK = 0;    // crack HDR flare weight (read in tickBody for the bloom-through-strain)
  let unfurlK = 0;       // seraph wing-unfurl weight 0(folded bud)→1(shipped splay); read in the shoulder loop
  let eyesOpen = 0;      // 0 = eyes SHUT (dark bud) → 1 = OPEN (the reveal); read in tickBody for the snap
  let stageMorph = 0;
  // ── THE S1→S2 CRACK is a BEAT MAP over the morph clock m (0→1 across 6.0s), not one ease:
  // STILLING → FIRST CRACK → PROPAGATION → STRAIN → SHATTER → BUD → UNFURL → ALL-EYES-OPEN.
  // Every visual is a PURE FUNCTION OF m (the studio dial scrubs it; endpoints m∈{0,1} stay the
  // shipped poses byte-for-byte). The wing fold, eye-field visibility + shard fling are set HERE
  // so scrubbing is coherent; time-based flicker/HDR flare rides tickBody off these weights. ──
  const KM = { still: 0.167, crack0: 0.20, prop: 0.383, strain: 0.483, shatter: 0.60, bud: 0.667, eyes: 0.933 };
  const wingEase = (u, order) => {                    // staggered cascade + overshoot; =1 at u=1 (byte-identical)
    const t0 = order / 6 * 0.4, t1 = t0 + 0.6;         // t1 ≤ 0.8 → all wings reach ease 1 by u=0.8
    const local = smooth(t0, t1, u);
    return local + 0.12 * Math.sin(Math.min(1, local) * Math.PI);   // overshoot, settling to 1
  };
  function setStageMorph(k) {
    stageMorph = Math.max(0, Math.min(1, k));
    const m = stageMorph;
    const shatterK = smooth(KM.strain, KM.shatter, m);            // the sun strains then dies
    const collapse = smooth(KM.shatter, KM.shatter + 0.045, m);   // the fast collapse INSIDE the flash
    const bloom = smooth(KM.bud, KM.eyes, m);
    stage1.visible = m < 0.995 && collapse < 0.999;
    stage2.visible = m > KM.shatter - 0.04;
    // STRAIN: the mask SWELLS (inhale) 1.0→1.05, then COLLAPSES to nothing inside the flash.
    stage1.scale.setScalar(Math.max(1e-4, (1 + 0.05 * shatterK) * (1 - collapse)));
    // THE CRACK: born at STILL, propagates to PROP, flares through STRAIN, dies at SHATTER.
    const crackO = smooth(KM.still, KM.prop, m) * (1 - smooth(KM.shatter - 0.06, KM.shatter, m));   // HOLD the fully-cracked eye right up to the shatter (it doesn't fade early)
    crackMat.opacity = crackO * 0.9;
    fissureDarkMat.opacity = Math.min(1, crackO * 1.4);           // the dark split across the sclera (reads first)
    fissureGlowMat.opacity = crackO * 0.9;                        // gold bleed on the disc
    crackGlowK = crackO * (1 + shatterK * 1.6);                   // HDR flare weight (tickBody)
    // CORONA destabilises through the crack, then DIES before the flash peaks.
    coronaFlare = smooth(KM.still, KM.strain, m) * (1 - shatterK);
    coronaDeath = shatterK;
    // BACKLIGHT: leaks during STRAIN, FLASHES white at SHATTER, fades as the seraph blooms.
    const back = smooth(KM.strain, KM.shatter, m) * (1 - smooth(KM.shatter + 0.06, KM.eyes, m));
    backlight.visible = back > 0.002;
    backMat.color.setScalar(back * 2.9);   // a BRIGHT flood — the shatter is unmistakable
    // SHATTER SHARDS: fling radially out of the flash (pure function of m — scrub-safe, deterministic).
    const sp = smooth(KM.shatter, KM.eyes, m);
    for (const sh of shards) {
      const u = sh.userData;
      sh.visible = sp > 0.001 && sp < 0.985;
      const rr = u.r0 + sp * u.dist;
      sh.position.set(Math.cos(u.ang) * rr, Math.sin(u.ang) * rr, DISC_Z + 0.1);
      const sc = u.s0 * (1 - sp * 0.85);
      sh.scale.set(sc, sc, sc * 0.4);
      sh.rotation.set(u.spin * sp, u.spin * 0.7 * sp, u.spin * 1.3 * sp);
    }
    // THE SERAPH blooms from a folded BUD (scale 0.62) and its wings UNFURL (shoulder loop).
    stage2.scale.setScalar(0.62 + 0.38 * bloom);
    unfurlK = bloom;
    // THE EYES: SHUT (dark sockets on a squinted great eye) through the unfurl, then OPEN at the
    // reveal — the all-eyes-snap lands on the flip (tickBody). socket meshes stay lit (the blind bud).
    const open = smooth(KM.eyes - 0.03, KM.eyes + 0.02, m);
    eyesOpen = open;
    const lit = open > 0.5 || m >= 0.999;
    scleraMesh.visible = irisMesh.visible = catchMesh.visible = lit;
    greatIris.visible = greatPupil.visible = greatCatch.visible = lit;
    for (const p of pupils) p.visible = lit;
    greatEye.scale.set(GW, GH * (lit ? 1 : 0.12), GD);            // squint the great eye shut while the bud is blind
  }

  // ── THE S2→S3 UNVEILING ── the seraph's core opens: the plain focal eye gives way to the
  // STAR-EYE + STARBURST, the HALO kindles behind, and the wings MANTLE FULLY OPEN. One eased
  // driver `setStage3(k3)`: k3 0 = the plain seraph (stage 2) → k3 1 = the unveiled third form.
  // stage 2's wings + eye-field stay (the SAME seraph, mantled — read in tickBody); only the
  // centre swaps. k3 0 hides stage 3 + shows the focal eye → stage 2 is byte-identical. ──
  let stage3K = 0;
  let mantleK = 0;      // S2→S3 wing throw weight (read in the shoulder loop): 0 at rest → 1.30 throw-peak → 0.20 settled (PR-K)
  let convergeK = 0;    // GATHER: the eye field turns INWARD to the core (read in the pupil loop)
  let burstFlash = 0;   // ignition HDR flash weight (read in the stage-3 tick)
  // THE UNVEILING is a beat map on the reversal: the seraph STOPS WATCHING (eyes converge in) →
  // the great eye CLOSES → the wings THROW open → the shut eye-line SPLITS as the starburst
  // IGNITES → the held stare. Pure function of k3; endpoints k3∈{0,1} are the shipped stages.
  function setStage3(k) {
    stage3K = Math.max(0, Math.min(1, k));
    const k3 = stage3K;
    const fold    = smooth(0.02, 0.18, k3);   // GATHER: wings fold in, eyes turn inward
    const closeK  = smooth(0.16, 0.32, k3);   // the great eye SHUTS
    const throwK  = smooth(0.33, 0.44, k3);   // THE THROW: wings mantle open past the final span
    const igniteK = smooth(0.44, 0.52, k3);   // IGNITION: the shut seam SPLITS into the starburst
    const settleK = smooth(0.55, 0.88, k3);   // the overshoot decays to the held pose
    stage3.visible = k3 > 0.005;
    // The star assembly POPS in at ignition (overshoot to 1.15, settles to 1) — the group inflate
    // replaced by a punch so the centre detonates rather than gently scaling up.
    stage3.scale.setScalar(1 + 0.30 * (igniteK - smooth(0.50, 0.62, k3)));
    // STARBURST: opacity flashes in fast at ignition; rays SHOOT out (0.15→1.12) then settle to 1.
    burstMat.opacity = smooth(0.44, 0.50, k3) * 0.95;
    starPivot.scale.setScalar(0.15 + 0.97 * igniteK + 0.12 * igniteK * (1 - settleK));
    burstFlash = igniteK * (1 - smooth(0.52, 0.66, k3)) * 1.6;   // the HDR flash (tickBody), 0 by the settle
    // HALO: kindles hot BEHIND the throw (backlight for the mantle), settles to 0.7.
    halo3Mat.opacity = smooth(0.34, 0.42, k3) * 0.7 * (1 + 0.9 * Math.max(0, throwK - settleK * 0.9));
    // THE GREAT EYE CLOSES (the reversal), then RECEDES: hidden once it is a thin dark seam, so the
    // split reads as the seam bursting — never an empty-centre crossfade.
    const eyeY = 1 - 0.94 * closeK;
    greatEye.scale.set(GW, GH * eyeY, GD);
    greatSocket.scale.set(GW * 1.24, GH * 1.3 * eyeY, 0.5);
    const hideFocal = k3 >= 0.44;
    for (const e of focalParts) e.visible = !hideFocal;
    greatCatch.visible = !hideFocal && closeK < 0.6;   // the catchlight dies first (the light going out)
    // RELIGHT THE KNOT CORE (critic one-revise): as the great eye retires, the knot becomes the lit
    // core the small star-eye sits on — restoring core→bloom→dark at the S3 focal (idle 0.55 → ~2.75
    // by the throw, brighter than the halo tube, second only to the ray roots). k3 0 → 0.55 (S2 byte-
    // identical, occluded behind the great eye).
    knotMat.emissiveIntensity = 0.55 + 2.2 * smooth(0.30, 0.62, k3);
    // THE WING THROW (read in the shoulder loop): overshoot to 1.30 at the throw, then SETTLE to
    // 0.20 (PR-K, owner-locked): the dramatic throw is kept intact (throwK/igniteK/settleK timing
    // and the unveil beat/halo/ignition are functions of the Ks, not the settled value), but the
    // HELD S3 pose relaxes to read near-identical to S2 at fight distance — the FIRSTBORN SKY's
    // seraph is the same dark figure, now hanging in a born cosmos. Wing base ANGLES untouched
    // (WING_PAIRS/FLARE_SIGN frozen) — this is a coefficient, not an angle.
    mantleK = -0.35 * fold + 1.65 * throwK - 1.10 * settleK;
    // THE GATHER: the eye field abandons the player and converges on the core (dies by the throw).
    convergeK = fold * (1 - smooth(0.30, 0.40, k3));
  }

  // Stage select (CP2 wires this to the phase machine; for now a debug/gate hook). A discrete
  // stage pick maps to the driver endpoints — 1 → the eclipse (morph 0), 2 → the seraph
  // (morph 1, unveiling 0), 3 → the unveiled third form (morph 1, unveiling 1). The stage
  // selector uses this; the transitions themselves are setStageMorph / setStage3.
  // ── THE LIVE STAGE MACHINE (boss.js calls model.setPhase on every phase advance): the fight
  // ANIMATES the transition INTO the new phase's stage — phase 1 plays the S1→S2 CRACK, phase 2
  // plays the S2→S3 UNVEILING. `transKind` names the running transition, `transT` eases 0→1 over
  // the per-kind duration (advanced in tickBody). ──
  //
  // A TRANSFORMATION IS A BEAT MAP, NOT AN EASE (transformation-rework 2026-07): each transition
  // runs over its OWN duration and carries a HARNESS BEAT TABLE (camera shake / slow-mo / sfx
  // times in seconds from beat start). The model owns the pure-function-of-transT VISUAL morph
  // (setStageMorph / setStage3); boss.js reads `stageTransitionSpec(n)` for the durations + beat
  // table + the reveal/throw punctuation times and fires the camera/audio. `stageTransitionDur`
  // stays exported as a legacy truthy alias (the multi-stage flag boss.js gates on).
  const TRANS_DURS = { crack: 6.0, unveil: 4.8 };
  // Camera/audio beats (sfx tokens are resolved to procedural cues in boss.js — no assets).
  const CRACK_BEATS = [
    { t: 0.0, sfx: 'swell' },                          // STILLING — the sub-bass held breath
    { t: 1.0, shake: 0.35, sfx: 'crack' },             // FIRST CRACK across the sclera
    { t: 1.4, shake: 0.20, sfx: 'crack' },             // PROPAGATION jolts
    { t: 1.8, shake: 0.20, sfx: 'crack' },
    { t: 2.3, shake: 0.20, sfx: 'crack' },
    { t: 2.9, sfx: 'swell' },                          // STRAIN — the choir swells
    { t: 3.6, shake: 1.2, slowMo: 0.35, sfx: 'shatter' }, // THE SHATTER — the second sun dies
  ];
  const UNVEIL_BEATS = [
    { t: 0.0, sfx: 'rumble' },                         // GATHER — it stops watching you
  ];
  // n = the phase index being ENTERED (setPhase(1)=crack, setPhase(2)=unveil). Pure lookup.
  function stageTransitionSpec(n) {
    if (n === 1) return { kind: 'crack',  dur: TRANS_DURS.crack,  revealAt: 5.6, hold: 1.6, beats: CRACK_BEATS };
    if (n === 2) return { kind: 'unveil', dur: TRANS_DURS.unveil, revealAt: 2.1, throwAt: 1.6, hold: 0.7, beats: UNVEIL_BEATS };
    return null;
  }
  let transKind = null, transT = 0, transSnapped = false;   // transSnapped latches the one reveal all-snap per transition
  let stageN = 1;
  function setDebugStage(n) {
    transKind = null; transSnapped = false;   // a hard stage-set is a CUT — cancel any running transition (also the SKIP path)
    stageN = n;
    setStageMorph(n == null || n <= 1 ? 0 : 1);
    setStage3(n >= 3 ? 1 : 0);
  }

  function setPhase(n) {
    if (n === 1) { transKind = 'crack'; transT = 0; transSnapped = false; }        // S1 → S2: the mask cracks, the seraph blooms
    else if (n === 2) { transKind = 'unveil'; transT = 0; transSnapped = false; }  // S2 → S3: the core unveils, the wings mantle full
  }

  // WING-DESIGN ISOLATION: strip EVERYTHING but a single wing so the wing SILHOUETTE can be
  // designed on its own (the owner's directive — get the wing right first, then re-add eyes).
  const nonWing = [socketMesh, scleraMesh, irisMesh, catchMesh, greatSocket, greatEye, greatIris, greatPupil, greatCatch, knot, ruffInnerMesh, ruffOuterMesh];
  function setDebugWing(on) {
    stage1.visible = on ? false : (stageN == null || stageN === 1);
    stage2.visible = on ? true : (stageN === 2);
    for (const m of nonWing) if (m) m.visible = !on;
    for (const p of pupils) p.visible = !on;
    for (const s of shoulders) {
      const keep = s.obj.name === 'wing_middle_R';
      s.obj.visible = on ? keep : true;
      if (on && keep) { s.obj.position.set(0, -3.5, 0); s.obj.rotation.set(0, 0, 0); }   // centre the lone wing for design
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ANIMATION / STATE
  // ──────────────────────────────────────────────────────────────────────────
  const DANGER = new THREE.Color(0xff2b6a);
  const _c = new THREE.Color();
  // Base eye-field values captured so the wrath tell + snap flare lerp FROM the signed-off
  // resting colours and return to them exactly (irisMat paints BOTH the ~9 peripheral irises
  // and the great iris; catchMat paints every catchlight + the great catch — one lerp does the
  // whole field, which is the point: the eyes go wrathful as ONE being).
  const IRIS_BASE = irisMat.color.clone();
  const CATCH_BASE = catchMat.color.clone();
  const SCLERA_BASE = greatScleraMat.color.clone();   // ARENA (PR-B): the S3 focal-lift base (the star-eye/greatEye sclera)

  // ── THE ARENA HEAVEN FOCAL LIFT (PR-B; retuned for PR-J THE JUDGMENT COURT): in the chiaroscuro
  // court the vault is MIDNIGHT (horizon band L≈.49, zenith ≈.10) — the lift's job flipped from
  // out-brightening a 0.74 gold sky to CROWNING a silhouette. The halo/starburst keep their full
  // lift (they ARE the god's light, blazing on the dark vault); the sclera/catch lifts come DOWN
  // (0.5→0.3 / 0.8→0.6) so the star-eye reads as the focal without bulb-flaring inside the dark
  // frame. heavenK (driven by boss.js as the unveil completes) — 0 ⇒ byte-identical (the halo/burst
  // multipliers are ×1; the sclera/catch writes are heavenK>0-guarded). All TUNE.
  let heavenK = 0;
  const SCLERA_LIFT = 0.3, HALO_LIFT = 0.75, BURST_LIFT = 1.0, CATCH_LIFT = 0.6;   // GODHEAD DETONATION P3: crown lifted (.6→.75 / .9→1.0) so the star-eye focal outshines the new gold WREATH (dark-gap law)
  function setArenaHeaven(k) { heavenK = Math.max(0, Math.min(1, k)); }

  // ── THE ARENA VOID RIM-LIGHT (PR-V2): THE HOLLOW has NO sun on the camera-facing seraph (the
  // directional light rakes its BACK) over a near-black sky, so the shipped dark silhouette renders
  // invisible (owner: "unplayable"). voidK (driven by boss.js across the void window) paints a SELF-LIT
  // violet-silver rim on the wing leading edges (emissive → reads with zero scene light), lifts the
  // feather value-ladder one step toward a violet midtone BODY, and fades in the backglow mandorla. The
  // parry-firing wings' legibility IS the fairness case (same argument the relics won). voidK 0 ⇒
  // byte-identical (guarded restore, like the heaven's sclera). Fades OUT into S3 (the gold flood — the
  // dark-on-gold silhouette already reads). All TUNE.
  const RIM_BASE = rimMat.color.clone(), RIMB_BASE = rimMatB.color.clone();
  const RIM_EM_BASE = rimMat.emissive.clone(), RIMB_EM_BASE = rimMatB.emissive.clone();
  const RIM_VOID = new THREE.Color(0xc4bcf0), RIMB_VOID = new THREE.Color(0x9a90cc);      // violet-silver moonlight (leading-edge rim)
  const RIM_EM_VOID = new THREE.Color(0x6a5ca8), RIMB_EM_VOID = new THREE.Color(0x483c78); // the SELF-LIT term (contour reads with no scene light)
  const VOID_BODY = new THREE.Color(0x5a5080);   // the violet midtone the ladder lifts toward (body band; ladder separation preserved by a partial lerp)
  const LADDER_KEYS = Object.keys(LADDER);   // precomputed — no per-frame Object.keys allocation in the void tick
  const LADDER_BASE = {}, LADDER_VOID = {};
  for (const k of LADDER_KEYS) { LADDER_BASE[k] = baseMats[k].color.clone(); LADDER_VOID[k] = baseMats[k].color.clone().lerp(VOID_BODY, 0.55); }
  const VOID_GLOW_MAX = 0.42;   // low opacity (owner: "yes, low") — the glow supports the rim, never floods
  let voidK = 0;
  function setArenaVoid(k) { voidK = Math.max(0, Math.min(1, k)); }

  // ── THE IGNITED SERAPH (GODHEAD DETONATION P3): the heaven-side sibling of setArenaVoid — the boss
  // catches fire from its own verdict (judgment = illumination). igniteK (driven by boss.js across the
  // SETTLED heaven, mix 1.45→2, AFTER voidK fully exhales — mutually exclusive by construction) does
  // three things, owner D2a+ HYBRID (gold fire, violet-cold body — NOT a full wash): (1) an
  // INCANDESCENT GOLD rim on the wing leading edges (emissive → the self-lit term, reads with zero
  // scene light — the sun rakes the boss's back), (2) a PARTIAL ladder lift (0.35) toward an ember
  // violet-bronze midtone — the body WARMS but STAYS DARK so the six wingEyes + shingled fan still
  // read (the line between "wreathed" and "washed" is load-bearing), (3) the roiling gold-violet aura
  // mandorla. The focal (star-eye) still wins via the heaven-lift retune. igniteK 0 ⇒ byte-identical
  // (guarded restore, exactly the void idiom). Zero rig writes; wing angles frozen; wingEyes cannot move.
  // WREATHED, NOT WASHED (load-bearing): rimMat/rimMatB are LARGE feather-rank materials, not thin
  // edges — recolouring them bright gold WASHES the whole fan and kills the dark silhouette. The
  // reference's "burning edges" are really BACKLIGHT (the aura mandorla rims the dark figure). So the
  // feather diffuse stays DARK-warm (value kept near the base 0x5b6472/0x474e5a so it reads DARKER than
  // the gold sky), with only a MODEST warm-gold EMISSIVE ember; the mandorla behind is the real wreath.
  const RIM_IGNITE = new THREE.Color(0x8a6a48), RIMB_IGNITE = new THREE.Color(0x6a5238);   // dark warm bronze — a warm TINT, not a gold sticker (silhouette preserved)
  const RIM_EM_IGNITE = new THREE.Color(0x6e4c22), RIMB_EM_IGNITE = new THREE.Color(0x4a3016);  // a MODEST self-lit ember on the leading ranks (edges glow warm; the mandorla carries the incandescence)
  const IGNITE_BODY = new THREE.Color(0x544862);   // ember violet-BRONZE midtone — warm but dark, the S2 violet undertone kept (hybrid); PARTIAL lerp preserves the ladder separation
  const LADDER_IGNITE = {};
  for (const k of LADDER_KEYS) LADDER_IGNITE[k] = baseMats[k].color.clone().lerp(IGNITE_BODY, 0.30);   // 0.30 — wreathed, not washed (body warms, stays dark)
  const IGNITE_GLOW_MAX = 0.46;   // the aura opacity (owner §3d.3 ~0.5·k) — the mandorla is the wreath, supports the silhouette, never floods the frame
  const WISP_MAX = 0.85;          // the living-wisp brightness (thin tapered tongues → cheap on the probes; the shader's prof/edge/flow keep them sparse)
  let igniteK = 0;
  function setArenaIgnite(k) { igniteK = Math.max(0, Math.min(1, k)); }

  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  // ── THE ALL-SNAP (§4b DEATH-of-doubt reveal / the screenshot of the game): every eye across
  // the wings + the great eye abandons its own idle wander and LOCKS dead-on the player at once,
  // the catchlights flare hot, and the wings freeze mid-breath — a held, total stare. Triggered
  // by the fight machine (CP2) at the phase turn; `snapT` is the hold, `snapK` the eased weight.
  let snapT = 0, snapK = 0;
  function allSnap(hold = 0.8) { snapT = Math.max(snapT, hold); saccadeT = 0; }

  // ── THE RECKONING relic presentation (rung 14): an UNBRANDED relic breathes a dim palette pulse
  // (the "brand me" read — they are the reliquary's collectibles); branding one FLASHES its source
  // boss's palette hot (the attribution beat) then settles to a steady claimed glow. Driven by
  // setBrandedRelics(list) from boss.js's lockPaint listener (the setBrandedFeatures precedent).
  // Pure presentation — the gameplay is the paint/RECKONING flag in boss.js. ──
  function setBrandedRelics(branded) {
    if (!branded) return;
    for (const r of relics) {
      const on = branded.includes(r.name);
      if (on && !r.branded) r.flash = 1;   // just took the brand → flare its palette
      r.branded = on;
    }
  }

  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  function setGaze(nx, ny) { gazeTX = Math.max(-1, Math.min(1, nx)); gazeTY = Math.max(-1, Math.min(1, ny)); }
  let noticeT = 0, saccadeT = 0;
  function notice() { noticeT = 1.1; saccadeT = 0.18; }
  let painT = 0, skitterX = 0, skitterY = 0;
  function flinchFlash(amt) {
    if (amt > 0.3) { painT = Math.max(painT, 0.3); skitterX = (rnd() - 0.5) * 1.6; skitterY = (rnd() - 0.5) * 1.2; }
    kit.flash(amt);
  }
  let dyingK = 0;
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  let aperture = 0.35;   // eased hood aperture (0.35 = a clearly-open hooded eye at rest)

  function tickBody(dt, time) {
    if (noticeT > 0) noticeT -= dt;
    if (saccadeT > 0) saccadeT -= dt;
    if (painT > 0) painT -= dt;

    // ── Advance any running STAGE TRANSITION (the live phase machine): ease transT 0→1 and
    // drive the matching morph. The all-snap punctuates each arrival (every eye locks as the
    // new form settles — the reveal). Cleared when the transition completes. ──
    if (transKind) {
      transT = Math.min(1, transT + dt / (TRANS_DURS[transKind] || 2.0));
      if (transKind === 'crack') {
        setStageMorph(transT);
        // THE ALL-EYES REVEAL lands ON the eyes-open flip (not at completion) — the earned stare.
        if (eyesOpen > 0.5 && !transSnapped) { transSnapped = true; allSnap(1.9); }
      } else if (transKind === 'unveil') {
        setStage3(transT);
        // THE REVEAL lands ON the starburst ignition (k3≈0.46), not at completion.
        if (stage3K > 0.46 && !transSnapped) { transSnapped = true; allSnap(2.6); }
      }
      if (transT >= 1) { transKind = null; }
    }

    // ── Aperture (EXPRESSION): heavy-lidded rest → watching → wrath (charge lifts the
    // hood). Death lowers it (the light going out). ──
    const watching = noticeT > 0 || Math.abs(gazeTX) + Math.abs(gazeTY) > 0.05;
    let apTarget = 0.42;                 // dormant: a heavy-lidded but clearly-open eye
    if (watching) apTarget = 0.72;       // watching: a wide open eye (the fight look)
    if (gazeTY > 0) apTarget += gazeTY * 0.22;   // looking UP lifts the hood (a real eye widens) so the pupil stays visible
    apTarget = Math.max(apTarget, charge * 0.95);
    apTarget = Math.min(1, apTarget + (painT > 0 ? 0.1 : 0));
    apTarget *= 1 - dyingK * 0.85;
    aperture += (apTarget - aperture) * Math.min(1, dt * 6);
    lidPivot.position.y = lidSlide(aperture);      // slide up to peel open, down to cover (heavy-lidded)

    // ── Gaze: the pupil-SEED tracks within the almond (the player's stick drags the
    // gaze); heavy wet lag; the saccade snaps dead-centre; a flinch skitters it. ──
    const gLag = saccadeT > 0 ? 22 : (noticeT > 0 || charge > 0.4 ? 8 : 3);
    const tx = saccadeT > 0 ? 0 : gazeTX + (painT > 0 ? skitterX : 0);
    const ty = saccadeT > 0 ? 0 : gazeTY + (painT > 0 ? skitterY : 0);
    gazeX += (tx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (ty - gazeY) * Math.min(1, dt * gLag);
    seed.position.set(gazeX * A_W * 0.5, gazeY * A_H * 0.32, EYE_Z + 0.55);   // reduced vertical travel — the pupil stays in the sclera at both extremes

    // ── Seed size (BLINK-analog + CHARGE-TELL): breathes; CONSTRICTS on charge; pinned
    // on the notice saccade; blows WIDE in death. ──
    const breathe = 1 + Math.sin(time * 0.9 * TAU) * 0.04;
    const constrict = dyingK > 0 ? 1.5 : (saccadeT > 0 ? 0.55 : (1 - charge * 0.42));
    const ss = breathe * constrict;
    seed.scale.set(ss, ss, 0.5 * (dyingK > 0 ? 1.6 : 1));

    // Eye heat: idle pulse; hotter on notice; reddens toward danger on charge (wrath);
    // light going out in death.
    let eyeK = 1 + Math.sin(time * 2.6 * TAU) * 0.04;
    if (noticeT > 0) eyeK *= 1.22;
    eyeK *= 1 - dyingK * 0.6;
    _c.copy(EYE_BASE).lerp(DANGER, charge * 0.6);
    eyeMat.color.copy(_c).multiplyScalar(eyeK * EYE_HOT);

    // ── Corona: BREATHE (never spin); brighter as the eye opens + on charge; dimmer
    // when heavy-lidded (the lidded sun is dimmer). .color scales the vertex colours. ──
    const breatheC = 0.62 + Math.sin(time * 0.6 * TAU) * 0.08 + aperture * 0.3 + charge * 0.35;
    // + the S1→S2 crack flare (the sun destabilising), then FORCED DARK by the shatter (coronaDeath)
    // so the corona is dead before the backlight flash peaks (§2 additive-volume sequencing).
    const cK = (Math.max(0, breatheC) * (1 - dyingK) + coronaFlare * 0.9) * (1 - coronaDeath);
    coronaMat.color.setScalar(cK);
    lashMat.opacity = (0.35 + aperture * 0.35 + charge * 0.2) * (1 - dyingK) * (1 - coronaDeath);
    // ── The HERO FISSURE + disc cracks flare HDR through the strain (crackGlowK): a flicker LFO
    // ×the base weight → splitting light, not a drawn line. crackGlowK is 0 outside the crack. ──
    if (crackGlowK > 0) {
      const flick = 1 + Math.sin(time * 34) * 0.18 + Math.sin(time * 61) * 0.10;   // high-freq shimmer
      const g = crackGlowK * flick;
      crackMat.color.setScalar(Math.max(0.4, g));                                   // vertexColors carry the gold hue → scale brightness only
      fissureGlowMat.color.copy(crackHot).multiplyScalar(Math.max(0.5, g * 1.3));   // solid-hue strip → tint by crackHot
    }

    // Attendant motes: slow drift (a 2nd idle frequency).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(Math.cos(u.ang) * u.radius, u.baseY + Math.sin(time * 0.9 + u.tilt) * 0.6, Math.sin(u.ang) * u.radius * 0.35 + DISC_Z);
      o.rotation.x += dt * 1.3;
      o.rotation.y += dt * 1.0;
    }

    // ── STAGE 2 — the wings BREATHE, never spin (respiration = alive, rotation = machine;
    // the §3 stillness thesis: nothing translates, ever). A slow mantle oscillation of a few
    // degrees about each shoulder's base angle, tiers lagging via per-wing phase; charge
    // deepens the breath. ──
    if (stage2.visible) {
      // ── THE ALL-SNAP hold: eased weight snapK crossfades the whole field from independent
      // idle-wander to ONE locked gaze, and back. Snaps fast (dt·22), releases soft (dt·7). ──
      if (snapT > 0) snapT -= dt;
      const snapping = snapT > 0;
      snapK += ((snapping ? 1 : 0) - snapK) * Math.min(1, dt * (snapping ? 22 : 7));

      // ── The wings BREATHE (charge deepens it), MANTLE-FLARE open on charge (the mandorla
      // widens as wrath gathers), and FREEZE mid-breath on the snap (stillness makes the stare
      // total). charge 0 + snapK 0 → breath 1, zero flare → the signed-off idle unchanged. ──
      const breath = (1 + charge * 0.8) * (1 - snapK * 0.9);
      for (const s of shoulders) {
        // S1→S2 UNFURL: fold the wing toward the tight bud while unfurlK<1, cascading open per
        // foldOrder with a small overshoot; breathe is muted while folded. unfurlK=1 → fold 0 +
        // full breathe → the shipped idle byte-identical.
        const fold = s.foldZ * (1 - wingEase(unfurlK, s.foldOrder));
        s.obj.rotation.z = s.baseRotZ + fold
          + Math.sin(time * 0.2 * TAU + s.phase) * s.amp * breath * (0.25 + 0.75 * unfurlK)
          + s.flareZ * charge * 0.16
          + s.flareZ * mantleK * 0.34;   // STAGE 3: the wings THROW open (overshoot to 1.30) then settle to 0.20 — the held pose reads ≈ stage 2 at fight distance (PR-K)
      }

      // ── WRATH TELL: the whole eye field bleeds from gold toward danger-red as the charge
      // gathers (irisMat paints every peripheral + the great iris — they redden as ONE being);
      // the SNAP flares every catchlight hot. Both lerp from the captured base and return to it. ──
      irisMat.color.copy(IRIS_BASE).lerp(DANGER, charge * 0.5);
      catchMat.color.copy(CATCH_BASE).multiplyScalar(1 + snapK * 1.8);

      // ── THE STAGE-2 NIMBUS: a whisper at idle (breathing, never a metronome-bright ring),
      // swells with the wrath charge, FLARES on the all-snap (the halo ignites exactly when
      // every eye locks — the screenshot), and hands off to the stage-3 halo as k3 rises. ──
      halo2Mat.color.setScalar((0.048 + 0.012 * Math.sin(time * 0.45 * TAU) + charge * 0.16 + snapK * 0.28) * (1 - stage3K) * (1 - dyingK));   // ×0.6 idle (art-director #5) — dimmer than the eye, never the brightest thing

      // The great central eye's pupil tracks the player (the focal); constricts on charge and on
      // the S2→S3 GATHER (it recoils inward as the seraph stops watching you).
      const gk = (1 - charge * 0.3) * (1 - convergeK * 0.5);
      greatPupil.position.set(gazeX * GW * 0.24, GEY + gazeY * GH * 0.2, GF + 0.08);
      greatPupil.scale.set(GW * 0.38 * gk, GH * 0.44 * gk, 0.5);
      // Each peripheral pupil tracks the player within its own sclera, sitting proud of the
      // front. Independent per-eye LAG + a small resting BIAS make the field read as living eyes
      // that look every which way; the shared gazeX/gazeY drags them toward the player. On the
      // ALL-SNAP, snapK fades each eye's bias→0 and its lag→near-instant, so the ~9 scattered
      // gazes CONVERGE to a single dead-on lock — the reveal hold (the screenshot of the game).
      for (const p of pupils) {
        const u = p.userData;
        // S2→S3 GATHER: the pupil turns INWARD toward the core (−base·0.5), overriding the
        // player-track — the field of gazes collapses to a point (the unthinkable: it looks away).
        const cx = Math.max(-1, Math.min(1, -u.base.x * 0.5)), cy = Math.max(-1, Math.min(1, -u.base.y * 0.5));
        const tgx = (gazeX + u.biasX * (1 - snapK)) * (1 - convergeK) + cx * convergeK;
        const tgy = (gazeY + u.biasY * (1 - snapK)) * (1 - convergeK) + cy * convergeK;
        const k = Math.min(1, dt * ((2 + u.lag * 7) * (1 - snapK) + 30 * snapK));
        u.gx += (tgx - u.gx) * k;
        u.gy += (tgy - u.gy) * k;
        p.position.set(u.base.x + u.gx * u.size * 0.4, u.base.y + u.gy * u.size * 0.4 * (u.openF || 1), u.base.z + u.size * 0.62);
      }

      // ── THE RELICS: an unbranded relic breathes a dim palette pulse (collectible); a fresh brand
      // FLASHES its palette hot then decays to a steady claimed glow (the attribution beat). ──
      for (const r of relics) {
        if (r.flash > 0) r.flash = Math.max(0, r.flash - dt * 1.6);
        const pulse = r.branded ? 1.1 : (0.75 + Math.sin(time * 1.4 * TAU + r.phase) * 0.35);   // branded = steady; unbranded = a "brand me" breath
        const hot = r.baseHot * pulse + r.flash * 2.2;   // the flash rides on top
        r.glow.color.copy(r.palette).multiplyScalar(hot);
      }
    }

    // ── STAGE 3 — THE UNVEILING: the STARBURST slowly turns + pulses (radiance, never a spin-
    // machine — a gentle drift), the HALO breathes, and the STAR-EYE's pupil tracks the player.
    // Gated on stage3.visible so it costs nothing until the third form is up. ──
    if (stage3.visible) {
      starPivot.rotation.z = time * 0.06;                                  // a slow, holy drift (not a wheel)
      // Settled floor 1.0 (survives fight distance) + the S2→S3 IGNITION FLASH (HDR ×burstFlash,
      // toneMapped off → blooms hard for ~0.6s then decays to the steady radiance).
      const pulse = 1.0 + Math.sin(time * 0.8 * TAU) * 0.15 + charge * 0.3 + burstFlash;
      // ARENA (PR-B) heaven lift, layered ON the ignition flash: ×1 at heavenK 0 (byte-identical floats).
      // The halo/burst brighten so the radiance re-lengthens on the gold sky; the star-eye sclera +
      // catchlights lift only when heavenK>0.
      burstMat.color.copy(_c.set(def.accent)).multiplyScalar(pulse * (1 + heavenK * BURST_LIFT));       // wrath charge + ignition flash + heaven lift
      halo3Mat.color.copy(_c.set(def.accent)).multiplyScalar((0.8 + Math.sin(time * 0.5 * TAU) * 0.12) * (1 + heavenK * HALO_LIFT));
      if (heavenK > 0) {
        greatScleraMat.color.copy(SCLERA_BASE).multiplyScalar(1 + heavenK * SCLERA_LIFT);   // the star-eye brightens past the sky (the focal re-takes §3-law-2)
        catchMat.color.multiplyScalar(1 + heavenK * CATCH_LIFT);                            // composes with the per-frame catch write above; the seraph's eyes are the darkness's stars
      } else if (greatScleraMat.color.getHex() !== SCLERA_BASE.getHex()) {
        greatScleraMat.color.copy(SCLERA_BASE);   // one-frame restore on any heaven→off edge (dev re-pin) — byte-identical off the heaven
      }
      starPupil.position.set(gazeX * SW * 0.3, gazeY * SH * 0.28, SD + 0.1);
      const sk = 1 - charge * 0.3;                                          // constrict on charge (the star-eye shares the wrath tell)
      starPupil.scale.set(SW * 0.42 * sk, SH * 0.5 * sk, 0.4);
    }

    // ARENA rim-light + body lift + backglow — every frame; voidK/igniteK 0 ⇒ exact restore
    // (byte-identical off-arena). voidK (S2 violet rim) and igniteK (S3 gold WREATH) are MUTUALLY
    // EXCLUSIVE by construction (boss.js: voidK exhales to 0 by mix 1.45, igniteK rises 1.45→2), so
    // void wins the branch if a driver bug ever overlaps them — the test asserts they never coexist.
    if (voidK > 0) {
      rimMat.color.copy(RIM_BASE).lerp(RIM_VOID, voidK);
      rimMat.emissive.copy(RIM_EM_BASE).lerp(RIM_EM_VOID, voidK);
      rimMatB.color.copy(RIMB_BASE).lerp(RIMB_VOID, voidK);
      rimMatB.emissive.copy(RIMB_EM_BASE).lerp(RIMB_EM_VOID, voidK);
      for (const k of LADDER_KEYS) baseMats[k].color.copy(LADDER_BASE[k]).lerp(LADDER_VOID[k], voidK);
      vgMat.opacity = voidK * VOID_GLOW_MAX; voidGlow.visible = true;
    } else if (igniteK > 0) {
      // THE IGNITED SERAPH: gold-wreathed rim + violet-bronze body + roiling gold-violet mandorla.
      rimMat.color.copy(RIM_BASE).lerp(RIM_IGNITE, igniteK);
      rimMat.emissive.copy(RIM_EM_BASE).lerp(RIM_EM_IGNITE, igniteK);
      rimMatB.color.copy(RIMB_BASE).lerp(RIMB_IGNITE, igniteK);
      rimMatB.emissive.copy(RIMB_EM_BASE).lerp(RIMB_EM_IGNITE, igniteK);
      for (const k of LADDER_KEYS) baseMats[k].color.copy(LADDER_BASE[k]).lerp(LADDER_IGNITE[k], igniteK);
      igMat.uniforms.uOpacity.value = igniteK * IGNITE_GLOW_MAX; igMat.uniforms.uTime.value = time; igniteGlow.visible = true;
      wMat.uniforms.uOpacity.value = igniteK * WISP_MAX; wMat.uniforms.uTime.value = time; wisps.visible = true;   // the living wisps lick off the crown/wingtips
    } else if (voidGlow.visible || igniteGlow.visible || wisps.visible) {
      rimMat.color.copy(RIM_BASE); rimMat.emissive.copy(RIM_EM_BASE);
      rimMatB.color.copy(RIMB_BASE); rimMatB.emissive.copy(RIMB_EM_BASE);
      for (const k of LADDER_KEYS) baseMats[k].color.copy(LADDER_BASE[k]);
      vgMat.opacity = 0; voidGlow.visible = false;
      igMat.uniforms.uOpacity.value = 0; igniteGlow.visible = false;
      wMat.uniforms.uOpacity.value = 0; wisps.visible = false;
    }
  }

  const muzzle = new THREE.Object3D();
  muzzle.name = 'unmaskedMuzzle';
  muzzle.position.set(0, 0, EYE_Z + 0.9);
  group.add(muzzle);

  return {
    group, muzzle, orbiters,
    stageTransitionDur: TRANS_DURS.crack,   // legacy truthy alias — the multi-stage flag boss.js gates on (see stageTransitionSpec for real per-kind durations)
    stageTransitionSpec,                     // (n) → { dur, revealAt, throwAt?, hold, beats } for the transition INTO phase n
    setDissolve: setDissolveEmotive,
    setCharge,
    setGaze,
    notice,
    allSnap,
    setBrandedRelics,
    setArenaHeaven,
    setArenaVoid,
    setArenaIgnite,
    debugArenaLift: () => ({ k: heavenK, sclera: greatScleraMat.color.getHex() }),
    debugArenaVoid: () => ({ k: voidK, rim: rimMat.color.getHex(), rimEm: rimMat.emissive.getHex(), glow: +vgMat.opacity.toFixed(3), glowVis: voidGlow.visible }),
    debugArenaIgnite: () => ({ k: igniteK, rim: rimMat.color.getHex(), rimEm: rimMat.emissive.getHex(), glow: +igMat.uniforms.uOpacity.value.toFixed(3), glowVis: igniteGlow.visible, wispVis: wisps.visible, wispOp: +wMat.uniforms.uOpacity.value.toFixed(3) }),
    setDebugStage,
    setStageMorph,
    setStage3,
    setPhase,
    setDebugWing,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinchFlash,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
