# Development Workflow — stumble-clone

Based on ai-email-copilot’s professional workflow. This is the standard for every change.

> **Two-agent note:** this repo is built by a senior (Claude, `H1shamM`) and a junior
> (`H1shamM-bot`, Gemini). `master` is branch-protected (PR + green CI + 1 code-owner
> review); the junior cannot merge. The senior reviews every bot PR and admin-merges.
> See the root `CLAUDE.md` and `GEMINI.md` for the full model. The lifecycle below
> applies to both agents.

## Overview

- **Branching:** `master` is always deployable. All work happens in `feat/`/`fix/` branches.
- **Issues:** every task starts as a GitHub issue using the templates in TEMPLATES.md.
- **PRs:** every merge to `master` requires a pull request with passing CI and a completed checklist.
- **CI:** automated tests + lint on every PR (`test (app)` + `test (ui)`).
- **Documentation:** PROGRESS.md updated on every merge.

## Issue → PR lifecycle

1. Pick a task from PROGRESS.md (or a new idea).
2. Create a GitHub issue with the user‑story or bug template.
3. Create a branch from master:
   - For stories: feat/<short-kebab>
   - For bugs: fix/<short-kebab>
4. Implement the code, always writing tests along the way.
5. Run the pre‑push checks:
   npm run lint
   npm run format
   npm test
   npm run test:coverage (verify >=80%)
6. Commit with a conventional commit message:
   feat(discovery): add URL validation to asset discovery
   Closes #12
7. Push and open a pull request using the PR template (in TEMPLATES.md).
8. Monitor CI — fix any failures.
9. Self‑review the PR, then squash‑merge once CI is green.
10. Post‑merge:
    - Close the issue with a comment linking the PR.
    - Update PROGRESS.md (mark the task done).
    - Delete the feature branch.

## CI/CD

CI is live: `.github/workflows/ci.yml` runs on PRs — **Node 24**, `npm ci` → lint → `npm test`
for both packages (the required checks are `test (app)` and `test (ui)`). `master` is
branch-protected on these checks + a code-owner review.

- **Deploy** (`deploy.yml`): future — deploy the API to a cloud environment, ideally OIDC-based
  zero-secret access.

## Commit conventions

Use Conventional Commits:

- feat: – new feature
- fix: – bug fix
- refactor: – code restructuring without functional change
- test: – adding or updating tests
- docs: – documentation only
- chore: – tooling, build, CI

Append a scope if helpful (e.g., feat(api):, fix(ui):).

## Weekly sprint cycle

- Monday: review backlog, create issues for the week’s tasks, estimate size (S/M/L).
- Daily: work on tasks, keep PROGRESS.md current.
- Friday: review what shipped, update PROGRESS.md, celebrate wins.

## Tools

Use gh CLI for issues and PRs.
Do not use git push to create PRs — always use the PR creation flow.

---

This workflow is the backbone of our professionalism. Follow it religiously.
