// RIBBON SPINE — the follow-the-leader body sim (RIBBON-ANIMATION-PLAN.md).
//
// The head lays down a breadcrumb trail of world positions; the body samples that trail at fixed
// ARC-LENGTH offsets behind the head. This makes the three asks ONE operation on three head
// trajectories: straight input → straight recorded path → straight body; sharp steer → a curvature
// pulse travels head→tail (whip); sustained circular input → the recorded path is a spiral → the
// body coils; release → curved samples age out tail-last → it unwinds and settles. A travelling
// "swim" layers on top as a binormal offset that fades in behind the head.
//
// Pure + deterministic (no Math.random / wall clock): same (dt, head-path) → same frames, so it's
// headless-testable. Produces WORLD-space station positions + rotation-minimising (parallel
// transport) frames; the caller converts to the render space and re-lofts the welded mesh.

const HISTORY_LEN = 512;

// Build the sim state on a ribbon record (rib = bodyWave.ribbon). Idempotent.
export function initRibbonSim(rib, opts = {}) {
  const N = rib.N;
  // per-station cumulative arc length measured from the head, taken from the REST spine so the
  // ribbon body length == the built body length (no stretch): segCum[i] = Σ rest gaps 0..i.
  const segCum = new Float32Array(N);
  const rf = rib.restFrames;
  for (let i = 1; i < N; i++) {
    const dx = rf[i].p.x - rf[i - 1].p.x, dy = rf[i].p.y - rf[i - 1].p.y, dz = rf[i].p.z - rf[i - 1].p.z;
    segCum[i] = segCum[i - 1] + Math.hypot(dx, dy, dz);
  }
  rib.sim = {
    N, segCum,
    hx: new Float32Array(HISTORY_LEN), hy: new Float32Array(HISTORY_LEN), hz: new Float32Array(HISTORY_LEN),
    hs: new Float32Array(HISTORY_LEN),                 // cumulative arc length at each stored sample
    head: 0, count: 0, started: false,
    // resolved world station centres + frames this tick
    sx: new Float32Array(N), sy: new Float32Array(N), sz: new Float32Array(N),
    tx: new Float32Array(N), ty: new Float32Array(N), tz: new Float32Array(N),   // tangent
    nx: new Float32Array(N), ny: new Float32Array(N), nz: new Float32Array(N),   // normal (belly-ish)
    bx: new Float32Array(N), by: new Float32Array(N), bz: new Float32Array(N),   // binormal
    swimT: 0,
    // the head STATION's local rest position — station 0 is pinned here so the animated body stays
    // welded to the (separately-placed) head mesh; the sim's world head is group.localToWorld(anchor).
    anchor: { x: rf[0].p.x, y: rf[0].p.y, z: rf[0].p.z },
    minSample: opts.minSample ?? 0.08,
    // SWIM = a silky travelling S the body ALWAYS carries. Lateral (binormal) + a phase-shifted
    // vertical (normal) component so the tail flows in a soft helix, not a flat metronome wiggle; a
    // second harmonic breaks the pure-sine "tick"; amplitude swells head→tail (whip). driveX/driveY
    // are the caller's smoothed steer/pitch input — they SWELL the wave in the axis you're moving so
    // the ribbon flows into left/right and up/down. gain is the global (speed) multiplier.
    swimAmp: opts.swimAmp ?? 0.16, swimAmpY: opts.swimAmpY ?? 0.0,
    swimFreq: opts.swimFreq ?? 0.9, swimSpeed: opts.swimSpeed ?? 3.0, swimPhaseY: opts.swimPhaseY ?? 1.57,
    swimGrow: opts.swimGrow ?? 0.55, headFade: opts.headFade ?? 4,
    driveX: 0, driveY: 0, gain: 1,
    // MOVEMENT RESPONSE (Levers 1+2). steerMag (0..1, caller-set) DUCKS the idle swim so a steer
    // reads against relative quiet (contrast). pulses[] are travelling WHIP bumps spawned on a steer
    // EDGE (ribbonWhip): a signed Gaussian in the binormal/normal offset, born at the neck and
    // propagating tail-ward — the "flick the ribbon and a wave runs down it" beat a passive trail
    // can't make at game speed.
    steerMag: 0, duckAmt: opts.duckAmt ?? 0.65, pulses: [],
    pulseSpeed: opts.pulseSpeed ?? 14, pulseWidth: opts.pulseWidth ?? 3.2,
    pulseLife: opts.pulseLife ?? 0.9, pulseAmp: opts.pulseAmp ?? 2.2,
    // ATTACK: a whip must GROW from 0 over pulseAttack (smoothstep) — born at full amplitude it is a
    // single-frame teleport (~2.2u pop = the "stop-motion on hard snap" bug). 0.15s puts the envelope's
    // peak velocity at ~75ms, right on the "flick → wave" beat, so readability is kept.
    pulseAttack: opts.pulseAttack ?? 0.15,
    // STEER CURL: a lateral bend the caller ramps up with SUSTAINED steering (set S.curl each tick,
    // signed [-1,1]). Once steering saturates to a diagonal the head path stops curving, so a held
    // turn would look like a momentary one; this curls the trailing body into the turn on top of the
    // path — the "twirl" beat. Quadratic in arc length → the tail curls most (a J-hook).
    curl: 0, curlAmp: opts.curlAmp ?? 2.6,
  };
  return rib.sim;
}

