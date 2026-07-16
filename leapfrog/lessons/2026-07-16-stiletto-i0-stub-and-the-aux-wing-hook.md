# 2026-07-16 — Stiletto I0: the stub, and landing the four-wing `auxWingPivots` rig hook

**Did / learned.** Stood up **Belladonna Stiletto** (roster key `stiletto`, the fresh
wasp-DRAGON) as an I0 coexist stub: a new `js/dragonStiletto.js` with four
contract-satisfying violet-black faceted PLACEHOLDERS (`chitinWaspTorso` ·
`gossamerDoubletWings` · `stilettoMaskHead` · `stingerLanceTail`), a fully-additive
`stiletto` def (4-form BREWING ladder, the full fever firewall, `coreGlow` left null by
design), the `venomStill` reticle rune, the SW precache entry, and the `defs.mjs` SSSR
count bumped 11→12. The load-bearing I0 work was the **rig surgery**: the sheet's
`parts.auxWingPivots` hook (confirmed ABSENT from `dragon.js`) landed as a nullable,
≤14-line guarded loop at the END of the `wingParts` branch — the hind pair rides the SAME
`shape()` glide-hold waveform as the forewings at a beat-phase offset (radians) / scaled
amplitude, reusing the branch's own locals (`shape/rootA/featR/climbBias/restLift/bank/
rollFold`). Two engine truths made it cheap: the rig already ticks builder-published
nullable pivot arrays (`wingBladePivots*`), and the secondary pair `wingPivot2*` is
unusable for the hum (in-phase, fixed amp, different waveform).

Gotchas that bit / were avoided:
- **The poser is TWO files.** `dragon.js` (live flight) and `js/wingDebugPose.js` (the
  studio/flapstrip freeze poser) are independent ports of `poseWing`. The aux loop had to
  go in BOTH or every gate capture would diverge from live flight. Added it to both.
- **The mirror is an OUTER wrapper, never a per-pivot scale.** The LEFT side wraps BOTH
  its pivots (fore + hind) in ONE `lmirror scale.x=−1` group; the poser writes identical
  L/R rotations and the wrapper reflects them. Result: `wingsymprobe stiletto` **Δ0.000**
  across all four wings on the first run.
- **Byte-identity proven, not asserted.** Shipped tricount FORM-rows are identical (only
  stiletto rows are new); `wingsymprobe` on vesper/revenant/tempest still Δ0.000 with the
  hook code present (null → zero writes). The 16 `color undefined` warnings are
  pre-existing import-time noise from other modules — stiletto's `buildDragonModel` emits
  zero (no module-level materials).

**→ Systematize.** A new rig DOF for a bespoke creature is safe when it is (a) a nullable
builder-published array picked up beside the existing nullable arrays, (b) ticked in a
guarded block that REUSES the host branch's locals (so fore + hind can never disagree on
waveform), and (c) mirrored by the shared outer-wrapper convention. The proof harness is
fixed: `tricount` FORM-row multiset (the naive diff lies — grep the new key out) +
`wingsymprobe` Δ0.000 on the new key AND on two shipped users of the same branch. Land rig
surgery FIRST, tiny and proven, before any geometry depends on it. **When you extend a
poser, grep for every port of it (`wingDebugPose.js`) and edit them in lockstep** — a
gate that reads a diverged studio poser is a lie.

**→ Leapfrog.** The four-wing shimmer is now free plumbing: I1–I4 just publish geometry
onto `hindPivotL/R` and dial `phase`/`ampScale`. The stub already reads as a coherent
dark wasp-dart (waist, gaster, four blades, needle) so I1 starts from a real silhouette,
not a blank — the first COLOUR render (the venom still filling) is the next gate.
