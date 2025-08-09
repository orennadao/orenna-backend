import { FastifyInstance } from 'fastify';
import { ExampleEchoSchema } from '@orenna/shared/src/schemas';

export default async function routes(app: FastifyInstance) {
  app.post('/example/echo', {
    schema: {
      body: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message']
      }
    }
  }, async (req, reply) => {
    const parse = ExampleEchoSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    return { echoed: parse.data.message };
  });
}