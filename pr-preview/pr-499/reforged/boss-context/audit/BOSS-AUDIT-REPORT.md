# BOSS-DESIGN.md — Adversarial Audit Report (Part A)

**Scope:** `reforged/BOSS-DESIGN.md` @ master, six dimensions (visual/silhouette · integration/engine · combat/feel · grandeur · lore · cinematic awe), per-slot completeness for 8–14, four adversarial critics (collision matrix · escalation curve · engine dep-graph · contradictions).
**Method:** 18 independent reviewers → 186 raw findings → dedup to 146 → one adversarial verifier per finding (default stance: refute) → completeness sweep. **57 candidates were killed as false positives; 36 were adjusted; 100 survived** (1 formal BLOCKER · 59 SHOULD · 40 POLISH). Code claims cross-checked against `reforged/js`, `tests/`, `tools/` on master.

---

## 0. TL;DR

The doc's **identity layer is excellent and nearly collision-free** — hooks, rhythms, entrances, rule-breaks, and lore are allocated with real discipline, and the escalation macro-shape (14 summits, 13/14 motion-stillness boundary) is correct. The gaps cluster into five repairable classes:

1. **The doc lags its own shipped code** (~15 findings): rows 3–5 still "claimed", the ladder controller marked "future" though `ladderPickDef` is live, the flat 6,000/34 budget text contradicting shipped `TIER_BUDGETS`, stale mote counts, a landed hotfix still marked "immediate", dead line anchors.
2. **Three mechanics landed on paper but never in code**: ORGAN BREAK (slots 4/5 — shipped slot 6's PANE BREAK is documented as a *reuse* of a debut that never shipped), all three Colossi graze forms, and the Tier-3+ surge-immune shield wind-up. Plus two slot-5-bundle items that slipped silently (entrance-look fallback, `getBossEta`).
3. **Slots 9–14 lack the two pre-claim artifacts the doc itself gates on**: the §3b six-field silhouette translation sheet (only slot 8 has one) and the §4b seven-channel charisma map + glyph ("a sheet missing any channel is not claimable").
4. **The World-Ender sheets are speced 8–17× under their band budgets** (13 at ~1.2k tris vs a 14–22k floor; 14 at ~5k vs ~30k) — the exact conservative-sheet trap that caused the EITHERWING presence failure *twice* (L140/L141).
5. **Slot 9 is the roster's structural weak point**: the Tier-3 *difficulty* peak is simultaneously the band's *spectacle and scale* trough — smaller than band-2 bosses on every stated axis, in a band contracted for multi-part bodies, with the roster's weakest dread-move visual.

Slot 8 is genuinely close to claimable (MINOR GAPS). Nothing found blocks it harder than a half-day doc pass.

---

## 1. Per-slot readiness table (8–14)

Verdicts use the doc's own claimability laws (§3b:121-135 pre-build sheet + sign-off; §4b:182 "not claimable"; §6.0 claim rules). "NEEDS DESIGN" ≠ weak concept — in every case the *identity* is strong; it means pre-claim design artifacts are unstarted.

| # | Boss | Verdict | What's missing (verified) |
|---|------|---------|---------------------------|
| **8** | BRINEHOLM | **MINOR GAPS** | The head-only redesign wasn't propagated: §5b brief (:363-369 "fight scrolls along its back"), §5c :449, §5e :823, and §5i.B's "whale's lee" graze anatomy still spec the rejected island-back body. "Same forge as the hunter's chains" has an ambiguous referent (brief says retired Craghold; no live hunter has chains). Graze form not in the sheet as anatomy. No authored rail-through-negative-space pass (entrance flypast only — spec the Sounding dive to pass under the rail). NEEDS line stale (both items shipped with slot 4; the genuinely-outstanding scoped warn-visibility exemption + y≈−14 deepened start are absent). REUSES points at the unmerged r0 branch (`claude/brineholm-boss-slot-8-3f4p8l`) without saying so. Minor: abalone/eye hexes missing, no skip line. *Cleared by verification: its tri spec cites the band cap; the eye assembly covers §4b; TIDAL DRONE mid-band breather is deliberate.* |
| **9** | KARNVOW | **NEEDS DESIGN** | No §3b translation sheet; §4b map covers only EXPRESSION (lance) + arguably BLINK — GAZE/CHARGE-TELL/FLINCH/NOTICE/DEATH + glyph unnamed. **~2k tris / ~9u single body at the Tier-3 PEAK** — smaller than ASHTALON (span 14) and EITHERWING (span 23) on every axis, in a band contracted for multi-part bodies; no on-screen span target. TENNIS RALLY + REFLECT-ONLY SEAL (its own showcase debut!) appears in **no engine cost ledger** — boss-side cyan interception/re-emission and the gun-sealed phase are new engine capabilities with no landing entry. Parry-job cell "—" though §5i.C already allocates it. Brief still hangs retired Craghold's finger on the trophy chain (sheet says feather-blade + empty hook). Graze form not in sheet. No REUSES/NEEDS line. Empty-hook thread unregistered in the lore web. |
| **10** | KNELLGRAVE | **NEEDS DESIGN** | **The audit's one formally CONFIRMED BLOCKER**: §4b sheet names only NOTICE (the head-lift) — six channels + glyph absent. No §3b sheet (anti-reads, scale target, home backdrop missing; no bell dimensions anywhere). ~2.2k tris = 16% of the WE band floor. Its own landing items (second-sun seeding, TRICK-LINE LINKING, `musicKill()`) are missing from its NEEDS line. Candle 0xffd890 sits ~5° from shipped parry-amber 0xffa838 *while hosting the RHYTHM PARRY CARD* — no clearance note. Parry job not copied into registry. Pivots unnamed, no REUSES, no skip line (music must STAY dead on skip). |
| **11** | WEFTWITCH | **NEEDS DESIGN** | Rose accent 0xd88098 is **hue ≈344° — 1.4° from danger magenta** (G3's doc row forbids ±15°; the shipped gate's sat>0.5 qualifier saves the base color, but the doc's G3 row omits that qualifier, HDR thread flashes can saturate past it, and slot 5 got an explicit clearance clause where 11 got none). No §3b sheet — and this is the roster's highest wrong-noun risk (small hooded bust + 6 thin tube limbs + hairline threads = generic spider / unreadable tangle at 30m; ~1.8k tris is ~8× under band floor, pure L141 "negative space is not mass" territory). §4b map absent (hands-as-face seeded but no 7-channel map; hands get no primitive spec — the CRAGHOLD mitten-fingers precedent). Amber-carrier unnamed (thread-cut stagger exists but which organ/volley carries amber doesn't). Graze form not in sheet; VOICE/Home-biome absent; rest look for SYNCOPATED LOOM unstated. |
| **12** | ONEWING | **NEEDS DESIGN** | **Its hook is invisible as speced**: the dead twin's frame is pure-black non-emissive EdgesGeometry interior to the silhouette on a 0x241418 body — per §3b.1 it appears in neither the black-fill nor lit-edge gate render, yet it's the table-listed hook, a destructible the player must target, and the entrance's gaze target. Scale: ×2.2 of the r9 twin ≈ 21u — *below* the 24u Tier-2 anchor for a "grown colossal" World-Ender, and the sheet's own "no rear view, no pull-ahead, ever" forbids the §3b.6 proximity-beat remedy, leaving raw size (which undershoots) as the only presence lever. Registry palette missing the glow-shape token (distinctness review can't run vs neighbor 11). Oversized Ashtalon-kernel wing is an unflagged silhouette echo (only the 5-echo is flagged). §3b/§4b sheets absent; dodge-mirror aim (reads shipped `poseRing`) uncosted; no parry job. *Otherwise the most behaviorally complete open slot — entrance, rhythm, rule-breaks, dread, destructible all authored with zero contradictions.* |
| **13** | EMBERTIDE | **NEEDS DESIGN** | **Thinnest sheet in 9–14**: the face — the entire boss-read — is "dark relief bumps" with no primitives/sizes/placement; the eye-hollows' darkness-in-additive-glow construction unstated; the only 9–14 sheet with **no palette hexes**, no named pivots, no anti-sunset/anti-terrain read (its own rider line concedes the sun-read). **~1.2k tris vs the 14–22k band floor (≈12×)** at the Tier-4 peak. **No scar and no forward lore gap** (§3 law 6 mandates both; 13 is the only slot with neither). Registry row omits the VALUE axis and carries no gate sanction for a bright frame-filling boss that by design breaks G2+G4 (the §7b pale list names only 4/6/7-queen). Survival card named two ways ("vertical squeeze" :896 vs "Horizon Break" :935) with the squeeze scheduled at the *first* crescendo set while dread cards must be last — a builder could legally mis-place it. Amber-carrier: BEAM DUEL is Surge-fed, so nothing carries amber. Sky-dome crossfade + letterbox squeeze unledgered. |
| **14** | THE UNMASKED | **NEEDS DESIGN** | **~5k tris vs §5g's ~30,000** — a 6× gap on the slot the spend-the-hardware directive targets most (sheets 5 and 8 got band-cap notes; 14 didn't), plus no draw estimate though ~20 multi-mesh eye rigs approach the ≤120 gate alone. **The Apex has no graze form at all** — §5i.B's ladder has no Apex row, so the footer law is *unsatisfiable* for 14 (natural fix: the medley quotes each felled boss's graze form per quoted era). §3b sheet absent (three stage silhouettes untranslated; no anti-reads vs slot 2's concentric-rings family or the gyroscope/ferris-wheel default read; stage-1 lid, stage-3 petal shroud, and the thread-spool relic have no primitives — the spool has no source geometry anywhere since 11's sheet doesn't model one). §4b: EXPRESSION/FLINCH named for no stage. Half the roster's ≤2 reflect-only-seal budget is assigned here in a parenthetical but never placed in the stage plan. No skip line for the live stick-tracking read. |

---

## 2. Blockers

### The formal blocker (survived adversarial verification as written)
- **[10] §4b charisma map**: sheet names only NOTICE; GAZE, BLINK-analog, CHARGE-TELL, EXPRESSION ≥3, FLINCH, DEATH + glyph absent. §4b:182 rules the sheet not claimable. **Fix:** one carrier-map line on 10's sheet (slit-gutter = blink, head-tilt angles = expression, strap-strain = flinch, head-drops-and-candle-dies = death) + glyph.

### The claim-gate class (BLOCKER *at each slot's claim*, per the doc's own laws — verifiers noted the HOLLOWGATE precedent shows the map can be completed at claim time, so these gate the claiming session, not today)
- **[9,10,11,12,13,14] §3b six-field translation sheets absent** (only 8 has one). This is the *anti-BRINEHOLM-battleship* discipline — §3b:129-135 requires the sheet + Fable sign-off BEFORE geometry. Highest-risk absences: 11 (spider/tangle), 13 (sunset-postfx), 14 (gyroscope/loading-spinner), 12 (reads as broken Ashtalon). **Fix:** copy slot 8's :628-640 block as the template; six fields each.
- **[9,10,11,13,14 (+12 partial)] §4b seven-channel maps + glyphs.** **Fix:** one line per slot; carriers are mostly already seeded in §4b:183-189 — the work is finishing the mapping, not inventing it.

### Next-build (slot 8) must-fix before its session starts
- Propagate the head-only redesign into §5b brief / §5c:449 / §5e:823 / §5i.B's graze anatomy (re-anchor SHADOW-RIDE to brow-lee/gill-spray). One doc PR.
- Resolve "the hunter's chains" referent; purge Craghold from briefs 8/9.
- Refresh 8's NEEDS line (drop the two shipped items; add scoped warn-visibility exemption + y≈−14 start) and cite the r0 branch by name in REUSES.

---

## 3. Roster-wide issues (verified, grouped, with fixes)

### A. Doc lags shipped code — one hygiene PR retires ~15 findings
| Issue | Fix |
|---|---|
| Rows 3–5 still `claimed`; builders shipped and sit in `BOSS_ORDER` (violates §6.0's own flip law) | Flip to `shipped` |
| Footnote ¹ "CRAGHOLD stays in BOSS_ORDER" — already removed (`bossDefs.js:679`) | Past-tense the footnote |
| §5b progression note "future controller task — no code" vs live `ladderPickDef`/`ladderTighten` | Mark DONE, point at the code |
| §2/:34, §5 Tier-2 :214, §7.1 :1373 still state the flat 6,000/34 gate vs §5g bands + shipped `TIER_BUDGETS` (tests/boss.mjs:49) | Amend all three to cite per-band budgets (flat = tier-1 only) |
| ASHTALON P3 "immediate hotfix: 0% amber" — shipped (`bossDefs.js:232-244`, amberdiet gate live) | Mark DONE in §5i.C law 1 + footnote 3 |
| Slot 7 mote count triply wrong: sheet 40, entrance 28, code `MOTE_N = 48` (and L162 says 48) | Set both doc references to 48; draws note ~58 |
| §5j retrofits called "dead code without its def field" — no riseBeats/entranceNotes/warnGrade code exists anywhere; spec-only | Reword to "spec-only, unbuilt" |
| All cited `boss.js` anchors drifted (pose :684 not :194; placeGroup :1733 not :859; `updateFlythrough` deleted → entranceScripts.js); `bossRunSetpiece` is actually `debugRunSetpiece`; §5h's `cards:` shipped as `bossCards` | Replace raw line numbers with symbol names |
| Landed-but-listed-as-future: widened cull bounds (shipped at 4), horizon seed flag, above-approach + top banner, slot 11's entire NEEDS line | Sweep DONE marks; prune NEEDS lines |
| §9 reading list omits ~10 lessons the doc leans on inline (L140/L141/L142/L148/L150/L155/L156/L106/L130/L131) and never disambiguates the ledger's duplicate numbers (two L137/L138/L150) | Add them; note the §3b-critical L150 is at LEAPFROG:6127, not :5679 |

### B. Mechanics that landed on paper only (real engine debt)
1. **ORGAN BREAK never shipped** (slots 4/5 declare it with no pending marker; `boss.js`'s parry path implements only SCATTER STAGGER + PANE BREAK) — shipped slot 6's PANE BREAK is documented as a reuse of a debut that never happened, breaking §5f law 4 (teach-before-test) in the live game. **Fix:** extend footnote 3 to mark 4/5 as pending retrofits, or retrofit onto shipped `routePartDamage` (boss.js:2192).
2. **All three Colossi graze forms absent** (SLIPSTREAM/THREAD-scoring/ORBIT ANNULUS; code has only beamEdge(6) + absorbColor(7)); slot 4's "scoring arrives with the slot-6 detector" line is stale — the detector shipped without it. **Fix:** re-slot as retrofits with an owning landing slot (e.g. slot-8 build).
3. **Slot-5 bundle slippage**: entrance-look fallback (main.js:1135 still stomps `setDragonLook(null)`; slot 6 silently shipped WITHOUT its promised "rel ~150: look-yaw locks" beat) and `getBossEta` (absent; §5j's header defaults it to shipped slot 5 while §5e/§5h place it at 10 — a landing-slot conflict). **Fix:** re-slot both explicitly (8 and 10 respectively, their next consumers); add to slot 8's NEEDS.
4. **Tier-3+ surge-immune shield wind-up implemented nowhere** — shipped 6/7 raise shields instantly, so banked Surge chain-skips phases exactly as §5h forbids; no landing marker. **Fix:** costed wind-up seam entry (retrofit 6/7, default 8+).
5. **Second-sun retrofit trigger hazard**: "seeded at the first Calamity kill" but the code lands with slot 10 — under the lifetime ladder, live saves will already have killed Calamities, so the trigger never re-fires for them. **Fix:** seed on load for saves with ≥1 Calamity kill.
6. **Slot 9's TENNIS RALLY + REFLECT-ONLY SEAL uncosted** (see slot table) and the taunt-card UI's landing is circular (§5j defers to "the §5f cost item"; §5f's ledger assigns it no slot).

### C. Gates declared but not enforced (fairness-bearing first)
1. **TTK DPS-sim duration gate**: described twice as live enforcement ("enforced by", "validated by") — does not exist, no landing slot. And §5h names only endpoint TTKs (Sentinels 60–90s → Apex 5–6min): **the gate can't even be written for slots 8–13 without inventing the three middle-band targets.** Fix: add Colossi/Calamities/WE TTK ranges + a landing slot.
2. **Amber ≥20%-of-aimed clause unenforced** — shipped amberdiet checks only the 12s window; a slots-8–14 phase can pass CI far under 20% amber. Fix: add the share assert to `simulatePhase` or cut the clause.
3. **Amberdiet vs survival cards is a design-level contradiction**: 10/13's cards are 20–30s pure-dodge exams and 14's stage 3 is a surge-chase — none can contain an amber per rolling 12s window, so the gate as written fails all three *by design*. Fix: explicit exemptions in law 1.
4. **§7c's mandatory black-fill + lit-edge studio renders don't exist** in `tools/bossstudio.mjs` — slot 8's anti-battleship redesign *hinges on this gate*. Fix: add the render mode or mark "lands with slot 8".
5. **Dichromacy role-pair gate**: adopted, cited by slot 5's oxblood claim, zero implementation, no schedule.
6. Unenforced smaller gates: hp-band/cadence-floor lint (tests assert only >0), q0.5 draw-ratio + card *Low-dial lints, rule-break legality numerics (12's "≤35% returns, ≤2s"), the audio-visual-twin LAW (no assertion, no cost entry).
7. **§6.1's def recipe is stale**: omits `tier`, `cards[]`, `rhythm` — all mandatory on every shipped def.

### D. Collision & palette (critic matrix: full 14×10 grid built; echoes 5↔12, 2↔13, 1↔8, 6↔8, 13↔14 all correctly flagged in-doc)
1. **Role-color enforcement covers 1 of 4 reserved colors** (G3 gates magenta only). Unchecked near-band accents: 7's always-lit amber eye + 9's "/ amber" (the sanction — amber-as-the-amber-emitting-organ — lives only in a `bossDefs.js` comment, never in the doc), 10's candle (≈5° from parry amber, on the rhythm-parry slot), 4's ice-blue (25° from reflected cyan), 11's rose vs surge pink. **Fix:** extend G3/bulletcontrast to all four bands + one principle-10 sentence codifying the organ exception.
2. **Rose-family cluster 11/12/13**: the sheets do separate them on value+glow (verifier downgraded the "unbuildable" claim), but 11's hue sits 1.4° from danger magenta with no clearance clause, 12's row *omits the glow-shape token entirely* (distinctness review can't run), and 13's gradient has no hex endpoints. **Fix:** a one-paragraph rose-allocation ruling under principle 10 + the missing tokens.
3. **Literal swatch share**: 4's bone `0xd8d2c0` vs 6's ivory `0xd8d0c2` — same color within 2/255/channel, adjacent bands, both VALUE-inverted pale bosses. Fix: shift one (warm the ivory).
4. **Glow-shape law granularity is ambiguous**: read at taxonomy level it bans three existing pairs (slit 3/10, field 6/13, lines 2/11); read at descriptor level it's vacuous. Fix: state that orientation/extent/distribution modifiers count as distinct claims, annotate the three pairs.
5. **Unflagged silhouette adjacency**: 2's concentric rings vs 14's stage-2 concentric wheels; 12's dominant mass is an unflagged Ashtalon-kernel reuse (only its 5-echo is flagged). Fix: add uniqueness rulings (wheels are gimbal-tilted 3D + eye-studded; 12's wing is broken/asymmetric).
6. 4's L155 mid-fight flyby passes the player — §5j law 7 says "past you = superiority, SPENT on 3" with no recorded differentiation ruling (5 got one). Fix: one ruling line.
7. 6's "the ONLY boss that never comes to you" is also satisfied by 14's always-there landmark. Fix: scope 6's claim to "approach phase".

### E. Escalation curve (critic: full numeric extraction — hp/cadence/tris/draws/cards/hijack/TTK/F-S)
1. **The sawtooth is asserted, not allocated.** Every allocated number is per-band and monotone; where a slot sits *inside* its band exists only as unwritten convention in shipped def comments ("slot-5 PEAK sits at the top"). A slot-9/10 builder reading only the doc cannot reproduce the sawtooth. **Fix:** add opener/peak position rules (e.g. "opener = band floor hp/cadence; peak = band ceiling") to §5b.6.
2. **The cadence ladder is already inverted at slot 7**: THRUMSWARM shipped P3/P4 at 1.1/1.05 under a comment claiming the 1.2 floor — so the doc floor for slot 9 ("tightest Tier 3 cadence") is *slower* than shipped 7, and the WE/Apex floors (1.1) are slower than a mid-Calamity. Verifier note: felt pacing now comes from the §5i phrase machine, so live pacing doesn't invert — but the doc's numbers do. **Fix:** correct the band table or THRUMSWARM's dials; define 9's "tightest" numerically.
3. **The L140 conservative-sheet trap is live in seven open sheets** (§3 above: WE at 1.2–2.6k vs 14–22k; Apex 5k vs 30k). Only 5 and 8 cite their band caps. **Fix:** one budget-line rewrite per sheet citing the band cap with per-stage/per-part spend targets.
4. **F/S scorecard minimums stop at Tier 3** — no Tier-4/5 targets exist (F≥14/S≥11 is the last row). Fix: add them (e.g. WE F≥15/S≥12, Apex F 16/S 12).
5. **Hijack wording vs numbers**: the WE band (2.2–2.6s) sits below Calamities (2.8–3s) while §5j claims entrances "escalate per band" and 14's sheet claims "thirteen entrances of escalating motion". The real WE escalation carrier is *what breaks*, not seconds. Fix: reword the two claims.
6. **8→9 is the roster's only true grandeur crater** (band peak = spectacle trough; see slot 9 and §5 below).

### F. Lore & cohesion
1. **"Same forge as the hunter's chains"** — referent unresolvable (three candidate readings; brief names retired Craghold). Pick one; register the whose-chains thread in the lore web.
2. **9's empty trophy hook**: pointed at twice, closes the mandatory entrance beat, never registered in the lore web — nothing can pay it off. Register it (the obvious payoff: it awaits *your dragon*).
3. **Slot 6 violates the Tier-3 backward-lore law** — the only Calamity with zero connection to a Sentinel/Colossi gap (both its lore items point forward). Add one backward clause (what the door prays FOR ties to a slot 1–5 gap) or record an exception.
4. **The horn + feather-blade are double-booked** — physically on 9's lance/chain AND wired to 14's wheels, with no transfer clause. One sentence ("14 reclaims the trophies after 9 falls") fixes it.
5. **Scar law (§3.6) unallocated on 7 and 11**; 13 has neither scar nor forward gap (see slot table). 9/14 are fine (hook + disc-crack serve the role — annotate).
6. **4's "borrowed lure-light" open thread has no in-fiction pointer** — nothing in the fight or entrance points at it (unlike every other open thread). Add one beat or drop the thread.
7. **§5c's Calamities row credits three Colossi experiences** (twin bodies, both-flanks arrival, survivor-flees are all slot 5). Rewrite the row with actual Calamities examples.

### G. Combat/feel
1. **Registry parry-job cells are empty for 9/10/11/13/14 while §5i.C already allocates their mechanics** — a claiming session following footnote 3 ("invent at build time") could collide with the existing allocation, and the distinctness diff runs on an empty column. **Fix:** copy the five allocations into the cells (9 tennis rally+seal, 10 rhythm card, 11 thread-cut stagger, 13 beam duel†, 14 star pips). †Also: BEAM DUEL is Surge-fed, not a parry read — it sits in the wrong ladder, and its presence makes the WE band debut TWO parry mechanics against the ladder's own ≤1 header. Reclassify it as 13's Surge mechanic.
2. **Law 7's quota (≥4 dread moves feed the parry diet) is unallocated** — only slot 12 is explicit; 3 is surge, 10/13 are dodge exams (ineligible), the rest unnamed. Fix: tag every §5f dread entry with its answer verb; designate ≥3 more (candidates: 5's mirrored crossfire, 6's Rose Judgment via pane-break, 9's returned Verdict).
3. **The graze-anatomy sheet law has exactly one compliant sheet (4)** — shipped 3/5/6/7 and all open sheets lack the required in-sheet line. Fix: copy one GRAZE FORM line from the §5i.B table into each sheet, starting with 8.
4. **14 has no graze form at all** (no Apex row in the ladder — the law is unsatisfiable, not just unmet). Fix: add the Apex row (medley quotes each era's graze form).
5. **14's reflect-only seal is budgeted but never placed** in its stage plan. Fix: name the stage (natural: stage 2, one wheel's era-quote).
6. §5b's distinctness-review instruction still says "three identity columns" though law C2 made parry job a fourth axis. One-word fix.
7. Perfect-parry heal "+1 HP pip": *checked and cleared* — the player HP-pip model exists; no doc-vs-reality issue. Rest-look descriptions missing for 9 (AGGRESSION EXCHANGE) and 11/13.

---

## 4. Awe-beat readout (the wow-factor lens)

Entrance / mid-battle, each 0–5 as *speced today* (staged retrofits scored at what ships now):

| # | Boss | Entrance | Mid-battle signature | Verdict |
|---|------|----------|---------------------|---------|
| 1 | VOIDMAW | 1 — retrofit staged; today a plain banner | 2 — emotional death; dread card is the §5f worked example | flat-ish, acceptable floor |
| 2 | STORMREND | 1 — staged; today nothing | **0 — NONE. No named card or dread move anywhere in the doc** | **the roster's one truly flat fight** |
| 3 | ASHTALON | **5 — The Overtake (shipped exemplar)** | 3 — Stooping Strike + slipstream (graze form unbuilt) | strong |
| 4 | MARROWCOIL | 2 — shipped rise; Count the Ribs staged | **5 — the L155 ribThread flyby (roster's best shipped fight beat)** | fight carries it |
| 5 | EITHERWING | 4 — Baton Cross full-width crossing | 4 — close-pass scissor lemniscate + Both Halves at Once | solid peak |
| 6 | HOLLOWGATE | 4 speced / lower as shipped (horizon growth unscheduled; self-flagged "loading screen" risk) | 4 — Rose Judgment; pane-break sculpting | ships degraded; banked hijack unspent |
| 7 | THRUMSWARM | 5 — condenses into YOUR dragon | 5 — Your Own Wings (flies your recorded path back) | meme frame, the Calamities peak |
| 8 | BRINEHOLM | 5 — The Reef Was Breathing | 4 — Sounding (dive + arena-wide geysers) | band's best entrance |
| 9 | KARNVOW | 3 — save-stat taunt (doc itself: weakest without the charm flare) | **2 — a lore-quote with zero authored visual** | **the awe trough at the difficulty peak** |
| 10 | KNELLGRAVE | 5 — It Lifts Its Head | 3 — Last Toll rhythm exam; **the clapper never returns mid-fight** | entrance-heavy, fight-light |
| 11 | WEFTWITCH | 4 — The Mended Banner (HUD stitch) | 4 — Warp and Weft full re-weave | good |
| 12 | ONEWING | 5 — grief two-shot → late-banner eruption | 4 — the lying FELLED card + Missing Wing ghost volley | strong |
| 13 | EMBERTIDE | 5 — The Sky Comes Loose | 5 — Horizon Break (hide in the face's shadow) | true band peak |
| 14 | THE UNMASKED | 5 — Don't Move (stillness after 13's maximum motion) | 5 — the Ophanim crack, every eye snapping at once; stage-3 verb-shift | **unambiguous summit** |

**Curve verdict:** the macro-shape is correct — each band's peak exceeds the previous, 13/14's motion/stillness boundary is the strongest beat in the design, and 14 summits unmistakably. Four point repairs, no re-curving:

1. **Slot 9** — both axes at band minimum at the Tier-3 difficulty peak. *Lift:* apply §5g rule 4's surplus-to-dread-spectacle rule — Voidmaw's Verdict traced at screen scale in violet by the lance; every trophy charm flares in its owner's palette per tennis-rally return; give the body presence via the trophy chain arcing at arena scale.
2. **Slot 2** — no named card/dread anywhere. *Lift:* one def-data line under the already-pulled-forward Tier-1 card retrofit (e.g. all blade rings align into one full-frame concentric cage at the CRESCENDO hard-cut).
3. **Slot 10** — best image spent in the first 3 seconds; the bound clapper (the drawable dread) never escalates. *Lift:* §5j law 10's free re-entrance on the final card — during the nine tolls the crack gapes and the clapper is fully revealed straining at its straps.
4. **Slot 6** — shipped degraded (horizon presence still unscheduled backlog) + its banked hijack is never spent. *Lift:* schedule the horizon seed with a landing PR; spend the hijack on one portcullis-slam close-up re-entrance during Rose Judgment.

---

## 5. Polish backlog (verified POLISH, compact)

- 5's sheet carries two conflicting totals (~4.8k/26 vs ~4.5k/≤30; measured truth 4817/26); slot 4 cites L142 for L147's content; Voidmaw's 0.7s-delayed retrofit banner lacks a uniqueness ruling vs 12's late-banner claim.
- Slots 9/10/14 entrances missing skip lines (10's must keep music dead; 14's must resolve the stick-tracking read); 9's stat-quote/charm-flare skip behavior unstated.
- Pivot naming absent on 10/11/13/14 (the telegraph gate finds pivots by name); REUSES lines absent on 9/10/11/12/13.
- VOICE + Home-biome columns adopted in §5h but never added to the §5b table for ANY slot (the §7 in-game pass even gates on the nonexistent home-sky column) — backfill all 14 rows or add a staging note.
- Middle-band TTK targets absent (blocks the DPS-sim gate; also listed under §3.C).
- §5h's assisted-capture ledger flag contradicts its own card save schema (no field for it).
- 13's sky-dome crossfade + letterbox squeeze uncosted; 12's dodge-mirror aim uncosted (reuse base = shipped `poseRing`).
- Registry entrance pointer for slots 1/2 directs to §5d sheets that don't exist (choreography lives in §5j's retrofit block).
- 9's palette cell lacks the glow-shape separator; "glints" ambiguously overlaps the points family.
- 4's ice-blue vs reflected-cyan proximity is retrospective (shipped) — note it when G3 extends to all role bands.

---

## 6. Checked and cleared (do not re-flag)

The adversarial pass killed 57 candidates. Notable clears, so future sessions don't re-litigate:
- Slot 8's tri spec **does** cite its band cap ("Calamities cap 14k"); its TIDAL DRONE slow pulse is the flagged deliberate breather; its eye assembly covers §4b via the eye ladder.
- The slot-5 engine bundle **landed** (entranceScripts.js, bossRhythm.js, getBeatClock, amberdiet/rhythmprint, TIER_BUDGETS, card system, bossLedgerStats, ladder controller) — only the two small items in §3.B slipped.
- 5↔12 family echo, 2↔13 rhythm echo, 1↔8 mask ruling, 6↔8 environment axes, 13↔14 boundary, corona reservation: all correctly flagged in-doc.
- §4b seeded carriers match their §5d sheets everywhere they exist (EMBERTIDE's hollows, 14's lid, 6's migrating pane discrete-step ruling).
- No stale re-banding text survives outside the deliberate edit note; hp bands never overlap; card counts monotone.
- WEFTWITCH's rose passes the *shipped* gate binary (sat 0.41 < 0.5 qualifier) — the issue is the doc/gate spec mismatch + razor margin, not an unbuildable slot.
- Perfect-parry heal is implementable (player HP pips exist); ghost-bullets need no new bullet capability (per-bullet color shipped); second-sun timing is *consistent* as design (the hazard is only the retrofit trigger, §3.B.5).

---

## 7. Suggested actioning order

1. **One doc-hygiene PR** (§3.A + slot-8 propagation + Craghold purge + §6.1 def recipe): retires ~25 findings, unblocks slot 8's claim.
2. **Slot-8 pre-claim mini-pass**: amber-carrier allocation, GRAZE FORM line, negative-space pass on the Sounding dive, NEEDS/REUSES refresh. (Its §3b sheet already exists.)
3. **Engine-debt decisions** (§3.B): ORGAN BREAK retrofit-or-refile; Colossi graze forms; entrance-look fallback → slot 8; getBossEta → slot 10; shield wind-up; second-sun retrofit trigger.
4. **Gate-truth PR** (§3.C): TTK middle bands + DPS-sim landing slot; amber-share assert or clause cut; survival-card exemptions; black-fill/lit-edge studio renders (needed by slot 8's CP1).
5. **The 9–14 sheet pass** (can be one design session per slot, or one batched session): §3b sheets + §4b maps + band-budget rewrites + parry-job cell copies + graze-anatomy lines + the four awe lifts. Slot 9 needs the deepest work (presence at the band peak + the uncosted tennis-rally seam).
