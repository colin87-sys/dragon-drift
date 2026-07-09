# Lance system boss progression plan

Date: 2026-07-08

This note audits the current Reforged boss roster, the live Lance/lock implementation,
and the boss creation sheet. It proposes a fair progression so Lance play becomes a
learned boss verb rather than a late, uneven add-on.

## Layman's summary

The Lance system is the game's lock-on missile layer: you hold the square reticle over a boss part, brand that part, then release or let the system fire homing Wyrmfire wisps into the marked parts. The technology is already mostly there; the problem is the teaching order.

Right now the first bosses teach a simple lock-on, but the game waits too long before it teaches the more interesting “mark several body parts and fire a volley” version. When that finally appears, it appears on a busy rib-coil boss, which asks the player to learn a new weapon while also dodging complicated patterns. Later bosses then jump between “lots of lock targets” and “no lock targets” without always explaining why.

The fix is to turn Lance into a clear ladder:

1. Boss 1: learn that the square reticle can lock onto one big obvious target.
2. Boss 2: learn to keep/reacquire that lock while dodging walls.
3. Boss 3 or a pre-boss-4 teach beat: learn the first simple two-part paint-and-volley.
4. Boss 4: graduate to several body parts on a moving body.
5. Later bosses: each add one new rule — moving targets, destructible targets, one-target timing puzzles, sealed/muted targets, or a final beam-duel inversion.

In practical terms, I would correct this by adding an easier first paint lesson before Marrowcoil, making the boss creation sheet require a Lance section, and making every lockable body part justify itself as a visible weak point, weapon, wound, restraint, trophy, or exposed organ — not just a random chunk of boss geometry.

## Current implementation snapshot

The Lance system is already a layered, data-driven boss mechanic:

- `virtualLockOrgan` gives a boss a V1 aim-line target: hold the flight line inside a
  square cone until the reticle locks, retargeting rider shots and enabling post-string
  exposure ticks.
- `lockParts` turns named body parts into V2 paintable organs: the player brands parts,
  the marks decay, and a capped volley of Wyrmfire wisps fans out then homes back to the
  branded organs.
- `partWorldPos(name)` is the boss-body seam. The boss model caches named `Object3D`s and
  exposes their live world position, so designers choose lock targets by naming visible
  anatomy in the builder instead of inventing per-boss targeting code.
- `paintableParts()` filters lock parts by phase and liveness. Destructible rose panes and
  shackles leave the target set when broken, so missiles do not home to corpse geometry.
- Lance damage is deliberately chip, not a phase delete: each volley is clamped to 10% of
  the current phase HP, and tier caps currently scale as T1=0, T2=3, T3=5, T4+=6.

## Research takeaways from genre references

The most relevant pattern is not "missiles hit the boss center"; it is "the lock-on UI
is a teaching layer over authored targetability."

- **Panzer Dragoon / Orta**: hold fire, sweep the reticle over targets, release to fire
  homing lasers. Reviews and guides consistently describe the lock-on as a tradeoff:
  gun/manual fire is faster and direct, lock-on is safer, more spectacular, and better
  when the screen has multiple targets. That supports Dragon Drift's split between rider
  chip/parry and slower Lance setup.
- **Rez / Child of Eden**: lock-on is capped and counted visually; releases are sequential,
  and high-value play comes from full-lock timing and rhythm. Dragon Drift already mirrors
  this with lock pips, beat-perfect manual release, and fan-then-home wisps.
- **Star Fox 64**: charged homing shots exist, but many bosses are immune or require direct
  weak-point fire. This is the warning: do not force Lance as the universal answer. Some
  fights should stay V1-only or Lance-muted if their fun is dodge/parry/rhythm instead of
  target painting.
- **Kingdom Hearts Shotlock**: the player spends an aiming window/resource to lock multiple
  targets and then releases a cinematic volley. This supports using Lance as a deliberate
  commitment window during safe/rest beats, not as a passive always-on DPS layer.
- **Body-part target selection across the genre** generally follows readability, not
  anatomical completeness: targets are exposed weak points, emitters, destructible armor,
  or recurring focal organs. The body part must be visible from the camera, telegraphed by
  the boss's attack, and stable enough to acquire during a fair opening. Decorative hulls
  should not be lockable unless the fight is specifically about stripping armor.

## The progression problem

