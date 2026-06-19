# Dragon Drift — Session Handoff (2026‑06‑14)

Handoff for the next chat. Everything below is **merged to `master`** unless noted.
Work happens on branch **`claude/quirky-goldberg-8n8pik`**, draft PRs into `master`
(the user merges fast). **Never** put a model identifier in commits/PRs/code.

---

## 1. Project

- **Dragon Drift** — Three.js, browser/mobile, third‑person **endless flyer**. Camera is
  **behind + slightly above** the creature (rear / top‑rear). Judge every model/visual
  decision from that gameplay camera, never a side/front beauty view.
- Plain ES modules in `js/`, Three.js in `lib/`, CSS in `css/style.css`. **No build step.**
- **No PR‑gating CI** (only a GitHub‑Pages deploy that runs on `master`, not on PRs).
- **Can't audition audio or judge motion‑feel in this environment** — music/SFX/flap changes
  are theory‑sound + structurally verified; tell the user to confirm by ear/eye.

### Render‑QA tools (Playwright; write to `/tmp/*.png`)
- `tools/tiershots.mjs` → `/tmp/tier-<key>.png` (4‑form montage, rear cam, framed to apex span).
- `tools/gameshots.mjs <key>` → in‑game chase‑cam crops/montage.
- `tools/surgeshot.mjs <key> <tier>` → forced Surge.
- `tools/shopshot.mjs [dev]` → shop dragons + riders tabs (`dev` = `?debug&dev`, unlock all).
- `tools/ridershot.mjs` → riders from the rear gameplay angle.
- `tests/browser.mjs` `boot({query,initScript,viewport,deviceScaleFactor})` → headless boot,
  returns `{page, errors, done}`. `?debug` exposes test hooks; `?debug=fever` forces Surge;
  `?debug&dev` unlocks everything (non‑destructive — `freezeSaves()`).
- `node tests/tracks.mjs` → structural music test (bars=8 eighths, freqs ≤ E6, arps 4×8).

---

## 2. Architecture map

