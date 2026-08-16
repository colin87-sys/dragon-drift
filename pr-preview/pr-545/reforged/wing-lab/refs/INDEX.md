# refs/ — the shared image set

Every agent in this lab may `Read` any file here. If you add one, add a row.
An image with no row is invisible to the rest of the lab.

⚠ **External image download is blocked in this environment** (egress policy returns 403
on CONNECT). Do not spend turns on curl/wget. Images here come from three places only:
**in-engine renders**, **procedural plates we draw from sourced numbers**, and
**generated moodboards** (clearly labelled as mood, never as anatomical evidence).

| File | What it is | Source | Evidence OF |
|---|---|---|---|
| `plate-camber.png` | Four chord sections at the sourced camber values, NACA mean line so the max sits exactly at the stated 40% chord | `node tools/wingplate.mjs camber`, values `[S]` from `DRAGON-ANATOMY-REFERENCE.md` §4.5 | How deep the membrane sag must be, and where along the chord it belongs |

## Regenerating

```
node tools/wingplate.mjs            # all plates
node tools/wingplate.mjs camber     # one
```

Plates are driven entirely by `refs/wing-spec.json`. To add a number to a plate, add it
to the spec — the spec carries only values the research actually closed, and sections
awaiting research are **absent rather than guessed**.
