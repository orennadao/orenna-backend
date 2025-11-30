// apps/api/src/lib/schemas.ts
import { z } from "zod";

/** Loose ETH address validator (0x + 40 hex chars). Tighten with checksum if desired. */
export const ethAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

/** Coerce numeric strings to a positive number (rejects 0/NaN/negatives). */
export const positiveNumber = z.preprocess(
  (v) => (typeof v === "string" ? Number(v) : v),
  z.number().positive()
);

/** Coerce numeric strings to a positive integer (rejects 0/NaN/negatives). */
export const positiveInt = z.preprocess(
  (v) => (typeof v === "string" ? Number.parseInt(v as string, 10) : v),
  z.number().int().positive()
);

/** Parse a flexible meta field (stringified JSON or object) into a plain object. */
export function parseMeta(input: unknown): Record<string, any> {
  if (typeof input === "string") {
    try {
      const v = JSON.parse(input);
      return typeof v === "object" && v !== null ? (v as Record<string, any>) : {};
    } catch {
      return {};
    }
  }
  if (typeof input === "object" && input !== null) return input as Record<string, any>;
  return {};
}

/** Zod helper for meta payloads; coerces string→object using parseMeta. */
export const Meta = z.union([z.string(), z.record(z.any())]);

/** Common slug (URL-safe) validator. */
export const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9-]+$/i, "slug must be URL-safe (letters, numbers, hyphens)");

/**
 * Payload for issuing/mint-like actions.
 * Requires a recipient (to/toAddress) and a quantity or amount.
 */
export const issuePayloadSchema = z
  .object({
    projectId: z.string().min(1, "projectId is required"),
    // recipient
    to: ethAddress.optional(),
    toAddress: ethAddress.optional(),
    // if using ERC-1155 classes
    tokenId: positiveInt.optional(),
    // quantity/amount
    quantity: positiveInt.optional(),
    amount: positiveNumber.optional(),
    // metadata
    meta: Meta.optional(),
    // optional memo/reference
    memo: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.to || v.toAddress), {
    message: "recipient is required (to or toAddress)",
    path: ["to"],
  })
  .refine((v) => Boolean(v.quantity || v.amount), {
    message: "quantity or amount is required",
    path: ["quantity"],
  });

/**
 * Payload for retiring/burning previously issued units.
 * No recipient; requires quantity or amount and identifies the project/token.
 */
export const retirePayloadSchema = z
  .object({
    projectId: z.string().min(1, "projectId is required"),
    // if using ERC-1155 classes
    tokenId: positiveInt.optional(),
    // quantity/amount (support either key)
    quantity: positiveInt.optional(),
    amount: positiveNumber.optional(),
    // optional metadata and memo (e.g., beneficiary, justification)
    meta: Meta.optional(),
    memo: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.quantity || v.amount), {
    message: "quantity or amount is required",
    path: ["quantity"],
  });

/**
 * Project create/update schemas.
 * Adjust fields to mirror your actual Project model (e.g., Prisma).
 */
export const ProjectCreate = z.object({
  name: z.string().min(1),
  slug,
  description: z.string().max(2000).optional(),
  status: z.enum(['pending', 'active', 'completed']).default('pending'),
  ownerAddress: ethAddress.optional(),
  chainId: z.number().int().optional(),
  meta: Meta.optional(),
});

export const ProjectUpdate = ProjectCreate.partial().extend({
  id: z.string().min(1), // use z.string().uuid() if your ids are UUIDs
});

/** Helpful TS types */
export type IssuePayload = z.infer<typeof issuePayloadSchema>;
export type RetirePayload = z.infer<typeof retirePayloadSchema>;
export type ProjectCreateInput = z.infer<typeof ProjectCreate>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdate>;
