
---

## L170 — JADE CP2 PASS (all 3 forms + growth arc + distinctness, avg 4.25) — the slot's aesthetics arc CLOSES

Slot C (jade) cleared the CP2 gate at **avg 4.25, no axis ≤2** (differentiation 4.5, greenness 4.5,
distinctness 4.5, form-0 cuteness 4.0, per-form beauty 4.0, motif bloom 3.5). With CP1 (4.125), jade is
through both aesthetics checkpoints. The gate: "emphatically NOT same-dragon-bigger... trio black-fills
instantly tellable... no collision with any roster neighbor."

**CP2 is a different fight from CP1 — it's the FORMS and the MOTIF, not the apex geometry.** The apex was
settled at CP1; every CP2 FAIL was form-0 (the hatchling) or the pearl bloom. Budget CP2 for: (1) tuning
forms 0–1 to their §4 growth-arc bands (head:body / eye:head / span:body per form + monotonic dials) so the
FULL `tests/starters.mjs` (not `--cp1`) goes green; (2) the hatchling reading genuinely CUTE; (3) the motif
visibly BLOOMING 0.3→0.6→1.0 across the FACE crops.

**Reusable lessons:**
- **A big cute hatchling eye goes GOOGLY when the ball is seated PROUD.** The same `oneShellEye` proud-push
  (`0.15 + rr·0.35`) that seats a small keen apex eye makes a big f0 eye bulge wider than the skull. Fix:
  a per-skull GENTLER push for the cute forms (`0.02 + rr·0.12`, less lateral, higher-set) so the head
  silhouette owns the eyes. Big + round + low-set + dark-pupil-with-catchlight = cute; big + proud = googly.
- **A chin motif must TRACK the head (headBase), but the PUBLISHED §7 anchor must stay INVARIANT.** Jade's
  pearl reads in the face crop only if it rides under the jaw as the neck grows — but anchoring the
  published `motifAnchor.local` to headBase drifts >0.15 across forms and fails the invariance assert. Draw
  the bead at headBase; publish the anchor at a FIXED torso point. The two legitimately differ (the anchor
  is the conceptual motif locus; the bead follows the jaw).
- **The bloom ramp lives in emissive, not just scale.** f0 = a dull bead (emissive ~0.1), apex = the ONE
  bloom (emissive ~0.55, kept ≤0.55 so it reads MINT not blown-white). A pale-mint DIFFUSE keeps it green
  under ACES; a near-white diffuse + high emissive reads as a white slab.
- **A pale "belly/cream" tone painted on a HEAD reads slate-blue in cool studio shadow.** The koi jaw used
  the pale belly colour and drifted blue at every form; retint the head's jaw a LIGHT-JADE step off the body
  (in the green family) rather than the pale belly. Same class as the L164 cyan-on-warm gotcha, inverted.
- **Neighbours must be captured full-frame.** The default 560×440 silhouette renders the neighbour at <10%
  of frame — unjudgeable, a demanded re-capture. Always pass `--scale=2 --crop` for distinctness fills (§6.9).

**The whole slot in one line (L167→L170):** ICONIC GREEN direction → CP1 stalled at ~2.1 on parameter tuning
→ **broke the plateau with a STRUCTURAL rework** (lofted koiSkull + reshaped koi-silk fins, L169) → CP1 PASS
4.125 → CP2 tuned the forms + bloomed the motif → CP2 PASS 4.25. Next: CP3 (the formal trio verdict across
all three NEW apexes + tier rows) closes the arc; then the human judges motion/feel on the PR preview.
