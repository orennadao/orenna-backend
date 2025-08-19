import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

// Common validation schemas
export const commonSchemas = {
  // Ethereum address validation
  ethereumAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  
  // Blockchain transaction hash
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
  
  // Positive integer
  positiveInteger: z.number().int().positive(),
  
  // UUID validation
  uuid: z.string().uuid(),
  
  // Safe string (no XSS characters)
  safeString: z.string().max(1000).refine(
    (val) => !/[<>\"'&]/.test(val),
    "String contains potentially unsafe characters"
  ),
  
  // URL validation
  url: z.string().url().max(2000),
  
  // Pagination parameters
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
};

// XSS prevention utilities
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Input sanitization hook
async function sanitizeRequestHook(req: FastifyRequest, reply: FastifyReply) {
  // Skip sanitization for certain content types
  const contentType = req.headers['content-type'];
  if (contentType?.includes('application/octet-stream') || 
      contentType?.includes('multipart/form-data')) {
    return;
  }
  
  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
}

async function validationPlugin(app: FastifyInstance, options: FastifyPluginOptions) {
  // Add input sanitization hook
  app.addHook('preHandler', sanitizeRequestHook);
  
  // Add validation helper methods
  app.decorate('validateSchema', function(schema: z.ZodSchema, data: any) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join('; ');
        throw app.httpErrors.badRequest(`Validation error: ${errorMessage}`);
      }
      throw error;
    }
  });
  
  app.decorate('validateEthereumAddress', function(address: string) {
    return commonSchemas.ethereumAddress.parse(address);
  });
  
  app.decorate('validateTransactionHash', function(hash: string) {
    return commonSchemas.transactionHash.parse(hash);
  });
}

export default fp(validationPlugin, {
  name: 'validation',
});