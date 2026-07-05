#!/usr/bin/env python3
"""Render a WAV + MIDI reference for every Dragon Radio station from tracks.json."""
import json, math, os, struct, wave

ROOT = "/home/user/dragon-drift"
SCRATCH = os.path.dirname(__file__)
OUT = os.path.join(ROOT, "station-reference")
WAVDIR = os.path.join(OUT, "wav")
MIDDIR = os.path.join(OUT, "midi")
for d in (WAVDIR, MIDDIR):
    os.makedirs(d, exist_ok=True)

with open(os.path.join(SCRATCH, "tracks.json")) as f:
    TRACKS = json.load(f)

SR = 22050

# ---------------------------------------------------------------- WAV synth ---
def osc(kind, ph):
    if kind == "sine":     return math.sin(2*math.pi*ph)
    if kind == "triangle": return 2*abs(2*(ph % 1)-1)-1
    if kind == "square":   return 1.0 if (ph % 1) < 0.5 else -1.0
    # sawtooth
    return 2*(ph % 1)-1

def render_voice(buf, events, kind, vol, eighth, stack=None):
    """events: list of [freq, dur_eighths] laid out sequentially."""
    t = 0.0
    for freq, dur in events:
        seglen = dur * eighth
        if freq and freq > 0:
            n = int(seglen * SR)
            start = int(t * SR)
            for i in range(n):
                env = 1.0
                # short attack / release to kill clicks
                a = int(0.005*SR)
                if i < a: env = i/a
                rel = int(0.02*SR)
                if i > n-rel: env = max(0.0, (n-i)/rel)
                ph = freq*i/SR
                s = osc(kind, ph)
                if stack == "octave":
                    s = 0.7*s + 0.3*osc(kind, ph*2)
                elif stack == "detune":
                    s = 0.5*s + 0.5*osc(kind, freq*1.006*i/SR)
                idx = start+i
                if idx < len(buf):
                    buf[idx] += s*vol*env
        t += seglen

def expand_arps(arps, eighth=None):
    # Match the engine (sfx.js): each 8-note cycle plays TWICE per bar at
    # 16th-note spacing (E8/2), so a bar holds 16 arp slots of half an eighth.
    ev = []
    for bar in range(8):
        cyc = arps[bar % len(arps)]
        for _cycle in range(2):
            for note in cyc:
                ev.append([note, 0.5])
    return ev

def render_track(tr):
    bpm = tr["bpm"]
    eighth = (60.0/bpm)/2.0           # seconds per eighth note
    loop = 64 * eighth                # 8 bars * 8 eighths
    total = int(loop*SR)              # exact loop length (matches documented seconds)
    buf = [0.0]*total
    v = tr["voices"]
    render_voice(buf, tr["melody"], v["melody"]["osc"], v["melody"]["vol"], eighth, v["melody"].get("stack"))
    render_voice(buf, tr["bass"],   v["bass"]["osc"],   v["bass"]["vol"],   eighth)
    render_voice(buf, tr["high"],   v["high"]["osc"],   v["high"]["vol"],   eighth)
    if tr.get("arps"):
        render_voice(buf, expand_arps(tr["arps"], eighth), v["arp"]["osc"], v["arp"]["vol"], eighth)
    # pad chords are rendered (with correct per-bar offset) by add_pad() below.
    # kick: four-on-the-floor for groove
    kick = tr["drums"].get("kick", 0)
    if kick:
        for beat in range(32):  # 8 bars * 4 beats
            start = int(beat*2*eighth*SR)
            klen = int(0.12*SR)
            for i in range(klen):
                env = math.exp(-18*i/klen)
                f = 110*math.exp(-9*i/klen)+45
                if start+i < len(buf):
                    buf[start+i] += 0.5*kick*math.sin(2*math.pi*f*i/SR)*env
    # normalize
    peak = max(1e-6, max(abs(x) for x in buf))
    g = 0.89/peak if peak > 0.89 else 1.0
    return buf, g

def write_wav(path, buf, g):
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        frames = bytearray()
        for x in buf:
            v = int(max(-1.0, min(1.0, x*g))*32767)
            frames += struct.pack("<h", v)
        w.writeframes(bytes(frames))

