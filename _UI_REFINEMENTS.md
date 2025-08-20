# Orenna Alpha UI/UX Spec v0.2 — Navigation, Onboarding & Auth Integration

*Last updated: 2025‑08‑20 (PT)*

## 0) Purpose & Scope

This spec translates the UI review into concrete requirements for the alpha web app at **alpha.orennadao.com**. It focuses on:

* Information architecture & navigation
* Page templates and component system
* Wallet + identity authentication (SIWE) and role‑based access
* Onboarding flows and empty states
* Loading, error handling, and performance
* Accessibility and analytics

Stack assumptions: **Next.js 14**, **TypeScript**, **Tailwind**, **shadcn/ui**, **Wagmi/Viem**, **Prisma**, **Fastify** API, **ERC‑20 governance**, **ERC‑1155 Lift Tokens**, **Lift Forwards**, and **Project NFT** parent container.

---

## 1) Goals & Success Criteria

**Goals**

1. Make core actions obvious: *Explore Projects, Propose Project, Fund Lift Forward, Track Tokens*.
2. Reduce first‑time confusion with a guided checklist and contextual education.
3. Ship a secure, standards‑compliant wallet auth with SIWE and app‑level sessions.
4. Establish a consistent component library (cards, tables, filters) and skeleton loading.

**Success (DoD)**

* < 3s LCP on desktop; < 4s on 3G Fast
* 100% flows covered with loading, empty, error states
* SIWE with nonce + replay protection; role‑based routes enforced server‑side
* Accessibility: keyboard‑navigable, sufficient contrast, form labels, skip links
* Analytics: events for auth, project views, forward intent, token mint/retire

---

## 2) Personas & Roles

**Personas**

* *Supporter/Funder*: wants to back restoration, buy Lift Forwards, optionally retire tokens.
* *Project Sponsor*: proposes and manages a project; submits documentation; receives funds.
* *Verifier*: reviews MRV evidence & mint requests.
* *Admin/Core*: moderates, configures fees, manages listings.

**App Roles** (RBAC)

* `guest` (unauthenticated)
* `member` (wallet verified)
* `sponsor`
* `verifier`
* `admin`

---

## 3) Information Architecture (IA)

**Global Nav (left sidebar on desktop, bottom bar on mobile)**

1. **Home** (overview, hero, stats, primary CTAs)
2. **Projects**

   * Browse/Filters, Project detail, Apply/Propose
3. **Forwards** (Lift Forwards marketplace)

   * Available, My Forwards, Checkout/Agreement
4. **Lift Tokens**

   * My tokens, Retire flow, Transfer
5. **Mint Requests** (verifier & admin facing)
6. **Analytics** (platform metrics; admin/member subsets)
7. **Payments** (history, invoices/receipts)
8. **ORNA** (governance portal link/section)
9. **Profile** (wallet, notifications, KYC/identity, org/team) — in user menu

**Utility**

* Search (Cmd+/)
* Notifications (toasts + inbox)
* Help (?) linking to Docs/FAQ/Discord

---

## 4) Navigation & Layout

* **Collapsible Sidebar** (icons + labels; tooltips on collapse)
* **Breadcrumbs** on detail pages: `Projects / {Project Name}`
* **Sticky Primary CTA** per section (e.g., *Propose Project* on Projects list)
* **Responsive**: sidebar collapses to icon rail; mobile uses bottom tab bar.

---

## 5) Page Templates

### 5.1 Home (Public + Member variants)

* Hero with mission, impact stat cards (animated counters)
* Primary CTAs: *Explore Projects*, *View Forwards*, *Propose Project*
* Featured Projects (3–6 cards) with status chips
* “How it works” infographic strip
* Partners/credibility row (logos) + link to Impact/Litepaper

**States**: loading skeletons, empty (no featured projects), error banner.

### 5.2 Projects

