import { CONFIG } from './config.js';
import { mulberry32, clamp } from './util.js';
import { BIOMES } from './biomes.js';
import { FIRST_FLIGHT_BEATS, FIRST_FLIGHT_END } from './firstFlight.js';

const lerp = (a, b, k) => a + (b - a) * k;
const REACH_AUDIT = new URLSearchParams(window.location.search).get('debug') === 'reach';
// Obstacle test harness: ?canyon=split|rib|spiral|overunder|all forces Sky
// Canyon runs to begin right after takeoff and repeat (with normal rings before
// and after each), so every archetype can be flown immediately. null in normal
// play and in the headless tests (no query param) → zero behaviour change.
const CANYON_FORCE = new URLSearchParams(window.location.search).get('canyon');
// Two canyon set-pieces: a ROCK RUN (mixed split slabs + over-under shelves) and
// a DRAGON SPINE CANYON (skull entrance → throat → ribcage → vertebrae → sky exit).
const CANYON_MODES = ['rock', 'spine'];

// Set-pieces are computed from the biome grid: a gateway arch at every biome
// boundary (k * biomeLength) and a mega-arch at each biome midpoint.
// main.js watches the emitted events and builds the geometry (setpieces.js).
function setPiecesBetween(a, b, out) {
  const L = CONFIG.biomeLength;
  const HALF = L / 2;
  const N = BIOMES.length;
  // Boundary gateways
  for (let k = Math.floor(a / L) + 1; k * L <= b; k++) {
    out.push({ type: 'biomeGate', dist: k * L, biomeIndex: k % N });
  }
  // Midpoint mega-arches (skip the very first half-point: tutorial zone)
  for (let k = Math.floor((a - HALF) / L) + 1; k * L + HALF <= b; k++) {
    if (k * L + HALF < 600) continue;
    out.push({ type: 'megaArch', dist: k * L + HALF, biomeIndex: k % N });
  }
}

