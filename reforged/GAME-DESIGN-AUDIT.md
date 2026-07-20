# GAME-DESIGN-AUDIT — the whole-game teardown + the NEXT-LEVEL leverage plan

**Date:** 2026-07-20 · **Status: DRAFT — adversarial audit round IN PROGRESS** (§9 pending; do not build from this until it reads AUDITED FINAL)
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
  config.js:495) — a fully-built, tested momentum currency no player has ever seen.
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
boss visual audit itself; DRIFT hero build (flag-gated); dynRes default-on.

**In-flight now (don't collide):** PR #523 Surge I5 + Vesper circuit · PR #529 boss
Track-A items 1–2 (Unmasked, Brineholm) · PR #527 Empyrean ring court · PR #522 mobile
diet rung 1 · PR #530 HUD combo-slug fix.

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
stamina than the free starter (dragons.js:1149); 14 SKUs, 9 distinct stat lines. [T5]

**W3. Verb scarcity.** Four verbs, five multipliers; no bank/dive/momentum physics
(config.js:15–17, player.js:177–180); combo flatlines at ×5 after 16 rings
(config.js:66–67). [T3, T8]

**W4. The lance layer: untaught, unpaid.** ~90 constants (config.js:276–489); zero
tutorial/hint/mission coverage (gestureTutorial.js:38–66, hints.js, missions.js);
`embers NEVER` (config.js:455). Depth the funnel can't find, the economy won't reward. [T4]

**W5. Bosses: unseen, then under-rewarded.** First at 2,500m snap-scheduled to 2,400m
every run (config.js:513, boss.js:6222); a fight spans 3–7.5km so boss #2 sits ~7–10km
deep; kill pays flat 60◆ ≈ 2.4 golden pickups at any tier (config.js:583,599) while the
fight suspends the ring/combo engine (rings.js:146) — cruising the same 60–90s usually
pays more. Mandatory once triggered, no skip. Players learn to dread the showpiece. [T2/T4]

**W6. Inverted risk pricing + the silent miss.** Ring miss = combo hard-reset + Surge
killed (rings.js:258–272); 25-damage hit keeps full ×5 combo (collision.js:365–367);
a miss at combo ≤1 produces **zero feedback** — sfx gated behind `combo > 1`
(rings.js:263–267). Optimal play reads backwards: tank the rock, never whiff the ring. [T4/T6]

**W7. First-session boss economy is untaught.** Graze→Surge charge→shield break is the
whole phase-advance loop (boss.js:6119–6139) but "graze" is never tutorialized; parry gets
one 3s line at 2,400m (bossDefs.js:94); Surge silently flips auto→manual inside bosses
(rings.js:246–255 vs boss.js:3362–3366); the mobile second finger is overloaded 4 ways
(hold=boost, tap=surge, swipe=roll, long-hold=focus — input.js:27–35,122,188–231). [T2]

**W8. Run-to-run sameness.** Biome order is a constant (`CYCLE`, biomes.js:540); overlay
cadences fixed; 4 obstacle archetypes + gate; canyon roster 2-of-3 with rock at weight 0
(config.js:179); zero mid-run events/choices anywhere (events.js is a 14-line bus). By
run ~3 a player has seen every system. [T3]

**W9. Economy: drips vs walls.** ~200–600◆/run realistic vs sinks totalling ~220k
(dragons 47.6k + trails 34k + music 22.6k + ascension ~114k with 15k/60k/150k **metre**
gates); mid-game has no attainable want; ascension's F1 baseline is secretly a debuff
(handling 0.96, ascension.js:34–39) — the flagship sink sells back stats it removed. [T5]

**W10. Missions train grinding, not mastery.** All 22 defs are accumulate-N counters
(missions.js:18–43); zero boss/parry/graze/canyon quests; contradictory pairs can share
the 3 slots (28-near-misses vs fly-800m-clean). [T4]

**W11. DRIFT shipped dark and un-unified.** `enabled:false` (config.js:495); no HUD
readout of its own; no meta system reads it; its score mult diverges from the shipped
chain mult (config.js:509 vs 167); its speed expression exceeds a governor its own
comment admits is already blown (~166 m/s vs 130, drift.js:50–51). [T1]

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
compressor; `sfx.milestone()` means 13 different things including both "reward" and "boss
incoming"; free stations loop 8 bars forever while all 9 dynamic-form tracks are paid. [T6]

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
`_diag-rock-caps.mjs` asserts on a mode weighted 0) so **none of the other 115 suites run
in CI** (tests/run-all.mjs:15–18); README materially lags (six worlds/17 stations/13
suites/v2 save — actual: 8/35/116/v5); WELCOME-HUB header still says "NOT YET BUILT"
(built 07-17); HANDOFF-REVENANT says "no dragonRevenant.js exists" (it does);
BOSS-DESIGN roster table pre-dates the audit; Biome 0 is claimed by three docs with
incompatible identities (Lost Lagoon jungle vs Drowned Forum Roman vs old Sanctuary);
~14 stalled PRs hold unmerged specs. In a repo whose whole method is compounding
documented knowledge, stale docs are actively toxic. [T0]

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
3. **Sub-second restart + radio continuity through death** (Super Hexagon) — music keeps
   broadcasting across the crash; compressed recap on repeat deaths. Directly multiplies
   attempts-per-session. S.
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

