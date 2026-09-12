# Skybreak: playable slice specification

**Planning revision 1 — 12 September 2026.** These are testable starting decisions. They become production rules only after the indicated playtests. The boss's detailed combat specification lives in [BOSS_REFERENCE.md](BOSS_REFERENCE.md); assets and work packages live in [ART_DIRECTION.md](ART_DIRECTION.md) and [IMPLEMENTATION.md](IMPLEMENTATION.md).

## 1. What must become fun

The fantasy is **controlling a powerful living creature through a beautiful, dangerous place**. The repeatable pleasure is seeing a line, banking into it, making a close maneuver, earning a burst of power, and using that power at the right moment.

The player should be able to describe a better next attempt: “I can take that inside arch,” “I rolled too early,” or “I spent Surge before the heart opened.” A new currency or a daily obligation does not answer those questions.

The first slice must deliver three things:

1. **Flight that rewards intention.** Steering and animation agree; threats are visible early enough to choose a response; mistakes have understandable causes.
2. **A dragon worth looking at.** Cinder remains convincing when viewed from behind, banking, rolling, hurt, and accelerating. A good still image is insufficient.
3. **A boss with a remembered moment.** The Stormwarden opening its carapace and firing its hollow storm beam should be the image a player recalls. The player actively earns the opening and can improve its execution.

The signature clip is a tight causeway line, a Surge through brittle stone, the enormous guardian waking, and a dragon threading its beam. The prototype should make that moment happen naturally during ordinary play. Sharing cannot manufacture interest in an uninteresting run.

## 2. Scope and player journey

| Included in the slice | Deferred until the slice works |
|---|---|
| Cinder; one silhouette, one rig, one combat profile | Dragon roster, riders, equipment, stat builds |
| The Shattered Causeway; six authored sections | Endless generation, additional biomes, branching campaign |
| The Stormwarden; one encounter with escalating cycles | Boss Rush, additional bosses, multi-boss progression |
| Standard full run and unscored boss practice | Ranked services, accounts, multiplayer |
| Local personal best, three mastery goals, simple challenge link | Economy, shop, mission stack, daily/weekly rewards |
| Touch, keyboard, mouse steering; readable portrait and landscape | Controller support and extra gesture shortcuts |
| One coherent visual and audio treatment | Large effects library, cosmetic variants |

Initial journey:

1. The landing screen shows Cinder moving subtly in the actual game renderer, one **Fly** action, and compact settings. Avoid a separate expensive 3D showroom.
2. Control starts within one second of Fly after required assets are ready. The first ring arrives about three seconds into flight.
3. The opening teaches steering; the first emitter teaches a deliberate roll or ordinary dodge; a brittle shortcut shows the value of Surge.
4. The course combines the same ideas, offers an optional tight line, then reveals the guardian already embedded in the world.
5. An updraft restores health before the boss. Charge carries over, so flight performance still changes the opening options.
6. The boss tests alignment, defense, and Surge timing.
7. The result screen shows the outcome, personal-best comparison, one actionable improvement, and **Fly again**. A loss at the boss also offers **Practice boss**.

Target successful session: about **2–3 minutes**, including the finish. The route takes 80 seconds at cruise. Skilled boss clears may be shorter than 50 seconds; ordinary first successful clears may take 55–85 seconds or longer. These are pacing hypotheses, not a guaranteed timer.

## 3. Controls and camera

### Actions

| Action | Touch | Keyboard / mouse | Exact initial behavior |
|---|---|---|---|
| Steer | Relative drag in the flight area | WASD/arrows; optional mouse drag | Moves across the route cross-section; releasing input stops lateral motion after damping, without recentering position |
| Roll | Visible 64 CSS px button; mirrors with handedness | Q left / E right | 0.50-second roll; 0.90-second cooldown; defensive window against light bolts |
| Surge | Separate visible 64 CSS px button | Space | Spend a full 100 charge; 2.50-second flight burst, or a strong attack on an exposed boss heart |
| Pause | Visible pause action | Escape | Stops simulation and audio scheduling; clears held input |

The steering pointer is captured until release/cancel. An action-button touch does not move the steering anchor. Taps, holds, and swipes are not overloaded with hidden alternate actions.

A single touch Roll button chooses the sign of current horizontal input when its magnitude exceeds 0.15; otherwise it uses the last nonzero direction, initially right. Roll direction changes animation only in this slice. It does not secretly add lateral displacement. Keyboard Q/E therefore confer no dodge-distance advantage.

