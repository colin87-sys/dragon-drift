# Drowned Forum PR-2 (hazard) — reskinning the Phase Gate as the Sinking Triumphal Arch

**What we did.** Reskinned the shipped biome-0 `gate` obstacle (the fresnel Phase Gate) into a sunken-Roman
toll-arch, under `?props=forum` only. The deadly veil becomes travertine masonry; the safe bay is framed as
a gilt arched portal (pilasters + a bold voussoir ring) with a magenta keystone toll telegraph; every
safe-route affordance is kept. Committed; the shipped gate is byte-identical everywhere else.

**THE COLLIDER IS GAP-MATH, SO A RESKIN IS FREE — verify this first for any hazard.** `collision.js` tests
the gate purely against `c.gapX/gapY/gapW/gapH` (`|p.x−gapX| < gapW−0.5 && |p.y−gapY| < gapH−0.5`); the mesh
never enters the test. So swapping the mesh cannot change difficulty — "colliders byte-identical" is true by
construction, not by careful matching. Confirm the same for pillar/shard/bar before reskinning them.

**A Phase Gate is a FULL-LANE WALL with a small hole — so the reskin is a wall-GATE, not a freestanding
arch.** The deadly region is everything except a fixed 7.6×6.8 bay that floats to an arbitrary `(gapX,gapY)`.
You cannot shrink the masonry to a bounded triumphal-arch silhouette — the uncovered lane would look safe but
kill. So the visual must cover the whole span (a city-wall/gate facade), and the "arch" read has to come from
DRESSING THE BAY: gilt pilasters flanking it + a bold gilt voussoir ring over it + a magenta keystone at the
apex = "a framed arched portal in a sunken wall." A faint ring alone read as "a window in a slab" (round 2);
the framed portal read as a toll-arch (round 3).

**Keep 100% of the safe-route affordances — fairness is not the place to be creative.** The Phase Gate's
readability (aperture frame + corner brackets + core-glow + beacon) is tuned and proven. The reskin ONLY
swaps the deadly barrier's material and adds decoration; it retints the affordances warm (cyan Sanctuary →
gilt) but never removes or moves them. The bay collider is unchanged, so the decoration must sit OUTSIDE it
(the ring/pilasters are proud of the wall, never narrowing the gap).

**Backlit flat masonry crushes to black — the hero's lesson, again.** First capture: the travertine wall
rendered as a solid BLACK slab (flat boxes, backlit by the dusk sun, low emissive). A plain gate material has
no ladder-emissive fold, so it needs a strong WARM emissive floor (0xbaa878 @0.5) just to read as stone
against the bright sky. Any large flat prop facing the low sun needs this or it silhouettes to black.

**Capture gotcha:** the full-game gate capture (`_forumgate.mjs`) stalls headless GPU readback at
1280×820 @1.4 — shrink to ~1100×720 @1.0 (the §9 canvas-size warning) or `page.screenshot` times out with
zero frames. Harden the health-pin to revert crash/damage state each tick (the parked player sits in the live
obstacle field). Gates are sparse, so probe several dists to find one ahead.

**Status:** PR-2 complete — hero (`triumphgate`, Fable 4.3) + hazard (gate reskin). Next: PR-3
(`viamarina` near-rail + `drumfall` foil), reusing the proven forum stone kit.

**Verify:** `?biome=0&debug&props=forum` (tools/_forumgate.mjs); node --check js/obstacles.js;
gold-determinism / envcount / bulletcontrast green; shipped gate unchanged (forum branch is `PROPS_FORUM &&
bi===0`, false in normal play and headless).
