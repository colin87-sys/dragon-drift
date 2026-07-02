# PHASE 3 HANDOFF — Economy mid-band + endgame

> **Who this is for:** an executor with ZERO context on this codebase. Follow it top to
> bottom. Do not improvise, do not "improve" anything, do not skip a verification block.
> Every step says exactly what to find, what to replace it with, and how to prove it worked.
> If a verification fails: `git checkout -- <file>`, re-read the step, do it again.

**What Phase 3 delivers (5 parts, in order):**
- **A** — *Surge Tints*: a new 150–450◆ cosmetic category (recolours Dragon Surge).
- **B** — *Endless milestones*: the lifetime-milestone ladder never runs out.
- **C** — *4 skill weeklies* + one new per-run counter.
- **D** — *Starters reach Eternal* (the ascension cap is removed).
- **E** — *Per-dragon perks* (roll cooldown / phase cost / near-miss pay).

---

## 0. GOLDEN RULES (read twice, break never)

1. **Only edit files under `reforged/`.** The repo has a second, older `js/` tree at the
   top level. If a path in this doc doesn't start with `reforged/`, you are in the wrong file.
2. **Save-file collections must be ARRAYS, never `{key: value}` maps.** The save loader
   (`reforged/js/save.js` lines 10–12) iterates DEFAULTS' keys and silently DROPS dynamic
   keys inside `{}` objects. Every collection in this doc is already an array — keep it so.
3. **Purchases call `persistNow()` (immediate write). Everything else calls `persist()`
   (debounced).** Copy the pattern shown; do not swap them.
4. **Run the verification block at the end of every step.** Green → next step. Red → revert
   the file and redo the step. Never continue past a red step.
5. **Six browser tests fail in this container even on an untouched tree** (slow software
   rendering): `badges`, `celebrate`, `feats`, `return-triggers`, `save-purchases`,
   `stamina`. Ignore failures in exactly those six and NO others. To confirm a failure is
   pre-existing: `git stash && node reforged/tests/<name>.mjs; git stash pop`.
6. **Economy guardrails** (enforced by `reforged/tests/economy.mjs` — it recomputes from the
   live def tables): early earn rate 120–400◆/run · apex arc 18–45 runs · authored milestone
   pool < 3500◆ · feat pool < 2500◆. If economy.mjs goes red after your change, your numbers
   are wrong — fix the numbers, never the test.
7. **Never touch `reforged/js/level.js` or `reforged/js/config.js` generation constants.**
   Courses are seeded and shared via challenge links; changing generation breaks every link.
   Nothing in Phase 3 needs those files.

### Step 0 — setup

```bash
cd /path/to/dragon-drift
git fetch origin master
git checkout -b claude/phase3-economy origin/master

# Dev server (game at http://localhost:8002/reforged/):
python3 -m http.server 8002

# Test commands you will use constantly:
node reforged/tests/defs.mjs
node reforged/tests/economy.mjs
node reforged/tests/ascension.mjs
node reforged/tests/weekly.mjs
node reforged/tests/run-all.mjs        # full suite (slow)
node reforged/tools/tricount.mjs --ci  # must end: "0 over budget"
```

Baseline check before touching anything — ALL of these must pass right now:

```bash
node reforged/tests/defs.mjs && node reforged/tests/economy.mjs && \
node reforged/tests/ascension.mjs && node reforged/tests/weekly.mjs && echo BASELINE-OK
```

If `BASELINE-OK` doesn't print, STOP — your checkout is broken; do not proceed.

---

## PART A — Surge Tints (new cosmetic category, 150–450◆)

A Surge Tint recolours the Dragon Surge moment: the screen wash, the wing/eye ignition, the
fever trails, the ignition burst, the phase-shatter burst, and the boss-fight aura. It does
NOT touch the normal (non-Surge) trail — that's the flightmark's job.

### A1. Create `reforged/js/surgeTints.js` (new file, paste this exactly)

