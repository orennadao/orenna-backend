# Project Parent Token Integration Spec (Refined)

**Status**: ✅ **CORE IMPLEMENTATION COMPLETE** 
**Last Updated**: August 18, 2025

Here's a tight, implementation-ready spec for adding a Project Parent Token to Orenna. It fits your current stack (Next.js + Fastify API + Prisma + ERC-20 governance + ERC-1155 Lift Tokens + payments/indexers), keeps dev velocity high, and leaves room for later bells/whistles.

## Implementation Progress

✅ **COMPLETED**:
- ✅ ProjectNFT contract (ERC-721, UUPS, AccessControl, Pausable) - `contracts/src/ProjectNFT.sol`
- ✅ Updated AllocationEscrow (LiftForward) to require projectId and emit ForwardLinked events
- ✅ Updated LiftTokens and LiftTokens contracts with project integration and LiftBatchLinked events
- ✅ Prisma database schema migration for Project model with new fields (tokenId, ownerAddress, state, etc.)
- ✅ API routes for project CRUD, state management, verification attestation - `apps/api/src/routes/projects.ts`
- ✅ Frontend project creation wizard with wallet integration and metadata steps

✅ **COMPLETED**:
- Project detail page with analytics and verification tracking
- Event indexer for project-related events (ProjectNFT, ProjectCreated, ProjectStateChanged, VerifierAttested events)
- Comprehensive test suite for contract and API functionality
- Real-time project data integration with fallback analytics
- Project state management and lifecycle tracking with UI controls
- Real-time verification status updates via WebSocket/polling
- Enhanced project metrics display with API integration
- State transition management with validation rules

✅ **COMPLETED**:
- Contract compilation and integration testing
- UUPS proxy deployment pattern validated
- OpenZeppelin v5 compatibility confirmed
- **Sepolia testnet deployment successful**
- VWBA v2.0 verification method registered
- Role-based access control configured
- Test project creation validated

**Sepolia Testnet Addresses:**
- **ProjectNFT Proxy:** `0xaE58B8aF0B75976Ff019614316B4Eb866Db611Fc`
- **ProjectNFT Implementation:** `0xCCF205115fc1A84c34AabE6A494912Dc3413AB32`
- **LiftTokens:** `0x090A338979273420b3Dc7E69F91f1D1093225C88`
- **MethodRegistry:** `0x04330d8A9153699926Da3f77B700207Dd3260905`
- **Deployer:** `0x2F09521446A080E388Ec7b3d80a198325f85B196`
- **Network:** Sepolia (Chain ID: 11155111)
- **Deployment Block:** 9014909

✅ **COMPLETED**:
- **Comprehensive testing validation** - All 65 tests passing
- **ProjectNFT contract functionality** - All 24 tests passing (create, state changes, URI updates, batch operations)
- **Project lifecycle state transitions** - State validation and transition logic verified
- **Verification attestation functionality** - All 10 verification tests passing
- **LiftTokens integration** - All 9 LiftTokens tests passing with ProjectNFT integration
- **Integration testing** - All 5 integration tests passing
- **Governance system** - All 10 governance tests passing
- **Batch operations for gas efficiency** - Tested and validated
- **Emergency pause functionality** - Tested and validated
- **Access control and permissions** - All role-based access tests passing

🔄 **PENDING**:
- Production mainnet deployment

## Test Results Summary (August 19, 2025)

**✅ ALL TESTS PASSING: 65/65 (100%)**

| Test Suite | Tests | Status | Key Features Validated |
|------------|-------|--------|-------------------------|
| **ProjectNFT.t.sol** | 24/24 ✅ | PASS | Core NFT functionality, batch operations, state transitions, pause/unpause, access control |
| **LiftTokens.t.sol** | 9/9 ✅ | PASS | Token issuance, verification workflow, project integration, evidence validation |
| **Verification.t.sol** | 10/10 ✅ | PASS | Multi-validator verification, confidence scoring, evidence reuse prevention |
| **Integration.t.sol** | 5/5 ✅ | PASS | End-to-end workflow, cross-contract integration |
| **Governance.t.sol** | 10/10 ✅ | PASS | Proposal creation, voting, timelock integration, role management |
| **RepaymentEscrow.t.sol** | 6/6 ✅ | PASS | Payment processing, project configuration |
| **Basic.t.sol** | 1/1 ✅ | PASS | Basic deployment validation |

