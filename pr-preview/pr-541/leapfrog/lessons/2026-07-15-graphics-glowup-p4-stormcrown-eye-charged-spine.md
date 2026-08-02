# Tempest glow-up P4 (final) — dominant+decay crown, a contained luminous eye, a CONTINUOUS charged spine

**What we did.** The last phase of the Tempest glow-up (the director's #5 head + the carried #3 spine nit).
First cut 4.0/REVISE; fix cut **4.4/APPROVE**, and the whole 4-phase glow-up signed off ("came up to the
lightning's premium bar — a decisive, premium-tier result"). Three reusable lessons.

**LESSON 1 — a rank reads as a HERO when it's a dominant+decay ladder, as NOISE when it's equal.** The
crown was a "thicket" of near-equal spikes because the height ladder was CLAMPED (`HT[Math.min(p,2)]`), so
the outer pairs came out the same height. The fix was one line: index the ladder per pair, unclamped, with
a real decay (`HT = [0.44, 0.28, 0.17, 0.10]`, `AZ = [6,20,34,48]`, plus width decay). A tall dominant inner
pair + a steep height/width/splay decay = a hero crown; equal spikes = noise. Same law as Solar's carpal-
lance-then-decay wing: a rank needs a clear dominant and a decay, never a picket fence of equals.

**LESSON 2 — an emissive focal point has a SWEET SPOT; too hot and it clips to a white smear and loses its
hue.** The eye went from "barely registers" to a pure-white blob in one over-correction (emissive
`0.9+1.8·glow`, a wide `r 0.24 / opacity 0.10` outer glow shell). Additive glow past the tone-map knee
clips every channel to 255 → the cool `0xcfe0ff` tint is GONE, and a wide bright shell washes the
neighboring facets. The contained version: emissive `0.7+1.4·glow`, a smaller/dimmer outer shell
(`0.18 / 0.06`). The rule: for a colored emissive focal point, the CORE carries brightness and the HALO
carries the hue — keep the halo below the clip knee so the color survives; a bright-white core inside a
cool bloom reads as a storm-ember, a uniformly-blown blob does not. (Ceiling note for a future pass: our
brightest emissives — eye core, crest ribbon — still clip toward white; the storm hue is carried by the
blooms, not the cores. A saturation/tone-map tweak is what a 4.6+ needs.)

**LESSON 3 — a "line" made of separate specks is not a line; thread ONE continuous ribbon through the
nodes.** The carried "charge the spine" nit failed twice as PER-CREST FLECKS — individually they're tiny
dim specks that read as sparkle on a dark sawtooth, never a line. What finally read: collect the vane crest
points and thread ONE CONTINUOUS additive ribbon through them (horizontal-width so it catches from behind-
above), plus a brighter bloom riding each crest and a faint base underglow. From the rear-chase cam the
dorsal now reads as a single charged storm-line tracing the serration — the signature that sells "storm
dragon" from the angle players actually live in. If you want a "line" read, build a line (a connected
ribbon), not a row of independent marks and hope they merge.

**Why the spine mattered most.** The head work (crown, eye) was the phase's headline, but the checkpoint
twice held the phase on the SPINE, because the dorsal line is what reads as the storm identity from the
CHASE CAM — the primary view. A gorgeous head is a shop-turntable win; the charged back is a gameplay win.
Fix the thing that reads in the view you're graded in.

**Reusable takeaways.**
- A rank reads as hero via a dominant + steep decay (height/width/splay), never equal elements. Don't clamp
  the ladder.
- A colored emissive focal point: core = brightness, halo = hue. Keep the halo under the tone-map clip knee
  or the color washes to white. There's a sweet spot between "barely registers" and "white smear".
- A "line" is a connected ribbon through the nodes, not a row of separate specks (which read as sparkle).
- Prioritize the read in the PRIMARY view (chase cam), not the flattering turntable.
