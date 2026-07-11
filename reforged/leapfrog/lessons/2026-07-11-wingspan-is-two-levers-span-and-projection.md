# "Wingspan too wide" is TWO levers — geometric span AND wing projection

**The task.** Owner: *"Azure's wingspan is too wide — bring it closer to Phoenix Ascendant's, a smidge
wider is fine to keep the falcon look."* Azure is the falcon-winged starter; its apex (Radiant / form 2)
carries a swept blade-feather comb held nearly FLAT (~15° dihedral — a falcon glide, not a raised
firebird gull). Phoenix Ascendant is the SSSR firebird whose feather wings sweep UP ~45°.

**Measure before you cut — against the REAL chase cam, and both dragons.** Don't eyeball the studio
turntable (it auto-fits each dragon to frame, so scale is not comparable). Two fixed-frame reads settle it:
- `tools/silhouette.mjs <key> rear <form>` uses the **actual chase camera** (`0,3.6,12.3`, fixed) — so
  the `% wide` coverage is directly comparable between dragons and is literally the play view. At the
  default 1400-frame azure filled **100% (clipping, widest-gap 1392/1400)** vs phoenix **69%**. Render at
  `--w=2800` to UN-CLIP and get the true span: azure **146%** of the 1400-frame vs phoenix **70%**.
- A tiny probe that builds both models and reads the **world** wing-tip x-extent (WITH `model.scale`) +
  the body z-extent gives the geometry-true numbers the screen can't (because of clipping): azure apex
  **worldSpan 16.32 / span:body 2.03**, phoenix apex **10.78 / 1.36**. Azure was **1.51× Phoenix**.
  (Copy the `measure()` body from `tests/starters.mjs`; phoenix's feather wings don't publish
  `wingElements`, so take span from the wing-subtree world bbox, not `parts.wingElements`.)

**The trap: geometric span ≠ screen span.** Cutting the apex half-span dial `bladeSpan 11.6 → 9.4`
dropped the geometric world span 1.51×→**1.23× Phoenix** (−18%) and span:body 2.03→**1.65**. But the
**chase-cam** span only went 146%→112% of frame — still clipping, still much wider than Phoenix's 70%.
Why: a **flat** falcon wing projects almost its full length onto screen-x, while Phoenix's **~45°
raised** wing foreshortens hard, so its screen footprint is far under its true span. **Two wings of equal
geometric span read at very different widths on the chase cam depending on dihedral.** So "match the
reference dragon's on-screen wingspan" is NOT achievable by the span dial alone when you must keep a
flat silhouette — the flatness IS part of what makes it read wide.

**The principled stopping point = the identity floor, not the reference dragon.** The starters test
floors azure's apex at `span:body ≥ 1.6` (the §5d falcon-glider spec). Matching Phoenix's geometric
span exactly needs ~1.34 — BELOW the floor, i.e. it would stop being a falcon. The owner's "a smidge
wider to keep the falcon look" maps *exactly* onto that floor: narrow as far as the documented identity
allows and no further. Landing `bladeSpan 9.4` → span:body **1.65** (comfortably above 1.6), **1.23×
Phoenix** — a real, visible narrowing that stays 100% falcon and keeps every assert green. Pushing past
it is an owner-gated identity change (relax the floor) or a silhouette change (add gull dihedral →
drifts toward firebird), not a free tuning move.

**Reusable rules.**
- **Wingspan has two independent levers: the span dial (geometric reach) and the wing dihedral/projection
  (how much of that reach lands on the chase-cam x-axis).** A "too wide" complaint can be driven by
  either or both; identify which before turning a dial. A flat-winged glider is inherently wide on a
  behind-the-tail cam — that's the cost of the flat silhouette, not a bug to tune away.
- **Compare two dragons only in a FIXED-camera view** (`silhouette.mjs rear` = the real chase cam) or via
  a world-space probe. The studio/turntable auto-fits and lies about relative scale.
- **Blade length adds no tris** in the comb builder (tessellation is fixed by `bladeDetail`), so span
  changes are triangle-free — the tri budget doesn't move (azure stayed 5940/6000).
- **The identity spec floor (here `span:body ≥ 1.6`) is the natural stop for a "make it more like X"
  narrowing.** Going below it is a persona change, so it's an owner call, not a default.
- When forms merge cumulatively (`ascension.js`), a per-form dial like `bladeSpan` is set independently
  per rung — changing only the apex leaves the f0/f1 ladder monotonic (5.4 < 7.3 < 9.4) automatically.
