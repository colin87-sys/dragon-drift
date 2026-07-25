# 2026-07-11 — Jade CP3 spectacle spend: carve the flutes INWARD so "amplify" survives the sil-rear diff

**Did / learned.** Jade's apex used only 4056 of the 6000/form budget. Ran the CP3 "spectacle
headroom spend" (same pattern as Solar CP3): make the EXISTING signature landmarks LITERAL/monument
scale, never add a new motif. A high-effort Fable synthesis confirmed the headline and ranked the
menu. Built apex 4056 → 4952 tris, all gated apex-only (new dials `rayRelief` 0/0/1, `veilTail`
0/0/1) so the Radiant form visibly EARNS it:

- **Headline — the silk-fin SAILS made literal rayed koi veil-fins.** `petalGeo` (dragonWings.js)
  flutes each smooth 10×7 blade into **3** raised koi-fin RAYS (root→tip crests with recessed web
  troughs; ray #1 = the existing leading rib). +640 tris (nZ 7→11, apex-only).
- **Streamers → folded silk BANDS.** `streamerGeo` widened 2→4 width-verts with a whisper crease +
  a value seam (faded before the tip so it never reads as a detached blob). +176.
- **The documented-but-never-built "veil (finned) tail" made literal.** A MEDIAN caudal fin emitted
  INSIDE the koiSerpent tube geometry (dragonKoiSerpent.js), so its verts join the `bodyWave` arrays
  and WHIP with the tail for FREE — zero new tick. +80.

**The load-bearing gotcha: on a TILTED surface, relief crests EXPAND the silhouette — so carve the
webs INWARD, don't raise the crests.** The fins tilt ~47°, so my first flute (crests displaced +y,
troughs −y, symmetric) bulged the rear outline **4.7%** (IoU 95.5%) — a redesign, not an amplify.
Fix: displace **inward only** — `y -= relief * (1 - ray) * edgeFade * lenFade`. The ray CRESTS stay
at the original smooth-blade surface (= the original silhouette envelope) and only the WEBS recede.
Plus fade every displacement to zero at the chord edges (`edgeFade`) and root/tip (`lenFade`) so the
outline-defining boundary verts never move. Result: **IoU 99.44%** with the full ray read intact.
The value banding is then pure vertex-colour (pale-jade crest / deep-emerald trough) on the EXISTING
materials — zero new drawables, surge-safe.

**→ Systematize.** Three reusable rules for any "amplify inside the silhouette" spend:
1. **Interior relief must CARVE, not RAISE, whenever the surface is tilted toward the sil cam.**
   Raising crests on a ≥~30°-tilted panel moves the outline; recessing troughs leaves the max-extent
   envelope where it was. Always taper displacement to 0 at the outline edges too.
2. **A MEDIAN (sagittal-plane, x=0) fin is silhouette-FREE at rear-chase by construction** — it's
   edge-on to the behind-cam, so it adds mass on side/rear-¾ (and flickers into view as the body
   whips) while the sil-rear diff stays *identical* (the caudal veil added **0** sil pixels). Reach
   for median geometry when you need rear-view mass without touching the loved outline.
3. **Emit "should whip with the body" geometry INTO the wave-driven mesh, not as a child.** The koi
   `bodyWave` flexes only its own `geo`; appending veil verts to that same positions/normals/colors/
   indices BEFORE the geo is built (so they fall inside the `vcount` the wave arrays are sized to)
   gets you free per-frame motion with zero new tick code.
4. **A headless sil-rear pixel-diff makes "amplify, don't redesign" an ENFORCEABLE gate**, not a
   vibe. `tools/silhouette.mjs` (Chromium-free, ~100ms, deterministic) → save BEFORE → diff AFTER on
   every change. Kept the whole spend honest (caught the 4.7% bulge instantly). Helper committed as
   `tools/_sildiff.mjs` (changed-px %, IoU).

**→ Leapfrog.** The CP3 "spectacle headroom" pass now has TWO worked examples (Solar = architecture
on a dark-body apex; Jade = fluted relief + median veil on a light/green koi). The carve-inward +
median-fin + emit-into-the-wave tricks are the missing primitives for spending headroom on any
SMOOTH-surfaced dragon (the whole low-poly roster) without touching its silhouette — the next
starter/premium apex that reads "smooth but empty" is now a cheap, bounded pass: assess symbol-scale
landmarks, carve them literal, cap at wow-saturation (~+900 here — the fins are the single largest
rear-chase surface; past that is smoothness or micro-mud), prove it with the sil diff, gate the
Fable ratchet (PASS 4.15), owner-judges-motion. Consciously omitted: the f1 ray pre-echo (density
law at the smaller f1 span) and a 3rd nested streamer (Fable's own sil-risk flag) — apex earns the
rays cleanly instead.
