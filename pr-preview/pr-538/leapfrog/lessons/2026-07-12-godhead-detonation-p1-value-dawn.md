# THE GODHEAD DETONATION — P1: the value-space dawn (ignite the nebula, spare the corridor)

**What we did.** Opened the S3 apotheosis (THE UNMASKED's FIRSTBORN SKY → a full-frame "holy
detonation", FF7 Safer-Sephiroth's STYLE in our indigo+gold colour). P1 is the palette-only half in
`arenaSkin.js HEAVEN_HEX`: **warmed the nebula mid-lift** `skyMid 0x453466 → 0x584070` (a rose-violet
body, the blast's warm gas) and **ignited the FBM gas** `cloudAmount .35 → .5` with a hotter
`cloudLit 0xd98a64 → 0xe89a6a`. The zenith (`skyTop`), the gold galactic-plane band (`skyHorizon`),
and the fog are UNCHANGED — the detonation is a **mid-annulus event by construction**, so the value
lift lives in the mid-lift + gas layers, never the dome cap or the corridor.

**Owner colour decisions locked (the whole-arena palette, confirmed before building):**
- **Blast gradient = gold core → violet rim** (D1a): gold-white core `0xfff6e0` → molten gold
  `0xffd98a` → gold-rose filaments `0xd98a64` (the shipped nebula key — gas & blast are one
  substance) → rose-violet `0x9a6ab0` → **S2 void-violet `0x6a5ca8`** shock rim, over the indigo
  vault `0x0e1230`. The full indigo+gold+violet triad; the hot heart cools to the S2 arc callback.
- **Boss aura = gold rim + violet-cold undertone (hybrid, D2a+)**: incandescent GOLD leading-edge rim
  (the seraph catches its own gold verdict = "judgment = illumination"), interior ladder + mandorla
  outer ring keep the S2 VIOLET undertone. The boss reads as a distinct violet-shadow figure with
  gold-fire edges AGAINST the gold blast (legibility + it honours the reference's purple aura + ours).
- Defaults: D3 medium ~28 debris + 2 hero chunks · D4 hold sky p50 ≤ .55 **+ add corridor p50 ≤ .45**
  · D5 keep the −30u haze-deck · D6 majestic roil (core→rim ~4–7s) · D7 keep supernova/spiral seams.

**The lesson — the median barely moved because the gas is CONCENTRATED, not a wash.** Warming the
mid-lift + igniting the FBM band (a +43% coverage bump) moved the sky-band **median almost nothing**
(p50 0.326→0.325) while lifting the corridor p90 only 0.289→0.337. A nebula FBM paints bright
FILAMENTS over a dark vault, so the broad-field median stays vault-dominated — exactly the fill-factor
argument the burst geometry (P2) will lean on. **Corollary: value identity that lives in thin bright
structure over a dark field spends p95/mean, not p50 — the median gate is cheap to hold if you never
flood the vault flat.**

**The new gate — corridor p50 ≤ 0.45 (D4).** Added to `unmaskedarena.mjs` alongside the p90 authority:
the p90 ceiling is the layered-read parry guarantee, but the apotheosis moves the SKY identity toward
"perpetual detonation", so a median lock on the play-field pocket pins it DARK against future tuning
independent of the sky. Ships at **0.138** (deep headroom) — the corridor is the calm pocket the
detonation deliberately spares (down-hemisphere suppression + haze-deck occlusion + dark debris, all
coming P2–P4).

**Verify.** `bulletcontrast` green (fog + horizon untouched — the two bullet-band rows re-certify
unchanged). `unmaskedarena` 48 (was 47 + the new corridor p50): corridor p90 0.337–0.349, corridor
p50 0.138, sky p95 0.805, sky p50 0.325–0.392 (all under their gates, live-fight noise ±0.05 as the
holy-architecture lesson documents). mix-0 byte-identity + VOID/HEAVEN exact-table asserts unchanged
(they read the tables, so the new values stay self-consistent).

**What it unlocks.** The vault now reads as roiling luminous detonation gas at zero draw cost, and the
gate headroom (corridor p90 .34/.75, sky p50 .33/.55) is measured before any geometry — P2's streak
fan + shock rings spend it against a known baseline, and the fill-factor budget (≤ ~35% bright sky
coverage) has a proven median floor to build to.
