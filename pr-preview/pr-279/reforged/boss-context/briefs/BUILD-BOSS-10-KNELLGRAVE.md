# BUILD BRIEF — BOSS 10: KNELLGRAVE, the WORLD-ENDERS opener

**This is a standalone handoff.** Open a fresh Claude Code session in the `dragon-drift`
repo, paste this file, and work it top to bottom. It merges a strong pre-written build prompt
with the 2026-07 boss-design audit findings; **where they differ, the audit wins** (flagged
inline). The design work that would block the build — the §4b charisma map (the audit's ONE
formal BLOCKER), the palette clearance, the amberdiet trap — is resolved below.

KNELLGRAVE is the **Tier-4 (World-Enders) band OPENER** — a colossal cracked bell swinging
above the lane with a bound living prisoner as its clapper. Its band identity is *"the lane
breaks"*: it owns the space ABOVE you and the music DIES for the whole fight — the toll is the
only clock. It is the roster's rhythm boss. The audit rated its ENTRANCE roster-best but its
fight "entrance-heavy, fight-light" — the single most important design note in this brief is
how to fix that (Part 2 + Part 6).

---

## PART 0 — ORIENTATION (read first, ~10 min)

1. **Read `LEAPFROG.md`'s THE RULE**, then the boss lessons in `reforged/BOSS-DESIGN.md` §9 —
   at minimum **L150** (the silhouette betrays the mesh), **L140/L141** (presence = span ×
   lit-edge area; scale is a silhouette property — critical for an oversize overhead boss),
   **L164/L165** (BRINEHOLM — the silhouette is judged at the FIGHT frame; a weak-point window
   is a DURATION).
2. **Read `reforged/BOSS-DESIGN.md`** fully, especially: §3 laws, §3b silhouette translation,
   §4b charisma-carrier law, §5b registry row 10 + the lore web, §5c WORLD-ENDERS contract
   ("the lane breaks"), §5d slot-10 sheet + ENTRANCE, §5f (its music-death rule-break +
   survival-card rules + dread), §5g budgets, §5h economy + owner decisions (incl. the
   second-sun seeding note — see Decision C), §5i (rhythm MUSIC-LOCKED / graze SHRINKING SAFE
   DISC / parry RHYTHM PARRY CARD), §5j entrance *It Lifts Its Head* + uniqueness rulings, §6
   recipe, §7/§7b/§7c verification + the Studio Gate.
3. **The shipped quality bar**: `bossIdol.js` … `bossBrineholm.js` (slot 8, the most recent —
   its CP1-model→CP2-wire split is the pattern to follow). Also read **`reforged/js/sfx.js`**
   (the `musicBus` + the `bgSuspend` silence path you extend) and **`reforged/js/boss.js`**
   (the fight loop, `getBeatClock`, `bossGradeTarget`, the cull bounds).
4. **The iron law**: coexist → prove on a hero → migrate; never break the shipped roster;
   **verify before claiming** (run the tests). A boss is DATA + one builder file.
5. **Studio-first law (§7c) + the Fable gate**: judged in the studio FIRST (is the DESIGN
   right?), in-game SECOND. **You never self-judge — you spawn an independent Fable agent (via
   the Agent tool) as the gate**, fix what it flags, THEN post crops and STOP for the human
   owner's final motion/feel verdict. **Three Fable spawns** (Part 4): the §3b PRE-BUILD sheet
   sign-off, the CP1 studio design gate, the CP2 integration gate. Fable gates; the owner owns
   the final call. Not optional — it is how the last three bosses avoided rebuilds.

### Concurrency with slot 9 (KARNVOW)
Slot 10 is built **concurrently with slot 9**; there is NO merge-order dependency. Slot 9
builds a tennis-rally/reflect-seal engine you do NOT need; you build the audio/music engine it
does NOT need. **Branch from current master** (slot 8 merged) and proceed. You will both touch
shared files — `bossDefs.js` (append your def + your id to `BOSS_ORDER`), `bossModel.js` (one
dispatcher line), `tests/boss.mjs`, the §5b/§5d/§5i/§5j registry rows, `LEAPFROG.md`. These are
**additive (the coexist rule): only append/insert YOUR rows and lines, never touch slot 9's.**
Expect a mechanical merge conflict when the other slot lands — whoever merges second rebases
and re-appends. **Do NOT reorder `BOSS_ORDER` or edit slot 9's rows.**

**Branch & baseline:**
```
git fetch origin && git checkout -b claude/boss-10-knellgrave origin/master
cd reforged && node tests/run-all.mjs        # record the green baseline in your first message
```

