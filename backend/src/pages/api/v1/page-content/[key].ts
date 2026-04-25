import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole } from '@prisma/client';

/**
 * Protected API endpoint to update a single page content field
 *
 * PUT /api/v1/page-content/:key
 * Header: Authorization: Bearer <token>
 * Body: { value: string }
 *
 * Upserts the SystemSettings row with the given key.
 * Only keys starting with "page." are allowed.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow CORS for the frontend Vite app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // --- Auth check ---
  const user = authenticateUser(req);
  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // --- Key validation ---
  const { key } = req.query;
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing key parameter' });
  }

  // Only allow keys starting with "page." for safety
  if (!key.startsWith('page.')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid key. Only page content keys (starting with "page.") are allowed.',
    });
  }

  // --- Body validation ---
  const { value } = req.body;
  if (value === undefined || value === null) {
    return res.status(400).json({ success: false, message: 'Missing value in request body' });
  }
  if (typeof value !== 'string') {
    return res.status(400).json({ success: false, message: 'Value must be a string' });
  }

  try {
    // Upsert: create if not exists, update if exists
    const updated = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
      },
      create: {
        key,
        value,
        description: `Page content field: ${key}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      content: {
        key: updated.key,
        value: updated.value,
      },
    });
  } catch (error) {
    console.error('Error updating page content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update page content',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
