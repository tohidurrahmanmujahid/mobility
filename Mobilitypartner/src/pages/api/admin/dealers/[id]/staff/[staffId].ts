import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);

  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  // Check for DEALERS permission
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      permissions: {
        select: {
          permission: true
        }
      }
    }
  });

  if (currentUser) {
    const userPermissions = {
      isSuperAdmin: currentUser.isSuperAdmin,
      permissions: currentUser.permissions
    };

    const permissionCheck = requirePermission(userPermissions, Permission.DEALERS);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }
  }

  const { id, staffId } = req.query;
  const dealerId = parseInt(id as string);
  const staffUserId = parseInt(staffId as string);

  if (isNaN(dealerId) || isNaN(staffUserId)) {
    return res.status(400).json({ message: 'Invalid dealer ID or staff ID' });
  }

  if (req.method === 'DELETE') {
    try {
      // Check if the staff member exists and belongs to this dealer
      const staffMember = await prisma.dealer.findFirst({
        where: {
          id: staffUserId,
          dealerId: dealerId,
          role: 'STAFF' // Make sure it's a staff member, not an owner
        }
      });

      if (!staffMember) {
        return res.status(404).json({
          message: 'Staff member not found or does not belong to this dealer'
        });
      }

      // Delete the staff member from Dealer table
      await prisma.dealer.delete({
        where: { id: staffUserId }
      });

      await auditLog({
        action: 'DELETE',
        entity: 'dealer_staff',
        entityId: staffUserId,
        user: { id: user.id, name: currentUser?.name ?? undefined, email: currentUser?.email ?? undefined },
        before: { id: staffMember.id, name: staffMember.name, email: staffMember.email, dealerId },
        req,
      });

      res.status(200).json({
        message: 'Staff member removed successfully',
        deletedStaff: {
          id: staffMember.id,
          name: staffMember.name,
          email: staffMember.email
        }
      });
    } catch (error) {
      console.error('Error removing staff member:', error);
      res.status(500).json({ message: 'Failed to remove staff member' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
