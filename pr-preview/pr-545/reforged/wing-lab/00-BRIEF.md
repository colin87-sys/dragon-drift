# WING LAB — shared research pack (the single source of truth)

**Subject: ONE WING of a western fire dragon.** Not the dragon. The wing.
Nobody in this lab designs a head, a tail, a body, a horn, or a colour scheme for a
creature. Every finding must survive the question *"does this change what the wing
looks like?"* If it doesn't, it isn't in scope.

## The path contract (READ THIS BEFORE ANYTHING ELSE)

Every agent in this lab reads and writes the SAME absolute paths. There is no private
scratch. If you learn something and it isn't in this directory, it does not exist.

```
/home/user/dragon-drift/reforged/wing-lab/
  00-BRIEF.md          <- this file. Read first, always.
  data/                <- hard numbers. One file per stream.
  art/                 <- artistic / visual-language findings. One file per stream.
  refs/                <- SHARED IMAGES. Every agent may Read any file here.
  90-SYNTHESIS.md      <- the Fable director writes this. Nobody else touches it.
  91-CRITIQUE-LOG.md   <- the Fable director's harsh verdicts, append-only.
```

Before you start: `ls -R /home/user/dragon-drift/reforged/wing-lab/` and read what is
already there. You are leapfrogging other agents' work, not duplicating it.

## Prior art you MUST read before researching (do not re-derive it)

- `reforged/DRAGON-ANATOMY-REFERENCE.md` **§4 (Wing construction, lines 619–820)** —
  spar topology, membrane regions, finger decay, camber/AR bands, folded pose, and a
  `§4.7 What §4 rules out`. This is already excellent. **Your job is what it does NOT
  have.** It explicitly flags these as `unknown` / OPEN — closing any of them is worth
  more than restating what's closed:
  - bat digit II–V lengths as ratios to forearm (LD3/FL, LD5/FL as *numbers*)
  - bat forearm : humerus ratio
  - pterosaur wing finger : humerus and : forearm ratios
  - propatagium depth as a fraction of chord ("genuinely unsettled", `[no-assert]`)
  - actinofibril *spacing* (only diameter 0.05–0.2 mm is sourced)
  - folded-pose joint angles (declared the weakest-sourced item in §4)
  - the absolute airspeed at which the trailing edge flutters
  - published AR / wing-loading for albatross, Andean condor, *Pteranodon*, *Quetzalcoatlus*
- `reforged/DRAGON-ANATOMY-REFERENCE.md` **§7** — hot-material appearance physics
  (blackbody colour, crack morphology, bloom ratios, char albedo). The fire stream
  builds on this rather than restating it.
- `reforged/DRAGON-DESIGN.md`, `reforged/FLAP-DESIGN.md`, `reforged/AAA-PIPELINE.md`.

## The tagging law (inherited from DRAGON-ANATOMY-REFERENCE §0.1 — enforced here)

Every factual claim carries exactly one tag:

- `[S]` — **sourced.** A real, retrievable source. Give the URL or full citation inline.
  A number with no source is not `[S]`, no matter how confident you feel.
- `[D]` — **derived.** You computed or inferred it FROM something `[S]`. Show the step.
- `unknown` — **you looked and could not find it.** This is a first-class result. Write
  the row with `unknown` in it. Say what you searched.
- `[no-assert]` — the literature actively disagrees or refuses to settle it. Say so.

**Fabricating a number is the only unforgivable act in this lab.** A pack full of
honest `unknown`s beats a pack of plausible inventions, because the Fable director
will art-direct the gaps deliberately instead of trusting a hallucination.

### ⚠ What `[S]` can and cannot mean in THIS environment

**`WebFetch` is blocked by the network egress proxy on every domain** — confirmed on
wikipedia, PMC, arxiv, fxguide, artofvfx. `WebSearch` works. So no agent in this lab has
actually *read* a source page; everything comes from **search-result summaries of named
URLs**. That is a real limit on how hard any number here can be leaned on, and it must
stay visible rather than being smoothed over.

The convention every stream uses, so the director can calibrate:

- `[S]` + URL — a real, retrievable, named source that the search index attributes this
  claim to. It does **not** mean the page was opened and read.
- **Text in "double quotes" is verbatim as the search index returned it.** Unquoted text
  is the index's paraphrase — the claim is sourced, the *wording* is not the author's.
- Where it is unclear **which** URL in a result set a paraphrase came from, say so inline.
  **Never silently attribute.**

Consequence for the director: a number that would change the build significantly and rests
on a single unquoted paraphrase should be treated as `[D]`-grade, not `[S]`-grade, and
art-directed with that uncertainty acknowledged.

## Output format

Write ONE markdown file into `data/` or `art/` named `<stream-id>-<slug>.md`. Structure:

1. `## Headline` — the 5 findings that most change what the wing looks like.
2. `## Tables` — numbers, tagged, with sources.
3. `## Build implications` — each finding turned into a statement about geometry,
   silhouette, motion, or shading. This is the part the director actually uses.
4. `## What this rules out` — the failure modes your findings kill on sight. Be specific
   and visual ("a membrane whose deepest sag is at the trailing edge"), never abstract.
5. `## Still unknown` — what you could not close, and what you searched.

## Reference images

`refs/` is shared. External image download is **blocked by egress policy in this
environment** (403 on CONNECT) — do NOT waste turns on curl/wget to fetch photos.
Images in `refs/` come from three legal, reachable sources:
- **In-engine renders** of the repo's existing wings (headless harness in `tools/`).
- **Procedural anatomy plates** — SVG/PNG we draw ourselves from the sourced numbers.
- **Generated moodboards**, clearly labelled as mood, never as anatomical evidence.

If you produce or find an image, put it in `refs/` and add a line to `refs/INDEX.md`
saying what it is, where it came from, and what it is evidence OF. An image with no
INDEX entry is not usable by the other agents.

## The standard

The wing is the single most-looked-at silhouette in a rear-chase flying game — it is
on screen 100% of the time, on both sides of the player. It is where dragons are
usually cheapest and where the payoff for getting it right is largest. The bar is not
"good for procedural". The bar is that a harsh critic, shown this wing beside the best
shipped dragon wings, picks ours.
