# Testing Guide

This document provides comprehensive guidelines for testing in the Orenna backend project. Our testing strategy includes unit tests, integration tests, and end-to-end (E2E) tests to ensure code quality and reliability.

## Testing Strategy

### Test Pyramid

We follow the test pyramid approach:

1. **Unit Tests (70%)** - Fast, isolated tests for individual functions and components
2. **Integration Tests (20%)** - Tests for API endpoints and service interactions
3. **E2E Tests (10%)** - End-to-end user journey tests

### Testing Frameworks

- **Vitest** - Unit and integration testing framework
- **Playwright** - End-to-end testing framework
- **Supertest** - HTTP assertion testing
- **Faker.js** - Test data generation
- **MSW** - API mocking for tests

## Project Structure

```
apps/api/tests/
├── setup/
│   └── vitest.setup.ts        # Global test setup
├── utils/
│   ├── test-server.ts         # Test server utilities
│   ├── fixtures.ts            # Test data fixtures
│   ├── test-helpers.ts        # Common test helpers
│   └── test-db.ts             # Database test utilities
├── unit/                      # Unit tests
├── integration/               # Integration tests
│   ├── auth.integration.test.ts
│   ├── lift-tokens.integration.test.ts
│   └── payments.integration.test.ts
├── e2e/                       # E2E tests
│   ├── utils/
│   │   └── api-client.ts      # E2E API client
│   ├── auth.e2e.test.ts
│   └── api-flow.e2e.test.ts
└── security.test.ts           # Security-focused tests
```

## Running Tests

### All Tests
```bash
pnpm test:all                  # Run unit, integration, and E2E tests
```

### By Type
```bash
pnpm test                      # Unit tests only
pnpm test:unit                 # Unit tests explicitly
pnpm test:integration          # Integration tests
pnpm test:e2e                  # E2E tests
pnpm test:security             # Security tests
```

### With Coverage
```bash
pnpm test:coverage             # Run tests with coverage report
```

### Watch Mode
```bash
pnpm test:watch                # Run tests in watch mode
```

### E2E Options
```bash
pnpm test:e2e:headed           # Run E2E tests in headed mode (visible browser)
```

## Writing Tests

### Unit Tests

Unit tests should test individual functions or components in isolation.

```typescript
import { describe, it, expect } from 'vitest';
import { htmlEncode } from '../src/utils/security';

describe('Security Utils', () => {
  describe('htmlEncode', () => {
    it('should encode HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      expect(htmlEncode(input)).toBe(expected);
    });
  });
});
```

### Integration Tests

Integration tests test API endpoints and service interactions.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestServer } from '../utils/test-server';
import { expectSuccessResponse } from '../utils/test-helpers';
import authRoutes from '../../src/routes/auth';

describe('Auth Integration Tests', () => {
  let testServer: TestServer;

  beforeAll(async () => {
    testServer = new TestServer({ includeAuth: true });
    await testServer.setup();
    await testServer.app.register(authRoutes);
  });

  afterAll(async () => {
    await testServer.teardown();
  });

  it('should return nonce', async () => {
    const response = await testServer.app.inject({
      method: 'GET',
      url: '/auth/nonce',
    });

    expectSuccessResponse(response);
    const body = response.json();
    expect(body.nonce).toBeTruthy();
  });
});
```

### E2E Tests

E2E tests test complete user workflows using Playwright.

```typescript
import { test, expect } from '@playwright/test';
import { ApiClient } from './utils/api-client';

test.describe('Authentication E2E Tests', () => {
  let apiClient: ApiClient;

  test.beforeEach(async () => {
    apiClient = await ApiClient.create();
  });

  test.afterEach(async () => {
    await apiClient.dispose();
  });

  test('complete authentication flow', async () => {
    const { nonce } = await apiClient.getNonce();
    expect(nonce).toBeTruthy();

    const authResponse = await apiClient.authenticate();
    expect(authResponse.ok()).toBeTruthy();
  });
});
```

## Test Utilities

### TestServer

The `TestServer` class provides a configured Fastify instance for testing:

```typescript
const testServer = new TestServer({
  includeAuth: true,      // Include JWT authentication
  includeWebsocket: false, // Include WebSocket support
  includeSecurity: false,  // Include security plugins
  mockPrisma: true,       // Use mock Prisma client
});
```

### Fixtures

Use fixtures for consistent test data:

```typescript
import { createMockUser, createMockLiftToken } from '../utils/fixtures';

const user = createMockUser();
const liftToken = createMockLiftToken({ ownerAddress: user.address });
```

### Test Helpers

Common assertion helpers:

```typescript
import { 
  expectSuccessResponse, 
  expectErrorResponse, 
  expectValidEthereumAddress 
} from '../utils/test-helpers';

