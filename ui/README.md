# StumbleClone — Frontend (`ui/`)

The React 19 + Vite + TypeScript + Tailwind v4 (shadcn/ui) frontend.

> 📖 **For the full project overview, architecture, and setup, see the root
> [README](../README.md) and [`docs/`](../docs).** This file only covers UI-local dev.

## Develop

```bash
npm install
npm run dev        # → http://localhost:5173 (expects the API on :3000)
```

Run the backend separately: `cd ../app && npm start`.

## Scripts

| Command             | Purpose                        |
| ------------------- | ------------------------------ |
| `npm run dev`       | Vite dev server (HMR)          |
| `npm run build`     | `tsc -b && vite build`         |
| `npm run lint`      | ESLint                         |
| `npm run typecheck` | `tsc -b`                       |
| `npm test`          | Vitest (React Testing Library) |

## Notes

- Components are PascalCase (`StumbleArea.tsx`); hooks/modules camelCase (`useStumble.ts`).
- Tailwind v4 is wired via `@tailwindcss/vite`; reader prose uses `@tailwindcss/typography`.
- Vitest has no auto-cleanup — call `afterEach(cleanup)` in component tests.
