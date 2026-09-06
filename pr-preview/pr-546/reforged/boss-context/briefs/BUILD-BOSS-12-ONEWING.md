# BUILD BRIEF — BOSS 12: ONEWING, the grief-stricken survivor

**Standalone handoff.** Open a fresh Claude Code session in the `dragon-drift` repo, paste this
file, work it top to bottom. It merges a strong pre-written build prompt with the 2026-07
boss-design audit; **where they differ, the audit wins** (flagged inline). The design work that
would block the build — the §4b charisma map (the audit's BLOCKER), the fused-frame READ fix,
the presence target, the palette — is resolved below.

ONEWING is a **Tier-4 (World-Enders)** boss — EITHERWING's grief-stricken survivor, returned
colossal and lopsided, carrying its dead twin's frame fused to its chest. It is the roster's
**rival-return payoff** (Vergil grammar: two-thirds familiar kit + counters to what you learned
+ the old unanswerable dual attack finally answerable). Its band-break is the **arrival grammar
itself** (no warning until it erupts) plus the roster's **one lying FELLED card**. The audit
rated its entrance the design pass's *only outright PASS* — its risks are purely visual
(presence + the invisible fused frame), fixed below.

---

## PART 0 — ORIENTATION (read first)

1. **Read `LEAPFROG.md`'s THE RULE**, then the §9 boss lessons — at minimum **L150** (the
   silhouette betrays the mesh), **L140/L141** (presence = span × lit-edge area; scale is a
   silhouette property — decisive here), **L164/L165** (BRINEHOLM — silhouette judged at the
   FIGHT frame).
2. **Read `reforged/BOSS-DESIGN.md`**: §3 laws (esp. §3.1 — detail off the outline is invisible;
   §3.6 the one-scar law), §3b silhouette translation, §4b charisma-carrier law, §5b registry
   row 12 + the lore web, §5c WORLD-ENDERS contract ("the lane breaks" — 12's break is the
   arrival grammar + the health-bar lie), §5d slot-12 sheet + ENTRANCE, §5f (its dread + its TWO
   granted rule-breaks + the destructible fused frame + the Health-Bar-Lie trust rule), §5g
   budgets, §5h economy, §5i (rhythm RUBATO/FEINT / graze SPRAY-SOAK / parry ghost-volley), §5j
   entrance *The Grave It Carries* + uniqueness rulings, §6 recipe, §7/§7b/§7c verification + the
   Studio Gate.
