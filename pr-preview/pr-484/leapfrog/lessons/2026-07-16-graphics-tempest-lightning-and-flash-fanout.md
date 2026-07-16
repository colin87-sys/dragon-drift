# Tempest lightning — the strike, the flash fan-out, and two gate gotchas

**What we did.** Built Tempest Reach's signature hazard: forked lightning bolts + a flash that makes
the whole rain volume exist for a beat. Fable-gated to **SHIP-VISUAL (4.1→4.3)** in two revise rounds.

## The build (device-safe: bolts are 3-pass LineSegments, no billboarded quads)

- **Bolt** (`js/stormLightning.js`): jagged cloud→sea trunk (10 joints, midpoint-displaced, drifting
  downwind so it lives in the storm's wind), 3–5 branches in the upper ⅔, one recursion level. Three
  offset passes → core→bloom→dark: white `#ffffff` core, `#cdd6ff` inner bloom, `#8fa8ff→#a98bff`
  violet halo. **Sea contact is not optional** — a glare streak + expanding splash ring at the base;
  a bolt that dims to nothing near the water reads as terminating mid-air (the #1 fake tell).
- **Flash** = one event, five differently-tuned responses off a **dual-decay** envelope (sky τ≈80ms,
  rain τ≈140ms — the rain lingers a beat, which is what reads as "inside weather" not a blink). The
  sky lift is directional toward the strike, held off the deck; the rain streaks (`setRainFlash`) +
  far veil (`uRainVeilFlash`) reveal on the rain envelope; re-strokes re-kick the flash.
- **Two bolt classes:** hero (off-lane, gust-driven, partial flash) + lethal hazard (two-stage
  magenta telegraph → bolt + full flash, dodge-only cylinder, deterministic `overlayBiomeHazards`
  placement). The lethal path reuses the geyser lifecycle pattern in `hazards.js`.
- **Teal held in reserve** for STORMREND (zero pixels in the teal hue window) — so his bolts can go
  teal-cored later and land as "the storm's weapon was his all along."

## Gotcha 1 — the TRUNK must NOT taper (only branches do)

Round 1 tapered the whole channel 100→70% toward the sea, and the bolt read as **terminating
mid-air**. Real lightning's return stroke is *brightest at the contact channel*. Fix: the trunk holds
≥85% brightness to the water; only branches taper. One constant (`te = branch ? t : t*0.15`), and the
mid-air-termination read died.

## Gotcha 2 — a coverage-relaxed cap silently misses its target

The deck-silhouette cap `min(col, mix(0.82, 0.45, cCov))` was correct *as coded* but the `cCov`
(cloud-coverage) term **relaxed the cap wherever coverage was partial** — measured top-8% band L
0.60 vs the 0.45 directive. Two lessons:
1. **Cap by the robust signal, not the incidental one.** Switched to capping by view height `h` (the
   storm ceiling owns the upper sky) — and, because the headless camera frames the pale horizon band
   near the top (so a pure height cap still measured high), *also* eased the flash's own upper-band
   lift (`_fband` peaks near the horizon, falls toward the zenith) + lowered the peak mix 0.55→0.38.
   Result: top-8% band 0.60 → **0.417 ≤ 0.48**, and the flash still reads dramatic.
2. **A gate metric can measure the wrong region.** The headless capture's camera angle put the pale
   slot (legitimately ~0.6) in the top-8% band, not the dark deck — so the number lied about the
   deck. When a machine gate won't move as you tune the obvious lever, *view the frame* and check the
   metric is sampling what you think. (This is why Fable's "measure, don't eyeball" still needs a
   sanity look at what's being measured.)

## The measure-don't-eyeball gate method (reusable)

Fable gated round 2 by running pixel checks on the captures: core cross-section luminance profile
(single-peak = no tramlines), teal-hue-window pixel count (=0), white-out fraction (≥250 = 0%), and
the top-8% band mean (the deck cap). A `?boltcap` debug pin (pins a lit channel + peak flash) makes
the transient strike/flash **capturable in a still**; a 3-line Python luminance-band script makes the
deck cap **machine-verifiable without a critic recapture**. Bolts otherwise flicker too briefly for a
single headless screenshot to catch.

Deferred to the owner's device video (a still can't show them): telegraph readability at speed,
dodge/collision feel, flicker cadence + anti-metronome timing, the dual-decay "eye adjusting" beat,
gust coupling, thunder-on-beat, tier-2 degradation, photosensitivity comfort (all caps are one-line
dials), and the violet halo hue (1px additive lines don't survive software-GL downscale). Backlog:
squall-cell placement clustering, thunder audio, the splash-ring rim alpha falloff.
