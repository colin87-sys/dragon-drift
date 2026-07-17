# JADE SERPENT — "River-wind dancer" · AAA Starter Build Sheet (v1, BUILD-READY)

The builder's contract for the Jade Serpent AAA elevation — the locked North-Star concept
(`jade-coil-CUTOUT.png`, behind/high-¾ chase over a gorge) + the locked art direction
([`JADE-AAA-ARTDIRECTION.md`](./JADE-AAA-ARTDIRECTION.md)) turned into typed-in-able geometry,
dials, rig hooks, and gates. **Authority stack: the North-Star image > the art direction > this
sheet > any older jade doc.** Every construction path below is audited against the REAL engine
read this session (`js/dragonKoiSerpent.js`, `js/dragonWings.js` `buildSilkFinWings`,
`js/dragonDraconicHead.js` `whiskerFins`, and the `js/dragon.js` rig hooks — line numbers cited
inline). Where the art direction asked for something the rig has no hook for, the MUST-ADD is
named with a minimal signature, or the honest substitution is recorded (§4.5) — nothing here is
aspirational.

> **⚠️ THE STRUCTURAL BET — evolve-in-place, not a fresh module.** Jade is a SHIPPED STARTER
> whose machinery already implements ~80% of the North Star: the one-tube CPU `bodyWave` swim
> (dragonKoiSerpent.js:204–225 / dragon.js:1452–1478), the silk-fin lobe fans + per-lobe furl
> poser (dragon.js:1249–1282), the chin pearl + breath tick (dragon.js:1468–1471), the fin-tip
> dew gems + lagged shimmer (1474–1477), streamers, whiskers, the Koi Lyre `moonTail`. This
> sheet EXTENDS those builders behind **nullable default-off dials** (`caudalBloom`,
> `crestRibbon`, `lobeBreath`, chain plumbing): every new term multiplies by a dial that
> defaults to 0/absent, so a def without the dial builds **byte-identical** geometry — the
> coexist law satisfied without forking `koiSerpent` (whose rig ticks are keyed to the parts
> this exact builder publishes). A fresh module would have to re-publish `bodyWave`,
> `wingLobePivotsL/R`, `pearlMat`, `tipGemMat` bit-for-bit anyway.

> **⚠️ LAW 12 (starter restraint) IS FROZEN.** No glowSeams, no veins, no halo shell,
> `spineGlow ≤ 0.32`, ONE bloom (the pearl). The WOW is bought at the legal maxima on two
> axes jade never used: the **pearl-chain rearward pulse** (components igniting in sequence —
> §6.3-legal, never a seam) and the **pale-seafoam dorsal crest ribbon** (pure DIFFUSE value,
> zero emissive). Ember spent the trio's glow exception; jade's luxury IS the restraint.

---

## §1 Identity & silhouette contract

