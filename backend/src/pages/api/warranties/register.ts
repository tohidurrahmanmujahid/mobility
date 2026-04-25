import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole, WarrantyStatus, InvoiceStatus, Permission } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';
import { sendWarrantyConfirmationSMS } from '@/lib/sms';
import { sendWarrantyConfirmationEmail } from '@/lib/email';
import FortnoxService from '@/lib/fortnox';
import { hasPermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check user type and permissions
  if (user.userType === 'USER' && user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  if (user.userType !== 'USER' && user.role !== 'DEALER' && user.role !== 'DEALER_STAFF') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // If user is admin, check for REGISTERED_PRODUCTS permission
  if (user.userType === 'USER' && user.role === 'ADMIN') {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        permissions: {
          select: {
            permission: true
          }
        }
      }
    });

    if (currentUser) {
      const userPermissions = {
        isSuperAdmin: currentUser.isSuperAdmin,
        permissions: currentUser.permissions
      };

      if (!hasPermission(userPermissions, Permission.REGISTERED_PRODUCTS)) {
        return res.status(403).json({
          message: 'Du saknar behörighet att registrera garantier. Kontakta din administratör för att få tillgång till denna funktion.'
        });
      }
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    vehicleRegistrationNumber,
    vehicleData,
    productId,
    ownerName,
    ownerFirstname,
    ownerLastname,
    ownerEmail,
    ownerPhone,
    ownerPersonnummer,
    ownerAddress,
    ownerPostnummer,
    ownerOrt,
    dealerId
  } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId }
      });
      if (!product) {
        throw new Error('Product not found');
      }
      if (product.isDeleted) {
        throw new Error('This product is no longer available');
      }
      if (!product.isActive) {
        throw new Error('This product is currently inactive and cannot be used for new warranties');
      }

      // Determine which dealer ID to use based on user type
      let targetDealerId: number;

      if (user.userType === 'USER' && user.role === 'ADMIN') {
        // Admin users can register for any dealer
        if (!dealerId) {
          throw new Error('Dealer ID is required for admin warranty registration');
        }
        targetDealerId = dealerId;
      } else if (user.userType === 'DEALER' || user.userType === 'DEALER_STAFF') {
        // Dealers and dealer staff use their own dealerId from token
        if (!user.dealerId) {
          throw new Error('User not associated with a dealer');
        }

        // If dealerId is provided, validate it matches their dealer
        if (dealerId && dealerId !== user.dealerId) {
          throw new Error('Insufficient permissions to register warranty for this dealer');
        }

        targetDealerId = user.dealerId;
      } else {
        throw new Error('Invalid user type');
      }

      // Verify dealer exists
      const dealer = await tx.dealer.findUnique({
        where: { id: targetDealerId }
      });
      if (!dealer) {
        throw new Error('Dealer not found');
      }

      // Check if vehicle already has an active warranty
      const existingWarranty = await tx.warranty.findFirst({
        where: {
          vehicleRegistrationNumber,
          status: WarrantyStatus.ACTIVE,
          isDeleted: false // Exclude soft-deleted warranties
        }
      });
      if (existingWarranty) {
        throw new Error('Vehicle already has an active warranty');
      }

      // Calculate end date based on product duration
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + product.durationMonths);

      // Prepare registeredBy data based on user type
      const registeredByData: any = {
        registeredByType: user.userType,
        registeredByName: user.name,
        registeredByEmail: user.email
      };

      if (user.userType === 'USER') {
        // Admin user from User table
        registeredByData.registeredByUserId = user.id;
      } else if (user.userType === 'DEALER' || user.userType === 'DEALER_STAFF') {
        // Both dealer owner and staff are now in Dealer table
        registeredByData.registeredByDealerId = user.id;
      }

      // Generate warranty number
      const warrantyNumber = await generateWarrantyNumber(tx);

      const warranty = await tx.warranty.create({
        data: {
          warrantyNumber,
          vehicleRegistrationNumber,
          vehicleData,
          productId: product.id,
          dealerId: targetDealerId,
          ownerName,
          ownerFirstname: ownerFirstname || null,
          ownerLastname: ownerLastname || null,
          ownerEmail,
          ownerPhone,
          ownerPersonnummer,
          ownerAddress: ownerAddress || null,
          ownerPostnummer: ownerPostnummer || null,
          ownerOrt: ownerOrt || null,
          startDate,
          endDate,
          status: WarrantyStatus.ACTIVE,
          ...registeredByData
        },
        include: {
          product: true,
          dealer: true
        }
      });

      // Create invoice for the warranty
      const invoiceNumber = await generateInvoiceNumber(tx);

      // Calculate amounts: insurance (VAT 0%) + warranty (VAT 25%)
      const totalPremium = Number(product.premium);
      const insuranceAmount = Number(product.insuranceAmount || 0);
      const warrantyPortion = totalPremium - insuranceAmount;
      // VAT only applies to the warranty portion, not insurance
      const vatAmount = warrantyPortion * 0.25;
      const amount = totalPremium;
      const totalAmount = totalPremium + vatAmount;

      // Set due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          dealerId: targetDealerId,
          warrantyId: warranty.id,
          amount,
          vatAmount,
          totalAmount,
          dueDate,
          status: InvoiceStatus.PENDING,
        }
      });

      return { warranty, invoice };
    });

    // Audit log for warranty and invoice creation
    const registeredByUser = { id: user.id, name: user.name, email: user.email };
    auditLog({ action: 'CREATE', entity: 'warranty', entityId: result.warranty.id, user: registeredByUser, after: { warrantyNumber: result.warranty.warrantyNumber, vehicleRegistrationNumber, ownerName, dealerId: result.warranty.dealerId, productId: result.warranty.productId }, req });
    auditLog({ action: 'CREATE', entity: 'invoice', entityId: result.invoice.id, user: registeredByUser, after: { invoiceNumber: result.invoice.invoiceNumber, amount: result.invoice.amount, dealerId: result.warranty.dealerId }, req });

    // Send confirmation email
    if (result.warranty.ownerEmail) {
      try {
        await sendWarrantyConfirmationEmail(
          result.warranty.warrantyNumber,
          result.warranty.ownerEmail,
          result.warranty.ownerName,
          result.warranty.vehicleRegistrationNumber,
          result.warranty.vehicleData.make,
          result.warranty.vehicleData.model,
          result.warranty.vehicleData.mileage,
          result.warranty.product.name,
          result.warranty.startDate,
          result.warranty.endDate,
          result.warranty.dealer.companyName,
          result.warranty.product.pdfUrl || undefined
        );
      } catch (emailError) {
        console.error('Failed to send warranty confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send SMS confirmation
    if (result.warranty.ownerPhone) {
      try {
        await sendWarrantyConfirmationSMS(
          result.warranty.ownerPhone,
          result.warranty.ownerName,
          result.warranty.vehicleRegistrationNumber,
          result.warranty.product.name,
          result.warranty.endDate,
          result.warranty.dealer.companyName
        );
      } catch (smsError) {
        console.error('Failed to send warranty confirmation SMS:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    // Sync invoice to Fortnox if configured
    try {
      const isFortnoxConfigured = await FortnoxService.isConfigured();
      if (isFortnoxConfigured) {
        await FortnoxService.syncInvoiceToFortnox(result.invoice.id, result.warranty.vehicleData.make,
          result.warranty.vehicleData.model,);
      }
    } catch (fortnoxError) {
      console.error('Failed to sync invoice to Fortnox:', fortnoxError);
      // Don't fail the request if Fortnox sync fails
    }

    res.status(201).json({
      message: 'Warranty and invoice created successfully',
      warranty: result.warranty,
      invoice: result.invoice
    });
  } catch (error) {
    console.error('Warranty registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Generate unique warranty number
 */
async function generateWarrantyNumber(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Get count of warranties this month
  const startOfMonth = new Date(year, new Date().getMonth(), 1);
  const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

  const count = await tx.warranty.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = count + 1;

  return `WRN-${year}${month}-6759${sequence}`;
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Get count of invoices this month
  const startOfMonth = new Date(year, new Date().getMonth(), 1);
  const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

  const count = await tx.invoice.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');

  return `INV-${year}${month}-${sequence}`;
}