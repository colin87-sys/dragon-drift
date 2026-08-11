# Revenant I1 — an enclosed hole needs a CONTINUOUS frame (a cage of discrete bones leaks)

**What we did.** Built `ossuaryTorso` for real: a vertebra beam (neck + dorsal files of a shared
`vertebraUnit`) + a **hollow rib cage** (arc staves bridging the dorsal beam to a ventral keel, with
true through-window voids between them) + the **Grave Heart** on the real transparent `coreGlow` hook.
The `--holes` metric drove every decision, and it caught a inverted ladder on the first render.

**The bug the metric caught — and the law it taught.** First render, the hole-fraction ladder came out
BACKWARDS: f0 (meant to be a *sealed* cage) read **14 holes / 11.7%**, f3 (all 6 windows *open*) read
**1 hole / 0.2%**. The exact inverse of the intent. Two root causes, one law:

1. **A hole is only "enclosed" if fill completely surrounds it — and discrete vertebrae DON'T.** My
   dorsal beam is a file of separate `vertebraUnit` centra with ~0.16 gaps between them. So the top of
   every rib window had a *break* in the bone, and the border flood-fill leaked straight in through that
   break → the open windows were background-connected, NOT enclosed → the metric (correctly) reported ~0
   holes. **The fix is a CONTINUOUS frame:** a thin dorsal RAIL strip spanning the whole cage z-span
   (mirroring the continuous ventral keel) so every window is bounded on all four sides — rail (top),
   keel (bottom), rib, rib. After adding it: f0 0.1% → f1 8.5% → f2 17.0% → f3 23.3%, monotonic, matching
   the §4.5 target `{0, .08, .16, .26}`. **A skeleton silhouette is not "some bones near a gap" — it is a
   closed loop of fill around each aperture. Build the frame first, then the openings read.**
2. **A "sealed" panel must fully OCCLUDE in projection, or its own edges become ring-holes.** My first
   seal was an inset triangle *fan* that didn't reach the window corners → it left a thin ring of
   background between the panel and the rib/rail → that ring flood-filled into ~14 tiny enclosed holes,
   which is why the *sealed* form read MORE holes than the open one. The fix: seal with a **full-cover
   quad** spanning rib→rib and rail→keel, held at a small +x inset so it's non-coplanar (§4.3) but
   projects over the entire window. Sealed ⇒ zero holes; open ⇒ the clean window. **An inset seal must
   be inset in DEPTH only — never leave a planform gap, or you've drawn a smaller hole instead of filling
   the big one.**

**The reusable instrument — `holeMetric()` is a design tool, not just a test.** It told me the ladder was
inverted before I looked at a single pixel, then confirmed the fix quantitatively (0.1/8.5/17/23.3%). For
any holes-in-the-fill creature, wire the metric into the build loop and read it every change — it is the
one gauge that separates "designed aperture" from "leaked gap" from "damage."

**Where a rib cage reads — and where it DOESN'T.** The cage windows are ribs in the x-y plane at each z,
so they reveal from the **side (23%)** and **rear-¾ (10.7%, clean 45–58px windows)** but go nearly
edge-on from **dead-astern (1.4%)**. That's correct and by design: the rib cage owns the side / banking
read; the **rear-chase through-holes are the WING BAYS' job (I2)** (§4.2 "every rear-visible wing-bay
hole ≥0.05"). Measure the torso gate on `--no-wings side` + `threeq`, NOT the pure rear tile — judging a
rib cage from dead-behind would wrongly call it solid.

**The Grave Heart on the real `coreGlow` hook.** Return the heart MESH as the torso's `coreGlow` (not
null like the I0 stub) → `dragonModel` skips the sprite and `dragon.js:1147` drives its
`material.opacity` (floor → boost-breathe → Surge blaze). Non-negotiables that make it work: the material
is **`transparent:true`** (the tick writes `.opacity`), it carries **`userData.base`** (the tick scales
THIS — I ramp it 0.31→0.65 with the `coreBlaze` ladder), and it's **`FrontSide` + `depthWrite:false`** so
it stays ~single-layer along any ray (the §4.4 overdraw law) and composites through the bone. Sized well
inside the ribs (≥0.08 clearance) so it never z-fights a stave. In the black-fill silhouette the heart
counts as opaque fill (the rasteriser ignores transparency), so I seated it at the cage centre where a
near rib occludes it in pure side view — it doesn't plug a window; in colour it glows THROUGH the side
windows (a lantern, not a lamp — that tone read is the PR-preview Fable gate's call).

**Draw-call discipline held.** `vertebraUnit` and every rib/seal/rail APPEND into four per-tier tri
accumulators (`bone` / `dorsal` / `recess` / `keel`) → **4 `flatTriMesh` for the entire torso**, never
one draw per vertebra (the Pearl 253-draw lesson). Apex torso ≈ 820 tris; the full model 844→872 across
the ladder, 0 over budget, and creaturestress peak unchanged (revenant Eternal 26 overdraw vs phoenix's
56). The existing roster stayed byte-identical (comm-diff: zero changed rows) and `wingsymprobe` held
Δ0.000 because the attach contract numbers were preserved verbatim from the I0 stub.

**What it unlocks.** I2 builds `phalanxShroudWings` for real against a torso that already publishes the
cage + heart + attach contract — and the wing-bay through-holes it adds are what carry the SKELETON read
into the rear-chase tile, the one angle the rib cage can't. The `--holes --wings-only` frame is already
waiting to gauge them.
