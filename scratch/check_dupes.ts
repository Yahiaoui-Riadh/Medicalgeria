import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function check() {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const count = await prisma.medicine.count();
  const distinctCount = await prisma.medicine.groupBy({
    by: ['codeCIP'],
    _count: { codeCIP: true }
  });

  console.log(`Total Medicines: ${count}`);
  console.log(`Distinct CodeCIPs: ${distinctCount.length}`);
  
  await prisma.$disconnect();
  await pool.end();
}
check();
