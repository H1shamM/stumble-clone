# StumbleClone Project Progress

## Sprint 1: Foundation (Done)

| ID    | Story                       | Size | Status |
| ----- | --------------------------- | ---- | ------ |
| S1-01 | Workflow & Project Init     | S    | Done   |
| S1-02 | Core Backend Infrastructure | M    | Done   |
| S1-03 | Unified Responsive UI       | L    | Done   |

## Sprint 2: Professionalization (Done)

| ID    | Story                        | Size | Status |
| ----- | ---------------------------- | ---- | ------ |
| S2-01 | Hexagonal Refactor           | M    | Done   |
| S2-02 | Engineering-Grade Docs       | S    | Done   |
| S2-03 | Zod Validation & Schema Sync | S    | Done   |
| S2-04 | CI Pipeline & Linting        | S    | Done   |
| S2-05 | Iframe Redesign & Fallback   | M    | Done   |
| S2-06 | Ratings History Panel        | S    | Done   |
| S2-07 | Category Filter              | S    | Done   |
| S2-08 | Favorites & Bookmarks        | M    | Done   |
| S2-10 | Real API Integration         | M    | Done   |

## Sprint 3: Stabilization & Cleanup (Done)

| ID    | Story                        | Size | Status |
| ----- | ---------------------------- | ---- | ------ |
| S3-02 | v1.0 Polish & Coverage Boost | S    | Done   |
| S3-03 | Repo Hygiene Pass            | S    | Done   |
| S3-04 | CI & Type Stabilization      | S    | Done   |

## Sprint 4: Production v2.0 (In Progress)

| ID    | Story                 | Size | Status |
| ----- | --------------------- | ---- | ------ |
| S4-01 | PWA & Mobile Polish   | M    | Done   |
| S4-02 | Social Auth (OAuth2)  | L    | Done   |
| S4-03 | Community Submissions | L    | Done   |
| S4-04 | Production Infra      | M    | Done   |
| S4-05 | AI Vector Search      | XL   | Todo   |
| S4-06 | Admin Infrastructure  | M    | Todo   |

## Sprint 5: Migration & SaaS UI Overhaul (In Progress)

| ID    | Story                                           | Size | Status        |
| ----- | ----------------------------------------------- | ---- | ------------- |
| S5-01 | Build repair & Tailwind v4 wiring (bug)         | S    | Done (PR #79) |
| S5-02 | Modern SaaS UI overhaul (sidebar+main)          | L    | Done (PR #81) |
| S5-03 | Supervised Gemini junior-dev pipeline + helpers | M    | Done          |
| S5-04 | In-app reader-first viewing (hybrid)            | L    | Done          |

S5-02: indigo oklch design tokens, sidebar + main app shell, top-bar Header
(search + theme + avatar/dropdown user menu), redesigned StumbleArea +
floating action bar, and panels/modals polished (emoji → Lucide). Reconciled
onto master, preserving the avatar/dropdown user menu.

S5-03: dedicated `H1shamM-bot` account (Write-only), `master` branch protection
(PR + code-owner review + CI), `GEMINI.md` junior playbook, Gemini Task issue
template, and CODEOWNERS. Junior tasks are tracked as `gemini-ready` GitHub issues
(e.g. #84–#86, the contentHelpers utilities) and reviewed/merged by the senior.

S5-04 (Done): reader-first hybrid in-app viewing. Backend `GET /api/v1/reader`
extracts + sanitizes article content (jsdom + @mozilla/readability + sanitize-html)
with an SSRF guard and graceful 422s (#92, #121). UI: `ReaderView` (#98), `useReader`
(#101), `ViewModeToggle` (#102), and the StumbleArea integration (#97) with a
Reader/Live toggle, open-in-tab, graceful "reader unavailable" fallback (#114, no
blank pages), and a 16:9 auto-embed **video mode** for YouTube/embeddable sources
(#115, #120). Plus from the UX evaluation: **search drives the discovery view**
(#119), rating-toast feedback (#122), and a spacebar = next shortcut (#123).

## Sprint 6: Discovery Engine Quality (In Progress)

Driven by a structured **product evaluation** of the stumble experience (30-stumble
protocol, stopped early at #16). Findings: delight rate **0%**, disaster rate **81%**,
repeat rate **38%** (first repeat at stumble #4), and a "something is wrong" trust-break
by #16. Root causes: a tiny corpus (~17 assets) of homepage URLs the reader can't
extract, duplicate rows, and session dedup that the backend supported but the UI never
sent. Sprint closes those gaps.

| ID    | Story                                            | Size | Status         |
| ----- | ------------------------------------------------ | ---- | -------------- |
| S6-01 | Dedup asset URLs (UNIQUE + conflict-safe upsert) | S    | Done (PR #148) |
| S6-02 | Raise stumble quality floor                      | L    | Done (PR #150) |
| S6-03 | Session dedup + graceful exhaustion              | M    | Done (PR #151) |

S6-01 (#145, junior `gemini-ready`): `UNIQUE(url)` on `assets`, `saveAsset` upsert via
`ON CONFLICT(url)` preserving `rating`/`created_at`, plus a migration that collapses
existing duplicate-url rows. Removes the triplicated Atlas / doubled YouTube rows that
inflated both repetition and weighted-random odds.

S6-02 (#146): replaced the 4 homepage seeds (HN/Reddit/Colossal/APOD roots, which
reader-first can't extract → blank cards) with 8 deep-link, reader-friendly article
permalinks; added an **article-gate** (`assetGate.ts`, reuses `extractReadable`) so only
videos or extractable pages enter rotation; and made live-fetch **eager** so the corpus
grows toward a target pool instead of stalling at the cold-start threshold.

S6-03 (#147): the UI (`useStumble.ts`) now tracks seen asset IDs and sends them as the
`history` param the backend already filtered on — no within-session repeats — resetting
on category change. Backend no longer throws when the pool is exhausted: it tries one
live fetch, then falls back to the full pool, erroring (503) only on a genuinely empty
corpus.

**Next:** re-run the 30-stumble protocol (eval session 2) to verify the targets —
repeat rate <5%, disaster <40%, delight >10%, broken-renders ≈0.

### Backlog

- [ ] "Stumble of the Day" Email (Email Co-Pilot Integration)
- [ ] Admin Dashboard (requires S4-06)

### Follow-ups

- [ ] Address lingering `@typescript-eslint/no-explicit-any` warnings in `app/`.
