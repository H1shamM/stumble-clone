# Mobile — Build Plan (Program: Native App v1)

**For:** Claude Code (senior agent), scoped into GitHub issues per `docs/WORKFLOW.md`
(issue → `feat/`|`fix/` branch → tests → lint → Conventional Commit `Closes #N` →
PR → CI → squash-merge → update `docs/PROGRESS.md`).

**Goal:** Ship the app as a native mobile app whose two core features are
(1) **swipe-native discovery** and (2) **browse any site inside the app**. Reuse the
existing `ui/` React app — wrap, do not rewrite.

> This is a multi-sprint program, not a single epic. Phase it. Phase 0 is a hard
> GO/NO-GO gate — do not build Phases 1+ until the spike passes.

---

## The landmine (read first)

An `<iframe>` inside the Capacitor app **still hits X-Frame-Options / CSP** — the app
shell is itself a WebView, so framing rules still apply. Header-stripping hacks
(`capacitor-plugin-xframe`) are fragile, Android-only, and weaken security — **do not
use**. The supported way to render an un-iframable site "inside the app" is a *native*
browser surface via **`@capacitor/inappbrowser`** (WebView mode, or a Custom Tab /
SFSafariViewController sheet). That's a real browser instance, not an embedded frame.

## Approach (locked)

- **Capacitor** wraps the existing `ui/` build (`webDir → ui/dist`). Backend, hexagonal
  architecture, hooks, and components carry over unchanged.
- **Browse view** = `@capacitor/inappbrowser`. Start with the Custom Tab / SFSafariVC
  sheet ("Open the site") — simplest and most store-compliant — then add full-screen
  `openInWebView` mode if you want app chrome around it.
- **Articles do not use the WebView** — they keep the native reader / explainer reel
  (better than a WebView of desktop Wikipedia on a phone). WebView is for
  `interactive` / `image` / non-article `video` assets.
- React Native is the fallback **only** if you later need the page embedded *within*
  your own layout with native gestures over it (embedded-BrowserView plugins are still
  beta/Android-only). Not needed for v1.

---

## Phase 0 — Spike / GO-NO-GO `[senior]`

### S1 — Capacitor scaffold, run existing UI on device
- **Files:** `ui/capacitor.config.ts`, `ui/package.json` (deps), generated `ui/ios/`,
  `ui/android/` (gitignore build artifacts, commit native projects).
- **Scope:** add `@capacitor/core` `@capacitor/cli` `@capacitor/ios` `@capacitor/android`;
  `webDir: "dist"`; `npm run build` → `npx cap sync`; open and run the current app in
  the iOS Simulator and an Android emulator.
- **Acceptance:** the existing app runs unchanged in both simulators; stumble + reader
  still work.

### S2 — Native WebView spike (the GO/NO-GO) `[senior]`
- **Files:** a throwaway, gitignored test screen.
- **Scope:** install `@capacitor/inappbrowser`; bump Android `minSdkVersion` to 26
  (`android/variables.gradle`); call `openInWebView` on a site known to send
  `X-Frame-Options: DENY` (where a normal iframe fails). Verify on a **real device**,
  not just simulator.
- **Acceptance:** the un-iframable site renders fully in the native WebView; back/close
  works. **Paste a screen recording / screenshots before proceeding.** If this fails,
  stop and reassess the browse strategy (RN fallback) before any further work.

---

## Phase 1 — M1: Capacitor shell `[mix]`

### M1.1 — Config, icons, splash, status bar `[gemini-ready]`
- **Files:** `ui/capacitor.config.ts`, `@capacitor/splash-screen` + `@capacitor/status-bar`
  setup, app icon / splash assets, `ui/package.json`.
- **Acceptance:** branded icon + splash on both platforms; status bar styled to the
  indigo token theme; no white flash on launch.

### M1.2 — Dev live-reload + build scripts `[gemini-ready]`
- **Files:** `ui/capacitor.config.ts` (server.url for dev), `ui/package.json` scripts
  (`cap:sync`, `cap:ios`, `cap:android`), `docs/` note.
- **Acceptance:** documented one-command dev loop; `cap sync` after `vite build` works.

### M1.3 — Safe-area + mobile layout pass `[gemini-ready]`
- **Files:** `ui/src/**` layout/CSS using safe-area-inset; the stumble view goes
  full-bleed.
- **Acceptance:** no content under notch / home indicator; toolbar reachable one-handed.

---

## Phase 2 — M2: Browse inside the app `[mix]`

### M2.1 — `useBrowse` hook wrapping inappbrowser `[gemini-ready, depends: S2]`
- **Files:** `ui/src/hooks/useBrowse.ts`, test.
- **Scope:** `open(url, mode)` where mode = `sheet` (Custom Tab / SFSafariVC) or
  `webview` (full-screen). Handle close + back events; storage isolation default.
- **Acceptance:** hook test (mock the plugin) for open/close; sheet vs webview path.

