/**
 * Vehicle Lookup Service - Biluppgifter.se Integration
 *
 * This service provides vehicle information lookup using the Biluppgifter.se API
 * with database caching to minimize API calls and improve performance.
 *
 * API Documentation: https://data.biluppgifter.se
 */

import { prisma } from '@/lib/prisma';

interface VehicleApiResponse {
  vehicle: {
    regnr: string | null;
    vin: string | null;
    name: string | null;
    make: string | null;
    model: string | null;
    status: string | null;
    type: string | null;
    color: string | null;
    modelYear?: number | null | string;
    model_year?: number | null | string;
    vehicle_year?: number | null | string;
    vehicleYear?: number | null | string;
    transmission: string | null;
    inspection: string | null;
    inspectionValidUntil: string | null;
    inspection_valid_until: string | null;
    technical: {
      emissionClass: string | null;
      emission_class: string | null;
      ecoClass: string | null;
      eco_class: string | null;
      drive: Array<{
        fuel: string | null;
        power: number | null;
        power_hp: number | null;
        co2: number | null;
      }>;
    };
  };
}

export interface VehicleData {
  registrationNumber: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  status?: string;
  vehicleType?: string;
  color?: string;
  transmission?: string;
  fuelType?: string;
  power?: number;
  powerHp?: number;
  co2?: number;
  emissionClass?: string;
  ecoClass?: string;
  inspection?: string;
  inspectionValidUntil?: Date;
  mileage?: number;
}

const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

/**
 * Get vehicle lookup API configuration
 */
const getApiConfig = () => {
  const apiKey = process.env.BILUPPGIFTER_API_KEY;
  const apiUrl = process.env.BILUPPGIFTER_API_URL || 'https://data.biluppgifter.se/api/v1';

  if (!apiKey) {
    console.warn('BILUPPGIFTER_API_KEY environment variable is not set');
  }

  return {
    apiKey: apiKey || '',
    apiUrl
  };
};

/**
 * Fetch vehicle data from Biluppgifter.se API
 */
async function fetchFromApi(registrationNumber: string): Promise<VehicleData | null> {
  const config = getApiConfig();

  if (!config.apiKey) {
    console.error('Cannot fetch vehicle data: API key not configured');
    return null;
  }

  try {
    const url = `${config.apiUrl}/vehicle/regno/${registrationNumber}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Vehicle not found: ${registrationNumber}`);
        return null;
      }
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data: VehicleApiResponse = await response.json();
    const vehicle = data.vehicle;

    // Extract primary fuel type and power from drive array
    const primaryDrive = vehicle.technical?.drive?.[0];

    return {
      registrationNumber: registrationNumber.toUpperCase(),
      vin: vehicle.vin || undefined,
      make: vehicle.make || undefined,
      model: vehicle.model || undefined,
      year: vehicle.modelYear || vehicle.model_year || vehicle.vehicleYear || vehicle.vehicle_year ||  undefined,
      status: vehicle.status || undefined,
      vehicleType: vehicle.type || undefined,
      color: vehicle.color || undefined,
      transmission: vehicle.transmission || undefined,
      fuelType: primaryDrive?.fuel || undefined,
      power: primaryDrive?.power || undefined,
      powerHp: primaryDrive?.power_hp || undefined,
      co2: primaryDrive?.co2 || undefined,
      emissionClass: vehicle.technical?.emissionClass || vehicle.technical?.emission_class || undefined,
      ecoClass: vehicle.technical?.ecoClass || vehicle.technical?.eco_class || undefined,
      inspection: vehicle.inspection || undefined,
      inspectionValidUntil: vehicle.inspectionValidUntil ? new Date(vehicle.inspectionValidUntil) :  vehicle.inspection_valid_until ? new Date(vehicle.inspection_valid_until) : undefined
    };

  } catch (error) {
    console.error('Error fetching vehicle data from API:', error);
    throw error;
  }
}

/**
 * Check if cached data is still valid (less than 30 days old)
 */
function isCacheValid(lastFetched: Date): boolean {
  const expiryDate = new Date(lastFetched);
  expiryDate.setDate(expiryDate.getDate() + CACHE_EXPIRY_DAYS);
  return new Date() < expiryDate;
}

/**
 * Get vehicle data from cache or fetch from API
 *
 * @param registrationNumber - Vehicle registration number
 * @returns Vehicle data or null if not found
 */
