# Dragon Radio — Station Reference Pack

Production briefs for every station in `reforged/js/tracks.js`. Each station is **8 bars in 4/4** (the engine stores each bar as exactly 8 eighth-notes) and loops seamlessly. Every station ships a procedural sketch as both a rendered **WAV** (the actual game sound) and a **MIDI** export (melody / bass / high / arp / pad on separate tracks) so a producer can re-voice it with real instruments.

All layers are **reactive** at runtime: the arp enters on boost, the high counter-line fades in at combo ≥ 1.5×, percussion stacks in at combo ≥ 2–3×, and a fever lead plays during a Dragon Surge.

> Generated artifacts live in `station-reference/wav/<id>.wav` and `station-reference/midi/<id>.mid`.

---

## 0. Skyborne  ·  `skyborne`

- **Station name:** Skyborne
- **Description:** Soaring chiptune-pop anthem  (Free)
- **MIDI:** [`station-reference/midi/skyborne.mid`](./midi/skyborne.mid)
- **WAV reference:** [`station-reference/wav/skyborne.wav`](./wav/skyborne.wav)
- **Desired real-instrument style:** Chiptune-pop crossover: bright NES-style square lead doubled by a real pop synth, picked electric bass, four-on-the-floor acoustic+electronic kit, glittering bell counter-melody.
- **BPM:** 160
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **12.0 s** per loop
- **Layer notes:**
  - **Melody:** square (single) — the lead hook.
  - **Bass:** triangle — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 1, snare 1, hat 1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 1. Ancient Tides  ·  `tides`

- **Station name:** Ancient Tides
- **Description:** Modal bells over deep pads  (Free)
- **MIDI:** [`station-reference/midi/tides.mid`](./midi/tides.mid)
- **WAV reference:** [`station-reference/wav/tides.wav`](./wav/tides.wav)
- **Desired real-instrument style:** Cinematic modal: tuned tubular/crotale bells and celesta over sustained string pads and low cello drones, soft timpani and frame drum, choir 'ooh' on the highs.
- **BPM:** 105
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **18.3 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 0.8, snare 0.6, hat 0.5; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 2. Ember Rush  ·  `rush`

- **Station name:** Ember Rush
- **Description:** Pumping synthwave neon  (Free)
- **MIDI:** [`station-reference/midi/rush.mid`](./midi/rush.mid)
- **WAV reference:** [`station-reference/wav/rush.wav`](./wav/rush.wav)
- **Desired real-instrument style:** '80s synthwave: detuned analog supersaw lead (Juno/Jupiter), gated FM bass, LinnDrum-style gated-reverb snare, neon arpeggiator.
- **BPM:** 128
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.0 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.1, snare 1, hat 0.8 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 3. Moonlit Drift  ·  `drift`

- **Station name:** Moonlit Drift
- **Description:** Mellow lo-fi glide  (Free)
- **MIDI:** [`station-reference/midi/drift.mid`](./midi/drift.mid)
- **WAV reference:** [`station-reference/wav/drift.wav`](./wav/drift.wav)
- **Desired real-instrument style:** Lo-fi hip-hop: dusty Rhodes/electric piano with jazz 7ths, upright bass, brushed/soft swung drums, vinyl crackle, muted trumpet for the highs.
- **BPM:** 85
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **22.6 s** per loop; swing 0.18
- **Layer notes:**
  - **Melody:** triangle (single) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 0.6, snare 0.45, hat 0.4; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** triangle — only during Dragon Surge.
  - **Swing:** 0.18 (off-beats delayed for groove).

## 4. Neon Apex  ·  `neon`

- **Station name:** Neon Apex
- **Description:** Festival anthem — fat detuned hook  (800 embers)
- **MIDI:** [`station-reference/midi/neon.mid`](./midi/neon.mid)
- **WAV reference:** [`station-reference/wav/neon.wav`](./wav/neon.wav)
- **Desired real-instrument style:** Big-room festival EDM: fat detuned saw 'hands-up' lead, sidechained reese/saw bass, huge layered kick+clap, white-noise riser FX.
- **BPM:** 138
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **13.9 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.15, snare 1.05, hat 0.9 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 5. Stormchaser  ·  `storm`

