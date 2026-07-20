# BUILD BRIEF — BOSS 14: THE UNMASKED — the APEX / FINALE (the screenshot of the game)

**Standalone handoff.** Open a fresh Claude Code session in the `dragon-drift` repo, paste this
file, work it top to bottom. It merges a strong pre-written build prompt with the 2026-07
boss-design audit; **where they differ, the audit wins** (flagged inline). This is the **largest,
most complex boss in the game** — 3 stages, ~20 tracking eyes, the roster medley. **Pace it: build
one stage to its gate, STOP, get owner sign-off, then the next.**

**THE UNMASKED is the second sun that was always in your sky, cracking open into a
biblically-accurate angel** — wheels-within-wheels of tracking eyes, six scythe-wings, wearing
every boss's scar as a relic. It has been present on ordinary runs for the whole back half of the
game; the finale is flying INTO its sky. **It is the summit** — the audit rated it the game's most
awe-inspiring moment (entrance 5/5, mid-fight 5/5; the stage-2 crack where every eye snaps to you
at once is "the screenshot of the game"). Its ONLY real risks are execution: the stage-2 read, and
spending the budget. **Both are solved below — §2.7 is the budget plan you asked for, and it's the
heart of this brief.**

---

## PART 0 — ORIENTATION

1. **Read `LEAPFROG.md`'s THE RULE** + the §9 boss lessons, esp. **L124/L126** (draws are ~free —
   ~20 eyes is fine; **overdraw is the only cliff**), **L140/L141** (presence/scale), **L150**
   (silhouette translation — you have THREE stages to translate).
2. **Read `reforged/BOSS-DESIGN.md`**: §3b silhouette translation (THREE per-stage sheets), §4b
   charisma law, §5b registry row 14 + the lore web, §5c APEX contract ("it owns the game" —
   persistent presence, multi-stage, quotes every pattern era, answers the lore web, post-defeat
   mascot echo), §5d slot-14 sheet + ENTRANCE, §5f (its dread exam + destructible relics +
   verb-shift climax + the rule-breaks), §5g budgets (**tier 5 — the summit**), §5h (esp. the
   second-sun seeding note), §5i (rhythm MEDLEY / graze MEDLEY / parry STAR PIPS), §5j entrance
   *Don't Move* + uniqueness rulings, §6 recipe, §7b bossgate (you need sanctioned overrides) +
   §7c Studio Gate.
3. **Quality bar / reuse**: `bossMandala.js` (Stormrend — you must NOT collide with its rings, see
   the stage-2 anti-reads), `bossIdol.js` (Voidmaw — it RESERVED the corona glow-shape for you),
   `bossAshtalon.js` (the scythe-wing kernel you double-scale for six wings), the shipped eye rigs
   (the proven eye assembly ×~20). Read `reforged/js/environment.js` (the sky dome + fog-exempt
   pattern — the second-sun landmark is a NEW sibling system).
4. **The iron law**: coexist → never break the shipped roster; **verify before claiming**. A boss
   is DATA + one builder file; the Apex adds the most engine of any boss, all def-gated + inert.
5. **Studio-first + the Fable gate**: you NEVER self-judge. **This boss gates PER STAGE** — a
   pre-build sheet sign-off + a design gate for each of the three stages, then the CP2 integration
   gate. Fable gates; the owner owns the final call and signs off between stages.