// Spawn a WHIP pulse (Lever 2). `bAmp`/`nAmp` = signed lateral (binormal) / vertical (normal)
// amplitude of the travelling bump — the caller sizes them from the steer EDGE (Δinput). The pulse
// is born at the neck (arc 0) and propagates tail-ward, fading over pulseLife. Pool capped so a
// mashed stick can't stack an unbounded number; the oldest is dropped.
export function ribbonWhip(rib, bAmp, nAmp) {
  const S = rib.sim; if (!S) return;
  S.pulses.push({ t: 0, b: bAmp, n: nAmp, env: 0 });
  // cap 8: cooldown 0.13s × life 0.9s → ≤7 ever concurrent, so life-cull always wins and this shift
  // (which would evict a still-live pulse mid-flight — a SECOND single-frame pop) never fires in play.
  if (S.pulses.length > 8) S.pulses.shift();
}

// Seed the whole history as a straight line behind the head along `-dir` so the body starts as a
// clean line (no garbage) the first frame.
function seedStraight(S, hx, hy, hz, dir) {
  const total = S.segCum[S.N - 1] + 2;
  const step = S.minSample;
  const nseed = Math.min(HISTORY_LEN, Math.max(2, Math.ceil(total / step) + 2));
  for (let k = 0; k < nseed; k++) {
    const s = k * step;                                // arc length behind the head
    const i = (0 - k + HISTORY_LEN * 2) % HISTORY_LEN; // fill backwards from index 0
    S.hx[i] = hx - dir.x * s; S.hy[i] = hy - dir.y * s; S.hz[i] = hz - dir.z * s;
    S.hs[i] = -s;                                       // arc length (0 at head, negative going back)
  }
  S.head = 0; S.count = nseed; S.started = true;
}

