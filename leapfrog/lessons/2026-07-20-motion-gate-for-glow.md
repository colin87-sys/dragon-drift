# The motion gate: a glow feature approved in a frame the owner never sees is not approved

**What happened.** The Vesper "Nightfall Circuit" (lighting the wings on Surge) passed a
checkpoint critic at 4.4/5 and shipped to the owner's eye. The owner rejected it on sight as
"cheap… not professional, AAA or premium. How did this even get approved?" An emergency
art-director review scored it **2/5 in motion** and ruled **REVERT to black wings**. The owner
was right; the gate was wrong.

## Why the gate was wrong (all three are now binding requirements)

1. **Wrong projection.** The gate judged PINNED poses that hold the wing plane perpendicular
   to camera, so bone/bay contrast reads. Rear-chase looks DOWN the wing chord — foreshortened,
   the structure collapses into a uniform slab (cheap-tell #11, "thicken for the JUDGED
   projection"). Worse: `M.memGlow` was `DoubleSide`, so an "underside" glow rendered straight
   into the top-down view the owner actually flies — the owner's "only the underside glows"
   became a light the camera sees from above.
2. **Wrong background + no HUD.** The gate used a CLEARED field, no warm biome, HUD off. The lit
   membrane (L 90–129) straddled the biome's amber horizon (L≈114) — so for a colorblind owner
   who reads VALUE only, the surge ERASED the scallop silhouette (Vesper's whole identity) the
   instant it fired. And with the HUD off, no judge ever saw the surge-meter gauntlet arc
   compositing across the dragon's shoulders (L 242 — the brightest thing on screen).
3. **No motion.** The 0.030s staggered ignition — the entire "craft" of the circuit — completes
   in 0.12s and reads as one pop; bloom accumulation across the flap cycle fuses everything.

## The A/B that should have been the gate

The SAME dragon, seconds apart in the SAME live biome: pre-ignition (wings black) = a 4.5/5
premium night-glass silhouette; post-ignition (wings lit) = a 2/5 pale-plastic slab. The surge
— the hero moment — made the dragon WORSE. A matched motion pair would have shown this instantly;
the pinned single-frame gate hid it by construction.

## The binding gate for ANY glow/wing feature (roster-wide, from now on)

Machine pre-checks BEFORE a critic is even spawned:
- (a) ≥60% (ideally ≥95% for a withheld-black dragon) of wing-interior pixels **L<35** in every surge frame,
- (b) silhouette-edge ΔL vs the worst-case (warmest) background **≥60** in the worst frame,
- (c) no element crossing the shoulder line above **L 180**.

Then the critic judges an **8-frame motion contact sheet**: ≥1.2s, natural flap, rear-chase
gameplay distance, LIVE biome, **HUD/meters compositing ON**, worst-case background, as a
matched pre/post pair. `tools/surgeburst.mjs` (pinned, cleared, HUD-off) is a DIAGNOSTIC, never
a gate. `motionshot.mjs` is the gate capture.

## The deeper law (AAA-PIPELINE §3.5, the reason it's a REVERT not a revise)

Two executions of "light the wing" were rejected (the bloom-blob, then the circuit). *"If an
element needs a third attempt, the approach is wrong, not the parameters. Stop tuning; change
technique."* And the math proves the dead end: any area-glow at MEMBRANE scale erases the dark
field, and **the dark field IS Vesper.** A withheld-black dragon's Surge signature must live on
COMPONENTS with headroom the membrane can't reach — the dorsal Starlit Seam + tail nubs — not on
the wing surface. Frame 0 (black wings, live biome) is the standing proof this reads premium.

## What shipped

Reverted: `wingCircuit = 0` on every Vesper form (machinery dormant via the empty-list fast
path — kept for a possible future rework, not deleted); `M.memGlow` → inert dark geometry. The
Nightfall circuit code stays in the tree behind a zeroed dial; the ONLY sanctioned re-light path
is a FrontSide down-facing bank-revealed eclipse-flash (withheld, ≤15% lit area, node+tip not
full-shaft, blue-held not cream) — and only if the owner asks for wing light again after seeing
the reverted build in motion.

## What it unlocks

The gate reform is the real deliverable: it protects every future glow feature on the roster
from being certified in a frame the player never sees.
