import { NextApiRequest, NextApiResponse } from 'next';
import { ClaimStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseMultipartForm, getRelativeFilePath } from '@/lib/multer';
import { sendClaimSubmissionEmailToCustomer, sendClaimSubmissionEmailToSupport } from '@/lib/email';
import { auditLog } from '@/lib/audit';

// Disable Next.js body parser to handle multipart form data
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false, // Allow large responses
  },
};

export default async function handler(
  req: NextApiRequest & { files?: any },
  res: NextApiResponse
) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  console.log('Processing claim submission request', req.method);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    await parseMultipartForm(req, res);

    // Extract form fields
    const {
      registrationNumber,
      mileage,
      firstname,
      lastname,
      phone,
      email,
      personnummer,
      address,
      postnummer,
      ort,
      skadedatum,
      damageDescription,
      submittedAt,
    } = req.body;

    // Extract uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const meterReadingImage = files?.meterReadingImage?.[0];
    const descriptionFiles = files?.descriptionFiles || [];

    console.log('Received claim submission:', registrationNumber);
    console.log('Files received:', { meterReadingImage: !!meterReadingImage, descriptionFilesCount: descriptionFiles.length });

    // Validate required fields
    const requiredFields: { [key: string]: any } = {
      registrationNumber,
      firstname,
      lastname,
      phone,
      email,
      personnummer,
      postnummer,
      ort,
      skadedatum
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate phone format (basic validation)
    if (phone.length < 7) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    // Validate date format
    const skadedatumDate = new Date(skadedatum);
    if (isNaN(skadedatumDate.getTime())) {
      return res.status(400).json({ message: 'Invalid skadedatum format' });
    }

    // Get relative file paths for database storage
    const meterReadingImagePath = meterReadingImage ? getRelativeFilePath(meterReadingImage.path) : null;
    const descriptionFilePaths = descriptionFiles.map((file: Express.Multer.File) =>
      getRelativeFilePath(file.path)
    );

    // Find active warranty by registration number
    const warranty = await prisma.warranty.findFirst({
      where: {
        vehicleRegistrationNumber: registrationNumber.toUpperCase().trim(),
        status: 'ACTIVE',
        isDeleted: false, // Exclude soft-deleted warranties
        endDate: {
          gte: new Date() // Warranty must not be expired
        }
      },
      include: {
        product: true,
        dealer: true
      }
    });

    if (!warranty) {
      return res.status(404).json({
        message: 'No active warranty found for this vehicle registration number'
      });
    }
    console.log('Found active warranty:', warranty);

    const result = await prisma.$transaction(async (tx) => {
      // Create the claim
      const claim = await tx.claim.create({
        data: {
          warranty: {
            connect: {
              id: warranty.id
            }
          },
          customerDescription: damageDescription || null,
          customerFirstname: firstname,
          customerLastname: lastname,
          customerPhone: phone,
          customerEmail: email,
          customerPersonnummer: personnummer,
          customerAddress: address || null,
          customerPostnummer: postnummer,
          customerOrt: ort,
          mileage: mileage?.toString() || null,
          skadedatum: skadedatumDate,
          meterReadingImage: meterReadingImagePath,
          descriptionFiles: descriptionFilePaths.length > 0 ? JSON.stringify(descriptionFilePaths) : null,
          status: ClaimStatus.SUBMITTED,
          createdAt: submittedAt ? new Date(submittedAt) : new Date()
        },
        include: {
          warranty: {
            include: {
              product: true,
              dealer: true
            }
          }
        }
      });

      return claim;
    });

    // Send confirmation emails to customer and support
    try {
      const customerName = `${result.customerFirstname} ${result.customerLastname}`;

      // Extract vehicle data from JSON field
      const vehicleData = result.warranty.vehicleData as { make?: string; model?: string } | null;
      const vehicleMake = vehicleData?.make || 'Okänt';
      const vehicleModel = vehicleData?.model || '';

      // Send email to customer
      await sendClaimSubmissionEmailToCustomer(
        result.customerEmail,
        customerName,
        {
          vehicleRegistrationNumber: result.warranty.vehicleRegistrationNumber,
          vehicleMake,
          vehicleModel,
          productName: result.warranty.product.name,
          skadedatum: result.skadedatum,
          claimId: result.id
        }
      );

      // Send email to support
      await sendClaimSubmissionEmailToSupport({
        claimId: result.id,
        customerFirstname: result.customerFirstname,
        customerLastname: result.customerLastname,
        customerEmail: result.customerEmail,
        customerPhone: result.customerPhone,
        customerPersonnummer: result.customerPersonnummer,
        customerAddress: result.customerAddress || undefined,
        customerPostnummer: result.customerPostnummer,
        customerOrt: result.customerOrt,
        vehicleRegistrationNumber: result.warranty.vehicleRegistrationNumber,
        vehicleMake,
        vehicleModel,
        productName: result.warranty.product.name,
        dealerName: result.warranty.dealer.companyName,
        skadedatum: result.skadedatum,
        mileage: result.mileage || undefined,
        damageDescription: result.customerDescription || undefined
      });

      console.log('Claim confirmation emails sent successfully');
    } catch (emailError) {
      // Log email error but don't fail the claim submission
      console.error('Failed to send claim confirmation emails:', emailError);
    }

    await auditLog({
      action: 'CREATE',
      entity: 'claim',
      entityId: result.id,
      user: null,
      after: {
        id: result.id,
        warrantyId: result.warrantyId,
        vehicleRegistrationNumber: result.warranty.vehicleRegistrationNumber,
        customerEmail: result.customerEmail,
        status: result.status,
      },
      req,
    });

    res.status(201).json({
      message: 'Claim submitted successfully',
      claim: {
        id: result.id,
        status: result.status,
        warrantyId: result.warrantyId,
        vehicleRegistrationNumber: result.warranty.vehicleRegistrationNumber,
        submittedAt: result.createdAt,
        files: {
          meterReadingImage: meterReadingImagePath,
          descriptionFiles: descriptionFilePaths,
        }
      }
    });
  } catch (error) {
    console.error('Claim submission error:', error);

    if (error instanceof Error && error.message.includes('Invalid file type')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Failed to submit claim. Please try again later.' });
  }
}
