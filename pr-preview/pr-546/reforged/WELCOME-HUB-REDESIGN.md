# DRAGON DRIFT — Premium WELCOME + HUB Redesign

> **STATUS: PLAN (Fable-gated, independently audited) — NOT YET BUILT.**
> This document is the design spec for the premium welcome/splash + hub overhaul. No game
> code has been changed. It was produced by the repo's Fable Quality-Gate process and clears
> the **≥4.2/5** bar; a fresh independent audit then returned four surgical, build-time
> corrections (§ *Independent Audit* at the bottom) that a building session **must** apply.

## How this was produced (the ritual the owner asked for)

1. **Fable research brief** → **Opus web research** (6 threads, each adversarially fact-checked):
   premium first-load "wow" moments, returning-player login + idle-reward notification pop-ins,
   hero-model-owns-center hub composition, menu IA / declutter, premium toast systems, and
   type/copy/motion craft. Reference bar: Ghost of Tsushima / God of War / BOTW / Blizzard /
   Hoyoverse. (Consolidated in `WELCOME-HUB-RESEARCH-DIGEST.md`.)
2. **Fable plan synthesis** grounded in the real code + the EMBERLINE constitution
   (`UI-PREMIUM-OVERHAUL.md` §A) + the menu law + 60fps/no-image-asset laws.
3. **Pre-assessment → harsh Fable critic gate**, looping until **≥4.2/5**.
4. **Independent Fable audit** (fresh, adversarial, ground-truthed against source).

## Gate result — **PASS, 4.35 / 5**

Convergence: 4.1 → 4.15 → 4.4 → **4.35 PASS**. Final per-dimension (all ≥4.3):

| Dimension | Score |
|---|---|
| WOW / first-impression | 4.4 |
| Returning-player + notifications | 4.4 |
| Hub composition / camera | 4.3 |
| Typography + copy premium-ness | 4.4 |
| Clutter / IA | 4.3 |
| Flow + motion | 4.3 |
| EMBERLINE fidelity | 4.5 |
| Feasibility | 4.4 |

The gate stalled three rounds at 4.1 on **first-load WOW** until the plan *committed* a real
3-layer 3D dragonfire ignite beat on the live dragon (one-shot wingbeat ×1.4–1.8 + rim-light
lift +8–12% + a subtle camera push 4–6%), grounded in verified rig APIs — replacing the earlier
flat-gradient hedge.

## Independent audit — **FIX-FIRST** (4 surgical corrections, not a redesign)

Every `file:line` in the plan was verified accurate. Must-apply before/at build (full text in the
addendum): **(1)** make the headless dragon-bbox/sky-fraction probe a *gating spike* with a defined
owner-preview fallback; **(2)** the anti-void "fill" must use camera framing / CSS depth-vignette
only — **no menu-only 3D geometry** (menu-law); **(3)** the splash camera-push is net-new in the
splash branch, **not** a `punchKick()` reuse; **(4)** hard-gate the ignite wingbeat to zero on
`state==='playing'` / TAKE OFF so it can't bleed into a run's first frames.

---

I have the ground-truth I need. Below is the full revised plan (v5).

---

# DRAGON DRIFT — PREMIUM WELCOME + HUB — THE PLAN (Fable synthesis, v5 — final revision)

**Judged against:** EMBERLINE (`UI-PREMIUM-OVERHAUL.md §A`), THE MENU LAW, the HUB COMPOSITION LAW (`leapfrog/lessons/2026-07-15-hub-subject-owns-the-center.md`), 60fps-mobile, zero-image-asset, transform/opacity-only. Every section is coexist → prove on hero → migrate, and names exact `file:line` targets verified in the live source.

**What v5 changes over v4 (all folded GROUND-TRUTH FIRST):** the WOW beat is now a **COMMITTED 3-layer 3D ignite gesture on the live dragon** (wing downstroke + rim/key lift + camera push), each with a numeric amplitude floor *and* ceiling, a one-shot assertion, and a pre-specified escalation ladder + a named EMBERLINE-legal spectacle fallback (§1.2a). A **PHASE 0 SPIKE** (new §0.5) builds and proves the four small new APIs the ignite and the crop/fill floor depend on, before any gate that needs them is called runnable. The verification model is **honestly reclassified** into three classes — **(A) CI machine gates**, **(B) manual dev-tool gates** (deterministic + numeric but not PR-blocking, because `run-all.mjs` skips `browser.mjs` and WebGL is unavailable in CI/sandbox), **(C) owner live-preview** — and every live-canvas check is moved to B or C, never mislabelled as a PR-blocking machine gate. §5.5 (in-run HUD declutter) is now grounded in verified `file:line` like every other section. The gift headline no longer reuses "The sky kept your seat" (owner-flagged), and the no-gift line is committed as a premium final. Five round-3 fixes and five independent-audit blockers are applied verbatim below.

**Readiness gating (do not ignore):** **§0 + §0.5 build FIRST.** §1/§4/§5 are green to build after §0. **§2 builds only after R2 + G1 are settled below** (they are). **§3 builds only after R1/G1/G2 + the background-fill target + the §3.3 FOV calibration sweep + the §0.5 crop/fill probe harness are settled** (they are), and §3 sign-off is **owner-live-preview (class C), never a CI machine gate** (R4/audit-blocker-1) — with the sky-fraction probe + calibration sweep as **class-B manual dev-tool** numeric checks (not class A) until §0.5 proves whether the scene graph constructs headlessly.

**Ground-truth notes from reading the code (these correct things the brief under-specified):**
- The splash `.splash-sky` / `.splash-vignette` are **PURPLE** (`rgba(54,22,92,.88)`, `rgba(28,8,52…)`) — pre-EMBERLINE, itself a cheap-atmosphere tell. EMBERLINE ink is warm `--scrim-ink: 12,8,6`. In-scope to warm. `grep '54,22,92' + 'purple'` on `#splash` after the change → **0**.
- The hub ember field (`ui.js:1908`) is gated `gold = Math.random() > 0.4`, i.e. **gold ≈60% / CYAN ≈40%** (`--c: gold ? #ffce6a : #7fe6ff`). CYAN is a vitals-only accent and is **illegal on the calm hub at any frequency**. Recolored (not waived) in §4.2 — audit-blocker 3.
- Splash title tracks `0.045em` desktop / `0.10em` mobile (`style.css:2696,2775`) — below EMBERLINE `--track-disp: 0.16em`. Undertracked all-caps Russo One is the wordmark "cheap" tell. Fixed §1.2/§4.3.
- Splash camera = fixed locked pose (fov 66, `cameraController.js:161-179`); hub camera = **10.5-radius orbit at fov 58** (`cameraController.js:194-196,203`). The orbit + no-bbox-fit is exactly the owner's "cropped / rotating around empty background." Confirmed as the deeper camera fix (§3).
- `«${title}»` guillemets at `ui.js:1958`; `--track-disp: 0.16em` and the scrim tokens exist. Confirmed.
- **Ignite primitives verified:** `updateRim(color, strength, boost=0)` (`rimLight.js:60`, called `dragon.js:1767`) = a uniform write, no recompile, no draw calls — a rim/key lift is per-frame safe. `punchKick()/boostKick()/gateKick()` (`cameraController.js:291-296`) already implement a sin-enveloped one-shot position kick; `damp()` pose-blends at `:186`; they live in the **non-splash chase branch after the splash `return`** at `:161-180`. `flapPhase` is a **private integrated clock** (`let flapPhase=0` `dragon.js:133`, advanced `:1116`, read-only `wingbeatPhase()` `:645`); the only existing pose override is the **freeze**-only debug (`setFlapDebugPose` `wingDebugPose.js:53`, `WING_DEBUG` branch `dragon.js:1119`) — **there is NO one-shot downstroke driver**, so §0.5 scopes one on `solveWing(phase,cfg)` (`wingFlapSolver.js:60`) + `phaseCenter('downstroke'/'apex',…)` (`:44-49`). Head is auto-driven from velocity (`dragon.js:1067-1068,:1323`); the only look hook is whole-body `setDragonLook(yaw)` (`dragon.js:201`) with no envelope — so a true **head-turn is a NEW small head-yaw envelope API** (§0.5), placed on the ESCALATION LADDER, not the committed default.
- **In-run HUD (grounds §5.5):** the HUD root is built at `ui.js:489` (`root.id='hud'`) with `.hud-top-left` (`:491`), `.hud-top-center` (`:498`), `.hud-top-right` (`:511`), `.embers-hud` (`:513`), `.graze-hud` (`:520`). The in-RUN per-frame update (the `game.state==='playing'` render branch) runs ~`ui.js:900-1122`: score tier/pulse `:908-912`, surge gems + combo multiplier slug `:918-960`, the race/`challengeScore` strip `:1073-1081`, `.embers-hud` `:1043-1048`, `.graze-hud` `:989-995`, `updateHudState(player)` `:1119`. The `challengeScore` copy also renders as the **hero** `<p class="challenge">` at `ui.js:1956`. CSS: `#hud` `style.css:161`; `.hud-top-left` `:189,:506`; `.hud-top-center` `:193`; `.hud-top-right` `:216` (**already uses `env(safe-area-inset-top)`**); `.embers-hud` `:494` (`#ffc050` gold); `.graze-hud` `:271` (`#9dffea` cyan — vitals-legal in-run); stamina-arc surge `:587-588` (cyan `#c8fff2` — vitals); **`.challenge` `:1343`** (`font-size:16px` + `letter-spacing:2px` — a NON-token size and px tracking, the cheap tell); the immersive-mode override matrix `.hud-immersive` `:840-849`; per-element HUD override (H6 §F) `ui.js:2221-2228` persisting to `saveData.settings.hudElements` via `hudState.js`.

---

## VERIFICATION CLASSES (read once — used by every §Verify block; audit-blocker 1)
Because `run-all.mjs` **skips `browser.mjs`** and **WebGL is flagged unavailable in CI/sandbox** (silhouetteCore header), a live-canvas check is NOT a PR-blocking machine gate. Every check below is tagged:

- **(A) CI MACHINE GATE — PR-blocking, runs in `run-all.mjs` today:** static CSS/JS lint (`uitokens.mjs`), `grep`s, and any computed-style / DOM-node-count probe reachable via the boot poll **without a WebGL context**.
- **(B) MANUAL DEV-TOOL GATE — deterministic + numeric + re-runnable, but NOT PR-blocking:** anything that needs the booted live scene, the Three.js scene graph, the raycast probe, `Box3` projection, or synthetic pointer/frame timing. A judge evaluates the numbers; they run locally / on a WebGL-capable runner. **§0.5 attempts to promote the geometry-only ones (raycast probe, `Box3` projection) to class A by proving the showcase scene graph constructs headlessly without a WebGL render** — until then they are class B.
- **(C) OWNER LIVE-PREVIEW — feel only, live portrait phone:** composition, crop, the *look* of the fill, wow feel, cruise feel, land feel. The canvas-blanking screenshot gates miss all of this (R4).

The machine-vs-dial framing is corrected throughout: **no live-canvas check is ever called a PR-blocking machine gate.**

---

## 0. SHARED FOUNDATION — motion + color tokens (build FIRST, migrate nothing yet)

Add to `:root` in `css/style.css` (after the EMBERLINE block, ~line 88). **Coexist:** net-new tokens only, zero visual change until referenced.

