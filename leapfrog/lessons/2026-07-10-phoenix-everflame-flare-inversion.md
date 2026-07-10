# Phoenix Everflame — a BRIGHT fire-body built by INVERTING the caldera's value polarity, not its plumbing

**Did.** Shipped the Phoenix Everflame (`phoenixEverflame`) — a fresh Eternal-tier BRIGHT fire-body
phoenix, the exact INVERSION of the Molten Phoenix (`PHOENIX-EVERFLAME-BUILDSHEET.md`). New file
`js/dragonEverflame.js` with four self-registering parts on the FLARE system ("light field, dark on
the rims"): `everflameTorso` (luminous keeled teardrop + furnace-keel line → F0 keel-star), `flareCascadeWings`
(the HERO — an inboard flame-BLANKET + an outboard cascade of aft-up-raked flame TONGUES), `blazeCrestHead`
(luminous goldfire wedge, garnet beak, backswept crest licks), `sparkRibbonTail` (twin high-lateral
ember-diamond ribbons). Roster def coexists with `phoenix` + `phoenixMolten` (byte-identical); the
f0→f3 ladder is "the fire CATCHES" (garnet fledgling → kindled → goldfire blaze → full Everflame),
every dial monotonic. Full gauntlet green (tricount 0-over, starters incl. the corridor + NaN + ladder
block, defs 7-SSSR, blueprint, smoke, wingsymprobe 0.000, dual-sky + real chase-cam framecap).

**Learned — the load-bearing move is to copy the CODE and invert the LOOK.** The molten builder
(`calderaMats`/`loftRings`/`creasedKite`/the rig+attach contracts/the exported wing profile) is the
right skeleton; the *only* thing that makes Everflame a different creature is the VALUE POLARITY. So
`everflameMats` is `calderaMats`'s structure with the two-values-per-facet flipped: molten got relief
from light-in-groove / dark-on-ridge (a dark body, fire in the seams); Everflame gets it from
**lit-FIELD / dark-RIM** (a bright body, garnet only on the edges). Same 5-tier ladder, same VALUE-GAP
LAW (body field capped ~0.6, a tier below the keel-star/tip accents so ACES+bloom keeps the 3 fire
hues separable), same surge mechanism (tiers in `spineMats`, the F0 whitegold register OUT of it). The
build landed ~right on the first render because none of that machinery was re-litigated.

**Gotcha #1 — the fledgling glowed because the wing-blanket used a FIXED goldfire, not the stage-field.**
First render: f0 was supposed to be "a garnet fledgling, one thread of keel-fire," but its stub wings
lit up dull-gold while the body was correctly dark. Cause: the flame-blanket material was `M.goldfire`
(intensity-laddered only) instead of `M.bodyField` (whose HUE slides up the ignition ramp: garnet →
flame → goldfire). The fix is the design principle stated literally in code — *"the fuel and the fire
are ONE body"* means the blanket must be the SAME material as the torso field, so it darkens with it at
f0 and ignites with it at f3. Reusable rule: **any surface the sheet calls "continuous with the body"
must share the body's stage-tracked material, never a parallel fixed one — or the ladder desyncs.**

**Gotcha #2 — a smooth filled sheet reads as a KITE; a garnet SEAM + scalloped HEM makes it read as
fused FLAME.** The inboard blanket is a genuine filled mass (the anti-"firework-of-thin-sparks"
firewall), but a clean 2-band quad-strip read as a paper delta in the top-planform. Splitting it with a
thin garnet seam between the two fused tongues + scalloping the trailing hem into 3 lobes (a
`sin(t·π·3)` chord-fraction wobble) converted it to "fused flame" with zero meaningful tri cost. The
ORGANIZED-RANKS law again: the read comes from *articulation you can name*, not tri count (apex is a
lean ~1.15k).

**Gotcha #3 (carried, held) — the aft-up rake is what satisfies BOTH the spectacle and the corridor.**
The streaming fire lives in the wings raked aft-AND-up (`flareCascadeY` = a concave-cupped
`(1−cos)^0.7` rise, exported once and shared by the geometry AND the FX tip marker). Because every
tongue that reaches aft (`z>hip`) is also high (`y≥spine`), the Visibility-Law corridor assert
(`max|x|≤0.6`, footprint≤1.3, every form) passes *for free* — the fire points at the empty upper
corners while the lower-centre stays clear. The reference motion survived by being translated into
RAKE, not length. (Surge = "Flashover" ships as tier-promotion-only via `spineMats`; the ribbon-lengthen
/ fray-double `surgeStretch` had no clean flight-tick hook, so it's deferred + flagged for the owner,
exactly as the sheet permits.)

**Meta (banked, saves a stash next time).** `badges.mjs` and `economy.mjs` are RED on the base commit
in this environment — `badges` times out on `.shop-grid` (headless shop-grid flake, same as the molten
CP3 lesson noted) and `economy`'s "one-time pools bounded" assert fails on data no dragon touches. Both
fail identically with the working tree stashed, so **verify a suspicious test against `git stash -u`
before blaming your diff** — it took two 90s stash runs to prove neither was mine.

**→ Unlocks.** The FLARE material factory + the flame-tongue atom (`flameTongue`: S-taper, centre
crease for two values, root→tip hue-step, frayed tip) are a reusable BRIGHT-fire kit, the mirror of the
caldera's crust kit. Any future light-bodied ember/solar creature can copy `everflameMats` + `flameTongue`
the way this copied `calderaMats` + `crustShard`. The roster now has the full dark↔bright phoenix pair
(molten crust-in-seams vs. everflame fire-as-body) proving the value-polarity axis is a real
distinctiveness lever, not a re-skin.
