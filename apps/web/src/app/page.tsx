'use client';

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Section } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { Search, Sprout, Heart, BarChart3, Shield, FileText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <Section className="py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Orenna — Restore Nature, Transparently
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              A community-owned platform that funds, tracks, and verifies ecological lift. 
              Explore real projects, see data-backed outcomes, and participate when you're ready.
            </p>
            
            {!isAuthenticated ? (
              <div className="mb-8">
                <p className="text-lg text-muted-foreground mb-6">
                  You're viewing the <strong>public</strong> landing page. You can <strong>Browse as Guest</strong> to explore Orenna or <strong>Connect Wallet</strong> to access the full dApp.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/connect">
                    <Button size="lg" className="min-w-[160px]" aria-label="Connect your wallet to access the full dApp">
                      Connect Wallet
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="outline" size="lg" className="min-w-[160px]" aria-label="Browse Orenna as a guest without connecting a wallet">
                      Browse as Guest
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <Link href="/dashboard">
                  <Button size="lg" className="min-w-[160px]" aria-label="Go to your personal dashboard">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Section>

        {/* How Orenna Works */}
        <Section background="muted" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Orenna Works
            </h2>
          </div>

          <div className="grid md:grid-cols-5 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">1. Projects</h3>
              <p className="text-sm text-muted-foreground">
                Real restoration efforts (streams, wetlands, forests) proposed and run by vetted teams.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">2. Lift Forwards</h3>
              <p className="text-sm text-muted-foreground">
                Forward purchase agreements that fund project delivery in exchange for future Lift Tokens.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">3. Lift Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Verifiable records of ecological lift that can be held or retired by beneficiaries to claim outcomes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">4. Verification</h3>
              <p className="text-sm text-muted-foreground">
                Open protocols + evidence (field data, eDNA, remote sensing) posted on-chain and in public, auditable logs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">5. Transparency</h3>
              <p className="text-sm text-muted-foreground">
                Every step—funding → work → monitoring → outcomes—is traceable.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground italic">
              Our goal is simple: help people help the land—without extractive finance.
            </p>
          </div>
        </Section>

        {/* What you can do as a Guest */}
        <Section className="py-16" id="guest-browsing">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What you can do as a Guest
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">🔎 View Projects</h3>
              <p className="text-sm text-muted-foreground">
                Browse active, funded, and completed projects with maps, milestones, and evidence.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">🪴 View Lift Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Inspect token metadata, provenance, and retirement claims.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">🤝 View Lift Forwards</h3>
              <p className="text-sm text-muted-foreground">
                See forward agreements, schedules, and fulfillment status.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">📚 Help Center</h3>
              <p className="text-sm text-muted-foreground">
                Read guides on how Orenna works and how verification is done.
              </p>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-muted-foreground mb-6">
              <strong>Tip:</strong> Connect your wallet to fund projects, manage accounts, and participate in governance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/projects">
                <Button variant="outline">Browse Projects</Button>
              </Link>
              <Link href="/lift-tokens">
                <Button variant="outline">Lift Tokens</Button>
              </Link>
              <Link href="/marketplace/forwards">
                <Button variant="outline">Lift Forwards</Button>
              </Link>
              <Link href="/help">
                <Button variant="outline">Help</Button>
              </Link>
            </div>
          </div>
        </Section>

        {/* Ready to participate */}
        <Section background="accent" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to participate?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <ul className="space-y-4 text-lg">
                <li className="flex items-start gap-3">
                  <span className="text-green-600">•</span>
                  <span><strong>Fund a Project</strong> via Lift Forwards</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600">•</span>
                  <span><strong>Receive Lift Tokens</strong> tied to verified ecological outcomes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600">•</span>
                  <span><strong>Retire Tokens</strong> to claim lift (or transfer to beneficiaries)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600">•</span>
                  <span><strong>Track Everything</strong> in a personal dashboard</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Connect to unlock</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span>🧩</span>
                  <span>Project funding & checkout</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>📊</span>
                  <span>Personal dashboard & portfolio</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>🧾</span>
                  <span>Receipts, attestations, & verifications</span>
                </li>
                <li className="flex items-center gap-3">
                  <span>🗳️</span>
                  <span>Governance (propose, delegate, vote)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="/auth/connect">
              <Button size="lg" aria-label="Connect your wallet to unlock all platform features">Connect Wallet</Button>
            </Link>
          </div>
        </Section>

        {/* Featured Projects */}
        <Section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Projects <em className="text-muted-foreground">(public)</em>
            </h2>
            <div className="bg-muted p-8 rounded-lg">
              <p className="text-muted-foreground mb-4">
                <strong>[Dynamic grid renders here]</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Card shows: title, biome, location, stage, verification status</li>
                <li>• Click through for full detail (maps, timeline, evidence, forward schedule)</li>
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/projects">
                <Button variant="outline" size="lg">Explore all projects →</Button>
              </Link>
            </div>
          </div>
        </Section>

        {/* Learn More */}
        <Section background="muted" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Learn More <em className="text-muted-foreground">(public)</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">What are Lift Forwards?</h3>
                <p className="text-muted-foreground">Forward purchase agreements, not bonds, aligned with mission-driven capital.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">What are Lift Tokens?</h3>
                <p className="text-muted-foreground">Semi-fungible tokens representing verified ecological lift (retire to claim).</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Verification & Evidence</h3>
                <p className="text-muted-foreground">How data is collected, audited, and posted.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Governance & Stewardship</h3>
                <p className="text-muted-foreground">Tokenholder roles, safeguards, proposal flow.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/help">
              <Button variant="outline" size="lg">Help Center →</Button>
            </Link>
          </div>
        </Section>

        {/* Compliance & Trust */}
        <Section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compliance & Trust
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Open-by-default</h3>
              <p className="text-muted-foreground">Public registries, project pages, and verification logs.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Data-first</h3>
              <p className="text-muted-foreground">Evidence and monitoring datasets are referenced on-chain.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">No extractive finance</h3>
              <p className="text-muted-foreground">Forward agreements with clear obligations and transparent terms.</p>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              By connecting a wallet you agree to our <Link href="/legal/terms" className="underline">Terms of Service</Link> and <Link href="/legal/privacy" className="underline">Privacy Notice</Link>.
            </p>
          </div>
        </Section>
      </main>
      
      <Footer />
    </div>
  );
}