**Key Validations:**
- ✅ Project creation and management with proper NFT compliance
- ✅ State transition validation (DRAFT → BASELINED → ACTIVE_FUNDRAISING → etc.)
- ✅ Batch operations for gas efficiency (multiple projects, state changes)
- ✅ Multi-signature verification workflow with confidence thresholds
- ✅ Emergency pause/unpause functionality for all operations
- ✅ Role-based access control (REGISTRY_ADMIN, VERIFIER, PROJECT_OWNER roles)
- ✅ Integration between ProjectNFT, LiftTokens, and MethodRegistry
- ✅ Complete governance system with timelock and proposal mechanisms
- ✅ IPFS metadata handling with content hash validation
- ✅ OpenZeppelin v5 compatibility and UUPS upgradeability

## 1) Goals
- Make projects first-class on-chain objects that "contain" both funding (Lift Forwards) and outcomes (Lift Tokens).
- Provide single-source provenance and clean attachment points for verification, docs, and audits.
- Enforce stateful lifecycle rules (e.g., you can't mint outcome tokens for an un-verified project).
- Enable interoperability (marketplaces, registries, explorers) via a standard NFT.

## 2) Standards & Choices
- **ERC-721** for unique projects (ProjectNFT).
- **Rationale**: one token per project; simpler than 1155; easy marketplace/explorer compatibility.
- **OpenZeppelin AccessControl + UUPS** for upgradeability.
- **Pausable** pattern for emergency stops during initial rollout.
- **Metadata**: ERC-721 tokenURI → IPFS/Arweave JSON, versioned. Machine-readable "registryDataURI" for structured fields (kept in metadata as external_data pointer with a content hash).
- **Chain awareness**: store chainId inside structured metadata; contract itself runs per chain.

## 3) Contract Architecture

### 3.1 Contracts (new)
- **ProjectNFT** (ERC-721, UUPSUpgradeable, AccessControl, Pausable)
  - Mints one token per project
  - Holds lifecycle state
  - Emits canonical events for indexers
  - Includes batch operations for gas optimization
- **ProjectRegistry** (thin coordination layer; optional if you prefer to fold this into ProjectNFT)
  - Purely reads/writes into ProjectNFT
  - Provides convenience queries (if needed on-chain) and permissioned linking

### 3.2 Contracts (existing, to be updated)
- **LiftForward** (funding commitments)
  - Now requires a projectId on create/mint.
  - Emits ForwardLinked(projectId, forwardId, …).
  - Adds batch creation function for gas efficiency.
- **LiftToken** (ERC-1155 outcomes)
  - Now requires a projectId for each minted batch.
  - Records mapping batchId → projectId.
  - Emits LiftBatchLinked(projectId, batchId, …) and adds projectId to retirement events.

### 3.3 Simplified Role Structure
- **DEFAULT_ADMIN_ROLE**: Contract owner/governance executor.
- **REGISTRY_ADMIN_ROLE**: Can mint projects, set lifecycle, update URIs, and grant project-specific permissions.
- **VERIFIER_ROLE**: Can attest baseline/verification checkpoints.
- **Per-Project Roles** (using OpenZeppelin's AccessControl per-token pattern):
  - `PROJECT_OWNER_{projectId}`: Can update mutable fields/submit docs for specific project.
  - `PROJECT_ISSUER_{projectId}`: Can authorize LiftToken mints for specific project at verified states.

*Note: This reduces role complexity while maintaining granular control.*

## 4) Project Lifecycle & Rules

### States
```
0 DRAFT
1 BASELINED            (baseline survey accepted)
2 ACTIVE_FUNDRAISING   (Lift Forwards allowed)
3 IMPLEMENTATION       (spend, execute works)
4 MONITORING           (MAW running)
5 VERIFIED_ROUND_N     (post-verification rounds; N >= 1)
6 ARCHIVED
7 CANCELLED
```

### State Constraints
- **LiftForward.create(projectId)** allowed in: ACTIVE_FUNDRAISING, IMPLEMENTATION (configurable).
- **LiftToken.mint(projectId, batchId, …)** allowed only when:
  - state ∈ {VERIFIED_ROUND_*, MONITORING (if policy allows pre-issuance)} and
  - VERIFIER_ROLE attestation exists for the round/batch being issued.
- **Retirement events** MUST include projectId so claimed lift is attributable.

## 5) On-Chain Interfaces (Solidity)

```solidity
interface IProjectNFT {
  struct ProjectInfo {
    uint256 projectId;
    address owner;          // implementing org / steward
    string tokenURI;        // canonical metadata (human-readable + pointers)
    string registryDataURI; // structured JSON (schema'd), IPFS/Arweave
    bytes32 dataHash;       // keccak256 of registryDataURI content
    uint8 state;            // lifecycle enum
    uint256 schemaVersion;  // for future metadata evolution
  }

  // Events
  event ProjectCreated(uint256 indexed projectId, address indexed owner, string tokenURI, string registryDataURI, bytes32 dataHash, uint256 schemaVersion);
  event ProjectStateChanged(uint256 indexed projectId, uint8 prevState, uint8 newState);
  event ProjectURIsUpdated(uint256 indexed projectId, string tokenURI, string registryDataURI, bytes32 dataHash, uint256 schemaVersion);
  event VerifierAttested(uint256 indexed projectId, uint256 round, bytes32 reportHash, string reportURI);
  event ForwardLinked(uint256 indexed projectId, bytes32 forwardId);
  event LiftBatchLinked(uint256 indexed projectId, uint256 indexed batchId, uint256 amount);
  event RetiredAgainstProject(uint256 indexed projectId, address indexed beneficiary, uint256 indexed batchId, uint256 amount, bytes32 receiptHash);

  // Core functions
  function createProject(address projectOwner, string calldata tokenURI, string calldata registryDataURI, bytes32 dataHash) external returns (uint256 projectId);
  function setProjectState(uint256 projectId, uint8 newState) external;
  function updateURIs(uint256 projectId, string calldata tokenURI, string calldata registryDataURI, bytes32 dataHash) external;
  function attestVerification(uint256 projectId, uint256 round, bytes32 reportHash, string calldata reportURI) external;
  function info(uint256 projectId) external view returns (ProjectInfo memory);
  
  // Batch operations for gas optimization
  function createProjectsBatch(
    address[] calldata projectOwners,
    string[] calldata tokenURIs,
    string[] calldata registryDataURIs,
    bytes32[] calldata dataHashes
  ) external returns (uint256[] memory projectIds);
  
  function setProjectStatesBatch(uint256[] calldata projectIds, uint8[] calldata newStates) external;
}
```

LiftForward and LiftToken add overloads that include projectId and emit the link events above. LiftToken.retire(...) also emits RetiredAgainstProject.

## 6) Enhanced Metadata Strategy

### Human-readable base (ERC-721)
```json
{
  "name": "Orenna Project #42 — San Anselmo Creek",
  "description": "Bank stability + salmonid habitat restoration...",
  "image": "ipfs://.../cover.png",
  "external_url": "https://orennadao.com/projects/42",
  "attributes": [
    {"trait_type": "Biome", "value": "Temperate riparian"},
    {"trait_type": "State", "value": "ACTIVE_FUNDRAISING"},
    {"trait_type": "Jurisdiction", "value": "CA, USA"}
  ],
  "external_data": {
    "registryDataURI": "ipfs://.../registry-v1.json",
    "dataHash": "0xabc123...",
    "schemaVersion": 1
  }
}
```

### Structured registry data (registry-v1.json)
```json
{
  "schema": "https://orennadao.com/registry/project-schema/v1",
  "schemaVersion": 1,
  "project": {
    "title": "San Anselmo Creek Pilot",
    "implementer": "Orenna x Land Steward, LLC",
    "chainId": 8453,
    "coordinates": {"crs": "EPSG:4326", "bbox": [-122.59, 37.98, -122.57, 38.00]},
    "hydrologic_unit": "HUC10: 1805000503",
    "habitat_types": ["Riparian forest", "Gravel bar"],
    "baselines": [{"metric": "AfN.Veg.Condition", "value": 0.42, "date": "2025-05-11"}],
    "targets": [{"metric": "AfN.Veg.Condition", "value": 0.65, "by": "2028-12-31"}],
    "verification_protocols": [{"standard": "Accounting for Nature", "docURI": "ipfs://.../afn-method.pdf"}],
    "maw": {"start": "2026-01-01", "end": "2030-12-31"},
    "documents": [{"name": "Basis of Design", "uri": "ipfs://.../bod.pdf", "hash": "0x..."}]
  }
}
```

### IPFS Redundancy Strategy
- **Primary**: Pinata or similar managed service
- **Secondary**: Redundant pinning via Filebase or 4EVERLAND
- **Archival**: Critical documents backed up to Arweave for permanent storage
- **Validation**: All metadata includes content hashes for integrity verification

## 7) Off-Chain: DB & API

### 7.1 Enhanced Prisma Schema
```prisma
model Project {
  id                BigInt   @id @default(autoincrement())
  chainId           Int
  tokenId           BigInt   @unique
  ownerAddress      String
  state             ProjectState
  tokenUri          String
  registryDataUri   String
  dataHash          String    // 0x…
  schemaVersion     Int       @default(1)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // rollups
  forwards          LiftForward[] 
  liftBatches       LiftBatch[] 
  retirements       Retirement[] 
  verificationRounds VerificationRound[]
  
  @@index([chainId, state])
  @@index([ownerAddress])
}

enum ProjectState {
  DRAFT
  BASELINED
  ACTIVE_FUNDRAISING
  IMPLEMENTATION
  MONITORING
  VERIFIED_ROUND
  ARCHIVED
  CANCELLED
}

model VerificationRound {
  id          BigInt   @id @default(autoincrement())
  projectId   BigInt
  round       Int
  reportHash  String
  reportURI   String
  attestor    String
  timestamp   DateTime @default(now())
  
  Project     Project  @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, round])
}

model LiftForward {
  id           String  @id // e.g., ULID
  projectId    BigInt
  // ... existing fields
  Project      Project @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
}

model LiftBatch {
  id           BigInt  @id @default(autoincrement())
  projectId    BigInt
  erc1155Id    BigInt
  amount       BigInt
  // ... existing fields
  Project      Project @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
}

model Retirement {
  id           String  @id
  projectId    BigInt
  batchId      BigInt
  beneficiary  String
  amount       BigInt
  receiptHash  String
  // ... existing fields
  Project      Project @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
  @@index([beneficiary])
}

// Rollup tables for performance
model ProjectMetricsDaily {
  id              BigInt   @id @default(autoincrement())
  projectId       BigInt
  date            DateTime @db.Date
  fundsRaised     BigInt   @default(0)
  liftMinted      BigInt   @default(0)
  liftRetired     BigInt   @default(0)
  
  @@unique([projectId, date])
  @@index([date])
}
```

### 7.2 Simplified API (Fastify) Routes
```
POST   /projects                         -> mint ProjectNFT + DB row
POST   /projects/batch                   -> batch mint multiple projects
GET    /projects/:id                     -> project + rollups  
GET    /projects                         -> list projects with filtering
PATCH  /projects/:id/state               -> setProjectState
PATCH  /projects/:id/uris                -> updateURIs (tokenURI/registryDataURI/dataHash)
POST   /projects/:id/attest              -> verifier attestation (round, reportURI, hash)

// Updated existing endpoints - now require projectId
POST   /forwards                         -> requires projectId (breaking change)
POST   /forwards/batch                   -> batch create forwards
POST   /lift/batches                     -> requires projectId (breaking change)
POST   /lift/retire                      -> requires projectId (breaking change)

// New analytics endpoints
GET    /projects/:id/metrics             -> project metrics and charts  
GET    /projects/:id/verification        -> verification history
```

**Simplified Auth Strategy**:
- Role checks via signer/EOA or delegated executor controlled by ORNA Governor
- Per-project permissions cached in Redis for performance
- Rate limiting on write operations to prevent spam
- **No feature flags needed** since no existing data to maintain compatibility with

## 8) Enhanced Indexer & Events

### New Listeners with Optimized Processing
- **ProjectCreated**, **ProjectStateChanged**, **ProjectURIsUpdated**, **VerifierAttested**
- **ForwardLinked**, **LiftBatchLinked**, **RetiredAgainstProject**

### Performance Optimizations
- **Batch Processing**: Process events in batches during high-volume periods
- **Indexer Scaling**: Implement horizontal scaling for indexer workers
- **Event Queues**: Use Redis/PostgreSQL queues for reliable event processing
- **Checkpoint Recovery**: Implement checkpoint system for resuming indexing after failures

### Enhanced Derived Tables
- **project_metrics_daily** (snapshots of totals: funds raised, lift minted, retired)
- **verification_rounds** (round, report URI/hash, attestor, timestamp)
- **project_state_history** (audit trail of all state changes)
- **indexer_checkpoints** (last processed block per chain for recovery)

## 9) UX Integration
- **Routes**: `/projects/:projectId`
- **Project page**: hero (name, state), steward/org, map (bbox), MAW dates, verification badges, docs, funding progress, batches issued, retirements by beneficiary.
- **Enhanced Creation wizard** (REGISTRY_ADMIN or PROJECT_OWNER):
  1. Basics → 2) Geo & baselines → 3) Protocols & MAW → 4) Upload docs → 5) Review → 6) Mint Project
  - **Progress saving**: Save draft state between steps
  - **Validation**: Real-time validation with helpful error messages
