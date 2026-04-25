import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { auditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token och lösenord är obligatoriska' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ message: 'Lösenordet måste vara minst 8 tecken långt' });
  }

  try {
    // Hash the token to match what's stored in database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: {
          gt: new Date(), // Token must not be expired
        },
        isActive: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Ogiltig eller utgången återställningslänk. Vänligen begär en ny.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        updatedAt: new Date(),
      },
    });

    await auditLog({
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      user: null,
      before: { password: '***' },
      after: { password: 'reset' },
      req,
    });

    return res.status(200).json({
      message: 'Lösenordet har återställts framgångsrikt. Du kan nu logga in med ditt nya lösenord.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Något gick fel. Försök igen senare.' });
  } finally {
    await prisma.$disconnect();
  }
}