When a valid boss target is aligned, Cinder breathes automatically. This removes a fourth held button while preserving deliberate aim through positioning. There is no free damage to a boss merely because it is on screen. The reticle visibly attaches only inside the allowed alignment region.

Use a 100 ms input buffer for Roll near the end of its cooldown. Use a 150 ms buffer for a Surge request near a heart opening. Never retain a request through pause, a restart, or a long invulnerable phase.

### Movement and defensive values

| Parameter | Initial value | Purpose / review |
|---|---:|---|
| Simulation | 60 Hz | All gameplay timers use integer ticks |
| Cruise speed | 42 m/s | 3,360 m / 42 = 80 seconds |
| Flight Surge speed | 58 m/s for 150 ticks | Saves approximately 0.95 seconds per full burst on the same route |
| Horizontal bounds | −7.5 to +7.5 m | Same playable cross-section on every aspect ratio |
| Vertical bounds | −4.5 to +4.5 m | Same collision and aiming space in portrait and landscape |
| Maximum lateral / vertical speed | 6.5 / 5.5 m/s | Start here; validate corrections at ring spacing |
| Acceleration limit | 30 m/s² | Responsive without an instantaneous model snap |
| Neutral damping time | Approximately 0.16 seconds | Small carry, quick stop; implement one consistent damping model |
| Analog dead zone | 0.08 | Avoid idle drift; clamp/normalize diagonal input |
| Touch full-scale radius | 100 CSS px | Sensitivity setting scales this; no world-rule change |
| Health | 3 segments | Every damaging contact costs one segment |
| Post-hit protection | 75 ticks / 1.25 seconds | Prevent clustered accidental hits |
| Torso collider | Capsule, 0.42 m radius, 1.60 m total length | Wings and tail are visual; show the torso hit cue when damage occurs |
| Roll duration / cooldown | 30 / 54 ticks | Cooldown starts when Roll starts |
| Light-bolt protection | Roll ticks 6–19 inclusive | Ordinary bolts are deflected during this interval |
| Perfect parry | Roll ticks 8–15 inclusive | A collision in this interval earns the parry event |

For a Roll, tick zero is the tick on which the request is accepted. Perfect parry is a subset of the defensive interval, never an additional hidden dodge. Ordinary deflection prevents damage but earns no charge or score.

Solid stone and the boss's continuous beam require movement; Roll does not negate them. Brittleness and reflectability use distinct shapes and materials. No ordinary collision instantly kills a healthy dragon. Route boundaries use a soft clamp and wind feedback, with no damage or score penalty. Actual visible obstacles deal damage.

Resolve a hit, remove/resolve the responsible contact, and prevent that attack ID from damaging the player again. Repeatedly overlapping the same wall must not create an inescapable damage loop.

### Camera contract

Follow a smooth curved centerline using a stable transported frame. The player controls offsets across that frame, not the camera's arbitrary world axes. The path must not twist its up direction at spline joins.

Derive camera distance from the approved dragon's wingspan and desired screen coverage, rather than guessing an offset that crops its wings. With a 7.6 m wingspan, 70-degree vertical field of view, and 390:844 aspect ratio, approximately 33.6 m of viewing distance gives 35% width coverage. Start the portrait camera about 6 m above the torso, looking 24 m ahead, then solve the framing in the actual viewer. Landscape uses its own framing distance with the same gameplay bounds. Bank the dragon up to 32 degrees and pitch up to 12 degrees. Camera roll is limited to 2 degrees and defaults to zero in reduced-motion mode. Roll animation does not roll the world.

At a 390 × 844 CSS px reference viewport, aim for the dragon's wings to occupy approximately 30–38% of width and its torso to sit around 68% of screen height. The next actionable opening must remain visible above it. Reframe by aspect ratio while preserving the same simulation space; do not crop away attacks in portrait.

Surge may add at most 4 degrees of field-of-view expansion with a short eased transition. Reduced-motion mode removes FOV pumping, camera shake, and intense speed streaks. These options do not alter collision, rewards, or attack timing.

## 4. Charge, Surge, and scoring

### One charge meter

Charge starts at zero, caps at 100, and does not decay. A full meter enables Surge. Spending it sets charge to zero. Charge can accumulate during the burst; the next activation waits until the current burst ends.

