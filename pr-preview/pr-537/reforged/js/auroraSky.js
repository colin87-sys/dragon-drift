import * as THREE from 'three';
import { damp } from './util.js';

// AURORA SHALLOWS sky (BIOME plan §1). An AUTHENTIC aurora-borealis drapery spliced into the
// single sky-dome draw (like N9 clouds), so it costs ZERO overdraw — it is ADDED into the dome's
// opaque gradient color, never a transparent shell (the overdraw cliff is about extra surfaces).
//
// The authenticity thesis (the ONE thing): real curtains are BOTTOM-ANCHORED — a crisp, bright,
// undulating LOWER BORDER (557.7nm oxygen green, the saturated peak) with rays streaming UP from
// it, an exponentially-fading diffuse top going faintly crimson, a thin rose skirt below, all at
// a slow crawl-and-breathe pace. Generic game auroras are vertically-symmetric rainbow ribbons
// scrolling too fast — the border term is what makes this read as northern lights.
//
// Design decisions (mirroring N9's hard-won lessons):
//  - UNIFORM BRANCH `if (uAuroraMix > 0.0001)` — never burn hash evals on 60% of the frame in the
//    other biomes; identity (byte-for-byte) when off.
//  - SEAM-FREE: all noise samples on `normalize(d.xz)` (the unit-circle point), periodic by
//    construction — fixes at the root the azimuth `atan` seam N9 still carries.
//  - PROBE-INVISIBLE (N5): NOT ported to skyProbe.js (high-frequency; the SH would alias it into
//    wobble). The world glows green via the biome PALETTE cast instead (free).
//  - Motion is TIME-driven, world-parallax ≈ 0 (a racing aurora is the classic fake tell — the
//    N9 0.02→0.002 lesson, 10× more sensitive at "100 km").

// Spliced into the sky fragment before main() (uniforms + self-contained noise).
export const AURORA_HEAD = /* glsl */`
  uniform float uAuroraMix;                 // 0 = shipped sky (biome x toggle x tier gate)
  uniform float uAurNight;                  // PREVIEW-only (?aurora=1): sink day sky→night so the
                                            // curtain reads (auroras need a dark sky). 0 in real play.
  uniform float uAurPhase, uAurBreath, uAurAct;  // JS slow phases: crawl / breathe / activity
  uniform int   uAurLayers;                 // 2 tier0 / 1 tier1+2 — the tier0-RICHNESS flag (rays, fine0, noise knots)
  uniform int   uAurBands;                  // thick-curtain layer count: 2 tier0/tier1 / 1 tier2 (loop bound)
  uniform float uAurRay;                    // 1 tier0/1 rays on / 0 tier2 (smooth quiet arc)
  uniform float uAurRayMix;                 // TURN-CALM: 1 settled → 0.35 during fast yaw (rays soften into the sheet, never vanish)
  uniform float uAurGain;                   // 1 tier0/1 / ~1.35 tier2 — brighten the curtain where bloom is OFF (tier2)
  uniform vec2  uAurFwd, uAurFwd2;          // damped TRAVEL azimuth (the "stage") + the rotated secondary axis
  uniform float uAurErupt;                  // 0 quiet (green/teal + rose) → 1 full-color eruption (rare "wow")
  uniform vec3  uAurGreen, uAurGreenHot, uAurTeal, uAurRed, uAurPink, uAurViolet, uAurFringe;
  // column 557.7nm green / hot border green / high-alt teal / 630nm red crown / pink overlap / N2+ violet base / rose skirt
  float _aHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float _aNoise(vec2 x){
    vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(_aHash(i), _aHash(i+vec2(1.0,0.0)), f.x),
               mix(_aHash(i+vec2(0.0,1.0)), _aHash(i+vec2(1.0,1.0)), f.x), f.y);
  }`;