Current progression is uneven in three ways:

1. **The first two bosses correctly teach V1 only**, but boss 3 (`ashtalon`) remains V1-only
   too, so the first true paintable boss is boss 4 (`marrowcoil`). That means the player
   sees the reticle for three fights before the square reticle becomes a multi-mark weapon.
2. **The first paintable lesson starts on a complex spatial boss**: `marrowcoil` has a
   coiling body, rib-thread setpiece, iris, stream, crossfire, and moving-gap phases. It is
   flavorful, but it is a busy place to teach the first "paint multiple organs" behavior.
3. **Later bosses vary between rich lock anatomy and no lock anatomy** without a clear rule.
   `hollowgate`, `brineholm`, and `karnvow` have strong part picks; `knellgrave`, `onewing`,
   and `embertide` have none despite sitting in high tiers where the cap says six locks are
   possible. That can read as regression unless the absence is explicitly framed as a boss
   gimmick: sealed, non-targetable, beam-duel, rhythm-only, etc.

## Proposed Lance curriculum

### Rung 0 — V1 sight-line teach: boss 1, Voidmaw

Keep the current design. `faceCore` is the right first target: it is central, large, and
stable enough that the player learns "line up the square reticle until it snaps green."
No paintable `lockParts`; no multi-mark UI. The player should learn one thing: lock-on
retargets rider fire and pays crack ticks during exposure windows.

### Rung 1 — V1 under lane pressure: boss 2, Stormrend

Keep V1-only. `focalEye` plus fan/movingGap/iris teaches that holding the reticle is a
positioning choice under wall pressure, not just a free center hover. This is where the
player learns to briefly leave the target to dodge, then reacquire using coyote/drain and
retention.

### Rung 2 — first paint should happen before Marrowcoil

Do **not** put the first paint lesson on a coiling rib dragon. Add a small, phase-gated
paint lesson to `ashtalon` or explicitly create a pre-Marrow tutorial beat:

- Recommended: give `ashtalon` exactly **two** paintable organs in phase 2 or 3, such as
  `wingBrandL` and `wingBrandR`/`emberTalonL` and `emberTalonR`, while keeping `visorSlit`
  as the V1 anchor.
- Cap should remain functionally 2 for the lesson even though tier 2 allows 3. The goal is
  "paint left, paint right, release/auto-volley," not full set optimization.
- Good windows: after stream/crossfire bursts, during a mantle/rest beat, or during the
  circling-pass slowdown when the hunter exposes both wings. Avoid asking the player to
  paint while the tracking hose is actively forcing a peel-away arc.

If you want to preserve Ashtalon as the pure mover stress test, then move the first paint
teach into an explicit safe opening beat at the start of Marrowcoil P1: two very slow,
symmetrical ribs first, skull V1 anchor only after the first brand lands.

### Rung 3 — multi-organ sweep: boss 4, Marrowcoil

Marrowcoil should become the real three-part sweep exam, not the first exposure. Its current
rib targets are thematically correct because the boss's identity is threading rib rings.
Recommended tuning:

- Phase 1: two ribs only, no skull painting; aimed/fan gives enough air to learn the sweep.
- Phase 2: all four ribs join during iris/stream/crossfire; this is the first "choose a
  route across a moving body" lesson.
- Phase 3: keep movingGap/spiralStream pressure, but make lock-snap from amber volleys the
  intended way to top off brands during dangerous windows.

### Rung 4 — moving target selection: boss 5, Eitherwing

Eitherwing is a good progression step because it asks the player to identify a shared eye
and two seeker organs while two bodies move. This should be the first fight where the player
learns that a lock target can transfer, orbit, or only be easy at turnarounds.

Rules:

- Keep body hulls unpaintable.
- Make the shared eye the easy anchor and seeker fin/scar the harder optional marks.
- Avoid making all three marks mandatory for phase progress; the Lance should reward skill,
  not block the call-and-response fight.

### Rung 5 — destructible anatomy: boss 6, Hollowgate

Hollowgate is the perfect first "body parts leave the lock set" boss. The rose panes are
visible, named, destructible, and attack-emitting. The current design is strong; the only
requirement is that the tutorial copy and shimmer language make the contract explicit:
"paint live panes; broken panes go dark."

### Rung 6 — single-organ exception: boss 7, Thrumswarm

