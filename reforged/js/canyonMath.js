// Pure canyon-corridor math — NO THREE, imports only CONFIG. Both the geometry
// builder (obstacles.js) and the headless flow audit (tests/canyonflow.mjs) consume
// this SAME module, so the "safe tube" the test verifies is byte-for-byte the tube
// the game builds — no re-derivation, no drift.
//
// Coordinate convention (matches obstacles.js ribcage/stackRun): a segment's local
// z is 0 at its reward-ring plane; z < 0 is the ENTRY half (toward the previous
// ring / prevX,prevY), z > 0 is the EXIT half (toward the next ring / nextX,nextY).
import { CONFIG } from './config.js';

// Smoothstep. S(0)=0, S(1)=1, S'(0)=S'(1)=0 (no elbow at the seam or the ring
// plane), peak slope S'(0.5)=1.5 (used in the fairness budget below).
export const ease = (u) => u * u * (3 - 2 * u);

// Worst realistic approach speed anywhere in a canyon: a speed orb (orbs spawn
// inside rock runs too — level.js) at the max speed ramp. The base course audit
// (level.js auditHop) already holds itself to steering-with-boost-bonus at this
// speed, so the canyon overlay is held to the same standard.
export const CANYON_V = CONFIG.orbSpeed * CONFIG.speedRampMax;                 // 108
// Max fair centre-slope per axis = 0.85 × (available steering velocity) / V. The
// eased tube's peak slope must stay under these (verified ~0.19/0.85 of budget).
export const BUDGET_X = 0.85 * CONFIG.lateralSpeed * CONFIG.boostSteeringBonus / CANYON_V;
export const BUDGET_Y = 0.85 * CONFIG.verticalSpeed * CONFIG.boostSteeringBonus / CANYON_V;

// Section half-depths: backward from `span` (dist to the previous ring), forward
// from `spanFwd` (dist to the next segment). Sizing the FORWARD half by the forward
// span is load-bearing — a burst→breath seam (span 55 → spanFwd ~150) would blow the
// slope budget if the exit half were sized by the backward span. Clamped 36..80,
// which also tames spanFwd's 300–450m gauntlet-bridge outliers (the PR-0 clamp).
export function halves(seg, mult = 1) {
  const cl = (s) => Math.max(36, Math.min(80, s * 0.6)) * mult;
  return { bk: cl(seg.span || 80), fw: cl(seg.spanFwd ?? (seg.span || 80)) };
}

// Wall/slice emission band: abuts the neighbour's band at the inter-ring midpoint
// plane (span*0.5 / spanFwd*0.5), so adjacent sections' colliders TILE instead of
// overlapping on offset curves (which narrowed the corridor exactly at the joint).
export function band(seg, bk, fw) {
  return {
    wb: Math.min(bk, (seg.span || 80) * 0.5),
    wf: Math.min(fw, (seg.spanFwd ?? 2 * fw) * 0.5),
  };
}

// Blend between linear (elbow, peak slope = 1× the average) and smoothstep (no
// elbow, peak slope = 1.5×). `a`=1 is full smoothstep, `a`=0 is linear.
const blend = (u, a) => (1 - a) * u + a * ease(u);

// ADAPTIVE easing: use full smoothstep where there is slope headroom (the common
// gentle case — nice rounded flow, flat at the ring), and degrade toward linear
// only where the ring line itself is near its reachability limit — so the C1
// smoothing can NEVER push a demanding-but-fair ring line over the steering budget.
// peak slope of blend over a half of displacement d and length L = (1+0.5a)·|d|/L;
// solve (1+0.5a)·|d|/L ≤ budget for the largest a in [0,1].
function alphaFor(d, L, budget) {
  const ad = Math.abs(d);
  if (ad < 1e-9 || L < 1e-9) return 1;
  return Math.max(0, Math.min(1, 2 * (budget * L / ad - 1)));
}

// Corridor-centre curve. Returns xAt(z)/yAt(z). At z=0 the value is exactly
// (gapX,gapY) — the reward ring stays dead-centre; at the seams the value is the
// midpoint with the neighbour — so adjacent sections join continuously (C1 where
// the easing stays full smoothstep, C0 where it linearises for fairness). `u` is
// clamped to [0,1] so an out-of-range sample can never blow up.
export function centre(seg, bk, fw) {
  const px = seg.prevX !== undefined ? seg.prevX : seg.gapX;
  const nx = seg.nextX !== undefined ? seg.nextX : seg.gapX;
  const py = seg.prevY !== undefined ? seg.prevY : seg.gapY;
  const ny = seg.nextY !== undefined ? seg.nextY : seg.gapY;
  const half = (z, g, p, n, budget) => {
    if (z <= 0) {
      const e0 = (p + g) / 2, d = g - e0, u = Math.max(0, Math.min(1, 1 + z / bk));
      return e0 + blend(u, alphaFor(d, bk, budget)) * d;
    }
    const e1 = (g + n) / 2, d = e1 - g, u = Math.max(0, Math.min(1, z / fw));
    return g + blend(u, alphaFor(d, fw, budget)) * d;
  };
  return {
    xAt: (z) => half(z, seg.gapX, px, nx, BUDGET_X),
    yAt: (z) => half(z, seg.gapY, py, ny, BUDGET_Y),
  };
}
