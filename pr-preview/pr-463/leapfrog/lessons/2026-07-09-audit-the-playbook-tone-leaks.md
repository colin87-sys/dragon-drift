# Audit the playbook with the critic it recommends — a doctrine can leak a TONE, not just a shape

**What we did.** After banking `PREMIUM-DRAGON-METHOD.md` (the reusable premium-dragon playbook) and
using it to produce the Phoenix sheet, spawned a high-effort Fable agent to AUDIT the method doc itself
on three axes: usability by a fresh chat, shape-agnosticism, and non-leading language. It came back
PASS-WITH-FIXES on all three with concrete, correct findings; applied the must-fixes.

**The sharpest finding: shape-agnostic is not enough — a doctrine can leak a TONE or a LAYOUT.** The
lighting doctrine read "dark opaque body + thin saturated rim" and the firewall read "dark diffuse
carries the fire." Both worked examples (Solar, Phoenix) are dark-bodied, so the doctrine had silently
become a VALUE/TONE prescription wearing a lighting-technique costume. The very next dragon — Pearl, a
*white* halo-knight — cannot comply; a Pearl agent would either ship a third dark dragon (tonal
sameness, the exact thing the distinctiveness gate forbids) or stall on the conflict. Fix: generalize
to a **relational** law — "strong VALUE CONTRAST between an opaque matte body and a saturated accent;
body dark OR light." Same class of leak elsewhere: "wings (~70% of frame)" (a wing-hero LAYOUT
prescription — Phoenix's slender-wing/tail-hero design already had to log a risk against it), and
firewall "something RISES into the frame" (Solar's top-line direction; a bottom-heavy design fills
without rising).

**The rule this yields: audit every design-guiding line for a hidden PARAMETER, not just a hidden
shape.** Tone (dark/light), layout (which region owns the frame), part-inventory (must-have wings +
crest + tail), persona (royal "regalia/coronation/crown" wording pulled Phoenix toward "empress") — any
of these can be a stealth prescription. Convert each to a relational invariant ("differ from shipped",
"contrast the body", "fill the frame wherever your mass lives") + an explicit "the persona/tone need not
be royal/dark" disarming line.

**Examples become the next answer — so make the menu SHRINK.** The doc's single named alternative
function-family ("terminal-peak monotonic rake") became Phoenix's literal wing profile; its "bottom-heavy"
inversion became her literal layout. A first-timer reaches for the one named alternative. Fix: give a
MENU of regions/families and require each shipped sheet to RETIRE the ones it used at the top of its
distinctiveness table, so the menu visibly shrinks and forces genuine novelty. Added a required round-0
"roster-neighbour survey" step (enumerate retired regions/families/tones before designing).

**Also caught (usability):** cited tool invocations that don't exist (`tricount.mjs <key>` takes no key
— it's `--ci`, whole-roster, per-form ceiling; `dragonstudio` "sil-rear/glide-dark" are output
FILENAMES, not CLI modes); the per-form (not per-dragon-sum) tri budget stated ambiguously with stale
numbers; and hard laws that lived only in the buildsheets — the LEVEL-BODY law (Phoenix even cited a
"§0.5 horizontal-readability rule" that didn't exist), the torso attach contract, the additive-drawable
budget, and links to `DRAGON-DESIGN.md`/`MODEL-CREATION.md`. A playbook distilled from ONE worked
example silently assumes the laws that example never had to state; a fresh chat has no such context.

**What it unlocks.** The method now survives its own recommended critic: relational invariants instead
of tonal/layout prescriptions, a shrinking option-menu, real runnable commands, and the level-body /
attach-contract / budget laws written down. A fresh Pearl chat can open it and build a LIGHT, distinct,
premium dragon without re-litigating doctrine the method itself created.
