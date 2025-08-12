# Orenna Backend (Monorepo)

## Getting Started (Dev)

1. Copy `.env.sample` → `.env`.
2. Install deps: `pnpm i`.
3. Start database: `docker compose up -d db`.
4. Apply migrations: `pnpm prisma migrate dev`.
5. Run API: `pnpm dev` → http://localhost:3000/health/liveness (docs at /docs).
6. Run tests: `pnpm test`.
