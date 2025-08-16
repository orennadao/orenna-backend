import dynamic from 'next/dynamic'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const ProtectedRoute = dynamic(
  () => import("@/components/auth/protected-route").then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
)

const IndexerStatus = dynamic(
  () => import("@/components/indexer/indexer-status").then(mod => ({ default: mod.IndexerStatus })),
  { ssr: false }
)

const EventExplorer = dynamic(
  () => import("@/components/indexer/event-explorer").then(mod => ({ default: mod.EventExplorer })),
  { ssr: false }
)

export default function IndexerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Blockchain Indexer</h1>
                <p className="text-gray-600 mt-2">
                  Monitor blockchain events and indexer status
                </p>
              </div>
              
              <IndexerStatus />
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Explorer</h2>
                <EventExplorer />
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}