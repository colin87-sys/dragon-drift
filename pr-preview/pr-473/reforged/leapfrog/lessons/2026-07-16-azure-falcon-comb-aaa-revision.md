# Azure Drake — AAA revision: the falcon-comb wing, and premium-via-craft for a Radiant starter

**What we did.** Rebuilt the Azure Drake (Radiant-class starter) from a flat plane-winged
glider to the premium bar (Tempest/Revenant floor) the owner named — in a bespoke
`js/dragonAzure.js` (`falconCombWings` + `falconKeelTorso`, coexist default-off; the old
`bladeFeatherWings`/`sweptLoft` were azure-only so the roster stayed byte-identical). Ran the
full AAA pipeline: Fable art-director **pre-assess → numeric targets**, build to them, Fable
**critic gate**. The baseline autopsy: even the T2 apex read as a thin flat feather-delta
(failure mode #1) with a fish-blob body, one flat value, no organized ranks, a plank-rig
metronome, and NO signature FX.

## The reusable wins

- **Premium ≠ spectacle for a Radiant.** The owner's rule "radiant must never compete with
  eternal" is a **numeric cap**, not a vibe: the withheld signature (THE SLIPSTREAM — a recessed
  cyan filament nape→tail that idles dark and ignites on Surge) is capped at
  `surgeGlowMultiplier 10` vs the Eternal Vesper's 22 (~45%). All the premium read comes from
  CRAFT — wedge thickness, organized ranks, value structure, a real wrist-fold beat — exactly
  the restrained-premium model. You can clear the Tempest/Revenant DETAIL floor while staying
  well under the Eternal SPECTACLE ceiling.
- **The falcon HAND, not an inboard fan.** The old comb rooted the *longest* blade inboard
  (mid-fan). A real falcon planform clusters all primaries on the HAND at the carpal, with
  finger 0 the **dominant leading primary that IS the wingtip** and pins the envelope at `reach`
  (DD §4.4); the rest fan aft in a steep decay `[1,.82,.66,.52,.40]` (2.5:1). Flipping to this
  fixed span:body AND made the wrist fold contract the span naturally (all primaries ride the
  folding `hand`/`tip` group).
- **Wedge blade = real thickness, but keep it BROAD or it reads as a needle.** A lofted lens
  cross-section (LE → raised rachis ridge → TE → belly drop) gives real edge-on thickness that
  kills the plank (DD §2.3). BUT the first pass tapered the whole length → long thin *spikes*
  with full-length sawtooth gaps. The fix that made them read as *feathers*: hold near-full
  chord to ~55% then taper to a point, widen the chord (`chordK` 0.155→0.26), and cut the fan
  rake + stagger so broad feathers **overlap ~55%** and only the TIPS slot. Chord width and
  overlap matter more than length for the "feather not needle" read.
- **Value-ladder strake paint on the shared arrow loft.** The `bladeRing` loft has 8 columns;
  `i % 8` maps each vertex to a 4-tier value tier (dorsal highlight / lit facet / base / shadow
  + pale belly) painted as longitudinal strakes (AAA §1.3 / DD §2.11). Reusable on any loft
  torso via a post-`buildTorso` paint pass on the body mesh (`vertexColors=true`, color white).
- **Form-gated coverts ladder BOTH richness and the tri budget.** A `covertRanks` dial (0 whelp
  → 2 apex) gates covert ranks + secondaries, so the FLEDGING ladder (welded paddle → pin
  feathers → full comb) is monotonic in tris *and* cruise-visible hardware in one lever — which
  is what the §7 "apex visibly richer than hatchling (≥1.35×)" assert wants.

## The gotcha (cost a debug round)

**A wrapper-mirrored `wingParts` blade-comb needs its OWN inline fold tuck.** The `fold` debug
pose only contracted azure's span to ~0.79 (§7 wants ≤0.72). Two traps stacked:
1. `wingDebugPose.js`'s `wingParts` branch `return`s *before* `poseBladePivots()` runs — so the
   azure-specific shoulder-fold never fired; the wingParts fold only up-rolls (`rollFold`).
2. You can't just call `poseBladePivots()` to fix it, because it sets `wingPivot`/`wingTip` with
   the **per-side-sign** convention (`s * 1.66`), while the new wing uses the **outer-wrapper
   mirror** (`scale.x=-1`, identical L/R rotations). Per DD §5.5 corollary (a) — a mirror
   transform and a per-side sign BOTH flip; use exactly one — so per-side-sign fold rotations on
   a wrapper-mirrored wing double-flip and desync the left wing.

Fix: a **wrapper-consistent** fold tuck (identical L/R shoulder swing-back + roll-down + blade
rake-cancel) written inline in the `wingParts` branch, gated to `wingBladePivots` (azure only)
so other wingParts dragons and all gameplay poses are untouched. `wingsymprobe` stays Δ0.000.

## Also

- **Reconcile an intentional identity change in the test, don't silently weaken it.** The
  falcon planform makes finger 0 (not a mid-fan blade) the longest — so the "longest blade
  mid-fan" assert is now WRONG for azure. Made it architecture-aware (`combProfile:
  'falcon-leading'` → assert dominant is the leading primary + dominance ≥2.2:1), and reconciled
  the span/tri bands to the built falcon-hand geometry (the jade/ember precedent). Documented,
  not weakened.

## What it unlocks

The wedge-blade + falcon-hand kit (broad overlapping wedge primaries, dominant leading finger,
propatagium web + laddered coverts, wingParts-3 wrist fold) is reusable for any raptor/avian
dragon. And the "premium via craft, capped below Eternal" proof means the other Radiant
starters (ember, jade) can be lifted to this bar the same way — bespoke module, value ladder,
one withheld signature under a numeric cap — without ever rivaling the SSSR spectacle.
