# Pearl Seraph — redesign build sheet (Fable director + owner-confirmed decisions)

**What we did.** Ran the mandated Fable design-director loop on the shipped Pearl Seraph
(the "Radiant Paladin" celestial dragon) BEFORE writing any geometry: read the current
builders, diagnosed them against `DRAGON-DESIGN.md`, produced a costed subsystem-by-
subsystem redesign, surfaced the load-bearing decisions to the owner, and froze the result
as [`reforged/PEARL-SERAPH-BUILDSHEET.md`](../../reforged/PEARL-SERAPH-BUILDSHEET.md). No
builder code was touched — this checkpoint's deliverable is the *plan*.

**What we learned / the diagnosis that generalizes.** The shipped Seraph is a **mecha
reskin that never finished becoming organic** — it inherits the Aurum Toro armature +
mechaKit atoms and spends its premium budget on *chips and rims* instead of *form*. The
named failure modes were all present: plane-wing (flat 2-quad membrane), picket-fence
feather fan, sticker-gild (zero-thickness rim cards), LED-strip glow chips, bead-chain tail
+ neck, straight dead-level spine, box jaw + stick horns, and `def.wingOuter` defined but
**never referenced** (one-tone wing).

**The gotcha worth carrying forward — the DEAD-KNOB LADDER.** The single biggest "this
dragon doesn't grow" cause wasn't geometry, it was the `forms[]` semantics: the builders
read only `formLevel, halo, wingScale, wingChordScale, wingDihedralDeg, tailSegments,
glowIntensity`, so `wingForm` + the whole `wingForms[]` table, `tailStyle`, `bladeFins`,
`crest`, `wingVeins`, `glowSeams`, `ridgeCount` are **all dead** — a tier-up was recolor +
a couple more feather cards, span never grew, apex was only ~⅓ richer than the hatchling
(4506 vs 3435 tris). **When auditing any dragon's ladder, grep the builders for which
`model.*`/form keys are actually read before trusting the `forms[]` table** — dead knobs
read as a rich ladder on paper and flat in play.

**The reusable pattern.** Diagnose-then-plan-then-confirm: (1) a high-effort Fable director
grounds every claim in `file:line` and benchmarks against the roster's best (Vesper for the
wing/motion kit, Solar for organized ranks); (2) the deliverable ends in a tight
**"OWNER, CONFIRM BEFORE BUILD"** block — 6 load-bearing taste decisions each with a
recommended default + alternatives, plus the engine/scope limitations the harness can't
verify; (3) the owner confirms, and only then does the sheet freeze. This puts the
taste-and-limitations conversation *before* the build spend, not after a rejected render.

**Owner-confirmed direction (2026-07-12):** withheld/component glow; keep gilded plate
re-seated onto anatomy; keep + rebuild the comet tail at hero scale on a real bone chain;
flat saint's-disc halo arriving at Radiant; the **brow gem** as the one bloom carrier; keep
the (already-bespoke) cathedral yoke-flap and add only the wrist-fold + feather lag +
streamer flutter.

**What it unlocks.** CP0 calibration can start immediately on
`claude/pearl-seraph-redesign-ci8ulg`: new self-registered default-off builders, the
`forms[]` rewire (span 0.78→1.08 finally grows), and a 4-form `starters.mjs` SPEC — no
engine schema change required. The shipped `pearl` stays byte-identical until the CP4
migration.
