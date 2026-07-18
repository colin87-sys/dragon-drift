# DRAGON DRIFT — UI/HUD Art-Direction Critique
(Produced by a critique agent, 2026-07-14, from full code read + live headless screenshots at 844×390 landscape and 390×844 portrait, dsf 2, WebGL rendering under the DOM chrome. Screenshots in scratchpad/critique/.)

## 1. Overall verdict — **5.5 / 10 premium**

This is a UI that has clearly been through several serious passes and it shows: there are real motion tokens (`--t-micro/--t-ui/--t-screen`, style.css:6-9), a named warm design system (`--rf-*` tokens, style.css:14-26), custom-styled range inputs (style.css:1003-1021), `env(safe-area-inset-*)` everywhere, an exhaustive `prefers-reduced-motion` story, and a genuinely good pause card. The bones are better than 90% of web games. What keeps it out of premium territory is **entropy and unfinished migration**: two color generations (navy-blue legacy vs. warm ember) coexist on the same screens; 37 distinct px font sizes and ~17 border radii with no scale; five different panel languages; a shipping dev build-stamp on every frame; landscape layouts that visibly break (splash text over the dragon, shop content below the fold, pause footer unreachable, rail buttons overlapping copy); and micro-HUD elements (surge gems, distance, hearts) tuned so quiet they fall below legibility on bright biomes. Genshin or Sky read as *one hand* drew everything; Dragon Drift reads as one talented hand drawing over three older hands, with the tape still visible.

## 2. Screen / element inventory

**Boot & menus:** load screen (index.html:26-31, style.css:53-78) · attract splash (splash.js, style.css:1904-2052) · hero start hub (ui.js:1535-1611, style.css:1785-1895) · shop with 4 tabs — dragons hero-select / riders / music / style (ui.js:1714-1835, style.css:1049-1342) · full-screen inspect showcase (ui.js:184-437, style.css:2156-2350) · settings (ui.js:1837-1991) · quests (ui.js:1613-1647) · daily (1649-1669) · boss rush (1671-1712) · pilot (pilotScreen.js) · pause hub (ui.js:2141-2234, style.css:954-1031) · recap/game-over (recap.js) · celebrate overlay (ui.js:1408-1449) · revive offer (style.css:733-743).
**In-flight HUD:** hearts, pause btn (top-left) · distance/best (top-center) · score, embers, chain, graze, race-bar (top-right) · stamina arc + seal (center) · surge gem row + flow crest (bottom-center) · reticle + lock pips/marks (reticle.js, lockLayer.js) · popups ×2, feat toast, hint pill, milestone banner · boss warn/danger/note/title-card/felled-card/spell-card · vignette/flashes/speedlines · gesture tutorial · cinebars · build stamp (main.js:65-78).

## 3. Critique by screen

### 3.0 Global systems

