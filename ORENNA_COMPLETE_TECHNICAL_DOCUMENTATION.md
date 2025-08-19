# Orenna DAO - Complete Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Frontend Architecture](#frontend-architecture)
7. [Smart Contracts](#smart-contracts)
8. [Workflows](#workflows)
9. [Development Setup](#development-setup)
10. [Testing Strategy](#testing-strategy)
11. [Security Implementation](#security-implementation)
12. [Deployment](#deployment)

---

## Project Overview

Orenna DAO is a **regenerative finance platform** that enables project funding through verified ecosystem improvements. The platform combines Web3 technology with traditional finance to create a transparent, accountable system for environmental and social impact projects.

### Core Value Proposition
- **Lift Forward**: Upfront funding for regenerative projects with outcome-based repayment
- **Lift Tokens**: ERC-1155 tokens representing verified ecosystem improvements
- **Transparent Governance**: DAO-based decision making with token-weighted voting
- **Multi-Methodology Verification**: Support for various environmental standards (VWBA, VCS, Gold Standard)

### Technology Stack
- **Backend**: Fastify (Node.js), TypeScript, Prisma ORM
- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Database**: PostgreSQL with comprehensive audit trails
- **Blockchain**: Multi-chain support (Ethereum, Polygon, etc.) via Wagmi/Viem
- **Smart Contracts**: Solidity with Foundry framework
- **Infrastructure**: Docker, IPFS, WebSocket real-time updates

---

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Next.js Web App]
        MOBILE[Mobile App Future]
    end
    
    subgraph "API Layer"
        API[Fastify API Server]
        WS[WebSocket Server]
        AUTH[SIWE Authentication]
    end
    
    subgraph "Business Logic"
        PAY[Payment Processing]
        VER[Verification Engine]
        GOV[Governance System]
        FIN[Financial Controller]
        ANAL[Analytics Engine]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        IPFS[IPFS Storage]
        CACHE[Redis Cache]
    end
    
    subgraph "Blockchain Layer"
        ETH[Ethereum]
        POLY[Polygon]
        CONTRACTS[Smart Contracts]
    end
    
    WEB --> API
    API --> PAY
    API --> VER
    API --> GOV
    API --> FIN
    API --> ANAL
    
    PAY --> DB
    VER --> DB
    GOV --> DB
    FIN --> DB
    ANAL --> DB
    
    PAY --> CONTRACTS
    GOV --> CONTRACTS
    VER --> IPFS
```

### Monorepo Structure

```
orenna-backend/
├── apps/
│   ├── api/                    # Fastify API server
│   └── web/                    # Next.js frontend
├── packages/
│   ├── api-client/             # Typed API client
│   ├── db/                     # Prisma schema & migrations
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configuration
├── contracts/                  # Smart contracts (Foundry)
├── monitoring/                 # Observability stack
├── deploy/                     # Deployment configurations
└── docs/                       # Documentation
```

---

## Core Modules

### 1. Authentication System (`apps/api/src/lib/authorization.ts`)

**SIWE-Based Web3 Authentication**
- Sign-In with Ethereum (SIWE) implementation
- Nonce generation and verification
- JWT token management
- Multi-wallet support (MetaMask, WalletConnect, Coinbase)

**Key Features:**
- Secure cryptographic signature verification
- Time-limited nonces to prevent replay attacks
- Role-based access control integration
- Session management with JWT tokens

### 2. Payment Processing (`apps/api/src/lib/payment.ts`)

**Multi-Type Payment System**
- `LIFT_TOKEN_PURCHASE`: Direct token purchases
- `PROJECT_FUNDING`: Lift Forward upfront funding
- `REPAYMENT`: Outcome-based loan repayments
- `PLATFORM_FEE`: Platform revenue collection
- `STEWARD_PAYMENT`: Ecosystem steward compensation

**Payment Flow:**
1. Payment initiation with escrow setup
2. Multi-signature approval workflow
3. Blockchain transaction execution
4. Proceeds distribution to stakeholders
5. Comprehensive audit trail recording

### 3. Verification System (`apps/api/src/lib/verification/`)

**Multi-Methodology Support:**
- **VWBA v2**: Verified Water Benefit Accounting
- **VCS**: Verified Carbon Standard
- **Gold Standard**: Environmental and social impact
- **Custom Protocols**: Extensible framework

**Verification Process:**
1. Evidence collection and validation
2. Automated rule-based checking
3. Expert reviewer assignment
4. Confidence scoring with ML
5. Final verification and tokenization

### 4. Financial Controller (`apps/api/src/lib/ledger.ts`)

**Double-Entry Accounting System:**
- Real-time financial tracking
- Multi-project cost allocation
- Comprehensive audit trails
- Financial integrity checks
- Automated reconciliation

**Account Types:**
- Assets (Cash, Receivables, Inventory)
- Liabilities (Payables, Escrow, Loans)
- Equity (Capital, Retained Earnings)
- Revenue (Token Sales, Platform Fees)
- Expenses (Operations, Verification Costs)

### 5. Governance System (`apps/api/src/lib/governance.ts`)

**DAO Governance Features:**
- Proposal creation and management
- Token-weighted voting system
- Parameter governance
- Treasury management
- Execution queue with timelock

**Governance Parameters:**
- Platform fees and rates
- Verification requirements
- Token economics
- Protocol upgrades

### 6. Blockchain Integration (`apps/api/src/lib/blockchain.ts`)

**Multi-Chain Support:**
- Ethereum mainnet integration
- Polygon for scalability
- Arbitrum support
- Cross-chain bridge compatibility

**Contract Interactions:**
- Token minting and transfers
- Governance proposal execution
- Payment processing
- Staking and rewards

### 7. Analytics Engine (`apps/api/src/lib/analytics.ts`)

**Real-Time Analytics:**
- Project performance metrics
- Financial health indicators
- Verification success rates
- Platform usage statistics
- Environmental impact tracking

### 8. Queue System (`apps/api/src/lib/queue-service.ts`)

**Background Job Processing:**
- Verification processing queue
- Evidence validation queue
- Webhook delivery queue
- Cleanup and maintenance queue

---

## API Reference

### Authentication Endpoints

#### `POST /api/auth/nonce`
Generate authentication nonce for wallet signature.

```typescript
interface NonceRequest {
  address: string;
}

interface NonceResponse {
  nonce: string;
  expiresAt: string;
}
```

#### `POST /api/auth/verify`
Verify signed message and issue JWT token.

```typescript
interface VerifyRequest {
  message: string;
  signature: string;
  address: string;
}

interface VerifyResponse {
  token: string;
  user: UserProfile;
}
```

### Project Management

#### `GET /api/projects`
List projects with pagination and filtering.

```typescript
interface ProjectListQuery {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: "createdAt:desc" | "createdAt:asc";
}

interface ProjectListResponse {
  data: {
    data: Project[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

#### `POST /api/projects`
Create new regenerative project.

```typescript
interface CreateProjectRequest {
  name: string;
  slug: string;
  description?: string;
  location?: string;
  type?: string;
  meta?: Record<string, any>;
}
```

#### `GET /api/projects/:id`
Get project details including verification status.

#### `PUT /api/projects/:id`
Update project information (requires permissions).

#### `DELETE /api/projects/:id`
Archive project (requires admin permissions).

### Payment System

#### `GET /api/payments`
List payments with advanced filtering.

```typescript
interface PaymentQuery {
  status?: PaymentStatus;
  paymentType?: PaymentType;
  chainId?: number;
  payerAddress?: string;
  limit?: number;
  offset?: number;
}
```

#### `POST /api/payments/initiate`
Initiate new payment with escrow setup.

```typescript
interface PaymentRequest {
  paymentType: PaymentType;
  amount: string;
  paymentToken: string;
  chainId: number;
  projectId?: number;
  purchaseData?: {
    liftTokenId: number;
    quantity: number;
  };
}
```

#### `POST /api/payments/process-lift-purchase`
Process Lift Token purchase with verification.

#### `POST /api/payments/notify-proceeds`
Notify system of proceeds received.

#### `GET /api/payments/project/:projectId`
Get all payments for specific project.

### Lift Token Management

#### `GET /api/lift-tokens`
List available Lift Tokens with metadata.

#### `POST /api/lift-tokens`
Create new Lift Token (requires verification).

#### `POST /api/lift-tokens/:id/issue`
Issue tokens after successful verification.

#### `POST /api/lift-tokens/:id/retire`
Retire tokens to claim environmental benefits.

#### `POST /api/lift-tokens/batch/verify`
Batch verification of multiple tokens.

### Verification System

#### `GET /api/verification-methods`
List available verification methodologies.

#### `POST /api/verification-methods`
Register new verification methodology.

#### `POST /api/verification-results/:id/calculate`
Calculate verification results from evidence.

#### `POST /api/verification-results/:id/process-evidence`
Process uploaded evidence files.

#### `GET /api/verification-results/:id/mrv-assessment`
Get MRV (Measurement, Reporting, Verification) assessment.

### Governance

#### `GET /api/governance/proposals`
List governance proposals with filtering.

#### `POST /api/governance/proposals`
Create new governance proposal.

#### `POST /api/governance/proposals/:id/vote`
Vote on governance proposal.

#### `GET /api/governance/token`
Get user's governance token balance and voting power.

#### `POST /api/governance/delegate`
Delegate voting power to another address.

#### `GET /api/governance/parameters`
Get current governance parameters.

### Analytics

#### `GET /api/analytics/dashboard`
Get comprehensive dashboard data.

#### `GET /api/analytics/projects/:projectId`
Get project-specific analytics.

#### `GET /api/analytics/payments`
Get payment analytics and trends.

#### `GET /api/analytics/verification`
Get verification success rates and metrics.

#### `GET /api/analytics/export`
Export analytics data in various formats.

---

## Database Schema

### Core Entities

#### Projects
```sql
CREATE TABLE Project (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  location VARCHAR(255),
  type VARCHAR(100),
  status ProjectStatus DEFAULT 'PENDING',
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Payments
```sql
CREATE TABLE Payment (
  id VARCHAR(255) PRIMARY KEY,
  payment_type PaymentType NOT NULL,
  status PaymentStatus DEFAULT 'PENDING',
  amount DECIMAL(78,0) NOT NULL,
  payment_token VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  payer_address VARCHAR(42) NOT NULL,
  project_id INTEGER REFERENCES Project(id),
  transaction_hash VARCHAR(66),
  escrow_config JSONB,
  proceeds_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Lift Tokens
```sql
CREATE TABLE LiftToken (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES Project(id),
  token_id BIGINT,
  methodology_id INTEGER REFERENCES VerificationMethod(id),
  verification_result_id INTEGER REFERENCES VerificationResult(id),
  token_type LiftTokenType NOT NULL,
  status LiftTokenStatus DEFAULT 'PENDING',
  quantity DECIMAL(18,6) NOT NULL,
  metadata JSONB,
  issued_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Verification System
```sql
CREATE TABLE VerificationMethod (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  methodology_type MethodologyType NOT NULL,
  parameters JSONB NOT NULL,
  evidence_requirements JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE VerificationResult (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES Project(id),
  method_id INTEGER NOT NULL REFERENCES VerificationMethod(id),
  status VerificationStatus DEFAULT 'PENDING',
  evidence_data JSONB,
  results JSONB,
  confidence_score DECIMAL(5,4),
  reviewer_address VARCHAR(42),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Financial Accounting

#### Ledger Entries
```sql
CREATE TABLE LedgerEntry (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL,
  account_type AccountType NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  debit_amount DECIMAL(78,18),
  credit_amount DECIMAL(78,18),
  currency VARCHAR(10) DEFAULT 'USD',
  reference_type VARCHAR(100),
  reference_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Financial Metrics
```sql
CREATE TABLE FinancialMetric (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES Project(id),
  metric_type FinancialMetricType NOT NULL,
  value DECIMAL(18,6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  metadata JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

### Governance System

#### Proposals
```sql
CREATE TABLE GovernanceProposal (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  proposal_type ProposalType NOT NULL,
  status ProposalStatus DEFAULT 'PENDING',
  proposer_address VARCHAR(42) NOT NULL,
  targets TEXT[] NOT NULL,
  values TEXT[] NOT NULL,
  calldatas TEXT[] NOT NULL,
  start_block BIGINT,
  end_block BIGINT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Votes
```sql
CREATE TABLE GovernanceVote (
  id SERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL REFERENCES GovernanceProposal(id),
  voter_address VARCHAR(42) NOT NULL,
  support INTEGER NOT NULL, -- 0=Against, 1=For, 2=Abstain
  voting_power DECIMAL(78,18) NOT NULL,
  reason TEXT,
  transaction_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(proposal_id, voter_address)
);
```

### Audit Trail

#### Activity Logs
```sql
CREATE TABLE ActivityLog (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Frontend Architecture

### Next.js 14 App Router Structure

```
apps/web/src/
├── app/                        # App Router pages
│   ├── layout.tsx             # Root layout with providers
│   ├── page.tsx               # Homepage
│   ├── projects/              # Project management
│   │   ├── page.tsx           # Projects list
│   │   ├── [id]/              # Project details
│   │   └── create/            # Project creation
│   ├── dashboard/             # User dashboard
│   ├── payments/              # Payment management
│   ├── analytics/             # Analytics dashboard
│   ├── governance/            # DAO governance
│   └── admin/                 # Admin interface
├── components/                # React components
│   ├── ui/                    # Base UI components
│   ├── auth/                  # Authentication components
│   ├── projects/              # Project-specific components
│   ├── payments/              # Payment components
│   ├── providers/             # Context providers
│   └── layout/                # Layout components
├── hooks/                     # Custom React hooks
├── lib/                       # Utility libraries
├── types/                     # TypeScript type definitions
└── styles/                    # CSS and styling
```

### Key Components

#### Provider Architecture
```typescript
// apps/web/src/components/providers/app-providers.tsx
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <WebSocketProvider>
          <GovernanceProvider>
            {children}
          </GovernanceProvider>
        </WebSocketProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}
```

#### Web3 Integration
```typescript
// apps/web/src/components/providers/web3-provider.tsx
export function Web3Provider({ children }: { children: React.ReactNode }) {
  const config = getConfig();
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

#### Real-time Updates
```typescript
// apps/web/src/components/providers/websocket-provider.tsx
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [recentMessages, setRecentMessages] = useState<WebSocketMessage[]>([]);
  
  const handleMessage = useCallback((message: WebSocketMessage) => {
    setRecentMessages(prev => [message, ...prev].slice(0, 50));
    
    // Route messages to appropriate handlers
    if (message.type === 'payment') {
      paymentEventHandlers.forEach(handler => handler(message.event!, message.data));
    }
  }, [paymentEventHandlers]);
  
  // WebSocket connection and event routing logic
}
```

### State Management Strategy

#### React Query for Server State
```typescript
// packages/api-client/src/hooks/useProjects.ts
export const useProjects = (params?: ProjectListParams) =>
  useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => client.projects.list(params),
  });
```

#### Context for Global State
```typescript
// apps/web/src/hooks/use-auth.ts
export function useAuth() {
  const { address, isConnected } = useAccount();
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const signIn = async () => {
    // SIWE authentication flow
  };
  
  return { address, isConnected, authToken, signIn };
}
```

---

## Smart Contracts

### Contract Architecture

```
contracts/src/
├── LiftTokens.sol             # ERC-1155 tokens for verified improvements
├── LiftUnits.sol              # Legacy token contract
├── OrennaGovernanceToken.sol  # ERC-20 governance token
├── OrennaGovernor.sol         # Governor contract for DAO
├── OrennaTimelock.sol         # Timelock for governance execution
└── MethodRegistry.sol         # Registry for verification methods
```

### Core Contracts

#### 1. LiftTokens.sol (ERC-1155)
```solidity
contract LiftTokens is ERC1155, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    struct TokenInfo {
        string name;
        string description;
        uint256 totalSupply;
        uint256 maxSupply;
        bool transferable;
        address verificationContract;
        bytes32 verificationHash;
    }
    
    mapping(uint256 => TokenInfo) public tokenInfo;
    
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyRole(MINTER_ROLE) {
        require(tokenInfo[id].totalSupply + amount <= tokenInfo[id].maxSupply, "Exceeds max supply");
        _mint(to, id, amount, data);
        tokenInfo[id].totalSupply += amount;
    }
}
```

#### 2. OrennaGovernor.sol
```solidity
contract OrennaGovernor is Governor, GovernorCountingSimple, GovernorVotes, GovernorTimelockControl {
    constructor(
        ERC20Votes _token,
        TimelockController _timelock
    )
        Governor("OrennaGovernor")
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
    {}
    
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }
    
    function votingPeriod() public pure override returns (uint256) {
        return 45818; // ~1 week
    }
    
    function quorum(uint256 blockNumber) public view override returns (uint256) {
        return (token.getPastTotalSupply(blockNumber) * 4) / 100; // 4% quorum
    }
}
```

#### 3. MethodRegistry.sol
```solidity
contract MethodRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    
    struct Method {
        string name;
        string version;
        bytes32 specHash;
        address verificationContract;
        bool active;
        uint256 registeredAt;
    }
    
    mapping(bytes32 => Method) public methods;
    mapping(address => bool) public authorizedVerifiers;
    
    function registerMethod(
        string memory name,
        string memory version,
        bytes32 specHash,
        address verificationContract
    ) public onlyRole(REGISTRAR_ROLE) {
        bytes32 methodId = keccak256(abi.encodePacked(name, version));
        methods[methodId] = Method(name, version, specHash, verificationContract, true, block.timestamp);
        
        emit MethodRegistered(methodId, name, version, verificationContract);
    }
}
```

### Contract Deployment & Verification

#### Deploy Script (Foundry)
```solidity
// contracts/script/Deploy.s.sol
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy governance token
        OrennaGovernanceToken token = new OrennaGovernanceToken();
        
        // Deploy timelock
        address[] memory proposers = new address[](1);
        proposers[0] = address(this);
        OrennaTimelock timelock = new OrennaTimelock(1 days, proposers, proposers);
        
        // Deploy governor
        OrennaGovernor governor = new OrennaGovernor(token, timelock);
        
        // Deploy method registry
        MethodRegistry registry = new MethodRegistry();
        
        // Deploy lift tokens
        LiftTokens liftTokens = new LiftTokens("https://api.orenna.io/tokens/{id}");
        
        vm.stopBroadcast();
    }
}
```

---

## Workflows

### 1. Project Creation & Funding Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB
    participant Blockchain
    
    User->>Frontend: Create Project
    Frontend->>API: POST /api/projects
    API->>DB: Store project data
    API->>Frontend: Return project ID
    
    User->>Frontend: Request Funding
    Frontend->>API: POST /api/payments/initiate
    API->>Blockchain: Setup escrow contract
    Blockchain->>API: Return escrow address
    API->>DB: Store payment record
    
    User->>Blockchain: Send funds to escrow
    Blockchain->>API: Webhook notification
    API->>DB: Update payment status
    API->>Frontend: Real-time update via WebSocket
```

### 2. Verification & Tokenization Process

```mermaid
sequenceDiagram
    participant Steward
    participant API
    participant VerificationEngine
    participant Reviewer
    participant Blockchain
    
    Steward->>API: Upload evidence
    API->>VerificationEngine: Process evidence
    VerificationEngine->>API: Automated validation results
    
    API->>Reviewer: Assign for manual review
    Reviewer->>API: Submit review decision
    
    alt Verification Approved
        API->>Blockchain: Mint Lift Tokens
        Blockchain->>API: Transaction confirmation
        API->>Steward: Tokens available notification
    else Verification Rejected
        API->>Steward: Rejection notification
        API->>Steward: Request additional evidence
    end
```

### 3. Governance Proposal Workflow

```mermaid
sequenceDiagram
    participant Member
    participant Frontend
    participant API
    participant Governor
    participant Timelock
    
    Member->>Frontend: Create proposal
    Frontend->>API: POST /api/governance/proposals
    API->>Governor: Submit on-chain proposal
    
    Note over Governor: Voting period begins
    
    loop Voting Period
        Member->>Governor: Cast vote
        Governor->>API: Vote event
        API->>Frontend: Update vote count
    end
    
    Note over Governor: Voting period ends
    
    alt Proposal Passes
        Governor->>Timelock: Queue execution
        Note over Timelock: Timelock delay
        Governor->>Timelock: Execute proposal
        Timelock->>API: Execution notification
    else Proposal Fails
        Governor->>API: Failure notification
    end
```

### 4. Payment & Repayment Flow

```mermaid
flowchart TD
    A[Payment Initiated] --> B{Payment Type}
    
    B -->|Lift Token Purchase| C[Direct Token Transfer]
    B -->|Project Funding| D[Escrow Setup]
    B -->|Repayment| E[Revenue Distribution]
    
    C --> F[Token Delivery]
    
    D --> G[Funds Locked in Escrow]
    G --> H[Project Milestone Verification]
    H --> I{Milestone Met?}
    I -->|Yes| J[Release Funds]
    I -->|No| K[Hold Funds/Dispute]
    
    E --> L[Calculate Distribution]
    L --> M[Platform Fee]
    L --> N[Project Stewards]
    L --> O[Token Holders]
    
    F --> P[Transaction Complete]
    J --> P
    M --> P
    N --> P
    O --> P
```

---

## Development Setup

### Prerequisites
- Node.js 18+ with pnpm
- PostgreSQL 14+
- Redis (optional, for caching)
- Docker & Docker Compose
- Foundry (for smart contracts)

### Environment Setup

#### 1. Clone and Install Dependencies
```bash
git clone https://github.com/orennadao/orenna-backend.git
cd orenna-backend
pnpm install
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/orenna"

# Configure blockchain connections
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"

# Configure IPFS
IPFS_URL="http://localhost:5001"

# Configure authentication
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"

# Configure API URLs
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001/api/ws"
```

#### 3. Database Setup
```bash
# Start PostgreSQL (via Docker)
docker run -d \
  --name orenna-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=orenna \
  -p 5432:5432 \
  postgres:14

# Run migrations
cd packages/db
pnpm prisma migrate dev
pnpm prisma generate
```

#### 4. Smart Contract Setup
```bash
cd contracts

# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Deploy to local network
anvil # In separate terminal
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Development Workflow

#### Start Development Servers
```bash
# Terminal 1: API Server
cd apps/api
pnpm dev

# Terminal 2: Web Frontend
cd apps/web
pnpm dev

# Terminal 3: Local blockchain (optional)
anvil

# Terminal 4: IPFS node (optional)
ipfs daemon
```

#### Code Quality Tools
```bash
# TypeScript checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format

# Testing
pnpm test           # All tests
pnpm test:unit      # Unit tests only
pnpm test:integration # Integration tests
pnpm test:e2e       # End-to-end tests
```

---

## Testing Strategy

### Test Pyramid Structure

#### 1. Unit Tests (Jest/Vitest)
```typescript
// apps/api/tests/unit/payment.test.ts
describe('Payment Processing', () => {
  describe('calculatePlatformFee', () => {
    it('should calculate correct platform fee', () => {
      const amount = BigInt('1000000000000000000'); // 1 ETH
      const feeRate = 250; // 2.5%
      
      const fee = calculatePlatformFee(amount, feeRate);
      
      expect(fee).toBe(BigInt('25000000000000000')); // 0.025 ETH
    });
  });
});
```

#### 2. Integration Tests (Supertest)
```typescript
// apps/api/tests/integration/projects.test.ts
describe('Projects API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });
  
  it('should create project with valid data', async () => {
    const projectData = {
      name: 'Test Regenerative Project',
      slug: 'test-project',
      description: 'A test project for integration testing',
      location: 'Test Location'
    };
    
    const response = await request(app)
      .post('/api/projects')
      .send(projectData)
      .expect(201);
    
    expect(response.body).toMatchObject(projectData);
    expect(response.body.id).toBeDefined();
  });
});
```

#### 3. End-to-End Tests (Playwright)
```typescript
// apps/api/tests/e2e/project-workflow.spec.ts
test.describe('Complete Project Workflow', () => {
  test('should allow project creation, funding, and verification', async ({ page }) => {
    // Navigate to project creation
    await page.goto('/projects/create');
    
    // Fill project form
    await page.fill('[data-testid="project-name"]', 'E2E Test Project');
    await page.fill('[data-testid="project-description"]', 'Test description');
    await page.click('[data-testid="submit-project"]');
    
    // Verify project creation
    await expect(page.locator('[data-testid="project-created"]')).toBeVisible();
    
    // Continue to funding flow
    await page.click('[data-testid="request-funding"]');
    
    // Mock wallet connection and payment
    await mockWalletConnection(page);
    await mockPaymentTransaction(page);
    
    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });
});
```

#### 4. Smart Contract Tests (Foundry)
```solidity
// contracts/test/LiftTokens.t.sol
contract LiftTokensTest is Test {
    LiftTokens tokens;
    address minter = address(0x1);
    address user = address(0x2);
    
    function setUp() public {
        tokens = new LiftTokens("https://api.orenna.io/tokens/{id}");
        tokens.grantRole(tokens.MINTER_ROLE(), minter);
    }
    
    function testMintingTokens() public {
        vm.prank(minter);
        tokens.createToken(
            1,
            "Water Conservation Token",
            "Verified water savings",
            1000e18, // max supply
            true     // transferable
        );
        
        vm.prank(minter);
        tokens.mint(user, 1, 100e18, "");
        
        assertEq(tokens.balanceOf(user, 1), 100e18);
    }
}
```

### Test Coverage Goals
- Unit Tests: >90% code coverage
- Integration Tests: All API endpoints
- E2E Tests: Critical user journeys
- Contract Tests: 100% function coverage

---

## Security Implementation

### Authentication & Authorization

#### SIWE (Sign-In with Ethereum)
```typescript
// apps/api/src/lib/authorization.ts
export class SIWEAuth {
  async verifySignature(message: string, signature: string): Promise<boolean> {
    try {
      const siweMessage = new SiweMessage(message);
      const verificationResult = await siweMessage.verify({
        signature,
        domain: process.env.DOMAIN,
        nonce: this.getNonce(siweMessage.address),
      });
      
      return verificationResult.success;
    } catch (error) {
      logger.error('SIWE verification failed:', error);
      return false;
    }
  }
}
```

#### Role-Based Access Control (RBAC)
```typescript
// apps/api/src/lib/rbac.ts
export enum Role {
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  FINANCE_MANAGER = 'finance_manager',
  TREASURER = 'treasurer',
  VENDOR = 'vendor',
  STEWARD = 'steward',
  MEMBER = 'member'
}

export class RBACService {
  async checkPermission(
    userAddress: string,
    action: string,
    resource: string,
    context?: any
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userAddress);
    const permissions = await this.getRolePermissions(userRoles);
    
    return this.evaluatePermission(permissions, action, resource, context);
  }
}
```

### Input Validation & Sanitization

#### Schema Validation (Zod)
```typescript
// apps/api/src/lib/schemas.ts
export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  location: z.string().max(255).optional(),
  type: z.enum(['WATER', 'CARBON', 'BIODIVERSITY']).optional(),
  meta: z.record(z.any()).optional(),
});
```

#### Rate Limiting
```typescript
// apps/api/src/plugins/security.ts
export const rateLimitPlugin = fp(async (fastify) => {
  await fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (request, context) => ({
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.round(context.ttl / 1000)} seconds.`,
    }),
  });
});
```

### Cryptographic Security

#### Signature Verification
```typescript
// apps/api/src/lib/crypto.ts
export class CryptoService {
  async verifyEthereumSignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = recoverAddress({
        hash: hashMessage(message),
        signature: signature as `0x${string}`,
      });
      
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch {
      return false;
    }
  }
}
```

### Data Protection

#### Sensitive Data Handling
```typescript
// apps/api/src/lib/encryption.ts
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  
  async encrypt(data: string, key: Buffer): Promise<EncryptedData> {
    const iv = randomBytes(16);
    const cipher = createCipher(this.algorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }
}
```

### Audit Trail

#### Activity Logging
```typescript
// apps/api/src/lib/audit-trail.ts
export class AuditService {
  async logActivity(activity: {
    userAddress: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.db.activityLog.create({
      data: {
        ...activity,
        timestamp: new Date(),
        hash: this.computeActivityHash(activity),
      },
    });
  }
}
```

### Smart Contract Security

#### Access Control
```solidity
// contracts/src/LiftTokens.sol
contract LiftTokens is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused(), "Contract is paused");
        _;
    }
}
```

#### Reentrancy Protection
```solidity
// contracts/src/ReentrancyGuard.sol
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    
    constructor() {
        _status = _NOT_ENTERED;
    }
    
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}
```

---

## Deployment

### Infrastructure Architecture

#### Docker Containerization
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Docker Compose Setup
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/orenna
    depends_on:
      - db
      - redis
    
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://api:3001
    depends_on:
      - api
      
  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=orenna
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run type-check
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          docker build -t orenna/api:${{ github.sha }} .
          docker build -t orenna/web:${{ github.sha }} ./apps/web
          docker push orenna/api:${{ github.sha }}
          docker push orenna/web:${{ github.sha }}
          
      - name: Deploy to production
        run: |
          kubectl set image deployment/api api=orenna/api:${{ github.sha }}
          kubectl set image deployment/web web=orenna/web:${{ github.sha }}
```

### Environment Configuration

#### Production Environment Variables
```bash
# Production .env
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@prod-db:5432/orenna

# Redis
REDIS_URL=redis://prod-redis:6379

# Blockchain
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/PROD_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/PROD_KEY

# Security
JWT_SECRET=your-production-jwt-secret
NEXTAUTH_SECRET=your-production-nextauth-secret

# API Configuration
API_BASE_URL=https://api.orenna.io
WS_URL=wss://api.orenna.io/ws

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key

# IPFS
IPFS_URL=https://ipfs.orenna.io

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Monitoring & Observability

#### Logging Configuration
```typescript
// apps/api/src/lib/logger.ts
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

#### Health Checks
```typescript
// apps/api/src/routes/health.ts
export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health/liveness', async (request, reply) => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });
  
  app.get('/health/readiness', async (request, reply) => {
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkIPFS(),
      checkBlockchainConnection(),
    ]);
    
    const failed = checks.filter(check => check.status === 'rejected');
    
    if (failed.length > 0) {
      reply.status(503);
      return { status: 'unhealthy', failures: failed };
    }
    
    return { status: 'ready', checks: checks.length };
  });
}
```

### Database Migrations

#### Production Migration Strategy
```bash
# Migration deployment script
#!/bin/bash
set -e

echo "Starting database migration..."

# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npx prisma migrate deploy

# Verify migration success
npx prisma db seed

echo "Migration completed successfully!"
```

### Smart Contract Deployment

#### Production Deployment Script
```solidity
// contracts/script/DeployProduction.s.sol
contract DeployProduction is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy governance token
        OrennaGovernanceToken token = new OrennaGovernanceToken();
        
        // Deploy timelock with 2-day delay
        address[] memory proposers = new address[](1);
        proposers[0] = vm.envAddress("MULTISIG_ADDRESS");
        OrennaTimelock timelock = new OrennaTimelock(2 days, proposers, proposers);
        
        // Deploy governor
        OrennaGovernor governor = new OrennaGovernor(token, timelock);
        
        // Deploy method registry
        MethodRegistry registry = new MethodRegistry();
        registry.grantRole(registry.REGISTRAR_ROLE(), vm.envAddress("ADMIN_ADDRESS"));
        
        // Deploy lift tokens
        LiftTokens liftTokens = new LiftTokens(vm.envString("TOKEN_URI_BASE"));
        liftTokens.grantRole(liftTokens.MINTER_ROLE(), vm.envAddress("API_ADDRESS"));
        
        // Verify contracts on Etherscan
        vm.stopBroadcast();
        
        console.log("Governance Token:", address(token));
        console.log("Timelock:", address(timelock));
        console.log("Governor:", address(governor));
        console.log("Method Registry:", address(registry));
        console.log("Lift Tokens:", address(liftTokens));
    }
}
```

---

## Future Roadmap

### Phase 1: Core Platform (Current)
- ✅ Basic project creation and management
- ✅ SIWE authentication system
- ✅ Payment processing with escrow
- ✅ VWBA v2 verification methodology
- ✅ Lift Token minting and transfers
- ✅ Basic governance framework

### Phase 2: Enhanced Verification (Q2 2024)
- 🔄 Additional verification methodologies (VCS, Gold Standard)
- 🔄 ML-enhanced confidence scoring
- 🔄 Automated evidence validation
- 🔄 Expert reviewer marketplace
- 🔄 Mobile app for field data collection

### Phase 3: Advanced Finance (Q3 2024)
- 📋 Multi-currency support
- 📋 DeFi integration (lending/borrowing)
- 📋 Cross-chain bridge implementation
- 📋 Advanced financial instruments
- 📋 Yield farming opportunities

### Phase 4: Ecosystem Expansion (Q4 2024)
- 📋 White-label platform for other organizations
- 📋 API for third-party integrations
- 📋 Carbon credit marketplace
- 📋 Insurance product integration
- 📋 Global regulatory compliance

### Phase 5: Global Scale (2025)
- 📋 Multi-language support
- 📋 Regional compliance frameworks
- 📋 Enterprise customer portal
- 📋 Advanced analytics and AI insights
- 📋 Sustainability reporting automation

### Technical Debt & Improvements
- 📋 Migrate to React Query v5
- 📋 Implement OpenTelemetry observability
- 📋 Add Kubernetes deployment
- 📋 Enhance test coverage to 95%
- 📋 Implement database sharding
- 📋 Add real-time collaboration features

---

## Conclusion

Orenna DAO represents a comprehensive, production-ready platform for regenerative finance. The codebase demonstrates enterprise-grade architecture with:

- **Sophisticated Financial System**: Complete accounting, multi-type payments, escrow management
- **Robust Verification Framework**: Multi-methodology support with automated and expert validation
- **Comprehensive Governance**: DAO-based decision making with token-weighted voting
- **Security-First Approach**: SIWE authentication, RBAC, comprehensive audit trails
- **Scalable Architecture**: Monorepo structure, containerized deployment, comprehensive testing

The platform is positioned to scale globally and serve as the foundation for a new regenerative economy built on transparency, accountability, and verified environmental impact.

---

*Last Updated: August 2024*
*Version: 0.2.0*
*Documentation Status: Comprehensive*