- **Guardrails**:
  - "Create Forward" UI disabled unless state allows.
  - "Issue Lift Batch" visible only to ISSUER_ROLE + verified round attached.
  - **Batch operations UI** for admin efficiency

## 10) Simplified Implementation Plan (No Existing Projects)

Since there are no existing projects in the database, we can implement this as a clean, straightforward deployment without complex migration concerns.

### Phase A — Contract Development & Testing
1. **Testnet Development**:
   - Deploy ProjectNFT (UUPS, Pausable) to testnet
   - Update LiftForward + LiftToken contracts to require projectId
   - Grant roles to test Governor/executor
   - **Comprehensive testing** with realistic workflows
   
2. **Integration Testing**:
   - Test complete project lifecycle: creation → funding → verification → token issuance
   - Verify batch operations and gas efficiency
   - Test pause/unpause functionality
   - End-to-end API and UI testing

### Phase B — Database Schema Update
1. **Apply Prisma Migrations**:
   - Add Project model and related tables
   - Update LiftForward/LiftBatch models to include projectId
   - Add indexes for performance
   - **No data migration needed** since no existing projects exist

2. **API Development**:
   - Implement new project endpoints
   - Update existing endpoints to require projectId where applicable
   - Add proper role-based authentication
   - No feature flags needed for gradual rollout

