import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomBytes } from "crypto";

export class TestDatabase {
  private prisma: PrismaClient;
  private databaseUrl: string;
  private testDbName: string;

  constructor() {
    this.testDbName = `test_db_${randomBytes(8).toString('hex')}`;
    this.databaseUrl = this.generateTestDatabaseUrl();
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
    });
  }

  private generateTestDatabaseUrl(): string {
    const baseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/orenna_test";
    const url = new URL(baseUrl);
    url.pathname = `/${this.testDbName}`;
    return url.toString();
  }

  async setup() {
    try {
      // Create test database
      await this.createDatabase();
      
      // Run migrations
      await this.runMigrations();
      
      // Connect Prisma client
      await this.prisma.$connect();
      
      console.log(`Test database setup complete: ${this.testDbName}`);
    } catch (error) {
      console.error("Failed to setup test database:", error);
      throw error;
    }
  }

  async teardown() {
    try {
      // Disconnect Prisma client
      await this.prisma.$disconnect();
      
      // Drop test database
      await this.dropDatabase();
      
      console.log(`Test database cleanup complete: ${this.testDbName}`);
    } catch (error) {
      console.error("Failed to teardown test database:", error);
      // Don't throw here to avoid masking test failures
    }
  }

  async reset() {
    try {
      // Clear all data in correct order to handle foreign key constraints
      await this.clearAllTables();
      
      console.log("Test database reset complete");
    } catch (error) {
      console.error("Failed to reset test database:", error);
      throw error;
    }
  }

  private async createDatabase() {
    const baseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/orenna_test";
    const url = new URL(baseUrl);
    const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`;
    
    try {
      // Use psql to create database if PostgreSQL
      if (url.protocol === 'postgresql:') {
        execSync(`psql "${adminUrl}" -c "CREATE DATABASE ${this.testDbName};"`, {
          stdio: 'ignore'
        });
      } else {
        // For SQLite or other databases, Prisma will create the file
        console.log("Database will be created by Prisma migrations");
      }
    } catch (error) {
      // Database might already exist, continue
      console.warn("Database creation warning:", error);
    }
  }

  private async dropDatabase() {
    const baseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/orenna_test";
    const url = new URL(baseUrl);
    
    try {
      if (url.protocol === 'postgresql:') {
        const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`;
        execSync(`psql "${adminUrl}" -c "DROP DATABASE IF EXISTS ${this.testDbName};"`, {
          stdio: 'ignore'
        });
      }
    } catch (error) {
      console.warn("Database drop warning:", error);
    }
  }

  private async runMigrations() {
    try {
      // Set the test database URL for migrations
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = this.databaseUrl;
      
      // Run Prisma migrations
      execSync('npx prisma migrate deploy', {
        stdio: 'ignore',
        cwd: process.cwd(),
      });
      
      // Restore original URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      }
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  private async clearAllTables() {
    // Clear tables in order to handle foreign key constraints
    const tableOrder = [
      'Payment',
      'MintRequest', 
      'LiftToken',
      'User',
    ];

    for (const table of tableOrder) {
      try {
        await this.prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
      } catch (error) {
        console.warn(`Warning clearing table ${table}:`, error);
      }
    }
    
    // Reset sequences for PostgreSQL
    try {
      await this.prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), 1, false)`;
    } catch (error) {
      // Ignore sequence reset errors (might not be PostgreSQL)
    }
  }

  // Helper methods for test data setup
  async seed(fixtures: any) {
    try {
      // Insert users first (no dependencies)
      if (fixtures.users) {
        for (const user of fixtures.users) {
          await this.prisma.user.create({ data: user });
        }
      }

      // Insert lift tokens (depends on users)
      if (fixtures.liftTokens) {
        for (const liftToken of fixtures.liftTokens) {
          await this.prisma.liftToken.create({ data: liftToken });
        }
      }

      // Insert mint requests (depends on users and lift tokens)
      if (fixtures.mintRequests) {
        for (const mintRequest of fixtures.mintRequests) {
          await this.prisma.mintRequest.create({ data: mintRequest });
        }
      }

      // Insert payments (depends on users)
      if (fixtures.payments) {
        for (const payment of fixtures.payments) {
          await this.prisma.payment.create({ data: payment });
        }
      }

      console.log("Test database seeded with fixtures");
    } catch (error) {
      console.error("Failed to seed test database:", error);
      throw error;
    }
  }

  // Getters
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  getDatabaseUrl(): string {
    return this.databaseUrl;
  }

  getDatabaseName(): string {
    return this.testDbName;
  }
}

// Global test database instance
let globalTestDb: TestDatabase | null = null;

export async function setupGlobalTestDatabase() {
  if (!globalTestDb) {
    globalTestDb = new TestDatabase();
    await globalTestDb.setup();
  }
  return globalTestDb;
}

export async function teardownGlobalTestDatabase() {
  if (globalTestDb) {
    await globalTestDb.teardown();
    globalTestDb = null;
  }
}

export function getGlobalTestDatabase(): TestDatabase {
  if (!globalTestDb) {
    throw new Error("Global test database not initialized. Call setupGlobalTestDatabase() first.");
  }
  return globalTestDb;
}

// Vitest setup hooks
export function setupTestDatabaseHooks() {
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = new TestDatabase();
    await testDb.setup();
  });

  afterAll(async () => {
    if (testDb) {
      await testDb.teardown();
    }
  });

  beforeEach(async () => {
    if (testDb) {
      await testDb.reset();
    }
  });

  return () => testDb;
}