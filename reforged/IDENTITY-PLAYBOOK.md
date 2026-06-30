# Dragon Drift — Identity Playbook (the "make it elegant" guide)

> **What this is.** The aesthetic companion to [`MODEL-CREATION.md`](./MODEL-CREATION.md).
> That doc tells you *how to build a creature in this engine* (modules, dials, lofts, the
> grammar). **This doc tells you how to make it not ugly** — the house style for a fresh,
> elegant roster, reverse-engineered from the one creature everyone agrees reads as
> beautiful: **Phoenix Ascendant**.
>
> **The brief that created this file:** "Phoenix was my best creation. I hate the style the
> wings are drawn and the bodies of the other dragons are uninspired and ugly. Start fresh and
> use Phoenix as the reference for how to create fresh-looking dragons that look aesthetic."
>
> So: Phoenix is the **north star**. Every rule below is "do what Phoenix does, stop doing what
> the membrane/hull dragons do." Read [`docs/dragon-redesign.md`](../docs/dragon-redesign.md)
> and LEAPFROG's Phoenix lessons for the deeper architecture; this is the *look* layer.

---

## 0. The test that settles every argument: the rear silhouette

The player sees the dragon **from behind, slightly above, in flight** (chase cam). So the only
view that matters for "is it beautiful" is the **rear silhouette in a flap pose**. We can render
that headlessly, in black-on-white, no color, no excuses:

```
cd reforged && node tools/silhouette.mjs <key> rear        # the whole creature
                node tools/silhouette.mjs <key> rear --no-wings   # the body alone
                node tools/silhouette.mjs <key> threeq    # the bank/shop 3/4 angle
```

Render the current roster and look. The verdict is not subtle:

| Creature | Wing read | Body read | Verdict |
|---|---|---|---|
| **Phoenix** (`avian`/`feather`/`plume`) | broad wings that **arc UP** like a spreading firebird; detail in the feathered edge | defined avian mass + layered plume tail + crown | **elegant — the target** |
| **Pearl** (`seraphHull`/`seraphWing`) | shaped, slight upsweep, crowned | sculpted hourglass (`loftEllipse`) | good — the other proof it can be done |
| **Obsidian** (`unifiedHull` membrane) | flat wings that **droop** at the tips like wet laundry | thin vertical stalk + a blobby teardrop tail | limp, lifeless |
| **Ember** (`membrane`) | angular **kite-frame** — you can see the strut/finger skeleton poking through | shared blade-tube | reads as a paper kite / dead leaf |
| **Cinderwing / Tidewing / Cragmaw** (`hullWings`) | small, ragged, thin bat membranes | shared hull-tube | weak, insubstantial |
| **Astral Wyrm** (`sideFins`) | ~no wing read | featureless lump | a blob from the rear |

**Two findings fall straight out of this, and they are exactly the two complaints:**

1. **The wings.** Phoenix's wings are **arched continuous surfaces whose detail lives in the
   silhouette edge.** The ugly dragons' wings are **flat membranes stretched on a visible bone
   frame** — and they **sag down** instead of lifting up. *Different vocabulary, not different
   tuning.*
2. **The bodies.** Phoenix has a **bespoke sculpted body** (egg + breast + a glowing heart-core).
   Almost every other dragon shares **one generic lofted blade-tube** (`ARROW_PROFILE` in
   `dragonTorso.js`) with **bolted-on sphere fairings** at the shoulders and a **sphere-chain
   neck**. They're all the same body in different paint. That's the "uninspired."

The rest of this doc is how to never ship either of those again.

---

## 1. The five laws of an elegant creature (each tied to a mechanism)

These are harvested from Phoenix's `buildAvianTorso` + `buildFeatherWings`
(`dragonTorso.js` / `dragonWings.js`) and Pearl's `seraphHull`.

