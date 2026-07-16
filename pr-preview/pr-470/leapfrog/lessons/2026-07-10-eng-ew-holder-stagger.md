# ENG-EW — EITHERWING holder-stagger (`holderStagger`) + midpoint-iris: the 5th reflect-consumer sibling, the attribution the opted emits were missing, and the 2nd-encounter model-state trap

**What we did.** Completed EITHERWING's §5b slot-5 parry job — the last leg the shipped ENG-C4
seam deferred. A PERFECT parry of the eye-**HOLDER**'s amber (the `eitherMuzzle` aimed/stream volley,
or the holder twin's half of the crossfire) now banks toward a stagger; at **3 mid-possession** the
handoff STAGGERS — the eye UNSEATS and DROPS to the **thread midpoint** for a 2.5s strike window
(the shared `staggerT` grammar, third def-gated consumer after thrumswarm/weftwitch). Plus the dread
P3 **iris** now contracts on that same true midpoint (`gapAnchor: { iris: { part: 'threadMid' } }`),
not the player. Two def lines on eitherwing; every other boss byte-identical.

**The load-bearing drift the Fable PRE-BUILD pass caught (and re-confirmed on live master): the opted
emits carried NO source tag.** `resolveEmitOrigins` returned `{x,y,rel}` and stopped — so "parry the
holder's amber" was unattributable (`r.snapParts` had no eitherwing strings). The fix is the
`resolveReflectTargets` precedent verbatim: push `part: name`, and append `o.part` to the three opted
`emitBoss` calls (`aimed`/`stream`/`crossfire`). `emitOrigins` is eitherwing-only across the roster
(grep-verified), so no other boss's bullets change. **Reusable rule: an opted per-organ emit is only
half-wired until it carries its organ tag — the reflect ledger can't see what the emit didn't label.**

**The hazard the same tags create — and its one-line guard.** `paintFromParry(part)` accepts ANY
non-empty string (its guards are type/fight/cap/dedupe, NOT lockParts membership), and `lockPartDead`
only knows panes/shackles/ribs → `false` for the new `eitherMuzzle`/`eitherTwinA/B` tags. Eitherwing
HAS `lockParts`, so its V4 snap loop RUNS — the instant the ambers carry tags, a perfect parry would
lance-brand the muzzle/twin BODIES (violating LAW §II.9). Guard: scope the snap paint to real
lockParts **for emit-tagged defs only** — `(!def.emitOrigins || def.lockParts.some((lp) => lp.part
=== tag))`. Un-`emitOrigins` defs short-circuit to shipped behavior (marrowcoil/hollowgate/karnvow
untouched); eitherwing's real lockParts (eyeRig/seekerFin/seekerScar) are never bullet tags, so
nothing paintable is lost. (ONEWING was safe only because it declares no lockParts → whole snap block
skipped.) **Reusable: adding source tags to a def that also has lockParts is a two-part change — the
tag AND the paint guard ship together, or the parry brands the hull.**

**Grammar reuse, not new machinery (the ledger was literally waiting by name).** `partParries`'
comment already read *"Generic for later reuses (C.4 holder, C.6 gems)"* and `RIB_BREAK_PARRIES = 3`
*"the roster's canonical 3 (panes/stagger/holder)"*. The holder block is the **5th** def-gated sibling
in the `if (!rollParried)` reflect consumer (below ORGAN BREAK, above the V4 snap loop — consume
before paint), keyed `HOLDER_KEY = 'eitherHolder'` (a synthetic key: the POSSESSION, not a node).
`staggerHolder()` borrows SCATTER-STAGGER's shape, NOT `applyPartBreak` — the stagger kills no part,
drops no brand, has no index, so the part-DEATH ceremony deliberately does not fit. The window is a
mutually-exclusive sibling branch appended after the `def.threadCut && staggerT > 0` branch, and
`if (shielded)` precedes both so a shield freezes rather than double-spends it.

**Reachability: P3 has no `eitherMuzzle` carrier, but the fix costs zero emission.** `aimed` lives
only in P1, `stream` only in P2 — the dread (where the stagger pays most) fires crossfire+movingGap+
iris. Rather than emit new muzzle bullets, the block counts the HOLDER twin's half of the existing
crossfire (`holdState().target < 0.5 ? 'eitherTwinA' : 'eitherTwinB'`); the seeker's half never counts
(the §5f duo-law "parry the LIT side" read). The `includes('eitherMuzzle') || includes(holderName)`
collapses a mixed burst to +1 per roll.

