// LENS visibility overhaul gate. The three bullet-vs-reticle interventions (see below)
// ship as one behaviour, now controlled by the **Bullet Clarity** setting (default ON)
// instead of a fixed flag, so players can turn them off and the toggle takes effect
// without a reload. The interventions:
//   (1) imminent boss-bullet SIZE POP (the last-instant flare grows, not just heats),
//   (2) HOLLOW corner-bracket boss reticle (empty centre over the muzzle),
//   (3) THREAT-YIELD fade + telegraph-at-the-gaze chevrons.
//
// URL override for A/B on the preview: `?lens=2` forces the overhaul ON and `?lens=0`
// forces it OFF, regardless of the setting (the escape hatch for judging it). Absent →
// follow the setting. See leapfrog/lessons/2026-07-10-lens-bullet-vs-reticle-visibility.md.
import { saveData } from './save.js';

const LENS_FORCE = (() => {
  try {
    const m = /[?&]lens=([0-9]+)(?:&|$)/.exec(window.location.search);
    return m ? m[1] !== '0' : null;   // ?lens=0 → false, ?lens=<non-zero> → true, absent/malformed → null
  } catch { return null; }
})();

// Runtime query — is the overhaul active right now? Read per-frame by bossBullets.js and
// reticle.js so the setting toggles live. URL force wins over the setting when present.
export function lensClarity() {
  return LENS_FORCE !== null ? LENS_FORCE : !!saveData.settings.bulletClarity;
}
