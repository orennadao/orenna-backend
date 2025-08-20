'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle,
  Mail,
  BookOpen,
  Github,
  ExternalLink,
  Clock,
  Users,
  Headphones,
  FileText,
  Video
} from 'lucide-react';

interface SupportChannel {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: {
    label: string;
    href: string;
    external?: boolean;
  };
  responseTime?: string;
  availability?: string;
  badge?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

const supportChannels: SupportChannel[] = [
  {
    id: 'discord',
    title: 'Discord Community',
    description: 'Join our community chat for live Q&A, discussions, and real-time support from the team and community members.',
    icon: MessageCircle,
    action: {
      label: 'Join Discord',
      href: 'https://discord.gg/orenna',
      external: true
    },
    responseTime: 'Usually within 1 hour',
    availability: '24/7 community support',
    badge: 'Most Popular',
    color: 'purple'
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Get personalized help with technical issues, account problems, or detailed questions about the platform.',
    icon: Mail,
    action: {
      label: 'Email Us',
      href: 'mailto:support@orennadao.com',
      external: true
    },
    responseTime: 'Within 24 hours',
    availability: 'Business days',
    color: 'blue'
  },
  {
    id: 'docs',
    title: 'Developer Documentation',
    description: 'Comprehensive technical documentation covering smart contracts, APIs, and integration guides.',
    icon: BookOpen,
    action: {
      label: 'View Docs',
      href: '/docs',
      external: false
    },
    responseTime: 'Instant access',
    availability: 'Always available',
    color: 'green'
  },
  {
    id: 'github',
    title: 'GitHub Issues',
    description: 'Report bugs, request features, or contribute to the open-source development of the Orenna protocol.',
    icon: Github,
    action: {
      label: 'Open Issue',
      href: 'https://github.com/orennadao/orenna',
      external: true
    },
    responseTime: 'Within 48 hours',
    availability: 'Public repository',
    color: 'orange'
  }
];

const colorClasses = {
  blue: {
    border: 'hover:border-blue-300',
    icon: 'text-blue-600 bg-blue-100',
    badge: 'bg-blue-100 text-blue-800'
  },
  purple: {
    border: 'hover:border-purple-300',
    icon: 'text-purple-600 bg-purple-100',
    badge: 'bg-purple-100 text-purple-800'
  },
  green: {
    border: 'hover:border-green-300',
    icon: 'text-green-600 bg-green-100',
    badge: 'bg-green-100 text-green-800'
  },
  orange: {
    border: 'hover:border-orange-300',
    icon: 'text-orange-600 bg-orange-100',
    badge: 'bg-orange-100 text-orange-800'
  }
};

const resources = [
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video guides for common tasks',
    icon: Video,
    href: '/tutorials',
    external: false
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation for developers',
    icon: FileText,
    href: '/api-docs',
    external: false
  },
  {
    title: 'Whitepaper',
    description: 'Technical overview of the Orenna protocol',
    icon: BookOpen,
    href: '/whitepaper.pdf',
    external: true
  }
];

interface SupportCardProps {
  channel: SupportChannel;
}

function SupportCard({ channel }: SupportCardProps) {
  const Icon = channel.icon;
  const colors = colorClasses[channel.color];
  
  return (
    <Card className={`group transition-all duration-200 hover:shadow-lg ${colors.border} border-gray-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colors.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          {channel.badge && (
            <Badge className={colors.badge}>
              {channel.badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
          {channel.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          {channel.description}
        </p>
        
        {/* Availability Info */}
        <div className="space-y-2">
          {channel.responseTime && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Response time: {channel.responseTime}</span>
            </div>
          )}
          {channel.availability && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{channel.availability}</span>
            </div>
          )}
        </div>
        
        {/* Action Button */}
        <Button asChild variant="outline" className="w-full">
          <a 
            href={channel.action.href}
            target={channel.action.external ? '_blank' : undefined}
            rel={channel.action.external ? 'noopener noreferrer' : undefined}
            className="flex items-center justify-center gap-2"
          >
            {channel.action.label}
            {channel.action.external && <ExternalLink className="h-3 w-3" />}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function SupportSection() {
  return (
    <section id="support" className="scroll-mt-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Headphones className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Support & Resources</h2>
        </div>
        <p className="text-gray-600">
          Get help from our community and support team. We're here to help you succeed.
        </p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {supportChannels.map((channel) => (
          <SupportCard key={channel.id} channel={channel} />
        ))}
      </div>

      {/* Additional Resources */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <a
                  key={resource.title}
                  href={resource.href}
                  target={resource.external ? '_blank' : undefined}
                  rel={resource.external ? 'noopener noreferrer' : undefined}
                  className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {resource.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                  {resource.external && (
                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="mt-8 border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Headphones className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">
                Need urgent help?
              </h3>
              <p className="text-orange-800 text-sm mb-3">
                For critical issues affecting live transactions or security concerns, 
                contact our emergency support line.
              </p>
              <Button variant="outline" size="sm" className="bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200">
                <a href="mailto:emergency@orennadao.com" className="flex items-center gap-2">
                  Emergency Contact
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}