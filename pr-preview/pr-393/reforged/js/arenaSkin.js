import * as THREE from 'three';

// ARENA SKIN (THE UNMASKED, PR-A) — THE HOLLOW BEHIND THE SKY. A value-space environment override:
// the boss's stage machine drives a 0→1 `mix`, and this module lerps the live `env` scratch
// (biomes.js computeEnv) toward an authored VOID palette, THROUGH a bright FLOOD mid-palette so the
// S1→S2 crack reads as being pulled THROUGH the tear (Weftwitch's mended sky = the finale's entry
// wound) into the space behind the mask. RENDER-ONLY: zero scene-graph writes, zero meshes, zero RNG
// — the reparent trap that would kill the shipped lance organs (skyReplace, the EMBERTIDE lesson) is
// structurally unreachable. At mix 0 this is a no-op → every other boss + all flight is byte-identical.
// Empty-first: the void's "Blanks" (unfinished mask-ovals) are a later gated increment; PR-A is the
// palette swap alone. The lore: the starfield is the SAME field — the stars were always pinholes in
// the mask. See docs/unmasked-arena-PR-A-buildspec.md + docs/unmasked-arena-identity.md.

// The env schema (biomes.js scratch) split into colors vs scalars — the ONLY source of truth for
// which fields the arena touches. A schema-completeness test asserts this equals computeEnv(0)'s keys,
// so a graphics-stream env field addition fails LOUDLY instead of leaking a biome value into the void.
const COLOR_KEYS = [
  'skyTop', 'skyMid', 'skyHorizon', 'sunGlow', 'fogColor', 'fogFarColor',
  'lightSun', 'hemiSky', 'hemiGround', 'waterDeep', 'waterShallow', 'ambColor', 'faunaColor',
  'cloudLit', 'cloudShadow',   // N9 sky-cloud tints (biome graphics stream) — the arena owns them so biome clouds can't drift through the void/heaven
];
const SCALAR_KEYS = [
  'fogNear', 'fogFar', 'fogFarMix', 'lightSunI', 'waveAmp',
  'ambFall', 'ambSway', 'ambSize', 'ambOpacity', 'faunaScale', 'faunaFlap',
  'starMix', 'whaleMix', 'flybyMix',
  'atmosHeightK', 'atmosInscatter', 'cloudAmount',   // N8 atmosphere + N9 cloud coverage — arena zeroes them (a clean authored sky, no biome clouds/scatter leaking in)
];
export const ARENA_ENV_KEYS = [...COLOR_KEYS, ...SCALAR_KEYS];

// THE VOID — "The Hollow Behind the Sky, Where It Made the Masks." The maskwright's workshop: the sun
// GONE (sunGlow 0 → the water sun-streak dies with it), the world fog-swallowed to a ~200m pocket, a
// bruise-violet horizon band at wing height, mask-dust falling UP (ambFall negative), the stars
// revealed as pinholes (starMix 1), nothing alive (fauna/whale/flyby zeroed). A dark PLACE with a
// non-black identity hue (violet), never an absence. Contrast re-derived with the gate's own lum().
export const VOID_HEX = {
  skyTop: 0x0a0616, skyMid: 0x1a1030, skyHorizon: 0x2a1a4a, sunGlow: 0x000000,
  fogColor: 0x18102c, fogNear: 45, fogFar: 240, fogFarColor: 0x241640, fogFarMix: 1,
  lightSun: 0xa89fe0, lightSunI: 0.6, hemiSky: 0x4a3c72, hemiGround: 0x2a2048,   // hemiGround = the FRONT-fill that actually lights the camera-facing seraph (the sun shines on its BACK); lifting it + the bruise-violet midtone floor pulls the boss + bg off the shared black shadow-floor so the silhouette pops (danmaku: never a pure-black bg). Legibility floor 0.20 respected (skyHorizon L≈0.13).
  waterDeep: 0x0a061c, waterShallow: 0x1c1236, waveAmp: 0.15,
  ambColor: 0xcfc2ee, ambFall: -0.45, ambSway: 0.4, ambSize: 0.4, ambOpacity: 0.9,
  faunaColor: 0xcfc2ee, faunaScale: 0, faunaFlap: 0,
  starMix: 1, whaleMix: 0, flybyMix: 0,
  cloudAmount: 0, cloudLit: 0x0d0618, cloudShadow: 0x050208, atmosHeightK: 0, atmosInscatter: 0,   // no biome clouds/scatter in the hollow
};

