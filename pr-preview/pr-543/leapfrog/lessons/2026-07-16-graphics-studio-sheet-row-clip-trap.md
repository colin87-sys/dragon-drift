# The studio contact-sheet silently clips any row below the viewport fold

**What we did.** Extended the Lost Lagoon prop studio from a 2×3 to a 2×4 sheet to add a 7th
window-close verification tile for the rotunda arch gate. The tile's label rendered but its geometry
did not — and worse, it did so **silently**: no error, just a black strip. The Fable critic caught it
by measuring the artifact (2080×3360 for a sheet that should have been 2080×4160) — three whole rounds
of "the arch is unverifiable" traced to a composite that ate its own tile.

## The trap

`propstudio.html`'s `#sheet` canvas is `position: fixed; top: 0`. `psSheetInit(cols, rows, cell)` sizes
it `cols·cell × rows·cell`, but a **fixed** element is bound to the VIEWPORT — any part below the
viewport fold is not in the layout the screenshot captures. `lagoonstudio.mjs` created the page at
`viewport height 1680`, while a 4-row × 520 sheet is **2080 CSS tall**. Rows 1–3 fit; row 4 (the 7th
tile) fell ~400px below the fold and was clipped to a label sliver. `page.screenshot({clip})` with a
height taller than the viewport does NOT scroll a fixed element into view — it just returns the
viewport-bounded region, padded/cut.

## The rule

**When compositing a contact sheet into a fixed canvas, the browser viewport must be at least as tall
as `rows·cell` (and as wide as `cols·cell`).** Set the Playwright viewport from the sheet dimensions,
not a fixed guess. If you add a row to a studio sheet, bump the viewport in the SAME commit — the
failure mode is a silently missing verification tile, which reads as "rendered and fine" to a critic
skimming the sheet. (Fix applied: `lagoonstudio.mjs` viewport → `height 2200` for the 2×4 sheet, with
a comment tying it to `rows·CELL`.)

Corollary for critics/self-review: **measure the artifact's pixel dimensions against the expected
`cols·cell × rows·cell × deviceScaleFactor`.** A short sheet is proof of a clipped tile before you
even look at the content. Don't rule a gate PASS or FAIL on a tile you can't confirm actually
rendered geometry — a blank tile is "unverified," never "passed."

## What it unlocks

Every future multi-tile hero sheet (the Lagoon roster, and any biome that needs a >6-tile verification
sheet) now sizes its viewport to its rows. The rotunda's arch gate was re-shot on a dedicated
2×2 `_lagoonarch.mjs` sheet (custom `winclose`/`back` studio angles) once the clip was understood.
