/**
 * Invoice Management API
 *
 * GET /api/admin/invoices - List all invoices with pagination and filters
 * POST /api/admin/invoices - Create new invoice
 *
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, InvoiceStatus, UserRole, Permission } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import FortnoxService from '@/lib/fortnox';
import { requirePermission } from '@/utils/permissions';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate method
    if (!validateMethod(req, res, ['GET', 'POST'])) return;

    // Authenticate and authorize
    const user = authenticateUser(req);
    if (!user || !requireRole(UserRole.ADMIN, user)) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    // // Check for FINANCE permission
    // const currentUser = await prisma.user.findUnique({
    //   where: { id: user.id },
    //   include: {
    //     permissions: {
    //       select: {
    //         permission: true
    //       }
    //     }
    //   }
    // });

    // if (currentUser) {
    //   const userPermissions = {
    //     isSuperAdmin: currentUser.isSuperAdmin,
    //     permissions: currentUser.permissions
    //   };

    //   const permissionCheck = requirePermission(userPermissions, Permission.FINANCE);
    //   if (!permissionCheck.hasPermission) {
    //     return res.status(403).json({ message: permissionCheck.errorMessage });
    //   }
    // }

    if (req.method === 'GET') {
      return await handleGet(req, res);
    } else if (req.method === 'POST') {
      return await handlePost(req, res);
    }
  } catch (error) {
    handleApiError(error, res);
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const {
    page = '1',
    limit = '20',
    status,
    dealerId,
    search,
    fortnoxSynced,
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (status && typeof status === 'string') {
    where.status = status as InvoiceStatus;
  }

  if (dealerId && typeof dealerId === 'string') {
    where.dealerId = parseInt(dealerId);
  }

  if (search && typeof search === 'string') {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { dealer: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (fortnoxSynced === 'true') {
    where.fortnoxId = { not: null };
  } else if (fortnoxSynced === 'false') {
    where.fortnoxId = null;
  }

  // Get invoices with pagination
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        dealer: {
          select: {
            id: true,
            companyName: true,
            orgNumber: true,
            contactPerson: true,
          },
        },
        warranty: {
          select: {
            id: true,
            vehicleRegistrationNumber: true,
            ownerName: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);

  return res.status(200).json({
    invoices,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const {
    dealerId,
    warrantyId,
    amount,
    vatAmount,
    totalAmount,
    dueDate,
    syncToFortnox = false,
  } = req.body;

  // Validate required fields
  if (!dealerId || !warrantyId || !amount || !vatAmount || !totalAmount || !dueDate) {
    return res.status(400).json({
      message: 'Missing required fields: dealerId, warrantyId, amount, vatAmount, totalAmount, dueDate',
    });
  }

  // Verify dealer and warranty exist
  const [dealer, warranty] = await Promise.all([
    prisma.dealer.findUnique({ where: { id: dealerId } }),
    prisma.warranty.findUnique({ where: { id: warrantyId } }),
  ]);

  if (!dealer) {
    return res.status(404).json({ message: 'Dealer not found' });
  }

  if (!warranty) {
    return res.status(404).json({ message: 'Warranty not found' });
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      dealerId,
      warrantyId,
      amount,
      vatAmount,
      totalAmount,
      dueDate: new Date(dueDate),
      status: InvoiceStatus.PENDING,
    },
    include: {
      dealer: true,
      warranty: {
        include: {
          product: true,
        },
      },
    },
  });

  // Sync to Fortnox if requested
  if (syncToFortnox) {
    try {
      await FortnoxService.syncInvoiceToFortnox(invoice.id);

      // Reload invoice to get updated Fortnox data
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          dealer: true,
          warranty: {
            include: {
              product: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: 'Invoice created and synced to Fortnox successfully',
        invoice: updatedInvoice,
      });
    } catch (error) {
      console.error('Error syncing to Fortnox:', error);
      return res.status(201).json({
        message: 'Invoice created but failed to sync to Fortnox',
        invoice,
        syncError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(201).json({
    message: 'Invoice created successfully',
    invoice,
  });
}

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Get count of invoices this month
  const startOfMonth = new Date(year, new Date().getMonth(), 1);
  const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);

  const count = await prisma.invoice.count({
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
