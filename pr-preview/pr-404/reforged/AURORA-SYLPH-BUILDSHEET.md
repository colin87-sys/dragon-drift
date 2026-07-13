# AURORA SYLPH — "The sky, unfurled" · Premium Build Sheet (fresh ribbon-dragon)

The builder's contract for a bespoke, low-poly, premium **aurora-borealis ribbon dragon** — the
flowing-light lane (polar curtain aurora + the prismatic gacha ribbon-dragon archetype, mined for
authenticity, copied from none). One of the FRESH FIVE (see `FRESH-DRAGONS-SYNTHESIS.md`).

> **⚠️ HARD DIRECTIVE — this is NOT a second Jade.** Both are serpents; the sheet holds four hard
> separators by construction: (1) palette — **deep polar INDIGO body + teal/rose light** vs Jade's
> vivid green + mint; (2) cross-section — **taller-than-wide teardrop (0.86 W : 1.18 H)**, the exact
> inverse of Jade's koi oval (1.14 W : 0.90 H); (3) swim axis — a **VERTICAL travelling wave**
> (sky-swimmer) vs Jade's lateral river-S; (4) the "wing" — a **continuous dorsal light-curtain +
> streamers**, no fin fans, no membrane, no lobes. Also NOT Astral Wyrm: no crystal, no mask, no
> energy bands — soft pleated light on a matte polar hide.

**Prior art — the concept is PROVEN in shipped games (owner requirement):** the celestial / aurora /
worn-light dragon is an established premium archetype. **League of Legends** — *Aurelion Sol,* a cosmic
celestial dragon whose deep-space-blue hide "glistens with the light of stars," who forges constellations
and trails cosmic light (the direct precedent for a serpentine dragon that WEARS flowing light rather
than breathing fire). The long ribbon-serpent silhouette is the canonical East-Asian celestial dragon
(dozens of games — *Genshin*, *Ni no Kuni*, *Puzzle & Dragons*). Aurora Sylph fuses the two into a
polar-aurora curtain identity with a fresh no-membrane WING, copied from none.

