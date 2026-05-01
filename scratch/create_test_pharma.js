const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "test_pharma@medicalgeria.dz";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        role: "PHARMACIST",
        phone: "0770123456",
        isVerified: true,
        pharmacy: {
          create: {
            name: "Pharmacie de Test",
            licenseNumber: "LIC-TEST-001",
            address: "123 Rue de Test, Alger",
            city: "Alger",
            wilaya: "16",
            geoLocation: { lat: 36.75, lng: 3.03 },
            openingHours: { monday: "08:00-19:00" }
          }
        }
      }
    });
    console.log("✅ Pharmacien de test créé:", email, "MDP: password123");
  } catch (err) {
    console.error("🔥 Erreur creation test user:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