3. **The shipped quality bar**: all shipped builders, especially **`bossEitherwing.js`** (slot 5
   — ONEWING is its grown survivor; you reuse its kite-frame + bead-thread) and **`bossAshtalon.js`**
   (the wing-blade kernel ONEWING oversizes). Also read **`reforged/js/ui.js`** (the HP bar +
   FELLED card — you build the lying variant) and note the `poseRing` sampler in **`boss.js`** (slot
   7's ring buffer — you consume it for the mirror).
4. **The iron law**: coexist → prove on a hero → migrate; never break the shipped roster;
   **verify before claiming**. A boss is DATA + one builder file.
5. **Studio-first law (§7c) + the Fable gate**: judged in the studio FIRST, in-game SECOND. **You
   never self-judge — you spawn an independent Fable agent (via the Agent tool) as the gate**,
   fix what it flags, THEN post crops and STOP for the human owner. **Three Fable spawns** (Part
   4): the §3b PRE-BUILD sheet sign-off, the CP1 studio design gate, the CP2 integration gate.
   Fable gates; the owner owns the final call.

### Concurrency with slots 9 / 10 / 11
May be built **concurrently with slots 9, 10, 11**; no merge-order dependency — ONEWING consumes
only engine already on master (slots 5/6/7), not anything the siblings build. **Branch from
current master** (slot 8 merged). Shared files — `bossDefs.js` (append your def + your id to
`BOSS_ORDER`), `bossModel.js` (one dispatcher line), `tests/boss.mjs`, the §5b/§5d/§5i/§5j rows,
`LEAPFROG.md` — are **additive: only append YOUR entries, never touch a sibling's.** Whoever
merges later rebases and re-appends. Do NOT reorder `BOSS_ORDER`.

**Branch & baseline:**
```
git fetch origin && git checkout -b claude/boss-12-onewing origin/master
cd reforged && node tests/run-all.mjs        # record the green baseline in your first message
```

### Engine you CONSUME (already on master — do NOT rebuild)
The `poseRing` sampler (slot 7 — boss.js:~216, samples recent player {x,y}; you consume it for
"mirrors your last dodge"); the destructible per-part hit test + `routePartDamage` (slot 6/8 —
for the breakable fused frame; copy the `destructiblePanes`/`destructibleShackles` registry
entry shape); the `ENTRANCE_SCRIPTS` registry + generalized `setOvertake` (slot 5 — for the
grief two-shot); the ladder controller + continuous-graze detector + adrenaline ladder (slot 6);
phrase machine + `getBeatClock` (slot 5); the `rhythmprint`/`amberdiet` gates. **⚠ AUDIT NOTES:
`def.noWarn` is NOT yet built (you build the no-warn late-banner path — see Part 2.6). And slot 7
used `poseRing` only for a FORMATION snapshot, NOT for aim — so ONEWING biasing its mirror-aim
off `poseRing` is a NEW consumption you must cost (small; reuse base = the shipped sampler).**

---

## PART 1 — ⛔ THREE HUMAN DECISIONS BEFORE ANY GEOMETRY

> **§3b/§4b: the sheet + charisma map must exist AND be signed off BEFORE geometry. Paste
> A/B/C to the human, collect answers, THEN start Part 4.**

**DECISION A — Approve the §3b silhouette translation sheet** (Part 2.1). *The source prompt had
a strong six-field sheet; the audit adds (a) the FUSED-FRAME-MUST-READ fix — the #1 visual risk —
and (b) the explicit presence target.* Then the **PRE-BUILD Fable sign-off (spawn #1)** before
any geometry.

**DECISION B — Approve the §4b seven-channel charisma map + glyph** (Part 2.2). **This is the
audit's BLOCKER for slot 12** — the sheet named no carrier for the seven channels and no glyph;
the eye plausibly covers some, but BLINK-analog, EXPRESSION (≥3), and DEATH were unstated. Her
carriers are the single grief-dimmed eye + the wing + the list. I've drafted all seven; the human
confirms.

**DECISION C — ⛔ PALETTE (the rose-triple + magenta clearance — a GATE-C human call).** Slots
11/12/13 all lean rose. **ONEWING must be the MOST ASHEN / desaturated of the three — a grief
grey-rose** (11 = pale-gold/moon-white lines, 12 = near-black grey-rose trace, 13 = bright rose
field). This breaks the triple AND keeps it clear of danger magenta (`0xff2b6a`, ≈342°). The
living wing carries dim ashen-rose accents; **the fused ghost-frame stays pure black (no glow).**
The human confirms the exact hue; the builder proposes hexes and verifies with `bulletcontrast.mjs`
+ `bossgate.mjs` G3 — **also verify the GHOST-BULLET color reads as "ghost" and clears
danger-magenta** (it must be distinct from both the living volley and the danger role-color). **Do
not finalize a near-magenta rose yourself.**

*(Scope note, not a blocker: ONEWING introduces NO new attack id — it QUOTES EITHERWING's dual
attack, and ghost-bullets are a per-bullet COLOR variant (`coreColor` is already supported —
audit-confirmed), not new bullet tech. This preserves the World-Enders band's ≤1-new-id budget,
which slot 11's laserLance likely spends.)*

---

## PART 2 — THE DESIGN ARTIFACTS (paste into BOSS-DESIGN.md as part of the build PR)

### 2.1 — §3b SILHOUETTE TRANSLATION SHEET (fill BEFORE modeling)

> **12 ONEWING — SILHOUETTE TRANSLATION (§3b):**
> - **Reads as:** a lopsided one-winged wraith, listing to one side, carrying its dead twin's
>   frame fused to its chest. (Stranger test: "a broken one-winged thing carrying a corpse.")
> - **Carrying cues (2–3, must reach the outline, sized dominant):** (1) the extreme ASYMMETRY —
>   one vast 8-blade wing vs one atrophied 2-blade stub (the lopsidedness IS the silhouette); (2)
>   the permanent ~12° LIST (it flies canted, compensating); (3) the dead twin's kite frame fused
>   across the chest.
> - **Anti-reads (must NOT read as → forbidden primitives):** NOT EITHERWING (the designed echo —
>   **forbidden**: two symmetric darts, a clean shared single eye; ONEWING is the GROWN, BROKEN,
>   SINGLE survivor — asymmetry + fused corpse-frame + list are the differentiators); NOT ASHTALON
>   (**forbidden**: a symmetric two-fan raptor; ONEWING is violently asymmetric, one wing,
>   listing); NOT a generic angel/bird.
> - **Lit-edge plan:** ashen-rose accents on the LIVING wing; the ONE survivor's eye is the
>   grief-dimmed focal; the snapped bead-thread hangs — **glow-shape = a SEVERED / BROKEN LINE**
>   (audit fix: its registry palette cell had none; this carries the grief motif and reads clearly
>   apart from EITHERWING's clean single point). **⛔ THE FUSED FRAME MUST READ (audit — the #1
>   risk):** a pure-black wireframe INTERIOR to a near-black body is INVISIBLE at fight distance
>   (§3.1), yet the frame is the table-listed HOOK, a destructible the player must target, AND the
>   entrance's gaze target. Make it read by BOTH: (a) position the kite frame so its shape CROSSES
>   the body/wing silhouette OUTLINE (its edges break the outline against the sky), and (b) the
>   kite's interior is genuine NEGATIVE SPACE — you see the background THROUGH it (a hole where a
>   body should be), not black lines on a black chest. Optionally a hair-thin dead-ashen rim (below
>   focal) so it reads as a ghost, not a modeling void. **Verify on the black-fill AND lit-edge
>   renders that the frame is legible; if it vanishes in both, it has failed.**
> - **Scale target (audit fix — resolve the ambiguity + clear the anchors):** base = the SHIPPED
>   EITHERWING r9 twin (BODY_LEN **6.2**, `bossEitherwing.js`), ×2.2. Give an explicit ON-SCREEN
>   span that clears the Tier-3/4 anchors: **the vast living wing alone must span ≥26 on-screen
>   units** at station (bigger than ASHTALON's ~24u) — presence comes from SIZE + the WRONGNESS of
>   the asymmetry/list. Author ONE mid-fight presence beat compatible with the no-pull-ahead law
>   (Part 6): a lateral cross ABOVE the lane (its shadow/wing sweeps over you) — NOT a rear pass,
>   NOT a pull-ahead (those are forbidden). *(Its scale must not undershoot: ×2.2 of a 6.2 body is
>   the floor, not the target — size the wing to the ≥26u read.)*
> - **Home backdrop:** a dark sky (so the ashen figure + the pure-black ghost-frame both read).
>   *(Home biome: PLACELESS — see Part 3.6; its jump-scare is deliberately home-agnostic.)*
> - **SCAR (§3.6, one asymmetric):** the SNAPPED BEAD-THREAD (the severed link to its twin) — the
>   memory hook + the lore gap (what severed it → the slot-5 fight; its grief → the Apex).

### 2.2 — §4b SEVEN-CHANNEL CHARISMA MAP (⛔ the BLOCKER — the eye + wing + list are the carriers)

> **12 ONEWING — §4b carriers:**
> - **GAZE:** the single grief-dimmed EYE tracks the dragon AND rider — **the mutual gaze is ITS
>   claim** (it DOES turn to look at you, distinct from slot 9 which never turns its cowl).
> - **BLINK-analog:** the eye does not blink cleanly — it grief-DIMS and re-lights (a guttering,
>   mournful pulse); rate = grief/pressure.
> - **CHARGE-TELL:** the vast living wing MANTLES / draws back before a living volley (the wing
>   pose is the tell); the fused frame's snapped thread TWITCHES before the ghost-half volley (the
>   ghost-bullets carry amber — the amber ORGAN, §5i.C.3).
> - **EXPRESSION (≥3 states):** the LIST + wing posture — **sagging** (grief/despair, the rubato
>   droop), **mantling** (aggression, wing drawn up), and **the eye dropping to the fused frame**
>   (mourning its dead twin). Read off wing pose + list angle + eye target.
> - **FLINCH:** the wing JERKS and the whole body lists HARDER on a hit; the eye flares.
> - **NOTICE (fight start):** the eye finds you at the entrance (the two-shot mutual gaze), then
>   dips to the frame, then returns *(in the entrance)*.
> - **DEATH:** the grief death — the eye eases shut, the vast wing folds DOWN over the fused frame
>   (finally covering / embracing its dead twin), the list collapses, it drifts down. A survivor
>   reunited with its dead half in death. (Mournful — a strong fan-art hook, §4.7.)
> - **GLYPH (doodle test → boss-select chip):** the lopsided silhouette — one big wing + one stub
>   + a dark kite on the chest.

### 2.3 — GEOMETRY (buildable translation — primitives, pivots, palette)

EITHERWING survivor at ×2.2 (base BODY_LEN 6.2; size to the ≥26u wing read — §2.1), permanently
listing ~12° (**the list is a RIG TILT, never a `group.rotation`**). One vast 8-blade wing
(Ashtalon kernel, oversized) on a named **`wingPivot`** (mantle/thump/fold telegraphs); one
atrophied 2-blade stub (a named `stubPivot`, twitches). The dead twin's kite frame fused across
the chest = pure-black EdgesGeometry ghost (eyeless), crossing the silhouette outline + genuine
negative-space interior (§2.1), on a `frameGroup` (destructible); its old bead-thread hangs
snapped (the severed-line glow-shape + the scar). The ONE eye = EITHERWING's eye rig, grief-dimmed
(`eyeRig`/`onewingEye`). Ashen-rose `0x241418` (grey-rose per Decision C) / blackened silver / the
ghost stays black. **~2.6k tris is the FLOOR — go ALL OUT toward the tier-4 gate; see §2.7.** Spend
the surplus on the wing-blade articulation + the fused-frame detail + the grief-death spectacle
(the wing folding over the corpse), NOT filler. REUSES: EITHERWING's kite + bead-thread + eye rig,
Ashtalon's wing kernel, the `poseRing` sampler, the destructible-part plumbing. NEEDS: the lying
FELLED card + `def.noWarn` late-banner + ghost-bullets (Part 2.6) — you build these.

### 2.4 — ⛔ PALETTE (see Decision C — do not finalize yourself)

Ashen grey-rose (most desaturated of the 11/12/13 triple); the fused frame is pure black (no
glow); the eye is grief-dim. Verify the accent AND the ghost-bullet color clear danger-magenta
(`bulletcontrast.mjs` + `bossgate.mjs` G3); the ghost-bullet must read as "ghost," distinct from
the living volley AND the danger role-color. If any hue lands near a reserved role color (danger
magenta / parry amber / reflected cyan / surge pink), STOP and ask.

### 2.5 — THE DEF (add to `bossDefs.js`; append `'onewing'` to `BOSS_ORDER`)

```
id: 'onewing', name: 'ONEWING', title: 'the Half That Would Not Die',
epithet: <points the grief → Apex gap, e.g. 'What Grief Would Not Bury'>,
archetype: 'onewing',                       // new string; dispatch in bossModel.js
tier: 4,                                     // WORLD-ENDER band
hpMax: <WE band 480–560; place per the §5b sawtooth — strong mid/late slot, NOT the 13 peak>,
noWarn: true,                                // ⚠ you BUILD this path (Part 2.6) — the late-banner jump-scare
muzzle: <living volley from the wing; ghost volley from the fused frame — two named emitters>,
grazeForm: 'spraySoak',                      // SPRAY-SOAK (breaking the fused frame vents 2× spray)
scale: <size the wing to ≥26u on-screen — TUNE in studio; ×2.2 of the r9 6.2 body is the FLOOR>,
accent: <ashen grey-rose — Decision C, GATE>,  glow: <same, dim (grief)>,
bulletColor: 0xff2b6a,                       // danger magenta — role color (living volley)
// ghost volley uses a per-bullet ghost coreColor variant — Decision C, GATE
```
Phases — RUBATO / FEINT (held wind-ups, denied downbeats; **delays FIXED per attack,
animation-held, NEVER randomized** — the broken meter must be learnable, not luck). Re-express
EITHERWING's kit (`crossfire`/`secondWave`/`movingGap`) + the ghost-half volley (carries amber).
Tune until `amberdiet` + `rhythmprint` pass.
Cards (5–6 for WE; `<EPITHET FRAGMENT> — <plain pattern>`; one `dread:true`, LAST):
```
cards: [
  ... 4–5 rubato/ghost cards ...,
  { id: 'onewing_missingwing', name: 'WOULD NOT DIE — The Missing Wing', atFrac: <low>, timer: 30, dread: true },
]
```
Dread — **"WOULD NOT DIE — The Missing Wing"**: it performs EITHERWING's old DUAL attack ALONE —
the dead half's volley arriving as ghost-bullets (the finally-answerable attack; parry the ghost
half). Rhythm — **RUBATO / FEINT** (`signature: 'rubato-feint'`): the roster's ONE broken-meter
boss; author `def.rhythm` so `rhythmprint` passes (its off-meter signature is deliberately
distinct); state the REST look (the rubato SAG — it visibly sags and re-lifts between beats, grief
as arrhythmia, not a still pause).

### 2.6 — THE ENGINE SCOPE (you build these; coexist-safe, inert for other bosses)

1. **The lying FELLED card** (a fake-death → revive) — near death it fires the FELLED card,
   cracks, and **≤35% of the bar returns**; it must **resolve within ≤2s**, and the crippled
   silhouette stays visibly MOVING as the honest tell during the lie (the MGS2 live-corner rule).
   Its name IS the mechanic. **This is the roster's ONLY health-bar lie — default-OFF for every
   other def; no other boss may opt in.** Net-new UI + state.
2. **`def.noWarn` late-banner-at-eruption** — build the no-warn path: the DANGER banner fires WITH
   the eruption (not before); skip fires the pending banner immediately (a skipper still gets the
   jump-scare). *(Confirmed unbuilt on master — this is genuinely net-new.)*
3. **Ghost-bullets** — a per-bullet COLOR variant (`coreColor` is already supported — NOT new
   bullet tech) emitted from the fused frame; removable by breaking the frame (rides the shipped
   destructible-part plumbing).
4. **The dodge-mirror** — consume the shipped `poseRing` to bias the mirror volley toward the
   player's last dodge. **⚠ This is a NEW `poseRing` consumption (slot 7 used it for a formation
   snapshot, not aim) — cost it in the §5e ledger (small; reuse base = the shipped sampler).**
   FAIRNESS: the mirror reads the player's ACTUAL recent path (never touches input); it reads as
   "it learns," not as cheating.