// THE FLOOD — the S1→S2 crack mid-palette: the hollow LEAKING through the reopened tear. Overexpose
// to white-violet, then drain into the void — so the transition reads as a teleport, not weather.
// starMix 0 here so the pinholes FADE IN during the drain ("they are simply there"); fauna/whale/flyby
// lerp toward 0 across the first half of the crack (they thin out into the flood, gone by the void). All
// values TUNE (the "pulled-through" feel is a PR-C owner/Fable iteration; these are authored starts).
export const FLOOD_HEX = {
  skyTop: 0xcfc2f2, skyMid: 0xe8dcff, skyHorizon: 0xf2ecff, sunGlow: 0xffffff,
  fogColor: 0xe8dcff, fogNear: 25, fogFar: 260, fogFarColor: 0xe8dcff, fogFarMix: 1,
  lightSun: 0xe8dcff, lightSunI: 2.0, hemiSky: 0xd8ccf0, hemiGround: 0x8a7ca8,
  waterDeep: 0x8a7cb8, waterShallow: 0xd8ccf0, waveAmp: 0.3,
  ambColor: 0xffffff, ambFall: 0, ambSway: 0.5, ambSize: 0.4, ambOpacity: 0.6,
  faunaColor: 0xffffff, faunaScale: 0, faunaFlap: 0,
  starMix: 0, whaleMix: 0, flybyMix: 0,
  cloudAmount: 0, cloudLit: 0xe8dcff, cloudShadow: 0xcfc2f2, atmosHeightK: 0, atmosInscatter: 0,
};

// THE JUDGMENT COURT (PR-J, the chiaroscuro redo) — "What the Sky Was a Mask Of." The owner rejected
// the first bright-gold heaven ("over-bright and underwhelming"); the redo keeps the same window but
// flips the value logic: the gold flood detonates and clears into a vast MIDNIGHT CATHEDRAL lit only
// by the god's own light. MIDNIGHT INDIGO + GOLD (owner-locked): an indigo/violet vault (skyTop L≈.10)
// over ONE molten-gold horizon BAND (L≈.49 — a band, not a wash), a black-glass mirror sea carrying
// the sun-road, distance sinking into dark violet-bronze gloom. The dark seraph reads by SILHOUETTE
// against the divine column + its own halo blazing on the dark vault (S3 = the VOID TRANSFIGURED — kin
// to S2's dark, now inhabited by light). Stars kept faint (starMix .25); gold light-RAIN finally reads
// on the dark vault (ambOpacity .9). hemiGround = the void lesson's real lever: a dark warm front-fill
// models the camera-facing seraph while keeping it a shadow. Contrast re-derived with the gate's own
// lum(): fog L≈.19 — every role colour clears it DIRECTLY (the layered read lapses below bg .28, so the
// fog must sit ≥.15 from the nearest band colour: arena-dark 0xa84167 L.352 ⇒ fog ≤ .202); horizon
// L≈.49 sits inside the layered window [.28,.75] so all six pass there. The boss's S3 focal now CROWNS
// a silhouette instead of out-brightening a sky (bossUnmasked.js lifts retuned). All TUNE.
export const HEAVEN_HEX = {
  skyTop: 0x131a36, skyMid: 0x35305e, skyHorizon: 0xa87838, sunGlow: 0xffdf9a,
  fogColor: 0x372c4e, fogNear: 60, fogFar: 340, fogFarColor: 0x372c4e, fogFarMix: 1,   // dark violet-bronze — distance sinks into gloom (L≈.19: below .202 so every band colour reads DIRECT against it)
  lightSun: 0xffe2b0, lightSunI: 1.15, hemiSky: 0x7e8fc0, hemiGround: 0x635033,        // cool vault fill + a dark warm front-fill (the seraph models, but stays a shadow)
  waterDeep: 0x141c36, waterShallow: 0x7e6534, waveAmp: 0.2,                            // BLACK-GLASS mirror sea, gold only in glints; glassy swell buys ~0.18u wing clearance
  ambColor: 0xffd98a, ambFall: 0.5, ambSway: 0.25, ambSize: 0.55, ambOpacity: 0.9,      // GOLD LIGHT-RAIN (the mote pool re-skinned — zero new draws), finally legible on the dark vault
  faunaColor: 0xffd98a, faunaScale: 0, faunaFlap: 0,
  starMix: 0.25, whaleMix: 0, flybyMix: 0,                                              // the pinholes stay FAINTLY there — the court is the void transfigured, not a new sky
  cloudAmount: 0.12, cloudLit: 0xd9a860, cloudShadow: 0x241d38, atmosHeightK: 0, atmosInscatter: 0,   // Baroque cloud bodies: DARK masses with gilt rims, sparse — the vault stays legible dark
};