| Event | Charge | Score base | Limits |
|---|---:|---:|---|
| Ordinary ring | 8 | 100 | One award per ring opportunity |
| Perfect ring | 12 total | 150 total | Replaces the ordinary award |
| Valid route near miss | 6 | 25 | Once per marked risk surface; no damage in the encounter |
| Perfect route parry | 18 | 60 | Once per emitter attack, even if it contains multiple bolts |
| Empty roll / ordinary deflection | 0 | 0 | Animation alone is never a scoring action |
| Brittle shortcut broken with Surge | 0 | 150 | Once per authored obstruction |
| Boss vane / seal broken | 12 | 200 on first destruction only | Charge repeats once per component per cycle; score never repeats across cycles |
| Perfect boss parry | 18 | 0 | At most two charge awards per cycle |
| Clean central beam passage | 25 | 0 | Once per beam; must remain in the inner safe region throughout |
| Boss heart damage | 0 | 0 | Damage is progress toward victory, not farmable score |

Flight Surge accelerates Cinder, creates a forward flame wake, and shatters explicitly brittle barriers on contact for its 150 active ticks. It does not protect against ordinary masonry. Rings retain their usual scoring and collision rules during Surge.

At the boss, Surge is enabled when the heart is exposed and a valid heart alignment is present. Its attack deals 60 HP at its release tick; normal breath is suppressed for the first 0.50 seconds of the Surge animation. A request with no valid opening does not consume charge. The button shows a small shield state while the heart is protected.

The cross-context meaning stays “spend earned power for a spectacular committed attack.” The route uses the forward burst to break an obstruction; the boss uses its concentrated breath. Neither requires learning a new input.

### Ring precision and chain

Evaluate a ring when the swept torso center crosses its route plane. A center distance of at most **1.45 m** earns a ring; at most **0.45 m** earns Perfect. The visual rim is not a solid hazard. Missing a ring breaks the flight chain but does not deal damage or remove charge.

For streak count n before the current ring:

~~~text
flightMultiplier = min(3, 1 + 0.25 * floor(n / 3))
award = round(baseScore * flightMultiplier)
~~~

A collected ring uses the previous multiplier and then increments n. A miss or damage resets n to zero. Near misses, parries, and brittle breaks use the current flight multiplier without incrementing the ring streak. Charge never receives a multiplier.

This reaches ×3 after 24 consecutive rings. All 32 perfect rings with no chain break produce **10,350 ring points**; 32 ordinary rings under the same chain produce **6,900**. Other finite route rewards are additional. These are useful arithmetic fixtures, not medal thresholds.

The flight multiplier applies only to flight events. At boss entry the chain presentation ends. Boss component awards, clear bonuses, and time bonuses are fixed, as stated on the result breakdown:

~~~text
bossComponentScore = 200 * numberOfDistinctComponentsEverBroken  // maximum 1,000
clearBonus = 2,000
bossTimeBonus = clamp(floor(20 * (100 - bossActiveSeconds)), 0, 1,000)
healthBonus = 200 * healthRemainingOnVictory
~~~

The boss timer includes all active combat states, including transitions and beam sequences. It excludes the introductory reveal, pause, and victory animation. Waiting longer cannot increase score: repeated component breaks and boss parries give no extra points, and the time bonus only decreases. Defeat awards already-earned route/component points without clear, time, or health bonuses.

All score and charge awards come from one ledger. A result screen is the sum of those events. Damage resolves before reward eligibility for the same encounter; a hit cancels its near-miss or clean-beam reward. Ring crossing after a same-tick hit uses the reset multiplier.

## 5. The Shattered Causeway

### Spatial and pacing structure

Use one 3,360 m centerline with gentle authored bends and vertical rises. It is a course to learn. Optional passages reconnect with the same centerline and use the same ring-opportunity IDs; there is no second generated route hidden behind them.

Coordinates below are local to the centerline: **s** = distance in metres, **u** = right, **v** = up. Nominal times assume cruise; Surge changes arrival time. Place hazards by distance and update their behavior with simulation ticks. Do not use wall-clock timers to skip or rush route events.

