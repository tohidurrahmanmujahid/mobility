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
      const comments = await prisma.dealerComment.findMany({
        where: { dealerId },
        include: {
          admin: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({ comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Failed to fetch comments' });
    }
  } else if (req.method === 'POST') {
    try {
      const { comment } = req.body;

      if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: 'Comment is required' });
      }

      // Verify dealer exists
      const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId }
      });

      if (!dealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      const newComment = await prisma.dealerComment.create({
        data: {
          comment: comment.trim(),
          dealerId,
          adminId: user.id
        },
        include: {
          admin: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      await auditLog({
        action: 'CREATE',
        entity: 'dealer_comment',
        entityId: newComment.id,
        user: { id: user.id, name: user.name, email: user.email },
        after: newComment,
        req,
      });

      res.status(201).json({
        message: 'Comment added successfully',
        comment: newComment
      });

    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Failed to create comment' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}