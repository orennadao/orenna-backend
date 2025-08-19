# Orenna Project Finance & Invoicing System (Lift Forward Payor)

**Version:** 2025-08-16  
**Owner:** Orenna DAO LLC

---

## Core Idea

Every project has a **Lift Forward account** (treasury bucket). The app maintains a double‑entry sub‑ledger per project with the buckets **Committed** (contracts/POs), **Encumbered** (approved but unpaid invoices), and **Disbursed** (paid). Funds cannot be disbursed unless available balance ≥ invoice net (after retention/withholds) and approvals are satisfied.

---

## Roles & Permissions (RBAC)

- **Vendor/Contractor** — submit invoices, upload docs, view their own payments.
- **Project Manager (PM)** — create budgets/POs, verify receipt of work, recommend approval ≤ limit.
- **Finance Reviewer** — compliance checks (W‑9/W‑8, COI, debarment, bank info), GL coding.
- **Treasurer** — release payments, manage payment runs, configure treasury rails.
- **DAO Multisig** — co‑sign large disbursements (on‑chain/off‑chain threshold).
- **Auditor/Beneficiary (read‑only)** — view spend, artifacts, and full audit trail.

**Default approval matrix (project‑configurable):**  
- ≤ $10k: PM + Finance  
- $10k–$50k: PM + Finance + Treasurer  
- > $50k: Above + DAO Multisig (e.g., 2/3 Safe signers)

**✅ IMPLEMENTED:** Full RBAC system with configurable approval matrix, role assignment APIs, and permission-based route protection.

---

## Minimum Viable Data Model (Conceptual)

- **Project** `{ id, name, status, currency, liftForwardAccountId }`
- **FundingBucket** `{ id, projectId, type: "LiftForward", available, reserved, currency }`
- **BudgetLine** `{ id, projectId, wbsCode, description, cap, spent, committed }`
- **Contract/PO** `{ id, vendorId, projectId, notToExceed, retentionPct, paymentTerms, fundingBucketId, budgetAllocations[] }`
- **ChangeOrder** `{ id, contractId, delta, reason }`
- **Vendor** `{ id, name, taxStatus, bankMethod, kycStatus, coiExpiry, docs[] }`
- **Invoice** `{ id, contractId, vendorId, periodStart, periodEnd, status, subtotal, retention, taxes, withholds, total, coding[], attachments[] }`
- **Approval** `{ id, targetId, role, approver, decision, timestamp, note }`
- **Disbursement** `{ id, invoiceId, method, scheduledOn, executedOn, txRef, status }`
- **LedgerEntry** `{ id, bucketId, type, amount, currency, refType, refId, createdBy }`
- **VerificationGate** (optional) `{ id, projectId, type: milestone/monitoring, requiredFor: retentionRelease|finalPayment }`

All money fields: `{ amount, currency, fxRateAtBooking? }`

### Suggested SQL (DDL Skeleton)

