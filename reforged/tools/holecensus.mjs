// HOLE CENSUS — enclosed daylight INSIDE the creature's own outline, through the flap cycle.
//
// WHY THIS EXISTS. `flapclearance` measures wing-vs-TORSO and reported the Fornax wing clean. The
// art director then measured pixels and found the actual defect was wing-vs-ITSELF: enclosed slots
// of pure backdrop between the spar, the battens and the membrane, well outboard of the flank,
// 285/256/156 px at gameplay scale on the bank pose. The probe was structurally blind to it —
// wrong pair of surfaces — which is the third time on this creature a probe has measured the wrong
// thing. This is the gate that closes that class.
//
// ── THE DISCRIMINATOR, AND THE ONE THAT FAILED ──────────────────────────────────────────────────
// "Enclosed hole" alone is not a defect: Tempest, the premium bar, has them too — the critic's
// distinction was that Tempest's are deliberate WINDOWS and Fornax's are slivers beside straps.
//
// First attempt encoded that as the hole's NARROW dimension over sqrt(planform): architecture wide
// in both axes, a tear a crack. IT DID NOT SEPARATE THE ROSTER. Measured at chase scale, Tempest's
// holes run narrow 0.125–0.237 and Fornax's 0.121–0.241 — the same band. Kept here as an
// informational column and recorded as a dead end, because a discriminator that fires on nothing
// is worth exactly as much as one that fires on everything, and the next person needs to know this
// was tried.
//
// What DOES separate them is plain hole FRACTION — enclosed daylight as a share of the planform —
// judged per pose, with the band set at what the premium bar achieves. See §BANDS.
//
// ⚠ AND IT MUST BE MEASURED AT THE SHIPPED PIXEL SIZE. The critic's finding came from studio crops
// at 4–6× zoom, where the dragon spans ~700px; the chase cam gives it ~8600px of planform TOTAL.
// This renders through silhouetteCore's `rear` view, which IS the real chase camera, so the numbers
// below are the ones the player's screen produces. A defect measured at 6× and asserted at 1× is
// the legibility error this repo already banked a lesson about (2026-07-28-tail-legibility-laws).
//
// Measured on the FULL silhouette, not the wing in isolation: if the body fills in behind a gap the
// player sees no daylight, and a wings-only buffer would invent holes that do not ship.
//
//   node tools/holecensus.mjs [key] [tier]
import { renderSilhouette, holeMetric, WING_DEBUG_STATES, DRAGONS, maxTierFor } from './silhouetteCore.mjs';

// ⚠ Parse FLAGS out before positional args. Reading argv[3] blindly turned `--all` into
// Number('--all') = NaN for the tier, and a NaN tier renders an empty buffer — a census with no
// subject that still printed a clean PASS. Positional-after-flag is a classic way to make a gate
// pass vacuously.
const argv = process.argv.slice(2);
const FLAGS = new Set(argv.filter((a) => a.startsWith('--')));
const pos = argv.filter((a) => !a.startsWith('--'));
const key = pos[0] || 'fornax';
const tier = pos[1] != null ? Number(pos[1]) : maxTierFor(key);

// The five cycle points (fold/bank are posture pins, not beats — the cycle is what moves).
const PHASES = WING_DEBUG_STATES.filter((s) => !['fold', 'bank'].includes(s));
// Three camera poses. `rear` is the shipped chase cam — the verdict that ships. `threeq` is the
// rear-¾ above, i.e. the chase cam in a hard bank, which is where the critic found the worst of it.
// `side` is the elevation, where a crack between two members is widest and easiest to attribute.
// ⚠ `top` earns its place the hard way. The ARMPIT — enclosed sky between the batten arc and the
// root sheet — is only visible looking straight down, so with rear/threeq/side alone this census
// reported the wing clean while a hole 2× the premium bar's sat in the held glide pose. A fix was
// then written, committed, and claimed against a panel nobody re-measured; the verification render
// came back BYTE-IDENTICAL. Measure the view the defect lives in, or the gate certifies the fix.
const VIEWS = ['rear', 'threeq', 'side', 'top'];
const W = 900, H = 640;

// Bands — see §BANDS at the foot of this file for the roster numbers behind them.
const NARROW = 0.022;    // informational only — see the dead end noted above
const MIN_PX = 12;       // ignore rasteriser pinholes; a sub-12px speck is not visible daylight
const MEAN_FRAC = 0.040; // mean enclosed daylight across 5 phases × 3 views, as a share of planform
const WORST_FRAC = 0.090;// ...and the worst single pose. Both set at the premium bar. See §BANDS.
// ⚠ AND A FLOOR, because this gate was ONE-SIDED and that is how it drove a wing flat.
// A ceiling alone says "less daylight is always better", and the limit of that instruction is a
// solid sheet — the plane/delta, this repo's kill-on-sight failure. The gate paid for it: a notch
// was widened specifically to lower this number (it converted enclosed daylight to OPEN daylight,
// which is uncounted), scored as an improvement, and produced the exact gap the owner then circled.
// A fingered membrane MUST show daylight between its fingers. Roster at chase scale:
//   tempest 3.33%   revenant 2.96%   vesper 0.31%   fornax-after-round-7 ~0%
// Floor 1.5% passes the two dragons whose wings read as fingered and fails the two that read flat.
const MIN_FRAC = 0.015;

let fail = 0, pass = 0;
const check = (ok, label, detail) => {
  if (ok) { pass++; console.log(`  ✓ ${label}   ${detail ?? ''}`); }
  else { fail++; console.log(`  ✗ ${label}   ${detail ?? ''}`); }
};

