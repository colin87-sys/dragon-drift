// LENS visibility overhaul rollout flag (PR "lens"): OFF by default so the shipped
// roster is byte-identical; `?lens=2` flips ON the three bullet-vs-reticle
// visibility interventions proven together as one hero increment —
//   (1) imminent boss-bullet SIZE POP (the last-instant flare grows, not just heats),
//   (2) HOLLOW corner-bracket boss reticle (empty centre over the muzzle so a
//       spawning bullet is never hidden behind aim chrome),
//   (3) THREAT-YIELD fade + telegraph-at-the-gaze chevrons (the reticle recedes and
//       the wind-up cue appears where the eyes already are).
// The A/B escape hatch for judging the overhaul on the PR preview; see the lesson
// leapfrog/lessons/2026-07-10-lens-bullet-vs-reticle-visibility.md.
export const LENS2 = (() => {
  try { return /[?&]lens=2(&|$)/.test(window.location.search); } catch { return false; }
})();
