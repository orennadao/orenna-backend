'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap,
  PlayCircle, 
  Globe,
  HelpCircle,
  Headphones,
  ChevronRight,
  BookOpen,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  description: string;
  badge?: string;
  estimatedTime?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'concepts',
    title: 'Key Concepts',
    icon: Zap,
    href: '#concepts',
    description: 'Understanding Lift Tokens, Forwards, and Project NFTs',
    estimatedTime: '5 min read'
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: PlayCircle,
    href: '#getting-started',
    description: 'Step-by-step account setup and wallet connection',
    estimatedTime: '10 min setup'
  },
  {
    id: 'participation',
    title: 'Project Participation',
    icon: Globe,
    href: '#participation',
    description: 'How to browse, fund, and track restoration projects',
    estimatedTime: '8 min read'
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    href: '#faq',
    description: 'Frequently asked questions and answers',
    badge: 'Popular'
  },
  {
    id: 'support',
    title: 'Support & Resources',
    icon: Headphones,
    href: '#support',
    description: 'Get help from our community and support team'
  }
];

const quickLinks = [
  { title: 'Connect Wallet', href: '/auth', external: false },
  { title: 'Browse Projects', href: '/projects', external: false },
  { title: 'Join Discord', href: 'https://discord.gg/orenna', external: true },
  { title: 'Developer Docs', href: '/docs', external: false }
];

export function HelpNavigation() {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationItems.map(item => item.id);
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Table of Contents */}
      <Card className="sticky top-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Table of Contents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group',
                  isActive 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-md transition-colors',
                  isActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
                )}>
                  <Icon className={cn(
                    'h-3.5 w-3.5',
                    isActive ? 'text-blue-600' : 'text-gray-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-medium text-sm',
                      isActive ? 'text-blue-700' : 'text-gray-900'
                    )}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs mt-0.5 leading-tight',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {item.description}
                  </p>
                  {item.estimatedTime && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-2.5 w-2.5 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {item.estimatedTime}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className={cn(
                  'h-3 w-3 transition-transform',
                  isActive ? 'text-blue-500 transform rotate-90' : 'text-gray-400'
                )} />
              </a>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group text-sm"
            >
              <span className="text-gray-700 group-hover:text-blue-600 transition-colors">
                {link.title}
              </span>
              <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4 text-center">
          <div className="mb-2">
            <span className="text-2xl">🌱</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Ready to Get Started?
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Join the restoration revolution
          </p>
          <a
            href="/auth"
            className="inline-flex items-center justify-center w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Connect Wallet
          </a>
        </CardContent>
      </Card>

      {/* Help Tip */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h4 className="font-medium text-yellow-800 text-sm mb-1">
                Pro Tip
              </h4>
              <p className="text-xs text-yellow-700 leading-relaxed">
                Bookmark this help center for quick reference. New guides and tutorials are added regularly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}