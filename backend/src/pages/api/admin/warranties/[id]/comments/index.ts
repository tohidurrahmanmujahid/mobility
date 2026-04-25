import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/Auth';
import { auditLog } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const adminInfo = verifyToken(token);
    if (!adminInfo) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { id } = req.query;
    const warrantyId = parseInt(id as string, 10);

    if (isNaN(warrantyId)) {
      return res.status(400).json({ message: 'Invalid warranty ID' });
    }

    if (req.method === 'GET') {
      // Get all comments for this warranty
      const comments = await prisma.warrantyComment.findMany({
        where: {
          warrantyId
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json({ comments });

    } else if (req.method === 'POST') {
      // Add a new comment
      const { comment } = req.body;

      if (!comment || typeof comment !== 'string' || comment.trim() === '') {
        return res.status(400).json({ message: 'Comment is required' });
      }

      // Verify warranty exists
      const warranty = await prisma.warranty.findUnique({
        where: { id: warrantyId }
      });

      if (!warranty) {
        return res.status(404).json({ message: 'Warranty not found' });
      }

      // Create the comment
      const newComment = await prisma.warrantyComment.create({
        data: {
          comment: comment.trim(),
          warrantyId,
          adminId: adminInfo.id
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      await auditLog({
        action: 'CREATE',
        entity: 'warranty_comment',
        entityId: newComment.id,
        user: { id: adminInfo.id, name: adminInfo.name, email: adminInfo.email },
        after: newComment,
        req,
      });

      return res.status(201).json({
        message: 'Comment added successfully',
        comment: newComment
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling warranty comments:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
