# 2026-07-22 — Empyrean Ghost Orchard P1: deep-rose petals that survive ACES

**Did / learned.** Shipped Phase 1 of the Empyrean "ghost orchard" evolution: rose sakura
petals that lift off seeded water rafts and rise in **columns** through the water→sky band,
over **living water** (rose lift-discs + contracting rings). One `InstancedMesh`, one draw
call, gated on a default-0 `empyOrchardMix` (0 elsewhere → other 7 biomes byte-identical).
Fable PASS 4.3/5 after two REVISE rounds. The hard-won lesson is about **petal saturation
under ACES on a bright field**:

- A petal whose vertex colours are only *mildly* rose (e.g. `0.87,0.66,0.80`, ~0.15 channel
  spread, L~0.82) **renders WHITE** at near-LOD. On the Empyrean's bright pale field the ACES
  tonemap compresses highlights and eats the little saturation there was → paper-cut confetti,
  not petals. Two rounds died here (a "value ladder" that existed *in the data* but not *in the
  pixels*).
- The fix that finally read rose: deepen the ladder **hard** — base saturation ~0.74
  (`0.62,0.16,0.38`), shoulders ~0.65, bloom-tips ~0.53, hue ~330°, **L ≤ 0.55 pre-tonemap**.
  Post-ACES that lands at a legal pastel screen-saturation (~0.30) — the bright field *needs*
  the extra pre-tonemap saturation as headroom, it is not a law violation.
- **Probe the thing the eye judges, not a proxy.** A band-fill probe (rose px per screen-third)
  went GREEN while the near petals were still white — it was counting distant/mid specks. Added
  a `meanSat`/`satHiFrac` channel that samples *screen saturation on the moving-rose pixels*.
  That is the number that co-varies with "reads rose." (Caveat: it still averages in the faint
  AA-halo pixels around each petal, so it reads ~0.25 even when the hero petals are vivid — read
  it alongside the frame, don't gate on it blind.)

**→ Systematize.** Reusable rules for any **saturated small accent prop on a bright ACES field**
(petals, embers, spores, sparks — anything that must hold a HUE against a pale sky):
1. **Pre-tonemap saturation is your budget, not your output.** Author the core at S ≥ 0.65 / L ≤
   0.55 and let ACES bring it down to the legal pastel on screen. Mild pastel *authored* values
   wash to white.
2. **Build an internal value ladder** (dark-core → mid-body → bright-bloom) so the prop reads as
   a shaped object, not a flat polygon — and so *some* facet always survives the wash.
3. **Columns not clouds:** to make instanced risers read as a *structure*, cut the per-instance
   lateral spread to ≤2m and the sway to ≤0.35 so each seed = one coherent vertical thread; keep
   the rise height short enough (~26m) that the stream stays in the visible band instead of
   spraying out of frame.
4. **Portrait ±13° corridor:** flanking risers only enter a phone crop when far ahead. Mix the
   lateral offsets (here 2–14m) so some seeds sit near-centre — that, plus deep colour, is what
   filled the portrait to 15+ petals.
5. **Tint-on-blue-water needs R to *beat* B, not just lift it.** A `col*vec3(1.15,0.89,1.0)`
   multiply on blue-violet water still reads lavender; you need `R_mult/B_mult > ~1.36` (here
   `1.50,0.80,0.96`) for the disc hue to clear the 315° rose floor.
6. **Perf:** 288 instanced 4-tri petals in one draw call + an 8-iter per-pixel water loop (gated
   `if (uOrchardMix>0.0001)`) measured **zero** frame-time delta vs a control biome. Ambient
   density is cheap when it's one instanced mesh; spend it.

**→ Leapfrog.** P1 proves the water→sky "lift" sentence and the deep-rose petal kit. That unlocks
**P2 — ghost sakura hero trees**: re-seat rafts under the trees so the columns *thread the canopy*
(water→canopy→sky), and reuse the exact petal ladder for the bloom clusters. Fable's two P2 polish
carry-overs are already scoped: (a) slower mid-distance saturation falloff / +20–30% petal scale
beyond ~60m so cruise reads as an orchard not one tree; (b) a second darker-rose facet per petal to
kill the paper-cut tell before P2 densities magnify it. And the `meanSat` probe pattern generalises
to every future "does this accent actually read as its hue?" gate.
