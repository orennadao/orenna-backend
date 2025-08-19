import { FastifyReply } from "fastify";

// HTML entity encoding for XSS prevention
export function htmlEncode(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// JSON response sanitizer to prevent XSS
export function sanitizeJsonResponse(data: any): any {
  if (typeof data === 'string') {
    return htmlEncode(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeJsonResponse);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeJsonResponse(value);
    }
    return sanitized;
  }
  
  return data;
}

// Secure response helper
export function secureJsonResponse(reply: FastifyReply, data: any, statusCode: number = 200) {
  const sanitizedData = sanitizeJsonResponse(data);
  
  return reply
    .code(statusCode)
    .header('Content-Type', 'application/json; charset=utf-8')
    .header('X-Content-Type-Options', 'nosniff')
    .send(sanitizedData);
}

// Rate limiting key generator
export function generateRateLimitKey(req: any): string {
  // Use IP + User ID if authenticated, otherwise just IP
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?.id;
  
  return userId ? `${ip}:${userId}` : ip;
}

// CSRF token validation
export function validateCsrfToken(headerToken: string, sessionToken: string): boolean {
  if (!headerToken || !sessionToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== sessionToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ sessionToken.charCodeAt(i);
  }
  
  return result === 0;
}

// SQL injection prevention for raw queries (though Prisma handles this)
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['";\\]/g, '') // Remove dangerous SQL characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments start
    .replace(/\*\//g, '') // Remove SQL block comments end
    .trim();
}

// Path traversal prevention
export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

// Email validation with additional security checks
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Basic format check
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Additional security checks
  if (email.length > 254) return false; // RFC 5321 limit
  if (email.includes('..')) return false; // Consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  
  return true;
}

// URL validation with security checks
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Prevent localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block localhost variations
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)) {
        return false;
      }
      
      // Block private IP ranges
      if (hostname.match(/^10\./) || 
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
          hostname.match(/^192\.168\./)) {
        return false;
      }
    }
    
    return true;
  } catch {
    return false;
  }
}