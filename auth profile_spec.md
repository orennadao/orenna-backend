# /auth/profile — Product & Wireframe Spec (Next.js 14 + shadcn/ui)

*Last updated: Aug 20, 2025*

## 1) Page Purpose & Audience

The `/auth/profile` page is the user’s personal hub for identity, participation, and preferences across Orenna. It serves:

* **All users** (land stewards, funders, professionals, verifiers) for basic profile & settings
* **Governance participants** (token holders, delegates) for delegation & voting history
* **Project participants** (stewards & funders) for at‑a‑glance status & actions

**KPIs**: completion rate of profile (≥80%), wallet connection success, delegation rate, notification opt‑ins, time‑to-first-project action.

---

## 2) IA & Layout (Wireframe)

**Top-level layout**: 3-column grid on desktop, stacked on mobile.

* **Header**: Page title, breadcrumb (`Home / Profile`), last SIWE sign-in time, quick actions.
* **Left column (nav)**: Vertical tabs (shadcn `Tabs` + `ScrollArea`)

  * Overview
  * Wallets & Auth
  * Identity
  * Participation
  * Governance
  * Verification & Reputation
  * Notifications
  * Privacy & Data
  * Security
* **Center column (content)**: Active tab content
* **Right column (aside)**: Contextual cards (impact summary, quick links, tips)

**Responsive**:

* ≤md: Tabs collapse to a `Select` at top; aside collapses beneath content.

---

## 3) Component Map (shadcn/ui)

* **Layout**: `Tabs`, `Card`, `Separator`, `ScrollArea`, `Badge`, `Accordion`, `Dialog`, `DropdownMenu`, `Alert`, `Toast`, `Skeleton`
* **Inputs**: `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Button`, `Label`, `Slider`
* **Data**: `Table`, `Badge`, `Progress`
* **Feedback**: `Alert`, `Callout` (custom), `Toast`

---

## 4) Sections & Fields

### A) Overview (default tab)

**Cards**:

1. **Impact Snapshot**: acres restored, habitat types, tokens retired

   * `Card` with `Progress` bars and tiny sparkline (Recharts optional)
2. **My Activity**: latest 5 events (funded, verified, voted)

   * `Table` with date, type, link
3. **Quick Actions**: buttons: Connect wallet, Edit identity, Manage notifications

**Empty state**: friendly illustration, CTA: “Connect a wallet” + “Explore projects”.

---

### B) Wallets & Authentication

Fields/controls:

* Primary wallet (address + ENS), copy & `Badge` for chain
* **Connect Wallet** (`Button` + Wagmi/Viem modal)
* **Link additional wallets** with role tags: Funding / Governance / Ops
* **Preferred wallet for**: Funding, Governance (2 `Select`s)
* **SIWE sessions**: last 5 sign-ins (IP, time, device) + “Sign out of others”

Edge cases:

* Multiple wallets connected → require unique label per wallet
* Chain mismatch → `Alert` with quick switch

---

### C) Identity

Fields:

* Display name / alias (`Input`)
* Organization & Role (`Select`: Landowner, Funder, Professional, Verifier)
* Short bio (`Textarea`)
* Socials: Email (off‑chain), Discord, X/Twitter, LinkedIn, Website (`Input`s)
* Avatar uploader (image crop, 1:1)

Validation:

* Display name 2–40 chars; URLs normalized; email optional but validated

---

### D) Participation

Subsections (Accordion):

1. **My Projects** (stewarded or funded)

   * List: Project NFT card (title, location, status, role)
2. **Lift Forwards**

   * Table: project, amount, status (Funded/In progress/Completed), next milestone
   * Row actions: View escrow, view agreement
3. **Lift Tokens**

   * Balances by project (ERC‑1155 id), transferable/retired
   * Actions: Transfer, Retire (opens `Dialog` with confirmation + on‑chain fee notice)

Empty states with CTA to discover projects.

---

### E) Governance

Subsections:

* **Governance Tokens**: balance, claim (if any), **Delegate** flow

  * Delegate UI: pick address/ENS, “delegate to self”, confirm summary
* **Voting History**: last 10 votes (proposal title, vote, outcome)
* **Working Groups**: join/leave toggles (Design, Tokenomics, Legal, Verifier Ops, etc.)

Edge cases:

* No governance tokens → CTA card: “Learn how to participate”

---

### F) Verification & Reputation

* **Verifier status** (if role = Verifier): tier, credentials (link), completed audits
* **Badges**: first fund, first vote, first retirement, steward badge, verifier badge
* **Reputation score** (non‑financial): activity-based with decay; tooltip explains

---

### G) Notifications

* Channels: Email, Discord, In‑app (`Switch` per channel)
* Topics: Project updates, Milestone releases, Governance proposals, Token events
* Frequency: Instant / Daily digest / Weekly

UX: “Preview a sample email” link; `Button` to “Send test notification”.

---

### H) Privacy & Data

* Visibility toggles (public/private) for: Display name, org/role, social links, activity
* Data export (`Button` → async job, email link)
* Delete account (soft-delete with cooldown) — `Alert` with irreversible consequences text

---

### I) Security

* Connected sessions/devices list with revoke `Button`
* 2FA (if enabled via email/app): enable/disable, recovery codes (Download .txt)
* SIWE nonce and session expiry info

---

## 5) Interaction Flows

### Connect Wallet

1. `Connect Wallet` → wagmi connector modal
2. On connect, fetch ENS, mark as **Pending verification** until SIWE
3. Prompt SIWE → sign message → set session cookie/JWT
4. Success toast; update Preferred wallet selects

