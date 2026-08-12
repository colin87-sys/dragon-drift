# THE JUDGMENT COURT (PR-J) — the chiaroscuro redo of the S3 heaven: invert the VALUES, keep the SPINE

**What we did.** The owner rejected the shipped UNVEILED HEAVEN ("over-bright and underwhelming,
the side lights are lame"). Redid the whole S3 arena as THE JUDGMENT COURT — a midnight cathedral
lit only by the god's own light — WITHOUT touching the S2 void, the mix machinery, or the wing
angles. Five phases: **P0** an exact wingtip min-world-Y probe (`boss.js debugWingMinWorldY`,
per-vertex world-space scan of the `wing_*` pivots, `__dd.bossWingMinY`); **P1** `HEAVEN_HEX`
rewritten to MIDNIGHT INDIGO + GOLD (vault L≈.10, ONE molten-gold horizon band L≈.49, dark
violet-bronze fog L≈.19, black-glass sea, gold light-rain, faint stars .25, sparse gilt-rimmed
dark clouds); **P2** `stationY: 15` on the unmasked def (+2u lift) + the glassy sea (waveAmp
.5→.2); **P3/P4** `arenaSet.js` rebuilt — the 24 light-pillars and the 3-ring halo are GONE,
replaced by the DIVINE COLUMN (3 crossed vertex-faded gold cards zenith→sea on the boss axis +
an impact pool feeding the water sun-road), 14 STAINED-GLASS LANCETS (one InstancedMesh of
pointed-arch cell-grid panes, per-instance violet-led jewel hue via `instanceColor`, same |x|
19–28 / even-meter / base-y≥8 placement law), and the INVERTED ROSE-WINDOW (dark opaque tracery
annulus + hub + 8 ribs silhouetted on the gold band, additive jewel petals between); **P5** the
S3 focal lift retuned for its flipped job (SCLERA_LIFT .5→.3, CATCH_LIFT .8→.6 — it now crowns a
silhouette, not out-brightens a sky). 4 draws, ~1.0k tris, all layer 1, same stateless
mix-window/fade/tier/reset spine, same private `mulberry32(0x5e7a9c1)`.

**The headline lesson — a rejected "bright" identity is usually a VALUE-STRUCTURE failure, not a
decoration deficit, and the fix is nearly free.** The court's transformation is ~90% the P1
palette table: on the lit-gold sky the fairness numbers were corridor p90 .69 / sky p95 .89 with
every authored bright fighting the backdrop; on the midnight vault the SAME fight ships corridor
p90 .35–.41 and sky p50 .39–.41 — the dark frame hands every light (halo, god-ray swell, column,
glass) its read for free, plus a fat fairness dividend. Value-space-first also made iteration
cheap: the naked-vault screenshot (court furniture tier-hidden via a page-side
`import('/js/arenaSet.js').setArenaSetQuality(2)`) proved the revelation before any geometry work.

**Stained glass is a DARK-BACKGROUND technology.** The same placement law that produced "lame"
light-pillars on a bright sky produces burning jewel-glass on a dark one — because the read of a
window is its BLACK TRACERY, and with additive blending tracery is free: emit NOTHING between
cells and the dark vault paints the margins. Two gotchas that decide window-vs-building: (1) the
pane OUTLINE must taper to a true pointed apex (an `arch(y)` factor on every cell vertex) — a
rectangle of glowing cells reads as an office block at night, and a pentagon "roof" on top reads
as a HOUSE; (2) cells must be FEW and value-varied (2×4 + arch-light, brightness .3–1.0) — a
dense uniform 3×5 grid reads as lit windows in a tower. Hue×value separation matters with
instancing: vertex colours carry a near-white VALUE mosaic, `instanceColor` carries the jewel hue
— two saturated hues multiplied would mud to black.

**P0 taught the real number before P2 spent it: measure, then spend inside the gates.** The build
spec assumed a ~2u water-clearance deficit; the per-vertex probe measured the mantled S3 fan's
lower wingtips at world y **−10.8 idle / −11.6 at the charge down-flare** — full clearance needs
~+25u of lift, which is unreachable: the upper wingEye pair must stay < 22 (organ comfort gate),
capping `stationY` at ~15. Shipped the gate-max +2 (wingtips −9.5/−9.6 after, organs green at
upper maxY 18.7) and RECORDED the residual instead of pretending: with wing angles owner-frozen
and water-lowering owner-rejected, the lower tips still meet the sea — now 2u shallower, onto a
flat black mirror. A probe that returns a number you can't act on is still the win: it converts
"raise it a bit" into a documented ceiling. (Attack-anchor audit rode along: spiral/iris/graze-bait
keep `B.fightHeight` deliberately — they are pattern centres in the DODGE corridor, not body
decorations; crossfire/aimed/fan/stream follow the live pose/muzzle automatically.)

**When the offered gate-ratchet doesn't hold, lock the identity at a different percentile.** The
plan offered "ratchet sky p95 to ~0.80 if it holds comfortably" — it doesn't (ships .79–.84,
noise ±.03: the tail IS the authored column + god-ray swell). But p95 was never where the
chiaroscuro lives: the MEDIAN separates the identities cleanly (court ≈.40, rejected lit-gold
≈.7+, ordinary bright biome .70). Shipped: p95 ceiling stays .90 (white-out guard), NEW gate sky
p50 ≤ .55 (the postcard-regression tripwire). Percentiles are a vocabulary: tails guard against
blowouts, medians guard identity.

**The contrast gate constrains the fog before taste does.** A dark-violet fog near L .20 sits in
the layered-read DEAD ZONE (layered needs bg ≥ .28; direct needs ±.15 from every band colour —
the void band 0xa84167 is L .352, so fog ≤ .202). The spec'd 0x3a2f52 (L .2034) FAILS
bulletcontrast by .002; shipped 0x372c4e (L .1913). Run `bulletcontrast` the moment a palette
row exists — it's pure-node, instant, and it vetoes hexes eyeballs can't distinguish.

**Verify.** `unmaskedarena` 42 (incl. the new chiaroscuro lock) · `boss` · `bulletcontrast` ·
`unmaskedorgans` (upper pair 18.7 < 22 with the lift) · `unmaskedreckoning` · `skyclouds` ·
`smoke` — all green. Mix-0 control screenshot: ordinary world byte-untouched, court absent.

**What it unlocks.** The finale's arc is now dark→dark-transfigured (S2 void → S3 court), the
S2→S3 white-gold detonation reads as a smash-cut revelation instead of a brightness plateau, and
the court's three instruments (column / lancets / rose) are independent dials for owner-eye
iteration. The sky-p50 gate keeps the identity locked through any future tuning.
