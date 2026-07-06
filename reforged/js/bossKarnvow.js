import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// KARNVOW — "the Trophy-Hunter" (BOSS-DESIGN.md §5b/§5d slot 9, the Tier-3 band
// PEAK). The first boss that PARRIES you: a lean HOODED DUELIST riding at your
// shoulder, one long lance couched low, a swinging trophy chain of what it has
// killed. Faceless — one cold guttering glint deep in the cowl void is the mind
// behind the indifference. It does NOT tower (the roster's deliberate scale-DOWN);
// its presence is PROXIMITY + the lance+chain assembly, never bulk (L140/L141).
//
// SILHOUETTE-FIRST (§3b, Fable-gated pre-build): "a cloaked figure with a couched
// lance, keeping pace." The three OUTLINE cues: (1) THE LANCE — one long straight
// asymmetric DIAGONAL, the single longest hard edge, HELD to one side + forward-
// biased (never straddled — the anti-witch/broom forbid); (2) THE PEAKED HOOD —
// swept back/asymmetric (the void + glint are BLACK-ON-BLACK, so they live in the
// EMISSIVE layer, carried by the lit cowl rim, NOT the outline); (3) THE TROPHY
// CHAIN — skull-sized charms on a HEAVY baldric across the torso, swinging. Hard
// pauldrons (~span) + a hard-edged armored fauld taper (NO soft fade) forbid the
// floating-cloak/blob read.
//
// FOCAL (§3.2/§4b): the cold cowl-glint — small, HDR-overdriven, toneMapped=false,
// the ONE hottest point. The cowl APERTURE tracks the player (readable at the flank
// angle) but the GLINT looks PAST/THROUGH you — the indifference IS the taunt (slot
// 12 owns the mutual gaze; KARNVOW never grants it until the kill).
//
// FACELESS-CARRIER LAW (§4b) — the cowl-glint + lance language carry all seven
// charisma channels behind the unchanged setGaze/notice hooks:
//   GAZE   — the cowl turns toward you; the glint looks past (indifference-taunt),
//   BLINK  — the glint GUTTERS (dims + re-lights like a coal); rate = mood,
//   CHARGE — the LANCE rises + its TIP ignites amber as it snaps to POINT,
//   EXPRESSION — the lance language: salute (up) / point (level) / lower (couched),
//   FLINCH — the cowl RECOILS + the trophy chain SWINGS ("it felt that"),
//   NOTICE — the lance SALUTES (snaps vertical) + the glint flares once,
//   DEATH  — the lance DROPS, the charms gutter out ONE BY ONE, the glint eases
//            shut LAST (a defeated duelist releasing what it took).
//
// THE LANCE = one part, THREE jobs: the silhouette's dominant diagonal, the amber-
// emitting ORGAN (the `lanceTip` muzzle, §5f law 7), and the charge telegraph
// (`lancePivot` snaps it to point). THE SCAR (§3 law 6) = one EMPTY trophy hook —
// what it awaits is deliberately unnamed (it points at the player).
//
// CONTRACT: boss.js stomps `group.rotation` (placeGroup) and `kit.setDissolve`
// owns `group.scale` — every animated part lives on `rig`, `lancePivot`,
// `chainPivot`, or `cowlPivot`, never on `group` itself.

