import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { getEnv } from "../types/env.js";
import { redis } from "../lib/queue-service";

async function securityPlugin(app: FastifyInstance, options: FastifyPluginOptions) {
  const env = getEnv();

  // Rate limiting
  await app.register(rateLimit, {
    max: 100, // requests per minute
    timeWindow: '1 minute',
    errorResponseBuilder: (req, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.ttl}ms`,
        date: Date.now(),
      };
    },
    enableDraftSpec: true,
  });

  // Helmet for security headers including CSP
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-eval'"], // unsafe-eval needed for swagger UI
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        ...(env.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  // Custom security headers
  app.addHook('onSend', async (req, reply, payload) => {
    // Remove server header to hide Fastify version
    reply.header('Server', 'Orenna API');
    
    // Add custom security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Download-Options', 'noopen');
    reply.header('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Prevent caching of sensitive endpoints
    if (req.url.includes('/auth/') || req.url.includes('/api/')) {
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
    }
    
    return payload;
  });

  // Enhanced verification-specific security features
  
  // API Key validation middleware
  app.decorate('requireApiKey', (requiredScopes: string[] = []) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Missing or invalid authorization header' 
        });
      }

      const token = authHeader.substring(7);
      
      // Basic token validation (would be enhanced with proper JWT validation)
      if (token.length < 32) {
        return reply.code(401).send({ 
          error: 'Unauthorized', 
          message: 'Invalid token format' 
        });
      }

      // Extract scopes from token (simplified)
      const tokenScopes = extractTokenScopes(token);
      
      // Check required scopes
      const hasRequiredScopes = requiredScopes.every(scope => tokenScopes.includes(scope));
      if (requiredScopes.length > 0 && !hasRequiredScopes) {
        await logSecurityEvent('scope_violation', request.ip, {
          requiredScopes,
          tokenScopes,
          endpoint: request.url
        });
        
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: `Missing required scopes: ${requiredScopes.filter(s => !tokenScopes.includes(s)).join(', ')}` 
        });
      }

      // Add scopes to request for later use
      (request as any).tokenScopes = tokenScopes;
    };
  });

  // Enhanced rate limiting for verification endpoints
  app.decorate('verificationRateLimit', async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = getClientId(request);
    const endpoint = request.routerPath || request.url;
    
    // Different limits for different verification operations
    let limits = { windowSize: 60000, maxRequests: 10 }; // Default: 10 per minute
    
    if (endpoint.includes('/verify')) {
      limits = { windowSize: 300000, maxRequests: 5 }; // 5 verifications per 5 minutes
    } else if (endpoint.includes('/evidence')) {
      limits = { windowSize: 60000, maxRequests: 20 }; // 20 evidence uploads per minute
    }

    const rateLimitCheck = await checkRateLimit(clientId, endpoint, limits);
    
    if (!rateLimitCheck.allowed) {
      await logSecurityEvent('verification_rate_limit', clientId, {
        endpoint,
        remaining: rateLimitCheck.remaining,
        resetTime: rateLimitCheck.resetTime
      });
      
      reply.header('X-RateLimit-Limit', limits.maxRequests.toString());
      reply.header('X-RateLimit-Remaining', '0');
      reply.header('X-RateLimit-Reset', rateLimitCheck.resetTime.toString());
      
      return reply.code(429).send({
        error: 'Rate limit exceeded',
        message: 'Too many verification requests',
        retryAfter: Math.ceil((rateLimitCheck.resetTime - Date.now()) / 1000)
      });
    }

    reply.header('X-RateLimit-Limit', limits.maxRequests.toString());
    reply.header('X-RateLimit-Remaining', rateLimitCheck.remaining.toString());
    reply.header('X-RateLimit-Reset', rateLimitCheck.resetTime.toString());
  });

  // Verification request validation
  app.decorate('validateVerificationRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const riskScore = analyzeRequestSecurity(request);
    
    if (riskScore > 0.8) {
      await logSecurityEvent('high_risk_verification', getClientId(request), {
        riskScore,
        userAgent: request.headers['user-agent'],
        url: request.url,
        headers: sanitizeHeaders(request.headers)
      });
      
      return reply.code(429).send({
        error: 'Request blocked',
        message: 'Request blocked due to suspicious activity'
      });
    }

    // Check for verification spam patterns
    const spamCheck = await checkVerificationSpam(getClientId(request));
    if (spamCheck.isSpam) {
      await logSecurityEvent('verification_spam', getClientId(request), spamCheck);
      
      return reply.code(429).send({
        error: 'Spam detected',
        message: 'Multiple verification attempts detected'
      });
    }
  });

  // Security metrics endpoint
  app.get('/security/metrics', {
    preHandler: app.requireApiKey(['admin'])
  }, async (request, reply) => {
    const metrics = await getSecurityMetrics();
    return { success: true, metrics };
  });
}

// Helper functions
function extractTokenScopes(token: string): string[] {
  // Simplified scope extraction - in production would decode JWT properly
  if (token.includes('admin')) return ['admin', 'verify', 'read', 'write'];
  if (token.includes('verify')) return ['verify', 'read'];
  return ['read'];
}

function getClientId(request: FastifyRequest): string {
  const ip = request.ip;
  const userAgent = request.headers['user-agent'] || '';
  return Buffer.from(`${ip}:${userAgent}`).toString('base64').substring(0, 32);
}

async function checkRateLimit(
  clientId: string, 
  endpoint: string,
  limits: { windowSize: number; maxRequests: number }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${clientId}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - limits.windowSize;

  try {
    // Remove old entries and count current
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, now);
    pipeline.expire(key, Math.ceil(limits.windowSize / 1000));
    
    const results = await pipeline.exec();
    const currentCount = (results?.[1]?.[1] as number) || 0;

    const allowed = currentCount < limits.maxRequests;
    const remaining = Math.max(0, limits.maxRequests - currentCount - 1);
    const resetTime = now + limits.windowSize;

    return { allowed, remaining, resetTime };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: 0, resetTime: 0 };
  }
}

function analyzeRequestSecurity(request: FastifyRequest): number {
  let riskScore = 0;
  
  const userAgent = request.headers['user-agent'] || '';
  const url = request.url.toLowerCase();
  
  // Check for suspicious user agents
  if (!userAgent || userAgent.length < 10) {
    riskScore += 0.3;
  }
  
  // Check for bot-like behavior
  if (userAgent.includes('bot') || userAgent.includes('crawl') || userAgent.includes('scan')) {
    riskScore += 0.2;
  }
  
  // Check for suspicious URL patterns
  if (url.includes('..') || url.includes('script') || url.includes('eval')) {
    riskScore += 0.5;
  }
  
  // Check for unusual request patterns
  const hasUnusualHeaders = Object.keys(request.headers).some(header => 
    header.toLowerCase().includes('x-') && !['x-forwarded-for', 'x-real-ip'].includes(header.toLowerCase())
  );
  
  if (hasUnusualHeaders) {
    riskScore += 0.1;
  }
  
  return Math.min(riskScore, 1);
}

async function checkVerificationSpam(clientId: string): Promise<{ isSpam: boolean; attempts: number; reason?: string }> {
  try {
    const key = `verification_attempts:${clientId}`;
    const attempts = await redis.incr(key);
    
    if (attempts === 1) {
      await redis.expire(key, 3600); // 1 hour window
    }
    
    // Check for spam patterns
    if (attempts > 10) {
      return { 
        isSpam: true, 
        attempts, 
        reason: 'Too many verification attempts in 1 hour' 
      };
    }
    
    // Check for rapid successive attempts (last 5 minutes)
    const rapidKey = `verification_rapid:${clientId}`;
    const rapidAttempts = await redis.incr(rapidKey);
    
    if (rapidAttempts === 1) {
      await redis.expire(rapidKey, 300); // 5 minutes
    }
    
    if (rapidAttempts > 3) {
      return { 
        isSpam: true, 
        attempts: rapidAttempts, 
        reason: 'Too many verification attempts in 5 minutes' 
      };
    }
    
    return { isSpam: false, attempts };
  } catch (error) {
    console.error('Spam check failed:', error);
    return { isSpam: false, attempts: 0 };
  }
}

async function logSecurityEvent(
  event: string,
  clientId: string,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    clientId,
    details,
    severity
  };

  try {
    await redis.lpush('security_events', JSON.stringify(logEntry));
    await redis.ltrim('security_events', 0, 9999); // Keep last 10k events
    
    console.warn('Security Event:', logEntry);
    
    if (severity === 'critical') {
      console.error('CRITICAL SECURITY ALERT:', logEntry);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.cookie;
  return sanitized;
}

async function getSecurityMetrics(): Promise<{
  rateLimitViolations: number;
  verificationSpamAttempts: number;
  highRiskRequests: number;
  totalSecurityEvents: number;
  recentEvents: any[];
}> {
  try {
    const events = await redis.lrange('security_events', 0, 999);
    const parsedEvents = events.map(event => {
      try {
        return JSON.parse(event);
      } catch {
        return null;
      }
    }).filter(Boolean);

    const rateLimitViolations = parsedEvents.filter(e => e.event.includes('rate_limit')).length;
    const verificationSpamAttempts = parsedEvents.filter(e => e.event === 'verification_spam').length;
    const highRiskRequests = parsedEvents.filter(e => e.event === 'high_risk_verification').length;

    return {
      rateLimitViolations,
      verificationSpamAttempts,
      highRiskRequests,
      totalSecurityEvents: parsedEvents.length,
      recentEvents: parsedEvents.slice(0, 10)
    };
  } catch (error) {
    console.error('Failed to get security metrics:', error);
    return {
      rateLimitViolations: 0,
      verificationSpamAttempts: 0,
      highRiskRequests: 0,
      totalSecurityEvents: 0,
      recentEvents: []
    };
  }
}

export default fp(securityPlugin, {
  name: 'security',
});

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    requireApiKey: (requiredScopes?: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verificationRateLimit: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    validateVerificationRequest: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}