### Build LAST (hard prerequisite) — and the STORMREND note
**Build 14 only after slots 1–13 are shipped**, because it QUOTES their cards/rhythms/graze forms
(THE MEDLEY reads the SHIPPED vocabulary and thins to fairness caps — zero new attack ids).
**⚠ Sequencing (answers a live owner concern):** if any quoted boss is going to be **rebalanced**
(e.g. STORMREND, slot 2 — flagged for "too many moves"; note EMBERTIDE slot 13 ALSO quotes
Stormrend's CRESCENDO rhythm), **do that rebalance BEFORE building 14** so the medley quotes the
final version. The medley references cards by **STABLE card ID** (the §5h schema: "id — stable,
never the display name"), so a rebalance that RETUNES a card (dials, fewer simultaneous moves) does
NOT break the quote; only DELETING a quoted card id does — and the CI test (Part 5: "the medley
references only existing card ids") catches that instantly. If a quoted card is removed, 14 simply
quotes a different Stormrend card or one fewer (the medley thins to fairness caps anyway). **Net:
architecture is robust; just build 14 after the rebalances land.**

**Branch from current master.** Shared files (`bossDefs.js` `BOSS_ORDER` + def, `bossModel.js`
dispatcher, `tests/boss.mjs`, the §5b/§5d/§5i/§5j rows, `LEAPFROG.md`) are additive — append your
own; never touch another slot's.

### Engine you CONSUME (already on master)
`getBeatClock()` + phrase machine (slot 5); the ladder controller + continuous-graze detector +
adrenaline ladder (slot 6); the destructible per-part system (slot 6/8 — for the wheel-relics);
STAR-PIPS parry banking rides the shipped parry path; the `rhythmprint`/`amberdiet` gates.
Soft-consume `getBossEta()` (slot 10 — for the biome-early choir partial; degrade to a cut).

---

## PART 1 — ⛔ THREE HUMAN DECISIONS BEFORE ANY GEOMETRY

**DECISION A — Approve the THREE §3b stage sheets** (Part 2.1) + the **per-stage** pre-build Fable
sign-off (spawn #1 per stage). **Stage 2 (the Ophanim) is the hero gate** — its stranger test is
the whole ballgame: *"does this read as an angel of wheels-and-eyes — NOT Stormrend's rings, NOT a
gear/UFO/mandala?"* Do not pass a stage-2 that reads as Stormrend or a machine.

**DECISION B — Approve the §4b PER-STAGE charisma map + glyph** (Part 2.2). **This is the audit's
BLOCKER for slot 14** — EXPRESSION (≥3) and FLINCH were named for no stage; stage-1 BLINK/CHARGE/
DEATH were unstated. The lid/pupil (stage 1), the wheels + ~20 eyes (stage 2), the core (stage 3)
carry it. I've drafted all seven per stage; the human confirms.

**DECISION C — ⛔ THE SECOND-SUN SEEDING SCHEDULE (the one real owner call) + gate overrides.** The
second sun must be "always there" on ordinary runs from mid-game — a NEW `environment.js` landmark
system. **The audit (ED-6) flagged its delivery as unresolved:** §5h slates seeding "at the first
Calamity kill" / "with slot 10," but under the lifetime ladder, **live saves will ALREADY have
killed Calamities before this code exists — so the trigger never re-fires for them.** The owner
decides: (a) does the seeding land here (with 14) or earlier (slot 10)? and (b) it MUST seed
**on-LOAD** for any save past the mid-game threshold, not only on the kill event, or existing
players never see the "always there" payoff. Also sign off the §7b gate overrides (raise G1's
bright-cluster cap for ~20 eyes; exempt G4 frame-filling — cite the registry sanction) and the
palette (dark gold `0x181206` / gold rails / white eyes+corona — far from role colors; the relic
glints in owed palettes are the sanctioned exception, kept dim except when quoted).

---

## PART 2 — THE DESIGN ARTIFACTS (paste into BOSS-DESIGN.md as part of the build PR)

### 2.1 — §3b SILHOUETTE TRANSLATION — THREE STAGE SHEETS (all three in the §5d entry)

> **STAGE 1 — the second sun:**
> - *Reads as:* a second sun hung in your sky — a black disc ringed by a white corona, one heavy lid.
> - *Cues:* the black DISC; the white CORONA ring (the reserved glow-shape); the heavy LID (opens → it's an EYE).
> - *Anti-reads:* NOT a normal sun/moon (black disc + corona + lid = an eclipse-eye); NOT Voidmaw (slot 1 reserved the corona FOR you — stage 1 is a CLEAN cosmic disc, not a shattered mask); NOT a UFO/portal.
> - *Lit-edge:* white corona + the pupil (on lid-open) = focal; disc pure black. Camera-relative, fog-exempt (sky-dome pattern).
> - *Scale/backdrop:* sky-scale; it IS the sky (false-night grade + hard shadow = the stage-1 arena).
>
> **STAGE 2 — the Ophanim (THE hero stage — the one most likely to fail):**
> - *Reads as:* wheels-within-wheels of eyes — a biblically-accurate angel.
> - *Cues:* 3 concentric counter-rotating wheels gimbal-tilted on DIFFERENT axes; **~20 tracking EYES** studding the wheels; six scythe-wings; the prior bosses' relics wired to the rails.
> - *Anti-reads:* **NOT STORMREND's concentric rings** (slot 2 — flagged echo; the difference: Stormrend's rings are frontal / coplanar / flat; the Ophanim's are gimbal-tilted on 3 NON-coplanar axes, counter-rotating, **STUDDED WITH EYES + wings** — an angel of eyes, not a flat mandala); **NOT a gear/machine/UFO** (the eyes + wings make it angelic-divine, never mechanical); NOT a mandala. **The IDENTITY is "a thing covered in EYES."**
> - *Lit-edge:* the ~20 white HDR almond eyes (each tracking with its own lag) + gold rails; dark-gold body; relics glint in owed palettes.
> - *Scale:* sky-scale; the wheels overflow the frame.
>
> **STAGE 3 — the unveiling:**
> - *Reads as:* the six wings mantle fully open and a veiled core unveils.
> - *Cues:* the six wings MANTLED open (the WIDEST silhouette in the game); the veiled CORE (HDR sphere behind a petal shroud — mandala petal kernel) unveiling; the wheels PART to reveal the way IN.
> - *Anti-reads:* NOT a flower/mandala (keep the eyes/wings angel context around the opening core).
> - *Lit-edge:* the veiled core is the brightest — the surge-chase target; wings mantled.
> - *Scale:* the widest/grandest — the finale silhouette.
>
> **SCAR (§3.6):** it wears EVERY prior scar as a relic (it IS all scars — it's their MAKER); the stage-1→2 disc CRACK (the sun cracking open) is its own asymmetric reveal-scar.

### 2.2 — §4b PER-STAGE CHARISMA MAP (⛔ the BLOCKER)

> **STAGE 1 (the lid + pupil):**
> - **GAZE:** the pupil LIVE-TRACKS the player's stick (continuous stick-tracking — 14's EXCLUSIVE claim; the sky steers after you).
> - **BLINK-analog:** the aperture CONTRACTS/dilates (the lid never blinks — §5h; the "blink" is a pupil constriction).
> - **CHARGE-TELL:** the pupil CONSTRICTS + the corona brightens.
> - **EXPRESSION (≥3):** lid aperture × pupil size — heavy-lidded (dormant) / watching (open, tracking) / wrath (wide, pupil pinned).
> - **NOTICE:** the lid PEELS open + one fast SACCADE snaps the pupil dead-center (the debuted NOTICE channel).
> - (FLINCH/DEATH belong to stages 2/3 — stage 1 dissolves INTO stage 2.)
>
> **STAGE 2 (the wheels + ~20 eyes):**
> - **GAZE:** all ~20 eyes track INDEPENDENTLY with their own lag; **the signature beat = ALL eyes snap to the player at once (the screenshot of the game).**
> - **BLINK-analog:** eyes blink in a WAVE — a ripple of closings around the wheels.
> - **CHARGE-TELL:** the eyes CONVERGE on the player + a wheel spins up before a quoted volley.
> - **EXPRESSION (≥3):** wheel-speed × eye-convergence — calm (slow, eyes wandering) / alert (converging) / wrath (all locked + wheels fast).
> - **FLINCH:** a wheel STUTTERS + eyes flare + a relic rattles.
>
> **STAGE 3 (the core):**
> - **GAZE/EXPRESSION:** the eyes turn INWARD toward the opening core (or outward in final defiance); the shroud opening = revelation/vulnerability.
> - **DEATH (the death of the game — make it the most mournful/awe beat):** the wheels slow and part, the eyes ease shut ONE WHEEL AT A TIME, the six wings fold DOWN, the core dims — and it collapses into the COMPANION-SHARD ECHO (the mascot conversion, §5c/§8). The banked fourth-wall line lands here.
> - **GLYPH (doodle → chip):** the eclipse-eye — a lidded black disc with a white corona (the cleanest single read of all three stages).

### 2.3 — GEOMETRY (staged — primitives, named pivots, palette)

- **Stage 1:** fog-exempt black disc + white corona ring + one heavy lid on **`lidPivot`**, camera-relative like the sky dome; the pupil = the eye rig.
- **Stage 2:** 3 concentric wheels (torus rails + box spokes) on **`wheelGimbal0/1/2`** (gimbal-tilted, counter-rotating — **the wheels rotate on their own pivots, NOT the group**); 6–8 HDR almond eyes PER WHEEL = **the proven eye assembly ×~20**, each on its own gaze-lag pivot (`eye0..19`); six scythe-wings (Ashtalon kernel ×2) on **`wingPair0/1/2`**, unfolding pair by pair; relics wired to the rails on **`relic0..5`** (destructible). Dark-gold `0x181206` / gold rails / white eyes+corona.
- **Stage 3:** wings mantle open (re-pose `wingPair*`); the veiled CORE (HDR sphere on **`corePivot`** behind a petal shroud — mandala petal kernel, per-petal pivots `petal0..N`) unveils; the wheels PART.
- Staged builds swap via `setDissolve` between sub-rigs, driven off phase transitions.

### 2.4 — ⛔ PALETTE + GATE OVERRIDES (see Decision C)
Dark gold body, gold emissive rails, white HDR eyes + corona — clear of all role colors. The relic
glints in their owed bosses' palettes are the sanctioned exception (kept ≤0.25 dim except the beat
they're quoted). Add the §7b overrides: raise G1's bright-cluster cap (the ~20 eyes are many small
bright points, by design — G1's "≤2.5% bright cluster" assumes ONE focal), and exempt G4
(frame-filling), both cited to the registry sanction. Verify quoted-volley bullets clear
danger-magenta against the dark-gold field.

### 2.5 — THE DEF (add to `bossDefs.js`; append `'unmasked'` to `BOSS_ORDER`)
```
id: 'unmasked', name: 'THE UNMASKED', title: <the Apex epithet, in-character>,
epithet: 'What Wore the Sky as a Mask',
archetype: 'unmasked',                     // new; dispatch in bossModel.js
tier: 5,                                    // APEX — TIER_BUDGETS 5 = 30,000 tris / 120 draws
hpMax: ~600,                                // §5b Apex
gate: { eyeCluster: true, frameFill: true }, // Decision C overrides (cite the sanction)
stages: 3,                                   // the stage system (Part 2.6)
approachFrom: 'landmark',                    // the secondSun.handoff() (Part 2.6)
muzzle: <per-stage quoted origins — the wheels / relics>,
grazeForm: 'medley',                         // §5i.B — quotes the roster's graze forms (Part 2.6)
scale: <sky-scale; the wheels overflow the frame — tune per stage>,
accent: 0xf0e0a0 (gold rails) / white eyes,  glow: white corona,
bulletColor: 0xff2b6a,                       // danger magenta — the quoted volleys keep it
```
Phases = the 3 stages. **Rhythm = THE MEDLEY** (`signature: 'medley'`): quotes each felled boss's
signature per stage; author so `rhythmprint` passes. **Keep an amber carrier in every phase** (the
quoted volleys' amber — amberdiet). Cards: the medley quotes existing card IDs (zero new); the
dread (last) = **"WHAT WORE THE SKY — Every Verdict at Once"** (one card from every felled boss at
once, thinned to fairness caps). One `dread:true`, last.

### 2.6 — THE ENGINE SCOPE (the Apex — biggest load; coexist-safe, inert for others)
1. **Second-sun persistent landmark** — a NEW `environment.js` sibling to the sky dome (fog-exempt,
   camera-relative), seeded on ordinary runs per Decision C (**seed on-LOAD past the threshold**);
   `secondSun.handoff()` transitions it into the fight.
2. **The stage system** — 3 stages, dissolve swaps between sub-rigs driven off phase transitions;
   each passes its own silhouette one-liner.
3. **THE MEDLEY (pattern-era quoting)** — quote each felled boss's card/rhythm/graze per stage with
   **ZERO new attack ids** (read + replay the shipped vocabulary by STABLE id; thin to fairness caps).
4. **STAR PIPS** parry banking (perfect parries bank ≤3 stars that MULTIPLY stage-3 Surge; lost on
   a hit); **destructible wheel-relics** (reuse slot-6 parts; each removes its quoted card — the
   player edits the finale); **the verb-shift surge-chase** climax (stage 3 abandons pattern-dodge:
   the shroud opens, the fight becomes a surge-chase THROUGH the parting wheels to the core before
   it re-veils — the §5f Radiance law).
5. **The ~20-eye rig** (proven eye assembly ×~20, independent gaze lag, continuous live
   stick-tracking in the entrance).
6. **The reflect-only SEAL** — the roster's 2nd ≤2-budget seal (audit fix: it was budgeted to 14
   but never placed) — **place it at stage 2: ONE wheel's era-quote is a reflect-only seal phase**
   (parry is the only gun for that window).
7. **Everything default-OFF for existing bosses** (byte-identical legacy path).

### 2.7 — ⛔⛔ THE BUDGET PLAN — SPEND THE FULL 30k / 120 (this is the screenshot of the game)

**The mandate:** the audit's single worst under-spec was 14 speced at ~5k tris against the ~30k
Apex gate. **This boss MUST be the most geometrically rich in the game.** But "spend it" has to be
aimed — here is exactly where every triangle and draw goes, built on the measured budget reality
(L124/L126: tris ~free at 400k; draws ~free at 415; **overdraw the only cliff — ≤2 large additive
volumes incl. shield**). **Spend the budget on the EYES** — "a thing covered in eyes" is the read
AND the screenshot, and eyes are cheap on BOTH tight axes (small bright POINTS, not large shells).

| Element | Stage | ~Tris | ~Draws | Why / how |
|---|---|---|---|---|
| Black disc | 1 | 0.2k | 1 | opaque |
| Corona ring | 1→ | 0.5k | 1 | **large additive #1** — but sky-replacement (camera-relative, replaces the dome → inside the cap) |
| Heavy lid (upper+lower) | 1 | 0.8k | 2 | `lidPivot` |
| Stage-1 tracking pupil | 1 | 1k | 2 | the eye rig; shell + tracking pupil |
| **STAGE 1 subtotal** | | **~2.5k** | **~6** | grandeur here = the false-night grade + stick-tracking, NOT geometry |
| 3 wheels (rails + spokes) | 2 | 6.5k | 3 | each wheel = 1 merged rigid group (rail+spokes rotate together); rich torus segment counts |
| **~20 eyes** | 2 | **~14k** | **~40** | **THE identity + THE screenshot.** Per eye: static shell merged (1 draw) + independently-tracking pupil/catchlight (1 draw). Spend richest HERE. |
| 6 scythe-wings | 2 | 6k | 6 | Ashtalon kernel ×2; each wing = 1 group, unfolds pair-by-pair |
| 5–6 relics | 2 | 2k | ~6 | destructible; dim owed-palette glints |
| gold rails glow | 2 | — | 0 | emissive MATERIAL, not additive shells |
| **STAGE 2 subtotal (on top of 1)** | | **~28k** | **~55** | **the budget lives HERE — go all out on eyes/wheels/wings** |
| Veiled core (HDR sphere) | 3 | 1k | 1 | **large additive #2** — the surge-chase target |
| Petal shroud (opens) | 3 | 2k | ~12 | mandala petal kernel, per-petal pivots |
| **STAGE 3 add** (wings re-pose + wheels part = 0 new) | | **~3k** | **~13** | |
| **PEAK on-screen (stage 3)** | | **~31k** | **~68** | ✓ at the 30k tri gate; **well under 120 draws** |

**How to actually go bigger (the tri budget rewards this):**
- **More / richer EYES** — go to the top of the 6–8-per-wheel range; higher-segment almond eyes;
  each additional eye is ~700 tris + 2 draws and every eye is a screenshot. This is the single best
  place to spend surplus. A denser wheel of eyes = a more overwhelming "covered in eyes" read.
- **Richer wheel rails** — high torus segment counts + more spokes + relief on the rails (carved,
  not smooth — tris only pay at silhouette/edge scale).
- **Richer wings** — more blades per wing, blade relief (the Ashtalon kernel, doubled).
- **The relics as real little relics** — each a recognizable miniature of its boss's scar.

**⛔ THE OVERDRAW DISCIPLINE (the only thing that can break 60fps):**
- **Large additive volumes** = the corona (1, sky-replacement) + the veiled core (1, stage 3) + the
  kit shield (1). That's potentially 3 at once → the cliff. **Manage it:** during the stage-3
  surge-chase the shield is OFF (it's a chase, not a shielded phase); and the corona recedes as the
  wheels unfold. Target ≤2 large additive at any instant.
- **The ~20 eye-pupils are SMALL HDR POINTS, not large shells** — overdraw-cheap by design (this is
  why L126 says "~20 eyes is fine"). The gold rails are emissive material, not shells.
- **`tiershots` is a GATING item** — run it with all ~20 eyes lit + six wings + the core + a fever
  volume all active AT ONCE (the stage-3 climax frame). That is the frame that decides 60fps.

**Quality scaling (q0.5):** drop the eye count (to the 6-per-wheel floor), wheel spoke count, and
wing blade count (`tris(q0.5) < tris(q1)`) — but NEVER below "a thing covered in eyes." Orbiters
floor at 2.

**Keep the sawtooth crown:** 14 IS the summit — nothing out-grands it. But its power is ALSO the
stillness (Part 6) — spend the geometry on the wheels/eyes/wings, not on frantic motion.

### 2.8 — LORE + RULE-BREAKS (audit fixes)
- **The trophy split with KARNVOW (9):** KARNVOW is the THIEF who WORE taken trophies; **THE
  UNMASKED is the MAKER — the source the bosses came from.** The horn, feather-blade, chain link,
  thread spool, bell shard on its rails are the same relics, **returned to their source after 9
  falls** (the transfer clause — resolves the double-ownership). It ANSWERS the lore web: the thing
  always in the sky is what wore the sky.
- **The three granted §5f rule-breaks (do NOT add more):** (1) honest re-struck STAGE cards ("II —
  THE UNMASKED"); (2) a **one-frame title GLITCH where the card reads VOIDMAW** (it made the masks —
  the Voidmaw rhyme; Eternal Darkness micro-dose); (3) exactly ONE line **addressed past the dragon
  at the player**, stage 3 (the banked fourth-wall line — Mantis).
- **Post-defeat mascot echo:** on defeat it leaves a companion-shard echo (the thing that always
  watched, now yours — the §8 mascot conversion).

---

## PART 3 — DOC FIXES TO LAND IN THE SAME PR
**3.1** Registry parry-job cell (§5b row 14): `STAR PIPS (§5i.C) — perfect parries bank ≤3 stars ×
stage-3 Surge; the quoted volleys carry amber`. **3.2** §5i.B: add the APEX graze row — `THE MEDLEY
graze: quotes the roster's graze forms per stage; capstone = the stage-3 surge-chase through the
closing wheels`. **3.3** §5b Home-biome + VOICE: Home-biome = `NONE — the second sun grades ANY run
(false-night); it's the always-present landmark, not a biome tenant`; VOICE = `a single held CHOIR
partial (biome-early) → full choir at the crack; the divine drone as signature noise`. **3.4** Place
the reflect-only SEAL at stage 2 (§5f budget — was unplaced). **3.5** §5h: the second-sun seeding =
**seed-on-LOAD past the mid-game threshold** (ED-6 retrofit fix). **3.6** §5f: record all three 14
rule-breaks (re-struck cards, the VOIDMAW glitch, the addressed line) + the KARNVOW→14 relic transfer
clause in the lore web. **3.7** §7b: add slot 14's eye-cluster + frame-fill gate overrides to the
sanctioned list. **3.8** §5d: name the telegraph pivots (`lidPivot`, `wheelGimbal0-2`, `wingPair0-2`,
`corePivot`, `eye0..19`).

---

## PART 4 — THE BUILD PIPELINE (STAGED — gate EACH stage; this is the biggest build)

**For EACH stage (1 → 2 → 3), in order — do NOT batch them:**
- **CP1.0 — pre-build Fable sheet sign-off** (spawn a fresh Fable agent on THAT stage's §3b sheet +
  its stranger test). **Stage 2's is the hero test:** *"angel of wheels-and-eyes — NOT Stormrend's
  rings, NOT a gear/UFO/mandala?"* Fix the sheet until PASS.
- **Build that stage's geometry** (named pivots; every material `kit.track()`; parts on an inner
  rig; the wheels/eyes/wings rotate on their OWN pivots, never the group; merge gotchas: strip
  uv/uv2, `toNonIndexed()` reassign, bake transforms pre-merge).
- **STUDIO GATE:** `node tools/bossstudio.mjs unmasked` at that stage (home = the false-night sky for
  stage 1; sky-scale framing for 2/3) + the black-fill + lit-edge renders; `node tools/bossgate.mjs
  unmasked` with the sanctioned eye-cluster/frame-fill overrides; **run `tiershots` overdraw at
  stage 2 and stage 3** (the ~20 eyes + wings + core).
- **⛔ CP1 Fable DESIGN gate** (fresh agent per stage). **Stage 2:** *"Does this read as an ANGEL
  COVERED IN EYES — not Stormrend's flat rings, not a machine/mandala? Are the ~20 eyes the identity?
  Do the 3 wheels read as gimbal-tilted non-coplanar (not frontal/flat)?"* Do not pass a stage-2 that
  reads as Stormrend or a machine — **everything about the finale rests on this image.**
- **POST CROPS + STOP for the owner** after EACH stage. Get stage sign-off before the next.

**CP2 — INTEGRATION (after the owner green-lights all three stages):** wire the def, THE MEDLEY (the
roster quote — zero new ids), STAR PIPS, the destructible relics, the verb-shift surge-chase, the
*Don't Move* entrance (Part below), the second-sun landmark + `handoff()`, the stage dissolves, the
post-defeat mascot echo. `?debug&boss=100&bossIdx=13`, `?rush=all`. **⛔ CP2 Fable integration gate:**
*"Judge ONLY integration. Check: the second sun is genuinely present on ordinary runs before the
finale (the 'always there' payoff, seeded on-load); the entrance's continuous stick-tracking pupil
works with the FROZEN camera (the sky steers after the player); the three stages dissolve cleanly,
each reads as its own silhouette; THE MEDLEY quotes real prior-boss patterns with ZERO new ids,
thinned to fairness; STAR PIPS bank + multiply stage-3 surge; destroying a wheel-relic removes that
boss's quoted card; the verb-shift stage-3 surge-chase reads as a DIFFERENT mode (not more dodging);
the ~20 eyes each track with lag; OVERDRAW holds with all eyes + wings + fever (re-run tiershots
in-fight); bullet contrast on dark-gold; it answers the lore web (wears the scars as MAKER); the
VOIDMAW title-glitch + the addressed stage-3 line fire; the post-defeat mascot echo fires; HUD/
title/banner collisions; full loop + death. Verdict PASS/FIX per item."* Re-run all suites, STOP for
the owner's final call before the PR leaves draft.

**THE ENTRANCE — *Don't Move* (§5j, ZERO camera hijack — 1.2s dilate @0.28 only):** one biome early
a single held choir partial joins the mix (`getBossEta()`, or cut). Fight start: `secondSun.handoff()`
— the disc hangs huge above the lane; false-night grade + hard shadow = the stage-1 arena. HUD hides;
the banner strikes HONEST, from top: **I — THE UNMASKED**. Then, **chase cam FROZEN**: the lid peels
open and the pupil — an HDR white almond wider than the lane — tracks the dragon's lane-x with a heavy
wet ~0.35s lag (**continuous live stick-tracking — 14's EXCLUSIVE claim; no other boss does it**).
Rider, whispered: "Don't move." … "It's watching us." (both dragon-directed — the ADDRESSED line stays
BANKED for stage 3). At window end one fast SACCADE snaps the pupil dead-center (guarantees the read
for players who held still); the aperture contracts once (debuts the NOTICE channel). **After thirteen
entrances of escalating motion, nothing moves but its attention — the stillness IS the point.** Run
under the `flythrough` phase name (gaze exclusion for free); self-feed `setGaze` with lag + saccade;
rider yaw is pitch-less (never fake a look-up). **Skip:** lands at stage-1 station with the pupil at
dead-center (the saccade fires immediately so the read survives) + all slow-mo released.

---

## PART 5 — VERIFICATION, ACCEPTANCE, GATES, DONE-WHEN

**Run (from `reforged/`):** `node tests/boss.mjs` (per-stage named-pivot telegraph checks — lid,
wheel, wing pivots; **TIER_BUDGETS tier-5 = 30k/120**; amberdiet + rhythmprint) · `bossboot` ·
`defs` · `bossrush` · `bulletcontrast` (+ dichromacy; contrast on dark-gold) · **`tricount`/
`tiershots` (the overdraw audit — GATING; all ~20 eyes + wings + core + fever at once)** ·
`bossgate --studio` per stage with the sanctioned overrides · **a NEW test asserting the medley
references ONLY existing card ids (ZERO new ids)** + destroying a relic removes its quoted card ·
`run-all` (proves every other boss byte-unchanged) · `stamp-sw` in the same commit.

**Acceptance:**
- [ ] Stage 2 reads as an ANGEL COVERED IN EYES — NOT Stormrend's rings, NOT a machine/mandala (the hero gate).
- [ ] All three stages each pass their own stranger test + dissolve cleanly.
- [ ] Spent the full tier-5 budget on identity (§2.7): ~20+ eyes, rich wheels/wings — the most geometrically rich boss in the game; q0.5 drops below q1.
- [ ] **OVERDRAW holds at the stage-3 climax frame (≤2 large additive volumes; eyes are small points; tiershots passes).**
- [ ] THE MEDLEY quotes real prior-boss cards by stable id, ZERO new ids (test passes); destroying a relic removes its card.
- [ ] STAR PIPS bank/multiply; the reflect-only seal is placed (stage 2); the verb-shift chase reads as a new mode.
- [ ] The second sun is present on ordinary runs (seeded on-load); the entrance stick-tracking works with the frozen camera.
- [ ] It answers the lore web (MAKER, not thief); the VOIDMAW glitch + the addressed line + the post-defeat mascot echo all fire.
- [ ] Per-stage crops + Fable verdicts + overdraw numbers posted; owner signed off EACH stage, then CP2.

**⛔ GATES (Fable gates per stage; the owner owns the final call):** Decision A (3 sheets) — approval
+ per-stage pre-build Fable sign-off · Decision B (§4b map — BLOCKER) · Decision C (second-sun
seeding + gate overrides + palette) · per-stage CP1 studio design gate (stage 2 is the hero gate) →
owner sign-off between stages · CP2 integration gate → owner's final call.

**DONE-WHEN:** all stage gates + CP2 passed by the human; registry row 14 flipped `open → shipped`;
the §5d entry carries the three sheets + the §4b map + the budget plan; **append a LEAPFROG lesson**
(e.g. "THE UNMASKED: the Apex budget went where the identity is — ~20 eyes ARE the screenshot and are
cheap on both tight axes (small points, not shells); the stillness entrance out-awes any camera move;
the medley quotes by STABLE id so upstream rebalances don't break it") and **add it to §9**. Then the
roster is complete — the post-game gap 14 leaves is the only thread still open.

---

## PART 6 — GUARDRAILS + WHY THIS BOSS EXISTS (the two things that decide the finale)

- **Never touch other bosses' defs/builders/dials or a sibling's rows.** The second-sun landmark,
  stage system, medley, STAR PIPS, and gate overrides are INERT for defs that don't opt in — prove it
  with the full suite (`run-all`). Only append your own rows to shared files.
- **The wheels/eyes/wings counter-rotate on their OWN pivots, never the group** (`placeGroup` owns
  `group.rotation`, `setDissolve` owns `group.scale`).
- **Build LAST, after any upstream rebalances** (esp. Stormrend — 13 and 14 both quote it). The medley
  references STABLE card ids; the CI test flags stale quotes.
- **Do not merge on your own verdict.** Fable gates per stage; the owner STOPs you between stages and
  at CP2. Never `git stash`/`checkout --`/`reset`; foreground only; don't self-merge or leave draft.

**WHY THIS BOSS EXISTS (the owner's two notes — weight everything on these):**
1. **Stage 2 is the whole ballgame.** "Wheels-within-wheels of eyes" is the most awe-inspiring
   silhouette in the game AND the one most likely to come back reading as Stormrend's rings or a
   gear/UFO. When you see stage-2 crops, the single question is: *does it read as an angel covered in
   eyes, or a machine/mandala?* If it's not unmistakably angelic-and-eyed, send it back — everything
   rests on that image. **The 30k budget exists to make that one screenshot: 20+ eyes all snapping to
   the player at once.**
2. **The stillness is the point.** This is the payoff of the "it reads YOU" arc (KARNVOW quoting your
   deaths → this thing tracking your literal stick with a frozen camera). After thirteen escalating
   spectacles, the finale's power move is that **nothing moves but its attention.** Do NOT let anyone
   "juice it up" with a big camera move — the restraint IS the awe. The geometry is rich and still;
   the camera is frozen; only the eyes follow you.

---

### Appendix — audit findings folded in (what changed vs the source prompt)
- **§4b per-stage seven-channel map (2.2)** — the audit's BLOCKER (EXPRESSION/FLINCH named for no
  stage; stage-1 BLINK/CHARGE/DEATH unstated); drafted per stage, with the DEATH = the death of the
  game (eyes easing shut a wheel at a time → the mascot echo).
- **§2.7 THE BUDGET PLAN (the headline)** — the audit's worst under-spec (5k vs 30k) turned into a
  per-stage tri/draw allocation: spend on the EYES (identity + screenshot, cheap on both axes); the
  overdraw discipline (≤2 large additive; eyes are small points); tiershots gating.
- **The APEX graze row (3.2)** — 14 had NO graze form (the §5i.B ladder had no Apex row); added THE
  MEDLEY graze + the stage-3 surge-chase capstone.
- **The reflect-only seal placed (2.6/3.4)** — was budgeted to 14 but never placed; now stage 2.
- **The three rule-breaks recorded (2.8/3.6)** — the source had the addressed line; added the VOIDMAW
  one-frame glitch + the re-struck stage cards.
- **The trophy/maker lore split + transfer clause (2.8)** — resolves the KARNVOW(9)↔14 double-booked
  relics (thief vs maker; relics return to their source after 9 falls).
- **Second-sun seeding = seed-on-LOAD (Decision C / 3.5)** — the ED-6 retrofit fix (the "first
  Calamity kill" trigger won't re-fire for live saves).
- **Gate overrides + Home-biome/VOICE + named pivots (2.4/3.3/3.8)** — the doc-completeness gaps.
- **The STORMREND-rebalance sequencing note (Part 0)** — answers the live owner concern: build 14
  after upstream rebalances; the medley quotes by stable id; the CI test guards it.

This brief is the slot-14 slice of the boss-context set. With it, the 9–14 briefs are complete —
the whole back half of the roster is documented.
