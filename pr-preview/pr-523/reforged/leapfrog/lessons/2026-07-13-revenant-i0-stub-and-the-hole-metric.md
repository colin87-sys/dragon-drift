# Revenant I0 — coexist the stub, land the tool, PROVE byte-identity (don't eyeball it)

**What we did.** Ran increment I0 of the Gravelight Revenant build (WRAITH-GRAVELIGHT §B / the
HANDOFF digest): the additive `revenant` roster key, a fresh `js/dragonRevenant.js` with four
contract-satisfying chalk-ivory PLACEHOLDER builders (`ossuaryTorso` · `phalanxShroudWings` ·
`revenantSkullHead` · `vertebraeWhipTail`), and the silhouette **hole-metric** tool
(`holeMetric()` in `tools/silhouetteCore.mjs` + `--holes` on `silhouette.mjs`). No real bone yet —
I0 is scaffolding + tooling + calibration, and every increment after this fleshes GEOMETRY without
rewiring the contract.

**The reusable pattern — a premium coexists in four moves, mirror Vesper exactly.** A new procedural
dragon is NOT "edit the god builder"; it is a self-registering module + a roster row:
1. Four builders, each `register{Torso,Wings,Head,Tail}('name', fn)` at import time, in a module that
   imports ONLY `three` + `dragonRecipe` + `mechaKit` (the no-organism-import firewall, §4.1).
2. The def names them in `parts: { torso, wings, head, tail, surface:{shader:[]} }`.
3. `import './dragonRevenant.js'` in `dragonModel.js` (next to the Vesper import) so the builders
   self-register before any def resolves.
4. The def is a COMPLETE premium: `maxRarity:'SSSR'` ⇒ **exactly 4 forms** and it **must** carry a
   distinct `lanceTint` + `lanceRune` (defs.mjs enforces both). Miss either and the roster-invariant
   test throws.

**The exact contract the four builders must publish** (read from `dragonModel.js` 179–338 — the
consumption is mostly `?? null`-guarded, but a few fields are iterated RAW and will throw if absent):
- **Torso** `(def,model,bodyMat)` → `{ group, attach, spinePoints, spineMats:[], mats:{bodyMat}, coreGlow }`.
  `attach` needs `wingRoot(side)`, `headBase`, `tailAnchor` (used directly), plus `keelTopAt/halfWidthAt/
  bodyMidY/riderSocket/motifAnchor`. **`coreGlow:null` is the crash-safe stub value** — a colour number
  null-derefs `coreGlow.userData.base` every frame (the documented Solar crash). With `coreGlow:null` +
  a `def.coreGlow` hex, `dragonModel` builds a sprite placeholder for free; the real transparent Grave
  Heart mesh replaces it on the same hook in I1.
- **Head** `(def,model,mats)` → `{ group, spineMats:[], motifAnchor, headLength }`. `spineMats` is
  iterated RAW (line 246) — return `[]`, never `undefined`. Use `mats.eyeMat` for the eye.
- **Tail** `(def,model,mats,anchor)` → `{ group, segs, accentMats:[] }`.
- **Wings** `(def,model,attach,giM)` → `{ group, spineMats:[], wingMat, parts:{ wingPivot/Mid/TipL/R,
  tipMarkerL/R, wingElements:[{root,tip,length,tipObj}] } }`. `spineMats` iterated RAW; `wingMat` must be
  a real (transparent) Material the rig drives `.opacity` on. Build the wing CANONICAL (+X) and mirror the
  LEFT with an **outer `lmirror` wrapper** (`scale.x=-1` on a PARENT of the pivot, never on the pivot) +
  the `hand.position = -K` −anchor trick → assembled rest pose is byte-identical and `wingsymprobe` reads
  Δ0.000. (Confirmed: revenant's stub wings probe Δ0.000 across all five poses first try.)

**The gotcha that ate ten minutes — `def.horn`/`def.scales`.** `dragonModel` builds `hornMat` and
`scalesMat` for EVERY def from `def.horn` / `def.scales`, even for a dragon whose parts never attach them.
Omit those two fields and each build spews `THREE.Material: parameter 'color' has value of undefined`
(2/form). Vesper ships WITH this noise; we killed it by giving the def bone-tone `horn`/`scales` (unused
mats, zero draws, zero geometry change) — cleaner than the reference. **A faceted premium that skips the
horned-reptile mats still owes `horn`+`scales` colours, or it warns on every build.**

**The tool — what `holeMetric()` actually measures, and why it's the right gauge.** It flood-fills the
BACKGROUND inward from the border of the coverage buffer; any `0` pixel it can't reach is **enclosed by
fill = a true interior through-hole**. It then labels holes into components (each a distinct window,
sized + px-floored) and labels the FILL into components (the "ONE connected outline" law, §4.2).
`holeFraction = holePixels / (fill+holes)` — the §4.5 ladder's "hole-fraction (side)" band. The sharp
lesson from calibrating on the live roster:
- **A bay open to the rim is NOT a hole.** Vesper's wings read **0 enclosed holes** — its membrane bays
  are concave crescent bites *open to the background*, not enclosed apertures. That's exactly right, and
  it's the distinction the Revenant lives on: the SKELETON read requires *enclosed* windows (rib bays,
  inner wing bays framed on all sides), which is a strictly harder thing than Vesper's outward scallops.
