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
   distance. Dominant mass ≥3× secondary forms ≥3× detail. (Necessary but NOT sufficient — a
   one-sentence outline can still read as the WRONG noun; the translation discipline is §3b.)
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

## 3b. LOW-POLY SILHOUETTE TRANSLATION (the anti-failure discipline, 2026-07 — L150)

**Read this before modeling any boss.** Two shipped failures came from the SAME root cause and
they will keep happening as bosses get grander unless this is a hard step: EITHERWING was
modeled correctly but read TINY (L140/L141); BRINEHOLM modeled a genuine whale — brow, jaw,
throat pleats, barnacled arched back, all in the mesh — and read as **a battleship with a
headlight**. The build sheet describes the boss in WORDS; the builder faithfully models the
words; but the player reads the **SILHOUETTE** (the black outline + the lit emissive edges),
and the silhouette can betray every word. §3.1 ("silhouette first") is necessary but not
sufficient — BRINEHOLM's outline WAS describable in one sentence and still read as the wrong
object. This section is the translation layer from grand concept → low-poly that actually reads.

**The eight translation laws:**

1. **Judge the silhouette, not the part list.** At 30m on a phone, a low-poly boss is an
   outline plus a few glowing lines. Modeled detail that never reaches the outline or an emissive
   edge is INVISIBLE (BRINEHOLM's brow/jaw/pleats were all there and all lost). Every gate judges
   a pure black-fill render + a lit-edge-only render FIRST, then the beauty pass.
2. **Name the ANTI-READS before building.** Write what the silhouette must NOT read as — a ship,
   a blob, a generic bug, another boss — then name the exact primitive choices that cause each
   and forbid them. (BRINEHOLM "ship" = a straight horizontal lit stripe + a row of small
   triangular fins + symmetric bow/stern taper + a lamp on a raised deck. All five were present.)
3. **Lit edges ARE the drawing.** On a near-black body the EMISSIVE lines are the shape the eye
   traces. A straight, level, horizontal lit line reads as MAN-MADE (waterline, deck, gunwale) no
   matter how organic the mesh under it is. Emissive must follow character/organic anatomy —
   ridges, creases, throat grooves, rims — NEVER a level rule line. (EITHERWING's fix was
   full-perimeter rims; BRINEHOLM's is: kill the waterline stripe, move the glow to the pleats
   and dorsal crest.)
4. **Every identity reduces to 2–3 CARRYING CUES that must survive to the outline.** A whale =
   one big curved dorsal fin + a blunt heavy head + a fluke/blow. Not forty modeled details.
   Build the 2–3 cues BIG and unmistakable (dominant ≥3× per §3.1); everything else is texture.
   One iconic cue beats ten subtle ones. If the cues aren't in the outline, nothing else matters.
5. **Plant a POSITIVE signal — don't just avoid the negative.** The brain defaults to the
   nearest familiar shape; removing the anti-read isn't enough, you must give it the right shape
   loudly. A blowhole spout says "whale" louder than deleting masts does; a single hooked orca
   fin says "it swims." Add one signal the intended object has that NOTHING else does.
6. **Scale is a silhouette property (L140/L141).** Presence = on-screen span × lit-edge area at
   FIGHT distance; for multi-body/ensemble bosses the FIELD must read, not the parts. Set an
   explicit on-screen scale target vs the shipped anchors (ASHTALON ≈24u wingspan; MARROWCOIL ≈
   screen-length; a Sentinel ≈ small-medium). If the concept needs to feel HUGE, author a
   PROXIMITY beat (a true pass/fly-through where rel crosses negative) — distance shrinks
   everything and proximity is the cheapest multiplier.
7. **Judge on the boss's HOME backdrop first.** A dark boss on a pale backdrop is a flat cutout —
   all relief vanishes and only the outline + lit lines survive (this is exactly what made
   BRINEHOLM's studio sheet read featureless). A pale boss on dark, likewise. The home-biome
   value backdrop + the fight-distance frame are the PRIMARY judgment; the neutral studio
   backdrops are the stress test, not the verdict. (§7c now defaults the studio to home value.)
8. **The stranger test.** Show the pure black-fill silhouette to someone with zero context: do
   they name the intended object in ~2 seconds? If not, it is not translated yet — no amount of
   in-mesh detail or beauty lighting will fix a silhouette that reads as the wrong noun.

**The per-boss SILHOUETTE TRANSLATION SHEET (fill BEFORE modeling; lives in the §5d entry):**
- **Reads as:** the intended object, one noun-phrase (the stranger-test target).
- **Carrying cues (2–3):** the shapes that MUST reach the outline, each sized dominant.
- **Anti-reads:** what it must NOT look like + the forbidden primitive choices for each.
- **Lit-edge plan:** where the emissive goes (organic anatomy only — no level lines) + the one focal.
- **Scale target:** on-screen span vs the anchors; the proximity beat if it must feel huge.
- **Home backdrop:** value/temperature the boss is judged against first.

**Process (both cheap, both catch the failure before it costs a rebuild):**
- **PRE-BUILD Fable sign-off:** the builder fills the translation sheet and a Fable agent
  approves it (or names missing cues / un-forbidden anti-reads) BEFORE any geometry exists. This
  is where BRINEHOLM should have been caught — at the sheet, not after modeling.
- **CP1 silhouette gate:** the Fable design gate judges the black-fill + lit-edge renders on the
  home backdrop + fight-distance frame against the translation sheet's cues, anti-reads, and the
  stranger test — BEFORE the beauty pass. A boss that fails the stranger test does not proceed.

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


### 4b. The charisma-carrier law (faceless bosses)

The §4 ladder rungs 1–7 are written in eye anatomy (pupils, blinks, brows) — buildable as-is
for only half the roster. LAW: every build sheet must name its carrier for SEVEN channels —
GAZE, BLINK-analog, CHARGE-TELL, EXPRESSION (≥3 states), FLINCH, NOTICE, DEATH — behind the
unchanged `setGaze`/`notice` handle hooks. **A sheet missing any channel is not claimable.**
Seeded carriers for the faceless slots: KARNVOW = the guttering cowl-glint + lance language
(salute / point / lower = mood); KNELLGRAVE = the bound clapper-figure (it LIFTS ITS HEAD
mid-swing — the roster's darkest notice beat); WEFTWITCH = her two pale hands are the face
(weaving tempo = mood, hands still = dread); HOLLOWGATE = a lit pane that MIGRATES around the
rose window as its pupil; EMBERTIDE = negative-space eye-hollows in the light (recorded
exception to §3 law 2: its focal is darkness in brightness); THE UNMASKED stage 1 = the lid
aperture itself. Each sheet also ships its doodle-test GLYPH — which becomes the boss-select
chip icon (L131 chips need 14 faces).

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
   foreshadowing. The full grammar, per-slot choreography, and claimed beats: §5j.
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

| # | Working name | Silhouette family | Hook | Palette (hue·value·glow-shape) | Approach | Status | Parry job (§5i.C) |
|---|---|---|---|---|---|---|---|
| 1 | VOIDMAW | shattered mask (dead STONE — keep distinct from BRINEHOLM's living wet head, slot 8) | hollow sockets + broken horn/halo | violet·ember·white / points | behind | shipped | —³ |
| 2 | STORMREND | concentric rings | unblinking eye + blade rings | teal·gold·white / points+lines | side | shipped | —³ |
| 3 | ASHTALON | winged pursuer (scythe-wing raptor) | never holds station — it hunts you | charcoal·ember / one molten SLIT | behind, overtakes | claimed (replaces retired CRAGHOLD¹) | —³ |
| 4 | MARROWCOIL | segmented skeleton (bone dragon) | fly-through ribcage + skull lure | bone-white·void·ice-blue / ring-aperture + pinpoints | below (new) | claimed (absorbs VESPERCOIL²) | **rib-slam ambers → ORGAN BREAK** (Colossi debut): parry a rib-slam's ambers N× → that rib CRACKS, its pattern component deleted (reused at 5 on the eye-holder) |
| 5 | EITHERWING | twin bodies | one eye passed between two | oxblood·aged-silver / single point | both sides (new) | claimed | **eye-holder's amber volley → ORGAN BREAK** (Colossi reuse): parry the holder's amber volley 3× mid-possession → the handoff STAGGERS, the eye DROPS to the thread midpoint for a 2.5s bonus-damage window |
| 6 | HOLLOWGATE | architecture with a void | rose-window face | ivory·stained-glass / leaded field (VALUE-INVERTED: near-white) | static-ahead | shipped | **pane-radial ambers → PANE BREAK** (Calamities ORGAN-BREAK reuse): parry a lit pane's amber volley 3× → that pane CRACKS and its radial component is deleted from the composite (rides the §5f destructible-pane plumbing — parry and gunfire sculpt the same window) |
| 7 | THRUMSWARM | stippled swarm | condenses into YOUR dragon (side-profile copy) | void-black·star-white + amber focal-eye / scattered points | condenses | shipped | **queen's amber-eye volley → SCATTER STAGGER** (Calamities): parry the eye's amber volley 3× → the queen recoils, the swarm can't re-condense for a 2.5s bonus-damage window (the condensed weak-point stays exposed — parry answers the same condense/scatter puzzle read the fight is built on) |
| 8 | BRINEHOLM | colossal leviathan head + maw (living/wet — NOT Voidmaw's dead mask) | the one surfacing eye — you fight the FACE, never the body | kelp-black·abalone / bioluminescent gullet + one white eye-point | below-horizon (the head lunges up through the fog) | open | — |
| 9 | KARNVOW | slender vertical duelist | trophy-chain of earlier bosses' scars | tarnished-iron·trophy glints | alongside | open | — |
| 10 | KNELLGRAVE | hanging pendulum | bound figure as the clapper | patina-copper·candle / vertical slit | pre-heard, fades in | open | — |
| 11 | WEFTWITCH | radial limbs + threads | visibly re-weaves the arena | moth-grey·rose / taut lines | above (new) | open | — |
| 12 | ONEWING | lopsided twin (designed echo of 5 — flagged) | twin's frame fused in its chest | ashen-rose·blackened silver | behind, NO warning banner | open | — |
| 13 | EMBERTIDE | frame-wide band/wave | face surfacing from light | vermilion→rose / full-frame field | the whole horizon | open | — |
| 14 | THE UNMASKED | eclipse disc → wheels-within-wheels angel | the second sun cracks into an Ophanim: rings of tracking eyes, six scythe-wings, every prior scar worn as a relic | black·dark-gold·white / corona ring + eye-points (corona RESERVED from slot 1) | always there | open | — |

¹ CRAGHOLD (broad bust → palm-eyed hands, moss·bronze) shipped at slot 3 and was RETIRED by
user verdict after two rebuilds — the concept never escaped "Voidmaw with hands" (LEAPFROG
L130). It stays in `BOSS_ORDER` only until ASHTALON ships in its slot; its geometry lessons
(finger chains, socket pools, tell-family poses) are inherited by ASHTALON/EITHERWING/KARNVOW.
² VESPERCOIL's coil-the-lane verb, below-approach, and lure-lantern all transfer to
MARROWCOIL; the eel skin is retired for the stronger bone-dragon identity (user directive).
³ Parry job not yet allocated: shipped slots 1–3 carry only the base roll-reflect + perfect
tier — their distinctive amber-carrier is a §5i retrofit (staged with the slot-5 phrase machine;
ASHTALON P3's amber-tip is the one flagged immediate hotfix). Open slots fill this at build time.

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
How each band's ARRIVAL escalates is its own contract — the entrance grammar (§5j).

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
  ENTRANCE: SHIPPED — the §5j exemplar; rear-view-overtake is its claim forever.
- **4 MARROWCOIL** — skull: box cranium 1.6w + tapered snout box + jawPivot jaw slab + 2
  curved horn tubes (TubeGeometry taper, the idol's horn kernel); eye pinlights: 2 small
  HDR ice-blue spheres recessed in dark socket boxes; lure: HDR teardrop on a LineSegments
  strand between horns (focal). Spine: 16 octahedron vertebrae (r 0.5→0.25 taper) each
  with 2 short torus-arc rib stubs, positioned each frame along a CatmullRom whose control
  points run a traveling sine (coil sweep); RIBCAGE: 5 pairs of long torus arcs (r 2.6,
  arc π·0.6) mid-chain forming the fly-through tunnel; tail blade: flat kite. Bone
  0xd8d2c0 diffuse (sanctioned VALUE inversion, dark joints paint the hierarchy) / void
  gaps / ice-blue 0x8fd0ff lights. Scar (as built): LEFT rib ring 2 snapped at 0.45 span —
  jagged break face, a floating orphan fragment arc, and a COLD ice seam (no warm marrow;
  the ice family keeps the one-accent law). GRAZE FORM (§5i.B, Colossi band): **THREAD-THE-GAP**
  — the ribcage aperture IS the graze anatomy (not an abstract zone). The shipped `ribThread`
  fly-through setpiece (P2, card *"NOT DIGEST — Ring of Ribs"*) already embodies it: the rail
  threads the open rib gap as the boss looms close; §5i scores it by clearance + lateness
  (tighter + later = bigger chunk, consecutive threads chain), and the dread `closingRibs` (P3)
  tightens the same gap so the richest payout lands at the scariest instant. (Scoring wiring
  arrives with the slot-6 continuous-graze detector; the anatomy + setpiece ship here.)
  ~3.5k tris, ~24 draws (vertebra chain = separate small
  meshes — phone-verified fine; NO InstancedMesh, L126). REUSES: mandala rail-merge idiom,
  charisma eye rig, jawPivot precedent. NEEDS: below-approach + cull-bound widening (§5e).
  ENTRANCE: shipped rise stands; §5j *Count the Ribs* retrofit STAGED (inert `def.riseBeats`).
  FLY-THROUGH (2026-07 — L142, RESOLVED; was the L141 gap): the rib fly-through now LANDS.
  `ribThread` (boss.js) sweeps the GROUP from the loom through rel −6 AND dives ~4.2u so the
  barrel INTERIOR (its dorsal rib roots sit ~4u above the rail) descends around the camera —
  the ribs flank the dragon on both flanks + overhead and the pillar corridor reads THROUGH
  the aperture on exit. Verified in-game from the rail camera (tools/marrowpass.mjs). The
  sheet claims the fly-through again.
  FLY-THROUGH → FULL MANEUVER (2026-07 — L155): `ribThread` is now the whole aerobatic over 8s —
  loom → fly completely past → re-emerge on a flank with its BACK TURNED (flying your heading) →
  accelerate past → BANK into the lane → wheel around to face you. A setpiece path may now return
  `{yaw, roll}` alongside `{x,y,rel}` (the runner routes them to `cineYaw`/new `cineRoll`; roll/banking
  is a new roster-wide axis) — a general FACING+BANKING seam any boss can use, default-off. During the
  close band the pass OWNS its fire: the normal skull-origin cadence is suppressed and slow reflectable
  AMBER bullets emit from the rib-pivots (`ribPivot{L,R}{1,3}`) converging on the spine centre — the
  close-range THREAD-THE-GAP + parry beat. Verified live (tools/ribmaneuver.mjs + `bossRunSetpiece`).
  → FLYBY, SIMPLIFIED (2026-07 — L155, dur 8.5s): the rear-look CINEMATIC (camera takeover +
  from-behind bullets + player freeze/invuln + homing) was **reverted** — on-rails, a camera-takeover +
  stick-lock reads as a cutscene interruption, not a boss move (owner rejected it 2×; the over-reach lesson is L156). The shipped beat is a
  readable flyby from the player's seat: loom → thread + fly fully OFF-SCREEN behind → **emerge from ONE flank
  and fly forward** (body flies its heading, `yaw 0→π`) → **TURN THE HEAD at you and fire a few mouth shots**
  (`setHeadLook` + skull-origin `emitHeadShots`, front-closing amber, dodge-or-parry) → **bank into the lane**
  (`cineRoll`) and settle to centre. Kept: the facing+banking seam, `setHeadLook`, the rib bullets (all L155).
  LESSON: author the drama into what the boss DOES from a fixed viewport, not into where the camera goes.
- **5 EITHERWING** — **REACH SPEC (r8, 2026-07 — supersedes the conservative first sheet;
  L140):** the first draft built to "~2×900 tris, 2.2-long bodies" and presented ~40% of
  ASHTALON's presence at the band PEAK. The ensemble is the body; this boss's wingspan is
  its FORMATION. Per twin: stretched-octahedron kite body (**4.6 long × 1.7 wide** — same
  dart proportions) + crescent head fin (flat arc extrude, mirrored per twin) + 2 ribbon
  COMET-TAILS (**12 tapered segments, base segLen 0.95 → ~7–8-unit flowing trails**; the
  last 3 segments per tail carry ember-gradient emissive ei 0.35→0.15 so crossings draw
  light-trails). THE EYE: one HDR orb that detaches and glides between bodies on a beaded
  thread (the charge tell: whoever holds the eye fires next) — eye rig proportions
  unchanged (the googly read self-corrects at the new body size). Formation: figure-eight
  at **ORBIT_R 5.2, ZSEP 2.4, def.scale 1.55** → crossing span ≈ 23 units, ASHTALON-class
  reach, sweeping the full portrait width (orbit ±8 fits the x ±15 envelope at rel 30).
  Align the visual crossing with the authored rhythm REST (the handoff window) — the
  interlocked-crescents crossing with the eye mid-thread is THE screenshot frame.
  **PRESENCE SPEC (r9, 2026-07 — L141; owner verdict after r8: still tiny in game — the
  span bet failed; perceived size sums per BODY, not per formation, and negative space is
  not mass):** (a) **each twin must pass the boss-test ALONE** — BODY_LEN 4.6→**6.2**,
  KITE_W 1.7→**2.3**, fins +35%, eye rig +30% (stays the proportional focal); def.scale
  1.55 unchanged → ~9.6 on-screen units per twin; tails base segLen 0.95→**1.25** (~10-unit
  light-trails, segment count unchanged). (b) **CLOSE-PASS FIGURE-EIGHT — a TRUE flyby,
  not a loom:** the eight becomes a 3D lemniscate; once per phrase cycle (aligned to the
  rhythm REST/handoff) the near lobe dives past the camera — the twins scissor PAST the
  player's flanks, rel sweeping ~18 → **−6** → back around (they genuinely overtake and
  re-approach), x ±6–8 at the pass (lateral offset is the no-clip guard — never
  lane-center), slightly above/below player height, tails whipping; whoosh sfx on the
  pass. Slot-3 differentiation is structural: side-by-side scissor FLANKING passes on a
  repeating fight rhythm, never a single rear-view camera beat — the camera never moves.
  Station rel MAY drop 30→26 (pose is unclamped). (c) **Cost truth:** scaling is FREE —
  same meshes, same draws (~4.8k tris / 26 draws unchanged); per-boss budgets are
  allocation discipline, the measured phone ceiling is 415 draws / 400k tris (L124/126).
  **LIT-SILHOUETTE LAW (small mass ⇒ the identity is the EDGE):** body diffuse stays
  near-black, but the oxblood rims widen to **0.14** and run the FULL kite perimeter + fin
  outer edge (holder ei 0.9 / seeker ei 0.45); fins aged-silver ei 0.30; the bead-thread
  between the twins ALWAYS visible at silver ei ~0.6 — the silhouette is three elements:
  two oxblood line-drawings and the line between them, readable on the BRIGHTEST biome sky.
  **ONE-GLOW LAW:** outside the dread card exactly one light source among the pair (the
  held eye); the seeker's split core + charge glow are dread-card-only; muzzle light
  emanates from the EYE. ONE shared hp pool + one bar (zero hit-model work); shield wraps
  the eye-holder. Oxblood (warm, clear of danger-magenta ±15°) + aged-silver; eyeless twin
  always darker. **~4.5k tris total, ≤30 draws (band cap 8k/50 — spend it).** REUSES:
  everything; NEEDS: nothing structural.
  ENTRANCE (§5j *The Baton Cross*, hijack 1.6s): honest RIGHT banner; both twins slide in
  from BOTH flanks and bracket the dragon at x ±8, rel 14 (inside the portrait envelope),
  matching speed one breath — coal-dark, backlit, rims unlit; heads angle in (`setGaze`);
  the dragon's look-yaw strains RIGHT against its 0.7 clamp (the strain reads "beside us").
  Bullet-time 1.6s: the EYE detaches and crosses right→left at rel ~10, bead-thread drawing
  one taut silver line across the FULL portrait width (escalation guard); dragon+rider heads
  track the crossing in a full sweep — ride the generalized `setOvertake` with a
  chase-identical pose (spends the hijack invisibly; keeps the look window alive; feed the
  ORB's world-x as `bx`). Rider: "Two bodies. One eye." Left twin's rims IGNITE on the
  catch, right goes dark; both scissor into the figure-eight; snap; title card. Skip →
  settle, eye left. The crossing orb is a non-colliding prop (Mantis covers fire, not props).
- **6 HOLLOWGATE** — 2 jagged pillars (stacked offset boxes, 5 per pillar) + broken lintel
  arc (4 box segments, one missing = the scar) + floating masonry chips; ROSE WINDOW in
  the lintel: 8 wedge panes (cone-slice extrudes) round a hub — panes light individually
  (expression rig: which panes glow = the face's mood); portcullis: 6 box bars descending
  as the wall volleys. VALUE-INVERTED near-white ivory 0xd8d0c2 + dark edge cage
  (EdgesGeometry) + stained-glass emissive inside the window only. Arch gap ≥ 9 wide —
  the rail flies through every pass. ~2.5k tris. NEEDS: static-ahead approach (trivial) +
  first horizon-presence seeding (fog-exempt, §5e).
  ENTRANCE (§5j *Vigil Lights*, hijack 0s — BANKS the fight's hijack): the dead black arch
  grows on the horizon a full biome, never moving — the only boss that never comes to you
  (degrade: def-flagged warn visibility + large start.rel until the horizon seed ships).
  rel ~150: look-yaw locks; rider: "It hasn't moved. Not once." Honest top banner. Ease to
  station — the lintel tops out past the frame. IGNITION: panes light one per slow choir
  beat, and the LIT pane pools toward whichever side the player steers — in DISCRETE
  wedge-steps sampled on ignition beats ONLY (continuous tracking is 14's claim); rider:
  "It's not watching the sky. It's watching US." Last 3 panes under a 0.5× dilate window,
  camera home; the hub ignites HOT with the sun framed inside the aperture; the portcullis
  drops once and LIFTS — a door opening in invitation. Title card, first murmured verse.
  Motion risk: portcullis + pane beat must carry it or it reads as a loading screen.
- **7 THRUMSWARM** — queen: bone-white lantern rhombus (stretched octahedron + 6 rib fins
  + dark edge cage) with ONE amber eye; swarm: **40** dark tetra motes (separate meshes;
  the first sheet said 28 — CP1 raised it, L162: 28 was too few to fill the meme frame's
  wing MEMBRANES; it read as a jellyfish. 40 lets each wing carry a 12-point filled
  triangle. Still ~54 draws ≪ the tier-3 70 gate) lerping between authored formation
  tables: ring / wall / line / YOUR-DRAGON (the copy is authored as a SIDE-PROFILE flying
  dragon DOODLE — a dark HORNED SKULL with the queen's amber eye set inside it as a
  contained ember (the lantern DIMS in dragon-mode so it reads as an eye, not a lamp),
  one big filled near-wing, a long tapering serpentine TAIL, a rider hump; the runtime
  hook `setYourDragonSlots()` can replace the authored slots with the player model's own
  vertices at fight start — the meme frame. L162: a front-on symmetric winged shape reads
  as a moth; the SIDE PROFILE is the unmistakable dragon doodle).
  Chip damage only lands while condensed; shield phase = the swarm becomes a ring around
  YOU (L106 law: ring, never a filled volume). Void-black motes / star-white queen +
  amber eye. ~1.1k tris.
  ENTRANCE (§5j *The Shape It Remembers*, hijack 2.8s @0.24×): standard warn, ash sold via
  the `bossGradeTarget` ambient channel (the group gate hides ALL parts during warn — no
  per-mote exemption). At hijack u=0 the 28 unlit motes converge at rel ~45 and click,
  slot by slot, into the YOUR-DRAGON formation — a stippled copy of dragon AND rider
  gliding ahead, visibly discrete points, never a solid fill; sub-bass thrum with a fog
  shudder is the condensation's click-track (phone-speaker-proof). The copy's head-cluster
  performs YOUR Ashtalon glance-back AT you — camera stays forward (homage, not reuse);
  rider: "That's... us." The queen's amber eye ignites inside the copy's skull. Burst →
  station ring; title card; ostinato opens. Do NOT live-mirror input here — the copy holds
  a neutral glide (the ring-buffer payoff belongs to its *Your Own Wings* card). Skip
  clamps the formation lerp to the ring or the settle pops.
- **8 BRINEHOLM** — **SILHOUETTE TRANSLATION (§3b, r-pass 2026-07, L150 — supersedes the
  rejected island-back ridge, which read as a battleship):**
  - *Reads as:* a colossal deep-sea leviathan's head lunging up out of the fog.
  - *Carrying cues (must reach the outline):* (1) the gaping MAW across the lower third — a
    hard jagged jawline; (2) the one heavy-lidded EYE under a jutting brow (the focal); (3) the
    vertical UPWARD thrust of the head breaking the fog, one snapped chain across the snout (scar).
  - *Anti-reads:* NOT a ship/terrain (no horizontal lit line anywhere — the mass is vertical);
    NOT Voidmaw's mask (must be WET, fleshy, breathing — a living eye + a working maw, never a
    dead stone face with hollow sockets); NOT a generic dragon head (kelp-black + abalone
    bioluminescence in the gullet + barnacles + binding chains = a BOUND deep-sea leviathan).
  - *Lit-edge plan:* abalone glow INSIDE the maw + along the gill rakes; the white-hot eye is
    the one focal. NO level horizontal line anywhere (that was the rejected waterline).
  - *Scale target:* the head fills the frame vertically at fight distance; the body is NEVER
    shown (arena-scale implied — the never-fits requirement, now native).
  - *Home backdrop:* dark.

  **Geometry:** a titanic HEAD breaching straight up through the fog — you fight the face; the
  body never appears. Skull mass = a heavy deformed sphere/box-blend with a jutting BROW shelf;
  the MAW = upper + lower jaw on a named `jawPivot` (the telegraph), jagged teeth (cone/wedge
  silhouette) along the bite line, a bioluminescent abalone GULLET glowing inside (the lit-edge
  identity — never a flank stripe); GILL RAKES down each side (raked slits, abalone-lit, flare
  on breath); BARNACLE clusters breaking the brow/crown edge (organic top silhouette); a
  BLOWHOLE vent behind the brow that SPOUTS a mist plume on the tidal-drone beat (the positive
  "leviathan" signal + a rhythm tell). THE EYE (reuse the proven assembly — socket → sclera →
  iris ring → pupil → catchlight → heavy brow-LID that grinds up/down): ONE eye seated under the
  brow, the sole white-hot focal, surfaces for weak-point windows (chip only while the lid is
  open). CHAINS: shackle posts + snapped chain tori binding the JAW/snout (destructible —
  freeing softens phase 3; one snapped chain across the snout = the asymmetric scar). Kelp-black
  0x0c1210 body / abalone 2-tone emissive (gullet + gill rakes ONLY) / white eye. NO horizontal
  banding. Wet specular skin so it reads ALIVE, not stone. def.scale sized so the head spans the
  portrait vertically. ~4–5k tris (Calamities cap 14k). REUSES: the eye assembly + chain/shackle
  destructible + geyser system from the r0 build; jawPivot precedent (marrowcoil). NEEDS:
  below-horizon rise + widened bullet cull bounds (§5e).
  ENTRANCE (§5j *The Reef Was Breathing*, hijack ≤3s @0.35 — the roster's ONE environment-wakes
  archetype, now paying off harder): the tease at WARN (scoped sub-rig exemption to the group
  gate) is a barnacled kelp-black hump sliding into frame-bottom just above the fog, reading as a
  REEF/rock — the dragon's head turns toward it; rider: "That reef is keeping pace." Honest
  bottom banner — the dragon reacted FIRST. Fight start: the "reef" INHALES and LUNGES up through
  the fog floor (start deepened to y≈−14) — the terrain was a HEAD; the maw yawns, gill rakes
  light in a wave; the crown exits frame-top — it never fits. Mid-lunge the rise HOLDS one fixed
  ~0.4s u-segment (the canon hesitation — it considers you). The eye stays SUBMERGED — a pale
  glow below the fog — then the brow clears and the lid grinds open + LOCKS once at settle (no
  continuous tracking). Rider lore line on a shackle flypast: "Same forge as the hunter's
  chains." Rush re-entry degrades to spawn-at-warn gracefully; the head stays lane-adjacent on
  the tease, never under the rail.
- **9 KARNVOW** — vertical figure ~9 tall: hooded cowl (tapered extrude) whose face is an
  EMPTY VOID with one cold glint deep inside (no face — the anti-mask); pauldrons; lance =
  Voidmaw's snapped-horn geometry (same tube-taper kernel, violet-scarred); trophy chain
  (LineSegments + relic charms: Ashtalon's feather-blade, one unclaimed hook). Rides
  ALONGSIDE matching your speed (moving station at x ≈ ±12, rel 12–18), then cuts in.
  Parries your reflected bullets once (amber flash + riposte). Tarnished iron 0x1c1e22 /
  trophy glints in the owed bosses' palettes / amber. ~2k tris.
  ENTRANCE (§5j *It Kept Count*, hijack 2.8s @0.5 shallow): banner RIGHT, honest. It fades
  in alongside at x+12, rel 16 — rel ROCK-STEADY, no pull-ahead ever (any rel change reads
  as 3's spent overtake); lance held LOW, cowl facing forward — it NEVER looks at you
  (indifference is the taunt; 12 owns the mutual gaze). Shallow flank slew; the taunt lands
  via `ui.bossNote` reading the SHIPPED `save.js bossLedgerStats`: "KARNVOW — WEARS THE
  HORN IT TOOK / FELLED ×12. MOST: ASHTALON." — the Psycho Mantis stat-quote, granted §5f.
  Mandatory fallback on fresh saves: "NO RECORD. IT WILL START ONE." As the line lands, the
  ONE charm matching your top killer FLARES in that boss's palette (MANDATORY beat — the
  escalation hinge), the rotation ending on the tilted EMPTY hook. Rider: "It's wearing
  the one that beat us." Without turning its head the lance snaps low→POINT. Card out,
  cut in laterally, wheel, settle — zero shots. Dedicated taunt-card UI + shortened
  rush-repeat variant land with the §5f cost item; v1 ships on bossNote.
- **10 KNELLGRAVE** — bell: 3 stacked tapered cylinder bands + flared lip (10 facets),
  crack seam = jagged LineSegments + thin HDR candle-slit box behind it; chain: 3 link
  tori + LineSegments vanishing up off-frame (hangs from NOTHING); clapper: bound figure
  (capsule + crossing strap boxes + drooped head sphere) visible only mid-swing. Pendulum
  = one rig pivot; toll rings = expanding ring-walls on a rhythmic beat (iris inverted);
  audio tolls one biome early. Patina copper 0x1a2420 / candle 0xffd890. ~2.2k tris.
  NEEDS: audio-foreshadow seam + off-lane sweep bounds (§5e).
  ENTRANCE (§5j *It Lifts Its Head*, hijack 2.6s @0.30): canon tolls a biome early
  (`getBossEta()`); honest top banner; sky dims one grade across warn. The music DIES on
  the warn-end toll (`musicKill()` — the granted fight-long silence contained as support;
  attacks quantize to `getBeatClock` from here). A dark flicker crosses the lane; the bell
  fades in ABOVE the frame already mid-swing — only the flared lip + 3 chain links dip
  into view (y≈24, rel 20) — sweeping PERPENDICULAR across the lane over the dragon: a
  cross, never an overtake. At the apex, bullet-time; the stock overtake framing already
  pitches up at a y≈24 boss (no new pose endpoints): the bell mouth fills the top of the
  screen, the candle-slit snaps on HDR, and the bound clapper swings out of the mouth and
  LIFTS ITS HEAD — the drooped sphere tilts up, straps catching candlelight. Rider owns
  the vertical (yaw clamp can't): "Above us — there's someone inside it." The dragon
  strains at the clamp anyway. Snap; the bell wheels down to station, still swinging.
  Keep the body above y≈22 (near-plane clipping); mid-fight the chain-thins-into-empty-sky
  look-up is a free camera-less re-reveal.
- **11 WEFTWITCH** — mantle bust: hooded triangular shroud (extrude, no legs) with 2 pale
  hands only; 6 radial spinneret limbs (2-segment tapered tubes on pivots); WEB: taut
  LineSegments spanning arena to off-screen anchors (overdraw-exempt); gaps visibly stitch
  shut between waves (thread redraw); laserLance = one thread pulled tight → HDR flash;
  rose = woven rosette knots. Parry cuts a glowing thread → stagger. Descends from ABOVE
  on one thread. Moth-grey 0x1e1c22 / rose 0xd88098. ~1.8k tris. NEEDS: above-approach +
  `top` warning direction (§5e).
  ENTRANCE (§5j *The Mended Banner*, hijack 2.2s @0.35): ambient ~2s, fully playable —
  thin rose threads lace across the HUD chrome (DOM/SVG above chrome, below bullets — her
  granted §5f break), needle-pull sfx. The banner slides in on time, dir top, and is
  LEGIBLE first (so 12's silence still shocks) — then a thread LASHES across it,
  cross-stitching the epithet mid-word; the banner pins half-deployed, quivering
  (`suppressAutoHide`; cleared on skip/enterFight/resetBoss). Hijack: HARD CUT to the loom
  reveal (the thread exits BEHIND the banner — UI↔world registration matters for zero
  frames): she hangs small at frame top, thread-fan widening to full frame width; her two
  working hands STOP; one long pale finger points straight DOWN at the dragon. She drops
  the single thread to station as the camera returns; the stitched banner tears free; the
  HUD comes back PRE-STITCHED at settle; plucked-string note per thread. This spends her
  one rule-break as the primary beat — the fight never re-stitches a second banner.
- **12 ONEWING** — EITHERWING survivor at ×2.2 scale, permanently listing ~12°: one vast
  8-blade wing (Ashtalon kernel, oversized), one atrophied 2-blade stub; the dead twin's
  kite frame fused across the chest as a pure-black EdgesGeometry wireframe ghost
  (eyeless); its old bead-thread hangs snapped. Mirrors your last dodge into the next
  volley. Ashen-rose 0x241418 / blackened silver / ghost stays black. ~2.6k tris.
  ENTRANCE (§5j *The Grave It Carries*, hijack 2.6s @0.45 — the verify pass's only outright
  PASS): warn suppressed (`def.noWarn`, its granted break). Ambient lead-in: ashen-rose
  wall tint + fog-floor drop; an arrhythmic double wing-THUMP heard BEHIND. It climbs from
  behind-below to draw level ~12m off the LEFT flank — one beat, never a pacing state
  (9 owns alongside-as-state). Side-slew inside slow-mo to a profile TWO-SHOT (the shipped
  midpoint-look frames it): dragon foreground right, ONEWING filling the left half,
  listing 12°; the vast wing gives one THUMP, the stub twitches; it visibly sags and
  re-lifts between beats (rubato in motion). Gaze script: the single eye finds dragon and
  rider — `setDragonLook` holds them looking back (the mutual gaze is ITS claim) — then
  the eye DIMS and drops to the black wireframe frame fused across its own chest, then
  returns to you. Rider: "The twin. It kept the body." It folds and DROPS out of frame;
  camera home; TWO SECONDS of silent normal play; then it ERUPTS from the fog floor at
  rel +50 already at station and the DANGER banner fires WITH the eruption. No rear view,
  no pull-ahead, ever. Skip fires the pending late banner immediately (a skipper still
  gets the canon jump-scare); slow-mo window must not reach u=1 (leak gotcha).
- **13 EMBERTIDE** — the horizon attacks: 3 frame-wide thin light-bands (long flat planes,
  additive, staggered z, UNstacked vs camera → inside the overdraw cap since they replace
  the sky) + a FACE surfacing as dark relief bumps pushed through the glow (brow/nose/chin
  silhouette masses, opaque). Vertical constriction: ceiling/floor light-bands close in
  (new constrict axis). Sky grade shifts a biome early. Vermilion→rose gradient / dark
  relief. ~1.2k tris + postfx. NEEDS: vertical constrict + full-frame emitter rows (§5e).
  ENTRANCE (§5j *The Sky Comes Loose*, hijack 2.2s @0.30): the grade seeds at WARN-START
  (`bossGradeTarget` already fires there; the biome-early version upgrades in when
  `getBossEta()` ships) — the sunset ahead fattens, wrong-colored. Honest banner via the
  new `'horizon'→'top'` dir mapping. The horizon-lift runs in the flythrough's FIRST
  segment (boss visible, skippable): the lowest band separates from the ground line, a
  slit of dark under-sky opening beneath it; rider: "That's not the sun setting. It's
  getting up." Then the three bands rush rel 380→60 STAGGERED (anti-smear), overflowing
  BOTH portrait edges — never fits the frame (escalation guard); two eye-hollows tear open
  as darkness in the glow and settle on the dragon; title card. Ceiling/floor bands ignite
  as COSMETIC rig nodes at settle — the real y-constrict + letterbox squeeze are saved for
  the fight's first CRESCENDO SET (a free §5j re-entrance). Low-pass muffle the first time
  its light-shadow crosses the dragon. MANDATORY: crossfade the real sky dome during the
  lift (one sky, never two) + overdraw audit with all three bands + any fever volume.
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
  ENTRANCE (§5j *Don't Move*, ZERO camera hijack — 1.2s dilate @0.28 only): one biome early
  a single held choir partial joins the station mix (`getBossEta()`, or cut). Fight start:
  landmark handoff (`secondSun.handoff()`) — the disc hangs huge above the lane; the lane
  runs straight into its shadowed sky; false-night grade + hard-edged shadow become the
  stage-1 arena state. HUD hides; the banner strikes HONEST and on time, from top:
  I — THE UNMASKED. Then, chase cam frozen: the lid peels fully open and the revealed
  pupil — an HDR white almond wider than the lane — tracks the dragon's lane-x with a
  heavy wet ~0.35s lag. The player steers, and the sky steers after them: they PERFORM
  the read with their own stick (continuous live stick-tracking is this slot's EXCLUSIVE
  claim). Rider, whispered: "Don't move." … "It's watching us." (both lines
  dragon-directed — the granted ADDRESSED line stays banked for stage 3). At window end
  one fast saccade snaps the pupil dead-center (guarantees the read for players who held
  still); the aperture contracts once — the lid is the §4b carrier, and this debuts its
  NOTICE channel. Title card, stage-1 station. After thirteen entrances of escalating
  motion, nothing moves but its attention: the stillness is the point. Run under the
  existing `flythrough` phase name (gaze exclusion for free); self-feed `setGaze` with
  lag + saccade; rider yaw is pitch-less — never fake a look-up.

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

- **COLOSSI (small):** new `SETPIECE_PATHS` entries (dive-under, side orbit, figure-eight;
  registry at ~:164); a NON-suppressing moving-station branch (setpieces currently hold
  fire — ~:721-730); `approachFrom: 'below' | 'above'` branches (~:455-463) + a `top`
  warning-banner direction (CSS, shipped). EITHERWING needs zero hit-model work (shared
  pool, crossfire emitters). PLUS the §5j entrance engine: the `ENTRANCE_SCRIPTS` registry
  (generalize `updateFlythrough` on the Q1 data/machinery split) and the `setOvertake`
  state generalization (pose endpoints + pivot/blend + fov as per-boss data) — both land
  WITH SLOT 5, alongside the §5i phrase machine (one "engine slot" session).
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
   - **Wiring (L148):** the aimed/head-origin patterns emit from a named body part via
     `def.muzzle` (e.g. `'skullGroup'`) — resolved per-frame through `model.partWorldPos(name)`
     (on every model handle) into the bullet frame (`rel = -w.z - player.dist`). Aim solves
     against that origin's `rel`, not the pose centre. Un-opted bosses (no `def.muzzle`) fall
     back to the pose centre, byte-unchanged. Lane-shaped patterns (iris/tunnel/curtain) keep
     their lane geometry. All bullets also SPAWN-IN (`CONFIG.BOSS.spawnRampT`, ~0.12s) — a fresh
     bullet grows from a point to full size instead of popping, so nothing "materialises".
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

## 5g. THE PROGRESSIVE GEOMETRY BUDGET (user directive, 2026-07: spend the hardware)

The measured ceiling (L126: a real phone held ~58fps at 400k tris / 415 animated draws;
overdraw is the ONLY cliff) is ~10× above even the ladder below — grandeur must be VISIBLE
in the geometry, not just the behavior. Budgets now RISE per band; the §5d sheet numbers are
MINIMUMS, and builders are expected to spend up toward the band budget on: facet/relief
density, more organs/animated parts, richer wing/coil/wheel segment counts, bigger destructible
assemblies, and extra pose articulation — NEVER on stacked additive volumes (the overdraw law
is absolute at every band; ≤2 large additive shells on screen, always).

| Band | Tri budget @q1 | Visible-draw gate | Move-set richness |
|---|---|---|---|
| SENTINELS (1–2, shipped) | ≤4,000 | ≤34 | 3-move core, 2–3 cards |
| COLOSSI (3–5) | 5,000–8,000 | ≤50 | 4-move core, 3–4 cards, 1 setpiece |
| CALAMITIES (6–9) | 8,000–14,000 | ≤70 | 4–5 cards, multi-part bodies/adds |
| WORLD-ENDERS (10–13) | 14,000–22,000 | ≤90 | 5–6 cards, world-state beats |
| THE APEX (14) | ~30,000 across stages | ≤120 | the roster exam |

Rules: (1) `tests/boss.mjs` gates become per-band ceilings keyed off `def.tier` (lands with
the first Colossi build; the flat 6,000/34 gate applies only to tier-1 defs thereafter).
(2) The quality ladder still applies — `tris(q0.5) < tris(q1)` stays a gate, and lowQ drops
must scale with the bigger bodies (segment counts, card density via the SOP's *Low dials).
(3) Draws stay cheap but not free: no InstancedMesh for animated matrices (L126), and any
single merged mesh over ~20k tris should be split so the dissolve/flash material tiers stay
per-region. (4) If a build sheet's concept doesn't NEED its band budget, spend the surplus on
its dread-move spectacle (more simultaneous animated parts during the named card) rather than
static filler — richness players see mid-fight beats richness in the idle silhouette.

## 5h. PRODUCTION DEFAULTS (gap-audit adoptions + owner decisions, 2026-07)

Owner decisions (locked): **(1) LIFETIME LADDER** — ladder progress persists across runs; a
run's first boss = the lowest unbeaten slot; beaten slots recur with tightened dials; a felled
slot never repeats within one run. The band-aware progression controller replaces
`bossDefForIndex`'s modulo with slot 6 (hard blocker for Tier-3 foreshadowing). **(2) MUSIC
LAYERS OVER THE STATION, never replacing it** — boss entry ducks melody layers (keeps
bass+percussion), adds a dread-pad, desperation forces the top layers; restores under the
existing defeat fanfare. The player's (partly purchased) Dragon Radio stays theirs.
**(3) LOCAL-ONLY card stats** — see §5f.

Adopted defaults:
- **Card/save schema**: defs gain `cards: [{ id (stable, never the display name), name,
  atFrac, timer, attacks, dials, survival?, dread? }]` — timeout snaps hp past `atFrac`
  (the deterministic escape hatch); exactly one `dread: true` card, always last. Save bumps
  to array-form collections (`cards: [[cardId, captures, survivals]]`,
  `bossLedger: [[bossId, kills, deathsTo]]`) written from the existing `bossDefeated`/death
  event seams. Defs-lint adds name-length budgets (name ≤12, epithet ≤34, card lines ≤16/24).
- **Machine-readable tiers**: `def.tier` 1–5 required, registry-consistency assert; the §5g
  ladder becomes `TIER_BUDGETS` in tests/boss.mjs (tier-1 hard gate stays 6,000/34; shipped
  Sentinels sit at 2.7–3.6k). lowQ contract as RATIOS: q0.5 ≤60% band tris / ≤70% band
  draws; card *Low dials ≤75% bullets. A headless additive-coverage audit lands with the
  first Colossi build.
- **Build order (§5b is a queue)**: slots ship in strict registry order — claim only the
  lowest open slot. Pulled-forward tracks: card system + Tier-1 card retrofit with slot 3;
  the ladder controller with slot 6; per-boss kill/death stat accrual with slot 3 (slot 9's
  taunts need real data by then); second-sun seeding with slot 10. Each band's §5e
  extensions land with that band's OPENER.
- **Fight economy**: TTK targets per band (Sentinels 60–90s → Apex 5–6min; Boss Rush at
  0.75× hp, gauntlet ≤20min) enforced by a headless DPS-sim duration gate. One shield per
  phase stays the invariant (phase count is the scaling knob); Tier 3+ shields get a
  surge-immune wind-up so banked surges can't chain-skip phases; graze banks normally during
  survival cards; nonstandard shields (THRUMSWARM's ring) must still expose a surge answer.
- **Rewards & feats**: `defeatScore = hpMax × 25`, `defeatEmbers = 40 + 20 × tier`, one-time
  2× first-kill ember bonus; card captures pay SCORE only (+400 × tier — embers stay out of
  skill loops). Feats are band-scaled templates (per-band first-fell/no-hit, per-boss
  all-cards title drawn from the epithet, two roster-wide apex feats) — boss PRs add zero
  new feat ids.
- **Death & retry**: a revive resumes the SAME fight (hp/phase retained, live bullets
  cancelled with the card-entry flash, 1.5s i-frames); Boss Rush gets one retry-this-boss
  per gauntlet (invalidates bestClearMs); encountered-but-unbeaten bosses become pickable as
  rewardless solo practice.
- **Roster audio**: §5b gains a VOICE column (one waveform family + register + signature
  noise per boss; one 4–8 note motif per BAND, not 14 themes). Telegraph cues are keyed by
  ANSWER VERB (mirroring the role-color law), wired once at the telegraph-class hook. One
  band-scaled stinger kit (~7 procedural one-shots). Rhythm slots get optional `def.bpm`.
  LAW: every fairness- or foreshadow-bearing cue has a synchronized VISUAL twin — muted play
  (and slot 10's music-death break) never loses information.
- **Biome pairing & foreshadow artifacts**: §5b gains a Home-biome column
  (value/temperature complement — pale bosses over dark skies); the ladder controller snaps
  encounters to fixed offsets so biome-early foreshadowing is authorable; every band opener
  owns exactly ONE foreshadow artifact (glint / audio / sky-grade channel) listed in its §5d
  NEEDS line — ASHTALON takes the Tier-2 glint on the fauna-flyby seam.
- **Fairness baseline vs the dragon gacha**: all tuning validated at the roster-worst
  handling multiplier; bullet hit radius fixed to CONFIG playerRadius regardless of dragon
  model (premium dragons may only make fights EASIER); last-chance slow-mo fires on boss
  bullets; glideAssist becomes a wider forgiveness bubble during fights (never auto-fly);
  assisted captures count but carry a ledger flag.
- **Colorblind redundancy**: role is never hue-alone — parryable amber gets a distinct
  marker silhouette, reflected cyan a directional trail; bulletcontrast.mjs gains the three
  dichromacy matrices as a role-pair distance gate.
- **The second sun's schedule**: seeded permanently at the first Calamity kill with a
  scripted 4s first-appearance beat; fixed ~22° off SUN_DIR, fog-exempt, static within a
  run; escalates by LID APERTURE only — one notch per band cleared, never blinking, only
  ever opening further; the half-open "it turned" beat lands after slot 13.

## 5i. COMBAT FEEL — RHYTHM SIGNATURES, THE GRAZE LADDER, THE PARRY ECONOMY (2026-07)

Ground truth (measured from code, master @ a2001b9): **the ping-pong is real and quantified.**
All shipped bosses share one temporal envelope — tell 0.5–0.72s → volley 1.1–3.0s in flight →
FLAT-UNIFORM rest 1.3–2.5s → repeat ~16–22×/min. Attacks are strictly serial (never overlap),
the cadence roll is uniform-random with no anti-repeat, there are no bursts, doublets,
accelerando, call-and-response, or music coupling — the music engine owns a real private beat
grid (per-track bpm, eighth-note scheduler in sfx.js) that nothing exports. Cross-boss cycle
means span just 2.35–3.5s: the roster differs in DENSITY, not in RHYTHM. Likewise graze has
one active form (the shield bait-donut flood — everything else is incidental), and for a
dodge-only player EVERY kill is 100% rider chip; ASHTALON P3 is the first shipped phase with
ZERO amber (parry mechanically dead outside Surge). This section fixes all three.

### A. RHYTHM SIGNATURES (kills the ping-pong)

**The phrasing engine** (attach points are the cadence roll + attack pick, `boss.js` ~:1087 and
~:1092-1102, plus a `getBeatClock()` export from sfx's existing private grid — lands with the
slot-5 build; shipped-boss retrofits are pure def data):
`def.rhythm = { signature, phrase: [...attack-slot patterns with gaps], restLo/restHi + rest
DISTRIBUTION (uniform | bimodal | decaying), burst: {count, gap}, ticket: {bpm-quantized} }`.
Rules: the phrase machine may double/triple attacks into strings (bursts) and insert authored
rest measures; two bosses may not share a primary signature; a headless `rhythmprint` test
simulates 60s per phase and asserts the inter-attack-gap distributions of any two bosses
differ (KS-distance floor) — variance becomes CI, not vibes.

**Allocation (primary signature per slot — registry column; shipped three retrofit as data):**
| Slot | Signature | The feel |
|---|---|---|
| 1 VOIDMAW | METRONOME | fixed-pulse turn-taking — the teacher; tension = consistency |
| 2 STORMREND | CRESCENDO | one ramp per card: sparse → dense → HARD CUT at capture |
| 3 ASHTALON | AMBUSH–REST | long circling silences (2–4s), sforzando stoops; the rest IS the dread |
| 4 MARROWCOIL | BURST-vs-SUSTAIN | coil sweeps = continuous stream texture; rib slams = discrete wall bursts; the ratio shifts per phase |
| 5 EITHERWING | CALL-AND-RESPONSE | twins alternate A-B phrases; the eye handoff is the baton; overlapping only at the dread card |
| 6 HOLLOWGATE | VERSE–CHORUS | door-prayer verses (low aimed murmur) alternating rose-window chorus set-pieces — the Touhou nonspell/spell macro |
| 7 THRUMSWARM | PRESSURE OSTINATO | no true rests; micro-pauses live INSIDE the swarm's condensation cycle |
| 8 BRINEHOLM | TIDAL DRONE | sustain-only, slowest pulse in the roster — breathing-rhythm swells; the relief texture |
| 9 KARNVOW | AGGRESSION EXCHANGE | your parries steal its tempo — rallies reshape its phrasing; initiative wins |
| 10 KNELLGRAVE | MUSIC-LOCKED | the toll is the only clock (music is dead); attack-ticket quantization to the bell's accelerating beat |
| 11 WEFTWITCH | SYNCOPATED LOOM | quantized grid with off-beat accents — threads land BETWEEN the beats you learned |
| 12 ONEWING | RUBATO / FEINT | the roster's ONE broken-meter boss: held wind-ups, denied downbeats, grief as arrhythmia (fairness rules: delays are FIXED per attack, animation-held, never randomized) |
| 13 EMBERTIDE | CRESCENDO SETS | Stormrend's ramp QUOTED in repeating wave-sets (designed echo — the gale was its leash), each set cut harder |
| 14 UNMASKED | THE MEDLEY | quotes each felled boss's signature per stage — the rhythm exam |

Rest-beat law: rests are authored, not residual — every signature defines what its rest looks
like (Ashtalon circles, Brineholm breathes, Knellgrave's clapper swings silent). Sequencing
law: adjacent slots never share attention TYPE (reading-load vs execution-load).

### B. THE GRAZE LADDER (fresh proximity verbs per band; all feed the Surge meter)

Cross-cutting laws: dedup discrete / tick continuous (one graze per bullet; per-frame ticking
only for beams/pockets — kills parking exploits); annulus not radius (a too-close edge always
exists); reward bands are DRAWN in-world (pink sheaths/annuli — rail depth is hard to judge);
payout richest at the scariest instant; reset-on-hit with a mercy shield at max.

| Band | New graze forms (debut slot) |
|---|---|
| Sentinels (shipped) | buzz tick · shield bait-donuts · tunnel/iris center-skim |
| Colossi | **SLIPSTREAM** (3: ride the stoop's wake — a moving safe pocket with collision walls) · **THREAD-THE-GAP scored by clearance+lateness** (4: the ribs — tighter+later = bigger chunk, consecutive threads chain) · **ORBIT ANNULUS** (5: co-rotate with the figure-eight inside a drawn band; a full unbroken lap = +1 level + i-frame pulse) |
| Calamities | **RIDE-THE-BEAM-EDGE** (6: per-frame ticks that RAMP with unbroken contact) · **ABSORB-A-COLOR** (7: the swarm sheds surge-pink motes braided into magenta — weave in and soak) · **SHADOW-RIDE + SPRAY-SOAK** (8: the whale's lee vs geysers; freed shackles vent a 2×-value pink spray for one beat before hardening lethal) · **HOLD-UNTIL-FLINCH** (9: proximity-tiered chips for holding the lance line to the flash) |
| World-Enders | **SHRINKING SAFE DISC** (10: toll-ring pockets — escalating ticks, bail on the last beat) · **CANCEL-CONVERT MOTE HARVEST** (11: cut threads bloom into falling motes; steer the bloom) · spray-soak escalation (12: breaking the dead frame) · **TIDE-EDGE + FACE-SHADOW POCKET** (13) |
| Meta spine | **NO-HIT ADRENALINE LADDER** (global, lands with slot 6): 5 rungs per-fight (magnet → +gain → weak-point ping → +burst → one-hit shield), reset on hit · **TRICK-LINE LINKING** (lands slot 10): chaining DIFFERENT forms multiplies; repeats decay |

Law: every §5d sheet names its band's graze form as ANATOMY (the form is a body part's
geometry, not an abstract zone) and its card set offers it at least once per phase.

### C. THE PARRY ECONOMY (no more chip-and-wait)

**The seven diet laws** (enforced, not aspirational):
1. **AMBER FLOOR (CI gate `amberdiet` in tests/boss.mjs):** every rolling 12s window of every
   phase contains ≥1 amber volley; ≥20% of aimed-class emissions per phase are amber.
   *Immediate hotfix: ASHTALON P3 currently 0% amber — amber-tip every 4th stream tick.*
2. **Registry column "parry job":** each slot declares its amber-carrier move + which mechanic
   it feeds; distinctness review diffs parry jobs like verbs.
3. **Amber is ANATOMY, never paint** — sourced from a named organ with its own tell; the
   silhouette predicts amber before the color confirms it.
4. **Chip always progresses; parry ACCELERATES** — target: parry-literate ~30–40% faster,
   perfect-parry ~50% (validated by the TTK DPS-sim). Outside ≤2 reflect-only seals, no HP is
   parry-gated.
5. **Per-volley ROI caps** (a wide fan must not trivialize any economy).
6. **NEVER punish declining** — every amber is cleanly dodgeable; rewards are speed/style/
   resources, never penalty-avoidance.
7. **The dread move feeds the diet** on ≥4 slots (its counterintuitive answer is a parry read).

**Adopted globally:** PERFECT-PARRY HEAL — a perfect parry restores 1 HP pip, capped 3/fight
(the Furi law: make parry players feel loved; cap kills farming).

**The parry ladder (≤1 new mechanic debut per band, then reused):**
| Band | Debut mechanic |
|---|---|
| Sentinels | base roll-reflect + perfect tier (shipped) |
| Colossi | **ORGAN BREAK** (4: parry a rib-slam's ambers N times → that rib CRACKS, its pattern component deleted — parry as sculptor; reused at 5 on the eye-holder) |
| Calamities | **TENNIS RALLY + REFLECT-ONLY SEAL** (9, the showcase: it bats your cyan back as one big returnable orb, faster each return; its seal phase makes parry temporarily the only gun with a guaranteed amber diet — the ≤2 seal budget lives here and at 14) |
| World-Enders | **RHYTHM PARRY CARD** (10: a named card announces a 4–6 amber chain on the TOLL's rhythm — parry the whole chain on its beat) · **BEAM DUEL** (13: Surge ≥50% lets you fire INTO the tide's crest — hold lane-center against drift while beams lock) |
| Apex | **STAR PIPS** (perfect parries bank ≤3 stars that multiply the final stage's Surge damage; all lost on a hit) + the medley demands every prior read |

Reserves (designed, unallocated): poise bar, amber bank, zandatsu lane, overload reload,
rally regain — post-roster or NG+ material.

**Engine cost ledger additions (§5e):** phrase machine + rest distributions at the cadence
seam (LOW); `getBeatClock()` export from sfx (LOW); graze detection branch for lingering/
continuous forms — the current single-frame rel-crossing check needs a ticking sibling with
its own dedup story (MEDIUM, lands with slot 6); clearance-scored thread + annulus math
(LOW, per-boss); `amberdiet` + `rhythmprint` CI gates (LOW); organ-break part HP reuses the
§5f destructible-sub-part plumbing (already costed).

## 5j. ENTRANCES & PRE-FIGHT THEATER (the entrance grammar, 2026-07)

The ASHTALON overtake (rear-view swing + bullet-time close pass + mutual glance) is the
owner-confirmed highlight of the roster. Principle 7 ("the entrance is the share moment")
now grows into a SYSTEM: one authored, identity-stating entrance per slot, escalating per
band, drawn from a shared beat vocabulary and enforced by uniqueness claims — exactly the
spell-card/rhythm pattern. Research base: rail-shooter lineage (Star Fox ace arrivals,
Ace Combat callsign-before-contact, Sin & Punishment terrain-wakes), spectacle canon
(Radahn, SotC first sightings, Monster Hunter turf reveals), subversion canon (Sans,
Dimitrescu's distributed stalking), player-interaction canon (Titanfall 2 Viper, Baldur's
doorstep). Full concept/verify record: session workflow 2026-07 (26 agents, adversarially
verified against `boss.js`/`cameraController.js` as shipped).

### The entrance laws

1. **State the primary read before the first shot.** A player who skips everything still
   knows what this boss IS. The entrance performs the boss's grammar (Radahn's arrows teach
   "closing" before he's visible) — never a generic roar. Strength claims decay across 14
   slots; identity compounds.
2. **One claim, one camera move.** A second simultaneous idea turns 3 seconds into noise.
3. **The player never loses stick control.** HUD may hide, time may dilate, camera may
   move — the dragon still flies. (Cuphead lets you move during the card.)
4. **Tap-to-skip always** (`input.surgeTap` → `skipTo`); the skip path must land at station
   with the read intact and all state released (slow-mo, banner pins, pending late banners).
5. **No boss fire during the beat** (the Mantis rule).
6. **One camera hijack per fight, spent at the entrance.** Ambient world beats (audio, sky
   grade, fog) may start biomes earlier; the hijacked-camera portion is ≤ ~3s wall.
7. **The motion vector is the sentence:** toward you = threat, past you = superiority
   (SPENT on 3), indifferent = discovery, above you = judgment, still = attention. Pick one.
8. **Cast the avatar deliberately, one role per boss** — target, witness, addressee,
   co-star, prey, performer. The dragon+rider reaction is this game's crowd-shot and it
   PRECEDES spectacle by ~1s (Spielberg: hold on Grant's face first). The yaw clamp is
   ±0.7 rad and yaw-ONLY — the rider LINE owns anything vertical.
9. **Banner subversions are rationed rule-breaks** (§5f): late/NO banner belongs to 12,
   the stitched banner to 11. Everyone else's banner is honest and on time.
10. **Re-entrances are free spectacle:** phase transitions may reuse entrance machinery for
    a second reveal (Radahn's meteor) at zero new plumbing cost.

### The beat vocabulary (all verified against shipped code)

- **Camera:** `setOvertake` per-frame hijack (replaces the whole frame; branch early-returns
  so shake/kicks are dead inside it, `cameraController.js:193-211`); dormant `rearView(dur)`
  (`:107` — defined, never called, composes OVER chase); bullet-time
  (`game.slowMoTimer/Scale`, engage/release discipline below); FOV envelope (intro eases
  74→58; overtake forces 80 — per-boss fov becomes state data in the generalization).
- **World:** `bossGradeTarget` sky/grade channel; fog-floor rises (y from −8, deeper per
  def); arena wall accent; audio foreshadow (NEEDS the `getBossEta()` getter — does not
  exist yet, `nextBossDist` is module-private `boss.js:40`); `musicKill()` (slot 10's; via
  the bgSuspend silence path — `music.stop()` can't cut mid-phrase, scheduled notes ring).
- **Relationship:** dragon+rider look-yaw (`main.js:1096-1102` — today only fed while
  `overtakeState` is live; the entrance-look fallback seam generalizes it); rider callout
  (`ui.bossNote`) for direction the yaw can't reach, scale, lore recognition, and absence;
  `setGaze`/`notice()`/`setEyeLock` model hooks (optional-chained, no-op elsewhere).
- **Announcement:** `ui.bossWarning` directional banner (honest default; `dir` from
  `approachFrom`, `'horizon'→'top'` mapping to add); title card at `enterFight`; the banner
  self-hides on a WALL-clock timeout (`ui.js:904-907`) — delayed banners must pass a
  shortened dur.
- **Builder gotchas (all bit somebody in verification):** a new phase name must join
  `placeGroup`'s gaze exclusion (`boss.js:1158`) or it stomps scripted `setGaze`;
  `releaseCineSlow` must fire on skip AND window-exit AND `resetBoss` — a leak leaves
  `slowMoScale` poisoned so later near-death slow-mo runs at the wrong depth; script clocks
  are SCALED seconds (`CINE_DUR 1.32 ≈ 2.5s wall`); rush mode replays entrances every loop —
  stat/novelty beats need a shortened repeat variant; `skipTo` must resume at station or the
  fight strafe pops.

### The band entrance ladder

- **SENTINELS — announced arrival.** Banner + one warn-window accent (a look, a grade, a
  sound). No hijack. (Retrofits below.)
- **COLOSSI — one full cinematic beat.** The camera or the sightline moves; the boss
  performs its core mechanic on YOU before the first volley. (3 = the exemplar.)
- **CALAMITIES — the scene assembles on camera.** Multi-part bodies condense/surface/ride
  alongside; the world is a participant; the personalization arc opens (9 reads your save).
- **WORLD-ENDERS — the arrival is subverted.** What breaks escalates per slot: 10 the
  soundtrack, 11 the HUD chrome, 12 the arrival grammar itself, 13 the horizon.
- **APEX — the entrance started biomes ago.** After thirteen entrances of escalating
  motion, 14 moves NOTHING but its attention. The stillness is the point.

### The entrance registry (primary beat + avatar role are CLAIMED, like silhouettes)

| # | Boss | Entrance (title) | Primary beat | Avatar role | Hijack |
|---|---|---|---|---|---|
| 1 | VOIDMAW | *Don't Look Back* (staged retrofit) | reaction-precedes-banner | the stalked | 0s |
| 2 | STORMREND | *The Storm Arrives Before the Eye* (staged) | sky-announces | the witness | 0s |
| 3 | ASHTALON | *The Overtake* (SHIPPED, exemplar) | rear-view overtake + eye-lock | co-star | 2.5s |
| 4 | MARROWCOIL | *Count the Ribs* (staged retrofit) | scale-by-count (audio) | the measurer | 0s |
| 5 | EITHERWING | *The Baton Cross* | eye-handoff across your sightline | the crossed | 1.6s |
| 6 | HOLLOWGATE | *Vigil Lights* | pane-by-pane face ignition | the watched | 0s (banked) |
| 7 | THRUMSWARM | *The Shape It Remembers* | condense-into-YOU + glance-back | the subject | 2.8s |
| 8 | BRINEHOLM | *The Reef Was Breathing* | terrain-inhale rise | the discoverer | ≤3s |
| 9 | KARNVOW | *It Kept Count* | save-file taunt at flank hold | the addressee | 2.8s |
| 10 | KNELLGRAVE | *It Lifts Its Head* | music-kill + overhead cross + clapper notice | the passed-under | 2.6s |
| 11 | WEFTWITCH | *The Mended Banner* | HUD stitched, banner pinned | the user | 2.2s |
| 12 | ONEWING | *The Grave It Carries* | grief two-shot → vanish → late-banner eruption | the blamed | 2.6s |
| 13 | EMBERTIDE | *The Sky Comes Loose* | horizon detaches and rushes | the engulfed | 2.2s |
| 14 | THE UNMASKED | *Don't Move* | the pupil follows your stick; camera frozen | the performer | 0s camera (1.2s dilate) |

Full choreography lives in each slot's §5d sheet (`ENTRANCE:` line). Uniqueness rulings
from the adversarial pass (binding):
- **Continuous live stick-tracking is 14's exclusive claim.** 6's pupil-pane moves in
  DISCRETE wedge-steps sampled only on ignition beats — architecture ticking, not tracking.
- **9 never turns its cowl** (indifference is the taunt; lance points without looking);
  **12 owns the mutual-gaze profile two-shot** — that's how two "alongside" holds differ.
- **Rear-view-overtake is 3's forever.** 12 approaches from behind but: no rear camera,
  no pull-ahead, it drops AWAY. 7's glance-back is the COPY quoting YOU — camera stays
  forward; reads as homage, not reuse.
- **11's banner must be legible before the stitch lands** so 12's total silence still
  shocks (consecutive banner rule-breaks, both granted).
- **13 is the sky in maximum motion; 14 is the sky perfectly still** — the strongest band
  boundary in the roster. Protect both extremes.
- **8 spends the roster's one environment-wakes archetype.** 6 vs 8 ("scenery was alive")
  is band-coherent on opposite axes: ahead-architecture ignites vs flank-terrain inhales.
- **Escalation guards:** 5's bead-thread cross must span the FULL portrait width or the
  slot reads as a step down from 3; 9's charm-flare-matching-your-top-killer beat is
  MANDATORY (without it 9 is the weakest entrance in the roster); 13's bands must overflow
  both portrait edges — never fit the frame.

### Staged retrofits (slots 1/2/4 — shipped bosses, inert until a polish pass)

Chosen for reveal-grammar spread (Wrong-Way / sky-announces / Measured Giant). All hang off
three hook points only (warn-entry block, `bossStart`/`bossEnd` events, post-warn approach);
nothing touches enterFight, phases, or fire; each is dead code without its def field.
- **1 VOIDMAW — *Don't Look Back*:** warn opens SILENT; the dragon's head snaps back and
  STRAINS at the clamp (it cannot find the thing — it's dead behind, the one place yaw
  can't reach); rider: "Behind us. Don't look — fly." Banner slides in at T+0.7 (shortened
  dur — wall-clock gotcha) — the UI *confirms* what the dragon already knew. Look releases
  as the mask passes overhead. `def.entranceNotes = {riderLine, lookStrain, bannerDelay}`.
- **2 STORMREND — *The Storm Arrives Before the Eye*:** on `bossStart` the grade lerps
  storm-teal; two sheet-lightning pulses (≤15% luma, teal ONLY — never the damage-flash
  hues) each answered 0.3s later by thunder; the rings sweep into a sky that already
  belongs to them. `def.warnGrade = {tint, pulses}`.
- **4 MARROWCOIL — *Count the Ribs*:** warn = rider line 1 + low bone-clatter; at the fog
  breach one huge sub-"whoom" as the lure clears the fog line; rider recognition: "…that's
  a SKELETON." (points the whose-bones lore gap, never answers it); then one dry CLACK as
  each of the 5 rib pairs crests — five ticks counting out a body the portrait never holds.
  Decorates the shipped rise, retimes nothing. Threshold triggers latch once per rib (the
  coil sine re-dips segments — no re-fire); reset per encounter. `def.riseBeats`.
- Alternates on file with user-veto flags: V3 rear-glance (grazes 3's signature — dormant
  `rearView` seam, first use roster-wide), S3 false-alarm double-take (misdirection
  rationing). Ship the three above first, judge on PR preview, one def field at a time.

### Engine additions this section costs (append to §5e ledger; lands WITH SLOT 5 unless noted)

- **`ENTRANCE_SCRIPTS` registry** — generalize `updateFlythrough` (`boss.js:798-853`) on the
  verified Q1 split. Per-boss DATA: path `fn(u)→{x,y,rel}` terminating at
  `(0, fightHeight, settleGap)`, `skipTo`, slow-mo window `{uIn,uOut,depth}`, yaw script,
  gaze formula, pose/tuck envelope, announce + rider lines, camera envelope params. SHARED
  machinery (already shipped, stays in boss.js): warn→script phase plumbing, skip, slow-mo
  engage/release + sentinel, `setOvertake` feed, HUD hold, `enterFight` handoff, `resetBoss`
  abort. Coexist: defs without `def.entrance` keep today's approach byte-identical. (MEDIUM)
- **`setOvertake` state generalization** — move the hardcoded rear-look pose endpoints,
  pivot/blend (0.60/0.32, `cameraController.js:197`), lookTarget weighting, and FOV target
  into the state object. Prerequisite for every non-Ashtalon hijack. (SMALL)
- **Entrance-look fallback** — a boss-published look target consulted in `main.js`'s else
  branch (today `setDragonLook(null)` stomps every frame overtake is inactive). Needed by
  the retrofits, 6, 8, 12. (SMALL)
- **`getBossEta()` getter + scheduled emits** — makes audio foreshadow real (10's toll,
  14's choir partial; the §5e WORLD-ENDERS item, now concrete). (SMALL)
- **`musicKill()/musicRestore()`** — hard-zero `musicBus` via the bgSuspend path; restore on
  fanfare + `resetBoss`. Slot 10. (SMALL)
- **Banner variants** — `suppressAutoHide`/pin + stitched-over state (slot 11, with its
  HUD-sew overlay — MEDIUM); `'horizon'→'top'` dir mapping (13); `def.noWarn` (12, already
  ledgered). New `approachFrom` start branches as data: `'condense'` (7), `'ahead'` (6),
  `'horizon'` (13), `'landmark'` (14). (each trivial)
- **Scoped warn-visibility exemption** — one sub-rig (8's breathing crest) visible during
  warn while the group gate (`boss.js:1146`) holds for the body. (SMALL, slot 8)
- **Taunt-card UI variant** reading `save.js bossLedgerStats` (shipped) + shortened
  rush-repeat variant — 9 ships v1 on `ui.bossNote`, card lands with the §5f cost item.

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
4. `node tools/bossgate.mjs <bossId>` — **THE MEASURABLE-DESIGN GATE** (spec below; the
   implementation is a pulled-forward track that lands WITH the slot-3 build). It automates
   the objective half of design review, because the session record is unambiguous: builder
   self-verdicts are systematically more generous than the gate (CRAGHOLD "I'd defend it"
   shipped a buried pupil, mitten fingers, and toy-green). Iterate against this
   mechanically — it exists so a coding session can converge without taste.
5. **Self-critique against §3 laws + §4 scorecard, then POST CROPS.** A builder session
   never merges on its own verdict: it posts idle/charge/shielded front-on crops to the PR
   and stops. The design pass/fail belongs to the human (or a supervisor session) — one
   cheap look per boss beats one debugging session per shipped mistake.
6. Human judges motion/feel on the PR preview (`?debug&boss=100&bossIdx=N`, `?rush=all`).

### 7b. `tools/bossgate.mjs` spec (the objective design-law assertions)

Boots the bossshot harness for one boss, waits state-based for a front-on FIGHT frame (plus
one mid-charge and one shielded frame), then pixel-samples the captures. Boss screen region =
a box around the projected pose (read `bossState().poseX/poseY` through the camera transform;
exclude the top HP-bar band). All thresholds are per-def overridable via a `gate:` block on
the def (e.g. `gate: { pale: true }` for the sanctioned VALUE-INVERTED slots 4/6/7-queen)
— overrides must cite their registry sanction in a comment.

| # | Law (source) | Assertion on the capture |
|---|---|---|
| G1 | Focal law (§3.2) | max luminance in region ≥ 250/255, AND the ≥240 cluster covers ≤2.5% of the boss silhouette (bright + SMALL = eyes, not a wash) |
| G2 | Dark body (§3.3) | median luminance of silhouette pixels ≤ 90/255 and median HSV saturation ≤ 0.55 (skip when `gate.pale`; then instead assert median ≥ 150 + a dark edge-cage sample) |
| G3 | Palette attribution (§5b axis) | dominant accent-pixel hue within ±25° of `def.accent`; ZERO pixels within the danger-magenta ±15° band outside bullet sprites |
| G4 | Presence (§1 envelope) | boss silhouette covers 8–35% of the frame at the fight hold (not lost, not swallowing the screen); center of mass within the portrait-safe box |
| G5 | Telegraph shape (§3.5) | binarized silhouette mask of the CHARGE frame differs from the IDLE frame by ≥6% of silhouette pixels (telegraphs change SHAPE, not just color) |
| G6 | Shielded read (§5f) | during shield: the G1 bright cluster's luminance drops ≥30% (the eyes visibly leash/hide when invulnerable) |
| G7 | Overdraw law (§2) | traverse the built model: count large additive/fresnel volumes (bounding-sphere screen coverage > 15% at settle distance) ≤ 2 incl. kit shield |

Geometry-level craft asserts that pixels can't see (digit gaps ≥ pitch−width, socket recess
depth, part-size ratio ladder) belong in `tests/boss.mjs` as per-sheet numeric asserts — each
§5d sheet may declare them, and the builder adds them with the boss.

**Delegation protocol (how a Sonnet session ships a boss without a taste gap):** build to the
§5d sheet → `boss.mjs` + `bossboot.mjs` + `bossgate.mjs` all green → post 3 crops to the PR →
STOP and await the design verdict. The gate script is the builder's iteration loop; the crops
are the merge condition. Known limitation, stated honestly: G1–G7 catch the *measurable*
failure classes (toy-color, dead eyes, blob shells, color collisions, static telegraphs) but
NOT "reads as a mitten" / "reads as googly" — that judgment stays human, which is why the
protocol ends at crops, not at merge.

### 7c. THE STUDIO GATE — isolated viewing BEFORE in-game judging (process law, 2026-07)

**Recorded failure (MARROWCOIL build):** design-gate verdicts on in-game captures were
contaminated by the world — biome props behind the boss were judged as boss parts, and
varying camera tilt/pose/distance between rounds produced inconsistent, even contradictory
directives. The fix that worked: an ISOLATED STUDIO environment with consistent framing,
plus explicit permission for the builder to create whatever viewing tools it needs.

**LAW: every boss is judged in the studio FIRST. In-game captures come second and judge
INTEGRATION only.** The two passes answer different questions and must not be mixed:
- STUDIO pass = is the DESIGN right? (silhouette, anatomy, value tiers, expression states,
  articulation) — controlled background, no world.
- IN-GAME pass = does it SURVIVE the world? (contrast against its home-sky per §5b, bullet
  readability, presence at the real fight distance, approach choreography).

**`tools/bossstudio.mjs` spec** (the tiershots/nfview precedent, for bosses; if a branch
already carries an equivalent viewer, adopt and rename it — never rebuild):
- Boots the builder DIRECTLY (buildBoss(def) — no game world, no fog, no biome, no props);
  the game's real lighting rig (sun + hemisphere) and real postfx chain (bloom/ACES — the
  design laws are written against the bloom pipeline, so the studio must keep it).
- Backdrops per shoot: near-dark 0x14121a, pale 0xcfd6e4, and warm sunset-gold 0xd9a24a (L140 —
  warm dark accents vanish against warm skies). **The boss's HOME-value backdrop is the PRIMARY
  verdict (§3b.7, L150):** judge a dark boss on the dark/home backdrop first — a dark boss on the
  pale backdrop is a flat cutout whose relief vanishes (this made BRINEHOLM's sheet read
  featureless and shiplike). The off-value backdrops are the stress test, not the verdict.
- **SILHOUETTE RENDERS (L150, mandatory, judged BEFORE the beauty pass):** per state, also emit a
  pure BLACK-FILL render (identity-hue outline only) and a LIT-EDGE-ONLY render (emissive alone on
  black). §3b's stranger test + anti-reads are checked on these. The beauty contact sheet is
  secondary — if the black fill reads as the wrong noun, the boss fails regardless of its lighting.
- **FIGHT-DISTANCE FRAME (L140, mandatory alongside the contact sheet):** one shot at the
  REAL encounter geometry — camera at the live chase FOV (72) and the boss at its true
  station distance (rel 30, or its own settle rel), NO auto-framing. The 60%-height
  auto-frame normalizes scale and hides presence failures (EITHERWING shipped 4 gate rounds
  looking fine in studio while presenting ~40% of ASHTALON's on-screen mass in game). The
  fight-distance frame is judged for PRESENCE: ensemble span vs the portrait envelope, and
  % of silhouette that emits at that distance.
- CONTACT SHEET per state — one image, four fixed angles (front-on · 3/4 · profile · slight
  top-down), identical framing (FOV 72, camera distance auto-set so the boss spans ~60% of
  frame height), deterministic animation phase (fixed time seed) so round K and round K+1
  are pixel-comparable.
- STANDARD STATES: idle · notice() · setCharge(1) · shielded · the dread-card pose ·
  setDissolve(0.5). Per-boss extra states (setpiece poses, organ-cracked damage states) are
  added per its sheet.
- `bossgate.mjs`'s pixel assertions (G1–G7) run on STUDIO frames — controlled background
  ends the false reads; the in-game pass keeps only the integration checks (G3 palette vs
  home sky, G4 presence envelope).

**TOOL-MAKING IS SANCTIONED AND EXPECTED:** the builder may create or extend viewer/capture
tooling freely (commit under `tools/`, stamp-sw as usual) whenever seeing something clearly
is the bottleneck — tools-to-see are cheap; verdicts made half-blind are expensive. This is
the studio's standing rule, not a per-session permission.

**Updated delegation protocol order** (§7b amended): build → suites green → STUDIO contact
sheets → gate verdict on studio → (pass) → in-game bossshot captures → gate verdict on
integration → (pass) → post both sets to the PR → STOP for the human.

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
- **L162** — THRUMSWARM CP1: a SWARM's identity is the FORMATION (motes carry none alone); the meme frame is a
  point-cloud silhouette authored like a constellation; a migrating focal (queen = swarm-centre → the copy's skull) does
  two jobs with one part; a dark boss needs a LIFTED near-black albedo to read on the dark studio sky (lit facets, no rim);
  G6 fails when the additive shield rim out-blooms the leashed eye — hide the focal core under the shield.
- **L153** — HOLLOWGATE CP1: a faceless architecture face is a per-part emissive STATE TABLE
  (pupil = a different CLASS, notice = a state JUMP, the DEFAULT state carries the registry
  claim); dark decoration on a pale mass forges a second scar; ambient drift can silently
  inflate the G5 telegraph diff.
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
