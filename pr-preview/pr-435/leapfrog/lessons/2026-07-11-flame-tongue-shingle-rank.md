# "Sharp pikes" and a "basic wing that doesn't blend" are the SAME bug: point-tapered atoms + a sparse non-overlapping rank — fix the ATOM (lobe tip) and add a SHINGLE-BY-CONSTRUCTION rank

**Did.** The owner shipped-then-reopened the reforged fire phoenix: *"good bones, but the feather
flames read as sharp pikes, the wing feels basic and doesn't blend, the tail looks basic."* Ran the
mandated **Fable design-director → plan → per-checkpoint harsh critic** loop. Result: the wing went
from "solid membrane cap + a row of separate spike-teeth" to a **dense layered fiery vane**, the tail
from a lone central spike to a **braided comet-train**, and the critic scored it **4.5/5, all three
complaints ADDRESSED, clear improvement** (up from the 4.2 it had shipped at). Two new reusable pieces
banked: **`flameFeather` v2** (a backward-compatible options arg) and **`flameRank`** (a
shingle-by-construction helper).

**Learned #1 — "pikes" is a property of the ATOM, and it's a one-line width-profile fix.** The
flame-ribbon primitive tapered its width to a mathematical ZERO point (`·pow(1-u,0.5)` → 0 at the tip)
over only 4 segments, so every feather's last quarter was a dead-straight wedge collapsing to a
needle. On the long tail ribbon that terminal wedge was ~1.4 world units of pure spike — the single
biggest pike on the model. Fix: an opt `tipW>0` switches the profile to a **leaf/tongue** that keeps a
rounded lobe of width `tipW·wid` at the tip (belly-to-`wid` via `sin`, no `pow`), closed with a short
wide 2-tri cap → a licked flame lobe, not a point. Kept `tipW=0` as the default so every existing call
(mane, flank coat) stays **byte-identical** — verified by an unchanged roster tri-total. Also added
`seg` (5–6 makes the S-curve actually render as a curve, not a piecewise spear) and a terminal lateral
`flick` (signed, alternated by index → a rank's tips SPLAY instead of aiming in parallel, which is what
sells "licking flame" over "weapon rack").

**Learned #2 — "doesn't blend" = there was no blending RANK, and overlap must be guaranteed BY
CONSTRUCTION, not hand-tuned.** The wing was literally two objects: an opaque membrane ending in a
STRAIGHT hem, and one sparse rank of feathers whose gaps exceeded their widths at the exit line (sky
visible between them). Three moves fixed it, and they generalize:
- **A shingled covert rank that overhangs the hem** turns the panel's trailing edge into a *scalloped
  flame* edge — pull the membrane hem IN (0.90→0.78) and let the covert lobes BE the new edge, so no
  straight cut line survives anywhere.
- **Two main ranks at HALF-PHASE span offsets** (long + short) roof each other's gaps → a continuous
  long/short flickering vane instead of teeth.
- The overlap is guaranteed by a helper, `flameRank(n, rootAt, dirAt, side, lenAt, rampAt, opts)`,
  whose contract is **`width(u) = local root-spacing / (1−ovl)`** — pass `ovl=0.55` and adjacent lobes
  interleave by construction regardless of how the root curve is spaced. This is the ≥55%-shingle rule
  (banked earlier for kite-feathers) finally living in ONE place; the wing coverts AND the tail root-fan
  both call it.
- **The gradient hand-off rule:** a feather's segment-0 material = the material of the surface it roots
  on (membrane cell / body ember), so roots DISSOLVE into their substrate and only the free tips read
  as distinct flame. Cheap, and it's what makes the layers read as one mass.

**Learned #3 — elaborate ≠ longer; elaborate = HIERARCHY + a second axis of spread.** The "basic" tail
was N near-identical ribbons in one flat plane spread only ±0.15 in x. The comet-train that reads as
"elaborate" has: a root covert FAN (so it grows out of the body, not a bare point), a **dominant centre
head**, graded flanks, a **lower tier splayed WIDER in x** (real planform braid, not parallel wires),
and a few fine **filament wisps** shearing off — i.e. structure at three scales. Same corridor/pink
constraints as before (level `dir.y=0`, gentle downward belly, broad ribbons on the moderate-intensity
ember ramp, only thin wisps on hot `hotRibbon`).

**Gotchas (each cost a render):**
1. **A pure-emissive lobe cap on a structural finger reads as a "blunt pale sausage."** The fix wasn't
   colour — it was making the sheath **longer than the finger and tapered** (small `tipW`) so flame
   licks PAST the bone tip instead of capping it.
2. **A wavy, span-heavy heat coordinate turns a membrane into rectangular "confetti."** Make the heat
   coord **monotonic and chord-weighted** (`0.72·f + 0.34·t`) → bands run streamwise (parallel to the
   flow) and read as heat streaks, not a checkerboard.
3. **`tipW=0` wisps are needle "forks."** Even sparks want a tiny lobe (`tipW≈0.14`).
4. Process: the tail's `covertN` knob had been **computed and never used** (a dead knob) — reactivating
   an existing ladder dial is cheaper than inventing a new one. And (again) the shell cwd resets to repo
   ROOT between Bash calls — a `2>&1 | tail` pipe HIDES the resulting `MODULE_NOT_FOUND` because the
   pipe's exit code is `tail`'s success, so `&&` chains march on over a silently-failed render. Always
   `cd /…/reforged && …`, and don't trust a green `&&` chain that pipes node through `tail`.

**→ Unlocks.** `flameFeather{tipW,seg,flick}` + `flameRank{ovl}` are a **reusable "plumage from fire"
kit**: any procedural feather/flame/fur surface can go from separated pikes to a blended overlapping
vane by (a) giving the atom a lobe tip and (b) laying it with the spacing-driven shingle helper — no
per-call width tuning. The "cap + teeth → covert-scallop + half-phase double rank" recipe is the
general cure for "reads as a solid panel with attachments."
