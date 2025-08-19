import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

interface ProjectCardProps {
  kind: 'lift-token' | 'forward' | 'project';
  title: string;
  summary: string;
  img?: string;
  metricLabel: string;
  metricValue: string;
  href: string;
}

export function ProjectCard({ 
  kind, 
  title, 
  summary, 
  img, 
  metricLabel, 
  metricValue, 
  href 
}: ProjectCardProps) {
  const kindConfig = {
    'lift-token': {
      label: 'Lift Token',
      variant: 'default' as const,
      color: 'bg-brand text-brand-fg'
    },
    'forward': {
      label: 'Forward',
      variant: 'secondary' as const,
      color: 'bg-accent text-accent-foreground'
    },
    'project': {
      label: 'Project',
      variant: 'outline' as const,
      color: 'bg-success text-white'
    }
  };

  const config = kindConfig[kind] || kindConfig['project']; // Fallback to project if kind not found

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link href={href} className="block">
        {img && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={img}
              alt={title}
              fill
              loading="lazy"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        {!img && (
          <div className="relative aspect-[16/9] overflow-hidden bg-brand/10 flex items-center justify-center">
            <div className="text-center text-brand/60">
              <div className="text-3xl mb-2">🌱</div>
              <div className="text-sm font-medium">Project Image</div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant={config.variant}
              className={config.color}
            >
              {config.label}
            </Badge>
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-brand transition-colors">
            {title}
          </h3>
          
          <p className="text-muted-foreground mb-4 line-clamp-3">
            {summary}
          </p>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">{metricLabel}</div>
              <div className="font-semibold text-foreground">{metricValue}</div>
            </div>
            <Button variant="ghost" size="sm" className="text-brand hover:text-brand">
              View Details →
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}