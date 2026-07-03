#!/usr/bin/env python3
import json, os, math

ROOT = "/home/user/dragon-drift"
SCRATCH = os.path.dirname(__file__)
with open(os.path.join(SCRATCH, "tracks.json")) as f:
    TRACKS = json.load(f)

# Desired real-instrument production style per station (what to hand a producer
# to re-record these procedural sketches with real/sampled instruments).
STYLE = {
 'skyborne':"Chiptune-pop crossover: bright NES-style square lead doubled by a real pop synth, picked electric bass, four-on-the-floor acoustic+electronic kit, glittering bell counter-melody.",
 'tides':"Cinematic modal: tuned tubular/crotale bells and celesta over sustained string pads and low cello drones, soft timpani and frame drum, choir 'ooh' on the highs.",
 'rush':"'80s synthwave: detuned analog supersaw lead (Juno/Jupiter), gated FM bass, LinnDrum-style gated-reverb snare, neon arpeggiator.",
 'drift':"Lo-fi hip-hop: dusty Rhodes/electric piano with jazz 7ths, upright bass, brushed/soft swung drums, vinyl crackle, muted trumpet for the highs.",
 'neon':"Big-room festival EDM: fat detuned saw 'hands-up' lead, sidechained reese/saw bass, huge layered kick+clap, white-noise riser FX.",
 'storm':"Drum & bass: amen/neuro break at 172, reese sub-bass, stab synths, fast hat rolls; mix bone-dry and punchy.",
 'solarc':"Euphoric hardstyle: pitched distorted kick, screechy reverse-bass saw lead, church-organ/choir pad, gated euphoric synth stabs.",
 'seoul':"K-pop idol dance: bright square+octave vocal-chop lead, slap/disco electric bass, tight four-on-floor kit, finger-snaps and group-chant 'hey'.",
 'crown':"EDM-trap: gritty detuned saw hook, sub-808 with glide, trap hats (triplet rolls) and snappy claps, dark minor-key brass stabs.",
 'stratos':"Uplifting trance: supersaw 'epic' lead with long sidechained pads, rolling off-beat bass, plucked arp, cymbal swells/risers.",
 'titan':"Big-room/Mainstage: three-note stadium saw hook, massive pumping kick, festival snare, gated pluck stabs, crowd-noise wash.",
 'hardlight':"Hardstyle: off-beat gallop reverse-bass, distorted kick, square euphoric lead, screech FX; dry and gritty.",
 'chrome':"Synthwave night-drive: analog saw lead, gated arpeggiated bass (Juno arp), DX7 bell highs, electronic gated-snare kit.",
 'bloom':"Future bass: warm detuned 'supersaw chord' stabs with pitch-bend, vocal-chop highs, halftime trap kit, soft sub, sidechain breathing.",
 'slips':"Liquid D&B: Rhodes/jazz chords, smooth rolling sub, crisp airy break, live-feel hats; lush and rolling.",
 'goldrush':"French/disco house: filtered chopped disco-string/guitar loop, funky slap bass, four-on-floor with open hats, phaser sweeps.",
 'lagoon':"Tropical house: steel-pan/marimba pluck lead, soft plucked sub-bass, light kit with shaker, flute and soft pad.",
 'driftking':"Eurobeat/touge: aggressive detuned saw hook, driving octave synth-bass, energetic four-on-floor with crash accents, brass-saw stabs.",
 'banner':"Orchestral epic march: French-horn/trumpet fanfare call, low brass + timpani ostinato, snare march rolls, string pads, choir.",
 'pipers':"Celtic reel: tin whistle/fiddle melody, uilleann-pipe drone, bodhran frame-drum, bouzouki/guitar backing.",
 'vermilion':"Chinese EDM: erhu/dizi-flavored pentatonic lead, guzheng/pipa plucks, big-room kit, gong and lantern-festival percussion.",
 'mirrorball':"Disco-pop (ABBA): bright piano+string-machine hook, octave disco bass, four-on-floor with open hats and tambourine, glittery vocal stacks.",
 'afrofire':"Afrobeats: marimba/log-melody, deep round bass, conga/shaker/talking-drum groove, call-and-response vocal highs.",
 'mpiano':"Amapiano: jazzy Rhodes 7ths, deep resonant log-drum bass, shaker-driven swung hats, soft pads; spacious groove.",
 'popstar':"Radio pop-dance: bright square/pluck topline, electric pop bass, four-on-floor with claps, airy synth pad, vocal-chop hook.",
 'skyward':"Soaring film score (HTTYD-style): octave-leap horn/strings flight theme, driving low strings + taiko/kit, choir, harp/glock highs.",
 'requiem':"Apocalyptic battle-choir: full Latin choir + low brass, harmonic-minor string runs, taiko/orchestral percussion + heavy kit, distorted ostinato.",
 'hypernova':"Euphoric trance: long supersaw anthem lead, rolling off-beat bass, big sidechained pads, plucks and white-noise risers.",
 'overdrive':"Anthem rock: distorted power-chord electric guitars, driving bass + live rock kit, organ pad, soaring lead-guitar hook.",
 'idol':"K-pop royal-road ballad-pop: emotional piano + string pad, electric bass, crisp pop kit, layered vocal harmonies, bell highs.",
 'findflame':"Eikonic battle anthem (FF-style) con fuoco: full orchestra + rock band hybrid — distorted guitar, choir, brass, taiko, blazing string ostinato.",
 'skybound':"Soaring title theme: bright synth/brass anthem lead over strings, driving kit, choir and glock — heroic and open.",
 'firstflight':"Cinematic flight anthem: solo horn/strings building to full orchestra, harp arpeggios, soft timpani swells, choir pad — slow and grand.",
 'pyre':"Sacred-fire phoenix elegy: boy-soprano/choir over organ and strings, tolling bells, swelling brass, ceremonial percussion.",
 'cinder':"Phoenix battle-ascent: answering-choir call-and-response, brass + distorted guitar, harmonic-minor string fire-runs, heavy orchestral kit.",
}

