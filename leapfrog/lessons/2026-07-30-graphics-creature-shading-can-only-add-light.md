# A surface shader that can only ADD light can never make a creature look solid — and r160's `Material.clone()` was silently deleting the one patch we had

**Date:** 2026-07-30
**Area:** graphics / creature surface (N18)
**Ships as:** `CREATURE SHADING` Settings toggle + `?dsurf`, default OFF (exact identity)

---

## What prompted it

The owner asked, comparing Dragon Drift to a screenshot of an AI-built Call of Duty
clone: *"how are their graphics so good, whereas my dragons still look unbelievable
and poor looking?"*

The comparison turned out to be less flattering to the reference than it looked
(that project scores itself **5.05/10** against real CoD and every blind critic
picked the real frame), but the question was still the right one, and answering it
honestly meant auditing our own creature surface. Two findings, one of them a live
bug that has been shipping the whole time.

## Finding 1 — every surface patch we own is ADDITIVE

`dragonSurfaceShader.js` splices after `<emissivemap_fragment>`, and every patch
does exactly one of two things:

```glsl
totalEmissiveRadiance += ...   // rim, iridescence, membraneSSS, scale sheen
roughnessFactor = clamp(...)   // scale roughness
```

`cellularScalesNormal` additionally perturbs `normal`. **Not one patch could make
any pixel darker than the un-patched material.**

That is a structural ceiling, not a tuning problem. Detail is mostly *darkness*:

- What reads as scales on a real animal is the thin dark line in every crevice.
  A perturbed normal says "this facet tilts"; it cannot say "less light reaches
  the bottom of this groove." Only occlusion can, and we had no occlusion term.
- What reads as a solid body is the belly being dimmer than the back. A creature
  lit evenly from every direction reads as a lit toy no matter how good the
  silhouette is.

So the only lever available to any past tuning pass was *more glow*, which is
precisely the "LED-strip glow over flat-black poverty" failure `DRAGON-DESIGN.md`
names on sight. **The doc knew the symptom; the shader seam made it unavoidable.**

