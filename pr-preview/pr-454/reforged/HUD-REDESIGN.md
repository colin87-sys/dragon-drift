# Dragon Drift — **EMBERSIGHT**: the in-flight HUD redesign

**This document GOVERNS the flight HUD.** It supersedes the in-place scopes of
**U8 / U9 / U10** in [`UI-PREMIUM-OVERHAUL.md`](./UI-PREMIUM-OVERHAUL.md) (those IDs now
point here; the overhaul's Phase 3 executes the increments in §D below). Everything else
in the overhaul plan — the EMBERLINE constitution §A, the don't-break list §D, the Fable
Quality-Gate protocol, `uishots`/`uitokens` — applies to this work unchanged. Constraints
unchanged: vanilla Three.js r160, no build step, DOM/CSS over WebGL, 100% procedural,
60fps weak mobile, landscape AND portrait first-class.

Provenance: synthesized 2026-07-14 from three independent concepts — **EMBERBOND**
(dragon-diegetic), **THE CREANCE** (falconer's instrument), **SKYWRIT** (cinematic-
ambient) — and a 2022–2026 HUD state-of-the-art research report, judged against the
audited overhaul plan and the code. The scorecard in §A.3 records what won and what was
killed, so future sessions don't re-litigate.

---

## A. The merged concept

### A.1 EMBERSIGHT, in one line

> *The dragon is the gauge and the gauntlet is the instrument: a falconer's cluster of
> ember hairlines that only speaks when a decision is owed — everything else you read
> off your dragon and the sky.*

EMBERSIGHT keeps THE CREANCE's **chassis** (the five-primitive instrument grammar, the
gauntlet cluster, the tape/plate aviation lineage — the most legible, feasible, cohesive
skeleton of the three), adopts SKYWRIT's **relevance extremism and player contract** (the
quiet-sky cruise state, SCOREKEEPER, the critical-state world grading), and phases in
EMBERBOND's **living-dragon channels** behind flags as the freshness layer no shipped
game has (trend-encoding wing luminance, spine ignition). The research's four-layer
consensus stack is the frame: *sensation in the world, state in hairlines near the
avatar, evaluation as ephemeral events, density governed by a state machine with
per-element player override.*

### A.2 The five laws

1. **THE DRAGON LEADS, THE GAUNTLET DECIDES.** Ambient state lives on the dragon
   (silhouette/glow signals only — component ignition, light retreating along the wing,
   never surface detail); decisions live in DOM chrome. Every diegetic channel has an
   **authoritative DOM twin** that *pins on screen* whenever the state is (a) critical,
   (b) actively changing, or (c) in a decision window — the Callisto/Falcon Age rule:
   diegesis is never the sole source. Where both exist, the dragon fires **frame 0**, the
   chrome echoes **+120ms** (`--t-micro`). And the chrome retreats exactly as far as the
   dragon can carry: rest-ghost alphas drop a step only when the flagged dragon channel
   (§D H7/H8) actually ships and passes its gate.
2. **FIVE PRIMITIVES, SEVEN ANCHORS.** Every element is built from **hairline / tick /
   caret / cell / slug** (inline SVG or masked divs, zero assets), every hairline carries
   the **dual-stroke keyline** (1px `--rf-stroke` warm line + 1px dark drop-shadow — the
   bright-biome survival trick), and every numeral sits on a **slug** (smoked lozenge,
   `rgba(12,8,6,0.28)`, `--r-s`) instead of glow-stacking. Fixed anchors, nothing floats:
   **GAUNTLET** (bottom-center vitals cluster) · **TAPE** (top-center distance) ·
   **TALLY** (top-right numbers) · **BELL** (single toast lane) · **LURE** (the reticle)
   · **MEWS PLATE** (boss bar) · pause (top-left). Two numeral sizes only: `--fs-title`
   (20px) primary, `--fs-label` (13px) secondary; labels `--fs-micro` Rajdhani 700 caps;
   Russo One `tabular-nums` for every number.
3. **CENTER IS SACRED.** Within ~140px of the Lure: brackets, dwell fill, lock pips,
   brand marks, telegraph chevrons — nothing else, ever. No meters, no score, no surge
   notches at the gaze point. (The flagged Creance tether is the sanctioned 0.14-alpha
   exception, and it is hard-hidden in boss fights.)
