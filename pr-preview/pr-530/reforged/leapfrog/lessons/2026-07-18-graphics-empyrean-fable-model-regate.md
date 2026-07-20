# THE EMPYREAN — the Fable-MODEL re-gate of the shipped systems (atmosphere + water + Mote)

**What we did.** Re-gated the already-shipped Empyrean atmosphere (PR-1), nacre water (PR-2) and Mote
(PR-3) on the **actual `claude-fable-5` model** (the earlier passes had run the harsh-critic subagent on
Opus). Fable's eye is meaningfully harsher and it MACHINE-SAMPLES (9×9 patch means, hue/S/V, star census,
disc-contrast) — so it caught measurable defects Opus waved through. Results:

- **PR-2 nacre water — 4.4/5 PASS** first try (Opus never gated it). One advisory: add a second
  iridescence hue → implemented (below) → re-gate **4.4/5, advisory satisfied**.
- **PR-1 atmosphere — 3.5/5 REVISE.** Machine samples: nebula blooms ~0.01 S over base (**effectively
  absent**, an order of magnitude under the S≤0.30 budget), **zero** countable stars, base sky S 0.034
  (near-neutral "concrete"). Sun-kill 5.0 and fog 4.5 were clean and left untouched. **Repainted → 4.4/5
  PASS.**
- **PR-3 the Mote — 3.4/5 REVISE** (limb absent, ~half the 4–7° spec size, a spire notches it at the hero
  sightline, interior star-fleck leak-through). **Owner chose to leave it as-is** (fix deferred to a future
  boss/Mote pass); atmosphere was the owner's pick.

**THE HEADLINE LESSON: "Fable gate" means the Fable MODEL, not Opus wearing the persona.** Running the
critic on Opus silently lowered the bar on every gate this repo's convention depends on. Opus passed the
props (4.3/4.3) that Fable then REVISED (3.4/3.7); Opus "passed" the atmosphere that Fable measured as
near-absent. **Always spawn the gate with `model: fable`.** Give it exclusion masks (dragon mount /
sentinel-blade edges / HUD / the pre-existing boss arch) so its machine census doesn't false-positive on
non-subject pixels — Fable will honour them and even self-discount edge artifacts.

**The ACES-on-a-bright-field trap (why the blooms read as "absent").** A saturated pastel (source S≈0.30–0.37)
painted over a bright pearl sky (V≈0.9) loses ~75% of its chroma to the ACES tonemap — it renders at S≈0.05.
You cannot win the **≥0.10 ΔS** criterion this way without going bold (forbidden — bold nebula is the boss's).
The fix is Fable's own **OR ≥25° hue** clause: place the two blooms on OPPOSITE hue sides of the base
(magenta-rose ~318° + blue-violet ~253°, base violet ~270°) so each clears hue-separation even after the
tonemap eats saturation, and they're tellable apart at a glance. Coverage/opacity must be high enough that
the hue READS instead of washing back to the base (raise the body-floor `dens`, widen the radial falloff,
keep the near-white core to ONLY the densest knots — blending halfway to a white core everywhere was the
original wash-out).

**Cheap-tell watch while pushing pastels (both caught pre-gate by eye + the sampler):**
- A faint rose bloom **drifts peach/salmon** at its low-coverage edge → keep B ≥ G in the rose color (and
  core B ≥ R) so it can't warm. Warmth is a hard theology fail; Fable audited 52k px for 0 warm.
- A blue bloom with **G ≥ R drifts cyan/green** when tonemapped → keep R ≥ G so it stays violet. Green is cut.

**Stars: a relative add dies on a bright field.** The shipped "add ∝ local luma × (1−luma)" made stars
+0.12 over a 0.85 sky — invisible, and at 0.99935 density there were ~0 anyway. Fix: density 0.99935→0.9960
(still "dozens not thousands") + a CLEAR pearl step over the local sky, with the fade confined to the
brightest band only (`clamp((0.96−luma)/0.16)`), not linearly across the whole dome. Note the twinkle: an
instantaneous capture samples one phase, so the machine star count flickers run-to-run — judge presence,
not an exact count (tell the critic this).

**Nacre needs a SECOND interference hue to stop reading as "violet satin" (PR-2 advisory).** The primary
band (rose↔lilac↔periwinkle, view-driven) rendered mono-violet because the rose was under-represented and
all three stops are the same violet family. Adding a **broad, low-frequency second order keyed to
`vWorldPos.xz`** (not view angle) makes the surface cross between periwinkle-violet and a soft cool rose
across its EXPANSE — along-surface zones that read as FORM. ΔH only, S≤0.30, sourceless, off green+gold,
softer than the primary band. Caveat Fable flagged (non-blocking): nacre is grazing-weighted (`pow(1−NdotV,
1.7)`) so it's intentionally faint in the near-field — the rose lives mid/far where it co-reads with the
pink fog; a near-field rose zone would need lifting the grazing floor, which risks the glitter-kill balance,
so it's left as future polish.

**The capture harness fight (and the fix).** The chase-cam controller reasserts the camera EVERY rAF even at
`timeScale 0`, so `camera.lookAt`/pitch was silently overwritten — every "sky" capture was actually
cruise-level (the old `_empyshot sky` never looked up). Fix: monkeypatch `window.__dd.cameraCtl.update =
() => {}` after freezing, THEN aim freely (`tools/_empyregate.mjs`). It also bakes a Fable-style HSV/star
pixel sampler — but that sampler is only a rough guide (it can't locate bloom cores blindly, and the star
count is twinkle-phase-noisy); trust Fable's own census for the verdict.

**Verify.** All changes stay behind `empyMix`/`nacreMix` (default 0 → byte-identical): gold-determinism +
skyprobe byte-identical, biomecycle 12/0, appshell no console errors, bulletcontrast pass. PR-1 4.4/5 PASS,
PR-2 4.4/5 PASS on the Fable model.

**What it unlocks.** The two owner-picked systems now hold the Fable bar. Open future-polish notes (all
non-gating, logged not lost): lift base sky S 0.065→0.09 for free headroom; bias one nacre rose zone into
the near-field; and the whole **PR-3 Mote** REVISE (build the pearl limb, 1.6–2× size into 4–7°, enforce the
easement cone in 3D so no spire notches the hero sightline, solidify the interior vs star leak-through, and
the roster-owner flag that the player dragon currently out-darks the biome's one true-dark object).
