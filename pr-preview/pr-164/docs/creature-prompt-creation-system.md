# Prompt-Accurate Creature Creation System

This is a clean-sheet creature authoring plan for Reforged. It deliberately does
not start from the reusable body-part lesson loop. The goal is to make an AI text
prompt land closer to the creature the player sees in game,
within the limits of procedural Three.js graphics and a chase-camera racing game.

## Core diagnosis

The current failure mode is not that the generator lacks enough horns, fins, or
materials. The failure is that the authoring vocabulary is too implementation-led:
AI is asked to choose reusable modules, then the game hopes those modules add up
to the reference. Reference images do not describe themselves as modules; they
communicate a single pose, silhouette, proportion hierarchy, material read, and
personality. If the first representation is a parts list, the most important
reference information is already lost.

The replacement system should be **prompt-first, silhouette-first, and reference-assisted**:

1. Parse the AI prompt into a strict visual brief; use reference images only as clarifying evidence.
2. Convert that brief into a small number of measurable creature marks.
3. Generate one coherent creature envelope from those marks.
4. Add local anatomy and decoration only after the envelope is locked.
5. Validate the result against the brief from the chase camera and shop camera.

The engine can still be procedural. The difference is that the generator becomes
a **creature compiler**, not a menu of interchangeable parts.

## Design target

A successful creature should be:

- recognisable from the prompt in two seconds;
- readable from the rear/top-rear gameplay camera;
- charming rather than realistic;
- capable of wide variation without adding a custom model file per creature;
- scalable from mobile/high mode to ultra mode;
- authored as data, but data that describes the whole animal, not a bag of parts.

For ultra mode, the ceiling should assume flagship-device presentation: latest
high-end phones and current top-end desktop GPUs. Ultra is allowed to spend more
vertices, layered shaders, secondary motion, and surface detail, provided high
mode keeps the same silhouette and gameplay readability.


## How the new approach works end-to-end

The system should feel like a compiler for imagination. A prompt such as
“a shy moon-jellyfish dragon with a floating umbrella bell and four glowing
ribbon tentacles” should not search for the closest existing dragon body. It
should go through this deterministic sequence:

1. **Intent lock.** Extract the creature fantasy, mood, and non-negotiable
   recognition marks from the prompt. In the jellyfish example, the locks are
   umbrella bell, four ribbon tentacles, soft translucency, shy/non-threatening
   mood, and floating motion.
2. **Envelope choice.** Pick or morph a whole-body hull family that can carry
   those locks. The jellyfish should become a `mantaDelta`/`serpentineRibbon`
   hybrid envelope, not a drake with jellyfish accessories.
3. **Proportion solve.** Set measurable ratios before decoration: width/height,
   head or face placement, tail length, body flatness, and how much space the
   creature may occupy in the chase camera.
4. **Signature anchor placement.** Place the prompt-critical features as named
   anchors with priority. Priority-1 anchors survive every LOD and every
   evolution stage.
5. **Surface language.** Translate prompt adjectives into shader/material zones:
   translucent, mossy, porcelain, stormcloud, candle-wax, coral, paper, glass,
   velvet, ember, and so on.
6. **Character motion.** Give the creature a motion verb from the prompt. A
   jellyfish pulses; a beetle clacks; a fox-drake bounds; an orchid manta glides;
   a moss axolotl waddles.
7. **Gameplay validation.** Render clay, high, and ultra versions from the chase
   camera. If the prompt locks are not readable, reject the blueprint instead of
   adding more decoration.

Creativity comes from the cross-product of hull family, proportions, signature
anchors, surface language, and motion. Two creatures can share no visible DNA
even if the renderer uses the same underlying math, because their first-class
identity is not “torso + wings + head + tail”; it is “what visual promise did the
prompt make, and what geometry best protects that promise?”

## Prompt first; reference images second

Reference images are useful, but they should be treated as understanding aids.
The text prompt remains the source of truth because it carries intent, fantasy,
and constraints that an image may not show. A reference can answer questions like
“how flat is manta-like?”, “what does the petal edge look like?”, or “is the
material glossy or soft?” It should not silently replace “gentle orchid manta”
with “spiky bat dragon” just because the image contains a dramatic angle.

