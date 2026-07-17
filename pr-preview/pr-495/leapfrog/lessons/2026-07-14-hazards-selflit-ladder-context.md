# In-context truth: a vertex-colour ladder DIES backlit — self-lit it, and score in the sunset

**What happened.** The three Frozen hazards shipped at 4.3–4.4/5 — but every one of those
scores was a STUDIO score against a bright, evenly-lit sky. The owner fly-tested them and
said they "don't look as good as the other side props." He was right: in-game, backlit
against the sunset, the berg read as a **dark navy gem** and the overhead bar as a **black
silhouette**. In-context re-score: **3.0–3.4/5** — a full point below the studio.

**Root cause (the reusable trap).** The frost/mid/teal value ladder is baked into **vertex
colours**, and in three.js vertex colours only modulate the **diffuse** term. The hazards
spawn dead-centre in the lane — the worst possible spot, directly in the sun corridor — so
their camera-facing faces get almost no diffuse light, the ladder multiplies against ≈0, and
every face collapses to the material's (near-black) emissive. The side props win because
they're huge, side-lit, and sit against the darker flanks of the sky. **A vertex-colour
ladder has no legibility floor; a bright backlight erases it.**

**The fix — one shader line, zero tris: fold the ladder into EMISSIVE too.**
```js
mat.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace(
  '#include <emissivemap_fragment>',
  '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
// frostIce.emissive 0x11384c@0.28 → 0xcfe4f0@0.42
```
Now frost faces render at `emissive×(bright frost)` and belly faces at `emissive×(deep
teal)` even with no scene light — a **self-lit legibility floor** for a material-history
ladder. In-game: berg 3.0→**4.3** (and now unmistakably ice), bar 3.4→**4.2**. Notes banked:
- **Exempt the warning material** (`moverIce`): its coral pulse must stay hot + unmodulated.
- This is withheld-glow COMPLIANT — it's not a glow feature, it's restoring the ladder's
  floor. Tune intensity 0.35–0.5 so the lit studio still looks authored, not radioactive
  (0.42 landed; higher blows the frost to white).
- **Counter-intuitive**: raising the body's emissive floor *lowers* the crevasse-glow LED-
  strip risk (LED-strip is a slit-vs-body CONTRAST failure; a brighter body shrinks the
  ratio). So do NOT also dim the glow — that washes the fissure out. Fix one lever, re-judge.

**THE PROCESS RULE (the biggest takeaway).** The studio numbers **lied by a full point**
because they weren't shot in the shipping light. **No Frozen hazard score counts unless it's
captured in the backlit sunset context.** Built `tools/hazshot.mjs` (flies the `?hazlab`
showcase in-biome and bursts frames as the dragon passes each hazard) so every future hazard
gets an in-context capture, not just a clean-sky studio sheet. Gotcha: the game boot needs
`&debug` in the query or `boot()` never reaches the playing state.

**Also fixed here — a latent fairness bug the widening surfaced.** The berg's collider-
support check measured chunk A's inradius BEFORE its non-uniform scale, so a `(1,0.90,1.07)`
squash silently dropped true vertical support to ~0.686 < the 0.70 collider sphere — the
hitbox poked out the poles. **Measure support AFTER every transform that can shrink an axis.**
Now 0.755 ≥ 0.70, provably contained.

**Bonus (owner gameplay note).** A floating hazard you dodge by moving SIDEWAYS should be
**wider than tall** — lateral mass is the verb. Widened the berg to ~1.5:1 (fragments flung
to the flanks), keeping the collider sphere centred and contained; the visual edge now
extends OUTSIDE the collider (forgiving fringe, the correct direction) and telegraphs "go
around me" at approach distance.

**Filed separately (not this PR).** The biome-boundary **gateway arch** and mid-biome
**mega-arch** (`setpieces.js`) are pre-glacier-rework setpieces the owner flagged as
un-premium; Fable confirmed and gave directions (Calved Monolith Gate / Faceted Span) — own
PR, and they need the same emissive-ladder treatment so they don't go black at dusk either.
