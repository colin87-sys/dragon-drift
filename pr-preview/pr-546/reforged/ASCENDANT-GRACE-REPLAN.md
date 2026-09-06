# ASCENDANT GRACE — REPLAN (Sunhawk wing + tail: feathers × trailing fire)

**Scope.** A targeted re-plan of the reforged Phoenix Ascendant (`phoenixReforged`,
"Sunhawk", apex Eternal) WING and TAIL only, in answer to the owner's verbatim note: the
wings read as *textured tiles*, not molten fire; they need a *blend of feathers AND trails
of fire*; the tail must be *dropped and rebuilt LONGER, graceful, elegant, like trailing
fire*. **North star: GRACEFUL and ELEGANT.** This does NOT re-spec the body/head/collar/
palette — those stay (see §4). It supersedes the WING (§3) and TAIL (§4) of
`PHOENIX-ASCENDANT-REFORGED-BUILDSHEET.md`; every other section of that sheet still holds.

---

## §0. DIAGNOSIS — why the wing reads as a QUILT, not fire (grounded in the pixels)

Studied: the owner's shop rear-view (`IMG_7435`), the r11 dark/pale/gold four-view tiles,
the sil-rear, and the real chase cam (`/tmp/frame-phoenixReforged.png`), against the builder
`dragonPhoenixReforged.js` (`buildOneSunWing` / `sunpennantTail`).

**The wing is a repeating triangular GRID.** `buildOneSunWing` lays **4 rows × ~8 columns**
of the SAME `kiteFeather` — every one at the **same `dir=[0.10,-0.02,1]`** (straight aft),
the **same `len=0.50·chord` / `wid=0.46·chord`**, the same pitch, tiling the whole upper
surface. Identical size + identical angle + regular pitch = a **quilt of isosceles teeth**.
Five specific killers:

1. **Uniform everything.** No variation in feather scale, length, rotation, or flow. A grid
   of clones reads as *texture/quilt*, never as *plumage* (which is size-graded and combed).
2. **They lie FLAT ON the surface.** `lift≈0.05`, `dir` straight aft → the feathers are a
   *skin on the wing*, not plumage with air between. **Nothing streams or offsets off the
   trailing edge** — the one thing the owner explicitly praised in the shipped phoenix.
3. **Hard isosceles kite silhouette, repeated.** `kiteFeather` is a hard-edged kite (base
   tri + two vane facets). Repeat it in a grid and you get a **sawtooth quilt** — hard
   triangular teeth, the exact "textured tiles" read.
4. **No fire hue-gradient.** The two-value relief is ivory-vane / bronze-root — a VALUE step
   for *craft*, but **every feather is the same ivory-tan**. There is no gold→amber→crimson
   heat falloff across the span, so the wing reads as *tan tiles*, not *fire*.
5. **The only streaming elements are thin needle "fingers"** (the primaries) that are
   **detached from the tiled fill** and read as spikes, not flame — so even the aft-rake
   that exists doesn't blend into a fire read.

**The wing OUTLINE reads as a paper aeroplane (owner).** `sunLeadZ` is a smooth accelerating
sweep and the trailing edge is the hard `BOT` rim of a filled web — so the planform is a
**clean geometric delta**, a straight-edged paper dart. A real firebird wing has a **curved,
organic leading edge** with flame licks and a **trailing edge that dissolves into streaming
flame-feathers** — neither of which the current hard rig-line silhouette has.

**The tail (`sunpennantTail`) fails "trailing fire" too.** Five BROAD flat kites gathered at
one anchor and spread into a fan read in the planform as a short **down-pointing spearhead /
arrowhead cluster**, not a long streaming trail. Broad + gathered + flat = a *fin*, not fire.

### 0a. THE OWNER'S FIRE REFERENCES (4 images — the corrected north star)
All four are phoenixes of FIRE, and they re-aim this build:
- **IMG_6527** (flight, sunset): structured layered feathers at the **leading edge/shoulder**
  that **dissolve into curling ribbons of fire** at the trailing edge, plus a **long, graceful
  S-CURLING multi-ribbon fire-trail tail.** The exact "feathers to trailing flame" blend, and
  the tail we want.
