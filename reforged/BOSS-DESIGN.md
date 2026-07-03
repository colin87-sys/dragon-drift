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
| 3 | ASHTALON | winged pursuer (scythe-wing raptor) | never holds station — it hunts you | charcoal·ember / one molten SLIT | behind, overtakes | open (replaces retired CRAGHOLD¹) |
| 4 | MARROWCOIL | segmented skeleton (bone dragon) | fly-through ribcage + skull lure | bone-white·void·ice-blue / dotted-chain + pinpoints | below (new) | open (absorbs VESPERCOIL²) |
| 5 | EITHERWING | twin bodies | one eye passed between two | oxblood·aged-silver / single point | both sides | open |
| 6 | HOLLOWGATE | architecture with a void | rose-window face | ivory·stained-glass / leaded field (VALUE-INVERTED: near-white) | static-ahead | open |
| 7 | THRUMSWARM | stippled swarm | condenses into YOUR dragon | void-black·star-white / scattered points | condenses | open |
| 8 | BRINEHOLM | bottom-anchored ridge | the surfacing whale-eye | kelp-black·abalone / iridescent sheen | below-horizon | open |
| 9 | KARNVOW | slender vertical duelist | trophy-chain of earlier bosses' scars | tarnished-iron·trophy glints | alongside | open |
| 10 | KNELLGRAVE | hanging pendulum | bound figure as the clapper | patina-copper·candle / vertical slit | pre-heard, fades in | open |
| 11 | WEFTWITCH | radial limbs + threads | visibly re-weaves the arena | moth-grey·rose / taut lines | above (new) | open |
| 12 | ONEWING | lopsided twin (designed echo of 5 — flagged) | twin's frame fused in its chest | ashen-rose·blackened silver | behind, NO warning banner | open |
| 13 | EMBERTIDE | frame-wide band/wave | face surfacing from light | vermilion→rose / full-frame field | the whole horizon | open |
| 14 | THE UNMASKED | eclipse disc → wheels-within-wheels angel | the second sun cracks into an Ophanim: rings of tracking eyes, six scythe-wings, every prior scar worn as a relic | black·dark-gold·white / corona ring + eye-points (corona RESERVED from slot 1) | always there | open |

¹ CRAGHOLD (broad bust → palm-eyed hands, moss·bronze) shipped at slot 3 and was RETIRED by
user verdict after two rebuilds — the concept never escaped "Voidmaw with hands" (LEAPFROG
L130). It stays in `BOSS_ORDER` only until ASHTALON ships in its slot; its geometry lessons
(finger chains, socket pools, tell-family poses) are inherited by ASHTALON/EITHERWING/KARNVOW.
² VESPERCOIL's coil-the-lane verb, below-approach, and lure-lantern all transfer to
MARROWCOIL; the eel skin is retired for the stronger bone-dragon identity (user directive).

### Slot briefs (one paragraph each — the full design happens in that boss's own session)

- **3 — ASHTALON, "the Ember Hunter"** (Tier 2 opener). The first boss that does not wait
  for you: a charcoal raptor of two vast scythe-wings that overtakes from behind, banks wide,
  and circles the lane between diving passes. No round eyes — one horizontal molten VISOR
  SLIT in a dark cowl (nothing like slot 1's socket-pair or slot 2's orb). Wing poses ARE the
  telegraphs: mantle-fold = tracking stream incoming along its dive line, full flare = fan.
  Scar: one snapped wingtip blade, still smoldering (KARNVOW later wears it). Mechanical
  star (SOP): closing + cadence — fast but sparse. Lore gap: what is it hunting FOR?
