# A fix borrowed from the bar imports the bar's identity — ship the split axis in the same edit

**What we did.** The v2 Fornax build-sheet rewrite (richness-planned-not-patched) was
independently audited: SOUND-WITH-CORRECTIONS, six fixes. The big one: reversing the
bare-spine law by adopting Tempest's dorsal rank structure had rebuilt Tempest's R1
near-verbatim — same alternation, near-identical height constants, and (closest match)
a continuous pale rail threaded through the vane tips, which is exactly Tempest's
`crestPts` ridge-ribbon (`dragonTempest.js:282,306-320`). At 180px, "dark hull +
serrated spine + continuous pale ridge line" IS Tempest's read; hue alone cannot split
two dark frames.

**What we learned.**
1. **A borrowed mechanism imports the donor's identity.** Every fix copied from a roster
   dragon must arrive WITH its own split axis and a gate tile against the donor, in the
   same edit — Fornax committed three: asymmetric struck-shard vane profile (apex
   0.60–0.70 aft, lead slope ≥3× trail) vs the symmetric tent-spike; tall-tall-short
   period-3 rhythm vs strict alternation; a BROKEN ~60%-duty rail at I1 that fuses
   continuous only under THE STOKE (withheld completeness — the split doubled as
   identity).
2. **The distinctiveness gate can only see axes it has rows for.** The §2 table had no
   dorsal-line row and §12's calibration tiles omitted Tempest entirely, so the
   collision was structurally invisible to the sheet's own gate. When a reversal opens a
   new anatomical region, add the table row and the donor tile in the same commit.
3. **Quote BUILT geometry, not formula ceilings.** "Tempest vanes ~0.37u" was a
   misquote: the formula ceilings at 0.337u but vanes only build where fr ≈ 0.73 →
   tallest built ≈ 0.284u. The wrong figure inverted a design claim ("we sit just
   under") that shaped the spec.
4. **Absolutist laws ban their own cures.** "Kill every `i%n` pick" outlawed the shipped
   duty-hash that fixed brightness pooling — and Tempest itself index-perturbs atop a
   role base. The durable form: role sets the TIER; index may jitter within it or
   duty-break ONE step darker; bounded by an anti-pooling assert (median + spread both
   pass a pooled band, so the render gate alone can't catch it).
5. **Dual authority over one z-range is unbuildable**, and a "height-matched handoff"
   across modules needs a CONTRACT CHANNEL (`serrationTopAt(z)`, additive key — additive
   keys don't break a frozen contract), never duplicated constants.

**The gotcha.** A dial can hide a unit bug that no sheet number catches: "tail 2.6×
torso" shipped as `* 2.6` ABSOLUTE units = 1.68× the 1.55u torso. State the unit next to
every ratio dial and check the multiplication site.

**The reusable pattern.** When auditing (or writing) a reversal: (a) diff the new spec
against the donor's actual built numbers, not its formulas; (b) demand a split axis per
borrowed mechanism + a gate row/tile for the donor; (c) stress-test each new absolutist
law against the codebase's shipped fixes before freezing it.

**What it unlocks.** The Fornax serration is now buildable (single schedule owner,
contract-fed handoff) and gated against its own donor; the ledger gets the general law
before the next dragon borrows from the roster's bar.
