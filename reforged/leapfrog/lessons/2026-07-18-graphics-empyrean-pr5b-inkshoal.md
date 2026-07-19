# THE EMPYREAN PR-5b — the inkShoal: a real flock profile (schooling ink-koi), not a reskin

**What we did.** Landed the biome's bespoke ambient fauna — a coherent SCHOOL of ink-violet koi — replacing
the interim reskinned bird-cone flock (biome 5 had only set the `fauna.color` 0x1a1424 on the shared 7-bird
circling geometry; PR-1's comment flagged "the bespoke inkShoal flock is PR-5"). This is the first "real
flock profile" of the fake-fauna cleanup the biome-overhaul plan calls for (§7: "kill the fake-fauna reskin
by introducing 1–2 real flock profiles per PR").

- **Gating = the optional-channel pattern, exactly like `flybyMix`.** New `env.shoalMix` (default 0), lerped
  from a per-biome `shoal` field over the SAME seam ramp `ts`; `shoal:1` on BIOMES[5] only. 0 everywhere
  else → the circling bird-flock renders byte-identical (guard suite green: gold-determinism 5✓, biomecycle
  12/0, skyprobe, bulletcontrast, appshell no-console-errors, envcount, propclearance, tricount).
- **A distinct geometry, instanced.** One koi = a faceted fusiform body (`OctahedronGeometry` scaled long,
  8 tris) + a tall-thin fanned caudal fin (`ConeGeometry(...,3)`, 6 tris), merged via `mergeGeometries` and
  instanced ×20. Fogged `MeshBasicMaterial` (like the birds/whale) so the dark koi are LIFTED by the opal
  fog toward the pale field — a soft dark drift, never a true-dark rivalling the Mote. Transparent so the
  school fades in over the seam via `shoalMix`; `depthWrite:false` (distant fauna must not occlude).
- **Motion = a school, not lazy circles.** All koi share ONE drifting cloud centre + ONE slowly-wheeling
  heading (that shared heading is what reads as "schooling"); each koi adds a small churn orbit (the cloud
  never freezes into a grid) + a whole-body yaw WAG (`sin(time*swimRate)` — the cheap instanced "swim":
  you can't deform a rigid instance, so the body wags side-to-side to imply the tail).
- **Hand-off, not double-flock.** In biome 5 the circling birds are hidden once `shoalMix>0.5`; the school
  update runs BEFORE the birds' `if(!birds.visible)return` early-out, or a hidden-birds biome would skip the
  school entirely. Byte-identity preserved: when `shoalMix==0` the birds' visibility follows the tier gate
  exactly as before.

**GOTCHAS (round-savers).**

1. **`mergeGeometries` needs both geometries indexed OR both non-indexed.** `OctahedronGeometry`
   (Polyhedron) is NON-indexed; `ConeGeometry` (Cylinder) IS indexed → merge returns `null`, my `throw`
   killed the boot, and `appshell` timed out at page-load (not an obvious "merge failed" message —
   it presents as a boot hang). Fix: `.toNonIndexed()` on the cone. Whenever you merge a polyhedron with a
   lathe/cylinder primitive, normalise the index first.

2. **The Mote sits HIGH-CENTRE, not low.** First instinct put the school "high ahead" (y≈33) assuming that
   cleared the Mote — it landed DIRECTLY ON the disc, dressing the biome's one sacred true-dark focal point
   with dark specks (reads as dirt/noise on the hero). The biome law "the Mote owns the darkest pixel / is
   the only dark thing" means **no other dark cluster may share the Mote's screen space.** Winning move:
   place the school in the OPEN SKY well OFF to one side (upper-right), clear of BOTH the Mote and the
   props. Horizontal offset clears the narrow central Mote (side-offset survives every FOV); but for the
   seed-placed SENTINELS the robust separator is ALTITUDE, not X — a player-relative flock will overlap a
   seed-placed prop unless it flies ABOVE all of them, and BOTH flanks carry a colonnade so you can't dodge
   sideways. Fly it high enough to clear the tallest elder at every pitch (final anchor y66; the graze
   survived y51). This cost a whole Fable round (R2 4.0: "gnats around a stone").

3. **Dark fauna reads cleanest DARK-ON-BRIGHT, in the clear.** Two failed placements taught this: (a) ON the
   Mote → koi vanish into the disc (dark-on-dark) and clutter it; (b) LOW over the water → the dark koi
   camouflage against the dark sentinel-stone bases (dark-on-dark again) and read as prop debris. The open
   luminous upper sky is the only field where a soft-dark koi silhouette separates — and it's the brightest
   field, so contrast is maximal. (Same family as the pearlshoal lesson's inverse: a PALE prop needs the
   dark backdrop; a DARK fauna needs the bright one.)

4. **FORESHORTENING, not scale, is why a distant flock reads as dust — the biggest round-saver.** R1 scored
   3.5 with Fable measuring 2–5px marks even though the koi geometry projected to ~20px broadside. Cause: an
   over-wide yaw wag (±0.5 rad = ±28°) plus a wide shared-heading swing left many koi pointing toward/away
   from the lens → a fish pointing at the camera collapses to a dot. The fix that mattered was CLAMPING the
   per-fish yaw to ±~13° of a broadside-biased shared heading (not growing the fish). Clamp first, size
   second. A still can't show "schooling" (motion does); the target for the STILL is just "a coordinated
   cluster of elongated fish-dashes, not dust": (a) per-fish size to read as an elongated mark (fauna
   `scale`×~4.8), (b) a TIGHT ellipsoid = one clump not a scatter, (c) FEW + LARGE (10, no tiny strays — a
   small koi at an odd angle is the residual "scribble" tell), (d) the tight heading clamp so they're
   profiles. The coordinated wheel + wag delivers "SCHOOL" in-game; judge the still for "fauna vs. dirt."

5. **Pin the FOV in the capture tool.** The speed-eased lens froze at anywhere 77–96° between boots, jumping
   the koi's apparent SIZE and position run-to-run and making size tuning impossible. `camera.fov=85;
   updateProjectionMatrix()` after the freeze gives a stable read. Tag the mesh `.name='inkShoal'` so the
   capture's diagnostic finds it by name, not a brittle `count===N`.

**Tooling.** Added `tools/_shoalshot.mjs` (boots biome 5, freezes, pins FOV 85°, writes cruise + look-up
frames + a 3× zoom crop on the school, and dumps camera + koi world positions for framing). One boot ≈ 90s.

**The gate convergence (3 Fable rounds) — the fixes that moved the needle.** Spawned on `model:'fable'`
per THE RULE (Opus silently passes what Fable revises), with exclusion masks (blue dragon, gold pickup
squares, rose-tipped sentinels) and the real 77–92° FOV noted:
- **R1 3.5 REVISE** — "reads as speckle-noise / mixed-angle scribbles, too near the Mote, near-black rivals
  it." The killer diagnostic was numeric: Fable measured 2–5px marks though the geometry was far bigger →
  the koi were FORESHORTENED (pointing at the lens). The heading CLAMP, not scale, was the real fix.
- **R2 4.0 REVISE** — koi themselves passed (legible, aligned, subordinate, clean theology); the sole
  blocker was the school "parked on a sentinel's tip" ("gnats around a stone"). A player-relative flock
  will overlap a seed-placed prop unless it flies ABOVE all of them — a modest lift (y51) wasn't enough for
  the tall elder at that seed.
- **R3 4.4 PASS** — lifted the anchor WELL above all sentinel tips (y66, clears props at cruise AND look-up
  pitch), tightened the clamp, dropped to 10 fewer/larger koi (no tiny strays). All five axes Y.

The dialled result: `SHOAL_COUNT 10`, body `scale(1.4,0.44,0.26)` (3:1 dash), fauna colour `0x281f36`,
anchor `cX=44+sin·10, cY=66+sin·3, cZ=-dist-108+cos·16`, `heading=0.2+sin·0.4`, wag `±0.15`, `fs=fauna·4.8`.

**Verify.** Fable-model gate 4.4/5 PASS (all must-pass Y). Guard suite all green + byte-identical off:
gold-determinism 5✓, biomecycle 12/0, skyprobe 5/0, bulletcontrast, appshell (no console errors — GLSL +
merged geometry clean), envcount all-budgets-green, tricount 0-over, propclearance.

**What it unlocks.** The fake-fauna reskin is broken for biome 5 — the pattern (a named, gated, instanced
flock profile that hands off from the shared bird-flock) is now reusable for the other biomes' real
profiles. Remaining Empyrean backlog: PR-6 gravity-wells + in-lane skins; owner-optional polish (base-sky S
lift, near-field nacre rose); the dragon true-black recolour; the boss↔biome brown-arch coupling.
