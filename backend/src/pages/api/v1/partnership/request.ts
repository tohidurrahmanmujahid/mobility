import { NextApiRequest, NextApiResponse } from 'next';
import { sendPartnershipRequestEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      let data = req.body;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid JSON format' });
        }
      }
      const { companyName, orgNumber, phone, email } = data;

      // Validate required fields
      if (!companyName || !orgNumber || !phone || !email) {
        return res.status(400).json({
          message: 'All fields are required: companyName, orgNumber, phone, email'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: 'Invalid email format'
        });
      }

      // Get admin email from environment variable
      let adminEmail = process.env.PARTNERSHIP_ADMIN_EMAIL || process.env.EMAIL_SERVER_USER;
      if (!adminEmail) {
        // Try to get from system settings
        const setting = await prisma.systemSettings.findUnique({
          where: { key: 'ADMIN_NOTIFICATION_EMAIL' }
        });

        if (setting) {
          adminEmail = setting.value;
        }
      }

      if (!adminEmail) {
        console.error('No admin email configured for partnership requests');
        return res.status(500).json({
          message: 'Partnership request system not configured properly'
        });
      }

      // Send email to admin
      await sendPartnershipRequestEmail(adminEmail, {
        companyName,
        orgNumber,
        phone,
        email
      });

      res.status(200).json({
        success: true,
        message: 'Partnership request submitted successfully'
      });
    } catch (error) {
      console.error('Error processing partnership request:', error);
      res.status(500).json({
        message: 'Failed to submit partnership request'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