### Engine you CONSUME (already on master — do not re-implement)
`getBeatClock()` + phrase machine (`bossRhythm.js`) + the `ENTRANCE_SCRIPTS` registry (slot 5);
the ladder controller + continuous-graze ticking detector + NO-HIT ADRENALINE LADDER (slot 6);
the widened bullet cull bounds (`bossBullets.js`, y-floor −16) + the below/top approach
branches (slots 6/8); the `rhythmprint`/`amberdiet` CI gates. You do NOT consume slot 9's
reflect-seal engine.

---

## PART 1 — ⛔ THREE HUMAN DECISIONS BEFORE ANY GEOMETRY

> **The repo's own law (§3b/§4b) says the silhouette sheet + charisma map must exist AND be
> signed off BEFORE geometry. Paste A/B/C to the human, collect answers, THEN start Part 4.**

**DECISION A — Approve the §3b silhouette translation sheet** (Part 2.1). *Note: the source
prompt already had a strong six-field sheet — the audit only adds the explicit scale target
and the vertical-slit anti-read polish.* The human confirms KNELLGRAVE *Reads as* "a colossal
cracked bell hanging from nothing, swinging above you, a bound prisoner inside." Then it passes
the **PRE-BUILD Fable sign-off (spawn #1, CP1.0)** before any geometry.

**DECISION B — Approve the §4b seven-channel charisma map + glyph** (Part 2.2). **This is the
audit's ONE formal BLOCKER for slot 10** — the doc named only the head-lift NOTICE; §4b makes
a sheet missing any channel "not claimable." The carriers are the bound clapper + candle-slit
+ toll. I've drafted all seven; the human confirms.

**DECISION C — Second-sun seeding scope (the one real scope call).** §5h slates the second-sun
seeding (the Apex foreshadow landmark on ordinary runs) to "land with slot 10." **The audit
found its delivery genuinely contradictory (ED-6):** §5h says "seeded at the first Calamity
kill," but under the lifetime ladder, live saves will ALREADY have killed Calamities before
this code exists — so the "first Calamity kill" trigger never re-fires for them. Options:
- **(C1) Out of scope for this PR** *(recommended for v1)*: ship KNELLGRAVE without second-sun
  seeding; leave a §5e/ledger note. Keeps this PR's scope to the bell + the music engine.
- **(C2) In scope**: build the second-sun landmark AND resolve the retrofit trigger — seed on
  LOAD for any save with ≥1 Calamity kill (not only on the kill event). More surface area.

Recommendation **C1** — the second-sun is an Apex (slot 14) dependency; it does not gate
KNELLGRAVE. If C2, the trigger must be seed-on-load, not kill-event, or existing players never
see it. **Model + music-engine work (Part 4) is identical either way — this doesn't block
starting.**

*(Palette is a separate gate — see Part 2.4. Do not let the human pick the candle/amber hues
loosely; they sit near a reserved role color.)*

---

## PART 2 — THE DESIGN ARTIFACTS (paste into BOSS-DESIGN.md as part of the build PR)

### 2.1 — §3b SILHOUETTE TRANSLATION SHEET (fill BEFORE modeling)

> **10 KNELLGRAVE — SILHOUETTE TRANSLATION (§3b):**
> - **Reads as:** a colossal cracked bell hanging from nothing, swinging above you, a bound
>   prisoner inside as its clapper. (Stranger test: "a huge hanging bell with someone inside.")
> - **Carrying cues (2–3, must reach the outline, sized dominant):** (1) the BELL PROFILE — a
>   big flared-lip cracked bell dominating from above; (2) the CHAIN vanishing UP off-frame (it
>   hangs from NOTHING); (3) the BOUND CLAPPER FIGURE glimpsed mid-swing (a living person
>   inside). The jagged CRACK with the vertical candle-slit is the fourth read (and the §3.6
>   scar).
> - **Anti-reads (must NOT read as → forbidden primitives):** NOT a church/generic bell
>   (**forbidden**: a clean symmetric bell with no crack — the crack + candle-slit + bound
>   prisoner make it dread, not a chapel); NOT a dome/UFO (**forbidden**: a bell with no chain
>   and no pendulum motion — the chain + swing make it unmistakably a *hanging* bell); the
>   vertical candle-slit must NOT read as slot 3's HORIZONTAL molten slit (**orientation is the
>   differentiator — label the palette cell "vertical candle slit"**). It must read as SWINGING
>   — pendulum motion is part of the identity.
> - **Lit-edge plan:** the VERTICAL candle-slit through the jagged crack is the ONE focal (a
>   thin HDR box behind the crack — do NOT over-brighten it into a floodlight); the clapper's
>   drooped head catches candlelight mid-swing; the toll-rings are expanding ring-walls (iris
>   inverted) as the lit MOTION cue. Patina-copper body near-black, no body glow beyond the
>   crack.
> - **Scale target (audit add — the L140/L141 fix for an oversize boss):** COLOSSAL, owning the
>   space ABOVE the lane. At rest only the flared LIP + CHAIN dip into frame (**body above
>   y≈22**); you fight looking UP; it is NEVER fully in frame — **overhead dominance IS the
>   scale** (not tri count). Judge presence on the FIGHT-DISTANCE frame: does it loom from above,
>   or sit as a small object in-frame? (If it fits fully in frame, it's too small / too high.)
> - **Home backdrop:** cool/dark sky (so the warm candle-slit is the one focal and the patina
>   copper holds). *(Home biome: Sunken Sanctuary lore-tenant — see Part 2.5 / 3.6.)*

### 2.2 — §4b SEVEN-CHANNEL CHARISMA MAP (⛔ the BLOCKER — faceless; carriers = clapper + slit + toll)

> **10 KNELLGRAVE — §4b carriers:**
> - **GAZE:** the bound clapper's head orientation — drooped/away most of the time (a spent
>   prisoner, not watching), it TILTS TOWARD you when it lifts. The candle-slit "looks" only
>   when the swing brings the mouth to bear.
> - **BLINK-analog:** the candle-slit GUTTERS through the crack (the flame flickers/dims); rate
>   = tension (steady tolling → guttering fast in the final card).
> - **CHARGE-TELL:** the bell WINDS UP — the pendulum arc WIDENS and the candle-slit BRIGHTENS
>   before a toll-volley (the widening swing is the silhouette-change telegraph; the toll-chain
>   ambers are the amber organ, §5i.C.3).
> - **EXPRESSION (≥3 states):** the clapper POSTURE — **drooped** (spent/despair), **lifted
>   toward you** (the dread notice — "someone's in there"), **straining against the straps**
>   (desperation, in The Last Toll) — read off the figure + candle-slit intensity.
> - **FLINCH:** the whole bell RINGS on a hit — a visible reverberation ripple through the bell
>   body, the candle-slit flares, the clapper swings from the impact. "It tolled when struck."
> - **NOTICE (fight start):** the clapper LIFTS ITS HEAD — the drooped head tilts up, straps
>   catching candlelight (the §4b seed: "the roster's darkest notice beat"). *(In the entrance.)*
> - **DEATH:** the bell CRACKS fully (the crack spreads), the candle GUTTERS OUT (the light
>   dies), the clapper's head drops for the last time and goes still, the swing decays to
>   silence. A prisoner and its bell going quiet together. (Mournful — fan art, §4.7.)
> - **GLYPH (doodle test → boss-select chip):** a cracked bell with a small hunched figure
>   inside + the vertical candle-slit.
> - **SCAR (§3.6, one asymmetric):** the jagged CRACK with the candle-slit — the memory hook +
>   the lore gap (what cracked it? who is the light inside?).

