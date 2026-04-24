/**
 * Quick seed script to create the default admin user
 * Run with: npx ts-node src/scripts/create-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@mobilitypartner.se';
  const password = 'Admin@2024!';

  // Check if already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      isActive: true,
      isSuperAdmin: true,
    },
  });

  console.log('✅ Admin user created!');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   ID:       ${admin.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