- **IMG_6528 / IMG_6529** (frontal spreads): the wing is **entirely flame-feathers** with a
  **white/gold-HOT core → orange → crimson/red cooler TIPS** gradient (root-hot / tip-cool),
  glowing, ember-sparked. These are the **fire-intensity ceiling.**
- **IMG_6530** (painterly): a wing of **long, elegant, CURVING flame strokes** — a pale-hot top
  edge with amber fire streaming below in flowing curls. **The grace north-star: elegant
  curving strokes, pure flow.**

**What they collectively demand (a real shift from the buildsheet's "orange = support only"):**
the WINGS and TAIL must **read as FIRE** — a warm **gold/white-hot core → orange → crimson/red
tip** gradient — with a **curved organic leading edge** (flame licks, not a straight delta) and
a **trailing edge of streaming flame-feathers** (not a hard rig line). Flow and gentle CURLS
throughout. The body/head/collar stay warm white-gold; the FLIGHT SURFACES become flame. See
§7 for how hot to push it (the load-bearing owner call).

**The good news — the ingredients exist.** The shipped phoenix's *offset feathers* (broad,
size-graded `feather()`s laid PROUD of the web with a base→tip **hue gradient**, longest at
mid-wing, streaming past the edge) is the gesture to do well. The everflame FLARE ladder
(white-gold → goldfire → flame → crimson → garnet, hot core / cool rim) is a ready-made fire
palette. And the engine already hands `archetype:'phoenix'` warm ember-mote wakes + Rebirth
fire-trails off the wingtip/tail **markers** — free trailing fire at the true tips.

---

## §1. THE THROUGH-LINE — grace & elegance (apply to BOTH wing and tail)

Every decision below serves these five. When in doubt, choose the one that is calmer.

- **Flowing curves over hard grids.** Feathers follow **curved streamlines** combed to a
  common aft-outboard direction (wind-combed), never an axis-aligned lattice. Silhouette
  edges scallop softly, not a regular sawtooth.
- **Hue-gradient FIRE, not flat tan.** A heat ramp along every flame element: **white/gold-HOT
  core/root → orange → crimson/red cooler TIP** (root-hot / tip-cool, per the refs). The hue
  shift itself signals combustion; it is what makes an offset feather read as *fire*.
- **Streaming OFFSET elements over surface-tiling.** The signature elements LEAVE the surface
  and rake aft with **gaps between them** (sky/air shows through) — flame licks, not a picket
  fence and not a skin.
- **CURVES and gentle CURLS (fire has license the structure does not).** Leading edges CURVE
  organically; trailing/tail flame elements may **curl gracefully at the very tip** (the ref
  fire-scrolls, esp. IMG_6527/6530). This curl is permitted ONLY on the SOFT FIRE elements
  (trailing flame-feathers, the fire-trail tail) and only when it rakes **aft-up into the empty
  sky** (never down/inboard over the course). The **no-curl veto still binds every STRUCTURAL
  feather tip** (the emarginated primaries): those stay aft-and-down. See §3d.
- **Restraint = elegance.** FEWER, LARGER, deliberate elements. Elegant is *not busy*. This is
  as much a **REMOVAL** job (delete the dense tile quilt) as an addition job.
- **S-taper to a fine point.** Every streaming element tapers from a shaft-rooted belly to a
  thin point — the graceful line. No blunt kite-ends on any trailing/fire element.

---

## §2. A NEW PRIMITIVE — the streaming flame-feather (`flameFeather`)

The kite is the quilt atom; it is wrong for anything that must stream or read as fire. Add ONE
new primitive alongside `kiteFeather` (keep `kiteFeather` for the collar/crown/breast, which
are fine). Author it in `dragonPhoenixReforged.js`, same plain-array-in / Vector3-math /
array-out contract (the NaN-guard) as `kiteFeather`.

**`flameFeather(base, dir, side, len, wid, curve, matRamp)` →** a **curved, S-tapered ribbon**
(a short quad-strip of ~4 segments along `dir`), NOT a hard kite:
- **Shape:** narrow at the root, swells to a modest belly at ~30% length, then **tapers to a
  fine point**. Width profile e.g. `w(u)=wid·sin(π·u)^0.7·(1−u)^0.35` — a graceful leaf/flame
  line, one thin crease ridge down the centre for a two-facet relief (keeps the low-poly read).
