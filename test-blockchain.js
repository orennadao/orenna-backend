#!/usr/bin/env node

/**
 * Simple test to verify that our Sepolia testnet contracts are working
 */

const { createPublicClient, http, getContract, parseAbi } = require('viem');
const { sepolia } = require('viem/chains');

// Contract addresses from our deployment
const CONTRACTS = {
  methodRegistry: '0x04330d8A9153699926Da3f77B700207Dd3260905',
  liftTokens: '0x090A338979273420b3Dc7E69F91f1D1093225C88',
  projectNFT: '0xaE58B8aF0B75976Ff019614316B4Eb866Db611Fc'
};

// Minimal ABIs for testing
const METHOD_REGISTRY_ABI = parseAbi([
  'function getActiveMethodIds() view returns (bytes32[])',
  'function isActive(bytes32 methodId) view returns (bool)'
]);

const LIFT_TOKENS_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)'
]);

const PROJECT_NFT_ABI = parseAbi([
  'function totalProjects() view returns (uint256)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
]);

async function testContracts() {
  console.log('🧪 Testing Sepolia testnet contracts...\n');

  // Create public client
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia-rpc.publicnode.com')
  });

  try {
    // Test 1: Method Registry
    console.log('📋 Testing Method Registry...');
    const methodRegistry = getContract({
      address: CONTRACTS.methodRegistry,
      abi: METHOD_REGISTRY_ABI,
      publicClient
    });

    const activeMethodIds = await methodRegistry.read.getActiveMethodIds();
    console.log(`  ✓ Found ${activeMethodIds.length} active methods`);
    
    if (activeMethodIds.length > 0) {
      const firstMethodActive = await methodRegistry.read.isActive([activeMethodIds[0]]);
      console.log(`  ✓ First method is active: ${firstMethodActive}`);
    }

    // Test 2: Lift Tokens
    console.log('\n🏆 Testing Lift Tokens...');
    const liftTokens = getContract({
      address: CONTRACTS.liftTokens,
      abi: LIFT_TOKENS_ABI,
      publicClient
    });

    const tokenName = await liftTokens.read.name();
    console.log(`  ✓ Token name: ${tokenName}`);
    
    // Check if it supports ERC1155
    const supportsERC1155 = await liftTokens.read.supportsInterface(['0xd9b67a26']);
    console.log(`  ✓ Supports ERC1155: ${supportsERC1155}`);

    // Test 3: Project NFT
    console.log('\n🏗️  Testing Project NFT...');
    const projectNFT = getContract({
      address: CONTRACTS.projectNFT,
      abi: PROJECT_NFT_ABI,
      publicClient
    });

    const nftName = await projectNFT.read.name();
    console.log(`  ✓ NFT name: ${nftName}`);
    
    const totalProjects = await projectNFT.read.totalProjects();
    console.log(`  ✓ Total projects: ${totalProjects}`);

    console.log('\n✅ All tests passed! Testnet contracts are working correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing contracts:', error.message);
    process.exit(1);
  }
}

testContracts();