| Section | Distance / nominal time | Flight task | Visual composition | Required payoff |
|---|---|---|---|---|
| A. Launch shelf | 0–420 m / 0–10 s | Four broad, readable steering corrections | Cinder launches from pale stone; open sky and a distant curved aqueduct | First input immediately moves the dragon; first ring at 3 s |
| B. Broken aqueduct | 420–1,050 m / 10–25 s | Follow an S-line through large arches; read first bolt | Repeating arches become progressively damaged; one strong light direction | First clear dodge or parry; visible downstream line |
| C. Wind sluice | 1,050–1,680 m / 25–40 s | Choose the safe arch or spend Surge on brittle stone | Water ribbons peel into clouds; a dark obstruction contrasts with a bright exit | First meaningful resource decision and stone-break spectacle |
| D. Hanging gardens | 1,680–2,310 m / 40–55 s | Combine climb, bank, a bolt, and a low exit | Suspended planters, roots, and a single waterfall frame the path | A short sequence the player can learn as one flowing movement |
| E. Broken rib | 2,310–2,940 m / 55–70 s | Choose wide outer line or tight inner rib | Guardian's crescent silhouette is visible beyond the final spans | A mastery line that earns more charge/score through precision and proximity |
| F. Observatory approach | 2,940–3,360 m / 70–80 s | Four calmer rings; read the waking guardian | Foreground clears, clouds pull toward the boss, health-restoring updraft | Comprehension and anticipation before combat |

### Exact first-pass ring schedule

Every row contains one opportunity per listed s value. The associated (u,v) pairs are in the same order. All use the same 1.45 m / 0.45 m collection thresholds.

| IDs | s values in metres | Matching (u,v) centers |
|---|---|---|
| A01–A04 | 126, 210, 294, 378 | (0,0), (−0.6,0.1), (0.6,0.25), (1,0.5) |
| B01–B06 | 504, 588, 672, 756, 840, 966 | (0,1), (−2,1), (−3,0), (−1,−1), (2,0), (3,1) |
| C01–C06 | 1,134, 1,218, 1,302, 1,428, 1,512, 1,596 | (3,2), (3,1), (1,0), (0,0), (−3,0), (−3,1) |
| D01–D06 | 1,764, 1,848, 1,974, 2,058, 2,142, 2,226 | (−2,2), (0,3), (2,2), (3,0), (1,−2), (−1,−1) |
| E01–E06 | 2,394, 2,478, 2,562, 2,646, 2,772, 2,856 | (−1,−1), (1,−2), (3,−1), (2,1), (0,2), (−2,1) |
| F01–F04 | 3,024, 3,108, 3,192, 3,276 | (−1,0), (0,0), (0,0), (0,0) |

Two choice groups modify positions without adding ring opportunities:

- **Sluice:** C04 has a safe-line instance at (−2.5,0), and a direct instance at (0,0) behind brittle obstruction S01. Collecting either resolves C04. The other gives nothing and never creates a second miss.
- **Broken rib:** E02/E03/E04 have wider bypass instances at (−3,0), (−3,1), (−2,1). The listed main instances form the tighter inner line. Each pair shares its original ID. Both lines reconnect before E05.

Start ordinary arch apertures at 4.8 m wide × 4.0 m high. The inner rib may narrow to 2.6 m × 2.6 m around its line; test the swept capsule and entry/exit corrections at Surge speed before accepting it. Keep decorative wing clearance visually plausible even though wings are not colliders.

### Hazard and landmark schedule

| ID / placement | Behavior | Telegraph / safe answer | Reward condition |
|---|---|---|---|
| G01, s=630 | First broad broken arch | Opening visible at least 120 m ahead; follow the next ring | Passage itself has no separate score |
| R01, s=672 | Marked inner edge beside B03 | Wide safe clearance outside the highlighted edge | Near miss once, only after passing without damage |
| T01, trigger s=840 | One emitter bolt | 1.20-second wind-up; tracked aim freezes before launch; steer aside or roll | One perfect-parry award |
| T02, trigger s=1,176 | Same bolt from opposite side | Same cue language; cannot spawn inside current safety envelope | One perfect-parry award |
| S01, s=1,386 | Brittle plate on direct sluice line | Clear fracture pattern; safe aperture at u=−2.5 | 150 base points if broken during Surge |
| R02, s=1,470 | Sluice exit edge | Exit visible before entering; no forced last-second reversal | One valid near miss |
| T03, trigger s=1,848 | One bolt during the garden climb | Cue displaced from the next ring; use the familiar response | One perfect-parry award |
| R03, s=2,058 | Garden arch edge | Full opening readable while descending | One valid near miss |
| T04, trigger s=2,520 | A forked pair of bolts | One attack ID; center channel remains open; pair never covers all reachable positions | At most one parry award for the pair |
| R04, s=2,646 | Inner rib edge | Optional tight path; bypass remains clear | One valid near miss |
| L01, s=2,760 | Guardian's first large movement | Environmental anticipation only; no hidden damage | None |
| H01, s=3,280 | Warm updraft | Health segments refill visibly to three; no modal interruption | Health only, no score/charge |
| Boss entry, s=3,360 | Blend into stable combat flight | No steering reset or sudden camera spin | Begin encounter after the short reveal |

