const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.medicine.count();
  console.log(`📊 Nombre total de médicaments dans la DB: ${count}`);
}

main().finally(() => { prisma.$disconnect(); pool.end(); });
