Here's a comprehensive guide for deploying your Next.js dApp to Vercel:

## Pre-Deployment Preparation

**Clean up your repository:**
- Remove any `.env.local` files from version control (add to `.gitignore`)
- Ensure your `package.json` has correct dependencies and build scripts
- Test your build locally with `npm run build` to catch issues early
- Make sure your repo is pushed to GitHub, GitLab, or Bitbucket

**Environment variables:**
- Identify all environment variables your dApp needs
- Separate client-side variables (prefixed with `NEXT_PUBLIC_`) from server-side ones
- Prepare your production values (API keys, contract addresses, RPC URLs, etc.)

## Step-by-Step Deployment

**1. Connect your repository:**
- Go to [vercel.com](https://vercel.com) and sign in
- Click "New Project" 
- Import your repository from your Git provider
- Vercel will auto-detect it's a Next.js project

**2. Configure project settings:**
- **Framework Preset:** Should auto-select "Next.js"
- **Root Directory:** Leave as `.` unless your Next.js app is in a subdirectory
- **Build Command:** Usually auto-detected as `npm run build`
- **Output Directory:** Leave as default (Next.js handles this)

**3. Set environment variables:**
- In the deployment configuration, add all your environment variables
- For client-side variables, ensure they start with `NEXT_PUBLIC_`
- Common dApp variables include:
  ```
  NEXT_PUBLIC_CHAIN_ID=1
  NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
  NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
  DATABASE_URL=postgresql://... (server-side only)
  ```

**4. Deploy:**
- Click "Deploy" and wait for the build to complete
- Vercel will provide you with a deployment URL

## Post-Deployment Configuration

**Custom domain (optional):**
- Go to your project dashboard → Settings → Domains
- Add your custom domain and configure DNS

**Performance optimizations:**
- Enable Edge Functions if using API routes that can benefit
- Configure caching headers for static assets
- Use Vercel's built-in analytics to monitor performance

## dApp-Specific Tips & Tricks

**Web3 considerations:**
- Always use `NEXT_PUBLIC_` prefix for wallet connection settings, chain IDs, and contract addresses
- Test wallet connections work properly on the deployed site
- Ensure your RPC URLs are production-ready (not localhost)

**Common gotchas:**
- **Node.js polyfills:** Modern browsers don't include Node.js polyfills. If you get errors about `Buffer`, `crypto`, or `stream`, add this to your `next.config.js`:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    webpack: (config) => {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
      return config;
    },
  };
  ```

**Environment-specific builds:**
- Use Vercel's branch deployments for testing
- Set up different environment variables for preview vs production deployments
- Consider using different contract addresses for staging vs production

**Security best practices:**
- Never commit private keys or sensitive credentials
- Use Vercel's encrypted environment variables
- Implement proper CORS settings if your dApp makes external API calls
- Consider rate limiting for API routes

**Performance tips:**
- Use Next.js Image optimization for better loading
- Implement proper loading states for blockchain interactions
- Consider using Vercel's Edge Runtime for faster API responses
- Enable gzip compression (enabled by default on Vercel)

**Debugging deployment issues:**
- Check the build logs in Vercel dashboard for errors
- Use `vercel dev` locally to simulate the Vercel environment
- Verify all dependencies are in `package.json` (not just `devDependencies`)

Your dApp should now be live! The great thing about Vercel is that it automatically redeploys when you push to your main branch, making updates seamless.

---

## Current Status: ✅ Ready for Deployment

**Completed Pre-deployment Steps:**
- ✅ Repository structure reviewed and deployment requirements identified
- ✅ Environment variables configuration checked and cleaned up
- ✅ Local build tested successfully (production build passes)
- ✅ Build errors resolved (moved problematic test pages to prevent SSR issues)
- ✅ Next.js configuration reviewed (Web3 polyfills already configured)

**Environment Variables Required for Vercel:**

The following environment variables need to be configured in Vercel:

### Essential Client-Side Variables (NEXT_PUBLIC_*)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# WalletConnect Configuration (required for Web3 functionality)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=0fd05238eb6163e96234da30acf3e2a3

# Optional: Chain configuration if different from defaults
NEXT_PUBLIC_DEFAULT_CHAIN_ID=1
```

### Build Configuration
```bash
# Ensure production builds
NODE_ENV=production

# TypeScript strict mode (already configured in next.config.mjs)
NEXT_TYPESCRIPT_STRICT=false
```

**Next Steps:**
1. Get WalletConnect Project ID from https://cloud.walletconnect.com/
2. Set up your API backend URL (or use localhost for testing)
3. Deploy to Vercel with above environment variables
4. Test wallet connections on deployed site
5. Configure custom domain (optional)

**Ready to Deploy!** ✨