export async function lookupVehicle(registrationNumber: string, ownerId: number): Promise<VehicleData | null> {
  const regNo = registrationNumber.toUpperCase().trim();

  try {
    // Check database cache first
    const cached = await prisma.vehicleApiCache.findUnique({
      where: { registrationNumber: regNo }
    });

    // If cache exists and is valid, return cached data
    if (cached && isCacheValid(cached.lastFetched)) {
      console.log(`Using cached vehicle data for: ${regNo}`);
      return {
        registrationNumber: cached.registrationNumber,
        vin: cached.vin || undefined,
        make: cached.make || undefined,
        model: cached.model || undefined,
        year: cached.modelYear || undefined,
        status: cached.status || undefined,
        vehicleType: cached.vehicleType || undefined,
        color: cached.color || undefined,
        transmission: cached.transmission || undefined,
        fuelType: cached.fuelType || undefined,
        power: cached.power || undefined,
        powerHp: cached.powerHp || undefined,
        co2: cached.co2 || undefined,
        emissionClass: cached.emissionClass || undefined,
        ecoClass: cached.ecoClass || undefined,
        inspection: cached.inspection || undefined,
        inspectionValidUntil: cached.inspectionValidUntil || undefined
      };
    }

    // Fetch from API
    console.log(`Fetching vehicle data from API for: ${regNo}`);
    const vehicleData = await fetchFromApi(regNo);

    if (!vehicleData) {
      return null;
    }

    // Update or create cache entry with retry logic for race conditions
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.vehicleApiCache.upsert({
          where: { registrationNumber: regNo },
          update: {
            vin: vehicleData.vin,
            make: vehicleData.make,
            model: vehicleData.model,
            status: vehicleData.status,
            vehicleType: vehicleData.vehicleType,
            color: vehicleData.color,
            modelYear: vehicleData.year,
            vehicleYear: vehicleData.year,
            transmission: vehicleData.transmission,
            fuelType: vehicleData.fuelType,
            power: vehicleData.power,
            powerHp: vehicleData.powerHp,
            co2: vehicleData.co2,
            emissionClass: vehicleData.emissionClass,
            ecoClass: vehicleData.ecoClass,
            inspection: vehicleData.inspection,
            inspectionValidUntil: vehicleData.inspectionValidUntil,
            lastFetched: new Date(),
            ownerId: ownerId
          },
          create: {
            registrationNumber: regNo,
            vin: vehicleData.vin,
            make: vehicleData.make,
            model: vehicleData.model,
            status: vehicleData.status,
            vehicleType: vehicleData.vehicleType,
            color: vehicleData.color,
            modelYear: vehicleData.year,
            vehicleYear: vehicleData.year,
            transmission: vehicleData.transmission,
            fuelType: vehicleData.fuelType,
            power: vehicleData.power,
            powerHp: vehicleData.powerHp,
            co2: vehicleData.co2,
            emissionClass: vehicleData.emissionClass,
            ecoClass: vehicleData.ecoClass,
            inspection: vehicleData.inspection,
            inspectionValidUntil: vehicleData.inspectionValidUntil,
            lastFetched: new Date(),
            ownerId: ownerId
          }
        });
        break; // Success, exit retry loop
      } catch (upsertError: any) {
        if (upsertError.code === 'P2002' && retries > 1) {
          // Unique constraint violation, likely race condition - retry
          console.log(`Retrying upsert for ${regNo}, attempts left: ${retries - 1}`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
        } else {
          throw upsertError;
        }
      }
    }

    console.log(`Vehicle data cached for: ${regNo}`);
    return vehicleData;

  } catch (error) {
    console.error('Error in vehicle lookup:', error);
    throw error;
  }
}

/**
 * Force refresh vehicle data from API (bypass cache)
 */
