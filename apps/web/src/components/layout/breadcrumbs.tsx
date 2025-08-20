'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items.length) return null;

  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm text-gray-600", className)}
      aria-label="Breadcrumb"
    >
      {/* Home icon for the first item */}
      <Link 
        href="/"
        className="flex items-center hover:text-gray-900 transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          
          {item.href && !item.current ? (
            <Link 
              href={item.href}
              className="hover:text-gray-900 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={cn(
                "font-medium",
                item.current ? "text-gray-900" : "text-gray-600"
              )}
              aria-current={item.current ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Helper function to generate breadcrumbs from pathname
export function generateBreadcrumbs(pathname: string, customLabels?: Record<string, string>): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Use custom label if provided, otherwise format the segment
    const label = customLabels?.[currentPath] || 
                  customLabels?.[segment] || 
                  segment.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ');
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    });
  });
  
  return breadcrumbs;
}

// Common breadcrumb patterns
export const BREADCRUMB_LABELS: Record<string, string> = {
  // Sections
  'projects': 'Projects',
  'marketplace': 'Marketplace',
  'forwards': 'Forwards',
  'lift-tokens': 'Lift Tokens',
  'mint-requests': 'Mint Requests',
  'analytics': 'Analytics',
  'payments': 'Payments',
  'governance': 'Governance',
  'auth': 'Account',
  
  // Actions
  'create': 'Create',
  'edit': 'Edit',
  'view': 'View',
  'buy': 'Purchase',
  'profile': 'Profile',
  'settings': 'Settings',
  
  // Common paths
  '/marketplace/forwards': 'Forwards',
  '/marketplace/tokens': 'Tokens',
  '/auth/profile': 'Profile',
  '/auth/settings': 'Settings'
};