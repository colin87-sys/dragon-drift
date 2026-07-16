# REDO BRIEF — BOSS 9: KARNVOW — the GRANDEUR PASS (already shipped, reads underwhelming)

**This is a REDO of an already-shipped boss, not a fresh build.** KARNVOW (slot 9) shipped and
works — the identity, silhouette sheet, charisma map, mechanics, and entrance all passed their
gates. But he reads UNDERWHELMING: he is the Tier-3 (Calamities) band **PEAK**, yet the
boss-design audit rated him the roster's **weakest fight** (entrance 3/5, mid-fight 2/5 — "a dread
move that is a lore-quote with zero authored visual") and flagged the **8→9 grandeur crater** (a
shipped never-fits leviathan hands off to a lean ~9-unit duelist). He shipped at **~6,455 tris (46%
of the 14,000 tier-3 ceiling) / ~46 draws (66% of 70)**. This pass makes him GRAND — worthy of the
band peak — WITHOUT losing the duelist identity that passed review.

**Work from KARNVOW's existing branch** (his `bossKarnvow.js` + def live on the slot-9 branch/PR,
NOT on master). This is a grandeur pass on the existing files.

> **⛔ DO NOT START REBUILDING UNTIL YOU HAVE DONE PART 1 (VERIFY) AND REPORTED TO THE OWNER.**
> The numbers and the audit notes below are from when he shipped; a later pass may have already
> improved some of them. Verify what is ACTUALLY there before you change anything, so you fix the
> real gaps and don't redo work that's already done.

---

## PART 0 — ORIENTATION

1. **Read `LEAPFROG.md`'s THE RULE** + the §9 boss lessons, esp. **L140/L141** (presence = span ×
   lit-edge; scale is a silhouette property; a huge concept needs a PROXIMITY beat), **L150**
   (silhouette translation), and any KARNVOW lesson already in the ledger.
2. **Re-read `reforged/BOSS-DESIGN.md`** §5b row 9 + slot-9 brief, §5d slot-9 sheet (the §3b
   translation + §4b map + ENTRANCE), §5f (his dread move + the stat-taunt rule-break), **§5g
   (spend the hardware — the sheet number is a FLOOR)**, §5i (his rhythm/graze/parry), §7/§7b/§7c
   (the Studio Gate — you re-run it here).
3. **Re-read the current `bossKarnvow.js` and his def** — you're editing them; know exactly what's
   there before you add.
4. **The iron law**: coexist → never break the shipped roster; **verify before claiming**. This
   pass touches ONLY KARNVOW's files (his builder + def dials + §5d sheet). Every other boss stays
   byte-identical.
5. **Studio-first + the Fable gate**: you do NOT self-judge the redo. Re-run the studio + a fresh
   Fable design gate on the NEW grandeur, then post crops and STOP for the owner's preview verdict.

---

## PART 1 — ⛔ VERIFY THE CURRENT STATE FIRST (do this BEFORE any changes; report to the owner)

The diagnosis in Part 2 is from when KARNVOW shipped. **A later pass may already have addressed
some of it.** Before rebuilding, establish the ACTUAL current state and report it:

1. **Capture the BEFORE state** (from `reforged/`):
   ```
   git fetch && git checkout <KARNVOW's branch>       # wherever bossKarnvow.js lives
   cd reforged && node tests/run-all.mjs               # confirm green baseline
   node tools/bossgate.mjs karnvow                     # G1–G7 + the real tri/draw numbers NOW
   node tools/bossstudio.mjs karnvow                   # current studio contact sheets
   ```
   Also boot the fight in-game (`?debug&boss=100&bossIdx=8`) and watch the DREAD MOVE + the cut-in.
