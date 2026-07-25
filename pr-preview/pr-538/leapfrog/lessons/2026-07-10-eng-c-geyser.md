# ENG-C — `geyser`: the roster's one new attack id (crestfall's bottom-up mirror), and a plume that CANNOT lie

**What we did.** Spent the Calamities band's single unused `≤1-new-id-per-band` budget on **`geyser`**
— BRINEHOLM's signature attack and crestfall's deliberate bottom-up mirror. Where crestfall pours
full-width rows DOWN from the crest line above the frame, geyser erupts them UP from below the frame
(`CONFIG.laneMinY - 3` = world y −0.5, `vy = +5.5`), a generous safe gap sliding between rows. The
floor finally erupts — the fiction BRINEHOLM's P4 dread ("THE ISLAND BREATHES — Sounding") always
narrated but no shipped pattern could deliver (every attack travelled down/across, none up).

**How.** One `executeAttack` branch in `boss.js` inserted adjacent to `crestfall` (the mirrors sit
together), copying crestfall's dials verbatim (rows/stepX/slow/dir/g0) and flipping only birth-y and
vy sign. Plus one `SUSTAINED` Set entry (geyser wind-up = `telegraphSustained`, like crestfall).
BRINEHOLM opt-in is **def-data only**: P3 `['stream','iris','fan'] → ['stream','geyser','fan']`
(teach-before-test at the 44-bpm tidal drone), P4 `['curtain','iris','spiralStream','stream'] →
['geyser','iris','stream']`, plus **pure-id-swaps** in the rhythm phrases (every beats/count/gap
number unchanged → rhythmprint byte-identical). No `bossBullets.js`, no `bossRhythm.js`, no
`particles.js` change.

**The plume that cannot lie (the fairness core).** A bottom-up wall born below the frame is invisible
until it's already in the lane — an unreadable wall unless telegraphed. So each row is **plume-led**:
one BEAT (0.32s) before the eruption, spray plumes (`burst()`, the existing pooled sprite path) flash
at the foot of every DOOMED column; the safe column stays dark. The load-bearing detail: **the gap is
sealed at plume time in a per-row `gapX` closure and the eruption REUSES it** — the plume and its wall
can never disagree. Crestfall recomputes its gap at fire time (it may — it has no plume); a builder who
"simplifies" geyser's two closures into one recompute would make the plumes lie the moment ENG-B's live
anchor lands. The structure forbids it.

**Gotchas / drift the PRE-BUILD Fable pass caught.**
1. **The −16 cull floor already pays for below-frame births.** `bossBullets.js` widened its lower cull
   to `s.y < -16` with a comment naming "the MARROWCOIL/BRINEHOLM below-approach need." Geyser births
   at −0.5 (15.5m above the floor) and crosses `laneMinY` in ~0.55s — no cull PR needed.
2. **crestfall was never in the budget loop's `ALL_ATTACKS`** — only in the defs known-attack
   whitelist. So "geyser's count == crestfall's, already proven at slot 13" was proven by identical
   dials + live shipping, NOT an assert. Geyser joins BOTH lists (the budget loop now runs it: "12
   attacks fit the cap") and carries its own gate. TWO whitelists exist and drift apart — check both.
3. **The headless budget flush runs with `def`/`model` null.** Adding geyser to `ALL_ATTACKS` means
   `debugEmitAttack('geyser', …)` runs it headlessly — so the branch's only def read is
   `def?.accent ?? 0x3ad0b0`, and `resolveGapAnchor` already guards `def?.gapAnchor`. Never add an
   unguarded `def.`/`model.` read to a branch that ships in `ALL_ATTACKS`.
4. **`bossgate brineholm` G3 (palette danger-band) is a pre-existing STOCHASTIC flake, not our
   regression.** bossgate does a LIVE in-game capture at P1 fight-settle (`poseY>10 && !charging`);
   live magenta bullets/emissive fringing in-frame make the danger-band-body % jitter run-to-run
   (observed 0.10%–0.93% across runs on BOTH clean HEAD and this branch — the ~0.5–0.9% fail threshold
   sits inside the noise). Our change only touches P3/P4 ids, which aren't active at the P1 capture, so
   it cannot move G3. Verified by A/B (5 runs each): the distributions overlap. Do NOT "fix" it here.

**BRINEHOLM value-inversion + collision.** Geyser leaving P4 as the lead also kills the 6≡8
dread-multiset collision (the plan's B-4 finding): `curtain`/`spiralStream` leave the def, so
BRINEHOLM's P4 dread set is no longer Hollowgate's P4 multiset. No other boss lists `geyser`.

**Verify.** `tests/boss.mjs` **113** green (+1): 5 eruption rows @q1 (plume beats bullet-free), first
eruption one full beat after its plume, every bullet born ≤ `laneMinY−3` erupting `vy>0`, survives the
−16 floor and reaches the lane within 1s, every row leaves a sliding threadable lane; the budget loop
now clears geyser ≤55@q0.7 / ≤160@q1; amberdiet (P3/P4 keep the `stream` carrier) + rhythmprint (pure
id swaps) unmoved; the full lifecycle drives BRINEHOLM to a kill through the live phrase machine +
the `moving` sounding setpiece. `bossboot` green. `bossgate brineholm` G1/G2/G4–G7 pass; G3 flakes
pre-existingly (above). Only the geyser branch + BRINEHOLM def changed — every other boss byte-identical.

**Forward contract — the Sounding lee (half-paid here).** ENG-C ships geyser LANE-WIDE with the
player-seeded sliding gap (plan §E.1 row C exactly). The dread's full promise — "rows track the
sweeping submerged body; ride the lee" — is a later **pure-def-data opt via ENG-B**, already plumbed
by the branch's plume-time `resolveGapAnchor('geyser')` call: BRINEHOLM adds
`gapAnchor: { geyser: { part: '<submerged-head organ>', card: 'brineholm_sounding' } }` and the gap
LOCKS to the head's live x (the lee = the no-spawn pocket). NOT shipped now: it needs a model organ
verified against `partWorldPos` while dread-submerged + preview judgment of the lee read.

**Do not touch:** the `gapX`-closure structure (collapsing it re-introduces the lying plume); geyser's
role colours (`activeBand` only — `bulletcontrast` untouched); `AMBER_CARRIERS` (geyser is a
full-frame wall — never parry fuel, same ruling as curtain/movingGap/crestfall).
