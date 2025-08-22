'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useSiweAuth } from '@/hooks/use-siwe-auth';
import { 
  Wallet, 
  Smartphone, 
  QrCode, 
  Mail, 
  Key, 
  Monitor, 
  Eye, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const [activeTab, setActiveTab] = useState('browser');
  const [watchAddress, setWatchAddress] = useState('');
  const [isWatchMode, setIsWatchMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { isConnected, address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { signIn, isAuthenticating, error: authError } = useSiweAuth();
  
  // Clear any auth errors when modal opens
  useEffect(() => {
    if (isOpen && authError) {
      console.error('🚨 CLEARING AUTH ERROR ON MODAL OPEN');
      // The error will be cleared when signIn is called
    }
  }, [isOpen, authError]);

  // Handle wallet connection with proper state management and request deduplication
  const handleConnect = async (connector: any) => {
    try {
      // Add DOM debugging since console isn't working
      const addDebugMessage = (message: string) => {
        if (typeof window !== 'undefined') {
          // Create or find existing debug container
          let container = document.getElementById('debug-container');
          if (!container) {
            container = document.createElement('div');
            container.id = 'debug-container';
            container.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.95);color:white;padding:15px;z-index:9999;font-size:10px;width:500px;max-height:80vh;overflow-y:auto;font-family:monospace;border:1px solid #444;border-radius:8px;';
            document.body.appendChild(container);
            
            // Add a close button
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = 'position:absolute;top:5px;right:5px;background:red;color:white;border:none;width:20px;height:20px;cursor:pointer;border-radius:3px;font-size:12px;';
            closeBtn.onclick = () => container.remove();
            container.appendChild(closeBtn);
            
            // Add a clear button
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = 'Clear';
            clearBtn.style.cssText = 'position:absolute;top:5px;right:30px;background:#333;color:white;border:none;padding:2px 6px;cursor:pointer;border-radius:3px;font-size:10px;';
            clearBtn.onclick = () => {
              const lines = container.querySelectorAll('.debug-line');
              lines.forEach(line => line.remove());
            };
            container.appendChild(clearBtn);
          }
          
          const debugLine = document.createElement('div');
          debugLine.className = 'debug-line';
          debugLine.style.cssText = 'margin-bottom:2px;padding:2px;border-bottom:1px solid #333;word-break:break-word;';
          debugLine.innerHTML = `${new Date().toLocaleTimeString()}: ${message}`;
          container.appendChild(debugLine);
          
          // Keep only last 25 messages (instead of 10)
          const lines = container.querySelectorAll('.debug-line');
          while (lines.length > 25) {
            lines[0].remove();
          }
          
          // Auto-scroll to bottom
          container.scrollTop = container.scrollHeight;
        }
      };
      
      addDebugMessage('🟢 HANDLE CONNECT ENTERED!!!');
      console.log('🟢 HANDLE CONNECT FUNCTION ENTERED!!!');
      console.warn('🟢 HANDLE CONNECT FUNCTION ENTERED!!!');
      console.error('🟢 HANDLE CONNECT FUNCTION ENTERED!!!');
      console.log('🟢 Function parameters:', { connector, isConnecting, isPending, isAuthenticating });
      
      // Prevent simultaneous connection attempts
      if (isConnecting || isPending || isAuthenticating) {
        addDebugMessage('🟡 Connection already in progress, ignoring');
        console.error('🟡 Connection already in progress, ignoring request');
        return;
      }
      
      addDebugMessage('🚨 STARTING CONNECTION PROCESS');
      console.error('🚨 MODAL HANDLE CONNECT CALLED!!! 🚨');
      console.error('Connector details:', {
        name: connector.name,
        id: connector.id,
        type: connector.type,
        ready: connector.ready,
        available: connector.available
      });
      
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && !window.ethereum) {
        console.error('❌ MetaMask not detected in browser');
        // Note: Error will be handled by the catch block when connect fails
        console.error('❌ MetaMask not available, connection will fail');
      }
      
      setIsConnecting(true);
      console.error('🔥 SET IS CONNECTING TO TRUE');
      
      try {
      // Always disconnect first to ensure clean state
      if (isConnected) {
        console.error('🔄 DISCONNECTING EXISTING CONNECTION');
        disconnect();
        // Wait for disconnect to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Connect to the wallet
      addDebugMessage('🔌 CALLING WAGMI CONNECT');
      console.error('🔌 CALLING WAGMI CONNECT WITH:', connector.name);
      
      try {
        // Call connect but don't rely on its return value
        const connectPromise = connect({ connector });
        addDebugMessage('🔄 CONNECT CALLED - WAITING FOR STATE CHANGE');
        
        // Wait for the connect call to complete
        await connectPromise;
        addDebugMessage('✅ CONNECT PROMISE RESOLVED');
        
        // Poll for connection state change with timeout (longer for MetaMask password entry)
        let attempts = 0;
        const maxAttempts = 40; // 20 seconds max to allow password entry
        
        while (attempts < maxAttempts && !isConnected) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
          addDebugMessage(`⏳ Polling attempt ${attempts} - isConnected: ${isConnected}`);
          
          // Force re-render to get latest state
          if (isConnected) {
            break;
          }
        }
        
        addDebugMessage(`🔍 Final state - isConnected: ${isConnected}, attempts: ${attempts}`);
        
        if (!isConnected) {
          addDebugMessage('❌ CONNECTION TIMEOUT - TRYING ALTERNATIVE');
          // Sometimes wagmi state lags, but MetaMask might be connected
          // Check if window.ethereum shows connected accounts
          if (typeof window !== 'undefined' && window.ethereum) {
            try {
              // First check existing accounts
              let accounts = await window.ethereum.request({ method: 'eth_accounts' });
              addDebugMessage(`Existing MetaMask accounts: ${accounts.length > 0 ? accounts[0] : 'none'}`);
              
              // If no accounts, try to request connection
              if (accounts.length === 0) {
                addDebugMessage('🔐 Requesting MetaMask account access...');
                accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                addDebugMessage(`Requested accounts: ${accounts.length > 0 ? accounts[0] : 'none'}`);
              }
              
              if (accounts.length > 0) {
                addDebugMessage('✅ MetaMask has accounts - proceeding');
                // Wait a bit more for wagmi to catch up
                await new Promise(resolve => setTimeout(resolve, 1000));
                addDebugMessage(`Final isConnected after MetaMask: ${isConnected}`);
                
                // If wagmi still doesn't show connected, get chain directly from MetaMask
                if (!isConnected || !chainId) {
                  addDebugMessage('⚠️ Wagmi state incomplete, checking MetaMask directly');
                  try {
                    const mmChainId = await window.ethereum.request({ method: 'eth_chainId' });
                    const chainIdDecimal = parseInt(mmChainId, 16);
                    addDebugMessage(`MetaMask chainId: ${chainIdDecimal} (${mmChainId})`);
                    
                    // Store for later use since wagmi values aren't available
                    (window as any).metaMaskState = {
                      address: accounts[0],
                      chainId: chainIdDecimal,
                      isConnected: true
                    };
                  } catch (chainError) {
                    addDebugMessage('❌ Could not get chain from MetaMask: ' + chainError.message);
                  }
                }
              } else {
                throw new Error('No accounts available after request');
              }
            } catch (ethError) {
              addDebugMessage('❌ MetaMask request failed: ' + ethError.message);
              throw new Error('MetaMask connection denied or failed');
            }
          } else {
            throw new Error('Wallet connection timeout');
          }
        }
        
      } catch (connectError) {
        addDebugMessage('❌ CONNECT FAILED: ' + connectError.message);
        console.error('❌ WAGMI CONNECT ERROR:', connectError);
        throw connectError;
      }
      
      // Check if we're on the correct chain (Sepolia = 11155111)
      const expectedChainId = 11155111; // Sepolia
      
      // Use wagmi chainId if available, otherwise use MetaMask direct
      let currentChainId = chainId;
      let currentAddress = address;
      
      if (!currentChainId && (window as any).metaMaskState) {
        currentChainId = (window as any).metaMaskState.chainId;
        currentAddress = (window as any).metaMaskState.address;
        addDebugMessage(`Using MetaMask state: chain=${currentChainId}, addr=${currentAddress?.slice(0,8)}`);
      }
      
      if (currentChainId !== expectedChainId) {
        addDebugMessage(`❌ Wrong chain: ${currentChainId}, need: ${expectedChainId}`);
        addDebugMessage('🔄 Requesting chain switch to Sepolia...');
        
        try {
          // Try wagmi switchChain first, fallback to direct MetaMask
          if (switchChain && chainId) {
            addDebugMessage('🔄 Using wagmi switchChain...');
            await switchChain({ chainId: expectedChainId });
          } else {
            addDebugMessage('🔄 Using direct MetaMask switch...');
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }], // Sepolia in hex
            });
          }
          
          // Wait for chain switch and check result
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Re-check chain after switch
          const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const newChainIdDecimal = parseInt(newChainId, 16);
          addDebugMessage(`Chain after switch: ${newChainIdDecimal} (wagmi: ${chainId})`);
          
          // Update stored state
          if ((window as any).metaMaskState) {
            (window as any).metaMaskState.chainId = newChainIdDecimal;
          }
          
          if (newChainIdDecimal !== expectedChainId) {
            throw new Error('Chain switch failed - still on wrong network');
          }
          
        } catch (switchError) {
          addDebugMessage('❌ Chain switch failed: ' + switchError.message);
          throw new Error('Please switch to Sepolia testnet in MetaMask');
        }
      }
      
      // Trigger SIWE authentication
      addDebugMessage('🚨 CALLING SIWE SIGN-IN');
      
      // Debug state before SIWE (use MetaMask fallback if wagmi unavailable)
      const finalAddress = address || currentAddress;
      const finalChainId = chainId || currentChainId;
      const finalConnected = isConnected || !!(window as any).metaMaskState?.isConnected;
      
      addDebugMessage(`Pre-SIWE state: addr=${finalAddress?.slice(0,8)}, chain=${finalChainId}, connected=${finalConnected}`);
      addDebugMessage(`Wagmi vs MetaMask: wagmi(${chainId}) mm(${(window as any).metaMaskState?.chainId})`);
      
      console.error('🚨 CALLING SIGN-IN FUNCTION!!! 🚨');
      console.error('Final state for SIWE:', { address: finalAddress, chainId: finalChainId, isConnected: finalConnected });
      
      try {
        // Add manual debugging of SIWE steps since internal logs may not be showing
        addDebugMessage('📡 Step 1: Getting nonce from server...');
        
        // Manually test nonce endpoint
        try {
          const nonceResponse = await fetch('https://orenna-backend-production.up.railway.app/api/auth/siwe/nonce', {
            method: 'GET',
            credentials: 'include',
          });
          addDebugMessage(`Nonce response: ${nonceResponse.status} ${nonceResponse.statusText}`);
          
          if (nonceResponse.ok) {
            const nonceData = await nonceResponse.json();
            addDebugMessage(`Nonce received: ${nonceData.nonce?.slice(0, 8)}...`);
          } else {
            addDebugMessage(`❌ Nonce failed: ${nonceResponse.status}`);
          }
        } catch (nonceError) {
          addDebugMessage(`❌ Nonce error: ${nonceError.message}`);
        }
        
        // Now call the actual signIn
        addDebugMessage('🔐 Step 2: Calling signIn function...');
        const success = await signIn();
        addDebugMessage('🚨 SIWE RESULT: ' + success);
        console.error('🚨 SIGN-IN RESULT:', success);
        if (success) {
          addDebugMessage('✅ SIWE SUCCESS - SHOULD REDIRECT');
          // Don't close modal immediately, let SIWE handle redirect
          // onClose();
        } else {
          addDebugMessage('❌ SIWE FAILED - NO SUCCESS');
        }
      } catch (siweError) {
        addDebugMessage('❌ SIWE ERROR: ' + siweError.message);
        console.error('❌ SIWE ERROR:', siweError);
        throw siweError;
      }
    } catch (error: any) {
      console.error('Connection failed:', error);
      
      // Special handling for "already connected" errors
      if (error?.message?.includes('already connected') || error?.message?.includes('Connector already connected')) {
        console.log('Connector already connected, attempting SIWE directly...');
        try {
          const success = await signIn();
          if (success) {
            onClose();
          }
        } catch (siweError) {
          console.error('Direct SIWE failed:', siweError);
        }
      }
      } finally {
        setIsConnecting(false);
      }
    } catch (outerError) {
      addDebugMessage('🚨 OUTER ERROR: ' + outerError.message);
      console.error('🚨 OUTER CATCH - HANDLE CONNECT ERROR:', outerError);
      console.error('🚨 OUTER CATCH - ERROR STACK:', outerError.stack);
      setIsConnecting(false);
    }
  };

  const handleWatchAddress = () => {
    if (!watchAddress.trim()) return;
    
    // Set watch mode with the address
    setIsWatchMode(true);
    // TODO: Implement watch-only mode
    console.log('Watch address:', watchAddress);
    onClose();
  };

  const error = connectError || authError;
  
  // Debug logging for modal render and connectors
  console.log('MODAL COMPONENT RENDERING - isOpen:', isOpen);
  if (isOpen) {
    console.log('🚨 MODAL IS OPEN AND RENDERING!!! 🚨');
    console.warn('🚨 MODAL IS OPEN AND RENDERING!!! 🚨');
    console.error('🚨 MODAL IS OPEN AND RENDERING!!! 🚨');
  }
  
  console.log('🔍 AVAILABLE CONNECTORS:', connectors.map(c => ({
    name: c.name,
    id: c.id,
    type: c.type,
    ready: c.ready,
    available: c.available
  })));
  
  // Debug logging for error state
  if (error) {
    console.error('🚨 MODAL ERROR STATE:', {
      connectError: connectError?.message,
      authError: authError?.message,
      finalError: error.message
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect to Orenna DAO
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browser" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Browser
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="passkey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Browser Wallets Tab */}
          <TabsContent value="browser" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Connect using a browser wallet extension
            </div>
            
            <div className="space-y-2">
              {connectors
                .filter((connector, index, array) => {
                  // Only show one injected connector to avoid duplicates
                  const injectedConnectors = array.filter(c => c.type === 'injected');
                  if (connector.type === 'injected' && injectedConnectors.length > 1) {
                    // Keep only the first injected connector
                    return array.findIndex(c => c.type === 'injected') === index;
                  }
                  return connector.type === 'injected';
                })
                .map((connector) => {
                  const isConnectorConnected = isConnected && (
                    connector.id === 'metaMask' || 
                    connector.type === 'injected'
                  );
                  const isDisabled = isPending || isAuthenticating || isConnecting;
                  
                  console.error('🔍 RENDERING BUTTON FOR:', connector.name, {
                    isDisabled,
                    isPending,
                    isAuthenticating,
                    isConnecting,
                    isConnectorConnected
                  });
                  
                  return (
                    <Button
                      key={connector.id}
                      variant={isConnectorConnected ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={(e) => {
                        try {
                          console.log('🚨🚨🚨 BUTTON CLICK DETECTED!!! 🚨🚨🚨');
                          console.warn('🚨🚨🚨 BUTTON CLICK DETECTED!!! 🚨🚨🚨');
                          console.info('🚨🚨🚨 BUTTON CLICK DETECTED!!! 🚨🚨🚨');
                          console.error('🚨🚨🚨 BUTTON CLICK DETECTED!!! 🚨🚨🚨');
                          
                          // Try different ways to output to see if console is filtered
                          if (typeof window !== 'undefined') {
                            (window as any).debugInfo = {
                              connector: connector.name,
                              isPending,
                              isAuthenticating, 
                              isConnecting,
                              timestamp: new Date().toISOString(),
                              logs: []
                            };
                            
                            // Test if console methods work at all
                            try {
                              console.log('TESTING CONSOLE LOG');
                              (window as any).debugInfo.logs.push('console.log attempted');
                            } catch (e) {
                              (window as any).debugInfo.logs.push('console.log failed: ' + e.message);
                            }
                            
                            // Add to DOM as visual debugging
                            const debugDiv = document.createElement('div');
                            debugDiv.id = 'debug-output';
                            debugDiv.style.cssText = 'position:fixed;top:0;right:0;background:red;color:white;padding:10px;z-index:9999;max-width:300px;';
                            debugDiv.innerHTML = `
                              <strong>DEBUG:</strong><br>
                              Button clicked: ${connector.name}<br>
                              Time: ${new Date().toLocaleTimeString()}<br>
                              States: P=${isPending}, A=${isAuthenticating}, C=${isConnecting}
                            `;
                            document.body.appendChild(debugDiv);
                            
                            // Remove after 10 seconds
                            setTimeout(() => {
                              const elem = document.getElementById('debug-output');
                              if (elem) elem.remove();
                            }, 10000);
                          }
                          
                          alert(`BUTTON CLICKED FOR: ${connector.name}
States: isPending=${isPending}, isAuth=${isAuthenticating}, isConn=${isConnecting}
Check all console tabs (Console/Network/etc)
Also check window.debugInfo in console`);
                          
                          console.log('Event:', e);
                          console.log('Target:', e.target);
                          console.log('🚨 BUTTON CLICKED FOR:', connector.name, 'Type:', connector.type, 'ID:', connector.id);
                          console.log('🚨 CONNECTOR OBJECT:', connector);
                          console.log('🚨 CURRENT STATE - isPending:', isPending, 'isAuthenticating:', isAuthenticating, 'isConnecting:', isConnecting);
                          console.log('🔥 ABOUT TO CALL HANDLE CONNECT!!!');
                          
                          const result = handleConnect(connector);
                          console.log('🔥 HANDLE CONNECT RETURNED:', result);
                          
                        } catch (error) {
                          console.error('🚨 ERROR IN CLICK HANDLER:', error);
                          console.log('🚨 ERROR IN CLICK HANDLER:', error);
                          alert('ERROR IN CLICK HANDLER: ' + error.message);
                        }
                      }}
                      disabled={isDisabled}
                    >
                      {(isPending || isAuthenticating) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Wallet className="h-4 w-4 mr-2" />
                      {connector.name === 'Injected' ? 'MetaMask' : connector.name}
                      {isConnectorConnected && (
                        <span className="ml-auto text-xs opacity-70">Connected</span>
                      )}
                    </Button>
                  );
                })}
            </div>
          </TabsContent>

          {/* Mobile/QR Tab */}
          <TabsContent value="mobile" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Connect using a mobile wallet or QR code
            </div>
            
            <div className="space-y-2">
              {connectors
                .filter(connector => 
                  connector.type === 'walletConnect' || 
                  connector.name.toLowerCase().includes('coinbase')
                )
                .map((connector) => (
                  <Button
                    key={connector.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      console.error('🚨 MOBILE BUTTON CLICKED FOR:', connector.name);
                      handleConnect(connector);
                    }}
                    disabled={isPending || isAuthenticating || isConnecting}
                  >
                    {isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    <QrCode className="h-4 w-4 mr-2" />
                    {connector.name}
                  </Button>
                ))}
              
              {/* Placeholder for additional mobile options */}
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Mobile wallet options will appear here
              </div>
            </div>
          </TabsContent>

          {/* Passkey/Email Tab */}
          <TabsContent value="passkey" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Connect using email or passkey authentication
            </div>
            
            {/* Placeholder for Privy integration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  disabled
                />
              </div>
              
              <Button 
                className="w-full" 
                disabled
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Sign In with Email (Coming Soon)
              </Button>
              
              <Button 
                className="w-full" 
                disabled
                variant="outline"
              >
                <Key className="h-4 w-4 mr-2" />
                Sign In with Passkey (Coming Soon)
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Watch Address Option */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Watch an Address</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsWatchMode(!isWatchMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Read-only mode
            </Button>
          </div>
          
          {isWatchMode && (
            <div className="space-y-2">
              <Input
                placeholder="0x... or ENS name"
                value={watchAddress}
                onChange={(e) => setWatchAddress(e.target.value)}
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleWatchAddress}
                disabled={!watchAddress.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Watch Address
              </Button>
              <p className="text-xs text-muted-foreground">
                View public data without connecting a wallet
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                {error.message || 'Connection failed'}
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {(isPending || isAuthenticating || isConnecting) && (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isConnecting || isPending ? 'Connecting wallet...' : 'Signing in...'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}