- **4 — MARROWCOIL, "What the Sky Could Not Digest"** (Tier 2). The bone dragon: a low-poly
  skull (box cranium, tapered snout, hinged jaw, twin horn-tubes) with cold pinlight eyes
  and a lure-light hung between the horns; behind it, sixteen vertebrae coiling on a
  traveling sine — and a mid-body RIBCAGE the rail flies straight through. The body IS the
  arena: ring/iris fills emit as expanding bone-white rings off the coil circles, tail
  sweeps telegraph lateral hazards, graze-bait beads the spine (all of VESPERCOIL's verbs,
  stronger skin). Rises from below the fog line ('below' approach extension). VALUE claim:
  the pale-bodied serpent (bone on void). Lore gap: whose skeleton?
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
- **14 — THE UNMASKED, "What Wore the Sky as a Mask"** (Tier 5, the Apex — the game's
  biblically accurate angel). Persistent presence from mid-game once seeded: a SECOND SUN
  with a lidded eye on the horizon of ordinary runs. Stage 1 silhouette: the eclipse disc
  (black disc + white corona — the corona-ring glow-shape is reserved for it from slot 1
  onward). Stage 2: the disc CRACKS (it made the masks — the Voidmaw rhyme) and unfolds
  into an OPHANIM — three concentric counter-rotating wheels, gimbal-tilted on different
  axes (wheels within wheels), every wheel studded with independent white eyes that ALL
  track you on their own lag; six scythe-wings (slot 3's blade-fan anatomy at doubled
  scale) unfolding pair by pair; every earlier scar worn as a relic wired to its rails —
  horn, snapped feather-blade, chain link, thread spool, bell shard. Stage 3: the wings
  mantle open and the veiled core unveils. Fights by QUOTING one pattern-era per stage
  (zero new attack ids — the finale is the tested vocabulary at full power). The reveal
  hold where every eye on every wheel snaps to the player at once is the screenshot of the
  game. Post-defeat: the companion-shard mascot conversion (§8). Leaves exactly one new
  gap for post-game.

### The lore web (gaps and their claimants — point, never answer early)

Voidmaw's broken horn → 9's lance. Ashtalon's snapped wingtip feather-blade → 9's trophy
chain. Stormrend's "unending gale" → 13's leash. 8's broken shackles → the unseen
chain-maker (open thread). 5's fled twin → becomes 12. 11's mended tear → 14's entry wound.
4's skeleton (whose?), 4's borrowed lure-light, 10's bound clapper, 9's sender → open
threads for 14 and post-game.

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

## 5c. BAND EXPERIENCE CONTRACTS — what the PLAYER feels change (not just visuals)

Each band adds a new *category* of experience the previous band never did — this is the
reason to keep playing, encounter after encounter:

- **SENTINELS — "a duel."** The boss holds station ahead; you exchange fire. (Shipped.)
- **COLOSSI — "the fight moves."** The boss leaves station: dive passes, side orbits,
  crossing the lane while firing; the rail threads its negative space (a ribcage, between
  wings); the arena reacts to its body. First-time feeling: *it isn't waiting for me.*
- **CALAMITIES — "the fight is a scene."** Multi-part bodies (a swarm, twin bodies, a whale
  you scroll along), formations-as-telegraphs, relationship beats (BRINEHOLM hesitates;
  EITHERWING's survivor flees), new arrival directions (below the fog, condensing from
  dust, both flanks at once). Feeling: *bosses stopped being one thing in front of me.*
- **WORLD-ENDERS — "the lane breaks."** Attacks originate OFF-lane (threads from above,
  pendulum sweeps across, a tide that IS the horizon); the world-state reacts (sky grade
  shifts a biome early, vertical constriction, audio foreshadowing); entrances are
  subverted (heard before seen; NO warning banner; already there when the banner fires).
  Feeling: *the fight stopped respecting the rules the game taught me.*
- **THE APEX — "it owns the game."** A second sun with a lidded eye rides ordinary runs
  from mid-game; the finale is flying INTO its sky; multi-stage body; quotes every earlier
  pattern era; answers the lore web; leaves a companion-shard echo. Feeling: *the thing
  that was always watching finally turned around.*

