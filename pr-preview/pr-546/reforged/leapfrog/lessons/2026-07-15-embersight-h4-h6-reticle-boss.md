# EMBERSIGHT H4–H6 shipped: the LURE, the MEWS PLATE, world echoes + the settings matrix

**What we did.** HUD-REDESIGN.md increments H4–H6, finishing the EMBERSIGHT
flight-HUD redesign (H1–H3 were the state machine + Bell, Tape/Tally, the
Gauntlet). **H4 — the LURE:** the lens2 hollow-bracket becomes THE reticle for
EVERY state — the `.rsq` outer square is masked to four corner brackets and the
`.inner` nested square retired, so cruise ring/gate, acquire→lock, and boss all
read as ONE bracket instrument (no more cyan ring + gate diamonds + magenta
brackets at once). Hue roles kept (gold rings / cyan gates / steel→mint boss),
2px hairline, dual-stroke keyline carried on a `filter: drop-shadow` (the mask
clips box-shadow). Cruise lock shrink-snaps 1.0→0.85 (eased in JS), fires the
shipped `.rsnap` ring + a solid `uiSound.lock()` tone, soft `search()` tick while
lining up. **H5 — the MEWS PLATE:** new `js/bossBar.js` on the existing
`emit('bossHit',{hp,hpMax,frac})` seam; bottom-centre, hairline housing that
etches in stroke-by-stroke synced to the title card, magenta fill via
`transform:scaleX` + drain-lag gold chunk, phase notches from `def.phases[].atFrac`,
a nameplate rhyming the title card, re-forge shimmer for `formLifebars`, off-screen
threat chevrons, DLZ column behind `?dlz=1`. **H6 —** ember swallow (coreGlow tick),
PB light-seam (DOM horizon fallback), overtake trail flash, skyLuma bright-biome
keyline swap, and **the §F settings matrix** (per-element ALWAYS/DYNAMIC/OFF).

**What we learned.**
- **Retire the ornament, keep the information.** The spec said "retire the WebGL
  ring glow," but that ring is a THREE-job mesh: an idle cyan framing hoop (pure
  ornament), the Dragon-Surge DRAIN METER (pink, time-left), and the FOCUS-hold
  warm (jade). Only the idle hoop is the third-ornament clutter the LURE collapses;
  the other two carry reads the DOM doesn't duplicate. The fix was surgical — zero
  ONLY the idle opacity (`0.32 → focusVis*…`), leave surge + focus intact. Geometry
  unchanged, so tricount is identical; the collapse is visual, not structural.
- **The bottom-centre band is already full — go ABOVE the gauntlet.** The gauntlet
  sits at `top:64%` and spans ~bottom 30–42% with its horns; `.boss-note` is at 28%,
  the title card at 34%. There is NO clean slot between 28% and 42%. The Mews plate's
  only conflict-free home is ABOVE the gauntlet (~bottom 45% landscape / 40% portrait);
  "above `.boss-note`'s band" resolves upward, not into the crowded 30s. Verified in
  captures (DOM composes even under `--static`; only the canvas blanks).
- **Ease the lock-snap in JS, never a CSS transition on the projected node.** The
  reticle's `transform` is rewritten every frame (translate + distance-scale), so a
  `transition: transform` on `#reticle` would lag ALL projection (the compositor-
  starvation trap from H1–H3, worse). Ease a scalar (`cruiseLockScale`) toward the
  target with a fixed per-frame factor and multiply it into the transform — same idiom
  as the shipped `yieldAmt`. The bracket ROTATE animation lives on `.rsq`; scale on
  `#reticle`; they never fight over `transform`.
- **`setHealth` is an API, not just a bar.** Retiring the over-model HP sliver couldn't
  just delete the bar — several boss models wire `kit.setHealth` and drive their OWN
  damage visuals (Knellgrave's crack gapes off the frac) off it, and the reveal fill-up
  ramps call it. Keep the mesh + the function (fill mesh `visible=false`), swap the wide
  bar for a small locator pip. `boss.mjs`'s tris/draws budget gate only *decreases*, so
  it stays green.
- **New emits beat enriching old ones for TIMING.** The plate must etch in ON the title
  card, but `bossStart` fires during the approach (too early). A one-line
  `emit('bossReveal')` at `enterFight` (next to `ui.bossTitleCard`) is cleaner than
  threading reveal-timing through `bossStart`'s payload; `bossFormRefill` likewise gives
  the re-forge shimmer its own honest beat.
- **The settings matrix wants ONE API surface: body classes.** §F says JS never sets
  styles. hudState maps `saveData.settings.hudElements[key]` → `hud-<key>-off` /
  `-always` body classes (cached, ~free per tick); CSS owns hide/pin + the safety floor
  (`.hud-life-off.hud-critical` out-specifies `.hud-life-off`, both `!important`, so a
  last heart always wins). `deepMerge` over DEFAULTS' keys fills the nested `hudElements`
  for old saves automatically — no migration body.

**The gotchas worth remembering.**
- **`?dlz=1` and `?lens` A/B are load-time flags** — parse once (`/[?&]dlz=1/`), never
  render the DLZ column without it (owner: "cut-first luxury").
- **The wingbeat garnish clock is exposed (`wingbeatPhase()`) but NOT wired** — quantizing
  the ghost-breath would mean editing the protected H1–H3 rest rules; the clause says
  skip rather than disturb. The clock is now cheap for a future pass.
- **PB seam is the DOM horizon fallback**, not the in-world billboard (the sanctioned
  cut); it fires once per run at `player.dist >= game.bestDistance`.

**What it unlocks.** EMBERSIGHT's DOM layer is complete: one reticle instrument, a DOM
boss bar on the shipped seam, world echoes, and the full per-element player contract.
H7–H9 (the flagged living-dragon channels) build on: the `wingbeatPhase()` clock, the
`coreGlow` swallow write (a proven cheap coreGlow hook), the per-dragon trail-tint seam
(overtake gold flash), and the settings-matrix pattern (add `?vitals` as another row).

**Still needs live-fight human eyes (risk #2/#3):** the Mews plate's `formLifebars`
re-forge shimmer, the FELLED/revive beats (ONEWING's lying card), and the exact plate Y
vs a tall two-line `.boss-note` — all judged on the PR preview, per the "screenshots
verify layout; only the human verifies composition" law.
