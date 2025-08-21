# ORNA Governance Page – Frontend Implementation Spec (v1.0)

**Owner:** Frontend Team · **Stakeholders:** Governance, Legal, Tokenomics · **Status:** Draft

---

## 0) Objectives

* Implement a first‑class **/orna/governance** page that renders the approved **Orenna Governance Framework** (Markdown) with a trustworthy, legible, and responsive UI.
* Centralize policy parameters (quorum, thresholds, sponsorship, etc.) in a single source of truth and render them consistently across the page.
* Ship a layout that’s **printable**, **shareable**, and **indexable** (SEO) with linkable anchors.
* Prepare hooks to deep‑link into the future **Governance Portal** (proposals, delegation, vote history).

---

## 1) Tech Stack Assumptions

* **Next.js 14** (App Router) + **TypeScript**
* **Tailwind CSS**; **shadcn/ui** component primitives (Button, Card, Accordion, Badge, Alert, ScrollArea)
* **lucide-react** for icons; **framer-motion** optional for subtle affordances
* **MDX** via Contentlayer (preferred) *or* next-mdx-remote
* **rehype-sanitize** for MDX safety; custom schema to allow our shortcodes
* Optional: **wagmi/viem** for live on‑chain reads (future enhancement)

---

## 2) Route & File Structure

```
apps/web/
  app/
    orna/
      governance/
        page.tsx               # SSG/ISR page
        head.tsx (optional)    # if not using generateMetadata
  content/
    governance/
      index.mdx                # Governance Framework content (from canvas doc)
      params.json              # Policy parameter single source of truth
  components/
    governance/
      TocNav.tsx
      GovParamTable.tsx
      RiskAccordion.tsx
      Callout.tsx
      LastUpdated.tsx
      IPFSDocLink.tsx
      LinkCards.tsx
  lib/
    contentlayer.ts
    mdx.ts
```

---

## 3) Content Model

### 3.1 MDX Frontmatter (index.mdx)

```mdx
---
title: "Orenna Governance Framework"
status: "Draft v1.0"
lastUpdated: "YYYY-MM-DD"
paramSetTag: "gov-params-1.0.0"
ipfsHash: "bafy..."   # optional until we pin
seo:
  description: "DAO-wide governance policy, thresholds, and processes for Orenna."
---
```

### 3.2 Policy Parameters (params.json)

Single source of truth consumed by components.

```json
{
  "version": "gov-params-1.0.0",
  "votingPeriodDays": 7,
  "treasuryMajorThresholdUSD": 100000,
  "proposalDepositUSDC": 250,
  "quorum": { "standard": 0.08, "major": 0.15, "emergency": 0.05 },
  "approval": { "standard": 0.5001, "major": 0.6667, "emergency": 0.60 },
  "sponsorship": {
    "standard": { "pct": 0.002, "wallets": 5, "perWalletMinPct": 0.0002 },
    "major": { "pct": 0.005, "wallets": 10, "perWalletMinPct": 0.0003 },
    "emergency": { "pct": 0.001, "wallets": 3 }
  },
  "timelockHours": { "standard": 48, "major": 72, "emergency": 12 }
}
```

> **Note:** MDX content should **reference** these values via components; do **not** hardcode numbers in prose where possible.

---

## 4) Page Layout & UX

* **Header:** Title, status badge, last updated, quick links (View Terms, Privacy Notice, Open Governance Portal).
* **Two‑pane layout:**

  * **Left (sticky) ToCNav**: auto‑generated from MDX headings; collapsible on mobile.
  * **Right content**: MDX body + interactive components (parameter table, accordions).
* **Quick Reference rail:** On desktop, render a right‑rail card with the key parameters; on mobile, collapse into an Accordion below the intro.
* **Anchors:** Each heading gets an anchor link; copy‑link icon on hover.
* **Print styles:** Ensure ToC hides on print; content flows with page numbers.

---

## 5) Components (contracts)

### 5.1 `<TocNav />`

* **Input:** headings parsed from MDX (h2–h4)
* **Behavior:** highlights active section (IntersectionObserver), collapsible sections, keyboard accessible.

### 5.2 `<GovParamTable />`

* **Input:** `params.json`
* **Render:** Table matching the policy matrix (Standard/Major/Emergency) plus badges and footnotes.
* **SSR safe:** load params at build time; revalidate via ISR.

### 5.3 `<RiskAccordion />`

* **Input:** Array of risk items (title, risk, safeguards). Seed with 7.1–7.11 from MDX to avoid duplication: let MDX pass the data object.

### 5.4 `<Callout type="info|warning|success" />`

* Shadcn Alert wrapper with icon (info/warning/check) and children.

### 5.5 `<LastUpdated date hash />`

* Shows humanized date and (optional) commit hash link.

### 5.6 `<IPFSDocLink hash label />`

* Renders a short hash with copy button and external link to the gateway (configurable).

### 5.7 `<LinkCards />`

* Cards linking to **Terms of Service**, **Privacy Notice**, **Onboarding Package**, and the future **Governance Portal**.

---

## 6) MDX + Contentlayer Wiring

