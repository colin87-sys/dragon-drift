# Dragon Drift — Premium Welcome/Hub RESEARCH DIGEST

> Consolidated, adversarially-verified web research (6 threads) backing `WELCOME-HUB-REDESIGN.md`.
> Reference bar: Ghost of Tsushima / God of War / BOTW / Blizzard / Hoyoverse.

---

# DRAGON DRIFT — PREMIUM MENU RESEARCH DIGEST
*Consolidated by Fable from 5 verified research threads (one junk "test" thread discarded). Primary-sourced numbers are marked PRIMARY; craft-convention numbers are marked INFERRED — tune those on the LIVE portrait preview, never cite as fact. Every target below is achievable zero-asset, transform/opacity-only, 60fps-mobile, Menu-Law- and EMBERLINE-compliant.*

---

## SURFACE 1 — FIRST-TIME WELCOME / THE WOW (`splash.js`)

The convergent AAA "attract" beat is a **film title-card**: world first, chrome last, input invited only once the picture is composed.

1. **World-first, chrome-last reveal order** — 0–1s pure living world (dragon + ring + embers already moving, NO logo); 1–2.5s wordmark resolves; ~3.5–5s CTA fades up last; input invited ~4–5s. *(PRIMARY easing bands; INFERRED exact seconds.)* → **DD:** `splash.js` already frames the camera behind the dragon down the live mint ring; just **reorder its reveal** to this cadence — pure opacity/transform sequencing, no new scene.
2. **Wordmark resolves like a title card** — opacity 0→1 + letter-spacing from ~+0.1–0.2em → rest, ~600–700ms **ease-out** `cubic-bezier(0,0.4,0,1)`, ONE non-looping GOLD hairline sheen sweep. *(PRIMARY: Material 3 / Carbon / Atlassian.)* → **DD:** "DRAGON DRIFT" in existing `--fs-display` Russo One at its correct **+0.16em positive** tracking; fixes the "cheap TEXT" tell without a new font size.
3. **Single low-weight CTA that BREATHES** — appears LAST; breathe scale 1.0↔1.02–1.03 and/or opacity 0.85↔1.0 over **1.6–2.4s** ease-in-out infinite; "TAP TO BEGIN" a beat under it, fading 0.5↔1.0 slowly; pressed feedback <100ms. → **DD:** TAKE OFF = the ONLY gold-filled, only-at-rest-animated control; "TAP TO BEGIN" a quiet Rajdhani micro line. No glow/box-shadow pulsing over canvas.
4. **Asymmetric scrim carries the type** — directional gradient ~0.55–0.7 warm-black under the text column → ~0–0.1 over the dragon third; NEVER a flat dim, NEVER backdrop-filter. → **DD:** EMBERLINE's asymmetric-scrim law verbatim; keeps dragon + ring + embers alive while the wordmark stays crisp.
5. **Restrained living-world motion budget** — slow, low-frequency, sparse: a few px/s parallax, ember drift on multi-second loops, sway 2–6s periods, never a blizzard/strobe. → **DD:** replace the `Math.random` ember placement with **deterministic** slow sin/cos drift; add a very slow camera dolly + subtle sky-gradient shift. Particle count capped for 60fps.

*Owner-locked: keep slogan "it's a skill issue" — just time its fade to land with/after the wordmark.*

---

## SURFACE 2 — RETURNING PLAYER + IDLE-REWARD POP-IN (`main.js:879` → `ui.setStartNotice`)

The current flat line **"Tailwind while you were away: +100. The sky kept your seat."** is the #1 flagged cheap tell. Replace with a choreographed reward CARD. This is a **claimable/mode-A** reward on the HUB (`game.state !== 'playing'`), so a partial scrim is legal.

1. **The 4-beat reward card** *(PRIMARY: HoYoverse/Genshin-HSR flow, Material 3, CountUp.js, LogRocket)*:
   - Beat 1 — asymmetric scrim fades in **200–250ms** (~40–55% warm-black behind card, light over dragon).
   - Beat 2 — warm-glass card enters **300–400ms ease-out** (`cubic-bezier(0.05,0.7,0.1,1)`), scale 0.9→1.0, ONE settle (no elastic yo-yo).
   - Beat 3 — the **+100 counts up 0→100 in ~700–900ms easeOutQuad**, tabular-nums, GOLD; sync the topbar 999,999 wallet to tick +100 finishing on the same frame so the reward physically lands.
   - Beat 4 — **tap to dismiss** (never auto-timeout an actioned reward); exit **~150–200ms accelerate** (`cubic-bezier(0.3,0,0.8,0.15)`) — faster than entry.