// Spliced INTO main() after the dual-fog sink and BEFORE the clouds (clouds at ~10km correctly
// occlude the aurora at ~100km via the existing cloud `mix`). Writes `aurLum` (read later to
// attenuate the stars behind the curtain). `d`/`h`/`col`/`time` are already in scope.
export const AURORA_BODY = /* glsl */`
        float aurLum = 0.0;
        if (uAuroraMix > 0.0001) {
          vec2 az = normalize(d.xz + vec2(1e-5));   // unit-circle azimuth basis — SEAM-FREE noise
          float hy = d.y;                            // raw elevation (can be < 0 near the horizon)
          // envC = how "on stage" this azimuth is (1 dead-ahead → 0 at the flanks). Drives the base
          // drop (arc ends dive to the horizon) + the airglow concentration. az⋅uAurFwd, the travel dir.
          float envC = clamp(dot(az, uAurFwd), 0.0, 1.0);
          vec2 across = vec2(-uAurFwd.y, uAurFwd.x);  // perp of travel — the cross-stage axis (spans L↔R)
          float sAcross = dot(az, across);            // hoisted (reused by base tilt + the band field)
          // layer-0 broad fold, HOISTED (shared by base tilt + airglow + veil). The 6.4 octave is also
          // hoisted (its args never depended on L — it was a duplicated eval per layer). fine0 (12.8) is a
          // tier0-only fractal detail octave, funded by that de-duplication → net eval count unchanged.
          float fold0   = _aNoise(az * 2.3 + vec2(uAurPhase * 0.13, 0.0));
          float foldOct = _aNoise(az * 6.4 - vec2(uAurPhase * 0.11, 3.7));
          float fine0 = 0.0;
          if (uAurLayers == 2) fine0 = _aNoise(az * 12.8 + vec2(-uAurPhase * 0.19, 1.7));
          // GATE-7 band-warp field: 2D noise in (cross-stage, ELEVATION). The HEIGHT axis is the point —
          // a pure-azimuth warp shifts every ribbon identically (still parallel); a height-varying warp
          // bends each ribbon differently → S-curves, pinches, and (at extremes) forks. The true noise
          // runs on tier0 AND tier2 (tier2 has no rays, so the thick bands are ALL it has → it earns the
          // fork field, funded by its now-dead ray eval). Gate-9: phase 0.045→0.02 so forks evolve over
          // ~50s (static within a glance — the "smooth transitions" fix, not a fast-sliding cliff).
          float bandWarp = 0.0;
          if (uAurLayers == 2 || uAurRay < 0.5) bandWarp = _aNoise(vec2(sAcross * 2.2 + 5.0, hy * 3.0 - uAurPhase * 0.02)) - 0.5;
          // TIER1 gets the fork mechanism ANALYTICALLY (0 evals): the Gate-7 law only needs the warp to
          // VARY WITH ELEVATION, not to be noise. sin(hy·k) with azimuth-varying amplitude (fold0) + phase
          // (foldOct) bends each ribbon differently, and where its slope beats the base band slope it forks.
          float warpF = bandWarp;
          if (uAurLayers < 2 && uAurRay > 0.5) warpF = (fold0 - 0.5) * sin(hy * 4.5 + (foldOct - 0.5) * 5.0 + uAurPhase * 0.02);
          float rayCore = 1.0;   // main-arc ray structure, exported so the eruption color rides the LINES
          for (int L = 0; L < 2; L++) {
            if (L >= uAurBands) break;   // tier2 = 1 band; tier0/tier1 = 2 (mobile keeps the crossing diagonal)
            // rOn: rays live on the MAIN arc always, on the SECONDARY band only at tier0 (mobile's second
            // band is a ray-less thick ribbon — the "middle variation" without the ray eval).
            float rOn = uAurRay * ((L == 0 || uAurLayers == 2) ? 1.0 : 0.0);
            // DRAPERY FOLDS: a broad crawling swell + a mid octave + fine fractal detail (single
            // frequency = smooth ruler edges; the octaves give hairpin folds + ragged filament edges).
            // The tier0 secondary band gets its own noise fold; tier1's is a FREE anti-correlated remix of
            // the shared folds (reads as a deliberately CROSSING curtain), 0 evals.
            float fold;
            if (L == 0) fold = fold0;
            else if (uAurLayers == 2) fold = _aNoise(az * 3.2 + vec2(uAurPhase * 0.13 + 7.1, 0.0));
            else fold = 0.5 + (0.5 - fold0) * 0.8 + (foldOct - 0.5) * 0.5;
            fold += 0.5 * (foldOct - 0.5) + 0.25 * (fine0 - 0.5);
            // THE LOWER BORDER: drops to the horizon at the arc FLANKS (envC→0 → base 0.04, plunges
            // below the sea-line at fold minima so the ends dive behind the world), clears the gate
            // rings at centre (envC→1 → ~0.09). Undulates per fold with a real amplitude.
            // + float(L)*(0.10 + 0.09*dot(az,across)): the secondary band's border rises DIAGONALLY (higher
            // on one flank) → a rising diagonal ribbon behind the arc, not a parallel copy.
            float h0 = 0.04 + 0.05 * envC + 0.11 * (fold - 0.5) + float(L) * (0.10 + 0.09 * sAcross);
            float u, sheet;
            if (L == 0) {
              // MAIN ARC (all tiers — the layer tier1/2 keeps): spans the forward hemisphere THROUGH
              // dead centre. u parameterises rays/warp only; a smoothstep envelope (not a gaussian)
              // gates the intensity, so the arc is ~130° wide with fold-driven bright knots.
              u = sAcross * 4.0 + (fold - 0.5) * 3.5;
              u += (hy - h0) * 1.5 * (fold - 0.5);                       // height shear → 3D drape
              // VALUE MODEL: a LOW 0.06 floor (keeps the Gate-3 continuous arc) with a steep pow curve —
              // fold minima drop ~5× darker → real dark-sky gaps BETWEEN curtains, not a flat mid wash.
              sheet = smoothstep(-0.35, 0.45, dot(az, uAurFwd)) * (0.06 + 0.94 * pow(smoothstep(0.30, 0.85, fold), 1.6));
            } else {
              // SECONDARY BAND (tier0 only): a BROAD diagonal ribbon crossing the arc obliquely (was a
              // thin pillar) — the sky's second thick parent band the rays descend from.
              vec2 axis = vec2(-uAurFwd2.y, uAurFwd2.x);
              u = dot(az, axis) * 3.0 + (fold - 0.5) * 3.5;
              u += (hy - h0) * 1.5 * (fold - 0.5);
              sheet = 0.85 * exp(-u * u * 2.0);                          // ~3× broader than the old pillar
            }
            // RAYS: fine vertical lines streaming UP from the bands (they are CHILDREN of the ribbons
            // below). Corona convergence — during an eruption the spacing dilates with altitude.
            u *= 1.0 - 0.25 * uAurErupt * max(hy, 0.0);
            // Only sample the ray noise where rays actually render (main arc always; secondary only tier0).
            // tier2 + tier1's secondary band skip it → the freed eval funds tier2's fork field above.
            // Gate-9: time axis 0.7→0.35 (slower boil) so a MOTION-slewed rn no longer strobes (issue 2c).
            float rn = 0.5;
            if (uAurRay > 0.5 && (L == 0 || uAurLayers == 2)) rn = _aNoise(vec2(u * 20.0 + fold * 4.0, uAurPhase * 0.35));
            float rr = rn * rn;                                                 // rn² — soft cores, not needles
            // PREMIUM PROFILE (Gate-9): a wide linear lobe under a squared core → luminous falloff, not a bar;
            // deeper gaps (0.24) read cores brighter for free. Shimmer de-strobed: rn·50→rn·9, φ·2.6→φ·1.7.
            float rayShim = (0.24 + 0.42 * rn + 0.50 * rr) * (0.90 + 0.10 * sin(uAurPhase * 1.7 + rn * 9.0));
            float ray = mix(1.0, rayShim, rOn * uAurRayMix);
            // THE BORDER: a crisp ONSET above it, a luminous ROSE SKIRT below it — never a hard zero.
            float body  = smoothstep(h0 - 0.02, h0 + 0.01, hy);
            float skirt = exp(min(hy - h0, 0.0) * 9.0);
            float below = max(body, 0.30 * skirt);
            // STAGGERED RAY HEIGHTS: bright rays climb higher, dim ones die sooner → individual lines.
            float tall = exp(-max(hy - h0, 0.0) * (5.5 - 2.0 * uAurAct));
            float rayTall = exp(-max(hy - h0, 0.0) * (2.0 + 6.5 * (1.0 - rn * rn)));
            tall = mix(tall, rayTall, 0.65 * rOn * uAurRayMix);
            float breath = 0.8 + 0.2 * uAurBreath;
            float I = sheet * ray * below * tall * breath;
            // IRREGULAR THICK RIBBONS: the bands the rays hang FROM, as level-sets of a WARPED field (NOT a
            // straight sawtooth — the owner: "too parallel"). Non-uniform SPACING (fold0 fans the period),
            // azimuth-varying TILT (foldOct curves each band along its length → S-curves), a height-varying
            // WARP (bandWarp) that bends ribbons apart and, at extremes, FORKS/merges them, and along-band
            // KNOTS (bn) that let a ribbon fade out mid-sky. Each ribbon keeps the crisp-bottom/soft-top edge.
            float bt = hy - h0;
            float warpL = warpF * ((L == 0) ? 1.0 : -0.8);          // opposite-sign per layer → bands cross at varied angles
            float bp = bt * (3.4 + 1.6 * (fold0 - 0.5))             // NON-UNIFORM spacing (period fans/crowds)
                     - (0.25 + 0.65 * foldOct) * sAcross            // AZIMUTH-VARYING tilt → arcs, not parallel
                     - 0.8 * (fold - 0.5)                           // the Gate-6 drape
                     + 1.0 * warpL                                  // THE PARALLEL-BREAKER (folds → forks/merges)
                     + 0.37 * float(L);                             // decorrelate the two layers' band phases
            float fp = fract(bp);
            // KNOTS (bn): tier1/2 now vary PER-BAND and ALONG-band from bp itself (a smooth sin, continuous —
            // decorrelates adjacent ribbons at period ≈ 0.74, slides the knot along each band via foldOct), so
            // mobile bands no longer share one azimuth-locked knot. Floor 0.25 → a faded band never hits zero
            // (feeds the smooth-transition fix). tier0 keeps the true along-band noise (phase 0.04→0.02, Gate-9).
            float bn = 0.25 + 0.75 * (0.5 + 0.5 * sin(bp * 2.5 + foldOct * 7.0 + fold0 * 3.0));
            if (uAurLayers == 2 && L == 0) bn = _aNoise(vec2(sAcross * 3.0 - uAurPhase * 0.02, bp * 0.8 + 11.0)); // knots ALONG the band
            // SEAM-FEATHERED profile (Gate-9): the old fract tail ended at exp(-k) (0.05–0.25) then HARD-dropped
            // to 0 at the period wrap — a moving cliff that popped as bp drifted (the #1 "erratic" source). The
            // smoothstep(1.0,0.82,fp) fades the tail to zero BEFORE the seam, both sides 0, crisp bottom kept.
            float bprof = smoothstep(0.0, 0.10, fp) * smoothstep(1.0, 0.82, fp) * exp(-fp * (2.9 - 1.5 * bn));
            float bands = 0.30 + 0.95 * bprof * (0.30 + 1.05 * bn * bn);             // bn² → a band FADES OUT along its length
            I *= mix(1.0, bands, smoothstep(0.04, 0.12, bt));                  // protect the hot border (bt < 0.04)
            // Export the MAIN-ARC structure → the eruption color rides the LINES + bands, not a flat wash.
            if (L == 0) rayCore = clamp((ray - 0.35) * 1.3, 0.0, 1.0) * tall;
            // THE HOT-LINE: a real border is 2–3× brighter than the diffuse column above it. Gate-9 gives it
            // TWO scales — a tight 28-decay core (the physics thesis) under a soft 8-decay FEATHER (a bloom
            // impression rising off the hot line, no post-FX) → the border reads luminous, not clinical.
            float hot = exp(-max(hy - h0, 0.0) * 28.0);
            I *= 1.0 + (1.8 * hot + 0.45 * exp(-max(hy - h0, 0.0) * 8.0)) * below;
            // THE ALTITUDE PHYSICS RAMP — FULL STRUCTURE (Gate-8): quiet = green + teal (unchanged). An
            // eruption adds THREE hybrid bands — violet-blue N2+ base, PINK overlap, 630nm crimson crown —
            // each a MIX (hue authority, saturates at erupt=1) + a small ADDITIVE (luminance parity so no
            // single hue monopolises — the old all-additive red did), windowed in v with soft OVERLAPS so
            // bottom→top reads violet→green→pink→crimson blended, not two colors. (per-ray v-stagger kept.)
            vec3 aCol = mix(uAurFringe, uAurGreen, smoothstep(h0 - 0.02, h0 + 0.005, hy));
            float v = clamp((hy - h0) * (2.6 - 1.0 * uAurAct) + (rn - 0.5) * 0.3 * rOn * uAurRayMix, 0.0, 1.0);
            aCol = mix(aCol, uAurTeal, 0.55 * smoothstep(0.15, 0.55, v));      // altitude cooling (always) — UNCHANGED
            float em = min(uAurErupt, 1.0);     // hue weight (mix) — saturates so hues never overshoot
            float ea = uAurErupt;               // glow weight (additive) — rides the dial past 1.0
            // VIOLET-BLUE BASE: the low column ABOVE the border (v < ~0.34), plus the old sub-border skirt.
            float baseB = max((1.0 - smoothstep(0.12, 0.34, v)) * body, 1.0 - body);
            aCol = mix(aCol, uAurViolet, 0.55 * baseB * em);
            aCol += uAurViolet * baseB * 0.18 * ea;
            // PINK OVERLAP: a PLATEAU band where green hands off to red (the old crown·(1-crown) capped at 0.25).
            float pinkB = smoothstep(0.30, 0.50, v) * (1.0 - smoothstep(0.55, 0.75, v));
            aCol = mix(aCol, uAurPink, 0.85 * pinkB * em);
            aCol += uAurPink * pinkB * 0.16 * ea;
            // CRIMSON CROWN: hue by MIX now (reads crimson, not just "the brightest thing") + a small glow.
            float crown = smoothstep(0.48, 0.92, v);
            aCol = mix(aCol, uAurRed, 0.75 * crown * em);
            aCol += uAurRed * crown * crown * 0.20 * ea;
            aCol = mix(aCol, uAurGreenHot, hot * below);                        // green border stays last (Gate-2)
            I *= 1.0 + 0.25 * crown * uAurErupt;                               // ray-top flare — unchanged
            // SPLIT GAIN: the diffuse column is capped LOW (0.55, never blooms) while the thin hot border
            // + crown reach 1.0 and cross the bloom threshold — the glow lives only in the concentrated cores.
            // Gate-9: the THICKEST along-band knots also cross the threshold → jewel points bloom along every
            // ribbon (only bprof·bn² ≳ 0.28 lifts), so the thick lines read premium, not flat-topped.
            float knot = clamp(bprof * bn * bn * 1.6 - 0.45, 0.0, 0.8);
            col += aCol * I * uAuroraMix * uAurGain * (0.55 + 0.45 * max(hot * below, knot));
            // TRANSLUCENCY: stars are dimmed by local CORE brightness, not total column — optically-thin
            // gas, stars burn through the faint column + only vanish at the border/knots (the env.js splice
            // reads aurLum unchanged; only its MEANING changes here).
            aurLum += I * (0.25 + 0.75 * hot * below);
          }
          // BACK VEIL: a third, very faint, tall, ray-less curtain (reuses fold0 — free) → layered depth.
          // Contributes ~0 to aurLum so stars burn straight through it (doubles as the translucency showcase).
          float veil = smoothstep(0.55, 0.9, fold0) * exp(-max(hy - 0.20, 0.0) * 3.0)
                     * smoothstep(0.02, 0.25, hy) * (0.35 + 0.65 * envC);
          col += mix(uAurTeal, uAurRed, 0.3 * uAurErupt) * veil * 0.05 * uAuroraMix;
          // THE HORIZON AIRGLOW: the perspective-compressed distant oval the curtains RISE OUT OF.
          // Brightest AT the sea-line (abs(hy) → the last sliver above the silhouette is hottest, and
          // it meets its own mirror reflection at the seam), on-stage (envC), fold-broken. No new fetch.
          float hg = exp(-abs(hy) * 7.0) * (0.55 + 0.45 * fold0) * (0.35 + 0.65 * envC);
          // hue DRIFTS green↔rose per fold (a flat-green horizon band, doubled by the mirror sea, was the
          // monochrome-frame cause); lower gain so the doubled seam doesn't blow out; barely dims stars.
          // Gate-9: the sea-line airglow (+ its own mirror reflection) INHALES with the breath uniform —
          // sky and sea swell + dim together on an 8–20s cycle (mean unchanged: 0.85+0.30·0.5 = 1.0).
          col += mix(uAurGreen, uAurFringe, 0.5 - 0.5 * fold0) * hg * (0.05 + 0.04 * uAurAct) * (0.85 + 0.30 * uAurBreath) * uAurGain * uAuroraMix;
          aurLum += hg * 0.1;
          // ERUPTION COLOR TINT (rare "wow", with RESERVATION): a strong display breathes color into the
          // upper sky — but it RIDES THE RAYS (× rayCore) so it reads as colored LINES over dark starry sky,
          // NOT a solid magenta ceiling (the owner: "beauty in reservation"). Between the rays it's a whisper;
          // the steep decay stops it at mid-sky; stars burn through (the aurLum contribution is tiny).
          if (uAurErupt > 0.001) {
            float ebase  = exp(-abs(hy - 0.05) * 11.0) * envC * (0.35 + 0.65 * fold0);
            float ecrown = smoothstep(0.10, 0.30, hy) * exp(-max(hy - 0.32, 0.0) * 4.5) * envC * (0.5 + 0.5 * fold0);
            float ecR = ecrown * (0.10 + 0.90 * rayCore);   // the crown tint lives almost entirely ON the ray cores
            col += uAurViolet * ebase * uAurErupt * 0.04 * uAuroraMix;                                  // violet under-glow (cut 0.10→0.04)
            col += mix(uAurPink, uAurRed, smoothstep(0.20, 0.55, hy)) * ecR * uAurErupt * 0.08 * uAuroraMix; // ray-carried crown (cut 0.20→0.08)
            aurLum += (ebase + ecR) * uAurErupt * 0.03;                                                 // stars survive the peak (0.05→0.03)
          }
        }`;

