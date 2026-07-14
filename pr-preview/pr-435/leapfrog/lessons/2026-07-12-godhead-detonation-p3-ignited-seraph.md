# THE GODHEAD DETONATION — P3: the ignited seraph (wreathed, not washed — the rim-material trap)

**What we did.** Added `setArenaIgnite(k)` — the heaven-side sibling of `setArenaVoid` (`bossUnmasked.js`
+ `boss.js` drive + `main.js` seam). The seraph catches fire from its own verdict across the SETTLED
heaven (mix 1.45→2): an incandescent-ember rim, a partial ladder lift toward an ember violet-bronze
body, and a roiling gold-violet AURA MANDORLA (`igniteGlow` — a shader disc, white-gold core → gold-rose
→ S2 violet, scrolling outward so it's alive per owner §1.3). Focal retune HALO_LIFT .6→.75 / BURST_LIFT
.9→1.0 so the star-eye crown outshines the new wreath (dark-gap law). `igniteK 0 ⇒ byte-identical`.

**Mutual exclusivity BY WINDOW CONSTRUCTION.** voidK and igniteK must never coexist (owner §3d.6). The
clean way isn't a runtime guard — it's disjoint drive windows: `voidK` exhales to 0 by mix 1.45
(`×(1 − ss01((mix−1)/0.45))`), `igniteK = ss01((mix−1.45)/0.55)` rises only from 1.45. They're
provably disjoint; the tickBody branch orders `if (voidK>0) … else if (igniteK>0) …` as a belt, and a
unified `else if (voidGlow.visible || igniteGlow.visible)` restore heals both. The heaven-only rise
also means the boss is the shipped dark-on-gold silhouette through the gold flood (which already
reads), THEN wreathes as it settles — no legibility gap.

**THE HEADLINE TRAP — "rim" materials are not edges; recolouring them bright gold WASHES the boss.**
The first build lerped `rimMat`/`rimMatB` to bright gold `0xffdf9a` (mirroring the void's violet-silver
rim). The result: the ENTIRE outer wing fan turned gold — a "washed" balloon, the dark silhouette gone,
and sky p50 spiked 0.412→**0.532** (a hair under the 0.55 gate — a guaranteed flake). Why: `rimMat`/
`rimMatB` are LARGE feather-RANK materials (the primary/secondary fan fingers), not thin leading edges.
There is no per-edge material to recolour. **The reference's "burning edges" are BACKLIGHT, not a front
recolour** — the boss body reads DARK against the glow, the aura does the rimming. Fix: keep the feather
diffuse DARK-warm (bronze `0x8a6a48`/`0x6a5238`, value near the shipped cool steel so it stays DARKER
than the gold sky), a MODEST warm-gold emissive ember `0x6e4c22` (a hint, not a sticker), and let the
MANDORLA + the detonation blast behind carry the incandescence. That recovered sky p50 to **0.425** and
restored the silhouette + the six wingEyes. **The line between wreathed and washed is a VALUE line: the
body must stay darker than the brightest thing behind it, so identity-hue lifts must not raise its
luminance to the sky's — put the fire in emissive accents + backglow, never the diffuse (boss law §3).**

**The gotcha — the ignite aura must live on LAYER 1 (unlike voidGlow).** `voidGlow` is layer-0 and fine
because it only runs in the VOID, where god-rays are SUPPRESSED. `igniteGlow` runs in the HEAVEN where
the god-ray swell is the #1 holy carrier — a layer-0 additive disc would be painted black in the
occlusion pass and punch a hole in the rays exactly at the boss. `igniteGlow.layers.set(1)` (the
detonation-set / arena-furniture convention) keeps it out of the mask + the water mirror.

**Verify.** `unmaskedarena` 54 (was 50 + ignite-engages / void-side-off / mutual-exclusivity / S2-pin-
off): corridor p90 0.318 / p50 0.124, sky p95 0.847 / p50 **0.425**, loop 92.9% + uTime advancing — all
under gate. `boss` 126 (18 unmasked draws unchanged — the aura is hidden off-heaven, +0 draws at rest;
one NARROW-family flake on the first run, green on re-run — the embertide expression tick-settle is
timing-jittery, unrelated). `unmaskedorgans` green (the aura is a visual disc on `rig`, not an organ
anchor — wing angles frozen, wingEyes can't move). Owner preview: a dark seraph warm-lit + aura-wreathed
at the heart of the gold→violet blast, silhouette + eyes intact.

**What it unlocks.** The apotheosis's three carriers are live — blast (P2) + palette (P1) + ignited
boss (P3). P4 (the debris conveyor) and P5 (the wingtip wisps) are safe accretions on the same
window×fade spine. The taste risk (how radiant) is now the owner's dial: RIM_IGNITE / RIM_EM_IGNITE /
IGNITE_GLOW_MAX are one-line levers if they want more or less fire — the fairness floor holds either way.
