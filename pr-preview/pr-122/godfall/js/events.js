// Minimal pub/sub. Combat systems emit, HUD/music/cinematics listen —
// nobody imports anybody else's internals.
const map = new Map();

export function on(type, fn) {
  let arr = map.get(type);
  if (!arr) map.set(type, (arr = []));
  arr.push(fn);
  return () => {
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  };
}

export function emit(type, payload) {
  const arr = map.get(type);
  if (!arr) return;
  for (let i = 0; i < arr.length; i++) arr[i](payload);
}