4. **STATE MACHINE × RELEVANCE.** The HUD is a body-class state machine —
   `hud-cruise / hud-combat / hud-boss` — and every element declares
   `{states, show-when, ghost-to, return}`. Idle/full = ghosted (alpha **0.30**, the
   floor; never today's 0.18 dust) or hidden; any change returns the element in
   **≤150ms**; the relevance ticker runs **≤4Hz**, class toggles +
   transform/opacity only. Player settings override per element (§F).
5. **EVENTS OVER FURNITURE.** Evaluation is ephemeral: the chain-end Tally ritual, the
   PB light-seam, Bell toasts, graze sparks — born at the beat, dissolved after it.
   Nothing permanent celebrates; zero-counts never render; sensation (speed, danger,
   fever) stays in the world layer — the HUD reports state, never sensation.

**Garnish law (adopted from research emerging-idea #4):** idle pulses (gauntlet breathe,
ghost fades) quantize to the dragon's wingbeat clock where one is exposed — interface as
heartbeat. Subtle enough that noticing the loop means it's too strong.

### A.3 Provenance scorecard

Scores: premium feel / legibility-at-speed / EMBERLINE cohesion / feasibility / freshness (out of 10).

| Concept | Scores | What WON (in EMBERSIGHT) | What was KILLED, and why |
|---|---|---|---|
| **THE CREANCE** (B) | 9 / 9 / 9 / 9 / 7 | **The chassis:** five-primitive grammar, dual-stroke keyline, slug; the GAUNTLET cluster (one SVG unifying arc + LIFE + SURGE + damage arcs); the TAPE with the sliding PB caret; the TALLY column + race caret strip; the BELL; the MEWS plate + DLZ column (flagged); off-screen boss chevrons; lens2-as-only-reticle executed fully; the tether (flagged) | Rest posture softened: SKYWRIT's relevance wins at cruise (CREANCE kept too much visible when idle). DLZ column demoted to flagged/late (peripheral duplicate of the at-gaze pip row). Nothing structural killed — B is the skeleton |
| **EMBERBOND** (A) | 8 / 6 / 8 / 6 / 9 | **The living-dragon layer (flagged):** wing-charge stamina with directional drain, spine-ignition surge (+ shape-agnostic fallback contract), body-light health (emissive floor clamp ≥0.75) + ember-bleed + 1-heart coreGlow heartbeat; the +120ms Bond-Echo rhythm; the legibility covenant (= Law 1's pinning rule); the ember *swallow*; the PB light-seam; trail-as-combo tint (lerp cap 0.5); boss-bar etch-in intro | "DOM as residue" posture inverted — research (Callisto, Falcon Age) says the DOM twin must be **authoritative**, not apologetic; under stress players read chrome. Damage arc chips at the reticle moved to the gauntlet (center-sacred + research's avatar-anchored ruling). Hit-side wing flare demoted to stretch (mirror-rigged wings likely share one material — its own table's cut condition) |
| **SKYWRIT** (C) | 9 / 6 / 7 / 7 / 9 | **The player contract:** SCOREKEEPER toggle; quiet-sky cruise as the relevance target; VIGIL critical treatment (perimeter breathe + postfx desat/vignette at last heart, behind one grading arbiter); the visible fever-drain timer; the chain-end TALLY ritual; skyLuma bright-biome keyline swap; first-increment discipline; "perfect" micro-pop at the reticle | **KINDLE corners** — a third surge channel (gauntlet + spine already), corner overdraw + bright-sky washout its own keyline law concedes. **THREAD top-edge boss bar** — loses the nameplate anchor (card→plate type continuity is a cohesion win), fights cinebars/notch, and research's best practice is bottom-center thin. **The Glance gesture** — a third mid-flight touch contends with two-thumb steering + pause; SCOREKEEPER + ≤150ms returns cover the need. **Reticle surge notches** (Law 3). **Rival lantern** (rode the dead THREAD). **Summoned-only score** (buries the score-chaser cohort). **Ember corner flecks** (the swallow is fresher, on the dragon) |

**The shared core all three delivered independently — declared foundation, not up for
debate:** kill always-on clutter via relevance; lens2 brackets = the one reticle; DOM
boss bar on the existing `emit('bossHit')` seam (boss.js:5520) with phase notches from
`def.phases[].atFrac` + drain-lag, WebGL sliver → locator pip; one queued toast lane;
protected systems verbatim (boss title/spell/FELLED cards, seal chain + BOOST SEALED,
hud-sew, cinebars, lock pips + brand marks, gesture tutorial); EMBERLINE tokens, role-
locked accents, no new blur, transform/opacity only.

---

## B. Element-by-element specification

Legend — **Layer:** WORLD (WebGL scene/postfx) · DRAGON (flagged emissive channels,
§D H7/H8) · DOM (chrome). Every DOM element: dual-stroke keyline, safe-area insets,
`--hud-scale`/`--hud-alpha` respected, reduced-motion collapses to fades.

### B.1 HEALTH — the LIFE terminal (`game.health` / `CONFIG.obstacleDamage`)
- **DOM (authoritative):** 3–5 stroked heraldic-lozenge pips (14px SVG, joins the U7
  `ICONS` set; the `♥` glyph at style.css:358 dies) on the gauntlet's **left horn**.
  Full = warm-white fill + hairline; empty = hairline only at 0.35.
  **Rest** (full health): ghost to 0.30 after 3s (→ 0 when `dragonVitals` flag ships,
  Law 1). **Active:** return ≤150ms on damage/heal, lost pip cracks + gutters
  (scale 1.3→1, `--ease-spring`, 400ms), hold 4s. **Critical** (last heart): pip **pins**,
  magenta pulse 1.2s; a 2px magenta hairline creeps along the whole gauntlet arc.
- **WORLD (critical only — VIGIL):** perimeter edgelight breathing inward at 2.2s
  (two-layer: 20–28px dark warm scrim core + magenta light on top — light carried on
  shadow, readable on any sky) + postfx grade `desat −0.12, vignette +0.10` via the
  **single grading arbiter** (never fights fever lift). Existing damage vignette + shake
  untouched.
- **DRAGON (H7, flag):** body-light — each heart lost steps the emissive floor down and
  lerps body mats ~8% toward cold ash, **multiplier clamped ≥0.75** (never crush value
  tiers on dark biomes); ember-bleed motes from the flank (~12 pooled sprites); at 1
  heart `coreGlow` recolors danger-magenta and beats ~1.1Hz — a heartbeat in the chest
  at chase distance.
- Tokens: magenta role only; `--t-ui` in / `--t-exit` out.

### B.2 STAMINA / BOOST — the gauntlet arc (`game.stamina`, 3 cells; sealed in boss)
- **DOM (authoritative):** the shipped 3-cell smile arc (style.css:362–408) kept and
  re-stroked to grammar — track alpha 0.24 → **0.38** + keyline, cyan fill via the
  shipped `stroke-dasharray`/`pathLength` technique.
  **Rest** (full + idle): ghost to 0.30 after 2s (→ 0 with `dragonVitals`).
  **Active** (boost held / regen): full alpha in ≤150ms; filled cells breathe at 1.5s
  while boosting (the "gauge is live" tell); regen shows the distinct refill phase.
  **Denial:** boost attempted while empty → 1–2px transform shake (research: denial
  feedback). **Critical** (<15%, last cell): cell blinks amber and the arc refuses to
  hide until boost releases.
  **Boss:** the chain-link + "BOOST SEALED" beat verbatim (credited), re-stroked to
  hairline weight; arc dims 40% and freezes.
- **DRAGON (H7, flag):** WING-CHARGE — the three cells map to finger-bone glow ranks
  lighting root → carpal → tip (the existing spine-glow bucket writes, remapped via a
  `bondChannel.setVitals()` seam consumed in `dragon.js` updateFx); draining boost
  visibly pulls light back toward the shoulder, regen crawls it back out — **trend
  encoding**, the research's emerging idea #1. Sealed: wings bank to dim coals so dragon
  and chrome agree.
- **WORLD:** speed sensation stays where it lives — FOV kick, speedlines, trail density.
  The HUD never conveys speed (research finding 1).

### B.3 SURGE — the SURGE terminal (`consecutiveRings` vs `feverThreshold`)
- **DOM (authoritative):** 5 stroked-diamond cells (11px) on the gauntlet's **right
  horn**, unlit alpha **0.35** + keyline (the 0.18 "sensor dust" at style.css:505–507
  dies). Each chained ring = `gem-pop` (kept). At 4/5: filled gems shimmer in sync
  (desire state). **Ready:** the whole gauntlet ignites once — arc + both horns flash
  gold-white (`--ease-spring`, 600ms) + U11 audio ping + the boss-note slot whispers
  SURGE READY (shipped slot). **Fever:** the gems become the **draining fever timer**
  (cells empty left→right — today the timer is invisible); the postfx fever grade stays
  the world's voice, untouched.
- **Multiplier:** `×2.40` slug (13px Russo One tabular) under the arc keystone; appears
  only when combo > 1; pops `--t-micro` per gain. One location for the multiplier —
  never also at the reticle.
- **DRAGON (H8, flag):** SPINE IGNITION — five dorsal surge nodes (new per-recipe marker
  list; **shape-agnostic fallback contract:** tail-chain segments, else coreGlow steps)
  ignite nose-to-tail, one per ring, frame 0; the DOM gem echoes +120ms. All five lit =
  crest/tail-tip gem blazes gold. Roster-safe by the fallback contract.
- Tokens: gold role; fever hands off to magenta.

### B.4 SCORE + CHAIN — the TALLY (top-right column)
- **Score:** `--fs-title` (20px) Russo One tabular in a slug — the 40px triple glow
  dies; tier warm-up survives as the **slug's hairline color** (data-tier ramp), not
  text glow. Earn-pop kept. **Rest:** ghost to 0.30 after 4s without gain; return
  ≤150ms on any earn. **SCOREKEEPER** (§F) pins it at full alpha permanently.
- **Chain chip:** appears at ≥2 (shipped behavior), gold, with a hairline underline
  filling in cells of 5; pop per link. A live chain is a decision window — it never
  ghosts while active.
- **THE TALLY RITUAL (chain-end):** when a chain ≥5 ends, the Bell carries
  `+1,840 · ×2.4 CHAIN` — `--fs-title` gold, masked stroke-write 300ms, hold 900ms,
  dissolve upward as 3–4 gold motes (shipped ember-mote CSS). Score as moments, not
  furniture (research pattern 9).
- **WORLD echo (H8, flag):** trail tint lerps from the dragon's authored hue toward
  ember-gold with combo tier — **lerp cap 0.5** so it never fights dragon identity.

### B.5 GRAZE / SKIMS (boss-only counter)
- **DOM:** teal `7 SKIMS` chip in the Tally, **appears on first increment** (never
  "0 SKIMS" — U1), tick-pop per skim, cyan role.
- **WORLD echo (H9, flag):** one-shot spark burst at the grazing wingtip (pooled
  sprites) if the near-miss check exposes contact side; fallback = tail-chain shimmer.

### B.6 DISTANCE + PB — the TAPE (top-center; the one permanent readout)
- **DOM:** a 160px horizontal hairline (portrait 120px) with ticks every 20px, a fixed
  center caret, and the live numeral **`1 403 m` at 20px Russo One tabular in a slug**
  (fixing the inverted hierarchy — critique 3.8). Ticks scroll subtly with distance
  (translateX loop) — the instrument visibly measures. **Always-on** (with the reticle,
  the only permanent chrome).
- **THE PB CARET:** a gold ★-topped caret rides the tape at the personal best's position
  when within ±500m — you watch your record slide toward center (translateX, ≤4Hz). On
  passing: caret snaps to center, flashes gold, `NEW BEST` rings the Bell, caret rides
  center for the rest of the run. Replaces the "★ PB" text reveal.
- **WORLD echo (H6):** at the exact PB meter a single thin gold light-seam sweeps past
  in-world (one billboard, spawned once per run from the saved PB — deterministic,
  despawns). Crossing your record is a *place*.

### B.7 EMBERS (currency)
- **DOM:** `◆ 124` (SVG gem icon, U7) in the Tally, `toLocaleString`, 13px; pop on gain,
  dim to 0.35 after 2.5s (shipped behavior kept).
- **WORLD (H6):** the *swallow* — a 150ms `coreGlow` opacity tick on collection; the
  dragon eats the ember.

### B.8 RETICLE / LOCKS — the LURE (one authority; U10 executed here)
- The **lens2 hollow-bracket** language (shipped, default-ON for bosses via Bullet
  Clarity, `lensFlag.js`) becomes THE reticle for **all** states; the nested-squares
  pair (`.rsq`, style.css:552–598) + ring-focus circle + WebGL ring glow retire
  (`tricount`/`tiershots` gate on the WebGL ring).
- **Ring/gate cruise:** four corner brackets, gold for rings / cyan-white for gates
  (hue roles kept), shipped 6s rotation + scale-with-distance.
- **Acquire→lock:** brackets shrink-snap 1.15×→0.85× over 150ms ease-out + the shipped
  `.rsnap` expanding ring + the U11 lock grammar (search = soft 4Hz tick while framed,
  lock = one solid tone — 90% audio).
- **Boss:** the shipped lens2 system **verbatim and protected** — dwell steel→mint,
  sealed/ashen greys, threat-yield halo, magenta telegraph chevrons off `bossCharge01()`,
  lock-pip row + `lanceRune` brand marks with `--life` drain. The Lure only re-strokes
  it to dual-stroke hairline weight (3.5px → 2px + keyline).
- **OWNER RULING (2026-07-15, overrides any earlier reading):** the lance lock-pips
  (banked locks, rune brand-marks, volley fuse, dwell/sealed/ashen states) are AIMING
  information and **stay AT THE RETICLE / point of aim, within eyesight — exactly where
  they are today**. Their POSITION and BEHAVIOR are UNCHANGED; H4 only re-strokes their
  line weight to the EMBERSIGHT hairline grammar. **No lance/lock cells go on the Gauntlet**
  (it stays hearts + stamina + surge only) and lock state is **never duplicated at the
  bottom of the screen**. The DLZ column (§B.9) is the sole, flag-gated peripheral echo.
- **THE CREANCE TETHER (H9, flag `?tether=1` — owner-taste call):** one 1px dash-gapped
  gold hairline from the gauntlet keystone to the Lure — the falconer's line, doubling
  as the flight-vector lead (this IS U10's stretch goal). Rest alpha 0.14; brightens to
  0.30 on acquire; jade flash on lock; **hard-hidden in boss fights** (Law 3). One div,
  transform-only, updated in the existing reticle pass. First cut if it reads as clutter.

### B.9 BOSS HP + PHASES + SPELL CARDS — the MEWS PLATE (U9 executed here)
- **DOM (the one authority):** new `js/bossBar.js` subscribed to the **existing**
  `emit('bossHit', {hp, hpMax, frac})` (boss.js:5520) + `bossStart`/`bossEnd` — no new
  WebGL seam needed. Bottom-center, 46vw (max 420px), slotted into the collision-managed
  boss-slot system **above** `.boss-note`'s band (style.css:248): 1px hairline housing,
  5px magenta-warm fill (`transform: scaleX`), **phase notches from `def.phases[].atFrac`**
  (bossKit.js already computes them — inherit, don't invent), **drain-lag** gold chunk
  (500ms delay, 400ms drain). **Intro:** the bar **etches in stroke-by-stroke ~800ms
  synced to the title card** — the hud-sew grammar as the plate's signature.
  `formLifebars` refill = a deliberate left-to-right **re-forge shimmer** (reads "new
  bar," never "healing"); FELLED/revive beats need live-fight eyes (§E).
- **Nameplate:** name `--fs-title` Russo One caps + epithet `--fs-micro` caps — the same
  type ramp as the protected title card, so card→plate is one voice.
- **WebGL over-model sliver:** retired to a locator pip (never double-reported).
- **DLZ column (flagged, late — OWNER RULING: OFF by default):** a small vertical strip
  at the bar's right end summarizing `lockHudState()` — banked pips/cap as cells, ashen
  greys it. It is **STRICTLY behind `?dlz=1`, OFF by default, built minimally** — a
  "cut-first" luxury the owner is unlikely to use; it must never render without the flag.
  The at-gaze pip row (§B.8) stays the primary, authoritative lock read.
- **Spell card:** kept lower-right (protected behavior/animations) but re-chromed —
  slug + magenta left hairline + caret timer, folding the sixth panel language into the
  grammar. **Warn:** `⚠` emoji → stroked SVG triangle (U7).
- **Off-screen threat chevrons:** when the boss / a volley origin is outside the
  frustum, a magenta stroked chevron slides along the screen edge at the projected
  bearing, alpha scaled by `bossCharge01()`. Pool of 4, `translate3d`+rotate in the
  existing lock-projection pass.

### B.10 DAMAGE DIRECTION
- **DOM (authoritative):** four 30° magenta arc segments on an invisible ring just
  outside the gauntlet (avatar-anchored — the research's ruling for chase-cam). On hit,
  the segment facing the impactor flashes 0.95 and fades 0.7s; stroke width ×1→×2 with
  severity. Flight-plane mapping: up = above you, down = below. Needs the impact side
  passed at the collision call site (one param).
- **WORLD:** the shipped vignette red pulse kept as the felt layer, now
  **quadrant-weighted** (four gradient layers; the struck side reaches full alpha).
- **DRAGON (stretch, inside H7):** hit-side wing flare 120ms — only if per-side wing
  materials are cheap; mirror rigging likely shares one material (§E). Cut freely.

### B.11 PICKUPS / FEATS / MILESTONES / HINTS — the BELL (one toast lane)
- popup / popup2 / feat-toast / milestone-banner / hint collapse into **one anchored
  queued slot** at top ~24% center (portrait ~20%): one line Rajdhani caps in a slug,
  accent underline by role (gold reward / cyan graze / jade unlock / magenta warning),
  enter `--t-ui` rise+fade, exit `--t-exit`, min display 900ms, queue depth 3 with
  coalescing (`+50 ×3`). Every Bell message pairs with its U11 tone.
- **Perfect-ring** `+150 PERFECT` pops **at the Lure** instead (where the deed happened),
  tiny, 500ms — the one sanctioned center-adjacent event text.
- Assist chip / first-flight chip: one-shot Bell lines + a persistent 11px micro-tag
  under the Tally only while active (feather/sun as SVG).

### B.12 RACE-VS-GHOST
- **DOM:** the navy `.race-bar` dies (§A.2 eviction). Replaced by a **two-caret
  tick-strip** under the Tally: one 90px hairline, your caret gold vs rival caret white,
  `vs 1 850` in micro caps. **Relevance-gated** (visible when the gap is within 15% or
  closing; ghosted otherwise). Overtake: rival caret falls off the end, strip flashes
  gold, `RIVAL BEATEN` rings the Bell.
- **WORLD echo (H6):** trail flashes gold 1s on overtake.

### B.13 Ten seconds of play (the merged design)

**0.0s — cruise.** The frame is almost empty: four gold brackets drifting on the next
ring, `1 204 m` ticking on the Tape, everything else ghosted to a whisper. The gauntlet
breathes faintly under the dragon on its wingbeat; two surge diamonds already lit on the
right horn. Score, hearts, embers — barely there. The world is the picture.
**1.8s — ring, third chain link.** Flight path enters the catch radius: brackets
shrink-snap, tick→tone, ring taken — a third diamond pops on the horn, `×1.45` pops in
its slug under the keystone, score un-ghosts top-right and ticks up, the chain chip
gains a cell. *(With the H8 flag: the third spine node ignited nose-to-tail 120ms before
the diamond echoed.)*
**4.1s — clipped a spire.** Frame 0: flinch, camera shake, the left quadrant of the
vignette blooms and the gauntlet's left damage arc flares magenta — behind-left. The
LIFE pips snap to full alpha, the third lozenge cracks and gutters out. They'll hold 4s,
then leave you alone. *(Flagged: embers bleed from the left flank; the body-light sinks
a step toward ash.)*
**6.0s — boost held.** FOV kicks, speedlines pour. The arc wakes in ≤150ms, first cell
draining, filled cells breathing; on the Tape the gold ★ caret has slid into view — your
record is 400m ahead and approaching. Release: refill phase glows through, then the arc
ghosts back to sleep. *(Flagged: the light drains tip-to-carpal along your wings.)*
**8.5s — boss entry.** Stroked-triangle WARNING, cinebars breathe in, the arc chains and
dims — BOOST SEALED. A magenta chevron slides along the right edge: she's coming in from
three o'clock. As the title card lands, the Mews plate **etches in stroke-by-stroke**
beneath the dragon — name, epithet, three phase notches glinting. The surge horn holds
its banked diamonds and pins: you'll want it for phase two. The HUD has rotated from
harvest to hunt without one element leaving its anchor.

---

## C. Portrait + landscape

Same DOM, reflowed by media query — no per-orientation nodes. All anchors keep
`env(safe-area-inset-*)`; touch targets ≥44pt; nothing tappable within 16pt of edges;
nothing informational under the thumb arcs.

- **Landscape (play-primary):** as specced. Gauntlet `min(38vw, 170px)` at the shipped
  arc anchor (~64% down, center); Tape 160px top-center; Tally right-aligned column;
  Bell at 24%; Mews plate 46vw above `.boss-note`'s band; damage-arc ring at gauntlet
  radius ×0.75.
- **Portrait:** the dragon sits lower and larger — chrome retreats further. Gauntlet
  horns fold **inward** (LIFE left / SURGE right at the same y, cluster ≤55vw), and the
  cluster rises clear of the bottom-20% thumb zone; Tape narrows to 120px and drops the
  tick strip (numeral + PB caret only); Tally compresses to two rows (score+chain /
  embers+skims); Bell rises to ~20%; Mews plate 82vw with the nameplate above the bar;
  damage-arc radius ~110px; toasts one-line ellipsized; `--hud-scale` nudges to 0.92.

---

## D. Build plan — increments H1…H9

Each independently shippable; **DOM-only wins land first, flagged WebGL after**
(coexist → prove → migrate; the shipped roster never breaks). One increment per PR,
Fable Gates 1+2 per PR. **Every increment's gate includes:** `uishots` HUD states (both
orientations, bright seeded biome), `tests/run-all.mjs` green, uitokens rule (d) —
no layout-prop animation on HUD selectors; plus the per-increment gates below. This is
the overhaul plan's **Phase 3** content.

| Inc | Size | Contents | Extra gates |
|---|---|---|---|
| **H1** | M | **State machine + relevance + the Bell.** `hud-cruise/combat/boss` body classes; the ≤4Hz relevance ticker + `{show-when, ghost-to, return}` table; the single queued toast lane absorbing popup/popup2/feat-toast/milestone/hint | uishots: cruise-ghosted vs active states; toast queue coalescing headless test |
| **H2** | M | **The Tape + the Tally.** Distance instrument + PB caret; score demoted to 20px slug w/ tier-hairline; chain chip + underline cells; embers/skims restyle (first-increment rule); race caret strip (navy race-bar dies); **SCOREKEEPER** toggle | uishots: PB-approach state; arm's-length legibility over Frozen Reach frame (human) |
| **H3** | M | **The Gauntlet.** Arc re-stroke + LIFE + SURGE horns in one SVG; multiplier slug; damage-direction arcs (+ impact-side param at the collision site); denial shake; fever drain-timer; VIGIL critical perimeter + grading arbiter; **IMMERSIVE toggle** (rides the state classes) | uishots: full/damaged/critical/fever/sealed states; on-device 60fps `?debug=perf`; grading arbiter vs fever lift eyeballed live |
| **H4 ✅ BUILT** | M | **The Lure (U10).** lens2 brackets extended to ring/gate; `.rsq` pair + ring-focus + WebGL ring glow retired; shrink-snap grammar; U11 search-tick→lock-tone; dual-stroke re-stroke of boss skin | `tricount` + `tiershots` (WebGL ring retirement); `?lens` A/B kept for review |
| **H5 ✅ BUILT** | M | **The Mews plate (U9).** `bossBar.js` on `bossHit`; phase notches; drain-lag; etch-in intro synced to title card; re-forge shimmer for `formLifebars`; WebGL sliver → locator pip; spell-card re-chrome + SVG warn triangle; off-screen chevrons; DLZ column behind `?dlz=1` | live-fight eyes on formLifebars + FELLED/revive (audit risk #3); tricount/tiershots (sliver retirement); uishots boss state |
| **H6 ✅ BUILT** | S | **World echoes + settings matrix.** Ember swallow; PB light-seam; overtake trail flash; skyLuma bright-biome keyline class; wingbeat-sync garnish; per-element override UI (always/dynamic/off) in settings | tiershots (billboard + coreGlow writes); settings matrix persists across reload (headless) |
| **H7** | L | **The Living Gauge I** — flag `?vitals=1` → settings toggle. `bondChannel.setVitals()` seam; wing-charge stamina (bucket version; span-gradient `onBeforeCompile` stays a sub-flag); body-light health (clamp ≥0.75) + ember-bleed; 1-heart coreGlow heartbeat; chrome rest-ghosts deepen one step **only when flag ON** | tricount + tiershots across roster tiers (incl. Frozen Reach / bright + dark biomes); Fable critic per checkpoint (DRAGON-DESIGN process); on-device 60fps; flag-OFF pixel-identical |
| **H8** | M | **The Living Gauge II** — same flag family. Spine-ignition surge nodes (per-recipe markers + tail-chain→coreGlow fallback contract); trail-as-combo tint (lerp cap 0.5); +120ms echo wiring | tiershots per hero dragon as nodes are authored; roster fallback proven on an unauthored dragon |
| **H9** | S | **Signature garnish** — `?tether=1` Creance tether (boss-hidden, first-cut candidate); graze wingtip spark (side-data permitting, else tail shimmer); hit-side wing flare **only if** per-side materials are free | owner-taste review on PR preview; tricount if wing material split attempted |

Phase-3 exit (unchanged from the overhaul): vitals legible over a bright biome at arm's
length; relevance fades feel right at speed; boss chrome lands the fight; one reticle
instrument; 60fps on-device. H7–H9 may slip past the Phase 3 boundary without blocking
it — they are flagged accretions on a complete DOM HUD.

---

## E. Feasibility / risk register (consolidated)

| # | Risk / fact | Status & mitigation |
|---|---|---|
| 1 | `emit('bossHit', {hp,hpMax,frac,kind})` **already fires** (boss.js:5520) | Fact (verified). `bossBar.js` subscribes today; the overhaul's "add a getter" step is optional |
| 2 | `formLifebars` refill + FELLED/revive beats vs the DOM bar (boss.js:2160/3973/2522+) | Known audit risk. Re-forge shimmer specced (never reads as healing); **live-fight eyes required at H5 gate** |
| 3 | Bottom-center contention: `.boss-note` at bottom 28%, flow crest, surge row | Gauntlet keeps the shipped arc anchor; Mews plate slots above `.boss-note` in the collision-managed slot system; surge lives *in* the gauntlet so nothing new competes |
| 4 | Wing mirror-rigging shares one wing material → per-side flare / per-wing segments costly | Flare is stretch-only (cut freely); wing-charge uses the **bucket** glow writes (side-agnostic) first; span-gradient uniform variant behind a sub-flag |
| 5 | Surge-node per-dragon authoring debt | Shape-agnostic fallback contract (dorsal markers → tail-chain → coreGlow steps) makes H8 roster-safe on day one; author heroes incrementally |
| 6 | Body-light dim can crush value tiers on dark biomes | Emissive-floor multiplier clamped ≥0.75; tiershots on Frozen Reach + darkest biome at H7 gate |
| 7 | Trail-as-combo fights dragon identity hues | Lerp cap 0.5 toward ember-gold; per-dragon tint seam already exists |
| 8 | VIGIL edge overdraw on weak GPUs / washout over bright skies | Critical-state only (rare); strips ≤10% screen area; dark-scrim-core two-layer build; measure `?debug=perf` |
| 9 | Grading collisions (VIGIL desat vs fever lift vs biome grades) | One arbiter function owns the postfx grade stack (H3) — no direct writes from HUD code |
| 10 | Tether = center-crossing clutter risk | Rest 0.14 dashed, boss-hidden, flagged, declared first-cut; perf is one transform div |
| 11 | Damage-direction needs impact side | One param at the collision call site (data exists at collision time); fallback = quadrant vignette only |
| 12 | Graze spark needs contact side from the near-miss check | If unavailable: generic tail shimmer (specced fallback) |
| 13 | uishots flake on animated HUD frames | Per the audit respec: `--static` seam, in-run/boss frames review-only unless canvas masked |
| 14 | Perf posture overall | Zero new blur; transform/opacity only; ticker ≤4Hz; `will-change` only on projected elements (Lure/marks/chevrons/tether); net **fewer** persistent composited layers at cruise than shipped — an FPS win |

---

## F. The settings contract

- **The state machine is the API:** `hud-cruise / hud-combat / hud-boss` body classes;
  every element declares its states + relevance rule in one table (H1). All HUD CSS keys
  off classes — JS never sets styles except transforms on projected elements.
- **Per-element override (Horizon pattern):** each element exposes
  **ALWAYS / DYNAMIC / OFF** (default DYNAMIC = the relevance table) in settings — a
  small matrix screen under ASSISTS. OFF never removes: LIFE at critical, the seal
  beat, and boss WARNING (safety floor).
- **SCOREKEEPER** (toggle): pins score + distance at full alpha, classic-corner style,
  for the leaderboard cohort. Quiet sky is the default, never a cage.
- **IMMERSIVE HUD** (toggle, = U14's): hides everything except LIFE terminal + Mews
  plate + WARNING — trivially, since the HUD is ~7 root anchors; doubles as the
  screenshot mode.
- **`--hud-scale` (0.85–1.3) and `--hud-alpha`** sliders (from U14 Phase 2) are honored
  by every EMBERSIGHT element by construction (all sizes derive from the anchors).
- **DRAGON VITALS** (toggle, appears once H7 ships): enables the flagged living-gauge
  channels and deepens chrome rest-ghosts one step (Law 1's contract).
- **Colorblind:** roles, not colors, are the contract — the U14 root-class presets swap
  magenta/jade hues on DOM tokens; EMBERSIGHT adds **motion/position redundancy**
  everywhere (damage = position on the gauntlet ring + shake; surge-ready = ignition
  flash + ping; lock = snap + tone) so no state is hue-only. Verify magenta/jade
  separability with a CVD simulator at H3.
- **Reduced motion:** every new animation collapses to opacity fades by construction
  (credited coverage, extended); the etch-in becomes a fade-in; wingbeat sync disables.