export function buildKarnvow(def, quality = 1) {
  const accent = def.accent ?? 0x5aa0d8;   // cold cowl-glint steel-blue — the identity + focal
  const glow = def.glow ?? 0x74b4e4;        // lighter cold steel — shield rim / shards
  const lowQ = quality < 0.75;

  // Shared plumbing. The shield bubble wraps the torso/core; the lance + chain
  // sweep outside it. hpBarY clears the cowl peak. Cold shield rim (glow) so the
  // shielded state stays cold — the amber lives ONLY on the lance-tip organ.
  const kit = createBossCommon(def, quality, { shieldRadius: 3.4, hpBarY: 5.2, hpBarZ: 1.2, hpBarScale: 0.78 });
  const { group, track } = kit;
  group.userData.archetype = 'trophyDuelist';   // guards the legacy-fallback coexist path (tests/boss.mjs)

  const rig = new THREE.Group();
  group.add(rig);

  const strip = stripForMerge;
  const mergeBody = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildKarnvow: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers (§3.4): the tarnished iron runs near-black; the cold
  // identity lives ONLY in the emissive (cowl rim + focal glint). Albedo LIFTED
  // (0x1c1e22, not pure black) so the body reads as forged metal on the pale
  // high-noon desert sky (L162), not a dead cutout. Wet/matte metal spec.
  // Near-black tarnished iron; the identity lives in the EMISSIVE (cold rim/trim/
  // glint), not the diffuse. Roughness high so the warm sun's specular doesn't bloom
  // a hot warm highlight (a false-magenta seed on the cold body); moderate metalness
  // keeps the body DARK (a low-metalness near-black floods with the biome's ambient
  // hue instead — the L162 dark-albedo lesson).
  const ironMat = track(new THREE.MeshStandardMaterial({
    color: 0x1c1e22, emissive: accent, emissiveIntensity: 0.0, roughness: 0.72, metalness: 0.4, flatShading: true,
  }));
  const cowlMat = track(new THREE.MeshStandardMaterial({
    color: 0x141518, emissive: accent, emissiveIntensity: 0.0, roughness: 0.78, metalness: 0.35, flatShading: true,
  }));
  const plateMat = track(new THREE.MeshStandardMaterial({
    color: 0x22252b, emissive: accent, emissiveIntensity: 0.0, roughness: 0.6, metalness: 0.5, flatShading: true,
  }));
  // Cold cowl RIM — the character line: a thin cold emissive band around the void
  // aperture, so the "dark aperture framed by a lit rim" reads as deliberate (not a
  // modeling hole) even black-on-black on the pale sky.
  const rimMat = track(new THREE.MeshStandardMaterial({
    color: 0x0c1016, emissive: accent, emissiveIntensity: 2.4, roughness: 0.4, metalness: 0.3, flatShading: true,
  }));

  // ---------------------------------------------------------------------
  // THE TORSO + PAULDRONS + FAULD (the "armed and armored" read, forbids the
  // floating-cloak/blob anti-read). Hard shoulders at x≈±1.15 (span guards the
  // thin-pole failure); a hard-edged faceted fauld taper BELOW — never a soft fade.
  // All one merged static body mesh on `rig` (the cowl + lance + chain animate,
  // this doesn't).
  // ---------------------------------------------------------------------
  const bodyParts = (() => {
    const parts = [];
    const upper = [];   // the clean plate subset the cold seam-trim traces — excludes the
                        // busy fauld/surcoat vertical strips (Fable #2: those drift to wireframe)
    const push = (g, isUpper) => { parts.push(g); if (isUpper) upper.push(g); };
    // Chest: a keeled armored box, tapering forward to a breastplate ridge.
    const chest = strip(new THREE.BoxGeometry(1.7, 1.9, 1.05)); chest.translate(0, 1.0, 0.05); push(chest, true);
    const breast = strip(new THREE.ConeGeometry(0.62, 1.5, 4)); breast.rotateX(Math.PI); breast.rotateY(0.78); breast.translate(0, 0.55, 0.5); push(breast, true);
    // Breastplate LAMES — 3 overlapping horizontal armor bands across the chest
    // (relief the sun can throw a value-step across, §3.4 — forged plate, not a slab).
    for (let i = 0; i < 3; i++) {
      const lame = strip(new THREE.BoxGeometry(1.5 - i * 0.12, 0.34, 0.28));
      lame.rotateX(-0.12); lame.translate(0, 1.55 - i * 0.5, 0.55);
      push(lame, true);
    }
    // Pauldrons: two hard angled shoulder masses reaching PAST the chest (span ~3.4
    // pre → ~3.5 post-scale). FACETED (icosa relief) so they read as forged plate,
    // with 2 lame bands each (the layered spaulder — armor detail, not bulk).
    const pauldron = (sx) => {
      const sub = [];
      const p = strip(new THREE.IcosahedronGeometry(0.82, lowQ ? 1 : 2)); p.scale(1.15, 0.72, 0.95);
      p.rotateZ(-sx * 0.5); p.translate(sx * 1.15, 1.72, 0.02); sub.push(p);
      for (let i = 0; i < 2; i++) {
        const lame = strip(new THREE.BoxGeometry(1.0 - i * 0.16, 0.22, 0.7));
        lame.rotateZ(-sx * 0.5); lame.translate(sx * (1.1 - i * 0.04), 1.35 - i * 0.34, 0.06);
        sub.push(lame);
      }
      return sub;
    };
    for (const g of [...pauldron(1), ...pauldron(-1)]) push(g, true);
    // A raised gorget collar bridging the pauldrons up to the cowl base (fills the
    // sky between the shoulders and the head — one connected figure, not parts).
    const gorget = strip(new THREE.CylinderGeometry(0.62, 0.82, 0.7, lowQ ? 7 : 11)); gorget.translate(0, 2.2, 0.0); push(gorget, true);
    // FAULD (the lower body): a HARD-EDGED armored taper built from VERTICAL LAME
    // plates (a segmented tasset skirt) — NEVER a soft fade (the blob forbid, §3b
    // Fable fix #3). Each lame a hard trapezoid facet = "armored", not "shapeless
    // cloak", and the many hard bottom edges give the lower outline hard points.
    // Count THINNED (Fable #2: fewer strokes so the trimmed skirt reads as armor
    // staves, not dense wireframe) but WIDER so the skirt still fills — hard tasset
    // plates, not a fringe.
    const nLame = lowQ ? 5 : 7;
    for (let i = 0; i < nLame; i++) {
      const a = (i / nLame) * Math.PI * 2;
      const lame = strip(new THREE.BoxGeometry(0.5, 3.0, 0.26));
      // Splay each plate outward-downward around the waist (a bell of hard staves).
      lame.translate(0, -1.5, 0);
      lame.rotateZ(Math.cos(a) * 0.14);
      lame.rotateX(Math.sin(a) * 0.06);
      lame.translate(Math.sin(a) * 0.72, -1.0, Math.cos(a) * 0.5);
      push(lame, true);   // trimmed: the few clean cold staves carry the cold identity robustly (G3 margin)
    }
    // Fauld LAME RINGS — 2 horizontal plate bands girdling the skirt (the tasset
    // articulation) — more forged relief + hard horizontal steps on the lower body.
    for (let i = 0; i < 2; i++) {
      const ring = strip(new THREE.CylinderGeometry(0.72 + i * 0.12, 0.8 + i * 0.12, 0.24, lowQ ? 8 : 14, 1, true));
      ring.translate(0, -0.6 - i * 0.9, 0);
      push(ring, true);   // the fauld RINGS are trimmed (clean HORIZONTAL cold bands — armor articulation,
                          // not the busy vertical wireframe of the lame edges) — restores G3 cold share
    }
    // Belt ridge (a hard step between torso + fauld — a value break, not a fade).
    const belt = strip(new THREE.CylinderGeometry(1.0, 1.0, 0.34, lowQ ? 8 : 14)); belt.translate(0, 0.35, 0.0); push(belt, true);
    // ARM COUTERS — a rerebrace + couter plate down each arm off the pauldron (the
    // armored arm that HOLDS the lance — reinforces the "armed knight" read, and the
    // right arm reaches toward the grip). Faceted icosa knuckles.
    const arm = (sx) => {
      const out = [];
      const upper = strip(new THREE.IcosahedronGeometry(0.34, lowQ ? 0 : 1)); upper.scale(0.8, 1.3, 0.8);
      upper.rotateZ(-sx * 0.4); upper.translate(sx * 1.25, 1.0, 0.28); out.push(upper);
      const couter = strip(new THREE.IcosahedronGeometry(0.3, lowQ ? 0 : 1));
      couter.translate(sx * 1.1, 0.35, 0.5); out.push(couter);
      const fore = strip(new THREE.BoxGeometry(0.3, 0.75, 0.3)); fore.rotateZ(sx * 0.25); fore.rotateX(-0.5);
      fore.translate(sx * 1.0, -0.1, 0.7); out.push(fore);
      return out;
    };
    for (const g of [...arm(1), ...arm(-1)]) push(g, true);
    // SURCOAT — a short hard-hemmed tabard hanging over the chest+fauld (a duelist's
    // surcoat, NOT a bell robe): a straight panel with a CUT hem (the Fable fauld
    // discipline — hem never bell-flares) + fold ridges. Adds silhouette + relief.
    const surcoat = strip(new THREE.BoxGeometry(1.15, 2.6, 0.16)); surcoat.rotateX(-0.05); surcoat.translate(0, -0.35, 0.66); push(surcoat, false);
    const hem = strip(new THREE.BoxGeometry(1.2, 0.2, 0.24)); hem.translate(0, -1.62, 0.68); push(hem, false);   // the hard cut hem
    for (let i = 0; i < (lowQ ? 2 : 4); i++) {
      const f = strip(new THREE.BoxGeometry(0.08, 2.4, 0.1)); f.translate(-0.4 + i * 0.26, -0.35, 0.75); push(f, false);   // surcoat fold ridges
    }
    return { bodyGeo: mergeBody(parts, 'body'), trimGeo: mergeBody(upper, 'bodyTrim') };
  })();
  const bodyGeo = bodyParts.bodyGeo;
  const body = new THREE.Mesh(bodyGeo, ironMat);
  rig.add(body);

  // Cold character-line TRIM (§3.4 "lit edges ARE the drawing" + eitherwing's
  // full-perimeter-rim lesson): a cold-accent edge overlay tracing EVERY armor seam
  // of the body. This is KARNVOW's identity carrier — a forged thing lit cold at its
  // seams — and it is what makes the boss read as its registry cold-steel hue at
  // thumbnail (G3 attribution) regardless of the biome's ambient, WITHOUT a big eye.
  // Punchy (toneMapped=false, HDR-tinted) so the emissive 207° dominates the accent
  // tier over any sky; judged on the cool LUMEN-MIRE sky so it never fringes magenta.
  const trimMat = track(new THREE.LineBasicMaterial({
    color: new THREE.Color(accent).multiplyScalar(2.5), transparent: true, opacity: 1.0, depthWrite: false,
  }));
  trimMat.toneMapped = false;
  rig.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyParts.trimGeo, 34), trimMat));   // cold seam-lines on the UPPER plate only

  // SOLID lit cold-accent SEAMS (the identity carrier — §3.4 "lit edges ARE the
  // drawing"): a forged collar band + a central chest seam + a belt band, all in the
  // bright cold rim material. SOLID (not aliasing thin lines) so they hold a STABLE,
  // dominant cold-accent share every frame (the line-trim flickers; these anchor G3),
  // and they read as a thing lit cold at its forged seams — premium, not a big eye.
  const coldSeams = new THREE.Group();
  const gorgetBand = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.06, lowQ ? 6 : 9, lowQ ? 16 : 26), rimMat);
  gorgetBand.rotation.x = Math.PI / 2; gorgetBand.position.set(0, 1.95, 0.12); coldSeams.add(gorgetBand);
  const beltBand = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.055, lowQ ? 6 : 9, lowQ ? 18 : 30), rimMat);
  beltBand.rotation.x = Math.PI / 2; beltBand.position.set(0, 0.35, 0.05); coldSeams.add(beltBand);
  const chestSeam = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.5, 0.1), rimMat);
  chestSeam.position.set(0, 1.15, 0.62); coldSeams.add(chestSeam);
  for (const sx of [-1, 1]) {   // two pauldron-crest cold seams
    const ps = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.1), rimMat);
    ps.rotation.z = -sx * 0.5; ps.position.set(sx * 1.05, 1.95, 0.2); coldSeams.add(ps);
  }
  rig.add(coldSeams);

  // Armored knee/shin points off the fauld bottom (hard silhouette points below,
  // not a curve — reinforces "armored", and gives the lower outline hard edges).
  const shinGeo = strip(new THREE.ConeGeometry(0.3, 1.1, 4));
  for (const sx of [-1, 1]) {
    const shin = new THREE.Mesh(shinGeo, plateMat);
    shin.position.set(sx * 0.42, -2.7, 0.15);
    shin.rotation.x = 0.12;
    rig.add(shin);
  }

  // ---------------------------------------------------------------------
  // THE COWL — a tall PEAKED hood swept BACK/asymmetric (never a symmetric vertical
  // cone = the wizard-hat forbid), framing a recessed dark VOID with the cold glint
  // focal. On `cowlPivot` — the aperture TRACKS the player (readable at the flank
  // angle) while the glint looks past. A LATERAL hook on the peak so the swept hood
  // still breaks the outline asymmetrically when facing the flank camera (Fable
  // condition #1).
  // ---------------------------------------------------------------------
  const cowlPivot = new THREE.Object3D();
  cowlPivot.name = 'cowlPivot';
  cowlPivot.position.set(0, 2.55, 0.1);
  rig.add(cowlPivot);

  const cowlShellGeo = (() => {
    const parts = [];
    // Hood shell: an extruded peaked profile (pointed top, flaring shoulders),
    // leaning back. Deliberately FEW points (the low-poly hood read).
    const s = new THREE.Shape();
    s.moveTo(-0.85, -0.9);
    s.lineTo(-0.72, 0.2);
    s.quadraticCurveTo(-0.55, 1.35, -0.12, 2.15);   // left cheek rising to the peak
    s.lineTo(0.18, 2.0);                             // the PEAK, offset right of centre (asymmetric)
    s.quadraticCurveTo(0.5, 1.2, 0.7, 0.1);          // right cheek
    s.lineTo(0.82, -0.9);
    s.lineTo(0.35, -0.75);
    s.quadraticCurveTo(0, -0.55, -0.35, -0.75);      // the open cowl mouth (aperture bottom)
    s.lineTo(-0.85, -0.9);
    const hood = strip(new THREE.ExtrudeGeometry(s, {
      depth: 0.9, bevelEnabled: !lowQ, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: lowQ ? 1 : 3, steps: lowQ ? 1 : 2, curveSegments: lowQ ? 3 : 6,
    }));
    hood.translate(0, 0, -0.55);
    parts.push(hood);
    // FABRIC-FOLD RELIEF (§3b band-floor detail): raised creases running up the hood
    // — the value steps that make the cowl read as cloth-over-frame at capture scale,
    // not a smooth shell. Each a thin tapered ridge following the hood rise.
    const nFold = lowQ ? 3 : 5;
    for (let i = 0; i < nFold; i++) {
      const t = i / (nFold - 1);
      const fx = -0.6 + t * 1.2;
      const fold = strip(new THREE.ConeGeometry(0.06, 2.2 - Math.abs(t - 0.5) * 1.4, 4));
      fold.rotateX(0.15); fold.translate(fx * 0.6, 0.6 + (0.5 - Math.abs(t - 0.5)) * 0.8, 0.42 - Math.abs(fx) * 0.1);
      parts.push(fold);
    }
    // Peak back-sweep + a LATERAL hook (a swept horn off the peak) — keeps the hood
    // asymmetric in the outline at the flank angle (Fable #1).
    const hook = strip(new THREE.ConeGeometry(0.2, 1.3, lowQ ? 4 : 6)); hook.rotateZ(0.5); hook.rotateX(-0.9); hook.translate(0.32, 2.35, -0.75); parts.push(hook);
    return mergeBody(parts, 'cowlShell');
  })();
  const cowlShell = new THREE.Mesh(cowlShellGeo, cowlMat);
  cowlPivot.add(cowlShell);

  // The VOID SOCKET: a RECESSED dark aperture in the hood — a short dark tube (open
  // front) sunk into the cowl so the glint sits DEEP inside a shadowed notch, NOT as
  // a lamp stuck on a smooth cone (Fable #2: the wizard-eye read). Offset LEFT of the
  // cowl centre + a diagonal BROW overhang above it give the front-on ASYMMETRY the
  // smooth cone lacked.
  const voidMat = track(new THREE.MeshStandardMaterial({ color: 0x050608, emissive: 0x000000, roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide }));
  const APX = -0.12;   // aperture offset left of centre (asymmetry)
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.5, lowQ ? 8 : 14, 1, true), voidMat);
  socket.rotation.x = Math.PI / 2;   // open toward the player (+Z)
  socket.position.set(APX, 0.55, 0.22);
  cowlPivot.add(socket);
  const voidDisk = new THREE.Mesh(new THREE.CircleGeometry(0.26, lowQ ? 8 : 14), voidMat);
  voidDisk.position.set(APX, 0.55, 0.06);   // the black back-wall of the socket
  cowlPivot.add(voidDisk);
  // Dark BROW ridge — an angled plate above the aperture that FRAMES it from the top
  // (a recessed-socket read + a diagonal that breaks the smooth-cone front) WITHOUT
  // occluding the glint from the fight camera (Fable #2 recess, but the focal must
  // still read — G1).
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.3), cowlMat);
  brow.rotation.z = 0.34; brow.rotation.x = -0.2;
  brow.position.set(APX + 0.05, 0.94, 0.42);
  cowlPivot.add(brow);

  // The cold cowl RIM — a THIN cold ring at the aperture LIP (the lit-rim character
  // line, so the recessed void reads as deliberate — NOT a big glowing eye). Small +
  // set at the socket mouth, tonemapped (stays ~207° for G3).
  const rimGeo = new THREE.TorusGeometry(0.26, 0.045, lowQ ? 5 : 8, lowQ ? 14 : 22);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(APX, 0.55, 0.36);
  cowlPivot.add(rim);

  // Cowl-opening cold trim (reuses the shared `trimMat` character-line accent).
  const addTrim = (geo, parent, x = 0, y = 0, z = 0) => {
    const seg = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), trimMat);
    seg.position.set(x, y, z);
    parent.add(seg);
    return seg;
  };
  // Cowl-opening trim (a wide cold ring at the hood mouth — the biggest cold line).
  addTrim(new THREE.TorusGeometry(0.6, 0.02, 4, lowQ ? 12 : 20), cowlPivot, -0.05, 0.25, 0.36);

  // THE ONE FOCAL — the cold glint deep in the void: a SMALL, white-hot HDR sphere
  // (toneMapped=false) so it clears the G1 focal law as the hottest point while the
  // COLD identity is carried by the rim + trim. It slides slightly to look PAST the
  // player (the glint never grants the mutual look — indifference).
  // Cold-white core: white-hot enough to clear the G1 focal law, tinted cold so the
  // focal still reads as a cold glint (the cold identity is reinforced by the
  // rim/trim). Judged over the cool LUMEN-MIRE sky (the gate's temperature-complement
  // pairing, DIST[karnvow]) so the cold bloom never fringes false-magenta.
  const GLINT_BASE = new THREE.Color(accent).lerp(new THREE.Color(0xffffff), 0.45);
  const GLINT_HOT = 4.2;
  const glintMat = track(new THREE.MeshBasicMaterial({ color: accent }));
  glintMat.toneMapped = false;
  glintMat.color.copy(GLINT_BASE).multiplyScalar(GLINT_HOT);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.14, lowQ ? 6 : 12, lowQ ? 6 : 10), glintMat);
  glint.position.set(APX, 0.55, 0.36);   // at the socket MOUTH (framed by the dark socket + brow = recessed read,
                                         // but the face is visible to the fight camera so the focal reads — G1)
  cowlPivot.add(glint);

  // ---------------------------------------------------------------------
  // THE LANCE — Voidmaw's snapped-horn tube-taper kernel (reused): a long straight
  // tapered tube on `lancePivot` at the GRIP (right shoulder/hip, ONE side), the
  // shaft biasing FORWARD (+Z) — no aft overhang past the grip (the anti-broom
  // forbid). Held LOW/couched at rest; `setCharge` snaps it to POINT (the telegraph
  // + silhouette change). A violet-scar seam (Voidmaw's) runs the shaft; the TIP is
  // the amber-emitting ORGAN (`lanceTip` muzzle) + charge-tell.
  // ---------------------------------------------------------------------
  const lancePivot = new THREE.Object3D();
  lancePivot.name = 'lancePivot';
  lancePivot.position.set(1.15, 0.95, 0.35);   // the grip, on the figure's right
  rig.add(lancePivot);

  // Manual taper (THREE.TubeGeometry has no radius falloff): scale each ring toward
  // the curve centreline — thick at the guard, thin at the point (the bossIdol
  // horn-kernel idiom).
  function taperTube(geo, curve, tubularSegments, radialSegments, taperFn) {
    const pos = geo.attributes.position;
    const ringVerts = radialSegments + 1;
    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments;
      const c = curve.getPointAt(u);
      const k = taperFn(u);
      for (let j = 0; j < ringVerts; j++) {
        const idx = i * ringVerts + j;
        if (idx >= pos.count) continue;
        pos.setXYZ(idx, c.x + (pos.getX(idx) - c.x) * k, c.y + (pos.getY(idx) - c.y) * k, c.z + (pos.getZ(idx) - c.z) * k);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  const LANCE_LEN = 5.6;
  const lanceCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),                       // the guard (at the grip pivot)
    new THREE.Vector3(0.05, 0.02, LANCE_LEN * 0.5),   // straight forward
    new THREE.Vector3(0.1, 0.0, LANCE_LEN),           // the point
  ]);
  const lanceTubular = lowQ ? 16 : 30, lanceRadial = lowQ ? 8 : 14;
  const lanceGeo = new THREE.TubeGeometry(lanceCurve, lanceTubular, 0.24, lanceRadial, false);
  taperTube(lanceGeo, lanceCurve, lanceTubular, lanceRadial, (u) => Math.max(0.12, 1 - u * 0.72));
  const lance = new THREE.Mesh(lanceGeo, plateMat);
  lancePivot.add(lance);

  // The vamplate (hand-guard cone at the grip) — a hard flare that says "couched
  // lance / jousting" and thickens the base of the diagonal in the outline.
  const vamplate = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, lowQ ? 6 : 10), ironMat);
  vamplate.rotation.x = Math.PI / 2;
  vamplate.position.set(0, 0, 0.55);
  lancePivot.add(vamplate);

  // HORN-RIDGE detail (§3b band-floor: "the lance's horn detail") — a spiral of small
  // ridge facets wound up the shaft, so the lance reads as a taken/forged horn-lance
  // (the trophy-hunter wears the horn it took) rather than a plain pole. Merged into
  // one mesh on plateMat.
  const ridgeGeo = (() => {
    const rp = [];
    const nRidge = lowQ ? 8 : 16;
    for (let i = 0; i < nRidge; i++) {
      const u = 0.08 + (i / nRidge) * 0.82;
      const c = lanceCurve.getPointAt(u);
      const rad = Math.max(0.12, 1 - u * 0.72) * 0.24;
      const a = u * 22;   // the winding
      const seg = strip(new THREE.BoxGeometry(0.09, 0.09, 0.14));
      seg.translate(c.x + Math.cos(a) * rad, c.y + Math.sin(a) * rad, c.z);
      rp.push(seg);
    }
    return mergeBody(rp, 'lanceRidge');
  })();
  lancePivot.add(new THREE.Mesh(ridgeGeo, plateMat));

  // Violet-scar SEAM (Voidmaw's) — a thin emissive line down the shaft (satellite
  // law: kept DIM so it never competes with the cold identity or the amber tip).
  const seamMat = track(new THREE.LineBasicMaterial({ color: 0x8a5cff, transparent: true, opacity: 0.35, depthWrite: false }));
  const seamPts = [];
  for (let i = 0; i <= 8; i++) { const u = i / 8; const p = lanceCurve.getPointAt(u); seamPts.push(new THREE.Vector3(p.x, p.y + Math.max(0.12, 1 - u * 0.72) * 0.24, p.z)); }
  const seam = new THREE.LineSegments(
    (() => { const g = new THREE.BufferGeometry().setFromPoints(seamPts); const idx = []; for (let i = 0; i < seamPts.length - 1; i++) idx.push(i, i + 1); g.setIndex(idx); return g; })(),
    seamMat,
  );
  lancePivot.add(seam);

  // THE LANCE TIP — the amber-emitting ORGAN (§5f law 7) + the charge-tell. An
  // ISOLATED HDR amber material (base = REFLECT_COLOR 0xffc23c, the sanctioned §5i.C.3
  // organ — NOT def.glow, so parry-amber never bleeds onto the body/shield). Ignites
  // amber as the lance snaps to point; dim at rest.
  const TIP_BASE = new THREE.Color(0xffc23c);
  const tipMat = track(new THREE.MeshBasicMaterial({ color: 0xffc23c }));
  tipMat.toneMapped = false;
  tipMat.color.copy(TIP_BASE).multiplyScalar(0.35);   // dim at rest — ignites on charge
  const lanceTip = new THREE.Object3D();
  lanceTip.name = 'lanceTip';                          // the def.muzzle emitter + charge-tell node
  lanceTip.position.set(0.1, 0, LANCE_LEN + 0.15);
  const tipMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), tipMat);
  lanceTip.add(tipMesh);
  lancePivot.add(lanceTip);

  // Couched rest pose vs the point pose (the charge target). Held LOW + angled
  // DOWN-AND-OUT so the shaft reads as a hard DIAGONAL even from the FRONT (Fable #2:
  // a near-vertical couch read as a wizard's staff). Pitched down ~52° + yawed out to
  // the boss's right so a good length of the shaft lives in the screen plane, not
  // foreshortened at the camera; snaps to LEVEL point on charge.
  const LANCE_REST = new THREE.Euler(0.92, 0.5, 0.1);      // couched low, angled down-and-out (the diagonal)
  const LANCE_POINT = new THREE.Euler(-0.05, 0.06, 0.02);  // leveled forward at you
  const LANCE_SALUTE = new THREE.Euler(-1.35, 0.05, 0.05); // snapped near-vertical (notice salute)
  lancePivot.rotation.copy(LANCE_REST);

  // ---------------------------------------------------------------------
  // THE TROPHY CHAIN — a HEAVY baldric strap across the torso (from the LEFT
  // shoulder, opposite the lance grip — Fable condition #2, keeps the chain's swing
  // clear of the lance edge so "pole + dangles" never reads as broom-bristles) with
  // skull-sized charms hanging off it at the right hip on `chainPivot` (they SWING).
  // Each charm emits LOW in its owed boss's palette (satellite law ≤0.25); one is
  // the EMPTY HOOK (the §3 scar — what it awaits is unnamed).
  // ---------------------------------------------------------------------
  // The baldric strap (a heavy diagonal band L-shoulder → R-hip), static on rig.
  const strapMat = track(new THREE.MeshStandardMaterial({ color: 0x101216, emissive: accent, emissiveIntensity: 0.05, roughness: 0.75, metalness: 0.3, flatShading: true }));
  const strapGeo = (() => {
    const parts = [strip(new THREE.BoxGeometry(0.26, 3.4, 0.16))];
    // LINK BEADS studding the baldric (chain density — "many small hard points" =
    // the lore weight the brief wants spent on the chain).
    const nBead = lowQ ? 6 : 11;
    for (let i = 0; i < nBead; i++) {
      const b = strip(new THREE.IcosahedronGeometry(0.09, 0)); b.translate(0, -1.5 + i * 0.3, 0.1);
      parts.push(b);
    }
    return mergeBody(parts, 'strap');
  })();
  const strap = new THREE.Mesh(strapGeo, strapMat);
  strap.position.set(-0.15, 0.5, 0.62);
  strap.rotation.z = 0.62;   // the diagonal across the chest
  rig.add(strap);

  const chainPivot = new THREE.Object3D();
  chainPivot.name = 'chainPivot';
  chainPivot.position.set(0.66, -0.35, 0.6);   // the right hip where the baldric ends — pulled IN so the
                                               // charms overlap the body/fauld outline (Fable #2: not floating orbs)
  rig.add(chainPivot);

  // Charm palette: owed-boss glints (§5b lore web) at low intensity + the EMPTY HOOK.
  // [hue, isHook]. The feather-blade (ashtalon ember), voidmaw violet, a cold relic,
  // and the empty hook (unlit — the scar). Kept to trophy-scale hard points.
  const charmSpecs = [
    { color: 0xff6a30, len: 0.7, kind: 'blade' },   // Ashtalon's snapped feather-blade (ember)
    { color: 0x8a5cff, len: 0.55, kind: 'shard' },  // Voidmaw's violet relic
    { color: 0x2ad0c0, len: 0.5, kind: 'shard' },   // a teal relic (a felled tenant)
    { color: 0x69c94f, len: 0.5, kind: 'shard' },   // a green relic (Craghold lineage)
    { color: 0xffd27a, len: 0.45, kind: 'ring' },   // a dull gilt trophy-ring
    { color: 0x000000, len: 0.6, kind: 'hook' },    // the EMPTY HOOK — the scar (unlit, unnamed)
  ];
  const charms = [];
  const nCharm = lowQ ? 4 : charmSpecs.length;
  for (let i = 0; i < nCharm; i++) {
    const spec = charmSpecs[i];
    const hang = new THREE.Object3D();          // per-charm hang pivot (each swings a beat apart)
    // Tight cluster hugging the hip so the charms OVERLAP the body outline + each
    // other (a worn chain, not detached orbs) — short drops, small spread.
    hang.position.set(-0.05 + i * 0.2, -0.05 - (i % 2) * 0.22, 0.02);
    // A VISIBLE heavy chain link down to the charm (a thin dark bar, not a hairline —
    // Fable #2: the strap must physically connect the charm to the baldric).
    const linkMat = track(new THREE.MeshStandardMaterial({ color: 0x26282e, roughness: 0.7, metalness: 0.45, flatShading: true }));
    const dropLen = 0.34 + (i % 2) * 0.22;
    const link = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, dropLen, lowQ ? 4 : 5), linkMat);
    link.position.y = -dropLen / 2;
    hang.add(link);
    // The charm mesh — trophy-scale hard point, low emissive in its owed palette
    // (the hook is unlit iron).
    const isHook = spec.kind === 'hook';
    const charmMat = track(new THREE.MeshStandardMaterial({
      color: isHook ? 0x1a1c20 : 0x0e0f12, emissive: isHook ? 0x000000 : spec.color,
      // Satellite law: kept DIM at idle so the owed-palette dots never rival the cold
      // identity OR pollute the palette gate (the owed-palette moment is the CP2
      // entrance charm-FLARE, §5j — that's where each trophy's colour is read loud).
      emissiveIntensity: isHook ? 0.0 : 0.06, roughness: 0.6, metalness: 0.4, flatShading: true,
    }));
    let cg;
    if (spec.kind === 'blade') { cg = new THREE.ConeGeometry(0.16, spec.len, lowQ ? 3 : 4); }   // a snapped feather-blade
    else if (spec.kind === 'hook') { cg = new THREE.TorusGeometry(0.2, 0.06, lowQ ? 5 : 8, lowQ ? 8 : 14, Math.PI * 1.3); }  // an OPEN hook (a C, not closed)
    else if (spec.kind === 'ring') { cg = new THREE.TorusGeometry(0.19, 0.05, lowQ ? 5 : 8, lowQ ? 10 : 16); }                // a trophy-ring
    else { cg = new THREE.IcosahedronGeometry(spec.len * 0.5, lowQ ? 1 : 2); }                // a faceted relic shard
    const charm = new THREE.Mesh(cg, charmMat);
    charm.position.set(0, -dropLen - 0.2, 0);
    hang.add(charm);
    chainPivot.add(hang);
    charms.push({ hang, mat: charmMat, isHook, base: spec.color, phase: i * 1.7 });
  }

  // ---------------------------------------------------------------------
  // ORBITERS — 2 dark ash-motes drifting near the hunter (the orbiter contract ≥2;
  // satellites stay DARK, ei ≤0.05, so they never rival the focal glint).
  // ---------------------------------------------------------------------
  const moteMat = track(new THREE.MeshStandardMaterial({ color: 0x0a0b0d, emissive: accent, emissiveIntensity: 0.04, roughness: 0.9, metalness: 0.1, flatShading: true }));
  const moteGeo = strip(new THREE.OctahedronGeometry(0.22, 0));
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat);
    m.userData = { ang: (i / 3) * Math.PI * 2 + 0.7, radius: 1.5 + i * 0.5, speed: 0.7 + i * 0.2, baseY: -0.5 - i * 0.4, tilt: i * 0.8 };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the cowl RIM (the cold character line flares on a hit — "it felt
  // that" — never lighting the whole dark body).
  kit.flashBind(rimMat, 0.9);
  kit.finalize();

  // ---------------------------------------------------------------------
  // ANIMATION — the lance language (couch/point/salute/lower), the cowl-glint
  // charisma, the swinging chain, and the death choreography.
  // ---------------------------------------------------------------------
  let charge = 0;
  function setCharge(k) { charge = Math.max(0, Math.min(1, k)); }

  let tell = null;
  function setAttackTell(id) { tell = id || null; }

  // --- Charisma: the cowl tracks the player; the glint looks past ---
  let gazeTX = 0, gazeTY = 0, gazeX = 0, gazeY = 0;
  let lookAwayT = 0, lookAwayX = 0, lookAwayY = 0;
  let nextLookAway = 4 + Math.random() * 5;
  function setGaze(nx, ny) {
    gazeTX = Math.max(-1, Math.min(1, nx));
    gazeTY = Math.max(-1, Math.min(1, ny));
  }
  // Guttering-coal blink: the glint dims + re-lights on its own clock (rate = mood).
  let gutterT = 0, nextGutter = 2.5 + Math.random() * 2.5;
  const GUTTER_DUR = 0.3;
  let noticeT = 0;
  function notice() { noticeT = 1.0; gutterT = 0; nextGutter = 3; }
  let painT = 0;
  function flinch(amt) { if (amt > 0.3) painT = Math.max(painT, 0.34); kit.flash(amt); }
  let dyingK = 0;
  // Death: the lance drops + clatters, the charms gutter out ONE BY ONE, the glint
  // eases shut LAST. `charmsOut` counts how many have died.
  function setDissolveEmotive(k) { dyingK = Math.max(0, Math.min(1, k)); kit.setDissolve(k); }

  function tickBody(dt, time) {
    // Idle: a slow lean/breathe (root never animates — placeGroup owns it). KARNVOW
    // leans into its lane (a duelist's forward-bias), deepening in death (it sags).
    rig.rotation.z = -0.06 + Math.sin(time * 0.5) * 0.012;
    rig.rotation.x += ((dyingK * 0.28) - rig.rotation.x) * Math.min(1, dt * 3);

    // --- Gaze: the cowl turns toward the player with LAG + look-aways (the hunter
    // sizing you up — but it looks THROUGH you, never granting the mutual gaze). ---
    nextLookAway -= dt;
    if (lookAwayT > 0) lookAwayT -= dt;
    else if (nextLookAway <= 0 && charge < 0.2 && noticeT <= 0 && dyingK <= 0) {
      lookAwayT = 0.8 + Math.random() * 0.7;
      lookAwayX = (Math.random() - 0.5) * 1.6;   // glances at its own chain / the lane ahead
      lookAwayY = Math.random() * 0.4 - 0.2;
      nextLookAway = 4 + Math.random() * 5;
    }
    const gx = lookAwayT > 0 ? lookAwayX : gazeTX;
    const gy = lookAwayT > 0 ? lookAwayY : gazeTY;
    const gLag = (noticeT > 0 || charge > 0.5) ? 8 : 4;
    gazeX += (gx - gazeX) * Math.min(1, dt * gLag);
    gazeY += (gy - gazeY) * Math.min(1, dt * gLag);

    // The COWL turns toward the gaze so the aperture (+ focal) stays readable at the
    // flank angle; the glint SLIDES to look PAST you (offset from the true track —
    // the indifference-taunt).
    cowlPivot.rotation.y = gazeX * 0.5;
    cowlPivot.rotation.x = -gazeY * 0.28;
    glint.position.x = APX + gazeX * 0.12 + 0.05;   // biased PAST the player's line (indifference)
    glint.position.y = 0.55 + gazeY * 0.07;

    // --- Guttering glint (blink-analog): dims + re-lights like a coal. Rate rises
    // under pressure (fast-guttering); flares on notice; eases shut LAST in death. ---
    if (gutterT > 0) gutterT -= dt;
    else {
      nextGutter -= dt;
      const moody = charge > 0.4 ? 1.6 : 1;   // fast-guttering under pressure
      if (nextGutter <= 0 && dyingK <= 0) { gutterT = GUTTER_DUR; nextGutter = (2.5 + Math.random() * 2.5) / moody; }
    }
    const gutterProg = gutterT > 0 ? 1 - Math.abs((gutterT / GUTTER_DUR) * 2 - 1) : 0;
    if (painT > 0) painT -= dt;
    if (noticeT > 0) noticeT -= dt;
    let glintK = (1 - gutterProg * 0.75) * (1 + charge * 0.3);
    if (noticeT > 0.6) glintK *= 1.5;
    // Death: the glint eases shut LAST (holds until dyingK is nearly full).
    glintK *= Math.max(0, 1 - Math.max(0, dyingK - 0.6) / 0.4);
    glintMat.color.copy(GLINT_BASE).multiplyScalar(Math.max(0.06, glintK) * GLINT_HOT);

    // --- The LANCE language: couch (rest) → point (charge) → salute (notice) →
    // lower (death). setCharge snaps it to POINT — the silhouette change (telegraph
    // gate) + the amber tip igniting. ---
    let target = LANCE_REST, poseSpeed = 6;
    if (dyingK > 0.15) { target = new THREE.Euler(1.35, -0.2, 0.15); poseSpeed = 4; }   // dropped + clattered
    else if (noticeT > 0.5) { target = LANCE_SALUTE; poseSpeed = 16; }                  // the salute (respect)
    else if (charge > 0.02) {                                                            // snap to POINT
      target = new THREE.Euler(
        LANCE_REST.x + (LANCE_POINT.x - LANCE_REST.x) * charge,
        LANCE_REST.y + (LANCE_POINT.y - LANCE_REST.y) * charge,
        LANCE_REST.z + (LANCE_POINT.z - LANCE_REST.z) * charge,
      );
      poseSpeed = 18;
    }
    const le = Math.min(1, dt * poseSpeed);
    lancePivot.rotation.x += (target.x - lancePivot.rotation.x) * le;
    lancePivot.rotation.y += (target.y - lancePivot.rotation.y) * le;
    lancePivot.rotation.z += (target.z - lancePivot.rotation.z) * le;

    // The amber lance-TIP ignites as it snaps to point (the amber-organ tell); dim
    // at rest; a hot flash on notice; guttering out in death.
    let tipK = 0.35 + charge * 1.9;
    if (noticeT > 0.6) tipK = Math.max(tipK, 1.6);
    tipK *= 1 - dyingK * 0.85;
    tipMat.color.copy(TIP_BASE).multiplyScalar(Math.max(0.1, tipK));

    // --- The cowl RECOIL (flinch/notice) + the whole rig kicks back. ---
    const recoil = (painT > 0 ? painT / 0.34 : 0) * 0.35 + (noticeT > 0.6 ? (noticeT - 0.6) / 0.4 : 0) * 0.25;
    rig.position.z = -recoil;
    cowlPivot.position.y = 2.55 - recoil * 0.4;   // the hood jerks back

    // --- The trophy CHAIN: an idle sway (the pace) + a hard SWING on flinch/notice
    // (the impact). In death, the charms gutter out ONE BY ONE. ---
    const swing = Math.sin(time * 1.6) * 0.08 + (painT > 0 ? Math.sin(time * 20) * 0.4 * (painT / 0.34) : 0)
      + (noticeT > 0.6 ? Math.sin(time * 14) * 0.3 : 0);
    chainPivot.rotation.z = swing;
    chainPivot.rotation.x = rig.rotation.z * 0.5;   // hangs with gravity as the body leans
    charms.forEach((c, i) => {
      c.hang.rotation.z = Math.sin(time * (1.4 + i * 0.2) + c.phase) * 0.12 * (1 + (painT > 0 ? 3 : 0));
      if (!c.isHook) {
        // Idle: a low emissive pulse in the owed palette. Death: gutter out staggered
        // (charm i dies as dyingK crosses (i+1)/(nCharm+1)) — the trophies freed.
        const dieThresh = (i + 1) / (charms.length + 1.5);
        const alive = dyingK < dieThresh ? 1 : Math.max(0, 1 - (dyingK - dieThresh) / 0.12);
        c.mat.emissiveIntensity = (0.06 + Math.sin(time * 1.6 + c.phase) * 0.02) * alive;
      }
    });

    // Ash-motes drift near the body (dark, dim — never a false glint).
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed;
      o.position.set(
        Math.cos(u.ang) * u.radius,
        u.baseY + Math.sin(time * 1.4 + u.tilt) * 0.5,
        0.3 + Math.sin(u.ang) * u.radius * 0.3,
      );
      o.rotation.x += dt * 1.6;
      o.rotation.y += dt * 1.2;
    }
  }

  // Muzzle: fire originates from the lance tip (the organ). On `group` (not `rig`)
  // so it ignores idle sway — a stable controller ref; partWorldPos('lanceTip')
  // gives the LIVE tip (post-charge) for the aim solve.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(1.3, 0.2, 4.0);
  group.add(muzzle);

  // partWorldPos: resolve a named node's world position (the def.muzzle 'lanceTip'
  // aim anchor — the live, post-charge tip). Guarded/optional in boss.js.
  const _v = new THREE.Vector3();
  function partWorldPos(name, targetVec) {
    let found = null;
    group.traverse((o) => { if (!found && o.name === name) found = o; });
    const out = targetVec || _v;
    if (found) found.getWorldPosition(out); else muzzle.getWorldPosition(out);
    return out;
  }

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setGaze,
    notice,
    partWorldPos,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash: flinch,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    },
  };
}
