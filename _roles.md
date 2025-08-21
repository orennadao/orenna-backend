# Orenna Roles & Permissions — Integrated Spec (v1)

**Updated:** 2025-08-21
**Scope:** Roles taxonomy, persistence, verification cadence, API, web guards, and disbursement approvals integrated with treasury (Safe).

---

## 0) Goals & Principles

* **Safety by design:** segregate duties; minimize standing privileges; time-bound trust.
* **Hybrid truth:** DB for identity & trust roles; chain for governance power & treasury control.
* **Deterministic UX:** client hints, server enforcement.
* **Event-driven correctness:** short TTL caching + on-chain event invalidation.

---

## 1) Role Taxonomy

### Base

* **GUEST** (unauthenticated)
* **MEMBER** (authenticated via SIWE; default on first login)

### Elevated (DB, global unless noted)

* **PROJECT\_CREATOR** — may create projects; on create → auto grant **PROJECT\_MANAGER** scoped to that project.
* **PROJECT\_MANAGER** *(scoped: projectId)* — manage project details, milestones, verification submissions; create invoices.
* **VERIFIER** — submit/approve verification packages per policy; time-limited; application + review.
* **DISBURSEMENT\_APPROVER** — off-chain business approval of invoices before treasury scheduling.
* **TREASURER** — *on-chain* Safe signer (mirrored read-only to DB); schedules/executes payouts.
* **ADMIN** — platform administration (role grants, policy config, suspensions); no automatic on-chain power.

### Computed (token-gated, not stored)

* **can.vote** — governance voting power > 0 (incl. delegated).
* **can.propose** — voting power ≥ proposal threshold.
* **can.delegate** — available when connected & on correct chain.

> **Notes**
>
> * Elevated roles may be **time-limited** (e.g., 12–24 months) with renewal & audit.
> * Conflict-of-interest: users cannot approve their **own** project’s invoices or verifications.

---

## 2) Permissions Matrix (high level)

| Capability / Role                  | GUEST | MEMBER | PROJECT\_CREATOR | PROJECT\_MANAGER\* | VERIFIER | DISBURSEMENT\_APPROVER | TREASURER | ADMIN |
| ---------------------------------- | :---: | :----: | :--------------: | :----------------: | :------: | :--------------------: | :-------: | :---: |
| Browse public content              |   ✅   |    ✅   |         ✅        |          ✅         |     ✅    |            ✅           |     ✅     |   ✅   |
| Fund (guest checkout disabled)     |   ❌   |    ✅   |         ✅        |          ✅         |     ✅    |            ✅           |     ✅     |   ✅   |
| Create Project                     |   ❌   |    ❌   |         ✅        |          —         |     ❌    |            ❌           |     ❌     |   ✅   |
| Manage Project (scoped)            |   ❌   |    ❌   |         —        |          ✅         |     ❌    |            ❌           |     ❌     |   ✅   |
| Submit Verification (scoped)       |   ❌   |    ❌   |         —        |          ✅         |     ✅    |            ❌           |     ❌     |   ✅   |
| Approve Verification               |   ❌   |    ❌   |         ❌        |          ❌         |     ✅    |            ❌           |     ❌     |   ✅   |
| Approve Disbursement (off-chain)   |   ❌   |    ❌   |         ❌        |          ❌         |     ❌    |            ✅           |     ❌     |   ✅   |
| Schedule/Execute Payout (on-chain) |   ❌   |    ❌   |         ❌        |          ❌         |     ❌    |            ❌           |     ✅     |   —   |
| Governance Vote (computed)         |   ❌   |   ◻︎   |        ◻︎        |         ◻︎         |    ◻︎    |           ◻︎           |     ◻︎    |   ◻︎  |
| Governance Propose (computed)      |   ❌   |   ◻︎   |        ◻︎        |         ◻︎         |    ◻︎    |           ◻︎           |     ◻︎    |   ◻︎  |
| Grant/Revoke Roles                 |   ❌   |    ❌   |         ❌        |          ❌         |     ❌    |            ❌           |     ❌     |   ✅   |

\* Project Manager is automatically granted (scoped) to the creator on successful project creation.

Legend: ✅ allowed · ❌ disallowed · ◻︎ computed at request-time

---

## 3) Persistence Model (DB + Chain)

### Database (canonical for trust & scope)

```prisma
model Role {
  id        String  @id @default(cuid())
  name      String  @unique // ADMIN, PROJECT_CREATOR, VERIFIER, PROJECT_MANAGER, DISBURSEMENT_APPROVER
  isScoped  Boolean @default(false)
}

model RoleGrant {
  id         String   @id @default(cuid())
  userId     String
  roleId     String
  scopeType  String?  // "project" | null
  scopeId    String?  // project id when scoped
  status     String   @default("ACTIVE") // ACTIVE|SUSPENDED|REVOKED|EXPIRED|PENDING
  grantedBy  String
  grantedAt  DateTime @default(now())
  expiresAt  DateTime?
  reason     String?
  @@index([userId, roleId, scopeType, scopeId, status])
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  action    String   // ROLE_GRANTED, ROLE_REVOKED, SAFE_OWNER_SYNC, etc.
  targetId  String?
  meta      Json?
  createdAt DateTime @default(now())
}
```

