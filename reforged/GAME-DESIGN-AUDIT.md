# GAME-DESIGN-AUDIT — the whole-game teardown + the NEXT-LEVEL leverage plan

**Date:** 2026-07-20 · **Status: AUDITED FINAL** — the adversarial audit round (grounding / feasibility / conflicts) is complete and folded in; see §9 for what changed. Safe to hand to build sessions as the master frame, subject to the §8 owner decisions.
**Scope:** the whole live game (`reforged/`) — design, content, economy, audio, perf, process.
**How it was made:** a 9-report multi-agent research pass — (1) systems inventory + gap audit,
(2) initiative status board (git + all plan docs + open PRs), (3) a no-praise-quota design
teardown with file:line evidence, (4) structure/FTUE/spectacle sweep, (5) audio sweep,
(6) genre research across ~19 endless runners / flyers / shmups / arcade roguelites,
(7) ledger mining (self-admitted problems + owner taste profile), (8) repo-wide deferral
sweep, (9) doc-vs-code cross-checks — then a synthesis, then an adversarial audit of the
plan itself (grounding, feasibility, conflicts), folded back in.

**How to use it:** this is the master frame, not a build sheet. Each track in §5 is
PR-sized-or-smaller work with its own verification; existing specialized plans
(BOSS-VISUAL-AUDIT, MOBILE-GRAPHICS-DIET, HAZARD-OVERHAUL-PLAN, DRIFT-BUILD-PLAN…) remain
the build sheets for their territory — this doc ranks them against each other and against
the new work only this whole-game view could see.

---

## §1 VERDICT (harsh, evidence-backed)

**Dragon Drift is a top-tier-craft, mid-tier-design game.** The fairness engineering,
procedural art pipeline, juice discipline, and meta breadth are AAA-grade for a browser
game. But the core loop's challenge arc is fully spent ~90 seconds into a 2–8 minute
session, and everything above it compensates with *meters* instead of *play*:

- The speed ramp ends at 90s (`speedRampEnd: 90`, config.js:21); `difficulty()` saturates
  at ~2,100m and after that only obstacle *count* grows (level.js:170–175, 256).
  **Minute 6 is minute 2 with more clutter.**
- The verb set is steer / boost / roll / phase — four verbs under five stacked multipliers
  (combo ×5, fever ×2, scoreMult, flowChain ×3, DRIFT). Experts optimize a spreadsheet,
  not a moveset.
- The game's deepest system — the boss LANCE/graze/parry layer (~90 constants,
  config.js:276–489) — is **never taught** (no gesture teach, no hint bit, no mission
  touches it) and **never paid** (`score (embers NEVER)`, config.js:455).
- The game's biggest content investment — 14 bosses across 16 modules — is invisible to
  the funnel: first encounter at 2,500m course distance (~1 min of clean flight for a
  player whose first recap goal is "reach 500m"), and the roster's own audit scores it
  ~5.4/10 visually with the uplift barely started.
- The flagship *new* system, DRIFT, shipped **dark** (`DRIFT.enabled: false`,
  config.js:495) — and it is *further along than its own docs say*: the Ember Keel HUD
  (ui.js:945–970) and the §7-ruled meter-driven flow mult (powerups.js:137–140) are
  merged behind the flag. What's missing is a run-mode guard, an owner feel-pass, and
  the flip — no player has ever seen any of it.
- The economy pays +1-ember drips against a ~220k-ember total sink wall, with a strict
  pay-to-win dragon ladder (faster dragons are *strictly easier to steer*, player.js:45–46)
  where three 6,000-ember phoenixes are stat-dominated by the 5,000-ember Solar.

None of this is a polish problem. The repo has been leapfrogging on presentation and boss
spectacle for months (superbly — see §2). What separates this game from the next tier is
**design work on the endless loop itself**: variables past minute 2, verbs worth
mastering, fights worth fighting, and a roster worth choosing between.

---

## §2 STATE OF THE GAME (what the last month actually produced)

**Genuinely excellent — protect these:**
1. **Collision fairness** — hitboxes 0.65–0.70× visual, swept gate tests, last-chance
   slow-mo, no-fail first phase-wall (collision.js:171–206). Death is almost always legible.
2. **Generator reachability discipline** — every hop capped against worst-case steering;
   gates move off-path rather than shrink (config.js:23–27). Fair by construction.
3. **The run-1 paused gesture tutorial** (gestureTutorial.js) — learn-by-doing
   steer→boost→roll→phase. A textbook mobile FTUE skeleton **worth extending** (see T2).
4. The Fable-gated art process — biomes/UI/surge converging at 4.2–4.4/5 in 1–2 rounds.
5. Save/PWA/share infrastructure; adaptive-resolution governor; tricount/tiershot budgets.

**Recently DONE (July) and solid:** SUNBREAK Surge I0–I4 (all gates 4.2–4.4); Empyrean
base + Life Pass; Drowned Forum ~80% incl. arena; Tempest Reach composition converged;
Jade Serpent + ribbon kit; Welcome-hub §1–§6 + HUD EMBERSIGHT H1–H8; UI phases 0–2+4;
boss visual audit itself; DRIFT hero build flag-gated **including its P0 prereqs — the
swept fatal gate (collision.js:177–178), boss `clearAhead(Infinity)` (boss.js:2426), the
Ember Keel HUD, and the §7-ruled flow mult — don't re-do these**; dynRes default-on.