### T0 — REPAIR THE TRUTH LAYER (½ session, do first)
Kills: W18. The cheapest real work in this plan and it un-breaks verification for
everything after it.
- **Fix the run-all gate**: skip `_diag-*.mjs` in tests/run-all.mjs (or delete the stale
  rock diagnostic); run the full 116-suite sweep; fix/quarantine anything genuinely red;
  CI must exit 0 on master.
- Doc-truth pass (mechanical, no design): correct WELCOME-HUB / HANDOFF-REVENANT /
  BOSS-DESIGN-roster / DROWNED-FORUM-sheet stale headers + README counts; add a
  one-line "superseded by X" banner on Lost-Lagoon-vs-Forum (biome-0 identity: the
  07-18 Forum green-purge is live truth).
- Stalled-PR triage sheet for the owner: close #496 (superseded) and likely #300/#484;
  list keep/kill calls for the other ~11 with one-line rationale each.
- Verification: `node tests/run-all.mjs` green end-to-end; grep for the corrected
  claims; PR triage table in the PR body.

### T1 — SHIP THE DARK CARGO (1–2 sessions)
Kills: W11, chunks of W1/W6. Months of built work → player-visible, mostly by decision.
- **DRIFT ship-or-kill ruling (owner), then the ship PR**: wire the Ember Keel HUD to
  the live meter, reconcile the multiplier stack (one law: chain/graze/trick pay DRIFT;
  DRIFT drives the score mult; retire the divergent flowChain mult rather than stacking
  a fifth), keep boss graze-charge intact (it feeds Surge, not DRIFT), then flip
  `DRIFT.enabled` default-on for free runs (daily/challenge keep legacy scoring until a
  season boundary — see §6 determinism note).
