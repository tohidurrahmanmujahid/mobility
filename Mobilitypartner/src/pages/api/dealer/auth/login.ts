import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateDealerToken, setTokenCookie } from '@/utils/Auth';
import { DealerRole } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find dealer by email (could be OWNER or STAFF)
    const dealer = await prisma.dealer.findUnique({
      where: { email: email },
      include: {
        parentDealer: true // Include parent dealer if this is a staff member
      }
    });

    if (!dealer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (!comparePassword(password, dealer.passwordHash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!dealer.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check dealer status (for both owner and staff)
    const parentDealer = dealer.role === DealerRole.STAFF ? dealer.parentDealer : dealer;
    if (parentDealer && parentDealer.status === 'INACTIVE') {
      return res.status(401).json({ message: 'Dealer account is deactivated. Please contact administrator.' });
    }

    // Generate token
    const token = generateDealerToken(dealer, dealer.parentDealer || undefined);
    setTokenCookie(res, token);

    // Prepare user response
    const companyName = dealer.role === DealerRole.STAFF && dealer.parentDealer
      ? dealer.parentDealer.companyName
      : dealer.companyName;

    const dealerId = dealer.role === DealerRole.STAFF
      ? dealer.dealerId
      : dealer.id;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: dealer.id,
        email: dealer.email,
        name: dealer.name,
        role: dealer.role === DealerRole.OWNER ? 'DEALER' : 'DEALER_STAFF',
        companyName: companyName,
        dealerId: dealerId
      }
    });
  } catch (error) {
    console.error('Dealer login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
