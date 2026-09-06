# ENG-G — THREAD-THE-GAP scoring (`grazeForm:'threadTheGap'`): the first DISCRETE reward form, on a fire-time row ledger

**What we did.** Added a player-facing reward for flying cleanly through a wall attack's authored
safe gap. When MARROWCOIL fires a lane-denial wall (`curtain`/`movingGap`/`crestfall`/`geyser`) and
you cross its plane inside the safe gap without a hit, you score a **THREADED** flourish (+combo,
+surge-bank feed), scaled by **clearance + lateness** and **chained** across consecutive threads.
This closes plan §E.2 C.3(v) (the "clearance+lateness, chains" formula that had no math/window/HUD).

**The key architectural call — a fire-time row LEDGER, not a runtime scan.** The temptation is to
scan live bullets at the player plane for "the empty lane." That's fragile (reconstructs at runtime
what `executeAttack` already knows exactly, false-positives on sparse patterns, breaks on overlapping
walls). Instead each wall branch calls `noteGapThreadRow(gapX, halfW, yLo, yHi, vy, vrel)` at its own
gap-clamp, inside the closure that emits — recording the SAME `gap` the bullets use, snapshotting
`pose.rel` (emitBoss's default birth depth) + `game.bossHitsTakenRun`. A walker (`updateGapThreadRows`,
beside the grazeForm cluster) integrates each row's depth with the same `dt`, banks a lateness clock
while it's inbound + in-gap, and resolves it ONCE at its crossing frame (`prevRel > 0 && rel <= 0` —
the same crossing law `updateBossBullets` uses). **The scorer can never disagree with the wall it
scores**, because it reads the wall's own authored gap, not a reconstruction.

**Three predicates gate the award** (all must hold at the crossing): `inGap` (|px−gapX| < halfW),
`exposed` (the wall actually swept the player's height — kills "dodged around it": ducking under a
crestfall sheet or floating above a movingGap band pays nothing), and `clean` (no bullet hit across
the row's whole flight — you can't tank through a wall and get paid). The math:
`points = threadScore · (1 + 0.5·edge + 0.5·late) · chain · combo · scoreMult`, where `edge` pays
wall-huggers (the doomed-column edge is also inside the shipped crossing-graze annulus, so the two
rewards land together by geometry) and `late` pays the brave commit over the gap-camper; the chain
multiplier caps at ~×3.25 on a 6s window.

**It's the FIRST discrete graze form** — the other half of the §5i.B "dedup discrete / tick
continuous" law. Slipstream/orbit/disc all ride the `beamHeld/beamTick/beamGrace` ramp; THREAD-THE-GAP
does NOT touch that ramp at all (one award per row at a crossing frame, `orbitLapJackpot`-tier
ceremony), so the "one grazeForm per boss" ramp-sharing invariant is irrelevant to it.

**Reward on shipped symbols.** New `ui.threadPopup(points, streak)` beside `gatePopup` — reuses the
**exact "THREADED" cyan vocabulary of the course-mode gate** (it IS the same skill; slot-1 players
already know the word) — plus `gateThreadBurst` (imported into boss.js beside `burst`) + `sfx.gate`.
`bossNote` only at streak milestones (3/6, `_noteBusy`-gated so it can't spam a phase banner). The
surge-bank feed is the `holdFlinch` precedent: repeated `bulletGraze(player)` calls (not a direct
`grazeCharge` poke — that would fork the conversion loop and desync `grazesRun`), so the gem HUD moves
and the player SEES the wall pay into Surge.

**Gotchas.**
1. **Headless popup crash.** `ui._popup` set `els.popup.textContent` with no DOM guard — fine for
   course gates (never fire in the boss sim) but MARROWCOIL now threads mid-fight in the lifecycle
   sim → crash. Fixed at the primitive: `if (!els.popup) return;` (UI popups no-op with no DOM — the
   shim's clear intent). A boss that score-pops mid-fight is the new case that surfaced it.
2. **Stale test listeners.** `events.on()` never detaches, so a listener from an earlier sub-block
   fires during a later block's awards and clobbered a captured value (the edge-dial compare read
   133==133 because run-A's listener latched run-B's award). Fix: `if (!ptsX) ptsX = e.points` — latch
   the first only. General trap for any boss.mjs block that captures a specific emit value across
   `resetBoss` boundaries.
3. **Simultaneous multi-row crossings headless.** `debugEmitAttack` flushes all of movingGap's 5 rows
   at once (same `rel`), so they cross the same frame and a wall-hug position sits in TWO adjacent
   rows' gaps — muddies a single-row reading. The edge-dial gate uses `curtain` (one gap) instead.

**Coexist / the family alias.** Gate = `def.grazeForm === 'threadTheGap' || def.gapThread === true`.
MARROWCOIL opts in with ONE def line (its empty grazeForm slot — no ENG-C7-style live-label footgun,
so the coexist-first order was available). `def.gapThread` is a DORMANT alias (no def carries it) for
migrating the reward to the rest of the wall family later without burning each boss's grazeForm slot —
an unused predicate arm on an existing branch is safe (the inverse of ENG-C7's loaded gun). `noteGapThreadRow`
early-returns unless active → un-opted defs record nothing → the walker no-ops → zero new state/emits/UI.

**Verify.** `tests/boss.mjs` **116** green (+1, stable 3/3): row-record fidelity (5 rows, in-arena,
own skip-width); a clean in-gap crossing pays score+chain+bank; parking outside every gap pays nothing;
in-gap-but-above-the-band (dodged around) pays nothing; consecutive threads chain (later pays more) +
a hit breaks the chain; tighter pays more than dead-centre (edge dial); stormrend (fires movingGap,
un-opted) records no rows + pays no thread; resetBoss clears the ledger. `bossboot` green. Diff:
boss.js (ledger/walker/award), ui.js (threadPopup + the `_popup` guard), config.js (threadScore),
bossDefs.js (ONE marrowcoil line) — every other boss byte-identical; rhythmprint/amberdiet/laneSafe
untouched by construction (zero emission/cadence change).

**Forward.** Migrate to the wall family one `def.gapThread: true` line per boss (coexist → prove on the
hero → migrate, THE RULE). C.3b rib-aperture rides this same ledger (one more `noteGapThreadRow` call
in the aperture branch). Do NOT feed `grazeCharge` directly (fork the loop); do NOT make this a tick
form (it's discrete by law); the `exposed` y-window on the moving-line walls (crestfall/geyser) is the
one preview feel dial (§8 of the spec).
