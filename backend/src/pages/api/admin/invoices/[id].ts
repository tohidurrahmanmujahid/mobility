/**
 * Invoice Details API
 *
 * GET /api/admin/invoices/[id] - Get single invoice
 * PUT /api/admin/invoices/[id] - Update invoice
 * DELETE /api/admin/invoices/[id] - Delete invoice
 *
 * Admin only endpoint
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, InvoiceStatus, UserRole, Permission } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate method
    if (!validateMethod(req, res, ['GET', 'PUT', 'DELETE'])) return;

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

    if (req.method === 'GET') {
      return await handleGet(invoiceId, res);
    } else if (req.method === 'PUT') {
      return await handlePut(invoiceId, req, res, user);
    } else if (req.method === 'DELETE') {
      return await handleDelete(invoiceId, req, res, user);
    }
  } catch (error) {
    handleApiError(error, res);
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(invoiceId: number, res: NextApiResponse) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      dealer: {
        select: {
          id: true,
          companyName: true,
          orgNumber: true,
          address: true,
          postalCode: true,
          city: true,
          contactPerson: true,
        },
      },
      warranty: {
        include: {
          product: true,
          dealer: {
            select: {
              companyName: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  return res.status(200).json({ invoice });
}

async function handlePut(invoiceId: number, req: NextApiRequest, res: NextApiResponse, user: { id: number }) {
  const { status, paidAt, sentAt } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  // Build update data
  const updateData: any = {};

  if (status && Object.values(InvoiceStatus).includes(status)) {
    updateData.status = status;

    // Auto-set timestamps based on status
    if (status === InvoiceStatus.SENT && !invoice.sentAt) {
      updateData.sentAt = new Date();
    }
    if (status === InvoiceStatus.PAID && !invoice.paidAt) {
      updateData.paidAt = new Date();
    }
  }

  if (paidAt !== undefined) {
    updateData.paidAt = paidAt ? new Date(paidAt) : null;
  }

  if (sentAt !== undefined) {
    updateData.sentAt = sentAt ? new Date(sentAt) : null;
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
    include: {
      dealer: true,
      warranty: {
        include: {
          product: true,
        },
      },
    },
  });

  // Audit log: invoice updated
  await auditLog({
    action: 'UPDATE',
    entity: 'invoice',
    entityId: invoiceId,
    user: { id: user.id },
    before: { status: invoice.status },
    after: { status: updatedInvoice.status },
    req,
  });

  return res.status(200).json({
    message: 'Invoice updated successfully',
    invoice: updatedInvoice,
  });
}

async function handleDelete(invoiceId: number, req: NextApiRequest, res: NextApiResponse, user: { id: number }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  // Prevent deletion if synced to Fortnox
  if (invoice.fortnoxId) {
    return res.status(400).json({
      message: 'Cannot delete invoice that has been synced to Fortnox',
    });
  }

  await prisma.invoice.delete({
    where: { id: invoiceId },
  });

  // Audit log: invoice deleted
  await auditLog({
    action: 'DELETE',
    entity: 'invoice',
    entityId: invoiceId,
    user: { id: user.id },
    before: { status: invoice.status, fortnoxId: invoice.fortnoxId },
    req,
  });

  return res.status(200).json({
    message: 'Invoice deleted successfully',
  });
}
