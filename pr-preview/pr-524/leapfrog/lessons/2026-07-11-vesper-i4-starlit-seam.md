# Vesper I4 — the Starlit Seam: a WITHHELD emissive on a multiplicative surge tick

**What we did.** Added the Starlit Seam — an ion-blue plasma circuit (dorsal spine →
tail stem → fan-fin rims → wing-root sparks, laddered 1→1→2→3) that is DARK in cruise and
ignites only on the Night Surge. Fable gate 4.4/5 (from a 2.4 FAIL). Verified: smoke ·
tricount monotonic <6000 · wingsymprobe Δ0.000 · a new headless `seamprobe.mjs` (cruise
0.040 DARK, surge 230° ion-blue, capped) — the critic audited it against dragon.js and
confirmed it faithfully replays the shipped tick.

**Lesson 1 — the shipped surge tick is MULTIPLICATIVE, so a withheld seam needs base≈0 +
a big surgeGlowMultiplier.** `dragon.js` drives spineMats as
`emissiveIntensity = baseIntensity * (1 + surgeMix*0.9*sgm)` and lerps the emissive toward
`surgeHi`. A seam that must be OFF in cruise and BRIGHT on Surge cannot use a normal base
(that lights it in cruise) — set `baseIntensity ≈ 0.04` (imperceptible on a near-black body)
and a HIGH `model.surgeGlowMultiplier` (22) so ×(1+0.9·22) lifts it to a capped ~0.83 blaze
only on Surge. The eyes stay OUT of spineMats (driven separately at dragon.js:1143), so the
big sgm affects ONLY the seam.

**Lesson 2 — `sgm` ALSO scales the wing glow; kill it with `feverWing: 0x000000`.** The
same surgeGlowMultiplier multiplies `wingGlowTarget` (dragon.js:1091), so a high sgm blazes
the WINGS too. And the rig's fever defaults are MAGENTA (`feverWing ?? 0xff44cc`,
`feverEye ?? 0xff66ee`) — Vesper rendered hot-pink until every fever hook was overridden.
Cure: `feverWing: 0x000000` (emissive black × any intensity = black → wings stay a dark
silhouette on Surge, the scallop owns the frame), plus a cool `feverWash`, an acid-green
`feverEye`, and `surgeMotes: true`. Any new dragon with a cool/withheld Surge MUST override
the whole fever palette, not just surgeHi.

**Lesson 3 — an emissive mesh only glows on its VISIBLE faces; a one-sided seam gets
culled.** The seam strip was FrontSide with downward-winding normals, so it was back-face
CULLED from every judging angle — the ignition looked like a no-op even though the material
was correctly lit (the probe proved it). A thin two-faced strip (a groove seen from above
AND behind) must be `side: THREE.DoubleSide`. This is the emissive-geometry analogue of the
loft hollow-read: wind outward OR go DoubleSide.

**Lesson 4 — prove a bloom-washed motif with a PROBE, and gate it on a MATCHED dark-sky
PAIR.** The first surge capture was inadmissible: a warm sunset biome + an ember pickup +
tutorial UI, against which the seam read amber and every edge picked up warm rim light. The
two-state dark-sky ruling needs the SAME neutral dark sky for cruise and surge. Two tools
unlocked this: (a) `seamprobe.mjs` reads the material's actual emissive hue/intensity
through the surge math — objective, biome-independent, and a permanent assert; (b) a new
`surge` STATE in dragonstudio replays the surge tick statically so cruise (glide-dark) and
surge (surge-dark) render as a matched pair on one sky. The studio has no bloom, so a viz-
boost makes the seam legible — but boost clips toward white, so lerp only partway to the
pale `surgeHi` in the DIAGNOSTIC (the probe, not the tile, certifies the hue).

**Residuals (noted, non-blocking at 4.4):** the shipped bloomed core wants one live dark-sky
surge capture to visually close the "never white-hot" rule (the ignition one-shot briefly
peaks ~2.2 — a deliberate flash; steady is 0.83); and the tail-fin rims / root sparks are
probe-true but spine-dominated (a single shared seam mat — a +15% relative bump would need a
second seam mat instance).

**What it unlocks.** The whole two-cold-accent identity is now real: acid-green eyes (always)
+ ion-blue seam (withheld → Surge). I5 folds the seamprobe + a cruise-emissive assert into
the starters block and finalizes the palette/ladder.