- **Pearl (a solid organism) reads 2.2%**, all sub-20px aliasing gaps between crossing appendages — so
  the metric cleanly separates "solid dragon with incidental slivers" from the Revenant's f3 target of
  **26%**. The `minHoleArea` default (3px) filters rasteriser pinholes; the caller applies the §F ~8px
  px-floor per window.
- Retro-useful as the roster's **MITTEN detector** the handoff promised: `--holes` on any dragon/view
  now reports whether a "gapped" wing actually has gaps or is a filled web.

**PROVE byte-identity; don't eyeball the diff.** The naive `diff` of before/after tricount lied twice:
(a) stderr warnings interleave into the `2>&1` capture, and (b) tricount only labels a dragon's FIRST
form, so `grep -v revenant` misses its 3 continuation rows and they look like changed existing rows.
The honest proof is a **multiset compare of the data rows**: `comm -3` of the sorted
`FORM +NUM +OK` lines showed ZERO rows unique to the before-file and exactly 4 unique to after
(revenant's 400/408/416/416) — i.e. every one of the 45 shipped rows is present unchanged, additions only.

**Baseline hygiene — know which reds are yours.** Three suites are ALREADY red on master, in subsystems
this change never touches: `defs.mjs` (SSSR count 9≠7 — vesper+vesperLean shipped without `lanceTint`),
`economy.mjs` (`featPool` 2750 ≥ 2500), `creaturestress --ci` (phoenix+knellgrave overdraw = 88). We
confirmed each by stashing and re-running on clean master. Our addition keeps the **prescribed §4.7
harness green** (blueprint 4/4, `tricount --ci` 0-over, `starters` 286/0) and leaves the peak overdraw
pair untouched (revenant's Eternal draws 24, well under phoenix's 56). We did NOT "fix" the pre-existing
reds — `defs.mjs`'s count moving 9→10 is a correctly-formed SSSR addition, and repairing the vesper debt
means touching shipped dragons (out of I0 scope). **Run the four prescribed suites for the go/no-go; run
the others only to attribute failures, not to gate on pre-existing debt.**

**Calibration is a rubric, not a render (headless can't judge colour).** The Fable gate judges REAL
colour renders (materials + light), which need WebGL/Chromium — the PR preview. Headless gives only
black-fill silhouettes. So the I0 "calibrate on Pearl/Phoenix" step is: lock the JUDGE'S rubric now so
I1's gate is ready. The locked standing veto — **"does any frame read HOLY instead of HAUNTED?"** —
plus the Pearl-firewall (sat ≤0.12, zero gold/warm), the lantern law (light is the heart THROUGH the
bays, exterior bone emissive `0x000000`), and the numeric bar (avg ≥4.0, no axis ≤2). The live Fable
spawn fires at I1 against preview tiles of the first real bone.

**What it unlocks.** I1 can now build `ossuaryTorso` for real (vertebra beam + hollow rib cage with
TRUE window voids + the Grave Heart on the transparent `coreGlow` hook) and immediately gauge the
windows with `silhouette.mjs revenant side --holes` — the hole-fraction climbing off 0 toward the f1
0.08 rung is the first measurable proof the SKELETON identity is real, not painted.
