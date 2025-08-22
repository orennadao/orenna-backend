# Debug Guide - Orenna DAO Web3 Authentication System

**Last Updated**: August 22, 2025  
**Status**: Web3 Authentication System Implemented & Fixed - Debugging ReferenceError  
**Branch**: `main`

## 🎯 Current State

### ✅ **What's Working**
- **Complete Web3 Authentication System** with SIWE (Sign-In With Ethereum)
- **Connect Wallet Modal** with 3-tab interface (Browser/Mobile/Passkey)
- **Guest Sidebar Navigation** for unauthenticated users
- **Watch Address** functionality for read-only mode
- **Server-side SIWE endpoints** with security measures
- **Session management** with httpOnly cookies
- **Chain allowlist** (Mainnet + Sepolia)
- **Guest mode** with right-aligned banner

### 🚧 **Recently Fixed**
- **wagmi connector "already connected" error** by disabling shimDisconnect
- **Dashboard ReferenceError** by replacing mock auth with real SIWE auth
- **Environment configuration** for alpha.orennadao.com deployment
- **Auth hook conflicts** causing variable initialization errors
- **Development port** changed to 3001 for consistency
- **Sepolia testnet only** configuration (removed mainnet)

## 🏗️ **Architecture Overview**

### **Frontend Stack**
```
Next.js 14 (App Router)
├── wagmi 2.x + viem (Web3 connection)
├── React Query (State management)
├── SIWE (Authentication)
├── Radix UI (Components)
└── Tailwind CSS (Styling)
```

### **Backend Stack**
```
Fastify API
├── SIWE verification
├── JWT sessions
├── Prisma ORM
└── PostgreSQL
```

## 📁 **Key Files Structure**

### **Authentication System**
```
apps/web/src/
├── hooks/
│   ├── use-siwe-auth.ts          # Main SIWE authentication hook
│   ├── use-auth.ts               # Compatibility layer - re-exports SIWE auth
│   └── use-mock-auth.ts          # Renamed mock auth hook (not used)
├── components/auth/
│   ├── connect-wallet-modal.tsx  # 3-tab wallet connection modal
│   ├── wallet-connect-button.tsx # Updated to use new modal system
│   └── protected-route.tsx       # Guest access wrapper
├── lib/
│   └── web3-config.ts            # wagmi configuration with security
└── providers/
    ├── web3-provider.tsx         # wagmi + QueryClient wrapper
    └── app-providers.tsx         # Main provider stack
```

### **Server Authentication**
```
apps/api/src/routes/
└── auth.ts                       # SIWE endpoints with security measures
```

## 🔧 **Configuration Details**

### **Environment Variables Required**
```bash
# Frontend (.env.local) - Development
NEXT_PUBLIC_API_URL=https://orenna-backend-production.up.railway.app
NEXT_PUBLIC_SIWE_DOMAIN=localhost:3001
NEXT_PUBLIC_SIWE_ORIGIN=http://localhost:3001
NODE_ENV=development
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Frontend (.env.alpha) - Alpha Deployment  
NEXT_PUBLIC_API_URL=https://orenna-backend-production.up.railway.app
NEXT_PUBLIC_SIWE_DOMAIN=alpha.orennadao.com
NEXT_PUBLIC_SIWE_ORIGIN=https://alpha.orennadao.com
NODE_ENV=production

# Backend (.env)
SIWE_DOMAIN=alpha.orennadao.com
SIWE_ORIGIN=https://alpha.orennadao.com
SIWE_SESSION_TTL=86400  # 24 hours
```

### **Chain Configuration**
Currently supports:
- **Sepolia Testnet Only** (chainId: 11155111)

*Note: Mainnet removed for testing phase*

Chain allowlist enforced in:
- `apps/web/src/lib/web3-config.ts`
- `apps/api/src/routes/auth.ts`

## 🔐 **Security Features Implemented**

### **Client-side**
- ✅ Chain allowlist enforcement
- ✅ Domain validation in SIWE statement
- ✅ EIP-6963 wallet discovery
- ✅ Secure session management

### **Server-side**
- ✅ Fresh nonce requirement (<5 minutes)
- ✅ Domain/origin validation
- ✅ Chain allowlist enforcement
- ✅ httpOnly session cookies
- ✅ SIWE signature verification
- ✅ Session rotation and expiry

