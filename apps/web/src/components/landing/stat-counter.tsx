'use client';

import { useEffect, useRef, useState } from 'react';

interface StatCounterProps {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  subtle?: boolean;
}

export function StatCounter({ 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  subtle = false 
}: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/[^\d]/g, ''), 10) || 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          // Respect reduced motion preference
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          if (prefersReducedMotion) {
            setDisplayValue(numericValue);
            return;
          }

          // Animate the counter
          const duration = 2000; // 2 seconds
          const steps = 60;
          const stepValue = numericValue / steps;
          let currentStep = 0;

          const timer = setInterval(() => {
            currentStep++;
            setDisplayValue(Math.floor(stepValue * currentStep));

            if (currentStep >= steps) {
              clearInterval(timer);
              setDisplayValue(numericValue);
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [numericValue, hasAnimated]);

  const formattedValue = typeof value === 'number' 
    ? displayValue.toLocaleString() 
    : hasAnimated ? value : '0';

  return (
    <div 
      ref={elementRef}
      className={`text-center ${subtle ? 'opacity-80' : ''}`}
    >
      <div className={`font-bold ${subtle ? 'text-2xl' : 'text-3xl md:text-4xl'} text-foreground mb-2`}>
        {prefix}{formattedValue}{suffix}
      </div>
      <div className={`${subtle ? 'text-sm' : 'text-base'} text-muted-foreground font-medium`}>
        {label}
      </div>
    </div>
  );
}