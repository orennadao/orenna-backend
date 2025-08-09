# Orenna Backend (Monorepo) — SQLite (No Docker)

This variant runs **entirely without Docker**. Prisma uses SQLite so you can develop anywhere.

## Quickstart (macOS / no Docker)
1. Copy `.env.sample` → `.env` (the default `DATABASE_URL` points to `packages/db/prisma/dev.db`).
2. Install deps: `pnpm i`
3. Generate Prisma client: `pnpm db:generate`
4. Create schema & seed: `pnpm db:migrate && pnpm db:seed`
5. Run API: `pnpm dev` → http://localhost:3000/health (docs at /docs)
6. Run tests: `pnpm test`

## Switching to Postgres later
- Change `packages/db/prisma/schema.prisma` datasource to `postgresql` and set `DATABASE_URL` accordingly.
- Re-run `pnpm db:generate && pnpm db:migrate`.