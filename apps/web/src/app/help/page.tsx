'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { HelpHero } from '@/components/help/help-hero';
import { HelpNavigation } from '@/components/help/help-navigation';
import { QuickStartCards } from '@/components/help/quick-start-cards';
import { GettingStartedGuide } from '@/components/help/getting-started-guide';
import { ParticipationGuide } from '@/components/help/participation-guide';
import { FAQAccordion } from '@/components/help/faq-accordion';
import { SupportSection } from '@/components/help/support-section';

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <HelpHero />

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <aside className="col-span-12 lg:col-span-3">
            <HelpNavigation />
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9 space-y-16">
            {/* Key Concepts */}
            <section id="concepts" className="scroll-mt-8">
              <QuickStartCards />
            </section>

            {/* Getting Started */}
            <GettingStartedGuide />

            {/* Project Participation */}
            <ParticipationGuide />

            {/* FAQ */}
            <section id="faq" className="scroll-mt-8">
              <FAQAccordion />
            </section>

            {/* Support */}
            <section id="support" className="scroll-mt-8">
              <SupportSection />
            </section>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}