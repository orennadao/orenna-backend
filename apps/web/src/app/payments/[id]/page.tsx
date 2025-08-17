import dynamic from 'next/dynamic'
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const ProtectedRoute = dynamic(
  () => import("@/components/auth/protected-route").then(mod => ({ default: mod.ProtectedRoute })),
  { ssr: false }
)

const PaymentDetail = dynamic(
  () => import("@/components/payments/payment-detail").then(mod => ({ default: mod.PaymentDetail })),
  { ssr: false }
)

interface PaymentDetailPageProps {
  params: {
    id: string
  }
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <a 
                  href="/payments" 
                  className="text-primary-600 hover:text-primary-800 text-sm"
                >
                  ← Back to Payments
                </a>
              </div>
              
              <PaymentDetail paymentId={params.id} />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
}