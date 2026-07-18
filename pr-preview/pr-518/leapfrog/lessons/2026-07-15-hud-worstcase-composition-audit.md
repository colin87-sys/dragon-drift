# The worst-case composition audit: force the busiest moment, measure ink, not boxes

**What we did.** The owner flew a real MARROWCOIL fight in portrait and the boss bar +
its epithet ("WHAT THE SKY COULD NOT DIGEST") ran straight into the top-right Tally —
the bar's right cap clipped the SKIMS chip, the epithet struck through the CHAIN chip.
Instead of nudging that one collision, we built a forced worst-case scene (boss +
longest epithet + 5-digit score + embers + 8-chain + 23 skims + live multiplier +
"REFLECT ANYTHING" telegraph + Bell toast + spell card + 1 heart + full surge) in BOTH
orientations via the `tests/browser.mjs` boot + `__dd` seams, screenshotted it, and had
the same script compute pairwise rect overlaps, Law-3 proximity, and thumb-zone
intrusions programmatically.

**What we found (and fixed).**
1. *Portrait:* plate nameplate (inline nowrap name+epithet) overflowed the plate and hit
   the CHAIN chip; the 84vw bar passed under the SKIMS chip. → Nameplate now **stacks**
   (name over epithet, like the protected title card — better rhyme anyway), each line
   centered + ellipsis safety; the plate slots **below the Tally's worst-case four-row
   depth** (top 72px → 112px). A full-width bar below the column is structurally immune
   to any score width or chip count — beats shaving vw off the bar to dodge a moving
   target.
2. *Both:* the `.boss-note` telegraph was bottom-anchored at 28% and **grew upward**,
   painting "REFLECT ANYTHING" across the gauntlet's ×N.NN multiplier (portrait) and —
   at `5.6vw` ≈ 40px on a landscape phone — across the entire gauntlet cluster. →
   Top-anchored below the multiplier (landscape 77%, portrait 70.5%) and sized in
   **vmin** so the telegraph is the same physical size in both orientations.
3. *Landscape:* the spell card (bottom 15% on a 390px-tall frame) crossed the new
   telegraph lane. → landscape bottom 24% (still lower-right); portrait keeps 15%.
4. *Short landscape (≤430px):* the Bell lane at 15% rang toasts straight through the
   plate nameplate. → `body.hud-boss .bell { top: 120px }` — below the bar.

**The gotchas.**
- **Centered nowrap text lies to getBoundingClientRect** — a `text-align:center` block
  spans its container even when the ink is narrower, and an inline nowrap row overflows
  it. Measure the INK with `Range.selectNodeContents(el).getBoundingClientRect()` or
  you get both false positives and false negatives.
- **Bottom-anchored text boxes grow UP** — an "it sits at bottom 28%" element with
  variable content is a collision generator against anything above it. Anchor ephemeral
  text lanes at their TOP edge, just below the furniture they must clear.
- **`vw`-sized text is a landscape skyscraper.** Any HUD font clamped on `vw` doubles
  physically when the phone rotates. Use `vmin` for anything that must coexist with a
  fixed band.
- Headless: CSS transitions can start ~0.5–1s late under WebGL load — a toast that "never
  showed" in a screenshot may just be pre-transition. Poll computed opacity before
  concluding a rule is broken.

**The reusable pattern.** A worst-case audit script = boot → `spawnBoss` →
`bossForceFight` → set `game.health/score/consecutiveRings/grazesRun/combo` → fire
`ui.bossNote` + `ui.bell` + `ui.bossCard` → screenshot + programmatic overlap sweep
(rects, ink-ranges, Law-3 radius, thumb zone) → READ the PNG. Run it per orientation
and per longest-content def (`?bossIdx=6` THRUMSWARM has the longest epithet, 34ch).
Fix geometry until the overlap list is empty, then keep the numbers in the spec.

**What it unlocks.** Any future HUD element gets judged against the same forced-density
scene instead of the calm demo frame; §C of HUD-REDESIGN.md now carries the exact band
map (Tally worst depth 105px, plate 112px, note 70.5%/77%, card 15%/24%) so the next
session can place chrome by arithmetic, not vibes.