```js
import { saveData, persistNow } from './save.js';

// Surge Tints: purchasable recolours for the Dragon Surge moment (the shop
// STYLE tab, above the flightmark trails). Each tint overrides the def's
// fever visuals — screen wash, wing/eye ignition, fever trails — plus the
// shared surge-FX palette (ignition burst / phase shatter / boss aura).
// Equipped '' = the dragon's own Surge colours. deepMerge rule: tintsOwned
// is an array (never a keyed map).
//
// wash is a LINEAR-ADD [r,g,b] triple like def.feverWash (see postfx.js
// liftTint) — keep every channel <= 0.12 or the screen overexposes.
export const SURGE_TINTS = [
  { id: 'rosefire',  name: 'Rosefire',   cost: 150, wash: [0.10, 0.03, 0.08], wing: 0xff44cc, eye: 0xff66ee, trail: 0xff9ad6, boostTrail: 0xfff0c0, burst: 0xff88ff, burstHi: 0xffd6f6, aura: 0xff6ae0, bolt: 0xffbdf6 },
  { id: 'emberglow', name: 'Emberglow',  cost: 200, wash: [0.10, 0.05, 0.01], wing: 0xffa030, eye: 0xffd070, trail: 0xffb060, boostTrail: 0xfff0c0, burst: 0xffb050, burstHi: 0xffe6b0, aura: 0xff9a40, bolt: 0xffd9a0 },
  { id: 'tidesurge', name: 'Tidesurge',  cost: 250, wash: [0.02, 0.06, 0.10], wing: 0x40c8ff, eye: 0x90e8ff, trail: 0x60c8ff, boostTrail: 0xd0f4ff, burst: 0x50c0ff, burstHi: 0xc0ecff, aura: 0x45c8ff, bolt: 0xb8ecff },
  { id: 'verdance',  name: 'Verdance',   cost: 250, wash: [0.02, 0.09, 0.03], wing: 0x50e090, eye: 0xa0ffc8, trail: 0x60e8a0, boostTrail: 0xd8ffe8, burst: 0x58e898, burstHi: 0xc8ffdf, aura: 0x4fe08a, bolt: 0xc0ffd8 },
  { id: 'ionstorm',  name: 'Ionstorm',   cost: 300, wash: [0.04, 0.05, 0.11], wing: 0x6a8aff, eye: 0xc0d0ff, trail: 0x7a96ff, boostTrail: 0xe0e8ff, burst: 0x7a90ff, burstHi: 0xd6e0ff, aura: 0x6a8aff, bolt: 0xcfdaff },
  { id: 'duskveil',  name: 'Duskveil',   cost: 350, wash: [0.06, 0.02, 0.11], wing: 0x9a55ff, eye: 0xd0b0ff, trail: 0xa870ff, boostTrail: 0xecdcff, burst: 0xa060ff, burstHi: 0xe0ccff, aura: 0x9a55ff, bolt: 0xdcc6ff },
  { id: 'bloodrush', name: 'Bloodrush',  cost: 400, wash: [0.11, 0.02, 0.02], wing: 0xff4040, eye: 0xff9a80, trail: 0xff6050, boostTrail: 0xffd0b8, burst: 0xff5848, burstHi: 0xffc0ae, aura: 0xff4a44, bolt: 0xffb8a8 },
  { id: 'prismshift', name: 'Prismshift', cost: 450, wash: [0.07, 0.05, 0.09], wing: 0xd0a0ff, eye: 0xffffff, trail: 0x80ffe0, boostTrail: 0xffd6f6, burst: 0xc0b0ff, burstHi: 0xffffff, aura: 0xb0c8ff, bolt: 0xffe0f8,
    trailPalette: [0x80ffe0, 0x40a0ff, 0xff80e0, 0xffffa0] },
];

export function tintOwned(id) {
  return (saveData.cosmetics.tintsOwned || []).includes(id);
}

export function equippedTint() {
  return saveData.cosmetics.tintEquipped || '';
}

export function tintById(id) {
  return SURGE_TINTS.find((t) => t.id === id) || null;
}

export function buyTint(id) {
  const def = tintById(id);
  if (!def || tintOwned(id)) return false;
  if (saveData.embers < def.cost) return false;
  saveData.embers -= def.cost;
  saveData.cosmetics.tintsOwned.push(id);
  persistNow(); // discrete purchase — write immediately, never debounced
  return true;
}

export function equipTint(id) {
  if (id !== '' && !tintOwned(id)) return false;
  saveData.cosmetics.tintEquipped = id;
  persistNow();
  return true;
}

// Overlay the equipped tint's SURGE-time colours onto a dragon def copy.
// The tint owns the fever moment; the flightmark keeps the normal trail.
export function applySurgeTint(def) {
  const id = equippedTint();
  if (!id) return def;
  const t = tintById(id);
  if (!t) return def;
  const d = { ...def };
  d.feverWash = t.wash;
  d.feverWing = t.wing;
  d.feverEye = t.eye;
  d.feverTrail = t.trail;
  d.feverBoostTrail = t.boostTrail;
  if (t.trailPalette) d.feverTrailPalette = t.trailPalette;
  d.surgeFx = { ignite: t.burst, burstHi: t.burstHi, aura: t.aura, bolt: t.bolt };
  return d;
}
```

### A2. Save shape — `reforged/js/save.js`

FIND (line ~48):
```js
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [] }, // formPref: [[key, tierToDisplay]]
```
REPLACE with:
```js
  cosmetics: { marksOwned: [], markEquipped: '', formPref: [], tintsOwned: [], tintEquipped: '' }, // formPref: [[key, tierToDisplay]]
```
That's the whole migration — deepMerge backfills old saves automatically.

### A3. Equip pipeline — `reforged/js/main.js`

**A3a.** FIND the import (line ~49):
```js
import { applyFlightmark, buyFlightmark, equipFlightmark, FLIGHTMARKS, migrateFlightmarks } from './flightmarks.js';
```
ADD directly below it:
```js
import { applySurgeTint, buyTint, equipTint, SURGE_TINTS, tintOwned, equippedTint } from './surgeTints.js';
```

**A3b.** FIND (lines ~115–121):
```js
const equippedDragon = () => {
  const key = saveData.skins.equipped;
  const def = DRAGONS[key] || DRAGONS.azure;
  const fp = saveData.cosmetics.formPref.find(e => e[0] === key);
  const tier = fp ? Math.min(fp[1], ascensionTier(key)) : ascensionTier(key);
  return applyFlightmark(ascendedDef(def, tier, radianceRank(key)));
};
```
REPLACE the last line of that function with:
```js
  return applySurgeTint(applyFlightmark(ascendedDef(def, tier, radianceRank(key))));
```

