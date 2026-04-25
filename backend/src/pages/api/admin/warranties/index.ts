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

  if (req.method === 'GET') {
    try {
      const { search, dealer, status, dateFrom, dateTo, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {
        isDeleted: false // Exclude soft-deleted warranties
      };

      // Search by registration number or warranty number
      if (search) {
        where.OR = [
          {
            vehicleRegistrationNumber: {
              contains: search as string,
              mode: 'insensitive'
            }
          },
          {
            warrantyNumber: {
              contains: search as string,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Filter by dealer
      if (dealer) {
        where.dealerId = parseInt(dealer as string);
      }

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by date range (createdAt)
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          // Set to end of day
          const toDate = new Date(dateTo as string);
          toDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = toDate;
        }
      }

      const [warranties, total] = await Promise.all([
        prisma.warranty.findMany({
          where,
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
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: offset,
          take: limitNum
        }),
        prisma.warranty.count({ where })
      ]);

      // Add registeredBy information to each warranty
      const warrantiesWithRegisteredBy = warranties.map(warranty => ({
        ...warranty,
        registeredBy: {
          type: warranty.registeredByType,
          name: warranty.registeredByName,
          email: warranty.registeredByEmail
        }
      }));

      res.status(200).json({
        warranties: warrantiesWithRegisteredBy,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      console.error('Error fetching warranties:', error);
      res.status(500).json({ message: 'Failed to fetch warranties' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}