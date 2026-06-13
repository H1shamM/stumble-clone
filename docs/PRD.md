# StumbleClone — Product Requirements (v1)

**Status:** living document · **Owner:** Hisham · **Last updated:** 2026-06-13

This is the product source of truth. When it disagrees with the README, this wins
(the README is being updated to match). Engineering process lives in
`docs/WORKFLOW.md`; the roadmap/sequencing lives in `docs/MOBILE_BUILD_PLAN.md` and
`docs/PROGRESS.md`.

---

## 1. Problem & vision

Algorithmic feeds optimize for engagement, not delight — they show you more of what
you already clicked. The serendipitous, "show me something good I'd never have
searched for" experience that StumbleUpon pioneered is gone.

**StumbleClone brings it back as a native mobile app:** one tap surfaces a genuinely
interesting corner of the open web, and — the part that made StumbleUpon magic — you
**browse the real site right inside the app**, then swipe to the next.

## 2. Target user & positioning

**Curious generalists tired of doomscrolling** — people who want delightful,
unexpected, _good_ corners of the web instead of another infinite algorithmic feed.
The hook is anti-feed serendipity with StumbleUpon nostalgia, for a phone.

Not a power-user/niche tool first; broad appeal, with the curated library quietly
doing the taste-making.

## 3. Intent

**Portfolio-first, product-capable.** Built to senior-engineering portfolio quality,
but architected and scoped so v1 is a real, installable Android app that _could_
become a product. Growth and revenue are explicitly deferred (see non-goals); the
near-term win is a polished, genuinely delightful app + a clean, well-run repo.

## 4. Goals (v1, in scope)

1. **Serendipitous discovery loop** — weighted-random engine with dedup, per-session
   dedup, and per-source cooldown for variety (built).
2. **Browse the live site inside the app** — native WebView "reels" feed: each
   stumble's real site renders inline; swipe to the next (built).
3. **Render-by-type** — article → reader/explainer; video → player; image/interactive
   → preview card; old/desktop sites made mobile-friendly; immersive full-screen
   toggle (built).
4. **Curated, channel-organized content library** — the moat. Hand-picked, format-
   diverse, source-capped; grown via community submissions (built, ongoing).
5. **Personalization** — likes/dislikes reorder the pool via category/source prefs
   (built).
6. **Content-safety gate (M4)** — automated NSFW/spam classification + user
   report/block. **Launch blocker** — both core features expose users to the raw web.
   (Not yet built; the gating v1 work.)
7. **Accounts** — lightweight auth so prefs/favorites/history persist (built;
   Google/GitHub OAuth + local).

## 5. Non-goals (v1 — ruthlessly out of scope)

These are deliberately excluded from v1. Excluded ≠ never; each is a possible
post-v1 line, but building them now is scope creep.

- **No social graph** — no following, friends, profiles-of-others, comments, or a
  social feed. Discovery is solo and serendipitous, not a network.
- **No iOS app** — Android-only for v1 (no Mac to build/ship iOS). The backend and
  Capacitor wrap keep iOS cheap to add later.
- **No web app as a product** — the web build is a dev prototype/companion only. No
  PWA-install marketing, no "web product" support surface.
- **No monetization** — no ads, premium tiers, or paid features in v1.
- **No algorithmic engagement optimization** — variety and delight over time-on-app;
  we do not build retention-maximizing infinite-feed mechanics.

## 6. The core experience

On launch, the app _is_ the reels feed (on native there is no separate "mode"). The
current stumble's live site fills the content area inside the normal app shell;
header (search / menu / dark / account) stays above it. Swipe up / tap **Next** for a
new stumble; rate, favorite, go immersive, or flip an article to the clean reader.
The web (card + reader) layout is web-only.

## 7. Success criteria (v1 "done")

v1 is defined by **delight**, measured with the structured eval-session protocol used
in sessions 1–4 (a run of ~20–30 stumbles, scoring each). The bar, derived from those
sessions (session 4 was the first to delight):

- **Delight:** a meaningful share of stumbles rated "great / I'd share this" — and at
  least one genuine, unprompted "I'm sending this to someone" per session.
- **Disaster rate near zero** — broken/blank renders, dead links, off-putting content.
- **Low repetition** — no within-session repeats; varied sources and formats
  (~50%+ non-article format mix).
- **Low churn** — the tester keeps going rather than quitting out of boredom.

When a fresh eval session clears that bar consistently, the discovery loop is v1-done.
(Store submission, while not the v1 _definition_, requires M4 + compliance — tracked
separately in the build plan.)

## 8. Constraints & architecture (summary)

- Native Android via **Capacitor** wrapping the React UI; in-app browsing is a
  **native WebView** (X-Frame-Options doesn't apply to top-level docs — an iframe
  can't do this; that's why it's a native, not web, capability).
- Platform-agnostic **REST backend**, hexagonal (ports & adapters) — sources, gate,
  recommender, reader shared across surfaces.
- Engineering bar enforced by CI per `docs/WORKFLOW.md` (lint, typecheck, gated
  coverage, format, branch protection).
- Full technical detail in `CLAUDE.md`.

## 9. Risks

- **Content quality is the product.** The engine is solved; delight rises and falls
  with the curated library and rendering. Biggest ongoing investment.
- **Store review scrutiny** — apps surfacing unmoderated third-party content get extra
  review. Mitigation: M4 + a public moderation policy; lead the listing with the
  _discovery + reader_ value, not "a browser for random sites."
- **Preview/render quality** — a bare card under-sells great content ("without a good
  preview I won't share"). Screenshot/thumbnail backstops are the top conversion lever.

## 10. Post-v1 (explicitly later, not now)

iOS · monetization · web as a product · social/sharing features · AI explainer reels
as a headline feature · admin/moderation dashboard. Revisit only after the v1 delight
bar is met and the Android app is launched.
