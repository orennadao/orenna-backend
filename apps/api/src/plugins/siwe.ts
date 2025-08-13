// apps/api/src/plugins/siwe.ts
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { SiweMessage } from 'siwe'
import { randomBytes } from 'crypto'
import { z } from 'zod'

// Validation schemas
const NonceRequestSchema = z.object({})

const VerifyRequestSchema = z.object({
  message: z.string(),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid signature format'),
})

const LogoutRequestSchema = z.object({})

// Types
interface SiwePluginOptions {
  domain: string
  origin: string
  sessionTtl?: number // seconds, default 7 days
}

interface SessionData {
  address: string
  chainId: number
  iat: number
  exp: number
}

// Nonce storage (in production, use Redis)
const nonceStore = new Map<string, { nonce: string; expires: number }>()

// Clean expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of nonceStore.entries()) {
    if (value.expires < now) {
      nonceStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      address: string
      chainId: number
    }
  }
}

async function siwePlugin(
  fastify: FastifyInstance,
  options: SiwePluginOptions
) {
  const { domain, origin, sessionTtl = 7 * 24 * 60 * 60 } = options // 7 days default

  // Helper to generate secure nonce
  function generateNonce(): string {
    return randomBytes(16).toString('base64url')
  }

  // Helper to get client IP
  function getClientIp(request: FastifyRequest): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           request.ip ||
           'unknown'
  }

  // Middleware to verify session and populate req.user
  async function authenticateSession(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const token = await request.jwtVerify<SessionData>()
      
      // Check if session is still valid
      if (token.exp < Math.floor(Date.now() / 1000)) {
        reply.code(401).send({ error: 'Session expired' })
        return
      }

      // Populate user data
      request.user = {
        address: token.address,
        chainId: token.chainId
      }
    } catch (error) {
      reply.code(401).send({ error: 'Invalid or missing session token' })
    }
  }

  // Register JWT plugin for session management
  await fastify.register(import('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  })

  // Route: GET /auth/nonce - Generate nonce for SIWE
  fastify.get('/auth/nonce', {
    schema: {
      description: 'Generate a nonce for SIWE authentication',
      tags: ['Authentication'],
      response: {
        200: {
          type: 'object',
          properties: {
            nonce: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const nonce = generateNonce()
    const clientIp = getClientIp(request)
    const expires = Date.now() + (10 * 60 * 1000) // 10 minutes
    
    // Store nonce with client IP for verification
    nonceStore.set(`${clientIp}:${nonce}`, { nonce, expires })
    
    fastify.log.info({ nonce, clientIp }, 'Generated SIWE nonce')
    
    return { nonce }
  })

  // Route: POST /auth/verify - Verify SIWE signature and create session
  fastify.post('/auth/verify', {
    schema: {
      description: 'Verify SIWE signature and create session',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['message', 'signature'],
        properties: {
          message: { type: 'string' },
          signature: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            address: { type: 'string' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                address: { type: 'string' },
                ensName: { type: 'string', nullable: true },
                createdAt: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { message, signature } = VerifyRequestSchema.parse(request.body)
      const clientIp = getClientIp(request)
      
      // Parse the SIWE message
      const siweMessage = new SiweMessage(message)
      
      // Verify the message is for our domain
      if (siweMessage.domain !== domain) {
        return reply.code(400).send({ error: 'Invalid domain' })
      }
      
      // Verify the origin
      if (siweMessage.uri !== origin) {
        return reply.code(400).send({ error: 'Invalid origin' })
      }
      
      // Check nonce exists and hasn't expired
      const nonceKey = `${clientIp}:${siweMessage.nonce}`
      const storedNonce = nonceStore.get(nonceKey)
      
      if (!storedNonce || storedNonce.expires < Date.now()) {
        return reply.code(400).send({ error: 'Invalid or expired nonce' })
      }
      
      // Verify the signature
      const verificationResult = await siweMessage.verify({ signature })
      
      if (!verificationResult.success) {
        fastify.log.warn({ 
          address: siweMessage.address, 
          error: verificationResult.error 
        }, 'SIWE verification failed')
        return reply.code(400).send({ error: 'Invalid signature' })
      }
      
      // Clean up used nonce
      nonceStore.delete(nonceKey)
      
      // Get or create user in database
      let user = await fastify.prisma.user.findUnique({
        where: { address: siweMessage.address.toLowerCase() }
      })
      
      if (!user) {
        user = await fastify.prisma.user.create({
          data: {
            address: siweMessage.address.toLowerCase()
          }
        })
        fastify.log.info({ address: user.address }, 'Created new user')
      }
      
      // Create session in database
      const sessionToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + (sessionTtl * 1000))
      
      await fastify.prisma.session.create({
        data: {
          id: sessionToken,
          userId: user.id,
          token: sessionToken,
          expiresAt,
          metadata: {
            chainId: siweMessage.chainId,
            issuedAt: siweMessage.issuedAt,
            clientIp
          }
        }
      })
      
      // Create JWT token
      const jwtPayload: SessionData = {
        address: user.address,
        chainId: siweMessage.chainId || 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expiresAt.getTime() / 1000)
      }
      
      const token = await reply.jwtSign(jwtPayload)
      
      fastify.log.info({ 
        address: user.address, 
        chainId: siweMessage.chainId 
      }, 'User authenticated via SIWE')
      
      return {
        success: true,
        address: user.address,
        token,
        user: {
          id: user.id,
          address: user.address,
          ensName: user.ensName,
          createdAt: user.createdAt.toISOString()
        }
      }
      
    } catch (error) {
      fastify.log.error({ error }, 'SIWE verification error')
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request format',
          details: error.errors
        })
      }
      
      return reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // Route: POST /auth/logout - Invalidate session
  fastify.post('/auth/logout', {
    preHandler: authenticateSession,
    schema: {
      description: 'Logout and invalidate session',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify<SessionData>()
      
      // Find and delete the session from database
      await fastify.prisma.session.deleteMany({
        where: {
          user: {
            address: decoded.address
          },
          expiresAt: {
            gt: new Date()
          }
        }
      })
      
      fastify.log.info({ address: decoded.address }, 'User logged out')
      
      return { success: true }
    } catch (error) {
      fastify.log.error({ error }, 'Logout error')
      return reply.code(500).send({ error: 'Logout failed' })
    }
  })

  // Route: GET /auth/profile - Get current user profile
  fastify.get('/auth/profile', {
    preHandler: authenticateSession,
    schema: {
      description: 'Get current user profile',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                address: { type: 'string' },
                ensName: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { address: request.user!.address }
    })
    
    if (!user) {
      return reply.code(404).send({ error: 'User not found' })
    }
    
    return {
      user: {
        id: user.id,
        address: user.address,
        ensName: user.ensName,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    }
  })

  // Decorate fastify with auth helper
  fastify.decorate('authenticate', authenticateSession)
}

export default fp(siwePlugin, {
  name: 'siwe',
  dependencies: ['prisma']
})