Retention loop: each band's opener is spectacle-forward and gentler than the previous
band's peak (the sawtooth); the NEXT band is foreshadowed one biome early (horizon glints,
audio, sky grade) so the player always has a visible "what is THAT?" ahead of their wall.

## 5d. BUILD SHEETS (low-poly translation per open slot — primitives, palette, budget, reuse)

**A registry row without a build sheet is not claimable.** These are the concrete
translations — a builder session starts from its sheet, not from the brief's prose.
(All tri counts @q1 pre-`def.scale`; every sheet obeys §2/§3; camera envelope law from the
feasibility survey: at rel 30, on-screen centers within x ±15 / y 2..22 on portrait — push
`rel` to 50–60 for wide lateral action instead of parking wide at 30.)

- **3 ASHTALON** — prow: flattened stretched octahedron (~3 long); cowl band: dark box arc
  wrapping the prow face; VISOR SLIT: thin recessed box, HDR white-orange ×2.4,
  toneMapped=false; wings: 2 shoulder pivots × 6 tapered flat scythe-blades each (extruded
  triangles, lengths 2.5→4.2, baked fan ±0.5 rad), span ~14; wing-root ember-crack
  LineSegments; 3 dark cinder-chip trailers (orbiter contract). Poses on the wing pivots:
  mantle (fold up-forward) / flare (spread) / dive-tuck. Scar: outermost left blade snapped
  at half length, ember tip. Charcoal 0x121012 base ei 0.02 / ember 0xff6a30 accents ei
  ≤0.2 / slit hottest. ~1.8k tris, ~14 draws. REUSES: tell-family pose machine + setpiece
  paths (craghold's), HDR idiom, kit. NEEDS: moving-station branch (§5e).
- **4 MARROWCOIL** — skull: box cranium 1.6w + tapered snout box + jawPivot jaw slab + 2
  curved horn tubes (TubeGeometry taper, the idol's horn kernel); eye pinlights: 2 small
  HDR ice-blue spheres recessed in dark socket boxes; lure: HDR teardrop on a LineSegments
  strand between horns (focal). Spine: 16 octahedron vertebrae (r 0.5→0.25 taper) each
  with 2 short torus-arc rib stubs, positioned each frame along a CatmullRom whose control
  points run a traveling sine (coil sweep); RIBCAGE: 5 pairs of long torus arcs (r 2.6,
  arc π·0.6) mid-chain forming the fly-through tunnel; tail blade: flat kite. Bone
  0xd8d2c0 diffuse (sanctioned VALUE inversion, dark joints paint the hierarchy) / void
  gaps / ice-blue 0x8fd0ff lights. ~3.5k tris, ~24 draws (vertebra chain = separate small
  meshes — phone-verified fine; NO InstancedMesh, L126). REUSES: mandala rail-merge idiom,
  charisma eye rig, jawPivot precedent. NEEDS: below-approach + cull-bound widening (§5e).
- **5 EITHERWING** — per twin: stretched-octahedron kite body (~2.2 long) + crescent head
  fin (flat arc extrude) + 2 ribbon tails (4 flat tapered boxes on lagged pivots); THE EYE:
  one HDR orb that detaches and glides between bodies on a LineSegments bead-thread (the
  charge tell: whoever holds the eye fires next). Figure-eight orbits (moving-station
  branch) around a drifting center; crossfire's existing ±10 emitters = their fire points.
  ONE shared hp pool + one bar (zero hit-model work — the craghold precedent); shield
  wraps whichever body holds the eye. Oxblood 0x2a1114 + aged-silver rims; eyeless twin
  always darker. ~2×900 tris. REUSES: everything; NEEDS: nothing structural.
- **6 HOLLOWGATE** — 2 jagged pillars (stacked offset boxes, 5 per pillar) + broken lintel
  arc (4 box segments, one missing = the scar) + floating masonry chips; ROSE WINDOW in
  the lintel: 8 wedge panes (cone-slice extrudes) round a hub — panes light individually
  (expression rig: which panes glow = the face's mood); portcullis: 6 box bars descending
  as the wall volleys. VALUE-INVERTED near-white ivory 0xd8d0c2 + dark edge cage
  (EdgesGeometry) + stained-glass emissive inside the window only. Arch gap ≥ 9 wide —
  the rail flies through every pass. ~2.5k tris. NEEDS: static-ahead approach (trivial) +
  first horizon-presence seeding (fog-exempt, §5e).
- **7 THRUMSWARM** — queen: bone-white lantern rhombus (stretched octahedron + 6 rib fins
  + dark edge cage) with ONE amber eye; swarm: 28 dark tetra motes (separate meshes)
  lerping between authored formation tables: ring / wall / line / YOUR-DRAGON (~30 slots
  sampled once from the player's model vertices — the meme frame). Chip damage only lands
  while condensed; shield phase = the swarm becomes a ring around YOU (L106 law: ring,
  never a filled volume). Void-black motes ei ≤0.1 / star-white queen. ~1.6k tris.
- **8 BRINEHOLM** — never fully on screen: whale-back ridge = ONE long low-facet hull
  (~24 units, 8 radial facets) spanning the frame bottom; 4 fin-sails (flat tapered
  extrudes) rising/falling on pivots; THE EYE: 3-unit HDR hemisphere + iris ring + heavy
  stone lid that surfaces for weak-point windows; broken shackle posts + snapped chain
  tori along the ridge. Geyser curtains rise from below-frame (off-rel spawns). Kelp-black
  0x0c1210 / abalone 2-tone emissive banding / white eye. ~3k tris. NEEDS: below-horizon
  rise + widened bullet cull bounds (§5e).
- **9 KARNVOW** — vertical figure ~9 tall: hooded cowl (tapered extrude) whose face is an
  EMPTY VOID with one cold glint deep inside (no face — the anti-mask); pauldrons; lance =
  Voidmaw's snapped-horn geometry (same tube-taper kernel, violet-scarred); trophy chain
  (LineSegments + relic charms: Ashtalon's feather-blade, one unclaimed hook). Rides
  ALONGSIDE matching your speed (moving station at x ≈ ±12, rel 12–18), then cuts in.
  Parries your reflected bullets once (amber flash + riposte). Tarnished iron 0x1c1e22 /
  trophy glints in the owed bosses' palettes / amber. ~2k tris.
- **10 KNELLGRAVE** — bell: 3 stacked tapered cylinder bands + flared lip (10 facets),
  crack seam = jagged LineSegments + thin HDR candle-slit box behind it; chain: 3 link
  tori + LineSegments vanishing up off-frame (hangs from NOTHING); clapper: bound figure
  (capsule + crossing strap boxes + drooped head sphere) visible only mid-swing. Pendulum
  = one rig pivot; toll rings = expanding ring-walls on a rhythmic beat (iris inverted);
  audio tolls one biome early. Patina copper 0x1a2420 / candle 0xffd890. ~2.2k tris.
  NEEDS: audio-foreshadow seam + off-lane sweep bounds (§5e).
- **11 WEFTWITCH** — mantle bust: hooded triangular shroud (extrude, no legs) with 2 pale
  hands only; 6 radial spinneret limbs (2-segment tapered tubes on pivots); WEB: taut
  LineSegments spanning arena to off-screen anchors (overdraw-exempt); gaps visibly stitch
  shut between waves (thread redraw); laserLance = one thread pulled tight → HDR flash;
  rose = woven rosette knots. Parry cuts a glowing thread → stagger. Descends from ABOVE
  on one thread. Moth-grey 0x1e1c22 / rose 0xd88098. ~1.8k tris. NEEDS: above-approach +
  `top` warning direction (§5e).
- **12 ONEWING** — EITHERWING survivor at ×2.2 scale, permanently listing ~12°: one vast
  8-blade wing (Ashtalon kernel, oversized), one atrophied 2-blade stub; the dead twin's
  kite frame fused across the chest as a pure-black EdgesGeometry wireframe ghost
  (eyeless); its old bead-thread hangs snapped. Mirrors your last dodge into the next
  volley. Ashen-rose 0x241418 / blackened silver / ghost stays black. Entrance: NO
  warning banner (def.noWarn — the banner fires late, as the jump-scare). ~2.6k tris.
- **13 EMBERTIDE** — the horizon attacks: 3 frame-wide thin light-bands (long flat planes,
  additive, staggered z, UNstacked vs camera → inside the overdraw cap since they replace
  the sky) + a FACE surfacing as dark relief bumps pushed through the glow (brow/nose/chin
  silhouette masses, opaque). Vertical constriction: ceiling/floor light-bands close in
  (new constrict axis). Sky grade shifts a biome early. Vermilion→rose gradient / dark
  relief. ~1.2k tris + postfx. NEEDS: vertical constrict + full-frame emitter rows (§5e).
- **14 THE UNMASKED** — Stage 1 (seeded mid-game on ordinary runs): fog-exempt black disc
  + white corona ring + one heavy lid, camera-relative like the sky dome (its reserved
  glow-shape). Stage 2: 3 concentric wheels (torus rails + box spokes) gimbal-tilted on
  different axes, counter-rotating; 6–8 independent HDR almond eyes PER WHEEL (the proven
  eye rig ×~20, each with own gaze lag — draws are free, L126); six scythe-wings
  (Ashtalon kernel ×2 scale) unfolding pair by pair; relics wired to the rails (horn,
  feather-blade, chain link, thread spool, bell shard). Stage 3: wings mantle open, the
  veiled core (HDR sphere behind petal shroud — mandala petal kernel) unveils. Dark gold
  0x181206 / gold rails / white eyes+corona. ~5k tris across stages, staged builds swap
  via dissolve. NEEDS: horizon-presence system + stage system (§5e).

**Reserves (parked, fully-designed concepts for variants/post-game — not claimable slots):**
MAWSIREN (spiral shell siren), THUNDERGRAVE (storm gate), THE SILVERED WOUND (mirror that
replays known patterns), NIGHT BLOOM (unfolding black orchid), SUNDERED FORGE (caged molten
heart), STARFALL (ablating comet doing passes).

## 5e. ENGINE-EXTENSION ROADMAP (per band — grounded, with the seams)

Ground truth (feasibility survey, 2026-07): the whole fight lives in a player-relative
`pose {x,y,rel}` frame with NO clamps (`boss.js` pose ~:194, `placeGroup` ~:859);
`SETPIECE_PATHS` (~:137) is a one-function seam for scripted movement; `spawnBossBullet`
takes arbitrary origins (crossfire already fires from ±10; the rider shot proves off-`rel`
spawns work). Fog (near 70–85 / far 380–430) ERASES everything past ~400m regardless of
emissive — horizon objects must be fog-exempt with their own haze (the sky-dome pattern:
`material.fog = false` + camera-following, `environment.js`). Camera far=1600 is not the
limiter. Portrait camera envelope at rel 30: x ±15 / y 2..22.

- **COLOSSI (small):** new `SETPIECE_PATHS` entries (dive-under, side orbit, figure-eight);
  a NON-suppressing moving-station branch (setpieces currently hold fire — ~:721-730);
  `approachFrom: 'below' | 'above'` branches (~:455-463) + a `top` warning-banner direction
  (CSS). EITHERWING needs zero hit-model work (shared pool, crossfire emitters).
- **CALAMITIES (medium):** formation-slot tables (model-side only); below-horizon rise
  (pose.y from −8) + WIDEN the bullet cull bounds (`bossBullets.js` ~:388-389 currently
  deletes anything born past ±23 x / 34 y); scroll-along-back reuses moving-station.
- **WORLD-ENDERS (medium):** off-lane/off-`rel` volleys via direct `spawnBossBullet` with
  per-emitter time-to-impact (`aimVel` assumes `pose.rel` — crossfire's inline t is the
  template); `def.noWarn` flag; audio-foreshadow seam (play a boss sfx cue from levelGen
  distance triggers); VERTICAL constriction (arena system today only narrows x —
  ~:161-166, :650-664); early sky-grade seeding via the `bossGradeTarget` channel.
- **APEX (the big one):** the fog-exempt second-sun landmark seeded on ordinary runs
  (environment.js integration); the stage system (stage swap = builder-internal dissolve
  between sub-rigs, driven off phase transitions); pattern-era quoting (zero new ids).

## 5f. MOVE-SET GRAMMAR + THE SPELL-CARD SYSTEM (research pass, 2026-07)

Three research tracks (legendary move sets · shmup/danmaku heritage · dimension/rule-breaking
bosses) distilled into adopted law. Full sources live in the research reports; the load-bearing
precedents are cited inline.

### The move-set laws (every boss)

1. **The 3–5 move core.** Each boss: 3–5 attacks, each a unique triple of silhouette POSE +
   pattern SHAPE + one best VERB (dodge/graze/parry/surge). If two attacks share a pose or an
   answer, cut one. (Punch-Out tells; Cuphead phase vocabularies.)
2. **One NAMED dread move per boss.** The fight's longest telegraph (2–3s held ritual pose),
   used 1–2 times or threshold-gated, screen-filling, near-lethal, with a COUNTERINTUITIVE
   answer that uses a non-default verb — and it is deliberately the fight's graze goldmine,
   so mastery converts terror into the biggest scoring moment. (Waterfowl Dance, Genichiro's
   lightning; two flavors: lethal-dread for late bosses, spectacle-dread for early.)
3. **Phase grammar: introduce → develop → twist → desperation.** Develop = same reads,
   faster, +1 move. Twist = ONE systemic change. Desperation (last ~20%) = max-tempo remix +
   the guaranteed dread move + a music layer. Old telegraphs stay valid all fight. (Isshin.)
4. **Teach before you test.** Any parry/surge-answered move debuts in a slow survivable form
   on an earlier boss or phase. Slot 14 is an EXAM over the roster's taught mechanics, zero
   new ids. (The Genichiro→Isshin lightning pipeline.)
5. **Legible turn-taking.** Every attack string ends in an unmistakable exposure state:
   weak-point glow + pattern silence + a slumped pose. Nobody ever wonders whose turn it is.
6. **Honest bars; one earned resurrection.** Phase pips on the HP bar everywhere (Sekiro
   deathblow grammar — truthful dread is unlimited). The roster gets exactly ONE lying
   FELLED card, at slot 12 — see rule-breaks. (Friede/Radagon; the Health-Bar-Lie trust rule.)
7. **Emitter = organ.** Every pattern originates from a visible body part; the telegraph is
   that part's animation; phase change is visible damage/transformation. If a featureless
   sphere could emit the pattern, the body is set dressing. (CAVE part grammar, Gradius core
   ritual, already implied by law §3.5 — now absolute.)
8. **Rhythm is a fairness subsidy.** Per-attack audio cues; dense patterns emit on the music
   grid where possible; graze ticks confirm "close but safe." Behind-camera depth ambiguity
   becomes thrill, not unfairness. (Grimm; Just Shapes & Beats; Returnal's audio channel.)

### The spell-card system (ADOPTED — the genre's biggest fan-culture engine)

Attacks of consequence become **named, title-carded set-pieces** (Touhou's invention: names
turn patterns into nouns; nouns get ranked, wiki'd, screenshotted, fan-arted):

- A **card** = one named signature pattern-phase: small title card (reuses `bossTitleCard`
  styling, lower-right, non-blocking), bullet-cancel flash on entry, its own dial block, a
  TIMER (~20–30s), and a per-card ledger: **capture** (survive it hitless) vs **survived**
  (timed out / took hits). Timeout is the escape hatch — no card ever hard-walls a weaker
  player; capture is the mastery atom players share. (Cost: LOW — a banner variant + timer +
  stats map on top of the SOP's phases/dials.)
- **One trick per card**: a single geometric insight (a rotating safe lane, streaming, a
  rhythm) composed from the existing pattern vocabulary. Later cards remix earlier ones
  denser/inverted; slot 14 quotes the roster. **The pattern IS the personality** (Cirno law):
  card geometry expresses the boss's character — KNELLGRAVE's cards are metronomic,
  ASHTALON's are pursuit curves, WEFTWITCH's are lattices.
- **Naming grammar** (Darius discipline — one formula for the whole roster): every card is
  `"<FRAGMENT OF THE EPITHET> — <plain pattern name>"`, e.g. Voidmaw's *"HOLLOW JUDGMENT —
  Sky-Splitting Verdict"*, KNELLGRAVE's *"IT RINGS — The Second Toll"*. The boss's dread move
  (law 2) is always its final card.
- **Survival cards ×2 max in the roster**: boss invincible + visibly sealed/charging; pure
  dodge exam on a timer. Assigned: slot 10 (a toll you can only outlast) and slot 13's
  vertical squeeze. The unfillable bar is the tell.
- **Post-clear EX cards** (deferred, post-roster): beat a boss hitless → unlock its bonus
  ultra card in the boss-select picker (can't cost a run). Per-card stats feed leaderboards.

### Rule-break allocation (each category spent ONCE; the Mantis rule governs all)

A break is legal only if: performed in-character as the boss's power; resolves ≤3s with the
game visibly alive; deterministic; never touches saves/purchases/real progress; and the
ritual it breaks ran clean through Tiers 1–3 first. VETOED for mobile web: fake crashes/
freezes/system dialogs, touch-input tampering, save/currency wagering, full free-flight
all-range mode (Star Fox's own monster fights stayed on the rail; the Panzer Dragoon
quadrant-orbit buys the arena fantasy rail-natively).

| Slot | Break(s) | Precedent |
|---|---|---|
| 3 ASHTALON | one scripted rear-view camera beat as it overtakes (~3s, announced, no fire during the swing) | Sin & Punishment; SF64's "announce the mode" |
| 7 THRUMSWARM | mirrors a ring-buffer of YOUR recent flying back at you as its formation (boss-side mirroring — never touch input) | NieR twin fights |
| 9 KARNVOW | fires ONE slow survivable shot during the reveal hold (the trophy-hunter has no honor — the roster's only hold-breaker); taunt cards quote your OWN run stats from localStorage (deaths, which boss felled you most) — diegetic Psycho Mantis; escalation: quadrant-orbit duel beat | Sans's menu attack; Psycho Mantis; Panzer Dragoon |
| 10 KNELLGRAVE | the music DIES for the whole fight — only the toll keeps time (the silence is the puzzle's clock) | Sans's silence; Grimm's audio-bound moves |
| 11 WEFTWITCH | threads visibly sew across the HUD chrome (never over bullets — render-order LAW holds); one banner gets stitched over | Omega Flowey's UI arena, honest version |
| 12 ONEWING | late DANGER banner (already canon) + the roster's ONE lying FELLED card: it fires, cracks, and ≤35% of the bar returns — resolve ≤2s, crippled silhouette stays moving as the tell (the MGS2 live-corner rule); its name IS the mechanic | Radagon→Elden Beast; Fission Mailed |
| 14 THE UNMASKED | honest re-struck stage cards ("II — THE UNMASKED"); a one-frame title glitch where the card reads VOIDMAW (it made the masks); exactly ONE line addressed past the dragon at the player, stage 3 | Elden Beast card; Eternal Darkness micro-dose; Mantis |

### Signature-move assignments (the dread move per slot — names draft, user may veto)

3 ASHTALON *"EMBER HUNT — Stooping Strike"* (full-speed dive pass, lethal-dread, answer:
surge INTO the dive gap) · 4 MARROWCOIL *"MARROW — The Closing Ribs"* (ribcage constricts one
ring at a time while coils sweep; graze goldmine) · 5 EITHERWING *"EITHER/OR — Both Halves at
Once"* (the eye splits its light: simultaneous mirrored crossfire) · 6 HOLLOWGATE *"THE DOOR
PRAYS — Rose Judgment"* (all 8 panes fire radially while the arch closes its portcullis) ·
7 THRUMSWARM *"A THOUSAND — Your Own Wings"* (the swarm becomes your dragon and flies your
recorded path back at you) · 8 BRINEHOLM *"THE ISLAND BREATHES — Sounding"* (it dives; the
whole arena floor erupts in geyser curtains; spectacle-dread) · 9 KARNVOW *"WEARS THE HORN —
Voidmaw's Verdict"* (it fires boss 1's dread card back at you, violet-scarred) · 10 KNELLGRAVE
*"IT RINGS — The Last Toll"* (survival card: nine accelerating tolls, pure rhythm dodge) ·
11 WEFTWITCH *"SHE MENDS — Warp and Weft"* (the whole arena re-woven in one pass: every lane
stitches shut except the one her hands never touched) · 12 ONEWING *"WOULD NOT DIE — The
Missing Wing"* (it performs EITHERWING's old dual attack ALONE, the dead half's volley arriving
as ghost-bullets) · 13 EMBERTIDE *"SKY SET LOOSE — Horizon Break"* (survival card: the tide
crests the whole frame; the safe pocket is where the face is — hide in its shadow) · 14 THE
UNMASKED: its final card is the roster exam — *"WHAT WORE THE SKY — Every Verdict at Once"*,
quoting one card from every felled boss at once, thinned to fairness caps.

**Destructible sub-parts** (CAVE law — hero bosses only, 3–4 in the roster, prove-then-extend):
6 HOLLOWGATE portcullis bars + individual rose panes (shooting a pane deletes its radial from
the composite) · 8 BRINEHOLM shackle posts (freeing it early softens phase 3 — mercy as
mechanics) · 12 ONEWING the fused dead frame (breakable; breaking it removes the ghost-bullet
component but enrages the tempo) · 14 wheel relics (each destroyed relic removes that boss's
quoted card from the final exam — the player edits the finale).

**Duo law** (one per roster): EITHERWING is the duo — complementary axes (one twin flies
lane-denial walls, the other aimed tempo), and the eye-handoff IS the kill-order mechanic:
whichever twin holds the eye when the pair breaks fires the desperation card alone. ONEWING
returning at slot 12 is the roster's rival-return payoff (Vergil grammar: two-thirds familiar
kit + counters to what you learned + the old unanswerable dual attack finally parryable).

**Verb-shift climax** (Radiance law): slot 14 stage 3 abandons pattern-dodging — the shroud
opens and the fight becomes a surge-chase THROUGH the wheels to reach the core before it
re-veils. Endings are remembered by what the player did last.

### Engine additions this section costs (append to §5e ledger)

Card system: title-card variant + per-card timer/capture flag + stats map (LOW — sits on the
SOP's phase/dial schema: a card = a named phase-attack entry). Stat-taunt templating from
existing localStorage run stats (LOW). One scripted camera beat seam (MEDIUM — cameraCtl
path, announced, fire-suppressed). Sub-part HP: per-part hit test vs the single-center model —
route by the `bossDamage` event's existing x/y payload (MEDIUM; hero bosses only). HUD-sew
overlay: DOM/SVG lines above chrome, below bullets (LOW).

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
