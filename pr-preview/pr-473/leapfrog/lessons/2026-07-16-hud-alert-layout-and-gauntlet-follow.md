# The alert map is a contract: px floors under px furniture, top-anchored lanes, and a gauntlet that rides under the dragon

**What we did.** Three owner-hit real-play bugs became a full in-flight alert audit
(HUD-REDESIGN.md §G now carries the map). (1) **GAUNTLET FOLLOW** — the vitals cluster
now tracks the dragon's projected screen X: main.js projects `(player.x, player.y,
−player.dist)` per frame (the same seam the reticle/muzzle already use — dragon mesh
position IS that point) and `ui.gauntletFollow(sx, dt)` eases a `translateX` into the
anchor's transform (damping `1−e^(−7·dt)`, ~0.35s settle, sub-0.15px writes skipped,
`will-change: transform`, clamp = half-extent + margins + a live spell-card column
clamp read at ≤4Hz). Strictly visual; Y fixed; reset on `runStart`. (2) **BOSS-BAR
fill jank** — the drain-lag chunk froze into a giant stale gold slab under sustained
lance DPS; fixed by arming the 500ms delay **once per burst** and easing time-based.
Housing smoke 0.42→0.68; phase notches became inset bright ticks. (3) **Collisions** —
the milestone Bell toast printed across the boss bar, and the SHIELDED telegraph ran
through the spell card; fixed with a `hud-boss` px floor on the Bell and a top-anchored
portrait spell card below the telegraph lane's worst-case depth.

**What we learned — the reusable rules (now §G.2 of HUD-REDESIGN.md).**
1. **A percent anchor slides INTO a px band as the viewport shrinks.** The Bell at
   portrait `top: 20%` cleared the plate (ends ~157px) on a full 844px viewport — but
   the owner's real in-browser viewport is ~660–730px (browser chrome eats height),
   where 20% = 132px = INSIDE the bar. Any % lane that can co-occur with px furniture
   needs a px floor: `top: max(20%, calc(164px + env(safe-area-inset-top)))`. Test at
   390×660, not just 390×844 — the short portrait IS the real phone.
2. **Two ephemeral lanes deconflict by sharing one anchor line — and the line must be
   px-affine when the furniture above is px-sized.** The gauntlet multiplier's bottom
   is a px line (`64% + ~54px`); a %-only telegraph anchor (70.5%) compresses INTO it
   as the viewport shrinks. Portrait now anchors the lane at `calc(64% + 54px)` and
   the spell card at `calc(64% + 54px + 16vmin)` (the lane's computable worst depth:
   main + two-line wrapped sub ≈ 15vmin) — deterministic at every height.
   Bottom-anchoring the card (15%) made its top edge a function of viewport height —
   a collision generator.
3. **A FOLLOWING element's clamp must know its co-occupants.** Once the gauntlet drifts,
   anything sharing its vertical band becomes reachable (the landscape spell card). The
   clamp reads the card's live rect (≤4Hz, only when `.show` and vertically overlapping)
   so the cluster *glides out of the card's column as the card slides in* — a dynamic
   clamp beats a permanently narrowed band.
4. **Drain-lag arming: once per burst, never per hit.** `drainHitAt = now` on every
   damage tick means hits <500ms apart postpone the chase forever — the chunk pins at
   the burst's START fraction and reads as a broken bar. Arm only when the chunk is
   settled (`drainVal <= curFrac + ε`); ease time-based (`1−e^(−8·dt)`), not per-frame —
   headless/weak-mobile frame rates crawl a per-frame factor.
5. **Notches must read as TICKS, not GAPS.** Full-height dark dividers over a bright
   drain chunk split the bar into "broken segments"; a 1px bright hairline inset 1px
   top/bottom with dark keylines reads as a ruler mark on ONE continuous instrument.
   Same family: a 0.42-alpha smoked housing over a bright biome sky reads as a HOLE in
   the bar — the empty track needs ≥~0.65 ink to read as instrument, not absence.
6. **The Tally's worst-case depth is a load-bearing number.** The plate's portrait slot
   (top 112px) assumes 4 rows ≈ 105px; the race strip would have been a 5th row grazing
   the plate — during a boss it hides (`body.hud-boss .race-strip { display:none }`),
   and RIVAL BEATEN still rings the Bell. When furniture is placed "below X's worst
   case", every new row in X must re-check that arithmetic.

**Gotchas.**
- **Headless time ≠ real time under WebGL load:** the sim can run at a fraction of
  real speed — `input.tx = 1` for 3s may move the dragon 3 world units. For banked-pose
  captures, SET `player.position.x = ±10` directly (keep tx pinned so velocity doesn't
  recenter) and poll computed opacity before screenshotting toasts (transitions start
  late). And a forced worst-case scene at `health = 25` DIES mid-capture — pin health
  until the moment before the shot.
- The dragon mesh sits exactly at `(player.position.x, player.position.y + bob,
  −player.dist)` (dragon.js updateDragon) — no separate "visual position" to chase.
- CSS animations on the cluster's CHILDREN (g-deny shake, surge-fizzle, g-ignite) are
  safe under a JS-written container transform; anything animating the CONTAINER's
  transform would fight the follow — keep one-shots on children (the H4 lock-snap law).

**What it unlocks.** §G's inventory + rules make the next alert placeable by arithmetic;
the `_alert-*` capture pattern (boss + milestone + telegraph + card + banked dragon +
mid-drain, three viewports incl. 390×660) is the regression scene for any HUD change;
and `ui.gauntletFollow` is the template for any future avatar-anchored chrome (damage
arcs already ride the cluster and follow for free).
