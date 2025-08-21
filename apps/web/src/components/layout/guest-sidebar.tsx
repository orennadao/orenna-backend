'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from '@/components/auth/wallet-connect-button';
import { 
  Home,
  FolderOpen,
  TrendingUp,
  Coins,
  BarChart3,
  Building2,
  Menu,
  X,
  HelpCircle,
  LogIn,
  Eye
} from 'lucide-react';

// Guest navigation items - public pages that don't require authentication
const guestNavigationItems = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    description: 'Welcome to Orenna DAO'
  },
  {
    id: 'projects',
    label: 'Browse Projects',
    href: '/projects',
    icon: FolderOpen,
    description: 'Explore regenerative finance projects'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/marketplace',
    icon: TrendingUp,
    description: 'View marketplace offerings'
  },
  {
    id: 'forwards',
    label: 'Lift Forwards',
    href: '/marketplace/forwards',
    icon: TrendingUp,
    description: 'Browse available forwards'
  },
  {
    id: 'lift-tokens',
    label: 'Lift Tokens',
    href: '/marketplace/lift-tokens',
    icon: Coins,
    description: 'View lift tokens'
  },
  {
    id: 'analytics',
    label: 'Public Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Platform metrics and statistics'
  },
  {
    id: 'governance',
    label: 'Governance',
    href: '/orna/governance',
    icon: Building2,
    description: 'View governance proposals'
  }
];

// Utility items for guests
const guestUtilityItems = [
  {
    id: 'help',
    label: 'Help',
    href: '/help',
    icon: HelpCircle,
    description: 'Help center and documentation'
  }
];

interface GuestSidebarProps {
  onHelpClick?: () => void;
}

export function GuestSidebar({ onHelpClick }: GuestSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200",
        isCollapsed ? "lg:w-16" : "lg:w-64"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link href="/" className="text-xl font-bold text-gray-900">
              Orenna DAO
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Guest Mode Banner */}
        {!isCollapsed && (
          <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Guest Mode</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Connect your wallet for full access
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {guestNavigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-lg transition-colors group",
                    isActive 
                      ? "bg-blue-50 text-blue-700 border border-blue-200" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={isCollapsed ? item.label : item.description}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                    isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  {!isCollapsed && (
                    <span className="flex-1 font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Utility Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-1">
            {guestUtilityItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={isCollapsed ? item.label : item.description}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                    "text-gray-500"
                  )} />
                  {!isCollapsed && (
                    <span className="flex-1 font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Connect Wallet Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-3">
            <WalletConnectButton className="w-full" />
            <Link
              href="/auth"
              className={cn(
                "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={isCollapsed ? "Sign In" : "Sign in or create account"}
            >
              <LogIn className={cn(
                "flex-shrink-0",
                isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                "text-gray-500"
              )} />
              {!isCollapsed && (
                <span className="flex-1 font-medium">Sign In</span>
              )}
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <nav className="flex">
          {guestNavigationItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-blue-600" : "text-gray-500"
                )} />
                <span className={cn(
                  "truncate max-w-full font-medium",
                  isActive ? "text-blue-600" : "text-gray-600"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          {/* Connect Wallet in mobile */}
          <div className="flex-1 flex flex-col items-center justify-center py-1 px-1">
            <WalletConnectButton size="sm" className="text-xs px-2 py-1">
              Connect
            </WalletConnectButton>
          </div>
        </nav>
      </div>
    </>
  );
}