2. **One subtle overshoot, rationed** — reserve a single **easeOutBack ~8% (`cubic-bezier(0.34,1.56,0.64,1)`)** for the +100/currency-chip land ONLY. Never easeOutElastic (multi-bounce reads cheap; violates "nothing pops"). → **DD:** reuse EMBERLINE `--ease-spring` exactly once.
3. **Build from the ONE panel recipe** — warm-glass FILL + gold hairline + 1px inner-top highlight + one soft shadow (it's the single active modal, so the shadow is legal here). Optional one-shot GOLD hairline shine-sweep (CSS gradient pseudo-element, ~700–1000ms, opacity 0.15–0.25, then removed). → **DD:** zero assets, transform/opacity/gradient only; no backdrop-filter over canvas.
4. **Reduced-motion + a11y** — under `prefers-reduced-motion: reduce`: drop translate/scale/overshoot/shine, opacity cross-fade ~150–200ms, snap +100 to final; add `aria-live="polite"` for the reward line; contrast ≥4.5:1 on the glass. → **DD:** extends the PROTECTED reduced-motion credit.
5. **Copy voice** — one confident declarative clause, zero exclamation, no second sentimental sentence. Exemplars: *"The sky kept your seat. +100 tailwind."* / *"Two days aloft — rewards banked."* The GOLD count-up carries the emotion, not the words.
6. **If it ever grows past one line** — reuse the EXISTING recap-ledger cascade (a PROTECTED credit): stagger rows ~80–120ms, each 200–300ms fade+slide (translateY 8–12px→0). Do NOT fire N separate toasts.

---

## SURFACE 3 — HUB COMPOSITION + WELCOME→HUB FLOW

The owner's "CROPPED dragon + rotating around EMPTY background" is a **camera/framing-rig problem, not a CSS nudge**. Under THE MENU LAW touch only the SUBJECT + camera; reuse the render pipeline; never displace the world.

1. **Reframe-in-place — the hub IS the title scene, dollied** — no hard cut. Animate the SAME camera from splash pose → hub-framing pose while DOM chrome cross-fades. *(PRIMARY: chrome cross-fade 200–300ms; INFERRED: camera reframe ~600–900ms, chrome starting ~150ms in so the world settles first.)* → **DD:** do NOT build a second scene; only camera + DOM STATE change; hide-for-menu stays `.visible`-only gated on `state!=='playing'`.
2. **Purpose-built framing rig kills the CROP** — dedicated hub/showcase camera, **compressed FOV ~30–40° (vs gameplay ~55–70°)**, subject bbox **~60–72% of frame height with ~12–15% headroom, ~10% floor**, clamped to a safe margin, **recomputed on resize/orientation**. *(INFERRED — tune live.)* → **DD:** frame the equipped dragon to a target on-screen bbox; the definitive fix for "CROPPED."
3. **Fill the negative space kills the EMPTY-rotation** — never a void: keep the **mint ring course + warm sky gradient + ember field behind the dragon at every yaw**, add a **procedural rim light**, plus a soft radial vignette (edges ~25–40% darker) and subject nudged ~5–10% off-center. → **DD:** the mint course as backdrop satisfies "the world stays ALIVE"; gold-only accent.
4. **Hero owns the CENTER; chrome crowns TOP, seats BOTTOM** — TOP band ~14–18% height, CENTER subject band ~64–70%, BOTTOM nav ~15–20%; **the middle ~60% column carries NO chrome**; portrait, bias subject ~52–55% down for wordmark air. *(INFERRED bands; the repo's OWN HUB COMPOSITION LAW is the authority.)* → **DD:** wordmark/title-chip/CTA sit in top or bottom band, never on the dragon.
5. **Idle banking cruise, NOT a turntable spin** — premium hubs don't spin the model like a trophy. If any auto-motion: **≤±10–20° sway or ~4–8°/s (full rev 45–90s)**; breathe/idle 3–5s; prefer idle-posed + drag-to-rotate on demand. *(INFERRED cadence — tune live.)* → **DD:** reuse the existing flap/idle anim as a slow banking cruise down the course; more diegetic for a flight creature; holds 60fps.

**Verification gate:** screenshot gates BLANK the canvas and miss crop/empty-background/chrome-on-dragon — only the **LIVE portrait preview** catches these.

---

## SURFACE 4 — MENU NAVIGATION IA / DECLUTTER

The owner's "in-game CLUTTER" complaint. Much of the correct architecture already ships — the work is discipline + EMBERLINE cleanliness, not new structure.

1. **Two-spine model** — TOP bar = identity/economy/settings ONLY (currency, BEST, gear); BOTTOM rail = travel destinations. Never let a destination migrate up or a top chip duplicate a rail item. *(PRIMARY: Battle.net = 3 top links; CoD HQ Oct-2024 streamline folded Battle Pass away.)* → **DD:** current topbar is correctly identity-only — keep it; GOLD for currency/BEST, gear neutral.
2. **Bottom rail = 3–5 primary destinations, hard-capped** — tap target **44×44 CSS px** (self-imposed AAA bar; WCAG 2.2 floor is only 24×24), ≥8px spacing, icon **+ micro-label** (never icon-only). → **DD:** PILOT/QUESTS/SHOP/DAILY/BOSS RUSH is already at the **5-item ceiling** — do NOT add a 6th standing item; BOSS RUSH's conditional gating is correct.
3. **Progressive disclosure (already correct — verify, don't rebuild)** — reveal destinations as earned. → **DD:** `ui.js:1895-1897` — cold pilot (runs===0) sees ONE choice (TAKE OFF); QUESTS at runs≥2; PILOT+DAILY at runs≥3; BOSS RUSH on first boss kill. This is the primary declutter lever. **Verify the cold state truly strips to wordmark + CTA** (no orphan chrome) — that's the WOW first-paint.
4. **One unmistakable primary verb** — Play/Take-Off wins on **size (~1.5–2× any nav item) + the only saturated accent + position + the only at-rest motion (breathe 2–4s, scale ~1.0→1.03)**. Nav items desaturated hairline by contrast. → **DD:** the existing `hero-cta` GOLD breathe (`ui.js ~1960`) is the right mechanism — keep rail icons quiet Rajdhani hairline so TAKE OFF never competes.
5. **Nest seasonal/secondary features one door deep** — primary spine stays stable every session; churny content (missions, weekly trials, boss-rush roster, pilot progression) lives behind its rail icon, ≤2 taps, each with its own **clearing** badge. → **DD:** QUESTS/DAILY already open dedicated panels — keep going; hub surface = wordmark + CTA + rail + top strip and nothing else.
6. **Badges: pip that clears on view, NOT a standing panel** — top-right, ~16px, 1–2px surface stroke; dot when "changed", number (cap 99+) when quantity matters; clears on section open; badge only genuinely claimable things (avoid red-dot blindness); pair with `aria-label`. **EMBERLINE caution: a literal RED dot is illegal — MAGENTA = DANGER only; use GOLD (action) or JADE (success).** → **DD:** `pilotBadgeDue()/questsBadgeDue()/dailyBadgeDue()/shopBadgeDue()` (`ui.js:2734-2767`) already gate + clear correctly; just recolor any red pip to gold/jade. This is what replaces the cheap standing "Tailwind…" line for the *ambient* case.

---

## SURFACE 5 — PREMIUM TOAST / NOTIFICATION SYSTEM (declutter mechanism for ambient events)

Distinct from the Surface-2 hero reward. Governs quest-complete, title-unlocked, progress ticks.

1. **Two modes, pick correctly (top cheapness tell if wrong):** **(A) Claimable hero reward** earns a scrim + blocks input until collected (welcome-back = mode A). **(B) Ambient toast** NEVER dims/blocks — corner-anchored, self-dismisses ~4–5s. Only ONE scrim budget at a time; never a blur over the live canvas.
2. **Motion tokens, defined once in `:root` and reused** — `--dur-enter ~320ms` / `--dur-exit ~200ms` (exit = **0.7–0.85× enter**), `--ease-enter` decelerate `cubic-bezier(0.05,0.7,0.1,1)`, `--ease-exit` accelerate `cubic-bezier(0.3,0,0.8,0.15)`. *(PRIMARY: Material enter 225 / exit 195; Carbon 70/110/150/240/400/700ms; NN/g 200–500ms.)* → **DD:** EMBERLINE already ships `--ease-out`/`--ease-in`/`--ease-spring` — the net-new action is **asymmetric durations**, not new curves.
3. **Stacking: cap, stagger, recede** — max **1 blocking / 3 ambient** visible; stagger reveal ~80–150ms; older toasts recede (scale 1.0→0.95, opacity 1.0→0.6, translate by own height); FIFO-dismiss the oldest at a 4th; gap 8–12px. → **DD:** top-anchored stack capped at 2–3; transform/opacity only. **Prefer ONE consolidated summary card for welcome-back — never a wall of pop-ins.**
4. **Micro-juice, rationed** — one-shot hairline shine-sweep + tiny icon settle (scale 1.08→1.0, ~200ms easeOutBack) + soft shadow on the **single active/topmost card only** (none on receded cards). → **DD:** EMBERLINE already mandates one-shadow-on-active-modal + 1px inner-top highlight; keep the shine in the GOLD hairline family ("dragonfire catching the glass").
5. **Sound (CONFIRMED codebase-compatible, optional)** — procedural WebAudio already exists (`reforged/js/uiSound.js`, `sfx.js`, `sfxRender.js`). Appear = filtered noise whoosh ~150–300ms; collect = 2–3 sine/triangle oscillators on a warm major triad, exp decay ~200–400ms; **pitch-randomize ±3–5% / round-robin** to survive daily repeats; first-gesture-gated, quiet, honors the mute setting. Hook the existing system; add NO audio files. *(Owner brief is visual-only — treat as later polish, not a blocker.)*

---

## SURFACE 6 — TYPOGRAPHY, COPY VOICE & MOTION CRAFT

1. **Hierarchy from SIZE + CASE + TRACKING, not new sizes** — show only ~3–4 of EMBERLINE's SIX sizes per screen; **any 7th ad-hoc font-size IS the cheap tell**. → **DD:** audit the hub and remove any orphan size.
2. **All-caps labels want POSITIVE tracking; the "display wants NEGATIVE" rule is a TRAP here** — all-caps small labels/chips **+0.05–0.15em** (caps blur together at 0); body ~0 (`--track-body 0.01em`). The negative-tracking rule is **mixed-case only** — EMBERLINE's all-caps Russo One display correctly runs **+0.16em (`--track-disp`); do NOT make it negative.** → **DD:** add `--track-caps` if absent; keep display positive.
3. **Title-chip recipe fixes the `<<Slipstream>>` chip** — quiet typographic label: 1px warm hairline, ~4–8% warm-glass fill, pill or `--r-s` (6px), all-caps Rajdhani at `--fs-micro`/`--fs-label` **+0.1em**, ZERO gradient/gloss/bevel/shadow, one inner-top highlight allowed. **DROP the `<< >>` guillemets** (cheap decoration). Equipped marker (if wanted) = one thin leading hairline or a single small GOLD dot (GOLD = records/feat-title is the legal accent). *(Slipstream = the equipped title from `titles.js`.)*
4. **Premium copy voice** — one confident declarative clause, zero exclamation, no cutesy personification, nouns + strong verbs over adjectives. The calm reads expensive. → **DD:** apply to the welcome-back line; never add "Wow!/Awesome!"; do NOT touch the owner-locked slogan.
5. **GOLD held under ~10% of the hub, role-locked** — 60/30/10 heuristic (INFERRED ceiling, not measured). Accent = wordmark + currency + BEST + the single TAKE OFF CTA; keep CYAN/MAGENTA/JADE OFF the calm hub (they're in-run vitals/danger/success). → **DD:** if every rail icon is gilded, demote to neutral hairline — only the active tab + currency + CTA carry gold.
6. **Everything assembles on a stagger; nothing hard-cuts** — hub entry reveals topbar → wordmark → CTA → nav, stagger ~50–100ms, each ~200–300ms decelerate, total <~600ms. **Blur ONLY on a genuinely frozen modal (e.g. the PROTECTED pause card); 0 blur over the live canvas.** → **DD:** all warm-glass FILL, transform/opacity only.

---

## CONSOLIDATED ANTI-PATTERN KILL-LIST (what makes menus read cheap)

**Composition / camera**
- Center-and-CROP the dragon (clip wings/crown at the frame edge) — center the MASS via rule-of-thirds with headroom instead. *(Owner's exact complaint.)*
- Rotate the model over a VOID (no backdrop/rim light/pedestal) — every yaw must have designed world behind it. *(Owner's exact complaint.)*
- Fast full-360 turntable spin — reads like a trophy inspect screen; use a slow banking cruise / idle sway + drag-to-rotate.
- Chrome (wordmark/CTA/chip) sitting ON the dragon in the center third — top/bottom bands only. *(HUB COMPOSITION LAW.)*
- Hard-cutting splash → a separate menu scene — reframe the SAME scene with a camera move. *(MENU LAW.)*
- "Fixing" crop/empty-rotation with a CSS nudge — it's a framing-rig fix (FOV, distance, rim light, backdrop, asymmetric scrim).
- **Verifying composition on screenshot gates only — they blank the canvas and MISS crop/empty-bg/chrome-on-dragon. Use the live portrait preview.**

**The reward moment**
- A flat text STRIP for the idle reward (the current `main.js:879` line) — must be a card with scrim + count-up + choreography.
- Static "+100" with no count-up — throws away the highest-leverage juice at near-zero cost.
- Count-up too slow (2s+ feels laggy) or the digits reflowing (font not tabular-nums).
- Auto-dismissing an actioned/claimable reward — reward cards wait for the tap.
- Firing N toasts for a multi-part welcome-back instead of ONE consolidated summary.
- Wrong scrim mode — scrim on a trivial ambient toast, or NO scrim on a claimable hero reward.

**Motion**
- Same easing/duration for entrances and exits — exits must be ~0.7–0.85× and accelerate (ease-in); entries decelerate.
- Elements that POP in with no animation; animating layout/width/height/top/filter instead of transform/opacity.
- easeOutElastic / multi-bounce / repeating overshoot — ration ONE ~8% settle to the reward number; "nothing pops."
- Inviting input before the picture is composed (CTA visible at 0s).
- Dense/fast particle blizzards or high-frequency strobing competing with the CTA — motion slow, sparse, multi-second loops.

**Type / color / copy**
- A 7th ad-hoc font-size or a second display face — breaks the six-size 1.35 scale.
- Negative tracking on the all-caps Russo One display (it wants +0.16em); zero tracking on all-caps labels (they blur).
- Saturated/gradient/glossy/beveled/shadowed badge chips + the `<< >>` guillemets around Slipstream.
- Exclamation marks, cutesy personification, two competing sentimental clauses in reward copy.
- GOLD sprayed past ~10% of the hub (every nav icon gilded); CYAN/MAGENTA/JADE on the calm hub; a literal RED reward dot (MAGENTA is danger-only — use GOLD/JADE).

**Hard technical constraints**
- **backdrop-filter/blur over the live animating canvas — banned (mobile-fps killer); fake glass with warm FILL + hairlines. Blur budget = ONE frozen modal only.**
- Any image/texture/PNG asset, glow-strip box-shadows, or WebAudio files — 100% procedural, transform/opacity/gradient only.

**IA / clutter**
- A 6th standing bottom-nav item (already at the 5-item ceiling).
- Duplicating a destination in both top bar and rail; a travel destination living in the identity strip.
- Icon-only ambiguous nav (decode tax on a first-session pilot) — icon + micro-label.
- Persistent text panels/dots that never clear — ambient availability = a pip that clears on view; the reward MOMENT = a dismissable pop-in.
- Exposing the full feature set to a cold pilot — gate by runs/progress (already correct at `ui.js:1895-1897` — verify, don't rebuild).

---
**Code anchors for the plan author (all in `reforged/`):** idle-reward line `main.js:879` → `ui.setStartNotice` (`ui.js:2482`), gap config `config.js:572` `welcomeBackGapDays:5`; hub hero screen `ui.js ~1535-1611`, rail `ui.js ~1934-1942`, CTA breathe `~1960`, progressive disclosure `~1895-1897`, badges `~2734-2767`; splash DOM `splash.js`; EMBERLINE tokens + hub styles `css/style.css :root` and `~1785-1895`; procedural audio `uiSound.js`/`sfx.js`/`sfxRender.js`; Slipstream title `titles.js`.