- **[BLOCKER] The dev build stamp ships to players.** `main.js:65-78` appends `build 2ae201e42a5b` at 50%-white monospace, `z-index:9999`, bottom-right of *every* frame — splash, gameplay, recap. No AAA game watermarks its retail build. This single element reads "student project" more loudly than anything else in the product. Gate it behind `?debug`.
- **[BLOCKER] Two color generations coexist.** The "Reforged warm ember" system (style.css:14-26) never finished evicting the old navy/cyan theme. Warm screens still contain: navy `.nextup-card` `rgba(20,48,86,0.65)` with cyan `#3fd8e8` header (1509-1512) sitting inside the warm recap; navy `.radio-name` `rgba(8,18,38,0.7)` and *blue* `.mute-btn` `rgba(20,40,80,0.55)` / `#aad4f0` (689-697) inside the brown-glass pause card (blue circular buttons on a brown panel); navy `.form-arrow` `rgba(18,30,58,0.7)` (1158); navy inspect modal `rgba(26,36,66,0.97)` (2182); navy celebrate card `rgba(28,44,86,0.92)` (1677); blue `.bar` chrome `rgba(160,210,255,0.28)` (125); page background `#1c2e5e` (48). Each is defensible alone; together they read as unfinished migration, not a two-tone palette.
- **[MAJOR] No typographic scale.** 37 distinct px font sizes (8→66px), plus ad-hoc letter-spacing values (0.3px…26px, and em-based on boss cards). Premium UIs run 6-9 sizes on a ratio. Same for radii: 5,6,7,8,9,10,11,12,13,14,15,16,18,20,22,24px + pill — no system.
- **[MAJOR] Five panel languages.** Warm glass 20px (`.pause-menu`, 955-962) vs. flat brown 10px (`.mission-card`, 824) vs. navy 12px (`.nextup-card`) vs. dark-glass 16px (`.skin-card`, 1074) vs. navy 18px (`.celebrate-card`) vs. warm 22px (`.gx-card`, 2358). Shop ≠ settings ≠ pause ≠ recap in border, fill, and radius.
- **[MAJOR] Iconography is half-systematized.** A clean custom SVG line-icon set exists (ui.js:59-85 — genuinely good) but sits next to raw emoji/dingbats: `🔒` lock overlays (style.css:1335, ui.js:1973), `🪶` feather, `🔥` streak, `⚠ WARNING ⚠`, `♪`, `➤` in the primary CTA (ui.js:1606), `⟲ drag to rotate`, `◀▶‹›` arrows, `♥` hearts (style.css:358). Emoji render differently per platform — the padlock in the dragon rail is the classic F2P-web tell.
- **[MAJOR] Zero keyboard focus states.** No `:focus` / `:focus-visible` rule in the entire 2498-line stylesheet, in a game that explicitly advertises "WASD/Arrows… press ENTER to fly."
- **[MINOR] Number formatting is inconsistent.** Wallet renders `1240` in the topbar chip (ui.js:1562) but `1,240` in pilot (`toLocaleString` used only sometimes).
- **[POLISH] Hover-first micro-interactions on a mobile-first game.** `.skin-card:hover` lift (1080), `.hero-gear:hover` rotate (1806), `.form-arrow:hover` — none have touch equivalents beyond a generic `:active` scale.

### 3.1 Load screen & splash

- **[CREDIT]** The portrait splash is the best frame in the game — real scene, gold wordmark, restrained motion (glow-only CTA pulse, style.css:2010-2013 even has a comment about avoiding transform jitter). This *is* premium.
- **[BLOCKER] Landscape splash layout collapses.** `clamp(54px, 21vw, 116px)` (style.css:1962) caps the title at 116px × two lines ≈ 230px of a 390px viewport; "DRIFT" lands directly on the dragon and course, and the slogan sits mid-frame over the hero. `justify-content: space-between` (1911) has nothing left to space. Needs a landscape variant (one-line title, smaller clamp).
- **[MAJOR] The slogan "◆ it's a skill issue ◆" (splash.js:51).** Meme-speak in italic on the very first frame, under a premium gold wordmark, above the earnest "Evolve. Drift. Conquer the skies." Tonal whiplash. Undercuts the fantasy the rest of the art direction is selling.
- **[MINOR]** Load screen is still full legacy-blue (`#274a86` radial, cyan tip text `#9fd8f0`, style.css:57-72) — the player's first 3 seconds are in the *old* palette, then everything warms up.

### 3.2 Start hub

- **[CREDIT]** Portrait hub is close to shippable: one CTA, clean top bar, staged entrance choreography (`hero-intro` delays, 1890-1895), drifting embers. Good hierarchy.
- **[MAJOR] Landscape collision:** "or press ENTER to fly" renders *behind* the bottom icon rail (PILOT/QUESTS/SHOP/DAILY buttons overlap the copy). `.hero-rail` is absolutely positioned (1839-1842) and the centered `.hero-core` doesn't reserve space for it.
- **[MAJOR] The backdrop is illegible mush.** The hub inherits `.screen`'s `backdrop-filter: blur(3px)` + heavy radial scrim; at 844×390 the "live 3D menu scene" reads as a brown smear — you cannot tell there's a dragon back there. Genshin's menu keeps its character *sharp* and scrims only behind text. Either show the scene or don't spend GPU blurring it.
- **[MINOR]** Notification badge dots (`.badge`, 1763-1767) on PILOT and DAILY are identical pulsing gold dots with no count and no distinction; in portrait pause one badge visually detaches and floats over the button edge.
- **[MINOR]** Instruction line "WASD/Arrows to steer · SPACE to boost · double-tap a direction to barrel roll" is a control dump on the title screen; redundant with the gesture tutorial.

