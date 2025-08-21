'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { GuestSidebar } from './guest-sidebar';
import { Breadcrumbs, generateBreadcrumbs, BREADCRUMB_LABELS, type BreadcrumbItem } from './breadcrumbs';
import { WalletConnectButton } from '@/components/auth/wallet-connect-button';
import { GlobalSearch } from '@/components/search/global-search';
import { useAuth, type FinanceRole, type SystemRoleType } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  customBreadcrumbs?: BreadcrumbItem[];
  hideNavigation?: boolean;
}

export function MainLayout({ 
  children, 
  title, 
  description, 
  actions, 
  customBreadcrumbs,
  hideNavigation = false 
}: MainLayoutProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle SSR/client hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Extract user roles from auth
  const allUserRoles = [
    ...((user?.roles?.projectRoles || []) || []),
    ...((user?.roles?.systemRoles || []) || [])
  ];
  
  // Generate breadcrumbs
  const breadcrumbs = customBreadcrumbs || (
    pathname !== '/' ? generateBreadcrumbs(pathname, BREADCRUMB_LABELS) || [] : []
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  const handleNotificationsClick = () => {
    // TODO: Implement notifications
    console.log('Notifications clicked');
  };

  const handleHelpClick = () => {
    // TODO: Implement help/docs
    window.open('https://docs.orennadao.com', '_blank');
  };

  // Public routes that don't need navigation
  const isPublicRoute = pathname === '/' || pathname.startsWith('/auth');
  
  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Special case: no navigation for certain pages
  if (hideNavigation) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      {isAuthenticated ? (
        <Sidebar 
          userRoles={allUserRoles}
          onSearchClick={handleSearchClick}
          onNotificationsClick={handleNotificationsClick}
          onHelpClick={handleHelpClick}
        />
      ) : (
        !isPublicRoute && (
          <GuestSidebar 
            onHelpClick={handleHelpClick}
          />
        )
      )}

      {/* Main Content */}
      <div className={cn(
        "flex flex-col min-h-screen",
        (isAuthenticated || !isPublicRoute) ? "lg:pl-64" : "",
        (isAuthenticated || !isPublicRoute) ? "pb-16 lg:pb-0" : "" // Account for mobile bottom nav
      )}>
        {/* Top Bar for authenticated users */}
        {isAuthenticated && (
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Breadcrumbs */}
                {(breadcrumbs || []).length > 0 && (
                  <Breadcrumbs items={breadcrumbs || []} className="mb-2" />
                )}
                
                {/* Page Title */}
                {title && (
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      {title}
                    </h1>
                    {description && (
                      <p className="text-gray-600 mt-1">{description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                {actions}
                <div className="hidden lg:block">
                  <WalletConnectButton />
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Top Bar for guest users */}
        {!isAuthenticated && !isPublicRoute && (title || description) && (
          <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Page Title for guests */}
                {title && (
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      {title}
                    </h1>
                    {description && (
                      <p className="text-gray-600 mt-1">{description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Connect Wallet for guests */}
              <div className="flex items-center space-x-3">
                {actions}
                <div className="hidden lg:block">
                  <WalletConnectButton />
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </div>
  );
}