## 🐛 **Known Issues & Workarounds**

### **✅ RESOLVED: Cross-Origin Authentication Fixed**
```typescript
// Updated backend cookie configuration in apps/api/src/routes/auth.ts
sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax'
```
**Status**: **FIXED - Cross-Origin Cookies Working**  
**Solution Applied**: Backend now uses `sameSite: 'none'` in production for cross-origin support  
**Technical Changes**:
- ✅ **Production cookies**: `sameSite: 'none'` + `secure: true`
- ✅ **Development cookies**: `sameSite: 'lax'` for localhost testing
- ✅ **Applied to all auth endpoints**: nonce, session, verify endpoints
- ✅ **CORS**: Already properly configured and working
- ✅ **API Endpoints**: Pointing to correct backend

**Impact**: Cross-origin authentication now works between different domains

### **✅ RESOLVED: Safari MetaMask Support Enhanced**
**Status**: **FIXED - Enhanced Connector Configuration**  
**Solution Applied**: Added multiple wallet connectors for better browser compatibility  
**Technical Changes**:
- ✅ **MetaMask Connector**: Explicit `metaMask()` connector for Safari compatibility
- ✅ **WalletConnect**: Added with real project ID: `0fd05238eb6163e96234da30acf3e2a3`
- ✅ **Injected Wallet**: Maintained for general browser wallet support
- ✅ **Modal Updates**: Updated filtering to show MetaMask and WalletConnect options
- ✅ **Environment Config**: Set real WalletConnect project ID in both `.env.local` and `.env.alpha`

**Updated connector configuration** (apps/web/src/lib/web3-config.ts):
```typescript
connectors: [
  injected({ shimDisconnect: false }),
  metaMask({ dappMetadata: { name: 'Orenna DAO' } }),
  walletConnect({ 
    projectId: '0fd05238eb6163e96234da30acf3e2a3',
    metadata: { name: 'Orenna DAO', ... }
  })
]
```

**Impact**: Safari users can now connect via MetaMask, WalletConnect provides mobile fallback

### **✅ RESOLVED: ReferenceError - Function Initialization Order**
```
// Original error:
(index):20 ReferenceError: Cannot access 'v' before initialization

// Evolved to show function names:
(index):20 ReferenceError: Cannot access 'checkSession' before initialization
    at useSiweAuth (layout-d1dbd4d5411b7766.js:737:9)
```
**Status**: **FIXED - Function Definition Order Issue**  
**Root Cause**: Temporal dead zone in useSiweAuth hook - `checkSession` referenced before definition  
**Evidence**: 
- ✅ Initial: Variable 'v' before initialization (webpack minified names)
- ✅ After webpack optimization disabling: Function names became visible 
- ✅ Root cause: `useEffect` dependencies referencing `checkSession` before `useCallback` definition
- ✅ **FIXED**: Moved `checkSession` definition before `useEffect` usage (use-siwe-auth.ts:55-83)
**Solution**: Function declaration order corrected + webpack optimization targeting

### **Legacy Auth Hook Usage** 
**Issue**: Some components still using old patterns  
**Status**: Partially resolved with compatibility layer  
**Impact**: Minimal - compatibility layer handles most cases

```bash
# To find files still using legacy auth:
grep -r "useAuth" apps/web/src --exclude-dir=node_modules
```

## 🔄 **Migration Status**

### **Completed Migrations**
- ✅ `WalletConnectButton` → New modal system
- ✅ `GuestSidebar` → Uses new WalletConnectButton
- ✅ Landing page → Routes to `/onboarding`
- ✅ SIWE flow → Redirects to `/dashboard`

### **Pending Migrations**
- 🔄 23+ components still using legacy `useAuth`
- 🔄 Role-based access control implementation
- 🔄 Privy embedded wallet integration
- 🔄 Advanced session management features

## 📋 **Current Status Summary**

### **✅ ALL CRITICAL ISSUES RESOLVED**

### **✅ RESOLVED ISSUES** 
1. **Cross-Origin Authentication** - Backend cookies now use `sameSite: 'none'` for production
2. **Safari MetaMask Support** - Enhanced connector configuration with MetaMask + WalletConnect
3. **WalletConnect Project ID** - Real project ID configured: `0fd05238eb6163e96234da30acf3e2a3`
4. **ReferenceError in Production** - Function initialization order fixed
5. **API Endpoint Configuration** - Pointing to correct backend
6. **Webpack Bundling Issues** - Optimization conflicts resolved

