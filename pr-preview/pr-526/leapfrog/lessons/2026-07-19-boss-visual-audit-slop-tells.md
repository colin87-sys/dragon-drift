# Boss visual audit — the six roster-wide slop tells (2026-07-19)

**What we did.** First full-roster harsh visual audit of all 14 bosses, judged on real
captures (studio contact sheets + fight-distance frames via `tools/bossstudio.mjs`, dark +
sunset backdrops) against one question: *would this frame sell the game in a trailer?*
Result: roster average ≈ 5.6/10, best BRINEHOLM 7.5, worst EITHERWING 3.5, **nothing ≥ 8.5**.
Full scoreboard + per-boss uplift directives: [`reforged/BOSS-VISUAL-AUDIT.md`](../../reforged/BOSS-VISUAL-AUDIT.md).

**What we learned (the gotcha).** The roster doesn't have 14 different problems — it has SIX
problems repeated: **T1 blockout read** (clean prisms/wireframes shipped as final: Hollowgate
pillars, Karnvow robe), **T2 mid-value pastel body** (near-black law ignored: Voidmaw,
Onewing, Unmasked), **T3 debris confetti** (unauthored floating chips), **T4 ping-pong-ball
focal** (bare glowing sphere instead of L157 eye anatomy: Marrowcoil lure, Karnvow orb,
Eitherwing eye, Weftwitch hood-lamp), **T5 presence collapse** (lit-edge area ≈ 0 at rel 30
on the home-value backdrop — L140/L141 still recurring), **T6 scribble FX** (hatch-line
spectacle; Karnvow's Verdict seal accidentally composes an anarchy-"A" glyph — always
anti-read-check COMPOSED line figures, not just bodies). Individually-reviewed bosses keep
re-shipping already-recorded failures (the Craghold mitten hands returned on Weftwitch) —
per-boss review does not propagate laws; only a roster-wide sweep catches recurrence.

**The reusable pattern.** (1) Judge the fight-dark frame FIRST — most failures are invisible
in auto-framed contact sheets and obvious at rel 30. (2) A recurring-tell table across the
whole roster is worth more than a deep dive on one boss: one law fixes 4 bosses. (3) The
research digest (SotC/TF2/Hollow Knight/Cuphead/Derek Lieu, in the audit doc) compresses to:
blackout test, one loud idea, value-is-the-product, glow-as-currency, composed scale,
anticipation poses, reveal-as-lighting-event, bespoke-over-uniform detail — all achievable
with geometry/vertex ramps/LineSegments at zero overdraw cost.

**What it unlocks.** A ranked, perf-safe fix queue (audit doc §PRIORITY ORDER) any session
can execute one item of; a shared relic/trophy mini-silhouette kit (Karnvow + Unmasked); and
the `?trailer=1` capture-mode idea as the highest-value tooling investment for marketing.
