# THE UNMASKED — ARENA IDENTITY DESIGN (the two worlds of the finale)

**Status:** CREATIVE IDENTITY SPEC — the WHAT for the transformation plan's HOW.
**Companion docs:** `docs/unmasked-arena-transformation-plan.md` (the value-space env
override + stage-beat clock this designs within) and
`docs/unmasked-arena-transformation-audit.md` (the technical rails: F1 props gated OFF,
F2 heaven ceiling L≤~0.75, F3 fauna/fever/schema, O-decisions). Nothing here contradicts
either; where this doc authors values, they supersede the plan's §3 placeholders and were
re-derived with `tests/bulletcontrast.mjs`'s own `lum()` this session (numbers inline).
**Owner decisions honored:** O6 — no recycled biome props in the void; the void is dressed
with NEW void-native forms (decided below: THE BLANKS, with an empty-first shipping order).
Heaven is LIT, NOT BLINDING — authored ceiling L≈0.74, holy through GOLD + composed light.
**Art laws honored:** BOSS-DESIGN §1 (frontal canvas), §2 (overdraw cliff — new forms are
opaque + thin-line + small backlit-arc only), §3/§3b (silhouette, dark-body tiers,
symmetry + one scar, stranger test), §7b (the sanctioned value-inversion grammar).
**No code in this doc.** Every identity choice maps to an env field, an existing seam, or
a flagged small authored form with its budget stated.

---

## 0. THE THROUGH-LINE — the fight doesn't change rooms; it removes layers

The lore web says three things about slot 14, and the two arenas are those three things
made visible:

1. **"What Wore the Sky as a Mask."** The sky the player has flown under for the whole
   game is a garment. Stage 1 is fought against the ordinary biome sky because stage 1 IS
   the ordinary sky — the mask, still worn, with one lidded eye showing through.
2. **"It made the masks"** (the Voidmaw rhyme; the one-frame VOIDMAW title glitch).
   A maker has a workshop. When the mask cracks, the player isn't teleported *away* —
   they fall *through*, into the place where the masks were carved. Behind a mask there
   is not another world; there is the **inside of the mask**.
3. **"11's mended tear → 14's entry wound."** Weftwitch spent her whole fight mending a
   tear in the sky. The S1→S2 crack is that tear reopening — the seam of the wound is the
   doorway, and the S1→S2 flood is the player being pulled through it.

So the finale's cosmology is a three-layer strip-tease, and each stage peels one layer:

| Stage | Layer | Arena |
|---|---|---|
| 1 | the MASK (the worn sky) | the ordinary biome — untouched, mix 0 |
| 2 | BEHIND the mask (the workshop, the hollow) | **THE HOLLOW BEHIND THE SKY** |
| 3 | what the mask was carved to HIDE | **THE UNVEILED HEAVEN** |

The player's journey: you fought under the mask → you were pulled inside it → the veil
lifts and you are standing in the thing it was hiding. Boss title: *"What Wore the Sky
as a Mask."* Heaven epithet: *"What the Sky Was a Mask Of."* The two arena names close
the sentence the boss's name opens.

One composition law binds both arenas: **the seraph is always the darkest large thing in
frame, and its gold is always the only warmth that matters.** The void is COLD dark (the
boss's gold eyes are the only warm light in the dimension); the heaven is WARM light (the
boss is the only darkness in the dimension). Same boss, two worlds, two figure-ground
inversions — that's the transformation the player remembers.

---

## 1. ARENA 1 — THE HOLLOW BEHIND THE SKY — *"Where It Made the Masks"*

### 1.1 One-sentence identity (the stranger test target)
**A starlit black hollow behind the world — a still, airless workshop where huge blank
unfinished masks hang in the dark over a black mirror floor.**
Stranger shown a screenshot should say: *"some kind of void / the space behind the world
— are those faces?"* If they say "night sky" or "space level," the read has failed (the
counters: no sun, no horizon glow-band shape of any biome, wrong-gravity dust, the
blanks, the mirror floor).

### 1.2 What this place IS (the lore identity)
This is not "a dark dimension." It is the **maskwright's hollow** — the cavity between
the false sky and whatever is really outside. Everything the player sees is a workshop
detail read at cosmic scale:

