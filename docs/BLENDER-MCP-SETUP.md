# Blender MCP — the shape sketchpad

Blender is a **sketchpad for silhouette and proportion**, not an asset pipeline. Dragon Drift
stays 100% procedural — no `.glb`, no `.fbx`, no asset files ever land in `reforged/`. The
output of a Blender session is **numbers** (transforms, angles, taper ratios) that get
hand-ported into a `reforged/js/dragon*.js` builder.

Read [`reforged/DRAGON-DESIGN.md`](../reforged/DRAGON-DESIGN.md) before using this. Especially
§3.6 (silhouette economics) — it is the law this whole workflow exists to serve, and the one
Blender will tempt you to break.

---

## 1. Requirements

| | |
|---|---|
| Blender | 3.0+ (addon declares `"blender": (3, 0, 0)`) |
| Python | 3.10+ (config below pins 3.11) |
| `uv` | `brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

**This only works on a local machine with Blender open.** The MCP server is a socket bridge to
a running Blender instance on `localhost:9876`. Claude Code *web* sessions run in a remote
container with no Blender and no display — the server will start and immediately log
`Failed to connect to Blender: [Errno 111] Connection refused`. That is expected, not a bug.

## 2. Install the Blender addon

```bash
curl -LO https://raw.githubusercontent.com/ahujasid/blender-mcp/main/addon.py
```

In Blender: **Edit → Preferences → Add-ons → Install from Disk** → pick `addon.py` → tick the
checkbox to enable it.

Then in the 3D viewport: **N** to open the sidebar → **BlenderMCP** tab → **Connect to MCP
server**. Leave Blender open for the whole session.

## 3. MCP server config

Already committed at [`.mcp.json`](../.mcp.json) in the repo root, so any local Claude Code
session started in this directory picks it up (approve it on first launch when prompted):

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["--python", "3.11", "blender-mcp"],
      "env": { "UV_PYTHON_PREFERENCE": "only-managed" }
    }
  }
}
```

`--python 3.11` satisfies the package's `requires-python >=3.10`. `UV_PYTHON_PREFERENCE=only-managed`
stops `uv` from picking up conda / pyenv / asdf / system Python first — the single most common
setup failure.

Verify the package resolves before wiring Blender in:

```bash
uvx --python 3.11 blender-mcp --help
```

Reaching the `Failed to connect to Blender` line means the server itself is healthy.

## 4. What the bridge exposes

| Tool | Use |
|---|---|
| `execute_blender_code` | Arbitrary `bpy`. This is the whole capability surface. |
| `get_viewport_screenshot` | **Visual feedback loop** — Claude sees the shape, not just the script. |
| `get_scene_info` / `get_object_info` | Read back transforms, hierarchy, modifiers. |
| Poly Haven / Sketchfab / Hyper3D / Hunyuan3D | Asset + generative-mesh fetchers. **Not used here** — nothing external ships in a procedural repo. |

The screenshot tool is what makes this worth doing: the write-script → look → correct loop
closes without a human relaying "no, the neck's too long."

The three read-only tools are pre-approved in `.claude/settings.json`. `execute_blender_code` is
deliberately **not** — it is arbitrary code execution against your live scene, so it prompts every
time. Widen it yourself if the prompting gets old, but that is your call to make, not a default.

---

## 5. House rules

The port back is only as accurate as the sketch is disciplined. These four are the difference
between a mechanical transform and a lossy re-draw.

1. **Primitives only.** Cube, cone, UV sphere, cylinder, octahedron — the vocabulary the engine
   actually has (~82 Box / 64 Cone / 41 Octahedron / 40 Sphere / 36 Cylinder across the shipped
   `dragon*.js`). **No subsurf, no sculpt, no booleans, no curve modifiers.** Anything smooth you
   fall in love with is a shape you cannot build.
2. **Axis conversion is the exporter's job, not yours.** Blender is Z-up. The engine is
   head/forward −Z, tail/rear +Z, right +X, up +Y, torso baseline y≈0.2. Convert once, in script.
3. **Materials are worth nothing here.** The premium read is a 4-tier per-facet-column value
   ladder, Fresnel rim, additive `DataTexture` sprites, and glow withheld at cruise
   ([`reforged/AAA-PIPELINE.md`](../reforged/AAA-PIPELINE.md)). EEVEE will lie to you completely.
   Sketch in flat grey.
4. **Judge at cruise, not in the viewport.** Blender's default view — close, orbiting, well-lit,
   three-quarter — is the exact inverse of the ship condition (small, backlit, rear-chase). Preview
   with a flat-black matcap and a backlight, and take the real verdict from `tricount` /
   `tiershots` / `seamprobe` on the **ported** result.

## 6. The loop

```
sketch in primitives  →  screenshot / iterate on silhouette
                      →  dump transforms
                      →  hand-port to a dragon*.js builder
                      →  tiershots + Fable critic  ←  the actual verdict
```

Blender never gets a vote on the final look. It gets a vote on the **outline**, which
§3.6 says is where the premium read lives anyway.

---

Upstream: [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) (addon v1.2)
