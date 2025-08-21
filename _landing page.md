# Orenna — Restore Nature, Transparently

> **Welcome to Orenna.** A community-owned platform that funds, tracks, and verifies ecological lift. Explore real projects, see data-backed outcomes, and participate when you’re ready.

---

## 👋 Not signed in

> You’re viewing the **public** landing page. You can **Browse as Guest** to explore Orenna or **Connect Wallet** to access the full dApp.

<div align="center">

[Connect Wallet](/auth/connect) · [Browse as Guest](/explore)

</div>

---

## How Orenna Works

1. **Projects**: Real restoration efforts (streams, wetlands, forests) proposed and run by vetted teams.
2. **Lift Forwards**: Forward purchase agreements that fund project delivery in exchange for future **Lift Tokens**.
3. **Lift Tokens**: Verifiable records of ecological lift that can be **held** or **retired** by beneficiaries to claim outcomes.
4. **Verification**: Open protocols + evidence (field data, eDNA, remote sensing) posted on-chain and in public, auditable logs.
5. **Transparency**: Every step—funding → work → monitoring → outcomes—is traceable.

> *Our goal is simple: help people help the land—without extractive finance.*

---

## What you can do as a Guest

* 🔎 **View Projects**: Browse active, funded, and completed projects with maps, milestones, and evidence.
* 🪴 **View Lift Tokens**: Inspect token metadata, provenance, and retirement claims.
* 🤝 **View Lift Forwards**: See forward agreements, schedules, and fulfillment status.
* 📚 **Help Center**: Read guides on how Orenna works and how verification is done.
* 🧭 **Public Activity**: Follow recent updates, proposals, and verifications.

> **Tip:** Connect your wallet to fund projects, manage accounts, and participate in governance.

<div align="center">

[Browse Projects](/projects) · [Lift Tokens](/tokens) · [Lift Forwards](/forwards) · [Help](/help)

</div>

---

## Ready to participate?

* **Fund a Project** via Lift Forwards
* **Receive Lift Tokens** tied to verified ecological outcomes
* **Retire Tokens** to claim lift (or transfer to beneficiaries)
* **Track Everything** in a personal dashboard

### Connect to unlock

* 🧩 Project funding & checkout
* 📊 Personal dashboard & portfolio
* 🧾 Receipts, attestations, & verifications
* 🗳️ Governance (propose, delegate, vote)

<div align="center">

[Connect Wallet](/auth/connect)

</div>

---

## Featured Projects *(public)*

> **\[Dynamic grid renders here]**
>
> * Card shows: title, biome, location, stage, verification status
> * Click through for full detail (maps, timeline, evidence, forward schedule)

[Explore all projects →](/projects)

---

## Learn More *(public)*

* **What are Lift Forwards?** → Forward purchase agreements, not bonds, aligned with mission-driven capital.
* **What are Lift Tokens?** → Semi-fungible tokens representing verified ecological lift (retire to claim).
* **Verification & Evidence** → How data is collected, audited, and posted.
* **Governance & Stewardship** → Tokenholder roles, safeguards, proposal flow.

[Help Center →](/help)

---

## Compliance & Trust

* **Open-by-default**: Public registries, project pages, and verification logs.
* **Data-first**: Evidence and monitoring datasets are referenced on-chain.
* **No extractive finance**: Forward agreements with clear obligations and transparent terms.

*By connecting a wallet you agree to our* [Terms of Service](/legal/terms) *and* [Privacy Notice](/legal/privacy).

---

## Footer *(public)*

* Projects · Tokens · Forwards · Help · Governance · About · Contact
* © Orenna DAO LLC · Wyoming · All rights reserved

---

## Developer Notes (Routing & State)

### Entry points

* `/` → Landing (public by default)
* `/explore` → Same as `/` but auto-scrolls to public browsing section

### CTAs

* **Connect Wallet** → `/auth/connect`

  * On success:

    * If **new user** (no profile/onboard flag): redirect to `/onboarding`
    * Else: redirect to `/dashboard`
* **Browse as Guest** → `/explore` (or stay on `/` and open public tabs)

### Guest Capabilities

* Read-only routes: `/projects`, `/projects/[id]`, `/tokens`, `/tokens/[id]`, `/forwards`, `/forwards/[id]`, `/help`, `/governance` (read-only), `/legal/*`
* Write/actions disabled: funding checkout, profile edits, delegation, proposal creation, token retirement

### Authenticated Capabilities

* Full access: funding checkout, dashboard, portfolio, receipts, attestations, governance actions, retirement flow

### Guards / Redirects

* If **not authenticated** and route is write/action → route guard → prompt connect → back/continue
* If **authenticated** hitting `/auth/connect` → redirect to `/dashboard`
* After **onboarding complete** → `/dashboard`

### UI States

* **Loading**: skeleton cards for project grid; wallet-connecting spinner
* **Empty**: no projects → helpful copy + link to Help
* **Error**: inline message + retry, log id

### Telemetry (example events)

* `landing_view`, `cta_connect_click`, `cta_browse_guest_click`
* `auth_success`, `auth_failure`, `redirect_onboarding`, `redirect_dashboard`
* `guest_view_projects`, `guest_view_tokens`, `guest_view_forwards`

### Accessibility

* Buttons are `<button>` with ARIA labels; visible focus rings
* All images have alt text; headings follow h1→h2→h3 order
* Color contrast ≥ 4.5:1; keyboard navigation supported

---

## ✅ IMPLEMENTATION COMPLETE

**Status**: Landing page fully implemented and deployed to replace alpha.orennadao.com

**Completed Features**:
- ✅ Hero section with dynamic auth-based CTAs
- ✅ "How Orenna Works" 5-step explanation
- ✅ Guest capabilities section with 4 key features
- ✅ "Ready to participate" section with unlock features
- ✅ Featured projects placeholder (ready for dynamic data)
- ✅ Learn More section with help links
- ✅ Compliance & Trust section
- ✅ Proper routing for / and /explore
- ✅ Authentication guards and redirects (/auth/connect, /legal/*)
- ✅ Loading states and error handling
- ✅ Accessibility compliance (ARIA labels, keyboard nav, contrast)
- ✅ Mobile responsive design

**Technical Implementation**:
- Updated `/apps/web/src/app/page.tsx` with new landing page
- Created `/explore` route (redirects to /#guest-browsing)
- Created `/auth/connect` route (redirects to /auth)
- Created `/legal/terms` and `/legal/privacy` redirects
- Implemented proper loading states and auth checking
- Added accessibility features and ARIA labels

**Routes Configured**:
- `/` → New landing page (public by default)
- `/explore` → Redirects to landing page guest browsing section
- `/auth/connect` → Redirects to main auth page
- `/legal/terms` → Redirects to existing terms-of-service page
- `/legal/privacy` → Redirects to existing privacy-notice page

---

### Copy Snippets (for reuse)

* **Hero title**: *Orenna — Restore Nature, Transparently*
* **Hero subtitle**: *A community-owned platform that funds, tracks, and verifies ecological lift. Explore real projects, see data-backed outcomes, and participate when you're ready.*
* **Connect CTA**: *Connect Wallet*
* **Guest CTA**: *Browse as Guest*
