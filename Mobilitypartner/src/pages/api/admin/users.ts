import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import { authenticateUser, requireRole } from '@/utils/Auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  // Authenticate the requesting user
  const user = authenticateUser(req);
  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  try {
    // Get current user to check if they're a super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        isSuperAdmin: true
      }
    });

    // Build the where clause based on user role
    const whereClause: any = {
      role: UserRole.ADMIN
    };

    // Non-super admins can only see admins they created
    if (!currentUser?.isSuperAdmin) {
      whereClause.createdById = user.id;
    }

    // Fetch admin users
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        permissions: {
          select: {
            permission: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      message: 'Admin users fetched successfully',
      users
    });

  } catch (error) {
    handleApiError(error, res);
  }
}