5. **Everything default-OFF for existing bosses** (byte-identical legacy path).

### 2.7 — ⛔ BUDGET & GRANDEUR (go ALL OUT — the World-Enders directive)

**Owner directive: World-Enders SPEND THE HARDWARE.** Push toward the tier-4 gate (**22k tris /
90 draws**); the ~2.6k figure is a FLOOR, not a target. Spend it on IDENTITY, never filler.

**The measured ceiling (why you can go all out — L124/L126, a real weak phone):**
- **Triangles are ~free**: the phone held ~400k tris @ 59fps. A 22k ONEWING + a ~12k dragon + env
  + a future ~5k dragon-relic + bullets is a small fraction. Tris are NOT your constraint.
- **Draws are the tighter axis** (~415 animated @ 58fps): stay under the 90-draw gate; the
  whole-frame worst case (boss + dragon + ~5 bullet draws + relic + env) sits well under 415, but
  draws — not tris — are where a crowded frame shows first.
- **Overdraw is the ONLY real killer** (a 32fps cliff): **≤2 large additive/fresnel volumes on
  screen, INCLUDING the kit shield.** Absolute (below).
- **Everything else is accounted for**: bullets = 4 instanced draws regardless of count (~free);
  one dragon ~6k HIGH / ~12k ULTRA; the planned post-defeat dragon-relic reserves ~5k / ~10 draws
  as SEPARATE meshes (never InstancedMesh — L126); the second-sun landmark ~200 tris. None
  contends with you.

