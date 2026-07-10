# Research Brief — "How dragons actually fly" (jointed ~180° wingbeat)

Prepared for the fable planning agent. This is the grounded research + a map of the
existing Dragon Drift wing systems. Your job (separate prompt) is to turn this into an
implementation plan.

## 1. The player's complaint, precisely

The current wingbeat reads like a **bird flap / wiggle**: the wing rotates as a
near-rigid panel through a small vertical arc. What the player wants is the **video-game
dragon sweep**: the wingtip travels a **near-180° arc** — from roughly **12 o'clock at the
top of the upstroke down to ~5–6 o'clock at the bottom of the downstroke** — and, crucially,
the wing **bends at its joints** (shoulder, elbow, wrist/hand) so different spans of the wing
lead and lag through the stroke, instead of one uniform hinge.

## 2. What the biomechanics literature actually says

### Joint architecture (bat/pterosaur-style membrane wing — the right model for a dragon)
The arm-wing is a **shoulder → elbow → wrist → finger (phalange)** chain carrying a membrane.
This 4-link chain is what lets the animal *change wing shape mid-stroke* — a rigid hinge can't.

### Downstroke (the POWER stroke — makes lift/thrust)
- The wing **extends / opens to full span**: shoulder depresses, **elbow and wrist EXTEND**,
  fingers spread. Membrane is taut and cambered (cupped) with a **high angle of attack**.
- Motion is **forward + downward**. Ventral (downward) excursion is *greater* than dorsal —
  birds flap with **greater ventral than dorsal excursion** for efficiency.
- It is the **slower, heavier, broader** half of the cycle.

### Upstroke (the RECOVERY stroke — minimise drag)
- The wing **folds / retracts**: shoulder supinates, **elbow FLEXES, wrist unlocks**, the hand
  sweeps **back and up** at a **low angle of attack**. Span is dramatically reduced.
- Measured: bats reduce span to **~54% of full span** by folding the inner wing on the upstroke;
  **wing folding increases net lift by ~50%** vs a rigid flat upstroke.
- It is the **faster, tighter, non-resistant** half of the cycle.

### Stroke plane & amplitude
- Stroke plane tilts **~30° from horizontal in slow/hovering flight**, and becomes **more
  vertical/perpendicular in fast cruise**. So faster flight → a more up-and-down beat.
- "Elevation" (top) and "depression" (bottom) angles are set independently to control angular
  amplitude — i.e. the top and bottom of the arc are separately tunable. A dramatic, readable
  game beat pushes elevation high (~+80–90°, "12 o'clock") and depression deep (~−60 to −90°,
  "5–6 o'clock") → the ~180° total arc the player is describing.

### Animation-craft translation (12 principles → wings)
- **Overlapping action / follow-through**: joints move **out of sync** — the shoulder leads,
  the elbow follows, the wrist/hand trails most, the membrane trailing edge last. Heavier/more
  distal parts **drag farther behind and stop later**. This out-of-sync cascade is *the* thing
  that separates "living wing" from "rigid panel."
- **Timing asymmetry**: downstroke is **powerful and broad and takes MORE of the cycle**;
  upstroke is **tight and fast**. (Already modelled here as `downFrac`.)
- **The fold must change the silhouette** — the span visibly contracts on the upstroke, not
  just a rotation in place. (This is already a §3 wing law in DRAGON-DESIGN.md.)
- **Ease at the extremes only**: the wing eases through the apex and the bottom (it reverses
  there) and sweeps through horizontal at MAX velocity — never a hold/pause mid-stroke. (Already
  a hard CI invariant here — see `tests/flapcheck.mjs`.)

### How AAA/game dragons read (Skyrim/Monster-Hunter discourse)
- The classic *failure* mode called out by players is exactly this repo's problem: the animation
  "just stretches the wings out and gives them a wiggle" instead of a **big deep flap**.
- Game dragons **exaggerate** the biology for readability: a bigger-than-real arc, a strong held-ish
  apex, a heavy visible power downstroke, dramatic fold on recovery. The physical ~30–70° real
  amplitude becomes a ~120–180° *staged* arc, because the camera is behind/above and needs the
  wing to read.

## 3. The existing wing systems in this repo (what you are extending, not replacing)

`reforged/js/dragon.js` (~line 600–770) picks ONE motion path per dragon, in this order:

1. **`skinned`** — `wingRigL/R` present → `flapWing()` in **`dragonWingFlap.js`**.
   Drives a **shoulder→elbow→wrist** bone cascade with phase lag + anatomical angle LIMITS.
   Data-driven by `model.flapProfile`. Used by nightFury/ember/hull dragons. **This is the closest
   existing thing to the anatomy the player wants — but its amplitudes are small and its limits are
   tight** (`DEFAULTS`: elbowAmp 0.28, foldAmp 0.28, elbowLimit [-0.55,0.85], wristLimit [-0.7,0.7]).

