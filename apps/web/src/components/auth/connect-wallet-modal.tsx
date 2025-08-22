'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
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
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
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
      console.log('🟢 HANDLE CONNECT FUNCTION ENTERED!!!');
      console.warn('🟢 HANDLE CONNECT FUNCTION ENTERED!!!');
      console.error('🟢 HANDLE CONNECT FUNCTION ENTERED!!!');
      console.log('🟢 Function parameters:', { connector, isConnecting, isPending, isAuthenticating });
      
      // Prevent simultaneous connection attempts
      if (isConnecting || isPending || isAuthenticating) {
        console.error('🟡 Connection already in progress, ignoring request');
        return;
      }
      
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
      console.error('🔌 CALLING WAGMI CONNECT WITH:', connector.name);
      const result = await connect({ connector });
      console.error('✅ WAGMI CONNECT RESULT:', result);
      
      // Give wagmi time to update isConnected state
      await new Promise(resolve => setTimeout(resolve, 200));
      console.error('⏰ FINISHED WAITING, isConnected:', isConnected);
      
      // Trigger SIWE authentication
      console.error('🚨 CALLING SIGN-IN FUNCTION!!! 🚨');
      const success = await signIn();
      console.error('🚨 SIGN-IN RESULT:', success);
      if (success) {
        onClose();
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
                .filter(connector => 
                  connector.type === 'metaMask' ||
                  connector.id === 'metaMask'
                )
                .map((connector) => {
                  const isConnectorConnected = isConnected && connector.id === 'metaMask';
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
                              timestamp: new Date().toISOString()
                            };
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
                      {connector.name}
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