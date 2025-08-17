import dynamic from 'next/dynamic'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const ProtectedRoute = dynamic(
  () => import("@/components/auth/protected-route").then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
)

const PaymentList = dynamic(
  () => import("@/components/payments/payment-list").then(mod => ({ default: mod.PaymentList })),
  { ssr: false }
)

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-600 mt-2">
                  View and manage all payment transactions
                </p>
              </div>
              
              <PaymentList />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}