**A3c.** FIND the flightmark handlers (lines ~303–310):
```js
  onBuyFlightmark: (id) => buyFlightmark(id),
  onEquipFlightmark: (id) => {
    if (equipFlightmark(id)) {
      rebuildDragon(equippedDragon(), equippedRider(), player);
      return true;
    }
    return false;
  },
```
ADD directly below them (same object):
```js
  onBuyTint: (id) => buyTint(id),
  onEquipTint: (id) => {
    if (equipTint(id)) {
      rebuildDragon(equippedDragon(), equippedRider(), player);
      return true;
    }
    return false;
  },
```

### A4. Def-driven fever trails — `reforged/js/dragon.js` (5 one-line edits)

These five lines hardcode the Surge trail colours. Each edit swaps the literal for a
def-driven fallback. Find each line EXACTLY as shown (line numbers approximate — search for
the hex literal).

1. FIND (line ~983):
```js
        s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xc998ff : pickTrailHex(activeDef.trail));
```
REPLACE:
```js
        s.material.color.setHex(player.feverActive ? pickFeverHex(0xc998ff) : pickTrailHex(activeDef.trail));
```

2. FIND (line ~1016):
```js
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xff9ad6 : pickTrailHex(activeDef.trail));
```
REPLACE:
```js
      s.material.color.setHex(player.feverActive ? pickFeverHex(0xff9ad6) : pickTrailHex(activeDef.trail));
```

3. FIND (line ~1049):
```js
      s.material.color.setHex(player.feverActive && !activeDef.hasStyle ? 0xfff0c0 : pickTrailHex(activeDef.boostTrail));
```
REPLACE:
```js
      s.material.color.setHex(player.feverActive ? (activeDef.feverBoostTrail ?? (activeDef.hasStyle ? pickTrailHex(activeDef.boostTrail) : 0xfff0c0)) : pickTrailHex(activeDef.boostTrail));
```

4. FIND (line ~1078):
```js
      const fireHex = activeDef.hasStyle ? pickTrailHex(activeDef.trail) : 0xff4fd8;
```
REPLACE:
```js
      const fireHex = pickFeverHex(0xff4fd8);
```

5. FIND (line ~1124):
```js
        const hex = surging ? (activeDef.hasStyle ? pickTrailHex(activeDef.trail) : 0xff4fd8) : 0xffffff;
```
REPLACE:
```js
        const hex = surging ? pickFeverHex(0xff4fd8) : 0xffffff;
```

Now add the helper. FIND `function pickTrailHex(fallback) {` (line ~121) and its closing
`}` (line ~125), then ADD directly below the closing brace:
```js
// Fever-trail colour: an equipped Surge Tint wins; else a flightmark keeps its
// own colours through Surge (hasStyle); else the classic magenta literals.
function pickFeverHex(fallback) {
  const pal = activeDef && activeDef.feverTrailPalette;
  if (pal && pal.length) return pal[trailPaletteIdx++ % pal.length];
  if (activeDef && activeDef.feverTrail != null) return activeDef.feverTrail;
  if (activeDef && activeDef.hasStyle) return pickTrailHex(activeDef.trail);
  return fallback;
}
```

The screen wash needs no work: `setFeverTint(def.feverWash || null)` at dragon.js line ~181
already reads the (now tint-overlaid) def.

### A5. Shared surge-FX palette (ignition burst / phase shatter / boss aura)

**A5a — `reforged/js/particles.js`.** ADD near the top of the file (below the imports):
```js
// Shared Surge-FX palette: the ignition burst, phase-shatter violets, and the
// boss-fight aura all read from here so an equipped Surge Tint recolours them.
// Defaults = the classic shipped colours.
const SURGE_FX_DEFAULT = { ignite: 0xff88ff, burst: 0xc060ff, burstHi: 0xe8d0ff, aura: 0xff6ae0, bolt: 0xffbdf6 };
let surgeFx = { ...SURGE_FX_DEFAULT };
export function setSurgeFx(fx) { surgeFx = { ...SURGE_FX_DEFAULT, ...(fx || {}) }; }
export function getSurgeFx() { return surgeFx; }
```
Then in `phaseBurst` (lines ~155–174) replace the FOUR colour literals:
- every `0xc060ff` → `surgeFx.burst`  (3 occurrences: two `burst(...)` calls + one `shockwave`)
- every `0xe8d0ff` → `surgeFx.burstHi` (3 occurrences)
- `i % 2 ? 0xd59bff : 0x9b6bff` → `i % 2 ? surgeFx.burstHi : surgeFx.burst`

**A5b — `reforged/js/collision.js`.** FIND (line ~230):
```js
    burst(player.position, 0xff88ff, { count: 30, speed: 16, size: 1.3 });
```
REPLACE:
```js
    burst(player.position, getSurgeFx().ignite, { count: 30, speed: 16, size: 1.3 });
```
and extend the existing particles import (line ~8) — FIND:
```js
import { burst, gateThreadBurst, nearMissSparks, phaseBurst } from './particles.js';
```
REPLACE:
```js
import { burst, gateThreadBurst, nearMissSparks, phaseBurst, getSurgeFx } from './particles.js';
```

**A5c — `reforged/js/dragon.js`** (drive the palette on equip). FIND (line ~181):
```js
  setFeverTint(def.feverWash || null);
```
ADD directly below:
```js
  setSurgeFx(def.surgeFx || null);
```
dragon.js does NOT currently import particles.js — add a NEW import line. FIND (line ~5):
```js
import { setFeverTint } from './postfx.js';
```
ADD directly below it:
```js
import { setSurgeFx } from './particles.js';
```

