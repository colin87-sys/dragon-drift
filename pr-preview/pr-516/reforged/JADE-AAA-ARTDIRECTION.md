# JADE-AAA-ARTDIRECTION.md — the Jade Serpent AAA elevation (art-direction pass)

*Fable art-director pass, 2026-07-16. Scope: analysis + elevated direction + the
North-Star IMAGE BRIEF. The build sheet comes AFTER the image is locked — nothing here
is builder-executable yet except the feasibility guardrails, which the future engineer
inherits as constraints. Authority context: STARTER-REDESIGN §5d jade sheet (iconic-green
human direction), DRAGON-DESIGN laws, law 12 starter ceiling, the CP3 headroom lesson
(`leapfrog/lessons/2026-07-11-jade-cp3-spectacle-headroom-spend.md`).*

---

## 1. Analysis

### Sacred — do not touch (this IS Jade's soul)

- **The one-tube swimming S.** `koiSerpent` + `bodyWave` makes Jade the only dragon in the
  roster whose BODY is the motion signature — a real travelling wave, not a bead-chain.
  Every elevation must amplify this, never bury it under hardware.
- **The iconic vivid green.** The `0x3cb883 → 0x28a06b → 0x178a54` ramp + pale mint belly +
  green-family fin gradients. A stranger's one-word color read is GREEN and must stay GREEN.
- **The koi head charm.** Slim browed `koiSkull`, calm painterly living eye, whisker-fins
  cradling the chin pearl. This is the select-screen charm weapon.
- **The apex regalia already banked** (CP3): rayed koi veil-fins (`rayRelief`), the Koi Lyre
  twin veiltail crescents (`moonTail`), fin-tip dew gems (`tipGems`), triple streamers.
- **The restraint identity.** ONE bloom (the pearl). Jade's luxury is grace, not wattage.

### The top 5 things holding Jade back from "WOW, pick me"

1. **The motif loses the frame it's judged in.** The pearl lives under the chin — 0% of the
   rear-chase frame — and its lockstep carrier (mint rims on green fin tips) is the
   lowest-contrast accent in the trio: mint-on-jade is a whisper next to gold-on-navy
   (Azure) and a blazing cream/fire corona on orange (Ember). At gameplay distance Jade's
   signature light contributes ~nothing; Ember's collar owns its rear frame every second.
2. **The lightest value faces the floor.** Jade's value contrast is its mint belly — which
   the chase cam never sees. The dorsal canvas (95% of play) is mid-green body + mid-green
   fins: when small and backlit the whole dragon compresses to ONE green mass (failure mode
   8 at distance). Azure got gold tips + an ice dorsal seam; Ember got cream scutes + a lit
   spine; Jade's dorsal got nothing light. This is the single biggest craft gap.
3. **The S reads worm-adjacent end-on.** Rear-chase foreshortens the lateral swim; a slim
   0.52-girth tube with the trio's smallest span (2.2–2.5×) can collapse to "green noodle
   with flaps." What saves the rear read is the VERTICAL wave component + the fan-V + the
   lyre crescents — and those are currently under-driven (`bodyArcY 0.14`, modest crescents,
   `lobeFlareBoost` only on boost). Majesty from behind must come from the FAN, not the tube.
4. **The flow story is sub-pixel.** The streamers are the "river-current" fantasy, but they
   are thin, static-value bands that alias away at play distance. Flowing WATER reads as
   light travelling along a line; Jade has the lines but no travelling light.
5. **The coronation doesn't announce.** The apex's earned hardware (ray flutes, dew gems,
   lyre) is all carved green-on-green — deliberately silhouette-safe, which was right for
   CP3's "amplify" gate, but at select-card scale the apex vs adolescent delta reads mostly
   as "longer, more fins." A new player comparing three starter cards sees Azure's gold
   banner and Ember's blazing collar announce their apexes; Jade's whispers.

---

## 2. The AAA elevation direction

**The elevated one-sentence read:** *"The river made animal — a vivid jade ribbon swimming
through the sky inside its own current of silk and pearl-light, the most graceful thing on
the select screen."*

**The ONE hero feature — THE GRAND FAN-BLOOM.** The rear-chase fan: four rayed silk
veil-fins per side + the twin Koi-Lyre crescents composed as ONE continuous blossoming
hand-fan that visibly OPENS on every swim crest and closes on the trough (breathing with
`bodyWave`, flaring wider on boost). The rear frame stops being "a body with fins" and
becomes an opening fan the player flies inside. Every other element (dorsal crest ribbon,
streamers, pearl-chain) exists to serve or rhyme with the fan-bloom.

**The rear-chase one-word read:** **BLOSSOM.**

**The starter-vs-premium ruling (push-the-ceiling):** law 12 stays INTACT — no glowSeams,
no veins, no halo, `spineGlow ≤0.32`, ONE bloom. Ember already spent the trio's sanctioned
exception, and Jade's identity is that restraint IS the luxury. The WOW is bought at the
legal maxima instead, on two axes Jade has never used:

- **The pearl-chain (light).** The pearl remains the one bloom — make it the single most
  beautiful restrained light in the game: a soft mint river-pearl with a bright core and a
  shaded lower hemisphere (a modelled pearl, not a dot). Then let its light BREATHE down
  the dragon as a lockstep phase-lagged pulse across components Jade already owns —
  whisker tips → fin-tip dew gems → lyre rims → streamer ends — each igniting in sequence
  rear-ward, so pearl-light travels the body like current. This is §6.3 "components
  lighting up" (legal), not a seam; total contribution stays below the pearl, cruise stays
  calm, and the chase cam finally SEES the motif every second as moving light.
