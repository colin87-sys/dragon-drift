# Seven rounds of gating, and the gates were the problem

**What we did.** The owner asked the only question that mattered: *"We have been using a gate every
time. Why is this still happening???"* So we ran every gate against the SHIPPED ROSTER instead of
against the subject. All three failed.

---

## The audit

| gate | against the roster |
|---|---|
| `planformprobe` | **fails every shipped dragon** — tempest 2/12, vesper 2/12, revenant 4/12. All three fail **P10, "an ARM exists"**. |
| `holecensus` | passes everyone — but it is a **CEILING WITH NO FLOOR** |
| `flapclearance` | **C2 is VACUOUS on every dragon in the roster** — it has never tested anything, anywhere. C1 fails vesper. |

## THE RULE THAT WOULD HAVE CAUGHT ALL OF IT

> **Any metric the reference dragon fails is wrong by definition.** Run every new gate against the
> shipped roster BEFORE pointing it at the subject, and treat a roster failure as a bug in the gate,
> not a finding about the roster.

This was already known here — `planformprobe`'s own §BANDS says it in as many words, and its P2 and
P4 bands were recalibrated for exactly this reason. It was written down and then not applied to the
next three gates anyone built.

## The specific way a one-sided gate destroys a wing

`holecensus` scored enclosed daylight with a ceiling only. A ceiling alone says *less is always
better*, and the limit of that instruction is a solid sheet — the plane/delta, this repo's
kill-on-sight failure.

The gate then got what it asked for. A separation notch was widened from 0.66 to 0.80 **specifically
to lower this number**, with a 17-line comment recording the sweep. It did not remove daylight: it
converted ENCLOSED daylight into OPEN daylight, which neither census counts. It scored 9.44% → 8.37%
— an improvement — while widening the exact gap the owner circled in a screenshot two rounds later.
By round 7 an independent critic measured the chord profile and confirmed the wing was a delta.

> **A one-sided metric is an instruction to go to the extreme.** Before shipping any assert, ask
> what the geometry looks like at the metric's optimum. If the optimum is a failure mode, the assert
> needs a band, not a threshold.

Fixed: `H3` requires mean enclosed daylight **≥1.5%**. Roster: tempest 3.33% ✓ · revenant 2.96% ✓ ·
vesper 0.31% ✗ · fornax 0.29% ✗. It passes the two wings that read as fingered and fails the two
that read flat — including the subject, immediately.

## And a failure that was not tooling at all

The gate returns a RANKED blocking list. Rounds 6 and 7 both worked item 1 and left 2 and 3. The
shoulder strap fan — the owner's "spokes", his words, raised three separate times — was blocking #1
for two consecutive rounds and was not touched in either.

> **A ranked blocking list is not a menu.** Work it in order and completely, or the top item survives
> every round while the score moves on lower ones.

## What this cost

Seven gated rounds: 2.0 · 2.4 · 2.1 · 3.4 · 2.3 · 2.9 · 3.0. Each round the gate named a real
defect; each round it was fixed while steering by a broken instrument; each round the gate caught the
new damage. **The gate was never the thing failing — it was the only thing working.** What failed was
everything between gates, because the compass was wrong and nobody checked the compass against a
known-good bearing.