* Filters: geography, habitat type, stage, funding need, tags
* Sort: newest, nearing goal, most viewed
* Cards: image, location, short blurb, goal/raised bar, days remaining, status
* Detail: tabs for *Overview*, *Funding*, *Docs*, *Updates*, *MRV*, *Discussion*
* CTA area: *Fund Forward*, *Follow*, *Share*

### 5.3 Forwards (Marketplace)

* List + filters: price band, delivery window, project, quantity
* Forward detail: terms summary, risk/impact notes, docs, purchase flow
* Checkout: confirm chain, slippage/fees, signature, receipt

### 5.4 Lift Tokens

* “My Tokens” table (tokenId, project, vintage/period, qty, status)
* Actions: *Retire*, *Transfer*, *Export CSV*
* Retirement flow: destination (self / beneficiary), memo, on‑chain tx, certificate

### 5.5 Mint Requests (Verifier/Admin)

* Queue/table with filters (status, project)
* Request detail: evidence bundle, comments, decision controls (approve/reject/changes)

### 5.6 Payments

* History table (date, type, chain/tx, amount, ref)
* Invoices/receipts PDFs (download)

### 5.7 Profile

* Wallet(s), preferred chain, email for notices, notification prefs
* KYC/identity (optional per jurisdiction), display name/org
* API keys (if applicable)

---

## 6) Component System (shadcn/ui + Tailwind)

* **Cards**: ProjectCard, ForwardCard, TokenCard
* **Tables**: DataTable with column config, pagination, CSV export
* **Forms**: Zod schema validation + react‑hook‑form; inline errors
* **Badges/Chips**: status, role, chain
* **EmptyState**: icon, headline, supporting text, primary action
* **Skeletons**: card, table row, detail pane
* **Modals/Drawers**: checkout, retire, propose project wizard
* **Toasts**: success/error/info with action link

---

## 7) Authentication & Identity (Wallet + App Session)

**Strategy**: Wallet‑first with **SIWE** for cryptographic proof + backend session (httpOnly cookie) + optional email for notifications.

### 7.1 SIWE Flow

1. Client requests **nonce**: `GET /auth/siwe/nonce`
2. User connects wallet (Wagmi) and signs SIWE message (domain, uri, nonce, chainId, address, issuedAt, expirationTime, statement)
3. Client posts signature: `POST /auth/siwe/verify`
4. Server verifies signature + replay/nonce + chain allow‑list; creates server session (Set‑Cookie)
5. Client fetches `GET /me` to hydrate user + roles

**Security**

* Rotate nonces; single‑use; expire in 5 min
* Pin `domain`, `uri`, `chainId`; verify `address`
* Bind session to `address` + user agent fingerprint; invalidate on role change
* httpOnly + Secure + SameSite=Lax cookies; CSRF protection on state‑changing routes
* Rate limit auth endpoints; lockout after N failures (IP + address heuristic)

### 7.2 Account Model

* `User { id, primaryAddress, email?, createdAt }`
* `Wallet { id, userId, address (unique), chainId }`
* `Role { id, key }` with `UserRole { userId, roleId }`
* `Nonce { value, address, expiresAt, usedAt? }`

### 7.3 Email (Optional)

* Post‑auth prompt: “Add email for receipts & updates?”
* Magic link sign‑in (secondary) allowed, but all sensitive actions still require a live wallet signature.

### 7.4 Route Guards

* Server middleware checks cookie session → loads user + roles
* Client HOC guards for member‑only views; SSR guards on `/forwards/checkout`, `/mint‑requests`, `/payments`, `/tokens`.

### 7.5 Onboarding Checklist (first login)

* [ ] Connect wallet (done)
* [ ] Add email (optional)
* [ ] Choose interests (habitat types, regions)
* [ ] Review “How Orenna works” (1‑min tour)

---

## 8) Propose Project Wizard (Sponsor)

