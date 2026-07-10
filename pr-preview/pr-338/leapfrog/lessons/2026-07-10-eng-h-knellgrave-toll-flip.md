# ENG-H — KNELLGRAVE C.7-proper: the iris→spiral toll flip (a pocket INVERTED shrink→grow), the pendulumSweep hero, and the first rework that edits ALREADY-MERGED behavior

**What we did.** Delivered the whole of build-queue row 12 that the shipped shrinkDisc PR (ENG-C7)
deferred: (1) a **`pendulumSweep`** setpiece — the bell swings across the lane in three widening arcs
(§5c WORLD-ENDER contract, finally true: off-lane at the extremes, into the band at each nadir); (2)
the **toll flip** — the shrinkDisc pocket arm MOVED from the `iris` branch to the `spiral` branch, and
the pocket **inverted** from a shrinking safe middle to an **expanding toll-wall** radiating from the
bell mouth; (3) the **bob-lock** — `movingGap`'s safe lane mirrors the swinging bell (`gapAnchor.scale`);
(4) the def **4→5 phases** + the new **`knellgrave_peal`** card (the hemiola double toll). It is the
first rework in the series that **edits already-merged code** (the ENG-C7 gate + the disc engine), so
the PRE-BUILD Fable checkpoint earned its keep more than anywhere yet.

**The PRE-BUILD Fable drift-check caught 3 real corrections a from-the-spec build would have shipped
wrong** — the load-bearing argument for the checkpoint protocol on merged-behavior edits:
1. **The bob-lock scale overran its own honesty claim.** The spec computed the worst mouth swing as
   `sin(swingA)·8.6·1.75` and concluded `scale −0.4` keeps the mirror inside movingGap's ±9 clamp. But
   the model's rotation is `sin(t·0.85)·swingA + sin(t·0.37+1.1)·swingA·0.35` → **peak |rotation.z| =
   1.35·swingA**, so worst `|bellMouth.x| ≈ 24.3`, and `×0.4 = 9.7 > 9` — the clamp *does* bite at rare
   extremes, breaking "honest at every point of the arc". Fixed with **`scale: −0.36`** (→ ±8.75 ⊂ ±9).
   *Reusable: when a lane MIRRORS a swinging organ, derive the mirror factor from the organ's true
   peak-angle envelope (sum-of-sines, not the base amplitude), then size it so the shipped clamp never
   silently engages — a clamp that bites turns an honest mirror into a lie exactly where it's scariest.*
2. **One gate assert was undrivable as specced.** `debugEmitAttack` flushes all `movingGap` rows
   synchronously with no time advance, so every row's `resolveGapAnchor` reads the SAME mouth x → you
   cannot observe per-row tracking from one call. The per-row live re-resolve is real (in play `pending`
   drains across `updateBoss` frames); the gate must sample the lane's **range across a sweep window**
   (fresh `debugEmitAttack` per frame), not two adjacent flushes. *Reusable: a synchronous flush seam
   proves a per-volley value, never a per-row-over-time one — drive the live loop for the latter.*