### 2.3 — GEOMETRY (buildable translation — primitives, pivots, palette)

Bell = 3 stacked tapered cylinder bands + a flared lip (10 facets); crack seam = jagged
LineSegments + the thin HDR candle-slit box behind it; chain = 3 link tori + LineSegments
vanishing up off-frame (hangs from nothing); clapper = a bound LIVING figure (capsule +
crossing strap boxes + drooped head sphere) visible only mid-swing, on a named
**`clapperPivot`** (the head-lift + strain). Pendulum = one named **`swingPivot`** (the sweep).
Toll-ring emitter at the bell mouth = named **`bellMouth`** (`def.muzzle`). Patina copper
`0x1a2420` / candle `0xffd890` (⚠ GATE C, Part 2.4). **~2.2k tris is the FLOOR** — this is
simple geometry, so per §5g spend the World-Enders surplus (tier-4 budget 14k–22k) on the
CLAPPER FIGURE + bell relief/ornament + the toll-ring spectacle, NOT on faceting a smooth
bell. **Grandeur = scale + overhead dominance + the survival-toll spectacle, never tri count.**
REUSES: iris/ring-wall pattern kernel (the toll-rings), torus chain-link + shackle precedent
(bossBrineholm slot 8), `getBeatClock`, `ui.bossWarning` top-banner dir, `bossKit`. NEEDS
(you build — Part 2.6): audio-foreshadow seam, `musicKill()/musicRestore()`, beat-quantized
ticketing; verify overhead/off-lane sweep bounds.

### 2.4 — ⛔ PALETTE — FLAG FOR THE COLOR GATE, DO NOT GUESS (audit finding)

