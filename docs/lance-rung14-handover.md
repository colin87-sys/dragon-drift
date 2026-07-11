# Handover — Lance Ladder **Rung 14: THE UNMASKED** (the finale)

> **You are taking over the last rung of the lance-progression ladder.** Rungs 10–13 are
> shipped and merged. This document is everything you need to build rung 14 the way the
> previous four were built: audited, adversarially reviewed, verified, and shipped without
> breaking the roster. Read it end-to-end before touching code.

---

## 0. First 20 minutes (do these in order, do not skip)

1. **Read `LEAPFROG.md`** (the frozen playbook) and **skim `leapfrog/lessons/`** newest-first.
   The four lessons that matter most for you:
   - `2026-07-10-lock-organ-comfort-vs-reachability.md` — the comfort LAW.
   - `2026-07-10-onewing-inverted-spectral-echo.md` — the "focal organ is out of lane → invert" pattern.
   - `2026-07-11-embertide-sky-proxy-and-fork-weapon.md` — the sky-boss proxy pattern + the reparent trap + the crush-seal.
   - `2026-07-10-scarburn-resonant-toll-and-critic-gate.md` — the not-a-phase-deleter model + the critic gate.
2. **Read `reforged/BOSS-DESIGN.md`** (the boss laws) and the plan **`docs/lance-progression-redesign.md` §"Rung 14 — THE UNMASKED"** (~line 359). That section is your spec; the plan wrote it as "this CP2, shaped."
3. **Read `docs/lance-progression-feasibility.md`** — the balance/organ feasibility notes (search "UNMASKED", "§8D", "reckoning").
4. **Restart your branch from master** (both my PRs merged; see §7): the designated branch is
   `claude/lance-system-boss-progression-ui4r4l`.
5. **Set your git identity** so commits verify:
   `git config user.email noreply@anthropic.com && git config user.name Claude`.

---

## 1. THE RULE you must follow (non-negotiable, owner directive)

Every rung ships through this exact gauntlet. It is why all four prior rungs merged clean and
each caught a fatal flaw before code:

```
CP1 pre-audit (Fable, high-effort)  →  build  →  CP2 diff critic (Fable, adversarial)  →  headless verify  →  push  →  draft PR  →  owner playtest GO
```

- **CP1 = a design pre-audit BEFORE any code.** Spawn a **high-effort Fable agent** (Agent tool,
  `model: fable`, `subagent_type: general-purpose`, run in background). Its job: reconcile the
  plan's organ node names against the *real* model, run the comfort LAW arithmetic, verify the
  plumbing seams exist, find the false premise. **Every single CP1 so far found the plan
  unbuildable as written** (Onewing's eye was out of lane → invert; Embertide's face was
  reparented out of reach → proxies). Assume yours will too.
- **CP2 = an adversarial diff critic AFTER you commit, BEFORE you push/merge.** Spawn another
  high-effort Fable agent on `git show <your-commit>`. Its job: find the ship-blocker. **Every
  CP2 found a real HIGH bug** (Onewing: the Surge fork fired ghosts at full damage; Embertide:
  a banked set voided into the P5 seal). Fold its findings, add tests for them, re-verify.
- **The owner is the final gate** on any damage-LAW change and on FEEL. Thin balance margins and
  "does it read right" are HARD owner-playtest gates — you cannot certify them headless. Flag
  them clearly on the PR and leave the PR a **draft** until the owner marks it ready.
- The CP1/CP2 prompt bodies I used are long and specific (node reconciliation, the comfort
  arithmetic with the transform chain, the plumbing seams, the dead-config sweep). Reuse their
  shape — see §9 for the skeleton.

**Do not batch the gates. Do not skip the CP1 because "the plan says zero new rules."** The plan
also said Embertide needed "no new empties" — it needed a whole proxy system.

---

## 2. What is already shipped (the ladder so far)

| Rung | Boss | Signature mechanic | PR |
|---|---|---|---|
| 10 | Knellgrave | resonant **on-toll** perfect release + SCAR-BURN (frac 0.25) | merged #349/#355 |
| 11 | Weftwitch | "the volley tears, she mends" + the **comfort LAW** | merged #356/#360/#363 |
| 12 | Onewing | the **inverted spectral echo** (paint the dead frame, the living eye answers at ½) | merged #365 |
| 13 | Embertide | **the beam duel** (fork a banked set to extend the duel window) | merged #369 |

