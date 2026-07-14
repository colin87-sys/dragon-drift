# Dragon Drift — Premium Menu / UI / HUD Overhaul

**Target: push the UI from the audited 5.5/10 to a 9–10/10 premium feel**, inside the hard
constraints — **vanilla Three.js r160, no build step, DOM/CSS UI over the WebGL canvas,
100% procedural chrome (inline SVG + CSS, zero new asset files), 60fps on weak mobile.**
Reference bar: Ghost of Tsushima's title theater, Elden Ring's hairline restraint, the
Hoyoverse mobile package — in a browser.

> **This is the single source of truth for the UI overhaul** — the sibling of
> [`GRAPHICS-OVERHAUL.md`](./GRAPHICS-OVERHAUL.md) and it runs on the same governance:
> the **Fable Quality-Gate protocol** (Gate 0 kickoff → Gate 1 pre-build → Gate 2 pre-merge
> → Gate 3 phase review; verdicts logged in the Gate Log at the bottom), lessons as new
> `leapfrog/lessons/<date>-ui-…` files, one initiative per PR, **coexist → prove on the
> hero → migrate — never break the shipped roster.** There is no WebGL in CI: headless
> tests + the new `uishots` montage are the automated checks; the **human judges motion
> and feel on the PR preview.**

Inputs this plan synthesizes: a 15-pattern AAA research report and a full file:line
art-direction critique (5.5/10 verdict, top-10 weakness ranking, credits-to-preserve).
Both are folded in below — this document is self-sufficient — but the full source
reports are committed alongside for sessions executing the phases:
[`UI-PREMIUM-RESEARCH.md`](./UI-PREMIUM-RESEARCH.md) (patterns + motion numbers + perf
caveats + anti-patterns) and [`UI-PREMIUM-CRITIQUE.md`](./UI-PREMIUM-CRITIQUE.md)
(the per-screen findings with every file:line).

---

## A. North star — the **EMBERLINE** design language

> **EMBERLINE: one hairline of dragonfire over a living sky.**
> Near-monochrome warm glass, 1px gold hairlines, big letterspaced Russo One display
> against small quiet Rajdhani text, four role-locked accents and nothing else, every
> menu a *camera shot* of the real world, everything animated in and nothing popping.

The game already owns the ingredients (the warm `--rf-*` system, the loved FromSoft boss
cards, the pause card, motion tokens). EMBERLINE is those ingredients made **law** —
the critique's core finding is not "wrong design" but **entropy**: 37 font sizes, ~17
radii, five panel languages, two color generations. The constitution below is what every
initiative migrates *toward*. Nothing ships that isn't written in it.

### A.1 The token constitution (lands verbatim in `css/style.css :root`, Phase 0)

```css
/* ===== EMBERLINE constitution (UI-PREMIUM-OVERHAUL.md §A) ===== */
:root {
  /* -- TYPE SCALE: six sizes, ~1.35 ratio. Russo One = display, Rajdhani = text.
        RULE: no px font-size outside these tokens on a migrated screen (lint-enforced).
        The WORDMARK is the ONE sanctioned exception family: the splash title clamp
        (style.css:1962) AND the hub hero-wordmark (66px / 40px mobile, 1813/1368). */
  --fs-micro:  11px;                      /* caps meta labels · Rajdhani 700 · caps */
  --fs-label:  13px;                      /* chips, secondary · Rajdhani 600 · caps */
  --fs-body:   15px;                      /* body copy        · Rajdhani 500 */
  --fs-title:  20px;                      /* card/section head· Russo One   · caps */
  --fs-head:   28px;                      /* screen h1        · Russo One   · caps */
  --fs-display: clamp(34px, 8vw, 48px);   /* hero numbers, boss names · Russo One */

  /* -- TRACKING: em-based ONLY (px tracking is evicted with the migration).
        tabular-nums on every numeral, everywhere, no exceptions. */
  --track-body: 0.01em;   /* Rajdhani body */
  --track-caps: 0.12em;   /* all caps labels (micro/label) */
  --track-disp: 0.16em;   /* Russo One display lines (titles, h1, boss names) */

  /* -- RADII: exactly three + pill. --rf-swept (6px 20px 6px 20px) survives as the
        sanctioned hero-accent exception (CTA, boss cards). Everything else maps down. */
  --r-s: 6px;   /* chips, inputs, thumbnails */
  --r-m: 12px;  /* cards, rows, toasts */
  --r-l: 20px;  /* screen-level panels, modals */

  /* -- THE PANEL RECIPE (the one panel language; five legacy languages fold into it):
        warm glass fill + warm hairline + 1px inner top highlight + ONE soft shadow
        on the single active modal only. Never backdrop-filter (see A.4). */
  --panel-fill:   var(--rf-glass);
  --panel-line:   1px solid var(--rf-stroke);
  --panel-line-hi:1px solid var(--rf-stroke-hi);
  --panel-inner:  inset 0 1px 0 rgba(255,224,170,0.10);
  --panel-shadow: 0 20px 60px rgba(0,0,0,0.55);

  /* -- THE SCRIM RECIPE: asymmetric — heavy behind the text column, light where the
        hero (dragon) is framed. The world behind must stay visible and ALIVE. */
  --scrim-ink: 12, 8, 6;   /* near-black warm, never pure black */
  --scrim-side: linear-gradient(90deg,
      rgba(var(--scrim-ink),0.72) 0%, rgba(var(--scrim-ink),0.38) 42%,
      rgba(var(--scrim-ink),0.06) 70%, transparent 100%);
  --scrim-foot: linear-gradient(180deg,
      transparent 0%, rgba(var(--scrim-ink),0.10) 55%, rgba(var(--scrim-ink),0.62) 100%);

  /* -- MOTION: extends the shipped trio (--t-micro 120 / --t-ui 220 / --t-screen 320,
        --ease-out, --ease-spring — all unchanged, protected). */
  --t-exit: 160ms;      /* exits are ALWAYS faster than entries */
  --t-stagger: 40ms;    /* sibling reveal step; cap ~12 individually staggered items */
  --ease-in: cubic-bezier(0.55, 0.06, 0.68, 0.19);   /* exits only */

  /* -- ACCESSIBILITY (wired in U14; defined now so HUD CSS references them) */
  --hud-scale: 1;
  --hud-alpha: 1;
}
```