export const auroraUniforms = {
  uAuroraMix: { value: 0 },
  uAurNight:  { value: 0 },
  uAurPhase:  { value: 0 },
  uAurBreath: { value: 0.5 },
  uAurAct:    { value: 0.5 },
  uAurLayers: { value: 2 },
  uAurBands:  { value: 2 },                          // thick-curtain layer count (2 tier0/tier1, 1 tier2)
  uAurRay:    { value: 1 },
  uAurRayMix: { value: 1 },                          // turn-calm envelope (1 settled → 0.35 during fast yaw)
  uAurGain:   { value: 1 },                          // tier2 curtain brightener (bloom is off at tier2)
  uAurFwd:    { value: new THREE.Vector2(0, -1) },      // travel azimuth (forward = -Z); damped in JS
  uAurFwd2:   { value: new THREE.Vector2(0.64, -0.77) },// secondary axis ≈ 40° off forward
  uAurErupt:  { value: 0 },                          // eruption envelope (driven in JS from activity)
  uAurGreen:  { value: new THREE.Color(0x54ff86) },  // 557.7 nm atomic-oxygen green — the diffuse column
  uAurGreenHot: { value: new THREE.Color(0x86ff5c) },// hotter yellow-green for the bright border line
  uAurTeal:   { value: new THREE.Color(0x3ce6b8) },  // high-altitude cooling — quiet-mode second hue (always on)
  uAurRed:    { value: new THREE.Color(0xff4652) },  // 630 nm oxygen RED crown — brighter than green (additive)
  uAurPink:   { value: new THREE.Color(0xff7fae) },  // green×red overlap band — hotter/magenta so it reads at 50–85% mix over teal-green
  uAurViolet: { value: new THREE.Color(0x7a6bff) },  // N2+ violet-blue base — bluer/more saturated so it survives the green underneath
  uAurFringe: { value: new THREE.Color(0xd06a8a) },  // N2+ rose skirt — DESATURATED, not danger-magenta
};