The candle `0xffd890` (hue ≈39°) sits ~5° from the shipped **parry-amber organ hue** (`0xffa838`,
≈34° — THRUMSWARM's queen-eye). KNELLGRAVE hosts the **RHYTHM PARRY CARD**, so amber bullet
chains will be read against the candle-lit slit + clapper. **Separate candle from amber by a
VALUE/SATURATION tier** (candle is paler/warmer; keep the amber bullets more saturated) and
verify with `node tests/bulletcontrast.mjs` + `node tools/bossgate.mjs knellgrave` (G3). **If
the candle drifts toward the parry-amber band, or any hue lands near a reserved role color
(danger magenta / parry amber / reflected cyan / surge pink), STOP and ask the human.** Do not
finalize these hexes yourself.

### 2.5 — THE DEF (add to `bossDefs.js`; append `'knellgrave'` to `BOSS_ORDER`)

Model on a shipped tier-3/4 def. DECIDED fields:
```
id: 'knellgrave', name: 'KNELLGRAVE', title: 'the Bound Toll',
epithet: 'It Rings for What It Buried',   // §5f lore gap: who is bound as the clapper?
archetype: 'boundBell',                   // new string; dispatch in bossModel.js
tier: 4,                                  // WORLD-ENDER band OPENER → sits at the band FLOOR
hpMax: 480,                               // WE band 480–560; the opener sits LOW (sawtooth)
approachFrom: 'top',                      // overhead; the entrance is a scripted ENTRANCE_SCRIPTS beat
muzzle: 'bellMouth',                      // emitter = organ (§5f law 7); the toll origin
grazeForm: 'shrinkDisc',                  // SHRINKING SAFE DISC (⚠ Part 2.6: reuse the slot-6 detector)
scale: <colossal — TUNE in studio so only lip+chain dip in at rest, body above y≈22>,
accent: <candle — Part 2.4, GATE>,  glow: <candle — Part 2.4, GATE>,
bulletColor: 0xff2b6a,                    // danger magenta — role color
bpm: <the toll bpm — §5h optional def.bpm for rhythm slots>,
```
Phases — MUSIC-LOCKED, an ACCELERATING toll; precision + rhythm (`iris` = the toll ring-walls;
`aimed`/`crossfire`/`fan` are the amber carriers). **⚠ Keep an amber carrier in EVERY phase's
`attacks` — including the survival phase — or the amberdiet CI gate fails (Part 5, the trap):**
```
phases: [
  { atFrac: 1.00, cadence: [1.4, 1.7], attacks: ['iris', 'aimed'] },              // P1: the first tolls
  { atFrac: 0.55, cadence: [1.3, 1.6], attacks: ['iris', 'crossfire', 'aimed'] }, // P2: RHYTHM PARRY card (amber chain on the beat)
  { atFrac: 0.25, cadence: [1.2, 1.5], attacks: ['iris', 'fan', 'aimed'] },       // P3: The Last Toll (survival) — 'aimed' stays for amberdiet
]
```
Cards (5–6 for WE; `<EPITHET FRAGMENT> — <plain pattern>`; exactly one `dread:true`, LAST):
```
cards: [
  { id: 'knellgrave_first',  name: 'IT RINGS — The First Toll',  atFrac: 1.00, timer: 24 },
  { id: 'knellgrave_second', name: 'IT RINGS — The Second Toll', atFrac: 0.70, timer: 26 }, // the RHYTHM PARRY card: a 4–6 amber chain on the toll
  { id: 'knellgrave_sweep',  name: 'IT RINGS — Pendulum Sweep',  atFrac: 0.45, timer: 26 },
  { id: 'knellgrave_last',   name: 'IT RINGS — The Last Toll',   atFrac: 0.25, timer: 30, dread: true, survival: true }, // nine accelerating tolls; pure-dodge; the clapper's FULL reveal (Part 6)
]
```
Rhythm — **MUSIC-LOCKED** (`signature: 'music-locked'`): the toll is the only clock; attacks
quantize to `getBeatClock`'s accelerating beat. The accelerating toll IS the fingerprint (must
clear `rhythmprint` KS ≥ 0.20 vs all others, incl. slot 11's SYNCOPATED LOOM — both are
quantized grids, so make the ACCELERATION the differentiator).

### 2.6 — THE ENGINE SCOPE (World-Enders opener — you build these; coexist-safe, inert for others)

