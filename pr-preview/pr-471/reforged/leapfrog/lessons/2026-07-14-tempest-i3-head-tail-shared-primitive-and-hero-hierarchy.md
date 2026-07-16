# Tempest I3 — head + tail: ONE shared primitive, the proud-eye law, and hero-vs-rank hierarchy

**What happened.** Built the real stormbrow HEAD (the glowing swept-back lightning-spike crown) and
the virga TAIL (the lightning-flame bolt-tuft), replacing the I0 stubs. Fresh Fable gate: REVISE →
one targeted turn each → PASS. The turns weren't structural — the structure was right first pass; the
misses were a buried eye and an inverted hero/rank hierarchy. Those two are the reusable lessons.

**THE LOAD-BEARING MOVE — lift the identity primitive to MODULE scope so every body part is literally
the same bone.** The wing's `boltRidge` (charcoal tent sides + wide near-white glow cap + silver rim)
was trapped inside `buildOneStormforkWing`. I lifted it to a module-level `stormSpike(push, hs, a, b,
wB, wT, lift, sideMat, glowMat, rimMat)` + `stormWeld`. Now the wing finger-strut, the head crown
spike, AND the tail flame-tongue are the SAME function call — so all three read as the same lightning,
not three reskins that happen to be near-white. The wing became a thin wrapper (geometry byte-identical,
tri counts unchanged — verified). Cohesion across parts is a DRY problem: when three parts must read as
one creature, they should share the primitive, not re-implement a look-alike. Fable's own note: "one
primitive, three body parts, one creature… don't touch the shared stormSpike; just resize where it's used."

**THE PROUD-EYE LAW — on a NARROW skull, the eye must sit PROUD of the surface, not recessed into it;
over-recess + undersize = the named facial checkpoint dies in the no-bloom studio.** My first eye was
a 0.045·hs almond seated behind a deep socket cup at x=0.13·hs — but the skull half-width there is
~0.155·hs, so the eye was literally INSIDE the loft, occluded by the hull, reading as just another dark
cheek void. The gate: "I cannot find a blazing near-white eye… you've over-recessed it." The fix was
three things at once: (1) enlarge (→0.09·hs, a real lozenge — Vesper's is 0.172·hs, an identity claim,
so a pinprick never competes); (2) move it PROUD — position it just OUTSIDE the narrow skull side at
the socket mouth, not at the interior center; (3) shallow the cup (floor r*1.2→r*0.7) and make the
socket lip CHARCOAL so the eye is the only bright thing in the housing. The Revenant orbit law ("glow
from within a housing, forward of the cup wall that occludes it") still holds — but on a slim head the
"housing" is a shallow proud rim, not a deep pit, or the hull eats the ember.

**HERO-VS-RANK HIERARCHY — a supporting rank must never out-shout the hero; if it does, scale the hero
UP and ramp the rank DOWN toward it.** The tail's HERO is the bolt-tuft (the point of light the chase
cam tracks); its dorsal crest FRINGE is a supporting rank. First pass, the fringe (a strong glowing
serrated rank the whole length) dominated and the tuft was a small terminal flick — the gate: "the
hierarchy is inverted: supporting rank is louder than the hero." Two moves fixed it: (1) scale the hero
~1.8× (longer/wider tongues, a bigger ignition core) so it's the obvious focal point from every angle;
(2) SUBORDINATE the rank toward the hero — ramp the fringe-blade height DOWN over the last ~25% of the
stem so the fringe LEADS THE EYE TO the burst instead of competing with it. A rank that ends where the
hero begins reads as a runway to it; a rank that stays full-height alongside the hero reads as a rival.

**A gotcha banked — the "warm tan band" was SPECULAR KEY-LIGHT on a smooth up-facing surface, killed
by GEOMETRY not material.** The stub head-top read warm-tan (sampled ~112,99,87) even though every
head material is cool charcoal/near-white. It wasn't a material — it was the studio's warm key light's
broad specular sheen on the smooth broad up-facing snout-top (the body doesn't show it because its
dorsal is scute-broken). Value-banding the skull (Fable's first prescription) did NOT fix it; a faceted
DORSAL CHINE rank (small raised scutes down the top centerline) DID — it scatters the smooth sheen into
angled facets AND adds a craft rank. When a broad smooth surface catches an unwanted uniform sheen,
break it into facets; a material tweak can't fix a geometry problem.

**Reusable build facts banked:**
- **Binning ranks to an isBone tail chain (whip-safe):** accumulate tris per `(joint, material)` into a
  `perJ[]` array of Maps, then `chainAdd(jAnchor(j).z, flatTriMesh(tris, mat))` each — so every rank
  (crest fringe, flank scutes, the tuft) is welded to the joint whose z-span holds it and rides the
  travelling-wave `tailWhip` without tearing. The `−anchor` compensation is inside `chainAdd`.
- **Glow ONLY on raised components (the paint-audit):** the skull loft, jaw, and tail stem carry ZERO
  emissive; every glow lives on a raised component (crown spike cap, eye, mane ribbon, crest blade,
  tuft tongue). This is the anti-LED-strip law and it passed the audit on both parts first try.
- **Anti-reskin by role, not just palette:** the head separates from Revenant (no bone maw / fangs /
  green socket vents — a closed sleek charcoal skull whose hero is a CROWN) and Vesper (no cat-wedge /
  big acid almond — an angular skull with a slit near-white eye + a lightning crown). The tail separates
  from Revenant (no vertebra file / green ember drums / translucent spectral wisp — a solid faceted stem
  + an OPAQUE near-white flame) and Vesper (not twin symmetric split-fins — a radial odd-count flame
  spray with a dominant center).

**What it unlocks.** The full dragon geometry is done and gated — a charcoal storm-drake wearing a
live near-white lightning garment: the big forked bat-wing, the glowing crown + bright eye, the body
circuit, and the crest-fringe tail ending in the flame-tuft, all built from the ONE shared stormSpike.
Apex ~2140 tris, roster byte-identical, suites green, legless (roster-consistent). Next: I4 — the storm
tick (breathing + strikes travelling root→tip + Surge as the break; and the tear-free crackle-churn
the wing deferred), then I5 — the CHARGING ladder asserts + the tests/starters.mjs block.
