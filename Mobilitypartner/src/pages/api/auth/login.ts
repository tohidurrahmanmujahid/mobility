import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken, setTokenCookie } from '@/utils/Auth';

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
    // Only check User table (admins only)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissions: {
          select: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (!comparePassword(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Only allow ADMIN role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}