- **Station name:** Stormchaser
- **Description:** Breakneck D&B chase  (800 embers)
- **MIDI:** [`station-reference/midi/storm.mid`](./midi/storm.mid)
- **WAV reference:** [`station-reference/wav/storm.wav`](./wav/storm.wav)
- **Desired real-instrument style:** Drum & bass: amen/neuro break at 172, reese sub-bass, stab synths, fast hat rolls; mix bone-dry and punchy.
- **BPM:** 172
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **11.2 s** per loop
- **Layer notes:**
  - **Melody:** square (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 1.2, snare 1.15, hat 1.1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 6. Solar Cathedral  ·  `solarc`

- **Station name:** Solar Cathedral
- **Description:** Euphoric golden hardstyle hymn  (800 embers)
- **MIDI:** [`station-reference/midi/solarc.mid`](./midi/solarc.mid)
- **WAV reference:** [`station-reference/wav/solarc.wav`](./wav/solarc.wav)
- **Desired real-instrument style:** Euphoric hardstyle: pitched distorted kick, screechy reverse-bass saw lead, church-organ/choir pad, gated euphoric synth stabs.
- **BPM:** 130
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **14.8 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.2, snare 0.95, hat 0.85 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 7. Neon Seoul  ·  `seoul`

- **Station name:** Neon Seoul
- **Description:** Idol dance-pop — chant verse, big chorus  (800 embers)
- **MIDI:** [`station-reference/midi/seoul.mid`](./midi/seoul.mid)
- **WAV reference:** [`station-reference/wav/seoul.wav`](./wav/seoul.wav)
- **Desired real-instrument style:** K-pop idol dance: bright square+octave vocal-chop lead, slap/disco electric bass, tight four-on-floor kit, finger-snaps and group-chant 'hey'.
- **BPM:** 125
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.4 s** per loop
- **Layer notes:**
  - **Melody:** square (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** square, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.1, snare 1.05, hat 0.95 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 8. Velvet Crown  ·  `crown`

- **Station name:** Velvet Crown
- **Description:** Girl-crush EDM-trap — sub-808 menace  (800 embers)
- **MIDI:** [`station-reference/midi/crown.mid`](./midi/crown.mid)
- **WAV reference:** [`station-reference/wav/crown.wav`](./wav/crown.wav)
- **Desired real-instrument style:** EDM-trap: gritty detuned saw hook, sub-808 with glide, trap hats (triplet rolls) and snappy claps, dark minor-key brass stabs.
- **BPM:** 142
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **13.5 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.25, snare 1.15, hat 1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 9. Stratosphere  ·  `stratos`

- **Station name:** Stratosphere
- **Description:** Uplifting trance — endless climb  (800 embers)
- **MIDI:** [`station-reference/midi/stratos.mid`](./midi/stratos.mid)
- **WAV reference:** [`station-reference/wav/stratos.wav`](./wav/stratos.wav)
- **Desired real-instrument style:** Uplifting trance: supersaw 'epic' lead with long sidechained pads, rolling off-beat bass, plucked arp, cymbal swells/risers.
- **BPM:** 138
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **13.9 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.1, snare 0.95, hat 1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 10. Titan Drop  ·  `titan`

- **Station name:** Titan Drop
- **Description:** Big-room festival — stadium hook  (800 embers)
- **MIDI:** [`station-reference/midi/titan.mid`](./midi/titan.mid)
- **WAV reference:** [`station-reference/wav/titan.wav`](./wav/titan.wav)
- **Desired real-instrument style:** Big-room/Mainstage: three-note stadium saw hook, massive pumping kick, festival snare, gated pluck stabs, crowd-noise wash.
- **BPM:** 128
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.0 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.3, snare 1.1, hat 0.85 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 11. Hardlight  ·  `hardlight`

- **Station name:** Hardlight
- **Description:** Hardstyle — off-beat gallop, euphoric hook  (800 embers)
- **MIDI:** [`station-reference/midi/hardlight.mid`](./midi/hardlight.mid)
- **WAV reference:** [`station-reference/wav/hardlight.wav`](./wav/hardlight.wav)
- **Desired real-instrument style:** Hardstyle: off-beat gallop reverse-bass, distorted kick, square euphoric lead, screech FX; dry and gritty.
- **BPM:** 150
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **12.8 s** per loop
- **Layer notes:**
  - **Melody:** square (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 1.35, snare 1, hat 1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 12. Midnight Chrome  ·  `chrome`

- **Station name:** Midnight Chrome
- **Description:** Synthwave night-drive — retro arp  (800 embers)
- **MIDI:** [`station-reference/midi/chrome.mid`](./midi/chrome.mid)
- **WAV reference:** [`station-reference/wav/chrome.wav`](./wav/chrome.wav)
- **Desired real-instrument style:** Synthwave night-drive: analog saw lead, gated arpeggiated bass (Juno arp), DX7 bell highs, electronic gated-snare kit.
- **BPM:** 122
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.7 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.05, snare 1, hat 0.9 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 13. Aurora Bloom  ·  `bloom`

- **Station name:** Aurora Bloom
- **Description:** Future bass — lift-and-sigh, rising-sixth hook  (800 embers)
- **MIDI:** [`station-reference/midi/bloom.mid`](./midi/bloom.mid)
- **WAV reference:** [`station-reference/wav/bloom.wav`](./wav/bloom.wav)
- **Desired real-instrument style:** Future bass: warm detuned 'supersaw chord' stabs with pitch-bend, vocal-chop highs, halftime trap kit, soft sub, sidechain breathing.
- **BPM:** 100
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **19.2 s** per loop; swing 0.14
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 0.7, snare 0.6, hat 0.55; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.
  - **Swing:** 0.14 (off-beats delayed for groove).

## 14. Slipstream  ·  `slips`

- **Station name:** Slipstream
- **Description:** Liquid D&B — rolling, airborne  (800 embers)
- **MIDI:** [`station-reference/midi/slips.mid`](./midi/slips.mid)
- **WAV reference:** [`station-reference/wav/slips.wav`](./wav/slips.wav)
- **Desired real-instrument style:** Liquid D&B: Rhodes/jazz chords, smooth rolling sub, crisp airy break, live-feel hats; lush and rolling.
- **BPM:** 174
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **11.0 s** per loop; swing 0.08
- **Layer notes:**
  - **Melody:** triangle (single) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 1.15, snare 1.2, hat 1.15 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.
  - **Swing:** 0.08 (off-beats delayed for groove).

## 15. Gold Rush Groove  ·  `goldrush`

- **Station name:** Gold Rush Groove
- **Description:** French house — filtered disco funk  (800 embers)
- **MIDI:** [`station-reference/midi/goldrush.mid`](./midi/goldrush.mid)
- **WAV reference:** [`station-reference/wav/goldrush.wav`](./wav/goldrush.wav)
- **Desired real-instrument style:** French/disco house: filtered chopped disco-string/guitar loop, funky slap bass, four-on-floor with open hats, phaser sweeps.
- **BPM:** 124
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.5 s** per loop; swing 0.12
- **Layer notes:**
  - **Melody:** square (single) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.1, snare 0.95, hat 1.05 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.
  - **Swing:** 0.12 (off-beats delayed for groove).

## 16. Crystal Lagoon  ·  `lagoon`

- **Station name:** Crystal Lagoon
- **Description:** Tropical house — steel-pan bounce  (800 embers)
- **MIDI:** [`station-reference/midi/lagoon.mid`](./midi/lagoon.mid)
- **WAV reference:** [`station-reference/wav/lagoon.wav`](./wav/lagoon.wav)
- **Desired real-instrument style:** Tropical house: steel-pan/marimba pluck lead, soft plucked sub-bass, light kit with shaker, flute and soft pad.
- **BPM:** 104
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **18.5 s** per loop; swing 0.12
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 0.9, snare 0.7, hat 0.8; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** triangle — only during Dragon Surge.
  - **Swing:** 0.12 (off-beats delayed for groove).

## 17. Drift King  ·  `driftking`

- **Station name:** Drift King
- **Description:** Touge racing — detuned saw hook  (800 embers)
- **MIDI:** [`station-reference/midi/driftking.mid`](./midi/driftking.mid)
- **WAV reference:** [`station-reference/wav/driftking.wav`](./wav/driftking.wav)
- **Desired real-instrument style:** Eurobeat/touge: aggressive detuned saw hook, driving octave synth-bass, energetic four-on-floor with crash accents, brass-saw stabs.
- **BPM:** 140
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **13.7 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.2, snare 1.05, hat 1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 18. Banner  ·  `banner`

- **Station name:** Banner
- **Description:** Epic march — 3+3+2 hemiola, G-mixolydian horn call  (800 embers)
- **MIDI:** [`station-reference/midi/banner.mid`](./midi/banner.mid)
- **WAV reference:** [`station-reference/wav/banner.wav`](./wav/banner.wav)
- **Desired real-instrument style:** Orchestral epic march: French-horn/trumpet fanfare call, low brass + timpani ostinato, snare march rolls, string pads, choir.
- **BPM:** 112
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **17.1 s** per loop
- **Layer notes:**
  - **Melody:** square (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.3, snare 1.15, hat 0.9 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 19. The Pipers  ·  `pipers`

- **Station name:** The Pipers
- **Description:** Celtic reel — drone bass, A-dorian jig-lilt  (800 embers)
- **MIDI:** [`station-reference/midi/pipers.mid`](./midi/pipers.mid)
- **WAV reference:** [`station-reference/wav/pipers.wav`](./wav/pipers.wav)
- **Desired real-instrument style:** Celtic reel: tin whistle/fiddle melody, uilleann-pipe drone, bodhran frame-drum, bouzouki/guitar backing.
- **BPM:** 128
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.0 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 0.6, snare 0.5, hat 1.2; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 20. Vermilion  ·  `vermilion`

- **Station name:** Vermilion
- **Description:** Chinese EDM — red-lantern pentatonic drive  (800 embers)
- **MIDI:** [`station-reference/midi/vermilion.mid`](./midi/vermilion.mid)
- **WAV reference:** [`station-reference/wav/vermilion.wav`](./wav/vermilion.wav)
- **Desired real-instrument style:** Chinese EDM: erhu/dizi-flavored pentatonic lead, guzheng/pipa plucks, big-room kit, gong and lantern-festival percussion.
- **BPM:** 130
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **14.8 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.2, snare 1, hat 0.95 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 21. Mirrorball  ·  `mirrorball`

- **Station name:** Mirrorball
- **Description:** Disco-pop revival — glitter and joy  (800 embers)
- **MIDI:** [`station-reference/midi/mirrorball.mid`](./midi/mirrorball.mid)
- **WAV reference:** [`station-reference/wav/mirrorball.wav`](./wav/mirrorball.wav)
- **Desired real-instrument style:** Disco-pop (ABBA): bright piano+string-machine hook, octave disco bass, four-on-floor with open hats and tambourine, glittery vocal stacks.
- **BPM:** 115
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **16.7 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 0.95, snare 0.9, hat 1; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** triangle — only during Dragon Surge.

## 22. Afro Fire  ·  `afrofire`

- **Station name:** Afro Fire
- **Description:** Afrobeats — syncopated bounce, call-response  (800 embers)
- **MIDI:** [`station-reference/midi/afrofire.mid`](./midi/afrofire.mid)
- **WAV reference:** [`station-reference/wav/afrofire.wav`](./wav/afrofire.wav)
- **Desired real-instrument style:** Afrobeats: marimba/log-melody, deep round bass, conga/shaker/talking-drum groove, call-and-response vocal highs.
- **BPM:** 104
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **18.5 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 1, snare 0.9, hat 1.1, shaker 0.8, conga 0.7; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** triangle — only during Dragon Surge.

## 23. Mpiano High  ·  `mpiano`

- **Station name:** Mpiano High
- **Description:** Amapiano — jazzy 7ths, log-drum groove  (800 embers)
- **MIDI:** [`station-reference/midi/mpiano.mid`](./midi/mpiano.mid)
- **WAV reference:** [`station-reference/wav/mpiano.wav`](./wav/mpiano.wav)
- **Desired real-instrument style:** Amapiano: jazzy Rhodes 7ths, deep resonant log-drum bass, shaker-driven swung hats, soft pads; spacious groove.
- **BPM:** 112
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **17.1 s** per loop; swing 0.16
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.1, snare 0.8, hat 1.3, logDrum 0.9, shaker 0.6; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.
  - **Swing:** 0.16 (off-beats delayed for groove).

## 24. Popstar  ·  `popstar`

- **Station name:** Popstar
- **Description:** Pop-dance — bright hook, four-on-floor  (800 embers)
- **MIDI:** [`station-reference/midi/popstar.mid`](./midi/popstar.mid)
- **WAV reference:** [`station-reference/wav/popstar.wav`](./wav/popstar.wav)
- **Desired real-instrument style:** Radio pop-dance: bright square/pluck topline, electric pop bass, four-on-floor with claps, airy synth pad, vocal-chop hook.
- **BPM:** 120
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **16.0 s** per loop
- **Layer notes:**
  - **Melody:** square (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** square, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1, snare 1, hat 0.9 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 25. Skyward  ·  `skyward`

- **Station name:** Skyward
- **Description:** Soaring dragon-flight theme — Lydian lift  (800 embers)
- **MIDI:** [`station-reference/midi/skyward.mid`](./midi/skyward.mid)
- **WAV reference:** [`station-reference/wav/skyward.wav`](./wav/skyward.wav)
- **Desired real-instrument style:** Soaring film score (HTTYD-style): octave-leap horn/strings flight theme, driving low strings + taiko/kit, choir, harp/glock highs.
- **BPM:** 132
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **14.5 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** triangle — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1, snare 0.9, hat 0.85 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 26. Eclipse Requiem  ·  `requiem`

- **Station name:** Eclipse Requiem
- **Description:** Apocalyptic battle-choir — Andalusian epic  (800 embers)
- **MIDI:** [`station-reference/midi/requiem.mid`](./midi/requiem.mid)
- **WAV reference:** [`station-reference/wav/requiem.wav`](./wav/requiem.wav)
- **Desired real-instrument style:** Apocalyptic battle-choir: full Latin choir + low brass, harmonic-minor string runs, taiko/orchestral percussion + heavy kit, distorted ostinato.
- **BPM:** 144
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **13.3 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.4, snare 1.25, hat 1, punch 1.2 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 27. Hypernova  ·  `hypernova`

- **Station name:** Hypernova
- **Description:** Uplifting trance — euphoric supersaw  (800 embers)
- **MIDI:** [`station-reference/midi/hypernova.mid`](./midi/hypernova.mid)
- **WAV reference:** [`station-reference/wav/hypernova.wav`](./wav/hypernova.wav)
- **Desired real-instrument style:** Euphoric trance: long supersaw anthem lead, rolling off-beat bass, big sidechained pads, plucks and white-noise risers.
- **BPM:** 138
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **13.9 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.15, snare 0.9, hat 1.15 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 28. Overdrive  ·  `overdrive`

- **Station name:** Overdrive
- **Description:** Anthem rock — power-chord drive  (800 embers)
- **MIDI:** [`station-reference/midi/overdrive.mid`](./midi/overdrive.mid)
- **WAV reference:** [`station-reference/wav/overdrive.wav`](./wav/overdrive.wav)
- **Desired real-instrument style:** Anthem rock: distorted power-chord electric guitars, driving bass + live rock kit, organ pad, soaring lead-guitar hook.
- **BPM:** 150
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **12.8 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** square counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** none (rhythm-driven).
  - **Drums:** kick 1.2, snare 1.15, hat 1, punch 1.1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 29. Starlight Idol  ·  `idol`

- **Station name:** Starlight Idol
- **Description:** K-pop — royal-road emotional hook  (800 embers)
- **MIDI:** [`station-reference/midi/idol.mid`](./midi/idol.mid)
- **WAV reference:** [`station-reference/wav/idol.wav`](./wav/idol.wav)
- **Desired real-instrument style:** K-pop royal-road ballad-pop: emotional piano + string pad, electric bass, crisp pop kit, layered vocal harmonies, bell highs.
- **BPM:** 122
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.7 s** per loop
- **Layer notes:**
  - **Melody:** square (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** square, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1, snare 1, hat 0.95 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 30. Find the Flame  ·  `findflame`

- **Station name:** Find the Flame
- **Description:** Eikonic battle anthem · con fuoco  (1800 embers)
- **MIDI:** [`station-reference/midi/findflame.mid`](./midi/findflame.mid)
- **WAV reference:** [`station-reference/wav/findflame.wav`](./wav/findflame.wav)
- **Desired real-instrument style:** Eikonic battle anthem (FF-style) con fuoco: full orchestra + rock band hybrid — distorted guitar, choir, brass, taiko, blazing string ostinato.
- **BPM:** 168
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **11.4 s** per loop
- **Layer notes:**
  - **Melody:** square (single) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1, snare 1, hat 1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** square — only during Dragon Surge.

## 31. Skybound  ·  `skybound`

- **Station name:** Skybound
- **Description:** Soaring title theme  (Free)
- **MIDI:** [`station-reference/midi/skybound.mid`](./midi/skybound.mid)
- **WAV reference:** [`station-reference/wav/skybound.wav`](./wav/skybound.wav)
- **Desired real-instrument style:** Soaring title theme: bright synth/brass anthem lead over strings, driving kit, choir and glock — heroic and open.
- **BPM:** 128
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **15.0 s** per loop
- **Layer notes:**
  - **Melody:** triangle (single) — the lead hook.
  - **Bass:** triangle — driving low end.
  - **High:** triangle counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1, snare 1, hat 1; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** triangle — only during Dragon Surge.

## 32. First Flight  ·  `firstflight`

- **Station name:** First Flight
- **Description:** Cinematic flight anthem — soaring film-score  (Free)
- **MIDI:** [`station-reference/midi/firstflight.mid`](./midi/firstflight.mid)
- **WAV reference:** [`station-reference/wav/firstflight.wav`](./wav/firstflight.wav)
- **Desired real-instrument style:** Cinematic flight anthem: solo horn/strings building to full orchestra, harp arpeggios, soft timpani swells, choir pad — slow and grand.
- **BPM:** 96
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **20.0 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sine — driving low end.
  - **High:** sine counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 0.7, snare 0.55, hat 0.5; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 33. Pyre Ascendant  ·  `pyre`

- **Station name:** Pyre Ascendant
- **Description:** Tragic phoenix ascension — sacred fire  (Free)
- **MIDI:** [`station-reference/midi/pyre.mid`](./midi/pyre.mid)
- **WAV reference:** [`station-reference/wav/pyre.wav`](./wav/pyre.wav)
- **Desired real-instrument style:** Sacred-fire phoenix elegy: boy-soprano/choir over organ and strings, tolling bells, swelling brass, ceremonial percussion.
- **BPM:** 160
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **12.0 s** per loop
- **Layer notes:**
  - **Melody:** triangle (octave-stacked) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sawtooth counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** triangle, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.1, snare 0.85, hat 0.6, punch 1.1 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.

## 34. Cinder Requiem  ·  `cinder`

- **Station name:** Cinder Requiem
- **Description:** Phoenix battle-ascent — fire answering fire  (Free)
- **MIDI:** [`station-reference/midi/cinder.mid`](./midi/cinder.mid)
- **WAV reference:** [`station-reference/wav/cinder.wav`](./wav/cinder.wav)
- **Desired real-instrument style:** Phoenix battle-ascent: answering-choir call-and-response, brass + distorted guitar, harmonic-minor string fire-runs, heavy orchestral kit.
- **BPM:** 160
- **Loop length:** 8 bars (4/4) = 32 beats ≈ **12.0 s** per loop
- **Layer notes:**
  - **Melody:** sawtooth (detuned/unison) — the lead hook.
  - **Bass:** sawtooth — driving low end.
  - **High:** sawtooth counter-line (engine fades it in when combo ≥ 1.5×).
  - **Arp:** sawtooth, 4 one-bar cycles (one per chord) — kicks in on boost.
  - **Pad:** sustained chord bed (one chord per bar).
  - **Drums:** kick 1.25, snare 1, hat 0.85, punch 1.2 · heavy; percussion layers in at combo ≥ 2–3×.
  - **Lead (fever):** sawtooth — only during Dragon Surge.
