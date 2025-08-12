import { z } from 'zod';

export const ExampleEchoSchema = z.object({
  message: z.string().min(1)
});

export type ExampleEcho = z.infer<typeof ExampleEchoSchema>;

export const SiweVerifySchema = z.object({
  message: z.string(),
  signature: z.string()
});

export type SiweVerify = z.infer<typeof SiweVerifySchema>;