Thrumswarm can be a deliberate exception. A single `queenGroup` target fits a swarm boss if
its mechanic is condense/scatter/stagger: the target exists only when the swarm becomes one
body. This should be framed as a Lance timing puzzle, not as a multi-lock fight.

### Rung 7 — split weak-point ecology: boss 8, Brineholm

Brineholm's eye plus shackles are good lock anatomy because they are different classes of
parts: damage focus plus destructible restraints. This is where the player should learn that
not every lock target has the same job. The eye may be sealed while shackles remain paintable;
that is fair because the UI already supports per-part liveness.

### Rung 8 — trophy / selective targets: boss 9, Karnvow

Karnvow's trophy charms are an excellent advanced target set because they are diegetic and
read as stolen victories. However, the current economy marks Karnvow as Lance-inert because
it has `lockMuted: true` even with `lockParts`. That is fine only if the fight's stated verb
is "reflect-only duel" and the reticle goes ashen on purpose. If the player sees five trophy
charms but cannot use them, the boss needs an in-fight note: "THE MARKS WILL NOT TAKE" or a
stronger seal visual.

Suggested long-term version: phase 1 muted duel, phase 2 one trophy becomes paintable after
a perfect parry, phase 3 trophies become a full rally reward. That makes its rule-breaking
feel earned instead of disabled.

### Rung 9 — high-tier no-lock bosses need explicit alternate verbs

For `knellgrave`, `onewing`, and `embertide`, absence of lock anatomy is acceptable only if
it is authored as the hook:

- `knellgrave`: music-locked bell timing; Lance could be disabled because the toll, not
  targeting, owns the fight. If any lock target is added, it should be the clapper only
  during toll recoil, not six generic bell chunks.
- `weftwitch`: currently has `loomHeart` as a V1 anchor but no `lockParts`; at tier 4 this
  will feel underdeveloped. Add thread-knot targets or explicitly make the loomHeart a
  sealed V1-only focus while the fight tests weaving through curtains.
- `onewing`: if it is the emotional Eitherwing payoff, Lance should reference the earlier
  shared-eye lesson: one unstable scar/eye target that appears at phrase turnarounds, rather
  than a generic six-part set.
- `embertide`: the sheet already claims a beam duel. Keep normal Lance mostly off; let Surge
  beam/crest-lock be the boss-specific evolution. This is a good final-prep inversion: the
  lock-on language points the player into a beam timing verb, not a missile volley.

## Body-part selection rules for future bosses

Use these rules in the boss creation sheet before adding `lockParts`:

1. **Target organs, wounds, emitters, bindings, or trophies — never plain hull.** A lock part
   is something the boss exposes or uses, not a random mesh chunk.
2. **The target must be visible from the real rail camera.** If it only reads in the studio
   tool, it is not a gameplay target.
3. **The target must have a fair acquisition window.** Movement is good, but every target
   needs a turnaround, recoil, rest beat, exposed phase, or parry-snap route.
4. **The first lock target in a fight should be the boss's focal point.** Later targets can
   spread outward, but the reticle should initially teach the player's eye where the fight
   is centered.
5. **If a part can die, hide it from `paintableParts()`.** The current pane/shackle pattern
   should be the standard for all destructible organs.
6. **If a part is invulnerable, seal just that part when possible.** Whole-layer deflection
   should be reserved for shields/survival cards; per-part liveness feels fairer.
7. **Never make Lance mandatory unless the attack rhythm supplies safe paint windows.** The
   core dodge/parry fight must remain winnable; Lance should accelerate, score, or solve a
   side-objective unless the boss is explicitly a Lance tutorial.
8. **Cap should follow authored target count, not only tier.** A tier-4 boss with two real
   organs should cap at two for that fight; six locks should mean six readable targets.

## Boss-by-boss feasibility matrix

