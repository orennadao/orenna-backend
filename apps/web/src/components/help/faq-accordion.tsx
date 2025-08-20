'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'tokens' | 'projects' | 'governance' | 'security';
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Can I sell Lift Tokens?',
    answer: 'Yes. Lift Tokens can be transferred or sold before retirement, but retirement is required to "claim" ecological outcomes. When you retire a Lift Token, you are making a permanent claim to the environmental benefit it represents.',
    category: 'tokens'
  },
  {
    id: '2',
    question: 'What if a project fails?',
    answer: 'Funds are released through milestone-based escrow. If a project fails early, unspent funds may be returned or redirected by DAO vote. Our smart contracts are designed to protect funders while supporting legitimate restoration efforts.',
    category: 'projects'
  },
  {
    id: '3',
    question: 'How are projects selected?',
    answer: 'Projects are proposed by landowners or restoration professionals, reviewed by the DAO, and must meet the Lift Standard. The community votes on project approval using governance tokens.',
    category: 'projects'
  },
  {
    id: '4',
    question: 'What is the Lift Standard?',
    answer: 'The Lift Standard is Orenna\'s open-source protocol that defines how ecological improvement (lift) is measured and tokenized. It ensures consistent, verifiable metrics across all projects.',
    category: 'general'
  },
  {
    id: '5',
    question: 'How does verification work?',
    answer: 'Independent third-party ecologists and AI-augmented tools verify that ecological lift claims are accurate. All verification data is stored on-chain for transparency and accountability.',
    category: 'security'
  },
  {
    id: '6',
    question: 'What are governance tokens used for?',
    answer: 'Governance tokens enable you to vote on protocol changes, project approvals, treasury allocations, and participate in working groups that shape Orenna\'s future direction.',
    category: 'governance'
  },
  {
    id: '7',
    question: 'Is my data secure?',
    answer: 'Yes. We use audited smart contracts for all transactions and only store essential information on-chain. Your wallet connection is secured through Web3 authentication standards.',
    category: 'security'
  },
  {
    id: '8',
    question: 'How do I track my investments?',
    answer: 'Your dashboard shows all your Lift Tokens, Forward positions, and project participation. Each project provides transparent updates on milestones, budgets, and ecological metrics.',
    category: 'general'
  }
];

const categoryLabels = {
  general: 'General',
  tokens: 'Lift Tokens',
  projects: 'Projects',
  governance: 'Governance',
  security: 'Security'
};

const categoryColors = {
  general: 'bg-gray-100 text-gray-800',
  tokens: 'bg-green-100 text-green-800',
  projects: 'bg-blue-100 text-blue-800',
  governance: 'bg-purple-100 text-purple-800',
  security: 'bg-orange-100 text-orange-800'
};

interface AccordionItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, isOpen, onToggle }: AccordionItemProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                categoryColors[item.category]
              )}>
                {categoryLabels[item.category]}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {item.question}
            </h3>
          </div>
          <ChevronDown 
            className={cn(
              'h-5 w-5 text-gray-500 transition-transform duration-200 flex-shrink-0',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>
      
      <div className={cn(
        'overflow-hidden transition-all duration-200 ease-in-out',
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      )}>
        <CardContent className="pt-0 pb-6 px-6">
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            {item.answer}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function FAQAccordion() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'All Questions' },
    ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))
  ];

  return (
    <section id="faq" className="scroll-mt-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleQuestion className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <p className="text-gray-600">
          Find answers to common questions about Orenna's platform and ecosystem.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((item) => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openItems.has(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-4">
            Join our community or reach out to our support team for personalized help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a 
              href="#support" 
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contact Support
            </a>
            <a 
              href="https://discord.gg/orenna" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Join Discord
            </a>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}