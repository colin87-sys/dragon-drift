# Dragon Redesign — Evolution & Silhouette System

Status: **Solar Sovereign benchmark implemented.** Other dragons unchanged
(they fall back to the legacy wing/tail path) until this template is approved
and rolled out.

## The problem with the old system

Evolution was driven almost entirely by **uniform scale** plus a bag of
bolt-on flags:

- `SIZE_RAMP` scaled the *whole group* — body and wings together — so the
  wing-to-body **proportion never changed**. Forms only got bigger, not
  *different*.
- The wing was **one fixed `buildWingShape()`** reused at every tier.
- The tail only changed at the apex, and changed *into the banned mace/ball*.
- Result: all four forms read as the same shape rescaled, especially from the
  chase camera (the angle players actually see).

## The new language: silhouette carries the evolution

Each form must be a **different rear-view silhouette**, not the same outline
scaled. Five levers, ramped per form:

1. **Decoupled span vs. body** (`ascension.js`): body ramps `SIZE_RAMP =
   [0.75, 0.85, 0.94, 1.0]`; wings ramp on a *separate, faster* curve
   `WING_RAMP = [0.907, 0.941, 0.968, 1.0]`. Net absolute wingspan ≈
   `[0.68, 0.80, 0.91, 1.0]`, so the wing-to-body ratio grows every tier — a
   compact stubby-winged whelp → a broad-winged apex.
2. **Per-form wing silhouette** (`dragonModel.js` `WING_FORMS`): finger count,
   span reach, trailing-edge scallop depth, and an apex flame-segmented edge.
3. **Per-form tail** (`tailStyle`): `simple → finned → blade → comet`. No mace,
   no ball, no bulbous tip. The whip tapers hard so even the long apex tail
   stays elegant.
4. **Dorsal spine glow** (`spineGlow` 0→1): a molten back-line that reads as a
   bright stripe from directly behind. Off on the whelp, blazing at apex.
5. **Heroic back-crest + solar halo** (`backCrest`, `auraHalo`): apex-only
   crown of raked blades framing the rider, plus a thin additive corona ring
   (open centre — the path ahead stays readable).

Glowing wing veins (`wingVeins`) trace the finger bones from the elite forms.

## Solar Sovereign — silhouette plan

| Feature      | T0 Whelp            | T1 Kindled            | T2 Radiant                 | T3 Sovereign                    |
|--------------|---------------------|-----------------------|----------------------------|---------------------------------|
| Wingspan     | ~0.68 (narrow)      | ~0.80                 | ~0.91                      | 1.00 (widest)                   |
| Wing fingers | 3                   | 4                     | 4 + glowing veins          | 5 + bright veins                |
| Wing edge    | smooth, near-flat   | gentle scallop        | deep scallop               | segmented flame edge            |
| Body         | 0.75 compact        | 0.85                  | 0.94 sleek                 | 1.00 regal                      |
| Shoulders    | narrow              | slight                | strong                     | crowned back-crest              |
| Spine        | none                | small ridge + sail    | bright glowing line        | blazing solar spine             |
| Tail         | short point (5 seg) | finned (7 seg)        | blade/fork (8 seg)         | forked comet + glow (9 seg)     |
| Aura         | none                | faint ember idle      | wing glow + tip trails     | solar halo + contrails          |
| Eyes/seams   | gold                | gold                  | apex palette (molten)      | apex palette (molten)           |

Palette throughout: obsidian-black body, molten orange core, gold highlights,
crimson→gold wing membrane gradient. Cyan is intentionally absent.

## Where the code lives

- `js/dragons.js` — `solar.forms[0..3]` set the per-stage silhouette params.
- `js/ascension.js` — `SIZE_RAMP`, `WING_RAMP`, `ascendedDef()` decoupling.
- `js/dragonModel.js` — `WING_FORMS`/`buildWingShape(spec)`, `tailStyle`
  variants, `spineGlow`/`backCrest`/`auraHalo`, glowing wing veins.

## QA harnesses

- `node tools/tiershots.mjs` → `/tmp/tier-<key>.png` — isolated rear/above
  montage at a **fixed per-dragon distance** so the size & silhouette ramp is
  visible (it no longer re-frames each tier to the same width).
- `node tools/gameshots.mjs <key>` → `/tmp/game-<key>-montage.png` — the real
  chase-camera view, 2× scale, cropped tight to the dragon, T0..T3 side by side.

## Rollout (after approval)

Apply the same `wingForm` / `tailStyle` / `spineGlow` / crest / halo language to
the other five dragons, each with its own palette and silhouette accents
(serpentine Jade, twin-wing Obsidian, feathered Pearl, etc.). Remove the legacy
`mace`/`fan` tail paths once no dragon references them.
