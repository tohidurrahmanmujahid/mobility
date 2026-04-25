import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';
import { auditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email är obligatorisk' });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: 'Om e-postadressen finns i vårt system kommer du att få ett e-postmeddelande med instruktioner för att återställa ditt lösenord.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(200).json({
        message: 'Om e-postadressen finns i vårt system kommer du att få ett e-postmeddelande med instruktioner för att återställa ditt lösenord.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiry to 1 hour from now
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    // Update user with reset token and expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken, user.role);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    await auditLog({
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      user: null,
      after: { passwordResetRequested: true },
      req,
    });

    return res.status(200).json({
      message: 'Om e-postadressen finns i vårt system kommer du att få ett e-postmeddelande med instruktioner för att återställa ditt lösenord.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Något gick fel. Försök igen senare.' });
  } finally {
    await prisma.$disconnect();
  }
}
