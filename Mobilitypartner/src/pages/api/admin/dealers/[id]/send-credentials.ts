import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole, hashPassword } from '@/utils/Auth';
import { UserRole, Permission, DealerStatus } from '@prisma/client';
import { sendDealerWelcomeEmail } from '@/lib/email';
import { sendDealerWelcomeSMS } from '@/lib/sms';
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

  // Check for NEW_DEALER permission (or appropriate permission)
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

    const permissionCheck = requirePermission(userPermissions, Permission.NEW_DEALER);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const dealerId = parseInt(id as string);

      if (isNaN(dealerId)) {
        return res.status(400).json({ message: 'Invalid dealer ID' });
      }

      // Find the dealer
      const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId }
      });

      if (!dealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      if (!dealer.email) {
        return res.status(400).json({ message: 'Dealer does not have an email address configured' });
      }

      // Check if credentials have already been sent
      if (dealer.credentialsSentAt) {
        return res.status(400).json({
          message: 'Credentials have already been sent to this dealer. If you need to reset the password, please use the password reset function.',
          sentAt: dealer.credentialsSentAt
        });
      }

      // Generate new password
      const newPassword = generatePassword();
      const hashedPassword = hashPassword(newPassword);

      // Update dealer with new password and activate account
      await prisma.dealer.update({
        where: { id: dealerId },
        data: {
          passwordHash: hashedPassword,
          isActive: true,
          status: DealerStatus.ACTIVE,
          credentialsSentAt: new Date()
        }
      });

      // Send welcome email with credentials
      try {
        await sendDealerWelcomeEmail(
          dealer.email,
          dealer.contactPerson || dealer.companyName,
          newPassword,
          dealer.companyName
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Rollback might be needed here, or mark as failed
        return res.status(500).json({
          message: 'Failed to send email. Please try again or contact support.'
        });
      }

      // Send welcome SMS if phone number exists
      if (dealer.phone) {
        try {
          await sendDealerWelcomeSMS(
            dealer.phone,
            dealer.companyName,
            dealer.email,
            newPassword
          );
        } catch (smsError) {
          console.error('Failed to send welcome SMS:', smsError);
          // Don't fail the request if SMS fails, email is more important
        }
      }

      await auditLog({
        action: 'UPDATE',
        entity: 'dealer',
        entityId: dealerId,
        user: { id: user.id, name: currentUser?.name ?? undefined, email: currentUser?.email ?? undefined },
        before: { isActive: dealer.isActive, status: dealer.status, credentialsSentAt: dealer.credentialsSentAt },
        after: { isActive: true, status: DealerStatus.ACTIVE, credentialsSentAt: new Date().toISOString(), note: 'credentials sent' },
        req,
      });

      res.status(200).json({
        message: 'Login credentials sent successfully',
        dealer: {
          id: dealer.id,
          companyName: dealer.companyName,
          status: DealerStatus.ACTIVE
        },
        sentTo: {
          email: dealer.email,
          phone: dealer.phone
        }
      });

    } catch (error) {
      console.error('Error sending credentials:', error);
      res.status(500).json({ message: 'Failed to send credentials' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
