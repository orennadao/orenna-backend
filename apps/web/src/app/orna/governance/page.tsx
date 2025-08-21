import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TocNav } from '@/components/governance/TocNav'
import { GovParamTable } from '@/components/governance/GovParamTable'
import { LinkCards } from '@/components/governance/LinkCards'
import { LastUpdated } from '@/components/governance/LastUpdated'
import { Badge } from '@/components/ui/badge'
import { serializeMDX, MDXContent } from '@/lib/mdx'
import params from '../../../../content/governance/params.json'
import { readFileSync } from 'fs'
import path from 'path'

export const revalidate = 3600 // ISR hourly

interface GovernancePageData {
  title: string
  status: string
  lastUpdated: string
  paramSetTag: string
  ipfsHash?: string
  description: string
  content: string
}

async function getGovernanceData(): Promise<GovernancePageData> {
  try {
    const contentPath = path.join(process.cwd(), 'content/governance/index.mdx')
    const fileContent = readFileSync(contentPath, 'utf8')
    
    // Parse frontmatter (simple implementation)
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
    const match = fileContent.match(frontmatterRegex)
    
    if (!match) {
      throw new Error('Invalid MDX format')
    }
    
    const frontmatter = match[1]
    const content = match[2]
    
    // Parse frontmatter fields
    const frontmatterData: any = {}
    frontmatter.split('\n').forEach(line => {
      const [key, ...values] = line.split(':')
      if (key && values.length) {
        frontmatterData[key.trim()] = values.join(':').trim().replace(/^["']|["']$/g, '')
      }
    })
    
    return {
      title: frontmatterData.title || 'Orenna Governance Framework',
      status: frontmatterData.status || 'Draft v1.0',
      lastUpdated: frontmatterData.lastUpdated || new Date().toISOString(),
      paramSetTag: frontmatterData.paramSetTag || params.version,
      ipfsHash: frontmatterData.ipfsHash,
      description: frontmatterData.description || 'DAO-wide governance policy, thresholds, and processes for Orenna.',
      content
    }
  } catch (error) {
    // Return default content if file doesn't exist
    return {
      title: 'Orenna Governance Framework',
      status: 'Draft v1.0',
      lastUpdated: new Date().toISOString(),
      paramSetTag: params.version,
      description: 'DAO-wide governance policy, thresholds, and processes for Orenna.',
      content: `
# Orenna Governance Framework

## 1. Introduction

This document outlines the governance framework for the Orenna ecosystem, establishing the policies, procedures, and parameters that guide decentralized decision-making for environmental impact verification and carbon credit platforms.

## 2. Governance Scope

The Orenna governance system oversees:

- **Platform Parameters**: Technical configurations and operational thresholds
- **Verification Standards**: Methodologies for environmental impact measurement
- **Treasury Management**: Allocation of community funds and resources
- **Protocol Upgrades**: Updates to smart contracts and system architecture
- **Partnership Approvals**: Integration with external verification bodies and carbon markets

## 3. Proposal Types & Parameters

<GovParamTable />

## 4. Participation Requirements

### 4.1 Token Holdings
Participation in governance requires holding ORNA tokens, which represent voting power proportional to stake in the ecosystem.

### 4.2 Delegation
Token holders may delegate their voting power to representatives who actively participate in governance discussions and voting.

### 4.3 Proposal Submission
Any token holder meeting the minimum sponsorship requirements may submit proposals for community consideration.

## 5. Voting Process

### 5.1 Proposal Lifecycle
1. **Drafting**: Community discussion and proposal refinement
2. **Sponsorship**: Gathering required token holder support
3. **Voting Period**: Active voting by eligible participants
4. **Execution**: Implementation of approved proposals

### 5.2 Voting Methods
- **Simple Majority**: Standard proposals require >50% approval
- **Supermajority**: Major changes require 66.7% approval
- **Emergency Procedures**: Expedited voting for urgent matters

## 6. Implementation & Enforcement

Approved proposals are implemented through:
- Smart contract execution for on-chain changes
- Coordination with development teams for off-chain updates
- Community monitoring and compliance verification

## 7. Governance Evolution

This framework is designed to evolve with the ecosystem. Regular reviews and updates ensure the governance system remains effective and aligned with community needs.

---

*This document represents the current governance framework and may be updated through the established proposal process.*
      `
    }
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getGovernanceData()
  
  return {
    title: `${data.title} | Orenna`,
    description: data.description,
    openGraph: {
      title: `${data.title} | Orenna`,
      description: data.description,
      type: 'article',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function GovernancePage() {
  const data = await getGovernanceData()
  const mdxSource = await serializeMDX(data.content)

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Table of Contents */}
          <aside className="col-span-12 lg:col-span-3 toc-nav" aria-label="Table of contents">
            <TocNav headingsSelector="article h2, article h3, article h4" />
          </aside>

          {/* Main Content */}
          <main id="main-content" className="col-span-12 lg:col-span-9 governance-content">
            {/* Header */}
            <header className="mb-8 space-y-4 governance-header">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline">{data.status}</Badge>
                  <LastUpdated date={data.lastUpdated} />
                </div>
              </div>
              <div className="link-cards">
                <LinkCards />
              </div>
            </header>

            {/* Quick Reference */}
            <section className="mb-8" aria-labelledby="governance-parameters">
              <GovParamTable params={params} />
            </section>

            {/* MDX Content */}
            <article 
              className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24"
              role="main"
              aria-label="Governance framework documentation"
            >
              <MDXContent source={mdxSource} />
            </article>
          </main>
        </div>
      </div>
    </div>
  )
}