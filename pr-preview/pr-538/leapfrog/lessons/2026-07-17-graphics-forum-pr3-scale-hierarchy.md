# Drowned Forum PR-3 — the scale-hierarchy fix (props "too small" → the 4:2:1 ruin-city ladder, Fable 4.4 PASS)

**What we did.** The owner flew the live biome and called the new PR-3 props — the `viamarina` near-rail and
the `drumfall` foil — "too small." They were sized ≈ their lagoon predecessors (causeway h5–8, wrackstone
h3.5–5) and had each passed a two-stage studio+in-context gate IN ISOLATION — but in the FULL composition, next
to the h17–23 hero arch and the tall gate-hazard beams, they read as waterline gravel. Fable prescribed a
uniform ×1.4 bump to a clean height ladder; applied, re-shot the mixed scene, re-gated 4.4 PASS.

**THE LAW — a prop gated in isolation can still be the wrong SIZE in the composition; scale is a
whole-biome judgment, not a per-prop one.** Both props passed Stage-1 (studio orbit) and Stage-2 (in-context,
but HERO-PINNED so only that prop spawned). Neither gate ever showed the prop NEXT TO the hero + hazards at
once, so neither could catch "too small relative to the landmark." The missing view was the **mixed
composition** — every forum archetype spawning together, from the natural chase camera. Built
`tools/_forumscene.mjs` for exactly this: `?biome=0&debug&props=forum` with NO `hero=` pin (so nothing gets
stripped) and the game's own chase cam (don't override `cameraCtl.update`). **Add a no-hero mixed-scene capture
to the gate ladder whenever a biome has ≥3 coexisting prop tiers — the isolation gates miss relative scale.**

**The fix pattern — fill the MISSING MID-REGISTER with an octave ladder.** The broken composition was
hero 20 : rail 7.5 : foil 3.75 ≈ **5.3 : 2 : 1** — a hole in the middle register, so the eye read "one arch +
gravel." The fix is a clean **4 : 2 : 1** ladder (hero 20 : near-rail 10.5 : foil 5.25): each tier half the one
above = landmark → street → rubble. You fix it by lifting the middle + bottom TOWARD the hero, never by growing
the hero (it's already the tallest thing after the hazards).

**Bump via the `h` scalar (it scales the WHOLE prop), and keep `r` SUB-proportional.** `h` in `place()` is the
overall size scalar — raising it grows columns WITH matching girth + a longer stylobate (a taller-only hack
would be the stick-limb tell). Critical gotcha: the near-rail's placement couples x to r
(`x = 14.6 + 1.14·r + …`), so scaling r ×1.4 with h would push the prop further OFF-LANE and REFUND the presence
you just bought. Scale r only ×~1.15 (viamarina r 8–13 → 9–14; drumfall r 4–6.5 → 5–8) — enough to keep
instance spacing ahead of the now-longer prop, not enough to retreat it. (Net applied: viamarina h6–9 → 9–12,
drumfall h3–4.5 → 4.5–6 with a hard ceiling 6 — above that the foil stops being rubble and becomes a mid-prop
with a facing, a new tier you don't want.)

**Risks to hold at the gate (Fable's audit, all cleared but on the line):** (a) *rivalry via perspective* — a
near-field rail can match the distant hero's SCREEN height even when its world height is half; clamp the rail
ceiling (h12) rather than let it out-shout the arch. (b) *slot-canyon walling* — a near-rail at
comp-floor 0.30 on BOTH lane edges at h9–12 is one density notch from walling the corridor; it held only
because the rails are BROKEN (real gaps) and the water channel stays ~60% of frame. **Guard the GAPS, not just
the heights** — if a future pass makes the corridor feel enclosed, thin rail FREQUENCY / widen gaps, never
shrink the columns back. (c) *foil tier-creep* — watch that no `drumfall` catches the eye as a "prop" on
approach (the tell: you notice a foil before a near-rail).

**What it unlocks.** The forum scale ladder is locked (hero 17–23 : rail 9–12 : foil 4.5–6). `viamarina` h9–12
is a HARD CEILING; future population passes tune rail DENSITY, not height. Determinism/budgets untouched
(placement is render-only). PR-3 is closed at the owner's bar.

**Verify:** `node tools/_forumscene.mjs <tag>` (no-hero mixed composition); envcount / gold-determinism /
biomecycle all green (a `place()` size change is render-only — no tri or determinism impact).
