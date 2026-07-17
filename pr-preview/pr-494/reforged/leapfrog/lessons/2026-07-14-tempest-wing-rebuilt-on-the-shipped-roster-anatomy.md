# Tempest wing — when the owner says "embarrassing," transplant the SHIPPED ROSTER's anatomy

**What happened.** My I2 STORMFORK wing PASSED its own Fable gate — and the owner still rejected it:
*"not premium/rich enough, wings too small, embarrassing. Look at Revenant/Vesper. Rebuild yours to
match Revenant's bat anatomy — just different knuckles + your own storm struts. Also drop the legs,
no dragon has arms/legs."* He was right on every count. Two hard numbers diagnosed the whole thing:
my `halfSpan = spanScale · 2.3` vs Revenant's `· 4.1` — **I was flying a wing 56% of the shipped
premium size.** And my membrane was a chopped fan of floating dark bays around thin bright threads,
where Revenant's is ONE continuous welded sheet. Next to the roster, mine read as a lightning decal
with holes; Revenant reads as an anatomy.

**THE LOAD-BEARING LESSON — "passes my gate" is not the bar; the SHIPPED ROSTER is the bar, and the
fastest way to premium is to transplant a proven anatomy, not to iterate a novel one.** I had spent
two gate rounds polishing a bespoke bolt-frame wing to *my* critic's satisfaction. The owner compared
it to Revenant/Vesper and it lost instantly. The fix was not "more of my thing" — it was to adopt
Revenant's `buildOnePhalanxWing` STRUCTURE wholesale (short arm → medial wrist → N long finger-struts
fanning aft on its FAN/DROOP tables + every tip drooping into a ventral cup → a welded continuous
membrane) at Revenant's SPAN, and transplant only the Tempest's identity onto it. When the owner names
a shipped part as the bar, port its numbers (span constant, FAN/DROOP tables, weld method) — don't
re-derive an equivalent from scratch and hope.

**Identity is a TRANSPLANT onto proven anatomy, not a from-scratch skeleton (the owner's exact recipe:
"same shape, different knuckles, your own struts").** The storm identity — kinked glowing bolt-struts
(two straight segments through a hard knuckle + Y-jog, NOT Revenant's smooth bézier spar), near-white
lit caps proud of the membrane, outer struts forking near the tip — rode ON TOP of Revenant's fan
positions. Same anatomy, different bone. This is the reskin-with-soul pattern: keep the shipped
skeleton's proportions/weld/motion, swap the surface language.

**Anti-reskin separation is carried by the LIGHT FAMILY + material topology, not by a different
skeleton.** The wing is now literally Revenant's skeleton — and it does NOT read as a Revenant,
because: Revenant struts are matte IVORY diffuse BONE (emissive black — the wing never glows) framed
by an exposed ribcage + GREEN grave-glow; Tempest struts are near-white EMISSIVE lightning framed by a
charcoal CLOUD membrane, no bone, no green, no ribcage. Same dark-membrane strategy, opposite light
topology. Two dragons can share a wing skeleton and never collide if their light families are disjoint.

**The single biggest richness jump: a WELDED continuous membrane beats chopped floating bays, every
time.** Revenant lofts the skin onto the finger SPAR SAMPLES (every membrane edge IS a bone node), so
it's one unbroken sheet from body to fingertip and CANNOT float off (the C14 weld). My old per-pair
cupped bays referenced tip points and were cut independently → dark shards with gaps between thin
bolts = "sparse / cheap." Sampling each (kinked) strut into a 5-point polyline and lofting
`chiropatagium + propatagium + brachial` onto those samples was the move that turned "shards" into
"anatomy." The brachial sweep to a body anchor beside the shoulder (arm-side points only, so it never
tears at the fold) is what stops a big wing from looking bolted-on/floating.

**Legs: no dragon in the roster has arms/legs — game-fit outranks the reference.** The owner's own
reference image showed a quadruped, and I had faithfully built four carved drake legs. The owner cut
them: the whole roster is legless (wyvern-drakes), and roster consistency outranks the reference on
this axis. The owner-reference-wins law has a sibling: the owner-outranks-the-reference law, because
the owner is the authority the reference only *serves*.

**Process — the owner-invoked Fable loop (diagnose against the roster, then gate against the plan).**
The owner said "summon a fable agent to assess this." Pointing a high-effort Fable at the SHIPPED
ROSTER's best (Revenant + Vesper wing CODE and renders) + the owner reference + my rejected wing
produced a numbered, buildable plan — the exact span constant, the FAN/DROOP tables to copy, the weld
method, a ranked list of the missing richness ranks — with the "you are 56% of Revenant's span" number
that diagnosed the whole rejection. Then the SAME agent gated the rebuild against its own plan (I, the
builder, never judge): PASS, 6 nameable ranks, 3 carved recesses, span parity, separation held, + 3
non-blocking polish notes. Two of the notes were cheap and I applied them before the owner's side-angle
look: (#1 side-profile flat-sail → deepen the per-bay ventral-sag DIFFERENTIAL so aft bays sag deeper
and the side silhouette scallops between fingers, not one slab; #2 near-white over-winning in daylight
→ narrow the glow-cap width + dim the knife-edge so the dark cloud stays dominant in lit conditions,
which the dark-sky view already nailed).

**A gotcha banked: crackle-churn blade pivots TEAR a welded membrane.** My old wing had per-strut
blade pivots (the rig's lag walker shivers them). With the new welded membrane, a strut that rotates
under its own pivot separates from the membrane welded to its rest position → a visible tear at big
span. I dropped the blade pivots (the whole hand still folds at the wrist for the flap); a tear-free
churn (move the membrane WITH the strut, or sway the whole hand) is an I4 concern. Motion niceties do
not get to break the silhouette.

**What it unlocks.** The wing is now the big, premium, richly-welded lightning bat-wing the owner
wanted — Revenant's craft bar, uniquely Tempest by light. Apex 1568 tris (dropping the legs paid for
the bigger wing; well under 6000), roster byte-identical, suites green. Next: I3 (stormbrowHead — kills
the stub warm-tan head-top band — + virgaTail), then I4 the storm tick (breathing + strikes + Surge,
and the tear-free churn), then I5 the ladder + tests/starters.mjs. The reusable bar for every future
premium part: measure it against the SHIPPED ROSTER's best in the same view, not against a gate rubric.
