import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { registrationNumber, mileage } = req.query;

  if (!registrationNumber || typeof registrationNumber !== 'string') {
    return res.status(400).json({ message: 'Registration number is required' });
  }

  if (!mileage || typeof mileage !== 'string' || isNaN(Number(mileage.replace(/\s/g, '')))) {
    return res.status(400).json({ message: 'Valid mileage is required' });
  }

  try {
    // Look up vehicle from cache (should already be cached for dealer's owner)
    const vehicleCache = await prisma.vehicleApiCache.findUnique({
      where: { registrationNumber: registrationNumber.toUpperCase().trim() }
    });

    if (!vehicleCache) {
      return res.status(404).json({ message: 'Vehicle not found in dealer inventory' });
    }

    // Validate mileage (basic validation - must be positive)
    const userMileage = Number(mileage.replace(/\s/g, ''));
    if (userMileage <= 0) {
      return res.status(400).json({ message: 'Mileage must be greater than 0' });
    }

    // Return vehicle data with user-provided mileage
    res.status(200).json({
      message: 'Vehicle validated successfully',
      vehicle: {
        registrationNumber: vehicleCache.registrationNumber,
        vin: vehicleCache.vin || '',
        make: vehicleCache.make || '',
        model: vehicleCache.model || '',
        year: vehicleCache.modelYear || vehicleCache.vehicleYear || 0,
        fuelType: vehicleCache.fuelType,
        color: vehicleCache.color,
        status: vehicleCache.status,
        vehicleType: vehicleCache.vehicleType,
        transmission: vehicleCache.transmission,
        power: vehicleCache.power,
        powerHp: vehicleCache.powerHp,
        co2: vehicleCache.co2,
        emissionClass: vehicleCache.emissionClass,
        ecoClass: vehicleCache.ecoClass,
        inspection: vehicleCache.inspection,
        inspectionValidUntil: vehicleCache.inspectionValidUntil,
        mileage: userMileage
      }
    });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}