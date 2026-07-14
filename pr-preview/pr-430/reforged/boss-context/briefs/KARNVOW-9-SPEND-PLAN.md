# KARNVOW SPEND PLAN — verdicts on the brainstorm (paste this to the builder)

Owner decision, curated against the audit + the design laws. You framed the problem correctly:
draws are the creative axis, tris only pay at silhouette scale, and the identity laws box us in.
Here are the verdicts — **build in this priority order.** One user decision is already made for
you: ghost-flickers are approved as **Voidmaw-only** (see P4).

**Before you start: re-verify the live numbers** (`node tools/bossgate.mjs karnvow`) — the
9,139 tris / 46 draws figures are from your last report; work from what the gate prints today.

---

## GREENLIT — in this order

### P1 — Bucket 5: merged relief, ZERO draws (do first — uncontroversial)
Carved horn-lance (it's Voidmaw's horn — give it real relief + the violet scar seam), the
**BACKPLATE** (his back shows in the new entrance — forge motifs), rivets, cowl stitching, and
each trophy charm becoming a real miniature relic instead of a blob.
**Cost: +0 draws, ~+2.5k tris (→ ~91%). Laws touched: none. This bucket is free grandeur — take
all of it.**

### P2 — The empty hook slowly swings toward YOUR dragon as the fight runs
The single best idea in your list. Zero new draws (a rotation on an existing part), pure menace,
and it executes the lore law perfectly — the hook **points** at you and never answers (the thread
stays open for slot 14). The longer the fight runs, the more it points.
**Cost: +0 draws. Laws: none — it strengthens the "point, never answer" lore rule.**

### P3 — Bucket 1: worn heraldry that swings
- **Lance PENNON** — a duelist-knight carries heraldry. It also earns its draw twice over: cloth
  SNAPS when the lance moves (amplifying the point/salute telegraphs) and it gives the
  ≥2-frequency idle law a second frequency for free.
- A second cloak layer + a hood tail.
- **→ The tally-marks idea lands HERE, modified:** the tallies are carved/painted **DARK on the
  pennon** (and scratched into the lance haft), not glowing in the air — his kill count as
  heraldry. This solves the "no legal color" problem completely.
**Cost: +3 draws. Laws: none (dark relief on cloth, no emissive).**

### P4 — Bucket 4: beat-only Verdict props — THE AUDIT'S #1 FIX (the dread needs a visual)
During **"WEARS THE HORN — Voidmaw's Verdict"**:
- The charms physically **LIFT off the chain** (they already exist as draws — animating them is
  free) and flare sequentially in their owed palettes (a wave, not simultaneous).
- The **lance splits into horn-fragments** and reassembles as the card resolves.
- The **seal ring drawn as LineSegments** — overdraw-exempt. **Never an additive disc**: the
  additive cap (≤2 large volumes incl. the shield) must survive shield + card simultaneously.
- **APPROVED: the Voidmaw-only ghost** — a violet flicker of Voidmaw itself haunting the
  horn-lance during its own card. One palette (violet is already on screen from the trace),
  maximum lore coherence: *the horn remembers its owner.* Keep it dim, brief, and tied to the
  card window.
**Cost: ~+8 draws visible ONLY during the card. Laws: additive cap (seal = lines; ghost = thin/
dim, never a shell); the charm flares stay a sequential wave.**

### P5 — Bucket 3: motion trails for the agile hunter
Afterimages on the **cut-in near-pass** + a second lance trail. Free at rest; spectacle exactly
when he's being the hunter.
**Cost: +2–3 draws, beat-visible. Laws: afterimages must be thin / opacity-faded standard
material or rim-shaped — never large additive shells (the cap).**

### P6 — Cloak tearing progressively per phase
Damage-state storytelling with strips you already have; feeds the FLINCH/expression channels and
the phase-silhouette law.
**Cost: +0–1 draws. Laws: the degraded silhouette must still pass the duelist stranger test
(it will — tearing reads as damage, not a new noun).**

### P7 — Bucket 2, CAPPED: ambient life
- **ONE ember/ash drift as a single THREE.Points cloud** — 1 draw for all specks. **Never 12–18
  separate mote meshes** (that's where your draw budget would die).
- The **wisp on the empty hook** — 1 draw, emissive ≤0.25. A satellite, not a lamp. It pairs
  with P2: the wisp waits on the hook that's pointing at you.
**Cost: +2 draws. Laws: satellite dimness (≤0.25) — no new lamps; the cowl glint stays the one
focal.**

---

## REJECTED (cite these if the ideas resurface)
- **Air-scratched glowing tallies** — no legal color exists (amber/magenta/cyan/pink reserved;
  violet is Voidmaw's; anything bright fights the one-focal law). Moved to the pennon (P3).
- **All-boss ghost apparitions** — palette chaos during the busiest card (magenta bullets +
  violet trace + N owed palettes at once). Superseded by the Voidmaw-only ghost (owner decision).
- **Anything that adds bulk or a new lamp** — identity laws. His presence comes from P1–P5,
  never from mass.

---

## THE BUDGET MATH (hold yourself to this)
- **Worst frame** = Verdict active + trails: 46 + 3 (worn) + 2 (ambient) + 1 (cloak) + ~8 (card
  props) + 3 (trails) ≈ **63 of 70 draws** ✓
- **Idle frame** ≈ 52 of 70 ✓
- **Tris** ≈ 12.5–13k of 14,000 ✓ (relief pass P1 is most of it)
If your live starting numbers differ, re-derive this table and keep worst-frame ≤ 68.

## GUARDRAILS (restating — these are the ones this plan brushes against)
The one focal stays the **cowl glint**; every new emissive ≤0.25 except the lance-tip amber; the
seal ring + ghost are LineSegments/thin — **run G7 with the shield + Verdict + trails all firing
at once** (that's the frame your tri counter will happily wave through); q0.5 must drop the new
detail (`tris(q0.5) < tris(q1)` — pennon/relief/Points density are your lowQ dials); every new
independently-moving part gets a **named pivot** (the telegraph gate finds them by name); full
suite green (`tests/boss.mjs`, `bossboot`, `bulletcontrast`, `run-all`); `stamp-sw` in the same
commit.

## DONE-WHEN
Post **before/after crops + a Verdict clip + the cut-in pass** and STOP for the owner preview —
the two beats being judged are the Verdict (is it a clip-worthy moment now?) and the cut-in (does
the hunter read?). Then the LEAPFROG lesson (suggested: "KARNVOW spend pass: draws are a
creativity budget — the wins were things he WEARS, LEAVES, and SUMMONS IN BEATS; tallies became
heraldry because no legal color existed for glowing air").
