# Orenna Web Frontend

A Next.js 14 frontend application for the Orenna DAO regenerative finance platform.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **TypeScript**: Full type safety
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **Development**: ESLint, hot reload

## Development

### Prerequisites

- Node.js 18+
- pnpm 9+

### Getting Started

1. **Install dependencies** (from monorepo root):
   ```bash
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**:
   ```bash
   # From monorepo root
   pnpm dev:web
   
   # Or run both API and web together
   pnpm dev:all
   ```

4. **Open in browser**: http://localhost:3001

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Type checking
- `pnpm lint` - ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   └── layout/         # Layout components
├── lib/                # Utilities and API client
└── types/              # TypeScript type definitions
```

## Features

### Phase 1 (Completed)
- ✅ Modern Next.js setup with TypeScript
- ✅ Tailwind CSS styling system
- ✅ Basic layout components (Header, Footer)
- ✅ Reusable UI components
- ✅ API client foundation
- ✅ Responsive design

### Phase 2 (Completed)
- ✅ Web3 integration with wagmi and viem
- ✅ WalletConnect support for multiple wallets
- ✅ SIWE (Sign-In with Ethereum) authentication
- ✅ Session management with secure cookies
- ✅ Protected routes and authentication guards
- ✅ Wallet connection UI components

### Upcoming Phases
- **Phase 3**: Payment interface and blockchain explorer
- **Phase 4**: Project management and mint requests
- **Phase 5**: Real-time updates and data visualization

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID (get from https://cloud.walletconnect.com/)

## Authentication Flow

The app uses SIWE (Sign-In with Ethereum) for authentication:

1. **Connect Wallet**: Users connect their Web3 wallet (MetaMask, WalletConnect, etc.)
2. **Get Nonce**: Frontend requests a cryptographic nonce from the backend
3. **Sign Message**: User signs a SIWE message with their wallet
4. **Verify & Authenticate**: Backend verifies the signature and creates a session
5. **Access Protected Routes**: User can now access authenticated features

### Supported Wallets
- MetaMask (injected)
- WalletConnect v2 (mobile wallets)
- Coinbase Wallet
- Any other injected wallets

## Integration with Backend

The web app connects to the Orenna API backend at `/api` endpoints:
- **Authentication**: `/auth/nonce`, `/auth/verify`, `/auth/logout`, `/auth/profile`
- **Health status**: `/health/liveness`
- **Payment processing**: `/api/payments`
- **Project management**: `/api/projects`
- **Blockchain indexing**: `/api/indexer/*`

## Contributing

1. Follow existing code patterns and TypeScript conventions
2. Use Tailwind CSS for styling
3. Ensure components are accessible and responsive
4. Run type checking before committing: `pnpm typecheck`