1. **Arc up, never sag.** The wing's gesture is a **positive parabolic upsweep** — the tips
   rise above the shoulder line. Mechanism: `archUp(geo, span, rise)`. A wing whose tips fall
   below the root reads as tired/dying, every time.
2. **Imply detail at the edge; never expose the skeleton.** Feathers/scallops are the
   **notched trailing edge of a continuous surface**, not protruding struts or finger-bones.
   Mechanism: a `THREE.Shape` with an alternating-depth notch loop → `ShapeGeometry`. At most
   **one** clean glowing leading-edge accent, and only on elite forms.
3. **Color is a gradient, dull→vivid, root→tip.** No flat-fill wings. Mechanism:
   `webGradient(geo, cInner, cOuter)` (spanwise) and `featherGradient(geo, base, tip)`
   (per-feather), `vertexColors:true`. The base is desaturated; the *tip* is where the light is.
4. **Grow limbs from the body; never bolt them on.** No metallic shoulder ball, no fairing
   blob sitting on the skin. Mechanism: either a continuous body-material join (the
   `skinnedMembraneBridge` deltoid / `unifiedHull` weld) or, like Phoenix, a small shoulder
   sphere **painted in the body material** tucked under the wing root — never a chrome joint.
5. **Give the eye a focal point.** Phoenix has a white-hot **heart-core** that the whole design
   orbits. A creature with no bright anchor reads as a flat cutout. Mechanism: an emissive core
   mesh + an additive `coreGlow` sprite on `layers.set(1)` (the bloom layer), tagged into
   `spineMats` so Surge blazes it.

If a creature obeys all five, it will read as elegant *before you have touched the color*.

---

## 2. WINGS — the house style (this is the big one)

### 2a. What the ugly wings do (stop doing this)

`buildMembraneWings` (`dragonWings.js`) is a **bat membrane on a kite frame**. Read the file and
its own comments — it is a five-year war against its own vocabulary: "*bolted metallic shoulder
sphere*," "*spokes*," "*kite frame*," "*janky doubled membrane at the wrist*," "*frozen-body
seam*." Every fix (curved → skinned → bridge) is patching the fact that the base shape is **a
flat clipped `ShapeGeometry` sheet** (`buildWingShape`) **with the arm-bone and finger-struts
drawn as actual cylinders** (`wingStrut`). From the rear cam that reads as a **clipped triangle
with a visible skeleton**, and because the bow (`archWing`) is shallow, the tips **droop flat**.

That is the style you hate, and you are right to. **Do not author new dragons on the bare
`membrane` recipe.** (It stays for the legacy roster, byte-identical, behind the registry.)

### 2b. What Phoenix does (do this)

`buildFeatherWings` builds **two arched, notched, gradient-shaded surfaces** and **nothing that
looks like a frame**:

- **Inner web** (shoulder→wrist): a `THREE.Shape` with a **scalloped trailing edge**, turned to
  `ShapeGeometry`, then `archUp(webGeo, innerSpan, rise*0.5)` so it **bows upward**, then
  `webGradient(webGeo, cIn, cOut)`. Broad overlapping **secondary feathers** (`featherGeo` +
  `featherGradient`) are laid *over* the web — surface on surface, no gaps.
- **Outer web** (wrist→tip): a second `THREE.Shape` whose **trailing edge alternates a deep notch
  and a shallow one** (`notch = (k%2 ? 0.02 : 0.2)*ws`) — **the notches ARE the primary feather
  tips.** `archUp` again (more rise), `webGradient(cOut, cHi)` so the tips go white-hot.
- The whole wing is **strongly upswept** (`rise = (1.0 + F*0.28)*ws`) and swept back
  (`back`), so it arcs like a bird opening its wings — the positive gesture from Law 1.
- **One** glowing leading-edge accent bone (`edgeMat`), **elite forms only** (`F >= 2`). That is
  the *entire* skeleton you are allowed to show.

### 2c. The wing rules for any new dragon (feathered OR membrane)

