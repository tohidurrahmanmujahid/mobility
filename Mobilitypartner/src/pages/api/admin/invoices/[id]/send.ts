/**
 * Send Invoice via Fortnox API
 *
 * POST /api/admin/invoices/[id]/send - Send invoice by email via Fortnox
 *
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, InvoiceStatus, UserRole, Permission } from '@prisma/client';
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

    // Check if synced to Fortnox
    if (!invoice.fortnoxId) {
      return res.status(400).json({
        message: 'Invoice must be synced to Fortnox before sending',
      });
    }

    // Send invoice via Fortnox
    await FortnoxService.sendInvoice(invoice.fortnoxId);

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.SENT,
        sentAt: new Date(),
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

    // Audit log: invoice sent
    await auditLog({
      action: 'UPDATE',
      entity: 'invoice',
      entityId: invoiceId,
      user: { id: user.id },
      before: { status: invoice.status },
      after: { status: 'SENT' },
      req,
    });

    return res.status(200).json({
      message: 'Invoice sent successfully via Fortnox',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error sending invoice via Fortnox:', error);
    handleApiError(error, res);
  } finally {
    await prisma.$disconnect();
  }
}