1. **Audio-foreshadow seam** — a `getBossEta()` getter (**confirmed absent on master; you are
   its first real consumer — land it here**) + a distance-triggered scheduler so the toll plays
   a biome early. *(BIOME-DESIGN.md already earmarks this: KNELLGRAVE's toll is the Sunken
   Sanctuary's `audio` foreshadow channel through `sfx.js`.)* Degrade gracefully on rush re-entry.
2. **`musicKill()` / `musicRestore()`** — hard-zero the `musicBus` via the existing `bgSuspend`
   silence path (`sfx.js`); restore under the defeat fanfare AND on `resetBoss` AND on skip
   (Part 4). This is the music-death rule-break.
3. **Overhead / off-lane sweep bounds** — ⚠ **audit correction:** the shipped cull already has a
   +y CEILING of 34 (`bossBullets.js`: `s.y > 34`), which covers a bell at y≈24, so the overhead
   extension is likely SMALLER than "extend the bounds" implies. The real risk is the
   PERPENDICULAR sweep's X-origin (culled past `laneHalfWidth + 10`) and toll-rings born
   off-lane. **Verify** which bound actually clips the sweep before widening anything; widen only
   what the sweep needs, def-gated.
4. **Attack-ticket quantization to `getBeatClock`** (the music-locked ticketing).
5. **Everything default-OFF for existing bosses** (byte-identical legacy path).

---

## PART 3 — DOC FIXES TO LAND IN THE SAME PR (settled — just do them)

**3.1** Registry parry-job cell (§5b row 10): change `—` to `RHYTHM PARRY CARD (WE debut,
§5i.C) — the toll-chain ambers are the carrier`.
**3.2** Add the GRAZE FORM line to the §5d sheet as anatomy: "GRAZE FORM — SHRINKING SAFE DISC:
the toll ring-walls are the anatomy; ride the shrinking safe disc through escalating ticks,
bail on the last beat; offered once per phase."
**3.3** §5d NEEDS line — add the items the doc lands WITH slot 10 that were missing: audio-
foreshadow seam + `getBossEta()`, `musicKill()/musicRestore()`, TRICK-LINE LINKING (§5i.B meta
spine), and (per Decision C) the second-sun note.
**3.4** §5j engine-cost ledger: fix the `getBossEta` landing — the audit found §5j's header
default assigns it to shipped slot 5; correct it to **"lands with slot 10, its first consumer."**
**3.5** ⛔ **Survival-card amberdiet exemption (§5i.C law 1)** — add the exemption clause so The
Last Toll is sanctioned, not a violation: "Exemption: survival cards (10, 13 — boss sealed,
pure dodge) carry no live amber; the amberdiet law's spirit is met by the phase's amber-carrier
attack list, and the runtime seal is a sanctioned exception." *(This is SOP task G7; it makes
the doc honest about what Part 5's trap works around.)*
**3.6** §5b Home-biome + VOICE cells for row 10 (backfill from BIOME-DESIGN.md — no invention):
Home-biome = **"Sunken Sanctuary (lore-tenant — the toll is its audio foreshadow)"**; VOICE =
**"the toll — a struck-bell partial, low register, the accelerating knell as signature noise;
music DEAD (the rule-break)."**
**3.7** Lore (§5b): the clapper is a **LIVING prisoner** (it lifts its head, it reacts) — the
deliberate split from slot 12 ONEWING (a carried CORPSE/ghost). 10 = living captive, 12 =
carried dead. Register "who is bound as the clapper?" as the open thread. No stale references
to retired concepts.

---

## PART 4 — THE BUILD PIPELINE (CP1.0 Fable → CP1 model+studio+Fable → CP2 wire+Fable → owner)

