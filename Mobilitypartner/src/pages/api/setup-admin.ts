import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * ONE-TIME setup endpoint — creates the default admin user
 * DELETE THIS FILE after use!
 * GET /api/setup-admin
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const email = 'mobilitypartner.admin@gmail.com';
    const password = 'Mobility@2026!';

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Admin already exists',
        email,
      });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'System Admin',
        role: 'ADMIN',
        isActive: true,
        isSuperAdmin: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Admin user created!',
      email,
      password,
      id: user.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
