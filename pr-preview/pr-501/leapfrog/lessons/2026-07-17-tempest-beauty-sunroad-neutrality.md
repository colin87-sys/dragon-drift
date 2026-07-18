# The awe was missing because the palette was NEUTRAL, not grey — the sun-road + teal-slate sea fix

**Context:** Owner on device, after the props glow-up: *"I just don't think the props do it for me — the placement, the lean, it's not artistically harmonious. It's grey and moody and depressing but there's nothing that gives it excitement or beauty or AWE. And that thing on the horizon looks weird."* This came AFTER the skew/mirror/dark-slate pass that Fable had scored a real jump on headless. The device told a different story.

## The three findings (all device-only truths)

**1. The problem was NEUTRALITY, not grey.** The owner's own surge screenshot proved it: identical black props and water, but under an indigo-violet boss sky the frame was ALIVE. The calm frames were dead because everything sat at one temperature — grey-green sky, grey-blue water, black rock, white slot. **No color RELATIONSHIP = no beauty**, regardless of prop craft. Every sister biome's "awe element" is really a color relationship with a light source (warm sunset ↔ cool ice; ember ↔ black basalt; aurora ↔ night). Tempest had a light EVENT (the eye-slot) but no color relationship. Turner/Tsushima storms are never neutral — they're bruised indigo cloud + teal-slate sea + one warm break of light.

**2. Headless renders ~1 stop brighter than a real phone — value floors are DEVICE-ONLY calls.** The previous pass set the rock emissive to 0x5a6a78 @0.12 and it looked like a premium ink-wash on headless captures. On the owner's device it collapsed to FLAT BLACK cardboard debris. This burned two rounds. **New rule: never tune "is it too dark / too bright" off headless frames — those are gate-on-device questions.** Walked the lift back to 0x7d8a98 @0.25 cool-pale; because ladderEmissive multiplies by the (wide) ladder vColor, the lift lands on SCOUR crests while wetcore stays near-black → real value RANGE inside each prop (Frozen's luminosity law, storm-native).

**3. "Gold on neutral grey is mud; gold on teal-slate is fire."** The single highest-awe move — the SUN-ROAD (the breach's reflection laid on the sea as a broken gold glitter path running down the lane to the player) — was already coded faintly and read as nothing on the pale-grey water. It only ignited once the sea was deepened from `deep 0x1b262c / shallow 0x54696b` (neutral grey-slate) to `deep 0x0c1a22 / shallow 0x3c5a62` (teal-slate). A warm accent needs a cool, dark, saturated ground or it turns to mud. The road reads best exactly where the biome was weakest: the open "breath" stretches that were dead-grey lateral-death traps now show a lone dragon flying a golden road toward the glowing eye.

## The sun-road recipe (water fragment shader, uBreachMix-gated → 0 = byte-identical)

- Reuse `_azB` (alignment of view-azimuth with the sun/breach azimuth). `pow(_azB, 8.0)` = a TIGHT lane cone (a path, not a broad wash — pow 6 washed the whole sea gold at grazing angles).
- `_roadFar = smoothstep(fogFar*0.04, fogFar*0.52, dist)` × `mix(0.32,1.0)` → brightest at the horizon SOURCE, fading toward camera (physically correct sun-glitter).
- Split the term: a moderate continuous GLOW (×0.42) so the teal sea reads through it, PLUS hashed sparkle GLINTS (`step(0.78, hash(...))` ×1.0) that carry the shimmer — a flat wash reads as a painted stripe; the breakup reads as sun-on-water.
- Gold `vec3(1.0, 0.816, 0.42)` matching the breach lip.
- It composits with the pre-existing far `_goldPool` (pow 11) — the pool is the bright far source, the road is the path leading from it.

This deliberately REVERSES an earlier restraint (the eye-breach foot was explicitly built as a far POOL, "NOT a glitter lane running to the camera"). The beauty pass wants the lane. Art-direction goals change; the comment now says why.

## Process / what's next
Shipped as "option 2" — the owner explicitly chose to PROVE the two highest-leverage moves (sun-road + un-darken props) + the sea-half of the regrade on device FIRST, before the full palette re-grade (bruised-indigo SKY deck, breach rebuilt as a hole in dark cloud). All render-only / one water color → determinism byte-identical, all tests green. The SKY regrade + breach rebuild + prop declutter + far-rank counterweight remain queued for the full pass if the proof lands.

**Meta-lesson for the ledger:** when the owner says "moody but no beauty," reach for the COLOR RELATIONSHIP (a warm light source against a cool saturated ground), not more geometry detail. And gate brightness/darkness on the device, never the headless capture.
