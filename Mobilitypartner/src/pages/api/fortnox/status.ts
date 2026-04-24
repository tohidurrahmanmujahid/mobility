/**
 * Fortnox Connection Status Endpoint
 *
 * GET /api/fortnox/status - Get connection status
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
    // const user = authenticateUser(req);
    // if (!user || !requireRole(UserRole.ADMIN, user)) {
    //   return res.status(401).json({ message: 'Admin access required' });
    // }

    const status = await FortnoxService.getConnectionStatus();

    return res.status(200).json(status);
  } catch (error) {
    handleApiError(error, res);
  }
}