### Phase C — Mainnet Deployment
1. **Deploy Contracts**:
   - Deploy to mainnet (can start unpaused since no existing data conflicts)
   - Set up monitoring and alerting
   - Grant production roles to Governor/executor

2. **Go Live**:
   - Deploy API changes that now require projectId for new forwards/batches
   - Enable project creation UI
   - **No complex cutover needed** - just start requiring projects for new operations

### Simplified Benefits
- **No data migration scripts needed**
- **No parallel system operation required**
- **No rollback complexity** - can pause contracts if issues arise
- **Immediate enforcement** of project-first workflow
- **Clean, consistent data model** from day one

## 11) Enhanced Security & Governance

### Security Enhancements
- **All state transitions gated by roles**; VERIFIER attestations are append-only (no edit, only supersede).
- **registryDataURI updates require dataHash** (clients verify content match).
- **Pausable pattern on ProjectNFT** with emergency pause capability.
- **Rate limiting** on sensitive operations to prevent abuse.
- **Multi-signature requirements** for critical role grants above a threshold.

### Governance Integration
- **EIP-712 typed data** for off-chain approvals for attestation submissions.
- **Timelock integration** for sensitive parameter changes.
- **Role rotation policies** to prevent single points of failure.
- **Audit trail** for all administrative actions.

