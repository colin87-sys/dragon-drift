# Dragon-diegetic vitals (EMBERSIGHT H7 + H8): the living gauge behind a settings toggle

**What we did.** Built the DRAGON VITALS layer — the player's vitals rendered as glow on
the dragon itself — behind a persisted settings toggle (GAME section,
`saveData.settings.dragonVitals`, default OFF; `?vitals=1` kept as the dev alias):

- **The bondChannel seam** (`js/dragonBond.js`): a deliberately dumb per-frame state bag.
  main.js writes `setVitals()`/`setSurge()` **before `updateDragon`** (frame-0 for the
  Bond-Echo), ui.js flips the enable from `applyAccessibility()`, and dragon.js consumes
  it inside the EXISTING updateDragon material pass — no second rAF, no DOM, no THREE
  import in the seam module.
- **Wing-charge stamina** (H7): six charge-stud octahedra on a shape-agnostic anchor
  ladder (shoulder joint → carpal joint → tip marker, falling back inboard, finally the
  dragon root) light root→carpal→tip; boost drains the TIP first so the light visibly
  retreats toward the shoulder; the fractional stud breathes at 14Hz while boost is held
  (the legible tell at chase distance); BOOST SEALED banks the ladder to dim coals.
- **Body-light health** (H7): emissive-floor multiplier per heart lost, **clamped ≥0.75**;
  ~8%/heart lerp toward cold ash (base hex cached, restored exactly); 12-mote ember-bleed
  off the flank on a wound; at 1 heart the coreGlow recolors danger-magenta and beats a
  ~1.1Hz lub-dub.
- **Spine-ignition surge** (H8): 5 dorsal nodes ignite nose→tail per chained ring;
  all-lit = the tail-tip node blazes gold. **Fallback contract shipped:** authored
  `userData.vitalsSurgeNode` markers → tail-chain segments → coreGlow steps.
- **Trail-as-combo** (H8): `pickTrailHex` lerps toward ember-gold with combo tier,
  **cap 0.5** — identity hue always wins.
- **The chrome side of Law 1:** `html.vitals-on` deepens the arc + surge-horn rest-ghosts
  one step (0.30→0.18) and delays the DOM gem-pop ceremony 120ms (`animation-delay`) —
  the lit fill stays frame-0 authoritative, only the celebration echoes.

**The flag-OFF-identical proof (the H7 gate) — how to actually prove it.** "Pixel-identical
when OFF" is unprovable from live gameplay screenshots (rAF timing is nondeterministic).
The trick: `updateDragon(dt, player, time)` is a **pure function of its inputs** as long as
you stay out of the random-consuming FX paths (no boost, no fever, bank below the
wingtip-trail threshold). So a probe page drove the REAL createDragon + 300 scripted
updateDragon steps (fixed dt, scripted velocity) in a headless browser, then compared
(a) a full scene state dump — every object transform/visibility + every material
colour/emissive/emissiveIntensity/opacity — and (b) an FNV hash of the rendered pixels,
against the SAME probe run in a `git worktree` of origin/master. azure/vesper/jade: 12/12
identical; the same harness run with `?vitals=1` diverges (a harness that can't fail is no
proof). Re-run after H8 — still identical. tricount is identical by construction: every
bond FX object is built LAZILY on the first enabled frame, so a flag-off session never
allocates one.

**The three arithmetic-identity idioms that make OFF exact** (reusable for any flagged
per-frame channel):
1. Injected terms are `×1` / `+0` when off (`target * bondBodyMul`, `+ bondCoreAdd`) —
   float-exact, no branch in the shipped write.
2. Colour writes cache the base hex before the FIRST write and **restore-once** on exit
   (a `writing` flag), so the off path never touches the material.
3. The whole pass early-outs to a "neutralize once, then park" branch — zero writes at
   steady state when the toggle was never on.

**The withheld-glow doctrine applied.** Stamina/surge are discrete COMPONENTS igniting
(dark studs with a bright core — rim/tip over dark face), never a membrane stripe or a
bloom blob; one material per rank shared L/R (the mirror-law corollary: a per-side
material is an accidental value asymmetry, and rank-sharing guarantees both wings always
read the same charge). Body dim is clamped so value tiers survive dark biomes (risk #6).

**The roster-fallback proof (H8 gate).** All 14 roster dragons built + driven 90 real
frames with vitals forced on: zero errors; 13 resolve the tail-chain fallback, **jade**
(koi serpent — one CPU-flexed tube, no tail chain) resolves the coreGlow fallback and
still carries the charge; per-dragon asserts on the tip blaze and the root>carpal>tip
partial ladder (57/57). Nobody has authored dorsal markers yet — **hero authoring is open
debt**, the contract makes it incremental.

**Gotchas.**
- There is no function named `updateFx` — the "damped per-frame material pass" the specs
  reference is the back half of `updateDragon` (~L1400+). Inject module-scalar outputs
  (`bondBodyMul`, `bondCoreAdd`) computed by a pass that runs just before the shipped
  writes; don't re-write a damped material after the fact (you'd fight the damp's
  feedback loop).
- Scene-level sprite pools (the ember-bleed motes) must join the `disposeDragon` sweep
  AND `setDragonFxVisible` AND `resetDragon`; joint-parented meshes ride the group
  traverse for free.
- `resetDragon`/menu transitions reset health — clear the wound-edge baseline
  (`bondPrevHealth = null`) whenever the channel isn't live, or a run restart "bleeds".
- In THIS headless env: boss.mjs's karnvow-footwork assert fails identically on master
  (seeded-random env drift — pre-existing); parallel chromium instances starve each other
  into boot timeouts (run browser suites serially); `page.screenshot` of the live canvas
  takes ~40s at dsf=2 (raise timeouts, and wait for `game.state === 'playing'` rather
  than a fixed delay — `#btn-start` clicks can land before the hub is interactive).

**What it unlocks.** H9 garnish (tether, graze spark) rides the same seam; per-dragon
surge-node authoring (`userData.vitalsSurgeNode`) is now a pure content task; the
span-gradient `onBeforeCompile` wing variant remains the deferred sub-flag; the off-proof
harness pattern (worktree + scripted-updateDragon state/pixel hash) is the template for
proving ANY "flag-off must be byte-identical" WebGL contract in this repo.
