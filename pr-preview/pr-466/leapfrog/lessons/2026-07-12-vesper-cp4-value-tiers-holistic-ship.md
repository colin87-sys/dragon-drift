# Vesper CP4 — the 4th readable value tier + the ship gate (owner 1.5 → holistic 4.5, DONE)

**What we did.** Closed the rework: widened the membrane value gradient so all FOUR tiers read,
encoded the new motion-language ladder as machine asserts, ran the final whole-creature Fable gate —
**PASS 4.5/5, "the 1.5/5 creature no longer exists, ship it."** Per-checkpoint gates were
CP1 4.3 · CP2 (pass) · CP3 4.6 · CP4 4.5.

**Lesson 1 — "lacks richness" was a lerp-TARGET bug, not a tier-COUNT bug.** The membrane already had
four value tiers, but they lerped `wingOuter → SLATE` and SLATE (`0x141b28`) sits barely above NIGHT,
so all four compressed into ~0.04–0.06 luminance and only three read (the CP1-banked ceiling). The fix
was one line: lerp toward a **lit steel-slate** (`MEMBLUE 0x2c384a`) over a wider `f` range
`[0.60,0.40,0.22,0.06]`, so the four values step **0.05 → 0.14** — a real inboard-lit → outboard-near-
black gradient. **When a value ramp reads flat, check the ENDPOINTS before adding steps: N tiers packed
into a 0.02 luminance band is one grey; the same N across 0.10 is "rich."** The body stays 0.04 (still
the darkest object) so the inverted-value identity law holds — verify that assert survives any palette
lift.

**Lesson 2 — a dark-identity dragon needs a LIGHT-BACKDROP read before you judge its value ladder.**
On the raw dark studio backdrop only ~2 tiers read; on the warm-backlit gameplay montage (and a 4.5×
exposure lift) all four separate. A matte-black creature scored off a dark thumbnail fails a test the
game never runs. **Judge dark dragons on the brightest biome they'll appear in, and on the tier/shop
card — that card is the one place "flat black" can still whisper.** (Dark-on-dark shop legibility stays
an owner-preview call, per the buildsheet's open questions.)

**Lesson 3 — the ladder re-grade means asserting the NEW verbs, not just tris.** `starters.mjs` now
checks the motion-language ladder monotonic alongside tris + inverted value: finger-bones `2<3<4<5`,
wrist-fold depth `tipAmp 0<0.3<0.46<0.55`, glide-hold `glidePow 0.9<1.2<1.7<2.2`. **Whatever a redesign
makes the growth VERB (here: knapping + folding + a maturing beat), encode it as a monotonic assert so a
future edit can't silently flatten the rung-to-rung earn.**

**Lesson 4 — the synthesis gate finds what per-checkpoint gates structurally can't.** The holistic
Fable pass, verifying against the whole roster, surfaced three things no single-checkpoint gate looked
for: (1) **tri-density** — Vesper Eternal is 701 tris vs Solar 3317 / Phoenix 3414 and the sheet's own
~4.6k target; it doesn't read sparse at gameplay distance (silhouette-first + a weak-mobile gift) but
it's the one axis where "a rung below" is objectively defensible → **[backlog]** a chest/haunch knap-
plate rank (huge headroom under the 6000 ceiling). (2) A **`setHex(undefined)` NaN-coercion** — the def
had no `wingEmissive`, so the rig coerced undefined→black by luck; now explicit `wingEmissive: 0x000000`.
(3) The **wing-fade contract reaches only the inboard tier** (the rig drives one `wingMat`); documented
deliberate — the outer tiers are near-black silhouette so their fixed opacity is invisible. **A gate
that benchmarks against the ROSTER, not the spec, is the one that catches "leaner than its peers."**

**Lesson 5 — THE RULE is per checkpoint, and the gate enforces it.** The holistic gate flagged that CP2
had shipped with no ledger file. Backfilled. **If a checkpoint changed the creature, it owes a lesson —
a synthesis reviewer will (correctly) treat a missing one as a process defect.**

**What it unlocks.** A shipped, distinct, premium matte-black night drake that killed every one of the
owner's four rejections — plane-wing (fingered bat wing), flat-black (4-value membrane), stiff (wrist-
fold + jointed tail), no-grind-appeal (the withheld-seam Surge is the money shot). Reusable carry-
forwards: the **lerp-endpoint** diagnosis for flat value ramps, the **light-backdrop rule** for dark
identities, **assert-the-growth-verb** ladders, and the **roster-benchmark synthesis gate**. Standing
backlog for a future pass: apex facet density, a split-fan flare (steal Jade `lobeFlare`), and the
dark-on-dark shop-card legibility owner-call.