| File | Role |
|---|---|
| `js/dragons.js` | `DRAGONS` table (7: azure, ember, jade, obsidian, pearl, solar, phoenix). Per dragon: `rarity` (card frame), **`maxRarity`** (apex cap: SSR/SSSR), `cost`, `stats`, `model`, `wingForms[0..3]`, `forms[0..3]` (per‑form `colors` + flags). Phoenix has `archetype:'phoenix'`. Solar/Phoenix carry `feverWing/feverEye/feverWash`; solar+phoenix have `surgeMotes`/gold motes. |
| `js/dragonModel.js` | `buildDragonModel(def, opts)` → **dispatches to `buildPhoenixModel` when `def.archetype==='phoenix'`**. Returns `{group, parts, materials, auraSprite}`. `makePreviewTick` = shared flap/coil tick for previews. |
| `js/phoenixModel.js` | Separate **firebird** archetype (feather wings = inner web + outer scalloped web, flame‑plume tail, beak+crest head, heart‑core). Same rig handles as dragons. |
| `js/dragonParts.js` | `buildArrowTorso`, wing shapes, **`buildCleanTail`** (styles: `simple/finned/blade/comet/twinfin/firefan/shard`). `shard` = Obsidian crystal shards. |
| `js/dragon.js` | The rig: `createDragon`, `updateDragon`. Wing flap (per‑dragon `flapBias/flapAmp`), tail coil, **Surge transform** (per‑def `feverWing/feverEye`), trails, **ember/arcane motes** (`def.archetype==='phoenix'` warm idle motes; `def.surgeMotes` cool arcane motes during Surge). `setFeverTint(def.feverWash)`. |
| `js/riders.js` + `js/riderParts.js` | 4 riders, distinct silhouettes via shared `buildRiderFigure` (build/headgear/shoulders/back/trail). |
| `js/ascension.js` | `ASCENSION_TIERS` (3: Kindled/Radiant/Eternal → forms 1‑3; form 0 = Hatchling). **`maxTierFor(key)`** = 2 for SSR starters, 3 for SSSR. `ascensionTier` clamps to it. `ascendedDef(def,tier,radiance)` merges forms cumulatively + ramps (`SIZE_RAMP`, `WING_RAMP`, `STAT_RAMP`); stamps `model.formLevel`. |
| `js/ui.js` | Shop / settings / pause / pilot routing. `formRarity(tier,maxR)` via `RARITY_LADDERS` (SSR:`R/SR/SSR`, SSSR:`R/SR/SSR/SSSR`). **`openInspect(key)`** = the showcase modal. Delegated UI click‑sound. `pilotBadgeDue` includes `unclaimedFeatCount`. `ICONS` (incl. `inspect` 🔍). |
| `js/pilotScreen.js` | Pilot FEATS/LOG/TITLES. Feats render **claim buttons** (`featClaimable`); `wirePilot({onClaim})`. |
| `js/feats.js` | `FEAT_DEFS`. `unlockFeat` (no longer auto‑pays) → **`claimFeat`/`featClaimable`/`unclaimedFeatCount`** (pay once, `claimed` set is the guard). |
| `js/save.js` | Versioned save (**v3**). `feats:{unlocked,claimed}`. **v2→v3 migration marks all existing unlocked feats `claimed`** (no retroactive double‑pay). `freezeSaves` for dev mode. |
| `js/sfx.js` | Audio engine. Master: gain→compressor→**tanh soft‑limiter**→dest; music bus has a **de‑mud glue EQ**; **stereo ping‑pong echo**. `drumEnergy` (BPM‑gated kick punch + bass sub). `music.setTrack` **starts playback when not active** (menu preview). `sfx.select()/deny()`. |
| `js/tracks.js` | **30 stations** (note‑data, synthesized live). |
| `js/preview.js` | Card turntables + **`setShowcaseDef`/`closeShowcase`** (dedicated 480px high‑res `DragonShowcase` renderer for the inspect modal). |
| others | `recap.js` (run recap), `weekly.js`, `missions.js`, `milestones.js`, `titles.js`, `environment.js`, `postfx.js` (`liftTint` per‑dragon fever wash). |

---

## 3. Roster identities (rear cam, all merged)

- **Azure / Ember / Jade** — *starters*. `maxRarity:'SSR'`, **3‑form ladder** Hatchling(R)→Kindled(SR)→Radiant(SSR), **no Eternal**. Radiant apex deliberately restrained (no glow‑seams/veins, simple `finned`/`blade` tail, low `spineGlow`, small crest) so it reads clearly **below** premium SSR.
- **Obsidian** (SSR) — dark night/void, plasma **cyan**, narrow swept falcon wings, **crystal‑`shard` tail**.
- **Pearl** (SSR) — luminous white, broad elegant wings, **soft aura** (halo ring removed).
- **Solar Sovereign** (SSSR) — dark royal **eclipse**: midnight body, dark‑crimson wings, antique gold crown/spine, blue‑violet/cyan energy. **Cool‑arcane Surge** (lavender/indigo, `surgeMotes`).
- **Phoenix Ascendant** (SSSR) — celestial **firebird** archetype: white‑gold feathered wings, flame‑plume tail, white‑hot core. **White‑gold "Rebirth" Surge** + warm ember motes.
- Premium 4 keep their premium signal layers (crystal tails / halos / auras / high glow / aura prestige); starters do not.

---

## 4. Done this session (the premium‑polish epic — all merged)

