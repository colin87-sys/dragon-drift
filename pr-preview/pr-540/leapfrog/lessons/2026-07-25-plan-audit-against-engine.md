# 2026-07-25 — Audit the PLAN against the engine, before a single tri exists

**Did / learned.** Gated the Fornax fire-wyvern art-direction plan
([`reforged/FIRE-WYVERN-BUILDSHEET.md`](../../reforged/FIRE-WYVERN-BUILDSHEET.md)) with an
INDEPENDENT auditor — a fresh spawn, never the author — pointed not at renders of the creature
(none exist yet) but at **the shipped engine and real chase-cam captures of shipped dragons**.
Verdict **REVISE 3.4/5**, five blocking defects, every one of them invisible to a reader of the
plan and fatal to a builder of it. Two defect CLASSES are worth naming because they will recur on
every future creature:

1. **The stale-roster collision.** The plan's distinctiveness table judged Vesper by its
   *build-sheet title* ("scallop lobes") — but `dragonVesper.js:358-374` ships a fingered bat wing
   with a carpal knuckle, five dominant-and-decaying finger bones, a propatagium (`:413`), a thumb
   claw and a dropped underside surge-glow (`:458`), and Vesper has no forelimb builder at all
   (`:274-278`) — already a de facto wyvern. The "new" hero wing was the shipped hero wing minus
   one finger, in amber. **A distinctiveness gate run against build-sheet prose instead of source
   is not a gate.**
2. **The renderer-fiction.** The plan specced a 6:1 halo carrying the hue. Bloom here is ONE
   full-screen threshold pass (`postfx.js:382-384`), the house deliberately *suppresses* it during
   Surge (`:583-589`, the no-cream law) — exactly when the signature FX fires — and detail tier 2
   disables the composer outright (`:453-457`), so the weak-mobile floor has **no bloom at all**.
   The plan's entire glow architecture silently degraded to nothing on the tier it must ship on.

Three smaller ones generalize too: `DoubleSide` emissive is not per-face-side, so a lit membrane
underside lights the TOP and breaks a dark-top law — and the shared rig adds `+0.7` emissive on
every **boost** (`dragon.js:1970-1990`), so the law breaks outside Surge unless the top registers a
black `wingMembraneEmissive`. A 0.85× tip-shortening "named asymmetry" is **2–3 px** on a ~180 px
dragon — invisible, yet it sat in the rear-chase sentence with a residual asking the owner to judge
it on the PR preview. And "budget it in the shop build" assumed a shop-vs-game LOD split that does
not exist (`modelDetail.js` is device-scoped, not context-scoped).

**→ Systematize.** Add a PLAN-AUDIT gate between the build sheet and I1, and give it three
non-negotiable inputs: **the source of every dragon it claims to differ from**, **the renderer/post
stack it makes pixel claims against**, and **a real capture at gameplay distance** for anything
claimed to "read". The rule that falls out: *a claim about the roster is checked against code; a
claim about pixels is checked against the post-FX chain; a claim about legibility is checked against
a capture at the judged distance.* The measurement that settles the last one cheaply — **Vesper spans
~180 px in the real chase frame** — turns "will it read?" from taste into arithmetic: a feature
smaller than ~1% of that span is turntable-only, and saying so in the sheet is honesty, not defeat.
Also: make the auditor rule on what the author REFUSED to change, not just on what it changed.

**→ Leapfrog.** The whole round cost zero geometry — the Tempest needed ~9 critic rounds *after*
building. Auditing the PLAN converts those rounds into paragraph edits, which is the cheapest
possible place to discover that your hero feature already ships on another dragon. Two reusable
artifacts came out: the buildsheet now carries a **§13 audit log** (verdict, blockers, what changed)
so a future session sees the plan was gated and what it cost, and the honesty items — the hero
membrane underlight is **pose-gated** (the chase cam sees dark wing tops; the underside shows only
at bank, flap transition and partly in the high-V) — are now stated in the sheet instead of
discovered at gate 3.