`N15` had already solved exactly this for the world (baked prop AO — *"the #1 fix
for toy-like props"*, SHIP 8/10). Creatures never got the same treatment.

## Finding 2 — `Material.clone()` silently deletes surface patches (r160)

`dragonTorso.js:150` was `const torsoMat = bodyMat.clone();`, with a comment at
`dragonModel.js:145` claiming the rim is applied *"before the torso clones bodyMat,
so the DoubleSide torso + every body sphere/cone inherit it."*

**That claim is false in r160.** Verified against the vendored source: `Material.copy`
copies a fixed property list and **neither `onBeforeCompile` nor
`customProgramCacheKey` is in it.** A cloned material's `onBeforeCompile` falls back
to `Material.prototype`'s empty no-op. Proven directly:

```
original has own onBeforeCompile: true  | cacheKey: surf:rim
CLONE    has own onBeforeCompile: false | cacheKey: "onBeforeCompile( ... ) {}"
CLONE spliced uRimColor into fragment?  false
```

So on **every dragon built through `buildTorso`** — which is most of the roster,
including the graphics hero Azure — the largest mesh on the creature has been
rendering as a plain `MeshStandardMaterial`: no fresnel rim, no blueprint surface
patches. Nothing reported an error.

**And the damage is patchy, which is worse than uniform.** Whether a mesh kept its
rim came down to whether its call site happened to clone:

| uses `bodyMat` **directly** — rim survives | **clones** it — rim silently dropped |
|---|---|
| `dragonDraconicHead.js:68` (skull), `:306` (snout, non-keen path) | `dragonDraconicHead.js:195`, `:259` (head shells), `:305` (keen snout), `:958` (ear flap) |
| `dragonTorso.js:274` (root mesh) | `dragonTorso.js:150` (**the torso loft** — the biggest mesh on the dragon) |
| `dragonJadeSerpent.js:334`, `dragonKoiSerpent.js:327` (serpent bodies) | `dragonJadeSerpent.js:343` (head body), `dragonFaceted.js` ×9 |

So a single dragon has been rendering with its skull and root rimmed and its
torso, head shells and snout not — inconsistent shading *within one creature*,
which reads as "cheap" far more loudly than a uniformly missing rim would.

This pass fixes **only `dragonTorso.js:150`** — hero-first, per the repo law
(coexist → prove on a hero → migrate). The table above is the migration list for
after owner sign-off; every entry is the same one-word change to `cloneComposed`.

This is the **same r160 trap the Skyforged markers hit from the uniform side**
(N17/PR-3 Gate 2: *"NO `material.clone()` — r160 `Material.copy` JSON-kills the
uniform refs → factory-per-instance"*). That lesson was learned on markers and
never propagated to creatures. **A trap logged against one subsystem is not
logged against the codebase.**

## What we built (N18)

Both halves, behind **one** shared uniform and one Settings switch.

1. **`bellyAOPatch`** — object-space down-facing occlusion. A dragon flies under a
   bright sky over a dark sea, so every down-facing surface (belly, under-jaw,
   under-wing, the underside of each tail segment) is genuinely the darkest part of
   the animal before any shadow map exists. One dot product.
2. **A cavity term on `cellularScalesNormal`** — reuses the height field the relief
   already computes (`_scH`: 1 at a raised scale centre, 0 in the seam) to darken
   the crevices the normal perturbation could only tilt.
3. **`cloneComposed`** — clone, then re-apply the recorded patch stack (tracked in a
   module `WeakMap`, *not* `userData`, which `Material.copy` JSON-round-trips).

## The reusable patterns

**Multiply `diffuseColor.rgb`, don't add to emissive.** The
`<emissivemap_fragment>` seam still has `diffuseColor` live —
`<lights_physical_fragment>` consumes it *after* us — so a multiply there flows
through real lighting instead of being painted on top of it. Verified in the
vendored include order. This makes the existing seam capable of subtraction with
no new seam, no new pass, no per-frame cost.

**Object space for anatomy, view space for sparkle.** `objectNormal` is available
at the `<begin_vertex>` splice and r160 has already run it through
`<skinnormal_vertex>` — so the belly stays the belly as the tail coils. Our
existing patches are all view-space (fresnel family), which is right for a glint
and wrong for anatomy: a view-space belly term would slide around the body as the
camera swings.

**Shared uniforms must be assigned BY REFERENCE.** `composeSurface` wrapped every
patch uniform in a fresh `{ value }`, which snapshots at compile time — a live
toggle threaded that way silently does nothing. Added a `sharedUniforms` channel
that assigns the JS object itself, so one switch drives every compiled material.
The test asserts object identity, because this failure mode is invisible.

**Gate a whole spliced block by snapshot-and-`mix`.** To restore patches onto a
clone that has never had them without changing the shipped look, snapshot the four
mutable values before the block and `mix` back after:

```glsl
vec3 _sgE0 = totalEmissiveRadiance; float _sgR0 = roughnessFactor;
vec3 _sgN0 = normal; vec3 _sgD0 = diffuseColor.rgb;
/* ...patch bodies... */
totalEmissiveRadiance = mix(_sgE0, totalEmissiveRadiance, uSurfGate);
/* ...and the other three... */
```

`mix(a,b,0)` is `a*1.0 + b*0.0` — exactly `a`. This is the block-level analogue of
N15's `mix(1.0, vAO, 0)` attribute identity and N10b's mix-factor-domain gate: it
gives free IEEE-exact identity for an *arbitrary* patch stack, so a fix can ship
dark and be judged live instead of needing a rebuild or a second program path.

## The gotcha to not relearn

**A comment asserting a framework behaviour is not evidence of it.** The claim that
the torso inherits the rim sat in the code, was plausible, described intent
accurately, and was wrong — and because the failure mode is a *silent fallback to a
no-op*, nothing ever contradicted it. Three checks would have caught it and none
were expensive: does the framework's `copy()` list include this property; does the
clone still have it as an *own* property; does the clone actually splice.

The corollary for our gates: `tests/surfaceshader.mjs` was green throughout,
because it only ever tested `composeSurface` on materials it composed itself. **A
test that exercises the happy path of a helper says nothing about the call sites.**
The new `tests/creatureao.mjs` asserts the trap explicitly (`plain .clone() DROPS
the patches`) so it can never silently return.

## What it unlocks

- The creature surface can now express **occlusion**, which is the prerequisite for
  every "does it look solid" note the roster has ever received. Tuning passes are
  no longer restricted to adding glow.
- The rim the blueprints have been asking for since L4 actually reaches the torso.
- `bellyAO` is a blueprint name, so the roster migrates by declaration.
- A cheap self-shadow **stand-in** exists, which was the honest alternative to real
  shadow maps: N6 deliberately rejected three.js shadow mapping, and enabling
  `renderer.shadowMap` for one caster would still re-key **every** lit material's
  program (483 `MeshStandardMaterial`s) — a boot-hitch and permanent cost on a
  fill-bound mobile target, for a term AO approximates at zero per-frame cost.
  If true self-shadowing is ever revisited, that blast radius is the thing to price.

## Status

Default **OFF** — this is a look change to the whole roster's largest surface and
the owner judges it on the preview. `?dsurf=1` is the deterministic A/B.
`tests/creatureao.mjs` 26/26, `tests/surfaceshader.mjs` 9/9, `tricount` 0 over
budget (shader-only, no geometry).

**Not yet run: the `GRAPHICS-OVERHAUL.md` Fable Quality Gates 1 and 2**, which that
doc makes mandatory and blocking for merge. They were skipped because the session
was configured without sub-agent spawning, not because they don't apply.