### A.2 Accent-role table (withheld color — roles are earned)

The research says "one accent"; the critique credits our **four role-locked accents**
(boss cards depend on them). Reconciled: keep four roles, but each is *withheld* — used
only for its meaning, on an otherwise near-monochrome warm-glass UI.

| Role | Family | Allowed on | Forbidden on |
|---|---|---|---|
| **GOLD** (primary) | `--rf-e1/e2/e3`, `--rf-gold` | CTAs, selection, currency, records, wordmark | "current but OFF" states (see U5) |
| **CYAN/TEAL** (vital-cool) | `--rf-st`, graze green | stamina arc, graze/skim counters | any panel fill, any nav chrome |
| **MAGENTA/RED** (danger) | boss danger, fever | damage, warnings, armed-destructive, fever | rewards, decoration |
| **JADE** (success) | `#8affc0` family | quest done, unlock, equipped-badge | actions (gold owns action) |

**The navy-legacy eviction rule:** any UI *fill or background* whose blue channel
dominates is a previous color generation and gets replaced with warm tokens. Known
squatters (from the critique, verified against the code): `.nextup-card` (style.css:1509),
`.radio-name` (1026), `.mute-btn` (689–697), `.form-arrow` (1158), inspect modal (2182),
celebrate card (1677), `.bar` chrome (125), page background `#1c2e5e` (48), load screen
(57–72), music discs (1193–1203). The audit found more the critique missed — same rule,
same sweep: `.revive-offer` (736), `.hint` pill (1444), `.race-bar` (1411–1412),
the celebrate overlay scrim (1666), `.hero-gear:hover` (1806), `.load-bar` (66–67),
the inspect chrome cluster (`.inspect-btn`/`.inspect-close`/`.inspect-nav`/`.inspect-rothint`,
2159–2242), and the cool-ink `.screen` base radial (749 — replaced by the scrim recipe
in U4). Blue may only appear *by role* (cyan vitals). The one-off purple
`.btn-daily` (943) is evicted → gold.

### A.3 Interaction-state grammar (every interactive element, four visible states + focus)

- **Rest** — quiet; typographic, hairline, no filled button chrome ("Bootstrap in space" is the named anti-pattern).
- **Pressed** — scale 0.97 + brighten, response ≤50ms on `touchstart`/`:active` (touch-first; hover is a bonus, never the only feedback).
- **Selected** — accent underline/left-tick growing 0→100% over ~200ms + slight indent, NOT a filled pill.
- **Disabled** — 0.4 alpha, no interaction sound.
- **`:focus-visible`** — 2px gold outline, 2px offset. There are currently **zero** focus rules in 2498 lines of CSS while the game advertises keyboard play. Constitution-level fix.

### A.4 The backdrop-filter law (the mobile-perf trap, adjudicated)

Research verdict: real blur over an animating WebGL canvas re-blurs **every frame**;
budget on weak mobile ≈ **one** panel, and **zero during gameplay**. Current code has
**~12 backdrop-filter sites**, not two (audit-verified inventory): `.screen` blur(3px)
(750), pause card blur(14px) (961), gesture-tutorial `.gx-card` blur(14px) (2363),
inspect overlay blur(12px) (2172) + its chrome micro-blurs (2163/2194/2213/2242),
hub topbar chips / gear / rail buttons blur(6px) (1800/1804/1848), and the rothints
blur(5px) (1265/2242). Note: a `max-width:700px` media rule (1348) already kills the
`.screen` blur on portrait phones — it is live only on **landscape phones and desktop**,
exactly where the critique shot the "illegible mush." Ruling:

1. `.screen { backdrop-filter: blur(3px) }` is **KILLED everywhere** (U4) — the kill
   formalizes what portrait already does and extends it to landscape/desktop. It costs
   GPU *and* turns the live hero scene into "illegible mush" (critique 3.2) — worst of
   both worlds. Replaced by the asymmetric scrim recipe + optional in-engine dim/exposure
   drop (the menu owns the camera; render the mood instead of sampling it).
2. The **one-blur budget** goes to the frozen-world modal family: the pause card (961)
   and the gesture card (2363) — the world behind both is frozen and they never show at
   once. Both drop to ≤10px, wrapped in `@supports`, with the tinted-glass fallback.
