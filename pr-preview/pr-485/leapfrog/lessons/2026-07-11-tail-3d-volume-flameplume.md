# A "flat blob" trail is a CROSS-SECTION problem: give it a radial `flamePlume` (a hollow cone around the axis) whose downward freedom is CLAMPED BY CONSTRUCTION so the corridor law can't break

**Did.** Owner on the reforged fire phoenix: wings great, but *"the tail looks like a flat blob, worst
from rear-chase."* Fable-director plan → the **"Comet Volute"**: replaced the planar two-tier tail train
with a radial 3-D structure around the tail axis. Harsh critic: **4/5, SHOW-THE-OWNER: YES — the
flat-blob complaint is answered in the exact camera it was raised for.** New reusable primitive:
`flamePlume`.

**Learned #1 — "flat blob" is a CROSS-SECTION diagnosis, not a "needs more stuff" one.** The old tail
spanned ±2 units in x but only ±0.06 in y — a **30:1 sheet** — and *every* ribbon face normal was
vertical (`side≈[1,0,0]`, `dir.y=0`), so from the side it was a thin streak and **from rear-chase every
face was edge-on** (the camera looks down the tail axis; a flat fan perpendicular to nothing shows only
its thin silhouette). No amount of extra ribbons *in the same plane* fixes that — you have to give the
cross-section real height AND turn faces off-axis. The cure is a **radial arrangement around the axis**:
ribbons on a ring, faces pointing outward (radial), so whatever the camera angle, some faces present
area. That's `flamePlume(n, base, axis, opts)` — n flame-tongues on an **upward-biased egg ring**,
converging on a **gather point** with a helical twist → a hollow teardrop cone (swell → waist → comet
point) that has volume from every camera.

**Learned #2 — the constraint that caused the blob is satisfiable BY CONSTRUCTION, not by manual
tuning.** The tail was flattened to `y≈0.5` in the first place because the corridor law forbids mass in
`{y<0.30, z>0.85}` and the whole tail lives at z>0.85, and a long ribbon with any downward `dir.y`
accumulates through the floor. The insight: **the law only bounds DOWN; up and radially-out are free.**
So build the volume upward-biased and clamp only the down freedom, three ways that need zero per-render
babysitting:
1. the ring is an **egg** (`ryUp > ryDn`) so the bottom sits higher than the top is tall;
2. the **arc leaves a gap at pure-bottom** (`arcDeg≈290`, centred on top) so no ribbon starts at the
   lowest point;
3. the outward **bow is clamped toward zero in the belly sector** (`cv = curve·(0.35+0.65·max(0,cosφ))`)
   so a belly ribbon can't bow down;
   and the **axis itself climbs** (`dir.y=+0.10`), which both lifts everything over its length AND
   pitches faces toward the rear camera. Result: the automated corridor scan passes at every ladder form
   with margin, and it stays passing no matter how the size dials move. *Encode the invariant in the
   generator, don't re-verify it by hand.*

**Learned #3 — rear-chase (a camera looking INTO the trail) is carried by the near-body CROSS-SECTION,
so build a real solid + a bright throat there.** Since the tail points away from that camera, the length
does nothing; what reads is the silhouette + depth right at the root. Four things deliver it, all at the
body end: a **lofted solid root CONE** (a round nozzle, not a flat shelf), a **white-hot throat** the
camera looks into (a comet-coma / engine-glow — a hot octahedron scaled WIDE and FLAT, `1.3/1.3/0.8`, so
it reads as a round disc not a sliver), a **radial ruff rosette** (scalloped outline + internal
V-notches), and a **crest pair** rising off the dorsal root for height (so the near silhouette is TALL,
not wide). A radial **heat gradient** (hot throat+core in the centre, cooler ember sheath around) makes
the camera look *into* fire.

**Gotchas (each cost a render):**
1. **A constant-handed helical twist makes a static rear-chase pose read LOPSIDED** (all ribbons lean
   one way). Grace-in-motion ≠ balance-in-a-still. Fix: cut the twist to a hint (0.08→0.03) and make the
   terminal **flick mirror-symmetric by SIDE** (`sign(sinφ)`), not by index parity — index parity
   (`i%2`) does NOT mirror-pair across the centre, so it also skews the still.
2. **Spark wisps placed at even angles around the axis** put one at pure-bottom → a **detached ember
   chip** below the body. Bias sparks to the **upper hemisphere** (`φ∈[−0.9,0.9] rad`) and keep them
   symmetric.
3. Ladder wiring: drove the whole volute off the **existing** `pennantRibbons`/`pennantLift` knobs
   (count + size/radius) — whelp = a modest puff, apex = the full volute. No new dials (the dead-knob
   lesson again).
4. Shell cwd still resets to repo ROOT between Bash calls; always `cd /…/reforged && …` in one command.

**→ Unlocks.** `flamePlume` (corridor-clamped radial fire cone) + the "solid-cone + throat-disc + crest"
rear-camera recipe are a **reusable volumetric-trail kit**: any comet / rocket-plume / spirit-trail /
tail that a camera looks *into* can get real depth from it, and any generator with a one-sided keep-out
zone can borrow the "clamp the forbidden freedom inside the generator (egg bias + arc gap + sector-
clamped bow + climbing axis)" pattern instead of hand-checking a keep-out test every iteration.
