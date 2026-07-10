# ENG-B — authored safe-gaps (`def.gapAnchor`): a wall's lane can LOCK to a boss organ, not the player

**What we did.** Fixed a recurring audit finding: several bosses' wall dreads say "read the boss to find
the safe lane," but every gap was seeded from the PLAYER (`curtain`'s `-Math.sign(player.position.x)*5.5`,
`movingGap`'s `g0 = clamp(player.position.x)`, `iris`'s `anchorX = player.position.x*0.7`) — so there was
nothing on the boss to read; the "answer" just tracked you. ENG-B lets a def/card AUTHOR where the gap
sits (on a named organ, a fixed axis) so "fly into the eye of the storm" becomes literally true.

**How.** `def.gapAnchor = { <attackId>: { part?, x?, offset?, card? } }` — a per-def, per-attack-id map
mirroring `emitOrigins`, resolved by `resolveGapAnchor(id)` beside `resolveEmitOrigins`. `part` → the
organ's live world-x via `partWorldPos`; `x` → fixed lane / part fallback; `card` → active only while
that card is live (the `horizonPocketX` card-gate, generalized off boss-13). Three one-line read points
(`curtain`/`movingGap`/`iris`) take the authored x when present, else the shipped seed. **Null-on-failure
falls back to the shipped placement (never a gapless wall)** — the `resolveReflectTargets` never-whiff
flip, not emit's SKIP.

**Hero: STORMREND, card-gated to its dread `stormrend_eye`** — `iris`/`movingGap` lock to `focalEye`
(an existing named part; zero model work). Def-data only + the seam. The ±5 station sway makes the eye a
*legible moving anchor*. Deferred to C.1b proper: the iris×3 chain, the corridor ambers (that's ENG-A:
`emitOrigins:{aimed:['focalEye']}`), the ring-alignment rig.

**Gotchas.** (1) DRIFT: the plan said the hero uses `curtain`, but STORMREND was rebalanced to
`fan/movingGap/iris` (no curtain) — so the hero proves `iris`+`movingGap`; the curtain read-point ships
gated, first consumer WEFTWITCH C.8. (2) `movingGap`'s gap computation had to MOVE from schedule-time
into the fire closure (so a moving anchor re-resolves live per row) — provably byte-identical un-opted
(g0/dir/k frozen, no RNG). `iris` deliberately resolves ONCE at schedule time (per-ring re-resolve under
the sway would smear the concentric rings into a gapless tube — do NOT "fix" it). (3) **Test trap:**
un-opted `movingGap`'s gap SLIDES per row, so there is NO single lane to assert for the coexist case — my
first G4 assert ("lane at x=6") was wrong. The right coexist check is *card-off does NOT lock to the eye*
(while card-on does) — a lock-vs-slide distinguisher, not an absolute-position check. (4) Cards arm at hp
fractions → untestable headlessly, so shipped a `debugForceCard(id)` test seam (the `debugRaiseShield`
precedent). (5) laneSafe holds by construction: each read point pushes the authored x through its own
shipped clamp (±8/±9), so even a hostile `x:40` lands in a reachable lane (gated with an out-of-arena
mutation of the exported `BOSSES`).

**Verify.** `tests/boss.mjs` **111** green (4/4 clean): G1 curtain coexist at the shipped -5.5; G4
card-off does not lock to the eye; G2 card-on locks `movingGap` to the eye across every row; G5 an
out-of-arena `x:40` clamps to the +9 lane (laneSafe green). `bossboot` green; every other boss
byte-identical; no rhythmprint/amberdiet/emission change (gap POSITION only, same bullet count; all three
branches emit non-amber).

**Reusable / forward contracts.** The resolver is the mirror of `resolveEmitOrigins`. Consumers ride it
unchanged: **C.1b** (already half-served — adds the chain + corridor ambers), **C.3b** (rib-aperture:
one resolver branch reading `model.liveRibs()` — ENG-E already exposes it), **C.7** (bob-locked:
`{ part:'bellMouth', offset }` once ENG-H's swinging bell exists — ⚠ the ±14 pendulum out-runs
movingGap's ±9 clamp at the extremes, a read-honesty flag for C.7's POST-BUILD, not a fairness hole),
**C.8** (hand-skipped lane — needs a one-beat-EARLY decision, an additive `atTell:true` hook on this
seam, built in HER PR since the hero doesn't need it). Composes with ENG-A (fire from organs) + ENG-A-R
(reflect to organs) + ENG-E (break organs): the "read/edit the boss's body" system is now four seams deep.

**Do not touch:** `anchorX` itself (tunnel/spiralStream share it — only iris's *read* changed); the
`crestfall`/`horizonPocketX` pair (shipped, green); no `def.rhythm`.
