import dynamic from 'next/dynamic'
import { MainLayout } from '@/components/layout/main-layout';

const PaymentList = dynamic(
  () => import("@/components/payments/payment-list").then(mod => ({ default: mod.PaymentList })),
  { ssr: false }
)

export default function PaymentsPage() {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600 mt-2">
          View and manage all payment transactions
        </p>
      </div>
      
      <PaymentList />
    </MainLayout>
  );
}