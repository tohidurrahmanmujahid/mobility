import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateUser } from '@/utils/Auth';
import { lookupOwner } from '@/lib/owner-lookup';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const userInfo = authenticateUser(req);
  if (!userInfo) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Allow both dealers and admins to use this endpoint
  if (userInfo.userType !== 'DEALER' && userInfo.userType !== 'DEALER_STAFF' && userInfo.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { personnummer } = req.query;

  if (!personnummer || typeof personnummer !== 'string') {
    return res.status(400).json({ message: 'Personnummer is required' });
  }

  // Clean up personnummer - remove any dashes and spaces
  const cleanPersonnummer = personnummer.replace(/[-\s]/g, '');

  // Validate personnummer format (10 or 12 digits)
  if (!/^\d{10,12}$/.test(cleanPersonnummer)) {
    return res.status(400).json({ message: 'Invalid personnummer format' });
  }

  try {
    const ownerData = await lookupOwner(cleanPersonnummer);

    if (!ownerData) {
      return res.status(404).json({ message: 'Person not found' });
    }

    // Parse the name into firstname and lastname
    let firstname = '';
    let lastname = '';

    if (ownerData.givenName) {
      firstname = ownerData.givenName;
    }

    if (ownerData.name) {
      // The API typically returns name as "Lastname, Firstname" or just "Full Name"
      // If givenName is provided, name is likely the lastname
      if (ownerData.givenName) {
        lastname = ownerData.name;
      } else {
        // Try to split the name
        const nameParts = ownerData.name.split(' ');
        if (nameParts.length > 1) {
          firstname = nameParts.slice(0, -1).join(' ');
          lastname = nameParts[nameParts.length - 1];
        } else {
          firstname = ownerData.name;
        }
      }
    }

    // Get phone number (prefer mobile)
    let phone = '';
    if (ownerData.phone && ownerData.phone.length > 0) {
      const mobilePhone = ownerData.phone.find(p => p.type === 'Mobile');
      const anyPhone = ownerData.phone[0];
      phone = mobilePhone?.number || anyPhone?.number || '';
    }

    res.status(200).json({
      personnummer: cleanPersonnummer,
      firstname,
      lastname,
      fullName: ownerData.name || `${firstname} ${lastname}`.trim(),
      address: ownerData.address || '',
      postnummer: ownerData.postCode || '',
      ort: ownerData.city || '',
      phone,
      // Include raw data for reference
      raw: {
        name: ownerData.name,
        givenName: ownerData.givenName,
        address: ownerData.address,
        postCode: ownerData.postCode,
        city: ownerData.city,
        phone: ownerData.phone
      }
    });
  } catch (error) {
    console.error('Error looking up person:', error);
    res.status(500).json({ message: 'Failed to lookup person data' });
  }
}
