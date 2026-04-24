import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { handleFileUpload } from '@/utils/fileUpload';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  const productId = parseInt(id);

  if (req.method === 'PUT') {
    try {
      // Handle file upload and parse form data
      let uploadResult: any = null;
      try {
        uploadResult = await handleFileUpload(req, res);
      } catch (uploadError: any) {
        console.error('File upload error:', uploadError);
        const errorMessage = uploadError?.message || 'File upload failed';
        return res.status(400).json({
          message: errorMessage,
          details: 'Please ensure the upload directory exists and has proper write permissions.'
        });
      }

      // Check authentication after parsing the form data
      const user = authenticateUser(req);
      if (!user || !requireRole(UserRole.ADMIN, user)) {
        return res.status(401).json({ message: 'Admin access required' });
      }

      // Check for PRODUCTS permission
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

        const permissionCheck = requirePermission(userPermissions, Permission.PRODUCTS);
        if (!permissionCheck.hasPermission) {
          return res.status(403).json({ message: permissionCheck.errorMessage });
        }
      }

      const formData = uploadResult.fields;
      const uploadedFile = uploadResult.file;

      const {
        name,
        description,
        premium,
        insuranceAmount,
        durationMonths,
        vehicleType,
        maxAge,
        maxKm,
        maxHk,
        priority
      } = formData;

      if (!name || !premium || !durationMonths || !vehicleType || !maxAge || !maxKm || !maxHk) {
        return res.status(400).json({
          message: 'All fields are required: name, premium, durationMonths, vehicleType, maxAge, maxKm, maxHk'
        });
      }

      // Get existing product to potentially delete old file
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Handle file URL - keep existing if no new file uploaded
      let pdfUrl = existingProduct.pdfUrl;
      if (uploadedFile) {
        // Delete old file if it exists
        if (existingProduct.pdfUrl) {
          try {
            // Extract filename from various URL formats
            let oldFileName = '';
            if (existingProduct.pdfUrl.includes('file=')) {
              // New format: /api/files/serve?type=products&file=xxx.pdf
              const match = existingProduct.pdfUrl.match(/file=([^&]+)/);
              oldFileName = match ? match[1] : '';
            } else {
              // Old format: /uploads/products/xxx.pdf or /api/uploads/products/xxx.pdf
              oldFileName = path.basename(existingProduct.pdfUrl);
            }
            if (oldFileName) {
              const oldFilePath = path.join(process.cwd(), 'public', 'uploads', 'products', oldFileName);
              if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
              }
            }
          } catch (error) {
            console.error('Error deleting old file:', error);
          }
        }
        pdfUrl = `/api/files/serve?type=products&file=${uploadedFile.filename}`;
      }

      const product = await prisma.product.update({
        where: { id: productId },
        data: {
          name,
          description: description || null,
          premium: parseFloat(premium),
          insuranceAmount: insuranceAmount ? parseFloat(insuranceAmount) : 0,
          durationMonths: parseInt(durationMonths),
          vehicleType,
          maxAge: parseInt(maxAge),
          maxKm: parseInt(maxKm),
          maxHk: parseInt(maxHk),
          priority: priority !== undefined ? parseInt(priority) : existingProduct.priority,
          pdfUrl
        }
      });

      await auditLog({ action: 'UPDATE', entity: 'product', entityId: product.id, user, before: existingProduct, after: product, req });

      res.status(200).json({
        message: 'Product updated successfully',
        product
      });

    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Failed to update product' });
    }
  } else if (req.method === 'PATCH') {
    // PATCH for toggling active status (activate/deactivate)
    // Parse JSON body manually since bodyParser is disabled
    let body: any = {};
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const data = Buffer.concat(chunks).toString();
      body = JSON.parse(data);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON body' });
    }

    const user = authenticateUser(req);
    if (!user || !requireRole(UserRole.ADMIN, user)) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    // Check for PRODUCTS permission
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

      const permissionCheck = requirePermission(userPermissions, Permission.PRODUCTS);
      if (!permissionCheck.hasPermission) {
        return res.status(403).json({ message: permissionCheck.errorMessage });
      }
    }

    try {
      const { isActive, isPublished, priority } = body;

      // At least one field must be provided
      if (typeof isActive !== 'boolean' && typeof isPublished !== 'boolean' && typeof priority !== 'number') {
        return res.status(400).json({ message: 'At least one of isActive, isPublished, or priority fields is required' });
      }

      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      });

      const updateData: { isActive?: boolean; isPublished?: boolean; priority?: number } = {};
      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive;
      }
      if (typeof isPublished === 'boolean') {
        updateData.isPublished = isPublished;
      }
      if (typeof priority === 'number') {
        updateData.priority = priority;
      }

      const product = await prisma.product.update({
        where: { id: productId },
        data: updateData
      });

      await auditLog({ action: 'UPDATE', entity: 'product', entityId: product.id, user, before: existingProduct, after: product, req });

      // Build response message
      let message = 'Product updated successfully';
      if (typeof isActive === 'boolean' && typeof isPublished !== 'boolean' && typeof priority !== 'number') {
        message = `Product ${isActive ? 'activated' : 'deactivated'} successfully`;
      } else if (typeof isPublished === 'boolean' && typeof isActive !== 'boolean' && typeof priority !== 'number') {
        message = `Product ${isPublished ? 'published' : 'unpublished'} successfully`;
      } else if (typeof priority === 'number' && typeof isActive !== 'boolean' && typeof isPublished !== 'boolean') {
        message = `Product priority updated to ${priority}`;
      }

      res.status(200).json({
        message,
        product
      });
    } catch (error) {
      console.error('Error updating product status:', error);
      res.status(500).json({ message: 'Failed to update product status' });
    }
  } else if (req.method === 'DELETE') {
    // For DELETE, we don't need file upload handling, so we can check auth directly
    const user = authenticateUser(req);
    if (!user || !requireRole(UserRole.ADMIN, user)) {
      return res.status(401).json({ message: 'Admin access required' });
    }

    // Check for PRODUCTS permission AND super admin status
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

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only super admins can delete products
    if (!currentUser.isSuperAdmin) {
      return res.status(403).json({
        message: 'Only super administrators can delete products. Regular admins can deactivate products instead.'
      });
    }

    const userPermissions = {
      isSuperAdmin: currentUser.isSuperAdmin,
      permissions: currentUser.permissions
    };

    const permissionCheck = requirePermission(userPermissions, Permission.PRODUCTS);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }

    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          _count: {
            select: {
              warranties: true
            }
          }
        }
      });

      if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (existingProduct.isDeleted) {
        return res.status(400).json({ message: 'Product is already deleted' });
      }

      // Soft delete - just mark as deleted, don't actually remove from database
      // This preserves referential integrity with warranties
      await prisma.product.update({
        where: { id: productId },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      await auditLog({ action: 'DELETE', entity: 'product', entityId: productId, user, before: existingProduct, req });

      res.status(200).json({
        message: 'Product deleted successfully',
        warrantiesCount: existingProduct._count.warranties
      });

    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}