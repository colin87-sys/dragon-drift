# BUILD BRIEF — BOSS 11: WEFTWITCH, the WORLD-ENDERS weaver

**Standalone handoff.** Open a fresh Claude Code session in the `dragon-drift` repo, paste this
file, work it top to bottom. It merges a strong pre-written build prompt with the 2026-07
boss-design audit; **where they differ, the audit wins** (flagged inline). The design work that
would block the build — the §4b charisma map (the audit's formal BLOCKER for this slot), the
scar, the palette clearance — is resolved below.

WEFTWITCH is a **Tier-4 (World-Enders)** boss — a hooded radial weaver at the hub of a web that
fills the arena, who re-weaves *everything, even the game's chrome*. Her band-break is *"the
HUD breaks"*: her threads sew across the UI. Her presence is the arena-spanning WEB, not her
body mass (L141 — the field is the body).

---

## PART 0 — ORIENTATION (read first)

1. **Read `LEAPFROG.md`'s THE RULE**, then the §9 boss lessons — at minimum **L150** (the
   silhouette betrays the mesh), **L140/L141** (presence = span × lit-edge area; for
   field/ensemble bosses the FIELD is the body — decisive here), **L121** (the render-order
   LAW: nothing draws over a bullet — her rule-break lives or dies on this), **L164/L165**
   (BRINEHOLM — silhouette judged at the FIGHT frame).
2. **Read `reforged/BOSS-DESIGN.md`**: §3 laws (esp. §3.6 the one-scar law), §3b silhouette
   translation, §4b charisma-carrier law, §5b registry row 11 + the lore web, §5c WORLD-ENDERS
   contract ("the lane breaks" — 10 the soundtrack, **11 the HUD chrome**, 12 the arrival
   grammar, 13 the horizon), §5d slot-11 sheet + ENTRANCE, §5f (her dread + the granted HUD-sew
   rule-break + the render-order LAW), §5g budgets, §5h economy, §5i (rhythm SYNCOPATED LOOM /
   graze CANCEL-CONVERT MOTE HARVEST / parry thread-cut stagger), §5j entrance *The Mended
   Banner* + uniqueness rulings, §6 recipe, §7/§7b/§7c verification + the Studio Gate.
3. **The shipped quality bar**: `bossIdol.js` … `bossBrineholm.js` (slot 8 — its CP1→CP2 split
   is the pattern). Also read **`reforged/js/ui.js`** (the HUD chrome + `bossWarning` + the
   z-index/render layering — her rule-break sews across it) and **`reforged/js/boss.js`** (the
   fight loop, `getBeatClock`, the shipped `approachFrom` branches, the `renderTiers` law).
4. **The iron law**: coexist → prove on a hero → migrate; never break the shipped roster;
   **verify before claiming**. A boss is DATA + one builder file.
5. **Studio-first law (§7c) + the Fable gate**: judged in the studio FIRST, in-game SECOND.
   **You never self-judge — you spawn an independent Fable agent (via the Agent tool) as the
   gate**, fix what it flags, THEN post crops and STOP for the human owner. **Three Fable
   spawns** (Part 4): the §3b PRE-BUILD sheet sign-off, the CP1 studio design gate, the CP2
   integration gate. Fable gates; the owner owns the final call.

### Concurrency with slots 9 & 10
Slot 11 may be built **concurrently with slots 9 (KARNVOW) and 10 (KNELLGRAVE)**; no
merge-order dependency. You don't consume slot 9's reflect-seal engine or slot 10's music
engine. **Branch from current master** (slot 8 merged). Shared files — `bossDefs.js` (append
your def + your id to `BOSS_ORDER`), `bossModel.js` (one dispatcher line), `tests/boss.mjs`,
the §5b/§5d/§5i/§5j rows, `LEAPFROG.md` — are **additive: only append YOUR entries, never touch
another slot's.** Expect a mechanical conflict when a sibling merges; whoever merges later
rebases and re-appends. Do NOT reorder `BOSS_ORDER`.

**Branch & baseline:**
```
git fetch origin && git checkout -b claude/boss-11-weftwitch origin/master
cd reforged && node tests/run-all.mjs        # record the green baseline in your first message
```

