import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  background?: 'default' | 'muted' | 'accent';
}

export function Section({ 
  children, 
  className = '', 
  id,
  background = 'default' 
}: SectionProps) {
  const backgroundStyles = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    accent: 'bg-brand/5'
  };

  return (
    <section 
      id={id}
      className={`py-20 md:py-28 ${backgroundStyles[background]} ${className}`}
    >
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  );
}