- **The dorsal crest ribbon (value, zero emissive).** The gold-tip analog Jade never got: a
  pale seafoam DIFFUSE paint tier (`0xbdf5d0` family) as a slim crest ribbon down the
  spine, on the fin ray crests, and on the lyre leading edges — pure value, edges/rays/tips
  only (law 9's 10%), no light. This gives the dorsal canvas its missing light tier so the
  dragon stops compressing to one green at distance, on the brightest biome and the pale
  backdrop alike.

Supporting moves, in priority order: (1) drive the fan-bloom breath (per-beat lobe-pivot
envelope on the existing `wingLobePivots` + `lobeFlareBoost` generalized from boost-only to
a wave-locked cruise breath); (2) deepen the VERTICAL swim component the rear cam actually
reads (raise `bodyArcY`/vertical wave share, not lateral amp); (3) widen the streamer bands
slightly and give them the travelling pearl-pulse so the river-current reads; (4) make the
coronation announce — the apex's fan-bloom amplitude, crest ribbon, and pearl-chain are
apex-gated so the select-card apex is unmistakably the blossomed form.

**Feasibility guardrails (the engineer inherits these):**

- Apex budget: ~1,000 tris of headroom (apex ≈4.95k of 6,000). Spend ≤700; ladder stays
  monotonic; no `forms[3]`.
- Any fin relief obeys the carve-INWARD law (CP3 lesson): sil-rear IoU ≥99% vs shipped,
  proven with `tools/_sildiff.mjs`. New rear mass prefers MEDIAN (x=0) geometry.
- The pearl-pulse is phase-offset `emissiveIntensity` on existing component materials (or
  a shader uniform on vertex-colored bands) — no new additive shells, no alpha layers
  beyond the ≤2 cap, thin emissive strips `DoubleSide`, eyes stay out of surge arrays,
  full fever palette already overridden.
- The crest ribbon is vertex paint on existing dorsal geometry — zero drawables, judged on
  the pale backdrop for endpoints (no toy-color: ribbon stays a slim edge, never a broad mass).
- Fan-bloom motion rides the existing rig (`wingLobePivots` phase/lag); any new joint uses
  the −anchor trick so the rest pose is byte-identical; mirror via outer `scale.x = −1`
  wrapper only.
- Verify per failure class: tricount · blueprint · smoke · wingsymprobe Δ0.000 · seamprobe ·
  flapstrip · tiershots · gameshots · the jade block in `tests/starters.mjs` (accent stays
  ~149°±20°, one-bloom-by-contribution assert must still pass with the pulse at its peak).

---

## 3. THE NORTH-STAR IMAGE PROMPT

Feed verbatim to the low-poly-style image model:

> A breathtaking low-poly flat-shaded 3D game-art render, crisp faceted triangles, clean
> stylized geometry, no textures, in the style of a premium mobile flying game — a long,
> sinuous Eastern koi river-dragon in graceful HORIZONTAL FLIGHT, its serpentine body swept
> into one elegant swimming S-curve like a koi gliding through invisible water. Body a
> vivid gemstone jade green (#178a54) with a luminous pale-mint belly (#a6e2c2) and a slim
> pale-seafoam crest ribbon (#bdf5d0) running down its spine to the tail. Its hero feature:
> four tall silk veil-fins per side spread like blossoming hand-fans, each fin fluted with
> raised koi-fin rays, colored in a gradient from deep emerald at the leading ray (#116b45)
> through rich jade (#2f9e77) to translucent pale-jade tips (#9ff0c8), plus twin canted
> crescent veiltail fins at the tail forming a lyre shape. Long silk streamers trail from
> the rear fins and tail like ribbons of river-current, rippling in the flight path. A
> slim, elegant serpent head with a calm luminous green eye, long trailing whisker-fins
> curling under the chin to cradle a single softly glowing mint river-pearl (#d6ffe9) —
> the pearl is the ONLY glowing element, a gentle dawn-lantern light, with tiny dewdrop
> glints echoing it on the fin tips. No fire, no neon, no glow veins — the beauty is
> silhouette, silk, and one pearl of light. Setting: a misty jade river-gorge at dawn —
> low-poly limestone karst cliffs, thin waterfalls, soft white mist filling the valley
> below, a peach-gold dawn sky (#f2c98a into pale turquoise) that flatters the green.
> Camera: hero three-quarter rear-elevated beauty angle, slightly above and behind the
> dragon's left flank, so the fanned veil-fins and lyre tail bloom toward the viewer and
> the S-curve reads full-length against the mist. Lighting: warm low dawn key from the
> front-right rim-lighting every fin edge, cool mist bounce fill from below, the pearl
> adding a faint mint underglow on the chin and whiskers. Mood: serene, majestic, alive —
> a river spirit dancing in the sky. Sharp focus, high detail low-poly faceting, cinematic
> composition, portfolio-quality stylized game key art.

**Variant note (second angle):** Same dragon, same gorge and dawn light, but rendered from
the TRUE behind-the-dragon chase camera — directly behind and slightly above, the fan-V of
veil-fins and the twin lyre crescents blooming open toward the camera around the
foreshortened S-body, streamers flowing beneath toward the lens, the pearl's mint rim-light
just visible on the rear fin tips, the gorge rushing ahead — the frame a player lives in.

**How the North Star must read from the chase cam (for whoever judges the render):** the
one-word read is BLOSSOM — an opening green-and-mint fan with a bright seafoam spine-line,
light breathing rearward along dew-lit tips and streamers; if the rear read is "tube with
flaps," the image (or later the build) has failed the hero feature.