The Phoenix treatment is **not feather-only** — it's a way of drawing *any* wing. Even a
bat/dragon membrane should follow it:

1. **Build the wing as a continuous arched surface**, not a flat clipped sheet. If you want a
   dragon membrane, use `curvedMembrane`/`skinnedMembrane` (the bowed grid) as the *floor*, and
   push the **arc hard** — `wingForms[].arc { bow, hump, hook }` with a real upward `bow` and a
   `hook` at the tip so it lifts, not droops.
2. **Detail belongs in the silhouette edge.** Sculpt the trailing edge into scallops/notches/a
   finger-hook in the `wingForms[].tips` planform (or a `THREE.Shape` for a bespoke wing). The
   eye reads the *outline*; give the outline something to read. **Never** add cylinder struts or
   veins that protrude past the membrane — at gameplay distance they become wires.
3. **Gradient every wing.** `applyWingGradient(geo, def, t0, t1)` for membranes,
   `webGradient`/`featherGradient` for surfaces. Dull desaturated **root** → vivid bright **tip**.
   A single-color wing always looks cheap.
4. **Kill the chrome shoulder.** New dragons use `skinnedMembraneBridge` (grows a body-material
   deltoid) or a bespoke body-material root like Phoenix's. The bare metallic `armMat` sphere is
   an anti-pattern.
5. **Upsweep is the default, droop is a bug.** If `node tools/silhouette.mjs <key> rear` shows
   tips *below* the wing root, raise `arc.bow` / `rise` until they clear it.

### 2d. When to author a NEW wing builder

If the concept is genuinely a different wing *kind* (insectile, crystalline vanes, ribbon-of-
light, layered scales), write a new builder and `registerWings('myWing', …)`. Follow the Phoenix
file as the template: own your `wingMat`, return the **exact rig handles**
(`{ group, parts:{wingPivotL/R, wingTipL/R, tipMarkerL/R, wingPivot2L/R}, wingMat, spineMats }`),
mount via `attach.wingRoot(side)`, key counts/rise off `F = model.formLevel`. Then **the next
dragon inherits it for free** — that's the whole point of the registry (`CREATURES.md`: *author
the blueprint, never the builders* — but a genuinely new *kind* earns a new builder).

---

## 3. BODIES — stop shipping one blade-tube in twelve paint jobs

### 3a. The problem

`buildTorso(ARROW_PROFILE, …)` is the body for **azure, ember, jade, obsidian, pearl(no—pearl
is seraphHull), solar** and the `hullTorso` starters are a near-cousin. They are **the same 8
cross-sections** (`ARROW_PROFILE.stations`) — neck cap, shoulder peak, waist, hips, tail root —
lofted through the same `bladeRing` (keel-on-top, rounded belly). Per-dragon, the silhouette
**barely changes**, because the rings don't. Then we bolt on:

- **sphere fairings** at each wing root (`new SphereGeometry(fr.r)`) — the "blobby shoulders,"
- a **sphere-chain neck** (`neckSegments` lerped spheres) — the "string of pearls neck,"
- a generic tail.

Functional, shared, cheap — and **uninspired**, exactly as you said. From the rear-no-wings view
they're all a thin vertical lozenge with a teardrop.

### 3b. The fix — sculpt the silhouette, per creature

We already have the elegant path; it's just underused. **Two routes**, pick per dragon:

**Route A — sculpted loft rings (the cheap, big win).** Author the body as a **cross-section ring
list** with a real chest/waist/hip, like Pearl's `seraphHull` (`loftEllipse([{z, rx, ry}])`):

```js
loftEllipse([
  { z:-1.00, rx:0.06, ry:0.07 },  // nose cap
  { z:-0.45, rx:0.56, ry:0.66 },  // BARREL CHEST (round, tall)
  { z:-0.06, rx:0.60, ry:0.66 },  // shoulder / wing root
  { z: 0.50, rx:0.24, ry:0.38 },  // PINCHED WAIST  ← this pinch is what makes it read as alive
  { z: 0.74, rx:0.37, ry:0.37 },  // HIP flare
  { z: 1.08, rx:0.05, ry:0.06 },  // tail cap
])
```

