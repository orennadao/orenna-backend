import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Orenna DAO',
  description: 'Terms of Service for Orenna DAO platform and services',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray max-w-none">
        <h1>Orenna DAO – Terms of Service</h1>
        
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> January 2025
        </p>

        <p>
          Welcome to <strong>Orenna DAO</strong> ("Orenna," "we," "our," "us").
          By accessing or using our platform (the "Services"), including connecting a wallet, purchasing or holding Orenna tokens, or otherwise participating in the Orenna ecosystem, you ("you," "user," or "participant") agree to be bound by these Terms of Service (the "Terms").
        </p>

        <p>
          Please read carefully. By checking the acceptance box during onboarding, you acknowledge that you have read, understood, and agreed to these Terms.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By connecting a wallet, purchasing, holding, or using Orenna tokens, or participating in Orenna DAO governance, you agree to be bound by these Terms, our Privacy Policy, and any rules adopted by Orenna DAO. If you do not agree, you may not use the Services.
        </p>

        <h2>2. Eligibility</h2>
        <ul>
          <li>You must be at least 18 years old (or the age of majority in your jurisdiction).</li>
          <li>You may not use the Services if you are a resident of, or located in, a jurisdiction where participation in decentralized autonomous organizations, token-based ecosystems, or similar activities is restricted or illegal.</li>
          <li>By using the Services, you represent and warrant that you meet these eligibility requirements.</li>
        </ul>

        <h2>3. Nature of Participation</h2>
        <ul>
          <li>Orenna is a <strong>voluntary ecological restoration and financing platform</strong>.</li>
          <li>Orenna tokens (including governance tokens and Lift Tokens) represent participation in governance or ecological lift outcomes.</li>
          <li>Tokens are <strong>not securities, investment contracts, or guarantees of financial return</strong>.</li>
          <li>Nothing in the Services constitutes financial, legal, or investment advice.</li>
        </ul>

        <h2>4. User Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Use the Services only for lawful purposes and in compliance with these Terms.</li>
          <li>Maintain control and security of your wallet and private keys. Orenna cannot recover lost private keys.</li>
          <li>Provide accurate information when required (e.g., for compliance or verification).</li>
          <li>Respect DAO governance outcomes, including majority decisions.</li>
        </ul>

        <h2>5. DAO Governance</h2>
        <ul>
          <li>Orenna operates as a <strong>Wyoming DAO LLC</strong> with decision-making distributed among token holders.</li>
          <li>Proposals and votes may affect your participation, rights, and responsibilities.</li>
          <li>By using the Services, you accept that governance decisions are binding and may result in changes to platform rules, token mechanics, or other features.</li>
        </ul>

        <h2>6. Risks</h2>
        <p>Participation involves significant risks, including but not limited to:</p>
        <ul>
          <li><strong>Smart Contract Risks:</strong> vulnerabilities, bugs, or exploits may result in loss of tokens or funds.</li>
          <li><strong>Market Risks:</strong> token values may fluctuate or become illiquid.</li>
          <li><strong>Regulatory Risks:</strong> laws may change, potentially restricting participation or requiring compliance actions.</li>
          <li><strong>Ecological Risks:</strong> restoration outcomes may vary and are not guaranteed.</li>
        </ul>
        <p>By accepting these Terms, you acknowledge and assume all such risks.</p>

        <h2>7. No Warranties</h2>
        <p>
          The Services are provided <strong>"as is"</strong> and <strong>"as available."</strong>
          Orenna makes no warranties of any kind, whether express or implied, regarding the Services, tokens, or outcomes.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law:</p>
        <ul>
          <li>Orenna, its DAO LLC members, contributors, partners, or affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of funds, profits, data, or ecological outcomes.</li>
          <li>Your sole and exclusive remedy for dissatisfaction with the Services is to discontinue use.</li>
        </ul>

        <h2>9. Termination</h2>
        <p>
          Orenna may restrict or terminate your access to the Services if you violate these Terms or applicable laws. You may cease participation at any time by discontinuing use of the Services and disposing of your tokens.
        </p>

        <h2>10. Governing Law & Disputes</h2>
        <ul>
          <li>These Terms are governed by the laws of the State of Wyoming, U.S.A., without regard to conflicts of law principles.</li>
          <li>Any dispute shall be resolved through binding arbitration in Wyoming, unless otherwise required by law.</li>
        </ul>

        <h2>11. Changes to Terms</h2>
        <p>
          Orenna may update these Terms from time to time. Updated Terms will be posted, and your continued use of the Services constitutes acceptance of the revised Terms.
        </p>

        <h2>12. Acknowledgment</h2>
        <p>By clicking "I Agree" during onboarding, you acknowledge that:</p>
        <ul>
          <li>You understand the nature of participation in Orenna DAO.</li>
          <li>You accept the risks outlined above.</li>
          <li>You agree to be bound by these Terms of Service.</li>
        </ul>
      </div>
    </div>
  )
}