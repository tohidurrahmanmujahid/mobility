import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { requirePermission } from '@/utils/permissions';
import { sendWarrantyCancellationEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);

  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  // Check for REGISTERED_PRODUCTS permission
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

    const permissionCheck = requirePermission(userPermissions, Permission.REGISTERED_PRODUCTS);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }
  }

  const { id } = req.query;
  const warrantyId = parseInt(id as string);

  if (isNaN(warrantyId)) {
    return res.status(400).json({ message: 'Invalid warranty ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { ownerEmail, ownerPhone, comment } = req.body;

      // Check if warranty exists
      const warranty = await prisma.warranty.findUnique({
        where: { id: warrantyId }
      });

      if (!warranty) {
        return res.status(404).json({ message: 'Warranty not found' });
      }

      // Prepare update data
      const updateData: { ownerEmail?: string; ownerPhone?: string; comment?: string } = {};

      if (ownerEmail !== undefined) {
        // Basic email validation
        if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }
        updateData.ownerEmail = ownerEmail;
      }

      if (ownerPhone !== undefined) {
        updateData.ownerPhone = ownerPhone;
      }

      if (comment !== undefined) {
        updateData.comment = comment;
      }

      // Update warranty
      const updatedWarranty = await prisma.warranty.update({
        where: { id: warrantyId },
        data: updateData,
        include: {
          dealer: {
            select: {
              companyName: true,
              orgNumber: true
            }
          },
          product: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              claims: true
            }
          }
        }
      });

      // Audit log for warranty update
      const auditUser = { id: user.id, name: user.name, email: user.email };
      auditLog({ action: 'UPDATE', entity: 'warranty', entityId: warrantyId, user: auditUser, before: { ownerEmail: warranty.ownerEmail, ownerPhone: warranty.ownerPhone, comment: warranty.comment }, after: updateData, req });

      res.status(200).json({
        message: 'Warranty updated successfully',
        warranty: updatedWarranty
      });
    } catch (error) {
      console.error('Error updating warranty:', error);
      res.status(500).json({ message: 'Failed to update warranty' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if warranty exists and get full details
      const warranty = await prisma.warranty.findUnique({
        where: { id: warrantyId },
        include: {
          dealer: {
            select: {
              companyName: true,
              contactPerson: true,
              email: true
            }
          },
          product: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              claims: true
            }
          }
        }
      });

      if (!warranty) {
        return res.status(404).json({ message: 'Warranty not found' });
      }

      // Check if warranty has claims
      if (warranty._count.claims > 0) {
        return res.status(400).json({
          message: `Cannot delete warranty with ${warranty._count.claims} associated claims. Please delete claims first.`
        });
      }

      // Prepare warranty data for emails
      const warrantyEmailData = {
        vehicleRegistrationNumber: warranty.vehicleRegistrationNumber,
        vehicleMake: warranty.vehicleData.make,
        vehicleModel: warranty.vehicleData.model,
        productName: warranty.product.name,
        cancellationDate: new Date().toISOString(),
        originalEndDate: warranty.endDate.toISOString(),
        dealerCompanyName: warranty.dealer.companyName,
        ownerName: warranty.ownerName
      };

      // Send email notifications (don't block deletion if emails fail)
      try {
        // Send email to customer
        await sendWarrantyCancellationEmail(
          warranty.ownerEmail,
          warranty.ownerName,
          'customer',
          warrantyEmailData
        );
        console.log(`Warranty cancellation email sent to customer: ${warranty.ownerEmail}`);
      } catch (emailError) {
        console.error('Failed to send email to customer:', emailError);
      }

      try {
        // Send email to dealer
        if (warranty.dealer.email) {
          await sendWarrantyCancellationEmail(
            warranty.dealer.email,
            warranty.dealer.contactPerson || warranty.dealer.companyName,
            'dealer',
            warrantyEmailData
          );
          console.log(`Warranty cancellation email sent to dealer: ${warranty.dealer.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send email to dealer:', emailError);
      }

      // Set warranty status to CANCELLED (instead of soft delete, so it remains visible)
      await prisma.warranty.update({
        where: { id: warrantyId },
        data: {
          status: 'CANCELLED'
        }
      });

      // Audit log for warranty cancellation
      const cancelAuditUser = { id: user.id, name: user.name, email: user.email };
      auditLog({ action: 'UPDATE', entity: 'warranty', entityId: warrantyId, user: cancelAuditUser, before: { status: warranty.status }, after: { status: 'CANCELLED' }, req });

      res.status(200).json({ message: 'Warranty cancelled successfully and notifications sent' });
    } catch (error) {
      console.error('Error deleting warranty:', error);
      res.status(500).json({ message: 'Failed to delete warranty' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
