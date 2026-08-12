# Drowned Forum — GATE IN THE PLAY ASPECT (portrait mobile), not landscape: the scale-judged-twice miss

**What happened.** After PR-3 shipped, the owner (on his phone) said the near-rail + foil "feel too small."
Fable prescribed a ×1.4 bump, I re-shot the mixed composition, Fable gated it **4.4 PASS** — and the owner,
looking at the SAME build on device, said *still too small*. The gate and the owner disagreed because **I was
capturing LANDSCAPE (1460×760) and he plays PORTRAIT mobile (~9:19.5)**. A second, bigger Fable pass — judged
in portrait this time — took viamarina h 9–12 → 15–20 and drumfall h 4.5–6 → 7–9, and THAT finally matched what
the owner sees. Two rounds were spent because the first gate used the wrong viewport.

**THE LAW — gate in the aspect ratio the player actually plays.** A landscape capture and a portrait capture
of the *same scene at the same prop scale* give opposite scale verdicts:
- **Portrait has a much narrower horizontal FOV**, so lane-edge props (at x≈±25) get pushed to the frame
  margins or cropped, and what fills a landscape frame reads as tiny bollards in portrait.
- **Portrait is tall**, so props that sit at the horizon occupy a thin band while sky+water+the dragon own ~85%
  of the frame — the failure mode is "columns top out UNDER the horizon line" = fence posts, not architecture.
This game targets weak MOBILE (portrait). **Make the biome capture tool default to a portrait viewport**
(`tools/_forumscene.mjs` is now `{720×1480}` by default, `FORUMSCENE_LANDSCAPE=1` for the old wide frame), and
judge composition/scale there. Landscape is now only a one-glance sanity check for corridor walling.

**The portrait scale-up numbers (locked ladder):** hero `triumphgate` 17–23 (untouched) : `viamarina` near-rail
**15–20** : `drumfall` foil **7–9**. The win in portrait is ~80% HEIGHT (columns must BREAK the horizon and read
as architecture the player skims) + one free notch of PROXIMITY (viamarina x base 14.6→13.5 = the legal corridor
floor; inner edge worst-case 13.5+0.14·10 = 14.9 ≥ 14.5). drumfall got ALL its presence from h, not proximity —
taller+closer would clip the flight lane at wave-skim altitude. Hard caps: viamarina 20 (stays under the hero's
midband), drumfall 9 (above that a foil stops being quiet rubble).

**SEPARATION beats scale for a foil next to a near-rail.** After the enlargement, drumfall (a fallen-column
scatter) SILHOUETTE-MERGED with the viamarina column feet and read as "base rubble," not a distinct fallen
column — because their x-bands overlapped, so the foil sat inside the rail's silhouette. The fix wasn't more
scale, it was **lateral separation**: kick the foil's x base 16→13 so ~3 units of clear channel water sit
between it and the nearest rail foot. That water gap is what sells the "fell from up there, rolled out here"
read. **When two prop families share a lane edge, give them non-overlapping x-bands or one reads as debris of
the other.**

**Process meta — the owner's device is the ground truth the machine gate approximates.** A Fable PASS on the
wrong viewport is a false pass. When the human judges "too small/too big/wrong" against a machine PASS, the
first suspect is a capture that doesn't match his surface (aspect, FOV, resolution, HUD scale), not his eye.
Match the capture to the play surface BEFORE re-tuning the art.

**What it unlocks.** Portrait is now the forum gate viewport; the scale ladder is locked
(hero 17–23 : rail 15–20 : foil 7–9, viamarina hard-capped 20, drumfall 9). Placement is render-only →
determinism/budgets untouched. PR-3 is closed at the owner's device bar.

**Verify:** `node tools/_forumscene.mjs <tag>` (defaults to portrait 720×1480); envcount / gold-determinism /
biomecycle green (size changes are render-only).