All four went CP1 → build → CP2 → verify. The lance is now a genuine DPS/utility tool from
slot 10 through 13 — which was the original goal ("helpful by the last boss, not useless").

---

## 3. Rung 14 — THE UNMASKED: the design intent (from the plan)

**The finale is the tested vocabulary at full power. Zero *new lance rules* by intent — but see
the two caveats in §5 (the RECKONING and the burn-unlock are real economy plumbing).**

The boss is `unmasked` (BOSS_ORDER index **13**), **tier 5**, **`formLifebars: true`** — a
**three-form** fight: each stage is its own full 240-HP bar (defeat a form → shield → Surge
through → the bar refills + the next form's transition; only the LAST form's defeat is death).
Effective ~720 HP, ~3.5-min apex. `scale: 2.4` sky-scale, `approachFrom: 'ahead'`, `muzzle:
'focalEye'`, `virtualLockOrgan: 'focalEye'`. Three phases = three stages:

- **Stage 1 — the eclipse disc** (`phases:[0]`, card `unmasked_secondsun`, timer 26). The
  Sentinel quote. V1 aim on `focalEye` through the lid; **two paintable wound organs on the
  crack seams** (`crackSeamL`/`crackSeamR`). Reachable (2+1)×2 = 6.
- **Stage 2 — the seraph** (`phases:[1]`, card `unmasked_ophanim`, timer 30). The constellation +
  the reliquary:
  - **Six curated watcher eyes** (`wingEye0..5`) — anchor empties at authored mirrored positions
    across the six wings (the ~20 eye meshes are merged, so anchors are required anyway). The
    Eitherwing moving-eye lesson × 6.
  - **Five relics** wired to the wing-roots — `relicHorn` (Voidmaw), `relicBlade` (Ashtalon),
    `relicLink` (Brineholm's chain-maker), `relicSpool` (Weftwitch), `relicShard` (Knellgrave).
    The Karnvow trophy lesson quoted at the top of the lore web. Branding a relic flashes that
    boss's palette + a one-note theme quote (pure presentation).
  - **THE RECKONING** (collection mechanic — presentation + economy): brand all five relics at
    least once during stage 2 → **unlocks the finale burn** (stage 3's on-tell releases go from
    no burn to `scarBurnFrac` **0.20**). When the fifth relic takes, every eye across the wings
    snaps to the player — the reveal-hold screenshot, earned by the lance.
- **Stage 3 — the unveiling** (`phases:[2]`, card `unmasked_verdict`, dread, timer 34).
  `starEye`, the `halo` anchor, `wingRootL`/`wingRootR` relic-root empties. On-tell releases into
  the unveiled core (post-RECKONING, burning at frac 0.20) are the game's peak lance expression.

**Utility math (the headline):** `formLifebars` ⇒ `currentPhaseHp()` returns the full 240 form
bar, so the ROI ceiling is 24 and **the clamp never bites at the finale** — the lance is purely
skill-limited. Base full set 12 (5% of a form), on-beat 15 (6.25%), post-RECKONING on-tell burns
+3 = 18 (7.5% of a form). Across the fight ~31.5% of clear pace (~⅓, the owner's §8D target — NOT
the ~52% the old frac 1.0 produced). The finale owns the biggest RAW numbers in the game
(spectacle + absolute size), not a dominating share.

---

## 4. Ground truth — what EXISTS vs what you must BUILD

I checked the live model (`reforged/js/bossUnmasked.js`) and def (`reforged/js/bossDefs.js`).

**Confirmed model nodes that EXIST:** `focalEye` (:193), `crackSeams` (:178, the merged crack
geometry), `halo` (:562), `starEye` (:606).

**Nodes the plan names that DO NOT exist yet — you must add them as anchors (like every prior
rung):** `crackSeamL`/`crackSeamR` (empties on the `crackSeams` geometry), `wingEye0..5`, all five
`relic*`, `wingRootL`/`wingRootR`. Grep confirmed a count of 0 for these. **This is real model
work, not just def wiring** — and it is exactly the kind of thing the CP1 must map before you
build (which anchors, at what local positions, that resolve AND are comfort-legal).

**The def already has:** `tier: 5`, `formLifebars: true`, `virtualLockOrgan: 'focalEye'`,
`muzzle: 'focalEye'`, the three phase cards. It does **not** yet have `lockParts`, any
`scarBurn.fracBySlot.unmasked`, or a RECKONING flag — you add those.

---

## 5. The RISKS the CP1 MUST resolve before you write code (ranked by ship-danger)

1. **COMFORT on a sky-scale finale — the #1 risk, and the prior two rungs both failed it.**
   `scale: 2.4` and "the disc hangs huge above the lane" means the organs (focalEye, wing eyes,
   relics) are very likely at **world-Y > 22 and/or |x| > 10.4** — the exact Onewing/Embertide
   trap (the static balance model calls them reachable; the live game can't aim them). The comfort
   LAW: an acquirable organ's world **|x| ≤ 10.4** (`laneHalfWidth 13 − coneXY 2.6 − 2.0 slack`)
   **AND world-Y ≤ 22** (`laneMaxY`, the aim ceiling), at the worst case across the animation
   (station sway + the placeGroup idle yaw/roll wobble that projects a node's forward-z into
   lateral-x + any station/pose motion). **Make the CP1 do this arithmetic per organ.** If they
   fail, the fix is the shipped patterns: **station-space proxy organs** on `group` with the model
   painting the brand on the visible feature (the Embertide pattern), or **low in-lane anchors**
   (the Onewing frameRoot pattern), or invert.
2. **Is `unmasked` `skyReplace`?** Embertide's `skyReplace` reparents the whole rig out of
   `partWorldPos`'s reach → face nodes resolve to null in the live fight while headless tests
   green. I did **not** see `skyReplace` in the unmasked def block (it's `approachFrom: 'ahead'`,
   not a sky-dome-replace), but **VERIFY THIS FIRST** — if any organ lives on a reparented/
   camera-locked sub-rig, it's dead in the live fight. Either way: **the organ test MUST drive the
   real post-`enterFight` live path** (`bossForceFight` → the reparent/placement), not the studio
   path, or it will green on a dead lance. (Embertide's test asserts a known face node resolves to
   `null` as positive proof it ran the live path — steal that.)
3. **Multi-form phase-gating.** `formLifebars` + three stages ⇒ `lockParts` MUST be phase-gated:
   crack seams in `phases:[0]`, wing eyes + relics in `phases:[1]`, star/halo/wing-roots in
   `phases:[2]`. The `lockdpsCore` model already handles phase-gated `lockParts` (the BRINEHOLM
   precedent — its shackles gate out of P4). Verify `reachableCap` computes the right per-stage cap
   (each stage should reach the tier-5 cap of 6 or be honestly below it).
4. **THE RECKONING is a genuine new mechanic** (despite "zero new rules"). It needs: tracking which
   of the 5 relics have been branded this stage-2, a "reckoning complete" flag, the eye-snap
   reveal on the 5th, and gating stage-3's burn (`scarBurnFrac 0.20`) on that flag. Design it like
   the prior rungs' rules: def-gated, coexist-safe, and — critically — the **burn unlock must be
   modeled in `lockdpsCore`** or the not-a-phase-deleter gate passes vacuously (the SCAR-BURN
   dead-invariant trap; Onewing's echo term is the template for "the model must see the new
   damage source").
5. **`formLifebars` + the balance model.** Confirm `currentPhaseHp()` returns the full 240 form bar
   (so ROI ceiling 24, clamp never bites) and that `lockdpsCore`'s `phaseSpans`/`bossEconomy`
   handle a `formLifebars` boss correctly (each form is a full bar, not an atFrac slice). The plan
   leans hard on "the clamp never bites at the finale" — verify the model agrees, and that the
   burn-at-0.20 lands ~⅓ of clear pace, not more.
6. **Dead-config / false-premise sweep** (every CP1 caught one): grep that `formLifebars`, the
   RECKONING flag, `scarBurnFrac`/the burn seam, the relic→boss-palette quote, and every cited
   node/knob are actually consumed where the plan assumes.

---

## 6. The code map — where the lance system lives

| File | What's there / what you'll touch |
|---|---|
| `reforged/js/config.js` | `CONFIG.LOCK` (capByTier `{1:0,2:3,3:5,4:6,5:6}`, `stackMax 2`, `volleyRoiFrac 0.10`, `dwellTime 0.35`, `coneXY 2.6`). **`scarBurn`**: `minTier 4`, `burnFloor 3`, `dur 3.0`, `echoDmgMult 0.5`, **`fracBySlot`** (add `unmasked: 0.20` — but see §5.4, it's RECKONING-gated). `beamDuelExtendPerPip` is Embertide's. |
| `reforged/js/lockLayer.js` | The paint/decay/cap/volley machine. `lanceDmgEach` (the ROI clamp kernel), `releaseVolley` (real+ghost effPips clamp), `grantEchoPip` (Onewing), `consumeAllLocks` (carries `lk.ghost`), `lockHudState` (per-pip markers incl. `ghost`), `dropLockPart`. **Three release paths share this: `releaseVolley` (tap/cap/decay), the Surge fork (`surgeForkLances` in boss.js), and the granted echo.** Any new per-pip property must be taught to all three (the Onewing CP2 bug). |
| `reforged/js/boss.js` | The controller. Key seams: `paintableParts()` (the live paintable set — has `eyeSealed`/`recoilSealed`/`crushSealed`/`lockPartDead` filters), `lockCandidates()` (the aim list — same filters), `surgeForkLances()` (the fork; bails on `lockDeflected()`, halves ghosts, extends the beam duel), the `on('lockPaint')` echo trigger, the SCAR-BURN listener on `on('lockVolley')` (reads `paintedCount`/`volleyTotal`), `lockDeflected()` (the seal — shield/survival-card/felledLie/condense), `currentPhaseHp()` (the ROI base; honors `formLifebars`), `beginCard()` (survival resets). The lock-layer ctx is built ~line 2615 (`updateLockLayer(dt, player, lockCtx)`) — add any new ctx field there. |
| `reforged/tools/lockdpsCore.mjs` | The pure balance model (no engine). `phaseSpans`, `phaseTargets`, `reachableCap`, `bossEconomy` (per-phase capPips, volley, burn, the **not-a-phase-deleter** `worstDps`/`deleterTtk` loop), `invariantBreaches`. **If rung 14 adds a new damage source (the RECKONING burn), add its term here** (mirror the Onewing `echoPips` term) or the deleter gate passes vacuously. |
| `reforged/js/bossDefs.js` | The `unmasked:` def (~line 1714). Add `lockParts` (phase-gated), the RECKONING config, any comfort dials. |
| `reforged/js/bossUnmasked.js` | The model. Add the organ anchor empties (`crackSeamL/R`, `wingEye0..5`, `relic*`, `wingRootL/R`) at comfort-legal positions; add any brand-on-feature presentation (the Embertide `setBrandedFeatures` pattern) if organs are proxies. |
| `reforged/js/reticle.js` + `reforged/css/style.css` | The in-lane lock markers. `.lockmark` (+ `.ghost` for granted pips). Add a variant if the finale needs a distinct brand look. |
| `reforged/js/main.js` | The `window.__dd` debug seam registrations (~line 277). Add test seams here + import them from boss.js. |

---

## 7. Git / process mechanics (the exact commands that worked)

- **Designated branch:** `claude/lance-system-boss-progression-ui4r4l`. Develop ALL work here.
- **Both my PRs merged, so restart from master** (a merged PR is finished; never stack on merged
  history):
  ```
  git fetch origin master
  git checkout -B claude/lance-system-boss-progression-ui4r4l origin/master
  git config user.email noreply@anthropic.com && git config user.name Claude
  ```
- If you already have unmerged commits on the branch beyond merged history, **rebase them onto the
  new master** (`git rebase origin/master`), don't discard.
- **Push:** `git push -u origin claude/lance-system-boss-progression-ui4r4l` (retry on network
  errors with backoff). The branch is deleted on each merge, so the push recreates it.
- **After push, open a DRAFT PR** (base `master`). Then `subscribe_pr_activity`. Leave it a draft
  until the owner playtests and marks it ready.
- **Commit trailers (required):**
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: <your session url>
  ```
- **The stop-hook** nags if a commit's author isn't `noreply@anthropic.com` — set the config
  before committing and it's a non-issue. (A merged-in master commit by another author will also
  trip it; ignore that one, it's not yours to amend.)

---

## 8. The test playbook (this is how you avoid shipping a dead lance)

Every rung has a `*organs.mjs` (comfort/reachability), a mechanic test, and `lockdps.mjs`
assertions. The **browser tests** boot the real engine via `tests/browser.mjs` and drive
`window.__dd.*`. The pure `lockdps.mjs` imports the shipped kernel + boss table.

**The cardinal rule (learned the hard way twice): the organ/comfort test MUST exercise the real
post-`enterFight` live path** — force the fight (`bossForceFight`), then measure. A test that
measures the studio/pre-placement pose greens on a lance that's dead in the real fight. Assert a
known-unreachable node resolves to `null`/out-of-lane as *positive proof* the test ran live.

**Sample long enough to catch the worst case:** station sway period ~9s (default), yaw-wobble
period ~12.6s — sample **>14s**. Multi-form: test each stage (use the phase-jump seam).

**Debug seams already available on `window.__dd`** (add more as needed, pattern in `boss.js` +
`main.js`):
- `bossSetDefIdx(13)` / `spawnBoss()` / `bossForceFight()` / `bossState()`
- `bossSetPhase(n)` — fast-forward to a stage BEFORE `bossForceFight` (e.g. stage 2/3, survival)
- `bossPartWorldPos(name)` — an organ's live world position (post-reparent aware)
- `bossPaintables()` / `bossLockCandidates()` — the live paint / aim sets
- `bossBankLocks(n)` — bank n pips on the candidates (no `lockPaint` event — emit it manually to
  trigger paint-driven rules like the echo)
- `bossLanceState()` — `{ pips, ghosts, deflected, candidates, paintables }`
- `bossLoose()` / `bossStrikeSurge()` (the fork) / `bossArmBeamDuel(t)` / `bossBeamDuelT()`
- `bossCrush(on)` / `bossCrushOn()` (Embertide) — model the "seal high organs during a hazard"
  pattern if the finale has an arena clamp
- `bossBreakFrame()` / `bossFelledLie()` (Onewing) — templates for testing a terminal/sealed state

**Run the full gate before every commit** (all must pass; `boss.mjs` is ~124 checks and has an
occasional flaky seeded test — re-run once to confirm):
```
node reforged/tools/lockdpsCore.mjs --ci        # exits 0 or lists breaches
cd reforged
node tests/lockdps.mjs                            # the economy band-gate (add unmasked assertions)
node tests/boss.mjs                               # the model/lifecycle suite (add unmasked model checks)
node tests/<yourrung>organs.mjs                   # comfort + reachability (MUST drive the live fight)
node tests/<yourrung>reckoning.mjs                # the RECKONING collection→burn-unlock
node tests/knellburn.mjs tests/weftmend.mjs tests/onewingecho.mjs   # NON-regression: non-echo/other bosses byte-identical
```
Any new per-pip/per-release plumbing → **re-run the OTHER bosses' mechanic tests** to prove
byte-identical (the Onewing CP2 caught the Surge fork regression this way).

---

## 9. The CP1 / CP2 Fable prompt skeleton (reuse it)

Spawn with the Agent tool: `model: fable`, `subagent_type: general-purpose`, run in background,
high effort. The prompts that worked were long and demanded arithmetic + file:line, e.g.:

**CP1 (design pre-audit):**
> "You are the CP1 pre-audit critic for Dragon Drift. Read BOSS-DESIGN.md + the newest lessons
> FIRST. NO code changes. (1) NODE-NAME RECONCILIATION — grep the real `.name =` in
> `bossUnmasked.js`; state the EXACT names the lockParts must use; a lockPart naming a
> non-existent node ships silently inert. (2) THE COMFORT LAW — compute each organ's worst-case
> world X/Y (scale 2.4 × the transform chain: station sway ±5, the placeGroup yaw/roll wobble
> projecting z→x, any stage motion) vs |x|≤10.4 / y≤22; is this the Onewing/Embertide out-of-lane
> trap? (3) Is it `skyReplace` (the reparent trap)? (4) Multi-form phase-gating of lockParts.
> (5) THE RECKONING — is it buildable, and does lockdpsCore need a term for the unlocked burn or
> the deleter gate passes vacuously? (6) `formLifebars` + the balance model. (7) DEAD-CONFIG
> SWEEP. Rank by silent-ship danger. If the plan's organs/comfort/mechanic are unbuildable, say
> so bluntly — every prior CP1 found exactly that."

**CP2 (adversarial diff critic, after you commit):**
> "Critique `git show <commit>` — the rung-14 diff. Find the ship-blocker: false-green tests
> (does the organ test drive the REAL post-reparent/live path or green on a dead lance?),
> comfort/reachability holes under any arena clamp (not just the static lane), the RECKONING
> corrupting the pip ledger or the burn double-counting, coexist breaks (non-finale bosses must
> be byte-identical — check all three release paths), null-derefs (guard `def?.x` in every
> `on(...)` listener), art-law violations. Rank by severity with file:line + a concrete failure
> scenario + the minimal fix. Every prior CP2 found a real HIGH bug — find this one's."

---

## 10. The reusable LAWs the ladder established (do not relitigate these)

1. **Reachable ≠ comfortable.** An organ must sit inside **|x| ≤ 10.4 and Y ≤ 22** across its
   whole animation, not merely be aimable at the 15.6 edge. Never widen the law to pass — dial the
   organ/motion.
2. **The escalation is the SIGNATURE MECHANIC, not the burn.** Knellgrave's toll, Weftwitch's
   mend, Onewing's echo, Embertide's fork-extend are each the rung's payoff; the burn dial stays
   *free as the emergency valve*. For rung 14 the escalation is the RECKONING-unlocked burn +
   sheer size — keep the frac modest (0.20, RECKONING-gated), the owner's §8D ~⅓ target.
3. **A new damage source must be SEEN by `lockdpsCore`** or the not-a-phase-deleter gate passes
   vacuously (the SCAR-BURN dead-invariant trap; the Onewing echo term is the template).
4. **Teach a new per-pip rule to ALL THREE release paths** (`releaseVolley`, `surgeForkLances`,
   the granted echo) — the Onewing CP2 caught the fork firing ghosts at full damage.
5. **Guard `def?.x` in every `on(...)` listener** — unit tests fire events with no active boss;
   `def.foo` throws (the Codex + both CP2s caught this).
6. **A "fair window" needs a REAL state that opens and closes** — grep it cycles before you gate on
   it (Embertide's surfacing-gate was dead; its sky-crush was the real one).
7. **Test the tap AT the seam, not just mid-phase** — a banked-resource mechanic can dump into a
   sealed window (Embertide's P4→P5 fork-into-seal).
8. **The organ/comfort test must drive the real live path and check every arena-clamp the def
   imposes** — not the studio pose, not just the static lane.
9. **A "prove the trap" assertion must FAIL on a broken test** (assert `=== null`, not
   `null-or-anything`).

---

## 11. Environment gotchas (small but they'll bite)

- **`AskUserQuestion` and `send_later` fail in this session** ("permission stream closed"). When
  you need an owner decision, present it in text and proceed with a clear recommendation (the
  "go with recs" pattern). For PR check-ins, rely on the webhook subscription (it delivers CI
  *failures* and comments; it does NOT deliver CI success/merge — so you may not get pinged on a
  green build; that's fine).
- **Background-command working directory drifts.** When writing a throwaway probe under `reforged/tests/`,
  `cd /home/user/dragon-drift/reforged` in the same command; imports resolve relative to the test file.
- **`boss.mjs` has an occasional flaky seeded check** (karnvow footwork / an embertide entrance) —
  re-run once; a lone failure that passes on re-run is not your diff.
- **PRs open a preview build** (`preview` check) at `.../pr-preview/pr-<N>/`. That's the owner's
  playtest surface — the whole point of leaving the PR a draft.
- **The lockdps CLI** `node reforged/tools/lockdpsCore.mjs --ci` exits 0 silently on success; the
  real gate with output is `reforged/tests/lockdps.mjs`.

---

## 12. Suggested build order for rung 14 (after the CP1 clears)

1. **Stage 1 organs** (`crackSeamL/R` anchors on `crackSeams`, `focalEye` V1) — comfort-verify
   post-reparent; this is the smallest coherent increment and proves the whole pipeline.
2. **Stage 2 organs** (`wingEye0..5`, the 5 `relic*` anchors) — phase-gated to `[1]`; the moving-
   eye comfort is the Eitherwing lesson ×6.
3. **THE RECKONING** — relic-collection tracking, the eye-snap reveal, the burn-unlock flag; the
   `lockdpsCore` term for the unlocked burn; config `scarBurn.fracBySlot.unmasked 0.20` gated on it.
4. **Stage 3 organs** (`starEye`, `halo`, `wingRootL/R`) — phase-gated to `[2]`; the peak-volley
   presentation.
5. **Relic presentation** (palette flash + one-note theme quote per relic) — pure presentation.
6. `lockdps.mjs` assertions (unmasked lance-capable, per-stage caps, RECKONING burn modeled, no
   deleter across all three forms) + a `*reckoning.mjs` end-to-end test + comfort tests per stage.
7. **CP2 → fold → re-verify → push → draft PR → owner playtest.**

**The finale's whole point is that it's the vocabulary you've already shipped, at full size.**
Resist inventing new mechanics; the RECKONING + the size are the spectacle. Keep it honest, keep
it ~⅓ of clear pace, and let the owner feel the peak on the preview.

---

*Handover written at the close of rung 13 (Embertide, #369 merged). The lance ladder spans slots
10–13; rung 14 is the last one. Everything above is battle-tested across four rungs — follow the
gauntlet and the finale ships clean.*
