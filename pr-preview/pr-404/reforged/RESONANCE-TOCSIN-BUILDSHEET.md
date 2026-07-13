# CRIMSON TOCSIN — "Struck, it answers" · Premium Build Sheet (fresh resonance drake)

The builder's contract for a bespoke, low-poly, premium **chime-scale resonance drake** — the
sound/percussion lane (Kommo-o's armored scale-chimes and warning-rattle language + temple-bell and
tubular-chime craft, mined for authenticity, copied from none). One of the FRESH FIVE (see
`FRESH-DRAGONS-SYNTHESIS.md`). A *tocsin* is an alarm bell.

> **⚠️ HARD DIRECTIVE — sound made VISIBLE, uniquely.** The motif is a thing no roster dragon owns:
> **concentric expanding SHOCKWAVE RINGS** pulsed off the body in time with the wingbeat. Everything
> on this creature serves the percussion read: gong-disc wings with hanging chime-rod fringes, a
> tolling flap rhythm, a tail that ends in a wind-chime. The rings are the ONLY roster spectacle
> that exists in TIME + SPACE beyond the silhouette (they expand past the outline — which is also
> how a chest-anchored motif satisfies rear-chase primacy).

> **⚠️ Plate-wing firewall (Pearl / Solar / Aurum).** Overlapping plates evoke Pearl's feather-scale
> cards: the separators are RIGID round bronze GONG DISCS (4, huge) vs Pearl's ~15 organic leaf-
> cards; held LOW and level vs Pearl's up-raised angel arch; a hanging ROD fringe (straight, taut —
> the curve-vs-straight law embodied) vs feather hems. No lances or vault-bays (Solar), no giallo
> gloss or lights (Aurum — Tocsin is dark ANTIQUE bronze, and its crimson is an emissive ring, not
> a tail-light seam).

