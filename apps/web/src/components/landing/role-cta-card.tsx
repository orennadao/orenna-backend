import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface RoleCtaCardProps {
  role: string;
  copy: string;
  ctaLabel: string;
  href: string;
  icon: LucideIcon;
}

export function RoleCtaCard({ 
  role, 
  copy, 
  ctaLabel, 
  href, 
  icon: Icon 
}: RoleCtaCardProps) {
  return (
    <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 group cursor-pointer border-border/50 hover:border-brand/30">
      <Link href={href} className="block h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-brand/10 rounded-lg flex items-center justify-center mr-4 group-hover:bg-brand/20 transition-colors">
              <Icon className="h-6 w-6 text-brand" />
            </div>
            <h3 className="text-xl font-semibold text-foreground group-hover:text-brand transition-colors">
              {role}
            </h3>
          </div>
          
          <p className="text-muted-foreground mb-6 flex-1">
            {copy}
          </p>
          
          <Button 
            variant="outline" 
            className="w-full group-hover:border-brand group-hover:text-brand"
          >
            {ctaLabel}
          </Button>
        </div>
      </Link>
    </Card>
  );
}