### 3.3 Shop

- **[CREDIT]** Portrait dragons tab has a real character-select feel: live turntable dragon, form segmented control, one CTA, thumbnail rail. Structure is right.
- **[BLOCKER] Landscape shop is broken as shipped.** Name/stats/CTA sit below the fold (SPEED row clipped at viewport bottom), the giant mint course-ring visually screams through the middle of the layout, tabs float over a blown-out white-gold band (the de-dimmed live scene, `.screen.shop-screen` 1277-1279), and the `.screen-topbar`'s 80%-solid gradient (1054) cuts a hard horizontal edge across the frame.
- **[MAJOR] Stat bars are meaningless.** SPEED/AGILITY/STAMINA all read 99/99/99 with full bars for the equipped flagship (`inspectStatRows` normalizes against `DRAGON_STAT_CAP`, ui.js:148-161, then maps to 40-99). A stat block where everything is maxed communicates nothing and reads as fake-depth F2P chrome.
- **[MAJOR] CTA overloading:** the one big button reads "✓ EQUIPPED · 60k m to ascend" — a state label, a progress gate, and an action crammed into a single green pill. AC7/GoW separate state (badge) from action (button).
- **[MINOR]** Music tab discs are flat navy circles with a gold ♪ (style.css:1193-1203) — placeholder-grade iconography next to the 3D dragon turntables one tab over; the navy disc is again the *old* palette.
- **[MINOR]** Locked dragons in the rail are dimmed canvases with an emoji padlock (1335). Rarity gem dots (`.tgem`) are 8px squares with no legend.
- **[POLISH]** `share-hint` footer copy under every tab is set 12px `--rf-ink-2` — good instinct, but each tab's hint is a different voice/length.

### 3.4 Settings

- **[MAJOR] It's a 13-group wall of identical ON/OFF pairs.** Twenty settings groups in one endless center column (ui.js:1860-1991), most rendered as two 50%-width segmented buttons where the *selected* one is bright gold — including when the selection is "OFF" (three consecutive gold "OFF" buttons). Gold = affirmative everywhere else in the game; here gold = "current," so the brightest things on screen are features you *don't* have. Premium settings use switches with a single accent-on state.
- **[MAJOR] Ergonomics: the only exits are a `← BACK` button at the very bottom of a ~4-screen scroll (ui.js:1991) or an undiscoverable blank-tap.** No sticky topbar here (unlike shop/quests — inconsistent chrome between sibling screens), the `SETTINGS` h1 scrolls away, and there's no section grouping (GRAPHICS / ASSISTS / AUDIO headers) — "(Experimental.)" prose paragraphs eight times over is changelog copy, not player copy.
- **[MINOR]** `DEV MODE` and `RESET ALL PROGRESS` sit in the same visual language as GRAPHICS QUALITY. The armed-red confirm (`danger-armed`, style.css:1231-1234) is good; the placement isn't.

### 3.5 Quests / Daily / Rush

- **[MAJOR] Sticky-topbar overlap bug:** the "NEXT UP — Azure Drake" line renders half-hidden *under* the translucent QUESTS topbar at rest. (`.screen:has(> .screen-topbar)::before { content:none }`, style.css:1066, removes the spacer that would have prevented this.)
- **[MAJOR] Landscape emptiness:** all cards are `min(440px, 88vw)` centered (823, 840), leaving ~200px of dead void per side at 844px wide; the daily screen is one small card floating in blur-nothing. No two-column landscape layout exists anywhere in the meta.
- **[MINOR]** The weekly rows misalign: label / bar / reward columns have no shared grid (`flex-basis: 52%`, 1535), so bars start at different x per row length.
- **[MINOR]** `FLY DAILY` is the game's only purple button (`.btn-daily`, 943-944) — an accent introduced for exactly one control. Accent roles (gold=action, cyan=stamina, magenta=danger, jade=lock) are otherwise disciplined; purple-for-daily is unearned.

