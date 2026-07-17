# Recess depth, gap-drums, and tri-array draw-call merges (Revenant polish pass)

Polish pass after The Haunting's 4.20 Surge gate, on the two non-blocking follow-ups (recess the
eye, fix the tail glow) + a draw-call minimisation. Fable pre-assessed the plan, I built, Fable
gated. Transferable gotchas:

## A recessed emissive has a narrow depth band — too deep dies in the no-bloom studio
The eye was a flat lime diamond riding the socket opening — a decal. The fix is to seat the
emissive *inside* the orbit so the ivory rim lip occludes it (that occlusion IS the "glow from
within" read — don't fake it with brightness). But there's a trap: seat it too deep and the
**near wall of the dark socket cup fully occludes it** from 3/4 angles, so in the bloom-less studio
the eye reads as pure black (probe: 66 grave-green px — dead). In the *live* game bloom would spill
it out, but the studio gate judges the crop, so it has to read there too. The working band was **at
the socket mouth, just behind the rim lip** (`ez + S(0.05)`, not `ez + S(0.14)`) with a *small*
glow-disc (not one that fills the whole orbit — a big disc is what read "decal"). Result: 574 px, a
green coal clearly inside an ivory-rimmed void. Tune recess depth on the zoomed head crop, then
confirm it survives at the small-in-frame tiles. And make the ember an **irregular jittered lump**
(reuse the Grave-Heart index-hash), never a clean octahedron — a perfect facet reads "gem/decal,"
a lump reads "coal."

## Tail lantern-law: fill the GAP between vertebrae, don't stack a bump on top
Spikes/nubs rising off the dorsal ridge read as specks painted ON the bone (lantern-law fail) no
matter how you orient them. The fix that finally read: a short emissive **drum** (8-sided band on
the tail axis) centred in the inter-vertebral GAP, radius held **UNDER the vertebra flange**
(`0.82 × the centra half-width`) so the ivory centra fore & aft occlude its rim — what survives is a
green slit flashing *between* two bone segments, i.e. light escaping the gap, and it reads from top-
planform / rear-chase / side at once with no billboard. Hard rule: if the green ever forms the tail's
outer **silhouette**, you've built glowing vertebrae (inverse-lantern) — keep the drum under the
flange. Decay the trail by geometry (radius tracks the shrinking centra aft), not per-drum intensity
(one pulsed material can't vary intensity per instance, and per-drum materials would cost draws).

## Merge draw calls by concatenating the tri arrays — no BufferGeometryUtils needed
`flatTriMesh` takes an array of triangles, so the cheapest, safest merge of two same-material meshes
is to **concat their triangle arrays and call `flatTriMesh` once** — the output is byte-identical
(flat-shaded non-indexed soup, lossless under concatenation), no `mergeGeometries` import. Two hard
guardrails: (1) merge only within **one material INSTANCE** — the flare/pulse system lives in
`material.userData`, so the 3 dorsal gap-leak buckets stay 3 materials forever (merging kills the
tail→head wave); `boneLit`/`ventMat`/`tailGraveMat` each stay their own. (2) Merge only within **one
bone/subtree** — the wing `arm` (on `mid`) and `hand` (on the wrist-fold `tip` pivot) are different
subtrees, so the arm's two membrane sheets merge but the hand's chiropatagium can't join them; the
static skull (teeth+rims+horns) merges but the **hinged jaw** stays out. Verified the merge is
invisible: silhouette pixel-diff **0**, `wingsymprobe` Δ0.000, tricount unchanged. A transparent
merge shifts the internal triangle sort, so expect a few hundred px of shimmer at overlapping
alpha edges (near-coplanar dark-on-dark → negligible) — the *opaque* merges are truly pixel-identical.
Net: **43 → 38 drawables, 10 → 8 transparent**, zero visual change.

## Process
Fable pre-assessment PLAN (ranked items + quality bar + risk + checkpoint per item) before touching
code paid off: it named the over-recess risk in advance, so when the probe showed 66 px I knew it
was the predicted failure and where the band was, not a mystery. Sequence: land the two visual items
(each its own checkpoint render) FIRST, then merge draw calls LAST on frozen geometry (merge once, or
you re-merge every edit). Gate the whole pass with a fresh harsh critic on cruise+surge.
