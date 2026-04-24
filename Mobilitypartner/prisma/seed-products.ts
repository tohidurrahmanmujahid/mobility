import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  try {
    // Create warranty products with different rules
    const products = [
      {
        name: 'Bronze 12 månader',
        durationMonths: 12,
        description: 'Grundläggande garantiskydd i 12 månader',
        rules: {
          maxVehicleAge: 10,
          maxMileage: 150000,
          eligibleMakes: [],
          eligibleFuelTypes: []
        },
        isActive: true
      },
      {
        name: 'Silver 24 månader',
        durationMonths: 24,
        description: 'Utökat garantiskydd i 24 månader med fler komponenter',
        rules: {
          maxVehicleAge: 8,
          maxMileage: 120000,
          eligibleMakes: [],
          eligibleFuelTypes: []
        },
        isActive: true
      },
      {
        name: 'Gold 36 månader',
        durationMonths: 36,
        description: 'Premium garantiskydd i 36 månader',
        rules: {
          maxVehicleAge: 5,
          maxMileage: 80000,
          eligibleMakes: [],
          eligibleFuelTypes: []
        },
        isActive: true
      },
      {
        name: 'Platina 36 månader',
        durationMonths: 36,
        description: 'Exklusivt garantiskydd med högsta täckning',
        rules: {
          maxVehicleAge: 3,
          maxMileage: 50000,
          eligibleMakes: ['Volvo', 'BMW', 'Mercedes-Benz', 'Audi'],
          eligibleFuelTypes: []
        },
        isActive: true
      },
      {
        name: 'Electric 24 månader',
        durationMonths: 24,
        description: 'Specialgaranti för elfordon',
        rules: {
          maxVehicleAge: 8,
          maxMileage: 100000,
          eligibleMakes: [],
          eligibleFuelTypes: ['Electric', 'Hybrid']
        },
        isActive: true
      },
      {
        name: 'Sport 12 månader',
        durationMonths: 12,
        description: 'Garanti för sportbilar och högpresterande fordon',
        rules: {
          maxVehicleAge: 6,
          maxMileage: 60000,
          eligibleMakes: ['BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Ferrari', 'Lamborghini'],
          eligibleFuelTypes: []
        },
        isActive: true
      }
    ];

    console.log('Creating warranty products...');

    // Clear existing products first
    await prisma.product.deleteMany({});

    for (const product of products) {
      const created = await prisma.product.create({
        data: product
      });

      console.log(`✅ Created product: ${created.name}`);
    }

    console.log('✅ Product seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

// seedProducts()
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });