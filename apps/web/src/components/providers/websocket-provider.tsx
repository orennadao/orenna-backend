'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useWebSocket, WebSocketMessage, PaymentEvent, IndexerEvent } from '../../hooks/use-websocket';

interface WebSocketContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  reconnect: () => void;
  
  // Event handlers
  onPaymentEvent: (handler: (event: string, data: PaymentEvent) => void) => () => void;
  onIndexerEvent: (handler: (event: string, data: IndexerEvent) => void) => () => void;
  
  // Recent events for debugging
  recentMessages: WebSocketMessage[];
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  wsUrl?: string;
}

export function WebSocketProvider({ children, wsUrl }: WebSocketProviderProps) {
  const [paymentEventHandlers, setPaymentEventHandlers] = useState<Set<(event: string, data: PaymentEvent) => void>>(new Set());
  const [indexerEventHandlers, setIndexerEventHandlers] = useState<Set<(event: string, data: IndexerEvent) => void>>(new Set());
  const [recentMessages, setRecentMessages] = useState<WebSocketMessage[]>([]);

  const url = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/api/ws';

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Add to recent messages (keep last 50)
    setRecentMessages(prev => [message, ...prev].slice(0, 50));

    // Route messages to appropriate handlers
    if (message.type === 'payment' && message.event && message.data) {
      paymentEventHandlers.forEach(handler => {
        try {
          handler(message.event!, message.data);
        } catch (error) {
          console.error('[WebSocket] Error in payment event handler:', error);
        }
      });
    } else if (message.type === 'indexer' && message.event && message.data) {
      indexerEventHandlers.forEach(handler => {
        try {
          handler(message.event!, message.data);
        } catch (error) {
          console.error('[WebSocket] Error in indexer event handler:', error);
        }
      });
    }
  }, [paymentEventHandlers, indexerEventHandlers]);

  const {
    isConnected,
    isConnecting,
    error,
    subscribe,
    unsubscribe,
    reconnect
  } = useWebSocket({
    url,
    onMessage: handleMessage,
    onConnect: () => console.log('[WebSocket] Connected to Orenna real-time updates'),
    onDisconnect: () => console.log('[WebSocket] Disconnected from real-time updates'),
    onError: (error) => console.error('[WebSocket] Connection error:', error)
  });

  const onPaymentEvent = useCallback((handler: (event: string, data: PaymentEvent) => void) => {
    setPaymentEventHandlers(prev => new Set([...prev, handler]));
    
    return () => {
      setPaymentEventHandlers(prev => {
        const newSet = new Set(prev);
        newSet.delete(handler);
        return newSet;
      });
    };
  }, []);

  const onIndexerEvent = useCallback((handler: (event: string, data: IndexerEvent) => void) => {
    setIndexerEventHandlers(prev => new Set([...prev, handler]));
    
    return () => {
      setIndexerEventHandlers(prev => {
        const newSet = new Set(prev);
        newSet.delete(handler);
        return newSet;
      });
    };
  }, []);

  const contextValue: WebSocketContextValue = {
    isConnected,
    isConnecting,
    error,
    subscribe,
    unsubscribe,
    reconnect,
    onPaymentEvent,
    onIndexerEvent,
    recentMessages
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

// Convenience hooks for specific event types
export function usePaymentEvents() {
  const { onPaymentEvent } = useWebSocketContext();
  
  return React.useMemo(() => ({
    onPaymentInitiated: (handler: (data: PaymentEvent) => void) => 
      onPaymentEvent((event, data) => {
        if (event === 'payment_initiated') handler(data);
      }),
    onPaymentConfirmed: (handler: (data: PaymentEvent) => void) => 
      onPaymentEvent((event, data) => {
        if (event === 'payment_confirmed') handler(data);
      }),
    onPaymentFailed: (handler: (data: PaymentEvent) => void) => 
      onPaymentEvent((event, data) => {
        if (event === 'payment_failed') handler(data);
      }),
    onProceedsNotified: (handler: (data: PaymentEvent) => void) => 
      onPaymentEvent((event, data) => {
        if (event === 'proceeds_notified') handler(data);
      }),
    onProceedsConfirmed: (handler: (data: PaymentEvent) => void) => 
      onPaymentEvent((event, data) => {
        if (event === 'proceeds_confirmed') handler(data);
      }),
    onUnitsPurchased: (handler: (data: PaymentEvent) => void) => 
      onPaymentEvent((event, data) => {
        if (event === 'units_purchased') handler(data);
      })
  }), [onPaymentEvent]);
}

export function useIndexerEvents() {
  const { onIndexerEvent } = useWebSocketContext();
  
  return React.useMemo(() => ({
    onEventIndexed: (handler: (data: IndexerEvent) => void) => 
      onIndexerEvent((event, data) => {
        if (event === 'event_indexed') handler(data);
      }),
    onEventProcessed: (handler: (data: IndexerEvent) => void) => 
      onIndexerEvent((event, data) => {
        if (event === 'event_processed') handler(data);
      }),
    onEventError: (handler: (data: IndexerEvent) => void) => 
      onIndexerEvent((event, data) => {
        if (event === 'event_error') handler(data);
      }),
    onProceedsReceived: (handler: (data: IndexerEvent) => void) => 
      onIndexerEvent((event, data) => {
        if (event === 'proceeds_received') handler(data);
      }),
    onUnitsSold: (handler: (data: IndexerEvent) => void) => 
      onIndexerEvent((event, data) => {
        if (event === 'units_sold') handler(data);
      })
  }), [onIndexerEvent]);
}