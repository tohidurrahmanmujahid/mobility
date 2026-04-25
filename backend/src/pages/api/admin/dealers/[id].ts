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

  const { id } = req.query;
  const dealerId = parseInt(id as string);

  if (isNaN(dealerId)) {
    return res.status(400).json({ message: 'Invalid dealer ID' });
  }

  if (req.method === 'GET') {
    try {
      const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          _count: {
            select: {
              warranties: true,
              invoices: true
            }
          }
        }
      });

      if (!dealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      res.status(200).json(dealer);
    } catch (error) {
      console.error('Error fetching dealer:', error);
      res.status(500).json({ message: 'Failed to fetch dealer' });
    }
  } else if (req.method === 'POST' || req.method === 'PUT') {
    // Update dealer information
    try {
      const {
        companyName,
        address,
        postalCode,
        city,
        county,
        contactPerson,
        status,
        email,
        phone
      } = req.body;

      // Check if dealer exists
      const existingDealer = await prisma.dealer.findUnique({
        where: { id: dealerId }
      });

      if (!existingDealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== existingDealer.email) {
        const emailExists = await prisma.dealer.findFirst({
          where: {
            email: email,
            id: { not: dealerId }
          }
        });

        if (emailExists) {
          return res.status(400).json({ message: 'E-postadressen används redan av en annan återförsäljare' });
        }
      }

      // Update dealer
      const updatedDealer = await prisma.dealer.update({
        where: { id: dealerId },
        data: {
          companyName: companyName || existingDealer.companyName,
          address,
          postalCode,
          city,
          county,
          contactPerson,
          status,
          ...(email && { email }),
          ...(phone !== undefined && { phone })
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
            }
          },
          _count: {
            select: {
              warranties: true,
              invoices: true
            }
          }
        }
      });

      await auditLog({
        action: 'UPDATE',
        entity: 'dealer',
        entityId: dealerId,
        user: { id: user.id, name: currentUser?.name ?? undefined, email: currentUser?.email ?? undefined },
        before: { companyName: existingDealer.companyName, address: existingDealer.address, postalCode: existingDealer.postalCode, city: existingDealer.city, county: existingDealer.county, contactPerson: existingDealer.contactPerson, status: existingDealer.status, email: existingDealer.email, phone: existingDealer.phone },
        after: { companyName: updatedDealer.companyName, address: updatedDealer.address, postalCode: updatedDealer.postalCode, city: updatedDealer.city, county: updatedDealer.county, contactPerson: updatedDealer.contactPerson, status: updatedDealer.status, email: updatedDealer.email, phone: updatedDealer.phone },
        req,
      });

      res.status(200).json({
        message: 'Dealer updated successfully',
        dealer: updatedDealer
      });
    } catch (error) {
      console.error('Error updating dealer:', error);
      res.status(500).json({ message: 'Failed to update dealer' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
