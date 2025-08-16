import dynamic from 'next/dynamic'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const ProtectedRoute = dynamic(
  () => import("@/components/auth/protected-route").then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
)

const CreatePaymentContent = dynamic(
  () => import("./create-payment-content").then(mod => ({ default: mod.CreatePaymentContent })),
  { ssr: false }
)

export default function CreatePaymentPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <a 
                  href="/payments" 
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  ← Back to Payments
                </a>
              </div>
              
              <CreatePaymentContent />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}