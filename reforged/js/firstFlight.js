// Authored first-flight ("run 1") opening — a hand-placed beat timeline that
// teaches by doing: steer → boost → chain → first Dragon Surge → dodge → thread
// a gate → run a short gauntlet, then hands off to procedural generation so the
// flight continues forever. level.js (createLevelGen with { scripted:true })
// walks these beats in its ensure() loop, reusing the same spawn shapes it emits
// procedurally; main.js also pins CONFIG.seed for run 1 so the whole opening
// (biome, gauntlet jitter) is identical every time.
//
// Coordinates: dist in metres; x ∈ [-10,10], y ∈ [5.5,19], lane centre ≈ y 8.

export const FIRST_FLIGHT_END = 700; // past here, generation goes procedural

// type:
//   'ring'     — a collectible ring at (x,y); orb:true drops a speed orb just before it
//   'obstacle' — one pillar at (x,y) with a reward ring just past, on the open side (ringX)
//   'gate'     — a window to thread at (x,y)
//   'gauntlet' — a short corridor of stations (reuses level.js gauntletStation)
export const FIRST_FLIGHT_BEATS = [
  // 1) Clear sky, then three gentle near-centre rings. The steer hint (t>1.2s)
  //    lands on this easy target; nothing can be hit yet (warmup = no obstacles).
  { dist: 55,  x: 0,    y: 8,   type: 'ring' },
  { dist: 95,  x: 1.8,  y: 9,   type: 'ring' },
  { dist: 135, x: -1.8, y: 8,   type: 'ring', orb: true },
  // 2) An open straight (room to fly flat-out) — the boost hint (t>8s) lands here.
  { dist: 205, x: 0,    y: 8.5, type: 'ring', orb: true },
  // 3) A guaranteed easy chain. With the rings above, consecutiveRings clears the
  //    new-pilot Surge threshold (5) around here → the first Dragon Surge fires.
  { dist: 235, x: 1.2,  y: 9,   type: 'ring' },
  { dist: 263, x: -1.2, y: 8,   type: 'ring' },
  { dist: 291, x: 1.0,  y: 9.5, type: 'ring' },
  { dist: 319, x: -1.0, y: 8.5, type: 'ring' },
  { dist: 347, x: 0,    y: 9,   type: 'ring' },
  // 4) First real obstacle: one offset pillar with the reward ring on the open
  //    side. The roll-dodge hint (hints.js, fires past 360m) primes it.
  { dist: 395, x: 2.6,  y: 9,   type: 'obstacle', r: 1.8, h: 11, ringX: -1.6 },
  // 5) First gate / window to thread → the perfect/thread hint.
  { dist: 470, x: -1.2, y: 8.5, type: 'gate' },
  { dist: 510, x: 0,    y: 9,   type: 'ring' },
  // 6) A short two-station gauntlet → "follow the embers" hint, then procedural.
  { dist: 560, type: 'gauntlet', stations: [{ qx: 1, qyLow: true }, { qx: -1, qyLow: true }] },
];
