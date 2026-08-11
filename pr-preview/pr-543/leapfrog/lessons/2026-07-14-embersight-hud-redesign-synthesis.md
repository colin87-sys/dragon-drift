# EMBERSIGHT: judge-panel HUD redesign — three rival concepts beat one committee draft

**What we did.** The owner rejected the overhaul plan's original Phase 3 posture ("patch
the HUD in place") and asked for a completely fresh set of eyes. We ran a **judge-panel
redesign**: one focused research agent (2022–2026 HUD state of the art — AC6/AC7 lock
grammar, Dead Space vs Callisto body-HUD, F-Zero 99 meter economy, Horizon per-element
customization, the "dated in 2026" list) + **three independent Fable concept designers
with deliberately opposed philosophies** — EMBERBOND (dragon-diegetic: vitals on the
creature), THE CREANCE (falconer's precision instrument: five-primitive grammar), SKYWRIT
(cinematic-ambient: edge-light + summoned numbers) — then a high-effort Fable synthesis
director who scored, merged, and killed. Output: `reforged/HUD-REDESIGN.md` (**EMBERSIGHT**,
399 lines: five laws, full element spec, both orientations, increments H1–H9, risk
register, settings contract) + surgical pointers in `UI-PREMIUM-OVERHAUL.md` so U8/U9/U10
and Phase 3 now execute this spec.

**What we learned.**
- **Opposed philosophies converge on the trunk and fight only at the branches.** All
  three designers independently produced the same core (kill always-on clutter via
  relevance, lens2 brackets as the one reticle, DOM boss bar on the existing `bossHit`
  seam, one toast lane, protect the boss-card system). When three adversarial takes agree
  unprompted, that shared core is design truth — the synthesis declared it foundation and
  spent its judgment entirely on the genuine conflicts (where vitals live, where the boss
  bar goes, which signature elements survive).
- **Research adjudicates taste fights.** The boss bar went bottom-center (nameplate type
  continuity with the protected title card + FromSoft/AC6 precedent) over SKYWRIT's
  seductive top-edge THREAD; damage direction went avatar-anchored (GoW Ragnarök's ruling
  for chase-cams) over reticle-adjacent chips; EMBERBOND's "DOM as residue" got inverted
  because Callisto/Falcon Age prove diegesis can't be the sole authority under stress.
  Without the trend research, these would have been coin flips.
- **The freshness layer rides behind flags, the legible layer ships first.** H1–H6 are
  DOM-only and complete the HUD; the never-been-shipped material (trend-encoding wing
  luminance, spine ignition, the Creance tether) is H7–H9 behind `?vitals=1`/`?tether=1`
  with flag-OFF pixel-identical gates — fresh without ever betting the shipped game on it.
- **Design the settings contract INTO the spec, not after.** The state machine
  (`hud-cruise/combat/boss` body classes) is simultaneously the relevance engine, the
  per-element ALWAYS/DYNAMIC/OFF override API (Horizon pattern), IMMERSIVE mode, and the
  colorblind redundancy story. One architecture, five features.

**The gotcha.** A stop-hook flagged "unverified commits" on the branch after we restarted
it from `origin/master` — the flagged hashes were **GitHub's own merge commits from
master history**, not ours. Never rewrite upstream master commits to appease a hook that
is really complaining about a stale remote branch ref; set `git config user.email/name`
for future commits and move on.

**The reusable pattern.** For "give me fresh eyes on X": (1) focused trend research on X
alone (the general report is too shallow at the branches); (2) N concept agents with
**named, opposed philosophies** and a shared information budget + constitution so
concepts are comparable and cohesive-by-construction; (3) a synthesis director required
to publish a **provenance scorecard** (scores, what won, what was killed and WHY) so
future sessions don't re-litigate killed darlings. The scorecard is the leapfrog: the
next session inherits the judgments, not just the winner.

**What it unlocks.** Phase 3 is now the EMBERSIGHT increments H1–H9, each independently
shippable with pre-written gates; H1 (state machine + relevance + the Bell) can start
immediately after Phases 0–2, or even be prototyped standalone since it touches only
HUD DOM. Owner-taste calls (tether, wing flare, DLZ column, wingbeat-sync depth) are
flagged for PR-preview judgment per the Gate protocol.
