# Tempest Reach — slotting biome 7 into the play CYCLE (placement is a tri-budget + narrative solve)

**What we did.** The scarpwall composition work shipped Tempest Reach as `BIOMES[7]`, appended but
**not yet in the CYCLE** (flyable only via `?biome=7`). This change adds it to the playable rotation.
`CYCLE = [0,1,2,3,4,6,5]` → **`[0,1,2,3,4,6,7,5]`** — Tempest slotted between Aurora (6) and the
Empyrean (5), making the climactic tail **AURORA → TEMPEST → EMPYREAN**. Updated 3 tests + 4 comments;
gold-determinism, envcount, stormtick all green.

## Where it went, and why that slot

The slot is forced by **two independent constraints that happen to agree**:

1. **Tri-budget (the hard gate).** envcount caps the worst adjacent-cycle pair at **90k band tris**.
   Tempest is heavy (**46,692**). Its forbidden neighbour is the Mire (**49,992**) — the pair is
   **96,684 > 90k**, a slot-canyon of geometry. Every other neighbour is legal: Aurora (35,452 →
   **82,144**), Empyrean (16,108 → **62,800**). So Tempest simply **cannot** touch the Mire, which
   eliminates the whole "storm after the swamp" family of placements. The worst pair in the shipped
   cycle stays **Mire + Aurora = 85,444** (unchanged — Tempest didn't become the new worst pair).
2. **Narrative (the tie-breaker among the legal slots).** Aurora→Tempest→Empyrean is calm →
   violence → cosmos: the settling aurora is torn open by the storm-sea, and Tempest's own
   **eye-breach** (a hole punched in the storm deck onto the sun) foreshadows the open cosmic sky it
   hands off to. `keyShift` leaps **−3 → +3** across the Tempest→Empyrean seam — a musical
   ascension *out* of the storm.

**The reusable law:** for a heavy biome, **run envcount FIRST to find the forbidden neighbours, then
pick the narrative slot from what's left** — don't fall in love with a placement before the tri-budget
vetoes it. envcount reads the CYCLE, so editing the array and re-running it is the whole adjacency check.

## The seam consequences (what a mid-cycle insertion actually breaks)

Inserting a biome **between two that used to be adjacent** splits any crafted cross-seam handoff they
shared. Here Aurora and the Empyrean were neighbours, and their **curtain→whale handoff** (auroraMix
1→0 as whaleMix 0→1, deliberately co-timed in one 400m window) got a whole Tempest block wedged between
them. It did **not** break — it became a **two-step sequence**:

- The **curtain still dies** at the Aurora→Tempest seam (block 5→6). The whale stays dormant there
  (neither Aurora nor Tempest declares `whale`).
- The **landmark (whaleMix) rises one block later** at the Tempest→Empyrean seam (block 6→7). The
  Empyrean carries `whale:1`, so the mix is keyed to *its* presence, not to a hardcoded Aurora→Empyrean
  adjacency. This is why it still works: **channels keyed to a biome PROPERTY survive a CYCLE reorder;
  channels keyed to a hardcoded block index would not.** (Confirmed at `biomes.js` `env.whaleMix =
  lerp(a.whale||0, b.whale||0, ts)`.)

The `aurora.mjs` "curtain dying while whale rising in ONE window" assertion encoded the *old adjacency*
and had to be rewritten to the new sequence (two separate seam checks). That's the tell: **a
mid-cycle insertion is caught by tests that assert cross-seam SIMULTANEITY, and only those** — the
per-seam crossfade logic is untouched.

## The test-update checklist for any CYCLE insertion

Three tests are CYCLE-shaped and must be walked block-by-block after any edit:
1. **biomecycle.mjs** — the CYCLE array literal, its length, `block % N` reachability of the new index,
   and the "which block ≡ what" checks.
2. **propaerial.mjs / any per-biome-lever test** — these enumerate biome centres by **block number**
   (`block*1500+750`), and a reorder changes which biome each block lands on. The "must be 0" block
   list has to be re-derived from the new CYCLE (a block that was a zero-lever biome may now be a
   live-lever one — here old block 6 flipped from Empyrean/0 to Tempest/0.65).
3. **aurora.mjs (or any seam-handoff test)** — the block-layout comment + any cross-seam
   simultaneity assertion.

**gold-determinism does NOT move** (course gen is biome-blind — it indexes CYCLE only for cosmetics),
which is the safety net that makes a CYCLE edit low-risk: the geometry/collision stream is byte-identical
regardless of biome order. Verify it stayed green anyway.

## What it unlocks

All 8 biomes are now in the playable rotation. The pattern — **envcount-first to find the legal slots,
narrative to choose among them, then walk the three CYCLE-shaped tests block-by-block** — is the reusable
recipe for cycling any future appended biome. The `?biome=<i>` debug pin stays useful for isolated hero
shots even though nothing is un-cycled anymore.
