import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Notice | Orenna DAO',
  description: 'Privacy Notice and data handling policies for Orenna DAO',
}

export default function PrivacyNoticePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray max-w-none">
        <h1>Orenna DAO – Privacy Notice</h1>
        
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> January 2025
        </p>

        <p>
          This Privacy Notice explains how Orenna DAO ("Orenna," "we," "our," "us") collects, uses, and protects information when you access or use our platform and services.
        </p>

        <h2>1. Information We Collect</h2>
        
        <h3>Blockchain Data</h3>
        <ul>
          <li><strong>Wallet addresses:</strong> Public wallet addresses used to interact with our platform</li>
          <li><strong>Transaction data:</strong> On-chain transactions related to Orenna tokens and smart contracts</li>
          <li><strong>Token holdings:</strong> Information about your Orenna token balances and governance participation</li>
        </ul>

        <h3>Usage Information</h3>
        <ul>
          <li><strong>Platform interactions:</strong> Pages visited, features used, and time spent on platform</li>
          <li><strong>Device information:</strong> Browser type, operating system, and IP address</li>
          <li><strong>Analytics data:</strong> Aggregated usage patterns and platform performance metrics</li>
        </ul>

        <h3>Voluntary Information</h3>
        <ul>
          <li><strong>Profile information:</strong> Any information you choose to provide in your profile</li>
          <li><strong>Communication:</strong> Messages sent through our platform or support channels</li>
          <li><strong>Verification data:</strong> Information provided for project verification processes</li>
        </ul>

        <h2>2. How We Use Information</h2>
        
        <h3>Platform Operations</h3>
        <ul>
          <li>Provide and maintain platform functionality</li>
          <li>Process transactions and governance activities</li>
          <li>Verify project eligibility and compliance</li>
          <li>Prevent fraud and ensure platform security</li>
        </ul>

        <h3>Improvement and Analytics</h3>
        <ul>
          <li>Analyze platform usage to improve user experience</li>
          <li>Develop new features and services</li>
          <li>Monitor platform performance and reliability</li>
          <li>Generate aggregated reports for DAO governance</li>
        </ul>

        <h3>Communication</h3>
        <ul>
          <li>Send important platform updates and notifications</li>
          <li>Respond to support requests and inquiries</li>
          <li>Communicate governance proposals and voting opportunities</li>
        </ul>

        <h2>3. Information Sharing</h2>
        
        <p>We do not sell personal information. We may share information in the following circumstances:</p>

        <h3>Public Blockchain Data</h3>
        <ul>
          <li>Wallet addresses and transaction data are publicly visible on the blockchain</li>
          <li>Governance votes and token holdings may be publicly accessible</li>
          <li>Project verification data may be shared publicly as part of transparency requirements</li>
        </ul>

        <h3>Service Providers</h3>
        <ul>
          <li>Third-party services that help us operate the platform (analytics, infrastructure)</li>
          <li>Security and fraud prevention services</li>
          <li>Communication and support tools</li>
        </ul>

        <h3>Legal Requirements</h3>
        <ul>
          <li>When required by law or legal process</li>
          <li>To protect our rights, property, or safety</li>
          <li>To enforce our Terms of Service</li>
        </ul>

        <h2>4. Data Security</h2>
        
        <p>We implement appropriate technical and organizational measures to protect your information:</p>
        <ul>
          <li>Encryption of data in transit and at rest</li>
          <li>Regular security assessments and updates</li>
          <li>Access controls and authentication measures</li>
          <li>Monitoring for unauthorized access or breaches</li>
        </ul>

        <h2>5. Your Rights and Choices</h2>
        
        <h3>Analytics Opt-Out</h3>
        <ul>
          <li>You can opt out of analytics tracking in your profile settings</li>
          <li>Essential platform functionality will continue to work</li>
        </ul>

        <h3>Data Access and Correction</h3>
        <ul>
          <li>You can view and update your profile information</li>
          <li>Request access to information we have about you</li>
          <li>Request correction of inaccurate information</li>
        </ul>

        <h3>Account Deletion</h3>
        <ul>
          <li>You can discontinue platform use at any time</li>
          <li>Blockchain data will remain permanently recorded</li>
          <li>Non-blockchain data may be retained for legal compliance</li>
        </ul>

        <h2>6. International Users</h2>
        
        <p>
          Orenna operates globally but is based in the United States. By using our platform, you consent to the transfer and processing of your information in the United States and other countries where we operate.
        </p>

        <h2>7. Children's Privacy</h2>
        
        <p>
          Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.
        </p>

        <h2>8. Third-Party Links</h2>
        
        <p>
          Our platform may contain links to third-party websites or services. This Privacy Notice does not apply to those external sites. We encourage you to review their privacy policies.
        </p>

        <h2>9. Updates to This Notice</h2>
        
        <p>
          We may update this Privacy Notice from time to time. We will notify you of material changes through the platform or by other means.
        </p>

        <h2>10. Contact Us</h2>
        
        <p>
          If you have questions about this Privacy Notice or our data practices, please contact us through our support channels or governance forums.
        </p>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Key Points</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>We prioritize transparency and user control over data</li>
            <li>Blockchain data is inherently public and permanent</li>
            <li>You can opt out of analytics and control your profile information</li>
            <li>We implement strong security measures to protect your data</li>
            <li>We do not sell personal information to third parties</li>
          </ul>
        </div>
      </div>
    </div>
  )
}