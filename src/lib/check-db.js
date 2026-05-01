const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = "postgresql://postgres:123456789@localhost:5432/medicalgeria?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pharmacies = await prisma.pharmacy.findMany({
    select: { id: true, name: true, userId: true }
  });
  console.log('Pharmacies:', JSON.stringify(pharmacies, null, 2));

  const orders = await prisma.order.findMany({
    take: 5,
    select: { id: true, pharmacyId: true, status: true, patientId: true }
  });
  console.log('Recent Orders:', JSON.stringify(orders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
