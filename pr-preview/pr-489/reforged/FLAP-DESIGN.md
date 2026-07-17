# FLAP-DESIGN.md — the wing-flap animation playbook

**Audience: the next session tuning (or building) a dragon's wingbeat.** This distills the arc
that took the Thunderhead Tempest's flap from an owner "it just feels like one plank that's
flapping" to a Fable-gated **4.6/5** shoulder-led beat with a real articulated wrist. It teaches
the METHOD and the dial vocabulary, not one dragon — every law here is shape-agnostic. Read THIS
before you touch flap motion; don't re-derive it from the ledger.

Companion docs: [`DRAGON-DESIGN.md`](./DRAGON-DESIGN.md) (the creature playbook — the wing KIT that
builds the geometry this rig moves; the `−anchor` + mirror rigging gotcha lives there too).
The rig code is `js/dragon.js` (live flight) + `js/wingDebugPose.js` (the freeze/studio poser) —
**they must be edited in lockstep** (§2). The dials live per-dragon in `js/dragons.js`.

---

## 1. The one-paragraph model

A premium fingered wing is **not one flapping plank** — it is a **3-segment hinge** that beats from
the shoulder with the outer wing TRAILING, so the wing **curls and uncurls** through the stroke.
The shoulder swings a big ~12→5 o'clock arc; the forearm and hand each LAG it, so at any instant the
wing is an articulated curve, not a rigid blade. Get the arc big, get the lag deep, and get the fold
to read **in the silhouette the chase camera actually sees** — that last one is where most of the
craft is, and where the Tempest spent three of its four gate rounds.

---

## 2. The rig — a 3-segment articulated wing (`model.wingParts: 3`)

The `wingParts` poser (in both `dragon.js` and `wingDebugPose.js`) drives three nested nodes per wing:

```
pivot  (SHOULDER)  →  mid  (FOREARM)  →  tip  (HAND)
```

- **Geometry split.** The short arm + inner membrane (propatagium/brachial) ride `mid`; the whole
  outboard fingered hand + the big chiropatagium ride `tip`. With a low `wristT` (Tempest 0.24) the
  **hand is ~76% of the wing** — so when `tip` folds, most of the wing moves. That mass split is what
  makes the fold read; a wing that folds only its outer 20% still looks like a plank.
- **The wrist fold is tear-free by construction.** `tip.position = +K` (the wrist knuckle) and
  `hand.position = −K` inside it (the `−anchor`), so the assembled REST pose is byte-identical and the
  hand rotates ABOUT the wrist. The membrane is welded across the shared wrist edge, so a fold hinges
  cleanly — **it cannot tear no matter how deep the fold.** (Do NOT add per-strut "crackle" blade
  pivots to a welded membrane — they tear it. The whole-hand fold IS the in-wing motion.)
- **The mirror.** The left wing is built inside a `scale.x = −1` wrapper; the poser sets the SAME
  logical rotations on L and R and the wrapper mirrors them. **Never** introduce a per-wing sign — if
  a term mirrors correctly for the existing `tipSweepBase` (rotation.y), it mirrors correctly for
  yours. Verify with `wingsymprobe` (§6), which must read **Δ0.000**.
- **Lockstep.** `wingDebugPose.js` is a faithful port of `dragon.js`'s `poseWing`. Every dial you add
  goes in BOTH or the studio/flapstrip captures diverge from live flight and every gate is a lie.

---

## 3. The waveform + the dial vocabulary

The core waveform is a **glide-hold sinusoid**:

```
shape(ph) = sign(sin ph) · |sin ph|^glidePow
```

`glidePow` is the single most important character dial:
- **High (≥1.9):** holds the broad glide pose and pulses rarely — "commands the air" (Vesper 2.2).
- **~1.0–1.15:** beats CONTINUOUSLY, near-sinusoid — an active, powerful flyer (Revenant 1.15).
- **A high glidePow with no apex lift is THE PLANK** — it holds one pose and tilts. If the owner says
  "it feels like one plank held in a glide," `glidePow` is your first suspect.

Each segment reads `shape(phase − lag)`; the apex V-lift reads `apexUp(ph) = max(0, −sin ph)^0.7`
(peaks at the top of the upstroke). The dials, per `model`:

| Dial | Axis | What it does |
|---|---|---|
| `rootAmp` | shoulder z | main flap swing (the arc size). Sets the downstroke depth. |
| `apexRoot` | shoulder z | V-lift added at the TOP → raises the recovery toward 12 o'clock. Tune this for arc-top, NOT `rootAmp` (which also deepens the downstroke). |
| `midAmp` / `tipAmp` | forearm/hand z | the lagged flap of each distal segment — the wrist/elbow FOLD magnitude. |
| `midLag` / `tipLag` | phase | how far forearm/hand TRAIL the shoulder (radians; cycle = 2π). Deep lag = the hand never aligns with the forearm at the extremes. |
| `glidePow` | — | glide-hold vs continuous beat (above). |
| `restLift` | shoulder z | constant dihedral so the glide pose reads as a gentle V, not flat. |
| `apexMid` / `apexTip` | forearm/hand z | apex V-lift on the distal segments (small; forms the V tip at the top). |
| `apexPitch` | fore-aft x | optional nose-down pitch coupled to the apex lift. |
| `tipApexSweep` | **hand .y (in-plane)** | **THE recovery-visibility dial** — see §4. Sweeps the hand AFT in the wing's plane at the top of the upstroke so the fold reads from the rear camera. Defaults 0. |

All are opt-in (`?? 0` / `?? 1`) — a dragon with no apex config flaps a plain arc, roster unchanged.

---

## 4. The design laws (the failure modes, in the order they bite)

