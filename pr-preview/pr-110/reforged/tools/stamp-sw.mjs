// Stamp reforged/sw.js with a content hash + the precache asset list.
// Run before deploying when reforged assets change:  node tools/stamp-sw.mjs
// (from the reforged/ directory). Auto-versions the SW cache so returning
// visitors converge on one consistent build and never mix old/new files.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(import.meta.url), '..', '..'); // reforged/
const include = [];

// Asset set the game needs to boot + run offline.
function walk(dir, filter) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, filter);
    else if (filter(p)) include.push(p);
  }
}
include.push(join(root, 'index.html'), join(root, 'manifest.json'));
walk(join(root, 'css'), (p) => p.endsWith('.css'));
walk(join(root, 'js'), (p) => p.endsWith('.js'));
walk(join(root, 'lib'), (p) => /\.(js|woff2|ttf)$/.test(p));

// Deterministic order + hash of every byte -> version.
const assets = include
  .map((p) => relative(root, p).split('\\').join('/'))
  .sort();
const hash = createHash('sha256');
for (const rel of assets) hash.update(rel + '\0' + readFileSync(join(root, rel)));
const version = hash.digest('hex').slice(0, 12);

// './' first so navigations resolve to index.html.
const urls = ['./', ...assets.map((a) => './' + a)];

const list = urls.map((u) => `  '${u}',`).join('\n');
let sw = readFileSync(join(root, 'sw.js'), 'utf8');
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`);
sw = sw.replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = [\n${list}\n];`);
writeFileSync(join(root, 'sw.js'), sw);
console.log(`stamped sw.js  version=${version}  assets=${urls.length}`);
