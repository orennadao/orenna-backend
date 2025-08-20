import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { prisma, PrismaClient } from "@orenna/db";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

const prismaPlugin: FastifyPluginAsync = async (app) => {
  app.decorate("prisma", prisma);
  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