### M2.2 — Wire browse into `StumbleArea` for non-article types `[senior, depends: M2.1]`
- **Files:** `ui/src/components/StumbleArea.tsx`, the existing `PreviewCard`.
- **Scope:** on `interactive`/`image`/non-embeddable `video`, the preview card's
  "Open the site" triggers `useBrowse` (native), replacing the broken-iframe path on
  mobile. Keep web behaviour intact (feature-detect Capacitor via `Capacitor.isNativePlatform()`).
- **Acceptance:** on device, opening an un-iframable asset shows it natively; web build
  unchanged; existing render tests pass.

---

## Phase 3 — M3: Swipe-native discovery `[mix]`

### M3.1 — Gesture layer over the stumble view `[senior, depends: M1.3]`
- **Files:** `ui/src/components/StumbleArea.tsx`, possibly a `useSwipe` helper;
  `useStumble.ts` wiring; tests.
- **Scope:** swipe **up** = next stumble (reuse `useStumble` next); swipe **down** =
  previous (history is already tracked); use **Framer Motion** drag (already in stack).
  Keep desktop spacebar-next. Respect `prefers-reduced-motion`.
- **Acceptance:** swipe up advances; swipe down goes back; web/keyboard path unchanged;
  test asserts gesture → next handler.

### M3.2 — Haptics + transition polish `[gemini-ready, depends: M3.1]`
- **Files:** `@capacitor/haptics` calls, transition tuning.
- **Acceptance:** light haptic on a committed swipe (native only); smooth card
  transition; no jank.

### M3.3 — (Optional) swipe-rate gestures `[gemini-ready, depends: M3.1]`
- **Scope:** swipe left = dislike, right = like, feeding the existing
  `discoveryService` prefs. Keep it optional/secondary to up/down navigation.
- **Acceptance:** a horizontal swipe updates prefs same as the rating buttons.

---

## Phase 4 — M4: Content-safety gate (LAUNCH BLOCKER) `[senior-heavy]`

> Both core features expose users to raw web (you can't predict the next swipe; the
> WebView shows the full site). App-store review will require moderation + reporting.
> This is not optional.

### M4.1 — Automated asset classification `[senior]`
- **Files:** `app/src/services/safetyService.ts`, hook into `assetGate.classifyAsset` /
  ingest path; tests.
- **Scope:** heuristics (domain blocklists, dead-link/paywall detection) + an LLM
  classifier pass for NSFW / hate / spam. Tag assets; the discovery pool only serves
  assets that pass. Cache verdicts.
- **Acceptance:** flagged sample assets are excluded from `stumble()`; unit tests cover
  pass/flag.

### M4.2 — Report + block `[gemini-ready, depends: M4.1]`
- **Files:** `app/src/controllers/reportController.ts`, a `reports` / `blocked_urls`
  table, `discoveryService` filter; `ui/` report button + per-user block; tests.
- **Scope:** user can report or block the current asset; reported assets are
  down-weighted/queued for review; blocked never re-served to that user.
- **Acceptance:** report endpoint records + filters; blocked URL never reappears for
  that user; tests for both.

---

## Phase 5 — M5: Store readiness `[senior]`

### M5.1 — Store assets + metadata `[gemini-ready]`
App icon set, screenshots, descriptions, age rating questionnaire inputs.

### M5.2 — Privacy + moderation compliance `[senior]`
- Privacy policy + data-collection disclosures (App Privacy / Data Safety forms).
- Public **content-moderation policy** doc (`docs/`), referencing M4 (review will ask).
- **Account deletion** flow (required if you keep OAuth accounts).
- **Acceptance:** all store forms answerable from real app behaviour; deletion works.

### M5.3 — Beta channels `[senior]`
TestFlight (iOS) + Play internal testing wired; a real install on a real device.

---

## Build order

```
S1 → S2            (Phase 0 — STOP at S2 for GO/NO-GO)
M1.1 → M1.2 → M1.3 (shell)
M2.1 → M2.2        (browse)
M3.1 → M3.2 → M3.3 (swipe)
M4.1 → M4.2        (safety — before any public/store release)
M5.*               (store)
```
M3 (swipe) and M2 (browse) can overlap after M1. **M4 must land before M5 / any public
TestFlight-wide or store submission.**

## Conventions (from CLAUDE.md)
- Issue-first, atomic, file-allowlisted; `gemini-ready` issues use the
  `gemini-task.md` template with "do not merge". Watch junior pitfalls (stale branches,
  missing registration, mixed PRs).
- Conventional Commits, `Closes #N`, squash-merge, update `docs/PROGRESS.md`.
- **No `Co-Authored-By: Claude` trailer.**
- CI Node 24; regenerate lockfile fully if `npm ci` complains after new deps.
- Commit the generated `ios/`/`android/` native projects; gitignore their build output.

## Risks
- **Store review:** apps that are thin website wrappers and apps surfacing unmoderated
  third-party content get extra scrutiny — M4 + a clear moderation policy is the
  mitigation. Lead the store listing with the *discovery + reader/explainer* value, not
  "a browser for random sites".
- **WebView spike (S2) is the keystone** — if native WebView can't reliably render
  un-iframable sites on device, the browse feature needs rethinking before anything is
  built on it. That's why it's the gate.
```
