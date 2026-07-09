// karnvow — boss definition (data). Split from bossDefs.js so parallel chats
// editing DIFFERENT bosses never conflict. Registered in ../bossDefs.js.
export const karnvow = {
    id: 'karnvow',
    name: 'KARNVOW',
    title: 'the Trophy-Hunter',
    epithet: 'Whatever Sent It',   // §5f lore gap: something SENT it — the epithet points, never answers
    tier: 3,                       // CALAMITY band; slot-9 is the band PEAK → hpMax/dials sit HIGH
    // Boss-archetype dispatch (bossModel.js buildBoss): the Trophy-Duelist builder
    // (bossKarnvow.js) — BOSS-DESIGN.md §5b/§5d registry slot 9, the Tier-3 band
    // PEAK. A lean HOODED DUELIST riding at your shoulder, one long lance couched
    // low, a swinging trophy chain of what it has killed; faceless but for one cold
    // guttering glint deep in the cowl void. It does NOT tower (the roster's
    // deliberate scale-DOWN) — its presence is PROXIMITY (the closest flank station)
    // + the lance+chain assembly, never bulk (§3b.6, L140/L141). Distinct from slot 1's
    // cracked-stone socket PAIR (one aperture, one glint) and slot 3's raptor cowl.
    archetype: 'trophyDuelist',
    accent: 0x5aa0d8,   // cold cowl-glint steel-blue (~207°, 40° clear of reflected-cyan) — identity + focal
    glow: 0x74b4e4,     // lighter cold steel (shield rim / shards / backlight) — the shielded state stays cold
    bulletColor: 0xff2b6a,   // danger stays magenta (role colour, never per-boss)
    approachFrom: 'side',    // rides in on the flank (the moving-station riding beat is a CP2 setpiece)
    muzzle: 'lanceTip',      // fire originates from the lance tip — the amber-emitting organ (§5f law 7)
    // LANCE V1 aim anchor (Codex review, PR #258 — verified: lockCandidates() returns
    // only lockParts + virtualLockOrgan, and karnvow had neither → the late-game
    // aim/lock verb would vanish on slot 9). The organ IS the anchor (the ashtalon
    // muzzle-as-anchor precedent — always emitting, always under fire, never a free
    // rest-beat paint).
    virtualLockOrgan: 'lanceTip',
    // V2 LANCE-PAINT anatomy (CP2): BRAND THE TROPHIES — the five taken charms on
    // the hip chain are the paint targets (claiming his collection back, one mark
    // at a time; they swing on the pendulum chain of a DARTING boss = the Tier-3
    // peak paint hunt). The EMPTY hook is deliberately NOT paintable — that thread
    // stays open (§3 law 6; it awaits YOU). The lanceTip anchor is the easy first
    // mark (L183 promotion: on a V2 boss the anchor is paintable too).
    lockParts: [
      { part: 'trophyCharm0' }, { part: 'trophyCharm1' }, { part: 'trophyCharm2' },
      { part: 'trophyCharm3' }, { part: 'trophyCharm4' },
    ],
    // §5j the scripted entrance (entranceScripts.js): fades in riding at your
    // shoulder, rel rock-steady, while the stat-taunt lands. Zero shots (Mantis).
    entrance: 'itKeptCount',
    // §5j the diegetic Psycho Mantis: boss.js quotes the player's REAL ledger
    // (deaths per boss) in the announce and flares the TOP KILLER's charm mid-hold
    // (the MANDATORY escalation hinge; fresh-save fallback wired).
    statTaunt: true,
    // §5f the roster's ONE hold-breaker: a single slow, survivable, PARRYABLE amber
    // fired INTO the reveal hold — the trophy-hunter has no honor.
    holdBreaker: true,
    // §5i.C Decision C1: the reflect-once RIPOSTE — from P2 (the WEARS THE HORN —
    // Riposte card) on, once per phase, it PARRIES your reflected bullet (cross-swat
    // + amber flash) and returns it slow + amber (re-reflect it). The full TENNIS
    // RALLY + REFLECT-ONLY SEAL stays deferred C2 scope (its own PR).
    reflectRiposte: { fromPhase: 1 },
    // §5i.B the Calamities graze debut for slot 9 — HOLD-UNTIL-FLINCH: a discrete
    // stare-down in the lance's threat-line (escalating tiers → the amber flinch),
    // once per phase. NOT slot 6's continuous beam-ride (the graze-ladder law).
    grazeForm: 'holdFlinch',
    // §5e moving-station setpiece (P2 entry): the FLANK CUT-IN — draws level on the
    // flank and cuts ACROSS your lane at rel ~8 (the L140 proximity near-pass),
    // firing the whole way.
    setpieces: [
      { id: 'flankCutIn', atPhase: 1, dur: 6.0, moving: true },
      // §5f the DREAD beat, AUTHORED (the grandeur redo's #1 lift — the audit's
      // "a lore-quote with zero authored visual"): at P3 entry the duelist RISES
      // over your lane and the lance WRITES the verdict at screen scale in
      // Voidmaw's violet (the model keys on `dread` via setSetpiece) while the
      // card fires boss-1's dread set beneath it. Moving: it fires the whole way.
      { id: 'voidmawVerdict', atPhase: 2, dur: 7.5, moving: true, dread: true },
    ],
    // bossgate capture: the r3 dart footwork moves the body ~15u/s mid-hop, hitting
    // the tool's documented two-frame mask/screenshot race (the marrowcoil pale-slide
    // twin) — freeze the sim for the grab pair. NOT a G-law override; no thresholds change.
    gate: { freeze: true },
    scale: 2.0,              // a lean dragon-PEER, NOT a colossus — tuned up from 1.5 so the studio
                             // fight-frame reads at band presence (G4) without bulking the mesh (L140)
    hpMax: 440,              // Tier-3 band 360–450; the slot-9 PEAK sits high (the sawtooth crest)
    // Precision jobs (§5f), tightening toward the dread: aimed/crossfire/stream — the
    // duelist's exchange, almost no fills. Every phase carries an amber carrier so the
    // lance-tip organ always serves parry fuel (amberdiet, §5i C.1).
    phases: [
      { atFrac: 1.00, cadence: [1.4, 1.8], attacks: ['aimed', 'crossfire'] },            // P1: the duel opens
      { atFrac: 0.55, cadence: [1.3, 1.6], attacks: ['aimed', 'crossfire', 'stream'] },  // P2: it presses
      // P3 QUOTES boss-1's dread set VERBATIM (aimed/fan/tunnel — Voidmaw's P3;
      // §5f "it fires boss 1's dread card back at you, violet-scarred") at
      // Calamity cadence. 'aimed' keeps the amber carrier (amberdiet §5i.C.1).
      { atFrac: 0.25, cadence: [1.2, 1.5], attacks: ['aimed', 'fan', 'tunnel'] },        // P3: Voidmaw's Verdict (dread)
    ],
    cards: [
      { id: 'karnvow_gambit',  name: 'IT KEPT COUNT — Opening Gambit',     atFrac: 1.00, timer: 24 },
      { id: 'karnvow_riposte', name: 'WEARS THE HORN — Riposte',           atFrac: 0.55, timer: 26 }, // the parry beat
      { id: 'karnvow_verdict', name: 'WEARS THE HORN — Voidmaw’s Verdict',  atFrac: 0.25, timer: 28, dread: true },
    ],
    // §5i AGGRESSION EXCHANGE — tight, initiative-driven, SHORT rests: a BIMODAL trade
    // of quick jabs (the short mode) and a measured riposte-beat (the long mode),
    // tightening each phase. Distinct from ashtalon's long uniform ambush-rest and
    // thrumswarm's relentless narrow thrum (rhythmprint KS-floor). All phases carry an
    // amber carrier (aimed/crossfire/stream) → the lance organ always serves parry fuel.
    // The "your parries steal its tempo" reactive layer is a CP2 enhancement (Decision C).
    rhythm: {
      signature: 'aggression-exchange',
      ticket: { bpm: 100, quantize: '1/8' },
      phases: [
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.4 }, { kind: 'burst', attack: 'crossfire', count: 2, gap: 0.45 }],
          restLo: 0.55, restHi: 1.4, restDist: 'bimodal' },
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.35 }, { kind: 'burst', attack: 'crossfire', count: 2, gap: 0.4 }, { kind: 'sustain', attack: 'stream', beats: 2, gap: 0.4 }],
          restLo: 0.5, restHi: 1.25, restDist: 'bimodal' },
        // P3 phrase carries the QUOTE (aimed/fan/tunnel — boss-1's dread verbs) at the
        // exchange's own bimodal tempo: still KARNVOW's rhythm, wearing Voidmaw's horn.
        { phrase: [{ kind: 'burst', attack: 'aimed', count: 2, gap: 0.35 }, { kind: 'burst', attack: 'fan', count: 2, gap: 0.4 }, { kind: 'sustain', attack: 'tunnel', beats: 2, gap: 0.35 }],
          restLo: 0.45, restHi: 1.15, restDist: 'bimodal' },
      ],
    },
};