- **Curve + optional terminal curl:** the centreline bows by `curve` (a gentle S — belly sags
  slightly, tip lifts) so it reads as a wind-blown lick, never a straight spike. An extra
  `curl` param may add a **graceful terminal curl** (the ref fire-scrolls) on SOFT fire
  elements only — always raking aft-up, never a structural up-hook (§3d).
- **matRamp:** an array of 2–3 materials assigned **per segment root→tip** so the ribbon
  hue-ramps along its length (**white/gold-hot shaft → orange → crimson/red point** — root-hot,
  tip-cool). This is the fire. The very tip segment carries the saturated orange emissive.
- **Tip marker (optional):** the primitive can publish its tip point so a caller can hang an
  FX marker / the engine Rebirth fire-trail on the longest ones.
- **Tri budget:** ~4 segments × 2 facets = ~8 tris each — cheaper than today's grid because we
  run FAR fewer of them. Net tri count should DROP, protecting the <6000 / 60fps budget.

---

## §3. THE WING (replaces the `buildOneSunWing` feathered-upper-surface + fingers)

Keep an ORGANIZED feathered wing — but rebuilt as **flow, not grid**, reading root→tip as
**feathers catching fire**. Keep the lofted gold spar-arm, the bronze underwing belly, the
shared `sunLeadY/Z` profile plumbing, and the mirror/`wingsymprobe` contract.

### 3a0. Fix the OUTLINE first (kill the paper aeroplane)
The silhouette is the owner's headline note. Two changes:
- **Curved, organic LEADING edge with flame licks.** Re-shape `sunLeadZ`/`sunLeadY` from a
  smooth delta sweep into a **gentle compound curve** (a subtle shoulder camber then an
  outboard rake) — a bird's leading arc, not a straight ruler. Then seat a **sparse row of
  short forward flame-licks** ALONG that leading edge (small `flameFeather`s pointing slightly
  fore-and-out, hot gold) so the leading edge reads **organic + alight**, not a hard spar line.
  (Update BOTH `sunLeadY/Z` and the FX marker together — the shared-profile crash-class.)
- **Dissolving TRAILING edge.** The trailing edge must NOT be the hard `BOT` web rim. Pull the
  filled web IN so its hard edge sits ~inboard of mid-chord, and let the **streaming
  flame-feathers (§3b) BE the trailing edge** — a soft, gappy, flame fringe. The rig line never
  shows as the silhouette; the flame does.

### 3a. Break the quilt (the inner + mid wing — the FEATHER half)
- **Fewer, larger, size-graded feathers.** Replace the `rows×density` clone grid with **2
  combed ranks** of markedly **fewer, larger** feathers: an inner **covert** sweep (~5–6) and
  a **secondary** sweep (~6–7), each feather **noticeably larger** than today's. Size-grade
  them: longest at mid-span (à la the shipped phoenix `sin(t·π)` length curve), shortest at
  the shoulder and toward the wrist. **No two adjacent feathers the same length.**
- **Curved flow lines, not a lattice.** Comb every feather to a **common aft-outboard**
  streamline: `dir` interpolates from *more-aft* at the root to *more-raked-outboard-and-aft*
  toward the wrist, and the two ranks are **not parallel** — the secondary rank rakes harder.
  Add a small per-feather pitch jitter (deterministic, seeded by index — NOT `Math.random`) so
  the trailing edge **scallops organically** instead of a straight sawtooth.
- **Stagger the seats.** Offset each feather's chord-seat and root slightly per column so rows
  interleave (real plumage overlap), not a clean rectangular tiling.
- Keep these inner feathers as `kiteFeather` OR the new `flameFeather` with `curve≈0` — but
  **big and few**. The inner wing stays **ivory/gold** (the "feathers" read; §3c).

### 3b. Blend in TRAILING FIRE (the outer third + the trailing edge — the FIRE half)
This is the owner's cited move — *feathers offset from the wing* — done well.
- **A rank of long streaming `flameFeather`s rooted in the fill along the wing's TRAILING and
  OUTER edge, OFFSET past that edge and raked AFT** (and gently aft-up toward the empty upper
  corner, the everflame rake) so they **stream off the wing like flame**. ~5–7 per wing.
- **S-tapered, with GAPS between them** — sky shows through; this is streaming fire, not a
  solid fringe. Lengths graded (centre-outer longest) so the offset edge reads as a **flowing
  flame fringe**, not a picket fence.