export async function refreshVehicleData(registrationNumber: string, ownerId?: number): Promise<VehicleData | null> {
  const regNo = registrationNumber.toUpperCase().trim();

  try {
    const vehicleData = await fetchFromApi(regNo);

    if (!vehicleData) {
      return null;
    }

    // Update cache with retry logic for race conditions
    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.vehicleApiCache.upsert({
          where: { registrationNumber: regNo },
          update: {
            vin: vehicleData.vin,
            make: vehicleData.make,
            model: vehicleData.model,
            status: vehicleData.status,
            vehicleType: vehicleData.vehicleType,
            color: vehicleData.color,
            modelYear: vehicleData.year,
            vehicleYear: vehicleData.year,
            transmission: vehicleData.transmission,
            fuelType: vehicleData.fuelType,
            power: vehicleData.power,
            powerHp: vehicleData.powerHp,
            co2: vehicleData.co2,
            emissionClass: vehicleData.emissionClass,
            ecoClass: vehicleData.ecoClass,
            inspection: vehicleData.inspection,
            inspectionValidUntil: vehicleData.inspectionValidUntil,
            lastFetched: new Date(),
            ...(ownerId && { ownerId })
          },
          create: {
            registrationNumber: regNo,
            vin: vehicleData.vin,
            make: vehicleData.make,
            model: vehicleData.model,
            status: vehicleData.status,
            vehicleType: vehicleData.vehicleType,
            color: vehicleData.color,
            modelYear: vehicleData.year,
            vehicleYear: vehicleData.year,
            transmission: vehicleData.transmission,
            fuelType: vehicleData.fuelType,
            power: vehicleData.power,
            powerHp: vehicleData.powerHp,
            co2: vehicleData.co2,
            emissionClass: vehicleData.emissionClass,
            ecoClass: vehicleData.ecoClass,
            inspection: vehicleData.inspection,
            inspectionValidUntil: vehicleData.inspectionValidUntil,
            lastFetched: new Date(),
            ...(ownerId && { ownerId })
          }
        });
        break; // Success, exit retry loop
      } catch (upsertError: any) {
        if (upsertError.code === 'P2002' && retries > 1) {
          // Unique constraint violation, likely race condition - retry
          console.log(`Retrying upsert for ${regNo}, attempts left: ${retries - 1}`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
        } else {
          throw upsertError;
        }
      }
    }

    return vehicleData;

  } catch (error) {
    console.error('Error refreshing vehicle data:', error);
    throw error;
  }
}

interface VehicleByOwnerApiResponse {
  owner: {
    id: string;
    idnr: number;
    status: string | null;
    name: string | null;
    given_name: string | null;
    address: string | null;
    co: string | null;
    post_code: number | string | null;
    city: string | null;
    sni: string[] | null;
    municipality: string | null;
    municipality_code: string | null;
    county: string | null;
    county_code: string | null;
    phone: Array<{
      number: string | null;
      type: 'Landline' | 'Mobile';
      nix: boolean | null;
      nix_date: string | null;
    }> | null;
    nix: boolean | null;
    nix_date: string | null;
    protected: boolean | null;
    legal_form: string | null;
  };
  vehicles: Array<{
    regnr: string | null;
    vin: string | null;
    name: string | null;
    make: string | null;
    model: string | null;
    status: string | null;
    type: string | null;
    color: string | null;
    model_year: number | null;
    vehicle_year: number | null;
    inspection: string | null;
    inspection_valid_until: string | null;
    transmission: string | null;
    technical: {
      emission_class: string | null;
      eco_class: string | null;
      drive: Array<{
        fuel: string | null;
        power: number | null;
        power_hp: number | null;
        co2: number | null;
      }>;
    };
  }>;
}

/**
 * Fetch vehicles by owner organization number from Biluppgifter.se API
 */
async function fetchVehiclesByOwnerFromApi(organizationNumber: string): Promise<VehicleData[]> {
  const config = getApiConfig();

  if (!config.apiKey) {
    console.error('Cannot fetch vehicles by owner: API key not configured');
    return [];
  }

  try {
    const url = `${config.apiUrl}/vehicle/owner/${organizationNumber}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No vehicles found for owner: ${organizationNumber}`);
        return [];
      }
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data: VehicleByOwnerApiResponse[] = await response.json();

    // The API returns an array with owner and vehicles
    // We need to extract all vehicles from all entries (though typically there's only one)
    const allVehicles: VehicleData[] = [];

    for (const entry of data) {
      if (!entry.vehicles || entry.vehicles.length === 0) {
        continue;
      }

      // Transform each vehicle to VehicleData
      const vehicles = entry.vehicles.map((vehicle) => {
        const primaryDrive = vehicle.technical?.drive?.[0];

        return {
          registrationNumber: (vehicle.regnr || '').toUpperCase(),
          vin: vehicle.vin || undefined,
          make: vehicle.make || undefined,
          model: vehicle.model || undefined,
          year: vehicle.model_year || vehicle.vehicle_year || undefined,
          status: vehicle.status || undefined,
          vehicleType: vehicle.type || undefined,
          color: vehicle.color || undefined,
          transmission: vehicle.transmission || undefined,
          fuelType: primaryDrive?.fuel || undefined,
          power: primaryDrive?.power || undefined,
          powerHp: primaryDrive?.power_hp || undefined,
          co2: primaryDrive?.co2 || undefined,
          emissionClass: vehicle.technical?.emission_class || undefined,
          ecoClass: vehicle.technical?.eco_class || undefined,
          inspection: vehicle.inspection || undefined,
          inspectionValidUntil: vehicle.inspection_valid_until ? new Date(vehicle.inspection_valid_until) : undefined
        };
      });

      allVehicles.push(...vehicles);
    }

    return allVehicles;

  } catch (error) {
    console.error('Error fetching vehicles by owner from API:', error);
    throw error;
  }
}