### 6.1 contentlayer.config.ts (excerpt)

```ts
import { defineDocumentType, makeSource } from 'contentlayer/source-files'

export const GovernanceDoc = defineDocumentType(() => ({
  name: 'GovernanceDoc',
  filePathPattern: 'governance/index.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    status: { type: 'string', required: true },
    lastUpdated: { type: 'date', required: true },
    paramSetTag: { type: 'string', required: true },
    ipfsHash: { type: 'string', required: false }
  }
}))

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [GovernanceDoc]
})
```

### 6.2 MDX usage in page.tsx

```tsx
// app/orna/governance/page.tsx
import { allGovernanceDocs } from 'contentlayer/generated'
import { GovParamTable } from '@/components/governance/GovParamTable'
import TocNav from '@/components/governance/TocNav'
import RiskAccordion from '@/components/governance/RiskAccordion'
import LinkCards from '@/components/governance/LinkCards'
import LastUpdated from '@/components/governance/LastUpdated'
import params from '@/content/governance/params.json'
import { MDXContent } from '@/lib/mdx'

export const revalidate = 3600 // ISR hourly

export async function generateMetadata() {
  const doc = allGovernanceDocs[0]
  return {
    title: `${doc.title} | Orenna`,
    description: doc.seo?.description ?? 'Orenna governance policy and processes'
  }
}

export default function Page() {
  const doc = allGovernanceDocs[0]
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-8">
      <aside className="col-span-12 lg:col-span-3">
        <TocNav headingsSelector="article h2, article h3, article h4" />
      </aside>
      <main className="col-span-12 lg:col-span-9">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-1">{doc.status}</span>
            <LastUpdated date={doc.lastUpdated} />
          </div>
          <LinkCards />
        </header>
        <section className="mb-6">
          <GovParamTable params={params} />
        </section>
        <article className="prose prose-neutral max-w-none dark:prose-invert">
          <MDXContent code={doc.body.code} components={{ RiskAccordion }} />
        </article>
      </main>
    </div>
  )
}
```

### 6.3 MDX shortcodes

In `index.mdx`, replace the static table with a component call to ensure numbers stay in sync:

```mdx
import { GovParamTable } from '@/components/governance/GovParamTable'
import RiskAccordion from '@/components/governance/RiskAccordion'

## 3. Proposal Types & Parameters

<GovParamTable />

## 7. Governance Risks & Safeguards (Deep Dive)

<RiskAccordion items={RISKS} />
```

`RISKS` can be exported from the MDX or imported from a `.ts` file to keep content structured.

---

## 7) Security & Safety

* **MDX sanitization:** Use `rehype-sanitize` with an allowlist for our components.
* **External links:** `target="_blank" rel="noopener noreferrer"`.
* **No user input** on this page; all content is controlled.

---

## 8) Performance & SEO

* **SSG/ISR** with hourly `revalidate` for content updates.
* Preload headline fonts; avoid layout shift.
* `generateMetadata` for canonical/OG tags; provide `og:image` via a static banner.

---

## 9) Accessibility

* Keyboard‑accessible ToC and Accordions.
* ARIA landmarks: `nav`, `main`, `aside`.
* Preserve heading order (h1→h2→h3…); visible focus states.

---

## 10) Analytics (opt‑in)

* Capture **TOC link click**, **anchor copy**, **param table expand**, **portal link click**.
* Respect privacy: disable analytics if user opted out.

---

## 11) Testing

* **Unit:** render `<GovParamTable>` with sample params; verify thresholds table.
* **E2E (Playwright):**

  * Anchors navigate correctly; back button works.
  * Mobile ToC collapses/expands.
  * Print preview shows content only (no nav).

---

## 12) Content Ops & Versioning

* Updates to parameters happen in `/content/governance/params.json` and a new `paramSetTag` in MDX.
* When parameters change materially, **pin MDX to IPFS** and update `ipfsHash`; surface via `<IPFSDocLink />`.
* Keep a `CHANGELOG` section at bottom of MDX (already included in Governance doc).

---

## 13) Rollout Plan

1. Land the components + Contentlayer plumbing.
2. Paste the **Governance Markdown** (from canvas) into `/content/governance/index.mdx` and wire shortcodes.
3. Populate `params.json` with the agreed values.
4. QA in mobile + desktop; run accessibility checks.
5. Merge and deploy; post the page link in #governance for review.

---

## 14) Acceptance Criteria

* Route **/orna/governance** renders without runtime errors (SSR/CSR) and passes Lighthouse ≥ 90 (A11y, SEO, Best Practices).
* Parameters displayed are sourced from `params.json`; no duplicated literals.
* All major headings have working copy‑link anchors.
* Print CSS produces a clean 10–20 page PDF (no sidebar).
* Links to **Terms of Service**, **Privacy Notice**, and **Governance Portal** are visible above the fold.

---

## 15) Future Enhancements

* **Live on‑chain reads** for param hashes and active policy version.
* **Version switcher** to view historical governance parameter sets.
* **Proposal feed** and per‑section deep links into the Governance Portal.
* **Localization** (i18n) and **PDF export** button.
