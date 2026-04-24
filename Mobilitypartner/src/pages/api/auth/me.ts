import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userInfo = authenticateUser(req);
  if (!userInfo) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // This endpoint is only for admin users
    if (userInfo.userType !== 'USER') {
      return res.status(401).json({ message: 'Access denied. Use dealer endpoint.' });
    }

    // Fetch from User table
    const user = await prisma.user.findUnique({
      where: { id: userInfo.id },
      include: {
        permissions: {
          select: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      permissions: user.permissions
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}