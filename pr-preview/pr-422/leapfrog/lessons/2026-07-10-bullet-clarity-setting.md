# Bullet Clarity — promote the LENS overhaul from URL flag to a live setting (default ON)

## What we did
The LENS bullet-vs-reticle visibility overhaul (PR #343) shipped behind `?lens=2`, OFF by
default. Owner call: make it the shipped experience via a **Bullet Clarity** setting
(default ON), turn-off-able, so the fix actually reaches players.

- `save.js` DEFAULTS.settings gains `bulletClarity: true`. `deepMerge(DEFAULTS, parsed)`
  backfills it for every existing save → the improvement reaches returning players with no
  migration body.
- `lensFlag.js` stops being a fixed `const LENS2` and becomes a **runtime** `lensClarity()`
  = `saveData.settings.bulletClarity`, with a URL override: `?lens=2` forces ON, `?lens=0`
  forces OFF (the A/B escape hatch, wins over the setting).
- `bossBullets.js` resolves `FLARE_TTI`/`FLARE_SIZE_K` **per-frame** from `lensClarity()`
  (was module-load consts) so the toggle takes effect without a reload.
- `reticle.js` always creates the chevron DOM (cheap, hidden until a wind-up) and toggles
  the `.lens2` skin + `.threat` cues per-frame from `lensClarity()`; every teardown path
  clears `lens2`/`threat`/`threat-hot` so nothing leaks onto the ring/gate reticle.
- `ui.js` adds a BULLET CLARITY ON/OFF row to BOTH settings surfaces (full screen +
  pause-menu), reusing the generic `data-assist` handler — no new handler code.

## What we learned / the gotchas
- **A load-time `const` flag can't back a live setting.** The original `const LENS2 = <url>`
  was resolved once at module eval; a settings toggle must be a *function* read where it's
  used (per-frame in the hot loop is fine — it's a property access), and any DOM the flag
  gated (the chevrons) must exist unconditionally so turning the setting ON at runtime has
  something to show. Toggle the *class*, don't create/destroy the elements.
- **Flipping a default flips what the gates exercise.** With `bulletClarity` default ON,
  the pure-node gates (`boss.mjs`, `wisps.mjs`, `bulletcontrast.mjs`) now run the LENS path
  by default — and still pass. That's the stronger claim: the overhaul preserves the
  arrival/kill-time/contrast laws, not just that OFF is byte-identical. (OFF-identity was
  already locked by PR #343; `?lens=0` still exercises it.)
- **Two settings surfaces.** `ui.js` renders settings in two places — the full settings
  screen (`settings-group` + explicit ON/OFF buttons) and the pause-menu quick panel
  (`toggle-row` + `toggleOnOff`). A new toggle needs BOTH or it's half-missing. The shared
  `.seg-btn[data-assist]` click handler (`saveData.settings[dataset.assist] = val==='1'`)
  means a plain `data-assist="key"` button needs zero new wiring.
- **No score coupling.** Unlike `reticle`/`slowMo` (off = score bonus), Bullet Clarity is a
  pure accessibility/legibility aid with NO score effect — it must not touch `gameState.js`
  multiplier logic. Kept it a plain ON/OFF, no bonus badge.

## The reusable pattern
URL-flag → live-setting promotion: `const FLAG = <url>` becomes `fn()` = `url ?? setting`;
gate DOM stays resident and is class-toggled; hot-loop knobs read the fn per-frame;
default flips in `DEFAULTS` (deepMerge backfills saves); add the toggle to every settings
surface via the existing generic handler. Keep the URL override for A/B.

## What it unlocks
- PR2 (next): break the green channel by saturation split (aim chrome → pale mint-white,
  player energy → full jade) so green stops meaning both "aim UI" and "player bullet".
- PR3 (owner sign-off): `relockWarmFrac 0→0.4` — the attention-economics half.

## Verify
`boss.mjs` (116) · `wisps.mjs` (15) · `bulletcontrast.mjs` green with clarity default ON.
Boot-confirmed: default no-param → `bulletClarity=true`, reticle `.lens2` active; live
toggle OFF drops the skin next frame and ON restores it; `?lens=0` forces OFF despite the
setting; the BULLET CLARITY toggle renders in both settings surfaces, defaults ON, and
persists to save on click — all with 0 console errors.
