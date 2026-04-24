import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';


/**
 * Public API endpoint to get available warranty products
 *
 * GET /api/v1/products - Get all products or filter by vehicle data
 *
 * Query parameters (optional):
 * - make: Vehicle make
 * - model: Vehicle model
 * - year: Vehicle year
 * - mileage: Vehicle mileage
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {

    // Get all active (non-deleted, active, and published) products
    const allProducts = await prisma.product.findMany({
      where: {
        isDeleted: false,  // Not deleted
        isActive: true,    // And active
        isPublished: true  // And published
      },
      orderBy: [
        { priority: 'asc' },  // Sort by priority first (lower number = higher priority)
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        durationMonths: true,
        premium: true,
        insuranceAmount: true,
        vehicleType: true,
        maxAge: true,
        maxKm: true,
        maxHk: true,
        pdfUrl: true,
        description: true,
        priority: true,
        createdAt: true,
      }
    });


    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      count: allProducts.length,
      products: allProducts.map(product => ({
        id: product.id,
        name: product.name,
        durationMonths: product.durationMonths,
        premium: product.premium,
        insuranceAmount: product.insuranceAmount,
        vehicleType: product.vehicleType,
        maxAge: product.maxAge,
        maxKm: product.maxKm,
        maxHk: product.maxHk,
        pdfUrl: product.pdfUrl,
        description: product.description,
        priority: product.priority,
      })),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
