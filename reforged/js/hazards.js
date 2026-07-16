import * as THREE from 'three';
import { CONFIG } from './config.js';
import { game } from './gameState.js';
import { hitPlayer } from './collision.js';
import { makeGlowTexture } from './util.js';
import { burst } from './particles.js';
import { mergeGeometries } from '../lib/utils/BufferGeometryUtils.js';

// Biome hazards (BIOME-DESIGN.md §5.3) — dodge-only, magenta, role-locked.
// Placement is deterministic (level.js#overlayBiomeHazards on its OWN RNG
// stream → out.hazards; never touches rings/obstacles/golds), but the burst
// TIMING and collision live here at runtime. Same individual-mesh lifecycle as
// goldEmbers.js: init (shared resources) → add (per-vent meshes) → update
// (timing loop + collision + FX) → reset.
//
// The geyser: a slim OPAQUE magenta core column (never an enclosing additive
// shell — §8 overdraw rule) + an additive base flare that sells the lethal
// footprint + rim embers while erupting. Each vent cycles on GAME TIME,
// phase-offset so the field never pulses in lockstep. Collision (a vertical
// cylinder: horizontal distance in the x/dist plane) is live only during the
// lethal burst window, and never during a boss fight (clean-arena law).

const DANGER = 0xff2b6a;         // role-locked danger magenta (Law 6)
const COLUMN_H = CONFIG.laneMaxY + 6;   // rises through the whole flyable lane
// Legacy A/B flip (mirrors environment.js PROPS_V1): `?props=v1` restores the bare pre-overhaul
// vent (no vent-site presentation); default ships THE SCOURMAW. Render-only, deterministic-safe.
const PROPS_V1 = (typeof location !== 'undefined' && new URLSearchParams(location.search || '').get('props') === 'v1');

// Caldera ladder stops (mirror obstacles.js) for the vent-site vertex tints.
const _CAL_BELLY = [0.98, 0.30, 0.06];    // hot ember belly (the family waterline seam, under an overhang)
const _CAL_SEAM_TOP = [0.30, 0.09, 0.03]; // the seam fading up into the undercut
const _CAL_SKIRT_LO = [0.16, 0.05, 0.02]; // dark warm base of the main skirt flank
const _CAL_SKIRT_HI = [0.06, 0.045, 0.04];// near-black basalt skirt top
const _CAL_CRUST = [0.36, 0.31, 0.33];    // cool ash-grey crust (breach tops)
const _CAL_VOID = [0.01, 0.007, 0.007];   // the void floor — darker than anything in the kit
const _CAL_VOID_MID = [0.02, 0.012, 0.012]; // dish body — dead-black, just above the floor
const _CAL_RIM = [0.05, 0.035, 0.03];     // dish rim (dark, not basalt) — legacy, unused after the iris
const _CAL_EJECTA_LO = [0.085, 0.06, 0.055]; // ejecta base (basalt)
const _CAL_EJECTA_HI = [0.04, 0.03, 0.028];  // cold dead ejecta top

let scene = null;
let coreGeo = null;
let coreMat = null;
let flareTex = null;
let ventSiteGeo = null;
let ventSiteMat = null;
const vents = [];

