# Revenant — a "dark shroud" must stay dark under the GAME light, and a fenestra needs a dark FLOOR

**Context.** Fable 3.83 (up from 3.75): all identity blockers dead, HEART/LANTERN 4.5, veto+firewall
clear. The three remaining were finish defects on the shipped rear-chase view — a "one wing pass" gap.

**1. A dark-albedo membrane is not a dark shroud — measure it UNDER the game light.** The membrane
albedo was `0x2c2d31` (luma ~45, looks dark in the swatch), but at the rear-chase money cam its
rear/under-facing facets caught the fill light and lifted, so the wing zone measured **52% pale / 18%
charcoal** — the "wings are a DARK SHROUD" law *inverted* in the one view that ships. A MeshStandard
surface's rendered value = albedo × lighting; a mid-dark albedo under a bright key lands mid-gray. To
hold a value law you must clamp the albedo low enough that *even the lit facets* stay under the target
(dropped to `0x1d1f23`, roughness 1.0 so no sky sheen). This does NOT re-trigger the old "black slab
swallows bone" fail — that was about silhouette AREA (bone still wins 62–67%); darkening VALUE only
sharpens the pale-fingers-vs-dark-membrane contrast. Two different levers: area vs value. Grade value
laws on the game-lit tile, never the albedo swatch.

**2. Bright rim-catch caps on the finger bones read as SHARD CLUTTER at the money cam.** The fingers had
little pale "rim-catch" cap facets at the knuckle. At turntable distance they're a nice highlight; at
rear-chase they stack with the opposite wing's caps + the scapular cowls into an unreadable pale/black
triangle salad that breaks the finger-ray count. Dropping the caps (clean ridges only) restored 3–4
countable finger rays. Small highlight facets are a distance-dependent bet — they sharpen a close read
and clutter a far one; when the ship camera is far, cut them.

**3. A fenestra is a HOLE only if its floor falls to shadow — a shallow inset is a painted crack.** The
first skull pockets were rim→floor cups in the umber `recess` tier (luma ~65) and shallow — Fable read
them as "thin painted decals," and at side-profile game distance the skull reverted to a smooth wedge.
Fix: (a) push the floor point ~2× deeper into the cranium so it self-shadows, (b) widen the orbit +
temporal pockets ~2×, and (c) give the floor a **dedicated near-black material** (`0x0e1113`, envMap 0)
so the interior renders < 40 luma — a true void, not a facet. A recessed void needs BOTH depth (to
catch shadow) and a dark floor material (so even lit it stays black).

**Still additive.** Roster byte-identical, starters 286/0, wingsym Δ0.000, 1519/6000 tris. Also banked a
cwd gotcha: the tools live in `reforged/` — a stray root-cwd run makes tricount report the *root*
project (29 models) and dragonstudio crash on the bare `three` import; always run from `reforged/`.
