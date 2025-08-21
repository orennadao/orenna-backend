'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'payment' | 'indexer' | 'welcome' | 'error' | 'subscribed' | 'unsubscribed' | 'pong';
  event?: string;
  data?: any;
  timestamp: string;
  id?: string;
  message?: string;
  channel?: string;
}

export interface PaymentEvent {
  paymentId: string;
  status: string;
  paymentType: string;
  amount: string;
  chainId: number;
  txHash?: string;
  projectId: number;
}

export interface IndexerEvent {
  eventId: string;
  eventName: string;
  contractAddress: string;
  chainId: number;
  blockNumber: number;
  processed: boolean;
  error?: string;
}

interface UseWebSocketOptions {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
}

export function useWebSocket({
  url,
  reconnectAttempts = 5,
  reconnectInterval = 5000,
  onConnect,
  onDisconnect,
  onError,
  onMessage
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Don't initialize WebSocket during SSG/SSR
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    // EMERGENCY: Completely disable WebSocket connections to stop error storm
    console.log('[WebSocket] Connections disabled to prevent error storm');
    return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', url);
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        
        // Re-subscribe to previous subscriptions
        subscriptionsRef.current.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });

        onConnect?.();
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        
        onDisconnect?.();

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${reconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        const errorMessage = 'WebSocket connection error';
        setError(errorMessage);
        setIsConnecting(false);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err, event.data);
        }
      };

    } catch (err) {
      console.error('[WebSocket] Failed to create connection:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
    }
  }, [url, reconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage, isConnecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    subscriptionsRef.current.add(channel);
    sendMessage({ type: 'subscribe', channel });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel);
    sendMessage({ type: 'unsubscribe', channel });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectAttemptsRef.current = 0;
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, sendMessage]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
    reconnect
  };
}