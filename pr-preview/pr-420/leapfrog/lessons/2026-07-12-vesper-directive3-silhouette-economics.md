# Vesper Directive-Pass 3 — silhouette economics for a matte-black drake (owner 7-8 → gate 4.0)

**Context.** After the "Finished Blade" pass, the owner gave four directives — kill the tail streamers,
move the wrist MORE medial (keep the wingspan, just longer fingers), and proceed with the three top-tier
moves (apex mass, tail declutter, dark-shop rim). A Fable director planned it CP1-7; a harsh Fable gate
scored the result **4.0/5, "a clear step up, shippable"** with one blocking one-line bug.

**Lesson 1 — a matte-black silhouette dragon does NOT monetize tris the way a lit dragon does.** The
whole instinct "apex is only 950/6000, spend toward Solar's 3,317" was WRONG for this creature. The gate
was blunt: "extra plates on a black cutout buy nothing on a dark card." At gameplay distance the dragon is
small + backlit → only the SILHOUETTE, size, and Surge-glow read; surface plates/coverts are invisible.
So spend the budget on things that break the OUTLINE — **legs, a crown, a bigger tail** — not surface
density. Leanness stopped being the top gap the moment the silhouette started doing the work. (The knapped
plate field, ~18 tris, still earns its place in the close/shop view — but it is not where "grind-worthy"
is won.) The real remaining gap is **legibility economics**: the crown's front-read, the leg posture, and
the first two shop rungs — not mass.

**Lesson 2 — moving the wrist inboard GROWS the wing; span is pinned by the tip, not the wrist.** The
owner's "more medial wrist BUT don't lose wingspan" reads like a conflict; it isn't. With the leading edge
`LE(t)=[t·halfSpan, …]` and the wingtip fixed at `F0 = LE(1)`, span is `halfSpan` regardless of the carpal
fraction `wristT`. Pulling `wristT` 0.28→0.21 leaves the tip where it is and makes the finger fan radius
`r0=|F0−K|` GROW (+7%), so every finger and bay scales up (+13% planform) — the wing gets bigger and more
finger-dominant at once. The only hazard is the innermost aft finger sweeping into the hip; retune
`spanAft`↓ + mid-boost `lenFrac` to throw the extra reach OUTWARD/aft, not inboard (hand-verify the
innermost tip clears `attach.halfWidthAt(z)`). **When an owner says "keep the silhouette envelope but change
the internal proportion," check what pins the envelope — here the tip vertex — and move everything else
freely.**

**Lesson 3 — the night-drake KICKER: you photograph a black identity by OUTLINE, never by greying it.**
A 0.03-albedo hull returns ~nothing from a normal 0.9 rim, so it's unphotographable on a dark shop/tier
card — but lifting the body value would break the "apex is the darkest object" law. The fix is a harness
rig, gated on `luminance(def.body) < 0.05`: boost the cool rim + add a SECOND wing-edge kicker (one rim
leaves the far wing black) + a faint ion floor bounce (brand-coherent), while the KEY stays warm and the
hull stays a black cutout. Non-dark dragons are byte-identical (gate proof: diff a bright dragon). This is
reusable for every future dark dragon and lives in `tiershots.html` / `headshot.html` / `dragonstudio.html`.

**Lesson 4 — a per-SIDE `flatTriMesh(..., side<0 ? A : B)` is an undocumented asymmetry.** Wing geometry is
mirror-safe because the L wing is a `scale.x=-1` wrapper (identical materials). But body-frame pieces built
in a `for (side of [1,-1])` loop and handed `side<0 ? matA : matB` give the LEFT and RIGHT copies DIFFERENT
value bands — an asymmetry that reads under any warm key. The only sanctioned asymmetry on this dragon is
the port-fin constellation; everything else must use the SAME material both sides. (This had quietly
shipped on the mid-fins since CP2 and re-appeared on the new legs — the gate caught both.)

**Gotchas banked:** a comment that says "1.6× the ears" while the code does 2.8× makes the crest read as a
lone HORN (brushing the "no horn" law) — keep the occipital peak ~2× the ears, a dominant *crest* peak, and
keep code/comment/spec agreeing. A tucked limb must be RAISED and hugged to the hull (knee up + inboard) or
it reads "landing gear down," not folded. A tail "closer" spike on the dorsal centreline re-creates the
serrated-clump; drop it to a ventral keel so the twin-crescent dorsal gap stays clean.

**→ Unlocks.** A legged, crowned, twin-crescent-tailed matte-black drake that reads by silhouette at
distance and is finally photographable on a dark card. Reusable carry-forwards: the tip-pinned-span rule,
the night-kicker harness rig, the per-side-material symmetry check, and the "spend on outline, not surface,
for a dark identity" principle. Remaining next-round polish (owner-directed): crown front-read, leg tuck
depth, T0/T1 dark-card legibility, Surge wing-edge blaze intensity.
