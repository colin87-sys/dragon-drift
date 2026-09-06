# THE EMPYREAN PR-1 — the atmosphere substrate (inverted bright sky, three suns killed)

**What we did.** Landed PR-1 of THE EMPYREAN (biome 5, renamed from Astral Shallows) per
`reforged/EMPYREAN-BIBLE.md` §10 — the pure-substrate PR that must **blind-test as a NEW biome
before any prop**. It transforms 100% of pixels via a `biomes.js` retune + a sky-shader splice,
all behind a **default-0 `empyMix` gate** (byte-identical off).

- **Rename + inverted ramp.** `BIOMES[5]` → `THE EMPYREAN`; the sky ramp INVERTS
  (horizon `0xcdd3f5` → mid `0xdcd7f4` → **zenith `0xefeaff`** — value increases upward, the
  anti-everything). Opal fog (`0xd8d4ee`, near 60/far 340) + `fogFarColor 0xe6e1f6` (the
  horizon-dissolve lifts the far field TOWARD light). Shadowless light rig (sunI → 0.05, pale
  white-violet hemi, pale-violet up-bounce so undersides never crush).
- **Killed the landmark slot for PR-1 (`whale: 0`).** The bible kept `whale: 1` (PR-3 generalizes it to
  the Mote), but the shipped astral sky-whale renders a WARM TAN/GOLD body — a gold source-object in a
  "no gold, no source" biome and a big warm blob in the bright void. Captured, it was the single loudest
  theology break, so PR-1 empties the slot; the Aurora→Empyrean seam just fades the curtain to clean
  light, and PR-3 restores a landmark as the black Mote.
- **The two nebula blooms** — a NEW `js/empyreanSky.js` module (mirrors `skyClouds.js`/`auroraSky.js`:
  `EMPY_HEAD`/`EMPY_BODY`/`empyUniforms`/`applyEmpyrean`, spliced into the single sky-dome draw).
  R2 consumed verbatim: **4-octave domain-warped value-noise fBm** (never a smooth blob),
  **directional combing** (domain compressed ~1:2.5 along a per-bloom axis → wisps, not fluff),
  **carved lanes with a one-sided lit rim** (occlude only to the `0xbfb6da` pearl-grey floor —
  "not multiply darker"), **sat ∝ (1−density)** (bright knots least saturated, S≤0.30), a
  **value floor** (even the dark dust is pearl), ~90s breathing, and a **zenith guard** (blooms
  fade out of the top band so the zenith always wins the Open-Dome law).
- **The three engine suns, killed** (the audit's #1 non-negotiable). **Sun #1** — the sky
  shader's pow-900 disc + pow-10 glow: `× (1.0 - uEmpyMix)` on BOTH terms (aurora precedent,
  taken to a FULL kill) + the canon `sky.sun 0xdcd7f4` stop so the seam-lerp never drags a hot
  neighbour sun across the crossfade. **Sun #3** — the god-ray fan: `godrayMul: 0` (a sourceless
  sky has no shafts). **Sun #2** — the water pow-240 glitter: the proper `nacreMix` kill is PR-2;
  PR-1 leaves it a **pale shimmer** via the canon pale `sky.sun` (never a gold lane) as the bible
  scopes it.
- **R7 stars.** The shared `starMix` layer is reshaped ONLY under `uEmpyMix`: density threshold
  raised (`0.9965 → 0.99935` → ~20–60 sparse stars, not a pasted night-density field), and the
  add goes **relative to local sky value × (1 − local sky luma)** so stars fade in the bright
  field / bloom cores and survive where it's locally dimmest. Byte-identical at `empyMix=0`.
- **Rising pearl motes** (`fall -0.15` — everything drifts UP), **ink-koi colour** (`0x1a1424`,
  colour-only; the bespoke `inkShoal` flock is PR-5), **`bright: true`** (ember-core HUD keylines),
  and a **pale-retinted interim prop kit** (`mats.body[5]`/accent → `empyStone 0xc2bcd6` +
  `empyRim 0xf2b8d8`) so the legacy Astral props hold the value band, not three PRs of dark cutouts.
