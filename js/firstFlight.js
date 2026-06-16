// Authored first-flight ("run 1") opening — a hand-placed beat timeline that
// teaches every core mechanic in a logical order: steer → rings/perfect → speed
// orb → boost → dodge (roll) → chain → Dragon Surge → phase (a Surge wall) →
// thread a gate → gauntlet, then hands off to procedural generation. The four
// input gestures (steer/boost/roll/phase) are taught as PAUSED beats by
// gestureTutorial.js; the rest are live callouts (hints.js). main.js also pins
// CONFIG.seed for run 1 so the whole opening is identical every time.
//
// Coordinates: dist in metres; x ∈ [-10,10], y ∈ [5.5,19], lane centre ≈ y 8.

export const FIRST_FLIGHT_END = 700; // past here, generation goes procedural

// type:
//   'ring'     — a collectible ring at (x,y); orb:true drops a speed orb just before it
//   'obstacle' — one pillar at (x,y) with a reward ring just past, on the open side (ringX)
//   'gate'     — a window to thread at (x,y)
//   'gauntlet' — a short corridor of stations (reuses level.js gauntletStation)
export const FIRST_FLIGHT_BEATS = [
  // Clear sky, then three gentle near-centre rings (steer + perfect + the first
  // ember/orb callouts land here). Nothing can be hit yet (warmup = no obstacles).
  { dist: 55,  x: 0,    y: 8,   type: 'ring' },
  { dist: 95,  x: 1.8,  y: 9,   type: 'ring' },
  { dist: 135, x: -1.8, y: 8,   type: 'ring', orb: true },   // speed-orb callout
  // An open straight — room to fly flat-out — where the BOOST gesture is taught.
  { dist: 200, x: 0,    y: 8.5, type: 'ring' },
  // First obstacle: one offset pillar with the reward ring on the open side. The
  // ROLL (dodge) gesture is taught just before it; the reward ring is the 5th
  // collectible, which lights the first Dragon Surge.
  { dist: 250, x: 2.4,  y: 9,   type: 'obstacle', r: 1.8, h: 11, ringX: -1.6 },
  // A gate that arrives WHILE the Surge is lit → fires surgeWallSlowMo → the
  // PHASE gesture (flick through the wall) is taught here.
  { dist: 318, x: -1.2, y: 8.6, type: 'gate' },
  { dist: 352, x: 1.0,  y: 9,   type: 'ring' },
  { dist: 392, x: -1.0, y: 8.5, type: 'ring' },
  // A second gate after the Surge ends → the live "thread the window" callout.
  { dist: 470, x: 0.8,  y: 9,   type: 'gate' },
  { dist: 520, x: 0,    y: 9,   type: 'ring' },
  // A short two-station gauntlet → "follow the embers" callout, then procedural.
  { dist: 560, type: 'gauntlet', stations: [{ qx: 1, qyLow: true }, { qx: -1, qyLow: true }] },
];