```sql
-- Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  currency TEXT NOT NULL DEFAULT 'USD',
  lift_forward_account_id TEXT NOT NULL
);

-- Funding buckets
CREATE TABLE funding_buckets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('LiftForward')),
  available_cents INTEGER NOT NULL DEFAULT 0,
  reserved_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Vendors
CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tax_status TEXT,
  bank_method TEXT,      -- ACH | USDC | OnchainSafe
  kyc_status TEXT,       -- pending | passed | failed
  coi_expiry DATE,
  metadata JSON
);

-- Budget lines
CREATE TABLE budget_lines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  wbs_code TEXT NOT NULL,
  description TEXT,
  cap_cents INTEGER NOT NULL DEFAULT 0,
  committed_cents INTEGER NOT NULL DEFAULT 0,
  spent_cents INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Contracts / POs
CREATE TABLE contracts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  not_to_exceed_cents INTEGER NOT NULL,
  retention_pct INTEGER NOT NULL DEFAULT 10, -- 10 = 10%
  payment_terms TEXT,
  funding_bucket_id TEXT NOT NULL,
  metadata JSON,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (funding_bucket_id) REFERENCES funding_buckets(id)
);

CREATE TABLE change_orders (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  delta_cents INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- Invoices
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL, -- draft | submitted | under_review | approved | scheduled | paid | closed | rejected
  subtotal_cents INTEGER NOT NULL,
  retention_cents INTEGER NOT NULL,
  taxes_cents INTEGER NOT NULL,
  withholds_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  attachments JSON,
  created_by TEXT,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Invoice coding to WBS
CREATE TABLE invoice_coding (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  budget_line_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id)
);

-- Approvals
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL, -- invoice | disbursement | contract | change_order
  target_id TEXT NOT NULL,
  role TEXT NOT NULL,
  approver TEXT NOT NULL,
  decision TEXT NOT NULL, -- approved | rejected
  note TEXT,
  decided_at DATETIME NOT NULL
);

-- Disbursements
CREATE TABLE disbursements (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  method TEXT NOT NULL,      -- ACH | USDC | OnchainSafe
  status TEXT NOT NULL,      -- scheduled | executed | failed | canceled
  scheduled_on DATE,
  executed_on DATETIME,
  tx_ref TEXT,
  metadata JSON,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Ledger entries
CREATE TABLE ledger_entries (
  id TEXT PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  type TEXT NOT NULL,        -- COMMIT | ENCUMBER | DISBURSE | RELEASE
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  ref_type TEXT NOT NULL,    -- CONTRACT | INVOICE | DISBURSEMENT
  ref_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (bucket_id) REFERENCES funding_buckets(id)
);

-- Verification gates (optional)
CREATE TABLE verification_gates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,        -- milestone | monitoring
  requirement TEXT NOT NULL, -- e.g., 'vegetation survival ≥ 70% @ 12 months'
  required_for TEXT NOT NULL,-- retentionRelease | finalPayment
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

---

## Lifecycles & State Machines

### Setup
1. Create **Project** → **FundingBucket (LiftForward)** seeded via Lift Bonds/treasury allocations.  
2. Build **BudgetLines** (WBS) and **Contracts/POs** mapped to budget.

### Vendor Onboarding
- Collect W‑9/W‑8, bank details, COI, sanctions check.  
- `vendor.kyc_status = 'passed'` gates invoice submission.

### Invoicing (Vendor)
**States:** `draft → submitted → under_review → approved → scheduled → paid → closed/rejected`  
- Vendor enters line items, period, % complete, attaches SOV/timecards, photos.  
- System checks: NTE, budget coverage, retention math, related COs applied.  
- On **submitted** → **ENCUMBER** ledger entry (reserve cash).

### Review & Approvals
- PM confirms work/quantities & WBS coding.  
- Finance validates docs, tax, math, GL.  
- Treasurer (+ DAO Multisig if threshold) final‑approves.  
- On **approved**: invoice becomes payable and eligible for payment run.

### Disbursement
- Treasurer runs **Payment Run** (batched by method/due date).  
- Methods: **ACH**, **USDC**, **On‑chain Safe**.  
- On **scheduled**: create **DISBURSE (pending)** ledger entry.  
- On **executed**: finalize disburse, attach bank ref / tx hash, invoice → **paid**.

### Retention & Verification Gates
- Auto retention (e.g., 10%) held as **reserved** until gate met (e.g., survival ≥ 70% @ 12 months).  
- When met, create **Retention Release** invoice with approvals → disburse.

### Reconciliation & Reporting
- Match disbursements to bank/chain statements.  
- Dashboard: **Available**, **Committed**, **Encumbered**, **Disbursed**, **Runway**, **Burn rate**.

---

## Funds‑Availability Logic

```ts
const available = bucket.available - bucket.reserved;
const required  = invoice.total - taxesWithheld - earlyPayDiscount + fees;
if (available < required) {
  throw new Error('Insufficient Lift Forward funds: add funds, reduce scope, or split invoice.');
}
```

Encumbrances reduce **available** immediately on submission to prevent overspend.

---

## Smart‑Contract & Treasury Integration

- **Incoming**: Lift Bonds / beneficiary pre‑purchases → fund Lift Forward bucket (fiat/USDC).  
- **Outgoing**: Optional on‑chain payments via **Safe**, with memo tags `projectId:invoiceId:wbs`.  
- **Events**: All disbursements emit internal events; on‑chain ones store the tx hash to tie spend → eventual Lift Unit issuance.  
- **Gates**: When verification passes and Lift Units are minted, trigger **Retention Release** and optional beneficiary receipts.

---

## Approvals & Controls

- Threshold routing (configurable per project).  
- **Segregation of duties**: submitter ≠ final approver; Treasurer cannot approve their own vendor.  
- **Budget locks**: exceeding a BudgetLine cap requires a Change Order or DAO vote link.  
- **Document completeness**: COI valid, W‑9 on file, lien releases for progress draws, etc.

---

## UI / Screens

1. **Project Finance Home** — Lift Forward card (Available/Committed/Encumbered/Disbursed), burn chart, runway, alerts.  
2. **Budget & Contracts** — WBS tree with caps vs. committed vs. spent; Contract detail with retention & COs.  
3. **Invoices Queue** — filters (status, vendor, due), bulk actions for payment runs.  
4. **Invoice Detail** — SOV lines, attachments, coding, approvals timeline, funds‑availability widget.  
5. **Payment Runs** — build batch by due date/method; confirm; execute; show bank refs/tx hashes.  
6. **Vendors** — onboarding status, compliance checklist, payment history.  
7. **Audit Log** — append‑only events with diffs and who/when, exportable.  
8. **Verification Gates** — gates, data, attestations, linked retention.

---

## API Sketch (REST; Fastify‑friendly)

```http
POST   /projects/:id/funding-buckets          # create/seed Lift Forward
GET    /projects/:id/finance/summary          # balances & metrics

