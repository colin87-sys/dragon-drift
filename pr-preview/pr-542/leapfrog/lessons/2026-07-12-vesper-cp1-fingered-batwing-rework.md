# Vesper CP1 — the "plane with bumps" → a fingered bat wing (owner 1.5 → 4.3 on the hero)

**Context.** The owner rejected the shipped-per-sheet Vesper at **1.5/5**: "the wing outline in top
planform looks like a plane with trailing-edge bumps… stiff and basic… no player would grind for
this," with bat-wing reference images (a clay sculpt of the finger anatomy) and a "make it like
Solar/Phoenix" bar. A high-effort Fable DESIGN DIRECTOR diagnosed the gap and produced a 4-checkpoint
rework plan; CP1 (the hero wing) went **1.5 → 3.8 → 4.3** in two Fable-gated rounds.

**Root cause (legible in the code).** The old `buildOneScallopWing` was **three straight lines with a
sine wave on one of them**: a linear leading arm, a straight trailing edge + a `sin` bump with a 0.34
floor (convex bumps whose valleys never cut in), one flat-black material over 70% of the frame, and
"finger creases" lifted 0.014u (invisible). The build sheet itself seeded it — §5's "soft convex lobes,
notch ~⅓, fewer-larger, flat facets" is a recipe for a plane-with-bumps. **"Avoid the retired smooth
hull" never required "flat plane wings"; the fix is organic COMPLEXITY, not a smoother skin.**

**The rebuild — the reusable bat-wing recipe (flat-tri, low-poly, 60fps-safe):**
1. **Knuckled leading edge, not a straight bar.** A gull ARCH in Y (rise to a carpal apex ~t 0.42, ease
   to the tip) + a raptor OGEE in Z (`-0.10 + 0.44·hs·t^1.12 − 0.15·hs·sin(πt)` — bows forward mid-span,
   sweeps hard aft to the tip). Solar's `wingArchY` + Phoenix's `sunLeadZ`. This alone kills the delta read.
2. **Radiating finger-BONES from the carpal knuckle**, not creases. Finger 0 = longest = the wingtip
   (continues the leading edge); the rest fan aft, shorter, drooping (aft-and-down; never up-curl). Real
   length variance with a DOMINANT (`lenFrac [1,.82,.66,.50,.36]`) — the Phoenix "fat fingers + a
   dominant, never a picket fence" law. Each finger = a raised tent-ridge (top-lit) with a thin lighter
   **rim-catch cap** along its spine so it reads as a raised skeletal RAY, not a flat wedge.
3. **Membrane cups INWARD between finger tips** — the inverse of the old convex bumps. A concave bézier
   from tipᵢ→tipᵢ₊₁ with the control pulled toward the knuckle (`cup 0.35`), **sampled at ≥4 segments**
   (the single highest-value fix: 2 segments read as a scissor-cut sawtooth-V; 4 read as stretched-
   membrane sag). Bias the deepest sag slightly aft. Each bay dropped into a vault so rim light pools.
4. **Value TIERS make it "rich."** 4 membrane mats graduating inboard-lighter → outboard = the per-form
   `wingOuter`, all in the deep blue-black lane. "Lacks richness" was literally ONE value where the bar
   dragons have four. ≥3 must READ on-screen (the 4th was real in a histogram but invisible — the
   remaining ceiling to 4.5).
5. **Anti-plank extras:** a root GUSSET sweeping aft to the hip (a separate overlapped tri buried under
   the cowl — the wing isn't bolted on) + a thumb claw at the knuckle.

**Gotchas banked (each cost a render):**
- **A per-bay translucent edge reads as FLOATING DEBRIS.** Build the knife-edge as ONE connected strip
  along the whole scalloped trailing polyline, not per-bay shards.
- **Coarse bézier sampling = sawtooth.** The curve was mathematically concave but 2 segments polylined it
  into a V. Sample 4+.
- **A big flat inboard triangle = "a whiff of the old plane at the root."** Subdivide the gusset + darken
  its tier so it blends into the neighbour bay.
- **The tip marker / wingElements must use the NEW `vesperArmY`+`vesperArmZ` at t=1** (the detach gotcha —
  the wingtip is now the longest finger's tip, not a straight-sweep endpoint).

**Process meta.** The DESIGN-DIRECTOR-then-harsh-critic-per-checkpoint loop (the Phoenix-Reforged
glow-up pattern) is the right shape when the owner rejects a *sheet-compliant* build: the sheet's own
doctrine was the failure, so a fresh design pass had to REVISE the sheet (§5 now says "fingered fan:
radiating bones + inward-cupped arcs; anti-sawtooth = curved arcs, NOT shallowness"). A gate that only
checks the sheet's rules will greenlight a spec that's wrong — benchmark against the owner's references
+ the roster's best, not just the spec.

**→ Unlocks.** The knuckled-arm + radiating-finger + inward-cup bat-wing kit is reusable for any
membrane wing that must read organic in this flat-shaded engine. Next: CP2 (body/tail richness — dorsal
nub row, haunch, webbed split fans), CP3 (publish the missing rig hinges — the "stiff" fix), CP4 (ladder
re-grade + the 4th readable value tier for the last 0.2).
