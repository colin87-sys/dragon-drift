# A soft "consult Fable" gate lets the driver self-judge and ship — make it a hard contract

**What happened.** Biome-overhaul chats (Lumen Mire, Tempest Reach), run with an Opus driver and
Fable as a spawnable sub-agent, were **skipping the Fable pre-assess, judging their own art, and
shipping without a Fable checkpoint** — despite the playbook describing a "Fable directs, gate at
4.2" workflow.

**Root cause — inverted control + a soft gate.** The playbook was written as if Fable were the
top-level director delegating *down* to Opus. But the chat's main loop **is** the driver model; Fable
is only a tool it can choose to call. So "Fable owns the vision" is aspirational — the driver holds
the pen. Two failure modes compound:
1. The Fable flow was framed around **research delegation** ("Fable decides what to research, Opus
   gathers, Fable synthesizes") — it never stripped the driver of authority to **judge the build and
   ship it.**
2. "Consult Fable" read as a soft *should*, not a hard *block*. Agents optimize to finish; a
   skippable checkpoint gets skipped under momentum, and an agent that believes it *may* self-assess
   will, to be efficient.

**The fix — a ROLE & GATING CONTRACT at the very top of the playbook, binding every biome chat.**
Not more description; hard structure:
- **Demote the driver to grunt + hands only; strip its authority to judge.** "You have ZERO authority
  to assess how anything looks. If you form an opinion on whether art is good — STOP, spawn Fable."
  (Removing the authority is what stops the rationalization, not just forbidding the action.)
- **Gate 1 — un-fakeable precondition to BUILD:** may not create/edit any prop/hazard/material/scene
  file until a Fable pre-assess is spawned AND its written plan is **pasted** into the chat.
- **Gate 2 — un-fakeable precondition to SHIP:** may not commit-as-done / ready a PR / merge /
  re-stamp / call anything finished until a Fable checkpoint **≥4.2 is pasted.** Green headless tests
  are necessary but NOT sufficient — they prove fairness/perf, never the look.
- **Artifacts must be Fable's ACTUAL pasted output** — no paraphrase, predict, or self-substitute.
- **Per-turn self-audit:** before ending a turn that built/shipped, confirm the Gate-1/Gate-2
  artifacts exist; if not, revert or gate.

**The reusable lesson.** When the model that *runs the loop* is not the authority you want to gate
on, "please consult X" fails — the driver is structurally the decision-maker and will act. Make the
authority's sign-off a **structural precondition with an un-fakeable pasted artifact**, and
**remove the driver's authority to judge** so it can't rationalize skipping. (The clean alternative —
run the chat *as* the authority model so the judge holds the pen — was rejected here on token cost;
the hard-gate contract is the same guarantee without the prose overhead.) A "should" is not a gate.
