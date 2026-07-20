# Welcome+Hub build §2/§3: the returning-player pop-in, and the hub camera (pull-back, not zoom)

Two increments off `WELCOME-HUB-REDESIGN.md`, both verified by LIVE headless capture (not the
canvas-blanking `uishots`) — a one-off boot + `__dd.ui.showScreen` + full-page screenshot renders the
real world dragon, which is the only way to judge composition.

## §2 — the idle-reward POP-IN (kills the flat "Tailwind while you were away" line)

Reusable patterns that made a premium gacha card cheap to build:
- **The wallet is already mutated at boot, so a naive count-up animates new→new (invisible).** Capture
  the PRE-reward baseline (`main.js`), and — the trap — the gambit refund is credited at *load*
  (`save.js:186`) while the welcome-back gift is added at *boot*, so `preTotal = embers − refund`, then
  add the gift. Card + topbar both tween `preTotal → finalTotal`.
- **One shared clock for card + topbar.** `tweenNum` drives the card amount; its `fmt` side-effect
  updates the topbar `<b>` off the SAME rAF clock, so device jank can only delay both together, never
  tear them. Added a backward-compatible `onDone` to `tweenNum` to fire the sigil bloom on the landing
  frame.
- **Mount the card as a `document.body` overlay, NOT inside the hub HTML** — the hub re-renders via
  `innerHTML` and would wipe it.
- **stopPropagation on the card/scrim pointerdown is mandatory** — the global `main.js` tap-to-fly
  handler fires on any `game.state==='ready'` tap not caught by a `button/.card/...` closest-match, so a
  dismiss tap would otherwise *launch a run*.
- Composition: the card seats in the lower band (`bottom:13%`) so the dragon holds center (HUB
  COMPOSITION LAW). The precise `Box3`-yield refinement (card top below the projected silhouette bottom)
  is deferred to §3's measure pass; the lower-band rule is the shippable interim.
- **Preview affordance:** a returning-player state can't be seen on a fresh boot, so a `?reward` param
  (mirroring the `?rockrun`/`?ribcage` convention) forces a sample card over the hub for PR-preview
  eyeballing. No-op without the param, not persisted.

## §3 — the hub camera (cropped dragon + rotating-around-nothing)

The complaint was a `cameraController.js` framing-rig problem, not CSS. Two fixes:
- **Empty-rotation → BOUNDED SWAY.** The hub was `showcaseAngle += dt*0.3` (a full 360° turntable that
  swings the camera *behind* the dragon into empty sky). Replaced with a bounded
  `showcaseAngle = HUB_SWAY * sin(swayT*0.098)` (±~14°, ~64s period) around dead-ahead-down-the-course,
  so the ring-course/water/embers always sit behind the subject. A separate slow vertical float keeps a
  liveliness floor so clamping the yaw can't deaden the frame.
- **Crop → PULL BACK, don't zoom.** The crop was radius 10.5 / fov 58. The instinct "narrow the FOV for
  a hero read" makes crop WORSE (narrower fov = more zoom = bigger subject = clips the wings). The fix is
  a **narrower fov AND a larger radius together**: `HUB_FOV 46` + `HUB_R 13` frames the whole dragon
  (wings clear) with headroom. Keep the shop static pose byte-identical: the fov blend endpoint at `w=1`
  stays 55 and the shop pose (sx,sy,sz radius 12.5) is untouched — only the *hub* (`w=0`) end moved. The
  intro-glide fov had a hardcoded `58`; retarget it to `HUB_FOV` so the cinematic settles to the new hub.

**A FIXED radius can't serve the roster — the owner caught it immediately.** The first pass used a tuned
constant (`HUB_R 13`) verified only on the STARTER. The owner asked "check it against one of the biggest
dragons" — and phoenix (scale 1.18 × **wingScale 1.34**, the widest) at apex form clipped its wingtips at
BOTH frame edges. The lesson: any hub-framing verified on one dragon is unverified — test the widest
(phoenix) and the flagship (tempest) at APEX form, in PORTRAIT (the tight axis), because that's the
worst case.

**The fix = the dynamic per-dragon `Box3` fit (no longer deferred).** `dragon.js` exports
`getDragonFitSpan()` — a `Box3` measured over the dragon's **meshes only** (`traverse` + `expandByObject`,
skipping FX sprites so a glow/aura can't inflate the fit), cached per build (a dirty flag set in
`createDragon`; `updateDragon` runs before the camera each frame so the group is already scaled to
`model.scale` when first read, ×1.1 wing-flap margin). `cameraController.hubFitRadius(span, aspect)` then
solves the distance that frames the dragon on BOTH axes — width needs more distance in portrait
(horizontal FOV = `aspect × vertical`), clamped `[11, 30]`. Result: phoenix's wingspan clears with margin,
the starter is sized heroically (the min-clamp fixes the earlier "too small"), every form self-fits — and
it re-fits free on resize/orientation (the fit reads live `camera.aspect`).

**Still deferred (lower value):** the 8-yaw skyFraction calibration sweep and drag-to-rotate — the fit +
bounded sway deliver the actual complaints. **Verification gotcha:** software-WebGL headless renders are
~60-90s/frame; use a run_in_background waiter that exits on the last file OR the process dying (a naive
`until [ -f png ]` hangs forever if the render crashes).
