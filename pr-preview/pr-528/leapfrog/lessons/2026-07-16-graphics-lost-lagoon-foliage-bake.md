# Lost Lagoon foliage bake: the vegetated biome needs a THIRD bake, and the notch must cut the PLATE

**What we did.** Built `lilyraft` — the Lost Lagoon's low green commons (living Victoria-amazonica lily
rafts, the only vegetation in the biome cycle) — as the first PR-3 roster archetype. Fable pre-assessed
it, caught a blocking material trap before a line was built, and gated it l2 3.8 → **l3 4.3/5 PASS**.
Two reusable findings, both mechanical, both recur on every foliage prop.

## Reusable lessons

1. **A vegetated biome needs its OWN bake path — the default ladder actively BREAKS foliage.**
   `mergeLagoonParts` unconditionally runs `bakeTideLadder` (position-keyed: jade waterline / bleached
   crown) on the non-foil path. A lily pad is normalized base y=0 → top y≈1, so *every face above unit
   y 0.22 bakes bleached bone-amber* — you ship ivory pads, i.e. ice floes, the exact anti-replication
   failure the biome forbids. All-jade is wrong too (jade is the stone-MOSS stop). The fix is a third
   merge path: `mergeLagoonParts(parts, { bake: 'lily' })` → `bakeLilyFoliage`, keyed to the geometric
   face NORMAL (not height): `nr.y > 0.35` → sunlit olive-gold `0x8fa84a`, else shadow-green `0x2f5a38`.
   ~15 lines, mirrors `bakeCalderaLadder`'s per-face loop, zero tri cost. Build it as a SYSTEM
   (`opts.bake`), not a lily one-off — `rootbastion`'s canopy pads reuse it verbatim. **The rule: before
   building any prop with a non-masonry material, check what the default bake does to its faces at that
   prop's height — a shared merge helper silently applies a ladder that may be exactly wrong for the new
   material.**

2. **For a plan-view signature, the hole must cut the SURFACE, not just the frame around it.** The lily's
   defining mark is the Victoria radial notch, and it is an AERIAL signature (every reference photo is
   top-down; the flying game's plan is a shipping camera). First build gave the *rim* a partial theta
   (a gap in the upturned lip) but kept the *plate* a full circle — so from above the plate filled the
   notch and the pad read as a closed disc. The notch only appeared once the PLATE got the same
   `thetaStart/thetaLength` as the rim (a real dark-water wedge bitten into the green). **General law: a
   negative-space signature that must read in a given view has to be a hole in the SURFACE that view
   sees, not in a bordering element.** (Watch the `rx: -π/2` up-facing flip: it MIRRORS a CircleGeometry's
   theta, so to align a plate's notch with a cylinder rim's notch, set the plate `thetaStart = 2π −
   rimThetaLength` and share the `ry`.)

## Supporting notes

- **Recess the plate to the rim BASE (not up in the bowl) to get a bowl read for free.** With the plate
  low and the rim rising above it, the rim's near-horizontal INNER wall bakes shadow-green → a dark
  crescent inside the olive plate. That geometric shadow IS the "bowl"; a painted-on darker rim ring is
  the sticker/LED failure this repo kills on sight. Let face orientation + the bake do it.
- **A flat 2-tri blade reads as a floating sliver when seen edge-on or over-leaned.** Cap reed lean to
  ~0.3 rad of vertical and base the blades ON the raft, or a far/grazing camera renders one as
  debris/a scratch. A reed is a spear, never a stick adrift.
- **A foam collar on a tiny (~2 m) prop reads as an artifact — cut it.** `FOAM_CFG.lilyraft = false`:
  the pads ARE the waterline event; a glowing ring announcing a lily is the LED-adjacent read the kit
  forbids. Small huggers earn no collar.
- **Placement is the composition pass's job, not an art dial.** Distant lily pads read as dark grit on
  the gold reflection (shadowed rim edge-on → near-black at grazing angle). The fix is density/arrival-
  rhythm tuning, which can only happen once >1 new archetype coexists — banked into the end-of-PR-3
  composition pass. The 14.5 inner-edge fairness floor does NOT move for composition.

## What it unlocks

The `{bake:'lily'}` foliage system is now the Lagoon's third bake (masonry tide ladder / foil / foliage),
ready for `rootbastion`'s canopy pads. lilyraft ships at 4.3/5 (55 tris). Next roster piece: `wrackstone`
(the bare no-glow dressed-rubble foil), then the taller monuments, then the composition pass.
