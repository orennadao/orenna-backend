'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker({
        onUpdate: (registration) => {
          // Show update notification to user
          console.log('App update available. Please refresh to get the latest version.');
          
          // Optionally show a notification to the user
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('App Update Available', {
              body: 'A new version is available. Please refresh to update.',
              icon: '/icon-192.png'
            });
          }
        },
        onSuccess: (registration) => {
          console.log('App is ready for offline use');
        },
        onError: (error) => {
          console.error('Service worker registration error:', error);
        }
      });
    }
  }, []);

  return <>{children}</>;
}