* **Steps**: Basics → Location → Budget & Timeline → Impact & MRV → Team → Review & Submit
* Autosave draft per step (localStorage + server when authenticated)
* Validation: schema‑based; clear error messages; file upload with progress

---

## 9) Loading, Empty & Error States

* **Skeletons**: cards (image bar + lines), tables (rows), detail panes
* **Empty** examples:

  * Projects: “No projects match your filters.” CTA: Reset Filters
  * Tokens: “No tokens yet.” CTA: View Forwards
* **Inline Errors**: concise messages with retry; fallback banners on page‑level errors

---

## 10) Performance & Reliability

* Code‑split by route; lazy‑load heavy components (charts, map)
* Image optimization (`next/image`) + responsive breakpoints; lazy load below the fold
* Cache project lists (SWR/React Query) with background revalidation
* Avoid SPA waterfalls; prefer RSC/SSR for list pages
* Websocket/SSE only where needed (mint queue)

---

## 11) Accessibility (A11y)

* Keyboard nav through all interactive elements; visible focus
* Color contrast ≥ 4.5:1 body text, ≥ 3:1 large text
* Descriptive `aria-*` for icons/buttons; labels for inputs
* Skip to content link; semantic headings; announce toasts to screen readers

---

## 12) Analytics & Telemetry

**Events** (name → properties)

* `auth_connect_wallet` → { address, chainId }
* `auth_siwe_verified` → { address }
* `view_project` → { projectId }
* `click_fund_forward` → { projectId, forwardId }
* `complete_forward_checkout` → { forwardId, qty, amount }
* `retire_tokens` → { tokenId, qty }
* `submit_mint_request` → { projectId }
* `propose_project_started|completed` → { projectId }

Privacy: no PII in analytics; address is OK with user consent.

---

## 13) API Contracts (illustrative)

```http
GET /auth/siwe/nonce → 200 { nonce }
POST /auth/siwe/verify { message, signature } → 200 { user: { id, address, roles } }
POST /auth/logout → 204
GET /me → 200 { user, roles }

GET /projects → 200 { items: ProjectCard[] }
GET /projects/:id → 200 { ...ProjectDetail }
POST /projects (auth:sponsor) → 201 { id }

GET /forwards → 200 { items: Forward[] }
POST /forwards/:id/checkout (auth:member) → 200 { txPayload }
POST /tokens/:id/retire (auth:member) → 200 { certUrl }

GET /mint-requests (auth:verifier|admin)
POST /mint-requests/:id/decision (auth:verifier|admin)

GET /payments (auth:member)
```

**Error shape**

```json
{ "error": { "code": "FORBIDDEN", "message": "...", "hint": "..." } }
```

---

## 14) Security Notes

* SIWE replay protection (nonce), short token TTL, session rotation on sensitive actions
* Chain allow‑list (e.g., mainnet/testnets as configured)
* Signature domain & URI pinned to `alpha.orennadao.com`
* Input sanitization & strict CORS
* Rate limiting & bot protection on propose/checkout

---

## 15) Visual Design Tokens

* Typography scale: `text-sm, base, lg, xl, 2xl, 4xl` (hero)
* Spacing: 4/8/12/16/24/32
* Corners: `rounded-2xl` for cards, `rounded-lg` for buttons/inputs
* Shadows: subtle for resting, elevate on hover
* Status colors: Info, Success, Warning, Danger with accessible contrast

---

## 16) Implementation Status & Progress

**COMPLETED MILESTONES (as of 2025-08-20)**

✅ **M1 — Auth & Shell**
* SIWE authentication fully implemented in `/apps/api/src/routes/auth.ts`
* Session cookie management with JWT tokens and secure httpOnly cookies
* Route guards and protected components implemented
* Wallet connect button with proper state management
* **NEW**: Collapsible sidebar navigation with role-based access control