Editing the ring list **is** sculpting the body (`MODEL-CREATION.md §6a`). A chest→waist→hip
S-curve is the single biggest "this body has character" lever. LEAPFROG already proved this on
Pearl ("*the body WAS always sculptable; proved + shipped an hourglass on Pearl*"). Most of the
roster simply never used it.

> **Engine upgrade worth doing first (optional):** promote chest/waist/hip to `model` dials
> (`chestScale`/`waistScale`/`hipScale`), the way `wingChordScale` was added, so a dragon dials
> its silhouette from `dragons.js` with no builder edit. `MODEL-CREATION.md §9.1` calls this "the
> single biggest give-the-body-more-shape unlock." If you're starting a *fresh roster*, build this
> dial once and every new dragon benefits.

**Route B — bespoke body, like Phoenix.** When the creature is a different *animal* (firebird,
seraph, leviathan), write a torso builder and `registerTorso`. Phoenix's `buildAvianTorso` is the
template: a few **intentional sculpted masses** (egg body, breast swell), a **focal glow**
(heart-core), a **signature back read** (the raked feather crown replaces a dorsal spine), and a
**short, characterful neck** (2 spheres, not a 5-sphere chain). Return
`{ group, attach, mats, coreGlow, spineMats }` and mount everything via the attach contract.

### 3c. Body rules for any new dragon

1. **No two dragons share a silhouette.** If a new dragon would reuse `ARROW_PROFILE` unchanged,
   give it its own ring list (Route A) or its own builder (Route B). The rear-no-wings silhouette
   must be recognizable as *that* dragon.
2. **Pinch the waist, flare a shoulder or hip.** A monotone tube is the ugliness. One clear
   narrowing + one clear broadening turns a lozenge into a creature.
3. **Hide the joints.** Prefer the continuous join (`unifiedHull` / bridge) or body-material
   masses over chrome fairing spheres. If you must keep a fairing, paint it `bodyMat`, not `horn`.
4. **Replace the sphere-neck with intent.** Either a short bespoke neck (Phoenix: 2 spheres) or a
   continuous hull neck (`opts.neck:false` + a grown extension). The lerped-sphere chain is a
   placeholder, not a look.
5. **Give it a focal glow** (Law 5) — a core, a gorget, a brand. Somewhere bright the eye rests.

---

## 4. COLOR & FORMS — the dull→vivid arc

Identity isn't just shape; it's the **maturation arc**. Phoenix ships four forms that go
**charcoal-ember hatchling → white-gold celestial** — the body literally lightens from
`0x2a1712` to `0xeee2c6` while feathers climb to gold/ivory, and at the apex the *old dominant
hue is demoted to an emissive support role* so white-gold reads clean.

Rules:
- **`forms[0..3]` change the SILHOUETTE, not just the color** — bigger wing form, longer tail,
  more crown, more feather count (everything keys off `F = model.formLevel`, stamped by
  `ascension.js`). If two forms read identical as a black silhouette, the progression failed.
- **Palette ramps dull/desaturated base → vivid/light apex.** The tip is where the light is.
- **At the apex, demote the previous dominant** to emissive support so the hero hue dominates
  (Phoenix demotes orange; a frost dragon would demote mid-blue to let white-cyan dominate).
- **Legendaries must read as opposites.** Phoenix is solar white-gold; the Sovereign was pushed
  midnight-indigo/eclipse specifically so they don't compete. When you add a peer, pick the
  opposite axis (warm/cool, radiant/dark, smooth/jagged) on purpose.

---

## 5. SURGE — transform the creature, not the screen

The super-state is part of identity. The machinery is already shared and data-driven — set the
fields, don't write code:

