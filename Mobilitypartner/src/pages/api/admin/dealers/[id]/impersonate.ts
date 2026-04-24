import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/utils/Auth';
import jwt from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin authentication
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only admins can impersonate dealers' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Dealer ID is required' });
    }

    // Find the dealer (the dealer record itself is the user account)
    const dealer = await prisma.dealer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check if dealer account is active
    if (!dealer.isActive) {
      return res.status(400).json({ message: 'Dealer account is not active' });
    }

    // Generate impersonation token (short-lived, 5 minutes)
    const impersonationToken = jwt.sign(
      {
        userId: dealer.id,
        email: dealer.email,
        role: dealer.role,
        dealerId: dealer.id,
        name: dealer.name,
        impersonatedBy: decoded.userId,
        isImpersonation: true
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '5m' }
    );

    // Log the impersonation for audit purposes
    console.log(`Admin ${decoded.userId} (${decoded.email}) impersonating dealer ${dealer.id} (${dealer.companyName}) - ${dealer.email}`);

    res.status(200).json({
      token: impersonationToken,
      dealer: {
        id: dealer.id,
        companyName: dealer.companyName
      }
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    res.status(500).json({ message: 'Failed to impersonate dealer' });
  }
}
