'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TocNav } from '@/components/governance/TocNav'
import { GovParamTable } from '@/components/governance/GovParamTable'
import { LinkCards } from '@/components/governance/LinkCards'
import { LastUpdated } from '@/components/governance/LastUpdated'
import { Badge } from '@/components/ui/badge'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import params from '../../../../content/governance/params.json'
import { RiskAccordion } from '@/components/governance/RiskAccordion'
import { Callout } from '@/components/governance/Callout'
import { IPFSDocLink } from '@/components/governance/IPFSDocLink'

const mdxComponents = {
  GovParamTable: () => <GovParamTable params={params} />,
  RiskAccordion,
  Callout,
  IPFSDocLink,
  // Add custom styling for markdown elements with anchor links
  h1: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h1 id={id} className="text-3xl font-bold mb-6 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h1>
  },
  h2: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h2 id={id} className="text-2xl font-semibold mb-4 mt-8 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h2>
  },
  h3: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h3 id={id} className="text-xl font-semibold mb-3 mt-6 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h3>
  },
  h4: (props: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || ''
    return <h4 id={id} className="text-lg font-semibold mb-2 mt-4 scroll-mt-24 group" {...props}>
      {props.children}
      <a href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground" aria-label="Link to this section">
        #
      </a>
    </h4>
  },
  p: (props: any) => <p className="mb-4 leading-7" {...props} />,
  ul: (props: any) => <ul className="mb-4 ml-6 list-disc" {...props} />,
  ol: (props: any) => <ol className="mb-4 ml-6 list-decimal" {...props} />,
  li: (props: any) => <li className="mb-2" {...props} />,
  a: (props: any) => (
    <a 
      className="text-primary hover:underline" 
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props} 
    />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-muted pl-6 italic mb-4" {...props} />
  ),
  code: (props: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
  ),
  pre: (props: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props} />
  ),
  table: (props: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse border border-border" {...props} />
    </div>
  ),
  th: (props: any) => (
    <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props} />
  ),
  td: (props: any) => (
    <td className="border border-border px-4 py-2" {...props} />
  ),
}

const defaultContent = `
# Orenna Governance Framework

## 1. Introduction

This document outlines the governance framework for the Orenna ecosystem, establishing the policies, procedures, and parameters that guide decentralized decision-making for environmental impact verification and carbon credit platforms.

<Callout type="info" title="Living Document">
This governance framework is designed to evolve with the ecosystem. Regular reviews and updates ensure the governance system remains effective and aligned with community needs.
</Callout>

## 2. Governance Scope

The Orenna governance system oversees:

- **Platform Parameters**: Technical configurations and operational thresholds
- **Verification Standards**: Methodologies for environmental impact measurement
- **Treasury Management**: Allocation of community funds and resources
- **Protocol Upgrades**: Updates to smart contracts and system architecture
- **Partnership Approvals**: Integration with external verification bodies and carbon markets

## 3. Proposal Types & Parameters

The governance system recognizes three main categories of proposals, each with distinct requirements:

<GovParamTable />

### 3.1 Standard Proposals
Standard proposals address routine governance matters including:
- Minor parameter adjustments
- Community initiatives and grants
- Non-critical protocol updates
- Ecosystem partnership approvals

### 3.2 Major Proposals
Major proposals involve significant changes with substantial impact:
- Treasury allocations exceeding $100,000 USD
- Core protocol modifications
- Changes to verification methodologies
- Strategic partnership agreements

### 3.3 Emergency Proposals
Emergency proposals address urgent matters requiring expedited action:
- Security vulnerabilities
- Critical system failures
- Regulatory compliance requirements
- Market instability responses

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

export default function GovernancePage() {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null)
  const [loading, setLoading] = useState(true)
  
  const governanceData = {
    title: 'Orenna Governance Framework',
    status: 'Draft v1.0',
    lastUpdated: '2024-08-21',
    description: 'DAO-wide governance policy, thresholds, and processes for Orenna.'
  }

  useEffect(() => {
    async function loadContent() {
      try {
        const serialized = await serialize(defaultContent, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSanitize],
            development: process.env.NODE_ENV === 'development',
          },
        })
        setMdxSource(serialized)
      } catch (error) {
        console.error('Error loading MDX content:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadContent()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading governance framework...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute 
      allowGuest={true}
      guestMessage="View governance framework and proposals publicly. Connect your wallet to participate in voting and submit proposals."
    >
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
                <h1 className="text-3xl font-semibold tracking-tight">{governanceData.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline">{governanceData.status}</Badge>
                  <LastUpdated date={governanceData.lastUpdated} />
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
              {mdxSource && <MDXRemote {...mdxSource} components={mdxComponents} />}
            </article>
          </main>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  )
}