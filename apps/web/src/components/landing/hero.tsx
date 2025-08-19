import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  eyebrow?: string;
  title: string;
  kicker?: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  media?: {
    type: 'image' | 'video';
    src: string;
    alt?: string;
  };
}

export function Hero({ 
  eyebrow, 
  title, 
  kicker, 
  primaryCta, 
  secondaryCta, 
  media 
}: HeroProps) {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {eyebrow && (
              <p className="text-brand font-medium mb-4">{eyebrow}</p>
            )}
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {title}
            </h1>
            
            {kicker && (
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                {kicker}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href={primaryCta.href}>
                <Button size="lg" className="bg-brand hover:bg-brand/90">
                  {primaryCta.label}
                </Button>
              </Link>
              <Link href={secondaryCta.href}>
                <Button variant="outline" size="lg">
                  {secondaryCta.label}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Media */}
          {media && (
            <div className="relative">
              {media.type === 'image' ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <Image
                    src={media.src}
                    alt={media.alt || ''}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <video
                    src={media.src}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              )}
            </div>
          )}
          
          {!media && (
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
              <div className="text-center text-brand/60">
                <div className="text-6xl mb-4">🌍</div>
                <div className="text-lg font-medium">Regenerative Impact</div>
                <div className="text-sm">Coming Soon</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}