# Owner-playtest feel-fix batch — two LEGIBILITY fixes (Karnvow return, Onewing frame-break teaching), one WALL-MARGIN safety fix (Eitherwing outer pip), one new SPECTACLE (Hollowgate converging iris) — and the two things the owner told us NOT to build

**What we did.** Ran three Fable assessments on a round of owner playtest feedback, then built the four
the owner green-lit (dropping two after his explicit call). Each went through the two-Fable-pass
discipline (assessment/spec → build + gate → post-build adversarial verify). The headline meta-lesson is
about **letting the empirical assessment change the SCOPE**: two of the owner's asks turned out to be
geometrically impossible or self-defeating, and the right move was to *not build them* and tell him why.

**The two we did NOT build (the owner decided, on the numbers).**
- **Ashtalon "the dive should hurt me"** — a headless geometry probe proved the stoop **misses the player
  by 3.2m at its closest frame**: "he dives into you" is a camera illusion (he dives to 3m in FRONT). A
  contact hitbox would have been *dead code*; making it truly bite needs pulling the dive line in
  (`DIVE_REL 10→4`), a real difficulty shift. Presented with that, the owner chose **no damage** — the
  dive stays a cosmetic scare.
- **Knellgrave "does the bell hurt?"** — the swinging bell **misses by 1.3m**, and the probe showed that
  *forcing* it to bite erodes the margin of the player doing it RIGHT (the mirrored-safe-lane) faster than
  it adds fair challenge. Recommended and accepted: **no bell hitbox**. (The real free-bronze overlap is
  the *Last Toll*, flagged for its own future pass — it collides with the survival-exam geometry.)
  *Reusable: "it should hurt when it hits me" assumes it hits you — PROBE the actual body-vs-plane
  geometry before speccing a hitbox; a camera illusion is not a collision.*

**Legibility fix 1 — KARNVOW's rally ball was sub-JND.** The riposte RETURN (the ball you must volley back
to build the rally) rendered as amber + WHITE core at +10% size — statistically indistinguishable from his
stock ambers, and sitting *between* his aimed shot and his lob on both size and speed. The whole rally read
as chaos ("I don't know what he's reflecting"). Fix: the return now wears the duelist's **cold accent core**
(`def.accent` steel-blue) on an honest amber ring, lobbed **1.45×**, with a birth-flash AT the ball, and the
"⚔ VOLLEY IT BACK" prompt **moved to the moment the ball exists** (it fired 0.22s BEFORE the ball spawned
and never said which one). Extends the shipped **onewing tinted-core grammar** ("this fight's parry object").
*The load-bearing constraint: the distinctness rides color/core/size — NEVER a `part` tag (karnvow has
lockParts + no emitOrigins, so any string tag brands a phantom trophy organ, the ENG-EW hazard; the gate
asserts `part===null`).*

**Legibility fix 2 — ONEWING's frame-break was taught only in retrospect.** The mechanic (4 PERFECT parries
of the dead twin's ghost volley) was fully built, but nothing ever said "frame" or "perfect," and a
*non-perfect* parry banked nothing **with zero feedback** — so it read as "parrying does nothing" (the
owner's literal "how do you break frame?"). Fix (pure legibility, zero mechanic change): a first-volley
prompt ("PERFECT-PARRY its pale ambers ×4 — BREAK THE FRAME"), a per-hit "THE FRAME CRACKS N/4" beat, and
the key one — a once-per-fight **"only a PERFECT parry cracks it"** hint that fires exactly when you parry
near the ghosts but don't land it perfectly. *Reusable: a perfect-only mechanic that gives NO feedback on a
non-perfect attempt reads as broken; the silent-failure case needs its own one-shot teach.*

**Safety fix — EITHERWING's outer pip swung PAST the kill wall, and the "obvious" reseat didn't work.** The
outer lock organs ride the twins' orbit; the sway-aware fence (the Brineholm shape, generalized to a
LIVE-orbit max) measured `seekerScar`'s acquire point at **~13.5m — beyond the ±13 instant-kill wall**
(the owner's outer-pip crash; worse than Brineholm's 1.25m). The instructive part was the FIX iteration:
- Reseat the lock marker from the mid-tail pivot to the tail-ROOT pivot → **11.98m** (helped, still failed).
- Reparent to the twin at the tail-root local offset (`z = −BODY_LEN·0.42`) → **still 11.98m** — because
  **the twin YAWS as it orbits, rotating the −z offset straight into x.** A behind-the-body offset is not
  a lateral-safe offset on a yawing body.
- Reseat to the twin body itself (`position 0,0,0`) → **8.69m** → margin 7.69 ≤ the 9.0 comfort line. PASS.
The invisible lock marker now rides the calm twin body (~as safe as `seekerFin`); the visible scar ribbon
still flows out freely. Plus `holdSway {amp:1.6}` (the Brineholm line; 1.6 < retentionConeXY 4.0 so a HELD
lock never drops). *Reusable: on a YAWING organ, a −z (behind) offset becomes an x excursion at the reversal
— reseat lateral-safe markers to the body origin, not "behind" it; and the fence must MEASURE the live
excursion, because the "obvious" pivot was 4m off what the geometry actually does.*

**New spectacle — HOLLOWGATE "THE WALLS CONVERGE".** The owner found Hollowgate "chill" and wanted "a slow
release from the inner walls all converging, with space to escape." The assessment found the fly-through
beat (`archPass`) already exists and its interior is **empty of authored threat**. Built a slow amber IRIS
that constricts from the arch's inner walls toward the aperture axis, with a **player-seeded safe lane
SEALED at telegraph time** (the geyser can't-lie law: the glint marks a doomed rim point, the wall spawns
exactly there 0.45s later; the gap sector the player was promised can never get a bullet). Setpiece-owned
fire (the ribThread precedent — NOT an attack id; the Calamities ≤1-id budget is spent on geyser), zero new
geometry, every bullet parryable. *The gate is the proof: it parks a player in the sealed bottom lane and
asserts **zero health loss across 4 converging waves** — an honest occupiable-lane test, not a "does it
emit bullets" test.*

**Verify.** `tests/boss.mjs` **125** green (+1 BATCH-3 block; the Onewing block gained teach asserts),
deterministic across repeated runs; `bossboot` green. The Eitherwing fence seeds its model build (the
karnvow-footwork precedent — an unseeded build would drift the excursion across the fence threshold).
Bullet debug projection gained `color`/`r`/`vrel` (test seam). Every engine edit is def/setpiece-gated
(reflectRiposte / ghostHalf / holdSway / archPass) → byte-identical for the rest of the roster;
`tricount`/`tiershots` unchanged by construction (zero geometry — the scar marker + iris are pooled/empty).
`stamp-sw` in the commit.

**Preview-judged.** The four all have real feel deltas the owner judges on the preview: the return ball's
cold-core read at fight distance (dial: core tint + size 1.3–1.6), the onewing note copy, the calmer
Eitherwing idle + the scar lock now at the twin body (is it distinct enough from the eye?), and the
Hollowgate iris — its density (~30–38 slow ambers/2s), the safe-lane obviousness, and the stained-gold
glint prominence. Each is one line back.

**What this unlocks.** The bounded-chaser / live-orbit / occupiable-lane gate family now covers "can the
player physically DO this / SURVIVE this" for graze pockets, lock organs, and converging patterns alike —
the throughline being *measure what a real player on the real control model actually experiences, never a
teleport or a pinned variable*. Remaining on the boss backlog: the `recur` riders, the Knellgrave F2 early
-parry fragility + the Last-Toll bronze overlap (both preview-gated), and the UNMASKED Part D capstone.
