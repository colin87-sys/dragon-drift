# 2026-07-25 — The anatomy reference: buying structure instead of vibes

**Did / learned.** Ran a Fable art director over a new creature (the fire wyvern **Fornax**,
key `fornax`) with one twist: instead of letting the director design from taste, it wrote six
research briefs and six Opus agents went and answered them — canon/heraldry, body-plan
proportion, wing construction + flap mechanics, head/horn/eye, hot-material appearance physics,
and stylization craft. ~300KB of tagged notes came back and were distilled into
[`reforged/DRAGON-ANATOMY-REFERENCE.md`](../../reforged/DRAGON-ANATOMY-REFERENCE.md) (creature-
agnostic ranges) plus [`reforged/FIRE-WYVERN-BUILDSHEET.md`](../../reforged/FIRE-WYVERN-BUILDSHEET.md)
(this creature's decisions, each citing `ref §N`).

**The gotcha: the research contradicted the director, and that was the payoff.** Five locked
directions died on evidence. The spade tail is not period at all (Fox-Davies 1909: the barb is
"a comparatively recent addition") → deleted, silhouette duty moved to a dorsal ridge. The
"banked-ember keel" implied a deep blade, but flight muscle is 20–25% of body mass and real
soarers have *shallow* keels → demoted to a muscle wrap. Raptors do **not** tuck in cruise (only
perching birds flex) → hind legs went bat-abducted, which is also the only pose that puts
geometry in the wing–tail wedge the chase cam sees. Real span:torso is 13–15:1, not the 5–6:1
dragon art assumes — an honest 10 m flyer has a 70 cm torso and cannot be sat on → the
rideability cheat is now *declared* (5.0–6.5:1) instead of accidental. And the house habit of
enlarging eyes is backwards: orbit Ø ≈ 0.20 × skull length and *negatively* allometric — the
glare belongs in brow bone, not eyeball. **A director that only self-reviews would have shipped
all five.**

**→ Systematize.** The reference's value is its DISCIPLINE, not its word count. Every figure
carries `[S]` sourced / `[D]` derived / `unknown` / `[no-assert]`; gaps stay visible instead of
being quietly filled; disputes carry both numbers and the spread, never a silent average. The
agents policed their own sources — one caught a condor wing-loading figure circulating online
that is wrong by ~100×, another refused to source the "70/25/5" form budget or attribute
"straights against curves" to Preston Blair. Those refusals are preserved in the file as
features. This generalizes: **a research pass whose output cannot say "unknown" is a generator
of confident nonsense.** Two rules fell out that are pixel-assertable rather than tasteful —
`R ≥ G ≥ B` strictly with the read flipping to sci-fi at `B > G` (no blackbody 1000–6500 K has
B > G), and "never author a white core" (white is exposure clipping; 1300 °C is still `#ff7000`).
Equal-pitch ranks got promoted from a taste ban to an observed law: no natural display crest is
equal-pitched, and the one comb-like system is asymmetric 7-vs-8.

**→ Leapfrog.** Every future creature — serpent, leviathan, raptor-drake — now starts from
ranges instead of from vibes, and `§4.4`/`§5.5` map anatomy onto the real repo dials
(`wingArchY`, `wristT`, `lenFrac`, `cup`, `glidePow`, `rootAmp`, `midLag`/`tipLag`) so a
buildsheet converts a range into a number without re-reading anything. The buildsheet's
`value (ref §N range, ×K exaggeration)` form means the next session audits the *taste* rather
than re-deriving the biology. Two process notes worth carrying: the director model's safeguards
repeatedly killed long comparative-anatomy prompts, so the direction had to be staged in small
design-vocabulary chunks and the raw corpus kept out of its context; and the plan is gated by an
INDEPENDENT auditor that reads the shared rig and looks at a real chase-cam capture, because a
plan that reads beautifully and cannot be built is still a defect.