POST   /vendors                               # onboard
GET    /vendors/:id

POST   /contracts                             # create PO/NTE
POST   /contracts/:id/change-orders

POST   /invoices                              # submit (vendor)
PATCH  /invoices/:id/status                   # review/approve/reject
POST   /invoices/:id/schedule                 # queue for payment
GET    /invoices/:id

POST   /payment-runs                          # create batch
POST   /payment-runs/:id/execute              # trigger rails / Safe

GET    /disbursements/:id                     # status, refs
GET    /audit?projectId=...                   # event stream
```

### Event Topics
`invoice.submitted`, `invoice.approved`, `invoice.rejected`, `paymentrun.created`, `payment.executed`, `payment.failed`, `verification.passed`, `retention.release_created`

---

## Minimal Types (TypeScript)

```ts
type Currency = 'USD' | 'USDC';
type Money = { amount: string; currency: Currency; fx?: string };

type LedgerEntry = {
  id: string;
  bucketId: string;
  type: 'COMMIT' | 'ENCUMBER' | 'DISBURSE' | 'RELEASE';
  amount: Money;
  ref: { kind: 'CONTRACT' | 'INVOICE' | 'DISBURSEMENT'; id: string };
  createdBy: string;
  createdAt: string;
};

type InvoiceStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED'
  | 'SCHEDULED' | 'PAID' | 'CLOSED' | 'REJECTED';

type Invoice = {
  id: string;
  contractId: string;
  vendorId: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  subtotal: Money;
  retention: Money;
  taxes: Money;
  withholds: Money;
  total: Money;
  coding: { budgetLineId: string; amount: Money }[];
};
```

---

## Reporting

- **Cash waterfall** by phase (Origination → Implementation → Verification → Issuance).  
- **Vendor concentration** and **Aging**.  
- **Budget variance** (cap vs. committed vs. spent) at WBS levels.  
- **Spend‑to‑Lift**: dollars disbursed per expected Lift Unit (guides beneficiary pricing).

---

## Safeguards & Compliance (Lean)

- Encrypt bank details; rotate secrets.  
- Sanctions/OFAC checks at onboarding and pre‑payment.  
- 1099 totals export; COI expiry alerts.  
- Two‑person rule for payments above threshold; immutable audit log.

---

## Implementation Status

### ✅ **Completed: RBAC System (Finance Roles & Permissions)**
**Database Schema:**
- `ProjectRole` - Project-specific role assignments with approval limits
- `SystemRole` - Global system role assignments  
- `ApprovalMatrix` - Configurable approval thresholds per project
- `RoleChangeEvent` - Complete audit trail for role changes
- Enums: `FinanceRole`, `SystemRoleType`, `RoleChangeType`

**Finance Roles Implemented:**
- `VENDOR` - Submit invoices, upload docs, view own payments
- `PROJECT_MANAGER` - Create budgets/POs, verify work, approve ≤ limit
- `FINANCE_REVIEWER` - Compliance checks, tax validation, GL coding  
- `TREASURER` - Release payments, manage payment runs, treasury config
- `DAO_MULTISIG` - Co-sign large disbursements, configure approval matrix
- `AUDITOR` - Read-only access to all spend and audit trails
- `BENEFICIARY` - Read-only project information access

**System Roles:**
- `PLATFORM_ADMIN` - Manage all projects and assign roles
- `SYSTEM_AUDITOR` - Read-only access to all projects  
- `TREASURY_MANAGER` - Configure global treasury settings

**API Endpoints:** (`/api/projects/:projectId/roles/`)
- `GET user/:userAddress` - Get user roles for project
- `POST assign` - Assign project role with approval limits
- `POST revoke` - Revoke project role with audit trail
- `GET` - List all project roles (admin view)
- `GET /approval-matrix` - Get approval configuration
- `PUT /approval-matrix` - Update approval rules (DAO Multisig only)

**Security Features:**
- Role hierarchy enforcement (prevent privilege escalation)
- Permission-based middleware for route protection
- Approval amount validation against user limits
- Segregation of duties enforcement
- Complete audit trail for all role changes
- Performance-optimized with role caching

**Technical Implementation:**
```typescript
// Example: Role-based route protection
app.get('/projects/:projectId/invoices', {
  preHandler: rbacService.requirePermission('canViewAllProjectInvoices', { 
    projectIdParam: 'projectId' 
  })
}, async (request, reply) => {
  // Handler has access to request.roleContext with user permissions
});

