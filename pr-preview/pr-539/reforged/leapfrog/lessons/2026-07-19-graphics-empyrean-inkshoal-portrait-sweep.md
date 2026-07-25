# inkShoal on a phone — the PORTRAIT-AZIMUTH law (and "still" vs "cemetery")

**What happened.** The owner played the freshly-merged inkShoal (PR #518) on a phone and reported two
things: "the fish are swimming off and I can't really see it after a while on mobile," and "is the vibe
meant to be more still? Almost seems like a cemetery." Both traced to ONE placement bug.

**The root cause — every desktop gate frame lied about the phone.** The school shipped parked at azimuth
~19° off-axis (x≈44 at ~130m) — comfortably in frame at the desktop capture aspect (960×600, horizontal
FOV ≈111°, half ≈55°). But the game's FOV spec is **VERTICAL** (77–92° dynamic): on a phone in portrait
the horizontal half-FOV collapses to ~24° (aspect ~0.5 → hFOV = 2·atan(tan(vFOV/2)·aspect) ≈ 49°). A
school at 19–23° azimuth lives ON the portrait edge and slides fully out of frame as its wheel swings
wide. The owner saw stones, void, and **no life** — which is exactly the biome's known failure read.

**The vibe insight — "cemetery" is the Empyrean's serenity with the LIFE clipped out.** The biome is
authored as the bright BREATHER finale (boss pressure off, calm nacre, choir of standing stones); the
stillness is intent. What keeps "serene" from collapsing into "funereal" is the LIVING MOTION — the koi
school and the rising pearl-motes. Pale megaliths + silence − fauna = graveyard. So fauna visibility isn't
polish; it is **load-bearing for the biome's emotional read**. If a tester says "cemetery," check first
whether the life is actually in their frame before touching the art.

**The fix — sweep the school through the portrait window, separate by ALTITUDE.**
- Anchor now SWEEPS across the high sky: `cX = 12 + sin(st)·18` (azimuth ~−3°..+13°, ~2-min crossing),
  always inside the ~±24° portrait window on every aspect. A slow crossing also reads more alive than a
  parked wheel — the school *travels*.
- The sweep path crosses the Mote's azimuth, so the Mote-separation duty moves entirely to **altitude**:
  anchor y≈66 puts the school ~14° above the Mote's band (Mote elevation ≈ +8°, radius ≈ 4°) — stacked
  ABOVE with clear sky between, never ON the disc. Vertical placement is also the mobile-safe axis: in
  portrait the vertical FOV is the WIDE axis, so elevation offsets survive every aspect while azimuth
  offsets do not.

**THE REUSABLE LAW (any flock/landmark/ambient in this repo):** the FOV spec is vertical, so **desktop
frames validate elevation but NOT azimuth**. Anything that must stay visible on a phone must live within
~±13° azimuth of straight-ahead (safe inside the ~±24° portrait half-window with wheel/wander margin) —
or accept it as a desktop-only garnish. Separate stacked elements by ELEVATION, not azimuth: vertical
clearance survives every aspect ratio. And CAPTURE THE PORTRAIT FRAME: `_shoalshot.mjs` now takes a
`view` override and ships a `mobile` shot (390×780) precisely because every desktop gate round passed a
placement that was invisible on the device the game targets ("60fps on weak mobile" — the mobile frame
is the canonical one, not the wide one).

**Verify.** Portrait 390×780 frame: school fully in frame, above the Mote, legible. Desktop cruise +
look-up: school passes above the Mote with clear sky between (stacked-with-gap, no perching). Fable-model
re-gate on all three aspects + guard suite (appshell / biomecycle / gold-determinism) green before push.

**What it unlocks.** A portrait capture in the standard gate kit — future Empyrean gates (and any biome's
fauna/landmark gates) should include the phone frame by default, so "passes on desktop, invisible on
mobile" can't ship again.
