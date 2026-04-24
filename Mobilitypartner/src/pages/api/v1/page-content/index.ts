import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * Public API endpoint to get all page content
 *
 * GET /api/v1/page-content
 * Returns all SystemSettings entries whose key starts with "page."
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow CORS for the frontend Vite app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          startsWith: 'page.',
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Convert array to key→value map for easy consumption by the frontend
    const content: Record<string, string> = {};
    for (const row of settings) {
      content[row.key] = row.value;
    }

    return res.status(200).json({
      success: true,
      content,
    });
  } catch (error) {
    console.error('Error fetching page content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve page content',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