**Mid-possession = the bank dies with the baton (a SEEN reset).** A `holdTarget` flip clears the bank
(watcher beside the `eyeWeakPoint`/`setEyeUp` block, which runs AFTER `model.tick` in the same
`updateBoss`, so it sees the current-frame target). Flips only happen at `charge<=0.15` rests, so a
mid-volley bank is never eaten; the eye-drop freeze RE-ARMS `handoffTimer` (`Math.max(…, 0.6)`) so
recovery re-seats the SAME holder rather than flipping instantly (the Fable pass flagged the empty-
branch comment as inaccurate — the timer keeps decrementing; re-arming is what actually holds it).

**Midpoint-iris INVERTS ENG-C4's anchor choice — for a reason worth recording.** ENG-C4 rejected the
true midpoint because the tilted lemniscate's `sin(2θ)` wobbles it (fatal for a *continuously-drawn*
band). The iris has the opposite geometry of trust: it resolves its centre **once per volley** (a
snapshot — the wobble never shivers anything), the rings are born concentric on where the thread-mid
truly is (the motes + split-beads mark that exact spot), and the ±8 clamp bounds the worst case. So a
named byte-neutral `threadMid` empty (seated on `mid` each tick, the seekerFin/seekerScar precedent)
rides the shipped `resolveGapAnchor({part})` branch verbatim — zero engine change. The group pose
would cost MORE (a new resolve mode). **Reusable: continuous graze bands fear a wobbling anchor;
snapshot-once volleys welcome it — the same node is wrong for one and right for the other.**

**The trap that cost the most: model state persists across a re-armed encounter in tests.**
`startBossEncounter` early-returns `if (active) return;`. A test `armEW` that clears `game.inBoss`
but not the boss's `active` flag SILENTLY SKIPS the rebuild — the old model (with a live `eyeDropT`
from the prior fight's drop) persists, so the 2nd encounter opens with the eye already dropped and
banking looks broken. The gate helper must call `boss.resetBoss()` (which sets `active = false`)
before every re-arm — the ENG-A/ENG-E harnesses already do; ours didn't at first and chased a
phantom "extra bank" for a while. **Reusable: any headless loop that re-forces a boss must
`resetBoss()` first, or it's testing the previous fight's leftover model.** (Model-side drop state
dies with the per-encounter `buildBoss` rebuild — correct in the live game, which always tears down;
only the reused-model test path exposed it.)

**Verify.** `tests/boss.mjs` **118** green (+2): a new model-tier block (holdState follows the pin,
threadMid tracks the twins' x-midpoint, dropEye sags the eye ~0.9 below the midpoint and recovers, a
mid-drop pin drives *target* not *position*) and a live-loop block mirroring ENG-E's parry harness
(3 muzzle parries drop the eye + silence scheduling; a baton pass fades the count; seeker-side/surge/
in-window parries bank nothing; the snap-guard paints no phantom pip; the dread iris centres on
threadMid ≥3u off the player-derived anchor; voidmaw inert). `bossboot` green. `tricount` unchanged
(byte-neutral empty). **Only eitherwing's def bytes changed** (`git diff bossDefs.js` = the two opt-in
lines). Added test seam `debugSetHandoff(t)` (pins the live model's holder) and `bossDebugState`
fields `holderParries`/`holdTarget`/`eyeDrop`.

**Preview-judgment items (headless CANNOT see these — owner judges on the PR).** (1) The eye-drop
POSE + socket-dim: the eye should read as clearly OFF the thread ("on the floor" of the formation),
guttering (`eyeK *= 1−0.55·dropEase`) with a dilated pupil (the model's "dilation = stun" grammar).
(2) The midpoint-iris authors X only (`cy = B.fightHeight`); the rings must visibly own the thread-
mid/motes spot during `eitherwing_both`, not read "vaguely boss-ward". (3) Intensity: 3 perfect
parries inside one possession is demanding; the fairness hatch is layered (visible reset note, the
progress "FALTERS n/3" note, flips only at rests). Dials named in the spec §7 (any-parry softening,
survive-one-baton, window length) — tune around the §5b-verbatim threshold 3, not through it.

**Known non-issues (not ours):** `bossrushui` dev-roster stage-jump selector FAIL (multi-stage boss
UI, unrelated); the pre-existing embertide `setEntrance` / karnvow footwork flakes; bossgate palette
FAILs on complex-model bosses. **What this unlocks:** the `partParries` generic is now proven on THREE
reuse shapes (ribs, ghost frame, possession) — the C.6 gem-shatter reuse the comment still names is a
drop-in; and `debugSetHandoff` + `holdState` give the Boss-14 finale a handle on eitherwing's baton
when it QUOTES slot 5.