**WHERE to spend it (identity-bearing grandeur):** the **8-blade wing articulation** (oversized,
each blade a real mantle/thump element) · the **fused-frame detail** (the kite ghost, readable per
§2.1) · the **grief-death spectacle** (the wing folding DOWN over the corpse — the fan-art beat) ·
the **rubato motion** (the sag-and-relift, the list compensation). Grandeur = the SIZE + the
WRONGNESS of the asymmetry + the grief, never tri count.

**⛔ THE OVERDRAW TRAP (budget FX in SHELL COUNT, not tris):** the ghost-frame is pure black (no
additive — good). Your additive risks are the **eye focal glow, the wing accent glow, and the
FELLED-card CRACK flash** — and during the FELLED lie / dread the kit SHIELD may be up (1 shell).
Keep every glow bounded/thin (rim-shaped fresnel, small discs strictly BEHIND the silhouette,
line-based flashes). **Run the G7 overdraw check with the shield up + the FELLED crack + the dread
volley all firing at once** — the frame your tri counter will wave through.

**Quality scaling**: at q0.5, drop the wing-blade count + fused-frame detail (`tris(q0.5) <
tris(q1)` gate; those are your lowQ dials). **Keep the sawtooth**: do NOT raise the tier-4 gate —
THE UNMASKED (30k / 120) must out-grand every World-Ender.