### Delegate Governance

1. Open `Dialog`, input ENS/address
2. Show current voting power and after-delegation preview
3. Confirm → on‑chain tx via viem → toast + optimistic UI

### Retire Lift Token

1. Select token(s), open `Dialog` with amount → show project, impact, fee est.
2. Confirm → on‑chain tx → issue Retirement Certificate (downloadable PDF)

---

## 6) Data Model (Prisma‑ish)

```ts
model User {
  id             String   @id @default(cuid())
  primaryWallet  String?
  displayName    String?
  org            String?
  role           UserRole @default(MEMBER)
  bio            String?
  email          String?
  discord        String?
  twitter        String?
  linkedin       String?
  website        String?
  avatarUrl      String?
  visibility     Json     // {displayName: 'public'|'private', ...}
  preferences    Json     // notification & UI prefs
  sessions       Session[]
  wallets        Wallet[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum UserRole { MEMBER LANDOWNER FUNDER PROFESSIONAL VERIFIER }

model Wallet {
  id         String   @id @default(cuid())
  address    String   @unique
  label      String?
  roleTag    WalletRole? // FUNDING | GOVERNANCE | OPS
  userId     String
  user       User     @relation(fields: [userId], references: [id])
}

enum WalletRole { FUNDING GOVERNANCE OPS }

model Session {
  id        String   @id @default(cuid())
  userId    String
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

*Notes*: governance balances & votes are read via indexer/subgraph; Lift Forwards/Tokens read via project indexer API.

---

## 7) API Contracts (REST-ish)

* `GET /api/profile/me` → `{ user, wallets, sessions, preferences, visibility }`
* `PATCH /api/profile/me` → body: partial user object (displayName, socials, org, role, bio)
* `POST /api/profile/wallets` → `{ address, label, roleTag }`
* `DELETE /api/profile/wallets/:id`
* `POST /api/profile/preferences` → notification channels/topics/frequency
* `POST /api/profile/visibility` → visibility map
* `POST /api/profile/export` → returns export job id
* `DELETE /api/profile` → soft-delete; returns scheduled deletion date

Governance (reads proxied by backend):

* `GET /api/governance/balance` → `{ votingPower, delegatedTo }`
* `POST /api/governance/delegate` → `{ to }` → returns tx hash
* `GET /api/governance/votes?limit=10`

Participation:

* `GET /api/participation/projects`
* `GET /api/participation/forwards`
* `GET /api/participation/tokens`
* `POST /api/participation/tokens/retire` → `{ tokenId, amount }`

Security:

* `GET /api/security/sessions` / `POST /api/security/sessions/revoke`

---

## 8) State & Caching

* Use React Query/TanStack Query for all fetches; optimistic updates for PATCH/POST
* Stale‑while‑revalidate on profile & governance reads (30–60s)
* Wallet & chain state via wagmi; indexer polls for balances (refetchInterval: 15s when tab focused)

---

## 9) Permissions & Guardrails

* Only the authenticated user can view/edit their profile; server validates `userId` claims
* Sensitive actions (delete account, retire tokens) require 2-step confirm + reauth (recent SIWE)
* Role-gated UI: Verifier panel visible only if `role = VERIFIER`

---

## 10) Error, Loading & Empty States

* **Loading**: Skeletons for cards/tables; shimmer avatars
* **Errors**: `Alert` with actionable text (retry, change network, reconnect wallet)
* **Empty**: Helpful CTAs; example content screenshots where possible

---

## 11) Analytics (events)

* `profile_save_clicked`, `profile_saved`
* `wallet_connected`, `wallet_role_tag_set`, `wallet_preferred_changed`
* `delegate_opened`, `delegate_confirmed`, `delegate_failed`
* `token_retire_opened`, `token_retire_confirmed`
* `notifications_opt_in`, `notifications_opt_out`
* `data_export_requested`

---

## 12) Accessibility & i18n

* All inputs labeled; keyboard-navigable tabs; focus states visible
* Toasts announce via ARIA live regions
* Copy text externalized for future translations

---

## 13) Visual Style Notes

* Clean, minimal; roomy padding; rounded‑2xl cards; soft shadows
* Use badges for roles (Landowner, Funder, etc.)
* Use subtle progress indicators for impact snapshot, avoid heavy charts by default

---

## 14) Acceptance Criteria (MVP)

* Users can: connect wallet, SIWE, edit identity, set notifications, delegate voting, view projects/forwards/tokens, retire a token, export data, revoke sessions
* All forms validate with zod; errors surfaced inline
* Mobile-friendly; Lighthouse a11y ≥ 95

---

## 15) Open Questions

* Do we require email to enable notifications? (Discord-only path?)
* Should reputation be on-chain, off-chain, or hybrid (attestations)?
* Retirement certificate source of truth: on-chain event + off-chain PDF hash on-chain?

---

## 16) Implementation Checklist

* [ ] Route & layout scaffolding
* [ ] Tabs + deep‑link (query param `?tab=`)
* [ ] API handlers & zod schemas
* [ ] Wagmi connectors + SIWE flow
* [ ] Section UIs with skeletons & empty states
* [ ] Governance delegate dialog
* [ ] Token retire dialog + tx handling
* [ ] Notifications matrix
* [ ] Privacy toggles + data export job
* [ ] Security: sessions table + revoke
* [ ] Analytics hooks
* [ ] a11y pass + E2E smoke tests (Playwright)
