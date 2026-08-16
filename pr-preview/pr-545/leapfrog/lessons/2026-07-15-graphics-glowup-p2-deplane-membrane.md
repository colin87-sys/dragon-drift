# Tempest glow-up P2 — de-plane the membrane: value-band the bays by billow depth

**What we did.** Phase 2 of the Tempest glow-up (the director pulled her item #4 ahead of the mass work:
with the cool rim landed in P1, the flat near-black membrane bays were the single biggest thing still
propping up a silhouette read). Checkpoint **4.3/5 APPROVED**.

**THE FIX — a membrane bay is not one flat tier; value-band it by billow depth.** The chiropatagium lofts a
membrane onto the strut spars; each bay was filled with ONE `boltTiers[i]` value → a flat dark plane, and
the inboard brachial was one large flat black triangle (DRAGON-DESIGN §2.1 "the big flat inboard triangle
whispers the plane"). Fixes:
- **Value-band each bay by where the cloth sits in the billow.** The taut ROOT (near the bones, catching
  light) gets a lighter tier; the deep ventral CUP toward the free edge falls to shadow (darker tier); plus
  the outboard bay gradient and a little index-hash jitter. One flat tier → a faceted value field (measured:
  ~4× luminance spread *within a single bay row*, L29 cups → L123 lit facets).
- **De-plane the inboard brachial** — add a SAGGED mid-ring so the flat triangle CUPS, and value-band it
  taut-inner/deep-cup and wrist→body. This was the strongest single win (a flat black triangle → a cupped
  multi-facet surface with a visible crease).
- **Deepen the per-bay scallop differential** so the aft bays sag much harder than the inner ones and the
  SIDE profile scallops between the fingers instead of collapsing to one flat sail.
- **Widen the value ladder to make the banding legible.** `boltTiers` was `[0.42..0.05]` toward a dim steel
  `0x6a7488` — too narrow, so the banding barely read. Widened to `[0.58..0.05]` toward a lit steel-blue
  `0x808ea8`. Value-banding only reads if the palette it draws from has range.

**The batching win — value-banding is FREE on draw calls.** Splitting each bay across up to 4 tiers sounds
like more draws, but the per-group accumulator batches by material, and there are only 4 `boltTiers` mats —
so the whole membrane is still ≤4 meshes per group no matter how the facets are assigned. Assign value per
FACE freely; the batcher collapses it.

**The anti-lantern line held.** DRAGON-DESIGN says the membrane "emits nothing — the frame owns the light."
The director wanted a "charged underside," which is in tension. Resolution: carry the charged read with
diffuse VALUE (the banding) + a hair of emissive (`0x0c1120`, ei 0.55) that stays *under* the anti-lantern
floor — dark cups still read dark where unlit (in-game median L~9–41), the frame still owns the light. A
"charged cloud" can be faked with value structure; it does not need the membrane to glow.

**Honest limit (logged for a later polish, not a blocker).** The membrane BULK median is still dark
(L~31–41): half the cloth sits near-black, so "charged" leans on a minority of lit accent facets rather than
a confident mid-value cloud body. Correct target under the anti-lantern constraint, but if a future pass
wants a fuller charged read: lift the deep cups ~10 L (or add one intermediate mid-tier between
`boltTiers[2]` and `[3]`), and deepen the inter-finger scallop dips ~20% so the swag reads at cruise
distance, not just in a zoom.

**Reusable takeaways.**
- De-plane a flat membrane/sail by value-banding its FACES by depth (taut = lit, cupped = shadow), not by
  adding geometry. A subdivided-but-uniform sheet still reads flat; a coarse sheet with a value field reads
  sculpted.
- Value-banding needs a palette with RANGE — widen the tier ladder first, or the banding won't read.
- Value-banding is free on draw calls when the renderer batches by material (few tiers, many faces).
- "Charged cloud, not a lantern" = diffuse value structure + emissive kept under the anti-lantern floor.