**A5d — `reforged/js/boss.js`** (recolour the aura at Surge time). FIND in `activateSurge`
(line ~610):
```js
function activateSurge(player) {
  game.feverActive = true;
```
ADD directly below those two lines:
```js
  // Surge Tint: recolour the aura hoop + lightning to the equipped palette.
  if (surgeAura) {
    const fx = getSurgeFx();
    surgeAura.userData.haloA.material.color.setHex(fx.aura);
    if (surgeAura.userData.bolts.length) surgeAura.userData.bolts[0].material.color.setHex(fx.bolt);
  }
```
and extend boss.js's particles import (line ~8) — FIND:
```js
import { burst } from './particles.js';
```
REPLACE:
```js
import { burst, getSurgeFx } from './particles.js';
```
(Note: all bolts share one material, so recolouring `bolts[0]`'s material recolours all six.)

The HUD's CSS fever colours (score glow, gem row, edge wash) intentionally stay magenta —
do NOT touch `css/style.css`.

### A6. Shop STYLE tab section — `reforged/js/ui.js`

**A6a.** Extend the imports. FIND (line ~16, the flightmarks import):
```js
import { FLIGHTMARKS, flightmarkOwned, equippedFlightmark } from './flightmarks.js';
```
ADD below it:
```js
import { SURGE_TINTS, tintOwned, equippedTint } from './surgeTints.js';
```
(If the existing flightmarks import line differs slightly, keep it as-is and just add the
new import line — the point is ui.js can now see SURGE_TINTS.)

**A6b.** FIND the style-tab render branch opener (line ~1379):
```js
      } else { // style — flightmark trail cosmetics
        const activeId = equippedFlightmark();
```
ADD directly below `const activeId = equippedFlightmark();`:
```js
        const tintActive = equippedTint();
        const tintCards = [`
          <div class="skin-card${tintActive === '' ? ' equipped' : ''}" data-tint="">
            <div class="tint-swatch" style="background:radial-gradient(circle at 40% 35%, #ff9ad6, #b03d90)"></div>
            <div class="skin-name">Dragon's Surge</div>
            <div class="skin-title">Default Surge colours</div>
            <div class="skin-cost owned">${tintActive === '' ? 'ACTIVE' : 'TAP TO EQUIP'}</div>
          </div>`,
          ...SURGE_TINTS.map((t) => {
            const owned = tintOwned(t.id);
            const active = tintActive === t.id;
            const hx = (n) => `#${n.toString(16).padStart(6, '0')}`;
            return `
            <div class="skin-card${active ? ' equipped' : ''}${owned ? '' : ' locked'}" data-tint="${t.id}">
              <div class="tint-swatch" style="background:radial-gradient(circle at 40% 35%, ${hx(t.trail)}, ${hx(t.wing)})"></div>
              <div class="skin-name">${t.name}</div>
              <div class="skin-title">Surge tint</div>
              <div class="skin-cost ${owned ? 'owned' : ''}">${active ? 'ACTIVE' : owned ? 'TAP TO EQUIP' : `◆ ${t.cost}`}</div>
            </div>`;
          })].join('');
```
Then FIND, a few lines further down, the body assembly:
```js
        body = `<div class="shop-grid">${defaultCard}${markCards}</div>
          <p class="share-hint">Trail marks are purely cosmetic — fly any color you like.</p>`;
```
REPLACE with:
```js
        body = `<h3 class="shop-section-head">SURGE TINTS</h3>
          <div class="shop-grid">${tintCards}</div>
          <h3 class="shop-section-head">TRAILS</h3>
          <div class="shop-grid">${defaultCard}${markCards}</div>
          <p class="share-hint">Style is purely cosmetic — fly any color you like.</p>`;
