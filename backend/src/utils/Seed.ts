import { hashPassword } from './Auth';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function seedDatabase() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (existingAdmin) {
    console.log('Database already seeded');
    return;
  }

  // Create default dealer
  const dealer = await prisma.dealer.create({
    data: {
      companyName: '4 Star Motors AB',
      orgNumber: '5561234567',
      address: 'Stockholm, Sweden',
      contactPerson: 'John Doe'
    }
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: hashPassword('admin123'),
      role: UserRole.ADMIN,
      name: 'System Administrator',
      phone: '+46701234567',
      isActive: true
    }
  });

  // Create dealer user
  const dealerUser = await prisma.user.create({
    data: {
      email: 'dealer@example.com',
      passwordHash: hashPassword('dealer123'),
      role: UserRole.DEALER,
      name: 'Dealer User',
      phone: '+46707654321',
      isActive: true,
      dealerId: dealer.id
    }
  });

  // Create warranty products
  const products = [
    {
      name: 'Bronze 12 months',
      durationMonths: 12,
      description: 'Basic warranty coverage',
      rules: {
        maxMileage: 150000,
        maxVehicleAge: 10,
        eligibleVehicleTypes: ['car', 'suv']
      },
      isActive: true
    },
    {
      name: 'Silver 24 months',
      durationMonths: 24,
      description: 'Standard warranty coverage',
      rules: {
        maxMileage: 120000,
        maxVehicleAge: 8,
        eligibleVehicleTypes: ['car', 'suv', 'van']
      },
      isActive: true
    },
    {
      name: 'Gold 36 months',
      durationMonths: 36,
      description: 'Premium warranty coverage',
      rules: {
        maxMileage: 100000,
        maxVehicleAge: 5,
        eligibleVehicleTypes: ['car', 'suv', 'van', 'motorcycle']
      },
      isActive: true
    },
    {
      name: 'Platina 24 months',
      durationMonths: 24,
      description: 'Luxury vehicle warranty',
      rules: {
        maxMileage: 80000,
        maxVehicleAge: 3,
        eligibleVehicleTypes: ['car', 'suv']
      },
      isActive: true
    },
    {
      name: 'Sport 12 months',
      durationMonths: 12,
      description: 'Sports vehicle warranty',
      rules: {
        maxMileage: 60000,
        maxVehicleAge: 4,
        eligibleVehicleTypes: ['sports_car']
      },
      isActive: true
    },
    {
      name: 'Electric 36 months',
      durationMonths: 36,
      description: 'Electric vehicle warranty',
      rules: {
        maxMileage: 100000,
        maxVehicleAge: 5,
        eligibleVehicleTypes: ['electric']
      },
      isActive: true
    }
  ];

  for (const productData of products) {
    await prisma.product.create({
      data: productData
    });
  }

  console.log('Database seeded successfully');
}

// Run seeding if this file is executed directly
if (require.main === module) {
  // seedDatabase().then(() => process.exit(0)).catch(console.error);
}