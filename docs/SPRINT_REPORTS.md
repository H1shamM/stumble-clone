# Sprint Reports — stumble-clone

A short entry every Friday (per `docs/WORKFLOW.md`): what shipped, what slipped,
what's next. Newest first.

<!--
Template:

## YYYY-MM-DD

**Shipped:** PRs/issues that merged this week.
**Slipped:** what was planned but didn't land, and why.
**Next:** the focus for next week.
-->

## 2026-06-13

Two threads this sprint: finishing the **reels-first mobile** core loop, then a
**production-engineering hardening** pass (audit → enforce the workflow contract).

**Shipped — mobile (Browse v2 / reels-first):**

- #296 — reels is the native default; live site renders inline in the full app
  shell; swipe-up handle + haptics; scroll fix; menu/modal layering fix.
- Immersive toggle — full-screen the live site (chrome hides, overlay resizes via
  ResizeObserver, thin restore strip).
- Render v2 — injected mobile-friendly normalization + conservative cosmetic
  ad/cookie-wall/popup hiding (precise selectors only).
- #284 — Reader toggle inside the Live feed for articles.

**Shipped — engineering bar (audit + fixes):**

- #315 — split CI into `lint`/`tests`/`guards`; rewrote `WORKFLOW.md` as the
  enforced contract; PR template; `SPRINT_REPORTS.md`. Fixed the `pull_request:[main]`
  bug (default branch is `master`).
- #306 (CRITICAL) — hermetic in-memory DB fixtures; app suite now 101/101 reliably
  (was 6 failing locally while green in CI). Coverage gated in both packages.
- #313 — adopted Prettier as the formatting gate (CI + pre-commit).
- #308 — removed the unwired e2e zombie + Playwright dep.
- #307 — removed dead root scratch scripts.
- #268 — curated-library expansion done right (10 verified entries + invariant test)
  as a senior PR after the bot attempt (#303) was reviewed and closed.
- Branch protection migrated to 5 required checks; 9 audit findings filed as tracked
  issues (#306–#313).
- Bot: #300 (action-bar polish) merged; #321/#322 (hook tests) assigned.

**Slipped / deferred (tracked, not lost):** #310 PRD (needs product input), #309 TODO
triage, #311 admin-bypass removal, #312 backlog triage.

**Next:** **M4 content-safety gate** (NSFW/spam classification + report/block — the
launch blocker before any store release); land the bot's #321/#322; #310 PRD when
ready to scope it together.
