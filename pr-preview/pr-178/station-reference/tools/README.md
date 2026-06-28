# Regenerating the station reference pack

These scripts rebuild `STATIONS.md` plus the per-station WAV/MIDI exports
directly from `reforged/js/tracks.js` (the single source of truth).

```sh
# 1. dump resolved track data to JSON
node station-reference/tools/dump.mjs > /tmp/tracks.json
# 2. point gen.py / gendoc.py at that JSON (they read ./tracks.json next to them)
cp /tmp/tracks.json station-reference/tools/tracks.json
python3 station-reference/tools/gen.py      # writes wav/ + midi/
python3 station-reference/tools/gendoc.py   # writes STATIONS.md
```

The WAVs are pure-stdlib procedural renders (same note data the game engine
plays); the MIDIs export melody / bass / high / arp / pad on separate tracks so
a producer can re-voice each station with real instruments.
