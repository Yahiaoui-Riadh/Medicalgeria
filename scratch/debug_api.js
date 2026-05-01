const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const meds = await prisma.medicine.findMany({
      where: { name: { contains: 'XENID', mode: 'insensitive' } },
      select: {
        id: true, name: true, dci: true, dosage: true, form: true,
        laboratory: true, category: true, conditionnement: true,
        paysOrigine: true, isPrescriptionRequired: true, isPrinceps: true,
        isFrigo: true, isRemboursable: true, shp: true, ppa: true,
        codeCIP: true, description: true, remarque: true, designation2: true
      },
      take: 5
    });
    console.log('Success:', meds.length, 'found');
    console.log('Sample:', JSON.stringify(meds[0], null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
