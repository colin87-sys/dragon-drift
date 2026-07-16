// Animated 2D canvas trail previews for the STYLE shop tab.
// Each flightmark card has a <canvas class="trail-preview">; this module
// runs a shared RAF loop at ~30fps and draws a particle stream into each.
// Canvases that leave the DOM are cleaned automatically.

let items = [];  // { canvas, ctx, mark, particles }
let rafId = 0;
let lastDraw = 0;

function hexToRgb(h) {
  return [(h >> 16) & 0xff, (h >> 8) & 0xff, h & 0xff];
}

function spawn(item) {
  const { canvas, mark } = item;
  const palette = mark.trailPalette ?? [mark.trail, mark.boostTrail ?? mark.trail];
  const isAurora   = mark.id === 'aurora';
  const isGoldleaf = mark.id === 'goldleaf';
  const col = palette[Math.floor(Math.random() * palette.length)];
  const [r, g, b] = hexToRgb(col);
  item.particles.push({
    x:    canvas.width * (0.95 + Math.random() * 0.08),
    y:    canvas.height * (isAurora ? 0.5 : 0.3 + Math.random() * 0.4),
    vx:   isGoldleaf ? -(1.8 + Math.random() * 3.2) : -(0.7 + Math.random() * 1.4),
    vy:   (Math.random() - 0.5) * (isAurora ? 0.2 : isGoldleaf ? 2.8 : 0.9),
    life: 1.0,
    decay: isGoldleaf ? 0.028 + Math.random() * 0.032 : 0.013 + Math.random() * 0.01,
    size:  isGoldleaf ? 1.2 + Math.random() * 3.2 : 1.8 + Math.random() * 2.6,
    r, g, b,
    phase: Math.random() * Math.PI * 2,
    isAurora,
    isGoldleaf,
  });
}

function draw(item, t) {
  const { canvas, ctx, particles, mark } = item;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background glow centred on the stream
  const [gr, gg, gb] = hexToRgb(mark.trail);
  const grd = ctx.createRadialGradient(
    canvas.width * 0.6, canvas.height * 0.5, 0,
    canvas.width * 0.6, canvas.height * 0.5, canvas.width * 0.48
  );
  grd.addColorStop(0, `rgba(${gr},${gg},${gb},0.11)`);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    if (p.isAurora) p.vy += Math.sin(t * 2.8 + p.phase) * 0.045;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0 || p.x < -12) { particles.splice(i, 1); continue; }

    const a = p.life * (p.isGoldleaf ? 0.88 : 0.72);
    const r = p.size * p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
    ctx.fill();

    // Cross-star flicker on goldleaf bright sparks
    if (p.isGoldleaf && p.life > 0.55) {
      const s = p.size * 2.2;
      ctx.beginPath();
      ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
      ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
      ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${a * 0.45})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }
}

function loop(now = performance.now()) {
  items = items.filter(it => it.canvas.isConnected);
  if (!items.length) { rafId = 0; return; }
  rafId = requestAnimationFrame(loop);
  if (now - lastDraw < 33) return;
  lastDraw = now;
  const t = now / 1000;
  for (const item of items) {
    const isGoldleaf = item.mark.id === 'goldleaf';
    const burst = isGoldleaf ? 3 : item.mark.trailPalette ? 2 : 1;
    const cap   = isGoldleaf ? 65 : 38;
    if (item.particles.length < cap) {
      for (let e = 0; e < burst; e++) spawn(item);
    }
    draw(item, t);
  }
}

// Attach animated trail previews to all .trail-preview canvases in `root`.
// `flightmarks` is the FLIGHTMARKS array from flightmarks.js.
export function attachTrailPreviews(root, flightmarks) {
  items = [];
  const canvases = root.querySelectorAll('canvas.trail-preview');
  if (!canvases.length) return;
  for (const canvas of canvases) {
    const markId = canvas.dataset.mark;
    const mark = markId
      ? flightmarks.find(m => m.id === markId)
      : { id: 'default', trail: 0xffc080, boostTrail: 0xff8020, trailPalette: null };
    if (!mark) continue;
    items.push({ canvas, ctx: canvas.getContext('2d'), mark, particles: [] });
  }
  if (items.length && !rafId) rafId = requestAnimationFrame(loop);
}