2. **Check each Part-2 diagnosis point against reality — for each, mark ALREADY-DONE / PARTIAL /
   STILL-MISSING:**
   - Does **"Voidmaw's Verdict"** (the dread move) already have an authored VISUAL (a screen-scale
     trace, charm flares), or is it still just firing boss-1's pattern with nothing to see?
   - Is the **trophy chain** already arena-scale and readable, or small/tucked?
   - Is the **cut-in** a real near-pass, or a tidy lateral slide?
   - What are the **current tri/draw numbers** (the gate prints them) — how much headroom is left
     under 14k tris / 70 draws, and which axis is tighter NOW?
   - Did a later pass already grow his **scale/presence** past the shipped ~9-unit read?
3. **REPORT to the owner** (post the BEFORE crops + the ALREADY-DONE/PARTIAL/STILL-MISSING list),
   and confirm the Part-2 decision (how far to push scale) **before** you rebuild. Only redo what is
   genuinely PARTIAL or STILL-MISSING — do not re-do ALREADY-DONE work.

*(If the verify pass shows he's actually already been substantially improved and only needs a tweak,
say so — a smaller pass is the right answer then. Don't manufacture a full rebuild.)*

---

## PART 2 — THE DIAGNOSIS (why he read underwhelming — fix THESE, not the identity)

The identity is fine (a hooded trophy-hunter duelist who quotes your death stats). What was missing
is **spectacle and presence at the band peak**:

1. **The dread move had NO authored visual.** "WEARS THE HORN — Voidmaw's Verdict" fires boss-1's
   dread pattern back at you — a lore reference with nothing to SEE. A band-peak dread move needs a
   clip-worthy image. *(This is the #1 fix.)*
2. **The fight is visually quiet** ("almost no fills" — precise but sparse); no escalating spectacle.
3. **Presence undershoots.** He's a deliberate lean scale-DOWN (a dragon-peer duelist) — a risky
   choice at the band PEAK. Presence was meant to come from proximity + the trophy chain +
   personalization, but none land HARD enough, so a small figure at the peak reads as a let-down.
4. **The spend went the wrong way.** ~46% of tris but ~66% of draws — near the DRAW ceiling (many
   small parts) while leaving ~7.5k tris on the table. Grandeur budget spent on part COUNT, not
   presence.

---

## PART 3 — ⛔ THE ONE DECISION: HOW FAR TO PUSH SCALE (confirm with the owner in Part 1)

**Option A — grand through SPECTACLE + PROXIMITY (keep the lean-duelist form).** Make the dread move
screen-filling, the trophy chain arena-scale, the cut-in a real near-pass, and the geometry far
richer — but keep his lean dragon-peer silhouette. Cheaper; preserves the identity that passed
review; matches the audit's actual diagnosis (the SPECTACLE was missing, not the scale).

**Option B — also grow his FORM grander.** Accept that a band-peak boss should have more physical
mass, and size him up moderately (never a colossus — the lance-duelist read is his distinctiveness).
This changes the silhouette, so it must re-pass the §3b stranger test.

**Recommendation: do A FULLY first** — it's the real fix and what the audit points at. THEN, if the
owner still reads him as small on the preview, layer in a **moderate** size bump (B) — grander and
more imposing, but still a duelist at your shoulder, never a giant. **The owner judges "big enough"
on the in-game fight frame + the cut-in, not the studio turntable.**

*(If B is chosen, re-run a §3b Fable stranger-test sign-off on the resized silhouette BEFORE
modeling — a materially bigger/heavier form can drift the read from "duelist" toward "generic
colossus.")*

---

## PART 4 — THE GRANDEUR LEVERS (go ALL OUT toward 14k tris — but mind the 70-draw ceiling)

**⛔ KARNVOW's tighter axis is DRAWS (~66% used), not tris (~46%)** *(re-confirm the live numbers in
Part 1)*. So spend TRIS on RICHER geometry of existing parts + MERGE small static parts to reclaim
draws — do NOT add many new separate parts (each is a draw). Reserve draws for pieces that must
animate independently.

1. **THE DREAD MOVE GETS A REAL VISUAL — the #1 lift.** As "Voidmaw's Verdict" fires boss-1's
   pattern, the LANCE traces the verdict at **SCREEN SCALE in violet** — a huge violet sigil / arc
   drawn across the frame by the lance tip (**LineSegments — cheap draws, overdraw-exempt**), every
   trophy charm FLARES in its owed boss's palette, the cowl-void blazes. Convert the lore quote into
   a clip-worthy "holy shit" beat. This alone moves the fight from 2/5 toward 4/5.
2. **THE TROPHY CHAIN AT ARENA SCALE — the presence + personalization lever.** The chain of charms
   arcs WIDE (behind/below him); the charms are large and readable, each glinting in its owed
   palette; on the cut-in and the entrance the chain SWINGS wide. This is how a lean figure reads BIG
   without becoming a giant (the L141 "the field around him is the presence" trick).
3. **THE CUT-IN AS A TRUE NEAR-PASS — proximity is the cheapest presence multiplier.** He rides the
   closest station in the roster (rel 12–18) and "cuts in laterally"; make the cut-in a real near
   pass (rel dips toward 8–10), the lance sweeping close, his shadow crossing the dragon. Keep his
   claimed constraints: no rear-view camera, no pull-ahead — the near-pass is a lateral cut, not an
   overtake.
4. **RICHER GEOMETRY (spend the ~7.5k tri headroom here).** Subdivide/detail the LANCE (Voidmaw's
   horn kernel — more relief, the violet scar seam), the COWL (fabric folds, a deeper void), the
   PAULDRONS/armor (facets, rivets, trophy-forge motifs), and the CHARMS (each a real little relic,
   not a blob). MERGE the static skirt plates + cloak strip into fewer draws to buy back budget.
5. **THE ENTRANCE CHARM-FLARE, BIGGER.** The charm matching your top killer flaring in its owed
   palette is the escalation hinge — make it a bigger, brighter, held beat (it's the personalization
   payoff, the whole reason this boss lands harder than a colossus).
6. **RICHER IDLE PRESENCE** — the cowl-glint, the lance language (salute/point/lower), the chain
   swinging — more menacing, multi-frequency idle motion so he's never a statue at the peak.

**⛔ THE OVERDRAW TRAP:** the dread move's violet trace + charm flares + cowl blaze can stack additive
glows. Keep **≤2 large additive volumes on screen (incl. the kit shield)**. The violet trace as
LineSegments is exempt; the charm flares must be small/bounded; the cowl-void blaze is the one focal.
**Run the G7 overdraw check with the shield up + Voidmaw's Verdict firing + all charms flaring at
once** — that's the frame that decides it.

---

## PART 5 — THE REDO PROCESS (edit → re-gate → Fable → owner)

1. **Edit `bossKarnvow.js`** (and his def dials / §5d sheet) for the levers in Part 4 that Part 1
   marked PARTIAL or STILL-MISSING. KEEP the passing identity: the §3b sheet cues/anti-reads, the §4b
   seven-channel map, the rhythm (AGGRESSION EXCHANGE), the graze (HOLD-UNTIL-FLINCH), the parry
   job, and the entrance structure. The redo changes PRESENCE + SPECTACLE + the dread visual, not
   the boss's identity.
2. **Named pivots stay named** (the telegraph gate finds them); if the dread trace adds a lance-tip
   emitter, name it.
3. **q0.5 scaling**: whatever you add at q1, the charm detail + lance/cowl relief + the dread trace
   density must DROP at q0.5 (`tris(q0.5) < tris(q1)` gate — keep that contract with the richer q1).
4. **Re-run the gates**: `node tests/boss.mjs` (tier-3 budget 14k/70 — you'll be higher than 6,455
   but must stay under 14k tris AND 70 draws — WATCH THE DRAWS), `bossboot.mjs`, `bulletcontrast.mjs`
   (the violet trace clears danger-magenta), `rhythmprint`, `amberdiet`, `node tools/bossgate.mjs
   karnvow` (G1–G7 incl. the overdraw check), `node tests/run-all.mjs` (proves every other boss
   byte-unchanged), `node tools/stamp-sw.mjs` in the same commit.
5. **STUDIO + ⛔ FABLE DESIGN GATE on the NEW grandeur:** `node tools/bossstudio.mjs karnvow` →
   spawn an independent **Fable agent (via the Agent tool)** on the black-fill / lit-edge /
   fight-distance renders + the **dread-move pose (Voidmaw's Verdict firing)** — *"Independent design
   gate. This is a grandeur redo of a boss that read underwhelming at the band peak. Does he now read
   GRAND — the trophy chain at arena scale, the dread move a screen-filling violet spectacle, the
   presence worthy of a Calamity PEAK — while still reading as the lean hooded trophy-hunter duelist
   (NOT a generic colossus, NOT KARNVOW-but-boring)? Is the dread move a clip-worthy image, not a
   quiet pattern? Verdict PASS / FIX."* Fix and re-gate until PASS.
6. **POST BEFORE/AFTER CROPS + THE DREAD-MOVE + THE CUT-IN, then STOP for the owner.** The owner
   judges motion/feel on the preview (`?debug&boss=100&bossIdx=8`, `?rush=all`) — specifically: does
   Voidmaw's Verdict now land as a "holy shit" moment, does the trophy chain read big, does the
   cut-in feel close? Do NOT flip the PR out of draft on your own verdict.

---

## PART 6 — GUARDRAILS + DONE-WHEN

- **Touch ONLY KARNVOW's files** (his builder, his def, his §5d sheet). Every other boss stays
  byte-identical — prove it with the full suite.
- **DRAWS are the ceiling that will bite** (~66% used): spend tris on richer existing geometry +
  merge static parts; don't add many new separate meshes. If you approach 70 draws, merge before you
  add.
- **Don't lose the identity.** He is a lean hooded trophy-hunter duelist whose grandeur is
  personalization + proximity + the dread spectacle — NOT bulk. If the fight-frame reads as a generic
  giant, you've overshot Option A into a worse place.
- **Keep his claimed constraints**: no rear-view camera, no pull-ahead (the near-pass is a lateral
  cut-in); the mutual-gaze indifference (he never turns his cowl — the glint tracks, the head
  doesn't).
- **Don't finalize any palette near reserved role colors** (danger magenta / parry amber / reflected
  cyan / surge pink) — the violet trace must clear danger-magenta (`bulletcontrast`).
- Never `git stash` / `git checkout --` / `git reset`; foreground commands only; don't self-merge.
  Commit trailer per repo convention; model identifiers out of commits/PRs.

**DONE-WHEN:** the gates are green (under 14k tris AND 70 draws), the Fable design gate PASSes on the
new grandeur, the before/after + dread-move + cut-in crops are posted, and the OWNER green-lights the
preview. **Append a LEAPFROG lesson** (e.g. "KARNVOW redo: a band-PEAK boss can't be a quiet
scale-down — the dread move needed a screen-filling authored VISUAL (the lance tracing the verdict in
violet), and presence came from the trophy chain at arena scale + a true near-pass, not bulk; draws,
not tris, were the ceiling") and update his §5d note.

---

### Why this matters (the one thing to weight the preview on)
KARNVOW is the band PEAK, and a peak that reads smaller and quieter than the boss before it (the
never-fits leviathan at slot 8) is the roster's one grandeur crater. His whole thesis is "a lean
figure that lands HARDER than a colossus because it knows you" — the charm that flares matching your
top killer, the stat-taunt. That thesis only works if the SPECTACLE around it is loud: the dread move
has to be a moment you'd clip, and the trophy chain has to fill the frame. Build for those two beats;
judge the preview on whether they land.

---

### Note for the owner
This redo assumes the shipped state from when KARNVOW landed (~6,455 tris / ~46 draws, no authored
dread visual). **Part 1 forces the builder to VERIFY the actual current state first and report before
rebuilding** — so if a later pass already improved some of this, the builder scopes down to only what's
genuinely still weak, rather than blindly re-doing it.
