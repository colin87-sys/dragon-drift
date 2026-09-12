# Boss research and the Stormwarden specification

**Decision:** use **Gorgon from Star Fox 64's Area 6** as the primary mechanical reference. Preserve the recurring sequence of dismantling outer defenses, breaking internal protection, attacking an exposed core, and surviving a spectacular beam. Build a new creature and tune the loop for Skybreak's short runs and three-action controls.

Research checked **12 September 2026**. Facts about the source encounters are separated below from original Skybreak design proposals.

## 1. Why this reference

There is no objective “best boss” established by the sources. There is enough evidence to make a grounded choice.

Ranker's community list places Star Wolf first, **Gorgon second**, and the Forever Train third. The page reports 136 voters overall and 37 votes on Gorgon's entry. That is a small, self-selected fan poll, not a representative study. It supports treating Gorgon as a well-liked candidate, not claiming universal consensus. [Community boss ranking](https://www.ranker.com/list/all-star-fox-64-bosses-ranked-best-to-worst/reference)

In a 2015 StarFox-Online discussion, the opening poster names Gorgon as their favorite because of its weapons, and another participant explicitly agrees that the fight is enjoyable. These are useful firsthand player reactions. [Favorites/dislikes discussion](https://www.starfox-online.net/forums/topic/12801-star-fox-boss-battles-favoritesdislikes/)

Reception is mixed. A later Star Fox discussion includes both a positive assessment of Gorgon among the rail encounters and a complaint that it is tedious and punishing. Those complaints are player perceptions, not proof that every attack is mechanically unavoidable. They identify risks to test: excessive defensive downtime, unclear avoidance, and disproportionate damage. [Player discussion](https://www.reddit.com/r/starfox/comments/1uxqok2/what_is_your_favorite_and_least_favorite_boss/)

### Candidates considered

| Encounter | Useful quality | Fit for this slice | Decision |
|---|---|---|---|
| Gorgon — Star Fox 64 | Layered targets, recurring core opening, dramatic beam, forward-facing encounter | Strong fit for steering, a defensive roll, and a saved burst attack | Main reference |
| Star Wolf — Star Fox 64 | High placement in fan ranking; a memorable rival encounter | A dogfight would require a different navigation, camera, and pursuit loop | Save rival-dragon duels for a later design |
| Forever Train — Star Fox 64 | Strong fan ranking; environmental switches can decide the finish | The Landmaster route and switch sequence are valuable set-piece ideas, but would shift this prototype toward a different vehicle/stage structure | Consider the environmental payoff later |
| Ikrakav — Panzer Dragoon Orta | Reposition to expose the vulnerable side, then optimize attack and defense | Its form changes and relative-position controls add more required verbs than this slice needs | Study the offense/defense rhythm; do not combine its entire system with Gorgon |

The Forever Train walkthrough describes changing the rails through switches to send the train into a depot. That is an example of a stage interaction becoming a boss payoff. [Macbeth walkthrough](https://strategywiki.org/wiki/Star_Fox_64/Macbeth)

Hasker Brouwer's hands-on Orta analysis describes Ikrakav turning its protected side toward the player, requiring movement to regain its exposed side, then alternating damage and projectile handling through dragon forms. The article's broader praise concerns the satisfaction of learning and optimizing these interactions. Our inference is that this is a useful rhythm but an unnecessarily complex control package for the first mobile slice. [Panzer Dragoon Orta analysis](https://stinger-magazine.com/article/panzer-dragoon-orta/)

## 2. Walkthrough and footage evidence

The Star Fox 64 Area 6 walkthrough describes shooting the arms, then the internal shield generators, then the center. Later cycles include a powerful beam. The guide describes both escaping toward the upper-right region and remaining inside the beam's hollow center. That establishes the reference loop and the possibility of a safer ordinary response versus a demanding central response. [Area 6 walkthrough](https://strategywiki.org/wiki/Star_Fox_64/Area_6)

The walkthrough was available through the search result's extracted page content. A subsequent direct page open returned 403. Its unrelated stage advice is not used as a tuning source.

### Video reference ledger

| Recording | Use | Access and evidence status |
|---|---|---|
| [Star Fox 64 Boss 14 — Gorgon, BossBattleChannel](https://www.youtube.com/watch?v=ajORXLo-A3g) | Primary original-game visual reference; page identifies a 2:33 recording | Page, controls, and comments opened. Video remained at 0:00 with no decoded frames. No direct animation or attack-duration observations claimed |
| [Star Fox 64 3D Boss 14 — Gorgon, BossBattleChannel](https://www.youtube.com/watch?v=pB7AnbbIVPk) | Secondary recording for comparing how the encounter reads with revised presentation; 2:38 listed | Page opened; playback likewise stalled at 0:00. Treat the 3DS version as a distinct presentation reference |
| [Star Fox 64 Area 6 Medal Guide / walkthrough](https://www.youtube.com/watch?v=OCxJquZUWls) | Additional full-stage reference located by search | Located, not watched; useful for checking how the level prepares the boss |

The first recording's comments link approximately **1:47** to the beam and **2:17** to the explosion. These are viewer-supplied navigation hints, not verified frame annotations.

**Remaining footage task:** watch the original recording through once, then annotate each defense transition, target cue, attack overlap, safe position, beam wind-up, and defeat. Check the second recording for readability differences. Record actual timestamps and version names in this ledger. Do not import timing values from a 2026 remake guide into a specification for the original encounter without checking the difference.

The plan below does not depend on pretending this footage review succeeded. Its numeric timings are explicitly original starting values to be tested in Skybreak. If the footage reveals a substantially different loop, update the factual reference mapping before implementing the boss.

## 3. What we adapt

| Reference element | Skybreak adaptation | Reason |
|---|---|---|
| Remove external defenses | Burn three exposed storm vanes in any order | The player earns the opening through visible progress |
| Break internal protection | Destroy two inner seals | Keeps the layered reveal with fewer small targets on a phone |
| Attack the center | Six-second exposed-heart window; banked Surge deals a large burst | Connects route execution to boss payoff |
| Survive the major beam | Escape outside its annulus or hold the hollow center | A legible ordinary answer and a memorable mastery answer |
| Repeat under pressure | Repeat the same state grammar with more demanding bolt arrangements | Learning pays off without introducing new controls |
| Spectacular finish | Heart ruptures, carapace separates, the dragon flies through a cleared opening | Original animation and setting, with an immediate sense of victory |

Use original geometry, character design, sounds, UI, dialogue, music, and animation. The Stormwarden is a living storm guardian with a broad crescent silhouette and stone growths, not Gorgon's spherical mechanical body. It has no copied voice lines or franchise symbols.

## 4. The creature and arena

**Name:** the Stormwarden. **Location:** the abandoned observatory at the end of the Shattered Causeway.

From far away it resembles the observatory's immense crescent roof. During the approach, the roof lifts, cloud ribbons pull into its underside, and two broad fins unfold. The player realizes the landmark is alive.

Its body is a smooth, dark storm creature partly encased in pale weathered stone. Three large vane structures conduct wind around an enclosed heart. Breaking the vanes makes the protective carapace open along an organic seam, exposing two suspended seals. Destroying them uncovers the heart.

Its attack cues are bodily: vanes align before bolts, the carapace inhales before the beam, and the heart expands before exposure. Its size comes from occlusion, cloud motion, slow body animation, and a strong silhouette. Screen shake is secondary.

The combat uses the same ±7.5 m × ±4.5 m movement space as the route. The boss holds a stable relative forward distance. Its visual body can extend beyond the frame, but every actionable target, bolt origin cue, and safe beam lane must remain visible in portrait.

Represent targeting in a fixed normalized aim plane. The renderer places the weak-point anchors and reticle from that plane. Target acquisition must not depend on GPU visibility, arbitrary camera shake, or a DOM element's location.

## 5. State machine

~~~mermaid
flowchart TD
    V["Break three vanes"] --> S["Break two seals"]
    S --> H["Attack exposed heart"]
    H -->|"Heart HP reaches zero"| W["Victory"]
    H -->|"Window ends"| B["Survive hollow beam"]
    B --> V
    V -->|"Health reaches zero"| D["Defeat"]
    S -->|"Health reaches zero"| D
    H -->|"Health reaches zero"| D
    B -->|"Health reaches zero"| D
~~~

Opening, wind-up, and recovery transitions are specified in the table rather than expanding the diagram.

| State | Duration / exit | Available action | Boss behavior and feedback |
|---|---|---|---|
| REVEAL | 2.0 s first encounter; repeat reveal may shorten to 0.5 s | Steering remains live; no incoming damage | Creature unfolds; highlight the vanes; active boss timer has not started |
| VANES | Until all three are destroyed | Align breath with any remaining vane; evade or parry bolts | Vanes are always damageable; first bolt wind-up starts 2.0 s into the first cycle |
| OPENING | 0.60 s | Continue steering; no new attack spawn | Carapace opens; cancel old hostile bolts; vanes visibly stay broken |
| SEALS | Until both seals are destroyed | Align with either seal | Start a slow bolt pattern only after 1.20 s if the player is still here |
| HEART | 6.0 s or heart HP reaches zero | Breath; Surge when aligned; steer/roll against slow bolts | Strong exposure cue; simple vulnerability timer around the heart; bolts may launch at +2.5 and +4.5 s |
| BEAM_CHARGE | 1.80 s | Choose outer safety or the central pocket | Cancel old bolts; show the complete beam annulus and the center's upcoming path |
| BEAM | 1.80 s | Track the chosen safe region | One sustained hollow beam; no simultaneous bolt attack |
| RECOVER | 0.60 s | Reposition | Beam dissipates; next cycle's vanes/seals reform visibly |
| VICTORY | 4.0–5.0 s, then result | Movement blended into the exit flight | All attacks stop on the victory tick; no damage during the finish |
| DEFEAT | 0.35 s transition, then result | Retry or practice | Clear all input and scheduled combat events |

The heart retains all damage between cycles. Partial damage to a vane or seal persists until that component is destroyed; those states have no timeout that resets progress. Vanes and seals regenerate only after a completed heart/beam cycle. No hidden HP gate prevents an early kill.

No health-based attack switch may cut off an exposed-heart window. Attack arrangements change only when a new cycle begins. All scheduled attacks carry their state generation ID so a stale callback cannot fire after a transition or restart.

On a tick containing both a valid lethal heart hit and a hostile contact, resolve the accepted player attack first. If it kills the boss, enter VICTORY and cancel hostile damage for that tick. This makes a successful finishing blow decisive and matches the promise that attacks stop on victory.

## 6. Targets, damage, and charge

| Parameter | Starting value |
|---|---:|
| Heart HP | 240 |
| Vanes | 3 × 16 HP |
| Seals | 2 × 8 HP |
| Ordinary breath | 4 damage every 15 ticks; 16 DPS while aligned |
| Aim acquisition radius | 0.18 normalized units |
| Aim acquisition dwell | 9 ticks / 0.15 s |
| Aim release radius / grace | 0.22 normalized units / 6 ticks |
| Surge heart damage | 60 at the release tick, 15 ticks after activation |
| Normal-breath suppression during Surge | First 30 ticks / 0.50 s |
| Normal-breath suppression during Roll | All 30 roll ticks |
| Vane/seal break charge | 12 each; 60 total per completed defense layer |
| Perfect-parry charge | 18; at most twice per cycle |
| Clean central beam reward | 25 |
| All damaging attacks | 1 player health segment per attack ID |

Initial aim-plane positions:

- Vanes: (−0.48, 0.20), (+0.48, 0.20), (0, −0.35).
- Seals: (−0.20, 0.08), (+0.20, 0.08).
- Heart: (0, 0.10).

The player's aim position comes from normalized flight offset. Acquire the closest exposed target in range; keep it through the small release margin. Resolve an exact tie by stable target ID. Do not switch targets every frame because two brackets overlap. Closed armor never receives automatic damage.

A perfect parry returns the bolt to the currently aligned exposed component; if none is aligned, it strikes the nearest exposed component. It deals 16 damage to a vane/seal, or 8 to an exposed heart. If no component is exposed, it disperses after granting its permitted charge. Normal deflection gives no return damage.

Only the first two perfect parries per cycle return damage and charge. Additional defensive parries remain effective at preventing damage, but give no further offensive reward. This bounds resource generation while allowing the player to survive. The pulse still sounds defensive, without a charge confirmation.

### Damage arithmetic and expected length

A full six-second heart window permits 24 ordinary breath pulses, or **96 HP**. Surge replaces up to 0.50 seconds of ordinary fire (8 HP) with 60 HP, giving an upper-bound **148 HP** in a well-timed window before any parry contribution.

- Perfect sustained alignment without Surge needs three heart openings: 96 + 96 + 48.
- One well-used Surge plus nearly complete alignment can finish in two: 148 + 92.
- At 70% effective heart uptime, ordinary output is about 67 HP per window. With one Surge adding approximately 52 net HP, three windows produce about 254 HP.
- At 70% uptime without Surge, four windows produce about 269 HP.

Actual pulse timing, rolls, target acquisition, and the kill tick will move these estimates. They are sanity checks, not measured clear times.

Expect defense removal and movement to take roughly 8–12 seconds per cycle for a learning player, plus the six-second heart and 4.2-second beam/recovery sequence on surviving cycles. Target skilled clears around 35–50 seconds and ordinary successful clears around 55–85 seconds. Investigate novice fights regularly exceeding 120 seconds.

Route charge can enable the first Surge. After spending it, a clean central beam (25), the next defense layer (60), and one perfect parry (18) refill the meter. This is a concrete expert loop, but ordinary breath can win without it.

## 7. Attack patterns and beam geometry

### Bolt family

Use one projectile family with one reflectability symbol. A wind-up indicator contracts for **1.0 second** in boss combat. Lock its aim before launch and give at least **0.85 seconds** of visible travel on the initial pattern. Test the actual readable interval, including occlusion by Cinder.

| Cycle | VANES pattern | SEALS / HEART pattern | Constraint |
|---|---|---|---|
| 1 | Single aimed bolt; at least 3.0 s between launches | Single slow bolts | Learn the same response without additional bullet shapes |
| 2 | Alternating left/right origins; a forked pair with an open center | Two-bolt arrangement with a visible gap | No aimed shot retargets after lock; one volley is one damage/reward ID |
| 3 and later | Alternate a single aimed bolt and a forked pair | Reuse the two-bolt arrangement | Difficulty caps here; no unbounded speed or projectile growth |

A roll protects against bolt collision during its specified interval, but temporarily interrupts normal breath. The player can dodge while maintaining aim, spend a roll for safety, or deliberately parry for a faster opening and more charge. The choices should have visible consequences.

### Hollow beam

The beam is an annulus in the player's flight plane, with a moving center. Initial inner radius is **2.0 m** and outer radius **5.2 m**. Collision uses the actual torso capsule, not just the center point.

The displayed safe-pocket guide is conservative: stay within **1.45 m** of the center, or beyond **5.75 m**, allowing torso radius and a small readability margin. The annulus is damaging; the hollow center and outer region are safe. Left and right outer lanes must remain reachable within the movement bounds for every specified center position.

- Cycle 1 center: stationary at (0,0).
- Cycle 2 center: a slow 0.7 m lateral excursion, returning to center over the beam duration.
- Cycle 3+ center: up to 0.8 m lateral and 0.4 m vertical excursion, fully previewed during wind-up.

Use a deterministic smooth path, for example a sine excursion over normalized beam time. Author the whole cue from the same geometry used for collision. Do not show a static safe circle and then move the real damage volume without warning.

Roll and Surge do not cancel this sustained beam. If hit, the beam can remove only one health segment for its entire attack ID; it cannot repeatedly drain health while the player recovers. A clean inner passage earns 25 charge only if the entire active beam was spent inside the conservative inner pocket with no damage. Ordinary outer avoidance earns survival, not an extra resource.

The central path is the memorable mastery answer. If it becomes the easiest passive position, increase its slow excursion or reduce the reward before narrowing it into a pixel-perfect trick. Never remove the readable outer answer just to force spectacle.

## 8. What makes it memorable

1. **Anticipation:** the route landmark is revealed as a creature. Its silhouette appears before the fight begins.
2. **Visible damage:** a destroyed vane breaks the contour; the carapace's opening exposes a new material and lighting state.
3. **A strong sound transition:** the heart-opening chord is followed later by a short hush before the beam.
4. **A legible feat:** a small dragon holds the eye of an enormous storm. This reads in a short muted clip.
5. **A player-owned finish:** the final hit determines victory immediately. The finish camera follows the already-created opening; no extra quick-time prompt is required.

Use a 4–5 second finish on first victory, shortening to about two seconds on repeat runs if requested through the skip action. After the final hit there is no surprise damaging debris.

## 9. Acceptance and redesign rules

Implement the boss in plain materials first and check:

- A novice can identify a target, cause an opening, and explain why heart damage starts and stops.
- Every non-cinematic moment offers useful targeting, defense, or repositioning. If the player spends more than about three seconds waiting without a meaningful action, investigate the state design.
- The boss remains beatable without perfect parries, central-beam rewards, or a full entry meter.
- Shield/core transitions cannot lose damage events, carry stale bolts, or softlock when multiple components break on one tick.
- The beam's drawn and actual safe regions agree at portrait and landscape aspect ratios, with reduced motion enabled.
- Additional cycles cannot farm score or ramp beyond the authored difficulty cap.
- Defeat/retry restores a known state; a fresh profile and a veteran profile get the same standard encounter.

If the basic loop feels passive, first reduce defense downtime or improve alignment and feedback. If its length is the problem, reduce defense HP or transition delays before increasing heart burst damage enough to skip the signature beam. A one-window kill would currently require additional damage sources or retuning; if introduced later, decide deliberately whether skipping the beam is an earned mastery reward.