Use this priority order when both are provided:

1. **Prompt intent:** species metaphor, mood, must-have traits, forbidden drift.
2. **Prompt constraints:** gameplay readability, cute/scary/regal/comedic tone,
   evolution fantasy, color requests.
3. **Reference silhouette evidence:** proportions, edge shape, pose, broad mass.
4. **Reference material evidence:** texture scale, translucency, glow placement.
5. **Reference micro-detail:** only if it does not fight the prompt or gameplay.

If prompt and image conflict, the blueprint should record the conflict and choose
the prompt by default. Example: if the prompt says “soft harmless moon jellyfish
dragon” but the image has sharp horror teeth, the generated creature should keep
the soft moon-jellyfish read and perhaps turn the teeth into tiny pearl nubs or a
subtle smile.

## The new asset: a Creature Blueprint, not a parts recipe

Every AI-generated creature should be stored as a `CreatureBlueprint`. The
blueprint is the canonical artifact the AI emits, the tools validate, and the
renderer compiles.

```js
{
  id: 'mossLanternAxolotlDrake',
  read: {
    archetype: 'amphibian-lantern-drake',
    oneLine: 'a squat mossy axolotl-drake with glowing cheek fronds and a lantern tail',
    cameraRead: ['wide soft head', 'six cheek fronds', 'round moss back', 'hanging lantern tail']
  },
  silhouette: {
    bodyLine: 'low-salamander',
    mass: { head: 0.32, chest: 0.28, hips: 0.22, tail: 0.18 },
    proportions: { length: 1.0, height: 0.34, width: 0.72 },
    signature: ['oversized rounded head', 'horizontal frond fan', 'small paddle feet', 'tail lantern']
  },
  anatomy: {
    spine: { curve: 'gentle-s', posture: 'low', segments: 9 },
    limbPlan: 'salamander-paddles',
    wingPlan: 'none',
    headPlan: 'wide-smile-mask',
    tailPlan: 'drooping-lantern'
  },
  surface: {
    primary: 'velvet moss skin',
    secondary: 'wet amphibian belly',
    pattern: 'irregular leaf patches',
    glow: { color: 0x8dff9b, zones: ['cheekFronds', 'tailLantern'] }
  },
  personality: {
    motion: 'bouncy-curious',
    idle: 'fronds pulse like gills',
    charm: ['tiny forepaws', 'sleepy smile', 'lantern bob']
  },
  constraints: {
    chaseCameraSafe: true,
    headAlwaysVisible: true,
    maxVerticalScreen: 0.42
  }
}
```

The key difference: the AI first commits to the four or five things the prompt says the creature
must be remembered for. The renderer then protects those marks throughout LOD,
animation, and evolution.

## The four-pass compiler

### Pass 1 — Prompt distillation

Input starts with the text prompt. Reference images are optional secondary inputs
that clarify shape language, material, or pose; they must not override the
prompt unless the author explicitly says the image is authoritative. The AI must
produce a non-rendering `VisualBrief` before any geometry is chosen.

Required fields:

- **species metaphor:** “manta fox”, “orchid wyvern”, “clockwork beetle-drake”.
- **top 4 recognition marks:** the traits that must survive every simplification.
- **proportion sentence:** short, measurable shape language.
- **material sentence:** what the surface should feel like.
- **personality verb:** glides, skulks, waddles, prowls, flutters, pulses.
- **forbidden drift:** what would make the creature wrong.

Example:

```txt
Prompt: bioluminescent orchid dragon, manta-like, elegant, not scary
Recognition marks: petal wings, manta body, glowing throat, trailing root tendrils
Proportion: very wide and flat, short neck, tiny head, long ribbon tail
Material: translucent orchid petals over dark wet skin
Motion: slow underwater glide
Forbidden drift: do not become a bat-winged spiky dragon
```

This pass should be saved next to the blueprint. When the output is wrong, the
brief makes the error debuggable: either the AI misunderstood the prompt, or the
compiler failed to preserve the brief.

### Pass 2 — Whole-creature envelope

Before any head, wing, horn, or tail details are generated, compile a single
low-resolution creature envelope:

