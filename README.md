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

## Mint Request Flow

Authenticated users (via the fake `/siwe` endpoint) can request token mints which go
through an off-chain approval process:

1. `POST /mint-requests` – create a new `PENDING` request.
2. `GET /mint-requests?mine=1` – list your own requests (filter by status with `status=`).
3. `POST /mint-requests/:id/approve` – admin only; marks request `APPROVED`.
4. `POST /mint-requests/:id/reject` – reject a pending request.
5. `POST /mint-requests/:id/execute` – admin only; simulates on-chain execution and
   returns a fake transaction hash. Execution is blocked unless `ALLOW_EXECUTE=true`
   is set in the environment.

Requests move from `PENDING` → `APPROVED` → `EXECUTED` or end in `REJECTED`/`CANCELED`.