GENRE = {  # short genre tag derived from the mix preset family
}

def layer_notes(tr):
    v = tr["voices"]
    parts = []
    def osc(n): return v[n]["osc"]
    stk = v["melody"].get("stack")
    stkmsg = {"octave":"octave-stacked","detune":"detuned/unison"}.get(stk, "single")
    parts.append(f"**Melody:** {osc('melody')} ({stkmsg}) — the lead hook.")
    parts.append(f"**Bass:** {osc('bass')} — driving low end.")
    parts.append(f"**High:** {osc('high')} counter-line (engine fades it in when combo ≥ 1.5×).")
    if tr.get("arps"):
        parts.append(f"**Arp:** {osc('arp')}, 4 one-bar cycles (one per chord) — kicks in on boost.")
    if tr.get("pad") and tr.get("chords"):
        parts.append("**Pad:** sustained chord bed (one chord per bar).")
    else:
        parts.append("**Pad:** none (rhythm-driven).")
    d = tr["drums"]
    extra = [k for k in d if k not in ("kick","snare","hat","heavy")]
    drumdesc = f"kick {d.get('kick',0)}, snare {d.get('snare',0)}, hat {d.get('hat',0)}"
    if extra:
        drumdesc += ", " + ", ".join(f"{k} {d[k]}" for k in extra)
    parts.append(f"**Drums:** {drumdesc}{' · heavy' if d.get('heavy') else ''}; percussion layers in at combo ≥ 2–3×.")
    parts.append(f"**Lead (fever):** {osc('lead')} — only during Dragon Surge.")
    if tr.get("swing"):
        parts.append(f"**Swing:** {tr['swing']} (off-beats delayed for groove).")
    return parts

lines = []
lines.append("# Dragon Radio — Station Reference Pack\n")
lines.append("Production briefs for every station in `reforged/js/tracks.js`. Each station is "
             "**8 bars in 4/4** (the engine stores each bar as exactly 8 eighth-notes) and loops "
             "seamlessly. Every station ships a procedural sketch as both a rendered **WAV** "
             "(the actual game sound) and a **MIDI** export (melody / bass / high / arp / pad on "
             "separate tracks) so a producer can re-voice it with real instruments.\n")
lines.append("All layers are **reactive** at runtime: the arp enters on boost, the high "
             "counter-line fades in at combo ≥ 1.5×, percussion stacks in at combo ≥ 2–3×, and a "
             "fever lead plays during a Dragon Surge.\n")
lines.append("> Generated artifacts live in `station-reference/wav/<id>.wav` and "
             "`station-reference/midi/<id>.mid`.\n")
lines.append("---\n")

for tr in TRACKS:
    bpm = tr["bpm"]
    loop_s = 1920.0/bpm
    cost = tr["cost"]
    cost_s = "Free" if cost == 0 else f"{cost} embers"
    lines.append(f"## {tr['index']}. {tr['name']}  ·  `{tr['id']}`\n")
    lines.append(f"- **Station name:** {tr['name']}")
    lines.append(f"- **Description:** {tr['desc']}  ({cost_s})")
    lines.append(f"- **MIDI:** [`station-reference/midi/{tr['id']}.mid`](./midi/{tr['id']}.mid)")
    lines.append(f"- **WAV reference:** [`station-reference/wav/{tr['id']}.wav`](./wav/{tr['id']}.wav)")
    lines.append(f"- **Desired real-instrument style:** {STYLE.get(tr['id'],'—')}")
    lines.append(f"- **BPM:** {bpm}")
    lines.append(f"- **Loop length:** 8 bars (4/4) = 32 beats ≈ **{loop_s:.1f} s** per loop"
                 + (f"; swing {tr['swing']}" if tr.get('swing') else ""))
    lines.append("- **Layer notes:**")
    for p in layer_notes(tr):
        lines.append(f"  - {p}")
    lines.append("")

with open(os.path.join(ROOT, "station-reference", "STATIONS.md"), "w") as f:
    f.write("\n".join(lines))
print("wrote STATIONS.md with", len(TRACKS), "stations")
