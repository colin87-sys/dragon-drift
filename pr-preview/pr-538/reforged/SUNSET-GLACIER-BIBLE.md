# THE SUNSET GLACIER — Biome Art Bible (Fable art-composition expert)
(Working copy; folds into WALL-PROPS-REDESIGN.md §4.2 on build.)
Stranger's sentence: "I flew through a doorway of light between two glowing towers of ice, over a golden mirror, and the air was full of sparks."
Theology: cool light lives IN the ice; warm light only ever comes FROM the sun. Honesty rule generates the biome.

## 1. COLOR SCRIPT — last 10 min of a polar sunset; frozen cathedral at vespers; awe via scale+silence.
Hues: BURNING GOLD 0xffa055 (sun/horizon/rims/glitter/far-fog; never emissive) · GLACIAL BLUE body 0xbfdce6 / inner glow 0x2a5a70 · DEEP TWILIGHT INDIGO 0x1c2e5e (sky top/water deep) · ROSE-QUARTZ HAZE 0xbfa9c0 (near fog/sky mid) · CORE CYAN 0x3fc8e8 (accent emissive, rationed). ~60% cool / 30% gold / 10% cyan. Dragon+magenta outside both families.

## 2. PROPS — few colossal LUMINOUS things (mass cut ~2/3). All opaque, ≤2 mats, ≤150 tris, offset-stacked, rotY-robust. Roster swap via frozenNew/frozenOld.
- CANDLE (hero, step~45, ~85t): one colossal tapering blue-ice blade 35–60u tall, off-axis kinked tip, one low buttress, crusted pan; accent = thin cyan CORE sliver in the shaft/buttress cleft. place x side*(19+rnd*10) h 35+rnd*25 r 3.5+rnd*2 tilt near-plumb.
- SUN GATE (step~100, ~110t): two grander candles flanking the lane, leaning INWARD, framing the low sun — doorway of light every ~100m. paired:true → makeBand derives dist jitter from slot index so L/R land at same z. notched V crown. x side*(15+rnd*2) h 45+rnd*18 tilt -side*(0.05+rnd*0.03). God-rays are occlusion-masked → the gate CARVES real light shafts for free.
- SAIL (step~60, ~55t): tall thin trapezoid ice PANE (accent material — the biggest cyan surface) + a small broken primary plate leaning on it; real sun specular sweeps the glassy face as you pass (free gold gleam). x side*(16+rnd*7) h 10+rnd*10.
- FLOE SHELF (foil, step~18, ~36t): wide flat white waterline shelves (2 squashed pans), primary only, NO accent — the horizontal REST that makes verticals read tall. x side*(14+rnd*10) h 0.8+rnd*0.9 r 7+rnd*7.
- MASSIF (step~85): keep glacierfront geometry (floats on fog line), re-place wider/larger x side*(32+rnd*20) h 6+rnd*4 r 24+rnd*14; dual-fog melts it to gold.
FOAM: candle{r:0.8} sungate{r:0.8} sail{rx:0.5,rz:0.2} floeshelf{r:0.85} massif false.

## 3. AIR — DIAMOND DUST (not snow). Near-suspended gilded ice crystals catching low sun.
ambient: color 0xffe9cf, fall 3.5→0.35 (stillness), sway 0.5, size 0.4→0.27, opacity 0.85. Optional: per-mote warm/cool vertexColors (60/40), zero per-frame cost, identity-white elsewhere.

## 4. LIGHT & MATERIAL — light inside the ice.
primary[2]: color 0xbfdce6, roughness 0.30, metalness 0.08, emissive 0x2a5a70 @0.32 (faked transmission; weathering noise mottles it).
accent[2]: color 0xd8f6ff, roughness 0.22, emissive 0x3fc8e8 @0.85 (cyan heart; warm is NEVER emissive).
light: sun 0xffa860 sunI 1.75; hemiSky 0x9ab8ff; hemiGround 0x32435e→0x6b5a66 (fog-sea bounce fixes black undersides); atmos.inscatter 0.7→0.85.

## 5. FOG & FOG LINE — sea of cloud the monuments rise from.
heightK 0.05 (shipped-dormant channel) → fog pools at waterline, thins with altitude (dive thickens, climb clears — makes the MARROWCOIL dive-verb FELT). Dual-fog: NEAR cool rose-quartz 0xbfa9c0, FAR molten 0xffa268 (declare fogFarColor). near 70→78 far 380→400. Foreshadow = pale pinlights under the line, one rare half-seen arc — a whisper.

