# THE EMPYREAN — UPLIFT PLAN (5.8 → ≥8.5/10) · AUDITED FINAL

**Trigger.** Owner playtest ("could do with more things… pretty lifeless") + an independent harsh
art-director audit of an 11-frame burst (`reforged/tools/_empyburst.mjs`: 7 desktop views incl. a live
3-frame motion burst, 2 portrait phone frames; obstacles/hazards/boss off): **5.8/10**. Sub-scores:
identity/composition 7.5, color/value 6.0, **life/motion 4.0 ("embalmed, not serene")**, density/variety
4.5, mobile readability 7.0. Verdict: "a strong single image shipped as a biome… in motion the world is
a diorama."

**Audit trail.** A SECOND independent critic audited the draft of this plan: **APPROVE-WITH-REVISIONS**,
expected landing as-drafted 7.6–8.2 (inflated score math: double-counted water motion, pale-on-pale
animation that won't survive ACES, an unquantified dark budget across three new dark movers, no
player-coupled motion, and fresh-critic tells left untouched). All eight required revisions + all five
misses are folded in below; the auditor judged the 8.5 bar "genuinely reachable in the 4-PR shape" with
them. Key honesty rule adopted: **a fresh critic scores holistically, not additively** — plan yields are
budgeted at ~65% of claimed gap credit, and the exit is measured, not assumed.

**Goal.** ≥8.5/10 from the same protocol (fresh critic, same burst rig, no anchoring), after 4 PRs.

## Laws that bind every increment
1. No sun/shadow/specular; no warmth, no green; pastel S≤0.30. Motion comes from **dark accents, hue
   drift, and geometry** — never brightness pulses (ACES-on-bright-field: brightness/saturation motion
   is invisible or illegal; dark marks and hue separation are the working levers).
2. **The Mote owns true black — NUMERICALLY.** Dark-mass budget, measured on every burst frame: the
   summed screen area of sub-L30 pixels EXCLUDING the Mote must stay **≤40% of the Mote's own sub-L30
   area** (script it into the burst rig; tune counts down first when it trips). This is the gate that
   lets three dark-mover systems coexist without dethroning the finale's one dark king.
3. Default-0 gates on every change (the `empyMix`/`shoalMix` pattern): every other biome byte-identical;
   full guard suite green per commit (gold-determinism, biomecycle, skyprobe, appshell, bulletcontrast,
   envcount, tricount, propclearance).
4. **Portrait window:** phones see ~±24° horizontal half-FOV (code truth, `ambient.js`); PLACE
   must-be-seen elements within ~±13° so wheel/wander margin never carries them out. School occupancy
   ("≥1 school visible at any moment") is verified by a scripted azimuth sweep in the burst rig, not by
   hope. Separate stacked elements by ELEVATION.
5. Budgets: ≤150 tris/prop instance, ≤2 material groups, instanced/merged geometry, point sprites for
   movers; 60fps weak mobile. **Tier-2 portrait burst is part of every gate** — the life fix must
   survive the tier gates on the phones that motivated it.
