# Pearl Seraph CP1 — wing + body redesign, and the feather-anatomy relearn

**What we did.** Built CP1 of the Pearl Seraph premium redesign as coexisting default-off
builders (`seraphHull2` + a custom feather wing + `seraphCrownHead2`, wired via
`DRAGONS.pearlRedesign`; shipped `pearl` byte-identical). Curved line-of-action hull,
continuous lofted neck, published measurement handles, crown/halo head, and a **whole-wing
dawn-cyan Surge bloom**. Ran the harsh-Fable gate to the owner's ≥4.2 bar over many rounds
(2.85 → 3.78 → 4.16 → 4.17 → 4.15 → 3.96 → 4.21 → **4.30 PASS**).

**The big relearn — FEATHER ANATOMY IS SHINGLED ROWS, NOT RAKED QUILLS.** The first wing
built feathers as a DOMINANT+decay rank of individual blades **rooted at the trailing edge
and raking aft**. It cleared the numeric gate at 4.21 — and the owner still rejected it on
sight: "look at the anatomy of angel wings and look at yours." It read as a venetian
blind / comb of separate quills, not plumage. The fix was structural, not a tuning pass:
rebuild with the repo's `shingle()` generator (`dragonShingle.js`) as **overlapping feather
ROWS tiling the surface** — coverts near the leading arm → secondaries → primaries fanning
from the wrist — each row lapping the one behind like roof tiles, so the surface is smooth
layered plumage and the LAST row's tips form the scalloped trailing edge. That one change
took Wing craft from "raked slats" to "convincing layered angel plumage" and the gate to
4.30. **A wing can pass every numeric axis and still be anatomically wrong; the owner's eye
is the real gate, and `shingle()` is the right primitive for any feathered/scaled field
(one authored card laid along a parametric run, merged to one draw call per bay).**

**Gotchas banked this checkpoint:**
- **A white-value creature's Surge can't read as a brightness bump** — it's already bright in
  cruise. It must be a **saturated-hue + bloom shift** (white → dawn-cyan via `surgeHi`), not
  luminance. And the studio capture's `applySurge` only flared `spineMats`, **not
  `flareMats`** — so a whole-membrane bloom that works in-game (the runtime flares
  `spineFlareMats`) showed as nothing in captures. Fixed the tool to flare `flareMats` too;
  verify Surge with a **pixel diff** (changed-pixel %, mean B−R), not an eyeball — a critic
  caught the dead bloom instrumentally after an eyeball "looked fine."
- **`wingcrop.mjs` renders `angelWing.js` (the BOSS wing), not the dragon's wing** — it caused
  an owner scare that we were reusing the boss asset. The dragon's custom wing had zero
  `angelWing` reuse. Know which asset a diagnostic tool actually targets before trusting it.
- **Metallic gold crushes to olive/green under flat ACES on broad upward faces** (it reflects
  the sky). Low metalness (~0.28) + warm hue + a tiny warm emissive floor holds gold.
- **A continuous gilded strip reads as regalia; scattered gold shingle cards read as dapple** —
  the "greater-covert gold band" had to be a solid proud strip, not a gold shingle row.
- **cwd resets to the repo root between some Bash calls** — always `cd reforged` before the
  render tools or they crash with MODULE_NOT_FOUND / a misleading `ascendedDef` JSON error.

**Process note.** When the owner rejects a build the numeric gate passed, the gate is blind to
that axis — treat the owner's critique as authoritative and re-derive, don't defend the score.
(We also mis-derived once: an ambiguous "don't use the wing" was read as "abandon feathers"
and a whole clerestory-tracery wing was built and thrown away before the owner clarified they
meant the boss asset. Confirm the referent before a full pivot.)

**Residuals to CP2:** the comet tail (shipped `seraphTail`, high-metalness gold) reads olive at
the tail base — rebuild it on the corrected gold (the tail is CP2 anyway); soften 2–3 oversized
trailing-edge jags near the wrist; deepen the Surge cyan saturation on the live preview.

**What it unlocks.** CP1 (Eternal hero) is gate-clean at 4.30 with owner-correct anatomy; next
is the 4-form ladder rewire (`starters.mjs` SPEC + monotonic asserts) and CP2 (head/halo + a
rebuilt comet tail), then migration.