expectSuccessResponse(response, 200);
expectErrorResponse(response, 400, 'Validation error');
expectValidEthereumAddress('0x1234567890123456789012345678901234567890');
```

### Database Testing

For tests requiring a real database:

```typescript
import { setupTestDatabaseHooks } from '../utils/test-db';

describe('Database Tests', () => {
  const getTestDb = setupTestDatabaseHooks();

  it('should interact with database', async () => {
    const testDb = getTestDb();
    const prisma = testDb.getPrismaClient();
    
    // Use real database operations
    const user = await prisma.user.create({ data: userData });
    expect(user.id).toBeTruthy();
  });
});
```

## Best Practices

### General

1. **Descriptive Names** - Test names should clearly describe what is being tested
2. **Arrange-Act-Assert** - Structure tests with clear setup, execution, and verification
3. **Isolation** - Tests should be independent and not rely on other tests
4. **Fast Execution** - Keep tests fast to enable quick feedback loops
5. **Deterministic** - Tests should produce consistent results

### Unit Tests

1. **Mock Dependencies** - Use mocks for external dependencies
2. **Test Edge Cases** - Include boundary conditions and error scenarios
3. **Single Responsibility** - Each test should verify one specific behavior
4. **No Network Calls** - Unit tests should not make real network requests

### Integration Tests

1. **Test Real Interactions** - Use actual services and databases when possible
2. **Test Happy Path** - Verify successful scenarios work end-to-end
3. **Test Error Scenarios** - Verify error handling and edge cases
4. **Clean Up** - Reset state between tests

### E2E Tests

1. **User-Centric** - Focus on user workflows and business scenarios
2. **Stable Selectors** - Use reliable selectors for UI elements
3. **Minimal UI Dependencies** - Prefer API testing over UI testing where possible
4. **Parallel Execution** - Design tests to run independently in parallel

## Mocking

### Prisma Client

```typescript
const mockPrisma = {
  user: {
    findUnique: vi.fn().mockResolvedValue(mockUser),
    create: vi.fn().mockResolvedValue(createdUser),
  },
};
```

### External APIs

Use MSW for mocking external API calls:

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('https://api.example.com/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked' }));
  })
);
```

### Environment Variables

```typescript
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
```

## Test Data Management

### Fixtures

Create reusable test data using Faker.js:

```typescript
export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  address: faker.finance.ethereumAddress().toLowerCase(),
  ensName: faker.internet.domainName(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});
```

### Database Seeding

For integration tests requiring specific data:

```typescript
await testDb.seed({
  users: [createMockUser(), createMockUser()],
  liftTokens: [createMockLiftToken(), createMockLiftToken()],
});
```

## Coverage

We maintain high test coverage standards:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

View coverage reports:
```bash
pnpm test:coverage
open coverage/index.html  # View detailed HTML report
```

## CI/CD Integration

Tests run automatically in our CI/CD pipeline:

1. **Lint & Type Check** - Code quality validation
2. **Unit Tests** - Fast feedback on individual components
3. **Integration Tests** - API and service interaction validation
4. **E2E Tests** - Full workflow validation
5. **Security Tests** - Security vulnerability scanning
6. **Performance Tests** - Basic performance validation

## Debugging Tests

### Vitest

```bash
pnpm test:watch                    # Watch mode with hot reload
pnpm test -- --reporter=verbose   # Detailed test output
```

### Playwright

```bash
pnpm test:e2e:headed              # Run with visible browser
pnpm test:e2e -- --debug          # Debug mode
```

### VS Code Integration

Install the Vitest and Playwright extensions for VS Code to run and debug tests directly in the editor.

## Performance Testing

Basic performance tests are included in the CI pipeline. For more comprehensive performance testing:

1. Use tools like `k6` or `artillery` for load testing
2. Monitor response times and throughput
3. Test with realistic data volumes
4. Profile database queries and optimize as needed

## Security Testing

Security tests are integrated into the test suite:

1. **Input Validation** - Test XSS, SQL injection, and other injection attacks
2. **Authentication** - Verify JWT handling and session management
3. **Authorization** - Test access controls and permissions
4. **Rate Limiting** - Verify rate limiting mechanisms
5. **Headers** - Validate security headers

## Common Issues

### Database Connection Errors

Ensure the test database is running and accessible:
```bash
docker run --name test-postgres -e POSTGRES_PASSWORD=test -d -p 5432:5432 postgres:15
```

### Port Conflicts

E2E tests start a server on port 3001. Ensure this port is available or configure a different port in the test configuration.

### Flaky Tests

For intermittent test failures:
1. Add appropriate wait conditions
2. Use deterministic test data
3. Avoid time-dependent assertions
4. Ensure proper cleanup between tests

## Contributing

When adding new features:

1. Write tests before implementing (TDD)
2. Ensure tests cover both success and error cases
3. Update this documentation if adding new testing patterns
4. Verify all tests pass before submitting PR

For questions or issues with testing, consult the team or refer to the framework documentation:
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)