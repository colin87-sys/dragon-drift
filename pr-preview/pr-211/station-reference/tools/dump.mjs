// Resolve tracks.js relative to this script so it works in any checkout.
import { TRACKS } from '../../reforged/js/tracks.js';
const out = TRACKS.map((t,i) => ({
  index:i, id:t.id, name:t.name, desc:t.desc, cost:t.cost, bpm:t.bpm,
  swing:t.swing||0, voices:t.voices, drums:t.drums, pad:!!t.pad,
  melody:t.melody, bass:t.bass, high:t.high, arps:t.arps, chords:t.chords,
}));
process.stdout.write(JSON.stringify(out));
