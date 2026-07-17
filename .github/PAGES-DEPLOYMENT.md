# GitHub Pages deployment — required setting & the stale-site failure mode

**TL;DR — one required repo setting:**
**Settings → Pages → Build and deployment → Source = "GitHub Actions"** (not "Deploy from a branch").
This cannot be set from a workflow file. If it is wrong, merges to `master` stop
going live even though every workflow looks green.

## How the site is supposed to deploy

The live site is published by **one** workflow: [`deploy-pages.yml`](workflows/deploy-pages.yml).
It assembles the whole site into a single artifact and deploys it via
`actions/deploy-pages` to the `github-pages` environment:

- **production** — checked out fresh from `master` (the repo root is the site)
- **PR previews** — the `pr-preview/` tree that [`pr-preview.yml`](workflows/pr-preview.yml)
  maintains on the `gh-pages` branch, overlaid into the artifact.

`gh-pages` is therefore a **preview store only** — it is never meant to be served
directly. `deploy-pages.yml` serialises its own deployments with a
`concurrency: { group: pages, cancel-in-progress: false }` guard, so a burst of
merges + preview updates queue and publish in order instead of colliding.

## The failure mode (what "the site is stale" actually is)

If **Pages Source is left on "Deploy from a branch: gh-pages"**, GitHub *also*
runs its built-in **`pages build and deployment`** (`pages-build-deployment`,
event `dynamic`) on **every push to `gh-pages`** — and the PR-preview action
pushes there on every PR open / sync / close, so it fires constantly (177 runs in
one audited window). That builder deploys to the **same** `github-pages`
environment but is **outside** the `pages` concurrency group. Two cooperating
effects then keep the live site stale:

1. **Race.** A `Deploy Pages` run that would publish fresh `master` fails with:

   ```
   HttpError: Deployment request failed for <master-sha> due to in progress
   deployment. Please cancel <gh-pages-deployment-id> first or wait for it to
   complete.
   Error: Failed to create deployment (status: 400) …
   ```

   The blocking deployment id is precisely the branch builder's in-flight
   `gh-pages` deploy, which started seconds earlier. In the audited window ~13 of
   ~25 `Deploy Pages` runs failed this way.

2. **Stale overwrite (the worse half).** When the branch builder *wins*, it
   publishes the **`gh-pages` branch root itself** — a full, stale copy of the
   site (audited at **52 files / ~11,600 lines behind `master`** under
   `reforged/`) — on top of the good master deploy. The follow-up `Deploy Pages`
   runs that would restore master then hit the 400 above and never land.

Net effect: **merges to `master` do not go live.**

## The fix

Set **Settings → Pages → Source = "GitHub Actions"**. That removes the branch
builder entirely, which eliminates **both** the races and the stale overwrites.
Only `deploy-pages.yml` deploys after that, and its `pages` concurrency group
serialises everything — no matter how many branches/sessions merge at once.

Previews are unaffected: `rossjrw/pr-preview-action` pushes to `gh-pages`
regardless of the Pages source, and `deploy-pages.yml` picks the previews up via
its `workflow_run` trigger and overlays `ghp/pr-preview` into the artifact. No
part of the live site depends on the branch builder.

## How to verify it's fixed

- **Actions tab:** after the change, **`pages build and deployment` should stop
  appearing** for new `gh-pages` pushes. Only **`Deploy Pages`** should run.
- **A fresh merge to `master`** should show its `Deploy Pages` run succeed and the
  change appear at the live URL (hard-refresh — the SW is re-stamped each deploy,
  so it self-busts once a deploy lands).
- No more `HTTP 400 … in progress deployment` errors in `Deploy Pages` logs.

## Optional cleanup (not required)

- The stale full-site copy at the `gh-pages` **root** becomes dead weight once
  Source = "GitHub Actions" (only `pr-preview/` is ever read from it). Pruning the
  root reduces checkout size and future confusion.
- Keep `deploy-pages.yml`'s `cancel-in-progress: false` — it must never interrupt
  an in-flight publish; the queue drains on its own.
