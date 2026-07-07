# BOSS-BUILD-CONTEXT — the primer (read this first)

**Purpose.** This folder is the durable, in-repo home of the 2026-07 boss-design **audit** and the
per-boss **build briefs**. It exists so any fresh session (a new chat, a new person) can start
**informed without inheriting a long conversation's context bloat** — the LEAPFROG model ("read
the ledger, start from what the last session learned") applied to boss work.

The **source of truth** is still the repo's own docs — `reforged/BOSS-DESIGN.md` (the playbook),
`LEAPFROG.md` (the ledger), `reforged/BIOME-DESIGN.md`. This folder is the **distilled synthesis**
on top of them: what the audit found, and per-boss "start here" briefs.

---

## How to use this (two workflows)

**A. Building / redoing ONE specific boss.**
Open a fresh chat, paste that boss's brief from `briefs/` (each is self-contained — "you do NOT
need the full SOP"). That's the whole context you need. Then follow its Fable-gate + owner-preview
process.

**B. Meta / review / design / budget questions** (like "is this idea legal", "what did the audit
find", "how grand should band N be").
Read, in order: this primer → `audit/BOSS-AUDIT-REPORT.md` (the findings) → `BOSS-DESIGN.md`
§-map for the specific law → the relevant brief. That's enough to answer without any prior chat.

---

## Roster state (snapshot — the §5b registry rows + LEAPFROG are the LIVE truth)

| # | Boss | Band | Status | Builder / brief |
|---|------|------|--------|-----------------|
| 1 | VOIDMAW | Sentinel | shipped | `bossIdol.js` |
| 2 | STORMREND | Sentinel | shipped | `bossMandala.js` |
| 3 | ASHTALON | Colossus | shipped | `bossAshtalon.js` |
| 4 | MARROWCOIL | Colossus | shipped | `bossMarrowcoil.js` |
| 5 | EITHERWING | Colossus | shipped | `bossEitherwing.js` |
| 6 | HOLLOWGATE | Calamity | shipped | `bossHollowgate.js` |
| 7 | THRUMSWARM | Calamity | shipped | `bossThrumswarm.js` |
| 8 | BRINEHOLM | Calamity | shipped | `bossBrineholm.js` (PR #242) |
| 9 | KARNVOW | Calamity (band PEAK) | **shipped, in GRANDEUR REDO** | `briefs/REDO-BOSS-9-KARNVOW.md` + `briefs/KARNVOW-9-SPEND-PLAN.md` |
| 10 | KNELLGRAVE | World-Ender (opener) | briefed, in-build | `briefs/BUILD-BOSS-10-KNELLGRAVE.md` |
| 11 | WEFTWITCH | World-Ender | briefed, unbuilt | `briefs/BUILD-BOSS-11-WEFTWITCH.md` |
| 12 | ONEWING | World-Ender | briefed, unbuilt | `briefs/BUILD-BOSS-12-ONEWING.md` |
| 13 | EMBERTIDE | World-Ender (band PEAK, 2nd-last boss) | briefed, unbuilt | `briefs/BUILD-BOSS-13-EMBERTIDE.md` |
| 14 | THE UNMASKED | APEX (3 stages) | **open — NO brief yet** | *(to write)* |

---

## The load-bearing laws (distilled — full text in BOSS-DESIGN.md)

1. **Silhouette first + the stranger test (§3b).** At 30m on a phone a boss is a black outline +
   a few lit edges. The §3b translation sheet (Reads-as / cues / anti-reads / lit-edge / scale /
   home-backdrop) must be filled **and Fable-signed-off BEFORE any geometry** — this is the
   anti-"whale-read-as-a-battleship" discipline (L150). Detail off the outline is invisible.
2. **§4b seven charisma channels.** GAZE · BLINK-analog · CHARGE-TELL · EXPRESSION(≥3) · FLINCH ·
   NOTICE · DEATH + a doodle glyph. "A sheet missing any channel is not claimable." (This was the
   audit's most common per-slot BLOCKER for the open slots.)
3. **One focal, painted values, reserved colors.** One brightest emissive (usually an eye); dark
   body, identity in emissive accents; role colors are **reserved forever** — danger magenta,
   parry **amber** (amber = "parryable", only ever the amber-emitting organ), reflected cyan,
   surge pink.
4. **Telegraphs change the SILHOUETTE**, from named, visible anatomy (name the pivots — the gate
   finds them by name).
5. **The budget reality (L124/L126 — measured on a real weak phone):** **tris are ~free** (400k
   held 59fps); **draws are the tighter axis** (~415 animated held 58fps — and a *new draw = a new
   independently-moving part*, a creative cost, not a modeling one); **overdraw is the ONLY real
   cliff** — **≤2 large additive/fresnel volumes on screen, INCLUDING the kit shield.** LineSegments
   are overdraw-exempt.
6. **Per-band budgets rise (§5g), and the sheet number is a FLOOR not a target.** Sentinels ≤4k/34,
   Colossi 5–8k/50, Calamities 8–14k/70, World-Enders 14–22k/90, Apex ~30k/120. Spend UP toward the
   gate on **identity-bearing detail, never filler** (the L140/L141 trap: a boss speced far under
   its band reads thin).
7. **Studio-first, then in-game; Fable gates, the owner owns the final call.** Never self-judge.
   3 Fable spawns per build: pre-build sheet sign-off, CP1 studio design gate, CP2 integration gate
   — then post crops and STOP for the owner preview. Judge grandeur on the **in-game fight frame**,
   not the studio turntable (which auto-frames and hides presence failures).
8. **Coexist — never break the shipped roster.** A boss is DATA + one builder file; `boss.js` needs
   zero changes for a new MODEL; new engine is def-gated and inert for every other boss (prove it
   with the full suite).

## The "go all out" budget doctrine (the World-Enders + the redo)
Spend toward the band gate on IDENTITY (worn/orbiting/left-behind/summoned-in-beats detail,
richer relief, more articulation), never bulk or new lamps. **Everything else on screen is
accounted for:** bullets = **4 instanced draws regardless of count**; one dragon ~6k HIGH / ~12k
ULTRA; a future post-defeat dragon-relic reserves ~5k / ~10 draws **as separate meshes (never
InstancedMesh — L126)**; the second-sun landmark ~200 tris. None contends with a boss on tris;
draws are the axis to watch. **EMBERTIDE (13) is the exception:** its grandeur currency is LIGHT +
the FACE + the vertical squeeze + overdraw headroom, NOT tris — the tiershots overdraw audit is a
gating item there.

## The audit in one paragraph
`audit/BOSS-AUDIT-REPORT.md` = 100 verified findings (adversarially checked; 57 false positives
killed). Headlines: slots 9–14 all needed their §3b sheet + §4b map before they could be claimed
(now drafted in the briefs); the doc lags shipped code in ~15 places (a hygiene sweep — see the
SOP); three mechanics landed on paper only (ORGAN BREAK, the Colossi graze forms, the shield
wind-up); several declared CI gates don't exist yet (TTK sim, amber-share, dichromacy). The
per-slot readiness + fixes are in the report; the executable task list is `audit/BOSS-AUDIT-SOP.md`.

---

## Pointers
- `audit/BOSS-AUDIT-REPORT.md` — the prioritized gap report (readiness table 8–14, blockers,
  roster-wide issues, the awe-beat readout).
- `audit/BOSS-AUDIT-SOP.md` — the execution SOP (40 atomic tasks, 4 human gates, ALREADY-FIXED +
  CHANGED-SHAPE appendices).
- `briefs/BUILD-BOSS-{10,11,12,13}-*.md` — self-contained build briefs (World-Enders).
- `briefs/REDO-BOSS-9-KARNVOW.md` + `briefs/KARNVOW-9-SPEND-PLAN.md` — the shipped-boss grandeur
  redo + its budget-spend directive.
- `briefs/_archive/` — superseded/historical (the pre-ship KARNVOW brief).

## Open follow-ups
- **14 THE UNMASKED** (the Apex, 3 stages) has no brief yet — the one remaining brief to write.
- The audit's doc-hygiene + gate-truth tasks (SOP Phases 1–4) are unactioned; they don't block
  building the open slots but they keep BOSS-DESIGN.md honest.
