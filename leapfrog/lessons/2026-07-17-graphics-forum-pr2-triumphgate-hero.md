# Drowned Forum PR-2 — the `triumphgate` hero (the identity-prover) + the forum bakes land

**What we did.** Built the Drowned Forum's WAVE-A hero — a Roman **triumphal arch** — appended at the END
of `ARCHETYPES` behind `biomes: forumV1` (spawns only under `?props=forum`, gold-determinism untouched).
This is also where the material-kit the PR-1 lesson deferred finally lands, beside its first consumer: two
new bakes on the shared lagoon merge path — `bake:'forum'` (the §2A re-stopped tide ladder: travertine
crown / narrow hard algae line / drowned slate-teal, `waterY 0.16` so the feet drown) and `bake:'fresco'`
(§2B Pompeian red). 144 tris, 2 groups (forum stone + gilt). Gilt lives ONLY in a recessed soffit coffer.

**The reusable pattern — a new bake is ~15 lines on an existing merge path, not a new material.**
The forum stone reuses `lagoonStone` (white + vertexColors + warm emissive) and `gilt`; only the vColor
STOPS change. Add the stops + a `bakeX(geo)` (copy `bakeTideLadder`'s structure), a `bake:'x'` tag arm in
`mergeLagoonParts`'s dispatch, and one `if (xB.length) …` bake-then-push line. Zero new draw calls, zero
determinism surface (props are render-only), coexists with every other kit. A whole geology in 2 material
groups.

**The Stage-1→Stage-2 gate earned its keep — three defects only the in-context water render exposed:**

1. **The blank pier face reads as a "plain slab" (§11.4) at close range.** The studio's flat card hides it;
   over the water at ~30m the bare travertine trapezoid dominates. Articulation is mandatory for a hero.
2. **A stack of parts at the opening top = a "jumble."** Round-1/2 had the cornice (full-width, full-depth),
   keystone, gilt and ring all converging at the bay top; looking *through* the arch you saw up into that
   stack as broken shards. Fix: a clean **soffit** box caps the bay at the apex → the tunnel becomes a clean
   arched passage and the gilt coffer recesses into a real ceiling. **Rule: an arch you can see through needs
   its ceiling modelled as one clean surface, not left as the underside of whatever masonry sits above.**
3. **THE TECHNIQUE-CEILING CATCH (the sheet's convergence protocol, proven): proud vertical pilasters
   foreshorten into dark SPIKES.** A thin tall box (0.10×0.60×0.05) proud on the pier face reads fine head-on
   but from the ¾ vantage the player actually gets, it collapses to a thin dark vertical fin — a sci-fi
   spike, not a Roman column. Per the protocol, a 3rd attempt at the same topology is a technique ceiling, so
   we CHANGED TECHNIQUE: a **horizontal impost springer ledge** (where the arch weight lands on the pier)
   articulates the pier + frames the bay and CANNOT foreshorten into a spike (a horizontal ledge reads as
   masonry from every yaw). **Reusable law: prefer HORIZONTAL articulation (imposts, cornices, string-
   courses) over proud vertical strips on props seen from a low ¾ cruise cam — verticals spike, horizontals
   don't.**

**The other gotcha: pin the money face for an off-lane landmark.** The arch carries its detail (impost,
gilt soffit, arch ring) on the object +z face; a landmark scatter sits far off-lane (the player passes it,
never through it), so `place()` pins `rotY = (side>0?π:0)+jitter` (the wall-prop side-based idiom) to turn
that face lane-ward and double it in the calm-water mirror. Random yaw would show the blank back half the time.

**Deferred (silhouette economics + budget):** engaged round half-columns and the fresco niche came out in the
convergence — the name test (piers ≥¾ span + round arch + cornice + attic + broken shoulder + coffered
tunnel) holds on the mass at cruise, and 144/150 tris left no room. Candidates for a Fable-round refine once
the owner signs off the read. **The hazard reskin (Sinking-Gates → Sinking Triumphal Arch, colliders
byte-identical) is the NEXT step — the sheet orders it AFTER the hero is proven; it reskins the `gate`
obstacle's fresnel frame (obstacles.js `PHASE_SKINS`/`gateFrameMats`), not this archetype mesh.**

**Verify:** `HERO=triumphgate node tools/_forumclose.mjs` (in-context) + `_cwstudio.mjs t triumphgate 22 19`
(form). envcount 144 tris / budgets green; gold-determinism, biomecycle, bulletcontrast, propclearance, tricount green.
