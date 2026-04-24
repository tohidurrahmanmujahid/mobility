import { NextApiRequest, NextApiResponse } from 'next';
import { UserRole, Permission } from '@prisma/client';
import { authenticateUser, requireRole } from '@/utils/Auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/utils/permissions';
import { lookupVehicle, lookupVehiclesByOwner } from '@/lib/vehicle-lookup';

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
          message: 'Du saknar behörighet för fordonssökning. Kontakta din administratör för att få tillgång till denna funktion.'
        });
      }
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { registrationNumber, dealerId } = req.query;

  if (!registrationNumber || typeof registrationNumber !== 'string') {
    return res.status(400).json({ message: 'Registration number is required' });
  }

  if (!dealerId) {
    return res.status(400).json({ message: 'Dealer is required' });
  }

  try {
    const dealer = await prisma.dealer.findUnique({
      where: { id: Number(dealerId) }
    });
    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }
    const ownerId = dealer.ownerId;
    if (!ownerId) {
      return res.status(400).json({ message: 'Dealer does not have an owner assigned' });
    }
    const regNo = registrationNumber.toUpperCase().trim();

    // Try to lookup vehicle (checks cache first, then BILUPPGIFTER API if not found)
    const vehicleData = await lookupVehicle(regNo, ownerId);

    if (!vehicleData) {
      return res.status(404).json({
        message: 'Vehicle not found. Please verify the registration number is correct.'
      });
    }

    // Return vehicle data with user-provided mileage
    res.status(200).json({
      message: 'Vehicle validated successfully',
      vehicle: {
        registrationNumber: vehicleData.registrationNumber,
        vin: vehicleData.vin || '',
        make: vehicleData.make || '',
        model: vehicleData.model || '',
        year: vehicleData.year || 0,
        fuelType: vehicleData.fuelType,
        color: vehicleData.color,
        status: vehicleData.status,
        vehicleType: vehicleData.vehicleType,
        transmission: vehicleData.transmission,
        power: vehicleData.power,
        powerHp: vehicleData.powerHp,
        co2: vehicleData.co2,
        emissionClass: vehicleData.emissionClass,
        ecoClass: vehicleData.ecoClass,
        inspection: vehicleData.inspection,
        inspectionValidUntil: vehicleData.inspectionValidUntil,
      }
    });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    res.status(500).json({ message: 'Failed to lookup vehicle. Please try again later.' });
  }
}