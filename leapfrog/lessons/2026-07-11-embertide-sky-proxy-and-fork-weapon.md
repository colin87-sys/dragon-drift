# EMBERTIDE rung 13 — the sky-face can't be an organ (proxy it), and the fork became a weapon

**What we did.** Gave EMBERTIDE (slot 13, tier 4, the sky boss) its lance rung. You dwell-paint three
**station-space proxy organs** in the lane (`eyeMarkL/R`, `mouthMark`) + `crestPivot` (V1 anchor);
the **dark-halo brand renders on the real sky-face node** (`eyeHollow0/1`, `mouthNotch`) via
`setBrandedFeatures` — aim the lane-anchor, the sky-face answers. The ONE new rule — **THE FORK IS A
WEAPON**: pips forked into a Surge while the BEAM DUEL is armed each extend the duel window
(`+0.35s/pip`). No burn — the fork-extend IS the escalation. Verified: `embertideorgans` (comfort +
the reparent trap), `embertidefork` (extend scales with pips, gated on an armed duel), `lockdps`
(10th lance-capable, no deleter), `boss.mjs`.

**The CP1 killed the plan's organ scheme for a reason no prior rung hit: `skyReplace` REPARENTS the
rig, so `partWorldPos` can't even resolve the face nodes.** The plan's proud claim — "all four face
nodes already exist, no new empties needed" — was true about the names and fatally false about
everything else. `enterFight` does `scene.add(model.rig)` (a Three.js reparent) for a `skyReplace`
boss, moving the whole face subtree OUT of `group` — and `partWorldPos` is `group.getObjectByName(name)`
**with the null result cached forever**. So in a live fight every face-organ lookup returns null and
the lance is silently, totally dead. **The double trap: the studio/headless path never reparents (that
only happens in the live fight), so a naive organ test GREENS on a dead lance.** The organ test MUST
drive the post-reparent path (`bossForceFight` → `enterFight` → `scene.add(rig)`), and it asserts
`partWorldPos('eyeHollow0') === null` as the positive proof it did. (And even resolved, the face sits
at world-Y 150+/|x| 90-420 at camera-lock scale 21.6 — the ONEWING eye trap at 5× scale, uncorrectable
by any def dial because the rig is camera-locked, not `placeGroup`-driven.)

**The reusable pattern — station-space PROXY organs with model-side brand projection.** The boss
already used it for its own muzzle: `crestPivot` lives on `group` (the station) precisely because
"bullets crest from a sane gameplay position while the VISUAL crest is up in the sky" (its own code
comment). We generalized that to the lance: proxies on `group` are the AIM/comfort targets (in-lane,
comfort-legal — worst ~9.1 X / ~20 Y ≤ 10.4/22), and the MODEL renders the brand feedback on the
mapped sky-face node. The lane-projection precedent was already in this exact boss (`horizonPocketX =
sweep*8` projects the face gaze into lane-X). **When an organ's fiction lives outside the lane
(sky/backdrop/camera-locked), split it: a station-space proxy carries the gameplay, the model carries
the presentation.** (Give the proxy Y the same ~2u comfort slack the X law has — the 22 ceiling has
no built-in slack, so eyes at Y 20.9 are aimable but not comfortable; drop them to ~20.)

**The surfacing-gate was a dead premise — verify the STATE exists before gating on it.** The plan
reused BRINEHOLM's `eyeOrgan` surface/submerge gate as a list (`surfaceOrgans`). But EMBERTIDE's face
never submerges mid-fight (it rises once at the entrance and only sinks on death) and the model exposes
no surfaced predicate — so the gate would be dead code from birth (the `quietDwellMult` class). Dropped
it: organs live, gated by the normal danger/deflect windows. **A "fair window" mechanic needs a real
state that opens and closes; grep that the state cycles before you build a gate on it.**

**THE FORK IS A WEAPON — a rule that adds TIME, not damage, is invisible to the balance model (and
that's correct).** The beam duel was a real shipped Surge mechanic (arms at Surge≥50%, 3.6s window,
`beamDuelT` timer) with a clean `surgeForkLances` seam. The extend is a genuine ~5-line branch gated
`def.beamDuel && beamDuelT > 0`: the fork still fires its clamped-damage lances AND adds duel time.
Because it adds **zero damage**, `lockdpsCore` needs NO new term (contrast ONEWING's echo, which DID —
that one added damage-pips). Margins are a comfortable 1.6-2.3; P5 (Horizon Break) is honestly sealed
(the survival card → `lockDeflected` true, and the duel refuses to arm there). Design-honesty note: the
fork does damage AND duel-time, so it strictly DOMINATES loosing during a live duel — that's the
designed incentive ("the fork IS the weapon"), not a trade; say it out loud. And the duel arms
system-timed (auto at 50% surge), not player-timed — the "bank a set before the crest" fantasy may read
as slot-machine timing; flagged for the owner's preview judgment (add an arm pre-warn if it feels
random). **No burn: config was right, the plan doc's "chip + burn" line was stale — the fork-extend is
13's escalation, exactly as ONEWING's echo was 12's (the escalation is the signature mechanic, not the
burn dial, which stays free as the emergency valve).**