3. **The `discR0→discR1` swap hit 3 reset sites, not the spec's 4** — there is no `breakShield`
   per-phase disc re-offer; the fourth reset (`enterFight`'s `?bossPhase` block) carries no start
   radius. Grepping the symbol beat the spec's prose.

**The pocket inversion is a construction identity, which is why it's cheap.** The spiral's n bullets
are born AT the centre with lateral speed `SPIRAL_OUT_SPD` (9) and closing speed `slow`, so the
wavefront's lateral radius is **exactly `9·t`**; it crosses the plane at `t = srel/slow` at radius
`9·srel/slow`. So `armDiscPocket(scx, scy, srel/slow, SPIRAL_OUT_SPD·srel/slow)` and `discR = discR1·
(discAge/discDur)` make **drawn == wavefront** by construction (both linear from 0) — the shipped
unit-ring band mesh (`scale.setScalar(discR)`) draws the paid band unchanged, zero geometry churn. Two
things had to flip with the sign:
- **Ticks flip from radius to CLOCK.** The shipped `beamTick = max(0.16, discR·0.075 − …)` *de*-escalates
  on a *growing* radius (the opposite of the intended "richest at the scariest instant"). Replaced with
  `max(0.14, (discDur − discAge)·0.30 − beamHeld·0.03)` — interval ∝ time-to-crossing, so it still
  tightens as the wall lands. *Reusable: any escalation keyed on a quantity whose monotonicity you just
  inverted has to be re-keyed on time (or on `1−progress`), or it silently reverses.*
- **The start radius is retired.** No `discR0`; `discR` starts at 0. The cross-toll "successive smaller"
  schedule is gone (escalation now comes from the cadence ladder + the Cracked Peal squeeze). `discGeom`
  changed `{ rEnd }` → `{ outSpd }`; `DISC_R_END` deleted grep-clean.

**The no-dread decision, and why the sweep widens anyway.** A `dread:true` mid-fight setpiece would fire
the Last Toll's **one-way `skyOpen` ratchet** (`skyOpen = max(skyOpen, clamp01((ruinK−0.5)/0.2)·dreadK)`)
two cards early — a permanent sky-tear the P4 survival card must own alone. So `pendulumSweep` ships
**without** the flag; the swing-widen it would have bought comes from a 2-line model hook keyed on
`sdef.id === 'pendulumSweep'` (the MARROWCOIL fly-through-vs-dread precedent): `sweepK` adds `0.30` to
`ampTarget`. *Reusable: a setpiece that must move the body but NOT trip a dread-gated one-way reveal
keys the model on `sdef.id`, not the shared `dread` flag — the flag is a bundle, the id is a scalpel.*

**Two test-harness gotchas worth banking (both cost a debug loop):**
- **`boss.updateBoss` already advances the bullet pool** (`updateBossBullets(dt)` is called inside it).
  The drawn-rim==wavefront honesty assert called `bullets.updateBossBullets` *again* → the wavefront
  double-advanced vs `discAge` → a 6-unit phantom gap. Let `updateBoss` own the clock.
- **The sweep's `env` ramps over the first 30%**, so sampling in the first ~2s sees the mouth barely
  move (poseX ≈ 0…3) even though the setpiece is live — the geometry assert only passed because it ran
  the full 14s. The bob-lock sampler had to advance past **k ≥ 0.30** before measuring full-amplitude
  crossings. *Reusable: envelope-ramped setpiece paths are near-static early; sample past the ramp.*

**`discCd` is load-bearing for the Cracked Peal (do not "fix" it).** The peal phrase is
`{ kind: 'burst', attack: 'spiral', count: 2, gap: 0.1–0.16 }`. The FIRST toll arms the wall; the SECOND
is inside `discCd = 1.6` and **arms nothing by design** — its unmarked wavefront expands *inside* the live
pocket, squeezing the rider between an inner wall coming up behind and the drawn rim ahead. Letting it
double-arm would cut pocket #1 short and un-draw a still-lethal wavefront.

**Verify.** `tests/boss.mjs` **119** green (the ENG-C7 block rewritten in place for the flip + a new
§ENG-H sweep/bob-lock block): the wall grows monotonically to the wavefront radius and dies on the
crossing; the drawn rim tracks the live bullets (honesty identity, ±0.8); rim ride pays escalating ticks
(core/outside unpaid, never damages); the peal double-toll arms exactly once then re-arms after the cd;
iris arms nothing (the site moved); both setpieces (sweep + Last Toll) stay pure dodge; the sweep crosses
the lane ≥4× at |mouth.x| ≥ 11, dips into the band, comes AT you (rel ~12) without a behind-camera pass,
and returns to station; the movingGap lane mirrors the bell at −0.36× across the swing, clamps a runaway
scale inside ±9, and reverts player-seeded off-card. `bossboot` green. **rhythmprint min KS 0.26**
(knellgrave's 5-phase burst-doubled fingerprint stays clear of every neighbour), **amberdiet** green
(every phase lists `aimed`; P4 also `stream`), knellgrave **geometry/worst-frame/music-death/lifecycle**
all green untouched (the `sweepK` hook is 0 with no setpiece → the swing-widen assert is byte-identical).
**Only knellgrave's def bytes changed** (every bossDefs hunk is inside its block); every engine edit is
coexist-guarded (spiral null-origins path, `resolveGapAnchor`'s `scale ?? 1` default, the disc helper +
branch def-gated, a `SETPIECE_PATHS` key nobody else names, the model hook `sdef.id`-gated) — stormrend
firing spiral opens no pocket and emits from the shipped `(anchorX, fightHeight)`, and the ENG-C4/ENG-D
orbit/slip suites pass untouched. `tricount` unchanged (zero new geometry). `stamp-sw` run in the commit.

**Preview-judgment items (headless CANNOT see these — owner judges on the PR).** (1) **The sweep is the
whole hero**: dur 14 / 3 arcs / the ±14–y11–rel12 triplet / `roll 0.16` / `sweepK 0.30` are ONE coupled
read — only the human judges whether the arc reads as MASS swinging (the Shadow-of-the-Colossus frame) on
weak-mobile framerates. Dials in order: `dur` (14→16), arcs (3→2), the rel dip (12→14), `sweepK`. Never
dial: `moving:true`, the no-dread decision, the station-continuity endpoints. (2) **Pocket density +
band prominence post-flip**: every station toll is now pocket-eligible and each wall is briefer with a
bigger terminal ring (~11.5 vs the old 8.0) — more frequent, larger, briefer pink rings at the plane. If
the preview reads busy/farmy: raise `discCd` (1.6→~3.2), then the tick formula, then band opacity. Never
dial: the annulus law, the drawn==wavefront identity (no radius cap — capping would make the ring lie
about the wavefront), the last-beat death, the setpiece purity gates. *The standing lesson holds: headless
proves the wall FUNCTIONS (crossings, reachability, the honesty identity), never that it READS as a scythe
of swinging mass or that the reward pink stays clear of the danger role-colour — the preview closes that.*

**Known non-issues (not ours):** the `bossrushui` dev-roster stage-jump selector FAIL (multi-stage UI);
the pre-existing embertide/karnvow entrance flakes; the bossgate palette FAILs on complex-model bosses
(bossgate is a `tools/` preview tool, not run-all CI). **What this unlocks:** the `shrinkDisc` label's
meaning has now *inverted with its one consumer* (the disc's TIME shrinks; the wall expands) — a doc
errata for BOSS-DESIGN §5i.B; build-queue row 12 is complete but for its preview tuning; the only
attack-rework capstone left is **Boss-14 (UNMASKED, Part D)**, whose `medley` is the last branch-less
grazeForm label.
