# 2026-08-03 — Blender MCP as a shape sketchpad (not an asset pipeline)

**Did / learned.** Wired [`ahujasid/blender-mcp`](https://github.com/ahujasid/blender-mcp) in as
project-scope MCP (`.mcp.json` + [`docs/BLENDER-MCP-SETUP.md`](../../docs/BLENDER-MCP-SETUP.md)) so
a local session can drive Blender over a `localhost:9876` socket bridge. The point is **not**
importing meshes — nothing but procedural geometry ever ships. It's to sketch SILHOUETTE fast in a
real 3D editor, then hand-port the numbers into a `dragon*.js` builder.

Three things fell out of setting it up:

1. **The port target is a primitive vocabulary, not a mesh.** Counted across the shipped
   `reforged/js/dragon*.js`: 82 Box · 64 Cone · 41 Octahedron · 40 Sphere · 36 Cylinder. So a
   Blender→procedural port is a *re-interpretation into a fixed vocabulary*, and its fidelity is
   set entirely by whether the sketch stayed inside that vocabulary. One subsurf modifier and the
   shape becomes unbuildable. **Discipline the sketchpad and the port is near-mechanical; sketch
   freely and it's a lossy re-draw.**
2. **The real risk isn't porting drift — it's that Blender flatters designs that die at cruise.**
   The default viewport (close, orbiting, well-lit, three-quarter) is the exact inverse of the ship
   condition (small, backlit, rear-chase). DD §3.6 already says surface plates and coverts are
   invisible at gameplay distance — Blender is a machine for making you spend budget there anyway.
3. **`get_viewport_screenshot` is the tool that makes it worth doing.** Arbitrary `bpy` via
   `execute_blender_code` is the capability, but writing bpy blind is the failure mode. The
   screenshot closes the write → look → correct loop without a human relaying "neck's too long."

Setup gotchas worth keeping: pin `--python 3.11` with `UV_PYTHON_PREFERENCE=only-managed` or `uv`
grabs conda/pyenv/system Python and the server dies obscurely. And a healthy server still logs
`Failed to connect to Blender: [Errno 111] Connection refused` when Blender isn't up — that line is
the success signal for "package resolves," not a fault.

**→ Systematize.** The general problem: **an external authoring tool is only safe to adopt once you
can name what it is allowed to have a vote on.** Blender gets a vote on the OUTLINE and nothing
else — not materials (our look is a 4-tier per-facet value ladder + Fresnel rim + additive
`DataTexture` sprites, EEVEE cannot preview it), not final judgement (that stays `tricount` /
`tiershots` / `seamprobe` + the Fable critic on the *ported* result). The setup doc encodes this as
four house rules — primitives only, axis conversion in script (Blender Z-up → engine −Z forward /
+Y up / baseline y≈0.2), flat grey materials, judge at cruise — so the constraint travels with the
tool instead of living in one chat's memory. The same test applies to any future external tool:
name its vote, or don't wire it in.

**→ Leapfrog.** Next: a `bpy` **exporter** that walks the scene and dumps
`{type, pos, rot, scale}` per primitive, plus codegen on this side that emits a `dragon*.js`
builder skeleton in the existing `bone()` / `seg()` idiom. That converts the round-trip from an
eyeballed hand-translation into a deterministic **transform** — which is the actual answer to "will
it port accurately." Once the round-trip is mechanical, silhouette iteration gets cheap enough to
explore whole shape families per session instead of one dragon per week, and DD §3.6's "spend the
play-distance budget on the OUTLINE" becomes something you can actually shop for.