---

## PART 3 — DOC FIXES TO LAND IN THE SAME PR (settled — just do them)

**3.1** Registry parry-job cell (§5b row 12): change `—` to `GHOST-HALF VOLLEY → PARRY/STAGGER
(§5i.C) — the living half is unparryable; the dead twin's ghost volley carries amber, parry
reflects + staggers; breaking the fused frame removes the ghost volley but ENRAGES tempo`. Add the
matching §5i.C entry.
**3.2** Registry palette glow-shape (§5b row 12): add the missing token — `ashen grey-rose · a
SEVERED / BROKEN LINE (the snapped bead-thread; designed echo of slot 5's single point, flagged)`.
**3.3** GRAZE FORM line in the §5d sheet (as anatomy): "GRAZE FORM — SPRAY-SOAK: the fused frame is
the anatomy; hitting/breaking it vents a 2×-value spray for a beat — soak it; offered once per
phase."
**3.4** §5d NEEDS line — the lying FELLED card + `def.noWarn` late-banner + ghost-bullets + the
dodge-mirror `poseRing` consumption (cost the last two in the §5e ledger — Part 2.6).
**3.5** §5b Home-biome + VOICE cells for row 12: Home-biome = **"PLACELESS (the jump-scare is
home-agnostic — no biome; BIOME-DESIGN.md)"**; VOICE = **"the arrhythmic double wing-THUMP (heard
behind at the entrance), low register, grief-dimmed — the RUBATO's broken meter as signature
noise."**
**3.6** Lore (§5b): it carries a CORPSE/ghost — deliberately distinct from slot 10's LIVING captive
(10 = living prisoner, 12 = carried dead). The 5↔12 echo is INTENDED (the rival-return, flagged) —
keep it a deliberate callback, differentiated by the asymmetry + fused ghost + list. Its grief
points at the Apex (register the thread). No stale references to retired concepts.
**3.7** §5b principle-10 rose-family ruling (if not already landed by a sibling): 11 =
pale-gold/moon-white LINES · **12 = near-black ashen grey-rose TRACE** · 13 = bright rose FIELD.

---

## PART 4 — THE BUILD PIPELINE (CP1.0 Fable → CP1 model+studio+Fable → CP2 wire+Fable → owner)