# Note: pad chords handled with proper bar offset
def add_pad(buf, tr, eighth):
    if not (tr.get("pad") and tr.get("chords")): return
    v = tr["voices"]
    for bar, chord in enumerate(tr["chords"][:8]):
        t = bar*8*eighth
        for f in chord:
            seglen = 8*eighth
            start = int(t*SR); n = int(seglen*SR)
            for i in range(0, n, 1):
                env = min(1.0, i/(0.05*SR))*max(0.0,(n-i)/(0.05*SR) if i> n-0.05*SR else 1.0)
                idx = start+i
                if idx < len(buf):
                    buf[idx] += 0.045*osc("triangle", f*i/SR)*env

# --------------------------------------------------------------- MIDI writer ---
def freq_to_midi(f):
    return int(round(69 + 12*math.log2(f/440.0)))

def vlq(n):
    out = bytearray([n & 0x7f]); n >>= 7
    while n:
        out.insert(0, (n & 0x7f) | 0x80); n >>= 7
    return bytes(out)

def midi_track(events, program, channel):
    """events: list of (start_tick, dur_tick, midinote, velocity)."""
    data = bytearray()
    data += b'\x00' + bytes([0xC0|channel, program])
    seq = []
    for st, du, note, vel in events:
        seq.append((st, 1, note, vel))      # note on
        seq.append((st+du, 0, note, 0))     # note off
    seq.sort(key=lambda x: (x[0], x[1]))
    last = 0
    for tick, on, note, vel in seq:
        delta = tick-last; last = tick
        if on:
            data += vlq(delta) + bytes([0x90|channel, note, vel])
        else:
            data += vlq(delta) + bytes([0x80|channel, note, 0])
    data += b'\x00\xff\x2f\x00'
    return b'MTrk' + struct.pack('>I', len(data)) + bytes(data)

def seq_events(rows, eighth_ticks):
    # dur may be fractional (0.5-eighth arp slots) — keep ticks integral.
    ev = []; t = 0
    for freq, dur in rows:
        d = int(round(dur*eighth_ticks))
        if freq and freq > 0:
            ev.append((t, d, freq_to_midi(freq), 96))
        t += d
    return ev

def write_midi(path, tr):
    TPQ = 480
    et = TPQ//2  # eighth = 240 ticks
    bpm = tr["bpm"]
    mpqn = int(60_000_000/bpm)
    # header track with tempo
    h = bytearray(b'\x00\xff\x51\x03' + struct.pack('>I', mpqn)[1:])
    h += b'\x00\xff\x2f\x00'
    htrk = b'MTrk' + struct.pack('>I', len(h)) + bytes(h)

    tracks = [htrk]
    tracks.append(midi_track(seq_events(tr["melody"], et), 81, 0))   # square lead
    tracks.append(midi_track(seq_events(tr["bass"], et), 38, 1))     # synth bass
    tracks.append(midi_track(seq_events(tr["high"], et), 89, 2))     # warm pad
    if tr.get("arps"):
        arpev = seq_events(expand_arps(tr["arps"], None), et)
        tracks.append(midi_track(arpev, 38, 3))
    if tr.get("pad") and tr.get("chords"):
        ce = []
        for bar, chord in enumerate(tr["chords"][:8]):
            for f in chord:
                ce.append((bar*8*et, 8*et, freq_to_midi(f), 64))
        tracks.append(midi_track(ce, 89, 4))
    nt = len(tracks)
    hdr = b'MThd' + struct.pack('>IHHH', 6, 1, nt, TPQ)
    with open(path, 'wb') as f:
        f.write(hdr)
        for t in tracks:
            f.write(t)

# --------------------------------------------------------------------- main ---
for tr in TRACKS:
    bpm = tr["bpm"]; eighth = (60.0/bpm)/2.0
    buf, g = render_track(tr)
    add_pad(buf, tr, eighth)
    peak = max(1e-6, max(abs(x) for x in buf))
    g = 0.89/peak if peak > 0.89 else 1.0
    write_wav(os.path.join(WAVDIR, tr["id"]+".wav"), buf, g)
    write_midi(os.path.join(MIDDIR, tr["id"]+".mid"), tr)
    print("rendered", tr["index"], tr["id"])
print("done")
