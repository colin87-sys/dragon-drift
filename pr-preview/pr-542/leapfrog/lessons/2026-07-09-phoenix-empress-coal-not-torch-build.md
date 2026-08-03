# Building the Dawnfire Empress: "coal not torch" is a VALUE-STRUCTURE law, and the Fable gate proves it

**What we did.** Implemented `phoenixEmpress` ("The Dawnfire Empress") from its finished build sheet
under [`PREMIUM-DRAGON-METHOD.md`](../../reforged/PREMIUM-DRAGON-METHOD.md) — the second dragon built
this way (after Solar). Four fresh default-off builders (`pyreHeartTorso` · `scythePinionWings` ·
`cometCrestHead` · `pyreTrainTail`) + `empressMats` copying only the `sovereignMats` STRUCTURE. New
roster key coexisting with the shipped `phoenix` (byte-identical, pure insertion). The method worked as
advertised: apex-first, subtract down the ladder, gauntlet-then-Fable, and we gated ONCE on sculpt +
spectacle + rear-chase together instead of Solar's two-pass detour.

**The load-bearing lesson: "a coal, not a torch" is not about the BODY being dark — it's about the
VALUE STRUCTURE of every lit element.** Our round-1 build passed every failure-class check and looked
great in isolation, but the Fable gate FAILED it (3.67) on one specific inversion: the train's quill
**blades** were fully-lit amber-gold while the coal-eye gem **tips** read as the darkest thing in the
fan — the exact backwards of "ember-eyed flame-quills." A lit blade with a dark tip is a torch; a DARK
blade with a glowing tip is a coal. The fix flipped it: near-dark ash-maroon blade faces + a thin
crimson→amber emissive EDGE gradient (thin `bar()` rods tracing the rim) + genuinely bright coal-eye
octahedra as the tip constellation. Same silhouette, opposite value structure — and it simultaneously
(a) satisfied the coal doctrine, (b) surfaced the MISSING third light structure (the amber gem arc), and
(c) made the one near-white element (the Dawn Coal) legible. **When you spend an emissive on a regalia
shape, ask "is the bright part the RIM/TIP or the whole FACE?" The rim/tip reads jeweled; the face reads
tacky.** This is the same "dark opaque body + thin saturated rim" technique the method preaches for the
regalia, applied at the scale of every single feather.

**Second lesson: separated hues must be separated in HUE, not just in name.** The sheet named three
warm stations (crimson pinion / amber coal / rose crest), but crimson `0xe0173a` and rose `0xe83a6a`
bloom to nearly the same pink under ACES + UnrealBloom — Fable read the wings and crest as one family.
Deepening the wing to blood-crimson `0xcc1024` and RESERVING rose for the crest alone gave three
genuinely distinct stations. Pick emissive hues by how they BLOOM, not by their hex distance.

**Reusable build patterns that worked first try:**
- **Compositional inversion** (train-below vs Solar's crown-above) made distinctiveness trivial — Fable
  cleared the Solar / Pearl / Ember collision veto immediately. Inverting WHERE THE MASS LIVES is a
  stronger guarantee than any palette move (as the sheet's own lesson predicted).
- **A pure layout function shared by the builder AND the test** (`trainFanLayout(model)`) let
  `tests/starters.mjs` assert the not-a-ring guarantees (sector < 180°, quill gap ≥ 1 quill-width,
  cant-balance Σ=0) against the EXACT numbers the geometry is built from — no drift, no re-derivation.
- **Cant-balance Σ=0 by construction:** build the fan as mirrored L/R PAIRS with opposite cant
  (`cant_left = −cant_right`). Then "alternating ±8° cant" and "balanced mirrored pair" are the same
  fact, and the assert is exact (`Math.abs(sum) < 1e-9`), not approximate.
- **Copy the plumbing verbatim, author the look fresh:** the wing rig contract (pivot→mid→tip nested,
  `tipMarker` parented to `mid`, `scale.x=-1` mirror, `wingElements` with `tipObj`) copied 1:1 from
  Solar → `wingsymprobe` PASSed at 0.000 on the first run, and the wing PROFILE FORMULA
  (`scytheY`/`scytheZ`) shared between geometry and the FX marker avoided the trail-detach gotcha.

**The one that would've bitten:** the wing PROFILE is the anti-M signature. Stating it as a
FUNCTION with a terminal peak (`scytheY = halfSpan·tipRise·t^1.5`, monotonic, max at the tip) — the
mathematically opposite curve family to Solar's interior-peak arch — made "not an M" enforceable and
the rising-rake silhouette survive the flap animator (it's vertex-baked). Blunt the whelp's feathers
by the SAME rake dial (`featherLen ×= 0.5+0.5·tipRise`) so f0 reads a rounded ash-chick, not
pre-conferred flame serrations (a thing Fable caught: a dark serration SHAPE reads as "fire already
here" even with the emissive at zero).

**What it unlocks.** A distinct, premium, coexisting apex firebird with the whole failure-class
gauntlet green and a Fable-driven coal-doctrine fix banked. For the next premium (Obsidian, Pearl v2):
reach for compositional inversion + a profile-FUNCTION silhouette first; and when you light a repeated
regalia element (feathers, scales, quills), put the emissive on the RIM/TIP and keep the FACE dark — or
the Fable gate will (correctly) call it a torch.