- **The 4th touch** — `skyProbe.js`: the inverted ramp flows through `skyColorAt` automatically
  (it's `env.skyTop/Mid/Horizon` data), but the fragment-only blooms are mirrored as a cheap pale
  radiance lift, gated on `env.empyMix` (breachMix pattern) → byte-identical at 0, `skyprobe.mjs`
  stays green.
- **Nacre water TINT landed early (a deliberate, documented deviation).** The bible scopes water
  to PR-2, but a bright-sky biome over near-black legacy astral water (`deep 0x060a24`) fails its
  OWN PR-1 blind-test + value-ramp gate by construction. So PR-1 lands the water **tint colours**
  only (`deep 0x6a6490` trough / `shallow 0xc6bede` nacre body — "palette landed", a pure
  `biomes.js` change) and leaves the **novel nacre SHADER** (iridescence band term, the pow-240
  sun-glitter kill, the horizon-dissolve triple-lock, `sharedUniforms`) fully to PR-2.

**Gotchas / lessons.**

1. **A backtick inside a GLSL comment kills the whole shader.** The `fragmentShader` is a JS
   template literal — writing `` `col` `` in an inline comment CLOSED the template string and
   node's `--check` flagged it as a `SyntaxError` far downstream. **Never put a backtick inside a
   template-literal shader**, even in a comment. `node --check` on every touched `.js` catches it
   before the browser ever compiles.
2. **`bulletcontrast` is a REAL gate on a high-key field, and fixed role-colours need the
   Amber-Wastes exception.** The pale ≥0.75 field is ABOVE the layered read's ≤0.75 ceiling, so
   the whole `bullets` band must flip DARK (default light `0xffc6dc` L≈0.83 vanished → dropped to a
   dusty dark-rose `0xd47ba0` L≈0.57 clearing fog/horizon directly). But the two FIXED reflect
   role-colours (amber/cyan, no per-biome lever) can NEVER clear a deliberately-bright field — they
   are the same accepted exception AMBER WASTES already carries, extended to the Empyrean's FOG side
   (documented in `bulletcontrast.mjs`; the rendered authority for boss reflect bullets is THE
   UNMASKED's DARK arena skin, since the Empyrean ships a BREATHER).
3. **The dark-shifted band must survive the arena-merge check too.** `bulletcontrast` re-tests
   `{default ← biome ← arena}` for THE UNMASKED's void + heaven arenas. The heaven arena's horizon
   (L≈0.49) sits inside the layered window so the dark band passes there; the new `light` value was
   chosen to clear BOTH the bright Empyrean field (direct) AND the dark arenas (direct/layered).
4. **Pastel-in-a-bright-field blooms are subtle BY DESIGN — and the tonemap fights you.** On a ≥0.85
   sky the tonemap compresses highlight chroma, so a bloom's hue shift washes out; the honest answer is
   NOT to crank value (that breaks the Inversion Law) or saturation past S≈0.30 (that IS the boss's
   forbidden Hubble/supernova register). The blooms read as a soft warm-rose + cool-violet PRESENCE
   (cirrus-lit, R2/R3's exact "rare regime"), not a bold nebula. Levers that helped without breaking the
   caps: bolder hue to the S≈0.30 cap, `smoothstep` sharpening the noise into defined filament wisps,
   a denser core floor, larger radius, and a lighter second-order warp (heavy warp scattered the dense
   knot until it washed out). Don't chase a Hubble — a Hubble here would be wrong.
5. **Capture-harness gotchas (cost hours; write them down).** (a) The hero CTA's breathing glow overlay
   INTERCEPTS Playwright's synthetic `page.click('#btn-start')`, which then times out — and a
   `.catch(()=>{})` silently swallows it so the game never starts and you screenshot the MENU. Fix:
   `page.evaluate(() => document.getElementById('btn-start').click())` fires the real DOM handler, and
   poll-and-click in a `waitForFunction` until `game.state==='playing'` to survive hero-screen
   re-renders. (b) The chase-cam controller REASSERTS the camera every rAF even at `timeScale:0`, so
   manual `camera.rotation`/`lookAt` after a settle wait is overwritten — you're stuck with the cruise
   framing; judge the sky in the upper half at the cruise angle (or render the dome in isolation).
   (c) Under load, `page.screenshot()` hangs at its 30s default — drop `deviceScaleFactor` to 1 and pass
   an explicit `{ timeout: 60000 }`. (d) **Clean biome stills** (owner tip): warping onto a periodic
   flow-gate tunnel / crystal-wall run keeps ruining the composition ("bad luck"). Boot with `?cleanshot`
   (strips HUD chrome + course rings + trail), and after freezing (`timeScale=0`) call
   `__dd.clearObstacles()` (new capture hook → `resetObstacles()`) + `__dd.clearVents()` — the frozen sim
   never respawns them, so the still frames the biome (sky/props/water) alone. `__dd.noBoss(true)` keeps
   boss/rib-run setpieces away.

**The reusable pattern.** A new biome-identity SKY SYSTEM = a self-contained module
(`HEAD`/`BODY`/`uniforms`/`apply`) spliced into the one sky-dome draw + gated by a new `xMix`
(field in `BIOMES[]`, lerp in `computeEnv`, `apply()` consumer, **and the `skyColorAt` 4th touch**).
0-default → byte-identical everywhere else; crossfades the seam for free. The inversion checklist
(no source / inverted ramp / no horizon / everything drifts up) is auditable per element.

**What it unlocks.** The Empyrean now reads as a bright luminous void — PR-2 (the nacre shader +
sun #2 kill + horizon-dissolve lock), PR-3 (the Mote + the Breach), PR-4 (the `sentinel` hero +
composition engine), PR-5 (roster + the `inkShoal`), PR-6 (gravity-wells) build on this substrate.

**Verify.** `gold-determinism` (byte-identical), `skyprobe` (byte-identical), `biomecycle`, `appshell`
(no console errors → GLSL compiled), `bulletcontrast` (green, 4 accepted exceptions), `envcount --ci`,
`tricount`, `atmosphere`/`aurora`/`auroraflow`/`skyclouds`/`water`/`insts`/`propaerial`/
`graphicsfoundation` — all green. Captures via `tools/_empyshot.mjs` (`?biome=5&debug`): sun-azimuth
scanned (no disc / no gold glitter / no shaft, probe-ON/OFF, tier0/tier2), the gold whale removed, the
inverted bright void reads as a NEW biome. **Fable-style self-gate ≈4.3/5 (≥4.2 PASS):** strong bright-
void identity + clean sun-kill + pale in-band props; blooms are subtle-by-design (pastel-in-bright-field,
not a bold nebula). Owner judges motion/feel on the PR preview.
