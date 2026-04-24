import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { handleFileUpload } from '@/utils/fileUpload';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';

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
  if (req.method === 'GET') {
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
      const products = await prisma.product.findMany({
        where: {
          isDeleted: false  // Only show non-deleted products (admin can see both active and inactive)
        },
        include: {
          _count: {
            select: {
              warranties: true
            }
          }
        },
        orderBy: [
          { priority: 'asc' },  // Sort by priority first (lower number = higher priority)
          { createdAt: 'desc' }
        ]
      });

      res.status(200).json({ products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  } else if (req.method === 'POST') {
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

      // Generate file URL if file was uploaded
      let pdfUrl = null;
      if (uploadedFile) {
        pdfUrl = `/api/files/serve?type=products&file=${uploadedFile.filename}`;
      }

      const product = await prisma.product.create({
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
          priority: priority ? parseInt(priority) : 1,
          pdfUrl
        }
      });

      await auditLog({ action: 'CREATE', entity: 'product', entityId: product.id, user, after: product, req });

      res.status(201).json({
        message: 'Product created successfully',
        product
      });

    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Failed to create product' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}