'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewsletterFormProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit?: (email: string) => Promise<void>;
}

export function NewsletterForm({ 
  placeholder = "Enter your email",
  submitLabel = "Subscribe",
  onSubmit 
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Default API call
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        if (!response.ok) throw new Error('Subscription failed');
      }
      
      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !email}
          className="bg-brand hover:bg-brand/90"
        >
          {isLoading ? 'Subscribing...' : submitLabel}
        </Button>
      </form>
      
      {status === 'success' && (
        <p className="mt-2 text-sm text-success">
          Successfully subscribed! Check your email for confirmation.
        </p>
      )}
      
      {status === 'error' && (
        <p className="mt-2 text-sm text-destructive">
          Please enter a valid email address.
        </p>
      )}
    </div>
  );
}