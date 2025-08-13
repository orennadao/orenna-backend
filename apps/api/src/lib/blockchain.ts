import { createPublicClient, createWalletClient, http, parseAbi, getContract, Address, Hash } from 'viem';
import { mainnet, sepolia, polygon, arbitrum } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { getEnv } from '../types/env.js';

const env = getEnv();

// Chain configuration
const chains = {
  1: mainnet,
  11155111: sepolia,
  137: polygon,
  42161: arbitrum,
};

// RPC URLs configuration
const rpcUrls = {
  1: env.RPC_URL_MAINNET || 'https://eth.llamarpc.com',
  11155111: env.RPC_URL_SEPOLIA || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  137: env.RPC_URL_POLYGON || 'https://polygon-rpc.com',
  42161: env.RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
};

// Contract ABIs
export const ORNA_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function getVotes(address account) view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
]);

export const LIFT_UNITS_ABI = parseAbi([
  'function uri(uint256 id) view returns (string)',
  'function totalSupply(uint256 id) view returns (uint256)',
  'function maxSupply(uint256 id) view returns (uint256)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function createToken(uint256 id, uint256 cap, string customUri)',
  'function mint(address to, uint256 id, uint256 amount, bytes data)',
  'function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event TokenCreated(uint256 indexed id, uint256 maxSupply, string uri)',
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event URI(string value, uint256 indexed id)',
]);

export class BlockchainService {
  private publicClients: Map<number, any> = new Map();
  private walletClients: Map<number, any> = new Map();

  constructor() {
    // Initialize clients for supported chains
    Object.entries(chains).forEach(([chainId, chain]) => {
      const id = Number(chainId);
      const rpcUrl = rpcUrls[id as keyof typeof rpcUrls];
      
      // Public client for reading
      this.publicClients.set(id, createPublicClient({
        chain,
        transport: http(rpcUrl),
      }));

      // Wallet client for writing (if private key available)
      if (env.MINTER_PRIVATE_KEY) {
        const account = privateKeyToAccount(env.MINTER_PRIVATE_KEY as `0x${string}`);
        this.walletClients.set(id, createWalletClient({
          account,
          chain,
          transport: http(rpcUrl),
        }));
      }
    });
  }

  getPublicClient(chainId: number) {
    const client = this.publicClients.get(chainId);
    if (!client) {
      throw new Error(`No public client configured for chain ${chainId}`);
    }
    return client;
  }

  getWalletClient(chainId: number) {
    const client = this.walletClients.get(chainId);
    if (!client) {
      throw new Error(`No wallet client configured for chain ${chainId}`);
    }
    return client;
  }

