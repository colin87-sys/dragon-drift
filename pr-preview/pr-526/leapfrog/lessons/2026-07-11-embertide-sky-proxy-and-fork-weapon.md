# EMBERTIDE rung 13 — the sky-face can't be an organ (proxy it), and the fork became a weapon

**What we did.** Gave EMBERTIDE (slot 13, tier 4, the sky boss) its lance rung. You dwell-paint three
**station-space proxy organs** in the lane (`eyeMarkL/R`, `mouthMark`) + `crestPivot` (V1 anchor);
the **lance's jade seal is stamped on the real sky-face node** (`eyeHollow0/1`, `mouthNotch` — a
mint rim, NOT a literally-dark mark; the brand is role-color jade like the shimmer/reticle) via
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

**What the CP2 diff critic caught (all folded before ship):**
- **The boss's OWN hazard made the organs unreachable, and the comfort test only checked the STATIC
  lane.** EMBERTIDE's `skyCrush` clamps the player to `bossArenaHY ~13.4` for ~10s of every phase — so
  the high organs (eyes/crest at y~19) are out of the acquire cone then, and leading the reticle to
  them strands the player against the invisible ceiling on dwell that never accrues (the exact comfort
  failure the whole law exists to prevent). `embertideorgans` asserted positions against the STATIC
  `laneMaxY 22`, never against the DYNAMIC `bossArenaHY` this def itself lowers — a false-green on the
  boss's own signature hazard. **A comfort test must check reachability under every arena-clamp the def
  imposes, not just the static lane.** Fix: seal the high organs while `crushHoldT > 0` (the
  recoilSealed precedent), keep the low mouth as the crush anchor — and this gave the rung the honest
  FAIR WINDOW the dropped surfacing-gate couldn't (the crush is a REAL open/close state).
- **A new release path can VOID a banked set into a seal — the flagship play self-destructed.** "Bank a
  full set at the P4 floor, tap" routes `strikeSurge` → `breakShield` (which ARMS the P5 survival card →
  `lockDeflected` true) → `surgeForkLances` — so every forked pip arrived voided into the seal, breaking
  the one-deflect "no lance is ever silently wasted" law. This is the rung's ghost-fork analog: the
  mechanic's marketed doorway broke at exactly one seam. Fix: `surgeForkLances` bails if
  `lockDeflected()` (keeps the set, resumes ashen), AND `beginCard(survival)` zeros `beamDuelT` so a
  live duel's forced drift-shove (and its lance-extended window) never carries into the survival card
  whose whole read is a different dodge. **Every phase-SEAM is a place a banked-resource mechanic can
  dump into a sealed window — test the tap AT the seam, not just mid-phase.**
- **An unbounded accumulator + a seam-only debug arm.** The fork-extend had no upper bound (clamped to
  ~2× base); the `debugArmBeamDuel` seam didn't reset the duel's held/tick sub-state like the real arm,
  so a seam-armed duel was subtly stale (fixed). And the reparent assertion was `!face || out-of-lane`
  — a name typo passed too; tightened to `=== null` (the proxies resolving elsewhere prove it's the
  reparent, not a broken test). **A "prove the trap" assertion must fail on a broken test, not pass on
  one.**
- **Respect the boss's art law in the NEW feedback too.** The brand rim had to be NON-additive
  (EMBERTIDE is the "opaque wall of light, ZERO additive" boss) and sized/parented per organ (the eye
  tears open and the mouth balloons ×2.75 on tells — a child ring inherits that; parent to `faceRig` at
  the node's position, and give the wide-flat mouth an ELLIPTICAL rim or a circle slices through it).
