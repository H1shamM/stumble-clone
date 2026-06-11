# Explainer Mode — Build Plan (Epic: Enrichment v1)

**For:** Claude Code (senior agent), scoping into GitHub issues for the standard
workflow (issue → `feat/`|`fix/` branch → tests → lint → Conventional Commit
`Closes #N` → PR → CI → squash-merge → update `docs/PROGRESS.md`).

**Goal:** Add an LLM "Explainer" view that re-tells an article as a 4–6 scene reel
(swipeable slides). It rides on the existing `readerService` extraction, runs only
on `article`-type assets, is cached per `(url, promptVersion)`, and appears as a
third mode in the existing `ViewModeToggle` (Reader / Live / **Explainer**).

**Why now:** Directly targets the Sprint-7 open lever ("content under-sells →
convert *maybe send* to *send*"). A reel is more shareable than a plain reader
view, on the article slice.

---

## Architecture fit (decisions to lock before issues)

1. **Reuse, don't re-fetch.** The explainer's text input is the *already extracted,
   sanitized* article from `readerService` — not a second network fetch. The
   service composes `readerService.extract(url)` → text → `EnrichmentService`.
   Keeps the SSRF guard (`utils/urlGuard.ts`) and the <400-char / 422 behaviour
   for free.
2. **Article-only.** Gate on `assetGate.classifyAsset`. `video`/`image`/`interactive`
   never hit the LLM. Non-article → endpoint returns 422 (mirror reader's contract:
   never 500).
3. **Port + adapter (hexagonal).** `EnrichmentService` is the port; `ClaudeExplainer`
   (Haiku 4.5, structured outputs) is the adapter. Model choice swappable in one place.
4. **Cache in SQLite.** New `explainer_cache` table keyed by `url` + `prompt_version`.
   Cache miss → generate → store. Bumping `prompt_version` invalidates cleanly.
5. **Prompt is versioned + tone-aware.** Single exported constant
   (`EXPLAINER_PROMPT` + `PROMPT_VERSION`). Tone modulation for sensitive subjects is
   a hard acceptance criterion, not a nicety.
6. **`emoji` optional in schema.** So somber topics aren't forced into a cheerful glyph.
7. **Mirror existing patterns** exactly: controller like `readerController`, hook like
   `useReader`/`usePreview`, view toggle like the current Reader/Live switch.

---

## Issues

> Labels: `senior` = architecture/secrets/cross-cutting (Claude scopes + implements).
> `gemini-ready` = atomic, file-allowlisted, safe for the junior bot.
> Each issue: explicit file allowlist + acceptance criteria + a test. Do not merge
> until CI green + acceptance met.

### B1 — Explainer port, Claude adapter, versioned prompt `[senior]`
- **Files:** `app/src/services/enrichmentService.ts` (port + `EnrichmentDraft`/`Scene`
  types), `app/src/adapters/claudeExplainer.ts`, `app/src/prompts/explainerPrompt.ts`.
- **Scope:** `EnrichmentService` interface with `summarize({title,text}) → EnrichmentDraft`.
  `ClaudeExplainer` uses `claude-haiku-4-5`, `output_config.format` (structured outputs
  is GA for Haiku 4.5 — no beta header), schema with `summary`, `keyPoints[]`,
  `scenes[{heading, body, emoji?}]`. Parse JSON from the `text` block.
- **Hardening (required):** guard `stop_reason === "max_tokens"` (throw typed
  `ExplainerTruncatedError`, don't `JSON.parse` a partial); wrap the API call in
  try/catch → typed failure; `max_tokens` ≥ 1800; cap input via `MAX_INPUT_CHARS`.
- **Prompt:** the tone-aware prompt (re-tell not summarize; scene 1 = hook, never a
  definition; one throughline or "most interesting angle"; faithfulness; **match tone
  to subject — drop whimsy/emoji on tragedy, disease, death, crime, living-person
  controversy**; reading level ~14yo; inline hook example). Export `PROMPT_VERSION`.
- **Tests (`tests/unit/`):** mock the SDK — valid JSON → typed draft; `max_tokens`
  stop_reason → throws `ExplainerTruncatedError`, never returns partial.
- **Acceptance:** unit tests pass; no secrets committed (key from `process.env`).

### B2 — Explainer cache (SQLite) `[gemini-ready, depends: B1]`
- **Files:** `app/src/bootstrap.ts` (or migration) for the table; `app/src/repositories/explainerRepo.ts`; test in `tests/unit/`.
- **Scope:** `explainer_cache(url TEXT, prompt_version TEXT, draft_json TEXT,
  created_at INTEGER, PRIMARY KEY(url, prompt_version))`. Repo: `get(url, version)`,
  `put(url, version, draft)`.
- **Acceptance:** hit returns stored draft; miss returns null; a different
  `prompt_version` is a miss (old rows ignored). Unit test covers all three.

### B3 — Compose reader extraction → explainer service `[senior, depends: B1,B2]`
- **Files:** `app/src/services/explainerService.ts`; test in `tests/unit/`.
- **Scope:** `explain(url)`: classify (article-only, else throw `NotArticleError`) →
  cache lookup (B2) → on miss, `readerService.extract(url)` for clean text →
  `EnrichmentService.summarize` → store → return. In-memory + DB cache like reader.
- **Acceptance:** article URL returns a draft and writes cache; second call served
  from cache (assert the adapter is called once); non-article throws `NotArticleError`.

### B4 — `GET /api/v1/explainer?url=` controller + route `[gemini-ready, depends: B3]`
- **Files:** `app/src/controllers/explainerController.ts`; route registration where
  `reader`/`preview` routes live; test in `tests/unit/`.
- **Scope:** mirror `readerController` contract — 200 + draft JSON; **422** for
  `NotArticleError` / thin extraction; **503** on upstream LLM failure; **never 500**.
  Reuse the SSRF guard already applied via reader.
- **Acceptance:** controller tests for 200 / 422 / 503 paths.

### F1 — `useExplainer` hook `[gemini-ready]`
- **Files:** `ui/src/hooks/useExplainer.ts`; test in `tests/` (or co-located per repo
  convention).
- **Scope:** mirror `useReader`/`usePreview`: takes a url, exposes
  `{ draft, loading, error }`, hits `/api/v1/explainer`. Treats 422 as "not available"
  (not an error toast).
- **Acceptance:** hook test with mocked fetch for loading → success and 422 states.

### F2 — Port `SceneReel` into `ui/` with repo design tokens `[gemini-ready, depends: F1]`
- **Files:** `ui/src/components/SceneReel.tsx` (+ `.module.css` or Tailwind),
  component test.
- **Scope:** adapt the standalone `SceneReel` (provided separately) to the repo's
  stack: Tailwind v4 + shadcn/Radix primitives, Framer Motion for slide transitions,
  Lucide icons, the indigo oklch token system (no hardcoded hex — use CSS vars).
  Keep: swipe + arrow keys + tap zones + segmented progress; cover + recap slides;
  CC BY-SA footer; `prefers-reduced-motion`.
- **Acceptance:** renders a sample draft; keyboard + swipe navigate; component test
  asserts aria-labels (`Previous slide`/`Next slide`) and calls `afterEach(cleanup)`.

### F3 — Wire Explainer into `StumbleArea` + `ViewModeToggle` `[senior, depends: F1,F2]`
- **Files:** `ui/src/components/StumbleArea.tsx`, the `ViewModeToggle` component,
  related test(s).
- **Scope:** add **Explainer** as a third mode, shown only for `article` assets next
  to Reader/Live. Default stays Reader; Explainer is opt-in. Loading → skeleton;
  422/error → an "Explainer unavailable" card consistent with the existing
  "reader unavailable" card.
- **Acceptance:** toggle appears only on articles; switching renders `SceneReel`;
  existing reader/live tests still pass (don't break the `iframe title="Stumbled page"`
  / toggle assertions).

### F4 — Skeleton + unavailable card `[gemini-ready, depends: F2]`
- **Files:** small additions to `SceneReel.tsx` / a shared card; test.
- **Scope:** layout-matched skeleton during generation; graceful unavailable state.
- **Acceptance:** skeleton shows while `loading`; unavailable card on 422.

### P1 — Prefetch next stumble's explainer `[senior, depends: B4,F1]`
- **Files:** `ui/src/hooks/useStumble.ts` (already tracks seen ids / next), wiring.
- **Scope:** when the current asset is an article, warm `/api/v1/explainer` for the
  *next* queued asset in the background so the reel is instant on switch. Respect the
  source cooldown / dedup logic already there.
- **Acceptance:** network panel shows a background explainer call for the next asset;
  no change to stumble timing.

### P2 — Feedback + format-mix telemetry `[gemini-ready, depends: F3]`
- **Files:** rating handler + a lightweight event log; test.
- **Scope:** thumbs on an Explainer view feed the existing category/source pref weights
  (`discoveryService` weighting); log Explainer-vs-Reader selection so the
  session-eval "format mix" metric can include it.
- **Acceptance:** a like in Explainer mode updates prefs same as Reader; an event is
  recorded.

---

## Build order

```
B1 → B3 → B2 → B4   (backend: adapter → service → cache → endpoint)
F1 → F2 → F3 → F4   (frontend: hook → component → wire-in → states)
P1 → P2             (polish: prefetch → telemetry)
```

B1 and F2 can run in parallel (F2 uses a sample draft until B4 exists). Everything
after B4 unblocks the frontend wiring.

---

## Conventions to honor (from CLAUDE.md)

- Issue-first, atomic, file-allowlisted. `gemini-ready` issues get the
  `.github/ISSUE_TEMPLATE/gemini-task.md` template + "do not merge".
- Watch the recurring junior pitfalls: branching off stale `master`, **forgetting
  source/route registration**, mixing two issues in one PR.
- Conventional Commits, `Closes #N`, squash-merge, then update `docs/PROGRESS.md`.
- **No `Co-Authored-By: Claude` trailer** (portfolio repo, author = Hisham).
- CI runs Node 24; if `npm ci` complains after a new dep, regenerate the lockfile fully.
- Secrets: `ANTHROPIC_API_KEY` from env only; never commit it; document it in `.env.example`.

## Cost / safety notes
- Haiku 4.5 + one cached call per article keeps cost bounded; cache makes repeat
  stumbles free.
- Keep the rich reel pointed at Wikipedia / openly-licensed sources (CC BY-SA footer
  already in the component). For other article sources, the plain reader view remains
  the default; Explainer is opt-in.
- The tone-modulation acceptance criterion in B1 is the guardrail against a reel that
  treats a tragedy like a fun fact. Add a unit test with a grim sample title that
  asserts the prompt path is exercised (and review real output on a few somber
  articles before shipping).
```
