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

## Sprint 6: Discovery Engine Quality (Done)

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
| S6-04 | Format-aware content gate (type classifier)      | L    | Done (PR #160) |
| S6-05 | Content-type-aware rendering                     | M    | Done (PR #163) |
| S6-06 | Per-source cooldown                              | S    | Done (PR #165) |
| S6-07 | Reader robustness (min-length, in-memory cache)  | S    | Done (PR #158, #131) |
| S6-08 | Language filter (Medium non-English)             | S    | Done (PR #164) |

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

S6-04…08: format-aware gate (`assetGate.classifyAsset` → `article|image|video|interactive`,
nullable `type` column), type-aware rendering (`StumbleArea` routes visual content to live, prose
to reader), per-source cooldown (down-weights a source seen in the last 4 stumbles), reader
min-length + in-memory cache, and a non-English filter on the Medium source.

## Eval sessions 2 & 3 (verification)

**Session 2 (post-S6, n=16):** the floor was fixed — broken renders 33%→**0%**, disaster
81%→**19%**, repeats 38%→**~6%**. But **delight only 0%→6%**: the fixes removed reasons to quit
without adding reasons to stay. New failure mode = **monotony** ("it's all articles") + source
clustering (Bored Panda 3×) + reader stripping image-rich sites. Floor solved; ceiling untouched.

**Session 3 (post-format-work, stopped at #8):** churned *fast* — **4 of 7 stumbles were Wikipedia**
(seed pool was 55% one source; cooldown can't beat a rigged corpus), and non-article content
(video #3, Bored Panda #6, Atlas #9) **rendered blank** (you can't iframe the arbitrary web).
Verdict: **the engine works; the bottleneck is content + rendering, not the algorithm.** Delight
stayed ~0 because the pool is dull and visual content won't display.

## Sprint 7: Content & Rendering v2 (In Progress — epic #169)

The delight gap is a **content + rendering** problem. Competitive research (Cloudhiker's ~30k
hand-reviewed sites / 19 channels; Viralwalk "Flows" & TheRandomWeb "Preview Mode" using
screenshot previews; Discuvver/Useless Web open-in-tab) confirms: curated library = the moat,
and nobody iframes arbitrary sites. **Platform direction:** the real target is a **mobile app**
(web = prototype); in-app browsing is a native WebView, not a web iframe (Capacitor as the bridge).

| ID    | Story                                                       | Size | Status                  |
| ----- | ----------------------------------------------------------- | ---- | ----------------------- |
| S7-01 | Fix video player (direct `/embed/`, not `/proxy`)           | S    | Done (PR #176)          |
| S7-02 | Rebalance seed pool (cap any source at ~2)                  | S    | Done (PR #175)          |
| S7-03 | Render-by-type + screenshot-preview cards                   | L    | Done (PR #177)          |
| S7-04 | Curated channel content library (24 items, 8 channels)      | XL   | Done — incr. 1 (PR #178)|

S7-03 (#172): `image`/`interactive` stumbles render a **preview card** (og:image + title +
"Open the site"), not a blank iframe — via `previewService` + `GET /api/v1/preview` + the
`usePreview`/`PreviewCard` UI. S7-04 (#173): a 24-item curated library across 8 channels
(`channel` column); remaining increment = promote `/submissions` into the library.

## Eval session 4 (the breakthrough)

First session the product **delighted**. Same 30-stumble protocol, wrapped at #20 (findings
converged). vs. all prior sessions: broken renders ~0, disaster ~0%, **format mix ~67%**, max
same-domain 2, **first churn: none** — and the **first firm "I'll definitely share this"** in four
sessions (Windows 93), plus ~47% "maybe send" and three user-generated product ideas. The one
open metric — **firm delight (~5%)** — has a single diagnosed cause the user stated repeatedly:
*"without a good preview I won't click, I won't share."* Sites with a rich `og:image` landed; bare
ones (neal.fun, Windows 93, APOD, video) under-sold great content. **Verdict: the engine + content
are right; the conversion lever is preview-image quality.**

## Sprint 7 — session-5 backlog (from eval 4)

| Issue | Story | Owner | Status |
| ----- | ----------------------------------------------------------- | ------ | ------ |
| #179  | Screenshot/thumbnail backstop for preview cards (the lever) | senior | Done (PR #187) |
| #180  | Video thumbnail cards + more video seeds                    | gemini | Done (PR #190) |
| #181  | Persist session dedup history to `sessionStorage`          | gemini | Done (PR #189) |
| #182  | Render APOD / image+caption pages in reader                | gemini | Done (PR #188) |
| #183  | `WibySource` content fetcher (Indie & Classic Web)         | gemini | Done (PR #186) |
| #141  | Search matches description + case-insensitive               | gemini | Done (PR #166) |
| #184  | Reader enrichment — AI visual explainers (the delight bet) | senior | Done (PR #191 backend, #196 hook/panel, #198 toggle); Tier-1 reel PR #203 |

**Session-5 success criterion:** firm-send (delight) rate **> 20%** (the "maybe sends" converting
once previews are rich), video plays/previews, zero "bare preview image" complaints.

## Eval session 5 (the constraint moved)

Ran post-backlog (#184 enrichment shipped: PR #191/#196/#198). **Stopped at #4 — by boredom, not
breakage.** That's the headline: the floor and the explainer are *solved*; the binding constraint
moved to **corpus size + targeting**.

**What's now working (don't touch):** rendering is clean — *"a couple of previews… better than the
sessions before,"* zero blank/broken cards across all 4. The **AI explainer (the delight bet) is
validated** as a *decision-aid*: *"the reader gets an insight before reading the full content, so he
can decide"* — it converted a skip→read on the Voynich Wikipedia page (*"definitely won't read the
original, but I read the summary"*) and let the user decide "not for me" in ~10s on a Paul Graham
essay. Verdict on the explainer: *"good to see a summary before reading — for sure I'll keep it."*

**The new #1 constraint (it ended the session):** corpus familiarity. *"I can't complete the session
because of the boredom… reseed with totally new sites, 100+ if we can."* 26 seeds × 5 sessions =
fatigue; this now outranks all rendering/explainer polish (#204). Send rate was 0/4 — but **none were
quality or render failures**; they were *boredom* and *topic-mismatch* (*"good, but I'm not interested
in art, nor are my friends"* — a targeting gap, #206), not disasters.

**The roadmap ceiling (captured):** the explainer text is a strong v1, but the user's real vision is
visual — *"an app of itself: take an article, explain it in animation + slides like Kurzgesagt."*
→ built **Tier 1: the animated explainer reel** (#202/PR #203) — scene script from the same cached
call, Framer-Motion slides, ~$0 extra (switched the summarizer to **Haiku 4.5** for cost). Tiers 2
(browser-TTS narration, $0) and 3 (generated art, $$) are deferred on #202.

**Session-5 findings → issues:** #204 (corpus → 100+ diverse/rotating — the blocker), #205 (weak
explainer image on text-only articles), #206 (interest-fit targeting), #202 (the reel, shipped).

### Backlog

- [ ] "Stumble of the Day" Email (Email Co-Pilot Integration)
- [ ] Admin Dashboard (requires S4-06)

### Follow-ups

- [ ] Address lingering `@typescript-eslint/no-explicit-any` warnings in `app/`.