**Read first:** `DRAGON-DESIGN.md` · `VESPER-NIGHTGLASS-BUILDSHEET.md` (house format) ·
`PREMIUM-BUILDSHEET-RESEARCH.md` §3/§4/§6b (**§6b is load-bearing here** — the curtain is the Fresh
Five's biggest fill-rate temptation; this sheet pre-spends its overdraw budget) · Jade's shipped
`koiSerpent` bodyWave machinery in `js/dragons.js` (the PROVEN CPU travelling-wave pattern this
dragon's builder re-derives with a vertical bias — pattern reuse, fresh registration).

---

## 0. Identity contract
Fresh roster key (working `sylph`) — fully additive. `name:'Aurora Sylph'` · `title:'The sky,
unfurled'` · `rarity:'SSR'` / `maxRarity:'SSSR'` · `cost: 2800` · `stats { speed 1.08,
handling 1.24, drain 0.80, regen 1.22 }` (the glider-dancer — roster-second handling, superb
economy, modest straight-line pace) · `fx.auraColor '56,232,220'` · `forms[]` accretive, length 4 ·
`maxTierFor === 3` · `hasStyle` · `accentHue: 0x38e8dc`.

**Frozen identity laws:**
- **The light FLOWS or it fails.** The curtain gradient must visibly ripple (CPU wave, headless-
  testable); a static gradient is a FAIL even if every band assert passes.
- **The body is the silhouette; the curtain is the glory.** Longest creature in the roster (apex
  body ≥ 1.4× Jade's apex length); span:body stays low (1.6×, sheet-sanctioned — the Jade precedent).
- **Two-stop light, one anchor.** Polar teal `0x38e8dc` is THE accent; the rose hem `0xf868c8` is a
  sheet-sanctioned SECOND emissive stop, f2+, ≤15% of curtain height — real aurora curtains are
  green-teal with a rose crown, and the gradient IS the motif (law-9 exception carried by this
  sheet's authority, mirroring Phoenix's sanctioned warm triad).
- **No crystal, no gems, no gold, no green body.**
- **Build vehicle:** NEW `js/dragonSylph.js`. Forbidden imports: organism/smooth-hull family; also
  must NOT import `dragonCrystalSerpent.js` (Astral's look).

## 1. Art direction (north star)
**THE SKY, UNFURLED — a polar night that grew a heartbeat.** A long moon-dark ribbon swimming the
sky in slow vertical waves, trailing a pleated CURTAIN of living aurora — teal light that ripples
down the spine like wind through silk, crowned rose at its full unfurling. Solar is regalia, Vesper
is a blade, Phoenix is a bonfire; **Sylph is weather made gentle** — the one premium whose spectacle
is GRACE. Anchor: deep polar indigo `0x131a38` (apex). Accent: polar teal `0x38e8dc` (~176°), the
one clean teal gap in the roster's cool band (jade 149 / azure-ice 205 / vesper 223 all ≥27° away).
Hero: **THE AURORA CURTAIN** (the pleated dorsal veil). Motif: **THE POLAR CROWN** (the curtain's
origin + its gradient). Growth verb: **UNFURLING.** One word: **LUMINOUS.**

## 2. Silhouette language
Primitive: **a streaming pennant** — one long tapering ribbon-body whose dorsal line carries a tall
pleated curtain from occiput toward the tail, closing in split pennant streamers. Line of action:
the vertical wave guarantees 2+ inflections every frame; idle rest pose holds a proud swan-neck rise
+ mid dip + tail lift (S enforced in the builder's rest transform, not just the wave).

**The signature outline — THE CURTAIN RIDGE.** In side black-fill: a serpent whose back carries a
tall, pleat-scalloped VEIL (heights swell mid-body then taper — never a picket fence); in rear
black-fill: the curtain reads as a narrow tall flame-shape over the body with streamer pairs flowing
outboard-aft. Nameable at a glance: *"the ribbon with the light-veil."* Distinct from every winged
drake by class, from Jade by the veil-vs-fans and the vertical wave.

**Distinctiveness gate:**

| Axis | Jade | Astral Wyrm | Vesper | Pearl | **Sylph** |
|---|---|---|---|---|---|
| Region | serpentine (lateral koi) | serpentine (crystal, banded) | lateral spread | forward halo-knight | **serpentine PENNANT (vertical sky-swim)** |
| Tone lane | vivid jade green | crystal/energy bands | matte blue-black | holy white | **deep polar indigo** |
| Wing | silk fin-fan lobes | flat astral vanes | scallop crescent | feather-scale cards | **continuous pleated CURTAIN + streamers (no membrane)** |
| Motif | chin pearl + mint rim | energy bands | withheld seam | crown-halo | **flowing 2-stop aurora gradient (teal→rose)** |
| Glow hue | mint 149° | cyan-band | ion 223° | white-gold | **polar teal 176° + rose hem 325° (f2+)** |
| Growth verb | — | — | knapping | — | **unfurling** |

Cross-check vs the Fresh Five: see the synthesis master matrix — zero >1-cell collisions.

**Retired by this sheet:** wing lane **curtain/veil (no-membrane)** · emissive lane **polar teal** ·
verb **unfurling** · body lane **vertical-wave sky-serpent**.

## 3. Motif — THE POLAR CROWN (the curtain gradient; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor: the OCCIPUT** — the curtain's origin point at the back of the skull (never moves);
the motif is the curtain itself + its gradient, unfurling REARWARD from that anchor down the spine.
- **Hue lock:** base teal `0x38e8dc` at the curtain root → pale ice mid `0xa8f4ec` (a de-saturated
  ramp of the SAME hue, not a second stop) → **rose crown hem `0xf868c8`** (~325°) on the top 15% of
  curtain height, f2+ only. All emissive lives in the curtain/streamer/eye set; the BODY carries
  zero emissive (the inverse of every glowing premium — the light is worn, not embodied).
- **The RIPPLE (the living read):** a CPU phase wave runs the gradient boundary + per-pleat sway
  along the curtain, phase-lagged 0.3 behind the body wave (flag-in-wind physics read); amplitude
  and rate are dials (`curtainWaveAmp 0.5→0.9`, headless-assertable as a moving vertex band).
- **4-step bloom (`curtainRun` — UNFURLING):** **f0** — a crest STUB: the curtain exists only over
  the neck (run 0.25 of spine), teal only, 3 pleats — the hatchling visibly hints the apex. **f1** —
  run 0.50, 4 pleats, first shoulder streamer pair. **f2** — run 0.75, 6 pleats, second streamer
  pair at the hip, **the rose hem arrives** (0.5 intensity). **f3** — run 1.0 (occiput→tail-fork),
  7 pleats, third streamer pair, full rose crown, the tail pennants join the gradient.
- **Rear-chase carrier:** the curtain is the dorsal centerline — §1 primacy by construction; the
  streamers carry the light into the lateral chase frame during banks.

## 4. Torso — `polarRibbonTorso` (vertical-wave ribbon loft)
A single smooth swept ribbon-tube (the PROVEN koi bodyWave architecture, re-derived fresh):
cross-section a **teardrop 0.86 W : 1.18 H** (deeper than wide — the inverse of Jade, asserted),
girth 0.5, apex `bodyLength` 1.7 (≥1.4× Jade's apex — the roster's longest, asserted), radial 13.
**Vertical travelling wave:** `bodyWaveAxis:'y'` (the bespoke dial — Jade's is lateral), amp
0.5→0.9 up the ladder, freq 1.1 (one graceful sky-S), speed 2.6 easing up with game speed; plus a
slow lateral drift (0.15) so the path is a helix hint, never a flat sine. Hide: matte polar indigo
with a moonlit dorsal value tier `0x2a3560` and pale belly `0x8fa2c8` (banks read); frost-scale
diffuse flecks `0x9fb8d4` clustered at the head/shoulder (detail hierarchy law). Roughness 0.75,
metalness 0, envIntensity 0.22. Publishes attach contract + `spinePoints` + `motifAnchor` (occiput)
+ `coreGlow: null`.

## 5. Wings — the HERO: THE AURORA CURTAIN (+ streamer pairs — the no-membrane architecture)
The `wings` slot builds light, not membrane:
- **The CURTAIN:** ONE continuous pleated sheet rooted along the dorsal line (occiput → curtainRun
  fraction of the spine). Height profile swells mid-body (max 0.9× body girth ×2.2) then tapers —
  law-5 swell-then-taper, never equal pleats: 7 pleats at apex with heights `×[.7, .85, 1.0, .92,
  .8, .66, .5]`. Each pleat is REAL fold geometry (a zigzag cross-section, 2 quads per pleat face)
  so the curtain has sculpted relief and catches rim light — never a flat alpha card. **Fill
  discipline: the curtain is a SINGLE translucent layer (opacity 0.78)**, and because it is one
  connected sheet it can never stack against itself; worst case vs body = 2 layers (law ceiling).
  Gradient + ripple per §3, vertex-colored, emissive-in-fragment (glow shader on the sheet, no
  additive shell).
- **The STREAMERS:** 1→3 pairs (shoulder / hip / tail-base) of long ribbon blades — OPAQUE silk
  with an emissive tip-fade band (single-layer hem, the Jade rear-lobe precedent), lengths swell
  then taper (`×[1.0, .8, .6]` by pair), apex streamer length 0.9× body. Streamers are the
  SPAN-makers: they ride `wingPivotL/R` (direct-pivot motion path) with a per-pair furl lag.
- **The FOLD (the §3 universal clause, solved for a curtain):** banks/dives sweep the streamers aft
  (measured span contracts to ≤0.62) AND damp the curtain wave amplitude ×0.4 + pleat sway → the
  whole light-field visibly flattens: the silhouette change is real and asserted via streamer span.
- **Numbers:** span:body **1.6×** at apex (sheet-sanctioned low — the serpent is the reach, the
  Jade-clause precedent; single-streamer area:body side-area 0.30–0.45). Sweep: streamers raked
  35° aft; curtain vertical (the "dihedral" is the pleat cant ±10°).
- Publishes `wingPivotL/R` + streamer tip markers; curtain publishes `parts.wingElements` as its
  pleat list (root/tip/length per pleat) for the element asserts.

## 6. Head — `sylphDiademHead`
A slim arctic wedge (fox-eastern hybrid, ~13 facets): long calm ALMOND eyes, teal `0x66f0e4`
(brightest facial points), ladder 34% round → 27% → 22% → **18%**; a fine jaw; **frost spurs** — 3
small swept ice-white DIFFUSE spikes (`0xc8dcec`, never lit, never crystal-gemmed — the Astral
firewall) framing the occiput where the curtain anchors: the diadem that presents the motif. No
horns, no whiskers (Jade's), no mask (Astral's).

## 7. Tail — `pennantVeilTail`
The ribbon's last quarter tapers to a **split pennant fork**: 2→3 streamer blades (the tail joins
the streamer system; same silk material, gradient hem at f3). Rides the body wave (the tail IS the
loft's tapering rear — continuous by construction, the Jade `tail:'none'` pattern) with the fork
blades on 2 micro isBone joints for follow-through lag (−anchor compensation, rotation-only).

## 8. The UNFURLING ladder (4 forms — the curtain runs, the light crowns)
Form names: **f0 Polar Whelp · f1 First Veil · f2 Half-Sky · f3 Aurora Sylph.**
Drama 25 / 45 / 70 / 100. Every rung adds a CATEGORY (run + pleats + a streamer pair + light stop).

| dial | f0 Polar Whelp | f1 First Veil | f2 Half-Sky | f3 Aurora Sylph |
|---|---|---|---|---|
| read | chubby long whelp, neck-crest stub | veil to mid-back, first streamers | veil past hip, rose arrives | the full sky-curtain, rose crown |
| `curtainRun` (of spine) | 0.25 | 0.50 | 0.75 | 1.00 |
| pleats | 3 | 4 | 6 | 7 |
| streamer pairs | 0 | 1 | 2 | 3 |
| `hemRose` | 0 | 0 | 0.5 | 1.0 |
| `bodyLength` (rel.) | 1.15 | 1.35 | 1.55 | 1.70 |
| `bodyWaveAmp` (vertical) | 0.50 | 0.65 | 0.80 | 0.90 |
| streamer span : body | — | 1.2× | 1.4× | 1.6× |
| eye : head | 34% round | 27% | 22% | 18% almond |
| body hex (value ↓) | `0x232c54` | `0x1d2549` | `0x181f40` | `0x131a38` |
| head : body | 1:2.9 | 1:4.6 | 1:6.5 | 1:8.0 (serpent bands) |
| tri target | ~1.8k | ~2.7k | ~3.8k | ~5.0k |

Asserts: tris ↑ · `curtainRun`/pleats/streamer-pairs/`hemRose`/`bodyLength`/`bodyWaveAmp` ↑ ·
body value ↓ · eye:head ↓ · cross-section H:W ≥1.3 at every form (the anti-Jade assert).

## 9. Palette (polar discipline; the sanctioned two-stop light)
- **Anchor (deep polar indigo, ~228° low-sat, L 0.12–0.18):** ramp `0x232c54 → 0x1d2549 → 0x181f40
  → 0x131a38`; dorsal tier `0x2a3560`; belly `0x8fa2c8`; frost flecks `0x9fb8d4` (diffuse).
- **Accent (emissive): polar teal `0x38e8dc`** → de-sat ice ramp `0xa8f4ec` → **rose hem
  `0xf868c8`** (sheet-sanctioned second stop, f2+, ≤15% curtain height, ≤4% total surface). Eyes
  `0x66f0e4`. Body emissive ZERO (the worn-light law).
- Trail `0x2aa89e` → boost `0x48e0d0` → `surgeHi 0xbef6ef` (Surge = "Solar Wind": the curtain wave
  doubles rate + the rose hem floods to 40% height — a light-storm, wings/body never white out).
- **Hue margins (verified):** 176° sits 27° from jade-mint 149°, 29° from azure-ice 205°, 47° from
  vesper 223°; rose 325° sits 33° from Stiletto's 292° and 30° crimson-side from Tocsin's 354°.

## 10. Perf / overdraw (THE budget sheet of the Fresh Five — pre-solved)
1. **One translucent sheet, ever.** Curtain single-layer 0.78; streamers OPAQUE + hem bands; sac-
   style stacking impossible by construction. Transparent drawables at apex ≤7 (curtain 1 + hems 6).
2. **Emissive in the fragment,** never additive shells (the §6b p95 law — the curtain is exactly
   the kind of big screen-space element that killed the on-device dip; it must be a surface shader).
3. **The curtain never crosses the ±10° forward corridor** — it is dorsal and aft of the rider eye
   line by construction; verify at max wave amplitude + full pleat sway (5-phase flapstrip + the
   wave pinned via the seeded pose flag).
4. **LOD:** below quality tier 1 the ripple drops to gradient-only (no vertex wave) — a dial the
   adaptive system can zero without a visual pop (amplitude eases, never switches).
5. **Budgets:** tri ladder 1.8/2.7/3.8/5.0k; the curtain is cheap geometry (7 pleats × 2 quads ×
   run segments ≈ 600 tris at apex) — the spend is the long body + streamers. Draws ≤65 apex.

## 11. Engine plumbing (fresh names; nullable, default-off)
New module `js/dragonSylph.js`: self-registering `polarRibbonTorso` · `auroraCurtainWings` ·
`sylphDiademHead` · `pennantVeilTail`. New nullable dials: `curtainRun, pleats, hemRose,
curtainWaveAmp, curtainWaveRate, streamerPairs, streamerLen, bodyWaveAxis, frostSpurs, glowLevel,
igniteStage`. **ENGINE NEED:** `bodyWaveAxis` on the shared bodyWave ticker (a nullable axis switch
— Jade's lateral path untouched, default `'x'`); the curtain ripple ticker (CPU, seeded,
headless-testable — reuse `js/pulseTimer.js` from the Tempest slot as its clock). Forbidden
imports: organism family + `dragonCrystalSerpent.js`.

## 12. QA / gate process
- **Calibrate** on Jade apex tiles (the standing veto: *"does any frame read as Jade in a different
  shirt?"* — check the cross-section, the wave axis, the veil-vs-fans) and on Astral Wyrm.
- **Standing items:** H:W ≥1.3 assert · bodyLength ≥1.4× jade-apex assert · single-translucent-
  layer inventory · streamer fold ≤0.62 · accent 176°±20 (rose hem exempted by name in the test,
  with its ≤15%-height coverage assert) · body-emissive-zero assert · no-crystal-import firewall ·
  tricount <6000 monotonic.
- **`tests/starters.mjs` 4-form SPEC:** `curtainRun` {0.25,0.5,0.75,1.0} exact (the UNFURLING
  assert) · pleats {3,4,6,7} · streamerPairs {0,1,2,3} · `hemRose` {0,0,0.5,1.0} · wave-band motion
  assert (two ticks of the seeded ripple move the gradient boundary ≥N units — the "flows or fails"
  law, headless) · spine inflection ≥2 in idle · motif anchor (occiput) drift ≤0.15 · tri ±20%.
- Rides the PR preview (gate-blind): the ripple RATE (grace vs seasick), curtain legibility against
  the heaven/holy-architecture skies, three-cool-dragon shelf adjacency (owner call §Open-4).

## Benchmark vs the roster's best
Pearl is holy armor, Solar is a crowned king, Phoenix is a bonfire. **Sylph wins on GRACE** — the
only no-membrane wing in the roster, the only worn-light (zero body emissive) construction, the
longest silhouette, and the only dragon whose hero feature is a fluid SIMULATION read (the ripple).
Its shop turntable should be the most beautiful in the roster; its chase read is the most serene.
Where it must match them: the f3 rose-crowned curtain must hit Solar-ignition screenshot value, and
the pleat relief must survive the 250px density law (7 pleats ≥8px each at chase — verified by
crop).

## SETTLED (do not re-litigate)
- **Teardrop H>W cross-section + VERTICAL wave** — the two structural anti-Jade locks.
- **The curtain is ONE sheet + real pleat geometry** — never stacked cards, never a flat alpha quad.
- **Two-stop light (teal + rose hem) is sheet-sanctioned; a third stop is a palette fail.**
- **Zero body emissive; zero crystal/gems; span:body 1.6× is sanctioned-low** (Jade clause).
- **Rose hem arrives f2** — the hatchling/f1 curtain is pure teal (the earn is visible).

## Open owner calls (flag on the build PR)
1. **Name** — "Aurora Sylph" (recommended); alternates Polaris Veil · Borealuna.
2. **Cost/slot** — 2800 proposed (the shop-beauty premium).
3. **Ripple rate** — 0.55 Hz proposed; a feel call on the preview.
4. **Shelf adjacency** — Sylph/Tempest/Vesper are three cool-toned premiums; owner sequences the
   shop rows (the synthesis build order already spaces their releases).
5. **Surge flood height 40%** — how rose is too rose; rides the preview.

## CHANGELOG
- **v0 (Fable design-director synthesis).** Fresh ribbon-dragon AURORA SYLPH — identity LUMINOUS
  (the sky, unfurled); hero = THE AURORA CURTAIN (one pleated translucent sheet + opaque streamer
  pairs — the roster's only no-membrane wing); motif = THE POLAR CROWN (occiput-anchored 2-stop
  gradient, teal 176° + sanctioned rose hem 325°, CPU ripple); the UNFURLING ladder (curtainRun
  0.25→1.0); four structural anti-Jade locks (indigo / teardrop H>W / vertical wave / veil-not-
  fans). Overdraw pre-spent: one translucent layer total. Next: stub + Jade/Astral gate
  calibration, then ribbon torso → curtain → streamers → rose crown, per-increment Fable gates.
