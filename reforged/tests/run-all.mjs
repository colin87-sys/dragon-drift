// Runs every test script sequentially; exits non-zero on the first failure.
// `_`-prefixed scripts are DIAGNOSTICS (reference probes, not CI gates — the same
// convention tools/ uses) and are skipped: _diag-rock-caps.mjs models rock 'split'
// sections, which shipped config disables (canyonTypeWeights rock:0), so as a gate
// it fails vacuously and blocks the whole suite.
//   node tests/run-all.mjs
import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const dir = dirname(fileURLToPath(import.meta.url));
const skip = new Set(['run-all.mjs', 'serve.mjs', 'shim.mjs', 'browser.mjs']);
const scripts = readdirSync(dir).filter((f) => f.endsWith('.mjs') && !skip.has(f) && !f.startsWith('_')).sort();

for (const script of scripts) {
  console.log(`\n=== ${script} ===`);
  const r = spawnSync(process.execPath, [join(dir, script)], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\nFAILED: ${script}`);
    process.exit(1);
  }
}
console.log(`\nAll ${scripts.length} test scripts passed.`);
