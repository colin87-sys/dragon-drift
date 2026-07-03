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

### Tier 2 — COLOSSI (bosses 3–5 — slot map in §5b)
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

### Tier 3 — CALAMITIES (bosses 6–9 — slot map in §5b)
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

*(Edit note, 2026-07: the tier→slot mapping above was re-banded for the full 14-boss roster —
Tier 2 was "3–4", Tier 3 was "boss 5+". The registry below (§5b) is now the authority on which
slot sits in which band, and adds the Tier 4/5 bands. The per-tier CONTRACTS above are
unchanged.)*

## 5b. THE ROSTER REGISTRY (slots 1–14) — the anti-collision map

The game ships **14 bosses**, escalating in difficulty AND grandeur. At this roster size,
distinctness can't be vibes — it's allocated. This registry assigns every slot its identity
axes up front so no two bosses ever collide; a boss session **CLAIMS a slot before designing**
(flip its row to `claimed` in the PR), may not invent an identity outside the map, and any
axis it actually ships differently must update its row in the same PR. Distinctness review =
diff your row's three identity columns (silhouette family / hook / palette+glow-shape) against
all 13 others. When a boss ships, flip its row to `shipped`.

### Roster-scale principles (research-backed, §4-style — sources in the footer)

1. **Cull for verb overlap, not just look overlap** (SotC pruned to 16 colossi so no two
   shared a *defeat method*): every slot owns a distinct interaction verb + pattern-job mix,
   not just a distinct body.
