import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userInfo = authenticateUser(req);
  if (!userInfo) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Check if this is a Dealer or DealerStaff based on userType in token
    if (userInfo.userType === 'DEALER' || userInfo.userType === 'DEALER_STAFF') {
      // Fetch from Dealer table (both owners and staff are in same table now)
      const dealer = await prisma.dealer.findUnique({
        where: { id: userInfo.id },
        include: {
          parentDealer: true // Include parent dealer info for staff
        }
      });

      if (!dealer) {
        return res.status(404).json({ message: 'Dealer not found' });
      }

      // Get company name and dealer ID based on role
      const companyName = dealer.role === 'STAFF' && dealer.parentDealer
        ? dealer.parentDealer.companyName
        : dealer.companyName;

      const dealerId = dealer.role === 'STAFF'
        ? dealer.dealerId
        : dealer.id;

      return res.status(200).json({
        id: dealer.id,
        email: dealer.email,
        name: dealer.name,
        companyName: companyName,
        role: dealer.role === 'OWNER' ? 'DEALER' : 'DEALER_STAFF',
        dealerId: dealerId,
        dealer: dealer.role === 'STAFF' ? dealer.parentDealer : dealer
      });
    } else {
      // Wrong API endpoint - this is for dealers only
      return res.status(403).json({ message: 'Access denied. Use admin endpoint.' });
    }
  } catch (error) {
    console.error('Error fetching dealer user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
