# EMPYREAN uplift PR-A — VALUE STRUCTURE + WORLD PULSE (6 rounds; the probe-before-critic law)

**What shipped** (one `empyStruct` default-0 gate; owner-approved theology amendment): the 3-TIER VALUE
SCHEME — off-corridor sky + water + FOG drop toward dusty violet (full depth by ~39° azimuth, deepened
at the sky-water line), a bright ~±25° corridor holding the Mote bearing (per-column the zenith still
wins → the inversion survives); the disc's 8s ROSE pulse-ring (world-locked foot latched CPU-side per
pulse, expanding 34 m/s past the player); the centerline mirror-smudge (~L55, 2nd-darkest in frame);
6 rim ORBITERS; interference-phase drift; one sky ribbon. Gate: **4.0→4.1→4.1→4.1→4.0→4.3 PASS.**

**THE BIG LESSON — machine-probe the contested number BEFORE spawning a critic.** Rounds 4 and 5 both
burned on the SAME claim ("the ring is rose now") that died before the framebuffer. The fix that ended
the loop: `structProbes()` in the burst rig — sample the ACTUAL rendered pixels (quarter-frame flank
delta %, moving-R>B pixel count between frozen frames) and iterate the numbers to green locally (3
cheap re-bursts) before the expensive critic round. A critic verifies; it must not be your first
measurement. (This is `_empyregate`'s "measure locally → converge → THEN gate" law re-learned at the
shader level.)

**Fog compositing eats pre-fog hue.** At 100–300m the manual fog mix replaces 50–77% of any surface
tint — two "rose" multipliers rendered wake-blue because they were applied before `col = mix(col,
fogCol, fogF)`. ANY hue that must read at distance goes POST-fog (or into the fog colour itself — the
flank darkening needed exactly that: darken `fogCol` off-corridor, or the far rows repaint bright).
Corollary: the grazing satin sheen was silently REBUILDING the waterline highlight the flank drop kept
dying under — when a measured delta won't move, look for the *other* term feeding the same pixels.

**The freeze saga (capture engineering).** To PROVE world motion you need a camera-static sequence:
`timeScale=0` alone does NOT stop `player.dist`, and the juice/hitstop system restores timeScale on its
own clock — pin `player.dist` AND re-assert `timeScale=0` in every evaluate, then settle ~900ms before
frame 1 (the chase-cam eases). Verify the freeze with an in-tool pixel-diff, never by assumption. Also:
patcher discipline — TWO silent no-op patches shipped judgeable builds missing half the change (python
`replace` on a drifted target + a `sys.exit` mid-script); every patch now asserts its target and
re-reads the file after writing.

**Numbers that landed:** flankDelta 15.4% (bar 15), movingRose 1625 (bar 400), dark budget ≤0.036,
zero warm/green pixels, corridor floor +43–50L over flanks.

**What it unlocks.** The value hierarchy + emanating-motion foundation the 5.5 re-score demanded; the
probe pattern for PR-B/PR-C; next: PR-B monolith kit rebuild (two-tone corridor faces — the second
owner-approved amendment), then PR-C flanks/ring-gate, then the exit re-score.
