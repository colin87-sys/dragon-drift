# WEFTWITCH gains lance organs + SCAR-BURN (rung 11, PR4a) — and the pre-audit that reshaped it

**What we did.** Made WEFTWITCH (slot 11, the arena-weaver) lance-capable: `lockParts:
[palmL, palmR]` (her two weaving hands) + `virtualLockOrgan: loomHeart` = cap 6 (the
KNELLGRAVE shape), and SCAR-BURN `fracBySlot.weftwitch 0.30`. A DATA-ONLY increment — no
runtime code touched; the burn machinery is the already-merged KNELLGRAVE code, and her
music is LIVE so the perfect-release beat is the stock `getBeatClock` path (one-line burn).

**The CP1 PRE-AUDIT (run BEFORE any code, per owner directive) reshaped the design — twice:**
1. **The plan's ONE NEW RULE was unimplementable.** "A volley INTERRUPTS her mend" names a
   gameplay object that does not exist: `restitchWeb()` fires only at PHASE SEAMS (cosmetic,
   closes no lane), and the Surge-fork auto-looses there, so the rule would fire itself and
   protect nothing. Honest replacement (deferred to its own increment): INVERT the verb —
   **the volley TEARS a web sector, she MENDS it** → the mend is the window. "She mends what
   you break" made playable; her identity beat plays MORE, not never.
2. **`weftScar` fails the reachability LAW.** The anti-spider "no limb below horizontal" rule
   puts her whole crown above `laneMaxY 22` (weftScar world y ~24) — unaimable. Dropped it;
   the palms (world y ~13–15) + loomHeart (~17.5) are the in-lane set. **General rule: on an
   above/high boss, NO crown organ can be a lance organ** — the aimable organs hang low
   (hands, mouth), never the head/scar/crown.

**The reusable gotchas:**
- **The plan doc is a HYPOTHESIS, not truth.** For the SECOND rung running, the plan's organ
  prose was wrong against the live model (`handL/handR` "spinneret-arm tips" → the real nodes
  are `palmL/palmR` on `handPivotL/R`, a separate assembly). Always verify node names + the
  named mechanic against the code before designing. Fixed the doc so it can't mislead rung 3.
- **`partWorldPos` resolves a node's ORIGIN, not its visible geometry.** `weftScar`'s anchor
  sits at the spinneret pivot base while the visible stub hangs ~1.3–2.5u higher/aside — a
  brand there would pin to empty space. Check the anchor, not the mesh.
- **Her music is LIVE** (`musicDies` is KNELLGRAVE-only) → SCAR-BURN needed zero new plumbing.
  A boss's burn tell is free when its music runs; only the music-dead boss (KNELLGRAVE) needed
  the toll-edge seam. Check `musicDies` before assuming a custom tell.
- **Named meshes can be lockParts directly** — `palmL/palmR` are named meshes, so no new
  empties were needed (unlike KNELLGRAVE's bind anchors). Reuse existing named anatomy first.

**Guards.** `tests/weftorgans.mjs` (knellorgans template — palms/loomHeart max world-Y ≤ 22,
|x| ≤ 15, paintable). `tests/lockdps.mjs` gains her band (capable, burn-wired 0.30, never a
phase-deleter — her P5 is the thinnest endgame margin ~1.08, a named GO gate). `lockdps --ci`
+ `boss.mjs` green; 8 lance-capable bosses now. **Deferred to PR4b (own CP1/CP2):** the
volley-tears-she-mends rule + tagging her `aimed` ambers for V4 parry-snap WITHOUT
`emitOrigins` (that lever doubles bullet density — a silent difficulty change).
