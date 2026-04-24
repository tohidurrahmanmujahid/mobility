import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole, hashPassword } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { sendAdminWelcomeSMS } from '@/lib/sms';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';

const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);

  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  // Check for SETTINGS permission
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

    const permissionCheck = requirePermission(userPermissions, Permission.SETTINGS);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }
  }

  if (req.method === 'GET') {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: UserRole.ADMIN
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({ admins });
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ message: 'Failed to fetch admins' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, phone } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          message: 'Name and email are required'
        });
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      // Generate random password
      const generatedPassword = generatePassword();
      const hashedPassword = hashPassword(generatedPassword);

      const admin = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: UserRole.ADMIN,
          name,
          phone,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true
        }
      });

      // Audit log: admin created
      await auditLog({
        action: 'CREATE',
        entity: 'user',
        entityId: admin.id,
        user: { id: user.id },
        after: { name: admin.name, email: admin.email, phone: admin.phone },
        req,
      });

      // TODO: Send welcome email with login credentials
      console.log(`Admin created with email: ${email}, password: ${generatedPassword}`);

      // Send welcome SMS
      if (phone) {
        try {
          await sendAdminWelcomeSMS(phone, name, email, generatedPassword);
        } catch (smsError) {
          console.error('Failed to send welcome SMS:', smsError);
          // Don't fail the request if SMS fails
        }
      }

      res.status(201).json({
        message: 'Admin created successfully',
        admin,
        temporaryPassword: generatedPassword // Remove in production, send via email instead
      });

    } catch (error) {
      console.error('Error creating admin:', error);
      res.status(500).json({ message: 'Failed to create admin' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const adminId = parseInt(id as string);

      if (isNaN(adminId)) {
        return res.status(400).json({ message: 'Invalid admin ID' });
      }

      // Prevent admin from deleting themselves
      if (adminId === user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Check if admin exists
      const admin = await prisma.user.findUnique({
        where: { id: adminId, role: UserRole.ADMIN }
      });

      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      await prisma.user.delete({
        where: { id: adminId }
      });

      // Audit log: admin deleted
      await auditLog({
        action: 'DELETE',
        entity: 'user',
        entityId: adminId,
        user: { id: user.id },
        before: { name: admin.name, email: admin.email },
        req,
      });

      res.status(200).json({ message: 'Admin deleted successfully' });

    } catch (error) {
      console.error('Error deleting admin:', error);
      res.status(500).json({ message: 'Failed to delete admin' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}