import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { generateDealerToken, setTokenCookie } from '@/utils/Auth';
import { DealerRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface ImpersonationPayload {
  userId: number;
  email: string;
  role: string;
  dealerId: number;
  name: string;
  impersonatedBy: number;
  isImpersonation: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Impersonation token is required' });
  }

  try {
    // Verify the impersonation token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as ImpersonationPayload;

    // Validate it's an impersonation token
    if (!decoded.isImpersonation) {
      return res.status(400).json({ message: 'Invalid impersonation token' });
    }

    // Find the dealer by ID
    const dealer = await prisma.dealer.findUnique({
      where: { id: decoded.userId },
      include: {
        parentDealer: true
      }
    });

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    // Check if account is active
    if (!dealer.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Log the successful impersonation
    console.log(`Impersonation login: Admin ${decoded.impersonatedBy} logged in as dealer ${dealer.id} (${dealer.email})`);

    // Generate a new token for the dealer session
    const dealerToken = generateDealerToken(dealer, dealer.parentDealer || undefined);
    setTokenCookie(res, dealerToken);

    // Prepare user response
    const companyName = dealer.role === DealerRole.STAFF && dealer.parentDealer
      ? dealer.parentDealer.companyName
      : dealer.companyName;

    const dealerId = dealer.role === DealerRole.STAFF
      ? dealer.dealerId
      : dealer.id;

    return res.status(200).json({
      message: 'Impersonation successful',
      token: dealerToken,
      user: {
        id: dealer.id,
        email: dealer.email,
        name: dealer.name,
        role: dealer.role === DealerRole.OWNER ? 'DEALER' : 'DEALER_STAFF',
        companyName: companyName,
        dealerId: dealerId,
        isImpersonation: true // Flag to indicate this is an impersonated session
      }
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Impersonation token has expired. Please try again.' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid impersonation token' });
    }

    console.error('Impersonation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