- Surge I5 completion (in-flight #523): roster accent migration + tier fallbacks; then
  schedule the accumulated owner play-verify dial list from I1–I4 as ONE preview batch.
- The 5 graphics default flips (tonemap-Neutral, sky-IBL, dragon shadow, fast particles,
  clouds) as ONE owner preview session with per-flip screenshots — shipped-OFF work is
  invisible work.
- UI Gate-3 judgment batch: welcome-hub + Phase-4 theater + H9 garnish in one Fable +
  owner pass.
- Thundercoil (PR #175): schedule the preview sign-off; it's a finished dragon parked on
  knob-tuning.
- Verification: drift.mjs + flowmeter.mjs green with the unified law; byte-identical
  daily/challenge fixture replay; Fable ≥4.2 on keel HUD; owner preview for flips.

### T2 — FIRST-SESSION REPAIR (1–2 sessions)
Kills: W5(first half), W7, W16, chunk of W14. The funnel finally meets the game.
- **The boss-school beat**: on run 2 or 3 (not run 1 — protect the pristine authored
  first flight), stage a scripted mini-encounter at ~900–1,200m against the existing
  tutorial-flagged Voidmaw kit in teach mode: 3 graze rings → "GRAZE CHARGES SURGE" →
  one amber volley → "ROLL INTO AMBER TO PARRY" → manual "TAP TO UNLEASH" shield-break
  → instant FELLED + outsized first-kill payout. Reuses gestureTutorial's paused-beat
  pattern (the proven FTUE skeleton) + existing boss kit; no new content, one new
  scheduler entry. Also: surface first *real* boss at the existing 2,400m unchanged.
- Teach-the-thumb fixes: distinct Surge-tap affordance in bosses (pulsing HUD chip +
  larger dead-zone between tap/swipe thresholds, input.js:229); "graze"/"parry"/"lance"
  hint bits; re-arm all hint bits after ≥5 idle days (save timestamp exists); CONTROLS
  card in the pause hub.
- Retry-loop compression: radio keeps playing through death (kill the music teardown on
  crash; duck instead); every 2nd+ consecutive quick-death gets the compressed recap
  (score + NEXT UP + FLY AGAIN immediately; full ledger on records/purchases/every 3rd);
  add the missing death-cause lines (bullet/geyser/lightning, recap.js:151–158).
- Assist-tax narrowing: glide ×0.7 → ×0.85–0.9 (owner call; keep assists-off bonuses).
- Verification: extend tests/ftue funnel suite (hint re-arm, compressed-recap gating,
  cause lines); boss-school headless script (teach beats fire, no damage before parry
  teach); owner feel pass on the mini-encounter pacing.

### T3 — MAKE MINUTE 6 DIFFERENT (2–4 sessions, the design core)
Kills: W1, W3(partly), W8, W17. This is the "next level" for the endless loop itself.
- **PR-1 Open-flight graze** (the genre steal that unifies): whisker-pass detection on
  existing colliders (reuse the broadphase, 10–15Hz tick, no new allocations), pays
  chain/DRIFT pips + the boss grazeGain path when in-boss (one system, two payouts);
  wind-shear audio cue (shared with W15's edge tell); a graze feat family + medal hooks.
  Determinism: scoring-only (no world mutation) → seed-safe by construction.
- **PR-2 The post-plateau ladder**: extend `difficulty()` past 2,100m with *variables*,
  not density — staged unlock distances for shard-motion modes, tighter gauntlet
  spacing floors, hazard cadence tiers, and a speed tier at 4–5km (via the proven
  `mods.speed` path so pinned seeds stay byte-identical — the daily fixture test is the
  gate). Cap density growth where it stands.
- PR-3 Hazard overhaul PRs 1–2 of the descoped 5 (plan exists; fix the 2 recorded
  telegraph bugs first) — hazards are biome identity AND the minute-6 variable set.
- PR-4 Run identities: one per-run event slot for FREE runs only (storm surge / golden
  stretch / boss-rush offer), drawn from the run seed, excluded in daily/challenge;
  biome-order stays fixed (it's load-bearing for difficulty + adjacent-tri budgets —
  don't shuffle it, vary the *weather/event layer* instead).
- (T3-stretch, behind flag) the 5th verb prototype: dive-for-speed with a stamina cost
  and a pull-up window (or air-brake) — prototype → owner feel gate → only then does it
  enter scoring. Prior-art rule satisfied (Tiny Wings dive, Laya's dive).
- Verification: byte-identical replay of a pre-change daily fixture (the repo's own
  golden-ember RNG isolation pattern); perf: graze tick ≤0.2ms on tier-2 (perfStats
  probe); Fable pass on hazard telegraphs; owner preview on event-slot noticeability.

### T4 — PAY THE FIGHT (1–2 sessions)
Kills: W4, W5(second half), W6, W10. Mostly def-table + tuning work, tiny code.
- **Boss pay rework**: defeat pay scales by tier + performance (base 150–600◆ by tier;
  +per-phase pips; no-hit bonus; advertise the +25 heal as a FELLED banner line);
  lance volley quality pays embers (kill the `embers NEVER` law — it predates the
  economy findings; cap per-fight to keep faucet bounded ~+20% of a good run).
- Mission rework wave 1: retire/reslot pure-counter chores; add verb quests (parry
  chain, flawless canyon, on-beat volley, graze streak, boss no-hit); slot-exclusion
  matrix so contradictory pairs can't co-occupy; missions can reference lance verbs now
  that they're taught (T2 dependency).
- Miss whiff-cue: soft airy "whiff" + 120ms ring-ghost at combo ≤1 (fills the zero-
  feedback hole); combo damage-pricing: a hit drops N combo tiers (2) instead of being
  free while a miss hard-resets — makes risk pricing read forward.
- Verification: economy-band test update (tests/economy) — per-run faucet stays within
  the design band (+15–25%); recap ledger shows boss lines; A/B the whiff cue volume vs
  music (audio sidechain from T6 helps).

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
- Verification: stat-spread table in the PR (14 SKUs → 14 distinct lines, dominance
  check scripted); save-migration test (owned rosters keep value); economy sim over the
  quest/weekly pools.

### T6 — AUDIO THAT ANSWERS (1–2 sessions)
Kills: W14, W15, supports W6/W7. Cheapest full-game "feel" upgrade available.
- **PR-1 the missing answers**: miss whiff (T4 pairs), chain-drop down-chirp, natural
  Surge end exhale (the code comment already names it), purchase confirm + distinct
  deny (stop the affirmative click on failed buys), mid-run quest-complete chime,
  low-health heartbeat (subtle, off under reduceFx), and the **systemic lane-edge wind
  shear** at |x|>11 (audio + particle streaks — this is W15's engine-level tell, biome-
  independent).
- PR-2 mix hierarchy: a critical-cue sidechain (danger/reward cues micro-duck music
  ~2dB/80ms), split `milestone()` into distinct reward vs warning voices, polyphony cap
  + shared throttle for per-frame param spam, calibrate one-shot levels against the
  LUFS meter that already exists (sfxLoudness.js — currently music-only).
- PR-3 identity: per-boss stinger motif (transpose + 2-bar motif per def — data-driven,
  cheap); give 1–2 FREE stations the song-form steering currently exclusive to paid
  tracks (first-session music shouldn't be the worst music).
- Verification: an events×audio coverage test (every emitted gameplay event maps to a
  cue or an explicit silent-by-design list); LUFS bands for the new cues; owner ear pass.

### T7 — THE LOOK FLOOR + THE FPS FLOOR (parallel graphics stream, ongoing)
Kills: W12, W13. Already fully planned — this track is *sequencing*, not new design.
- **Mobile diet D2→D7 in plan order** (rung 1 in flight, #522): D2 fold grading →
  D1 MSAA A/B on-device → D3 half-res god-ray march → … Owner-phone fps entries are the
  gate log (never CI).
- Boss visual Track A remainder (Embertide, Voidmaw — boss #1's face is the funnel's
  first impression — Ashtalon+Thrumswarm, Knellgrave), then Track B floor with the
  Eitherwing shape rebuild as anchor. Sequence rebuild-before-feel so #236/#386-class
  work isn't wasted on pre-rebuild bosses.
- Biome close-outs in doc order: Forum PR-END + PR-8 purge/audit → Tempest scarpwall
  sheet → Empyrean tail (#527 first). Then the queue: Aurora hazard+SKYWEFT, Tidal
  Reef, Amber retool (per BIOME-DESIGN).
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

**Stream A (design/code):** T0 → T1 (DRIFT ruling first — it shapes T3/T4 scoring) →
T2 → T3-PR1/PR2 → T4 → T3-PR3/PR4 → T5 (after its ruling) → T8 picks.
**Stream B (art/perf, independent):** T7 in its own order (diet rungs ∥ boss tracks ∥
biome close-outs) — exactly the parallel-session model the lesson ledger is built for.
**T6 audio** slots into either stream as a palate-cleanser session (PR-1 early — it
pairs with T2/T4).

Cross-cutting laws (from the ledger, non-negotiable):
- **Determinism:** every scoring/gen change proves byte-identical daily/challenge replay
  against a pre-change fixture (the golden-ember isolation pattern). New variance rides
  the run seed or the `mods` path, never raw `Math.random()` in shared paths. If a
  change MUST alter daily outcomes, it lands at a UTC season boundary with the share-
  race version flag.
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

1. **DRIFT: ship or kill?** (T1 — recommendation: ship as THE unified momentum system;
   the alternative is deleting a finished, tested system.)
2. **Boss-school placement** (T2): run 2–3 mini-encounter as proposed, or lower the real
   `firstAt` instead? (Recommendation: mini-encounter; keeps run 1 pristine and the
   2,400m first real boss unchanged.)
3. **The archetype ruling** (T5): approve trade-off stat lines + phoenix revive identity
   + ascension debuff kill? (Touches purchases — grandfather rule included.)
4. **Lance pays embers** (T4): overturns a written config law (`embers NEVER`,
   config.js:455). Recommendation: yes, capped.
5. **Assist tax** (T2): ×0.7 → ×0.85?
6. **Appetite check** (T8): egg gacha (no-dupe, no-IAP, visible odds)? secret routes?
   difficulty modes stay OUT per your historical no-damage stance?
7. **Biome-0 identity on record** (T0): confirm Drowned-Forum-Roman is final so the
   Lagoon jungle docs can be banner-superseded.

---

## §9 AUDIT LOG (the plan audited against itself)

Adversarial audit run 2026-07-20 (three independent auditors: grounding / feasibility /
conflicts-and-scope). Material findings and how the plan changed:

*(filled in §9 after the audit round — see PR description for the full audit reports)*

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
