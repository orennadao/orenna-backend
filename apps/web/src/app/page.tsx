import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { 
  AnnouncementBar, 
  Hero, 
  StatCounter, 
  RoleCtaCard, 
  ProjectCard, 
  NewsletterForm, 
  Section 
} from "@/components/landing";
import { Button } from "@/components/ui/button";
import { Sprout, Users, DollarSign } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Announcement Bar */}
      <AnnouncementBar 
        message="New Lift Forwards now available - Join the regenerative finance revolution!"
        href="/marketplace/forwards"
        variant="success"
      />
      
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          title="helping people help the land"
          kicker="Member-owned collective turning ecological uplift into real-world value."
          primaryCta={{
            label: "Explore Projects",
            href: "/projects"
          }}
          secondaryCta={{
            label: "How it works",
            href: "#how-it-works"
          }}
          media={{
            type: "image",
            src: "/images/shaverlake.webp",
            alt: "Shaver Lake - regenerative land restoration in progress"
          }}
        />

        {/* Stats Strip */}
        <Section background="muted">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCounter
              label="Funding Deployed"
              value={2850000}
              prefix="$"
            />
            <StatCounter
              label="Active Projects"
              value={42}
            />
            <StatCounter
              label="Lift Tokens Issued"
              value={156789}
            />
            <StatCounter
              label="Community Members"
              value={2341}
            />
          </div>
        </Section>

        {/* Role Onramps */}
        <Section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join the Movement
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three pathways to participate in regenerative impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <RoleCtaCard
              role="Land Stewards"
              copy="Submit regenerative projects and earn from verified ecological impact"
              ctaLabel="Propose a Project"
              href="/projects/create"
              icon={Sprout}
            />
            <RoleCtaCard
              role="Contributors"
              copy="Apply your skills to support projects and earn through meaningful work"
              ctaLabel="Contribute Skills"
              href="/contributors"
              icon={Users}
            />
            <RoleCtaCard
              role="Funders"
              copy="Back Lift Forwards, donate, or invest in verified regenerative outcomes"
              ctaLabel="View Available Forwards"
              href="/marketplace/forwards"
              icon={DollarSign}
            />
          </div>
        </Section>

        {/* Featured Projects */}
        <Section background="accent">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Projects & Lift Tokens
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Verified regenerative impact you can support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <ProjectCard
              kind="lift-token"
              title="Prairie Restoration Initiative"
              summary="Converting 500 acres of degraded farmland back to native prairie ecosystem"
              metricLabel="LT Retired"
              metricValue="12,450"
              href="/projects/prairie-restoration"
            />
            <ProjectCard
              kind="forward"
              title="California Watershed Forward"
              summary="Large-scale watershed restoration project in Northern California focusing on groundwater recharge"
              metricLabel="Funding Goal"
              metricValue="$750k"
              href="/marketplace/forwards/1"
            />
            <ProjectCard
              kind="project"
              title="Soil Carbon Pilot"
              summary="Testing regenerative practices on 1,200 acres with real-time monitoring"
              metricLabel="Allocated"
              metricValue="$285k"
              href="/projects/soil-carbon-pilot"
            />
          </div>

          <div className="text-center">
            <Link href="/projects">
              <Button variant="outline" size="lg">
                View All Projects
              </Button>
            </Link>
          </div>
        </Section>

        {/* How It Works */}
        <Section id="how-it-works">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From investment to restoration to marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Investors Back Projects</h3>
              <p className="text-muted-foreground">
                Funders support regenerative projects through Lift Forwards and direct investments
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Land Restoration Happens</h3>
              <p className="text-muted-foreground">
                Projects implement verified regenerative practices with transparent monitoring
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Lift Token Marketplace</h3>
              <p className="text-muted-foreground">
                Verified ecological outcomes become tradeable Lift Tokens on our marketplace
              </p>
            </div>
          </div>
        </Section>


        {/* Join/Subscribe */}
        <Section>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get Field Updates
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get field updates and verified lift results delivered to your inbox
            </p>
            
            <NewsletterForm 
              placeholder="Enter your email for updates"
              submitLabel="Subscribe"
            />
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/auth">
                <Button variant="outline" size="lg">
                  Connect Wallet
                </Button>
              </Link>
              <Link href="/discord" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg">
                  Join Discord
                </Button>
              </Link>
            </div>
          </div>
        </Section>
      </main>
      
      <Footer />
    </div>
  );
}