2. **`yoke`** — `model.flap` + `wingYokeL/R` → `solveWing()` in **`wingFlapSolver.js`**.
   A smooth time-warped-cosine beat over a **yoke→inner→mid→tip** chain (elevation channel +
   separate curl channel + fore-aft rowing sweep). Config `model.flap`. Used by Bull/Seraph.
   **Sample real config** (an angel-type): `yokeElevDeg: 24`, `curlDeg {inner16,mid20,tip12}`,
   `downFrac 0.56`, `downDepth 1.9` (bottom ≈ −46°), `lag {inner .04, mid .07, tip .20}`,
   `tipTrailDeg 18`, `rowDeg 9`. → The whole-wing elevation only swings ~+24°/−46° ≈ a **~70°
   arc**. That is the measured "bird flap." A 180° dragon arc needs elevation pushed toward
   ~+80–90° and the joint curl/fold pushed much deeper — but see the flapcheck invariants.

3. **`wingParts`** — per-form articulated 1/2/3 segment wing (root→mid→tip), `|sin|^glidePow`
   glide-hold waveform, optional apex V-lift (`apexRoot/Mid/Tip`, `restLift`). Banking = pose bias.

4. **`direct-pivot`** — the basic starter path (azure): `wingPivotL/R` rotated directly by
   `rootFlap = sin(phase)*flapAmp`. `flapAmp` base is only **0.52 (cruise) / 0.7 (boost)** rad
   ≈ **30–40°**. The most "bird flap" of all.

5. **lobe pivots** — jade koi silk-fin fans (symmetric lobe beat). Different aesthetic; probably
   out of scope for the "dragon 180° arc," but note it exists.

### Shared machinery you MUST respect
- `flapPhase` is an **integrated beat clock** (`flapPhase += dt*flapSpeed`), wrapped mod 2π — never
  `time*flapSpeed`. One shared master phase drives L+R (sign-mirror); the only lag is *within* a wing.
- Frequency & amplitude are already modulated by flight state: boost/surge faster+bigger, dive
  tucks (small), climb/decel opens broad, inhale "mantle" holds the wings high. Any new arc math
  must **compose** with these multipliers, not fight them.
- **`formStrength`/`formSpeed`** scale the beat by growth tier (hatchling weak+fast → eternal
  strong+slow). Keep this.
- `?wingDebug=<glide|recovery|apex|downstroke|settle>` freezes the beat at a named pose via the
  SHARED poser `wingDebugPose.js` (`setFlapDebugPose`) across ALL paths. Transient poses can't be
  captured by "waiting" — use the pin (L137 law).

### Verification harness (what "verify before claiming" means here)
- `node tests/flapcheck.mjs` — **hard CI invariants for the yoke path**: apex reaches +1, bottom
  reaches −downDepth, exactly ONE up + ONE down (2 velocity sign-changes), BOTH horizontal
  crossings at high velocity (no flat spot), near-zero velocity ONLY at apex+bottom (no interior
  hold), curl ≈1 at apex / ≈0 at bottom. **A bigger arc must still pass all of these.**
- `node tools/flapstrip.mjs [key] [tier]` — 5-phase chase-cam montage (glide→recovery→apex→
  downstroke→settle) from the REAL gameplay camera. This is the motion read.
- `node tools/tricount.mjs --ci` + `node tests/blueprint.mjs` — geometry/roster gates (must stay green).
- `tests/starters.mjs` §7 fold-contraction assert: driving the fold must contract measured span ≤0.7×.
- **No WebGL in CI** (Chromium CDN blocked). The human judges motion/feel on the PR preview.
  Automated = headless tools only.

## 4. The core design tension the plan must resolve

Pushing a literal 180° arc naively will (a) break `flapcheck` invariants if done with holds,
(b) make wingtips **clip the body / collide across the spine** at the bottom and **gap off the
body** at the top (the exact seam problem L20–L22 fought), and (c) look like a faster wiggle
rather than a deeper flap if amplitude is raised without the **jointed fold** and **out-of-sync
lag** that carry the "bend at different joints" read. The plan's real work is the **joint
cascade + fold-on-upstroke**, with the raw arc amplitude second.

## Sources
- Bat flight kinematics / joint folding — https://pmc.ncbi.nlm.nih.gov/articles/PMC11837331/ ,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6592571/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC5341598/ ,
  https://journals.biologists.com/jeb/article/213/20/3427/9804/
- Wingbeat amplitude / stroke plane / ventral-vs-dorsal excursion — https://www.pnas.org/doi/10.1073/pnas.2410048121 ,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4535406/
- Animation principles (follow-through / overlapping action, bird flight) —
  https://www.animationmentor.com/blog/tutorial-how-to-animate-birds-in-flight/ ,
  https://www.dsource.in/course/principles-animation/follow-through-and-overlapping-action
- Game dragon wing-animation discourse (the "wiggle not flap" failure) —
  https://www.nexusmods.com/skyrimspecialedition/mods/154023 ,
  https://www.dsogaming.com/mods/this-skyrim-mod-makes-its-dragons-feel-more-like-those-from-monster-hunter-by-overhauling-their-combat-animations/
