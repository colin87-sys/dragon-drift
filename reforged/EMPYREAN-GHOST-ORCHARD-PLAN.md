# GHOST ORCHARD — BUILD PLAN (THE EMPYREAN evolution, biome 5) · Fable-authored, APPROVE-TO-BUILD

Lead-AD (Fable) contract v1.0. The engineer implements verbatim; Fable gates each checkpoint.
Direction: evolve THE EMPYREAN into a sparse "ghost orchard" — pale full-bloom sakura + rose petals
that RISE (the drift-up law) — WITHOUT re-theming (keep the void, the Mote, the koi, the name).

## Locked decisions
- Evolution not re-theme. Trees ALWAYS full-bloom (never bare/accumulating), pale bone-ash trunks
  (NO brown — would break the Mote's darkness monopoly), leafless (full-bloom sakura needs no green).
- Petals are EMBER-STYLE PASS-THROUGH: lift off the water, rise through/past the canopy, dissolve into
  sky. Never fall, never accumulate. Background motes keep rising so UP never reads as a bug.
- Rose = hue 315–330° (repo law ≥315, tighter than the brief's 300). Petals/trunks stay ≥L70 → zero
  dark-budget charge by construction; the Mote keeps its monopoly.
- ONE new default-0 gate `empyOrchardMix` (rides biome 5 like empyStructMix; 0 elsewhere = byte-identical).

## Phases (cheapest-highest-impact first)
- **P1 — PETAL COLUMNS + LIVING WATER:** rising rose-petal pass-through (120 desktop / 72 tier-2, 3-tri
  notched-teardrop, one InstancedMesh/draw call; body pearl L86-90 hue300-320, tip rose 322°±6 S0.22-0.28
  L≥74 applied POST-fog; rise 1.4-2.2 m/s, non-integer sway + tumble; spawn at seeded LIFT RAFTS on the
  water 14-30m off-lane, ≥10° off the Mote bearing; dissolve y40-46). Water: reverse-ripples contracting
  inward at rafts (hue-phase only, ΔL≤4) + a soft rose raft-disc. Fills the audited dead water→sky band
  with the signature system; de-risks the rose-on-bright-field bet before any tree.
- **P2 — GHOST SAKURA HEROES:** 2-instance tree (trunk+limbs ≤150 tris bone-ash L70-76 + full-bloom
  hull-cluster canopy ≤150 tris, 5 jittered icosa hulls, ≥2 sky gaps, ≥8L inter-hull modulation, rose
  only on under-edges/tips, clefts ≥L78; 3 weeping strands). Sparse ceremonial placement: 6 shoreline
  heroes/cycle + an elder pair framing the finale gate; height ≤17m, ≥10° off the Mote bearing. Re-seat
  2 rafts under trees so columns thread the canopy (the water→canopy→sky sentence).
- **P3 — BLEACH-KOI BREACH (conditional on P2 ≥4.2):** rare (55s±20s) koi arcs to y11-14 over 2.6s,
  bleaches dark→pearl by height, dissolves into 8 rising petals at apex. Dark ≤0.4% frame, ≤1.2s.

## Gate protocol (every phase): machine-probe → converge → _choirstudio (props) → Fable ≥4.2 → full
guard suite → merge → lesson. Regression bars on EVERY orchard commit: darkBudget ≤0.40 (investigate
>0.10), warm/green pixels = 0, PR-A flankDelta ≥15% + movingRose ≥400 still green, orchardMix=0 byte-
identical elsewhere. New P1 probes: band-fill (≥250 moving-rose px/third cruise, ≥120 tier-2), direction
(≥80% of moving-rose px displace screen-UP), reverse-ripple ΔL≤4.

## Risks (pre-empted): pale-on-pale invisibility (post-fog rose + band-fill probe + fixed escalation
ladder S→size→count); reversed-snow-bug (columnar rafts + up-direction probe + agreeing motes + causal
ripple); pink-blob trees (hull sky-gaps + modulation + ceremonial bough, studio-gated first);
dark-monopoly regression (L70+/L78+ by construction, koi ≤0.4%, regression bars); parallel-stream
collision with uplift PRs (separate gate, sequence after merges, new uniform block); mobile perf (one
draw call petals, ≤300 tris/hero ×6, tier-2 caps).

Full authored contract (numbers, per-phase must-pass lists) recorded in the session; this is the summary.