2. **Judge every slot from the actual camera** (SotC concepts were drawn from Wander's view):
   the silhouette one-liner is a black fill at OUR 30m front-on rail view (§1), nothing else.
3. **Anatomy teaches the interaction** (SotC's fur = climbable): the hook feature IS the
   mechanical tell — hands that emit, a lure that aims, a clapper that tolls.
4. **Theme × personality × mid-fight transformation survive large rosters** (Cuphead, ~28
   bosses): silhouette-changing transitions (Tier 2 law) escalate to full body-stage changes
   in the top bands.
5. **Player verbs stay fixed; variety is boss-side; one puzzle read per fight** (Furi: four
   actions, ten bosses): graze / roll-parry / Surge serve all 14; each slot allocates ONE
   puzzle read.
6. **Breathers are part of the curve** (Furi's walks): the difficulty is a **rising
   sawtooth** — peaks at slots 5, 9, 13, summit 14; each band OPENS gentler than the previous
   peak but grander in spectacle. Never monotone.
7. **The entrance is the share moment; build-up multiplies it** (Radahn's meteor + the
   festival around it): every slot gets ONE authored entrance beat; Tier 3+ adds pre-fight
   foreshadowing.
8. **Persistent dread compounds** (Majora's moon: always visible, sky reacts on the final
   day): horizon presence + world-state reaction are assigned to specific top-band slots.
9. **The flagship transplant test** (Monster Hunter: the silhouette must survive out of
   context): a hook that isn't recognizable as an icon/doodle isn't a hook.
10. **Hue runs out around slot 6–8**: palette identity is allocated on FOUR axes — hue,
    VALUE (a near-white boss vs near-black), temperature, and GLOW-SHAPE (points / lines /
    slit / field / corona-ring). Role colours (danger magenta, parry amber, reflected cyan,
    surge pink) stay reserved forever.

### Band structure (difficulty and spectacle both ramp; ≤1 new attack id per band)

| Band | Slots | Contract (cumulative on §5) | hp | cadence floor |
|---|---|---|---|---|
| Tier 1 — SENTINELS | 1–2 | §5 Tier 1 (shipped) | 180–220 | 1.4 |
| Tier 2 — COLOSSI | 3–5 | §5 Tier 2 + one arena-interplay verb each | 260–330 | 1.3 |
| Tier 3 — CALAMITIES | 6–9 | §5 Tier 3 (foreshadowed presence, relationship beats, multi-part bodies) | 360–450 | 1.2 |
| Tier 4 — WORLD-ENDERS | 10–13 | + world-state beats (sky/arena/postfx react), subverted entrances | 480–560 | 1.1 |
| Tier 5 — THE APEX | 14 | multi-stage (≥2 one-liner silhouettes), answers the lore web, post-defeat mascot echo (§8) | ~600 | 1.1 |

Difficulty escalates by pattern unlocks + cadence, never bullet count (§6.9). The ≤1-new-id-
per-band budget bounds test cost: each new pattern pays the whitelist + emission-budget +
safe-lane gates exactly once.

### The slot table (identity axes — no two rows may share silhouette family, hook, or palette swatch/glow-shape)

| # | Working name | Silhouette family | Hook | Palette (hue·value·glow-shape) | Approach | Status |
|---|---|---|---|---|---|---|
| 1 | VOIDMAW | shattered mask | hollow sockets + broken horn/halo | violet·ember·white / points | behind | shipped |
| 2 | STORMREND | concentric rings | unblinking eye + blade rings | teal·gold·white / points+lines | side | shipped |
| 3 | CRAGHOLD | broad bust + detached limbs | two gesture hands | moss·bronze·white / points | behind | shipped |
| 4 | VESPERCOIL | sinuous ribbon | dangled lure-lantern | indigo·pearl / dotted-chain | below (new) | open |
| 5 | EITHERWING | twin bodies | one eye passed between two | oxblood·aged-silver / single point | both sides | open |
| 6 | HOLLOWGATE | architecture with a void | rose-window face | ivory·stained-glass / leaded field (VALUE-INVERTED: near-white) | static-ahead | open |
| 7 | THRUMSWARM | stippled swarm | condenses into YOUR dragon | void-black·star-white / scattered points | condenses | open |
| 8 | BRINEHOLM | bottom-anchored ridge | the surfacing whale-eye | kelp-black·abalone / iridescent sheen | below-horizon | open |
| 9 | KARNVOW | slender vertical duelist | trophy-chain of earlier bosses' scars | tarnished-iron·trophy glints | alongside | open |
| 10 | KNELLGRAVE | hanging pendulum | bound figure as the clapper | patina-copper·candle / vertical slit | pre-heard, fades in | open |
| 11 | WEFTWITCH | radial limbs + threads | visibly re-weaves the arena | moth-grey·rose / taut lines | above (new) | open |
| 12 | ONEWING | lopsided twin (designed echo of 5 — flagged) | twin's frame fused in its chest | ashen-rose·blackened silver | behind, NO warning banner | open |
| 13 | EMBERTIDE | frame-wide band/wave | face surfacing from light | vermilion→rose / full-frame field | the whole horizon | open |
| 14 | THE UNMASKED | eclipse disc → composite figure | wears every prior scar as a wound | black·white / corona ring (RESERVED from slot 1) | always there | open |

### Slot briefs (one paragraph each — the full design happens in that boss's own session)

- **4 — VESPERCOIL, "What the Water Would Not Keep"** (Tier 2). A sky-eel whose ribbon body
  never fully fits the frame; black fill = one S-curve with an angler head. The body IS the
  arena: it coils around the lane and the rail threads its coils (graze-bait made diegetic);
  tail sweeps telegraph lateral hazards; the lure-lantern is the stream/aimed emitter
  (principle 3). Jobs: graze-bait + tunnel/iris fills placed along the coil. Rises from below
  the water/fog line ('below' is a small approach extension). Lore gap: the lure's light is
  not its own — whose is it?
- **5 — EITHERWING, "Two Halves of the Broken Whole"** (Tier 2 peak). The roster's only
  multi-body silhouette: two mirrored dart-wraiths orbiting a shared ember. Crossfire made
  flesh — the twins ARE the ±10 flank emitters, swapping sides in figure-eights (the fight
  never stops moving); the single eye physically hands off between bodies as the charge tell.
  Jobs: anti-flee peak (crossfire/secondWave/movingGap with alternating origins). Oxblood is
  a low-sat dark red — must pass `bulletcontrast` distance from danger magenta. Death splits
  them; one half FLEES (feeds slot 12).
- **6 — HOLLOWGATE, "The Door That Prays"** (Tier 3 opener, spectacle-forward). A floating
  ruined archway; the black fill contains a HOLE of sky — the only rectilinear silhouette.
  The rail flies through the arch repeatedly; curtain/movingGap become descending portcullis
  grids. First horizon-presence boss (visible a full biome early — principle 8); the rose
  window is its face, panes lighting as expressions. Sanctioned §3-law-3 exception: identity
  by VALUE inversion (a near-white boss), eyes still hottest. Lore: a door to where? Its
  bells answer slot 10.
- **7 — THRUMSWARM, "A Thousand That Remember Being One"** (Tier 3). A murmuration that
  condenses into shapes — including a giant copy of the player's own dragon (the meme frame).
  Chip damage only lands while condensed: the condensation rhythm is the puzzle read; the
  shield phase = it becomes a ring around YOU. Identity is pure value + glow-shape (scattered
  star-points), hue near-absent — a faint violet dust ties it to Voidmaw's remains (lore link,
  not a palette claim). Jobs: fill/depth via spiral/spiralStream *as the swarm itself*.
- **8 — BRINEHOLM, "The Island That Breathes"** (Tier 3). Bottom-anchored: only a whale-back
  ridge, fin-sails and one surfacing arena-sized EYE ever break the frame — the SotC
  first-colossus scale read, and the §5 relationship beat: it is SHACKLED, not hostile, and
  hesitates before dying. The fight scrolls along its back; it breaches for the signature
  frame; geyser curtains and rising iris fills come from below. Identity axis = iridescent
  sheen on near-black (distinct from Craghold's mid-value moss). Lore: shackled by the same
  chain-maker as Craghold.
- **9 — KARNVOW, "Wears the Horn It Took"** (Tier 3 peak). The lore-payoff duelist: a
  reaper-thin vertical figure whose lance is Voidmaw's snapped horn, Craghold's severed
  finger on a trophy chain — it attributes by REFERENCE, wearing the other bosses' palettes
  as glints. The first boss that parries YOU: reflected bullets can be batted back once (a
  returned volley = a new read). Duel pacing, tightest Tier 3 cadence, precision jobs
  (aimed/stream/crossfire), almost no fills. It matches your speed alongside, then cuts in.
  Gap: something SENT it.
- **10 — KNELLGRAVE, "It Rings for What It Buried"** (Tier 4 opener). A colossal cracked
  bell hanging from nothing; the clapper is a BOUND FIGURE glimpsed only mid-swing (the
  drawable dread). Sound made visible: each toll emits expanding ring-walls (iris inverted)
  on a readable beat — the puzzle read is RHYTHM; pendulum swings cross the lane. Heard
  tolling a full biome before it is seen (audio foreshadowing). Candle-slit glow through the
  crack = its glow-shape claim. Gap: who is bound as the clapper?
- **11 — WEFTWITCH, "She Mends What You Break"** (Tier 4). Radial limbs working visible
  threads that span the arena (LineSegments — overdraw-free, §2). She RE-WEAVES: safe lanes
  visibly stitch shut between waves (the anti-flee twist), and cutting taut threads via parry
  staggers her. Descends from above on a thread (second new approach). Jobs: movingGap/
  curtain re-expressed as thread-visualised gaps. Lore: the tear in the sky she keeps mending
  is slot 14's entry wound.
- **12 — ONEWING, "The Half That Would Not Die"** (Tier 4). The fled twin from slot 5, grown
  colossal and lopsided — one vast wing, one atrophied; the dead twin's frame fused into its
  chest. The one permitted family echo, flagged in the table as a designed callback. Entrance
  subversion (principle 7): it approaches from behind with NO warning banner — the banner
  fires LATE; the UI itself is the jump-scare share moment. Gimmick: it mirrors your last
  dodge into its next volley (anti-flee apex; reads as learning). Its grief points at the
  Apex.
- **13 — EMBERTIDE, "The Sky Set Loose"** (Tier 4 peak). A frame-wide wall of living sunset
  light with a face that surfaces from it — the only full-frame gradient-field identity.
  World-scale beat: the arena constricts VERTICALLY (ceilings and floors of light) and the
  biome sky shifts a full biome early (postfx grade — the blood-red-sky pattern). Fill apex:
  curtain/iris/movingGap at the fairness-floored cadence. Lore payoff: Stormrend's "unending
  gale" was its LEASH — closes slot 2's gap.
- **14 — THE UNMASKED, "What Wore the Sky as a Mask"** (Tier 5, the Apex). Persistent
  presence from mid-game once seeded: a second sun with a lidded eye on the horizon of
  ordinary runs. Stage 1 silhouette: the eclipse disc (black disc + white corona — the
  corona-ring glow-shape is reserved for it from slot 1 onward). Stage 2: the disc CRACKS
  (it made the masks — the Voidmaw rhyme) and unfolds into a composite figure wearing every
  earlier scar as a trophy-wound: horn, finger, shackle-chains, lure-light, the clapper's
  silhouette — the whole lore web answered in one shareable body. Fights by QUOTING one
  pattern-era per phase (zero new attack ids — the finale is the tested vocabulary at full
  power). Post-defeat: the companion-shard mascot conversion (§8). Leaves exactly one new
  gap for post-game.

### The lore web (gaps and their claimants — point, never answer early)

Craghold's severed finger + broken shackles → claimed by 8 (same chain-maker) and 9 (wears
the finger). Voidmaw's broken horn → 9's lance. Stormrend's "unending gale" → 13's leash.
5's fled twin → becomes 12. 11's mended tear → 14's entry wound. 4's borrowed lure-light,
10's bound clapper, 9's sender → open threads for 14 and post-game.

**Progression note (deferred)**: `bossDefForIndex`'s modulo-cycling is fine through Tier 2;
this band structure is what eventually replaces it (encounter N → band-appropriate slot,
rush = ladder order). A future controller task — no code in the current arc.

Sources: SotC roster cull + player-view concepting (Wikipedia: Shadow of the Colossus;
Game Developer, "16 Colossi, 16 Shots"; The Rotting Cartridge design analysis) · Cuphead
boss-variety axes (Nintendo247 aesthetics/boss design; Epilogue Gaming, "Cuphead and Expert
Boss Design"; TheGamer character-design ranking) · Furi verb economy + pacing (Kokutech
design-pattern analysis; VGChartz, "Furi Takes Titan Souls to its Extreme") · Radahn
entrance-as-spectacle (DualShockers; Source Gaming "Big Baddies Breakdown") · Majora's moon
persistent dread (Zelda Wiki: Moon) · Monster Hunter flagship silhouette discipline (Capcom
MH Rise dev interviews; Vice, "The Developers of Monster Hunter Explain What It's Like to
Build Monsters").

## 6. The system — how to build boss N (architecture)

Everything is data + one builder file. `boss.js` (controller) needs ZERO changes for a new boss.

0. **Claim your slot in the §5b registry first** (row → `claimed`); design inside its
   allocated axes; flip the row to `shipped` (recording any axis that changed) in the same PR
   that ships the boss.
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
- ~~`strip()` helper promotion into bossKit~~ — DONE with the third archetype (CRAGHOLD):
  `bossKit.js#stripForMerge`, both older builders re-import it.

## 9. Ledger reading list (READ ONLY THESE — the ledger is 470KB and mostly not about bosses)

LEAPFROG.md lessons relevant to boss work, in priority order:
- **L129** — CRAGHOLD (boss 3, first Tier 2 Colossus): the gesture-hand limb system, the
  def-gated setpiece seam, flash-bind luminance, and the draw-budget reality at 3 bosses.
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
append your own lesson (studio rule), ADD IT to this list, and update your §5b registry row.
