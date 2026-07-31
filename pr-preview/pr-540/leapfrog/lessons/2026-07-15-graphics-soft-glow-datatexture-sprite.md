# The premium soft glow — a radial-gradient DataTexture sprite (stacked solids = onion rings)

**What we did.** The Tempest tail tuft's "point of light" glow went through THREE iterations before it read
premium, all on the same underlying mistake — approximating a soft radial glow with SOLID meshes. Owner
verdicts drove each: "hard white diamond" → "increasingly larger circular lines, cheap" → finally smooth.

**THE LAW — a soft glow is an ALPHA FALLOFF, and no arrangement of SOLID additive meshes produces one.**
- A **single** additive octahedron at uniform opacity clips to a **hard diamond**: every interior pixel has
  the same alpha, so the silhouette is a hard polygon edge.
- **Stacked/nested** additive shells (bigger + fainter each) read as **concentric onion-rings**: each solid
  shell still has its own hard silhouette edge, and the eye reads those edges as "increasingly larger
  circular lines." Stacking hard edges never smooths them — it multiplies them.
- The only thing that reads as a glow is a **smooth alpha that falls to 0 at the rim**. A solid mesh can't
  have that (its alpha is per-material uniform, or per-vertex at best — and a low-poly solid has no interior
  vertices to ramp). You need a **texture** (or a huge fan-disc with per-vertex alpha).

**THE FIX — a Sprite with a radial-gradient DataTexture.** A `THREE.Sprite` (always camera-facing, so the
point-of-light reads round from every angle) with a `SpriteMaterial` whose `map` is a small radial-gradient
alpha texture: `alpha = pow(max(0, 1 - d), 2.4)` where `d` is the normalized radius (0 centre → 1 rim). The
falloff hits exactly 0 at the rim → no edge, no rings. Additive blend, `depthWrite:false`, `toneMapped:true`,
tint via `material.color`, scale = glow diameter. One shared white texture, reused/tinted per glow (tail
tuft + both eyes).

**THE GOTCHA that forced DataTexture over CanvasTexture — the geometry tests build in NODE (no DOM).** The
obvious way to make a gradient texture is a canvas: `document.createElement('canvas')` + a `createRadial
Gradient`. But `tests/starters.mjs` imports the part-builders and constructs the dragon in **Node**, where
`document` is undefined → the build throws and every geometry test fails. A **`THREE.DataTexture`** is a
plain `Uint8Array` of RGBA computed in JS — zero DOM — so it builds headless AND renders in the browser.
Set `minFilter = magFilter = LinearFilter` so the 64×64 gradient interpolates smoothly. Rule: **any
procedural texture in a part-builder must be DataTexture, never CanvasTexture** — the builders run in Node
for CI.

**Reusable takeaways.**
- Soft glow / bloom / point-of-light = a **radial-gradient alpha sprite**, not solid meshes. Stacked
  additive solids = onion-rings; a single one = a hard diamond. Neither is a glow.
- Sprite (camera-facing) so it reads round from every angle as the subject moves.
- Procedural textures in geometry-builders MUST be `DataTexture` (DOM-free), not `CanvasTexture` — the
  builders run headless in Node for the geometry tests.
- Three attempts on the same element usually means the APPROACH is wrong, not the parameters. We tuned
  shell radii/opacities twice before realizing solids can't make a falloff at all.