✅ **M2 — Projects & Forwards** 
* Projects dashboard with comprehensive filtering, search, and view options
* Project creation wizard and detail pages
* Forwards marketplace with funding progress tracking
* Purchase flows and project backing functionality
* Rich project cards with status, progress, and impact metrics
* **NEW**: Integrated with MainLayout for consistent navigation

✅ **M3 — Tokens Management**
* Lift Tokens dashboard with status filtering and pagination
* **CORRECTED**: Removed manual token creation - tokens are now automatically created via mint request approval
* Token retirement and transfer workflows for issued tokens
* Comprehensive token metadata and tracking
* Integration with blockchain for token operations
* **NEW**: Updated to use MainLayout with proper read-only workflow

✅ **M4 — Navigation Refactor (COMPLETED 2025-08-20)**
* Collapsible sidebar navigation for desktop with tooltips
* Mobile bottom tab bar for responsive design
* Breadcrumb navigation on detail pages
* Role-based navigation filtering (VERIFIER, PLATFORM_ADMIN access to mint requests)
* Global search modal with Cmd+/ shortcut
* Proper SSR handling and client hydration
* MainLayout component integrating all navigation features

**COMPLETED (2025-08-20)**

✅ **M5 — Verifier Queue & Admin Features**
* **Comprehensive verification UI**: Advanced mint request review interface for verifiers
* **Evidence examination**: Detailed evidence viewer with document support and metadata display
* **Approval workflows**: Modal-based approval/rejection with notes and error handling
* **Role-based access**: Automatic UI switching based on VERIFIER/PLATFORM_ADMIN roles
* **Status filtering**: Organized queue by PENDING, APPROVED, REJECTED status
* **Enhanced mint request workflow**: Properly positioned as entry point for lift token creation

✅ **M6 — Error Handling & UX Polish (COMPLETED 2025-08-20)**
* **Comprehensive error boundaries**: React error boundaries with detailed fallbacks
* **Loading states**: Skeleton components, spinner, and progress indicators throughout
* **Empty states**: Contextual empty states for all major sections with helpful guidance
* **Global search**: Full-featured search with keyboard navigation (Cmd+/)
* **Error recovery**: Retry mechanisms and user-friendly error messages
* **Type-safe error handling**: Structured error parsing and categorization

**WORKFLOW CORRECTIONS (2025-08-20)**

✅ **Corrected Lift Token Creation Workflow**
* **Previous (Incorrect)**: Users could manually create lift tokens via UI forms
* **Current (Correct)**: Lift tokens are automatically created through verified mint request approval process:
  1. User submits mint request with evidence of environmental improvements
  2. Verifier reviews evidence and approves/rejects the request  
  3. Approved requests trigger automatic on-chain minting via `MintingExecutionService`
  4. `createLiftTokenRecord()` automatically creates the LiftToken database record
  5. Users can then retire or transfer their issued tokens

* **UI Changes**:
  - Removed "Create Lift Token" actions from lift tokens page
  - Added educational redirect page at `/lift-tokens/create` explaining proper workflow
  - Updated empty states to guide users toward mint request submission
  - Enhanced mint requests page as the proper entry point

✅ **Enhanced User Experience Infrastructure**
* **Error Boundary System**: Global error catching with development details and user-friendly production messages
* **Loading States**: Consistent skeleton components and loading indicators across all pages
* **Empty State Library**: Contextual empty states for onboarding, access denied, no data, and error scenarios
* **Global Search**: Debounced search with keyboard navigation, quick actions, and result categorization
* **API Error Handling**: Structured error parsing with retry logic and user-friendly messages

**RECENT PROGRESS (2025-08-20)**

✅ **Phase 1: Integration & API Enhancement (COMPLETED)**
* ✅ **Global Search API Integration**: Connected search to real API endpoints (projects, mint requests, lift tokens)
  - Replaced mock data with live API calls using existing `apiClient`
  - Parallel querying of multiple endpoints with error handling
  - Real-time filtering and relevance-based result ranking
  - Increased result limit to 20 items for better user experience