// Advance one tick. `hx,hy,hz` = head world position (the leader). `fwd` = current head forward
// unit vector (world) — used only to seed a straight body on the first frame. Fills S.sx.. / frames.
export function updateRibbonSim(rib, hx, hy, hz, fwd, dt) {
  const S = rib.sim;
  if (!S.started) seedStraight(S, hx, hy, hz, fwd);

  // 1. record the head into the arc-length buffer when it has moved enough (decouples resolution
  //    from framerate / speed spikes).
  const head = S.head;
  const dx = hx - S.hx[head], dy = hy - S.hy[head], dz = hz - S.hz[head];
  const moved = Math.hypot(dx, dy, dz);
  if (moved >= S.minSample) {
    const ni = (head + 1) % HISTORY_LEN;
    S.hx[ni] = hx; S.hy[ni] = hy; S.hz[ni] = hz; S.hs[ni] = S.hs[head] + moved;
    S.head = ni; S.count = Math.min(S.count + 1, HISTORY_LEN);
  }
  // the LIVE head is a virtual newest point at its true arc length (so station 0 sits exactly on
  // the head every frame, no stutter between samples). Measure the gap from the NEWEST STORED
  // sample to the live head AFTER any record above — otherwise a just-recorded sample double-counts
  // `moved` and shoves every station one step toward the head (collapsing the station-0→1 spacing).
  const gx = hx - S.hx[S.head], gy = hy - S.hy[S.head], gz = hz - S.hz[S.head];
  const liveS = S.hs[S.head] + Math.hypot(gx, gy, gz);

  // 2. place each station at arc length segCum[i] behind the live head; walk the buffer
  //    newest→oldest with a monotonic cursor (O(N + samples)). Linear interp between samples.
  //    The "newer" bracket is ALWAYS the sample one-newer than `older` (or the live head when
  //    `older` is the newest recorded sample) — never a stale value from a previous station, or
  //    the interp collapses and arc length is not conserved.
  const oldest = (S.head - (S.count - 1) + HISTORY_LEN * 2) % HISTORY_LEN;
  let older = S.head;                                  // index of the "older" bracket sample
  for (let i = 0; i < S.N; i++) {
    const target = liveS - S.segCum[i];
    // advance the older cursor until hs[older] <= target (or we hit the oldest stored sample)
    while (older !== oldest && S.hs[older] > target) {
      older = (older - 1 + HISTORY_LEN) % HISTORY_LEN;
    }
    // the newer bracket: one sample newer than `older`, or the live head if `older` is the newest.
    let newerS, newerX, newerY, newerZ;
    if (older === S.head) { newerS = liveS; newerX = hx; newerY = hy; newerZ = hz; }
    else { const nb = (older + 1) % HISTORY_LEN; newerS = S.hs[nb]; newerX = S.hx[nb]; newerY = S.hy[nb]; newerZ = S.hz[nb]; }
    const olderS = S.hs[older];
    const denom = (newerS - olderS) || 1;
    let f = (target - olderS) / denom;                 // 0 at older → 1 at newer
    if (f < 0) f = 0; else if (f > 1) f = 1;           // clamp: short buffer pins the tail
    S.sx[i] = S.hx[older] + (newerX - S.hx[older]) * f;
    S.sy[i] = S.hy[older] + (newerY - S.hy[older]) * f;
    S.sz[i] = S.hz[older] + (newerZ - S.hz[older]) * f;
  }

  // 3. rotation-minimising (parallel transport) frames — NEVER Frenet (which flips at inflections
  //    and blows up at zero curvature = the straight rest state). Seed normal from world-up.
  const N = S.N;
  // tangents (central difference; ends one-sided). Tangent points head→tail (+ down the body).
  for (let i = 0; i < N; i++) {
    let ax, ay, az, bx, by, bz;
    if (i === 0) { ax = S.sx[0]; ay = S.sy[0]; az = S.sz[0]; bx = S.sx[1]; by = S.sy[1]; bz = S.sz[1]; }
    else if (i === N - 1) { ax = S.sx[N - 2]; ay = S.sy[N - 2]; az = S.sz[N - 2]; bx = S.sx[N - 1]; by = S.sy[N - 1]; bz = S.sz[N - 1]; }
    else { ax = S.sx[i - 1]; ay = S.sy[i - 1]; az = S.sz[i - 1]; bx = S.sx[i + 1]; by = S.sy[i + 1]; bz = S.sz[i + 1]; }
    let tx = bx - ax, ty = by - ay, tz = bz - az; const tl = Math.hypot(tx, ty, tz) || 1;
    S.tx[i] = tx / tl; S.ty[i] = ty / tl; S.tz[i] = tz / tl;
  }
  // seed frame 0: normal = worldUp projected ⟂ tangent (fallback worldFwd if degenerate)
  {
    let upx = 0, upy = 1, upz = 0;
    let d = S.tx[0] * upx + S.ty[0] * upy + S.tz[0] * upz;
    if (Math.abs(d) > 0.98) { upx = 0; upy = 0; upz = 1; d = S.tx[0] * upx + S.ty[0] * upy + S.tz[0] * upz; }
    let nx = upx - S.tx[0] * d, ny = upy - S.ty[0] * d, nz = upz - S.tz[0] * d; const nl = Math.hypot(nx, ny, nz) || 1;
    S.nx[0] = nx / nl; S.ny[0] = ny / nl; S.nz[0] = nz / nl;
    S.bx[0] = S.ty[0] * S.nz[0] - S.tz[0] * S.ny[0];
    S.by[0] = S.tz[0] * S.nx[0] - S.tx[0] * S.nz[0];
    S.bz[0] = S.tx[0] * S.ny[0] - S.ty[0] * S.nx[0];
  }
  // transport the normal down the spine via the minimal rotation between consecutive tangents (Rodrigues)
  for (let i = 1; i < N; i++) {
    const t0x = S.tx[i - 1], t0y = S.ty[i - 1], t0z = S.tz[i - 1];
    const t1x = S.tx[i], t1y = S.ty[i], t1z = S.tz[i];
    let ax = t0y * t1z - t0z * t1y, ay = t0z * t1x - t0x * t1z, az = t0x * t1y - t0y * t1x;
    const s = Math.hypot(ax, ay, az), c = t0x * t1x + t0y * t1y + t0z * t1z;
    let nx = S.nx[i - 1], ny = S.ny[i - 1], nz = S.nz[i - 1];
    if (s > 1e-6) {
      ax /= s; ay /= s; az /= s; const th = Math.atan2(s, c), cs = Math.cos(th), sn = Math.sin(th);
      // Rodrigues: n' = n cosθ + (k×n) sinθ + k (k·n)(1-cosθ)
      const kdn = ax * nx + ay * ny + az * nz;
      const cx = ay * nz - az * ny, cy = az * nx - ax * nz, cz = ax * ny - ay * nx;
      nx = nx * cs + cx * sn + ax * kdn * (1 - cs);
      ny = ny * cs + cy * sn + ay * kdn * (1 - cs);
      nz = nz * cs + cz * sn + az * kdn * (1 - cs);
    }
    // re-orthonormalise against the tangent
    const dt = nx * t1x + ny * t1y + nz * t1z; nx -= t1x * dt; ny -= t1y * dt; nz -= t1z * dt;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    S.nx[i] = nx; S.ny[i] = ny; S.nz[i] = nz;
    S.bx[i] = t1y * nz - t1z * ny; S.by[i] = t1z * nx - t1x * nz; S.bz[i] = t1x * ny - t1y * nx;
  }

  // 4. SWIM — a silky travelling S the body always carries, keyed on ARC LENGTH (so it rides a coil
  //    correctly). Lateral along the binormal + a phase-shifted vertical along the normal (soft
  //    helix, not a flat wiggle); a 2nd harmonic breaks the metronome; amplitude is crisp at the head
  //    (headFade) and swells toward the tail (swimGrow → whip). driveX/driveY swell the wave in the
  //    axis the pilot is steering so it flows into left/right + up/down; gain is the speed multiplier.
  S.swimT += dt;
  if (S.swimAmp > 0 || S.swimAmpY > 0) {
    const bodyLen = S.segCum[N - 1] || 1;
    // Lever 1 — idle DUCK: fade the always-on idle swim down as the pilot steers (steerMag) so the
    // input-driven motion (drive swell + whip pulse + curl) reads against relative quiet. The idle is
    // untouched at rest (steerMag 0 → duck 1); the drive term is NOT ducked (it's the response).
    const duck = 1 - S.duckAmt * S.steerMag;
    const latAmp = (S.swimAmp * duck + S.driveX) * S.gain;
    const verAmp = (S.swimAmpY * duck + S.driveY) * S.gain;
    for (let i = 0; i < N; i++) {
      const arc = S.segCum[i];
      const u = arc / bodyLen;                               // 0 head → 1 tail
      const env = Math.min(1, i / S.headFade) * (1 - S.swimGrow + S.swimGrow * u);   // crisp head, swelling tail
      const ph = S.swimFreq * arc - S.swimSpeed * S.swimT;
      const wave = Math.sin(ph) * 0.78 + Math.sin(ph * 0.5 + 0.9) * 0.32;            // two-harmonic (organic, not a tick)
      const lat = latAmp * env * wave;
      const ver = verAmp * env * (Math.sin(ph + S.swimPhaseY) * 0.78 + Math.sin(ph * 0.5 + 0.9 + S.swimPhaseY) * 0.32);
      S.sx[i] += S.bx[i] * lat + S.nx[i] * ver;
      S.sy[i] += S.by[i] * lat + S.ny[i] * ver;
      S.sz[i] += S.bz[i] * lat + S.nz[i] * ver;
    }
  }
  // STEER CURL — sustained steering (S.curl, smoothed by the caller so a flick barely curls) bends
  // the trailing body into the turn, quadratic in arc length so the tail hooks most. Zero at rest,
  // so a straight flight stays a clean line.
  if (S.curl) {
    const bodyLen = S.segCum[N - 1] || 1;
    for (let i = 0; i < N; i++) {
      const k = S.segCum[i] / bodyLen;
      const off = S.curlAmp * S.curl * k * k;
      S.sx[i] += S.bx[i] * off; S.sy[i] += S.by[i] * off; S.sz[i] += S.bz[i] * off;
    }
  }
  // Lever 2 — WHIP PULSES: advance + cull, then add each pulse's travelling Gaussian bump. The crest
  // rides tail-ward at pulseSpeed (arc units/s) from the neck; amplitude fades over pulseLife. This is
  // the visible "the ribbon answered my hand" event, distinct from the (ducked) idle swim.
  if (S.pulses.length) {
    for (const p of S.pulses) p.t += dt;
    S.pulses = S.pulses.filter((p) => p.t < S.pulseLife);
    // per-pulse ATTACK×decay envelope, hoisted out of the station loop (kills the birth pop; the
    // smoothstep attack grows it from 0, the existing linear decay reaches 0 at cull so death is clean).
    for (const p of S.pulses) {
      const a = Math.min(1, p.t / S.pulseAttack);
      p.env = a * a * (3 - 2 * a) * (1 - p.t / S.pulseLife);
    }
    for (let i = 0; i < N; i++) {
      let ob = 0, on = 0;
      const arc = S.segCum[i];
      for (const p of S.pulses) {
        const d = (arc - S.pulseSpeed * p.t) / S.pulseWidth;
        const g = Math.exp(-d * d) * p.env;
        ob += p.b * g; on += p.n * g;
      }
      if (ob !== 0 || on !== 0) {
        S.sx[i] += S.bx[i] * ob + S.nx[i] * on;
        S.sy[i] += S.by[i] * ob + S.ny[i] * on;
        S.sz[i] += S.bz[i] * ob + S.nz[i] * on;
      }
    }
  }
}

