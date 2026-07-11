# Spending tri HEADROOM on spectacle: amplify the existing landmarks, don't add new ones

**What we did.** Solar's apex used only ~2.2k of a 6000/form budget. The owner wanted the ~3.8k
headroom spent to make it "truly amazing to grind for." A high-effort Fable synthesis produced a spend
plan; we built the recommended line: apex 2184 → 3285 tris ("CP3, the Coronation Spend").

**The reusable idea: the best spectacle spend makes the EXISTING signature landmarks LITERAL, it does
not bolt on new ones.** Fable's assessment nailed it — Solar's three identity landmarks (the corona,
the twin spires, the wing wall) were all built at SYMBOL scale: the wing wall was 70% of the frame but
~2% of the tri budget; the corona was a ~120-tri "bangle"; the spires were plain cones. The spend
turned each into architecture — the corona became a cathedral ROSE WINDOW (tracery ring + mullions +
compass gems + eclipse streamer rays), the lances became stepped VOTIVE SPIRES (plinth/collars/
crockets), and the wing gained FLYING BUTTRESSES + boss keystones. Nothing new was invented; the words
already in the dragon's name ("eclipse", "cathedral") just got spent on. Result reads as *more Solar*,
never a different dragon — which is the whole bar for amplifying a loved, shipped design.

**Protect the silhouette contract while spending inside it.** The corona scaled up but was CAPPED below
the spire tips, and its 8 streamer rays deliberately SKIP 12 o'clock so the loved M skyline
(spire–head–spire) is untouched. The spires gained interior detail (collars/crockets) at the SAME
height/rake/outline. The acceptance test was a pure rear-silhouette DIFF against the pre-spend capture:
the M outline had to survive. It did. "Amplify, don't redesign" is enforceable as a sil-rear diff.

**Headroom is not a target — spectacle SATURATES.** Fable's honest director's note: a doctrine-legal
spend saturates around +2,500–3,000 tris; past that you buy surface SMOOTHNESS (low wow) or trip the
sub-8px-at-250px density law (negative wow). So we stopped in the wow sweet-spot (~3.3k) and
consciously OMITTED the +500-tri 3×3 vault camber quilt (low wow-per-tri, moiré risk) even though the
budget had room. More tris ≠ more grind-worthy. Rank spends by wow-per-tri and cut at saturation, not
at the ceiling.

**Cheap motion is disproportionate wow.** The single highest-wow-per-effort item was one line: rotate
the corona ring slowly in its own plane each frame (`coronaSpin.rotateZ(dt*0.15)`, cached via a NAMED
group `getObjectByName('eclipseCorona')`) — the eclipse *crawls*. Zero tris, zero new transparent
drawables. And the scepter orbit-shards were free by publishing them through the engine's existing
`tailOrbiters` contract (which positions each mesh relative to its PARENT origin — so the shards had to
be parented to a group AT the orbit centre, not the tail segment). Reuse the engine's animation hooks
before writing new ticks.

**Doctrine gotchas re-confirmed:** streamer rays kept FEW + LARGE (≥0.45u base ≈ 12px at chase) to pass
the density law; the spine gems were UPSCALED specifically to clear the sub-8px floor they'd been
violating; ≤1 near-white unchanged; the corona rim mats stay OUT of `spineMats`. The build gated every
spend up the ladder (spireTier/coronaGrand/buttress/cuirassPlate/pauldrons/rearCirclet/orderStar/
scepterOrb) so the apex visibly EARNS the cathedral the lower forms lack.

**What it unlocks.** A repeatable "spectacle headroom" pass for any shipped premium: assess which
signature landmarks are built at symbol-scale, make them literal/monument-scale, cap the spend at wow
saturation, protect the silhouette via a sil-rear diff, and buy cheap motion off existing hooks.
