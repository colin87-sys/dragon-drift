# Tempest Reach — a peak-locked prop's step MUST divide WALL_WINDOW (recycle-tiling determinism)

**What we did.** A Codex PR review caught a P2 in `scarpwall`'s per-side peak lock: at wrap boundaries two
massifs could render overlapping. Root cause + fix below. Step 170 → **150** (150 divides WALL_WINDOW 900);
verified 0 double-keeps / 0 both-flanks over 3 biomes; all gates green, composition unchanged (still one
massif per congregation, alternating banks).

## The gotcha

The scarpwall keeps a massif iff its slot is within `±step/2` of its bank's congregation peak. Slots start at
`i·step + jit·step − 100` and RECYCLE by `dist += WALL_WINDOW` (900) as the player flies. If `perSide·step`
(= `ceil(WALL_WINDOW/step)·step`) ≠ WALL_WINDOW, the slot lattice is **not stationary under the wrap** — it
DRIFTS by `WALL_WINDOW mod step` each recycle. At step 170: 6 slots span 6·170 = 1020, but the window is only
900, so the wrapped lattice has a **50 m gap** at every boundary (…665, 835, [gap], 885, 1055…). Where a peak
lands near that gap, BOTH the 835 and 885 slots sit within ±85 → **two overlapping 80–110 m massifs on one
flank**, once per ~900 m. Pure per-instance park logic (each slot tests only itself) cannot see the collision.

## The law

**A peak-locked-with-a-window prop whose slots recycle by WALL_WINDOW must choose `step` so
`perSide·step === WALL_WINDOW`** (i.e. `step` divides WALL_WINDOW — 900 → {150, 180, 100, 300…}). Then the
slot lattice is periodic at `step` across every wrap, and a `±step/2` window contains **exactly one** slot
(the next slot is exactly `step` away = at the excluded boundary). This is why the Frozen/Mire heroes work:
their period (300) divides WALL_WINDOW (900) — the tiling was load-bearing, not incidental. `gold-determinism`
CANNOT catch this (env props roll their own stream); prove it with a standalone lattice+lock simulation over
several wrap windows, checking for any two kept slots < ~1.3·step apart.

**Also verify the cross-bank window.** Same-bank double-keep is killed by the tiling. BOTH-flanks (a left and
a right massif at ~the same dist = a slot-canyon) is a SEPARATE risk: it's excluded iff the min cross-bank
peak spacing exceeds the window width. Tempest: left peaks `seg·(n+0.18)`, right `seg·(n+0.60)` → min
cross-bank gap `0.42·375 = 157.5 m` > the `2·(step/2) = 150 m` window at step 150. So no slot can sit inside
`step/2` of both a left and a right peak → the banks never share a massif. Pick `step` so the window
(`= step`) stays **below** the min cross-bank peak gap, or you trade the double-keep for a both-flanks wall
(step 180's window is 180 > 157.5 → it would reintroduce a slot-canyon; 150 is the safe divisor).

## The reusable check

Enumerate `i·step + 0.5·step − 100 + w·WALL_WINDOW` for all `i, w`, both banks; keep where
`|dist − peak(dist,side)| < step/2`; assert no two kept entries < ~1.3·step apart. Fails loudly at 170,
clean at 150. Ship the sim in the PR — it's the only gate that sees an ARCHETYPES recycle-tiling mistake.
