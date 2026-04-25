import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole, Permission } from '@prisma/client';
import { authenticateUser } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/utils/permissions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userInfo = authenticateUser(req);
  if (!userInfo) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse pagination and filter parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const skip = (page - 1) * limit;

    // Build base where clause
    const baseWhere: any = {
      isDeleted: false
    };

    // Add search conditions
    if (search) {
      baseWhere.OR = [
        { vehicleRegistrationNumber: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { vehicleData: { path: ['vin'], string_contains: search } }
      ];
    }

    // Add status filter
    if (status) {
      baseWhere.status = status;
    }

    let warranties;
    let total;

    // Check user type and fetch warranties accordingly
    if (userInfo.userType === 'USER' && userInfo.role === 'ADMIN') {
      // Admin user - check permissions
      const currentUser = await prisma.user.findUnique({
        where: { id: userInfo.id },
        include: {
          permissions: {
            select: {
              permission: true
            }
          }
        }
      });

      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userPermissions = {
        isSuperAdmin: currentUser.isSuperAdmin,
        permissions: currentUser.permissions
      };

      if (!hasPermission(userPermissions, Permission.REGISTERED_PRODUCTS)) {
        return res.status(403).json({
          message: 'Du saknar behörighet att visa garantier. Kontakta din administratör för att få tillgång till denna funktion.'
        });
      }

      // Admin with permission can see all warranties
      [warranties, total] = await Promise.all([
        prisma.warranty.findMany({
          where: baseWhere,
          include: {
            product: true,
            dealer: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.warranty.count({ where: baseWhere })
      ]);

      // Add registeredBy information to each warranty
      warranties = warranties.map(warranty => ({
        ...warranty,
        registeredBy: {
          type: warranty.registeredByType,
          name: warranty.registeredByName,
          email: warranty.registeredByEmail
        }
      }));
    } else if (userInfo.userType === 'DEALER' || userInfo.userType === 'DEALER_STAFF') {
      // Dealer or dealer staff - can only see their own dealer's warranties
      if (!userInfo.dealerId) {
        return res.status(403).json({ message: 'User not associated with a dealer' });
      }

      // Add dealerId filter to base where
      baseWhere.dealerId = userInfo.dealerId;

      [warranties, total] = await Promise.all([
        prisma.warranty.findMany({
          where: baseWhere,
          include: {
            product: true,
            dealer: true
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.warranty.count({ where: baseWhere })
      ]);

      // Add registeredBy information to each warranty
      warranties = warranties.map(warranty => ({
        ...warranty,
        registeredBy: {
          type: warranty.registeredByType,
          name: warranty.registeredByName,
          email: warranty.registeredByEmail
        }
      }));
    } else {
      return res.status(403).json({ message: 'Invalid user type' });
    }

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      warranties,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });
  } catch (error) {
    console.error('Error fetching warranties:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}