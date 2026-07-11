# A rear-chase signature must be judged in the REAL game cam — and must not occlude the playfield

**The saga.** The Dawnfire Empress's signature — a big bottom-heavy "pyre-train" — was rebuilt FOUR
times (perpendicular frontal fan → aft-raked cone → gathered pleated drape → and only then abandoned).
Each rebuild fixed the *previous* complaint and passed an aesthetic gate at 4.0–4.67. Each one still
failed the moment the owner actually flew it. The gate kept missing it because **every assessment judged
the isolated model in a studio void** (`dragonstudio` — a clean turntable, camera pointed AT the
dragon), while the game's chase camera looks **PAST** the dragon at the oncoming course.

**The actual bug (finally captured with `tools/framecap.mjs`, a full-frame grab WITH the course in
view).** The chase cam sits behind + above, looking forward-down. The gameplay information — water,
obstacle bases, the next ring's approach line — lives in the **centre and lower-centre** of the frame.
The upper frame is empty sky. A big **bottom-heavy** glory parks a mass in the lower-centre, directly
over the playfield; and because the dragon is "a coal, not a torch," that mass is **dark**, so it reads
not as a creature but as **a hole punched in the view.** Perpendicular fan, raked cone, pleated
drape — all three were the same frame-blocking blob in a different costume. The four properties that
actually mattered (footprint, opacity, darkness, lower-centre position) never changed.

**Why the studio gate is blind to this.** A turntable camera pointed at the model shows the dragon in a
void, framed to fit — a big trailing/hanging appendage just looks impressive. The game camera is at a
FIXED distance and looks along the flight axis at the course; the same appendage now sits between the
player and the information they need. **A "does it look epic?" still-gate cannot judge occlusion,
scale-in-frame, or whether you can still see where you're going. Those require the real gameplay camera
with the real scene.**

**The fix — VISIBILITY FIRST (The Risen Dawn).** Solar was the proof it's possible: its glory is
compact and held UP near the head in the empty sky, so it stays a slim silhouette and the playfield is
clear. So the Empress "rises": the fan grammar flips UP into a short **sunrise mantle** over the
shoulders (sky zone), the monument Heart shrinks to a nape **brooch**, and the trailing element becomes
a few **discrete bright ember-sparks** on a thin whip (luminous points, near-zero footprint) instead of
an opaque sheet. The signature now lives where there's no course info (up / tight-to-body / as sparse
bright points), and the lower-centre stays clear.

**Reusable rules.**
- **Judge any gameplay-facing model in the ACTUAL game camera with the scene present**, before calling
  it done. Build the capture harness if it doesn't exist (`framecap.mjs` = full frame + course, vs the
  studio turntable). A beautiful turntable render is necessary, not sufficient.
- **In a rear-chase / behind-view game, the playfield occupies the centre + lower-centre; the upper
  frame is free sky.** Signature glory is SAFE up-top, tight-to-body, or as thin/sparse/luminous points;
  it is FATAL when it is large + opaque + (worst) dark, sitting low or trailing toward the lens.
- **"Bottom-heavy epic glory" fights a rear-chase camera.** Don't anchor the wow to sheer size in the
  frame — anchor it to material, light, jewelry, and animation on a COMPACT silhouette. Size that eats
  the frame eats the game.
- **A dark mass is worse than a bright one in the play zone** — dark reads as a void, luminous reads as
  an effect. If something must live near the playfield, make it bright and sparse, never dark and solid.
- **Encode the constraint as a mechanical assert so it can never regress:** a Lower-Frame Clearance law
  (no wide/large geometry in the { below-spine, aft-of-hip } corridor) caught what four aesthetic passes
  missed. When a failure recurs across redesigns, the missing guardrail is usually a *measurable* one.
- **When you've rebuilt the same element 3+ times and it keeps failing the same way, stop reshaping it
  and re-examine the PREMISE.** The train wasn't the wrong shape; a big bottom train was the wrong idea.