## 6. WATER — the golden mirror (free multiplier).
waveAmp 0.3→0.22 (near-mirror, keeps glitter alive). deep 0x0e2440, shallow 0x4a7290. sky.sun→0xffd2a0 (hotter glitter lane). Specular streak always points horizon-sun→player = built-in leading line to the gate; candle reflections cross it like nave columns. fogFarColor rides setWaterTint → far water melts to same gold.

## 7. SKY — restraint + ONE miracle: THE SUN PILLAR (vertical light column above sun; diamond-dust physics). Branchless sky math behind a per-biome `pillar` xMix (0 elsewhere = byte-identical); lands in water mirror free. Clouds: ship without first. Keep top/mid/horizon, stars 0.

## 8. FAUNA & LANDMARK.
flock: high gilded soarers color 0xffdfc2 scale 1.15 flap 0.4 (near-motionless soaring incense). flyby: generalize faunaFlyby → one albatross-glider crossing high ~40s. LANDMARK: THE CATHEDRAL BERG — colossal tabular iceberg on the far RIGHT horizon (sun is left), whale-slot machinery (4–5 fogged meshes, bergMix, ~330m out), never arrives — the "someday" object. Inanimate (a leviathan would crowd MARROWCOIL + echo Astral whale). Fast-follow after core kit.

## 9. AWE MOMENTS: (1) THE DOORWAY OF LIGHT — sun gate framing the disc, god-ray shafts through the gap, glitter lane through it, doubled in the mirror, pillar rising. (2) THE SAIL GLEAM — sun specular sweeping the pane. (3) THE MIRROR BREATH — negative-space stretches of only fog-sea + reflection; MARROWCOIL pinlights in the quiet.

## 10. COMPOSITION. Focal: sun disc > gate > rims+glitter > dragon > candles/sails > massif+berg > motes/fauna. Eye path: sun→gate posts→reflections→glitter→dragon (closed loop). 3 planes: horizontal shelves+fog-sea / vertical monuments / massif+berg melting to gold. Color-script beat ~100m: gate(compression)→mirror breath(release)→candle congregation→sail gleam→gate. Caldera inferno→Frozen stillness = hardest cut in cycle, lerped to a dawn. Aurora unconfusable (night/sunset, sky/prop hero, green-above/gold-within).

## 11. AUDIO (later): glassy ice chimes (pentatonic, rare, unquantized), thin high wind, a deep ice groan every 20–40s (MARROWCOIL foreshadow grows animal). Water lap muted (mirror = silent). Snow-quiet mix.

## SEQUENCING (render a pass each): 1 palette+light+fog+water+motes+fauna (pure data+makeMats) → 2 prop kit (5 archetypes + paired makeBand + foam + swap) → 3 sky pillar + flyby → 4 Cathedral Berg → 5 verify (bulletcontrast, envcount, tiers).

---
## PROP DOCTRINE v2 (supersedes §2 — owner: "all long and skinny, mountains don't look like that")
**Massive-first: ~86% broad/chunky mass, ~14% vertical punctuation.** Real ice reads as scale through
BREADTH, not height. ≥80% of instances have world width ≥ height; true spires are ONE rare archetype
(largest step). No vertical without a broad base it grows from (Matterhorn logic). ≥4 unrelated outline
families so no two archetypes share a silhouette (anti-picket). Aspect from BOTH place() r AND geometry sx.
Roster v2: **bergwall** (hero tabular berg-wall, ~1.2:1 wide, colossal) · **serac** (chunky icosahedral
block-pile ~1:1, ~90 facets = richest surface) · **terrace** (stepped ice staircase, 3–8:1 wide, the foil)
· **pinnacle** (rare broad-based horn, step 120 = punctuation) · **sungate** (massive Argonath pylons,
paired) · **glacierwall** (far ice-shelf front, 4–5:1 wide, now at true scale). Cyan lives in the CRACKS
(crevasse seams / fracture plates / melt-ponds), never as a whole object (the deleted `sail` was neon
signage). Richness = form + per-facet sun variance (different ry per stratum) + stepped self-shadow bands +
emissive-transmission on big faces, not thin repeated spikes.
