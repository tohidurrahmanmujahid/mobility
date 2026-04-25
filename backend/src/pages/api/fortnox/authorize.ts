/**
 * Fortnox OAuth Authorization Endpoint
 *
 * GET /api/fortnox/authorize - Get authorization URL
 *
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import FortnoxService from '@/lib/fortnox';
import { UserRole } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate method
    if (!validateMethod(req, res, ['GET'])) return;

    // Authenticate and authorize
    const user = authenticateUser(req);
    if (!user || !requireRole(UserRole.ADMIN, user)) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    // Generate authorization URL
    const state = Math.random().toString(36).substring(7);
    const authUrl = await FortnoxService.getAuthorizationUrl(state);

    // Store state in session or database for CSRF validation (optional but recommended)
    // For now, we'll just return the URL

    return res.status(200).json({
      authorizationUrl: authUrl,
      state,
    });
  } catch (error) {
    handleApiError(error, res);
  }
}
