# KNELLGRAVE gains lance organs — the endgame lance ladder's first hero (PR2)

**What we did.** Made KNELLGRAVE (slot 10, the first World-Ender) the hero proof for the
lance-progression-redesign: it was `lance inert — no paint targets (V1 aim only)`, the start
of the dead-endgame the whole redesign exists to fix. Gave it three paintable organs —
`virtualLockOrgan: 'knellWound'` (V1 focal at the mouth/lower-crack) + `lockParts:
[knellBindL, knellBindR]` (the two chain-bind restraints on the clapper's wrist cuffs) —
so `wound(virtual) + 2 binds = 3 paint targets` reach the tier-4 cap of 6. The organs are
byte-neutral named `THREE.Object3D` empties parented to the existing rig (`armPivot`s for the
binds, `bellGroup` for the wound); no geometry, no tricount delta. Docs pattern followed:
brand the WOUND and the RESTRAINTS; the bound prisoner FIGURE stays honorably unpaintable.

**The gotcha that cost a rebuild (write this down).** The lance aim cone compares the
**player's world Y to the organ's world Y** (`lockLayer.coneCandidate`: `dy = |py - w.y|`),
and the player is clamped to `laneMaxY: 22`. KNELLGRAVE is an OVERHEAD boss (`stationY: 20`)
— so the obvious focal, `knellSlit`, resolved to **world y≈32**, ~10 units above the player's
ceiling: it can NEVER enter the aim cone. It would have shipped as a "focal" nobody could aim
at, silently capping the reachable pips at 4 (2 binds × stackMax) instead of 6. The fix was a
reachable wound anchor placed LOW on the crack (`knellWound` at bellGroup-local y −6.0 →
world y≈21.2, just under laneMaxY). The binds hang at world y≈14, comfortably in-lane.

**The reusable rule (for every remaining endgame boss — WEFT/ONEWING/EMBERTIDE/UNMASKED).**
An organ is only lockable if its **world Y ≤ `laneMaxY` (22)**, not merely if `partWorldPos`
resolves it. High-station / overhead / sky-dominant bosses (the World-Enders trend big and
high) must place lock anchors DOWN in the flight lane, not at the model's visual focal. The
static economy tool (`lockdpsCore`) can't catch this — it has no camera — so it will happily
report a boss "capable / reaches cap 6" whose organs are all unreachable. **Verify aim
reachability in the real engine, per boss.**

**What unlocks it.** A permanent browser regression guard, `tests/knellorgans.mjs`, boots the
real WebGL engine, forces KNELLGRAVE, and asserts all three organs resolve, sit `y ≤ 22`, are
mirrored, and register in `bossPaintables()`. Copy it per endgame boss as their organs land.
This is the template hero PR for the ladder: an inert World-Ender becomes lance-capable,
purely additively (a def without the fields is byte-identical), gates green
(`lockdps --ci`, `tests/lockdps.mjs` — KNELLGRAVE now 43 volleys ∈ [20,130]).

**Still ahead for KNELLGRAVE (later PRs, per plan §3 rung 10):** the resonant ON-TOLL release
(feed `beatOn` from the toll clock since `musicDies` nulls the music beat) + SCAR-BURN. This
PR only makes the organs live (inert → capable); the timing/burn layer rides on top.
