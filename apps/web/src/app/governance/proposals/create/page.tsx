import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// Force dynamic rendering to prevent SSG issues with Web3 providers
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Dynamic import with no SSR to prevent build errors
const CreateProposalClient = dynamicImport(
  () => import('./client'),
  { 
    ssr: false,
    loading: () => (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Loading Proposal Creator</h3>
            <p className="text-muted-foreground">
              Initializing governance proposal form...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
)

export default function CreateProposalPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Loading Proposal Creator</h3>
            <p className="text-muted-foreground">
              Initializing governance proposal form...
            </p>
          </CardContent>
        </Card>
      </div>
    }>
      <CreateProposalClient />
    </Suspense>
  )
}