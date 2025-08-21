import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Force dynamic rendering to prevent SSG issues with Web3 providers
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Dynamic import with no SSR to prevent build errors
const VerificationPageClient = dynamicImport(
  () => import('../../components/verification/verification-page-client').then(mod => ({ default: mod.VerificationPageClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Loading Verification Dashboard</h3>
            <p className="text-muted-foreground">
              Initializing verification system and API clients...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
)

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Loading Verification Dashboard</h3>
            <p className="text-muted-foreground">
              Initializing verification system and API clients...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerificationPageClient />
    </Suspense>
  )
}