// Fold the per-vertex colour into emissive (emissive × vColor) — the belly seam self-lights while
// the void verts kill emissive dead. Same seam as obstacles.js withLadderEmissive.
function foldEmissive(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;',
    );
  };
  return mat;
}
// Vertical vertex-colour gradient across the geometry's current y-extent: low at the bottom,
// high at the top. Baked per-part before the merge.
function tint(geo, low, high) {
  geo.computeBoundingBox();
  const y0 = geo.boundingBox.min.y, dy = (geo.boundingBox.max.y - y0) || 1;
  const p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (p.getY(i) - y0) / dy;
    for (let k = 0; k < 3; k++) col[i * 3 + k] = low[k] + (high[k] - low[k]) * t;
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// THE SCOURMAW (CALDERA-BIBLE.md — the geyser vent-site presentation). A blast-scoured maw: a
// void-black basin (a dark HOLE punched in the bright lava mirror — negative light, the one visual
// word the field never uses) ringed by broken dark ejecta, with the untouched magenta flare/column
// seated inside as the "pupil". No warm emissive inside the ring (magenta purity), no annular clone
// in the kit (unique plan-view read), all mass ≤ y 1.35 (below laneMinY 2.5 → never a flight
// obstacle), no collider. Fire lives ONLY on the OUTER skirt waterline (the family belly seam).
// 3-ring dish tint: an ash-grey RIM lip → void body → void-black floor. Most of the dish stays
// dead-black; only the top rim ring is cool ash-grey — the "iris" that outlines the black maw on a
// DARK background (grey exists nowhere else on the ground plane), while the black hole carries it on
// bright lava. Two non-orange/non-magenta legibility channels. Rings sit at y ≈ 1.10 / 0.60 / 0.10.
function dishTint(geo) {
  const p = geo.attributes.position, n = p.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = p.getY(i);
    const c = y > 0.85 ? _CAL_CRUST : y > 0.35 ? _CAL_VOID_MID : _CAL_VOID;
    for (let k = 0; k < 3; k++) col[i * 3 + k] = c[k];
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

function buildVentSite() {
  const NI = (g) => (g.index ? g.toNonIndexed() : g);
  const parts = [];
  // A1 — waterline UNDERCUT collar: rTop>rBottom so the hot face is an OVERHANG facing DOWN
  // (colonnata's plinth trick) — the fire is a recessed seam pinned at the lava line, NOT a glow
  // painted up a flank. Belly ember under the lip → dark just above it. Widened to the blast shield.
  parts.push(tint(NI(new THREE.CylinderGeometry(6.4, 5.9, 0.30, 9, 1, true).translate(0, 0.15, 0)), _CAL_BELLY, _CAL_SEAM_TOP));
  // A2 — main skirt: a broad shallow BLAST-SCOUR SHIELD (Ø~12) of near-black basalt around the maw —
  // the big dark event that punches the hole in the bright lava at range. The safe rock, not the kill
  // zone (the void basin below stays = the lethal footprint).
  parts.push(tint(NI(new THREE.CylinderGeometry(3.7, 6.1, 0.85, 9, 1, true).translate(0, 0.72, 0).rotateY(0.22)), _CAL_SKIRT_LO, _CAL_SKIRT_HI));
  // B — throat dish (the void = the honest kill footprint): inner radius ~3.6 ≈ lethal 3.2 + margin.
  // Apex y0.10 (never below, or the lava mirror slices it and the basin floods bright). 3-ring iris.
  const dish = NI(new THREE.ConeGeometry(3.6, 1.0, 9, 2, true)); dish.scale(1, -1, 1); dish.translate(0, 0.60, 0);
  parts.push(dishTint(dish));
  // C — rim breach wedges ×3 (break the ash iris so it never reads machined; snapped, not turned).
  // Dropped + de-tilted so the tallest corner stays ≤ 1.6 (phantom-clip margin under the lane).
  const breach = [[0.4, 0.42, 0.95], [2.3, 0.45, 0.92], [4.6, -0.35, 0.95]];
  for (const [a, rz, y] of breach) {
    const b = tint(NI(new THREE.BoxGeometry(2.0, 0.5, 1.2)), _CAL_SKIRT_LO, _CAL_CRUST);
    b.rotateZ(rz); b.rotateY(a + 0.3); b.translate(Math.cos(a) * 3.9, y, Math.sin(a) * 3.9);
    parts.push(b);
  }
  // D — radial ejecta fingers ×3 (the scoured star; the unique concentric silhouette). Cold, quiet,
  // half-sunk in the lava (the sub-waterline part is occluded by the opaque mirror → a rising ridge).
  for (const a of [1.4, 3.5, 5.5]) {
    const f = NI(new THREE.ConeGeometry(0.7, 3.6, 4));
    f.rotateZ(-Math.PI / 2);           // apex → +x (radially outward)
    f.translate(7.8, 0.26, 0);         // base at r6.0, tip at r9.6, low on the water
    f.rotateY(a);
    parts.push(tint(f, _CAL_EJECTA_LO, _CAL_EJECTA_HI));
  }
  const geo = mergeGeometries(parts, false);
  geo.computeVertexNormals();
  return geo;
}

export function initHazards(s) {
  scene = s;
  // Slim opaque core (radius 0.9), origin at its BASE so scaling Y grows it
  // upward from the water like a real jet.
  coreGeo = new THREE.CylinderGeometry(0.55, 0.9, COLUMN_H, 7, 1, true);
  coreGeo.translate(0, COLUMN_H / 2, 0);
  coreMat = new THREE.MeshStandardMaterial({
    color: 0x2a0406, emissive: DANGER, emissiveIntensity: 2.2,
    roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide,
  });
  flareTex = makeGlowTexture('255,60,120');
  if (!PROPS_V1) {
    ventSiteGeo = buildVentSite();
    ventSiteMat = foldEmissive(new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.82, metalness: 0.0,   // matte: no GGX sun-sheen across the void at grazing angles
      emissive: 0xff5a20, emissiveIntensity: 0.30, side: THREE.DoubleSide,
    }));
  }
}

