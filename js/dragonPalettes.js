// Dragon skin palettes. `azure` is the free default — Panzer-Dragoon-style
// blue body with hot orange→red membrane wings. Others unlock in the shop
// for embers (stat-neutral, pure cosmetics).
export const PALETTES = {
  azure: {
    name: 'Azure Drake',
    cost: 0,
    body: 0x2b58c8, belly: 0xffd9a8, scales: 0x9fe8ff, horn: 0xffdf8a,
    wingInner: 0xff8a3c, wingOuter: 0xd91f1f, wingEmissive: 0xff5222,
    cloak: 0xc83a24, eye: 0x55e0ff, trail: 0xffc080,
  },
  ember: {
    name: 'Ember Wyrm',
    cost: 600,
    body: 0xb83820, belly: 0xffd9a8, scales: 0xffb060, horn: 0xffe8a0,
    wingInner: 0xffc23c, wingOuter: 0xb81f60, wingEmissive: 0xff8022,
    cloak: 0x202848, eye: 0xffd060, trail: 0xffd080,
  },
  jade: {
    name: 'Jade Serpent',
    cost: 900,
    body: 0x1f9a60, belly: 0xe8ffd0, scales: 0xa0ffd0, horn: 0xffe8a0,
    wingInner: 0x60e8a0, wingOuter: 0x106a8a, wingEmissive: 0x40e890,
    cloak: 0x6a2040, eye: 0xa0ffc0, trail: 0xa0ffd0,
  },
  obsidian: {
    name: 'Obsidian Shade',
    cost: 1500,
    body: 0x282038, belly: 0x6a5a8a, scales: 0xb090ff, horn: 0xd0c0ff,
    wingInner: 0x8a40ff, wingOuter: 0xff2080, wingEmissive: 0xa040ff,
    cloak: 0xff4060, eye: 0xff60c0, trail: 0xc090ff,
  },
  pearl: {
    name: 'Pearl Seraph',
    cost: 2400,
    body: 0xe8e8f0, belly: 0xffe8c0, scales: 0xfff0d0, horn: 0xffd060,
    wingInner: 0xffe080, wingOuter: 0xff8040, wingEmissive: 0xffc040,
    cloak: 0x4060c0, eye: 0x80c0ff, trail: 0xffe8a0,
  },
};
