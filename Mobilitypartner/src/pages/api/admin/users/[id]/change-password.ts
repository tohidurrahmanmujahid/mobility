import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { auditLog } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = authenticateUser(req);

  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  const { id } = req.query;
  const userId = parseInt(id as string);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Lösenordet måste vara minst 6 tecken långt' });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent modification of super admin by non-super admins
    if (targetUser.isSuperAdmin) {
      // Get requesting user's data
      const requestingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { isSuperAdmin: true }
      });

      if (!requestingUser?.isSuperAdmin) {
        return res.status(403).json({
          message: 'Endast Super Admin kan ändra lösenord för andra Super Admins'
        });
      }
    }

    // Get requesting user's full data
    const requestingUserData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isSuperAdmin: true }
    });

    // Non-super admins can only change password for admins they created
    if (!requestingUserData?.isSuperAdmin && targetUser.createdById !== user.id) {
      return res.status(403).json({
        message: 'Du kan bara ändra lösenord för administratörer som du själv har skapat'
      });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    // Audit log: password changed
    await auditLog({
      action: 'UPDATE',
      entity: 'user',
      entityId: userId,
      user: { id: user.id },
      before: { password: '***' },
      after: { password: 'changed' },
      req,
    });

    res.status(200).json({ message: 'Lösenord uppdaterat' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
}
