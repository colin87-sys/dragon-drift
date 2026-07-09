# 2026-07-09 — The lance core loop: quiet the re-acquire, resolve the payoff into the song

**Did / learned.** Owner playtest of the shipped lance audio surfaced three linked
complaints, all one class of problem — *the acquire→paint→release→impact loop announced
its cheap, repeated moments and under-delivered its rare, earned ones*:

1. **"The hum + reticle lock-on are annoying — especially lock, dodge/weave, come back."**
   Root cause was structural, not tonal. In `lockLayer.js`, leaving the retention cone
   past `linger` (0.6s) calls `releaseAim()`, so weaving back is a *fresh* 0.35s acquire:
   the `dwellHum` swell restarts AND the full 3-tone `lockOn` chime re-fires, dozens of
   times a fight. Fix = **RE-LOCK MEMORY**: a held line letting go arms a per-part window
   (`S.reLock` map, `relockMemoryS 4.0` — matched to `decay` so a set stays "warm" as long
   as its brands live). Re-grabbing any armed organ within it is a *warm re-acquire* — the
   hum is driven to 0 (silent acquisition; the reticle fill is the only progress channel)
   and `lockOn` downgrades to a single 45ms tick. First-acquire keeps the full chime. Two
   review catches mattered: (a) a **single-slot** memory only fixes the strict same-organ
   out-and-back — an A→B→A→B rotation between two organs on a spread boss (BRINEHOLM eye ↔
   shackles) overwrites the slot and re-nags on every hop; a **per-part map** was required.
   (b) The warm flag must be **latched once at the acquisition frame** (`S.aimWarm`), not
   re-evaluated live — otherwise the window can expire mid-dwell and the hum (suppressed)
   and the chime (0.15s later, now "cold") disagree, giving the worst of both.
2. **"Don't love the emberfire release + impact."** `brandLoose` carried a sawtooth
   "laser" body-sweep + two phasey overlapping subs + sawtooth chirps (tinsel). Rebuilt
   around the "ejecting emberwyrms" thwack family the owner *did* like: contact crack +
   ONE falling-pitch sub (the punch) + body THWACK + `min(n,6)` "thwp-thwp" ejection puffs;
   the saw sweep deleted. `brandStrike` flipped pluck-forward → **impact-forward** (quieter
   shorter pluck, louder sub knock rising with k, sparkle only every other hit).
3. **"The core loop doesn't sound satisfying."** Leaned on the Rez machinery already in
   the engine: `brandSet`, `brandStrike`, and the `brandFinale` boom now all climb / resolve
   into the LIVE CHORD (`getHarmony`/`chordLadder`), so acquire→paint→release→impact is one
   harmonic sentence and the detonation *resolves into the track* — the Rez payoff move,
   without the sustained ring-out that was rejected in PR-C. Per-volley variety (the
   50th-volley rule) via the existing `detSeq` counter, relocated to `brandLoose` so one
   seed governs a whole volley's strikes+finale.

**→ Systematize.** (1) **A cue triggered by common input (reticle re-acquire) must
distinguish FIRST from REPEAT** — the fix for "sound X is annoying when repeated" is often
*don't replay it*, tracked in the state machine (per-part memory), not a quieter version of
the same replay. (2) **Latch a "which variant" decision at the edge that starts the phrase,
then have every channel (hum + chime) read the latch** — live re-evaluation lets sound and
sub-sound disagree at a window boundary (display == logic, again). (3) **A low-body payoff
sound resolves into the key via octave-FOLD, not raw snap** — `snapToChord` alone can jump a
boom an octave into the wrong register; fold it back into the sub band. (4) **Byte-identity
A/B is a discipline**: the new `?lance=v2` arm reproduces every shipped body verbatim under
`if (!LANCE_V3)`, and the one stateful gotcha — `detSeq` — is incremented in the SAME place
for the v2 arm (brandFinale) and a NEW place for v3 (brandLoose, once per volley), so neither
arm's deterministic walk drifts.

**→ Leapfrog.** Behind `?lance=v2` (restores shipped lance sounds) alongside the existing
`?audio=v1`/`?unleash=v1` hatches; the `lockLayer` re-lock state ships un-gated (inert data
until a consumer reads it). Verified headless: `lock.mjs` 100/100, `boss.mjs` 107/107,
`audioboot`/`harmony`/`loudness` green (`loudshots` measures music stations only — untouched
by SFX work; `lockdps` has a pre-existing KARNVOW/ASHTALON failure unrelated to audio). Feel
is ear-judged on the PR preview — the owner judges the weave-away-and-back loop and volley 1
vs volley 20. Owner's still-deferred calls from the unleash arc (haptics, slow-mo dip, scorch
permanence) are untouched here.
