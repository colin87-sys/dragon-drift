# Skybreak: prototype plan

**Status: preproduction plan. No playable Skybreak build has been implemented.**

Working name: **Dragon Drift: Skybreak**. Branch: **codex/skybreak-prototype-plan**. New project directory: **skybreak/**, beside **reforged/**.

This is a deliberately small new game slice: **one dragon, one authored route, one memorable boss**. Its purpose is to establish that flying the dragon feels good, the character looks convincing in motion, and players voluntarily start another run. A larger roster or progression system comes after that evidence.

## The proposed experience

Fly **Cinder**, an agile, muscular fire dragon with broad membrane wings, through **the Shattered Causeway**, a ruined aqueduct suspended above a cloud sea. Carve through ring lines, take optional tight passages, roll through reflectable bolts, and build **Surge**. Spend Surge to burst through a brittle obstruction or save it for the boss.

At the observatory, confront **the Stormwarden**, a colossal storm creature with a crescent stone carapace. Break three exposed vanes, destroy its inner seals, burn its revealed heart, then escape its hollow storm beam. Repeat with more demanding attack combinations. A strong player can hold the beam's dangerous central pocket and earn charge for the next opening.

The mechanical reference is **Gorgon, the Area 6 boss in Star Fox 64**. It has a credible record of player affection and fits forward flight. We preserve its defense-stripping, core-opening, beam-survival loop, while designing a new creature, setting, animation language, attack geometry, tuning, and audio.

## Read the plan

| File | What it specifies |
|---|---|
| [DESIGN_PLAN.md](DESIGN_PLAN.md) | The experience, controls, starting stats, exact route ring schedule, hazards, score and charge rules, replay loop, accessibility, and playtest gates |
| [BOSS_REFERENCE.md](BOSS_REFERENCE.md) | Comparable boss research, reception evidence, video links and limitations, the chosen reference, and the complete Stormwarden state and attack specification |
| [ART_DIRECTION.md](ART_DIRECTION.md) | Cinder's anatomy and silhouette, original asset production, openly licensed candidates, rig and animation brief, environment, boss, effects, audio, and asset budgets |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | Repository isolation, code boundaries, data contracts, ordered work packages, dependencies, acceptance criteria, validation, estimates, and stop conditions |

## Decisions at a glance

| Area | Initial decision |
|---|---|
| Session | Approximately 80 seconds of route flight, then a boss; target ordinary successful runs around 2–3 minutes |
| Actions | Steer; roll; Surge. Breath fires when a valid boss target is deliberately aligned |
| Platform | Static browser game; touch and keyboard from the first playable; portrait is the mobile reference layout |
| Hero | One original organic dragon, properly skinned and animated |
| Route | 3,360 m; six authored sections; 32 ring opportunities; optional lines inside the same course |
| Boss | One repeatable encounter; 240 core HP; clear attack and vulnerability states |
| Replay | Improve line, precision, Surge use, boss execution, and personal best; fast retry; comparable challenges |
| Progression | Three mastery goals, local records, and presentation rewards only; no power upgrades |
| Engineering | Separate static ES-module project; 60 Hz simulation; one scoring owner; explicit run specification |
| Graphics | Sculpted forms, restrained materials, large readable silhouettes; actual device performance decides detail |
| First deliverable after implementation starts | A 20-second flight lane with Cinder's model and animation in the real camera |

## What this plan is grounded in

The code baseline is master commit [b40246562db20ba267689124f4328574ed48451c](https://github.com/colin87-sys/dragon-drift/tree/b40246562db20ba267689124f4328574ed48451c). The plan uses observations from Reforged's implementation, not its internal development roadmaps.

All values in these documents are **initial tuning proposals**, not measurements of a finished Skybreak build. The research and source checks were performed on **12 September 2026**.

Boss walkthrough and reception sources were readable. Two linked YouTube boss recordings opened, but playback remained at 0:00 in this environment. The plan therefore distinguishes walkthrough-supported mechanics from proposed Skybreak timings; it does not claim a frame-by-frame footage analysis. Verifying the recordings is an explicit early work item.

An original Cinder concept illustration was generated for discussion. It establishes a visual direction, not a production mesh, rig, or performance result. The production art brief is recorded in ART_DIRECTION.md so implementation does not depend on an image alone.

This planning branch changes only files under skybreak/. Gameplay implementation, a public preview, and release follow the planning decision.
