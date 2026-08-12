# BUILD BRIEF — BOSS 13: EMBERTIDE — the World-Enders SPATIAL PEAK (the 2nd-last boss)

**Standalone handoff.** Open a fresh Claude Code session in the `dragon-drift` repo, paste this
file, work it top to bottom. It merges a strong pre-written build prompt with the 2026-07
boss-design audit; **where they differ, the audit wins** (flagged inline). The design work that
would block the build — the §4b charisma map (the audit's BLOCKER), the geometry spec + hexes, the
scar + lore gap, the value-inversion gate override — is resolved below.

**EMBERTIDE is the horizon standing up** — a frame-wide tide of light with a colossal FACE surfacing
through it as dark negative relief. It is the **World-Enders SPATIAL PEAK**: the whole backdrop
becomes the enemy; it never fits the frame. It quotes Stormrend (the gale was its leash) and sets up
the Apex by contrast — **13 is the sky in maximum MOTION; 14 is the sky perfectly STILL.** This is
the **2nd-to-last boss in the entire game**: it must be the most cinematic fight before the finale,
so the Apex's stillness hits twice as hard. **Go all out.**

---

## PART 0 — ORIENTATION

1. **Read `LEAPFROG.md`'s THE RULE** + the §9 boss lessons, esp. **L124/L126** (overdraw is the ONLY
   real perf cliff — CRITICAL here, you have 3+ frame-wide additive planes), **L140/L141**
   (presence/scale), **L150** (silhouette translation — this is the HARDEST case in the roster).
2. **Read `reforged/BOSS-DESIGN.md`**: §3b silhouette translation (non-negotiable; §3-law-2 is
   INVERTED for this slot — the focal is DARKNESS), §4b charisma-carrier law, §5b registry row 13 +
   the lore web, §5c WORLD-ENDERS contract ("the lane breaks" — 13's break is the HORIZON/BACKDROP
   itself), §5d slot-13 sheet + ENTRANCE, §5f (its survival dread + the vertical-squeeze), §5g
   budgets, §5i (rhythm CRESCENDO SETS / graze TIDE-EDGE / parry BEAM DUEL), §5j entrance *The Sky
   Comes Loose* + uniqueness rulings, §6 recipe, §7b bossgate (you add sanctioned gate overrides) +
   §7c Studio Gate.