// Convert this tick's WORLD stations+frames into the render group's local space (inverse of the
// group world rotation, minus the head world position) and write them into rib.liveFrames, which
// the dragon.js re-loft reads. `invQuat` is the inverse of the group's world quaternion; `hx,hy,hz`
// the head world position (the group origin).
export function ribbonToLocal(rib, invQuat, hx, hy, hz) {
  const S = rib.sim, F = rib.liveFrames, q = invQuat;
  const rot = (x, y, z, out) => {
    // out = q * (x,y,z) — quaternion-rotate a vector
    const ix = q.w * x + q.y * z - q.z * y, iy = q.w * y + q.z * x - q.x * z,
      iz = q.w * z + q.x * y - q.y * x, iw = -q.x * x - q.y * y - q.z * z;
    out.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
    out.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
    out.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
  };
  const a = S.anchor;
  for (let i = 0; i < S.N; i++) {
    const f = F[i];
    // position: rotate the world offset-from-head into group-local, then pin to the head's local
    // rest position (so station 0 lands exactly where the head mesh is, never at the group origin).
    rot(S.sx[i] - hx, S.sy[i] - hy, S.sz[i] - hz, f.p);
    f.p.x += a.x; f.p.y += a.y; f.p.z += a.z;
    rot(S.tx[i], S.ty[i], S.tz[i], f.T);
    rot(S.nx[i], S.ny[i], S.nz[i], f.Nn);
    rot(S.bx[i], S.by[i], S.bz[i], f.B);
  }
}
