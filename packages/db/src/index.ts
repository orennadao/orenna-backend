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
  LiftUnit,
  LiftUnitEvent,
  Contract,
  MintRequest,
  MintRequestEvent,
  Payment,
  PaymentEvent,
  IndexedEvent,
  IndexerState,
  ProjectPaymentConfig,
  
  // Verification models (added to schema)
  VerificationMethod,
  VerificationResult,
  EvidenceFile,
  
  // Note: Only export types that actually exist in schema.prisma
} from '@prisma/client';

// Re-export only enums that actually exist in the schema
export {
  // These enums are defined in schema.prisma
  MintRequestStatus,
  MintRequestEventType,
  PaymentType,
  PaymentStatus,
  PaymentEventType,
  
  // Verification enum (added to schema)
  VerificationStatus,
  
  // Note: Add other enums as they are defined in schema.prisma
} from '@prisma/client';