// p = { dist, x, warn, radius, phase } from out.hazards.
export function addHazard(p) {
  if (!scene) return;
  const period = p.warn + CONFIG.hazardBurstDur + CONFIG.hazardIdle;
  const group = new THREE.Group();
  group.position.set(p.x, 0, -p.dist);

  const core = new THREE.Mesh(coreGeo, coreMat);
  core.visible = false;
  group.add(core);

  // THE SCOURMAW vent site (presentation only, no collider): a stamped ring/void the column erupts
  // from. Random yaw so the ejecta stars don't grid; NO scale (the void basin IS the honest kill
  // footprint, kept uniform so the telegraph stays learnable). Math.random is render-only here (the
  // hazards.js idiom for FX — it never touches the deterministic placement stream).
  if (ventSiteGeo && p.type === 'geyser') {
    const site = new THREE.Mesh(ventSiteGeo, ventSiteMat);
    site.rotation.y = Math.random() * Math.PI * 2;
    group.add(site);
  }

  // Base flare — an additive disc lying flat on the water that marks the vent
  // (dim when idle so the player can READ the field ahead) and flares magenta
  // through the telegraph so the eruption is warned. Scaled to the lethal
  // footprint so the danger zone is honest.
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flareTex, color: DANGER, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  flare.scale.set(p.radius * 2.6, p.radius * 2.6, 1);
  flare.position.y = 0.4;
  group.add(flare);

  scene.add(group);
  vents.push({
    group, core, flare, dist: p.dist, x: p.x, warn: p.warn,
    radius: p.radius, phase: p.phase, period, rimT: 0,
  });
}

export function updateHazards(dt, player, time) {
  const R = CONFIG.playerRadius;
  for (let i = vents.length - 1; i >= 0; i--) {
    const v = vents[i];
    if (v.dist < player.dist - CONFIG.cullBehind) { removeAt(i); continue; }

    // Where in its cycle is this vent? phase offset keeps the field out of lockstep.
    const cyc = (time + v.phase * v.period) % v.period;
    const bt = cyc - v.warn;                    // seconds since the burst began (<0 = still charging)
    const charging = cyc < v.warn;
    const erupting = bt >= 0 && bt < CONFIG.hazardBurstDur;

    // Visual column height: snaps up fast, holds, drops at the end (a jet, not a lerp).
    let up = 0;
    if (erupting) {
      up = Math.min(1, bt / 0.12, (CONFIG.hazardBurstDur - bt) / 0.18);
      up = Math.max(0, up);
    }
    v.core.visible = up > 0.01;
    if (v.core.visible) v.core.scale.set(1, up, 1);

    // Base flare: a dim always-on marker, brightening across the telegraph
    // (charge²so the tell reads late), full during the eruption.
    const charge = charging ? cyc / v.warn : 0;
    const flareOp = Math.max(0.18, erupting ? 0.9 : charge * charge * 0.85);
    v.flare.material.opacity = flareOp;
    const flareScale = v.radius * (erupting ? 3.0 : 2.6 + charge * 0.6);
    v.flare.scale.set(flareScale, flareScale, 1);

    // Rim embers riding the jet while it's up (the "children of the fire" look).
    if (erupting) {
      v.rimT -= dt;
      if (v.rimT <= 0 && v.dist - player.dist < 170) {
        v.rimT = 0.05;
        _tmp.set(v.x + (Math.random() - 0.5) * v.radius, 1 + Math.random() * COLUMN_H, -v.dist);
        burst(_tmp, DANGER, { count: 2, speed: 11, size: 0.7, life: 0.5 });
      }
    }

    // Collision: a vertical cylinder — lethal only while erupting, never during
    // a boss fight (clean-arena law, mirrors collision.js). Routes through
    // hitPlayer → zero knockback, barrel-roll i-frames clear it (dodge-only).
    if (erupting && !game.inBoss && game.state === 'playing') {
      const dx = player.position.x - v.x;
      const dz = player.dist - v.dist;
      if (dx * dx + dz * dz < (v.radius + R) * (v.radius + R)) {
        hitPlayer(player, CONFIG.hazardDamage, 'geyser', { x: 0, y: -1 });   // a geyser strikes from below
      }
    }
  }
}

function removeAt(i) {
  const v = vents[i];
  scene.remove(v.group);
  v.flare.material.dispose();
  vents.splice(i, 1);
}

// Drop every live vent — called on run reset AND on bossStart (a boss fight is a
// clean arena; a column left standing would collide the moment the fight ends).
export function resetHazards() {
  while (vents.length) removeAt(vents.length - 1);
}

// Capture-only: report each live vent's display state so a tool can wait for a chosen phase
// (idle vs eruption) before shooting — the vent cycles on the render clock, not game.time.
export function debugVentStates() {
  return vents.map((v) => ({ dist: v.dist, x: v.x, erupting: v.core.visible, up: v.core.scale.y, flareOp: v.flare.material.opacity }));
}

const _tmp = new THREE.Vector3();