### 3.6 Pilot

- **[MINOR]** Four different chip styles in one row (LV pill, «Skylark» italic gold-bordered, feats hex chip, wallet chip). Feat cards themselves are clean; the claimable gold-border + pulsing dot + CLAIM button treatment (style.css:1574-1586) is the right pattern.
- **[POLISH]** `SKILL` category label at 11px/3px-tracking gold (1556) is nice — but the same label style appears as `.nextup-head` in cyan and `.weekly-head` in peach: three colorways of one component.

### 3.7 Pause

- **[CREDIT]** The pause card is the most premium composed surface in the game: gold filigree corner spark, warm glass, stat strip with tabular numerals, tabbed body (style.css:954-1031). The two-step armed EXIT (`ABANDON RUN?`) is genuinely AAA-grade interaction design.
- **[MAJOR] Landscape clipping:** `max-height: min(78vh, 660px)` (962) = 304px at 390px height — the card cuts mid-MUSIC-row and the entire footer (wallet, PILOT/SETTINGS/SHOP/EXIT) is scrolled out of existence with no scroll affordance. A player pausing in landscape (the primary play orientation!) cannot see "EXIT TO MENU" exists.
- **[MAJOR] Portrait footer wrap:** the wallet line wraps into a broken 3-line stack "◆ / 1240 / · LV / 7" because `.pm-wallet` is `flex:1` beside a 4-button nav in a 390px card.
- **[MINOR]** Blue radio chrome inside the warm card; the `♪ Skybound` track pill is navy `rgba(8,18,38,0.7)` (1026).

### 3.8 In-flight HUD

- **[CREDIT]** The philosophy — "beauty-first minimal vitals" (style.css:343-345), hearts + arc + bare gems, corner anchoring with safe-area math — is the correct premium instinct. The score's tiered warm-up (137-139) and Russo One tabular numerals are good.
- **[MAJOR] The surge gem row is invisible at rest.** Unlit gems are `rgba(255,210,150,0.18)` 11px diamonds (505-507) floating unanchored over bright water at bottom-center — they read as sensor dust. An empty resource meter that can't be seen can't create desire to fill it. (Compare AC7: every gauge owns a quiet chrome frame.)
- **[MAJOR] Top-center distance is under-weighted.** `.dist` = 13px, `letter-spacing:2px`, `opacity:0.75`, no text-shadow beyond inherited (338) — "403 m" over a bright sky is thin, low-contrast, and *this is the endless-runner's primary metric*. Meanwhile score (a secondary number for many players) is 40px with a triple glow. Hierarchy inverted.
- **[MINOR]** Hearts are 15px text glyphs (`♥` via `::before`, 358) with a 1px drop-shadow — at arm's length on a phone over the white sky band they're sub-legible; and heart = health while diamond = ember + diamond = surge gem uses two diamond meanings in one HUD.
- **[MINOR]** Reticle stacking: the mint gate-reticle squares, the white ring-focus circle, *and* the ring's own glow all overlap in a ~120px cluster around the dragon — three concentric UI ornaments competing (style.css:552-563 + WebGL ring). The lens2 bracket work (600-685) shows the team knows how to hollow chrome; the base game still ships the busy version.
- **[MINOR]** `graze-hud` "0 SKIMS" (top-right teal) shows a zero count permanently during a boss — counters should appear on first increment (the chain counter already does this correctly, 157-162).
- **[POLISH]** Popup slots (top 22-38%: popup, popup2, feat-toast, milestone banner) are all center-screen text with different fonts/sizes/colors per type — a single anchored toast lane would read calmer.

### 3.9 Boss UI

