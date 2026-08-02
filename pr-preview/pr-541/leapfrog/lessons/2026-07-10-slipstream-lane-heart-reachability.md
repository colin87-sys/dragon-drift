# Ashtalon slipstream — "you can only surf at the very end": a pose-derived safe pocket clamped to the CEILING was reachable-by-construction but not reachable-in-practice, and the shipped gate proved it by teleporting the player onto the wall

**What we did.** Owner playtest: *"when the wave appears for the player to surf, they can't reach it when
Ashtalon is high and far away — is it only at the very END of the dive, when he's coplanar, that you can
surf?"* A Fable assessment (two headless probes against the live pose + the real player control model)
**confirmed it empirically** and produced a two-dial fix (`reforged/js/boss.js`, ashtalon-scoped by
`def.grazeForm === 'slipstream'`), gated by a **bounded-chaser** reachability test that fails on the
shipped clamp and passes on the fix.

**The mechanism (why "reachable by construction" was a lie).** The slipstream pocket's contact test is
2D at the player's own plane (`dx = player.x − slipX, dy = player.y − slipY`; rel never enters) and the
drawn ring sits 4m ahead of the player nose — so the annulus *statically* intersects the player envelope
100% of the live window, and the ENG-D lesson claimed reachability on that basis. But `SLIP_K_ON = 0.42`
is exactly the stoop-start knee, where the boss is still at his **apex** (y≈21, plane-distance rel≈34),
and the centre clamp `SLIP_Y_MAX = 18` parked the pocket at **(0, 18)** — a 1.5-unit sliver **5+ units above
cruise altitude (y≈8)** — for the first ~0.9s. From cruise, even a frame-perfect optimal bot needs
+0.45–0.93s to first touch; a real 0.25s-reaction rider only catches the **coplanar tail** (~1.7s of a
3.18s window). Worse, the flat, fogless, additive ring at y=18 **depth-fuses with the far boss** on a chase
cam — the player reads "the wave is way out there at the hunter" and flies toward something 34m away that
can never converge. *Reusable: a safe region whose CONTACT is at the player plane can still be UNREACHABLE
if its CENTRE is clamped to a height/lane the player isn't in — "the math intersects the envelope" ≠ "a
human on the real control model can fly there in time." Audit reachability with a chaser, not a set-theory
argument.*

**The fix (two ashtalon-scoped dials, zero new geometry — inside the overdraw/FX law).**
1. `SLIP_Y_MAX 18 → 14`: caps the wake to the **lane heart** so its paid bottom arc opens at y≈9.3 (just
   above cruise, visibly *in your lane, below the far diving boss* — killing the depth fusion), yet a
   parked player still sits outside it. The probe sweep proved **14 is the knife-edge**: paid-wall ride
   1.13s→1.88s and firstTouch 0.72s→0.45s, while the never-steer player's *free* pay stays 0.37s→0.40s
   (statistically unchanged). `12` leaks a **100%-occupancy free ride** (a parked cruise player sits in the
   paid wall) — over-correction into triviality. The dial is the whole risk surface; one number back.
2. Snap the **pre-tell** ring to the clamped pose during the `holdTell` (k≥0.2) paddle-out window, so the
   faint 0.14-opacity ring **honestly marks where the pocket will open** and you position during the dread
   climb. This also fixes a **latent bug**: `slipX/slipY` are never reset at the encounter/teardown sites,
   so pre-fix the first-ever stoop's pre-tell drew at module-init `(0,0)` (below the lane floor) and
   recurred stoops drew it wherever the last ride ended — the one cue that could teach position was
   untrustworthy. *Reusable: a telegraph that rides a STALE follower position teaches nothing; pin the
   pre-tell to the same clamped pose the live pocket will use.*

**The gate — a BOUNDED-CHASER, the antidote to the vacuous teleport test.** The shipped ENG-D reachability
"proof" (`tests/boss.mjs`) *teleported* the player onto the wall each frame (`p.position.x = st.slipX + …`)
— it proved the graze ECONOMY, never that a player could get there (the exact failure the
`wyrm-overcorrection-and-vacuous-tests` lesson warns of). The new gate drives a chaser through the real
control model verbatim (`damp(v, target, moveAccel, dt)`, caps `lateralSpeed 24`/`verticalSpeed 18`, lane
clamps) from cruise with a 0.25s reaction, steering to the wall-band midpoint, and asserts: firstTouch ≤
0.6s, occupancy ≥ 70%, paid-wall ≥ 1.5s, the ≥0.8s ride arms with ≥1.2s of release room — **plus** a
parked player earns < 0.6s (no free lane). **Validated as a real regression detector**: on the shipped
clamp (18) it fails at firstTouch 0.72s; on the fix (14) it passes at 0.45s — it discriminates in exactly
the axis the owner complained about, in both directions. *Reusable: a pose-derived safe region needs a
bounded-chaser gate (real control model, reaction delay, from a realistic start), never a teleport oracle;
and prove the gate FAILS on the pre-fix constant before trusting it.*

**Verify.** `tests/boss.mjs` **124** green (+1 ENG-D-R bounded-chaser block), deterministic across repeated
runs; `bossboot` green. Only two `boss.js` numbers/one restructure move — `SLIP_K_ON`, the stoop path
(`stoopingStrike`), `SLIP_R_IN/SLIP_WALL/SLIP_FOLLOW`, the `recur:9`, the exposure hook, the ×2 amp, the
band mesh and all three reset sites are byte-identical; zero new geometry/draws → `tricount`/`tiershots`
unchanged by construction. `stamp-sw` in the commit. Human judges the surf *feel* on the preview:
specifically that the ring now reads "in MY lane, under the diving hunter" during the high phase, and that
the paddle-out tell lets you pre-position.

**What this unlocks.** The `recur` fix (merged) gave you *more* dives; this makes *each* dive a real ride
instead of a coplanar instant — together the slipstream is finally the sustained surf its AMBUSH–REST
signature always promised. The bounded-chaser gate is now the template for auditing every pose-derived
graze pocket (orbitAnnulus, shrinkDisc, tideEdge, shadowRide, beamEdge) for the same
reachable-by-construction-but-not-in-practice trap.
