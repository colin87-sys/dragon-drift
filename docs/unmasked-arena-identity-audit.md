# HARSH-CRITIC AUDIT — THE UNMASKED arena identity (`docs/unmasked-arena-identity.md`)

**Audits:** the creative identity spec for THE HOLLOW BEHIND THE SKY (S2) + THE UNVEILED
HEAVEN (S3), + its lesson `leapfrog/lessons/2026-07-11-unmasked-arena-identity-design.md`.
**Verified against:** live code this session — `tests/bulletcontrast.mjs`'s own `lum()`
re-run on every hex in the doc (numbers below are mine, not the doc's);
`js/bossUnmasked.js` (the actual materials the arenas must flatter); `js/biomes.js`
(the six shipped biomes' skies + `stars:` fields); `js/environment.js` /
`js/water.js` (the env fan-out, hemi intensity 0.8, the tier-0 Reflector);
`js/bossDefs.js:1715-1796` (the unmasked def).
**Verdict up front:** the doc's load-bearing arithmetic — the F2-blocker resolution — is
**REAL: I re-ran the gate's own formula and all eight role colours pass both heaven
backgrounds at fog `0xd4b982` (L .732) / horizon `0xd9bc7e` (L .744), and the void
palette passes with the declared Astral dark-band override.** The identity architecture
(cold-dark void vs warm-light heaven, furniture-vs-light, the pinhole retcon) is the
strongest creative work this feature has produced. **But the design is wrong in three
places that matter:** (1) its heaven ceiling has **0.006 of luminance headroom** and its
own escape valve ("push god-rays, never the sky") brightens the *effective* background
the gate never sees; (2) its boss-legibility sections are **arithmetic on the wrong
constants** — the "wing" hex it cites is the stage-1 lid material, and the "HDR white
star-eye ×2.4" it leans on **does not exist in the shipped model** (the ×2.4 is a
0.045-unit catchlight; the real S3 star-eye is a deliberately non-blooming L .516
sclera, *darker than the heaven sky*), so the gold-on-gold risk is materially worse than
the doc assesses; (3) the Blanks' one identity-carrying cue (the lid-groove) is authored
as a zero-emissive dark line on a near-black disc — **invisible by the design's own
§3b laws** — leaving six backlit dark ovals whose nearest familiar read is a field of
crescent moons. Findings ranked by ship-danger.

---

## F-1 (the load-bearing claim) — HEAVEN CONTRAST MATH: **CONFIRMED at the gate — with three fragilities the doc doesn't price**

### Independently recomputed (bulletcontrast's `lum()`, `OUTLINE_L=.030`, `CORE_L=1.0`, `MARGIN=.25`, `DIRECT=.15`)

| background | L | layered alive? |
|---|---|---|
| heaven fog `0xd4b982` | **.732** | YES (outline .702 ✓ / core .268 ✓) |
| heaven horizon `0xd9bc7e` | **.744** | YES (outline .714 ✓ / core **.256** — 0.006 above the floor) |
| heaven zenith `0x6f88ad` / mid `0xc9a860` | .523 / .666 | YES / YES |
| water shallow `0xc4b98e` | .722 | YES (doc's ≤.75 claim ✓) |
| void fog `0x0a0514` / horizon `0x1a0b2e` | .028 / .066 | no (direct-only territory, as expected) |

| colour | L | vs heaven fog | vs heaven horizon | vs void fog | vs void horizon |
|---|---|---|---|---|---|
| reflect-amber `0xffc23c` | .774 | direct .041 → **layered PASS** | direct .030 → **layered PASS** | direct .746 PASS | .708 PASS |
| reflected-cyan `0x66ddff` | .777 | .045 → layered PASS | .033 → layered PASS | .749 PASS | .712 PASS |
| danger `0xff2b6a` | .363 | .369 direct PASS | .381 direct PASS | .335 PASS | .298 PASS |
| band-light default `0xffc6dc` | .830 | layered PASS | layered PASS | direct PASS | direct PASS |
| band-light override `0xff9ec4` | .711 | layered PASS | layered PASS | PASS | PASS |
| band-mid `0xff4f9a` | .478 | layered PASS | layered PASS | .450 PASS | .412 PASS |
| band-dark default `0x8f0a3c` | .164 | PASS | PASS | **.136 FAIL** | **.099 FAIL** |
| band-dark override `0xa84167` (Astral) | .352 | PASS | PASS | .324 PASS | .286 PASS |
| surge-pink `0xff9ecf` | .714 | layered PASS | layered PASSs | PASS | PASS |

**So: the doc's central numbers are honest.** Its inline values (amber .746/.708 void
direct, .030/.041 heaven direct-fail-but-layered, water .722, horizon .744) all match my
re-derivation exactly — this was really run against the gate's formula, not eyeballed.
The void requires the declared `dark:0xa84167` override (default dark fails all three
void backgrounds), and the doc declares it. The "layered read revives below 0.75"
reasoning is **not hand-waving — it is precisely what the shipped gate encodes**
(`bulletcontrast.mjs:36`: `layeredOk` requires bg ≤ .75), and the AMBER WASTES fog
precedent (L≈.72 carrying the layered read) is the shipped acceptance of exactly this
regime. The F2 blocker is resolved *as the gate defines resolution*.

### The three fragilities (this is where the design is thin, not wrong)

**(a) 0.006 of headroom is not a shippable margin.** The horizon sits at bg L .744
against a hard cliff at .750, where amber and cyan lose their ONLY read (their direct
deltas are .030-.045 — nothing). One warm nudge in any future pass — a PR-C "small warm
lift" (the plan's own §3 grade line!), a Fable note of "a touch more golden" — crosses
the cliff invisibly. The doc's anti-washout law restates the ceiling, good, but a law in
prose does not stop a hex edit. **Fix (pick one):** author the horizon down to ~.72
(≈`0xd4b878`-family — costs nothing visible) to buy real margin, or keep .744 and make
T3 merge-blocking on *any* diff that touches the arena palette (state it in the PR-B
spec as a covenant, not a habit).

**(b) The design's own escape valve erodes its own fairness floor.** "If 'more heavenly'
is requested — push god-ray intensity, mote density, sun-streak; never the sky." But
god-rays are **additive shafts composited over the sky** — a bullet crossing a boosted
shaft is read against sky-plus-shaft, an *effective* background the byte-space gate
never measures. The core margin is .256; a shaft only has to add ~.01 of screen
luminance behind a bullet to kill the layered read locally. The #1 holy carrier and the
#1 fairness margin are the same pixels. Nobody in the chain (plan → audit → identity)
has priced this. **Fix:** cap the god-ray boost with the fairness ceiling in mind, keep
the boosted shafts biased to the flanks/upper frame (out of the ±10 bullet corridor —
they read as a gallery either way, which is the identity's own metaphor), and put
"amber vs a lit shaft" explicitly in the PR-B Fable gate frames. Same logic applies to
the PR-C warm-lift grade: the gate certifies pre-grade values; any lift needs a
re-judgment, say so in PR-C's spec.

**(c) The gate is luminance-only, and amber-on-gold is a HUE collision it cannot see.**
Amber `0xffc23c` (hue ≈ 40°) vs heaven fog/horizon (hue ≈ 40°) at ΔL .03: the amber
*body* of a parry bullet is chromatically camouflaged; only the dark outline + white
core carry it. That's "readable as a bullet" — but the player's parry training is
**amber = roll into it**, learned as a hue. In heaven, the hue channel is dead; an
amber shot and a pink band shot converge toward "outlined bullet with a core" at
distance. Not a gate failure (the gate passes it, and in Surge everything is parryable
anyway, which blunts the cost in exactly the stage that fires the most), but a real
residual the doc's "fairness holds" line papers over. **Fix:** none headless — this is a
named HARD owner/Fable feel item ("can you tell the parryable shot from the band shot in
heaven at fight distance?"), and it belongs in the doc's §2.4, not omitted from it.

**Verdict: SOUND WITH THE NAMED FIXES.** The numbers are real; the margin management
around them is not yet designed.

---

## F-2 (the biggest genuine error) — BOSS LEGIBILITY: **the doc's arithmetic is done on the wrong constants, and the S3 gold-on-gold risk is worse than it assesses**

The task said check gold-on-gold hard. I did. The design under-weighted it, and the
reason is traceable: it quotes materials that aren't the ones on screen.

**(a) "wings `~0x0b0a0c`" is not the wings.** `0x0b0a0c` is the **stage-1 LID**
material (`bossUnmasked.js:229`). The actual stage-2/3 wing feathers are the LADDER
`0x30303a`–`0x484852` with rims `0x5b6472`/`0x474e5a` (`bossUnmasked.js:328-332`) —
**MeshStandardMaterial, i.e. light-dependent**, albedo L .23–.39. So §1.5's "value
axis" (wings .04 vs bruise band .066) is arithmetic on a constant from the wrong
sub-rig. Run it with the real materials: in the void (sun `0x9a8fd8` I .55 behind the
boss, hemi ×0.8 of `0x241a3a`), the front faces render somewhere around L .03–.06 —
**statistically indistinguishable from the .066 band**. The void's claimed
"three axes of separation" is really ~1.5: temperature (real — the gold irises are
MeshBasic, arena-independent, and genuinely the only warmth in the dimension; this
axis is the design's best idea and it survives) and the lit-edge drawing. The value
axis is a rounding error. Consequence: **plan-R4's backlight-disc fallback should be
budgeted as LIKELY, not "already legal, not needed by default"** — pre-author it into
PR-A behind a flag so the Fable gate can A/B it instead of bouncing the PR.

**(b) "HDR white star-eye ×2.4" does not exist.** The only ×2.4 in the model is
`catchMat.color.multiplyScalar(2.4)` (`bossUnmasked.js:361`) — the **catchlight**, a
0.045–0.06-radius glint sphere. The shipped S3 star-eye is the L142 real-eye rig:
sclera `0x8f8365` (**L .516, tone-mapped, explicitly built NOT to bloom** — line 355's
own comment), gold iris `0x7a5c26` (L .36), dark pupil. The stage-1 focal
(`0xfff4e6`×1.7, toneMapped=false) died with the mask two stages ago. So the doc's §2.4
defense — "the boss's brightest points (HDR white star-eye ×2.4, gold starburst, halo)
sit ABOVE the sky's ceiling — §3 law 2 holds" — is **false as written**: the S3 focal's
body is *darker than the heaven's mid sky (.666) and horizon (.744)*. It survives
compositionally only because it reads against the dark core knot, not the sky — which
is fine, but it is not the argument the doc made, and §3-law-2 "hottest thing in frame"
is actually held in heaven by the **sunGlow (`0xfff0cc`, L .943)** — the *arena*, not
the boss.

**(c) The halo and starburst — the "architecture of the court" — measurably wash on
gold.** Halo: additive ring, color = accent `0xf0e0a0`×0.8 (contribution L≈.70),
opacity .7 (`bossUnmasked.js:670-677, 1004`) → over the void (bg .03) it's a +~.5
blazing ring; over the heaven horizon (.744) the sum clips toward white for a visible
delta of ~.25 *in the same hue as the sky*; over the sunGlow (.943) — **which §2.3
deliberately parks BEHIND the boss** — the delta is ~.06: the reserved corona
glow-shape, held for slot 14 since slot 1, **dissolves into the arena at the exact
moment the identity doc calls it the arena's architecture**. Starburst: rays are
additive, vertex-faded hot-base→**black tip** (`bossUnmasked.js:691-704`) — additive
black contributes nothing, so on a bright sky each ray's visible length *shortens*; the
radiance literally shrinks in heaven. And the L219 precedent says exactly where this
lands: the one owner rejection in value-inversion territory was "**a floating mask on a
sunset**" — a dark seraph whose gold has washed, over a gold sky, is that failure's
silhouette. The doc's poetic read ("the boss's light meeting the world's", "its gold
now rhymes with the world") is the charitable description of low contrast.

**Minimal fixes (small, but they are boss-file touches — new scope the doc must flag
the way it flagged the blanks):** an arena-conditional intensity lift on
`halo3Mat`/`burstMat` (both already retinted per-frame in the tick — a mix-driven
multiplier is value-space in spirit); move the sunGlow region LOW onto the horizon
bench rather than behind the boss (env-value change, free) so the halo reads against
.666-mid sky, not .943 glow; and make "S3 boss pop on the gold sky" a named Fable
Gate-2 frame. If the owner would rather not touch the boss file, the honest fallback
is: accept that in heaven the boss reads as **outline + eye-field only** and judge that
on the montage — but decide it, don't discover it.

**Verdict: UNDER-DESIGNED (needs another pass).** The two-inversion concept is right
and the void's temperature-sovereignty is genuinely strong; but §1.5/§2.4 as written
certify legibility with constants that aren't in the model, and the S3-in-heaven frame
— the game's self-declared poster — is the single most under-protected image in the
design.

---

## F-3 — THE BLANKS: **the one mask-cue is invisible as authored; the fallback read is six crescent moons**

The budget claims are honest — I verify them: opaque near-black discs + LineSegments
grooves (overdraw-exempt) + thin *partial* additive arcs behind the silhouette plane is
exactly the §2-sanctioned inventory; 6×(24-seg disc + lines + arc) is well under 1k
tris; ~12–18 draws is noise (draws aren't a budget axis); far-field additive coverage
<1% is nowhere near the two-large-volume cliff. The 3+3 mirrored placement, face-averted
tilt, flanks-not-center, one-frequency drift, and the single Voidmaw scar are §3.6/§3-law-2
compliant. The empty-first ship order is the correct rung-14 discipline. All of that
stands.

**What fails is the read chain:**

1. **The lid-groove — the ONLY cue that says MASK — is authored as "one dark engraved
   groove line" with zero emissive on a `0x0b0912` disc.** By the design's own cited
   laws (§3b.1 "modeled detail that never reaches the outline or an emissive edge is
   INVISIBLE"; §3b.3 "lit edges ARE the drawing"), a dark line on a near-black disc at
   far-field **does not exist for the player**. BRINEHOLM's brow was in the mesh too.
2. With the groove invisible, what remains per blank is: a tilted dark oval + a dim
   partial backlit arc. **A partial bright arc behind a dark disc is the crescent-moon
   glyph** — the single most familiar dark-sky shape there is. Six of them in a
   starfield doesn't say "workshop"; it says "night sky with moons" — which is the
   exact stranger-test failure ("night sky / space level") §1.1 names as death. The
   doc's anti-read list covers "another eclipse disc" (killed by the tilt, correctly)
   and the corona (partial arcs, correctly) but **never names the moon** — while
   simultaneously claiming the groove is what says "MASK, not moon." The anti-moon
   signal is carried by an invisible line.
3. **The lid-curve familiarity claim is a forward reference to an unshipped feature.**
   "The same hooded-lid curve the player has watched ride the horizon since mid-game" —
   the persistent second-sun landmark is CP2/INC-5, *not shipped*
   (`bossDefs.js:1756`: "CP2 upgrades to the secondSun.handoff() landmark approach";
   today `approachFrom:'ahead'`). Until it ships, the player has seen the lid curve in
   exactly one place: stage 1 of this same fight, minutes earlier. Weaker, though
   arguably sufficient — but the doc should not rest the cue on an audience memory
   that doesn't exist yet.
4. The cracked Voidmaw blank at ei ≤.25, far-field: legal (satellites law) and the
   right *choice* — but at that intensity and distance the crack is an easter egg for
   screenshot-zoomers, not "the memory hook" of the arena. Claim it as the former.

**Minimal fix (one change fixes 1+2 together):** give the lid-groove the arc's dim
violet-white emissive (ei ≤.25 — same satellites law the crack already obeys), or
route the backlit arc so it traces the LID-CURVE rather than the rim. Either way the
one shape that must reach an emissive edge, does. Then gate the increment on a Fable
frame at *fight distance* judging "masks or moons?" — the stranger test the doc already
promises, made specific. **Do the blanks compete with the boss?** No — flank/corner
placement, dim arcs, one slow frequency; the eye-field keeps the frame center. **Does
empty read as unfinished?** Empty-first is still right (see F-4 for its real weakness),
and the doc's own design-to-stand-alone requirement is the correct insurance.

**Verdict: SOUND WITH THE NAMED FIX** (emissive groove/arc + fight-distance gate);
as literally authored today, UNDER-DESIGNED — the identity cue is invisible.

---

## F-4 — THE "ANOTHER DIMENSION" READ: **each arena's hue collides with one shipped biome, and both collisions happen in the likeliest source fights — the doc defends one and never runs the other**

- **Void vs ASTRAL SHALLOWS — the anchor biome.** Astral ships `stars: 1`
  (`biomes.js:139`) — **`starMix → 1` is a literal no-op in the anchor fight.** Astral's
  sky is already violet near-black (top `0x05081e`, violet horizon band `0x6a3ab0`),
  already star-full. From Astral, the void's five channels degrade to: sun-gone,
  fog-swallow, mirror-calm water, up-dust, and a *dimmer violet band* — real, but the
  two loudest poetic channels (the stars, the violet identity) are deltas of zero and
  of value-only. Worse for §3.1: the arrival beat is scripted as "the pinhole-stars are
  simply *there*" — in the anchor fight **they were there the whole time**; the reveal
  stages nothing. The doc's §1.3 defense ("Astral keeps its sun, its band + whale")
  is true and correctly identifies the *distinguishers* — but it treats the roster's
  nearest neighbor as an edge case when it is the *designated default case*. Also one
  internal wobble: §1.1's counter-list says "no horizon glow-band shape of any biome,"
  and §1.3 then authors "the BRUISE BAND … it's the horizon" — a dimmer, colder band
  is still a band; the shape channel is not as clean as the counter-list claims.
- **Heaven vs AMBER WASTES — the roster's gold biome** (horizon `0xffcf96`, L≈.84, the
  brightest sky in the cycle, warm zenith `0x6a3820`). A ladder/rush/boss-select fight
  sourced in the Wastes transitions gold→gold at the unveiling; the cool steel zenith,
  shafts, rain, and blue sea must carry the entire "somewhere else" read — **and on
  tier 1/2 there are no shafts** (Law-10 degradation the doc itself states). The doc's
  stranger-counter even names the failure ("desert at noon") without naming the biome
  or running the case. The void got a named nearest-neighbor analysis; the heaven
  didn't.
- **The montage can't catch either as planned:** the plan's `arenashots` sources are
  Astral + Sanctuary. Sanctuary proves nothing hard; the two frames that matter are
  **Astral-source void** and **Wastes-source heaven**.

**Fixes:** (a) make Astral→void and Wastes→heaven mandatory montage rows (one-line
change to the arenashots spec — this is the cheapest high-value fix in this audit);
(b) accept that from Astral the void's read is carried by sun-gone + swallow + mirror +
up-dust and gate THAT frame, not the friendly-source frame; (c) for the heaven on low
tiers, name a free compensator now (mote/rain density is tier-independent and
env-driven — the doc's own "push mote density" lever, aimed at the right problem);
(d) the pinhole line's delivery problem gets worse here — see F-6.

**Verdict: UNDER-DESIGNED for the worst-case source biomes** (which include the default
one). The channels exist; the doc just never priced them against the neighbors that
matter.

---

## F-5 — DOES THE HEAVEN READ AS HOLY? **The doctrine is right; the carriers are concentrated in exactly the two things this audit found weakest**

The "composition, not brightness" doctrine is correct and well-derived: a cool
blue-grey zenith over gold IS an anti-sunset signal (sunsets grade warm all the way up
— true, and it survives all tiers because it's env values); god-ray verticals + slow
gold rain + a lit sea are legitimately court-like; hue-distance from EMBERTIDE
(vermilion→coral-rose field) is real, so the finale doesn't re-read as slot 13. The
two-crayon inversion (§1.6/§2.5) is a genuinely shareable idea.

But walk the carriers: **shafts** — tier-0 only, and now fairness-capped (F-1b);
**the boss's own halo/starburst as the architecture** — washes on gold as shipped
(F-2c); **deliberate emptiness** — reads as sacred only if the one figure in the frame
is crowned in light, i.e. only if F-2c is fixed. Ship the heaven exactly as authored
and the weak-mobile frame is: gold sky, gold rain, a bright sea, and a mid-grey seraph
whose gold ornaments have melted into the backdrop — that is "a big empty sunset,"
the doc's own named failure. The distinction between "the court was never built for
anyone else" and "we didn't dress this arena" is carried entirely by the boss's crown
reading loudly. **Fix = F-2c's fix; plus the tier-1/2 rain-density compensator (F-4c);
plus keeping "holy vs washed-out vs empty-cheap" as the HARD Fable/owner gate the plan
already assigns (R2).** The "arrival, not spectacle" feel-words are good tuning
language.

**Verdict: SOUND WITH THE NAMED FIXES — and explicitly contingent on F-2c.** The idea
is not the problem; the load path is.

---

## F-6 — LORE RHYME: **the architecture is earned; the delivery is optional-by-default in exactly the places the doc calls its biggest payoffs**

- **The pinhole retcon** is the best single idea in this design — one meaning-flip that
  retro-charges the whole game's sky, at zero cost. But the doc's own §7.4 admits its
  ONLY in-game delivery is the *optional, owner-budget* rider line, and F-4 shows that
  in the anchor fight there is no visual delta to even prompt the question. As spec'd,
  the design's self-declared "single cheapest, largest lore payoff" is **a private
  joke between the doc and whoever reads it** for the median player. If the retcon is
  worth building the void around, the line (or the O7.3 stage-card sub-line, which
  canonizes the arena names for free) is worth spending. **Promote it from optional to
  recommended-spend, and say which.**
- **"It made the masks"** is carried by the Blanks — which ship *after* PR-A by design.
  Honest consequence the doc should state: **the empty-first void's workshop identity
  is 100% non-diegetic in its shipping window** (a name on an optional card). The
  ship order is still right; the claim "the void reads as the maskwright's hollow"
  belongs to the blanks increment, not PR-A, and the PR-A gate should judge "another
  dimension," not "workshop."
- **The tear/entry-wound** (S1→S2 as Weftwitch's tear reopening): genuinely earned —
  it's delivered by the crack imagery itself and needs no words. Good.
- **The leash chain "terminates here"**: listed as an arena lore-rhyme, delivers zero
  visible signal in either arena (correctly anti-scoped in the void!). It's a codex
  sentence, not an arena identity — fine as a gap, dishonest as a claimed rhyme. Strike
  it from the identity sheets or mark it prose-only.
- **The layer-removal through-line** (mask → behind → what it hid) IS legible in play:
  the player experiences crack→through→light-blooms-from-the-boss in order, and the
  §3.2 "light blooms outward FROM the boss" rule gives the heaven its causality without
  a word. This part is real design, not caption.
- The choir-partial arc (§5) rides an *optional* increment referencing an entrance beat
  (*Don't Move*'s held partial) that is itself part of the unshipped completion-plan
  INC-6. Two dependencies deep — keep it flagged, never claim it.

**Verdict: SOUND WITH THE NAMED FIX** (promote the pinhole delivery; re-label the
leash/blank claims honestly).

---

## F-7 — TRANSITIONS: **SOUND AS DESIGNED** (feel-gated, as they must be)

Verified: both beats ride the shipped `stageBeatT/stageBeatDur` clock with fire held
(`attackTimer ≥ d + 0.7`, pending wiped) and no camera writes anywhere in the identity
(L156 honored); the composed frames are the shipped all-eyes reveal + 0.7s hold, so
"screenshot by construction" is legitimate. The piecewise flood (overexpose → drain,
never sky-A-to-sky-B) is the right teleport grammar and the doc adds real meaning
steering (the crack-light = the flood = the hollow leaking; gold blooms from
center-frame where the unveil flare already is). Three notes, none blocking:
(1) the void's mirror screenshot ("the seraph doubled in the black mirror") is real
**on tier 0 only** — `water.js` is a Reflector at tier 0 and an *analytic* sky fake
below (its sparkle glints will pass for star-shimmer, but nothing reflects the boss);
state the degradation the way Law 10 gets stated everywhere else. (2) Whether the
uniform-lerp gold flood actually reads as "blooming FROM the boss" is precisely the
kind of claim headless can never certify — it's already assigned to the Fable gate,
keep it there. (3) The rider's cyan chip shots keep firing through the beat (audit
F10) — cyan vs the gold flood (L≈.94) clears direct at .165, barely; accepted
transient, worth one line in PR-B.

---

## F-8 — SCOPE + OWNER GATES: **honestly scoped; two decisions missing, one mislabeled**

Yes — this is a multi-round Fable-gated art pass and the doc treats it as one
(empty-first, blanks def-gated with their own §2 probe + placement gate, PR-C as the
budgeted iteration space, every "reads as" claim routed to the montage). The genuinely
HARD feel gates that can never be certified headless, collected: void-reads-as-elsewhere
*from Astral*; blanks read as masks not moons; S2 silhouette vs the bruise band (expect
the fallback disc); heaven holy-vs-washout on tier 1/2; **S3 boss pop on gold**
(F-2 — the poster frame); amber parry-identity on gold (F-1c); both floods' motion.

The five surfaced owner decisions are the right five. **Missing:**
- **O-new-1 — the S3-in-heaven boss lift** (F-2c): arena-conditional halo/burst
  intensity and/or sunGlow placement — a boss-file touch outside the env-override
  contract, which must be surfaced exactly the way the blanks' new plumbing was. The
  doc doesn't know it needs this because it believed in a ×2.4 that isn't there.
- **O-new-2 — the god-ray boost cap** (F-1b): "how bright may the shafts get before
  the parry read is spent" is an owner fairness call, not a tuning detail — it is the
  re-framed O2 all over again, one compositor stage later.
- **Mislabeled:** the doc *assumes* plan-O5 (the mirror floor) as decided ("O5's
  recommended star mirror") — it's still an open plan decision; cheap to confirm, but
  confirm it.
- The rider line (§7.4) should carry the F-6 framing when surfaced: it is not "a nice
  line," it is the pinhole retcon's only delivery mechanism.

---

## Component verdicts

| Component | Verdict |
|---|---|
| Heaven palette derivation (fog .732 / horizon .744, 8-colour pass) | **CONFIRMED — SOUND WITH NAMED FIXES** (re-author to ~.72 or covenant T3; god-ray cap; amber-hue feel gate) |
| Void palette + band override | **CONFIRMED / SOUND AS DESIGNED** (default dark fails, override declared — correct) |
| Void identity (empty, PR-A) | **SOUND WITH NAMED FIXES** (Astral-source montage row; judge "dimension" not "workshop"; expect the R4 fallback disc) |
| THE BLANKS increment | **SOUND WITH THE NAMED FIX** (emissive lid-groove/arc — as literally authored, the mask cue is invisible and the moon anti-read wins) |
| Boss-flatter §1.5 / §2.4 | **UNDER-DESIGNED** (wrong constants: lid-mat quoted as wings; nonexistent ×2.4 star-eye; halo/burst wash on gold unpriced — needs the S3 pop pass) |
| Heaven "holy" identity | **SOUND WITH NAMED FIXES — contingent on the S3 pop fix** (carriers currently concentrated in tier-0 shafts + washed gold) |
| Lore rhymes | **SOUND WITH THE NAMED FIX** (promote the rider line; strike/relabel the leash claim; blanks-window honesty) |
| Transitions (§3.1/§3.2) | **SOUND AS DESIGNED** (tier-0 mirror disclosure; Fable-gated motion) |
| Scope / gates / owner decisions | **SOUND WITH TWO ADDITIONS** (S3 boss lift; god-ray cap; confirm O5) |

## Must-fix before build

1. **Heaven margin management (F-1a/b):** author horizon to ~.72 *or* declare the
   T3 merge-block covenant; cap + corridor-bias the god-ray boost; add "amber inside a
   lit shaft" and "amber parry-identity on gold" to the PR-B Fable frames.
2. **Correct the identity doc's constants and add the S3 pop pass (F-2):** real wing
   LADDER hexes; delete the ×2.4 star-eye claim; add the arena-conditional halo/burst
   lift + sunGlow-at-the-bench options as a flagged boss-file touch; make
   "S3 on gold" a named Gate-2 frame.
3. **Blanks read chain (F-3):** emissive lid-groove (ei ≤.25) or lid-tracing arc;
   add MOON to the anti-read list with its forbidden primitive (bright partial arc
   behind a dark oval, unrelieved); fight-distance Fable frame "masks or moons?".
4. **Worst-case-source montage rows (F-4):** Astral→void and Amber-Wastes→heaven are
   mandatory arenashots rows; name the tier-1/2 heaven compensator (rain density).
5. **Lore delivery honesty (F-6):** promote the pinhole rider line (or the stage-card
   sub-line) out of "optional"; PR-A's gate judges "another dimension," not
   "workshop"; strike the leash-chain rhyme from the identity sheets.

## Owner decisions that genuinely block starting PR-A (the void)

- **Fever policy (§6.3 / audit F3.3)** — already BLOCKED-ON-DECISION at the audit;
  the identity recommends "player's light wins" with good sentences; needs the sign-off
  before PR-A's arena states are authored.
- **Plan-O5 (the mirror floor)** — the identity *assumes* it; one-line confirmation
  (and accept the tier-0-only reflection disclosure).
- **R4 fallback pre-authorization** — given F-2a (the value axis is ~zero), authorize
  building the backlight disc behind a flag IN PR-A so the Fable gate can A/B rather
  than bounce.
- Everything else (O6 blanks form, the cracked blank's identity, stage-card sub-lines,
  the rider line, and both heaven decisions) blocks the *blanks increment* or *PR-B*,
  not PR-A — the empty-first order correctly quarantines them.

*What this design gets right, for the record: re-deriving every hex with the gate's own
formula before writing them down (the numbers all check); dress-one-empty-the-other;
empty-first shipping; the pinhole meaning-flip; the anti-scope list; the two-crayon
doodle inversion; and honestly naming the blanks as the one piece of new plumbing. The
failures found here are the next layer down: constants quoted from the wrong sub-rig,
margins with no headroom, and identity cues that don't survive their own §3b laws.*
