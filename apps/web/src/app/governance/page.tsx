import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Dynamic import with no SSR to prevent build errors
const GovernancePageClient = dynamic(
  () => import('@/components/governance/governance-page-client').then(mod => ({ default: mod.GovernancePageClient })),
  { 
    ssr: false,
    loading: () => (
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Loading Governance Dashboard</h3>
              <p className="text-muted-foreground">
                Initializing Web3 providers and governance data...
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }
)

export default function GovernancePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Loading Governance Dashboard</h3>
              <p className="text-muted-foreground">
                Initializing Web3 providers and governance data...
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    }>
      <GovernancePageClient />
    </Suspense>
  )
}