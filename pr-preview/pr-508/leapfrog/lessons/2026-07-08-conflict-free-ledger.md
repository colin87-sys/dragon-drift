# 2026-07-08 — The append-only ledger is one-file-per-lesson now (kill the sequential number)

**Did / learned.** The `LEAPFROG.md` ledger had grown to 257 entries (L1–L256) that every
parallel chat appended to at EOF, each hand-picking the next `L###`. Two sessions working
on unrelated things (a boss vs. sound) never touched the same *code* but constantly
conflicted on the *ledger*: they'd pick the same number and append to the same line. The
root cause is a **shared, globally-coordinated write** (the next number + the EOF append) —
the one thing you must never require of independent branches. Fixed it by making each new
lesson its OWN file in `leapfrog/lessons/`, named `YYYY-MM-DD-slug.md` (naturally unique,
no coordination). The 9000-line historical file was NOT re-split (heterogeneous format:
`### L#`, newer `## Lesson —`, `## ★ DOCTRINE` blocks — a mechanical split would risk
scrambling it); it's frozen as a read-for-context archive and protected with
`.gitattributes merge=union` so any residual append can't hard-conflict.

**→ Systematize.** LAW for any append-only artifact edited by parallel agents (ledgers,
changelogs, registries, "next-N" counters): **never require a globally-coordinated key or
a shared append point.** Give each entry its own file with a self-minted unique name
(date+slug, uuid, content-hash) — independence in the data mirrors independence in the
work. When a single-file list is unavoidable, `merge=union` in `.gitattributes` is the
2-line bridge (both sides' additions survive). Sequential numbering is a coordination
smell; drop it the moment more than one writer exists. A derived combined view
(`tools/build-ledger.mjs` → git-ignored `leapfrog/LEDGER.md`) gives readability without
reintroducing a shared write.

**→ Leapfrog.** The same pattern retires the OTHER cross-chat conflict source: monolith
source files. `bossDefs.js` (one giant registry every boss chat edits) should become
per-boss def files imported into a registry — mirroring the already-split per-boss
*builders* (`bossEmbertide.js` etc.), which is exactly why builder work rarely conflicts.
Generalised: **split shared registries into one-file-per-entry + a generated index**, and
parallel chats stop colliding on everything except genuinely shared logic (`boss.js`).
