# Hub law: the SUBJECT owns the center — chrome crowns and seats, never covers

**What happened.** On the live pr-447 preview (real phone), the owner caught what every
headless capture missed: the wordmark, the «title» chip and the TAKE OFF button sat
exactly on the menu dragon — *"that's what the player is gonna be grinding to see."*
The --static captures blank the canvas, so the collision between CHROME and SUBJECT was
invisible in every screenshot gate; only the live scene showed it.

**The fix (CSS-only, both orientations).** The hero stack now stretches between topbar
and rail (`.hero-screen::before/::after { content:none }`, `.hero-core { flex:1 }`):
title block at the top, `margin-top:auto` on the CTA sinks it + the hints to the bottom,
and the middle of the frame is an empty stage. Short landscape also drops the redundant
controls line so the CTA sits low.

**The law (add to every menu/hero screen from now on):** *the 3D subject owns the center
of the frame; DOM chrome may crown the top and seat the bottom, never cover the middle.*
This is the same "center is sacred" law EMBERSIGHT applies to the flight HUD — it applies
to MENUS too, because the menu is the real world reframed and the world has a subject.

**The verification gotcha worth remembering:** `--static` blanks the live canvases for
determinism, which also blinds the harness to chrome-vs-scene composition. Screenshot
gates verify LAYOUT; only the human preview verifies COMPOSITION. When a change moves
chrome, always ask "what is behind this in the live scene?" before calling it done.