export function createLevelGen(seed = CONFIG.seed, opts = {}) {
  const rnd = mulberry32(seed);
  // First-flight authored opening: walk FIRST_FLIGHT_BEATS until FIRST_FLIGHT_END,
  // then fall through to procedural generation. Only set for a brand-new pilot's
  // very first normal run (main.js).
  const scripted = !!opts.scripted;
  let scriptIdx = 0;
  // Golden embers draw from an INDEPENDENT stream: adding calls to the main
  // rnd would reshuffle every existing seed and break old challenge links.
  const goldRnd = mulberry32((seed ^ 0x6b79d8a1) >>> 0);
  let nextGoldAt = CONFIG.goldEmberInterval;
  // Sky Canyon also runs on its OWN independent stream and overlays the course
  // as a separate output (never touches rnd / rings / obstacles), so the base
  // course for a seed stays byte-identical (gold-determinism fixture safe).
  const canyonRnd = mulberry32((seed ^ 0x2f9b4e17) >>> 0);
  // Test harness brings the first canyon in right after takeoff; normal play
  // waits past the tutorial with a jittered interval.
  let nextCanyonAt = CANYON_FORCE ? 340 : CONFIG.canyonFirstAt + canyonRnd() * 500;
  let canyon = null; // { type, left, idx, total } while a canyon run is in progress
  let forceAllToggle = false; // ?canyon=all alternates rock/spine runs
  let prev = { dist: 0, x: 0, y: 8 };
  let swingX = 1;
  let swingY = 1;
  let untilGate = 3;
  let untilOrb = 2; // first orb comes faster
  let generatedUntil = 0;
  let prevHopDirX = 0;
  let prevHopDirY = 0;

  // Reward rhythm: the course breathes between flowing spacing, rapid-fire
  // ring bursts and long open straights, so the cadence never goes metronomic.
  //   flow   — the tuned default spacing
  //   burst  — tight chains of close rings (gentle swing, no gates)
  //   breath — sparse stretch, room to boost flat-out
  let rhythm = { mode: 'flow', left: 5 };
  const RHYTHM = { flow: 1, burst: 0.7, breath: 1.45 };

  function nextRhythm() {
    const r = rnd();
    const mode = r < 0.5 ? 'flow' : r < 0.8 ? 'burst' : 'breath';
    rhythm = { mode, left: mode === 'flow' ? 4 + Math.floor(rnd() * 3) : 3 + Math.floor(rnd() * 3) };
  }

  // Gauntlets: occasional hand-built corridor sequences (bar + spike walls
  // leaving one generous open quadrant) that steer the player along a
  // slalom path — a forced line that breaks up the free-roam cruising.
  let gauntlet = null; // { stations: [{qx, qyLow}], i }
  let untilGauntlet = 650 + rnd() * 450;

  const difficulty = (d) => {
    // First 300m: forced easy approach (tutorial)
    if (d < 300) return 0;
    const t = (d - 300) / CONFIG.difficultyRamp;
    return t <= 1 ? t : 1 + (t - 1) * 0.25;
  };

  function nextWaypoint() {
    const t = difficulty(prev.dist);
    const tc = Math.min(t, 1);
    if (--rhythm.left <= 0) nextRhythm();
    const inBurst = rhythm.mode === 'burst' && t > 0;
    // First few hops are shorter so the player gets rewards quickly
    const baseClose = prev.dist < 200 ? 42 : 78;
    const idealSpacing = CONFIG.lineDesignSpeed * CONFIG.idealRewardHopTime;
    const minLateSpacing = CONFIG.lineDesignSpeed * CONFIG.minRewardHopTime;
    let spacing = lerp(baseClose, idealSpacing, tc) * (0.88 + rnd() * 0.24);
    if (prev.dist > 1600) spacing = Math.max(spacing, minLateSpacing);
    spacing *= t > 0 ? RHYTHM[rhythm.mode] : 1; // tutorial zone keeps the tuned cadence
    const dist = prev.dist + spacing;
    const hopTime = spacing / CONFIG.lineDesignSpeed;
    const safety = Math.min(lerp(0.45, CONFIG.lateGameReachSafety, t), CONFIG.lateGameReachSafety); // gentler early
    const maxDx = CONFIG.lateralSpeed * hopTime * safety;
    const maxDy = CONFIG.verticalSpeed * hopTime * safety;

    if (rnd() < 0.8) swingX *= -1;
    if (rnd() < 0.6) swingY *= -1;

    // First waypoint stays near centre so first ring is easy; ring bursts
    // swing gently so the rapid chain stays flowing, not twitchy.
    const swingFraction = prev.dist < 80 ? 0.2 : inBurst ? (0.2 + rnd() * 0.2) : (0.45 + rnd() * 0.55);
    let x = prev.x + swingX * swingFraction * maxDx;
    let y = prev.y + swingY * swingFraction * maxDy;

    if (prev.dist > 1600) {
      const dxSign = Math.sign(x - prev.x);
      const dySign = Math.sign(y - prev.y);
      if (prevHopDirX && dxSign === -prevHopDirX && Math.abs(x - prev.x) > maxDx * 0.55) {
        x = prev.x + dxSign * maxDx * 0.42;
      }
      if (prevHopDirY && dySign === -prevHopDirY && Math.abs(y - prev.y) > maxDy * 0.55) {
        y = prev.y + dySign * maxDy * 0.42;
      }
    }

    if (x < -10 || x > 10) { x = clamp(x, -10, 10); swingX *= -1; }
    if (y < 5.5 || y > 19) { y = clamp(y, 5.5, 19); swingY *= -1; }
    return { dist, x, y };
  }

  function auditHop(a, b, kind) {
    if (!REACH_AUDIT) return;
    const hopTime = (b.dist - a.dist) / CONFIG.lineDesignSpeed;
    const reqX = Math.abs(b.x - a.x) / Math.max(hopTime, 0.001);
    const reqY = Math.abs(b.y - a.y) / Math.max(hopTime, 0.001);
    const safeX = CONFIG.lateralSpeed * CONFIG.boostSteeringBonus * CONFIG.lateGameReachSafety;
    const safeY = CONFIG.verticalSpeed * CONFIG.boostSteeringBonus * CONFIG.lateGameReachSafety;
    const ratio = Math.max(reqX / safeX, reqY / safeY);
    if (ratio > 0.92) {
      console.warn('[reach-audit]', kind, {
        from: Math.round(a.dist),
        to: Math.round(b.dist),
        hopTime: hopTime.toFixed(2),
        reqX: reqX.toFixed(1),
        reqY: reqY.toFixed(1),
        ratio: ratio.toFixed(2),
      });
    }
  }

  function hopObstacles(a, b, out) {
    const t = difficulty(a.dist);
    if (t <= 0) return; // tutorial zone: no obstacles
    const tc = Math.min(t, 1);
    const env = {
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    };
    const cx = (env.minX + env.maxX) / 2;
    const cy = (env.minY + env.maxY) / 2;
    const halfW = (env.maxX - env.minX) / 2;
    const halfH = (env.maxY - env.minY) / 2;
    const CLEAR = CONFIG.pathClearance;

    const budget = 0.55 + tc * 1.1 + Math.max(0, t - 1) * 0.4;
    const count = Math.floor(budget) + (rnd() < budget % 1 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const d = a.dist + (0.3 + rnd() * 0.4) * (b.dist - a.dist);
      const roll = rnd();

      if (roll < 0.27) {
        const r = 1.6 + rnd() * 1.4;
        const side = cx > 4 ? -1 : cx < -4 ? 1 : rnd() < 0.5 ? -1 : 1;
        const edge = side < 0 ? env.minX : env.maxX;
        const x = clamp(edge + side * (r + CLEAR + rnd() * 3), -12.5, 12.5);
        if (x <= env.minX - (r + CLEAR) || x >= env.maxX + (r + CLEAR)) {
          out.obstacles.push({ type: 'pillar', dist: d, x, r, h: 8 + rnd() * 13 });
        }
      } else if (roll < 0.55) {
        const r = 1.4 + rnd() * 1.2;
        const ang = rnd() * Math.PI * 2;
        const off = Math.hypot(halfW, halfH) + r + CLEAR + rnd() * 2.5;
        const x = clamp(cx + Math.cos(ang) * off, -11, 11);
        const y = clamp(cy + Math.sin(ang) * off, 3, 20);
        const ddx = Math.max(env.minX - x, 0, x - env.maxX);
        const ddy = Math.max(env.minY - y, 0, y - env.maxY);
        if (Math.hypot(ddx, ddy) >= r + CLEAR) {
          out.obstacles.push({ type: 'shard', dist: d, x, y, r });
        }
      } else if (roll < 0.75) {
        if (halfH * 2 < 3) {
          const r = 0.7 + rnd() * 0.4;
          const below = env.minY - (r + 4) - rnd() * 1.5;
          const above = env.maxY + (r + 4) + rnd() * 1.5;
          if (below >= 1.4 && (rnd() < 0.5 || above > 21.5)) {
            out.obstacles.push({ type: 'bar', dist: d, y: below, r });
          } else if (above <= 21.5) {
            out.obstacles.push({ type: 'bar', dist: d, y: above, r });
          }
        }
      } else if (t > 0.25) {
        const r = 1.3 + rnd() * 0.9;
        const amp = 1.5 + tc * 2;
        const speed = 1 + tc * 1.4 + rnd() * 0.5;
        const side = cx > 4 ? -1 : cx < -4 ? 1 : rnd() < 0.5 ? -1 : 1;
        const edge = side < 0 ? env.minX : env.maxX;
        const baseX = clamp(edge + side * (r + CLEAR + amp + rnd() * 2), -12, 12);
        const y = clamp(cy + (rnd() * 2 - 1) * 2.5, 3, 20);
        const nearest = Math.abs(baseX - (side < 0 ? env.minX : env.maxX)) - amp;
        if (nearest >= r + CLEAR) {
          out.obstacles.push({
            type: 'shard', dynamic: true, dist: d, r,
            baseX, baseY: y, amp, speed, phase: rnd() * Math.PI * 2,
            x: baseX, y,
          });
        }
      }
    }
  }

  // One gauntlet station: blockers sealing everything except one generous
  // open quadrant (≈9 units wide, half the lane tall — roomy, never
  // claustrophobic). A spanning bar reads as the "log", a spike wall and a
  // floating shard close the other side, leaving one obvious door.
  function gauntletStation(st, dist, out) {
    const cx = st.qx * 4.5;
    const cy = st.qyLow ? 8 : 14.5;
    // Horizontal log sealing the other vertical half
    const barY = st.qyLow ? 16.5 + rnd() * 2 : 4 + rnd();
    out.obstacles.push({ type: 'bar', dist, y: barY, r: 0.85 });
    // Spike wall sealing the other lateral side
    out.obstacles.push({
      type: 'pillar', dist: dist + 6,
      x: -st.qx * (6.5 + rnd() * 2.5), r: 1.9 + rnd() * 0.7,
      h: st.qyLow ? 20 : 11,
    });
    // A floating shard plugs the diagonal at corridor height
    out.obstacles.push({
      type: 'shard', dist: dist - 5,
      x: -st.qx * (4.5 + rnd() * 2), y: cy + (st.qyLow ? 1.5 : -1.5),
      r: 1.5 + rnd() * 0.5,
    });
    return { dist, x: cx + (rnd() - 0.5) * 2, y: cy + (rnd() - 0.5) * 1.5 };
  }

  // Straight guide line of embers between two waypoints (gauntlet corridors):
  // follow the embers = thread the door.
  function guideLine(a, b, out) {
    const points = [];
    for (let k = 0; k < 5; k++) {
      const tt = 0.3 + k * 0.14;
      points.push({
        dist: a.dist + (b.dist - a.dist) * tt,
        x: a.x + (b.x - a.x) * tt,
        y: a.y + (b.y - a.y) * tt,
      });
    }
    out.embers.push({ points });
  }

  // Golden embers: one spawn opportunity per goldEmberInterval metres, rolled
  // on the independent goldRnd stream. Skipped inside gauntlets and the
  // tutorial zone (the opportunity passes silently). Pity: after two missed
  // rolls the third golden is guaranteed — variable ratio with a floor, so
  // no run goes treasure-less for kilometres (bounded randomness).
  let goldMisses = 0;
  function maybeGold(a, b, out, allow) {
    while (b.dist > nextGoldAt) {
      const at = nextGoldAt;
      nextGoldAt += CONFIG.goldEmberInterval;
      if (!allow || at < 400) continue;
      if (goldRnd() >= CONFIG.goldEmberChance && goldMisses < 2) { goldMisses++; continue; }
      goldMisses = 0;
      const t = clamp((at - a.dist) / Math.max(b.dist - a.dist, 1), 0.15, 0.85);
      out.goldEmbers.push({
        dist: a.dist + (b.dist - a.dist) * t,
        x: clamp(a.x + (b.x - a.x) * t + (goldRnd() * 2 - 1) * 3, -10, 10),
        y: clamp(a.y + (b.y - a.y) * t + 1.2 + goldRnd() * 1.6, 5, 18),
      });
    }
  }

  // Ember coin-trail: an arc of pickups tracing the ideal line to the next
  // reward. Doubles as path guidance (follow the embers = thread the ring).
  function emberArc(a, b, out) {
    if (rnd() > 0.45) return;
    const n = 6 + Math.floor(rnd() * 4);
    const lift = 1 + rnd() * 1.8;
    const points = [];
    for (let i = 0; i < n; i++) {
      const t = 0.16 + (i / (n - 1)) * 0.68;
      points.push({
        dist: a.dist + (b.dist - a.dist) * t,
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * lift,
      });
    }
    out.embers.push({ points });
  }

  // Emit one authored first-flight beat, advancing `prev` so procedural
  // generation can continue seamlessly once the script ends. Reuses the same
  // spawn shapes and helpers as the procedural path.
  function scriptedBeat(b, out) {
    if (b.type === 'gauntlet') {
      out.gauntletStarts.push(prev.dist + 20);
      let p = prev;
      let d = b.dist;
      for (const st of b.stations) {
        const wp = gauntletStation(st, d, out);
        out.rings.push({ dist: wp.dist, x: wp.x, y: wp.y });
        guideLine(p, wp, out);
        p = wp;
        d += 70;
      }
      out.gauntletEnds.push(p.dist + 15);
      prev = p;
      return;
    }
    if (b.type === 'gate') {
      emberArc(prev, b, out);
      setPiecesBetween(prev.dist, b.dist, out.setPieces);
      out.obstacles.push({
        type: 'gate', dist: b.dist, gapX: b.x, gapY: b.y,
        gapW: CONFIG.gateGapW, gapH: CONFIG.gateGapH, thick: 1.5,
      });
      prev = { dist: b.dist, x: b.x, y: b.y };
      return;
    }
    if (b.type === 'obstacle') {
      // One pillar set into the lane; the reward ring sits just past on the open
      // side, so a gentle steer OR a barrel roll clears it (i-frames forgive).
      out.obstacles.push({ type: 'pillar', dist: b.dist, x: b.x, r: b.r || 1.8, h: b.h || 11 });
      const ring = { dist: b.dist + 28, x: b.ringX ?? -Math.sign(b.x || 1) * 2, y: b.y };
      out.rings.push(ring);
      emberArc(prev, ring, out);
      prev = ring;
      return;
    }
    // Default: a ring (with an optional speed orb just before it).
    setPiecesBetween(prev.dist, b.dist, out.setPieces);
    out.rings.push({ dist: b.dist, x: b.x, y: b.y });
    emberArc(prev, b, out);
    if (b.orb) {
      out.orbs.push({ dist: b.dist - 14, x: clamp(b.x, -11, 11), y: clamp(b.y + 1.5, 4.5, 20) });
    }
    prev = { dist: b.dist, x: b.x, y: b.y };
  }

  function ensure(target) {
    const out = {
      rings: [], obstacles: [], orbs: [], setPieces: [], embers: [],
      goldEmbers: [], gauntletStarts: [], gauntletEnds: [],
      canyonSegments: [], canyonStarts: [], canyonEnds: [],
      // Dists of base Phase Gates that fall INSIDE a canyon run — main.js skips
      // spawning these so a blind crystal window never appears between rib sections.
      // A separate output array (never touches rings/obstacles) → fixture-safe.
      canyonGateSuppress: [],
    };
    while (prev.dist < target) {
      // Authored first-flight opening takes over placement until it's spent.
      if (scripted && scriptIdx < FIRST_FLIGHT_BEATS.length && prev.dist < FIRST_FLIGHT_END) {
        scriptedBeat(FIRST_FLIGHT_BEATS[scriptIdx++], out);
        continue;
      }
      // Gauntlet corridors take over waypoint placement while active: each
      // station's ring sits in the open quadrant, an ember line leads in,
      // and only ONE axis changes between stations so the slalom stays fair.
      if (!gauntlet && prev.dist > untilGauntlet && difficulty(prev.dist) > 0.3) {
        const stations = [];
        let qx = Math.sign(prev.x) || 1;
        let qyLow = prev.y < 11;
        const n = 3 + (rnd() < 0.4 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          stations.push({ qx, qyLow });
          if (rnd() < 0.5) qx *= -1;
          else qyLow = !qyLow;
        }
        gauntlet = { stations, i: 0 };
        untilGauntlet = prev.dist + 800 + rnd() * 500;
        out.gauntletStarts.push(prev.dist + 30);
      }
      if (gauntlet) {
        const st = gauntlet.stations[gauntlet.i++];
        const wp = gauntletStation(st, prev.dist + 70, out);
        out.rings.push({ dist: wp.dist, x: wp.x, y: wp.y });
        guideLine(prev, wp, out);
        maybeGold(prev, wp, out, false); // opportunities pass silently here
        const spBeforeG = out.setPieces.length;
        setPiecesBetween(prev.dist, wp.dist, out.setPieces);
        if (wp.y > 14) out.setPieces.length = spBeforeG; // keep a high gauntlet ring clear of arches
        auditHop(prev, wp, 'gauntlet');
        prevHopDirX = Math.sign(wp.x - prev.x) || prevHopDirX;
        prevHopDirY = Math.sign(wp.y - prev.y) || prevHopDirY;
        prev = wp;
        if (gauntlet.i >= gauntlet.stations.length) {
          gauntlet = null;
          out.gauntletEnds.push(prev.dist + 15);
        }
        continue;
      }

      const wp = nextWaypoint();
      const t = difficulty(wp.dist);
      const tc = Math.min(t, 1);

      // Gates: only after 420m (safely past the tutorial zone). The window is
      // a fixed, generous size — difficulty instead shoves it further off the
      // natural path, capped at ~92% of what the dragon can physically reach
      // in this hop even at full boost, so it always stays fair. The waypoint
      // itself moves to the window so the rest of the course flows from it.
      untilGate--;
      // No gates inside ring bursts: tight spacing + an off-path window
      // would stack two demands into one short hop.
      const isGate = wp.dist > 420 && t > 0 && untilGate <= 0 && rhythm.mode !== 'burst';
      if (isGate) {
        untilGate = tc > 0.7 ? 2 + Math.floor(rnd() * 2) : 3 + Math.floor(rnd() * 3);
        const hopTime = (wp.dist - prev.dist) / CONFIG.lineDesignSpeed;
        const reachX = CONFIG.lateralSpeed * CONFIG.boostSteeringBonus * hopTime * CONFIG.gateReachSafety;
        const reachY = CONFIG.verticalSpeed * CONFIG.boostSteeringBonus * hopTime * CONFIG.gateReachSafety;
        const push = Math.min(1, Math.min(t, 1.5) * (0.45 + rnd() * 0.45));
        const dirX = Math.sign(wp.x - prev.x) || (rnd() < 0.5 ? -1 : 1);
        const dirY = Math.sign(wp.y - prev.y) || (rnd() < 0.5 ? -1 : 1);
        wp.x = clamp(wp.x + dirX * Math.max(0, reachX - Math.abs(wp.x - prev.x)) * push, -10, 10);
        wp.y = clamp(wp.y + dirY * Math.max(0, reachY - Math.abs(wp.y - prev.y)) * push, 5.5, 19);
      }

      hopObstacles(prev, wp, out);

      // Orbs: first one guaranteed early (dist ~120)
      untilOrb--;
      if (untilOrb <= 0) {
        untilOrb = prev.dist < 300 ? 3 : 4 + Math.floor(rnd() * 3);
        const ang = rnd() * Math.PI * 2;
        out.orbs.push({
          dist: (prev.dist + wp.dist) / 2,
          x: clamp((prev.x + wp.x) / 2 + Math.cos(ang) * 2.5, -11, 11),
          y: clamp((prev.y + wp.y) / 2 + Math.sin(ang) * 2.5, 4.5, 20),
        });
      }

      // Set-piece events (biome gateways + mega-arches)
      const spBefore = out.setPieces.length;
      setPiecesBetween(prev.dist, wp.dist, out.setPieces);

      if (isGate) {
        out.obstacles.push({
          type: 'gate',
          dist: wp.dist,
          gapX: wp.x,
          gapY: wp.y,
          gapW: CONFIG.gateGapW,
          gapH: CONFIG.gateGapH,
          thick: 1.5,
        });
      } else {
        out.rings.push({ dist: wp.dist, x: wp.x, y: wp.y });
        emberArc(prev, wp, out);
        // A HIGH green ring must not hide behind a set-piece arch emitted just in
        // front of it this hop — the chase cam looks down the lane through the
        // arch's crown, making a clean pass hard. Drop the arch (purely scenic).
        if (wp.y > 14) out.setPieces.length = spBefore;
      }
      maybeGold(prev, wp, out, true);
      auditHop(prev, wp, isGate ? 'gate' : 'ring');
      prevHopDirX = Math.sign(wp.x - prev.x) || prevHopDirX;
      prevHopDirY = Math.sign(wp.y - prev.y) || prevHopDirY;
      prev = wp;
    }
    overlayCanyons(out);
    generatedUntil = prev.dist;
    return out;
  }

  // Sky Canyon overlay: a PURELY ADDITIVE post-pass. It frames a run of the
  // rings already generated this chunk with rock gates (separate output arrays,
  // separate RNG) — it never reads/writes rnd, rings, obstacles or golds, so the
  // base course for a seed is unchanged. Because each gate's aperture is centered
  // on a real reward ring, every gap sits on the already-reach-audited flight
  // line: catchable by construction, and the safe opening is on the line the
  // player is already flying. Gauntlet rings are skipped (a corridor is its own
  // beat) and no canyon starts in the tutorial zone.
  function overlayCanyons(out) {
    // A canyon never overlays a gauntlet corridor (two forced-line systems would
    // stack). Skip rings inside any gauntlet range emitted this chunk.
    const inGauntlet = (d) => {
      for (let i = 0; i < out.gauntletStarts.length; i++) {
        if (d >= out.gauntletStarts[i] && d <= (out.gauntletEnds[i] ?? Infinity)) return true;
      }
      return false;
    };
    const firstAt = CANYON_FORCE ? 320 : CONFIG.canyonFirstAt;
    let prevRing = null;
    for (const ring of out.rings) {
      if (ring.dist < firstAt || inGauntlet(ring.dist)) { prevRing = ring; continue; }
      if (!canyon && ring.dist >= nextCanyonAt) canyon = startCanyon(ring, out);
      if (canyon) {
        const seg = makeRockGap(ring, prevRing, canyon);
        out.canyonSegments.push(seg);
        canyon.gateTo = ring.dist;   // furthest rib so far → gate-suppression window end
        // A continuous LINE of boosts — one per finale segment — so you grab boost
        // after boost down the centre of the rib tube, then shoot out into open air.
        if (seg.kind === 'straightrib') addFinaleOrb(seg, out);
        canyon.idx++;
        if (--canyon.left <= 0) {
          out.canyonEnds.push(ring.dist + 40);
          suppressCanyonGates(out, canyon.gateFrom, ring.dist + 40);
          // Test harness: quick repeat with a stretch of normal rings between, so
          // each run shows before/after integration. Normal play: rare + jittered.
          nextCanyonAt = CANYON_FORCE
            ? ring.dist + 300
            : ring.dist + CONFIG.canyonIntervalBase + canyonRnd() * CONFIG.canyonIntervalJitter;
          canyon = null;
        }
      }
      prevRing = ring;
    }
    // A canyon still in progress at the chunk boundary: suppress the gates inside
    // the part of it generated so far (the rest get suppressed as later chunks run).
    if (canyon) suppressCanyonGates(out, canyon.gateFrom, canyon.gateTo);
  }

  // Mark base Phase Gates whose dist lands inside a canyon run, so main.js skips
  // spawning them (no blind crystal window between rib sections). Reads obstacles,
  // writes only the separate suppress list → base course stays byte-identical.
  function suppressCanyonGates(out, from, to) {
    for (const ob of out.obstacles) {
      if (ob.type === 'gate' && ob.dist >= from && ob.dist <= to) out.canyonGateSuppress.push(ob.dist);
    }
  }

  function startCanyon(ring, out) {
    // Test harness forces a run type; the ?canyon=all demo alternates rock/spine.
    let type = canyonRnd() < 0.5 ? 'rock' : 'spine';
    if (CANYON_FORCE === 'rock' || CANYON_FORCE === 'split' || CANYON_FORCE === 'overunder') type = 'rock';
    else if (CANYON_FORCE === 'spine') type = 'spine';
    else if (CANYON_FORCE === 'all') type = forceAllToggle ? 'spine' : 'rock';
    forceAllToggle = !forceAllToggle;
    const [lo, hi] = type === 'spine' ? CONFIG.spineSegments : CONFIG.canyonSegments;
    const left = CANYON_FORCE ? hi : lo + Math.floor(canyonRnd() * (hi - lo + 1));
    out.canyonStarts.push(ring.dist - 40);
    // The ribcage tunnel sweeps laterally to fake the body's curve; pick the side
    // it starts on per run. gateFrom = start of the gate-suppression window, aligned
    // with the canyon start marker (ring.dist - 40) so it covers the skull mouth.
    return { type, left, idx: 0, total: left, swaySign: canyonRnd() < 0.5 ? -1 : 1,
             gateFrom: ring.dist - 40, gateTo: ring.dist };
  }

  // Pick the geometry "kind" for this segment from the run type + its position in
  // the run, so each run reads as a deliberate sequence rather than random rocks.
  function pickKind(ring, prevRing, c) {
    if (c.type === 'rock') {
      // Rock Run: alternate tall split slabs with over-under shelves. Bias toward
      // a shelf when the path is making a big vertical move (sells the up/down).
      const dy = prevRing ? ring.y - prevRing.y : 0;
      // Mostly tower-slots (the sea-stack read); an over-under squeeze only when
      // the line really climbs or dives.
      const wantShelf = Math.abs(dy) > 3.2;
      if (CANYON_FORCE === 'split') return 'split';
      if (CANYON_FORCE === 'overunder') return 'overunder';
      return wantShelf ? 'overunder' : 'split';
    }
    // Dragon Spine Canyon: skull (a head you fly into) → throat → a long run of
    // gently swaying ribs (the heart of it) → a STRAIGHT rib tunnel finale you boost
    // flat-out through into open air.
    const i = c.idx;
    if (i === 0) return 'skull';
    if (i === 1) return 'throat';
    if (i >= c.total - CONFIG.spineFinaleSegs) return 'straightrib';  // the boost-out finale
    return 'rib';                                                     // the swaying rib run (bulk)
  }

  // The finale strings a few SPEED BOOSTS through the straight tunnel — no
  // navigation, pure "show speed": grab a boost and blast straight out into open
  // air. Orbs ride a fixed deterministic line off the segment's ring; they're not
  // part of the gold-determinism fixture and we never touch the main rnd / rings /
  // obstacles, so the base course stays byte-identical.
  function addFinaleOrb(seg, out) {
    out.orbs.push({
      dist: seg.dist - 8,
      x: clamp(seg.gapX, -11, 11),        // ON the ring line, dead-centre inside the ribs
      y: clamp(seg.gapY, 4.5, 20),
    });
  }

  // One canyon gate's data: a safe aperture centered on the ring, plus the kind
  // obstacles.js uses to build the framing geometry + collider boxes. The gap
  // sits clearly below the canyon ceiling so the height limit is always fair.
  function makeRockGap(ring, prevRing, c) {
    const kind = pickKind(ring, prevRing, c);
    const seg = {
      type: 'rockGap', run: c.type, kind, dist: ring.dist,
      gapX: clamp(ring.x, -9, 9),
      gapY: clamp(ring.y, CONFIG.canyonGapYLo, CONFIG.canyonGapYHi),
      gapW: CONFIG.canyonGapW, gapH: CONFIG.canyonGapH, thick: CONFIG.canyonThick,
      seed: (canyonRnd() * 1e6) | 0,
      runIdx: c.idx, runTotal: c.total, swaySign: c.swaySign,
      // Distance back to the previous ring — obstacles.js sizes each ribcage to
      // this so the bone tunnel tiles edge-to-edge on EVERY ring rhythm (burst /
      // flow / breath) instead of leaving sparse gaps on the long-spacing beats.
      span: prevRing ? ring.dist - prevRing.dist : 80,
    };
    // Over-under alternates ceiling/floor so it reads as "down, then up".
    if (kind === 'overunder') seg.shelf = c.idx % 2 === 0 ? 'ceiling' : 'floor';
    // Ribs alternate the heavier bone side to fake the curl of a long torso.
    if (kind === 'rib') seg.side = c.idx % 2 === 0 ? 1 : -1;
    return seg;
  }

  return {
    ensure,
    difficulty,
    get generatedUntil() { return generatedUntil; },
  };
}
