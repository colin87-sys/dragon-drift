# 2026-07-11 — External graphics-suggestion set reconciled against the overhaul plan (2 new initiatives)

**Did / learned.** An outside reviewer submitted 13 graphics suggestions (A1–A5 quick wins, B1–B5 medium, 3
ambitious, a "what not to do" list). A high-effort Fable pass assessed them against `GRAPHICS-OVERHAUL.md`,
code-verified (confirmed r160's `lib/three.module.js` ships `AgXToneMapping` and the `geometryRoughness`
specular-AA chunk). Result: **~80% was already in the plan, usually in more detail** (A2≡N1 dither near-verbatim,
A1→N5, A3→N12, A5→N3, B2→N10a, B3→N8, B4→N9, B5→N4), and the entire "what not to do" list matched the plan's
standing rejections (TAA/SSR/MeshPhysical/LUT/motion-blur/pixel-ratio). **Two items were genuinely new and worth
adding:** **N14 — shading anti-alias** (the emissive surface-patch terms, the perturbed-normal scales, and the
water sun-streak all shimmer because they sit *outside* r160's built-in `geometryRoughness` path; `fwidth`-based
roughness/exponent widening at those three seams, uniform-zero default), and **N15 — boot-baked procedural prop
vertex AO** (dark bases/undersides — the #1 "toy-like" fix, computed at boot so it's zero-asset + zero-runtime,
and it compounds with the N5 SH probe). Also folded in an N10(d) mip-bias reflection-blur note (contingent on the
N11 half-rate judder feel-call) and amended N5's PMREM re-bake triggers to include Dragon Surge boundaries while
**rejecting a fixed 0.5s re-bake cadence** (piecewise-constant sky between seams → a 2 Hz GPU-spike jank
generator).

**→ Systematize.** Two reusable patterns. (1) **Uniform-zero / attribute-identity is the universal coexistence
proof:** N14 ships `uSpecAA=uEmisAA=0` and N15 ships an all-1.0 vertex-color attribute — both are *provably* the
shipped frame with the flag off, which is exactly what the Gate-2 checklist demands. Any new visual term should
be authored so its "off" state is byte-identical by construction, not by testing. (2) **"Zero-asset" ≠ "no baked
data":** boot-time-*computed* vertex attributes (AO), in-shader-*computed* noise (dither), and procedural SH
projection are all 100% procedural — the law forbids *files*, not precomputation. Contributors reflexively flinch
from "baking"; the real test is "does it add a file?" (3) A written **"Considered & rejected"** appendix stops the
next reviewer from relitigating settled calls — cheaper than re-deriving the rejection each time.

**→ Leapfrog.** An adversarial external-review pass is now a cheap, high-signal way to validate a big plan: if a
fresh set of expert eyes independently re-derives ~80% of your backlog, the backlog is sound and the 20% delta is
where the real value hides (here: two near-free artifacts the plan under-weighted because they *peak in its own
future* — N5 specular + N7 emissive amplify exactly what N14 tames). Bank this as a gate habit: run one external/
adversarial review before committing a multi-PR roadmap, and mine the disagreements, not the agreements.
