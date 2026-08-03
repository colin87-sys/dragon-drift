# TEMPEST REACH — COMPOSITION BUILD SHEET (Biome 7 correction)

> **Hand this to a fresh chat.** It is self-contained: the diagnosis, the composition rubric, the one new
> archetype (`scarpwall`), the exact placement/density edits, the build order, the engine laws with exact
> line references into the live code, the capture recipes, the numeric pre-gates, and the Fable-gate
> process. Build straight from it. The repo clones fresh in a new session — everything you need is
> committed. All line numbers below were verified against `reforged/js/environment.js` /
> `reforged/js/biomes.js` at the time this sheet was written; if a number has drifted, the cited
> identifier is the anchor — grep it.

**North star (the ONLY score that matters):** *"absolutely beautiful and jaw-dropping when a player flies
through."* The owner outranks every gate. Tempest Reach already has a premium SKY — the job of this sheet
is to give it a premium STAGE. Current honest composition score: **3/5 — "a premium sky over an
unfinished stage."** Target: the biome's best current frame becomes its AVERAGE frame.

**One-line soul:** *the land the storm is eating* — a violent dusk sea where wind-carved slate headlands
shoulder out of the chop on one flank, punctuation stacks answer on the other, and the torn bright
EYE-BREACH in the storm deck stays the one place the eye rests.

---

## 0. READ FIRST (before any code)

1. `LEAPFROG.md` + skim `leapfrog/lessons/` newest-first. **After every meaningful change add a NEW
   lesson file** `leapfrog/lessons/<YYYY-MM-DD>-graphics-tempest-<slug>.md` (one file per lesson — never
   append to the ledger).
2. `reforged/BIOME-DESIGN.md` (biome identity system), `reforged/GRAPHICS-OVERHAUL.md` (Fable
   Quality-Gate protocol + value-structure law), `reforged/TEMPEST-REACH-BIBLE.md` (the biome's frozen
   art direction — §3 composition laws, §4 roster, §7 anti-replication checklist).
