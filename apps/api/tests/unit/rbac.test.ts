// apps/api/tests/unit/rbac.test.ts
import { describe, test, expect } from 'vitest';
import { ROLE_PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } from '../../src/lib/rbac.js';
import { FinanceRole, SystemRoleType } from '@orenna/db';

describe('RBAC Configuration', () => {
  test('should have permissions defined for all finance roles', () => {
    const financeRoles = Object.values(FinanceRole);
    
    for (const role of financeRoles) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(typeof ROLE_PERMISSIONS[role]).toBe('object');
    }
  });

  test('should have permissions defined for all system roles', () => {
    const systemRoles = Object.values(SystemRoleType);
    
    for (const role of systemRoles) {
      expect(SYSTEM_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(typeof SYSTEM_ROLE_PERMISSIONS[role]).toBe('object');
    }
  });

  test('VENDOR role should have limited permissions', () => {
    const vendorPerms = ROLE_PERMISSIONS.VENDOR;
    
    expect(vendorPerms.canViewOwnInvoices).toBe(true);
    expect(vendorPerms.canCreateInvoices).toBe(true);
    expect(vendorPerms.canUploadDocuments).toBe(true);
    expect(vendorPerms.canViewOwnPayments).toBe(true);
    expect(vendorPerms.canViewProjectBasicInfo).toBe(true);
    
    // Should not have admin permissions
    expect((vendorPerms as any).canApproveWithinLimit).toBeUndefined();
    expect((vendorPerms as any).canReleasePayments).toBeUndefined();
  });

  test('PROJECT_MANAGER role should have management permissions', () => {
    const pmPerms = ROLE_PERMISSIONS.PROJECT_MANAGER;
    
    expect(pmPerms.canCreateBudgets).toBe(true);
    expect(pmPerms.canCreateContracts).toBe(true);
    expect(pmPerms.canVerifyWorkReceipt).toBe(true);
    expect(pmPerms.canApproveWithinLimit).toBe(true);
    expect(pmPerms.canViewProjectFinance).toBe(true);
    expect(pmPerms.canAssignVendorRoles).toBe(true);
    expect(pmPerms.canViewAllProjectInvoices).toBe(true);
  });

  test('TREASURER role should have payment permissions', () => {
    const treasurerPerms = ROLE_PERMISSIONS.TREASURER;
    
    expect(treasurerPerms.canReleasePayments).toBe(true);
    expect(treasurerPerms.canManagePaymentRuns).toBe(true);
    expect(treasurerPerms.canConfigureTreasuryRails).toBe(true);
    expect(treasurerPerms.canApproveHighValue).toBe(true);
    expect(treasurerPerms.canViewTreasuryDashboard).toBe(true);
    expect(treasurerPerms.canReconcilePayments).toBe(true);
    expect(treasurerPerms.canViewAllProjects).toBe(true);
  });

  test('DAO_MULTISIG role should have highest permissions', () => {
    const multisigPerms = ROLE_PERMISSIONS.DAO_MULTISIG;
    
    expect(multisigPerms.canApproveHighestValue).toBe(true);
    expect(multisigPerms.canConfigureApprovalMatrix).toBe(true);
    expect(multisigPerms.canAssignTreasurerRoles).toBe(true);
    expect(multisigPerms.canViewAuditTrail).toBe(true);
    expect(multisigPerms.canOverrideApprovals).toBe(true);
  });

  test('AUDITOR role should be read-only', () => {
    const auditorPerms = ROLE_PERMISSIONS.AUDITOR;
    
    expect(auditorPerms.canViewAllProjectsReadOnly).toBe(true);
    expect(auditorPerms.canViewFullAuditTrail).toBe(true);
    expect(auditorPerms.canExportReports).toBe(true);
    expect(auditorPerms.canViewAllPayments).toBe(true);
    expect(auditorPerms.canViewAllDocuments).toBe(true);
    
    // Should not have write permissions
    expect((auditorPerms as any).canCreateBudgets).toBeUndefined();
    expect((auditorPerms as any).canReleasePayments).toBeUndefined();
    expect((auditorPerms as any).canApproveWithinLimit).toBeUndefined();
  });

  test('PLATFORM_ADMIN should have comprehensive system permissions', () => {
    const adminPerms = SYSTEM_ROLE_PERMISSIONS.PLATFORM_ADMIN;
    
    expect(adminPerms.canManageAllProjects).toBe(true);
    expect(adminPerms.canAssignSystemRoles).toBe(true);
    expect(adminPerms.canAssignProjectRoles).toBe(true);
    expect(adminPerms.canConfigureGlobalSettings).toBe(true);
    expect(adminPerms.canViewSystemMetrics).toBe(true);
  });
});

describe('Role Hierarchies', () => {
  test('should respect approval hierarchy', () => {
    // Test that higher roles have broader permissions
    const vendorPerms = ROLE_PERMISSIONS.VENDOR;
    const pmPerms = ROLE_PERMISSIONS.PROJECT_MANAGER;
    const treasurerPerms = ROLE_PERMISSIONS.TREASURER;
    const multisigPerms = ROLE_PERMISSIONS.DAO_MULTISIG;

    // Vendor has least permissions
    expect(Object.keys(vendorPerms).length).toBeLessThan(Object.keys(pmPerms).length);
    
    // PM has management permissions vendor doesn't
    expect(pmPerms.canCreateBudgets).toBe(true);
    expect((vendorPerms as any).canCreateBudgets).toBeUndefined();
    
    // Treasurer has payment permissions PM doesn't
    expect(treasurerPerms.canReleasePayments).toBe(true);
    expect((pmPerms as any).canReleasePayments).toBeUndefined();
    
    // Multisig has override permissions others don't
    expect(multisigPerms.canOverrideApprovals).toBe(true);
    expect((treasurerPerms as any).canOverrideApprovals).toBeUndefined();
  });
});