# EITHERWING holder volley — `aimed`/`stream` from the eye-holder via ENG-A (single-origin `emitOrigins` + behind-plane skip)

**What we did.** Completed EITHERWING's emitter=organ adoption on top of ENG-A. ENG-A already moved
`crossfire` to the two twins; this routes `aimed`/`stream` to the **holder** twin as well, so the
whole fight now fires from the actual bodies, not the pose centre. Named the existing
holder-following muzzle node (`muzzle.name = 'eitherMuzzle'` in `bossEitherwing.js` — it already
tracks `holderPos` each tick) and extended the def:
`emitOrigins: { crossfire:[twinA,twinB], aimed:['eitherMuzzle'], stream:['eitherMuzzle'] }`.

**The reusable trick.** `emitOrigins` with a **single** part name is the right way to express a
*dynamic* single origin (the holder is A or B depending on `holdT`) — it rides ENG-A's
`resolveEmitOrigins` path, which carries the **behind-plane skip** (`rel <= 0.5 → skip`). That's
the reason to use `emitOrigins` here instead of `def.muzzle`: `resolveEmitOrigin` (singular) has NO
behind-plane guard, so during the figure-eight near lobe the holder dips behind the player and
`def.muzzle` would fire `aimed`/`stream` from *behind* the plane (bullets flying away). Through
`emitOrigins`, those volleys simply go silent for that beat — consistent with crossfire, and
correct. So: **dynamic single origin that can go behind the plane → `emitOrigins:[oneName]`, not
`def.muzzle`.**

**Verify.** `tests/boss.mjs` 107 green (new assert: eitherwing `aimed` originates at `eitherMuzzle`,
not the pose centre; the crossfire→twins asserts still hold), `bossboot` green, every other boss
byte-identical (emitOrigins is eitherwing-only; the shipped `def.muzzle`/pose-centre path is
untouched for every other boss and for un-opted attack ids).

**Watch (preview, human):** during the figure-eight near lobe, `aimed`/`stream`/`crossfire` can all
briefly go silent together (all routed to twins/holder that dip behind the plane). The pass is
~7–8s and crossfire/stream both carry amber elsewhere in the phase, so the amber floor holds
(and the gate reads the phase attack LIST, which is unchanged), but the silent beat is a live-feel
call for the owner to judge on the PR preview.

**Deferred (still):** the C.4 dread composition proper (midpoint iris, ORBIT ANNULUS graze = ENG-D,
holder-stagger parry = ENG-E) — this commit only finishes the origin plumbing, not the new
graze/parry verbs.
