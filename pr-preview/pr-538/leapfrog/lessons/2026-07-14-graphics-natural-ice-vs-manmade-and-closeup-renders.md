# 2026-07-14 — graphics: "natural ice, not a man-made town" + render CLOSE, not at the horizon

**Why.** Owner flew the massive-first Sunset Glacier (v2) and sent a phone screenshot: "It looks great!!
But I almost feel like I'm flying through a TOWN cause the spikey towers read as MAN-MADE towers." Plus a
process note: "render shots closer, e.g. 0m or even -300m to be IN it instead of so far at 700m and 2600m —
you can't see shit."

**Lesson 1 — smooth + regular + sharply-tapering = reads MAN-MADE; irregular + jagged + broken + chunky =
reads NATURAL.** The chunky angular ice (bergwall/serac/terrace) already read as real ice; the two tall
verticals (`pinnacle`, `sungate`) read as gothic spires / a city skyline. The tell was that they were
built from **smooth regular stacked cylinder-frustums tapering to a clean centered cone point** — that
profile IS architecture (a steeple/pylon; the `sungate` was even conceived as "Argonath pylons" =
literally man-made statues). Fix, without changing their compositional role: **an ASYMMETRIC MULTI-JAG
broken top** (three jags at opposing tilts instead of one centered cone) kills the single-steeple read;
broaden the base, blunt/irregularize the crown, add lean, shorten a touch (pinnacle h 34-50→24-38, sungate
36-48→30-42). A broken, tilted, off-center crown is unmistakably ice; a smooth centered point is a tower.
Reusable rule for procedural natural forms: **break symmetry and regularity at the SILHOUETTE top — the
crown profile is where "natural vs built" is decided.**

**Lesson 2 — RENDER THE CLOSE, IN-CHANNEL VIEW, not a frozen horizon shot.** My `frozenshot.mjs` warped
`player.dist` then froze immediately — catching whatever was ahead, which perspective shrank to a distant
island cluster ("can't see shit"). The player's real experience is flying THROUGH the props with ice close
on both sides (their phone shot). Fix: `tools/frozenclose.mjs` — boot `?biome=2`, start, warp to a dist,
then **let the sim RUN (timeScale 1) and burst-capture ~8 frames over ~3s** as the dragon flies through.
That produces the in-channel close-up that actually shows the props' form + material, and matches what the
owner sees. **Always render the close, moving, in-gameplay framing to judge props — a static distant frame
lies about both scale and detail.** (Caveat: some bursts catch a canyon-tube / flow section overlaying the
biome — skip those frames when judging props.)

**What shipped.** `environment.js`: `pinnacle` and `sungate` reworked to broken natural ice (asymmetric
jag crowns, chunky broadened bases, more lean, ~shorter); still ≤150t (pinnacle 122, sungate 107), sungate
keeps `paired`. New `tools/frozenclose.mjs` flythrough renderer. Verify: envcount `--ci` green (Frozen 244
inst / 26k tris under caps); gold-determinism byte-identical (render-only); bulletcontrast pass. Confirmed
on real close-up flythrough renders — a natural blue-ice canyon; chunky masses dominate, verticals read as
broken ice.

**Still slightly open (owner to judge):** a residual cluster of tall forms can still stack up the center of
a long channel at distance — if it still reads town-ish, next levers are bigger `pinnacle`/`sungate` steps
(rarer) or pushing their crowns even more broken. Then: sky sun-pillar, Cathedral Berg landmark, and the
**mobile 60fps optimization pass**.