- spine curve;
- body mass distribution;
- top silhouette;
- side silhouette;
- head/tail anchor volumes;
- gameplay camera footprint.

This can be implemented with a small set of continuous hull families rather than
part modules:

| Hull family | Use for prompts like | Shape controls |
| --- | --- | --- |
| `serpentineRibbon` | eel, wyrm, ribbon, smoke, koi | curve, ribbon width, fin height, tail taper |
| `mantaDelta` | manta, ray, kite, glider, orchid | width, flatness, wing-body blend, trailing edge |
| `salamanderLow` | axolotl, lizard, otter, moss beast | head width, belly sag, paddle positions |
| `avianPear` | phoenix, griffin, moth, owl | chest bulb, neck lift, feather fan spread |
| `insectoidShell` | beetle, crab, mantis, scarab | carapace plates, leg sockets, abdomen split |
| `drakeClassic` | dragon, wyvern, gargoyle | chest mass, wing shoulder, neck length, tail whip |

These are not “parts” to mix and match. They are starting topologies for the
whole body. A prompt chooses the hull family that best preserves the recognition
marks, then morphs it.

Acceptance gate: render the envelope as a matte clay model from the chase camera.
If the silhouette does not match the brief while undecorated, stop. Do not add
surface detail to rescue a wrong envelope.

### Pass 3 — Signature anchors

Only after the envelope passes, place the recognition marks as named anchors.
Each anchor has a priority, camera-facing rule, and LOD survival rule.

```js
signatureAnchors: [
  { id: 'petalWingFan', priority: 1, zone: 'leftRightFlanks', cameraRule: 'visibleFromRear', survivesLOD: 'all' },
  { id: 'glowingThroatOrb', priority: 2, zone: 'frontUnderside', cameraRule: 'visibleUnderHead', survivesLOD: 'all' },
  { id: 'rootTendrils', priority: 3, zone: 'tailRear', cameraRule: 'trailBehind', survivesLOD: 'high+' }
]
```

This replaces generic “add fins/horns/spines” thinking. The renderer knows which
features make this creature this creature, so it can spend detail in the right
places and cull less important decoration first.

### Pass 4 — Surface, charm, and motion

Surface is compiled from material intent, not from a fixed palette alone:

- velvet, shell, wet skin, petal, smoke, glass, bone, ember, moss, metal, cloud;
- pattern scale: broad patches, stripes, speckles, veins, bands, ocelli;
- edge language: soft, scalloped, serrated, thorned, feathered, crystalline;
- glow logic: internal organs, seams, eyes, vents, fronds, tail, wing edges.

Charm comes from controlled exaggeration:

- one oversized feature;
- one tiny contrast feature;
- one expressive motion loop;
- one readable face or “face substitute”;
- one toy-like rhythm in the silhouette.

Motion should be part of the blueprint because motion is often the character:

```js
motion: {
  locomotion: 'glide',
  primaryLoop: 'slow wing undulation',
  secondary: ['tail ribbons lag', 'petal tips breathe'],
  mood: 'gentle-regal'
}
```

## Reference image matching workflow

A practical reference workflow should have three checkpoints.

### Checkpoint A — Image-to-brief

Ask the AI to describe the image in the same fixed fields every time:

1. dominant silhouette;
2. body proportions;
3. top four recognition marks;
4. material zones;
5. pose/motion impression;
6. what must not be changed.

The author can correct this text before generation. This is the cheapest place
to fix mismatch.

### Checkpoint B — Brief-to-blueprint diff

Before rendering, compare brief fields to blueprint fields:

- Are all recognition marks present as anchors?
- Did the hull family preserve the dominant silhouette?
- Did the material sentence map to surface layers?
- Did forbidden drift become an explicit negative constraint?

If not, reject the blueprint before geometry exists.

### Checkpoint C — Render-to-brief scoring

Automated image understanding is optional, but the renderer can still score hard
rules:

- silhouette width/height ratio;
- head visibility from chase camera;
- central sight-line blockage;
- count and placement of priority anchors;
- glow zones present;
- LOD preservation of priority anchors;
- triangle budget by quality tier.

A human review can then answer one question: “Do the top four recognition marks
read?” This is far better than judging whether a reused module looks good.

