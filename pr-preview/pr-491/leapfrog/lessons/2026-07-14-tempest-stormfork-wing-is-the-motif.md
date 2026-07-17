# Tempest — the Stormfork: when the wing is a delivery mechanism for the motif, fuse them

**What we did.** The owner REJECTED the Thunderhead Tempest's hero wing — the triple-stacked
"strata-deck" (three cloud-bank slabs per side) — on aesthetics, despite it passing two harsh
gate rounds (§R Opus, §F Fable) and a full feasibility audit. From a 5-alternative menu the owner
chose **THE STORMFORK ("BOLTFRAME")**: the wing whose skeleton IS a frozen branching lightning
bolt — a gull-arch leading edge broken by THREE hard kink-knuckles, a Y-forked dominant ray, taut
opaque charcoal membrane in cupped bays, silver rim-caps on every kinked ridge. Rear read: **BOLT**
(was STACK). We authored it to build-ready depth as `TEMPEST-THUNDERHEAD-BUILDSHEET.md` **§D**
(superseding §5/§R/§F/§B.3b + the wing rows of §B.4/§B.5/§B.6/§B.8, all kept as history with
pointers), updated `FRESH-DRAGONS-SYNTHESIS.md` (matrix cell → "boltframe: kinked opaque membrane,
forked lightning-skeleton"), and banked two concrete fixes in passing: the §C.5-flagged
broken-linkage dial block (`tipAmp .42 > midAmp .28`) re-tuned shoulder-led
(rootAmp .74 > midAmp .14 > tipAmp .08, 77% shoulder ownership), and `feverWing` 0x000000 →
0xd9deff capped ≤0.30 (see the gotcha).

**The META-LESSON — a wing that merely CARRIES the motif reads "weird"; fuse structure and motif
so the grind-hook is IN the silhouette.** The strata-deck was, structurally, a delivery mechanism:
three shelves whose job was to give the Storm Circuit undersides to glow on. The motif was painted
ONTO the architecture, so the architecture had to justify itself separately — and for 82–94% of
play (no strike) the player saw three grey slats working hard to be interesting, with the identity
hiding in a 6–18% duty cycle. The Stormfork inverts the relationship: **the wing's skeleton IS the
circuit's f2/f3 branches** — the kinked frame reads as lightning even when dark (a carved bolt in
charcoal + silver), and the strike doesn't ADD a motif, it REVEALS what the silhouette already
was. Test for any future hero feature: *delete the glow/spectacle — does the remaining geometry
still state the identity in the black-fill?* If the spectacle is the only carrier, the structure
is a shelf, and the owner will eventually feel it no matter how many gates it passes.

**The gotcha (fever hooks are identity-dependent, not roster law):** Vesper's proven
`feverWing: 0x000000` kill-switch (wings stay silhouette on Surge) is correct ONLY when the wing
is not part of the light story. On a wing whose FRAME is the ignition, a black feverWing leaves
the blazing skeleton reading as lit wire floating on dead cloth — the membrane must become the
RECEIVER (C11's law): `feverWing 0xd9deff` at a capped membrane intensity (≤0.30, frame:membrane
~5:1). Copying a shipped dragon's fever block without re-deriving it from the light story is the
same class of bug as the magenta default it guards against.

**The reusable pattern — "arch, not zigzag," made computable.** A kinked/stepped outline flirts
with the #12 sawtooth failure. The discipline that keeps a BOLT from collapsing into a COMB, as
asserts (not vibes): a module-level piecewise-LINEAR waypoint profile (straight chords, hard
breaks — C15's waypoint-table method) with (1) exactly N=3 interior slope breaks, never more;
(2) each break angle in a band ([18°,60°]) measured in the REAR X-Y projection (the camera's
axes — plan-Z jogs don't project astern); (3) a single global Y-max (a zigzag has multiple
comparable peaks); (4) every waypoint within ±0.06·hs of the smooth macro arch (the envelope
dominates the deviations); plus bays ≥4 seg with ⅓ cusps and a dominant+decay rank ≤0.86× each.
And judge the STANDING (pinned, no-strike) rear crop FIRST at every gate — the frame that is
82–94% of play is the frame that must already be cool.

**What it unlocks.** A cleaner Tempest I2 (one wing instead of three decks sheds ~0.5k apex tris —
re-pinned honestly to 1.8/2.6/3.6/4.7k, not padded back), fork tips on the existing
`wingBladePivots` walker as a crackle-churn (zero rig surgery), and a portable test for every
future premium: put the motif's geometry INTO the hero silhouette (Tocsin's rings, Stiletto's
sacs already do this; any future "surface X carries motif Y" proposal now has to answer the
delete-the-glow question first).
