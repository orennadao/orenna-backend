import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: ['error', 'warn']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}

// Re-export Prisma Client and all types/enums
export { PrismaClient } from '@prisma/client';

// Re-export all Prisma types and enums that are used across the API
export type {
  // Models that exist in the schema
  User,
  Session,
  Project,
  // LiftUnit, // Commented out - schema mismatch between packages/db and apps/api
  // LiftUnitEvent, // Commented out - schema mismatch
  Contract,
  MintRequest,
  MintRequestEvent,
  Payment,
  PaymentEvent,
  IndexedEvent,
  IndexerState,
  ProjectPaymentConfig,
  
  // Verification models (temporarily commented out)
  // VerificationMethod, // Commented out - schema mismatch
  // VerificationResult, // Commented out - schema mismatch
  // EvidenceFile, // Commented out - schema mismatch
  
  // Note: Only export types that actually exist in schema.prisma
} from '@prisma/client';

// Re-export only enums that actually exist in the schema
export {
  // These enums are defined in schema.prisma
  // MintRequestStatus, // Commented out - schema mismatch
  // MintRequestEventType, // Commented out - schema mismatch
  PaymentType,
  PaymentStatus,
  PaymentEventType,
  
  // Verification enum (commented out temporarily)
  // VerificationStatus, // Commented out - schema mismatch
  
  // Note: Add other enums as they are defined in schema.prisma
} from '@prisma/client';