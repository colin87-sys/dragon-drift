# Jade Serpent build sheet — reverse-engineered from a locked North-Star image

**What we did.** With the Jade AAA art direction locked (`JADE-AAA-ARTDIRECTION.md`) and a
background-stripped North-Star concept (`jade-coil-CUTOUT.png`), ran the two-stage Fable
pipeline to produce a build-ready sheet: a high-effort Fable **engineer** reverse-engineered
`reforged/JADE-SERPENT-BUILDSHEET.md` (v1) to Revenant §B depth, then a high-effort Fable
**auditor** stress-tested it against the real engine files.

**What we learned / the reusable pattern.**
- **North-Star first, then sheet.** An owner-approved concept image + an AD lock is a far
  better brief than prose alone — the engineer reverse-engineers geometry to hit a fixed
  visual target instead of inventing one. Order: concept image → AD lock → build sheet.
- **Evolve-in-place beats fork for a shipped starter.** Jade's machinery already implements
  ~80% of the North Star (one-tube `bodyWave` lateral swim, silk-fin furl poser, chin pearl,
  fin-tip dew gems, streamers, koi lyre). The sheet EXTENDS those builders behind **nullable
  default-off dials** (`caudalBloom`, `crestRibbon`, `lobeBreath`, chain plumbing) so a def
  without the dial builds **byte-identical** geometry — the coexist law satisfied without
  forking `koiSerpent` (whose rig ticks are keyed to the parts this builder publishes).
- **Buy the hero from motion you already have.** THE GRAND FAN-BLOOM (3-blade split caudal
  fan) is built *inside the single-material body tube* so it whips with the existing lateral
  `bodyWave` for free — no new animated part, no extra transparent drawable.
- **Law-12 WOW without a cheap-tell.** Restraint is the luxury: the seafoam dorsal crest is
  **pure zero-emissive diffuse** (coreGlow explicitly rejected), and the "wow" is a
  pearl-chain rearward pulse (components igniting in sequence, never a glow seam) — dodging
  the LED-strip / onion-ring cheap-tells.
- **Two-stage Fable (engineer → adversarial auditor) catches the palimpsest/aspiration
  traps.** The auditor opens every cited `dragon.js` line rather than trusting the sheet, and
  confirms MUST-ADD hooks genuinely don't exist yet.

**The gotcha to watch.** The riskiest feasibility item is the in-tube caudal fan: the M=16
station resample + split notch must stay **NaN-free and byte-identical at `caudalBloom:0`**,
and must read as a fan-bloom (not "tube-with-flaps," the AD's veto) from rear chase.

**What it unlocks.** A build-ready Jade sheet another chat can implement, and a repeatable
"locked image → engineer → auditor" recipe for elevating any shipped starter to AAA.
