import dynamic from 'next/dynamic'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const ProtectedRoute = dynamic(
  () => import("@/components/auth/protected-route").then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
)

const MintRequestList = dynamic(
  () => import("@/components/mint-requests/mint-request-list").then(mod => ({ default: mod.MintRequestList })),
  { ssr: false }
)

export default function MintRequestsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mint Requests</h1>
                <p className="text-gray-600 mt-2">
                  Manage carbon credit mint requests and approvals
                </p>
              </div>
              
              <MintRequestList />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}