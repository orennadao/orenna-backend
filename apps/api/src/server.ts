import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from './plugins/swagger.js';
import readiness from './plugins/readiness.js';
import healthRoutes from './routes/health.js';
import exampleRoutes from './routes/example.js';
import { getEnv } from './types/env.js';

const env = getEnv();

const app = Fastify({
  logger: {
    level: 'info',
    redact: ['req.headers.authorization']
  }
});

await app.register(cors, {
  origin: env.API_CORS_ORIGIN,
  credentials: true
});

await app.register(swagger);
await app.register(readiness);
await app.register(healthRoutes);
await app.register(exampleRoutes);

const closeSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
for (const sig of closeSignals) {
  process.on(sig, async () => {
    app.log.info({ sig }, 'Shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (e) {
      app.log.error(e);
      process.exit(1);
    }
  });
}

const start = async () => {
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`Docs at http://${env.API_HOST}:${env.API_PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();