- **§1/§2** starter SSR caps + toned‑down apexes + accurate shop badges/pips (3 vs 4).
- **§3** full‑screen **inspect/showcase modal** (🔍 on each card → high‑res render, blurred/vignetted backdrop, soft lighting, gentle orbit, rarity/name/lore/stats, form cycling capped per dragon, close via ✕/backdrop/**Esc capture**).
- **§4** Obsidian shard tail · **§5** Pearl halo→aura · **§6** premium separation · **§7** flap feel tuned toward the Phoenix benchmark (`flapBias/flapAmp`; Phoenix unchanged).
- **§8** consistent UI selection SFX (`sfx.select/deny` via one delegated capture listener).
- **§9** Dragon Radio **plays the selected station in menus** (was a no‑op when music inactive).
- **§10** Settings **+ Pilot reachable from the pause menu**.
- **§11** weekly‑trial **completion status on the start screen** (`X/Y ✓` + per‑trial COMPLETE badge).
- **§13** feat rewards are **click‑to‑claim in Pilot** (migration‑safe, no double‑pay) + **§16** claim feedback (chime + floating `+◆` count‑up).
- **§14 (currency)** the **◆ diamond made premium** via CSS faceted gradient + drop‑shadow (an SVG‑gem attempt was rejected — keep the ◆). Aura prestige button relabeled **"✦ Brighter Aura · ◆ N embers"**.
- *(Earlier in the broader session, also merged: riders rework, Phoenix firebird redesign, Sovereign cool‑arcane Surge, audio remaster + 5 new stations + 6 redone melodies + punchier kit.)*

---

## 5. Remaining (smaller follow‑ups — NOT done)

- **§12 Daily Challenge** — the "Fly Daily" button currently just does a normal takeoff. Either implement a **real daily modifier/briefing/objective** (there's a `dailySeed()` + `recordDailyRun()` streak system in `save.js` to build on) **or** relabel the UI so it's honest. Acceptance: feels like a real feature with a clear modifier + reward + completion state.
- **§15 declutter / hierarchy** — progressive‑disclosure pass on the start‑screen quest/trial stack, Pilot, shop cards, settings (essentials first, details on tap). Diffuse — scope carefully.
- **§14 broader icon set** — make the weekly/daily/feat/shop/settings icons feel as premium/consistent as the new currency ◆ (the currency itself is done).
- **§16 reward fly‑ups beyond feats** — weekly/daily/mission rewards pay in the run **recap** (which has its own count‑up); extend a satisfying fly‑up/sparkle to those claim moments if desired.

---

## 6. Gotchas / conventions

- **Rarity** = card frame (`d.rarity`); **`maxRarity`** = apex cap → drives `maxTierFor`, `formRarity` ladders, tier‑pip count, "EVOLVED ✦ MAX", aura‑prestige gating (SSSR only). Touch all of these together.
- **Phoenix uses the dragon rig** (shared `updateDragon`); per‑dragon Surge color via `feverWing/feverEye/feverWash` (defaults = dragon magenta). Don't hardcode pink.
- **Inspect modal** lives in `ui.js` `openInspect` + `preview.js` `DragonShowcase` (its own 480px renderer; card previews are 150px and would look soft). Gem top‑left, ✕ top‑right (don't overlap). Esc handler is **capture‑phase + stopPropagation** so it doesn't also exit the shop.
- **Feats**: never re‑introduce auto‑pay in `unlockFeat`; pay only via `claimFeat`. The `claimed` set is the single guard.
- **Music `setTrack`** auto‑starts playback when `!musicActive` (menu preview) — taking off no‑ops the second start. Don't revert.
- **Currency** = `EMBER_ICON='◆'` in `util.js`, premium via `.ember-ico` CSS. User explicitly wants the **◆ glyph**, not an SVG gem.
- Tier‑shot framing renders all 4 tiers even for starters (the tool doesn't know `maxTier`); the **game** caps correctly. That's fine for the dev tool.
- After pushing, **create a draft PR** if none is open. Check `get_check_runs` on each PR (there's no real CI, so it's always empty/clean).

---

## 7. Open question for the user

Music "catchiness" and flap "feel" can't be judged here — ask the user to **listen / watch in‑game** and flag specifics (which station/dragon wants tuning). Same for any subjective mix/motion call.
