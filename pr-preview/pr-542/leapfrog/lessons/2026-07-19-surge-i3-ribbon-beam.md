# 2026-07-19 — SUNBREAK I3: the beam is an anatomy (ribbon witch-hat + the power stays home)

**Did / learned.** Replaced the two-cylinder magenta Surge beam (the onion-ring tell) with the full
§E anatomy — checkpoint critic **PASS 4.4/5** after one revise round (4.0 → 4.4). The build:

1. **The shaft is a camera-facing RIBBON, not nested tubes.** Cylindrical billboard in the vertex
   shader (expand perpendicular to the beam axis AND the view ray — no seam, no end-cap, reads at
   every angle); the fragment paints the 3-band value law across the WIDTH as a **witch-hat**
   greyscale cross-section (dark wrap → graded bloom → a 4-5px near-white core, strictly monotone
   per side — a ridge = an onion ring). The critic measured the scanline: `47,95,142,244,250,250,
   248,191,153,85` — "the best witch-hat in this repo's captures." Streak-noise (seeded mulberry32
   DataTexture, directionally blurred along the scroll axis) flows down the length; a discrete
   surge-pulse traverses muzzle→impact every 0.4s.
2. **Beam LIFE as pure samplers.** Birth-extend (core races out 110ms easeOut with a 5% tip
   overshoot, bloom lags 16ms, outer fills 150ms — never instant), per-layer incommensurate wobble
   pairs (1.83/2.51, 4.3/7.1, 11.3/13.9 Hz — every ratio's fraction in [0.15,0.85], verified by an
   actual DFT in the test), core-LAST collapse (outer 50% at 60ms → bloom 140ms → core pinch-pop
   225ms, dead 260ms). All exported as pure functions (`surgeBeamExtendAt/CollapseAt/PulseAt/
   WobbleAt`) so tests measure at 1ms resolution, frame-clock-free (the I2 lesson, again decisive).
3. **THE REAR-CHASE ANCHOR — "the power stays HOME."** The beam fires AWAY from the camera, so the
   read must never be "energy leaves us and shrinks." Fable's pre-assess ruling, all landed: the
   MUZZLE is the climax element (a 3-layer radial gather — dark socket → value-lifted hue petals →
   near-white core that SNAPS WHITE at the lock); a recoil kick (~0.24u back over 80ms); embrace
   the perspective taper (never widen the far end); the travelling pulse carries "power delivered."
   Verified: muzzle:impact bright-area dominance **4.26×**.
4. **THE ULTIMATE DUCK (the revise round's technique fix — withheld-glow at ultimate scale).** The
   apex initially FAILED greyscale: the ambient cascade's whites outshone the muzzle gather 237px
   vs 65px at the lock moment. Fix: while the beam cinematic runs, the dragon's ambient cascade
   damps to ~55% (boss publishes `game.surgeUltimatePhase` → player mirror → dragon), restoring
   after. **A climax element must never compete with its own supporting cast** — duck the roster
   so the hero moment owns the frame. Reset hygiene at every teardown site (a death/reset must
   never strand the duck).
5. **Value-first or invisible.** The petals read as hue-only (60dn vs the socket's 65dn) — pure
   violet on dark, invisible to the colorblind owner. Value-lift the mid-zone (lerp 0.35 → white):
   measured 3-zone radial 242/106/40dn. Same law for impact sparks (≥230dn to separate from the
   boss's 160-180dn rubble). Hue is decoration; luminance is the message. Every ensemble layer
   needs its own value BAND, not just its own hue.
6. **Budget honesty (§M.1-2/3 closed).** The impact spark cluster is ONE THREE.Points draw
   regardless of the `particleBatch` flag (the shipped pool is 1 DC/sprite — 40 pool sparks would
   be 40 DC); the legacy strikeSurge (24+18) and breakShield (26+20) pool bursts are DELETED —
   replaced, never stacked. Shaders prewarm at boot (`renderer.compile` — no first-cast hitch).

**Test-harness gotchas (each cost a debug round):**
- `renderer.info` auto-resets per composer PASS — a naive read always says "1". Accumulate with
  `autoReset=false` across one full frame.
- A DC delta across distant samples measures the SCENE (bullet volleys spawn dozens of DC), not
  the beam. Toggle the beam's own visibility via a dedicated `__ddSurgeHide` seam in adjacent
  frames (the updater re-asserts visibility every frame — only a seam can hold it off), min of 3 pairs.
- The game can PAUSE itself mid-poll — a paused duck is CORRECTLY frozen (time stopped); the test
  must unpause, not the code change.
- Read short-lived ensemble state (sparks live ~0.4s) immediately after the pin, before slow blocks.
- A DFT peak-finder's "distinct peak" threshold must be finer than the closest real sine pair.

**→ Systematize.** The witch-hat-across-width ribbon + pure-sampler life + ultimate-duck +
value-banded ensemble is the reusable BEAM KIT for any future breath/laser/ray. The "power stays
home" grammar (near-element climax, taper embraced, pulse = delivery) is the chase-cam projectile
law, paired with I2.5's depth-axis cascade law. The critic's self-correction this round (its
round-1 "diamond" was a world pickup gem, not a cascade station) also shows why the revise loop
resumes the SAME critic — context lets it audit its own attributions.

**→ Leapfrog.** The beam now has an authored anatomy but fires inside the OLD 1.05s timeline
(CHARGE 0.5s / BEAM 0.55s, scaled dt). I4 is where it becomes the payoff: the rawDt conductor,
GATHER convergence, the held-breath APEX on the (now roster-grade) mandala gather frame, release
hitstop/FOV/flash, and the compressed-repeat rule. Owner dials handed off: wing-spar tip dashes
≤200dn during the ultimate; sustain ring band ~210dn cap; tail-streamer duck. Play-verify: pulse
rhythm in motion, recoil feel, collapse order, duck restore smoothness.
