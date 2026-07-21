# Brineholm T7 eye exposure — the clip was the whole sclera, not the core (2026-07-20)

**What we did.** Track A #2 of BOSS-VISUAL-AUDIT: the flagship eye that both audit judges saw
as "a blown white crescent" at the rel-26 fight frame. Root cause in code, not in pixels:
`eyeMat` (the WHOLE sclera dome) was `toneMapped=false` with `EYE_BASE × EYE_HOT(1.5)` — every
channel >1.0 linear, so the entire eyeball sat past the bloom knee and clipped to white; the
iris ring behind it never survived. `CORE_HOT` was ×17 on top. Fix: **the sclera carries pale
VALUE (×0.85, under the knee), the core carries brightness (17→6, still saturates G1 off a
small sphere), the iris carries the hue (emissive 1.5→2.1)**. Plus the audit's polish sweep:
teeth split into two alternating emissive tiers with per-tooth width jitter (registry tell #2
— the picket), and the gill-rake boxes became flattened tapered blades (tell #12 — the
paddle-pops).

**What we learned (the gotcha).** T7 hides in the MATERIAL SPLIT, not the intensity constant:
an eye built as sclera+iris+pupil+core can still clip to a featureless ball if the *sclera*
shares the HDR path. When auditing a focal, check which MESHES are `toneMapped=false` and
above 1.0 — anatomy on the tone-mapped side of the knee is the part that survives. The
`eyeGlow` driver multiplies the same constants everywhere (entrance dim, leash, death), so
capping the constants re-grades every state for free — no per-state retune needed.

**What it unlocks.** The same one-line audit (`grep toneMapped.*false` + check multipliers ≥1
on area meshes) applies to the other five T7 carriers the independent audit flagged:
Stormrend's core, Eitherwing's pearl, Onewing's head lamp, Karnvow's cowl orb, Unmasked S1.
