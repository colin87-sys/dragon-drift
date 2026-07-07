import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge, makeEnergyShell } from './bossKit.js';

// WEFTWITCH — "the Mender" (BOSS-DESIGN.md §5b/§5d slot 11, a Tier-4 WORLD-ENDER).
// A hooded, LEGLESS weaver-bust at the hub of a web that spans the whole arena.
// Her presence is the FIELD (the web), not her body mass (L141): a medium bust that
// reads HUGE because the threads fill the frame. Judge her grandeur on the in-game
// field-frame, NOT the studio bust sheet (the studio auto-centres a modest figure).
//
// SILHOUETTE (§3b sheet — Fable-PASSED after the pre-build gate moved the arms):
//   READS AS — a hooded figure with a CROWN of arms weaving a web that fills the sky.
//   CARRYING CUES (must reach the OUTLINE): (1) the hooded triangular mantle BUST —
//   NO legs, only a smooth tapering shroud below — with 2 OVERSIZED HANDS held WIDE,
//   a taut thread strung between them; (2) the 6 spinneret-arms fanning UPWARD in a
//   crown/halo ABOVE the shoulder line (a ≤180° arc, nothing limb-like below
//   horizontal); (3) the WEB — taut SPOKES radiating to off-screen anchors, filling
//   the frame.
//   ANTI-READS — NOT a SPIDER (the ONLY limbs are the upward crown; a smooth legless
//   taper below; limb grammar ≠ thread grammar — thick S-curved arms vs hairline
//   dead-straight threads; the web is spokes + a scattered warp lattice, never
//   concentric orb rings). NOT a generic witch (the crown + web + strung-thread hands
//   make her specific). NOT KARNVOW (slot 9, also hooded — a lance-duelist with ONE
//   dominant diagonal; WEFTWITCH is a crown of MANY arms + a web, no single diagonal).
//   THE INVIOLABLE RULE (the pre-build Fable gate): NO limb ever drops below
//   horizontal — never pull an arm down to "balance" the lower frame (that re-creates
//   the spider). The scar-limb hangs limp+kinked AMONG the crown, never a straight
//   diagonal (a KARNVOW echo).
//   LIT-EDGE — the taut thread pulled tight + FLASHED HDR (the laserLance, the
//   brightest moment) + a restrained accent glow at the loom-heart/hands. Moth-grey
//   body near-black; the WEB is the lit "drawing" that fills the arena.
//   SCALE — medium bust, arena-spanning web (L141). She descends from ABOVE.
//   HOME — a mid/light sky (Astral, tenant).
//
// §4b (faceless — her HANDS are the FACE): the two pale hands orient toward the lane
// she is about to stitch (where the hands work = where she "looks"); the hood tilts to
// follow with LAG. Charge = the hands PULL a thread taut + it flashes amber. Notice =
// the hands STOP and one long finger points straight DOWN. Death = the hands fall open
// and slack, the web goes limp and drifts DOWN (un-weaving), the loom-heart dims last.
// SCAR (§3.6) — one snapped/withered 6th spinneret: she works with 5, the 6th hangs
// dead and threadless (the limb that would have mended the one tear she can't fix →
// slot 14's entry wound).
//
// CONTRACT: boss.js stomps `group.rotation` (placeGroup) and `kit.setDissolve` owns
// `group.scale` — every animated part lives on `rig`, the `hoodPivot`, the
// `handPivotL/R`, the `spinneretPivot0..5`, the `threadPivot`, or the drift orbiters;
// never on `group` itself. Every material goes through `kit.track()`.