| Slot | Boss | Current Lance status | Feasibility / fun read | Recommendation |
|---:|---|---|---|---|
| 1 | Voidmaw | V1 `faceCore`, no paint | Excellent tutorial: central mask, simple aimed/fan/tunnel ladder | Keep V1-only |
| 2 | Stormrend | V1 `focalEye`, no paint | Good second lesson: wall pressure teaches reacquire | Keep V1-only |
| 3 | Ashtalon | V1 `visorSlit`, no paint | Fun mover stress test, but delays paint too long | Add two phase-gated wing/talon paint targets or add an explicit first-paint bridge before Marrowcoil |
| 4 | Marrowcoil | Skull anchor + four ribs | Very fun once learned; too busy as first paint lesson | Make it the first full sweep exam, not first paint |
| 5 | Eitherwing | Eye + seeker fin/scar | Strong moving-target exam; body hull correctly unpaintable | Keep, tune for optional mastery |
| 6 | Hollowgate | Rose panes + hub | Best destructible-target lesson | Keep and use as sheet template |
| 7 | Thrumswarm | Single `queenGroup` | Good exception if condense/stagger owns timing | Frame as single-organ timing puzzle |
| 8 | Brineholm | Eye + shackles | Strong split ecology; teaches sealed eye vs live restraints | Keep, ensure shimmer/liveness clarity |
| 9 | Karnvow | Trophy charms but muted/inert | Cool visual target set, but risk of "why can't I use this?" | Either communicate muted duel strongly or unlock trophies after parry states |
| 10 | Knellgrave | No lock targets | Fine if music/toll is the verb | Keep off or add only recoil-window clapper |
| 11 | Weftwitch | V1 `loomHeart`, no paint | Tier-4 V1-only may feel like regression | Add thread-knot paint targets or explicitly seal Lance as loom-rule |
| 12 | Onewing | No lock targets | Risky because it should pay off Eitherwing | Add one unstable shared-eye/scar target at turnarounds |
| 13 | Embertide | No normal locks; beam-duel concept | Good inversion for late game | Keep normal Lance off; make beam/crest-lock the Lance evolution |

## Boss creation sheet additions

Add this mini-sheet to each boss before modeling or tuning attacks:

1. **Lance rung:** none / V1 / first-paint / multi-organ / destructible / timing-exception /
   inversion.
2. **Primary organ:** the first target the reticle points to and why it is readable.
3. **Paintable organs:** each `lockParts[]` entry with its camera read, attack origin, fair
   acquisition window, and phase gates.
4. **Non-targetable anatomy:** large visible parts the player might expect to lock, plus why
   they are unpaintable and how the visuals communicate that.
5. **Liveness rules:** destroyed, submerged, sealed, scattered, or survival-card states that
   remove or ash targets.
6. **Safe windows:** which attacks/rest beats are intended for painting, refreshing, manual
   release, and lock-snap.
7. **Cap rationale:** actual target count and intended volley size, not just the boss tier.
8. **Failure honesty:** what happens if the player tries to paint during shield/vent/mute, and
   what UI/sound makes that legible.

## Implementation plan

1. **Document the rung for every shipped boss** in `bossDefs.js` comments or a small data field
   such as `lockRole: 'v1Teach' | 'paintTeach' | 'sweepExam' | ...`. Tests can later assert
   there is no accidental regression in the ladder.
2. **Patch Ashtalon or Marrowcoil to teach first paint earlier and cleaner.** Preferred:
   add two named marker empties to `bossAshtalon.js`, gate them to phase 2+, and cap the lesson
   to two paint targets via per-def cap override or phase-gated target count.
3. **Add per-def effective lock cap** so authored target count can reduce the tier cap without
   hacking global `capByTier`. This solves single-organ Thrumswarm and future two-organ bosses.
4. **Add `lockMuted` communication** for Karnvow-style bosses: ashen shimmer, note text, and a
   distinct seal sound when the player holds a line on a deliberately unbrandable target.
5. **Extend the boss sheet** in `BOSS-DESIGN.md` with the Lance mini-sheet above.
6. **Add a progression test** that walks `BOSS_ORDER` and asserts: V1 appears before paint;
   first paint has <=2–3 targets; multi-organ follows; destructible targets appear only after
   the player has seen normal paint; high-tier no-lock bosses declare an explicit alternate
   `lockRole`/mute/inversion reason.

## Bottom line

The Lance system is technically ready: named `Object3D` targets, liveness filtering, decay,
cap fuse, homing wisps, beat release, lock-snap, and shimmer all exist. The problem is content
curriculum. Keep Voidmaw and Stormrend simple, introduce a two-target paint lesson before the
rib-coil boss, then use each later boss to teach exactly one new rule: moving organs,
destructible organs, single-organ timing, split weak-point ecology, muted duel, and final
beam-duel inversion.
