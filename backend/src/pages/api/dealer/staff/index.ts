import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';
import { DealerRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendDealerWelcomeEmail } from '@/lib/email';
import { sendDealerWelcomeSMS } from '@/lib/sms';
import { auditLog } from '@/lib/audit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userInfo = authenticateUser(req);
  if (!userInfo) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Only DEALER role users can manage staff
  if (userInfo.role !== 'DEALER') {
    return res.status(403).json({ message: 'Only dealers can manage staff' });
  }

  // Get the dealer information
  const dealer = await prisma.dealer.findUnique({
    where: { id: userInfo.id }
  });

  if (!dealer || dealer.role !== DealerRole.OWNER) {
    return res.status(403).json({ message: 'Only dealer owners can manage staff' });
  }

  const dealerId = dealer.id;

  if (req.method === 'GET') {
    try {
      const staff = await prisma.dealer.findMany({
        where: {
          dealerId: dealerId,
          role: DealerRole.STAFF
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

      return res.status(200).json({ staff });
    } catch (error) {
      console.error('Error fetching staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, phone, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      // Check if email already exists in Dealer table
      const existingDealer = await prisma.dealer.findUnique({
        where: { email }
      });

      if (existingDealer) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Check if email exists in User (admin) table
      // const existingUser = await prisma.user.findUnique({
      //   where: { email }
      // });

      // if (existingUser) {
      //   return res.status(400).json({ message: 'Email already in use' });
      // }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new staff member in Dealer table
      const newStaff = await prisma.dealer.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: DealerRole.STAFF,
          dealerId: dealerId, // Link to parent dealer
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

      // Send welcome email with credentials
      try {
        await sendDealerWelcomeEmail(
          newStaff.email,
          newStaff.name,
          password,
          dealer.companyName
        );
        console.log('Staff welcome email sent successfully');
      } catch (emailError) {
        console.error('Failed to send staff welcome email:', emailError);
      }

      // Send welcome SMS with credentials if phone is provided
      if (newStaff.phone) {
        try {
          await sendDealerWelcomeSMS(
            newStaff.phone,
            dealer.companyName,
            newStaff.email,
            password
          );
          console.log('Staff welcome SMS sent successfully');
        } catch (smsError) {
          console.error('Failed to send staff welcome SMS:', smsError);
        }
      }

      await auditLog({
        action: 'CREATE',
        entity: 'dealer_staff',
        entityId: newStaff.id,
        user: { id: userInfo.id, name: dealer.name, email: dealer.email },
        after: { id: newStaff.id, name: newStaff.name, email: newStaff.email, phone: newStaff.phone },
        req,
      });

      return res.status(201).json({
        message: 'Staff member created successfully',
        staff: newStaff
      });
    } catch (error) {
      console.error('Error creating staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
