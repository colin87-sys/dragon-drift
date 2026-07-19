# BOSS-AUDIT EXECUTION SOP
### Converting the 2026-07 BOSS-DESIGN.md adversarial audit into shipped fixes — task-by-task, junior-executable

**Verified against:** master @ `e89d389` (post-BRINEHOLM PR #242, post-biome PR #234, post-lock PR #243). Every task below was re-verified against this tree on 2026-07-06; statuses are STILL-REAL / CHANGED-SHAPE per task. The 4 ALREADY-FIXED findings are in Appendix A.

---

## 0. ORIENTATION (read this once, follow it always)

1. You are executing settled audit findings against `reforged/BOSS-DESIGN.md` (the boss playbook) and the game code in `reforged/`. The findings are **not up for debate** — your job is precise execution, not redesign.
2. **Read `LEAPFROG.md`'s THE RULE first.** The four rules you live by: (a) read LEAPFROG.md before starting; (b) **append a lesson to LEAPFROG.md's ledger after every meaningful change** (each PR here = one lesson); (c) build systems, not one-offs — coexist → prove on a hero → migrate, never break the shipped roster; (d) **verify before claiming** — run the tests, don't assert.
3. Work each PHASE as **one branch + one PR** off latest `master`. Never push to master. Never start a phase before its listed dependencies are merged.
4. **Verify tools** (run from `reforged/`): `node tests/boss.mjs` (the boss contract: budgets, rhythmprint, amberdiet, pivots), `node tests/bossboot.mjs` (real-engine boot, zero errors), `node tests/run-all.mjs` (full suite — run before your first change to record a green baseline, and before every PR), `node tools/bossgate.mjs <bossId>` (pixel design gate), `node tools/bossstudio.mjs` (studio contact sheets — read the file's usage header, don't guess flags), `node tools/tricount.mjs` / `tiershots.mjs` (dragon-side; only if a task says so).
5. Any commit touching `reforged/` **js/css/html** must run `node tools/stamp-sw.mjs` in the same commit. Doc-only (`.md`) PRs skip it (`sw.js` precaches no `.md`).
6. **DOC-ONLY vs CODE**: every task is flagged. A DOC-ONLY task must produce a zero-code-diff PR (`git diff --stat` shows only `.md`). If you find yourself editing a `.js` file inside a DOC-ONLY task, stop — you've misread the task.
7. ⛔ banners are **hard stops**. Post your work (or your question) to the PR and wait for the human. You cannot self-certify past a gate. Everything without a banner: run straight through.
8. When a task says "if unsure, STOP and ask" — that is the success path, not a failure. Confidently guessing on palette, budgets, or lore is how this roster gets damaged.
9. Cite by **symbol/quote, not line number** in everything you write (the audit's own finding: line anchors drift). To find a doc location, grep the quoted anchor text given in the task.
10. Acceptance criteria are self-check lists. Run every listed command. If any check fails and the task doesn't tell you what to do, STOP and ask on the PR.

---

## 1. GATE LEDGER (rule-6 checkpoints)

| Gate | Where | Status |
|---|---|---|
| **GATE 0 — verify-pass approval** | before any task executes | ✅ **SATISFIED** — owner approved the 81/15/4 verification scope on 2026-07-06 ("Yes go"). Do not re-litigate dropped findings. |
| **GATE A — claimability sign-off** | per slot, end of each SL-task (Phase 5) | ⛔ open — a §3b sheet / §4b map you draft is NOT "claimable" until the owner (or a Fable design gate) signs it off on the PR. The doc's own law: sheet + sign-off **before geometry**. |
| **GATE B — engine-debt decisions** | before ANY Phase-3 code task | ⛔ open — the decision register (§3) must be answered by the owner first. |
| **GATE C — palette / collision / tri-budget** | before the P-bundle (Phase 5c) and task G10 | ⛔ open — every near-danger-hue ruling, swatch shift, glow-shape ruling, and band-budget rewrite needs owner sign-off before it lands. |

---

## 2. EXECUTION ORDER & DEPENDENCIES

```
T0 baseline
PHASE 1  (PR-1, DOC-ONLY)  — no dependencies. Do first.
PHASE 2  (PR-2, DOC-ONLY)  — after PR-1 merges (both edit §5b/§5c/§5e; avoid conflicts).
GATE B decisions            — owner answers the register (§3) any time; unblocks Phase 3.
PHASE 3  (PR-3a doc refile — after decisions; PR-3b+ code — each ⛔-gated per task)
PHASE 4  (PR-4, tests/tools) — independent of Phase 3 EXCEPT G5 (needs ED-9) and G10 (GATE C).
PHASE 5a (PR-5a, DOC-ONLY roster tasks) — after PR-1 + PR-2.
PHASE 5b (PR-5b..5g, per-slot sheets 9→14, DOC-ONLY) — after 5a. Sequential by slot number
         (build queue order; slot 9 is next to build so its sheet matters most).
PHASE 5c (P-bundle, palette/collision) — ⛔ GATE C. Last, because its rulings feed sheets already drafted.
Parallel-safe: PR-4 alongside PR-5a/5b. Never two open PRs editing the same §5b/§5d region.
```

**T0 (do before anything):** `git fetch origin && git checkout -b <phase-branch> origin/master`, then `cd reforged && node tests/run-all.mjs`. Record the green baseline in your PR description. If baseline is red, STOP and report — do not fix unrelated breakage inside audit PRs.

---

## 3. ⛔ GATE B — HUMAN DECISION REGISTER (owner answers before Phase 3; ED-8/9 also block two Phase 4/5 tasks)

> **⛔ HUMAN SIGN-OFF REQUIRED — do not proceed to any Phase-3 code task (C1–C5), G5, or R7 until the owner has answered the relevant line below.** Junior: your only job here is to paste this table into the Phase-3 PR description and collect answers.

| ID | Decision | Options | Audit recommendation |
|---|---|---|---|
| ED-1 | **ORGAN BREAK (slots 4/5)** — declared shipped, never built; there are now THREE shipped "reuses" (6 panes, 7 stagger, 8 shackles) of a debut that never existed | (a) retrofit onto shipped `routePartDamage`/`partHits` plumbing (boss.js) — MARROWCOIL rib-crack + EITHERWING handoff-stagger; (b) doc-refile as "pending retrofit" only | (a) — the slot-8 build proved the plumbing generalizes; cost is now LOW-MED |
| ED-2 | **Colossi graze forms** (SLIPSTREAM 3 / THREAD scoring 4 / ORBIT ANNULUS 5) — never built | (a) retrofit now; (b) re-slot to a named future landing (e.g. the slot-9 build PR) | (b) — player-facing value but blocks nothing; name the landing |
| ED-3 | **entrance-look fallback** (`main.js` still ends `else setDragonLook(null)`) | (a) implement now (SMALL; consumers: slots 1/2 retrofits + 12); (b) defer, re-slot to slot 12 in the §5j ledger | (b) — slot 8 shipped fine without it |
| ED-4 | **`getBossEta()` + audio-foreshadow seam** — absent; §5j defaults it to shipped slot 5, §5e/§5h say slot 10 | (a) build now; (b) doc-fix the landing to slot 10 | (b) — doc-only now, code with slot 10 |
| ED-5 | **Tier-3+ surge-immune shield wind-up** — §5h default, implemented nowhere; shipped 6/7/8 raise shields instantly | (a) implement def-gated (`def.shieldWindupS`), retrofit 6/7/8 after preview; (b) doc-refile as pending | needs owner: (a) changes three live fights' feel |
| ED-6 | **Second-sun retrofit trigger** — "seeded at first Calamity kill" but code lands at slot 10; players are killing Calamities NOW, the event won't re-fire | amend §5h now: seed-on-load for saves with ≥1 Calamity kill (doc-only today; code at 10) | yes — one sentence, prevents a class of missed unlocks |
| ED-7 | **Amber ≥20%-of-aimed share clause** — unenforced (tests check only the 12s window + carrier presence) | (a) enforce: add share assert to `simulatePhase` consumers in tests/boss.mjs — but first RUN it against all 8 shipped defs; if any fail, it becomes an owner call; (b) cut the clause from §5i.C.1 | (a) if shipped defs pass; else escalate with the numbers |
| ED-8 | **BEAM DUEL (13)** sits in the parry ladder but is Surge-fed, and makes the WE band debut two mechanics against its own ≤1 header | (a) reclassify as 13's Surge mechanic (doc); (b) amend the header to allow two | (a) |
| ED-9 | **THRUMSWARM P4 cadence 1.05** vs the §5b Calamities floor 1.2 (its own code comment claims the floor) | (a) annotate §5b: the floor binds the legacy dial only, rhythm rests governed per-signature by §5i, record the shipped exception; (b) change the shipped dials (live-fight change!) | (a) — never touch shipped dials without preview |
| ED-10 | **Slot-8 negative-space pass** — shipped as a dive-below (Sounding), not a rail-through | Judge on the PR preview (`?debug&boss=100&bossIdx=7`): does the dive satisfy the Tier-2 cumulative "rail threads its negative space" clause? If no → backlog item for a slot-8 polish pass | preview judgment; no junior task |
| ED-11 | **8→9 grandeur cliff** — a shipped never-fits leviathan hands off to a ~9u/~2k-tri duelist at the band's difficulty peak | Approve the SL-9 sheet's presence lift (trophy-chain at arena scale + dread-card spectacle spend per §5g rule 4) as part of GATE A on slot 9 | fold into slot-9 sheet sign-off |

---

## PHASE 1 — DOC-HYGIENE (PR-1 · DOC-ONLY · no gates · ~half a day)

All tasks edit `reforged/BOSS-DESIGN.md` unless stated. Acceptance for the whole PR: `git diff --stat` shows only `.md` files; `node tests/run-all.mjs` still green; every task's grep-check passes.

---

**D1 — Flip stale registry statuses (rows 3, 4, 5, 8)**
- Closes: audit §3.A "rows 3–5 claimed" (+ verified amplification: row 8).
- VERIFY: STILL-REAL — `bossDefs.js` `BOSS_ORDER` contains all of `ashtalon, marrowcoil, eitherwing, hollowgate, thrumswarm, brineholm`; §5b slot-table rows 3/4/5/8 still read `claimed`.
- WHY: §6.0's own law says flip to `shipped` in the shipping PR; four rows lie about roster state.
- EXACT: in the §5b slot table, change the Status cell of rows 3, 4, 5, and 8 from `claimed` (incl. parentheticals like "claimed (replaces retired CRAGHOLD¹)" → keep the parenthetical, change the word) to `shipped`.
- ACCEPT: `grep -c '| shipped |' reforged/BOSS-DESIGN.md` counts 8 shipped rows (1,2,3,4,5,6,7,8); no row 3/4/5/8 contains `claimed`.
- GUARDRAILS: touch ONLY the status word; do not reflow the table.

**D2 — Past-tense the CRAGHOLD footnote**
- Closes: §3.A CRAGHOLD footnote.
- VERIFY: STILL-REAL — footnote ¹ still says "It stays in `BOSS_ORDER` only until ASHTALON ships"; `BOSS_ORDER` (bossDefs.js) contains no `craghold` (the def object remains, unreferenced by the roster — that's fine).
- EXACT: rewrite the footnote sentence to past tense, e.g.: "It was removed from `BOSS_ORDER` when ASHTALON shipped in its slot; its def remains in bossDefs.js as reference geometry. Its geometry lessons (finger chains, socket pools, tell-family poses) are inherited by ASHTALON/EITHERWING/KARNVOW."
- ACCEPT: `grep -n 'stays in' reforged/BOSS-DESIGN.md` → no hit in footnote ¹.
- GUARDRAILS: do NOT delete the `craghold` def from bossDefs.js — DOC-ONLY.

**D3 — Mark the ladder controller DONE (two docs)**
- Closes: §3.A progression note; + verified new instance in BIOME-DESIGN.md.
- VERIFY: STILL-REAL — §5b "Progression note (deferred)" still calls it "a future controller task — no code in the current arc"; but `ladderPickDef` and `ladderTighten` are exported from `bossDefs.js` and consumed in `boss.js`. BIOME-DESIGN.md ("Boss selection ignores biomes entirely") cites `bossDefForIndex` modulo as THE selection path.
- EXACT: (1) §5b progression note → "DONE (2026-07): `ladderPickDef` (bossDefs.js) is the live band-aware picker — a run's first boss = lowest unbeaten slot, `ladderTighten` scales repeats; `bossDefForIndex` survives as the debug/`?boss=` path only." (2) BIOME-DESIGN.md: amend the one sentence to name `ladderPickDef` as the live picker (the conclusion — boss selection ignores biomes — stays true; keep it).
- ACCEPT: `grep -n 'future controller task' reforged/BOSS-DESIGN.md` → no hits; BIOME-DESIGN.md names ladderPickDef.
- GUARDRAILS: BIOME-DESIGN.md edit is ONE sentence. Don't restructure someone else's fresh playbook.

**D4 — Retire the flat 6,000/34 budget text (three places)**
- Closes: §3.A flat-gate contradiction (§2, §5 Tier-2, §7.1 vs §5g + shipped code).
- VERIFY: STILL-REAL — `TIER_BUDGETS` exists in `tests/boss.mjs` keyed off `def.tier`, matching §5g; §2's table row, §5 Tier-2's "up to ~5k tris", and §7.1's "tri ceiling (<6,000) … visible-draw gate (≤34)" still state the flat numbers.
- EXACT: (1) §2 Triangles row: append "(the 6,000 figure is the tier-1 gate; per-band ceilings live in §5g / `TIER_BUDGETS` in tests/boss.mjs)". (2) §5 Tier-2 "up to ~5k tris" → "up to the Colossi band budget (§5g: 5–8k)". (3) §7.1 → "tri + visible-draw ceilings per band via `TIER_BUDGETS` keyed off `def.tier` (tier-1: 6,000/34)".
- ACCEPT: each of the three locations greps clean for a bare, uncontextualized `6,000`/`≤34` claim; §5g remains the single authority.
- GUARDRAILS: do NOT touch tests/boss.mjs — the code is already right; only the prose lies.

**D5 — Mark the ASHTALON P3 amber hotfix DONE; refresh footnote 3**
- Closes: §3.A hotfix staleness + combat #45.
- VERIFY: STILL-REAL — §5i.C law 1 still says "*Immediate hotfix: ASHTALON P3 currently 0% amber*"; code shipped it (ashtalon P3 `stream` carries amber tips per the def comment in bossDefs.js; `AMBER_FLOOR_S = 7` + `AMBER_CARRIERS` in bossRhythm.js machine-enforce the floor; tests/boss.mjs asserts every phase serves amber ≤12s).
- EXACT: (1) law 1's hotfix line → "(Shipped: P3's stream carries amber tips; the floor is machine-enforced — `AMBER_FLOOR_S`, bossRhythm.js — and CI-gated in tests/boss.mjs.)" (2) footnote ³: keep the true remainder ("slots 1–3's distinctive parry-job MECHANICS remain open") and delete the claim that the amber floor itself is outstanding.
- ACCEPT: `grep -n 'Immediate hotfix' reforged/BOSS-DESIGN.md` → no hits.

**D6 — Fix slot-7 mote counts (three stale numbers)**
- Closes: contradiction #50.
- VERIFY: STILL-REAL — sheet says "**40** dark tetra motes", entrance says "the 28 unlit motes", code is `MOTE_N = 48` (bossThrumswarm.js) and L162 confirms 48.
- EXACT: sheet 40 → 48 (adjust its parenthetical to say CP1 raised 28→40→48 per L162), entrance 28 → 48, "~54 draws" → "~58 draws".
- ACCEPT: `grep -nE '\b28 unlit|\*\*40\*\* dark' reforged/BOSS-DESIGN.md` → no hits; `grep -c '48' ` shows the two updated spots.

**D7 — Reword the §5j staged retrofits to "spec-only"**
- Closes: engine P14.
- VERIFY: STILL-REAL — no `riseBeats`/`entranceNotes`/`warnGrade` anywhere in `reforged/js`; `ENTRANCE_SCRIPTS` (entranceScripts.js) has 5 entries (overtake, batonCross, vigilLights, shapeItRemembers, reefWasBreathing) — none for slots 1/2/4.
- EXACT: §5j retrofits block: "each is dead code without its def field" → "each is SPEC-ONLY (no code exists yet — a polish-pass session builds hook + def together)". Slot 4's ENTRANCE line: "retrofit STAGED (inert `def.riseBeats`)" → "retrofit SPEC-ONLY (unbuilt; polish pass)".
- ACCEPT: `grep -n 'dead code without' reforged/BOSS-DESIGN.md` → no hits.

**D8 — Sweep DONE marks over landed engine items**
- Closes: engine #35 (remaining scope after slot-8 items moved to Phase 2).
- VERIFY: STILL-REAL — §5e CALAMITIES still lists "below-horizon rise … + WIDEN the bullet cull bounds" as future (both shipped: `approachFrom 'below'` handling + widened cull floor in bossBullets.js, comments name BRINEHOLM); slot 11's §5d NEEDS still lists "above-approach + `top` warning direction" (both shipped in boss.js).
- EXACT: (1) §5e CALAMITIES: annotate the two items "(SHIPPED with slot 4/8)". (2) Slot 11 NEEDS line → "NEEDS: nothing structural (above-approach + top banner shipped); the HUD-sew overlay + banner pin land with this slot (§5j)."
- ACCEPT: grep confirms the annotations; slot 11's NEEDS no longer lists shipped items.
- GUARDRAILS: do NOT mark §8's "Horizon presence for a Calamity" done — it is genuinely unbuilt (slot 6 shipped on its degrade path). Leave §5d slot-6's degrade note alone.

**D9 — Repair the §9 ledger reading list + duplicate-lesson disambiguation**
- Closes: contradiction #49 (+ verified amplification: the ledger now ALSO has two L164s and two L165s — the new BRINEHOLM lessons collide with the EMBER dragon lessons).
- VERIFY: CHANGED-SHAPE — §9 gained L157 (brineholm CP1) but still omits the inline-cited lessons; LEAPFROG.md now has duplicate pairs L137, L138, L150, L164, L165.
- EXACT: (1) add to §9, one bullet each (one-line summaries, priority after L157): L164 (BRINEHOLM head+maw rebuild — silhouette judged at the FIGHT frame), L165 (BRINEHOLM CP2 — weak-point window is a DURATION), L140, L141, L142, L147, L148, L150 (the whale/silhouette lesson), L155, L156, L130, L131, L106. (2) add a NOTE line at the top of §9: "The ledger has duplicate lesson numbers (two each of L137/L138/L150/L164/L165) — disambiguate by TITLE, never by number: the boss-relevant ones are L150 'The silhouette betrays the mesh', L164 'BRINEHOLM head+maw rebuild', L165 'BRINEHOLM CP2'."
- ACCEPT: every lesson number cited inline anywhere in BOSS-DESIGN.md (`grep -oE 'L1[0-9]{2}' reforged/BOSS-DESIGN.md | sort -u`) appears in §9; the disambiguation note exists.
- GUARDRAILS: identify lessons by their `###` header TITLES in LEAPFROG.md, not line numbers (append-only file — lines shift). Do not renumber the ledger's duplicates — it's append-only; the note is the fix.

**D10 — Replace drifted code anchors with symbol names**
- Closes: engine P15 + the bossRunSetpiece/cards misnomers.
- VERIFY: STILL-REAL — the doc cites `boss.js` line numbers from two generations ago (e.g. "pose ~:194", "placeGroup ~:859", "gaze exclusion (`boss.js:1158`)", "group gate (`boss.js:1146`)", "`updateFlythrough` (`boss.js:798-853`)"); current reality: `SETPIECE_PATHS` is a boss.js top-level const, `placeGroup`/gaze-exclusion/group-gate all moved, `updateFlythrough` no longer exists (generalized into `ENTRANCE_SCRIPTS`, entranceScripts.js), the debug helper is `debugRunSetpiece`, and the save collection shipped as `bossCards` (save.js), not `cards`.
- EXACT: sweep §5e ground truth, §5j beat-vocabulary/gotchas/engine-costs, and §5d slot-4's tooling refs. Replace each `boss.js:NNN` with the symbol name only: `pose` (the boss pose state in boss.js) · `placeGroup` · `SETPIECE_PATHS` · "placeGroup's gaze-exclusion branch" · "the warn-phase group visibility gate in placeGroup" · "`ENTRANCE_SCRIPTS` (entranceScripts.js — the updateFlythrough generalization)" · `debugRunSetpiece` (was written `bossRunSetpiece`) · `bossCards` (was written `cards: [[cardId, …]]` — keep the shape, fix the field name).
- ACCEPT: `grep -nE 'boss\.js:[0-9]|bossRunSetpiece' reforged/BOSS-DESIGN.md` → no hits; `grep -n 'updateFlythrough' ` hits only historical mentions that say it was generalized.
- GUARDRAILS: change citations only — never the design content around them. If a cited thing no longer exists at all and you can't find its successor symbol, STOP and ask rather than deleting the sentence.

**D11 — Bring §6.1's def recipe current**
- Closes: gates #54 (+ verified amplification: `grazeForm` + `setpieces` now exist too).
- VERIFY: CHANGED-SHAPE — §6.1 still lists only `id, name, title, epithet, hpMax, accent, glow, bulletColor, scale, approachFrom, phases[], archetype`; every shipped def now also carries `tier` (mandatory — TIER_BUDGETS keys off it), `cards[]`, `rhythm{signature, phrase…}`, and optionally `muzzle`, `grazeForm`, `setpieces[]`.
- EXACT: extend §6.1's field list: "`tier` (1–5, REQUIRED — budgets key off it, §5g), `cards: [...]` (§5h schema; dread card last), `rhythm: {signature, …}` (§5i.A; rhythmprint gates it), plus optional `muzzle` (emitter-organ, §5f law 7), `grazeForm` (§5i.B — shipped values: `beamEdge`, `absorbColor`, `shadowRide`), `setpieces: [...]` (SETPIECE_PATHS entries)."
- ACCEPT: §6.1 names all of tier/cards/rhythm/muzzle/grazeForm/setpieces.

**D12 — Rewrite the §5c Calamities row (band-honest examples + head redesign)**
- Closes: lore P34 + the §5c half of the slot-8 propagation finding.
- VERIFY: STILL-REAL — §5c CALAMITIES still reads "(a swarm, twin bodies, a whale you scroll along)" and credits both-flanks-arrival + survivor-flees (all slot-5/Colossi experiences), and the whale-scroll describes the retired slot-8 body.
- EXACT: replace the row's example clauses with Calamities-band items, e.g.: "Multi-part and colossal bodies (a swarm that condenses, a leviathan head that never fits the frame), formations-as-telegraphs, relationship beats (BRINEHOLM hesitates mid-rise; KARNVOW quotes your save file), new arrival directions (rising through the fog floor, condensing from dust, riding alongside). Feeling: *bosses stopped being one thing in front of me.*"
- ACCEPT: `grep -n 'whale you scroll' reforged/BOSS-DESIGN.md` → no hits; no slot-3/4/5 experience cited in the Calamities row.
- GUARDRAILS: keep the row's structure and the italic "Feeling" line format. Don't touch other band rows.

**D13 — Small-wording batch (four safe fixes)**
- Closes: combat P21, grandeur P22, contradiction P30, P31.
- VERIFY: all STILL-REAL — (1) §5b distinctness review still says "diff your row's three identity columns" though §5i.C law 2 added parry job as a fourth; (2) the §5j registry marks slots 1/2 with "(staged retrofit)" but full choreography lives only in the retrofits block (no §5d sheets exist for 1/2); (3) slot 5's sheet carries both "~4.8k tris / 26 draws" and "~4.5k tris total, ≤30 draws" (measured truth: 4,817/26 per L142); (4) slot 4's fly-through paragraph cites L142 but describes L147's content (the ~4.2u dive + tools/marrowpass.mjs).
- EXACT: (1) "three identity columns" → "four identity columns (silhouette / hook / palette+glow / parry job)". (2) add one line under the §5j registry table: "Slots 1/2/4 have no §5d entries — their entrance choreography lives in the Staged-retrofits block below." (3) harmonize slot 5 to the measured "~4.8k tris / 26 draws (band cap 8k/50)" in both spots. (4) L142 → L147 in slot 4's fly-through citation.
- ACCEPT: all four greps confirm; no other content moved.

**PR-1 DONE-WHEN:** all D-task ACCEPTs pass · `git diff --stat` = `.md` only · `node tests/run-all.mjs` green · PR posted · **append one LEAPFROG lesson** (suggested title: "Doc-lags-code audit sweep: statuses, budgets text, anchors — cite symbols, never lines").

---

## PHASE 2 — SLOT-8 TRUTH-UP (PR-2 · DOC-ONLY · after PR-1 merges)

BRINEHOLM shipped (PR #242) while the audit was in flight. These tasks make the doc tell the truth about what shipped. **Everything here is transcription from code — invent nothing.**

---

**S8-1 — Propagate the head-only redesign into the §5b brief**
- Closes: slot-8 propagation finding (§5b half; §5c handled by D12, §5e by S8-2).
- VERIFY: STILL-REAL — the §5b slot-8 brief still describes the retired island-back design ("only a whale-back ridge, fin-sails … The fight scrolls along its back; it breaches for the signature frame") and anchors lore to retired CRAGHOLD ("shackled by the same chain-maker as Craghold", "distinct from Craghold's mid-value moss").
- WHY: the brief is the first thing a reader meets; it currently describes a boss that shipped differently.
- EXACT: replace the slot-8 brief paragraph with (adjust flow to match neighboring briefs' voice):
  > **8 — BRINEHOLM, "The Island That Breathes"** (Tier 3 — shipped). A colossal deep-sea leviathan HEAD lunging up through the fog — you fight the FACE; the body is never shown (arena scale implied; the hull spans ~36 world units and never fits the frame). The one heavy-lidded EYE is the sole focal and weak point (chip lands only while the lid is open); the abalone-lit gullet and gill rakes carry the glow; snapped chains bind the snout — shackle posts are individually breakable, each freed post vents a pink SPRAY-SOAK graze beat and freeing them early softens phase 3 (mercy as mechanics, §5f). SHADOW-RIDE in the head's lee is the band graze form. It is SHACKLED, not hostile — the rise holds one beat mid-lunge (the §5 relationship beat). Identity axis: wet, living kelp-black + abalone on a breathing face — never Voidmaw's dead stone mask. Lore gap: whose forge made the chains? (open thread, §5b lore web).
- ACCEPT: `grep -nE 'whale-back ridge|scrolls along its back|as Craghold' reforged/BOSS-DESIGN.md` → no hits in the §5b briefs.
- GUARDRAILS: the §5d sheet is ALREADY correct — don't edit it here. Do not invent new lore.

**S8-2 — Re-anchor the §5i.B graze row + add slot-8's GRAZE FORM sheet line + fix §5e**
- Closes: slot-8 graze-anatomy finding (CHANGED-SHAPE: code shipped `shadowRide` — this is transcription) + the §5e scroll-along ref.
- VERIFY: CHANGED-SHAPE — §5i.B band table still says "SHADOW-RIDE + SPRAY-SOAK (8: the whale's lee vs geysers; freed shackles vent…)"; code: `def.grazeForm === 'shadowRide'` branch in boss.js + the shackle destructible entry (`spray: true`) in boss.js's part-damage registry (`routePartDamage`). §5e still says "scroll-along-back reuses moving-station".
- EXACT: (1) §5i.B row 8 → "SHADOW-RIDE + SPRAY-SOAK (8, SHIPPED: the head's lee — ride the calm pocket beside the brow/gill line; each freed shackle post vents a 2×-value pink spray for one beat — `grazeForm: 'shadowRide'`)". (2) Add to slot 8's §5d sheet, after the palette line: "GRAZE FORM (§5i.B, shipped): SHADOW-RIDE — the lee pocket along the brow/gill rakes; SPRAY-SOAK — freed shackle-post vents. Anatomy, not zones." (3) §5e "scroll-along-back reuses moving-station" → "the head's rise/Sounding dive reuse SETPIECE_PATHS (`sounding`)".
- ACCEPT: `grep -n "whale's lee" reforged/BOSS-DESIGN.md` → no hits; slot-8 sheet greps a `GRAZE FORM` line; §5e greps `sounding`.

**S8-3 — Resolve the "hunter's chains" line by making the ambiguity deliberate**
- Closes: slot-8 lore finding (hunter referent).
- VERIFY: STILL-REAL — slot-8's ENTRANCE rider line "Same forge as the hunter's chains" survives with no identifiable referent (Craghold retired; ASHTALON has no chains; KARNVOW unfought at slot 8).
- WHY: a builder or writer could resolve the referent three different ways; the lore web must own the thread.
- EXACT: (1) keep the rider line verbatim (it shipped). (2) In the §5b lore web, extend the chain-maker entry: "8's broken shackles → the unseen chain-maker (open thread — the rider's 'the hunter' is DELIBERATELY unidentified; do not resolve before slot 14/post-game)". (3) Ensure no brief names a forge-mate (S8-1 already removed the Craghold anchor).
- ACCEPT: lore web greps the "DELIBERATELY unidentified" clause.
- GUARDRAILS: **Do NOT invent a referent.** If anyone on the PR asks you to pick one, STOP — that's an owner lore decision.

**S8-4 — Truth-up the slot-8 §5d sheet's operational lines (NEEDS / REUSES / hexes / skip)**
- Closes: slot-8 NEEDS-stale + hexes + skip-line findings (all CHANGED-SHAPE: content shipped, sheet lags).
- VERIFY: CHANGED-SHAPE — sheet's "NEEDS: below-horizon rise + widened bullet cull bounds (§5e)" — both shipped (below-approach + bossBullets cull floor); the scoped warn-visibility exemption shipped with CP2 (see the `reefWasBreathing` header comment in entranceScripts.js); entrance skip shipped (`skipTo: 0.82` in `reefWasBreathing`); abalone/eye hexes exist only in bossBrineholm.js.
- EXACT: (1) NEEDS line → "NEEDS: — (all landed: below-rise, widened culls, scoped warn tease, `reefWasBreathing` entrance)". (2) REUSES: replace "from the r0 build" with "from the shipped builder (bossBrineholm.js, PR #242)". (3) Read bossBrineholm.js, find the actual abalone emissive hex(es) and the eye colors, and write them into the sheet's palette line next to `0x0c1210`. (4) Append to the ENTRANCE paragraph: "Skip: `skipTo 0.82` — fast-forwards to settle, iris still LOCKS."
- ACCEPT: sheet greps no bare "NEEDS: below-horizon"; the palette line contains ≥2 new hex values that byte-match constants in bossBrineholm.js (quote them in the PR description with their symbol names).
- GUARDRAILS: transcribe hexes EXACTLY from code — if you can't find an unambiguous constant, STOP and ask; do not eyeball colors.

**S8-5 — Purge Craghold from the slot-9 brief**
- Closes: lore #46 (9's half) + slot-9 P2.
- VERIFY: STILL-REAL — the slot-9 brief still hangs "Craghold's severed finger on a trophy chain"; 9's §5d sheet and the lore web say the charms are "Ashtalon's feather-blade, one unclaimed hook".
- EXACT: in the slot-9 brief, replace the trophy-chain clause with "Ashtalon's snapped feather-blade on a trophy chain, and one empty hook" (matching the sheet). No other change.
- ACCEPT: `grep -in 'severed finger' reforged/BOSS-DESIGN.md` → no hits.

**PR-2 DONE-WHEN:** all S8 ACCEPTs pass · `.md`-only diff · run-all green · **LEAPFROG lesson** (suggested: "A redesign PR must sweep every §5b/§5c/§5e/§5i echo of the dead concept in the same commit — the sheet being right isn't enough").

---

## PHASE 3 — ENGINE DEBT (⛔ GATE B — each code task ALSO individually gated)

> **⛔ HUMAN SIGN-OFF REQUIRED — do not start ANY task below until ED-1…ED-9 are answered on the Phase-3 PR. Tasks whose decision chose the "doc-refile" option become part of PR-3a (DOC-ONLY); code options become separate PRs (one mechanic per PR).**

**PR-3a — decision transcription (DOC-ONLY, junior-safe once decisions exist):** for each ED answered with a refile/doc option, write the decision into BOSS-DESIGN.md: pending-retrofit markers on §5b rows 4/5's parry-job cells (ED-1b), named landing slots in §5i.B (ED-2b), re-slot notes in the §5j cost ledger (ED-3b: "OPEN — lands with slot 12"; ED-4b: "lands with slot 10"), §5h pending-marker (ED-5b), the ED-6 seed-on-load sentence in §5h, ED-8's reclassification (move BEAM DUEL out of the parry ladder into a Surge note on 13; restore the ≤1-debut header truth), ED-9's floor annotation in §5b. ACCEPT: each written decision quotes its ED number in the PR. GUARDRAILS: transcribe the owner's words; add nothing.

**C1 — ORGAN BREAK retrofit (slots 4/5)** — CODE · only if ED-1 = (a)
- Closes: engine #30 (+ half of #31's slot-4 scoring if the owner bundles it).
- VERIFY: CHANGED-SHAPE — no rib-crack/stagger code exists; but the generalized part-damage plumbing shipped: `routePartDamage` + `partHits` + the per-kind registry array in boss.js (entries for panes `destructiblePanes` and shackles `destructibleShackles` — the shackle entry is your template, incl. its `crack`/`hit`/`broken`/`live` model-API contract and `event`/`note` fields).
- WHY: two shipped bosses declare a parry job that doesn't exist; three shipped mechanics claim to "reuse" it.
- EXACT (contract, not code-dump — follow the shackle precedent exactly): (1) bossMarrowcoil.js: expose `crackRib(i)` / `ribHitTest(x,y)` / `ribBroken(i)` / `liveRibs()` on the handle — cracking rib ring i swaps its arc pair to a jagged broken state and deletes that ring's pattern component contribution. (2) Add a `destructibleRibs` entry to the boss.js registry array (copy the shackle row's shape; no `spray`). (3) Def flag on marrowcoil only (`destructibleRibs: true`) — absent flag = byte-identical behavior (coexist rule). (4) EITHERWING: per ED-1's scope — the handoff STAGGER on 3× parried holder-volleys (reuse the same partHits counter keyed on the holder; model exposes a `staggerHandoff()` that drops the eye to the thread midpoint for 2.5s). (5) Extend tests/boss.mjs: named-part asserts (rib pivots exist; crack changes silhouette) mirroring the brineholm block.
- ACCEPT: `node tests/boss.mjs` green incl. your new asserts · `node tests/bossboot.mjs` zero errors · `node tools/bossgate.mjs marrowcoil` and `eitherwing` pass · **manual**: `?debug&boss=100&bossIdx=3` — parry rib-slam ambers 3×, see the crack; post before/after crops to the PR and STOP for design verdict (§7 delegation protocol — you never merge on your own verdict).
- GUARDRAILS: def-gated everything; zero diff for the other six shipped bosses (prove: run the full suite + boot each boss in bossstudio). Do not touch bossKit. Do not rebalance any damage number beyond the registry's existing `+bonus chip` convention. `node tools/stamp-sw.mjs` in the same commit.
- DONE-WHEN: crops posted, human verdict, LEAPFROG lesson ("ORGAN BREAK retrofit: the slot-8 part-damage registry generalized to N kinds — what the registry contract requires of a model handle").

**C2 — entrance-look fallback** — CODE · only if ED-3 = (a). Contract: boss.js publishes an optional look target (world-x + weight) via a new handle/getter; `main.js`'s overtake-else branch consults it before stomping `setDragonLook(null)`. Def-gated (`def.entranceLook` or script-published); zero behavior change when absent. ACCEPT: run-all green; manual check on slot 6's entrance (the doc-promised "look-yaw locks" beat becomes possible — but do NOT wire slot 6's def without a separate owner ask). Same guardrails + stamp-sw + lesson.

**C3 — surge-immune shield wind-up** — CODE · only if ED-5 = (a). Contract: `def.shieldWindupS` — shield raise enters a wind-up state (visible charge, surge-immune) before invulnerability arms; defaults to 0 (today's behavior). Wire defs 6/7/8 ONLY after the owner previews each on a PR build. ACCEPT: suite green; the wind-up is visible in bossstudio's shielded state; preview sign-off per boss. GUARDRAILS: this changes three live fights — one boss per preview round; any owner hesitation → revert that def to 0.

**C4 — amber-share assert** — TESTS-ONLY · only if ED-7 = (a). Add to tests/boss.mjs's amberdiet block: share = amber fires / aimed-class fires per simulated phase ≥ 0.2. **First run it in report-only mode and paste per-boss shares into the PR**; if any shipped def fails, STOP — owner chooses (tune the clause or grant exceptions). Never "fix" a shipped def to pass a test you just wrote.

**C5 — `getBossEta()` getter** — CODE · only if ED-4 = (a) (recommendation was (b) — expect to skip this).

---

## PHASE 4 — GATE-TRUTH (PR-4 · tests/tools + doc · parallel-safe with Phase 5a)

**G1 — Middle-band TTK targets (DOC)** — Closes escalation #34/P5/P7/P10/P13. VERIFY: STILL-REAL — §5h still names only endpoints. EXACT: extend the fight-economy bullet: "Colossi 90–150s · Calamities 2.5–4min · World-Enders 3.5–5min" **flagged as (proposed — owner confirms on this PR)**. ACCEPT: all five bands have a number; PR description asks for explicit confirmation. GUARDRAILS: these are the audit's proposal values — if the owner edits them, transcribe exactly.

**G2 — DPS-sim honesty (DOC)** — Closes gates #33. VERIFY: STILL-REAL — no ttk/dps test exists; §5h says "enforced by", §5i.C.4 says "validated by". EXACT: reword both to future tense + add "(unbuilt — lands with the slot-9 build)" to §5h's build-order paragraph. ACCEPT: `grep -n 'enforced by a headless DPS-sim' ` → no hits.

**G3 — Black-fill + lit-edge studio renders (TOOL CODE — sanctioned by §7c's tool-making rule)**
- Closes: gates #37. VERIFY: STILL-REAL — `grep -iE 'black.?fill|lit.?edge' tools/bossstudio.mjs` → nothing (it gained `fightRel` only).
- WHY: §7c declares these renders MANDATORY and §3b's CP1 gate judges on them; slots 9–14's sheets will be judged against them.
- EXACT: add two per-state tiles to bossstudio: (a) BLACK-FILL — all boss materials overridden to pure black unlit, backdrop = the state's home-value; (b) LIT-EDGE — emissive-only (base color forced black, emissive intact), black backdrop. Follow the existing tile/contact-sheet plumbing; new tiles append, never replace.
- ACCEPT: run bossstudio for `brineholm` and `voidmaw`; contact sheets contain the two new tiles; existing tiles pixel-unchanged (compare against a pre-change run). `stamp-sw` in the same commit. Post one sheet to the PR.
- GUARDRAILS: tools/ only — zero `js/` game-code changes. Material override must be render-pass-scoped (restore after capture); if the tool's architecture makes that unclear, STOP and ask.

**G4 — Dichromacy matrices (TEST CODE, warn-first)** — Closes gates #38. VERIFY: STILL-REAL — no protan/deutan/tritan anywhere. EXACT: add the three matrices to tests/bulletcontrast.mjs as a REPORT-ONLY section (print role-pair distances under each matrix; assert nothing yet). Paste the report into the PR; the owner decides thresholds later (feeds GATE C). GUARDRAILS: do not hard-fail CI on colors the owner hasn't ruled on.

**G5 — hp-band + cadence-floor lint (TEST CODE)** — blocked by ED-9. Closes gates P17. EXACT: assert each shipped def's `hpMax` inside its §5b band and final-phase cadence-low ≥ band floor, WITH the ED-9-decided THRUMSWARM exception encoded exactly as the owner worded it. ACCEPT: suite green with all 8 shipped defs.

**G6 — q0.5 ratio + card *Low-dial lints (TEST CODE, warn-first)** — Closes gates P16. Report-only first, same pattern as G4.

**G7 — survival-card amberdiet exemptions (DOC)** — Closes combat #41. VERIFY: STILL-REAL. EXACT: append to §5i.C law 1: "Exemptions (cite like gate overrides): survival cards (10, 13 — boss sealed, pure dodge) and 14's stage-3 verb-shift carry no amber; the amberdiet gate skips card-scoped phases flagged `survival: true`." ACCEPT: grep confirms; note in PR that tests/boss.mjs needs the matching skip WHEN those defs exist (no test change now).

**G8 — uncosted ledger entries (DOC)** — Closes P12, #59, P4, slot-9's tennis-rally cost (doc half). EXACT: append to the §5e/§5i ledgers: 13's sky-dome crossfade (environment.js seam, SMALL, lands slot 13) · 12's dodge-mirror aim (reads shipped `poseRing`, SMALL, lands slot 12) · 9's cyan bat-back + reflect-only seal (MEDIUM — boss-side interception/re-emission + gun-sealed phase state, lands slot 9) · the taunt-card UI variant (LOW, lands slot 9; v1 ships on `ui.bossNote`) · audio-visual-twin enforcement home (LOW, telegraph-class hook). ACCEPT: each named item greps in a ledger with a landing slot.

**G9 — F/S minimums for Tiers 4/5 + sawtooth allocation rule + hijack wording (DOC)** — Closes escalation #4/#1/#5. EXACT: (1) add "WORLD-ENDERS: F ≥ 15, S ≥ 12 · APEX: F 16, S ≥ 12 (proposed — owner confirms)" to the §5 invariants; (2) add to §5b.6: "Allocation rule: a band's OPENER defs at the band hp floor + slowest cadence; its PEAK at the ceiling + floor cadence; mid-band between (the shipped defs' comments encode this — now it's law)"; (3) §5j "escalating per band" + slot 14's "thirteen entrances of escalating motion" → "escalating in what BREAKS per band (hijack seconds do not monotonically rise)".
- GUARDRAILS: the F/S numbers are proposals — flag for confirmation like G1.

**G10 — ⛔ GATE C: role-color gate extension (TOOL CODE + DOC)** — see Phase 5c P-bundle; do not start here.

**PR-4 DONE-WHEN:** suite green · report-only sections pasted to PR · stamp-sw if js/tools touched · LEAPFROG lesson ("Gates that lie: every declared CI law needs a file, a landing slot, or a future-tense sentence").

---

## PHASE 5a — ROSTER DOC PASS (PR-5a · DOC-ONLY · after PR-1/PR-2)

**R1 — Copy §5i.C allocations into the registry parry-job cells** — Closes collision #47. VERIFY: STILL-REAL — cells 9/10/11/13/14 read "—" while §5i.C allocates all five (row 8 got filled by PR #242, proving the format). EXACT: 9 "TENNIS RALLY + REFLECT-ONLY SEAL (Calamities showcase, §5i.C)" · 10 "RHYTHM PARRY CARD (WE debut)" · 11 "thread-cut → stagger (amber organ TBD at claim)" · 13 "(Surge: BEAM DUEL — per ED-8; amber carrier TBD at claim)" · 14 "STAR PIPS + medley (seal budget ×1, stage TBD)". Leave 12 "—" with "(duo-law payoff — allocate at claim)". GUARDRAILS: R1 depends on ED-8's wording for cell 13 — if PR-3a hasn't merged, hold this task.

**R2 — GRAZE FORM lines into every sheet** — Closes combat #44 (+ per-slot completeness items). VERIFY: CHANGED-SHAPE — slot 4 compliant, slot 8 fixed in PR-2; 3/5/6/7 shipped sheets + 9–14 open sheets still lack the line. EXACT: one line per sheet, copied from the §5i.B band table and phrased as anatomy: 3 SLIPSTREAM (stoop's wake — "allocated, retrofit pending per ED-2") · 5 ORBIT ANNULUS (figure-eight band — same pending marker) · 6 RIDE-THE-BEAM-EDGE (`grazeForm: 'beamEdge'`, shipped) · 7 ABSORB-A-COLOR (`'absorbColor'`, shipped) · 9 HOLD-UNTIL-FLINCH (the lance line) · 10 SHRINKING SAFE DISC (toll ring-wall pockets) · 11 CANCEL-CONVERT (cut threads bloom into steerable motes) · 12 SPRAY-SOAK escalation (breaking the dead frame) · 13 TIDE-EDGE + FACE-SHADOW POCKET (crest rim / relief shadow) · 14 → R3.
**R3 — Apex graze row** — Closes collision #25. EXACT: add to §5i.B's band table: "Apex | **THE MEDLEY'S GRAZE** (14: each quoted pattern-era serves its own boss's graze form — the graze exam mirrors the rhythm exam)" + the matching line in 14's sheet.
**R4 — Dread answer-verb tagging** — Closes combat #43. EXACT: tag every §5f signature-move entry with its answer verb; designate the audit's three candidates as parry reads (5's Both Halves, 6's Rose Judgment via pane-break, 9's returned Verdict) so law 7's ≥4 counts (with 12). Flag in the PR: "answer-verb defaults per audit — owner may veto individual verbs."
**R5 — 14's seal placement** — Closes combat P33. EXACT: one §5d line: "Stage 2 spends the seal budget: ONE wheel's era-quote is a reflect-only seal phase (§5i.C)."
**R6 — Lore batch** — Closes lore P3, #51, P24, P35. EXACT: (1) lore web: register "9's empty trophy hook → what it awaits is deliberately unnamed (candidate: the player's dragon — do not confirm in-game before 14)". (2) Slot-6 brief: add one backward clause, default per audit: "what the door prays FOR points at a slot 1–5 gap (the sky that broke Voidmaw's horn?)" — flag for owner veto. (3) One transfer clause at 14's relic list: "the horn + feather-blade move from 9's chain to 14's rails — 14 reclaims the trophies after 9 falls." (4) 4's lure-light: add the pointer to the *Count the Ribs* retrofit spec's rider beat ("…that lure isn't HIS." — flag for veto) or, if vetoed, delete the lore-web thread.
- GUARDRAILS: every invented lore SENTENCE here is a default-with-veto — list all four quotes at the top of the PR description. **Do not add lore anywhere else.**
**R7 — VOICE + Home-biome columns** — Closes the roster column findings (CHANGED-SHAPE: Home-biome now sources from BIOME-DESIGN.md). EXACT: add both columns to the §5b table. Home-biome: transcribe from BIOME-DESIGN.md's anchor table (6→Sunken Sanctuary · 4→Frozen Reach · 3→Emberfall Caldera · 7→Lumen Mire · 2→Tempest Reach · 8→Tidal Reef · 9→Amber Wastes *tenant*; all others "—, assign with biome rollout"). VOICE: transcribe ONLY existing material (10 = the toll · 12 = arrhythmic double wing-thump · 14 = held choir partial · 8 = tidal drone/inhale-spout); every other cell "—, author at claim". ACCEPT: table has both columns; zero invented cell values (each filled cell cites its source doc/section in the PR description). GUARDRAILS: **"—" is the correct answer for most cells.** Inventing a voice = task failure.
**R8 — Scar-law allocations** — Closes #55 + 13's scar (13's goes in its SL-13 sheet task; here: 7 + 11 + annotations). EXACT: 7's sheet: "Scar: one dead mote — a permanently unlit tetra that keeps formation (the one that forgot)" (audit default; veto-flagged). 11's sheet: scar line TBD at its SL-11 sheet task (skip here). Annotate 9 ("the tilted EMPTY hook is the §3.6 scar/lore-gap") and 14 ("the stage-2 disc CRACK + worn relics fill the law's role").
**R9 — §7b sanction list extension** — Closes #56 + 13's gate-sanction half. EXACT: extend §7b's override examples: "`gate:{presence}` for never-fits slots 8 and 14-stage-1 (registry sanction: 'colossal leviathan head', 'always there'); `gate:{pale, coverage}` for 13 (full-frame field — registry row to gain the VALUE token at its sheet pass)."

**PR-5a DONE-WHEN:** `.md`-only diff · all greps pass · veto-flagged defaults listed at the top of the PR · run-all green · LEAPFROG lesson.

---

## PHASE 5b — PER-SLOT SHEET PASSES (PR-5b…5g · DOC-ONLY · sequential 9→14)

Each slot gets ONE PR containing: the §3b SILHOUETTE TRANSLATION SHEET (six fields — copy slot 8's block in §5d as the template), the §4b seven-channel carrier map + GLYPH line, and that slot's specific repairs listed below. **Structure per task is identical; per-slot content differs.**

> **⛔ GATE A applies to every PR in this phase: the sheet + map you draft are PROPOSALS. The PR must end with "AWAITING §3b/§4b SIGN-OFF — this slot is NOT claimable until the owner (or a Fable design gate) approves." You cannot self-certify. A slot's row may not flip toward building until that sign-off lands.**

Common ACCEPT for all six: the §5d entry contains a six-field block (`Reads as / Carrying cues (2–3) / Anti-reads / Lit-edge plan / Scale target / Home backdrop`) + a seven-channel line (GAZE · BLINK-analog · CHARGE-TELL · EXPRESSION ≥3 · FLINCH · NOTICE · DEATH) + a GLYPH; run-all green; `.md`-only.
Common GUARDRAILS: carriers are mostly SEEDED in §4b — extend the seeds, don't contradict them. Scale targets cite the anchors (ASHTALON ≈24u span · MARROWCOIL screen-length · BRINEHOLM ~36u hull). Tri-budget rewrites inside these sheets are DRAFT numbers pending GATE C — write "(band budget per §5g — GATE C confirms)" next to each. **If a field forces a design choice the audit didn't spec (a new anti-read, a glyph shape), draft it and veto-flag it — never silently decide palette or silhouette.**

**SL-9 — KARNVOW (PR-5b)** — Closes slot-9 items #5–#7, its two claim-gate blockers, presence findings, skip/rest lines.
Must contain: §3b sheet (Reads as: a reaper-thin duelist riding your flank; cues: the lance + the cowl VOID + the trophy chain; anti-reads: generic grim-reaper, and slot-11's hooded shroud — name the forbidden primitives; lit-edge: trophy glints in owed palettes + the cold cowl glint, no level lines; scale target: **explicit on-screen span with the ED-11 presence lift** — the trophy chain arcs at arena scale behind it, span cited vs the 24u anchor; home backdrop: pale — Amber Wastes per R7). §4b map (glint=GAZE/BLINK · lance snap-to-POINT=CHARGE-TELL · salute/point/lower=EXPRESSION · cowl recoil=FLINCH · lance salute=NOTICE · chain drops + glints gutter out=DEATH) + glyph (the tilted empty hook). Plus: REUSES line (horn tube-taper kernel, craghold pose machine, `bossLedgerStats` taunts) · NEEDS line (cyan bat-back + seal — cites G8's ledger entry) · skip line (stat-quote + MANDATORY charm flare must both survive skip — state the landing) · AGGRESSION-EXCHANGE rest look ("it drops the lance-tip and drifts a half-length back — reading you") · tri line "(Calamities band 8–14k — GATE C confirms; spend on dread-card spectacle per §5g rule 4: Voidmaw's Verdict traced at screen scale, charms flaring per rally return)".

**SL-10 — KNELLGRAVE (PR-5c)** — Closes THE formal blocker + slot-10 items.
Must contain: §3b sheet (anti-reads: chandelier/ornament — forbid symmetric decorative fins; bell DIMENSIONS + explicit span target; home backdrop TBD "—" per R7); §4b map per the audit fix (slit-gutter=BLINK · head-tilt angles=EXPRESSION ≥3 · strap-strain=FLINCH · head-LIFT=NOTICE (already seeded) · candle-dies + head drops=DEATH · pendulum-face=GAZE · slit flare=CHARGE-TELL) + glyph (cracked bell with the hanging figure). Plus: named pivots (`swingPivot`, `clapperHeadPivot`) · REUSES line (iris/ring-wall kernel, torus chain links + shackle precedent from 8, `getBeatClock`) · NEEDS line += second-sun seeding, TRICK-LINE LINKING, `musicKill()` (all land with 10 per §5h/§5i/§5j) · skip line (music STAYS dead; slow-mo released; bell snaps to station) · candle-vs-amber clearance note (DRAFT — final wording is GATE C, task P4) · tri line "(WE band 14–22k — GATE C confirms)" · awe lift: re-entrance on *The Last Toll* (crack gapes, slit goes HDR-wide, clapper fully revealed straining — §5j law 10, free).

**SL-11 — WEFTWITCH (PR-5d)** — Closes slot-11 items incl. the wrong-noun risk.
Must contain: §3b sheet (Reads as: a weaver-witch at the top of her loom; cues sized DOMINANT per §3.1 — the triangular shroud mass, the two pale hands, ONE thick anchor thread; **anti-reads: generic spider + unreadable line-tangle — forbidden: >6 visible limbs in silhouette, limbs thicker than threads, radial symmetry at the bust**; lit-edge: hands + rose thread-lines only; scale target: explicit span — the thread-fan spans the arena but the BUST must pass the boss-test alone per L141 "negative space is not mass"; home backdrop "—"). §4b map (palm orientation=GAZE · finger-curl=BLINK · thread pulled taut to the lance=CHARGE-TELL · weaving tempo=EXPRESSION (≥3 named tempi) · hands snap still=DREAD/FLINCH inversion — name both states · one finger points down=NOTICE (shipped in entrance spec) · hands fall open, threads go slack=DEATH) + glyph (two hands + one thread). Plus: hand/finger primitive spec (the CRAGHOLD mitten-finger lesson — name segment counts) · named pivots for the six spinneret limbs · REUSES line · SYNCOPATED-LOOM rest look ("hands keep time silently — weaving without firing") · amber-carrier draft (which volley carries amber; veto-flagged) · tri line (GATE C) · **rose-hue note: "palette pending GATE C ruling P1 — do not restate 0xd88098 as settled."**

**SL-12 — ONEWING (PR-5e)** — Closes slot-12 items incl. the invisible hook.
Must contain: §3b sheet (Reads as: a broken colossus flying wrong; cues: ONE vast wing + the listing 12° axis + the black fused frame **made readable** — spec the audit's fix: the frame crosses the silhouette edge at the shoulder AND carries a faint ember-dark rim (below focal intensity) so it survives the black-fill/lit-edge renders; anti-reads: "just ASHTALON" and "slot-5 pair" — forbidden: symmetric wing pair, matched twin masses; lit-edge: full-perimeter rim on the LIVE body only (5's r9 law carried over), ghost frame stays sub-focal; scale target: state the base explicitly (r9 twin, BODY_LEN 6.2) and an on-screen span clearing the Tier-3 anchors — "vast wing alone spans ≥26u" — plus ONE mid-fight presence beat compatible with "no rear view, no pull-ahead" (e.g. a lateral cross ABOVE the lane; veto-flagged); home backdrop "—"). §4b map (single eye inherits the ladder for GAZE/CHARGE/NOTICE; BLINK-analog = the eye DIMMING to the chest frame and back (seeded in the entrance); wing-sag rubato=EXPRESSION; stub-twitch=FLINCH; the eye dims, drops to the frame, and does not return=DEATH) + glyph (one wing + the chest frame). Plus: glow-shape token for its registry row (GATE C task P2 confirms wording) · REUSES/NEEDS lines (def.noWarn, sub-part HP, slot-7 `poseRing` per G8) · graze line already in R2 · tri line (GATE C).

**SL-13 — EMBERTIDE (PR-5f)** — Closes slot-13's thin-sheet cluster.
Must contain: §3b sheet (Reads as: a sunset that is a face; **anti-reads: sunset postfx / mountain ridge — the positive signal per §3b.5: the eye-hollows OPEN and TRACK, terrain doesn't**; carrying cues: the three staggered bands + the brow/nose/chin relief masses + the two eye-hollows; lit-edge: the gradient IS the light — the face is drawn in DARKNESS (the §4b recorded exception); scale: overflows both portrait edges (already law) + relief-mass sizes; home backdrop: dark dusk sky (value complement — cite R7)). Geometry repairs: primitive spec for the relief masses (box/wedge masses pushed through the band planes — name counts/sizes/placement), the eye-hollow construction (opaque dark cutout planes riding the band, not shader tricks — or STOP and ask if the builder should decide), palette hexes for the gradient endpoints + relief dark (DRAFT — GATE C), named pivots (`crestPivot`, `browPivot`), REUSES line (light-band planes reuse the sky-dome fog-exempt pattern), NEEDS line += sky-dome crossfade + letterbox squeeze (cite G8 ledger entries). §4b map (hollows widen/narrow=EXPRESSION ≥3 · hollows snap to you=NOTICE · a band flickers dark=BLINK · the face surges forward through the glow=CHARGE-TELL · relief masses shudder=FLINCH · the bands drain to grey, hollows close=DEATH) + glyph (two dark almonds in a band). Plus: **scar + forward gap**: "a torn permanently-dark notch in one band — the leash-collar mark; open thread: who leashed EMBERTIDE?" (veto-flagged; register in the lore web) · survival-card naming fix: state in §5f that 13's single survival card = the final *Horizon Break* crest and the first-set vertical squeeze is a normal beat · VALUE token added to its registry palette cell (with the §7b sanction cross-ref from R9) · tri line (GATE C — this is the 12× under-spec slot; draft "authored toward the 14–22k WE band: relief density + band segment counts", numbers to GATE C).

**SL-14 — THE UNMASKED (PR-5g)** — Closes slot-14 items.
Must contain: THREE stage-scoped §3b blocks (the stages have different silhouettes — one sheet each, brief): stage 1 (Reads as: an eclipsed second sun with a lid; anti-read: "just the sky dome / a HUD element"; cue: the corona ring + the lid seam), stage 2 (Reads as: a biblically-accurate angel of wheels; **anti-reads: gyroscope / ferris wheel / loading spinner — forbidden: uniform spoke spacing, equal wheel radii, coplanar wheels; the positive signal: the EYES — every wheel studded with tracking eyes**; cues: three unequal gimbal-tilted wheels + six scythe-wings + the relic charms), stage 3 (Reads as: the veiled core unveiling; cue: wings mantled open + the petal shroud). Geometry repairs: primitives for the stage-1 lid (a thick arc segment sweeping the disc — draft), the stage-3 shroud (petal count/radius/coverage from the mandala kernel — draft numbers), and **the thread-spool relic's source geometry** (none exists anywhere — draft a two-torus + wound-thread LineSegments spool, veto-flagged); named pivots (`lidPivot`, `wheelGimbal0-2`, `wingPair0-2`); draw estimate vs the ≤120 gate (the ~20 eye rigs — state the merge plan per §5g rule 3). §4b map per stage (lid aperture=stage-1 carrier (seeded); wheel-stutter=FLINCH; aperture-notch states=EXPRESSION; counter-rotation pause=BLINK-analog; all eyes converge=CHARGE-TELL; wheels tilt flat + eyes ease shut one wheel at a time=DEATH) + glyph (a lidded disc). Plus: tri line rewrite citing the Apex cap ("~30k across stages — spend it, §5g; per-stage targets: S1 ~2k, S2 ~20k, S3 ~8k — GATE C confirms") · skip line for the entrance (skip lands at stage-1 station; the saccade fires immediately so the read survives) · seal placement already in R5 · uniqueness rulings: add two lines to §5j/§5b rulings — "2's flat concentric RINGS vs 14's gimbal-tilted eye-studded WHEELS (depth + eyes = the differentiator, protected)" and "12's oversized wing reuses 3's kernel AS DAMAGE EVIDENCE (broken/asymmetric) — flagged echo, not a collision" · 6-vs-14 exclusivity scope fix ("6 is the only boss that never comes to you DURING ITS APPROACH; 14 is the sky itself") · 4's-flyby law-7 ruling ("4's mid-fight flyby quotes the past-you vector as a FIGHT beat — 3's claim is the ENTRANCE overtake; recorded").

**Each PR-5x DONE-WHEN:** common ACCEPT met · veto-flagged drafts listed at the PR top · **⛔ GATE A banner posted, sign-off received before the row/sheet is treated claimable** · LEAPFROG lesson per PR.

---

## PHASE 5c — ⛔ GATE C: THE PALETTE / COLLISION / BUDGET BUNDLE (P-tasks · after 5b drafts exist)

> **⛔ HUMAN SIGN-OFF REQUIRED — none of P1–P6 lands without the owner approving the specific values. Junior: prepare the rulings as a single PR with a decision table at the top; every hue given as hex + computed HSV hue-degrees; include the G4 dichromacy report. Do not merge until every row has an owner initial.**

**P1 — Rose-family ruling (11/12/13) + 11's hue decision.** Closes visual #11/#28. Present: 11's `0xd88098` = hue ≈344°, 1.4° from danger `0xff2b6a` ≈342° (inside the doc's ±15° G3 band; passes the shipped gate only via the sat>0.5 qualifier — margin razor-thin). Options: hue-shift to ~320° dusty mauve (audit rec) vs keep + add slot-5-style clearance clause. Also: the principle-10 rose-allocation paragraph (11 = rose LINES on grey · 12 = near-black trace · 13 = bright full-frame field; separating axes named) + hex endpoints for 13's gradient.
**P2 — 12's glow-shape token.** Closes #17. Proposed cell: "/ single dimmed point + black wireframe trace (designed echo of 5's single point — flagged)".
**P3 — Bone/ivory swatch split (4 vs 6).** Closes the literal-swatch collision (`0xd8d2c0` vs `0xd8d0c2`). Proposal: warm 6's ivory (e.g. `0xd8cab0`) — DOC value only (6's builder hex is code; changing shipped code color = separate owner ask; the ruling documents which slot OWNS the swatch and who moves at their next pass).
**P4 — Candle-vs-amber clearance (10) + the principle-10 amber-organ sanction sentence.** Closes #29 + slot-10's clearance note. Sanction text: "Amber may appear on a boss ONLY as the amber-emitting organ per §5i.C.3 (shipped: 7's queen-eye, sanctioned in bossDefs; 9's glints) — everywhere else the band is reserved." Clearance: candle `0xffd890` vs reflect-amber — separate by a value/saturation tier; exact numbers owner-picked.
**P5 — Glow-shape granularity ruling.** Closes the taxonomy ambiguity. Text: "orientation/extent/distribution modifiers count as distinct glow-shape claims; annotated pairs: slit 3 (horizontal visor) vs 10 (vertical candle-crack) · field 6 (leaded, discrete panes) vs 13 (continuous gradient) · lines 2 (concentric) vs 11 (radial taut)."
**P6 — G3 extension spec (feeds tool change).** Closes the enforcement half of #29: extend §7b's G3 row to all four role bands WITH the sat/val qualifier written into the doc (sync doc↔`satOf` behavior in bossgate.mjs), then (code, same PR or follow-up) implement in tools/bossgate.mjs + adopt thresholds from the G4 dichromacy report. Tri-budget confirmations from the SL sheets (SL-9…14 draft numbers) also sign off here.

---

## APPENDIX A — ALREADY-FIXED (dropped from scope; verified 2026-07-06 @ e89d389)

| Audit finding | Fixed by | Evidence |
|---|---|---|
| Slot-8 registry parry-job "—" / no amber-carrier | PR #242 | §5b row 8 now carries **SHACKLE BREAK** (parry a snout shackle post's amber strain-volley 3×…); def phases carry the amber `stream`/`fan` carriers |
| Slot-8 REUSES pointed at unreachable "r0 build" code | PR #242 | `bossBrineholm.js` merged to master (the r0 branch WAS `claude/brineholm-boss-slot-8-3f4p8l`); S8-4 still rewords the citation |
| Slot-8 entrance missing skip line (POLISH) | PR #242 | `ENTRANCE_SCRIPTS.reefWasBreathing` ships `skipTo: 0.82`; S8-4 documents it in the sheet |
| Slot-8 §4b charisma channels (had been ADJUSTED to POLISH) | PR #242 | shipped eye/lid/jaw rig with named pivots `jawPivot`/`eyeLidPivot`/`brineEye`/`brineScar`, asserted in tests/boss.mjs |

Also dropped at audit time (verifier-refuted — do not re-open; full list in the audit report §6): slot-8 tri spec (cites its band cap), TIDAL DRONE mid-band dip (flagged deliberate breather), the slot-5 engine bundle (landed), 5↔12 / 2↔13 / 1↔8 / 6↔8 / 13↔14 echoes (all flagged in-doc), perfect-parry heal feasibility (player HP pips exist), ghost-bullets engine cost (per-bullet color shipped).

---

## APPENDIX B — CHANGED-SHAPE REGISTER (why some tasks differ from the audit's wording)

1. Slot-8 doc gaps → transcription tasks (S8-2/S8-4): the CONTENT shipped in code; only the doc lags.
2. Home-biome column → sourced from BIOME-DESIGN.md's anchor table (R7), not invented.
3. ORGAN BREAK → now THREE shipped reuses of the missing debut; retrofit cost dropped to LOW-MED via the slot-8 part-damage registry (ED-1/C1).
4. Stale-status finding → grew to include row 8 (D1).
5. §9 list → grew: duplicate L164/L165 pairs now exist; new BRINEHOLM lessons absent from §9 (D9).
6. L140 conservative-sheet trap → scope 7→6 sheets (8 shipped at ~36u with a span≥34 test assert).
7. Amber ≥20% share → weakened but real: tests now assert carrier PRESENCE per phase; the share itself is still ungated (ED-7/C4).
8. entrance-look fallback → consumer list shrank (8 shipped without it): now 1/2 retrofits + 12 (ED-3).
9. Graze-anatomy law → 4 + 8 compliant; the rest still missing the sheet line (R2).
10. Slot-8 negative-space pass → shipped as a dive; now a preview judgment (ED-10), not a task.
11. §6.1 recipe → also missing `grazeForm`/`setpieces`, which now exist (D11).
12. amberdiet-vs-survival-cards → unchanged in substance; exemption text must ALSO name the test-side skip mechanism since the gate now simulates phases (G7).
13. 8→9 grandeur cliff → sharpened (a shipped never-fits leviathan precedes it); folded into SL-9 + ED-11.
14. Second-sun trigger → urgency rose: Calamity kills are accruing on live saves NOW (ED-6).
15. BIOME-DESIGN.md repeats the stale modulo claim → new one-sentence fix folded into D3.
