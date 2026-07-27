# FORNAX — "The banked furnace" · Premium Build Sheet (fire wyvern)

The builder's contract for a bespoke, low-poly, premium **western fire wyvern** — two hind
legs, wings-as-arms, a furnace inside a char-armoured hull. Authored fresh; its own dragon,
its own surface language, never Smaug/Drogon/Rathalos.

**Read first:** [`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md) (kits + failure modes),
[`AAA-PIPELINE.md`](./AAA-PIPELINE.md) (value-structure law, cheap-tell registry, convergence),
[`FLAP-DESIGN.md`](./FLAP-DESIGN.md) (before touching flap dials).
**Companion reference: [`DRAGON-ANATOMY-REFERENCE.md`](./DRAGON-ANATOMY-REFERENCE.md)** — all
`(ref §N)` citations below point THERE; this sheet never restates its tables. **Numbers here
are the authority; the Fable gate (§12) judges against this sheet.** Every dial is written
`value (ref §N range, ×K exaggeration)`; where the reference gives no consensus figure the
sheet locks a RANGE and says so.

> **⚠ REFERENCE-FORCED REVISIONS (do not resurrect the drafts):** the earlier locked
> direction specced a **hooked spade tail** (not period, the #1 de-kitsch target — ref §1),
> **tucked hind legs** (raptors don't tuck; tucked is invisible from the chase cam — ref §3),
> and an implied deep **keel blade** (flight muscle is 20–25% of mass, keel SHALLOW — ref §2).
> All three are superseded below (§2, §7, §8). The rear-chase sentence was rewritten.
> **A fourth reversal (v2, critic-forced): the bare-spine law is REVOKED** — the dorsal
> midline now carries THE SLAG SERRATION (§2 reversal block, §4-R1). Do not resurrect
> "clean sky above the spine" either.

---

## 0. Identity contract

Fresh roster key **`fornax`** — coexist-style, nothing shipped changes. Fields:
`name:'Fornax'` · `title:'The banked furnace'` · `rarity:'SSR'` / `maxRarity:'SSSR'` ·
`cost 2400` (SHIPPED, `dragons.js:698` — no longer an open call; owner may retune) ·
`stats` (SHIPPED `dragons.js:703`: speed 1.06 / handling 1.02 / drain 0.9 / regen 1.1 —
supersedes the v0 placeholder 1.14/0.96; still a heavy flyer, owner tunes) ·
`fx.auraColor '255,112,16'` (furnace amber `#ff7010`) ·
`forms[]` accretive, length 4 · `hasStyle` · new module `js/dragonFornax.js`, builders
default-off, hero opt-in only.

**Frozen identity laws:**
1. **The furnace is INSIDE.** Glow only ever LEAKS where the armour parts (plate seams,
   throat keel, membrane underside). No surface-painted flame, no torch, no lit faces.
2. **FOUR limbs, never six** (ref §1 — the one hard wyvern law). No forelimb geometry, no
   shoulder-hinged wing separate from the arm, at any rung, ever. The wing IS the arm.
3. **Cockatrice guard** (ref §1): no bird-scaled feet, no comb/wattle, no beak. Feet are
   plated reptilian, three-toed.
4. **R ≥ G ≥ B strictly, everywhere, in every fire pixel** (ref §7). B > G anywhere =
   plasma = defect. Never author a white core — the tonemapper clips it (ref §7).
5. **Wing TOPS never emissive.** The underside owns the backlight; the dorsal silhouette
   survives its own spectacle (locked direction, confirmed by ref §7 painters' law).
6. **Cruise = eyes + a banked-coal hint only**, contribution-capped; near-zero base
   emissive, high surge multiplier, full fever palette overridden (house §6).
7. **Char is never flat black**: albedo 0.02–0.045 linear, cool-neutral tint (ref §7) —
   the WARMTH is emitted (leak light + warm key), never painted into the diffuse.
8. **One blue exists**: a diffuse temper-oxide iridescence band (straw→purple→blue,
   ref §7) on horn tips + plate rims. Non-emissive, close-range only, ≤1% of surface.

## 1. Art direction (north star)

**BANKED — a furnace wearing its own slag.** Real banked coals are dark on top and alive
underneath; the fire is not ON the creature, it is IN it, and the armour exists BECAUSE of
it — heat-shield plates, char-dark outer faces, ember-rimmed only at the overlaps. Solar
wears spectacle as a crown, Vesper withholds cold light; **Fornax withholds HEAT** — cruise
is a charred silhouette with two eyes and a coal-hint, and THE STOKE (§3) is the furnace
remembering itself. Hue lane: furnace amber-orange, blackbody-anchored `#ff3800→#ff8912→#ffb46b`
(1000–3000K, ref §7) — never yellow-white paint, never red-pink, never vert (the pestilence
tincture, ref §1). Gules/gold is the sourced fire-wyvern tincture family (ref §1); ours is
gules driven to char. Hero: **THE UNDERLIT CRESCENT** (a LOW WIDE four-digit crescent —
taut flat bays, dark above, furnace-lit beneath; planform + bay language set apart from
Vesper's tall deep-cupped fan by committed numbers, §2/§5 — and pose-gated: it is a
bank/transition payoff, not a constant, §5). Motif: **THE STOKE** (the seam network
igniting tail-ward).
Growth verb: **STOKING** — the whelp is a cold coal; each ascension feeds the furnace.
One word: **BANKED.**

Stylization axes (locked): taper contrast **×3 over reference** on every limb/horn/digit;
curve-vs-straight alternation on every profile; large struck facets; **four value tiers
judged in RENDER space** (§4b-RL6/§11 — the v1 "≥0.05 luminance" wording was material-space
and passed while the creature rendered at median 14/255; that ambiguity is closed);
**dominant + decay on every rank** — no equal-pitch rank anywhere (ref §6: equal ranks have
NO natural precedent).

**Rear-chase sentence (re-re-rewritten — torso-richness audit; supersedes the
clean-sky-over-the-spine draft, which is REVOKED in §2):**
*"A charred anvil slung between two vast low crescents, each read by its scalloped
three-bay trailing edge, its spine a serrated rank of struck-slag blades running occiput
to tail and rolling on into the tail's ridge crest, twin swept horns still the tallest
cut, hind legs splayed bat-wide into the wing–tail gap, and a blunt ember firebrand at
the end of it."*
(The chipped brow is ~2–3px from the chase cam — it lives in the §11 turntable-only list,
not in this sentence. At gameplay scale the whole dragon spans ~180px: digits are NOT
countable; the wing's rear-chase claim is the scalloped 3-bay trailing-edge silhouette.)

## 2. Silhouette language + distinctiveness gate

Primitive: **a low wide crescent-pair around a dominant anvil, its whole dorsal line one
serrated blade-rank — horns dominant at the occiput, slag serration down the spine, ridge
crest out the tail.** Mass census **4, one dominant**
(ref §8: 3–5, mode 4): ① the anvil torso (DOMINANT), ② the wing-crescent pair,
③ the horned head, ④ the ridge tail. Legs are tertiary (~30% of their parent mass, ref §8).
Primary split 70/30 torso-forward vs aft (never 50/50, ref §8). Colour 60-30-10
(ref §8): 60 char, 30 ash/scorch midtone, 10 ember accent — accent in exactly TWO contiguous
places (throat-keel seam + wing underside), ≤10% of area.

**⚠ REVERSAL v2 — THE BARE SPINE IS REVOKED (torso-richness audit, 1.9/5 FAIL).** The
v0–v1 spec reserved the dorsal midline — no spike rank, "clean sky" above the spine —
saving the ridge for the tail and the horns for I3. Five build rounds honoured that law
and it is the single biggest reason the side profile read as a crocodile lozenge: a 3.2u
hull whose tallest dorsal event is a 0.052u scute cannot break its own outline, while the
Tempest breaks a comparable body with vanes built to ≈**0.284u** (formula ceiling 0.337u —
corrected figures, audit C1; the earlier "~0.37u" was a misquote). Recorded as a
director's reversal like the spade and the tuck (do not resurrect): **the dorsal midline
now carries THE SLAG SERRATION** — forged blade-vanes, **Hmax 0.13–0.33u** (the §4-R1
formula's exact tall-vane range — quoted the same everywhere; short vanes sit below by
design), rhythm **tall-tall-short period 3**, **occiput→hip at the fr schedule, decaying
beyond per §8's tip-floor law**, kinked and swept aft like struck slag shards (build
numbers §4-R1).
**⚠ Collision guard (audit C1): the reversal put Fornax's spine in TEMPEST's lane** — at
180px "dark hull + serrated spine + continuous pale ridge line" IS Tempest's read, and hue
alone cannot split two dark frames. The serration therefore commits three split axes in
§4-R1 (asymmetric struck-shard profile vs Tempest's symmetric tent-spike; period-3 rhythm
vs strict alternation; a BROKEN ~60%-duty rail at I1 vs Tempest's continuous
ridge-ribbon), gated by the NEW §12 Tempest tile and the §2 table's dorsal-line row.
Reconciliation with §8: one rank, one owner per region — **R1's fr schedule ends at the
HIP; §8's tip-floor decay schedule (H 0.18u→0.04u, ×0.91/vane, 17 vanes at 0.32u pitch)
owns hip→tip**, through the tail-root and out to the firebrand; height continuity is
built from the published **`serrationTopAt(z)`** contract key (§4), never from
duplicated constants. Precedence: the occipital horn pair stays the
DOMINANT of the whole dorsal line (§6 — ≥1.5× the tallest vane); "twin swept horns" now
read over serration, not over bare sky.

**Kit-coherence test (ref §9):** every landmark rhymes with the FORGE — plates are heat
shields, seams are where slag parted, the tail tip is a firebrand, horns carry temper-oxide
like worked steel. If a part could be swapped onto another dragon unnoticed, it fails.

**Distinctiveness gate (vs the shipped roster — REWRITTEN FROM THE CODE, audit B1; the
earlier table was written from build-sheet titles and misdescribed Vesper):**

| Axis | Solar | Phoenix line | Vesper (per `dragonVesper.js` / `dragons.js`) | Tempest | Azure/Ember starters | **Fornax** |
|---|---|---|---|---|---|---|
| Region | top crown | bottom train | fingered bat wing + Surge-only ion UNDERGLOW (dropped underside copy, `dragonVesper.js:458-464`) | storm-premium FX | compact combs | **body-wide interior SEAM network; the underglow MECHANISM is shared with Vesper — Fornax's claim is the amber lane + the seams, not the trick** |
| Limb plan | 6 (dragon) | 6 | wings + two TUCKED hind legs, NO forelimb builder (`dragonVesper.js:274-278`) — already a de facto wyvern silhouette | 6 | 6 | **4 by identity law, with ABDUCTED (not tucked) legs — the roster's only abducted-leg flyer** |
| Wing | vault-bays + lances | feather ranks | FIVE-finger bat fan from a carpal knuckle, dominant finger 0, propatagium, thumb claw, root gusset, cowl plates; tall arch (`archRise 0.4`) + DEEP cups (`wingCup 0.35`), `wristT 0.21` (`dragonVesper.js:358-374,413`; `dragons.js:601-603,613`) | storm membrane | feather blades | **4-digit fan on a LOW WIDE crescent: `archRise 0.12`, TAUT FLAT bays (sag ≤0.10 bay-chord vs Vesper's 0.35 cups), `wristT 0.30` — planform + bay language, not mechanism (§5)** |
| Surface | gold regalia | plumage | knapped glass | storm polish | — | **lava-lake char plates, T-junction seams** |
| Dorsal line (NEW row, audit C1 — the axis the reversal collides on) | crown ring, not a spine rank | plume train | low dorsal nubs | **serrated vane rank + CONTINUOUS charged ridge-ribbon threaded through crest tips (`crestPts`, `dragonTempest.js:282,306-320`); symmetric tent-spikes (`stormSpike`), strict tall/short alternation; built Hmax ≈0.284u** | — | **BROKEN pale rail ~60% duty at I1 (fuses continuous only under THE STOKE) — the chase split; tall-tall-short period-3 rhythm; asymmetric struck-shard vanes (apex 0.60–0.70 aft, lead slope ≥3× trail — turntable scale, §11); Hmax 0.33u** |
| Motif | ring + gem | coal arc rim/tip | starlit seam (cold) | arc crown | — | **THE STOKE — interior seam ignition, tail-ward** |
| Glow lane | violet 262° | warm triad rim/tip | ion blue 223° | storm | pale ice | **blackbody amber ~25°, interior-leak, withheld** |
| Darkness lane | — | — | COLD unlit black | — | — | **warm-keyed CHAR (cool albedo, emitted warmth)** |
| Growth verb | coronation | rebirth | knapping | — | — | **STOKING** |

**What is actually unique (audit-corrected):** the fingered fan, dominant leading digit,
dark-top/lit-belly, propatagium, thumb claw and cowl plates ALL ship today on Vesper —
"Fornax's 4-digit fan" is Vesper's wing minus one finger unless differentiated on a real
axis, and "the roster's only true wyvern" overstated (Vesper already reads as a wyvern
silhouette). So the wing differentiates on PLANFORM + BAY LANGUAGE with committed numbers
(table row above, dials in §5), and the identity leans on what IS unique: the four-limb
plan with ABDUCTED legs filling the chase-cam wedge, the char-plate T-junction surface,
THE STOKE, and the amber interior-leak lane.

**Anti-collision notes:** Phoenix owns feathers + the rebirth train — Fornax has zero
feathers and its warmth comes from BENEATH armour, not from rim/tip plumage; the Ember
starter is a warm hue on a starter budget — the gate (§12) calibrates on an Ember tile and
must place Fornax cleanly apart (interior-leak vs surface warm). Vesper owns cold unlit
black — Fornax's char is warm-KEYED and seam-veined; never grade Fornax toward blue-black.
The Surge underglow mechanism is SHARED (Vesper shipped it first); the §12 Vesper tile
must split on hue lane + planform, and never claim the mechanism as Fornax's.

## 3. THE STOKE (signature FX — the quality bar for the whole creature)

On Surge the furnace ignites **tail-ward down the seam network over ~0.8s** (per-segment
emissive ramp, CPU-driven, headless-testable). ⚠ Mechanism citation corrected by audit:
Vesper's `seamRun` is a geometry-EXTENT ladder dial (`dragons.js:617,642-663`) — how much
circuit EXISTS per form — not an ignition mechanism. The travelling ignition is the house
**casLevel cascade stagger** (`dragon.js:1959-1980`) plus the Tempest **`stormTimer`
deterministic-clock pattern** (`dragon.js:1997-2045`) for the front's timing; `seamRun`'s
role here is only the §10 extent ladder. The run terminates in the tail firebrand; the
wing membranes backlight from BENEATH; wing tops stay dark (law 5).

- **Emitter law (ref §7):** author the seam/underside emitter at **2000K `#ff8912`**, high
  intensity, and let ACES clip the core — never paint white. Peak ramps toward
  `#ffb46b` (3000K) at the throat keel only. `surgeHi` warm-amber; strict R≥G≥B.
- **Bloom (REVISED — audited against `postfx.js`):** the renderer has ONE full-screen
  threshold `UnrealBloomPass` (`postfx.js:382-384` — strength 0.32→0.24, fixed radius
  0.25, threshold 1.0): no per-object bloom, no authorable halo radius. During Surge the
  house no-cream law DROPS strength to ~0.09 and raises the threshold +0.85
  (`postfx.js:583-589`) so only the hottest cores bloom; at detail tier 2 the composer is
  OFF entirely (`postfx.js:453-457`) — **zero bloom on the weak-mobile floor.** The
  ref §7 halo:emitter ≈ 6:1 is therefore a **tier-0 studio/turntable ASPIRATION, not a
  shipped guarantee.** The GUARANTEED halo carrier is GEOMETRY: emissive seam skirts +
  a dropped underglow membrane copy (the Vesper `memGlow` pattern,
  `dragonVesper.js:458-464`) authored in the skirt hue, so the amber gradient survives
  with no bloom at all. **Tier-2 read, specced:** seam cores clip toward white through
  ACES (confirmed, `main.js:107`), the geometric skirts carry the amber, nothing spills
  past the silhouette — THE STOKE reads as hot cracks in char, not a glow; that is the
  accepted floor. Bloom B ≤ 0.5·G; any fringe B ≤ 0.15·G (ref §7) — verified per the
  §11 tolerance-and-capture-mode probe, tiers 0–1 only.
- **Seam cross-section:** core:rim:field = **1 : 0.6 : 0.03** (ref §7, ≈30:1), 90% of
  falloff inside 3 crack-widths; multiply seam emissive by **`dot(N_seam,V)^2.5`**
  (ref §7 exponent 2–3) so lips flare view-dependently for free.
- **Frame economics (ref §7):** brightest area **1–3% of the frame**; lit region 20–35%;
  saturation peaks 1–2 value steps BELOW the brightest pixel — the throat core clips, the
  seam skirts carry the colour.
- **Shimmer:** vertex-wobble on already-drawn geometry + animated emissive ONLY (ref §7 —
  grab-pass refraction disqualified on mobile). Heat-ripple = a subtle wobble on the
  membrane underside during Surge.
- **Embers (RE-BUDGETED — the mobile ceiling is GLOBAL):** the 150–300 mobile particle
  ceiling covers ALL systems at once — trails, biome FX, surge motes — not this creature.
  At Surge the frame already carries those, so Fornax gets a per-creature allotment:
  **32 cruising (ref §7 24–40) → burst 90 on ignition (the floor of ref §7's 90–140,
  deliberately) → per-creature hard cap 120.** A Surge-time worst-case-biome census
  assert (§11) proves creature + trails + biome FX + motes stays under the global
  ceiling. Sparse, chunky, warm; seeded erratic clusters, never a metronome (AAA tell #8).
- **Cruise state:** base emissive ≈ 0.04 (imperceptible), `surgeGlowMultiplier` high
  (Vesper-class ~20); the "banked-coal hint" is the seam floor at threshold, flickering
  on a seeded cluster rhythm. Fever palette fully overridden (`feverWing 0x000000` — tops
  stay silhouette; `feverEye`, `feverWash`, `surgeHi` all warm-amber). ⚠ `feverWash` is
  REQUIRED in the def, not optional: `setFeverTint` is per-dragon (`postfx.js:165-167`)
  and a def without a warm tint renders the 1-frame `surgeStart` flash in the default
  magenta — a law-4 violation. Author warm, e.g. `feverWash: [0.10, 0.05, 0.02]`
  (R≥G≥B). Eyes out of the surge arrays.

## 4. Torso — `slagAnvilTorso` (the dominant mass) — REWRITTEN after the 1.9/5 torso audit

Proportions (below) survived the audit unchanged. What failed was RELIEF, RECESS, VALUE
ASSIGNMENT and the BRIGHT TIER — all now numbered laws here and generalised in §4b.

- **Proportion — the sanctioned cheat (ref §2):** honest span:torso is 13–15:1 (a 70cm
  torso — unrideable); lock **span:torso 5.5:1** (ref §2 sanctioned band 5.0–6.5, ×~2.5
  inflation of the torso, span kept honest). Engine sanity — DEFINED (audit C6: the v0
  "≈2.3" was full span ÷ the 4.0u torso-chain, mislabelled): **span:total-body = full
  wingspan ÷ nose-to-tail length** — 8.5u ÷ ≈7.5u ≈ **1.14**, comfortably under the ≤2.5
  house cap.
- **Keel SHALLOW (revision):** flight muscle is 20–25% of body mass, not 40% (ref §2) —
  the depth reads as pectoral muscle WRAPPING the ribcage; **no protruding blade**. The
  "banked-ember keel" survives only as the throat-keel SEAM (§3), not as a fin.
- **Root masses (the #1 machine-tell killer, ref §9):** humerus root visually outmasses
  femur root at **1.4×** diameter (ref §2 directional only — "must outmass, escalating
  with size"; unsourced precision, defensible range 1.25–1.6). Both limb roots are
  lofted swells that break the OUTLINE — never melted/blobby (ref §9 tell #1),
  "impossible to pose" fails the gate.
- **Balance:** CoM **0.20 torso lengths forward of hip** (ref §2 0.17–0.26); the heavy
  tail (§8) is what earns the perched upright stance in the shop turntable.
- **Neck:** loft implies **8–9 vertebral stations** in a "slightly sinuous" shallow S
  (ref §2 — a deep 14-joint bird S is the wrongness tell).
- **Surface — lava-lake plate topology (ref §7):** few long curving seams bounding LARGE
  smooth char plates; **≥60% T-junctions, ≤15% 120° Y-junctions** (120° hexagons read as
  dead rock). **Three seam generations** at widths **6–10w / 2–3w / 1w** (ref §7);
  spacing ≈ 10× plate thickness. **Gen-3 hairlines gate on `activeDetailKey()==='ultra'`
  (`modelDetail.js`) — COMMITTED, audit B5.** Said plainly: this is a DEVICE gate, not a
  context gate — the engine has no shop-vs-gameplay build split (the same built model
  renders in both), so ultra devices see gen-3 in gameplay too and low/high devices never
  see it anywhere, shop included. Gen-3 tris are budgeted inside the ultra segment
  multiplier, on top of the §10 base targets. Overlap > weld on every plate joint
  (house §3.4).
- **THE RANK SUITE R1–R6 — relief numbers are LAW (§4b RL1–RL2).** Structure adopted from
  `dragonTempest.js#buildCumulonimbusTorso` (the bar), all ranks through ONE per-material
  accumulator (~12 draws). The audit measured rounds 1–5 at 4–7× too shallow — every number
  below is a floor, checkable on the built mesh (§11):
  - **R1 THE SLAG SERRATION** (dorsal — the §2 reversal). Replaces the 0.052u→0.02u scute
    rank. Height **H = (0.30|0.17)·fr + 0.06** with **fr decaying 0.9→0.4 occiput→HIP
    (z 0.60)** → band **0.13–0.33u** (this formula IS the relief band; every quote of the
    band elsewhere is this range). **Binding reading (v2.2): the band binds each
    station's rank-Hmax — the TALL vanes, which compute 0.18–0.33u.** The period-3 short
    vanes compute 0.128–0.213u and sit below the floor BY DESIGN; they are bound only by
    RL1's 0.02u delete line — say this so nobody "fixes" them taller. **Pitch (committed
    v2.2 — the broken rail is the load-bearing split, and a split needs a resolvable
    gap): 15–17 vanes occiput→hip, pitch 0.14–0.16u** (2.5u run / 16 intervals ≈ 0.156u;
    a 1–2-interval dark gap = 0.14–0.32u ≈ 3–7px at 21px/u). From the hip aft, §8's
    tip-floor schedule owns the rank — one owner per region, never both (audit C4). **Corrected Tempest figures (audit C1):**
    Tempest's `(0.31|0.185)·fr + 0.058` ceilings at 0.337u, but its vanes only build at
    z ≥ −0.95 where fr ≈ 0.73 → tallest BUILT vane ≈ **0.284u**
    (`dragonTempest.js:286-297`). Our 0.33u sits ABOVE Tempest's built max — **height is
    NOT the split axis**; the horns stay dominant by §6's ≥1.5× law, not by shrinking
    vanes. **THE SPLIT AXES vs Tempest's R1 (committed — gated by the §12 Tempest tile; ranked
    honestly by where they read, v2.2):**
    **(a) profile — asymmetric struck shard** — apex offset **0.60–0.70** of the fore-aft
    footprint AFT, leading-face slope **≥3×** the trailing-face slope (Tempest's
    `stormSpike` is a symmetric tent). **TURNTABLE/TIER-CARD SCALE ONLY** (v2.2 honesty
    demotion: on a 2–3px footprint the apex offset moves 0.3–0.5px at chase distance —
    listed in §11's turntable-only list; never present this as a chase axis);
    **(b) rhythm — tall-tall-short, period 3**, seeded jitter (Tempest alternates strict
    period 2) — weakly chase-real: ~6–8px double-peaks vs Tempest's 3–4px sawtooth;
    **(c) the rail is BROKEN at I1 — ⚠ CORRECTED v2.3 after the 3.6/5 gate: the DUTY CYCLE IS NOT
    VISIBLE.** Built and rendered, lit-rim vs unlit-ash leading faces are too close in rendered
    value to read as "runs of 2 with dark gaps" at any distance. The split from Tempest is REAL
    but for a different reason than this sheet claimed: Fornax reads as **discrete pale-tipped
    serration** against Tempest's **continuous ribbon**. Keep the duty cycle (it costs nothing and
    fuses at I4 as designed) but **stop billing it as the load-bearing read** — the load-bearing
    split is the per-vane pale CAP vs a connected ribbon. Original spec follows: the
    pale bone-ash tip-rail (RL5) runs in irregular lit segments of **2–4 vane intervals**
    separated by 1–2 dark (0.14–0.32u ≈ 3–7px at the committed pitch — resolvable) —
    **~60% duty, never continuous** (a continuous pale
    ridge-ribbon threaded through vane tips IS Tempest's `crestPts` read,
    `dragonTempest.js:282,306-320`); it fuses continuous only while THE STOKE runs at I4
    — withheld completeness, on-lane. Kinked + swept, short fore-aft footprint; `char`
    faces; pale leading edge (RL5); per-vane charcoal under-gap recess (RL2 — generic
    recess law, not Tempest's signature).
  - **R2 BELLY DECK** — plate lift **0.05u** (was 0.010–0.016 — sub-pixel) over a recessed
    base, with real gutter **WALLS** (recess tier, full 0→lift height) around every plate;
    plate tier assigned by **radial distance from the keel** (core/mid/edge), never by index.
  - **R3 FURNACE SOCKET** — rim ring at the surface, floor sunk **≥0.15u inboard** (Tempest
    sinks 1.5·r) so the interior falls to true shadow; lip flared outward as the lit edge;
    cowl vanes ring the mouth. Unlit at I1 (but see open call #6 — the pilot-light
    question is the owner's, not pre-decided here) — the void must be carved, never
    painted.
  - **R4 LAPPED ARMOUR** — standoff **0.055u + 0.035u cup** (was 0.014), plus **full
    perimeter recess walls** (0→standoff) so every plate throws a shadow step and visibly
    laps the next.
  - **R5 FLANK SHINGLES** — cards stand proud **0.05u** (was 0.008) with a **dark recess
    gap under every fore edge**; card size **≥0.10u** — halve round-5's count and enlarge
    the survivors (RL4: fewer, bigger, organised).
  - **R6 THROAT GORGET** — each band a raised step **≥0.04u** with a recessed dark seam aft
    — stand-off geometry, not paint.
- **Value assignment (RL3 as restated — kills the camouflage without rebuilding the
  pooling bug):** dorsal field `char` · flank `scorch` · ventral `ash` · bright ONLY on
  rims, the ridge-rail, and blade leading edges. **No cross-tier index-keyed material
  pick anywhere in the module.** Corrected census (audit): at least SIX index-keyed
  selectors ship — `i%3` scutes (`:165`), `i%2` shingles (`:250`), `i%2` gorget (`:264`),
  `byTier[i%3]` plates (`:487`), the non-modulo `i===0?ashLit:scorch` armour pick
  (`:230`), plus `slagBand`'s duty-hash (`:69-75`) — the one EXEMPT survivor (a one-step-
  darker duty break that cured deck pooling, RL3). At 0.05–0.2u element size the
  cross-tier picks ARE military camouflage. Statically asserted (§11 firewall, broadened
  to any index-referencing selector however expressed).
- **Values (RENDER space — closes the v1 ambiguity that passed five bad rounds):** 4 tiers,
  judged by §11's render gate — **median ≥28/255, p10–p90 spread ≥45/255** on a
  torso-isolated capture mask. Material hexes prove nothing (round 1–5 passed 0.133 in
  material space while rendering at median 14/255). Lit tiers go warm-GREY per RL7:
  ashLit `0x8f8a84` (was `0x94897c`), rim tier `0xbdb6ac` (was `0xc6b8a4`).
- Publishes the full attach contract + `spinePoints` + seam `motifAnchor` chain. **The
  frozen I1 attach contract is untouched by R1**: the serration rides above `keelTopAt`;
  head/tail still mount at the frozen numbers. R1 ADDS **`serrationTopAt(z)`** (crest top
  = hull top + local vane height, occiput→tail-root) as an **additive, nullable key** —
  the freeze bans MOVING published numbers, not ADDING keys. §8's tail crest seeds its
  first vane from `serrationTopAt(anchor.z)`, so "height-matched" is built FROM the
  contract, never from duplicated constants (audit C4: `buildFirebrandTail` receives only
  `anchor {y,z}` today — without this key the handoff was unbuildable as written).

> **⚠ BINDING DEFERRAL → I2 (from the 3.6/5 gate).** The mid-back **wing-mount massif** swallows
> 3–4 serration intervals and is the hero view's one remaining dead zone. It was deferred out of
> the torso round because I2 rebuilds that slab when the wing mounts to it — reshaping it twice
> is waste. **The condition, so the deferral cannot evaporate: this is an I2 ACCEPTANCE CRITERION,
> not a note.** If I2 lands and the mid-back still reads as a featureless black box interrupting
> the serration, that is an I2 GATE FAILURE, not a torso debt. Same round also owes: consolidating
> the pale flank flecks (they read as debris once the rail wires were deleted) and warming the
> bluish belly panel into the RL7 ladder.

## 4b. RICHNESS LAWS (every part — I2's wing and I3's head/tail INHERIT these; never
re-derive them per part)

Written after five torso rounds failed at 1.9/5 against the Tempest bar. The critic's
split: the gap was ~70% geometry / ~30% light — and half the light half is legally
available at I1 (RL5). Scale anchor for every number: the whole dragon spans ~180px from
the chase cam at ~8.5u full span → **~21px per world unit. Divide any relief number by 21
before believing it.**

- **RL1 — RELIEF FLOOR.** Relief is bought in world units and judged in pixels. Floors:
  silhouette-breaking ranks **0.13–0.33u** (≈3–7px; the §4-R1 formula is the law — this
  band is its exact range, stated identically in §2/§4/here, audit C3). **Binding
  reading (v2.2, so the floor is checkable): the band binds each station's RANK-Hmax —
  the tall vanes, 0.18–0.33u — not every element.** Period-3 short vanes (0.128–0.213u
  at apex) sit below it by design and are bound only by the 0.02u delete line; ladder
  rungs scale the Hmax envelope (f0 Hmax 0.14u clears the floor; its short vanes ~0.05u
  are LEGAL under this reading — under an every-vane reading they would not be, which is
  why the reading is stated). Any plate standoff / deck lift / card
  stand-proud **≥0.05u** (~1px shadow step); absolute floor **0.03u** for any raised
  element. Anything under **0.02u is sub-pixel at range — delete or merge it, never tune
  it.** A rank that breaks no silhouette and casts no visible shadow does not exist.
- **RL2 — RECESS PAIRING.** Every raised form owes its own shadow-casting dark recess, in
  a tier darker than the darkest field plate: perimeter recess **walls** (full 0→standoff
  height) around every armour plate, a **dark gap under every scale-row fore edge**, a
  **charcoal under-gap beneath every dorsal vane**, real gutter **walls** on deck plates
  (the Tempest pattern, verbatim). A card floating on a lift with no walls reads as a
  decal/camo patch — exactly rounds 1–5.
- **RL3 — ROLE DETERMINES THE TIER; INDEX MAY ONLY PERTURB WITHIN IT (restated, audit
  C2 — the absolutist v2 wording banned the shipped fix for a failure it exists to
  prevent).** Role map: dorsal field = `char`, flank = `scorch`, ventral = `ash`; bright
  ONLY on rims, crest rails, blade leading edges; belly tiers by radial distance from the
  keel. The two regimes are SCALE-SEPARATED — that is what dissolves the v2.1
  self-contradiction (a sanctioned darker-break on a 0.1u element was simultaneously
  condemned as camouflage two sentences earlier): **elements IN the 0.05–0.2u camo band
  admit NO index picks in ANY direction** — index value at that scale is mid-frequency
  noise, i.e. camouflage (the five-round failure). ABOVE that band, PURE role banding
  rebuilds the opposite bug — it pooled all brightness into one continuous deck stripe
  (the recorded round-2 "sheet-metal" band), and `slagBand`'s duty-hash
  (`dragonFornax.js:69-75`) is the shipped cure — **explicitly EXEMPT as a mechanism**.
  Sanctioned index use: value jitter WITHIN a tier, or a duty break dropping an element
  exactly ONE step DARKER toward the field — never brighter, never ≥2 tiers — under
  three bounds (v2.2): **(i)** duty breaks apply ONLY to elements above the 0.05–0.2u
  camo band (station-scale facets — field-ward breaks read as shadow/wear; camo-scale
  breaks read as mottle); **(ii)** IRREGULAR duty — never strict alternation or any even
  on/off metronome (the picket-fence tell `slagBand`'s own comment warns against);
  **(iii)** minimum lit run ≥2 stations. ⚠ COMPUTED (v2.2): the shipped hash
  `((i*7+3)%5)<3` yields the period-5 pattern F,T,T,F,T — it satisfies (i) and (ii) but
  has SINGLETON lit runs, violating (iii); the exemption covers the mechanism, and the
  rebuild owes the one-line retune (e.g. `((i*2+1)%7)<4`: period-7, duty 4/7, lit runs
  of 2, gaps 1–2 — computed to satisfy all three). (Tempest itself perturbs on index
  atop a role base: `u%2` `:373`, `+(i%2)·0.7` `:229`, `u%3` `:300` — the evidence never
  supported an absolute ban.) Bounded by the §11 anti-pooling assert.
- **RL4 — THE BRIGHT TIER IS STROKES, NOT CONFETTI (bounded both ways).** The brightest
  values are LINES — rails through vane tips, deck-edge rails, blade leading edges.
  Lines read as anatomy; scattered 0.022u rim slivers read as white specks. Any bright
  element shorter than ~0.3u that is not part of a rail: merge or delete; when in doubt,
  halve the count and enlarge the survivors. But a stroke is a RUN, not an infinity —
  unbounded continuity is the opposite failure twice over (the round-2 pooled deck
  stripe, and the Tempest crest-ribbon collision, audit C1/C2): the §11 anti-pooling
  assert caps every run, and the dorsal tip-rail specifically is BROKEN at ~60% duty
  until THE STOKE fuses it (§4-R1c).
- **RL5 — PALE ALBEDO IS LEGAL LIGHT.** The withheld-light law bans EMISSION before I4,
  not VALUE. Bright pale albedo at low roughness catching the key is diffuse, not glow —
  Tempest's `silverRim` (`0x9fb0c8`, rough 0.5, metal 0.06, emissive ≈0) is the proof.
  Sanctioned Fornax analog: bone-ash **`0xbdb6ac`, rough 0.44–0.5, metal 0.06, emissive
  `0x000000`** — on rails, crest lines, and blade leading edges only. This is the
  sanctioned way to reach value extremes before I4; use it instead of waiting for embers.
- **RL6 — VALUE TARGETS LIVE IN RENDER SPACE.** All value/ladder targets are RENDER-space
  percentiles measured on a part-isolated mask of an actual capture (§11 gate: median
  ≥28/255, p10–p90 ≥45/255). A material-space (albedo-hex) spread is inadmissible as
  evidence — it is the exact ambiguity that let five failed rounds "pass".
- **RL7 — HUE UNDER THE RIG (numeric band committed, audit C5).** The studio rig is blue
  (hemisphere `0xbfdcff`, rim `0x7fb8ff`); warm-TAN albedo renders khaki and reads
  military. Lit tiers are warm-GREY, band: **8 ≤ R−B ≤ 20, saturation ≤ 0.10 in HSV,
  computed as (max−min)/max** — the formula is named because HSV and HSL disagree (HSL
  gives 0.114 for the rim hex). Both sanctioned hexes COMPUTED, not asserted (v2.2 — the
  first commit said ≤0.07 and failed both hexes it certified): `0x8f8a84` → R−B 11,
  sat 11/143 = **0.077**; `0xbdb6ac` → R−B 17, sat 17/189 = **0.090**. The loose v2
  "a couple of steps" wording is superseded by this band. The `char` field stays cool-neutral
  (identity law 7) — RL7 binds the LIT tiers only. Probed in §11's lit-tier hue probe
  (the fire-region channel-order probe never sees these pixels — a law without a probe is
  how the steel-blue round shipped).

## 5. Wings — the HERO: THE UNDERLIT CRESCENT (**pterosaur spar**, wing-as-arm)

> **⚠ v2.4 REWRITE.** The wing shipped at I2 was rejected on sight by the owner. The root
> cause was **a gap in THIS SHEET, not a build error** — the section below used to specify
> only how Fornax *differs from Vesper* (`archRise`, `wristT`, bay sag) and mechanisms
> (notch floor, propatagium %, the DoubleSide trap), and **never once said what a wing
> IS**: no arm chain, no body attachment line, no chord distribution, no leading-edge
> sweep. A builder could follow every number here perfectly and still produce a membrane
> fanning from one hub — which is exactly what happened. `DRAGON-ANATOMY-REFERENCE.md`
> had the identical hole and now carries **§4.9 PLANFORM**; this section is Fornax's
> instantiation of it. **Where the two disagree, ref §4.9 wins.**

**TOPOLOGY: PTEROSAUR SPAR — ⚠ this OVERTURNS the former SETTLED entry "Bat fan, 4
digits, dominant D1."** Two independent Fable passes (art director + a clean-room
adjudicator, both 5/5) overturned it on the same grounds: the lock's stated premise —
*"a single spar degenerates to the paper-dart read"* — is **a misdiagnosis**. The paper
dart comes from a straight trailing edge, a planar zero-camber membrane, and no joint
break in the leading edge. **It does not come from spar count**, and a fan carrying those
three defects is a dart with extra spokes. The failure that actually produced our dart
was **the missing arm**. Reversal recorded in SETTLED and the CHANGELOG; ref §4.1's
verdict is superseded in the same pass.

Why the spar for *this* creature: Fornax is **mass, not dexterity**. A five-bone bending
hand is Vesper's word; one enormous wing-finger off an armoured wrist is a crane boom —
correct for slag. And at the measured ~180 px chase span the thing the old sheet was
protecting (3 scallop cusps vs 1 long concave edge) is **sub-2 px and does not read**, so
it could never have carried the roster split anyway.

### 5.1 THE SKELETON (build this FIRST — the membrane is an output, never an input)

`L` = shoulder joint → wingtip = **`wingSpan` 4.26 u**. Sweep Λ is measured **aft of the
lateral axis**; negative rakes forward. Fractions are of L.

| Segment | length | Λ | cumulative station |
|---|---|---|---|
| humerus | **0.095** | **−6°** | 0.083 |
| forearm | **0.144** | **+6°** | 0.223 |
| carpus | **0.019** | **+6°** | **0.242 ⟵ THE WRIST** |
| metacarpal IV | **0.129** | **+31°** | 0.375 |
| wing phalanx 1 | **0.227** | **+31°** | 0.611 |
| wing phalanx 2 | **0.178** | **+33°** | 0.795 |
| wing phalanx 3 | **0.125** | **+39°** | 0.921 |
| wing phalanx 4 | **0.083** | **+51°** | 1.000 (tip hook) |

Solved leading-edge vertices, **in units, wing-local (origin = shoulder, +x outboard, +z aft)**.
⚠ `L` is the **straight-line** shoulder→tip (4.26); the tip's **lateral reach is x = 3.810**, and
the two are not interchangeable — conflating them puts chord stations past the wingtip.

| | shoulder | elbow | forearm | **wrist** | mcIV | wp1 | wp2 | wp3 | **tip** |
|---|---|---|---|---|---|---|---|---|---|
| **x** | 0.000 | 0.414 | 1.041 | **1.124** | 1.636 | 2.537 | 3.232 | 3.691 | **3.948** |
| **z** | 0.000 | −0.043 | 0.022 | **0.031** | 0.270 | 0.690 | 1.044 | 1.342 | **1.599** |
| **y** | 0.000 | 0.149 | 0.340 | **0.362** | 0.347 | 0.320 | 0.298 | 0.285 | **0.277** |

⚠ **The `y` row is the GULL CURVE and it is NOT optional (ref §4.9.4b).** Built without it — as
this sheet's first draft was, an x/z table only — the wing rendered from the rear as a **razor
line, 31% wide and 9% tall**, because a flat horizontal membrane is edge-on to the shipped camera.
Rise is +0.035 L at the elbow, **+0.085 L at the wrist (apex)**, +0.065 L at the tip: a shallow M,
never a straight V. Inboard dihedral works out at **17.9°** (sourced cap 20°), outboard **−1.7°**
(band 0 to −5°). **Camber rides on top of this; it does not replace it** — camber is a chordwise
bulge, the gull is a spanwise rise, and a build needs both.

⚠ **Sweep is 25° outboard, not the 31° first solved.** The forward-offset band is stated for the
VISIBLE leading edge, but a bone chain is authored as a CENTRELINE — the spar's forward face plus
the propatagium bulge together sit ~0.026 L ahead of it. Solving the centreline to the top of the
band measured 0.125 against a 0.125 ceiling: a coincidence, not a pass. **Author the centreline
well inside the band you intend to measure.**

- **THE KEY NUMBER — max forward deviation of the leading edge from the shoulder→tip
  chord = 0.113 L (0.48 u), peaking AT THE WRIST (station 0.242).** Ref §4.9 band is
  **0.085–0.125**. The rejected wing had **0.035** — under half the threshold at which the
  eye stops reading "straight". *This one assertion would have caught the failure on turn one.*
- **Included angle at the wrist = 155°** (ref band 155–168°, reject >170°). The **whole
  break sits at ONE vertex** — the carpus deliberately follows the forearm heading (+6°)
  rather than splitting the break into two half-steps. **Chevron, not arc:** an arc reads
  *feather*, an angle reads *structure under load*. This is why `archRise`/`leadY` — the
  old single sine bow — is **deleted**, not retuned.
- **Elbow break is real but modest** (−6° → +6° = a 12° kink at station 0.083), consistent
  with the sourced near-rigid pterosaur arm (shoulder 5°, wrist 5°, elbow 10° of flexion).
  It is **hidden under the propatagium** (§5.3) exactly as in life.
- **Leading-edge radius TAPERS** `1.00 / 0.62 / 0.38 / 0.22 / 0.10` at
  shoulder/elbow/wrist/mid-hand/tip. A constant-radius spar **reads as a bar however
  curved** — this is the failure most likely to survive a correct planform.
- **Thickness ladder** humerus 1.00 → forearm 0.80 → mcIV 0.50 → wp1 0.40 → wp2+ 0.28,
  tapering to a point, thicker at each element's proximal end.

### 5.2 THE PLANFORM (chord + trailing edge)

**Author the trailing edge as a concave curve; let chord fall out.** Ref §4.9.5 chords are
streamwise and calibrated for a lightly swept leading edge — applied naively to our
+51° tip hook they push the trailing edge **convex** near the tip, which is a bird
signature and banned. The outer two stations below are therefore **retapered** from the
raw pterosaur table (0.203 → 0.180, 0.102 → 0.055) to hold concavity through the hook;
that also gives the tapering, posteriorly-hooked tip (Itip < 1) that reads *fast predator*.

Stations are **lateral x** (η is a fraction of semi-span, so it maps to x, never to along-chord L).

| Station | x (u) | chord (u) | TE z (u) | fwd bow vs root-TE→tip line | % of local chord |
|---|---|---|---|---|---|
| **root / flank** | 0.000 | **2.164** | 2.164 | 0 | — |
| **elbow** | 0.343 | **1.947** | 1.911 | 0.230 u | 12% |
| **wrist** | 0.907 | **1.678** | 1.686 | 0.416 u | 25% |
| **knuckle** | 1.592 | **1.299** | 1.605 | **0.450 u ⟵ deepest** | 35% |
| wp1 end | 2.438 | **0.767** | 1.581 | 0.418 u | 54% |
| near tip | 3.204 | **0.234** | 1.552 | 0.395 u | — |
| tip | 3.810 | **0.000** | 1.906 | 0 | — |

- **Trailing edge is CONCAVE at every interior station** (min 12% of local chord) — one
  long cupped sweep from the body to the tip, bowing **inward toward the bones**.
  **ZERO interior bays** — a single spar has none, and scallops on one mean we have drawn
  a bat. This **kills the old "TAUT FLAT bays ≤0.10 sag" identity and the NOTCH FLOOR
  that propped it up**: tensioned skin physically cannot be straight between anchors, and
  a straight trailing edge is not an identity, it is a cheap tell.
- **Chord falls monotonically**; **max chord is at the root/elbow, never a pinch at the
  root** (that pinch is the spoon-wing / armpit-hole failure).
- **Aspect ratio 7.14** with the body panel counted (sheet target 7.5, ref band 7–9).
  **Full span 8.11 u** — consistent with the house ~8.5 u / ~180 px scale anchor.
- **Camber unchanged and still required:** 0.14 chord slow ↔ 0.06–0.10 fast, deepest at
  40% chord, ≥4 segments per arc. **A top-viewed flat plane shades uniformly and dies** —
  from our camera, curvature *is* the value gradient.

### 5.3 ATTACHMENT — a LINE, not a point

- **Bonded seam runs shoulder `z −0.95` → hip `z +0.60` = 1.55 u**, i.e. the full trunk.
  Ref §4.9.7: *if your root seam is shorter than the torso, it is wrong.* Hip (not ankle)
  is the sanctioned choice here because **abducted legs are SETTLED** and must stay free.
- The **root chord is 2.16 u — longer than the seam.** The trailing edge continues **aft**
  of the hip as a **free corner at z ≈ +1.21**, which is how the chord exceeds the seam
  without pinning membrane to a moving leg. This is the fix for the armpit hole.
- **Fairing:** the torso's seam/plate grammar carries across the join and fades out over
  the shoulder — no hard silhouette seam. **If the wing can be deleted and leave a clean
  torso, it is a sticker** — and from behind-and-above the player looks *straight down into
  that junction*, so it is more exposed here than in profile. The W5 scapular saddle lames
  already carry this and stay static in the body frame.
- **PROPATAGIUM — the cheapest single fix, and non-negotiable.** A free membrane sheet
  fills the shoulder–elbow–wrist triangle and bows **forward of the bones**, ~9% of wing
  area, forward bulge **8–10.5% of hand-wing chord** (a subtle skin scallop, **not a big
  triangular sail**). **The arm must sit INSIDE a membrane curve, not BE the edge** — an
  arm that *is* the leading edge reads as scaffolding. It also hides the elbow kink, as in
  life. Omitting it is cited as the single most common dragon-wing mistake.
- **Wrist mass (the Smaug move):** 2–3 short free clawed fingers clustered at the wrist as
  an **armoured knuckle boss**, carrying **no membrane**. This is decoration on the spar,
  not a topology compromise — membrane-bearing half-fingers with mini-bays would
  reintroduce the fan's rig cost for detail below the pixel floor. It puts readable mass
  on the chevron apex, which is what makes a forward wrist read **heavy** rather than
  graceful, and it lands exactly where the behind-above camera looks.

### 5.4 What replaces the deleted Vesper differentiators

`archRise 0.12`, `wristT 0.30`-as-a-fan-hub, taut bays and the notch floor are **gone**.
Fornax now splits from Vesper on axes that survive gameplay distance:

1. **Wrist station 0.24 vs Vesper's ~0.47** — a large, readable shift in *where the leading
   edge breaks*, visible in the planform the chase cam actually sees.
2. **Fold grammar** — ONE dramatic hinge at the mcIV knuckle vs Vesper's soft multi-joint
   curl. Completely different animation even foreshortened. (§9 / `FLAP-DESIGN.md`.)
3. **Leading-edge structural mass** — a thick armoured tapering spar, read on the wing
   TOP, which is the surface this camera is pointed at.
4. **Edge character** — the trailing hem is **cracked, notched, battle-torn slag** with
   ember bleed through the tears. *Damage as identity*, against Vesper's clean cupped
   scallops.
- **Retained non-negotiables:** house `wingParts` pivot→mid→tip cascade, **−anchor** wrist
  compensation, **OUTER `lmirror` wrapper** (never `pivot.scale.x = -1`). Leading edge is
  RIGID; **only the trailing edge flutters** (a rippling leading edge is a fabrication tell).
  **Span ratio 0.70** mid-upstroke ÷ mid-downstroke — constant span reads as a rigid airframe.
- **THE STOKE surface (REVISED — audit B3, the DoubleSide trap):** three.js emissive is
  NOT per-face-side — a DoubleSide emissive membrane lights BOTH faces and breaks law 5.
  So, explicitly: **the underside glow is a SEPARATE dropped sub-mesh** (the bay copied
  ~0.05 below the membrane — the Vesper `memGlow` pattern, `dragonVesper.js:458-464`) in
  a **bespoke material OUTSIDE the shared `wingMat`**, dark in cruise, driven only by
  THE STOKE. **The top membrane registers `wingMembraneEmissive: 0x000000`** (alongside
  `feverWing 0x000000`): the shared rig drives `wingMat` UNCONDITIONALLY
  (`dragon.js:1970-1990` — +0.7 emissiveIntensity while boosting, plus backlit and
  casLevel surge terms), so the boost-glow term is neutralized by making the emissive
  COLOUR black — intensity then multiplies black and the tops stay dark on every boost,
  not just during Surge. Tops stay in the char value ladder with bay-depth value banding
  (AAA tell #12 — a turntable-scale detail, marked in §11). Bone digits read as recessed
  tapered filaments in channels with dim skirts (AAA tell #1), never flat bright tape.
- **Pose-gating honesty (audit — stated plainly; the sheet's biggest honesty gap):** from
  the shipped behind-and-above chase cam the camera sees wing TOPS, which are dark by
  law 5. The hero underlight shows at BANK, at flap transitions, and partly inside the
  held high-V; during the 3.0–4.5s level glide hold it is largely OCCLUDED — and Surge
  bloom is suppressed by the no-cream law (§3), so no bloom spill rescues it past the
  silhouette. What carries the frame through the hold: THE SLAG SERRATION
  breaking the spine with its pale ridge-rail (§4-R1 — the audit's #1 fix, and the hold's
  main carrier), the dorsal char value ladder + struck facets, the horn rank dominant
  above the serration, the tail crest rolling end-on, the banked-coal seam flicker, and
  the drifting embers. The hero is a bank/transition
  payoff, not a constant — the §12 gate judges it in those poses, not in the hold.

## 6. Head + horns — `brandSkull`

- **Skull:** **0.13 of total length** (ref §6 0.12–0.15); width:height **1.1** (ref §6
  recommended 1.0–1.2 — taller than any croc, so it never reads crocodilian-flat).
- **Dorsal profile is the read** (ref §6 — rear-chase foreshortening keeps only the dorsal
  line): convex nasal keel → brow dip → **rising occiput** folded into an S. Judge the
  head on this line in flapstrip, not on the lateral profile.
- **Eyes:** orbit **0.20 × skull length** (ref §6 — and NOT larger; negative allometry
  means a big skull earns a relatively smaller eye). Centre at **x 0.67, y 0.78** of
  skull (ref §6 x 0.62–0.72, y 0.70–0.85), converging **3 head-lengths ahead** (ref §6
  2–4) in the **50° binocular band** (ref §6 45–60°). **The glare is the BONE** (ref §6):
  brow-prong wedges over the orbit carry the menace; the emissive eye itself stays small.
  Ember-amber eyes — the always-on accent. ⚠ House habit is giant Vesper eyes; this
  creature's read is armoured, not cute — the brow does the work. Eye placement detail is
  turntable/tier-card; from the chase cam only the brow-prong silhouette reads — marked.
- **Horn rank (dominant + decay, ref §6):** ONE dominant backswept occipital blade PAIR at
  **135° sweep** (ref §6 120–150°) — the "twin swept horns" of the sentence, a bilateral
  pair, not an equal rank — followed by **2–3 midline followers at ×0.66 decay**
  (ref §6 0.62–0.70) with contracting spacing down the nape. Followers sit on the
  centerline (no mirror-asymmetry hazard). This rank IS the head's play-distance read —
  and since the §2 reversal it no longer stands over bare sky: **the dominant horn pair
  must top the whole dorsal line at ≥1.5× the tallest §4-R1 vane (≥0.50u)** so the
  head stays the dominant cut and the serration reads as its decay, one rank
  head→spine→tail.
- **Named asymmetry — THE CHIPPED BROW:** the starboard dominant horn tip is struck short
  (~0.85× port) with a bright char-fresh facet — the ±1 deliberate asymmetry every sourced
  display structure shows (ref §6, Styracosaurus), done as a named marking (the house's
  only sanctioned asymmetry, §5.5). Zero-tri identity, echoes Vesper's port-fin mark.
  **Scale honesty (audit B4): a 0.85× tip on one horn is ~2–3px at gameplay scale —
  INVISIBLE from the chase cam.** Turntable/tier-card-only, marked in §11; removed from
  the §1 rear-chase sentence; judged in the shop turntable, never on the PR preview
  (residual 5 updated to match).
- **Temper-oxide band (law 8):** straw→purple→blue gradient (ref §7 230–297°C oxide
  sequence) painted diffuse on the dominant horn pair's outer third. The ONE blue.
  Close-range only — marked turntable.
- **Gape rig:** jaw joint opens to **100°** (ref §6 sabre-tooth band 90–110°; crocs max
  32° — a croc gape reads weak) for the Surge breath moment. **Turntable + Surge camera
  only — the chase cam never sees the mouth; marked.** Throat pouch distends by the
  mandibular rami bowing OUTWARD (ref §6 — not skin alone), skin thin + translucent =
  the anatomically-correct home of the withheld charge glow. Mostly rear-chase-blind;
  it peeks in banks and the Surge pitch-up — marked as a bonus read, not a load-bearing one.

## 7. Hind legs — `emberHaunch` (REVISED: abducted, not tucked)

- **Pose decision (ref §3):** raptors do NOT tuck — and a tucked leg is invisible from
  behind-and-above anyway. Lock **bat-style ABDUCTED**: the only pose that puts leg
  geometry in the wedge between wing and tail where the chase cam actually looks.
  Dials: **hip abduct 45° (ref §3 35–55°) · knee 82° (ref §3 70–95°) · ankle 115°
  (ref §3 100–130°)**, with **±7° oscillation phase-lagged 105° behind the wingbeat**
  (ref §3 ±5–10°, lag 90–120°) — secondary motion through the glide hold (§9).
- **Form:** plated reptilian, three-toed, char-plate greaves in the torso seam language —
  NEVER bird-scaled (law 3, the cockatrice misread is the easiest accident, ref §1).
  Period bird-leg canon (ref §1) is deliberately overruled by the misread risk + the
  camera; record it, don't re-litigate.
- **Mass:** femur root < humerus root (§4, ref §2); haunch is a lofted swell breaking the
  outline (house §3.1), knee raised + inboard so the fold reads folded, not landing-gear
  (house §2.7).
- Ember-leak: ONE short gen-2 seam per haunch plate overlap — inside the 10% accent
  budget's throat-keel contiguity? No — legs stay DARK (accent lives in only two places,
  §2); haunch seams are carved shadow grooves, unlit until Surge.
- **Gusset clearance (audit):** the house root gusset sweeps aft to the hip — the same
  wedge the abducted thighs now occupy. Fornax's gusset aft hem terminates at **0.65 of
  the shoulder→hip run** (never reaching the thigh), and `flapstrip` gains an
  interpenetration check at max abduction + full downstroke + full wing fold.

## 8. Tail — `firebrandTail` (REVISED: no spade)

- **Terminus decision (ref §1):** the spade is out — not period (Fox-Davies: Tudor tails
  end in a smooth blunt point; the barb is a recent addition) and the #1 de-kitsch target.
  The de-kitsch survey's move is RE-MOTIVATION: Fornax's terminus is **THE FIREBRAND** —
  a blunt char-capped coal tip, the anatomical end of the seam network, where THE STOKE
  terminates and vents (~the last 0.9× of the tip carries the gen-1 seam, house §2.6
  seating law). Silhouette duty is shared with the **dorsal ridge** (the Drogon/Skyrim
  idiom, ref §1) — and since the §2 reversal the crest is **the CONTINUATION of §4-R1,
  not a second rank**. Ownership is exclusive (audit C4 — the v2 draft gave R1's fr
  schedule and this law dual authority over z 0.60→1.70, which is unbuildable): **R1's
  fr schedule ends at the HIP (z 0.60); ONE schedule owns hip→tip** (house §3.6 — rows
  run to their anatomical end). That schedule, re-committed v2.2 after BOTH v2.1 numbers
  failed arithmetic:
  **Height — decay to a TIP FLOOR: H 0.18u at the hip → 0.04u at the tip, ×0.91 per
  vane** (the ratio is DERIVED, not free: (0.04/0.18)^(1/16) ≈ 0.91). The v2.1 "×0.66
  per vane" was ref §6.3's per-element law for 2–3-element follower ranks; over 11+
  vanes it computes to 0.18·0.66⁴ ≈ **0.034u at the tail root** — a dead sub-2px crest
  that deleted §1's "rolling ridge crest" claim in arithmetic while asserting it in
  prose.
  **Pitch — near-constant 0.32u: 17 vanes / 16 intervals over the 5.13u hip→tip run**
  (1.10u torso aft-body + 4.03u tail module; 16 × 0.32 = 5.12u ✓; every broken-rail
  dark gap ≥0.32u ≈ 7px — resolvable). The v2.1 "0.24u ×0.94" series converges to
  0.24/0.06 = **4.00u as n→∞** and spans only ≈2.0u at its own 11–12 vanes — it died
  halfway down the tail in the same sentence that ran it to the firebrand.
  **The TORSO module builds the aft-body vanes** (hip→tail-root, z 0.60–1.70, ~3–4
  vanes — stated explicitly, audit: implied before, owned by nobody). The tail module
  CONTINUES the schedule, seeding from the attach contract's **`serrationTopAt(anchor.z)`**
  (§4, additive key) — "height-matched" is a contract read, never a duplicated constant
  (`buildFirebrandTail` receives only `anchor {y,z}` today; the key is the missing
  channel). Under the corrected schedule `serrationTopAt(z=1.70)` returns hull-top +
  **≈0.13u** (0.18·0.91^3.4 — ~3px, a LIVE crest at the handoff; under v2.1's numbers it
  returned +0.034u, and "height-matched" was satisfied trivially by a dead crest). Same blade language (asymmetric struck shards, period-3 rhythm), same
  under-gap recess per vane (RL2), same pale leading edge (RL5), same broken-rail duty
  (§4-R1c). If the tail crest and the torso serration ever read as two systems at the
  handoff, the tail conforms to §4-R1, not vice versa.
- **Mass (ref §2):** tail length is a free variable (no consistent natural relationship —
  say so; locked at **2.6× TORSO LENGTH** for frame composition, a choice not a fact —
  torso = 1.55u, so **4.03u absolute**). **⚠ LATENT UNIT BUG (audit C6):** the shipped
  stub builds `(tailLength ?? 1) * 2.6` in ABSOLUTE units (`dragonFornax.js:819`) =
  2.6u = only **1.68×** the torso. The sheet's dial is in torso multiples; I3 must
  rebase the code (or ship `tailLength: 1.55`) — the number does not silently become
  1.68×. The **fattest segments sit just aft of the hip** (ref §2), tapering ×3 (§1 axes).
  Radius FLOOR raised for the judged projection (AAA tell #11 — rear-chase foreshortens;
  world-space girth ≠ silhouette girth).
- **Rig:** house 4-joint `isBone` chain, bespoke dials — vertical undulation up-biased
  (the axis the chase cam reads end-on), rudder trimmed for compounding locals
  (house §5.1). The rolling ridge crest catching light IS the end-on read.
- **Structural third leg (ref §1):** in the shop turntable and perch idle the tail props
  the body — the period wyvern tripod, and what the heavy tail (§4 CoM) earns.
  Turntable-only behaviour; marked.

## 9. Motion signature — THE HEAVY BELLOWS

Motion is identity (house §2.13); no dial block copied from any shipped dragon.

- **Cadence (ref §5):** **2–4 beat bursts, then a 3.0–4.5s glide hold** (hard floor 1.5s,
  ceiling 6s), seeded jitter **±25%**, bursts loaded onto launch/climb/turn. Real
  flap-gliders hold 5.9–10.5s (ref §5) — the game floor compresses it ×~0.6 for read.
  Maps natively onto the house `glidePow` poser: high `glidePow` (apex ~2.2 family),
  bespoke values authored per FLAP-DESIGN, never byte-copied.
- **Stroke:** deep + slow — bat amplitude band 90–150° (ref §5); Fornax sits at the heavy
  end (wing loading upper-mid of the 30–80 N/m² band, ref §4): fewer, heavier beats,
  "commands the air."
- **Stillness kills the read, not the absence of a beat (ref §5):** secondary motion runs
  THROUGH every hold — trailing-edge flutter (trailing only, §5), camber breathing with
  airspeed, leg oscillation at 105° lag (§7), tail undulation, 32 drifting embers, the
  banked-coal seam flicker. The hold is alive, never frozen.
- **Wrist fold + apex sweep:** per FLAP-DESIGN (the depth-projection trap) — verify the
  fold in geometry numbers, not critic pixels.
- **Erratic, never metronome** (AAA tell #8): flap-burst clusters and coal-flicker share
  the seeded-cluster rhythm module; photosensitivity caps live in the module.

## 10. The STOKING ladder (4 forms — each rung feeds the furnace)

Form names: **f0 Cold Coal · f1 Kindled · f2 Stoked · f3 Fornax, the Banked Furnace.**
Every rung a CRUISE-visible earn (house §7); apex built first, ladder by subtraction.

| dial | f0 Cold Coal | f1 Kindled | f2 Stoked | f3 Fornax |
|---|---|---|---|---|
| read | ash-grey coal-whelp, 2 stub digits | first true fan + first seam | the hunter: 4 digits, ridge crest, abducted legs | the finished furnace: full network + firebrand |
| wing digits (D1 dominant) | 2 | 3 | 4 | 4 + propatagium sheet |
| seam generations | 0 (grooves only) | 1 | 2 | 3 (gen-3 ultra-device-gated, §4) |
| occipital rank | dominant pair only | +1 follower | +2 | +3 followers + chipped-brow + oxide band |
| R1 serration Hmax (§4-R1) | 0.14u | 0.20u | 0.26u | 0.33u |
| tail | blunt nub | ridge begins | full ridge rank | ridge + FIREBRAND tip |
| STOKE run | eye flare only | to mid-spine | full spine, 0.8s | full circuit + wing underside + firebrand vent |
| embers (cruise/burst) | 0/0 | 12/40 | 24/70 | 32/90 (per-creature cap 120 — global-ceiling re-budget, §3) |
| span:torso | 4.6 | 5.0 | 5.3 | 5.5 |
| glide hold | 1.5s, frantic | 2.2s | 3.0s | 3.0–4.5s heavy bellows |
| tri target | ~1.7k | ~2.6k | ~3.7k | ~4.8k |

Asserts: tris ↑ · digits 2<3<4 · seam gens 0<1<2<3 · followers 0<1<2<3 · embers ↑ ·
span:torso ↑ · glide hold ↑ · serration Hmax ↑ (and ≥0.14u even at f0 — the whelp is
never bare-spined) · no inverted light signal (whelp never out-glows apex).

⚠ **The `seam gens 0<1<2<3` assert must build at ULTRA detail** (audit round 2). Gen-3 is
gated on `activeDetailKey()==='ultra'` (§5/B5), so on low/high the f3 form builds only 2
generations and a naive ladder assert fails on exactly the devices most players use. Pin
the assert's build to ultra, or assert AUTHORED gens rather than built ones — but say which
in the test, because a silently-detail-dependent assert is a flaky test, not a law.

## 11. Tests spec + feasibility audit

**House harness (all standard gates apply):** tricount <6000/form monotonic · blueprint ·
smoke · `wingsymprobe` Δ0.000 · `seamprobe` (cruise dark / surge amber through real surge
math) · `flapstrip` + named-pivot amplitude table · `tiershots` · `gameshots`/`surgeshot` ·
a `fornax` block in `tests/starters.mjs`.

**Bespoke asserts:**
- **⚠ PLANFORM GATE P1–P10 (v2.4 — blocks every wing sign-off).** Tool:
  **`tools/planformprobe.mjs`**, measuring the BUILT leading- and trailing-edge polylines
  in wing-local space, never the dials. Mirrors ref §4.9.12, with the pterosaur bands:

  | # | Assertion | Fornax pass band |
  |---|---|---|
  | P1 | wrist station along L | **0.22–0.28** (built: 0.242) |
  | P2 | **max forward LE deviation from the shoulder→tip chord ÷ L** | **0.085–0.125** (built: 0.113) |
  | P3 | spanwise station of that maximum | within **±0.06 of the wrist** |
  | P4 | included angle at the wrist, in plan | **155–168°** (built: 155°) |
  | P5 | TE deviation from the root-TE→tip line, every interior station | **forward everywhere**, ≥12% of local chord |
  | P6 | chord distribution | **monotonically decreasing** |
  | P7 | max chord station; root ≥ 0.9 × elbow chord | at/just inboard of the elbow |
  | P8 | aspect ratio `b²/S`, body panel counted | **7–9** (built: 7.14) |
  | P9 | root seam length ÷ trunk length | **≥ 1.0** (built: 1.55/1.55 = 1.0) |
  | P10 | arm segments before the first membrane vertex; inboard LE bows forward | **≥2 groups, ≥2% of L** |
  | P11 | rear-view vertical extent ÷ L (the gull) | **≥0.06** |

  **P2 is the highest-value assertion in the harness — it alone would have caught the
  rejected wing on turn one** (it measured 0.035 against a 0.085 floor). ⚠ P3's band is
  **topology-dependent**: the bow peaks at the *wrist*, so a bat build (k≈0.49) peaks near
  mid-span and a spar build (k≈0.24) peaks at a quarter. A band calibrated for one is
  wrong for the other — the probe reads the wrist station and derives P3 from it.
- **⚠ RENDER-SPACE VALUE GATE (torso audit — blocks every torso/part sign-off).** Tool:
  **`tools/valuegate.mjs`** (build it with the torso rebuild; the gate does not exist
  until the tool does). It captures the studio frame, isolates the part by a
  `userData.fornaxPart` id-mask render, and asserts on the masked pixels of the ACTUAL
  capture: **median ≥28/255** and **p10–p90 spread ≥45/255**, judged on the brightest
  biome sky. Material-space (albedo-hex) spreads are INADMISSIBLE as evidence — the five
  failed rounds passed 0.133 in material space while rendering at median 14/255 (RL6).
- **⚠ SPREAD-AS-STRUCTURE WARNING (why five probe-passing rounds still failed the owner):
  the metric can't tell spread-as-structure from spread-as-noise.** A passing spread
  arranged per-card is camouflage. The number is necessary, never sufficient — pair it
  with (a) the RL3 role-map check: render a false-colour role-ID pass and confirm value
  tier correlates with structural role (dorsal/flank/ventral/rim), not with element
  index; (b) the Fable critic judging ORGANISATION, which no percentile can.
- **RELIEF asserts (RL1, on the BUILT mesh, never on dials):** side-ortho silhouette of
  hull+ranks must deviate **≥0.15u above the bare hull topline** over the torso run (R1
  breaks the outline); per-rank standoff floors — armour ≥0.05, belly deck ≥0.045, flank
  shingles ≥0.045, gorget ≥0.04; **any raised element with lift <0.02u fails the build.**
- **RECESS-PAIRING assert (RL2):** every raised rank element has recess-tier triangles
  within its footprint (perimeter walls / under-gaps / gutter walls) — recess tri count ≥
  raised element count, per rank.
- **ANTI-POOLING assert (RL3/RL4's bound — audit C2: median AND spread both pass a
  pooled band, so the render gate alone re-admits the round-2 sheet-metal stripe):** max
  contiguous same-tier bright (ashLit/rim) run ≤ **4 consecutive stations on any column
  AND ≤ 4 consecutive columns on any station-ring** (v2.2 symmetry fix: a transverse
  pooled band — all columns lit at the same stations — evades a per-column-only cap),
  AND bright tiers ≤ **20%** of any single region's (dorsal/flank/ventral) area.
- **INDEX-MATERIAL FIREWALL (RL3, broadened — audit):** static check on `dragonFornax.js`
  — flag ANY material-selection expression whose selector references the loop index,
  **however expressed**: modulo, hash, comparison, ternary (`i===0?ashLit:scorch` at
  `:230` evades a modulo-only match). Every flagged site must be either the role map, or
  an annotated within-tier / one-step-darker duty break per RL3 — `slagBand` (`:69-75`)
  is the named exemption. Match statements, not prose; same mechanism as the limb-plan
  firewall.
- **LIT-TIER HUE PROBE (RL7 — closes the probe gap that shipped the steel-blue round):**
  the channel-order probe below covers FIRE-REGION pixels only; additionally assert
  **8 ≤ R−B ≤ 20 and HSV saturation ≤ 0.10** ((max−min)/max — HSV, NOT HSL; the two
  disagree by up to 0.03 on these hexes) on lit-tier (`ashLit`/rim) masked pixels of the
  capture, same CA-off + dither-off mode, ±2/255 tolerance.
- **CROP FRAMING (capture harness):** every crop camera must target BUILT geometry, never
  a stub — assert per panel: masked part coverage ≥5% of crop pixels and pixel stddev >0.
  (Two of six panels shipped as solid black rectangles framing an I3 box stub — the owner
  was shown nothing, and nothing failed.)
- **⚠ NOTCH FLOOR (audit round 2, blocks I1 sign-off):** each digit tip projects **≥0.15 of
  bay chord beyond the between-tip membrane line** (§5). This is the geometry guard against
  the taut bays collapsing into the plane wing at chase distance — assert it on the built
  mesh, not on the dial, since drape and projection are different numbers.
- **⚠ WRIST-FOLD LEGIBILITY at `wristT 0.30`:** 0.30 sits at the TOP of the house 0.2–0.3
  band, and the medial wrist exists precisely to make the fold read — pulling the wrist
  INBOARD is what creates it (ref §4.4). Our differentiation pushes the opposite way, so
  `flapstrip` must explicitly confirm the fold still reads at 0.30 before the number locks.
  If it doesn't, the wrist moves inboard and the planform differentiation is carried by
  `archRise` alone — the fold outranks the differentiator.
- **Channel-order probe:** every fire-region pixel R≥G≥B; bloom B ≤ 0.5·G (law 4) —
  a pixel-cross-section check per AAA §4, worst case = warmest sky. **Flakiness guard
  (audit):** chromatic aberration's per-channel offsets (`postfx.js:57-61`), the ±0.5 LSB
  dither (`postfx.js:106-107`) and the grading lift all legitimately perturb per-pixel
  channel order, so the probe (a) captures in a **CA-off + dither-off capture mode** (a
  capture-harness flag, capture-only — never ships), and (b) asserts with a **±2/255
  per-channel tolerance**. The strict inequality is a law on AUTHORED colour; the probe
  verifies it post-grade within tolerance.
- **Seam-topology count** (design-time): T-junction fraction ≥0.60, 120° Y ≤0.15 (§4).
- **Cruise-emissive by contribution:** eyes + coal-hint only; coal-hint contribution
  capped ≤ eye contribution (law 6).
- **Wobble mask:** trailing-edge-only flutter (leading edge amplitude ≡ 0) (§5).
- **Ember cap:** ≤120 hard per-creature, ≤40 cruise (§3 re-budget) — PLUS a Surge-time
  worst-case-biome census assert: creature embers + trails + biome FX + surge motes ≤
  the global 150–300 mobile ceiling.
- **Limb-plan firewall:** no forelimb builder, no import of any 6-limb arm module —
  a static import-statement check (law 2; match statements, not prose).
- **Monotonic ladder asserts** (§10 list).

**Feasibility audit:**
- Overdraw: no additive shells, no enclosing glow mesh (house §1); underside backlight is
  a dropped emissive sub-mesh copy in its own material (§5 — the Vesper `memGlow`
  pattern; NOT emissive on the shared membrane, which would light both faces): one extra
  thin tri layer per bay, counted in the §10 tri budget; one radial-gradient
  `DataTexture` sprite family for ember/halo (AAA tell #5 — never CanvasTexture, never
  solid glow meshes). Transparent/additive drawables recounted honestly, ≤8 at apex.
- Particles: per-creature cap 120 (§3 re-budget) leaves headroom under the GLOBAL
  150–300 mobile ceiling for trails + biome FX + surge motes — amber until the §11
  Surge-census assert passes on the worst-case biome; green only then.
- Shimmer: vertex wobble + animated emissive = zero extra overdraw (ref §7) — green.
- Gape + throat: one jaw joint + one translucent material — cheap; Surge-only visibility.
- Camber breathing: one lerp on existing membrane verts — cheap.
- Risk flagged: THE STOKE sweep touches many materials — drive it per-segment on the
  casLevel cascade / Tempest `stormTimer` deterministic-clock pattern
  (`dragon.js:1959-1980, 1997-2045`), not per-pixel shader work. (Vesper's `seamRun` is
  the extent LADDER dial only — §3 correction.)

**Marked turntable-only features (the auditor checks these against the engine):** gen-3
hairline seams (ultra-DEVICE-gated per §4, not context-gated — listed here because
low/high devices never see them) · temper-oxide band · eye placement detail (chase cam
gets only brow silhouette) · gape/breath + throat distension (Surge camera + shop) ·
tail-prop tripod stance (shop idle) · **bay-depth value banding** (§5) · **the thumb
claw** (§5) · **digit/knuckle countability** (the gameplay read is the 3-bay scallop
silhouette, §5) · **THE CHIPPED BROW** (§6 — ~2–3px from the chase cam) · **serration
vane-profile asymmetry** (§4-R1a, v2.2 demotion — a 0.60–0.70 apex offset on a 2–3px
footprint moves 0.3–0.5px at chase scale; the chase-distance Tempest splits are rail
duty + rhythm). Everything ELSE in this sheet must survive the rear-chase frame.

## 12. The gate + named residuals

- **Three-judge split (AAA §3):** machine numbers first (the §11 probes), then a fresh
  harsh Fable critic at **≥4.2, no axis ≤2, binary vetoes**, judging in-game rear-chase
  captures against worst-case backgrounds (warmest sky for the amber, bright water for
  rims) + clean studio frames. One revise round per phase; a third attempt means the
  technique is wrong, not the numbers.
- **Calibration tiles:** Phoenix (warm-lane collision — Fornax must read interior-leak,
  not rim/tip plumage), Ember starter (warm starter), Vesper (dark-lane split: warm char
  vs cold glass), **Tempest (NEW, audit C1 — dorsal-silhouette collision: the §2
  reversal put Fornax's spine in Tempest's lane, and the v2 gate could not see it — the
  table never gated the dorsal line and this tile list omitted Tempest entirely. The
  tile must split on **rail duty** (broken ~60% vs continuous ridge-ribbon — THE
  load-bearing split at 180px), **rhythm** (period-3 vs strict alternation — weakly
  chase-real, ~6–8px double-peaks), **lane hue**, and — at turntable range only, per the
  §11 list — **vane profile** (struck shard vs symmetric tent-spike; 0.3–0.5px at chase,
  v2.2 demotion)).** Standing veto: *"does any part read as a shipped dragon — or as
  Smaug/Drogon/Rathalos?"* (kit-coherence, §2).
- **Cheap-tell registry sweep** (AAA §2) run as a checklist on captures before every
  critic spawn; §2 failure modes named aloud at every render.
- **Dark-identity kicker:** if apex char luminance <0.05, the house kicker rig applies in
  capture harnesses (house §6.7) — warm-hued floor bounce, never grey the char.
- **Named residuals (human-only, ride the PR preview, each a one-line dial):**
  1. Glide-hold LENGTH feel (3.0–4.5s) — fatigue vs majesty.
  2. Banked-coal flicker rate — cozy vs nagging; photosensitivity comfort on THE STOKE.
  3. Ember density per biome (32 cruise may read busy in the caldera biome).
  4. Char legibility vs the darkest biome sky — kicker tuning.
  5. Chipped-brow read — charming or "broken model"? (delete = one flag). **Judged in
     the shop turntable, not the PR preview — it is invisible from the chase cam (§6).**
- **THE RULE:** every checkpoint that changes the creature owes a NEW lesson file in
  `leapfrog/lessons/` (one file per lesson, no L### numbers).

## SETTLED (do not re-litigate)

- **NO SPADE TAIL** — firebrand terminus + dorsal-ridge silhouette carry (ref §1). Any
  "add the barb back" pass reopens the kitsch the reference pass closed.
- **THE SLAG SERRATION** — the bare spine is revoked (§2 reversal, 1.9/5 audit); the
  dorsal midline carries blade-vanes at 0.13–0.33u Hmax **occiput→hip, decaying beyond
  per §8's tip-floor schedule** (v2.2 — the earlier "occiput→tail" overreached: every
  tail vane sits below 0.13u by design), continuous with the tail crest, horns dominant
  above. The §4-R1 split axes (BROKEN ~60%-duty rail at I1 — the chase split; period-3
  rhythm; struck-shard profile at turntable scale) are PART of the settlement — dropping
  any of them rebuilds the Tempest collision, and dropping the rank rebuilds the
  crocodile lozenge.
- **ABDUCTED legs, plated-reptilian feet** — never tucked, never trailing, never
  bird-scaled (ref §3 camera logic + ref §1 cockatrice guard overrule period canon).
- **Torso inflated / span honest, 5.5:1** — the sanctioned cheat (ref §2); the honest
  13–15:1 wyvern is unrideable and the deep keel blade is anatomy fiction.
- ~~**Bat fan, 4 digits, dominant D1** — not the pterosaur spar (ref §4).~~
  **⚠ OVERTURNED v2.4 — now PTEROSAUR SPAR (§5).** Kept visible rather than deleted,
  because *why* it fell is the reusable lesson: the lock's premise ("a single spar
  degenerates to the paper-dart read") **misattributed to spar count a failure actually
  caused by the missing arm**. Two independent Fable passes, both 5/5. A SETTLED entry
  whose stated premise is shown to be false is not protected by being settled — but the
  bar is exactly that: **falsify the premise, don't re-argue the taste.**
- **THE WING SKELETON IS THE SPEC** (v2.4, §5.1) — arm chain, wrist at 0.242 L, 155°
  chevron at one vertex, 0.113 L forward wrist offset, concave-everywhere trailing edge,
  propatagium, shoulder→hip seam. Never author a membrane outline and hang bones on it.
- **R≥G≥B everywhere; no painted white; blue only as diffuse temper-oxide** (ref §7).
- **Wing tops never emissive** — the silhouette survives THE STOKE.
- **Eyes at 0.20 orbit; the glare is the brow bone** (ref §6) — do not inflate the eyes
  to house-Vesper scale.

## Open owner calls (flag on the build PR)

1. **Name** — "Fornax" (recommended); alternates: Brandvane · Slagmourn · Cindervar.
2. **Cost + roster slot.**
3. **Glide-hold band ends** (residual 1) and coal-flicker rate (residual 2).
4. **The chipped brow** — keep or delete (residual 5).
5. **Boost pre-taste** — a partial half-second stoke on boost between Surges; default OFF
   (dilutes the withholding).
6. **I1 pilot-light ember** (torso audit) — may a DIM ember sit deep in the furnace-socket
   floor at I1 (single coal, contribution-capped under the eyes, law-6-compliant)? The
   critic's condition: attempt ONLY if audit fixes 1–5 still measure short after the
   rebuild. Default NO — it spends the withholding. Owner's call alone.

---

## CHANGELOG

- **v2.4 (THE WING REWRITE — owner rejection of the I2 wing).** §5 replaced end to end.
  Root cause was **a gap in this sheet**: the old §5 specified only differentiators vs
  Vesper (`archRise`, `wristT`, bay sag) and mechanisms (notch floor, propatagium %, the
  DoubleSide trap) and **never specified a wing** — no arm chain, no attachment line, no
  chord distribution, no leading-edge sweep. Four Opus research passes (segments, membrane
  planform, sweep, craft/failure-registry) fed a new **ref §4.9 PLANFORM** section, which
  closed the identical hole in `DRAGON-ANATOMY-REFERENCE.md` (it had settled bat-vs-
  pterosaur topology and area shares but never wing geometry, so every future winged
  creature would have inherited the same failure). Changes: **topology flipped to the
  pterosaur spar** (SETTLED entry overturned — premise falsified, not re-argued);
  full skeleton station table; forward wrist offset **0.035 → 0.113 L**; single-vertex
  **155° chevron** replacing the sine `archRise` bow; trailing edge **concave everywhere**
  (12–37% of local chord), which **deletes the taut-bay identity and the notch floor**;
  chord table with outer stations retapered to hold concavity through the tip hook;
  shoulder→hip bonded seam with a free aft corner; propatagium and wrist knuckle-boss made
  non-negotiable; ref §4.1's "build the fan" verdict superseded. New §11 assertions P1–P10.
- **v0 (art-direction lock, post-reference synthesis).** Direction BANKED confirmed;
  three reference-forced reversals applied (spade → firebrand + dorsal ridge; tucked →
  abducted; keel blade → shallow muscle wrap + 5.5:1 sanctioned-cheat torso); rear-chase
  sentence rewritten. All dials cited against `DRAGON-ANATOMY-REFERENCE.md`; unsourced
  precision declared as ranges (humerus:femur 1.25–1.6; tail length a free variable
  locked by composition). Next: I0 stub + capture seams, then `slagAnvilTorso` behind
  default-off dials, per AAA-PIPELINE increments.
- **v1 (independent technical-art audit round — REVISE 3.4/5 applied verbatim).** See
  §13 AUDIT LOG.
- **v2 (torso-richness audit — 1.9/5 FAIL after five build rounds; richness planned, not
  patched).** The bare-spine law REVOKED (§2 reversal → THE SLAG SERRATION, reconciled
  with §8's tail crest as one rank); §4 rewritten around the R1–R6 rank suite with relief
  floors; new §4b RICHNESS LAWS RL1–RL7 (relief floor, recess pairing, value-by-role,
  strokes-not-confetti, pale-albedo light, render-space values, warm-grey hue) inherited
  by every later part; §11 gains the render-space value gate (`tools/valuegate.mjs`,
  median ≥28 / p10–p90 ≥45), the spread-as-structure warning, relief/recess asserts, the
  `i % n` firewall, and the crop-framing requirement. See §13 AUDIT LOG.
- **v2.1 (corrections round — independent audit of v2: SOUND-WITH-CORRECTIONS, six
  fixes applied verbatim).** Tempest vane figures corrected (built ≈0.284u, not
  "~0.37u"); the serration's Tempest collision closed with three committed split axes +
  a §12 Tempest tile + a §2 dorsal-line row; RL3 restated (role sets tier, index
  perturbs within — `slagBand` exempt) + anti-pooling assert; relief band unified
  0.13–0.33u; §8 handoff made buildable (`serrationTopAt(z)` additive contract key —
  though this round's schedule numbers were arithmetically wrong, see v2.2); RL7 numeric
  hue band + lit-tier probe; §0/§4/§8 figures synced to shipped code (stats, cost, span
  definition, tail unit bug). See §13.
- **v2.2 (re-audit of v2.1 — C4/C5 re-opened on arithmetic; every number now computed
  before assertion).** Tail schedule re-committed (pitch 0.32u near-constant, 17 vanes
  over the 5.13u hip→tip run; height 0.18u→0.04u tip floor, ×0.91 derived — the v2.1
  series died halfway down the tail and its decay left a dead 0.034u crest); RL7 sat
  bound ≤0.10 HSV with the formula named (0.07 failed both certified hexes); RL3
  scale-separated + three duty-break bounds (with a computed flag: `slagBand` violates
  the min-run bound and owes a one-line retune); torso vane pitch committed (15–17 @
  0.14–0.16u); profile split-axis demoted to turntable; relief band's binding reading
  stated (rank-Hmax); anti-pooling made transverse-symmetric; SETTLED band scoped to
  occiput→hip. See §13.

---

## 13. AUDIT LOG

**Round 1 — independent technical-art audit, 2026-07-25. Verdict: REVISE, 3.4/5, five
blocking defects. House protocol followed: ranked fixes applied verbatim, no argument;
same auditor re-confirms.**

The five blockers, one line each, and what changed:

- **B1 — Hero wing already ships on Vesper; §2 table written from titles, not code.**
  §2 table rewritten from `dragonVesper.js` / `dragons.js` (five-finger fan, propatagium,
  thumb claw, underglow copy, cowl plates, no-forelimb de facto wyvern silhouette all
  Vesper's); "only true wyvern" claim dropped; wing re-differentiated on committed
  planform + bay numbers (§5: `archRise 0.12`, `wristT 0.30`, bay sag ≤0.10 vs Vesper's
  0.4/0.21/0.35); identity re-leaned on the four-limb abducted plan, char plates,
  THE STOKE, and the amber interior-leak lane.
- **B2 — 6:1 halo unachievable (single threshold bloom, no-cream Surge drop, tier-2
  composer off).** §3 bloom bullet rewritten against `postfx.js`; 6:1 restated as a
  tier-0 studio/turntable aspiration; geometry (seam skirts + dropped `memGlow`-pattern
  underglow copy) made the guaranteed carrier; tier-2 no-bloom read specced (hot cracks
  in char, no spill).
- **B3 — DoubleSide emissive lights both faces; shared `wingMat` boost term glows the
  tops.** §5 gains an explicit paragraph: underside glow is a separate dropped sub-mesh
  in a bespoke material outside `wingMat`; top membrane registers
  `wingMembraneEmissive: 0x000000`; the unconditional boost/backlit/casLevel drive
  (`dragon.js:1970-1990`) is neutralized by the black emissive colour. §11 feasibility
  bullet corrected to match.
- **B4 — Dishonest rear-chase claims (countable digits; chipped brow at ~2-3px).**
  Rear-chase sentence rewritten around the scalloped 3-bay trailing-edge silhouette;
  digit countability and the chipped brow moved to the §11 turntable-only list; §5
  topology claim restated; residual 5 rerouted to the shop turntable.
- **B5 — "Budget gen-3 in the shop" but no shop/game build split exists.** Committed:
  gen-3 hairlines gate on `activeDetailKey()==='ultra'` (`modelDetail.js`), stated
  plainly as device-scoped, not context-scoped; budgeted inside the ultra multiplier;
  §10 ladder cell relabelled.

Non-blocking fixes in the same pass: camber fast end 0.04c→0.06c (into the cited
ref §4.4/§5.5 band, slow end declared an exaggeration); `seamRun` re-cited as an
extent-ladder dial with ignition moved to the casLevel cascade / Tempest `stormTimer`
pattern (§3, §11); R≥G≥B probe given a ±2/255 tolerance + CA/dither-off capture mode
(§11); the hero's pose-gating admitted plainly with what carries the glide hold (§5);
gusset aft hem stopped at 0.65 of the shoulder→hip run + flapstrip interpenetration
check (§7); embers re-budgeted against the GLOBAL mobile particle ceiling (32 cruise /
90 burst / 120 per-creature cap + Surge census assert — §3, §10, §11); `feverWash`
made a required warm def field for the per-dragon `setFeverTint` path (§3); §11
turntable-only list completed (bay banding, thumb claw, digit countability, chipped
brow).

Cost of the round: no direction change — BANKED, the STOKE, the firebrand tail, the
abducted legs and the 4-digit fan all survived; what changed is honesty (pose-gating,
gameplay-scale reads), engine truth (bloom, LOD, shared-rig emissive), and one real
differentiation axis for the wing.

---

**Round 2 — same auditor, re-confirmation. Verdict: PASS, 4.4/5.**

All five blockers **CLEARED and verified against source**, not against the director's
account of itself — the auditor independently re-checked `dragon.js:520`
(`setFeverTint(def.feverWash || null)` — so a def without a warm `feverWash` really does
flash magenta on `surgeStart`), the `wingMembraneEmissive ?? wingEmissive` fallback at
`dragon.js:1979`, and every bloom constant quoted in the revised §3. All eight
non-blocking fixes confirmed present.

**Both refusals upheld.** Keeping 4 digits: the round-1 ask was differentiation on a real
axis, not fewer digits — and digit count is invisible at chase distance anyway, so dropping
to 3 "would have chased a number instead of a read." Keeping the STOKE timing, firebrand,
abducted legs and the SETTLED items: none were defects in round 1. The auditor's summary of
a correct revise round — *"direction survived, claims were fixed."*

**One NEW defect, introduced by the B1 fix** (which is the argument for re-checking rather
than trusting a fix list): the taut bays that differentiate us from Vesper put the rear-chase
sentence at risk of the PLANE WING, because a ≤0.10-chord notch is 3–4 px at the measured
~180 px chase span. Fixed here by THE NOTCH FLOOR (§5) — notch depth comes from bone
projection, ≥0.15 bay chord beyond the membrane line — with a §11 assert. Two nits fixed with
it: the `seam gens` ladder assert must build at ultra (gen-3 is device-gated, so the naive
assert is flaky on most devices), and `flapstrip` must confirm the wrist fold still reads at
`wristT 0.30` before that number locks — **the fold outranks the differentiator**.

**Turntable-only list confirmed honest and complete.** No remaining feature claims a
rear-chase read it cannot deliver. Standing residual for I1: the distinctiveness veto is
decided in the shop turntable, where the shared kit vocabulary (thumb claw + propatagium +
cowl plates) is fully visible — §12's Vesper side-by-side tile is the control for exactly
that.

---

**I1 GATE — char-plate anvil. Round 1: 3.6/5 REVISE → Round 2: 4.3/5 PASS (same critic, resumed).**

Round 1 found two defects the 15/15 machine probe could not see, plus one false claim:
- **The silhouette was severed at the throat** — hull chest-prow cap at z −1.45, neck aft station
  at −1.50, uncapped: a 0.05u slit through the chest. A geometry probe measures what is THERE;
  absence is not a value it can read. Fixed by burying the neck root at −1.38, plus a permanent
  join assert.
- **The seam network was ventral** — `for (k = 2; k <= 7)` walks chine→flank→BELLY→flank→chine,
  under a comment promising a dorsal arc. The whole seam identity, and I4's STOKE path, sat on the
  surface the chase camera never sees. Now walks `[2,1,0,9,8,7]`.
- **`M.rim` was defined and never applied** — the four-tier ladder was three. Now traces the deck
  edge as a caught rim over a dark face (confirmed round 2 as conservative, NOT the LED tell).

Also corrected: the probe reported shoulder:hip 2.23× because the wing stub's arm bone fell in the
sampling band; hull-only truth is **1.28×**. Measurements now filter on `userData.fornaxPart`.

**The blue-black question — resolved as a NON-issue by measurement, not by agreement.** Fornax char
is B−R **+2** (neutral); Vesper's hide is *painted* B−R **+13**. Fornax's rendered blue is entirely
sky bounce (mean B−R +0.9…+2.9 at game angles; sunlit facets go warm +6; the blue vanishes under
the gold sky). **Do not warm the albedo** — it would leave the sourced charcoal band and drift into
the Ember surface-warm lane. If cruise ever feels too cold the levers are scene key/fill or I4's
amber, never the diffuse.

**ATTACH CONTRACT IS NOW FROZEN.** I3's `brandSkull` and `firebrandTail` mount through it.

Watch items carried to I2/I3: rim rails and dorsal arcs cross at six points at identical proudness
(no z-fight in four static views — re-check in motion); seam width may need one step at real chase
distance (**widen, never brighten**); `brandSkull` must be sized against the real neck terminus
(0.32) rather than I0's box (0.24).

---

**TORSO RICHNESS AUDIT — independent critic vs the Tempest bar, 2026-07-26.
Verdict: 1.9/5 FAIL, after FIVE build rounds the owner rejected. Sheet rewritten so
richness is PLANNED, not patched.**

The confession first: **the sheet itself caused the biggest failure.** The v0–v1
silhouette spec reserved the dorsal midline (no spike rank, clean sky over the spine, the
ridge saved for the tail and the horns for I3). The builder honoured it faithfully, and it
is the single biggest reason the side profile read as a crocodile lozenge. Revoked as a
director's reversal in §2 (THE SLAG SERRATION, reconciled with §8's tail crest as one
rank). Four rounds of the five were spent tuning albedo around a law that made the torso
unrescuable.

The findings, and where each became law:

1. **Relief amplitude 4–7× short, all sub-pixel at range** — Tempest vanes built ≈0.284u
   (formula ceiling 0.337u; this entry originally misquoted "~0.37u" — corrected, audit
   C1) vs our 0.052u→0.02u scutes; armour standoff 0.014 vs 0.055+cup; deck lift
   0.010–0.016 vs 0.05; shingles 0.008. → §4 R1–R6 floors + §4b RL1 + §11 relief asserts.
2. **The bare-spine law** → §2 REVERSAL v2 (above).
3. **No paired recesses** — cards floated 0.008–0.016u with no walls = decals/camo.
   → §4b RL2 + §11 recess assert.
4. **Value dealt by index = mid-frequency noise = military camouflage.** Census corrected
   by the audit: at least SIX index-keyed selectors (`i%3` `:165`, `i%2` `:250`, `i%2`
   gorget `:264`, `byTier[i%3]` `:487`, the non-modulo `i===0` ternary `:230`, plus the
   exempt `slagBand` duty-hash `:69-75`) — not the "three" this entry first counted.
   → §4b RL3 (as restated: role sets the tier, index perturbs within it) + the §11
   index-material firewall (broadened past modulo) + the anti-pooling assert. The
   critic's key line, kept verbatim because it explains how five probe-passing rounds
   still gagged the owner: *"the metric can't tell spread-as-structure from
   spread-as-noise."* Now in §11.
5. **Bright tier as confetti** (0.022u rim slivers on random plates) → §4b RL4: strokes —
   rails + leading edges; halve the count, enlarge the survivors.
6. **A legal light source unused** — pale low-roughness albedo (Tempest `silverRim`) is
   NOT emission and does not violate withheld light. → §4b RL5; gap ≈70% geometry / 30%
   light, half the light half available at I1.
7. **Hue** — warm-tan ash/rim rendered khaki under the blue rig. → §4b RL7 warm-grey
   (`0x8f8a84` / `0xbdb6ac`).
8. **The target that caused it** — "≥0.05 luminance spread" was satisfied in MATERIAL
   space (0.133) while the render sat at median 14/255. → RL6 + the §11 render-space gate
   (`tools/valuegate.mjs`: median ≥28/255, p10–p90 ≥45/255, torso-isolated mask).
9. **Capture harness** — two of six crop panels were solid black rectangles framing an I3
   box stub. → §11 crop-framing assert (coverage ≥5%, stddev >0).

What did NOT change: BANKED, THE STOKE, the firebrand, abducted legs, the 4-digit fan,
all proportions (§4's numbers survived the audit), and every SETTLED item. This round
changed geometry laws and measurement honesty, not direction.

**ONE open question, the owner's alone (Open owner calls #6):** whether a dim I1
pilot-light ember may sit in the furnace-socket floor. The critic's guidance: only
attempt it if fixes 1–5 still measure short after the rebuild. Default NO.

---

**v2 CORRECTIONS ROUND — independent audit of the rewrite, 2026-07-26. Verdict:
SOUND-WITH-CORRECTIONS; all engine citations verified; six corrections applied
verbatim.**

- **C1 (the big one) — the reversal collided with Tempest, hidden by a misquote.**
  "~0.37u" corrected everywhere to Tempest's built ≈0.284u / formula ceiling 0.337u; the
  inverted "we sit just under it" claim deleted (our 0.33u is ABOVE Tempest's built max —
  height is not the split axis). The rewrite had rebuilt Tempest's R1 near-verbatim,
  including its signature continuous crest-tip ridge-ribbon, and the v2 gate was blind
  to it (no dorsal row in §2's table, no Tempest tile in §12). Fixed: §2 dorsal-line
  table row, §12 Tempest tile, and three committed split axes in §4-R1 — asymmetric
  struck-shard profile (apex 0.60–0.70 aft, lead slope ≥3× trail), tall-tall-short
  period-3 rhythm, and a BROKEN ~60%-duty rail at I1 that fuses continuous only under
  THE STOKE.
- **C2 — RL3's absolutism banned the shipped pooling cure.** Restated: role sets the
  TIER, index perturbs within it (or duty-breaks ONE step darker); `slagBand` exempt by
  name; firewall broadened past modulo (the `i===0` ternary evaded it); §11 anti-pooling
  assert added (run ≤4 stations, bright ≤20% per region) because median + spread both
  pass a pooled band.
- **C3 — relief band unified to 0.13–0.33u** (the R1 formula's exact range) in §2, §4b
  RL1, and SETTLED; §10's f0 0.14u clears the corrected floor.
- **C4 — the handoff was unbuildable** (dual schedule authority over z 0.60→1.70; no
  contract channel for terminal height). Fixed: fr owns occiput→hip; additive
  `serrationTopAt(z)` contract key published (additive keys don't break the freeze).
  ⚠ This round's schedule numbers ("×0.66 owns hip→tip; pitch 0.24u ×0.94") were both
  arithmetically impossible — superseded by the v2.2 entry below.
- **C5 — RL7 committed to numbers:** 8 ≤ R−B ≤ 20 plus a saturation bound; §11 gains a
  lit-tier hue probe (the steel-blue class had a law but no probe). ⚠ The bound this
  round committed (≤0.07) failed both hexes it certified — corrected to ≤0.10 HSV in
  v2.2 below.
- **C6 — figures synced:** §0 stats 1.06/1.02 + cost 2400 (shipped def); span:total-body
  DEFINED (span ÷ nose-to-tail ≈ 1.14, the old "2.3" was span ÷ torso-chain); §8's tail
  dial flagged as a latent unit bug (code builds 2.6 ABSOLUTE = 1.68× torso; dial is in
  torso multiples).

The meta-lesson, recorded for the ledger: a reversal that imports the bar's mechanism
imports the bar's identity — every fix borrowed from a roster dragon must arrive with
its OWN split axis and a gate tile against the donor, in the same edit.

---

**v2.2 CORRECTIONS ROUND — re-audit of v2.1, 2026-07-26. Verdict:
SOUND-WITH-CORRECTIONS; C1/C2/C6 cleared, C4/C5 re-opened on arithmetic. Four fixes
applied, every number computed before assertion (the specific failure of the prior
round).**

- **C4 closed — the tail schedule was impossible two independent ways.** The 0.24u
  ×0.94 pitch series converges to 4.00u (< the 4.03u tail) and spanned ≈2.0u at its own
  11–12 vanes; ×0.66 height decay computed to a 0.034u dead crest at the tail root
  (sub-2px — deleting §1's "rolling ridge crest" in arithmetic). Re-committed:
  **near-constant pitch 0.32u, 17 vanes/16 intervals over the 5.13u hip→tip run
  (16×0.32 = 5.12 ✓); height 0.18u→0.04u tip floor, ratio derived (0.04/0.18)^(1/16) ≈
  ×0.91**; the torso module explicitly owns the aft-body vanes; `serrationTopAt(1.70)`
  now returns +≈0.13u — a live crest, closing the trivially-satisfiable handoff.
- **C5 closed — the saturation bound failed both hexes it certified.** ≤0.07 vs
  computed HSV sats 0.077 (`0x8f8a84`) and 0.090 (`0xbdb6ac`). Now **≤0.10, formula
  named (HSV, (max−min)/max — HSL gives 0.114 for the rim hex)**, both hexes computed
  in the law, probe updated.
- **C2 residual closed — RL3's regimes scale-separated** (camo band 0.05–0.2u admits NO
  index picks; duty breaks live above it) + three bounds: station-scale only, irregular
  duty, min lit run ≥2. **Director's computed correction to the audit:** the claim that
  `slagBand` "already satisfies" all three is FALSE for (iii) — the shipped hash's
  period-5 pattern F,T,T,F,T has singleton lit runs. Bounds adopted anyway (they are
  right); the exemption covers the mechanism; the rebuild owes a one-line retune
  (e.g. `((i*2+1)%7)<4` — computed: duty 4/7, lit runs of 2, gaps 1–2).
- **Split-axis honesty:** torso vane pitch finally committed (15–17 vanes occiput→hip,
  0.14–0.16u — the broken rail's gaps are 3–7px, resolvable, so §12's "load-bearing
  split" now rests on a number that exists); axis (a) profile demoted to the §11
  turntable-only list (0.3–0.5px at chase); (b) rhythm labelled weakly chase-real.
- **Consistency:** SETTLED's band scoped to occiput→hip Hmax; the relief band's binding
  reading stated (rank-Hmax, tall vanes 0.18–0.33u — an every-vane reading would fail
  f0's short vanes and the apex's own 0.128u short vanes); anti-pooling run cap made
  transverse-symmetric (per column AND per station-ring).
