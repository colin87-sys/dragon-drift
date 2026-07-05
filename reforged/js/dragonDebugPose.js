// setFlapDebugPose — a DEBUG PIN for the wing rigs (§6.6).
//
// Transient flight poses (a hard bank, a folded dive) cannot be captured by
// "waiting" for the idle loop to drift into them (L137 law): the studio tool
// needs to PIN a named pose so round K and round K+1 are pixel-comparable. This
// poses the wing handles the model builder publishes — direct pivot/wrist groups
// (the blade-feather + membrane path) and skinned rigs (wingRigL/R) alike — into
// one of three canonical states:
//
//   'glide' — the neutral cruise silhouette (full span)
//   'fold'  — a folded dive: the wrist flexes hard + the shoulder tucks, so the
//             span visibly CONTRACTS (§3 fold clause; the §7 fold assert reads it)
//   'bank'  — a hard right bank: inside (right) wing tucks, outside (left) opens
//
// Pure transform writes, no allocation. Additive + nullable: a rig missing a
// handle is skipped, so any wing builder can be posed by whatever it publishes.
export function setFlapDebugPose(parts, pose = 'glide') {
  if (!parts) return;
  const { wingPivotL, wingPivotR, wingTipL, wingTipR, wingRigL, wingRigR, wingBladePivotsL, wingBladePivotsR } = parts;

  // Per-side direct-drive poser. s = +1 right / −1 left; "up" (span-contracting
  // lift) is rotation.z = s*θ for a wing that extends toward s*+x.
  const poseSide = (pivot, tip, s) => {
    if (!pivot) return;
    if (pose === 'glide') {
      pivot.rotation.set(0.14, -s * 0.18, 0);
      if (tip) tip.rotation.set(-0.12, 0, 0);
    } else if (pose === 'fold') {
      // Shoulder tucks up + sweeps back; wrist flexes hard up so the outer comb swings
      // up and the span collapses. The blades are nested parallel (below) so this reads
      // as a tight folded stack, not a fan of upright sails (r2 dir 6).
      pivot.rotation.set(0.05, -s * 0.5, s * 0.5);
      if (tip) tip.rotation.set(0.0, -s * 0.7, s * 1.1);
    } else if (pose === 'bank') {
      // Hard RIGHT bank: right (inside) wing tucks + dips, left (outside) opens.
      const inside = s > 0;
      pivot.rotation.set(0.12, -s * 0.18, s * (inside ? 0.5 : -0.32));
      if (tip) tip.rotation.set(-0.1, 0, s * (inside ? 0.7 : -0.2));
    }
  };

  if (wingRigR || wingRigL) {
    // Skinned rig: pose shoulder/elbow/wrist bones directly (mirrors the direct path).
    const poseRig = (rig, s) => {
      if (!rig) return;
      const { shoulder, elbow, wrist } = rig;
      if (pose === 'glide') {
        shoulder && shoulder.rotation.set(0.14, -s * 0.18, 0);
        elbow && elbow.rotation.set(0, 0, 0);
        wrist && wrist.rotation.set(-0.12, 0, 0);
      } else if (pose === 'fold') {
        shoulder && shoulder.rotation.set(0.05, -s * 0.55, s * 0.5);
        elbow && elbow.rotation.set(0, 0, -s * 0.5);
        wrist && wrist.rotation.set(0, -s * 0.6, s * 0.9);
      } else if (pose === 'bank') {
        const inside = s > 0;
        shoulder && shoulder.rotation.set(0.12, -s * 0.18, s * (inside ? 0.5 : -0.32));
        wrist && wrist.rotation.set(-0.1, 0, s * (inside ? 0.6 : -0.2));
      }
    };
    poseRig(wingRigR, 1); poseRig(wingRigL, -1);
  } else {
    poseSide(wingPivotR, wingTipR, 1);
    poseSide(wingPivotL, wingTipL, -1);
  }

  // Per-blade lag pivots. In the FOLD the blades NEST toward the spar line in a
  // stacked furl (dir 13) — each blade sweeps back + rakes in so none crosses another
  // element's silhouette; in glide/bank they settle to a small even rest.
  for (const arr of [wingBladePivotsR, wingBladePivotsL]) {
    if (!arr) continue;
    const n = Math.max(1, arr.length - 1);
    for (const b of arr) {
      const t = b.pivot; if (!t) continue;
      const fr = b.idx / n;
      if (pose === 'fold') {
        // Nest (dir 6): CANCEL each blade's rest RAKE (lag.y = −restY) so all blades
        // align PARALLEL — ≤25° splay, high overlap. Dihedral is kept (lag.z small) so
        // the parallel stack folds up tightly with the wrist instead of fanning.
        t.rotation.set(0, -(b.restY ?? 0) + b.side * 0.06 * fr, b.side * 0.02 * fr);
      } else {
        t.rotation.set(0, 0, b.side * (0.02 + 0.05 * fr));
      }
    }
  }
}
