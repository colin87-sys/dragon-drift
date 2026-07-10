# Phoenix build handoff — copy-paste this into a FRESH chat to build "The Dawnfire Empress"

This file is the version-controlled handoff prompt for a new implementation session. It builds the
premium Phoenix rebuild from its finished, audited contract. Copy everything below the line into the
first message of a new chat. (Authority order: the SETTLED block + numbers in
[`PHOENIX-DAWNFIRE-BUILDSHEET.md`](./PHOENIX-DAWNFIRE-BUILDSHEET.md) win over anything summarized here.)

---

You are building a premium end-game dragon in Dragon Drift — a 100% procedural, low-poly, vanilla
Three.js r160 flight game (no asset files, no build step, must hold 60fps on weak mobile). The live
game is in `reforged/`. Repo: colin87-sys/dragon-drift.

MISSION: Implement "The Dawnfire Empress" — a premium rebuild of the Phoenix firebird — from its
finished, audited build sheet, following the finalized premium-dragon method. This is a fresh
IMPLEMENTATION of an already-designed, already-audited contract. Your job is to BUILD it, not redesign it.

PRECONDITION: the method + build sheet were finalized on PR #333. Confirm it's merged to master (or read
the docs from branch `claude/solar-spectacle-cp2-l848pm` if not).

═══ READ FIRST, IN THIS ORDER (numbers in the sheet are the authority) ═══
1. `CLAUDE.md` + `LEAPFROG.md` + skim `leapfrog/lessons/` (newest first). Add a NEW lesson file after
   meaningful changes (one file per lesson; do NOT append to `LEAPFROG.md`).
2. `reforged/PHOENIX-DAWNFIRE-BUILDSHEET.md` — THE CONTRACT. Read its "SETTLED — do NOT re-litigate"
   block FIRST: those owner decisions + Fable audit rulings (train-hero, coexistence, title, apex body,
   trainSpread, and the primaryGaps/trainLift/near-white/persona/dark-tone rulings) are CLOSED. Build to
   them; if you think one is wrong, RAISE IT with the owner — never silently change.
3. `reforged/PREMIUM-DRAGON-METHOD.md` — THE PLAYBOOK. Follow it literally: §0 (per-FORM tri budget,
   LEVEL-BODY law), §0.5 distinctiveness, §2 rear-chase primacy, §3 spectacle triad, §3.5 firewall +
   ROUND-0 self-audit, §4 verify-by-failure-class, §5 the HIGH-EFFORT Fable gate, §6 reuse-plumbing-
   not-look, §7 checklist.
4. `reforged/SOLAR-ECLIPSE-BUILDSHEET.md` + `js/dragonSovereign.js` — copy the PLUMBING/CONTRACTS (mats-
   factory structure, attach contract, `flatTriMesh`, dial gating, surge discipline, test patterns),
   NEVER its design features/look.
5. `reforged/DRAGON-DESIGN.md` + `MODEL-CREATION.md` — the lower-level engine/art laws.

═══ LOCKED (from the SETTLED block — do not reopen) ═══
- COEXISTENCE: new roster key `phoenixEmpress` in `js/dragons.js` (mirror shipped phoenix's rarity/cost/
  stats), new file `js/dragonPhoenixEmpress.js`. Shipped `phoenix` stays BYTE-IDENTICAL — do NOT edit its
  def/parts. New builders self-register DEFAULT-OFF; only `phoenixEmpress.parts` opts in.
- Signature = the PYRE-TRAIN (bottom-heavy quill-train hero + slender rising scythe wings). NOT an M, not
  Solar's arch/ring/membrane/violet. `title: 'The Dawnfire Empress'`.
- Lighting = "a coal, not a torch": dark-garnet matte body + fire on edges/tips/gems in 3 warm hues;
  dark-garnet dorsal every form + small pale-gold f3 BELLY nod only. `trainSpread` fold/fan APPROVED.
- Builders: `pyreHeartTorso` · `scythePinionWings` · `cometCrestHead` · `pyreTrainTail`.

═══ THE LADDER (from the sheet — build apex f3 first, then subtract) ═══
`igniteStage` 0/1/2/3 · `trainQuills` 2(stub)/4/6/9 · `trainFan` 90/120/150° · `trainLift` low→proud ·
`coalBloom` 0/first/all/blazing+DawnCoal(f3) · `primaryGaps` 0/2/3/full · `crestQuills` 0/1/3/5 ·
`gorget` none/none/conferred/blazing · `eyeShape` 34/26/20/16% · `glowLevel` 0.25/0.5/0.75/1.0 ·
tri targets ~1.0k/1.4k/1.7k/2.0k (per-form <6000, monotonic). Coal-eyes/DawnCoal stay OUT of
`spineMats`/`accentMats`; vane-edge + pinion mats go IN (flare on Rebirth Surge).

═══ WORKFLOW ═══
1. Build the APEX (f3) FIRST as `phoenixEmpress`; satisfy the §3.5 firewall + rear-chase + spectacle
   triad in the same pass. Then subtract down the ladder (gate each regalia MESH per rung).
2. ROUND-0 SELF-AUDIT before any Fable round: `node tools/dragonstudio.mjs phoenixEmpress r0`; audit the
   apex tiles HARD against the sheet's QA-0 firewall + §0.5 axes; fix to ~3.5+ before Fable sees it.
3. VERIFY BY FAILURE-CLASS: `node tools/tricount.mjs --ci` · `node tests/blueprint.mjs` ·
   `node tests/smoke.mjs` (guard coreGlow-mesh-or-null + wing-rig crash → invisible dragon) ·
   `node tools/wingsymprobe.mjs phoenixEmpress` · add a `phoenixEmpress` block to `tests/starters.mjs`
   (tail-quill cant-balance Σ≈0, fan sector <180°, quill gap ≥1 quill-width, dials monotonic).
4. HIGH-EFFORT FABLE GATE — IMPORTANT. Spawn a high-effort Fable agent (Agent tool, model:"fable",
   subagent_type:"Plan") as a standing checkpoint at EVERY critical step and gate on PASS before
   proceeding. Use the sheet's QA-1.4 combined brief + the DISTINCTIVENESS veto: hand it Solar + Pearl +
   Ember + Cinderwing tiles + the explicit TONE check. Calibrate first on the SHIPPED phoenix (expect
   FAIL). PASS = avg ≥4.0, no axis ≤2, vetoes clear. Iterate until PASS.
5. CHECKPOINT THE OWNER on the live PR preview for MOTION/feel (train sway/fold-fan, wingbeat, Rebirth
   Surge, mote wake) and any net-new element — show ladder + rear-chase + sil-rear + old-vs-new
   side-by-side — before finalizing.

═══ GIT ═══
`git config user.email noreply@anthropic.com && git config user.name Claude` first. Branch from latest
master: `claude/phoenix-dawnfire-empress-build`. Commit + push; keep a DRAFT PR. Update the sheet's
CHANGELOG as you implement; append a leapfrog lesson after meaningful changes.

DONE = `phoenixEmpress` builds clean (failure-class checks green, per-form <6000, wingsym PASS), clears
the high-effort Fable gate (distinct from Solar on all 5 axes + tone), shipped `phoenix` untouched, owner
has seen the old-vs-new comparison on the live preview.
