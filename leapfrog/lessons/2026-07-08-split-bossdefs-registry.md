# 2026-07-08 — Split the shared bossDefs registry into one-file-per-boss (verify by deep-equality)

**Did / learned.** `bossDefs.js` was a 1675-line monolith holding all 15 boss defs in one
`BOSSES` object — the second big cross-chat conflict source (every boss chat edited the
same file even for unrelated bosses). Split each def into `js/bossDefs/<boss>.js`
(`export const <boss> = {…}`); `bossDefs.js` is now a 166-line INDEX that imports them,
re-assembles `export const BOSSES`, and keeps `BOSS_ORDER` + the ladder helpers — so the
export surface (`BOSSES`, `BOSS_ORDER`, `bossDefForIndex`, `ladderPickDef`,
`ladderTighten`) is byte-for-byte unchanged and all 7 consumers need zero edits. Two safety
moves made this a non-event: (1) the split was done by a SCRIPT that extracts each def by
its consistent 2-space-indent `  <key>: {` … `  },` boundary (preserving hex colours,
comments, formatting — a JSON round-trip would have lost all three), and (2) it was
verified by **deep-equality**: snapshot `JSON.stringify({BOSSES,BOSS_ORDER})` before, and
assert the reassembled registry is IDENTICAL after. It was. Bonus discipline: `lockdps`
failed after the split, but the same assertion fails on pristine `HEAD` — proved it
pre-existing by running the test against `git show HEAD:…` rather than assuming.

**→ Systematize.** LAW for de-conflicting a shared registry: **one file per entry + a thin
index that re-exports the SAME surface**, so consumers are untouched and only the index (a
rare, 2-line edit) is shared. Do the extraction with a script keyed on the file's own
consistent formatting, never by hand (15 error-prone copies) and never via a data
round-trip (loses source fidelity). ALWAYS gate a "pure reorganisation" refactor on a
serialised **before==after** equality check — it turns "I think it's identical" into proof.
And when a test fails right after a refactor, confirm-or-deny pre-existence against `HEAD`
before spending a minute debugging your own change.

**→ Leapfrog.** The two structural conflict sources are now both retired the same way:
the ledger (one file per lesson) and the boss registry (one file per boss). The remaining
shared file is `boss.js` — the controller — which is genuinely shared LOGIC, not a
registry, so it can't be split by this pattern; it stays the coordination point. The next
lever there isn't file-splitting but keeping controller changes small + rebased. Also: the
same registry-split recipe (script-extract by formatting + deep-equality gate) applies to
any other monolith list that shows up (biome defs, cosmetic tables, the claim registry).
