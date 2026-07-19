# ENG-D — SLIPSTREAM (`grazeForm:'slipstream'`): a graze pocket that RIDES a moving setpiece, and "surge into the dive gap" made real

**What we did.** Added the first *pose-region, MOVING-centre* graze form to the shipped tick-economy
cluster (`beamHeld/beamTick/beamGrace`). ASHTALON's dread `stoopingStrike` now grows a drawn safe
pocket that trails the dive line; riding its **edge-wall** (an annulus, not the core) pays ramping
graze ticks, and releasing Surge after a **≥0.8s ride** EXPOSES the hunter — a `×2` damage window on
the surge chip. This closes the plan's C.2b open gaps ("what edge contact does / where the ≥0.8s
timer + exposure hook live") and makes the §5f-named answer *"surge INTO the dive gap"* literally
true instead of aspirational.

**How.** One branch appended to the grazeForm cluster in `boss.js`, copying the `beamEdge` shape
verbatim, with the "contact" predicate swapped from `beamContact()` (a bullet query) to a **geometric
region computed from the live setpiece pose** — the shadowRide/holdFlinch style, but with a *lagged
follower* centre (`slipX += (clamp(pose.x) - slipX) * min(1, dt*SLIP_FOLLOW)`) so the pocket is a wake
that trails the dive, not a snap-to. State = plain module lets on the holdFlinch precedent
(`slipRideT/slipExposeT/slipExposeUsed/slipX/slipY/slipWasLive`), joined to all three reset sites +
the per-stoop re-offer in `armSetpieceForPhase`/`debugRunSetpiece`. The exposure hook lives in
`activateSurge` (the single manual-release entry point, gated `slipRideT >= 0.8`), and the amp is one
line in `damageBoss` beside the shipped `if (crippled) amount *= 2.4;` seam. Opt-in = **one def line**
(`grazeForm: 'slipstream'`) on ASHTALON; the stoop setpiece it needs already ships.

**The band primitive (new).** There was NO drawn reward-band primitive in the repo — beamEdge/tideEdge
carry their band on the bullets, shadowRide/holdFlinch imply it from the model. We added `slipBandMesh`
(a `RingGeometry(3.2, 4.7, 40)` in **surge-pink `0xff4fd0`**, the shipped reward hue) built once/hidden
in `initBoss` on the exact `beamDuelMesh` pattern — but with an **explicit teardown hide** in
`endEncounter`/`resetBoss` that beamDuel lacks (a fight torn down mid-stoop must not strand a pink ring).

**Gotchas / drift the PRE-BUILD Fable pass caught.**
1. **The `shrinkDisc` live-label footgun.** KNELLGRAVE's def ALREADY carries `grazeForm:'shrinkDisc'`
   with no engine branch. Shipping a `shrinkDisc` branch in this PR would *hot-activate* an untuned
   form on a shipped boss → breaks the roster. So ENG-D is scoped to **slipstream only**; `orbitAnnulus`
   lands with C.4 Eitherwing, `shrinkDisc` with C.7 Knellgrave (NOT a cheap follow-on). A def label with
   no consumer is a loaded gun — the moment its branch exists it fires.
2. **Annulus, not radius (§5i.B law).** Parking dead-centre accrues the ride timer but pays ZERO ticks
   — the payout lives only in `[R_IN, R_IN+WALL)`, so hugging the wall while the dive-stream whips past
   is the goldmine ("payout richest at the scariest instant"). The gate asserts this directly (dead-centre
   = 0 ticks).
3. **Graze never punishes.** Edge contact = ticks, never damage or push-out. The "collision walls" are
   where the ticks live; the actual threat stays the existing dive-stream bullets outside the pocket
   (no emission change — a graze form is a READ on the existing fight).
4. **Reachability by construction.** The follower lag (rate 4/s vs the squared dive's ~9.7 u/s) plus the
   centre clamp (y∈[4,18], x inside `arenaHW` minus the annulus) keep the ≥0.8s ride earnable on weak
   mobile; `arenaHW` is the live constrict var, so a narrowed arena shrinks the pocket automatically.

**Verify.** `tests/boss.mjs` **112** green (+1): pocket lives only during the dive; wall-ride pays ticks
+ feeds the Surge bank; dead-centre is unpaid; bail-past-grace zeroes the ride; a ≥0.85s ride + Surge
fires `slipExposed` and the chip drops ≥21 hp (~2×14, amp landed) while an immediate release does NOT;
voidmaw coexist stays fully inert. `bossboot` green; `bossgate ashtalon` G1–G7 pass (hidden band mesh
doesn't disturb the visual gates); only the ashtalon def line changed — every other boss byte-identical.

**Reusable / forward contracts.** The branch pattern is now proven for two more forms that ride the same
economy + band primitive: **`orbitAnnulus`** (EITHERWING C.4 — an *unwrapped angular accumulator* about
the moving lemniscate midpoint; |Δθ|≥2π = a lap = +1 adrenRung + i-frame pulse) and **`shrinkDisc`**
(KNELLGRAVE C.7 — a safe-disc radius schedule keyed to the toll count, escalating ticks, bail on the
last beat). Both land in their boss's PR, never standalone. Composes with the "read the boss's body"
seam family: slipstream reads the pose, ENG-B could later author the dive-gap lane on the same pose.

**Do not touch:** the `shrinkDisc`/`medley` def labels (no branch yet — leave inert until C.7/D); the
`beamHeld/beamTick/beamGrace` ramp semantics (shared across forms — "one grazeForm per boss" is what
keeps that safe); the `stoopingStrike` path numbers (the pocket derives everything from them at runtime).