A route emitter first winds up for 72 ticks. At launch it uses the locked aim location and a projectile speed/distance combination giving approximately 1.1 seconds of travel at current cruise/Surge speed. Subsequent steering can evade it. If a speed change would create an unreadable immediate hit, its launch distance is extended by the deterministic safety calculation; it never follows the player after aim lock.

A near miss requires the swept torso capsule to pass within 0.20 m outside a marked risk surface, while not touching it. Award only after the encounter's closest approach is complete. Ordinary distant scenery cannot generate charge.

No mandatory hazard may require more displacement than the movement model allows after its visible cue. Validate each local sequence at 42 and 58 m/s, from several incoming offsets. The numerical coordinates are a first blockout, not permission to ship an unreachable gap.

### Expected resource rhythm

The 32 rings supply 256–384 charge before caps and spending. Four emitter attacks offer up to 72 additional charge; four marked near misses offer up to 24. The course therefore contains **352–480 raw charge**, with actual usable charge lower because of missed events and overflow.

Without risk awards, a perfect line fills the first meter on the ninth ring, around 20 seconds; ordinary rings fill it on the thirteenth, around 31 seconds. The sluice decision at 33 seconds comes after a fair opportunity to charge. The intended full route contains two to four meaningful Surge uses or a deliberate reserve for the boss.

If playtests show players simply press Surge whenever it lights, move a valuable brittle payoff or adjust charge supply before adding a second resource. If players hoard it and never use it, improve the cue and result feedback before increasing its damage.

## 6. Boss experience and integration

The complete encounter states, geometry, damage arithmetic, and source comparison are in [BOSS_REFERENCE.md](BOSS_REFERENCE.md).

The important integration rules are:

1. Steering and action buttons remain in the same places. The cross-section stays ±7.5 m by ±4.5 m.
2. The dragon continues visibly flying. The boss matches its forward pace; a slow-moving cloud field sells relative motion without moving the combat targets unpredictably.
3. Health is three at entry; accumulated charge is retained. No save-history difficulty scaling applies.
4. The first exposed vane remains available long enough to discover alignment. A short instruction disappears after the first successful breath hit.
5. When the heart opens, the visual and sound cues make it unmistakable. The Surge button communicates whether its attack can land.
6. The hollow beam has an ordinary escape and a rewarding expert answer. The player does not need a perfect parry to win.
7. Damaged components and the heart show persistent progress. The boss never silently heals because the player missed a window.

## 7. Replay, results, and sharing

### A useful result screen

Show one clear outcome: **Causeway cleared**, **Stormwarden defeated**, or the location of defeat. Below it show total score, compatible personal-best difference, ring accuracy, boss active time, and the largest concrete opportunity.

Choose the next-attempt hint from recorded events:

| Observed result | Example hint |
|---|---|
| Repeated early rolls | “Your rolls started before the bolts arrived.” |
| Full meter held through a heart window | “You reached the heart with Surge ready.” |
| Several missed rings in one section | “The garden descent broke your chain.” |
| Strong clear, no center beam passage | “Try holding the eye of the storm.” |
| New best | Show the gain and the action that produced it; do not invent a flaw |

These examples become short final copy after the system can support the claims. Never display generic encouragement as if it were an analysis of the run.

**Fly again** returns to first control within one second after assets are warm. Preserve sensitivity, handedness, and presentation settings. Do not replay a long launch cinematic.

### Three mastery goals

1. **Causeway Keeper:** defeat the Stormwarden in a standard full run.
2. **Clean Wing:** finish with no damage and collect at least 28 of 32 rings.
3. **Eye of the Storm:** complete a clean central beam passage and defeat the boss within three heart openings.

They award a small result emblem and an optional title. They do not raise health, score multipliers, or damage. Avoid adding medal score thresholds until actual run distributions exist.

### Practice and assists

Boss Practice is available after first reaching the boss. It starts at three health and **50 charge**, using the same boss attack sequence. It has its own results and does not set a full-run best. It provides rapid learning without forcing another 80-second approach for every attempt.

