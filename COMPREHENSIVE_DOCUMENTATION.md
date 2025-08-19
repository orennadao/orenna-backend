# Orenna DAO - Comprehensive System Documentation

**Version:** 1.0  
**Last Updated:** August 17, 2025  
**Author:** System Analysis  

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Core Modules & Services](#core-modules--services)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Database Schema & Models](#database-schema--models)
6. [Frontend Architecture](#frontend-architecture)
7. [Smart Contracts](#smart-contracts)
8. [Workflows & Data Flows](#workflows--data-flows)
9. [Development Setup](#development-setup)
10. [Testing Strategy](#testing-strategy)
11. [Security Considerations](#security-considerations)
12. [Deployment & Infrastructure](#deployment--infrastructure)
13. [Performance & Monitoring](#performance--monitoring)
14. [Future Roadmap](#future-roadmap)

---

## Project Overview

Orenna DAO is a comprehensive regenerative finance platform that tokenizes verified ecosystem improvements through "Lift Tokens" and enables sustainable project funding through the "Lift Forward" system. The platform combines blockchain technology, environmental verification, and traditional finance workflows to create a complete ecosystem for regenerative projects.

### Core Value Proposition

- **Verified Environmental Impact**: Tokenize measurable ecosystem improvements through rigorous verification protocols
- **Sustainable Finance**: Enable upfront project funding with outcome-based repayment structures
- **Governance & Transparency**: DAO-governed platform with complete audit trails and transparency
- **Multi-stakeholder Coordination**: Coordinate vendors, project managers, treasurers, and beneficiaries

### Key Features

- **Lift Tokens (ERC-1155)**: NFTs representing verified ecosystem improvements
- **Lift Forward Finance**: Upfront funding system with dual-cap repayment structure
- **Verification System**: Multi-methodology ecosystem measurement and verification
- **RBAC Finance System**: Role-based access control for financial operations
- **Governance**: Full DAO governance with tokenized voting
- **Real-time Analytics**: Comprehensive dashboards and reporting

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Fastify)     │◄──►│   (Ethereum)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   Database      │
                       │   (PostgreSQL)  │
                       └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   External      │
                       │   Services      │
                       │   (IPFS, etc.)  │
                       └─────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- React 18 with TypeScript
- TailwindCSS for styling
- Wagmi + Viem for Web3 integration
- React Query for state management
- Chart.js for analytics visualization

**Backend:**
- Fastify (Node.js) API server
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Vitest for testing
- Bull for job queues
- SIWE for authentication

**Blockchain:**
- Solidity smart contracts
- Foundry for development & testing
- OpenZeppelin libraries
- Multi-chain support (Ethereum, Polygon, etc.)

**Infrastructure:**
- Docker for containerization
- IPFS for decentralized storage
- Redis for caching and queues
- Monitoring with Prometheus/Grafana

### Monorepo Structure

```
orenna-backend/
├── apps/
│   ├── api/                 # Fastify API server
│   └── web/                 # Next.js frontend
├── packages/
│   ├── db/                  # Prisma database layer
│   ├── shared/              # Shared utilities
│   ├── ui/                  # React component library
│   ├── api-client/          # API client library
│   └── config/              # Shared configuration
├── contracts/               # Smart contracts (Foundry)
└── docs/                    # Documentation
```

---

## Core Modules & Services

### 1. Authentication & Authorization

**File:** `apps/api/src/routes/auth.ts`

**Features:**
- SIWE (Sign-In with Ethereum) authentication
- JWT-based session management
- Nonce-based security
- Role-based access control (RBAC)

**Flow:**
1. User requests nonce
2. User signs SIWE message with wallet
3. Server verifies signature and domain
4. Session JWT created and stored in secure cookie
5. Subsequent requests use JWT for authorization

### 2. Payment Processing System

**File:** `apps/api/src/lib/payment.ts`

**Capabilities:**
- Multi-type payment processing (Lift Token purchases, project funding, repayments)
- Escrow contract integration
- Payment status tracking
- Blockchain transaction monitoring
- Event-driven payment lifecycle

**Payment Types:**
- `LIFT_TOKEN_PURCHASE`: Direct purchase of verified ecosystem tokens
- `PROJECT_FUNDING`: Upfront funding for regenerative projects
- `REPAYMENT`: Repayments to funders based on outcomes
- `PLATFORM_FEE`: Platform service fees
- `STEWARD_PAYMENT`: Payments to project stewards

### 3. Blockchain Integration

**File:** `apps/api/src/lib/blockchain.ts`

**Features:**
- Multi-chain support (Ethereum, Polygon, Arbitrum)
- Contract interaction utilities
- Event indexing and monitoring
- Transaction management
- Wallet client configuration

**Supported Contracts:**
- Governance Token (ORNA)
- Lift Tokens (ERC-1155)
- Method Registry
- Allocation & Repayment Escrows
- Governor & Timelock contracts

### 4. Verification System

**File:** `apps/api/src/lib/verification.ts`

**Components:**
- Multi-methodology verification framework
- Evidence upload and validation pipeline
- IPFS integration for evidence storage
- Confidence scoring algorithms
- Batch verification processing

**Verification Methods:**
- VWBA (Voluntary Water Benefit Accounting)
- VCS (Verified Carbon Standard)
- Gold Standard
- Custom methodologies

### 5. Finance & Accounting

**Files:** `apps/api/src/lib/finance/`, `routes/finance-*`

**Core Features:**
- Double-entry accounting ledger
- Vendor management with KYC/compliance
- Invoice processing and approval workflows
- Budget line tracking (WBS)
- Contract and purchase order management
- Payment disbursement system
- Retention and escrow management

**RBAC Roles:**
- **Vendor**: Submit invoices and view payments
- **Project Manager**: Create budgets, verify work, approve ≤ limit
- **Finance Reviewer**: Compliance checks, GL coding
- **Treasurer**: Release payments, manage payment runs
- **DAO Multisig**: Co-sign large disbursements
- **Auditor**: Read-only access to all financial data

### 6. Governance System

**File:** `apps/api/src/lib/governance.ts`

**Features:**
- On-chain proposal creation and voting
- Vote delegation management
- Governance parameter tracking
- Proposal lifecycle management
- Timelock integration for execution delays

**Proposal Types:**
- Standard governance proposals
- Ecosystem parameter changes
- Method registry updates
- Protocol upgrades
- Treasury allocations
- Emergency proposals

### 7. Analytics & Reporting

**File:** `apps/api/src/routes/analytics.ts`

**Capabilities:**
- Real-time payment analytics
- Blockchain event monitoring
- Verification metrics
- Governance participation tracking
- Financial reporting dashboards
- Export functionality (CSV, PDF)

### 8. White-Label System

**File:** `apps/api/src/lib/white-label.ts`

**Features:**
- Multi-tenant organization support
- Custom branding and workflows
- API usage tracking and billing
- Isolated verification methods
- Organization-specific reporting

---

## API Endpoints Reference

### Authentication Endpoints

```
GET  /auth/nonce           # Generate authentication nonce
POST /auth/verify          # Verify SIWE signature and create session
POST /auth/logout          # Clear session
GET  /auth/session         # Get current session info
```

### Project Management

```
GET    /api/projects                    # List projects
POST   /api/projects                    # Create new project
GET    /api/projects/:id                # Get project details
PUT    /api/projects/:id                # Update project
DELETE /api/projects/:id                # Delete project
GET    /api/projects/:id/analytics      # Project analytics
```

### Lift Tokens & Verification

```
GET    /api/lift-tokens                 # List lift tokens
POST   /api/lift-tokens                 # Create lift token
GET    /api/lift-tokens/:id             # Get lift token details
PUT    /api/lift-tokens/:id             # Update lift token
POST   /api/lift-tokens/:id/verify      # Submit verification
POST   /api/lift-tokens/batch-verify    # Batch verification
GET    /api/verification/methods        # List verification methods
```

### Payment & Finance

```
POST   /api/payments/initiate           # Initiate payment
GET    /api/payments                    # List payments
GET    /api/payments/:id                # Payment details
POST   /api/payments/:id/notify         # Notify proceeds received
GET    /api/finance/vendors             # List vendors
POST   /api/finance/vendors             # Create vendor
GET    /api/finance/contracts           # List contracts
POST   /api/finance/contracts           # Create contract
GET    /api/finance/invoices            # List invoices
POST   /api/finance/invoices            # Submit invoice
PUT    /api/finance/invoices/:id/approve # Approve invoice
POST   /api/finance/disbursements       # Create disbursement
```

### Governance

```
GET    /api/governance/proposals        # List proposals
POST   /api/governance/proposals        # Create proposal
GET    /api/governance/proposals/:id    # Proposal details
POST   /api/governance/proposals/:id/vote # Vote on proposal
GET    /api/governance/tokens           # Token holdings
POST   /api/governance/delegate         # Delegate voting power
GET    /api/governance/parameters       # Governance parameters
```

### Analytics & Reporting

```
GET    /api/analytics/payments          # Payment analytics
GET    /api/analytics/blockchain        # Blockchain analytics
GET    /api/analytics/verification      # Verification metrics
GET    /api/analytics/governance        # Governance metrics
POST   /api/analytics/export            # Export data
```

### Administrative

```
GET    /api/roles                       # List user roles
POST   /api/roles/assign               # Assign role
DELETE /api/roles/:id                  # Revoke role
GET    /api/audit                      # Audit trail
GET    /api/cost-tracking              # Cost tracking
GET    /api/websocket                  # WebSocket status
```

---

## Database Schema & Models

### Core Entity Relationships

```
User ──┬── ProjectRole ──── Project ──┬── LiftToken ──── VerificationResult
       │                              │
       ├── SystemRole                 ├── Payment ──── PaymentEvent
       │                              │
       ├── GovernanceToken            ├── FundingBucket ──── LedgerEntry
       │                              │
       └── Session                    └── Contract ──── Invoice ──── Disbursement
```

### Key Models

**User & Authentication:**
- `User`: Core user entity with Ethereum address
- `Session`: JWT-based session management
- `ProjectRole`/`SystemRole`: RBAC implementation

**Project & Finance:**
- `Project`: Core project entity
- `FundingBucket`: Lift Forward account buckets
- `BudgetLine`: Work breakdown structure
- `Contract`: Contracts and purchase orders
- `Invoice`: Invoice processing and approval
- `Disbursement`: Payment execution

**Tokens & Verification:**
- `LiftToken`: ERC-1155 token representation
- `VerificationMethod`: Methodology registry
- `VerificationResult`: Verification outcomes
- `EvidenceFile`: Supporting evidence storage

**Payments & Blockchain:**
- `Payment`: Payment lifecycle tracking
- `IndexedEvent`: Blockchain event indexing
- `IndexerState`: Blockchain sync state

**Governance:**
- `GovernanceProposal`: On-chain proposals
- `GovernanceVote`: Individual votes
- `GovernanceParameter`: Platform parameters

### Data Integrity Features

- **Immutable Audit Trail**: All changes tracked with event sourcing
- **Double-Entry Accounting**: Financial integrity with reconciliation
- **Cryptographic Hashing**: Evidence and document integrity
- **Foreign Key Constraints**: Referential integrity enforcement
- **Transaction Isolation**: ACID compliance for financial operations

---

## Frontend Architecture

### Component Structure

```
src/
├── app/                     # Next.js App Router pages
│   ├── dashboard/          # Main dashboard
│   ├── projects/           # Project management
│   ├── payments/           # Payment workflows
│   ├── governance/         # DAO governance
│   ├── analytics/          # Analytics dashboard
│   └── verification/       # Verification workflows
├── components/
│   ├── auth/               # Authentication components
│   ├── payments/           # Payment forms and lists
│   ├── projects/           # Project management UI
│   ├── verification/       # Verification wizards
│   ├── governance/         # Governance UI
│   ├── analytics/          # Charts and dashboards
│   ├── providers/          # Context providers
│   └── ui/                 # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
└── types/                  # TypeScript type definitions
```

### State Management

**React Query:** API state management with caching, optimistic updates, and automatic refetching

**React Context:** Global state for:
- Authentication state
- Web3 wallet connection
- WebSocket real-time updates
- Governance data

**Local State:** Component-level state with React hooks

### Key Frontend Features

**Responsive Design:**
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Progressive enhancement

**Real-time Updates:**
- WebSocket integration for live data
- Optimistic UI updates
- Background data synchronization

**Web3 Integration:**
- Wallet connection with multiple providers
- Transaction signing and monitoring
- Contract interaction utilities

**Performance Optimization:**
- Code splitting and lazy loading
- Image optimization
- Bundle analysis and optimization

---

## Smart Contracts

### Contract Architecture

```
MethodRegistry ──── LiftTokens ──── AllocationEscrow ──── RepaymentEscrow
     │                   │              │                      │
     │                   │              │                      │
 Governance         ERC-1155       MAW Sales              Dual-Cap
 Methods           Verified       Management             Waterfall
                  Issuance
```

### Core Contracts

**1. MethodRegistry.sol**
- Governance for ecosystem measurement methods
- Version control and approval workflows
- Technical committee and DAO approval
- Method specification storage

**2. LiftTokens.sol**
- ERC-1155 multi-token standard
- Verified issuance with EIP-712 signatures
- Issuance band system (target/min/max)
- Role-based access control

**3. RepaymentEscrow.sol**
- Dual-cap repayment waterfall
- Funder cap protection
- Platform fee management
- Proceeds distribution automation

**4. AllocationEscrow.sol**
- Market Allocation Window (MAW) management
- Fair allocation mechanisms
- Integration with Hamilton allocator

**5. OrennaGovernanceToken.sol**
- ERC-20 governance token with voting
- Delegation support
- Snapshot-based voting power

**6. OrennaGovernor.sol**
- OpenZeppelin Governor implementation
- Proposal creation and voting
- Timelock integration
- Quorum and threshold management

**7. OrennaTimelock.sol**
- TimelockController for execution delays
- Multi-signature requirements
- Emergency functions

### Contract Features

**Security:**
- Role-based access control
- Reentrancy guards
- Safe math operations
- Comprehensive test coverage

**Upgradeability:**
- Proxy pattern for upgradeable contracts
- Migration utilities
- Version tracking

**Integration:**
- Event emission for off-chain indexing
- Standard interfaces (ERC-165)
- Cross-contract communication

---

## Workflows & Data Flows

### 1. Project Creation & Funding Flow

```
1. Project Creation
   ├── Project Manager creates project
   ├── Sets up funding bucket (Lift Forward account)
   ├── Defines budget lines (WBS structure)
   └── Configures approval matrix

2. Vendor Onboarding
   ├── Vendor registration and KYC
   ├── Document upload (W-9/W-8, COI, etc.)
   ├── Banking information setup
   └── Compliance verification

3. Contract Creation
   ├── Project Manager creates contract/PO
   ├── Budget allocation to contract
   ├── Approval workflow execution
   └── Contract execution

4. Work Execution & Invoicing
   ├── Vendor performs work
   ├── Submit invoice with documentation
   ├── Multi-level approval process
   └── Payment disbursement
```

### 2. Verification & Tokenization Flow

```
1. Project Implementation
   ├── Environmental work completion
   ├── Data collection and measurement
   ├── Evidence gathering
   └── Quality assurance

2. Verification Submission
   ├── Select verification methodology
   ├── Upload evidence files to IPFS
   ├── Submit verification request
   └── Validator assignment

3. Verification Process
   ├── Evidence validation pipeline
   ├── Methodology-specific calculations
   ├── Confidence scoring
   └── Verification result

4. Token Issuance
   ├── Verified results trigger minting
   ├── ERC-1155 tokens created
   ├── On-chain metadata storage
   └── Token distribution
```

### 3. Governance & Parameter Updates

```
1. Proposal Creation
   ├── Token holder creates proposal
   ├── Technical documentation
   ├── Implementation details
   └── IPFS metadata storage

2. Voting Period
   ├── Token holders vote
   ├── Delegation support
   ├── Quorum tracking
   └── Result calculation

3. Execution
   ├── Successful proposals queued
   ├── Timelock delay
   ├── Multi-signature execution
   └── Parameter updates
```

### 4. Payment & Repayment Flow

```
1. Payment Initiation
   ├── User initiates payment
   ├── Escrow contract deployment
   ├── Payment token transfer
   └── Proceeds notification

2. Fund Distribution
   ├── Dual-cap waterfall calculation
   ├── Platform fee deduction
   ├── Funder repayment (capped)
   └── Excess to steward/pool

3. Token Retirement
   ├── Beneficiary retires tokens
   ├── Receipt generation
   ├── Traceability records
   └── Impact reporting
```

---

## Development Setup

### Prerequisites

- Node.js 18+ with pnpm
- Docker and Docker Compose
- PostgreSQL 14+
- Git

### Environment Setup

1. **Clone repository:**
```bash
git clone https://github.com/orenna/orenna-backend.git
cd orenna-backend
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Environment configuration:**
```bash
cp .env.sample .env
# Edit .env with your configuration
```

4. **Database setup:**
```bash
docker compose up -d db
pnpm db:migrate
pnpm db:seed
```

5. **Start development servers:**
```bash
# Start API server
pnpm dev

# Start web frontend (separate terminal)
pnpm dev:web

# Start both concurrently
pnpm dev:all
```

### Key Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# API Configuration
API_HOST="localhost"
API_PORT=3000
API_CORS_ORIGIN="http://localhost:3000"

# Authentication
JWT_SECRET="your-jwt-secret"
SIWE_DOMAIN="localhost"
SIWE_ORIGIN="http://localhost:3000"
SIWE_SESSION_TTL=86400

# Blockchain
MINTER_PRIVATE_KEY="0x..."
RPC_URL_MAINNET="https://..."
RPC_URL_SEPOLIA="https://..."

# External Services
IPFS_GATEWAY_URL="https://ipfs.io"
REDIS_URL="redis://localhost:6379"
```

### Development Workflow

1. **Feature Development:**
   - Create feature branch from `main`
   - Implement changes with tests
   - Run test suite: `pnpm test`
   - Submit pull request

2. **Database Changes:**
   - Create migration: `pnpm db:migrate`
   - Update seed data if needed
   - Test migration rollback

3. **Smart Contract Development:**
   - Use Foundry for development
   - Write comprehensive tests
   - Deploy to testnet
   - Integration testing

---

## Testing Strategy

### Test Pyramid Implementation

**Unit Tests (70%):**
- Individual function testing
- Service layer testing
- Component testing
- Mock external dependencies

**Integration Tests (20%):**
- API endpoint testing
- Database integration
- Service interaction testing
- Contract integration

**E2E Tests (10%):**
- User journey testing
- Cross-system workflows
- Performance testing
- Security testing

### Testing Frameworks & Tools

**Backend Testing:**
```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:security

# Coverage reporting
pnpm test:coverage
```

**Frontend Testing:**
- Vitest for unit/integration tests
- React Testing Library for components
- Playwright for E2E testing
- Storybook for component documentation

**Smart Contract Testing:**
- Foundry test suite
- Fuzzing and property testing
- Gas optimization testing
- Security audit preparation

### Test Data Management

**Fixtures & Factories:**
- Faker.js for realistic test data
- Database seeding utilities
- Isolated test environments

**Test Database:**
- Separate test database
- Transaction rollback between tests
- Clean state guarantees

---

## Security Considerations

### Authentication & Authorization

**SIWE Implementation:**
- Nonce-based replay protection
- Domain and origin validation
- Secure cookie configuration
- Session timeout management

**RBAC System:**
- Principle of least privilege
- Role-based endpoint protection
- Dynamic permission checking
- Audit trail for role changes

### Input Validation & Sanitization

**Zod Schema Validation:**
- Type-safe input validation
- Custom validation rules
- Error handling and reporting
- Sanitization utilities

**XSS Protection:**
- Input sanitization
- Output encoding
- CSP headers
- Script injection prevention

### API Security

**Rate Limiting:**
- IP-based rate limiting
- Endpoint-specific limits
- Burst protection
- Graceful degradation

**Security Headers:**
- Helmet.js integration
- CSP policy enforcement
- HSTS implementation
- X-Frame-Options protection

### Smart Contract Security

**Access Control:**
- Role-based permissions
- Multi-signature requirements
- Emergency pause functionality
- Upgrade governance

**Code Quality:**
- Comprehensive test coverage
- Static analysis tools
- External security audits
- Bug bounty programs

### Data Protection

**Encryption:**
- Data at rest encryption
- TLS for data in transit
- Sensitive data hashing
- Key management

**Privacy:**
- Data minimization
- Access logging
- GDPR compliance
- Right to erasure

---

## Deployment & Infrastructure

### Container Strategy

**Docker Configuration:**
```dockerfile
# Multi-stage builds for optimization
# Security scanning integration
# Minimal base images
# Health check endpoints
```

**Docker Compose:**
- Development environment
- Service orchestration
- Database and Redis setup
- Volume management

### Production Deployment

**Infrastructure as Code:**
- Terraform configurations
- Kubernetes manifests
- Helm charts
- GitOps workflows

**CI/CD Pipeline:**
```yaml
1. Code commit
2. Automated testing
3. Security scanning
4. Build & push images
5. Deploy to staging
6. Integration tests
7. Production deployment
8. Health monitoring
```

### Monitoring & Observability

**Application Monitoring:**
- Prometheus metrics
- Grafana dashboards
- Application logs
- Error tracking

**Infrastructure Monitoring:**
- Resource utilization
- Network monitoring
- Database performance
- Container health

**Blockchain Monitoring:**
- Transaction monitoring
- Contract event tracking
- Gas usage optimization
- Network health

### Backup & Disaster Recovery

**Database Backups:**
- Automated daily backups
- Point-in-time recovery
- Cross-region replication
- Backup testing procedures

**IPFS Content:**
- Pinning strategies
- Content replication
- Integrity verification
- Recovery procedures

---

## Performance & Monitoring

### Performance Optimization

**API Performance:**
- Response time optimization
- Database query optimization
- Caching strategies
- Load testing

**Frontend Performance:**
- Bundle size optimization
- Lazy loading implementation
- Image optimization
- Core Web Vitals monitoring

**Database Performance:**
- Index optimization
- Query performance tuning
- Connection pooling
- Read replica configuration

### Monitoring & Alerting

**Key Metrics:**
- API response times
- Database performance
- Transaction success rates
- User engagement metrics

**Alerting Rules:**
- Error rate thresholds
- Performance degradation
- Security incidents
- System availability

**Dashboards:**
- Executive overview
- Technical operations
- Business metrics
- Security monitoring

---

## Future Roadmap

### Phase 1: Core Platform Enhancement
- [ ] Advanced verification methodologies
- [ ] Mobile application development
- [ ] Enhanced governance features
- [ ] Performance optimizations

### Phase 2: Ecosystem Expansion
- [ ] Multi-chain deployment
- [ ] Third-party integrations
- [ ] API partner program
- [ ] White-label enhancements

### Phase 3: Advanced Features
- [ ] AI/ML verification assistance
- [ ] DeFi protocol integrations
- [ ] Carbon credit marketplace
- [ ] Global compliance framework

### Phase 4: Scale & Optimize
- [ ] Enterprise deployment tools
- [ ] Advanced analytics platform
- [ ] Institutional trading features
- [ ] Regulatory compliance automation

---

## Contributing Guidelines

### Code Standards

**TypeScript:**
- Strict type checking
- ESLint configuration
- Prettier formatting
- Documentation requirements

**Testing:**
- Test-driven development
- Minimum 80% coverage
- Integration test requirements
- E2E test coverage

**Security:**
- Security review process
- Dependency scanning
- Code analysis tools
- Audit requirements

### Pull Request Process

1. Feature branch creation
2. Implementation with tests
3. Code review process
4. Security review
5. Deployment testing
6. Merge to main

### Documentation

- Code documentation (JSDoc)
- API documentation (OpenAPI)
- Architecture decision records
- User documentation

---

## Conclusion

The Orenna DAO platform represents a comprehensive solution for regenerative finance, combining blockchain technology with traditional finance workflows. The system's modular architecture, comprehensive testing, and security-first approach provide a solid foundation for scaling regenerative project funding globally.

This documentation serves as a living guide that should be updated as the platform evolves. For specific implementation details, refer to the individual code files and their accompanying documentation.

---

**Contact & Support:**
- Technical Documentation: See `/docs` directory
- API Documentation: Available at `/docs` endpoint
- Issue Tracking: GitHub Issues
- Security Reports: security@orenna.org