export function buildWeftwitch(def, quality = 1) {
  const accent = def.accent ?? 0xe9d8a6;    // pale-gold woven-thread (Decision C — off the rose-triple)
  const glow = def.glow ?? 0xf4ead0;        // moon-white-gold (shield rim / shards / loom backlight)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);

  // The shield wraps the WEAK POINT — the loom-heart at the hub. hpBarScale counters
  // the def.scale; hpBarY clears the crown of arms. A low rim strength so the loom-
  // heart stays the hottest point even while shielded (§3.2); the dark cage carries
  // the "shield" read on both the mid and dark skies.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 5.2, shieldY: 3.5, hpBarY: 17.5, hpBarZ: 4.0, hpBarScale: 0.62,
    shieldRimStrength: 0.34, shieldCageOpacity: 0.34,
  });
  const { group, track } = kit;
  group.userData.archetype = 'weftwitch';
  const rig = new THREE.Group();
  group.add(rig);

  const mergeWw = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildWeftwitch: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ==================================================================
  // MATERIALS — moth-grey near-black shroud in painted VALUE tiers (§3.4); the
  // pale-gold accent lives in the rosette-knots, the loom-heart, and the thread
  // flash — NEVER the body. The hands are a lifted moth-pale (they are the face).
  // The WEB is LineSegments (overdraw-exempt — spend freely).
  // ==================================================================
  // moth-grey COOL near-black (a faint blue cast, hue ≈215° — deliberately NOT a
  // purple-grey, which drifts red-pixels into the danger-magenta band, bossgate G3).
  const shroudDeepMat = track(new THREE.MeshStandardMaterial({ color: 0x101216, emissive: 0x0a0c10, emissiveIntensity: 0.05, roughness: 0.86, metalness: 0.04, flatShading: true }));
  const shroudMat = track(new THREE.MeshStandardMaterial({ color: 0x1a1c22, emissive: 0x0f1218, emissiveIntensity: 0.06, roughness: 0.82, metalness: 0.05, flatShading: true }));
  const shroudHiMat = track(new THREE.MeshStandardMaterial({ color: 0x282b34, emissive: 0x161a22, emissiveIntensity: 0.08, roughness: 0.78, metalness: 0.06, flatShading: true }));
  // the hooded APERTURE — a dark void where a face would be (she has none; the hands
  // are the face). Emissive-black so it stays a pit even under the front sun.
  const voidMat = track(new THREE.MeshBasicMaterial({ color: 0x070609 }));
  // THE HANDS — moth-pale COOL grey (a lifted value so they read as the focal; a cool
  // cast so they never drift into the danger band), a faint gold rim so the "pale
  // weaving hands" cue survives at distance without being additive.
  const handMat = track(new THREE.MeshStandardMaterial({ color: 0x9498a6, emissive: 0x1c2230, emissiveIntensity: 0.12, roughness: 0.6, metalness: 0.06, flatShading: true }));
  // THE ROSETTE-KNOTS + spinneret tips — the pale-gold accent carriers (LORE in the
  // knots: motifs of what she's mended). Emissive-on-standard, NOT additive (overdraw).
  // Emissive kept MODERATE so the gold holds its hue rather than blooming to white
  // (bossgate G3 attribution — the accent must READ as gold, not desaturate).
  const knotMat = track(new THREE.MeshStandardMaterial({ color: 0x4a3c1c, emissive: accent, emissiveIntensity: 0.8, roughness: 0.5, metalness: 0.1, flatShading: true }));
  // THE CROWN ARMS — moth-grey with a faint SELF-LIT gold emissive so they read as a
  // radiant crown on a DARK sky (without it the arms vanish and only the gold tips
  // float — the crown cue dies at night; Fable CP1 gate). Kept dim so it's a lit edge,
  // not a toy-bright body (§3.3).
  const armMat = track(new THREE.MeshStandardMaterial({ color: 0x24222c, emissive: accent, emissiveIntensity: 0.22, roughness: 0.62, metalness: 0.08, flatShading: true }));
  // THE LOOM-HEART — the restrained accent glow at the hub (the emitter organ + the
  // weak point + the flash-bound "core" read). ONE bounded additive volume.
  const loomBase = new THREE.Color(accent);
  const loomMat = track(new THREE.MeshStandardMaterial({ color: 0x3a3018, emissive: accent, emissiveIntensity: 1.3, roughness: 0.45, metalness: 0.0, flatShading: true }));
  // the loom-heart's white-hot core (the single G1 focal — the hottest point on
  // screen). toneMapped:false so it punches past 1.0; it must sit IN FRONT of the
  // knot (not buried inside it) or it never reaches the camera.
  const CORE_HOT = 15.0;
  const loomCoreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff })); loomCoreMat.toneMapped = false; loomCoreMat.color.setScalar(CORE_HOT);
  // THE WEB — hairline dead-straight spokes (the field). Two weights: a dim warp
  // fill + a brighter hero subset (a two-value read so the field survives at glance
  // distance). LineBasicMaterial — overdraw-exempt. Deliberately PALE + LOW-SATURATION
  // (moon-gold, not saturated gold): thin saturated gold lines over a dark sky throw
  // magenta-ish antialiased edges (bossgate G3 danger-band) — the field is carried by
  // pale threads; the SOLID knots/tips carry the saturated-gold accent attribution.
  // A TWO-VALUE web (L122 two-way luminance edge): a DARK warp fill that reads as dark
  // lines on a BRIGHT/sunset sky + a PALE hero subset that reads on a DARK sky — so the
  // field survives on both (Fable CP1 gate: the pale-only web washed out on the sunset).
  const webDimMat = track(new THREE.LineBasicMaterial({ color: 0x2a2416, transparent: true, opacity: 0.55, depthWrite: false }));
  const webHeroMat = track(new THREE.LineBasicMaterial({ color: 0xe4d7ac, transparent: true, opacity: 0.74, depthWrite: false }));
  // THE TAUT THREAD between the hands (the charge tell → the laserLance HDR flash).
  // toneMapped:false so it can flash PAST 1.0 (a hard lit line, not a volume) — the
  // brightest moment, still G3-safe (pale-gold hue, far from danger-magenta).
  const tautMat = track(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.0, depthWrite: false })); tautMat.toneMapped = false;
  const cageMat = track(new THREE.LineBasicMaterial({ color: 0x0a0910, transparent: true, opacity: 0.8, depthWrite: false }));

  // ==================================================================
  // GEOMETRY — the bust faces +Z (the player). Local units; def.scale (≈1.3) → arena
  // scale. Bust ~y[-12..8]; shoulder line y≈6; the crown of arms fans y[6..16] in a
  // ≤180° arc above the shoulder; the web radiates from the hub to off-screen.
  // ==================================================================

  // ---- THE MANTLE BUST — a hooded triangular shroud (wide at the shoulders,
  // tapering to a smooth legless train below). Sculpted from a sphere: pinched to a
  // vertical wedge, front flattened to a mantle plane, a smooth point below (NO legs).
  const MW = 7.2, MH = 12.0, MD = 5.2;   // half-width / half-height / half-depth
  const shroudBase = new THREE.SphereGeometry(1, lowQ ? 18 : 26, lowQ ? 14 : 20);
  {
    const pos = shroudBase.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= MW; v.y *= MH; v.z *= MD;
      const ty = v.y / MH, tz = v.z / MD;
      // TRIANGULAR MANTLE: narrow HARD toward the top (the hood peak) and taper to a
      // smooth POINT at the bottom (the legless train) — a wedge, not an egg. The hard
      // taper is what stops the "bulbous body" spider read.
      const widen = ty > 0 ? Math.pow(1 - ty * 0.72, 1.2) : (1 + ty * 0.5);   // shoulders widest ~y0, hood pinched, train pointed
      v.x *= Math.max(0.08, widen);
      // pull the upper body toward a HOOD PEAK (a ridge at the top-centre) so the
      // crown of the silhouette comes to a point, not a dome.
      if (ty > 0.5) v.z *= (1 - (ty - 0.5) * 0.4);
      // FLATTEN THE FRONT to a mantle plane so the rosettes/hands read FROM a facing
      // surface (a sphere-front reads as a ball).
      if (tz > 0.1) v.z -= (tz - 0.1) * (tz - 0.1) * MD * 0.7;
      // the shoulders KNUCKLE out (a mantle yoke) so the outline breaks at y≈shoulder.
      if (ty > 0.35 && ty < 0.62 && Math.abs(v.x) > MW * 0.4) v.x *= 1.12;
      // the lower train sweeps back + narrows to a smooth tail (legless).
      if (ty < -0.2) { const k = clamp((-ty - 0.2) / 0.8, 0, 1); v.z -= k * 1.6; v.x *= (1 - k * 0.2); }
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    shroudBase.computeVertexNormals();
    shroudBase.deleteAttribute('uv');
  }
  const shroudFull = strip(shroudBase);
  // value tiers by height: deep (low train) · mid (body) · hi (shoulders/hood).
  const tierSplit = (g, loY, hiY) => {
    const src = g.attributes.position, nsrc = g.attributes.normal;
    const buckets = { deep: [], mid: [], hi: [] };
    for (let i = 0; i < src.count; i += 3) {
      const cy = (src.getY(i) + src.getY(i + 1) + src.getY(i + 2)) / 3;
      const t = cy < loY ? 'deep' : cy < hiY ? 'mid' : 'hi';
      for (let k = 0; k < 3; k++) buckets[t].push(i + k);
    }
    const sub = (idxs) => {
      const geo = new THREE.BufferGeometry();
      const a = new Float32Array(idxs.length * 3), nn = new Float32Array(idxs.length * 3);
      for (let j = 0; j < idxs.length; j++) { const i = idxs[j]; a[j * 3] = src.getX(i); a[j * 3 + 1] = src.getY(i); a[j * 3 + 2] = src.getZ(i); nn[j * 3] = nsrc.getX(i); nn[j * 3 + 1] = nsrc.getY(i); nn[j * 3 + 2] = nsrc.getZ(i); }
      geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
      return geo;
    };
    return { deep: sub(buckets.deep), mid: sub(buckets.mid), hi: sub(buckets.hi) };
  };
  const shroudT = tierSplit(shroudFull, -3.0, 4.5);
  rig.add(new THREE.Mesh(shroudT.deep, shroudDeepMat));
  const shroudMidMesh = new THREE.Mesh(shroudT.mid, shroudMat); shroudMidMesh.name = 'weftBust';
  rig.add(shroudMidMesh);
  rig.add(new THREE.Mesh(shroudT.hi, shroudHiMat));
  // THE LIT-EDGE (§3b lit-edge plan + the L121 "reads cleanly against a bright sky"
  // trick): a restrained pale-gold FRESNEL RIM on the bust — glows at the silhouette
  // edge, near-transparent face-on (so the moth-grey body stays dark, §3.3). Without
  // it a pure-black body borrows the sky at its edges — on a magenta sunset that reads
  // as danger-band pixels (bossgate G3). The rim makes the edges HER gold instead.
  const bodyRimMat = track(makeEnergyShell(accent, { power: 4.6, strength: 0.72 }));
  const bodyRim = new THREE.Mesh(shroudFull, bodyRimMat); bodyRim.name = 'weftBodyRim';
  rig.add(bodyRim);

  // ---- THE HOOD — a triangular cowl over the top of the bust with a dark aperture
  // (no face). On a hoodPivot so it tilts toward the worked lane WITH LAG (§4b gaze).
  const hoodPivot = new THREE.Group(); hoodPivot.name = 'hoodPivot'; hoodPivot.position.set(0, 5.2, 0.2);
  const hoodParts = [];
  // the cowl: a POINTED wedge shell that peaks well ABOVE the shoulders (a hood, not a
  // dome) and drapes forward over the aperture — a clear triangular hood crown.
  const cowl = new THREE.SphereGeometry(1, lowQ ? 16 : 22, lowQ ? 12 : 16, 0, Math.PI * 2, 0, Math.PI * 0.66);
  {
    const pos = cowl.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= 3.9; v.y *= 6.4; v.z *= 3.6;
      const ty = Math.max(0, v.y / 6.4);
      if (v.z > 0) v.z *= 1.2;                   // draw the peak forward over the aperture
      v.x *= 1 - ty * ty * 0.7;                  // pinch HARD toward a sharp peak (a cowl point)
      v.z *= 1 - ty * 0.3;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    cowl.computeVertexNormals(); cowl.deleteAttribute('uv');
  }
  const cowlGeo = strip(cowl); cowlGeo.translate(0, 0.6, -0.3); hoodParts.push(cowlGeo);
  const hoodMesh = new THREE.Mesh(mergeWw(hoodParts, 'hood'), shroudHiMat); hoodMesh.name = 'weftHood';
  hoodPivot.add(hoodMesh);
  // the dark aperture (a recessed void where a face would be — she has none). Larger +
  // forward so it reads as a dark pit under the cowl at fight distance.
  const aperture = new THREE.Mesh(strip(new THREE.SphereGeometry(2.3, lowQ ? 12 : 16, lowQ ? 8 : 12)), voidMat);
  aperture.name = 'weftAperture'; aperture.scale.set(0.95, 1.35, 0.7); aperture.position.set(0, 0.2, 2.7); hoodPivot.add(aperture);
  rig.add(hoodPivot);

  // ---- THE CROWN OF ARMS — 6 spinneret-arms fanning UPWARD above the shoulder line
  // in a ≤180° arc; NONE below horizontal (the inviolable anti-spider rule). Each on a
  // named spinneretPivot0..5. Thick S-curved 2-segment tapered tubes (limb grammar,
  // distinct from the hairline threads). #5 is the SCAR: a snapped limp+kinked stub.
  const N_ARMS = 6;
  const SCAR_IDX = 5;
  const armSeg = lowQ ? 6 : 8;
  const spinneretPivots = [];
  // the crown roots GATHER near the top of the hood (a crown radiates from the head,
  // not from wide shoulders — a wide spread reads as legs). LONG, graceful, tapering
  // arms fan UP well above the hood peak so the outline reads "crown of arms".
  const CROWN_Y = 7.4;
  for (let i = 0; i < N_ARMS; i++) {
    // fan from 30°..150° (all well above horizontal); 90° = straight up.
    const deg = 30 + (i / (N_ARMS - 1)) * 120;
    const ang = deg * Math.PI / 180;
    const pivot = new THREE.Group();
    pivot.name = `spinneretPivot${i}`;
    // roots gathered near the crown of the hood (small spread), not the shoulders.
    pivot.position.set(Math.cos(ang) * 1.7, CROWN_Y + Math.sin(ang) * 0.5, 0.6);
    pivot.userData = { ang, deg, rest: 0, scar: i === SCAR_IDX };
    const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0);
    // the distal segment curves UP toward vertical (a gathering crown that reaches
    // UP, not a leg that arches back out) — every tip terminates ≥45° above the
    // horizon. This is the anti-leg fix (Fable CP1 gate): arms, not spider legs.
    const upBend = ((90 - deg) * Math.PI / 180) * 0.5;
    const dang = ang + upBend;
    const ddir = new THREE.Vector3(Math.cos(dang), Math.sin(dang), 0);
    // The crown elements are WEAVER'S SPINDLES (owner call): a slender shaft with a
    // WHORL disc near the base + THREAD WINDINGS mid-shaft, tapering to a fine needle
    // point — a drop-spindle wound with thread, NOT a smooth quill or a leg. Built
    // along the arm direction; the distal half curves UP (upBend) so the crown reaches
    // skyward, tips ≥45° above horizontal, nothing below the shoulder (anti-spider).
    const L0 = 5.2, L1 = 4.4;
    const px = (t) => dir.x * L0 * t, py = (t) => dir.y * L0 * t;               // point along the proximal shaft
    const dx = (t) => dir.x * L0 + ddir.x * L1 * t, dy = (t) => dir.y * L0 + ddir.y * L1 * t;  // along the distal shaft
    if (i === SCAR_IDX) {
      // THE SCAR — a SNAPPED spindle (owner: "make it read as a wound"): the same
      // spindle grammar (shaft + whorl) but broken off mid-shaft with a frayed
      // splintered stub — one broken member among the crown, dead (dark, threadless).
      const shaft = strip(new THREE.CylinderGeometry(0.24, 0.4, L0 * 0.72, armSeg));
      shaft.rotateZ(ang - Math.PI / 2); shaft.translate(px(0.36), py(0.36), 0);
      // the WHORL disc (so it's legible as a broken SPINDLE, not a random stub).
      const whorl = strip(new THREE.CylinderGeometry(0.62, 0.62, 0.24, lowQ ? 8 : 12));
      whorl.rotateZ(ang - Math.PI / 2); whorl.translate(px(0.34), py(0.34), 0);
      // the FRAYED BREAK — 3 short splinters flaring off the snapped end (a wound).
      const splinters = [];
      for (let s = 0; s < 3; s++) {
        const sp = strip(new THREE.ConeGeometry(0.12, 0.9 + s * 0.2, 4));
        const sang = ang + (s - 1) * 0.5;
        sp.rotateZ(sang - Math.PI / 2); sp.translate(px(0.72) + Math.cos(sang) * 0.4, py(0.72) + Math.sin(sang) * 0.4, (s - 1) * 0.15);
        splinters.push(sp);
      }
      const stub = new THREE.Mesh(mergeWw([shaft, whorl, ...splinters], 'scarArm'), shroudDeepMat);
      stub.name = 'weftScar';
      pivot.add(stub);
      // a cold glint on the raw break (the §3.6 memory hook), dimmer than the live tips.
      const brk = new THREE.Mesh(strip(new THREE.OctahedronGeometry(0.3, 0)), shroudHiMat);
      brk.name = 'weftScarBreak';
      brk.position.set(px(0.72), py(0.72), 0.1);
      pivot.add(brk);
    } else {
      // a LIVE SPINDLE: proximal shaft → a whorl disc → distal shaft tapering to a
      // needle point, wound with thread rings mid-shaft. Self-lit gold (reads on a
      // dark sky); slender but disambiguated from a leg by the whorl + windings + tip.
      const prox = strip(new THREE.CylinderGeometry(0.3, 0.42, L0, armSeg));
      prox.rotateZ(ang - Math.PI / 2); prox.translate(px(0.5), py(0.5), 0);
      const dist = strip(new THREE.CylinderGeometry(0.11, 0.3, L1, armSeg));
      dist.rotateZ(dang - Math.PI / 2); dist.translate(dx(0.5), dy(0.5), 0);
      const point = strip(new THREE.ConeGeometry(0.11, 1.2, armSeg));   // the fine needle point
      point.rotateZ(dang - Math.PI / 2); point.translate(dx(1) + ddir.x * 0.6, dy(1) + ddir.y * 0.6, 0);
      // the WHORL disc near the base (the spindle's weighted whorl — the key tell).
      const whorl = strip(new THREE.CylinderGeometry(0.66, 0.66, 0.26, lowQ ? 8 : 14));
      whorl.rotateZ(ang - Math.PI / 2); whorl.translate(px(0.32), py(0.32), 0);
      const arm = new THREE.Mesh(mergeWw([prox, dist, point, whorl], `arm${i}`), armMat);
      arm.name = `weftArm${i}`;
      pivot.add(arm);
      // THREAD WINDINGS — 2–3 pale-gold rings wound around the shaft ("wound with
      // thread"; the accent reaches the crown). Slightly brighter than the shaft.
      const windN = lowQ ? 2 : 3;
      const winds = [];
      for (let w = 0; w < windN; w++) {
        const t = 0.5 + w * 0.12;
        const ring = strip(new THREE.TorusGeometry(0.24 - w * 0.02, 0.07, 5, lowQ ? 8 : 12));
        ring.rotateY(Math.PI / 2); ring.rotateZ(ang - Math.PI / 2);
        ring.translate(px(t), py(t), 0);
        winds.push(ring);
      }
      const wound = new THREE.Mesh(mergeWw(winds, `wind${i}`), knotMat);
      wound.name = `spinneretTip${i}`;   // the accent-bearing wound thread (named for parity)
      pivot.add(wound);
    }
    rig.add(pivot);
    spinneretPivots.push(pivot);
  }

  // ---- THE HANDS — two OVERSIZED pale hands held WIDE of the body (breaking the
  // outline into the web's negative space), each articulated (palm + 4 fingers + a
  // thumb, 2 segments each) on named finger pivots. They are the FACE (§4b) — they
  // orient toward the worked lane, weave in idle, still on notice, one finger points
  // down. A taut thread is strung between them (the charge tell / laserLance).
  const handPivots = {};
  const pointFingers = {};   // the long index finger that points DOWN on notice
  const HAND_X = 7.4, HAND_Y = 1.6, HAND_Z = 4.6;
  function buildHand(side) {
    const sx = side === 'L' ? -1 : 1;
    const pivot = new THREE.Group();
    pivot.name = `handPivot${side}`;
    pivot.position.set(sx * HAND_X, HAND_Y, HAND_Z);
    // the PALM — an oversized flattened box, tilted to face inward/forward.
    const palm = new THREE.Mesh(strip(new THREE.BoxGeometry(1.7, 2.2, 0.7)), handMat);
    palm.name = `palm${side}`; pivot.add(palm);
    // the THUMB + 4 FINGERS (2 segments each) with a NATURAL length arc — the MIDDLE
    // finger is longest, index/ring shorter, pinky shortest — and the two hands are
    // MIRRORED (the fan sign flips with `sx`), so the pair reads as a real left+right
    // pair. f: 0=pinky 1=ring 2=middle(longest) 3=index(the pointer, points DOWN on
    // notice). Layout inner→outer via `sx` so index+thumb sit toward the body centre.
    const FLEN = [0.95, 1.2, 1.42, 1.12];   // proximal: pinky · ring · middle · index
    const FRAD = [0.155, 0.175, 0.19, 0.175];
    for (let f = 0; f < 4; f++) {
      const t = f / 3 - 0.5;               // -0.5..0.5 (pinky → index)
      const fx = sx * t * 1.6;             // MIRROR: the fan sign flips per hand
      const l0 = FLEN[f], l1 = l0 * 0.82, rad = FRAD[f];
      const fp = new THREE.Group(); fp.name = `finger${side}${f}`; fp.position.set(fx, 1.05, 0.12);
      const prox = strip(new THREE.CylinderGeometry(rad * 0.86, rad, l0, 6)); prox.translate(0, l0 * 0.5, 0);
      const dp = new THREE.Group(); dp.name = `fingerTip${side}${f}`; dp.position.set(0, l0, 0);
      const distal = strip(new THREE.CylinderGeometry(rad * 0.62, rad * 0.86, l1, 6)); distal.translate(0, l1 * 0.5, 0);
      dp.add(new THREE.Mesh(distal, handMat));
      fp.add(new THREE.Mesh(prox, handMat)); fp.add(dp);
      fp.rotation.x = -0.12 - Math.abs(t) * 0.12;   // a gentle fan (outer fingers splay more)
      fp.rotation.z = -sx * t * 0.16;               // mirror the lateral splay
      pivot.add(fp);
      if (f === 3) pointFingers[side] = fp;          // the INDEX finger is the pointer
    }
    // the thumb — set LOW on the inner side, beside the index (mirrored per hand).
    const thumb = new THREE.Group(); thumb.name = `thumb${side}`; thumb.position.set(sx * 1.0, -0.1, 0.25);
    const t0 = strip(new THREE.CylinderGeometry(0.19, 0.23, 1.15, 6)); t0.translate(0, 0.55, 0);
    thumb.add(new THREE.Mesh(t0, handMat)); thumb.rotation.z = sx * 1.0; thumb.rotation.x = -0.3; pivot.add(thumb);
    pivot.rotation.y = sx * 0.5;          // face the palms inward toward each other
    rig.add(pivot);
    handPivots[side] = pivot;
    return pivot;
  }
  buildHand('L'); buildHand('R');

  // the TAUT THREAD between the fingertips (built as a 2-vertex line, repositioned in
  // the tick from the live hand pivots). Idle = slack/near-invisible; charge = pulled
  // straight + flashed amber; the laserLance HDR flash rides this line.
  const tautGeo = new THREE.BufferGeometry();
  tautGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const tautLine = new THREE.LineSegments(tautGeo, tautMat); tautLine.name = 'weftTaut'; tautLine.frustumCulled = false;
  rig.add(tautLine);

  // THE LASERLANCE BEAM (CP2 — owner-confirmed: a beam VISUAL riding the 'aimed'
  // fire instant, never a new attack id). A single HDR hairline from the loom-heart
  // down-lane (+z local = toward the player under placeGroup's facing): hairline
  // grammar matches the web (her lines are threads), and toneMapped:false +
  // color>1 punches it past bloom — the §3b "brightest moment". Hidden at rest.
  // A 1px hairline vanished among the web's own threads (integration-gate r2) —
  // the lance is a thin TAPERED additive cylinder instead: real width, reads from
  // every angle, ~12 tris, alive only ~0.3s (hidden at rest → G7 never sees it).
  const beamMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const beamGeo = new THREE.CylinderGeometry(0.16, 0.42, 1, 6, 1, true);   // tapers toward the target (a lance, not a pipe)
  beamGeo.rotateX(Math.PI / 2);        // axis → +z (fire direction)
  beamGeo.translate(0, 0, 0.5);        // origin at the base — position sits AT the muzzle
  const beamLine = new THREE.Mesh(beamGeo, beamMat); beamLine.name = 'weftBeam'; beamLine.frustumCulled = false; beamLine.visible = false;
  const BEAM_ORIGIN = new THREE.Vector3(0, 3.4, 4.6);
  beamLine.position.copy(BEAM_ORIGIN);
  group.add(beamLine);
  const _beamDir = new THREE.Vector3(), _beamFwd = new THREE.Vector3(0, 0, 1);

  // ---- THE ROSETTE-KNOTS — woven pale-gold knots on the mantle front (LORE motifs
  // of what she's mended). The accent lives HERE, not on the body.
  const rosetteN = lowQ ? 4 : 8;
  const rosettes = [];
  for (let i = 0; i < rosetteN; i++) {
    const a = (i / rosetteN) * Math.PI * 2;
    const knot = new THREE.Mesh(strip(new THREE.TorusKnotGeometry(0.52, 0.18, lowQ ? 24 : 48, 5, 2, 3)), knotMat);
    knot.name = `rosette${i}`;
    // woven up the mantle front (the accent-bearing motifs + the G3 gold attribution).
    knot.position.set(Math.cos(a) * 2.9, 1.0 + Math.sin(a) * 2.9, 3.5);
    knot.scale.setScalar(0.85 + (i % 3) * 0.14);
    rig.add(knot); rosettes.push(knot);
  }

  // ---- THE LOOM-HEART — the restrained accent glow at the hub (the muzzle organ +
  // the weak point + the flash core). A small bounded emissive knot + a white-hot
  // core BEHIND the silhouette front (overdraw-safe: one small volume, never a film).
  const loomHeart = new THREE.Group(); loomHeart.name = 'loomHeartRig'; loomHeart.position.set(0, 3.4, 3.2);
  const loomKnot = new THREE.Mesh(strip(new THREE.IcosahedronGeometry(0.9, 0)), loomMat); loomKnot.name = 'weftLoomHeart';
  loomHeart.add(loomKnot);
  const loomCore = new THREE.Mesh(strip(new THREE.SphereGeometry(0.4, 12, 10)), loomCoreMat); loomCore.name = 'loomCore'; loomCore.position.z = 1.0; loomCore.renderOrder = 6;
  loomHeart.add(loomCore);
  rig.add(loomHeart);

  // ---- THE WEB — taut spokes radiating from the hub to off-screen anchors, filling
  // the frame (the FIELD = the body, L141), PLUS a scattered warp lattice (short
  // cross-stitches at staggered radii — NEVER concentric rings, which would read as an
  // orb web / spider). Two weights merged into ONE LineSegments each (1 draw apiece).
  // On a threadPivot so the gap-restitch (CP2) has a handle; overdraw-exempt.
  const threadPivot = new THREE.Group(); threadPivot.name = 'threadPivot'; threadPivot.position.set(0, 4.0, 2.0);
  const HUB = new THREE.Vector3(0, 0, 0);
  const N_SPOKE = lowQ ? 34 : 64;
  const R_IN = 6.0, R_OUT = lowQ ? 46 : 64;
  // deterministic jitter so the web is irregular (woven), not a clean sunburst.
  const jit = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  // FIXED-SLOT buffers so the tick can rewrite positions (the water-surface reaction):
  // per spoke a SPOKE slot (hub→outer) + a TAIL slot (the drag-tail along the water,
  // written DEGENERATE when that spoke doesn't touch water — invisible and free), plus
  // per stitch a slot recomputed from the clipped spokes. A slot = 2 verts in the dim or
  // hero bucket (a tail inherits its spoke's weight).
  const dimSegs = [], heroSegs = [];
  const pushSeg = (hero, p0, p1) => {
    const arr = hero ? heroSegs : dimSegs;
    const off = arr.length / 3;
    arr.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
    return { hero, off };
  };
  const anchors = [];
  const spokeSlots = [], tailSlots = [], stitchMeta = [];
  for (let s = 0; s < N_SPOKE; s++) {
    const a = (s / N_SPOKE) * Math.PI * 2 + (jit(s) - 0.5) * 0.06;
    const rout = R_OUT * (0.82 + jit(s + 11) * 0.3);
    const z = (jit(s + 5) - 0.5) * 3.0;                     // slight depth scatter (a woven volume)
    const inr = new THREE.Vector3(Math.cos(a) * R_IN, Math.sin(a) * R_IN, HUB.z);
    const out = new THREE.Vector3(Math.cos(a) * rout, Math.sin(a) * rout, z);
    anchors.push({ a, inr, out });
    const hero = (s % 2 === 0);                              // ~1/2 hero spokes (the two-value read + accent presence)
    spokeSlots.push(pushSeg(hero, inr, out));
    tailSlots.push(pushSeg(hero, out, out));                 // degenerate until water contact
  }
  // the scattered warp LATTICE: connect adjacent spokes with a short cross-stitch at a
  // STAGGERED radius per gap (never the same radius across the ring → not concentric).
  const N_STITCH = lowQ ? 40 : 90;
  for (let s = 0; s < N_STITCH; s++) {
    const i0 = s % N_SPOKE, i1 = (i0 + 1) % N_SPOKE;
    const A = anchors[i0], B = anchors[i1];
    const t0 = 0.12 + jit(s * 3 + 1) * 0.8;                 // staggered radius fraction along each spoke
    const t1 = clamp01(t0 + (jit(s * 3 + 2) - 0.5) * 0.16);
    const p0 = A.inr.clone().lerp(A.out, t0);
    const p1 = B.inr.clone().lerp(B.out, t1);
    stitchMeta.push({ i0, i1, t0, t1, slot: pushSeg(s % 4 === 0, p0, p1) });
  }
  const mkLines = (arr, mat, name) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
    const ls = new THREE.LineSegments(g, mat); ls.name = name; ls.frustumCulled = false;
    return ls;
  };
  const webDim = mkLines(dimSegs, webDimMat, 'weftWebDim');
  const webHero = mkLines(heroSegs, webHeroMat, 'weftWebHero');
  threadPivot.add(webDim, webHero);
  rig.add(threadPivot);

  // ---- THE WATER-SURFACE REACTION (owner note on PR #263: the spokes pierced the
  // water as dead-straight lines). Fight-context-only: boss.js feeds the arena's water
  // plane via setWaterPlane?.(0) (the world-constant surface, water.js:204) — never fed
  // in the studio/tests, so those stay byte-identical (the CP1 captures hold). When fed,
  // each tick restores the web's PRISTINE base geometry, then clips every segment
  // against the LIVE world plane (derived from the current matrixWorld, so entrance
  // scale / death sink / dissolve spread all keep working): crossing SPOKES end at a
  // contact point that rides an artificial swell (bob strictly ABOVE the surface — the
  // flat water mesh z-fights anything coplanar) and drag a short TAIL along the water;
  // crossing STITCHES clip independently (re-lerping them against clipped spokes would
  // bunch the lower lattice into a halo above the waterline); fully-submerged segments
  // collapse degenerate onto the plane (renders nothing; the death-sink settles the web
  // into the sea).
  // ⚠ CP2 RESTITCH CONTRACT: this pass rewrites the position attributes from dimBase/
  // heroBase every tick while active — a restitch animation must mutate the BASE arrays
  // (or the slot records), never the attributes directly, or its writes get stomped.
  let waterWorldY = null;
  const dimAttr = webDim.geometry.attributes.position;
  const heroAttr = webHero.geometry.attributes.position;
  const dimBase = dimAttr.array.slice();
  const heroBase = heroAttr.array.slice();
  // CP2 GAP-RESTITCH: at each phase seam the fight TEARS a sector of her web and
  // she visibly RE-WEAVES it — the arena-mender identity beat ("she mends what you
  // break"). The tear MUTATES the BASE arrays (the water-clip pass rewrites the
  // attributes from base every tick — the contract above — so the tear and the
  // surface reaction compose for free); pristine copies restore byte-exact when
  // the mend completes. Sector choice is deterministic per call (no Math.random —
  // headless tests replay it).
  const dimBase0 = dimBase.slice();
  const heroBase0 = heroBase.slice();
  let restitchT = -1, restitchS0 = 0, restitchCalls = 0;
  const RESTITCH_W = 7;   // torn sector width, in spokes
  function restitchWeb() {
    // restore any in-flight tear first (a fresh phase re-tears cleanly)
    dimBase.set(dimBase0); heroBase.set(heroBase0);
    restitchS0 = (restitchCalls * 11 + 3) % N_SPOKE;
    restitchCalls++;
    restitchT = 0;
  }
  // retraction factor of spoke sIdx this frame (1 = untouched, →0.15 fully torn)
  function restitchR(sIdx, tear) {
    const d = ((sIdx - restitchS0) % N_SPOKE + N_SPOKE) % N_SPOKE;
    if (d >= RESTITCH_W) return 1;
    const fall = Math.sin(((d + 0.5) / RESTITCH_W) * Math.PI);   // centre tears fully
    return 1 - tear * fall * 0.85;
  }
  function updateRestitch(dt) {
    if (restitchT < 0) return;
    restitchT += dt / 2.4;                     // the full tear→mend arc ~2.4s
    const k = Math.min(1, restitchT);
    // tear rips fast (0→0.3), the mend re-weaves slow with a settle (0.3→1).
    const tear = k < 0.3 ? (k / 0.3) : Math.max(0, 1 - (k - 0.3) / 0.6);
    for (let i = 0; i < RESTITCH_W; i++) {
      const sIdx = (restitchS0 + i) % N_SPOKE;
      const r = restitchR(sIdx, tear);
      const slot = spokeSlots[sIdx], A = anchors[sIdx];
      const arr = slot.hero ? heroBase : dimBase;
      const o = slot.off * 3;
      arr[o + 3] = A.inr.x + (A.out.x - A.inr.x) * r;
      arr[o + 4] = A.inr.y + (A.out.y - A.inr.y) * r;
      arr[o + 5] = A.inr.z + (A.out.z - A.inr.z) * r;
      // the torn spoke's tail parks on its retracted end (degenerate, invisible)
      const tSlot = tailSlots[sIdx], ta = tSlot.hero ? heroBase : dimBase, to = tSlot.off * 3;
      ta[to] = ta[to + 3] = arr[o + 3]; ta[to + 1] = ta[to + 4] = arr[o + 4]; ta[to + 2] = ta[to + 5] = arr[o + 5];
    }
    // sector stitches ride their spokes' retraction (p = inr + (out−inr)·t·r).
    for (const st of stitchMeta) {
      const r0 = restitchR(st.i0, tear), r1 = restitchR(st.i1, tear);
      if (r0 === 1 && r1 === 1) continue;
      const A = anchors[st.i0], B = anchors[st.i1];
      const arr = st.slot.hero ? heroBase : dimBase, o = st.slot.off * 3;
      arr[o] = A.inr.x + (A.out.x - A.inr.x) * st.t0 * r0;
      arr[o + 1] = A.inr.y + (A.out.y - A.inr.y) * st.t0 * r0;
      arr[o + 2] = A.inr.z + (A.out.z - A.inr.z) * st.t0 * r0;
      arr[o + 3] = B.inr.x + (B.out.x - B.inr.x) * st.t1 * r1;
      arr[o + 4] = B.inr.y + (B.out.y - B.inr.y) * st.t1 * r1;
      arr[o + 5] = B.inr.z + (B.out.z - B.inr.z) * st.t1 * r1;
    }
    if (restitchT >= 1) {
      restitchT = -1;
      dimBase.set(dimBase0); heroBase.set(heroBase0);   // byte-exact pristine restore
    }
    // no water plane (studio/tests): the surface pass won't sync — push base→attrs.
    if (waterWorldY == null) {
      dimAttr.array.set(dimBase); heroAttr.array.set(heroBase);
      dimAttr.needsUpdate = true; heroAttr.needsUpdate = true;
    }
  }
  function setWaterPlane(y) {
    waterWorldY = (y == null) ? null : y;
    if (waterWorldY != null) {
      // GL usage hint only — set here (the fight path, before the first render) so the
      // studio path keeps its static buffers untouched.
      dimAttr.setUsage(THREE.DynamicDrawUsage);
      heroAttr.setUsage(THREE.DynamicDrawUsage);
    } else {
      dimAttr.array.set(dimBase); heroAttr.array.set(heroBase);
      dimAttr.needsUpdate = true; heroAttr.needsUpdate = true;
    }
  }
  const _wInv = new THREE.Matrix4();
  const _wPlane = new THREE.Plane();
  const TAU = Math.PI * 2;
  function updateWebSurface(time) {
    if (waterWorldY == null) return;
    threadPivot.updateWorldMatrix(true, false);
    _wInv.copy(threadPivot.matrixWorld).invert();
    // world plane (normal +Y through y=waterY; Plane convention n·p + c = 0 → the world
    // constant is −waterY) → threadPivot-LOCAL space. applyMatrix4 renormalizes the
    // normal, so signed distances below are in LOCAL units. Never cached across ticks
    // (dissolve/entrance animate the scale every frame).
    _wPlane.normal.set(0, 1, 0); _wPlane.constant = -waterWorldY;
    _wPlane.applyMatrix4(_wInv);
    const nx = _wPlane.normal.x, ny = _wPlane.normal.y, nz = _wPlane.normal.z, c = _wPlane.constant;
    // restore pristine geometry, then patch only what the plane touches.
    dimAttr.array.set(dimBase); heroAttr.array.set(heroBase);
    const arrOf = (slot) => slot.hero ? heroAttr.array : dimAttr.array;
    // clip one segment IN PLACE against the local plane. Returns nothing; fully-above
    // segments keep their restored base verts. `lift` biases the clipped point strictly
    // above the surface. Returns the contact info for the caller via _cx/_cy/_cz.
    let _cx = 0, _cy = 0, _cz = 0, _crossed = false;
    const clipSeg = (slot, lift) => {
      const a = arrOf(slot), o = slot.off * 3;
      const Ax = a[o], Ay = a[o + 1], Az = a[o + 2], Bx = a[o + 3], By = a[o + 4], Bz = a[o + 5];
      const d0 = nx * Ax + ny * Ay + nz * Az + c;
      const d1 = nx * Bx + ny * By + nz * Bz + c;
      _crossed = false;
      if (d0 >= 0 && d1 >= 0) return;                        // fully above — base stands
      if (d0 < 0 && d1 < 0) {
        // fully submerged — collapse degenerate onto the plane (renders nothing).
        const px = Ax - d0 * nx, py = Ay - d0 * ny, pz = Az - d0 * nz;
        a[o] = px; a[o + 1] = py; a[o + 2] = pz; a[o + 3] = px; a[o + 4] = py; a[o + 5] = pz;
        return;
      }
      const t = d0 / (d0 - d1);                              // sign-order agnostic, t∈(0,1)
      _cx = Ax + (Bx - Ax) * t + nx * lift;
      _cy = Ay + (By - Ay) * t + ny * lift;
      _cz = Az + (Bz - Az) * t + nz * lift;
      if (d0 >= 0) { a[o + 3] = _cx; a[o + 4] = _cy; a[o + 5] = _cz; }   // keep A, clip B
      else { a[o] = _cx; a[o + 1] = _cy; a[o + 2] = _cz; }               // keep B, clip A
      _crossed = true;
    };
    for (let s = 0; s < N_SPOKE; s++) {
      const ph = jit(s) * TAU;
      // the swell bob: STRICTLY positive (skims/hovers, never dips through the mesh).
      const bob = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(time * 1.6 + ph));
      clipSeg(spokeSlots[s], bob);
      const tSlot = tailSlots[s];
      if (_crossed) {
        // TAIL: the thread's end caught on the water — from the contact point, along
        // the surface, radially outward with a slow length breath + a lateral sway.
        const A = anchors[s];
        let dx = A.out.x - A.inr.x, dy = A.out.y - A.inr.y, dz = A.out.z - A.inr.z;
        const dn = dx * nx + dy * ny + dz * nz;
        let rx = dx - dn * nx, ry = dy - dn * ny, rz = dz - dn * nz;   // project onto the plane
        let rl = rx * rx + ry * ry + rz * rz;
        if (rl < 0.01) {
          // the straight-down spoke: its direction is near-antiparallel to the normal
          // and the projection degenerates — fall back to local X projected onto the
          // plane (n is never near ±X here), signed deterministically per spoke.
          const sgn = jit(s) < 0.5 ? -1 : 1;
          rx = (1 - nx * nx) * sgn; ry = (-nx * ny) * sgn; rz = (-nx * nz) * sgn;
          rl = rx * rx + ry * ry + rz * rz;
        }
        const inv = 1 / Math.sqrt(rl);
        rx *= inv; ry *= inv; rz *= inv;
        // lateral sway dir = n × r (unit, since n ⊥ r).
        const lx = ny * rz - nz * ry, ly = nz * rx - nx * rz, lz = nx * ry - ny * rx;
        const L = (2.2 + jit(s + 23) * 1.8) * (1 + 0.12 * Math.sin(time * 2.1 + ph * 1.7));
        const sway = 0.35 * Math.sin(time * 1.3 + ph);
        const a = arrOf(tSlot), o = tSlot.off * 3;
        a[o] = _cx; a[o + 1] = _cy; a[o + 2] = _cz;
        a[o + 3] = _cx + rx * L + lx * sway;
        a[o + 4] = _cy + ry * L + ly * sway;
        a[o + 5] = _cz + rz * L + lz * sway;
      } else {
        // no contact this tick: the tail must never linger — collapse it wherever its
        // base verts are relative to the plane (above → degenerate base already; a
        // submerged base gets collapsed onto the plane by clipSeg's both-below branch).
        clipSeg(tSlot, 0);
      }
    }
    // STITCHES clip independently (R1): above-water lattice pixels stay exactly where
    // the approved captures put them; only waterline-crossers end at the surface.
    for (const st of stitchMeta) clipSeg(st.slot, 0.12);
    dimAttr.needsUpdate = true;
    heroAttr.needsUpdate = true;
  }

  // ---- EDGE CAGE over the shroud crest + hood (a thin dark line that reads the
  // mantle outline on a bright sky).
  rig.add(new THREE.LineSegments(new THREE.EdgesGeometry(shroudT.hi, 30), cageMat));

  // ---- DRIFT ORBITERS (≥2) — pale surge-MOTES drifting around the loom (the idle
  // form of the mote-harvest bloom; tick-animated).
  const moteGeo = strip(new THREE.OctahedronGeometry(0.26, 0));
  const moteMat = track(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  const orbiters = [];
  const N_MOTE = lowQ ? 4 : 7;
  for (let i = 0; i < N_MOTE; i++) {
    const m = new THREE.Mesh(moteGeo, moteMat); m.name = 'weftMote';
    m.userData = { r: 4 + (i % 3) * 2.4, y0: 1 + (i % 4) * 2.5, speed: 0.5 + (i % 3) * 0.24, ph: i * 1.4, drift: (i % 2 ? 1 : -1) };
    rig.add(m); orbiters.push(m);
  }

  kit.flashBind(loomMat, 1.4);
  kit.finalize();

  // ==================================================================
  // ANIMATION — the measured weave (idle), the gaze/lag (hands orient, hood follows),
  // the charge tell (a thread pulls taut + flashes amber, the spinnerets tense), the
  // notice (hands stop, a finger points down), the flinch (web shudder + hands recoil),
  // the death (hands fall slack, web un-weaves + drifts down), the above descent.
  // ==================================================================
  let charge = 0; function setCharge(k) { charge = clamp01(k); }
  let tell = null; function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, dreadK = 0; function setSetpiece(k, sdef) { setpieceK = clamp01(k); dreadK = (sdef && sdef.dread) ? setpieceK : 0; }

  let gazeTX = 0, gazeTY = 0;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }
  let gazeEX = 0, gazeEY = 0;

  let noticeT = 0, pointK = 0;
  function notice() { noticeT = 1.3; }

  let painT = 0, painEase = 0;
  function flash(amt) { kit.flash(amt); painT = Math.max(painT, 0.35); }
  function hurt(amt) { if (amt > 0.3) painT = Math.max(painT, 0.35); }

  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; });

  let entranceU = null;
  function setEntrance(u) { entranceU = u == null ? null : clamp01(u); }
  function setEntranceSteer() {}

  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = clamp01(k);
    kit.setDissolve(dyingK);   // the kit fades every tracked material as one
  }

  let tautK = 0;   // eased taut-thread tension (0 slack → 1 taut+flashed)
  const _tv = tautGeo.attributes.position;

  // CP2 fight verbs (controller-driven, def-gated in boss.js — inert in studio/tests):
  // fireBeam() at the 'aimed' release = the laserLance HDR hairline flash; cutThread()
  // when the 3×-parry lands = the taut thread SNAPS (hands recoil apart, the hood
  // reels, the thread dies) — the stagger read.
  let beamT = 0, cutT = 0, cutEase = 0;
  // fireBeam aims at the PLAYER (local coords fed by boss.js — the beam rides the
  // aimed volley, so it lances toward you, not down the +z axis where a head-on
  // camera foreshortens it to a blob; the CP2 integration gate caught that).
  function fireBeam(tx, ty, tz) {
    if (cutT > 0) return;
    beamT = 1;
    _beamDir.set(tx ?? 0, ty ?? 3.4, tz ?? 44).sub(BEAM_ORIGIN);
    const len = Math.max(_beamDir.length(), 1);
    beamLine.quaternion.setFromUnitVectors(_beamFwd, _beamDir.multiplyScalar(1 / len));
    beamLine.scale.set(1, 1, len);
  }
  function cutThread() { cutT = 1; beamT = 0; }

  function tickBody(dt, time) {
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 8);
    const noticeK = noticeT > 0 ? clamp01(noticeT / 1.0) : 0;
    if (noticeT > 0) noticeT -= dt;
    // the laserLance beam decays fast (a flash, not a sustained laser: the DODGE read
    // stays with the bullets — the beam is pure spectacle at the release instant).
    beamT = Math.max(0, beamT - dt * 3.2);
    beamLine.visible = beamT > 0 && dyingK < 0.5;
    if (beamLine.visible) {
      beamMat.opacity = Math.min(1, beamT * 1.6);
      // white-hot core → pale-gold tail as it dies (HDR: >1 with toneMapped:false);
      // the shaft thins as the flash decays (scale x/y ride beamT, z holds the aim).
      beamMat.color.copy(loomBase).lerp(new THREE.Color(0xffffff), beamT * 0.8).multiplyScalar(1 + beamT * 3.2);
      beamLine.scale.x = beamLine.scale.y = 0.35 + beamT * 0.65;
    }
    // the cut-thread stagger: eases in hard, releases slow (the ~2.5s strike window).
    cutT = Math.max(0, cutT - dt * 0.4);
    cutEase += (clamp01(cutT * 2) - cutEase) * Math.min(1, dt * 9);

    // --- THE MEASURED WEAVE (idle): the bust breathes slowly; the hands weave; the
    // loom-heart pulses; agitation rises with charge (fast stitching under pressure).
    const tempo = 1 + charge * 1.8 + noticeK * 0.6;
    const weave = Math.sin(time * 1.4 * tempo);
    rig.position.y = Math.sin(time * 0.5) * 0.25 + painEase * Math.sin(time * 30) * 0.35;
    rig.rotation.z = Math.sin(time * 0.32) * 0.01 + painEase * Math.sin(time * 26) * 0.02;

    // --- GAZE (§4b): the hands + hood orient toward the worked lane WITH LAG. The
    // hood LAGS the hands (snap-orient reads as a turret; lagged reads as a mind). ---
    gazeEX += (gazeTX - gazeEX) * Math.min(1, dt * 2.2);
    gazeEY += (gazeTY - gazeEY) * Math.min(1, dt * 2.2);
    // (amplitudes raised on the owner note "I feel like it should track us" — the old
    // values were too subtle at fight distance; the LAG stays: snap = turret, lag = a
    // mind at a loom.)
    hoodPivot.rotation.y += (gazeEX * 0.85 - hoodPivot.rotation.y) * Math.min(1, dt * 1.4);   // hood lags
    hoodPivot.rotation.x = -gazeEY * 0.5 + noticeK * 0.35 - cutEase * 0.4;   // tilts down on notice/aim; REELS back on a thread-cut

    // --- THE HANDS: weave in idle; STILL on dread/notice (the §4b "hands still =
    // dread"); recoil on a hit. One long finger POINTS DOWN on notice. ---
    const stillness = clamp01(noticeK + dreadK + cutEase);   // 1 = hands frozen (notice/dread/staggered)
    const wv = weave * (1 - stillness) * (0.18 + charge * 0.12);
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? -1 : 1;
      const hp = handPivots[side];
      hp.position.x = sx * HAND_X + gazeEX * 3.0 - painEase * sx * 1.2 + sx * cutEase * 2.6;   // track the lane; recoil on hit; thrown APART on a thread-cut
      hp.position.y = HAND_Y + wv * sx + gazeEY * 1.8;
      hp.rotation.z = sx * (0.2 + wv * 0.5) - gazeEX * 0.2;
      hp.rotation.y = sx * (0.5 - stillness * 0.2);
      // fingers flex on the weave (dying → fall open + slack).
      hp.traverse((o) => {
        if (/^finger[LR]\d$/.test(o.name)) {
          const base = -0.15;
          o.rotation.x = base + wv * 0.4 - dyingK * 1.2;
        }
      });
    }
    // the point-down finger: on notice, one long finger straightens + points DOWN.
    pointK += ((noticeK > 0.4 ? 1 : 0) - pointK) * Math.min(1, dt * 6);
    if (pointFingers.L) pointFingers.L.rotation.x = -0.15 - pointK * 2.4 - dyingK * 1.0;
    if (pointFingers.R) pointFingers.R.rotation.x = -0.19 + wv * 0.4 * (1 - pointK) - dyingK * 1.0;

    // --- THE CHARGE TELL: the hands PULL a thread taut between them; it flashes AMBER
    // (the amber organ + the laserLance HDR flash). Slack in idle, straight on charge.
    // The taut thread pulling straight is a NEW hard line = a silhouette change. ---
    const tautTarget = clamp01(charge * 1.3 - dyingK - cutEase * 2);   // a cut thread cannot be drawn taut
    tautK += (tautTarget - tautK) * Math.min(1, dt * 7);
    // endpoints = the two index fingertips (approx from the hand pivots).
    const lp = handPivots.L.position, rp = handPivots.R.position;
    const sag = (1 - tautK) * 2.2;   // slack sags DOWN in idle; taut pulls it straight
    _tv.setXYZ(0, lp.x + 1.2, lp.y + 2.2, lp.z + 0.5);
    _tv.setXYZ(1, rp.x - 1.2, rp.y + 2.2 - 0, rp.z + 0.5);
    // pull the midpoint down when slack (a hanging catenary read) — encode via a 3rd
    // implicit point by lowering both ends' y a touch when slack; keep it a 2-vert line.
    _tv.setY(0, lp.y + 2.2 - sag * 0.5); _tv.setY(1, rp.y + 2.2 - sag * 0.5);
    _tv.needsUpdate = true;
    // the flash: pale-gold, punching PAST 1.0 on the taut peak (toneMapped:false).
    const flashK = tautK * (0.9 + Math.sin(time * 40) * 0.1);
    tautMat.opacity = clamp(0.05 + flashK * 1.6, 0, 1.7);
    tautMat.color.copy(loomBase).multiplyScalar(0.8 + flashK * 2.6);

    // --- THE SPINNERET CROWN: the arms sway in idle; on charge they TENSE (draw
    // inward toward the taut thread) — the telegraph SHAPE change. NEVER below
    // horizontal. The scar hangs limp (a slower, dead sway). ---
    for (let i = 0; i < spinneretPivots.length; i++) {
      const p = spinneretPivots[i];
      const scar = p.userData.scar;
      const sway = Math.sin(time * (0.7 + i * 0.12) + i) * (scar ? 0.02 : 0.05) * (1 - stillness * 0.7);
      // tense: rotate the arm toward vertical (draw the crown in) on charge — a clear
      // silhouette pull; the scar barely reacts (dead).
      const tense = (scar ? 0.04 : 1) * (charge * 0.5 + noticeK * 0.2);
      const inward = (p.userData.deg < 90 ? 1 : -1) * tense;   // both sides draw toward centre
      p.rotation.z = sway + inward - dyingK * (scar ? 0.1 : 0.0);
      // dying: the live arms go slack (droop toward — but not past — horizontal).
      if (dyingK > 0) p.rotation.z = sway + inward - dyingK * (p.userData.deg < 90 ? 0.35 : -0.35);
    }

    // --- THE LOOM-HEART pulses on the weave; FLARES on charge/notice; dims LAST on
    // death (the weaver whose light goes out last). One bounded emissive volume. ---
    const loomPulse = 1.2 + Math.max(0, weave) * 0.3 + charge * 1.1 + noticeK * 0.7 + dreadK * 0.5;
    const loomK = loomPulse * (shieldClamp ? 0.45 : 1) * (1 - dyingK * 0.5);   // dims slowly (last)
    loomMat.emissiveIntensity = 1.3 * loomK;
    // the core stays white-hot whenever shown (floored) so the focal always punches
    // ≥250 for G1; it leashes by HIDING under shield/death, not by dimming.
    loomCoreMat.color.setScalar(CORE_HOT * Math.max(0.8, loomK) * (1 - clamp01((dyingK - 0.55) / 0.45)));
    loomCore.visible = dyingK < 0.9 && !shieldClamp;   // leashes when invulnerable (G6)
    knotMat.emissiveIntensity = 0.7 * (0.85 + Math.sin(time * 1.1) * 0.12) * (1 + charge * 0.4) * (1 - dyingK * 0.7);
    // THE LOOM-EYE TRACKS (owner: "the white eye thing should follow us"). The white
    // core slides within the knot toward the player — a pupil in the chest-eye — and
    // the whole organ leans the same way. Honest telegraphy: this is the MUZZLE, so
    // where it looks is where shots come from. Rides the same eased gaze as the hood/
    // hands (the lag is the charisma); stilled by death (the light stops looking).
    const eyeTrack = 1 - dyingK;
    loomCore.position.set(gazeEX * 0.55 * eyeTrack, gazeEY * 0.4 * eyeTrack, 1.0);
    loomHeart.rotation.y = gazeEX * 0.3 * eyeTrack;
    loomHeart.rotation.x = -gazeEY * 0.22 * eyeTrack;

    // --- THE WEB: shudders on a hit (a ripple runs the threads); goes LIMP + drifts
    // DOWN on death (un-weaving — her mended arena comes undone). ---
    threadPivot.rotation.z = Math.sin(time * 0.2) * 0.01 + painEase * Math.sin(time * 22) * 0.05;
    threadPivot.position.y = 4.0 - dyingK * 8 + painEase * 0.4;   // the web sinks as it un-weaves
    const webA = (1 - dyingK) * (shieldClamp ? 0.8 : 1);
    webDimMat.opacity = 0.4 * webA; webHeroMat.opacity = 0.72 * webA;

    // --- THE ORBITER MOTES drift around the loom (harvest bloom idle). ---
    for (const o of orbiters) {
      const u = o.userData;
      const a = time * u.speed * u.drift + u.ph;
      o.position.set(Math.cos(a) * u.r, u.y0 + Math.sin(time * 0.6 + u.ph) * 1.2 - dyingK * 4, 2 + Math.sin(a) * u.r * 0.4);
      o.scale.setScalar(0.7 + Math.sin(time * 2 + u.ph) * 0.2);
    }
    moteMat.opacity = 0.5 * (1 - dyingK) * (0.7 + charge * 0.3);

    // --- ENTRANCE (approachFrom 'above'): she descends from high on a single thread;
    // the crown + web settle in as she lowers. The controller (boss.js) owns the
    // above-branch placement; when it drives setEntrance the model poses the descent. ---
    if (entranceU != null) {
      const u = entranceU;
      rig.position.y = (1 - u) * 22;                 // lowers from y+22 to station
      const unfurl = clamp01((u - 0.4) / 0.6);
      webDimMat.opacity = 0.4 * unfurl; webHeroMat.opacity = 0.72 * unfurl;
      threadPivot.scale.setScalar(0.2 + unfurl * 0.8);
    } else {
      threadPivot.scale.setScalar(1);
    }

    // --- THE GAP-RESTITCH (phase seams) then THE WATER (fight-context-only).
    // Restitch first (it writes the BASE), water last (it rewrites the attributes
    // FROM base against this tick's final transforms) — the composition order. ---
    updateRestitch(dt);
    updateWebSurface(time);
  }

  // Muzzle: she emits from the LOOM-HEART at the hub (emitter = organ).
  const muzzle = new THREE.Object3D(); muzzle.name = 'loomHeart'; muzzle.position.set(0, 3.4, 4.2); group.add(muzzle);

  const sc = def.scale ?? 1.3;
  function hullLength() { return R_OUT * 2 * sc; }   // the WEB span is the "presence" number (L141)
  function spinneretAngles() { return spinneretPivots.map((p) => p.userData.deg); }

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge, setAttackTell, setSetpiece, setGaze, notice,
    setEntrance, setEntranceSteer, setWaterPlane, fireBeam, cutThread, restitchWeb,
    setHealth: kit.setHealth, setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible, shatterShield: kit.shatterShield,
    flash, hurt,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    hullLength, spinneretAngles,
    dispose() { group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}
