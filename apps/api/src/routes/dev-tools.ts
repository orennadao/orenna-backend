import { FastifyInstance } from "fastify";

export default async function devToolsRoutes(app: FastifyInstance) {
  // TEMP: DB introspection (hidden from docs) – BigInt-safe
  app.get(
    "/__db",
    { schema: { hide: true } },
    async () => {
      const coerce = (row: Record<string, unknown>) =>
        Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v])
        );

      const dbs = await app.prisma.$queryRaw<
        Array<Record<string, unknown>>
      >`PRAGMA database_list;`;

      const tables = await app.prisma.$queryRaw<
        Array<Record<string, unknown>>
      >`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`;

      return { dbs: dbs.map(coerce), tables: tables.map(coerce) };
    }
  );

  // Debug helpers
  app.get("/__routes", { schema: { hide: true } }, async () => app.printRoutes());
}
