# BOSS-DESIGN.md — the boss playbook

**Audience: the next session designing a boss.** This file is the distilled output of the
boss arc that shipped Voidmaw and Stormrend (PRs #196, #197, #199 — July 2026): the research,
the laws, the system, the budgets, and the tier ladder for everything that comes next.
Read THIS instead of spelunking the whole ledger — see "Ledger reading list" at the bottom
for the only LEAPFROG lessons that matter here.

---

## 1. The fixed context every boss designs against

- **Camera**: behind-the-player rail. The boss holds ~30m ahead (`CONFIG.BOSS.settleGap`),
  facing the player, seen FRONT-ON for ~95% of the fight. Frontality is the whole canvas:
  width and height matter, depth is nearly invisible. Design the front elevation like an
  emblem (Star Fox / Panzer Dragoon lineage).
- **The sun sits ahead of the player** → boss front faces get NO directional shading.
  Value hierarchy must be PAINTED (2–3 merged material groups at different base colors /
  emissive intensities), never left to lighting.
- **Clean arena**: during a fight nothing else spawns (`main.js` `spawnAhead` gates on
  `game.inBoss`) — the encounter owns the whole frame and most of the frame budget.
- **Bloom + ACES**: bloom threshold is 1.0 in LINEAR light and the composer tone-maps once
  globally. Focal glow points need HDR color overdrive (multiply color to ~2.4) plus
  `toneMapped = false` for the no-postfx fallback path. Anything ≤1.0 reads as matte gray.
- **The world dims for the fight** (`bossGradeTarget` → postfx `_bossMix`): 0.6 from the
  DANGER banner, 1.0 while shielded. Bullets own the visual extremes (render-order LAW:
  nothing draws over a bullet — `CONFIG.BOSS.renderTiers`). Danger color is role-locked
  magenta `0xff2b6a`, never per-boss.

## 2. Budget rules (measured, not inherited — desktop sweep + real-phone verification)

| Axis | Verdict |
|---|---|
| Draw calls | **Not a budget axis.** A real phone held ~58fps at 415 animated draws. Test gate is 34/boss purely to catch runaway part explosions. |
| Triangles | **Effectively free at our scales.** 400k tris ≈ 59fps on-device. The 6,000/boss test ceiling is very conservative — stay under it, but never sacrifice design to save tris. |
| Instancing | **Avoid for animated matrices** — the per-frame `instanceMatrix` upload JANKED a real phone (36.8fps, p95 217ms) vs 58fps for the same load as separate meshes. |
| **Overdraw** | **THE cliff.** 2 large stacked additive/fresnel shells = +50% frame time at 720p, scaling with resolution; the fresnel worst case hit 32fps on-device. **Never wrap a body in an enclosing additive/fresnel shell** (it also destroys the silhouette — reads as a balloon). Cap: ~2 large additive volumes on screen incl. the kit shield; prefer rim-shaped fresnel, backlight discs strictly BEHIND the silhouette plane, and line-based FX (LineSegments are exempt from the cliff). |

Budget-review order for any new part: (1) additive screen coverage? (2) is any sub-1k-tri
opaque part unmerged that trivially could merge? (3) draws/tris last.
To settle any future "can we afford X?": add an axis to `tools/stress.html` and read the HUD
on a real phone (`tools/stress.mjs` for relative curves; headless numbers are rAF-throttled).

## 3. The design laws (violating these failed real review gates)

1. **Silhouette first.** The outline must be describable in ONE sentence and recognizable as
   a solid black fill at 30m. Author FEW hard points — dense outlines read as circles at
   distance. Dominant mass ≥3× secondary forms ≥3× detail.
2. **One focal point = the brightest emissive**, almost always an eye/face, HDR-overdriven.
   Everything else ≤ half its intensity. Weak point = focal point (Zelda grammar).
3. **Three color tiers, dark body**: ~75% near-black desaturated base (identity hue lives in
   EMISSIVE accents, never the diffuse), ~20% identity accent, <5% white-hot focal. Each
   boss owns a 2–3 swatch palette distinct from every other boss at thumbnail size
   (Voidmaw = violet/ember/white, Stormrend = teal/gold/white — pick something else).
4. **Paint the value hierarchy** (see §1 — the sun can't shade the front face). Uniform
   emissive = flat sticker.
5. **Telegraphs change the SILHOUETTE** (jaw hinges open, iris petals flare, rings spin up),
   not just color. Every attack originates from named, visible anatomy.
6. **Symmetry reads as intent, randomness reads as noise.** Author detail in mirrored, named
   placements (relief bands, ridge lines, crown fins); randomness only as sub-0.1-unit
   jitter ON TOP of authored positions. Exactly ONE deliberate asymmetric scar (snapped
   horn, broken vane) — it's the memory hook and the lore gap.
7. **Idle motion at ≥2 frequencies.** A static boss reads as scenery.
8. **Small satellites stay dark** (dim accent emissive ≤0.25) — bright emissive on small
   flat-shaded orbiters reads as pale glitchy debris.
9. **Never animate the root**: `boss.js placeGroup` stomps `group.rotation` every frame and
   `kit.setDissolve` owns `group.scale`. Everything animated lives on an inner `rig`/pivots.

## 4. The shareability system (research-backed — this is the game's bar now)

**Screenshots and fan art run on different machinery.** Screenshots = COMPOSITION (scale,
backlight, safe capture windows). Fan art = CHARACTER (a face with states, drawability,
a name, something to draw it DOING). Decisive precedent: Majora's Mask's moon had no face
until an artist added one — same object, icon created. Two dots + intentional motion is the
anthropomorphism threshold, but the eyes must DO things.

**The charisma ladder** (each rung is cheap and shipped/proven in `bossIdol.js`/`bossMandala.js` —
copy the patterns):
1. Pupils that track the player with LAG + occasional deliberate look-aways (`setGaze` hook;
   snap-tracking reads as a turret, lag reads as a mind).
2. Blinks (rate = personality: the idol blinks casually, Stormrend once per ~10s so each is
   an event). Blink-scale about the socket line, not the rig origin.
3. Pupil constriction = charge tell; dilation = death. (Pupil SIZE is the cute/dreadful
   dial — too big goes googly. On a pulsing eye, pupil z must ride the pulse.)
4. Expression rig: brow bars on pivots — ±0.3 rad = glare/anger/pain/sorrow.
5. Hit flinch (recoil + pain pose): "it can feel" is the empathy switch.
6. The **notice beat** at fight start (`notice()` hook): pupils snap, brows slam, flare.
7. **Emotional death**, not an explosion: sorrow + eyes easing shut + jaw slack; petals
   furling like a flower at dusk. Mournful deaths generate fan art.
8. Name + epithet on a reveal title card (`def.name` + `def.epithet` → `ui.bossTitleCard`),
   FELLED kill card — fans can't rally without a tag; cards caption every shared screenshot.

**Spectacle engineering** (the rail camera GUARANTEES compositions): reveal + phase-transition
attack HOLDS (~1.9s / ~1.6s — players only screenshot when safe; already wired in `boss.js`),
kill slow-mo (existing `game.slowMoTimer` channel), per-boss palette for thumbnail
attribution. Unbuilt-but-researched: composed sun/eclipse reveals, rail-through-negative-space
flybys, victory tableau with auto-capture.

**Scorecard** (score 0–2 each; use it at design review):
F-axis (fan art, /16): doodle-test silhouette · face with ≥3 states · hook feature ·
≤3-color identity · lore gap pointed at in-game · poseability (drawable DOING ≥3 things) ·
cute-or-dreadful polarity · name+epithet shown.
S-axis (screenshot, /12): scale-contrast frame · composed reveal · backlight/celestial
framing · title cards · safe capture windows · thumbnail-attributable grade.
Shipped baselines after the charisma pass: Voidmaw ≈ F 13/16, S 7/12 · Stormrend ≈ F 10/16,
S 9/12. **Every new boss must beat the tier minimums below.**

## 5. THE BOSS TIER LADDER — each tier more grand, memorable, shareable

The roster escalates in spectacle, scale, and character investment. A tier is a CONTRACT of
minimums, not a style: any archetype can live at any tier if it meets the bar.

### Tier 1 — SENTINELS (bosses 1–2: Voidmaw, Stormrend — shipped)
One body, one focal point, one hook, one scar. Full charisma ladder rungs 1–8. Station-keeping
fight (holds `settleGap`, strafes/bobs). ~2.5–3.7k tris. Minimums: F ≥ 10, S ≥ 7.
*The floor every future boss must clear.*

### Tier 2 — COLOSSI (bosses 3–4)
Everything Tier 1 has, PLUS **poseability and arena interplay** — the boss must be drawable
DOING things, and the rail must pass through its negative space at least once:
- **A gesture/limb system** (Master Hand lineage): detached hands that point/clench/slam as
  telegraphs, a segmented tail that coils, wings that mantle. Limbs = fan-art poses.
- **The fight moves**: at least one beat where the boss leaves station — a lateral crossing
  pass, a dive-under, forcing the rail through a ring/arch/between its parts (the
  scale-contrast screenshot in one frame, SotC-style).
- **A composed signature frame**: one scripted moment per fight framed against the sun/sky
  (the eclipse shot) with a hold window on it.
- Phase transitions change the SILHOUETTE (armor sheds, second form unfolds), not just
  attack tables. Budget headroom: use it — up to ~5k tris, draws are free, overdraw law holds.
- Minimums: F ≥ 12, S ≥ 9, plus "can a 12-year-old draw it doing something" = yes.

### Tier 3 — CALAMITIES (boss 5+ / finale)
The game's FACE — the thing that becomes the app icon, the poster, the plush:
- **Persistent presence** (Majora's-moon pattern): visible on the horizon runs BEFORE its
  fight — watching, closer each time. Dread accumulates; the reveal pays off an hour of
  foreshadowing. (This is a levelGen/environment integration, not just a builder.)
- **Multi-stage body**: ≥2 distinct silhouettes across the fight (a mask that cracks open to
  reveal what wears it; a storm that condenses into a god). Each stage passes the one-liner
  test alone.
- **World-scale beats**: the arena itself reacts (sky changes, terrain responds) — the
  screenshot should be impossible to explain without the boss in it.
- **A relationship beat**: something beyond kill-it — it hesitates, it recognizes the dragon,
  a post-defeat echo (companion shard trailing the player = antagonist-to-mascot conversion;
  mascots get the fan art).
- Lore: every Calamity's epithet connects to the Sentinels'/Colossi's lore gaps (who broke
  Voidmaw's horn? point at it, never answer it).
- Minimums: F ≥ 14, S ≥ 11. If it wouldn't make someone screenshot their FIRST encounter
  unprompted, it isn't done.

**Escalation invariants across tiers**: scale up (1.5 → ~2 → sky-dominant), expression range
up, spectacle count up (1 → 2 → 3+ composed moments), lore weight up. Palette, hook, and
silhouette stay UNIQUE per boss — the ladder escalates grandeur, never reuses identity.

## 6. The system — how to build boss N (architecture)

Everything is data + one builder file. `boss.js` (controller) needs ZERO changes for a new boss.

1. **`js/bossDefs.js`**: add a def — `id, name, title, epithet, hpMax, accent, glow,
   bulletColor (usually keep magenta), scale, approachFrom, phases[] (atFrac/cadence/attacks
   from the existing pattern vocabulary), archetype: '<yourArchetype>'`. Append the id to
   `BOSS_ORDER`. A def WITHOUT `archetype` falls back to the legacy construct (coexist rule).
2. **New `js/boss<Name>.js`**: `export function build<Name>(def, quality = 1)`. Compose on
   `createBossCommon(def, quality, { shieldRadius, hpBarY })` from `js/bossKit.js` — it
   provides `group, track(m), setHealth, setHealthBarVisible, setShieldVisible,
   shatterShield, onShieldChange(fn), finalize(), setDissolve, flashBind, flash, tickCommon`.
   Build all parts into an inner `rig` group. **Every material goes through `kit.track()`**
   (the dissolve test traverses everything; `finalize()` dev-warns on strays).
3. **`js/bossModel.js`**: one dispatcher line — `if (def.archetype === '<yourArchetype>')
   return build<Name>(def, quality);`.
4. **Handle contract** (what you return): `{ group, muzzle, orbiters(≥2, tick-animated),
   setDissolve, setCharge, setHealth, setHealthBarVisible, setShieldVisible, shatterShield,
   flash, tick(dt,time), dispose }` plus the optional charisma hooks `setGaze(nx,ny)` and
   `notice()` (controller optional-chains them). Wrap kit methods to layer emotion
   (`setDissolve` → death expression, `flash` → flinch, `setHealth` → damage-state reveal) —
   the wrap-at-the-handle seam needs no bossKit changes.
5. **Name your telegraph pivots** (`jawPivot` / `irisPetal` precedent) — the
   telegraph-silhouette test gate finds them by name.
6. **Quality**: `quality < 0.75` drops part counts (orbiters floor at 2 — test contract).
7. **Merge gotchas** (`mergeGeometries` returns null SILENTLY on mismatch): strip `uv`+`uv2`
   on every part, normalize `toNonIndexed()` (and REASSIGN — it returns a new geometry),
   bake transforms into geometry before merging. Copy the `strip()` helper.
8. **Same commit**: run `node tools/stamp-sw.mjs` (service-worker precache; content-hashed).
9. **Attacks**: reuse the existing pattern vocabulary (`bossDefs.js` header lists them:
   aimed/fan/spiral/tunnel/curtain/movingGap/iris/stream/crossfire/…). Difficulty escalates
   by pattern unlocks + cadence, NEVER raw bullet count (emission-budget test enforces the
   low-tier cap; over-cap walls spawn with unfair holes).

## 7. Verification workflow (all from `reforged/`)

1. `node tests/boss.mjs` — the executable contract: tri ceiling (<6,000), quality scaling
   (q0.5 < q1), archetype dispatch assert, visible-draw gate (≤34), telegraph-silhouette
   gate (setCharge must MOVE geometry), dissolve-to-transparent over every material,
   orbiter/muzzle/lifecycle sims. Extend it with your boss's named-pivot telegraph check.
2. `node tests/bossboot.mjs` — real-engine boot; zero console errors AND zero bossKit
   untracked-material warnings.
3. `node tools/bossshot.mjs` — real-engine captures per biome + charge/shielded states.
   KNOWN FLAKE: headless rAF throttles ~15×, so fight-phase waits can time out and catch the
   APPROACH tilt (mask catches hemisphere light, reads pale) — judge design ONLY on front-on
   fight/charge frames. Zoom crops: render the PNG in a Playwright page with CSS
   transform-scale and screenshot a clip.
4. **Self-critique against §3 laws + §4 scorecard BEFORE presenting.** The shipped bosses took
   5 and 2 capture-iteration rounds; the gates that failed were always: enclosing shell → blob,
   uniform emissive → sticker, sub-1.0-linear glow → dead gray eyes, random scatter → noise.
5. Human judges motion/feel on the PR preview (`?debug&boss=100&bossIdx=N`, `?rush=all`).

## 8. Deferred backlog (researched, unbuilt — good Tier 2/3 starting points)

- Gesture hands for Voidmaw (Master Hand pattern) — poseability retrofit.
- Horizon presence for a Calamity (Majora's-moon pattern) — levelGen integration.
- Post-defeat companion shard (mascot conversion).
- Composed sun/eclipse reveal + victory tableau with optional auto-capture share card.
- Per-boss fullscreen grade tint (thumbnail attribution beyond the accent palette).
- `strip()` helper promotion into bossKit (it's copy-pasted in both builders — do it when a
  third archetype lands).

## 9. Ledger reading list (READ ONLY THESE — the ledger is 470KB and mostly not about bosses)

LEAPFROG.md lessons relevant to boss work, in priority order:
- **L127** — shareability research + charisma layer + the parallel-agent git gotcha.
- **L126** — on-device budget verdict (draws/tris free, instancing janks, overdraw cliff) +
  "carved, not scattered" craft lesson.
- **L125** — the archetype system + the 7 design laws + merge gotchas.
- **L124** — the stress-test instrument (`tools/stress.html`/`stress.mjs`) and how to re-run it.
- **L121** — the render-order LAW (`renderTiers`: nothing draws over a bullet).
- **L112** — boss-as-data, the attack-pattern vocabulary, the emission-budget test.
- **L105** — why dark PBR bodies die in a bloom/ACES world (emissive + rim, and its limits).
- **L89** — the boss overlay architecture (`game.inBoss`, clean arena, bullet pool).
Skim-skip everything else unless it names a system you're touching. When you finish a boss,
append your own lesson (studio rule) and ADD IT to this list.
