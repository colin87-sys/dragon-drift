# "Passing the gate" ≠ "grind-worthy": a premium apex needs ORGANIZED detail ranks, and how to add them safely

**What we did.** The Dawnfire Empress (`phoenixEmpress`) cleared the high-effort Fable gate at a
threshold 4.00 — and the owner still bounced it on sight: *"ok bones, but WAY too simple. A creature
players grind hours for. Not acceptable."* He was right. A richness pass took it from ~1651 → ~2368 tris
(past Solar's ~2184) and Fable re-graded it 4.17, a genuine (not bare) pass. The gap between "passes the
static gate" and "worth grinding for" is real and the gate does not measure it.

**The load-bearing idea: perceived craftsmanship = NUMBER OF ORGANIZED DETAIL SYSTEMS, not triangle
count.** Solar reads twice as rich as the first Empress at a similar tri budget because Solar has ~7
organized systems (wing panel ranks, battens, spire rank, tail-spike rank, corona, mantle, gem string)
while the Empress had 3, two of them wireframe-thin. The fix was not "more triangles" — it was adding
*ranks*: a shingled secondary-covert rank on the wing, an inner under-rank on the train, flank/breast
shingle rows, a dorsal plume ridge, a neck ruff, a diadem, talons. Each is a REPEATING unit at a fixed
pitch. That's the whole trick: **a rank of N cheap repeated feathers reads as "crafted plumage"; the same
N triangles scattered reads as noise.** Fable even scored a dedicated NOISE veto ("triangle soup with no
readable hierarchy") — organized ranks clear it, random detail trips it.

**The reusable primitive: a `shingleRow(count, at, alongAt, normalAt, len, wid, mat)` helper** that lays
overlapping creased kite-feathers along a parametric centreline, each proud of the surface. One helper
served the wing coverts, the flank/breast rows, the dorsal ridge, the ruff, the nape mantle, the tail-root
skirt — six detail systems from one function. Author the repeatable unit once; place it along different
paths. Feathers are DARK covert diffuse (zero/whisper emissive) so richness comes from **facet relief +
overlap shadow + a scalloped silhouette edge**, never new light — which is how you add density to a
"coal, not a torch" dragon without violating the lighting doctrine. The scalloped trailing edge is the #1
"this is a real wing" cue and it survives pure black-fill.

**Rear-chase is unforgiving about WHERE the detail lives.** Fable's sharpest note: the covert rank existed
but sat only on the trailing edge, leaving the inner third of each wing a blank dark rod — "in the view
that is 100% of play." Detail that reads in the crop but vanishes edge-on in the chase view is nearly
worthless. Fix: extend the rank inboard AND add a mid-chord SURFACE rank so the wing steps from root to
tip. Detail budget should be spent where the primary camera actually looks, not where the inspect view
does.

**Gotcha that cost real time — a NaN vertex is invisible to every geometry test but the render.** A
one-character bug in the kite-feather helper (`const A = (p, s, u, t) =>` — a spurious leading param, so
`t` was always `undefined`) made every feather vertex `NaN`. Consequences: `tricount` still counted the
tris (fine), `starters` asserts still passed (they don't check finiteness), the headless flight tick ran
without throwing — and `wingsymprobe` reported a FALSE PASS, because `NaN > worst` is `false`, so the worst
asymmetry stayed 0. The ONLY signal was the studio render: an empty frame (the NaN blew the bounding box,
so the auto-framing camera placed the dragon at infinity). Lessons: (1) always eyeball a render after a
geometry change, don't trust green tests alone; (2) a comparison-based symmetry probe silently treats NaN
as "symmetric" — we added a hard **NaN-vertex guard to `tests/starters.mjs`** so this class fails loudly
forever after.

**Process that worked: use the Fable agent as a DIAGNOSTIC, not just a grader.** Instead of "score this,"
the richness brief asked "diagnose exactly why it reads simple, then prescribe a concrete prioritized
buildable plan with per-item triangle costs and a ladder-conferral schedule." It returned a W/T/B/H plan
(wing/train/body/head) impact-ranked per triangle, each item specified enough to implement directly. A
high-effort aesthetic agent is far more valuable pointed at "what's missing and how would you build it"
than at "rate this 1–5."

**What it unlocks.** For every future premium: budget for **~5–7 organized detail ranks** from the start
(the shingleRow pattern makes them cheap), place the relief where the rear-chase cam looks, keep it all
dark-facet if the dragon is a "coal," gate the ranks up the ladder (f0 bare → f3 court dress), and render-
check + NaN-guard every geometry change. "Passes the gate" is the floor; organized density is the ceiling
the owner actually buys.