### **🔧 COMPLETED ACTIONS**
| Issue | Owner | Action Completed | Status |
|-------|-------|-----------------|--------|
| Cross-Origin Auth | Backend | Changed `sameSite: 'strict'` → `'none'` in production | ✅ **FIXED** |
| Safari MetaMask | Frontend | Added MetaMask + WalletConnect connectors | ✅ **FIXED** |
| WalletConnect Project ID | DevOps | Set real project ID: `0fd05238eb6163e96234da30acf3e2a3` | ✅ **FIXED** |

## 🚨 **Critical Development Notes**

### **Connector Configuration**
```typescript
// ✅ FIXED - Prevents stale connection state
injected({ shimDisconnect: false })

// ❌ BROKEN - Causes "already connected" errors
injected({ shimDisconnect: true })

// ❌ BROKEN - Causes undefined array errors
injected({ shimDisconnect: true, target: 'metaMask' })
```

### **Provider Setup**
```typescript
// ✅ CORRECT - Separate QueryClient for wagmi
<WagmiProvider config={config}>
  <QueryClientProvider client={wagmiQueryClient}>
    {children}
  </QueryClientProvider>
</WagmiProvider>
```

### **SIWE Flow**
```typescript
// ✅ Complete flow
1. GET /auth/siwe/nonce
2. Sign SIWE message with wallet
3. POST /auth/siwe/verify
4. Redirect based on user status (new → onboarding, existing → dashboard)
```

## 🔧 **Development Commands**

### **Testing**
```bash
# Frontend development (port 3001)
npx pnpm --filter @orenna/web dev

# Frontend build test
npx pnpm --filter @orenna/web build

# Backend development  
npx pnpm --filter @orenna/api dev

# Full stack development
npx pnpm dev:all
```

### **Database**
```bash
# Generate Prisma client
pnpm --filter @orenna/db prisma:generate

# Run migrations
pnpm --filter @orenna/db prisma:migrate
```

## 🐞 **Debugging Tips**

### **Wallet Connection Issues**
1. Check browser console for wagmi errors
2. Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set
3. Ensure Web3Provider wraps the component
4. Test with simple injected wallet first

### **SIWE Authentication Issues**
1. Check `/auth/siwe/nonce` endpoint response
2. Verify domain/origin in SIWE message matches config
3. Check session cookies are being set
4. Verify JWT secret is configured

### **Component Errors**
```typescript
// If component crashes with "useAccount is not defined"
// Ensure it's wrapped with Web3Provider:

function MyComponent() {
  const { address } = useAccount(); // ❌ Will fail outside provider
}

// Fix:
<Web3Provider>
  <MyComponent />
</Web3Provider>
```

## 📋 **Next Priority Tasks**

### **High Priority**
1. **Complete Legacy Auth Migration** - Update remaining 23 components to use `useSiweAuth`
2. **Role Assignment System** - Implement role-based access control
3. **Production Environment Setup** - Configure for production deployment
4. **Enhanced Error Handling** - Better user feedback for auth failures

### **Medium Priority**
1. **Privy Integration** - Complete embedded wallet setup
2. **Session Refresh** - Implement silent re-authentication
3. **Analytics Events** - Track wallet connection metrics
4. **Advanced Security** - Add rate limiting, additional validations

### **Low Priority**
1. **UI Polish** - Improve modal animations and loading states
2. **Documentation** - Complete API documentation
3. **Testing** - Add comprehensive test suite
4. **Performance** - Optimize bundle size and loading

## 🆘 **Getting Help**

### **Common Error Patterns**
```bash
# Undefined reading 'length' - wagmi connector issue
# Solution: Check connector configuration in web3-config.ts

# Modal doesn't open - Provider issue  
# Solution: Ensure Web3Provider wraps component

# SIWE verification fails - Domain mismatch
# Solution: Check SIWE_DOMAIN matches request domain
```

### **Useful Debug Commands**
```bash
# Check wagmi config
console.log(wagmiConfig.connectors)

# Check SIWE session
fetch('/api/auth/session', { credentials: 'include' })

# Test wallet connection
window.ethereum.request({ method: 'eth_accounts' })
```

---

**Need immediate help?** Check recent commits for context and solutions to similar issues.