### Treasury & Finance (excerpt)

```prisma
model EscrowAccount { id String @id @default(cuid()) projectId String chainId Int safeAddress String createdAt DateTime @default(now()) }
model Invoice {
  id String @id @default(cuid())
  projectId String
  payeeAddress String
  amountCents BigInt
  currency String
  milestoneId String?
  evidenceUrl String?
  createdBy String
  status String @default("DRAFT") // DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|SCHEDULED|EXECUTED|FAILED
  submittedAt DateTime? approvedAt DateTime? scheduledAt DateTime? executedAt DateTime?
  reason String?
}
model InvoiceApproval { id String @id @default(cuid()) invoiceId String approverId String decision String note String? createdAt DateTime @default(now()) }
model TreasurySchedule { id String @id @default(cuid()) invoiceId String @unique chainId Int safeAddress String tokenAddress String? amountWei BigInt toAddress String txHash String? status String @default("PENDING") createdBy String createdAt DateTime @default(now()) }
model FinancePolicy { id String @id @default(cuid()) projectId String? tier1MaxCents BigInt tier2MaxCents BigInt tier1Approvers Int tier2Approvers Int tier3Approvers Int requireGovForT3 Boolean }
```

### On-chain (source of truth)

* **Governor / ERC-20**: voting power, delegation, proposal threshold → used to compute `can.vote` / `can.propose`.
* **Safe (Gnosis)**: escrow ownership; signers list → mirrored to DB for read-only `TREASURER` display & auth.

---

## 4) Verification Cadence & Caching

* **When to recompute:**

  * At login; before any privileged action (project create, verification approve, disbursement actions);
  * Hourly for active sessions; and on indexer-detected events.
* **Caching:**

  * Token-gated claims: Redis TTL **10 min**; keys: `gov:vp:{chain}:{addr}`; invalidate on `Transfer`, `DelegateChanged`, `DelegateVotesChanged`, governor param updates.
  * DB roles: Redis TTL **5 min**; always check `expires_at` and `status`.
* **Revocation:** Admin revocation or suspension triggers cache purge + immediate enforcement.

---

## 5) Role Lifecycle & Policies

* **Granting:** Admin UI; record `grantedBy`, `reason`, `expiresAt`.
* **Auto-grant:** on project creation, grant `PROJECT_MANAGER` scoped to new project.
* **Verifier:** application + review; grant with 12-month expiry; periodic QA; optional stake (future).
* **Treasurer:** read-only mirror of Safe owners; changes originate on-chain.
* **Disbursement Approver:** grant time-limited; conflict-of-interest enforced.
* **Expiry:** background job nightly + on-demand check transitions ACTIVE→EXPIRED; notify users.
* **COI rules:**

  * PM cannot approve their own project’s invoices or verifications.
  * Approver cannot approve invoices they authored.

---

## 6) Disbursement Workflow (integrated)

**State:** `DRAFT → SUBMITTED → UNDER_REVIEW → (APPROVED | REJECTED) → SCHEDULED → (EXECUTED | FAILED)`

* **Submit:** by `PROJECT_MANAGER` (scoped); must attach milestone/evidence.
* **Approve:** by `DISBURSEMENT_APPROVER` meeting `FinancePolicy` quorum; COI checks.
* **Schedule/Execute:** by `TREASURER` (Safe signer) → indexer posts status → ledger updates and receipt.

---

## 7) API Surface (REST)

### Roles & Claims

```
GET    /me/roles                          // DB roles (scoped + global)
GET    /me/capabilities                   // computed: vote/propose/delegate
POST   /admin/roles/grant                 // body: {userId, role, scopeType?, scopeId?, expiresAt?, reason}
POST   /admin/roles/revoke                // body: {roleGrantId, reason}
POST   /admin/roles/suspend               // body: {roleGrantId, reason}
GET    /admin/roles/grants?userId=&role=  // query & audit
```

### Finance / Disbursements (excerpt)

```
POST   /invoices                          // PM (scoped)
POST   /invoices/:id/submit               // PM (scoped)
GET    /invoices?projectId=&status=       // PM/Approver/Treasurer
POST   /invoices/:id/approve              // Approver (COI checks)
POST   /invoices/:id/reject               // Approver
POST   /invoices/:id/schedule             // Treasurer
POST   /webhooks/tx-status                // Indexer callback
GET    /finance/policy?projectId=         // View policy
POST   /finance/policy                    // Admin upsert
```

