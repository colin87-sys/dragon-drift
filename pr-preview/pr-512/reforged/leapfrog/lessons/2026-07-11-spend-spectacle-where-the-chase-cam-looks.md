# Spend spectacle where the CHASE CAM looks — the centerline, not the wing surface

**The tell.** After a pass that added falcon barring to Azure's wings, the owner said *"I don't really
see the difference."* He was right, and the reason is geometric, not aesthetic: **the barring lives on
the blade's flat upper surface, which is EDGE-ON from the dead-astern chase cam** — the view he actually
flies. It's gorgeous in the top-planform tile (which the player never sees) and literally zero pixels in
the rear-chase tile (which is the whole game). A pass can pass a gate on the planform panel and still be
invisible in play.

**The reframe.** The rear-chase cam sits behind + slightly above, looking down the course. What reads
there is the **dorsal center-line, the tail center-bottom, the wing-roots, and the upper body** — a
narrow vertical strip. Flat wing surfaces foreshorten to slivers; anything painted on them is wasted.
So the spectacle budget must go on that centerline strip. For Azure that meant three moves that all live
in the rear frame: a dorsal **seam of light** (S2), an amplified **tail banner + fork-root coverts** (S3),
and **faceted shoulder coverts** at the wing roots (S6) — plus a cyan **terminus stud** joining the seam
to the tail. The night read became nameable at a glance: *cyan spine → cyan tail-light → gold swallow.*

**Craft lessons that made it land:**
- **One continuous emissive SEAM beats a row of cones.** The old dorsal glow was 11 tiny cones (radius
  ~0.05) — each below the 8px law, summing to a dim near-white "vertebrae zipper" (a stipple, not a
  structure). Replaced with ONE flat-faceted raised rail sampled along `attach.keelTopAt(z)`, its two top
  facets canted toward the behind-above cam (§2). One long element ≥8px reads as a signature; N tiny ones
  read as noise. (~64 tris for the whole rail, and it REPLACED the 88-tri cone row → net negative.)
- **Emissive hue: pick for how it BLOOMS, not how it looks in the swatch.** The identity ice-blue
  `0x8ed5ff` is only sat≈0.44 / value 1.0 — under §3b's sat≥0.75 bar it blooms toward WHITE and eats the
  ≤1-near-white budget. Fix: keep `0x8ed5ff` as the DIFFUSE color but drive the EMISSIVE with a
  higher-sat cyan `0x35b9ff` (sat≈0.79) — it blooms back UP to the ice read on screen while staying cyan
  under ACES+bloom.
- **The studio has ACES but NO bloom; the game adds UnrealBloom.** So emissive reads DIMMER in the
  `dragonstudio` tile than in play. Tune the geometry to read as a clear line even in the no-bloom tile
  (it will only get brighter in-game), but don't crank intensity so high it clips white in the tile —
  that WILL be a white hotspot in-game. Judge saturated-cyan-vs-clipping-white on the studio tile.
- **A dark-sky signature is a few COLOURED light structures on the centerline, not a lit body.** A
  restrained matte dragon owns the night with 2–3 small emissive marks in the center strip (spine line +
  tail point) + its diffuse identity pigment (gold fork). That's "restraint," done right — *invisible is
  not restraint* (the critic's line).
- **Turn a reclaim into a read: replace smooth primitives with faceted, gold-tipped versions.** The
  generic shoulder balls (shared roster fairing spheres, 108 tris each) became 3 flat folded coverts per
  side (~40 tris) — tri-NEGATIVE AND a falcon read at frame-center, with the top covert proud of the back
  line + a diffuse gold tip joining the existing gold-tips grammar (wing/crest/banner/now shoulder).
- **Gate every new emissive/mesh to the APEX** (`scuteSeam`/`facetShoulders`/`tailTerminus`/`banner*` set
  only in `forms[2]`) so f0/f1 stay dark + round and the apex visibly EARNS its spine of light (§3a).
- **Roster-collision check for any lit tail hardware:** cyan-lit tail bits are Obsidian's stealth-tail
  territory. ONE small stud ≠ a rimmed stabilizer — keep it a point, and do NOT escalate to rimming the
  banner edges (that would read as Obsidian's construction).

**Process rule:** when judging a rear-chase game model, **diff the REAR-CHASE panel specifically** — the
planform panel flatters wing work and will mislead you into shipping something the player can't see.