3. **The shipped quality bar**: `bossMandala.js` (Stormrend, slot 2 — EMBERTIDE quotes it, "the gale
   was its leash") and any builder using `bossGradeTarget` / the fog-exempt sky-dome pattern. Read
   **`reforged/js/environment.js`** (the sky dome + fog-exempt pattern you reuse) and the arena
   constriction in **`boss.js`** (`arenaHW`/`arenaTargetHW` — today it only narrows X; you add the Y
   axis).
4. **The iron law**: coexist → prove on a hero → migrate; never break the shipped roster; **verify
   before claiming**. A boss is DATA + one builder file.
5. **Studio-first + the Fable gate**: judged in the studio FIRST, in-game SECOND. **You never
   self-judge — you spawn an independent Fable agent (via the Agent tool) as the gate**, fix what it
   flags, THEN post crops and STOP for the human owner. **Three Fable spawns** (Part 4): the §3b
   PRE-BUILD sheet sign-off (STRESSED here — see below), the CP1 studio design gate, the CP2
   integration gate.

### Concurrency with slots 9 / 10 / 11 / 12
May be built concurrently. **Soft dependency**: the biome-early sky-grade wants `getBossEta()` (built
by slot 10 KNELLGRAVE — CONFIRMED not yet on master). If it isn't merged, DEGRADE to a warn-start
grade (`bossGradeTarget` fires there regardless) and note the upgrade. Otherwise independent. **Branch
from current master** (slot 8 merged). Shared files (`bossDefs.js` `BOSS_ORDER` + def, `bossModel.js`
dispatcher, `tests/boss.mjs`, the §5b/§5d/§5i/§5j rows, `LEAPFROG.md`) are **additive: only append
YOUR entries; whoever merges later rebases.** Do NOT reorder `BOSS_ORDER`.

**Branch & baseline:**
```
git fetch origin && git checkout -b claude/boss-13-embertide origin/master
cd reforged && node tests/run-all.mjs        # record the green baseline in your first message
```

### Engine you CONSUME (already on master — do not rebuild)
`getBeatClock()` + phrase machine (slot 5); the ladder controller + continuous-graze detector +
adrenaline ladder (slot 6); `bossGradeTarget` (shipped); the `'horizon'→'top'` banner dir mapping;
the `rhythmprint`/`amberdiet` gates. Soft-consume `getBossEta()` (slot 10) for the biome-early grade
(degrade gracefully).

---

## PART 1 — ⛔ THREE HUMAN DECISIONS BEFORE ANY GEOMETRY

> **§3b/§4b: the sheet + charisma map must exist AND be signed off BEFORE geometry. Paste A/B/C to
> the human, collect answers, THEN start Part 4.**

**DECISION A — Approve the §3b silhouette translation sheet** (Part 2.1) + the **STRESSED** pre-build
Fable sign-off (spawn #1). This is the HARDEST silhouette read in the roster (the identity is
NEGATIVE — dark relief in bright light), so the Fable test is explicit: *"does this read as a FACE
surfacing from the horizon, or just a pretty gradient?"* Fix the sheet until the face is unmistakable.

**DECISION B — Approve the §4b seven-channel charisma map + glyph** (Part 2.2). **This is the audit's
BLOCKER for slot 13** — only the MEDIUM was seeded (the negative-space eye-hollows, a recorded
§3-law-2 exception); BLINK/CHARGE-TELL/EXPRESSION/FLINCH/DEATH were unstated. The face-relief +
eye-hollows + the tide are the carriers. I've drafted all seven + the scar; the human confirms.

**DECISION C — ⛔ VALUE INVERSION + PALETTE + GATE OVERRIDE (a GATE-C human call).** EMBERTIDE flips
the design laws: the "body" is the BRIGHT field, the focal/identity is the DARKNESS. Three coupled
items the human signs off: (1) the vermilion→rose gradient HEX endpoints + the dark-relief hex (the
registry cell currently has NO hexes — audit gap); (2) the **§7b gate override** — a NEW override
beyond the shipped `gate.pale` (MARROWCOIL's): invert G1 to a DARK-focal check, exempt G2/G4
(frame-filling), cited to the registry VALUE-INVERSION sanction; (3) **bullet contrast is the INVERSE
problem** — the danger-magenta bullets must read against a BRIGHT vermilion→rose field, and the rose
END of the gradient must itself clear danger-magenta (verify with `bulletcontrast.mjs`). **If the
rose end drifts into danger-magenta, or the bullets vanish against the bright field, STOP and ask.**

*(Scope note, not a blocker: BEAM DUEL is Surge-fed, not a parry read — the audit (ED-8) flags it sits
in the wrong economy's ladder and makes the World-Enders band debut TWO parry mechanics (10 + 13)
against the doc's ≤1-per-band header. Confirm with the owner: keep BEAM DUEL as 13's SURGE mechanic +
serve the amberdiet floor with a separate parryable crest-lock volley, OR amend the header. Either
way, an amber-carrier attack must sit in every phase — Part 5 amberdiet.)*

---

## PART 2 — THE DESIGN ARTIFACTS (paste into BOSS-DESIGN.md as part of the build PR)

### 2.1 — §3b SILHOUETTE TRANSLATION SHEET (fill BEFORE modeling — the highest-risk sheet in the roster)

> **13 EMBERTIDE — SILHOUETTE TRANSLATION (§3b, INVERTED):**
> - **Reads as:** the horizon standing up — a frame-wide wall of light with a colossal FACE pushing
>   through it. (Stranger test: "a giant face surfacing from a wall of light" — NOT "a sunset.")
> - **Carrying cues (must reach the read):** (1) the frame-wide light bands overflowing BOTH portrait
>   edges (the whole horizon — never a discrete object); (2) the FACE as DARK NEGATIVE relief pushed
>   through the glow (brow / nose / chin masses — dark-on-bright, the inverse of every other boss);
>   (3) the two EYE-HOLLOWS tearing open as darkness in the light.
> - **Anti-reads (must NOT read as → forbidden):** NOT a plain sky gradient / pretty sunset
>   (**forbidden**: a smooth uninterrupted gradient — the FACE must be unmistakable; if it reads as
>   just a gradient it has FAILED — the audit's exact warning for this slot); NOT BRINEHOLM (slot 8
>   also "a face surfaces" — but 8 is a SOLID leviathan HEAD that breaches; 13 is a face pushed
>   through a WALL OF LIGHT as dark NEGATIVE relief — solid-head vs negative-relief is the clean
>   split, hold it); NOT a discrete object at all.
> - **Lit-edge plan (INVERTED):** the "body" is the BRIGHT field (vermilion→rose bands); the
>   identity/focal is the DARKNESS — the dark face + the eye-hollows. **This is a sanctioned VALUE
>   inversion — add the §7b gate override (Decision C / Part 2.6).**
> - **Scale target:** FRAME-WIDE / the entire backdrop — overflows both portrait edges, never fits
>   (the SPATIAL peak; not measured in units). The escalation guard: it must never fit the frame.
> - **Home backdrop:** it REPLACES the sky — it IS the backdrop. Judge it in-situ as the
>   sky-replacement (render the studio with EMBERTIDE as the dome) against the game's real bloom
>   pipeline. *(Home biome: NONE — it's a world-state EVENT that grades ANY biome; Part 3.5.)*
> - **SCAR (§3.6, one asymmetric — audit add: 13 had NONE):** a torn, permanently DARK NOTCH in ONE
>   band — the LEASH-COLLAR mark. The memory hook + the forward lore gap: *who/what leashed EMBERTIDE?*
>   (It quotes Stormrend "the gale was its leash" — EMBERTIDE was itself leashed by something greater
>   → the Apex. Register the thread; Part 3.6.)

### 2.2 — §4b SEVEN-CHANNEL CHARISMA MAP (⛔ the BLOCKER — the face-relief + eye-hollows + tide carry it)

> **13 EMBERTIDE — §4b carriers (the focal is DARKNESS — the sanctioned §3-law-2 exception):**
> - **GAZE:** the two EYE-HOLLOWS track the dragon (they "settle on the dragon" — the face turns its
>   dark regard toward you); the face's orientation in the field.
> - **BLINK-analog:** a band of light momentarily FILLS the eye-hollows (the light closes over the
>   dark = a blink), or the whole face dims/surges on a tide pulse; rate = tension.
> - **CHARGE-TELL:** the FACE SURGES FORWARD — it pushes further out of the light, the relief
>   DEEPENING (brow/nose/chin more pronounced) + the tide crest gathers/brightens before a big
>   volley. The face emerging more IS the telegraph (a silhouette change).
> - **EXPRESSION (≥3 states):** how far the face is pushed through the light — **submerged** (barely
>   there, just a brow), **surfacing/looming** (fully through, brow+nose+chin), and **the eye-hollows
>   WIDENING** (wrath/dread). Read off the relief depth + eye-hollow size.
> - **FLINCH:** the whole light field SHUDDERS + a band ripples on a hit; the face recoils back into
>   the glow briefly.
> - **NOTICE (fight start):** the eye-hollows TEAR OPEN and settle on the dragon *(in the entrance)*.
> - **DEATH:** the tide RECEDES — the light drains, the face SINKS back below the horizon line, the
>   eye-hollows close, the bands drop to the ground line. The sky finally SETS; the horizon lies back
>   down. (Awe/mournful — the sky going out; a strong fan-art beat, §4.7.)
> - **GLYPH (doodle test → boss-select chip):** two dark almond eye-hollows + a brow, in a band of
>   light (a face in a sunset).

### 2.3 — GEOMETRY (buildable translation — primitives, pivots, hexes; audit fix: 13's sheet was the thinnest)

The horizon attacks: **frame-wide light-bands** (long flat planes, additive, staggered z, UNstacked
vs camera → inside the overdraw cap ONLY because they REPLACE the sky) — spec the count (start 3,
push MORE for a deeper, layered tide — Part 2.7; watch overdraw). The **FACE** = opaque dark relief
masses pushed through the glow, on named pivots: a **`browMass`** (a wide low arc box/wedge), a
**`noseMass`** (a central vertical wedge), a **`chinMass`** (a lower arc), **temple/cheek** masses for
cohesion (a richer face reads as a FACE, not a gradient — spend here); the two **`eyeHollow`** pivots
(dark almond cutouts that TEAR open — construct as opaque dark shapes riding the band, or true
negative-space cut-throughs; decide and name the method). The tide **`crestPivot`** (the surge
edge). Vertical constriction: ceiling/floor light-bands close in (`arenaTargetHY` — Part 2.6). The
bands are **fog-exempt** (the sky-dome pattern: `material.fog=false`, camera-relative). **HEXES
(audit fix — add them):** vermilion `<hex>` → rose `<hex>` gradient (Decision C — the rose end must
clear danger-magenta); relief-dark `<hex>` (near-black, the face). **~1.2k tris is the FLOOR — but
see §2.7: this boss spends its budget in LIGHT + FACE + the SQUEEZE, not faceted filler.** NEEDS:
vertical constrict + full-frame emitter rows (you build these).

### 2.4 — ⛔ PALETTE + THE VALUE-INVERSION GATE OVERRIDE (see Decision C — do not finalize yourself)

Vivid vermilion→rose (the "fire tide") — deliberately distinct from the rest of the rose-triple (11
pale-gold, 12 ashen). Add the §7b gate override (a NEW override beyond `gate.pale`): G1 → a DARK-focal
check (the darkest cluster in the field is the focal, not the brightest), G2/G4 exempt (frame-filling,
sanctioned value inversion) — cite the registry sanction in the override comment. Verify: the magenta
bullets read against the BRIGHT field (the inverse contrast problem), and the rose end clears
danger-magenta. If either fails, STOP and ask.

### 2.5 — THE DEF (add to `bossDefs.js`; append `'embertide'` to `BOSS_ORDER`)

```
id: 'embertide', name: 'EMBERTIDE', title: 'the Sky Set Loose',
epithet: <points the leash gap → Apex, e.g. 'What Even the Sky Obeyed'>,
archetype: 'embertide',                      // new string; dispatch in bossModel.js
tier: 4,                                      // WORLD-ENDER band (the spatial peak)
hpMax: <WE band 480–560; place per the §5b sawtooth — the band PEAK sits HIGH (~540–560)>,
approachFrom: 'horizon',                       // → 'top' banner via the shipped mapping
gate: { inverted: true, frameFill: true },     // ⚠ Decision C — the value-inversion override (NEW; cite the sanction)
muzzle: <the tide crest / band rows — full-frame emitters, Part 2.6>,
grazeForm: 'tideEdge',                          // TIDE-EDGE + FACE-SHADOW POCKET (reuse the slot-6 detector)
scale: <FRAME-WIDE — it's the backdrop; not a unit scale (tune the band spans to overflow both edges)>,
accent: <vermilion→rose — Decision C, GATE>,  glow: <same field>,
bulletColor: 0xff2b6a,                         // danger magenta — role color (must read on the BRIGHT field)
```
Phases — CRESCENDO SETS (Stormrend's ramp QUOTED in repeating wave-sets, each cut harder). **Keep an
amber carrier in EVERY phase — including the survival card's phase — or amberdiet CI fails (Part 5).**
Cards (5–6 for WE; `<EPITHET FRAGMENT> — <plain pattern>`; one `dread:true`, LAST):
```
cards: [
  ... 4–5 crescendo/tide cards; the FIRST crescendo set fires the vertical-squeeze + letterbox as a NORMAL beat (a re-entrance) ...,
  { id: 'embertide_horizonbreak', name: 'SKY SET LOOSE — Horizon Break', atFrac: <low>, timer: 30, dread: true, survival: true },
]
```
Dread — **"SKY SET LOOSE — Horizon Break"** (a SURVIVAL card, the roster's SECOND with slot 10): the
tide crests the WHOLE frame; the only safe pocket is where the FACE is — hide in its shadow; the timer
is the escape hatch. *(Audit clarity: 13's ONE survival card = this final Horizon Break crest; the
first-set vertical squeeze is a NORMAL beat, not a second survival card.)*
Rhythm — **CRESCENDO SETS** (`signature: 'crescendo-sets'`): echoes Stormrend deliberately but must
still pass `rhythmprint` (KS ≥ 0.20 vs all, incl. Stormrend — the REPEATING SETS + the harder cut are
the differentiator); state the REST look (between sets the tide DRAWS BACK — a visible low ebb, the
breath before the next crest).

### 2.6 — THE ENGINE SCOPE (you build these; coexist-safe, inert for other bosses)

1. **Vertical constriction (new Y-axis)** — ceiling/floor bands close in; the arena today only narrows
   X (`arenaHW`/`arenaTargetHW`, boss.js). Add `arenaHY`/`arenaTargetHY`. **Default-OFF; the Y-axis
   stays inert (x-only) for every non-EMBERTIDE arena — add this coexist clause explicitly + a test.**
2. **Full-frame emitter rows** — bullets from the frame-wide bands (the tide crests the whole frame);
   off-lane / full-width origins.
3. **Fog-exempt horizon light-bands** — reuse the sky-dome pattern (`material.fog=false`,
   camera-relative); they REPLACE the dome — **crossfade the real sky dome during the lift (one sky,
   never two)**.
4. **The face-relief system** — dark relief masses + the two eye-hollows tearing open (model-side).
5. **The §7b gate override** for the value inversion (Decision C) — cited to the registry sanction.
6. **Everything default-OFF for existing bosses** (byte-identical legacy path).

### 2.7 — ⛔ BUDGET & GRANDEUR — GO ALL OUT (the SPATIAL PEAK — read this carefully; it's not "more tris")

**Owner directive: World-Enders SPEND THE HARDWARE — and this is the 2nd-last boss, the band's SPATIAL
PEAK. Make it the most cinematic fight before the finale.** BUT EMBERTIDE is the ONE boss where "spend
all the tris" is the WRONG frame — its grandeur currency is **LIGHT + the FACE + the vertical SQUEEZE +
overdraw headroom**, not faceted filler. Here is how to go all out CORRECTLY:

**The measured ceiling (L124/L126):** triangles are ~free (400k phone ceiling); draws ~free (bullets
are 4 instanced draws; the dragon ~6–12k tris; a future dragon-relic ~5k/10 draws — none contends).
**OVERDRAW is the ONLY real killer AND it is EMBERTIDE's genuine risk** (3+ frame-wide additive planes
+ any fever volume). The cap: **≤2 large additive volumes on screen (incl. the kit shield)** — the
bands are inside it ONLY because they REPLACE the sky dome (unstacked vs camera). **This is MANDATORY
to verify (the tiershots overdraw audit is a GATING item here, not a checkbox).**

**WHERE to spend the grandeur (go big on ALL of these):**
- **A RICHER FACE** — do not stop at brow/nose/chin. Add temple, cheek, jaw masses so it unmistakably
  COHERES as a face (this ALSO fixes the "reads as a gradient" failure mode — a richer face is both
  more grand AND more legible; the tris rise here legitimately, on IDENTITY).
- **A DEEPER, LAYERED TIDE** — more staggered light-bands than 3 for an overwhelming, many-layered
  wall of light (watch the overdraw cap — they must all replace the sky, never stack vs camera).
- **THE VERTICAL SQUEEZE as a huge dramatic beat** — the ceiling/floor of light closing in + the
  letterbox at the first crescendo set (a free re-entrance); make it feel like the sky is crushing the
  lane.
- **THE EYE-HOLLOWS TEARING** + the face SURGING forward at the crescendos — dramatic, escalating.
- **HORIZON BREAK (the survival dread)** — the whole frame crests; the face's shadow the only safe
  pocket — the most spectacular single beat before the Apex.

**⛔ THE OVERDRAW DISCIPLINE (budget in additive-SHELL count, not tris):** every extra light band is
additive; the fever/Surge volume is additive; the kit shield is additive. Keep the on-screen large
additive count ≤2 by REPLACING the dome (the bands ARE the sky) and keeping the fever volume small.
**Run tiershots with all bands + the fever volume + the shield active AT ONCE** — that's the frame
that decides whether it holds 60fps on a weak phone.

**Quality scaling**: at q0.5, drop the band count + face-mass detail (`tris(q0.5) < tris(q1)` gate;
those are your lowQ dials — but NEVER drop below a legible face). **Keep the sawtooth**: EMBERTIDE is
the band PEAK, but THE UNMASKED (Apex) must still out-grand it — 13 is maximum MOTION, 14 is the STILL
counterpoint; protect both extremes.

---

## PART 3 — DOC FIXES TO LAND IN THE SAME PR (settled — just do them)

**3.1** Registry parry-job cell (§5b row 13): `BEAM DUEL (§5i.C) — at Surge ≥50% fire INTO the crest;
the parryable crest-lock volley carries amber` (+ the ED-8 classification note per Decision C).
**3.2** Registry palette + VALUE token (§5b row 13): add the missing VALUE axis + the hexes +
glow-shape: `vermilion→rose · BRIGHT (sanctioned VALUE-INVERSION, §7b override) / full-frame field`.
**3.3** GRAZE FORM line in the §5d sheet (as anatomy): "GRAZE FORM — TIDE-EDGE + FACE-SHADOW POCKET:
the tide crest + the face's cast shadow are the anatomy; skim the crest edge, ride the moving
face-shadow pocket; offered once per phase."
**3.4** §5d NEEDS line + §5e ledger: the vertical-constrict Y-axis, the full-frame emitter rows, the
fog-exempt bands, the sky-dome CROSSFADE, and the letterbox squeeze (the crossfade + letterbox were
unledgered — audit gap).
**3.5** §5b Home-biome + VOICE cells for row 13: Home-biome = **"NONE — a world-state EVENT that
grades ANY biome (the sky-shift is its foreshadow; BIOME-DESIGN.md)"**; VOICE = **"a rising
tide-ROAR / crescendo swell — low-to-full sweep, the sky's breath as signature noise (quotes
Stormrend's gale)."**
**3.6** §5b lore web: the SCAR = a dark leash-notch in one band; register the forward gap **"who/what
leashed EMBERTIDE? → the Apex"** (the leash chain: Stormrend ← EMBERTIDE ← THE UNMASKED). Its face is
NEGATIVE relief (vs BRINEHOLM's solid head — hold the split). It quotes Stormrend (the CRESCENDO-SETS
rhythm — a DESIGNED echo). No stale references to retired concepts.
**3.7** §5i.C survival-card amberdiet EXEMPTION (if not already landed by slot 10): Horizon Break (a
sealed pure-dodge survival card) can't serve live amber per the 12s window — the exemption sanctions
it; keep an amber carrier in the phase's `attacks` list so the CI gate passes (Part 5).
**3.8** §7b gate spec: add slot 13 to the sanctioned VALUE-INVERSION list with its NEW inverted
override (G1 dark-focal, G2/G4 exempt).

---

## PART 4 — THE BUILD PIPELINE (CP1.0 Fable → CP1 model+studio+Fable → CP2 wire+Fable → owner)

**CP1.0 — ⛔ PRE-BUILD FABLE SHEET SIGN-OFF (STRESSED — the hardest read in the roster — spawn #1):**
after the human approves the §3b sheet, spawn an independent **Fable agent via the Agent tool** with
the §3b laws + EMBERTIDE's sheet (2.1) + this task — *"Independent design gate. This is the hardest
silhouette in the roster: the identity is NEGATIVE (dark relief in bright light). Run the §3b STRANGER
TEST in prose: does the described image read as a FACE SURFACING FROM THE HORIZON — or just a pretty
GRADIENT / sunset? Do the brow/nose/chin relief + the two dark eye-hollows clearly COHERE into a face?
Is it clearly NEGATIVE-relief, distinct from BRINEHOLM's SOLID breaching head? Does it overflow both
frame edges (never a discrete object)? Verdict PASS / FIX — do NOT pass 'it's a nice sunset.'"* Fix
the sheet until the face is unmistakable before modeling.

**CP1 — the model (studio-gated):**
1. `bossDefs.js`: add the def (2.5), append `'embertide'` to `BOSS_ORDER`.
2. New `reforged/js/bossEmbertide.js`: `export function buildEmbertide(def, quality = 1)`. Compose on
   `createBossCommon(...)`. Parts on an inner `rig` (NEVER animate the root). **Every material through
   `kit.track()`.** Name the pivots (`browMass`, `noseMass`, `chinMass`, `eyeHollow0/1`, `crestPivot`).
   **The additive bands must REPLACE the dome (fog-exempt, camera-relative) — never stack a 3rd large
   additive volume vs the camera.**
3. `bossModel.js`: one dispatch line — `if (def.archetype === 'embertide') return buildEmbertide(def,
   quality);`.
4. Return the handle contract (§6.4) + `setGaze`/`notice()`. Wrap kit methods (`setDissolve`→the tide
   RECEDES / face sinks / sky sets death, `flash`→the field-shudder flinch, `setCharge`→the face
   surges forward + crest gathers, `notice()`→the eye-hollows tear open).
5. **Merge gotchas** (`mergeGeometries` returns null silently): strip `uv`+`uv2` via
   `bossKit.stripForMerge` and REASSIGN, `toNonIndexed()`, bake transforms pre-merge.
6. **STUDIO GATE (§7c):** `node tools/bossstudio.mjs embertide` rendered **as the sky-replacement (it
   IS the backdrop)** → judge the DARK-relief render (INVERT the usual black-fill: check the DARK face
   reads against the BRIGHT field), then the fight-distance frame showing it OVERFLOW both edges. Run
   `node tools/bossgate.mjs embertide` with your sanctioned overrides. **Run the OVERDRAW audit
   (`tricount`/`tiershots`) at CP1 — the additive planes + a fever volume must stay under the phone
   cliff (L124/L126) — this is a GATING item.** Iterate the MODEL.
7. **⛔ CP1 FABLE DESIGN GATE (Fable spawn #2 — silhouette FIRST):** spawn a fresh Fable agent with the
   dark-relief / fight-distance renders + bossgate output — *"Independent design gate, silhouette first.
   Stranger test = a FACE surfacing from a wall of light (NOT a plain sunset gradient, NOT BRINEHOLM's
   solid head)? Do the brow/nose/chin + the two eye-hollows read as a FACE? Does it OVERFLOW both frame
   edges (never fits)? Is the accent the vivid vermilion→rose (distinct from 11 pale-gold / 12 ashen)?
   Verdict PASS / FIX; do NOT pass 'a nice gradient.'"* Fix the MODEL and re-gate until PASS. Only then
   the beauty pass.
8. **POST CROPS + STOP FOR THE OWNER.** Post the sky-replacement studio sheets (idle · `notice()` ·
   `setCharge(1)` · shielded · death) + the dark-relief render + the fight-frame + the OVERDRAW audit
   numbers + Fable's verdict, and STOP for the owner's green-light.

**CP2 — wire the live fight (separate commit, after the CP1 owner green-light):**
9. Phases/cards fire; the full-frame emitters fire; CRESCENDO-SETS rhythm passes `rhythmprint`; the
   entrance *The Sky Comes Loose* runs (grade seeds at warn-start; the horizon-lift in the flythrough's
   FIRST segment; the three+ bands rush rel 380→60 STAGGERED overflowing both edges; the eye-hollows
   tear open and settle on the dragon; **crossfade the real sky dome — one sky, never two**; low-pass
   muffle the first shadow-cross; **run the overdraw audit with all bands + fever present**).
10. **The engine (2.6): Y-constrict, full-frame emitters, fog-exempt bands, face-relief, the gate
    override.** The vertical squeeze + letterbox lands at the FIRST crescendo set (a re-entrance) and is
    INERT for all other bosses.
11. **The BEAM-DUEL parry + TIDE-EDGE graze + Horizon Break survival dread**: at Surge ≥50% fire INTO
    the crest (hold lane-center against the drift while beams lock); the face-shadow is the survival
    pocket.
12. **⛔ CP2 FABLE INTEGRATION GATE (Fable spawn #3):** capture in-game (`?debug&boss=100&bossIdx=12`,
    `?rush=all`), then spawn a fresh Fable agent — *"Judge ONLY integration, not design. Check: the face
    is unmistakably a FACE IN MOTION (not a gradient); the bands overflow both edges and never fit; the
    sky-dome crossfade is seamless (one sky, never two); the vertical squeeze + letterbox lands at the
    first crescendo set and is inert for all other bosses; full-frame emitter rows fire fairly; the
    BEAM-DUEL (fire into the crest at Surge ≥50%) reads as a duel; the survival dread's face-shadow
    pocket is findable; OVERDRAW stays under the cliff with fever active (re-run tiershots in-fight);
    bullet contrast against the BRIGHT field holds; the ladder controller advances the run without
    regressing shipped bosses; full loop + death. Verdict PASS / FIX per item."* Resolve or re-defer
    each FIX.
13. Re-run all suites, post the in-game crops + the in-fight overdraw numbers + Fable's verdict, and
    **STOP for the owner's final motion/feel call before the PR leaves draft.**

---

## PART 5 — VERIFICATION, ACCEPTANCE, GATES, DONE-WHEN

**Run (from `reforged/`), all green before each checkpoint:**
- `node tests/boss.mjs` — extend with your named-pivot telegraph check (a face-relief/`eyeHollow` pivot
  moves on `setCharge`); TIER_BUDGETS tier-4; `amberdiet` + `rhythmprint`.
- `node tests/bossboot.mjs` — zero console errors + zero untracked-material warnings.
- `node tests/defs.mjs`, `node tests/bossrush.mjs`.
- `node tests/bulletcontrast.mjs` (+ dichromacy) — **contrast against the BRIGHT field, not a dark one**;
  the rose end clears danger-magenta.
- **A NEW test** asserting the Y-constrict is INERT (x-only) for non-EMBERTIDE arenas.
- `node tools/tricount.mjs` / `node tools/tiershots.mjs` — **the OVERDRAW audit is a GATING item here
  (all bands + fever + shield at once), not a formality.**
- `node tools/bossgate.mjs embertide` (G1–G7 with the sanctioned inverted overrides) · `node
  tools/bossstudio.mjs embertide`.
- `node tests/run-all.mjs` — full suite green (proves coexist: every other boss + arena byte-unchanged).
- `node tools/stamp-sw.mjs` — **in the same commit** as any js/css/html change.

**⛔ THE AMBERDIET TRAP (same as slot 10):** `amberdiet` reads `def.phases[].attacks`. Horizon Break is
pure-dodge at runtime, but the test reads the PHASE attacks — **keep an amber carrier in the survival
card's underlying phase attack list and the CI passes.** The §5i.C survival exemption (3.7) sanctions
the design-level caveat.

**Acceptance checklist:**
- [ ] Studio (as sky-replacement) reads as a FACE surfacing from a wall of light — the stranger test passes; NOT a gradient, NOT BRINEHOLM.
- [ ] It OVERFLOWS both portrait edges at fight distance (never fits — the spatial peak).
- [ ] The face is RICH (brow/nose/chin + temple/cheek/jaw) — coheres unmistakably; a face-relief pivot moves on `setCharge`; the leash-notch scar is present.
- [ ] **OVERDRAW audit passes with all bands + fever + shield at once (≤2 large additive volumes; the bands replace the dome).**
- [ ] The Y-constrict is inert for all other arenas (test passes); the sky-dome crossfade is seamless.
- [ ] Vermilion→rose hexes set; magenta bullets read on the BRIGHT field; the rose end clears danger-magenta (or human signed off — Decision C).
- [ ] `amberdiet` + `rhythmprint` + tier-4 budget pass; full suite green.
- [ ] Went ALL OUT on the spectacle (a rich face, a deep tide, the vertical squeeze) per §2.7; q0.5 drops below q1 but never below a legible face.
- [ ] Part 3 doc fixes landed (parry cell, palette/VALUE token, graze line, NEEDS/ledger, biome/VOICE, scar+lore, amberdiet exemption, §7b sanction).
- [ ] Crops + Fable verdicts + overdraw numbers posted; stopped for the owner (CP1 studio, then CP2 in-game).

**⛔ GATES you cannot self-certify past (Fable gates; the owner owns the final call):**
- Decision A (§3b sheet) — human approval **+ the STRESSED pre-build Fable sign-off (spawn #1)** before geometry.
- Decision B (§4b map — THE BLOCKER) — human sign-off before geometry.
- Decision C (value inversion + palette + gate override) — human sign-off before the accent/override land.
- CP1 studio verdict — **Fable design gate (spawn #2)** + the overdraw audit, then the owner green-lights.
- CP2 integration verdict — **Fable integration gate (spawn #3)** + the in-fight overdraw audit, then the owner's final call before the PR leaves draft.
- Every Fable spawn is an INDEPENDENT Agent-tool agent (fresh, no build context).

**DONE-WHEN:** CP1 + CP2 verdicts passed by the human; registry row 13 flipped `open → shipped` (claim
`open → claimed` in your first commit); §5d entry carries the approved sheet/map/geometry; **append a
LEAPFROG lesson** (e.g. "EMBERTIDE: the negative-relief FACE only reads if it's RICH (temple/cheek/jaw,
not just brow/nose/chin) — a sparse face is 'a nice gradient'; grandeur was spent in LIGHT + the squeeze,
not tris; overdraw was the real gate — the bands only fit the cap by REPLACING the sky dome") and **add
it to §9**.

---

## PART 6 — GUARDRAILS / DO-NOT-BREAK + WHY THIS BOSS EXISTS

- **Never touch the other bosses' defs/builders/dials/arenas, or a sibling slot's rows/lines.**
  EMBERTIDE is additive: a new def + `bossEmbertide.js` + one dispatch line + the def-gated
  Y-constrict / full-frame emitters / fog-exempt bands / gate override.
- **The Y-constrict, full-frame emitters, fog-exempt bands, and gate override are INERT for defs that
  don't opt in** — shipped bosses + arenas byte-identical. A test asserts the Y-constrict is x-only for
  non-EMBERTIDE arenas.
- **OVERDRAW is the perf cliff and it is REAL for this boss.** The additive bands must REPLACE the sky
  dome (fog-exempt, camera-relative); NEVER stack a 3rd large additive volume vs the camera. The
  tiershots audit is a gating item at CP1 AND in-fight (with fever).
- **The face must READ as a face** (the hardest read in the roster) — spend on a RICH face; if it reads
  as a gradient, it has failed regardless of everything else.
- **One sky, never two** — crossfade the real dome during the lift.
- **Do not finalize palette near reserved role colors** — the rose end must clear danger-magenta;
  bullets must read on the BRIGHT field.
- **Do not invent lore** beyond the sanctioned beats — the leash gap points at the Apex; the Stormrend
  quote is a designed echo.
- **Do not merge on your own verdict.** Fable gates, then the owner STOPs you — twice.
- Never `git stash` / `git checkout --` / `git reset`; foreground commands only; do not self-merge or
  flip the PR out of draft. Commit trailer per repo convention; keep model identifiers out of
  commits/PRs/artifacts.

**WHY THIS BOSS EXISTS (weight your build + the Fable/owner gates on these — it's the 2nd-last boss):**
1. **It must be the most CINEMATIC fight before the finale — the sky literally coming loose.** The
   grandeur is the whole backdrop becoming the enemy: a rich face surfacing from a frame-wide tide of
   light, the vertical squeeze crushing the lane, Horizon Break cresting the entire frame. Go all out on
   THAT (the light, the face, the squeeze), not on tri count. If it reads as merely a colorful boss
   instead of the sky standing up, the spatial peak is wasted.
2. **It sets up the Apex by contrast — protect the extremes.** 13 is the sky in MAXIMUM MOTION; 14 is the
   sky perfectly STILL. The more overwhelming and loud EMBERTIDE's motion is, the harder THE UNMASKED's
   stillness lands. This is the strongest band boundary in the game — build 13 as the loudest thing the
   player has seen, so the finale's quiet is deafening.

---

### Appendix — audit findings folded in (what changed vs the source prompt)
- **§4b seven-channel map (2.2)** — the audit's BLOCKER for slot 13 (only the eye-hollow MEDIUM was
  seeded); drafted around the face-relief + eye-hollows + tide, with the DEATH = the sky setting.
- **The SCAR + forward lore gap (2.1 / 3.6)** — slot 13 had NEITHER (§3 law 6). Added: the dark
  leash-notch + "who leashed EMBERTIDE? → the Apex" (the leash chain Stormrend ← EMBERTIDE ← 14).
- **Geometry spec + hexes + named pivots (2.3)** — the thinnest sheet of 9–14: no primitives, no
  eye-hollow construction, no hexes, no pivots; all specified now.
- **The value-inversion GATE OVERRIDE is NEW (2.4 / 3.8)** — the shipped `gate.pale` (MARROWCOIL's)
  doesn't cover a DARK-focal boss; a new inverted override (G1 dark-focal, G2/G4 exempt) cited to the
  registry sanction; slot 13 added to the §7b list.
- **BEAM DUEL is Surge, not parry (Decision C / 3.1)** — audit ED-8: it sits in the wrong ladder and
  makes the band debut two parry mechanics; flagged for the owner + the amberdiet floor served by a
  separate crest-lock volley.
- **The amberdiet survival-card exemption (3.7 / Part 5)** — Horizon Break is a sealed pure-dodge card;
  same CI trap as slot 10; keep an amber carrier in its phase + the §5i.C exemption.
- **Survival-card clarity (2.5)** — 13's ONE survival card = the final Horizon Break; the first-set
  vertical squeeze is a normal beat (the doc drifted between "vertical squeeze" and "Horizon Break").
- **Home-biome + VOICE + unledgered engine (3.4 / 3.5)** — no home biome (a world-state event grading
  any biome); VOICE = the tide-roar; the sky-dome crossfade + letterbox were unledgered.
- **§2.7 BUDGET & GRANDEUR (new)** — the go-all-out directive HONESTLY adapted: EMBERTIDE's currency is
  LIGHT + FACE + the SQUEEZE + overdraw headroom, not faceted filler; the tiershots overdraw audit is a
  GATING item (its unique real perf risk).

This brief is the slot-13 slice of the execution SOP from the 2026-07 BOSS-DESIGN audit. It is
self-contained; you do NOT need the full SOP to build EMBERTIDE.
