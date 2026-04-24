import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';
import { DealerRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

  const { id } = req.query;
  const staffId = parseInt(id as string);

  if (isNaN(staffId)) {
    return res.status(400).json({ message: 'Invalid staff ID' });
  }

  if (req.method === 'PUT') {
    // Change staff password
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Lösenordet måste vara minst 6 tecken långt' });
      }

      // Check if the staff member exists and belongs to this dealer
      const staffMember = await prisma.dealer.findUnique({
        where: { id: staffId }
      });

      if (!staffMember) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      if (staffMember.dealerId !== dealerId) {
        return res.status(403).json({ message: 'You can only change password for staff from your own dealership' });
      }

      if (staffMember.role !== DealerRole.STAFF) {
        return res.status(403).json({ message: 'Cannot change password for non-staff users' });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update the password
      await prisma.dealer.update({
        where: { id: staffId },
        data: { passwordHash }
      });

      await auditLog({
        action: 'UPDATE',
        entity: 'dealer_staff',
        entityId: staffId,
        user: { id: userInfo.id, name: dealer.name, email: dealer.email },
        before: { password: '***' },
        after: { password: 'changed' },
        req,
      });

      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing staff password:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Check if the staff member exists and belongs to this dealer
      const staffMember = await prisma.dealer.findUnique({
        where: { id: staffId }
      });

      if (!staffMember) {
        return res.status(404).json({ message: 'Staff member not found' });
      }

      if (staffMember.dealerId !== dealerId) {
        return res.status(403).json({ message: 'You can only delete staff from your own dealership' });
      }

      if (staffMember.role !== DealerRole.STAFF) {
        return res.status(403).json({ message: 'Cannot delete non-staff users' });
      }

      // Prevent deleting yourself (though owner shouldn't be able to reach here)
      if (staffMember.id === userInfo.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Delete the staff member
      await prisma.dealer.delete({
        where: { id: staffId }
      });

      await auditLog({
        action: 'DELETE',
        entity: 'dealer_staff',
        entityId: staffId,
        user: { id: userInfo.id, name: dealer.name, email: dealer.email },
        before: { id: staffMember.id, name: staffMember.name, email: staffMember.email },
        req,
      });

      return res.status(200).json({ message: 'Staff member deleted successfully' });
    } catch (error) {
      console.error('Error deleting staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
