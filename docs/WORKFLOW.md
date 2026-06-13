# Development Workflow — stumble-clone

**This is the contract.** Every change to this repo follows it — senior (Claude,
`H1shamM`) and junior (`H1shamM-bot`, Gemini) alike. It was written with judgment,
deliberately, to hold the bar as the project scales. If "present-tired me" wants to
skip a step, this document wins. Point me here.

> **Two-agent note:** `master` is branch-protected (PR + green CI + 1 code-owner
> review); the junior cannot merge. The senior reviews every bot PR and admin-merges.
> See root `CLAUDE.md` and `GEMINI.md`.

## The Contract — non-negotiables

1. **No direct commits to `master`.** Every change goes through a `feat/`|`fix/`
   branch and a PR. (Admin bypass exists for the owner only to _admin-merge own PRs_
   once CI is green — never to push code straight to `master`.)
2. **Every PR has a linked issue.** No issue = the work isn't planned. Stop and plan
   it first (create the issue, then branch).
3. **Every feature PR includes tests.** No "I'll add them later."
4. **CI must be green to merge.** No "merge red, fix after."
5. **Coverage must not drop.** Same or up, per package. CI enforces it (see below).
6. **No new dependency without a one-line justification** in the PR body.
7. **No dead code or scratch scripts in the repo root.** Scripts live in `scripts/`.
8. **No log files committed.** `.gitignore` covers `*.log`; the `guards` CI check
   fails if one slips in.
9. **Docs stay accurate in the same PR.** If a PR changes behavior, it updates
   `README.md` / `CLAUDE.md` / `PROGRESS.md` in that same PR — not "next time."
10. **Friday sprint report.** Append a short entry to `docs/SPRINT_REPORTS.md`:
    what shipped, what slipped, what's next.

## Issue → PR lifecycle

1. Pick a task from `PROGRESS.md` (or a new idea → make it an issue first).
2. Create a GitHub issue (templates in `TEMPLATES.md` / `.github/ISSUE_TEMPLATE/`).
3. Branch from `master`: `feat/<short-kebab>` (stories) or `fix/<short-kebab>` (bugs).
4. Implement, **writing tests as you go**.
5. Pre-push checks (both affected packages): `npm run lint` · `npm run typecheck` ·
   `npm test` · confirm coverage didn't drop.
6. Conventional Commit, e.g. `feat(discovery): add URL validation` + `Closes #12`.
7. Push, open a PR with the template. Keep PRs **reviewable: ≤500 changed lines**
   excluding generated files — split if larger.
8. Monitor CI; fix failures. Never merge red.
9. Review against the issue's acceptance criteria, then **squash-merge** on green.
10. Post-merge: close the issue (link the PR), update `PROGRESS.md`, delete the branch.

## CI enforces the contract (automation, not willpower)

`.github/workflows/` runs on every PR to `master` (Node 24, `npm ci`):

- **`lint`** (`lint (app)` / `lint (ui)`) — eslint + typecheck per package. Fails on
  any lint or type error.
- **`tests`** (`test (app)` / `test (ui)`) — `npm test -- --coverage` per package.
  Fails on a red test **and if coverage drops** below the committed floor (thresholds
  live in each package's vitest config).
- **`guards`** — fails if any `*.log` file is committed, and runs the repo-wide
  **Prettier format check** (`npm run format:check`) — a PR with unformatted files fails.

Locally, **husky + lint-staged** run `eslint --fix` + `prettier --write` + typecheck on
staged files before each commit, so formatting is applied automatically.

Coverage baselines (raise only upward): **UI — statements ≥ 73 / branches ≥ 74 /
functions ≥ 64 / lines ≥ 75.** **App — thresholds set once the hermetic-fixtures fix
(#306) makes coverage reliably measurable.**

## The "STOP ME" rules (the agent enforces these)

Whenever work is requested in this repo:

1. "Merge to master directly" → **refuse**, ask for a PR.
2. "Add a feature" with no issue → **refuse**, ask which issue / create one first.
3. "Skip the tests this once" → **refuse**, explain that this is how projects rot.
4. New dep with no reason → **ask** for the one-line justification.
5. Log file or root scratch script committed → **revert it**, say where it belongs.
6. `PROGRESS.md` untouched 10+ days → **remind**.
7. Coverage drops in a PR → **block**, ask which tests to add.
8. PR > 500 changed lines (excl. generated) → **suggest splitting** before reviewing.

## Commit conventions

Conventional Commits: `feat` · `fix` · `refactor` · `test` · `docs` · `chore`
(+ optional scope, e.g. `fix(ui):`). **No `Co-Authored-By: Claude` trailer** (portfolio
repo — author is Hisham only).

## Weekly sprint cycle

- **Monday:** triage backlog, create the week's issues, size S/M/L.
- **Daily:** work tasks, keep `PROGRESS.md` current.
- **Friday:** append the sprint report to `docs/SPRINT_REPORTS.md`; update `PROGRESS.md`.

## Tools

`gh` CLI for issues and PRs. Always use the PR flow — never improvise a merge.

---

This workflow is the backbone of our professionalism. Follow it religiously.
