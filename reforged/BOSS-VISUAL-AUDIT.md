# BOSS VISUAL AUDIT — the harsh pass (2026-07-19)

**What this is.** A full-roster visual critique of all 14 bosses, judged from real captures
(studio contact sheets + fight-distance frames through the live bloom/ACES pipeline, per the
§7c studio law), rated /10 against ONE question: **would this frame sell the game in a
trailer?** Below 8.5 = not yet trailer-grade. Every boss scored below 8.5, so every boss gets
an uplift directive, grounded in the boss-visual-design research digest at the bottom.

**How the captures were made** (repeatable):

```
cd reforged
ONLY_STATE=idle,charge,dread ONLY_BG=dark,sunset node tools/bossstudio.mjs <bossId> critique
# → reforged-captures/<bossId>-studio-*.png + <bossId>-fight-*.png
```

The **fight-distance frame** (FOV 72, rel 30, no auto-framing) is the primary verdict — it is
what a player/trailer actually sees. Contact sheets diagnose *why*.

**Independently audited.** A second, fresh Fable critic re-scored the whole roster BLIND
(captures first, this doc only afterwards) per the AAA-PIPELINE "builder never judges its own
output" law. Verdict: **sound-with-corrections** — component findings corroborated
independently (including Karnvow's anarchy-"A"), all directives perf-legal, but three
corrections were accepted and are folded in below: the **T7 FOCAL CLIP** tell (the audit's
biggest miss), a **score recalibration** (concept was being overpaid vs. delivered pixels),
and a **trailer-first priority track**. Where the two judges disagreed by >0.5, the CONSENSUS
column shows the reconciled score.

**The perf frame.** Every directive below is 60fps-mobile-safe by construction: geometry,
palette, baked vertex-color ramps, LineSegments, and per-event lights only. Nothing adds a
large additive/fresnel shell (the §2 overdraw cliff). Triangles and draws are effectively
free at our scales; that is the budget these fixes spend.

---

## THE SCOREBOARD

Columns: **A** = original audit score · **B** = independent blind Fable score ·
**CONSENSUS** = reconciled (used everywhere below). The blind pass found the original audit
**overpaid for concept** (Stormrend, Embertide, Brineholm — ideas the pixels don't deliver
yet) and **underpaid frame-filling presence** (Hollowgate, Weftwitch).

| # | Boss | A | B | CONSENSUS | One-line verdict |
|---|------|---|---|-----------|------------------|
| 14 | THE UNMASKED | 6.5 | 7.0 | **7.0** | Roster's best composition (s2 seraph); feathers are flat navy planks, relics/halo invisible. |
| 10 | KNELLGRAVE | 7.0 | 7.0 | **7.0** | Real dread mood (chain + candle crack); bell profile mushy, clapper never teased. |
| 8 | BRINEHOLM | 7.5 | 6.0 | **6.5** | Scale genuinely lands — but the hero eye CLIPS to a blown white crescent at the fight frame (T7). |
| 2 | STORMREND | 6.5 | 5.5 | **6.0** | A mandala, not yet a monster: cog-core anti-read, wiry mass, clipped white core. |
| 13 | EMBERTIDE | 7.0 | 5.5 | **6.0** | Arresting concept; blur-soup with zero crisp edges, and the round hollows read startled-emoji, not dread. |
| 6 | HOLLOWGATE | 5.0 | 6.0 | **5.5** | Real presence + legible focal; pillars are still clean cardboard boxes (blockout read). |
| 11 | WEFTWITCH | 5.0 | 6.0 | **5.5** | Frame-filling web drama is above-median; mitten hands, pretzel buttons, nose-lamp face drag it down. |
| 4 | MARROWCOIL | 5.5 | 5.5 | **5.5** | Right value claim (bone on void); skull face is mush + headlamp lure, ribs tangle front-on. |
| 12 | ONEWING | 5.5 | 5.5 | **5.5** | Dramatic asymmetric silhouette; pastel mauve kills the grief, head is a dandelion lamp. |
| 3 | ASHTALON | 5.5 | 4.5 | **5.0** | Killer silhouette on a light sky; ~95% invisible on its own home value — a broken frame, not a quirk. |
| 1 | VOIDMAW | 4.5 | 4.0 | **4.5** | Great eyes on a flat mid-purple blob with confetti rectangles and pool-noodle halo arcs. |
| 7 | THRUMSWARM | 4.5 | 4.0 | **4.5** | Identity IS the formation and the formation is invisible — dark motes on dark sky. |
| 9 | KARNVOW | 4.0 | 3.5 | **4.0** | Wireframe-blockout body, juggling-ball trophies, Verdict sigil reads as a scribbled anarchy-"A". |
| 5 | EITHERWING | 3.5 | 3.5 | **3.5** | Both judges independently: tadpoles/sperm cells with a chrome-outline rim. Shape rebuild. |

Consensus average ≈ **5.4/10**. The good news: the failures are heavily REPEATED — seven
recurring cheap tells account for most of the lost points, and none of the fixes threaten
60fps.

---

## THE SEVEN ROSTER-WIDE SLOP TELLS (fix these patterns, lift half the roster at once)

These extend the AAA-PIPELINE §2 registry with boss-specific instances. The external research
(digest below) names the same failure modes independently — this is what "AI slop" reads as.

**T1 — BLOCKOUT READ: untextured clean prisms/wireframes shipped as final.**
Hollowgate's pillars (stacked white boxes), Karnvow's wireframe robe, Ashtalon's brick cowl,
Weftwitch's box-palm hands. Clean unbroken prisms scream asset-flip. *Law:* every large prism
gets ≥1 of: chipped/beveled corners, recessed seam lines, an irregular course. Carving is
geometry — free.

**T2 — MID-VALUE PASTEL BODY: the near-black law ignored.**
Voidmaw (mid-purple), Onewing (lavender), Unmasked (slate navy), Eitherwing (oxblood + bright
rim). §3.3 says ~75% near-black with identity hue in EMISSIVE — a mid-value diffuse body
reads as a toy under bloom (research: TF2/Hollow Knight value-reservation; Hades
black-shadow chiaroscuro). *Law:* crush body diffuse to near-black; bake a vertical
dark→light vertex ramp (under-body dark → crown lit) so it's sculptural, not flat.

**T3 — DEBRIS CONFETTI: unauthored floating chips.**
Voidmaw's face rectangles + purple cubes, Ashtalon's cinder squares, Stormrend's two floating
tori, Weftwitch's scattered pretzel knots. Randomly placed small elements read as glitches
(research: "scattered greebles" = the #1 asset-flip signature). *Law:* every satellite is
authored, mirrored or orbit-pathed, and visually TETHERED (a filament, an orbit trail, a
socket it broke from).

**T4 — PING-PONG-BALL FOCAL: a bare glowing sphere as the "eye."**
Marrowcoil's lure (a ball sitting ON the skull), Karnvow's cowl orb, Eitherwing's shared eye,
Weftwitch's hood lamp. L157 already ruled it: **an HDR focal needs ANATOMY** — sclera + iris
ring + pupil + proud catchlight, or a teardrop lantern with an inner core. Brineholm's eye is
the shipped counter-example and it carries a 7.5 almost alone.

**T5 — PRESENCE COLLAPSE AT FIGHT DISTANCE.**
Eitherwing (two thin ovals), Thrumswarm (invisible motes), Karnvow (wire ghost), Ashtalon on
dark. The L140/L141 lesson keeps recurring: presence = on-screen span × LIT-EDGE area at rel
30. A boss whose lit edges vanish has no mass no matter the tris. *Law:* judge the
fight-dark frame first; if <~8% of the frame carries lit boss pixels, add lit-edge area
(emissive filaments on anatomy, lifted facet albedo), not scale.

**T6 — SCRIBBLE FX: hatch-line spectacle instead of drawn ribbons.**
Karnvow's Voidmaw's-Verdict seal renders as pencil scribbles (and accidentally draws an
anarchy-"A" — a catastrophic anti-read for the roster's lore-payoff moment; the independent
blind pass read the same letterform). Registry tell #10: a line read needs ONE continuous
ribbon threaded through authored nodes, blooms riding its peaks — never independent hatch
marks. Same family: Eitherwing's dotted handoff polyline reads as a DEBUG GIZMO / editor
annotation, not an organ.

**T7 — FOCAL CLIP: emissive that tone-maps to textureless white at fight distance.**
*(Added by the independent audit — the original pass's biggest miss.)* Distinct from T4:
anatomy can EXIST and still clip. Brineholm's celebrated eye is a blown white crescent at
the rel-26 fight frame — the sclera/iris/pupil work is not survivable through bloom+ACES at
that intensity; the same clipping kills Stormrend's core, Eitherwing's pearl, Onewing's head
lamp, Karnvow's cowl orb. *Law:* cap focal emissive so the IRIS RING keeps visible hue at
fight distance — numeric gate: hue must survive at the 90th-percentile pixel of the focal
region in the fight-dark capture. The core carries brightness, the halo carries hue
(registry tell #6) — but only if the core is capped below full clip.

---

## PER-BOSS VERDICTS + UPLIFT DIRECTIVES

Format: what works / what fails (with tell IDs) / the uplift (all perf-safe).

### 1 · VOIDMAW — 4.5/10
**Works:** the living eyes — white-hot, angry, tracking; the one genuinely premium element.
**Fails:** body is flat mid-purple (T2), face carries ~15 random small rectangles (T3 —
reads as digital noise, violates §3.6 authored-symmetry), the halo arcs are thick pastel
salmon tubes ("pool noodles") hovering unanchored (T3) and sit uncomfortably near the
danger-magenta family, the broken-horn scar reads as a plumbing elbow, silhouette = generic
round blob with stubble spikes.
**Uplift:**
- Crush the mask to near-black stone; vertical vertex ramp (jaw dark → brow lit). Violet
  lives only in emissive crack-seams.
- Replace the confetti with TWO mirrored carved relief bands converging on the sockets
  (carved, not scattered — L126), plus exactly one asymmetric crack toward the broken horn.
- The halo: thin, TAPERED stone arc shards in violet-white HDR, varied lengths, tilted in
  depth, each visibly a fragment of ONE broken ring (negative-space gaps aligned) — a shattered
  halo, not floating macaroni. Re-hue off salmon.
- Make the broken horn the dominant silhouette cue (≈3× current stub) with an ember core in
  the break face — it's the lore hook and currently invisible.

### 2 · STORMREND — 6.5/10
**Works:** concentric counter-rotating blade rings around a calm eye — real identity, real
focal discipline, motion built into the body. Closest to its intended read.
**Fails:** the eye's cog-toothed surround reads MECHANICAL ("arc reactor," anti-read for
weather), rings are thin wire at rel 30 — the boss is 80% empty black (T5), the two floating
side tori are debris (T3), each blade is one flat teal value (flat-sails tell #12).
**Uplift:**
- Eye anatomy pass: replace cog teeth with layered storm-lid shapes + iris ring; keep the
  white-hot core + pupil.
- Value-band every blade root→tip (dark root → lit tip, baked vertex color) and jitter blade
  widths per index-hash — mass and depth for zero draws.
- Make ring B dominant (≥2× blade chord of A/C) per the dominance ladder — three equal rings
  read as wire.
- Delete the floating tori; replace with 2–3 authored storm-arc LineSegments crackling
  between rails (already the idiom, currently barely visible).

### 3 · ASHTALON — 5.5/10
**Works:** on the sunset frame the scythe-wing raptor silhouette is the best pure silhouette
in the roster — one sentence, instantly a hunting bird; molten visor slit + ember scar work.
**Fails:** on the DARK backdrop the boss is ~95% invisible (T5 — charcoal on near-black with
no lit edges; L162's lifted-albedo law violated); the cowl/prow is a hard rectangular brick
(T1); cinder chips float as untethered squares (T3); wing interiors are featureless voids
even at 3/4 lit angles.
**Uplift:**
- Ember vein filaments (tapered, recessed — registry tell #1 compliant) tracing the wing
  bones + leading edges, idling at ei ~0.15 with occasional crawl-pulses: the wing draws
  ITSELF in the dark, exactly like a banked coal. This alone fixes the dark-sky read.
- Lift facet albedo to "lit near-black" (L162) so hemisphere light models the wing planes.
- Bevel + taper the cowl into a raptor prow; kill the brick corners.
- Tether the cinder chips: a short ember-trail LineSegment each, orbiting the wing-root
  cracks.

### 4 · MARROWCOIL — 5.5/10
**Works:** bone-white-on-void value claim is correct and owned; rib arcs + vertebra chain
read well in profile; the ice palette is clean.
**Fails:** front-on (the 95% view) the skull is MUSH — eyes are black rectangles, not cold
pinlights (T4-adjacent: no anatomy), the lure is a white ping-pong ball sitting ON the
cranium (T4 — "headlamp"), horns read as stubs, and the ribcage stacks into an overlapping
comb-tangle ("shopping cart of ribs") instead of one readable aperture.
**Uplift:**
- Re-carve the skull FRONT elevation as an emblem: enlarged socket recesses, ice pinlights
  set deep with a proud catchlight each, visible hinged jaw line, nasal void.
- Hang the lure BETWEEN the horn tips on a visible catenary strand (LineSegments) as an
  anatomized teardrop lantern (outer glass + inner HDR core). A lure below eye-line makes the
  skull loom; a ball on top makes it a miner's helmet.
- Dominant-taper the horn crown (long, swept, asymmetric break on one — its scar).
- Stage the front-on rib read: pull ribs 2–4 into ONE clean elliptical aperture ring at
  fight distance (the fly-through promise), letting the rest trail off in perspective.

### 5 · EITHERWING — 3.5/10 (shape rebuild required)
**Works:** the orbit choreography concept; the handoff thread exists.
**Fails:** the twins are smooth dark ellipsoids with trailing spaghetti — the instant
anti-read is **tadpole/sperm cell** (a §3b stranger-test fail); the full-perimeter orange rim
is the chrome-outline tell (#4); the tiny pale fin reads as a leaf; the shared eye is a bare
pearl (T4); combined on-screen lit mass at rel 30 is the lowest in the roster (T5, the
recorded L140 failure still live).
**Uplift (this is a §3b translation redo, not a tune):**
- Give each twin DART-WRAITH anatomy: a notched wedge head, TWO swept scythe-wing blades
  per body (inherit the ashtalon blade kit — the registry even plans this inheritance), and a
  forked tail ribbon instead of tendrils. The silhouette sentence must become "a barbed dart,"
  not "a comma."
- Kill the perimeter rim. Oxblood edge light ONLY on leading edges + the socket rims —
  broken, not enclosing.
- The shared eye gets Brineholm-grade anatomy (sclera dish + iris + pupil + catchlight) and
  ~2× size; the handoff thread becomes a taut lit filament with bead-pulses traveling it
  (this is also slot 12's severed-thread lore object — it must be iconic here first).
- Scale the pair until the DUO spans ≥60% of Ashtalon's on-screen mass at rel 30.

### 6 · HOLLOWGATE — 5.0/10
**Works:** value-inverted near-white claim; the rose window + spike ring; the sky-hole idea.
**Fails:** the pillars are stacks of CLEAN white boxes — the strongest blockout read in the
roster (T1: no carving, no ruin, no mortar, corner-perfect); the panes are flat solid color
wedges reading as a trivia-wheel/beach-ball, not stained glass; the ivory mass has no value
tiers (pale but flat).
**Uplift:**
- Carve the pillars: chipped corners, recessed mortar seams between courses, one collapsed
  course per pillar with the rubble authored at its foot, faint grime darkening at the base
  (vertex ramp: dark base → pale crown — this is the pale-boss version of T2's law).
- Rebuild panes as irregular leaded cells: 3–5 cells per petal with dark mullion bars,
  per-cell value/saturation spread (deep glass vs milk glass), so lit panes read as GLASS.
- Keep the migrating lit-pane pupil — it's the charisma carrier — but let its light spill a
  soft gradient onto the surrounding stone (emissive on the adjacent stone faces, not a glow
  shell).

### 7 · THRUMSWARM — 4.5/10
**Works:** the queen's amber focal eye; the scatter→condense concept is strong on paper.
**Fails:** the ENTIRE identity is the formation and the formation is invisible — motes are
dark navy tetrahedra on a dark sky (T5); the registry claims "void-black · STAR-WHITE /
scattered points" and the star-white simply is not on screen; the condensed your-dragon
copy doesn't read as a dragon (unlit point-cloud mud); the queen reads as a small crystal
rocket.
**Uplift:**
- Give every mote a tiny star-white emissive point (small + numerous = starfield, staying
  under the focal per §3.8 — the queen's amber eye remains hottest). The swarm must read as a
  CONSTELLATION, not gravel. (L162 said exactly this; it hasn't landed.)
- At dread/condense, thread faint ghost LineSegments between neighbor motes so the dragon
  copy self-draws as a constellation diagram — the meme frame finally reads, overdraw-free.
- Queen: scale the amber eye ~1.5×, add two swept wing-nub blades so she reads as the
  swarm's mother-shape, not a gem.

### 8 · BRINEHOLM — 6.5/10 consensus (was "the bar" at 7.5 — the independent audit demoted it)
**Works:** the only boss that already sells scale — the head fills and exceeds the frame;
bioluminescent motes; shackle hardware tells the story; gullet glow under the teeth.
**Fails:** **the hero eye CLIPS (T7)** — at the rel-26 fight frame the L157 anatomy
(sclera/iris/pupil/catchlight) tone-maps to a blown white crescent; the roster's flagship
focal is a textureless smear in exactly the frames a trailer would use. Plus: teeth/baleen
picket fence (registry tell #2: equal flat solid-green triangles, no rank decay); side fins
are flat purple/mint paddle-pops (tell #12); the crown rock blob reads as floating debris
(T3); head panels faintly man-made.
**Uplift (exposure FIRST, then the polish sweep):**
- **Eye exposure pass before anything else:** cap the core's HDR multiplier until the iris
  ring holds visible teal hue at the fight frame (the T7 numeric gate); let the HALO carry
  the brightness read. Without this, every other polish polishes around a broken hero.
- Teeth: dominant + steep-decay rank ladder, per-tooth width/height jitter (index-hash),
  root-dark→tip-light vertex band, slight translucency step at tips.
- Fins: value-band by depth (taut root lit → cup shadow) + 2 fold ridges each.
- Tether or delete the crown blob; break head panel lines with 2–3 barnacle clusters +
  kelp-strand LineSegments trailing the jaw.

### 9 · KARNVOW — 4.0/10
**Works:** the lance (dark shaft, gold head) and the cowl concept; vertical duelist
proportions are right; the dread-card AMBITION (a screen-scale violet seal) is correct.
**Fails:** the robe/body renders as pale-blue WIREFRAME boxes — an unshaded blockout ghost
(T1, T5); the trophy chain is dull colored spheres + a wagon wheel — reads as Christmas
ornaments/juggling balls, destroying the lore payoff (each trophy must ATTRIBUTE its owner);
the Voidmaw's-Verdict seal draws as multi-stroke hatch scribbles and accidentally composes an
anarchy-"A" glyph (T6) — the single worst frame in the audit.
**Uplift:**
- Solidify the robe: near-black opaque planes, lit edge-seams only at the hems + shoulder
  blades (structured, sparse); keep the reaper-thin silhouette.
- Trophies = miniature silhouettes of their owners' HOOKS, not spheres — but MAX 3, each
  ~2× the current sphere size, staggered heights, ONE accent glint each (independent-audit
  correction: a full charm-bracelet of sub-10px trinkets at rel 30 just becomes new T3
  confetti). Pick the three most iconic: Voidmaw's snapped horn (violet break-glint),
  Ashtalon's feather-blade (ember slit), a bell shard. Gate on a fight-distance readability
  check, same as the seal's anti-letterform test.
- Redraw the Verdict as ONE continuous ribbon tracing an authored rune-ring (arc + horn
  glyph nodes, bloom riding the pen tip) per registry tell #10. No hatching. Verify the final
  composed shape against anti-read glyphs (it must never letterform).

### 10 · KNELLGRAVE — 7.0/10
**Works:** chain links descending out of darkness, the candle-gold crack, near-black body
with one warm slit — the value discipline the rest of the roster needs; genuinely ominous.
**Fails:** at the fight frame the bell's PROFILE dissolves — lip and waist landmarks lost in
undifferentiated darkness (the silhouette carries no information); the yoke hardware is fussy
mid-grey clutter; the bound clapper — the drawable dread, the whole hook — is never even
hinted at idle.
**Uplift:**
- Bake a whisper of cool edge-light down the bell's profile curves (vertex ramp on the outer
  rim faces) so the black-on-black silhouette reads without a glow shell.
- Simplify the yoke to 2–3 heavy authored forms.
- Tease the clapper at idle: through the crack, a sliver of the figure's candle-lit
  shoulder/head, occasionally SHIFTING (2-frequency idle motion). The dread should start
  before the first swing.

### 11 · WEFTWITCH — 5.0/10
**Works:** the radiating arena threads (LineSegments — free and striking); gold spike crown;
the gold-lines-on-grey palette claim is distinct.
**Fails:** the detached hands are BOX PALMS with rod fingers — the exact recorded CRAGHOLD
"mitten" failure, shipped again (T1); pretzel-knot motifs scatter across the robe like
buttons (T3); the hood contains a white blob that reads as a nose-lamp (T4); the robe is a
closed kite/shield shape (front-on reads as a beetle).
**Uplift:**
- Hands are the face (its charisma carrier): articulated tapered finger chains (the kit
  exists — Craghold's inheritance), knuckle joints, mid-weave pose at idle. This is the #1
  fix.
- Move the knots ONTO the threads (motifs traveling the web, thread-dew glints at
  intersections); strip the robe to matte moth-grey with ONE embroidered seam line.
- Empty the hood of the LAMP — but not to a total void (independent-audit correction: hands
  20+ units apart can't carry a headless kite at fight distance). Leave one residual read at
  ~1/10 the old intensity: two faint thread-glint slits or a stitched-seam "closed eye";
  the hands remain the primary face.
- Fray the robe hem into 5–7 woven strands that visibly BECOME arena threads — body merges
  into web, the L141 field-is-the-body read.

### 12 · ONEWING — 5.5/10
**Works:** the lopsided one-vast-wing silhouette is dramatic and unique; torn-feather
language; trailing broken-spike legs; the chest-hole concept is visible.
**Fails:** the palette is mid-lavender — pastel mush (T2) that reads plush-toy, not grief
(its registry claim is "most desaturated, blackened silver"); the head is a spiked ball
with a lamp — a dandelion/shuttlecock (T4 + anti-read); the fused twin frame reads as a
kite-frame with a wagon wheel (same wheel motif as Karnvow's — a collision); the severed
bead-thread (its claimed glow-shape) is not visible at all.
**Uplift:**
- Crush to ashen near-black + blackened silver; grey-rose ONLY as the lit edge of the vast
  wing's leading feathers.
- Author a head: a low cowled skull with ONE dim living socket and one EMPTY socket (the
  grief hook) — no lamp ball.
- Re-carve the chest fusion as the dead twin's actual dart-frame (post-rebuild slot-5
  silhouette) caged in ribs — an echo a player can recognize.
- Ship the claimed glow-shape: the snapped bead-thread dangling from the chest frame, beads
  going dark along its length — the one broken lit line on the body.

### 13 · EMBERTIDE — 7.0/10
**Works:** the only full-frame identity; the overflow is real ("it never fits"); the dark
face-in-the-light concept lands at first glance; palette owns sunset.
**Fails:** the face is BLUR-SOUP — soft ovals in soft gradient with zero internal value
structure (the L219 directive — BOLD structured bands bending around the head — has not
landed); **the EXPRESSION anti-reads (independent-audit find): two round hollows + a round
"oh" mouth compose a STARTLED EMOJI, not dread** — texture fixes alone won't cure a goofy
face; the mouth hollow has a hard sticker edge against an otherwise fully soft field; no
scale cues, so it can read as a lava-lamp closeup rather than a horizon-sized entity.
**Uplift:**
- Structure the field into 4–6 distinct banded strata with definite value steps; make the
  bands visibly BEND around the skull volume and BREAK at the jaw (jaw dissolves into tide —
  L219 verbatim).
- Angular-ize the eye hollows (hexagonal-ish negative cuts, asymmetric) and cant them
  DOWNWARD with a brow-shadow band above — this kills the startled-emoji read; let the mouth
  edge fray into the band flow — kill the sticker edge.
- Scale cues: a few tiny dark cinder silhouettes drifting ACROSS the field (birds-before-
  the-sun grammar) — 20 tris, sells kilometers.

### 14 · THE UNMASKED — 6.5/10
**Works:** the six-wing radial fan + eye array composition is instantly a biblically-accurate
seraph — the concept photograph; the great central eye has proper anatomy; the all-snap gaze
concept is the game's screenshot.
**Fails:** feathers are large single-value slate-navy PLANKS (tell #12 + T2 — value too
light, zero banding, scallop edges read as paper cutouts); wing eyes are flat cartoon almonds
(no lids, rim, or catchlight); the worn relics at the wing-roots are unreadable pixel
clutter; the reserved gold corona/halo is absent from the money frame; overall it reads
slate-blue, not black-gold (its registry palette).
**Uplift:**
- Darken feathers to near-black; per-feather root→tip value band + width jitter + depth
  stagger between ranks (kill the plank stack); a thin gold rachis filament on leading
  feathers ONLY (structured, sparse — the lit-edge drawing).
- Wing eyes: add lids + a gold sclera rim + one catchlight each; blink in scattered clusters
  (never in sync — metronome tell).
- Make the halo REAL in the s2/s3 frames: one thin gold ring strictly BEHIND the silhouette
  plane (overdraw-legal), igniting at the all-snap.
- Relics: one per wing-root, each a recognizable mini-silhouette with a single accent glint
  (same directive as Karnvow's trophies — shared kit, build once).

---

## RESEARCH DIGEST → THE LAWS THAT RAISE SCORES (sources in the research report, PR body)

The full research (SotC, Monster Hunter, TF2, Hollow Knight, Hades, Furi, Cuphead, Panzer
Dragoon, Sin & Punishment, Returnal, Tunic/Sable/Monument Valley/Solar Ash, Derek Lieu's
trailer-craft writing) compresses to eight operating laws for THIS engine:

1. **Blackout test as a gate.** TF2/Monster Hunter discipline: the boss must be nameable
   from a pure black fill at fight distance (§3b already says this — enforce it in
   bossstudio as a standard render, not an occasional check).
2. **One loud idea per boss.** Capcom stripped mechanics off Rathalos to protect the "main
   character feel." Every element restates the one-line identity or gets deleted. Deleting
   is the cheapest premium move that exists.
3. **Value is the product.** Hollow Knight reserves white; Hades pairs saturated accents
   with pure black. Body near-black (or near-white for sanctioned inversions) + vertical
   value ramp + ONE reserved accent = the entire "premium low-poly" look. Flat mid-value =
   toy.
4. **Glow is attention currency.** SotC glows ONLY the sigil. One active glow system per
   state, always core→bloom→dark-surround, withheld until a beat. Bloom spent everywhere
   buys nothing.
5. **Scale is composed, not modeled.** Treasure's "big foot problem": establish the WHOLE
   body once (reveal/approach), then fight the parts; keep the player dragon in frame as the
   ruler; slow big things down (√scale animation timing); impact events (shake + debris
   burst), never ambient particle soup.
6. **Anticipation is the photogenic frame.** Cuphead: the wind-up pose is the best
   silhouette held long enough to read — it is simultaneously the gameplay telegraph, the
   screenshot, and the trailer freeze. Author attack anticipation as pose-first.
7. **The reveal is a lighting event.** FromSoft grammar: darken/desaturate → backlit
   silhouette in atmosphere → accent ignites on the roar. Three uniform lerps + one rim
   DirectionalLight during reveal beats only — no per-frame cost elsewhere.
8. **Bespoke detail > uniform detail.** Tunic/Solar Ash: concentrate triangles in the
   head/crown/hook; leave the body planar with ramps. Consistency of the style laws across
   the roster is itself what reads as money.

**Trailer shot grammar** (what the capture tool should eventually script, per boss):
tease (silhouette in atmosphere) → reveal (whole body, low angle, light event) → scale pass
(fly-under/past, boss sweeps frame) → telegraph hold (anticipation pose) → David-vs-Goliath
frame (tiny bright player, boss fills top ⅔) → competence beat (clean dodge/weak-point hit)
→ phase-turn/kill (palette inversion or withheld-glow ignition, then a held quiet frame).
A `?trailer=1` mode (HUD off, deterministic seed, scripted path) is the single highest-value
tooling investment for selling the game.

---

## PRIORITY ORDER — two tracks (independent-audit correction)

The original single queue optimized *worst-frame removal*. The independent audit's point,
accepted: **a trailer shows your best 5–6 frames**, so ceiling-raising near-trailer bosses
sells the game before floor-raising bosses you'd cut from the montage. Run the TRAILER track
first if the goal is the trailer; the FLOOR track is still mandatory before ship (players
stream everything).

**TRACK A — TRAILER (ceiling-raisers, cheapest first):**
1. **UNMASKED feather banding + halo + relics** — already the roster's best composition at
   7.0; this is the Apex money frame and the highest trailer-ROI item in the doc.
2. **BRINEHOLM eye-exposure fix (T7) + teeth/fins sweep** — every trailer cut will feature
   this head; right now its hero focal is a blown white smear in all of them.
3. **EMBERTIDE band structure + de-emoji the face** — horizon-scale face is exactly trailer
   grammar; cheap fix, top-3 concept.
4. **VOIDMAW value + halo pass** — boss 1, the demo/first-trailer boss.
5. **ASHTALON ember veins** + **THRUMSWARM star-point pass** — tiny, transformative; both
   frames become trailer-usable overnight.
6. **KNELLGRAVE profile edge + clapper tease** — near-done atmosphere piece.

**TRACK B — FLOOR (no embarrassing frame ships):**
7. **EITHERWING shape rebuild** (3.5; Tier-2 peak; blade-kit inheritance makes it tractable).
8. **KARNVOW trophy + seal + robe pass** (4.0; the lore payoff; its dread card is the worst
   frame in the roster).
9. **HOLLOWGATE carving + leaded panes** (5.5).
10. **WEFTWITCH hands + hood** (5.5; finger-chain kit exists).
11. **MARROWCOIL skull emblem + lure hang** (5.5).
12. **ONEWING value crush + head** (5.5).
13. **STORMREND eye anatomy + ring dominance + core exposure cap** (6.0).

Every item on both tracks is palette/vertex-color/geometry/LineSegments work — zero new
additive volumes, zero post-FX, 60fps-safe by the §2 budget rules.
