# 2026-07-25 — Fornax I0: wire the rig conventions before there is any art to hide them

**Did / learned.** First increment of the Fornax fire wyvern: a new self-registering
`dragonFornax.js` (four contract-satisfying blockouts), the `fornax` def, and a generalized
`seamprobe`. Deliberately zero spectacle. The lesson is about WHAT an I0 is for.

**The stub is not a placeholder for the art — it is a placeholder that already carries the
RIG.** The wing is a real 3-segment `pivot→mid→tip` cascade with the −anchor wrist compensation
and an OUTER `lmirror` wrapper; the tail is a real nested `isBone` chain; the legs are a helper
inside the torso. None of that is visible in a blockout, and all of it is load-bearing:
`wingsymprobe fornax` returns **Δ0.000 across all five flap poses with the Y-bands moving pose to
pose** — i.e. the mirror is correct AND the rig is driving real joints. Vesper once shipped a
1-bone plank with every probe green because the rig was rotating an EMPTY group; getting that
proof at I0, when the wing is three boxes, costs nothing and is unfalsifiable later.

**The guard trio belongs in the DEF from commit one, not with the fire at I4.** Three laws the
shared rig breaks *by default* the moment a key exists: `setFeverTint(def.feverWash || null)`
falls back to MAGENTA and fires on `surgeStart`; `feverWing` and `wingMembraneEmissive` are what
the rig's unconditional `+0.7` boost term multiplies, so without them the wing TOPS glow on every
**boost** — outside Surge entirely, breaking the dark-top law where nobody is looking for it. A
dragon whose identity is "withheld light" can violate its own central law for four increments
before anyone renders it.

**→ Systematize.** Two patterns generalize past this creature. (1) **Prove coexist, never assert
it**: hash `tricount` before and after, and diff — every shipped row was identical and only the
summary line moved. A comment saying "additive, roster untouched" is worth nothing; a diff is
worth everything. (2) **A gate hardcoded to one dragon's identity is not a gate.** `seamprobe`
hardcoded Vesper's ion-blue as *both* the marker that finds seam materials and the 210–240° band,
so it could only ever validate Vesper — any other accent read as FAIL regardless of correctness.
It now reads `def.accentHue` (a field that already existed) and derives the expected band by
running that accent through the *same* surge math, wrap-safe because a fire accent sits near
0°/360° where a naive `lo ≤ h ≤ hi` band silently fails. Vesper's result is unchanged. **Check
the house tools for other single-identity hardcodes before trusting a green.** Corollary, learned
by doing it: every new assert was verified to FAIL when violated — a firewall nobody has seen
fail is a comment.

**→ Leapfrog.** I1 (the char-plate anvil) can now be judged on surface alone, because the frame,
the mirror and the joint chains are already trustworthy — the critic rounds get spent on craft
instead of on rig bugs. Three gaps are recorded rather than papered over: the tri ladder is flat
across f1–f3 (the real ladder is I5, by subtraction from the apex), the ±7° leg oscillation has
no rig-loop owner yet, and `run-all.mjs` bails at the first failure — `_diag-rock-caps.mjs` fails
on a clean tree, so it masks everything after it and core tests must currently be run
individually. That last one is a latent trap for any session that reads a red `run-all` as "my
change broke it."
