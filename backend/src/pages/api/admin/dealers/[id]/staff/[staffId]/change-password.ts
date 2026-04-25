import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/Auth';
import bcrypt from 'bcryptjs';
import { sendPasswordChangeEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    const { id: dealerIdParam, staffId: staffIdParam } = req.query;
    const { newPassword } = req.body;

    // Validate inputs
    if (!dealerIdParam || !staffIdParam) {
      return res.status(400).json({ message: 'Dealer ID and Staff ID are required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const dealerId = parseInt(dealerIdParam as string, 10);
    const staffUserId = parseInt(staffIdParam as string, 10);

    if (isNaN(dealerId) || isNaN(staffUserId)) {
      return res.status(400).json({ message: 'Invalid dealer ID or staff ID' });
    }

    // Verify the staff member exists and belongs to the specified dealer
    const staffMember = await prisma.dealer.findFirst({
      where: {
        id: staffUserId,
        dealerId: dealerId,
        role: 'STAFF'
      },
      include: {
        parentDealer: {
          select: {
            companyName: true
          }
        }
      }
    });

    if (!staffMember) {
      return res.status(404).json({ message: 'Staff member not found or does not belong to this dealer' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update the password
    const updatedStaff = await prisma.dealer.update({
      where: { id: staffUserId },
      data: { passwordHash },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Send password change notification email
    if (staffMember.parentDealer?.companyName) {
      try {
        await sendPasswordChangeEmail(
          updatedStaff.email,
          updatedStaff.name,
          newPassword,
          staffMember.parentDealer.companyName
        );
        console.log('Password change email sent successfully');
      } catch (emailError) {
        console.error('Failed to send password change email:', emailError);
        // Don't fail the request if email fails
      }
    }

    await auditLog({
      action: 'UPDATE',
      entity: 'dealer_staff',
      entityId: staffUserId,
      user: adminInfo ? { id: adminInfo.id, name: adminInfo.name ?? undefined, email: adminInfo.email ?? undefined } : null,
      before: { password: '***' },
      after: { password: 'changed' },
      req,
    });

    return res.status(200).json({
      message: 'Password updated successfully',
      staff: updatedStaff
    });

  } catch (error) {
    console.error('Error changing staff password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