console.log(`\nHole census — ${key} (tier ${tier})\n${'-'.repeat(78)}`);
console.log('  enclosed daylight inside the outline, 5 flap phases × 3 camera poses\n');

const tears = [], all = [], agg = [];
let worstWindow = null;
for (const view of VIEWS) {
  const row = [];
  for (const pose of PHASES) {
    const { buf } = renderSilhouette({ key, view, tier, W, H, pose });
    const m = holeMetric(buf, W, H, { minHoleArea: MIN_PX });
    const scale = Math.sqrt(m.planform) || 1;
    let nTear = 0, worstTear = null;
    for (const h of m.holes) {
      const narrow = Math.min(h.w, h.h) / scale;
      const rec = { view, pose, ...h, narrow };
      if (FLAGS.has('--all')) all.push(rec);
      if (narrow < NARROW) {
        nTear++; tears.push(rec);
        if (!worstTear || h.area > worstTear.area) worstTear = rec;
      } else if (!worstWindow || h.area > worstWindow.area) worstWindow = rec;
    }
    row.push({ pose, holes: m.holeCount, tears: nTear, worstTear });
    agg.push({ view, pose, frac: m.holePixels / (m.planform || 1), planform: m.planform, n: m.holeCount });
  }
  const cells = row.map((r) => `${r.pose.slice(0, 4)} ${String(r.tears).padStart(2)}/${String(r.holes).padStart(2)}`).join('   ');
  console.log(`  ${view.padEnd(7)} ${cells}`);
}

console.log('\n  (tears / total enclosed holes per pose; a "tear" is narrower than'
  + ` ${NARROW} × sqrt(planform))`);
if (tears.length) {
  console.log('\n  worst tears:');
  for (const t of tears.sort((a, b) => b.area - a.area).slice(0, 6)) {
    console.log(`    ${String(t.area).padStart(5)} px  ${String(t.w).padStart(3)}×${String(t.h).padEnd(3)}  narrow ${t.narrow.toFixed(4)}   ${t.view}/${t.pose}`);
  }
}
if (FLAGS.has('--all')) {
  console.log('\n  ALL holes, widest-narrow-dim first:');
  for (const h of all.sort((a,b)=>b.narrow-a.narrow)) console.log(`    ${String(h.area).padStart(5)} px  ${String(h.w).padStart(3)}x${String(h.h).padEnd(3)} narrow ${h.narrow.toFixed(4)}  ${h.view}/${h.pose}`);
}
if (worstWindow) {
  console.log(`\n  largest legitimate window (kept): ${worstWindow.area} px  ${worstWindow.w}×${worstWindow.h}`
    + `  narrow ${worstWindow.narrow.toFixed(4)}   ${worstWindow.view}/${worstWindow.pose}`);
}

const totFrac = agg.reduce((a, r) => a + r.frac, 0) / (agg.length || 1);
const worstFrac = agg.reduce((a, r) => (r.frac > a.frac ? r : a), agg[0] || { frac: 0 });
console.log(`\n  planform ${Math.round(agg.reduce((a,r)=>a+r.planform,0)/(agg.length||1))} px at chase scale · mean hole fraction ${(totFrac*100).toFixed(2)}%`
  + ` · worst ${(worstFrac.frac*100).toFixed(2)}% at ${worstFrac.view}/${worstFrac.pose}`);
console.log('');
check(totFrac <= MEAN_FRAC, `H1  mean enclosed daylight over the cycle  [≤${(MEAN_FRAC * 100).toFixed(1)}% of planform]`,
  `${(totFrac * 100).toFixed(2)}% across 5 phases × 3 views`);
check(worstFrac.frac <= WORST_FRAC, `H2  worst single pose  [≤${(WORST_FRAC * 100).toFixed(1)}%]`,
  `${(worstFrac.frac * 100).toFixed(2)}% at ${worstFrac.view}/${worstFrac.pose}`);
check(totFrac >= MIN_FRAC, `H3  the wing shows daylight BETWEEN its fingers  [≥${(MIN_FRAC * 100).toFixed(1)}%]`,
  `${(totFrac * 100).toFixed(2)}%` + (totFrac < MIN_FRAC ? ' — a membrane with no daylight is a PLANE (§2 failure #1)' : ''));

console.log('-'.repeat(78));
console.log(fail === 0 ? `PASS — ${pass} target met` : `FAIL — ${fail} of ${pass + fail} targets missed`);
process.exit(fail === 0 ? 0 : 1);

// ── §BANDS — calibrated on the shipped roster BEFORE being pointed at the subject ────────────────
// Measured 2026-07-28 at chase-cam scale, 5 phases × 3 views:
//
//              planform   mean hole frac   worst pose
//   tempest      12625        3.65%          8.70%  rear/apex   ← the premium bar
//   revenant     10912        2.93%          6.69%  threeq/glide
//   azure        11715        0.08%          0.36%  threeq/recovery
//   fornax        8599        2.42%          9.44%  rear/apex   ← subject
//
// Bands sit just above what the bar achieves: mean 4.0%, worst 9.0%. Note what this says and does
// not say. Fornax's MEAN daylight is BELOW Tempest's and revenant's — at the size the player sees,
// its wing is not more perforated than the roster. Only the apex pose exceeds the bar, and only
// just. The critic's B1 ("daylight slits inside the wing's own perimeter") is therefore real but
// SCOPED: it is an apex-pose finding at gameplay scale, not the whole-cycle tear it reads as from
// a 6× crop. Do not widen these bands; do fix apex.