- **These replace the detached needle "primary fingers" as the outer read.** Retain **3–4
  structural primary FINGERS** underneath for the emarginated-eagle silhouette and the no-curl
  contract, but they are now *inside* the flame fringe, gold→amber, not bare spikes.

### 3c. The fire hue-gradient (material/hue plan) — NEEDS NEW FIRE MATERIALS
The refs read as fire because of a real **gold/white-hot → orange → crimson/red** ramp. Today's
`sunhawkMats` has ivory/bronze/gold/rose-gold + one orange emissive — not enough steps for a
convincing flame. **Add a small fire sub-ladder** (borrow the everflame FLARE hexes): a
**goldfire** (`~0xe69b1f`, warm emissive), a **flame** (`~0xd9541a`), a **crimson**
(`~0xb32613`) — all saturated, bloom-safe (sat≥0.85, val≤0.9) so they bloom in-hue. Then a
**heat ramp keyed to span t + to per-flameFeather segment**:
- **t < 0.45 (inner wing / shoulder — the FEATHER half):** `M.ivory` vane / `M.bronze` root /
  `M.gold` shafts. This is where the structured-feather read lives (leading edge/root).
- **t 0.45–0.70 (mid-outer, transition):** vane ramps `M.gold` → **goldfire**; `M.roseGold` rim.
- **t > 0.70 AND every trailing/tail `flameFeather` (the FIRE):** per-segment root→tip ramp
  **goldfire (hot shaft) → flame → crimson (cool tip)**, tip segment carries the saturated
  orange emissive. Root-hot / tip-cool, matching the refs.
- Net read: a white-gold feathered inner wing / leading edge that **combusts outboard and along
  the trailing edge into gold→orange→crimson streaming flame.** Feathers AND trailing fire, one
  continuous graceful gradient — the IMG_6527 blend.
- **Note this DEPARTS from the buildsheet §1 "orange = support only / ≤1 near-white / matte
  ivory body."** That law still governs the BODY/HEAD/COLLAR (they stay warm white-gold), but
  the WINGS + TAIL are now permitted to carry broad warm emissive fire. Fold this exception into
  the buildsheet + the `starters.mjs` near-white/emissive asserts (the flight surfaces are the
  sanctioned fire zone). How hot to run it = the §7 owner call.
- **Restraint guard:** keep saturated orange emissive to the **tips only** (~the outer 10%),
  never a broad orange diffuse mass (the anti-toy-color / value-gap law of the buildsheet §1).

### 3d. Keep (do NOT break)
- **No-curl veto on the STRUCTURAL tips** (the 3–4 primary fingers): terminal Y-slope ≤ 0,
  Z-slope > 0. The streaming `flameFeather`s may rake aft-and-gently-up (streaming fire), but
  **must not curl up-AND-inward** and must not enter the corridor. State this in the assert.
- **Corridor / Visibility Law:** wings translucent; hero mass forward/lateral; nothing in the
  lower-centre. **Fire streams aft-up toward the empty upper corners**, never down over the
  course.
- **Value-gap law** (ivory field never touches white-hot T0; ≤1 near-white overall; two-value
  relief on every feather) and **`wingsymprobe` Δ0.000** and the **shared `sunLeadY/Z`
  profile** (move the FX tip marker WITH the geometry or the trail detaches).

---

## §4. THE TAIL (drop `sunpennantTail`, build `sunfireTrail`) — long, graceful, trailing fire

Replace the spearhead-fan entirely. The new tail is **a flowing trail of fire**, built from the
same `flameFeather` primitive so wing and tail share one fire language.

- **3–5 long S-curved `flameFeather` ribbons** rooted at the (already-lifted) tail anchor,
  each following an **elegant S-curve / comet drape** — the ribbons bow slightly then sweep
  **aft-and-up**, catching the wind like a flame trail. NOT a flat gathered fan; NOT a
  down-centre droop. **This is the IMG_6527 tail: a long, graceful, CURLING fire-trail.**
- **Terminal CURL (the ref signature).** Give the ribbon tips a **gentle graceful curl** (the
  `flameFeather` `curl` param) — the flame-scroll from IMG_6527/6530 — but the curl rakes
  **aft-and-up into the empty sky**, never down/inboard over the course and never a tight hook.
  Offset the ribbons' curl phase slightly so they don't curl in lockstep (organic, not a comb).
