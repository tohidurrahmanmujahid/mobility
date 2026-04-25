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

  if (req.method === 'GET') {
    try {
      // Get pagination parameters from query
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Get filter parameters from query
      const companyName = req.query.companyName as string;
      const orgNumber = req.query.orgNumber as string;

      // Build where clause for filters
      // Only get OWNER dealers (main dealer accounts), not staff
      const where: any = {
        role: 'OWNER'
      };

      if (companyName) {
        where.companyName = {
          contains: companyName,
          mode: 'insensitive'
        };
      }

      if (orgNumber) {
        where.orgNumber = {
          contains: orgNumber,
          mode: 'insensitive'
        };
      }

      // Get total count for pagination with filters applied
      const totalCount = await prisma.dealer.count({ where });

      const dealers = await prisma.dealer?.findMany({
        where,
        skip,
        take: limit,
        include: {
          staff: {
            where: {
              role: 'STAFF' // Only include staff members, not the owner itself
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true
            }
          },
          warranties: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          },
          comments: {
            include: {
              admin: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          _count: {
            select: {
              warranties: true,
              // invoices: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({
        dealers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching dealers:', error);
      res.status(500).json({ message: 'Failed to fetch dealers' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}