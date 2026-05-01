const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pharmacies = await prisma.pharmacy.findMany({
    select: { id: true, name: true, isVerified: true }
  });
  console.log("🏥 Pharmacies verification status:");
  console.table(pharmacies);

  const unverified = pharmacies.filter(p => !p.isVerified);
  if (unverified.length > 0) {
    console.log(`🛠️ Verifying ${unverified.length} pharmacies...`);
    await prisma.pharmacy.updateMany({
      where: { id: { in: unverified.map(p => p.id) } },
      data: { isVerified: true }
    });
    console.log("✅ All pharmacies are now verified.");
  }
}

main().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
