import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { lookupOwner, refreshOwnerData } from '@/lib/owner-lookup';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!requireRole(UserRole.ADMIN, user)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, refresh } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Organization number is required' });
  }

  // Validate organization number (10 digits)
  const orgNumberRegex = /^\d{10}$/;
  if (!orgNumberRegex.test(id)) {
    return res.status(400).json({ message: 'Organization number must be exactly 10 digits' });
  }

  try {
    // Use refresh parameter to bypass cache if needed
    const shouldRefresh = refresh === 'true';
    const ownerData = shouldRefresh
      ? await refreshOwnerData(id)
      : await lookupOwner(id);

    if (!ownerData) {
      return res.status(404).json({ message: 'Owner not found' });
    }

    res.status(200).json(ownerData);
  } catch (error) {
    console.error('Owner lookup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
