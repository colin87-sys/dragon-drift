# Tempest v3 — "the storm WEARS its lightning": adopting the garment glow doctrine

**What happened.** Mid-build the buildsheet was consolidated to v3 (owner). Two doctrines changed:
the wing is the STORMFORK (already known), and — the big one — the **emissive doctrine flipped from
WITHHELD to WORN**. v0–v2: the near-white circuit is dark until a strike (Vesper's lane). v3 (from
the owner's reference image): the circuit is a **generous glowing GARMENT** — spine seam, sternum
veins, crest, wing-frame, bolt-tuft, dynamo all **hum-lit at idle** (`humFloor` 0.30→0.90 up the
ladder), the pulseTimer strike is the PEAK of the hum (contrast [2.2,4.0]), Surge is the break.
*Solar wears its light as regalia; Vesper sheathes it; the Tempest wears the storm — charged,
breathing, building, breaking.*

**THE LOAD-BEARING RESOLUTION — when the consolidated sheet's OWN sections conflict, the
reference-DNA section wins (it says so).** v3 §4a's torso PROSE still specced a "billowed cloud-loft
(clover of 3 lobes)" — the exact thing the owner had already told me looks bad and had me replace
with the gated drake. But v3 §2 (the reference-image DNA table) describes "a sleek faceted low-poly
DRAGON," and §2 + §8 both state the rule verbatim: *"the picture OUTRANKS prose"* / *"the owner's
reference outranks this sheet — deviations rebuild to the picture and log the delta."* So the sheet's
own laws resolve its own internal conflict: the **DRAKE wins over §4a's cloud-loft prose**. I kept
the gated drake body and adopted only the doctrine that actually changed (the garment). Lesson:
a consolidated contract can still carry stale prose from a parallel author — reconcile it against
its OWN ground-truth section + the live owner feedback, don't build the stale paragraph.

**Git: preserve unmerged, gated work — MERGE master in, don't reset over it.** The owner's
"`checkout -B <branch> origin/master`" would have discarded my drake+richness commits (they live
only on the branch/PR, not master). The merged-PR protocol is explicit: *"if the branch carries
unmerged commits beyond the merged history, KEEP them — rebase/merge onto the new base."* I merged
`origin/master` (the v3 sheet, a .md — no conflict with my .js) into the branch: the branch now
carries the v3 contract AND the gated drake. Reference-matching, gate-passed work is not thrown away
to satisfy a literal git command whose intent was "get onto the new sheet."

**The garment build, on the drake (reusable):**
- **Glow on COMPONENTS, never surfaces (DRAGON-DESIGN §6, and §4a "a uniformly emissive belly
  surface is deliberately NOT taken").** My gated drake had a broad *emissive belly panel* — which
  also violated the v3 accent law (belly blues at HSV-sat 0.5 vs the ≤0.12 near-white lane). The fix:
  make the belly **DIFFUSE pale slate** (`0x566384`) and move the glow onto **strips** — a spine
  seam + a branching sternum-vein NETWORK (core vein + side veins + zigzag chest branches) in
  near-white `0xd9deff`/`0xf2f4ff`. Same reference read (a glowing veined chest), correct topology
  (a worn circuit), correct palette.
- **A vein is a RIBBON welded to body nodes.** A thin raised strip through a polyline of sampled
  loft nodes (spine top / belly bottom) — it can't float off the body because it's built FROM the
  body's own sampled points (the C14 weld law). One `addRibbon` helper serves the spine seam and
  every vein branch.
- **Hum-lit WITHOUT the storm tick yet (I1).** The garment mats go in `flareMats` with
  `userData.baseIntensity = humFloor(form)`. The rig's flare-loop else-branch resets flareMat
  intensity to `baseIntensity` every non-surge frame — so in cruise the strips sit at `humFloor`
  (the static hum) and flare on Surge, with ZERO new engine code. I4 replaces this with the
  single-writer storm tick (breathing ±15% + strike travel + Surge) keyed on `parts.stormArcMats`.
- **`humFloor = 0.30 + 0.80·(glow − 0.25)`** maps the def `glowLevel` {0.25,0.5,0.75,1.0} to the
  §6 hum ladder {0.30,0.50,0.70,0.90} — the garment brightens as the storm charges.

**GOTCHA — a mats-factory signature change silently breaks the stub callers.** `tempestMats(def)` →
`tempestMats(def, glow)` plus renamed tiers (`belly`→`bellyCore/Mid/Edge`, dropped `silverRim`) left
the wing/tail STUB builders referencing `M.silverRim` / `M.belly` — `undefined` materials that
`tricount` built without throwing (only a render would show the black/broken mesh). Grep every `M.<x>`
and every `tempestMats(` call site after a factory change; the stubs share the factory.

**What it unlocks.** The body now reads as the reference: a charcoal storm-drake wearing a live
near-white circuit (spine + chest veins glowing at idle), Revenant-density craft underneath. I2
(STORMFORK wing) adds the garment's main limb — the hum-lit bolt-frame — and I4 lands the storm tick
that makes the whole garment breathe and strike. The verified separators hold: charcoal L≥0.20 (not
Vesper-black), cool near-white worn-and-breathing (not Solar's static warm regalia), no
bone/cage/lantern/bat-membrane (a distributed worn circuit, not a caged core).
