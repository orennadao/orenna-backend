'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AnnouncementBarProps {
  message: string;
  href?: string;
  variant?: 'info' | 'success';
  dismissible?: boolean;
}

export function AnnouncementBar({ 
  message, 
  href, 
  variant = 'info', 
  dismissible = true 
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const variantStyles = {
    info: 'bg-brand/10 text-brand border-brand/20',
    success: 'bg-success/10 text-success border-success/20'
  };

  const content = (
    <div className={`border-b py-3 px-4 text-center text-sm font-medium ${variantStyles[variant]}`}>
      <div className="container mx-auto flex items-center justify-center relative">
        <span>{message}</span>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 h-auto p-1 text-current hover:bg-current/10"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}