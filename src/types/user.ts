export type UserRole = 'super-admin' | 'commodore' | 'officer' | 'member'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  memberSince: Date
  isActive: boolean
}

export interface RolePermissions {
  role: UserRole
  permissions: {
    // Event Management
    canCreateEvents: boolean
    canEditAllEvents: boolean
    canDeleteAllEvents: boolean
    canApproveEvents: boolean
    
    // Split-Pay Management
    canCreateExpenses: boolean
    canEditAllExpenses: boolean
    canDeleteAllExpenses: boolean
    canSettleExpenses: boolean
    
    // Document Management
    canUploadDocuments: boolean
    canApproveDocuments: boolean
    canDeleteAllDocuments: boolean
    canManageFolders: boolean
    
    // User Management
    canInviteUsers: boolean
    canManageUserRoles: boolean
    canDeactivateUsers: boolean
    
    // System Management
    canModifySettings: boolean
    canViewAnalytics: boolean
    canExportData: boolean
  }
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'super-admin': 4,
  'commodore': 3,
  'officer': 2,
  'member': 1
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions['permissions']> = {
  'super-admin': {
    canCreateEvents: true,
    canEditAllEvents: true,
    canDeleteAllEvents: true,
    canApproveEvents: true,
    canCreateExpenses: true,
    canEditAllExpenses: true,
    canDeleteAllExpenses: true,
    canSettleExpenses: true,
    canUploadDocuments: true,
    canApproveDocuments: true,
    canDeleteAllDocuments: true,
    canManageFolders: true,
    canInviteUsers: true,
    canManageUserRoles: true,
    canDeactivateUsers: true,
    canModifySettings: true,
    canViewAnalytics: true,
    canExportData: true
  },
  'commodore': {
    canCreateEvents: true,
    canEditAllEvents: true,
    canDeleteAllEvents: true,
    canApproveEvents: true,
    canCreateExpenses: true,
    canEditAllExpenses: true,
    canDeleteAllExpenses: false,
    canSettleExpenses: true,
    canUploadDocuments: true,
    canApproveDocuments: true,
    canDeleteAllDocuments: false,
    canManageFolders: true,
    canInviteUsers: true,
    canManageUserRoles: false,
    canDeactivateUsers: false,
    canModifySettings: false,
    canViewAnalytics: true,
    canExportData: true
  },
  'officer': {
    canCreateEvents: true,
    canEditAllEvents: false,
    canDeleteAllEvents: false,
    canApproveEvents: false,
    canCreateExpenses: true,
    canEditAllExpenses: false,
    canDeleteAllExpenses: false,
    canSettleExpenses: true,
    canUploadDocuments: true,
    canApproveDocuments: false,
    canDeleteAllDocuments: false,
    canManageFolders: true, // Fixed: Allow officers to manage folders
    canInviteUsers: true,
    canManageUserRoles: false,
    canDeactivateUsers: false,
    canModifySettings: false,
    canViewAnalytics: false,
    canExportData: false
  },
  'member': {
    canCreateEvents: false,
    canEditAllEvents: false,
    canDeleteAllEvents: false,
    canApproveEvents: false,
    canCreateExpenses: true,
    canEditAllExpenses: false,
    canDeleteAllExpenses: false,
    canSettleExpenses: true,
    canUploadDocuments: true,
    canApproveDocuments: false,
    canDeleteAllDocuments: false,
    canManageFolders: true, // TEMPORARY: Allow members to create folders for testing
    canInviteUsers: false,
    canManageUserRoles: false,
    canDeactivateUsers: false,
    canModifySettings: false,
    canViewAnalytics: false,
    canExportData: false
  }
}

export function hasPermission(userRole: UserRole, permission: keyof RolePermissions['permissions']): boolean {
  return ROLE_PERMISSIONS[userRole][permission]
}

export function canManageUser(userRole: UserRole, targetUserRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetUserRole]
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    'super-admin': 'Super Admin',
    'commodore': 'Commodore',
    'officer': 'Officer',
    'member': 'Member'
  }
  return displayNames[role]
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    'super-admin': 'bg-red-100 text-red-800',
    'commodore': 'bg-purple-100 text-purple-800',
    'officer': 'bg-blue-100 text-blue-800',
    'member': 'bg-gray-100 text-gray-800'
  }
  return colors[role]
}