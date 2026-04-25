import { NextApiRequest, NextApiResponse } from 'next';
import { sendWorkshopSubmissionEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import { handleWorkshopFileUpload } from '@/utils/workshopFileUpload';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Handle file upload and parse form data
    const { uploadedImages, uploadedDocs, fields } = await handleWorkshopFileUpload(req, res);

    const {
      regNr,
      skadedatum,
      agarNamn,
      agarTelefon,
      agarEmail,
      malarstellningSkade,
      datumSenasteService,
      malarstellningSenasteService,
      serviceInfoSaknas,
      agarensBeskrivning,
      fordonetPaVerkstad,
      organisationsnummer,
      kontaktperson,
      kontaktTelefon,
      kontaktEmail,
      skadeorsak,
      ovrigtUnderlag,
      acceptTerms
    } = fields;

    // Validate required fields
    if (
      !regNr ||
      !skadedatum ||
      !agarNamn ||
      !agarTelefon ||
      !agarEmail ||
      !malarstellningSkade ||
      !agarensBeskrivning ||
      !fordonetPaVerkstad ||
      !organisationsnummer ||
      !kontaktperson ||
      !kontaktTelefon ||
      !kontaktEmail ||
      !skadeorsak
    ) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: [
          'regNr',
          'skadedatum',
          'agarNamn',
          'agarTelefon',
          'agarEmail',
          'malarstellningSkade',
          'agarensBeskrivning',
          'fordonetPaVerkstad',
          'organisationsnummer',
          'kontaktperson',
          'kontaktTelefon',
          'kontaktEmail',
          'skadeorsak'
        ]
      });
    }

    // Validate acceptTerms
    if (acceptTerms !== 'true' && acceptTerms !== true) {
      return res.status(400).json({ message: 'You must accept the terms to proceed' });
    }

    // Parse boolean fields
    const parsedServiceInfoSaknas = serviceInfoSaknas === 'true' || serviceInfoSaknas === true;
    const parsedOvrigtUnderlag = ovrigtUnderlag === 'true' || ovrigtUnderlag === true;

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(agarEmail)) {
      return res.status(400).json({ message: 'Invalid owner email format' });
    }
    if (!emailRegex.test(kontaktEmail)) {
      return res.status(400).json({ message: 'Invalid workshop contact email format' });
    }

    // Validate phone formats (basic validation)
    if (agarTelefon.length < 7) {
      return res.status(400).json({ message: 'Invalid owner phone number' });
    }
    if (kontaktTelefon.length < 7) {
      return res.status(400).json({ message: 'Invalid workshop contact phone number' });
    }

    // Validate dates
    if (!parsedServiceInfoSaknas) {
      if (!datumSenasteService || !malarstellningSenasteService) {
        return res.status(400).json({
          message: 'Service date and mileage required when service info is available'
        });
      }
    }

    // Get admin email from system settings or environment
    let adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

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
      // Fallback: get first admin user's email
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN', isActive: true },
        select: { email: true }
      });

      if (adminUser) {
        adminEmail = adminUser.email;
      }
    }

    if (!adminEmail) {
      console.error('No admin email configured for workshop submissions');
      return res.status(500).json({
        message: 'System configuration error: No admin email configured'
      });
    }

    // Prepare file attachments
    const attachments = {
      uploadedImages: uploadedImages.map(file => file.filename),
      uploadedDocs: uploadedDocs.map(file => file.filename)
    };

    // Send email notification
    try {
      await sendWorkshopSubmissionEmail(
        adminEmail,
        {
          regNr,
          skadedatum,
          agarNamn,
          agarTelefon,
          agarEmail,
          malarstellningSkade,
          datumSenasteService: datumSenasteService || '',
          malarstellningSenasteService: malarstellningSenasteService || '',
          serviceInfoSaknas: parsedServiceInfoSaknas,
          agarensBeskrivning,
          fordonetPaVerkstad,
          organisationsnummer,
          kontaktperson,
          kontaktTelefon,
          kontaktEmail,
          skadeorsak,
          ovrigtUnderlag: parsedOvrigtUnderlag
        },
        attachments
      );

      res.status(200).json({
        message: 'Workshop submission sent successfully',
        sentTo: adminEmail,
        submittedAt: new Date().toISOString(),
        filesUploaded: {
          images: uploadedImages.length,
          documents: uploadedDocs.length
        }
      });
    } catch (emailError) {
      console.error('Failed to send workshop submission email:', emailError);
      return res.status(500).json({
        message: 'Failed to send notification email. Please try again later.'
      });
    }
  } catch (error: any) {
    console.error('Workshop submission error:', error);

    if (error.message?.includes('Invalid file type')) {
      return res.status(400).json({ message: error.message });
    }

    if (error.message?.includes('File too large')) {
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }

    res.status(500).json({ message: 'Failed to process workshop submission. Please try again later.' });
  }
}