// THE GOLD FLOOD — the S2→S3 unveiling mid-palette: light blooms outward FROM the boss (the burst
// igniting reads as the CAUSE of the heaven arriving). Warm-white gold; the pinhole-stars die inside
// the bloom ("all that light was always behind the dark"). All TUNE (PR-C iterates the unveil feel).
export const GOLD_FLOOD_HEX = {
  skyTop: 0xffeecb, skyMid: 0xfff0c8, skyHorizon: 0xfff4d4, sunGlow: 0xffffff,
  fogColor: 0xfff0c8, fogNear: 25, fogFar: 300, fogFarColor: 0xfff0c8, fogFarMix: 1,
  lightSun: 0xfff0c8, lightSunI: 2.2, hemiSky: 0xffe8c0, hemiGround: 0xbfa070,
  waterDeep: 0xc0a878, waterShallow: 0xffe9bf, waveAmp: 0.4,
  ambColor: 0xffffff, ambFall: 0.2, ambSway: 0.3, ambSize: 0.45, ambOpacity: 0.7,
  faunaColor: 0xffffff, faunaScale: 0, faunaFlap: 0,
  starMix: 0, whaleMix: 0, flybyMix: 0,
  cloudAmount: 0, cloudLit: 0xfff0c8, cloudShadow: 0xc0a878, atmosHeightK: 0, atmosInscatter: 0,
};

// The void's bullet-band override: the default dark band 0x8f0a3c (L .164) FAILS all four void
// backgrounds (a fairness break); Astral's certified lift 0xa84167 (biomes.js:150) passes all four —
// AND passes both heaven backgrounds, so the PR-A latch simply PERSISTS through the heaven (no second
// band mechanism). Applied once at the reveal (boss.js latch). Consumed by tests/bulletcontrast.mjs.
export const VOID_BULLETS = { dark: 0xa84167 };
export const ARENA_CONTRAST = [
  { name: 'THE HOLLOW (void arena)', fog: VOID_HEX.fogColor, horizon: VOID_HEX.skyHorizon, bullets: VOID_BULLETS },
  { name: 'THE UNVEILED HEAVEN (arena)', fog: HEAVEN_HEX.fogColor, horizon: HEAVEN_HEX.skyHorizon, bullets: VOID_BULLETS },
];

// Baked THREE.Color tables (once at module load — no per-frame allocation).
const bake = (hex) => {
  const t = {};
  for (const k of COLOR_KEYS) t[k] = new THREE.Color(hex[k]);
  for (const k of SCALAR_KEYS) t[k] = hex[k];
  return t;
};
const VOID = bake(VOID_HEX);
const FLOOD = bake(FLOOD_HEX);
const HEAVEN = bake(HEAVEN_HEX);
const GOLDFLOOD = bake(GOLD_FLOOD_HEX);
const BIOME = bake(VOID_HEX);   // a scratch table reused to snapshot the live biome for the exhale fade (values overwritten each call)

const lerp = THREE.MathUtils.lerp;
const T0 = 0.45;                                     // flood peak on the beat clock
const sstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

const blend = (env, tgt, k) => {
  for (const key of COLOR_KEYS) env[key].lerp(tgt[key], k);
  for (const key of SCALAR_KEYS) env[key] = lerp(env[key], tgt[key], k);
};
const copyInto = (env, tgt) => {
  for (const key of COLOR_KEYS) env[key].copy(tgt[key]);
  for (const key of SCALAR_KEYS) env[key] = tgt[key];
};

// THE injection point (called once from environment.js updateEnvironment, on the live `env` scratch,
// BEFORE the fan-out). Mix domain 0..2: 0..1 = ordinary→FLOOD→VOID (PR-A, untouched); 1..2 =
// VOID→GOLD-FLOOD→HEAVEN (the unveiling, same T0 grammar). `fade` 1 = full arena; fade<1 = the
// natural-kill EXHALE — the arena dissolves STRAIGHT into the live biome sky (never runs the 0..2 curve
// backwards, which would strobe). mix 0 OR fade 0 ⇒ zero writes ⇒ byte-identical. Past each T0 the prior
// state is copied out of the equation, so at mix 1 the env is VOID and at mix 2 it is HEAVEN byte-exactly
// — source-independent from any biome.
export function applyArenaSkin(env, mix, fade = 1) {
  if (!(mix > 0) || !(fade > 0)) return;
  if (fade >= 1) { applyMix(env, mix); return; }   // byte-exact path (no extra lerp)
  copyInto(BIOME, env);                             // snapshot the live biome (alloc-free)
  applyMix(env, mix);
  blend(env, BIOME, 1 - fade);                      // arena → the returned biome sky, directly
}
function applyMix(env, mix) {
  if (mix <= 1) {                                   // PR-A branch, byte-identical
    if (mix < T0) blend(env, FLOOD, sstep(mix / T0));
    else { copyInto(env, FLOOD); blend(env, VOID, sstep((mix - T0) / (1 - T0))); }
  } else {                                          // the unveiling: VOID → GOLD FLOOD → HEAVEN
    const m = Math.min(1, mix - 1);
    if (m < T0) { copyInto(env, VOID); blend(env, GOLDFLOOD, sstep(m / T0)); }
    else { copyInto(env, GOLDFLOOD); blend(env, HEAVEN, sstep((m - T0) / (1 - T0))); }
  }
}