3. **All other blurs die in U4's sweep:** the inspect overlay's blur(12px) folds into the
   panel recipe + scrim (it sits over a static shop scene but is a full-screen sample —
   the costliest kind), and every micro-blur on chips/buttons/rothints is removed
   (tinted glass + hairline reads identically at those sizes, at zero cost).
   New blur anywhere = Gate 2 reject.

Also constitution-level: **animate `transform`/`opacity` only.** Frequently-updated
meters using `width` transitions (e.g. `.bar-fill`, 126) migrate to `transform: scaleX()`.
`will-change: transform` only on per-frame projected elements (lock pips, damage arcs);
remove it everywhere else. Big soft shadows on many elements are paint cost — hairlines +
scrims carry depth; one shadow on the single active modal.

---

## B. Ranked initiative backlog *(effort S/M/L · risk · deps · file targets)*

Disposition of the critique's top-10 weaknesses: #1→U1 · #2→U3 · #3→U4 · #4→U2 · #5→U9 ·
#6→U5 · #7→U8 · #8→U7 · #9→U6 · #10→U1.

### U1 — Credibility floor — **S / low risk / no deps**
**Payoff:** delete every "student project" tell in one PR; the cheapest score points in the plan.
- Build stamp behind `?debug` only (`js/main.js:65-78`). `tests/buildstamp.mjs` boots with
  `?debug` already (audit-verified: `tests/browser.mjs` `boot()` defaults to
  `query='?debug'`), so it stays green; add one assertion that the stamp is **absent**
  without the param.
- Suppress "+0 XP" rows and gate the ★ HIGH SCORE / ★ LONGEST FLIGHT chips on non-trivial
  values + an existing prior best (`js/recap.js` — a 9-point first run must not celebrate).
- "0 SKIMS" appears on first increment, copying the chain-counter pattern (`js/ui.js`
  graze block ~788; pattern at `css/style.css:157-162`).
- Wallet numbers via `toLocaleString` everywhere (`ui.js:1562` vs pilot).
- Trim the hub's control-dump line (redundant with the gesture tutorial).
- The splash slogan "◆ it's a skill issue ◆" (`js/splash.js:51`): tonal whiplash under a
  premium gold wordmark. **Owner-approved: REPLACE** (decision recorded 2026-07-14; the
  owner delegated the call and accepted the replace recommendation). The committed line is
  **"◆ born of ember · forged in flight ◆"** — earnest, on the dragon-flight fantasy, ties
  the ember currency + the EMBERLINE language to the wordmark it sits under, and avoids
  repeating "skies" from the tagline below it. Same slot, same chrome: keep the ◆ frame,
  the italic Rajdhani `.splash-slogan` styling (style.css:1976–1985) and its breathe
  animation untouched — swap only the text at `splash.js:51`
  (`&#9670;&ensp;born of ember &middot; forged in flight&ensp;&#9670;`). No test pins the
  old string (audit-verified), so nothing else changes.

### U2 — The EMBERLINE constitution — **M / low / no deps**
**Payoff:** the §A token sheet lands as CSS variables **coexisting** with old values (zero
visual change on unmigrated screens); the focus/interaction grammar; the lint that makes
entropy structurally impossible again.
Files: `css/style.css` (`:root` block), new `tests/uitokens.mjs` (see §C verification —
a **shrinking allowlist**: unmigrated files are exempt, each phase removes exemptions).

### U3 — Landscape repair (first-class citizen) — **L / medium / U2**
**Payoff:** the game's own play orientation stops visibly breaking — currently blocker-grade.
- Splash landscape variant: one-line title, smaller clamp (`style.css:1962`), slogan/tag
  repositioned off the hero (`splash.js` markup + media query).
- Hub: `.hero-core` reserves space for the absolutely-positioned `.hero-rail`
  (1839–1895) so "press ENTER to fly" never renders under the buttons.
- Shop landscape: two-column (rail + hero left/right split) so name/stats/CTA never fall
  below the fold (`style.css:1049-1342`, `ui.js:1714-1835`).