3. **The Drowned Forum composition lessons are your direct ancestors — they save you rounds:**
   - `leapfrog/lessons/2026-07-17-graphics-forum-pr3-scale-hierarchy.md` — a prop gated in isolation can
     still be the wrong SIZE in the composition; the no-hero MIXED-SCENE capture law; bump `h`, keep `r`
     sub-proportional.
   - `leapfrog/lessons/2026-07-18-graphics-forum-two-shelf-repoussoir.md` — size-scale never moves x
     (`writeMatrix`); object z is scaled by r (a "thin" jamb becomes a deep tunnel); dark-face gates must
     be measured NEAR (fog inscatter lifts the far read — that's aerial perspective working);
     `tools/_lumprobe.mjs` numeric pre-gating.
   - `leapfrog/lessons/2026-07-18-graphics-forum-basilica-flatness-cure.md` — the cardboard-cutout cure:
     silhouette-EDGE thickness (end caps, step returns, deep top caps), the tell-migration discipline,
     the Y-keyed-bake coordinate-space trap.
   - `leapfrog/lessons/2026-07-17-graphics-forum-pr4-pinisle-lorrain-frame.md` — the dark-mass-under-a-
     bright-key law: **darken AND widen** the value spread, or you get either a lifted gray mass or
     flat-black poverty.
   - `leapfrog/lessons/2026-07-17-tempest-arch-and-aspect-lean-law.md` + the `buildStormprow(SKEW)`
     comment block (`environment.js:1140–1146`) — the ASPECT-LEAN LAW: world lean of a baked skew is
     `atan(k·r/h)`; one SKEW across a wide aspect band topples the squat and flattens the tall.
4. The live code: `reforged/js/environment.js` (Tempest archetypes ~3219–3477, materials/bakes 346–626,
   composition engine 4475–4930), `reforged/js/biomes.js` (`BIOMES[7]` ~328–414), `reforged/js/config.js`
   (lane geometry).

**Working directory:** everything runs from `/home/user/dragon-drift/reforged`. **Bash cwd resets every
call** — prefix commands with `cd /home/user/dragon-drift/reforged && …`.

---

## 1. THE DIAGNOSIS (what a 6-frame in-flight sweep showed)

A follow-cam dist sweep across congregation + breath windows of biome 7 (six frames, ~2s apart) was
scored against the rubric in §2. The frames themselves live in a session scratchpad and will NOT survive
to your session — **re-capture your own baseline sweep first (§9 Recipe B) and confirm the diagnosis
still holds before building.** What the sweep showed:

**Already WON — do not touch (this session's atmosphere work):**
- The **eye-breach** (the torn bright slot in the storm deck on the sun azimuth) reads as the value
  extreme in every frame, with soft "negative-of-the-clouds" god-ray fans. It is the focal. Leave it.
- The bruised-purple storm deck, virga, lightning, rain streaks, the wind-combed chop + gold sun-lane,
  and the **aerial perspective on distant props** (fog-lifted spires behind the arch) all land.
- The **stormarch** is doing real Lorrain work — in two of six frames it brackets the breach perfectly
  (arch-frames-the-light is the biome's best image). Keep it exactly as rare as it is (step 620).
- The **near stormprow rail + tafonihold gold sockets** compose beautifully WHEN the camera happens to be
  beside them: the best frame of the sweep had a dark near repoussoir flank with pooled gold, a framed
  bright slot, and fog-stratified depth. **That frame is the target average.**

**The failures (frame evidence in parentheses):**
1. **The picket fence — the defining failure.** One frame's left flank was four near-identical pale-gray
   verticals at even spacing and even value: uniform mid-scale spires with no dominant mass. Thumb test:
   cover the small props and the flank is still just a picket; there is no mass whose covering collapses
   the frame.
2. **Screen-area unimodal histogram — the root cause.** Every mid/far Tempest archetype is a VERTICAL:
   `stormprowHero` h22–30 r8–11, `stormprowFar` h24–46 r12–22, `stormstack` h22–56 r4–9
   (`environment.js:3252–3355`). Heights vary (good) but everything tall is THIN — the size histogram
   that matters is **screen AREA (height × length), not height**, and on area the roster is all sticks.
   Tempest has a near rail, punctuation, and a backdrop veil, but **no mid-ground MASS register at
   all** — the exact hole the Forum had before `basilica` landed (see the Forum sheet's ⚠ REORDER ruling:
   *clutter = many props at ONE scale with no mass to be subordinate to*).
3. **Debris sprinkle.** Small `stackgrave`/wrack chunks pepper the open water evenly at ONE scale between
   the near rail and the horizon (three of six frames) — pooled at nothing, subordinate to nothing.
4. **The dead breath.** The emptiest frame was open water + ~10 identical scattered chunks: absence with
   noise, not composed rest.
5. **The dice roll.** Two frames composed (camera beside a near wall), two fell apart. Whether a window
   composes is currently an accident of where the camera sits relative to the low rail — nothing
   GUARANTEES each congregation an anchoring mass.
6. **Focal rivals (GAMEPLAY-OWNED — flag, don't fix unilaterally, §5.3).** The flat yellow pickup quads
   sit in the breach's value band and rival the focal in two frames; in one frame a solid black gate
   hazard beam bars the focal slot horizontally.

**Register scores:** background 4.5/5 · foreground 3.5/5 · **mid-ground MASS 1.5/5** · focal 4/5 ·
Lorrain framing 3/5 · breaths 2/5 · prop value structure 2.5/5 · **overall 3/5.**

**The verdict: a NEW archetype (`scarpwall`, §4) + one placement PR (§5).** Not a rescale — the height
ladder already spans 7→56 and `stormprowFar` (r to 22) proves girth alone doesn't make a mass when it
spawns as independent verticals. Not placement-only — you cannot pool density around a mass that doesn't
exist. Skeleton before density: build the mass first, tune density relative to it after.

> Note: the bible's §4 `arcuswall` is a different, DEFERRED thing — an atmospheric shelf-CLOUD massif,
> demoted to a future sky-shader pass (`environment.js:3388–3393`). `scarpwall` is a ROCK massif and does
> not revive `arcuswall`. Do not confuse them.

---

## 2. THE COMPOSITION RUBRIC (the standing gate — every capture is judged against this)

1. **Three size registers.** FOREGROUND (small near detail) / MID-GROUND (the dominant framing MASS the
   eye sits against) / BACKGROUND (the far horizon element under atmosphere).
2. **The clutter law.** Clutter is NOT prop count — it is NO HIERARCHY. Many props at one scale with no
   mass to be subordinate to = noise. The cure is a dominant mass, never fewer props.
3. **The register ratio.** The mid mass reads ~2.5–3× the near props and subtends more of the frame than
   the far band. Failure signature: a unimodal size histogram — **measured in SCREEN AREA, not height**
   (ten tall thin pillars are still unimodal).
4. **Density follows framing.** Props pool at the big masses and thin to composed REST in the breaths
   (a breath still has a floor + a far anchor). Even sprinkle = clutter; dead-empty = absence.
5. **Value structure.** Every hero element: dark core → sun-caught rim → anchored foot. Darken AND widen
   the spread — dark alone is a vinyl sticker; a flat slab of one value is cheap at any silhouette.
6. **The Lorrain frame.** Big dark mass ONE flank (repoussoir), punctuation the OTHER, a bright focal
   slot up the center, a horizon piece far. Asymmetry is strength; both-flanks walls are a corridor, not
   a composition.
7. **Focal = value extreme.** One resting place for the eye, brightest thing in frame, nothing else in
   its value band; leading lines (sun-lane, god-rays, receding ranks) converge on it; negative space
   around it lets it breathe.
8. **Repetition-with-decay.** Serial elements receding + progressively breaking = depth + story; aerial
   perspective stratifies them for free.
9. **Silhouette reading.** Identity must state itself as a black shape against sky; thickness must
   register on the silhouette EDGES (end caps, step returns — the cardboard-cutout law).
10. **The thumb test.** Cover the small props → the frame must still compose. Cover the big mass → it
    must fall apart. If covering the big mass changes nothing, you don't have one.

---

## 3. THE CURRENT TEMPEST ROSTER (ground truth — cite, don't re-derive)

All in `environment.js`, whitelisted via `biomes: tempestNew` (the seam: `1133–1138`; `tempestNew =
PROPS_V1 ? [] : [7]` — the whitelist IS the spawn gate; `BIOMES[7].props` at `biomes.js:410` is
doc-only). Materials: `mats.tempestStone` (line 346, wind-scour value ladder — pale `_TMP_SCOUR`
#aab6bc crests, lines 524–553) + `accent[7]` gold via `mergeTempestParts` (564–575, mat 0 = ladder,
mat 1 = accent). `buildStormprow(SKEW)` shared builder: 1146.

| Archetype | Lines | Role | step | comp.floor | place() essentials |
|---|---|---|---|---|---|
| `stormprow` | 3233–3246 | near-rail low hogback wall | 22 | 0.04 | r 8–14, h 7–13, x = side·(18+0.72r+rnd·3), mirrored rotY |
| `stormprowHero` | 3252–3258 | sparse tall rail break | 68 | 0.02 | r 8–11, h 22–30, x = side·(15+1.3r+rnd·3) |
| `stormprowFar` | 3271–3275 | far second rank | 36 | 0.22 | r 12–22, h 24–46, x = side·(34+0.90r+rnd·10) |
| `tafonihold` | 3285–3307 | THE gold-glow carrier | 60 | 0.0 | r 8–12, h 9–12, x = side·(16+0.84r+rnd·4), rotY 0 |
| `stormstack` | 3314–3355 | tall punctuation hero | 95 | 0.0 | r 4–9, h 22–36 / 42–56 (33%), x = side·(30+0.68r+rnd·6) |
| `stackgrave` | 3361–3387 | low rest / foil | 32 | **0.20 → §5** | broad low stump platform |
| `rainshaft` | 3400–3419 | far virga veil (opaque pale) | 29 | 0.50 | far-field, narrow |
| `wrackline` | 3427–3437 | FAIRNESS surf ribbon | 11 | (no comp — never parks) | inner ~13.5–14, h 1.2–2.0 |
| `stormarch` | 3448–3477 | rare paired framing arch | 620 | — | paired, overhead-audited (unitY 0.90, minWorldY 21) |

Composition engine: `tempestComp(dist, side)` — 4 periods/biome, seg 375 m, per-side phase shift 0.42
(banks SWAY, congregations alternate flanks), raised-cosine SQUARED → wide genuinely-empty breaths
(`4475–4491`). The `bi === 7` branch (`4903–4922`): arrivalPark opens the seam (<200 m), then
`density = floor + (1−floor)·g`, `compHash` parks off-beat slots, survivors swell `sMin→sMax`.
**Important asymmetry: the two banks NEVER share a peak** — left (side<0, shift 0) peaks at
`seg·(n+0.18)`, right (side>0, shift 0.42) at `seg·(n+0.60)`; congregations interleave L,R,L,R at
~157/218 m spacing. Any per-peak logic must lock to a SIDE's peak, never to a shared "peak center"
(§4.6). Precedents you will reuse: the Frozen hero phase-lock + its FIXED `slotJit`
(`~4374–4376`, `~4753–4759`), the Lagoon `oneSide` per-peak duty pick (`~4795–4801`, `heroHash`).
FOAM_CFG tempest entries: 3776–3784. **The last archetype in `ARCHETYPES` is `basilica` (3609); the
object closes at 3721 — `scarpwall` is appended AFTER `basilica`, immediately before the closing
brace.** The rotY-init determinism line: `eul.set(0, d.rotY ?? (d.rotY = rnd()*Math.PI), d.tilt)`
(~4740) — returning `rotY` from `place()` skips that `rnd()`, which only affects your new prop's own
stream (fine). `writeMatrix` composes the `(r,h,r)` instance scale at ~4938 (grep `sclV.set(d.r * k`).

---

## 4. PR-A — `scarpwall`: the storm headland massif (the Tempest basilica)

### 4.1 Identity + the ONE silhouette tell
**The land the storm is EATING** — a wave-cut headland: a long dip-slope back rising down-wind to a
sheer seaward SCARP cliff, broken ONCE by a collapse-bay notch where the sea has bitten through.
**The tell: one long rising diagonal skyline ending in a sheer scarp face, broken once.** It is the
`stormprow` diagonal promoted to massif scale — same down-wind lean family, same skewed strata — so the
coastline reads as one geology. It must pass the black-shape name test ("a storm headland") against the
pale horizon band, and it must NOT be nameable as `glacierwall` or `basilica` (the bible §7
anti-replication row): storm-slate values, a RISING broken diagonal skyline (never a level parapet),
no windows, no white.

### 4.2 Proportions + the (r,h,r) flatten-law math
Model on `basilica` (`environment.js:3609–3660`) — design in WORLD units ÷ a nominal, exactly as it
does (`R_NOM`, `wx()`, `wy()`).

- **World targets:** length **84–110**, height **25–35**; masonry faces **~1.7–2.2 world** thick,
  with deep cap/end returns to **~4.6–6.0 world**.
- **Nominals:** `R_NOM = 40`, `H_NOM = 30`. Object X spans ±1.0 → world length = 2r.
- **`place()` draws:** `r = 42 + rnd()*13` (42–55 → length 84–110); **couple `h = 0.62·r ·
  (0.97+0.06·rnd())`** (→ h ≈ 25–35, matching the world target — NO clamp; a `Math.max` floor would
  pin h flat across half the r-range and kill the coupling). Aspect is this prop's identity —
  protect it from independent r/h draws (the aqueduct a1 law, restated at pinisle).
- **THE FLATTEN LAW:** the instance scale is `(r, h, r)` — `writeMatrix` composes
  `sclV.set(d.r·k, d.h·k·…, d.r·k)` (~4938; grep `sclV.set(d.r * k`). With h/r ≈ 0.62, object-space
  vertical features read ~0.62× their object proportion relative to length — **author the scarp face
  and the skyline rise STEEPER than the world read you want** (the rampart lesson: an object pier
  must be ~2× as tall as it should read; here the h/r coupling is fixed, so steepen in object space
  and verify on the broadside capture, never trust the object numbers).
- **Z-THICKNESS TRAP:** object z is multiplied by r — audit EVERY z offset in world units (× r)
  before trusting it (the two-shelf lesson's welded-shut-bays bug). `zf/zb = ±0.02` faces at r 42–55
  = `0.04·r` ≈ **1.7–2.2 world** masonry (basilica ships ±0.017 + a deep back plane at `zf−0.10`).
  Use `zf = ±0.02` faces + a deep back plane `zTop = zf − 0.09` → `0.11·r` ≈ **4.6–6.0 world** where
  the caps/ends/returns land.

### 4.3 Build technique (the cheap-tell insurance, budgeted from I1 — not discovered in round 2)
- **Skewed strata, lean by lateral OFFSET, never internal rotation** — the `(r,h,r)` scale shears
  internal tilts flat (`stormprow` law, 3222–3226). The dip-slope rise and the down-wind lean are
  both carried by per-stratum X offsets — but **borrow only `buildStormprow`'s offset-lean PATTERN,
  never its boxes**: stacked `BoxGeometry` strata cost 12 tris each (~120+ for a wall — blows the
  cap). Author raw quads with the basilica kit idiom (`wallF`/`capF`/side-return/`q()`,
  3617–3660) and carry the lean in the quad corner offsets; then 110–130 tris is comfortable.
- **Silhouette-edge thickness from day one** (the basilica flatness cure, all four moves): (a) top
  caps span `zf → zTop` (deep, not a sheet); (b) a full-height END-CAP cross-section on the tall scarp
  end; (c) a shear-return section at the collapse notch (a headland showing its bitten section IS the
  storm story); (d) vertical step-returns at each skyline break; (e) z-jitter strata faces ±0.01 so no
  single coplanar sheet survives. Non-indexed quads → flat facet normals → two-tone lit corners = the
  read of mass, free.
- **The notch** is a NEGATIVE — a bay bitten out of the wall (sky through it near the top is fine and
  Lorrain-useful) — not a window. No round arches (that's Forum grammar).
- **Tris: ≤150 hard, target 110–130.** Front face ~12–16 quads + notch reveals + caps/returns.
  Basilica proved a richer wall in 146; a solid scarp is cheaper. Deepen existing geometry before
  spending quads (the jambW trick — a deepened plane is free, a new quad is not).

### 4.4 Value structure (repoussoir under a storm key)
- **mat 0 ONLY** (`tempestStone` wind-scour ladder via `mergeTempestParts`). **NO mat 1, NO gold, NO
  emissive accent** — gold stays rationed to `tafonihold` (the ≤10% stolen-light law,
  `biomes.js:324–327`). The massif's job is to be the DARK the breach is bright against.
- **Pre-darkened + widened bake** (the pinisle law): add a `scarp` bake variant of the wind-scour
  ladder — body/belly stops at ~⅓–½ the stormprow albedo, but KEEP the pale `_TMP_SCOUR` crest stops
  on up-facing/skyline strata (the sun-caught rim, free from the existing dot-keyed ladder,
  524–553). **PLUMBING (part of PR-A):** `mergeTempestParts(parts)` (~564–575) takes NO opts and
  hardcodes the one ladder bake — unlike `mergeLagoonParts(parts, opts)` — so PR-A must extend it
  with per-part bake tags/opts before a `scarp` variant can exist. And the Y-keyed-bake
  coordinate-space trap is live here: the ladder's soaked wet band keys on unit `yc ≤ 0.24` (~545) =
  **~7–8 world on a 30-tall wall** — parametrize the band per archetype, don't inherit the
  small-prop default.
- **Numeric targets (gated in §6):** near-read face L ≤ 0.38 · skyline crest rim ≥ 0.50 · the foot
  anchored by the `wrackline` surf ribbon (which never parks — it is the fairness layer AND the
  massif's bright waterline thread). Remember: measure the dark face NEAR — at distance, fog
  inscatter lifts it and that lift IS aerial perspective (two-shelf lesson). Expect the far read
  ~0.45–0.55: correct, don't fight it.

### 4.5 Placement, clearance, foam
- **`place()`:** `x = side·(20 + 0.28·r + rnd()·4)` → |x| ≈ 32–39 at r 42–55. **rotY side-pinned lane-parallel,
  basilica idiom:** `rotY = (side>0 ? -Math.PI/2 : Math.PI/2) + side·rnd()·0.08` — the +z scarp face
  always turns to the lane; the sheared/broken end falls away down-lane. `tilt = side·(−0.02 −
  rnd()·0.02)` (lean AWAY from the lane, small — the visible lean lives in the strata offsets; ALWAYS
  numeric, a missing tilt → NaN quaternion → invisible, the stormprow gotcha at 3242–3244).
- **Clearance — THE TOOL AMENDMENT (ships IN PR-A; without it §8 can never go green):**
  `propClearanceData` (`environment.js:3858`) measures facing ρ as the max object **XZ radial**
  extent, and `propclearance.mjs` picks facing per-flag (`line 52`: `gate → apertureHalf`,
  `overhead → rhoLane`, `paired → xMax`, else the symmetric `rho`). A ±1.0-object-x lane-parallel
  wall therefore reports ρ ≈ 1.0 → inner = |x| − 1.0·r ≈ 30 − (42…55) ≈ **negative**, and biome 7
  IS CI-enforced (`SCOPE_BIOME = [2, 3, 4, 7]`, `propclearance.mjs:40`, hard `process.exit(1)`).
  **Fix as part of PR-A, mirroring the existing paired/overhead amendments:** add
  `lanePinned: true` on `scarpwall`, track `zMax` (max object |z|) in `propClearanceData`, and
  extend the facing chain with `a.lanePinned ? a.zMax : …`. Then facing ≈ 0.12 (zf 0.02 + the 0.09
  back plane + jitter) → inner ≈ |x| − 0.12·r ≈ **23–37 ✓** against the 14.5 floor / ±16 veil.
  (Do NOT lean on basilica as a clearance precedent: it is biome 0 — NOT in `SCOPE_BIOME` — and its
  headless whitelist is empty, so it prints no row at all. `scarpwall` is the first lane-pinned wall
  the tool actually enforces.)
- **Foam:** `envcount` FAILS any archetype missing from `FOAM_CFG` (~3922) — add
  **`scarpwall: false,`** to `FOAM_CFG` beside `stormprowFar` (~3778) (the stormprowFar/riftwall
  no-collar precedent, 3264–3266: a collar 28+ off-lane is a bright artifact; `wrackline` provides
  the surf foot). If the Stage-2 gate says the foot reads "floated," add a thin elliptical weld —
  **foam `rx`/`rz` track the prop's OWN object axes** (orientation-dependent: cf. `viamarina`
  `{ rx: 0.30, rz: 1.0 }` at 3768, whose long axis is object z), so a scarpwall weld with its
  length in object X is `{ rx: 1.0, rz: ~0.25 }` — gate decision, not a default.
- **Register ratio check — audit RENDERED tops, not `place()` h** (`envcount` prints world top =
  h·yMax per prop): the near `stormprow` rail renders tops ≈ 0.90·h ≈ **6–12 world**, so scarpwall
  h 25–35 gives a real ratio ~**2.2–5× (mean ≈ 3×)** over the near register; screen area (84–110
  long × ~30 tall) dwarfs every pillar; and the skyline stays UNDER the breach slot (the sky band
  above ~35 world stays the focal's — `stormstack` big class h 42–56 remains the only piercer, as
  punctuation on the OTHER flank).

### 4.6 Composition flags + the phase-lock (every congregation gets exactly ONE massif flank)
- **Archetype fields:** `step: 170` (coprime-ish with 22/36/60/95; well under the 375 m per-side peak
  spacing, so exactly one slot lands in each peak window), `biomes: tempestNew`, `matIndex: 7`,
  `arrivalPark: true`, plus a NEW flag `massif: true`. **NO `comp` block** — the `bi === 7` branch
  parks on `compHash ≥ density` (~4916–4920), and a slot can sit up to ~85 m off-peak where g ≈ 0.33,
  so a `comp` block would park ~⅔ of the massifs and defeat the every-congregation guarantee. This is
  the Frozen `hero` precedent exactly: the landmark uses its lock INSTEAD of `comp` — full size
  (k = 1) or not at all. (Skip the swell: a prop that only exists at peaks has nothing to swell
  relative to, and with no `comp` block `propClearanceData` audits `sMax = 1` — keep render scale
  and audit in agreement.)
- **Slot cadence (or the guarantee leaks by seed):** `makeBand` draws a per-slot `rnd()` dist jitter
  (~4380), so a peak can fall in a slot gap with NO candidate inside the ±step/2 window. The Frozen
  heroes fix this with a FIXED `slotJit` (~4374–4376). **Wire `massif` into that ternary with a
  CONSTANT jitter** (e.g. `def.massif ? new Array(perSide).fill(0.5) : …`) so massif slots tick at
  exactly `step` and every peak window has its candidate. Do NOT reuse `hero: true` — its jitter and
  park logic are Frozen-specific (`HERO_PEAK_OFFSET`, `frozenComp` phase). (Beware: the `stormstack`
  comment at 3313 claims `hero: true`; the def at 3315 has none — don't copy the comment.)
- **The peak lock (in the `bi === 7` branch, PURE — no `rnd()` — evaluated after the rotY init):
  each massif locks to its OWN bank's congregation peak.** The two banks NEVER share a peak
  (`tempestComp`: left peaks at `seg·(n+0.18)`, right at `seg·(n+0.60)` — a naive "heavier bank at
  peakIdx·seg" comparison ALWAYS picks left, ≈0.51 vs ≈0.009, and alternation never happens). For an
  instance `(d.dist, d.side)`:
  ```
  seg   = CONFIG.biomeLength / TEMPEST_COMP_PERIODS;        // 375
  shift = d.side > 0 ? 0.42 : 0;                            // tempestComp's own sideShift
  kS    = Math.round(d.dist / seg - 0.18 - shift);          // this bank's nearest peak index
  Pd    = seg * (kS + 0.18 + shift);                        // that peak's dist
  keep  iff |d.dist − Pd| < step/2;  else park.
  ```
  Alternation is then FREE: kept massifs interleave L,R,L,R every ~157/218 m — the 0.42 sway doing
  the Tsushima trick. One wall per congregation falls out of the window check (≤1 slot fits in
  ±85 m); no extra "nearest-slot" pruning needed.
- **Cadence + the wallpaper fallback:** 4 peaks/side × 2 sides = 8 side-peaks per 1500 m biome; the
  arrival beat parks the first left peak (local 67.5 < 200) → **~7 massifs/biome**, each 84–110 long
  → roughly 40–50% of ONE flank walled at any moment, alternating banks. This is deliberate (the
  guarantee is the point), but if the owner calls "walling" at PR-C, the one-round retreat is a
  `heroHash(kS)` duty park at ~0.6–0.7 — name it in the PR, don't improvise it.
- Expose the lock as a pure helper `massifSide(dist)` → the side whose peak window covers `dist`
  (i.e. the `s` with `|dist − Pd(s)| <` the window) — §5 reuses it for the counter-flank law.
  **Determinism:** append the archetype at the END of `ARCHETYPES` (after `basilica`, 3609–3720,
  before the closing `};` at 3721); the branch logic is pure and post-rotY-init.
- Doc-only: add `'scarpwall'` to `BIOMES[7].props` (`biomes.js:410`) with the "doc-only" note kept.

---

## 5. PR-B — density follows framing (placement-only; zero geometry)

1. **Kill the sprinkle:**
   - `stackgrave` `comp.floor 0.20 → 0.05` (line 3362) — the one-scale chunks peppering the breaths
     are this floor leaking through `density = floor + (1−floor)·g` at g≈0.
   - `stormprowFar` `comp.floor 0.22 → 0.10` (line 3272).
   - `wrackline` (no comp — fairness, 3427) and `rainshaft` (floor 0.50, 3401) **untouched**: the surf
     ribbon is the breath's floor, the virga is its far anchor. A breath then = violent sea + sun-lane
     + surf line + virga + breach: composed REST, not absence.
2. **The counter-flank law (kills the picket standing in front of the wall):** in the `bi === 7`
   branch, park `stormstack` and `stormprowHero` instances whose `d.side === massifSide(d.dist)`
   (the §4.6 pure helper — the side whose peak window covers `dist`; widen the suppression window to
   ~±½·seg·0.25 around that side's `Pd` if step/2 proves too narrow to clear the wall's full length).
   Both already have floor ≈ 0, so this only bites at peaks, exactly where the massif stands.
   Verticals congregate on the COUNTER-flank: mass one side, punctuation the other = the authored
   Lorrain frame. `tafonihold` + `stackgrave` stay both-flanks (the debris pools at the massif's
   foot by simply not being parked there).
3. **FOCAL GUARD-RAILS — GAMEPLAY-OWNED, propose to the owner, do NOT change unilaterally:**
   - The flat yellow pickup quads rival the breach (rubric #7 — nothing shares the focal's value
     band). Proposal: desaturate/shrink toward the gold-ember pickup language or warm-rim them.
   - The black gate hazard beam can bar the focal slot horizontally. Proposal: the Forum's
     "gate-in-the-play-aspect" treatment (lesson
     `2026-07-17-graphics-forum-gate-in-the-play-aspect.md`) so the hazard frames the breach instead
     of censoring it.
   Neither blocks PR-A/PR-B. Present both with capture evidence; the owner decides.

---

## 6. PR-C — the convergence gate (one revise round, per AAA-PIPELINE)

**Numeric pre-gates first** (`node tools/_lumprobe.mjs <png> <x0,y0,x1,y1:label> …` — fractional
coords, L = 0.2126R+0.7152G+0.0722B):
- `scarpwall` NEAR broadside face **≤ 0.38**; skyline crest rim **≥ 0.50** (same capture).
- The breach slot remains the frame's luminance MAX in every sweep frame (probe breach vs the
  brightest non-sky rect).
- A breath-window frame contains **≤ 3 mid-field props** between the rail and the horizon (count by
  eye on the capture; the sprinkle is dead when this holds).

**Capture set (all three, every gate round):**
1. **The no-hero MIXED-SCENE sweep** (§9 Recipe B) — the scale-hierarchy law: relative scale and the
   register ratio are only judgeable with everything spawning, on the game's own follow-cam.
2. **The broadside close read** (§9 Recipe A, `HERO=scarpwall`) — the cardboard check: end caps, step
   returns, no coplanar-sheet read, no knife edge. Judge the BROADSIDE, ignore the end-on fin orbit
   (the `_forumclose` framer caveat).
3. **A breath-window frame** — composed rest, not absence.

**Then the Fable gate (≥ 4.2, §10) and the owner-gasp gate on the PR preview.** Built to the laws of
§4 from I1, this converges in ONE revise round; if a third round is needed, CHANGE TECHNIQUE — that's
a technique ceiling, not a tuning miss.

**The pass condition for the whole correction:** re-run the 6-frame sweep. (a) The current best-frame
composition (dark near flank + framed bright slot + fog depth) is now the AVERAGE frame — every
congregation window has a massif flank + counter-flank punctuation + the breach slot (**arrival
window exempt**: `arrivalPark` parks the first left-bank peak at local 67.5 < 200 by design). (b) The thumb
test passes in both directions on every congregation frame: cover the small props → still composes;
cover the `scarpwall` → falls apart. (c) No breath frame reads as sprinkle. (d) The breach is the
value extreme in all six.

---

## 7. ENGINE LAWS (non-negotiable, Tempest edition)

- 100% procedural Three.js r160, no assets, no build step, 60 fps on weak mobile.
- **≤150 tris per archetype** (`envcount` enforces). ≤2 material groups (`mergeTempestParts` supports
  exactly 2: ladder + accent; `scarpwall` uses group 0 only).
- **`(r,h,r)` flatten law** — see §4.2. Size-scale `k` never moves `x` (`writeMatrix` ~4938, grep
  `sclV.set(d.r * k`): a smaller instance reads FARTHER, not nearer; a register change is a
  `place()` change.
- **Side-pinned rotY for lane-parallel masses** (§4.5) — a random yaw flip shows the blank back;
  `FrontSide` single-sided faces must face the lane AFTER the pinned rotY (verify in-context, the
  studio can't show a culled face).
- **Lane fairness:** fatal half-width 13 (`config.js` `laneHalfWidth`), fairness floor 14.5, gate veil
  ±16. Couple `place()` x to the measured footprint; `tools/propclearance.mjs` reports ρ / inner /
  top per prop.
- **DETERMINISM LAW:** `gold-determinism` byte-identical. Append at the END of `ARCHETYPES`; comp
  logic PURE (no `rnd()`), evaluated after the rotY-init line (~4740); never reorder existing bands.
  Placement/comp-floor edits (§5) are render-only. **Know the mechanism's limits:** the gate tests
  `level.js`'s isolated RNG — env props roll their OWN `mulberry32(seed+99)` stream (~3987), so
  `gold-determinism` CANNOT catch an ARCHETYPES-ordering mistake. Append-at-END is still mandatory
  (it keeps `?seed` layouts stable run-to-run); the discipline must be followed blind, because no
  gate will save you.
- **Tempest comp specifics:** `tempestComp` is per-side (sway 0.42) — the banks NEVER share a peak;
  all per-peak logic locks to a SIDE's peak via the §4.6 formula. arrivalPark seam beat < 200 m
  (4910–4914).
- **`stormarch` overhead law** (3450): crown spans are `overhead`-audited (`minWorldY 21`) —
  `scarpwall` has no span and needs no overhead entry; do not give it one.

---

## 8. QUALITY GATES (run every PR; all green)

```
cd /home/user/dragon-drift/reforged
node tests/gold-determinism.mjs      # byte-identical RNG — the sacred gate
node tests/biomecycle.mjs            # cycle order intact
node tools/envcount.mjs              # ≤150 tris, instance caps, FOAM_CFG audit; prints measured ρ + world top
node tools/propclearance.mjs         # inner edge clears the fatal lane — biome 7 is CI-ENFORCED (SCOPE_BIOME [2,3,4,7], exit 1); scarpwall needs the §4.5 lanePinned facing amendment or this can never pass
node tools/tricount.mjs              # roster tri budget
node tests/bulletcontrast.mjs        # only if any color/material constant moved
```

---

## 9. CAPTURE RECIPES

**⚠ THE TEMPEST STALL CAVEAT (read `tools/tempestshot.mjs:1–8`):** this container's software WebGL
stalls its readback under heavy captures — `player.dist` warps, multi-shot loops, and large
framebuffers all hang. `tempestshot.mjs` is deliberately MINIMAL: one boot, one natural-cruise
screenshot, 720×900. **Prefer one boot per frame** (vary `cruiseSeconds` / `seed` to sample different
windows) over a single-boot dist-sweep; if a run stalls, re-invoke. If your environment's GPU is
healthy, the Forum sweep pattern (`tools/_forumscene.mjs` / `_forumfly.mjs` / `_lagoonfly.mjs`) is the
richer template — try it once; fall back to one-boot-per-frame the first time it hangs.

**Recipe 0 — studio (Stage-1 form gate):** `propstudio.html` builds any archetype by key
automatically. Use the WALL driver: `node tools/_cwstudio.mjs <round> scarpwall <r> <h> [ry]` — it
renders at the true `inst=[r,h]` scale with wall angles (gallery-face / full-length / worm's-eye /
down-the-length / top-plan). Playwright is global (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) —
never `playwright install`.

**Recipe A — one prop in context (Stage-2 gate):** clone `tools/_forumclose.mjs` (itself a
`_kfclose.mjs` clone) → `_tempestclose.mjs`: boot `?biome=7&debug&hero=scarpwall`, force playing,
kill non-scenery (`noBoss`, `clearVents`, pin health), override `cameraCtl.update` to a low
outer-side ¾ broadside vantage, screenshot. **Caveat: `?hero=` does NOT isolate in biome 7** — the
`HERO_POSE` strip removes biome 0 from other archetypes only (~3789), so the rest of the storm
roster still spawns. Harmless for the in-context read (judge the scarpwall, ignore the neighbors),
but don't expect a clean-plate frame. Add the studio-facing debug branch in `place()` like basilica
(3717): `if (HERO_SET.has('scarpwall')) p.rotY = -Math.PI/2;`. Full-game screenshots are slow
(~30–40 s) — budget 2–3 frames per run.

**Recipe B — the composition sweep (the owner's view):** the biome in flight, game's own follow-cam
(do NOT override the camera), 6 frames across congregation + breath windows. `tempestshot.mjs` takes
only `[outPath] [cruiseSeconds]` and HARDCODES `seed=73101` (line ~24) — **clone it to
`_tempsweep.mjs` with the seed as an argument**, then one boot per frame (vary `cruiseSeconds` /
`seed` per the stall caveat; `?seed=` pins the layout so a fixed seed + varied cruise sweeps one
layout's windows). Montage with `tools/_montage.mjs` for the Fable spawn.

---

## 10. THE TWO-STAGE FABLE GATE (+ owner)

Spawn Fable via the Agent tool with `model: "fable"`. Give it: the §2 rubric, the §4 identity brief +
the ONE tell, the §11 kill-list, the capture PNGs by absolute path. Ask for **a score /5, the single
biggest failure, and the ONE highest-leverage fix**. Bar = **4.2**.

1. **Stage-1 (form):** studio sheet — silhouette / name test ("a storm headland," never "a glacier
   wall" / "a basilica") / thickness / value ladder. One revise round per note.
2. **Stage-2 (in-context):** broadside in the real biome — the studio cannot predict the storm-key
   read or the fog lift.
3. **Composition gate (per PR):** the Recipe-B sweep montage against the §2 rubric + §6 numerics.
4. **The owner gasp gate:** the live PR preview. The owner outranks every score.

---

## 11. CHEAP-TELL KILL-LIST (storm-rock edition — each is a gate-fail, cite on sight)

1. **LED glow / gold leak** — no emissive strips, no gold anywhere on `scarpwall`; gold lives ONLY in
   `tafonihold` sockets (and stormstack's notch sockets), ≤10% stolen-light, never self-lit.
2. **Flat-tape bands** — no painted-on horizontal stripes; stratification is GEOMETRY (offset skewed
   strata), value comes from the dot-keyed scour ladder.
3. **Minecraft staircase / ziggurat** — strata interpenetrate ≥25%, edges never align flush
   (the stackgrave R3 rotation fix, 3366–3368); no two clean stacked layers.
4. **Cardboard cutout** — no coplanar single sheet, no knife edges: deep caps, end sections, step
   returns, ±0.01 z-jitter (§4.3) from the first build.
5. **Flat-black poverty** — darken AND widen (§4.4); a crushed single-value silhouette fails even if
   the mean luminance target passes.
6. **Level parapet / glacier déjà vu** — the skyline is a rising broken diagonal; if a blind capture
   could be captioned "Sunset Glacier wall" or "Forum basilica," the identity is wrong — stop, don't
   tune (the karstfang rule).
7. **Both-flanks walling** — one massif flank per congregation, EVER (the corridor is a composition,
   not a slot canyon); guard the GAPS, not just the heights.
8. **Topple / plank lean** — respect the aspect-lean law: lean via strata offset with the world read
   verified; internal rotations shear flat under `(r,h,r)`.
9. **Metronome placement** — the massif must not land at visibly even spacing; the peak-lock +
   per-side sway already de-beats it — keep the ±rnd jitter in `place()` x/rotY.
10. **A missing `tilt`** — always numeric; `undefined` → NaN quaternion → the prop silently vanishes.

---

## 12. BUILD ORDER + CLOSING AUDIT

| PR | Content | Gate |
|---|---|---|
| **PR-A** | `scarpwall` skeleton: build (basilica quad kit) + `scarp` bake (via the `mergeTempestParts` opts extension, §4.4) + `place()` + the §4.6 per-side peak lock + `massif` slotJit wiring + the `lanePinned` propclearance amendment (§4.5) + `FOAM_CFG scarpwall:false` + doc-only whitelist note | §8 all green · Stage-1 + Stage-2 Fable ≥4.2 · §6 lumprobe face/crest |
| **PR-B** | Density-follows-framing: stackgrave 0.20→0.05, stormprowFar 0.22→0.10, counter-flank park via `massifSide` · focal guard-rail proposals to the owner (gameplay-owned) | §8 green (render-only) · breath-frame ≤3 mid-field props |
| **PR-C** | Convergence: the full sweep + montage, one revise round, then the owner preview | Composition Fable ≥4.2 · the §6 pass condition · owner gasp |

Skeleton before density — never tune density before the mass it serves exists. One
`leapfrog/lessons/` file per PR (`graphics-tempest-` slug).

**Closing audit (PR-C, checkable):**
1. **Register audit:** from the sweep, the RENDERED-top table (via `envcount` world tops, not
   `place()` h) reads near ~6–12 / **massif ~25–35 × 84–110 long** / punctuation thin verticals /
   far veil — the area histogram is bimodal and the near:massif ratio lands ~2.2–5× (mean ≈ 3×).
2. **Thumb test** both directions on every congregation frame (§6d).
3. **Guarantee audit:** every congregation window in a full biome pass shows exactly one massif
   flank, alternating banks; no breath shows a massif. **Arrival window exempt** — `arrivalPark`
   parks the first left-bank peak (local 67.5 < 200) by design; the guarantee starts at the first
   post-arrival peak.
4. **Value audit:** lumprobe numbers on record in the PR description (face / crest / breach-max).
5. **One-coastline test:** montage scarpwall + stormprow + stormstack — shared geology audible
   (skewed strata, down-wind lean, scour crests, wet slate); nothing reads imported.
6. **The atmosphere is untouched:** diff shows zero changes to sky/god-ray/water/fog/rain constants
   (`biomes.js` BIOMES[7] atmosphere block 328–414 — only the doc-only `props` line may change).
7. **The owner gasp gate** — the only score that matters.

---

## 13. GIT & PR CONVENTIONS

- Branch per PR; committer `Claude <noreply@anthropic.com>` (`git config user.email
  noreply@anthropic.com && git config user.name Claude`) or GitHub marks it Unverified. End commit
  messages with the `Co-Authored-By:` + `Claude-Session:` footers your session provides. **Never put
  the model identifier in any pushed artifact.**
- Push `git push -u origin <branch>` (retry with backoff); open/keep a **draft PR**; mirror any PR
  template; surface the money-shot captures in the PR description for the owner.
- One lesson file per PR.

---

**Summary:** one new archetype (`scarpwall`, the wave-cut headland massif — the missing mid-ground
MASS register, ~3× the near rail by rendered top, one flank per congregation, alternating banks
via the per-side peak lock, dark repoussoir
under the breach), two comp-floor edits + a counter-flank law (density follows framing), two
gameplay-owned focal guard-rail proposals, three PRs, numeric lumprobe pre-gates, the two-stage Fable
gate at 4.2, and a pass condition with teeth: the biome's best frame becomes its average, and the
thumb test holds in both directions. The sky is already premium — build it the stage it earned.
