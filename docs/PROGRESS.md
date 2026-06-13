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

| ID    | Story                                            | Size | Status               |
| ----- | ------------------------------------------------ | ---- | -------------------- |
| S6-01 | Dedup asset URLs (UNIQUE + conflict-safe upsert) | S    | Done (PR #148)       |
| S6-02 | Raise stumble quality floor                      | L    | Done (PR #150)       |
| S6-03 | Session dedup + graceful exhaustion              | M    | Done (PR #151)       |
| S6-04 | Format-aware content gate (type classifier)      | L    | Done (PR #160)       |
| S6-05 | Content-type-aware rendering                     | M    | Done (PR #163)       |
| S6-06 | Per-source cooldown                              | S    | Done (PR #165)       |
| S6-07 | Reader robustness (min-length, in-memory cache)  | S    | Done (PR #158, #131) |
| S6-08 | Language filter (Medium non-English)             | S    | Done (PR #164)       |

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

**Session 3 (post-format-work, stopped at #8):** churned _fast_ — **4 of 7 stumbles were Wikipedia**
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

| ID    | Story                                                  | Size | Status                   |
| ----- | ------------------------------------------------------ | ---- | ------------------------ |
| S7-01 | Fix video player (direct `/embed/`, not `/proxy`)      | S    | Done (PR #176)           |
| S7-02 | Rebalance seed pool (cap any source at ~2)             | S    | Done (PR #175)           |
| S7-03 | Render-by-type + screenshot-preview cards              | L    | Done (PR #177)           |
| S7-04 | Curated channel content library (24 items, 8 channels) | XL   | Done — incr. 1 (PR #178) |

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
_"without a good preview I won't click, I won't share."_ Sites with a rich `og:image` landed; bare
ones (neal.fun, Windows 93, APOD, video) under-sold great content. **Verdict: the engine + content
are right; the conversion lever is preview-image quality.**

## Sprint 7 — session-5 backlog (from eval 4)

| Issue | Story                                                       | Owner  | Status                                                                    |
| ----- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| #179  | Screenshot/thumbnail backstop for preview cards (the lever) | senior | Done (PR #187)                                                            |
| #180  | Video thumbnail cards + more video seeds                    | gemini | Done (PR #190)                                                            |
| #181  | Persist session dedup history to `sessionStorage`           | gemini | Done (PR #189)                                                            |
| #182  | Render APOD / image+caption pages in reader                 | gemini | Done (PR #188)                                                            |
| #183  | `WibySource` content fetcher (Indie & Classic Web)          | gemini | Done (PR #186)                                                            |
| #141  | Search matches description + case-insensitive               | gemini | Done (PR #166)                                                            |
| #184  | Reader enrichment — AI visual explainers (the delight bet)  | senior | Done (PR #191 backend, #196 hook/panel, #198 toggle); Tier-1 reel PR #203 |

**Session-5 success criterion:** firm-send (delight) rate **> 20%** (the "maybe sends" converting
once previews are rich), video plays/previews, zero "bare preview image" complaints.

## Eval session 5 (the constraint moved)

Ran post-backlog (#184 enrichment shipped: PR #191/#196/#198). **Stopped at #4 — by boredom, not
breakage.** That's the headline: the floor and the explainer are _solved_; the binding constraint
moved to **corpus size + targeting**.

**What's now working (don't touch):** rendering is clean — _"a couple of previews… better than the
sessions before,"_ zero blank/broken cards across all 4. The **AI explainer (the delight bet) is
validated** as a _decision-aid_: _"the reader gets an insight before reading the full content, so he
can decide"_ — it converted a skip→read on the Voynich Wikipedia page (_"definitely won't read the
original, but I read the summary"_) and let the user decide "not for me" in ~10s on a Paul Graham
essay. Verdict on the explainer: _"good to see a summary before reading — for sure I'll keep it."_

**The new #1 constraint (it ended the session):** corpus familiarity. _"I can't complete the session
because of the boredom… reseed with totally new sites, 100+ if we can."_ 26 seeds × 5 sessions =
fatigue; this now outranks all rendering/explainer polish (#204). Send rate was 0/4 — but **none were
quality or render failures**; they were _boredom_ and _topic-mismatch_ (_"good, but I'm not interested
in art, nor are my friends"_ — a targeting gap, #206), not disasters.

**The roadmap ceiling (captured):** the explainer text is a strong v1, but the user's real vision is
visual — _"an app of itself: take an article, explain it in animation + slides like Kurzgesagt."_
→ built **Tier 1: the animated explainer reel** (#202/PR #203) — scene script from the same cached
call, Framer-Motion slides, ~$0 extra (switched the summarizer to **Haiku 4.5** for cost). Tiers 2
(browser-TTS narration, $0) and 3 (generated art, $$) are deferred on #202.

**Session-5 findings → issues:** #204 (corpus → 100+ diverse/rotating — the blocker), #205 (weak
explainer image on text-only articles), #206 (interest-fit targeting), #202 (the reel, shipped).

## Explainer Mode — Enrichment v1 (epic #215)

Formalizing + hardening the rushed v0 explainer into the planned architecture (`docs/EXPLAINER_BUILD_PLAN.md`).

| ID  | Story                                                        | Owner  | Status                                                                    |
| --- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| B1  | Port + adapter + versioned prompt + truncation guard         | senior | Done (PR #226)                                                            |
| B2  | Explainer cache (SQLite)                                     | senior | Done (PR #248 — senior takeover; bot #229/#239/#247 closed)               |
| B3  | Explainer service (reader→enrich, article gate)              | senior | Done (PR #228)                                                            |
| B4  | `GET /api/v1/explainer` endpoint                             | senior | Done (PR #237)                                                            |
| F1  | `useExplainer` hook (rename `useEnrichment` → `/explainer`)  | senior | Done (merged)                                                             |
| F2  | SceneReel → oklch design tokens                              | gemini | Done (PR #227)                                                            |
| F3  | Explainer as 3rd ViewModeToggle mode                         | senior | Done (PR #245)                                                            |
| F4  | Explainer skeleton + unavailable card (`ExplainerState.tsx`) | gemini | Done (PR #231)                                                            |
| P1  | Prefetch next stumble's explainer                            | senior | Todo (#224 — needs B4✓ + F1)                                              |
| P2  | Explainer feedback + format-mix telemetry                    | senior | Todo (#225 — needs a re-scope on F3+B2; bot unassigned; #232/#244 closed) |

**Where we left off (handoff):** B1–B4 (backend) + F1–F4 (frontend) are all merged; the explainer
draft cache is now SQLite-backed (B2 #248, senior takeover — implements the existing
`ExplainerDraftCache` port and is wired into `ExplainerService`). `GET /api/v1/explainer` is live and
the UI hits it via `useExplainer`; **F3 (#245)** made Explainer a true 3rd `ViewModeToggle` mode
(article-only, **default Reader, opt-in**). **Remaining:** **P1 (#224, senior)** prefetch; **P2 (#225)**
feedback + format-mix telemetry — re-scope needed on top of F3+B2 before re-pinning to the bot (its
#244 attempt mixed B2 in with no tests; closed). Bot recurring pitfalls this epic: stale-branch
stacking + mixing multiple issues per PR (closed #229/#230/#232/#239/#247/#244) — one issue per PR
off current master.

B1 (#216): tone-aware `EXPLAINER_PROMPT` + `PROMPT_VERSION` in `prompts/`; adapter moved to
`adapters/`; `ExplainerTruncatedError` on `max_tokens` (never parses a partial), try/catch →
`ExplainerUnavailableError`; `max_tokens` 1800; `emoji?` optional. Live-validated — tone rule holds
(whimsy/emoji dropped on Chernobyl + 1918-flu somber beats). B3 (#218): `ExplainerService.explain(url)`
— fetch → extract (the article gate; non-extractable → `NotArticleError`) → cached draft by
`(url, PROMPT_VERSION)` (in-memory; B2 swaps SQLite) → summarize on miss; LLM errors propagate (B4 → 503).

## Mobile — Native App v1 (program, `docs/MOBILE_BUILD_PLAN.md`)

Ship the app as a native mobile app (Android first) — wrap the existing `ui/` build with
Capacitor, do not rewrite. Two core features: swipe-native discovery + browse any site inside
the app (native WebView, not an iframe).

| ID          | Story                                                        | Owner         | Status                                                                     |
| ----------- | ------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------- |
| S1          | Capacitor scaffold, run existing UI on Android               | senior        | Done (PR #242)                                                             |
| S2          | Native WebView spike (GO/NO-GO on real device)               | senior        | **PASS** — validated on device via M2 (#250 closed)                        |
| M1.1        | Config: icons, splash, status bar                            | gemini→senior | Done (PR #258 — senior generated the assets; bot source PNGs were empty)   |
| M1.2        | Dev live-reload + documented cap build loop                  | gemini        | Done (PR #256)                                                             |
| M1.3        | Safe-area insets + full-bleed stumble view                   | gemini        | Done (PR #261)                                                             |
| M2          | Browse un-iframable sites in a native in-app WebView         | senior        | Done (PR #263 / #270) — `useBrowse` + `@capacitor/inappbrowser`            |
| M3.1        | Swipe-up-to-next + always-visible mobile Next                | senior        | Done (PR #269 / #271) — scroll-aware `useSwipe`                            |
| BV0         | Spike: live site inline via webview-overlay (GO/NO-GO)       | senior        | **PASS** on device (#279)                                                  |
| BV1         | Live feed ("Reels") — inline live-site discovery             | senior        | Done (PR #281 / #280) — `LiveFeed` + `@teamhive/capacitor-webview-overlay` |
| BV2.1       | Reels polish: loading bar, snapshot swap, prominent entry    | senior        | Done (PR #285 / #283)                                                      |
| Reels-first | Mobile = full app shell, live site inline (no separate mode) | senior        | Done (PR #296)                                                             |
| BV2.2       | Reader toggle inside the Live feed (articles)                | senior        | Done (PR #304 / #284)                                                      |
| Immersive   | Hide-chrome toggle: live site full-screen + restore strip    | senior        | Done (PR #296 follow-up)                                                   |
| Render v2   | Mobile-friendly normalization + cosmetic ad/popup hiding     | senior        | Done (PR #296 follow-up)                                                   |

> **Browse v2 (epic #278) is the product breakthrough** — "reels of live websites", device-tested as
> delightful. The plugin `@teamhive/capacitor-webview-overlay` is productionized: `ui/.npmrc`
> `legacy-peer-deps` (it peer-deps Capacitor 7), `@testing-library/dom` restored as an explicit devDep,
> and the plugin's AGP-9 proguard incompatibility fixed durably via **patch-package** + `postinstall`
> (`ui/patches/`). `minSdkVersion` 26.

**Merged to master (Phases 0–2 + the explainer epic + UI/UX hardening):** S1 scaffold (Capacitor v8),
M1.1–M1.3 shell (branded icon/splash, status bar, dev loop, safe-area), **M2** in-app browse (`useBrowse`

- `@capacitor/inappbrowser`, which validated the **S2** keystone gate #250), **M3.1** swipe-up-to-next,
  and **BV1/BV2.1** the (opt-in, on master) Reels feed. UI/UX hardening (epic #286): home decluttered into
  the ☰ menu (#288), header integrates menu+brand (#292), dark-mode reader fix (#289), softer error banner
- reels chrome (#294), empty-state + PreviewCard polish (#298). The **Explainer epic (#215)** is fully
  merged (B1–B4, F1–F4, P1, P2). iOS deferred (no Mac).

**Device-connectivity for dev (merged):** the app reaches the backend over the **LAN**
(`VITE_API_URL=http://<host-ip>:3000/api/v1` — works on a same-Wi-Fi **phone**; the **emulator can't
reach the host LAN IP**, it needs `10.0.2.2`); `capacitor.config.ts` = `androidScheme: http` +
`cleartext`, CORS allows `localhost`/`capacitor://localhost` (#260); **service worker disabled in native
builds** (`CAP_BUILD=1`, #264) so reinstalls aren't stale; AGP-9 build fix (#259). **Build a device APK:**
`cd ui ; $env:VITE_API_URL="http://<host-ip>:3000/api/v1"; $env:CAP_BUILD="1"; npm run build; npx cap sync android`,
then `ui/android/gradlew.bat :app:assembleDebug` (`JAVA_HOME` = Android Studio `jbr`), then install via the
**SDK adb** (`%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe` — NOT the standalone "ADB and Fastboot++",
which conflicts). Prefer a clean `adb uninstall` + `install` when swapping builds. See the
[[mobile-device-dev-setup]] memory.

---

### ⏯️ RESUME HERE — Browse v2 reels-first, core loop SHIPPED (all on master)

The mobile model (tester-confirmed): **on native there is NO separate "reel mode" — mobile _is_ the full
app, and the live website renders INLINE in the content area.** The header (search / ☰ menu / dark /
account) stays above it and is always available; the rate/favorite/Next bar is below; no exit button. The
card + reader view is **web-only**. **All merged to master** — there is no open reels branch; work off
`master`. `ui/src/components/LiveFeed.tsx` is the surface; build/install to a device via the
[[mobile-device-dev-setup]] memory (LAN-IP `VITE_API_URL` + `CAP_BUILD=1`, SDK adb).

**Shipped (LiveFeed + App.tsx):**

- **#296** — reels is the native default (`isNativeReels` in `App.tsx` renders `LiveFeed` filling `main`);
  swipe-up handle + haptics (`useHaptics`); scroll fix (dropped the `toggleSnapshot` freeze);
  full-app-shell inline rewrite; layering fix (`useAnyOverlayOpen` → `paused` prop hides the native view
  while any `[role=dialog|menu|listbox|alertdialog]` is open).
- **Immersive toggle** — a Maximize control hides the header + action bar so the live site fills the
  screen; the overlay's `ResizeObserver` resizes the native view automatically; a thin restore strip
  (`Swipe down for controls`) below the overlay brings chrome back. `immersive` state in `App.tsx`,
  gated by `isNativeReels`. (Auto-hide-on-scroll is **not feasible** — the native WebView doesn't report
  scroll to React.)
- **Page enhancement (`ENHANCE_PAGE`/`ENHANCE_CSS` in LiveFeed)** — injected on every load: mobile-friendly
  normalization (text-size-adjust, max-width media, no h-overflow) + **conservative** cosmetic blocking of
  ad containers / named-CMP cookie walls / newsletter modals. Selectors are precise on purpose (no broad
  `*=ad*`); body scroll-lock classes are never hidden; `overflow-y` is forced back on so a killed modal
  can't freeze the page.
- **#284 (BV2.2) reader toggle** — on an article stumble, a Reader button flips the live site to our clean
  `ReaderView` (`useReader`) inline; the overlay is hidden (`toggleSnapshot`) while reader shows. State is
  keyed on the current url so Next auto-exits reader; lazy fetch; graceful "reader unavailable" card.

**Bot (`H1shamM-bot`):** on **#268** — re-scoped to a strictly **append-only** curated-library expansion
(10 entries to the thin channels Videos/Indie + a new Science & Space channel; hard no-delete guard +
count/dedup test) after #290 was closed for deleting entries.

**Next program-level:** **M4** content-safety gate (NSFW/spam classification + report/block — a **launch
blocker** before any store/public release) → **M5** store readiness. Optional: **M3.3** swipe-rate
gestures. Open issues: #267, #268, #275, #286, + security backlog #138/#130.

### Backlog

- [ ] "Stumble of the Day" Email (Email Co-Pilot Integration)
- [ ] Admin Dashboard (requires S4-06)

### Follow-ups

- [ ] Address lingering `@typescript-eslint/no-explicit-any` warnings in `app/`.
