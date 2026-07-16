# Caldera bible rev 2 — composition promoted to a first-class deliverable

**What we did.** Rewrote `reforged/CALDERA-BIBLE.md` (Stage-1 art direction for the
Emberfall Caldera overhaul) after an owner directive: the "wow, this is beautiful"
moment must come from the COMPOSITION OF THE WHOLE SCENE — props + lava mirror +
ember sky + rising motes + negative space as one photograph — not from prop quality
alone. Rev 1 had a strong roster/ladder/glow/checklist but ZERO composition content
(Frozen's bible compressed composition into one line; that was never going to carry a
"beauty is the frame" mandate).

**What we learned / the reusable pattern.**
- **Give the biome a compositional GRAMMAR derived from its theology, not just a
  focal-hierarchy list.** Caldera's is THE CONVECTION CELL: eye down the bright
  specular lane → into the horizon wound → up with embers/verticals → back along the
  lit sky band. Frozen's closed horizontal loop vs Caldera's rising cycle is itself
  an anti-replication axis — composition can oppose on the same checklist as
  silhouettes and palettes.
- **Density/steps are composition knobs.** Rev 1's hero step 37 (~48 instances/band)
  read fine as roster math but produces a hero PROCESSION — mid-frequency noise, the
  exact awe-grammar failure. Rev 2 retuned to 53 (~34) with alternating-flank and
  "one hero in frame" rules. Check every step choice against "is this archetype an
  event or a texture?"
- **Make composition verifiable like props:** numeric targets on captures (≥40% open
  mirror, reserved horizon band's central third prop-free, 4-plane squint-test value
  separation, bottom-half-brighter gradient) + a full-frame Gate-2 score with the
  same 4.2/5 floor. "A biome of 4.5 props in a 3.0 frame is a REVISE."
- **Reserve the boss's stage in the layout rules.** ASHTALON needs a lit horizon
  band for its dark silhouette — encoded as a permanent prop-free easement (riftwall
  h ≤ 28 underlines it; riftfang |x| ≥ 60 brackets it). Boss framing is a biome
  placement rule, not a boss-fight concern.
- **Arrival is authorable without touching RNG:** extend the existing `writeMatrix`
  park predicate to also park tall/mid families when biome-local dist < ~220m —
  render-only, deterministic, gives the seam an open-mirror beat and a single "first
  chord" colossus.

**The gotcha.** A composition mandate arriving after a bible exists tempts you to
bolt on a section. Don't — placement, steps, park predicates, place() terms, and
even the hero's build sketch all changed once composition became binding. Rewrite in
the mandated deliverable order and re-run the anti-replication checklist (composition
added a new pass line: enclosure-vs-open-plain, rising-vs-looping eye path).

**What it unlocks.** The Caldera builder (PR-1..4 in BIOME-OVERHAUL-PLAYBOOK C8) now
has placement/framing rules as concrete as the tri budgets; and every future biome
bible should ship a composition section of this depth from day one (money shot at
arrival + cruise, layering, negative space, mirror use, boss framing, light-signature
gradient).
