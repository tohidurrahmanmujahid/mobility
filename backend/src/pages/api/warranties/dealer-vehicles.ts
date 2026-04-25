import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser } from '@/utils/Auth';
import { lookupOwner } from '@/lib/owner-lookup';
import { lookupVehiclesByOwner } from '@/lib/vehicle-lookup';
import { UserRole, Permission } from '@prisma/client';
import { hasPermission } from '@/utils/permissions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // If user is admin, check for REGISTERED_PRODUCTS permission
  if (user.userType === 'USER' && user.role === UserRole.ADMIN) {
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
          message: 'Du saknar behörighet att visa fordon för garantiregistrering. Kontakta din administratör för att få tillgång till denna funktion.'
        });
      }
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { dealerId } = req.query;

  // Determine which dealer ID to use
  let targetDealerId: number;

  if (dealerId && typeof dealerId === 'string') {
    targetDealerId = parseInt(dealerId, 10);
    if (isNaN(targetDealerId)) {
      return res.status(400).json({ message: 'Invalid dealer ID' });
    }
  } else {
    // Fallback to authenticated user's dealerId
    targetDealerId = user.dealerId || 0;
  }

  try {
    // Get the dealer
    const dealer = await prisma.dealer.findUnique({
      where: { id: targetDealerId },
      include: {
        owner: {
          include: {
            vehicles: {
              orderBy: {
                registrationNumber: 'asc'
              }
            }
          }
        }
      }
    });

    if (!dealer) {
      return res.status(404).json({ message: 'Dealer not found' });
    }

    if (!dealer.owner) {
      return res.status(200).json({ vehicles: [], owner: null });
    }

    // Check if owner data needs refresh (>= 1 month old)
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const now = new Date();
    const lastFetched = new Date(dealer.owner.lastFetched);
    const timeSinceLastFetch = now.getTime() - lastFetched.getTime();

    if (timeSinceLastFetch >= ONE_MONTH_MS) {
      console.log(`Owner data is ${Math.floor(timeSinceLastFetch / (24 * 60 * 60 * 1000))} days old. Refreshing...`);

      try {
        // Re-fetch owner data
        const cleanOrgNumber = dealer?.owner?.idnr?.replace(/[^0-9]/g, '');
        if (cleanOrgNumber.length === 10) {
          await lookupOwner(cleanOrgNumber);

          // Fetch latest vehicles from API
          const apiVehicles = await lookupVehiclesByOwner(cleanOrgNumber);

          // Get current cached vehicles for this owner
          const cachedVehicles = await prisma.vehicleApiCache.findMany({
            where: { ownerId: dealer.owner.id }
          });

          // Create a map of API vehicles by registration number
          const apiVehicleMap = new Map(
            apiVehicles.map(v => [v.registrationNumber, v])
          );

          // Create a map of cached vehicles by registration number
          const cachedVehicleMap = new Map(
            cachedVehicles.map(v => [v.registrationNumber, v])
          );

          // Remove vehicles that exist in cache but not in API
          for (const cachedVehicle of cachedVehicles) {
            if (!apiVehicleMap.has(cachedVehicle.registrationNumber)) {
              console.log(`Removing stale vehicle: ${cachedVehicle.registrationNumber}`);
              await prisma.vehicleApiCache.delete({
                where: { id: cachedVehicle.id }
              });
            }
          }

          console.log(`Vehicle data refreshed. Synced ${apiVehicles.length} vehicles.`);
        }
      } catch (refreshError) {
        console.error('Error refreshing owner/vehicle data:', refreshError);
        // Continue with existing cached data if refresh fails
      }

      // Re-fetch dealer with updated vehicles
      const updatedDealer = await prisma.dealer.findUnique({
        where: { id: targetDealerId },
        include: {
          owner: {
            include: {
              vehicles: {
                orderBy: {
                  registrationNumber: 'asc'
                }
              }
            }
          }
        }
      });

      if (updatedDealer?.owner) {
        dealer.owner.vehicles = updatedDealer.owner.vehicles;
      }
    }

    // Extract owner information
    const ownerInfo = {
      name: dealer.owner.name || dealer.companyName || '',
      phone: dealer.owner.phone
        ? (Array.isArray(dealer.owner.phone)
          ? (dealer.owner.phone as any[])[0]?.number || ''
          : '')
        : '',
      // Organization number as personnummer for company
      personnummer: dealer.owner.idnr || dealer.orgNumber || '',
      // For email, we'll need to leave it empty or use dealer contact
      email: ''
    };

    // Get all active warranties for vehicles from this dealer
    const existingWarranties = await prisma.warranty.findMany({
      where: {
        dealerId: targetDealerId,
        status: 'ACTIVE',
        isDeleted: false // Exclude soft-deleted warranties
      },
      select: {
        vehicleRegistrationNumber: true
      }
    });

    // Create a set of registration numbers that already have warranties
    const warrantyRegistrationNumbers = new Set(
      existingWarranties.map(w => w.vehicleRegistrationNumber)
    );

    // Transform vehicle cache data to VehicleData format with owner info
    // Filter out vehicles that already have a warranty
    const vehicles = dealer.owner.vehicles
      .filter(v => !warrantyRegistrationNumbers.has(v.registrationNumber))
      .map(v => ({
        registrationNumber: v.registrationNumber,
        vin: v.vin || '',
        make: v.make || '',
        model: v.model || '',
        year: v.modelYear || v.vehicleYear || 0,
        fuelType: v.fuelType,
        color: v.color,
        status: v.status,
        vehicleType: v.vehicleType,
        transmission: v.transmission,
        power: v.power,
        powerHp: v.powerHp,
        co2: v.co2,
        emissionClass: v.emissionClass,
        ecoClass: v.ecoClass,
        inspection: v.inspection,
        inspectionValidUntil: v.inspectionValidUntil,
        owner: ownerInfo
      }));

    res.status(200).json({ vehicles, owner: ownerInfo });
  } catch (error) {
    console.error('Error fetching dealer vehicles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
