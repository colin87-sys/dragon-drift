# Compute every number before the sheet asserts it — a spec can be arithmetically impossible in fluent prose

**What we did.** The v2.1 Fornax build-sheet corrections were re-audited: C1/C2/C6
cleared, but C4 and C5 were re-opened because the corrections themselves contained hard
arithmetic defects. v2.2 fixed four, each verified by computation this time (a scratch
Python pass before every Edit).

**What we learned — the four ways a confident number lies:**
1. **A geometric series can be impossible on its face.** Tail pitch "0.24u ×0.94"
   converges to 0.24/0.06 = 4.00u as n→∞ — asymptotically SHORTER than the 4.03u tail
   it claimed to span, and only ≈2.0u at its own stated 11–12 vanes. Sum the series.
2. **A per-element decay law does not extrapolate across scales.** The house ×0.66 decay
   is sourced for 2–3-element follower ranks (horns, digits); applied over 11+ tail
   vanes it computes to a 0.034u sub-2px crest — prose said "rolling ridge crest", the
   arithmetic said dead. Fix pattern: **decay to a committed tip floor with a DERIVED
   ratio** (0.18u→0.04u over 16 intervals ⇒ (0.04/0.18)^(1/16) ≈ ×0.91), so the
   endpoint is the law and the ratio follows from the count.
3. **A bound can fail the very examples it certifies.** "sat ≤ 0.07 — both hexes
   comply" — computed HSV sats are 0.077 and 0.090. And name the FORMULA: HSV and HSL
   saturation disagree by up to 0.03 on these hexes (0.090 vs 0.114). A colour law
   without a formula is two laws.
4. **A trivially-satisfiable assert is no assert.** "Height-matched handoff" was
   satisfiable by a dead 0.034u crest; a contract key (`serrationTopAt`) is only as good
   as the schedule feeding it.

**The gotcha.** Auditors miscompute too: this round's audit claimed the exempt
`slagBand` hash "already satisfies" all three new duty-break bounds — but
`((i*7+3)%5)<3` yields F,T,T,F,T, which has SINGLETON lit runs and violates the min-run
≥2 bound. We adopted the bounds (they are right) and recorded the computed
contradiction plus the one-line retune (`((i*2+1)%7)<4` — duty 4/7, lit runs of 2).
Verify the fix list against arithmetic the same way you verify the code.

**The reusable pattern.** Before committing any number to a build sheet: sum every
series against the span it must cover; power every decay to its last element and check
it against the delete floor; evaluate every bound against its own certified examples
with the formula named; and pixel-convert every "split axis" (÷21px/u here) before
calling it a chase-distance read.

**What it unlocks.** The Fornax serration schedule is now buildable end to end
(17 vanes @ 0.32u over 5.13u, H 0.18→0.04 ×0.91, live 0.13u crest at the handoff), and
the sheet's gates fail for real reasons instead of failing on day one — or worse,
passing trivially.
