// deviceClass.js — the ONE coarse "is this a phone?" call, for the handful of
// PROACTIVE boot-time graphics choices no measured signal (fps/dynRes/tier) can
// make before the first frame is even drawn. Introduced for the MOBILE-GRAPHICS-DIET
// (2026-07): D1 picks the composer MSAA sample count (desktop 4 / mobile 2) and D5
// picks the water-mirror ceiling (768² / 512²) at boot, ONCE, from this.
//
// THE LAW (07-18 lesson): do NOT device-sniff for anything a measured signal can
// decide — every LIVE cut (the MSAA 2→0 dynRes rung, the mirror freeze, all the
// dynRes/tier gates) rides the resolution-floor `owned:false` handoff instead. This
// exists ONLY for the two before-any-frame choices, and it is set once and never
// re-read to drive a live change. Known cosmetic misfire: a touch laptop / 2-in-1
// classifies mobile — acceptable, the ?device= override exists.
//
// Overridable with ?device=mobile | ?device=desktop (the A/B + the CI/tiershots
// pin — headless chromium is pointer:fine + 0 touch points, so it classifies
// DESKTOP and every existing MSAA=4 assertion stays byte-identical; the mobile-2
// path is real-device-only, judged on the owner's phone / with the override).

let _cached = null;

// coarse-pointer OR touch OR UA-mobile ⇒ 'mobile'. Matches the existing
// touch/coarse idioms in ui.js / hints.js / gestureTutorial.js.
function detect() {
  try {
    const q = (typeof location !== 'undefined') && new URLSearchParams(location.search).get('device');
    if (q === 'mobile' || q === 'desktop') return q;
  } catch { /* no location (node) → fall through to desktop */ }
  const nav = (typeof navigator !== 'undefined') ? navigator : null;
  if (!nav) return 'desktop';
  const coarse = (nav.maxTouchPoints > 0) ||
    (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  const uaMobile = nav.userAgentData ? !!nav.userAgentData.mobile
    : /Mobi|Android|iPhone|iPad|iPod/i.test(nav.userAgent || '');
  return (coarse || uaMobile) ? 'mobile' : 'desktop';
}

// Cached — the class is a boot-time constant by construction (see THE LAW above);
// re-reading it must never be how a live change is driven.
export function deviceClass() {
  if (_cached == null) _cached = detect();
  return _cached;
}

export const isMobileClass = () => deviceClass() === 'mobile';

// Test seam: force the class (or clear with null) so a headless test can exercise
// both boot paths without a real touch device. NEVER called in shipped code.
export function _setDeviceClass(v) { _cached = v; }