- **Centre ribbon longest = the comet point**, side ribbons shorter and finer, **tapering to a
  fine point.** Graded lengths + **gaps between ribbons** → it reads as a flowing *trail*, not
  a solid fin.
- **Fire hue-gradient per ribbon:** white/gold-HOT root → orange → **crimson/red cooler tip**
  (the `flameFeather` matRamp, root-hot/tip-cool) — the same combustion gradient as the wing.
- **LONGER than today** (target streamed length noticeably beyond the current ~3.7, e.g.
  ~4.5–5.0 apex) — but **long via RAKE + STREAMING, not mass.** Because the ribbons are thin,
  S-tapered, and raked aft-up, the *projected* footprint stays small and OUT of the corridor.
  This is how "long + graceful" coexists with the Visibility Law: **length lives in the empty
  upper-aft sky, not in bulk over the playfield.**
- **Lean on the engine:** publish the FX **marker at the comet tip** so the phoenix-archetype
  **Rebirth fire-trail** extends the fire even further behind her — free "trailing fire" that
  amplifies the read in motion.
- **Corridor assert (unchanged):** ZERO tail geometry in `{ y < bodyMidY, z > haunch }`. Keep
  `tailAnchor` lifted (y≈0.50, z≈1.60) and rake up. Return the same contract shape
  (`{ group, segs, tailFins:null, accentMats }`) so the rig coil still travels the ribbons
  root→tip (the wave flows WITH the fire).

---

## §5. KEEP / DON'T-BREAK (the frozen surround)

- **Body & head & collar stay:** the sculpted keel torso (CP1), the regal crown head, the
  white-gold solar-ivory identity, the sun-gorget collar. This replan touches ONLY the wing
  upper-surface/fingers and the tail.
- **Coexist:** roster key `phoenixReforged` unchanged; the shipped `phoenix` def stays
  byte-identical. Per-form dials keep laddering (covert/secondary/fingerSplit/roseGoldEdge/
  pennant→now fire-ribbon count all monotonic f0→f3).
- **Budget & tests:** <6000 tris, 60fps on weak mobile (fewer-larger feathers should LOWER
  tris). Keep the `starters.mjs` asserts (tip Y-slope ≤0 & Z-slope >0 on structural fingers;
  corridor clear; chord:span ≥0.4; ≤1 near-white; NaN-vertex guard; monotonic ladder;
  `maxTierFor('phoenixReforged')===3`). Update the corridor/ladder asserts for the renamed
  tail.

---

## §6. CHECKPOINT PLAN — wing first, then tail, each behind a harsh real-render Fable critic

Build in two gated checkpoints; each judged on the REAL renders (dual-sky `dragonstudio`
tiles + the `framecap` chase cam WITH Surge on), one rework allowed each.

- **CP-A — THE WING.** Add the `flameFeather` primitive; rebuild the wing per §3 (break the
  quilt: fewer/larger/combed/varied feathers; add the offset trailing-fire fringe; install the
  span heat-ramp). Keep spar-arm, underwing, `sunLeadY/Z`, mirror.
  **Gate (harsh Fable critic on real renders, against the 4 fire refs):** (1) the outline no
  longer reads as a paper-aeroplane delta — **curved organic leading edge + a trailing edge
  that dissolves into streaming flame-feathers**; (2) the top-planform/rear-¾ no longer reads
  as a repeating triangular quilt — **combed plumage catching fire**; (3) a legible
  **white/gold-hot → orange → crimson/red** gradient outboard/trailing; (4) offset streamers
  with gaps (not a skin, not a picket fence); (5) no-curl assert green on the STRUCTURAL
  fingers (soft-fire curl allowed); (6) corridor clear + `wingsymprobe` Δ0.000 + tricount under
  budget. Rework once, then proceed.
- **CP-B — THE TAIL.** Drop `sunpennantTail`; build `sunfireTrail` per §4 (long S-curved
  fire ribbons, comet point, heat-ramp, engine trail-marker at the tip).
  **Gate:** (1) reads as a **long graceful trail of fire**, not a spearhead/fan; (2) longer
  than the old pennant yet corridor assert still green (length in the sky, not bulk);
  (3) elegant S-curve, not a straight fan or a down-droop; (4) fire gradient matches the wing
  fringe; (5) framecap course-legible WITH Surge; ladder + NaN + symmetry green. Rework once.
