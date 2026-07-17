# 2026-07-15 — the Biome Overhaul Playbook (Frozen's method extracted, anti-replication mandated)

**What we did.** Wrote `reforged/BIOME-OVERHAUL-PLAYBOOK.md` — the handoff that lets a fresh
session run a full biome overhaul (side props + all spawn content: masses, in-lane hazard
skins, signature hazard presentation, materials, atmosphere) the way FROZEN REACH was done.
Three parts: (A) the reusable biome-agnostic pipeline distilled from the ~12-lesson Frozen
arc — render-current-state-first → Fable art director + a one-sentence biome "theology" →
studio contact sheet (propstudio/obstaclestudio pattern, inert exports so what Fable grades
is what ships) → build behind the `?props=v1` whitelist-flip → **in-context re-score in the
shipping light** (the studio lies by a full point) → harsh Fable floor 4.2/5 per element →
headless suite + envcount + NaN place() scan + numeric collider coverage → **SW re-stamp**
→ owner preview → lesson file; plus the material architecture as a TECHNIQUE (normal-driven
3-stop value ladder generalized to "where does this biome's light come from", the self-lit
emissive floor, per-facet flat-shaded glints, withheld socketed glow with one address per
biome) and the prop/hazard design laws (massive-first, ≥4 outline families, crown-profile
natural-vs-built, place() clearance classes, unit-space fairness). (B) **THE ANTI-REPLICATION
MANDATE** — the owner's hard requirement made structural: only the method/pipeline/technique
transfers; never geometry, palette, or hazard forms; a "Frozen-recolored" checklist the
builder AND the Gate-2 Fable must run, any unchecked box = RETHINK. (C) a worked Caldera
example (index 3, next after Frozen in CYCLE): inverted value ladder (light from BELOW —
hot bellies, ash-grey crowns), glow address LOW in cracks/throats, a columnar-basalt /
flow-lobe / fumarole / clinker-foil / riftwall roster with zero ice DNA, and volcanic-own
obstacle skins (collapsed colonnade span / spatter chimney / breadcrust bomb) answering
"what is a beam/column/tumbling mass in THIS world" fresh.

**The reusable pattern.** When a proven one-biome arc must scale to N biomes, extract it as
METHOD + MANDATE: the pipeline doc explicitly separates what transfers (process, techniques,
budgets, gates) from what may never transfer (forms, hues, hazard fictions), and encodes the
distinction as a gate-run checklist rather than prose intent. Also: each shipped premium
biome appends itself to the "must not resemble" list — distinctness compounds.

**Gotcha.** The hazard story has TWO layers that are easy to conflate in a handoff: the
biome's signature hazard (`hazards.js`, identity-triple, e.g. Caldera's shipped geyser) and
the three in-lane obstacle SKINS (`OBSTACLE_SKINS[bi]` over byte-identical colliders). Both
are biome-owned inventions; the playbook specs them separately so a builder doesn't "reskin"
one biome's answers into another.

**What it unlocks.** Caldera (PR-1 materials → PR-2 props → PR-3 obstacle skins → PR-4
geyser presentation) can start cold from the playbook; every subsequent biome runs the same
doc with a fresh identity.
