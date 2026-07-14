# PHOENIX ASCENDANT — REFORGED · Premium Build Sheet (white-gold divine firebird)

The builder's contract for the MASSIVE glow-up of the shipped **Phoenix Ascendant**
(`phoenix`, SSSR, "Reborn in fire"). This is a **scaffold glow-up**, NOT a clean-sheet
no-leak build: we START from the shipped avian/feather/plume/beaked recipe and resculpt
it to Solar-level richness. Numbers here are the authority; the high-effort Fable gate
(§7) judges pixels against this sheet.

Sourced from: the owner's verbatim critique + the shipped phoenix parts (`dragonTorso.js
buildAvianTorso`, `dragonWings.js buildFeatherWings`, `dragonTail.js buildPlumeTail`,
`dragonHead.js buildBeakedHead`), the SSSR method (`PREMIUM-DRAGON-METHOD.md`), the
richness template (`SOLAR-ECLIPSE-BUILDSHEET.md`), the engine laws (`PHOENIX-MOLTEN-
BUILDSHEET.md`), and the newest ledger lessons (organized-ranks, panels-not-wires,
fan-must-rake-aft, judge-in-the-real-chase-cam).

---

## SETTLED — do NOT re-litigate (read this FIRST)
A fresh implementation chat builds THIS audited design; it does not re-derive it. Closed
calls stay closed unless the builder raises a real objection to the owner.

1. **This is a SCAFFOLD glow-up, not a no-leak rebuild.** We keep the beloved identity:
   a WHITE-GOLD DIVINE-PLUMAGE firebird, "Reborn in fire", real FEATHER wings (NOT
   flame-tongues — that lane is Molten's), a heart-fire core, a solar halo, a Rebirth
   Surge, warm ivory→white-hot palette with rose-gold feather edges + orange emissive
   flame as SUPPORT only. All of this is PRESERVED; we fix the sculpt, not the soul.
2. **The sphere is the crime — the torso is the #1 fix (§2).** Diagnosed below.
3. **HARD VETO: no curled / upturned / hooked wingtips.** The tip family is a
   STRAIGHT-to-swept-back emarginated eagle "finger" that rakes AFT and droops slightly
   DOWN — the geometric opposite of a curl-up (§3). Any tip whose terminal tangent points
   up/inward = automatic FAIL.
4. **Coexist as a NEW roster key `phoenixReforged`** (name stays "Phoenix Ascendant"),
   mirroring `phoenix` rarity/cost/stats. The shipped `phoenix` def stays byte-identical.
   Migrate/retire only on owner approval (the Molten precedent: `phoenixMolten` coexists).
5. **Richness comes from ORGANIZED RANKS, not tri-count.** Budget ~5–7 organized detail
   systems (covert/secondary/primary wing ranks, breast shingle, collar gorget, crown fan,
   pennant ribbons). The shipped phoenix apex is 2868 tris; ceiling is 6000; Solar's apex
   is 3317. Target apex ~3300–3900 — headroom is NOT the goal, organized relief is.
6. **LIGHT-BODY value doctrine (§1).** This dragon INVERTS the dark-body rule: a pale
   opaque MATTE ivory body with a DARK ember-shadow relief value (T4) and a saturated
   rose-gold rim carries the silhouette. Two-value relief = bright vane over ember-shadow
   root on every feather. Emissive (orange, sat≥0.8) lives only in the seams/heart/tips.
   ≤1 near-white element (the heart core), and it stays OUT of `spineMats`.

### Distinctiveness housekeeping — retired regions + function-families (the anti-sameness map)
| Shipped dragon | Compositional region | Silhouette function-family |
|---|---|---|
| Solar Sovereign | top-heavy (M / cathedral arch) | interior-peak (two-segment gull arch) |
| Phoenix (old) / Molten | bottom-heavy (hanging fishbone / pyre-train) | terminal-peak rake |
| **Phoenix Reforged (this)** | **FORWARD-anchored (proud breast-keel prow); radial sun-collar as the dorsal rear-frame hero** | **multi-lobed / scalloped-terminal (emarginated eagle fingers)** |
Both of ours are UNSPENT. Do not drift toward an arch, a hanging train, or a single peak.

---

## §0. Identity + THE DIAGNOSIS

### 0a. What the Ascendant IS (frozen north star — keep it)
A **white-gold DIVINE FIREBIRD reborn in fire**: a celestial phoenix of real feathered
plumage, warm ivory and gold shading to a white-hot heart, rose-gold on the feather edges,
orange emissive flame only as SUPPORT (seams, core, wing-vein, pennant hem). It carries a
solar backlight and a Rebirth Surge (a warm gold ignition, never a screen wash). One word:
**ASCENDANT** — a hawk-of-the-sun climbing into its own dawn. It is NOT a wyvern, NOT a
flame-tongue elemental (Molten owns living magma), NOT a cool seraph (Pearl owns holy blue).

### 0b. The DIAGNOSIS — why the shipped model reads basic/geometrical (grounded in the pixels)
Studied: `dragon-phoenix-f3-glide-dark-r0.png` (4-view), `-sil-rear-r0.png`, and
`/tmp/frame-phoenix.png` (the binding chase cam).

1. **THE SPHERE BODY (the crime).** `buildAvianTorso` is literally `SphereGeometry(0.6)`
   scaled to an ovoid `(0.8, 0.84, 1.46)`, plus a `breast` sphere, a `heart` sphere, and
   two `neck` spheres. In the **side profile** it reads as a *chain of pale balls you can
   count* — no keel, no breast projection, no neck arch, no haunch, no tail-root taper.
   A fresnel rim blooms the whole thing to a **featureless white egg**. This is exactly
   the owner's "the body was literally a sphere."
2. **FLAT WING SHEETS.** `buildFeatherWings` builds two `ShapeGeometry` webs (`web`,
   `oWeb`) — flat clipped sheets given a shallow `archUp`. In the **side view** the wing
   reads as a **corrugated venetian-blind / folded-paper fan**: flat shingled bars, a hard
   dark leading edge, ZERO chord thickness, one flat tan gradient (no two-value relief).
   The "secondary feathers" are a handful of `featherGeo` slats laid on top — they vanish
   at chase distance, leaving a **thin blade**. No organized covert/secondary/primary rank
   reads. This is the owner's "flat and geometrical."
3. **THE TAIL CLOGS THE CORRIDOR + reads as a fishbone.** `buildPlumeTail` sets
   `plume.rotation.x = 0.12` (trails DOWNWARD) with a drooping fan → in the **framecap**
   the plume is a bright vertical white-gold streak **hanging straight down over the
   water**, dead-center in the lower-frame course corridor (a Visibility-Law violation),
   and it reads as a **Christmas-tree / fishbone pendant**, not a flowing flame train.
4. **PROPORTION FAILURE.** Enormously long thin blade-wings on a tiny ball body →
   "wingspan dwarfs body." Owner: "not proportional in body/tail."
5. **PALETTE WASHOUT.** In the rear-chase the pale body + solar halo + white-hot core all
   bloom into **one ivory smear** with no value gap — the owner's "no depth/richness like
   Solar." (The one thing already RIGHT: the sil-rear tips are straight/slightly-swept,
   NOT curled. Keep that; the veto is about not re-introducing curl.)

The fixes, in priority order: **(1) resculpt the sphere into a keeled organic firebird
body; (2) rebuild the wings as filled, rank-organized feather surfaces with two-value
relief; (3) re-proportion the tail into a swept-aft sky-zone pennant; (4) install a
value-gap palette + a signature sun-collar so it reads rich, not smeared.**

---

## §B. THE ONE LOAD-BEARING DECISION (surface to the owner BEFORE freezing downstream)

> **DECISION: The silhouette resolves as "THE ASCENDING SUNHAWK" — a FORWARD-anchored,
> proud-keel-breasted firebird whose hero mass is a pair of BROAD, DEEP-CHORD,
> SWEPT-BACK GREAT-EAGLE wings with emarginated ("fingered") primaries that rake AFT and
> droop slightly DOWN — framed by a radial SUN-GORGET collar around the nape as the
> dorsal rear-frame hero.** The whole build hangs on this: a forward breast-prow (fixes
> "not proportional / sphere body"), a deep filled eagle wing (fixes "flat sheets"), a
> fingered-not-curled tip (honours the veto), and a collar-sun (the withheld regalia +
> the bright origin of the spine glow in the rear-chase).

**Alternatives rejected:**
- **A) The Seraph high-lofted swan-wing** (broad SMOOTH strongly up-raised wing, big
  interior-hump arc). REJECTED: that is Pearl Seraph's exact planform + arc family
  (§8 collision), AND a high up-loft flirts with the curled-tip veto zone.
- **B) A bottom-heavy fire-train / pyre-fan hero** (make the tail the wow). REJECTED:
  bottom-heavy is a SPENT region (old-Phoenix + Molten) and the down-train is the very
  corridor-clogging bug we are fixing (the "judge-in-the-real-chase-cam" saga).
- **C) Keep the thin delta blade-wing and just glue more feathers on.** REJECTED: the
  thin-blade planform IS the diagnosed failure; feathers on a blade is still a blade. The
  wing must become a FILLED deep-chord surface first, then carry ranks.
- **D) A top-heavy vaulted arch (Solar's move) in gold.** REJECTED: interior-peak arch +
  top-heavy region are both Solar's, spent, and would read as "Solar but warmer" (§8).

---

## §1. Aesthetic / palette — the WHITE-GOLD SOLAR-IVORY system (value-gap first)

This is a LIGHT body, so it CANNOT rely on a dark field for contrast (that would collide
with every dark dragon and isn't the identity). The premium read comes from **two-value
relief baked into every feather + a saturated warm rim that survives ACES + bloom**, so
the silhouette stays crisp on a pale sky and does not bloom to one ivory smear.

**HEAT/VALUE TIER LADDER (structure KEEP; hexes are the apex starting point, ramp per §6):**
- **T0 WHITE-HOT** — the heart core, the collar centre-gem, ONE apex pinion stroke:
  `0xfff8e8` / `0xffffff`. RARE + hierarchical (the ≤1 near-white; tiny footprint;
  OUT of every `spineMats`/`accentMats` array so Surge can't detonate it).
- **T1 SOLAR-IVORY** — the big MATTE opaque body field, wing coverts, breast, feather
  vanes: warm ivory `0xf2e8cf` / `0xece0c2` (roughness ~0.5, metalness ~0.06, emissive
  ≤0.12). This is the pale mass; it must read MATTE, never a glossy bloom-bomb.
- **T2 GOLD** — the REGALIA register: collar gorget, wing leading arm/spar, crown fan,
  feather shafts, beak, talons: antique gold `0xe8c063` → bright gold `0xf4d580` (give
  every gold form 1–2 bevel facets to catch an edge highlight — forged, not smooth).
- **T3 ROSE-GOLD / AMBER EDGE** — the crisp SILHOUETTE-DEFINING rim on the pale body:
  feather edges, wing trailing rim, collar-feather tips, tail-ribbon hems: rose-gold
  `0xff9a7a` → warm amber `0xe8863a`. **This is the light-body silhouette tool:** rose-gold
  reads BOTH against the ivory body AND against a pale/gold sky, so the outline never
  dissolves.
- **T4 EMBER-SHADOW** — the DARK RELIEF value (the load-bearing two-value tool): feather
  ROOTS, under-wing, rank seams, deep haunch, belly, tail-root, crown-feather backs:
  warm bronze-brown `0x7a4a24` → burnt umber `0x5a3018` (floor). Every feather = a T1/T2
  bright VANE over a T4 ember-shadow ROOT → each rank reads by facet-shadow contrast, not
  by light. On a PALE sky the T4 perimeter + T3 rim anchor the silhouette.
- **EMISSIVE — ORANGE FLAME SUPPORT** — the only emissive accent, on the 10% (seams, heart,
  wing-vein, collar-heart, pennant hem): saturated orange `0xff7a1a` / `0xff8a2a`
  (sat ≥ 0.8, val ≤ 0.9) → blooms in-hue ORANGE, never white. NO orange diffuse on broad
  masses (anti toy-color); orange is LIGHT in the grooves, gold is the metal.

**THE VALUE-GAP LAW (assert-worthy):** adjacent stacked feather ranks must differ ≥2 value
tiers (bright vane T1/T2 vs ember-shadow root T4). The broad ivory field never touches the
white-hot T0 except at the single heart. The outermost edge of EVERY wing/tail/collar
feather carries the T3 rose-gold→amber rim + a T4 backing, so the outline is a warm
dark-to-rose edge — the anti-smear guarantee.

**Dual-sky contract:** on a DARK sky the three light structures (white-hot heart /
rose-gold rims / gold regalia) read as SEPARATE, never one smear; on a PALE/GOLD sky the
T4 ember-shadow feather roots + rose-gold rim keep the body from DISSOLVING into the sky.
Verified in `dragonstudio` dark/pale/gold tiles + the real `framecap`.

---

## §2. TORSO — `sunhawkKeelTorso` (NEW, registers 'sunhawk', default-off) — THE #1 FIX

Kill the sphere-chain. Build the body as a **lofted, keeled, characterful firebird** from a
ring-set (fewer-larger flat-shaded facets), NOT stacked `SphereGeometry`. Forward-anchored:
the proud breast is the visual prow.

**Construction — a lofted profile of ~8 stations (nose-of-breast → tail-root), each an
ellipse ring; loft the surface between them (Molten's `loftRings`/`buildTorso` pattern).**
Body long axis LEVEL (chase-cam law). Publish exact stations (pre-scale, `model.scale`
applies on top):

| station | z | y (centre) | halfWidth | halfHeight | note |
|---|---|---|---|---|---|
| S0 throat | −1.55 | 0.66 | 0.20 | 0.22 | neck join (arched up-forward) |
| S1 fore-breast | −1.05 | 0.50 | 0.34 | 0.44 | **KEEL begins — breast projects fwd+down** |
| S2 proud keel | −0.60 | 0.42 | 0.44 | 0.56 | **widest+deepest station (the prow mass)** |
| S3 shoulder yoke | −0.15 | 0.52 | 0.46 | 0.50 | wing-root station (widest in X) |
| S4 mid-back | 0.35 | 0.54 | 0.40 | 0.42 | dorsal line dips gently |
| S5 haunch | 0.85 | 0.48 | 0.36 | 0.40 | **sculpted thigh swell (hip mass)** |
| S6 croup | 1.30 | 0.46 | 0.24 | 0.26 | taper begins |
| S7 tail-root | 1.70 | 0.44 | 0.13 | 0.14 | tip ≤0.30× the keel width |

- **Proud keel:** chest depth (S2 halfHeight 0.56) : mid-belly ≈ **1.5–1.6**; the keel
  projects FORWARD and slightly DOWN so the side-profile shows a defined breast prow, not
  an ovoid. The keel underline is a single sculpted **breast-shield** facet (T1 ivory vane,
  T4 ember-shadow seam) — one bold form, not a smooth curve.
- **Arched S-neck:** 4–5 lofted ring segments (NOT spheres) rising up-and-forward from S0
  in a proud hawk arc (≥1 inflection with the tail-root counter-line). Apex neck ≈ 0.5×
  body length. Neck top carries a slim gold vertebral ridge (T2).
- **Sculpted haunch:** S5 thigh swell reads as a distinct mass behind the wing root (fixes
  the "no lower body" thinness in the sil-rear).
- **Tapering tail-root:** monotonic taper S3→S7, tip ≤0.30× keel width — a clean handoff to
  the pennant (no lump).
- **Flank field:** large confident T1 ivory scale-fields (sparse detail on the mass); a
  breast **shingle rank** of 2–3 rows of small ivory kite-feathers (the richness-lesson
  `shingleRow` primitive) over the keel + throat — bright vane / ember-shadow root.
- **THE HEART-FIRE core (signature, keep):** a bright emissive facet-cluster nestled in the
  keel at ~(0, 0.44, −0.55) — T0 white-hot at apex over a T-orange emissive glow-pool,
  read through a small **crust-free ivory caldera rim** on the breast. `coreGlow` returns a
  **mesh or `null`** (never a color number — the crash-class): the additive back-glow
  sprite is built by the orchestrator only when `coreGlow` is falsy... follow the Molten
  contract (`dragonPhoenixMolten.js` ~line 355): build the sprite HERE, set
  `coreGlow.userData.base`, `coreGlow.layers.set(1)`, return it.

**ATTACH CONTRACT (publish ALL — a missing field null-derefs at build; copy shapes from
`dragonPhoenixMolten.js` ~line 376):**
`wingRoot(side) → {x,y,z}` (at S3 shoulder yoke, high on the back) · `headBase {x,y,z}`
(at S0 throat top) · `tailAnchor {y,z}` (at S7, LIFTED — see §4) · `halfWidthAt(z)`
(sample the loft) · `bodyMidY` · `riderSocket {x,y,z}` · `keelTopAt() → 0` (no dorsal
spine; the crown+collar are the back read) · `motifAnchor` (an Object3D at the nape, the
collar-gorget mount) · `parts.spinePoints` (the loft centreline for the surge/spine tick).
Return `{ group, attach, mats:{ bodyMat, eyeMat }, coreGlow, spineMats }` — mats override
the dragon defaults so head/tail share the firebird body/eye material (rig pulse stays
consistent); `spineMats` flare on Rebirth Surge.

---

## §3. FEATHER WINGS — `sunfeatherWings` (NEW, registers 'sunfeather') — THE HERO

Broad, deep-chord, RICH, organized-rank feather wings on a FILLED surface. This replaces
the flat-sheet `buildFeatherWings` read entirely. Build from first principles of a great
soaring eagle/firebird wing — NOT the seraph swan-wing, NOT the shipped flat web.

**The filled surface (fixes "flat sheets"):** ONE continuous filled inner WEB (the vane
surface) root→t≈0.70 span, chordwise-billowed (`buildCurvedPatch` or a lofted grid), so no
detached slats float — ranks shingle OVER a filled surface (the Molten `pyreFan` root-in-
fill law). rootChord ≈ **1.5**, halfSpan ≈ **3.3** (chord:span ≈ 0.45) — a DEEP filled
wing, not a blade. Real chord thickness at the arm (a lofted tapered limb, not a flat edge).

**THREE ORGANIZED RANKS (the richness engine — the whole "crafted plumage" read):**
1. **Coverts** (shoulder/root, inner third): a shingled row of small ivory kite-feathers
   over the wing root — **extend them INBOARD across the inner third** (the richness-lesson
   fix: the shipped covert rank left the inner wing a blank rod that vanishes in the chase
   view). T1 vane / T4 ember-shadow root. ~5–7 per wing at apex.
2. **Secondaries** (mid-chord): a broad OVERLAPPING row of medium feathers, ~55% overlap,
   ivory→gold vanes, ember-shadow roots — this rank carries the deep filled chord. ~5–6/wing.
3. **Primaries** (outer third): the **emarginated GREAT-EAGLE fingers** — broad feathers
   that separate into distinct fingertips over the outer ~30%, with a **dominant central
   primary ×1.5** (the scale-hierarchy / anti-picket-fence law). Vanes gold→ivory, one apex
   T0 pinion stroke, rose-gold (T3) rim. ~4–5 fingers/wing at apex.

**TWO-VALUE RELIEF (the anti-smear law):** every feather = bright vane (T1/T2) + ember-
shadow root (T4); the wing steps root→tip in value; richness = facet relief + overlap
shadow + a scalloped edge, NOT new light (only the wing-vein seam carries the thin orange
emissive).

**THE TIP FAMILY (HARD VETO honoured — state exactly what the tip does):** the outer 3–5
primaries splay into **emarginated fingers that rake AFT ~28–32° and droop ~5–8° DOWN at
the very tip** (a great eagle at soar). The finger terminal tangent points **aft-and-down**
— NEVER up, in, or hooked. This gives the signature **multi-lobed / scalloped trailing
outline** (the unspent function-family) with zero curl. Assert: every tip's terminal Y-slope
≤ 0 (monotone non-rising) and terminal Z-slope > 0 (aft).

**Planform / stance:** sweep-back **24–28°**; dihedral **12–16° up** (modest — enough for
the rear-chase read, NOT a seraph high-loft, NOT a curl); apex span:body ≈ **2.8–3.2×**
(re-proportioned DOWN from the shipped blade so it stops dwarfing the now-bigger keel body).
Rear-chase target: a **SOLID broad swept fan of fire** with a scalloped rose-gold rim —
SURFACE, not lines. Any full-span 1px line surviving at 250px = FAIL.

**EXPORTED-PROFILE LAW:** geometry AND the FX marker / `wingElements` tip share ONE curve
`sunLeadY(t)` / `sunLeadZ(t)` (the crash-class: if you change the profile, update BOTH or
the wingtip trail detaches from the moved tip). **Publish the rig:** `wingPivotL/R`,
`wingMidL/R` (or elbow), `wingTipL/R`, a tip `marker` (FX handle), and
`parts.wingElements = [{root,tip,length}]` per primary (fold measurement). Mirror-built
(`scale.x = -1`) → `wingsymprobe` must stay Δ0.000.

**Motion character** (human judges live): a slow massive downstroke + long glide hold; the
fingered tips lead, the covert rank lags; fold contracts span ≤0.65× glide. Wings translucent
(`opacity ~0.82`) so obstacles show through the wing wall (the wing-fade contract — the
Solar CP3.1 lesson).

---

## §4. TAIL — `sunpennantTail` (NEW, registers 'sunpennant') — re-proportioned, corridor-safe

Kill the down-hanging fishbone. Build a **swept-aft SUN-PENNANT**: a gathered flame-feather
train that LIFTS into the free sky zone and streams back, staying OUT of the lower-centre
course corridor (the Visibility Law + the fan-must-rake-aft + panels-not-wires lessons).

- **RAKE UP-AND-AFT, not down.** The shipped `rotation.x = 0.12` (droop) becomes a LIFT: the
  pennant root sits at/above the tail-root line (`tailAnchor.y` raised) and the ribbons rake
  aft with the flight line, projecting into the empty upper/aft frame — never the
  { y<spine, z>hip } corridor. Aft-rake angle α from the flight axis capped ≤ 60° (the
  anti-drag-plate law); size ribbon length from the projected budget, not the raw length.
- **GATHERED, not a bottle-brush.** 3 (f1) → 5 (f3) BROAD OVERLAPPING ribbon-feathers
  (~12% overlap at the roots so the black-fill is ONE shaped drape, not N separated spokes —
  the feather-duster fix), with a **centre-longest depth hierarchy** (the comet point) and
  short wide edges. NOT the shipped 5-sliver-per-segment symmetric fan.
- **Re-proportioned length:** total pennant length ≈ **2.0–2.4** at apex (DOWN from the
  shipped 3.15) — compact; it reads as a comet-tail of fire, not a fishbone hanging over the
  water.
- **Palette:** ivory/gold vanes, T4 ember-shadow between ribbons, ONE continuous orange (T-
  emissive) burning hem stroke on the trailing edge (the accent as ONE hem, not N per-ribbon
  rims — panels-not-wires). Center ribbon may carry the single apex T0 stroke (shared with
  the wing budget — total ≤1 near-white overall... the heart is the primary; if the pennant
  takes it, the wing pinion does not).
- **Contract:** return `{ group, segs, tailFins:null, accentMats:[plumeMat] }`; the shaft
  `segs` ride the rig coil (the wave travels WITH the flow, root→tip phase lag). Corridor
  assert (§7): no ribbon geometry in { y < bodyMidY, z > haunch }.

---

## §5. HEAD — `sunhawkCrownHead` (NEW, registers 'sunhawkCrown')

A regal beaked phoenix head + a back-raked feather crown that reads as **the bright origin
of the spine glow in the rear-chase**, framed by the sun-collar (§6).

- **Raptor read (upgrade the shipped soft cone beak):** a proud SHORT HOOKED eagle beak
  (two beveled gold facets, upper hooks over lower) — regal predator, not a long dowel.
  Skull a lofted wedge (NOT a bare sphere): flat brow → tapered crown. Gold beak (T2), ivory
  skull (T1), warm-gold eyes (T-emissive low) — the brightest facial points bar the collar.
- **Back-raked CROWN FAN:** a fan of stiff gold crest-feathers raking back off the crown
  (grows f0→f3), T2 gold vane / T4 back — from directly behind, this fan + the collar-blaze
  is the bright dorsal read (the "firebird seen from behind"). Crown feather tips are
  STRAIGHT-swept-back (veto: no curl).
- **Eye ladder:** warm gold `0xffe6a0 → 0xfff0c0`; size 34% round low-set (f0) → 22% keen
  (f3). Never past ~45% (GOOGLY).
- **Contract:** shares `bodyMat`/`eyeMat` from the torso; return `{ group, spineMats:[
  crownMat] }`. Publish `headLength`.

---

## §6. The coronation LADDER f0→f3 (withheld-regalia growth, like Solar)

Each rung confers a CATEGORY (new HARDWARE + more light + a signature beat), never scale
alone. **The withheld signature = the SUN-GORGET COLLAR** — a radial fanned ruff of stiff
flame-feathers around the nape/shoulders that BLOOMS rung by rung (the "Reborn in fire"
coronation). No form wears the full crown early.

| dial | 0 Ember Hatchling | 1 Kindled | 2 Solar | 3 Celestial Rebirth |
|---|---|---|---|---|
| read | warm charcoal chick, proud stub keel, ember crest, NO collar | firebird: neck arches, first secondaries, ember collar-RUFF buds, core lit | white-gold begins: full ranks, collar half-fanned + gilt, rose-gold edges | WHITE-GOLD DIVINE: blazing sun-gorget, white-hot heart, fingered primaries, full pennant, halo |
| body value / glowLevel | warm charcoal `0x2a1712` / 0.25 | `0x32150f` / 0.5 | ivory begins `0x6a4a30` / 0.75 | solar-ivory `0xf2e8cf` / 1.0 |
| `keelDepth` (breast prow) | 0.7 | 0.85 | 0.95 | 1.0 |
| `neckArch` | 0.3 | 0.6 | 0.85 | 1.0 |
| `coreScale` / heart | dim glow | lit | glow-pool | **T0 white-hot** |
| `collarFan` (SUN-GORGET) | 0 (none) | 0.3 ember ruff | 0.6 gilt half-fan | **1.0 blazing gorget** |
| covert rank / wing | 3 | 4 | 6 | 7 |
| secondary rank / wing | 2 | 4 | 5 | 6 |
| primary fingers / wing | 2 (blunt) | 3 | 4 | 5 (emarginated) |
| `fingerSplit` (emargination) | 0 | 0.3 | 0.6 | 1.0 |
| `roseGoldEdge` (T3 rim) | 0 | 0.3 | 0.7 | 1.0 |
| span:body | 2.0× | 2.4× | 2.8× | 2.8–3.2× |
| wing dihedral | 10° | 12° | 14° | 12–16° |
| `crownFan` | 2 | 3 | 4 | 5 |
| pennant ribbons | 1 stub | 3 | 4 | 5 |
| `pennantLift` (up-aft) | low | rising | swept | full swept sky-pennant |
| `igniteStage` | 0 | 1 | 2 | 3 |
| tri target | ~2.0k | ~2.6k | ~3.2k | ~3.6k |

ALL dials monotonic; forms differ in proportion + feature-count + regalia, never scale
alone (anti SAME-DRAGON-BIGGER). The Hatchling HINTS the apex (level proud-stub keel, a 2-
finger blunt wing, an ember crest, a dim heart) but wears NO collar — so Rebirth actually
CONFERS the gorget. `igniteStage` gates WHICH emissives light via a stage-aware material
factory `sunhawkMats(def, glow, stage)` (copy the STRUCTURE of Solar's `sovereignMats` /
Molten's `calderaMats`: per-stage emissive ladders, `userData.baseEmissive/baseIntensity`
for the surge tick, saturated bloom-safe hues).

**Rebirth Surge:** promotes each emissive ONE tier up (orange seams → brighter, heart →
white-hot bloom permitted), keeps the white-gold trail (`hasStyle:true`), warm-gold screen
wash kept low (`feverWash` unchanged). The collar-gem + heart flare; the ivory body does
NOT (it's out of `spineMats`). Verify course legibility in `framecap` WITH Surge on.

---

## §7. Visibility + verification

**Corridor commitments (the Visibility Law, unconditional):**
- Compact silhouette; body long axis LEVEL; hero mass forward/lateral (wings) + dorsal
  (collar) — NOT in the lower-centre.
- **Tail pennant lifts UP-and-AFT into the sky zone** — ZERO geometry in { y < bodyMidY,
  z > haunch }. Asserted in `tests/starters.mjs` (corridor max|x| ≤ 0.6, area ≤ 1.3).
- Wings translucent so obstacles read through the wing wall; the collar/halo bright + compact
  (never a Pearl-ring behind the head that screens the forward sightline).
- Judge in the REAL `framecap` (course present), never the studio void — the next ring +
  nearest obstacle stay legible within ~1.5 dragon-widths, WITH Surge active.

**Verify-by-failure-class gauntlet (all from `reforged/`, run every CP):**
| Class | Tool | Gate |
|---|---|---|
| Budget | `node tools/tricount.mjs --ci` | every form <6000, monotonic ladder (targets §6) |
| Integrity | `node tests/blueprint.mjs` | builder/shader/layer names, roster validation |
| Runtime | `node tests/smoke.mjs` | per-frame crashes → invisible dragon (coreGlow mesh-or-null; full attach contract) |
| Symmetry | `node tools/wingsymprobe.mjs phoenixReforged` | mirror wings Δ0.000 (incl. flap poses) |
| Geometry | `node tests/starters.mjs` | a PREMIUM `phoenixReforged` block (reaches Eternal): tris monotonic; collarFan/roseGoldEdge/fingerSplit/coreScale monotonic; tip terminal Y-slope ≤0 & Z-slope >0 (anti-curl); corridor clear; chord:span ≥0.4; ≤1 near-white; motif-anchor drift ≤0.15; **NaN-vertex guard**; maxTierFor('phoenixReforged')===3 |
| Aesthetics | `node tools/dragonstudio.mjs phoenixReforged r<n>` + `node tools/framecap.mjs phoenixReforged` | rendered ladder + rear-chase + dark/pale/gold + sil-rear + the REAL chase cam incl. Surge |

**ROUND-0 SELF-AUDIT (cheap gate before the expensive Fable gate):** render `r0`, audit the
apex sil-rear + dark-sky + framecap HARD against the §0.5 firewall (confident faceted mass
not thin blades; a dominant element + scale hierarchy; specific-not-generic silhouette;
hero fills the rear frame; clean deliberate edges; matte body + saturated accent no washout;
no noisy texture; spectacle triad present) — fix obvious violations so Fable never sees a
build below ~3.5.

**Firewall pre-score (target every Fable axis ≥3.5 at round-0, no axis a known P0):**
silhouette specificity · body sculpt (keel not sphere) · wing surface/ranks (filled not
flat) · two-value relief / no-washout · tip-not-curled veto · corridor-clear · premium-not-
tacky glow · apex signature (sun-gorget) · distinctiveness (§8).

---

## §8. No-leak / distinctiveness — claim the WARM WHITE-GOLD FEATHER region

| Axis | Molten Phoenix | Solar Sovereign | Pearl Seraph | **Phoenix Reforged (this)** |
|---|---|---|---|---|
| Silhouette region | bottom-heavy pyre-train | top-heavy M / arch | lofted swan-spread | **forward-anchored breast-prow + radial sun-collar** |
| Wing construction | pyre-fan flame-blades | membrane lance-vault | smooth feather-scale swan | **filled deep-chord eagle wing, emarginated fingers** |
| Tip | flame-lick barb | gold lance tip | smooth hooked arc | **aft-raked down-drooped finger (NO curl)** |
| Regalia motif | crust caldera / molten heart | eclipse ring + brow gem | head HALO + blade-fins | **radial SUN-GORGET collar** (not a ring, not a halo) |
| Body tone | DARK magma crust | DARK midnight-indigo | pale + COOL blue | **pale WARM ivory-gold** |
| Emissive hue | magma orange-in-seams | blue-violet arcane | cyan/sky-blue | **warm orange (support only) + rose-gold rim** |

**The distinctiveness veto (a standing Fable FAIL):** does any part read like Molten (dark
crust), Solar (violet eclipse-king / M), or Pearl (cool-blue swan-seraph with a head-halo)?
Hand Fable those three tiles. Specifically: our collar must NOT read as Pearl's halo (it is
a fanned FEATHER RUFF around the nape, opaque + radial, not a thin ring behind the head);
our wing must NOT read as Pearl's smooth swan (ours is a fingered eagle with hard emarginated
tips); our tone must NOT read as "Solar but warmer" (ours is a LIGHT ivory body, forward-
anchored, no ring). This is the WARM WHITE-GOLD FEATHER firebird and it owns that lane.

---

## §9. Build plan — apex-first, THREE checkpoints, each behind a harsh Fable critic

Coexist as NEW roster key **`phoenixReforged`** (name "Phoenix Ascendant", rarity/cost/stats
mirror `phoenix`); the shipped `phoenix` def stays byte-identical. New self-registering
builders in a new file (e.g. `dragonPhoenixReforged.js`), default-off; only
`phoenixReforged.parts` opts in. Per-form changes ride `forms[]` model-knob accretion
(no per-form builder swaps). Migrate/retire ONLY on owner approval.

- **CP1 — TORSO + HEAD (kill the sphere).** `sunhawkKeelTorso` (lofted keel, arched neck,
  haunch, tail-root, heart-fire, full attach contract) + `sunhawkCrownHead`. Old feather
  wings + plume ride along (regression only). GATE: dual-sky `dragonstudio` shows a KEELED
  organic body (side profile is a sculpted firebird, not a ball-chain) + `framecap` course-
  legible + coreGlow/attach-contract green. Fable diagnoses the sculpt.
- **CP2 — FEATHER WINGS (the hero).** `sunfeatherWings` — filled surface + 3 organized ranks
  + two-value relief + emarginated aft-down fingers + shared `sunLeadY/Z` profile. GATE: the
  strut/flat-sheet test across all 4 views (SURFACE not lines; filled inner 70%; 3 ranks read
  as layers; dominant primary ×1.5; NO curl — terminal-slope assert) + "not a plane / not
  Seraph / not curled" veto + `wingsymprobe` Δ0.000 + `framecap`.
- **CP3 — TAIL + LADDER + POLISH.** `sunpennantTail` (swept-aft gathered pennant, corridor-
  clear) + the sun-gorget COLLAR regalia + the f0→f3 coronation ladder (dials monotonic,
  withheld collar) + `sunhawkMats` ignition ramp + the full gauntlet + the premium
  `starters.mjs` assert block. GATE: the high-effort combined Fable gate (weighted avg ≥4.0,
  no axis ≤2, distinctiveness + no-curl + washout vetoes) on the REAL renders (dual-sky
  `dragonstudio` + `framecap` incl. Surge), run as a standing ratchet.

**Fable gate discipline:** high-effort, per round, judges pixels; **calibrate on the SHIPPED
`phoenix` FIRST** (the same brief must FAIL it — if it PASSES the thing we're replacing, the
brief is too soft). Human judges MOTION/FEEL on the live PR preview (idle coil not whipping
the pennant across the cam, the flap cycle, the Rebirth surge pulse, the collar bloom) +
approves any net-new silhouette element (the sun-gorget) before migrate.

## CHANGELOG
- **(design)** Build sheet authored from the shipped-phoenix diagnosis + owner critique.
  Load-bearing decision (§B: the Ascending Sunhawk — forward-anchored keel + deep-chord
  emarginated eagle wing + radial sun-gorget) pending owner blessing before CP1 freezes.
