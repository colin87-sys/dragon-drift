// Tiny pub/sub for gameplay events. Decouples missions/stats from the
// systems that produce the events (rings, collision, embers, player...).
const listeners = new Map();

export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(fn);
}

export function emit(type, payload) {
  const fns = listeners.get(type);
  if (!fns) return;
  for (const fn of fns) fn(payload);
}