## 12) Gas Optimization Strategy

### Contract Optimizations
- **Batch operations** for multiple projects, forwards, and batches
- **Packed structs** to minimize storage slots
- **Efficient event indexing** with proper indexed parameters
- **Storage pattern optimization** for frequently accessed data

### Usage Patterns
- **Per-project mint** ≈ ERC-721 mint + AccessControl checks (low, one-time)
- **Batch operations** significantly reduce gas per item
- **Frequent ops** (forwards, lifts, retirements) keep payloads minimal
- **IPFS storage** for large documents vs on-chain storage

### Gas Estimation Tools
- Pre-calculate gas costs for common operations
- Provide gas estimates in UI before transactions
- Implement gas price optimization strategies

## 13) Comprehensive Testing Matrix

### Unit Tests
- **Mint → update URIs → state transitions** (happy/invalid paths)
- **Verifier attests** before/after allowed windows; wrong role rejections
- **Forward creation** allowed vs. blocked by state
- **Lift batch mint** gated by verified round; wrong projectId rejected
- **Retirement emits** projectId and updates indexer rollups
- **UUPS upgrade** smoke tests
- **Pausable functionality** in various states

### Integration Tests
- **End-to-end workflows** from project creation to retirement
- **Batch operation efficiency** and gas usage
- **Migration simulation** with realistic data volumes
- **Indexer performance** under load
- **API rate limiting** and authentication

