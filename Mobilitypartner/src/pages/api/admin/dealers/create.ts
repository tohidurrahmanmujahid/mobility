import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { authenticateUser, requireRole, hashPassword } from '@/utils/Auth';
import { UserRole, Permission } from '@prisma/client';
import { sendDealerWelcomeSMS } from '@/lib/sms';
import { sendDealerWelcomeEmail } from '@/lib/email';
import { lookupOwner } from '@/lib/owner-lookup';
import { lookupVehiclesByOwner } from '@/lib/vehicle-lookup';
import { requirePermission } from '@/utils/permissions';
import { auditLog } from '@/lib/audit';

const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = authenticateUser(req);

  if (!user || !requireRole(UserRole.ADMIN, user)) {
    return res.status(401).json({ message: 'Admin access required' });
  }

  // Check for NEW_DEALER permission
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

    const permissionCheck = requirePermission(userPermissions, Permission.NEW_DEALER);
    if (!permissionCheck.hasPermission) {
      return res.status(403).json({ message: permissionCheck.errorMessage });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        companyName,
        orgNumber,
        address,
        postalCode,
        city,
        county,
        contactPerson,
        contactEmail,
        contactPhone,
        contactName
      } = req.body;

      if (!companyName || !orgNumber || !contactEmail || !contactName) {
        return res.status(400).json({
          message: 'Company name, organization number, contact email, and contact name are required'
        });
      }

      // Check if dealer already exists
      const existingDealer = await prisma.dealer.findUnique({
        where: { orgNumber }
      });

      if (existingDealer) {
        return res.status(409).json({ message: 'Dealer with this organization number already exists' });
      }

      // Check if dealer email already exists
      const existingDealerEmail = await prisma.dealer.findUnique({
        where: { email: contactEmail }
      });

      if (existingDealerEmail) {
        return res.status(409).json({ message: 'Dealer with this email already exists' });
      }

      // Generate random password for dealer login
      const generatedPassword = generatePassword();
      const hashedPassword = hashPassword(generatedPassword);

      // Lookup owner data and cache it before creating dealer
      let ownerDataCached = false;
      let ownerId: number | undefined = undefined;
      try {
        const cleanOrgNumber = orgNumber.replace(/[^0-9]/g, '');
        if (cleanOrgNumber.length === 10) {
          await lookupOwner(cleanOrgNumber);
          ownerDataCached = true;
          console.log(`Owner data cached for: ${cleanOrgNumber}`);

          // Get the cached owner to link to dealer
          const ownerCache = await prisma.ownerApiCache.findUnique({
            where: { idnr: cleanOrgNumber }
          });
          if (ownerCache) {
            ownerId = ownerCache.id;
          }
        }
      } catch (ownerError) {
        console.error('Error caching owner data:', ownerError);
        // Continue with dealer creation even if owner lookup fails
      }

      // Create dealer with authentication credentials
      // Status will be INKOMMEN (pending) by default
      // Account will be inactive until credentials are sent
      const dealer = await prisma.dealer.create({
        data: {
          companyName,
          orgNumber,
          address,
          postalCode,
          city,
          county,
          contactPerson,
          ownerId,
          // Add authentication fields
          name: contactName, // Person's name (required)
          email: contactEmail,
          passwordHash: hashedPassword,
          phone: contactPhone,
          role: 'OWNER', // This is the main dealer account
          isActive: false // Set to inactive until credentials are sent
          // status defaults to INKOMMEN, no need to specify
        }
      });

      // Fetch and cache vehicles for this dealer/owner
      let vehicleCount = 0;
      if (ownerDataCached) {
        try {
          const cleanOrgNumber = orgNumber.replace(/[^0-9]/g, '');
          const vehicles = await lookupVehiclesByOwner(cleanOrgNumber);
          vehicleCount = vehicles.length;
          console.log(`Cached ${vehicleCount} vehicles for dealer: ${companyName}`);
        } catch (vehicleError) {
          console.error('Error caching vehicles:', vehicleError);
          // Continue even if vehicle lookup fails
        }
      }

      // DO NOT send welcome email or SMS automatically
      // Admin will manually send credentials when cooperation agreement is signed
      // Store the generated password temporarily for admin to send later
      console.log(`Dealer created with INKOMMEN status. Password generated but not sent: ${companyName}`);

      await auditLog({
        action: 'CREATE',
        entity: 'dealer',
        entityId: dealer.id,
        user: { id: user.id, name: currentUser?.name ?? undefined, email: currentUser?.email ?? undefined },
        after: { id: dealer.id, companyName, orgNumber, contactEmail, contactName },
        req,
      });

      res.status(201).json({
        message: 'Dealer created successfully with status INKOMMEN. Login credentials can be sent manually.',
        dealer: dealer,
        vehiclesCached: vehicleCount,
        // Return the password so admin knows it exists (for immediate manual sending if needed)
        // In production, you might want to remove this or encrypt it
        temporaryPassword: generatedPassword
      });

    } catch (error) {
      console.error('Error creating dealer:', error);
      res.status(500).json({ message: 'Failed to create dealer' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}