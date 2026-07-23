# In-run declutter: the clutter was FREQUENCY + VARIETY, not the lane

**Owner report:** "all the different pop ups as you're playing feel cluttered/unaesthetic."

**The trap:** the plan (§5.5) called for "unify the popups into one toast lane" — but that was ALREADY
done. Prior EMBERSIGHT work built **THE BELL** (`ui.js` ~1123): one anchored, queued slot (depth 3),
coalescing, role accents, min-display. Feats/milestones/records/pickups all already ring through it. So a
naive "build the single lane" would have been re-building something that shipped. **Always render the
current state and read the code before applying a plan section — the target may already be solved.**

**The real cause:** even with ONE lane, nearly every gameplay action rang it with a DISTINCT coalescing
key — `earn:ring`, `earn:phase`, `earn:near`, `earn:roll`, `earn:parry`, `earn:gate` — plus a SEPARATE
center `.popup` for perfect rings. So during a scoring streak the single slot **cycled** through a rapid
sequence of different-named lines ("+50" → "THREADED +30" → "PHASE +40" → "NEAR MISS +20"…), and a second
element floated at top-40%. That *cycle of different pop-ups* is what read as clutter, not the lane.

**The fix (small, high-impact):** give every routine scoring earn the **same coalescing key `'earn'`**, and
route perfect rings through the bell too (retire the separate `.popup` element + `_centerPop` + its CSS).
Now all earns **coalesce into ONE running line** — verified headless: 5 rapid different earns →
`THREADED +30 ×5` (latest move + running count), one slug, not five. The score counter carries the true
total; the lane shows the streak. Moments that deserve their own beat (record, feat, surge, biome name,
milestone, rival) keep distinct keys and still ring individually.

**Reusable law:** a single well-built toast lane still reads as clutter if it fires on *every* micro-event
with *distinct* keys — coalescing only helps within a key. For "calm at speed," collapse the high-frequency
routine feedback under ONE key (let the persistent counter carry the number) and reserve distinct toasts for
the rarer *moments*. Density and key-variety are the levers, not the lane count.