- `feverWing` / `feverEye` — the creature's ignition color (Phoenix white-gold, not the default
  magenta). `surgeHi` — what the tagged `spineMats` accents lerp toward.
- `feverWash` — the screen tint hue, fed to `postfx` `liftTint` via `setFeverTint()`. Keep it
  **subtle** (Phoenix trimmed it ~27%) so rings/hazards stay readable. Omit it on ordinary
  dragons so the magenta fallback never fires by accident.
- `hasStyle: true` — keep the creature's own trail color through Surge.
- `surgeMotes: true` (Surge-only) or `archetype` (always-on) — signature particles from the
  shared white-texture mote pool, **tinted per dragon**, drifting up+back off the centre lane.
- A tagged `coreGlow` so the focal point **blazes** on Surge.

The thesis: in Surge the **body** ignites and sheds its signature particles; the screen barely
shifts. That's what made Phoenix's "Rebirth" feel premium instead of a pink flash.

---

## 6. THE FRESH-DRAGON RECIPE (the loop to actually execute)

1. **Concept the rear silhouette first.** Sketch (or trace via `tools/tracer.html`) the
   **back-view outline** — body S-curve, wing arc, tail. If it doesn't differ from an existing
   dragon's outline, it's a reskin; change the shape, not the paint.
2. **Pick the body route.** Route A (sculpted `loftEllipse` rings) for a dragon variant; Route B
   (bespoke `registerTorso`) for a new animal. Pinch a waist, flare a shoulder/hip, add a focal
   glow.
3. **Pick the wing treatment.** Arched continuous surface, detail in the edge, hard upsweep,
   gradient, no chrome shoulder, no protruding struts. New *kind* → new `registerWings` builder
   on the Phoenix template.
4. **Author the blueprint in `dragons.js`** — `parts`, `model` dials (grammar-legal only, see
   `MODEL-CREATION.md §5`), the cross-section ring list, `surfaceLayers`, and **4 forms** with a
   dull→vivid arc.
5. **Wire Surge** — `feverWing`/`feverEye`/`surgeHi`/`feverWash`/`hasStyle`/`surgeMotes` + a
   tagged core.
6. **Run the loop:**
   ```
   node tests/blueprint.mjs              # grammar valid (no typos/bad builders/out-of-range)
   node tools/silhouette.mjs <key> rear  # the verdict view — arc up? body shaped? edge detail?
   node tools/silhouette.mjs <key> rear --no-wings   # body alone — is it more than a tube?
   node tools/silhouette.mjs <key> threeq            # the bank/shop angle
   node tools/tricount.mjs               # within the per-form triangle budget (60fps mobile)
   node tests/flapcheck.mjs              # flap cycle continuity
   ```
   Read the silhouette against the laws in §1. Iterate the rings/arc/forms until it passes.