  // ORNA Token Methods
  async getOrnaTokenInfo(chainId: number) {
    if (!env.ORNA_TOKEN_ADDRESS) {
      throw new Error('ORNA_TOKEN_ADDRESS not configured');
    }

    const publicClient = this.getPublicClient(chainId);
    const contract = getContract({
      address: env.ORNA_TOKEN_ADDRESS as Address,
      abi: ORNA_ABI,
      client: publicClient,
    });

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.read.name(),
      contract.read.symbol(),
      contract.read.decimals(),
      contract.read.totalSupply(),
    ]);

    return { name, symbol, decimals, totalSupply: totalSupply.toString() };
  }

  async getOrnaBalance(address: Address, chainId: number) {
    if (!env.ORNA_TOKEN_ADDRESS) {
      throw new Error('ORNA_TOKEN_ADDRESS not configured');
    }

    const publicClient = this.getPublicClient(chainId);
    const contract = getContract({
      address: env.ORNA_TOKEN_ADDRESS as Address,
      abi: ORNA_ABI,
      client: publicClient,
    });

    const balance = await contract.read.balanceOf([address]);
    return balance.toString();
  }

  async getOrnaVotingPower(address: Address, chainId: number, blockNumber?: bigint) {
    if (!env.ORNA_TOKEN_ADDRESS) {
      throw new Error('ORNA_TOKEN_ADDRESS not configured');
    }

    const publicClient = this.getPublicClient(chainId);
    const contract = getContract({
      address: env.ORNA_TOKEN_ADDRESS as Address,
      abi: ORNA_ABI,
      client: publicClient,
    });

    const votes = blockNumber 
      ? await contract.read.getPastVotes([address, blockNumber])
      : await contract.read.getVotes([address]);
    
    return votes.toString();
  }

  // Lift Units Methods
  async getLiftUnitInfo(tokenId: string, chainId: number) {
    if (!env.LIFT_UNITS_ADDRESS) {
      throw new Error('LIFT_UNITS_ADDRESS not configured');
    }

    const publicClient = this.getPublicClient(chainId);
    const contract = getContract({
      address: env.LIFT_UNITS_ADDRESS as Address,
      abi: LIFT_UNITS_ABI,
      client: publicClient,
    });

    const [uri, totalSupply, maxSupply] = await Promise.all([
      contract.read.uri([BigInt(tokenId)]).catch(() => ''),
      contract.read.totalSupply([BigInt(tokenId)]).catch(() => 0n),
      contract.read.maxSupply([BigInt(tokenId)]).catch(() => 0n),
    ]);

    return {
      tokenId,
      uri,
      totalSupply: totalSupply.toString(),
      maxSupply: maxSupply.toString(),
    };
  }

  async getLiftUnitBalance(address: Address, tokenId: string, chainId: number) {
    if (!env.LIFT_UNITS_ADDRESS) {
      throw new Error('LIFT_UNITS_ADDRESS not configured');
    }

    const publicClient = this.getPublicClient(chainId);
    const contract = getContract({
      address: env.LIFT_UNITS_ADDRESS as Address,
      abi: LIFT_UNITS_ABI,
      client: publicClient,
    });

    const balance = await contract.read.balanceOf([address, BigInt(tokenId)]);
    return balance.toString();
  }

  async getLiftUnitBalances(address: Address, tokenIds: string[], chainId: number) {
    if (!env.LIFT_UNITS_ADDRESS) {
      throw new Error('LIFT_UNITS_ADDRESS not configured');
    }

    const publicClient = this.getPublicClient(chainId);
    const contract = getContract({
      address: env.LIFT_UNITS_ADDRESS as Address,
      abi: LIFT_UNITS_ABI,
      client: publicClient,
    });

    const addresses = tokenIds.map(() => address);
    const ids = tokenIds.map(id => BigInt(id));
    
    const balances = await contract.read.balanceOfBatch([addresses, ids]);
    return balances.map(b => b.toString());
  }

  // Transaction Methods
  async createLiftUnit(tokenId: string, maxSupply: string, uri: string, chainId: number): Promise<Hash> {
    if (!env.LIFT_UNITS_ADDRESS) {
      throw new Error('LIFT_UNITS_ADDRESS not configured');
    }

    const walletClient = this.getWalletClient(chainId);
    const publicClient = this.getPublicClient(chainId);
    
    const contract = getContract({
      address: env.LIFT_UNITS_ADDRESS as Address,
      abi: LIFT_UNITS_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    const hash = await contract.write.createToken([
      BigInt(tokenId),
      BigInt(maxSupply),
      uri
    ]);

    return hash;
  }

  async mintLiftUnit(
    to: Address, 
    tokenId: string, 
    amount: string, 
    chainId: number,
    data: `0x${string}` = '0x'
  ): Promise<Hash> {
    if (!env.LIFT_UNITS_ADDRESS) {
      throw new Error('LIFT_UNITS_ADDRESS not configured');
    }

    const walletClient = this.getWalletClient(chainId);
    const publicClient = this.getPublicClient(chainId);
    
    const contract = getContract({
      address: env.LIFT_UNITS_ADDRESS as Address,
      abi: LIFT_UNITS_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    const hash = await contract.write.mint([
      to,
      BigInt(tokenId),
      BigInt(amount),
      data
    ]);

    return hash;
  }

  // Utility Methods
  async waitForTransaction(hash: Hash, chainId: number) {
    const publicClient = this.getPublicClient(chainId);
    return await publicClient.waitForTransactionReceipt({ hash });
  }

  async getBlockNumber(chainId: number) {
    const publicClient = this.getPublicClient(chainId);
    return await publicClient.getBlockNumber();
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