### Engine you CONSUME (already on master — do not re-implement)
`getBeatClock()` + phrase machine (`bossRhythm.js`) + `ENTRANCE_SCRIPTS` (slot 5); the ladder
controller + continuous-graze ticking detector + NO-HIT ADRENALINE LADDER (slot 6); the widened
cull bounds; the `rhythmprint`/`amberdiet` gates. **⚠ AUDIT CORRECTION: the `above` approach
branch AND the `top` warning-banner direction are ALREADY SHIPPED** (`boss.js` — `approachFrom
=== 'above'` at ~:1012, mapped to the `top` banner at ~:1076). Your source prompt said to
"build/finalize" these; that is stale (audit finding #35). **You just set `approachFrom:
'above'` in the def — do NOT re-implement it.** Her genuine net-new engine is the HUD-sew +
banner-pin + web (Part 2.6).

---

## PART 1 — ⛔ THREE HUMAN DECISIONS BEFORE ANY GEOMETRY

> **§3b/§4b: the sheet + charisma map must exist AND be signed off BEFORE geometry. Paste
> A/B/C to the human, collect answers, THEN start Part 4.**

**DECISION A — Approve the §3b silhouette translation sheet** (Part 2.1). *The source prompt
already had a strong six-field sheet; the audit adds the scar and tightens the anti-spider /
anti-KARNVOW reads.* Then the **PRE-BUILD Fable sign-off (spawn #1)** before any geometry.

**DECISION B — Approve the §4b seven-channel charisma map + glyph** (Part 2.2). **This is the
audit's formal BLOCKER for slot 11** — the doc/source had only "hands = face, tempo = mood";
§4b makes a sheet missing any of the seven channels "not claimable." Her two pale hands are the
face. I've drafted all seven + the scar; the human confirms.

**DECISION C — ⛔ PALETTE (the rose-triple + magenta clearance — a GATE-C human call).** The
doc's proposed rose accent `0xd88098` (hue ≈344°) sits **~1.4° from danger magenta `0xff2b6a`
(≈342°)** — inside the reserved ±15° band. It passes the shipped gate only because rose's
saturation (~0.41) is under the gate's 0.5 threshold — **but WEFTWITCH's focal is the
laserLance HDR thread-FLASH, which saturates PAST 0.5 and would trip G3**, and rose threads
near bullet-magenta hue rendered *below* the bullets are a legibility hazard. Also, slots
11/12/13 all lean rose (the World-Ender rose-triple). **The fix (already in your source prompt,
now the recommendation): push WEFTWITCH's accent OFF pure rose toward PALE-GOLD / MOON-WHITE.**
This simultaneously clears the magenta band AND resolves the 11-vs-12 rose collision (11 becomes
gold/white lines, 12 stays near-black rose trace, 13 stays bright rose field — the triple
separates cleanly). The human confirms the exact hue; the builder proposes hexes and verifies
with `bulletcontrast.mjs` + `bossgate.mjs` G3. **Do not finalize a near-magenta rose yourself.**

*(Scope note, not a blocker — resolve with the owner during CP2, see Part 2.6: `laserLance` has
NO existing attack-vocabulary id (there is no beam/laser pattern in `bossDefs.js`). It is
therefore a candidate for the World-Enders band's ONE new-attack-id budget (§5b: ≤1 new id per
band). Confirm whether it's a genuine new id or a re-expression of an existing pattern with a
beam VISUAL — if it's the band's new id, 12's ghost-bullets and 13's beam-duel must be
re-expressions.)*

---

## PART 2 — THE DESIGN ARTIFACTS (paste into BOSS-DESIGN.md as part of the build PR)

### 2.1 — §3b SILHOUETTE TRANSLATION SHEET (fill BEFORE modeling)

> **11 WEFTWITCH — SILHOUETTE TRANSLATION (§3b):**
> - **Reads as:** a hooded, legless weaver-bust at the hub of a radiating web that spans the
>   whole arena. (Stranger test: "a hooded weaver at the centre of a web.")
> - **Carrying cues (2–3, must reach the outline, sized dominant):** (1) the hooded TRIANGULAR
>   MANTLE bust (no legs — a shroud) with 2 pale weaving HANDS; (2) the 6 radial SPINNERET
>   limbs fanning out; (3) the WEB — taut threads radiating to off-screen anchors, filling the
>   frame. **The FIELD (the web) is the presence** (L141).
> - **Anti-reads (must NOT read as → forbidden primitives):** NOT a SPIDER (**forbidden**: the
>   6 limbs read as bug legs — keep them elegant/mechanical spinneret-ARMS, on graceful pivots,
>   never insectoid; NO 8-legged radial symmetry, NO crouched body); NOT a generic witch/cloak
>   (**forbidden**: a featureless robe — the spinnerets + web + pale hands make her specific);
>   NOT KARNVOW (slot 9, also hooded — **forbidden**: a lance or a single dominant diagonal;
>   WEFTWITCH is a LEGLESS bust with radial limbs + a web, unmistakable in the outline).
> - **Lit-edge plan:** the focal is the taut thread pulled tight and FLASHED HDR (the
>   laserLance — the brightest moment) + a restrained accent glow at the loom-heart/hands; the
>   WEB is overdraw-exempt LineSegments (the lit "drawing" that fills the arena). Moth-grey body
>   near-black. **Accent (⚠ Decision C): OFF pure rose → pale-gold / moon-white**; rosette-knot
>   patterns carry the accent, not the body.
> - **Scale target:** the BODY is medium (a bust), but the WEB is arena-spanning — presence is
>   the threads filling the screen (L141: the field is the body). She descends from ABOVE.
> - **Home backdrop:** a mid/light sky (so the moth-grey bust + accent threads read). *(Home
>   biome: Astral, tenant — see Part 3.6.)*

### 2.2 — §4b SEVEN-CHANNEL CHARISMA MAP (⛔ the BLOCKER — faceless; her HANDS are the face)

> **11 WEFTWITCH — §4b carriers:**
> - **GAZE:** her two pale HANDS are the face — they hover/orient toward the lane she's about
>   to stitch (where the hands work = where she "looks"); the hood's dark aperture tilts to
>   follow, with LAG (snap-orient reads as a turret; lagged hands read as a mind at a loom).
> - **BLINK-analog:** a micro-pause in the weaving — the hands still for a beat between stitches
>   and the loom-heart glow dips; rate = tension.
> - **CHARGE-TELL:** the hands PULL a thread TAUT and it flashes AMBER before firing as the
>   laserLance (the amber ORGAN, §5i.C.3; the taut thread is a new hard line = a silhouette
>   change).
> - **EXPRESSION (≥3 states):** weaving TEMPO — **measured** (calm, slow weave), **agitated**
>   (fast stitching under pressure), and **hands STILL** (the §4b seed: hands still = dread —
>   the stillness before the re-weave). Read off hand tempo + hood tilt.
> - **FLINCH:** the web SHUDDERS and the hands RECOIL on a hit — a ripple runs the threads, the
>   loom-heart flares.
> - **NOTICE (fight start):** the hands STOP and one long pale finger points straight DOWN at
>   the dragon *(in the entrance)*.
> - **DEATH:** the hands fall OPEN and slack, the web goes limp and drifts DOWN (un-weaving —
>   her mended arena comes undone), the loom-heart dims last. A weaver whose work unravels.
>   (Mournful — fan art, §4.7.)
> - **GLYPH (doodle test → boss-select chip):** two pale hands raised over a radial web.
> - **SCAR (§3.6, one asymmetric — audit add: slot 11 had NONE):** ONE snapped/withered
>   spinneret limb — she works with 5, the 6th hangs dead and threadless. The memory hook + the
>   lore gap: it is the limb that would have mended the one tear she cannot fix. *(Lore web: her
>   un-mended tear → slot 14's entry wound — Part 3.6.)*

### 2.3 — GEOMETRY (buildable translation — primitives, pivots, palette)

Mantle bust = hooded triangular shroud (extrude, no legs) with 2 pale HANDS only — **spec the
hands concretely** (the CRAGHOLD "mitten-fingers" lesson: named finger segments, not a blob —
they are her FACE, they must articulate). 6 radial spinneret limbs = 2-segment tapered tubes on
named pivots **`spinneretPivot0..5`** (one snapped = the scar). WEB = taut LineSegments spanning
the arena to off-screen anchors (overdraw-exempt), on **`threadPivot`s**; gaps visibly stitch
shut between waves (thread redraw); the laserLance = one thread pulled tight → HDR flash; rosette
= woven rosette knots; **`loomHeart`** = the restrained accent glow at the hub. Moth-grey
`0x1e1c22` / accent per Decision C. **~1.8k tris is the FLOOR — go ALL OUT toward the tier-4
gate; see §2.7 for the budget & grandeur directive.** Threads are cheap LineSegments; spend the
surplus on the mantle detail + the 6 spinneret limbs + the rosette-knot patterns (put LORE in the
knots) + the hands, NOT filler. **Grandeur = the arena-spanning web + the HUD-sew, never tri
count.** REUSES: LineSegments web idiom, `getBeatClock`, the shipped `approachFrom:'above'` +
`top` banner, `bossKit`. NEEDS: HUD-sew overlay + banner-pin (Part 2.6); the above-approach is
SHIPPED (do not rebuild).

### 2.4 — ⛔ PALETTE (see Decision C — do not finalize yourself)

Accent OFF pure rose → pale-gold/moon-white; rosette-knots carry it; verify the accent AND every
HDR thread-flash clears danger-magenta (`bulletcontrast.mjs` + `bossgate.mjs` G3). If any hue
lands near a reserved role color (danger magenta / parry amber / reflected cyan / surge pink),
STOP and ask.

### 2.5 — THE DEF (add to `bossDefs.js`; append `'weftwitch'` to `BOSS_ORDER`)

```
id: 'weftwitch', name: 'WEFTWITCH', title: 'the Mender',
epithet: 'She Mends What You Break',       // §5f; lore gap: the tear she can't mend (→ slot 14)
archetype: 'weftwitch',                     // new string; dispatch in bossModel.js
tier: 4,                                    // WORLD-ENDER band
hpMax: <WE band 480–560; place per the §5b sawtooth position — mid-band, not the opener/peak>,
approachFrom: 'above',                      // SHIPPED branch — she descends on a single thread
muzzle: <the loom-heart or a spinneret tip — the emitter organ, §5f law 7>,
grazeForm: 'moteHarvest',                   // CANCEL-CONVERT MOTE HARVEST (⚠ reuse the slot-6 detector)
scale: <medium bust — TUNE in studio; presence is the WEB, not the body>,
accent: <pale-gold/moon-white — Decision C, GATE>,  glow: <same family>,
bulletColor: 0xff2b6a,                      // danger magenta — role color
```
Phases — SYNCOPATED LOOM (off-beat accents; threads land BETWEEN the beats). Keep an amber
carrier in every phase (the taut pre-fire threads; amberdiet floor). Draft precision + lattice
patterns (`curtain`/`movingGap`/`aimed`/`crossfire`) re-expressed as thread-visualised gaps;
tune until `amberdiet` + `rhythmprint` pass.
Cards (5–6 for WE; `<EPITHET FRAGMENT> — <plain pattern>`; one `dread:true`, LAST):
```
cards: [
  ... 4–5 lattice/thread cards ...,
  { id: 'weftwitch_warpweft', name: 'SHE MENDS — Warp and Weft', atFrac: <low>, timer: 30, dread: true },
]
```
Dread — **"SHE MENDS — Warp and Weft"**: the whole arena re-woven in one pass — every lane
stitches shut except the one her hands never touched (the anti-flee dread; its counter is
reading which lane the hands AVOID — a lattice read, and a graze goldmine).
Rhythm — **SYNCOPATED LOOM** (`signature: 'syncopated-loom'`): a quantized grid with off-beat
accents. Author `def.rhythm` so `rhythmprint` passes (KS ≥ 0.20 vs all, incl. slot 10's
MUSIC-LOCKED — both quantized, so the OFF-BEAT ACCENTS are the differentiator; state the REST
look per the rest-beat law: **her hands keep time silently, weaving without firing — the rest is
a visible measured weave, not a pause**).

### 2.6 — THE ENGINE SCOPE (net-new; coexist-safe, inert for other bosses)

1. **HUD-sew overlay system** — DOM/SVG threads that stitch across the HUD chrome, layered
   ABOVE the chrome and BELOW the bullets (**the render-order LAW — never over gameplay
   bullets**; ui.js uses z-index — place the sew below the bullet tier). Her granted rule-break.
2. **Banner-pin / stitched-over variant of `bossWarning`** — `suppressAutoHide` + a stitched-over
   state; **cleared on skip AND `enterFight` AND `resetBoss`** (leak-guard).
3. **The web system (model-side)** — taut off-screen-anchored LineSegments, gap-restitch redraw
   between waves, the laserLance HDR flash.
4. **⚠ `laserLance` attack-id decision** (Decision C scope note) — confirm with the owner whether
   it's a NEW attack id (spending the WE band's ≤1-new-id budget) or a re-expression of an
   existing pattern with a beam visual. Wire accordingly; record the choice in §5b.
5. **`approachFrom:'above'` is SHIPPED — do NOT build it.** (Audit correction.)
6. **Everything default-OFF for existing bosses** (byte-identical legacy path).

### 2.7 — ⛔ BUDGET & GRANDEUR (go ALL OUT — the World-Enders directive)

**Owner directive: World-Enders SPEND THE HARDWARE.** Push toward the tier-4 gate (**22k tris /
90 draws**); the §5d ~1.8k figure is a FLOOR, not a target. Spend it on IDENTITY, never filler
(the KNELLGRAVE precedent: the win was a lore-bearing relief + a world-state tell, not
ornament-for-ornament).

**The measured ceiling (why you can go all out — L124/L126, a real weak phone):**
- **Triangles are ~free**: the phone held ~400k tris @ 59fps. A 22k WEFTWITCH + a ~12k dragon +
  env + a future ~5k dragon-relic + bullets is a small fraction of that. Tris are NOT your
  constraint.
- **Draws are the tighter axis** (~415 animated @ 58fps): stay under the 90-draw gate; the
  whole-frame worst case (boss + dragon + ~5 bullet draws + relic + env) still sits well under
  415, but draws — not tris — are where a crowded frame shows first.
- **Overdraw is the ONLY real killer** (a 32fps cliff): **≤2 large additive/fresnel volumes on
  screen, INCLUDING the kit shield.** Absolute, and it is YOUR main risk (below).
- **Everything else is accounted for**: bullets = 4 instanced draws regardless of count (~free);
  one dragon ~6k HIGH / ~12k ULTRA; the planned post-defeat dragon-relic reserves ~5k / ~10 draws
  as SEPARATE meshes (never InstancedMesh — L126); the second-sun landmark ~200 tris. None
  contends with you.

**WHERE to spend it (identity-bearing grandeur, not filler):**
- **The WEB as spectacle** — the field IS the body (L141). Arena-filling, many-anchored, visibly
  RE-STITCHING between waves (gaps sewing shut). This is your grandeur and it's cheap
  (LineSegments, overdraw-exempt) — go wide.
- **The mantle + 6 spinnerets + rosette-knots** — dense woven detail; put LORE in the rosettes
  (motifs of what she's mended; the one tear she can't).
- **The HUD-sew incursion** (the band-break) — the arena's chrome being re-woven is grander than
  any body mass.
- **The world-state beat** — the arena visibly WOVEN and re-woven around the player (§5c "the
  lane breaks"): safe lanes stitching shut is the anti-flee dread AND the spectacle.

**⛔ THE OVERDRAW TRAP (your #1 risk — budget FX in SHELL COUNT, not tris):** the web threads are
LineSegments (exempt — spend freely). But the **laserLance HDR flash, the loom-heart glow, and the
mote-harvest blooms are additive** — and during the dread re-weave the kit SHIELD is up (1 shell
already). A big laserLance flash + a big loom glow + the shield = 3 large additive volumes = the
cliff, while costing almost nothing in tris. Keep every glow bounded/thin (rim-shaped fresnel,
small discs strictly BEHIND the silhouette, or line-based flashes). **Run the G7 overdraw check
with the shield up + the biggest laserLance + the re-weave all firing at once** — that is the
frame that decides it, and your tri counter will wave it through.

**Quality scaling**: whatever you spend at q1, the web density + spinneret/rosette detail must
DROP at q0.5 (`tris(q0.5) < tris(q1)` gate; web-anchor count + knot density are your lowQ dials).
A dense pass is exactly where this gets forgotten.

**Keep the sawtooth**: do NOT ask to raise the tier-4 gate — THE UNMASKED (30k / 120) must
out-grand every World-Ender at the summit. 22k is plenty; you're nowhere near it.

---

## PART 3 — DOC FIXES TO LAND IN THE SAME PR (settled — just do them)

**3.1** Registry parry-job cell (§5b row 11): change `—` to `THREAD-CUT → STAGGER (§5i.C) — a
taut thread flashes amber pre-fire; cut/parry it staggers her + deletes that laserLance volley`.
Add the matching entry to the §5i.C ladder.
**3.2** GRAZE FORM line in the §5d sheet (as anatomy): "GRAZE FORM — CANCEL-CONVERT MOTE
HARVEST: cut threads are the anatomy; a cut thread blooms into falling surge-motes — steer the
bloom to harvest; offered once per phase."
**3.3** §5d NEEDS line — correct it: the above-approach + top banner are SHIPPED (remove them);
what remains is the HUD-sew overlay + banner-pin (land with this slot, §5j).
**3.4** Add the §3.6 SCAR to the sheet (the snapped 6th spinneret) — slot 11 had none (audit #55).
**3.5** §5b Home-biome + VOICE cells for row 11 (backfill from BIOME-DESIGN.md — no invention):
Home-biome = **"Astral (tenant)"**; VOICE = **"needle-pull + plucked-string — a taut-thread
pluck per stitch, mid register, the loom's syncopated ticking as signature noise."**
**3.6** Lore (§5b lore web): register **"11's un-mended tear → slot 14's entry wound"** (her one
un-mendable thread, tied to the snapped spinneret scar). She re-weaves everything, even the
chrome (the band-break); her banner fires ON TIME then is attacked — deliberately distinct from
slot 12's absence-then-eruption (keep her banner legible before the stitch — the §5j ruling). No
stale references to retired concepts.
**3.7** §5b principle-10 rose-family ruling (if not already landed by a sibling slot): 11 =
pale-gold/moon-white LINES on grey · 12 = near-black rose trace · 13 = bright full-frame rose
field — name each slot's separating axes (Decision C resolves 11's).

---

## PART 4 — THE BUILD PIPELINE (CP1.0 Fable → CP1 model+studio+Fable → CP2 wire+Fable → owner)

**CP1.0 — ⛔ PRE-BUILD FABLE SHEET SIGN-OFF (before any geometry — Fable spawn #1):** after the
human approves the §3b sheet, spawn an independent **Fable agent via the Agent tool** with the
§3b laws + WEFTWITCH's sheet (2.1) + this task — *"Independent design gate. Run the §3b STRANGER
TEST in prose: does the described black-fill silhouette read, in ~2 seconds with zero context,
as a HOODED WEAVER AT THE HUB OF A WEB — and NOT a spider, NOT a generic witch, NOT KARNVOW (a
hooded duelist with a lance)? Do the 6 radial limbs read as elegant SPINNERET-ARMS, not bug
legs? Does the WEB fill the field (the presence)? Confirm the hooded bust + hands + web each
reach the outline. Verdict PASS / FIX."* Fix the sheet until PASS before modeling.

**CP1 — the model (studio-gated):**
1. `bossDefs.js`: add the def (2.5), append `'weftwitch'` to `BOSS_ORDER`.
2. New `reforged/js/bossWeftwitch.js`: `export function buildWeftwitch(def, quality = 1)`.
   Compose on `createBossCommon(...)`. Parts on an inner `rig` (NEVER animate the root —
   `placeGroup` owns rotation, `setDissolve` owns scale). **Every material through
   `kit.track()`.** Name the pivots (`spinneretPivot0..5`, `threadPivot`s, `loomHeart`).
3. `bossModel.js`: one dispatch line — `if (def.archetype === 'weftwitch') return
   buildWeftwitch(def, quality);`.
4. Return the handle contract (§6.4): `{ group, muzzle, orbiters(≥2, tick-animated), setDissolve,
   setCharge, setHealth, setHealthBarVisible, setShieldVisible, shatterShield, flash, tick(dt,time),
   dispose }` + `setGaze`/`notice()`. Wrap kit methods to layer emotion (`setDissolve`→the web
   un-weaving + hands falling slack, `flash`→the web-shudder flinch, `setCharge`→a thread pulls
   taut + flashes amber, `notice()`→hands stop + one finger points down).
5. **Merge gotchas** (`mergeGeometries` returns null silently): strip `uv`+`uv2` via
   `bossKit.stripForMerge` and REASSIGN, `toNonIndexed()`, bake transforms pre-merge. **Web
   threads are LineSegments (overdraw-exempt) — NEVER large additive volumes.**
6. **STUDIO GATE (§7c):** `node tools/bossstudio.mjs weftwitch` → judge on the **mid/light (home)
   backdrop FIRST**, then the black-fill + **LIT-EDGE renders (critical here — the web threads
   ARE the silhouette)**, then the fight-distance frame for FIELD presence (does the web fill the
   frame, or is she a small bust in space? — the L141 check). Then `node tools/bossgate.mjs
   weftwitch` (G1–G7; the accent must clear G3's danger-magenta band — Decision C). Iterate the
   MODEL.
7. **⛔ CP1 FABLE DESIGN GATE (Fable spawn #2 — silhouette FIRST, before the beauty pass):** spawn
   a fresh Fable agent with the black-fill/lit-edge/fight-distance renders + the bossgate output —
   *"Independent design gate, silhouette first. Black-fill: stranger test = hooded weaver + web?
   Anti-reads present (spider / generic witch / KARNVOW)? Do the radial limbs read as elegant
   SPINNERETS, not bug legs? Lit-edge: does the WEB fill the field (the presence)? Is the accent
   OFF the rose-triple (pale-gold/moon-white, clear of magenta)? Verdict PASS / FIX; do not pass a
   failed stranger test or an insectoid read."* Fix the MODEL and re-gate until PASS. Only then the
   beauty pass.
8. **POST CROPS + STOP FOR THE OWNER.** Post the studio sheets (idle · `notice()` · `setCharge(1)`
   · shielded · death) + black-fill/lit-edge + fight-frame + Fable's verdict, and STOP for the
   owner's green-light. You never proceed to CP2 on your own verdict.

**CP2 — wire the live fight (separate commit, after the CP1 owner green-light):**
9. Phases/cards/rhythm fire; the muzzle emits; SYNCOPATED-LOOM rhythm passes `rhythmprint`; the
   entrance *The Mended Banner* runs (below).
10. **The entrance (§5j — spends her ONE rule-break):** ambient ~2s, fully playable — thin
    threads lace across the HUD chrome (DOM/SVG stitches ABOVE the chrome, BELOW the bullets —
    render-order LAW), needle-pull sfx. The `top` banner slides in on time and is **LEGIBLE
    FIRST** (so slot 12's total silence still shocks — the §5j ruling), then a thread LASHES
    across it, cross-stitching the epithet mid-word; the banner pins half-deployed, quivering
    (`suppressAutoHide`; cleared on skip/`enterFight`/`resetBoss`). Hijack: HARD CUT to the loom
    reveal (the thread exits BEHIND the banner — UI↔world registration must be drift-free for zero
    frames): she hangs small at frame top, thread-fan widening to full width; the hands STOP; one
    finger points DOWN. She drops the single thread to station; the stitched banner tears free; the
    HUD returns PRE-STITCHED at settle; a plucked-string note per thread. **The fight never
    re-stitches a second banner — the HUD-sew is spent here.**
11. **The engine (2.6): HUD-sew (render-order-safe), banner-pin (clears on skip/reset), the web
    (gap-restitch between waves, laserLance HDR flash).** Confirm the `laserLance`-id decision is
    wired per Decision C.
12. **The thread-cut parry + mote-harvest graze**: a taut thread flashes amber → cut/parry it
    staggers her and deletes that laserLance volley; cut threads bloom into steerable motes.
13. **⛔ CP2 FABLE INTEGRATION GATE (Fable spawn #3):** capture in-game (`?debug&boss=100&bossIdx=10`,
    `?rush=all`), then spawn a fresh Fable agent — *"Judge ONLY integration, not design. Check: the
    HUD-sew threads stitch over the chrome but NEVER over bullets (render-order LAW); the banner is
    LEGIBLE before it's stitched (so 12's silence still lands); the entrance hard-cut has no
    UI↔world registration drift; the web spans the arena and gaps visibly re-stitch between waves;
    the laserLance reads as a thread pulled tight then flashed; the thread-cut parry staggers her +
    deletes that volley; the mote-harvest graze blooms and steers; the accent is off-rose and
    bullet contrast holds (clears danger-magenta); the ladder controller advances the run without
    regressing shipped bosses; banner-pin clears on skip/reset; full loop + death. Verdict PASS /
    FIX per item."* Resolve or explicitly re-defer each FIX.
14. Re-run all suites, post the in-game crops + Fable's verdict, and **STOP for the owner's final
    motion/feel call before the PR leaves draft.**

---

## PART 5 — VERIFICATION, ACCEPTANCE, GATES, DONE-WHEN

**Run (from `reforged/`), all green before each checkpoint:**
- `node tests/boss.mjs` — extend with your named-pivot telegraph check (a `spinneretPivot` moves
  the silhouette on `setCharge`; the pivots exist); TIER_BUDGETS tier-4; `amberdiet` + `rhythmprint`.
- `node tests/bossboot.mjs` — zero console errors + zero untracked-material warnings.
- `node tests/defs.mjs`, `node tests/bossrush.mjs`.
- `node tests/bulletcontrast.mjs` (+ confirm the accent AND the HDR thread-flash clear
  danger-magenta — Decision C).
- **A NEW test** asserting the HUD-sew never renders above the bullet layer (render-order LAW) AND
  the banner-pin clears on `resetBoss`.
- `node tools/bossgate.mjs weftwitch` (G1–G7) · `node tools/bossstudio.mjs weftwitch` · `node
  tools/tricount.mjs` / `tiershots.mjs`.
- `node tests/run-all.mjs` — full suite green (proves coexist: the other bosses byte-unchanged).
- `node tools/stamp-sw.mjs` — **in the same commit** as any js/css/html change.

**Acceptance checklist:**
- [ ] Studio black-fill passes the stranger test ("hooded weaver + web") + every 2.1 anti-read avoided (esp. NOT a spider).
- [ ] Lit-edge render: the WEB fills the field (L141 presence held); she is not a small bust in space.
- [ ] A `spinneretPivot` moves the silhouette on `setCharge`; the snapped-spinneret scar is present; all pivots exist.
- [ ] HUD-sew test passes (never above bullets); banner-pin clears on skip/reset.
- [ ] Accent is off-rose (pale-gold/moon-white); accent + HDR flash clear danger-magenta (or human signed off — Decision C).
- [ ] `amberdiet` + `rhythmprint` + tier-4 tri gate pass; full suite green.
- [ ] Went ALL OUT toward the 22k gate on identity-bearing detail (§2.7); q0.5 drops below q1.
- [ ] **Overdraw check (§2.7): G7 passes with the shield up + the biggest laserLance flash + the re-weave all firing at once (≤2 large additive volumes incl. the shield).**
- [ ] The `laserLance`-id decision is made + recorded (Part 2.6 / §5b).
- [ ] Part 3 doc fixes landed (parry cell, graze line, NEEDS correction, scar, biome/VOICE, lore tie, rose ruling).
- [ ] Crops + Fable verdicts posted; stopped for the owner (CP1 studio, then CP2 in-game).

**⛔ GATES you cannot self-certify past (Fable gates; the owner owns the final call):**
- Decision A (§3b sheet) — human approval **+ pre-build Fable sign-off (spawn #1)** before geometry.
- Decision B (§4b map — THE BLOCKER) — human sign-off before geometry.
- Decision C (palette — the rose/magenta call) — human sign-off before the accent lands.
- CP1 studio verdict — **Fable design gate (spawn #2)**, then the owner green-lights on crops.
- CP2 integration verdict — **Fable integration gate (spawn #3)**, then the owner's final call before the PR leaves draft.
- Every Fable spawn is an INDEPENDENT Agent-tool agent (fresh, no build context).

**DONE-WHEN:** CP1 + CP2 verdicts passed by the human; registry row 11 flipped `open → shipped`
(claim `open → claimed` in your first commit); §5d entry carries the approved sheet/map/geometry;
**append a LEAPFROG lesson** (e.g. "WEFTWITCH: the field IS the body — a medium bust reads huge
because the web fills the frame; the HUD-sew lives or dies on the render-order LAW; her hands are
the face, so they had to articulate like a rig, not a mitten") and **add it to §9**.

---

## PART 6 — GUARDRAILS / DO-NOT-BREAK + WHY THIS BOSS EXISTS

- **Never touch the other bosses' defs/builders/dials, or a sibling slot's rows/lines** (see
  Concurrency). WEFTWITCH is additive: a new def + `bossWeftwitch.js` + one dispatch line + the
  def-gated HUD-sew/banner-pin/web engine.
- **The HUD-sew / banner-pin are INERT for defs that don't opt in** — shipped bosses byte-identical.
- **`boss.js` needs ZERO changes for the MODEL.** The above-approach is already shipped; her engine
  work is ui.js (HUD-sew, banner-pin) + the model-side web.
- **The render-order LAW is absolute**: the HUD-sew stitches ABOVE the chrome, NEVER above a
  gameplay bullet. A test asserts it. This is the whole legitimacy of the rule-break.
- **Web threads are LineSegments (overdraw-exempt), never additive volumes.**
- **Do not finalize palette near reserved role colors** (esp. the near-magenta rose). Propose, test, ask.
- **Do not re-implement the above-approach or the top banner** (shipped).
- **Do not invent lore.** The tear she can't mend points at slot 14; that's the only lore beat — don't add more.
- **Do not merge on your own verdict.** Fable gates, then the owner STOPs you — twice.
- Never `git stash` / `git checkout --` / `git reset`; foreground commands only; do not self-merge
  or flip the PR out of draft. Commit trailer per repo convention; keep model identifiers out of
  commits/PRs/artifacts.

**WHY THIS BOSS EXISTS (weight your build + the Fable/owner gates on these two beats):**
1. **The HUD-sew must feel like the GAME ITSELF is being attacked, safely.** Threads crossing the
   chrome — the banner cross-stitched mid-word — should read as "she's reaching out of the arena
   into my interface," while the render-order LAW guarantees gameplay is never actually
   obstructed. If the sew reads as a decorative overlay rather than an incursion, the band-break is
   wasted. It fires ONCE, at the entrance — make that one moment land.
2. **She must read HUGE while being a medium bust (the L141 trap).** Her presence is the
   arena-spanning WEB, not her body. If the fight-frame shows a small figure with thin threads,
   she's failed — the web must fill the field and the gaps must visibly re-stitch, so the arena
   itself feels woven and re-woven around you. **Judge her grandeur on the IN-GAME field-frame,
   NOT the studio bust sheet** — the studio auto-frames and centers her, so she will always look
   like a modest hooded figure there; her scale exists only in the arena, where the web fills the
   frame. Green-light the design on the studio sheet; judge the grandeur on the in-game web.

---

### Appendix — audit findings folded in (what changed vs the source prompt)
- **§4b seven-channel map + the §3.6 SCAR (2.2)** — the audit's formal BLOCKER for slot 11 (only
  "hands = face" existed) + slot 11 had no scar (finding #55); the snapped 6th spinneret is drafted.
- **Above-approach is SHIPPED, not to-build (Part 0 / 2.6 / 3.3)** — audit finding #35; the source
  prompt's "build/finalize the above-approach" is stale. Her real engine is HUD-sew + banner-pin + web.
- **Palette: the exact rose/magenta collision (Decision C / 2.4)** — rose `0xd88098` is ~1.4° from
  danger `0xff2b6a`; the laserLance HDR flash is the sat>0.5 G3-trip case; the pale-gold shift also
  resolves the 11/12/13 rose-triple.
- **`laserLance` = candidate new-attack-id (Decision C / 2.6)** — no beam/laser exists in the
  vocabulary; it may be the WE band's ≤1-new-id spend (then 12/13 must be re-expressions).
- **Home-biome (Astral tenant) + VOICE backfill (3.6)** — grounded in BIOME-DESIGN.md.
- **Lore-web tie (3.6)** — her un-mended tear → slot 14's entry wound.
- **SYNCOPATED-LOOM rest description (2.5), named pivots + hands primitive spec (2.3)** — the
  doc-completeness gaps the audit logged for slot 11.
- **§2.7 BUDGET & GRANDEUR — go all out (new)** — the owner's World-Enders "spend the hardware"
  directive + the KNELLGRAVE-session budget learnings: tris are ~free (400k phone ceiling), draws
  are the tighter axis, **overdraw (additive-shell count) is the real killer for an FX-heavy boss**,
  everything-else (bullets/dragon/future dragon-relic) is accounted for, q0.5 must scale, keep the
  sawtooth. Judge grandeur on the in-game field-frame, not the studio bust.

This brief is the slot-11 slice of the execution SOP from the 2026-07 BOSS-DESIGN audit. It is
self-contained; you do NOT need the full SOP to build WEFTWITCH.
