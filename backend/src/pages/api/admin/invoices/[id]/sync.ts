/**
 * Sync Invoice to Fortnox API
 *
 * POST /api/admin/invoices/[id]/sync - Sync invoice to Fortnox
 *
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, UserRole, Permission } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import FortnoxService from '@/lib/fortnox';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate method
    if (!validateMethod(req, res, ['POST'])) return;

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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    const invoiceId = parseInt(id);

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if already synced
    if (invoice.fortnoxId) {
      return res.status(400).json({
        message: 'Invoice already synced to Fortnox',
        fortnoxId: invoice.fortnoxId,
      });
    }

    // Check if Fortnox is configured
    const isConfigured = await FortnoxService.isConfigured();
    if (!isConfigured) {
      return res.status(400).json({
        message: 'Fortnox is not configured. Please configure Fortnox in settings.',
      });
    }

    // Sync to Fortnox
    await FortnoxService.syncInvoiceToFortnox(invoiceId);

    // Get updated invoice
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        dealer: true,
        warranty: {
          include: {
            product: true,
          },
        },
      },
    });

    // Audit log: invoice synced to Fortnox
    await auditLog({
      action: 'UPDATE',
      entity: 'invoice',
      entityId: invoiceId,
      user: { id: user.id },
      before: { fortnoxId: null },
      after: { fortnoxStatus: 'SYNCED', fortnoxId: updatedInvoice?.fortnoxId },
      req,
    });

    return res.status(200).json({
      message: 'Invoice synced to Fortnox successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error syncing invoice to Fortnox:', error);
    handleApiError(error, res);
  } finally {
    await prisma.$disconnect();
  }
}
