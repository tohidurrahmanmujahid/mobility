/**
 * Owner Lookup Service - Biluppgifter.se Integration
 *
 * This service provides organization/owner information lookup using the Biluppgifter.se API
 * with database caching to minimize API calls and improve performance.
 *
 * API Documentation: https://data.biluppgifter.se
 */

import { prisma } from '@/lib/prisma';

interface PhoneData {
  number: string | null;
  type: 'Landline' | 'Mobile';
  nix: boolean | null;
  nixDate: string | null;
}

interface OwnerApiResponse {
  id: string | null;
  idnr: string | null;
  status: string | null;
  name: string | null;
  given_name: string | null;
  address: string | null;
  co: string | null;
  post_code: string | null | number;
  city: string | null;
  sni: string[] | null;
  municipality: string | null;
  municipality_code: string | null;
  county: string | null;
  county_code: string | null;
  phone: PhoneData[] | null;
  nix: boolean | null;
  nix_date: string | null;
  protected: boolean | null;
  legal_form: string | null;
}

export interface OwnerData {
  id: string | null;
  idnr: string | null;
  status: string | null;
  name: string | null;
  givenName: string | null;
  address: string | null;
  co: string | null;
  postCode: string | null;
  city: string | null;
  sni: string[] | null;
  municipality: string | null;
  municipalityCode: string | null;
  county: string | null;
  countyCode: string | null;
  phone: PhoneData[] | null;
  nix: boolean | null;
  nixDate: string | null;
  protected: boolean | null;
  legalForm: string | null;
}

const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

/**
 * Get owner lookup API configuration
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
 * Fetch owner data from Biluppgifter.se API
 */
