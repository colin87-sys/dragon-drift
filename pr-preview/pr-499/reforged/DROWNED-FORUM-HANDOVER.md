# DROWNED FORUM — HANDOVER (from the art director, end of the PR-6 session, 2026-07-18)

You are inheriting a biome that is **~80% shipped and reading well**. The composition skeleton is done, the register law is established, and both PR-6 landmarks are merged. What's left is the crown piece, the low seasoning props, and the audit. This document is the current truth — where the build sheet (`reforged/DROWNED-FORUM-BUILD-SHEET.md`) and this handover disagree, **this handover and the dated lessons win** (§9 lists the specific drift).

---

## 0. Your first ten minutes

1. **Restart from fresh master.** The designated branch's PR (#508, PR-6) is MERGED. Do not stack on merged history — `git checkout master && git pull`, then branch new. (Committer must be `Claude <noreply@anthropic.com>` or GitHub marks it Unverified.)
2. Read, in this order: `LEAPFROG.md` → the five **2026-07-18 `graphics-forum-*` lessons** (basilica-flatness-cure, two-shelf-repoussoir, variety-octave-mirror, pharos-shear-lean-punctuation, colossus-value-war-hud-pareidolia) → build sheet §§6–11. The 07-17 forum lessons (PR-1..PR-5) are background; the 07-18 five are the laws you'll use *this week*.
3. Run the gates green before touching anything, so you know your baseline is clean (commands in §8).
4. Everything runs from `/home/user/dragon-drift/reforged`; bash cwd resets every call, so prefix `cd /home/user/dragon-drift/reforged && …`.

---

## 1. Where the biome stands

**Merged to master, all Fable-gated 4.2+:**

