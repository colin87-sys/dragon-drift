import { CONFIG } from './config.js';
import { mulberry32, clamp } from './util.js';

const lerp = (a, b, k) => a + (b - a) * k;
const REACH_AUDIT = new URLSearchParams(window.location.search).get('debug') === 'reach';

// Set-pieces are computed from the biome grid: a gateway arch at every biome
// boundary (k * biomeLength) and a mega-arch at each biome midpoint.
// main.js watches the emitted events and builds the geometry (setpieces.js).
function setPiecesBetween(a, b, out) {
  const L = CONFIG.biomeLength;
  const HALF = L / 2;
  // Boundary gateways
  for (let k = Math.floor(a / L) + 1; k * L <= b; k++) {
    out.push({ type: 'biomeGate', dist: k * L, biomeIndex: k % 3 });
  }
  // Midpoint mega-arches (skip the very first half-point: tutorial zone)
  for (let k = Math.floor((a - HALF) / L) + 1; k * L + HALF <= b; k++) {
    if (k * L + HALF < 600) continue;
    out.push({ type: 'megaArch', dist: k * L + HALF, biomeIndex: k % 3 });
  }
}

export function createLevelGen(seed = CONFIG.seed) {
  const rnd = mulberry32(seed);
  let prev = { dist: 0, x: 0, y: 8 };
  let swingX = 1;
  let swingY = 1;
  let untilGate = 3;
  let untilOrb = 2; // first orb comes faster
  let generatedUntil = 0;
  let prevHopDirX = 0;
  let prevHopDirY = 0;

  const difficulty = (d) => {
    // First 300m: forced easy approach (tutorial)
    if (d < 300) return 0;
    const t = (d - 300) / CONFIG.difficultyRamp;
    return t <= 1 ? t : 1 + (t - 1) * 0.25;
  };

  function nextWaypoint() {
    const t = difficulty(prev.dist);
    const tc = Math.min(t, 1);
    // First few hops are shorter so the player gets rewards quickly
    const baseClose = prev.dist < 200 ? 42 : 78;
    const idealSpacing = CONFIG.lineDesignSpeed * CONFIG.idealRewardHopTime;
    const minLateSpacing = CONFIG.lineDesignSpeed * CONFIG.minRewardHopTime;
    let spacing = lerp(baseClose, idealSpacing, tc) * (0.88 + rnd() * 0.24);
    if (prev.dist > 1600) spacing = Math.max(spacing, minLateSpacing);
    const dist = prev.dist + spacing;
    const hopTime = spacing / CONFIG.lineDesignSpeed;
    const safety = Math.min(lerp(0.45, CONFIG.lateGameReachSafety, t), CONFIG.lateGameReachSafety); // gentler early
    const maxDx = CONFIG.lateralSpeed * hopTime * safety;
    const maxDy = CONFIG.verticalSpeed * hopTime * safety;

    if (rnd() < 0.8) swingX *= -1;
    if (rnd() < 0.6) swingY *= -1;

    // First waypoint stays near centre so first ring is easy
    const swingFraction = prev.dist < 80 ? 0.2 : (0.45 + rnd() * 0.55);
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

  function ensure(target) {
    const out = { rings: [], obstacles: [], orbs: [], setPieces: [], embers: [] };
    while (prev.dist < target) {
      const wp = nextWaypoint();
      const t = difficulty(wp.dist);
      const tc = Math.min(t, 1);

      // Gates: only after 420m (safely past the tutorial zone). The window is
      // a fixed, generous size — difficulty instead shoves it further off the
      // natural path, capped at ~92% of what the dragon can physically reach
      // in this hop even at full boost, so it always stays fair. The waypoint
      // itself moves to the window so the rest of the course flows from it.
      untilGate--;
      const isGate = wp.dist > 420 && t > 0 && untilGate <= 0;
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
      }
      auditHop(prev, wp, isGate ? 'gate' : 'ring');
      prevHopDirX = Math.sign(wp.x - prev.x) || prevHopDirX;
      prevHopDirY = Math.sign(wp.y - prev.y) || prevHopDirY;
      prev = wp;
    }
    generatedUntil = prev.dist;
    return out;
  }

  return {
    ensure,
    difficulty,
    get generatedUntil() { return generatedUntil; },
  };
}
