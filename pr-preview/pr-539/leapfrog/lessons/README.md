# `leapfrog/lessons/` — the conflict-free lessons ledger

**Add a lesson = drop a new file here.** Never edit `LEAPFROG.md` (the frozen archive)
and never hand-pick a sequential `L###` number — that's what caused the constant merge
conflicts (two parallel chats grab the same number and append to the same line).

## How to add a lesson

1. Create a NEW file named `YYYY-MM-DD-<short-slug>.md`, e.g.
   `2026-07-08-crestfall-emitter.md`. The date+slug is unique per chat, so two sessions
   can add lessons in parallel and **never conflict** (they're different files).
2. Write the lesson using the template below.
3. Commit it. That's it — no numbering, no editing a shared file, no rebuild required.

Optional: `node tools/build-ledger.mjs` assembles the archive + every fragment into
`leapfrog/LEDGER.md` for reading it all in one scroll. That file is git-ignored (derived),
so it can never cause a conflict either.

## Lesson template

```md
# <YYYY-MM-DD> — <short title>

**Did / learned.** What we changed and the concrete lesson/gotcha.

**→ Systematize.** How the PROBLEM generalises (where else does it lurk?) and how the
SOLUTION becomes a reusable system/pattern/test — so this class of bug/feature is solved
once, forever.

**→ Leapfrog.** What this unlocks — the next idea it points to, the bigger capability it
makes cheap, the thing to attempt *because* of this lesson.
```

## Why this exists

The old flow appended every lesson to the end of one 9000-line file with a sequential
number. Parallel chats (one on a boss, one on sound) that never touched the same *code*
still conflicted on the *ledger* — same next-number, same append line. One file per
lesson removes the shared write entirely: independent work stays independent.

The historical lessons (L1–L256) stay in `LEAPFROG.md` as a frozen, read-for-context
archive; cross-references to old `L###` numbers still resolve there.