// Example: Approval amount validation
const canApprove = await rbacService.canApproveAmount(
  userId, projectId, invoiceAmount
);
```

**File Locations:**
- Schema: `packages/db/prisma/schema.prisma` (lines 870-1037, 1045-2002)
- RBAC Service: `apps/api/src/lib/rbac.ts`
- Role APIs: `apps/api/src/routes/roles.ts`
- Type Definitions: `apps/api/src/types/fastify.d.ts`

### ✅ **Completed: Financial Data Model (10 Core Models)**
**Database Schema Extensions:**
- `Vendor` - Complete vendor management with KYC, banking, compliance
- `VendorDocument` - Secure document storage with verification
- `FundingBucket` - Lift Forward accounts with double-entry fund tracking
- `BudgetLine` - WBS structure with hierarchical budget management  
- `FinanceContract` - Contracts/POs with retention and payment terms
- `ChangeOrder` - Contract modifications with approval workflow
- `Invoice` - Full invoice lifecycle with approval matrix integration
- `InvoiceCoding` - WBS allocation for GL coding and cost tracking
- `Disbursement` - Payment execution with multi-method support
- `LedgerEntry` - Double-entry accounting with reconciliation
- `VerificationGate` - Milestone-based retention release automation

**Financial Architecture:**
```typescript
// Double-entry fund flow tracking
Available → Committed → Encumbered → Disbursed
    ↓           ↓           ↓           ↓
Contract    Invoice    Payment    Reconciled
 Signed    Approved   Executed   Confirmed

// Example: Funds availability check
const available = bucket.availableCents - bucket.reservedCents;
const required = invoice.netPayableCents;
if (available < required) {
  throw new Error('Insufficient Lift Forward funds');
}
```

**Compliance & Security:**
- KYC/AML vendor onboarding with document verification
- Tax compliance (W-9/W-8 forms, 1099 tracking)
- Insurance requirements (COI, performance bonds)
- Sanctions/debarment checking with automated workflows
- Complete audit trail with hash verification

**File Locations:**
- Financial Schema: `packages/db/prisma/schema.prisma` (lines 1045-2002)
- Data Model Summary: `FINANCE_DATA_MODEL_SUMMARY.md`

---

## Implementation Plan (Remaining Work)

### **Sprint 1 (Financial Core Models) - COMPLETED ✅**  
1) ✅ RBAC system with roles and approval matrix
2) ✅ **Database Schema**: 10 core financial models with 25+ enums
   - `Vendor`, `FundingBucket`, `BudgetLine`, `FinanceContract`
   - `ChangeOrder`, `Invoice`, `Disbursement`, `LedgerEntry`
   - `VendorDocument`, `VerificationGate`, supporting models
3) ✅ **Financial Architecture**: Double-entry accounting structure
4) ✅ **Compliance Framework**: KYC, tax forms, insurance, sanctions checking
5) ✅ **Workflow Design**: Invoice lifecycle, approval matrix, retention management

### **Sprint 2 (Service Layer & Business Logic) - NEXT**  
6) 🔄 **LedgerService**: Double-entry operations (COMMIT/ENCUMBER/DISBURSE/RELEASE)
7) 🔄 **VendorService**: KYC workflow, document management, compliance checks
8) 🔄 **InvoiceService**: Submission, validation, approval workflow, funds availability
9) 🔄 **ContractService**: Contract creation, change orders, budget allocation
10) 🔄 **Database Migration**: Apply schema changes and seed initial data

### **Sprint 3 (Payment Rails & APIs)**  
11) 🔄 **DisbursementService**: Payment execution, multi-method support (ACH/USDC/Safe)
12) 🔄 **Payment Rails**: Integration with bank providers, crypto wallets, Safe multisig
13) 🔄 **Finance APIs**: REST endpoints for vendor management, invoicing, contracts
14) 🔄 **Reconciliation Service**: Bank/blockchain transaction matching
15) 🔄 **Verification Integration**: Retention release automation with existing system

### **Sprint 4 (UI & Advanced Features)**
16) Finance Dashboard: Budget tracking, cash flow, payment runs
17) Vendor Portal: Invoice submission, document upload, payment history
18) Admin Interface: Contract management, approval workflows, reporting
19) Reporting & Analytics: Budget variance, aging reports, compliance dashboards
20) Tax Reporting: 1099 generation, compliance exports

### **Sprint 5 (Production & Integration)**
21) Mobile-responsive interfaces
22) Advanced compliance automation (OFAC, debarment)
23) ERP integration capabilities
24) Performance optimization and caching
25) Production deployment and monitoring

---

## Glossary

- **Lift Forward account** — project‑level treasury bucket used to pay contractors for delivery.  
- **Committed** — budget reserved via contracts/POs.  
- **Encumbered** — approved but unpaid invoice amounts.  
- **Disbursed** — cash paid out.  
- **Retention** — % withheld until verification gates are met.  
- **Verification Gate** — objective condition required for retention/final payment.