**In-flight now (don't collide):** PR #523 Surge I5 vision pass + **Vesper hero only**
(roster accent migration is the follow-up PR, not #523) · PR #529 boss Track-A items 1–2
(Unmasked, Brineholm) · PR #527 Empyrean ring court · PR #522 mobile diet rung 1 (**= D2
grading fold**, and it also carries the full test-suite repair — see T0) · PR #530 HUD
combo-slug fix (its `combo-pop-x` baked-translate keyframes must survive any Keel work).

**Planned-but-unbuilt (the standing queues):** boss uplift Track A 3–6 + all of Track B
(Eitherwing 3.5/10 shape rebuild anchor) · mobile diet D2→D7 · hazard overhaul (5
descoped PRs, zero built) · DRIFT phase 2 (boss feeds, capstone, flag flip) · Drowned
Forum PR-END + PR-8 · graphics N7/N12/N13/N14/N16 remainder + 5 owner default flips ·
3 Fresh-Five dragons at build-ready contracts (Belladonna Stiletto, Aurora Sylph, Crimson
Tocsin) · starter azure/ember rebuilds · Aurora's hazard + SKYWEFT anchor boss ·
Tidal Reef biome · Amber Wastes retool.

**Stalled inventory:** ~14 open PRs untouched ≥3 days (#463 Stiletto, #453 Vault Run,
#398 Pearl Seraph CP1, #386 recur-riders, #336 wingbeat, #314 bossDefs split, #275 Ember
Wyrm, #300 angel wing, #236 Marrowcoil PR3, #201 Nimbus, #193 economy handoff, #496
Empyrean bible [superseded], #484 Pages CI, #429 seraph rim-light).

---

## §3 WEAKNESS REGISTER (merged from all reports, ranked by impact)

Each entry: evidence → why it matters. Fix lives in §5 (track ref in brackets).

**W1. The 90-second challenge plateau.** speedRamp flat after 90s (config.js:20–22);
difficulty() saturates ~2,100m (level.js:170–175); post-plateau growth is density only
(level.js:256). An endless game with no late variables. [T3]

**W2. Strict-dominance dragon ladder, no build identity.** Speed and handling co-scale
(player.js:45–46); Solar (5,000◆) = literal stat cap (dragons.js:487,1350); all three
6,000◆ phoenixes strictly dominated (dragons.js:938…); both 5,000◆ Toros have worse
stamina than the free starter (dragons.js:1149); 14 SKUs, 10 distinct stat lines. [T5]

**W3. Verb scarcity.** Four verbs, five multipliers; no bank/dive/momentum physics
(config.js:15–17, player.js:177–180); combo flatlines at ×5 after 16 rings
(config.js:66–67). [T3, T8]

**W4. The lance layer: untaught, unpaid.** ~90 constants (config.js:276–489); zero
tutorial/hint/mission coverage (gestureTutorial.js:38–66, hints.js, missions.js);
`embers NEVER` (config.js:455). Depth the funnel can't find, the economy won't reward. [T4]

**W5. Bosses: unseen, then under-rewarded.** First at 2,500m snap-scheduled to 2,400m
every run (config.js:513, boss.js:6222); a fight spans 3–7.5km so boss #2 sits ~9.9km
deep at the earliest (snap-ladder math); kill pays flat 60◆ ≈ 2.4 golden pickups at any
tier (config.js:583,599) while the fight suspends the ring/combo engine (rings.js:146) —
cruising the same 60–90s usually pays more. Mandatory once triggered, no skip. Players
learn to dread the game's showpiece. [T2/T4]

**W6. Inverted risk pricing + the silent miss.** Ring miss = combo hard-reset + Surge
killed (rings.js:258–272); 25-damage hit keeps full ×5 combo (collision.js:365–367);
a miss at combo ≤1 produces **zero feedback** — sfx gated behind `combo > 1`
(rings.js:263–267). Optimal play reads backwards: tank the rock, never whiff the ring. [T4/T6]

**W7. First-session boss economy is untaught — and mis-taught.** Graze→Surge charge→
shield break is the whole phase-advance loop (boss.js:6119–6139) but "graze" is never
tutorialized; parry gets one 3s line at 2,400m (boss.js:2728, gated by the
`tutorial: true` flag at bossDefs.js:94); Surge silently flips auto→manual inside bosses
(rings.js:246–255 vs boss.js:3362–3366); the mobile second finger is overloaded 4 ways
(hold=boost, tap=surge, swipe=roll, long-hold=focus — input.js:27–35,122,188–231). Worse:
the in-fight SHIELDED banner *teaches the wrong mechanic* — "FLY THROUGH THE RINGS →
CHARGE SURGE" (boss.js:6136) while rings are disabled in-boss (rings.js:143–150); charge
actually comes from grazing bullets. The game's own teach line for its hardest loop is
false. [T2]

**W8. Run-to-run sameness.** Biome order is a constant (`CYCLE`, biomes.js:540); overlay
cadences fixed; 4 obstacle archetypes + gate; canyon roster 2-of-3 with rock at weight 0
(config.js:179); zero mid-run events/choices anywhere (events.js is a 14-line bus). By
run ~3 a player has seen every system. [T3]

**W9. Economy: drips vs walls.** ~200–600◆/run realistic vs sinks totalling ~220k
(dragons 47.6k + trails 34k + music 22.6k + ascension ~114k with 15k/60k/150k **metre**
gates); mid-game has no attainable want; ascension's F1 baseline is secretly a debuff
(handling 0.96, ascension.js:34–39) — the flagship sink sells back stats it removed. [T5]

**W10. Missions train grinding, not mastery.** All 24 defs are accumulate-N counters
(missions.js:17–44); zero boss/parry/graze/canyon quests; contradictory pairs can share
the 3 slots (28-near-misses vs fly-800m-clean — the picker has no exclusion matrix). [T4]

**W11. DRIFT: built, proven, dark.** `enabled:false` (config.js:495) is the only thing
still true from the "unfinished" story: the Ember Keel HUD is merged (ui.js:945–970),
the score expression is already the §7-R1-FLAT ruled form (`1 + overdriveScoreStep×D`
in the overdrive zone, powerups.js:137–140, config.js:509 — the old "divergence" story
is stale), and the speed governor self-clamps at 130 (drift.js:52–58). What actually
remains: **no run-mode guard exists** (`driftEnabled()` has no mode input, drift.js:26–30,
so "default-on for free runs only" is currently inexpressible), no meta system reads the
currency, and the owner feel-pass + crest fold-in + flip have not happened. [T1]

**W12. Boss roster art floor.** Consensus ~5.4/10 avg; Eitherwing 3.5 ("shape rebuild"),
Karnvow 4.0, Voidmaw (boss #1!) 4.5; 7 roster-wide slop tells; Track A partially in
flight, Track B untouched — "mandatory before ship (players stream everything)". [T7]

**W13. Mobile perf cliff.** GPU fill-bound; owner's phone hit 20fps/48ms in the Tempest
boss; dynRes governor mitigates (floor 0.45), the audited diet (D2→D7 / F1–F4, MSAA
resolve = biggest lever) is unbuilt. [T7]

**W14. Audio feedback holes + mix war.** Silent: ring miss at low combo, flowChain drop,
natural Surge end, purchases (failed buy plays the *affirmative* click, ui.js:46–51),
mid-run quest completion, low-health, lane-edge proximity. Two-bus mix with no priority
routing — critical cues (graze 0.03, shieldPing 0.03) fight full music through one shared
compressor; `sfx.milestone()` means 14 different things across its call sites including
both "reward" and "boss incoming"; free stations loop 8 bars forever while all 9
dynamic-form tracks are paid. [T6]

**W15. The fatal lane edge is art-directed, not systemic.** |x|>13 = instant crash
(collision.js:114); Tempest hand-places prows to "MARK the death line"
(environment.js:3643–3647) but no engine-level tell guarantees the other 7 biomes do. [T6]

**W16. One-shot fragile FTUE + accessibility tax.** All 15 hint bits fire once ever,
mostly runs <2 (hints.js:31–32); no re-teach after absence, no reference card; glide
assist ×0.7 score vs assists-off +25% = a 1.79× spread between accessibility poles
(config.js:77–81). [T2]

**W17. Hazards: 2 of 8 biomes, known bugs.** Only Caldera geyser + Tempest lightning;
6 biomes are visual-only; telegraph bugs on record; the descoped 5-PR plan is approved
and idle. [T3]

**W18. Truth-layer rot.** The official test gate dies on script #1 (stale
`_diag-rock-caps.mjs`, a self-described "DIAGNOSTIC (reference, not a CI gate)", asserts
on a mode weighted 0) so **none of the other 113 runnable suites execute via the gate**
(tests/run-all.mjs:12–18) — and on master ~27 of them are red anyway (repaired only on
the unmerged #522 branch); **no CI workflow runs tests at all** (.github/workflows =
pages/preview only); there are **two parallel test trees** (stale 29-file root `tests/`
vs the real 119-file `reforged/tests/`); README materially lags (six worlds/17
stations/13 suites/v2 save — actual: 8/35/114-runnable/v5); WELCOME-HUB header still says
"NOT YET BUILT" (built 07-17); HANDOFF-REVENANT says "no dragonRevenant.js exists" (it
does); BOSS-DESIGN roster table pre-dates the audit; Biome 0 is claimed by three docs
with incompatible identities (Lost Lagoon jungle vs Drowned Forum Roman vs old
Sanctuary); ~14 stalled PRs hold unmerged specs. In a repo whose whole method is
compounding documented knowledge, stale docs are actively toxic. [T0]

**Sacred-cow cautions** (over-investment relative to player value — rebalance, don't
worship): byte-identical gold-determinism ceremony on every generator touch; the LOCK
epic's governance prose vs its zero funnel presence; art-pipeline depth vs 9 stat lines;
the weight-0 canyon machine; a gate system that measures visuals rigorously and "is
minute 6 fun" not at all.

---

## §4 GENRE RESEARCH — the steal list (fit-ranked) + anti-recommendations

Studied: Subway Surfers, Jetpack Joyride, Alto's Odyssey, Tiny Wings, Race the Sun,
Sky Force Reloaded, Luftrausers, Vampire Survivors, Downwell, Resogun, Panzer Dragoon,
Star Fox 64, Ikaruga, Psyvariar, Crossy Road, Shovel Knight Pocket Dungeon, PinOut,
Super Hexagon, Laya's Horizon.

**Core insight:** the four cheapest, highest-fit steals are one investment — they turn
the connective ~80% of the run (the FLOW plan's own "dead air" diagnosis) into a
continuous skill economy feeding the already-built DRIFT currency and the Surge ritual,
with zero new enemies, lanes, or menus:

1. **Whisker-pass graze scoring in open flight** (Psyvariar / Race the Sun / Laya's
   Horizon) — every arch, spire and wall becomes a scoring surface; extends the *already
   shipped* boss graze verb (config.js:561–566) to the whole run; feeds chain/DRIFT. S–M.
2. **Visible-decay chain + a threshold "Slipstream/Fever" hot state** (Resogun / Tiny
   Wings) — this IS DRIFT finished properly: one decaying thread everything pays into,
   a discrete hot state lost on hit, Surge as its apex. S.
3. **Sub-second restart + audible radio continuity** (Super Hexagon) — the radio
   *already* survives death (verified: no teardown on crash); the steal reduces to the
   compressed repeat-death recap + releasing the death lowpass/duck so the station is
   audibly still broadcasting over the recap. Directly multiplies attempts-per-session. S.
4. **One-touch trick vocabulary in risk windows** (Alto's) — a hold-release aerial with
   payout only when landed through a gate/under an arch; the new verb W3 asks for. M.

Then, ranked: **5.** per-biome medal ladder (Sky Force / Star Fox — converts 8 biomes +
anchor bosses into a visible mastery matrix); **6.** rescue micro-objectives (Sky Force —
a heroic, on-fantasy verb: free a trapped hatchling with a whisker-pass); **7.** pre-run
charm pairs with named synergies (Jetpack Joyride / Luftrausers — build identity without
mid-run pauses; pairs get radio-DJ callouts); **8.** unlock-cascade recap (Vampire
Survivors — 3–4 progress bars all ticking, nearest animated); **9.** egg gacha with
no-dupe pity (Crossy Road — overflow-ember sink, hatch ceremony; **owner taste call**);
**10.** skill-triggered secret routes/portals (Star Fox / Race the Sun — L effort,
community-lore payoff, highest determinism stakes); **11.** zen + photo mode (Alto's —
near-free showcase of the premium graphics; reuses the shop's real-env static-camera
pattern per LEAPFROG L9/L10); **12.** second-chance stall save priced in chain
(Laya's tumble — softens one twitch mistake, keeps stakes).

**Anti-recommendations (would damage the game):**
- **Lane-grid movement** — deletes the analog carving that IS the identity.
- **Enemy waves / bullet-hell density in open flight** — perf cliff on weak mobile +
  demotes the Surge beam from ritual to default verb. Steal shmup *scoring skeletons*
  (chains, graze, overdrive discipline), never their fire.
- **Mid-run upgrade drafts** (VS-style card picks) — murders the flow state and breaks
  same-seed share-race comparability. All buildcraft stays pre-run.
- (Standing: no energy gates/session caps — unlimited instant attempts are the genre's
  actual retention engine.)

---

## §5 THE LEVERAGE PLAN — ranked tracks

Ranking rule: `player impact × (uses what's already built) ÷ (effort + risk)`, calibrated
to the owner taste profile (§8). Every track is flag-gated, coexist→prove→migrate,
determinism-safe, and carries its own verification. **Bold** = the single next PR of that
track.

### T0 — REPAIR THE TRUTH LAYER (½ session as a harvest; 1.5–2 standalone — so harvest)
Kills: W18. The cheapest real work in this plan and it un-breaks verification for
everything after it.
- **Harvest PR #522's suite repair — do NOT redo it.** That branch already contains the
  run-all `_`-prefix skip, fixes for the ~27 pre-existing red suites, and a real
  arena-skin bug fix, and claims all-113 green. It is `dirty` (needs rebase). Rebase and
  land it (or cherry-pick the test commits if the D2 grading fold needs to wait on its
  own gate) FIRST — every other track's verification stands on this.
- **Add a CI test job**: `.github/workflows/` currently runs pages/preview only — no
  workflow executes tests at all. "CI must exit 0" means *adding* the job, not fixing it.
- Reconcile the stale root-level `tests/` tree (29-file subset of `reforged/tests/`) —
  delete or mark it non-canonical.
- Doc-truth pass (mechanical, no design): correct WELCOME-HUB / HANDOFF-REVENANT /
  BOSS-DESIGN-roster / DROWNED-FORUM-sheet stale headers + README counts; add a
  one-line "superseded by X" banner on Lost-Lagoon-vs-Forum (biome-0 identity: the
  07-18 Forum green-purge is live truth, pending §8.7); fix the false SHIELDED teach
  line (boss.js:6136 — see W7) as the one allowed code touch.
- Stalled-PR triage sheet for the owner: close #496 (superseded) and likely #300/#484;
  keep/kill calls for the other ~11 with one-line rationale each — noting #193's parts
  C/E are absorbed by T4/T5 (declare the supersedes there), and #236/#386 are cheap
  def-line work whose real cost is owner-preview time (sequence after Track-B rebuilds
  where their boss is slated for one).
- Verification: `node tests/run-all.mjs` green end-to-end **in a CI job**; grep for the
  corrected claims; PR triage table in the PR body.

### T1 — SHIP THE DARK CARGO (1–2 sessions, mostly decision + preview batching)
Kills: W11, chunks of W1/W6. Months of built work → player-visible.
⚠ **Score policy is ALREADY RULED — do not re-litigate.** The owner's §7 R1-FLAT ruling
(DRIFT-BUILD-PLAN §7, merged in #528): score pays per item/metre, never per second;
**no `driftScoreMult`, ever**; the canyon ×1–×3 orb mult is *kept*, reborn meter-driven
as `1 + overdriveScoreStep×D` in the overdrive zone — and that form is already merged
(powerups.js:137–140). Any session that "unifies" by adding a global drift score
multiplier or deleting the canyon mult is overturning a fresh owner ruling.
- **The DRIFT ship PR** (code ≈ ½ session; the rest is the feel-pass):
  (a) add a **run-mode guard** to `driftEnabled()` (drift.js:26–30) mirroring
  `seedForRun`'s branches exactly (main.js:184–189) so daily, challenge, rush, and the
  pinned authored first flight stay legacy — without this the flip changes daily
  scoring/speed/perfect-radius on day one;
  (b) the **owner feel-pass on `?drift=1`** against the plan's own numeric gates
  (≥50% of connective flight above ×1.05; longest dead stretch ≤8s — per the 07-19
  drift-hero-currency lesson, which names this the next step);
  (c) the **§4a bossGraze feed ruling**: the recorded §2/§4a middle path *keeps* a
  capped F1 boss-graze feed into DRIFT (drift.js:146–151) — keep it per the ruling, or
  the owner explicitly deletes the listener; Surge's own grazeGain (collision.js:420–423)
  is untouched either way;
  (d) the **crest fold-in PR** per DRIFT-BUILD §6/§7 (crest verbs port into the Keel's
  overdrive state; crest retires);
  (e) flip `DRIFT.enabled`.
- Surge I5: **ride #523 (Vesper hero) to merge as-is**; the roster accent migration +
  tier fallbacks are the follow-up PR (coexist→prove→migrate — #523 deliberately ships
  an empty registry for every other dragon). Then schedule the accumulated owner
  play-verify dial list from I1–I4 as ONE preview batch.
- The 5 graphics default flips (tonemap-Neutral, sky-IBL, dragon shadow, fast particles,
  clouds) as ONE owner preview session with per-flip screenshots — shipped-OFF work is
  invisible work.
- UI Gate-3 judgment batch: welcome-hub + Phase-4 theater + H9 garnish in one Fable +
  owner pass.
- Verification: drift.mjs + flowmeter.mjs green; byte-identical replay of a daily and a
  challenge seed with the flag flipped (mode guard proof); Fable ≥4.2 on any Keel visual
  change; owner preview for flips. PR #530's combo-slug keyframes must survive.

### T2 — FIRST-SESSION REPAIR (2.5–3.5 sessions — the school's scheduler edges are real work)
Kills: W5(first half), W7, W16, chunk of W14. The funnel finally meets the game.
- **The boss-school beat**: on the first run ≥2 **with no pending menu intro** (runs 2–3
  are already the designated intro window — quests/daily/pilot intros arm there,
  save.js:183–187 — don't stack beats), stage a scripted mini-encounter at the 900m snap
  rung (rung 0 of the ladder exists: `k·1500+900`, boss.js:471–484) against the existing
  tutorial-flagged Voidmaw kit in teach mode: 3 grazes → "GRAZE CHARGES SURGE" → one
  amber volley → "ROLL INTO AMBER TO PARRY" → manual "TAP TO UNLEASH" shield-break →
  instant FELLED + outsized first-kill payout. Mechanism (per feasibility audit): force
  via a `debugFirstAt`/`debugDefIdx`-shaped seam (boss.js:6222, 489); the school must
  **bypass `ladderSlot`/`lastBossKey`/encounter progression** (boss.js:462–468 — else it
  bans the real Voidmaw at 2,400m), **suppress the §5j foreshadow tolls**, and on
  completion **restore `nextBossDist = snapBossDist(BOSS.firstAt − 0.35·biomeLength)`**
  instead of the standard re-arm (boss.js:2563) — otherwise the real first boss silently
  slides to ~4,500m and the track breaks the funnel beat it exists to protect. Canyon
  overlap needs nothing (the start trigger already defers, boss.js:2907–2910). Reuses
  gestureTutorial's paused-beat pattern; a cut-down teach def + beat script is the one
  piece of new content.
- **Fix the false teach line** while in there: the SHIELDED banner (boss.js:6136) must
  say GRAZE, not rings (W7).
- Teach-the-thumb fixes: distinct Surge-tap affordance in bosses (pulsing HUD chip +
  larger dead-zone between tap/swipe thresholds, input.js:229); "graze"/"parry"/"lance"
  hint bits; re-arm all hint bits after ≥5 idle days (`lastSeen` exists, save.js:92 —
  read before the boot re-stamp, and the re-arm must also bypass `eligible()`'s
  `runs < 2` gate, hints.js:32); CONTROLS card in the pause hub.
- Retry-loop compression: the radio **already** keeps broadcasting through death
  (verified — no teardown exists); the audible gap is the near-death slow-mo lowpass +
  crash duckHold *staying engaged* into the recap — release both on settle (sfx.js:
  256–259, 1217–1221; ~hours, not a rework). Every 2nd+ consecutive quick-death gets the
  compressed recap — a **presentation swap only**: `settleRun()`'s bookkeeping contract
  (main.js:1215–1283, "the ORDER IS A CONTRACT") always runs in full; only the reveal
  shortens (score + NEXT UP + FLY AGAIN immediate; full ledger on records/purchases/
  every 3rd). Add the missing death-cause lines (bullet is already plumbed
  collision.js:373; add geyser/lightning) to CAUSE_TEXT (recap.js:151–158).
- Assist-tax narrowing: glide ×0.7 → ×0.85–0.9 (owner call §8.5; keep assists-off
  bonuses; §7 of DRIFT-BUILD cites the 0.7 as its settings-pricing precedent — stay
  inside that framing).
- Verification: a NEW ftue/funnel suite (none exists today — budget it): hint re-arm,
  compressed-recap gating, cause lines, school-bypass invariants (ladder state untouched,
  real first boss still 2,400m); owner feel pass on the mini-encounter pacing.

### T3 — MAKE MINUTE 6 DIFFERENT (2–4 sessions, the design core)
Kills: W1, W3(partly), W8, W17. This is the "next level" for the endless loop itself.
- **PR-1 Open-flight graze — extend the SHIPPED near-miss system, don't build a new
  tick.** Near-miss detection already runs at 60Hz inside the collider scan with
  per-collider cooldowns, popups, sfx, sparks, hitstop and an `emit('nearMiss')`
  (collision.js:16, 321–332; five `awardNearMiss` sites cover all core archetypes behind
  a |dz|>28 early-out); DRIFT already subscribes (drift.js:113) and missions already
  count it. The real delta: add the uncovered surfaces (lane-wall proximity band,
  set-piece arches), rebalance the payout into chain/DRIFT pips, the wind-shear cue
  (shared with W15's edge tell), and a graze feat family + medal hooks. This PR must
  **absorb** HAZARD-OVERHAUL PR2's owner-gated near-miss hook and FLOW's verb list —
  one detection system, or two sessions will build two near-pass payers. (In-boss stays
  the bullet-graze path — the collider loop is skipped in-boss, collision.js:134; do
  NOT try to route open-flight graze into boss grazeGain.) Determinism: scoring-only →
  seed-safe by construction. Effort: S.
- **PR-2 The post-plateau ladder**: extend `difficulty()` past 2,100m with *variables*,
  not density. Two lanes with different determinism budgets:
  (a) **Overlay-stream variables (safe now)**: hazard cadence tiers ride the isolated
  `hazardRnd` fork (level.js:71–76 — the shipped precedent); shard-motion mode unlocks
  keyed to distance thresholds that draw no extra RNG.
  (b) **Main-stream variables (season-boundary only)**: tighter gauntlet floors and any
  `difficulty()`-driven draw-count change touch the main rnd stream (level.js:143–152)
  and CANNOT be byte-identical — they land at a UTC season boundary with the share-race
  version flag.
  The 4–5km **speed tier** ships as a new co-scaled factor in the steering chain
  (multiply `steer` alongside `canyonSlip × driftFactor`, player.js:176–177, and divide
  `assistAxes`, player.js:24–31) — **not bare `mods.speed`**, which keeps bytes but
  breaks construction-fairness (the generator prices every hop at `lineDesignSpeed`
  with 0.92 headroom, level.js:184–238). Cap density growth where it stands.
- PR-3 Hazard overhaul PRs 1–2 of the descoped 5 (plan exists; fix the 2 recorded
  telegraph bugs first; the GLASSGRIND drift dial stays owner-gated per
  HAZARD-OVERHAUL-PLAN:144; the 07-18 descope ruling stands — do not re-inflate cut
  items) — hazards are biome identity AND the minute-6 variable set.
- PR-4 Run identities: one per-run event slot (storm surge / golden stretch / boss-rush
  offer) derived from `mulberry32(runSeed ^ CONST)` (the goldEmbers isolation precedent,
  level.js:63–65) and gated **inside `seedForRun`'s random branch itself**
  (main.js:184–189) so daily, challenge, rush, AND the pinned authored first flight are
  excluded by construction. Biome-order stays fixed (load-bearing for difficulty +
  adjacent-tri budgets) — vary the weather/event layer instead.
- (T3-stretch, behind flag) the 5th verb prototype: dive-for-speed with a stamina cost
  and a pull-up window (or air-brake) — prototype → owner feel gate → only then does it
  enter scoring. Prior-art rule satisfied (Tiny Wings dive, Laya's dive).
- Verification: gold-determinism.mjs unchanged (its seed-1337 fixture covers ~3km) PLUS
  a **new deep fixture past 3km** (none exists — tests/daily.mjs is a mods-pool test,
  not a course fixture); perf probe on any added checks (≤0.2ms tier-2); Fable pass on
  hazard telegraphs; owner preview on event-slot noticeability.

### T4 — PAY THE FIGHT (1–2 sessions)
Kills: W4, W5(second half), W6, W10. Mostly def-table + tuning work, tiny code.
- **Boss pay rework**: defeat pay scales by tier + performance (base 150–600◆ by tier;
  +per-phase pips; no-hit bonus; advertise the +25 heal as a FELLED banner line);
  lance volley quality pays embers — overturning `// score (embers NEVER)`
  (config.js:454–455), which provenance-checks as an **engineering default, not an owner
  ruling** (no rationale in any doc/lesson; neighboring laws carry owner sign-off tags,
  this one doesn't) — still an owner call (§8.4), capped per-fight to keep the faucet
  bounded ~+20% of a good run. **"Parry stays score-premier" (same line) is kept.**
  This absorbs stalled #193's part C (skill weeklies) — declare the supersede at triage.
- Mission rework wave 1: retire/reslot pure-counter chores; add verb quests (parry
  chain, flawless canyon, on-beat volley, graze streak, boss no-hit — some need new
  emit sites); slot-exclusion tags in the deterministic def-order picker
  (missions.js:66–80, ~10 lines) so contradictory pairs can't co-occupy; missions can
  reference lance verbs now that they're taught (T2 dependency).
- **Risk pricing reads forward — at constant total punishment** (the owner's recorded
  taste is soften-the-reset, never harden-the-hit): lead with the miss whiff-cue (soft
  airy "whiff" + 120ms ring-ghost at combo ≤1 — fills the zero-feedback hole), and
  route the pricing through the **DRIFT dent table the owner already ruled on**, which
  prices damage above miss (`dent: { ringMiss: 0.12, … damage: 0.20 }`,
  config.js:503–504); on the legacy side, soften the ring-miss hard-reset to a tier
  drop (dent-not-wipe — the §2 middle-path precedent) rather than adding a new hit
  cost on top of 25 HP. Never frame any of this as difficulty.
- Verification: **extend reforged/tests/economy.mjs first** — its asserted [120,400]◆
  band models a 1.2km early run with no boss-income term, so it passes regardless of
  what T4 ships; add a boss/lance term + a mid-game band, then gate on it. Recap ledger
  shows boss lines; A/B the whiff cue volume vs music (T6's sidechain helps).

### T5 — A ROSTER WORTH CHOOSING (1–2 sessions + owner ruling)
Kills: W2, W9(partly), the ascension debuff. This is a *design ruling* more than code.
- **The archetype ruling (owner)**: dragons become trade-off archetypes — e.g. Azure
  all-round · a drift-king (low top speed, highest handling+regen) · a glass-cannon
  (fastest, worst drain, tightest handling at speed) · a tank (damage resist, lazy
  handling) · phoenixes get identity (one free auto-revive per run — they're *phoenixes*)
  · Solar stays apex-fast but no longer apex-everything. No one's purchase gets worse in
  every axis (grandfather rule: every owned dragon keeps ≥1 best-in-class stat).
- Kill the ascension F1 debuff (baseline = listed stats, ascension.js:34–39); re-gate
  ascension tiers on deeds (boss no-hit, biome medal) alongside smaller metre gates;
  price ladder smoothing (fill the 1,200→5,000 gap).
- Economy faucet rebalance rides T4's boss pay + skill pay so the ladder is reachable by
  *playing well*, not only long.
- ⚠ **Charter conflict to resolve first**: PREMIUM-REDESIGN-CHARTER §3 freezes `stats`
  ("keep … `stats` … untouched") for its three hero slots (pearl/obsidian/solar), and
  its §0 says "do these in the order the human asks." T5 must either land after the
  charter closes or carry an explicit owner amendment to it; rebase/notify the open
  charter branch #398 (Pearl Seraph CP1); the charter's §9 stop-and-report rule applies
  to any conflict found mid-build. This absorbs stalled #193's part E (per-dragon
  perks) — declare the supersede at triage.
- Verification: **no save migration is needed or possible** — stats are read live from
  the code table at equip (main.js:198–204; the save stores ids/tiers only), so "owned
  rosters keep value" is enforced by the new table itself: gate on a scripted
  dominance/spread matrix over DRAGONS (14 SKUs → 14 distinct lines; every owned dragon
  keeps ≥1 best-in-class axis); economy sim over the quest/weekly pools.

### T6 — AUDIO THAT ANSWERS (1–2 sessions)
Kills: W14, W15, supports W6/W7. Cheapest full-game "feel" upgrade available.
- **PR-1 the missing answers**: miss whiff (T4 pairs), chain-drop down-chirp, natural
  Surge end exhale (the code comment already names it), purchase confirm + distinct
  deny (stop the affirmative click on failed buys), mid-run quest-complete chime,
  low-health heartbeat (subtle, off under reduceFx), and the **systemic lane-edge wind
  shear** at |x|>11 (audio + particle streaks — this is W15's engine-level tell, biome-
  independent).
- PR-2 mix hierarchy — **cheaper than it looks: the plumbing exists.** The `pumpGain`
  sidechain bus with ownership arbitration and the `duckHold` utility are live
  (sfx.js:1704, 2155–2166, 1207–1221) and `musicBus` gain is exposed; the work is
  trigger routing (danger/reward cues micro-duck music ~2dB/80ms pre-compressor — which
  *reduces* the master-comp pumping the code already fights) + calibration. Split
  `milestone()` into distinct reward vs warning voices; polyphony cap + shared throttle
  for per-frame param spam; calibrate one-shot levels against the LUFS meter that
  already exists (sfxLoudness.js — currently music-only).
- PR-3 identity: per-boss stinger motif (transpose + 2-bar motif per def — data-driven,
  cheap); give 1–2 FREE stations the song-form steering currently exclusive to paid
  tracks (first-session music shouldn't be the worst music).
- Verification: an events×audio coverage test built the repo's own source-assert way
  (grep the `emit('…')` sites like flowmeter.mjs Part A does — events.js is a bare
  14-line bus with no registry to enumerate) against a hand-mapped cue/silent-by-design
  table; LUFS bands for the new cues; owner ear pass.

### T7 — THE LOOK FLOOR + THE FPS FLOOR (parallel graphics stream, ongoing)
Kills: W12, W13. Already fully planned — this track is *sequencing*, not new design.
- **Mobile diet in plan order** — **D2 IS the in-flight #522** (don't double-count it):
  land #522 → D1 MSAA A/B on-device → D3 half-res god-ray march → D4→D7. Owner-phone
  fps entries are the gate log (never CI).
- **`?trailer=1` scripted-capture mode** — BOSS-VISUAL-AUDIT:423 calls it "the single
  highest-value tooling investment for selling the game" and it appears in no track of
  any plan; it belongs here (shot grammar is already specced in the audit's research
  digest). Small, pays every future gate + marketing shot.
- Boss visual Track A remainder (Embertide, Voidmaw — boss #1's face is the funnel's
  first impression — Ashtalon+Thrumswarm, Knellgrave), then Track B floor with the
  Eitherwing shape rebuild as anchor. Sequence rebuild-before-feel where a boss is
  slated for a shape rebuild (the stalled #236/#386 def-line work is cheap to land but
  costs owner-preview time — spend that after the rebuild, not before).
- Biome close-outs in doc order: Forum PR-END + PR-8 purge/audit → Tempest scarpwall
  sheet → Empyrean tail (#527 first). Then the queue: **SKYWEFT anchor boss** (Aurora's
  hazard stays **CUT** per HAZARD-OVERHAUL-PLAN §4 — "content nobody meets" — unless
  the owner reopens it), Tidal Reef, Amber retool (per BIOME-DESIGN).
- Graphics remainder when the above clears: N16 props (Amber/Astral), N7 dragon-surface
  v3, N12/N14 AA + grade v2, N8-PR-C atmosphere binding.
- Verification: the existing per-plan gates (Fable ≥4.2, tricount/envcount, owner
  preview) — unchanged.

### T8 — NEW META SURFACES (choose 2–3, owner appetite; after T1–T4)
Extends retention breadth once the core is repaired. Fit-ranked from §4:
- **Per-biome medal ladder** (3–4 standing medals × 8 biomes on a biome map screen;
  full set = mastered aura + small ember mult there) — gives feats a spatial home and
  the biome/boss investment a visible mastery matrix. M.
- **Rescue hatchlings** (seeded rare perch, whisker-pass frees, rides your slipstream
  to the next gate; feeds medals/quests) — the heroic dragon verb. M.
- **Zen + photo mode** (no-score/no-death drift + pause-orbit-share; reuses the shop's
  real-env static-cam law) — showcases the premium graphics for ~free. S–M.
- **Pre-run charm pairs** (2 slots, 6–8 charms, named pairs with radio callouts;
  normalized/banned in daily+challenge) — build identity without mid-run pauses. M.
- Egg gacha + secret routes: parked pending owner taste ruling (§8) — both work, both
  have optics/determinism stakes worth an explicit yes.

---

## §6 SEQUENCING (session-sized, two parallel streams)

**Stream A (design/code):** T0 (harvest #522 first) → T1 (the `?drift=1` feel-pass
first — its verdict shapes T3/T4 scoring) → T2 → T3-PR1/PR2 → T4 → T3-PR3/PR4 → T5
(after its ruling) → T8 picks.
**Stream B (art/perf, independent):** T7 in its own order (diet rungs ∥ boss tracks ∥
biome close-outs) — exactly the parallel-session model the lesson ledger is built for.
**T6 audio** slots into either stream as a palate-cleanser session (PR-1 early — it
pairs with T2/T4).

Cross-cutting laws (from the ledger, non-negotiable):
- **Determinism:** every scoring/gen change proves byte-identical daily/challenge replay
  against a pre-change fixture — gold-determinism.mjs plus the NEW deep (>3km) fixture
  T3 builds. New variance rides isolated forked streams (`hazardRnd` / goldEmbers
  `mulberry32(seed^CONST)` pattern), never raw `Math.random()` in shared paths — and
  never bare `mods.speed` for permanent tiers (bytes hold but fairness doesn't; speed
  must co-scale the steering chain). If a change MUST alter daily outcomes, it lands at
  a UTC season boundary with the share-race version flag.
- **Flags:** everything coexists behind a flag until its gate passes (`?drift=1`
  precedent); flips are their own tiny PRs.
- **Perf:** any per-frame addition shows its perfStats probe cost in the PR; tier-2
  budget is the binding one; no new draw calls in open flight without an offsetting cut.
- **Owner gates:** motion/feel judged on the PR preview only; Fable ≥4.2 for visual
  work; one revise round max before re-planning (AAA-PIPELINE convergence law).
- **THE RULE:** every landed increment writes its lesson file.

---

## §7 WHAT NOT TO DO (binding anti-scope)

1. No lane-grid movement, ever.
2. No open-flight enemy waves / bullet density (boss-scoped bullets only).
3. No mid-run upgrade drafts or pause-menu builds — buildcraft is pre-run.
4. No energy gates, session caps, or interstitial friction on restart.
5. No biome-order shuffle (load-bearing for difficulty + adjacent-tri budgets) — vary
   the event/weather layer instead.
6. No breaking the procedural-only law (the dormant GLB seam stays boss/dragon-preview
   tooling, or gets its own explicit owner ruling — Thundercoil precedent).
7. No new meters before the multiplier stack is unified (T1) — five is already too many.
8. Don't stack combat-feel PRs onto bosses slated for Track-B shape rebuilds; rebuild
   first (kills the #236/#386 sequencing trap).
9. Don't spend on the canyon rock machine or vesperLean-style A/B SKUs until the shop
   dominance ruling (T5) lands — no new dominated content.
10. Keep the "It's a skill issue" slogan and the pause-card / spell-card / motion-token
    systems — owner-protected.

---

## §8 OPEN OWNER DECISIONS (the plan stalls without these)

1. **DRIFT: flip it on?** The score policy is ALREADY ruled (§7 R1 FLAT — not up for
   re-decision). What's left: (a) after the `?drift=1` feel-pass against the numeric
   gates, flip default-on for free runs? (b) the §4a bossGraze feed — keep the capped
   F1 feed per your recorded middle-path ruling, or delete the listener?
   (Recommendation: feel-pass, keep the feed, flip.)
2. **Boss-school placement** (T2): mini-encounter on the first run ≥2 with no pending
   menu intro, as specced — or lower the real `firstAt` instead? (Recommendation:
   mini-encounter; keeps run 1 pristine and the 2,400m first real boss unchanged —
   the spec's re-arm restore guarantees that.)
3. **The archetype ruling** (T5): approve trade-off stat lines + phoenix revive identity
   + ascension debuff kill? (Touches purchases — grandfather rule included — and needs
   a one-line amendment to PREMIUM-REDESIGN-CHARTER's stats-freeze.)
4. **Lance pays embers** (T4): overturns `// score (embers NEVER)` (config.js:454–455)
   — which provenance-checks as an engineering default, not one of your rulings.
   "Parry stays score-premier" is preserved. Recommendation: yes, capped per-fight.
5. **Assist tax** (T2): glide ×0.7 → ×0.85?
6. **Appetite check** (T8): egg gacha — asked honestly against history: you shipped the
   Ember Gambit double-or-nothing (PR #4, 06-12) and killed it with refunds one day
   later (PR #8; the refund still lives in save.js:189–192). The egg differs where the
   Gambit hurt (fixed spend, guaranteed-new via no-dupe pity, zero loss outcome, no
   IAP, visible odds) — does your stance generalize to all chance mechanics, or was it
   about loss? Also: secret routes/portals? Difficulty modes stay OUT per your
   historical no-damage stance?
7. **Biome-0 identity on record** (T0): confirm Drowned-Forum-Roman is final so the
   Lagoon jungle docs can be banner-superseded.
8. **The §4a Surge-reflect melt** (standing, from DRIFT-BUILD §8): skilled reflect play
   kills mid-tier bosses ~3–4× tuned pace — a live, owner-observed exploit explicitly
   parked as "owner-gated balance". The plan carries it here so parallel sessions know
   it's parked, not forgotten.
9. **Thundercoil re-entry**: PR #175 merged 06-28 but the def was later removed from
   the roster — re-entry is a small PR + preview, and it would be the one GLB asset in
   an otherwise 100%-procedural roster. Rule: re-enter, or stay dormant?

---

## §9 AUDIT LOG (the plan audited against itself)

Adversarial audit run 2026-07-20 — three independent auditors (grounding / feasibility /
conflicts-and-scope), all findings folded into the sections above. The record:

**Grounding: ~93% of ~100 checked claims confirmed exactly** (most citation-perfect).
Material corrections applied: the "radio dies on crash" premise was FALSE (no music
teardown exists — T2/§4 rewritten to the real gap: the death lowpass/duck staying
engaged); Thundercoil PR #175 was already merged 06-28 with the def later removed from
the roster (T1 item moved to §8.9 as a re-entry ruling). Minor numeric fixes: 24
missions not 22, 10 stat lines not 9, 113 blocked suites not 115, 14 milestone()
meanings not 13, boss-2 at ~9.9km earliest not 7–10km; citation fixes (parry teach at
boss.js:2728; missions.js:17–44). Bonus finding adopted into W7: the SHIELDED banner
teaches a false mechanic (boss.js:6136).

**Conflicts: 5 contradictions found and corrected.** (C1) T1's original "DRIFT drives
the score mult / retire flowChain" was written against the owner's §7 R1-FLAT ruling
merged the day before in #528 — T1 rewritten around the ruling; (C2) W11 described
DRIFT's pre-07-19 state (keel HUD + ruled mult already merged) — rewritten; (C3) T7
resurrected the CUT Aurora hazard — now SKYWEFT-only; (C4) T1 mis-scoped #523 (Vesper
hero only) — corrected to ride-then-follow-up; (C5) T5 collided with the premium
charter's stats-freeze — sequencing/amendment note added. Territory double-assignments
resolved: T3-PR1 absorbs the hazard-plan near-miss hook + FLOW verb list; T4/T5 declare
supersedes over stalled #193 parts C/E; T4's combo pricing re-routed through the ruled
DRIFT dent table. Taste reframings: risk pricing presented as constant-total-punishment
legibility (the owner's recorded soften-don't-punish pattern); the gacha question now
carries the Ember Gambit history. Missed priorities added: `?trailer=1` (T7), the §4a
melt decision (§8.8), the drift feel-pass-first sequence (T1), credit for the shipped
P0 fixes (§2).

**Feasibility: 0 of 12 attacked mechanisms infeasible; 7 needed spec surgery, applied:**
T0 became a harvest of #522 (which already contains the run-all fix + ~27 red-suite
repairs — that PR's claim; plus: no CI workflow runs tests at all, and a stale duplicate
root tests/ tree exists); T1's flip needs a run-mode guard that doesn't exist yet
(drift.js:26–30) — added as the ship-PR's first item; T2's school needed the re-arm
restore + ladder/foreshadow bypasses (else the real first boss slides to ~4,500m or gets
banned by `lastBossKey`) — specced; T2's radio item collapsed to hours (release
lowpass/duck on settle); T3-PR1 became an extension of the SHIPPED 60Hz near-miss
system (no new tick; in-boss routing deleted as impossible); T3-PR2's speed tier moved
off bare `mods.speed` (byte-safe but fairness-unsafe — no steering co-scale) onto the
co-scaled steering chain, and main-stream generator variables were split out as
season-boundary-only; T3-PR4's exclusion moved inside `seedForRun`'s random branch
(first flight + rush excluded by construction); T4's economy gate was exposed as
vacuous for boss pay (the [120,400] band models a 1.2km run) — extending the model is
now a T4 prerequisite; T5's "save migration" was deleted (stats are live-read at equip;
the gate is a dominance script over the new table); T6-PR2 shrank (sidechain plumbing
exists). Effort re-estimates adopted: T2 2.5–3.5 sessions (was 1–2), T0 ½ session only
as a harvest, T3-PR1 S.

**Riskiest residual assumptions** (watch during build): the school's scheduler-state
bypass is the most delicate item in T2; the deep >3km determinism fixture must exist
BEFORE any T3-PR2 main-stream change; #522 is `dirty` and needs a rebase before
anything in T0/T7 stacks on it.

**Post-audit verification (2026-07-20):** a no-bail sweep of all 113 runnable suites on
this branch (= master + these docs) was run directly — **26 fail** (badges, boss,
bossrushui, buildstamp, canyon, celebrate, economy, gauntlet-follow-surge, glbcontract,
graphicssettings, knellburn, particlebatch, perfhud, recap, resgovernor,
return-triggers, save-migration, save-purchases, shoulderbridge, stamina, sweptail,
sweptprofile, torsoshoulder, unifiedhull, unmaskedarena, weftorgans). This independently
confirms W18/T0 (the "~27 reds" figure previously rested on #522's word) — the reds are
real and invisible today because the gate exits on script #1 before reaching them. The
harvested #522 branch must run these green in the new CI job to close T0.

---

*Sources: BOSS-VISUAL-AUDIT.md, DRAGON-SURGE-OVERHAUL.md, DRIFT-BUILD-PLAN.md,
FLOW-OVERHAUL-PLAN.md, HAZARD-OVERHAUL-PLAN.md, MOBILE-GRAPHICS-DIET.md,
GRAPHICS-OVERHAUL.md, GRAPHICS-PERF-PLAN.md, UI-PREMIUM-OVERHAUL.md, HUD-REDESIGN.md,
WELCOME-HUB-REDESIGN.md, BIOME-DESIGN.md, BIOME-OVERHAUL-PLAYBOOK.md,
DROWNED-FORUM-HANDOVER.md, EMPYREAN-UPLIFT-PLAN.md, TEMPEST-COMPOSITION-BUILD-SHEET.md,
ROCKRUN-STRAIT-HANDOFF.md, LOST-LAGOON-HANDOFF.md, WALL-PROPS-REDESIGN.md,
FRESH-DRAGONS-SYNTHESIS.md, PREMIUM-REDESIGN-CHARTER.md, STARTER-REDESIGN.md,
CREATURES.md, AAA-PIPELINE.md, the LEAPFROG ledger + leapfrog/lessons/, and the live
code cited throughout.*
