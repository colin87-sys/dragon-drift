# 2026-07-18 — The Surge-reflect melt: a volume-swat that scales with enemy density

**Did / learned.** Chasing an owner-observed exploit ("reflecting big attacks back in Surge melts
bosses"), an independent Fable audit traced it to a structural fact: a Surge barrel-roll parry is a
**volume swat**, not a single-bullet deflect — every boss bullet within 3 m flips back at once
(`reforged/js/bossBullets.js:895-943`; the 3 m gate at :901; in Surge the reflectable flag is
ignored, `boss.js:2361/2965`). So reflected damage is proportional to pattern **density**: a sparse
aimed shot pays ~14, but a 22-bullet tunnel ring or 16-bullet iris pays **32–57 per roll**
(`bulletDamage 13` × 0.35/0.55/×1.3, `config.js:527,550-553`) — **>half a ~100-HP phase segment per
perfect roll**. The boss's HARDEST attacks are the player's biggest gun (an *inverted* difficulty
curve). It's bounded only by the per-phase shield (`boss.js:5555-5575`), and Surge recharges nearly
for free because the shielded phase throws bait-rings of 15 bullets at r 3.6 < grazeR 4.15 that
graze WHOLESALE by design (`boss.js:4762-4775`) — so a skilled player kills a mid-tier boss ~3–4×
the tuned pace. Tell of intent: the codebase excludes Surge reflects from every *skill* meter (ribs,
stagger, resolve, rhythm — `boss.js:3010/3031/3050/3066`) **except damage itself** — the burn window
was intended, its magnitude was never priced.

**→ Systematize.** Three reusable rules. (1) **When a defensive verb is an area/volume query, its
offensive payout must be sub-linear in the count** — else denser content becomes *easier* content.
Cap the DAMAGE, never the SPECTACLE: scale each hit by `1/√total` or clamp the roll (~2.5× base);
all bullets still fly back, less lands; put the uncapped juice in score/FX. (2) **Price every burn
window:** if you deliberately exclude a free-for-all from your skill economies, exclude it from
*damage* too, or you've priced it everywhere except where it matters. (3) **Watch the subsidy loop:**
a momentum currency that PAYS for the exploit verb (parry→meter) and then SPENDS on the exploit's
bottleneck (meter→faster recharge) is a *subsidy* — govern the feed OR the manifestation, never
neither. The convergence math (a capped meter) hides it: convergent ≠ safe when it pays the
degenerate line twice. New-boss audit question, now standing: *"what does my densest attack reflect
for, against one segment of my bar?"*

**→ Leapfrog.** Gives a drop-in "cap the damage, keep the spectacle" pattern reusable for any future
AoE parry/reflect/counter, and a governor pattern (`!surge`-gate + per-encounter cap) the DRIFT
build now carries in `reforged/DRIFT-BUILD-PLAN.md` §4a. The reflect-balance change itself stays
OWNER-GATED (a live shipped-game feel decision — the melt may be a wanted power fantasy); the DRIFT
side only owes the F2 governor so the new currency doesn't accelerate whatever the owner decides.
