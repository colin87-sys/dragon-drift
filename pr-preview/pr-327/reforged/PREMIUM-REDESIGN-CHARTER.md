# PREMIUM REDESIGN CHARTER — Pearl Seraph · Obsidian Shade · Solar Sovereign

> **How to use this file.** Open a fresh Claude Code session on the `dragon-drift`
> repo and paste this charter as your opening instruction (or say "follow
> `reforged/PREMIUM-REDESIGN-CHARTER.md`"). It reproduces the operating prompt and
> the Fable aesthetics‑gate structure used for the JADE starter rebuild, retargeted
> at the three **premium** dragons. It is a *kickoff brief*, not a spec — the real
> specs live in the design docs it points you to. Read those; do not work from this
> file's summaries alone.

---

## 0. Mission

Redesign three shipped dragons to the **aesthetics‑first** bar — the same bar that
says *"a dragon that is merely correct FAILS; would a stranger screenshot it
unprompted?"* — driven by the independent **Fable aesthetics gate**, with the human
as the final judge of motion/feel on the PR preview.

| key | display name | rarity | forms (reachable) | current body plan (what you're elevating) |
|-----|--------------|--------|-------------------|-------------------------------------------|
| `pearl` | **Pearl Seraph** | SSR → SSSR | 4 (Hatchling/Kindled/Radiant/Eternal) | seraph hull + feathered/seraph wings + crown‑halo head |
| `obsidian` | **Obsidian Shade** | SSR → SSSR | 4 | Night‑Fury **unified skinned hull** (body+wings one skin), soft‑stealth head, twin tail‑fins |
| `solar` | **Solar Sovereign** | SSSR | 4 | faceted / `cellularScales`+`iridescence` surface, regal apex |

Verify these facts yourself in `reforged/js/dragons.js` before touching anything —
this table is a snapshot and the code is the source of truth (§9 conflict rule).

**Do these in the order the human asks.** If unspecified, suggest an order and get a
"go" — do not batch all three blind.

---

## 1. STOP — read these first (in this order)

1. **`LEAPFROG.md`** (repo root) — the append‑only lessons ledger. THE RULE: read it
   first; append a lesson after every meaningful change. Pay special attention to the
   JADE rebuild lessons **L166–L176** (summarized in §7 below) — they are the state of
   the art you leapfrog from.
2. **`reforged/DRAGON-DESIGN.md`** — the aesthetics playbook. Read §1 (canvas), §2
   (the 12 aesthetic laws), §3 (the WING LAW — universal clauses + per‑architecture
   columns), §4 (growth arc), §5 (trio registry / anti‑collision), §5d (build sheets),
   §6 (engine needs + the **existing tool inventory — reuse, don't rebuild**), §7
   (per‑sheet geometry asserts), **§8 (the gate protocol + the verbatim GATE PROMPT)**,
   §9 (ground rules).
3. **`reforged/MODEL-CREATION.md`** and **`reforged/CREATURES.md`** — the procedural
   modelling + creature‑framework references (recipe/registry, surface‑shader patches).
4. If any target is or becomes a **boss**, read **`reforged/BOSS-DESIGN.md`** first.

The live game is in `reforged/`. 100% procedural (no asset files), vanilla Three.js
r160, no build step, must hold 60fps on weak mobile.

---

## 2. CRITICAL differences from the starter rebuild (read twice)

The §8 protocol and §4 arc are written for the **3‑form SSR starters** (azure/ember/
jade, cap at Radiant/tier 2). These three targets are **premium**, so:

1. **FOUR reachable forms, not three.** Hatchling → Kindled → Radiant → **Eternal**
   (tier 3). `maxTierFor('pearl'|'obsidian'|'solar') === 3`. Every "per reachable
   form" instruction (captures, form‑ladder montage, silhouette triptych→**quadtych**,
   phantom‑form rule) extends to **0–3**. A fifth tile is the phantom form, not a
   fourth.
2. **The law‑12 rarity CEILING is lifted.** Starters are forbidden glow‑seams, wing
   veins, halos, premium bloom. **SSR/SSSR dragons EARN these** — that is the rarity
   ladder. So "restraint" is no longer the read: Obsidian's Night‑Surge plasma,
   Pearl's dawn halo, Solar's radiant crown are *on‑brief*. Judge premium drama, not
   starter restraint. Re‑read law 12 with this inversion in mind and treat the §5d
   starter sheets as tone references, not caps.
3. **No §5d build sheet exists for these keys yet.** You will likely need to AUTHOR a
   build sheet section (mirror the §5d azure/ember/jade format) and a registry §5 row
   for anti‑collision, and add a per‑dragon SPEC to `reforged/tests/starters.mjs`
   (adapted for 4 forms) so the geometry guardrails cover them. Record these as part
   of the slot.
4. **These already ship with real designs** (not placeholders). "Redesign" = a
   directed elevation or an **art‑direction pivot** (see §8). Coexist → prove on the
   apex → migrate; **never break the shipped version mid‑flight** (the roster stays
   green every commit).

---

## 3. Operating rules (the prompt you inherit)

- **Branch discipline.** One feature branch per dragon (e.g. `claude/pearl-redesign-<suffix>`).
  Cut from the latest default branch. Keep `key` / display `name` / `rarity` / `cost` /
  `stats` / `fx.auraColor` **untouched**. `forms[]` stays accretive (cumulative merge
  in `ascension.js`) and keeps its length (4). Never push to a branch you weren't asked to.
- **Git.** Every command in the **foreground**. **No** `git stash` / `git checkout --` /
  `git reset`. Commit small, push often. `git push -u origin <branch>`; on network
  failure retry ×4 with exponential backoff (2s/4s/8s/16s). After pushing, open a
  **draft PR** if none exists (mirror any repo PR template). If a PR was already merged,
  restart the branch from the latest default branch — never stack new work on merged history.
- **Do not put the model identifier in commits, PR text, code, or comments.** End
  commits with the `Co-Authored-By:` + `Claude-Session:` footer the harness gives you.
- **Extend, never rebuild.** New part builders **self‑register** (`registerTorso` /
  `registerWings` / `registerHead` / `registerTail`, or `registerSurfaceLayer` /
  surface‑shader patches). Shipped builders and other dragons' geometry are **read‑only**.
  A new builder must be default‑off so the rest of the roster stays byte‑identical.
- **Never break the roster.** Run the FULL gates, not just your key:
  `node tests/blueprint.mjs`, `node tools/tricount.mjs --ci`, `node tests/starters.mjs`,
  `node tests/flapcheck.mjs` — all green before every push.
- **You never judge your own visual output.** Only the Fable gate verdict counts.
  **Append a `LEAPFROG.md` lesson after every meaningful change.**
- **If this doc or DRAGON-DESIGN conflicts with the code** (stale line ref, missing
  seam, impossible instruction), STOP that step and report the conflict — never
  improvise schema changes.
- **Verify before claiming.** "Done" means the headless suites are green AND (where a
  runtime behavior is involved) you exercised it. The human judges motion/feel on the
  live PR preview — that is the merge oracle, not you.

---

## 4. The architecture you build in

- **Recipe/registry.** A dragon declares `parts: { torso, wings, head, tail }` (plus
  optional `surface.shader`, `shingle`, `surfaceLayers`). Each builder self‑registers by
  name; `dragonModel.js` orchestrates torso → head → wings → tail and threads the
  **attach contract** the torso publishes: `attach.wingRoot(side)`, `attach.headBase`,
  `attach.tailAnchor`, `attach.halfWidthAt(z)`, `attach.riderSocket`. Swap a skeleton by
  changing one string.
- **Form accretion.** `ascendedDef` merges `forms[0..tier]` cumulatively onto
  `d.model` (model knobs) and `d` (colors). **Per‑form dials inherit forward** unless
  re‑declared — set each form's dials explicitly or a leaked value from form N shows at
  form N+1.
- **Materials.** `bodyMat`/`wingMat`/`eyeMat`/`scalesMat`/`bellyMat` are created in the
  orchestrator and are **def‑overridable** (emissive tints etc.). Surface detail composes
  via `dragonSurfaceShader.js` patches (`fresnelRimPatch`, `cellularScales`,
  `iridescence`, `membraneSSS`, …) through ONE `onBeforeCompile`. **Gotcha:** a patch's
  uniforms are wrapped fresh per compile, so an externally‑ticked uniform (animation)
  can't reach a composeSurface patch — own the `onBeforeCompile` and share the uniform
  object (the `attachBodyDeform` pattern), **or** animate on the CPU (see L175).
- **Reference builders worth reading before you start** (proven, recent):
  `dragonKoiSerpent.js` (a smooth swept‑tube body flexed by a CPU travelling wave),
  `dragonUnifiedHull.js` (Obsidian's current one‑skin hull), `dragonSeraphBody.js` /
  the seraph wings + crown head (Pearl's current plan), `dragonFaceted.js` (Solar's
  faceted/iridescent surfaces).

---

## 5. The Fable aesthetics gate (the loop you run)

Full protocol + the **verbatim GATE PROMPT** are in **DRAGON-DESIGN §8** — read it there
and use it as written (it tells the gate to re‑read the docs itself and trust nothing
else). The shape:

0. **CALIBRATION (once per dragon, before round 1).** Run the identical capture set +
   the verbatim gate prompt on the **shipped** version of the key. Expected verdict:
   FAIL citing failure classes. If the gate PASSES the shipped dragon, the pipeline is
   broken — fix captures/gate before building. The calibration is the gate's credibility.
1. **Suites green first** (blueprint / tricount --ci / starters / flapcheck).
2. **Studio captures** — `node tools/dragonstudio.mjs <key>`: per **reachable form
   (0–3)**, named states glide/fold/bank + turntable face, fixed angles (rear chase,
   side, rear‑¾, top planform), **deterministic** phase (fixed seed → round K vs K+1
   pixel‑comparable), three backdrops (near‑dark `0x14121a`, pale `0xcfd6e4`, warm gold
   `0xd9a24a`). Reuse the existing tools (`silhouette.mjs` incl. `top`/`threeq` views &
   `--pose`/`--no-wings`, `headshot.mjs`, `tiershots.mjs`, `flapstrip.mjs`,
   `nfview.mjs`) — **do not rebuild them**.
3. **Spawn a FRESH gate agent (model `fable`) per round** with the verbatim prompt +
   capture paths + tri counts (+ prior directives for rounds ≥2). **You never judge your
   own output.** Quote the verdict verbatim. FAIL → apply the numbered directives
   exactly → re‑capture as round K+1 → fresh gate. After ~4 churn rounds, consolidate all
   directives into one frozen numbered work order before continuing.
   **PASS bar: no scored axis ≤ 2 AND average ≥ 4.0.** (Axes: silhouette appeal, line of
   action, taper/shape contrast, wing majesty, wing‑surface detail, hierarchy,
   color/rim beauty, life.)
4. **In‑game captures** — the three named frames (chase idle, mid‑bank, tier‑up reveal)
   for INTEGRATION only (readability vs biome skies, presence at distance). Never hand a
   tier montage with a phantom tile to the gate; montages come from the clamped studio tool.
5. **Human judges motion/feel on the PR preview.** Merge verdict is human.

**Checkpoints** (adapt to 4 forms): **CP1** = apex (Eternal) form body+wings first
built. **CP2** = all four forms + the ascension ladder + true‑scale form montage + face
crop per form + black‑fill **quadtych** + a distinctness frame vs roster neighbors.
**CP3** = (if doing all three) the premium‑trio verdict. **STOP for the user's go after
each checkpoint PASS.**

**Failure‑class vocabulary the gate uses:** MITTEN · BACKPACK WINGS · SAUSAGE ·
SUNBURST · SAWTOOTH · FLAT STICKER · TANGENT · GOOGLY · SAME‑DRAGON‑BIGGER · MOTIF
DRIFT · TOY‑COLOR · DEAD SYMMETRY · STRAIGHT SPINE · PHANTOM FORM.

---

## 6. Hard‑won lessons to start from (JADE rebuild, L166–L176)

Read the full entries in `LEAPFROG.md`. The load‑bearing ones:

- **The gate is BLIND to motion.** There is no WebGL in CI, so Fable only ever judges
  still turntables. A dragon can score 4.25 frozen and be dead‑stiff in flight. **Motion
  is the human's call.** Prefer a motion mechanism you can exercise headless (CPU vertex
  animation, a testable transform) over one you can't (a GPU shader uniform never
  compiles in CI — you'd ship blind). Verify motion with a node test when you can.
- **Flat gate score across 3–4 rounds re‑citing the same read ⇒ ARCHITECTURAL defect,
  not a tuning miss.** Stop turning dials; rebuild the offending part. (Jade's stiff
  loft → segmented → **smooth swept tube + wave** was the fix that finally moved.)
- **Stacked/overlapping spheres read as a bead‑chain "worm."** For a smooth serpent/eel,
  loft ONE continuous tube and bend it; don't segment the skin.
- **Fold the tail into the body** where possible (continuous by construction) instead of
  bolting a separate tail mesh — kills the "disjointed tail" seam.
- **Off‑palette emissive is a silent killer.** Shared materials (scutes, whiskers,
  ridges, eyes) default to a cyan/steel emissive; on a warm or off‑cyan dragon that
  glows wrong. Tint every emissive to the dragon's own accent.
- **Frame‑pin invariance.** Anchor a lengthening body at a fixed point (e.g. the
  shoulder) so head/wing/motif anchors don't drift across the growth arc (the §7
  motif‑drift assert).
- **Animating fanned/raked parts:** bias the animation to ADD to the rest spread (open),
  never oscillate symmetrically about it — symmetric oscillation collapses the fan on the
  closing half. Stagger by phase‑lag to keep parts individually legible.
- **Reuse a liked thing** when the human points at it (a head, a wing) instead of a
  bespoke rebuild — but confirm the graft reads before committing to it.

---

## 7. Toolchain quick reference

```
# headless guardrails (all must stay green, whole roster)
node tests/blueprint.mjs
node tools/tricount.mjs --ci
node tests/starters.mjs           # add/adapt a SPEC for the target key (4 forms)
node tests/flapcheck.mjs

# capture / studio (reuse — do not rebuild)
node tools/dragonstudio.mjs <key>
node tools/silhouette.mjs <key> <rear|side|front|climb|top|threeq> [form] [--pose=…] [--no-wings]
node tools/headshot.mjs <key> [tier]
node tools/tiershots.mjs
node tools/flapstrip.mjs <key> [tier]
node tools/nfview.mjs <key> [tier]
```

Headless three.js is resolved via `tools/three-resolver.mjs` + a DOM shim (see the top
of `tests/starters.mjs`) — use that harness for any custom probe. **Note:** the sandbox
usually cannot reach the GitHub Pages preview host directly; trust the Actions "PR
Preview" + "Deploy Pages" green as build proof and let the human load the URL. If an
API‑opened PR's preview 404s, a push to the branch (or a manual publish to `gh-pages` +
a `deploy-pages.yml` `workflow_dispatch`) triggers the build (see L171).

