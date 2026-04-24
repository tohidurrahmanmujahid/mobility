import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { requirePermission } from '@/utils/permissions';

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

  if (req.method === 'GET') {
    try {
      const { status, warrantyNumber, registrationNumber, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      // Build warranty filter conditions
      const warrantyConditions: any = {};

      if (warrantyNumber) {
        warrantyConditions.warrantyNumber = {
          contains: warrantyNumber as string,
          mode: 'insensitive'
        };
      }

      if (registrationNumber) {
        warrantyConditions.vehicleRegistrationNumber = {
          contains: registrationNumber as string,
          mode: 'insensitive'
        };
      }

      // Add warranty filter if any conditions exist
      if (Object.keys(warrantyConditions).length > 0) {
        where.warranty = warrantyConditions;
      }

      const [claims, total] = await Promise.all([
        prisma.claim.findMany({
          where,
          select: {
            id: true,
            customerDescription: true,
            internalNotes: true,
            status: true,
            workshopInvoiceUrl: true,
            costAmount: true,
            // Customer contact information
            customerFirstname: true,
            customerLastname: true,
            customerPhone: true,
            customerEmail: true,
            customerPersonnummer: true,
            customerAddress: true,
            customerPostnummer: true,
            customerOrt: true,
            // Vehicle info at time of claim
            mileage: true,
            skadedatum: true,
            // File attachments
            meterReadingImage: true,
            descriptionFiles: true,
            // Timestamps
            createdAt: true,
            updatedAt: true,
            // Relations
            warranty: {
              select: {
                id: true,
                warrantyNumber: true,
                vehicleRegistrationNumber: true,
                ownerName: true,
                ownerEmail: true,
                ownerPhone: true,
                vehicleData: true,
                dealer: {
                  select: {
                    companyName: true
                  }
                },
                product: {
                  select: {
                    name: true
                  }
                }
              }
            },
            processedBy: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: offset,
          take: limitNum
        }),
        prisma.claim.count({ where })
      ]);

      res.status(200).json({
        claims,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      console.error('Error fetching claims:', error);
      res.status(500).json({ message: 'Failed to fetch claims' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}