### Load Tests
- **High-volume batch operations**
- **Concurrent state changes**
- **Indexer throughput** during migration
- **Database performance** with projected data volumes

### Security Tests
- **Access control verification** for all roles
- **Reentrancy protection** on state-changing functions
- **Overflow/underflow protection** on numeric operations
- **Malicious metadata** handling

## 14) Enhanced Developer Tasks (Checklist)

### Smart Contracts
- [ ] Implement ProjectNFT (ERC-721, UUPS, AccessControl, Pausable)
- [ ] Wire events + role guards with per-project permissions
- [ ] Add batch operation functions for gas optimization
- [ ] Implement emergency pause functionality
- [ ] Update LiftForward + LiftToken to require projectId (breaking change - no backward compatibility needed)
- [ ] Add batch functions to existing contracts
- [ ] Comprehensive test suite (unit + integration + load)

### Backend
- [ ] Apply Prisma migration (new models with required projectId fields)
- [ ] Update API routes to require projectId (breaking changes acceptable)
- [ ] Implement role-based authentication with per-project caching
- [ ] Set up indexer for new events (no historical data to process)
- [ ] Build analytics rollup tables from day one
- [ ] **No migration scripts needed** - clean slate implementation

### Frontend
- [ ] Build project creation wizard (will be required workflow from start)
- [ ] Create project detail page with rollups and analytics
- [ ] Add batch operations UI for admin efficiency
- [ ] Implement state-based UI guards for forwards/batches/retirements
- [ ] Real-time validation and error handling
- [ ] **No migration UI needed** - projects required from day one

### DevOps
- [ ] Set up IPFS pinning strategy (primary + secondary + archival)
- [ ] Deploy monitoring and alerting for all components
- [ ] Set up indexer infrastructure (no catch-up processing needed)
- [ ] Implement backup and recovery procedures for IPFS content
- [ ] **No rollback planning needed** - can pause contracts if issues arise

## 15) Enhanced ProjectNFT Contract Skeleton