* ✅ **Real-time Search Suggestions & Autocomplete**: Advanced suggestion system with multiple data sources
  - **Search History**: localStorage-based recent search tracking (max 10 items)
  - **User Activity Tracking**: Recent viewed items integration with localStorage (max 20 activities)
  - **Popular Search Terms**: Curated list of common environmental restoration terms
  - **Category Suggestions**: Dynamic category filtering based on user input
  - **Tab Autocomplete**: Keyboard support for completing suggestions
  - **Smart Deduplication**: Prevents duplicate suggestions across different sources

* ✅ **Advanced Filtering & Sorting**: Comprehensive search customization
  - **Content Type Filters**: Toggle projects, mint requests, and lift tokens independently
  - **Multi-criteria Sorting**: Relevance, date, and name sorting with ascending/descending options
  - **Real-time Filter Application**: Immediate results update when filters change
  - **Filter UI**: Collapsible filter panel with visual feedback and reset functionality
  - **Status Filtering**: Filter by entity status (Active, PENDING, ISSUED, etc.)

* ✅ **User Activity & Recent Items Integration**: Personalized search experience
  - **Activity Tracking**: Automatic tracking of viewed items across all entity types
  - **Recent Items in Suggestions**: Recently viewed projects/tokens appear in search suggestions
  - **Activity-based Relevance**: Search results influenced by user's previous interactions
  - **Cross-session Persistence**: User activity and search history persist across browser sessions
  - **Privacy-conscious**: All tracking stored locally in localStorage only

**UPDATED NEXT PRIORITIES**

🎯 **Phase 2: User Experience Enhancements (1-2 weeks)**
* **Search Enhancements**:
  - Server-side search indexing for improved performance  
  - Search result highlighting and snippet previews
  - Advanced search operators (quoted phrases, exclusions)
  - Search analytics and popular query tracking
* **User Interface Polish**:
  - Onboarding checklist and guided tours for new users
  - Notification system with real-time updates
  - Advanced mobile responsiveness optimization
  - Accessibility audit and compliance improvements
  - Dark mode theme support

🎯 **Phase 3: Performance & Production Features (1-2 weeks)**
* **Search & Performance**:
  - Search result caching and optimization
  - Background search index updates
  - Search performance monitoring
* **Production Readiness**:
  - Analytics integration and user behavior tracking
  - SEO optimization and meta tags management  
  - Advanced error monitoring and reporting
  - Production deployment configuration and monitoring

**MAJOR MILESTONES ACHIEVED (2025-08-20)**

✅ **Complete UI Foundation**: Navigation, authentication, layouts, and core page structure
✅ **Verification Workflow**: Full mint request review system for verifiers with proper role-based access
✅ **Error Resilience**: Comprehensive error handling, loading states, and user feedback systems
✅ **Search Capability**: Global search with keyboard shortcuts and contextual results
✅ **Workflow Compliance**: Corrected lift token creation to follow proper verification-based process

**IMPLEMENTATION SUMMARY**

**📁 New Components Created:**
- `/components/layout/sidebar.tsx` - Collapsible role-based navigation
- `/components/layout/breadcrumbs.tsx` - Automatic breadcrumb generation
- `/components/layout/main-layout.tsx` - Unified layout with auth integration
- `/components/mint-requests/verification-queue.tsx` - Advanced verifier interface
- `/components/mint-requests/mint-request-detail.tsx` - Detailed evidence viewer
- `/components/search/global-search.tsx` - **ENHANCED** Full-featured search modal with API integration
- `/components/ui/error-boundary.tsx` - React error boundary system
- `/components/ui/loading-states.tsx` - Comprehensive loading components
- `/components/ui/empty-states.tsx` - Contextual empty state library
- `/lib/error-handling.ts` - Type-safe error management utilities