An explicit assisted mode may slow simulation to 85% and enlarge the aim acquisition radius from 0.18 to 0.24 normalized units. It belongs to a separate assist ID and record group. Visual accessibility settings, handedness, sensitivity, reduced motion, and remapped keys do not change record grouping.

Do not silently enable assistance after failure or scale the boss from saved progression. Present practice as a useful option.

### Challenge contract

One authored stage does not require procedural generation. The first challenge specification freezes the route, boss, hero stats, rules version, mode, and assist ID. Do not expose a seed input that pretends to change an unchanged course.

Share creates a local card and URL only when the player presses Share. It contains the target score and compatible rule identifiers. Opening it starts the same standard course, independent of the receiver's save history. Reject unsupported rule versions clearly. Local scores are casual claims, not server-verified rankings.

Record an input trace from the first playable so local ghosts can be evaluated later. A ghost is an optional improvement after the flight and boss gates; it is not a prerequisite for the slice.

## 8. Readability, sound, and practical quality

The strongest contrast belongs to the next action. Use shape and motion as well as color:

| Meaning | Shape / motion | Audio |
|---|---|---|
| Ring | Open circular rim with clear interior | Short pitched confirmation; distinct perfect layer |
| Reflectable bolt | Diamond front and visible travel trail | Directional warning pulse and launch snap |
| Solid hazard | Continuous opaque masonry | Collision impact; no collectible shimmer |
| Brittle obstruction | Large branching fractures and falling grit | Low cracking cue as Surge approaches |
| Boss vulnerable target | Open brackets and visible exposed tissue/crystal | Clear lock and impact sounds |
| Beam danger | Filled annulus and a shrinking charge indicator | Distinct low wind-up, short hush, sustained blast |

Never rely on red versus green alone. Test muted audio, grayscale captures, bright and dark backgrounds, and a small phone viewport. HUD and 3D cues must use the same semantic mapping.

The audio plan uses wind and wingbeats as a physical bed, short reward sounds, a simple evolving music cue, and a recognizable boss motif. Limit simultaneous reward sounds so a parry and a perfect ring do not hide an incoming attack. See ART_DIRECTION.md for the asset list.

## 9. Playtest gates and redesign triggers

These are internal decision thresholds for small formative tests, not statistical claims about retention or virality. Record the device, build, prior experience, and assist setting. Do not compare different rule versions as though they were the same test.

| Gate | Procedure | Initial threshold | If it fails |
|---|---|---|---|
| Flight feel | 8 new players, 20-second lane, minimal HUD | 6 can intentionally make the ring line and describe steering as predictable | Retune acceleration, damping, camera, and gaps before adding content |
| Control intent | Observe touch traces and player explanation | At least 7/8 make deliberate Roll and Surge activations after the demonstration | Change button placement and input capture; do not add gesture shortcuts |
| Character quality | Gameplay-scale rear, bank, roll, and Surge clips | No persistent wing/body deformation defect; owner accepts the moving hero as a material visual improvement | Rework mesh, silhouette, or animation before finishing route art |
| Boss comprehension | 8 players entering with no verbal coaching | At least 6 can explain how to open and damage the heart after two attempts | Simplify cueing/targeting/state transition, not merely reduce HP |
| Full-run difficulty | 12 new players, up to three attempts | At least 8 clear by attempt three; deaths are explainable | Fix unreadable hazards and pacing before adjusting health |
| Voluntary replay | After the first run, allow a genuine stop without prompting | At least 8/12 choose another run; at least 6/12 take a third | Observe whether the barrier is control, repetition, boss length, or weak payoff |
| Memorability | Ask what moment they would describe to a friend | At least 6/12 mention a specific movement or boss moment | Strengthen the interaction and staging; more particles are not the default fix |
| Performance | Real selected midrange phone and desktop, densest fight | Meet IMPLEMENTATION.md frame/load budgets without losing essential cues | Reduce render cost before lowering input or simulation quality |

Ask “What happened?” after failures before explaining the intended rule. Ask “What would you do differently?” at results. Avoid leading with “Was that fun?” or asking people to keep playing just to satisfy the replay count.

After the full-run gate, test with a second group of 12–20 people outside the development circle. Log voluntary returns where feasible and ask whether they actually shared a run. Passing a small playtest is permission to invest further, not evidence that the game will go viral.

If two focused tuning rounds fail the flight gate, change the movement design. If the boss still feels passive, adjust target exposure and attack overlap. If Cinder still looks assembled or rubbery, stop environment polish and fix the model. The small scope exists to make these decisions affordable.
