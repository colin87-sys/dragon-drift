# PHOENIX — "The Molten Empress" · BUILD SHEET v2 (MOLTEN FIRE)

**Owner directive 2026-07-10:** retire "coal, not a torch" → **MOLTEN FIRE** (a phoenix of living magma).
Redesign the wings (the scythe wings read as Wright-brothers biplane struts). Distinctiveness vs the
other dragons is RELAXED (they'll be retired one day; overlap is fine). **Carries forward unchanged:**
the GOVERNING VISIBILITY LAW / Lower-Frame Clearance, the compact Risen-Dawn architecture (sky-zone
mantle + ember wake + compact body), the rig contracts, and **real-chase-cam gating** (`tools/framecap.mjs`,
never the studio void).

**Identity:** *She is not a coal waiting to be lit. She IS the fire — a phoenix of living magma whose
crust cracks with light, gliding on wings of layered flame.*

## §1 AESTHETIC — the CALDERA SYSTEM ("crust holds the line, fire holds the night")
Inverted value hierarchy: interior masses GLOW, silhouette edges + plate seams stay DARK cooled crust.
Old doctrine had fire on edges over a dark body; now **fire IS the body, dark is on the edges.** The
crust does three jobs: facet definition (dark rims on flat-shaded plates), silhouette crispness vs bloom,
and the pale-sky read. Molten cracks = emissive seams in the grooves BETWEEN crust plates (re-tier the
existing shingle/keel-channel relief) → light in valleys, dark on ridges, two values per plate for free.

FIVE-TIER HEAT LADDER (every material is exactly one tier; hexes = diffuse / emissive / f3 intensity / rear-chase area budget):
- **T0 WHITEHEART** hottest points (heart core, Dawn Coal, ONE empress-pinion stroke): `0xffe8c0` / `0xffd9a0` / 2.2–2.6 / **≤4%** (≤3 near-white points, f3-only)
- **T1 SUNGOLD** cracks/fissures, vane hot-zones, mantle hearts: `0xffc258` / `0xffb32a` / 1.4–1.8 / ≤12%
- **T2 MAGMA** main body panels, wing mid-band, flame plumage: `0xb8481a` / `0xff6a14` / 0.8–1.2 / ≤30%
- **T3 LAVA-DEEP** cooling zones, outer panels, hems, wake: `0x7a2410` / `0xe03a10` / 0.4–0.7
- **T4 CRUST** plate rims, coverts, dorsal ridges, beak, silhouette edges: `0x261210` (belly `0x3a1a12`) / `0x521808` floor / 0.12–0.20 / **≥40%**
Gold jewelry = a 6th non-emissive tier (rose→bright `0xc07a3a`→`0xe8c078`, metalness .62, amber floor `0xb06a14`@.22).
Rules: heat falls off core→extremity (shade by HUE not value → survives ACES). Every emissive except T0
holds sat≥0.75 val≤0.85 (blooms in-hue). **Dual-sky contract (assert):** pale/gold sky → silhouette ≥60%
crust-dark (never dissolves); dark sky → the 3 fire hues legible as separate structures (never one smear).

## §2 WINGS — `pyreFanWings` (replaces `scythePinionWings`; the strut-read fixes)
A broad arched layer-shingled phoenix fan of fire; golden-eagle planform, molten membrane surface.
1. **Filled surface, real chord:** rootChord **1.55** / halfSpan **3.3** (0.47 ratio); membrane filled root→t=0.72, slots only outboard.
2. **Curvature everywhere** (shared exported profile for geometry AND FX marker):
   `pyreLeadY(t)=halfSpan·(0.08+0.34·sin(min(t/0.82,1)·π/2))` + last 12% upturn `+0.05·halfSpan`;
   `pyreLeadZ(t)=−0.15+0.46·halfSpan·t^1.6` (sweep accelerates outboard). No straight line > one station.
3. **A limb not a spar:** lead t0→0.45 = lofted tapered ARM (loftRings, r 0.15→0.07, T4 crust + one T1 top fissure); gold only as a wrist cuff (t≈0.45) + shoulder pauldron. No full-span metal line.
4. **Layered depth (3 ranks shingled over the membrane):** coverts (t.05–.55, 9, T4), secondaries (t.30–.72, 8, T3→T2, 55% overlap), PRIMARIES (t.65–1.0, 7 fire-blades, creased kite + flame-lick barb, terminal empress pinion ×1.7, slots outboard, heat T3→T2→T1, pinion one T0 stroke). Membrane = 3 chord bands (lead T4 / mid T2 / hem T3 + one continuous T1 fire stroke on the scalloped hem). Keep the 3-feather alula.
~350–420 tris/wing (~800/pair). Rig contract unchanged (canonical +X, scale.x=-1 mirror, publish pivots/mid/tip/markers/wingElements; marker uses the shared profile; wingMat = primaries' T2).
**Rear-chase target:** a SOLID burning fan with a scalloped dark upper rim — surface, not lines. Any full-span 1px line surviving at 250px = FAIL.

## §3 BODY / SIGNATURE (molten)
STAYS (geometry): compact falcon torso, swan neck, level axis; sky-zone mantle; ember-wake whip; crest+tiara; talons/ruff/flank/scapular relief. CHANGES:
- **Body = cracked magma:** loft T2; shingle rows re-materialed T4 crust; dorsal keel-channel → MAGMA FISSURE (T1 floor + crust rails); belly T3.
- **MOLTEN HEART** (breast, replaces the gorget): a 5-plate crust caldera + T0 whiteheart core + T1 spill seams. f2 confers; f3 Dawn Coal here + mantle vent (one grammar two anchors).
- **Mantle → FLAME CROWN:** same `mantleLayout` envelope (sector<130, elev≥15, ≤7) but rays = 3-tri flame tongues (T3→T2→T1) + molten-pearl gem; rachis thin T4 (not gold) → reads as rising flames.
- **Ember wake:** whip T4→T3, shed gems = T1 molten pearls, count 5.
- **Crest:** rose-fire `0xe83a6a` (4th hue-station, separates head from body furnace), tips T1.

## §4 VISIBILITY (law in force) — corridor asserts keep numbers (max|x|≤0.6, area≤1.3; mantle sector<130/elev≥15/≤7; wake discrete). Redesign adds ZERO corridor geometry (wings widen ABOVE the spine, chord grows forward/outboard). Bright ≠ license for size. New: real-framecap check — next ring + nearest obstacle legible within 1.5 dragon-widths (bloom halo must not eat the course). REPEAL the old `vane diffuse L≤0.22` assert → replace with the §1 tier area-budgets.

## §5 LADDER
- **f0 Cinder Hatchling** — cooling cinder-chick, crust-dark, faint red cracks. Short round wing fans, primaries 4, no slots. glow 0.25 ~1.1k
- **f1 Kindling** — cracks catch, fissures glow, primaries 5 + 2 slots + hem stroke, 3 mantle tongues, wrist cuffs. glow 0.5 ~1.6k
- **f2 Molten Dancer** — half the plates molten, MOLTEN HEART conferred, primaries 6 + 3 slots + alula + full hem crescent, 5 tongues, pauldrons. glow 0.75 ~2.2k
- **f3 The Molten Empress** — living magma, primaries 7 + empress pinion T0 + full sweep/upturn, white heart + Dawn Coal, flame crown 7 + brooch, tiara, bright gold. glow 1.0 ~2.9k
Dials: keep igniteStage/glowLevel/primaries/pinionSlots/crestQuills/mantleRays/mantleSector/wakeEmbers/heartScale/diadem/talons/ruff/flankShingle/alula; retire sweepRake/tipRise/covertRank/vaneEyes; add chordScale(0.75→1.0), hemFire(0→1), upturn(0→1).

## §6 BUILD PLAN (checkpoints)
- **CP1 — CALDERA + BODY:** `empressMats`→`moltenMats` (5 tiers + budgets); re-tier torso/head/tail; build the fissure + Molten Heart. Old wings ride along (regression-only). Gate: dual-sky renders + framecap.
- **CP2 — PYRE-FAN WINGS:** new `pyreFanWings` + shared `pyreLeadY/Z`; switch parts.wings; wingsym + flap + framecap. Gate: the strut test across 4 views.
- **CP3 — FLAME CROWN + WAKE + HEAD + LADDER + POLISH:** mantle tongues, molten pearls, crest re-tier, forms ladder, starters updates, tricount monotonic, full gauntlet + Fable gate.

## §7 HARSH-CRITIC CHECKLIST (each CP: rear-chase/side/top/silhouette × dark/pale/gold × real framecap)
WASHOUT: 3 fire hues separable (not one smear)? pale/gold silhouette ≥60% crust-dark? ≤3 near-white points? facets still read (2 values/plate)? framecap: ring+obstacle legible?
WING (CP2): SURFACE not lines at 250px (any full-span 1px line = FAIL)? no exposed straight cylinder > 1 station? leading edge curves like a limb? inboard 72% filled? 3 ranks read as layers? empress pinion dominant (~1.7×)? membrane stays attached in flap extremes? silhouette-only: could it be mistaken for a plane? (yes=FAIL)
VISIBILITY: corridor asserts green? lower-center clear? mantle never a ring? wake reads as sparks?
MOLTEN: reads magma (dark plates + glowing seams + burning core) not "orange paint"? heat hottest at heart, cooling outboard? f0 reads as a cinder? gold = regalia ON the fire, not structure? Surge flares warm-gold in-hue (never white-out)?
REGRESSION: tricount monotonic <6000 · blueprint · smoke · wingsymprobe · flight ticks · 60fps on glow 0.25.