async function fetchFromApi(organizationNumber: string): Promise<OwnerData | null> {
  const config = getApiConfig();

  if (!config.apiKey) {
    console.error('Cannot fetch owner data: API key not configured');
    return null;
  }

  try {
    const url = `${config.apiUrl}/owner/${organizationNumber}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Owner not found: ${organizationNumber}`);
        return null;
      }
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data: OwnerApiResponse = await response.json();

    return {
      id: data.id,
      idnr: data.idnr,
      status: data.status,
      name: data.name,
      givenName: data.given_name,
      address: data.address,
      co: data.co,
      postCode: data.post_code?.toString() || null,
      city: data.city,
      sni: data.sni,
      municipality: data.municipality,
      municipalityCode: data.municipality_code,
      county: data.county,
      countyCode: data.county_code,
      phone: data.phone,
      nix: data.nix,
      nixDate: data.nix_date,
      protected: data.protected,
      legalForm: data.legal_form
    };

  } catch (error) {
    console.error('Error fetching owner data from API:', error);
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
 * Get owner data from cache or fetch from API
 *
 * @param organizationNumber - Organization number (10 digits)
 * @returns Owner data or null if not found
 */
export async function lookupOwner(organizationNumber: string): Promise<OwnerData | null> {
  const orgNo = organizationNumber.trim();

  try {
    // Check database cache first
    const cached = await prisma.ownerApiCache.findUnique({
      where: { idnr: orgNo }
    });

    // If cache exists and is valid, return cached data
    if (cached && isCacheValid(cached.lastFetched)) {
      console.log(`Using cached owner data for: ${orgNo}`);
      return {
        id: cached.id.toString(),
        idnr: cached.idnr,
        status: cached.status,
        name: cached.name,
        givenName: cached.givenName,
        address: cached.address,
        co: cached.co,
        postCode: cached.postCode,
        city: cached.city,
        sni: cached.sni ? (cached.sni as string[]) : null,
        municipality: cached.municipality,
        municipalityCode: cached.municipalityCode,
        county: cached.county,
        countyCode: cached.countyCode,
        phone: cached.phone ? (cached.phone as PhoneData[]) : null,
        nix: cached.nix,
        nixDate: cached.nixDate ? cached.nixDate.toISOString() : null,
        protected: cached.protected,
        legalForm: cached.legalForm
      };
    }

    // Fetch from API
    console.log(`Fetching owner data from API for: ${orgNo}`);
    const ownerData = await fetchFromApi(orgNo);

    if (!ownerData) {
      return null;
    }

    // Update or create cache entry
    await prisma.ownerApiCache.upsert({
      where: { idnr: orgNo },
      update: {
        status: ownerData.status,
        name: ownerData.name,
        givenName: ownerData.givenName,
        address: ownerData.address,
        co: ownerData.co,
        postCode: ownerData.postCode,
        city: ownerData.city,
        sni: ownerData.sni,
        municipality: ownerData.municipality,
        municipalityCode: ownerData.municipalityCode,
        county: ownerData.county,
        countyCode: ownerData.countyCode,
        phone: ownerData.phone,
        nix: ownerData.nix,
        nixDate: ownerData.nixDate ? new Date(ownerData.nixDate) : null,
        protected: ownerData.protected,
        legalForm: ownerData.legalForm,
        lastFetched: new Date()
      },
      create: {
        idnr: orgNo,
        status: ownerData.status,
        name: ownerData.name,
        givenName: ownerData.givenName,
        address: ownerData.address,
        co: ownerData.co,
        postCode: ownerData.postCode,
        city: ownerData.city,
        sni: ownerData.sni,
        municipality: ownerData.municipality,
        municipalityCode: ownerData.municipalityCode,
        county: ownerData.county,
        countyCode: ownerData.countyCode,
        phone: ownerData.phone,
        nix: ownerData.nix,
        nixDate: ownerData.nixDate ? new Date(ownerData.nixDate) : null,
        protected: ownerData.protected,
        legalForm: ownerData.legalForm,
        lastFetched: new Date()
      }
    });

    console.log(`Owner data cached for: ${orgNo}`);
    return ownerData;

  } catch (error) {
    console.error('Error in owner lookup:', error);
    throw error;
  }
}

/**
 * Force refresh owner data from API (bypass cache)
 */
export async function refreshOwnerData(organizationNumber: string): Promise<OwnerData | null> {
  const orgNo = organizationNumber.trim();

  try {
    const ownerData = await fetchFromApi(orgNo);

    if (!ownerData) {
      return null;
    }

    // Update cache
    await prisma.ownerApiCache.upsert({
      where: { idnr: orgNo },
      update: {
        status: ownerData.status,
        name: ownerData.name,
        givenName: ownerData.givenName,
        address: ownerData.address,
        co: ownerData.co,
        postCode: ownerData.postCode,
        city: ownerData.city,
        sni: ownerData.sni,
        municipality: ownerData.municipality,
        municipalityCode: ownerData.municipalityCode,
        county: ownerData.county,
        countyCode: ownerData.countyCode,
        phone: ownerData.phone,
        nix: ownerData.nix,
        nixDate: ownerData.nixDate ? new Date(ownerData.nixDate) : null,
        protected: ownerData.protected,
        legalForm: ownerData.legalForm,
        lastFetched: new Date()
      },
      create: {
        idnr: orgNo,
        status: ownerData.status,
        name: ownerData.name,
        givenName: ownerData.givenName,
        address: ownerData.address,
        co: ownerData.co,
        postCode: ownerData.postCode,
        city: ownerData.city,
        sni: ownerData.sni,
        municipality: ownerData.municipality,
        municipalityCode: ownerData.municipalityCode,
        county: ownerData.county,
        countyCode: ownerData.countyCode,
        phone: ownerData.phone,
        nix: ownerData.nix,
        nixDate: ownerData.nixDate ? new Date(ownerData.nixDate) : null,
        protected: ownerData.protected,
        legalForm: ownerData.legalForm,
        lastFetched: new Date()
      }
    });

    return ownerData;

  } catch (error) {
    console.error('Error refreshing owner data:', error);
    throw error;
  }
}
