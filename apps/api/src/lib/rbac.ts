// apps/api/src/lib/rbac.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FinanceRole, SystemRoleType, RoleChangeType } from '@orenna/db';

// Role permissions configuration
export const ROLE_PERMISSIONS = {
  // Vendor permissions
  VENDOR: {
    canViewOwnInvoices: true,
    canCreateInvoices: true,
    canUploadDocuments: true,
    canViewOwnPayments: true,
    canViewProjectBasicInfo: true,
  },
  
  // Project Manager permissions
  PROJECT_MANAGER: {
    canCreateBudgets: true,
    canCreateContracts: true,
    canVerifyWorkReceipt: true,
    canApproveWithinLimit: true,
    canViewProjectFinance: true,
    canAssignVendorRoles: true,
    canViewAllProjectInvoices: true,
  },
  
  // Finance Reviewer permissions
  FINANCE_REVIEWER: {
    canReviewCompliance: true,
    canValidateDocuments: true,
    canCheckKYC: true,
    canSetGLCoding: true,
    canApproveWithinLimit: true,
    canViewAllProjectFinance: true,
    canManageVendors: true,
  },
  
  // Treasurer permissions
  TREASURER: {
    canReleasePayments: true,
    canManagePaymentRuns: true,
    canConfigureTreasuryRails: true,
    canApproveHighValue: true,
    canViewTreasuryDashboard: true,
    canReconcilePayments: true,
    canViewAllProjects: true,
  },
  
  // DAO Multisig permissions
  DAO_MULTISIG: {
    canApproveHighestValue: true,
    canConfigureApprovalMatrix: true,
    canAssignTreasurerRoles: true,
    canViewAuditTrail: true,
    canOverrideApprovals: true,
  },
  
  // Auditor permissions (read-only)
  AUDITOR: {
    canViewAllProjectsReadOnly: true,
    canViewFullAuditTrail: true,
    canExportReports: true,
    canViewAllPayments: true,
    canViewAllDocuments: true,
  },
  
  // Beneficiary permissions (read-only)
  BENEFICIARY: {
    canViewProjectInfo: true,
    canViewProjectProgress: true,
    canViewVerificationStatus: true,
  }
} as const;

// System role permissions
export const SYSTEM_ROLE_PERMISSIONS = {
  PLATFORM_ADMIN: {
    canManageAllProjects: true,
    canAssignSystemRoles: true,
    canAssignProjectRoles: true,
    canConfigureGlobalSettings: true,
    canViewSystemMetrics: true,
  },
  
  SYSTEM_AUDITOR: {
    canViewAllProjectsReadOnly: true,
    canViewSystemAuditTrail: true,
    canExportSystemReports: true,
  },
  
  TREASURY_MANAGER: {
    canConfigureGlobalTreasury: true,
    canManagePaymentProviders: true,
    canViewTreasuryMetrics: true,
    canConfigurePaymentRails: true,
  }
} as const;

// Cache for role lookups
const roleCache = new Map<string, { roles: FinanceRole[]; systemRoles: SystemRoleType[]; expires: number }>();
const CACHE_DURATION = 300000; // 5 minutes

export interface RoleContext {
  userId: number;
  userAddress: string;
  projectId?: number;
  projectRoles: FinanceRole[];
  systemRoles: SystemRoleType[];
  approvalLimit?: string;
}

export class RBACService {
  constructor(private app: FastifyInstance) {}

  /**
   * Get all roles for a user in a specific project
   */
  async getUserProjectRoles(userId: number, projectId: number): Promise<FinanceRole[]> {
    const cacheKey = `user:${userId}:project:${projectId}`;
    const cached = roleCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.roles;
    }

    const projectRoles = await this.app.prisma.projectRole.findMany({
      where: {
        userId,
        projectId,
        active: true
      },
      select: { role: true }
    });

    const roles = projectRoles.map(pr => pr.role);
    
    // Cache the result
    roleCache.set(cacheKey, {
      roles,
      systemRoles: [],
      expires: Date.now() + CACHE_DURATION
    });

