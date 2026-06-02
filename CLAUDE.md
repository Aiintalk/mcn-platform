# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the monorepo root unless noted.

```bash
pnpm dev          # Start Next.js dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint

pnpm db:migrate   # Dev only — generate + apply new migration (creates files in prisma/migrations/)
pnpm db:deploy    # Production — apply existing migrations without generating new ones
pnpm db:seed      # Seed initial users and sample data
pnpm db:studio    # Open Prisma Studio (database GUI)
```

> Never run `db:migrate` on a production server. Use `db:deploy` instead.

## Architecture

**Monorepo layout**
- `apps/web/` — the Next.js 14 App Router application (only active app)
- `packages/lib-*` — shared stubs for AI, ASR, OSS, TikHub (not yet implemented)

**Route groups in `apps/web/src/app/`**

| Group | Path prefix | Who sees it |
|---|---|---|
| `(admin)` | `/admin/*` | `admin` role only |
| `(operator)` | `/`, `/kols/*`, `/products/*` | `operator` role (admin redirected to `/admin`) |
| `(auth)` | `/login`, `/change-password` | unauthenticated / mustChangePassword |
| `api/` | `/api/*` | server-side, all roles with guards |

**Auth flow**
- `src/middleware.ts` — `withAuth` wrapper enforces JWT presence, `mustChangePassword` redirect, and role-based 403s for `/admin/*` and `/api/users/*`
- `src/lib/auth.ts` — next-auth `authOptions` with credentials provider (bcryptjs, rounds=12)
- `src/lib/api-helpers.ts` — `requireAuth()` / `requireAdmin()` used at the top of every API route handler; `ok()` / `err()` for uniform responses; BigInt replacer for JSON serialization

**Known permission issue (pending fix)**
`POST /api/kols` and `PATCH /api/kols/[id]` currently use `requireAuth` instead of `requireAdmin`. Operators can bypass the UI and call these directly. Fix: change to `requireAdmin` in `apps/web/src/app/api/kols/route.ts` and `apps/web/src/app/api/kols/[id]/route.ts`.

**Database**
- PostgreSQL 15, Prisma 5
- All IDs are `BigInt` — serialized to `string` in API responses via the BigInt replacer in `api-helpers.ts`
- Version-managed tables: `kol_profiles` and `product_selling_points` both have `isCurrent` + `version` fields; new uploads set old rows `isCurrent=false` and increment version in a transaction
- `passwordChangedAt = null` means the user has never changed their password → triggers forced password change on next login

**API conventions**
- All responses: `{ data: ... }` on success, `{ error: "..." }` on failure
- `Content-Type: application/json` everywhere (no multipart — file parsing happens client-side with `mammoth` before sending JSON)
- Documented in `API_CONTRACT.md` (v2.0)

## Environment

Copy `apps/web/.env.example` → `apps/web/.env.local` (dev) or `apps/web/.env.production` (prod).

Required vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

Production `DATABASE_URL` should include connection pool params:
```
postgresql://user:pass@localhost:5432/mcn_platform?connection_limit=5&pool_timeout=10
```

## Deployment

```bash
bash scripts/deploy.sh   # pull → install → db:deploy → build → pm2 reload
```

PM2 config: `ecosystem.config.js` (cluster mode, 4 workers)
Nginx config: `nginx/mcn-platform.conf`
