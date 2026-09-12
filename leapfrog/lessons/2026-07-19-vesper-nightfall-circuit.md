# Vesper NIGHTFALL CIRCUIT — revising a shipped law with a plan-first harsh audit (PASS 4.4/5)

**What we did.** The owner (colorblind, rear-chase, flies Vesper) reported the sustained Surge
read only on the environment. The blocker was Vesper's own gated law — `feverWing: 0x000000`,
"the wing stays black so the scallop owns the frame." At the owner's explicit request we revised
that law: the Starlit Seam now CLIMBS the wing skeleton on Surge. Plan → harsh pre-build audit
(BUILD-WITH-CORRECTIONS) → one-pass build → material probe 9/9 → checkpoint critic PASS 4.4/5
("the surge now lives on the dragon, in the wings' area, as anatomy, without dethroning the
seam or leaking into cruise").

## The lessons

1. **Audit the PLAN, not just the build — ~40% of my code claims were stale.** The audit
   (given the actual source files) caught before any code: the finger ridges shared
   `M.dorsalFacet` with half the body (no separable mats existed); the membrane under-glow I
   was "proposing" already shipped (`M.memGlow`) but rode `wingSpineMats` with spine-index
   timing + the tail-crack boost (wrong station); my drive formula would have broken the
   damage-gutter AND bypassed the boss-ultimate duck; and the knife-edge carries a recorded
   owner directive against edge glow in a code comment. A plan audited against the real files
   builds in one pass — this one did, probe green first run.

2. **`× min(casLevel[station], 1)` is the one-term inheritance trick.** Any custom per-mat
   drive that multiplies the station's live level inherits the ENTIRE gated grammar — ultimate
   duck, gutter, decay rewind, sustain breathe, flare ripples — for free. A raw
   `_sstep(...)·dcOnly` formula silently loses all of them (the audit's #1 code finding).

3. **Revising a shipped law needs the law's own vocabulary.** The wings light up, but every
   choice honors the original intent: components not surfaces (bones + underside; membrane
   face and knife-edge stay dark), the seam keeps PEAK (critic measured seam ~1.8–2× wing peak;
   wings get AREA ~1.5–2×), cruise-black preserved (armed median L27–29, no perceptible leak),
   taper + stagger so five strips never read as a picket fence. "Owner wants wings to glow"
   ≠ "make wings glow" — it's "extend the identity system to the wings."

4. **Per-finger stagger arithmetic:** 0.030s·rank delays (aft first, dominant last) with 0.08s
   ramps fills the 120ms wing window and lands the last ramp exactly at the tail beat — travel
   continuity AND station discreteness. 0.10s·rank (my draft) would have spilled past the tail
   crack into the rim seal.

5. **Shared-mat re-staging trap:** the wing-root spark uses the SAME material instance as the
   dorsal seam — re-staging its list registration (as the audit suggested) would have re-timed
   the whole seam. Check instance identity before moving a mat between drive lists.

6. **Region pixel metrics drown near a compressed horizon** — the wing-band "mid-band"
   count was 16k before the circuit even fired (background). Material-level probes
   (introspection seam → emissiveIntensity/hue/order asserts) are the reliable machine gate;
   frames are the visual gate; region counts only work on regions the world can't reach.

## Owner dials (from the critic)

Sustain wing brightness (+30–40L headroom before the seam crown erodes) · apex-sweep if the
raised pose reads "planky" in motion (depth-projection, not lighting) · tail-crack orb
radius/exposure at rear-chase.

## What it unlocks

The circuit pattern (per-part mats + userData delay/weight + one-term station drive +
ladder dial + probe introspection) is the template for per-dragon Surge accents across the
roster — the I5 §K pass can now be specced per dragon as data, not new systems.
