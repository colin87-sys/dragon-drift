# AAA-PIPELINE.md — build sheet → premium dragon in ONE pass

Distilled from the **Thunderhead Tempest** arc (build → Arc Crown → the 4-phase glow-up → polish),
the roster's current premium bar (owner-confirmed). The Tempest took ~9 critic rounds to get here
because these laws were *discovered* during her build. **A new dragon that builds to this doc from
I1 should land each gate in at most ONE revise round.** This doc owns LIGHT + POLISH + GATE
CONVERGENCE; shape/anatomy live in [`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md), distinctiveness +
rear-chase primacy in [`PREMIUM-DRAGON-METHOD.md`](./PREMIUM-DRAGON-METHOD.md), motion in
[`FLAP-DESIGN.md`](./FLAP-DESIGN.md). Read those for WHAT to build; read this for why it will or
won't read AAA — and how to prove it without burning rounds.

---

## 1. THE VALUE-STRUCTURE LAW — the one diagnosis that predicts premium vs cheap

Put the dragon's best FX element next to its body and ask: **how many organized value zones does
each have?** Premium elements have three: a white-hot **CORE** → a colored **BLOOM** → a **DARK**
field, plus organic irregularity. Cheap elements have one: flat black silhouette, flat white strip,
uniform glow. Every complaint the owner ever filed ("looks cheap", "tacky", "can't put my finger on
it") decomposed into a value-structure gap.

**The method that follows from it:**
1. Before building anything, name the dragon's **SIGNATURE FX** — its "lightning" (a flame vortex,
   a gravity well, a frost bloom…). Spec it with the full core→bloom→dark structure. This is the
   quality bar for the whole creature.
2. Every other part must **speak the signature's language**: one shared bone primitive across
   wings/crown/tail/spine (one creature, one vocabulary), the same palette structure, the same
   irregularity character.
3. The body itself is never one value: a 3–4 step diffuse **value ladder** (shadow channel / mid /
   lit facet) + an **identity rim** (cold for a storm dragon, warm for a solar one) + one or two
   always-alive points of light. A deliberately dark hero is carved out of values and outlined by
   the rim — never a silhouette.

## 2. THE CHEAP-TELL REGISTRY — kill on sight, and the law that kills each

These are owner-calibrated. Build so none exist at the first gate; run the registry as a checklist
against in-game captures before ever spawning a critic.

| # | The tell (what the owner sees) | The law that kills it |
|---|---|---|
| 1 | **Flat tape** — glowing bones/veins as constant-width bright caps standing proud | A bone is a **narrow TAPERED filament RECESSED in a channel** (walls above it throw shadow) over a **wide DIM skirt** — core→glow→dark on every strut |
| 2 | **Picket fence** — ranks of equal spikes/struts (a comb, a thicket) | Every rank is **dominant + steep decay** (height/width/splay), jittered azimuth/width (deterministic index-hash, never `Math.random`), with irregular per-element fork prongs. Never clamp the ladder |
| 3 | **LED strip / neon sign** — emissive painted on a surface, always on | Glow lives on **components** (caps, cores, nodes), idles **off-with-hints**, and its brightening is an *event*. Membranes/surfaces stay diffuse — the frame owns the light |
| 4 | **Chrome outline** — the whole wing edge-lit while the body isn't | Fresnel rim is **per-surface**: flat faceted panels catch far more grazing-angle rim than rounded bodies, so wings need their own multiplier (Tempest: `rimWingMul 0.22`). Rim STRENGTH = edge brightness, POWER = edge width; hue is per-dragon identity |
| 5 | **Onion rings / hard diamond** — glows built from solid additive meshes | A soft glow is an **alpha falloff**: ONE radial-gradient sprite (`DataTexture`, never `CanvasTexture` — builders run in Node; never solid meshes — a single one clips to a polygon, stacked ones ring) |
| 6 | **White smear** — a focal point blown past the tone-map knee | The **core carries brightness, the HALO carries hue**. Never dim a white-hot core to hold color — saturate the bloom around it (glow sprites/strips sit outside the accent-lane tests, so their saturation is a free lever) |
| 7 | **Washed fringe** — a "colored" corona that reads white over a bright sky | **Additive can only brighten.** A colored fringe over a bright/warm background must ALPHA-COMPOSITE (NormalBlending) a saturated tint that pulls the opposing channel DOWN. Verify by channel ORDERING (periwinkle = B>G>R; magenta sky is B>R too but G-lowest) |
| 8 | **Metronome** — FX pulsing on a beat | Natural phenomena fire in **erratic seeded clusters**: 1–3 quick swells, tight stutter-gaps, a long UNEVEN rest solved from cluster size. Photosensitivity caps live in the module, not the call site |
| 9 | **On-body "arcs"** — leap FX overlapping the silhouette as a smear | A leap must cross **open air** off the silhouette, rooted at both ends, occluded by geometry in front (depthTest on). On-body = a crack, not an arc — cut it |
| 10 | **Sparkle-as-line** — a "charged line" made of separate specks | A line read needs **one continuous ribbon threaded through the nodes** (+ blooms riding the peaks). Independent marks never merge |
| 11 | **Thin thread** — a tail/body that vanishes from the chase cam | Thicken for the **JUDGED projection**: rear-chase foreshortens, so raise the radius FLOOR (not just the base) until girth survives it. World-space mass ≠ silhouette mass |
| 12 | **Flat sails** — big single-value membrane bays | **Value-band by depth**: taut root = lit tier, deep cup = shadow tier, + jitter — and widen the tier palette first or the banding won't read. Free on draw calls (batched by material) |

## 3. THE CONVERGENCE PROTOCOL — why this lands in one round, not nine

The three-judge split. Never ask one judge to do another's job:
- **The MACHINE** verifies numbers: geometry asserts, pixel cross-sections, luminance vs background,
  channel ordering, byte-identity. Instant, free, rerunnable.
- **The FABLE CRITIC** judges craft on real captures, harshly, at a **≥4.2/5 bar** — and is NEVER
  the builder ("the builder never judges its own output").
- **The OWNER** judges feel on the PR preview: motion character, audio taste, long-run fatigue,
  photosensitivity comfort. List these explicitly as *human-only* so nobody burns critic rounds on them.

The loop, per phase:
1. **PRE-ASSESS** — spawn the art director BEFORE building. Give it the identity contract, the
   reference, and the registry. It returns ranked priorities **and numeric targets** (this is the
   key ask: "fringe must read B>R ≈ (200,215,255)", "silhouette edge L≥130 over bright water").
   A target you can measure is a round you don't burn.
2. **BUILD to the laws**, verifying numerically as you go (pixel checkers, not critic spawns).
   Commit + push at every green step — remote is the backup.
3. **CHECKPOINT** — a FRESH harsh critic spawn judging real captures: in-game frames (bloom, biome
   light, gameplay distance) AND clean studio frames (geometry truth), each phase scoped to its own
   items so earlier wins aren't re-litigated.
4. **On REVISE** — apply the ranked fixes verbatim, re-verify numerically, then **RESUME the same
   critic** (context intact — it confirms against its own targets, cheaper and stricter than a
   fresh spawn).
5. **Budget exactly ONE revise round per phase.** If an element needs a third attempt, the
   *approach* is wrong, not the parameters (the Tempest's glow took three rounds because solid
   meshes can never make a soft falloff — tuning radii was never going to fix it). Stop tuning;
   change technique.

## 4. VERIFY IN THE JUDGED FRAME — capture + measurement discipline

- **Judge in the primary view** (rear-chase, gameplay distance) against the **worst-case
  background**: bright backlit water for rims, the warmest sky for cool coronas, dark-sky for
  blooms. A studio pale-bg pass proves geometry, never look.
- **Numeric pixel checks beat critic eyes** for anything measurable: cross-sections through an
  element, fringe channel ordering, edge luminance vs background. Beware auto-pickers — a
  brightest-frame heuristic latches onto bloom floods; targeted zoom crops + manual sampling win.
- **Capture seams for timed spectacle**: a force/pin flag gated on a normally-undefined global
  (`globalThis.__ddArcForce`-style — undefined in play → roster byte-identical) so every headless
  frame catches the event; suppress ALL tutorial modals (`hintsSeen` = full mask — a mid-flight
  hint pauses the game and freezes the dragon); generous screenshot timeouts (heavy geometry under
  swiftshader runs ~30s+/frame); montage + nearest-neighbour zoom tools for the critic.
- **Keep the roster laws as tests** and treat a red test as design feedback, not an obstacle: the
  accent-lane saturation cap forced the wing-bone bloom to carry falloff by VALUE, which read
  better anyway. If a law genuinely must move, that's an owner decision, never a silent test edit.

## 5. THE PIPELINE — build sheet → shipped, with polish baked in

1. **The build sheet** (per the Tempest/Revenant pattern): identity contract + frozen laws →
   reference-DNA decisions → art direction + rear-chase silhouette → part builders with nullable
   default-off dials → the FX system spec → the tier ladder → feasibility audit → increment plan →
   tests spec → named gate-blind residuals. The owner's reference image **outranks the sheet**.
2. **Increments I0–I5** (coexist → hero → ladder): I0 stub + timers + capture seams (tooling before
   spectacle) · I1 torso · I2 wings (the hero) · I3 head/tail · I4 the FX garment + Surge · I5 the
   ladder + test battery. **Apply §1–§2 from I1** — this is the leapfrog: the Tempest needed a
   4-phase glow-up afterwards because these laws didn't exist yet; the next dragon bakes them in.
3. **ONE polish sweep** (not four): run the registry as a checklist against in-game captures, fix
   what's flagged, one checkpoint.
4. **Sound the signature**: the FX system's rhythm drives a procedural synth (crack + delayed
   brown-noise roll + sub, or the element's equivalent), wired **through the event bus** (renderer
   emits, sfx subscribes — never a direct import), gated to the dragon, routed to the SFX bus.
5. **The PR preview carries the human residuals**, named in one line each: idle-glow fatigue over a
   long run, flash comfort, audio level/cadence, hue temperature per biome. Every one is a one-line
   dial — say so, so the owner knows tuning is cheap.

## 6. THE RULE still applies

Every gate round that changes the creature gets a lesson file in `leapfrog/lessons/` — that is
literally where this document came from. When a new dragon's build discovers a law this doc lacks,
add the law HERE (a short edit) and the story THERE (a new lesson). `leapfrog^leapfrog`.