**The rear-chase read (the frame the player lives in), one word: BLOSSOM.** From behind and
slightly above, the Jade Serpent must read as *an opening green-and-mint fan the player flies
inside*: a foreshortened lateral-swimming S-tube (never a "green noodle") crowned by a bright
pale-seafoam SPINE-LINE running crest→tail, framed by the pectoral fan-V (4 countable koi-ray
tips per side via the ≥0.3 tip notches), and finished by the HERO — **THE GRAND FAN-BLOOM**: a
3-blade split caudal fan (median dorsal veil + twin canted lyre crescents, each ending in 2
prongs) sweeping wide at the tail, breathing OPEN on every swim crest and closing on the trough,
with two broad pearl-streamers flowing beneath toward the lens carrying travelling pearl-light.
Landmark punctuation (4): (1) the split caudal bloom, (2) the pectoral fan-V, (3) the seafoam
dorsal ribbon line, (4) the flowing streamer pair. If the rear read is "tube with flaps," the
build has failed the hero feature (the AD's own veto).

**Anti-collision vs the other starters:** jade is the roster's ONLY legless serpent, ONLY
fan-fin wing family (lobes, not membrane or feathers), ONLY lateral-swim motion signature, and
the one-word colour read is GREEN (149° mint accent lane — 31° clear of Revenant's 118°
gravefire; azure carries gold-tip + ice dorsal seam on navy, ember a blazing cream/fire collar
on orange). The fan-bloom silhouette collides with no one: azure's apex banner is a raptor
wing, ember's an anvil; nothing else in the roster blossoms.

**Motion is identity (§2.13):** the bespoke dial block is the travelling LATERAL body wave
(0 at head → full at tail, `ramp = 0.12+0.88·t`, dragonKoiSerpent.js:215) + the symmetric
koi lobe beat with inboard→outboard lag — NOT vertical undulation, NOT a wingbeat. The
elevation deepens the VERTICAL COMPONENT the rear camera actually reads (`bodyArcY`,
`bodyWaveAmpY`) without touching the lateral amp — majesty from behind comes from the FAN
and the S-line, never from a wilder wriggle.

## §2 Palette — value structure, emissive map, withheld-glow map

Value-structure law (AAA-PIPELINE §1): every hero element carries **core → bloom → dark**.
The dragon's single CORE is the pearl; the mint family is the BLOOM tier; deep emerald is the
DARK field. All emissive is **opaque `MeshStandardMaterial.emissive`** — ZERO additive shells,
zero sprites, zero alpha glow meshes (§6/overdraw census).

| # | material / element | hex | role (core/bloom/dark) | emissive or diffuse | notes |
|---|---|---|---|---|---|
| P1 | body dorsal/flank (vertex paint) | `0x178a54` | mid field | diffuse (+ uniform hue-hold floor `bodyGlow 0.10`, emissive=body hue — shipped, contribution ≈0) | vivid mid-value jade, L(sRGB) ≈ 118/255 — the starters.mjs `carrier:'jade'` band [0.24,0.55] |
| P2 | flank shadow tier (vertex paint) | `0x0d5c3a` | DARK | diffuse | shipped lower-flank lerp, dragonKoiSerpent.js:91 |
| P3 | belly (vertex paint) | `0xa6e2c2` | bloom (faces the floor) | diffuse (+ `bellyEmissive 0x1f8a5c @0.5` hue anchor, shipped) | never seen from chase; the shop/turntable light tier |
| P4 | **DORSAL CREST RIBBON** (vertex paint, NEW) | `0xbdf5d0` | bloom — the dorsal light tier | **DIFFUSE ONLY, zero emissive** | ≈233/255 vs body ≈118 — the endpoint spread that stops the one-green compression; slim edge, ≤2 facet columns (law 9 ≤10%) |
| P5 | fin leading ray | `0x116b45` | DARK | diffuse (vertex) | per-lobe leading band, dragonWings.js:1584–1585 |
| P6 | fin mid body | `0x2f9e77` | mid | diffuse (vertex) + `finGlow 0.6` green hue-hold floor (shipped) | |
| P7 | fin tip / ray crest | `0x9ff0c8` | bloom | diffuse (vertex) | outer ~25% tip + rayRelief crest bands |
| P8 | fin rim carrier (rear lobe + streamers) | `0xd6ffe9` → held green-leaning `0xbdf5d0` fresnel | bloom rim | fresnel rim on OPAQUE mat (`applyFresnelRim`, rear lobe only — shipped) | the lockstep motif carrier |
| P9 | **THE PEARL** (motif, the ONE bloom) | `0xd6ffe9` on diffuse `0xa6ecc6` | **CORE** (the only near-white emitter) | opaque emissive, base 0.55, ±14% swim breath (dragon.js:1468) | law 12's single bloom; modelled sphere, shaded lower hemisphere via the standard lit material |
| P10 | pearl satellite beads (apex pair) | `0xd6ffe9` @0.45 | bloom | opaque emissive (shipped `satMat`, dragonWings.js:1780) | becomes pearl-chain link 1 (§3d) |
| P11 | fin-tip dew gems | `0x35d69a` @0.85 | bloom (saturated — blooms in-colour, never white; coal-not-torch) | opaque emissive (shipped `tipGemMat`) | chain link 2, lag −0.9 (shipped tick) |
| P12 | **lyre gems** (caudal fan tips, NEW ×2) | `0x35d69a` @0.6 | bloom | opaque emissive | chain link 3; ride the wave via `waveRiders` (§4.4) |
| P13 | **streamer ribbons** (NEW split mat) | vertex green P6→P7, tip 15% `0xd6ffe9`; emissive `0x2f9e77` base 0.6 | bloom (travelling) | opaque emissive pulse ±40% | chain link 4 — the "river-current" travelling light |
| P14 | eyes | `0x8ff0c2` family (sclera/iris/keen, shipped def fields) | bloom | emissive, driven separately (dragon.js:1769) — NEVER in spineMats | |
| P15 | whiskers / scutes | `scales 0x8fe0be`, `scaleEmissive 0x0d6b45 @0.22` | mid | near-matte (shipped) | stays OUT of the chain (§4.5 substitution) |
| P16 | fever family (NEW def fields) | `feverWing 0x9ff0c8` · `feverEye 0xbdf3dc` · `surgeHi 0xd6ffe9` (shipped) | — | Surge only | kills the rig's magenta defaults (§4.3) |
| P17 | trail / boost | `0x3fc48f` / `0x9ff0c8` | bloom | scene FX (shipped) | |

**The withheld-glow map (what glows / what stays matte):** glow lives ONLY on discrete
components — pearl (always, the hero) → satellite beads → dew gems → lyre gems → streamer
ribbons, igniting in REARWARD phase sequence (§3d) so pearl-light visibly travels the body like
current. Everything else is matte diffuse: the body tube (hue-hold floor only), the crest
ribbon (**pure value — wiring it through emissive or the `coreGlow` hook would be the LED-strip
failure mode #9 and break law 12; it earns its "luminous" read by being the lightest value on
the dorsal canvas, judged on the brightest biome**), the fin faces, whiskers, head. Cruise
brightest emitter = the pearl; Surge flares the spineMats family toward `surgeHi 0xd6ffe9`
(mint — jade's `surgeHi` keeps the shared flare/rim loop in-lane, dragon.js:1727/1759).

## §3 Part-builder specs

Builders are the SHIPPED registrations — `koiSerpent` (torso, dragonKoiSerpent.js),
`silkFinWings` (fans + pearl + streamers, dragonWings.js:1464), `draconic` head with
`skullType:'koiSkull'` + `whiskerFins` (dragonDraconicHead.js:766), `tail:'none'` (the tail IS
the tube's tapering rear — continuous by construction, and it must stay that way: the fan-bloom
lives INSIDE the tube mesh so it whips with `bodyWave` for free). Each subsection below is an
extension gated on a new nullable dial.

### §3a `koiSerpent` torso — THE GRAND FAN-BLOOM (`caudalBloom`) + the crest ribbon (`crestRibbon`)

**Ground truth to preserve:** one swept tube, N rings (N = round((neckSegments+tailSegments)·
bodyLength), clamped 10–40 → ~24 at apex) × K radial verts (`bodyRadial 13`), girth-spaced z,
single `MeshStandardMaterial` with vertex colours — **the mesh MUST stay single-material**
(a second geometry group makes `mesh.material` an array and crashes every dispose path — the
documented lateral-pearl-line failure, dragonKoiSerpent.js:175–180). All fan geometry is
emitted into the SAME positions/colors/indices arrays BEFORE the wave arrays are built
(lines 209–216 snapshot `baseX/baseY/spineZ/ramp` from the final `positions`), so every fan
vertex rides the CPU swim automatically — the proven `moonTail` pattern.

**A. THE GRAND FAN-BLOOM — the hero.** Rewrite the `moonTail` block (lines 132–173) as a
parameterized caudal fan; `const cb = model.caudalBloom ?? 0`; when `cb === 0` the code path
must reproduce today's strips byte-identically (all new terms ×cb, new topology gated
`if (cb > 0)`).

1. **Independent station sampling (kills the sawtooth).** Today the fan samples one station
   per body ring (~12 usable over the rear half — too coarse for a split edge). When `cb > 0`,
   sample **M = 16 stations** at `along = m/(M−1)` over the rear span (`vStartT 0.5` → tail
   tip), interpolating `cy/cz/rW/rH` linearly between the two bracketing rings. Fan verts carry
   their own interpolated `z`, and since `ramp[]` is computed per-vertex from `spineZ`, the
   finer fan still waves correctly. (Membrane-arc law: every curve ≥4 segments across any
   feature — the split notch below spans ~4 stations at M=16.)
2. **Three blades, dominant + decay (kills the picket fence).** Blade heights per station:
   - twin ventral LYRE crescents (the DOMINANT pair): `hL = leadR·(1.55 + 1.05·cb)·moonTail·
     flare·wob`, canted `cant = 0.9 − 0.12·cb` rad off vertical (opens the fan wider at apex),
     root offset `xr = ±rW·0.32`, `yr = cy − rH·0.7` (shipped anchors);
   - median dorsal VEIL (the decayed rank, ~0.72× dominant): `hD = leadR·(0.68 + 0.44·cb)·
     moonTail·flare·wob` at x=0 on the ring top (`cy + rH`).
   `flare = sin(min(1, along^0.5)·π·0.96)` (shipped crescent envelope), `wob = 1 + 0.14·
   sin(along·π·2.6)` (shipped scallop).
3. **THE SPLIT (the "grand split tail-fan" of the image).** Cut ONE clean V into each blade's
   trailing region: `split = 1 − cb·0.52·exp(−((along−0.84)/0.10)²)` multiplied into the blade
   height — a single swept notch at along≈0.84, depth 52% of local height, σ=0.10 (≈3–4 of the
   16 stations across it — smooth, never a scissor tooth; inter-prong cusp ≈ ⅓ of peak depth
   per the sawtooth law). Each crescent then ends in TWO prongs; with the median veil the rear
   fill shows a countable 3-blade / 6-tip caudal blossom. **Few, large, clean — one split per
   blade, never more** (the Revenant R2.1 anti-damage law transposed).
4. **DEPTH — 2-quad blades with inward-carved ray flutes (kills flat tape / flat sails).**
   Each blade strip gains a MID vertex row (root → mid → edge = 2 quads across the height,
   ×2 windings as shipped — the single-sided body material must show both flanks). The mid row
   carves INWARD (toward the blade's own plane normal, i.e. reduce its outboard offset):
   `midInset = −cb·0.12·h·(1−rayMask)`, where `rayMask = min(1, Σ_{r=0..2} exp(−((along−(0.20+
   0.28·r))/0.09)²))` — 3 raised RAYS running root→tip with recessed webs between, the exact
   carve-inward mechanism proven on the pectoral `rayRelief` (dragonWings.js:1571–1576: crests
   stay AT the smooth envelope, webs recede — the outline never grows from relief). Value-band
   it: crest verts lerp → P7 `0x9ff0c8` ×0.55, web verts → P5 `0x116b45` ×0.82, edge row →
   `cEdge` (shipped body→pale lerp, retinted toward P4 `0xbdf5d0` when `crestRibbon > 0` so
   the ribbon visually pours into the fan). Root row stays `cRoot` (body→shadow 0.55) — dark
   root → mid banding → pale edge = core→bloom→dark on the hero element.
5. **Connectivity (kills the severed appendage):** blade roots are pushed at the tube surface
   coordinates each station (shared station math, ≥0.02 interpenetration is unnecessary — same
   mesh, welded by construction). The trailing edge of each blade is one continuous polyline.
6. **Tri cost:** 3 blades × 15 station-steps × 2 height-quads × 2 tris × 2 windings = **360**,
   replacing the shipped ~144 moonTail tris → **net +216** (applies at every form with
   `cb > 0`; see §6).

**B. The DORSAL CREST RIBBON — `crestRibbon` (rb ∈ [0,1]).** Pure vertex paint in the shipped
ring colour loop (lines 89–93). After the existing belly/shadow ramp:
```js
if (rb > 0 && sn > 0.90) {           // top ~2 of K=13 radial columns ≈ a 2-facet-wide edge
  const taper = t < 0.72 ? 1 : Math.max(0.35, 1 - (t - 0.72) * 2.2);  // narrows into the fan root
  tmp.lerp(colCrest /* 0xbdf5d0 */, rb * 0.85 * taper);
}
```
Runs ring 0 (nape, meeting the head's pale crest fronds `horn 0xc7ebcf` — the rhyme) to the
caudal fan root, then hands off to the fan's pale edge row — **the row reaches its anatomical
terminus** (§3.6 corollary: a ridge that stops mid-back reads unfinished). Width ≈2 facet
columns of K=13 (~±14° of arc) — a slim crest line, never a broad toy stripe; ≤10% of the
visible dorsal surface (the law-9 carrier cap). Zero geometry, zero drawables, zero emissive.
Judge endpoints on the pale backdrop AND the brightest biome (P4 vs P1 ≈ 233 vs 118 in 8-bit —
reads at both).

**C. Vertical-share deepening (existing dials only):** `bodyArcY` 0.14 → 0.19 apex (the
resting S the rear cam reads, line 66), `bodyWaveAmpY` (builder dial, default 0.16, line 220)
→ 0.24 apex. **The LATERAL `bodyWaveAmp` stays at the shipped 0.8/0.9** — the undulation IS
lateral (0 at head → full at tail) and already correct in-engine; the elevation raises only
the vertical component the foreshortened rear view can see.

### §3b `silkFinWings` — the pectoral fan-V (shipped, retuned) + the streamer split + lyre gems

**Ground truth to preserve:** per side 3→4 lobes marching a short root arc; each lobe a
cambered petal `petalGeo` (nX = 8·detail length samples × nZ = 11 chord samples when
`rayRelief > 0`), tip NOTCH ≥0.3 (the jade separation metric, asserted), swell-then-taper
`lenMulFor` [0.9, 1.0, 0.85, 0.7] at N=4 (dominant mid-lobe + decay — already legal), 3
carve-inward ray flutes, opaque mats ONLY (`finMat` / `finMatRear`; translucency was removed
for view-dependent L/R tint — gate r3/r6), the L/R mirror BAKED into winding + x-negation
(dragonWings.js:1596–1604 — **never `mesh.scale.x = −1`**, which flips normals and shades the
two fans different greens; the ONE sanctioned exception is the streamer's `strip.scale.x =
side` on its mostly-planar ribbon, shipped). The whole fan hangs off `wingPivotL/R` with the
rear carrier lobe on `wingTipL/R`; per-lobe `furl` groups are published as
`wingLobePivotsL/R` — the rig's jade poser owns all motion (§4.1).

**Changes (all nullable):**
1. **Streamer material split (`streamerPulse` gate).** Streamers currently share `finMatRear`
   with the rear lobe (line 1669) — pulsing it would pulse the lobe. When `model.streamerPulse
   > 0`, streamers take `streamerMat` = a parameter-identical clone of `finMatRear` (same
   vertex-colour recipe, same `applyFresnelRim(cRim)`, same emissive `cMid` base 0.6 → visual
   parity at pulse 0) with `userData.chainLag 1.8, chainPulse 0.4, baseIntensity 0.6`, pushed
   to `spineMats` AND `parts.pearlChainMats` (§4.2). One extra material, zero extra drawcall
   families of consequence, zero new geometry.
2. **Lyre gems (chain link 3, `lyreGems` dial).** Two stretched octahedra (`OctahedronGeometry
   (0.14·ws, 0)` scaled (1.6, 0.8, 0.8) — the shipped dew-gem recipe, line 1524, few + large,
   never confetti), one per ventral crescent, seated at the crescent's max-flare station
   (along ≈ 0.62, on the blade edge row, x = ±(xr + hL·sinC·0.9), i.e. ~0.9 of the blade
   height — the tip-jewel seating law). Material `lyreGemMat`: colour `0x1f8a5c`, emissive
   `0x35d69a` @0.6, roughness 0.32, `userData.chainLag 1.35, chainPulse 0.35`; → `spineMats` +
   `pearlChainMats`. **⚠ These sit over the WHIPPING tail (wave ramp ≈0.9 there): as separate
   meshes they MUST ride the wave via the `waveRiders` hook (§4.4) or they visibly detach —
   the trail-detach bug family.** They are built in the WINGS builder (which already owns the
   gem recipe + chain mats) at torso-space coordinates read from `attach.segmentAnchors`;
   published as waveRiders with their rest position + spineZ. +16 tris.
3. **Pectoral retune (dials only, no code):** apex `lobeSpan` stays 6.0 (span is pinned by the
   starters head:body/span bands); `lobeBeatSpread 0.26` (from default 0.22 — a slightly wider
   held fan matches the image's blossoming pectorals); everything else shipped.
4. **Tip-gem count is UNCHANGED** (one per fan on the dominant lobe, i===1) — the chain reads
   by sequence, not by adding beads.

### §3c Head — `draconic` + `koiSkull` + `whiskerFins` + `cuteEye` (geometry UNTOUCHED)

The shipped head already matches the North Star: slim browed koi skull, swept crest fronds
(`crest: 1` at apex), calm luminous green cuteEye (the def-level `eyeSclera/eyeIris/
eyeBallEmissive` fields — note the head reads `c.def.*`, NOT `model.*`), two S-flow barbel
whiskers per side with distinct lengths (×0.8 step, tip ≤0.2× base — law 4, dragonDraconicHead
.js:766–804) cradling the pearl. **No geometry change.** The image's "large pale pearl eye"
is the chin pearl reading against the head at chase scale — do not enlarge the eye (the apex
keeps the keen almond `eyeScale 0.66`; big whelp eyes belong to f0). Whiskers keep `scalesMat`
(P15) — matte, out of the chain (§4.5 substitution: the chain's link 1 is the pearl's OWN
satellite bead pair, not the whisker tips).

### §3d The RIVER PEARL + THE PEARL-CHAIN (the motif made kinetic)

The pearl socket is shipped (`buildRiverPearl`, dragonWings.js:1755–1792): form-invariant
throat `motifAnchor` (drift ≤0.15 asserted), bead 0.56→0.7→1.0, emissive 0.24/0.35/0.55,
`pearlMat` published (stage ≥2 only) into the swim-breath tick. **The chain** = the pearl's
light travelling rearward as a phase-lagged pulse across components jade already owns, on the
ONE shipped clock (`bodyWave.phase · 0.5`):

| link | component | mat | lag (rad) | pulse | peak `I·lum` |
|---|---|---|---|---|---|
| 0 | the pearl (chin) | `pearlMat` (shipped tick, line 1468) | 0 | ±14% | 0.54 |
| 1 | satellite bead pair | `satMat` (shipped mesh, NEW in chain) | 0.45 | ±30% | 0.34 |
| 2 | fin-tip dew gems | `tipGemMat` (shipped tick, line 1474) | 0.9 | ±28% | ~0.75·lum-sat (shipped ceiling) |
| 3 | lyre gems (caudal fan) | `lyreGemMat` (NEW) | 1.35 | ±35% | 0.56 |
| 4 | streamer ribbons | `streamerMat` (NEW) | 1.8 | ±40% | 0.72 (spread over a long thin ribbon) |

Links 1/3/4 ride the MUST-ADD `parts.pearlChainMats` walk (§4.2); links 0/2 keep their shipped
hardcoded ticks byte-identical. Hue discipline: the pearl is the ONLY near-white (`0xd6ffe9`);
every other link is the saturated mint lane (`0x35d69a` family / `0x2f9e77`) that blooms
in-colour under ACES (coal-not-torch — pick hues by how they bloom). All ticks skip during
Surge (`!player.feverActive`, the spineMats flare owns them then — shipped pattern). The
one-bloom-by-contribution assert must be re-run with the phase PINNED at each link's peak
(§8). Cruise total stays calm: lags spread the peaks so no frame sums them.

## §4 Rig wiring — hooks, MUST-ADDs, gotchas, fever firewall

### §4.1 Existing hooks this build rides (verified, no code needed)

- **`parts.bodyWave`** (torso → dragon.js:321, ticked 1452–1478): lateral swim `x = baseX +
  amp·breath·ramp·sin(freq·z + phase)` + vertical share `y = baseY + ampY·breath·ramp·
  sin(0.9·ph + 0.4)`; phase ACCUMULATES with eased speed (never phase = speed·clock). Dials:
  `bodyWaveAmp 0.8 (f0/f1) / 0.9 (apex — shipped)`, `bodyWaveFreq 1.0`, `bodyWaveSpeed 3.2`,
  `waveBreath 0.12 (apex)`, `bodyWaveAmpY 0.16→0.24 (apex)`, `bodyArcY 0.14→0.19 (apex)`.
- **`parts.wingLobePivotsL/R`** (wings → dragon.js:316–317, posed 1249–1282): the symmetric
  koi beat — L_i↔R_i share one phase, `lobeBeatAmp 0.3, lobeBeatLag 0.5, lobeBeatSpread 0.26,
  lobeBeatFlow 0.2`, `lobeFlareBoost 1.25` (boost/surge bloom). Pose writes `rotation.y/z` on
  the `furl` groups with damp 9 — do NOT hand-animate these anywhere else.
- **`parts.pearlMat` / `parts.tipGemMat`** (dragon.js:322–323 → ticks 1468/1474).
- **`parts.motifAnchor`** (throat, invariant), **`parts.wingElements`** (per-lobe
  root/tip/length/notchDepth — the starters block reads these).
- **`materials.spineMats`** (dragon.js:330): ALL new emissive mats (`lyreGemMat`,
  `streamerMat`) join it — the Surge flare lerps them toward `surgeHi 0xd6ffe9` (mint, 1727)
  and the Surge rim uses the same hex (1759), so jade needs NO `flareMats` dodge (that trick
  exists for dragons whose surgeHi/rim would be off-lane; jade's is already the identity hue).
- **`wingMat`** (silkFinWings returns `wingMat: finMat`, dragonWings.js:1744): the shared tick
  (1590–1605) drives its emissiveIntensity on boost/Surge and swaps emissive to
  `feverWing ?? 0xff44cc` during Surge — see §4.3. `model.wingOpacity` is left unset
  (`finMat.transparent` is false → the opacity damp is a no-op; do not set it).
- **NO `coreGlow`, NO `wingParts`, NO tail chain**: jade publishes none of these (parts.tail
  'none'; the tube + lobe poser own all motion). The −anchor/wrist-fold laws therefore apply
  to NOTHING here — this build adds zero new joints. The mirror law that DOES bind: the baked
  winding+negation mirror in `petalGeo` (§3b) — any new per-side geometry in the wings builder
  must copy that pattern, never a scale.x flip on a lit mesh.

### §4.2 MUST-ADD #1 — `parts.pearlChainMats` (nullable, ~8 lines)

Pickup at dragon.js ~323: `jadeChainMats = result.parts.pearlChainMats || null;` (cleared to
null in the reset block ~616 like `bodyWave`). Tick, appended after the shipped tipGem tick
(1477), inside the `if (bodyWave)` block:
```js
if (jadeChainMats && !player.feverActive) {
  for (const m of jadeChainMats) {
    const b = m.userData.baseIntensity ?? 0.5;
    m.emissiveIntensity = b * (1 + (m.userData.chainPulse ?? 0.3)
      * Math.sin(bodyWave.phase * 0.5 - (m.userData.chainLag ?? 0)));
  }
}
```
Precedent: the shipped jade pearl/tipGem ticks (1468–1477) — same clock, same fever guard.
Null for every other dragon → roster byte-identical.

### §4.3 MUST-ADD #2 — the jade fever firewall (def fields only, zero rig code)

**Engine-truth catch:** the shipped jade def defines NO `feverWing` and NO `feverEye`. The rig
defaults are MAGENTA: `wingMat.emissive → feverWing ?? 0xff44cc` (dragon.js:1595) and
`eyeMat.emissive → feverEye ?? 0xff66ee` (1769) — during Surge the silk fans and eyes drift
hot-pink on a green dragon. Whether that shipped unnoticed or was tolerated, THIS build pins
the family (the §6.2 override-the-whole-fever-palette law): **`feverWing: 0x9ff0c8`**,
**`feverEye: 0xbdf3dc`**, `surgeHi: 0xd6ffe9` (already present), optional
`feverWash: [0.02, 0.06, 0.04]` (faint mint screen wash). `wingMembraneEmissive` stays absent
(falls through to `wingEmissive 0x9ff0c8` — correct). Eyes remain OUT of spineMats (they are
driven at 1769 — by construction). `hideRiderGlow` is NOT set — jade is a bright dragon; the
rider bloom doesn't fight it.

### §4.4 MUST-ADD #3 — `parts.waveRiders` (nullable, ~7 lines; needed by the lyre gems)

Any separate mesh over the rear tube sits STILL while the tail whips ±(amp·ramp) ≈ ±0.8 world
units — an instant severed-appendage read. Publish `parts.waveRiders = [{ obj, baseX, baseY,
spineZ }]`; in the `if (bodyWave)` tick, after the vertex loop, apply the SAME formula (hoist
it — two copies of the wave formula is the trail-detach bug):
```js
if (jadeWaveRiders) for (const r of jadeWaveRiders) {
  const ph = freq * r.spineZ + phase, rp = rampAt(r.spineZ);   // rampAt = the hoisted 0.12+0.88·t
  r.obj.position.x = r.baseX + amp * breathMul * rp * Math.sin(ph);
  r.obj.position.y = r.baseY + ampY * breathMul * rp * Math.sin(ph * 0.9 + 0.4);
}
```
`rampAt(z)` is exported from the torso alongside `bodyWave` (leadZ/lastZ are in scope there).
**Fallback if the owner vetoes a third hook: CUT the lyre gems** (chain = pearl → beads →
dew gems → streamers); the blossom still reads — recorded as an honest substitution, like the
Revenant's per-finger-lag cut.

### §4.5 MUST-ADD #4 — `model.lobeBreath` (nullable, 2 lines) + honest substitutions

The AD's fan-bloom BREATH (the fan opens on the swim crest in CRUISE, not only on boost).
dragon.js:1267 currently: `const flareOpen = (boost01*0.55 + surge01*0.85) * (m.lobeFlareBoost
?? 1);` → append `+ (m.lobeBreath ?? 0) * (0.5 + 0.5 * Math.sin((bodyWave ? bodyWave.phase :
time * 2) * 0.5));` — `bodyWave` is module-scope in dragon.js and in scope here, so the breath
is genuinely WAVE-LOCKED (opens with the swim crest, the same clock as the pearl-chain: the fan
blooms as the light arrives — one organism). Default 0 → every non-jade dragon byte-identical.

**Honest substitutions (v0 ideas with no clean path — recorded, not hidden):**
- *Whisker-tip chain link* → CUT. Whiskers use the shared `scalesMat` inside the head builder,
  which publishes no per-mesh mats; plumbing a mat out of `dragonDraconicHead.js` is rig
  surgery for a sub-3px component. The pearl's satellite bead pair (already adjacent to the
  whiskers) carries link 1.
- *"Lyre RIM" ignition* → substituted by the discrete lyre GEMS. The fan lives in the
  single-material body tube (§3a); a per-region emissive pulse on it would need a shader patch
  or the banned material array. Components-over-strips is also the LAW (§6.3) — gems are the
  better read anyway.
- *Crest ribbon via `coreGlow`* (the task's suggestion) → REJECTED by the locked AD: the
  ribbon is diffuse value only (law 12; LED-strip tell #3/#9). Jade publishes no coreGlow and
  gains none.

## §5 The forms[] ladder — 3 forms (starter cap), the BLOSSOMING verb

Form names: **f0 Riverling · f1 Kindled Current · f2 Grand Fan-Bloom.** Growth verb:
**BLOSSOMING** — the fan opens, the ribbon brightens, the light learns to travel. Every rung
is a cruise-visible category add (never same-dragon-bigger); all shipped f0/f1/f2 dials not
listed stay EXACTLY as in dragons.js today.

| dial | f0 Riverling | f1 Kindled Current | f2 Grand Fan-Bloom | assert |
|---|---|---|---|---|
| read | chubby river-pup, pearl bead, plain smooth tail | lobes ray, lyre buds, a pale dorsal line appears | the blossomed fan, full ribbon, pearl-light travelling | — |
| `caudalBloom` | 0 (shipped moonTail 0.15 nub) | 0.35 (the bud — split barely dimples) | 1.0 (the grand split fan) | monotonic ↑ |
| `crestRibbon` | 0.2 (a faint nape hint) | 0.55 | 1.0 | monotonic ↑ |
| `lobeBreath` | 0 | 0.05 | 0.12 | monotonic ↑ |
| `bodyArcY` | 0.14 (shipped) | 0.16 | 0.19 | monotonic ↑ |
| `bodyWaveAmpY` | (default 0.16) | 0.18 | 0.24 | monotonic ↑ |
| `lyreGems` / `streamerPulse` | 0 / 0 | 0 / 0 | 1 / 1 (with `tipGems 1`, `streamerCount 3` — the coronation) | apex-gated |
| chain links active | pearl bead (no tick — pearlStage 0) | pearl held (stage 1; still no published pearlMat — shipped) | full 5-link chain | count ↑ {1,1,5} |
| pearlStage / rayRelief / moonTail / streamerLen | 0 / 0 / 0.15 / 0 (shipped) | 1 / 0.5 / 0.55 / 0 (shipped) | 2 / 1.0 / 1.0 / 9.5 (shipped) | shipped asserts hold |
| tri target | ~2,510 (byte-identical) | ~4,450 | ~5,400 | monotonic ↑, ±15%, <6000 |

Ladder discipline: f0 is BYTE-IDENTICAL to shipped except the 0.2 ribbon hint (vertex colours
only — a deliberate, asserted delta); dew gems + lyre gems + streamers + the travelling chain
remain the apex coronation (the AD's "the select-card apex is unmistakably the blossomed
form"); no signal inverts (f2 is the deepest-value body — shipped — AND the brightest accents:
both monotonic).

## §6 Tri budget + overdraw census

**Tris (tricount ground truth this session: jade 2510 / 4230 / 5152 OK):**

| form | shipped | Δ this sheet | target | ceiling |
|---|---|---|---|---|
| f0 | 2,510 | +0 (paint only) | ~2,510 | <6000 ✔ |
| f1 | 4,230 | +216 (caudal fan resample) | ~4,450 | <6000 ✔ |
| f2 | 5,152 | +216 (fan) +16 (lyre gems) ≈ +232 | ~5,400 | <6000 ✔ (headroom ~600 kept for gate fixes — under the AD's ≤700 spend) |

**Overdraw census (counted, not vibes):** dragon-owned transparent drawables = **0**. Every
fin, streamer, gem, bead, and the pearl is OPAQUE (`finMat`/`finMatRear` are opaque by shipped
design; fresnel rims are shader terms on opaque mats; all glow is opaque-emissive — **nothing
additive, no shells, no sprites**). Scene FX: the trail (1 transparent) + the rider glow
sprite (1, kept). Total along any chase ray ≤2 alpha layers, total transparent drawables ≤3
— comfortably under the ≤6 gate. The koiSerpent CPU wave touches ~(24·13 + fan ~100) ≈ 420
verts/frame — measured trivial (shipped comment, dragonKoiSerpent.js:208) and unchanged in
kind; the two new ticks are O(3 mats) and O(2 riders).

## §7 dragons.js — the concrete `jade` def patch

Only the lines shown change/append; everything else in the shipped block (stats, parts, head
dials, lobe dials, colors ramps, fx, eye fields, top-level palette) stays verbatim. The
undulation stays LATERAL (`bodyWaveAmp` untouched).

```js
jade: {
  // ... name/title/rarity/maxRarity/cost/accentHue/stats/parts UNCHANGED ...
  model: {
    // ... every shipped dial unchanged (bodyGirth, bodyRadial, bodyWaveAmp 0.8,
    //     bodyWaveFreq 1.0, bodyWaveSpeed 3.2, lobe*, head*, finGlow 0.6,
    //     finRimColor 0xbdf5d0, spineGlow 0.3, flapBias 1.05, flapAmp 0.7 ...) ...
    bodyArcY: 0.14,                    // f0 base (ladders 0.14→0.16→0.19 below)
    crestColor: 0xbdf5d0,              // P4 — the dorsal crest ribbon paint (diffuse only)
    // NEW nullable dials (builder defaults 0 — absent = shipped geometry byte-identical)
    // caudalBloom / crestRibbon / lobeBreath / lyreGems / streamerPulse ladder per-form.
  },
  forms: [
    // f0 Riverling — shipped block UNCHANGED except:
    { /* ...all shipped f0 dials... */ crestRibbon: 0.2 },
    // f1 Kindled Current — shipped block UNCHANGED plus:
    { /* ...all shipped f1 dials... */ crestRibbon: 0.55, caudalBloom: 0.35,
      lobeBreath: 0.05, bodyArcY: 0.16, bodyWaveAmpY: 0.18 },
    // f2 Grand Fan-Bloom — shipped apex block UNCHANGED plus:
    { /* ...all shipped f2 dials (rayRelief 1, moonTail 1, tipGems 1, lobeFlareBoost 1.25,
         bodyWaveAmp 0.9, waveBreath 0.12, streamerCount 3, pearlStage 2, spineGlow 0.3)... */
      crestRibbon: 1.0, caudalBloom: 1.0, lobeBreath: 0.12,
      bodyArcY: 0.19, bodyWaveAmpY: 0.24, lyreGems: 1, streamerPulse: 1 },
  ],
  // ── THE FEVER FIREWALL (§4.3 — new def fields; the rig defaults are magenta) ──
  feverWing: 0x9ff0c8,    // Surge fans blaze pale-jade, never 0xff44cc pink (dragon.js:1595)
  feverEye: 0xbdf3dc,     // Surge eyes stay mint, never 0xff66ee (dragon.js:1769)
  feverWash: [0.02, 0.06, 0.04],
  // surgeHi 0xd6ffe9 already shipped — the spineMats flare + Surge rim stay in-lane.
  // ... trail/boostTrail/eye/top-level palette UNCHANGED ...
},
```

## §8 Verification — gates, numeric pixel targets, residuals

Run from `reforged/` per failure class (DRAGON-DESIGN §9), full battery at the final increment:

1. **Budget:** `node tools/tricount.mjs` — jade {~2510, ~4450, ~5400} ±15%, monotonic, <6000;
   FULL roster unchanged elsewhere (the coexist proof).
2. **Integrity/runtime:** `node tests/run-all.mjs` (blueprint: parts resolve, no NaN — the fan
   resample's lerped stations are the NaN risk spot) + `tests/smoke.mjs` headless flight.
3. **Byte-identity of the roster + jade f0 geometry:** build every non-jade dragon and jade
   with the new dials ABSENT → positions buffers hash-equal to pre-branch (the nullable-dial
   contract), jade f0 equal except the colour attribute (the asserted ribbon hint).
4. **Symmetry:** `node tools/wingsymprobe.mjs jade` Δ0.000 across all 5 poses (the baked
   winding mirror + the new lyre gems' ± pair).
5. **Silhouette:** `node tools/silhouette.mjs jade rear|side|top [form]` + `tools/_sildiff.mjs`
   — pectoral-fan rear IoU ≥99% vs shipped (carve-inward law); the CAUDAL zone is the
   sanctioned hero growth — report its delta (expect rear-fill area +8–14% at apex), owner
   judges on the PR. Rear black-fill tip count ≥10 (8 pectoral notch-prongs + ≥2 caudal
   blades visible); each caudal prong ≥8px at the 250px chase normalization (the anti-mitten
   floor); the split notch cusp ≈⅓ prong depth.
6. **Accent/glow law:** `node tools/seamprobe.mjs` — cruise: pearl is the top contributor,
   accent family 149°±20°; Surge (with the §4.3 fields): every fever-state emissive hue in
   the mint band, ZERO magenta (assert the def fields exist — the firewall's regression
   trap). Re-run the starters one-bloom-by-contribution assert with `bodyWave.phase` PINNED
   at each chain link's peak (5 pins: θ = lag_i + π/2).
7. **Motion:** `node tools/flapstrip.mjs jade` (5-phase lobe poses) + a named-pivot amplitude
   capture: per-lobe furl rotation ± ranges over ≥120 frames (the inboard→outboard lag table
   proves the fan wave travels), tube x-displacement sampled at 5 stations (±0 at head →
   ±~0.8 at tail — ranges, never point samples, no DC droop), lyre-gem world-x vs adjacent
   fan-edge vertex Δ ≤0.02 over a full wave cycle (the waveRiders detach probe), and the
   `lobeBreath` open/close ±rad table locked to the wave clock.
8. **Ladder/shop:** `node tools/tiershots.mjs jade` — rung-over-rung: ribbon hint → line →
   full; tail nub → bud → blossom; card-scale apex unmistakable. `node tools/gameshots.mjs`
   + `_surgeshot.mjs` for the rear-chase money frame.
9. **Numeric pixel targets (rear-chase, 250px normalization, brightest biome + pale backdrop):**
   - dorsal ribbon line: 2–5px wide, L ≥ 200 (8-bit) over dorsal body L ≤ 140 — present along
     ≥80% of the visible spine, terminating INTO the fan (never mid-back);
   - caudal bloom: fan width ≥ 0.55× the pectoral fan-V width at apex; ≥6px of pale edge-row
     visible per blade;
   - streamers: ≥2px wide along ≥70% of their length (thin-thread tell #11);
   - pearl-chain: each link ≥3px; per-frame brightness ordering pearl ≥ any link at that
     link's own peak; the travel reads across ≥3 consecutive captures (θ steps of 0.45);
   - crest-ribbon toy-check: ribbon ≤10% of dorsal pixels (slim edge, not a racing stripe).
10. **starters.mjs jade block extensions:** shipped asserts hold (head:body bands, lobe count
    {3,3,4}, notch ≥0.3, jade carrier L∈[0.24,0.55], motif drift ≤0.15) + NEW monotonics:
    `crestRibbon {0.2,0.55,1.0}` · `caudalBloom {0,0.35,1.0}` · `lobeBreath` ↑ · `bodyArcY` ↑
    · chain-link count {1,1,5} · fan blade count {0-nub,3,3} with prong count {—,2·3? bud
    dimple exempt, 6} at apex · tri ladder ↑ · fever fields present.

**Cheap-tell registry sweep (all 12, said at the render):** 1 flat tape — fan blades are
2-quad ribbed wedges with carved webs, streamers are the shipped 4-vert folded band; 2 picket
fence — lobes [0.9,1.0,0.85,0.7], fan blades dominant-pair + 0.72 median, 3 rays each; 3 LED
strip — ribbon is DIFFUSE, glow is 5 discrete components; 4 chrome outline — rim only on the
rear carrier lobe + streamers (shipped per-surface split); 5 onion rings — zero additive
meshes; 6 white smear — only the pearl is near-white, ≤0.55·1.14 intensity; 7 washed fringe —
no additive fringes exist; 8 metronome — chain/breath ride the speed-eased accumulating wave
phase, boost quickens it organically; 9 on-body arcs — none; 10 sparkle-as-line — the
travelling light is a phase SEQUENCE on rooted components + a continuous ribbon (streamer),
not specks; 11 thin thread — streamer width floor asserted, tail girth carried by the fan;
12 flat sails — petal value tiers + ray banding + the fan's root→web→crest→edge bands.

**Gate process:** one harsh Fable critic per increment (I1 torso fan+ribbon → I2 wings
chain/streamers → I3 dials+ladder+tests), judged on real rear-chase + tiershot captures
against THIS sheet at ≥4.2, one revise round each; builder never judges its own output. The
PR preview carries the human-only residuals: the breath's feel (0.12 too sleepy/too eager —
one dial), chain travel speed (the shared 0.5 clock multiplier), ribbon width taste on the
brightest biome, caudal-fan silhouette growth approval (the sanctioned delta), Surge mint
check in-game.

## SETTLED (do not re-litigate)

- The undulation is LATERAL (side-to-side), 0 at head → full at tail — already correct
  in-engine; the elevation touches only the VERTICAL share (`bodyArcY`/`bodyWaveAmpY`).
- The fan-bloom lives INSIDE the single-material body tube (moonTail pattern) — never a
  separate tail mesh (parts.tail stays 'none'), never a second material group (the dispose
  crash), all fan verts emitted before the wave arrays snapshot.
- The crest ribbon is DIFFUSE vertex paint — no emissive, no coreGlow, no new drawables.
- The pearl stays the ONE bloom; the chain is phase-lagged components, apex-gated, skipped
  during Surge; all new emissive mats are opaque and join spineMats.
- Law 12 intact: no glowSeams, no veins, spineGlow ≤0.32, 3 forms, no forms[3].
- The fever firewall fields ship WITH this change (magenta defaults are live in the rig).

## CHANGELOG

- **v1 (this sheet).** Reverse-engineered from the locked North-Star cutout + JADE-AAA-
  ARTDIRECTION into an evolve-in-place contract on the shipped `koiSerpent`/`silkFinWings`
  builders: THE GRAND FAN-BLOOM as a `caudalBloom` in-tube 3-blade split fan (M=16 resampled
  stations, 2-quad ribbed blades, carve-inward flutes, +216 tris), the `crestRibbon` diffuse
  seafoam dorsal paint, the 5-link pearl-chain on a nullable `pearlChainMats` walk + the
  `waveRiders` anti-detach hook, the wave-locked `lobeBreath` cruise bloom, and the jade
  fever firewall (`feverWing`/`feverEye` — the rig's magenta defaults were live). Honest
  substitutions: whisker-tip link cut (satellite beads carry it), lyre-rim ignition → discrete
  lyre gems, coreGlow ribbon rejected per law 12. Budgets: 2510/~4450/~5400 tris, 0 dragon-owned
  transparent drawables.
