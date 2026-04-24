import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole, Permission } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/utils/permissions';

interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType?: string;
  powerHp?: number;
}

function checkProductEligibility(vehicleData: VehicleInfo, product: any): boolean {
  try {
    // Check vehicle age
    const vehicleAge = new Date().getFullYear() - vehicleData.year;
    if (product.maxAge && vehicleAge > product.maxAge) {
      return false;
    }

    // Check mileage (maxKm in database)
    if (product.maxKm && vehicleData.mileage > product.maxKm) {
      return false;
    }

    // Check horsepower (maxHk in database)
    if (product.maxHk && vehicleData.powerHp && vehicleData.powerHp > product.maxHk) {
      return false;
    }

    // Check vehicle type matching (simplified - exact match for now)
    if (product.vehicleType) {
      // You may want to implement more sophisticated matching logic here
      // For now, this is a placeholder for vehicle type validation
    }

    return true;
  } catch (error) {
    console.error('Error checking product eligibility:', error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!requireRole(UserRole.DEALER, user) && !requireRole(UserRole.ADMIN, user)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // If user is admin, check for REGISTERED_PRODUCTS permission
  if (user.role === UserRole.ADMIN) {
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
          message: 'Du saknar behörighet att visa garantiprodukter. Kontakta din administratör för att få tillgång till denna funktion.'
        });
      }
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { vehicleData } = req.body;

  if (!vehicleData) {
    return res.status(400).json({ message: 'Vehicle data is required' });
  }
  
  // Validate required vehicle data fields
  if (!vehicleData.make || !vehicleData.model || vehicleData.mileage === undefined) {
    return res.status(400).json({
      message: 'Vehicle data must include make, model, year, and mileage'
    });
  }

  try {
    // Get all active, non-deleted products
    const allProducts = await prisma.product.findMany({
      where: {
        isDeleted: false,  // Not deleted
        isActive: true     // And active
      },
      orderBy: { name: 'asc' }
    });

    // Filter products based on vehicle eligibility
    const eligibleProducts = allProducts.filter(product =>
      checkProductEligibility(vehicleData, product)
    );

    // Group products by type and duration for better organization
    const groupedProducts = eligibleProducts.reduce((acc, product) => {
      // Extract product type from name (Bronze, Silver, Gold, etc.)
      const productType = product.name.split(' ')[0]; // Assumes format like "Bronze 12 months"

      if (!acc[productType]) {
        acc[productType] = [];
      }

      acc[productType].push({
        id: product.id,
        name: product.name,
        durationMonths: product.durationMonths,
        premium: product.premium,
        vehicleType: product.vehicleType,
        maxAge: product.maxAge,
        maxKm: product.maxKm,
        maxHk: product.maxHk,
        pdfUrl: product.pdfUrl
      });

      return acc;
    }, {} as any);

    res.status(200).json({
      message: 'Eligible products retrieved successfully',
      products: eligibleProducts.map(product => ({
        id: product.id,
        name: product.name,
        durationMonths: product.durationMonths,
        premium: product.premium,
        vehicleType: product.vehicleType,
        maxAge: product.maxAge,
        maxKm: product.maxKm,
        maxHk: product.maxHk,
        pdfUrl: product.pdfUrl
      })),
      groupedProducts,
      vehicleInfo: {
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        age: new Date().getFullYear() - vehicleData.year,
        mileage: vehicleData.mileage,
        powerHp: vehicleData.powerHp
      }
    });
  } catch (error) {
    console.error('Products lookup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}