/**
 * Lookup vehicles by owner organization number and cache them
 *
 * @param organizationNumber - Organization number (10 digits)
 * @returns Array of vehicle data
 */
export async function lookupVehiclesByOwner(organizationNumber: string): Promise<VehicleData[]> {
  const orgNo = organizationNumber.trim();

  try {
    // First, check if owner exists in cache
    let ownerCache = await prisma.ownerApiCache.findUnique({
      where: { idnr: orgNo }
    });

    // If owner doesn't exist in cache, we need to create a minimal entry
    // This would typically be created by the owner lookup first
    if (!ownerCache) {
      console.log(`Owner not found in cache, creating minimal entry for: ${orgNo}`);
      ownerCache = await prisma.ownerApiCache.create({
        data: {
          idnr: orgNo,
          lastFetched: new Date()
        }
      });
    }

    // Fetch vehicles from API
    console.log(`Fetching vehicles from API for owner: ${orgNo}`);
    const vehicles = await fetchVehiclesByOwnerFromApi(orgNo);

    if (vehicles.length === 0) {
      console.log(`No vehicles found for owner: ${orgNo}`);
      return [];
    }

    // Cache each vehicle with owner reference
    for (const vehicleData of vehicles) {
      if (!vehicleData.registrationNumber) {
        console.warn('Skipping vehicle without registration number');
        continue;
      }

      // Retry logic for race conditions
      let retries = 3;
      while (retries > 0) {
        try {
          await prisma.vehicleApiCache.upsert({
            where: { registrationNumber: vehicleData.registrationNumber },
            update: {
              vin: vehicleData.vin,
              make: vehicleData.make,
              model: vehicleData.model,
              status: vehicleData.status,
              vehicleType: vehicleData.vehicleType,
              color: vehicleData.color,
              modelYear: vehicleData.year,
              vehicleYear: vehicleData.year,
              transmission: vehicleData.transmission,
              fuelType: vehicleData.fuelType,
              power: vehicleData.power,
              powerHp: vehicleData.powerHp,
              co2: vehicleData.co2,
              emissionClass: vehicleData.emissionClass,
              ecoClass: vehicleData.ecoClass,
              inspection: vehicleData.inspection,
              inspectionValidUntil: vehicleData.inspectionValidUntil,
              lastFetched: new Date(),
              ownerId: ownerCache.id
            },
            create: {
              registrationNumber: vehicleData.registrationNumber,
              vin: vehicleData.vin,
              make: vehicleData.make,
              model: vehicleData.model,
              status: vehicleData.status,
              vehicleType: vehicleData.vehicleType,
              color: vehicleData.color,
              modelYear: vehicleData.year,
              vehicleYear: vehicleData.year,
              transmission: vehicleData.transmission,
              fuelType: vehicleData.fuelType,
              power: vehicleData.power,
              powerHp: vehicleData.powerHp,
              co2: vehicleData.co2,
              emissionClass: vehicleData.emissionClass,
              ecoClass: vehicleData.ecoClass,
              inspection: vehicleData.inspection,
              inspectionValidUntil: vehicleData.inspectionValidUntil,
              lastFetched: new Date(),
              ownerId: ownerCache.id
            }
          });
          break; // Success, exit retry loop
        } catch (upsertError: any) {
          if (upsertError.code === 'P2002' && retries > 1) {
            // Unique constraint violation, likely race condition - retry
            console.log(`Retrying upsert for ${vehicleData.registrationNumber}, attempts left: ${retries - 1}`);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
          } else {
            // Log error but continue with next vehicle
            console.error(`Failed to cache vehicle ${vehicleData.registrationNumber}:`, upsertError);
            break;
          }
        }
      }
    }

    console.log(`Cached ${vehicles.length} vehicles for owner: ${orgNo}`);
    return vehicles;

  } catch (error) {
    console.error('Error in vehicles by owner lookup:', error);
    throw error;
  }
}