**🔍 Search Implementation Highlights:**
- **Multi-endpoint API Integration**: Parallel queries to `/projects`, `/mint-requests`, and `/lift-tokens`
- **Intelligent Suggestion Engine**: Combines search history, user activity, and popular terms
- **Advanced Filtering**: Content type toggles, status filters, and multi-criteria sorting
- **User Activity Tracking**: localStorage-based activity history for personalized experience
- **Keyboard Navigation**: Full keyboard support with Tab autocomplete and arrow navigation
- **Real-time Search**: 500ms debounced search with immediate filter application
- **Error Resilience**: Graceful handling of API failures with fallback messaging
- **Performance Optimized**: Client-side filtering and intelligent result limiting

**🔧 Key Files Enhanced:**
- `/app/page.tsx` - Split public/authenticated views
- `/app/projects/page.tsx` - Updated to use MainLayout
- `/app/marketplace/forwards/page.tsx` - Updated to use MainLayout
- `/app/lift-tokens/page.tsx` - Converted to read-only workflow
- `/app/lift-tokens/create/page.tsx` - Educational redirect page
- `/app/mint-requests/page.tsx` - Role-based UI switching
- `/components/lift-tokens/lift-tokens-dashboard.tsx` - Enhanced with error handling
- `/components/search/global-search.tsx` - **MAJOR UPDATE** Complete search overhaul with API integration
- `/hooks/use-auth.ts` - Added role types and mock data
- `/lib/api.ts` - **NEW** Added global search endpoint for future unified search API

**⚡ Technical Improvements:**
- **SSR Compatibility**: Proper hydration handling for client components
- **Error Boundaries**: Catch and gracefully handle React errors
- **Loading States**: Skeleton components and spinner patterns
- **Empty States**: Guidance for users in various scenarios
- **Type Safety**: Structured error handling with TypeScript
- **Accessibility**: Keyboard navigation and ARIA support
- **Performance**: Debounced search and optimized re-renders
- **Mobile Support**: Responsive design and touch interactions

**🎨 UX Enhancements:**
- **Navigation**: Intuitive sidebar with role-based filtering
- **Search**: Global search with Cmd+/ shortcut and keyboard navigation
- **Verification**: Professional evidence review interface for verifiers
- **Guidance**: Educational flows for proper workflow compliance
- **Feedback**: Clear error messages and recovery actions
- **Consistency**: Unified design system across all pages

---

## 17) Updated Architecture Assessment (Post-Implementation)

**CURRENT STRENGTHS**
* ✅ Well-structured monorepo with clear separation of concerns
* ✅ Comprehensive API layer with proper authentication and RBAC
* ✅ React/Next.js frontend with consistent component patterns and MainLayout
* ✅ Type-safe development with TypeScript throughout
* ✅ shadcn/ui component system with custom extensions
* ✅ Prisma ORM with proper database modeling
* ✅ Smart contract integration for blockchain operations
* ✅ **NEW**: Professional error boundary system with graceful fallbacks
* ✅ **NEW**: Comprehensive loading states and skeleton components
* ✅ **NEW**: Role-based navigation with proper access controls
* ✅ **NEW**: Global search with keyboard navigation
* ✅ **NEW**: Contextual empty states with user guidance

**AREAS RECENTLY ADDRESSED**
* ✅ **Navigation**: Implemented sidebar navigation matching IA spec
* ✅ **Error Handling**: Comprehensive error boundaries and fallback UI implemented
* ✅ **Loading States**: Consistent loading indicators across all components
* ✅ **Search Functionality**: Global search with keyboard shortcuts implemented
* ✅ **Mobile Responsiveness**: Bottom tab bar and responsive design enhanced
* ✅ **Verification Workflow**: Professional verifier interface for mint requests
* ✅ **User Guidance**: Educational flows and proper workflow compliance