---

## 8. Human art‑direction override protocol

The human may hand you a **one‑line art direction with the same authority as the code**
(as with jade's "ICONIC GREEN" pivot). When they do:
- Treat it as a design constraint that OVERRIDES the shipped palette/read, inside the
  aesthetic laws (respect the law set; for premium dragons law 12's ceiling is lifted).
- **Record it in `DRAGON-DESIGN.md`** as human art‑direction (mirror how §5d records
  the approved hexes/direction), so the gate judges against the new intent.
- When in doubt between "tasteful/safe" and the human's stated direction, choose the
  direction — and let the gate judge it in pixels.

If no art direction is given, propose one per dragon (one line: silhouette read +
palette anchor+accent + the ONE hero feature) and get a "go" before building.

---

## 9. Kickoff sequence (first session)

1. Read `LEAPFROG.md`, then DRAGON-DESIGN §1–§9. Confirm the three keys' current
   `parts`/`forms`/rarity in `dragons.js`.
2. Ask the human: **which dragon first**, and **is there an art direction** for it (or
   propose one).
3. For the chosen key: cut the branch, run the four headless suites (baseline green),
   then run the **calibration gate** on the shipped version and record the FAIL.
4. Author (or extend) the build sheet + registry row + a 4‑form `starters.mjs` SPEC.
5. Build the **apex (Eternal) body+wings first** (coexist with the shipped builder,
   default‑off). Capture → fresh Fable gate → apply directives → repeat to **CP1 PASS**.
6. STOP, show the human the PR preview, get the go, then CP2 (all four forms + ladder).
7. Append a LEAPFROG lesson at every meaningful step. Keep the roster green every commit.

> Golden rule, restated: **aesthetics first, motion is the human's, extend never break,
> the gate judges — not you.**
