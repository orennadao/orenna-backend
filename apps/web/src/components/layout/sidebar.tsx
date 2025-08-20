'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home,
  FolderOpen,
  TrendingUp,
  Coins,
  ClipboardCheck,
  BarChart3,
  CreditCard,
  Building2,
  Settings,
  Menu,
  X,
  Search,
  HelpCircle,
  Bell
} from 'lucide-react';

// Navigation items according to the IA spec
const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    description: 'Overview and dashboard'
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: FolderOpen,
    description: 'Browse and manage projects'
  },
  {
    id: 'forwards',
    label: 'Forwards',
    href: '/marketplace/forwards',
    icon: TrendingUp,
    description: 'Lift Forwards marketplace'
  },
  {
    id: 'lift-tokens',
    label: 'Lift Tokens',
    href: '/lift-tokens',
    icon: Coins,
    description: 'Manage your tokens'
  },
  {
    id: 'mint-requests',
    label: 'Mint Requests',
    href: '/mint-requests',
    icon: ClipboardCheck,
    description: 'Verification queue',
    roles: ['VERIFIER', 'PLATFORM_ADMIN'] // Role-restricted
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Platform metrics'
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/payments',
    icon: CreditCard,
    description: 'Payment history'
  },
  {
    id: 'governance',
    label: 'ORNA',
    href: '/governance',
    icon: Building2,
    description: 'Governance portal'
  }
];

// Utility items
const utilityItems = [
  {
    id: 'search',
    label: 'Search',
    shortcut: '⌘/',
    icon: Search,
    action: 'search'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    action: 'notifications'
  },
  {
    id: 'help',
    label: 'Help',
    href: '/help',
    icon: HelpCircle,
    description: 'Help center and documentation'
  }
];

interface SidebarProps {
  userRoles?: string[];
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onHelpClick?: () => void;
}

export function Sidebar({ 
  userRoles = [], 
  onSearchClick, 
  onNotificationsClick, 
  onHelpClick 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Filter navigation items based on user roles
  const filteredNavItems = navigationItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => userRoles.includes(role));
  });

  const handleUtilityAction = (action: string) => {
    switch (action) {
      case 'search':
        onSearchClick?.();
        break;
      case 'notifications':
        onNotificationsClick?.();
        break;
      case 'help':
        onHelpClick?.();
        break;
    }
  };

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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
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
            {utilityItems.map((item) => {
              const Icon = item.icon;
              
              // Handle href vs action items
              if (item.href) {
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
                      <div className="flex-1 flex items-center justify-between">
                        <span className="font-medium">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleUtilityAction(item.action)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                    "text-gray-500"
                  )} />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-gray-200 p-4">
          <Link
            href="/auth/profile"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
            title={isCollapsed ? "Profile" : "Profile & Settings"}
          >
            <Settings className={cn(
              "flex-shrink-0",
              isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
              "text-gray-500"
            )} />
            {!isCollapsed && (
              <span className="flex-1 font-medium">Profile</span>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <nav className="flex">
          {filteredNavItems.slice(0, 5).map((item) => {
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
        </nav>
      </div>
    </>
  );
}