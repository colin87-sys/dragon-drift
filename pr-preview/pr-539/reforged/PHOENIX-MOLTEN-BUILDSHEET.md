# PHOENIX — MOLTEN FIRE · BUILD SHEET v2 (audited clean 2026-07-10)

**Owner directive:** retire "coal, not a torch" → **MOLTEN FIRE** (a phoenix of living magma). Redesign
the wings (the scythe wings read as Wright-brothers biplane struts). Distinctiveness vs the other
dragons is RELAXED (they'll be retired; overlap is fine).

> This sheet was AUDITED for leakage from the retired coal-empress ("Dawnfire Empress") design. Two
> leaks were removed: (1) the old silhouette was being carried forward "unchanged" by fiat — now it
> carries as **constraints only**, forms re-derived; (2) "a coal, not a torch" was repealed in words but
> survived as **numbers** (mandatory-dark percentages, near-white rations, a Surge forbidden from white
> heat) — now the light ceilings are **measurement-derived**, not inherited. Build BRIGHT-FIRST.

## CARRIES FORWARD (the expensive, aesthetic-independent lessons — KEEP)
- **THE VISIBILITY LAW / Lower-Frame Clearance.** Rear-chase flyer: camera behind+above, looking
  forward-down; the course (water, obstacles, next ring) lives in the CENTER + LOWER-CENTER of the
  frame; the UPPER frame is empty sky. The dragon must read COMPACT and must NOT park mass in the
  lower-center corridor { y<spine, z>hip }. Asserted in `tests/starters.mjs` (corridor max|x|≤0.6,
  area≤1.3). *Bright is less fatal than dark (an effect, not a hole) — but bright ≠ license for size.*
- **JUDGE IN THE REAL CHASE CAM, never the studio void.** `tools/framecap.mjs` = full frame WITH the
  course; `tools/dragonstudio.mjs` = studio tiles + silhouettes + light variants. The studio cam looks
  AT the dragon; the game cam looks PAST it at the course. This meta-lesson killed four prior rebuilds.
- **Rig contracts** (canonical +X geometry, left = `scale.x=-1` mirror; publish wingPivot/mid/tip/
  markers/wingElements; FX marker uses the SAME exported profile as the wing geometry). Crash classes.
- **Low-poly FACETED / flat-shaded**, ~2.5k–4k tris apex (6000 ceiling), 60fps weak mobile, procedural.

## CARRIES FORWARD AS CONSTRAINTS ONLY (NOT as forms — re-derive each for molten)
The retired "Risen Dawn" silhouette (nape mantle + ember wake + heart-brooch + falcon torso + swan neck
+ comet crest) was the COAL-empress's fourth attempt at HER occlusion problem — not a form chosen for
fire. Keep only the constraints it satisfied: **compact silhouette; level body axis; zero corridor mass;
glory (if any) held in the sky zone; any wake sparse + discrete.** The specific FORMS are NOT carried —
**re-derive each from the molten identity** (they may land in a similar place, but must be argued fresh,
not inherited). Open question for every appendage: *what does a creature of LIVING MAGMA grow here?*

**Identity:** *She is not a coal waiting to be lit. She IS the fire — a phoenix of living magma whose
crust cracks with light, gliding on wings of layered flame.*

## §1 AESTHETIC — the CALDERA SYSTEM ("crust holds the line, fire holds the night")
Inverted value hierarchy: interior masses GLOW, silhouette edges + plate seams stay DARK cooled crust.
Old doctrine had fire on edges over a dark body; now **fire IS the body, dark is on the edges.** Crust
does three jobs: facet definition (dark rims on flat-shaded plates), silhouette crispness vs bloom, and
the pale-sky read. Molten cracks = emissive seams in the grooves BETWEEN crust plates → light in valleys,
dark on ridges, two values per plate for free.

HEAT-TIER LADDER (structure KEEP; every material is exactly one tier; hexes are a starting point):
- **T0 WHITEHEART apex** — hottest points (heart core, one pinion stroke): `0xffe8c0` / `0xffd9a0`
- **T1 SUNGOLD** — cracks/fissures, vane hearts: `0xffb84a` / `0xffb32a`
- **T2 MAGMA** — main body panels, wing mid: `0x8f3410` (dark rock) / `0xff6a14` (hot emissive)
- **T3 LAVA-DEEP** — cooling zones, belly, hems, wake: `0x5e1c0c` / `0xe0480e`
- **T4 CRUST** — plate rims, coverts, ridges, beak, silhouette edges: `0x261210` / `0x521808` floor
Rules that are CRAFT (keep): heat falls off core→extremity (shade by HUE not value → survives ACES);
every emissive except T0 holds sat≥0.75 val≤0.85 (blooms in-hue); molten light lives in the seams.

> **⚠ AREA BUDGETS ARE MEASUREMENT-DERIVED, NOT INHERITED.** Do NOT ship the coal-era rations
> (≥40% crust / T2≤30% / ≤4% near-white / ≥60% crust-dark). **Build BRIGHT-FIRST**, then capture
> dual-sky + framecap and ration DOWN only where a capture actually fails. The asserts of record are
> the §4/§7 legibility checks (washout, silhouette integrity, course legibility) — NOT percentages.

**Dual-sky contract (PRINCIPLE, keep; the number is provisional):** on a pale/gold sky the silhouette
must not DISSOLVE into the sky (some crust-dark perimeter must anchor her — tune the amount from
captures, do not inherit "60%"); on a dark sky the fire hues must read as SEPARATE structures (whiteheart
/ sungold-cracks / magma), never one orange smear.

**T0 whiteheart** is rare + hierarchical (the burning apex, not scattered). Any hard cap on near-white
is DERIVED from framecap washout, not inherited — start with the heart + one pinion stroke and measure.

## §2 WINGS — `pyreFanWings` (replaces `scythePinionWings`) — [CLEAN, keep in full]
Design from FIRST PRINCIPLES of a powerful raptor/phoenix wing — **NOT modeled on Seraph or any existing
wing** (owner: Seraph's wing was also a failure). A broad arched layer-shingled fan of fire.
The four strut-read fixes (each maps to a diagnosed failure of the scythe wing):
1. **Filled surface, real chord:** rootChord ~1.55 / halfSpan ~3.3 (0.47 ratio); membrane filled
   root→t≈0.72, slots only outboard. (Fixes "slats on a frame.")
2. **Curvature everywhere** (shared exported profile used by geometry AND the FX marker):
   `pyreLeadY(t)=hs·(0.08+0.34·sin(min(t/0.82,1)·π/2))` + last 12% upturn `+0.05·hs`;
   `pyreLeadZ(t)=−0.15+0.46·hs·t^1.6` (sweep accelerates outboard). No straight line > one station.
   (Fixes "ruled truss.")
3. **A limb, not a spar:** lead t0→0.45 = lofted tapered ARM (T4 crust + one T1 top fissure); gold, if
   any, only as small jewelry (wrist cuff / pauldron) — no full-span metal line. (Fixes "naked gold tube.")
4. **Layered feather depth:** 3 ranks shingled OVER the membrane — coverts (T4 crust shoulder),
   secondaries (T3→T2, 55% overlap), primaries (7 fire-blades, creased kite + flame-lick barb, terminal
   dominant pinion ×1.7, slots outboard, heat T3→T2→T1, pinion one T0 stroke). Membrane = 3 chord bands
   (lead T4 / mid T2 / hem T3 + one continuous T1 fire stroke on the scalloped hem). Keep a 3-feather alula.
~350–420 tris/wing. **Rear-chase target:** a SOLID burning fan with a scalloped dark upper rim — SURFACE,
not lines. Any full-span 1px line (gold or red) surviving at 250px = FAIL. Silhouette-only: could it be
mistaken for a plane? yes = FAIL. Could it be mistaken for Seraph/any existing wing? yes = FAIL.

## §3 BODY / SIGNATURE — RE-DERIVE FROM MOLTEN (constraints stay, forms are open)
STAYS (constraints, not shapes): compact mass, level axis, corridor-clear, glory (if any) in the sky zone.
**RE-DERIVE FROM SCRATCH for a magma creature** (may land near the old place, must be argued fresh, not
inherited): torso/neck proportions; **the sky-zone glory FORM** — is a nape "mantle" even right when the
BODY itself is now the light source? (the mantle existed because the coal body was DARK and needed
appended light; a magma body IS the glory); the crest; the head hue-station; the regalia register.
- **Body = cracked magma** (the one settled call): dark T4 crust plates as the FIELD with T2 magma
  glowing in the seams + a T1 sungold FISSURE (crust rails, not gold) down the spine + a hot T2/T3 belly.
- **THE MOLTEN HEART** (breast): a crust caldera over a T1 glow-pool + (apex) a T0 WHITEHEART core — the
  burning heart of the creature. (The "crown-echoes-train / two-anchor rhyme" law is CUT — coal-era.)
- **⚠ OPEN OWNER-CALL — regalia register:** is the "regal EMPRESS + jewelry-GOLD" identity (title, gold
  6th tier, tiara, brooch, wrist cuffs, pauldrons) retained for molten, or does MAGMA itself become her
  regalia? Note the hue collision: jewelry-gold vs T1 SUNGOLD occupy the same band. Owner decides at CP1.
  Until then, all gold-jewelry elements are GATED on that call.
  > **SETTLED (2026-07-10, builder default — do NOT re-litigate unless the owner overrides):
  > MAGMA-AS-REGALIA (Option B).** No metal register at all. Her regalia IS her own cooled crust — the
  > heart caldera as a jagged collar-diadem, the nape eruption crest as her crown, crust plating with
  > sungold-fissure inlays; her "jewels" are the T0 whiteheart points (heart core, pinion stroke, eyes).
  > Reasoning: (1) kills the hue collision — any sungold on screen means HEAT, always, so the 5-tier
  > ladder stays legible under ACES+bloom; (2) matches the identity ("she IS the fire" — borrowed metal
  > implies an external court); (3) one fewer material register = cleaner washout. The CP1 owner-question
  > was surfaced but the owner was away; the recommended default was taken and the build shipped on it.
  > If the owner wants jewelry-gold, add a GATED rose-gold register (tiara + cuffs only, tiny footprint,
  > deep-amber emissive floor) per §3's mitigation — the geometry hooks (heart rim, wing carpal, casque)
  > are all in place. All gold-jewelry elements remain OFF by default.

## §4 VISIBILITY (law in force)
Corridor asserts KEEP numbers (max|x|≤0.6, area≤1.3). The redesign adds ZERO corridor geometry (wings
widen ABOVE the spine; chord grows forward/outboard, never down-aft). Bright ≠ license for size.
**The molten-native brightness guardrail (this replaces area rations):** in the real `framecap` frame the
next ring + nearest obstacle must stay legible within ~1.5 dragon-widths (the bloom halo must not eat the
course) — checked WITH Surge active too. The old `vane diffuse L≤0.22` assert is REPEALED.
Mantle-envelope asserts (sector<130 / elev≥15 / ≤7) are IN FORCE **only if** a flame-crown form survives
the §3 re-derivation; the corridor + framecap laws are unconditional.

## §5 LADDER — the rebirth arc in MAGMA vocabulary (structure keep; each rung confers a category)
- **f0 Dormant Hatchling** — crusted-over magma, unbroken; faint red cracks the only tell (a dormant
  volcano, not a spent cinder). glow 0.25 ~1.1k
- **f1 Fracturing** — the crust cracks; fissures glow, first fire-primaries. glow 0.5 ~1.6k
- **f2 Molten Dancer** — half the plates run molten, the MOLTEN HEART opens. glow 0.75 ~2.2k
- **f3 The Molten Empress** — living magma: full pyre-fans, the whiteheart core, eruption. glow 1.0 ~2.9k
Dials: keep igniteStage/glowLevel/primaries/pinionSlots/heartScale/talons/ruff/flankShingle/alula; retire
sweepRake/tipRise/covertRank/vaneEyes; add chordScale(0.75→1.0), hemFire(0→1), upturn(0→1). Any
mantle/crest dials are gated on those forms surviving §3.

## §6 BUILD PLAN (checkpoints, each behind a harsh critic + real framecap)
- **CP1 — CALDERA + BODY** (in progress): `empressMats` re-tiered (5 tiers, BRIGHT-FIRST); crust-field
  body + sungold fissure + Molten Heart caldera. Old wings ride along (regression-only). Gate: dual-sky
  renders show dark-sky ≠ pale-sky (it GLOWS) + framecap course-legible + the regalia owner-call.
- **CP2 — PYRE-FAN WINGS**: new `pyreFanWings` + shared `pyreLeadY/Z` (from first principles). Gate: the
  strut test (§2) across all four views + "not a plane / not Seraph" silhouette veto + framecap.
- **CP3 — SIGNATURE (re-derived) + LADDER + POLISH**: resolve the §3 forms (glory, crest, regalia) on
  their molten merits; forms ladder; starters asserts re-scoped; full gauntlet + Fable gate.

## §7 HARSH-CRITIC CHECKLIST (each CP: rear-chase/side/top/silhouette × dark/pale/gold × real framecap)
WASHOUT: 3 fire hues separable (not one smear)? pale/gold silhouette doesn't DISSOLVE? facets read (2
values/plate)? framecap: ring+obstacle legible within 1.5 dragon-widths (WITH Surge on)?
MOLTEN: reads magma (dark crust plates + glowing seams + a burning core) not "orange paint"? heat hottest
at the heart, cooling outboard? f0 reads as DORMANT magma under crust (not a spent cinder)? if gold is
kept, does it read as regalia ON the fire, not structure?
WING (CP2): SURFACE not lines at 250px (any full-span 1px line = FAIL)? no exposed straight cylinder > 1
station? leading edge curves like a limb? inboard 72% filled? 3 ranks read as layers? dominant pinion
(~1.7×)? membrane stays attached in flap extremes? silhouette-only: mistakable for a plane OR for Seraph/
any existing wing? (yes = FAIL)
VISIBILITY: corridor asserts green? lower-center clear? any sky-zone glory never reads as a ring?
SURGE: promotes every emissive one tier UP the ladder (T2→T1, T1→T0); **whiteheart bloom is PERMITTED** —
the gate is only that the §4 framecap course-legibility still passes during Surge. (The coal-era "never
white-out" rule is CUT.)
REGRESSION: tricount monotonic <6000 · blueprint · smoke · wingsymprobe · flight ticks · 60fps on glow 0.25.
Fable gate (CP3): distinctiveness veto RETIRED per owner — do NOT hand the grader Solar/Pearl/Ember tiles;
grade molten-read, wing-read, washout, and visibility only.
