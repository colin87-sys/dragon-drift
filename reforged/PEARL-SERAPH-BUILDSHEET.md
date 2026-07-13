# PEARL SERAPH — Premium Redesign Build Sheet

**Radiant Paladin · SSR → SSSR · 4 forms (Dawn / Kindled / Radiant / Eternal).**
This sheet is the frozen work order for lifting the shipped Pearl Seraph from a
mecha-reskin to a shipped-4.5 premium creature, produced by the mandated Fable
design-director loop and **confirmed by the owner (2026-07-12)**. Read
[`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md) first — this sheet is execution against that
method, not a replacement for it. A harsh-critic Fable gate follows every checkpoint.

---

## §0. IDENTITY — LOCKED (do not drift)

A celestial **Radiant Paladin** seraph — a holy war-dragon of gilded light, deliberately
set apart from Phoenix's flame-feather gold. Surface language: **matte pearl + true
metallic gold rims/gild + dawn-blue seam glow + a rare crystal gem**, holy warm-white.
Broad, smooth, high-raised angelic wings. The lightest-value body on the roster.

**Contract freeze (save/shop):** key `pearl`, name `Pearl Seraph`, `SSR → SSSR`,
`cost 3400`, `stats`, `fx.auraColor`, and a **4-long accretive `forms[]`** — none change.
The three locked roster differentiators (do not blur): metallic **straight-edged
plate-feathers** (never soft warm plumes → Phoenix), **lightest-value** body (Solar is the
darkest), and the **halo + comet pair** nobody else carries.

## §0a. OWNER DECISIONS — CONFIRMED 2026-07-12

| # | Decision | Confirmed choice |
|---|----------|------------------|
| **D1 Halo** | Prominence + arrival | **Flat saint's disc**, arrives at Radiant, faceted gold band scaling ~1.5× at Eternal. Laddered `none / none / modest / full`. Restrained until the apex earns it. |
| **D2 Glow** | Cruise brightness | **Withheld / component glow.** Cruise = gem eyes + halo + comet core only; dawn-blue seams + full halo blaze reserved for Surge / tier-up. Premium-because-withheld. |
| **D3 Tail** | Keep or pivot comet | **Keep + rebuild at hero scale** — big gilded blade-fan + long translucent light-streamers on a real bone-chain tail. The rear-chase money read. |
| **D4 Armor** | How paladin | **Keep gilded plate, re-seated** onto anatomy (recessed collars, cowl over the wing root). War-dragon in gilded plate. |
| **D5 Motif** | The ONE bloom carrier | **The brow gem** — blooms `0.3 → 0.6 → 1.0` up the ladder into the crown/halo complex; rear-visible via the halo as its lockstep carrier. Anchors the §7 motif-drift assert. |
| **D6 Motion** | How far to push | **Keep the cathedral yoke-flap** (it's the one genuinely bespoke subsystem). Add ONLY: the wrist-fold hand (tear fix), a soft per-feather lag on the primaries, and comet-streamer flutter. No re-tune of the core beat until geometry lands. |

---

## §1. DIAGNOSIS — why the shipped build under-delivers

The shipped Seraph is a **mecha reskin that never finished becoming organic** — it inherits
the Aurum Toro armature + mechaKit atoms (`dragonSeraph.js:4` imports `frameBar,
chevronLight`) and spends its premium budget on *chips and rims* instead of *form*. Named
failure modes present (all cited against the code on-branch):

- **WING** — flat 2-quad membrane, no camber (`dragonSeraph.js:150–156`, called
  `:170/:174/:177`); straight-bar leading edge, constant 16° sweep (`:109/:123/:157–160`),
  no gull arch / ogee / carpal knuckle; **picket-fence** feather fan (uniform even-pitch,
  −10% len / −22% wid linear decay, one cant — `scaleRow :69–85`), no dominant + decay;
  **sticker gild** (zero-thickness 1.05× card dropped 0.012 behind, `:60–62`), z-fights /
  vanishes at distance; **LED-strip glow** (`chevronLight` chips at mid-chord, `:161–165`);
  **two-tone law unused** — only `def.wingInner` reads; **`def.wingOuter` (0x6aa0f0) never
  referenced** → dorsal = ventral = one pearl tone; **membrane split across joints**
  (A/B/C on `pivot`/`mid`/`tip`, `:170–177`) → cracks on curl; **bolted-on** — no cowl,
  gusset, or covert overlap into the body.
- **TAIL** — bead-chain worm of 9 separate cylinders as flat siblings (`:246–272`) with
  per-segment gold "ring" caps; the declared rear-hero comet is a ~0.5u trinket on a ~2u
  body (`:274–299`); always-on `emissiveIntensity: 0.14` floor on the broad vertebra mass
  (`:229–232`); not a −anchor bone chain.
- **BODY + NECK** — dead-level straight spine (every ring at `cy = TORSO_Y`,
  `dragonSeraphBody.js:81–91`); neck is 3 stacked cylinders with ring collars
  (`:169–182`); `model.neckSegments: 5` **ignored** (hardcoded 3); **no measurement
  handles** returned (`:199`) → the §7 harness can't measure this dragon; LED filigree
  sticks (`:147–151`).
- **HEAD** — literal `BoxGeometry` jaw (`:223–224`); straight stick horns (`:238–243`);
  no per-form eye ladder.
- **LADDER SCANDAL** — the builders read only `formLevel, halo, wingScale, wingChordScale,
  wingDihedralDeg, tailSegments, glowIntensity`. Therefore **dead** knobs:
  `wingForm` + the whole 4-entry `wingForms[]` table, `tailStyle`, `bladeFins`, `crest`,
  `backCrest`, `wingVeins`, `glowSeams`, `ridgeCount`. A tier-up = recolor + a couple more
  feather cards; **span never grows** (`wingScale: 0.9` constant). Apex (4506 tris) is only
  ~⅓ richer than the hatchling (3435). SAME-DRAGON-RECOLORED.
- **KEEP (good, do not break):** the yoke→pivot→mid→tip hinge chain; the sanctioned
  outer-wrapper mirror (`:193–198`); the tri-neutral `wingChordScale` knob (`:130–135`);
  and the genuinely bespoke cathedral yoke-flap (`dragons.js:358–369`) — motion is the one
  subsystem that is NOT photocopied.

**Live tri counts (tricount, HIGH):** Dawn 3435 / Kindled 3742 / Radiant 4302 /
Eternal 4506 — ~1,500 tris of headroom under the 6,000 ceiling.

---

## §2. PRESCRIPTION — the costed redesign (apex ~5,700 tris; ladder ~2,900 / 3,900 / 4,900 / 5,700)

### WING — rebuild (hero; ~2,000–2,300 tris/pair @ Eternal)
- **Keep byte-identical:** yoke/pivot/mid/tip part names + attach contract; the
  outer-wrapper mirror; `wingChordScale`; the def's `flap` block (retune only after
  geometry lands — D6).
- **Arm as profile-as-function** `seraphArmY/Z(t)`: a raised angelic **gull arch** peaking
  at a carpal ~t 0.40, easing to the tip, with a gentle aft ogee. Straight taut segments
  *between* curved stations give the curve-vs-straight contrast. Gilded spar → a tapered
  **wedge tent** (3–4 faces, thick root → thin tip), not a `frameBar` rail.
- **Feathers → dominant + decay ranks:** three ranks (coverts / secondaries / primaries);
  primaries carry a **dominant** (longest at the carpal) decaying ~0.84/element, with
  per-element cant jitter + z-stagger. Each feather is a **cambered 3-face tent with the
  gold rim as the raised ridge geometry** (kills the sticker rim + z-fight in one move).
  Rounded coverts inboard → long straight-edged gilded primaries outboard (seraph-metallic,
  not Phoenix-soft).
- **Cambered, tiered membrane:** subdivide each bay 3–4 chordwise × 3 spanwise with a
  center billow drop; paint **3 value tiers** root→tip using `wingInner` → mid →
  **`wingOuter` (finally used)**; ventral one step cooler/darker (two-tone law).
- **Fix the tear:** inboard membrane stays on `pivot`+`mid`; everything outboard (primaries
  + outer membrane) moves into ONE **hand group anchored at −carpal** on `wingTip` (Vesper
  `dragonVesper.js:633–637`) so the wrist-fold moves one rigid sheet.
- **Root integration (D4):** a 2–3-plate **pearl covert cowl** static in the body frame
  lapping the yoke (overlap > weld) + an inboard **propatagium gusset** sweeping to the
  gorget line. Kills BOLTED-ON.
- **Glow as components (D2):** the dawn-blue seam becomes the **feather-shaft ridgelines of
  the 2–3 dominant primaries + the spar's inner groove** — carved components that light,
  not chips. Cruise low; blaze on Surge.

### BODY + NECK — extend / reshape (~1,100 tris)
- **Keep:** the hourglass loft stations, gorget / pauldron / keel / fairing concepts, the
  attach-contract shape.
- **Line of action:** give the hull rings a `cy(z)` curve (chest proud, waist dip, tail-root
  rise), carried into the neck (law 2). Publish **`spinePoints`** while doing it.
- **Neck:** replace 3 stacked cylinders with ONE continuous lofted tube through 5 stations
  (honor `neckSegments`), S-curved to the head; gold collars → 2 partial gorget-language
  arcs in carved recesses, not full torus rings.
- **Pauldron ↔ wing root (D4):** move `wingRoot` under the pauldron rim, enlarge the dome so
  the yoke emerges from under armor; the wing-side cowl laps over it from above.
- **Filigree sticks → carved seams:** inset dawn grooves along the flank muscle lines
  (geometry channels, emissive floor ~0 in cruise).
- Publish **`motifAnchor`** (the brow-gem line, D5) and **`wingElements`** for §7.

### HEAD + HALO — extend (~700 tris incl. halo)
- **Keep:** skull loft, crown-point rhythm, gem eyes as material, the halo module + its
  `haloBob`.
- Sculpt a proper lofted jaw + short chin (kill the box); horns → 2-segment curved sweeps
  tapering to 12–15% (curve against the straight crown points); eyes get the ladder
  (`eyeScale` per form: large round Dawn → narrow keen Eternal, emissive intensity **rising**
  with form — the Vesper inversion fix).
- **Halo (D1):** flat saint's disc; scale with the ladder, thicken the ring to a faceted
  band so it survives distance; arrives Radiant, ~1.5× at Eternal.
- **Motif (D5):** the brow gem blooms `0.3 → 0.6 → 1.0` up the ladder, rear-carried by the
  halo.

### TAIL — rebuild (D3; ~900 tris)
- **Keep:** the animator contract `{ group, segs, tailFins, accentMats }`; the comet
  *identity*.
- **One continuous lofted tail** (elliptical / 8-sided, monotonic taper to 12–15%) binned
  onto a **4-joint nested −anchor bone chain** (Vesper `splitFanTail` `:786–795`) so the
  rudder/coil wave has real joints + zero gaps. Gold → a single continuous dorsal ridge
  tapering out, not per-segment caps.
- **Comet at hero scale:** blade fan ~2.5× current, 2–3 gilded blades with a dominant + holy
  core + 4–6 translucent plume streamers ≥0.6× body length (≤2 alpha layers/pixel — they
  trail, not stack). Banner fins fold into the comet fan as its outer petals (`tailFins` =
  the two outer blades, keeping `bankGain`). Streamer flutter per D6.
- Kill the vertebra emissive floor; tail glow = comet core + blade rims (components).

### GLOW / VALUE SYSTEM (cross-cutting, D2)
- **No always-on emissive on any broad mass; every glow is a carved/ridged component.**
  Cruise = pearl + gold + gem eyes + a low halo/comet glow; Surge = seams + halo + comet
  blaze. All mats already ride `userData.baseEmissive/baseIntensity`, so the Surge tick
  works unchanged.
- Wing 3 tiers + ventral tone; body 2 tiers (dorsal pearl / ventral warm cream `belly`
  0xfff4d8, currently defined + unused); tail 2 tiers.

### TIER LADDER — rewire `forms[]` semantics (no schema change)
- **Delete-or-rewire every dead knob.** Replace with live dials the new builders read
  (Solar's pattern, `dragons.js:436–450`): `wingScale` **per form** (span
  0.78 → 0.88 → 0.98 → 1.08 — span finally grows), `featherRanks`, `primaryCount`,
  `haloStage` (0/0/1/2), `dawnStage` (glow ladder), `cometStage` (nub → banner → comet →
  comet+streamers), `neckSegments`, `eyeScale`/`headScale`, `gorgetLayers` (2 → 4), posture
  via the `cy` curve amplitude. `forms[]` stays length 4, accretive, model-knobs-only.
- Palette ramp kept (grey-dawn → radiant pearl). The "dawn brightening" is the identity-
  correct **inversion** of the §4 darken rule — record it as the sheet's sanctioned
  exception and assert it monotonic.

**Budget:** wings 2,300 + body 1,100 + head/halo 700 + tail 900 + gorget/cowl/misc ~600 ≈
**5,600 apex** — inside 6,000. ULTRA seg() scaling as today; alpha limited to comet plumes
(≤2 layers).

---

## §3. CHECKPOINT PLAN (coexist → hero → ladder → migrate; fresh Fable gate per round)

Branch `claude/pearl-seraph-redesign-ci8ulg`. New builders self-register under **new
names** (`seraphWing2` / `radiantSeraphWing` etc.), **default-off**; `pearl.parts` flips
only at CP4. Full roster gates green every commit; the shipped `pearl` stays byte-identical
until migration.

- **CP0 — Calibration.** Run the full §7 capture set + verbatim gate prompt on the
  **shipped** pearl (4 forms, quadtych, 3 backdrops incl. a **warm-gold** sky). Expected
  FAIL citing §1. Record it. (A pass means the pipeline is broken — stop.)
- **CP1 — Eternal body + wings.** New torso + wing builders, apex dials; captures (rear
  chase / side / rear-¾ bank / top planform, 3 backdrops) → fresh Fable gate per round to
  PASS (avg ≥4.0, no axis ≤2). **STOP for owner go.**
- **CP2 — Eternal head/halo + tail.** Full apex assembly; add the 4-form `starters.mjs`
  SPEC + measurement handles (`spinePoints`, `wingElements`, `motifAnchor`). Gate. **STOP.**
- **CP3 — The four-form ladder.** Rewired `forms[]`; true-scale montage, face crop/form,
  black-fill quadtych; monotonic-dial asserts 0→3. Gate judges the growth arc +
  anti-collision vs phoenix/solar/vesper black fills. **STOP.**
- **CP4 — Integration + migrate.** Flip `pearl.parts`; gameshots (chase idle / mid-bank /
  tier-up); full suites (`blueprint`, `tricount --ci`, `starters`, `flapcheck` — pearl
  rides `model.flap`). PR preview → **human judges motion/feel**; merge verdict is human. A
  LEAPFROG lesson file at every meaningful step (THE RULE).

---

## §4. VERIFICATION HARNESS (run from `reforged/`)

`tricount` (<6000, monotonic ↑) · `blueprint` (parts resolve, no NaN) · `smoke` (renders in
flight) · `wingsymprobe pearl` (Δ0.000 across 5 poses) · `seamprobe` (cruise ≈ dark / surge
= dawn hue) · `flapstrip pearl` + named-pivot amplitude capture (wave travels; wrist-fold
reads) · `tiershots pearl` (rung-over-rung earn; dawn-brighten ladder) · `gameshots` /
`surgeshot` · the pearl block in `starters.mjs` (tris↑, value ramp monotonic, cruise-emissive
= eyes-only by contribution, motion ladder monotonic, brow-gem motif-drift, span↑ per form,
no-forbidden-import firewall). **Roster byte-identical** until CP4.

## §5. LIMITATIONS / RESIDUALS (owner-acknowledged)

1. **Tri headroom:** apex targets ~5,700 of 6,000 — ~300 tris left for future pearl work on
   HIGH after this.
2. **Overdraw is the real cliff:** comet streamers + halo effects capped at ≤2 alpha layers;
   **no additive aura shell** around body/wings (by law) — some radiant-glow looks are off
   the table.
3. **Shared-rig constraints:** the wing keeps the yoke/pivot/mid/tip contract and the tail
   returns `{segs, tailFins, accentMats}` — motion is improved (wrist-fold, bone-chain tail),
   not replaced; membrane may not span an articulated joint unless it rides a single fold
   group.
4. **The ladder rewire is as heavy as the wing work** — invisible plumbing, but the #1 source
   of "this dragon doesn't grow." CP3 is a first-class checkpoint, not cleanup.
5. **Harness-blind axes:** no WebGL in CI. Motion/feel, halo bob, streamer flutter, dark-shop
   legibility, and bloom-under-ACES are **judged only by the owner on the PR preview** — a
   dragon can gate at 4.25 frozen and still feel dead in flight. Budget a preview session per
   checkpoint.
6. **Roster-collision fences (do not blur):** metallic straight-edged plate-feathers (vs
   Phoenix's soft plumes), lightest-value body (vs Solar's darkest), the halo+comet pair.
   Identity stays matte-pearl holy unless the owner re-opens warmth/darkness.

---

*Confirmed 2026-07-12. Nothing here requires an engine schema change — only new
self-registered builders, the `forms[]` rewire, and the 4-form test SPEC. CP0 calibration
may begin on the branch immediately.*
