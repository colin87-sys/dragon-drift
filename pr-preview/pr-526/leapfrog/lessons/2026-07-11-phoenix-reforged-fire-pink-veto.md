# The "pink veto" on a warm-fire body is a LIT-DIFFUSE-meets-cool-rim artifact — the cure is pure-emissive fire, and you must SCAN every sheet or a stage-gated face survives forever

**Did.** Took the reforged Phoenix (`phoenixReforged`, the sunhawk scaffold glow-up) the owner had
redirected from "regal white-gold feather bird" all the way to **"graceful, elegant, molten-FIRE
phoenix — a blend of feathers and trailing fire, a long comet tail, the whole creature alight"**
(owner call: mostly-fire wings + whole-body fire). Ran the mandated **harsh-Fable-critic-per-round**
loop autonomously (owner: *"don't bug me till the final product is ready"*) — 1.8 → 3.2 → 3.9 → **SHIP
4.2/5, no veto, all axes ≥4**. The build that shipped: a **raptor ogee fire-wing** (curved leading
edge, a slim hot leading ridge replacing the old gold spar-"plank", a 4-band pure-emissive membrane,
flame-feather ranks whose picket rhythm is broken by 3 length families + varied pitch + per-feather
hot→cool ramps), a **distinct level-streaming comet TAIL** in a lower height-band than the wing
streamers, a whole-body fire coat (dorsal flame-mane + 2-row flank fire-coat), and a tapered hooked
raptor head. New reusable primitive: `flameFeather` (curved S-tapered hue-ramped ribbon) already
banked; the new banked idea is the **`hotRibbon` pure-emissive fire material set**.

**Learned #1 — the recurring "pink/magenta wire" veto on a warm-fire dragon is NOT a hue choice, it's
a LIGHTING artifact: the studio's cool rim/fill light landing on a LIT material's dark-red diffuse (or
its low-roughness specular) renders salmon/rose.** Re-hueing the emissive toward orange does *not* fix
it — I warmed crimson three times and it kept coming back. What actually kills it: **remove the lit
surface.** Every free-streaming fire element (wing flame-feathers, flank coat, dorsal mane, leading
licks, trailing streamers, the tail, the membrane, the leading ridge) was moved onto **pure-emissive
materials — near-black diffuse (`0x2e0f04`), `roughness: 1` (no specular), `metalness: 0`, a hot
orange emissive** — so the cool rim can register *nothing* on them. Rose count on the judged glide
sheets went **1500→0**. Bonus: pure-emissive fire also **glows in the dark chase view** (the critic's
other complaint — a "burning" creature should self-illuminate, not hold daylight colors).

**Learned #2 — a broad face and a thin ribbon want DIFFERENT emissive intensity.** The same
pure-emissive material that reads as gorgeous hot fire on a *thin* flame-feather (intensity ≈2) blooms
to **pale cream on a BROAD face** (the membrane, the tail drape). Fix: give broad fire surfaces a
**dedicated moderate-intensity ramp (≈1.1–1.4) in saturated ORANGE hues**, and reserve the
white-gold-hot stop for thin roots only. (This is why the tail first read as "silk, not fire" and the
membrane first read "pale cream" — both were broad faces run at thin-ribbon intensity.)

**Learned #3 — your automated veto GATE must cover every rendered sheet, or a stage-gated face hides in
the one you don't scan.** A rose wedge at the wing root survived *nine rounds and four "pink-fix"
passes* because the rose-pixel scan only ran on the glide sheets — the wedge was on the **crops** sheet
(a 4× zoom), was **f2+/f3 gated** (only revealed at full wing spread), and used the two static
materials (`goldfire`/`flame` in the membrane + leading ridge) that were never on my conversion list.
The Fable critic caught it by **pixel-scanning the crops with connected-component analysis** and proving
it was a contiguous flat FILL (not AA fringe). Lessons banked into the gate:
- **Scan ALL sheets** (glide dark+pale AND crops cells), not a subset.
- **Distinguish material-rose from AA-fringe rigorously**: a contiguous flat-shaded polygon of one rose
  value = material (fires the veto); a 1–2px non-contiguous run at a silhouette edge against the pale
  sky = orange-over-blue-sky antialiasing (does NOT fire). I *wrongly* dismissed the wedge as AA once —
  the tell that it's real is a **170×66px block of one constant color**, and that **the count is
  identical on dark and pale backgrounds** (rules out background blend, but NOT bloom or rim — so
  "identical dark/pale" alone is not proof of "baked into the material"; it only rules out the bg).
- **Use a saturation floor (`sat>0.18`) to exclude the pale-blue sky**, which otherwise reads as a
  false-positive "rose" at the boundary threshold (the sky is `~159,164,177`, B>G by a hair).
- Repo's `tools/silhouetteCore.mjs` exports a zero-dep `decodePNG(buf) → {w,h,rgba}` — use it for
  pixel gates (no `pngjs` in this repo).

**Gotchas (each cost a render):**
1. **`metalness` on a warm material is the enemy** on flat facets — the old regalia `gold` (metalness
   0.55) read as **dead olive/khaki** edge-on ("mud is the anti-fire colour"). Low metalness + a warm
   emissive FLOOR fixes it. Applied the same to the body field (`ivory`) and `bronze` (its near-black
   finger-roots were reading as "black flecks" at the wingtips → warmed the emissive floor).
2. **A long thin tail tip goes subpixel and AA-blends to pink against pale sky** — but *widening* it
   made it a broad *pink sheet* instead (more lit-diffuse area for the rim). The real fix was #1 (pure
   emissive), not width.
3. **The eye pupil must OVERLAP the eye**, not sit in front of it, or two octahedra read as "two
   diamonds side by side" instead of a pupil-in-eye.
4. **Corridor law vs. "drop the tail below the wing plane":** the owner/critic wanted the tail in a
   lower band than the wing streamers, but `{y<0.30, z>0.85}` is forbidden and a ~6-long ribbon with
   any downward `dir.y` accumulates through the floor. Solution: stream the tail **level** at
   body-height (y≈0.44) — already below the up-lifting wing streamers — with only a gentle downward
   belly bow; separation comes from height-band + centreline-x, not from diving.

**Process meta (re-confirmed): the shell cwd silently resets to the repo ROOT between Bash calls** —
every `node tools/…` / `node tests/…` must be `cd /…/reforged && …` in the *same* command or it dies
`MODULE_NOT_FOUND` (there's a second `tools/` at root). Hit this ~4× this session.

**→ Unlocks.** `hotRibbon` (the pure-emissive fire-material set) + the broad-vs-thin intensity rule +
the all-sheets rose gate are a **reusable FIRE-BODY kit** — any warm/fire dragon (Molten, Everflame,
Ember, future lava/solar-flare bosses) can drop its free-streaming fire onto pure-emissive materials
and pass a pink gate on the first try instead of the tenth. And "a shipped-hero glow-up can be
*redirected mid-flight* (regal→fire) without a clean-sheet rebuild" is now proven: the sculpt/attach
plumbing held; only the material doctrine and the fire geometry (tail/wing feathers) changed.
