# Jade premium CP2 — body PRESENCE (girth mass + strake ladder + raised ventral scutes), Fable 4.2 PASS

**Did.** Second checkpoint of the Jade Serpent premium pass. A serpent is *mostly body*, so the
tube itself had to become a hero surface, not a smooth green noodle between the fan-crowns. Three
coexisting, default-off dials on the apex (`girthFull`, `strakeLadder`, `scuteBand` — other
forms/dragons byte-identical) turned the tube into an organized value object: **mass** that holds
past the third quarter, a **dorsal→flank strake value ladder** painted on the hex-facet columns, and
a **raised, segmented ventral scute band** (koi underside). Cleared the harsh Fable gate at **4.2/5**
(bar 4.2; B1 4.5 · B2 4.0 · B3 4.0 · B4 4.5 · B5 4.0) after ONE revise round. It squeaks over — not a
comfortable clear — and the residual is documented below so CP3+ can close it cheaply.

**The build (shipped dials, apex):** `girthFull 1.7, strakeLadder true, scuteBand true,
scuteColor 0xd4f5e2, scuteCount 12`.
- **Girth mass** — `girth(t)`: `decay = 1 - down^girthFull` (vs the legacy `(1-down)^1.25`). The higher
  the exponent the LATER the taper starts, so mass holds through the fore/mid body and only whips to
  the tail in the last quarter. **1.7 is the ceiling** — past it the serpent reads bloated, not
  muscular. B1/B4 (mass + grace) are now frozen; **later checkpoints must not touch the radius curve.**
- **Strake ladder** — the hex tube's facet columns painted as a value ladder by dorsal-normal sign
  `sn`: crest highlight at the top, mid jade on the flank, a darker shadow strake below the waterline,
  pale belly at the bottom. Spread the endpoints (deeper crest, deeper shadow→belly) so it's a *full*
  tonal ladder, not two-tone.
- **Ventral scute band** — a segmented pale-mint plate lane down the belly, `nScute 12` (COARSER =
  bigger reads at distance), `bwv 0.28` (wider), and crucially **extruded proud** of the belly
  (`proud = 1.03 + 0.08·seg·taper`, normals `-f.Nn`) so the plates cast a *raised-plate silhouette*,
  not a paint job. Runs throat → ~75% of body length.

**The lesson that cost the first round (3.6 FAIL → 4.2 PASS):** a surface-detail system on a body
must be a SECOND ORGANIZED SYSTEM that survives distance, not facet shading.
- **A detail painted at flank value = facet shading = invisible.** v1 scutes (`0xbfe6cf`, `nScute 16`,
  flat) sat at the same value as the flank and read as noise (B3 2.5, the blocker). Fix: **push the
  plate lane to a distinctly LIGHTER value** (`0xd4f5e2`) in its own ventral lane, and **EXTRUDE it
  proud** so it's geometry, not paint. The light belly lane surviving on the inside of the coil at
  chase distance was the whole point of the axis — that's the Tempest trick (organized value zones
  read at gameplay distance).
- **Coarser reads bigger.** 16 fine plates → mush at distance; **12 wider plates** read as a plate
  system. Same law as CP1's "fewer/wider pleats read pleated, many sharp spikes read thorny," applied
  to scutes: for any repeating detail, pick the count by the DISTANCE read, not by anatomical density.
- **A value ladder needs spread endpoints or it collapses to two-tone.** 3 near-steps read flat;
  pushing the crest brighter and the shadow→belly darker gave a legible 4-step ladder.

**The residual (documented, cheap to close in CP3+ — do NOT re-open CP2):**
1. **Backlight crushes the aft.** The claimed 75% coverage visually dies at ~55–60% because the
   backlit side/low frames crush the aft third to near-mono dark green. Fix later with a small
   **ambient value floor (~0.30) on the belly lane** so silhouette frames keep one step of structure.
2. **Proud scallop is faint in profile.** Go **~1.5× deeper on the inter-plate notch** so the raised
   plates read as silhouette scallop, not just shading.
3. **Head-glow spill bleaches the first scutes** — tighten the throat glow radius when CP3's glow
   lands so CP2's value work stays legible (a CP3 task, not a CP2 miss).

**Verify.** `tricount` (apex still under 6000), `ribbonspine` identity re-bake **27/0** (the new
belly/scute vertices re-loft through the frozen ribbon — the NaN-color guard added in CP1 also caught
the black-render class here), `starters` 461/0. Captures via `_herojade.mjs` — the **low** (belly
scute band), **top** (strake ladder down the midline + fan-row hierarchy), and **chase** (do mass +
dorsal highlight + belly lane all read together at distance?) are the deciding frames for body work.

**Reusable takeaways.** (1) A serpent/long creature is mostly BODY — make the tube a hero surface
(mass curve + value ladder + a raised repeating detail), not a noodle between the hero appendages.
(2) Any surface detail must be a SECOND organized system at a DIFFERENT value from the flank, or it's
facet-shading noise — and EXTRUDE it proud so it's geometry, not paint. (3) Pick a repeating detail's
count by its distance read (coarser reads bigger), never by anatomical density. (4) Value ladders need
spread endpoints or they read two-tone. (5) Backlit silhouette frames crush dark-on-dark — a small
ambient value floor keeps one step of structure in the aft. (6) Freeze axes at their ceiling
(girth/grace here) so later checkpoints don't regress a passed dimension. (7) Motion stays frozen:
belly + scute geometry re-lofts through the ribbon for free; the identity proof + NaN-color guard
catch any decompose slip or bad-Color-lerp black-render.
