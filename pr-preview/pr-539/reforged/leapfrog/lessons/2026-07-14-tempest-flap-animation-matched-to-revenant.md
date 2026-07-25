# Tempest flap animation — "it flaps like one plank" was a WAVEFORM problem, not a rig problem

**What happened.** After the geometry cleared the owner's 4.2 bar, the owner's next note was pure
motion: *"look at Revenant's wing flap… it needs more of that flap where it comes from the shoulder and
goes up to about twelve o'clock and down to about five o'clock. But also the wing itself needs to be
more in motion — right now it just feels like one plank and it's flapping."* The fix was NOT new rig
code and NOT new geometry — the articulation was already there. It was the MOTION DIALS, which I had set
to a "heavy weather-front" waveform that suppressed the very motion the rig can produce.

**THE LOAD-BEARING LESSON — a `|sin|^glidePow` glide-hold waveform with a high exponent reads as a
STATIC PLANK, because it flattens the whole cycle toward zero deflection and only briefly spikes.** The
Tempest's flap shape is `shape(ph) = sign(sin ph) · |sin ph|^glidePow`. I had `glidePow: 1.9` (chosen as
a "heavy held beat, unique in the roster"). But `|sin|^1.9` is < `|sin|` everywhere except the two
instantaneous peaks, so for ~80% of the cycle the wing sits near flat glide and barely moves — then
snaps. Held glide + rare snap = "one plank being flapped." Revenant, the part the owner explicitly likes,
uses `glidePow: 1.15` — a near-sinusoid that beats CONTINUOUSLY through the arc. **The exponent is a
glide↔flap knob: high = holds the glide pose (looks static), low = actually beats. If the owner says
"it's not moving / it's a plank," the first suspect is a high glidePow, not the rig.** Lowering it to
1.2 was the single biggest fix.

**The ~12→5 o'clock arc is `rootAmp` (the swing) + `apexRoot` (the lift), not `flapAmp` alone.** The
shoulder swing amplitude is `rootAmp`; but a big down-swing alone drops to ~5 o'clock and recovers only
to level. To reach ~12 o'clock at the top of the stroke you need the opt-in `apexRoot` V-lift (peaks at
the up-extreme via `apexUp(ph)=max(0,−sin)^0.7`, ADDED to the flap). Tempest had NO `apexRoot` at all, so
its recovery never lifted — capping the arc. Matching Revenant's `rootAmp 0.72 → 0.80` + adding
`apexRoot 0.17` opened the full ~150° arc. Verified on `wingsymprobe tempest`: recovery tip Yband top
**+5.28** (≈12 o'clock), downstroke bottom **−4.41** (≈5–6 o'clock), byte-identical Δ0.000.

**"The wing itself in motion, not a plank" is the root→mid→tip LAG made visible — deepen the lags and
lift the distal amps so the forearm and hand visibly TRAIL and the wing curls/uncurls.** The rig already
splits the wing across three nested nodes (shoulder `pivot` → forearm `mid` → hand `tip`, hand welded at
the −anchor wrist so it folds without tearing), and on the Tempest the HAND carries ~76% of the wing
(wristT 0.24). So the articulation exists — a plank read means the distal segments were moving too little
and too in-phase. The old dials (`midAmp 0.14, tipAmp 0.08, midLag 0.45`) barely trailed. Deepening to
`midLag 0.70 / tipLag 1.15` and lifting `midAmp 0.17 / tipAmp 0.11` (slightly ABOVE Revenant's 0.14/0.09,
a deliberate "more in-wing motion than Revenant" per the owner's emphasis) makes a visible traveling
wave: shoulder leads down, forearm follows, the big hand whips through last. The probe shows it too — the
wing-center **x swings 1.20 (hand folded in, recovery) → 2.68 (hand extended out, apex)**: a rigid plank
would hold constant span; a swing that large IS the wrist folding. Motion in the distal amps + deep lags,
not per-strut shivers (which would tear the welded membrane — the C14 law still holds).

**Process gotcha banked — the render harness (`flapstrip.mjs`) boots a FRESH browser per phase (5 boots)
and this env crashes the browser on ~the 3rd boot / each boot is ~180s I/O-bound; DON'T fan out parallel
render jobs — they starve each other's I/O and every boot times out.** I lost time launching several
flapstrip jobs concurrently; they multiplied browser+node processes, drove boots past their timeouts, and
crashed. The deterministic `wingsymprobe` (pure geometry, no browser) is the reliable source of truth for
the ARC and the FOLD; per-phase stills are for the eye and the owner's live-preview judgment. When the
5-boot montage won't complete, capture the extremes one boot per node process (`_onephase.mjs`) with
everything else dead — one browser at a time.

**What it unlocks.** The Tempest now beats with Revenant's decent flap: a continuous shoulder-led ~12→5
o'clock arc with the forearm and hand trailing so the wing curls through the stroke instead of holding a
glide and snapping. Byte-identical roster, all suites green (tricount 1534 hatchling, wingflap 6/6,
flapcheck 16/16), Δ0.000 symmetric. The owner judges final feel on the live preview. Remaining: I4 (the
storm strike / Surge tick) + I5 (the CHARGING ladder asserts + tests/starters.mjs) — systems, not motion.
