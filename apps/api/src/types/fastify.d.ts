import { WebSocketManager } from '../lib/websocket-manager';
// import { RoleContext } from '../lib/rbac'; // Commented out - finance system not implemented

declare module 'fastify' {
  interface FastifyInstance {
    wsManager: WebSocketManager;
  }

  interface FastifyRequest {
    user?: {
      userId: number;
      address: string;
      chainId?: number;
    };
    // roleContext?: RoleContext; // Commented out - finance system not implemented
  }
}