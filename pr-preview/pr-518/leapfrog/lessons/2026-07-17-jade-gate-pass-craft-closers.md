# 2026-07-17 — Jade: clearing the Fable gate (4.24) — the craft closers

**Did / learned.** The Jade Serpent redesign cleared the harsh-Fable gate at **4.24/5 (PASS, no veto)**
after eight rounds (2.1 → 2.7 → 3.40 → 3.60 → 3.70 → 3.80 → 4.00 → **4.24**). Once the *skeleton* was
right (the fresh spine-frame torso, prior lesson), the last four rounds were pure finish, and the fixes
that moved the needle were specific and reusable:

- **"Flat-shade the body" ≠ `flatShading:true`.** The material flag was on the whole time and the HEAD +
  FANS faceted, but the TUBE read glossy-smooth. Root cause was **radial resolution**: 8 sides around a
  tube blend into a round cylinder even when flat-shaded. Dropping to **`bodyRadial:6` (hexagonal
  cross-section)** made the facet planes read as paper-craft. Rule: for a matte low-poly *tube*, facet
  count is the knob, not the shading flag — 6–7 sides read faceted, ≥8 reads round.
- **Ring DENSITY, not just radial, controls the along-body facet read.** N=48 tiny rings looked smooth;
  cutting `bodyLength` (which sets the ring count, *independent* of the body's actual length set by
  `bodyReach`) to ~24–30 rings gave visible facet steps down the length. Decouple "how long" from "how
  many segments."
- **A signature graphic band must be GEOMETRY, not vertex paint.** Painting the dorsal stripe onto the
  tube's top column read as "broken dashes / lighting sheen" (it depended on which facet faced up, and
  interpolated soft). Re-authoring it as its **own raised strip of geometry** (dark seam · pale-green edge
  · seafoam centre · edge · seam) riding the dorsal line gave a continuous hard band from every angle.
  Emit it into the wave-driven mesh so it whips with the body.
- **Near-white on a cool-ambient render drifts blue-grey.** The stripe seam at `0xe4fff0` read blue; a
  pale-*green* seam (`0xcaf2d8`) plus the green emissive floor kept it in-family. Same root cause as the
  teal fans two rounds earlier — pale surfaces reflect the studio's cool ambient; keep "near-white"
  accents slightly green and lean on an emissive floor.
- **`cuteEye:false` = the solid gem eye.** The cartoon black-pupil-on-sclera failed the reference's
  "solid luminous green lens"; turning the cuteEye pupil off gave the gem read the critic wanted.

**→ Systematize.** The Fable-gate-per-round cadence *worked as designed*: a fresh harsh critic each round,
builder never self-judging, one revise round then re-gate — it caught a fishtail, a white head, floating
orbs, teal-from-lighting, and a fake stripe that the builder's own eye had rationalised, and it drove a
monotone climb to PASS. Two meta-rules for next time: (1) **when a "did-it-land" comes back PARTIAL/NOT on
the same note twice, the builder mis-diagnosed the mechanism** — the fan-teal ("re-tint" three times when
it was lighting) and the body-facet ("flatShading" twice when it was facet-count) both cost a round because
the fix targeted a symptom; read the critic's *evidence*, not just its ask. (2) **Relay the critic's actual
pasted output**, and let the numeric bar (4.2) be the terminal condition — no shipping on a "should."

**→ Leapfrog.** Jade is shipped-quality against the owner's real reference and the whole thing is one matte
paper-craft mesh with a spine-frame rig any serpentine creature can reuse. The next dragon built on
`dragonJadeSerpent` should hit these craft gates in round one by starting from the closers here:
`bodyRadial 6–7`, ~24–30 rings, signature bands as raised geometry, pale accents kept green + an emissive
floor, gem eyes. The open follow-up the critic left (non-blocking): flanks one value-step darker, and a
slightly more angular head skull — a `koiSkull` brow/crown tweak for whoever revisits.
