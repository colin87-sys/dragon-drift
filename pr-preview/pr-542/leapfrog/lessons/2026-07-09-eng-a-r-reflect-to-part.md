# ENG-A-R — directional roll-parry reflect onto body parts (`def.reflectTargets`)

**What we did.** The REVERSE of ENG-A, owner-requested. Swatted/reflected bullets used to home at the
boss's geometric CENTRE (`reflectBossBullets` set `s.tx=bossX; s.ty=bossY`), which on a hollow-centre
boss (MARROWCOIL — the rail flies THROUGH the ribcage gap) sent the return bullet into empty air.
Now a swat snaps to a **hittable organ**, biased by the dodge-roll's direction, and **never whiffs**:
favored side → nearest-anywhere → centre-fallback.

**How.**
- `def.reflectTargets: [partNames]` (marrowcoil-only for now: 4 rib pivots + `skullGroup`), resolved
  by a new `resolveReflectTargets(player)` in `boss.js` — a near-clone of ENG-A's `resolveEmitOrigins`
  (same world→bullet-frame conversion + `rel<=0.5` behind-plane skip) with **one deliberate semantic
  flip**: an empty result returns `null` → the caller falls back to CENTRE (a reflect must always go
  somewhere), NOT emit's SKIP.
- `reflectBossBullets` gains a trailing `targets` param; per swatted bullet it picks the nearest part
  on the roll-favored side (`(c.x-bossX)*dir > REFLECT_SIDE_EPS`), else nearest-anywhere, else centre.
  "Side" is vs the BOSS centre (owner said "the boss's left"), and a centre-line part (skull, x≈0) is
  never a sided pick — it's the fallback anchor.
- **The load-bearing find (roll direction):** `player.roll.dir` is a clean ±1, but `rollInvuln` (0.5s)
  OUTLIVES `roll` (nulled at `rollDuration` 0.45s), so the last ~50ms of every parry window — the
  perfect-parry-rich tail — has no live `dir`. Fix: a persistent `player.lastRollDir` set in `tryRoll`,
  cleared in `reset`; since `rollInvuln` is granted only by `tryRoll`, it's exactly the current roll's
  dir whenever the reflect seam runs. Read off the `player` param `reflectBossBullets` already gets — no
  signature change for direction.

**The gotcha (test placement).** `boss.forceBoss` calls `scene.add(group)` — a live-fight test block
crashes with "Cannot read properties of null (reading 'add')" if it runs BEFORE the test file sets up
its scene. The early §3 bullet-pool section has NO scene; the boot/forceBoss blocks all live LATER.
So: synthetic-target asserts (spawn amber → `reflectBossBullets(…, targets)` → read `debugActiveBullets`)
go in §3 (no scene needed); the live resolver check (`forceBoss('marrowcoil')` → `debugReflectTargets`)
must go at the END of the file with the other boot blocks. Split accordingly.

**Coexist / damage-neutral (the safety bar).** Only entry is `def?.reflectTargets`; every other def →
`null` → shipped centre aim, byte-identical (headless callers omit the arg → `null`). MARROWCOIL has no
`PART_SYS` flag, so `routePartDamage` returns 0 centre- or rib-aimed alike, and `reflectBossBullets`
never touches `s.dmg`/mults/`s.part` — the retarget moves WHERE the bullet lands, never how much. A new
`s.aimPart` slot field is diagnostics + the ENG-E hook; nothing in the update loop reads it.

**Verify.** `tests/boss.mjs` **109** on clean runs (new: coexist→centre; leftward roll→left part;
rightward→right; skull never a sided pick; auto-snap→nearest-anywhere never centre; marrowcoil resolves
its 4 ribs + skull ahead of the plane; voidmaw resolves null). `bossboot` green. Every other boss
byte-identical. (Two PRE-EXISTING flakes — karnvow footwork line 1611 "~1.4 vs 1.3 margin", embertide
entrance ~1074 — occasionally halt the first-failure-throwing suite before the asserts; unrelated to
reflect, confirmed on clean master. They deserve their own de-flake pass; not patched here to avoid
masking a real regression.)

**Reusable pattern / synergy.** `resolveReflectTargets` is the mirror of `resolveEmitOrigins` — the same
`partWorldPos` foundation powers boss fire OUT of parts (ENG-A) and player fire INTO parts (ENG-A-R).
And it sets up ENG-E: the arrival routes damage by the bullet's ACTUAL landing point
(`routePartDamage(e.x-pose.x, …)`), so once a rib has a hit-test, **rolling to aim your reflect at rib
L1 makes that same parry the one that cracks it** — zero further wiring.

**Deferred:** ORGAN BREAK/rib HP (ENG-E); opting fast movers (EITHERWING's lemniscate twins) in needs a
near-arrival re-resolve (the aim solves once at swat; fine for slow colossal MARROWCOIL); opting a
`PART_SYS` boss (HOLLOWGATE/BRINEHOLM) in changes their part economy — a gated per-def decision later.
