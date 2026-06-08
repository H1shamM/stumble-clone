---
name: "🤖 Gemini Task"
about: A single, atomic task scoped for the Gemini junior agent. The senior reviewer fills this in.
title: "[gemini] "
labels: ["gemini-ready"]
assignees: ["H1shamM-bot"]
---

<!--
SENIOR: keep this to ONE small change. If it needs more than ~2 files or a
judgement call, split it into multiple issues. CI must be able to prove it works.
-->

## Goal (one sentence)

<!-- e.g. "Add a copy-to-clipboard button to the share action." -->

## Branch

Create branch: `feat/<short-kebab>` (or `fix/<short-kebab>`) off `master`.

## Files you may edit (ONLY these)

- `path/to/file.tsx`
- `path/to/file.test.tsx`

## Steps

1.
2.
3.

## Pattern to mirror

Copy the style/structure of: `path/to/similar-existing-file.tsx`

## Do NOT

- Do NOT edit any file outside the list above.
- Do NOT touch `.github/`, `master`, CI config, or `package.json` deps.
- Do NOT merge the PR. Do NOT run `git push origin master`.

## Acceptance criteria (testable)

- [ ] <!-- concrete, observable condition -->
- [ ] `npm run lint` passes (in the affected package)
- [ ] `npm test` passes (in the affected package)

## Test to add / make pass

<!-- Name the test and what it asserts, e.g.:
In `ui/src/components/Foo.test.tsx`, add a test:
"copies the url to the clipboard when the copy button is clicked". -->

## Definition of Done (checklist for YOU, the agent)

- [ ] Worked on a `feat/` or `fix/` branch, never on `master`
- [ ] Ran `npm run lint` and `npm test` locally — both green
- [ ] Opened a PR with `Closes #<this-issue-number>` in the body
- [ ] **Stopped after opening the PR — did NOT merge** (the senior reviews and merges)
- [ ] If blocked or unsure, left a comment on this issue and stopped
