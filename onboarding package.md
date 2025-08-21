🚀 Orenna Onboarding Package
1. Onboarding Flow Overview

The flow should balance legal compliance, clarity, and trust:

Wallet Connection Screen

“Connect your wallet to begin”

Button: Connect Wallet (MetaMask, WalletConnect, etc.)

Footer note: “By continuing, you agree to Orenna’s Terms of Service and Privacy Notice.” (clickable links)

Intro / Welcome Modal

Short welcome: “Welcome to Orenna — a community restoring ecosystems together.”

Show key principles (transparency, voluntary restoration, DAO governance).

Button: Next

Terms of Service + Quick Summary Split Screen

Left side (Full Terms of Service): scrollable, legal text.

Right side (Quick Summary): bullets, plain language, icons ✅ ⚖️ ⚠️ ❌.

Checkbox: I have read and agree to the Terms of Service (must be checked to proceed).

Button: Accept & Continue

Privacy Notice Screen

Friendly tone: “We collect as little as possible. Here’s what that means.”

Summary bullets:

We log wallet activity (on-chain).

We don’t sell or misuse data.

You can control cookies and opt out of communications.

Button: I Understand

Final Consent Screen

One-liner confirmation:

“By joining Orenna, you acknowledge the risks, agree to our governance process, and confirm your participation is voluntary.”

Checkbox: I consent

Button: Enter Orenna

2. UI Design Recommendations

Tone: Friendly but professional (think trustworthy fintech meets climate action).

Quick Summary Visuals: Use icons (⚖️ for governance, 🔑 for wallet, 🌱 for ecology).

Progress Indicator: Show step 1 → 5 so users know they’re moving forward.

Mobile Friendly: Collapsible text for ToS/Privacy on smaller screens.

Tooltips: Hover/click for definitions (e.g., “What is a DAO?”).

3. Trust-Building Elements

Transparency: Plain-language summaries beside legal text.

User Control: Explicit “You control your wallet/private keys.”

Risk Honesty: Call out risks directly instead of hiding them in fine print.

DAO Legitimacy: Mention “Organized as a Wyoming DAO LLC” up front.

Contact Info: email ben@orennadao.com for questions.

4. Deliverables

Copy Documents:

Full Terms of Service (legal text)

Quick Summary (plain language)

Privacy Notice

UI Wireframe Drafts:

Flow outline (5 screens)

Suggested layout for split-screen ToS + Quick Summary

Consent checkboxes + buttons

Technical Integration Notes:

Store ToS acceptance on-chain (hash of current version) or in a lightweight off-chain DB.

Include version control (so future updates require re-acceptance).

Privacy Notice acceptance can be off-chain (no legal binding required).