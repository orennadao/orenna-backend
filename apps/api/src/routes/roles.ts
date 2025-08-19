// apps/api/src/routes/roles.ts
import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { RBACService, FinanceRole, SystemRoleType } from '../lib/rbac.js';

// Validation schemas
const AssignProjectRoleSchema = z.object({
  targetUserAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid user address'),
  role: z.nativeEnum(FinanceRole),
  approvalLimit: z.string().regex(/^\d+$/, 'Approval limit must be numeric string').optional(),
  notes: z.string().max(500).optional()
});

const RevokeProjectRoleSchema = z.object({
  targetUserAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid user address'),
  role: z.nativeEnum(FinanceRole),
  reason: z.string().max(500).optional()
});

const AssignSystemRoleSchema = z.object({
  targetUserAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid user address'),
  role: z.nativeEnum(SystemRoleType),
  notes: z.string().max(500).optional()
});

const UpdateApprovalMatrixSchema = z.object({
  tier1MaxAmount: z.string().regex(/^\d+$/).optional(),
  tier2MaxAmount: z.string().regex(/^\d+$/).optional(),
  tier3RequiresMultisig: z.boolean().optional(),
  currency: z.string().optional(),
  tier1RequiredRoles: z.array(z.nativeEnum(FinanceRole)).optional(),
  tier2RequiredRoles: z.array(z.nativeEnum(FinanceRole)).optional(),
  tier3RequiredRoles: z.array(z.nativeEnum(FinanceRole)).optional(),
  requiresDualApproval: z.boolean().optional(),
  allowSelfApproval: z.boolean().optional()
});

