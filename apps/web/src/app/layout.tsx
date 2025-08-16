import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import dynamic from "next/dynamic";

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  import('@/lib/performance');
}

const WebSocketDebug = dynamic(
  () => import("@/components/websocket/websocket-status").then(mod => ({ default: mod.WebSocketDebug })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "Orenna DAO",
  description: "Regenerative finance platform for OrennaDAO",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {children}
          <WebSocketDebug />
        </Providers>
      </body>
    </html>
  );
}