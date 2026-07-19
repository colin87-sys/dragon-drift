# Drowned Forum PR-7 — the `arena`: making a curved amphitheater READ from a low water camera (the sightline-first rebuild)

**What we did.** Built the biome's CROWN landmark — a broken curved amphitheater arcade (2 stacked round-arch
tiers under a level blank attic, flooded-gold apertures) — appended at the END of ARCHETYPES, forumdark, no
glow, 150 tris. It took THREE sightline blockouts and a Fable technique-redirect to get it legible, and every one
of those rounds taught a transferable law about the low-near-water portrait camera. The concept was never the
problem; the PRESENTATION CONTRACT was. **PASS: Fable FORM 4.3 / in-context 4.4 (both stages over the 4.2 bar) —
`arena-v3-00.png` is "an amphitheater and nothing else in the roster."** One polish spent in the same round: the
arch heads went 3→5 segments (Fable's #1 note — on a repoussoir-silhouette prop the aperture SHAPE is nearly the
only thing carrying "Roman round arch"; a 3-seg flat-chord apex read as a trapezoid notch), the far broken bay's
stylobate trimmed to hold the 150 cap (the sea took that corner — ruin logic doubling as the sanctioned far-bay
trim).

**THE CORE TRAP: a curved wall seen FRONTALLY from a low camera silhouettes as a single ARCH (croquet-hoop).**
Blockout 1 (concave "look into the bowl," the pre-assess's first guess) and blockout 2 (convex 2-tier exterior)
BOTH collapsed, from the cruise camera, to one big arch framing a boxy interior — and the calm-water reflection
closed it into a full ring (the kill-list's #1 forbidden read), with the boxy interior pareidolia-ing into a face.
The TOP-PLAN studio tile read as a gorgeous ellipse both times — **but the player never sees the top plan.**
Plan-curvature is essentially invisible in elevation from a low camera; do not build a read the play camera can't
see. (Verify-before-claiming: the studio top-plan is a LIAR for a ground-camera game — gate on the cruise frame.)

**THE FIX IS PRESENTATION, NOT PLAN: rake it oblique like the aqueduct, and the bend survives as an APERTURE
GRADIENT.** The one studio tile that read as an amphitheater was the OBLIQUE one (yaw ~60°). The aqueduct already
proves a raked receding rank of arches is the low-camera-legible read; the arena is that, CURVED. But the curve
itself doesn't read directly — what reads is the **aperture-aspect gradient**: on a straight rake every receding
bay foreshortens at the same rate; on a BENT wall the presentation angle changes monotonically along the rank, so
the bays progressively close toward slits as they recede. **That gradient IS the bend — the only version of it
the camera can see.** So: near modules present at ~35–45° (open, both tiers read), far end bends AWAY into fog
(closing bays + keeping the footprint off the lane). The place() rake is `rotY = base + side·0.96` (~55°); the
old `±0.09` "slight yaw" was a frontal rounding error that engineered the prop to be seen at the single worst
angle — a comment that lied to itself.

**THE STAGE-FLAT TRAP: raking a wall built from only outward quads trades the hoop for FLAT-TAPE piers.** The
catch that would have cost a whole round (Fable caught it in the FORM sheet's near-empty SIDE tile): my wall was
all `outQ` outward-facing quads — a stage flat, invisible edge-on. Raking a stage flat 55° slides it straight from
"facade" toward "paper tape" (the AAA cheap-tell). The aqueduct survives its rake because its piers have DEPTH
RETURNS. The fix: every pier on BOTH tiers gets a jamb reveal (an OUT→IN radial return, ±1.5 object ≈ 3-world) on
both bay edges — so the raked wall shows pier side-thickness and reads as MASS. **Any wall you intend to present
obliquely must carry depth on the faces the rake exposes, not just the face-on plane.**

**THE LOAD-BEARING "AMPHITHEATER not AQUEDUCT" TELL IS THE STACKED DOUBLE REGISTER + DUAL APERTURE FLIP.** Both
props are "a rank of round arches with light through the bays"; at 45+ units in fog they're the same object, and
at far range the forumdark repoussoir LIFTS to sky value so the aperture flip dies — leaving only the silhouette.
Ranked by fog-survival, the differentiators are: (1) the **two superposed arcades under a crowning band** (the
Colosseum icon; nothing else in the biome stacks arcades; reads in silhouette at any rake) — build this HARDEST;
its free bonus is the **dual aperture flip**: ground bays spring low (5 world) → frame GOLD water/fog; upper bays
spring high (16 world) → frame SKY. Gold-below / sky-above stacked is unfakeable (the aqueduct is one register of
sky). (2) the **LEVEL blank attic** — the anti-droop/anti-hoop silhouette insurance (a 108° arc forced a mid-span
droop that read as an arch; a ~80° arc holds a level top, with the shear confined to the ONE far terminus). (3)
the bend (aperture gradient) — mid-range only. (4) gold-not-sky bays — near/mid only, dead beyond ~100 world.
Upper arches must be TRUE semicircles ALIGNED over the ground bays with spans CLOSE to the ground spans — shrunken
upper arches read as "punched windows," not a second arcade.

**THE −Ax SHIFT lets a big curved mass sit NEAR without crossing the lane.** The build is shifted −Ax in world x
so the convex near-tip sits at object x≈0 and the arc RECEDES to −x (away from the lane, into fog). So a ~90-world
curved footprint places at |x| 52–62 (a near crown among the walls) with its inner edge still clearing the fatal
lane — the mass grows AWAY from the player, not toward them.

**PROCESS: the sightline blockout is a REAL gate, and a mid-build Fable redirect is cheaper than three tuning
rounds.** Fable's pre-assess mandated "tiershot the bowl sightline before spending detail — the geometry
determines everything." It did: two blockouts killed two orientations for the cost of a studio sheet each, and
the redirect (with the four numeric pass-criteria: level top / ≥3 aperture columns with an aspect gradient / two
registers distinguishable / no bay >40% of prop width — the FLAP-DESIGN "trust geometry over pixels" law applied)
turned "it looks wrong" into a checkable spec. When two attempts hit the same wall, CHANGE TECHNIQUE and bring the
art director the evidence — don't tune a third time.

**What it unlocks.** The oblique-rake + aperture-gradient recipe for reading a curve from a ground camera; the
stage-flat/depth-return law for any obliquely-presented wall; the stacked-register + dual-aperture kit for
distinguishing two arch-props; the −Ax near-crown placement shift. Reusable for the `nymphaeum` (curved apse) if
it's ever built.

**Verify:** `HERO=arena node tools/_arena.mjs` (controlled low lane-side oblique — the shipping rake; #hud hidden)
+ `node tools/_arenacruise.mjs` (natural chase cam, the real cruise read) + `node tools/_forumstudio.mjs <r> arena
47 42 0.96` (raked FORM sheet — audit the SHIPPING presentation, never the frontal view). gold-determinism
byte-identical (the arena + `forumArenaAt` gates are pure render-gates), biomecycle 12/0, envcount 124 tris,
tricount 0 over, bulletcontrast green.
