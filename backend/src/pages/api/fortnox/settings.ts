/**
 * Fortnox Settings API
 *
 * GET /api/fortnox/settings - Get current settings
 * POST /api/fortnox/settings - Create/Update settings
 *
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import { auditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate method
    if (!validateMethod(req, res, ['GET', 'POST'])) return;

    // Authenticate and authorize
    const user = authenticateUser(req);
    if (!user || !requireRole(UserRole.ADMIN, user)) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res, user);
    }
  } catch (error) {
    handleApiError(error, res);
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const settings = await prisma.fortnoxSettings.findFirst({
    where: { isActive: true },
  });

  if (!settings) {
    return res.status(200).json({
      message: 'Fortnox not configured',
      settings: null,
    });
  }

  // Don't expose sensitive data
  return res.status(200).json({
    settings: {
      id: settings.id,
      clientId: settings.clientId,
      redirectUri: settings.redirectUri,
      scopes: settings.scopes,
      isActive: settings.isActive,
      isAuthenticated: !!(settings.accessToken && settings.tokenExpiry && settings.tokenExpiry > new Date()),
      tokenExpiry: settings.tokenExpiry,
      lastSyncAt: settings.lastSyncAt,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    },
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: { id: number }) {
  const { clientId, clientSecret, redirectUri, scopes } = req.body;

  // Validate required fields
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(400).json({
      message: 'Missing required fields: clientId, clientSecret, redirectUri',
    });
  }

  // Deactivate existing settings
  await prisma.fortnoxSettings.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new settings
  const settings = await prisma.fortnoxSettings.create({
    data: {
      clientId,
      clientSecret,
      redirectUri,
      scopes: scopes || 'invoice customer order article',
      isActive: true,
    },
  });

  // Audit log: fortnox settings updated (don't log secrets/tokens)
  await auditLog({
    action: 'UPDATE',
    entity: 'fortnox_settings',
    entityId: settings.id,
    user: { id: user.id },
    after: { clientId: settings.clientId, redirectUri: settings.redirectUri, scopes: settings.scopes },
    req,
  });

  return res.status(201).json({
    message: 'Fortnox settings saved successfully',
    settings: {
      id: settings.id,
      clientId: settings.clientId,
      redirectUri: settings.redirectUri,
      scopes: settings.scopes,
      isActive: settings.isActive,
    },
  });
}
