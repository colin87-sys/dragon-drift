# ENG-A — per-organ / multi-origin emit (`def.emitOrigins`), proven on EITHERWING crossfire

**What we did.** First Tier-1 engine seam of the attack-rework plan. Bullet patterns like
`crossfire` fired from hardcoded lane posts — `for (const ex of [-10, 10])` — regardless of where
the boss's body parts actually were, so EITHERWING's "Both Halves at Once" dread came from two
fixed posts nobody occupied while the two twins wove a lemniscate elsewhere. ENG-A adds a
def/card-gated per-attack **origin override**: `def.emitOrigins = { crossfire: ['eitherTwinA',
'eitherTwinB'] }`, resolved fresh at fire time via `model.partWorldPos` into the bullet frame, one
emitter per named part, each with its **own** time-to-impact.

**How.** A new `resolveEmitOrigins(id, player)` beside `resolveEmitOrigin` (the singular
`def.muzzle` seam, pluralized per attack id) returns: `null` = un-opted → the shipped path runs
verbatim; `[]` = opted but every part is behind the player plane → the volley goes **silent**
(never fall back to posts — that IS the defect); non-empty = one volley per emitter. `aimVel`
became a thin wrapper over a new `aimVelFrom(origin, …)` (arithmetic-identical for the un-opted
object). Consumers wired: `crossfire` (the hero, live), `aimed`/`stream` (wired but dormant until a
def opts them in — the C.4 holder volley). EITHERWING opts in `crossfire` only. No new attack id
(emitter plumbing on existing ids).

**The gotcha.** `debugPartWorldPos` **already existed** — my duplicate export crashed the whole
suite with "Identifier already declared." Grep the exports before adding a test hook; the existing
one returned exactly `{x,y,z}` I needed. Second: a fresh-emitted `crossfire` bullet's `(x,y,rel)`
IS its origin (direct emit, no `pending`, no position tick in `debugEmitAttack`'s synchronous
flush), so the gate compares bullet origins to `debugPartWorldPos('eitherTwinA')` within ε=0.1 —
no need to instrument the emit. Third: a rare pre-existing EMBERTIDE face-entrance flake (line
~1074, Math.random timing) failed once in ~12 runs; confirmed pre-existing (clean master flakes
too) and logically isolated from an emit-only change — noted, not chased.

**The coexist proof (the load-bearing part for a shared-engine change).** The only entry to new
code is `def?.emitOrigins?.[id]`; `grep emitOrigins bossDefs.js` = one def, one key. Every other
def / attack id hits the `else` — the shipped loop moved **character-identical**, not rewritten.
The headless `debugEmitAttack` runs def/model-null → `resolveEmitOrigins` returns null on its first
check → every existing gate exercises the shipped path. New asserts prove both directions:
un-opted crossfire (headless AND live voidmaw) fires from ±10; eitherwing crossfire originates at
& tracks both twins, same bullet COUNT, still amber. `tests/boss.mjs` 107 green, `bossboot` green,
every other boss byte-identical.

**Reusable pattern / what it unlocks.** `def.emitOrigins` is the shared foundation for the
remaining "organ" reworks: C.6 KARNVOW (`['lanceTip','trophyCharm5']` asymmetric — but its local
`partWorldPos` falls back to the muzzle on a name miss, so asserts must compare the chain part),
C.8 WEFTWITCH (`['handPivotL','handPivotR']` — ready), C.7 KNELLGRAVE (needs the `spiral` branch
consumer too), Part D Parallax Regard. It is ALSO the foundation for the reverse — the owner's
"reflected bullets should always hit a part, roll-directed" idea (ENG-A-R) reuses the same
part-position resolution to aim the return bullet at an organ instead of the hollow center.

**Deferred (not in this seam):** the C.4 dread composition (midpoint iris, ORBIT ANNULUS = ENG-D,
holder stagger = ENG-E), the EITHERWING named-muzzle add (`eitherMuzzle`) for the holder volley,
card-scoped overrides, and every other boss's opt-in (their own PRs on this seam).
