# Drowned Forum PR-4 — the `pinisle` stone-pine Lorrain side-frame (Fable 3.4 → 4.4 PASS), and the DARK-MASS-under-a-BRIGHT-KEY value law

**What we did.** Built the Forum's ONE vegetal element + compositional frame — a near-black **umbrella pine +
cypress** islet, the Claude-Lorrain dark side-tree that brackets the gold sun-path. One archetype appended at the
END of `ARCHETYPES` behind `biomes: forumV1` (determinism byte-identical). Added a new `bakePine` + `pine` bake
tag. 117 tris, ONE material group, NO glow. Fable pre-assessed; one build round, one value fix → 4.4 PASS.

**The name-test is a RATIO, not a shape.** An Italian stone pine reads as **a thin FLAT parasol slab floating on
≥60% BARE trunk**, with a ground-rooted cypress spike ~10% taller beside it. Build to the ratio: crown depth ≤
20% of tree height, crown width ≈ 4× crown depth, trunk below it NAKED. Kill on sight — **broccoli** (domed/tall
pads: keep the ~10% apex rise and no more), **lollipop** (crown creeping down the trunk — the bare-trunk gap IS
the prop), **Christmas-tree** (base-wide cypress — widest at ⅓ height, tapering BOTH ways = flame not cone).
Parasol pads = SQUASHED CLOSED `ConeGeometry(r, ~0.05, 6)` (the rb3 closed-cone law, no circle-sandwich slit);
the **one-crown law**: all pads above y0.70, stagger Δy≈0.07, overlap ≥40%, counter-tilts → ONE ragged umbrella
slab, never a shish-kebab of discs. Fork limbs (frusta from the trunk to the pad undersides) turn
"lollipop-on-a-stick" into "umbrella held up on branches." Couple **h ≈ 1.25·r** in `place()` — this prop's
identity is pure aspect ratio, so protect it from independent r/h draws (the aqueduct a1 law, restated).

**THE BIG LAW — a DARK-MASS repoussoir under a BRIGHT KEY needs a PRE-DARKENED bake with a WIDENED zone spread,
not just spec-dark values.** The pinisle's whole job is to be the DARKEST thing in frame so the gold sun-path
reads expensive by contrast (the Lorrain repoussoir — it prices the gold the way drumfall prices the gilt). But
it shares `forumStone`, whose **bright warm sunset key diffuse + emissive fold LIFTS any near-band prop**: at the
spec albedo (0x2A3524 body) the trees rendered **26–55% luminance = mid-gray-green**, no dark mass, gold
un-priced (Fable 3.4). Two-part fix:
1. **Pre-darken the bake to ~⅓–½ the spec albedo** — the diffuse response is `albedo × key`, so the only lever on
   a shared bright-key material is a much darker albedo. Landed the tree mass at **0.9–11%** vs a 73% sky (7:1).
2. **WIDEN the 3-zone spread to ~3.6:1 lit/under (not the 2.2:1 spec)** — because darkening ALONE crushes to
   flat-black poverty (the vinyl-sticker failure). The widened spread is what lets near-black KEEP ITS FORM: pad
   tops/edges catch the low backlight at 9–11% over 1–3% cores, the trunk's lit side holds ~17% warm brown, so
   the sunset still articulates the mass. **Darken AND widen — one without the other fails.** Reusable for any
   dark-mass repoussoir under `forumStone`'s bright key (future statues in shadow, dark foils).

**One material group, self-suppressing emissive.** `forumStone`'s `ladderEmissive` folds vColor INTO emissive
(`totalEmissiveRadiance *= vColor`), so a near-black pine bake automatically suppresses the warm fill — the pine
+ wood-bark trunk + tide-laddered rubble all live in ONE `forumStone` group (`bake:'pine'` / `'wood'` / `'forum'`
subsets of `mergeLagoonParts`), ZERO glow, no material change. The cypress uses the SAME `bake:'pine'` so it
darkens with the pines (it had read as a bright-green outlier at spec values — same fix folded it in).

**Placement — the Lorrain bracket.** step 31, comp floor 0.12 (punctuation, near-absent in the breaths), MID band
(`x = side·(17+0.9·r+…)`, inner ≈ 19–20, clear of the ±16 gate veil), crown reads OVER the near-rail + far UNDER
the aqueduct. rotY side-based so the pine sits INBOARD and its parasol overhangs toward the gold (brackets the
sky corner; the cypress echoes the colonnade verticals). Foam: a SMALL collar `{ r: 0.4 }` hugging the rubble
foot ONLY (mangrovehold jade-anklet precedent) — a near-black tree doubled in the mirror with one bright
waterline thread is the most Lorrain image in the biome. Aerial perspective falls out for free: near instance =
dark mass, far instance lifts under fog (a Lorrain signature the darkening didn't break).

**What it unlocks.** The forum foliage kit (`bakePine` + squashed-closed parasol pads + cypress flame + the
darken-and-widen repoussoir law) is proven. **PR-4 is COMPLETE** (aqueduct far-massif + pinisle side-frame, both
gated). Next: the first full money-shot processional capture (near-rail flank → pine punctuation → gold sun-path
center → aqueduct into fog), then PR-5+ on owner direction.

**Verify:** `HERO=pinisle node tools/_forumclose.mjs <tag>` (in-context backlit); envcount 117 tris,
gold-determinism / biomecycle green (a new END-appended archetype + a new bake tag are render-only for
determinism).
