# 2026-07-14 — graphics: the wall-props + "crystal wall" (Phase Gate) premium redesign PLAN

**Why.** Owner: the **side-wall props** and the **"crystal wall"** still read basic/cheap while dragons,
bosses, sky, water and the Aurora biome all got premium revamps. Asked for research → a Fable
art-director vision → a Fable synthesis → (mid-task) a Fable performance pass, each biome planned unique.
This lesson is the PLANNING arc; the deliverable is `reforged/WALL-PROPS-REDESIGN.md` (903 lines, 9
sections, build-ready). No game code changed yet — the plan is the artifact.

**The scope-defining discovery (confirm the target in code before designing).** "Crystal wall" was
ambiguous and I initially mis-scoped it as the Frozen `crystal`/`crystalSmall` spires (single
`ConeGeometry(1,1,5)` cones — genuinely basic, but not what was meant). The owner clarified: it's **the
Phase Gate** — the translucent veil you fly / roll-**phase** through (`obstacles.js buildGate`). Two
distinct targets, then:
1. **Side-wall props** = `environment.js ARCHETYPES` (per-biome lane geometry). Every legacy biome is
   1–3 primitives; **Aurora (biome 6) was already rebuilt to the premium bar** and is the in-repo proof.
2. **The Phase Gate "crystal wall"** = specifically **layer 3, the veil** (four flat `BoxGeometry` panels
   + fresnel), and the phase-through moment. Its **frame** (layer 2) was already elevated ("Skyforged"
   `buildGateFrame`) — do NOT touch it; the flat veil is the basic part.
   Reusable: when an owner names a fuzzy visual target, **grep the codebase and read the actual geometry
   before designing** — "crystal wall" lived in three plausible places (Frozen spires, canyon rock-gates,
   Phase Gate). The build recipe (single cone vs flat box panel vs already-upgraded frame) disambiguates.

**The pipeline that worked (a reusable multi-Fable structure for a big design ask).**
research (codebase digest + a backgrounded web-research agent on "what other games do") → **Fable
high-effort ART DIRECTOR** (vision, per-biome) → *same agent resumed via SendMessage* for the Phase Gate
(kept its loaded context instead of a cold restart when the second target surfaced) → **Fable
SYNTHESIZER** (assembles both visions + research + engine facts into the build-ready doc, verifying every
cited seam against real code) → **Fable PERFORMANCE agent** (fills a pre-placed §8 stub with the 60fps
budget). Each stage got the prior stages' outputs as **durable scratchpad files**, not just chat context.
Reusable: **leave a labelled placeholder section** (`§8 PERFORMANCE (to be completed by the perf pass)`)
so a later specialist agent can drop its work into the outline without renumbering — the perf agent did an
exact-match Edit of only that block.

**The premium-prop method (restated from Aurora/asteroid lessons — the design law set the plan signs).**
- **Cheap is geometry, not palette.** A single cone = traffic cone; a box = crate. Every archetype is a
  5–8-part **cluster with a story** (40–130 tris, free at our scale).
- **Character must live in the SILHOUETTE / plan-outline / top-edge steps**, because the `(r,h,r)`
  instance scale **shears internal tilts flat** — build every lean/curve by **offset-stacking segments**,
  never by rotating them. `rotY` re-randomizes on recycle → design rotation-robust (spread radially).
- **Three shape families + a bare non-glowing FOIL + (usually) a distant MASSIF** per biome. **De-lamp
  accents geometrically** (flush inlays / sunken throats / slivers in clefts / glow through gaps) — never
  an emissive tab on a flat (the LED-strip tell). Faceted `IcosahedronGeometry(r,0)`+flatShading = free
  glints (mind indexed/non-indexed `.toNonIndexed()` — one mixed merge crashes EVERY biome's boot).
- **Coherence = one grammar, N dialects**: same formal moves everywhere, only the *medium* changes; each
  biome owns a fixed **glow "address"** (Sanctuary through apertures, Caldera low in cracks, Mire high
  under brims, Astral inside the wound…), and Law-4 twins **oppose** on it.

**The Phase-Veil overdraw discipline (the one real perf risk in the whole plan).** The veil is the single
most **overdraw-sensitive** surface in the game (a large near-fullscreen TRANSPARENT fresnel plane;
BOSS-DESIGN §2: 2 stacked additive/fresnel shells = +50% frame, worst case ~32fps). So the premium pass
buys richness **on the same projected surface** only: **facet the panels** (per-facet normals → hundreds
of lit crystal cells; tris, NOT fill), per-facet fresnel/glints/chromatic-edge/parallax/meniscus **ALU**
terms, and an **opaque `LineSegments` lattice** (cliff-exempt). **Never a second stacked transparent/
additive shell.** Phase-through = the wall **rippling open** (a brief per-gate `uPhase` impulse, reusing
the existing tiered `phaseBurst`); crash = the wall **slamming solid** (inverse read, one transient frame).
r160 gotcha the synthesizer caught: gate materials must be **fresh factory calls, never `.clone()`**.

**Perf verdict (Fable perf agent, grounded in BOSS-DESIGN §2's measured truth).** Sound for 60fps on
desktop **and** weak mobile. The 29 opaque side-prop archetypes are **perf-free by construction** (opaque +
fairness-positive; the band **visible-gate** collapses per-frame cost to the ~2 live biomes regardless of
global archetype count; recycle-only matrix writes) — worst adjacent 2-biome window ≈ 912 inst / ~72k
tris ≈ 18% of a load that held ~59fps on-device. **All risk is in the veil, and it's gated.** `envcount`
caps set (tris/arch ≤150, per-biome ≤550 inst/≤50k tris, adjacent-pair ≤90k, **side-prop additive
surfaces = exactly 0**, per-gate 1 transparent veil + lattice ≤600 segs + alpha-clamp-0.30 asserted).
**B1 (first faceted veil) is a hard real-phone `stress.html` gate** (new `mat=veil2`/`veilCover=1` axes);
go/no-go = median ≥55fps and `?veil2=1` within ~2fps of `?veil2=0`. Desktop 120Hz rides the existing
medFps controller; tier flips are pointer swaps (both veil programs warm-compiled at init).

**What it unlocks.** A build-ready rollout: **A0 build `tools/envcount.mjs` first** → **A1 Frozen** (the
proving hero: owner's most-hated + lowest method risk as Aurora's ice cousin + banks the MARROWCOIL
foreshadow) → Caldera ∥ B1 veil → Wastes → B2 phase moment → Sanctuary → Mire → B3 seven skins → Astral →
A7 coherence pass → A8 gated deletion of the 15 legacy archetypes. One biome per PR, coexist behind
`?props=v1`/`?veil2=0`, each PR through the GRAPHICS-OVERHAUL Fable gate + a ledger lesson. §9 lists 6
owner decisions (build order, the "Phase Veil" concept name, the B2 crash-alpha exception, A8 sign-off,
Astral's deliberately empty massif). Next session: start at A0/A1, not from the visions — read
`WALL-PROPS-REDESIGN.md`.