- Then the standing combined Fable ratchet from the buildsheet §9 CP3 (weighted avg ≥4.0, no
  axis ≤2; distinctiveness + no-curl + washout vetoes) and the human judges MOTION/FEEL on the
  PR preview (the fire streaming in the flap + Rebirth surge; the tail not whipping the cam).

---

## §7. THE ONE LOAD-BEARING DECISION — HOW HOT DO THE WINGS + TAIL BURN?

The owner's fire refs shift the question from *whether* to *how far*. The body/head/collar stay
warm white-gold either way; **the decision is how much FIRE hue floods the flight surfaces**,
along a single spectrum:

- **(A) FEATHERS-THAT-CATCH-FIRE — the recommended default.** Structured white-gold feathers
  own the **leading edge + inner half**; fire lives in the **outer third + the trailing/tail
  streamers** as a gold-hot → orange → crimson gradient. This is the literal IMG_6527 blend
  ("feathers AND trails of fire"), keeps the graceful white-gold identity, and holds a clear
  lane vs. Molten (dark crust) and Everflame (whole-body flame). **My pick.**
- **(B) MOSTLY-FIRE WINGS.** Fire creeps inboard to ~the wing root; only the shoulder/spar and
  a few leading feathers stay gold; the wing reads ~70% flame (the IMG_6528/6529 ceiling). More
  spectacle, but it starts crowding Everflame's *fire-is-the-body* lane — needs a distinctness
  check against those tiles.
- **(C) PURE FLAME-STROKE WING (IMG_6530).** Abandon discrete feathers outboard for long
  curving flame strokes. Most beautiful/graceful, least "bird" — and closest to a leak.

**Recommendation: (A), tuned WARM/BRIGHT** — push the orange/crimson genuinely (not the old
"support-only" whisper) so it truly reads as fire in the refs' spirit, but keep the inner-wing
feather structure and the white-gold body so it stays *Ascendant*, graceful, and distinct. The
intensity is a one-line ramp dial (`how far inboard the crimson creeps` × `tip saturation`), so
we can slide A→B cheaply once the owner sees CP-A on the real cam.

**→ OWNER, PLEASE CONFIRM: A, B, or C** — and whether the flight-surface fire may run
saturated warm (gold→orange→crimson, brighter than the buildsheet's "orange = support only"),
given the body/head/collar remain warm white-gold. Everything downstream (the new fire
materials, the heat-ramp thresholds, the near-white/emissive asserts) keys off this.

---

## ✅ OWNER DECISION (2026-07-11) — **(B) MOSTLY-FIRE WINGS + WHOLE CREATURE CATCHES FIRE**
The owner chose **(B)** for the flight surfaces AND that the **whole creature catches fire** (not
just the wings/tail). So this is now a **phoenix OF FIRE** (the IMG_6528/6529 read), not a
white-gold bird with fire accents:
- **Palette overhaul:** `sunhawkMats` becomes a FIRE ladder (white/gold-HOT core → **goldfire body
  field** → flame → crimson tip → garnet rim, hot-core/cool-rim, saturated bloom-safe) applied to
  the WHOLE creature — the sculpted keel body, head and collar glow warm flame (keep the SCULPT
  geometry; repaint it fire), the wings run ~70% flame creeping to the root (only the gold spar +
  a few shoulder feathers stay gold), the tail a full fire-trail.
- **Keep:** the sculpted keel body shape, the regal head, the sun-gorget collar geometry, the
  coexist key, the visibility law, the no-curl veto on structural tips, <6000 tris. Re-scope the
  `starters.mjs` near-white/emissive asserts for a bright FIRE body (like the everflame block did —
  do NOT inherit the white-gold "matte ivory / orange-support-only" ceilings; those are voided).
- **Distinctness:** vs Molten (DARK crust, fire-in-seams) this is a BRIGHT warm fire-body; the
  Everflame concept is shelved (branch `everflame-wip`), so this bright-fire lane is open.
- **Grace stays the north star:** flowing combed flame-feathers + curved leading edge + streaming
  trailing flame + a long S-curling fire-trail tail. Fire, but ELEGANT — fewer/larger/flowing.
