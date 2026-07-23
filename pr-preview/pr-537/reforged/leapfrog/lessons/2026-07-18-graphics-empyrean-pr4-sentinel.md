# THE EMPYREAN PR-4 — the SENTINEL hero + composition engine (Fable 2.3 → 4.4)

**What we did.** Built the first MODELED Empyrean prop — the `sentinel`, a colossal weathered
bone-nacre standing STONE — to the Fable-audited `EMPYREAN-PROP-REFERENCE.md`, gated it with a harsh
Fable critic (2.3/5 REVISE → rebuild → **4.4/5 PASS**), and shipped it as the biome's default kit.

- **`buildSentinelParts()`** — a procedural leaning LENS blade (a squashed-ellipse lathe of stations),
  carrying the four make-or-break silhouette cues: a **canted flat TOP-CUT**, an **asymmetric offset
  taper + lean** (per-station centre drift `cx`), **soft-rounded lens edges**, and a **flared BEDDED
  foot** (a submerged skirt below y=0 + a foot flare at the waterline). Radial weathering jitter; ~130
  tris, 2 mats (empyStone body + empyRim rose crown).
- **The composition engine was already generic.** No `bi===5` branch needed — the `comp: {floor, sMin,
  sMax}` + `arrivalPark: true` archetype options (the Caldera/Lagoon heroes use them) ARE the empyComp/
  arrivalPark/easement system: `floor 0` → absent in the open "breaths", clustering into COURTS at
  congregation peaks; `sMax 1.3` → a peak elder that dwarfs its court; `arrivalPark` keeps the ~450m
  Aurora seam clean (The Breach); random `rotY` → every stele a different facing (a court, not a fence).
- **Flag:** new kit DEFAULT (`biomes: empyNew=[5]`), interim legacy → `?props=v1` (`empyOld`).

**Gotchas / lessons (the two rounds it took, and why).**

1. **A canted flat top-cut is a SLOPE-IN-X, not a `cos(θ)` cant fanned to the vertex mean.** First
   build canted the top ring by `y += cant·cos(θ)` then fanned to the ring's *mean* point — which is
   NOT on the tilted plane, so the cap TENTED into a pencil apex (the critic: "pointed rose crystal
   tips, the headline fail"). Fix: cant as `y += slope·(x − cx)` (a genuine plane) and put the high
   point on the ROUNDED broad face of the lens (θ=0), never a sharp edge → a clean Stenness truncation,
   no apex. **The high point of a slant must land on a rounded part of the section, or it spikes.**
2. **Rose on the CUT FACE only — never the tapering shaft.** Painting the whole upper (tapering) shaft
   with the accent read as a rose *triangle* (crystal). Restrict the accent group to the top lip + the
   flat cut cap; the shaft stays empyStone. Same "rim on edges, never a fill" law that killed the candy
   arcshard.
3. **Under a shadowless rig, pale stone needs an EMISSIVE FLOOR or the verticals sink to the bounce
   hue.** empyStone `0xc2bcd6` is near-neutral, but the render read "saturated purple putty" — because
   with `sunI≈0` the vertical blade faces are lit almost entirely by the violet `hemiGround` bounce.
   Lifting the material's pale emissive floor `0.14→0.34` (light-independent) pulled the verticals back
   to bone-white. A dark/violet vertical on a pale prop is the shadowless-void trap; the fix is a
   luminance floor, not more light (there is no key light to add).
4. **Declined a critic note that broke theology.** The gate suggested "nudge toward warm ivory" — but
   the biome's cool/no-warm firewall (the reference audit) forbids warm; warmth implies a source. Kept
   it cool. **The critic scores the pixels; the theology still outranks a pixel note.**
5. **Silhouette FIRST, then surface.** Both must-pass gates hinged entirely on the SILHOUETTE (blade /
   canted top / lens edges / bedded). Spend the tri budget and the iteration there; the surface (value,
   mottle) is cheap vertex-space polish once the outline reads.

**The reusable pattern.** A megalith-class procedural prop = a station-lathe (elliptical → lens blade)
+ `cx` drift (asymmetric taper/lean) + a slope-in-x planar top-cut (rose only on the cut face) + a
submerged skirt (bedding) + radial weathering jitter, all under ~150 tris / 2 mats. Composition is the
existing `comp/arrivalPark`. Gate the SILHOUETTE with the harsh critic at cruise before the roster.

**What it unlocks.** The corridor of stones now frames the Mote (the mid-ground register the whole
biome hangs on — "you can't tune density until the framing mass is in"). PR-5 adds the rest of the kit
(haloarc → choirstones → pearlshoal) + the `inkShoal` flock, all built to the same reference + gate,
and retires the interim legacy props. Optional sentinel polish tracked (rose cut-face value structure).

**Verify.** Fable gate 4.4/5 PASS (all 4 must-pass Y); gold-determinism byte-identical, biomecycle,
envcount (110 tris, budgets green), propclearance, tricount all green; the `?biome=5` capture reads as
a leaning standing-stone court converging on the Mote at cruise.