```

**A6c.** FIND the flightmark click-handler loop opener (line ~2203):
```js
    // Flightmarks: equip free default or buy/equip a mark
    for (const card of els.screen.querySelectorAll('.skin-card[data-flightmark]')) {
```
ADD this whole block directly ABOVE that comment (same function scope):
```js
    // Surge Tints: equip free default or buy/equip a tint
    for (const card of els.screen.querySelectorAll('.skin-card[data-tint]')) {
      card.onclick = stop(() => {
        const id = card.dataset.tint;
        if (id === '') {
          handlers.onEquipTint && handlers.onEquipTint('');
          ui.showScreen('shop');
          return;
        }
        const t = SURGE_TINTS.find((x) => x.id === id);
        if (tintOwned(id)) {
          handlers.onEquipTint && handlers.onEquipTint(id);
          ui.showScreen('shop');
        } else if (saveData.embers >= t.cost) {
          if (handlers.onBuyTint && handlers.onBuyTint(id)) {
            handlers.onEquipTint && handlers.onEquipTint(id);
            ui.showScreen('shop');
            ui.celebrate({
              kind: 'flightmark', tier: 'small', glyph: '⚡',
              title: t.name, subtitle: 'Surge tint equipped',
            });
          }
        } else {
          needMore(t.cost, `${t.name} tint`);
        }
      });
    }
```

**A6d.** CSS for the swatch + section head — `reforged/css/style.css`. FIND the
`.trail-preview` rule (search `trail-preview {`), ADD below it:
```css
.tint-swatch { width: 100%; height: 104px; border-radius: 10px;
  box-shadow: inset 0 0 22px rgba(0,0,0,0.35), 0 0 14px rgba(255,140,230,0.12); }
.shop-section-head { font-size: 11px; letter-spacing: 2px; color: var(--rf-ink-2);
  margin: 14px 4px 6px; font-weight: 700; }
```

### A7. Tests — `reforged/tests/defs.mjs`

FIND the flightmark block (lines ~108–115, ends with `ok(`…flightmarks…`)`). ADD below it:
```js
// --- Surge tints ---
const stIds = SURGE_TINTS.map((t) => t.id);
assertEq(new Set(stIds).size, stIds.length, 'surge tint ids unique');
for (const t of SURGE_TINTS) {
  assert(t.cost >= 100 && t.cost <= 500, `tint ${t.id} cost in [100,500] (the mid-band)`);
  assert(Array.isArray(t.wash) && t.wash.length === 3, `tint ${t.id} wash is [r,g,b]`);
  assert(t.wash.every((c) => c >= 0 && c <= 0.12), `tint ${t.id} wash channels <= 0.12 (no overexposure)`);
  for (const k of ['wing', 'eye', 'trail', 'boostTrail', 'burst', 'burstHi', 'aura', 'bolt']) {
    assert(typeof t[k] === 'number', `tint ${t.id} has ${k} colour`);
  }
}
ok(`${SURGE_TINTS.length} surge tints, unique ids, costs in the 100-500 mid-band`);
```
And add the import at the top of defs.mjs, next to the FLIGHTMARKS import:
```js
const { SURGE_TINTS } = await import('../js/surgeTints.js');
```
(Match the import style already used in the file — it uses `await import(...)`.)

### ✅ PART A VERIFICATION

```bash
node reforged/tests/defs.mjs        # expect: "... 8 surge tints, unique ids, costs in the 100-500 mid-band"
node reforged/tests/economy.mjs     # still green (tints are a SINK, not a faucet)
node reforged/tests/smoke.mjs       # boots clean, zero console errors
node reforged/tests/shop.mjs        # STYLE tab still renders (pre-existing container failures excluded)
```
Manual: open `http://localhost:8002/reforged/?debug`, SHOP → STYLE. You must see a
SURGE TINTS section (9 cards incl. default) above TRAILS. Buy Rosefire (needs 150◆ — use a
dev save or the settings DEV MODE), equip, start a run, chain 8 rings to trigger Surge: the
wash/trails/burst must read pink-red per the tint, not default magenta.
Commit: `git add -A && git commit -m "Surge Tints: 150-450 ember cosmetic mid-band (recolours the Surge moment)"`

---

## PART B — Endless milestone ladder

Goal: after a ladder's authored rungs are all claimed, computed "endless" rungs continue at
×2.2 spacing, each paying 150◆ — the NEXT UP selector never runs dry.

### B1. `reforged/js/milestones.js`

ADD below the `claimKey` helper (line ~18):
```js
// Endless extension: past the authored tail, virtual rungs continue at ×2.2
// spacing (rounded to 2 significant figures), each paying the band ceiling.
// They are COMPUTED, never stored — the claim keys keep the "stat:at" format.
const ENDLESS_MULT = 2.2;
const ENDLESS_REWARD = 150;
function niceRound(n) {
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / mag) * mag;
}
// Every endless rung for `m` up to (and including) the first one NOT yet reached
// by `have` — so settle can pay all crossed ones and next() can target the next.
function endlessRungs(m, have) {
  const last = m.rungs[m.rungs.length - 1][0];
  const out = [];
  let at = niceRound(last * ENDLESS_MULT);
  while (out.length < 200) {           // hard stop — no infinite loop, ever
    out.push([at, ENDLESS_REWARD]);
    if (at > have) break;
    at = niceRound(at * ENDLESS_MULT);
  }
  return out;
}
```

In `settleMilestones()` — FIND:
```js
    const have = saveData.stats[m.stat] || 0;
    for (const [at, reward] of m.rungs) {
```
REPLACE those two lines with:
```js
    const have = saveData.stats[m.stat] || 0;
    for (const [at, reward] of [...m.rungs, ...endlessRungs(m, have)]) {
```

In `nextMilestone()` — FIND:
```js
    const have = saveData.stats[m.stat] || 0;
    for (const [at, reward] of m.rungs) {
```
REPLACE with:
```js
    const have = saveData.stats[m.stat] || 0;
    for (const [at, reward] of [...m.rungs, ...endlessRungs(m, have)]) {
```
(There are exactly two such loops in the file — one in each function. Both get the same edit.)

### B2. Tests — append to `reforged/tests/economy.mjs`

ADD at the end of the file (before any final `console.log` summary line if present, else at
the very end):
```js
// --- Endless milestone rungs: computed, monotone, claim-once ---
{
  const { settleMilestones, nextMilestone, MILESTONES } = await import('../js/milestones.js');
  const { saveData } = await import('../js/save.js');
  const m = MILESTONES[0];                       // totalRings, authored tail 8000
  const tail = m.rungs[m.rungs.length - 1][0];
  saveData.stats[m.stat] = tail * 3;             // deep past the authored tail
  saveData.stats.runs = 50;
  saveData.milestones.claimed = [];
  saveData.embers = 0;
  const first = settleMilestones();
  assert(first.length > m.rungs.length, 'endless rungs pay past the authored tail');
  const second = settleMilestones();
  assert(second.length === 0, 'endless rungs never double-claim');
  const nxt = nextMilestone();
  assert(nxt && nxt.at > saveData.stats[m.stat], 'NEXT UP targets an unreached endless rung');
  ok('endless milestone ladder: pays once, always offers a next rung');
}
```
(If economy.mjs doesn't already define `ok`/`assert` in scope at the end, mirror however the
file defines them at the top — it does, reuse the same helpers.)

### ✅ PART B VERIFICATION

```bash
node reforged/tests/economy.mjs   # green incl. "endless milestone ladder: pays once..."
node reforged/tests/defs.mjs      # green — authored pool untouched (< 3500)
```
Commit: `git add -A && git commit -m "Endless milestone ladder: computed x2.2 rungs past the authored tail"`

---

## PART C — Skill weeklies (4 new) + the phasesRun counter

### C1. New per-run counter — `reforged/js/gameState.js`

FIND (line ~21):
```js
  phaseStreak: 0,      // consecutive PERFECT phases (drives the phase chime ladder)
```
ADD below it:
```js
  phasesRun: 0,        // TOTAL Surge phase-throughs this run (skill weekly)
```
FIND in `reset()` the line `this.phaseStreak = 0;` (search for it) and ADD below it:
```js
    this.phasesRun = 0;
```

### C2. Increment it — `reforged/js/collision.js`

FIND the opening of `phaseThroughGate` (line ~241):
```js
function phaseThroughGate(c, player, opts = {}) {
  const assisted = !!opts.assisted;
```
ADD directly below those two lines:
```js
  game.phasesRun++;
```

### C3. Four new trials — `reforged/js/weekly.js`

FIND the last entry of `TRIAL_POOL` (line ~45):
```js
  { id: 'wk_score12k',   label: 'Score 12,000 in one run', target: 12000, mode: 'max', reward: 500, title: 'highflyer',      contrib: (g) => Math.floor(g.score) },
```
ADD below it (inside the array):
```js
  // Skill trials: mechanical asks, not accumulation slogs.
  { id: 'wk_roll40',     label: 'Barrel-roll 40 times',          target: 40,  mode: 'sum', reward: 350, title: 'stuntwing',    contrib: (g) => g.rolls || 0 },
  { id: 'wk_boss3',      label: 'Slay 3 bosses',                 target: 3,   mode: 'sum', reward: 500, title: 'tyrantsbane',  contrib: (g) => g.bossesDefeatedRun },
  { id: 'wk_graze120',   label: 'Graze 120 boss bullets',        target: 120, mode: 'sum', reward: 400, title: 'stormskimmer', contrib: (g) => g.grazesRun },
  { id: 'wk_phase10',    label: 'Phase through 10 Surge walls',  target: 10,  mode: 'sum', reward: 450, title: 'wallbreaker',  contrib: (g) => g.phasesRun },
```

### C4. Four new titles — `reforged/js/titles.js`

FIND the last weekly-trial title in `TITLES` (search `highflyer`):
```js
  { id: 'highflyer',    name: 'Highflyer',       source: 'Weekly trial' },
```
ADD below it:
```js
  { id: 'stuntwing',    name: 'Stuntwing',       source: 'Weekly trial' },
  { id: 'tyrantsbane',  name: "Tyrant's Bane",   source: 'Weekly trial' },
  { id: 'stormskimmer', name: 'Stormskimmer',    source: 'Weekly trial' },
  { id: 'wallbreaker',  name: 'Wallbreaker',     source: 'Weekly trial' },
```
(All names ≤ 16 chars — the defs test enforces it.)

### ✅ PART C VERIFICATION

```bash
node reforged/tests/defs.mjs     # "trial pool ≥9..." + "titles unique, ≤16 chars..."
node reforged/tests/weekly.mjs   # draw determinism still green
node reforged/tests/economy.mjs  # weekly average shifted slightly — bands must still hold
node reforged/tests/smoke.mjs
```
If economy.mjs went red on the earn-rate band: your rewards deviate from the doc — re-check
C3 numbers (350/500/400/450), do NOT tweak the test.
Commit: `git add -A && git commit -m "4 skill weeklies (rolls/bosses/grazes/phases) + phasesRun counter + titles"`

---

## PART D — Starters reach Eternal

### D1. `reforged/js/ascension.js`

FIND (lines ~53–58):
```js
export function maxTierFor(key) {
  // Asset-backed dragons have a single static GLB form — a mesh can't morph
  // geometry across ascension, so they cap at form 0 (no ascension ladder).
  if (DRAGONS[key]?.assetBacked) return 0;
  return DRAGONS[key]?.maxRarity === 'SSR' ? 2 : ASCENSION_TIERS.length;
}
```
REPLACE with:
```js
export function maxTierFor(key) {
  // Asset-backed dragons have a single static GLB form — a mesh can't morph
  // geometry across ascension, so they cap at form 0 (no ascension ladder).
  if (DRAGONS[key]?.assetBacked) return 0;
  // Every procedural dragon can reach Eternal. Starters (3 forms) reuse their
  // Radiant geometry at tier 3 (ascendedDef clamps formLevel) but still gain
  // the apex size/stat ramps + isFinal FX (bodyGlow, sparkle, apexEye) — and
  // their rarity badge honestly stays SSR (RARITY_LADDERS clamps in ui.js).
  return ASCENSION_TIERS.length;
}
```
Nothing else changes: `ascendedDef` already clamps `formLevel = Math.min(tier,
(def.forms?.length ?? 1) - 1)`, the SSR rarity ladder already clamps the badge, and the cost
is already naturally cheaper for starters (`tierCostMult(cost 0) = 1.0` → Eternal = 3200◆).

### D2. New test — `reforged/tests/ascension.mjs`

FIND the block ending `ok('canAscend correctly gates on metres, embers, and tier limit');`
ADD below it:
```js
// Starters can now reach Eternal (tier 3) — cap removed; geometry reuses form 2.
reset(99999, [['azure', 999999]], [['azure', 2]]);
const rEternal = canAscend('azure', 0);
assert(rEternal.ok, 'a starter with metres + embers can ascend Radiant → Eternal');
reset(99999, [['azure', 999999]], [['azure', 3]]);
assert(!canAscend('azure', 0).ok, 'tier 3 stays the ceiling');
ok('starters reach Eternal (stats+glow); tier 3 is still the ceiling');
```
(Match `reset(...)`'s existing signature in the file — it's used exactly like this in the
"beyond final form" block right above.)

### ✅ PART D VERIFICATION

```bash
node reforged/tests/ascension.mjs   # incl. "starters reach Eternal..."
node reforged/tests/defs.mjs        # form-count contract untouched (starters keep 3 forms)
node reforged/tests/run-all.mjs     # full sweep (ignore ONLY the six known-env failures)
```
Manual: dev-mode save, open SHOP → a starter (Azure): the form ladder must show a 4th
segment; selecting it must show the bigger, glowing (bodyGlow/sparkle) Radiant-geometry form
with badge "SSR" and tier name "Eternal".
Commit: `git add -A && git commit -m "Starters reach Eternal: ascension cap removed (stats+glow; geometry reuses Radiant)"`

---

## PART E — Per-dragon perks

### E1. Carrier — `reforged/js/player.js`

FIND `applyDragonStats` (lines ~50–59) and ADD as the LAST line inside the function body:
```js
  game.perk = (def && def.perk) || null;
```
(`game` is already imported at the top of player.js.)

FIND in `tryRoll` (line ~103):
```js
    this.rollCooldown = CONFIG.rollCooldown;
```
REPLACE:
```js
    this.rollCooldown = CONFIG.rollCooldown * (game.perk?.rollCdMult ?? 1);
```

### E2. gameState — `reforged/js/gameState.js`

FIND the `bossArenaHW: null,` field line, ADD below it:
```js
  perk: null,          // equipped dragon's perk { id, label, rollCdMult?, phaseCostMult?, nearMissMult? }
```
(Do NOT reset it in `reset()` — it belongs to the equipped dragon, not the run.)

### E3. Consumption — `reforged/js/collision.js`

**E3a. Phase cost.** FIND (lines ~146–152):
```js
            const canPhase = game.feverActive &&
              player.rollInvuln > 0 &&
              game.stamina >= CONFIG.phaseStaminaCost;
            if (canPhase) {
              c.phased = true;
              game.stamina -= CONFIG.phaseStaminaCost;
```
REPLACE with:
```js
            const phaseCost = CONFIG.phaseStaminaCost * (game.perk?.phaseCostMult ?? 1);
            const canPhase = game.feverActive &&
              player.rollInvuln > 0 &&
              game.stamina >= phaseCost;
            if (canPhase) {
              c.phased = true;
              game.stamina -= phaseCost;
```

**E3b. Near-miss pay.** FIND (line ~277):
```js
  const bonus = Math.round(CONFIG.nearMissBonus * game.combo * game.scoreMult);
```
REPLACE:
```js
  const bonus = Math.round(CONFIG.nearMissBonus * (game.perk?.nearMissMult ?? 1) * game.combo * game.scoreMult);
```

### E4. Perk defs — `reforged/js/dragons.js` (6 dragons)

For each dragon below, FIND its `stats: { ... },` line and ADD the perk line directly below
it. The stats lines are unique per dragon — search for them exactly.

| dragon | find its stats line | add below it |
|---|---|---|
| jade | `stats: { speed: 1.07, handling: 1.11, drain: 0.9, regen: 1.1 },` | `perk: { id: 'quickroll', label: 'Roll cooldown −25%', rollCdMult: 0.75 },` |
| ember | `stats: { speed: 1.04, handling: 1.06, drain: 0.95, regen: 1.05 },` | `perk: { id: 'daredevil', label: 'Near-misses pay +20%', nearMissMult: 1.2 },` |
| water | `stats: { speed: 1.0, handling: 1.06, drain: 1.0, regen: 1.06 },` | `perk: { id: 'slipstream', label: 'Surge phase −20% stamina', phaseCostMult: 0.8 },` |
| fire | `stats: { speed: 1.05, handling: 1.04, drain: 1.0, regen: 1.0 },` | `perk: { id: 'hotstep', label: 'Roll cooldown −15%', rollCdMult: 0.85 },` |
| obsidian | `stats: { speed: 1.1, handling: 1.16, drain: 0.84, regen: 1.18 },` | `perk: { id: 'shadowgraze', label: 'Near-misses pay +15%', nearMissMult: 1.15 },` |
| pearl | `stats: { speed: 1.13, handling: 1.22, drain: 0.78, regen: 1.25 },` | `perk: { id: 'ghostlight', label: 'Surge phase −15% stamina', phaseCostMult: 0.85 },` |

**If two dragons share an identical stats line** (possible for obsidian/obsidian2 — both
`speed: 1.1, handling: 1.16...`): add the perk only inside the def whose block header is
`obsidian: {` at line ~201 (check the `name:` above the stats line). Solar and Phoenix get
NO perk — raw stats are their identity. Azure stays perk-free as the baseline.

### E5. Shop UI perk line — `reforged/js/ui.js`

**E5a.** FIND the end of `inspectStatRows` (lines ~138–151):
```js
  return row('SPEED', spd) + row('AGILITY', agi) + row('STAMINA', sta);
}
```
REPLACE with:
```js
  const perkRow = d.perk
    ? `<div class="ins-stat ins-perk"><span class="ins-stat-label">PERK</span>`
      + `<span class="ins-perk-label">${d.perk.label}</span></div>`
    : '';
  return row('SPEED', spd) + row('AGILITY', agi) + row('STAMINA', sta) + perkRow;
}
```

**E5b.** FIND in the hero-select refresh (line ~2010):
```js
        q('#hero-stats').innerHTML = srow('SPEED', spd) + srow('AGILITY', agi) + srow('STAMINA', sta);
```
REPLACE:
```js
        q('#hero-stats').innerHTML = srow('SPEED', spd) + srow('AGILITY', agi) + srow('STAMINA', sta)
          + (d.perk ? `<div class="hsrow"><div class="hslabel">PERK</div><div class="hsperk">${d.perk.label}</div></div>` : '');
```

**E5c.** CSS — `reforged/css/style.css`, add below the `.tint-swatch` rules from A6d:
```css
.ins-perk-label, .hsperk { font-size: 11px; color: #ffd24d; letter-spacing: 0.4px; }
```

### E6. Tests — `reforged/tests/defs.mjs`

ADD below the surge-tint block from A7:
```js
// --- Per-dragon perks (nullable; small, bounded multipliers) ---
for (const [key, d] of Object.entries(DRAGONS)) {
  if (!d.perk) continue;
  assert(typeof d.perk.id === 'string' && typeof d.perk.label === 'string', `dragon ${key} perk has id+label`);
  assert(d.perk.label.length <= 28, `dragon ${key} perk label ≤ 28 chars`);
  for (const k of ['rollCdMult', 'phaseCostMult', 'nearMissMult']) {
    if (d.perk[k] === undefined) continue;
    assert(d.perk[k] >= 0.7 && d.perk[k] <= 1.3, `dragon ${key} perk ${k} in [0.7,1.3]`);
  }
}
ok('perks nullable, labels short, multipliers bounded');
```

### ✅ PART E VERIFICATION

```bash
node reforged/tests/defs.mjs     # incl. "perks nullable, labels short, multipliers bounded"
node reforged/tests/smoke.mjs    # boots + rig animates, zero console errors
node reforged/tests/run-all.mjs  # full sweep (six known-env failures excluded)
```
Manual: SHOP → Jade Serpent must show "PERK · Roll cooldown −25%"; equip Jade, start a run,
barrel-roll twice quickly — the second roll comes noticeably sooner than on Azure.
Commit: `git add -A && git commit -m "Per-dragon perks: roll/phase/near-miss identity multipliers + shop perk line"`

---

## FINAL CHECKLIST (do all of it, in order)

1. **Full suite + budget:**
   ```bash
   node reforged/tests/run-all.mjs        # only the six known-env failures allowed
   node reforged/tools/tricount.mjs --ci  # must end "0 over budget"
   ```
2. **Append the ledger entry** to `LEAPFROG.md` (repo root — find the highest `### L<n>`
   at the bottom, use the next number):
   ```
   ### L<next> — Phase 3 economy: the mid-band sink, endless rungs, skill weeklies, starter Eternal, perks
   **Did / learned:** <2-4 sentences: what you shipped + anything that surprised you>
   **→ Systematize:** Surge Tints prove the "overlay def-copy" cosmetic pattern (flightmarks →
     tints → next category is mechanical); endless rungs are computed, never stored; perks ride
     game.perk so any future consumption site is one `?? 1` multiplier away.
   **→ Leapfrog (innovate):** <1-3 sentences: what this unlocks next>
   ```
3. **Push + draft PR:**
   ```bash
   git push -u origin claude/phase3-economy
   ```
   Open a DRAFT PR titled `Phase 3 economy: Surge Tints, endless milestones, skill weeklies, starter Eternal, perks`.
   Body: list the five parts, the verification results, and the preview items below.
4. **Tell the human to judge on the PR preview:** tint visibility during a real Surge (each
   of the 8), shop STYLE tab layout at mobile width, perk-line legibility, starter-Eternal
   glow reading "worth 3200◆", and that the default (no tint) Surge is pixel-identical to
   before.

## IF SOMETHING GOES WRONG

- A test you can't explain goes red → `git stash && node reforged/tests/<name>.mjs` — if it's
  red on the clean tree too, unstash and ignore (container issue); if it's green on the clean
  tree, YOUR change broke it: unstash, revert that step's file, redo the step.
- The game won't boot (`smoke.mjs` red) → you almost certainly broke an import. Check the
  browser console at `http://localhost:8002/reforged/?debug` — the first red line names the file.
- Merge conflict on `LEAPFROG.md` when pushing → it's append-only: keep BOTH sides' entries,
  renumber yours to the next free `L<n>`.
- Anything else → stop and ask. Do not freelance.