- **[CREDIT]** The FromSoft-style title card (name / thin accent rule / epithet, 276-292), the FELLED card, and the lower-right spell card with accent edge (314-336) are the strongest *system* in the UI — role-locked colors, non-blocking, collision-managed slots. The WEFTWITCH stitch-pin banner (183-213) is auteur-level flourish.
- **[MAJOR] The boss HP bar is an unframed floating sliver.** The boss's health is a tiny segmented red/pink bar hovering over the model with no housing, no name attachment, no tick marks — at real distance it's a lens flare. Every reference game (Genshin, GoW, AC7) gives the boss bar architectural chrome: a frame, a nameplate, phase pips. The DOM boss *cards* got the love; the *bar* (WebGL side) didn't.
- **[MINOR]** `⚠ WARNING ⚠` uses the emoji warning glyph inside Russo One (535, style.css:174-176) — platform-variable rendering in the single most cinematic moment. Draw the triangle.
- **[MINOR]** Spell card typography: "HOLLOW — Opening Verdict" white-on-magenta-gradient wedge is legible, but its 3px right-border + inset glow (316-319) is a *sixth* panel language.

### 3.10 Recap

- **[MAJOR] Record inflation destroys trust:** a 9-point run shows two glowing gold "★ HIGH SCORE / ★ LONGEST FLIGHT" chips (because a fresh save has no prior best — any new player's first runs do exactly this). Celebrating trash runs teaches players the celebration is noise. Gate chips on non-trivial values.
- **[MINOR]** "+0 XP" renders on the XP row — a zero-delta line should be suppressed (recap.js xp row / `.xp-gain`).
- **[MINOR]** The navy NEXT UP card breaks the warm recap palette right at the screen's most important call-to-action.
- **[CREDIT]** Ledger cascade with per-line `--d` delays + reward-pop sparkles (style.css:1460-1506) is a properly staged reward moment; count-up + settle pop is right.

## 4. Top 10 highest-impact weaknesses (ranked)

1. **Shipping dev chrome** — the permanent `build …` watermark on every frame (main.js:65-78). One-line fix, instant credibility gain.
2. **Landscape is a second-class citizen with visible breakage** — splash text over the hero (style.css:1962), shop content below the fold, pause footer unreachable (962 → 304px card), hub rail overlapping copy. The game's own play orientation.
3. **Unfinished palette migration** — navy/cyan legacy components inside warm-ember screens (nextup 1509, radio row 689/1026, form arrows 1158, inspect modal 2182, load screen 57, page bg 48).
4. **No typographic/radius/spacing scale** — 37 font sizes, ~17 radii, ad-hoc tracking; the single biggest "almost premium but not" signal across every screen.
5. **Boss HP bar has no chrome** — the climactic fight's central gauge is an anonymous floating sliver while the supporting cards are excellent.
6. **Settings is a wall of identical gold ON/OFF pairs with "(Experimental.)" changelog prose and a bottom-only exit** (ui.js:1860-1991) — the least premium screen in the game.
7. **Invisible micro-HUD** — surge gems at 0.18 alpha (505), 13px/0.75-opacity distance (338), 15px text-glyph hearts (356): the three always-on vitals all sit below comfortable legibility over bright biomes.
8. **Emoji/dingbat iconography leaking through the custom SVG set** — 🔒, ⚠, ♪, ➤, 🔥, 🪶, ♥ (ui.js:1973, style.css:1335, 174, ui.js:1606, 1666, 1637, style.css:358).
9. **Meaningless 99/99/99 stat bars and overloaded CTAs in the shop** (ui.js:148-161; "✓ EQUIPPED · 60k m to ascend") — fake depth where premium games show real differentiation.
10. **Trust-eroding celebration logic** — gold record chips on 9-point runs, "+0 XP" rows, permanent "0 SKIMS" counter (recap.js:158-174, ui.js graze block 788-795).

**Credits to preserve:** motion-token discipline, the pause card, the boss title/spell-card system, safe-area rigor, styled range inputs, reduced-motion coverage, and the two-step armed destructive confirm. Any redesign should treat these as the quality bar the rest must rise to, not things to replace.

## 5. Screenshots
In `/tmp/claude-0/-home-user-dragon-drift/399dc339-7a2d-5bdc-8761-b39b70eb65a7/scratchpad/critique/`: splash (landscape broken, portrait strong), start hub both orientations, shop tabs (landscape below-fold breakage), settings wall, quests/daily (topbar overlap, landscape emptiness), pilot, pause both orientations (clipping + wallet wrap), in-flight HUD both orientations (gem invisibility), boss fight (unframed HP sliver, spell card), recap (inflated record chips, +0 XP).