**CP1.0 — ⛔ PRE-BUILD FABLE SHEET SIGN-OFF (before any geometry — Fable spawn #1):** after the
human approves the §3b sheet, spawn an independent **Fable agent via the Agent tool** with the
§3b laws + KNELLGRAVE's sheet (2.1) + this task — *"Independent design gate. Run the §3b
STRANGER TEST in prose: does the described black-fill silhouette read, in ~2 seconds with zero
context, as a HANGING BELL WITH SOMEONE INSIDE — and NOT as a plain church bell, NOT a dome/UFO?
Confirm the bell profile + off-frame chain + bound clapper each reach the outline, the
candle-slit is clearly VERTICAL (distinct from slot 3's horizontal), and it reads as SWINGING.
Verdict PASS / FIX."* Fix the sheet until Fable PASSes before modeling.

**CP1 — the model (studio-gated):**
1. `bossDefs.js`: add the def (2.5), append `'knellgrave'` to `BOSS_ORDER`.
2. New `reforged/js/bossKnellgrave.js`: `export function buildKnellgrave(def, quality = 1)`.
   Compose on `createBossCommon(...)` from `bossKit.js`. Parts on an inner `rig` (NEVER animate
   the root — `placeGroup` owns `group.rotation`, `setDissolve` owns `group.scale`). **Every
   material through `kit.track()`.** Name the telegraph pivots (`swingPivot`, `clapperPivot`,
   `bellMouth`).
3. `bossModel.js`: one dispatch line — `if (def.archetype === 'boundBell') return
   buildKnellgrave(def, quality);`.
4. Return the handle contract (§6.4): `{ group, muzzle, orbiters(≥2, tick-animated),
   setDissolve, setCharge, setHealth, setHealthBarVisible, setShieldVisible, shatterShield,
   flash, tick(dt,time), dispose }` + `setGaze`/`notice()`. Wrap kit methods to layer emotion
   (`setDissolve`→the crack-spread + candle-guttering death, `flash`→the bell-ring flinch,
   `setCharge`→the swing widens + slit brightens, `notice()`→the clapper head-lift).
5. **Merge gotchas** (`mergeGeometries` returns null silently): strip `uv`+`uv2` via
   `bossKit.stripForMerge` and REASSIGN, `toNonIndexed()`, bake transforms pre-merge.
6. **STUDIO GATE (§7c):** `node tools/bossstudio.mjs knellgrave` → judge on the **cool/dark
   (home) backdrop FIRST**, then the black-fill + lit-edge renders (stranger test + anti-reads),
   then the **fight-distance frame for OVERHEAD DOMINANCE** (does it loom from above / never sit
   fully in frame? — the L140/L141 check). Then `node tools/bossgate.mjs knellgrave` (G1–G7;
   note any sanctioned oversize/top-framing gate override — an overhead boss will read outside
   G4's centered 8–35% box, so a `gate:{presence}` override citing the §5b "owns the space above"
   sanction is expected). Iterate the MODEL.
7. **⛔ CP1 FABLE DESIGN GATE (Fable spawn #2 — silhouette FIRST, before the beauty pass):** spawn
   a fresh Fable agent with the black-fill/lit-edge/fight-distance renders + the bossgate output
   — *"Independent design gate, silhouette first. Black-fill: stranger test = hanging bell with a
   bound figure inside? Anti-reads present (plain bell / dome)? Bell + off-frame chain + clapper
   in the OUTLINE? Candle-slit clearly VERTICAL (distinct from slot 3)? Fight-distance: does it
   DOMINATE FROM ABOVE, never sitting fully in frame? Lit-edge: is the candle-slit the ONE focal
   (not a floodlight)? Verdict PASS / FIX; do not pass a failed stranger test."* Fix the MODEL and
   re-gate until PASS. Only then the beauty pass.
8. **POST CROPS + STOP FOR THE OWNER.** Post the studio sheets (idle · `notice()` · `setCharge(1)`
   · shielded · death) + black-fill/lit-edge + fight-frame + Fable's verdict, and STOP for the
   owner's green-light. You never proceed to CP2 on your own verdict.

**CP2 — wire the live fight (separate commit, after the CP1 owner green-light):**
9. Phases/cards/rhythm fire; `bellMouth` emits (aim solves against its `rel`); the MUSIC-LOCKED
   rhythm quantizes to `getBeatClock` and passes `rhythmprint`; the entrance *It Lifts Its Head*
   runs (biome-early toll via the new `getBossEta`; the music DIES on the warn-end toll via
   `musicKill()`; the top banner; the overhead perpendicular cross; the clapper head-lift at the
   apex; body stays above y≈22).
10. **The engine (2.6): `musicKill`/`musicRestore`, audio-foreshadow, beat-quantized ticketing,
    the verified sweep bounds.** Music must RESTORE on defeat fanfare, `resetBoss`, AND skip.
11. **The fairness-twin law (critical — no gate enforces it):** every fairness-bearing cue has a
    synchronized VISUAL twin (the toll-ring pulse). A muted/deaf player must lose ZERO
    information when the music is dead. Verify this explicitly in-engine.
12. **THE AWE FIX — the mid-fight clapper re-reveal (audit note; do NOT skip):** the audit rated
    this fight "entrance-heavy, fight-light — the clapper never returns." Fix it via §5j law 10's
    free re-entrance: during **The Last Toll**, the crack GAPES, the candle-slit goes HDR-wide,
    and the clapper is FULLY revealed straining at its straps (its EXPRESSION state 3). The
    survival dread is not just a rhythm exam — it is the prisoner's mid-fight reveal.
13. **Entrance skip line (audit gotcha):** on skip — the bell snaps to station, the slow-mo
    releases (the leak gotcha: `releaseCineSlow` must fire on skip AND window-exit AND
    `resetBoss`), and **the music STAYS dead** (skip must not restore it mid-fight).
14. **⛔ CP2 FABLE INTEGRATION GATE (Fable spawn #3):** capture in-game (`?debug&boss=100&bossIdx=9`,
    `?rush=all`), then spawn a fresh Fable agent — *"Judge ONLY integration, not design. Check:
    the music genuinely DIES and stays dead (restores on defeat + reset + skip) with the toll-ring
    VISUAL twin carrying ALL fairness info; attacks quantize to the toll so the fight reads as
    rhythmic; the biome-early toll foreshadows and degrades on rush re-entry; the overhead
    perpendicular sweep + toll-rings originate above/off-lane without being culled; The Last Toll
    is a fair pure-dodge exam with a working timer AND the clapper's full mid-fight reveal lands;
    the bell DOMINATES FROM ABOVE (never sits fully in frame); the RHYTHM-PARRY chain parries
    on-beat; candle vs amber-bullet contrast holds; the ladder controller advances the run without
    regressing shipped bosses; HUD/title/banner collisions; full loop + death. Verdict PASS / FIX
    per item."* Resolve or explicitly re-defer each FIX.
15. Re-run all suites, post the in-game crops + Fable's verdict, and **STOP for the owner's final
    motion/feel call before the PR leaves draft.**

---

## PART 5 — VERIFICATION, ACCEPTANCE, GATES, DONE-WHEN

**Run (from `reforged/`), all green before each checkpoint:**
- `node tests/boss.mjs` — extend with your named-pivot telegraph check (`swingPivot` moves the
  silhouette; `clapperPivot`/`bellMouth` exist); TIER_BUDGETS tier-4; `amberdiet` +
  `rhythmprint`.
- `node tests/bossboot.mjs` — zero console errors + zero untracked-material warnings.
- `node tests/defs.mjs`, `node tests/bossrush.mjs`.
- `node tests/bulletcontrast.mjs` — candle vs amber-bullet (Part 2.4).
- **A NEW test** asserting `musicKill()` silences the bus and `musicRestore()` restores it on
  defeat AND reset (the music-death rule-break must be provably reversible).
- `node tools/bossgate.mjs knellgrave` (G1–G7) · `node tools/bossstudio.mjs knellgrave` · `node
  tools/tricount.mjs` / `tiershots.mjs`.
- `node tests/run-all.mjs` — full suite green (proves coexist: the other 9 bosses byte-unchanged).
- `node tools/stamp-sw.mjs` — **in the same commit** as any js/css/html change.

**⛔ THE AMBERDIET TRAP (read before authoring phases):** `tests/boss.mjs` `amberdiet` iterates
`def.phases[].attacks` and asserts EACH phase (a) `hasAmberCarrier` and (b) fires amber ≤12s in
the sim. The survival dread (The Last Toll) is pure-dodge at RUNTIME, but the test reads the
PHASE attacks, not the card's runtime seal — **so KEEP an amber carrier (`aimed`) in the survival
card's underlying phase attack list and the CI passes.** Do NOT strip amber to "make it pure
dodge" — that trips the gate for no benefit (the card's dials shape the actual survival pattern
at runtime). The doc-level caveat (the amber floor isn't truly served during the ~28s seal) is
sanctioned by the §5i.C exemption you add in Part 3.5.

**Acceptance checklist:**
- [ ] Studio black-fill passes the stranger test ("hanging bell, someone inside") + every 2.1 anti-read avoided.
- [ ] Fight-frame shows OVERHEAD DOMINANCE (looms from above, never fully in frame).
- [ ] `swingPivot` moves the silhouette on `setCharge`; all named pivots exist.
- [ ] `musicKill`/`musicRestore` test passes; music restores on defeat + reset + skip.
- [ ] Fairness-twin verified: toll-ring visual carries all info with sound off.
- [ ] `amberdiet` + `rhythmprint` + tier-4 tri gate pass; full suite green.
- [ ] Candle hue cleared of the amber/role bands (or human signed off — Part 2.4).
- [ ] Part 3 doc fixes landed (parry cell, graze line, NEEDS, getBossEta landing, amberdiet exemption, biome/VOICE, lore split).
- [ ] The Last Toll delivers the clapper's mid-fight full reveal (the awe fix).
- [ ] Crops + Fable verdicts posted; stopped for the owner (CP1 studio, then CP2 in-game).

**⛔ GATES you cannot self-certify past (Fable gates; the owner owns the final call):**
- Decision A (§3b sheet) — human approval **+ pre-build Fable sign-off (spawn #1)** before geometry.
- Decision B (§4b map — THE BLOCKER) — human sign-off before geometry.
- Decision C (second-sun scope) — human answer before you build any second-sun code.
- Palette (Part 2.4) — human sign-off if candle/amber drift near a role band.
- CP1 studio verdict — **Fable design gate (spawn #2)**, then the owner green-lights on crops.
- CP2 integration verdict — **Fable integration gate (spawn #3)**, then the owner's final call before the PR leaves draft.
- Every Fable spawn is an INDEPENDENT Agent-tool agent (fresh, no build context).

**DONE-WHEN:** CP1 + CP2 verdicts passed by the human; registry row 10 flipped `open → shipped`
(claim `open → claimed` in your first commit); §5d entry carries the approved sheet/map/geometry;
**append a LEAPFROG lesson** (e.g. "KNELLGRAVE: the music-dead boss lives or dies on the
fairness-twin — every toll cue needs a visual pulse; the survival card is the clapper's mid-fight
REVEAL, not a rhythm exam; amberdiet reads phase attacks, not card seals") and **add it to §9**.

---

## PART 6 — GUARDRAILS / DO-NOT-BREAK + WHY THIS BOSS EXISTS

- **Never touch the other shipped bosses' defs/builders/dials, or slot 9's rows/lines** (see
  Concurrency). KNELLGRAVE is additive: a new def + `bossKnellgrave.js` + one dispatch line + the
  def-gated music/audio engine.
- **The music/audio-foreshadow/overhead-bounds changes are INERT for defs that don't opt in** —
  shipped bosses stay byte-identical. Prove it: full suite green + boot each boss in bossstudio.
- **`boss.js` needs ZERO changes for the MODEL.** The engine work touches `sfx.js` (musicKill via
  bgSuspend), a `getBossEta` getter, and possibly a def-gated cull-bound widen — all coexist-safe.
- **Do not restore the music mid-fight** (skip must keep it dead) and **do not leave the slow-mo
  leaked** on skip/window-exit/reset (`releaseCineSlow`).
- **Do not build the second-sun landmark unless Decision C = C2** (and then seed on LOAD, not the
  kill event).
- **Do not finalize palette near reserved role colors.** Propose, test, ask.
- **Do not invent lore.** "Who is the clapper" stays open.
- **Do not merge on your own verdict.** Fable gates, then the owner STOPs you — twice.
- Never `git stash` / `git checkout --` / `git reset`; foreground commands only; do not self-merge
  or flip the PR out of draft. Commit trailer per the repo convention; keep model identifiers out
  of commits/PRs/artifacts.

**WHY THIS BOSS EXISTS (weight your build + the Fable/owner gates on these two beats):**
1. **The music-death must LAND as dread, not as "quieter."** When the toll becomes the only clock,
   the silence should feel like a held breath — the whole fight organized around a single
   accelerating pulse, every cue mirrored visually so a muted player loses nothing. If the music
   just fades and combat continues normally, the rule-break is wasted.
2. **The fight must not be entrance-heavy/flat (the audit's core note).** The roster-best entrance
   spends the bell's best image in 3 seconds; the FIGHT earns its keep only if the bound clapper
   RETURNS — the mid-fight full reveal on The Last Toll (straining at the straps as the crack
   gapes) is what converts a rhythm exam into the fight's second "holy shit." Build for that beat;
   judge the preview on whether it lands.

---

### Appendix — audit findings folded in (what changed vs the source prompt)
- **§4b seven-channel map (2.2)** — the audit's ONE formal BLOCKER for slot 10; the source prompt
  had only the head-lift NOTICE.
- **Amberdiet trap (Part 5) + the §5i.C survival exemption (3.5)** — a real CI gate interaction the
  source prompt didn't flag.
- **The mid-fight clapper re-reveal (CP2 step 12 / Part 6)** — the audit's named fix for slot 10
  being "entrance-heavy, fight-light."
- **Candle-vs-amber palette clearance (2.4)** — candle `0xffd890` ≈5° from the shipped parry-amber
  organ, while KNELLGRAVE hosts the RHYTHM PARRY CARD.
- **Second-sun retrofit-trigger hazard (Decision C)** — the "first Calamity kill" trigger won't
  re-fire for live saves; seed-on-load if in scope.
- **getBossEta landing fix (3.4) + overhead-cull correction (2.6)** — the +y ceiling is already 34;
  the sweep's X-bound is the real question, likely smaller than "extend the bounds."
- **Home-biome/VOICE backfill (3.6)** — grounded in BIOME-DESIGN.md (Sunken Sanctuary lore-tenant).
- Scale target, skip line, pivot names, NEEDS-line items, TTK — the doc-completeness gaps the audit
  logged for slot 10.

This brief is the slot-10 slice of the execution SOP from the 2026-07 BOSS-DESIGN audit. It is
self-contained; you do NOT need the full SOP to build KNELLGRAVE.