**Audit-blocker 5 (alias, don't fork the vocabulary):** do NOT introduce a parallel `--dur-*` family. **Alias onto the shipped `--t-*` duration family** so there is ONE duration vocabulary:

```
/* Asymmetric notification motion — aliased onto the shipped --t-* family, not a 2nd vocabulary */
--t-card-enter: 340ms;                        /* card entrance (§2) — was proposed --dur-enter */
--t-card-exit:  200ms;                         /* 0.59× enter — exits accelerate (was --dur-exit) */
--ease-enter: cubic-bezier(0.05,0.7,0.1,1);   /* decelerate (Material-emphasized) */
--ease-exit:  cubic-bezier(0.3,0,0.8,0.15);   /* accelerate */
/* --ease-spring already exists (0.2,1.6,0.4,1) — the ONE rationed overshoot; reused, never easeOutElastic */
--track-caps-tight: 0.10em;                   /* pill/chip caps */
--scrim-side: ...;  --scrim-foot: ...;         /* referenced by §1.1 / §2.2 (if not already present) */
```

- **NUMERIC:** exit/enter ratio = **0.59** (≤ 0.66 target). No new easing *curves* beyond the two above; `--ease-spring` reused — **elastic count = 0** everywhere.
- **Verify (A):** `node tests/uitokens.mjs` still passes — additive only. `grep -c backdrop-filter css/style.css` unchanged; **backdrop-filter over canvas = 0**.
- **Human residual:** none.

---

## 0.5 PHASE-0 SPIKE — build + verify the four small new APIs BEFORE any dependent gate is runnable  *(P0 — blocks §1.2a, §2, §3)*

The v4 plan leaned on hooks that **do not exist yet**. Per FEASIBILITY, each is scoped here as its own named increment, built and proven first. No dependent gate below is declared runnable until its API lands.

**0.5.a — `igniteWingbeat()` one-shot downstroke driver** *(unblocks §1.2a layer A)*
- **Net-new** (verified: no one-shot driver exists; only the freeze-only `setFlapDebugPose`/`WING_DEBUG` branch, `dragon.js:1119`, `wingDebugPose.js:53`). Build a one-shot envelope that **offsets/drives the existing `solveWing(phase,cfg)` (`wingFlapSolver.js:60`) past the idle band toward `phaseCenter('downstroke')` (`:44-49`) for ~700ms, then eases back onto the integrated cruise `flapPhase` clock** (`dragon.js:133,:1116`). **No new geometry — tricount untouched.** Expose the envelope's current amplitude so a dev-tool can assert the downstroke depth floor.
- **Verify (B):** single downstroke plays and returns to cruise (envelope value 1→0 over ~700ms, non-looping); `tricount` byte-identical before/after.

**0.5.b — `igniteRim()` one-shot rim/key lift** *(unblocks §1.2a layer B)*
- **Already supported** — `updateRim(color, strength, boost=0)` (`rimLight.js:60`, called `dragon.js:1767`) is a uniform write. Add a thin one-shot wrapper that ramps strength **+8–12%** and **decays to baseline over ~600ms** (pass a scaled strength or the `boost` arg). No recompile, no draw calls.
- **Verify (B):** rim strength returns to baseline within ~600ms; per-frame cost ≈ 0.

**0.5.c — splash-branch camera-push hook** *(unblocks §1.2a layer C)*
- **Reuse** `punchKick()`/`damp()` (`cameraController.js:291-296,:186`), which today live only in the **chase branch after the splash `return` (`:161-180`)**. Add a **small hook INSIDE the splash branch** that fires the SAME sin-enveloped one-shot kick **~4–6% toward the subject** and **returns to the LOCKED splash pose** (no residual drift), 60fps-gated.
- **Verify (B):** camera returns to the exact locked splash pose after the kick (position delta → 0); 60fps held.

**0.5.d — `headTurnToCamera(yaw)` one-shot head-yaw envelope** *(unblocks the §1.2a ESCALATION LADDER only — NOT the committed default)*
- **Net-new** (verified: head auto-driven from velocity `dragon.js:1067-1068,:1323`; only whole-body `setDragonLook(yaw)` `dragon.js:201`, no envelope). Build a small head-yaw one-shot envelope (bounded, eases back to the velocity-driven rest). Scoped now so the ladder can fire it without a fresh design round; **stays off the default path**.
- **Verify (B):** head yaws to target and eases back to velocity-driven rest; whole-body pose untouched.

**0.5.e — the live crop/fill MEASURE pass (raycast probe + `Box3` projection) — NOT a mask render** *(unblocks §3 crop + anti-void floor; audit-blocker 2)*
- Audit-blocker 2: `renderMode='mask'` is **net-new engine work** (`silhouetteCore.mjs` is CPU-only and ignores the live hub camera solve). **We do NOT build a mask render.** Instead build the **geometry-only measure** §3 uses: (i) `new THREE.Box3().setFromObject(equippedDragonGroup)` projected through the showcase camera for crop/clearance, and (ii) the **24×14 = 336-ray raycast grid** for `skyFraction` (§3.3). Both hook the **shipped render loop + camera solve** by reading the live scene graph + `showcaseAngle`/`hubFov` pose — **no new render mode, no pixels rendered.**
- **The class-A/class-B decision is MADE HERE:** if the showcase scene graph constructs in a headless node harness **without a WebGL context**, promote the probe + `Box3` projection to **class A (CI, PR-blocking)**; if construction requires the browser boot (which `run-all.mjs` skips), they remain **class B (manual dev-tool)**. Record the result in the Gate Log. Until this spike lands, **no §3 crop/fill gate is called runnable, and none is labelled class A.**
- **Verify:** the probe returns a deterministic `skyFraction` on the fixed showcase pose across two runs (byte-identical); `Box3` projection returns a stable bottom-edge value.

**Increment:** each of a–e is its own small commit, proven in isolation before the surface that consumes it is built.

---

## 1. FIRST-TIME WELCOME / THE WOW — `splash.js` + `#splash` CSS  *(P1 — green after §0/§0.5)*

**Owner complaint resolved:** cheap TEXT (title/wash) and a splash that was "merely a re-skin"; the splash IS the first 10 seconds — it must read as a **film title-card with a real dragonfire event**, not a dim purple overlay.

### 1.1 Art direction — warm the atmosphere to EMBERLINE
The living world (dragon + mint ring course + water) already shows through and is correct per THE MENU LAW — **do not touch the scene.** Re-skin the four transparent CSS layers only.

| Element | file:line | Now | → EMBERLINE spec |
|---|---|---|---|
| `.splash-sky` | `style.css:2659` | purple `rgba(54,22,92,.88)` | warm ink `rgba(12,8,6,.72)` top → transparent by ~58% (asymmetric top-heavy) — cite `--scrim-ink` |
| `.splash-vignette` | `style.css:2672` | purple radial+base | warm radial `rgba(var(--scrim-ink),.5→.85)` edges; kill the flat 92% base dim |
| `.splash-horizon` | `style.css:2665` | gold radial (KEEP) | keep — dragonfire glow behind the dragon, already gold |
| directional scrim | **new** | flat | `--scrim-side` (heavy left/text column, ~0 over dragon third) + `--scrim-foot` under the CTA — asymmetric-scrim law verbatim |

- **NUMERIC (target):** scrim alpha **over the dragon third ≤ 0.10**; **behind the text column 0.55–0.72**; `backdrop-filter` over canvas = **0**. `grep '54,22,92' + 'purple'` on `#splash` → **0**.
- **G5 — contrast on the warmed scrim:** `.splash-tag`, the un-guilleted chip, and any rail label over the new warm scrim must hold **≥ 4.5:1** text contrast, verified against the local scrim alpha, not the page average.

### 1.2 Wordmark resolves like a title-card (the "cheap TEXT" fix)
`.splash-title` (`style.css:2694`). Keep the gold text-clip gradient + sheen sweep (protected mechanism), but:
- **Tracking → `--track-disp` (0.16em)** desktop *and* mobile — **evict `0.045em` (`style.css:2696`) and `0.10em` (`style.css:2775`).**
- **Reveal:** wordmark opacity `0→1` + letter-spacing `0.10em→0.16em`, **650ms `--ease-enter`**, starting **t≈1.0s** (world alone for the first second). One non-looping sheen pass on entry (reuse `wordmark-shine` for a single pass, then settle to the slow idle loop) — the sheen must not double-play on early-ignite (G4).
- **Glow-breath cap (NUMERIC):** the `drop-shadow` glow currently peaks at **42px** blur (`style.css:2708`) — an onion-ring tell. **Cap blur peak ≤ 28px, glow opacity ≤ 0.5.** Drop the 42px keyframe.

### 1.2a THE SIGNATURE IGNITE — a COMMITTED 3-layer 3D dragonfire event on the live dragon (fires co-timed with the wordmark resolve)
The v4 re-skin capped first-load impact below the Blizzard/GoT bar because it added **no hero spectacle beat**. v5 **commits** a single **layered ignite gesture** — three one-shot layers firing **together** on the wordmark-resolve frame (~1.0→1.65s, peak ~1.35s) — that makes the dragon visibly *ignite* toward the player. All three are one-shot, return to rest, add zero geometry, and are 60fps-gated. This is not an either/or and it is not "decide later" — all three ship in the default.

**The three committed layers (each with a floor AND a ceiling, and a one-shot assertion):**

| Layer | Mechanism (Phase-0 API) | Amplitude — FLOOR ≤ target ≤ CEILING | One-shot assertion |
|---|---|---|---|
| **A — wing DOWNSTROKE + updraft** | `igniteWingbeat()` (§0.5.a) on `solveWing`+`phaseCenter('downstroke')` | downstroke depth **= idle-band peak × 1.4–1.8** (drives past the idle band), one beat, ease to cruise over **~700ms** | envelope plays **exactly once**, non-looping, returns to the integrated `flapPhase` clock |
| **B — RIM / key LIFT** | `igniteRim()` (§0.5.b) → `updateRim` (`rimLight.js:60`) | rim strength **+8% ≤ lift ≤ +12%** over baseline, single ramp; **decay to baseline by ~600ms** | single ramp-and-decay, back to baseline, no loop |
| **C — CAMERA PUSH toward subject** | splash-branch hook (§0.5.c) → `punchKick`/`damp` (`cameraController.js:291-296,:186`) | push **= 4% ≤ mag ≤ 6%** of the splash camera→subject distance, sin-enveloped | single kick, **returns to the LOCKED splash pose** (position delta → 0), 60fps-gated |

- **Co-timing:** all three fire on the **same wordmark-resolve frame**; the composite reads as ONE dragonfire event, not three tics.
- **The amplitude FLOOR is the anti-timid guard (round-3 fix #3, applied to the 3D layers):** each layer asserts amplitude **≥ its floor** (downstroke depth ≥ idle-peak×1.4, rim ≥ +8%, push ≥ 4%) via the Phase-0 envelope read — a too-timid ignite is **machine-catchable (class B)**, not resting on owner taste.
- **60fps gate:** if the frame-time probe (§1.4) shows any frame > 16.6ms during the ignite, the layers **attenuate/skip** rather than drop frames. Elastic count = 0; GOLD/warm only (the rim uses the dragonfire key, no second hue).

**ESCALATION LADDER — auto-fires, in order, if the owner's live-preview verdict is "not a dragonfire event" (round-3 fix #2 — a planned swap, not a fresh design round):**
1. **Add the head-turn-to-camera** — `headTurnToCamera(yaw)` (§0.5.d), a subtle "the dragon notices you" head yaw landing as the wordmark resolves, easing back to the velocity-driven rest. (A whole-body `setDragonLook` bank is the cheaper read but reads different — the head-yaw envelope is the intended escalation.)
2. **Deepen the three amplitudes** toward their ceilings (downstroke → ×1.8, rim → +12%, push → 6%).
3. **Swap in / layer the named procedural spectacle fallback** (below) if the 3D ignite still reads timid.

**The named EMBERLINE-legal spectacle fallback + optional co-timed CSS bloom (round-3 fix #2 + fix #3):**
A net-new **`.splash-godray` procedural dawn-break / light-shaft rake** — a GOLD radial/conic gradient pseudo-element seated **behind `.splash-title`** and **over `.splash-horizon`**, opacity `0→peak→rest` with an in-plane scale `0.96→1.0` sweep across the **1.0→1.65s** resolve. It MAY layer co-timed behind the wordmark by default, and it is THE swap target at ladder step 3. Caps (transform/opacity/gradient only, zero assets):
- **Peak-opacity BAND — floor AND ceiling (fix #3):** peak opacity **0.32 ≤ peak ≤ 0.50**. A swell that never reaches 0.32 is a machine-catchable "nothing happened" failure; a swell above 0.50 breaks the wash cap. **Asserted on the same headless frame probe** (§1.4) — class B.
- Blur peak **≤ 28px** (the §1.2 onion-glow cap); **one-shot** (fires once on the 1.0→1.65s resolve); after the swell it is **removed to a static, non-animating rest** (residual wash opacity **≤ 0.18**, or removed from DOM) — no loop, no repeat, no second accent. **GOLD only.** Elastic count = 0.
- (Alternative CSS variant, recorded not shipped-by-default: an **ember-convergence** — 3–5 of the §1.4 seeded embers ease transform-only toward the wordmark centroid, arriving as it lands. Drawn from the same seeded set to preserve byte-identical determinism.)

**Budget proof (NUMERIC, class B):** the three 3D layers are uniform writes + envelope math (zero draw calls, zero new geometry) and the optional CSS bloom is one gradient layer animating ~0.65s then static → **0 frames > 16.6ms** added, asserted on the §1.4 probe.

### 1.3 Reveal cadence (first-10-seconds beats — pure opacity/transform, no scene change)
Implement as `.armed`/staged classes in `splash.js:45-58` HTML + CSS `animation-delay`s. **All beats ± 80ms.**

**First-timer affordance gap resolved:** the ONLY input affordance + the audio-autoplay ignite gate used to appear at ≥2.8s, stranding a first-timer in a silent world for ~2.8s. **Fix (option a):** a minimal, quiet **tap affordance** (`.splash-hint`, one dim glyph or a 2px breathing dot in the CTA seat, Rajdhani `--fs-micro`, opacity ≤ 0.55, transform/opacity only) reveals at **t ≈ 0.6s (± 80ms)**, *before* the wordmark/slogan/tag cadence completes, and **persists**. It is a live ignite target from the moment it appears, so audio can wake at t≈0.6s. At **t ≥ 2.8s** it upgrades in place to the full **"TAP TO BEGIN"** breathe (cross-fade, same seat, no pop). The early hint never carries saturated gold — a whisper, not the hero CTA.

| t (± 80ms) | Beat | Mechanism |
|---|---|---|
| **0–0.6s** | pure living world (dragon, ring, embers moving; **all chrome opacity 0**) | scene layers only; `.splash-top`/`.splash-bottom`/`.splash-hint` opacity 0 |
| **0.6s** | **subtle persistent tap affordance appears** (faint hint in the CTA seat; also the live audio-ignite gate) | `.splash-hint` opacity `0→≤0.55`, quiet breathe; **persists** |
| **1.0→1.65s** | wordmark resolves (650ms, `--ease-enter`, `0.10→0.16em`) **+ the §1.2a signature ignite (wing + rim + push, one-shot)** | §1.2 + §1.2a |
| **1.65–2.2s** | slogan "it's a skill issue" (**PROTECTED — time only, NEVER edit copy**) | fade ~500ms, delay 1.65s |
| **2.2–2.8s** | tag "Evolve. Drift. Conquer the skies." | quiet Rajdhani, delay 2.2s |
| **≥ 2.8s** | hint **upgrades in place to "TAP TO BEGIN"** (full gold breathe) | `.splash-hint` cross-fades into `.splash-begin`, same seat |

- **NUMERIC:** first tap affordance visible at **t = 0.6s ± 80ms**; audio-ignite gate live that same frame; full "TAP TO BEGIN" breathe at **t ≥ 2.8s**. The pre-affordance silent-world beat is now **≤ 0.68s**, not ~2.8s.
- **R3 — untangle container fade from element cadence.** `.show` reveals **scene layers only**; every chrome layer (`.splash-hint`/`.splash-top`/`.splash-bottom`/wordmark/tag/CTA/god-ray) starts at **opacity 0 independent of `.show`** and animates in on its own staged delay — no compounding with `splash-in`.
- **G4 — early-ignite fast-forwards, never strands.** The `pointerdown` handler (`splash.js:74-78`) can fire before the hint or any time after. On an early tap: **jump all reveal beats to settled end-state** (hint already upgraded to "TAP TO BEGIN", wordmark fully resolved at 0.16em, slogan/tag visible, **the §1.2a ignite snapped to its settled rest — wing at cruise, rim at baseline, camera at the locked pose, god-ray at static rest, never mid-swell**) in one snap; the sheen plays **at most once**; the ignite fires **at most once** (if already played or skipped by the snap, it lands directly on rest, never replays). Never leave the wordmark mid-reveal or a half-bloomed god-ray.
- **Two-tap ignite kept** (`splash.js:74-78`): first tap wakes audio + swells intro theme (now reachable from t≈0.6s); second/TAKE OFF flies. Protected.
- **CTA breathes, rationed:** `.splash-cta` scale `1.0↔1.02`, 2.4s ease-in-out (`splash-cta-pulse`) — verify it's `transform:scale`, not box-shadow (currently scale ✓). Only gold-filled at-rest-animated control.

### 1.4 Deterministic embers (G3 — seed ALL FIVE params; R5 — break phase-lock)
`splash.js:22-36` (`buildEmbers`) and `.splash-ember` (`style.css:2679`):
- Replace `Math.random()` with a **deterministic golden-ratio / sin-cos distribution seeded off index `i`.** **Seed ALL FIVE params: position, duration, delay, opacity, drift** — two renders **byte-identical** for the screenshot gate.
- **R5 — no marching-band strobe:** vary the **seeded duration per index** across **7–16s** (do not ship 16 identical durations) so the even distribution never phase-locks into a visible rhythm, while staying reproducible.
- **Kill the box-shadow:** `box-shadow: 0 0 8px` per ember (`style.css:2682`) is a glow-strip tell at 16× and costs mobile fps. **`box-shadow` count = 0** — use the existing soft radial-gradient background.
- **NUMERIC:** ember count = **16** (`EMBER_COUNT`); drift loop **7–16s**; box-shadow **0**; all five params seeded. If §1.2a's ember-convergence variant is ever chosen, the converging embers are drawn from this same seeded set (transform-only re-target), preserving determinism.
- **Splash frame budget (NUMERIC):** **0 frames > 16.6ms** headless over a 5s idle (inclusive of the §1.2a ignite + optional bloom).

### 1.5 Sound (polish, not a blocker)
Hook `uiSound.js` on first ignite (already fires `handlers.onIgnite`): warm major-triad swell on wordmark resolve; honor mute. No audio files. **Human residual (C).**

**Increment:** all changes are `#splash` CSS + `splash.js` staging + the Phase-0 ignite APIs — the splash is a standalone hero surface, so this IS proving on the hero. No roster risk.
**Verify:**
- **(A) CI machine:** `grep purple/54,22,92` on `#splash` → 0; `grep box-shadow` on `.splash-ember` → 0; `uitokens.mjs` still passes; exit/enter ratio ≤ 0.66 on splash elements (computed-style).
- **(B) manual dev-tool:** `node tools/uishots.mjs splash` → warm (no purple), wordmark 0.16em, chrome absent at t<0.6s, tap hint present at t≈0.7s; the §1.2a ignite fires **exactly once** with **each layer amplitude within its floor–ceiling band** (wing ×1.4–1.8, rim +8–12%, push 4–6%) and returns to rest; the optional god-ray peak opacity in **[0.32, 0.50]**, blur ≤ 28px, static by t≈2.0s; headless frame-time probe (0 frames >16.6ms inclusive of the ignite); byte-identical ember render across two runs.
- **(C) owner live-preview:** the ignite reads as a dragonfire *event* (ladder fires if not); reveal feel; sound swell.

---

## 2. RETURNING PLAYER + IDLE-REWARD POP-IN — replace `main.js:879`  *(P0 — R2 + G1 resolved below; then one round)*

**Owner complaint resolved:** the flat `"Tailwind while you were away: +◆100. The sky kept your seat."` — the #1 cheap tell — becomes a choreographed premium reward card with a real gacha **reveal beat**. Neither owner-flagged phrase survives (§2.5).

### 2.1 What login looks like
Returning pilot (`bootHasNotice`, `main.js:872,880`) already routes to the **hub, not the splash** (`main.js:931-937`) — keep. The hub assembles (§3/§5 stagger), *then* the reward card plays over it. Mode-A claimable reward on `game.state !== 'playing'`, so a partial scrim is legal.

### 2.2 RESOLVE R2 ON PAPER — the wallet is ALREADY mutated at boot (with a drop-frame-safe invariant)
At `main.js:878` `saveData.embers += gift` runs **before** the hub renders the topbar (`ui.js:1915`), so the topbar already shows the **POST-gift** balance; a naive count-up animates `new→new` (invisible). Same for the gambit refund at `main.js:884`.

**The contract:**
1. **Capture `preGift = saveData.embers` BEFORE the boot mutation** (or subtract the gift back for the display baseline). Card + topbar animate `preGift → preGift + gift`.
2. **Defer the visual increment:** the topbar renders showing `preGift` until the count-up runs, then ticks to the true stored value.
3. Applies identically to the gambit refund (`main.js:884/886`).

**The same-frame invariant, made drop-frame-safe (round-3 fix #4 — testable without device-jank brittleness):**
- **Assertion:** count-up delta **=== wallet delta**, with the topbar tick landing on the card number's land **within a 1-frame tolerance (≤ 16.6ms)** — not a strict same-tick equality that a real mobile frame drop would fail.
- **What the machine (class B) asserts:** (i) `finalCountUpValue === storedWalletValue` (exact, value equality — no tolerance on the *value*), and (ii) `|topbarTickTime − cardLandTime| ≤ 16.6ms` (one frame).
- **What the display does on a dropped frame between the two:** the two are driven from **one shared tween source** (the `tweenNum` clock, `ui.js:2472`), so if a frame is dropped between the topbar tick and the card land, **both read the same clock value on the next painted frame** — the dropped frame shows the *consistent* interpolated value on BOTH (never a torn state where the card shows final and the topbar still shows pre-gift). The invariant is on the shared clock, so device jank cannot desync them; it can only delay both by one frame together.
- When two rewards fire (§2.5), the asserted invariant is on the **SUM**: total count-up delta **=== total wallet delta**, the topbar's final tick landing within one frame of the **LAST row's** count-up finish, both off the one shared clock.

### 2.3 RESOLVE G1 ON PAPER — the card must NOT sit on the dragon (composition invariant, tightened)
A center modal is exactly the "chrome on the dragon" the HUB COMPOSITION LAW forbids. **Decision (option a):** the reward card **seats in the lower ~40% of frame; the dragon holds center.**

**The invariant, disambiguated:**
- **"Center third" is defined against the SUBJECT bbox, not the frame** — the vertical center third of the projected `Box3().setFromObject(equippedDragonGroup)` silhouette (the same object §3.2 defines), at the hub FOV. **0 card pixels** may enter it.
- **The stronger assertion:** the card's **top edge sits BELOW the subject's RENDERED vertical extent — the bottom of the projected `Box3.setFromObject(equippedDragonGroup)` silhouette — not merely below its center of mass**, at the hub FOV. A low-hanging tail or dropped wing extends the silhouette below the centroid; the card top must clear the *lowest rendered subject pixel* + margin. Where a low tail/wing pushes the silhouette bottom into the lower-40% band, **the card yields** (shrinks height / drops its top edge) so its top stays below the silhouette bottom — the subject always wins.
- **NUMERIC:** card **max-width ≤ 420px**; card top edge **below the projected subject silhouette's rendered bottom** (Box3-derived, §3.2) with a **≥ 2% frame-height clearance**; **0 card pixels over the subject bbox's center third**. Scrim **behind the card 0.44–0.52**; scrim **over the dragon ≤ 0.12**.
- **Measurement:** the `Box3` projection from §0.5.e (geometry, no rendered pixels); the card layout reads that bottom-edge value and clamps its top edge below it.
- (Fallback option b — camera lifts the dragon ~10% while the card is up — NOT used; recorded so a future change doesn't re-litigate.)

### 2.4 The reward card — build as a new coexisting component
**New:** `ui.js` `showRewardCard({ label, amount, sub })` (+ its multi-row form, §2.5) + `#reward-card` DOM node + CSS. Built from **THE ONE PANEL RECIPE** (`--panel-fill/-line/-inner/-shadow`) — the single active modal: **exactly 1 soft shadow, 1 hairline, 1 inner top highlight.** Zero assets; transform/opacity/gradient only.

**4-beat choreography (single-amount case):**

| Beat | What | Timing / token (NUMERIC) |
|---|---|---|
| 1 | asymmetric scrim fades in (heavy behind card, light over dragon) | ~220ms; behind-card **0.44–0.52**, over-dragon **≤ 0.12** |
| 2 | warm-glass card enters, scale **`0.90→1.00`**, ONE settle | **340ms `--ease-enter`** (`--t-card-enter`) |
| 3 | **amount counts up 0→gift**, tabular-nums, GOLD; topbar wallet ticks `preGift→preGift+gift` off the shared clock (§2.2) | **~820ms easeOutQuad** (`tweenNum`, `ui.js:2472`) |
| 4 | tap to dismiss (never auto-timeout an actioned reward) | **200ms `--ease-exit`** (`--t-card-exit`) → exit/enter = **0.59** |

**The withheld-glow reward flourish (the premium gacha reveal beat):** a single **component-scoped GOLD currency sigil** (the ◆ ember emblem, adjacent to/behind the amount) **blooms exactly ONCE on count-up finish, on the SAME FRAME as the `--ease-spring` settle:**
- **NUMERIC:** sigil opacity `~0.0 → 1.0`, scale **≤ +8%**, then settles on the spring — **one bloom, one settle, then static.** GOLD only, `filter: drop-shadow` withheld-glow peak **≤ 20px blur, glow opacity ≤ 0.5**, removed to a static rest. The ONE gold element of the flourish — no second accent, no elastic, no repeat.
- **The ONE rationed overshoot:** `--ease-spring` fires **exactly once**, on count-up finish, carrying **both** the number land **and** the sigil bloom on the same frame, overshoot **≤ 8%**. **Elastic count = 0.**
- **Type tokens:** amount = **`--fs-display`** GOLD `tabular-nums`; label = **`--fs-label`** caps `0.10em`; sub = **`--fs-body`**. Card uses **≤ 3 of the 6 sizes; 0 seventh size.** The sigil is an emblem, not a type size.
- **Optional shine-sweep:** one CSS gradient pseudo-element, one-shot **700–1000ms, opacity ≤ 0.22**, then **removed from DOM**.

### 2.5 Copy — premium voice (COMMITTED; neither owner-flagged phrase survives)
The owner flagged **both** "Tailwind while you were away" AND "The sky kept your seat" as cheap. v5 **retires both**:
- `main.js:879` → `ui.showRewardCard({ label: 'Tailwind banked', amount: CONFIG.welcomeBackGift, sub: 'Day {N} aloft' })` — one calm declarative clause; the count-up shows the number; **no inline `+◆100`, zero exclamation, no sentimental second sentence.**
- `main.js:886` (refund) → `label: 'Gauntlet stake returned', amount: gambitSunsetRefund`.
- **The no-gift returning line is COMMITTED as a premium final, not a residual:** when a returning pilot boots with **no gift** (gap below threshold), the hub shows a quiet one-line greeting **`Welcome back, pilot.`** with sub **`Day {N} aloft`** — declarative, GOLD carries nothing here (neutral hairline text), no card, no count-up. This is the finished copy, not a placeholder.

**The two-amount consolidated card (gift AND refund on one boot):** mount **exactly 1 consolidated card** via `showRewardCard({ rows: [ {label,amount}, {label,amount} ], sub })`:
- **Two labelled rows**, each a left-aligned `--fs-label` caps label + a right-aligned **`--fs-display` GOLD `tabular-nums` amount** (both amounts share one tabular grid column so digits align). No SUM line — the two rows ARE the reveal.
- **Row stagger:** rows reveal **staggered 80–120ms**, each 200–300ms fade + `translateY 8–12px→0`, reusing the PROTECTED recap-ledger cascade (§2.7) — never two cards, never N toasts.
- **Count-up:** each row counts up on its own row (staggered with the reveal); topbar ticks `preTotal → preTotal + gift + refund`. The **§2.2 SUM invariant holds** (`(row1 + row2) count-up delta === total wallet delta`; topbar final tick within one frame of the LAST row's finish, off the shared clock).
- **The §2.4 flourish fires ONCE for the card** — a single GOLD sigil blooms on the **last row's** count-up finish / the single shared spring settle. Not one per row.
- **The §2.3 composition invariant applies** — the taller card's top edge still sits below the projected silhouette bottom; if the extra row pushes it up into the silhouette, the card yields.
- **Single-reward boot** uses §2.4 unchanged. **Toast count = 0** in both cases.

### 2.6 Reduced-motion + a11y (extends the PROTECTED credit)
Under `prefers-reduced-motion: reduce`: **0 transform/scale/overshoot/shine/sigil-bloom**; **snap `+gift` (and each row) to final** (no count-up — the topbar simply shows the stored value); **150–200ms opacity only**; the GOLD sigil appears at its static rest with no bloom. `aria-live="polite"` on the reward line(s); glass text contrast **≥ 4.5:1**. Mirror the splash reduced-motion block (`style.css:2865-2868`).

### 2.7 If it grows past one line
Reuse the **PROTECTED recap-ledger cascade** (do not reinvent): stagger rows ~80–120ms, each 200–300ms fade + `translateY 8–12px→0`. This is the mechanism the §2.5 two-amount card rides. Never N toasts.

**Increment:** the card **coexists** with `setStartNotice` (`ui.js:2482`) — keep `startNotice` as a one-increment fallback, prove the card on the welcome-back trigger, then delete the `start-notice` `<p>` render (`ui.js:1957`) + its CSS (`style.css:2222`). **Cleanup (audit-blocker 5):** `setStartNotice` is fired **only** at `main.js:879/:886` (gift + refund) — it does **NOT** serve the CHALLENGE line; the `challengeScore` banner renders directly from `game.challengeScore` at `ui.js:1956` (hero) / the race strip `ui.js:1073-1081` (in-run). The prior "setStartNotice serves the challenge line" rationale is retired; the `challengeScore` declutter lives in §5.5.
**Verify:**
- **(A) CI machine:** reward-card CSS uses ≤ 3 of 6 sizes (computed-style); `grep` shows no inline `+◆` in the new copy; exit 200 / enter 340 tokens present; `uitokens.mjs` passes.
- **(B) manual dev-tool:** card mounts on `gapDays > CONFIG.welcomeBackGapDays`; **count-up value === wallet value (exact)** and topbar tick within **≤ 16.6ms** of card land off the shared clock (SUM for the consolidated case); overshoot fires once ≤ 8%; the GOLD sigil blooms exactly once (opacity 0→1, scale ≤ +8%) on the spring-settle frame; consolidated card renders exactly 2 rows staggered 80–120ms with one shared sigil bloom; card ≤ 420px with top edge below the projected `Box3` silhouette bottom (≥ 2% clearance); `uishots reward` mid-count + settled + two-row; reduced-motion snapshot shows 0 transform + 0 sigil bloom.
- **(C) owner live-preview:** land feel (spring amount, sigil-bloom intensity, shine); sound.

---

## 3. HUB COMPOSITION — dragon OWNS CENTER, never cropped, never spinning over a void  *(P0 — R1/G1/G2 + fill target + FOV calibration + §0.5.e resolved below; owner-preview sign-off + class-B probe)*

**Owner complaint resolved (the deep one):** a **camera/framing-rig fix in `cameraController.js`**, not a CSS nudge.

### 3.1 RESOLVE R1 ON PAPER — FOV is a ceiling to TEST, not a fixed constant
Narrow FOV + bbox-fit pulls the frame tight and can show LESS ring-course/horizon — making the void **worse**. Narrow-hero-read and world-stays-alive fight directly. **FOV 34 is a CEILING tested against the fill floor (§3.3), not a constant.**
- **NUMERIC:** target showcase FOV = **34° ± 1**, eased from 58 (respect `wasShowcase` snap-arming at `:186,228`). **If fov 34 cannot hold the fill floor (skyFraction ≤ 0.55), compromise to fov ~40–44 — never below 34.** The value inside `[34, 44]` is fixed by the §3.3 calibration sweep AND confirmed on owner-preview.

### 3.2 RESOLVE G2 ON PAPER — the bbox-fit reference pose (+ derivation of the 60–72% target)
A winged dragon's bounding sphere differs folded vs mid-flap; per-frame fit jitters, single-frame fit clips on the flap.
- **bbox SOURCE:** `new THREE.Box3().setFromObject(equippedDragonGroup)` — the equipped dragon's root group (the ONLY thing the MENU LAW lets a menu touch), **not** the whole scene and **not** the camera rig. That `Box3` is the input to the fit solve, the §2.3 card-clearance measurement, and every recompute (all via the §0.5.e geometry pass).
- **Spec:** fit to a **static rest-pose `Box3` PLUS a fixed wing-span margin** — the **95th-percentile silhouette** (rest `Box3` + full-spread wing allowance) so a mid-flap frame never clips. **Recompute the `Box3` ONLY on mount + `resize`/`orientationchange`, NEVER per animation frame.**
- **Derivation of the bbox-height target (provisional-until-preview):** headroom **12–15%** + floor **8–12%** leaves the subject **60–72%** frame height (marked provisional; owner confirms on preview). Solve camera distance so the subject occupies that with the headroom/floor split. Strictly camera-only.
- **NUMERIC:** subject bbox **occupies 60–72% frame height**; **headroom 12–15%**; **floor 8–12%**; **0px clipped**; `Box3` recomputed on `resize`/`orientationchange`, never per frame.
- **Round-3 fix #5 — bind the bbox target to the SAME 8-yaw pass as the fill probe:** assert **`bboxHeight ∈ [60%, 72%] AND 0px clipped` at the SAME 8 sampled yaws + both ±15° sway extremes** that §3.3's skyFraction probe uses — one shared pass. "Never cropped" is then a class-B numeric check at **every** sampled yaw, and the owner judges only taste above that floor (not whether a crop exists).

### 3.3 RESOLVE the anti-void guarantee — the fill floor, the FOV calibration sweep, the interaction rule
The `showcaseAngle += dt*0.3` full orbit is the "rotating around empty background."
- **Replace the 360° turntable with a banking-cruise / limited sway.** **Full 360° turntable = removed.**
- **NUMERIC — sway:** auto-yaw clamped to **≤ ±15°** (or ≤ ~5°/s; full period ≥ 72s) so the mint ring course + warm sky + ember field stay behind the dragon. Prefer **idle-posed with OPTIONAL drag-to-rotate** over any auto-spin.
- **Liveliness FLOOR on the sway amplitude (committed):** the sway amplitude is **≥ ±6° (floor) and ≤ ±15° (ceiling)** — clamping DOWN toward the fill floor can never collapse the hub into a dead near-static frame. If the fill floor ever forces the sway below ±6°, the §3.3 fallback (below) fires instead of flattening the motion.

**PRE-BUILD FOV CALIBRATION SWEEP — prove the fill floor is ACHIEVABLE before committing FOV (class B):** run a calibration pass on the **equipped hero dragon** using the §0.5.e probe:
- **The sweep:** step the raycast probe across **FOV `[34, 44]`** (1° steps) **×** the **8 sampled yaws** **×** the **±15° sway extremes**, computing `skyFraction` at each `(fov, yaw)` — a **measured surface**, not an assumption.
- **Pin the FOV:** ship the **narrowest** FOV in `[34, 44]` where the probe passes (`skyFraction ≤ 0.55`) at **ALL 8 yaws AND both sway extremes** — narrowest so the hero read stays as tight as the floor allows. Record the surface + pinned value in the Gate Log.
- **Explicit fallback if NO in-band FOV passes at all yaws (so §3 cannot dead-end):** in order — (1) **tighten the sway clamp** from ±15° toward ±8° (never below the ±6° liveliness floor), re-sweep; if still failing, (2) **add a procedural far-field fill element behind the dragon** (net-new, no-asset — a distant procedural cloud-bank / haze gradient plane or a second faint ring-course arc seated behind the subject, transform/opacity/gradient only, inert showcase set-dressing gated on `game.state !== 'playing'`, MENU-LAW-safe, never the run world) so the probe registers `filled` at empty yaws; re-sweep and pin. The floor is guaranteed reachable because (2) directly raises the `filled` count. **FOV never below 34.**

**Interaction — drag-to-rotate vs tap-to-fly (spec'd against the existing gesture, no collision):**
- **Deadzone / threshold rule:** on `pointerdown` in the hub subject region, record origin. Move **> 10px** before `pointerup` → **drag** → rotates the showcase camera (within the manual clamp) and **suppresses the fly** on release. Move **≤ 10px** and release **< 500ms** → **tap** → fly (existing gesture, unchanged).
- **Manual rotate clamp (NUMERIC):** drag-to-rotate bounded to **≤ ±45° yaw from the idle-sway center** (a peek, hard-clamped so the finger can never spin behind the subject into the void). Yaw-only (pitch not drag-controllable). Enforced every drag frame.
- **Region rule:** drag-to-rotate armed **only inside the hub subject region** (dragon bbox + small margin). A pointerdown on any DOM chrome (topbar/rail/CTA/card) never rotates and never flies from the drag path — the DOM element handles it.
- **On release after a rotate:** camera **eases back to the idle-sway pose over ~600ms** (peek, not a new resting pose), so the fill floor re-establishes.
- **Reduced-motion drag behavior (NUMERIC):** under `prefers-reduced-motion: reduce`, direct manipulation still tracks the finger during an active drag (control, not decoration), but **on release the peek returns to idle-sway WITHOUT the 600ms ease — instant snap (0ms) or heavily shortened ≤ 100ms** — so the fill floor re-establishes immediately. The idle-sway itself is already reduced/paused under reduced-motion (G6).
- **No-drag fallback:** if drag-to-rotate is cut for scope, the hub commits to **idle-sway-only**; tap-to-fly is untouched. Either way there is **never an undisambiguated pointer sequence**: drag(>10px)→rotate(±45°)+suppress-fly, or tap(≤10px)→fly.

**NUMERIC — background-fill floor (the measurable "never empty") via the §0.5.e raycast probe (option a — geometry, not pixels):**
- **The probe:** from the showcase camera (the exact `hubFov` pose + yaw under test), cast a **24×14 = 336-ray grid** across the frustum. Each ray tests the **showcase scene geometry only** (dragon group, mint ring-course meshes, horizon/water plane, ember billboards, + any §3.3-fallback far-field element). A ray hitting nothing / only the far skybox = **sky**; a hit = **filled**. `skyFraction = skyHits / 336`.
- **The assertion (class B — deterministic, numeric, but NOT a PR-blocking CI gate unless §0.5.e promotes it to class A):** `skyFraction ≤ 0.55` at the **same 8 sampled yaws + both sway extremes** as the §3.2 bbox pass (fix #5 — one shared 8-yaw pass). It never renders a pixel, so it is unaffected by the canvas-blanking gate; but it needs the booted scene graph, so it is class B until §0.5.e proves headless construction. **The 55% floor is a MACHINE-EVALUABLE number, not owner-eye — but it is a class-B dev-tool gate, not a CI PR gate.** The same probe powers the calibration sweep.
- **Determinism:** the probe runs on the deterministic showcase pose → same `skyFraction` across runs.
- **Depth aids (no assets):** procedural rim light on the dragon + soft radial vignette (reuse the warm `.splash-vignette` recipe), vignette edges **25–40% darker than center**, so the subject never floats on a flat field.
- **NUMERIC — composition:** subject offset from dead-center **5–8%** (rule-of-thirds).

### 3.4 Welcome → hub flow = reframe the SAME scene (no hard cut) — MENU LAW
Splash pose (`cameraController.js:161-179`, fixed z+14/y+4/fov66) → hub pose (§3.1) is a **camera dolly on the same scene**, not a second scene.
- **NUMERIC:** splash→hub dolly **~700ms**; DOM chrome cross-fade **200–300ms starting ~150ms in** (world settles first). The `launchFlash()` gold burst (`splash.js:112`) masks the gameplay cut for TAKE OFF — keep.
- **G6 — reduced-motion:** snap camera pose, no dolly; menu staggers snap.

### 3.5 Subject-owns-center chrome law (HUB COMPOSITION LAW; also G1)
The DOM bands correctly (`hero-topbar` top, `hero-core` middle, `hero-rail` bottom). The lesson's caught failure is wordmark/CTA **on** the dragon in the middle third.
- TOP band ~14–18% (topbar). CENTER ~60% carries **0 chrome pixels over the subject bbox** — `hero-core` wordmark+CTA sit in the **lower** portion of center or the bottom band. In portrait, bias the *subject* ~52–55% down and seat wordmark→CTA in the lower third (`hero-core` `padding-top` biases on mobile, `style.css:2787` — verify the CTA clears the dragon crown/wings on a real phone).
- The §2 reward card obeys the same law via §2.3.

**MENU-LAW invariant (NUMERIC):** run/obstacle/player mutations across any menu frame = **0**; only camera + subject touched; every hide is `.visible`-gated on `game.state !== 'playing'`. (The §3.3-fallback far-field fill, if built, is inert showcase set-dressing gated on `game.state !== 'playing'`.)

**Increment:** add `hubFov` + bbox-fit as a **coexisting flagged branch**; run the §3.3 calibration sweep (needs §0.5.e) to pin FOV; prove on the equipped hero in showcase; keep the shop static framing (`shopMode`, `:197-199,221`) **byte-identical**. Migrate orbit→sway last.
**Verify:**
- **(A) CI machine:** `camera.fov` literal in `[34,44]` in the showcase branch (static source read); MENU-LAW invariant asserted by the existing state-mutation lint (0 run/obstacle/player mutation across a menu open — this is JS-state, not canvas).
- **(B) manual dev-tool (needs the booted scene / §0.5.e; promoted to A only if §0.5.e proves headless):** the §3.3 calibration surface (skyFraction over `[34,44] × 8 yaws × sway extremes`) + the pinned FOV where the probe passes at ALL yaws; `skyFraction ≤ 0.55` at 8 yaws + sway extremes; **bbox-height ∈ [60%,72%] AND 0px clipped at the SAME 8 yaws + sway extremes** (fix #5, one shared pass); `Box3.setFromObject(equippedDragonGroup)` recomputes on a synthetic resize (not per frame); auto-yaw within **±6°–±15°** (floor + ceiling); manual drag clamp ≤ ±45°; drag threshold 10px disambiguation (6px→fly, 20px→rotate+suppress-fly); reduced-motion drag release snaps ≤ 100ms (no 600ms ease).
- **(C) owner live-preview (R4 — the composition VERDICT is never a machine gate):** crop, the *look* of the fill above the probe floor, chrome-clear, cruise feel, drag-peek feel, final FOV within `[34,44]`. **This section may legitimately need two rounds** (the never-empty FLOOR is the class-B probe + calibration; the owner judges taste above the floor). Recorded in the Gate Log so no one greens the *composition* on a machine.

---

## 4. CHEAP TEXT → PREMIUM — `«Slipstream»` chip + all hub copy  *(P2 — green after §0)*

### 4.1 The title chip (`ui.js:1958`, CSS `style.css:2552-2556` + `.title-chip` `style.css:2226`)
Current: `«${title}»` guillemets + `font-style: italic` + gold — both cheap-decoration tells.
- **Drop the `«»`** → `ui.js:1958`: `<button class="hero-title-chip" id="chip-title">${title}</button>` (Slipstream = equipped title, `titles.js:71 equippedTitleName()`).
- **Restyle to the quiet chip recipe:** 1px warm hairline (`--panel-line`); warm-glass fill 4–8%; `--r-s` (6px) or pill; all-caps **Rajdhani `--fs-label` at `--track-caps-tight` (0.10em)**; **remove `font-style: italic`**; zero gradient/gloss/bevel/shadow; one `--panel-inner` top highlight. Equipped marker = **one thin leading gold hairline OR one small GOLD dot** — GOLD ink limited to the dot/hairline, not the fill.
- **G5 contrast:** chip text ≥ 4.5:1 over its local scrim.

### 4.2 Kill CYAN on the calm hub (the color-law violation — audit-blocker 3)
`ui.js:1908`: hero embers emit `--c:#7fe6ff` (CYAN) when `Math.random() > 0.4` (~40% of motes). CYAN is **vitals-only** — illegal on the calm hub. **Explicit recolor step (not a waiver):** change to **all-warm** — gold `#ffce6a` / ember `#ff9a3c` mix only, so the CYAN==0 standing-hub gate and the warm-gold ember hue hold.
- **NUMERIC (A):** `grep '#7fe6ff'` on the hub → **0**.

### 4.3 Tracking + copy voice (audit-blocker 4 — do not overclaim the machine gate)
- Hub wordmark (`.hero-wordmark`, `style.css:2546,2790`): mobile `0.14em` → **`0.16em`**; desktop `11px` letter-spacing → **convert to `0.16em`** (px→em).
- `.action-key` px→em conversion kept (correct) — **but flag the ~22% tracking reduction for human sign-off (audit-blocker 5), not a silent change.**
- All-caps rail labels / topbar chips → `--track-caps` (positive; "display wants negative" is a TRAP for all-caps).
- Copy: welcome-back re-voiced in §2.5; no-gift line committed there. No exclamation/"Wow!"/cutesy. **Do NOT touch the protected slogan** (`splash.js:52`).
- **Tracking-gate honesty (audit-blocker 4):** `trackingViolations()` is file-scoped and `style.css` is in `TRACK_ALLOWLIST` (`uitokens.mjs`), so the tracking lint **cannot be armed** without evicting ~40 other px letter-spacing values. **Do NOT claim "the machine gate is now TRUE."** Choose one: **(a)** add a NEW **hub-selector-scoped** tracking lint (only `.hero-wordmark`/`.hero-title-chip`/`.action-key`), OR **(b)** downgrade the wordmark/chip/action-key tracking to **"verified by inspection" (class C)**. The px→em conversions ship either way; only the gate framing is corrected.

**Increment:** chip + embers + tracking are self-contained hub-hero edits — no roster risk.
**Verify:**
- **(A) CI machine:** `grep '«' '»' 'font-style: italic' '#7fe6ff'` on the hub → **0 each**; `uitokens.mjs` passes; hub screen uses **≤ 4 of 6** type sizes / 0 ad-hoc sizes (computed-style); the new hub-scoped tracking lint (option a) if built.
- **(B) manual dev-tool:** `uishots start` shows the un-guilleted chip.
- **(C) owner:** chip taste + dot-vs-hairline marker; the `.action-key` ~22% tracking reduction sign-off (audit-blocker 5).

---

## 5. CLUTTER SIMPLIFICATION — calm two-spine IA  *(P3 — hub green after §0; §5.5 in-run is a small recolor+reflow build)*

### 5.1 Two-spine model — verify, don't rebuild
- **TOP bar = identity/economy/settings ONLY** (`ui.js:1912-1919`): wallet (GOLD currency + BEST) + gear. Keep GOLD on currency/BEST; gear **neutral hairline** (verify not gilded).
- **BOTTOM rail = destinations** (`ui.js:1928-1944`): PILOT/QUESTS/SHOP/DAILY/BOSS RUSH — **at the 5-item ceiling. Rail ceiling = 5, never 6.** No destination migrates to the top bar; no chip duplicates a rail item.

### 5.2 Progressive disclosure — verify the cold first-paint (the primary declutter lever)
`ui.js:1894-1897`: cold (runs===0) → **wordmark + TAKE OFF only**; QUESTS at runs≥2; PILOT+DAILY at runs≥3; BOSS RUSH on first boss kill.
- **NUMERIC — cold first-paint DOM:** **0 `.hero-topbar`, 0 `.hero-rail`, 0 `.start-notice` nodes** — wordmark + CTA only. That clean first-paint IS the WOW.

### 5.3 Rail restraint — GOLD ≤ 10%, one primary verb
- **TAKE OFF** (`hero-cta`, `ui.js:1960`) is the ONLY saturated-gold, only-at-rest-animated control (breathe 2.8s scale→1.03, `style.css:2561`). It must win on size (**≥ 1.5× a rail item**) + accent + the only motion.
- **Rail icons:** quiet Rajdhani hairline, **not gilded** (`style.css:2584` sets icon `#ffd9ac` — verify only the *active/hovered* tab carries gold; resting icons desaturated).
- **NUMERIC:** hub **GOLD coverage ≤ 10% of hub pixels** (60/30/10). TAKE OFF is the ONLY at-rest-animated control. (The §2 reward sigil is a transient reveal beat, not an at-rest control — it does not count against the standing hub GOLD coverage.)

### 5.4 Badges — recolor any red pip, keep the clear-on-view logic
`pilotBadgeDue/questsBadgeDue/dailyBadgeDue/shopBadgeDue` (`ui.js:2734-2770`) + `badgeHtml` (`ui.js:2772`) gate honestly and clear on open — keep. A literal **RED/MAGENTA badge is illegal (MAGENTA=danger only).** Audit `.badge` CSS → recolor to **GOLD (action) or JADE (success/claimable)**.
- **NUMERIC:** RED/MAGENTA badge count = **0**; badge color ∈ {GOLD, JADE}. This ambient pip replaces the standing "Tailwind…" line for the *non-reward* case.

### 5.5 IN-RUN HUD DECLUTTER — the third complaint, taken at its word, now GROUNDED in file:line (round-3 fix #1)
The owner's third complaint is **"In-game CLUTTER,"** which most naturally means the **in-RUN experience**. §5.1–§5.4 handle the hub; **this section holds the in-run HUD to the SAME discipline** — two-spine IA, GOLD ≤ 10%, six sizes only, transform/opacity only, safe-area rigor — with numeric targets and **verified render-path + CSS `file:line`** (option a: audit and declutter, not a deferral).

**The in-run HUD render path (verified — the `game.state==='playing'` branch):**
- **DOM (built once):** `#hud` root `ui.js:489`; `.hud-top-left` `:491`; `.hud-top-center` `:498`; `.hud-top-right` `:511`; `.embers-hud` `:513`; `.graze-hud` `:520`.
- **Per-frame in-run update (`game.state==='playing'`):** `ui.js:900-1122` — score tier/pulse `:908-912`; surge gems + combo multiplier slug `:918-960`; the race/`challengeScore` strip `:1073-1081`; `.embers-hud` `:1043-1048`; `.graze-hud` `:989-995`; `updateHudState(player)` `:1119`.
- **The `challengeScore` copy** also renders as the hero `<p class="challenge">` at `ui.js:1956`.
- **CSS:** `#hud` `style.css:161`; `.hud-top-left` `:189,:506`; `.hud-top-center` `:193`; `.hud-top-right` `:216` (already `env(safe-area-inset-top)`); `.embers-hud` `:494` (`#ffc050` gold); `.graze-hud` `:271` (`#9dffea` cyan — vitals-legal in-run); stamina-arc surge `:587-588` (cyan `#c8fff2` — vitals); **`.challenge` `:1343`** (`font-size:16px` NON-token size + `letter-spacing:2px` px tracking — the cheap tell to fix); immersive override matrix `.hud-immersive` `:840-849`; per-element HUD override (H6 §F) `ui.js:2221-2228` → `saveData.settings.hudElements` via `hudState.js`.

**The two-spine model, in-run:**
- **Standing "vitals + score" spine:** score / distance / multiplier — one aligned cluster, **`tabular-nums` on every numeric**, one size for the primary metric (`--fs-title` or `--fs-head`) + one for its sub-label (`--fs-micro`/`--fs-label`) — **≤ 2 sizes for the whole vitals cluster.**
- **Transient-event spine:** boost / combo / +score popups / the `challengeScore` race strip — ephemeral feedback that **animates in on transform+opacity, auto-dismisses, and exits faster than it entered** (exit/enter ≤ 0.66). Never accretes as standing clutter.
- **No third free-floating readout** — anything that is neither a standing vital nor a transient event is cut or folded into one of the two spines.

**Color law, in-run:**
- **CYAN is LEGAL here and ONLY here** — boost/shield/vitals readouts (`.graze-hud` `:271`, stamina-arc surge `:587-588`) are exactly the vitals role CYAN is withheld for. Correct in-run; must NOT bleed to the calm hub (§4.2).
- **GOLD reserved** for score / currency / records only (`.embers-hud` `:494` stays gold); **GOLD ≤ 10% of in-run HUD pixels**. MAGENTA = danger only; JADE = a success/claim beat only. No fifth accent.

**Type + layout discipline, in-run (NUMERIC):**
- In-run HUD uses **≤ 4 of 6 sizes; 0 seventh size**; **tabular-nums on every numeric** (no digit jitter as the score climbs).
- **`.challenge` `:1343` → fix the cheap tell:** replace `font-size:16px` with a token size (**one** size), `letter-spacing:2px` → an em token; make it a single line, tabular, **auto-dismiss**, **not gilded** (no saturated-gold fill; GOLD ink only if it is a record beat), transform+opacity in/out, exit < enter. Applies to both the hero `.challenge` (`ui.js:1956`) and the in-run race strip (`ui.js:1073-1081`).
- Transient popups (+score, combo) are transform/opacity only, **auto-dismiss ≤ their entry duration × 3**, and **never overlap the safe-area insets.**

**Safe-area rigor (extends the PROTECTED credit):**
- **NUMERIC:** **0 in-run HUD elements** intrude into the notch / home-indicator / rounded-corner zones — every cluster sits inside `env(safe-area-inset-*)` (the `.hud-top-right` `:216` pattern extended to every cluster). Verify portrait AND landscape.

**Increment:** recolor + reflow + auto-dismiss timing + the `.challenge` token fix on the existing in-run HUD — no gameplay/state change, MENU-LAW-irrelevant (this is the live run). Coexist the reflowed HUD, prove on a live run, migrate.
**Verify:**
- **(A) CI machine:** `.challenge` `:1343` no longer uses `font-size:16px` or `letter-spacing:2px` (computed-style / grep); in-run HUD selectors use ≤ 4 of 6 token sizes; `tabular-nums` present on every numeric readout (computed-style); every transient readout's exit-dur < entry-dur (computed-style); MAGENTA restricted to danger selectors (grep).
- **(B) manual dev-tool:** 0 in-run HUD elements outside `env(safe-area-inset-*)` in portrait + landscape (boot poll geometry); GOLD ≤ 10% of HUD pixels (dev-tool measure).
- **(C) owner live-run:** the in-run "calm" verdict at speed (does the HUD read, does nothing fight the dragon); **confirmation that bringing the in-run HUD in scope matches intent** (Gate-Log decision — owner-confirmable).

**Increment (whole §5):** §5.1–§5.4 are verify-and-recolor (lowest risk); §5.5 is a small in-run recolor+reflow build.
**Verify (hub):** **(B)** `uishots start-cold` (0 `.hero-topbar`/`.hero-rail`/`.start-notice` nodes); `uishots start-warm` (topbar+rail present). **(A)** grep the badge color; rail ≤ 5 items (DOM count); hub ≤ 4 of 6 sizes. **(C)** GOLD-coverage feel (hub + in-run).

---

## 6. MENU FLOW — menu-as-camera-shots within THE MENU LAW  *(P3 — green; verify-existing + the one new dolly)*

Every screen is the **same frozen world, reframed by COLOUR + CAMERA only.** All hide-for-menu stays `.visible`-only, hard-gated on `game.state !== 'playing'`.

| Transition | Camera shot | Chrome | Tokens |
|---|---|---|---|
| **splash → hub** | dolly splash-pose → hub-pose (§3.4), **~700ms** | chrome cross-fade **200–300ms, starts ~150ms in**; hub stagger topbar→wordmark→CTA→rail | `--ease-enter` |
| **hub → shop** | orbit → static 3/4 (existing `shopMode` `cameraController.js:186-203,221`) | screen swap `--t-screen` | existing — **keep byte-stable** |
| **hub → quests/daily/pilot/rush** | camera holds hub pose; DOM panel slides over (`ui.js:1967+`) | panel enter `--t-ui`, exit `--t-exit` (faster) | reuse recap cascade for lists |
| **any → back** | reverse; **exits 0.59× enter**, accelerate | `hideScreen` `screen-leaving` at `--t-exit/--ease-in` (`ui.js:2486-2498`) — keep | |

- **Stagger law (NUMERIC):** hub entry reveals topbar→wordmark→CTA→rail at ~50–100ms steps, each 200–300ms decelerate, **total < 600ms** (`hero-intro`, `style.css:2624-2629`) — align delays to `--ease-enter`.
- **G6 — reduced-motion:** snaps camera poses AND menu staggers (no dolly, no cascade).
- **Blur budget:** ONE frozen modal only (the PROTECTED pause card); **0 blur over the live canvas.**
- Theme a menu (e.g. BOSS RUSH mood) via **COLOUR only, never world displacement** (MENU LAW).

**Increment:** the splash→hub dolly is the only net-new transition (built in §3.4); the rest is verify-existing. Prove the dolly on returning-player boot before wiring the cold→hub path.
**Verify:**
- **(A) CI machine:** 0 scene/obstacle/player mutation across any menu open (state-mutation lint); `game.state` gate holds; every panel exit dur < enter dur (computed-style).
- **(C) owner live-preview (R4):** the crop/void/dolly/cruise FEEL of §6 (canvas-blanking gates miss it); no transition ever hard-cuts.

---

## PROTECTED CREDITS — untouched (the bar, not the target)
Pause card · FromSoft boss title/spell/felled cards · recap ledger cascade (reused §2.7 + §2.5) · safe-area rigor (extended in-run §5.5) · styled range inputs · reduced-motion coverage (extended §2.6/§3.3/§6) · two-step armed destructive confirm · splash slogan "it's a skill issue" (`splash.js:52` — time-only). Shop static framing (`cameraController.js:197-221`) + honest-badge logic (`ui.js:2734-2770`) kept byte-stable except the badge *color*.

## GLOBAL LAWS HELD
Zero image/PNG/texture/audio-file assets · transform/opacity/gradient only · **no `backdrop-filter` over the live canvas** (blur = one frozen modal) · 60fps mobile (ember count 16, box-shadows dropped, 0 frames >16.6ms on splash inclusive of the §1.2a ignite, and on hub; the ignite adds 0 draw calls / 0 geometry / tricount untouched) · MENU LAW (state decoupled, only camera + subject dragon touched, `.visible`-gated, 0 run/obstacle mutation; the §3.3-fallback far-field fill is inert showcase set-dressing) · six font sizes / three radii + pill / four withheld accents (the §2 reward sigil is a single GOLD component-scoped withheld-glow, no fifth accent; in-run CYAN is the legal vitals role, §5.5) · one duration vocabulary (`--t-*`, no forked `--dur-*`) · one-file-per-lesson: on landing each surface, write `leapfrog/lessons/2026-07-17-<slug>.md`.

## GAP / RISK RESOLUTION LEDGER (closed before build)
- **PHASE-0 SPIKE** → §0.5: the four small new APIs (`igniteWingbeat`, `igniteRim`, splash-branch camera-push hook, `headTurnToCamera`) + the §0.5.e raycast/`Box3` crop-fill MEASURE pass (NOT a mask render — audit-blocker 2) are built and proven FIRST; the class-A/class-B status of the probe is decided in §0.5.e; no dependent gate is called runnable until its API lands.
- **WOW (committed, no either/or)** → §1.2a: a 3-layer 3D ignite (wing downstroke ×1.4–1.8, rim +8–12%, camera push 4–6%) firing together on the wordmark resolve, each one-shot with a FLOOR and a CEILING; escalation ladder (head-turn → deepen amplitudes → swap the named procedural dawn-break spectacle); the camera push IS IN, gated, returns to the locked pose, 60fps-gated.
- **G1** → §2.3 + §3.5: reward card seats lower ~40%, 0 pixels over the subject center third, **top edge below the projected `Box3` silhouette's rendered bottom** (≥ 2% clearance); dragon holds center.
- **G2** → §3.2: fit the 95th-percentile silhouette from `Box3.setFromObject(equippedDragonGroup)`, recompute on resize/orientation only; the 60–72% bbox target derived from the 12–15% headroom + 8–12% floor split (provisional-until-preview).
- **G3** → §1.4: seed ALL FIVE ember params off index `i` — byte-identical renders.
- **G4** → §1.3: early tap fast-forwards all beats to settled end-state (hint→full CTA; the §1.2a ignite snapped to rest — wing cruise / rim baseline / camera locked / god-ray static, never mid-swell); sheen + ignite each play ≤ once.
- **G5** → §1.1/§4.1: ≥ 4.5:1 for `.splash-tag`, the un-guilleted chip, rail labels on the warmed scrim.
- **G6** → §2.6/§3.3/§3.4/§6: reduced-motion snaps camera pose, count-up, sigil bloom, menu staggers, and the drag-peek release (≤ 100ms, no 600ms ease).
- **R1** → §3.1/§3.3: FOV 34 is a ceiling tested against the probe ≤ 0.55; the §3.3 pre-build calibration sweep proves the floor achievable and pins the FOV; band `[34,44]`, never below 34; fallback (tighten sway → far-field fill).
- **R2** → §2.2: capture pre-gift balance; topbar renders pre-gift; the count-up===wallet-value invariant is on ONE shared clock with a **≤ 16.6ms (1-frame) tolerance** on the tick-vs-land timing, drop-frame-safe (both read the same clock value on the dropped frame); SUM invariant for the two-reward case (round-3 fix #4).
- **R3** → §1.3: `.show` reveals scene layers only; chrome (incl. the early hint + the god-ray) starts opacity 0 independent of the container fade.
- **R4 / audit-blocker 1** → the VERIFICATION CLASSES block + every §Verify: composition FEEL is owner-live-preview (class C); the sky-fraction probe + calibration + `Box3` projection + count-up frame timing + synthetic pointer checks are **class B (manual dev-tool, deterministic + numeric, NOT PR-blocking)** — promoted to class A only if §0.5.e proves headless scene construction; only static lint / grep / no-WebGL computed-style + DOM-count probes are class A. **No live-canvas check is called a PR-blocking machine gate.**
- **R5** → §1.4: vary seeded ember durations across 7–16s to break phase-lock while staying reproducible.
- **Drag-vs-tap collision + manual clamp + reduced-motion drag** → §3.3: `pointerdown` in the subject region → drag(>10px)→rotate within a hard ±45° yaw clamp + suppress-fly (eases to idle-sway over ~600ms; ≤ 100ms snap under reduced-motion) or tap(≤10px,<500ms)→fly; chrome pointerdowns never rotate; idle-sway-only is the committed fallback if drag is cut.
- **Liveliness floor** → §3.3: sway amplitude ≥ ±6° (floor) and ≤ ±15° (ceiling) — clamping for the fill floor cannot collapse the hub into a dead frame; the far-field fill fires instead.
- **Two-reward consolidated card** → §2.5: one card, two labelled `--fs-display` GOLD `tabular-nums` rows staggered 80–120ms via the recap cascade; count-up===wallet-value on the SUM within one frame of the last row's finish; one shared sigil bloom; obeys the §2.3 silhouette-clearance invariant.
- **Copy (committed, both flagged phrases retired)** → §2.5: gift headline `'Tailwind banked'` / sub `'Day {N} aloft'` (no "Tailwind while you were away", no "The sky kept your seat", no inline `+◆100`, no exclamation); the no-gift line `'Welcome back, pilot.'` / `'Day {N} aloft'` is the committed premium final.
- **Round-3 fix #5 (shared 8-yaw pass)** → §3.2/§3.3: bbox-height ∈ [60%,72%] AND 0px clipped asserted at the SAME 8 sampled yaws + sway extremes as the skyFraction ≤ 0.55 probe — one shared pass; "never cropped" is class-B numeric at every sampled yaw.
- **Audit-blocker 3 (cyan hub embers)** → §4.2: explicit recolor of `ui.js:1908` embers to GOLD-only warm; `grep '#7fe6ff'` on the hub → 0.
- **Audit-blocker 4 (tracking gate not armable)** → §4.3: px→em conversions ship; the tracking-gate claim is either a NEW hub-selector-scoped lint OR downgraded to "verified by inspection" — NOT "the machine gate is now TRUE."
- **Audit-blocker 5 (non-blocking cleanups)** → retired the false "setStartNotice serves the challenge line" rationale (§2 increment note); flagged the `.action-key` ~22% tracking reduction for human sign-off (§4.3); aliased the duration tokens onto `--t-*` instead of a forked `--dur-*` family (§0).
- **In-game CLUTTER scope (grounded, not re-scoped)** → §5.5: taken at its word as the in-RUN experience and decluttered, now grounded in verified `file:line` (HUD render path `ui.js:489-520`,`:900-1122`,`:1956`,`:1073-1081`; CSS `#hud style.css:161`,`.hud-top-right :216`,`.embers-hud :494`,`.graze-hud :271`,`stamina-arc :587-588`,`.challenge :1343`,`.hud-immersive :840-849`,`hudState` `ui.js:2221-2228`). Gate-Log decision (owner-confirmable): in-run HUD brought IN scope; owner confirms on a live run.

## VERIFICATION LADDER (three-judge split, FABLE GATE ≥ 4.2 — honestly classed A/B/C)
1. **MACHINE — class A (CI, PR-blocking) numbers:** `node tests/uitokens.mjs` · greps `«` `»` `font-style: italic` `#7fe6ff` `54,22,92` `purple` red/magenta badge `backdrop-filter`-over-canvas `box-shadow`-on-ember → **all 0** · `camera.fov` literal ∈ `[34,44]` in the showcase source · exit-dur < enter-dur on every transition (computed-style) · rail ≤ 5 items + cold DOM 0 topbar/rail/start-notice nodes · hub ≤ 4 of 6 sizes · in-run `.challenge` no `font-size:16px`/`letter-spacing:2px`, tabular-nums on every numeric, MAGENTA=danger only · state-mutation lint (0 run/obstacle/player mutation across any menu open) · the new hub-scoped tracking lint (if built, audit-blocker 4).
2. **MACHINE — class B (manual dev-tool, deterministic + numeric, NOT PR-blocking; promote to A only if §0.5.e proves headless):** headless frame-time (0 frames >16.6ms on splash inclusive of the §1.2a ignite + hub) · the §1.2a ignite fires exactly once with each layer amplitude in its floor–ceiling band (wing ×1.4–1.8, rim +8–12%, push 4–6%) and returns to rest; the optional god-ray peak opacity ∈ [0.32,0.50], blur ≤ 28px, static by t≈2.0s · splash tap affordance present at t≈0.7s, absent at t<0.6s · count-up value === wallet value (exact) + topbar tick within ≤ 16.6ms of card land off the shared clock (SUM for the consolidated card) · the GOLD reward sigil blooms exactly once (opacity 0→1, scale ≤ +8%) on the spring-settle frame · consolidated card = exactly 2 staggered rows + one shared sigil bloom · reward card ≤ 420px, top edge below the projected `Box3.setFromObject(equippedDragonGroup)` silhouette's rendered bottom (≥ 2% clearance) · the §3.3 calibration surface (skyFraction over `[34,44] × 8 yaws × sway extremes`) + pinned FOV where the probe passes at ALL yaws · skyFraction ≤ 0.55 at 8 yaws + sway extremes · bbox-height ∈ [60%,72%] AND 0px clipped at the SAME 8 yaws + sway extremes (fix #5) · `Box3` recomputes on synthetic resize (not per frame) · auto-yaw ∈ ±6°–±15° · manual drag clamp ≤ ±45° · drag threshold 10px (6px→fly, 20px→rotate+suppress-fly) · reduced-motion drag release ≤ 100ms · 0 in-run HUD elements outside safe-area (portrait+landscape) · GOLD ≤ 10% (hub + in-run).
3. **FABLE CRITIC (craft, NOT the builder):** harsh ≥ 4.2 against the kill-list — crop, void-spin, chrome-on-dragon, card covering a low tail/wing, flat reward strip, no count-up, no reveal beat / no reward flourish, **a splash whose ignite reads timid or as a mere re-skin** (the amplitude floors catch this), symmetric motion, elastic overshoot, guilleted chip, gilded rail, 7th size, 42px onion-glow, ember box-shadow, cyan on the calm hub, in-run HUD clutter / cyan-that-isn't-vitals / a gilded or lingering `.challenge` banner / safe-area intrusion, a silent first-timer with no early affordance, an undisambiguated or unclamped hub pointer, a reused owner-flagged phrase.
4. **OWNER (feel, LIVE PORTRAIT PREVIEW — class C):** §3 composition (crop / the *look* of the fill above the probe floor / chrome-clear / final FOV within `[34,44]` / cruise feel / drag-peek feel), the reward-card land + sigil bloom, the splash wow + **the §1.2a ignite reads as a dragonfire EVENT** (the escalation ladder fires here if not) + early-affordance discoverability, the in-run HUD calm at speed (§5.5) + confirmation that in-run scope is correct, the `.action-key` tracking sign-off, overall calm. **§3 and §6 composition FEEL cannot be signed on the machine — the screenshot gates blank the canvas (R4); and no live-canvas number is a PR-blocking CI gate (audit-blocker 1) — the sky-fraction FLOOR is a class-B dev-tool check, not the owner's eye and not CI.**

---

# Independent Audit (v5) — build-time corrections to apply

I have the ground truth I need. Every load-bearing `file:line` in the plan checks out against the real source. Here is my adversarial audit.

---

# INDEPENDENT FABLE AUDIT — Dragon Drift Premium Welcome + Hub (Plan v5)

Ground-truth verification done against `splash.js`, `cameraController.js`, `main.js`, `rimLight.js`, `dragon.js`, `wingFlapSolver.js`, `ui.js`, `css/style.css`, `tests/run-all.mjs`, `tests/uitokens.mjs`, `tools/uishots.mjs`, `tools/silhouetteCore.mjs`. **The plan's code citations are accurate** (trivial ±1 line drift only: `setDragonLook` is `dragon.js:202` not `:201`; the purple radial is `style.css:2674` not `:2672`). All the substantive claims — splash fov 66 locked (`:175`), hub orbit 10.5r fov 58 (`:194-196,:203`), `showcaseAngle += dt*0.3` turntable (`:191`), `updateRim` uniform write (`rimLight.js:60`, called `dragon.js:1767`), private `flapPhase` clock with only the `WING_DEBUG` freeze override (`:133/:1116/:1119`), `punchKick` living only in the post-splash-`return` chase branch (`:291`), purple `54,22,92` (`:2661`), 42px onion-glow keyframe (`:2708`), ember `box-shadow 0 0 8px` (`:2682`), guilleted chip (`ui.js:1958`), cyan `#7fe6ff` hub embers (`ui.js:1908`), `.challenge` `font-size:16px`/`letter-spacing:2px` (`:1343`), `TRACK_ALLOWLIST=[cssFile,'js/']` dormant (`uitokens.mjs:60`), and `run-all.mjs` skipping `browser.mjs` (`:9`) — are all real.

## 1. COMPLAINT-COVERAGE TABLE

| Owner complaint | Status | Where / note |
|---|---|---|
| Dragon CROPPED | **Covered** | §3.2 bbox-fit on `Box3.setFromObject(equippedDragonGroup)`, 60–72% frame height, 0px clipped asserted at 8 yaws + sway extremes (fix #5). Correctly identified as a camera-rig fix, not CSS. **Feasibility caveat — see Blocker 1.** |
| Rotating around EMPTY background | **Covered** | §3.3 removes the 360° turntable (`:191`), clamps sway ±6°–±15°, adds the `skyFraction ≤ 0.55` fill floor + pre-build FOV calibration sweep. **Fill-fallback method is menu-law-unsafe — Blocker 2.** |
| Cheap "Tailwind while you were away" | **Covered** | §2.5 retires *both* flagged phrases; `main.js:879` → `showRewardCard({label:'Tailwind banked', sub:'Day {N} aloft'})`; no-gift line committed. |
| Cheap «Slipstream» chip | **Covered** | §4.1 drops guillemets (`ui.js:1958`), removes `font-style:italic`, restyles to quiet hairline chip, GOLD reduced to a dot/hairline marker. |
| In-game CLUTTER | **Covered** | §5.1–5.4 hub two-spine + progressive disclosure; §5.5 brings the in-RUN HUD in scope, grounded in verified render-path/CSS `file:line`. Well-scoped. |
| First-load WOW | **Covered** | §1.2a committed 3-layer ignite (wing ×1.4–1.8 / rim +8–12% / push 4–6%) with amplitude floors + escalation ladder + named god-ray fallback. **API scoping caveats — Blockers 3, 4.** |
| Returning-player flow | **Covered** | §2 reward-card choreography + §2.2 pre-gift baseline; §2.5 committed `Welcome back, pilot.` no-gift final; routes to hub not splash (`main.js:931-937`, verified). |

No complaint is Missing. Two are Covered-with-a-feasibility-hole (crop, empty-rotation) that the blockers below pin down.

## 2. EMBERLINE FIDELITY — strong

Warming the pre-EMBERLINE purple splash wash (`:2661/:2674`) to warm ink is correct and in-scope, not a re-litigation. CYAN eviction from the calm hub (§4.2, `ui.js:1908` — verified illegal vitals-accent leak) is a genuine color-law fix. Six sizes / three radii + pill / four withheld accents held throughout; the §2 reward sigil is correctly framed as a single component-scoped GOLD withheld-glow (no fifth accent), and in-run CYAN (`.graze-hud :271`, stamina-arc `:587-588`) is correctly kept as the legal vitals role while barred from the hub. Tracking px→em conversions honored. **One honest concession the plan makes and I confirm:** the `trackingViolations` gate genuinely *cannot* be armed for `style.css` (it's allowlisted, `uitokens.mjs:60`) — audit-blocker 4's correction ("do NOT claim the machine gate is TRUE") is accurate and the two offered remedies (hub-scoped lint OR class-C inspection) are both legitimate. No EMBERLINE violation found in the plan itself.

## 3. MENU-LAW + 60FPS + NO-IMAGE-ASSET

- **60fps:** Sound. Ember `box-shadow` eviction, no `backdrop-filter` over canvas, the ignite as uniform-writes + envelope math (0 draw calls, 0 geometry, tricount untouched) are all real per the verified `updateRim`/`solveWing` mechanics. Frame-budget assertions are honestly class-B.
- **No-image-asset:** Compliant — everything procedural (CSS gradients, `.splash-godray` pseudo-element, no textures).
- **Menu-law:** Mostly compliant (ignite touches only subject + camera; camera push returns to locked pose). **One real violation:** the §3.3 fill-fallback "add a procedural far-field cloud-bank / second ring-course arc behind the dragon" introduces menu-only world geometry that does not exist in the run — that is the "mutated or reinvented world" the MENU LAW forbids, gating on `state!=='playing'` notwithstanding. See Blocker 2.

## 4. FEASIBILITY OF THE NEW IGNITE APIs — mostly honest, two soft spots

- **`igniteRim()` (§0.5.b):** Honestly "already supported." `updateRim(color,strength,boost)` (`rimLight.js:60`) is a per-frame uniform write called at `dragon.js:1767`; a one-shot strength envelope is trivially feasible. ✔
- **`igniteWingbeat()` (§0.5.a):** Correctly scoped as net-new (no one-shot driver exists — only the `WING_DEBUG` freeze-overwrite at `:1119`). Grounded in the real `solveWing`/`phaseCenter` API. **But** it drives the *live-flight* pose solve (`:1116-1120+`), and the plan omits the hard state-gate — see Blocker 4.
- **splash camera-push (§0.5.c):** **Over-sold as "reuse `punchKick()`."** `punchKickT` is consumed *only* in the chase branch (`:291-296`), which the splash branch never reaches — it `camera.position.set(...)`s from a sine breath and `return`s at `:179`. This is net-new consumption folded into the splash `position.set`, not a `punchKick()` call. See Blocker 3.
- **`headTurnToCamera()` (§0.5.d):** Honestly net-new (head is velocity-auto-driven `:1067-1068/:1323`; `setDragonLook` `:202` is whole-body yaw), correctly parked on the ladder only. ✔
- **live subject-mask (§0.5.e):** The plan **correctly kills** the `renderMode='mask'` fantasy (audit-blocker 2 — `silhouetteCore.mjs` is confirmed CPU-only, ignores the live hub camera) and swaps to `Box3` projection + a 336-ray grid reading the live scene graph. **This is the honest move, but it rests on an unproven premise — Blocker 1.**
- **Verification-class A/B/C split:** **Correctly classified and honest.** I verified `run-all.mjs:9` skips `browser.mjs`, and `uishots.mjs:87` literally sets `canvas{visibility:hidden!important}` in its freeze CSS — so the screenshot gates *do* blank the canvas exactly as R4 claims, and composition genuinely cannot be a machine gate. No live-canvas check is mislabeled as PR-blocking. This is the strongest part of the plan.

## 5. PROTECTED-CREDIT SAFETY — clean

Slogan untouched (time-only staging, `splash.js:52` verified unchanged in intent). Pause card, FromSoft cards, styled range inputs, two-step confirm — not touched. Recap-ledger cascade is *reused* (§2.5/§2.7), not modified. Safe-area rigor is *extended* to the in-run HUD (§5.5), not broken. Reduced-motion coverage extended (§2.6/§3.3/§6). Shop static framing (`cameraController.js:197-221`) kept byte-stable; badge logic kept, only *color* changed (badge is not a protected credit). No protected-credit regression.

---

# VERDICT: **FIX-FIRST**

This is an unusually rigorous, ground-truthed plan — the verification-class honesty and the de-scoping of the mask render are exactly right. It is not ship-ready because the two deepest owner complaints (crop, empty-rotation) hang on an unproven headless probe and a menu-law-illegal fallback, and two ignite APIs are under-gated. All four are surgical fixes, not a redesign.

### BLOCKERS

**1. §3's entire numeric floor rests on unproven headless scene construction.** The skyFraction probe, bbox-height gate, calibration sweep, and §2.3 card-clearance all need `Box3.setFromObject(equippedDragonGroup)` + raycasts against a *booted* scene graph. But the only headless harness (`tests/browser.mjs`, used by `uishots.mjs`) hides the canvas because WebGL doesn't render there — and the plan never confirms the dragon *meshes even exist* in that stack. If §0.5.e fails, every "never cropped is machine-catchable at each yaw" promise collapses to owner-eye-only with no stated fallback.
   **Fix:** Make §0.5.e a *gating* spike with a defined failure branch: before committing any §3 numeric gate, boot `browser.mjs` and attempt one `Box3.setFromObject` + one raycast on the equipped dragon. If geometry is absent, either stand up a Node headless-GL probe harness, or explicitly downgrade §3 crop/fill to owner-preview (class C) and delete the class-B numeric claims — do not ship a gate that cannot run.

**2. The §3.3 fill-fallback violates the MENU LAW.** "Add a procedural far-field cloud-bank / second ring-course arc behind the dragon" introduces world geometry that isn't in the actual run — a menu-only mutated world, which the law forbids ("theme via COLOUR only, never world displacement," "touch only the SUBJECT").
   **Fix:** Forbid net-new 3D fill geometry. If fov+sway can't hold the fill floor, remedy via camera framing only (tighter sway, slight downward look-tilt to seat more real ring-course/water/horizon in frame) or a CSS depth-vignette *over* the canvas. Any far-field element must belong to the shipped run world, never the menu.

**3. The splash camera-push is mis-scoped as a `punchKick()` reuse.** `punchKickT` is consumed only in the chase branch after the splash `return` (`cameraController.js:179/:291`); calling `punchKick()` under splash no-ops. The push must be a decaying term folded into the splash branch's own per-frame `camera.position.set(...)` (`:166-170`), since that branch returns before any post-solve offset.
   **Fix:** Re-scope §0.5.c as "add a decaying `-push*env` term into the splash-branch `position.set` expression, returning to the locked breath pose," not "reuse `punchKick()`." Saves a wasted build round.

**4. `igniteWingbeat` can bleed a downstroke into the first ~700ms of real flight.** The envelope drives the *live-flight* pose solve (`dragon.js:1116-1120+`) and decays over 700ms. TAKE OFF is a second tap that can land mid-ignite (the ignite fires ~1.35s; nothing forces it to finish before `startGame`). G4 only snaps the *reveal beats* on an early tap of the splash — it does not force-zero the wing envelope at run start.
   **Fix:** Hard-gate the envelope amplitude to 0 whenever `game.state==='playing'`, and force-zero it on `startGame`/TAKE OFF — mirroring the `.visible`-only state-gate discipline the menu law already demands — so a decaying downstroke can never perturb the first frames of a run.

### Non-blocking note
§2.2's pre-gift baseline is sound in principle but doesn't name its edit site: the hub topbar reads `saveData.embers` directly at `ui.js:1915` (post-gift after `main.js:878`), so the "topbar renders preGift" contract needs an explicit render-time override or shadow value at `:1915`. Name it before building §2 to avoid an invisible new→new count-up.