7. **Human judges color/material/motion on the live PR preview** — the silhouette tool is
   shape-only (it can't see gold rims, glow, or motion). Ship to preview, get the look call.

### Verification gates (all must pass before "done")
- `tests/blueprint.mjs` green · `tricount` within budget · `flapcheck` continuous ·
  rear silhouette obeys §1 (arc up, edge detail, shaped body, focal glow) · peer-contrast checked
  against the nearest-rarity sibling · human look-approval on the preview.

---

## 7. A fresh-dragon blueprint template (fill this in)

```js
frostwyrm: {                                  // ← a worked shape, not a real entry
  name: 'Frost Wyrm', rarity: 'SSR', cost: 5000,
  stats: { speed: 1.0, handling: 1.1, drain: 1.0, regen: 1.0 },

  // 1) RECIPE — a sculpted body + an arched, edge-detailed wing (NOT bare 'membrane').
  parts: {
    torso: 'seraphHull',        // Route A: sculpted loft rings (or a new registerTorso)
    wings: 'skinnedMembraneBridge', // bowed, grows from the body — no chrome shoulder
    head:  'horned', tail: 'clean',
    surfaceLayers: ['spineGlow', { type: 'glowSeams' }],
  },

  // 2) DIALS — push the arc, give the body shape.
  model: {
    scale: 1.0, wingScale: 1.05, wingChordScale: 1.25,
    wingBillow: 0.18,                 // chord cup — a fuller, less flat membrane
    shoulderWidthScale: 1.15,         // proud shoulders support the wing root
    flapBias: 0.95, flapAmp: 0.9,
    bodyMetalness: 0.05, bodyRoughness: 0.55,
  },

  // 3) COLORS — dull base, vivid tip; gradient-ready slots.
  body: 0x12305a, eye: 0xBFE9FF,
  wingInner: 0x123a66, wingOuter: 0x6fc7ff, wingEmissive: 0xBFE9FF, horn: 0xE8F6FF,

  // 4) FORMS — silhouette grows + palette ramps dull→white-cyan; demote mid-blue at apex.
  forms: [
    { wingForm: 0, tailStyle: 'simple', spineGlow: 0,    scale: 0.46, colors: { body: 0x0c1e3a } },
    { wingForm: 1, tailStyle: 'finned', spineGlow: 0.35, scale: 0.68, colors: { body: 0x123056 } },
    { wingForm: 2, tailStyle: 'blade',  spineGlow: 0.7,  scale: 0.85, colors: { body: 0x1c4a82, wingOuter: 0x9fdcff } },
    { wingForm: 3, tailStyle: 'comet',  spineGlow: 1.0,  scale: 1.0,  colors: { body: 0xDCEFFF, wingOuter: 0xEAF8FF } },
  ],

  // 5) WING SILHOUETTE per form — UPSWEPT arc + a scalloped edge (the part that reads).
  wingForms: [ { tips:[[5.4,0.4],[3.9,0.9],[2.4,1.0]], lead:[5.6,1.2], scallop:0.26, arc:{ bow:0.9, hump:0.3, hook:0.5 } }, /* … */ ],

  // 6) SURGE — ignite the creature, tint the screen a touch, shed signature motes.
  feverWing: 0x9fdcff, feverEye: 0xEAF8FF, surgeHi: 0xEAF8FF,
  feverWash: [0.03, 0.06, 0.11], hasStyle: true, surgeMotes: true,
  coreGlow: 0xCFEeffff,   // a focal glow the eye rests on (Law 5)
}
```

The numbers are illustrative — **the discipline is the point**: sculpted body, arched edge-
detailed wing, gradient, dull→vivid forms, creature-transform Surge, verified on the rear
silhouette.

---

## 8. Pitfalls (each one is visible in the current roster)

- **Flat clipped membrane on visible struts** → reads as a kite/dead leaf. Use an arched surface;
  bury or delete the struts; put detail in the edge.
- **Drooping wing tips** → looks tired. Bow up (`archUp` / `arc.bow` / `arc.hook`) until the tips
  clear the root in the rear silhouette.
- **One shared blade-tube body** → twelve dragons, one silhouette. Sculpt per-creature rings or a
  bespoke torso; pinch a waist.
- **Chrome shoulder ball + sphere-chain neck** → "bolted-on, blobby." Grow from the body; paint
  joins in `bodyMat`; replace the neck chain with intent.
- **Flat-fill wing color** → cheap. Always gradient, dull root → vivid tip.
- **Forms that only recolor** → no sense of growth. Change the silhouette per form.
- **Magenta Surge flash on a new dragon** → you forgot `feverWing`/`feverWash`. Set them, or the
  default fires.
- **Judging by a beauty render** → the chase cam is rear/above. Judge the **rear** silhouette;
  the human judges color/motion on the **live preview**.

---

*Keep this current as the roster grows. When a new dragon teaches a new elegance rule, add it here
and append the lesson to `LEAPFROG.md` — `leapfrog^leapfrog`.*