export default async function rolesRoutes(app: FastifyInstance) {
  const rbacService = new RBACService(app);

  // Get user's roles for a project
  app.get('/projects/:projectId/roles/user/:userAddress', {
    schema: {
      description: 'Get user roles for a project',
      tags: ['Roles'],
      params: {
        type: 'object',
        required: ['projectId', 'userAddress'],
        properties: {
          projectId: { type: 'number' },
          userAddress: { type: 'string' }
        }
      }
    },
    preHandler: rbacService.requirePermission('canViewProjectFinance', { projectIdParam: 'projectId' })
  }, async (request: FastifyRequest, reply) => {
    const { projectId, userAddress } = request.params as { projectId: number; userAddress: string };

    try {
      // Find user by address
      const user = await app.prisma.user.findUnique({
        where: { address: userAddress.toLowerCase() }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Get user's roles
      const [projectRoles, systemRoles, approvalLimit] = await Promise.all([
        rbacService.getUserProjectRoles(user.id, Number(projectId)),
        rbacService.getUserSystemRoles(user.id),
        rbacService.getUserApprovalLimit(user.id, Number(projectId))
      ]);

      return {
        userId: user.id,
        userAddress: user.address,
        projectId: Number(projectId),
        projectRoles,
        systemRoles,
        approvalLimit
      };
    } catch (error) {
      app.log.error({ error, projectId, userAddress }, 'Failed to get user roles');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Assign project role
  app.post('/projects/:projectId/roles/assign', {
    schema: {
      description: 'Assign project role to user',
      tags: ['Roles'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['targetUserAddress', 'role'],
        properties: {
          targetUserAddress: { type: 'string' },
          role: { type: 'string', enum: Object.values(FinanceRole) },
          approvalLimit: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    },
    preHandler: [
      (app as any).authenticate,
      rbacService.requirePermission('canAssignVendorRoles', { projectIdParam: 'projectId' })
    ]
  }, async (request: FastifyRequest, reply) => {
    const { projectId } = request.params as { projectId: number };
    const body = request.body as z.infer<typeof AssignProjectRoleSchema>;

    try {
      // Validate request body
      const validatedBody = AssignProjectRoleSchema.parse(body);
      
      // Find target user by address
      const targetUser = await app.prisma.user.findUnique({
        where: { address: validatedBody.targetUserAddress.toLowerCase() }
      });

      if (!targetUser) {
        return reply.code(404).send({ error: 'Target user not found' });
      }

      // Check if assigner has permission to assign this role
      const assignerContext = request.roleContext!;
      const canAssign = await canAssignRole(assignerContext, validatedBody.role);

      if (!canAssign) {
        return reply.code(403).send({ 
          error: 'Insufficient permissions to assign this role',
          role: validatedBody.role
        });
      }

      // Assign role
      await rbacService.assignProjectRole(
        targetUser.id,
        Number(projectId),
        validatedBody.role,
        assignerContext.userAddress,
        validatedBody.approvalLimit,
        validatedBody.notes
      );

      return {
        success: true,
        message: `Role ${validatedBody.role} assigned to user ${validatedBody.targetUserAddress}`,
        projectId: Number(projectId),
        targetUserId: targetUser.id,
        role: validatedBody.role
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      
      app.log.error({ error, projectId, body }, 'Failed to assign project role');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Revoke project role
  app.post('/projects/:projectId/roles/revoke', {
    schema: {
      description: 'Revoke project role from user',
      tags: ['Roles'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        required: ['targetUserAddress', 'role'],
        properties: {
          targetUserAddress: { type: 'string' },
          role: { type: 'string', enum: Object.values(FinanceRole) },
          reason: { type: 'string' }
        }
      }
    },
    preHandler: [
      (app as any).authenticate,
      rbacService.requirePermission('canAssignVendorRoles', { projectIdParam: 'projectId' })
    ]
  }, async (request: FastifyRequest, reply) => {
    const { projectId } = request.params as { projectId: number };
    const body = request.body as z.infer<typeof RevokeProjectRoleSchema>;

    try {
      // Validate request body
      const validatedBody = RevokeProjectRoleSchema.parse(body);
      
      // Find target user by address
      const targetUser = await app.prisma.user.findUnique({
        where: { address: validatedBody.targetUserAddress.toLowerCase() }
      });

      if (!targetUser) {
        return reply.code(404).send({ error: 'Target user not found' });
      }

      // Check if assigner has permission to revoke this role
      const assignerContext = request.roleContext!;
      const canRevoke = await canAssignRole(assignerContext, validatedBody.role);

      if (!canRevoke) {
        return reply.code(403).send({ 
          error: 'Insufficient permissions to revoke this role',
          role: validatedBody.role
        });
      }

      // Revoke role
      await rbacService.revokeProjectRole(
        targetUser.id,
        Number(projectId),
        validatedBody.role,
        assignerContext.userAddress,
        validatedBody.reason
      );

      return {
        success: true,
        message: `Role ${validatedBody.role} revoked from user ${validatedBody.targetUserAddress}`,
        projectId: Number(projectId),
        targetUserId: targetUser.id,
        role: validatedBody.role
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      
      app.log.error({ error, projectId, body }, 'Failed to revoke project role');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get project approval matrix
  app.get('/projects/:projectId/approval-matrix', {
    schema: {
      description: 'Get project approval matrix configuration',
      tags: ['Roles'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' }
        }
      }
    },
    preHandler: rbacService.requirePermission('canViewProjectFinance', { projectIdParam: 'projectId' })
  }, async (request: FastifyRequest, reply) => {
    const { projectId } = request.params as { projectId: number };

    try {
      const matrix = await app.prisma.approvalMatrix.findUnique({
        where: { projectId: Number(projectId) },
        include: {
          project: {
            select: { id: true, name: true, slug: true }
          }
        }
      });

      if (!matrix) {
        // Return default matrix
        return {
          projectId: Number(projectId),
          tier1MaxAmount: '1000000', // $10,000
          tier2MaxAmount: '5000000', // $50,000
          tier3RequiresMultisig: true,
          currency: 'USD',
          tier1RequiredRoles: ['PROJECT_MANAGER', 'FINANCE_REVIEWER'],
          tier2RequiredRoles: ['PROJECT_MANAGER', 'FINANCE_REVIEWER', 'TREASURER'],
          tier3RequiredRoles: ['PROJECT_MANAGER', 'FINANCE_REVIEWER', 'TREASURER', 'DAO_MULTISIG'],
          requiresDualApproval: false,
          allowSelfApproval: false,
          isDefault: true
        };
      }

      return {
        ...matrix,
        tier1RequiredRoles: JSON.parse(matrix.tier1RequiredRoles as string),
        tier2RequiredRoles: JSON.parse(matrix.tier2RequiredRoles as string),
        tier3RequiredRoles: JSON.parse(matrix.tier3RequiredRoles as string),
        isDefault: false
      };
    } catch (error) {
      app.log.error({ error, projectId }, 'Failed to get approval matrix');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update project approval matrix
  app.put('/projects/:projectId/approval-matrix', {
    schema: {
      description: 'Update project approval matrix configuration',
      tags: ['Roles'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' }
        }
      },
      body: {
        type: 'object',
        properties: {
          tier1MaxAmount: { type: 'string' },
          tier2MaxAmount: { type: 'string' },
          tier3RequiresMultisig: { type: 'boolean' },
          currency: { type: 'string' },
          tier1RequiredRoles: { type: 'array', items: { type: 'string' } },
          tier2RequiredRoles: { type: 'array', items: { type: 'string' } },
          tier3RequiredRoles: { type: 'array', items: { type: 'string' } },
          requiresDualApproval: { type: 'boolean' },
          allowSelfApproval: { type: 'boolean' }
        }
      }
    },
    preHandler: [
      (app as any).authenticate,
      rbacService.requireRole(['DAO_MULTISIG'], { projectIdParam: 'projectId' })
    ]
  }, async (request: FastifyRequest, reply) => {
    const { projectId } = request.params as { projectId: number };
    const body = request.body as z.infer<typeof UpdateApprovalMatrixSchema>;

    try {
      // Validate request body
      const validatedBody = UpdateApprovalMatrixSchema.parse(body);
      const userContext = request.roleContext!;
      
      // Prepare update data
      const updateData: any = {
        updatedBy: userContext.userAddress,
        ...validatedBody
      };

      // Convert role arrays to JSON strings
      if (validatedBody.tier1RequiredRoles) {
        updateData.tier1RequiredRoles = JSON.stringify(validatedBody.tier1RequiredRoles);
      }
      if (validatedBody.tier2RequiredRoles) {
        updateData.tier2RequiredRoles = JSON.stringify(validatedBody.tier2RequiredRoles);
      }
      if (validatedBody.tier3RequiredRoles) {
        updateData.tier3RequiredRoles = JSON.stringify(validatedBody.tier3RequiredRoles);
      }

      // Update or create approval matrix
      const matrix = await app.prisma.approvalMatrix.upsert({
        where: { projectId: Number(projectId) },
        update: updateData,
        create: {
          projectId: Number(projectId),
          createdBy: userContext.userAddress,
          ...updateData
        }
      });

      return {
        success: true,
        message: 'Approval matrix updated successfully',
        matrix: {
          ...matrix,
          tier1RequiredRoles: JSON.parse(matrix.tier1RequiredRoles as string),
          tier2RequiredRoles: JSON.parse(matrix.tier2RequiredRoles as string),
          tier3RequiredRoles: JSON.parse(matrix.tier3RequiredRoles as string)
        }
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      
      app.log.error({ error, projectId, body }, 'Failed to update approval matrix');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get all project roles (admin view)
  app.get('/projects/:projectId/roles', {
    schema: {
      description: 'Get all roles for a project',
      tags: ['Roles'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          active: { type: 'boolean', default: true }
        }
      }
    },
    preHandler: rbacService.requirePermission('canViewProjectFinance', { projectIdParam: 'projectId' })
  }, async (request: FastifyRequest, reply) => {
    const { projectId } = request.params as { projectId: number };
    const { role, active = true } = request.query as { role?: FinanceRole; active?: boolean };

    try {
      const where: any = { projectId: Number(projectId), active };
      if (role) where.role = role;

      const projectRoles = await app.prisma.projectRole.findMany({
        where,
        include: {
          user: {
            select: { id: true, address: true, ensName: true }
          }
        },
        orderBy: [
          { role: 'asc' },
          { assignedAt: 'desc' }
        ]
      });

      return {
        projectId: Number(projectId),
        roles: projectRoles.map(pr => ({
          id: pr.id,
          userId: pr.userId,
          user: pr.user,
          role: pr.role,
          active: pr.active,
          approvalLimit: pr.approvalLimit,
          assignedBy: pr.assignedBy,
          assignedAt: pr.assignedAt,
          notes: pr.notes
        }))
      };
    } catch (error) {
      app.log.error({ error, projectId }, 'Failed to get project roles');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Helper function to check if user can assign a specific role
  async function canAssignRole(assignerContext: any, targetRole: FinanceRole): Promise<boolean> {
    // Platform admins can assign any role
    if (assignerContext.systemRoles.includes('PLATFORM_ADMIN')) {
      return true;
    }

    // DAO multisig can assign most roles
    if (assignerContext.projectRoles.includes('DAO_MULTISIG')) {
      return true;
    }

    // Project managers can assign vendor roles
    if (assignerContext.projectRoles.includes('PROJECT_MANAGER') && targetRole === 'VENDOR') {
      return true;
    }

    // Treasurers can assign vendor and PM roles
    if (assignerContext.projectRoles.includes('TREASURER') && 
        ['VENDOR', 'PROJECT_MANAGER'].includes(targetRole)) {
      return true;
    }

    return false;
  }
}