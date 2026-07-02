# Dragon Aesthetics — the outline-first, human-selected design system

> **Why this exists.** A month of tuning knobs produced dragons that still read as generic
> — "spherical bodies, paddle-pop-stick wings." The root causes, named plainly:
>
> 1. **The AI is not a trustworthy aesthetic judge.** It rationalizes mediocre output as
>    "good." So *nothing in this loop lets the AI declare a shape good.* The AI generates
>    variety and culls the provably-degenerate; **the human selects.**
> 2. **The problem is the shape space, not the dials.** The silhouette the camera sees was
>    always a downstream accident of numeric cross-section stations. Here the **outline is
>    the design object**, and we look at many outlines at once.
>
> The unlock that makes this practical: this environment renders headless WebGL, and the
> silhouette rasterizer (`tools/silhouetteCore.mjs`) needs no browser at all — so we can
> render **dozens of candidate outlines in seconds** and put them on one contact sheet.

## The loop

```
AI: generate a diverse population of outline variants   (tools/gallery.mjs)
AI: cull only the provably-degenerate by measurement    (tools/silmetrics.mjs)
AI: render each as a flat-black silhouette → contact sheet
HUMAN: name the index(es) whose OUTLINE reads well  ← the ONLY aesthetic verdict
AI: breed/refine around the human's pick, regenerate
```

The AI never ranks the survivors or says "this one looks good." Its output is a sheet + a
table of numbers. The human's pick is ground truth.

### Run it

```
node tools/gallery.mjs <key> [--n=16] [--views=side,top] [--tier=N] [--seed=1] [--out=PATH]
node tools/silmetrics.mjs <key> [tier]      # metrics for one dragon, standalone
```

The sheet writes to `/tmp/gallery-<key>.png` (one row per variant: pass/fail band + index,
then a silhouette per view). The stdout table lists each variant's variation params and the
**advisory** numbers (side aspect / solidity · wing aspect). Read the sheet and the table
together; pick by the sheet.

## What `silmetrics` does — and deliberately does NOT do

Calibration across the roster (toothless / azure / phoenix / ember / fire…) proved that
silhouette scalars **do not cleanly separate beautiful from ugly**: festoon count reads ~0
for every dragon at rest, `taper` rewards a sphere's mid-bulge, `dorsalKink` flags an
intentional spiky back as "facets." Reducing aesthetics to a few numbers is exactly the
false-confidence trap that wasted the month.

So the gates are narrow and honest — they **cull only the provably degenerate** (empty
render, noodle `aspect > 5.2`, ball `aspect < 0.75`, solid blob `solidity > 0.8`, wisp
`solidity < 0.08`, extreme ribbon wing `aspect > 4.5`). Everything else — spine inflections,
dorsal kink, taper, festoon, moderate wing aspect — is **advisory context printed beside
each variant, never a gate.** The human, looking at the outline, is the judge.

## The art principles the outline generators encode

Grounded in bat/pterosaur anatomy + character-design theory + this repo's own ledger
(L32/L53/L54/L86). Each principle is a real knob or a reported number — never a vibe (L53:
*an art-word that maps to no lever is a lie*).

### Body / silhouette
- **Line of action first.** The spine is a single flowing **S-curve** (Hogarth's line of
  beauty), not a straight loft with a token bend. Hang the body on that gesture.
- **Triangle shape language.** Dragons read *dangerous* → dominant wedge/teardrop masses
  (deep chest → tapering neck & tail), triangular head, swept spikes graded big→small.
  **Never a sphere** — a sphere signals "harmless, inert," the literal "spherical body"
  complaint.
- **Read as solid black.** If the flat silhouette isn't a distinctive dragon, no shading
  saves it. The silhouette is the primary oracle, not the lit render.
- **Deliberate proportion / rhythm.** Unequal ratios (short thick neck, deep belly, tail ≈
  half length), odd counts + uneven spacing on repeated elements. Uniform reads "taped-on."

### Wing (the "paddle-pop / not aesthetic" fix)
- **A real arm-hand skeleton.** Short massive humerus → longer forearm → a **segmented,
  CURVED wing-finger (3–4 joints, an arc — never a straight spar)** → a graded finger fan →
  a **clawed thumb at the wrist.** The bending leading spar is the single biggest
  anti-"stick" fix.
- **Four-panel patagium, not one sheet.** propatagium (shoulder→wrist), chiropatagium
  (between fingers = the fan), **plagiopatagium running from the last finger down the flank
  to the hip/leg** (this anchors wing-to-body so it stops reading "bolted on"), optional
  uropatagium at the tail.
- **Festoon scallops.** Each free trailing span between fingertips droops inward ~**15–25%
  of the gap width** in a concave curve; the panel over the bones stays taut. Graded, not
  uniform. (Judged by the human on the render — the projected scalar is too noisy to gate.)
- **Aspect ratio is a temperament dial.** Low aspect (deep chord) = broad, powerful; high
  aspect = thin ribbon (the L53 failure). Deep chord + fanned fingers, never a swept blade.

## Status

- **Phase 0 (this):** the generate → measure → **human-select** harness — `gallery.mjs`,
  `silmetrics.mjs`, this doc. Proven on `toothless` (12-variant silhouette sheet).
- **Phase 1 (next):** `creatureOutline.js` — author a creature from **outline curves** (S-spine
  + side/top profiles + wedge sections) instead of raw stations, and drive the population
  from those curves so genuinely new outlines (not just nudges of the current family) reach
  the human's contact sheet.
- **Phase 2:** `dragonPatagium.js` — the real bat/pterosaur wing above.
- **Phase 3:** finish/lighting so the selected shape reads when lit (today it's a black blob).
- **Phase 4:** systematize into the grammar + migrate the roster, one creature at a time,
  each converged by this loop and gated byte-identical.

The rule that governs all of it: **author the outline, generate variety, let the human
choose. The AI measures and renders — it does not decide what is beautiful.**