let enabled = true;   // the biome channel gates it (env.auroraMix is 0 until a biome declares aurora)
let forced = false;   // ?aurora=1 — the PR-1 hero read, before the biome exists
let tier = 0;
let actOverride = null;   // ?auract=<0..1> debug: pin activity/eruption (for the quiet-vs-eruption montage)
export function setAuroraActOverride(v) { actOverride = (v == null || Number.isNaN(v)) ? null : v; }
let eruptOverride = null; // debug: pin uAurErupt DIRECTLY (bypasses the 0.45 peak cap) to compare eruption strengths
export function setAuroraEruptOverride(v) { eruptOverride = (v == null || Number.isNaN(v)) ? null : v; }
// FLOW COUPLING: main.js feeds the flow chain's slipMix × auroraMix here each frame; it raises the aurora
// ACTIVITY floor so the sky erupts as the chain climbs. 0 everywhere outside the aurora carve → byte-inert.
let flowExcite = 0, flowExciteTarget = 0;
export function setAuroraFlowExcite(k) { flowExciteTarget = Math.max(0, Math.min(1, k || 0)); }
export function auroraEnabled() { return enabled; }
export function auroraForced() { return forced; }   // ?aurora=1 preview — gate the day-biome sun/god-rays off
export function auroraMix() { return auroraUniforms.uAuroraMix.value; }   // live curtain strength (real biome god-ray gate)
// Live envelopes for the ground-glow pulse + the tier2 water aurora sheen (no per-frame allocs).
export function auroraPulse() {
  return { mix: auroraUniforms.uAuroraMix.value, breath: auroraUniforms.uAurBreath.value,
           act: auroraUniforms.uAurAct.value, erupt: auroraUniforms.uAurErupt.value };
}
export function setAuroraEnabled(on) { enabled = !!on; if (!enabled) auroraUniforms.uAuroraMix.value = 0; }
export function setAuroraForced(on) { forced = !!on; }
function applyTierStructure(t) {
  auroraUniforms.uAurLayers.value = t === 0 ? 2 : 1;    // tier0-RICHNESS flag (rays, fine0, noise knots, tier0 2nd-band fold)
  auroraUniforms.uAurBands.value = t >= 2 ? 1 : 2;      // tier0/tier1 keep the crossing diagonal band; tier2 = single arc
  auroraUniforms.uAurRay.value = t >= 2 ? 0 : 1;        // tier2 = a smooth quiet arc (still an authentic form)
  auroraUniforms.uAurGain.value = t >= 2 ? 1.35 : 1.0;  // tier2 has NO bloom (postfx off) → brighten the raw curtain
}
export function setAuroraQuality(t) {
  const prev = tier;
  tier = t;
  if (prev === t) { applyTierStructure(t); return; }
  // A runtime tier flip must NOT hard-cut the curtain. The old `qualFade = 0` dropped uAuroraMix to 0 in a
  // SINGLE frame, then recovered over ~1s — a cut, then a fade-in (the owner's "no lights, then it pops
  // in"). Instead LATCH a fade: while the curtain is visible, breathe it DOWN (qualTarget 0), apply the
  // structure change once it's invisible, then breathe it back UP — driven in applyAurora. Off-screen
  // (no aurora) the structure applies immediately, no fade needed.
  if (auroraUniforms.uAuroraMix.value > 0.0001) { pendingTier = t; qualTarget = 0; }
  else applyTierStructure(t);
}

