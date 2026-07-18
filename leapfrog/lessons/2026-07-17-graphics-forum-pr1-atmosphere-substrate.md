# Drowned Forum PR-1 — the atmosphere substrate (gold-on-water, behind the `?props=forum` seam)

**What we did.** Landed the Biome-0 revamp's PR-1 (DROWNED-FORUM-BUILD-SHEET §5): the sunken-Pompeii
ATMOSPHERE (§2D palette) — wine-dark deep water + Baiae glass-turquoise shallow, Mediterranean-dusk sky
(violet-slate zenith → rose mid → apricot horizon → warm sun), gold-umber fog pushed hard into distance,
gold-dust motes, calm bay `waveAmp` — plus the coexistence seam. No props yet; this proves the palette
before geometry spends on it. Blind test PASSED: the follow-cam flythrough reads as a NEW biome (an
existing structural arch even frames the gold sun-lane into a free "processional" preview), zero jade left.

**The reusable pattern — a THIRD coexistence tier: gate ATMOSPHERE + PROPS on one flag.**
The shipped seams (`?props=v1/v2/v3`) only swap prop `biomes:[]` whitelists. The Forum needs the SKY to
change with the kit (a Roman arch under a jade jungle sky is broken), but changing `BIOMES[0]` outright
would render the still-shipping v3 jungle props under a Roman dusk. Solution:

- **environment.js** reads `?props=forum` → `forumV1 = PROPS_FORUM ? [0] : []` (the new kit's whitelist,
  empty until PR-2 archetypes append at the END of ARCHETYPES) AND suppresses v3:
  `lagoonV3 = (V1||V2||FORUM) ? [] : [0]`. Under `?props=forum` biome 0 has NO props → a blank
  water/sky canvas, exactly what the atmosphere blind-test wants.
- **biomes.js** reads the SAME flag at module load and, only if set, reassigns the const array element
  `BIOMES[0] = FORUM_BIOME0` (legal — `const` pins the binding, not the contents). `FORUM_BIOME0` is a
  spread over the shipped Lagoon entry, so every field the sheet doesn't re-spec inherits unchanged.

Default play (and ALL headless: `typeof window === 'undefined'`) → flag off → THE LOST LAGOON,
byte-identical. gold-determinism + biomecycle stay green because they never see the forum palette.

**The gotcha that bit (and the law that kills it): the horizon read-ceiling.**
bulletcontrast's layered read (dark-outline + white-core) only holds for a bright background when its
luminance ≤ 0.75 (so `1.0 - L ≥ 0.25`). The sheet's spec horizon apricot `0xFFB877` is L≈0.762 — over
the ceiling → `reflect-amber`/`reflected-cyan`/`band-light` would FAIL against it (they're FIXED role
colours with no per-biome override lever, same trap as AMBER WASTES). Authored the horizon at
`0xF7B276` (L≈0.738, under the ceiling) instead — imperceptibly different apricot, and bloom + the
god-ray swell lift it on screen to a brilliant sun-slot anyway. **This is the Tempest horizon discipline
generalized: any biome whose horizon is the frame's bright value-hole must author it UNDER 0.75, not at
the spec's on-screen target.** The gold-umber fog `0xE8B27E` (L≈0.73) clears the same way.

**The other gotcha: a flag-gated palette is invisible to the headless gate.**
Because the forum palette is off in headless, `bulletcontrast` (which iterates `BIOMES`) would never test
it. The sheet MANDATES re-running that gate after a palette change. Fix: export `FORUM_BIOME0`
unconditionally and iterate `[...BIOMES, FORUM_BIOME0]` in the test. **A URL-gated palette must be
exported and fed to the contrast gate explicitly, or the mandated re-run silently tests the old palette.**

**The anti-orange-soup law, applied.** The gold reads rich only because of THREE cool anchors held in the
data: wine-dark DEEP water `0x0d2b36`, violet-slate ZENITH `0x3a3f66`, and the slate-teal hemiGround
bounce `0x2e5850`. When a later capture reads "orange soup," deepen these three — never desaturate the clay.

**What it unlocks.** PR-2 (`triumphgate` hero + Sinking-Gates reskin): append its archetype with
`biomes: forumV1`, and it renders under this proven sky. The material-kit bakes the sheet lists in PR-1
(re-stopped tide ladder, fresco/terracotta zones, `verdigrisBronze`, mosaic read-through) were
DEFERRED to travel with their first prop consumer — adding unused, unverifiable edits to the shared
bake/foam/material systems the LIVE v3 roster depends on is pure "break the shipped roster" risk with
nothing observable to gate. Introduce each bake beside the hero that first paints with it.

**Verify:** `?biome=0&debug&props=forum` (tools/_forumfly.mjs) for the atmosphere; gold-determinism,
biomecycle, bulletcontrast (forum row = zero new exceptions), envcount, propclearance, tricount all green.