**REMAINING TECHNICAL OPPORTUNITIES**
* API integration for search (currently using mock data)
* Onboarding flow and guided tours for new users
* Real-time notifications and updates
* Advanced accessibility audit and compliance
* SEO optimization and metadata management
* Performance optimization and code splitting
* Dark mode theme implementation
* Advanced mobile app features

---

## 18) Acceptance Criteria (Samples)

* As a guest, I can browse projects and forwards without connecting a wallet.
* As a member, I can connect a wallet, SIWE sign, and see my role on `/profile`.
* As a sponsor, I can create a draft project and return to it later.
* As a member, I can purchase a Forward and receive an on‑chain confirmation + receipt.
* As a member, I can retire tokens and download a certificate.
* As a verifier, I can approve/reject a mint request with comments.
* All pages have loading skeletons, empty states, and retry on transient errors.

---

## 19) Open Questions

1. Email collection: mandatory for sponsors/verifiers? Optional for funders?
2. KYC thresholds (if any) tied to fiat rails or purchase size?
3. Which chains are enabled at alpha (testnet only vs. mainnet)?
4. Certificate of retirement: on‑chain reference vs. IPFS asset only?
5. Governance (ORNA): integrated in‑app or external portal link for alpha?

---

## 20) Implementation Status & Recommendations

**COMPLETED IMPLEMENTATIONS (2025-08-20)**

✅ **Navigation System**
   - ✅ Collapsible sidebar implemented as per spec
   - ✅ Breadcrumb navigation with automatic generation
   - ✅ Mobile-responsive bottom tab bar
   - ✅ Role-based navigation filtering

✅ **Error Handling & UX**
   - ✅ Error boundaries added to all major components
   - ✅ Comprehensive loading states with skeleton components
   - ✅ Contextual empty state components with guidance
   - ✅ Type-safe error parsing and user-friendly messages

✅ **Role-Based Access Control**
   - ✅ Verifier/admin role implementation completed
   - ✅ Route guards and UI switching for sensitive pages
   - ✅ Proper role management integration

✅ **Search & Discovery**
   - ✅ Global search with Cmd+/ shortcut implemented
   - ✅ Keyboard navigation and contextual results
   - ✅ Quick actions and search categorization

**IMMEDIATE NEXT ACTIONS (1-2 weeks)**

1. **API Integration Enhancement**
   - Connect global search to real API endpoints
   - Replace mock search data with live results
   - Implement search result caching and performance optimization
   - Add search analytics and user behavior tracking

2. **Advanced Search Features**
   - Real-time search suggestions and autocomplete
   - Advanced filtering and sorting capabilities
   - Search history and saved searches
   - Bookmark and favorites system

**MEDIUM TERM (2-4 weeks)**

1. **Onboarding & User Experience**
   - Implement post-auth onboarding checklist
   - Add contextual tooltips and guided tours
   - Create interactive "How it works" walkthrough
   - User preference management and settings

2. **Real-time Features**
   - WebSocket integration for live updates
   - Real-time notifications system
   - Live status updates for mint requests
   - Collaborative features for team projects

3. **Mobile & Accessibility**
   - Advanced mobile responsiveness optimization
   - Accessibility audit and WCAG compliance
   - Touch gestures and mobile-specific interactions
   - Progressive Web App (PWA) capabilities

**LONG TERM (1-2 months)**

1. **Analytics & Monitoring**
   - User behavior tracking and analytics
   - Performance monitoring and optimization
   - Error tracking and alerting systems
   - A/B testing framework

2. **Advanced Platform Features**
   - Batch operations for tokens and projects
   - Advanced reporting and data exports
   - Dark mode and theme customization
   - Multi-language support (i18n)

---

## 21) Handoff Notes

* Deliver Figma components mirroring the component system above
* Create Storybook stories for key components (cards, tables, forms)
* Seed data for demo environments (projects, forwards, tokens)
* Add `README-auth.md` for SIWE setup and env vars