// Damped travel azimuth (module-local so it survives frames). Starts pointing forward (-Z).
const _fwd = new THREE.Vector3();
let fwdX = 0, fwdZ = -1;
let _aurPhase = 0;              // JS-accumulated crawl phase (activity-keyed rate → stately when quiet)
let pwx = 0, pwz = -1, calm = 1;  // previous stage azimuth + turn-calm envelope (rays soften during yaw)
let qualFade = 1;              // tier-flip cover: BREATHES down→up on a quality change (never a hard cut)
let qualTarget = 1;           // fade target: 0 while dipping for a tier restructure, else 1
let pendingTier = 0;          // the tier whose curtain structure applies once qualFade has faded down
let eruptEnv = 0;              // damped eruption envelope → the color SWELLS and FADES over ~3-4s, never flashes

// Per-frame write from the lerped biome env. Off / no aurora in this biome → mix 0 (the uniform
// branch skips the whole block; the sky is the shipped gradient). Phases wrapped in JS so they
// never hit float32 precision on endless runs (the uCloudDrift lesson).
export function applyAurora(env, playerDist, time, camera, dt) {
  const dtc = dt || 0.016;
  const mix = forced ? 1 : (enabled ? (env.auroraMix || 0) : 0);
  // qualFade BREATHES between 1 and qualTarget (identity when no flip — damp(1,1)=1 → byte-identical in
  // non-aurora biomes). On a tier flip it dips to 0 (~0.4s), the deferred structure applies while it's
  // invisible, then it breathes back up — so a tier change is a soft breath, never a one-frame cut.
  qualFade = damp(qualFade, qualTarget, 6.0, dtc);
  if (qualTarget < 0.5 && qualFade < 0.05) { applyTierStructure(pendingTier); qualTarget = 1; }
  flowExcite = damp(flowExcite, flowExciteTarget, 2.0, dtc);   // eased so the eruption swells/settles with the carve
  auroraUniforms.uAuroraMix.value = mix * qualFade;
  // PREVIEW ONLY: `?aurora=1` over a day biome would wash the curtain out (auroras need a dark sky).
  // Force a night wash so the preview reads as the shipping NIGHT biome will. The real biome supplies
  // its own dark palette, so this stays 0 in all actual gameplay → byte-identical.
  auroraUniforms.uAurNight.value = forced ? 1 : 0;
  if (mix < 0.0001) return;
  // breathing: two incommensurate sines → never reads as a loop
  auroraUniforms.uAurBreath.value = 0.5 + 0.5 * (0.55 * Math.sin(time * 0.9) + 0.45 * Math.sin(time * 0.27 + 1.3));
  // ACTIVITY + ERUPTION: two incommensurate sines drift the activity; above 0.72 an eruption blooms
  // (smoothstep-shaped) — full-color violet/pink/red for ~20–40s every few minutes at irregular intervals,
  // so quiet green/teal stretches make the rare eruption feel EARNED (the "wow"). `?auract=` overrides both.
  const actRaw = 0.5 + 0.5 * (0.62 * Math.sin(time * 0.05) + 0.38 * Math.sin(time * 0.0177 + 2.4));
  // FLOW COUPLING: a SUSTAINED flow chain HOLDS the eruption. (Owner: it flashed then vanished while the
  // chain was held — because slipMix at a mid chain ≈ 0.6 gave 0.6×0.9 = 0.54, BELOW the 0.72 eruption
  // threshold, so only a near-MAX chain erupted; what flashed was the rare natural drift, not the carve.)
  // Remap so the eruption ONSETS at a modest chain (~5) and drives near-full by a strong one, and HOLDS as
  // long as the chain does. Capped ≤ 0.96 (the eruption smoothstep needs act ≤ 1). flowExcite < 0.02 (off
  // the carve) → no floor → act = actRaw → byte-inert. ?auract still wins.
  const flowAct = flowExcite < 0.02 ? 0.0 : Math.min(0.96, 0.63 + flowExcite * 0.35);
  const act = actOverride != null ? actOverride : Math.max(actRaw, flowAct);
  auroraUniforms.uAurAct.value = act;
  // ACTIVITY-KEYED CRAWL (Gate-9 dreaminess): accumulate phase at a variable rate instead of `time%4096`
  // — quiet stretches drift stately (~0.8×), an eruption visibly quickens (~1.25×), so motion tells the
  // activity story. Uses RAW dt (0 when the montage freezes via timeScale=0 → phase holds, frozen shots
  // stay pinned); wraps at 4096 exactly like the old `%4096` (the uCloudDrift float32-precision lesson).
  _aurPhase = (_aurPhase + (dt || 0) * (0.7 + 0.6 * act)) % 4096;
  auroraUniforms.uAurPhase.value = _aurPhase;
  const e = Math.max(0, Math.min(1, (act - 0.72) / 0.28));   // clamp: the flow floor can now reach act 0.96
  // Peak 1.4 (owner pick) — a natural eruption shows the FULL altitude structure (violet→green→pink→
  // crimson, Gate-8); restraint comes from AREA + rarity (color rides the bands/rays, majority dark
  // between, ~30s every few min), NOT from deleting the hues. The single strength dial is this 1.4.
  const eruptTarget = 1.4 * (e * e * (3.0 - 2.0 * e));
  // EASE the eruption IN and OUT (owner: "it feels like a flash — should transition in and out"): damp the
  // envelope so the color SWELLS and FADES over ~3-4s no matter how fast `act` crossed the threshold — a
  // flow-carve spike no longer pops the color on/off, and the carve ending leaves a gentle afterglow. Raw
  // dt so a frozen montage holds (dt=0 → damp is a no-op); the override below still pins it for the sweep.
  eruptEnv = damp(eruptEnv, eruptTarget, 0.7, dt || 0);
  auroraUniforms.uAurErupt.value = eruptEnv;
  if (eruptOverride != null) auroraUniforms.uAurErupt.value = eruptOverride;  // debug: pin the eruption strength
  // COMPOSITION — the arc holds CENTRE-STAGE. Key it to travel, HEAVILY damped (λ=0.35 → recentres
  // over ~6–8s): during a fast weave/yaw the aurora stays world-anchored and counter-slides across
  // frame (reads as a thing at infinity), but it can never be lost off-frame for long.
  if (camera) {
    camera.getWorldDirection(_fwd);
    fwdX = damp(fwdX, _fwd.x, 0.35, dtc);
    fwdZ = damp(fwdZ, _fwd.z, 0.35, dtc);
  }
  // a slow world wander (±11° over ~6 min) so it never feels servo-locked to the crosshair
  const a = 0.20 * Math.sin(time * 0.017), ca = Math.cos(a), sa = Math.sin(a);
  let wx = fwdX * ca - fwdZ * sa, wz = fwdX * sa + fwdZ * ca;
  const inv = 1 / (Math.hypot(wx, wz) || 1); wx *= inv; wz *= inv;
  // TURN-CALM: measure the stage's angular slew (rad/s); while it's turning fast the ray field would slew
  // through many noise cells and STROBE (the "erratic while flying" tell). Ease the rays toward the smooth
  // sheet (uAurRayMix→0.35, a FLOOR — they soften/brighten into the band, never vanish), ease back when
  // settled. The bands themselves are unaffected, so the curtain structure holds; only the fine rays calm.
  const slew = Math.abs(Math.atan2(wx * pwz - wz * pwx, wx * pwx + wz * pwz)) / dtc;
  pwx = wx; pwz = wz;
  calm = damp(calm, slew > 0.15 ? 0.35 : 1.0, 1.6, dtc);
  auroraUniforms.uAurRayMix.value = calm;
  auroraUniforms.uAurFwd.value.set(wx, wz);
  // secondary BAND axis: forward rotated ~52°±20°, drifting — crosses the arc more obliquely (a diagonal band)
  const b = 0.90 + 0.35 * Math.sin(time * 0.021), cb = Math.cos(b), sb = Math.sin(b);
  auroraUniforms.uAurFwd2.value.set(wx * cb - wz * sb, wx * sb + wz * cb);
}
