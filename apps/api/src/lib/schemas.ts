import { z } from 'zod';

export const isoDate = z.string().datetime().optional();

export const issuePayloadSchema = z.object({
  txId: z.string().min(1),
  at: isoDate,
  meta: z.any().optional(),
});

export const retirePayloadSchema = z.object({
  txId: z.string().min(1),
  reason: z.string().min(1).optional(),
  at: isoDate,
  meta: z.any().optional(),
});

// store as string since SQLite schema uses TEXT for meta/payload
export function parseMeta(input: unknown): string | null {
  if (input == null) return null;
  try {
    if (typeof input === 'string') return JSON.stringify(JSON.parse(input));
    return JSON.stringify(input);
  } catch {
    return typeof input === 'string' ? input : JSON.stringify(input);
  }
}
export const LiftUnitCreate = z.object({
  status: z.string().default('DRAFT'),
  quantity: z.string().optional(),   // SQLite Decimal -> string
  unit: z.string().optional(),
  meta: z.any().optional(),          // stored stringified
});

export const LiftUnitUpdate = z.object({
  status: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  meta: z.any().optional(),
  issuedAt: z.string().datetime().optional(),
  retiredAt: z.string().datetime().optional(),
});