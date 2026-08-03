# RUNG 14 — THE UNMASKED: author the organs the sky-scale hides, and gate the finale burn on a collection

**What we did.** Shipped the last rung of the lance ladder (slots 10–13 done): the APEX's lance across
its three `formLifebars` forms. Stage 1 crack-seam wounds, stage 2 six watcher eyes + five reliquary
relics, stage 3 two wing-roots — every organ authored comfort-legal at `scale 2.4`. THE RECKONING:
brand all five relics → the finale burn unlocks (`scarBurn.fracBySlot.unmasked 0.20`, ~⅓ of clear pace)
+ the eye-snap reveal. Went CP1 → build → CP2 → fold → verify, like the four before it.

**The false premise the CP1 killed (the finale's version of the out-of-lane trap): "curate 6 of the ~20
visible eyes" is unbuildable — ALL eight visible wing eyes are out of lane.** The def comment said "~20
eyes"; the live model has 8, one per wing at the ELBOW (`wing-local (0.7,3.5)`). At `scale 2.4` with the
seraph centred at world-y 13, the elbow eyes land at world-Y ~28 (upper pair) and |x|>10.4 (mid/lower)
— the ONEWING trap across a whole organ FAMILY, and no def dial rescues it. The fix was **AUTHORING, not
curation and not inversion**: six NEW inner-covert eyes via the existing `eyePlace` recipe at
comfort-legal seeds (three mirror pairs), **parented to the stage rig directly, NOT the wing pivots** (a
pivot child drifts off its eye under the breath/mantle-flare). **The comfort band at sky scale is TIGHT:**
with station sway ±~5.2 eating half the ±10.4 budget, an organ needs `|stage-local x| ≲ 2.2` and
`local y ∈ [−4, +3.4]` (the ~2u Y-slack). Measured worst-case live: |x| 9.0, maxY 19.4 — real margin.
**Reusable:** when a boss's iconic feature (its eyes) lives out of the lane at scale, you don't curate the
unreachable ones or invert — you author NEW in-band instances of the same feature and let them BE the
organs; the fiction ("six watcher eyes among the field") survives, the comfort law holds.

**`formLifebars` needed a `phaseSpans` fix, and it was LOAD-BEARING (not cosmetic).** `lockdpsCore.phaseSpans`
computed `(atFrac − next)×hpMax` = [96,72,72] for the finale; a form-lifebars boss fights each form from a
FULL bar (`currentPhaseHp` returns `hpMax`), so every span IS `hpMax` = [240,240,240]. Without the fix the
model mis-priced the ROI ceiling AND **falsely fired the not-a-phase-deleter gate on stage 3** (modeled TTK
33.8 < timer 34) — it would have BLOCKED the correct config in CI, not just mis-reported. `formLifebars`
greps to unmasked only, so the fix is byte-identical for every other row. **A model that doesn't know a
boss's HP shape doesn't just under-report — it can red-gate the honest tuning.**

**THE RECKONING is a def-gated collection→unlock — and a per-fight latch must reset on BOTH teardown
paths.** `def.burnGate: 'reckoning'` zeroes the burn frac until `reckoningDone`; a `lockPaint` listener
collects relic brands into a Set (dedup-safe; snap/stack paints all count — this gates unlock TIMING, not
damage magnitude, unlike ONEWING's echo which excludes snaps). **The self-caught HIGH:** `burns` is cleared
in BOTH `endEncounter` (boss-defeat) AND `resetBoss` (game-over / new-run hard teardown) — the reckoning
latch was only reset in `endEncounter`, so dying after the collection leaked the unlocked burn into the
next finale (burn live from relic #0). **Grep every fight-scoped `let` against BOTH teardown functions;
if `burns` resets in two places, your new latch does too.**

**A "capture-safe reveal" must KILL the in-flight wind-up, not just wipe `pending` + bump `attackTimer`
(the CP2 fix).** The completion hold did `pending.length=0` + `attackTimer=max(..,1.6)` — but an ARMED
`chargeT` counts down and FIRES when it expires *regardless of `attackTimer`*, refilling the wiped
`pending`. So a volley lands on the player mid-screenshot. Every sibling event-driven hold (weftMend,
thread-stagger, felled, setpiece, raiseShield) clears the charge: `if (chargeT>0){ chargeT=0;
model.setCharge?.(0); model.setAttackTell?.(null); }`. And the fire-hold must be LONGER than the stare
(1.8 > the 1.7s snap) so nothing re-arms mid-reveal. **`attackTimer` gates the NEXT telegraph; it does not
cancel the CURRENT one — an event hold that forgets the live charge is a hold with a hole.**

**Two smaller reusable moves.** (1) **Non-destructible relic anchors** dissolve the "a destructible
collectible dies unbranded → the collection is permanently unreachable" trap — the relics are trophies,
not cracking organs, so the RECKONING can never be locked out. (2) **`shimmerExclude`** keeps self-presenting
collectibles (the glowing relic trophies) OFF the 8-slot organ-shimmer pick-menu, so stage 2's 12
paintables don't starve it — the relics carry their own palette glow (a sanctioned §3-law-8 exception: they
MUST self-present to be found). (3) Dropped `starEye`/`halo` from the stage-3 lockParts — they sit at the
rig centre coincident with the collapsed virtual `focalEye` aim anchor, so painting them would double a
target on one pixel; the two off-centre wing-roots + the virtual centre already reach the cap of 6.

**Test-harness gotchas (the finale is a 3-form, self-freezing fight — both bite headless).** (1) An idle
forced fight KILLS the player at ~55s (variance run-to-run), so a single 3-stage comfort pass (~46s)
flakes on the late stage — **measure each stage in its OWN fresh `forceFight` boot** (~15s each, immune to
the late death). (2) The reckoning's eye-snap + attack-hold FREEZES the scene, and headless chromium
throttles the rAF game loop during an idle node-level `waitForTimeout` when nothing animates (knellgrave
stays busy tolling, so knellburn can node-wait) — **poll `bossBurns()` inside a single `evaluate` to keep
the loop alive** and observe the DOT drain. (3) Drive the RECKONING gate with synthetic `lockPaint`/
`lockVolley` events so the test isolates the unlock GATE from music-beat timing (the beat-timed perfect
release is knellburn's shared-code job).

**rnd-stream discipline held for free this time.** The six new `eyePlace()` calls consume 18 `rnd()` draws,
but they're the LAST build-time consumers (the knot/greatEye/stage-3 use none) — so nothing seeded moved
(only the runtime pain-skitter's stream position shifts, a cosmetic). Contrast the crack-seams, which needed
a private `crnd` stream precisely because they were inserted BEFORE stage 2's seeded draws. **The rule: a
new seeded insertion is safe iff nothing seeded is BUILT after it; grep the `rnd()` sites and check what
follows your insertion point, not just that you added RNG.**

**What it unlocks.** The lance ladder spans slots 10–14 — a genuine DPS/utility tool from the first
World-Ender through the Apex, the original "helpful by the last boss, not useless" goal, complete. The
finale owns the game's biggest RAW volley numbers (240-HP form bars) without a dominating share (~⅓). The
owner's HARD gates remain: FEEL of the reveal + the reliquary look + the thin finale margins on the preview.