### Governance (read-only here)

```
GET    /gov/thresholds                    // proposal threshold, quorum
GET    /gov/power/:address                // voting power (cache-backed)
```

---

## 8) Server AuthZ Middleware

### `authorize()` (pseudo)

```ts
// authorize({ anyOf: [ {role: 'ADMIN'}, {role: 'PROJECT_MANAGER', scope: {type:'project', id: params.projectId}} ] })
export async function authorize(ctx, policy) {
  const user = ctx.user; if (!user) throw new HttpError(401);
  const dbRoles = await getDbRoles(user.id, policy.scope); // checks scope & expiry
  const chainClaims = await getChainClaims(user.address);  // can.vote, can.propose

  const ok = policy.anyOf.some(rule =>
    rule.role ? hasDbRole(dbRoles, rule) : hasClaim(chainClaims, rule.claim)
  );
  if (!ok) throw new HttpError(403);
}
```

### Examples

* Create project: `authorize({ anyOf: [{role:'PROJECT_CREATOR'}, {role:'ADMIN'}] })`
* Approve invoice: `authorize({ anyOf: [{role:'DISBURSEMENT_APPROVER'}] })` + COI guard
* Schedule payout: `authorize({ anyOf: [{role:'TREASURER'}] })` (validated via Safe owners mirror)

---

## 9) Web (UI/UX Guards)

* **Client hints:** hide CTAs when user lacks role/claim; show inline rationale (“Requires Disbursement Approver”).
* **Route guards:** redirect to connect/onboarding when unauth; show 403 page for forbidden.
* **Admin console:** role grants (global & scoped), policy editor, verifier queue, treasury signer sync (read-only), audit log viewer.
* **Treasury dashboard:** Disbursements queue (Pending Approval, Approved, Scheduled, Executed, Failed) with evidence drawer & Safe deep-links.
* **Approver queue:** My Reviews with Approve/Reject + note; COI banner.
* **Project view:** Invoices tab for PMs: create → submit → track.

---

## 10) Telemetry & Audit

* Events: `role_granted`, `role_revoked`, `role_suspended`, `invoice_*`, `safe_owner_sync`, `gov_claim_cache_invalidate`.
* `AuditLog` entry per state change with actor, target, meta (projectId, invoiceId, txHash, reason).

---

## 11) Jobs & Indexers

* Nightly expiry sweep for `RoleGrant` → `EXPIRED` + notifications.
* Safe owners sync job (or indexer subscription) → update treasurer display; alert on change.
* Governance event listeners → invalidate capability cache.

---

## 12) Security Considerations

* Enforce 2FA for `ADMIN`, `DISBURSEMENT_APPROVER`, and any wallet binding flows.
* Separate keys/devices for treasury signers; require >=2 signers policy on Safe.
* Break-glass: `ADMIN` can suspend any DB role immediately; cannot override Safe signer list.
* Rate-limit approval & scheduling endpoints; signed webhooks with replay protection.

---

## 13) Definition of Done

* [ ] Prisma migration for `Role`, `RoleGrant`, finance models seeded.
* [ ] Seed roles: ADMIN, PROJECT\_CREATOR, PROJECT\_MANAGER (scoped), VERIFIER, DISBURSEMENT\_APPROVER.
* [ ] `authorize()` middleware wired on protected routes; COI guard implemented.
* [ ] `/me/roles` & `/me/capabilities` endpoints + Redis caches.
* [ ] Admin console for grants, policy, verifier queue; audit viewer.
* [ ] Treasury: disbursement queue UI; Safe payload creation; webhook handling.
* [ ] Indexers emit events to invalidate caches; Safe owners mirrored.
* [ ] E2E tests for role gates; unit tests for policy/quorum; smoke tests for scheduling → executed path.

---

## 14) Migrations & Seeding (outline)

1. Add `Role` & `RoleGrant` tables; add finance tables if not present.
2. Seed roles and a global `FinancePolicy` default (e.g., tier1=\$25k, tier2=\$100k, requireGovForT3=true).
3. Backfill `PROJECT_MANAGER` grants for existing projects.
4. Create admin account; grant `ADMIN`.

---

## 15) Env & Config

* `GOVERNANCE_CHAIN_ID`, `GOVERNANCE_TOKEN_ADDRESS`, `GOVERNOR_ADDRESS`
* `SAFE_TX_SERVICE_URL`, `SAFE_ESCROW_CHAIN_IDS`
* `REDIS_URL`, `JWT_SECRET`, `WEBHOOK_SECRET`
* Policy overrides via DB (do not rely on env for policy numbers in prod).

---

## 16) Roadmap (v2+)

* On-chain role registry (ERC-5114-style or custom) for verifier attestations.
* Slashing bond for `VERIFIER` via timelocked vault.
* Delegated approvals & queue sharding for large programs.
* Org accounts & team-level role templates.