- Pause landscape: footer (wallet + PILOT/SETTINGS/SHOP/**EXIT**) pinned outside the
  scroll region — note the markup makes the whole `.pause-menu` the scroll container
  (`overflow-y:auto` at 962), so this is a small restructure in `ui.js`
  `showPauseOverlay` (2211–2234): the scroll region becomes `.pm-body`, resume + strip +
  footer stay fixed; `max-height` rework (962 → 304px at 390px height is how EXIT
  vanished); portrait wallet wrap fix (985).
- Quests/daily: fix the sticky-topbar overlap (`:has` spacer removal at 1066) and add a
  two-column landscape grid so cards stop floating in dead void.
Verified by the `uishots` landscape set (§C) — this initiative is *why* the harness
captures both orientations.

### U4 — Palette & panel unification — **M / low-med / U2**
**Payoff:** "one hand drew everything" — the single biggest coherence jump.
- Execute the navy-eviction table (§A.2) file:line by file:line; warm the load screen
  (the player's first 3 seconds are currently in the *old* palette).
- Fold the five panel languages into the §A.1 panel recipe at the three radii; per-screen
  sweep: shop, settings, recap, celebrate, inspect, mission cards.
- **Kill** the full-screen `.screen` backdrop blur per §A.4; land the asymmetric scrims.
- Exit condition is greppable: `tests/uitokens.mjs` asserts the navy literals are gone.

### U5 — Settings redesign — **M / low / U2, U4**
**Payoff:** the least-premium screen becomes a quiet, grouped, exit-able instrument panel.
- Sections with caps micro-labels: GAME / GRAPHICS / ASSISTS / AUDIO / DATA; sticky topbar
  with BACK (same chrome as shop/quests — sibling screens must match).
- ON/OFF seg-pairs → single-accent **switches**: gold means ON, never "current". Three
  glowing gold OFFs in a row inverted the game's own color grammar.
- Player-voice copy replaces "(Experimental.)" changelog prose (8 occurrences).
- DEV MODE behind `?debug`; RESET ALL PROGRESS in a visually separated danger zone (keep
  the credited armed-red two-step confirm exactly as is).
Files: `ui.js:1837-1991`, `style.css` settings block. ZZZ rule applies: settings is a
high-frequency screen — it snaps, no theater.

### U6 — Shop hero-select composition — **L / medium / U2, U3, U4**
**Payoff:** the monetization-grade screen composes like a character select, not a form.
- Stat rows renormalized to **roster-relative** so bars differentiate (today
  `inspectStatRows` maps everything to 40–99 and the flagship reads 99/99/99 — fake-depth
  chrome; `ui.js:148-161`).
- CTA de-overload: state ("EQUIPPED" jade badge) ≠ progress ("60k m to ascend", quiet
  meta row) ≠ action (the one gold button).
- Soften the topbar's 80%-solid gradient hard edge (1054); scrim behind the text column
  only — the dragon stays sharp (Genshin rule).
- Music tab: navy ♪ discs → warm SVG waveform/rune chips; locked rail: emoji padlock →
  SVG lock + silhouette treatment; rarity gems get a legend line on inspect.

### U7 — SVG icon completion (emoji eviction) — **S / low / none**
**Payoff:** the half-finished icon system finishes; platform-variable glyphs stop leaking
into cinematic moments.
Extend the credited `ICONS` set (`ui.js:59-85`) with: lock, warning-triangle, note,
heart, feather, flame, play-glyph, chevrons. Replace all call sites (audit-corrected):
`🔒` (ui.js:1973, ui.js:1682 rush chip, style.css:1335), `⚠` in the boss warn (markup at
ui.js:535, styled at style.css:174-176 — the single most cinematic moment currently
renders an emoji), `♪` (ui.js:1791 music disc, 2157 pause radio pill, 1325 now-playing
toast, 2728 unlock glyph), `➤` in the primary CTA (ui.js:1606), `🪶` (ui.js:1637, 2206,
839) `🔥` (ui.js:1666, 2968), `♥` hearts (style.css:358 — becomes U8's SVG pips),
`⟲` `◀▶‹›`.

### U8 — HUD relegibility + relevance system — **L / medium / U2**
> **GOVERNED BY [`HUD-REDESIGN.md`](./HUD-REDESIGN.md)** (the EMBERSIGHT spec) — U8's
> scope is delivered by increments H1–H3/H6 there; the notes below stand as background.

**Payoff:** vitals you can read at arm's length over a bright biome — and a HUD that
earns its pixels by disappearing when irrelevant (the premium mobile look *and* an FPS win).
- **Chrome floor:** surge gems get a quiet hairline housing + unlit alpha 0.18 → ~0.35 +
  1px dark keyline (505–507 — "sensor dust" today); hearts → 18px SVG pips with dark
  keyline (358); distance — the endless-runner's *primary* metric — promoted to
  `--fs-title` Russo One tabular with a soft dark halo (today 13px @ 0.75 opacity, 338,
  while secondary score gets 40px + triple glow: hierarchy inverted).
- **Relevance table:** every element gets `{show-when, ghost-to, return}` — hearts hide
  at full health after ~3s; score ghosts to ~30% in calm cruise; gems full-strength only
  when a chain is active or near-full; distance always-on; everything returns in ≤150ms
  on damage/pickup/boss. Class toggles + opacity/transform only; the relevance ticker
  runs ≤4Hz, never per frame.
- **Single toast lane:** popup/popup2/feat-toast/milestone unify into one anchored,
  queued slot (GoW's single-slot message queue), one type style.
- Migrate frequently-updated `width`-transition fills to `transform: scaleX()` (§A.4).
Center stays sacred: nothing new near the reticle except what U9/U10 place there.

### U9 — Boss HP bar chrome — **M / medium / U2, U8**
> **GOVERNED BY [`HUD-REDESIGN.md`](./HUD-REDESIGN.md)** — U9's scope is delivered by
> increment H5 (the Mews plate) there; note `emit('bossHit')` already exists (boss.js:5520).

**Payoff:** the climactic fight's central gauge finally matches its excellent supporting
cast (title card / spell card / FELLED card — all credited, all protected).
Elden Ring grammar, DOM-side in a new `js/bossBar.js` (new files never conflict):
bottom-center hairline bar in a 1px housing; nameplate in display caps + epithet in
micro caps; **phase notches**; the **drain-lag chunk** (gold "recently lost" segment
drains after ~0.5s — the most-copied juice detail in boss bars); intro fill
left-to-right ~800ms synced to the title card. The current WebGL over-model sliver is
retired or reduced to a locator pip — never double-reported.
**Audit facts a builder needs:** the WebGL bar lives in `bossKit.js` `createBossCommon`
(hpBar group, 108–138) and *already carries phase notches* from `def.phases[].atFrac` —
the DOM bar inherits that data, it doesn't invent it. Boss health is module-state in
`boss.js` (`hp`/`hpMax`) pushed via `model.setHealth()`; **no JS-side getter/event exists
yet** — add one small exported seam (a `bossHealthFrac()` getter polled by U8's ≤4Hz
ticker, or an `emit('bossHp', …)` on damage; `emit('bossStart'/'bossEnd')` already exist
for show/hide). Bottom-center is contested: `.boss-note` sits at bottom 28% (style.css:248)
and the flow crest + surge row anchor bottom-center — the surge row ghosts during boss via
U8's relevance table, and the bar slots into the existing collision-managed boss-slot
system *above* `.boss-note`'s band. Mind `formLifebars` bosses (multi-lifebar refills,
boss.js:2160/3973) — the bar must re-fill on form swap, not read as healing mid-phase.

### U10 — Reticle / lock-on consolidation — **M / medium / U8**
> **GOVERNED BY [`HUD-REDESIGN.md`](./HUD-REDESIGN.md)** — U10's scope is delivered by
> increment H4 (the Lure) there; the flight-vector stretch goal is H9's flagged tether.

**Payoff:** one reticle authority instead of three concentric ornaments fighting in a
~120px cluster (gate squares + ring-focus circle + WebGL ring glow, style.css:552-563).
- Adopt the **lens2 hollow-bracket language** (600–685) as THE reticle. Audit correction:
  the bracket version is **already shipped and default-ON for the BOSS reticle** — it's
  the Bullet Clarity setting (`js/lensFlag.js`; `?lens=2/0` is only the A/B override) —
  while the busy nested-squares version still ships for the ring/gate reticles. So U10 =
  extend the proven bracket mask to the ring/gate states + retire the triple-ornament
  cluster, not "turn on an experiment."
- Lock-on grammar (Star Fox/AC7 lineage): bracket appears at ~3× and **shrink-snaps** to
  1× over ~150ms ease-out; searching-tick → solid lock tone (U11); lock pips stay DOM
  divs projected per frame with `will-change: transform` (`lockLayer.js` — already right).
- Two-part reticle (near cursor + flight-vector lead) is a stretch goal behind a flag.

### U11 — Procedural WebAudio UI soundboard — **S / low / none**
**Payoff:** research calls audio "half the premium feel" and the single highest-ROI
polish after motion; we're procedural-audio-native so it costs nothing.
New `js/uiSound.js`: runtime-synthesized 30–80ms blips — hover/move tick (filtered noise
+ sine, 2–4kHz), confirm (small upward interval), back/cancel (lower pitch), open-whoosh,
lock tick→tone, armed-danger. Attention hierarchy: critical > confirm > hover > ambient.
Rides the existing SFX bus + mute. First four sounds prove on the hero in Phase 1.

### U12 — Menu-as-camera-shot transitions — **L / HIGH risk / U4; last major initiative**
**Payoff:** screens stop being pages and become shots — the camera does the
expensive-feeling work for free.
**The law governs everything here** (LEAPFROG HANDOFF, ~20 rounds of scar tissue):
*"A menu is the real game world, reframed + frozen — never a mutated or reinvented one.
Decouple STATE, not RENDERING."* Concretely: every screen gets a named camera shot in the
**real env** (hub→shop = dolly to the dragon; hub→settings = slow drift + in-engine
exposure dim standing in for defocus — never DOM blur); only the *subject* (dragon)
changes; any FX hide is `.visible`-only and hard-gated by `game.state !== 'playing'`
(the shipped `hideShopFx` seatbelt is the template). Any menu **theming** is via COLOUR
only, never world displacement (the astral-shop caveat — prop recycling breaks are a
wall-class regression). DOM panels do cheap fade/slide synced to `--t-screen`.
ZZZ budget rule: theater on rare screens (shop entry, ascension); high-frequency screens
(pause, settings) snap. Files: `cameraController.js` (shot table), `ui.js`, `main.js`
hooks — land `main.js` edits early and tight (the GRAPHICS conflict lesson).

### U13 — Entry ritual + motion finish — **M / low / U2**
**Payoff:** the "crafted, not just designed" layer — pure theater, near-zero cost.
- Two-step title: wordmark + pulsing "TAP TO BEGIN" (opacity 0.5↔1.0, ~1.8s) → on input,
  wordmark rises, menu items stagger in at `--t-stagger` (cap ~12 individually staggered).
- Everything animates in, nothing pops; exits at `--t-exit`/`--ease-in`, always faster
  than entries; overshoot (`--ease-spring`) stays celebration-only (already law, 5).
- All number changes tween (count-up 300–500ms ease-out — the recap ledger already does
  this right; make it universal). Idle life: 1px shine sweep every 8–12s; if you notice
  the loop, it's too strong. Secondary-motion garnish (HSR dots/hairline sweeps trailing
  60–100ms) on hero moments only. All of it collapses to fades under
  `prefers-reduced-motion` (credited coverage — extend by construction).

### U14 — Compact accessibility package — **S–M / low / U2 (sliders+presets), U8 (immersive toggle only)**
**Payoff:** the 2024+ AAA care signal, nearly free in a CSS-variable UI.
`--hud-scale` (0.85–1.3) and `--hud-alpha` sliders in settings; colorblind-safe accent
alternates (deuter/prot/trit presets swap the magenta/jade hues via a root class — roles,
not colors, are the contract; **scope: DOM UI tokens only** — in-world WebGL hues like
wisp/bullet colors are out of scope here, though `setWispTint`/`setLanceTint` seams exist
if a later pass wants them); "IMMERSIVE HUD" toggle (Squadrons: hides all but hearts +
boss — also the screenshot generator); `:focus-visible` everywhere (from U2);
reduced-motion audit of every new system. **Phasing note (audit):** the sliders, presets
and focus work land in Phase 2 as planned; the IMMERSIVE HUD toggle rides U8's relevance
classes and finishes in Phase 3 — the Phase 2 row's "U14" means U14-minus-immersive.
**HUD-redesign note:** the immersive toggle + the per-element override matrix are now
specced in [`HUD-REDESIGN.md`](./HUD-REDESIGN.md) §F (they land with increments H3/H6).

### Killed / deferred (explicit, with reasons)
| Item | Verdict | Why |
|---|---|---|
| Full-screen `backdrop-filter` on `.screen` | **KILL (U4)** | Per-frame re-blur over an animating canvas — the #1 mobile-perf trap; also hides the hero scene we pay to render |
| Frosted-glass grids / blur on cards | **NEVER** | One-blur law (§A.4); tinted glass + hairline reads the same at zero cost |
| Real DOF / SVG filters (`feGaussianBlur`) in DOM | **NEVER** | Paint cost ≈ backdrop-filter; in-engine exposure/dim does the job (shop DOF is GRAPHICS N12's, in-engine, shop-only) |
| CSS-gradient faux-gold ornament borders | **NEVER** | The named asset-flip anti-pattern; without image assets, go minimal — hairlines ARE the ornament |
| Animating width/height/top/left/box-shadow on HUD | **KILL where found** | Layout/paint next to a 60fps canvas; `scaleX`/opacity only |
| Per-frame DOM text updates / class toggles | **NEVER** | Batch to value-change; projected markers update `transform` only |
| Haptics, localization pass, WebGL-rendered UI | **DEFER / out of scope** | DOM/CSS is the system; these don't move the premium score at this rung |

### Full-inventory disposition (audit 2026-07-14 — screens/elements the backlog didn't name)
| Surface | Disposition |
|---|---|
| Revive offer (style.css:733–743, navy) | U4 palette/panel sweep — panel recipe + warm tokens; behavior untouched |
| Hint pill (1442–1448, navy) · race-bar (1411–1419, navy) · first-flight chip (1422) | U4 navy sweep; race-bar + ff-chip also get U8 relevance conditions |
| Milestone banner · popups · feat toast | U8's single toast lane (already specced) |
| Boss Rush screen (ui.js:1671–1712) | Phase 2 wave with quests/daily (it shares the daily-card chrome) |
| Gesture tutorial (`.gx-card`, 2352+) | Protected (already warm/premium); its blur(14px) is governed by §A.4 ruling 2 |
| Cinebars (95–102) | Out of scope — pure black letterbox bars are already correct |
| Loading screen · inspect/showcase · pilot | Already in U4/Phase 2 (named there) |
| **The OLD root game** (repo-root `js/`, `css/`, `index.html`, root `tests/`+`tools/`) | **Explicitly OUT OF SCOPE.** This overhaul touches `reforged/` only; always use `reforged/tests` + `reforged/tools` (the root copies are the legacy game's) |

---

## C. Phased rollout

**Coexist → prove on a hero → migrate; never break the shipped roster.** Tokens coexist
with old values from day one; the hero surface proves the full language before any wave.
Each phase: pull `master` at start, one initiative per PR, Fable Gates 1+2 per PR,
Gate 3 at the boundary.

**The hero surface is the SPLASH → START HUB pair.** Justification: (1) it is the first
premium impression — the 5.5 verdict is formed in the first 10 seconds; (2) its portrait
version is already the best frame in the game (credited), so we're amplifying proven
bones, not gambling; (3) it exercises *every* system at once — tokens, scrim, landscape
repair, entry ritual, icons, sound, idle life — on the screen with the least gameplay
risk; (4) the real-world hero-scene tech behind it already works (LEAPFROG). The pause
card stays the internal quality bar; the shop is too entangled (stats, economy, 4 tabs)
to be a good first proof.

| Phase | Contents | Exit GATE — human judges (PR preview) | Exit GATE — headless |
|---|---|---|---|
| **0 — Credibility floor + constitution** | U1, U2, `uishots` harness lands and banks the 16-state baseline | Quick wins visible (no stamp, no +0 XP, no trash-run chips); *nothing else* changed; slogan replaced (owner-approved, see U1) | `tests/run-all.mjs` green (incl. `buildstamp.mjs` under `?debug`); `tests/uitokens.mjs` green (allowlist = everything); `uishots` baseline committed as artifacts |
| **1 — Hero: splash + start hub** | U3 (splash/hub slice), U4 (hub slice incl. `.screen` blur kill), U13 entry ritual on hero, U11 first 4 sounds, U7 hub call-sites | Both orientations premium: title theater, staggered reveal, sharp live scene behind an asymmetric scrim, no rail collision; sound feel; motion feel | `uishots --diff`: only splash/hub frames changed; uitokens allowlist shrinks (splash/hub files enforced); run-all green |
| **2 — Meta migration wave** | U3 + U4 remainder (shop, settings, pause, quests, daily, boss-rush, pilot, recap, celebrate, inspect, revive offer, load screen), U5, U6, U7 complete, U14 (minus immersive-HUD toggle → Phase 3) | Every meta screen reads as one hand; settings navigable; shop landscape composes; pause EXIT reachable in landscape | uitokens: **navy-literal eviction assert green**, allowlist ≈ empty for meta files; `uishots --diff` all meta states reviewed; run-all + shop/splash tests green |
| **3 — Flight HUD + boss** | U8, U9, U10 — **executed as [`HUD-REDESIGN.md`](./HUD-REDESIGN.md) increments H1–H6** (EMBERSIGHT; the flagged dragon-vitals increments H7–H9 may trail the phase boundary without blocking it) | Vitals legible over Frozen Reach / bright sky at arm's length; relevance fades feel right at speed; boss bar chrome + drain-lag lands the fight; reticle reads as one instrument | `uishots` HUD/boss states over a bright seeded biome; `tricount` + `tiershots` when WebGL is touched (ring retirement); no layout-prop transitions on HUD selectors (uitokens rule d); 60fps via `?debug=perf` on-device; plus the per-increment gates in HUD-REDESIGN §D |
| **4 — Theater finish** | U12, U13 complete, U11 full soundboard | Transitions travel through the world; high-frequency screens still snap; idle life invisible-but-alive; full-run feel check | Full `uishots` montage vs banked baseline; run-all green; Gate 3 Fable review scores the compound result vs the 9–10 bar |

### Verification plan

**Existing tools that apply:** `tests/run-all.mjs` (the headless suite — splash, shop,
appshell, recap, celebrate, buildstamp are already covered); `tools/tricount.mjs` +
`tools/tiershots.mjs` (only when U9/U10 touch the WebGL side); `tools/shopshot.mjs` /
`heroshot.mjs` / `inspectshot.mjs` (existing single-screen harnesses — superseded for
regression by `uishots` but kept for focused work).

**NEW `tools/uishots.mjs` — the UI regression harness.** The critique agent proved
headless WebGL screenshots work locally; codify its exact matrix. Built on the
`tests/browser.mjs` boot (the `shopshot.mjs` pattern: seeded save via `initScript`,
`?debug` query, state forced via query params / exported UI hooks):

- **States (8):** splash · hub · shop-dragons · settings · pause · in-run HUD (seeded) ·
  boss (title card + bar up) · recap.
- **× Orientations (2):** 844×390 landscape · 390×844 portrait, `deviceScaleFactor: 2`.
- **Output:** 16 PNGs + one montage → the artifact every Fable Gate reads.
- **`--diff` mode (audit-respecced for determinism):** the live scene animates and the
  splash/hub ember-mote layers are `Math.random`-placed, so a naive small-threshold
  pixel-diff **will flake**. Spec: uishots injects a `--static` seam before capture
  (CSS `animation-play-state: paused` + hide `.splash-embers`/`.hero-embers`/`.menu-motes`,
  and pin the run with `?seed=`), diffs **menu states** against banked baselines with a
  per-state threshold, and treats the **in-run HUD + boss frames as review-only** (capture
  + montage, no hard diff gate) unless the WebGL canvas region is masked out of the diff.
  Boss state is forcible headlessly via the shipped `?debug` seams
  (`__dd.spawnBoss()` / `__dd.bossForceFight()` — main.js:373+).
- CI has no WebGL (Chromium CDN blocked) — `uishots` runs locally/pre-PR like
  `gameshots`; its montage is attached to the PR and the human judges motion live.

**NEW `tests/uitokens.mjs` — the entropy lint (CI-safe, pure static).**
(a) every `font-size` in migrated files ∈ the six tokens (shrinking allowlist per phase);
(b) navy-literal eviction assert (Phase 2 exit); (c) `letter-spacing` em-only on migrated
selectors; (d) no transition/animation of layout properties (`width|height|top|left|
box-shadow`) on HUD selectors. **Scope (audit):** the lint must scan `css/style.css` AND
`js/*.js` template strings — JS-injected styles exist and would otherwise evade it
(e.g. the build stamp's inline `cssText` in main.js:72-75, inline `style="…"` attrs in
ui.js markup, splash.js ember styles). `tests/run-all.mjs` auto-discovers every
`tests/*.mjs`, so the lint joins the suite by existing. This test is what makes
"37 font sizes" (39 by the audit's count today) structurally unable to recur.

---

## D. The don't-break list

**Critique credits, protected verbatim:** *"motion-token discipline, the pause card, the
boss title/spell-card system, safe-area rigor, styled range inputs, reduced-motion
coverage, and the two-step armed destructive confirm. Any redesign should treat these as
the quality bar the rest must rise to, not things to replace."* Additionally credited and
protected: the portrait splash frame, the hub's staged entrance choreography, the shop
dragons-tab structure (live turntable + form control + rail), the recap ledger cascade,
the WEFTWITCH stitch-pin banner, the lens2 bracket language (it *becomes* the reticle),
the score tier warm-up, `--rf-swept` hero accents, and the claimable-feat card pattern.

**The menu law (LEAPFROG, verbatim):** *"A menu is the real game world, reframed +
frozen — never a mutated or reinvented one. Reuse the rendering pipeline; decouple
STATE (never modify the run / obstacles / player), not RENDERING; touch only the
subject (the dragon). Any 'hide gameplay element for the menu' MUST be `.visible`-only
and hard-gated by `game.state !== 'playing'`."* Plus the astral caveat: **theme via
COLOUR, never via world displacement.** The `hideShopFx` seatbelt in `main.js` is never
weakened.

**The 60fps constraint:** UI never adds per-frame layout or paint — `transform`/`opacity`
only; `will-change` only on per-frame projected elements; the one-blur law (§A.4); no
per-frame DOM writes beyond transforms; safe-area insets on every HUD anchor; touch
targets ≥44pt. The frame rate *is* the premium feel — a fluid fake beats a stuttering
real effect.

**Never break the shipped roster or game logic.** This overhaul is UI-layer; U9/U10 touch
WebGL only to retire chrome, behind flags, with `tricount`/`tiershots` gates.

---

## E. The premium score ladder (stop at any rung)

| Rung | What it takes | Why it's enough to stop there |
|---|---|---|
| **5.5 → 7** | Phases 0–1: credibility floor (stamp, +0 XP, trash-run chips, emoji in the CTA), the token constitution, the hero pair premium in **both orientations** | The amateur *tells* are gone and the first impression is genuinely premium; the rest of the game is merely "inconsistent," no longer "broken" |
| **7 → 8.5** | Phases 2–3: one hand everywhere (palette/panel/type unified, navy evicted), settings + shop redesigned, landscape whole, HUD legible + relevance-driven, boss bar chrome | Every screen and the moment-to-moment game read as one system; this is Hoyoverse-mobile territory and most players' ceiling of perception |
| **8.5 → 10** | Phase 4: camera-shot transitions through the live world, the procedural soundboard, motion finish (stagger/count-up/secondary motion/idle life), accessibility package | The layer nobody can name but everyone feels — theater, sound, and craft; this is what separates "very good web game" from "how is this a browser game" |

---

## Audit addendum (2026-07-14)

A full adversarial ground-truth pass verified every file:line claim against the code and
corrected the plan in place. What changed:

- **§A.4 rewritten:** the "violates this twice" claim was wrong — ~12 backdrop-filter
  sites exist; the ruling now enumerates them all (kill `.screen` + inspect overlay +
  every micro-blur; the pause card and gesture card share the one-blur budget). Also
  noted: portrait phones already run `.screen` blur-free (style.css:1348) — the kill's
  visible effect is on landscape/desktop.
- **§A.2 navy list extended** with audit finds: revive offer, hint pill, race-bar,
  celebrate scrim, `.hero-gear:hover`, load-bar, inspect chrome, `.screen` base radial.
- **U1:** buildstamp claim verified true (`boot()` defaults to `?debug`); slogan decision
  recorded — owner-approved REPLACE with "◆ born of ember · forged in flight ◆".
- **U7:** wrong emoji call-site lines fixed (`♪` is at ui.js:1791/2157/1325, not 1637;
  `⚠` markup at ui.js:535; added the 1682 rush-chip 🔒).
- **U9:** added the real plumbing facts — WebGL bar in `bossKit.js:108-138` (already has
  phase notches), no JS-side health getter exists yet (add one), `.boss-note` bottom-28%
  collision, `formLifebars` refill behavior.
- **U10:** corrected — the bracket reticle is shipped **default-ON** for bosses (Bullet
  Clarity, `lensFlag.js`); U10 extends it to ring/gate, it doesn't enable an experiment.
- **U14:** dep/phase contradiction fixed (immersive-HUD toggle → Phase 3); colorblind
  presets scoped to DOM tokens.
- **§C:** `uishots --diff` respecced for determinism (static seam, per-state thresholds,
  in-run/boss frames review-only); `uitokens` scope extended to JS-injected styles.
- **Gaps filled:** full-inventory disposition table (revive offer, hint pill, race-bar,
  boss-rush screen, gesture tutorial, cinebars) + the repo-root legacy game declared
  out of scope; §A.1 wordmark exception extended to the hub wordmark (66px).

**Residual risks a building session must verify on-device / on-preview:**
1. Killing the `.screen` blur changes menu legibility on landscape/desktop — the
   asymmetric scrims must land in the same PR (never ship the kill bare).
2. The `--static` uishots seam must not leak into shipped behavior (query-param-gated,
   like `?lens`).
3. U9's DOM boss bar over `formLifebars` bosses and during FELLED/revive beats
   (boss.js:2522+) needs live-fight eyes — the drain-lag chunk must not fight the refill.
4. Roster-relative stat bars (U6): several premiums share identical stat lines (e.g.
   three at 1.14/1.27/0.70/1.35, dragons.js:799/866/940) — identical bars for siblings is
   honest, but check it doesn't read as a bug on the rail; stats are per-dragon, not
   per-form, so scrubbing forms won't move bars.
5. Pause-card blur reduction (14→≤10px) is a visible change on the most-credited surface
   — human eyes on preview before merge.

## Gate Log

| Date | Phase/PR | Gate | Verdict | Score | Notes |
|---|---|---|---|---|---|
| — | — | 0 (kickoff) | pending | — | Spawn the high-effort Fable kickoff before U1 code |
| 2026-07-14 | Phase 3 scope | — | superseded | — | The **EMBERSIGHT** HUD redesign spec ([`HUD-REDESIGN.md`](./HUD-REDESIGN.md)) supersedes the in-place U8–U10 scopes; Phase 3 executes its increments H1–H6 (H7–H9 flagged) |
