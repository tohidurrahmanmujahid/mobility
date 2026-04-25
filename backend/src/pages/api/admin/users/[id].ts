import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { auditLog } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);

  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  const { id } = req.query;
  const userId = parseInt(id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, email, phone, permissions } = req.body;

      // Prevent self-modification for critical permissions
      if (user.id === userId) {
        return res.status(400).json({
          message: 'Cannot modify your own permissions. Please have another admin update your account.'
        });
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          permissions: true
        }
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent modification of super admin
      if (targetUser.isSuperAdmin) {
        return res.status(403).json({
          message: 'Cannot modify Super Admin account.'
        });
      }

      // Get requesting user's full data with permissions
      const requestingUserData = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          permissions: {
            select: {
              permission: true
            }
          }
        }
      });

      if (!requestingUserData) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Non-super admins can only modify admins they created
      if (!requestingUserData.isSuperAdmin) {
        if (targetUser.createdById !== user.id) {
          return res.status(403).json({
            message: 'Du kan bara redigera administratörer som du själv har skapat'
          });
        }

        // Validate that non-super admins can only assign permissions they have
        if (permissions) {
          const requestingUserPermissions = requestingUserData.permissions.map(p => p.permission);
          const invalidPermissions = (permissions || []).filter(
            (perm: Permission) => !requestingUserPermissions.includes(perm)
          );

          if (invalidPermissions.length > 0) {
            return res.status(403).json({
              message: 'Du kan inte tilldela behörigheter som du inte själv har'
            });
          }
        }
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== targetUser.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          return res.status(409).json({
            message: 'Email address is already in use'
          });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || targetUser.name,
          email: email || targetUser.email,
          phone: phone !== undefined ? (phone || null) : targetUser.phone,
          permissions: permissions ? {
            deleteMany: {}, // Remove all existing permissions
            create: permissions.map((perm: Permission) => ({ permission: perm }))
          } : undefined
        },
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
        }
      });

      // Audit log: user updated
      await auditLog({
        action: 'UPDATE',
        entity: 'user',
        entityId: userId,
        user: { id: user.id },
        before: { name: targetUser.name, email: targetUser.email, phone: targetUser.phone, permissions: targetUser.permissions.map(p => p.permission) },
        after: { name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, permissions: updatedUser.permissions.map(p => p.permission) },
        req,
      });

      res.status(200).json({
        message: 'Admin updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Prevent self-deletion
      if (user.id === userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              warranties: true,
              processedClaims: true
            }
          }
        }
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deletion of super admin
      if (targetUser.isSuperAdmin) {
        return res.status(403).json({
          message: 'Cannot delete Super Admin. This account has special privileges and cannot be removed.'
        });
      }

      // Get requesting user's data
      const requestingUserData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          isSuperAdmin: true
        }
      });

      // Non-super admins can only delete admins they created
      if (!requestingUserData?.isSuperAdmin) {
        if (targetUser.createdById !== user.id) {
          return res.status(403).json({
            message: 'Du kan bara ta bort administratörer som du själv har skapat'
          });
        }
      }

      // Check if user has associated warranties or processed claims
      if (targetUser._count.warranties > 0) {
        return res.status(400).json({
          message: `Cannot delete user with ${targetUser._count.warranties} registered warranties. Please reassign warranties first.`
        });
      }

      if (targetUser._count.processedClaims > 0) {
        return res.status(400).json({
          message: `Cannot delete user with ${targetUser._count.processedClaims} processed claims. Please reassign claims first.`
        });
      }

      // Delete user comments first (due to foreign key constraints)
      await prisma.dealerComment.deleteMany({
        where: { adminId: userId }
      });

      // Delete the user
      await prisma.user.delete({
        where: { id: userId }
      });

      // Audit log: user deleted
      await auditLog({
        action: 'DELETE',
        entity: 'user',
        entityId: userId,
        user: { id: user.id },
        before: { name: targetUser.name, email: targetUser.email },
        req,
      });

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
