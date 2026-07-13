# 2026-07-13 — THE FRESH FIVE: five new premium dragon concepts off the taken-lanes map

**Did / learned.** Owner asked for a fresh dragon concept that is NOT fire/water/earth (the starters),
NOT phoenix, NOT solar, NOT vesper — researched externally (Pokémon Dragapult/Kommo-o/Naganadel, MH
Kushala Daora/Amatsu/Namielle/Kirin, gacha aurora + clockwork lanes), then a high-effort Fable design
director synthesized **5** premium build sheets + a master index. The five (working keys): **Thunderhead
Tempest** (`tempest`, storm — stacked charcoal strata decks, near-white intermittently-LIVE arc-tree,
verb *charging*), **Belladonna Stiletto** (`stiletto`, venom — four-winged wasp-wyrm, translucent sacs
that FILL with UV-orchid 292°, verb *brewing*), **Aurora Sylph** (`sylph`, aurora — polar ribbon-serpent
with a pleated no-membrane light-curtain, teal 176°, verb *unfurling*), **Gravelight Revenant**
(`revenant`, bone — hollow-caged skeleton lit from inside by grave-green 118° ghost-fire, verb
*hollowing*), **Crimson Tocsin** (`tocsin`, sound — bronze chime-drake pulsing expanding crimson 354°
shockwave rings, verb *tuning*). Files: `reforged/FRESH-DRAGONS-SYNTHESIS.md` + one `*-BUILDSHEET.md`
each. No game code touched; roster byte-identical.

**The reusable moves that made the set cohere:**
- **Allocate the SPECTACLE MODE globally, not per-dragon.** The roster already owned regalia (Solar),
  fire (Phoenix), and withholding (Vesper). The five were each assigned a spectacle mode the roster
  had never used — **time** (intermittent strikes), **volume** (a diegetic liquid fill meter), **flow**
  (a fluid-sim light curtain), **void** (negative-space silhouette), **rhythm** (beat-synced rings that
  escape the silhouette). Distinctiveness becomes STRUCTURAL, not a palette reskin.
- **Allocate the HUE budget globally before writing any sheet.** Plot every taken emissive lane on the
  hue wheel (magma 24–27°, gold 39° diffuse, acid eyes 80°, mint 149°, ice 205°, ion 223°, violet 262°)
  and hand each new dragon one clean free arc with a ≥27° pairwise margin: gravefire 118°, teal 176°,
  orchid 292°, crimson 354°, and the **near-white VALUE lane** (sat ≤0.12 — near-white is unowned
  because Pearl's white is diffuse body, not emissive). This is why the venom dragon is UV-orchid, NOT
  the intuitive chartreuse — chartreuse sat within ~20° of Vesper's acid-green EYES and would bloom to
  the same colour (hues separate by how they BLOOM, not hex distance — DRAGON-DESIGN §6.4).
- **Two near-black/near-white dragons can coexist with Vesper/Pearl if you bake the separators as SHEET
  LAWS, not vibes.** Tempest holds body L 0.20–0.26 (≈2× Vesper) as an asserted law; Revenant holds
  matte chalk sat ≤0.12 vs Pearl's satin pearl+gold. "Not a second Vesper / not a second Pearl" becomes
  a testable number, not a critic's opinion.

**→ Systematize.** Any future "give me a new premium" starts from the **taken-lanes matrix** (palette /
silhouette region / motif / growth verb / wing architecture) + the **hue-wheel census** + the
**spectacle-mode census** — three global maps that turn "is this distinct?" from a subjective gate into
an anti-collision proof (no >1 shared cell in any column pair; ≥27° hue margin; an unused spectacle
mode). The synthesis doc's §2 matrix is the living copy — extend it, don't rebuild it. The engine tranche
the queue needs is now named and shared: a deterministic seeded **`pulseTimer`** (Tempest strikes +
Tocsin rings — so timed spectacle is pixel-comparable across gate rounds via a `?strikePin`-style
capture flag), a silhouette **hole-metric** on `silhouetteCore.mjs` (Revenant's cage — doubles as a
MITTEN detector for every wing), and a nullable **`parts.auxWingPivots`** rig hook (Stiletto's second
wing pair — additive, roster byte-identical without it).

**→ Leapfrog.** The plan is a strict BUILD QUEUE — **Tempest → Revenant → Stiletto → Tocsin → Sylph** —
ordered by risk-vs-shared-infra: Tempest first (closest to Vesper's proven assembly; lands `pulseTimer`),
Revenant second (biggest structural bet — negative space — while the queue has slack; lands the
hole-metric), Stiletto third (the one rig extension, mid-queue), Tocsin fourth (reuses `pulseTimer`),
Sylph last (riskiest fill-rate curtain, ships on the freshest p95 data). Each build is a fresh
`dragonTempest.js`-style module on the faceted-assembly family (NEVER the retired organism/unifiedHull
family), self-registering default-off, hero-form-first then laddered — every increment its own Fable
harsh-critic gate + its own lesson file. The three global maps mean the SIXTH dragon is now cheap: pick
an unused spectacle mode, an open hue arc, an empty matrix row, and the distinctiveness proof writes
itself.
