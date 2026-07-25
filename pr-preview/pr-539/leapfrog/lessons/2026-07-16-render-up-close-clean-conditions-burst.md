# Assess your work UP CLOSE with clean capture conditions — a distant vanity frame is not a gate

**What happened.** Biome chats kept (a) claiming they "can't render headlessly" (false — the
harness exists), (b) judging a biome from a ~1000m frame where the sun + water carry it and the
actual props are invisible specks, and (c) shooting single frames that caught game-over screens,
fades, or an obstacle across the view. All three make the Fable gate meaningless.

**The facts (verified).**
- Headless rendering absolutely works: `tests/browser.mjs` (Playwright + preinstalled Chromium);
  every `tools/*shot.mjs` / `tools/*studio.*` proves it.
- Per-biome STUDIOS render one prop/mass in ISOLATION (no obstacles, no death, chosen sky/angle) —
  `tools/calstudio.*`, `tools/lagoonstudio.*`, etc. This is the correct tool for the close-up form read.
- The `__dd` capture seams (`js/main.js:362`) give clean in-context conditions: `game.health = 99`
  (never die on an obstacle), `noBoss()` (no boss interrupt), `player.dist = d` (teleport — in SMALL
  ~30–40m steps; a big jump builds too much geometry at once and crashes WebGL), `game.timeScale = 0`
  (freeze a clean frame), and `?biome=N` to pin the biome so you don't fly there.

**The discipline (now in `BIOME-OVERHAUL-PLAYBOOK.md`, "CAPTURE & ASSESS DISCIPLINE").**
1. You CAN render headlessly — never claim otherwise; copy an existing shot tool.
2. Assess UP CLOSE, on the props filling the frame at player-view range — the studio for the form
   read, in-context (framed on the props) for composition. Distant + pretty is not an assessment.
3. Set clean conditions: pin biome, pin health, noBoss, small-step teleport, freeze-then-shoot.
4. BURST across specified points (approach → close → pass), pick the good frames — one frame can
   catch a game-over/fade/obstacle; a burst can't. Reference: `tools/archshot.mjs`.

**Reusable rule.** If the close prop work isn't visible in the frame you hand Fable, the capture is
invalid — the gate is only as good as what's in the shot. Render the WORK, up close, on clean
conditions, in a burst — not a single distant vista.
