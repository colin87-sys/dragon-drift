import * as THREE from 'three';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';
import { createBossCommon, stripForMerge } from './bossKit.js';

// HOLLOWGATE — "The Door That Prays" (BOSS-DESIGN.md §5b/§5d slot 6, the Tier-3
// CALAMITIES opener and the roster's only RECTILINEAR silhouette). A floating
// ruined archway holding station dead AHEAD; the black fill contains a HOLE of
// sky — the rail flies THROUGH the arch (the fly-through is the identity; L141:
// a pass must CROSS the player, never loom).
//
// SILHOUETTE-FIRST (§3.1): one sentence — "a ruined stone arch with a rose
// window burning in its lintel." Two jagged pillars (stacked offset blocks), a
// broken voussoir arc bridging them to a stone ring (one voussoir MISSING = the
// scar), the ROSE WINDOW filling the ring, and a portcullis of six barred teeth
// that descends into the arch gap. Nothing organic — architecture with a void.
// Distinct from every prior slot: not a mask (1), a ring-eye (2), a raptor (3),
// a skeleton (4), or twin darts (5).
//
// THE ROSE WINDOW (§4b, the faceless carrier): 8 wedge panes around a hub —
// which panes glow IS the face. The LIT pane migrates around the ring as its
// pupil — in DISCRETE wedge-steps only (architecture ticking, never continuous
// stick-tracking: that is slot 14's exclusive claim, §5j uniqueness ruling).
// The HUB is THE focal (§3.2) — HDR warm-white, toneMapped=false, the hottest
// point in every state; the stained panes stay below it in value (ONE focal).
//
// PALETTE (registry slot 6, VALUE-INVERTED — the §7b `gate:{pale:true}`
// sanction): near-white ivory 0xd8d0c2 stone with a DARK EdgesGeometry edge
// cage painting the tiers (the sun can't shade the front face, §3.4), and
// stained-glass emissive ONLY inside the window — the one place multi-hue is
// legal in the roster. Dominant window hue = warm stained-gold (def.accent);
// the cool panes stay dim so the thumbnail attributes warm-gold-on-ivory.
// No lit pixel may enter danger-magenta's reserved band (327–357°).
//
// THE SCAR (§3.6, one asymmetric break): the upper-RIGHT voussoir of the arc is
// MISSING — jagged break stubs on the ring and the pillar shoulder, and one
// orphaned SHARD floating in the wound (the lore gap: what broke a door that
// prays? and a door to WHERE?).
//
// FACELESS CARRIER LAW (§4b) — seven channels behind the unchanged hooks:
//   GAZE   — the lit PUPIL pane steps (discretely) around the ring toward you,
//   BLINK  — every pane gutters to embers for a beat (the candles dip),
//   CHARGE — panes ignite clockwise one by one while the PORTCULLIS DESCENDS
//            into the gap (the telegraph changes the SILHOUETTE, §3.5),
//   EXPRESSION — pane patterns are moods: vigil (one pupil pane) / litany
//            (the lower three, a bowed face) / wrath (the full ring),
//   FLINCH — the whole arch shudders on its float; masonry dust kicks; the
//            panes flicker (a struck church),
//   NOTICE — the ring ignites pane-by-pane in half a second and the hub flares,
//   DEATH  — the panes gutter out ONE BY ONE around the ring, the hub dims to a
//            last ember, and the portcullis drops closed — the door goes dark
//            and shuts forever (mournful, no explosion).
//
// CONTRACT: boss.js stomps `group.rotation` every frame (placeGroup) and
// `kit.setDissolve` owns `group.scale` — every animated part lives on `rig`,
// the portcullisPivot, or the chip orbiters, never on `group` itself.

