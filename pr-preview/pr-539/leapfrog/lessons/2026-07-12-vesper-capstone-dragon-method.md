# Vesper capstone — the whole arc (1.5 → shipped) + a design-agnostic DRAGON METHOD is born

**What we did.** Took Nightglass Vesper from an owner **1.5/5** rejection ("a plane with trailing-edge
bumps… no player would grind for this") all the way to a **MERGED, shipped** premium drake, across a
rework + a "Finished Blade" pass + three owner directive passes. Along the way the accumulated method got
distilled into a new shape-agnostic playbook **[`reforged/DRAGON-DESIGN.md`](../../reforged/DRAGON-DESIGN.md)**
(Fable-authored) so a fresh chat never wastes rounds building "stick dragons with plane wings" again.
CLAUDE.md now points new dragon work there first (like BOSS-DESIGN / BIOME-DESIGN).

**The arc, compressed:**
- **The plane wing died to organic COMPLEXITY, not a smoother skin.** "Avoid the retired smooth hull"
  never meant "flat plane wings." The fix was a fingered bat wing: knuckled arm, radiating finger-bones
  with a dominant, membrane cupping INWARD in bézier arcs (≥4 segments or it sawtooths).
- **A "sheet-compliant" build can still be wrong** — Vesper's own build sheet specced the plane wing.
  Benchmark against the ROSTER'S BEST (Solar/Phoenix) + the owner's references, not just the spec.
- **The "stiff" fix was publishing the rig HINGES**: the tail became a 4-joint isBone chain (coil +
  vertical undulation + rudder); the wing became a real wrist-fold (arm→forearm→hand) on the wingParts
  glide-hold poser. The gate caught that the wing was a **1-bone plank at runtime** (geometry parented to
  an unrotated group) — mechanism on paper ≠ motion on screen; verify the runtime, not the intent.
- **Silhouette economics:** a matte-black dragon is small + backlit at gameplay distance, so surface
  plates/coverts are invisible — spend the budget on OUTLINE (crest, legs, tail, wing shape, span), and
  surface richness only for the close/shop read. Tris are cheap; legibility is the constraint. (Apex
  shipped ~1,060 tris — a fraction of Solar's 3,300 — and reads as premium because the silhouette works.)
- **Medial wrist, free span:** the wingtip vertex `LE(1)` pins the span, so you can pull the carpal inboard
  (short arm, long fingers — the bat proportion) and the fan just grows OUTWARD; span never shrinks.
- **Glow as COMPONENTS, not a strip:** the owner rejected the seam twice as an "LED strip." The win was
  making the discrete spine geometry glow (a withheld-ion CORE crowning each dorsal/tail nub) + the
  membrane UNDERSIDE glow — withheld in cruise, blazing on Surge. Also: kill the rider-halo bloom on a
  night drake (`hideRiderGlow`) — the creature owns the frame with its own cold accents.

**Meta-lessons that generalize (now the spine of DRAGON-DESIGN.md):**
1. The **Fable design-director → harsh-critic-PER-CHECKPOINT** loop is the engine — self-judging is
   banned; the gate repeatedly caught runtime bugs, symmetry breaks, and wrong-material asymmetries that
   green headless tests missed.
2. **Rigging gotchas that must be taught, not rediscovered:** the −anchor trick (byte-identical rest pose
   while a joint still articulates), the outer-wrapper mirror convention (scale.x=−1 must PARENT the pivot,
   not be on it, or the poser's identical L/R writes desync), and the per-side-material symmetry rule.
3. **A/B in the shop is a legit tool:** when the owner felt the body was "too busy," a second roster entry
   (Rich vs Lean, built by spreading the def with richness dials off) let them compare + play both live.
   It shipped with both — the A/B itself is a deliverable, not just an experiment.

**→ Unlocks.** A shipped premium drake AND, more durably, `reforged/DRAGON-DESIGN.md` — the reusable,
creature-agnostic method (failure modes, the wing kit, the motion kit, glow, tier ladder, process,
verification harness) so the NEXT dragon starts rich, deep, and well-animated on turn one instead of
re-deriving all of this from a 1.5/5 draft.