**CP1.0 — ⛔ PRE-BUILD FABLE SHEET SIGN-OFF (before any geometry — Fable spawn #1):** after the
human approves the §3b sheet, spawn an independent **Fable agent via the Agent tool** with the §3b
laws + ONEWING's sheet (2.1) + this task — *"Independent design gate. Run the §3b STRANGER TEST in
prose: does the described black-fill silhouette read, in ~2 seconds with zero context, as a
LOPSIDED ONE-WINGED WRAITH CARRYING A CORPSE-FRAME — and clearly NOT EITHERWING (two symmetric
darts), NOT ASHTALON (a symmetric two-fan raptor), NOT a generic angel? Confirm the asymmetry +
the ~12° list + the fused kite-frame each reach the outline. CRITICAL: does the fused frame READ
(it crosses the outline + shows negative space through it), or is it an invisible black-on-black
wireframe? Verdict PASS / FIX."* Fix the sheet until PASS before modeling.

**CP1 — the model (studio-gated):**
1. `bossDefs.js`: add the def (2.5), append `'onewing'` to `BOSS_ORDER`.
2. New `reforged/js/bossOnewing.js`: `export function buildOnewing(def, quality = 1)`. Compose on
   `createBossCommon(...)`. Parts on an inner `rig` (NEVER animate the root — `placeGroup` owns
   rotation, `setDissolve` owns scale; **the 12° list is a RIG TILT, not a group rotation**).
   **Every material through `kit.track()`.** Name the pivots (`wingPivot`, `stubPivot`,
   `frameGroup`, `onewingEye`).
3. `bossModel.js`: one dispatch line — `if (def.archetype === 'onewing') return buildOnewing(def,
   quality);`.
4. Return the handle contract (§6.4): `{ group, muzzle, orbiters(≥2, tick-animated), setDissolve,
   setCharge, setHealth, setHealthBarVisible, setShieldVisible, shatterShield, flash, tick(dt,time),
   dispose }` + `setGaze`/`notice()`. Wrap kit methods to layer emotion (`setDissolve`→the
   wing-folds-over-the-corpse grief death, `flash`→the wing-jerk + harder-list flinch,
   `setCharge`→the wing mantles / the snapped thread twitches, `notice()`→the eye finds you).
5. **Merge gotchas** (`mergeGeometries` returns null silently): strip `uv`+`uv2` via
   `bossKit.stripForMerge` and REASSIGN, `toNonIndexed()`, bake transforms pre-merge.
6. **STUDIO GATE (§7c):** `node tools/bossstudio.mjs onewing` → judge on the **dark (home) backdrop
   FIRST**, then the black-fill + **LIT-EDGE renders (the pure-black ghost-frame must read as a HOLE
   in the silhouette — §2.1)**, then the fight-distance frame for PRESENCE (does the wing span ≥26u
   / read LARGE, or undersized? — the L140/L141 check). Then `node tools/bossgate.mjs onewing`
   (G1–G7; accent clears G3 danger-magenta — Decision C). Iterate the MODEL.
7. **⛔ CP1 FABLE DESIGN GATE (Fable spawn #2 — silhouette FIRST, before the beauty pass):** spawn a
   fresh Fable agent with the black-fill/lit-edge/fight-distance renders + the bossgate output —
   *"Independent design gate, silhouette first. Black-fill: stranger test = one-winged wraith
   carrying a corpse? Anti-reads present (EITHERWING / ASHTALON / generic angel)? Is the asymmetry +
   list + fused kite in the OUTLINE? DOES THE FUSED FRAME READ (crosses the outline / negative space
   through it), or is it invisible black-on-black? Fight-distance: does it read LARGE (wing ≥26u),
   not undersized? Lit-edge: is the accent the most ASHEN of the rose-triple, and the ghost-frame
   truly dark? Verdict PASS / FIX; do not pass a failed stranger test or an invisible frame."* Fix
   the MODEL and re-gate until PASS. Only then the beauty pass.
8. **POST CROPS + STOP FOR THE OWNER.** Post the studio sheets (idle · `notice()` · `setCharge(1)` ·
   shielded · death) + black-fill/lit-edge + fight-frame + Fable's verdict, and STOP for the owner's
   green-light. You never proceed to CP2 on your own verdict.

**CP2 — wire the live fight (separate commit, after the CP1 owner green-light):**
9. Phases/cards fire; the muzzles emit (living from the wing, ghost from the frame); RUBATO rhythm
   passes `rhythmprint` (delays FIXED per attack, animation-held).
10. **The entrance (§5j — The Grave It Carries):** warn suppressed (`def.noWarn`). Ambient lead-in:
    ashen-rose wall tint + fog-floor drop + an arrhythmic double wing-THUMP heard BEHIND. It climbs
    from behind-below to draw level ~12m off the LEFT flank — ONE beat, never a pacing state (slot 9
    owns alongside-as-state). Side-slew inside slow-mo to a profile TWO-SHOT (the shipped
    midpoint-look frames it): dragon foreground-right, ONEWING filling the left half, listing 12°;
    the vast wing THUMPS, the stub twitches; it sags and re-lifts between beats (rubato in motion).
    Gaze: the eye finds dragon+rider (`setDragonLook` holds them looking back — the mutual gaze is
    ITS claim), then DIMS and drops to the black frame on its chest, then returns to you. Rider:
    "The twin. It kept the body." It folds and DROPS out of frame; camera home; **TWO SECONDS of
    silent normal play**; then it ERUPTS from the fog floor at rel +50 already at station and the
    DANGER banner fires WITH the eruption. No rear view, no pull-ahead, ever. Skip fires the pending
    late banner immediately; the slow-mo window must not reach u=1 (leak gotcha).
11. **The engine (2.6): the lying FELLED card, the no-warn late banner, ghost-bullets, the
    dodge-mirror off `poseRing`.** The FELLED lie resolves ≤2s with the crippled silhouette visibly
    moving; the lie is never repeated.
12. **The ghost-volley parry + frame-break interaction + spray-soak graze**: the ghost half is
    parryable (reflect + stagger); breaking the fused frame removes the ghost volley but ENRAGES the
    tempo; breaking it vents the 2× spray-soak.
13. **⛔ CP2 FABLE INTEGRATION GATE (Fable spawn #3):** capture in-game (`?debug&boss=100&bossIdx=11`,
    `?rush=all`), then spawn a fresh Fable agent — *"Judge ONLY integration, not design. Check: the
    lying FELLED card resolves ≤2s with the crippled silhouette visibly moving (trust restored fast;
    never repeated); the no-warn banner fires WITH the eruption and skip still delivers it; the
    RUBATO delays are FIXED per attack (learnable, never random); it mirrors the player's ACTUAL last
    dodge (poseRing) fairly; the ghost-half volley is parryable and breaking the fused frame removes
    it while enraging tempo; the entrance two-shot mutual-gaze lands and the two-seconds-silence →
    eruption reads; the fused frame reads in-game (not invisible); it's clearly the grown EITHERWING
    survivor, not a re-skin; bullet contrast (accent + ghost-bullet clear danger-magenta); the ladder
    controller advances the run without regressing shipped bosses; full loop + death. Verdict PASS /
    FIX per item."* Resolve or explicitly re-defer each FIX.
14. Re-run all suites, post the in-game crops + Fable's verdict, and **STOP for the owner's final
    motion/feel call before the PR leaves draft.**

---

## PART 5 — VERIFICATION, ACCEPTANCE, GATES, DONE-WHEN

**Run (from `reforged/`), all green before each checkpoint:**
- `node tests/boss.mjs` — extend with your named-pivot telegraph check (`wingPivot` moves the
  silhouette on `setCharge`; the pivots exist); TIER_BUDGETS tier-4; `amberdiet` + `rhythmprint`.
- `node tests/bossboot.mjs` — zero console errors + zero untracked-material warnings.
- `node tests/defs.mjs`, `node tests/bossrush.mjs`.
- `node tests/bulletcontrast.mjs` (+ the accent AND the ghost-bullet color clear danger-magenta —
  Decision C).
- **A NEW test** asserting the lying FELLED card returns ≤35% + resolves ≤2s + is INERT for all
  other defs (the roster's only health-bar lie).
- `node tools/bossgate.mjs onewing` (G1–G7) · `node tools/bossstudio.mjs onewing` · `node
  tools/tricount.mjs` / `tiershots.mjs`.
- `node tests/run-all.mjs` — full suite green (proves coexist: the other bosses byte-unchanged;
  confirm the FELLED-lie / no-warn / ghost-bullet changes leave every other boss byte-identical).
- `node tools/stamp-sw.mjs` — **in the same commit** as any js/css/html change.

**Acceptance checklist:**
- [ ] Studio black-fill passes the stranger test ("one-winged wraith carrying a corpse") + anti-reads avoided (NOT EITHERWING / ASHTALON).
- [ ] **The fused frame READS on both black-fill and lit-edge (crosses the outline / negative space through it) — not an invisible black-on-black wireframe.**
- [ ] Fight-frame reads LARGE (the wing spans ≥26u); the list + asymmetry read as "wrong," not tidy.
- [ ] `wingPivot` moves the silhouette on `setCharge`; the snapped-bead-thread scar is present; all pivots exist.
- [ ] The lying FELLED card test passes (≤35% + ≤2s + inert for others); the no-warn banner fires WITH the eruption + on skip.
- [ ] RUBATO delays are FIXED per attack (learnable); the mirror reads the real poseRing.
- [ ] Accent is the most ashen of the rose-triple; accent + ghost-bullet clear danger-magenta (or human signed off — Decision C).
- [ ] `amberdiet` + `rhythmprint` + tier-4 tri gate pass; full suite green.
- [ ] Went ALL OUT toward the 22k gate on identity-bearing detail (§2.7); q0.5 drops below q1.
- [ ] **Overdraw check (§2.7): G7 passes with the shield up + the FELLED crack + the dread volley all firing (≤2 large additive volumes incl. the shield).**
- [ ] Part 3 doc fixes landed (parry cell, glow-shape, graze line, NEEDS, biome/VOICE, lore, rose ruling).
- [ ] Crops + Fable verdicts posted; stopped for the owner (CP1 studio, then CP2 in-game).

**⛔ GATES you cannot self-certify past (Fable gates; the owner owns the final call):**
- Decision A (§3b sheet) — human approval **+ pre-build Fable sign-off (spawn #1)** before geometry.
- Decision B (§4b map — THE BLOCKER) — human sign-off before geometry.
- Decision C (palette — the ashen rose + ghost-bullet color) — human sign-off before the accent lands.
- CP1 studio verdict — **Fable design gate (spawn #2)**, then the owner green-lights on crops.
- CP2 integration verdict — **Fable integration gate (spawn #3)**, then the owner's final call before the PR leaves draft.
- Every Fable spawn is an INDEPENDENT Agent-tool agent (fresh, no build context).

**DONE-WHEN:** CP1 + CP2 verdicts passed by the human; registry row 12 flipped `open → shipped`
(claim `open → claimed` in your first commit); §5d entry carries the approved sheet/map/geometry;
**append a LEAPFROG lesson** (e.g. "ONEWING: a pure-black ghost hook only reads if it CROSSES the
outline / shows sky through it — black-on-black is invisible; the grief lives in the mutual gaze +
the wing folding over the corpse at death; the FELLED lie must restore trust in ≤2s") and **add it
to §9**.

---

## PART 6 — GUARDRAILS / DO-NOT-BREAK + WHY THIS BOSS EXISTS

- **Never touch the other bosses' defs/builders/dials, or a sibling slot's rows/lines** (see
  Concurrency). ONEWING is additive: a new def + `bossOnewing.js` + one dispatch line + the
  def-gated FELLED-lie / no-warn / ghost-bullet engine.
- **The lying FELLED card / no-warn late banner / ghost-bullets are INERT for defs that don't opt
  in** — shipped bosses byte-identical. The FELLED lie is the roster's ONLY health-bar lie — no
  other def may ever opt in.
- **`boss.js` needs ZERO changes for the MODEL.** You consume the shipped `poseRing`, destructible
  parts, and `setOvertake`/`ENTRANCE_SCRIPTS`; you build the FELLED-lie + no-warn + ghost-bullets.
- **No rear view, no pull-ahead, EVER** (slot 3 owns the overtake; slot 9 owns alongside-as-state).
  ONEWING's presence beat is a lateral cross ABOVE the lane, not a pass toward/past the camera.
- **The mutual gaze is ITS claim** (it turns to look at you — distinct from slot 9). The two-shot
  is how two "arrives beside you" bosses differ.
- **The list is a rig tilt, never a group rotation** (`placeGroup` owns `group.rotation`).
- **Do not finalize palette near reserved role colors.** Propose, test, ask.
- **Do not invent lore.** Its grief points at the Apex; keep it a deliberate callback to slot 5.
- **Do not merge on your own verdict.** Fable gates, then the owner STOPs you — twice.
- Never `git stash` / `git checkout --` / `git reset`; foreground commands only; do not self-merge
  or flip the PR out of draft. Commit trailer per repo convention; keep model identifiers out of
  commits/PRs/artifacts.

**WHY THIS BOSS EXISTS (weight your build + the Fable/owner gates on these two beats):**
1. **The grief must LAND — it's the emotional grandeur, not the size.** The mutual gaze (it turns
   to look at you and the rider), the eye dropping to the dead twin on its chest, and the death
   where the vast wing folds DOWN over the corpse — those are what make a returning rival tragic
   rather than a re-skin. If it reads as "EITHERWING but bigger," the whole rival-return payoff is
   wasted. Judge the preview on whether the grief reads.
2. **The two rule-breaks must feel FAIR, or they poison trust.** The no-warn jump-scare is a
   one-time thrill (the two-seconds-silence → eruption); the lying FELLED card is a trust gamble —
   it MUST restore trust in ≤2s with the crippled silhouette visibly moving, and it must NEVER
   repeat. A health-bar lie that lingers or recurs makes every future FELLED card feel cheap across
   the whole roster. This is the one place in the game you're allowed to lie — spend it perfectly.

---

### Appendix — audit findings folded in (what changed vs the source prompt)
- **§4b seven-channel map (2.2)** — the audit's BLOCKER for slot 12 (no carrier map / glyph);
  drafted around the eye + wing + list.
- **The FUSED-FRAME-MUST-READ fix (2.1, the #1 visual risk)** — a pure-black wireframe interior to a
  near-black body is invisible (§3.1); it must cross the outline + show negative space, and be
  verified on the black-fill AND lit-edge renders. It's the hook, a destructible, and the gaze
  target — it cannot vanish.
- **The presence target (2.1)** — resolved the ×2.2 base ambiguity (r9 twin BODY_LEN 6.2) and set an
  explicit ≥26u wing span clearing the anchors, plus a no-pull-ahead-compatible presence beat (the
  audit flagged ×2.2 undershooting the Tier-2 anchor with the close-pass remedy forbidden).
- **Glow-shape + palette (2.4 / 3.2, Decision C)** — the missing registry glow-shape token (severed
  line) + the most-ashen rose ruling + the ghost-bullet color clearance.
- **Ghost-bullets are data-only + no new attack id (Part 1 / 2.6)** — `coreColor` is already
  per-bullet; ONEWING quotes EITHERWING, preserving the band's ≤1-new-id budget.
- **The dodge-mirror is a NEW poseRing consumption to cost (2.6)** — slot 7 used poseRing for a
  formation snapshot, not aim.
- **Home-biome = PLACELESS + VOICE (3.5)** — grounded in BIOME-DESIGN.md; the §3.6 scar = the
  snapped bead-thread.
- **§2.7 BUDGET & GRANDEUR — go all out (new)** — the owner's World-Enders directive + the
  KNELLGRAVE-session budget learnings (tris ~free, draws the tighter axis, overdraw the real killer,
  everything-else accounted for, q0.5 scaling, keep the sawtooth).

This brief is the slot-12 slice of the execution SOP from the 2026-07 BOSS-DESIGN audit. It is
self-contained; you do NOT need the full SOP to build ONEWING.
