import { z } from 'zod';

export const ExampleEchoSchema = z.object({
  message: z.string().min(1)
});

export type ExampleEcho = z.infer<typeof ExampleEchoSchema>;