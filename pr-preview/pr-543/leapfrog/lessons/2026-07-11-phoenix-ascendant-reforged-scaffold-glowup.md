# A "glow-up" of a shipped hero is a SCAFFOLD rebuild — same recipe slots, bespoke premium parts, one harsh critic per checkpoint

**Did.** Reforged the shipped **Phoenix Ascendant** (`phoenix`, SSSR) into "The Ascending Sunhawk"
(`phoenixReforged`) — the owner's brief was a *massive glow-up* of an existing hero, not a clean-sheet
new dragon: "the body was literally a sphere… too basic and geometrical… not the depth/richness of an
SSSR like Solar." Ran the exact process the owner asked for — a high-effort **Fable design director**
(pre-work checkpoint → a build sheet) then **a harsh Fable critic after every checkpoint** judging REAL
renders, one rework each — CP1 sculpted keel torso + regal head, CP2 the feather-wing hero, CP3 the
sun-pennant tail + the withheld sun-gorget collar + the coronation ladder. Holistic ship-gate:
**4.29/5, all axes ≥4, all four vetoes clean → SHIP.** New file `js/dragonPhoenixReforged.js`
(sunhawkKeelTorso / sunfeatherWings / sunpennantTail / sunhawkCrownHead + `sunhawkMats`), coexisting as
a new roster key beside the byte-identical `phoenix` (migrate on owner approval — the Molten precedent).

**Learned — a glow-up is a SCAFFOLD rebuild, distinct from a no-leak build.** The Molten/Everflame
phoenixes were *no-leak* builds (author every look fresh, reconstruct nothing). This was the opposite
mandate: KEEP the beloved identity (white-gold divine plumage, "Reborn in fire", heart-fire, real
FEATHER wings) and fix only the sculpt. Concretely that meant: start from the shipped recipe slots
(`avian`/`feather`/`plume`/`beaked`), diagnose each in the pixels, and replace each with a bespoke
premium part that does the SAME job richer. The coexist-key + per-form model-knob-accretion plumbing is
identical to a no-leak build; only the design INTENT differs (preserve vs. invent). Naming it a
"scaffold glow-up" up front kept the palette/identity closed and focused every checkpoint on the sculpt.

**The harsh-critic-per-checkpoint loop paid for itself every round — each first submission was a
REWORK with a named, structural fix, never vibes:**
- **CP1:** "the sphere is dead but it over-corrected into a flat fuselage plank — the keel prow doesn't
  project." Fix: make the keel DEEPEST at the FRONT third (S1–S2) rising monotonically aft, so the
  breast projects down-AND-forward. A round body and a flat-bottomed body are BOTH failures; the win is
  a keel that's deepest+most-forward.
- **CP2:** "the mid-wing filled but the underside is a flat cold plank + the relief collapsed into
  toothy sawtooth NOISE + the primaries are thin needles." Three separable fixes below.
- **CP3 holistic:** SHIP, with P1 polish (blaze the heart, broaden the pennant drape).
Budgeting exactly one rework per checkpoint and treating a first-try pass as "bar too soft" is the
loop working — it never rubber-stamped.

**Gotchas banked (each cost a render to find):**
1. **A filled wing can still be a "flat plank" from the SIDE.** Ranks on the dorsal face don't save the
   ventral read. The fix is THICKNESS (a top ivory vane over a *separate* warm belly skin), NOT deep
   camber — a deep camber just digs a dark concave pocket that reads worse. Thickness kills the plank;
   camber stays shallow.
2. **A shadowed/edge-on matte facet with a low emissive floor + any metalness reads BLACK, and a black
   underside re-triggers the "flat plank" veto even after you fixed the geometry.** Cure: `metalness: 0`
   + a warm emissive FLOOR on the belly material so no facet can go to zero. (Diagnosed by briefly
   over-brightening the suspect material to confirm which surface was the black one — cheap and decisive.)
3. **Two-value relief becomes NOISE when the value gap is ~4 tiers (bright vane on a near-black root):
   the inter-feather V-gaps read as teeth.** Fix: warm BRONZE roots (not near-black) → a ~2-tier gap,
   and shingle the vanes at ~55% overlap so only a thin shadow LINE shows between them, never a black V.
4. **Emarginated eagle fingers must be FAT with an in-plane width axis and a central dominant** — thin
   needles + a picket-fence of equal spikes is the bright-design "firework" trap. The no-curl veto is
   satisfied by geometry (terminal dir aft-and-down: `dir=[cos, -droop, sin]`), and it's worth a
   regression assert (published wingElements tip.z > root.z — the wing sweeps aft).
5. **A radial regalia fan reads as a PORCUPINE unless the feathers rake strongly BACK and are broad +
   overlapping** — the sun-gorget only became a "ruff" when I dropped the radial component and pushed
   the aft (+z) component up and widened the vanes.

**Process meta (banked): the shell cwd silently resets to the repo ROOT between some Bash calls, and
there's a second `tools/`/`tricount.mjs` there** — the render/probe tools live under `reforged/`, so a
slipped cwd fails with `MODULE_NOT_FOUND` or silently counts the wrong models (37→29). Always
`cd /…/reforged && …` in the same command; never trust a bare `node tools/…`.

**→ Unlocks.** The `sunhawkMats` white-gold value-gap ladder + the `kiteFeather` two-value primitive +
the thick-airfoil wing (ivory vane / warm belly) are a reusable WARM-LIGHT-BODY feather kit — the third
distinct phoenix value-doctrine in the roster (dark-crust Molten / bright-tongue Everflame /
warm-white-gold-feather Sunhawk). And the pattern "diagnose the shipped part → bespoke premium
replacement in a coexist key → Fable-per-checkpoint" is now proven for glowing up ANY tired shipped
hero, not just authoring new ones.
