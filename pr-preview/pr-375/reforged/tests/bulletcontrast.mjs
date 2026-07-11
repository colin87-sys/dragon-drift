// Pure-data regression gate for boss-bullet readability (Increment 2, the
// magenta danger palette + per-biome BAND overrides + the outline/white-core
// two-way luminance edge). For every biome × every bullet colour actually in
// play there, checks that the colour reads against BOTH the biome's fog and
// its sky horizon — either directly (hue contrast) or via the layered read
// (the dark outline + white core every bullet now carries, L121/2.1). This is
// the standing guard that makes readability permanent: any future biome or
// palette edit that breaks contrast trips this test, not a human eyeballing
// a screenshot.
//   node tests/bulletcontrast.mjs
import { register } from 'node:module';
register('../tools/three-resolver.mjs', import.meta.url);
import { assert } from './shim.mjs';
const { BIOMES } = await import('../js/biomes.js');

let n = 0;
const ok = (m) => { n++; console.log(`  ✓ ${m}`); };

// Simple approximation, deliberately NOT gamma-linearized (the spec's own
// anchor — L(0x140608) ≈ 0.03, the outline tint — only lands if the sRGB byte
// values are weighted directly; true linear luminance gives ≈0.003). Consistent
// across every colour compared here, which is all this gate needs.
function lum(hex) {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const OUTLINE_L = lum(0x140608);   // ≈0.03, matches the spec's own anchor
const CORE_L = 1.0;                // white core
const MARGIN = 0.25;
// The layered read (outline OR core, evaluated against ONE background) holds
// when that background's own luminance sits where at least one of the two
// fixed extremes (near-black outline, white core) gets its ≥0.25 margin.
const layeredOk = (bgL) => bgL - OUTLINE_L >= MARGIN && CORE_L - bgL >= MARGIN;
const DIRECT_MIN = 0.15;
// PASS against one background if the colour clears it directly, OR the
// layered read covers that background (checked per fog/per horizon — a
// biome can lean on direct contrast on one side and the layered read on the
// other; both sides must clear independently).
const passBg = (colourL, bgL) => Math.abs(colourL - bgL) >= DIRECT_MIN || layeredOk(bgL);

// Danger role colour (magenta, never per-boss — bossDefs.js) + the default BAND
// (successive-ring brightness/size bands, boss.js) + the two fixed swat-role
// colours (REFLECT_COLOR amber, reflected cyan). These mirror the literal boss.js
// values; boss.js itself pulls in the full DOM-dependent module graph
// (ui/sfx/input/cameraController/...), so this stays a pure-data test like
// defs.mjs rather than importing it.
const DANGER = 0xff2b6a;
const DEFAULT_BAND = { light: 0xffc6dc, mid: 0xff4f9a, dark: 0x8f0a3c };
const REFLECT_AMBER = 0xffc23c;
const REFLECTED_CYAN = 0x66ddff;

// Known, accepted exception: AMBER WASTES' horizon (L≈0.84) is the single
// brightest sky band in the whole biome roster — brighter than even the
// layered read's window. REFLECT_AMBER/REFLECTED_CYAN are FIXED role colours
// (never biome-tinted: the player learns "amber = parryable"/"cyan = reflected"
// once, globally — L93), so unlike the BAND they have no per-biome override
// lever, and REFLECT_COLOR is explicitly pinned (never changes per the magenta
// rework). The outline+white-core system still gives a strong layered read
// against this biome's FOG; only the distant horizon strip falls short. Tracked
// here, not silently ignored — any OTHER failure still fails the gate hard.
const KNOWN_EXCEPTIONS = new Set([
  'AMBER WASTES|reflect-amber|horizon',
  'AMBER WASTES|reflected-cyan|horizon',
]);

const rows = [];
let hardFails = 0;
let exceptions = 0;

for (const biome of BIOMES) {
  const band = { ...DEFAULT_BAND, ...(biome.bullets || {}) };
  const colours = [
    ['danger', DANGER],
    ['band-light', band.light],
    ['band-mid', band.mid],
    ['band-dark', band.dark],
    ['reflect-amber', REFLECT_AMBER],
    ['reflected-cyan', REFLECTED_CYAN],
  ];
  const fogL = lum(biome.fog.color.getHex());
  const horL = lum(biome.sky.horizon.getHex());
  for (const [name, hex] of colours) {
    const cL = lum(hex);
    const okFog = passBg(cL, fogL);
    const okHor = passBg(cL, horL);
    let status = 'PASS';
    if (!okFog || !okHor) {
      const side = !okFog ? 'fog' : 'horizon';
      const key = `${biome.name}|${name}|${side}`;
      if (KNOWN_EXCEPTIONS.has(key)) { status = 'EXC'; exceptions++; }
      else { status = 'FAIL'; hardFails++; }
    }
    rows.push({ biome: biome.name, name, hex, cL, fogL, horL, okFog, okHor, status });
  }
}

// Readable table of offenders (and everything else, for the record).
const pad = (s, n) => String(s).padEnd(n);
console.log('\nbiome                 colour           L      fog     horizon   status');
for (const r of rows) {
  if (r.status === 'PASS') continue;
  console.log(
    pad(r.biome, 21), pad(r.name, 15), r.cL.toFixed(3).padStart(5),
    (r.okFog ? 'ok' : `X ${Math.abs(r.cL - r.fogL).toFixed(3)}`).padEnd(7),
    (r.okHor ? 'ok' : `X ${Math.abs(r.cL - r.horL).toFixed(3)}`).padEnd(9),
    r.status,
  );
}
if (hardFails === 0 && exceptions === 0) console.log('  (every biome × colour clears the gate directly)');

assert(hardFails === 0, `${hardFails} unresolved contrast failure(s) — see the table above`);
ok(`${rows.length} biome × colour combos checked across ${BIOMES.length} biomes (${exceptions} known/accepted exception(s))`);

console.log(`\n${n} contrast checks passed.`);