export function buildHollowgate(def, quality = 1) {
  const accent = def.accent ?? 0xe09a3e;    // warm stained-gold — the window's dominant hue
  const glow = def.glow ?? 0xf2e6c8;        // candle-ivory (shield rim / shards)
  const lowQ = quality < 0.75;
  const strip = stripForMerge;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => clamp(v, 0, 1);
  const _white = new THREE.Color(0xfff6e8);

  // The shield wraps the WEAK POINT — the rose window (focal = weak point,
  // Zelda grammar), which sits high in the lintel; hpBar clears the ring top.
  // hpBarScale counters the big def.scale so the bar stays at roster width.
  const kit = createBossCommon(def, quality, {
    shieldRadius: 4.1, shieldY: 4.85, hpBarY: 8.9, hpBarZ: 1.6, hpBarScale: 0.7,
  });
  const { group, track } = kit;
  group.userData.archetype = 'hollowgate';   // guards the legacy-fallback coexist path

  const rig = new THREE.Group();
  group.add(rig);

  const mergeIv = (parts, label) => {
    const geo = mergeGeometries(parts, false);
    if (!geo) throw new Error(`buildHollowgate: ${label} mergeGeometries returned null (attribute mismatch)`);
    return geo;
  };

  // ---- Painted value tiers on IVORY (§3.4 — the sun can't shade the front
  // face, so the pale hierarchy is authored in 3 stone materials + a dark edge
  // cage; the emissive floor keeps the front face reading near-white under the
  // hemisphere light alone — the MARROWCOIL pale-body recipe).
  const stoneFaceMat = track(new THREE.MeshStandardMaterial({
    color: 0xd8d0c2, emissive: 0xd8d0c2, emissiveIntensity: 0.34, roughness: 0.9, metalness: 0.02, flatShading: true,
  }));
  // A second face tier one value-step down — alternating pillar courses wear it
  // so the stacked blocks read as MASONRY COURSES, not one white slab (§3.4).
  const stoneFace2Mat = track(new THREE.MeshStandardMaterial({
    color: 0xc7beac, emissive: 0xc7beac, emissiveIntensity: 0.26, roughness: 0.9, metalness: 0.02, flatShading: true,
  }));
  const stoneMidMat = track(new THREE.MeshStandardMaterial({
    color: 0x9a8f7c, emissive: 0x9a8f7c, emissiveIntensity: 0.14, roughness: 0.92, metalness: 0.02, flatShading: true,
  }));
  const stoneDarkMat = track(new THREE.MeshStandardMaterial({
    color: 0x443c31, emissive: 0x443c31, emissiveIntensity: 0.05, roughness: 0.95, metalness: 0.02, flatShading: true,
  }));
  // Portcullis iron — the darkest opaque tier (the descending grid must read as
  // a DARK gate against sky through the arch void, on both backdrops).
  const ironMat = track(new THREE.MeshStandardMaterial({
    color: 0x2e2a22, emissive: 0x2e2a22, emissiveIntensity: 0.06, roughness: 0.7, metalness: 0.45, flatShading: true,
  }));
  // The dark EDGE CAGE — the leading that paints the ivory's tiers (§5d).
  const cageMat = track(new THREE.LineBasicMaterial({
    color: 0x17130e, transparent: true, opacity: 1.0, depthWrite: false,
  }));

  // ---- STAINED GLASS (the one multi-hue sanction, §5d — window interior ONLY).
  // 8 hues, warm-dominant (G3: dominant accent hue ≈ def.accent's warm gold);
  // the cool panes idle dimmer. NO hue near danger-magenta's 327–357° band.
  // Six warm panes + two cool (teal/blue idle dim, high in the ring) so the
  // window's aggregate hue lands on def.accent's warm gold from every mood.
  const PANE_HUES = [
    0xffb84d,   // 0 — stained gold (the dominant identity hue)
    0x3fbf9f,   // 1 — cathedral teal (cool, idles dim)
    0x5f8fd8,   // 2 — deep glass blue (cool, idles dim)
    0xff9a3e,   // 3 — amber
    0xff8a52,   // 4 — ember orange
    0xffc76a,   // 5 — honey gold   (a bottom "vigil candle" — never fully dark)
    0xffd890,   // 6 — pale candle-gold (the other vigil candle)
    0xf2b23e,   // 7 — deep gold
  ];
  const PANE_COOL = [false, true, true, false, false, false, false, false];
  const PANE_CANDLE = [false, false, false, false, false, true, true, false];   // the two bottom panes hold a low flame always
  const paneMats = PANE_HUES.map((h) => track(new THREE.MeshStandardMaterial({
    color: 0x0a0806, emissive: h, emissiveIntensity: 0.1, roughness: 0.9, metalness: 0.0, flatShading: true,
  })));

  // THE HUB — the focal (§3.2). The eye idiom split in two: a moderate-HDR disc
  // (its bloom is a halo, not a flood) + a tiny ULTRA-HOT core that alone
  // carries the G1 ≥250 peak in a pinpoint cluster.
  const HUB_HOT = 2.3, CORE_HOT = 9.4;
  const HUB_BASE = new THREE.Color(0xffeabc);   // warm candle-gold white — the halo attributes to the accent
  const hubMat = track(new THREE.MeshBasicMaterial({ color: 0xffeabc }));
  hubMat.toneMapped = false;
  hubMat.color.copy(HUB_BASE).multiplyScalar(HUB_HOT);
  const coreMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
  coreMat.toneMapped = false;
  coreMat.color.setScalar(CORE_HOT);

  // ==================================================================
  // GEOMETRY — local units; def.scale (≈1.9) turns them into world presence.
  // The ARCH GAP is the load-bearing number: inner pillar faces at x ±2.6 →
  // a ≥9.8-world-unit fly-through corridor (sheet law: gap ≥9), spanning
  // local y −6.6 … +3.3 (world ≈ 0.5 … 19.3 at fightHeight 13 — the rail at
  // ~11.6 passes through with clearance on every side).
  // ==================================================================
  const GAP_HALF = 2.6;              // inner pillar face (local) → gap 5.2 × scale
  const PILLAR_X = 3.9;              // pillar centreline
  const PILLAR_BASE = -6.6;          // broken stumps float below the gap centre
  const RING_C = 4.85;               // rose-window ring centre height
  const RING_R = 2.15, RING_TUBE = 0.5;

  // ---- A PILLAR: 5 stacked offset blocks (authored jitter — §3.6 symmetry
  // reads as intent), cornice slabs between courses, carved niches on the inner
  // face, a buttress wedge outboard, and a broken crown of snapped finials.
  const BLOCK_H = [2.3, 2.1, 2.0, 1.8, 1.7];
  const BLOCK_W = [2.6, 2.4, 2.2, 2.1, 1.9];
  const BLOCK_D = [2.0, 1.9, 1.8, 1.7, 1.6];
  const BLOCK_OX = [0.14, -0.12, 0.08, -0.06, 0.10];
  const BLOCK_RZ = [0.030, -0.022, 0.038, -0.028, 0.020];
  const PILLAR_TOP = PILLAR_BASE + BLOCK_H.reduce((a, b) => a + b, 0);   // ≈ +3.3

  function pillarGeos(sx) {
    const face = [], face2 = [], mid = [], dark = [];
    let y = PILLAR_BASE;
    for (let i = 0; i < 5; i++) {
      const b = strip(new THREE.BoxGeometry(BLOCK_W[i], BLOCK_H[i], BLOCK_D[i]));
      b.rotateZ(BLOCK_RZ[i] * sx);
      b.translate(sx * (PILLAR_X + BLOCK_OX[i]), y + BLOCK_H[i] / 2, 0);
      (i % 2 ? face2 : face).push(b);   // alternate courses one value-step apart (painted masonry, §3.4)
      // DARK mortar seam recessed at each course line (the painted joint).
      if (i > 0) {
        const c = strip(new THREE.BoxGeometry(BLOCK_W[i] + 0.3, 0.14, BLOCK_D[i] + 0.26));
        c.translate(sx * (PILLAR_X + BLOCK_OX[i]), y + 0.02, 0);
        dark.push(c);
      }
      y += BLOCK_H[i];
    }
    // Carved NICHES down the inner face (dark recesses — painted depth).
    for (let i = 0; i < (lowQ ? 2 : 3); i++) {
      const n = strip(new THREE.BoxGeometry(0.24, 1.05, 0.8));
      n.translate(sx * (PILLAR_X - BLOCK_W[2] / 2 + 0.02), PILLAR_BASE + 2.3 + i * 2.4, 0);
      dark.push(n);
    }
    // Stepped BUTTRESS at the outer base (broadens the black fill; rectilinear —
    // the arch stays architecture, never limbs).
    const bx = sx * (PILLAR_X + BLOCK_W[0] / 2 + 0.45);
    const bt1 = strip(new THREE.BoxGeometry(1.1, 1.5, 1.5)); bt1.translate(bx, PILLAR_BASE + 0.85, 0);
    const bt2 = strip(new THREE.BoxGeometry(0.7, 1.0, 1.2)); bt2.translate(bx + sx * 0.1, PILLAR_BASE + 2.05, 0);
    mid.push(bt1, bt2);
    // INNER REVEAL plank — the gap-facing face graded a full step darker so the
    // fly-through corridor reads as carved depth (§3.4; gate r4 watch item).
    const rv = strip(new THREE.BoxGeometry(0.18, PILLAR_TOP - PILLAR_BASE - 0.4, 1.55));
    rv.translate(sx * (GAP_HALF + 0.05), (PILLAR_TOP + PILLAR_BASE) / 2, 0);
    mid.push(rv);
    // Broken CROWN: two snapped finial stubs on top (jagged hard points, §3.1).
    for (const [ox, h] of [[-0.55, 0.9], [0.5, 0.55]]) {
      const f = strip(new THREE.ConeGeometry(0.28, h, 4));
      f.translate(sx * (PILLAR_X + ox), PILLAR_TOP + h / 2 - 0.1, 0);
      mid.push(f);
    }
    // Broken SOCLE: a jagged under-wedge (the stump floats — a ruin, not a building).
    const sw = strip(new THREE.ConeGeometry(1.05, 1.6, 5));
    sw.rotateX(Math.PI);
    sw.translate(sx * PILLAR_X, PILLAR_BASE - 0.7, 0);
    dark.push(sw);
    return { face, face2, mid, dark };
  }

  const pillarsFace = [], pillarsFace2 = [], pillarsMid = [], pillarsDark = [];
  for (const sx of [-1, 1]) {
    const p = pillarGeos(sx);
    pillarsFace.push(...p.face); pillarsFace2.push(...p.face2); pillarsMid.push(...p.mid); pillarsDark.push(...p.dark);
  }
  const pillarFaceGeo = mergeIv(pillarsFace, 'pillarFace');
  const pillarFace = new THREE.Mesh(pillarFaceGeo, stoneFaceMat);
  pillarFace.name = 'archPillars';
  rig.add(pillarFace);
  const pillarFace2Geo = mergeIv(pillarsFace2, 'pillarFace2');
  const pillarFace2 = new THREE.Mesh(pillarFace2Geo, stoneFace2Mat);
  rig.add(pillarFace2);
  const pillarMid = new THREE.Mesh(mergeIv(pillarsMid, 'pillarMid'), stoneMidMat);
  rig.add(pillarMid);
  const pillarDark = new THREE.Mesh(mergeIv(pillarsDark, 'pillarDark'), stoneDarkMat);
  rig.add(pillarDark);

  // ---- THE TYMPANUM RING — the faceted stone annulus that holds the rose
  // window, seated above the gap between the pillar tops. 8 cusp gable stones
  // ride its rim (the rose's outer teeth in silhouette).
  // THE SCAR (§3.6) lives HERE: the ring is BITTEN — a missing arc at the
  // upper-right (≈48°–82°) where the lost voussoir tore the rim away. The
  // torus is built with a gap (arc < 2π, rotated so the wound sits upper-
  // right), dark break faces jag both lips, and the orphan shard floats IN
  // the bite. One wound, mirror-symmetric everywhere else.
  const BITE_LO = Math.PI * 0.265, BITE_HI = Math.PI * 0.46;   // the missing arc (upper-right)
  const ringGeo = strip(new THREE.TorusGeometry(RING_R, RING_TUBE, 6, lowQ ? 12 : 16, Math.PI * 2 - (BITE_HI - BITE_LO)));
  ringGeo.rotateZ(BITE_HI);                       // gap spans BITE_LO..BITE_HI
  ringGeo.translate(0, RING_C, 0);
  const cuspParts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    if (a > BITE_LO - 0.2 && a < BITE_HI + 0.2) continue;   // no cusp inside the wound
    const c = strip(new THREE.ConeGeometry(0.26, 0.72, 4));
    c.rotateZ(-a + Math.PI / 2);                       // point outward along the radial
    c.translate(Math.cos(a) * (RING_R + RING_TUBE + 0.22), RING_C + Math.sin(a) * (RING_R + RING_TUBE + 0.22), 0);
    cuspParts.push(c);
  }
  const ringFace = new THREE.Mesh(mergeIv([ringGeo, ...cuspParts], 'ring'), stoneFaceMat);
  ringFace.name = 'roseRing';
  rig.add(ringFace);

  // ---- VOUSSOIRS — the arc bridging pillar tops to the ring, MIRRORED (§3.6:
  // symmetry reads as intent; the ONE wound is the ring bite above).
  function voussoir(x, y, rz, w = 1.9) {
    const v = strip(new THREE.BoxGeometry(w, 0.85, 1.5));
    v.rotateZ(rz);
    v.translate(x, y, 0);
    return v;
  }
  const vousParts = [
    voussoir(-3.0, 3.65, 0.42),
    voussoir(-2.55, 4.35, 0.85, 1.15),   // hugs the ring's lower-left rim (never crosses the glass)
    voussoir(3.0, 3.65, -0.42),
    voussoir(2.55, 4.35, -0.85, 1.15),
  ];
  const vous = new THREE.Mesh(mergeIv(vousParts, 'voussoirs'), stoneFaceMat);
  vous.name = 'archLintel';
  rig.add(vous);
  // Break stubs jagging BOTH LIPS of the ring bite (dark tier — a raw fracture).
  const stubParts = [];
  for (const [ang, s, rr] of [[BITE_LO - 0.03, 0.5, RING_R], [BITE_HI + 0.03, 0.46, RING_R], [BITE_LO + 0.02, 0.3, RING_R + 0.35], [BITE_HI - 0.02, 0.28, RING_R - 0.35]]) {
    const t = strip(new THREE.TetrahedronGeometry(s, 0));
    t.rotateZ(ang * 2.3);
    t.translate(Math.cos(ang) * rr, RING_C + Math.sin(ang) * rr, 0);
    stubParts.push(t);
  }
  const stubs = new THREE.Mesh(mergeIv(stubParts, 'scarStubs'), stoneDarkMat);
  rig.add(stubs);
  // The orphan shard — a chunk of the torn rim floating IN the bite, never
  // falling (the memory hook; its bob is authored in the tick).
  const SCAR_ANG = (BITE_LO + BITE_HI) / 2;
  const SCAR_POS = [Math.cos(SCAR_ANG) * (RING_R + 0.15), RING_C + Math.sin(SCAR_ANG) * (RING_R + 0.15)];
  const scarShard = new THREE.Mesh(strip(new THREE.TetrahedronGeometry(0.55, 0)), stoneFace2Mat);
  scarShard.name = 'scarShard';
  scarShard.position.set(SCAR_POS[0], SCAR_POS[1], 0.1);
  rig.add(scarShard);

  // ---- THE ROSE WINDOW — 8 wedge panes (annular sectors) around the hub, each
  // its OWN mesh + material (the expression rig lights them individually; the
  // §5f destructible law deletes them individually). Angular gaps between the
  // wedges are the LEADING (dark tracery bars fill them).
  const PANE_IN = 0.62, PANE_OUT = 1.7;
  const PANE_SPAN = (Math.PI * 2 / 8) * 0.82;   // 8 wedges, ~18% leading gaps
  function paneGeo() {
    const s = new THREE.Shape();
    const a0 = -PANE_SPAN / 2, a1 = PANE_SPAN / 2;
    s.moveTo(Math.cos(a0) * PANE_IN, Math.sin(a0) * PANE_IN);
    s.lineTo(Math.cos(a0) * PANE_OUT, Math.sin(a0) * PANE_OUT);
    s.absarc(0, 0, PANE_OUT, a0, a1, false);
    s.lineTo(Math.cos(a1) * PANE_IN, Math.sin(a1) * PANE_IN);
    s.absarc(0, 0, PANE_IN, a1, a0, true);
    return strip(new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: !lowQ, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, steps: 1, curveSegments: lowQ ? 5 : 9 }));
  }
  const paneGeoShared = paneGeo();   // same wedge, rotated per pane
  const panes = [];
  const PANE_ANG = [];               // world-facing angle of each pane's centre
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;   // centres offset off the cardinal axes
    PANE_ANG.push(a);
    const m = new THREE.Mesh(paneGeoShared, paneMats[i]);
    m.name = `rosePane${i}`;
    m.rotation.z = a;
    m.position.set(0, RING_C, 0.24);
    rig.add(m);
    panes.push(m);
  }
  // TRACERY — the dark leading: 8 radial spoke bars in the wedge gaps + the hub
  // collar, merged into one dark-tier mesh (painted structure, zero glow).
  const traceryParts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8 + Math.PI / 8;   // between panes
    const bar = strip(new THREE.BoxGeometry(0.11, PANE_OUT - PANE_IN + 0.14, 0.12));
    bar.translate(0, (PANE_IN + PANE_OUT) / 2, 0);
    bar.rotateZ(a - Math.PI / 2);
    bar.translate(0, RING_C, 0.46);   // PROUD of the pane glass — the leading must read over it
    traceryParts.push(bar);
  }
  const collar = strip(new THREE.TorusGeometry(0.56, 0.13, 6, lowQ ? 10 : 14));
  collar.translate(0, RING_C, 0.46);
  traceryParts.push(collar);
  const tracery = new THREE.Mesh(mergeIv(traceryParts, 'tracery'), stoneDarkMat);
  tracery.name = 'roseTracery';
  rig.add(tracery);

  // THE HUB — the focal. Disc (moderate HDR halo) + pinpoint core (the G1 peak).
  const hub = new THREE.Mesh(new THREE.CircleGeometry(0.42, lowQ ? 12 : 18), hubMat);
  hub.name = 'roseHub';
  hub.position.set(0, RING_C, 0.34);
  rig.add(hub);
  const hubCore = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), coreMat);
  hubCore.name = 'hubCore';
  hubCore.position.set(0, RING_C, 0.44);
  hubCore.renderOrder = 6;
  rig.add(hubCore);

  // ---- THE PORTCULLIS — 6 barred teeth on ONE named pivot. Idle: RAISED (the
  // tooth row just visible under the arch top — the door stands open). Charge
  // telegraph: the pivot DESCENDS into the gap (a ~9-world-unit silhouette
  // change in the void — §3.5, the named-pivot gate finds it). Death: it drops
  // closed for good. The bars ride BEHIND the window plane (z −0.55).
  const PORT_RAISED = 2.55, PORT_TRAVEL = 5.4, BAR_LEN = 4.2;
  const portcullisPivot = new THREE.Group();
  portcullisPivot.name = 'portcullisPivot';
  portcullisPivot.position.set(0, PORT_RAISED, -0.55);
  const portParts = [];
  for (let i = 0; i < 6; i++) {
    const x = -2.1 + i * 0.84;
    // Arched gate profile: outer bars shorter, so the raised grid tucks behind
    // the ring's circular silhouette instead of poking naked stubs past it.
    const len = BAR_LEN - Math.pow(Math.abs(x) / 2.1, 2) * 1.9;
    const bar = strip(new THREE.BoxGeometry(0.26, len, 0.2));
    bar.translate(x, len / 2 + 0.42, 0);
    portParts.push(bar);
    const tooth = strip(new THREE.ConeGeometry(0.2, 0.62, 4));
    tooth.rotateX(Math.PI);
    tooth.translate(x, 0.14, 0);
    portParts.push(tooth);
  }
  if (!lowQ) {
    for (const by of [0.9, 2.2, 3.4]) {
      const brace = strip(new THREE.BoxGeometry(4.5, 0.18, 0.16));
      brace.translate(0, by, 0);
      portParts.push(brace);
    }
  }
  const portcullis = new THREE.Mesh(mergeIv(portParts, 'portcullis'), ironMat);
  portcullis.name = 'portcullisBars';
  portcullisPivot.add(portcullis);
  rig.add(portcullisPivot);

  // ---- THE DARK EDGE CAGE (§5d) — EdgesGeometry over every big stone mass:
  // the painted line-work that keeps near-white stone from reading as a flat
  // sticker on a pale sky (and gives the §7b pale gate its dark-edge sample).
  for (const [geoSrc, thresh] of [
    [pillarFaceGeo, 12], [ringFace.geometry, 20], [vous.geometry, 12], [portcullis.geometry, 12],
  ]) {
    const cage = new THREE.LineSegments(new THREE.EdgesGeometry(geoSrc, thresh), cageMat);
    if (geoSrc === portcullis.geometry) portcullisPivot.add(cage);
    else rig.add(cage);
  }

  // ---- FLOATING MASONRY CHIPS (the orbiter contract ≥2; §3.8 satellites stay
  // dark — mid/dark stone, zero emissive lift). They drift slow ellipses around
  // the arch at two frequencies (idle-motion law §3.7).
  const chipGeo = strip(new THREE.BoxGeometry(0.5, 0.36, 0.42));
  const orbiters = [];
  const N_CHIP = lowQ ? 3 : 5;
  for (let i = 0; i < N_CHIP; i++) {
    const m = new THREE.Mesh(chipGeo, i % 2 ? stoneDarkMat : stoneMidMat);
    m.name = 'masonryChip';
    m.userData = {
      ang: (i / N_CHIP) * Math.PI * 2,
      rx: 4.9 + (i % 3) * 0.5, ry: 3.2 + (i % 2) * 1.3,
      cy: 0.5 + i * 1.1,
      speed: 0.16 + (i % 3) * 0.05,
      bob: 0.7 + (i % 2) * 0.5,
      spin: 0.3 + (i % 3) * 0.2,
    };
    rig.add(m);
    orbiters.push(m);
  }

  // Hit flash rings the ring's ivory (a struck door flares warm at its stone,
  // never toy-colored) — bound to the shared face tier's resting emissive.
  kit.flashBind(stoneFaceMat, 0.34);
  kit.finalize();

  // ==================================================================
  // ANIMATION — the pane expression rig, the portcullis, the entrance ignition.
  // ==================================================================
  let charge = 0;
  function setCharge(k) { charge = clamp01(k); }
  let tell = null;
  function setAttackTell(id) { tell = id || null; }
  let setpieceK = 0, dreadK = 0;
  function setSetpiece(k, sdef) {
    setpieceK = clamp01(k);
    dreadK = (sdef && sdef.dread) ? setpieceK : 0;
  }

  // Pane glow state: per-pane eased intensity toward a per-frame target.
  const paneGlow = new Array(8).fill(0.1);
  // The PUPIL — which pane is "looking". It TICKS between wedges (≤1 step per
  // PUPIL_TICK toward the gaze wedge): architecture ticking, never continuous
  // tracking (slot 14's exclusive claim, §5j).
  let pupilIdx = 6;                 // start on an upper pane
  let pupilCooldown = 0;
  const PUPIL_TICK = 0.5;
  let gazeTX = 0, gazeTY = 0;
  function setGaze(nx, ny) { gazeTX = clamp(nx, -1, 1); gazeTY = clamp(ny, -1, 1); }

  // Blink-analog: the candles dip — all panes gutter for a beat.
  const BLINK_DUR = 0.24;
  let blinkT = 0, nextBlink = 4 + Math.random() * 4;
  let noticeT = 0;
  function notice() { noticeT = 1.0; blinkT = 0; nextBlink = 4; }
  // Flinch: the struck church shudders on its float (rig offset spring).
  let painT = 0, painEase = 0;
  function flash(amt) { kit.flash(amt); }                        // cosmetic (every volley)
  function hurt(amt) { if (amt > 0.3) painT = Math.max(painT, 0.3); }   // real damage only

  // §5j VIGIL LIGHTS: the entrance ignition clock (null = fight). Panes light
  // one per beat and the LIT pane POOLS toward the steered side in DISCRETE
  // wedge-steps sampled on ignition beats ONLY.
  let entranceU = null;
  let entSteer = 0;                  // latest steer sample (the script feeds it)
  let entLitCount = 0;               // panes ignited so far (beat detector)
  let entPool = 6;                   // the pooled pane index (steps per beat)
  const entOrder = [4, 3, 5, 2, 6, 1, 7, 0];   // ignition order: bottom pair first, climbing both sides
  function setEntrance(u) {
    const was = entranceU != null;
    entranceU = u == null ? null : clamp01(u);
    if (entranceU != null && !was) { entLitCount = 0; entPool = 4; for (let i = 0; i < 8; i++) paneGlow[i] = 0; }
  }
  function setEntranceSteer(nx) { entSteer = clamp(nx ?? 0, -1, 1); }

  // Shield: the window leashes — hub damps (G6), panes dim, the portcullis
  // half-lowers (the door bars itself while invulnerable).
  let shieldClamp = false;
  kit.onShieldChange((v) => { shieldClamp = v; });

  // EMOTIONAL DEATH (§4b): panes gutter out one by one around the ring, the hub
  // dims to a last ember, the portcullis drops closed, the chips sink. A
  // mournful OPACITY fade only at the very end (no burn-out — the door goes
  // dark, then goes away). At k=1 every material is transparent (dissolve test).
  let dyingK = 0;
  function setDissolveEmotive(k) {
    dyingK = clamp01(k);
    const a = dyingK < 0.8 ? 1 : Math.max(0, 1 - (dyingK - 0.8) / 0.2);
    for (const m of kit.mats) {
      m.transparent = true;
      const base = m.userData.baseOpacity ?? 1;
      m.opacity = base * a;
      if (m.uniforms && m.uniforms.uOpacity) m.uniforms.uOpacity.value = base * a;
    }
  }

  // Wedge index nearest a gaze direction (nx right, ny up → ring angle).
  function gazeWedge(nx, ny) {
    if (Math.abs(nx) < 0.12 && Math.abs(ny) < 0.12) return null;   // dead-centre: no pull
    let a = Math.atan2(ny, nx);
    if (a < 0) a += Math.PI * 2;
    let best = 0, bd = 9;
    for (let i = 0; i < 8; i++) {
      let d = Math.abs(a - PANE_ANG[i]);
      d = Math.min(d, Math.PI * 2 - d);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  // One discrete step around the ring from `from` toward `to` (short way).
  function stepToward(from, to) {
    if (from === to) return from;
    const cw = (to - from + 8) % 8;
    return (from + (cw <= 4 ? 1 : -1) + 8) % 8;
  }

  function tickBody(dt, time) {
    // --- Idle float (≥2 frequencies, §3.7): the ruin breathes on its rig — a
    // slow bob + a sub-degree rock; the flinch shudder rides on top.
    if (painT > 0) painT -= dt;
    painEase += (Math.max(0, painT) - painEase) * Math.min(1, dt * 9);
    rig.position.y = Math.sin(time * 0.45) * 0.16 + Math.sin(time * 1.7) * 0.05;
    rig.position.x = painEase * Math.sin(time * 34) * 0.22;    // the struck shudder
    rig.rotation.z = Math.sin(time * 0.3) * 0.008 + painEase * Math.sin(time * 29) * 0.01;

    if (noticeT > 0) noticeT -= dt;
    if (blinkT > 0) blinkT -= dt;
    else if (entranceU == null && dyingK <= 0) {
      nextBlink -= dt;
      if (nextBlink <= 0 && charge < 0.4 && noticeT <= 0) { blinkT = BLINK_DUR; nextBlink = 4 + Math.random() * 4; }
    }
    const blink = blinkT > 0 ? 1 - Math.abs((blinkT / BLINK_DUR) * 2 - 1) : 0;

    // --- The PUPIL ticks (discrete wedge steps) toward the gaze wedge. ---
    pupilCooldown -= dt;
    if (entranceU == null && pupilCooldown <= 0) {
      const w = gazeWedge(gazeTX, gazeTY);
      if (w != null && w !== pupilIdx) { pupilIdx = stepToward(pupilIdx, w); pupilCooldown = PUPIL_TICK; }
    }

    // --- Pane targets per state (the expression rig). ---
    const flicker = (i) => 0.85 + Math.sin(time * 5.3 + i * 1.7) * 0.1 + Math.sin(time * 11 + i * 2.9) * 0.05;
    let hubK = 1;
    for (let i = 0; i < 8; i++) {
      let t;
      if (entranceU != null) {
        // VIGIL LIGHTS ignition — panes light one per beat, pooled pane hottest.
        const u = entranceU;
        const beats = clamp01((u - 0.10) / 0.72) * 8;         // 8 ignition beats across u 0.10–0.82
        const litN = Math.floor(beats);
        // Beat edge: sample the steer ONCE per ignition and step the pool.
        if (litN > entLitCount) {
          entLitCount = litN;
          const w = gazeWedge(entSteer, -0.2);
          if (w != null) entPool = stepToward(entPool, w);
        }
        const rank = entOrder.indexOf(i);
        const lit = rank < litN ? 1 : (rank === litN ? clamp01((beats - litN) * 2) : 0);
        const pooled = i === entPool ? 1.7 : 1;
        t = lit * 0.9 * pooled * flicker(i);
        hubK = u > 0.86 ? 0.4 + clamp01((u - 0.86) / 0.10) * 1.3 : 0.06;   // the hub ignites HOT at the end
      } else if (dyingK > 0) {
        // DEATH: the panes gutter out one by one around the ring (order = the
        // ignition order REVERSED — the vigil ends the way it began).
        const rank = entOrder.indexOf(i);
        const outN = dyingK * 10.5;                        // all dark by k≈0.76
        const alive = (7 - rank) >= outN ? 1 : 0;
        t = alive * (0.4 + (i === pupilIdx ? 0.4 : 0)) * flicker(i) * (1 - dyingK * 0.5);
        hubK = Math.max(0, 1 - dyingK * 1.6);              // the last ember gutters
      } else if (dreadK > 0.05) {
        // DREAD (Rose Judgment): the FULL ring burns — every pane lit hard.
        t = (1.5 + dreadK * 1.0) * flicker(i);
        hubK = 1.2 + dreadK * 0.5;
      } else if (shieldClamp) {
        // Shielded: the window BARS itself — panes ember-low, hub leashed (G6).
        t = 0.1 * flicker(i);
        hubK = 0.55;
      } else if (charge > 0.02) {
        // CHARGE: panes ignite clockwise from the pupil as the wind-up climbs.
        const litN = charge * 8;
        const rank = (i - pupilIdx + 8) % 8;
        t = (rank < litN ? 1.5 : 0.05) * flicker(i);
        hubK = 1 + charge * 0.35;
      } else if (noticeT > 0) {
        // NOTICE (§4.6, gate r4 dir 2) — a HARD two-beat snap that reads in a
        // glance: every pane SLAMS DARK except the pupil (the door's eye finds
        // you) … then the full ring FLASHES once as the beat releases.
        t = noticeT > 0.35 ? (i === pupilIdx ? 2.4 : 0.02) : 1.5 * flicker(i);
      } else {
        // VIGIL idle — the LEADED FIELD is the default read (gate r4 dir 4):
        // the white-hot PUPIL pane + its warm neighbours + the two saturated
        // COOL panes held lit, so the window never collapses to a gold ring-eye.
        const rank = Math.min((i - pupilIdx + 8) % 8, (pupilIdx - i + 8) % 8);
        t = (rank === 0 ? 2.4 : rank === 1 ? 0.35 : 0.14) * flicker(i);
        if (PANE_COOL[i]) t = Math.max(t, 0.6 * flicker(i));   // the stained blues/teals stay lit
      }
      // The two bottom VIGIL CANDLES never fully die outside death/blink — the
      // door is always praying (and the warm floor anchors the G3 identity).
      if (PANE_CANDLE[i] && entranceU == null && dyingK <= 0 && !shieldClamp) t = Math.max(t, 0.55 * flicker(i));
      t *= (1 - blink * 0.88);
      // THE PUPIL is visually DISTINCT from mood glass (gate r4 dir 3): its
      // emissive shifts toward white-hot so "where the bright near-white pane
      // sits" = "where the door is looking", second only to the hub.
      paneMats[i].emissive.setHex(PANE_HUES[i]);
      if (i === pupilIdx && entranceU == null && dyingK <= 0 && !shieldClamp && dreadK <= 0.05) {
        paneMats[i].emissive.lerp(_white, 0.55);
      }
      paneGlow[i] += (t - paneGlow[i]) * Math.min(1, dt * 7);
      paneMats[i].emissiveIntensity = paneGlow[i];
    }
    if (noticeT > 0.4) hubK *= 1.45;                        // the hub flares on the notice beat
    hubK *= (1 - blink * 0.6);
    hubMat.color.copy(HUB_BASE).multiplyScalar(Math.max(0.03, hubK) * HUB_HOT);
    coreMat.color.setScalar(CORE_HOT * Math.max(0.02, shieldClamp ? 0.55 : hubK * (dyingK > 0 ? (1 - dyingK * 1.4) : 1)));
    hubCore.visible = dyingK < 0.72;
    hub.scale.setScalar(1 + Math.sin(time * 2.1) * 0.05 + (dreadK > 0 ? dreadK * 0.3 : 0));

    // --- The PORTCULLIS: raised at idle; DESCENDS with the charge (the §3.5
    // silhouette telegraph — wall volleys drop it deepest); half-bars under a
    // shield; slams closed in death and at full dread. A slight rattle while
    // moving sells the iron. ---
    const wallTell = (tell === 'curtain' || tell === 'movingGap' || tell === 'iris') ? 1 : 0.62;
    let drop = charge * wallTell;
    if (shieldClamp) drop = Math.max(drop, 0.5);
    if (dreadK > 0) drop = Math.max(drop, dreadK);
    if (dyingK > 0) drop = Math.max(drop, clamp01(dyingK * 1.8));
    if (entranceU != null) {
      // The door's one entrance move: shut through the vigil, DROPS at the hub
      // ignition, then LIFTS fully — a door opening in invitation.
      const u = entranceU;
      drop = u < 0.86 ? 0.22 : u < 0.93 ? clamp01((u - 0.86) / 0.05) : Math.max(0, 1 - (u - 0.93) / 0.07) * 1.0;
    }
    portDrop += (drop - portDrop) * Math.min(1, dt * (drop > portDrop ? 5 : 3));
    portcullisPivot.position.y = PORT_RAISED - portDrop * PORT_TRAVEL;
    portcullisPivot.position.x = portDrop > 0.02 && portDrop < 0.98 ? Math.sin(time * 40) * 0.02 : 0;

    // --- Masonry chips: slow ellipses + a 2nd-frequency bob; they SINK in death
    // (the arch sheds its stones as the light dies). Kick outward on a flinch. ---
    for (const o of orbiters) {
      const u = o.userData;
      u.ang += dt * u.speed * (1 + painEase * 2);
      const kick = 1 + painEase * 0.35;
      o.position.set(
        Math.cos(u.ang) * u.rx * kick,
        u.cy + Math.sin(u.ang) * u.ry + Math.sin(time * u.bob + u.ang) * 0.4 - dyingK * (6 + u.cy),
        Math.sin(u.ang * 1.3) * 0.9
      );
      o.rotation.x += dt * u.spin;
      o.rotation.y += dt * u.spin * 1.4;
    }
    // The orphan scar-shard hovers in the ring bite on its own two beats.
    scarShard.position.y = SCAR_POS[1] + Math.sin(time * 0.9) * 0.12 + Math.sin(time * 2.3) * 0.04;
    scarShard.rotation.z += dt * 0.2;
  }
  let portDrop = 0;

  // Muzzle: fire originates at the ROSE HUB (emitter = organ, §5f law 7; the
  // def names it via def.muzzle = 'roseHub'). Static node on the group.
  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, RING_C, 0.6);
  group.add(muzzle);

  // ---- §7b per-sheet diagnostics (tests/boss.mjs asserts on them). ----
  const sc = def.scale ?? 1.5;
  function archGapWidth() { return GAP_HALF * 2 * sc; }             // world fly-through width
  function archGapSpan() { return { lo: PILLAR_BASE * sc, hi: PILLAR_TOP * sc }; }   // world y-span (group-relative)
  function portcullisDrop() { return portDrop * PORT_TRAVEL * sc; } // live world drop
  function paneIntensities() { return paneGlow.slice(); }
  function pupilPane() { return pupilIdx; }

  return {
    group, muzzle, orbiters,
    setDissolve: setDissolveEmotive,
    setCharge,
    setAttackTell,
    setSetpiece,
    setGaze,
    notice,
    setEntrance, setEntranceSteer,
    setHealth: kit.setHealth,
    setHealthBarVisible: kit.setHealthBarVisible,
    setShieldVisible: kit.setShieldVisible,
    shatterShield: kit.shatterShield,
    flash, hurt,
    tick(dt, time) { tickBody(dt, time); kit.tickCommon(dt, time); },
    // §7b diagnostics + studio pins (not part of the controller contract).
    archGapWidth, archGapSpan, portcullisDrop, paneIntensities, pupilPane,
    dispose() {
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    },
  };
}