**LAW 1 — Big arc = `rootAmp` + `apexRoot`, shoulder-led.** The owner's target was Revenant's
"shoulder → ~12 o'clock → ~5 o'clock." `rootAmp` gives the downstroke depth (~5 o'clock); `apexRoot`
lifts the recovery toward vertical (~12). Push the arc from the SHOULDER; the distal segments follow.

**LAW 2 — Deep lag so the hand NEVER aligns with the forearm at either extreme (this is "not a
plank").** With a shallow lag the three segments arrive at the reversal points together → a rigid
blade that tilts. Deepen `tipLag` (Tempest 2.1 rad ≈ 33% of the cycle) so at the 12 o'clock apex the
hand is still in its downstroke (droops/trails) and at the 5 o'clock bottom it still trails high. The
fold then TRAVELS out the wing like a real wingbeat. Tune by dumping per-segment relative angles at
the freeze phases (a pure-math port of the poser — no render needed) and confirm the hand sign
FLIPS relative to the forearm between top and bottom.

**LAW 3 — THE DEPTH-PROJECTION TRAP (the load-bearing law).** A wrist fold about the FLAP axis (z) is
**invisible at the top of the upstroke**, because there the wing is near-vertical and that fold axis
points almost straight at the chase camera — the articulation projects into DEPTH, not silhouette.
The Tempest computed a correct −9° wrist reversal at recovery and STILL read as a straight blade.
**Cranking fold amplitude never fixes this** — it deepens an invisible fold and makes mid-stroke
floppier. The fix: **change the fold's AXIS at the pose where it's invisible.** Add an in-plane wrist
SWEEP (`tipApexSweep`, on rotation.y) driven by the shoulder's UNLAGGED apex (`apexUp(phase)`, which
is high at recovery) so it blends in only near the top and sweeps the hand AFT in the wing's plane —
turning the depth-fold into a **dogleg the rear camera sees.** General rule: **match the articulation
axis to the silhouette the money camera sees at that pose. Craft that projects into depth is craft the
player never sees.**

**LAW 4 — Amplitude has a visibility FLOOR and a taste CEILING.** A phase-correct fold of a few
degrees is real in the spreadsheet and a **plank on screen** — ~2° over a 100px hand is ~4px,
swallowed by strut noise at gameplay distance. But the whole roster's glide-wings use tiny distal
amps (Revenant `tipAmp` 0.09); going 10× reads as a **rubber hose**. The window that reads as a living
wrist without floppiness was Tempest `tipAmp ~0.8`. Always render the MID-stroke pose (not just the
extremes) to check the deep fold isn't floppy before you ship the amplitude.

**LAW 5 — Banking is POSE BIAS ONLY, never an L/R phase delay.** Both wings share the ONE flap phase
and identical internal lag; a turn biases the pose (inside brakes/tucks, outside powers/opens). An
L/R phase offset reads as a broken, off-beat flap. (Already enforced in `poseWing`; don't undo it.)

---

## 5. The tuning recipe for a new dragon

1. Start from the reference set closest to the FEEL you want (§7). Copy its dials.
2. Set the arc: `rootAmp` for downstroke depth, `apexRoot` for the recovery height (LAW 1).
3. Set the character: `glidePow` (~1.1 active / ≥1.9 majestic glide) + `restLift` for the rest V.
4. Set the trail: `midLag`/`tipLag` deep enough that the hand sign flips between top and bottom
   (LAW 2). Verify with the pure-math segment dump.
5. Set the fold magnitude: `midAmp`/`tipAmp` into the visible-but-not-floppy window (LAW 4).
6. **If the recovery still reads flat from the rear camera, it's LAW 3** — add `tipApexSweep`
   (~0.26 gave the Tempest a ~42° projected dogleg) until the recovery frame shows a clear
   two-segment leading edge. Do NOT just add more fold amplitude.
7. Verify + gate (§6). Byte-identity of the rest of the roster is automatic (dials are per-dragon;
   the new axis defaults to 0 elsewhere) — but run `wingsymprobe <key>` and the flap suites anyway.

---

## 6. The verification harness (and: trust GEOMETRY over a critic's pixels)

- **`node tools/wingsymprobe.mjs <key>`** — poses every freeze state headless and checks the L/R
  world-vertex clouds are true mirror images. Must read **Δ0.000**. This is ground truth for symmetry.
- **`node tests/wingflap.mjs` / `tests/flapcheck.mjs`** — the flap assertion suites (must stay green).
- **Render the beat from the chase cam:** the one-phase-per-process render tools boot the real game
  and freeze at a `?wingDebug=<glide|recovery|apex|downstroke|settle>` pose. In this env a single
  browser boot is ~3 min and the 5-boot flapstrip crashes the shared browser on the 3rd boot — render
  ONE phase per node process, **detached with `nohup`** (a mid-turn message kills a foreground job),
  and **commit+push the dial change BEFORE rendering** (a container reclaim can reset the branch to an
  older clone; the remote is the only backup).
- **Clean-background measurement:** the in-game scene background makes edge-extraction on one wing
  unreliable. To measure the dogleg noise-free, shoot the SAME wingDebug state on the neutral STUDIO
  stage (`dsRender({state:'recovery', bg:'pale', angle:'rear'})`) where both wings sit against a flat
  backdrop.
- **THE META-LAW — a verification that fails should first be asked "is the MEASUREMENT trustworthy?"
  before you "fix" a bug the ground truth says isn't there.** A Fable gate once reported a stark
  wing asymmetry (one gull-wing, one plank) and confidently diagnosed a mirror sign-bug — predicting
  the exact numbers. A direct dump of the posed world coordinates showed the wings mirror-identical to
  3 decimals; the "asymmetry" was the critic's own noisy edge-extraction on the dark-background wing.
  When a critique is contradicted by exact geometry AND its failure was on data it flagged as noisy,
  **the geometry wins — then remove the confound (re-shoot clean) rather than argue.**

---

## 7. Reference dial sets (from `js/dragons.js`, apex forms)

| Dragon | Feel | `rootAmp` | `apexRoot` | `midAmp`/`tipAmp` | `midLag`/`tipLag` | `glidePow` | `tipApexSweep` |
|---|---|---|---|---|---|---|---|
| **Vesper** | majestic glide, rare heavy pulses | 0.62 | — | 0.34 / 0.55 | 0.45 / 1.0 | **2.2** | — |
| **Revenant** | continuous shoulder-led ~150° beat | 0.72 | 0.17 | 0.14 / 0.09 | 0.7 / 1.1 | 1.15 | — |
| **Tempest** | big arc, maximally articulated wrist | 0.80 | 0.30 | 0.32 / 0.80 | 1.05 / **2.1** | 1.1 | **0.26** |

(Vesper also carries `restLift` 0.05 / `apexMid` 0.10 / `apexTip` 0.22; Revenant `apexMid`/`apexTip`
0.04; Tempest `restLift` 0.03 / `apexMid` 0.08 / `apexTip` 0.12.)

---

## 8. The gate (owner process)

The owner judges FEEL on the live PR preview — but every flap change is gated by a **fresh harsh
Fable critic** first (the builder never judges own motion). Brief it in NEUTRAL terms so it can catch
a misread, not ratify yours. The measurable pass test the Tempest converged on: **fit two lines to the
leading edge in the recovery frame; the projected angle between the arm segment and the hand segment
must be ≥12° from the chase camera** — the difference between a "bump" and a real dogleg. Score bar is
the owner's usual **≥4.2/5**. If the critic REVISEs, resolve WHY (amplitude? axis? measurement noise?)
before touching a dial — the Tempest's biggest wins came from correctly diagnosing the depth-projection
trap and a false-asymmetry, not from turning knobs.