    return roles;
  }

  /**
   * Get all system roles for a user
   */
  async getUserSystemRoles(userId: number): Promise<SystemRoleType[]> {
    const cacheKey = `user:${userId}:system`;
    const cached = roleCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.systemRoles;
    }

    const systemRoles = await this.app.prisma.systemRole.findMany({
      where: {
        userId,
        active: true
      },
      select: { role: true }
    });

    const roles = systemRoles.map(sr => sr.role);
    
    // Cache the result
    roleCache.set(cacheKey, {
      roles: [],
      systemRoles: roles,
      expires: Date.now() + CACHE_DURATION
    });

    return roles;
  }

  /**
   * Get user's approval limit for a project
   */
  async getUserApprovalLimit(userId: number, projectId: number): Promise<string | null> {
    const projectRole = await this.app.prisma.projectRole.findFirst({
      where: {
        userId,
        projectId,
        active: true,
        role: { in: ['PROJECT_MANAGER', 'FINANCE_REVIEWER', 'TREASURER'] }
      },
      select: { approvalLimit: true },
      orderBy: { approvalLimit: 'desc' } // Get highest limit if multiple roles
    });

    return projectRole?.approvalLimit || null;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: number, 
    permission: keyof typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS],
    projectId?: number
  ): Promise<boolean> {
    // Get user's roles
    const [projectRoles, systemRoles] = await Promise.all([
      projectId ? this.getUserProjectRoles(userId, projectId) : Promise.resolve([]),
      this.getUserSystemRoles(userId)
    ]);

    // Check system roles first (they often have broader permissions)
    for (const systemRole of systemRoles) {
      const permissions = SYSTEM_ROLE_PERMISSIONS[systemRole];
      if (permissions && (permissions as any)[permission]) {
        return true;
      }
    }

    // Check project roles
    for (const role of projectRoles) {
      const permissions = ROLE_PERMISSIONS[role];
      if (permissions && (permissions as any)[permission]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user can approve amount for project
   */
  async canApproveAmount(userId: number, projectId: number, amount: string): Promise<boolean> {
    const [projectRoles, approvalLimit] = await Promise.all([
      this.getUserProjectRoles(userId, projectId),
      this.getUserApprovalLimit(userId, projectId)
    ]);

    // Check if user has any approval roles
    const hasApprovalRole = projectRoles.some(role => 
      ['PROJECT_MANAGER', 'FINANCE_REVIEWER', 'TREASURER', 'DAO_MULTISIG'].includes(role)
    );

    if (!hasApprovalRole) {
      return false;
    }

    // If no specific limit set, use role-based defaults
    if (!approvalLimit) {
      // DAO_MULTISIG can approve any amount
      if (projectRoles.includes('DAO_MULTISIG')) {
        return true;
      }
      // Others use approval matrix
      return this.checkApprovalMatrix(userId, projectId, amount);
    }

    // Check against specific approval limit
    return BigInt(amount) <= BigInt(approvalLimit);
  }

  /**
   * Check approval matrix requirements
   */
  async checkApprovalMatrix(userId: number, projectId: number, amount: string): Promise<boolean> {
    const matrix = await this.app.prisma.approvalMatrix.findUnique({
      where: { projectId }
    });

    if (!matrix) {
      // Use default thresholds if no matrix configured
      const amountBigInt = BigInt(amount);
      const userRoles = await this.getUserProjectRoles(userId, projectId);

      if (amountBigInt <= BigInt('1000000')) { // $10k
        return userRoles.some(role => ['PROJECT_MANAGER', 'FINANCE_REVIEWER'].includes(role));
      } else if (amountBigInt <= BigInt('5000000')) { // $50k
        return userRoles.some(role => ['TREASURER'].includes(role));
      } else {
        return userRoles.includes('DAO_MULTISIG');
      }
    }

    // Use configured matrix
    const amountBigInt = BigInt(amount);
    const userRoles = await this.getUserProjectRoles(userId, projectId);

    if (amountBigInt <= BigInt(matrix.tier1MaxAmount)) {
      const requiredRoles = JSON.parse(matrix.tier1RequiredRoles as string) as string[];
      return requiredRoles.some(role => userRoles.includes(role as FinanceRole));
    } else if (amountBigInt <= BigInt(matrix.tier2MaxAmount)) {
      const requiredRoles = JSON.parse(matrix.tier2RequiredRoles as string) as string[];
      return requiredRoles.some(role => userRoles.includes(role as FinanceRole));
    } else if (matrix.tier3RequiresMultisig) {
      return userRoles.includes('DAO_MULTISIG');
    }

    return false;
  }

  /**
   * Assign role to user
   */
  async assignProjectRole(
    targetUserId: number,
    projectId: number,
    role: FinanceRole,
    assignedBy: string,
    approvalLimit?: string,
    notes?: string
  ): Promise<void> {
    await this.app.prisma.$transaction(async (tx) => {
      // Create or update role assignment
      await tx.projectRole.upsert({
        where: {
          userId_projectId_role: {
            userId: targetUserId,
            projectId,
            role
          }
        },
        update: {
          active: true,
          approvalLimit,
          assignedBy,
          assignedAt: new Date(),
          notes,
          revokedBy: null,
          revokedAt: null
        },
        create: {
          userId: targetUserId,
          projectId,
          role,
          assignedBy,
          approvalLimit,
          notes
        }
      });

      // Create audit event
      await tx.roleChangeEvent.create({
        data: {
          targetUserId,
          projectId,
          eventType: 'ROLE_ASSIGNED',
          newRole: role,
          roleType: 'PROJECT',
          performedBy: assignedBy,
          reason: notes
        }
      });
    });

    // Clear cache
    this.clearUserCache(targetUserId, projectId);
  }

  /**
   * Revoke role from user
   */
  async revokeProjectRole(
    targetUserId: number,
    projectId: number,
    role: FinanceRole,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    await this.app.prisma.$transaction(async (tx) => {
      // Deactivate role
      await tx.projectRole.update({
        where: {
          userId_projectId_role: {
            userId: targetUserId,
            projectId,
            role
          }
        },
        data: {
          active: false,
          revokedBy,
          revokedAt: new Date()
        }
      });

      // Create audit event
      await tx.roleChangeEvent.create({
        data: {
          targetUserId,
          projectId,
          eventType: 'ROLE_REVOKED',
          oldRole: role,
          roleType: 'PROJECT',
          performedBy: revokedBy,
          reason
        }
      });
    });

    // Clear cache
    this.clearUserCache(targetUserId, projectId);
  }

  /**
   * Build role context for request
   */
  async buildRoleContext(userId: number, userAddress: string, projectId?: number): Promise<RoleContext> {
    const [projectRoles, systemRoles, approvalLimit] = await Promise.all([
      projectId ? this.getUserProjectRoles(userId, projectId) : Promise.resolve([]),
      this.getUserSystemRoles(userId),
      projectId ? this.getUserApprovalLimit(userId, projectId) : Promise.resolve(null)
    ]);

    return {
      userId,
      userAddress,
      projectId,
      projectRoles,
      systemRoles,
      approvalLimit: approvalLimit || undefined
    };
  }

  /**
   * Clear user cache
   */
  private clearUserCache(userId: number, projectId?: number) {
    const patterns = [
      `user:${userId}:system`,
      projectId ? `user:${userId}:project:${projectId}` : `user:${userId}:project:`
    ];

    for (const [key] of roleCache.entries()) {
      if (patterns.some(pattern => key.startsWith(pattern))) {
        roleCache.delete(key);
      }
    }
  }

  /**
   * Middleware to require specific role
   */
  requireRole(roles: FinanceRole[], options: { projectIdParam?: string } = {}) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const projectId = options.projectIdParam 
        ? parseInt((request.params as any)[options.projectIdParam])
        : undefined;

      if (projectId) {
        const userRoles = await this.getUserProjectRoles(user.userId, projectId);
        const hasRequiredRole = roles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
          return reply.code(403).send({ 
            error: 'Insufficient permissions',
            required: roles,
            userRoles
          });
        }
      }

      // Add role context to request
      request.roleContext = await this.buildRoleContext(
        user.userId, 
        user.address, 
        projectId
      );
    };
  }

  /**
   * Middleware to require specific permission
   */
  requirePermission(permission: keyof typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS], options: { projectIdParam?: string } = {}) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({ error: 'Authentication required' });
      }

      const projectId = options.projectIdParam 
        ? parseInt((request.params as any)[options.projectIdParam])
        : undefined;

      const hasPermission = await this.hasPermission(user.userId, permission, projectId);

      if (!hasPermission) {
        return reply.code(403).send({ 
          error: 'Insufficient permissions',
          required: permission
        });
      }

      // Add role context to request
      request.roleContext = await this.buildRoleContext(
        user.userId, 
        user.address, 
        projectId
      );
    };
  }
}

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    roleContext?: RoleContext;
  }
}

// Export role types for use in other modules
export { FinanceRole, SystemRoleType, RoleChangeType };