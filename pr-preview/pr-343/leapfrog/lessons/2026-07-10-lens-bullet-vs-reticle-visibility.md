# LENS — bullet-vs-reticle visibility (hero increment, `?lens=2`)

## What we did
Owner reported the real problem from a live run: in a boss fight the green lock reticle
and the magenta enemy bullets **co-originate at screen-centre** (the reticle tracks the
boss organ; bullets spawn from `def.muzzle`, also the boss body), so incoming fire is hard
to read while you're busy flying the aim-line onto a lock. An investigation confirmed it's
not purely a skill issue — there's a genuine occlusion + colour-channel collision (the
reticle green `rgba(80,255,170)` is the *same* jade as the player's own wisp-lance).

Shipped the first of a 3-PR plan as ONE hero increment behind `?lens=2` (default OFF ⇒
byte-identical roster), all three interventions proven together:

1. **Imminent-bullet SIZE POP** (`bossBullets.js`) — the last-instant time-to-impact flare
   now grows the disc (`flarePop = 1 + FLARE_SIZE_K*flare`, boss-only), not just heats it,
   and the window widens (`flareTti 0.3 → flareTtiLens 0.45`). Size is the fairest
   legibility axis (Enter-the-Gungeon doubled bullet size twice for this). `s.r` — the
   hitbox — is untouched, so the extra size is purely forgiving.
2. **HOLLOW corner-bracket reticle** (`css/style.css`, `.lens2.boss`) — the nested inner
   square is dropped and the outer one is CSS-`mask`ed to four corner boxes → four L
   brackets with a **transparent centre** over the muzzle, so a bullet spawning + ramping
   there is born in clear pixels instead of behind glowing chrome. All dwell/lock state,
   spin and tint carry.
3. **THREAT-YIELD + telegraph-at-the-gaze** (`reticle.js`) — `incomingThreat()` (a pure
   query filled FREE in the bullet pool walk) reports the nearest inbound in-lane bullet;
   the reticle's glow eases back (`--yield`, ~0.25s) when one is closing, so the threat is
   the loudest thing at the point of gaze. And four magenta danger chevrons ramp straight
   off the live boss wind-up (`bossCharge01()` → `--threat`), blinking in the final instant
   — the "incoming" cue lands where the eyes already are.

## What we learned / the gotchas
- **TDZ from placing derived consts above their deps.** First cut put
  `THREAT_LAT = R*… ` and the `FLARE_*` consts right after the imports — but `const R`,
  `const POOL` etc. are declared ~15 lines further down. `const` is not hoisted-initialised,
  so this threw `ReferenceError` at module load and took out `boss.mjs`/`wisps.mjs` at
  *import time* (the stack pointed at the new line, not the tests). Lesson: module-scope
  derived constants must sit **below** every base const they read. The pure-node gates catch
  this instantly (they import the module) — run them first.
- **Debug charge pin ≠ real charge.** `__dd.bossPinCharge(lvl)` calls `model.setCharge`
  directly; it does NOT arm `chargeT`/`chargeDur`. `bossCharge01()` derives from the latter,
  so the chevrons read 0 under the pin and only ramp during a **natural** wind-up. Verify
  telegraph wiring by letting a fight run and sampling `--threat` over ~7s (it hits 1.0),
  not by pinning. The pin is for still-crops of the *model* pose only.
- **Yield needs no class, just a var.** The `.rsq` opacity is `calc(1 - var(--yield)*0.55)`,
  eased in JS — dimming the glow/brackets but never the dwell fill or lock border (the plan's
  #1 feel risk: a dim that reads as "lock lost"). Chevrons/pips/marks are NOT under `.rsq`, so
  the yield never touches the threat cue or the paint state.
- **CSS triangle direction via which border is coloured, not `rotate()`.** Four chevrons
  point outward by colouring border-bottom/left/top/right respectively — avoids the
  transform-order ambiguity of `translate(...) rotate(...)`. (Beware: `getComputedStyle`
  returns a non-transparent colour for a 0-width border side, so probe direction by the
  transform matrix, not by which `border*Color` is set.)

## The reusable pattern
- **Coexist behind an inert URL flag** (`js/lensFlag.js`, mirroring `?unleash=v1`/`?lance=v2`):
  a hero A/B where OFF is byte-identical and the gates prove it. `FLARE_SIZE_K` resolves to
  0 when off ⇒ `flarePop === 1`; the threat cache is computed every frame but only *read*
  under the flag; every CSS rule is scoped `.lens2.boss`.
- **Pure read-only query, policy at the caller** (`incomingThreat()`, the `beamContact`
  precedent): the expensive part (which bullet is closest in-lane) rides the existing pool
  walk for free; the reticle decides what to *do* with it.
- **Derived accessor, never a second stored copy** (`bossCharge01()` = `1 - chargeT/chargeDur`):
  can't drift from `model.setCharge`, returns 0 when nothing winds up, no divide-by-zero.

## What it unlocks
- PR2 (planned): break the green channel by saturation split (chrome = pale mint-white,
  energy = full jade) via CSS vars, so green stops meaning both "aim UI" and "player bullet".
- PR3 (owner sign-off): `relockWarmFrac 0→0.4` so dodging stops taxing the lock — the
  attention-economics half of the fix.
- The `readability.mjs` tool could grow a boss-fight capture (reticle over muzzle mid-volley)
  to gate this regression permanently, since `bulletcontrast.mjs` covers WebGL hues only, not
  the CSS chrome.

## Verify
`node tests/boss.mjs` (115) · `wisps.mjs` (15) · `lock.mjs` · `bulletcontrast.mjs` all green
with the flag off (byte-identical) AND the app boots clean under `?debug&lens=2` (0 console
errors, `__dd` up). Pre-existing master failures unrelated to this change: `badges`
(`.shop-grid` timeout), `economy`, `lockdps`, `nightfury`/`organism`/`unifiedhull` (azure
Kindled tri-count baseline drift 2602→4316) — all fail identically on clean master. Human
judges motion/feel on the PR preview: does the yield read as "UI steps back" not "lock lost"?
Do the chevrons make wind-ups pre-attentive without stealing the lock read?
