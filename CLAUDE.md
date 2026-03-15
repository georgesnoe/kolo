# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kolo is a French-language SaaS for collective personal finance — tontines, shared family budgets, and group savings — targeting the global francophone market.

## Commands

| Task | Command |
|---|---|
| Dev server (port 3000) | `npm run dev` |
| Build | `npm run build` |
| Preview production build | `npm run preview` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Run all tests | `npm run test` |
| Watch tests | `npx vitest` |
| Generate DB migration | `npx drizzle-kit generate` |
| Apply migrations | `npx drizzle-kit migrate` |
| Push schema without migration | `npx drizzle-kit push` |
| DB studio (visual explorer) | `npx drizzle-kit studio` |
| Add shadcn/ui component | `npx shadcn@latest add <component>` |

## Architecture

### Framework Stack
- **TanStack Start** (v1.132) with Vite as the dev/build tool — never call vinxi directly
- **TanStack Router** for file-based routing, **TanStack Query** for client data fetching
- **React 19**, **TypeScript 5** in strict mode with bundler module resolution
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin, styled with shadcn/ui
- **Outfit** font loaded from Google Fonts (configured in `__root.tsx`)

### Path Aliases
`@/*` maps to `./src/*` (configured in `tsconfig.json`)

### Directory Structure
```
src/
├── components/ui/     # shadcn/ui primitives (button.tsx, etc.)
├── core/
│   ├── api/           # External service clients (blob.ts, gemini.ts)
│   ├── auth/          # Better Auth config (auth.ts server, auth-client.ts client)
│   └── db/            # Drizzle schema + DB client (schema.ts, db.ts)
├── lib/               # Shared utilities (cn() helper)
├── routes/            # File-based routing (TanStack Router)
│   └── api/auth/$.ts  # Better Auth catch-all API route
├── styles.css         # Global CSS with Tailwind + shadcn theme variables
├── router.tsx         # Router configuration
└── routeTree.gen.ts   # Auto-generated route tree (do not edit)
```

### Database (Drizzle + Neon)
- Schema: `src/core/db/schema.ts` — Better Auth tables (user, session, account, verification)
- Client: `src/core/db/db.ts` — uses `@neondatabase/serverless` HTTP driver
- Migrations output: `src/core/db/generated/`
- Config: `drizzle.config.ts` at project root
- Never write raw SQL outside the schema/migration layer

### Authentication (Better Auth)
- Server config: `src/core/auth/auth.ts` — email/password + Google + Microsoft OAuth
- Client: `src/core/auth/auth-client.ts` — `createAuthClient()`
- API route: `src/routes/api/auth/$.ts` — catch-all handler for auth endpoints
- Session: 30-day expiry, 24-hour refresh
- Uses `tanstackStartCookies()` plugin for TanStack Start cookie integration
- The DB schema in `src/core/db/schema.ts` contains Better Auth tables managed by the adapter — do not modify these manually

### External Services
- **Vercel Blob**: `src/core/api/blob.ts` — `uploadFile()`, `getFileMeta()`, `deleteFile()`. Token always required from env, never exposed to client.
- **Google Gemini**: `src/core/api/gemini.ts` — `@google/genai` SDK, model `gemma-2-27b-it` with Google Search tool and HIGH thinking level. Functions: `askCoach()`, `categorizeTransaction()`.

### Styling
- Theme variables defined in `src/styles.css` using OKLCH color space
- Dark mode via `.dark` class on root element
- shadcn/ui components use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)
- Animations via `tw-animate-css`

### UI Conventions
- Component library: shadcn/ui — add new components with `npx shadcn@latest add <name>`
- Icons: Tabler Icons (`@tabler/icons-react`), default size 20px
- The app UI is entirely in **French** (html lang="fr"). Code identifiers remain in English.
- TanStack Devtools are enabled in `__root.tsx` (bottom-right position) — keep them during development

## Git & GitHub

### Repository
- Remote: `origin` → `git@github.com:georgesnoe/kolo.git`
- Production deploys from `main` branch

### Branch Strategy
- `main` — production, deployed to Vercel automatically on push
- `develop` — integration branch for feature work (create with `git checkout -b develop && git push -u origin develop`)
- `feature/*` — feature branches, merged into `develop`

### Commit Convention
Every commit must follow Conventional Commits format with a Co-authored-by trailer:

```
type(scope): short description

Co-authored-by: Claude <noreply@anthropic.com>
```

Types: `feat` | `fix` | `style` | `refactor` | `test` | `chore` | `docs` | `deploy`

### Workflow Rules
- Commit frequently — one responsibility per commit
- Never commit secrets (`.env`, credentials)
- Stage files by name (`git add <file>`) rather than `git add -A`
- Before pushing to `main`, run `npm run typecheck` and `npm run build` to verify

## Deployment (Vercel)

- The app deploys to Vercel automatically on push to `main`
- The user handles the initial Vercel deployment manually
- After pushing to `main`, use the Vercel MCP to poll deployment status until it reaches `READY` or `ERROR`
- If `ERROR`: read build logs, identify the issue, fix it, commit with `fix(deploy): ...`, push, and re-check
- Never assume a deployment succeeded without verifying via Vercel MCP

## Notion

- Kanban board database ID: `e4cd6c55-6cf6-4194-aa38-7c58385e8673`
- Use the Notion MCP to update task statuses as work progresses
- Move tasks through: Backlog → relevant column → Done
- After each phase is complete, add a comment to the Notion project page summarizing what was done
