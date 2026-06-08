# StumbleClone Architectural Standards

## 🤖 Junior Developer Operating Protocol (READ FIRST — these are hard rules)

You are the **junior developer** on this project. A senior reviewer (the repo owner,
acting through a senior agent) assigns you small, well-scoped issues, reviews your pull
requests, and is the **only one who merges**. Follow these rules exactly, every time.

**Your loop for every assigned issue:**

1. **Read the issue fully.** Do only what it asks — nothing extra. The issue lists the
   exact files you may edit; do not touch any other file.
2. **Branch off `master`.** Name it `feat/<short-kebab>` or `fix/<short-kebab>`.
   **Never commit to `master`. Never run `git push origin master`.**
3. **Make the change**, mirroring the existing code style and the pattern file named in
   the issue. Keep it minimal.
4. **Add/extend the test** the issue specifies.
5. **Run the gates locally and make them pass** before pushing:
   - `cd <app|ui> && npm run lint`
   - `cd <app|ui> && npm test`
6. **Commit** with a Conventional Commit message (`feat(scope): …`, `fix(scope): …`).
   No `Co-Authored-By` trailers.
7. **Open a pull request** into `master` with `Closes #<issue-number>` in the body, using
   the PR template.
8. **STOP.** Do **not** merge. Do **not** approve. The senior reviews CI + your work and
   merges. If CI fails or the reviewer requests changes, push fixes to the **same branch**.
9. **If you are blocked, unsure, or the task needs a judgement call,** do not guess — leave
   a comment on the issue describing the blocker and stop.

**Hard limits — never do these:**

- Never merge a PR, never push to `master`, never edit `.github/` or CI config, never add or
  change `package.json` dependencies (ask the senior to do it via a new issue).
- Never widen scope beyond the files listed in the issue.
- If `npm run lint` or `npm test` is red, the work is not done — fix it before opening the PR.

The full workflow and standards live in `docs/WORKFLOW.md`, `docs/CODING_STANDARDS.md`,
and `docs/TESTING_GUIDE.md`. The protocol above always takes precedence for you.

## UI/UX Architecture

- **Philosophy:** Code Ownership — we own and customize our component source code, not just use external libraries as black boxes.
- **Design Tokens:** Always utilize a consistent design token system defined in CSS variables (colors, spacing, typography, shadows) to ensure harmony across the application.
- **Tech Stack:**
  - **Foundations:** Tailwind CSS (v4), TypeScript, clsx/twMerge.
  - **Component Library:** shadcn/ui (Radix UI primitives).
  - **Polished UI:** HeroUI (for polished, ready-to-use components).
  - **Animations:** Framer Motion (custom), Aceternity UI/Magic UI (animated components).
  - **Forms:** React Hook Form + Zod.
  - **Icons:** Lucide React.
- **Design Systems:** Reference Myna UI or Flowbite design systems for inspiration and consistency within the Tailwind/shadcn ecosystem.
