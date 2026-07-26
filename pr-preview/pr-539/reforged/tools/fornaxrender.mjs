// FORNAX render-space value probe — measures the PIXELS, not the materials.
//
// This exists because of a real miss. The art director's target read "endpoint spread >=0.05
// luminance MEASURED ON THE BRIGHTEST-BIOME CAPTURE", and the structural probe implemented it in
// MATERIAL space instead — comparing albedo hexes in the def, where it passed comfortably at
// 0.133 while the creature actually rendered between 5 and 30 out of 255 against a 213 sky. Four
// "distinct" tiers collapsed into mud and every gate stayed green.
//
// Material spread is not rendered spread. A value ladder is a claim about what the camera sees,
// so it has to be measured where the camera sees it.
//
//   node reforged/tools/fornaxrender.mjs <capture.png> [moreCaptures...]
import { readFileSync } from 'node:fs';

// Minimal PNG reader would be a dependency; instead shell out to the python3 that ships here.
import { execFileSync } from 'node:child_process';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node tools/fornaxrender.mjs <capture.png> [...]');
  process.exit(2);
}

// ⚠ MEASURE THE TORSO, NOT THE FRAME. Measuring every dark pixel put the giant I2 wing-plank
// stubs and the I0 box head into the sample and reported a median of 14 when the torso's own
// median was 21.6 — a later increment's placeholder grading an earlier increment's surface. This
// is the THIRD time this build measured the wrong thing (vertex count instead of area, material
// space instead of render space, whole frame instead of the part under test). The pattern is the
// lesson: always state which PART a number describes before trusting it.
//
// The torso is isolated geometrically — it is the region with the tallest columns of creature
// pixels; wing planks are wide but vertically thin, so a column-height threshold separates them
// without needing per-pixel part tags in an already-flattened PNG.
const PY = `
import sys
from PIL import Image
for path in sys.argv[1:]:
    im = Image.open(path).convert('RGB')
    W, H = im.size
    lum = lambda p: 0.2126*p[0] + 0.7152*p[1] + 0.0722*p[2]
    L = [[lum(im.getpixel((x, y))) for y in range(H)] for x in range(W)]
    flat = sorted(v for col in L for v in col)
    bg = flat[int(len(flat)*0.75)]
    thr = bg - 40
    cols = [sum(1 for v in col if v < thr) for col in L]
    peak = max(cols) if cols else 0
    if peak == 0:
        print(f"{path}\\tNO CREATURE PIXELS FOUND (bg~{bg:.0f})")
        continue
    xs = [x for x, c in enumerate(cols) if c > peak*0.55]
    x0, x1 = min(xs), max(xs)+1
    body = sorted(v for x in range(x0, x1) for v in L[x] if v < thr)
    p = lambda q: body[int(len(body)*q)]
    print(f"{path}\\tbg {bg:.0f}\\tTORSO n={len(body)} (x {x0}-{x1})\\tp10 {p(.10):.1f}\\tp50 {p(.50):.1f}\\tp90 {p(.90):.1f}\\tspread {p(.90)-p(.10):.1f}\\tmax {body[-1]:.1f}")
`;

const out = execFileSync('python3', ['-c', PY, ...files], { encoding: 'utf8' });
console.log('\nFornax RENDER-space value probe (0-255 luminance)\n' + '-'.repeat(78));
console.log(out.trimEnd());
console.log('-'.repeat(78));

// The bar. These are render-space, deliberately: a creature the camera cannot resolve has failed
// regardless of what its albedo table says.
//   p50  >= 28  — the body must sit clear of the crush floor on a BRIGHT backdrop
//   spread >= 45 — the tiers must actually separate once lit (round 1 shipped 25)
let fail = 0;
for (const line of out.trim().split('\n')) {
  const m = line.match(/p50 ([\d.]+)\s+p90 ([\d.]+)\s+spread ([\d.]+)/);
  if (!m) continue;
  const p50 = parseFloat(m[1]), spread = parseFloat(m[3]);
  const okMid = p50 >= 28, okSpread = spread >= 45;
  if (!okMid || !okSpread) fail++;
  console.log(`  ${okMid ? '✓' : '✗'} median ${p50.toFixed(1)} (>=28)   ${okSpread ? '✓' : '✗'} tier spread ${spread.toFixed(1)} (>=45)   ${line.split('\t')[0].split('/').pop()}`);
}
console.log(fail === 0 ? '\nPASS — the ladder survives being lit\n' : `\nFAIL — ${fail} capture(s) crush to mud\n`);
process.exit(fail === 0 ? 0 : 1);
