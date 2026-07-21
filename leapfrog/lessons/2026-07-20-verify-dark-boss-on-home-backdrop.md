# Verify dark bosses on the HOME backdrop, and lift shadows with EMISSIVE not diffuse (2026-07-20)

**What happened.** After the Unmasked hub fix shipped and passed my dark-studio captures, the
owner playtested on the live purple biome and immediately saw what I'd missed: the wing INTERIOR
(the covert/arm mass of each wing) still rendered as **pure-black bumpy voids** between the bright
outer blades. Two compounding mistakes, both instructive:

**Process mistake — I verified void-black on a black backdrop.** `bossstudio` shipped only
dark / pale / sunset / white backdrops; I judged on `dark` (0x14121a). A near-black wing interior
on a near-black sky is INVISIBLE — the exact defect the owner sees on the mid-value purple biome
literally could not appear in my captures. §3b.7 already says "judge a dark boss on its HOME value
first"; I didn't have a home-value backdrop, so I added one (`biome: 0x322a5c`, the astral purple)
to `bossstudio.html` + `.mjs`. On THAT backdrop the black covert holes are obvious. **Law: a dark
boss's studio verdict must be taken on a backdrop at (or near) its home-biome value — the black
studio bg is a false pass for void-black interiors.**

**Technical mistake — a diffuse tint can't lift a shadow.** The art director's "warm root-lift"
and the per-feather value-band both multiply the DIFFUSE vertex colour. But during the dark boss
fight the covert faces angle away from the sun and receive almost no light, so
`diffuse × light ≈ 0` no matter the ×1.4 multiplier — the roots stayed black. Only **EMISSIVE**
adds light independent of the scene (L105: dark PBR bodies die in bloom/ACES without an emissive
floor). Fix: a warm-slate emissive floor (`emissive 0x2b2531 @ 0.85`) on the covert ladder +
a smaller floor on the rim mats. Measured on the biome backdrop: covert luma 5→**35** — dark
feathered mass with relief, still near-black, still under the eye and the G2 dark-body cap, but
no longer a void hole. **Law: to lift a region that reads too dark, reach for emissive first;
a vertexColor/diffuse lift does nothing where no light lands.**

**What it unlocks.** The `biome` studio backdrop is now available for every dark boss's home-value
gate. The emissive-floor cure applies to any near-black body region that crushes under the dimmed
boss-fight lighting (Marrowcoil's void gaps, Ashtalon's charcoal wings, Onewing's ashen body).