**Read first:** `DRAGON-DESIGN.md` · `VESPER-NIGHTGLASS-BUILDSHEET.md` (house format) ·
`PREMIUM-BUILDSHEET-RESEARCH.md` §3/§4/§6b (the ring pulses are additive drawables — budget-counted
here) · `TEMPEST-THUNDERHEAD-BUILDSHEET.md` §11 (`js/pulseTimer.js`, the shared deterministic pulse
scheduler this dragon's ring clock reuses).

---

## 0. Identity contract
Fresh roster key (working `tocsin`) — fully additive. `name:'Crimson Tocsin'` · `title:'Struck, it
answers'` · `rarity:'SSR'` / `maxRarity:'SSSR'` · `cost: 3000` · `stats { speed 1.06,
handling 1.20, drain 0.82, regen 1.20 }` (the heavy metronome — slowest of the Fresh Five in a
straight line, superb sustain and turn authority) · `fx.auraColor '255,51,72'` · `forms[]`
accretive, length 4 · `maxTierFor === 3` · `hasStyle` · `accentHue: 0xff3348`.

**Frozen identity laws:**
- **Everything on the beat.** Rings fire on the downstroke apex; rods swing in lagged phase; the
  plate mantle shivers on ring-strike. Spectacle without rhythm is a FAIL on this dragon.
- **Antique, never showroom.** Dark umber-bronze + verdigris patina (DIFFUSE, desaturated) — the
  Aurum firewall. Only the gong FACES take a controlled polished band.
- **Crimson lives in the ring.** The accent is the struck light: ring pulses, gong bosses, rim
  ember floor, eyes. Never on broad masses; never orange (the Ember/Molten margin).
- **≤2 concurrent rings, ever** (the overdraw law, encoded as a dial cap).
- **Build vehicle:** NEW `js/dragonTocsin.js`, plate assembly. Forbidden imports: organism family.

## 1. Art direction (north star)
**THE LAST BELL — a temple's alarm given wings.** A broad, deliberate drake armored in tiered
bronze plate-mantles gone green at the rims with age; four great gong-discs for wing surfaces, a
fringe of hanging chime-rods that swing with every stroke; and on the beat, a crimson shockwave
ring blooms off the chest-gong and rolls outward through the air. Solar is regalia, Tempest is
weather, Sylph is grace — **Tocsin is RHYTHM**: the only dragon you can hear with your eyes.
Anchor: dark umber-bronze `0x372b1e` (apex). Accent: struck-crimson `0xff3348` (~354°) — the one
clean warm-family gap (30°+ from Molten's magma 24° and Ember's lava 27°, on the ROSE side of
red). Hero: **THE GONG MANTLE** (disc wings + rod fringe). Motif: **THE RESONANT ANNULUS** (the
expanding ring). Growth verb: **TUNING.** One word: **STRUCK.**

## 2. Silhouette language
Primitive: **a low pagoda** — a broad-barreled body under three overlapping dorsal plate-mantles
(shoulder widest → hip, the pagoda taper), wide LOW disc-wings, a long tail closing in a vertical
tail-gong with its own rod fringe. Line of action: a bell-carrier's gait — neck arcs up-proud,
chest drops deep (the strike-gong hangs low), tail rises to present the tail-gong at the lens.

**The signature outline — DISCS + RODS.** In rear black-fill: two shallow disc-fans spread level,
each trailing 5 straight hanging rods (gaps ≥1.2× rod width — the negative-space read), the
tail-gong a punctuation disc dead-center. In side black-fill: the tiered mantle staircase.
Nameable at a glance: *"the wind-chime dragon."*

**Distinctiveness gate:**

| Axis | Pearl | Solar | Aurum Toro | Ember | **Tocsin** |
|---|---|---|---|---|---|
| Region | forward halo-knight | top-heavy crown | bull-crown mecha | anvil shoulders | **low pagoda mantle + gong tail** |
| Tone lane | holy white + gold satin | indigo + antique gold | giallo gloss metal | flame orange | **dark umber-bronze + verdigris patina** |
| Wing | ~15 up-raised leaf-cards | vault-bays + gold lances | svj blade panels | gapped membrane | **4 rigid gong DISCS + hanging rod fringe** |
| Motif | crown-halo | ring + gem (static, worn) | thruster/tail-lights | forge collar | **EXPANDING shockwave rings (kinetic, timed)** |
| Glow hue | white-gold | violet 262° | amber/red seams | lava 27° | **struck-crimson 354°** |
| Growth verb | — | coronation | — | — | **tuning** |

Solar's "ring + gem" is a STATIC worn ring (a corona held at the crown); Tocsin's annulus is a
TRANSIENT expanding wave — different object class, and the gate table records it.

**Retired by this sheet:** motif lane **expanding shockwave / kinetic pulse** · tone lane **antique
bronze + verdigris** · emissive lane **crimson 354°** · verb **tuning** · wing lane **rigid disc +
rod fringe**.

## 3. Motif — THE RESONANT ANNULUS (the expanding ring; fixed anchor, hue-locked, 4-step bloom)
**Fixed anchor: the STRIKE-GONG** — a large bronze disc boss on the sternum (never moves, never
re-hues). On each pulse a ring is born at the gong and expands outward.
- **The ring (construction):** a thin torus band (≤120 tris), additive, crimson `0xff3348` with hi
  rim `0xff6a7a`, CPU-scaled from 0.3× to 2.2× body radius over 0.7 s while its emissive intensity
  ramps down to 0 (intensity fade, not alpha churn); oriented on the body's transverse plane so the
  chase camera sees it bloom AROUND the dragon. **Cap: ≤2 concurrent rings** (dial-clamped).
  Clocked by the shared `pulseTimer.js` (deterministic, seeded, headless-testable), fired on the
  downstroke apex.
- **Hue lock: struck-crimson `0xff3348`** (~354°). Margins: 30° from Molten magma (24°), 33° from
  Ember lava (27°) — and rose-red vs their orange reads under ACES; 29° from Sylph's rose hem
  (325°, hem-only). Aurum's red tail-light (`0xff3b2f`) is a sub-accent on a GOLD-lane dragon — the
  matrix cells stay clean; the PR flags it as a watched residual anyway.
- **4-step bloom (TUNING — the instrument assembles):** **f0** — the strike-gong exists, dull, with
  a faint crimson ember floor in its groove ring; NO pulses (an unstruck bell — the hint). **f1** —
  first true pulse: ONE ring, on boost only. **f2** — rings on the wingbeat (every 2nd downstroke)
  + the TAIL-GONG arrives and answers: a half-beat-late echo flash on its boss (no second ring —
  light only). **f3** — the full chord: rings every downstroke (still ≤2 live), the tail-gong echo,
  plate-rim shiver flash (a 0.1 s ember-floor lift across the mantle rims, in ring phase), and the
  rod fringe at full 13 rods.
- **Rear-chase carrier (§1):** the ring EXPANDS PAST the silhouette — visible from every angle
  including dead-astern (the chest anchor is invisible; its wave is not). The tail-gong echo is the
  second carrier, dead-center in the chase frame.
- **Anti-tacky:** rings are the ONLY additive element; everything else is opaque emissive floors on
  geometry; intensity-capped so a double-ring frame never glare-masks the corridor.

## 4. Torso — `bellPlateTorso` (tiered plate assembly; rings-the-failure dead by construction)
A broad BELL-BARREL core (5 stations, N=8, widest at the shoulder, waist 0.72×, haunch 0.85×)
dressed in **three dorsal PLATE-MANTLES** (pagoda tiers: shoulder mantle widest → mid → hip at
×0.8 steps; each mantle 4 big beveled bronze plates with a patina groove rim — overlapping shingle
construction, the Obsidian-shingle precedent re-materialed). The **strike-gong** hangs at the
sternum keel (the motif anchor, §3). Value tiers: mantle top bronze `0x4e3d2a` → barrel flank
`0x3e3122` → under-shadow `0x241c12`; **verdigris patina** `0x4e7a6e` as a DIFFUSE rim/valley tint
only (≤12% coverage, desaturated — 24° from jade-mint in hue but diffuse-dark vs Jade's vivid
emissive lane: the cells stay clean). Gong faces: a controlled polished band — metalness 0.5,
roughness 0.4 (the Aurum-style finish override, kept dark antique). Everything else matte
(roughness 0.8, metalness 0.1). Publishes attach contract + `spinePoints` + `motifAnchor`
(sternum gong) + `coreGlow: null`.

## 5. Wings — the HERO: THE GONG MANTLE (disc fan + chime-rod fringe)
Each wing = a thick bronze leading ARM (beveled, elbow break ≥18°) carrying **4 rigid GONG DISCS**
marching outboard — diameters swell-then-taper `×[0.80, 1.00, 0.85, 0.65]` (disc 2 dominant — the
law-5 signature), each disc:
- slightly CUPPED (camber law — a gong is a cupped plate; rim light pools in the bowl),
- a crimson center BOSS (small emissive stud, the struck point) + a patina RIM RING (geometry
  groove, diffuse verdigris),
- shingle-overlapped ≤2 deep onto its neighbor (opaque — zero alpha cost), z-staggered 0.10 so the
  planform reads four separate coins, never one shield (the MITTEN killer for a plate wing).
**THE ROD FRINGE:** 5 hanging tubular chime-rods per wing off the trailing rim (lengths ×0.82
falloff outboard, the longest inboard), each a thin straight taut cylinder with a bright-worn tip
cap; gaps between rods ≥1.2× rod width (true trailing-edge negative space — this wing's answer to
the gap law). Straight rods against round discs = the curve-vs-straight law embodied.
- **Motion (bespoke — the TOLL):** `wingParts 3` at a heavy bell-swing rhythm: `flapBias 0.78,
  flapAmp 0.75, downFrac 0.58` with an APEX HOLD (the Pearl high-V lesson) — a slow, massive,
  ceremonial stroke that the ring pulse punctuates. Rods swing on per-rod micro-pivots with 0.10
  phase lag steps (the wind-chime read; free dead-symmetry breaker). Disc micro-shiver (±1.5°
  roll, 0.15 s) on ring-strike at f3.
- **Fold:** the discs fan CLOSED like a hand of coins (each disc rotates toward the arm, overlap
  deepens) — measured span contracts to ≤0.66; the rod fringe collapses to a vertical chime-stack.
- **Numbers:** apex span:body **2.0×** (a heavy drake — sanctioned under the 2.5–3.5 default band:
  the discs carry visual mass the way Jade's serpent carries reach) · single-wing area:body side
  0.85–1.0 · sweep 15° · dihedral 8° (LOW and level — the anti-Pearl attitude).
- Join buried under the shoulder mantle (overlap-not-weld); canonical +X wing, outer-wrapper
  mirror; publishes `wingPivot/Mid/TipL/R` + tip marker + `parts.wingElements` (4 discs + arm).

## 6. Head — `tocsinCrestHead`
A TEMPLE-GUARDIAN wedge (~15 facets): heavy jaw, a broad flat brow; **striker-horns** — one pair of
thick forward-curving mallet-headed horns (blunt rounded tips — deliberately NOT spikes; they are
the strikers, taper law held to the mallet neck then a soft knob); **tympana** — two small ear-disc
gongs flush on the cheeks (echo the wing discs at ~0.2× scale; detail-hierarchy cluster). Eyes:
ember-crimson `0xff5a66`, deep-set under the brow (brightest facial points), ladder 35% round →
27% → 22% → **18%**.

## 7. Tail — `gongAnnulusTail`
A chain of bronze vertebra BARRELS (isBone 4-joint nested chain, −anchor, rotation-only; girth
tapers ×0.85 per segment) ending in the **TAIL-GONG**: a vertical disc (0.45× body girth) pitched
+15° toward the chase lens (cant law) with a crimson boss + 3 hanging rods off its lower rim
(lengths ×0.8). Motion: a heavy pendulum sway (`tailWhip, tailLagScale 0.14, tailUndulateX 0.18`)
— mass, not whip; the gong face stays presented in cruise; banks swing the whole chime audibly
(visually) wide.

## 8. The TUNING ladder (4 forms — the instrument assembles, then plays)
Form names: **f0 Dull Ingot · f1 First Strike · f2 Half Chord · f3 Crimson Tocsin.**
Drama 25 / 45 / 70 / 100. Every rung adds a CATEGORY (hardware + light + a silhouette move).

| dial | f0 Dull Ingot | f1 First Strike | f2 Half Chord | f3 Crimson Tocsin |
|---|---|---|---|---|
| read | plain barrel pup, unstruck gong | first mantle + boost ring | discs true, tail-gong answers | the full chord + rod fringe + shiver |
| plate mantles | 1 | 2 | 3 | 3 (+rim ember floors) |
| gong discs / wing | 2 | 3 | 4 | 4 (larger, deeper cup) |
| `ringStage` | 0 (none) | 1 (boost-only) | 2 (wingbeat, every 2nd) | 3 (every downstroke, ≤2 live) |
| `rodCount` (total) | 0 | 3 (tail only) | 8 (+5 wing rods... 2+2 wing / 1+3 tail split — see note) | 13 (5+5 wing / 3 tail) |
| tail-gong | — | boss only | disc + echo flash | disc + echo + rods |
| striker-horns / tympana | 0 / 0 | 0.5 / 0 | 1.0 / 2 | 1.0 (knobs worn bright) / 2 |
| span : body | 1.5× | 1.7× | 1.9× | 2.0× |
| eye : head | 35% round | 27% | 22% | 18% |
| body hex (value ↓) | `0x4a3a28` | `0x443626` | `0x3e3122` | `0x372b1e` |
| tri target | ~2.0k | ~2.9k | ~4.0k | ~5.4k |

Rod note: the ladder's exact split is builder's choice; the ASSERT is the total {0,3,8,13}
monotonic + per-wing symmetry. Asserts: tris ↑ · mantles/discs/`ringStage`/`rodCount`/span ↑ ·
body value ↓ · eye:head ↓ · concurrent rings ≤2 at every stage (the cap assert).

## 9. Palette (antique discipline; crimson only when struck)
- **Anchor (dark umber-bronze, ~32° low-sat, L 0.16–0.24):** ramp `0x4a3a28 → 0x443626 → 0x3e3122
  → 0x372b1e`; mantle top `0x4e3d2a`; under-shadow `0x241c12`; belly aged-leather `0x2e2318`.
- **Patina (diffuse secondary):** verdigris `0x4e7a6e`, rims/valleys only, ≤12% coverage, never
  emissive (the Jade firewall).
- **Accent (emissive): struck-crimson `0xff3348`**; ring hi `0xff6a7a`; boss studs; rim ember
  floor ≤0.15 intensity; eyes `0xff5a66`. Coverage ≤6% cruise, ≤9% at a double-ring frame.
- Trail `0x8a1f2e` → boost `0xd42a44` → `surgeHi 0xff8a96` (Surge = "Alarum": ring cadence doubles
  — still ≤2 live, they just chain — the mantle ember floors lift, the body stays dark bronze).
- **Zero orange** (the Ember/Molten margin is held by staying rose-side of red — assert hue ≥340°
  or ≤6°). **Zero bright gold** (Aurum firewall: no metalness >0.5 outside the gong faces).

## 10. Perf / overdraw (pre-solved)
1. **Additive inventory = the rings, period:** ≤2 concurrent ring toruses (≤240 tris live) + trail;
   everything else opaque. Transparent/additive drawables ≤6 at apex — the LOWEST of the Fresh
   Five despite the flashiest motif (the ring is cheap because it is one thin band).
2. **Ring ≠ screen flash:** intensity fade + expansion means the ring never fills the screen; it
   is born small and dies dim at 2.2× body radius. p95-safe at tier-1 quality (rings skip when the
   adaptive tier drops below 1 — same guard as Tempest's strikes).
3. **±10° corridor:** discs are level-outboard; rods hang BELOW the wing plane — verify rod
   clearance at full fold + max sway; the tail-gong sits above the trail line (cant +15° keeps its
   face out of the corridor).
4. **Budgets:** tri ladder 2.0/2.9/4.0/5.4k (the heaviest of the Fresh Five — discs and rods are
   real geometry; still 10% under ceiling). Draws ≤75 apex (mantle plates merge per tier; rods
   merge per wing; discs one mat + boss mat).

## 11. Engine plumbing (fresh names; nullable, default-off)
New module `js/dragonTocsin.js`: self-registering `bellPlateTorso` · `gongMantleWings` ·
`tocsinCrestHead` · `gongAnnulusTail`. New nullable dials: `plateTiers, gongDiscs, ringStage,
ringMax (cap, default 2), rodCount, tailGongStage, strikerHorns, tympana, shiverAmp, patinaLevel,
glowLevel, igniteStage`. **Reuses `js/pulseTimer.js`** (lands with the Tempest slot) as the ring
clock — if Tocsin builds first, the timer lands here instead (the build-order note in the
synthesis). Ring lifecycle: 2 pooled torus meshes, scaled + intensity-ramped on CPU (no allocation
per pulse). Forbidden imports: organism family.

## 12. QA / gate process
- **Calibrate** on Pearl + Solar + Aurum tiles (the plate/metal neighbors; the veto: *"does any
  frame read angelic plate, royal vault, or supercar?"*).
- **Standing items:** ring cap ≤2 (runtime assert with the seeded timer at max cadence) · disc
  z-stagger ≥0.10 + 4-coin planform separation (top silhouette) · rod gap ≥1.2× rod width · fold
  ≤0.66 · hue window (≥340° or ≤6°) · patina diffuse-only inventory · metalness ≤0.5 off-gong ·
  tricount <6000 monotonic · no-organism-import firewall.
- **`tests/starters.mjs` 4-form SPEC:** mantles {1,2,3,3} · discs {2,3,4,4} + dominant-decay
  diameters non-equal · `ringStage` {0,1,2,3} (the TUNING assert) · `rodCount` {0,3,8,13} · ring
  clock determinism (seeded schedule) · disc taper exemption named (discs are plates; the taper
  law rides the rods + horns + tail chain, tip ≤0.20×) · spine inflection ≥1 · motif anchor
  (sternum) drift ≤0.15 · tri ±20%.
- Rides the PR preview (gate-blind): the TOLL rhythm feel (does the ring land ON the beat), rod
  swing rate, the ring's readability against warm biome skies (crimson on sunset-gold — the L140
  backdrop is mandatory), Aurum-red adjacency check in the garage/shop.

## Benchmark vs the roster's best
Solar's ignition is a state; Phoenix's fire is a texture; Vesper's surge is a reveal. **Tocsin wins
on RHYTHM** — the only spectacle that is an EVENT the player learns to anticipate (ring-on-the-
beat), the only motif that escapes the silhouette, and the roster's most game-feel-adjacent visual
(it makes the flap cycle legible). Where it must match them: the f3 double-ring + shiver frame
must hit Solar-ignition screenshot value, and the antique material read must be as convincing as
Aurum's giallo (dark bronze is HARD in flat-shading — the patina grooves + polished gong band are
the answer; judge at the 4× crop).

## SETTLED (do not re-litigate)
- **≤2 concurrent rings** — a dial cap, not a hope; Surge chains cadence, never count.
- **Dark ANTIQUE bronze + diffuse verdigris** — never giallo, never bright gold, never emissive
  patina.
- **Crimson 354° rose-side** — never orange; the Ember/Molten margin is a hue-window assert.
- **Rings fire on the downstroke apex** — the beat-sync is the identity; a free-running ring timer
  is a design bug.
- **Discs are cupped + staggered coins** — a fused shield read is the MITTEN of this wing.

## Open owner calls (flag on the build PR)
1. **Name** — "Crimson Tocsin" (recommended); alternates Bronzebell Kaiju-Ō · Vermillion Knell.
2. **Cost/slot** — 3000 proposed (the heavy-premium shelf between Sylph 2800 and Pearl 3400).
3. **Actual chime SFX** on ring-strike (cross-discipline, audio system) — default OFF in v0.
4. **Ring cadence at f3** (every downstroke vs every 2nd) — feel call on the preview.
5. **Striker-horn knobs** — blunt mallets are the design; owner may prefer sharper (flag: sharper
   collides with the generic horned-drake read).

## CHANGELOG
- **v0 (Fable design-director synthesis).** Fresh resonance drake CRIMSON TOCSIN — identity STRUCK
  (the last bell); hero = THE GONG MANTLE (4 cupped disc-coins + hanging chime-rod fringe, low and
  level); motif = THE RESONANT ANNULUS (expanding crimson shockwave rings, ≤2 live, beat-synced
  via the shared pulseTimer, expanding past the silhouette = the rear-chase carrier); the TUNING
  ladder (mantles/discs/ringStage/rods monotonic). Firewalls named vs Pearl/Solar/Aurum/Ember.
  Next: stub + plate-neighbor gate calibration, then barrel + mantles → disc wing → ring system →
  tail-gong, per-increment Fable gates.
