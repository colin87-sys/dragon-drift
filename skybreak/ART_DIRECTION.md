# Skybreak: visual and audio production brief

**Goal:** one convincingly animated dragon in a coherent world, readable on a phone. The visual overhaul must improve anatomy, silhouette, material restraint, camera composition, motion, and feedback together.

The Cinder illustration generated during planning is a concept reference only. A raster concept cannot establish topology, skin weights, game-camera framing, or frame rate. The specifications below define the actual production deliverables.

## 1. The visual diagnosis and decision

Reforged has substantial creature-generation and rendering work worth learning from. It also has many procedural body/wing variants and several ways to load or deform a GLB. Its asset path includes mesh-local shader deformation and an optional generated skeleton path. Those are useful experiments, but Skybreak will use **an authored skinned character with explicit animation clips** as its main hero path. [Existing GLB implementation](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/dragonGlb.js) · [Existing rig implementation](https://github.com/colin87-sys/dragon-drift/blob/b40246562db20ba267689124f4328574ed48451c/reforged/js/dragonGlbRig.js)

The plan's visual judgment uses the inspected reference images and code structure. The current Reforged build could not be played with working WebGL in this environment. It does not claim every existing creature looks bad or that a new mesh alone fixes presentation.

Use **stylized naturalism**:

- Broad, sculpted forms with believable joints and weight.
- A few readable scale and horn groups, with small detail carried by textures.
- Warm membranes against a cool body and cool distant environment.
- Soft atmospheric depth and directional light.
- Strong contrast reserved for targets, hazards, and earned power.

Cinder should read as a living animal. Avoid stacked armor tiles, cylindrical neck sections, detached-looking shoulders, blade-like wing fingers, ornamental spikes everywhere, and a permanent full-body glow.

## 2. Cinder: shape and personality

| Feature | Production decision | Gameplay reason |
|---|---|---|
| Body plan | Four legs and two independent membrane wings | A clear dragon silhouette; wing roots can express power without replacing forelegs |
| Overall proportions | Approximately 4.8 m nose-to-tail and 7.6 m full wingspan after import | A consistent authored scale for camera, animation, and nearby architecture |
| Torso | Compact deep chest, visible shoulder mass, tapered abdomen | Wing power feels supported; the center of mass is readable from behind |
| Neck | Flexible, moderately long, with a continuous S-curve | Head can anticipate turns and aim without looking disconnected |
| Head | Strong tapered muzzle, pronounced brow, small expressive eyes, two swept ivory horns | Recognizable face at the landing screen without relying on microdetail |
| Wings | Broad proximal membrane, tapered outer fingers, articulated elbow and wrist | Shape remains readable in glide, flap, bank, and fold |
| Back | A few low ridges grouped into a rhythm | Identity without a noisy comb of spikes |
| Tail | Long flexible taper with a simple spade tip | Communicates acceleration and turning with delayed motion |
| Legs | Fold naturally during flight; claws relax and tense | Avoid stiff dangling limbs and human-hand poses |
| Expression | Alert, capable, slightly defiant; not a toy or a grotesque monster | Gives the player a creature to identify with |

Initial palette:

| Region | Starting color direction | Material behavior |
|---|---|---|
| Main scales | Slate blue-gray, approximately #52616A | Mostly matte, broad roughness variation |
| Underside | Warm ivory, approximately #D5C6A5 | Softer contrast, restrained scale seams |
| Membranes | Muted terracotta, approximately #B96843 | Subtle backlighting impression; controlled translucency appearance |
| Horns / claws | Aged ivory, approximately #CDBFA2 | Slightly harder highlights |
| Stored fire | Amber, approximately #F4B04B | Local throat/eye accents only; brighter during Surge |

These are art starting points, not a requirement to use the same hues for gameplay meaning. Accessibility palettes affect semantic cues independently.

## 3. Openly licensed asset research

The preferred final path is an original Cinder mesh made to the brief. A permissively licensed base can save setup time if it survives the comparison below. Modifying a downloaded texture alone is not the planned originality pass.

| Candidate | Verified information | Inspection / decision |
|---|---|---|
| [Cethiel's Dragon 3D, Drummyfish / Cethiel](https://opengameart.org/content/cethiels-dragon-3d) | Author page marks it CC0; describes a rigged, animated model with two textures; offers dragon_oga.zip | Main preview inspected. Long upright neck, pronounced plates, small folded wings, and angular forms do not meet Cinder's final silhouette. Evaluate as a rig/topology reference only; no asset imported during planning |
| [Quaternius Animated Monster Pack](https://quaternius.com/packs/animatedmonster.html) | Official pack page lists four animated monsters, FBX/OBJ/Blend formats, and CC0 | Backup animation/export study. Individual source models and rigs were not inspected; no promise that a specific model fits Cinder |

The Cethiel page says attribution is not required and suggests crediting Cethiel and Drummyfish if desired. If any of their asset data is used, include that credit and record the source anyway. The source page's stated license is the basis for this candidate assessment; verify the exact downloaded files before importing them.

### One-day base-asset evaluation

1. Download from the creator's linked source, preserving the original archive outside runtime assets.
2. Record source URL, creator, stated license, download date, SHA-256, and included license files.
3. Open the source file in Blender. Inspect topology at shoulder, elbow, wing fingers, neck, and tail; count deform bones and weights.
4. Play existing clips, looking for membrane collapse, detached joints, clipping, and asymmetric deformation.
5. Place the model in the actual game-camera viewer, with no decorative glow. Compare its proportions to Cinder.
6. Estimate the work to replace torso/head shape, enlarge and reshape wings, retopologize, repaint, reweight, and reanimate.
7. Keep the base only if that work is clearly less than creating the original mesh and the final result can match the brief. Otherwise retain the technical lessons and build Cinder from a fresh mesh.

A borrowed base that needs almost every vertex and clip rebuilt is not automatically a shortcut.

### Required originality work if a base is used

Replace the head silhouette and horn arrangement; rework neck length and curvature; rebuild chest and wing-root anatomy; redesign membrane outline and finger proportions; simplify/rearrange dorsal ridges; redesign the tail tip; author new UVs/material treatment as needed; rebuild flight poses and timing. Preserve useful topology or rig structure only where it supports those changes.

Do not reuse ripped franchise characters, Nintendo/Sega meshes, extracted animations, or unlicensed video/audio. No third-party boss assets are needed for this design.

## 4. Cinder production sequence

### A. Silhouette and anatomical blockout

1. Make side, front, rear, and three-quarter views from one consistent 3D blockout.
2. Establish torso, neck, head, tail, leg, and wing-root proportions before scales or textures.
3. Build the extended wing outline and the folded recovery pose. Check that fingers do not intersect the torso.
4. Review black silhouettes at approximately 128 px character height and at the planned game size.
5. Put that same blockout in the route camera. Solve its scale and framing now.

Deliverable: editable blockout file, simple GLB, four-view contact sheet, and a short rear-flight camera clip. A low-detail organic blockout is acceptable here; a collection of visible disconnected primitives is not an approved final mesh.

### B. Sculpt and retopology

1. Sculpt the chest/shoulder relationship, continuous neck transition, face planes, and tail taper.
2. Place medium-scale detail around the brow, horn roots, jaw, belly, and major scale groups.
3. Retopologize for deformation. Give shoulder, elbow, wrist, neck, and tail bends enough supporting loops.
4. Model wing membrane with a continuous surface supported by the finger bones. Avoid long skinny triangles across high-bend regions.
5. Use geometry for silhouette features; use normal/albedo detail for small scales.
6. Compare flat shaded and normally lit versions to catch bad normals before painting.

Deliverable: clean production mesh, reviewed topology, and LOD source variants.

### C. UV and materials

1. Use a stable UV layout with adequate padding and reduced stretching across the membranes.
2. Paint broad body color groups first; verify that they read without normal maps.
3. Bake restrained normal and occlusion information. Avoid dark baked seams that make the neck look segmented.
4. Use a main body material and a membrane material. Do not create a material per scale, claw, or wing finger.
5. Start with opaque/double-sided membranes and a controlled backlight approximation. Add transparency only if an actual visual need survives sorting and performance tests.
6. Check seams, mirrored details, roughness, and exposure under the game's bright sky and dark boss backgrounds.

### D. Rig and weight painting

Use explicit semantic bone names and a documented neutral pose. Initial target: at most **48 deform bones**, with no more than **four weights per vertex**.

Suggested allocation: root; three spine bones; two neck bones; head and jaw; six tail bones; eight wing bones per side; three bones per leg. This is 42 bones before any necessary small refinements.

Wing chains need shoulder, upper arm, forearm/wrist, and a modest set of finger controls. The shoulder leads the downstroke; the elbow and wrist follow, then the membrane shape settles. Bind the skin to the authored skeleton. Do not assign wing motion by an arbitrary “vertices beyond this X coordinate” rule.

Weight-paint and inspect:

- Full downstroke, upstroke, bank, and fold.
- A 360-degree body roll.
- Head aim across the entire allowed target plane.
- Hurt recoil with flight pose retained.
- Maximum tail bend and Surge recovery.

No shoulder collapse, membrane inversion, detached-looking neck, or tail snap is acceptable in the primary gameplay poses.

### E. Animation set

| Clip / layer | Initial duration or behavior | What must be visible |
|---|---|---|
| Glide | 2.0-second subtle loop | Breathing torso, tensioned wings, small tail motion |
| Cruise flap | 1.10-second loop | Strong downstroke, lighter folded recovery, slight torso response |
| Climb / acceleration flap | Approximately 0.80-second loop | More power from shoulders, not a faster rigid wing hinge |
| Bank left / right | Additive, driven by steering | Head leads; torso banks; outer/inner wing shapes differ naturally |
| Roll left / right | Exactly 0.50 seconds to match simulation | Wings tuck, body rotates, wings recover; no camera rotation |
| Breath | Additive jaw/neck/throat layer | Clear aim and fire without losing flight motion |
| Surge | 0.25-second preparation/release, 2.50-second total state | Chest compresses, flame releases, body stretches, flight returns smoothly |
| Hurt | Approximately 0.25 seconds | Brief recoil and recovery; no prolonged loss of steering |
| Victory exit | 2.0–4.0-second blend | A confident powered climb through the cleared opening |

Blend locomotion and additive layers deliberately. The animation system reads simulation state; it never advances the game clock or determines hit windows. A roll must occupy exactly its gameplay interval at 30, 60, and 120 display frames per second.

### F. Export and in-engine review

1. Apply consistent transforms and units; document the final forward/up axes.
2. Export GLB with the authored skin and named clips.
3. Validate the file and check missing textures, NaNs, negative scale issues, bounds, and animation tracks.
4. Load through a matching-version GLTFLoader. Preserve asset loading errors as visible development failures, not silent permanent placeholders.
5. Use explicit socket names for mouth, chest, wing tips, and tail tip.
6. Check material color space, normal orientation, and membrane culling.
7. Play every required clip in isolation and in the mixed flight state.
8. Record actual gameplay-camera footage on a working WebGL device.

Three.js's loader supports glTF 2.0 and animation clips; its documentation also calls out special disposal handling for image bitmaps. Use documentation matching the vendored release when implementing. [GLTFLoader documentation](https://threejs.org/docs/pages/GLTFLoader.html)

The planning environment currently has no Blender executable and could not run the game with WebGL. Implementation starts with a toolchain/asset spike to establish a working modeling, export, and real-device review path. A polished 3D character is a concrete work item, not a capability inferred from generating concept art.

## 5. The Stormwarden asset

Use a broad crescent body with dark flexible tissue and pale stone growths. Large fins and an inhaling carapace convey life. Three vanes and two seals are modeled as distinct, named components matching the encounter data.

Required states and clips:

- Dormant landmark pose.
- Wake/unfold.
- Idle flight with slow breathing.
- Vane aim and bolt release.
- Each vane's damage and break state.
- Carapace open/close.
- Seal break.
- Heart exposure and hit response.
- Beam inhale, release, and recovery.
- Defeat split and cleared exit.

The exposed heart uses a rounded, pulsating form. Closed protection uses an interlocking shape. The two states must differ in structure, not only in color.

Keep attack attachments bound to simulation-defined target anchors. The decorative body may move slowly, but a damaging beam must not drift away from its cue because an animation bone added an unmodeled offset.

Deliverable: original boss source, production GLB, stable component/socket names, material states, and clips. Test the heart opening at phone size before detailing the underside.

## 6. Environment kit and route composition

One environment kit supports all six route sections:

| Asset group | Initial set | Use |
|---|---|---|
| Aqueduct | Straight span, curved span, broad arch, broken arch, end cap | Establish a recognizable place with varied silhouettes |
| Islands | Three basalt island forms with separate top surfaces | Support structures and hide joins |
| Breakage | Two fractured ribs, one brittle plate, six debris pieces | Optional routes and Surge destruction |
| Gardens | Two planter forms, three root/foliage clusters | A softer middle section without new hazard vocabulary |
| Observatory | Landing ring, crescent supports, dormant boss attachment | Stage the reveal |
| Atmosphere | Sky gradient, distant cloud layers, two waterfall ribbons | Depth, speed, and scale |

Use instancing for repeated arches and debris; vary placement and break states intentionally. A procedural placement tool can assist authoring, but the shipping layout is checked-in course data.

Compose each section around one landmark and one readable line. Distant geometry is low contrast and cool; nearby hazards have clear value separation. Avoid placing the sun, a bright waterfall, and the next target in the same small screen region.

Use cheap sky and cloud layers first. Reflective water, screen-space god rays, dense transparent fog, and full-screen bloom are optional polish, not prerequisites. A shallow cloud sea is sufficient to sell altitude.

The camera follows a curved route, with broad turns, a rise through the sluice, and a descent through the gardens. The scenery and the player's bank need to agree on the direction of travel.

## 7. Effects and HUD

| Effect | Initial implementation | Limit / purpose |
|---|---|---|
| Ring collection | Small rim collapse and a brief local spark | Preserve view of the next ring |
| Perfect ring | Additional compact star-shaped pulse | Distinguishable in shape and sound |
| Near miss | Short edge streak on the passed surface | Confirm actual proximity |
| Parry | Directional flash and visible returned bolt | Show that defense became offense |
| Surge | Body stretch, flame cone/wake, sparse trails | Convey power without covering Cinder |
| Brittle break | A few pre-authored fragments and dust ribbon | Satisfying opening with predictable cost |
| Heart exposure | Material change, open brackets, localized light | Make vulnerability obvious |
| Beam | Opaque/controlled additive annulus with a clear safe center | Geometry and cue must agree |
| Damage | Brief torso flash and readable health change | No long red full-screen overlay |

Keep essential cues in a render layer that remains visible when decorative particles or postprocessing are reduced. A quality setting must never remove a telegraph.

HUD: three health marks near the upper-left, score and current flight chain near the upper-right, compact charge around the Surge action, and a pause action. Boss entry replaces the flight-chain emphasis with a segmented boss-health display and the current target cue. Avoid a large explanatory panel over combat.

Default touch buttons stay outside the immediate aim region, respect safe-area insets, and have clear pressed, cooldown, ready, and unavailable states. Review both handedness layouts.

## 8. Audio production

Create one small coherent sound palette rather than assembling unrelated loud effects.

| Group | Required assets / behavior |
|---|---|
| Cinder | Two wingbeat variations, light breath loop, Surge preparation/release, short hurt reaction |
| Flight | Wind layers for cruise and Surge; ring and perfect-ring sounds; near-miss cue |
| Defense | Emitter wind-up, bolt launch, ordinary deflection, perfect parry |
| World | Brittle stone crack/break; subtle waterfall/air ambience |
| Boss | Wake motif, vane break, seal break, heart opening, heart impacts, beam inhale/release/tail, defeat |
| Interface | Start, retry, pause, result confirmation |
| Music | One route cue with a few intensity stems and a related boss section |

Attack warnings take priority over reward sounds. Duck music briefly for the beam preparation and heart opening. Use a limiter and a measured loudness pass; do not solve impact by making every effect louder.

Audio scheduling consumes simulation events with stable IDs. Pause stops future scheduling; restart does not replay old queued sounds. Unlock audio on the user's start action and make the entire game understandable when muted.

For implementation, preserve suitable ideas from Reforged's event-driven audio, limiting, and music transitions after checking their dependencies. Do not import its entire audio catalog or mixed asset provenance automatically.

## 9. Asset and render budgets

These are starting budgets, to be measured on the selected devices. A triangle budget alone does not guarantee frame rate.

| Item | Initial target |
|---|---|
| Cinder LOD0 | 25–35k triangles, maximum 40k; up to 48 deform bones; two primary materials |
| Cinder lower LODs | Approximately 12k and 5k triangles; preserve wing and head silhouette |
| Cinder textures | One 2k base-color and one 2k normal atlas, with smaller packed roughness/occlusion where useful; lower-resolution mobile variant |
| Cinder runtime transfer | Aim for at most 2.5 MB, including required textures after measured compression |
| Stormwarden | Approximately 30–45k triangles, at most four principal material groups |
| Visible environment | Approximately 80–120k triangles in the dense route section |
| Total visible scene | Aim below 220k triangles and 90 draw calls at the standard quality tier |
| Estimated decoded texture footprint | Aim below 96 MiB across the active scene; measure formats/mipmaps explicitly |
| Decorative particles | Start with 160 live route / 240 live boss particles; fixed pools |
| Required first-control transfer | At most 4 MB compressed |
| Whole-slice runtime transfer | At most 12 MB compressed; preload boss assets during the route |

Start with ordinary GLB and images to establish correctness, then evaluate geometry and texture compression with the exact loader version. Include decoder cost in loading measurements. Do not claim that a source ZIP's size equals runtime GPU memory.

Quality reductions, in order: lower rendering resolution; reduce decorative particle density; reduce cloud/water detail; reduce expensive postprocessing; switch texture/mesh LODs. Preserve simulation rate, target shapes, telegraphs, and hit feedback.

## 10. Deliverables and visual acceptance

Production artifacts will live under skybreak/art/source/, skybreak/assets/, and skybreak/tools/. Source files are excluded from any future runtime deployment package.

The hero is ready only after:

1. A rear gameplay view, bank, roll, and Surge clip look like the same well-built creature.
2. Wing roots remain attached and membranes do not invert or crumple.
3. The head leads turns, the tail follows, and the torso participates in the wingbeat.
4. The silhouette reads on a 390 px-wide phone and against both bright sky and dark boss.
5. It fits the measured render budget with essential cues visible.
6. The owner judges the moving result to be a substantial improvement.

If it fails those checks, return to mesh or animation work. Do not conceal defects with glow, particles, speed blur, or a distant camera.

### Concept prompt retained for future art work

The planning image used the built-in image generator, with no existing dragon image supplied as an input. Its core brief was:

> Original creature design board for Cinder, a powerful agile western dragon with four legs and two large membrane wings; deep compact muscular chest, natural wing roots, moderately long mobile neck, strong tapered snout, expressive brow, two swept ivory horns, restrained dorsal ridges, and a flexible spade-tipped tail. Slate blue-gray scales, ivory underside, muted terracotta membranes, small amber throat glow. Show a three-quarter full body, rear flight pose, and head study with consistent anatomy. Sculptural stylized naturalism, broad readable forms, believable wing tension, soft studio lighting, restrained detail. Avoid mechanical blades, stacked armor, permanent glow, franchise imitation, and toy proportions.

Treat that as an art direction brief, not an orthographic modeling sheet. The first 3D blockout must resolve anatomy consistently even where a concept view leaves it ambiguous.
