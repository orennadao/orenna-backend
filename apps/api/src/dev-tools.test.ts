import { describe, it } from 'vitest';
import Fastify from 'fastify';
import devToolsRoutes from './routes/dev-tools';

// Ensure dev routes can be registered multiple times without duplication errors
// when the server is started and stopped (e.g., during hot reload).
describe('dev tools routes', () => {
  it('boots server twice without duplicate route errors', async () => {
    const boot = async () => {
      const app = Fastify();
      await app.register(devToolsRoutes);
      await app.ready();
      await app.close();
    };

    await boot();
    await boot();
  });
});