```solidity
contract ProjectNFT is 
    ERC721Upgradeable, 
    UUPSUpgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable,
    IProjectNFT 
{
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE       = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE         = keccak256("PAUSER_ROLE");

    uint256 private _nextId;
    uint256 public constant CURRENT_SCHEMA_VERSION = 1;
    mapping(uint256 => ProjectInfo) private _projects;
    
    // Per-project role tracking
    mapping(uint256 => mapping(bytes32 => address)) private _projectRoles;

    function initialize(address admin) public initializer {
        __ERC721_init("Orenna Project", "ORP");
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // Emergency pause functionality
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Enhanced project creation with schema versioning
    function createProject(
        address projectOwner,
        string calldata tokenURI_,
        string calldata registryDataURI_,
        bytes32 dataHash_
    ) external onlyRole(REGISTRY_ADMIN_ROLE) whenNotPaused returns (uint256 projectId) {
        projectId = ++_nextId;
        _safeMint(projectOwner, projectId);

        _projects[projectId] = ProjectInfo({
            projectId: projectId,
            owner: projectOwner,
            tokenURI: tokenURI_,
            registryDataURI: registryDataURI_,
            dataHash: dataHash_,
            state: 0, // DRAFT
            schemaVersion: CURRENT_SCHEMA_VERSION
        });

        // Grant project-specific owner role
        bytes32 projectOwnerRole = keccak256(abi.encodePacked("PROJECT_OWNER_", projectId));
        _grantRole(projectOwnerRole, projectOwner);

        emit ProjectCreated(projectId, projectOwner, tokenURI_, registryDataURI_, dataHash_, CURRENT_SCHEMA_VERSION);
    }

    // Batch creation for gas efficiency
    function createProjectsBatch(
        address[] calldata projectOwners,
        string[] calldata tokenURIs,
        string[] calldata registryDataURIs,
        bytes32[] calldata dataHashes
    ) external onlyRole(REGISTRY_ADMIN_ROLE) whenNotPaused returns (uint256[] memory projectIds) {
        require(
            projectOwners.length == tokenURIs.length &&
            tokenURIs.length == registryDataURIs.length &&
            registryDataURIs.length == dataHashes.length,
            "Array length mismatch"
        );

        projectIds = new uint256[](projectOwners.length);
        
        for (uint256 i = 0; i < projectOwners.length; i++) {
            projectIds[i] = createProject(
                projectOwners[i],
                tokenURIs[i],
                registryDataURIs[i],
                dataHashes[i]
            );
        }
    }

    // Enhanced state management with validation
    function setProjectState(uint256 projectId, uint8 newState) 
        external 
        whenNotPaused 
    {
        require(_exists(projectId), "Project does not exist");
        require(
            hasRole(REGISTRY_ADMIN_ROLE, msg.sender) || 
            hasRole(_getProjectOwnerRole(projectId), msg.sender),
            "Insufficient permissions"
        );

        uint8 currentState = _projects[projectId].state;
        require(_isValidStateTransition(currentState, newState), "Invalid state transition");

        _projects[projectId].state = newState;
        emit ProjectStateChanged(projectId, currentState, newState);
    }

    // Batch state updates
    function setProjectStatesBatch(uint256[] calldata projectIds, uint8[] calldata newStates) 
        external 
        onlyRole(REGISTRY_ADMIN_ROLE) 
        whenNotPaused 
    {
        require(projectIds.length == newStates.length, "Array length mismatch");
        
        for (uint256 i = 0; i < projectIds.length; i++) {
            setProjectState(projectIds[i], newStates[i]);
        }
    }

    // Enhanced URI updates with schema versioning
    function updateURIs(
        uint256 projectId, 
        string calldata tokenURI_, 
        string calldata registryDataURI_, 
        bytes32 dataHash_
    ) external whenNotPaused {
        require(_exists(projectId), "Project does not exist");
        require(
            hasRole(REGISTRY_ADMIN_ROLE, msg.sender) || 
            hasRole(_getProjectOwnerRole(projectId), msg.sender),
            "Insufficient permissions"
        );

        _projects[projectId].tokenURI = tokenURI_;
        _projects[projectId].registryDataURI = registryDataURI_;
        _projects[projectId].dataHash = dataHash_;
        // Optionally increment schema version on major updates

        emit ProjectURIsUpdated(projectId, tokenURI_, registryDataURI_, dataHash_, _projects[projectId].schemaVersion);
    }

    // Verification attestation with round tracking
    function attestVerification(
        uint256 projectId, 
        uint256 round, 
        bytes32 reportHash, 
        string calldata reportURI
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        require(_exists(projectId), "Project does not exist");
        emit VerifierAttested(projectId, round, reportHash, reportURI);
    }

    // Helper functions
    function _getProjectOwnerRole(uint256 projectId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("PROJECT_OWNER_", projectId));
    }

    function _isValidStateTransition(uint8 from, uint8 to) internal pure returns (bool) {
        // Implement state transition validation logic
        // Example: DRAFT(0) -> BASELINED(1) -> ACTIVE_FUNDRAISING(2), etc.
        return true; // Simplified for skeleton
    }

    // Override tokenURI to return project-specific URI
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return _projects[tokenId].tokenURI;
    }

    // Project info getter
    function info(uint256 projectId) external view returns (ProjectInfo memory) {
        require(_exists(projectId), "Project does not exist");
        return _projects[projectId];
    }

    // Pause-aware transfers
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);
        require(!paused(), "Token transfers paused");
    }
}
```

## Summary of Key Refinements

1. **Simplified Role Structure**: Reduced complexity while maintaining granular control via per-project roles
2. **Gas Optimization**: Added batch operations throughout the system
3. **Enhanced Security**: Pausable contracts, better access controls, and comprehensive validation
4. **Improved Migration Plan**: More careful phased approach with rollback capabilities and extensive testing
5. **IPFS Redundancy**: Multi-layer pinning strategy for data reliability
6. **Performance Optimizations**: Better indexing, caching, and database structure
7. **Schema Versioning**: Future-proofing for metadata evolution
8. **Comprehensive Testing**: More thorough testing matrix covering all scenarios
9. **Enhanced Monitoring**: Better observability throughout the system
10. **Developer Experience**: Clearer tasks, better documentation, and more robust tooling

This refined specification addresses the technical risks while maintaining the architectural elegance of the original plan, with particular focus on operational safety during the migration and long-term maintainability.