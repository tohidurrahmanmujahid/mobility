import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole, hashPassword } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { requirePermission } from '@/utils/permissions';
import { sendDealerWelcomeEmail } from '@/lib/email';
import { sendDealerWelcomeSMS } from '@/lib/sms';
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

  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const dealerId = parseInt(id as string);
      const { name, email, phone } = req.body;

      if (isNaN(dealerId)) {
        return res.status(400).json({ message: 'Invalid dealer ID' });
      }

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      // Check if dealer exists
      const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId }
      });

      if (!dealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      // Check if email already exists in Dealer table (for both owners and staff)
      const existingDealerOrStaff = await prisma.dealer.findUnique({
        where: { email }
      });

      if (existingDealerOrStaff) {
        return res.status(409).json({ message: 'This email is already registered' });
      }

      // Check if email exists in User (admin) table
      // const existingUser = await prisma.user.findUnique({
      //   where: { email }
      // });

      // if (existingUser) {
      //   return res.status(409).json({ message: 'This email is already registered as an admin account' });
      // }

      // Generate password
      const generatedPassword = generatePassword();
      const hashedPassword = hashPassword(generatedPassword);

      // Create dealer staff member in Dealer table with STAFF role
      const staffMember = await prisma.dealer.create({
        data: {
          email,
          name,
          phone,
          passwordHash: hashedPassword,
          dealerId: dealerId, // Link to parent dealer
          role: 'STAFF', // Mark as staff member
          isActive: true // Staff can login immediately
        }
      });

      // Send welcome email with credentials
      try {
        await sendDealerWelcomeEmail(
          staffMember.email,
          staffMember.name,
          generatedPassword,
          dealer.companyName
        );
        console.log('Staff welcome email sent successfully');
      } catch (emailError) {
        console.error('Failed to send staff welcome email:', emailError);
      }

      // Send welcome SMS with credentials if phone is provided
      if (staffMember.phone) {
        try {
          await sendDealerWelcomeSMS(
            staffMember.phone,
            dealer.companyName,
            staffMember.email,
            generatedPassword
          );
          console.log('Staff welcome SMS sent successfully');
        } catch (smsError) {
          console.error('Failed to send staff welcome SMS:', smsError);
        }
      }

      await auditLog({
        action: 'CREATE',
        entity: 'dealer_staff',
        entityId: staffMember.id,
        user: { id: user.id, name: currentUser?.name ?? undefined, email: currentUser?.email ?? undefined },
        after: { id: staffMember.id, name: staffMember.name, email: staffMember.email, phone: staffMember.phone, dealerId },
        req,
      });

      res.status(201).json({
        message: 'Staff member added successfully',
        staff: {
          id: staffMember.id,
          email: staffMember.email,
          name: staffMember.name,
          phone: staffMember.phone
        },
        // Return the password for admin to send to staff member
        temporaryPassword: generatedPassword
      });

    } catch (error) {
      console.error('Error adding staff member:', error);
      res.status(500).json({ message: 'Failed to add staff member' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
