# The premium-dragon METHOD, banked as a reusable playbook (for Pearl & Obsidian)

**What we did.** Solar's rebuild took a detour: CP1 built + passed the static sculpt gate, but in
PLAY it felt inert and not grind-worthy, which forced a whole second front (CP2) — a rear-chase-first
spectacle pass (cathedral-arch silhouette, ignition ramp, eclipse corona, jeweled tail). The insight
worth keeping is not any single geometry move; it's that **the sculpt gate is blind to motion and
spectacle, so a gate-passing sculpt is not a grind-worthy dragon.** We distilled the whole arc into a
new repo doc — [`reforged/PREMIUM-DRAGON-METHOD.md`](../../reforged/PREMIUM-DRAGON-METHOD.md) — so the
next premium (Pearl, Obsidian) starts from it and skips the CP1→"it's inert"→CP2 detour.

**The reusable method (order matters):** (1) referent → high-effort Fable-synthesized plan; (2) new
builders self-register default-off, only the hero opts in (roster never breaks); (3) build the APEX
first and gate it to PASS (the ladder is subtraction from the apex, not addition toward it); (4) build
the ladder as a CORONATION arc — each rung adds a CATEGORY (hardware + light), never just scale; (5)
verify by FAILURE-CLASS; (6) human judges motion/feel on the live preview.

**The biggest time-saver = bake CP1's hard-won constraints into the build sheet from round 1**, so you
gate ONCE (combined sculpt+spectacle+rear-chase Fable brief) instead of twice:
- **Rear-chase primacy.** The behind-and-above cam is the primary view; the face is ~0% of frame.
  Run two checks in round 1: "rear reads as an M, not a kite?" and "owns the dark sky (≥3 coloured
  light structures, no black-center void)?" Solar's brow gem faces AWAY from the chase cam — we had to
  add a rearward `napeStar`. Design the rear first.
- **The spectacle triad up front:** (a) withheld regalia + ignition ramp — gate each regalia MESH to a
  rung (not just its brightness) so ascending confers something; (b) opaque-emissive premium light
  (saturated bloom-safe hues on flat facets, never additive washout; ≤1 tiny near-white element, kept
  out of `spineMats`); (c) a signature silhouette that passes the two round-1 checks.
- **Reuse the proven CODE, don't re-derive:** the stage-aware `sovereignMats(def,glow,stage)` factory,
  the `igniteStage` dial, the eclipse-by-construction opaque annulus (`flatTriMesh` dark body +
  camera-facing saturated rim, NO torus), and the two probes that catch what tricount/blueprint miss.

**The failure-class table (the "verify at the right altitude" lesson):** budget→`tricount`,
integrity→`blueprint`, **runtime→`smoke.mjs` headless flight (two invisible-dragon crashes ONLY
surfaced here)**, symmetry→`wingsymprobe`, aesthetics→`dragonstudio` captures → then the Fable gate.
Four tools, four failure classes; a green tricount says nothing about whether the dragon renders in
flight.

**The Fable gate as a ratchet:** independent harsh critic, numeric bar (avg ≥4.0, no axis ≤2, plus
binary vetoes), captures as evidence each round. Solar CP1 climbed 1.10→4.19; CP2 3.77→4.13→4.27→4.33.
The gate is blind to motion — the human calls motion/feel on the live PR preview.

**Gotcha bank (each cost real time on Solar):** FX handles (wingtip marker, `wingElements` tip) keep
their OWN copy of the wing profile formula — change the profile, update BOTH or trails detach. A
torso must return `coreGlow` as mesh/null, never a color number (per-frame crash → invisible dragon).
A flat sheet aligned to the body's long axis is edge-on to the chase cam (foreshortens to a sliver) —
cant its face toward the cam, alternate L/R to stay balanced. A premium reaches Eternal, so it needs
its OWN `starters.mjs` assert block (the shared loop hard-asserts `maxTierFor===2`).

**What it unlocks.** Pearl and Obsidian get the ladder / silhouette / rear-chase / spectacle
requirements as INPUTS to their build sheets instead of late discoveries — reuse the method and the
code patterns, but each needs its OWN signature idea + palette (roster anti-collision). Start those
sessions by reading `reforged/PREMIUM-DRAGON-METHOD.md`.
