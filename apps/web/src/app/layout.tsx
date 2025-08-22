import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

// Force dynamic rendering globally to prevent SSG issues with Web3 providers
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: "Orenna DAO",
  description: "Regenerative finance platform for OrennaDAO",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extension attributes
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = (...args) => {
                  const message = args[0];
                  if (typeof message === 'string') {
                    // Suppress hydration warnings for browser extensions
                    if (message.includes('Extra attributes from the server') && 
                        message.includes('data-sharkid')) {
                      return;
                    }
                    // Suppress third-party wallet/analytics errors in development
                    if (message.includes('cca-lite.coinbase.com') ||
                        message.includes('walletconnect.org') ||
                        message.includes('Origin http://localhost:3000 not found on Allowlist')) {
                      return;
                    }
                  }
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}