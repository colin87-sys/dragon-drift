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

// Graphics-stream BIOME-EFFECT gates (xMix-style enables) added by later biome/storm/reflection work.
// The arena does NOT palette-lerp these toward a void/heaven value — it SILENCES them (→0) as it floods,
// exactly like the original empy/nacre/mote handling, so no biome effect (aurora curtains, storm rain,
// the Empyrean bloom, shoal shimmer, aerial props, water-reflection stretch…) can draw OVER the authored
// void/heaven. Byte-identical off-arena (mix 0 returns before applyMix) and in THE UNMASKED's anchor
// biome where these are already 0. Adding one to computeEnv without classifying it trips the schema test.
export const ARENA_SILENCED_KEYS = [
  'shoalMix', 'moteMix', 'auroraMix', 'empyMix', 'nacreMix', 'moteDepthFade',
  'propAerial', 'reflStretch', 'reflGlint', 'reflGreenPull', 'surgeWarm',
  'canopyRoof', 'horizonShaft', 'heroRim', 'cloudForce', 'deckBias',
  'stormSea', 'windX', 'windZ', 'rainMix', 'breachMix',
];
// Consciously PASSED THROUGH (not overridden): the god-ray shaft params (the void SUPPRESSES shafts via
// voidSky; the heaven SWELLS them boss-side via setGodRayBoost — either way the arena leaves the tint/mul/
// break as-is, byte-identical to the shipped anchor-biome fight) and the two now-silenced effects' colors
// (moot — propAerial/heroRim are silenced to 0, so their colours never render).
export const ARENA_PASSTHROUGH_KEYS = [
  'godrayMul', 'godrayBreak', 'godrayTint', 'propAerialColor', 'heroRimColor',
];

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

// THE FIRSTBORN SKY (PR-K, the cosmos pivot) — "Behind the Mask There Was Never a Building." The owner
// pivoted away from the judgment-court cathedral: S3 is now the SAME dark hollow (S2) KINDLING into
// creation — an astral/nebula cosmos. The S2 pinhole-stars bloom into a full firmament (starMix 1 —
// THE payoff: the dome's night-aurora term comes alive for free), nebula gas ignites across the vault
// (the sky-cloud FBM band re-tinted WARM GOLD-ROSE at amount .35 — dome-locked, parallax-perfect,
// zero new draws), and behind the seraph ONE GODHEAD STAR burns as the fight's single light
// (arenaSet.js v3). MIDNIGHT INDIGO + GOLD (owner-locked colour heart) expressed as COSMOS, not
// architecture: a deep space-indigo vault (skyTop L≈.09) over a violet-magenta nebula mid-lift, the
// molten-gold horizon band kept as the GALACTIC PLANE, the sea dropped ~30u to a dim-violet near-dead-
// calm HAZE-DECK far below the wings (water.js window driver — mirror kept, glint killed), and star-
// white-gold STARDUST drifting weightlessly UP (ambFall −0.10 rhymes with S2's up-dust; the mote pool
// re-skinned — zero new draws). The dark was never empty — it was pregnant. Contrast re-derived with
// the gate's own lum(): fog 0x352b52 L≈.188 — every role colour clears it DIRECTLY (the layered read
// lapses below bg .28, so the fog must sit ≥.15 from the nearest band colour: arena-dark 0xa84167
// L.352 ⇒ fog ≤ .202); horizon L≈.49 sits inside the layered window [.28,.75] so all six pass there.
// All TUNE.
// THE GODHEAD DETONATION (arena-godhead-detonation, P1) — THE FIRSTBORN SKY's apotheosis: the newborn
// supernova heart goes off and KEEPS erupting. The indigo+gold cosmos of PR-K, pushed toward a
// full-frame holy detonation (FF7 Safer-Sephiroth's STYLE, our colour). P1 is the value-space half:
// the nebula mid-lift is WARMED toward the blast's rose-violet body and the FBM gas is IGNITED
// (cloudAmount .35→.5, cloudLit hotter) so the vault reads as roiling luminous detonation gas — while
// the ZENITH (skyTop) and the parry corridor stay dark: the detonation is a MID-ANNULUS event by
// construction (owner colour law). fog + skyHorizon UNCHANGED (bulletcontrast is re-certified against
// them). The geometry (streak fan / shock rings / debris / ignited seraph) rides on top in P2–P5. All TUNE.
export const HEAVEN_HEX = {
  skyTop: 0x0e1230, skyMid: 0x584070, skyHorizon: 0xa87838, sunGlow: 0xffcf82,          // deep space-indigo vault (zenith UNCHANGED — the dark that reads the streaks) · warmed rose-violet nebula body · the gold band = the GALACTIC PLANE · the Godhead Star's glow (I2: hotter molten gold → the blast IGNITES the sea's reflection column, not an ordinary sun-glint; more-saturated gold is lower-luma = sky-fairness-positive)
  fogColor: 0x352b52, fogNear: 60, fogFar: 340, fogFarColor: 0x352b52, fogFarMix: 1,   // dark violet — distance sinks into cosmic gloom (L≈.188: below .202 so every band colour reads DIRECT against it) — UNCHANGED, bulletcontrast-locked
  lightSun: 0xffe2b0, lightSunI: 1.15, hemiSky: 0x7e8fc0, hemiGround: 0x635033,        // cool vault fill + a dark warm front-fill (the seraph models, but stays a shadow)
  waterDeep: 0x1a1638, waterShallow: 0x6a4850, waveAmp: 0.12,                           // HAZE-DECK that ANSWERS the blast (I2): deep stays dim violet (the broad fairness-safe rest), but the LIT wave faces warm to a rose-gold ember + a hair more churn → the detonation relights the sea's reflection column WITHOUT a full gold mirror
  ambColor: 0xffe9c0, ambFall: -0.10, ambSway: 0.45, ambSize: 0.5, ambOpacity: 0.85,    // STARDUST (the mote pool re-skinned — zero new draws): star-white-gold, weightless slow RISE
  faunaColor: 0xffe9c0, faunaScale: 0, faunaFlap: 0,
  starMix: 1.0, whaleMix: 0, flybyMix: 0,                                               // the S2 pinholes BLOOM to a firmament — the same field, kindled (+ the dome's aurora veil rides starMix free)
  cloudAmount: 0.5, cloudLit: 0xe89a6a, cloudShadow: 0x1c1434, atmosHeightK: 0, atmosInscatter: 0,   // ROILING DETONATION GAS: the FBM cloud band IGNITED (amount .35→.5, hotter gold-rose); unlit gas sinks into the vault
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
  { name: 'THE FIRSTBORN SKY (arena)', fog: HEAVEN_HEX.fogColor, horizon: HEAVEN_HEX.skyHorizon, bullets: VOID_BULLETS },
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
  // THE EMPYREAN is THE UNMASKED's anchor biome, so its arena WILL start in biome 5. The biome-effect
  // gates (empyMix/nacreMix/moteMix/auroraMix/rainMix/stormSea/… — see ARENA_SILENCED_KEYS) are graphics-
  // stream fields the arena palette does NOT lerp, so silence them explicitly as the arena floods the
  // sky/water, or the Empyrean bloom + sun-kill + nacre (or, in a boss-rush from another biome, the aurora
  // curtains / storm rain / shoal shimmer) would draw OVER the authored void/heaven. Fade with the flood;
  // 0 at full void/heaven. (mix===0 returns before applyMix → byte-identical off-arena; the anchor biome
  // has most of these 0 already.)
  const _k = 1.0 - Math.min(1, mix);
  for (const key of ARENA_SILENCED_KEYS) env[key] *= _k;
}
