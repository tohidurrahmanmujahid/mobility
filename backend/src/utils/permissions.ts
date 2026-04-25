import { Permission } from '@prisma/client';

export interface UserPermissions {
  isSuperAdmin: boolean;
  permissions: { permission: string }[];
}

// Map routes to required permissions
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/admin': Permission.DASHBOARD,
  '/admin/dealers': Permission.DEALERS,
  '/admin/dealers/new': Permission.NEW_DEALER,
  '/admin/products': Permission.PRODUCTS,
  '/admin/warranties': Permission.REGISTERED_PRODUCTS,
  '/admin/claims': Permission.CLAIMS,
  '/admin/finance': Permission.FINANCE,
  '/admin/settings': Permission.SETTINGS,
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: UserPermissions | null,
  permission: Permission
): boolean {
  if (!user) return false;

  // Super admin has all permissions
  if (user.isSuperAdmin) return true;

  // Check if user has the specific permission
  return user.permissions.some(p => p.permission === permission);
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(
  user: UserPermissions | null,
  route: string
): boolean {
  if (!user) return false;

  // Super admin can access all routes
  if (user.isSuperAdmin) return true;

  // Find the required permission for this route
  const requiredPermission = ROUTE_PERMISSIONS[route];

  // If no permission required, allow access
  if (!requiredPermission) return true;

  // Check if user has the required permission
  return hasPermission(user, requiredPermission);
}

/**
 * Get all accessible routes for a user
 */
export function getAccessibleRoutes(user: UserPermissions | null): string[] {
  if (!user) return [];

  // Super admin can access all routes
  if (user.isSuperAdmin) {
    return Object.keys(ROUTE_PERMISSIONS);
  }

  // Filter routes based on user permissions
  return Object.entries(ROUTE_PERMISSIONS)
    .filter(([_, permission]) => hasPermission(user, permission))
    .map(([route]) => route);
}

/**
 * Check if user has permission and return error response if not
 * This is a helper for API routes
 */
export function requirePermission(
  user: UserPermissions,
  permission: Permission
): { hasPermission: boolean; errorMessage?: string } {
  // Super admin has all permissions
  if (user.isSuperAdmin) {
    return { hasPermission: true };
  }

  // Check if user has the specific permission
  const permitted = user.permissions.some(p => p.permission === permission);

  if (!permitted) {
    const permissionMessages: Record<Permission, string> = {
      [Permission.DASHBOARD]: 'Du saknar behörighet att visa instrumentpanelen.',
      [Permission.DEALERS]: 'Du saknar behörighet att hantera återförsäljare.',
      [Permission.NEW_DEALER]: 'Du saknar behörighet att skapa nya återförsäljare.',
      [Permission.PRODUCTS]: 'Du saknar behörighet att hantera produkter.',
      [Permission.REGISTERED_PRODUCTS]: 'Du saknar behörighet att hantera registrerade produkter.',
      [Permission.CLAIMS]: 'Du saknar behörighet att hantera skadeärenden.',
      [Permission.FINANCE]: 'Du saknar behörighet att hantera fakturor.',
      [Permission.SETTINGS]: 'Du saknar behörighet att hantera inställningar.',
    };

    return {
      hasPermission: false,
      errorMessage: permissionMessages[permission] || 'Du saknar behörighet för denna åtgärd.'
    };
  }

  return { hasPermission: true };
}
