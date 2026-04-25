import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { hashPassword, authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { handleApiError, validateMethod, validateRequiredFields } from '@/lib/api-helpers';
import { sendSMS } from '@/lib/sms';
import { sendAdminWelcomeEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!validateMethod(req, res, ['POST'])) {
    return;
  }

  // Authenticate the requesting user
  const requestingUser = authenticateUser(req);
  if (!requestingUser || !requireRole(UserRole.ADMIN, requestingUser)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  try {
    const { name, email, password, phone, permissions, isSuperAdmin } = req.body;

    validateRequiredFields(req.body, ['name', 'email', 'password']);

    // Get requesting user's full data with permissions
    const requestingUserData = await prisma.user.findUnique({
      where: { id: requestingUser.id },
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

    // Validate that non-super admins can only assign permissions they have
    if (!requestingUserData.isSuperAdmin) {
      const requestingUserPermissions = requestingUserData.permissions.map(p => p.permission);
      const invalidPermissions = (permissions || []).filter(
        (perm: Permission) => !requestingUserPermissions.includes(perm)
      );

      if (invalidPermissions.length > 0) {
        return res.status(403).json({
          message: 'Du kan inte tilldela behörigheter som du inte själv har'
        });
      }

      // Non-super admins cannot create super admins
      if (isSuperAdmin) {
        return res.status(403).json({
          message: 'Endast Super Admin kan skapa nya Super Admins'
        });
      }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Create admin user with permissions
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        name,
        phone: phone || null,
        isActive: true,
        isSuperAdmin: isSuperAdmin || false,
        createdById: requestingUser.id,
        permissions: {
          create: Array.isArray(permissions)
            ? permissions.map((perm: Permission) => ({ permission: perm }))
            : []
        }
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

    // Audit log: admin user created
    await auditLog({
      action: 'CREATE',
      entity: 'user',
      entityId: admin.id,
      user: { id: requestingUser.id, name: requestingUserData.name ?? undefined, email: requestingUserData.email },
      after: { name: admin.name, email: admin.email, phone: admin.phone, role: admin.role, isSuperAdmin: admin.isSuperAdmin, permissions: admin.permissions.map(p => p.permission) },
      req,
    });

    // Send welcome email with credentials
    try {
      await sendAdminWelcomeEmail(email, name, password);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    // Send welcome SMS (without password since user created it themselves)
    if (phone) {
      try {
        const message = `Välkommen ${name}! Ditt admin-konto har skapats för Mobility Partner. Email: ${email}`;
        await sendSMS({ to: phone, message });
      } catch (smsError) {
        console.error('Failed to send welcome SMS:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    res.status(201).json({
      message: 'Admin registered successfully',
      admin
    });

  } catch (error) {
    handleApiError(error, res);
  }
}