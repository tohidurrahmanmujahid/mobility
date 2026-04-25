import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission, ClaimStatus } from '@prisma/client';
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

  // Check for CLAIMS permission
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

    const permissionCheck = requirePermission(userPermissions, Permission.CLAIMS);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }
  }

  const { id } = req.query;
  const claimId = parseInt(id as string);

  if (isNaN(claimId)) {
    return res.status(400).json({ message: 'Invalid claim ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { status, internalNotes } = req.body;

      // At least one field must be provided
      if (status === undefined && internalNotes === undefined) {
        return res.status(400).json({
          message: 'At least one of status or internalNotes must be provided'
        });
      }

      // Validate status if provided
      const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ONGOING', 'APPROVED', 'REJECTED', 'PAID'];
      if (status !== undefined && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }

      // Check if claim exists
      const existingClaim = await prisma.claim.findUnique({
        where: { id: claimId }
      });

      if (!existingClaim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      // Build update data
      const updateData: { status?: ClaimStatus; internalNotes?: string | null; processedById: number } = {
        processedById: user.id
      };

      if (status !== undefined) {
        updateData.status = status as ClaimStatus;
      }

      if (internalNotes !== undefined) {
        updateData.internalNotes = internalNotes || null;
      }

      // Update the claim
      const updatedClaim = await prisma.claim.update({
        where: { id: claimId },
        data: updateData,
        include: {
          warranty: {
            include: {
              dealer: {
                select: { companyName: true }
              },
              product: {
                select: { name: true }
              }
            }
          },
          processedBy: {
            select: { name: true, email: true }
          }
        }
      });

      // Audit log for claim update
      const auditUser = { id: user.id, name: user.name, email: user.email };
      auditLog({ action: 'UPDATE', entity: 'claim', entityId: claimId, user: auditUser, before: { status: existingClaim.status, internalNotes: existingClaim.internalNotes }, after: updateData, req });

      res.status(200).json({
        message: 'Claim status updated successfully',
        claim: updatedClaim
      });
    } catch (error) {
      console.error('Error updating claim status:', error);
      res.status(500).json({ message: 'Failed to update claim status' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if claim exists
      const claim = await prisma.claim.findUnique({
        where: { id: claimId }
      });

      if (!claim) {
        return res.status(404).json({ message: 'Claim not found' });
      }

      // Delete the claim
      await prisma.claim.delete({
        where: { id: claimId }
      });

      // Audit log for claim deletion
      const deleteAuditUser = { id: user.id, name: user.name, email: user.email };
      auditLog({ action: 'DELETE', entity: 'claim', entityId: claimId, user: deleteAuditUser, before: { status: claim.status, warrantyId: claim.warrantyId }, req });

      res.status(200).json({ message: 'Claim deleted successfully' });
    } catch (error) {
      console.error('Error deleting claim:', error);
      res.status(500).json({ message: 'Failed to delete claim' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
