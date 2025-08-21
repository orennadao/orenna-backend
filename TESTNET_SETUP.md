# Testnet Setup Documentation

## Overview

The blockchain functionality has been successfully set up and tested on Sepolia testnet. All contracts are deployed and working correctly.

## Deployed Contracts (Sepolia Testnet)

### Contract Addresses
```
Method Registry:    0x04330d8A9153699926Da3f77B700207Dd3260905
Lift Tokens:        0x090A338979273420b3Dc7E69F91f1D1093225C88
Project NFT:        0xaE58B8aF0B75976Ff019614316B4Eb866Db611Fc
Project NFT Impl:   0xCCF205115fc1A84c34AabE6A494912Dc3413AB32

Chain ID:           11155111 (Sepolia)
Deployment Block:   9014909
```

### Deployment Details
- **Network**: Sepolia Testnet
- **Deployer**: 0x2F09521446A080E388Ec7b3d80a198325f85B196
- **Deployment Date**: Successfully deployed
- **VWBA Method ID**: 0x7db8c48924f7b96ac6e5fcc0f594e1eccfcaa250f471fcc121c4a031875419a3

## Environment Configuration

### Web App (.env.local)
```bash
# Sepolia Testnet Contract Addresses
NEXT_PUBLIC_METHOD_REGISTRY_ADDRESS=0x04330d8A9153699926Da3f77B700207Dd3260905
NEXT_PUBLIC_LIFT_TOKENS_ADDRESS=0x090A338979273420b3Dc7E69F91f1D1093225C88
NEXT_PUBLIC_PROJECT_NFT_ADDRESS=0xaE58B8aF0B75976Ff019614316B4Eb866Db611Fc
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_DEFAULT_CHAIN=sepolia
```

### API Server (.env)
```bash
# Blockchain Configuration
DEFAULT_CHAIN_ID=11155111
RPC_URL_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com

# Contract Addresses
METHOD_REGISTRY_ADDRESS=0x04330d8A9153699926Da3f77B700207Dd3260905
LIFT_TOKENS_ADDRESS=0x090A338979273420b3Dc7E69F91f1D1093225C88
PROJECT_NFT_ADDRESS=0xaE58B8aF0B75976Ff019614316B4Eb866Db611Fc
DEPLOYMENT_BLOCK=9014909
```

## Contract Testing Results

### ✅ Tests Passed:

1. **Lift Tokens Contract**: 
   - Contract exists and has code
   - URI function returns: `https://api-testnet.orenna.com/lift-tokens/{id}/metadata`
   - Implements ERC1155 standard

2. **Project NFT Contract**:
   - Contract exists and has code  
   - Total projects: 1 (test project created during deployment)
   - Proxy pattern working correctly

3. **Method Registry Contract**:
   - Contract exists and has code
   - VWBA v2.0 testnet method registered
   - Ready for verification workflows

### Web3 Integration
- ✅ Web app configured for Sepolia testnet
- ✅ Wagmi/Viem setup with Sepolia chain
- ✅ WalletConnect ready (requires project ID)
- ✅ RPC endpoints configured

### API Integration
- ✅ API server running on localhost:3001
- ✅ Contract addresses configured
- ✅ Blockchain indexer ready
- ✅ IPFS integration configured
- ✅ WebSocket support enabled

## Running the Stack

### Start Development Servers
```bash
# Terminal 1: API Server
npm run dev --prefix apps/api

# Terminal 2: Web App  
npm run dev --prefix apps/web
```

### Access Points
- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

## Testing Contract Interactions

### Using Cast (Foundry)
```bash
# Check current block number
cast block-number --rpc-url https://ethereum-sepolia-rpc.publicnode.com

# Get Lift Tokens URI
cast call 0x090A338979273420b3Dc7E69F91f1D1093225C88 "uri(uint256)" 1 --rpc-url https://ethereum-sepolia-rpc.publicnode.com

# Get total projects
cast call 0xaE58B8aF0B75976Ff019614316B4Eb866Db611Fc "totalProjects()" --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

## Next Steps for Production

1. **WalletConnect Setup**: Get real project ID from https://cloud.walletconnect.com/
2. **Mainnet Deployment**: Deploy contracts to Ethereum mainnet when ready
3. **API Domain**: Update testnet API URL from localhost to production domain
4. **Security Audit**: Full security review before mainnet launch
5. **Monitoring**: Set up blockchain event monitoring and alerting

## Troubleshooting

### Common Issues
- **RPC Rate Limits**: Switch to different public RPC or use paid provider
- **Contract Not Found**: Verify contract addresses and network
- **Transaction Failures**: Check gas limits and wallet connection

### Useful Commands
```bash
# Check contract code exists
cast code <CONTRACT_ADDRESS> --rpc-url https://ethereum-sepolia-rpc.publicnode.com

# Get current gas price  
cast gas-price --rpc-url https://ethereum-sepolia-rpc.publicnode.com

# Get account balance
cast balance <ADDRESS> --rpc-url https://ethereum-sepolia-rpc.publicnode.com
```

## Status: ✅ Ready for Testing

The testnet setup is complete and ready for end-to-end testing of:
- Wallet connection flows
- Project creation and management
- Lift token minting and verification
- Payment processing
- Verification workflows

All contracts are deployed, configured, and tested on Sepolia testnet.