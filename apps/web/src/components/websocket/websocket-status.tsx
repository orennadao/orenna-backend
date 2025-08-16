'use client';

import React from 'react';
import { useWebSocketContext } from '../providers/websocket-provider';

export function WebSocketStatus() {
  const { isConnected, isConnecting, error, reconnect } = useWebSocketContext();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Real-time updates connected
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        Connecting to real-time updates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span>Real-time updates disconnected</span>
        <button
          onClick={reconnect}
          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded transition-colors"
        >
          Reconnect
        </button>
      </div>
    );
  }

  return null;
}

interface WebSocketDebugProps {
  maxMessages?: number;
}

export function WebSocketDebug({ maxMessages = 10 }: WebSocketDebugProps) {
  const { recentMessages, isConnected, subscribe, unsubscribe } = useWebSocketContext();
  const [subscribedChannels, setSubscribedChannels] = React.useState<string[]>([]);
  const [newChannel, setNewChannel] = React.useState('');

  const handleSubscribe = () => {
    if (newChannel && !subscribedChannels.includes(newChannel)) {
      subscribe(newChannel);
      setSubscribedChannels(prev => [...prev, newChannel]);
      setNewChannel('');
    }
  };

  const handleUnsubscribe = (channel: string) => {
    unsubscribe(channel);
    setSubscribedChannels(prev => prev.filter(c => c !== channel));
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-h-96 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">WebSocket Debug</h3>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      <div className="mb-3">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            placeholder="Channel to subscribe"
            className="flex-1 px-2 py-1 text-xs border rounded"
          />
          <button
            onClick={handleSubscribe}
            disabled={!isConnected || !newChannel}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Subscribe
          </button>
        </div>
        
        {subscribedChannels.length > 0 && (
          <div className="text-xs">
            <div className="font-medium mb-1">Subscribed channels:</div>
            <div className="flex flex-wrap gap-1">
              {subscribedChannels.map(channel => (
                <span
                  key={channel}
                  className="px-2 py-1 bg-blue-100 rounded cursor-pointer hover:bg-blue-200"
                  onClick={() => handleUnsubscribe(channel)}
                  title="Click to unsubscribe"
                >
                  {channel} ×
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs">
        <div className="font-medium mb-2">Recent messages ({recentMessages.length}):</div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {recentMessages.slice(0, maxMessages).map((message, index) => (
            <div key={`${message.timestamp}-${index}`} className="p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium text-blue-600">
                {message.type}
                {message.event && `: ${message.event}`}
              </div>
              <div className="text-gray-500 text-xs">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
              {message.data && (
                <pre className="mt-1 text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(message.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}