- **The stars are pinholes.** The starfield here is the SAME starfield the player has
  seen all game (`starMix → 1`, the existing hashed field — zero new code), but the
  meaning flips: *every star you ever flew under was a pinhole in the mask — this place,
  showing through.* The night sky was always the hollow, leaking. This is the single
  cheapest, largest lore payoff in the design: one uniform, and it retcons the whole
  game's sky.
- **The floor is the fitting mirror.** The black-glass water (O5's recommended star
  mirror: `waveAmp 0.15`, near-black tints) is where the maker checked the fit of each
  mask against the light through the pinholes. A dead-calm mirror under a starfield —
  the void's screenshot.
- **The dust falls up.** The up-drifting pale motes (`fall −0.45`) are **mask-dust** —
  carving dust from every face it ever made, still falling home toward the carver. The
  wrong-gravity read does the "another dimension" work; the lore does the "this
  dimension" work.
- **The silence is authored.** In the entrance, one held choir partial joined the mix a
  biome early (*Don't Move*). On arrival in the hollow, that partial DIES — the ambience
  layer drops to near-nothing (existing per-biome ambience infra; optional, flagged §5).
  Nothing lives here. Nothing was ever allowed to.

Lore threads this answers/points at (point, never over-explain): **"it made the masks"**
(the blanks, §1.4) · **11's mended tear = 14's entry wound** (the way IN, §3.1) · the
**leash chain** (Stormrend ← EMBERTIDE ← THE UNMASKED — the hollow is where the leashes
lead BACK to; see the owner-optional far-chain note in §1.4 anti-scope) · the pinhole
retcon (new, this doc — leaves no gap, spends none).

### 1.3 Palette + env values (the buildable identity — all verified vs the gate)

Identity hue: **bruise-violet** — dark, cold, and deliberately QUOTING Voidmaw's violet
(the first mask it made; the arena may quote a boss hue — boss palette allocation is for
bosses, and slot 14's own black·dark-gold·white is untouched). Violet is also the coldest
believable "behind the night" hue that isn't a biome: Astral keeps its sun, its violet
HORIZON BAND + sky-whale; the hollow has no sun, no band shape, no life. NOT pure black
anywhere — a place, not an absence.

| Channel | Value | L (gate `lum()`) | Identity job |
|---|---|---|---|
| sky top | `0x050208` | .012 | near-black, faint violet — not #000 |
| sky mid | `0x0d0618` | .034 | the bruise gradient |
| sky horizon | `0x1a0b2e` | .066 | the BRUISE BAND — sits at wing height behind the seraph (the silhouette's backdrop, R4) |
| sunGlow | `0x000000` | — | **the sun is GONE** (+ god-rays suppressed, `bossVoidSky`) |
| starMix | `1.0` | — | the pinholes (see §1.2) |
| fog | `0x0a0514`, near ~45 / far ~240 | .028 | the world swallowed — a pocket ~200m across |
| fogFar | `0x120a24`, mix 1 | — | violet depth, not black cutoff |
| sun light | `0x9a8fd8`, I ~0.55 | — | cold starlight-violet key |
| hemi | sky `0x241a3a` / gnd `0x05030a` | — | cold fill |
| water | deep `0x030208` / shallow `0x140a26`, amp 0.15 | — | the fitting mirror |
| motes | `0xcfc2ee`, fall −0.45, sway 0.4 | — | mask-dust falling up |
| fauna/whale/flyby | all → 0 | — | nothing lives here (audit F3.1) |
| bullets | `dark: 0xa84167` (Astral's certified lift) | .29–.32 direct vs both bgs ✓ | reuse, not invention |

Amber (.746/.708 direct), cyan (.749/.712), danger (.335/.298) all PASS both void
backgrounds with the roster's widest margins — the hollow is the fairest arena in the
game by construction.

### 1.4 THE O6 ANSWER — dressed, with THE BLANKS (and an empty-first shipping order)

**Decision: the hollow is dressed — with exactly one motif: THE BLANKS, the unfinished
masks.** Empty was seriously considered (it's free, and emptiness rhymes with *Don't
Move*), but empty surrenders the strongest visual sentence the lore hands us: the crack's
payoff is *"it made the masks,"* and a workshop with no work in it says nothing. The
blanks are the void's exclusive prop silhouette (BIOME-DESIGN law 3 applied to a
micro-biome), and they give the pocket scale, parallax, and a place-read that fog +
stars alone can't.

**What they are:** six colossal **unfinished mask blanks** hanging far off-lane in the
dark — flattened matte ovals with the proportions of the stage-1 eclipse disc, each
carrying one shallow engraved **LID-GROOVE** (the same hooded-lid curve the player has
watched ride the horizon since mid-game — the §3b.5 positive signal that says MASK, not
moon; by the finale, that lid-curve is the most-seen shape in the game). No features
otherwise: faces not yet carved. Each blank is **tilted, face averted** — workpieces on
the rack, and the tilt kills the "another eclipse disc" anti-read (the boss's disc is the
only one ever seen frontal).

**Authored placement (§3.6 symmetry law):** 3 + 3 in two mirrored rising arcs flanking
the lane, far-field (sky-tier: fog-exempt, camera-following — the second-sun render
pattern), sizes stepping up with distance for parallax. **NONE dead-center behind the
boss** — the seraph owns the frame center against the bruise band; the blanks own the
flanks and upper corners. Idle motion: one very slow drift-rotation each (single low
frequency — they are scenery; their stillness rhymes with the boss's).

**The one scar (the memory hook):** the lowest-left blank is **CRACKED AND HOLLOW — the
one that became VOIDMAW.** Same oval, shattered along the exact seam pattern of boss 1's
mask, its crack faintly violet-lit (`0x9a6cff` at ei ≤0.25 — the satellites-stay-dark
law, §3.8). It is the one-frame VOIDMAW title glitch made physical, and the only
asymmetry in the arena. Point, never answer: no other blank matches a shipped boss.

**Material/budget (the §2 audit, honest):**
- Opaque near-black matte discs (`~0x0b0912` diffuse, zero emissive) + one dark engraved
  groove line each (LineSegments — overdraw-exempt) → **overdraw-free by construction.**
- Each blank is under-lit by one thin **backlit ARC** (a partial ring segment strictly
  BEHIND the blank's silhouette plane — the §2-sanctioned backlit-disc idiom), dim
  violet-white, reading as workshop light catching the rim. **PARTIAL arcs only, never a
  full ring** — a closed bright ring = corona = the boss's reserved glow-shape.
- Budget: 6 × (24-seg disc + groove lines + thin arc) ≈ well under 1k tris total,
  ~12–18 draws (draws are not a budget axis), additive screen coverage per arc <1% at
  far-field scale — nowhere near the 2-large-volume cap. **Flagged for the standard §2
  overdraw probe + a Fable placement check anyway** (new draws = new gate, per the task's
  budget rule).
- **New plumbing, named honestly:** the blanks are the ONE piece of this identity that
  the transformation plan's value-space override cannot carry — they are a small new
  authored mesh group (own file, e.g. `js/voidBlanks.js`), visibility driven by the same
  arena mix, torn down in BOTH teardowns (the rung-14 double-teardown law). This breaks
  the plan's "zero new meshes in v1" — which is why:
- **Shipping order: PR-A ships the hollow EMPTY** (the plan's v1 stands — sun-gone +
  pinholes + swallow + mirror + up-dust is already a complete dimension read, and R4's
  silhouette risk gets judged clean first). **The blanks land as their own def-gated
  increment** (with PR-C or beside it), so the void's hero read is never hostage to new
  geometry. If the Fable gate ever flags them, the hollow is DESIGNED to stand without
  them.

**Anti-scope (rejected dressings, so nobody re-adds them):** no far leash-chains (a
line to "something greater" answers the post-game gap early — slot 14 must LEAVE one
gap); no ribs-of-the-sky architecture (reads as MARROWCOIL); no floating tools/hands
(reads as CRAGHOLD's retired ghost); no second light source of any kind.

### 1.5 How it flatters the dark seraph (the R4 answer)
Near-black boss on a non-black void, separated on three axes at once:
1. **Value:** wings `~0x0b0a0c` vs bruise band `0x1a0b2e` — the band sits AT WING HEIGHT
   (it's the horizon; the boss holds ~y 8–14 at rel 30), so the outline is always read
   against the arena's lightest dark, not its blackest.
2. **Temperature:** the entire dimension is cold violet; the boss's ~20 gold irises +
   gold rails + halo are the ONLY warm light that exists here. In the ordinary sky the
   eyes competed with a sunset; in the hollow they are sovereign. Stage 2's charisma
   (gaze-lag, blinks) reads BETTER here than anywhere in the game.
3. **The lit-edge drawing:** §3b law 3 — on a dark ground the emissive lines ARE the
   boss; gold rails + white great-eye + halo survive any background this dark.
Sanctioned fallback if the Fable gate still flags it: the single dim backlight disc
strictly behind the silhouette plane (plan R4) — already legal, not needed by default.

### 1.6 Doodle / stranger test
Black-fill doodle: a six-winged dark angel dead center; a pale horizontal band behind its
wings; star-specks above AND reflected below (the mirror); two arcs of big blank tilted
ovals flanking, one cracked. A 12-year-old draws it with a black crayon and one gold
crayon. Stranger names it: *"an angel in the void — behind those masks?"* — correct.

---

## 2. ARENA 2 — THE UNVEILED HEAVEN — *"What the Sky Was a Mask Of"*

### 2.1 One-sentence identity (the stranger test target)
**A lit, gold, composed heaven — cool high air over a molten-gold horizon, shafts of
godlight and slow gold rain over a bright sea — with one dark six-winged seraph as the
only shadow in it.**
Stranger shown a screenshot should say: *"heaven / the final boss's holy form."* If they
say "sunset" or "desert at noon," the read has failed (the counters: the cool blue-grey
zenith over the gold — sunsets grade warm ALL the way up; the god-ray shafts; the
light-rain; the seraph's dark mass).

### 2.2 What this place IS (the lore identity)
The unveiling doesn't take the player somewhere ELSE — it takes the last layer off THIS
place. The hollow was the heaven **with the light shuttered**: same nowhere, unveiled.
(The transition never crosses a "somewhere third" — §3.2 drains the dark out rather than
flying anywhere; the pinholes were always this light, leaking through.)

- **This is the light the masks were carved against.** Every mask it made — Voidmaw, the
  sky itself — was carved to keep THIS out of view. The heaven is the game's answer to
  why the world needed a mask at all.
- **It is a COURT, not a paradise.** The stage-3 exam card is *"WHAT WORE THE SKY —
  Every Verdict at Once."* The composed light is judgment-light: vertical shafts like a
  gallery of witnesses, a horizon of gold like a bench, and nothing else. **The heaven is
  deliberately EMPTY of forms** — the void got the furniture; the heaven gets none. The
  emptiness is the design: *the court was never built for anyone else; the player is the
  first thing it ever let inside.* (And practically: the boss's own stage-3 body — saint's
  halo + radiant gold starburst + mantled wings — IS the arena's architecture. Any
  authored golden gates/pillars would compete with the one starburst the whole roster has
  been saving for this moment.)
- **The seraph is the shadow the light throws.** The sanctioned value inversion
  (HOLLOWGATE's table, flipped; §7b grammar): a near-black boss over a lit world — the
  strongest silhouette in the game, held for the fight's final act. Its gold starburst
  and halo now RHYME with the world instead of piercing it — stage 2's boss was a
  stranger to its arena; stage 3's boss is HOME, and that visual agreement is the "this
  is its true form" read.
- **Arrival, not spectacle.** The heaven must feel EARNED: the player has flown through
  thirteen skies and one hollow to stand here. The feel-words for every tuning pass:
  *still, vast, warm, watching.* Not *loud, white, busy.*

Lore threads: the leash chain terminates here — the presence that leashed EMBERTIDE
("even the sky that stood loose obeyed something greater") kept its court in this light ·
the entrance's held choir partial finally RESOLVES here (§5) · the one player-addressed
line (stage 3's granted fourth-wall beat) is spoken IN this light — the court addresses
the courtroom.

### 2.3 Palette + env values — LIT NOT BLINDING (ceiling verified at L≤0.744)

The owner's ceiling (~L 0.75) is not a compromise — it's what makes GOLD possible. True
gold is a MIDTONE flanked by highlights; push the sky to white and gold dies into cream
(and the parry dies with it, audit F2). Holy here = **composition**, the grammar of
religious painting: cool high air, gold low light, shafts between, one dark figure.

All values re-derived this session with the gate's own `lum()`; the full eight-colour
check (amber, cyan, both bands + override, danger, white core) **PASSES both heaven
backgrounds** — the layered outline+core read is alive again below 0.75, which is
exactly what the audit demanded:

| Channel | Value | L | Identity job |
|---|---|---|---|
| sky top | `0x6f88ad` | .523 | the cool steel-blue ZENITH — the anti-sunset signal; makes the gold read gold (complement), keeps the frame airy not oven-hot |
| sky mid | `0xc9a860` | .666 | the gold body of the light |
| sky horizon | `0xd9bc7e` | **.744** | the GOLD BENCH — the molten horizon the seraph is judged against; ceiling-legal |
| sunGlow | `0xfff0cc` | .943 | a small warm glow region, mostly sitting BEHIND the boss's own halo/starburst (it reads as the boss's light meeting the world's) — small area, not a gate background; the boss's HDR white focal (×2.4) stays supreme |
| fog | `0xd4b982`, near ~70 / far ~380 | **.732** | distance dissolves into LIGHT — the inversion of every biome and of the hollow |
| sun light | `0xfff2d0`, I ~1.9 | — | warm-white key; the water sun-streak returns |
| hemi | sky `0xcfd8e8` / gnd `0x8a7a58` | — | cool-over-warm fill (the zenith/horizon split, in the lighting) |
| water | deep `0x5f7aa8` / shallow `0xc4b98e`, amp 0.5 | .469 / .722 | the bright glassy sea; shallow kept ≤.75 so low bullets never wash |
| god-rays | re-enabled + boosted (the audit's named main.js seam) | — | the gallery of shafts — the #1 "holy" carrier; tier1/2 degrade to sky+fog per Law 10, stated |
| motes | `0xffe9b8`, fall +0.5, sway 0.25 | — | GOLD LIGHT-RAIN — slow descending grace; the deliberate opposite of the hollow's up-dust |
| fauna/whale/flyby | all → 0 | — | the court is empty (F3.1) |
| bullets | defaults PASS layered at this ceiling; keep the audit's `light: 0xff9ec4` override iff T3's re-run prefers it — **T3 is the authority, not this table** | amber .030/.041 direct + layered ✓ | fairness holds |

**The anti-washout law, restated for every future tuning pass:** if "more heavenly" is
requested — push god-ray intensity, mote density, sun-streak; **never** the sky/fog
luminance past ~0.74. Above 0.75 the parry-amber read is forfeit (measured, audit F2).

### 2.4 Boss + bullet legibility (the value-inversion contract)
- The seraph reads as a **dark cutout on gold** — outline-first (§3b.7's "dark boss on
  pale backdrop is a flat cutout" is a WARNING for judging relief, and a WEAPON when the
  outline is the point: stage 3's mantled-open wing fan is the roster's best outline).
- The boss's brightest points (HDR white star-eye ×2.4, gold starburst, halo) sit ABOVE
  the sky's ceiling — §3 law 2 holds: the focal is still the hottest thing in frame.
- Amber parry-bullets: pass via the layered read (dark outline .03 vs bg .73 = .70
  margin; white core 1.0 vs .73 = .27 margin) — the player rolls into amber against gold
  and the outline ring carries it. Cyan returns and danger magenta: same, verified.
- The dark seraph + dark bullet outlines never collide: bullets own the render-order LAW
  and their outline reads against the sky, not the boss.

### 2.5 Doodle / stranger test
Black-fill doodle: a dark six-winged figure, wings mantled open, a bright ringed halo
and star-spikes at its heart, three or four light-shafts behind it, a flat gold horizon
line low in frame. Gold crayon + black crayon again — same two crayons as the void, used
in opposite proportions (kids CAN and will draw both; that inversion is the fan-art
hook). Stranger names it: *"an angel in heaven / final form"* — correct.

---

## 3. THE TWO TRANSITIONS — identity beats, not crossfades

Both ride the plan's piecewise FLOOD on the existing stage-beat clock (no camera
takeover — L156 binding; no new timers). What this doc adds is what each flood MEANS,
which is what the tuning pass steers toward.

### 3.1 S1→S2 — **THE WOUND** (the crack; being pulled through)
The disc cracks — and the crack-light is the same white-violet as the flood, because
they are the same light: **the hollow, leaking through the wound in the mask.** This is
Weftwitch's endlessly-mended tear finally reopening (*11's mended tear → 14's entry
wound*), and this time nobody mends it.
- **Feel script (t on the beat clock):** t 0–0.45 — the world OVEREXPOSES: the live
  biome sky lerps to the white-violet flood (`~0xe8dcff`), fog.near crashes to ~25 (the
  world doesn't fade — it's *swallowed by nearness*), one postfx kick (the `arenaFlood`
  preset, audit F4). Reads as: the tear is pulled OVER the player, like passing through
  a membrane of light. t 0.45–1 — the flood DRAINS: brightness falls away and the
  pinhole-stars are simply *there*, the mirror below, the dust rising. No sky-A-to-sky-B
  moment exists on screen; the player was in one place, then light, then somewhere else.
  **That is the teleport.**
- **The screenshot:** arrival (t=1) is the shipped all-eyes reveal + 0.7s hold — twenty
  gold eyes and the great eye snapping to the player, now the only warmth in a cold
  starlit hollow, the seraph doubled in the black mirror below. Composed by
  construction; fire held; no takeover.
- **Rider (optional, owner-budget — dragon-directed, NOT the banked stage-3 addressed
  line):** *"…the stars didn't change. They're holes."* One line, lands the pinhole
  retcon for every player who'd never read a lore doc.

### 3.2 S2→S3 — **THE UNVEILING** (the verdict; the light turned on)
The wings mantle open, the core unveils — and the WORLD unveils with it. Identity rule:
**the light blooms outward FROM THE BOSS.** The gold flood (`~0xfff0c8`) must read as
the starburst igniting and overflowing the dimension — the boss doesn't travel to
heaven; the boss's unveiled light IS the heaven arriving. (The pinholes pay off here
too: all that light was always behind the dark — the hollow was the heaven shuttered.)
- **Feel script:** t 0–0.45 — gold floods from center-frame outward (value-space: the
  flood palette is warm and the sky lerp is uniform, but the boss's own unveil flare +
  starburst sit at frame center in the same frames — the eye composes the causality for
  free). t ≈0.6 — the god-ray shafts SWITCH ON (the audit's boost seam) as the veil
  passes: the single strongest "we have arrived" cue. t 0.45–1 — the flood recedes into
  the composed heaven; gold rain begins; the sea lights.
- **The screenshot:** the reveal hold now frames the roster's endgame icon — dark
  mantled seraph, saint's halo, gold starburst, shafts behind, gold horizon below. This
  is the game's poster, and it is composed by the existing hold + the arena, zero new
  camera code.
- **Death exhale (O4, endorsed):** on the kill, the heaven holds through slow-mo +
  FELLED, then eases mix→0 over ~2.5s — **the sky it stole is given back.** The player
  flies out of heaven into the ordinary dusk they started in, surge-lit (fever policy:
  the player's own light wins — see §6). The finale's last environmental sentence is the
  world being returned.

---

## 4. THE IDENTITY SHEETS (the two micro-biomes, in BIOME-DESIGN vocabulary)

### ARENA 1 — THE HOLLOW BEHIND THE SKY
| Axis | Value |
|---|---|
| **Name / epithet** | THE HOLLOW BEHIND THE SKY — *"Where It Made the Masks"* |
| **One-liner** | A starlit black hollow behind the world — blank unfinished masks hanging in the dark over a black mirror floor |
| **Identity triple** | hazard: the boss's stage-2 medley (the arena adds none — clean-arena law) · verb: fight the seraph in the dark · anchor: THE UNMASKED S2 |
| **Palette** | bruise-violet on near-black: sky `050208/0d0618/1a0b2e`, fog `0a0514` 45/240, sun GONE, water `030208/140a26` amp .15, motes `cfc2ee` fall −0.45, stars 1.0, bullets dark `a84167` |
| **Silhouette-forms (O6)** | THE BLANKS — 6 colossal tilted featureless mask-ovals w/ lid-groove, 3+3 mirrored far-field arcs, opaque + LineSegments + partial backlit arcs (never full rings); ONE cracked = Voidmaw's blank (violet seam, ei ≤.25). Ships AFTER the empty hollow proves (own gated increment) |
| **How it reads as a DIMENSION** | 5 non-brightness channels: sun-gone+no-shafts · full pinhole starfield+star-mirror · fog-swallowed pocket · up-falling dust · zero life/props (F1/F3.1) |
| **Lore-rhyme** | "it made the masks" (blanks) · 11's tear = the way in · the pinhole retcon (the night sky was always this) · Voidmaw's blank = the title-glitch made physical |
| **Boss-flatter** | value (bruise band at wing height) + temperature (only warmth = its gold eyes) + lit-edge carry; backlight-disc fallback sanctioned |
| **Stranger test** | "the void behind the world — are those masks?" |

### ARENA 2 — THE UNVEILED HEAVEN
| Axis | Value |
|---|---|
| **Name / epithet** | THE UNVEILED HEAVEN — *"What the Sky Was a Mask Of"* |
| **One-liner** | A gold composed judgment-light — cool zenith over a molten-gold horizon, god-ray shafts and gold rain over a bright sea, empty of everything but the seraph |
| **Identity triple** | hazard: the stage-3 exam (*Every Verdict at Once*) · verb: survive judgment in the light · anchor: THE UNMASKED S3 |
| **Palette (ceiling-legal)** | gold-forward, L≤.744: sky `6f88ad/c9a860/d9bc7e`, sunGlow `fff0cc`, fog `d4b982` 70/380, sun `fff2d0` I 1.9, water `5f7aa8/c4b98e` amp .5, motes `ffe9b8` fall +0.5; god-rays boosted; all six role colours PASS both bgs (verified) |
| **Silhouette-forms** | NONE — deliberately empty; the boss's halo + starburst ARE the architecture (the void got the furniture; the heaven gets the light) |
| **How "holy" reads** | composition, not brightness: cool-over-gold split · vertical shafts (the gallery) · gold horizon (the bench) · descending light-rain · lit sea · the dark seraph as the light's one shadow (sanctioned value inversion) |
| **Lore-rhyme** | the leash chain terminates here · the light the masks were carved against · the hollow = this heaven, shuttered (the pinholes) · the choir partial resolves |
| **Boss-flatter** | strongest-outline value inversion; boss gold now rhymes with the world ("true form is home"); HDR white focal stays supreme above the .74 ceiling |
| **Stranger test** | "heaven / the angel's final form" |

---

## 5. SOUND (one line each — optional, existing ambience infra, own increment)
Hollow: the entrance's held choir partial DIES on arrival; near-silent bed (a sub-audible
airless rumble at most) — the only sounds are the boss and the player's own wings.
Heaven: the partial RETURNS resolved into a full sustained chord under the exam. One
musical sentence across the whole finale: a note held → cut → resolved. Flag: coordinate
with the radio-pillar rule (ambience layers over, never replaces).

## 6. FLAGGED PLUMBING + BUDGET (everything not covered by the plan's env override)
1. **THE BLANKS** — new small mesh group (`js/voidBlanks.js`), ~12–18 draws, <1k tris,
   overdraw-safe shapes only; own def-gated increment AFTER PR-A; §2 probe + Fable
   placement gate required. (The only new geometry in this identity.)
2. **God-ray boost seam** — already named by the audit (F3.2, a main.js touch,
   graphics-branch flagged). The heaven's #1 holy channel depends on it.
3. **Fever/Surge policy (audit F3.3)** — recommend: **the player's own light wins** in
   both arenas (a magenta surge wash inside the hollow reads as *your fire is the only
   thing in here that's yours*; in heaven it's the player's rebellion against the
   verdict-light — both are good sentences). No damping term needed; accept.
4. **Ambience beds (§5)** — optional; existing layer infra; never blocks A/B/C.
5. Everything else in this doc is env values + the plan's existing seams (verified §2
   table of the plan; audit F1 prop-gate + F3.1 fauna fields assumed in).

## 7. REMAINING OWNER DECISIONS (short)
1. **O6 final form:** blanks as designed (6, lid-groove, one cracked Voidmaw blank) —
   sign off the motif, or hold the hollow permanently empty. (Ship order is empty-first
   either way.)
2. **The cracked blank's identity:** Voidmaw's (recommended — pays the title-glitch and
   the "it made the masks" rhyme with zero words) vs an UNKNOWN cracked blank (leaves a
   bigger gap, weaker rhyme).
3. **Arena names on stage cards?** The re-struck honest stage cards ("II — THE
   UNMASKED") could carry a sub-line naming the arena (e.g. *II — THE UNMASKED · the
   hollow behind the sky*). Cheap, canonizes the names in-game; or keep the cards
   boss-only.
4. **The §3.1 rider line** ("…the stars didn't change. They're holes.") — spend it or
   bank it. It's the pinhole retcon's only in-game delivery.
5. **Fever policy** per §6.3 (recommend: player's light wins, both arenas).
