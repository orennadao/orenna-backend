import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orenna API Test",
  description: "Test API connectivity for Orenna DAO",
};

export default function ApiTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}