6. Seeded-deterministic placement for course-coupled props; ambient-pool randomness fine.
7. Sub-pixel bands don't render — size rims/hairlines in PIXELS (≥1.5–2px at 85°).
8. Rose "warm-but-legal" hue floor: **hue ≥315°** (numeric, so the no-warmth gate can't bounce it).

---

## PR-1 — THE LIFE PASS (gaps 1 + pickup cohesion)
The live burst shows only one koi school + pickups moving; the rising pearl-motes are invisible
pale-on-pale (the bright field eats particle life — the ink-koi proved dark drift marks are the only
motion currency that reads here).
- **Player-coupled wake (the audit's #1 add):** a cheap water ripple/wake shader term keyed to player
  x/z, plus near-field motes parting around the dragon — the one element that converts "drifting
  diorama" into "world that notices you." Without player-coupled motion, life/motion caps ~7.
- **Mote star-drift:** slow drift/twinkle of the starfield INSIDE the disc. (The draft's "breathing
  halo" is CUT — a brightness pulse is invisible under ACES or illegal under law 1; the audit flagged
  the self-contradiction. Star-drift alone animates the landmark.)
- **One additional FAR/HIGH ink-koi school** (smaller, slower — depth cue), elevation-separated from
  the shipped school and the Mote band. (The draft's third NEAR-LOW school is moved to PR-4 — a dark
  school inside the flight corridor is a bulletcontrast/readability hazard placed by decoration.)
- **Ink-drop lumen-motes:** ~40–60 larger, slightly ink-violet rising point sprites with per-mote sine
  bob — visible against the bright field, budgeted under law 2's 40% metric.
- **Pickup restyle (audit miss #1):** per-biome-5 tint for the collectibles — the canary-yellow/orange
  squares are the loudest theology violation in every frame. Pearl/rose/ice palette, contrast preserved
  for gameplay (bulletcontrast re-run).
- **Gate bar (replaces "≥5 movers"):** ≥3 DISTINCT MOTION CLASSES — directed school traversal /
  vertical mote bob / player-coupled wake — with stated period ratios (five same-period drifters read
  as one class). Plus: dark-budget metric green on every frame; tier-2 portrait burst reads.

## PR-2 — RING COURT + STONES OF LIGHT (gaps 2 + 5 + aerial haze; merged per audit)
Both halves are prop silhouette + `_bakeRamp` work in the same code paths.
- **Two new prop families, mini-reference written FIRST** (the unspecced-prop slop rule): broken
  ring-arch segments (pale bone-nacre, rose only on fracture lips ≥315°, lens cross-section, bedded,
  ≤150 tris) and low shard-cluster shrines (vertical counterpart of the pearlshoal).
- **Distance-staged identity:** seeded density weighting — arch fragments EARLY, stone courts MID,
  dense shard field + ONE full ring gate LATE. Early/mid/late must silhouette-differ at a glance.
- **Stones of light:** hue ramp on the ladder (violet base → pearl body → rose crown, ≥315°), subtle
  bright core-edge on the lens rim (≥1.5px), per-instance tip variety (canted / crystalline twin-facet
  / sheared stump) inside the apex-spike law.
- **Aerial perspective (audit miss #2):** distance-keyed hue/value haze via the existing `propAerial`
  optional channel — far monoliths drift violet and lighten. Cheap, doubles as the early/mid/late
  distinguisher, and fixes the frames' flattest tell (far slabs as crisp/dark as near ones).

## PR-3 — GODHEAD GATE + RIBBON SKY (gaps 4 + 6 + growth choreography; merged per audit)
Sky/landmark shader work in the same files. **Budgeted at TWO Fable rounds** — the gate rebuild is the
plan's highest gate-round risk.
- **Split inside the PR:** (a) the CHEAP/SAFE half first — thin eclipse-rim arc on the disc (px-sized),
  wider soft halo gradient, gaussian-softened bloom edges reshaped into 2–3 slowly undulating curved
  ribbons (keep the rose ~318° + blue-violet ~253° hue separation; the zenith star lift is CUT — lowest
  value item). (b) the RISKY half — rebuild THE UNMASKED's gate beneath the disc: legible pearl-palette
  structure at 2–3× present read (also kills the pre-existing warm-brown boss↔biome clash). Visual-only,
  biome-5-gated, with an explicit collision/framing checklist: propclearance, boss intro framing,
  silhouette overlap with the eclipse rim, boss tests green.
- **Landmark growth choreography (audit miss #4):** stage the Mote's apparent size to RAMP toward the
  late lane (the `uMoteGrow` machinery exists) so the finale pays off — cruise small, late large,
  arriving through PR-2's ring gate.

## PR-4 — NACRE MIRROR + LOW-FILL + HORIZON (gaps 3 + 7 + 8; the single water-motion credit)
All water-plane work, ONE water-motion claim (the draft double-counted vein scroll in A and shimmer in
D — the audit's point; it lives here only).
- **The Mote's dark mirror-smudge** on the centerline (keyed to moteMix/uMoteGrow): a soft vertical
  blur-reflection of the one dark object — deepens the inversion. Charged against law 2's dark budget,
  floor ~L50.
- **Iridescence shimmer drift:** animate the rose↔lilac interference phase (hue motion only).
- **Low-fill (moved from PR-1):** the phone's dead bottom third is WATER — its natural owners are the
  mirror-smudge, the wake, tightened reflections, and (if the dark budget allows) the NEAR-LOW koi
  school crossing OFF-LANE over the water, outside the flight corridor.
- **Tightened prop reflections:** slab-shaped soft silhouettes, not blob smears.
- **Horizon seam treatment (audit miss #3):** a thin hue-separated band (not a bright line) where water
  meets sky, anchoring the composition.

---

## Sequencing, verification, exit
- **Order: PR-1 → PR-2 → PR-3 → PR-4**, score checkpoints after PR-2 and at exit (preserves both
  original re-audit positions).
- **Per PR:** measure locally (`_empyregate.mjs` numbers + `_empyburst.mjs` re-shoot incl. portrait,
  tier-2 portrait, live burst, dark-budget metric) → converge → Fable-model gate ≥4.2 (exclusion masks,
  real FOV stated) → full guard suite → merge. One lesson file per PR (THE RULE).
- **Checkpoint math (65%-yield honesty):** after PR-2 expect ≈7.0–7.5; if <7.0, STOP and re-audit the
  plan instead of pushing forward. Exit after PR-4: fresh independent critic on the full burst protocol
  scores **≥8.5/10**; if 8.0–8.4, run ONE targeted polish round on the critic's top two items and
  re-measure once.

## Risk register
- **ACES washout:** every motion item above is dark-mark, hue, or geometry motion; anything specced as
  "brighter/pulsing" is auto-cut (the halo precedent). Verify with `_empyregate` HSV sampling.
- **Dark-budget creep:** law 2's 40% metric is scripted and gates every PR that adds a dark mover
  (PR-1: motes+school; PR-4: smudge+low school). Tune counts down first.
- **Determinism/perf:** seeded placement only for props; instanced/point-sprite movers, tier-gated;
  envcount/tricount green; gold-determinism + biomecycle every commit.
- **Boss coupling (PR-3b):** visual-only, biome-5-gated, checklist above; two gate rounds budgeted.
- **Pickup restyle:** gameplay-readability item — bulletcontrast must stay green; if pearl-tinting
  costs pickup legibility, fall back to desaturating toward rose-gold (hue ≥315°) rather than full
  palette compliance.

---

# REVISION 2 — the mid-plan checkpoint fired (5.5/10) · re-audited remaining plan

**What happened.** PR-1 (life pass) + PR-2 (ring court) shipped, each 4.4/5 on per-PR Fable craft
gates — yet the unanchored mid-plan re-score came back **5.5** (baseline 5.8). The stall rule fired;
an independent re-audit diagnosed and re-planned.

**DIAGNOSIS (the sequencing error).** The PRs added content into an unchanged VALUE FIELD; the
holistic score is dominated by the field itself (sky/haze/water within ~10% L = "luminous implemented
as low contrast"), which no PR scheduled — and the aerial haze *worsened* it by lightening far props
toward sky. Per-element craft gates verify "the arch reads," not "the frame improved." And the
life/motion bet on AMBIENT ACTORS is empirically dead: both critics scored it 4.0 before AND after
the actor pass — the demand is EMANATING world motion, not more fauna.

**REVISED REMAINING PLAN (3 PRs, impact order):**
- **PR-A — VALUE STRUCTURE + WORLD PULSE** (gaps 1+2+4, expected +1.5–1.8): one `empyStructMix` gate.
  Azimuthal 3-tier value scheme — off-corridor sky + far flanks drop 15–20% L toward dusty violet,
  a ~±25° near-white corridor cone holds the Mote bearing (per-column the zenith still wins → the
  inversion survives; contrast-from-below, the occultation-halo family). Water inherits the
  directional darkening. The disc PULSE-RING (~8s, dark hue accent, L≥50, charged to the dark
  budget), phase-animated ripple/contour lines, ONE drifting sky ribbon, and the disc CONTACT KIT
  (dark mirror-smudge promoted from PR-4, px-sized corona arc, 6–10 dark orbiting motes).
  Gate: `_empyregate` corridor-axis L separation ≥12% and flank-vs-corridor ≥15%; dark budget ≤40%.
  **⚑ OWNER SIGN-OFF: flank zeniths stop being the frame's brightest pixels.**
- **PR-B — MONOLITH KIT REBUILD + WATER CONSISTENCY** (gaps 3+5+8, +0.7–1.0): rebuild sentinels on
  the ring-court grammar (faceted lens lathe, violet base → pearl body → rose tip, crown-lip-segment
  rim only); DELETE fin/quill variants; two-tone corridor-facing faces (**⚑ OWNER SIGN-OFF: amends
  the "no directional value split" prop law — one note with PR-A's**); domain-warped water UVs + a
  second non-integer octave; one sprite grammar for motes/pickups.
- **PR-C — FLANKS + FINALE** (gaps 6+7, +0.4–0.6; mergeable into B): distant floating ring-shards
  (the shipped arch kit, re-instanced under heavy propAerial), the RING GATE + `uMoteGrow` growth
  choreography on the Mote approach, the horizon seam band.

**KEEP/DROP:** ring gate KEEP (PR-C); monolith hue-ramp DROP (superseded by the kit rebuild);
Godhead Gate DROP from the uplift (no critic raised it — its 2 budgeted rounds fund PR-C); Ribbon
Sky KEEP cut to one ribbon (PR-A); Nacre Mirror KEEP promoted (PR-A); third NEAR-LOW koi school
DROP (the disproven actor bet); horizon seam KEEP (PR-C).

**EXPECTED LANDING: 7.8–8.3** at the 65%-yield rule; **8.5 via the exit protocol's one targeted
polish round** — the stretch, not the expectation.
