# Tempest I5 — the CHARGING-ladder test battery, and the two colour-space gotchas that make a "charcoal law" lie

**What happened.** Wrote the tempest 4-form assert block in `tests/starters.mjs` (the last increment) —
the machine-checked contract that locks the whole creature form-by-form: the CHARGING ladder accretes,
the body darkens into the charcoal lane, the accent stays the near-white lane, the storm garment reads,
the Surge never goes magenta, the strike schedule is deterministic. 399/0 green first run after two
colour-space fixes. Those two fixes are the reusable lesson.

**THE sRGB-vs-LINEAR TRAP — a "charcoal L ∈ [0.20,0.26]" assert reads ~0.04 if you let THREE compute
the lightness.** The charcoal law is authored in sRGB hex (`0x293040` → HSL-L ≈ 0.206). But
`new THREE.Color(hex).getHSL()` in r160 (ColorManagement on) **linearises on `setHex`**, so the same
colour reports L ≈ 0.037 — an order of magnitude under the band, and the assert would fail every form
while the dragon is visually perfect. The fix: compute HSL-L **straight from the raw hex bytes**
(`(max+min)/2` on `r,g,b / 255`) when the law is stated in sRGB. Reusable: **a colour law's numbers live
in a colour SPACE; assert in the space the law was written in. THREE's getHSL is linear-space — great
for lighting math, wrong for a hex-authored value/charcoal law.** (Hue survives the round-trip well
enough that `getHSL().h` is fine for the ~222° check; it's LIGHTNESS and SATURATION that move.)

**THE HSL-vs-HSV SATURATION TRAP — a pale near-white blue reports SATURATION 1.0 in HSL.** The accent
law wants "one true near-white" and "everything in the cool near-white lane," and the buildsheet
characterises `arcCore 0xf2f4ff` as "sat < 0.06." But HSL-saturation of a pale-but-pure blue is
**~1.0** (HSL sat is `(max−min)/(2−max−min)` near white → blows up), so an HSL-sat assert rejects the
exact near-whites it's meant to bless. The measure that matches the intent is **HSV/value saturation**
`(max−min)/max`: `f2f4ff` → 0.05 (the true near-white), `d9deff` → 0.15 (the tinted lane). Reusable:
**for "how white is this" use HSV-sat, not HSL-sat; HSL-sat treats a pale pure hue as fully saturated.**
The lane assert became "HSV-sat ≤ 0.16 for every accent, < 0.06 for at least one."

**BAKE THE DERIVED LADDER VALUES, ASSERT THE ACTUALS — not the aspirational sheet.** The buildsheet's
tri targets ({1.8k,2.7k,3.7k,4.9k}) and a couple of ladder values (`arcRun` starting at 0.25) were
pre-build guesses; the real build is {1534,1722,1896,2106} and `arcRun` starts at 0. The test asserts
the SHAPE the ladder must hold — monotonic, under-budget, the exact rungs that ARE load-bearing
(`arcDuty {.06,.10,.14,.18}`, `kinkKnuckles {1,2,3,3}`, `glowLevel→humFloor`) — not the aspirational
absolute numbers. Probe the real per-form values first, then assert what's true + what must stay true.
A test that codifies an aspirational number nobody hit is a red suite on arrival.

**The garment asserts that survive a re-plumb.** The I4 bloom-knee fix scaled the idle hum below the
literal `humFloor` (so `pin(0)` "within ±10% of humFloor" would now fail as written). The durable
assertion isn't the absolute idle value — it's the **relationships**: all three travel buckets present,
the dynamo (root bucket) ≤ 15% of the summed circuit hum (the anti-lantern lock), and the strike:idle
RATIO ∈ [2.2,4.0] per mat. Those hold regardless of the absolute-level tuning, which is exactly what a
lock-down test should pin — the invariant, not the current knob setting.

**What it unlocks.** The Thunderhead Tempest is complete: I1 body · I2 wing · I3 head+tail · the flap
animation · I4 the storm tick · I5 the ladder lock. `tests/starters.mjs` now fails loudly if any future
change breaks the accretion ladder, the charcoal lane, the near-white accent discipline, the garment
distribution, the fever firewall, or the strike determinism — 399/0 green, creaturestress within
budget, roster byte-identical. The reusable storm scheduler (`pulseTimer.js`, now with a boost-duty
`setDuty`) is ready for Tocsin. Open residual (owner-steered, a design call not a bug): a fuller aft
garment — more glowing circuit on the spine/tail so it's a full lightning suit, not a wing-front jacket
— which is a coverage/geometry addition, and pushing the strike a touch further on-wire in bloom.