| Piece | What it is | Gate |
|---|---|---|
| PR-1..5 | Atmosphere substrate, `triumphgate` hero + hazard reskin, `viamarina` (+`viamarinaM` mirror) + `drumfall`, `aqueduct` + `pinisle`, `pantheon` retint | 4.3–4.5 |
| PR-WALLS | `basilica` — the continuous tall SOLID ruined civic wall (the Forum's "ice shelf" mid-ground register), the **two-shelf Lorrain corridor** (dark basilica repoussoir one flank / sky-bright pierced aqueduct arcade the other), density thin of drumfall/pinisle to ~0.05 floors, size-octave + mirrored rail variant | 4.2–4.4 |
| PR-6 (#508) | `pharos` — the leaning lighthouse, breath-gated, real skewX shear-lean, fire-chamber ember (3.4→**4.3**). `colossus` — drowned bronze hand, arcade flank \|x\|46–58, under the cornice; ships `verdigrisBronze` (2.9→3.1→4.15→**PASS**) | 4.3 / 4.3 |

**What it looks like now:** a warm terracotta-and-gold drowned corridor. One flank a dark solid civic wall, the other a pierced arcade with sunset burning through the bays; the near rail is a human-scale colonnaded street whose collapse direction alternates; near-black stone pines punctuate; the pantheon dome and triumphal arches carry the mid beat; and in the open-mirror breaths between wall congregations, **one** leaning lighthouse rises above everything with a single warm ember in its crown. The bronze hand breaks the water in the arcade's shadow. Owner complaints closed to date: "weird stone things," "cluttered / needs big framing pieces," "cardboard cutout wall," "repeating trees/steps."

**THE REGISTER LAW now governs the skyline and you must not break it:** the pharos is the ONE vertical note above the wall cornice (world top 52–62 vs walls 28–40). *Everything else earns its presence with mass and strangeness UNDER the cornice.* A second tall thing = the skyline goes noise.

---

## 2. THE CALL: **skip the portico. Go straight to the arena.**

The portico was on sameness probation and I'm ruling on it now: **cut it.** Three reasons, and they're structural, not taste:

1. **The biome already owns the beat.** The portico is a horizontal-cornice mass — we have three (basilica, aqueduct, pantheon). Worse, the **pantheon already carries a broken hexastyle portico stub with a snapped pediment at its foot** — a full-size portico is that exact note replayed louder. It cannot pass the "one-city, no-clone" bar we just spent a whole PR (variety-octave) enforcing.
2. **Its only escape hatch is expensive.** To be distinct it would need a genuinely new silhouette logic + a real porch-shadow depth cavity — that's a full two-stage build for a mid-hero the composition doesn't ask for. The corridor doesn't have a hole where a temple front should be; I looked.
3. **The arena wants the budget.** The arena is the crown, it's the *only curved silhouette in the entire skyline* (everything shipped is straight lines and level cornices — a broken elliptical arc is automatic variety), and the build sheet always intended it to land with the most practiced hand. That hand is yours now — every technique it needs was proven this week (§3).

**Execute the skip properly:** the standing workflow requires a pre-assess before any direction change, so your first Fable spawn is a PRE-ASSESS of "skip portico, fold budget into arena, arena placement plan" — attach this reasoning and the current flythrough montage. I expect it to concur in one round. If it somehow finds a compositional hole only a portico fills, the fallback is the **`nymphaeum`** (apse half-dome ringed with pale statues — a *curved* silhouette with a figure vocabulary nothing else has), never the portico. Then log the skip decision as a lesson file.

---

## 3. PR-7: the `arena` (your main event)

Spec from build sheet §3 row 12: super-rare crown landmark, `|x|≥45`, step 211 — a **curved wall of stacked round arches in equal rows capped by a BLANK attic band**, surviving as a **broken quarter-arc**, top corner sheared, tiers stepping down, **flooded gold interior** (that's water + fog doing the gold — ladder bake, **no gilt, no glow**). Implied ellipse 1.2:1. ~4m spans on ~2.7m piers. Don't model order changes between tiers — invisible at cruise. **Bias a colossus spawn nearby** — the hand before the amphitheater is the money shot.

**Design constraints I'm handing you (decided, not open):**
- **Register:** the arena is MASS, not height. Rim tops out in the wall-crown band (≤ ~40 world), never competing with the pharos. Its claim to the eye is the curve and the gold water inside the bowl, not altitude.
- **Placement:** it's the crown landmark, so it must not collide with the pharos's territory. The pharos owns the breaths (`breathGate`); the arena should read against/among the congregation walls — pre-assess the exact mechanism (congregation-flank like the colossus, at super-rare duty hash, is my starting recommendation). Keep HOLLOWGATE's central third clear.
- **Build only the surviving quarter-arc.** A full ellipse is a tri bankruptcy; the ruin IS the budget plan. The calm-water reflection can do compositional completion work like the triumphgate's arches do.

**Every trap this prop will hit was solved this week — apply them from turn one:**
- **The jamb-depth × r trap** (two-shelf lesson): object-space z-offsets scale by `r`, and the arena's `r` will be large. The aqueduct's "thin" ±0.05 jambs became 9–12 world-units deep and **welded every bay shut** — no sky through, two failed gates, and no bake can open a geometrically closed hole. Compute the world jamb depth *before* building; ~±0.02-object was the aqueduct's cure.
- **The `(r,h,r)` flatten law:** `h/r` will be well under 1 on a wide arc — object-space piers must be ~2× the height you want them to read.
- **The aperture sign-flip** is your friend: `bakeForumDark` on the wall, and the open arches read as bright sky/gold against a dark frame (ΔL≥+0.22, measured with `_lumprobe`). Bays facing the flooded interior read *gold water* through dark stone — that's the hush.
- **Y-keyed bake scale trap** (basilica lesson): `bakeReveal` and the tide ladder are authored for specific object-Y bands. The arena's own object-space scale will differ — pass the real band (`revealHi`-style parametrization exists now), or every opening quarantines to flat black stickers.
- **Silhouette-edge thickness, no back face:** the broken arc-ends must show their SECTION (the basilica end-cap/shear-return kit) or the owner will fly up and call it a cardboard cutout again. The sheared top corner is a free place to show masonry section. Deepen existing geometry before spending tris.
- **`FrontSide` winding:** any single-sided bay planes must face the lane after the pinned rotY — verify IN-CONTEXT, the studio can't show a culled face.
- **Write `tools/_arena.mjs` first**, cloned from `_colossus.mjs`/`_pharos.mjs`: a curved super-rare prop will defeat `_forumclose`'s auto-framer, and the tool must **hide `#hud`** before any geometry-judgement frame (§7). Budget 2–3 in-game frames per run (~100s) — full-game screenshots are ~30–40s each.

---

## 4. The rest of the order (after the arena)

1. **PR-END — `forumfield` + `roofline`**, CONSERVATIVE density. These land LAST *by design*: the mosaic-decal read-through and the sunken gable only read as "a drowned plaza" when tuned into the finished wall composition — dropped in earlier they'd be scatter, and we killed scatter twice already. The mosaic decal rides the foam-mesh system (plumbing from PR-1); grid spacing = civic (grid means forum; random means dock pilings). `roofline` is also the deliberate scale anchor (kill-list #8). Hold the variety-octave guardrail: **randomize the ruin, never the architecture.** Finish with the final rhythm pass across all bands, gated on the whole flythrough.
2. **PR-8 — the purge + closing audit** (build sheet §12, it's concrete and checkable): whitelist assertions, the jungle-hex/identifier grep, the runtime band-dump, the blind-caption screenshot test, the per-part builder's-job test, the one-city montage, the three staged money shots (Processional / Aqueduct Crossing / **Amphitheater Hush**). Park v3 behind `?props=v3`; **delete retired kit only after owner sign-off.** The audit is a PR, not a vibe.
3. `nymphaeum` remains a stretch — only if the owner asks for one more beat after the arena, and only because its curve+figures vocabulary is genuinely new.

---

## 5. If you want a quick win first: the polish sweep

All of this is parked, NON-GATING, Fable-ranked. It batches into one small render-only PR and would take a fraction of a landmark's effort:

**Pharos** (in ranked order):
1. **Fog-exempt/emissive-boost the crown ember past ~150m** — highest value on the whole list; turns "a pale pixel" into "the one distant light," which is the entire point of the prop.
2. Ember core→bloom value structure.
3. Twin-variety hash on the broken-pier index (two instances broke the same corner in one frame).
4. Break the base-tier mosaic arc's symmetry (it pareidolias into a smile at studio range).

**Colossus:**
5. Deepen the forearm-hollow read (cavity floor reads shallow at range).
6. +0.03 luma on the palm front.
7. Crown or value-break the planar teal finger up-faces (flat-tape watch).
8. Place the withheld gilt as a deep-crevice glint **off the palm face** (anything bright on the open palm reads as a mouth at play angle — that's why it was withheld).

Also parked from the walls work, lower priority: warm bounce in the near-wall shadow faces, warm-shift the gate's cyan bracket UI, warm rim on the hazard diamond, and the whole-biome fragment-shader weathering initiative (explicitly ruled non-gating; don't burn tris chasing per-vertex sub-quad detail — it's mathematically impossible, see the two-shelf lesson).

Even a polish sweep follows the full workflow — pre-assess, build, harsh gate.

---

## 6. The standing workflow (owner's words: "dont deviate")

For EVERY prop/PR/direction change:
1. **Fable PRE-ASSESS** the concept/direction *before building* (spawn via Agent tool, `model: "fable"`, general-purpose; give the identity brief + palette + the ONE Roman tell + the kill-list §11 + capture PNGs by absolute path; ask for /5, biggest failure, ONE highest-leverage fix). The two-shelf lesson proved this pays: one direction audit caught the welded-bays blocker and saved ~2 gate rounds — *"you're tuning the paint on a door that is welded shut."*
2. Do the grunt work.
3. **Fable as HARSH CRITIC, bar 4.2/5**, two-stage where relevant: Stage-1 studio FORM sheet, Stage-2 in-context over the water. Convergence protocol: one revise round per note; a needed 3rd attempt means CHANGE TECHNIQUE, not tune harder.
4. Composition changes gate on the **whole-biome flythrough** (Recipe B, `_forumscene.mjs`/`_forumfly.mjs`), not one prop.
5. **The owner outranks every score.** Surface money shots on the live PR preview; if they don't gasp, it isn't done.

And THE RULE: after every meaningful change, a **NEW lesson file** `leapfrog/lessons/2026-MM-DD-graphics-forum-<slug>.md`. Never append to `LEAPFROG.md`, never a sequential number — one file per lesson is what keeps parallel chats from colliding.

---

## 7. Laws & traps — do not relearn these the hard way

**Engine / determinism (sacred):**
- `gold-determinism` must stay **byte-identical**. Append new archetypes at the **END of `ARCHETYPES`**, never reorder bands, all composition gates pure/render-only (no `rnd()` in gates). Returning `rotY` from `place()` legitimately skips the init `rnd()` — that only shifts your own new prop's stream, which is fine.
- ≤150 tris/prop (`envcount` enforces; we've been shipping at 145–150 — stay stingy, deepen existing geometry before adding quads), ≤2 material groups, a `FOAM_CFG` entry, 60fps weak-mobile PORTRAIT.
- **Size-scale never moves position:** composition `k` scales geometry only, never `d.x` — a size knob cannot "promote to a nearer register"; that needs a `place()`-level variant.
- **Mirror variants are geometry-level** (negate z-*positions* in a parameterized build, new archetype at the END), never a negative instance scale — negative scale flips winding and inverts lighting.

**Geometry reads:**
- **THE LEAN LAW:** step-offsets tilt the centroid but leave every edge plumb (a Minecraft staircase); only `skewX` shear tilts edges into a coherent diagonal. Shear is affine → survives the `(r,h,r)` scale; rx/rz rotations do NOT.
- **The tell migrates:** fix the flattest element and the eye drops to the next-flattest (basilica: skyline→windows). Re-gate until nothing re-asserts the single-sheet read.
- Lane: fatal half-width 13, gate veil ±16; couple `place()` x to the measured ρ from `propclearance`.

**Materials / bakes:**
- **Procedural metal has NO env map → real metalness renders black.** Light metal as an emissive-floored near-dielectric: metalness ~0.05, roughness ~0.55, bright emissive floor (`verdigrisBronze` is the shipped reference).
- **Exposure keys are smooth normal LERPs, never hard keys** — a hard key quarantines whole parts to one albedo. Curvature detail (raised-edge gilt, crevice-dark) must be GEOMETRIC part tags; per-vertex bakes know nothing about curvature.
- Y-keyed bakes silently mis-fire across object-space scale jumps — pass the archetype's real band.
- Gate dark-face values on a NEAR capture; at distance additive fog inscatter dominates and darkening albedo does nothing (that far lift is aerial perspective working, not a bug).
- Withheld-glow law: gilt recessed only, ≤4 of 13 archetypes carry any.

**Capture:**
- **The HUD-arc pareidolia trap:** a centred hero capture collects screen-space HUD elements (the gauntlet stamina-arc) as false surface features. Hide `#hud` before any geometry-judgement shot. Verify "is this geometry?" with an **A/B under the identical camera**, not an assertion — and note a dim semi-transparent overlay will slip a pixel-probe threshold; the A/B is the evidence.
- Auto-framers (`_forumclose`/`_forumfar`) mis-frame tall/rare/curved props — write a dedicated tool (`_pharos.mjs`, `_colossus.mjs` are your templates). Ignore the end-on "fin orbit" — it's not a play angle; judge the broadside + the portrait flythrough.
- A statistical variant's proof frame can land on the failure case — capture with ALL variants kept (`HERO=viamarina,viamarinaM`), never claim from one frame.
- Keep viewports ≤ ~1280×820 @ DSR 1.3; a huge canvas stalls headless GPU read-back.

**Kill-list (§11 of the build sheet)** stays enforced from turn one: croquet-hoop arches, fence-post columns, Caesars-Palace white, jade hangover, LED/moss-gem/flat-tape, flat-cut waterlines (bradyseism: every waterline crosses at an angle), scale betrayal, glacier déjà vu.

---

## 8. How to verify (every PR, all green)

```bash
cd /home/user/dragon-drift/reforged
node tests/gold-determinism.mjs   # byte-identical — the sacred gate
node tests/biomecycle.mjs         # expect 12/0
node tools/envcount.mjs           # tris ≤150, FOAM_CFG, ρ + world-top per prop
node tools/propclearance.mjs
node tools/tricount.mjs
node tests/bulletcontrast.mjs     # after ANY palette-adjacent change
```

Capture kit (all in `reforged/tools/`, Playwright is global, Chromium pre-installed — never `playwright install`): `_forumclose.mjs` / `_forumfar.mjs` (per-prop in-context), `_forumscene.mjs` / `_forumfly.mjs` (flythrough composition), `_pharos.mjs` / `_colossus.mjs` (dedicated landmark framers — clone for the arena), `_lumprobe.mjs` (pure-node PNG luminance sampler — run the numeric pre-gate *before* spending a critic round), `_arcprobe.mjs` (saturated-teal pixel probe), `_montage.mjs`. Boot recipes and the state-forcing/`__pin` health snippet are in build sheet §9 — use them verbatim.

---

## 9. Build-sheet drift (corrections on record)

- §5's PR-6 row says "colossus + portico + pharos" — pharos and colossus are DONE; portico is **cut** per §2 above (pending your confirming pre-assess).
- §5/PR-1 claims `verdigrisBronze` landed in the material kit early — it did **not**; the colossus shipped it (debt logged in the pharos lesson, now paid). Trust grep over the sheet.
- The REORDER block in §5 is live law: `forumfield`/`roofline` are PR-END, not PR-5.

You're inheriting a biome one prop away from its money shot. Pre-assess the skip, build the arena with the practiced hand this week's lessons gave you, land it in one revise round, and make the owner gasp at the Amphitheater Hush. — F.
