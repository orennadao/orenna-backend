'use client';

import { Card } from './card';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Search, 
  Plus, 
  AlertCircle, 
  Inbox,
  Users,
  Coins,
  FolderOpen,
  CheckCircle,
  Clock,
  Globe,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline';
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn("p-8", className)}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="h-8 w-8 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {action && (
              action.href ? (
                <Link href={action.href}>
                  <Button variant={action.variant || 'default'}>
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Link href={secondaryAction.href}>
                  <Button variant="outline">
                    {secondaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="outline"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Specialized empty states for common scenarios
export function NoProjectsEmpty({ canCreate = true }: { canCreate?: boolean }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="No Projects Yet"
      description="Get started by creating your first regenerative project. Projects are the foundation for creating lift tokens through verified environmental improvements."
      action={canCreate ? {
        label: "Create Project",
        href: "/projects/create"
      } : undefined}
      secondaryAction={{
        label: "Learn More",
        href: "/docs/projects"
      }}
    />
  );
}

export function NoMintRequestsEmpty({ canCreate = true }: { canCreate?: boolean }) {
  return (
    <EmptyState
      icon={Coins}
      title="No Mint Requests"
      description="Submit mint requests with evidence of environmental improvements to create lift tokens. Each request will be reviewed by verified auditors."
      action={canCreate ? {
        label: "Submit Request",
        href: "/mint-requests/create"
      } : undefined}
      secondaryAction={{
        label: "Browse Projects",
        href: "/projects"
      }}
    />
  );
}

export function NoLiftTokensEmpty() {
  return (
    <EmptyState
      icon={Coins}
      title="No Lift Tokens Yet"
      description="Lift tokens are automatically created when your mint requests are approved and minted on-chain. Start by submitting a mint request for verified environmental work."
      action={{
        label: "Submit Mint Request",
        href: "/mint-requests/create"
      }}
      secondaryAction={{
        label: "Browse Projects",
        href: "/projects"
      }}
    />
  );
}

export function NoForwardsEmpty() {
  return (
    <EmptyState
      icon={Clock}
      title="No Forwards Available"
      description="Lift forwards allow you to back regenerative projects before they deliver verified outcomes. Check back soon for new opportunities to support environmental projects."
      secondaryAction={{
        label: "Browse Projects",
        href: "/projects"
      }}
    />
  );
}

export function NoSearchResultsEmpty({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm: string; 
  onClear: () => void; 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={`No items match "${searchTerm}". Try adjusting your search terms or browse all available items.`}
      action={{
        label: "Clear Search",
        onClick: onClear,
        variant: "outline"
      }}
    />
  );
}

export function AccessDeniedEmpty({ 
  title = "Access Restricted",
  requiredRole 
}: { 
  title?: string;
  requiredRole?: string;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={
        requiredRole 
          ? `You need ${requiredRole} permissions to access this content.`
          : "You don't have permission to view this content."
      }
      secondaryAction={{
        label: "Go Back",
        onClick: () => window.history.back()
      }}
    />
  );
}

export function VerificationQueueEmpty({ statusFilter }: { statusFilter?: string }) {
  const getEmptyMessage = () => {
    switch (statusFilter) {
      case 'PENDING':
        return {
          title: "No Pending Verifications",
          description: "All mint requests have been reviewed. New submissions will appear here for verification."
        };
      case 'APPROVED':
        return {
          title: "No Approved Requests",
          description: "No mint requests have been approved yet."
        };
      case 'REJECTED':
        return {
          title: "No Rejected Requests", 
          description: "No mint requests have been rejected yet."
        };
      default:
        return {
          title: "No Mint Requests",
          description: "No mint requests have been submitted for verification yet."
        };
    }
  };

  const { title, description } = getEmptyMessage();

  return (
    <EmptyState
      icon={CheckCircle}
      title={title}
      description={description}
    />
  );
}

export function OnboardingEmpty({ 
  userRole 
}: { 
  userRole?: 'member' | 'verifier' | 'admin'; 
}) {
  const getOnboardingContent = () => {
    switch (userRole) {
      case 'verifier':
        return {
          title: "Welcome, Verifier",
          description: "As a verifier, you can review mint requests and approve environmental improvements for lift token creation.",
          actions: [
            { label: "Review Queue", href: "/mint-requests" },
            { label: "Verification Guide", href: "/docs/verification" }
          ]
        };
      case 'admin':
        return {
          title: "Welcome, Administrator",
          description: "You have full access to manage projects, users, and platform settings.",
          actions: [
            { label: "Admin Dashboard", href: "/admin" },
            { label: "User Management", href: "/admin/users" }
          ]
        };
      default:
        return {
          title: "Welcome to Orenna DAO",
          description: "Start your regenerative finance journey by exploring projects, backing forwards, or submitting your own environmental improvements.",
          actions: [
            { label: "Browse Projects", href: "/projects" },
            { label: "View Forwards", href: "/marketplace/forwards" }
          ]
        };
    }
  };

  const { title, description, actions } = getOnboardingContent();

  return (
    <EmptyState
      icon={Users}
      title={title}
      description={description}
      action={actions[0] ? {
        label: actions[0].label,
        href: actions[0].href
      } : undefined}
      secondaryAction={actions[1] ? {
        label: actions[1].label,
        href: actions[1].href
      } : undefined}
    />
  );
}

export function ComingSoonEmpty({ 
  feature,
  description 
}: { 
  feature: string;
  description?: string;
}) {
  return (
    <EmptyState
      icon={Clock}
      title={`${feature} Coming Soon`}
      description={description || `${feature} is currently in development. We're working hard to bring you this feature soon.`}
      secondaryAction={{
        label: "Back to Dashboard",
        href: "/"
      }}
    />
  );
}

// Mobile-specific empty states
export function MobileOnlyEmpty() {
  return (
    <EmptyState
      icon={Smartphone}
      title="Mobile App Required"
      description="This feature is only available in our mobile app. Download the Orenna DAO app to access this functionality."
      action={{
        label: "Download App",
        href: "#" // Replace with actual app store link
      }}
    />
  );
}

export function NetworkEmptyState() {
  return (
    <EmptyState
      icon={Globe}
      title="Connection Issue"
      description="Unable to connect to the network. Please check your internet connection and try again."
      action={{
        label: "Retry",
        onClick: () => window.location.reload()
      }}
    />
  );
}