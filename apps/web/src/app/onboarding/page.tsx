import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  Vote, 
  Leaf, 
  DollarSign, 
  Shield, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Onboarding Guide | Orenna DAO',
  description: 'Get started with Orenna DAO - ecological restoration and financing platform',
}

const steps = [
  {
    title: 'Connect Your Wallet',
    description: 'Link your Web3 wallet to participate in the ecosystem',
    icon: Wallet,
    href: '/auth',
    status: 'start'
  },
  {
    title: 'Review Terms & Privacy',
    description: 'Understand platform terms and data handling policies',
    icon: Shield,
    href: '/terms-of-service',
    status: 'important'
  },
  {
    title: 'Explore Governance',
    description: 'Participate in DAO decision-making and proposals',
    icon: Vote,
    href: '/governance',
    status: 'action'
  },
  {
    title: 'Discover Lift Tokens',
    description: 'Support ecological restoration projects',
    icon: Leaf,
    href: '/lift-tokens',
    status: 'explore'
  }
]

const features = [
  {
    title: 'Ecological Impact',
    description: 'Fund and track real-world environmental restoration projects',
    icon: Leaf,
    color: 'text-green-600'
  },
  {
    title: 'DAO Governance',
    description: 'Vote on proposals and shape the future of the platform',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    title: 'Transparent Finance',
    description: 'Track project funding and outcomes with full transparency',
    icon: DollarSign,
    color: 'text-purple-600'
  },
  {
    title: 'Secure Platform',
    description: 'Built on blockchain technology with robust security measures',
    icon: Shield,
    color: 'text-orange-600'
  }
]

export default function OnboardingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to Orenna DAO
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Join the ecological restoration revolution. Fund projects, participate in governance, and create positive environmental impact.
        </p>
      </div>

      {/* Getting Started Steps */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Getting Started</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={step.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${step.status === 'start' ? 'bg-green-100 text-green-700' : ''}
                      ${step.status === 'important' ? 'bg-red-100 text-red-700' : ''}
                      ${step.status === 'action' ? 'bg-blue-100 text-blue-700' : ''}
                      ${step.status === 'explore' ? 'bg-purple-100 text-purple-700' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <Icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={step.href} className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Platform Features */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Platform Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Icon className={`w-8 h-8 ${feature.color} flex-shrink-0 mt-1`} />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">How Orenna Works</h2>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Fund Projects</h3>
            <p className="text-gray-600">
              Purchase Lift Tokens to directly fund ecological restoration projects around the world.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Vote className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Participate in Governance</h3>
            <p className="text-gray-600">
              Vote on proposals, shape platform direction, and help decide which projects get funded.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Track Impact</h3>
            <p className="text-gray-600">
              Monitor project progress, verify outcomes, and see the real-world impact of your contributions.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Join thousands of others making a positive environmental impact through decentralized finance and governance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth" className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/governance" className="flex items-center gap-2">
              <Vote className="w-5 h-5" />
              Explore Governance
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mt-12 pt-8 border-t">
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/terms-of-service" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy-notice" className="text-blue-600 hover:underline">
            Privacy Notice
          </Link>
          <Link href="/governance" className="text-blue-600 hover:underline">
            Governance Portal
          </Link>
          <Link href="/help" className="text-blue-600 hover:underline">
            Help & Support
          </Link>
        </div>
      </section>
    </div>
  )
}