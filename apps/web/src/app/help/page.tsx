'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { HelpHero } from '@/components/help/help-hero';
import { QuickStartCards } from '@/components/help/quick-start-cards';
import { GettingStartedGuide } from '@/components/help/getting-started-guide';
import { ParticipationGuide } from '@/components/help/participation-guide';
import { FAQAccordion } from '@/components/help/faq-accordion';
import { SupportSection } from '@/components/help/support-section';
import { HelpNavigation } from '@/components/help/help-navigation';

export default function HelpPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <HelpHero />
        
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Main Content */}
          <div className="flex-1 space-y-12">
            <QuickStartCards />
            <GettingStartedGuide />
            <ParticipationGuide />
            <FAQAccordion />
            <SupportSection />
          </div>
          
          {/* Sidebar Navigation */}
          <div className="lg:w-64 lg:sticky lg:top-8 lg:self-start">
            <HelpNavigation />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}