## Ultra mode detail strategy

Ultra should not merely subdivide everything. It should spend detail where prompt
accuracy improves.

| Detail type | High mode | Ultra mode |
| --- | --- | --- |
| Silhouette | same outline as ultra | smoother curves, more scallops, richer trailing edges |
| Signature anchors | all priority 1–2 anchors | priority 3 anchors plus micro-shape variation |
| Surface | broad colors and glow zones | shader veins, pores, shell ridges, petal translucency |
| Motion | main loop | secondary jiggle, frond lag, membrane waves, tail overlap |
| Particles | restrained trail | prompt-specific motes, spores, embers, bubbles, petals |

Ultra can target flagship devices, but high mode must keep the creature identity.
If ultra is the only tier where the creature matches the prompt, the blueprint is
bad.

## Suggested implementation path

### 1. Add blueprint schema and validation

Create `js/creatureBlueprint.js` with schema defaults and validation errors that
are written for artists, not programmers:

- missing recognition mark;
- no chase-camera read;
- vertical profile too tall;
- glow zone references unknown anchor;
- hull family cannot support requested limb plan;
- forbidden drift not represented.

### 2. Build clay-envelope generators

Implement the six hull families as matte clay renderers first. Do not migrate the
existing roster. The first milestone is a gallery of undecorated envelopes that
match 10 very different prompts.

### 3. Add signature-anchor renderer

Build named anchor primitives that attach to envelope coordinates:

- frond fan;
- petal fan;
- lantern pod;
- shell plates;
- ribbon tendrils;
- mask face;
- soft paws;
- crown halo;
- crystalline fins.

These are not the base creature. They are recognition marks layered onto a
whole-body hull.

### 4. Add prompt pack tests

Create a small canonical prompt suite:

1. moss lantern axolotl-drake;
2. orchid manta dragon;
3. clockwork scarab wyrm;
4. stormcloud sheep kirin;
5. glass koi serpent;
6. candle moth phoenix;
7. coral crab wyvern;
8. paper kite fox-drake;
9. volcanic turtle leviathan;
10. moon jellyfish dragon.

For each prompt, store expected brief fields and validate that generated
blueprints preserve the top four marks. This makes prompt accuracy regressions
visible.

### 5. Introduce a two-column creation UI for AI iteration

The authoring tool should show:

- left: prompt/reference brief and recognition marks;
- right: generated blueprint and clay/chase renders.

Every regenerate action should be scoped:

- regenerate envelope only;
- regenerate signature anchors only;
- regenerate surface only;
- regenerate motion only;
- lock this recognition mark.

This prevents the common AI failure where fixing the tail changes the entire
creature.

## Rules for AI creature prompting

Use this prompt contract when asking an AI for a creature:

```txt
Create a Reforged CreatureBlueprint.
Do not choose reusable body parts first.
First write the VisualBrief: species metaphor, top 4 recognition marks,
proportion sentence, material sentence, personality verb, forbidden drift.
Then choose one whole-creature hull family and explain why it preserves the
recognition marks.
Then output the blueprint with silhouette, anatomy, signature anchors, surface,
motion, evolution changes, and constraints.
Keep the chase camera readable: low vertical profile, visible head/aim point,
central lane clear.
```

Bad prompt:

```txt
Make a dragon with feather wings, serpent body, crystal horns, and a comet tail.
```

Better prompt:

```txt
Make a shy moon-jellyfish dragon that reads as a floating umbrella bell with four
long glowing ribbon tentacles. It should be soft, translucent, and harmless, with
the bell silhouette visible from behind. Do not let it become a normal bat-winged
dragon.
```

## Why this should produce closer results

The system preserves the reference in the same order humans perceive it:

1. silhouette;
2. proportions;
3. signature marks;
4. material;
5. motion;
6. small details.

The old failure pattern is reversed. Instead of starting with available modules
and discovering that the result no longer resembles the prompt, the generator
starts with the prompt's recognition marks and only uses geometry that protects
those marks. The output will still be stylised and game-shaped, but it should be
much harder for an orchid manta, moss axolotl, or scarab wyrm to collapse into
“the same dragon with different accessories.”
